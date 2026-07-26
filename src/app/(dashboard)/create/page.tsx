"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { UploadDropzone } from "@/components/generate/upload-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GENERATION_COST } from "@/config/pricing";
import { PRODUCT_SCENES, type MvpSceneId } from "@/config/scenes";
import { calculateMvpGenerationCredits } from "@/lib/mvp-generation";

export default function CreatePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sceneId, setSceneId] = useState<MvpSceneId>("white-bg");
  const [outputCount, setOutputCount] = useState(4);
  const [displayName, setDisplayName] = useState("");
  const selectedScene = useMemo(() => PRODUCT_SCENES.find((scene) => scene.id === sceneId), [sceneId]);
  const credits = calculateMvpGenerationCredits(sceneId, outputCount);
  const needsCredits = submitError ? submitError.toLowerCase().includes("not enough credits") || submitError.includes("额度不足") : false;

  async function submitGeneration() {
    setIsSubmitting(true);
    setSubmitError(null);

    const body = new FormData();
    body.set("scene", sceneId);
    body.set("outputCount", String(outputCount));
    body.set("displayName", displayName);
    files.forEach((file) => body.append("images", file));

    const response = await fetch("/api/generate", {
      body,
      method: "POST",
    });

    const payload = (await response.json()) as { errors?: string[]; redirectUrl?: string };
    setIsSubmitting(false);
    if (!response.ok || !payload.redirectUrl) {
      const message = payload.errors?.join(" ") ?? "无法开始生成，请稍后重试。";
      setSubmitError(message.includes("Not enough credits") ? "额度不足，请先购买 credits 后继续。" : message);
      return;
    }
    router.push(payload.redirectUrl);
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-200">端到端产品图</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">生成商品图素材包</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-300">
          上传 1-6 张商品图，选择场景和出图数量。系统会自动抠图、生成场景、出 Amazon / Shopify / TikTok 三个平台规格。
        </p>
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <UploadDropzone files={files} onFilesChange={setFiles} />
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">选择场景</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRODUCT_SCENES.map((scene) => (
                <button className="text-left" key={scene.id} onClick={() => setSceneId(scene.id)} type="button">
                  <Card className={scene.id === sceneId ? "border-teal-200/70 bg-teal-200/[0.08] p-5" : "p-5"}>
                    <h3 className="text-lg font-semibold text-white">{scene.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{scene.description}</p>
                    <p className="mt-4 text-sm text-slate-400">每张 {GENERATION_COST[scene.id]} credits</p>
                  </Card>
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-semibold text-white">出图数量</h2>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 4, 8].map((count) => (
                <button
                  className={[
                    "h-11 rounded-md border px-5 text-sm font-medium transition",
                    count === outputCount ? "border-teal-200 bg-teal-200 text-slate-950" : "border-white/15 bg-white/[0.03] text-slate-200 hover:bg-white/10",
                  ].join(" ")}
                  key={count}
                  onClick={() => setOutputCount(count)}
                  type="button"
                >
                  {count}
                </button>
              ))}
            </div>
          </section>
          <section>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">listing 备注（可选）</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-white/15 bg-slate-950/70 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-200"
                maxLength={48}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="例如：Listing 2026 春款"
                value={displayName}
              />
            </label>
          </section>
        </div>
        <div>
          <Card className="p-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100">任务摘要</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{selectedScene?.title}</h2>
            <dl className="mt-5 space-y-3 text-sm text-slate-300">
              <div className="flex justify-between gap-4">
                <dt>商品图</dt>
                <dd>{files.length} / 6</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>出图数量</dt>
                <dd>{outputCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>消耗额度</dt>
                <dd>{credits}</dd>
              </div>
            </dl>
            <Button className="mt-6 w-full" disabled={isSubmitting || files.length === 0} onClick={submitGeneration} type="button">
              {isSubmitting ? "生成中..." : "立即生成"}
            </Button>
            <p className="mt-3 text-xs leading-5 text-slate-400">白底 / 详情页场景会自动调用 Remove.bg 抠图，配置 REMOVE_BG_KEY 后启用。</p>
          </Card>
          {submitError ? (
            <div className="mt-3 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
              <p>{submitError}</p>
              {needsCredits ? (
                <Button className="mt-3" href="/billing" variant="outline">
                  购买额度
                </Button>
              ) : null}
            </div>
          ) : null}
          {selectedScene ? <p className="mt-4 text-sm leading-6 text-slate-400">当前预设：{selectedScene.title}</p> : null}
        </div>
      </div>
    </div>
  );
}
