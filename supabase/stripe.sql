-- Stripe Connect migration. Run once in the Supabase SQL editor
-- (after supabase/schema.sql).

-- ---------------------------------------------------------------------------
-- Listings: track whether an item has been paid for.
-- ---------------------------------------------------------------------------
alter table public.listings
  add column if not exists sold boolean not null default false;
alter table public.listings
  add column if not exists sold_at timestamptz;

-- ---------------------------------------------------------------------------
-- Sellers: one Stripe Express account per seller email. No auth in this app,
-- so the email on a listing is the seller identity.
-- ---------------------------------------------------------------------------
create table if not exists public.sellers (
  email text primary key,
  stripe_account_id text not null unique,
  details_submitted boolean not null default false,
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders: a row is created when Checkout opens (status = pending) and the
-- webhook flips it to paid and marks the listing sold.
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  seller_email text not null,
  buyer_email text,
  listing_title text not null,
  amount_total integer not null,      -- cents paid by the buyer
  platform_fee integer not null,     -- cents kept by the marketplace
  currency text not null default 'usd',
  status text not null default 'pending',  -- pending | paid | expired
  stripe_session_id text not null unique,
  stripe_payment_intent text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_listing_id_idx on public.orders (listing_id);
create index if not exists sellers_account_idx on public.sellers (stripe_account_id);

alter table public.sellers enable row level security;
alter table public.orders enable row level security;

-- Public read: the marketplace needs to know which sellers can take payments.
drop policy if exists "sellers are public" on public.sellers;
create policy "sellers are public"
  on public.sellers for select
  using (true);

drop policy if exists "anyone can create sellers" on public.sellers;
create policy "anyone can create sellers"
  on public.sellers for insert
  with check (true);

drop policy if exists "anyone can update sellers" on public.sellers;
create policy "anyone can update sellers"
  on public.sellers for update
  using (true)
  with check (true);

-- Orders are written by the checkout route and the Stripe webhook. In this
-- no-auth app those run with the anon key, so keep the policies permissive.
-- If you set SUPABASE_SERVICE_ROLE_KEY on the server, these can be tightened.
drop policy if exists "orders are public" on public.orders;
create policy "orders are public"
  on public.orders for select
  using (true);

drop policy if exists "anyone can create orders" on public.orders;
create policy "anyone can create orders"
  on public.orders for insert
  with check (true);

drop policy if exists "anyone can update orders" on public.orders;
create policy "anyone can update orders"
  on public.orders for update
  using (true)
  with check (true);

-- The webhook marks listings sold, so allow updates from the app.
drop policy if exists "anyone can update listings" on public.listings;
create policy "anyone can update listings"
  on public.listings for update
  using (true)
  with check (true);
