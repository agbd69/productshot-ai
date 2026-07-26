import { describe, expect, test } from "vitest";

import { getCreditUsageSummary } from "./credits";

describe("getCreditUsageSummary", () => {
  test("calculates remaining credits and usage percent", () => {
    expect(getCreditUsageSummary({ monthlyCredits: 600, usedCredits: 165 })).toEqual({
      remainingCredits: 435,
      statusLabel: "Healthy",
      usagePercent: 28,
    });
  });

  test("caps usage at 100 percent", () => {
    expect(getCreditUsageSummary({ monthlyCredits: 200, usedCredits: 240 })).toEqual({
      remainingCredits: 0,
      statusLabel: "Refill soon",
      usagePercent: 100,
    });
  });
});
