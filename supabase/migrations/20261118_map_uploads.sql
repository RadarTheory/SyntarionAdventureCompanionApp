-- Map uploads and elements (2026-11-18).
-- 1. A public storage bucket for maps the DM uploads from the VTT. Everyone can view them (players load them on the
--    map); DM tiers upload, replace and delete.
-- 2. vtt_maps: the uploaded maps the VTT's map picker lists beside the built-in ones in public/Maps.
--    A map's key across the app is 'upload:<path in the bucket>'; built-in maps keep their file name.
-- 3. map_ambience.hidden_found: painted lights the app found that the DM switched off for that map.
-- Safe to run more than once.

insert into storage.buckets (id, name, public)
values ('maps', 'maps', true)
on conflict (id) do update set public = true;

drop policy if exists "maps_bucket_read" on storage.objects;
create policy "maps_bucket_read" on storage.objects
  for select using (bucket_id = 'maps');

drop policy if exists "maps_bucket_privileged_write" on storage.objects;
create policy "maps_bucket_privileged_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'maps' and public.current_gate_role() in ('admin', 'architect', 'creator'))
  with check (bucket_id = 'maps' and public.current_gate_role() in ('admin', 'architect', 'creator'));

create table if not exists public.vtt_maps (
  key text primary key,          -- 'upload:<path>'
  name text not null,
  path text not null,            -- path in the maps bucket
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

alter table public.vtt_maps enable row level security;

drop policy if exists "vtt_maps_select_authenticated" on public.vtt_maps;
create policy "vtt_maps_select_authenticated" on public.vtt_maps
  for select to authenticated using (true);

drop policy if exists "vtt_maps_privileged_all" on public.vtt_maps;
create policy "vtt_maps_privileged_all" on public.vtt_maps
  for all to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'))
  with check (public.current_gate_role() in ('admin', 'architect', 'creator'));

alter table public.map_ambience add column if not exists hidden_found jsonb not null default '[]'::jsonb;
