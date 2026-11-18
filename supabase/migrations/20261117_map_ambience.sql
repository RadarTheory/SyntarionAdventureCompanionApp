-- Living maps (2026-11-17): each map's ambience, shared by every campaign that uses the map. See src/lib/ambience.js.
-- map: the map's file name in public/Maps (what vtt_sessions holds). scene: its mood (outdoor, tavern, dungeon...).
-- time_mode: 'clock' follows the campaign's world clock; 'day' | 'dusk' | 'night' hold it. lights: the DM's light pins,
-- [{ id, x, y, kind, size }] with x and y from 0 to 1 across the map.
-- Everyone signed in reads it (players see the same living map); DM tiers write it. Realtime, so a light the DM places
-- appears on every player's map at once. Safe to run more than once.

create table if not exists public.map_ambience (
  map text primary key,
  scene text not null default 'outdoor',
  time_mode text not null default 'clock',
  lights jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.map_ambience enable row level security;

drop policy if exists "map_ambience_select_authenticated" on public.map_ambience;
create policy "map_ambience_select_authenticated" on public.map_ambience
  for select to authenticated using (true);

drop policy if exists "map_ambience_privileged_all" on public.map_ambience;
create policy "map_ambience_privileged_all" on public.map_ambience
  for all to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'))
  with check (public.current_gate_role() in ('admin', 'architect', 'creator'));

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'map_ambience') then
    alter publication supabase_realtime add table public.map_ambience;
  end if;
end $$;
