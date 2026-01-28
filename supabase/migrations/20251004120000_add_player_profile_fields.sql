alter table players
  add column if not exists nickname text,
  add column if not exists image_url text;
