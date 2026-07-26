import { CheckoutButton } from "@/components/billing/checkout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CREDIT_PACK, PRICING_PLANS, type PricingPlanId } from "@/config/pricing";
import { getAllPlanSummaries, getCreditPackSummary } from "@/lib/billing";
import { getOptionalAppUser } from "@/lib/server/auth";

type BillingPageProps = {
  searchParams?: Promise<{ checkout?: string; subscription?: string }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const appUser = await getOptionalAppUser();
  const params = await searchParams;
  const planSummaries = getAllPlanSummaries();
  const packSummary = getCreditPackSummary();
  const currentPlan: PricingPlanId = (appUser?.plan ?? "free") as PricingPlanId;
  const checkoutSucceeded = params?.checkout === "success";
  const subscriptionSucceeded = params?.subscription === "success";

  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-200">Pricing</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">为电商商家量身定做的 AI 商品图定价</h1>
        <p className="mt-3 max-w-2xl text-slate-300">
          三档订阅 + 一次性 credits 包。订阅档每月自动续杯，credits 不浪费。
          当前余额 <span className="font-semibold text-white">{appUser?.credits ?? 0}</span> credits · 当前套餐
          <span className="ml-1 font-semibold text-white">{PRICING_PLANS[currentPlan].name}</span>。
        </p>
      </section>

      {subscriptionSucceeded ? (
        <div className="rounded-md border border-teal-200/30 bg-teal-200/10 p-4 text-sm text-teal-50">
          订阅成功！Stripe webhook 确认后会自动升级套餐并补满当月 credits。
        </div>
      ) : null}

      {checkoutSucceeded ? (
        <div className="rounded-md border border-teal-200/30 bg-teal-200/10 p-4 text-sm text-teal-50">
          支付已完成。Stripe webhook 确认后会自动增加 credits，通常只需要几秒钟。
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {planSummaries.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isPaid = plan.id !== "free";
          return (
            <Card className="flex flex-col p-6" key={plan.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100">{plan.name}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{plan.priceLabel}</p>
                </div>
                <span
                  className={
                    plan.id === "pro"
                      ? "rounded-full bg-teal-300/20 px-3 py-1 text-xs font-medium text-teal-100"
                      : plan.id === "team"
                        ? "rounded-full bg-amber-300/20 px-3 py-1 text-xs font-medium text-amber-100"
                        : "rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"
                  }
                >
                  {plan.badge}
                </span>
              </div>

              <p className="mt-4 text-sm text-slate-300">
                每月 <span className="font-semibold text-white">{plan.monthlyCredits}</span> credits，可生成约
                {" "}
                {Math.floor(plan.monthlyCredits / 4)} 张白底主图 / {Math.floor(plan.monthlyCredits / 8)} 张生活化场景
                / {Math.floor(plan.monthlyCredits / 12)} 张 AI 模特图。
              </p>

              <ul className="mt-5 space-y-2 text-sm leading-6 text-slate-200">
                {plan.features.map((feature) => (
                  <li className="flex items-start gap-2" key={feature}>
                    <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-teal-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex-1" />

              {isCurrent ? (
                <Button className="w-full" disabled variant="outline">
                  当前套餐
                </Button>
              ) : isPaid ? (
                <CheckoutButton
                  className="w-full"
                  label={`升级到 ${plan.name}`}
                  plan={plan.id}
                />
              ) : (
                <Button className="w-full" disabled variant="ghost">
                  注册即免费获得
                </Button>
              )}
            </Card>
          );
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">One-time pack</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">{packSummary.price}</h2>
              <p className="mt-2 text-slate-300">{CREDIT_PACK.credits} credits，永不过期。试用装，无需订阅。</p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
              <p className="text-sm text-slate-400">当前余额</p>
              <p className="mt-1 text-2xl font-semibold text-white">{appUser?.credits ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">白底主图</p>
              <p className="mt-2 text-xl font-semibold text-white">up to {packSummary.whiteBgOutputs}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">生活化场景</p>
              <p className="mt-2 text-xl font-semibold text-white">up to {packSummary.lifestyleOutputs}</p>
            </div>
            <div className="rounded-md border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">AI 模特上身</p>
              <p className="mt-2 text-xl font-semibold text-white">up to {packSummary.modelWearingOutputs}</p>
            </div>
          </div>

          <p className="mt-5 max-w-2xl leading-7 text-slate-300">
            支付页面由 Stripe 托管。ProductShot.ai 只接收支付成功通知，并为你的账户增加 credits。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <CheckoutButton
              className="w-full sm:w-auto"
              label={`银行卡 / 支付宝 / 微信支付 ${packSummary.price}`}
            />
            <Button href="/create" variant="outline">
              返回生成
            </Button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">
            如果 Stripe 当前没有显示支付宝或微信支付，说明该测试账户、地区或币种暂未开放对应支付方式。
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-400">支付流程</p>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-300">
            <li>1. 选择订阅档或一次性 credits 包，点击支付按钮进入 Stripe Checkout。</li>
            <li>2. 订阅档支持银行卡；一次性包还支持支付宝 / 微信支付（按地区）。</li>
            <li>3. 支付成功后自动回到本站；订阅档每月自动续杯。</li>
            <li>4. Webhook 收到通知后自动升级套餐 / 补满 credits。</li>
          </ol>
          <div className="mt-5 rounded-md border border-amber-200/20 bg-amber-200/10 p-3 text-sm leading-6 text-amber-50">
            本地仍是 Stripe 测试模式。正式上线需要替换 live keys，并配置生产 webhook。
          </div>
        </Card>
      </section>
    </div>
  );
}
