-- Reactions (2026-11-16): NPCs react to characters, after Arcanum's reaction system. See src/reactions.js.
-- 1. Reputations the DM writes (what a character is known for, and which groups it moves). The app also carries a starter
--    set in code (STARTER_REPUTATIONS), so this table holds only the DM's own. Everyone signed in can read them; DM tiers write.
-- 2. An NPC's morality (good | neutral | evil), beside npcs.alignment, which already holds their Magic | Tech lean.
-- Characters keep their standings, reputations and per-NPC regard in characters.data (standing, reputations, regard).
-- Safe to run more than once.

create table if not exists public.reputations (
  id text primary key,
  name text not null,
  description text not null default '',
  effects jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.reputations enable row level security;

drop policy if exists "reputations_select_authenticated" on public.reputations;
create policy "reputations_select_authenticated" on public.reputations
  for select to authenticated using (true);

drop policy if exists "reputations_privileged_all" on public.reputations;
create policy "reputations_privileged_all" on public.reputations
  for all to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'))
  with check (public.current_gate_role() in ('admin', 'architect', 'creator'));

alter table public.npcs add column if not exists morality text not null default 'neutral';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'npcs_morality_check') then
    alter table public.npcs add constraint npcs_morality_check check (morality in ('good', 'neutral', 'evil'));
  end if;
end $$;
