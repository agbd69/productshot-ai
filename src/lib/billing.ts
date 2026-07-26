import {
  CREDIT_PACK_LIST,
  GENERATION_COST,
  type CreditPack,
  type CreditPackId,
  type PricingPlanId,
} from "@/config/pricing";

/**
 * Pure credit-based billing helpers (2026-07-26).
 *
 * No subscription. Users have:
 *   - A credit balance (integer)
 *   - A quality tier (standard / pro / business / agency)
 *
 * They buy one of 4 credit packs. Credits never expire; tier only goes up.
 */

/**
 * Format a price given in USD cents as a "$X.XX" string, or "Free" for 0.
 */
export function formatUsdFromCents(cents: number) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * For a given pack, how many images of each scene can it produce?
 * Useful for the pricing table "X 张白底 / Y 张模特" copy.
 */
export type PackCapacity = {
  id: CreditPackId;
  name: string;
  badge: string;
  totalCredits: number;
  bonusCredits: number;
  price: string;
  perCredit: string;
  qualityTier: CreditPack["qualityTier"];
  outputSize: number;
  features: readonly string[];
  whiteBgOutputs: number;
  lifestyleOutputs: number;
  festivalOutputs: number;
  modelWearingOutputs: number;
  detailPageOutputs: number;
};

export function getPackCapacity(pack: CreditPack): PackCapacity {
  const total = pack.credits + pack.bonusCredits;
  return {
    badge: pack.badge,
    detailPageOutputs: Math.floor(total / GENERATION_COST["detail-page"]),
    features: pack.features,
    festivalOutputs: Math.floor(total / GENERATION_COST.festival),
    id: pack.id,
    lifestyleOutputs: Math.floor(total / GENERATION_COST.lifestyle),
    modelWearingOutputs: Math.floor(total / GENERATION_COST["model-wearing"]),
    name: pack.name,
    outputSize: pack.outputSize,
    perCredit: formatUsdFromCents(pack.priceCents) + " / " + total + " credits",
    price: formatUsdFromCents(pack.priceCents),
    totalCredits: total,
    bonusCredits: pack.bonusCredits,
    qualityTier: pack.qualityTier,
    whiteBgOutputs: Math.floor(total / GENERATION_COST["white-bg"]),
  };
}

export function getAllPackCapacities(): PackCapacity[] {
  return CREDIT_PACK_LIST.map(getPackCapacity);
}

/**
 * Legacy type kept for any callers that haven't migrated yet. The new
 * pricing page should use `getAllPackCapacities` instead.
 */
export type PlanSummary = {
  id: PricingPlanId;
  name: string;
  badge: string;
  monthlyCredits: number;
  priceLabel: string;
  features: readonly string[];
};

/**
 * Legacy plan summary — returns the single "free" entry. Kept so any
 * imports from the old pricing page don't immediately break during the
 * migration. Safe to remove once the billing UI is fully rewritten.
 */
export function getAllPlanSummaries(): PlanSummary[] {
  return [
    {
      badge: "注册即得",
      features: ["30 credits 一次性体验", "全部 5 个商品图场景", "标准 1024×1024 输出"],
      id: "free",
      monthlyCredits: 30,
      name: "Free",
      priceLabel: "Free",
    },
  ];
}

// Re-export so existing test imports keep working.
export { GENERATION_COST };
