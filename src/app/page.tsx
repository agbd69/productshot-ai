import { ArrowRight, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PRICING_PLANS } from "@/config/pricing";

const scenes = [
  "纯白底主图",
  "生活化场景",
  "节日促销",
  "AI 模特上身",
  "详情页多角度",
];
const platformFormats = ["Amazon 纯白底", "Shopify 1:1", "TikTok 9:16", "独立站 4:3", "30s 短视频"];
const planDisplay = [
  { badge: "注册即得", credits: `${PRICING_PLANS.free.monthlyCredits} credits / month`, name: PRICING_PLANS.free.name, price: "Free" },
  {
    badge: "最受欢迎",
    credits: `${PRICING_PLANS.pro.monthlyCredits} credits / month`,
    name: PRICING_PLANS.pro.name,
    price: "$12.50 / month",
  },
  {
    badge: "适合代运营 / 团队",
    credits: `${PRICING_PLANS.team.monthlyCredits} credits / month`,
    name: PRICING_PLANS.team.name,
    price: "$588 / year",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-2 font-semibold" href="#">
            <span className="grid size-9 place-items-center rounded-md border border-teal-200/30 bg-teal-200/10 text-teal-200">
              <Sparkles className="size-4" />
            </span>
            ProductShot.ai
          </a>
          <div className="flex items-center gap-2">
            <Button href="/sign-in" variant="ghost">登录</Button>
            <Button href="/dashboard">开始生成 <ArrowRight className="size-4" /></Button>
          </div>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-teal-100">
              端到端 AI 商品图 · 一张上传，五大平台规格全出
            </p>
            <h1 className="text-balance text-5xl font-semibold text-white sm:text-7xl">ProductShot.ai</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              上传一张商品图，AI 自动抠图、生成 5 个场景、出 Amazon 纯白底 + Shopify 1:1 + TikTok 9:16 + 30s 短视频——
              端到端产品图素材包，10 分钟搞定。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/sign-up">立即开始 <ArrowRight className="size-4" /></Button>
              <Button href="#pricing" variant="outline">查看价格</Button>
            </div>
          </div>
          <Card className="p-5">
            <div className="grid grid-cols-3 gap-3">
              {scenes.concat(platformFormats).slice(0, 9).map((item, index) => (
                <div className="aspect-[3/4] rounded-md border border-white/10 bg-gradient-to-br from-teal-200/20 via-slate-800 to-slate-950 p-3" key={item}>
                  <div className="size-12 rounded-md border border-white/20 bg-white/15" />
                  <p className="mt-auto pt-20 text-xs text-slate-100">{index + 1}. {item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white">5 个端到端场景，覆盖电商全部主图需求</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {scenes.map((scene) => (
              <Card className="p-5" key={scene}>
                <h3 className="text-base font-semibold text-white">{scene}</h3>
                <p className="mt-3 text-xs leading-5 text-slate-300">针对电商主图场景优化，自动匹配构图、灯光、SKU 风格。</p>
              </Card>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white">一套素材，五大平台自动适配</h2>
          <p className="mt-3 max-w-2xl text-slate-300">Amazon 要求纯白底 85%+、Shopify 偏好 1:1、TikTok Shop 强推 9:16 视频——ProductShot.ai 一次出 5 套规格，跨平台不用重做。</p>
          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {platformFormats.map((format) => (
              <Card className="p-4" key={format}>
                <p className="text-sm text-white">{format}</p>
              </Card>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="pricing">
          <h2 className="text-3xl font-semibold text-white">按用量付费，不按张数</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {planDisplay.map((plan) => (
              <Card className="p-5" key={plan.name}>
                <p className="text-xs uppercase tracking-[0.2em] text-teal-100">{plan.badge}</p>
                <h3 className="mt-3 text-xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-4 text-4xl font-semibold text-white">{plan.price}</p>
                <p className="mt-3 text-teal-100">{plan.credits}</p>
                <p className="mt-5 flex gap-2 text-sm text-slate-300">
                  <Check className="size-4 shrink-0 text-teal-200" /> All 5 scenes + every platform spec
                </p>
                <p className="mt-2 flex gap-2 text-sm text-slate-300">
                  <Check className="size-4 shrink-0 text-teal-200" /> {plan.name === "Pro" ? "HD resolution + priority queue" : plan.name === "Team" ? "Team workspace + dedicated support" : "Standard resolution"}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-slate-400">
        <a className="mx-3 hover:text-white" href="/privacy">Privacy</a>
        <a className="mx-3 hover:text-white" href="/terms">Terms</a>
        <a className="mx-3 hover:text-white" href="https://github.com/agbd69/productshot-ai">GitHub</a>
      </footer>
    </>
  );
}
