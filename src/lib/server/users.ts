import type { User } from "@clerk/nextjs/server";

import { PRICING_PLANS, type PricingPlanId } from "@/config/pricing";
import { getSupabaseAdmin } from "@/lib/server/supabase";

export type AppUser = {
  clerk_user_id: string;
  credits: number;
  email: string | null;
  id: string;
  plan: PricingPlanId;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

/**
 * First sign-in: create a row with the Free plan and grant 30 credits.
 * Returns the user (existing or freshly created).
 */
export async function ensureAppUser(clerkUser: User): Promise<AppUser> {
  const supabase = getSupabaseAdmin();
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select("id, clerk_user_id, email, plan, credits, current_period_end, stripe_customer_id")
    .eq("clerk_user_id", clerkUser.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as AppUser;

  // First-time signup. The Free plan grants 30 credits immediately.
  const { data, error } = await supabase
    .from("users")
    .insert({
      clerk_user_id: clerkUser.id,
      credits: PRICING_PLANS.free.monthlyCredits,
      current_period_end: nextMonthlyResetIso(),
      email,
      plan: "free",
    })
    .select("id, clerk_user_id, email, plan, credits, current_period_end, stripe_customer_id")
    .single();

  if (error) throw error;
  return data as AppUser;
}

export async function addCredits(userId: string, credits: number) {
  const supabase = getSupabaseAdmin();
  const { data: user, error: readError } = await supabase.from("users").select("credits").eq("id", userId).single();
  if (readError) throw readError;

  const { error } = await supabase
    .from("users")
    .update({
      credits: Number(user.credits) + credits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

/**
 * Refill the user's monthly credit allowance if their current billing period
 * has ended. Called lazily on every generation so we don't need a separate
 * cron job. Safe to call multiple times per period — it's a no-op when
 * current_period_end is still in the future.
 *
 * Returns the post-refill credit balance.
 */
export async function refillCreditsIfNeeded(userId: string, now = new Date()): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: user, error: readError } = await supabase
    .from("users")
    .select("plan, credits, current_period_end")
    .eq("id", userId)
    .single();

  if (readError) throw readError;

  const plan = (user.plan ?? "free") as PricingPlanId;
  const allowance = PRICING_PLANS[plan].monthlyCredits;
  const periodEnd = user.current_period_end ? new Date(user.current_period_end) : null;

  // No period scheduled (e.g. one-time pack users): only refill if plan is free
  // and credits have been exhausted for a while.
  if (!periodEnd) {
    if (plan === "free" && Number(user.credits) <= 0) {
      const nextEnd = nextMonthlyResetIso(now);
      await supabase
        .from("users")
        .update({
          credits: allowance,
          current_period_end: nextEnd,
          updated_at: now.toISOString(),
        })
        .eq("id", userId);
      return allowance;
    }
    return Number(user.credits);
  }

  // Period not yet ended: do nothing.
  if (periodEnd.getTime() > now.getTime()) {
    return Number(user.credits);
  }

  // Period ended: refill to the plan's allowance and roll the period end.
  const nextEnd = nextEndFor(plan, now);
  const { error } = await supabase
    .from("users")
    .update({
      credits: allowance,
      current_period_end: nextEnd,
      updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
  return allowance;
}

export async function spendCredits(userId: string, credits: number) {
  // Always try to refill first; if the period has rolled over the user
  // gets a fresh balance before we deduct.
  await refillCreditsIfNeeded(userId);

  const supabase = getSupabaseAdmin();
  const { data: user, error: readError } = await supabase.from("users").select("credits").eq("id", userId).single();
  if (readError) throw readError;

  if (Number(user.credits) < credits) {
    throw new Error("额度不足，请升级 Pro / Team 或购买 credits 包后继续。");
  }

  const { error } = await supabase
    .from("users")
    .update({
      credits: Number(user.credits) - credits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function setUserPlan(
  userId: string,
  plan: PricingPlanId,
  options: { currentPeriodEnd?: Date | null; stripeCustomerId?: string | null } = {},
) {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {
    plan,
    updated_at: new Date().toISOString(),
  };
  if (options.currentPeriodEnd !== undefined) {
    update.current_period_end = options.currentPeriodEnd ? options.currentPeriodEnd.toISOString() : null;
  }
  if (options.stripeCustomerId !== undefined) {
    update.stripe_customer_id = options.stripeCustomerId;
  }
  const { error } = await supabase.from("users").update(update).eq("id", userId);
  if (error) throw error;
}

/**
 * Return the next "monthly reset" timestamp — 30 days from `now`, at 00:00 UTC.
 * Used for Free-tier users to schedule their next free refill.
 */
export function nextMonthlyResetIso(now = new Date()): string {
  const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function nextEndFor(plan: PricingPlanId, now: Date): string {
  // Pro rolls monthly, Team rolls yearly. Either way we just push the
  // timestamp by the interval length and normalize to UTC midnight.
  const intervalDays = plan === "team" ? 365 : 30;
  const d = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
