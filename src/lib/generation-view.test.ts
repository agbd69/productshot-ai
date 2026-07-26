import { describe, expect, test } from "vitest";

import { getGenerationStatusLabel, getSceneDisplayName } from "./generation-view";

describe("getSceneDisplayName", () => {
  test("returns compact labels for the five product scenes", () => {
    expect(getSceneDisplayName("white-bg")).toBe("纯白底主图");
    expect(getSceneDisplayName("lifestyle")).toBe("生活化场景");
    expect(getSceneDisplayName("festival")).toBe("节日促销");
    expect(getSceneDisplayName("model-wearing")).toBe("AI 模特上身");
    expect(getSceneDisplayName("detail-page")).toBe("详情页多角度");
  });

  test("falls back to the scene id when unknown", () => {
    // @ts-expect-error -- intentionally unknown scene
    expect(getSceneDisplayName("unknown-scene")).toBe("unknown-scene");
  });
});

describe("getGenerationStatusLabel", () => {
  test("formats user-facing statuses", () => {
    expect(getGenerationStatusLabel("queued")).toBe("排队中");
    expect(getGenerationStatusLabel("processing")).toBe("生成中");
    expect(getGenerationStatusLabel("completed")).toBe("已完成");
    expect(getGenerationStatusLabel("failed")).toBe("失败");
  });
});
