import { CREDIT_PACK, GENERATION_COST, PRICING_PLANS, type PricingPlanId } from "@/config/pricing";

/**
 * Post-pivot billing helpers.
 *
 * The user can be on a subscription (Free / Pro / Team) or have bought a
 * legacy one-time pack. The summary surfaces both — what's their plan and
 * what does one pack / one month get them in terms of outputs.
 */

export function formatUsdFromCents(cents: number) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export type ProductSceneSummary = {
  whiteBgOutputs: number;
  lifestyleOutputs: number;
  festivalOutputs: number;
  modelWearingOutputs: number;
  detailPageOutputs: number;
  price: string;
};

export function getCreditPackSummary(): ProductSceneSummary {
  return {
    whiteBgOutputs: Math.floor(CREDIT_PACK.credits / GENERATION_COST["white-bg"]),
    lifestyleOutputs: Math.floor(CREDIT_PACK.credits / GENERATION_COST.lifestyle),
    festivalOutputs: Math.floor(CREDIT_PACK.credits / GENERATION_COST.festival),
    modelWearingOutputs: Math.floor(CREDIT_PACK.credits / GENERATION_COST["model-wearing"]),
    detailPageOutputs: Math.floor(CREDIT_PACK.credits / GENERATION_COST["detail-page"]),
    price: formatUsdFromCents(CREDIT_PACK.priceCents),
  };
}

export type PlanSummary = {
  id: PricingPlanId;
  name: string;
  badge: string;
  monthlyCredits: number;
  priceLabel: string;
  features: readonly string[];
};

/**
 * Summarise a single plan for the pricing table. Pulled from PRICING_PLANS
 * so the marketing copy and the Stripe checkout stay in lockstep.
 */
export function getPlanSummary(plan: PricingPlanId): PlanSummary {
  const cfg = PRICING_PLANS[plan];
  const priceLabel =
    plan === "team"
      ? `${formatUsdFromCents("annualPriceCents" in cfg ? (cfg.annualPriceCents ?? cfg.priceCents) : cfg.priceCents)} / year`
      : plan === "free"
        ? "Free / month"
        : `${formatUsdFromCents(cfg.priceCents)} / month`;

  return {
    badge: cfg.badge,
    features: cfg.features,
    id: plan,
    monthlyCredits: cfg.monthlyCredits,
    name: cfg.name,
    priceLabel,
  };
}

export function getAllPlanSummaries(): PlanSummary[] {
  return (Object.keys(PRICING_PLANS) as PricingPlanId[]).map(getPlanSummary);
}

// Backwards-compatible re-export (no-op) kept for any test that imports
// GENERATION_COST from this module. Safe to remove once all callers point
// directly at @/config/pricing.
