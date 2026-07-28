# Stripe setup for ProductShot.ai

One-time setup. After this, the credit-pack checkout works in dev and prod.

## Current config (test mode, 2026-07-28)

Stripe account: `acct_1TtoFj4ml4iwUeLv` (test mode).
The `.env.local` `STRIPE_SECRET_KEY` belongs to this account, so the prices
below resolve correctly.

| Pack | Price ID | Product ID | Notes |
|------|----------|------------|-------|
| Starter | `price_1TyBON4ml4iwUeLvh5WfpATv` | `prod_Uy7dJvMwoUaTo8` | $30 / 300 credits / 1024px |
| Pro | `price_1TyBOP4ml4iwUeLvho7gQj8k` | `prod_Uy7dLSGnJIqObN` | $99 / 1550 credits / 2048px |
| Business | `price_1TyBOQ4ml4iwUeLvv8eVQosv` | `prod_Uy7d7QsuKbEEa7` | $199 / 3600 credits / 4K |
| Agency | `price_1TyBOS4ml4iwUeLvevJRaKfM` | `prod_Uy7dfQSjpf4SN4` | $399 / 8200 credits / 4K + API |

These are **test mode** (`sk_test_` keys) — safe to commit. When you switch to Live mode you'll get a fresh set starting with `price_1LIVExxx`.

**Heads up on account mismatch**: Stripe IDs embed the account they're
created in (e.g. `price_1TyBO54ml4iwUeLv...` belongs to `acct_1TtoFj4ml4iwUeLv`).
The `STRIPE_SECRET_KEY` in `.env.local` is also account-scoped, so the
4 price IDs MUST be from the same account as the secret key. If you ever
create products in a different Stripe account, checkout will fail with
`No such price`.

## Local dev setup

Add to `.env.local` (this file is gitignored):

```bash
STRIPE_STARTER_PRICE_ID=price_1TyBON4ml4iwUeLvh5WfpATv
STRIPE_PRO_PACK_PRICE_ID=price_1TyBOP4ml4iwUeLvho7gQj8k
STRIPE_BUSINESS_PRICE_ID=price_1TyBOQ4ml4iwUeLvv8eVQosv
STRIPE_AGENCY_PRICE_ID=price_1TyBOS4ml4iwUeLvevJRaKfM
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
