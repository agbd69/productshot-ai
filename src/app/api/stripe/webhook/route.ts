import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { CREDIT_PACK, PRICING_PLANS, type PricingPlanId } from "@/config/pricing";
import { requireEnv } from "@/lib/server/env";
import { getStripe } from "@/lib/server/stripe";
import {
  findUserIdByCustomerId,
  getSubscriptionByStripeId,
  upsertSubscriptionFromStripe,
} from "@/lib/server/subscriptions";
import { getSupabaseAdmin } from "@/lib/server/supabase";
import { addCredits, setUserPlan } from "@/lib/server/users";

/**
 * POST /api/stripe/webhook
 *
 * Handles three flavours of event:
 *   1. checkout.session.completed (mode=payment) → one-time credit pack
 *   2. customer.subscription.created / .updated → upsert subscription, set plan
 *   3. invoice.payment_succeeded → monthly credit refill on the user's plan
 *   4. customer.subscription.deleted → downgrade user back to free
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
        await handleSubscriptionUpsert(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaid(event.data.object);
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

  // Subscription checkouts are handled by customer.subscription.* events;
  // we only deal with one-time credit packs here.
  if (session.metadata?.kind === "subscription" || session.mode === "subscription") {
    return;
  }

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

  const { error: insertError } = await supabase.from("payments").insert({
    amount: CREDIT_PACK.priceCents,
    status: "completed",
    stripe_session_id: session.id,
    user_id: userId,
  });

  if (insertError) {
    throw new Error(`payments insert: ${insertError.message}`);
  }

  await addCredits(userId, CREDIT_PACK.credits);
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const planMeta = await resolvePlanFromSubscription(subscription);
  if (!planMeta) return;

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let userId = planMeta.userId;

  if (!userId) {
    userId = await findUserIdByCustomerId(customerId);
    if (!userId) {
      // Subscription was created via a flow that didn't bind a user (e.g.
      // Stripe dashboard test). Skip — admin can repair manually.
      return;
    }
  }

  const { periodEnd } = await upsertSubscriptionFromStripe(userId, subscription, planMeta.plan);

  // Sync the user row: plan + period end + customer id. Only flip the plan
  // when the subscription is actually usable.
  const activeStatuses: Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];
  const nextPlan: PricingPlanId = activeStatuses.includes(subscription.status) ? planMeta.plan : "free";

  await setUserPlan(userId, nextPlan, {
    currentPeriodEnd: nextPlan === "free" ? null : new Date(periodEnd),
    stripeCustomerId: customerId,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existing = await getSubscriptionByStripeId(subscription.id);
  if (!existing) return;
  await setUserPlan(existing.user_id, "free", {
    currentPeriodEnd: null,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Only refill on subscription invoices (one-time pack invoices are handled
  // in handleCheckoutCompleted).
  // Stripe v22 moved the subscription reference onto `parent.subscription_details`.
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (!parentSubscription) return;
  const subscriptionId = typeof parentSubscription === "string" ? parentSubscription : parentSubscription.id;

  const existing = await getSubscriptionByStripeId(subscriptionId);
  if (!existing) return;
  if (existing.status === "canceled") return;

  const allowance = PRICING_PLANS[existing.plan as PricingPlanId].monthlyCredits;
  // On the first paid invoice we set the plan and full allowance. On
  // renewals we top up to the allowance. `setUserPlan` here also rolls
  // the period end forward via the subscription record.
  await addCredits(existing.user_id, allowance);

  // Reflect the new period in the users table. The Stripe subscription
  // record is the source of truth, but we keep the user row in sync so
  // the lazy-refill check in spendCredits can work without a join.
  await setUserPlan(existing.user_id, existing.plan as PricingPlanId, {
    currentPeriodEnd: new Date(existing.current_period_end),
  });
}

/**
 * The plan id is written into Checkout Session metadata when the user
 * starts a subscription. We propagate it onto the Subscription object
 * by reading the parent session. As a fallback, infer from the
 * subscription's first price id (Pro / Team Stripe Price IDs in env).
 */
async function resolvePlanFromSubscription(
  subscription: Stripe.Subscription,
): Promise<{ plan: PricingPlanId; userId: string | null } | null> {
  // Best path: subscription has metadata.plan + metadata.userId (we set
  // these in buildSubscriptionCheckoutSessionParams via the Checkout
  // Session, but Stripe does not always propagate to the Subscription
  // object; depends on the API version and the Checkout configuration).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anySub = subscription as any;
  const meta = anySub.metadata as Record<string, string | undefined> | undefined;
  if (meta?.plan === "pro" || meta?.plan === "team") {
    return { plan: meta.plan, userId: meta.userId ?? null };
  }

  // Fallback: look up the parent Checkout Session to recover the metadata.
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
