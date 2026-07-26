import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSceneDisplayName } from "@/lib/generation-view";
import { getOptionalAppUser } from "@/lib/server/auth";
import { listGenerationsForUser } from "@/lib/server/generations";

export default async function DashboardPage() {
  const appUser = await getOptionalAppUser();

  if (!appUser) {
    return (
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold text-white">你的 AI 照片工作台</h1>
          <p className="mt-3 text-slate-300">配置 Clerk 和 Supabase 后，这里会显示真实额度、付款和生成记录。</p>
        </section>
        <Card className="p-5">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-100">需要配置</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">添加环境变量</h2>
          <p className="mt-3 leading-7 text-slate-300">本地工作台已经就绪，但需要在 `.env.local` 中配置 Clerk 和 Supabase 才能读取真实账户数据。</p>
        </Card>
      </div>
    );
  }

  const generations = await listGenerationsForUser(appUser.id, 3);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold text-white">你的 AI 照片工作台</h1>
        <p className="mt-3 text-slate-300">查看余额、发起生成任务，并管理历史照片。</p>
      </section>
      <Card className="p-5">
        <p className="text-sm text-teal-100">当前额度</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{appUser.credits} credits</h2>
        <p className="mt-2 text-slate-300">付款成功后，Stripe webhook 会自动为账户增加 30 credits。</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button href="/create">生成照片</Button>
        <Button href="/billing" variant="outline">购买额度</Button>
      </div>
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">最近生成</h2>
        <div className="grid gap-3">
          {generations.length === 0 ? (
            <Card className="p-5 text-slate-300">还没有生成记录。</Card>
          ) : (
            generations.map((generation) => (
              <Card className="flex flex-wrap items-center justify-between gap-3 p-5" key={generation.id}>
                <div>
                  <h3 className="font-semibold text-white">{getSceneDisplayName(generation.scene)}</h3>
                  <p className="mt-1 text-sm text-slate-400">消耗 {generation.credits_used} credits</p>
                </div>
                <Button href={`/generations/${generation.id}`} variant="outline">查看</Button>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
