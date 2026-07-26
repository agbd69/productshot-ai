import { getGenerationScene } from "@/config/generation";
import type { DraftInput, DraftValidationResult, GenerationSceneId, GenerationStyle } from "@/types/generation";

export function calculateDraftCredits(
  sceneId: GenerationSceneId,
  outputCount: number,
  resolution: GenerationStyle["resolution"] = "standard",
) {
  const scene = getGenerationScene(sceneId);
  if (!scene) return 0;
  const resolutionPremium = resolution === "hd" ? 3 : 0;
  return outputCount * (scene.baseCredits + resolutionPremium);
}

export function validateDraftInput(input: DraftInput): DraftValidationResult {
  const errors: string[] = [];
  const scene = getGenerationScene(input.sceneId);

  if (input.fileCount < 1) errors.push("Upload at least 1 product image.");
  if (input.fileCount > 6) errors.push("Upload no more than 6 product images.");
  if (!scene) errors.push("Choose a valid product scene.");
  if (input.style.outputCount < 2 || input.style.outputCount > 8) errors.push("Choose between 2 and 8 outputs.");

  if (errors.length > 0 || !scene) return { errors, ok: false };

  return {
    credits: calculateDraftCredits(input.sceneId, input.style.outputCount, input.style.resolution),
    estimatedSeconds: scene.estimatedSeconds,
    ok: true,
  };
}
