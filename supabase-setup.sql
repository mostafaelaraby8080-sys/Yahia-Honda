-- شغّل الملف ده كله مرة واحدة في Supabase: SQL Editor → New query → Run
-- غيّر الإيميل لو هتستخدم إيميل مختلف (لازم يطابق ADMIN_EMAIL في config.js)

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  stock integer check (stock >= 0),
  image_url text,
  images text[] not null default '{}',
  colors text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "public read" on public.products;
create policy "public read" on public.products for select to anon, authenticated using (true);

drop policy if exists "admin write" on public.products;
create policy "admin write" on public.products for all to authenticated
  using ((auth.jwt() ->> 'email') = 'admin@yahiahonda.com')
  with check ((auth.jwt() ->> 'email') = 'admin@yahiahonda.com');

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do update set public = true;

drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (auth.jwt() ->> 'email') = 'admin@yahiahonda.com');

drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (auth.jwt() ->> 'email') = 'admin@yahiahonda.com');
