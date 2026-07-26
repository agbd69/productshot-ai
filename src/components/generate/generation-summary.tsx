"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { validateDraftInput } from "@/lib/generation-draft";
import type { GenerationSceneId, GenerationStyle } from "@/types/generation";

export function GenerationSummary({ fileCount, sceneId, style, isSubmitting, onSubmit }: { fileCount: number; sceneId: GenerationSceneId; style: GenerationStyle; isSubmitting: boolean; onSubmit: () => void }) {
  const validation = validateDraftInput({ fileCount, sceneId, style });
  return (
    <aside className="rounded-lg border border-white/10 bg-slate-950/70 p-5 lg:sticky lg:top-8">
      <p className="text-sm uppercase tracking-[0.2em] text-teal-200">Summary</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">Generation draft</h2>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-slate-400">References</dt><dd>{fileCount} / 6</dd></div>
        <div className="flex justify-between"><dt className="text-slate-400">Credits</dt><dd>{validation.ok ? validation.credits : "-"}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-400">Estimate</dt><dd>{validation.ok ? `${validation.estimatedSeconds} sec` : "-"}</dd></div>
      </dl>
      {!validation.ok ? <p className="mt-4 text-sm text-amber-200">{validation.errors.join(" ")}</p> : null}
      <Button className="mt-5 w-full" disabled={!validation.ok || isSubmitting} onClick={onSubmit} type="button">
        {isSubmitting ? "Creating draft..." : "Create draft"} <ArrowRight className="size-4" />
      </Button>
    </aside>
  );
}
