import { NextResponse } from "next/server";

import { validateDraftInput } from "@/lib/generation-draft";
import type { DraftInput } from "@/types/generation";

export async function POST(request: Request) {
  const input = (await request.json()) as DraftInput;
  const validation = validateDraftInput(input);
  if (!validation.ok) return NextResponse.json({ errors: validation.errors, status: "invalid" }, { status: 400 });
  const id = `draft_${Date.now().toString(36)}`;
  return NextResponse.json({
    credits: validation.credits,
    estimatedSeconds: validation.estimatedSeconds,
    id,
    redirectUrl: `/generations/${id}`,
    status: "draft",
  });
}
