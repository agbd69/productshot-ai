import type Stripe from "stripe";

import type { PricingPlanId } from "@/config/pricing";
import { getSupabaseAdmin } from "@/lib/server/supabase";

/**
 * Legacy subscription plan values. The Pro/Team monthly + yearly plans
 * were removed from the public pricing on 2026-07-26, but the DB and
 * webhook handlers still accept them for any in-flight subscriptions.
 */
export type LegacySubscriptionPlan = "pro" | "team";

export type AppSubscriptionPlan = PricingPlanId | LegacySubscriptionPlan;

export type AppSubscription = {
  cancel_at_period_end: boolean;
  created_at: string;
  current_period_end: string;
  id: string;
  plan: AppSubscriptionPlan;
  status: Stripe.Subscription.Status;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  updated_at: string;
  user_id: string;
};

/**
 * Upsert a subscription record from a Stripe Subscription object.
 * Idempotent: safe to call from any webhook event handler.
 */
export async function upsertSubscriptionFromStripe(
  userId: string,
  subscription: Stripe.Subscription,
  plan: AppSubscriptionPlan,
) {
  const supabase = getSupabaseAdmin();
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  // Stripe API version: `current_period_end` was moved from `Subscription` to
  // `SubscriptionItem` in API version 2024-12-18. Read it from the first item.
  const firstItem = subscription.items?.data?.[0];
  const periodEndUnix: number =
    (firstItem as unknown as { current_period_end?: number } | undefined)?.current_period_end ??
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
  const periodEnd = new Date(periodEndUnix * 1000).toISOString();

  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_end: periodEnd,
        plan,
        status: subscription.status,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        updated_at: new Date().toISOString(),
        user_id: userId,
      },
      { onConflict: "stripe_subscription_id" },
    );

  if (error) throw error;
  return { customerId, periodEnd };
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data as AppSubscription | null;
}

export async function findUserIdByCustomerId(stripeCustomerId: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}
