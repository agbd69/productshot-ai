import { CheckoutButton } from "@/components/billing/checkout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CreditPackId } from "@/config/pricing";
import { getAllPackCapacities } from "@/lib/billing";
import { getOptionalAppUser } from "@/lib/server/auth";

type BillingPageProps = {
  searchParams?: Promise<{ checkout?: string; pack?: string; subscription?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const appUser = await getOptionalAppUser();
  const params = await searchParams;
  const packs = getAllPackCapacities();
  const checkoutSucceeded = params?.checkout === "success";
  const subscriptionDeprecated = params?.subscription === "deprecated";
  const purchasedPackId = (params?.pack ?? null) as CreditPackId | null;
  const currentTier = appUser?.quality_tier ?? "standard";

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-200">Pricing</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">买多少用多少，永不过期</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          4 档积分包，按需选购。买的越多，单张图越便宜。当前余额
          <span className="ml-1 font-semibold text-white">{appUser?.credits ?? 0}</span> credits ·
          当前输出规格
          <span className="ml-1 font-semibold text-white uppercase">{currentTier}</span>。
        </p>
      </section>

      {checkoutSucceeded ? (
        <div className="rounded-md border border-teal-200/30 bg-teal-200/10 p-4 text-sm text-teal-50">
          支付已完成。Stripe webhook 确认后会自动到账，通常只需要几秒钟。
          {purchasedPackId ? (
            <>
              {" "}
              你购买的 <span className="font-semibold">{purchasedPackId}</span> 积分包已激活。
            </>
          ) : null}
        </div>
      ) : null}

      {subscriptionDeprecated ? (
        <div className="rounded-md border border-amber-200/30 bg-amber-200/10 p-4 text-sm text-amber-50">
          旧版订阅已下线。现在只支持一次性积分包。
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-4">
        {packs.map((pack) => {
          const isOwned = isCurrentTierAtLeast(currentTier, pack.qualityTier);
          const highlight = pack.id === "pro";
          return (
            <Card
              className={
                highlight
                  ? "flex flex-col p-6 ring-2 ring-teal-300/40"
                  : "flex flex-col p-6"
              }
              key={pack.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100">{pack.name}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{pack.price}</p>
                  <p className="mt-1 text-xs text-slate-400">{pack.perCredit}</p>
                </div>
                <span
                  className={
                    highlight
                      ? "rounded-full bg-teal-300/20 px-3 py-1 text-xs font-medium text-teal-100"
                      : pack.id === "agency"
                        ? "rounded-full bg-amber-300/20 px-3 py-1 text-xs font-medium text-amber-100"
                        : "rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
                  }
                >
                  {pack.badge}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-300">
                {pack.totalCredits} credits
                {pack.bonusCredits > 0 ? (
                  <span className="ml-1 text-teal-200">（含 {pack.bonusCredits} 赠送）</span>
                ) : null}
              </p>

              <p className="mt-2 text-sm font-medium text-white">
                {pack.outputSize}×{pack.outputSize} 输出
                {pack.id === "agency" ? <span className="ml-2 text-xs text-amber-200">+ API</span> : null}
              </p>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                约 {pack.whiteBgOutputs} 张白底 / {pack.lifestyleOutputs} 张生活化 / {pack.modelWearingOutputs} 张 AI 模特
              </p>

              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-200">
                {pack.features.map((feature) => (
                  <li className="flex items-start gap-2" key={feature}>
                    <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />

              {isOwned ? (
                <Button className="w-full" disabled variant="outline">
                  当前规格已包含
                </Button>
              ) : (
                <CheckoutButton
                  className="w-full"
                  label={`购买 ${pack.name} · ${pack.price}`}
                  packId={pack.id}
                />
              )}
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">Free tier</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">注册即得 30 credits</h2>
          <p className="mt-2 text-slate-300">
            一次性体验，标准 1024×1024 输出。体验完满意再买大包。
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">白底主图</p>
              <p className="mt-2 text-xl font-semibold text-white">up to 7 张</p>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">生活化场景</p>
              <p className="mt-2 text-xl font-semibold text-white">up to 3 张</p>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">AI 模特上身</p>
              <p className="mt-2 text-xl font-semibold text-white">up to 2 张</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/create" variant="outline">
              立即免费试用
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">支付流程</p>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li>1. 选择适合的积分包，点击购买进入 Stripe Checkout。</li>
            <li>2. 支持银行卡 / 支付宝 / 微信支付（按地区）。</li>
            <li>3. 支付成功后自动回到本站；credits 立即到账。</li>
            <li>4. 积分永不过期；output 规格 = 你买过的最高档。</li>
          </ol>
          <div className="mt-5 rounded-md border border-amber-200/20 bg-amber-200/10 p-3 text-sm leading-6 text-amber-50">
            本地仍是 Stripe 测试模式。正式上线需要替换 live keys，并配置生产 webhook。
          </div>
        </Card>
      </section>
    </div>
  );
}

const TIER_RANK = { standard: 1, pro: 2, business: 3, agency: 4 } as const;
type QualityTier = keyof typeof TIER_RANK;

function isCurrentTierAtLeast(current: string, required: string): boolean {
  const c = TIER_RANK[current as QualityTier] ?? 1;
  const r = TIER_RANK[required as QualityTier] ?? 1;
  return c >= r;
}
