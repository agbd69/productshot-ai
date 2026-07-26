import { describe, expect, test } from "vitest";

import { calculateMvpGenerationCredits, parseMvpGenerationForm } from "./mvp-generation";

describe("calculateMvpGenerationCredits", () => {
  test("charges scene cost per generated output (post-pivot product scenes)", () => {
    expect(calculateMvpGenerationCredits("white-bg", 4)).toBe(16);
    expect(calculateMvpGenerationCredits("lifestyle", 2)).toBe(16);
    expect(calculateMvpGenerationCredits("model-wearing", 1)).toBe(12);
  });
});

describe("parseMvpGenerationForm", () => {
  test("accepts the minimum valid request for the new product scenes", () => {
    const form = new FormData();
    form.set("scene", "white-bg");
    form.set("outputCount", "4");
    form.append("images", new File(["x"], "product.png", { type: "image/png" }));

    expect(parseMvpGenerationForm(form)).toEqual({
      displayName: "",
      files: [expect.any(File)],
      ok: true,
      outputCount: 4,
      scene: "white-bg",
    });
  });

  test("accepts display name and all five product scenes", () => {
    for (const scene of ["white-bg", "lifestyle", "festival", "model-wearing", "detail-page"] as const) {
      const form = new FormData();
      form.set("scene", scene);
      form.set("outputCount", "1");
      form.set("displayName", "Listing 2026");
      form.append("images", new File(["x"], "product.jpg", { type: "image/jpeg" }));

      const parsed = parseMvpGenerationForm(form);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.scene).toBe(scene);
        expect(parsed.displayName).toBe("Listing 2026");
      }
    }
  });

  test("rejects unsupported scenes and too many outputs", () => {
    const form = new FormData();
    form.set("scene", "hanfu");
    form.set("outputCount", "12");

    expect(parseMvpGenerationForm(form)).toEqual({
      errors: ["Choose a supported product scene.", "Generate 1-8 outputs at a time.", "Upload 1-6 product images."],
      ok: false,
    });
  });
});
