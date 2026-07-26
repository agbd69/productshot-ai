import { NextResponse } from "next/server";

import { createMockGenerationJob } from "@/lib/generation-job";
import type { DraftInput } from "@/types/generation";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as DraftInput;
    const job = createMockGenerationJob(input);

    return NextResponse.json({
      job,
      redirectUrl: `/generations/${job.id}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        errors: [error instanceof Error ? error.message : "Could not create generation job."],
        status: "invalid",
      },
      { status: 400 },
    );
  }
}
