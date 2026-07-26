/**
 * Post-pivot pricing (2026-07-26, v2: pure credit packs).
 *
 * Pure credit-based model, no monthly subscription. One-time packs only.
 *   - Free: 30 credits at signup (one-time, no refill)
 *   - 4 paid packs: $30 / $99 / $199 / $399 with tiered output quality
 *     (1024 / 2048 / 4K) and bonus credits for larger packs
 *
 * Quality tier (which pack they own) controls max output size:
 *   - standard: 1024×1024 (free + $30 pack)
 *   - pro:      2048×2048 ($99 pack)
 *   - business: 4K          ($199 pack)
 *   - agency:   4K + API    ($399 pack)
 *
 * Why no subscription:
 *   - 商家是项目制采购（圣诞/黑五前一次性 200-500 张），月卡错配需求节奏
 *   - 积分包天然防拼车（额度用完即停），月卡风险高
 *   - $30 起步的最低充值门槛挡住 95% 拼车行为
 *
 * The Stripe Price IDs are read from env (set in the Stripe dashboard). When
 * unset, the checkout flow falls back to inline `price_data` so the dev
 * environment still works without manual Stripe product setup.
 */

export type QualityTier = "standard" | "pro" | "business" | "agency";

/**
 * Numeric rank for tier comparisons (max(currentTier, newPack.tier)).
 */
export const QUALITY_TIER_RANK: Record<QualityTier, number> = {
  standard: 1,
  pro: 2,
  business: 3,
  agency: 4,
};

/**
 * Free tier — one-time signup grant, no subscription, no monthly refill.
 * Stays in PRICING_PLANS so the existing `users.plan` field keeps working
 * with the "free" value.
 */
export const PRICING_PLANS = {
  free: {
    name: "Free",
    signupCredits: 30,
    qualityTier: "standard" as QualityTier,
    priceCents: 0,
    badge: "注册即得",
    description: "体验所有 5 个商品图场景，标准 1024×1024 输出。",
  },
} as const;

export type PricingPlanId = keyof typeof PRICING_PLANS;

/**
 * Legacy export kept for back-compat with code paths we haven't fully
 * removed yet. Empty array means "no subscription plans are sold anymore".
 */
export const SUBSCRIBABLE_PLANS: PricingPlanId[] = [];

/**
 * 4 paid credit packs. The user buys one (or more) and credits never expire.
 * Each pack grants a `qualityTier` — the highest tier the user has bought
 * determines the max output size for their generations.
 */
export const CREDIT_PACKS = {
  starter: {
    id: "starter" as const,
    name: "Starter",
    description: "适合刚开店、SKU 少的中小卖家。",
    credits: 300,
    bonusCredits: 0,
    priceCents: 3000,
    qualityTier: "standard" as QualityTier,
    outputSize: 1024,
    badge: "起步装",
    stripePriceIdEnv: "STRIPE_STARTER_PRICE_ID",
    features: [
      "300 credits（约 75 张白底主图）",
      "永不过期",
      "标准 1024×1024 输出",
      "全部 5 个商品图场景",
      "Web app 全部功能",
    ],
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    description: "主力 SKU，中小商家的标准选择。",
    credits: 1500,
    bonusCredits: 50,
    priceCents: 9900,
    qualityTier: "pro" as QualityTier,
    outputSize: 2048,
    badge: "最受欢迎",
    stripePriceIdEnv: "STRIPE_PRO_PACK_PRICE_ID",
    features: [
      "1550 credits（1500 + 50 赠送，约 380 张白底图）",
      "永不过期",
      "HD 2048×2048 输出",
      "全部 5 个商品图场景",
      "Amazon / Shopify 平台合规尺寸",
    ],
  },
  business: {
    id: "business" as const,
    name: "Business",
    description: "中型商家、节日大促前一次性储备。",
    credits: 3500,
    bonusCredits: 100,
    priceCents: 19900,
    qualityTier: "business" as QualityTier,
    outputSize: 4096,
    badge: "团队装",
    stripePriceIdEnv: "STRIPE_BUSINESS_PRICE_ID",
    features: [
      "3600 credits（3500 + 100 赠送，约 900 张白底图）",
      "永不过期",
      "4K 超清输出",
      "优先生成队列",
      "Email 客服（24h 响应）",
      "Cross-platform 导出 (Amazon / Shopify / TikTok / Temu)",
    ],
  },
  agency: {
    id: "agency" as const,
    name: "Agency",
    description: "代运营 / 代理 / 大客户。一次到位，单张成本最低。",
    credits: 8000,
    bonusCredits: 200,
    priceCents: 39900,
    qualityTier: "agency" as QualityTier,
    outputSize: 4096,
    badge: "代理商",
    stripePriceIdEnv: "STRIPE_AGENCY_PRICE_ID",
    features: [
      "8200 credits（8000 + 200 赠送，约 2000 张白底图）",
      "永不过期",
      "4K 超清 + API 接入",
      "最高优先级生成队列",
      "专属客服（4h 响应）",
      "团队多账号支持",
    ],
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export type CreditPack = (typeof CREDIT_PACKS)[CreditPackId];

export const CREDIT_PACK_LIST: CreditPack[] = (
  Object.keys(CREDIT_PACKS) as CreditPackId[]
).map((id) => CREDIT_PACKS[id]);

/**
 * Return the credit pack for an id, or null if the id is not a known pack.
 */
export function getCreditPack(id: string): CreditPack | null {
  if (id in CREDIT_PACKS) {
    return CREDIT_PACKS[id as CreditPackId];
  }
  return null;
}

/**
 * Return the higher of two quality tiers (used when a user buys a pack:
 * their tier becomes max(current, pack.tier)).
 */
export function maxQualityTier(a: QualityTier, b: QualityTier): QualityTier {
  return QUALITY_TIER_RANK[a] >= QUALITY_TIER_RANK[b] ? a : b;
}

/**
 * Per-image credit cost. White-bg is cheap; lifestyle / model-wearing /
 * detail-page cost more because they require more generation work.
 */
export const GENERATION_COST = {
  "white-bg": 4,
  festival: 6,
  lifestyle: 8,
  "detail-page": 10,
  "model-wearing": 12,
} as const;

/**
 * Resolve the Stripe price id for a credit pack. If the env is not set,
 * return `null` and the caller should fall back to inline `price_data`.
 */
export function getStripePriceIdForPack(id: CreditPackId): string | null {
  const cfg = CREDIT_PACKS[id];
  return process.env[cfg.stripePriceIdEnv] ?? null;
}
