import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/server/auth";
import { getErrorStatus } from "@/lib/server/api-errors";
import { getGenerationForUser } from "@/lib/server/generations";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, appUser] = await Promise.all([params, getAuthenticatedAppUser()]);
    const generation = await getGenerationForUser(id, appUser.id);
    return NextResponse.json({ generation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "未找到生成任务。";
    return NextResponse.json({ errors: [message] }, { status: getErrorStatus(message, 404) });
  }
}
