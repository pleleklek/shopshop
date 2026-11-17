-- รันใน Supabase -> SQL Editor

create extension if not exists pgcrypto;

create table if not exists products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  brand             text,
  category          text,
  image_url         text,
  description       text,
  youtube_keyword   text,                 -- คำค้นรีวิว ถ้าว่างใช้ "รีวิว <name>"
  is_active         boolean not null default true,
  videos_synced_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists offers (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  store            text not null,          -- shopee | lazada | tiktok | other
  external_id      text,                   -- shopee: "<shopId>:<itemId>"
  title            text,
  shop_name        text,
  image_url        text,
  product_url      text not null,
  affiliate_url    text,                   -- ลิงก์ที่ได้ค่าคอม ถ้าว่างใช้ product_url
  price            numeric(12,2),
  original_price   numeric(12,2),
  rating           numeric(3,2),
  sold_count       integer,
  commission_rate  numeric(6,4),
  in_stock         boolean not null default true,
  is_auto          boolean not null default false, -- true = อัปเดตราคาอัตโนมัติจาก API
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  unique (product_id, store, external_id)
);
create index if not exists offers_product_idx on offers(product_id);

create table if not exists price_history (
  id           bigserial primary key,
  offer_id     uuid not null references offers(id) on delete cascade,
  price        numeric(12,2) not null,
  recorded_at  timestamptz not null default now()
);
create index if not exists price_history_offer_idx on price_history(offer_id, recorded_at desc);

create table if not exists videos (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references products(id) on delete cascade,
  youtube_id     text not null,
  title          text not null,
  channel_title  text,
  thumbnail_url  text,
  published_at   timestamptz,
  view_count     bigint,
  is_pinned      boolean not null default false,
  is_hidden      boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (product_id, youtube_id)
);

create table if not exists clicks (
  id          bigserial primary key,
  offer_id    uuid references offers(id) on delete set null,
  product_id  uuid references products(id) on delete set null,
  store       text,
  referrer    text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index if not exists clicks_created_idx on clicks(created_at desc);

-- RLS: คนทั่วไปอ่านได้อย่างเดียว ส่วนการเขียนทำผ่าน service role ฝั่ง server
alter table products      enable row level security;
alter table offers        enable row level security;
alter table price_history enable row level security;
alter table videos        enable row level security;
alter table clicks        enable row level security;

drop policy if exists "public read products" on products;
create policy "public read products" on products for select using (is_active);
drop policy if exists "public read offers" on offers;
create policy "public read offers" on offers for select using (true);
drop policy if exists "public read price_history" on price_history;
create policy "public read price_history" on price_history for select using (true);
drop policy if exists "public read videos" on videos;
create policy "public read videos" on videos for select using (not is_hidden);
-- clicks: ไม่มี policy = anon อ่าน/เขียนไม่ได้
