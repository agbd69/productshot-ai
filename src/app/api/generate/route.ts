import { NextResponse } from "next/server";

import { calculateMvpGenerationCredits, parseMvpGenerationForm } from "@/lib/mvp-generation";
import { getAuthenticatedAppUser } from "@/lib/server/auth";
import { getErrorStatus } from "@/lib/server/api-errors";
import { createGenerationRecord, updateGenerationRecord } from "@/lib/server/generations";
import { generateProductImages } from "@/lib/server/image-provider";
import { uploadReferenceImage } from "@/lib/server/storage";
import { addCredits, spendCredits } from "@/lib/server/users";

export const maxDuration = 60;

export async function POST(request: Request) {
  let generationId: string | null = null;
  let appUserId: string | null = null;
  let creditsUsed = 0;
  let creditsSpent = false;

  try {
    const appUser = await getAuthenticatedAppUser();
    appUserId = appUser.id;

    const form = parseMvpGenerationForm(await request.formData());
    if (!form.ok) {
      return NextResponse.json({ errors: form.errors }, { status: 400 });
    }

    creditsUsed = calculateMvpGenerationCredits(form.scene, form.outputCount);
    const metadata = {
      displayName: form.displayName,
    };
    const inputImageUrls = await Promise.all(form.files.map((file) => uploadReferenceImage(appUser.id, file)));
    const generation = await createGenerationRecord({
      creditsUsed,
      inputImageUrls,
      metadata,
      scene: form.scene,
      userId: appUser.id,
    });

    generationId = generation.id;
    await spendCredits(appUser.id, creditsUsed);
    creditsSpent = true;

    const result = await generateProductImages({
      imageUrls: inputImageUrls,
      metadata,
      outputCount: form.outputCount,
      qualityTier: appUser.quality_tier,
      scene: form.scene,
    });

    await updateGenerationRecord(generation.id, {
      fal_request_id: result.requestId,
      output_image_urls: result.outputUrls,
      status: "completed",
    });

    return NextResponse.json({
      id: generation.id,
      redirectUrl: `/generations/${generation.id}?name=${encodeURIComponent(metadata.displayName)}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败。";

    if (generationId) {
      await updateGenerationRecord(generationId, {
        error: message,
        status: "failed",
      }).catch(() => undefined);
    }

    if (creditsSpent && appUserId && creditsUsed > 0) {
      await addCredits(appUserId, creditsUsed).catch(() => undefined);
    }

    return NextResponse.json({ errors: [message] }, { status: getErrorStatus(message) });
  }
}
