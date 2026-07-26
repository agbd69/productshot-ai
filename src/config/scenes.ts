/**
 * Product-image scenes (post-pivot from portrait/ID-photo, 2026-07-26).
 *
 * Each scene drives a distinct Flux Pro v1.1 prompt that targets a real
 * e-commerce listing pain point (white background, lifestyle context,
 * seasonal promo, model-on, multi-angle detail page).
 */

export const PRODUCT_SCENES = [
  {
    description: "Amazon / Temu 主图必备：纯白底 + 产品占比 85%+ + 无文字水印。抠图后 AI 重新打光，让产品看起来像棚拍。",
    id: "white-bg",
    title: "纯白底主图",
  },
  {
    description: "把产品放进生活场景（咖啡桌、厨房、办公室、户外）。让买家一眼看到产品使用场景。",
    id: "lifestyle",
    title: "生活化场景",
  },
  {
    description: "618 / 黑五 / 圣诞 / 新年促销主图。AI 加促销标和节日元素，符合各平台节日营销节奏。",
    id: "festival",
    title: "节日促销",
  },
  {
    description: "服装/鞋帽/配饰类：把产品穿在 AI 模特身上。多肤色、多尺码、多姿态，一键生成全 SKU 矩阵。",
    id: "model-wearing",
    title: "AI 模特上身",
  },
  {
    description: "详情页用：多角度（正面/侧面/45°/俯视/特写）+ 多焦点。一张产品图生成整套详情页素材。",
    id: "detail-page",
    title: "详情页多角度",
  },
] as const;

export type ProductSceneId = (typeof PRODUCT_SCENES)[number]["id"];

/**
 * Backwards-compatible alias for callers that still reference `MvpSceneId`
 * (the pre-pivot portrait scene id). Once the API surface is migrated, this
 * alias can be removed.
 */
export type MvpSceneId = ProductSceneId;

export type ScenePromptOptions = {
  category?: "apparel" | "home" | "beauty" | "food" | "3c";
};

export function getScenePrompt(scene: MvpSceneId, outputCount: number, options: ScenePromptOptions = {}) {
  const categoryHint = categoryHintFor(options.category);
  const scenePrompt = scenePrompts[scene];

  // We use Flux Kontext with a reference image. The prompt tells Kontext what
  // to do with the reference (transform it into the scene) — it is NOT a
  // description of the end product. Anything that reads as "a guitar on a
  // white background" is wrong: the model has the image as the visual anchor
  // and needs instructions on re-staging it.
  return `${scenePrompt}

Across all ${outputCount} images:
- Photorealistic, sharp, no motion blur, no over-processing
- Brand-true colors (no color shift, no filter tint)
- No watermarks, logos, or text overlays inside the image
- No fake UI elements, fake badges, or fake reviews
- Preserve the product silhouette, branding, and proportions of the reference exactly
- Each image should be a coherent variation of the same scene (consistent lighting and palette across the batch)
- Aspect ratio: ${aspectRatioHint(scene)}

${categoryHint}
`;
}

function categoryHintFor(category: ScenePromptOptions["category"] | undefined): string {
  switch (category) {
    case "apparel":
      return "Apparel context: respect fabric texture, drape, seams, prints. Show fit and scale on the human form when applicable.";
    case "home":
      return "Home goods context: show scale relative to a human or common object. Respect material (wood, metal, fabric, glass).";
    case "beauty":
      return "Beauty context: preserve product color exactly. Show texture, finish (matte/glossy), and packaging details. Soft flattering light, no harsh shadows.";
    case "food":
      return "Food context: show product in edible context. Preserve ingredient colors. Steam, condensation, or garnish when relevant.";
    case "3c":
      return "3C context: show scale, ports, and key features. Clean tech aesthetic, neutral background, sharp edges.";
    default:
      return "Generic product context: respect product category conventions, materials, and scale.";
  }
}

const scenePrompts: Record<ProductSceneId, string> = {
  "white-bg": `Re-stage the product from the reference image as a pure-white e-commerce main image.

- Replace the existing background with pure white (#FFFFFF).
- Add a subtle soft contact shadow under the product to ground it.
- The product is the only subject. Nothing else in frame.
- Soft, even, diffused studio lighting (no harsh highlights, no colored gels).
- Camera at a slight 3/4 angle (not dead-on frontal) to give the product dimension.
- Leave 5% padding on each side so the image can be cropped for different platforms.
- Do not add any text, watermarks, badges, or UI chrome.
- Generate ${1 /* placeholder; count is appended by the wrapper */} variations of this scene with slightly different angles and lighting.`,

  lifestyle: `Re-stage the product from the reference image as a lifestyle context shot.

- Place the product in a real environment appropriate to its category:
  coffee mug on a wooden kitchen table with morning light; candle on a
  bathroom shelf; phone on a styled desk; backpack on a subway seat.
- Environment is warm and inviting, not sterile.
- Lighting is natural-feeling (window light, golden hour, soft overcast).
- Other props in frame are tasteful and do not compete with the product.
- Shallow depth of field (f/2.8 feel) — product sharp, environment softly blurred.
- The product silhouette, branding, and proportions must match the reference exactly.`,

  festival: `Re-stage the product from the reference image as a seasonal / promotional e-commerce main image.

- Add visible seasonal cues around the product (subtle snowflakes for winter
  sale, red and gold accents for Chinese New Year, gift boxes and ribbons
  for Black Friday, hearts for Valentine's) but the product remains the hero.
- Reserve a clean promo overlay zone in the top-left or top-right corner for
  the merchant's own text — do NOT render any text inside the image.
- Mood is festive but not tacky.
- Background can carry a soft gradient (warm gold for Lunar New Year, deep
  red for Valentine's, charcoal for Black Friday).
- The product must look like it belongs in this season.`,

  "model-wearing": `Re-stage the product from the reference image by showing it worn or held by an AI model.

- Model is diverse across the batch (vary age, ethnicity, body type, gender
  presentation).
- Fit and proportion of the product on the model must be realistic — no
  warped seams, no distorted fabric, no floating accessories.
- Model's pose is natural and approachable (not stiff mannequin).
- Product colors and material are true to the reference.
- Background is a clean studio or a softly-lit lifestyle setting; never busy.
- The product is the focal point — the model exists to show fit and scale.`,

  "detail-page": `Re-stage the product from the reference image as a coherent multi-angle batch for the product detail page.

- Across the batch, show the product from different angles (front, 45°,
  side, back, top-down, close-up texture) and highlight different details
  (logo, seam, port, texture, label).
- All images share the same lighting, color, and material treatment so they
  look like a single professional photo shoot.
- Background is a consistent neutral (warm gray or soft white) across the batch.
- Each image stands alone but the batch reads as a coherent set.`,
};

function aspectRatioHint(scene: ProductSceneId): string {
  switch (scene) {
    case "white-bg":
    case "festival":
      return "1:1 (square) — Amazon / Temu / Shopify main image hero";
    case "lifestyle":
    case "detail-page":
      return "4:3 (landscape) — most marketplaces and PDPs";
    case "model-wearing":
      return "3:4 (portrait) — apparel / outfit shots, vertical mobile";
  }
}
