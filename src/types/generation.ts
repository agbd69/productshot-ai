/**
 * Post-pivot scene id (2026-07-26): the e-commerce product image flow
 * (white-bg / lifestyle / festival / model-wearing / detail-page).
 *
 * Kept here rather than in @/config/scenes so leaf files (draft validator,
 * job creator, components) don't pull the prompt builder into their bundles.
 */
export type GenerationSceneId =
  | "white-bg"
  | "lifestyle"
  | "festival"
  | "model-wearing"
  | "detail-page";

export type GenerationStyle = {
  ageRange: "auto" | "18-25" | "26-35" | "36-50" | "50+";
  background: string;
  expression: "natural" | "confident" | "soft-smile" | "serious";
  gender: "auto" | "feminine" | "masculine" | "neutral";
  outfit: string;
  outputCount: number;
  resolution: "standard" | "hd";
};

export type DraftInput = {
  fileCount: number;
  sceneId: GenerationSceneId;
  style: GenerationStyle;
};

export type DraftValidationResult =
  | { ok: true; credits: number; estimatedSeconds: number }
  | { ok: false; errors: string[] };

export type GenerationScene = {
  backgroundOptions: string[];
  baseCredits: number;
  description: string;
  estimatedSeconds: number;
  id: GenerationSceneId;
  outfitOptions: string[];
  title: string;
};
