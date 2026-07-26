type CreditUsageInput = { monthlyCredits: number | null; usedCredits: number };
type CreditUsageSummary = {
  remainingCredits: number | null;
  statusLabel: "Healthy" | "Refill soon" | "Unlimited";
  usagePercent: number;
};

export function getCreditUsageSummary({ monthlyCredits, usedCredits }: CreditUsageInput): CreditUsageSummary {
  if (monthlyCredits === null) return { remainingCredits: null, statusLabel: "Unlimited", usagePercent: 0 };
  const remainingCredits = Math.max(monthlyCredits - usedCredits, 0);
  const usagePercent = Math.min(Math.round((usedCredits / monthlyCredits) * 100), 100);
  return { remainingCredits, statusLabel: usagePercent >= 80 ? "Refill soon" : "Healthy", usagePercent };
}
