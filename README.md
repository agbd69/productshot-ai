# ProductShot.ai

> End-to-end AI product image SaaS for overseas e-commerce merchants (Amazon, Shopify, TikTok Shop, Temu).
> White-bg main images, lifestyle context shots, festival promos, AI-model on-product, and multi-angle detail pages — all from one upload.

## Stack

- **Frontend / API**: Next.js 16 (App Router) + React 19
- **Auth**: Clerk
- **Database**: Supabase (Postgres + Storage)
- **Image generation**: fal.ai (`fal-ai/flux-pro/v1.1`) with optional Remove.bg upstream isolation
- **Billing**: Stripe (subscriptions + one-time credit packs)
- **Tests**: Vitest

## Architecture

```
[User uploads 1-6 product images]
  → /api/generate
    → uploadReferenceImage()             // Supabase Storage
    → spendCredits()                     // monthly-refill aware
    → createGenerationRecord()
    → generateProductImages():
        if (white-bg / detail-page) and REMOVE_BG_KEY set:
          removeBackgroundFromUrl()      // optional isolation pass
        → generateProductImagesWithFal() // Flux Pro v1.1
    → updateGenerationRecord()
    → redirect /generations/{id}
```

## Five product scenes

| ID | Title | Cost (credits) | Notes |
| --- | --- | --- | --- |
| `white-bg` | Pure white main image | 4 | Amazon / Temu main image. Triggers Remove.bg. |
| `lifestyle` | Lifestyle context | 8 | Kitchen / office / outdoor / studio / cafe. |
| `festival` | Festival promotion | 6 | 618 / Black Friday / Christmas / Lunar NY / Valentine's. |
| `model-wearing` | AI model | 12 | Apparel / footwear / accessories. Most expensive. |
| `detail-page` | Multi-angle detail | 10 | Front / 45° / side / back / top-down / close-up. Triggers Remove.bg. |

## Pricing

| Plan | Price | Monthly credits | Features |
| --- | --- | --- | --- |
| **Free** | $0 | 30 | All 5 scenes, standard resolution |
| **Pro** | $12.50 / month | 200 | HD + priority queue + cross-platform export |
| **Team** | $588 / year | 2000 | Team workspace + dedicated support |
| **Starter pack** (one-time) | $9.90 | 30 | Try before subscribing |

## Local development

```bash
# 1. Install deps
npm install

# 2. Copy env template and fill in keys
cp .env.example .env.local
# edit .env.local: Clerk / Supabase / fal.ai / Remove.bg / Stripe

# 3. Apply DB schema (one-time, in Supabase SQL editor)
psql $SUPABASE_URL -f supabase/schema.sql
# or paste the contents of supabase/schema.sql into the Supabase dashboard

# 4. Run the dev server
npm run dev

# 5. (Optional) Stripe webhook listener in another terminal
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm run test          # 53+ unit tests (vitest)
npm run typecheck     # tsc --noEmit
npm run lint          # next/eslint
```

## Deployment

The app is a stock Next.js 16 app. Two services:

### 1. Vercel (recommended for the Next.js app)

1. Connect the repo to Vercel.
2. Set every env var from `.env.example` in the Vercel project settings.
3. Trigger a deploy. The default Next.js build pipeline will work without any tweaks.
4. Once deployed, set `NEXT_PUBLIC_APP_URL` to your production URL.

### 2. Stripe (production)

1. Create two recurring Prices in the Stripe dashboard:
   - **Pro**: $12.50 / month, recurring
   - **Team**: $588 / year, recurring
2. Drop the resulting `price_...` IDs into `STRIPE_PRO_PRICE_ID` and `STRIPE_TEAM_PRICE_ID` env vars.
3. Create a webhook endpoint in the Stripe dashboard pointing at `https://yourdomain.com/api/stripe/webhook`, listening for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Drop the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 3. fal.ai

1. Sign up at https://fal.ai and grab an API key.
2. Drop it into `FAL_KEY`.

### 4. Remove.bg (optional)

1. Sign up at https://www.remove.bg and grab an API key.
2. Drop it into `REMOVE_BG_KEY`. When unset, the pipeline skips the isolation pass even for `white-bg` / `detail-page` scenes.

### 5. Supabase

1. Create a project, run `supabase/schema.sql` against the database.
2. Create a Storage bucket called `productshot-inputs` (public read, service-role write).
3. Drop the URL + service-role key into env vars.

## Project structure

```
src/
  app/
    (dashboard)/
      billing/        # 3-tier pricing + credit pack
      create/         # upload + scene selector
      generations/    # result page (polling)
    api/
      generate/       # POST: kick off a generation
      generations/    # GET: poll for status
      stripe/
        checkout/     # POST: build a Checkout session
        webhook/      # POST: handle Stripe events
  config/
    scenes.ts         # 5 product scene prompts
    pricing.ts        # plans + scene credit costs
    generation.ts     # scene catalogue for the create flow
  lib/
    billing.ts        # plan / pack summaries
    mvp-generation.ts # form parser
  lib/server/
    auth.ts           # Clerk → app user
    users.ts          # credits, plans, monthly refill
    generations.ts    # generation record CRUD
    subscriptions.ts  # Stripe subscription record CRUD
    storage.ts        # Supabase Storage upload
    fal.ts            # Flux Pro v1.1 client
    remove-bg.ts      # Remove.bg client
    image-provider.ts # end-to-end pipeline
    stripe.ts         # Stripe client
    stripe-checkout.ts# checkout session builders
supabase/
  schema.sql          # users / generations / payments / subscriptions
```

## License

Proprietary. © 2026 ProductShot.ai.
