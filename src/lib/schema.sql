-- ─────────────────────────────────────────────────────────────────────────────
-- My Space — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Calendar Events
create table if not exists calendar_events (
  id          uuid default gen_random_uuid() primary key,
  title       text not null,
  date        text not null,
  start_ts    bigint,
  end_ts      bigint,
  location    text,
  category    text default 'Personal',
  color       text default '#c0c0c0',
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Food Meals
create table if not exists food_meals (
  id          uuid default gen_random_uuid() primary key,
  date        text not null,
  name        text not null,
  calories    integer default 0,
  protein     real default 0,
  carbs       real default 0,
  fat         real default 0,
  meal_type   text default 'lunch',
  created_at  timestamptz default now()
);

-- Food Recipes
create table if not exists food_recipes (
  id           uuid default gen_random_uuid() primary key,
  name         text not null,
  category     text default 'Mittagessen',
  calories     integer default 0,
  protein      real default 0,
  carbs        real default 0,
  fat          real default 0,
  ingredients  text default '',
  instructions text default '',
  created_at   timestamptz default now()
);

-- Health Logs
create table if not exists health_logs (
  id         uuid default gen_random_uuid() primary key,
  date       text not null unique,
  weight     real default 0,
  sleep      real default 0,
  water      real default 0,
  mood       integer default 5,
  steps      integer default 0,
  created_at timestamptz default now()
);

-- Health Goals
create table if not exists health_goals (
  id       integer primary key default 1,
  calories integer default 2600,
  protein  real default 150,
  carbs    real default 330,
  fat      real default 75,
  water    real default 3.0,
  weight   real default 72,
  steps    integer default 10000,
  sleep    real default 8
);

insert into health_goals (id, calories, protein, carbs, fat, water, weight, steps, sleep)
values (1, 2600, 150, 330, 75, 3.0, 72, 10000, 8)
on conflict (id) do nothing;

-- Workout Sessions
create table if not exists workout_sessions (
  id         uuid default gen_random_uuid() primary key,
  date       text not null unique,
  day_index  integer not null,
  day_label  text default '',
  exercises  jsonb default '[]',
  created_at timestamptz default now()
);

-- Gym Day Overrides
create table if not exists gym_day_overrides (
  id        uuid default gen_random_uuid() primary key,
  day_index integer not null unique,
  is_rest   boolean default false
);

-- ZHAW Tasks
create table if not exists zhaw_tasks (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  module     text default '',
  due_date   text default '',
  done       boolean default false,
  priority   text default 'medium',
  notes      text default '',
  created_at timestamptz default now()
);

-- Skincare Logs
create table if not exists skincare_logs (
  id             uuid default gen_random_uuid() primary key,
  date           text not null unique,
  morning_done   integer default 0,
  morning_total  integer default 0,
  evening_done   integer default 0,
  evening_total  integer default 0,
  created_at     timestamptz default now()
);

-- Style Items
create table if not exists style_items (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  category    text default 'Other',
  image_url   text,
  tags        jsonb default '[]',
  notes       text default '',
  owned       boolean default true,
  wishlist    boolean default false,
  created_at  timestamptz default now()
);

-- ── Enable Realtime ────────────────────────────────────────────────────────
alter publication supabase_realtime add table calendar_events;
alter publication supabase_realtime add table zhaw_tasks;
alter publication supabase_realtime add table food_meals;
alter publication supabase_realtime add table food_recipes;
alter publication supabase_realtime add table workout_sessions;
alter publication supabase_realtime add table gym_day_overrides;
alter publication supabase_realtime add table health_logs;
alter publication supabase_realtime add table health_goals;
alter publication supabase_realtime add table skincare_logs;
alter publication supabase_realtime add table style_items;
