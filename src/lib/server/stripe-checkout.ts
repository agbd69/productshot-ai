import type Stripe from "stripe";

import {
  CREDIT_PACKS,
  getStripePriceIdForPack,
  type CreditPackId,
} from "@/config/pricing";

type BuildCreditPackCheckoutSessionParamsInput = {
  appUrl: string;
  packId: CreditPackId;
  userId: string;
};

/**
 * Build the Stripe Checkout Session params for buying a one-time credit pack.
 * Resolves a Stripe Price ID from env (so you can manage prices in the
 * dashboard) and falls back to inline `price_data` so dev environments
 * work without manual Stripe product setup.
 *
 * Sets `metadata.kind=credit_pack` and `metadata.packId` so the webhook
 * can route the event to the right pack and grant the right credits +
 * bump the user's quality tier.
 */
export function buildCreditPackCheckoutSessionParams({
  appUrl,
  packId,
  userId,
}: BuildCreditPackCheckoutSessionParamsInput): Stripe.Checkout.SessionCreateParams {
  const pack = CREDIT_PACKS[packId];
  const priceId = getStripePriceIdForPack(packId);

  const totalCredits = pack.credits + pack.bonusCredits;

  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          product_data: {
            description: pack.features.join(" · "),
            name: `ProductShot.ai ${pack.name} Pack`,
          },
          unit_amount: pack.priceCents,
        },
        quantity: 1,
      };

  return {
    cancel_url: `${appUrl}/billing`,
    line_items: [lineItem],
    metadata: {
      credits: String(totalCredits),
      kind: "credit_pack",
      packId,
      userId,
    },
    mode: "payment",
    payment_method_options: {
      wechat_pay: {
        client: "web",
      },
    },
    payment_method_types: ["card", "alipay", "wechat_pay"],
    success_url: `${appUrl}/billing?checkout=success&pack=${packId}`,
  };
}
