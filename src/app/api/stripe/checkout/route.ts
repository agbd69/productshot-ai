import { NextResponse } from "next/server";

import { CREDIT_PACKS, type CreditPackId } from "@/config/pricing";
import { getErrorStatus } from "@/lib/server/api-errors";
import { getAuthenticatedAppUser } from "@/lib/server/auth";
import { requireEnv } from "@/lib/server/env";
import { getStripe } from "@/lib/server/stripe";
import { buildCreditPackCheckoutSessionParams } from "@/lib/server/stripe-checkout";

type CheckoutRequestBody = {
  packId?: CreditPackId;
};

function isCreditPackId(value: unknown): value is CreditPackId {
  return typeof value === "string" && value in CREDIT_PACKS;
}

/**
 * POST /api/stripe/checkout
 *
 * Body: { packId: "starter" | "pro" | "business" | "agency" }
 * Creates a one-time payment session for the chosen credit pack.
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
      // Empty body — default to the starter pack so the legacy
      // "buy credits" button still works.
      body = {};
    }

    const packId: CreditPackId = isCreditPackId(body.packId) ? body.packId : "starter";

    const session = await stripe.checkout.sessions.create(
      buildCreditPackCheckoutSessionParams({
        appUrl,
        packId,
        userId: appUser.id,
      }),
    );
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法创建支付订单。";
    return NextResponse.json({ errors: [message] }, { status: getErrorStatus(message) });
  }
}
