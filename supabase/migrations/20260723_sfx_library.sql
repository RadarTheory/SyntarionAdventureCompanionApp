-- Live-editable SFX/Environment/Ambience catalog for the DM Soundboard.
-- Replaces the static public/sfx-manifest.json as the source of truth once
-- the app is switched over to query this table (see src/soundLibrary.js).

create table if not exists public.sfx_library (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  category text not null,
  filename text not null,
  path text not null,
  created_at timestamptz not null default now()
);

create index if not exists sfx_library_category_idx on public.sfx_library (category);

alter table public.sfx_library enable row level security;

-- No DM-vs-player role concept exists elsewhere in this schema yet, so these
-- policies just gate on being signed in. Tighten later if you add a real
-- DM/player role column somewhere (e.g. a campaign_members table).
create policy "sfx_library_select_authenticated"
  on public.sfx_library for select
  to authenticated
  using (true);

create policy "sfx_library_insert_authenticated"
  on public.sfx_library for insert
  to authenticated
  with check (true);

create policy "sfx_library_update_authenticated"
  on public.sfx_library for update
  to authenticated
  using (true)
  with check (true);

create policy "sfx_library_delete_authenticated"
  on public.sfx_library for delete
  to authenticated
  using (true);
