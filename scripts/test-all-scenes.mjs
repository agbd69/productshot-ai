/**
 * Smoke test for the 5 product scene prompts against fal-ai/flux-pro/kontext.
 *
 * Calls each scene with a stock product image (coffee mug) and saves the
 * first output of each. This validates the prompt + aspect ratio + reference
 * image pipeline without going through the full Next.js app.
 *
 * Run from the project root:
 *   FAL_KEY=... npx tsx scripts/test-all-scenes.mjs
 *
 * Outputs land in scripts/output/<scene>-1.png. Cost ~$0.05 per image.
 */
import { fal } from "@fal-ai/client";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "output");
// A real product photo (coffee) from a CORS-friendly CDN. Wikipedia blocks
// hotlinking from non-browser UAs; picsum serves images with permissive CORS.
const SAMPLE_IMAGE = "https://picsum.photos/id/431/1024/1024";

const ASPECT = {
  "white-bg": "1:1",
  festival: "1:1",
  lifestyle: "4:3",
  "detail-page": "4:3",
  "model-wearing": "3:4",
};

const PROMPTS = {
  "white-bg": `Re-stage the product from the reference image as a pure-white e-commerce main image.
- Replace the existing background with pure white (#FFFFFF).
- Add a subtle soft contact shadow under the product to ground it.
- The product is the only subject. Nothing else in frame.
- Soft, even, diffused studio lighting.
- Camera at a slight 3/4 angle, not dead-on frontal.
- Leave 5% padding on each side.
- Do not add any text, watermarks, badges, or UI chrome.
- Preserve the product silhouette, branding, and proportions exactly.`,

  lifestyle: `Re-stage the product from the reference image as a lifestyle context shot.
- Place the product in a real environment appropriate to its category: a coffee
  mug on a wooden kitchen table with warm morning light.
- Environment is warm and inviting, not sterile.
- Lighting is natural-feeling (window light, golden hour).
- Shallow depth of field (f/2.8 feel) — product sharp, environment softly blurred.
- The product silhouette, branding, and proportions must match the reference exactly.`,

  festival: `Re-stage the product from the reference image as a seasonal / promotional e-commerce main image.
- Add visible Black Friday / winter sale cues around the product (subtle
  snowflakes, charcoal gradient background, gift boxes and ribbons tastefully
  placed) but the product remains the hero.
- Leave a clean EMPTY rectangle in the top-left corner. The rectangle is
  plain (same background color), with absolutely NO text, NO characters, NO
  letters, NO glyphs, NO logos inside or around it. Do not write "PROMO
  TEXT" or any placeholder text — emit a blank region.
- The product's own brand text (printed on the product) may be visible.
  No other text of any kind.
- Mood is festive but not tacky.`,

  "model-wearing": `Re-stage the product from the reference image as if it were held by an AI model.
- A diverse person (mid-30s, casual) holds the product with BOTH HANDS in
  front of their chest. No free hand for any other object.
- Chest-up portrait only — no waist-down body parts visible.
- Fit and proportion look realistic.
- Product colors and material are true to the reference.
- Background is a softly-lit lifestyle setting.
- ABSOLUTELY NO additional props, papers, books, letters, documents, or
  hand-held objects beyond the product.`,

  "detail-page": `Re-stage the product from the reference image as a coherent multi-angle batch for the product detail page.
- Show the product from a 3/4 angle with slightly different lighting and a
  subtle reflective surface.
- Background is a consistent warm gray.
- Photorealistic, sharp, no motion blur.`,
};

const SCENES = Object.keys(PROMPTS);

const results = [];

for (const scene of SCENES) {
  process.stdout.write(`[${scene}] calling fal.ai Kontext... `);
  try {
    const t0 = Date.now();
    const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
      input: {
        aspect_ratio: ASPECT[scene],
        enhance_prompt: true,
        guidance_scale: 3.5,
        image_url: SAMPLE_IMAGE,
        num_images: 1,
        output_format: "png",
        prompt: PROMPTS[scene],
        safety_tolerance: "2",
      },
      logs: false,
    });
    const data = result.data;
    const url = data?.images?.[0]?.url;
    if (!url) {
      console.log(`✗ no image returned (requestId=${result.requestId})`);
      results.push({ scene, ok: false, reason: "no image" });
      continue;
    }
    // Download the image to disk
    const resp = await fetch(url);
    const buf = Buffer.from(await resp.arrayBuffer());
    const outPath = join(OUT_DIR, `${scene}-1.png`);
    await writeFile(outPath, buf);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`✓ ${buf.length} bytes, ${elapsed}s → ${outPath}`);
    results.push({ scene, ok: true, bytes: buf.length, ms: Date.now() - t0, outPath });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`✗ ${msg}`);
    results.push({ scene, ok: false, reason: msg });
  }
}

console.log("\n=== Summary ===");
for (const r of results) {
  const status = r.ok ? "✓" : "✗";
  const detail = r.ok ? `${(r.bytes / 1024).toFixed(0)}KB, ${(r.ms / 1000).toFixed(1)}s` : r.reason;
  console.log(`${status} ${r.scene.padEnd(14)} ${detail}`);
}
const ok = results.filter((r) => r.ok).length;
console.log(`\n${ok}/${results.length} scenes produced output.`);
process.exit(ok === results.length ? 0 : 1);
