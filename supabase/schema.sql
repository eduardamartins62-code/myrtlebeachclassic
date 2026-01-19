create extension if not exists "pgcrypto";

-- Drop old tables to align with the new multi-round trip schema
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS rounds;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS events;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year int,
  created_at timestamptz not null default now()
);

create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  round_number int not null check (round_number between 1 and 5),
  name text,
  course text,
  date date,
  course_par int not null default 72,
  handicap_enabled boolean not null default true,
  entry_pin text,
  created_at timestamptz not null default now(),
  unique (event_id, round_number)
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
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

create table if not exists admins (
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin',
  primary key (event_id, user_id)
);

create index if not exists idx_rounds_event on rounds(event_id);
create index if not exists idx_players_event on players(event_id);
create index if not exists idx_scores_round on scores(round_id);
create index if not exists idx_scores_player on scores(player_id);
create index if not exists idx_admins_event on admins(event_id);

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
alter table admins enable row level security;

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
      select 1 from admins
      where admins.event_id = events.id
        and admins.user_id = auth.uid()
    )
  );

create policy "Admins manage rounds" on rounds
  for all
  using (
    exists (
      select 1 from admins
      where admins.event_id = rounds.event_id
        and admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from admins
      where admins.event_id = rounds.event_id
        and admins.user_id = auth.uid()
    )
  );

create policy "Admins manage players" on players
  for all
  using (
    exists (
      select 1 from admins
      where admins.event_id = players.event_id
        and admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from admins
      where admins.event_id = players.event_id
        and admins.user_id = auth.uid()
    )
  );

create policy "Admins manage scores" on scores
  for all
  using (
    exists (
      select 1
      from admins
      join rounds on rounds.id = scores.round_id
      where admins.event_id = rounds.event_id
        and admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from admins
      join rounds on rounds.id = scores.round_id
      where admins.event_id = rounds.event_id
        and admins.user_id = auth.uid()
    )
  );

create policy "Admins read admins" on admins
  for select
  using (
    exists (
      select 1 from admins as admin_check
      where admin_check.event_id = admins.event_id
        and admin_check.user_id = auth.uid()
    )
  );

create policy "Admins manage admins" on admins
  for all
  using (
    exists (
      select 1 from admins as admin_check
      where admin_check.event_id = admins.event_id
        and admin_check.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from admins as admin_check
      where admin_check.event_id = admins.event_id
        and admin_check.user_id = auth.uid()
    )
    or (admins.user_id = auth.uid() and admins.role = 'owner')
  );
