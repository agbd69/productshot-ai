import { describe, expect, test } from "vitest";

import { getImageProviderName, shouldRunRemoveBackground } from "./image-provider";

describe("getImageProviderName", () => {
  test("always returns fal (single-provider post-pivot)", () => {
    expect(getImageProviderName()).toBe("fal");
  });
});

describe("shouldRunRemoveBackground", () => {
  test("runs Remove.bg for white-bg when a key is configured", () => {
    expect(shouldRunRemoveBackground("white-bg", true)).toBe(true);
  });

  test("runs Remove.bg for detail-page when a key is configured", () => {
    expect(shouldRunRemoveBackground("detail-page", true)).toBe(true);
  });

  test("skips Remove.bg for lifestyle / festival / model-wearing even with a key", () => {
    expect(shouldRunRemoveBackground("lifestyle", true)).toBe(false);
    expect(shouldRunRemoveBackground("festival", true)).toBe(false);
    expect(shouldRunRemoveBackground("model-wearing", true)).toBe(false);
  });

  test("never runs Remove.bg when no key is configured", () => {
    expect(shouldRunRemoveBackground("white-bg", false)).toBe(false);
    expect(shouldRunRemoveBackground("detail-page", false)).toBe(false);
  });
});
