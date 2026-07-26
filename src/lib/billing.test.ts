import { describe, expect, test } from "vitest";

import { CREDIT_PACKS, PRICING_PLANS } from "@/config/pricing";

import { formatUsdFromCents, getAllPackCapacities, getPackCapacity } from "@/lib/billing";

describe("billing helpers", () => {
  test("formats USD prices from cents", () => {
    expect(formatUsdFromCents(990)).toBe("$9.90");
    expect(formatUsdFromCents(3000)).toBe("$30.00");
    expect(formatUsdFromCents(39900)).toBe("$399.00");
    expect(formatUsdFromCents(0)).toBe("Free");
  });

  test("free tier exposes 30 signup credits and standard quality", () => {
    expect(PRICING_PLANS.free.signupCredits).toBe(30);
    expect(PRICING_PLANS.free.qualityTier).toBe("standard");
    expect(PRICING_PLANS.free.priceCents).toBe(0);
  });

  test("all 4 credit packs are defined and ordered by price", () => {
    const packs = getAllPackCapacities();
    expect(packs.map((p) => p.id)).toEqual(["starter", "pro", "business", "agency"]);
    expect(packs[0].price).toBe("$30.00");
    expect(packs[1].price).toBe("$99.00");
    expect(packs[2].price).toBe("$199.00");
    expect(packs[3].price).toBe("$399.00");
  });

  test("each pack has correct credit math (base + bonus = total)", () => {
    for (const pack of Object.values(CREDIT_PACKS)) {
      const cap = getPackCapacity(pack);
      expect(cap.totalCredits).toBe(pack.credits + pack.bonusCredits);
    }
  });

  test("starter pack: 300 credits at $30 = $0.10 / credit (1024 standard)", () => {
    const cap = getPackCapacity(CREDIT_PACKS.starter);
    expect(cap.totalCredits).toBe(300);
    expect(cap.price).toBe("$30.00");
    expect(cap.qualityTier).toBe("standard");
    expect(cap.outputSize).toBe(1024);
    expect(cap.whiteBgOutputs).toBe(75); // floor(300 / 4)
    expect(cap.lifestyleOutputs).toBe(37); // floor(300 / 8)
    expect(cap.modelWearingOutputs).toBe(25); // floor(300 / 12)
  });

  test("pro pack: 1550 credits at $99 = ~$0.064/credit (2048 pro tier)", () => {
    const cap = getPackCapacity(CREDIT_PACKS.pro);
    expect(cap.totalCredits).toBe(1550);
    expect(cap.bonusCredits).toBe(50);
    expect(cap.price).toBe("$99.00");
    expect(cap.qualityTier).toBe("pro");
    expect(cap.outputSize).toBe(2048);
    expect(cap.whiteBgOutputs).toBe(387); // floor(1550 / 4)
  });

  test("business pack: 3600 credits at $199 = 4K output", () => {
    const cap = getPackCapacity(CREDIT_PACKS.business);
    expect(cap.totalCredits).toBe(3600);
    expect(cap.bonusCredits).toBe(100);
    expect(cap.price).toBe("$199.00");
    expect(cap.qualityTier).toBe("business");
    expect(cap.outputSize).toBe(4096);
  });

  test("agency pack: 8200 credits at $399 = 4K + API (lowest per-credit)", () => {
    const cap = getPackCapacity(CREDIT_PACKS.agency);
    expect(cap.totalCredits).toBe(8200);
    expect(cap.bonusCredits).toBe(200);
    expect(cap.price).toBe("$399.00");
    expect(cap.qualityTier).toBe("agency");
    expect(cap.outputSize).toBe(4096);
  });

  test("per-credit cost decreases monotonically with pack size", () => {
    const packs = getAllPackCapacities();
    const perCreditCents = packs.map((p) => CREDIT_PACKS[p.id].priceCents / p.totalCredits);
    for (let i = 1; i < perCreditCents.length; i++) {
      expect(perCreditCents[i]).toBeLessThanOrEqual(perCreditCents[i - 1]);
    }
    // Sanity: starter ~3.3 cents/credit, agency ~4.9 cents/credit (cheapest per credit)
    expect(perCreditCents[0]).toBeGreaterThan(perCreditCents[3]);
  });
});
