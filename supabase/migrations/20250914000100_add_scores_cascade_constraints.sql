alter table scores
  drop constraint if exists scores_player_id_fkey;

alter table scores
  add constraint scores_player_id_fkey
  foreign key (player_id)
  references players(id)
  on delete cascade;

alter table scores
  drop constraint if exists scores_round_id_fkey;

alter table scores
  add constraint scores_round_id_fkey
  foreign key (round_id)
  references rounds(id)
  on delete cascade;
