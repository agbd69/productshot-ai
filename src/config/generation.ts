import type { GenerationScene, GenerationStyle } from "@/types/generation";

/**
 * Post-pivot: scene catalogue now covers the end-to-end e-commerce product
 * image flow (white-bg / lifestyle / festival / model-wearing / detail-page)
 * rather than the prior portrait/ID-photo scenes.
 */
export const generationScenes: GenerationScene[] = [
  {
    backgroundOptions: ["pure white", "soft gray", "off-white"],
    baseCredits: 4,
    description: "Amazon / Temu main image. Pure white #FFFFFF, product occupies 85%+, no text overlay.",
    estimatedSeconds: 30,
    id: "white-bg",
    outfitOptions: [],
    title: "Pure white background",
  },
  {
    backgroundOptions: ["kitchen", "office", "outdoor", "studio", "cafe"],
    baseCredits: 8,
    description: "Lifestyle context. Show the product in real environments to lift conversion.",
    estimatedSeconds: 45,
    id: "lifestyle",
    outfitOptions: [],
    title: "Lifestyle context",
  },
  {
    backgroundOptions: ["618", "Black Friday", "Christmas", "Lunar New Year", "Valentine's Day"],
    baseCredits: 6,
    description: "Seasonal / promotional hero with a clean promo overlay zone reserved for the merchant.",
    estimatedSeconds: 40,
    id: "festival",
    outfitOptions: [],
    title: "Festival promotion",
  },
  {
    backgroundOptions: ["studio", "outdoor", "lifestyle"],
    baseCredits: 12,
    description: "AI model wearing or holding the product. Diverse models, true-to-product colors.",
    estimatedSeconds: 90,
    id: "model-wearing",
    outfitOptions: ["men's", "women's", "unisex", "kids'"],
    title: "AI model",
  },
  {
    backgroundOptions: ["warm gray", "soft white"],
    baseCredits: 10,
    description: "Multi-angle batch (front, 45°, side, back, top-down, detail) for product detail pages.",
    estimatedSeconds: 75,
    id: "detail-page",
    outfitOptions: [],
    title: "Detail page angles",
  },
];

export const styleOptions = {
  ageRanges: ["auto", "18-25", "26-35", "36-50", "50+"] as const,
  expressions: ["natural", "confident", "soft-smile", "serious"] as const,
  genders: ["auto", "feminine", "masculine", "neutral"] as const,
  outputCounts: [2, 4, 6, 8] as const,
  resolutions: ["standard", "hd"] as const,
};

export const defaultGenerationStyle: GenerationStyle = {
  ageRange: "auto",
  background: generationScenes[0].backgroundOptions[0],
  expression: "natural",
  gender: "auto",
  outfit: generationScenes[0].outfitOptions[0] ?? "studio",
  outputCount: 4,
  resolution: "hd",
};

export function getGenerationScene(sceneId: string) {
  return generationScenes.find((scene) => scene.id === sceneId);
}
