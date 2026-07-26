import { getSupabaseAdmin } from "@/lib/server/supabase";
import type { MvpSceneId } from "@/config/scenes";

export type GenerationMetadata = {
  category?: "apparel" | "home" | "beauty" | "food" | "3c";
  displayName?: string;
};

export type GenerationRecord = {
  created_at?: string;
  credits_used: number;
  error: string | null;
  id: string;
  input_image_urls: string[];
  metadata: GenerationMetadata;
  output_image_urls: string[];
  scene: MvpSceneId;
  status: "queued" | "processing" | "completed" | "failed";
  user_id: string;
};

export async function createGenerationRecord(input: {
  creditsUsed: number;
  inputImageUrls: string[];
  metadata?: GenerationMetadata;
  scene: MvpSceneId;
  userId: string;
}) {
  const supabase = getSupabaseAdmin();
  const row = {
    credits_used: input.creditsUsed,
    input_image_urls: input.inputImageUrls,
    metadata: input.metadata ?? {},
    scene: input.scene,
    status: "processing",
    user_id: input.userId,
  };

  const { data, error } = await supabase
    .from("generations")
    .insert(row)
    .select("*")
    .single();

  if (error?.message.includes("metadata")) {
    const fallbackRow = {
      credits_used: row.credits_used,
      input_image_urls: row.input_image_urls,
      scene: row.scene,
      status: row.status,
      user_id: row.user_id,
    };
    const { data: fallbackData, error: fallbackError } = await supabase.from("generations").insert(fallbackRow).select("*").single();
    if (fallbackError) throw fallbackError;
    return { metadata: input.metadata ?? {}, ...fallbackData } as GenerationRecord;
  }

  if (error) throw error;
  return data as GenerationRecord;
}

export async function updateGenerationRecord(
  id: string,
  patch: Partial<Pick<GenerationRecord, "error" | "output_image_urls" | "status">> & { fal_request_id?: string },
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generations")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as GenerationRecord;
}

export async function getGenerationForUser(id: string, userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("generations").select("*").eq("id", id).eq("user_id", userId).single();
  if (error) throw error;
  return data as GenerationRecord;
}

export async function listGenerationsForUser(userId: string, limit = 12) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as GenerationRecord[];
}
