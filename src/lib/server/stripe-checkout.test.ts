import { describe, expect, test } from "vitest";

import {
  buildCreditCheckoutSessionParams,
  buildSubscriptionCheckoutSessionParams,
} from "@/lib/server/stripe-checkout";

describe("buildCreditCheckoutSessionParams", () => {
  test("requests card, Alipay, and WeChat Pay in Checkout", () => {
    const params = buildCreditCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      userId: "user_123",
    });

    expect(params.payment_method_types).toEqual(["card", "alipay", "wechat_pay"]);
    expect(params.payment_method_options?.wechat_pay).toEqual({ client: "web" });
  });

  test("labels the credit pack with Chinese wallet payment options", () => {
    const params = buildCreditCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      userId: "user_123",
    });

    expect(params.line_items?.[0]?.price_data?.product_data?.description).toContain("银行卡");
    expect(params.line_items?.[0]?.price_data?.product_data?.description).toContain("支付宝");
    expect(params.line_items?.[0]?.price_data?.product_data?.description).toContain("微信支付");
  });

  test("marks the session as a one-time credit pack", () => {
    const params = buildCreditCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      userId: "user_123",
    });
    expect(params.mode).toBe("payment");
    expect(params.metadata?.kind).toBe("credit_pack");
  });
});

describe("buildSubscriptionCheckoutSessionParams", () => {
  test("creates a Pro subscription session with $12.50 / month inline price", () => {
    const params = buildSubscriptionCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      customerEmail: "merchant@example.com",
      plan: "pro",
      userId: "user_123",
    });

    expect(params.mode).toBe("subscription");
    expect(params.metadata?.plan).toBe("pro");
    expect(params.metadata?.kind).toBe("subscription");
    expect(params.customer_email).toBe("merchant@example.com");
    // Falls back to inline price_data when STRIPE_PRO_PRICE_ID is unset
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(1250);
    expect(params.line_items?.[0]?.price_data?.recurring?.interval).toBe("month");
  });

  test("creates a Team subscription session with annual billing ($588 / year)", () => {
    const params = buildSubscriptionCheckoutSessionParams({
      appUrl: "http://localhost:3000",
      plan: "team",
      userId: "user_456",
    });

    expect(params.mode).toBe("subscription");
    expect(params.metadata?.plan).toBe("team");
    expect(params.line_items?.[0]?.price_data?.recurring?.interval).toBe("year");
    expect(params.line_items?.[0]?.price_data?.unit_amount).toBe(58800);
  });

  test("uses a Stripe Price ID when the env is set", () => {
    const original = process.env.STRIPE_PRO_PRICE_ID;
    process.env.STRIPE_PRO_PRICE_ID = "price_test_abc123";
    try {
      const params = buildSubscriptionCheckoutSessionParams({
        appUrl: "http://localhost:3000",
        plan: "pro",
        userId: "user_123",
      });
      expect(params.line_items?.[0]?.price).toBe("price_test_abc123");
      expect(params.line_items?.[0]?.price_data).toBeUndefined();
    } finally {
      if (original === undefined) {
        delete process.env.STRIPE_PRO_PRICE_ID;
      } else {
        process.env.STRIPE_PRO_PRICE_ID = original;
      }
    }
  });
});
