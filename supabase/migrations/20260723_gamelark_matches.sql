-- GameLark: cross-device challenge invites + synced Elddimgates board state.
-- A row only exists when a real checked-in character is challenged to a seat;
-- DM-only setups (both seats DM/NPC/Scribe) never touch this table.

create table if not exists public.game_lark_matches (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  session_id text,
  game_id text not null,                  -- 'elddimgates' | 'driftstone'
  seat_1 jsonb not null,                  -- {kind, label, character_id?}
  seat_2 jsonb not null,
  challenged_character_id text,           -- the one real player being invited
  challenged_seat int,                    -- 1 | 2
  status text not null default 'pending', -- pending | accepted | declined | active | ended
  game_state jsonb,                       -- Elddimgates' serializable engine state; null for driftstone
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_lark_matches_challenged_idx
  on public.game_lark_matches (challenged_character_id, status);

create index if not exists game_lark_matches_campaign_idx
  on public.game_lark_matches (campaign_id);

alter table public.game_lark_matches enable row level security;

-- No DM-vs-player role concept exists elsewhere in this schema yet, so these
-- policies just gate on being signed in, matching sfx_library.sql's approach.
create policy "game_lark_matches_select_authenticated"
  on public.game_lark_matches for select
  to authenticated
  using (true);

create policy "game_lark_matches_insert_authenticated"
  on public.game_lark_matches for insert
  to authenticated
  with check (true);

create policy "game_lark_matches_update_authenticated"
  on public.game_lark_matches for update
  to authenticated
  using (true)
  with check (true);
