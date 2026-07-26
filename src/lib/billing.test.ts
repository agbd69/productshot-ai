import { describe, expect, test } from "vitest";

import { PRICING_PLANS } from "@/config/pricing";

import { formatUsdFromCents, getAllPlanSummaries, getCreditPackSummary, getPlanSummary } from "@/lib/billing";

describe("billing helpers", () => {
  test("formats USD prices from cents", () => {
    expect(formatUsdFromCents(990)).toBe("$9.90");
    expect(formatUsdFromCents(0)).toBe("Free");
  });

  test("summarizes starter pack product-image capacity (30 credits)", () => {
    // 30 credits / scene.baseCredits, floored
    // white-bg 4, lifestyle 8, festival 6, model-wearing 12, detail-page 10
    expect(getCreditPackSummary()).toEqual({
      whiteBgOutputs: 7, // floor(30/4)
      lifestyleOutputs: 3, // floor(30/8)
      festivalOutputs: 5, // floor(30/6)
      modelWearingOutputs: 2, // floor(30/12)
      detailPageOutputs: 3, // floor(30/10)
      price: "$9.90",
    });
  });

  test("getPlanSummary returns Pro plan at $12.50 / month", () => {
    const pro = getPlanSummary("pro");
    expect(pro.id).toBe("pro");
    expect(pro.name).toBe("Pro");
    expect(pro.priceLabel).toBe("$12.50 / month");
    expect(pro.monthlyCredits).toBe(200);
    expect(pro.features.length).toBeGreaterThan(0);
  });

  test("getPlanSummary returns Team plan at $588 / year", () => {
    const team = getPlanSummary("team");
    expect(team.id).toBe("team");
    expect(team.priceLabel).toBe("$588.00 / year");
    expect(team.monthlyCredits).toBe(2000);
  });

  test("getPlanSummary returns Free plan with $0 / Free label", () => {
    const free = getPlanSummary("free");
    expect(free.id).toBe("free");
    expect(free.priceLabel).toBe("Free / month");
    expect(free.monthlyCredits).toBe(30);
  });

  test("getAllPlanSummaries returns 3 plans in declaration order", () => {
    const all = getAllPlanSummaries();
    expect(all.map((p) => p.id)).toEqual(["free", "pro", "team"]);
    expect(all.length).toBe(3);
  });

  test("every paid plan's monthlyCredits match PRICING_PLANS source of truth", () => {
    for (const summary of getAllPlanSummaries()) {
      expect(summary.monthlyCredits).toBe(PRICING_PLANS[summary.id].monthlyCredits);
    }
  });
});
