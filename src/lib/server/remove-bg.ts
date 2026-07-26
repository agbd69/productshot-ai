import { requireEnv } from "@/lib/server/env";

/**
 * Remove.bg integration for product image isolation.
 *
 * The AI product image flow needs a clean product cutout before Flux Pro v1.1
 * can re-render it into lifestyle / festival / detail-page scenes without
 * dragging along the original messy background.
 *
 * Pricing reference (2026-Q3): $0.20–0.50 per image, drops to ~$0.02 on the
 * subscription plan. We pay per call and pass the cutout URL through to Flux.
 *
 * Reference: https://www.remove.bg/api
 */

const REMOVE_BG_ENDPOINT = "https://api.remove.bg/v1.0/removebg";

export const REMOVE_BG_DEFAULT_SIZE = "auto";
export const REMOVE_BG_DEFAULT_FORMAT = "png";

type RemoveBgResponse = {
  /** Binary PNG body — handled by the caller. */
  body: Buffer;
  /** Charged credits (Remove.bg header). */
  charged?: number;
  /** Detected foreground type (Remove.bg header). */
  foregroundType?: string;
  /** Result image dimensions (Remove.bg headers). */
  resultHeight?: number;
  resultWidth?: number;
};

export type CutoutResult = {
  /** Public URL of the cutout PNG (uploaded to storage by the caller). */
  cutoutUrl: string;
  /** Original Remove.bg raw bytes (kept for retry / debugging). */
  raw: Buffer;
  /** Optional diagnostics. */
  charged?: number;
  foregroundType?: string;
  resultHeight?: number;
  resultWidth?: number;
};

/**
 * Call Remove.bg with a public image URL and return the cutout bytes.
 * The caller is responsible for uploading the bytes to object storage and
 * producing a `cutoutUrl` that the rest of the pipeline can fetch.
 */
export async function removeBackgroundFromUrl(imageUrl: string, options: { format?: string; size?: string } = {}): Promise<RemoveBgResponse> {
  const apiKey = requireEnv("REMOVE_BG_KEY");
  const formData = new URLSearchParams();
  formData.append("image_url", imageUrl);
  formData.append("size", options.size ?? REMOVE_BG_DEFAULT_SIZE);
  formData.append("format", options.format ?? REMOVE_BG_DEFAULT_FORMAT);

  const response = await fetch(REMOVE_BG_ENDPOINT, {
    body: formData,
    headers: {
      "X-Api-Key": apiKey,
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Remove.bg failed: ${response.status} ${response.statusText} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    body: Buffer.from(arrayBuffer),
    charged: readHeaderNumber(response, "x-credits-charged"),
    foregroundType: response.headers.get("x-foreground-type") ?? undefined,
    resultHeight: readHeaderNumber(response, "x-result-height"),
    resultWidth: readHeaderNumber(response, "x-result-width"),
  };
}

function readHeaderNumber(response: Response, name: string): number | undefined {
  const value = response.headers.get(name);
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
