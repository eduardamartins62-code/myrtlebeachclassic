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

insert into past_events (
  year,
  title,
  summary,
  winner_name,
  total_players,
  notable_courses,
  highlight_notes,
  is_published
)
select
  2025,
  'Myrtle Beach Classic 2025',
  'The inaugural Myrtle Beach Classic trip set the tone for the rivalry with four unforgettable rounds along the coast and a dramatic final-day push to the clubhouse.',
  'TBD',
  16,
  'Caledonia Golf & Fish Club, True Blue, Grande Dunes',
  'Lowest round: 68 on Saturday. Closest-to-the-pin showdown at the 17th.',
  true
where not exists (
  select 1 from past_events where year = 2025
);
