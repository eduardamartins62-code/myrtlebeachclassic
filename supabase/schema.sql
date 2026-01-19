create extension if not exists "uuid-ossp";

create table if not exists rounds (
  id uuid primary key default uuid_generate_v4(),
  name text not null default 'Myrtle Beach Classic 2026',
  round_number int not null default 1 check (round_number between 1 and 5),
  course text,
  date date,
  handicap_enabled boolean not null default true,
  entry_pin text,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references rounds(id) on delete cascade,
  name text not null,
  handicap int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default uuid_generate_v4(),
  round_id uuid not null references rounds(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  hole_number int not null check (hole_number between 1 and 18),
  strokes int not null check (strokes between 1 and 20),
  updated_at timestamptz not null default now(),
  unique (round_id, player_id, hole_number)
);

create index if not exists idx_players_round on players(round_id);
create index if not exists idx_scores_round on scores(round_id);
create index if not exists idx_scores_player on scores(player_id);

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
