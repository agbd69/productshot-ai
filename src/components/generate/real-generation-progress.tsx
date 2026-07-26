"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import type { GenerationRecord } from "@/lib/server/generations";
import { PRODUCT_SCENES } from "@/config/scenes";

type GenerationPayload = {
  errors?: string[];
  generation?: GenerationRecord;
};

const CATEGORY_LABEL: Record<NonNullable<GenerationRecord["metadata"]["category"]>, string> = {
  apparel: "服装",
  beauty: "美妆",
  food: "食品",
  home: "家居",
  "3c": "3C 数码",
};

export function RealGenerationProgress({
  generationId,
}: {
  generationId: string;
}) {
  const [generation, setGeneration] = useState<GenerationRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadGeneration() {
      const response = await fetch(`/api/generations/${generationId}`);
      const payload = (await response.json()) as GenerationPayload;

      if (!active) return;

      if (!response.ok || !payload.generation) {
        setError(payload.errors?.join(" ") ?? "无法加载生成任务。");
        return;
      }

      setGeneration(payload.generation);
      setError(payload.generation.error);
    }

    void loadGeneration();
    const timer = window.setInterval(() => {
      if (generation?.status === "completed" || generation?.status === "failed") return;
      void loadGeneration();
    }, 3500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [generation?.status, generationId]);

  const progress = generation?.status === "completed" ? 100 : generation?.status === "failed" ? 100 : generation ? 55 : 18;
  const sceneTitle = PRODUCT_SCENES.find((s) => s.id === generation?.scene)?.title ?? generation?.scene ?? "";
  const category = generation?.metadata?.category;

  return (
    <section className="rounded-lg border border-teal-200/20 bg-teal-200/[0.08] p-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100">{generation?.status ?? "loading"}</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">商品图生成任务</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-300">
        任务 <span className="font-mono text-teal-100">{generationId.slice(0, 18)}...</span>
        {sceneTitle ? <> · 场景 <span className="font-semibold text-white">{sceneTitle}</span></> : null}
        {category ? <> · 品类 <span className="font-semibold text-white">{CATEGORY_LABEL[category]}</span></> : null} 正在由 Flux Pro v1.1 处理。
      </p>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-950/60">
        <div className="h-full rounded-full bg-teal-200 transition-all" style={{ width: `${progress}%` }} />
      </div>
      {error ? <p className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">{error}</p> : null}
      {generation?.status === "completed" ? (
        <ResultGallery scene={generation.scene} urls={generation.output_image_urls} />
      ) : null}
    </section>
  );
}

function ResultGallery({ scene, urls }: { scene: GenerationRecord["scene"]; urls: string[] }) {
  const sceneTitle = PRODUCT_SCENES.find((s) => s.id === scene)?.title ?? scene;
  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-white">{sceneTitle} · {urls.length} 张</h2>
        <p className="text-sm text-slate-400">右键图片可保存到本机，或点击下方按钮在新标签页打开原图。</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {urls.map((url, index) => (
          <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3" key={url}>
            <Image
              alt={`生成图片 ${index + 1}`}
              className="aspect-square w-full rounded-sm object-cover"
              height={1024}
              src={url}
              unoptimized
              width={1024}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                className="rounded-md border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10"
                href={url}
                rel="noreferrer"
                target="_blank"
              >
                打开原图
              </a>
              <a
                className="rounded-md bg-teal-300 px-3 py-2 text-xs font-medium text-slate-950 hover:bg-teal-200"
                href={url}
                download={`productshot-${scene}-${index + 1}.png`}
              >
                下载
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
