# Stripe setup for ProductShot.ai

One-time setup. After this, the credit-pack checkout works in dev and prod.

## Current config (test mode, 2026-07-28)

| Pack | Price ID | Product ID | Notes |
|------|----------|------------|-------|
| Starter | `price_1TyAPtRkB81Hwr9ZCnOGar5D` | `prod_Uy6dUDfNd8XcDP` | $30 / 300 credits / 1024px |
| Pro | `price_1TyAQBRkB81Hwr9Z1u5ykjji` | `prod_Uy6dZALO7yTXDA` | $99 / 1550 credits / 2048px |
| Business | `price_1TyAQQRkB81Hwr9ZBsU7rIyS` | `prod_Uy6dTbOfFx64kc` | $199 / 3600 credits / 4K |
| Agency | `price_1TyAQiRkB81Hwr9ZHTgZgYbw` | `prod_Uy6daPDfq6vcjM` | $399 / 8200 credits / 4K + API |

These are **test mode** (`sk_test_` keys) — safe to commit. When you switch to Live mode you'll get a fresh set starting with `price_1LIVExxx`.

## Local dev setup

Add to `.env.local` (this file is gitignored):

```bash
STRIPE_STARTER_PRICE_ID=price_1TyAPtRkB81Hwr9ZCnOGar5D
STRIPE_PRO_PACK_PRICE_ID=price_1TyAQBRkB81Hwr9Z1u5ykjji
STRIPE_BUSINESS_PRICE_ID=price_1TyAQQRkB81Hwr9ZBsU7rIyS
STRIPE_AGENCY_PRICE_ID=price_1TyAQiRkB81Hwr9ZHTgZgYbw
```

Plus the always-needed:

```bash
STRIPE_SECRET_KEY=sk_test_xxx          # from https://dashboard.stripe.com/test/apikeys
STRIPE_WEBHOOK_SECRET=whsec_xxx        # from the webhook below
```

Test card: `4242 4242 4242 4242`, any future date, any CVC, any postal code.

## Vercel production setup

Add the same 4 Price IDs as environment variables in the Vercel dashboard
(Settings → Environment Variables), scope = Production + Preview + Development.
Vercel will auto-redeploy on env changes.

## Webhook setup

The webhook at `POST /api/stripe/webhook` handles:
- `checkout.session.completed` (kind=`credit_pack`) → grant credits, bump quality_tier
- Legacy `customer.subscription.*` / `invoice.payment_succeeded` (kept for any
  in-flight Pro/Team subs from before the credit-pack pivot)

**Local dev**: install the Stripe CLI and forward events:

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_xxx into .env.local as STRIPE_WEBHOOK_SECRET
```

**Production**: in https://dashboard.stripe.com/test/webhooks (or `/webhooks` for
live), add an endpoint pointing to `https://productshot-ai-eight.vercel.app/api/stripe/webhook`,
subscribe to:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`

Copy the signing secret into Vercel as `STRIPE_WEBHOOK_SECRET`.

## Switching to Live mode (when you have a first paying user)

1. Toggle the dashboard to Live mode (top right of https://dashboard.stripe.com)
2. Repeat all four product/price creation steps in Live mode
3. Get the Live `sk_live_xxx` from https://dashboard.stripe.com/apikeys
4. Replace the test Price IDs in Vercel + `.env.local` with Live ones
5. Add a new Live webhook endpoint
6. Test with a real card in Live mode (charge + refund $1 to verify the round trip)

The webhook code path is identical for test and live — only the keys differ.
The 4 Price ID env vars in Vercel are the only "switch" you need to flip.
