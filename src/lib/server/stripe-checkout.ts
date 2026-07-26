import type Stripe from "stripe";

import { CREDIT_PACK, PRICING_PLANS, getStripePriceId, type PricingPlanId } from "@/config/pricing";

type BuildCreditCheckoutSessionParamsInput = {
  appUrl: string;
  userId: string;
};

/**
 * One-time credit pack. Keeps the legacy "buy 30 credits, no subscription"
 * path so users can try the product without committing to a plan.
 */
export function buildCreditCheckoutSessionParams({
  appUrl,
  userId,
}: BuildCreditCheckoutSessionParamsInput): Stripe.Checkout.SessionCreateParams {
  return {
    cancel_url: `${appUrl}/billing`,
    line_items: [
      {
        price_data: {
          currency: CREDIT_PACK.currency,
          product_data: {
            description: "支持银行卡支付；支付宝 / 微信支付会在 Stripe 账户和地区可用时自动显示。",
            name: CREDIT_PACK.name,
          },
          unit_amount: CREDIT_PACK.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      credits: String(CREDIT_PACK.credits),
      kind: "credit_pack",
      userId,
    },
    mode: "payment",
    payment_method_options: {
      wechat_pay: {
        client: "web",
      },
    },
    payment_method_types: ["card", "alipay", "wechat_pay"],
    success_url: `${appUrl}/billing?checkout=success`,
  };
}

type BuildSubscriptionCheckoutSessionParamsInput = {
  appUrl: string;
  customerEmail?: string | null;
  plan: PricingPlanId;
  userId: string;
};

/**
 * Subscription checkout for the Pro / Team plans. Prefers the env-resolved
 * Stripe Price ID (so you can manage prices in the dashboard), but falls back
 * to inline `price_data` so dev environments work without manual setup.
 *
 * Sets `metadata.plan` and `metadata.kind=subscription` so the webhook can
 * route the event correctly.
 */
export function buildSubscriptionCheckoutSessionParams({
  appUrl,
  customerEmail,
  plan,
  userId,
}: BuildSubscriptionCheckoutSessionParamsInput): Stripe.Checkout.SessionCreateParams {
  const planCfg = PRICING_PLANS[plan];
  const priceId = getStripePriceId(plan);

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          product_data: {
            description: planCfg.features.join(" · "),
            name: `ProductShot.ai ${planCfg.name}`,
          },
          recurring: { interval: planCfg.interval ?? "month" },
          unit_amount: planCfg.interval === "year" ? (planCfg.annualPriceCents ?? planCfg.priceCents) : planCfg.priceCents,
        },
        quantity: 1,
      };

  return {
    cancel_url: `${appUrl}/billing`,
    customer_email: customerEmail ?? undefined,
    line_items: [lineItem],
    metadata: {
      kind: "subscription",
      plan,
      userId,
    },
    mode: "subscription",
    payment_method_types: ["card"],
    // After a successful subscription checkout, send the user to the
    // billing page so they see their new plan + refreshed credit balance.
    success_url: `${appUrl}/billing?subscription=success`,
  };
}
