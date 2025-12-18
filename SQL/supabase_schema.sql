-- Enable UUID extension (optional, but good practice if we switch to uuids later, though we use text ids for now)
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password text not null, -- Note: In production use Supabase Auth! This is a migration of current custom auth.
  name text not null,
  role text not null,
  team_id text,
  bio text,
  location text,
  related_player_id text,
  avatar text,
  cover text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TEAMS TABLE
create table if not exists public.teams (
  id text primary key,
  name text not null,
  short_name text,
  city text,
  logo_color text,
  cover text,
  wins int default 0,
  draws int default 0,
  losses int default 0,
  goals_for int default 0,
  goals_against int default 0,
  points int default 0,
  roster jsonb default '[]'::jsonb, -- Array of Player objects
  tactical_formation jsonb default '[]'::jsonb, -- Array of TacticalPosition objects
  created_by text,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ARENAS TABLE
create table if not exists public.arenas (
  id text primary key,
  name text not null,
  address text,
  lat float,
  lng float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TOURNAMENTS TABLE
create table if not exists public.tournaments (
  id text primary key,
  name text not null,
  format text,
  sport_type text,
  status text,
  current_round int default 1,
  total_rounds int default 1,
  participating_team_ids jsonb default '[]'::jsonb, -- Array of strings
  created_by text,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MATCHES TABLE
create table if not exists public.matches (
  id text primary key,
  home_team_id text,
  away_team_id text,
  date text, -- Using text to match ISO string from frontend, or timestamp
  status text,
  type text,
  sport_type text,
  arena_id text,
  home_score int default 0,
  away_score int default 0,
  round text,
  tournament_id text,
  events jsonb default '[]'::jsonb, -- Array of MatchEvent
  chat_messages jsonb default '[]'::jsonb, -- Array of ChatMessage
  home_tactics jsonb,
  away_tactics jsonb,
  youtube_video_id text,
  media jsonb default '[]'::jsonb, -- Array of MatchMedia
  created_by text,
  is_deleted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id text primary key,
  type text,
  from_id text,
  from_name text,
  to_user_id text,
  data jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. SOCIAL CONNECTIONS TABLE (Follows)
create table if not exists public.social_connections (
  id text primary key,
  follower_id text,
  target_id text,
  target_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- For now, to enable the app to work easily with the ANON key as requested by user context ("ClubeDoContra"),
-- we will ENABLE RLS but add a policy to allow ALL access for anon.
-- IN PRODUCTION, this should be restricted.

alter table public.users enable row level security;

alter table public.teams enable row level security;

alter table public.arenas enable row level security;

alter table public.tournaments enable row level security;

alter table public.matches enable row level security;

alter table public.notifications enable row level security;

alter table public.social_connections enable row level security;

create policy "Enable all access for all users" on public.users for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.teams for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.arenas for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.tournaments for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.matches for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.notifications for all using (true)
with
    check (true);

create policy "Enable all access for all users" on public.social_connections for all using (true)
with
    check (true);
-- 8. STORAGE SETUP (Added for Image Uploads)
-- Run this in Supabase SQL Editor to enable image uploads

insert into
    storage.buckets (id, name, public)
values ('images', 'images', true) on conflict (id) do nothing;

create policy "Images Public Select" on storage.objects for
select using (bucket_id = 'images');

create policy "Images Public Insert" on storage.objects for
insert
with
    check (bucket_id = 'images');

create policy "Images Public Update" on storage.objects for
update using (bucket_id = 'images');

-- MIGRATION V2: Add columns for Profile Pictures, Colors, and Maps
do $$
begin
  -- Teams Update: Colors and Profile Pic
  if not exists (select 1 from information_schema.columns where table_name = 'teams' and column_name = 'profile_picture') then
    alter table public.teams add column profile_picture text;

end if;

if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'teams'
        and column_name = 'primary_color'
) then
alter table public.teams
add column primary_color text;

end if;

if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'teams'
        and column_name = 'secondary_color'
) then
alter table public.teams
add column secondary_color text;

end if;

if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'teams'
        and column_name = 'tertiary_color'
) then
alter table public.teams
add column tertiary_color text;

end if;

-- Arenas Update: Maps and Photos
if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'arenas'
        and column_name = 'google_maps_url'
) then
alter table public.arenas
add column google_maps_url text;

end if;

if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'arenas'
        and column_name = 'profile_picture'
) then
alter table public.arenas
add column profile_picture text;

end if;

if not exists (
    select 1
    from information_schema.columns
    where
        table_name = 'arenas'
        and column_name = 'cover_picture'
) then
alter table public.arenas
add column cover_picture text;

end if;

end $$;