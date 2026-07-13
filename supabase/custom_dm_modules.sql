-- Custom DM module ownership and asset scope.
-- Run this in Supabase SQL editor before relying on public DMs having fully
-- private module workspaces.

alter table public.modules
  add column if not exists owner_id uuid references auth.users(id) on delete set null,
  add column if not exists is_custom boolean not null default false;

alter table public.campaigns
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

update public.campaigns c
set owner_id = m.owner_id
from public.modules m
where c.module_id = m.id
  and c.owner_id is null
  and m.owner_id is not null;

create table if not exists public.dm_module_assets (
  id uuid primary key default gen_random_uuid(),
  module_id bigint references public.modules(id) on delete cascade,
  campaign_id bigint references public.campaigns(id) on delete cascade,
  asset_type text not null check (
    asset_type in (
      'race',
      'race_variant',
      'class',
      'god',
      'faction',
      'npc',
      'beast',
      'world_map',
      'vtt_map',
      'item',
      'shop',
      'scribe_context',
      'lore'
    )
  ),
  name text not null,
  description text,
  file_url text,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dm_module_assets_module_idx
  on public.dm_module_assets(module_id, asset_type);

create index if not exists dm_module_assets_campaign_idx
  on public.dm_module_assets(campaign_id, asset_type);

alter table public.modules enable row level security;
alter table public.dm_module_assets enable row level security;

drop policy if exists "Owners can manage custom modules" on public.modules;
create policy "Owners can manage custom modules"
on public.modules
for all
using (owner_id is null or owner_id = auth.uid())
with check (owner_id is null or owner_id = auth.uid());

drop policy if exists "Owners can manage module assets" on public.dm_module_assets;
create policy "Owners can manage module assets"
on public.dm_module_assets
for all
using (
  created_by = auth.uid()
  or exists (
    select 1
    from public.modules m
    where m.id = dm_module_assets.module_id
      and m.owner_id = auth.uid()
  )
)
with check (
  created_by = auth.uid()
  or exists (
    select 1
    from public.modules m
    where m.id = dm_module_assets.module_id
      and m.owner_id = auth.uid()
  )
);
