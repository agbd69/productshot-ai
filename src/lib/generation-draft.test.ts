import { describe, expect, test } from "vitest";

import { calculateDraftCredits, validateDraftInput } from "./generation-draft";

const validStyle = {
  ageRange: "26-35" as const,
  background: "kitchen",
  expression: "natural" as const,
  gender: "auto" as const,
  outfit: "studio",
  outputCount: 4,
  resolution: "hd" as const,
};

describe("calculateDraftCredits", () => {
  test("charges base credits per output and adds HD premium (lifestyle scene)", () => {
    // lifestyle baseCredits 8 + hd premium 3 = 11 per output; 4 outputs = 44
    expect(calculateDraftCredits("lifestyle", 4, "hd")).toBe(44);
  });

  test("keeps standard white-bg main images inexpensive", () => {
    // white-bg baseCredits 4 + 0 standard premium; 2 outputs = 8
    expect(calculateDraftCredits("white-bg", 2, "standard")).toBe(8);
  });
});

describe("validateDraftInput", () => {
  test("accepts a valid lifestyle draft", () => {
    expect(validateDraftInput({ fileCount: 3, sceneId: "lifestyle", style: validStyle })).toEqual({
      credits: 44,
      estimatedSeconds: 45,
      ok: true,
    });
  });

  test("rejects invalid reference file counts", () => {
    expect(validateDraftInput({ fileCount: 0, sceneId: "lifestyle", style: validStyle })).toEqual({
      errors: ["Upload at least 1 product image."],
      ok: false,
    });
    expect(validateDraftInput({ fileCount: 7, sceneId: "lifestyle", style: validStyle })).toEqual({
      errors: ["Upload no more than 6 product images."],
      ok: false,
    });
  });

  test("rejects unknown scene ids", () => {
    // @ts-expect-error -- intentionally invalid scene id
    expect(validateDraftInput({ fileCount: 2, sceneId: "hanfu", style: validStyle })).toEqual({
      errors: ["Choose a valid product scene."],
      ok: false,
    });
  });
});
