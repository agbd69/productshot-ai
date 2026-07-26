"use client";

import { getGenerationScene, styleOptions } from "@/config/generation";
import type { GenerationSceneId, GenerationStyle } from "@/types/generation";

export function StyleForm({ sceneId, style, onStyleChange }: { sceneId: GenerationSceneId; style: GenerationStyle; onStyleChange: (style: GenerationStyle) => void }) {
  const scene = getGenerationScene(sceneId);
  const selectClass = "mt-2 h-11 w-full rounded-md border border-white/10 bg-slate-950/70 px-3 text-sm text-white";
  const update = <T extends keyof GenerationStyle>(key: T, value: GenerationStyle[T]) => onStyleChange({ ...style, [key]: value });
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-xl font-semibold text-white">Smart parameters</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-200">Gender<select className={selectClass} value={style.gender} onChange={(e) => update("gender", e.target.value as GenerationStyle["gender"])}>{styleOptions.genders.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm text-slate-200">Age<select className={selectClass} value={style.ageRange} onChange={(e) => update("ageRange", e.target.value as GenerationStyle["ageRange"])}>{styleOptions.ageRanges.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm text-slate-200">Outfit<select className={selectClass} value={style.outfit} onChange={(e) => update("outfit", e.target.value)}>{scene?.outfitOptions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm text-slate-200">Background<select className={selectClass} value={style.background} onChange={(e) => update("background", e.target.value)}>{scene?.backgroundOptions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm text-slate-200">Expression<select className={selectClass} value={style.expression} onChange={(e) => update("expression", e.target.value as GenerationStyle["expression"])}>{styleOptions.expressions.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm text-slate-200">Outputs<select className={selectClass} value={style.outputCount} onChange={(e) => update("outputCount", Number(e.target.value))}>{styleOptions.outputCounts.map((x) => <option key={x} value={x}>{x} images</option>)}</select></label>
        <label className="text-sm text-slate-200">Resolution<select className={selectClass} value={style.resolution} onChange={(e) => update("resolution", e.target.value as GenerationStyle["resolution"])}>{styleOptions.resolutions.map((x) => <option key={x}>{x}</option>)}</select></label>
      </div>
    </section>
  );
}
