"use client";

import { Card } from "@/components/ui/card";
import { generationScenes } from "@/config/generation";
import type { GenerationSceneId, GenerationStyle } from "@/types/generation";

export function SceneSelector({ selectedSceneId, onSceneChange }: { selectedSceneId: GenerationSceneId; onSceneChange: (sceneId: GenerationSceneId, patch: Partial<GenerationStyle>) => void }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-white">Choose scene</h2>
      <div className="grid gap-3 lg:grid-cols-4">
        {generationScenes.map((scene) => (
          <button className="text-left" key={scene.id} onClick={() => onSceneChange(scene.id, { background: scene.backgroundOptions[0], outfit: scene.outfitOptions[0] })} type="button">
            <Card className={scene.id === selectedSceneId ? "border-teal-200/70 bg-teal-200/[0.08] p-5" : "p-5"}>
              <h3 className="text-lg font-semibold text-white">{scene.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">{scene.description}</p>
              <p className="mt-4 text-sm text-slate-400">{scene.baseCredits} credits / output</p>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
