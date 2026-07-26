import type { User } from "@clerk/nextjs/server";

import { PRICING_PLANS, type QualityTier, maxQualityTier } from "@/config/pricing";
import { getSupabaseAdmin } from "@/lib/server/supabase";

export type AppUser = {
  clerk_user_id: string;
  credits: number;
  email: string | null;
  id: string;
  plan: "free"; // legacy field; new code reads `quality_tier`
  quality_tier: QualityTier;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

/**
 * Columns selected for AppUser. Kept as a constant so list-shape and
 * single-row-shape can't drift.
 */
const APP_USER_COLUMNS =
  "id, clerk_user_id, email, plan, quality_tier, credits, current_period_end, stripe_customer_id";

/**
 * First sign-in: create a row with the Free tier and grant 30 credits.
 * Returns the user (existing or freshly created).
 */
export async function ensureAppUser(clerkUser: User): Promise<AppUser> {
  const supabase = getSupabaseAdmin();
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? null;

  const { data: existing, error: selectError } = await supabase
    .from("users")
    .select(APP_USER_COLUMNS)
    .eq("clerk_user_id", clerkUser.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as AppUser;

  // First-time signup. The Free tier grants 30 credits once (no monthly
  // refill — pure credit model, no subscription).
  const { data, error } = await supabase
    .from("users")
    .insert({
      clerk_user_id: clerkUser.id,
      credits: PRICING_PLANS.free.signupCredits,
      email,
      plan: "free",
      quality_tier: "standard",
    })
    .select(APP_USER_COLUMNS)
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
 * Apply a credit pack purchase: add the (credits + bonusCredits) to the
 * user's balance and bump their quality_tier to the higher of the current
 * tier and the pack's tier. Credits never expire; tier only goes up.
 */
export async function applyCreditPackPurchase(
  userId: string,
  pack: { credits: number; bonusCredits: number; qualityTier: QualityTier },
) {
  const supabase = getSupabaseAdmin();
  const { data: user, error: readError } = await supabase
    .from("users")
    .select("credits, quality_tier")
    .eq("id", userId)
    .single();
  if (readError) throw readError;

  const totalCredits = pack.credits + pack.bonusCredits;
  const newTier = maxQualityTier(
    (user.quality_tier as QualityTier | null) ?? "standard",
    pack.qualityTier,
  );

  const { error } = await supabase
    .from("users")
    .update({
      credits: Number(user.credits) + totalCredits,
      quality_tier: newTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) throw error;

  return { newCredits: Number(user.credits) + totalCredits, newTier };
}

/**
 * No-op stub kept for back-compat with the old monthly-subscription model.
 * Pure credit model: credits are added at purchase time and never refilled.
 * Safe to remove once all callers are updated.
 */
export async function refillCreditsIfNeeded(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return Number(user.credits);
}

export async function spendCredits(userId: string, credits: number) {
  const supabase = getSupabaseAdmin();
  const { data: user, error: readError } = await supabase.from("users").select("credits").eq("id", userId).single();
  if (readError) throw readError;

  if (Number(user.credits) < credits) {
    throw new Error("额度不足，请购买 credits 包后继续。");
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

/**
 * Update the user's plan + customer id. Kept for back-compat with the
 * legacy subscription webhook handlers; the new credit-pack path uses
 * `applyCreditPackPurchase` instead.
 */
export async function setUserPlan(
  userId: string,
  plan: "free" | "pro" | "team",
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
 * Unused by the new credit-only flow but kept for legacy callers/tests.
 */
export function nextMonthlyResetIso(now = new Date()): string {
  const d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Unused by the new credit-only flow. Subscription code paths that
 * referenced this are kept in webhook.ts for legacy events but the
 * function is no longer called.
 */
export function _legacyNextEndFor(_plan: "free" | "pro" | "team", _now: Date): string {
  return nextMonthlyResetIso(_now);
}
