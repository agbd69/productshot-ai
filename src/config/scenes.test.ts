import { describe, expect, test } from "vitest";

import { getScenePrompt, PRODUCT_SCENES } from "@/config/scenes";

describe("PRODUCT_SCENES catalogue", () => {
  test("contains the five post-pivot product scenes", () => {
    expect(PRODUCT_SCENES.map((s) => s.id).sort()).toEqual([
      "detail-page",
      "festival",
      "lifestyle",
      "model-wearing",
      "white-bg",
    ]);
  });
});

describe("getScenePrompt", () => {
  test("white-bg prompt re-stages the product on pure white (#FFFFFF) with no text", () => {
    const prompt = getScenePrompt("white-bg", 1);
    // Transformation style: "re-stage" or "replace" the background
    expect(prompt).toMatch(/re-stage|replace/i);
    expect(prompt).toContain("pure white (#FFFFFF)");
    expect(prompt).toContain("1:1 (square)");
    expect(prompt).toContain("No watermarks, logos, or text overlays");
  });

  test("lifestyle prompt places the product in a real environment with shallow DoF", () => {
    const prompt = getScenePrompt("lifestyle", 4);
    expect(prompt).toContain("lifestyle context");
    expect(prompt).toMatch(/shallow depth of field|f\/2\.8/i);
    expect(prompt).toContain("4:3 (landscape)");
  });

  test("festival prompt leaves a clean empty rectangle (no hallucinated text)", () => {
    const prompt = getScenePrompt("festival", 2);
    expect(prompt).toContain("seasonal");
    expect(prompt).toMatch(/empty (rectangle|region|zone)/i);
    // The product's own printed brand text is allowed, but no other text.
    expect(prompt).toMatch(/no text|no characters|no letters/i);
    expect(prompt).not.toMatch(/reserve a clean promo overlay zone/i);
  });

  test("model-wearing prompt re-stages the product on an AI model with brand-true colors", () => {
    const prompt = getScenePrompt("model-wearing", 1);
    expect(prompt).toContain("AI model");
    expect(prompt).toMatch(/brand-true colors|true to the reference/i);
    expect(prompt).toContain("3:4 (portrait)");
  });

  test("detail-page prompt produces a coherent multi-angle batch", () => {
    const prompt = getScenePrompt("detail-page", 6);
    expect(prompt).toContain("multi-angle");
    expect(prompt).toMatch(/coherent (multi-angle )?batch|across the batch/i);
  });

  test("apparel category hint injects fabric + fit guidance", () => {
    const prompt = getScenePrompt("white-bg", 1, { category: "apparel" });
    expect(prompt).toContain("Apparel context: respect fabric texture");
  });

  test("prompt preserves the reference product exactly (Kontext behavior contract)", () => {
    // Kontext uses the reference image as the visual anchor. The prompt must
    // remind the model to keep the silhouette / branding / proportions intact.
    for (const scene of ["white-bg", "lifestyle", "festival", "model-wearing", "detail-page"] as const) {
      const prompt = getScenePrompt(scene, 1);
      expect(prompt).toMatch(/silhouette|branding|proportions|reference/i);
    }
  });
});
