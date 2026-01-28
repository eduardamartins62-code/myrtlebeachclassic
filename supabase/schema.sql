create extension if not exists "pgcrypto";

-- Drop old tables to align with the new multi-round trip schema
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS event_admins;
DROP TABLE IF EXISTS events;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_number int not null check (round_number between 1 and 5),
  course text,
  date date,
  par int not null default 72,
  entry_pin text,
  created_at timestamptz not null default now(),
  unique (event_id, round_number)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  nickname text,
  image_url text,
  handicap int not null default 0,
  starting_score int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  strokes int not null check (strokes between 1 and 20),
  updated_at timestamptz not null default now(),
  unique (round_id, player_id, hole_number)
);

create table if not exists event_admins (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists idx_rounds_event on rounds(event_id);
create index if not exists idx_players_event on players(event_id);
create index if not exists idx_scores_round on scores(round_id);
create index if not exists idx_scores_player on scores(player_id);
create index if not exists idx_event_admins_event on event_admins(event_id);

create or replace function set_scores_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scores_updated_at
before update on scores
for each row
execute function set_scores_updated_at();

alter table events enable row level security;
alter table rounds enable row level security;
alter table players enable row level security;
alter table scores enable row level security;
alter table event_admins enable row level security;

create policy "Public read events" on events
  for select
  using (true);

create policy "Public read rounds" on rounds
  for select
  using (true);

create policy "Public read players" on players
  for select
  using (true);

create policy "Public read scores" on scores
  for select
  using (true);

create policy "Authenticated create events" on events
  for insert
  with check (auth.uid() is not null);

create policy "Admins update events" on events
  for update
  using (
    exists (
      select 1 from event_admins
      where event_admins.event_id = events.id
        and event_admins.user_id = auth.uid()
    )
  );

create policy "Admins manage rounds" on rounds
  for all
  using (
    exists (
      select 1 from event_admins
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_admins
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  );

create policy "Admins manage players" on players
  for all
  using (
    exists (
      select 1 from event_admins
      where event_admins.event_id = players.event_id
        and event_admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_admins
      where event_admins.event_id = players.event_id
        and event_admins.user_id = auth.uid()
    )
  );

create policy "Admins manage scores" on scores
  for all
  using (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = scores.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = scores.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  );

create policy "Admins read admins" on event_admins
  for select
  using (
    exists (
      select 1 from event_admins as admin_check
      where admin_check.event_id = event_admins.event_id
        and admin_check.user_id = auth.uid()
    )
  );

create policy "Admins manage admins" on event_admins
  for all
  using (
    exists (
      select 1 from event_admins as admin_check
      where admin_check.event_id = event_admins.event_id
        and admin_check.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from event_admins as admin_check
      where admin_check.event_id = event_admins.event_id
        and admin_check.user_id = auth.uid()
    )
    or (event_admins.user_id = auth.uid() and event_admins.role = 'owner')
  );

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'PLAYER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists itinerary_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  address text,
  website_url text,
  start_time timestamptz,
  end_time timestamptz,
  day_label text,
  sort_order int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists past_events (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  title text not null,
  summary text not null,
  winner_name text,
  runner_up_name text,
  total_players int,
  notable_courses text,
  highlight_notes text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
before update on profiles
for each row
execute function set_updated_at();

create trigger itinerary_items_updated_at
before update on itinerary_items
for each row
execute function set_updated_at();

create trigger past_events_updated_at
before update on past_events
for each row
execute function set_updated_at();

alter table profiles enable row level security;
alter table itinerary_items enable row level security;
alter table past_events enable row level security;

create policy "Profiles read own" on profiles
  for select
  using (auth.uid() = id);

create policy "Profiles insert own" on profiles
  for insert
  with check (auth.uid() = id);

create policy "Profiles update own" on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public read itinerary" on itinerary_items
  for select
  using (is_active = true);

create policy "Public read past events" on past_events
  for select
  using (is_published = true);

create policy "Super admins manage events" on events
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  );

create policy "Super admins manage rounds" on rounds
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  );

create policy "Super admins manage players" on players
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'SUPER_ADMIN'
    )
  );

create policy "Scorekeepers manage scores" on scores
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('SUPER_ADMIN', 'SCORE_KEEPER')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('SUPER_ADMIN', 'SCORE_KEEPER')
    )
  );
