import { randomUUID } from "node:crypto";

import { requireEnv } from "@/lib/server/env";
import { getSupabaseAdmin } from "@/lib/server/supabase";

export async function uploadReferenceImage(userId: string, file: File) {
  const supabase = getSupabaseAdmin();
  const bucket = requireEnv("SUPABASE_STORAGE_BUCKET");
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
