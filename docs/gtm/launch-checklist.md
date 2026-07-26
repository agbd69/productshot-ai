# ProductShot.ai — W4 Launch Checklist

> 4-week plan executed. These are the remaining post-launch tasks before
> flipping the marketing site to public.

## Pre-launch (this week)

- [ ] Run `npm run typecheck` and `npm run test` in CI on every PR
- [ ] Set up GitHub Actions to run `npm run test && npm run typecheck && npm run lint`
- [ ] Add Sentry / PostHog for error tracking and product analytics
- [ ] Set up a `productshot-ai` Vercel project and connect the repo
- [ ] Configure production env vars on Vercel
- [ ] Run `supabase/schema.sql` against the production database
- [ ] Set up Stripe products (Pro $12.50/mo, Team $588/yr) and grab the price IDs
- [ ] Configure Stripe webhook endpoint
- [ ] Smoke test: sign up → generate a white-bg image → see it on the result page → check credits debited
- [ ] Smoke test: subscribe to Pro → see credits refilled to 200 → see plan badge on billing page

## Marketing site (this week)

- [ ] Replace homepage copy with `ProductShot.ai` positioning (already done in W1)
- [ ] Publish `/privacy` and `/terms` pages
- [ ] Publish `/changelog` (Vercel-style)
- [ ] Set up `productshot.ai` DNS
- [ ] Add Open Graph images for social sharing
- [ ] Add Plausible / Fathom analytics (no cookies, GDPR-friendly)

## Soft launch (next 2 weeks)

- [ ] 5 design partner merchants from existing out-of-sea network
  - Free Pro for 3 months
  - 1 weekly feedback call
  - Co-marketing: case study + logo
- [ ] 3 Reddit posts: r/ecommerce, r/shopify, r/FulfillmentByAmazon
- [ ] 1 Hacker News Show HN: angle = "How we replaced $200/photo shoots with $0.07 API calls"
- [ ] 1 Product Hunt launch scheduled (Tuesday 9am PT)
- [ ] 1 LinkedIn post in the cross-border e-commerce community
- [ ] Email blast to existing PortraitPro users (pivot announcement + 50% off Pro for 6 months)

## Public launch (week 4)

- [ ] Open the Shopify App Store listing (draft in `docs/gtm/shopify-app-store-listing.md`)
- [ ] AppSumo launch (lifetime deal at $79 with 200 credits/month, capped at 200 customers)
- [ ] 3 guest posts on cross-border e-commerce blogs
- [ ] Twitter / X launch thread
- [ ] Indie Hackers post

## KPIs to watch in week 1

- 100 sign-ups (target)
- 20 paid conversions (target: 20% trial-to-paid)
- 2 design-partner feedback calls completed
- 0 P0 bugs
- <2% Stripe webhook failure rate

## Post-week-1 backlog

- Multi-language UI (EN / ZH first, then ES / DE / FR / JA / KO)
- IP-Adapter weighted consistency (currently prompt-only)
- Object storage for cutout PNGs (Supabase Storage / R2)
- Batch upload (20+ images in one go)
- 30s video from a single product image (differentiation vs. Pebblely)
- Figma plugin for marketing teams
