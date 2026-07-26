import { getGenerationScene } from "@/config/generation";
import { validateDraftInput } from "@/lib/generation-draft";
import type { DraftInput } from "@/types/generation";

export type GenerationJobStatus = "queued" | "processing" | "completed" | "failed";

export type MockGenerationImage = {
  id: string;
  label: string;
  watermark: boolean;
};

export type GenerationJob = {
  createdAt: number;
  credits: number;
  estimatedSeconds: number;
  id: string;
  images: MockGenerationImage[];
  input: DraftInput;
  progress: number;
  sceneTitle: string;
  status: GenerationJobStatus;
};

export function createMockGenerationJob(input: DraftInput, now = Date.now()): GenerationJob {
  const validation = validateDraftInput(input);
  if (!validation.ok) {
    throw new Error(validation.errors.join(" "));
  }

  const scene = getGenerationScene(input.sceneId);

  return {
    createdAt: now,
    credits: validation.credits,
    estimatedSeconds: validation.estimatedSeconds,
    id: encodeJobId(input, now),
    images: [],
    input,
    progress: 8,
    sceneTitle: scene?.title ?? input.sceneId,
    status: "queued",
  };
}

export function getMockJobSnapshot(job: GenerationJob, now = Date.now()): GenerationJob {
  const elapsedSeconds = Math.max(Math.floor((now - job.createdAt) / 1000), 0);
  const ratio = Math.min(elapsedSeconds / job.estimatedSeconds, 1);

  if (ratio >= 1) {
    return {
      ...job,
      images: createMockImages(job),
      progress: 100,
      status: "completed",
    };
  }

  if (ratio >= 0.2) {
    return {
      ...job,
      progress: Math.max(25, Math.round(ratio * 100)),
      status: "processing",
    };
  }

  return {
    ...job,
    progress: Math.max(8, Math.round(ratio * 25)),
    status: "queued",
  };
}

export function encodeJobId(input: DraftInput, createdAt: number) {
  const payload = Buffer.from(JSON.stringify({ createdAt, input })).toString("base64url");
  return `job_${payload}`;
}

export function decodeJobId(id: string): GenerationJob | null {
  if (!id.startsWith("job_")) return null;

  try {
    const raw = Buffer.from(id.slice(4), "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as { createdAt: number; input: DraftInput };
    return createMockGenerationJob(parsed.input, parsed.createdAt);
  } catch {
    return null;
  }
}

function createMockImages(job: GenerationJob): MockGenerationImage[] {
  return Array.from({ length: job.input.style.outputCount }, (_, index) => ({
    id: `${job.id}_img_${index + 1}`,
    label: `${job.sceneTitle} ${index + 1}`,
    watermark: job.input.style.resolution === "standard",
  }));
}
