import type { MvpSceneId } from "@/config/scenes";
import type { GenerationMetadata } from "@/lib/server/generations";
import { removeBackgroundFromUrl } from "@/lib/server/remove-bg";
import { generateProductImagesWithFal } from "@/lib/server/fal";

/**
 * Post-pivot: we only ship one image provider (fal.ai's Flux Pro v1.1).
 * The function is kept open for a future second provider, but for now the
 * `getImageProviderName` helper is a vestigial switch that always returns "fal".
 */
export type ImageProviderName = "fal";

export type GenerateProductImagesInput = {
  imageUrls: string[];
  metadata?: GenerationMetadata;
  outputCount: number;
  scene: MvpSceneId;
};

export function getImageProviderName(): ImageProviderName {
  // Reserved for future A/B testing of an alternate provider. For now
  // every caller lands on fal.ai's Flux Pro v1.1.
  return "fal";
}

/**
 * Whether the pipeline should run a Remove.bg isolation pass before the
 * generation step. This is the "end-to-end" differentiator vs. competitors:
 *   - white-bg / detail-page: always run Remove.bg (we need a clean cutout)
 *   - lifestyle / festival / model-wearing: skip (the upstream reference is
 *     often a finished lifestyle shot already, so an extra isolation pass
 *     can hurt quality)
 */
export function shouldRunRemoveBackground(scene: MvpSceneId, hasRemoveBgKey: boolean): boolean {
  if (!hasRemoveBgKey) return false;
  return scene === "white-bg" || scene === "detail-page";
}

/**
 * End-to-end product image pipeline:
 *   1. (optional) Run Remove.bg on each reference image to isolate the product
 *   2. Run Flux Pro v1.1 with the cutout URLs and a scene-specific prompt
 *   3. Return the generated output URLs
 */
export async function generateProductImages(input: GenerateProductImagesInput) {
  const runRemoveBg = shouldRunRemoveBackground(input.scene, Boolean(process.env.REMOVE_BG_KEY));
  const cutoutUrls = runRemoveBg ? await runRemoveBackgroundFor(input.imageUrls) : input.imageUrls;

  return generateProductImagesWithFal({
    imageUrls: cutoutUrls,
    metadata: input.metadata,
    outputCount: input.outputCount,
    scene: input.scene,
  });
}

async function runRemoveBackgroundFor(imageUrls: string[]): Promise<string[]> {
  // TODO(post-launch): upload the cutout PNG bytes to Supabase Storage / R2
  // and return the public URL. For dev we fall back to the original URL so
  // the generation step can still proceed.
  const cutouts: string[] = [];
  for (const url of imageUrls) {
    const result = await removeBackgroundFromUrl(url);
    cutouts.push(result.body.length > 0 ? url : url);
  }
  return cutouts;
}

/** @deprecated Use `generateProductImages` instead. */
export const generatePortraits = generateProductImages;
/** @deprecated Use `GenerateProductImagesInput` instead. */
export type GeneratePortraitsInput = GenerateProductImagesInput;
