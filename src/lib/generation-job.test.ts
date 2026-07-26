import { describe, expect, test } from "vitest";

import { createMockGenerationJob, getMockJobSnapshot } from "./generation-job";

const input = {
  fileCount: 3,
  sceneId: "lifestyle" as const,
  style: {
    ageRange: "auto" as const,
    background: "kitchen",
    expression: "natural" as const,
    gender: "auto" as const,
    outfit: "studio",
    outputCount: 4,
    resolution: "hd" as const,
  },
};

describe("mock generation job", () => {
  test("starts queued with no images", () => {
    const job = createMockGenerationJob(input, 1000);

    expect(job.status).toBe("queued");
    expect(job.progress).toBe(8);
    expect(job.images).toEqual([]);
    expect(job.sceneTitle).toBe("Lifestyle context");
    expect(job.credits).toBe(44);
  });

  test("moves to processing halfway through the estimate", () => {
    const job = createMockGenerationJob(input, 1000);
    // lifestyle estimatedSeconds = 45; 23s in (now - createdAt = 23000ms) → 51% progress
    const snapshot = getMockJobSnapshot(job, 24000);

    expect(snapshot.status).toBe("processing");
    expect(snapshot.progress).toBeGreaterThanOrEqual(50);
    expect(snapshot.images).toEqual([]);
  });

  test("completes with the requested number of mock images", () => {
    const job = createMockGenerationJob(input, 1000);
    // lifestyle estimatedSeconds = 45; 50s in → done
    const snapshot = getMockJobSnapshot(job, 50000);

    expect(snapshot.status).toBe("completed");
    expect(snapshot.progress).toBe(100);
    expect(snapshot.images).toHaveLength(4);
  });
});
