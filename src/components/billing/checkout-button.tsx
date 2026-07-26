"use client";

import { useState } from "react";

import { CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PricingPlanId } from "@/config/pricing";

type CheckoutButtonProps = {
  children?: string;
  className?: string;
  label?: string;
  plan?: PricingPlanId;
};

/**
 * POST /api/stripe/checkout with an optional `plan` body. When `plan` is set
 * the server creates a subscription session for that plan; otherwise the
 * legacy one-time credit pack session is returned.
 */
export function CheckoutButton({ children, className, label, plan }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setIsLoading(true);
    setError(null);

    const response = await fetch("/api/stripe/checkout", {
      body: JSON.stringify(plan ? { plan } : {}),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const payload = (await response.json()) as { errors?: string[]; url?: string };

    setIsLoading(false);

    if (!response.ok || !payload.url) {
      setError(payload.errors?.join(" ") ?? "无法打开支付页面，请稍后重试。");
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <div>
      <Button className={className} disabled={isLoading} onClick={startCheckout} type="button">
        <CreditCard aria-hidden="true" size={18} />
        {isLoading ? "正在打开支付页面..." : (label ?? children ?? "购买入门包")}
      </Button>
      {error ? <p className="mt-3 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}
    </div>
  );
}
