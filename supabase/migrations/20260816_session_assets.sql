-- Session Assets: DM-owned images that can be cast over the live map mid-session.
--
-- Two additions and a bucket:
--   1. vtt_sessions.cast_overlay — what the table is currently being shown. The
--      DM canvas and the player/Mapcast viewers already subscribe to changes on
--      this row, so writing here reaches every screen with no new plumbing.
--   2. items.image_url — item art lives in storage, but a column makes "which
--      items have art?" queryable and lets the catalog render a thumbnail
--      without firing a request at a path that may 404.
--   3. the dm_assets bucket the Assets panel has always referenced, with
--      policies matching the role model from 20260728_gate_roles.sql.

-- ── 1. Cast overlay ──────────────────────────────────────────────────────────
-- Shape: { url, title, caption, mode } — null means nothing is being shown.
alter table public.vtt_sessions
  add column if not exists cast_overlay jsonb;

comment on column public.vtt_sessions.cast_overlay is
  'Image currently cast over the live map: { url, title, caption, mode }. Null = nothing shown.';

-- ── 2. Item art ──────────────────────────────────────────────────────────────
alter table public.items
  add column if not exists image_url text;

-- ── 3. Storage bucket ────────────────────────────────────────────────────────
-- Public read: item art is meant for players, and the Mapcast window loads it
-- straight from the URL. Note this makes every object readable to anyone who
-- knows the path — see the warning below about unrevealed content.
insert into storage.buckets (id, name, public)
values ('dm_assets', 'dm_assets', true)
on conflict (id) do nothing;

drop policy if exists "dm_assets_read" on storage.objects;
create policy "dm_assets_read" on storage.objects
  for select to public
  using (bucket_id = 'dm_assets');

-- Writes are DM-tier only. Without these, uploads are refused — and PostgREST
-- reports a blocked write as success with zero rows, so the panel would appear
-- to save and silently do nothing (same trap as 20260810_characters_delete_policy.sql).
drop policy if exists "dm_assets_insert_privileged" on storage.objects;
create policy "dm_assets_insert_privileged" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dm_assets'
    and public.current_gate_role() in ('admin', 'architect', 'creator')
  );

drop policy if exists "dm_assets_update_privileged" on storage.objects;
create policy "dm_assets_update_privileged" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'dm_assets'
    and public.current_gate_role() in ('admin', 'architect', 'creator')
  );

drop policy if exists "dm_assets_delete_privileged" on storage.objects;
create policy "dm_assets_delete_privileged" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dm_assets'
    and public.current_gate_role() in ('admin', 'architect', 'creator')
  );

-- WARNING — unrevealed content:
-- This bucket is public-read, which is correct for item art but wrong for the
-- npcs/ and maps/ folders, where a player who guesses a row id could see a
-- reveal early. Fix when that matters by moving those prefixes to a separate
-- private bucket and serving them through createSignedUrl().
