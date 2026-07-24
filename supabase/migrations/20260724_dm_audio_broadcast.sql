-- Player presence (at the table vs remote) and the live DM audio broadcast
-- that lets a remote player's browser mirror what the DM is currently playing.

create table if not exists public.session_listening_mode (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  character_id text not null,
  mode text not null default 'remote', -- 'table' | 'remote'
  updated_at timestamptz not null default now(),
  unique (session_id, character_id)
);

create index if not exists session_listening_mode_session_idx
  on public.session_listening_mode (session_id);

alter table public.session_listening_mode enable row level security;

create policy "session_listening_mode_select_authenticated"
  on public.session_listening_mode for select
  to authenticated
  using (true);

create policy "session_listening_mode_insert_authenticated"
  on public.session_listening_mode for insert
  to authenticated
  with check (true);

create policy "session_listening_mode_update_authenticated"
  on public.session_listening_mode for update
  to authenticated
  using (true)
  with check (true);

-- One row per active session: the DM's current soundboard state, kept live
-- so a remote player joining (or resuming from a personal pause) can compute
-- how far into the current track/scene they should start.
create table if not exists public.dm_audio_broadcast (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  campaign_id text not null,
  music_track jsonb,
  music_started_at timestamptz,
  environment_url text,
  environment_volume real,
  environment_enabled boolean default true,
  ambience_url text,
  ambience_volume real,
  ambience_enabled boolean default true,
  sfx_url text,
  sfx_fired_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists dm_audio_broadcast_campaign_idx
  on public.dm_audio_broadcast (campaign_id);

alter table public.dm_audio_broadcast enable row level security;

create policy "dm_audio_broadcast_select_authenticated"
  on public.dm_audio_broadcast for select
  to authenticated
  using (true);

create policy "dm_audio_broadcast_insert_authenticated"
  on public.dm_audio_broadcast for insert
  to authenticated
  with check (true);

create policy "dm_audio_broadcast_update_authenticated"
  on public.dm_audio_broadcast for update
  to authenticated
  using (true)
  with check (true);
