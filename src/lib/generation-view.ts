import { PRODUCT_SCENES, type MvpSceneId } from "@/config/scenes";
import type { GenerationRecord } from "@/lib/server/generations";

export function getSceneDisplayName(sceneId: MvpSceneId) {
  return PRODUCT_SCENES.find((scene) => scene.id === sceneId)?.title ?? sceneId;
}

export function getGenerationStatusLabel(status: GenerationRecord["status"]) {
  const labels: Record<GenerationRecord["status"], string> = {
    completed: "已完成",
    failed: "失败",
    processing: "生成中",
    queued: "排队中",
  };

  return labels[status];
}
