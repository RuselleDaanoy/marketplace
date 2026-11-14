-- Run this in the Supabase SQL editor once for a fresh project.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price numeric not null check (price >= 0),
  email text not null,
  category text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists listings_created_at_idx
  on public.listings (created_at desc);
create index if not exists messages_listing_id_idx
  on public.messages (listing_id);

alter table public.listings enable row level security;
alter table public.messages enable row level security;

-- Anyone (anon key) can browse and post listings.
drop policy if exists "listings are public" on public.listings;
create policy "listings are public"
  on public.listings for select
  using (true);

drop policy if exists "anyone can create listings" on public.listings;
create policy "anyone can create listings"
  on public.listings for insert
  with check (true);

-- Anyone can send a message; only the seller (via service role / dashboard)
-- can read them from this app.
drop policy if exists "anyone can send messages" on public.messages;
create policy "anyone can send messages"
  on public.messages for insert
  with check (true);

-- Public photo bucket used by the create-listing form.
insert into storage.buckets (id, name, public)
values ('marketplace-photos', 'marketplace-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "marketplace photos are public" on storage.objects;
create policy "marketplace photos are public"
  on storage.objects for select
  using (bucket_id = 'marketplace-photos');

drop policy if exists "anyone can upload marketplace photos" on storage.objects;
create policy "anyone can upload marketplace photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'marketplace-photos');
