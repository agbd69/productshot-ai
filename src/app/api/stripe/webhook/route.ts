import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  CREDIT_PACKS,
  getCreditPack,
  type CreditPackId,
  type QualityTier,
} from "@/config/pricing";
import { requireEnv } from "@/lib/server/env";
import { getStripe } from "@/lib/server/stripe";
import {
  findUserIdByCustomerId,
  getSubscriptionByStripeId,
  upsertSubscriptionFromStripe,
} from "@/lib/server/subscriptions";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { addCredits, applyCreditPackPurchase, setUserPlan } from "@/lib/server/users";

/**
 * POST /api/stripe/webhook
 *
 * Handles two flavours of event:
 *   1. checkout.session.completed (mode=payment, kind=credit_pack)
 *      → resolve the pack from metadata, grant credits, bump quality_tier
 *   2. Legacy subscription events (customer.subscription.*, invoice.payment_succeeded)
 *      → kept for any in-flight Pro/Team subscriptions from before the
 *      pivot; new subscriptions are not sold anymore.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, requireEnv("STRIPE_WEBHOOK_SECRET"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleLegacySubscriptionUpsert(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleLegacySubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleLegacyInvoicePaid(event.data.object);
        break;
      default:
        // Ignored event type — Stripe sends a lot, we only care about these.
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Legacy subscription checkouts — skip; the subscription.* events handle
  // those. New checkouts are all `mode=payment` credit packs.
  if (session.metadata?.kind === "subscription" || session.mode === "subscription") {
    return;
  }

  // Idempotency: skip if we already recorded this session.
  if (!session.id) return;
  const supabase = getSupabaseAdmin();
  const { data: existing, error: readError } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (readError) {
    throw new Error(`payments read: ${readError.message}`);
  }
  if (existing) return;

  // Resolve the pack from metadata. If packId is missing (e.g. legacy
  // $9.90 pack), fall back to the starter pack.
  const packId = (session.metadata?.packId ?? "starter") as CreditPackId;
  const pack = getCreditPack(packId) ?? CREDIT_PACKS.starter;

  const { error: insertError } = await supabase.from("payments").insert({
    amount: pack.priceCents,
    status: "completed",
    stripe_session_id: session.id,
    user_id: userId,
  });

  if (insertError) {
    throw new Error(`payments insert: ${insertError.message}`);
  }

  await applyCreditPackPurchase(userId, {
    bonusCredits: pack.bonusCredits,
    credits: pack.credits,
    qualityTier: pack.qualityTier as QualityTier,
  });
}

// ============================================================================
// Legacy subscription handlers — kept for any in-flight Pro/Team subs from
// before the pivot. Once those lapse and the subscriptions table is empty,
// these can be removed.
// ============================================================================

async function handleLegacySubscriptionUpsert(subscription: Stripe.Subscription) {
  const planMeta = await resolvePlanFromSubscription(subscription);
  if (!planMeta) return;

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let userId = planMeta.userId;

  if (!userId) {
    userId = await findUserIdByCustomerId(customerId);
    if (!userId) return;
  }

  const { periodEnd } = await upsertSubscriptionFromStripe(userId, subscription, planMeta.plan);

  // For legacy Pro/Team, mirror the plan into quality_tier so the new
  // image-provider routing picks up the right output size.
  const tierFromPlan = planMeta.plan === "team" ? "agency" : planMeta.plan === "pro" ? "pro" : "standard";
  const activeStatuses: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];
  const isActive = activeStatuses.includes(subscription.status);

  await setUserPlan(userId, isActive ? planMeta.plan : "free", {
    currentPeriodEnd: isActive ? new Date(periodEnd) : null,
    stripeCustomerId: customerId,
  });

  if (isActive) {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("users")
      .update({ quality_tier: tierFromPlan, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }
}

async function handleLegacySubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await getSubscriptionByStripeId(subscription.id);
  if (!existing) return;
  await setUserPlan(existing.user_id, "free", {
    currentPeriodEnd: null,
  });
  // Don't downgrade quality_tier — once earned, it stays.
}

async function handleLegacyInvoicePaid(invoice: Stripe.Invoice) {
  // Skip one-time pack invoices (handled in handleCheckoutCompleted).
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (!parentSubscription) return;
  const subscriptionId = typeof parentSubscription === "string" ? parentSubscription : parentSubscription.id;

  const existing = await getSubscriptionByStripeId(subscriptionId);
  if (!existing) return;
  if (existing.status === "canceled") return;

  // Legacy: refill 200 credits for Pro, 2000 for Team. Kept for back-compat.
  const allowance = existing.plan === "team" ? 2000 : existing.plan === "pro" ? 200 : 0;
  if (allowance > 0) {
    await addCredits(existing.user_id, allowance);
  }
  await setUserPlan(existing.user_id, existing.plan as "pro" | "team", {
    currentPeriodEnd: new Date(existing.current_period_end),
  });
}

async function resolvePlanFromSubscription(
  subscription: Stripe.Subscription,
): Promise<{ plan: "pro" | "team"; userId: string | null } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySub = subscription as any;
  const meta = anySub.metadata as Record<string, string | undefined> | undefined;
  if (meta?.plan === "pro" || meta?.plan === "team") {
    return { plan: meta.plan, userId: meta.userId ?? null };
  }

  const checkoutSessionId: string | undefined = anySub.checkout_session_id ?? anySub.latest_invoice?.checkout_session?.id;
  if (!checkoutSessionId) return null;

  const stripe = getStripe();
  try {
    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    const plan = session.metadata?.plan;
    if (plan !== "pro" && plan !== "team") return null;
    return { plan, userId: session.metadata?.userId ?? null };
  } catch {
    return null;
  }
}
