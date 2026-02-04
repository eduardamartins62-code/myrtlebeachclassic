create table if not exists round_holes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  par int not null check (par between 3 and 5),
  created_at timestamptz not null default now(),
  unique (round_id, hole_number)
);

create table if not exists round_players (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (round_id, player_id)
);

create index if not exists idx_round_holes_round on round_holes(round_id);
create index if not exists idx_round_players_round on round_players(round_id);
create index if not exists idx_round_players_player on round_players(player_id);

alter table round_holes enable row level security;
alter table round_players enable row level security;

create policy "Public read round holes" on round_holes
  for select
  using (true);

create policy "Public read round players" on round_players
  for select
  using (true);

create policy "Admins manage round holes" on round_holes
  for all
  using (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = round_holes.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = round_holes.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  );

create policy "Admins manage round players" on round_players
  for all
  using (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = round_players.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from event_admins
      join rounds on rounds.id = round_players.round_id
      where event_admins.event_id = rounds.event_id
        and event_admins.user_id = auth.uid()
    )
  );
