# PortraitPro.ai Local Setup

## 1. Clerk

Create a Clerk application and copy the development keys into `.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

The "Temporary API keys" banner on `/sign-up` disappears after real Clerk keys are configured and the dev server is restarted.

## 2. Supabase

Run `supabase/schema.sql` in the Supabase SQL editor. Then create a public storage bucket:

```bash
SUPABASE_STORAGE_BUCKET=portrait-inputs
```

Add these keys to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 3. Fal

Create an API key and add:

```bash
FAL_KEY=...
```

## 4. Stripe

Add local test keys:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed `whsec_...` value into `STRIPE_WEBHOOK_SECRET`, then restart the dev server.

## 5. Run

```bash
npm run dev
```

Open `http://localhost:3000/sign-up`, create an account, buy credits in `/billing`, then generate from `/create`.
