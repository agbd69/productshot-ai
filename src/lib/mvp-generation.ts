import { GENERATION_COST } from "@/config/pricing";
import type { MvpSceneId } from "@/config/scenes";

const SUPPORTED_SCENES = Object.keys(GENERATION_COST) as MvpSceneId[];
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ParsedMvpGenerationForm =
  | {
      files: File[];
      displayName: string;
      ok: true;
      outputCount: number;
      scene: MvpSceneId;
    }
  | {
      errors: string[];
      ok: false;
    };

export function calculateMvpGenerationCredits(scene: MvpSceneId, outputCount: number) {
  return GENERATION_COST[scene] * outputCount;
}

export function parseMvpGenerationForm(form: FormData): ParsedMvpGenerationForm {
  const errors: string[] = [];
  const sceneValue = form.get("scene");
  const outputValue = Number(form.get("outputCount"));
  const displayNameValue = form.get("displayName");
  const files = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);

  const scene = typeof sceneValue === "string" && SUPPORTED_SCENES.includes(sceneValue as MvpSceneId) ? (sceneValue as MvpSceneId) : null;

  if (!scene) {
    errors.push("Choose a supported product scene.");
  }

  if (!Number.isInteger(outputValue) || outputValue < 1 || outputValue > 8) {
    errors.push("Generate 1-8 outputs at a time.");
  }

  if (files.length < 1 || files.length > 6) {
    errors.push("Upload 1-6 product images.");
  }

  if (files.some((file) => !SUPPORTED_IMAGE_TYPES.has(file.type))) {
    errors.push("Use JPG, PNG, or WebP product images.");
  }

  const displayName = typeof displayNameValue === "string" ? displayNameValue.trim().slice(0, 48) : "";

  if (errors.length > 0 || !scene) {
    return { errors, ok: false };
  }

  return {
    displayName,
    files,
    ok: true,
    outputCount: outputValue,
    scene,
  };
}
