import { NextResponse } from "next/server";

import { decodeJobId, getMockJobSnapshot } from "@/lib/generation-job";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = decodeJobId(id);

  if (!job) {
    return NextResponse.json({ error: "Generation job not found." }, { status: 404 });
  }

  return NextResponse.json({
    job: getMockJobSnapshot(job),
  });
}
