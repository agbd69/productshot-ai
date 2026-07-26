import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getGenerationStatusLabel, getSceneDisplayName } from "@/lib/generation-view";
import { getOptionalAppUser } from "@/lib/server/auth";
import { listGenerationsForUser } from "@/lib/server/generations";

export default async function GenerationsPage() {
  const appUser = await getOptionalAppUser();

  if (!appUser) {
    return (
      <div className="space-y-8">
        <section>
          <h1 className="text-3xl font-semibold text-white">生成历史</h1>
          <p className="mt-3 text-slate-300">登录后可以查看真实生成记录。</p>
        </section>
        <Card className="p-5 text-slate-300">当前还没有可显示的账户数据。</Card>
      </div>
    );
  }

  const generations = await listGenerationsForUser(appUser.id);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold text-white">生成历史</h1>
        <p className="mt-3 text-slate-300">查看已完成或失败的生成任务。</p>
      </section>
      <div className="grid gap-3">
        {generations.length === 0 ? (
          <Card className="p-5">
            <p className="text-slate-300">还没有生成记录。</p>
            <Button className="mt-5" href="/create">生成第一张照片</Button>
          </Card>
        ) : (
          generations.map((generation) => (
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5" key={generation.id}>
              <div>
                <h2 className="font-semibold text-white">{getSceneDisplayName(generation.scene)}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {getGenerationStatusLabel(generation.status)} · {generation.output_image_urls.length} 张输出 · 消耗 {generation.credits_used} credits
                </p>
              </div>
              <Button href={`/generations/${generation.id}`} variant="outline">查看</Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
