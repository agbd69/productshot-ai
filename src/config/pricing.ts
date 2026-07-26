/**
 * Post-pivot pricing (2026-07-26).
 *
 * Three plans for overseas e-commerce merchants:
 *   - Free: 30 credits / month, no charge (sign-up bonus + monthly refill)
 *   - Pro:  $12.50 / month, 200 credits / month, HD + priority queue
 *   - Team: $588 / year, 2000 credits / month, dedicated support + team workspace
 *
 * Plus a legacy one-time starter pack for users who want to try before subscribing.
 *
 * The Stripe Price IDs are read from env (set in the Stripe dashboard). When
 * unset, the checkout flow falls back to inline `price_data` so the dev
 * environment still works without manual Stripe product setup.
 */
export const PRICING_PLANS = {
  free: {
    name: "Free",
    monthlyCredits: 30,
    priceCents: 0,
    interval: null,
    badge: "注册即得",
    features: [
      "30 credits / month, 自动续杯",
      "全部 5 个商品图场景",
      "Standard 分辨率",
      "Web app 全部功能",
    ],
  },
  pro: {
    name: "Pro",
    monthlyCredits: 200,
    priceCents: 1250,
    interval: "month" as const,
    stripePriceIdEnv: "STRIPE_PRO_PRICE_ID",
    badge: "最受欢迎",
    features: [
      "200 credits / month",
      "全部 5 个商品图场景",
      "HD 分辨率",
      "优先生成队列",
      "Email 客服（24h 响应）",
      "Cross-platform 导出 (Amazon / Shopify / TikTok / Temu)",
    ],
  },
  team: {
    name: "Team",
    monthlyCredits: 2000,
    priceCents: 4900,
    interval: "year" as const,
    annualPriceCents: 58800,
    stripePriceIdEnv: "STRIPE_TEAM_PRICE_ID",
    badge: "适合代运营 / 团队",
    features: [
      "2000 credits / month",
      "全部 5 个商品图场景",
      "HD 分辨率",
      "最高优先级生成队列",
      "团队工作区 (多人协作)",
      "专属客服（4h 响应）",
      "跨账号信用共享",
    ],
  },
} as const;

export type PricingPlanId = keyof typeof PRICING_PLANS;

export const SUBSCRIBABLE_PLANS: PricingPlanId[] = ["pro", "team"];

export const CREDIT_PACK = {
  credits: 30,
  currency: "usd",
  name: "Product Image Starter Pack",
  priceCents: 990,
  description: "One-time pack, no expiry. Try before subscribing.",
};

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
 * Resolve the Stripe price id for a plan. If the env is not set, return
 * `null` and the caller should fall back to inline `price_data`.
 */
export function getStripePriceId(plan: PricingPlanId): string | null {
  const cfg = PRICING_PLANS[plan];
  if (!("stripePriceIdEnv" in cfg) || !cfg.stripePriceIdEnv) return null;
  return process.env[cfg.stripePriceIdEnv] ?? null;
}
