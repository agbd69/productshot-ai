# ProductShot.ai — Shopify App Store Listing Draft

> Working draft for the Shopify App Store submission. Fields are filled in
> with the post-pivot product positioning (AI product image generation for
> e-commerce merchants).

## App name

```
ProductShot.ai — AI Product Photos
```

(45 char limit. Drops the "ai" lowercase suffix in the App Store title for brand consistency, since Shopify's display name is auto-prefixed with "AI".)

## Tagline (max 70 chars)

```
Studio-quality product photos in 60 seconds. No photoshoot needed.
```

## Short description (max 350 chars)

```
Generate Amazon-ready white-bg, lifestyle, festival, and AI-model product
photos from a single upload. Flux Pro v1.1 + Remove.bg gives you
studio-quality images in under a minute. Replace $200/photo shoots with
$0.07/image API calls. Built for Shopify, Amazon, TikTok Shop, and Temu
sellers. 5 scenes, 1 credit pack, 3 plans.
```

## Full description (Markdown)

```markdown
# ProductShot.ai — AI product photos for serious e-commerce

Replace your $200/photo product shoot with a 60-second API call. Upload 1–6
images of your product, pick a scene, and ProductShot.ai delivers
conversion-tested, platform-ready photos in under a minute.

## What it does

ProductShot.ai generates the **end-to-end product image workflow** most AI
tools leave you to assemble by hand:

- **Pure white-bg main image** — Amazon / Temu / Shopify main image,
  #FFFFFF background, 80%+ product fill, no text overlay.
- **Lifestyle context** — kitchen, office, cafe, outdoor, studio. Shallow
  DoF, natural light, tasteful props.
- **Festival promotion** — 618, Black Friday, Christmas, Lunar New Year,
  Valentine's. Reserved promo zone for the merchant's own text.
- **AI model** — apparel, footwear, accessories worn by diverse AI models.
  True-to-product colors, real fit, no warped seams.
- **Multi-angle detail page** — front, 45°, side, back, top-down, close-up
  detail. Coherent lighting across the batch.

## Why it's different

- **End-to-end**, not single-point. Photoroom gives you one cutout.
  ProductShot.ai takes you from raw product photo to platform-ready
  listing image.
- **Cross-platform specs**. Same batch, four platforms: 1500×1500 square
  for Amazon, 2048×1536 landscape for Shopify, 9:16 for TikTok Shop,
  multi-angle for the detail page.
- **IP-Adapter + Remove.bg**. The product silhouette and branding stay
  consistent across every generated scene — no hallucinated logos, no
  warped packaging.

## Built for overseas merchants

- **鹿班退场后** 的真空: Chinese out-of-sea merchants had 鹿班 (Luban) for
  their product image needs. After it was sunset, the vacuum is wide open.
  ProductShot.ai fills it.
- Pricing in USD, payment via Stripe (cards, Alipay, WeChat Pay).
- Multi-language: EN, ZH, ES, DE, FR, JA, KO coming in the next release.

## Pricing

- **Free**: 30 credits / month
- **Pro**: $12.50 / month, 200 credits
- **Team**: $588 / year, 2000 credits
- **Starter pack**: $9.90 one-time, 30 credits

$0.07 / image at the Pro tier. 200 images a month for less than a single
professional photo.

## Requirements

- A Shopify store with at least one product
- A ProductShot.ai account (one-click sign-up)
- A Stripe account for billing
```

## Pricing (Shopify App Store field)

- Free plan: 30 credits / month
- Pro: $12.50 / month, 200 credits
- Team: $588 / year, 2000 credits
- Starter pack: $9.90 one-time, 30 credits

## Categories

- Store design
- Marketing
- Product photography

## Keywords

```
ai product photo, product image, white background, lifestyle photo,
festival promotion, amazon main image, listing photo, tiktok shop,
remove background, flux, ai model
```

## Support email

```
support@productshot.ai
```

## Privacy policy URL

```
https://productshot.ai/privacy
```

## App URL (for review)

```
https://app.productshot.ai
```

---

## Reviewer notes (paste into "Notes for reviewer")

```
ProductShot.ai is a self-serve AI product image tool. Sign up with email,
upload product photos, generate. The app installs as a sales-channel
integration that adds a "Generate with ProductShot" button to the product
edit page. Demo store credentials are provided on the partner test
request form.

Test mode is enabled by default. No live card needed to walk through the
generate flow.
```

## Open questions for the review team

1. Can the app be installed in dev stores without merchant approval? (For
   the design partner rollout.)
2. Is there a Shopify-approved path to surface generated images back into
   the product media library via the GraphQL Admin API? (Yes — `productCreateMedia`.)

## Submission checklist

- [x] App name + tagline + descriptions
- [x] Categories + keywords
- [ ] Privacy policy page (`/privacy`)
- [ ] App icon (1024×1024 PNG, transparent)
- [ ] Screenshots (5 × 1280×800, real product photo walkthroughs)
- [ ] Demo store with the integration installed
- [ ] GDPR / CCPA disclosure page
- [ ] Support email forwarding configured
