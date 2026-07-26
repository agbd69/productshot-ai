-- ============================================================================
-- ProductShot.ai — Supabase schema (post-pivot 2026-07-26)
-- ============================================================================
-- Idempotent: safe to re-run on an existing database. Uses:
--   - CREATE TABLE IF NOT EXISTS    (skip if table already exists)
--   - ALTER TABLE ... ADD COLUMN IF NOT EXISTS  (add new columns)
--   - CREATE INDEX IF NOT EXISTS    (skip if index already exists)
--   - CREATE OR REPLACE FUNCTION    (replace function definition)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text,
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- New columns added in the post-pivot schema. Each ADD COLUMN IF NOT EXISTS
-- is safe to re-run on a database that already has the column.
alter table public.users
  add column if not exists plan text not null default 'free';

alter table public.users
  drop constraint if exists users_plan_check;
alter table public.users
  add constraint users_plan_check check (plan in ('free', 'pro', 'team'));

alter table public.users
  add column if not exists current_period_end timestamptz;

alter table public.users
  add column if not exists stripe_customer_id text;

-- ----------------------------------------------------------------------------
-- generations
-- ----------------------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  scene text not null,
  status text not null default 'queued',
  input_image_urls text[] not null default '{}',
  output_image_urls text[] not null default '{}',
  credits_used integer not null default 0,
  metadata jsonb not null default '{}',
  error text,
  fal_request_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Drop and re-add the check constraints so the updated scene list
-- (5 product scenes post-pivot) takes effect on re-runs.
alter table public.generations
  drop constraint if exists generations_scene_check;

-- Backfill: any old portrait scenes (id-photo, linkedin, hanfu, graduation)
-- get remapped to the closest product scene. Done BEFORE the constraint
-- is re-added so we don't violate it on the way in.
update public.generations
   set scene = case scene
     when 'id-photo' then 'white-bg'
     when 'linkedin' then 'lifestyle'
     when 'hanfu' then 'lifestyle'
     when 'graduation' then 'lifestyle'
     else scene
   end
 where scene not in ('white-bg', 'lifestyle', 'festival', 'model-wearing', 'detail-page');

-- Defensive: any row that somehow still doesn't match gets dropped.
-- Should be a no-op after the UPDATE above, but keeps the migration
-- from failing in pathological cases.
delete from public.generations
 where scene not in ('white-bg', 'lifestyle', 'festival', 'model-wearing', 'detail-page');

alter table public.generations
  add constraint generations_scene_check
  check (scene in ('white-bg', 'lifestyle', 'festival', 'model-wearing', 'detail-page'));

alter table public.generations
  drop constraint if exists generations_status_check;
alter table public.generations
  add constraint generations_status_check
  check (status in ('queued', 'processing', 'completed', 'failed'));

-- ----------------------------------------------------------------------------
-- payments
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  stripe_session_id text unique not null,
  amount integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- subscriptions (new in W3)
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  plan text not null,
  status text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('pro', 'team'));

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;
alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('active', 'past_due', 'canceled', 'incomplete', 'trialing', 'unpaid'));

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists users_clerk_user_id_idx on public.users(clerk_user_id);
create index if not exists users_stripe_customer_id_idx on public.users(stripe_customer_id);
create index if not exists generations_user_id_created_at_idx on public.generations(user_id, created_at desc);
create index if not exists payments_stripe_session_id_idx on public.payments(stripe_session_id);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);

-- ----------------------------------------------------------------------------
-- Free tier credit grant (backstop; application code also handles this in
-- ensureAppUser on first sign-in).
-- ----------------------------------------------------------------------------
create or replace function public.grant_free_credits() returns trigger
language plpgsql as $$
begin
  if new.plan = 'free' and new.credits = 0 then
    new.credits := 30;
  end if;
  return new;
end;
$$;
