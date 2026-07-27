import { fal } from "@fal-ai/client";

import { QUALITY_TIER_RANK, type QualityTier } from "@/config/pricing";
import { getScenePrompt, type MvpSceneId } from "@/config/scenes";
import type { GenerationMetadata } from "@/lib/server/generations";
import { requireEnv } from "@/lib/server/env";

/**
 * Image model for product image generation.
 *
 * We use **fal-ai/flux-pro/kontext** (BFL's FLUX.1 Kontext [pro]) because it
 * accepts a reference image (`image_url`) and a prompt that describes the
 * transformation. This is the only fal.ai model on this stack that can preserve
 * the actual product from a reference photo while changing the context
 * (white-bg / lifestyle / festival / model-wearing / detail-page).
 *
 * Switched from `fal-ai/flux-pro/v1.1` (text-only) and the prior
 * `fal-ai/bytedance/seedream/v4.5/edit` (portrait edit) as part of the
 * portraitpro-ai → ProductShot.ai pivot (2026-07-26).
 *
 * Reference: https://fal.ai/models/fal-ai/flux-pro/kontext
 */
export const FAL_MODEL_ID = "fal-ai/flux-pro/kontext";

/**
 * Tier-based model selection (2026-07-26, post credit-pack pivot).
 *
 * Kontext is the only model that reliably preserves the product from a
 * reference image. The tier difference is in **output resolution** + API
 * access, not the model itself. We always use Kontext; the `resolution`
 * field and the per-scene aspect ratio are picked from the user's tier.
 *
 * Pricing (per generated image, current fal.ai rates):
 *   - standard  (1k / ~1024px)  → $0.07/image
 *   - pro       (1k / up to 2048px) → $0.07/image (same call, larger crop)
 *   - business  (2k / 2048px)  → $0.14/image
 *   - agency    (2k / 2048px + API) → $0.14/image
 */
export function falResolutionForTier(tier: QualityTier): "1k" | "2k" {
  return QUALITY_TIER_RANK[tier] >= QUALITY_TIER_RANK.business ? "2k" : "1k";
}

type FalImage = {
  url?: string;
};

type FalImageResult = {
  images?: FalImage[];
};

type BuildFalGenerationRequestInput = {
  batchSize: number;
  imageUrl: string;
  prompt: string;
  qualityTier: QualityTier;
};

function aspectRatioForScene(scene: MvpSceneId): "1:1" | "4:3" | "3:4" | "16:9" {
  // Per-platform defaults:
  //   - white-bg  → 1:1   (Amazon / Temu / Shopify main image)
  //   - lifestyle → 4:3   (most marketplaces, eBay)
  //   - festival  → 1:1   (hero promo image, scaled down for thumbnails)
  //   - model-wearing → 3:4 (apparel / outfit shots, vertical)
  //   - detail-page → 4:3 (coherent batch across the detail page)
  switch (scene) {
    case "white-bg":
    case "festival":
      return "1:1";
    case "lifestyle":
    case "detail-page":
      return "4:3";
    case "model-wearing":
      return "3:4";
  }
}

export function buildFalGenerationRequest({
  batchSize,
  imageUrl,
  prompt,
  qualityTier,
  scene,
}: BuildFalGenerationRequestInput & { scene: MvpSceneId }) {
  return {
    input: {
      aspect_ratio: aspectRatioForScene(scene),
      enable_safety_checker: true,
      enhance_prompt: true,
      guidance_scale: 3.5,
      image_url: imageUrl,
      num_images: batchSize,
      output_format: "png" as const,
      prompt,
      // Resolution cap from the user's tier. Standard/Pro get the cheaper
      // 1K call; Business/Agency pay for 2K output.
      resolution: falResolutionForTier(qualityTier),
      safety_tolerance: "2" as const,
    },
    logs: true,
    pollInterval: 5000,
  };
}

/**
 * Generate product images using Flux Pro Kontext.
 *
 * The first reference image is the product silhouette / branding we want to
 * preserve. Kontext uses it as the visual anchor; the prompt describes how to
 * re-stage it (white background, lifestyle scene, etc.).
 *
 * Multi-image: if the merchant uploads more than one product image, the
 * downstream prompt still uses the first one as the anchor. The other URLs
 * are kept on the metadata record for future IP-Adapter work.
 */
export async function generateProductImagesWithFal(input: {
  imageUrls: string[];
  metadata?: GenerationMetadata;
  outputCount: number;
  qualityTier: QualityTier;
  scene: MvpSceneId;
}) {
  if (input.imageUrls.length === 0) {
    throw new Error("At least one reference image is required for product generation.");
  }

  fal.config({
    credentials: requireEnv("FAL_KEY"),
  });

  const referenceImageUrl = input.imageUrls[0];
  const prompt = getScenePrompt(input.scene, input.outputCount);
  const batches = splitIntoBatches(input.outputCount, 4);
  const outputUrls: string[] = [];
  let lastRequestId: string | undefined;

  for (const batchSize of batches) {
    const result = await fal.subscribe(FAL_MODEL_ID, buildFalGenerationRequest({
      batchSize,
      imageUrl: referenceImageUrl,
      prompt,
      qualityTier: input.qualityTier,
      scene: input.scene,
    }));

    lastRequestId = result.requestId;
    const data = result.data as FalImageResult;
    outputUrls.push(...(data.images ?? []).map((image) => image.url).filter((url): url is string => Boolean(url)));
  }

  if (outputUrls.length === 0) {
    throw new Error("Fal returned no output images.");
  }

  return {
    outputUrls,
    requestId: lastRequestId,
  };
}

function splitIntoBatches(total: number, maxBatchSize: number) {
  const batches: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    const next = Math.min(remaining, maxBatchSize);
    batches.push(next);
    remaining -= next;
  }

  return batches;
}
