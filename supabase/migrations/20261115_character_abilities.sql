-- Mirror of each character's learned constellation abilities, one row per ability, so builds can be
-- queried across characters (DM views, SAS:M&I). Already applied to production on 2026-11-15.
--
-- characters.data->'abilities' stays the source of truth the app reads and writes. The trigger below keeps
-- this table in step on every character save, so never write to it directly.

create table if not exists public.character_abilities (
  character_id uuid not null references public.characters(id) on delete cascade,
  ability_id   text not null,
  learned_at   timestamptz not null default now(),
  primary key (character_id, ability_id)
);

create index if not exists character_abilities_ability_idx on public.character_abilities (ability_id);

alter table public.character_abilities enable row level security;

-- The character's owner can read and change their own abilities.
drop policy if exists "character_abilities_owner_all" on public.character_abilities;
create policy "character_abilities_owner_all" on public.character_abilities
  for all to authenticated
  using (exists (select 1 from public.characters c
                 where c.id = character_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.characters c
                      where c.id = character_id and c.user_id = auth.uid()));

-- DM tiers (same role model as 20260728_gate_roles.sql) can read and manage everyone's.
drop policy if exists "character_abilities_privileged_all" on public.character_abilities;
create policy "character_abilities_privileged_all" on public.character_abilities
  for all to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'))
  with check (public.current_gate_role() in ('admin', 'architect', 'creator'));

-- Backfill from the existing builds. Old-tree keys contain '|' and are skipped, as the app does.
insert into public.character_abilities (character_id, ability_id)
select c.id, a.ability_id
from public.characters c
cross join lateral jsonb_array_elements_text(
  case when jsonb_typeof(c.data->'abilities') = 'array' then c.data->'abilities' else '[]'::jsonb end
) as a(ability_id)
where a.ability_id not like '%|%'
on conflict do nothing;

-- Keep the mirror current: runs as definer so a DM edit or the leveling RPC is never blocked by RLS.
create or replace function public.sync_character_abilities()
returns trigger language plpgsql security definer set search_path = public as $$
declare ids text[];
begin
  select coalesce(array_agg(distinct a), '{}') into ids
  from jsonb_array_elements_text(
    case when jsonb_typeof(new.data->'abilities') = 'array' then new.data->'abilities' else '[]'::jsonb end
  ) as a
  where a not like '%|%';

  delete from public.character_abilities
  where character_id = new.id and not (ability_id = any(ids));

  insert into public.character_abilities (character_id, ability_id)
  select new.id, unnest(ids)
  on conflict do nothing;

  return null;
end $$;

drop trigger if exists characters_sync_abilities on public.characters;
create trigger characters_sync_abilities
  after insert or update of data on public.characters
  for each row execute function public.sync_character_abilities();
