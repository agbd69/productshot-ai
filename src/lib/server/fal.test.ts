import { describe, expect, test } from "vitest";

import { buildFalGenerationRequest, FAL_MODEL_ID, falResolutionForTier } from "@/lib/server/fal";

describe("Fal Flux Pro Kontext request", () => {
  test("uses Flux Pro Kontext as the default Fal model (pivoted from Flux Pro v1.1 to enable image reference)", () => {
    expect(FAL_MODEL_ID).toBe("fal-ai/flux-pro/kontext");
  });

  test("builds a 1:1 white-bg request with the reference image as image_url", () => {
    const request = buildFalGenerationRequest({
      batchSize: 2,
      imageUrl: "https://example.com/product.png",
      prompt: "Re-stage this product on a pure white background",
      qualityTier: "pro",
      scene: "white-bg",
    });

    expect(request.input).toMatchObject({
      aspect_ratio: "1:1",
      enable_safety_checker: true,
      enhance_prompt: true,
      guidance_scale: 3.5,
      image_url: "https://example.com/product.png",
      num_images: 2,
      output_format: "png",
      prompt: "Re-stage this product on a pure white background",
    });
    expect(request.input).not.toHaveProperty("image_urls");
  });

  test("uses 4:3 for lifestyle and detail-page scenes", () => {
    expect(
      buildFalGenerationRequest({ batchSize: 1, imageUrl: "x", prompt: "p", qualityTier: "pro", scene: "lifestyle" })
        .input.aspect_ratio,
    ).toBe("4:3");
    expect(
      buildFalGenerationRequest({ batchSize: 1, imageUrl: "x", prompt: "p", qualityTier: "pro", scene: "detail-page" })
        .input.aspect_ratio,
    ).toBe("4:3");
  });

  test("uses 3:4 for model-wearing scene", () => {
    expect(
      buildFalGenerationRequest({ batchSize: 1, imageUrl: "x", prompt: "p", qualityTier: "pro", scene: "model-wearing" })
        .input.aspect_ratio,
    ).toBe("3:4");
  });

  test("uses 1:1 for festival scene", () => {
    expect(
      buildFalGenerationRequest({ batchSize: 1, imageUrl: "x", prompt: "p", qualityTier: "pro", scene: "festival" })
        .input.aspect_ratio,
    ).toBe("1:1");
  });
});

describe("tier-based resolution routing", () => {
  test("standard tier uses 1k resolution (cheapest Kontext call)", () => {
    expect(falResolutionForTier("standard")).toBe("1k");
  });

  test("pro tier uses 1k resolution (same call, larger crop)", () => {
    expect(falResolutionForTier("pro")).toBe("1k");
  });

  test("business tier upgrades to 2k resolution (2x MP, 2x cost)", () => {
    expect(falResolutionForTier("business")).toBe("2k");
  });

  test("agency tier uses 2k resolution", () => {
    expect(falResolutionForTier("agency")).toBe("2k");
  });

  test("the request picks up the tier's resolution", () => {
    const standardReq = buildFalGenerationRequest({
      batchSize: 1,
      imageUrl: "x",
      prompt: "p",
      qualityTier: "standard",
      scene: "white-bg",
    });
    const businessReq = buildFalGenerationRequest({
      batchSize: 1,
      imageUrl: "x",
      prompt: "p",
      qualityTier: "business",
      scene: "white-bg",
    });

    expect(standardReq.input.resolution).toBe("1k");
    expect(businessReq.input.resolution).toBe("2k");
  });
});
