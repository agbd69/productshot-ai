import { describe, expect, test } from "vitest";

import { CREDIT_PACKS } from "@/config/pricing";

import { buildCreditPackCheckoutSessionParams } from "@/lib/server/stripe-checkout";

describe("buildCreditPackCheckoutSessionParams", () => {
  test("starter pack: $30 / 300 credits, mode=payment, kind=credit_pack", () => {
    const params = buildCreditPackCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      packId: "starter",
      userId: "user_123",
    });

    expect(params.mode).toBe("payment");
    expect(params.metadata?.kind).toBe("credit_pack");
    expect(params.metadata?.packId).toBe("starter");
    expect(params.metadata?.credits).toBe("300");
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(3000);
    expect(params.success_url).toContain("pack=starter");
  });

  test("pro pack: $99 / 1550 credits (1500 base + 50 bonus)", () => {
    const params = buildCreditPackCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      packId: "pro",
      userId: "user_123",
    });

    expect(params.metadata?.packId).toBe("pro");
    expect(params.metadata?.credits).toBe("1550");
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(9900);
  });

  test("business pack: $199 / 3600 credits (3500 base + 100 bonus)", () => {
    const params = buildCreditPackCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      packId: "business",
      userId: "user_456",
    });

    expect(params.metadata?.packId).toBe("business");
    expect(params.metadata?.credits).toBe("3600");
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(19900);
  });

  test("agency pack: $399 / 8200 credits (8000 base + 200 bonus)", () => {
    const params = buildCreditPackCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      packId: "agency",
      userId: "user_789",
    });

    expect(params.metadata?.packId).toBe("agency");
    expect(params.metadata?.credits).toBe("8200");
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(39900);
  });

  test("requests card, Alipay, and WeChat Pay for every pack", () => {
    for (const packId of Object.keys(CREDIT_PACKS) as Array<keyof typeof CREDIT_PACKS>) {
      const params = buildCreditPackCheckoutSessionParams({
        appUrl: "http://localhost:3000",
        packId,
        userId: "user_123",
      });
      expect(params.payment_method_types).toEqual(["card", "alipay", "wechat_pay"]);
      expect(params.payment_method_options?.wechat_pay).toEqual({ client: "web" });
    }
  });

  test("uses a Stripe Price ID from env when set, falling back to inline price_data", () => {
    const original = process.env.STRIPE_PRO_PACK_PRICE_ID;
    process.env.STRIPE_PRO_PACK_PRICE_ID = "price_test_xyz789";
    try {
      const params = buildCreditPackCheckoutSessionParams({
        appUrl: "http://localhost:3000",
        packId: "pro",
        userId: "user_123",
      });
      expect(params.line_items?.[0]?.price).toBe("price_test_xyz789");
      expect(params.line_items?.[0]?.price_data).toBeUndefined();
    } finally {
      if (original === undefined) {
        delete process.env.STRIPE_PRO_PACK_PRICE_ID;
      } else {
        process.env.STRIPE_PRO_PACK_PRICE_ID = original;
      }
    }
  });

  test("success_url includes the pack id for post-purchase analytics", () => {
    const params = buildCreditPackCheckoutSessionParams({
      appUrl: "https://productshot.ai",
      packId: "business",
      userId: "user_123",
    });
    expect(params.success_url).toBe(
      "https://productshot.ai/billing?checkout=success&pack=business",
    );
  });
});
