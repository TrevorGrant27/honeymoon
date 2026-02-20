-- Honeymoon Registry Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Experiences table
create table if not exists experiences (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null check (category in ('dining', 'hotels', 'activities', 'transport', 'extras')),
  price_cents integer not null check (price_cents > 0),
  image_url text,
  emoji text not null default '✨',
  allow_splitting boolean not null default true,
  min_split_cents integer not null default 2500,
  display_order integer not null default 0,
  is_active boolean not null default true,
  funded_cents integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sponsors table
create table if not exists sponsors (
  id uuid primary key default uuid_generate_v4(),
  experience_id uuid not null references experiences(id) on delete cascade,
  display_name text not null,
  photo_url text,
  note text,
  amount_cents integer not null check (amount_cents > 0),
  email text not null default '',
  stripe_session_id text not null unique,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_experiences_active on experiences(is_active);
create index if not exists idx_experiences_category on experiences(category);
create index if not exists idx_experiences_display_order on experiences(display_order);
create index if not exists idx_sponsors_experience_id on sponsors(experience_id);
create index if not exists idx_sponsors_stripe_session on sponsors(stripe_session_id);

-- Row Level Security
alter table experiences enable row level security;
alter table sponsors enable row level security;

-- Public read access for active experiences
create policy "Public can read active experiences"
  on experiences for select
  using (is_active = true);

-- Public read access for sponsors
create policy "Public can read sponsors"
  on sponsors for select
  using (true);

-- Service role has full access (for API routes using service key)
create policy "Service role full access to experiences"
  on experiences for all
  using (true)
  with check (true);

create policy "Service role full access to sponsors"
  on sponsors for all
  using (true)
  with check (true);

-- Create storage bucket for photos
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Allow public uploads to photos bucket
create policy "Public can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos');

-- Allow public reads from photos bucket
create policy "Public can read photos"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Seed data: Sample honeymoon experiences
insert into experiences (title, description, category, price_cents, emoji, allow_splitting, display_order) values
  ('Dinner at Le Jules Verne', 'A magical evening dining at the Eiffel Tower''s legendary restaurant with panoramic views of Paris at sunset.', 'dining', 35000, '🗼', true, 1),
  ('Seine River Sunset Cruise', 'Glide along the Seine as the City of Light sparkles at golden hour. Champagne included, of course.', 'activities', 15000, '🚢', true, 2),
  ('One Night at Hôtel Plaza Athénée', 'Wake up on Avenue Montaigne in one of Paris''s most iconic luxury hotels.', 'hotels', 80000, '🏨', true, 3),
  ('Montmartre Wine & Cheese Tour', 'Wander the charming streets of Montmartre, stopping at hidden wine bars and fromageries.', 'dining', 12000, '🧀', true, 4),
  ('Private Louvre Tour', 'Skip the lines and explore the world''s greatest art collection with a private guide.', 'activities', 25000, '🎨', true, 5),
  ('Train to Provence', 'First-class TGV tickets from Paris to the lavender fields and vineyards of Provence.', 'transport', 20000, '🚂', true, 6),
  ('Hot Air Balloon over Burgundy', 'Float above rolling vineyards and medieval villages in a sunrise hot air balloon ride.', 'activities', 30000, '🎈', false, 7),
  ('Couples Spa Day', 'A full day of relaxation at a world-class Parisian spa — massages, facials, and champagne.', 'extras', 22000, '💆', true, 8),
  ('Café Hopping Fund', 'Keep our espresso and croissant budget fully stocked as we explore neighborhood cafés.', 'dining', 8000, '☕', true, 9),
  ('Versailles Day Trip', 'Transport and tickets to explore the breathtaking Palace of Versailles and its gardens.', 'activities', 15000, '🏰', true, 10),
  ('Airport Transfer', 'Comfortable private car service from CDG airport to our hotel — starting the trip in style.', 'transport', 10000, '🚗', false, 11),
  ('Souvenir & Gift Fund', 'Help us bring home meaningful mementos from our French adventure.', 'extras', 10000, '🎁', true, 12)
on conflict do nothing;
