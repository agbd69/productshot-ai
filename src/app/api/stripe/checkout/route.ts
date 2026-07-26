import { NextResponse } from "next/server";

import { SUBSCRIBABLE_PLANS, type PricingPlanId } from "@/config/pricing";
import { getErrorStatus } from "@/lib/server/api-errors";
import { getAuthenticatedAppUser } from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";
import { getStripe } from "@/lib/server/stripe";
import {
  buildCreditCheckoutSessionParams,
  buildSubscriptionCheckoutSessionParams,
} from "@/lib/server/stripe-checkout";

type CheckoutRequestBody = {
  plan?: PricingPlanId;
};

/**
 * POST /api/stripe/checkout
 *
 * Body: { plan?: "pro" | "team" } — when set, creates a subscription
 * checkout session; when omitted, creates a one-time credit pack checkout.
 */
export async function POST(request: Request) {
  try {
    const appUser = await getAuthenticatedAppUser();
    const stripe = getStripe();
    const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");

    let body: CheckoutRequestBody = {};
    try {
      body = (await request.json()) as CheckoutRequestBody;
    } catch {
      // Empty body is fine — defaults to one-time credit pack.
      body = {};
    }

    const plan = body.plan;

    if (plan) {
      if (!SUBSCRIBABLE_PLANS.includes(plan)) {
        return NextResponse.json(
          { errors: [`Unsupported plan: ${plan}. Choose 'pro' or 'team'.`] },
          { status: 400 },
        );
      }

      const session = await stripe.checkout.sessions.create(
        buildSubscriptionCheckoutSessionParams({
          appUrl,
          customerEmail: appUser.email,
          plan,
          userId: appUser.id,
        }),
      );
      return NextResponse.json({ url: session.url });
    }

    const session = await stripe.checkout.sessions.create(
      buildCreditCheckoutSessionParams({
        appUrl,
        userId: appUser.id,
      }),
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法创建支付订单。";
    return NextResponse.json({ errors: [message] }, { status: getErrorStatus(message) });
  }
}
