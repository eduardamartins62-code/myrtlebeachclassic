create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  round_number int not null,
  course_name text not null,
  date date,
  start_time time,
  created_at timestamptz default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'rounds'
      and column_name = 'course'
  ) then
    alter table rounds rename column course to course_name;
  end if;
end $$;

alter table rounds
  drop constraint if exists rounds_round_number_check,
  drop column if exists par,
  drop column if exists entry_pin;

alter table rounds
  add column if not exists course_name text,
  add column if not exists start_time time,
  add column if not exists created_at timestamptz default now();

update rounds
set course_name = coalesce(course_name, '');

alter table rounds
  alter column course_name set not null,
  alter column round_number set not null;

alter table rounds
  drop constraint if exists rounds_event_id_fkey;

alter table rounds
  add constraint rounds_event_id_fkey
  foreign key (event_id)
  references events(id)
  on delete cascade;

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  category text not null,
  name text not null,
  address text,
  description text,
  link text,
  day_label text,
  created_at timestamptz default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'itinerary_items'
      and column_name = 'title'
  ) then
    alter table itinerary_items rename column title to name;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'itinerary_items'
      and column_name = 'website_url'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_name = 'itinerary_items'
      and column_name = 'link'
  ) then
    alter table itinerary_items rename column website_url to link;
  end if;
end $$;

alter table itinerary_items
  add column if not exists event_id uuid references events(id) on delete cascade,
  add column if not exists name text,
  add column if not exists link text,
  add column if not exists created_at timestamptz default now();

alter table itinerary_items
  drop column if exists start_time,
  drop column if exists end_time,
  drop column if exists sort_order,
  drop column if exists is_active,
  drop column if exists updated_at;

update itinerary_items
set name = coalesce(name, ''),
    created_at = coalesce(created_at, now());

alter table itinerary_items
  alter column name set not null,
  alter column category set not null;

create table if not exists history_years (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  title text not null,
  summary text,
  created_at timestamptz default now()
);

create table if not exists history_entries (
  id uuid primary key default gen_random_uuid(),
  year_id uuid references history_years(id) on delete cascade,
  label text not null,
  value text not null,
  created_at timestamptz default now()
);

drop trigger if exists itinerary_items_updated_at on itinerary_items;
