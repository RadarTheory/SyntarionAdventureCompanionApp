-- The Gate: user role/permission system, shared by Syntarion Admin and (later) Oracle.
-- Roles: player (default), admin, architect (the DM/GM tier — matches existing
-- "The Architect" flavor text used throughout the app), creator (the owner, you).

do $$
begin
  create type public.gate_role as enum ('player', 'admin', 'architect', 'creator');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.gate_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Auto-create a profile row for every new signup. The hardcoded owner UUID
-- (matches VITE_DM_USER_ID / ADMIN_UUID already used in AdminPortal.jsx and
-- CharacterSheet.jsx) is seeded as 'creator'; everyone else starts as 'player'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    (case when new.id = 'fd2b5a52-e179-4234-9265-9b5ab36d6ace'::uuid then 'creator' else 'player' end)::public.gate_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts that already existed before this migration.
insert into public.profiles (id, role)
select id, (case when id = 'fd2b5a52-e179-4234-9265-9b5ab36d6ace'::uuid then 'creator' else 'player' end)::public.gate_role
from auth.users
on conflict (id) do nothing;

-- security definer helper so RLS policies below don't self-reference profiles
-- (avoids recursive-policy footguns) and so other future policies/functions can
-- cheaply check "what role is the calling user" without their own subquery.
create or replace function public.current_gate_role()
returns public.gate_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_select_privileged" on public.profiles;
create policy "profiles_select_privileged" on public.profiles
  for select to authenticated
  using (public.current_gate_role() in ('admin', 'architect', 'creator'));

-- Only the creator can change anyone's role (including their own), keeping
-- role assignment a single-owner action for now.
drop policy if exists "profiles_update_creator_only" on public.profiles;
create policy "profiles_update_creator_only" on public.profiles
  for update to authenticated
  using (public.current_gate_role() = 'creator')
  with check (public.current_gate_role() = 'creator');

drop policy if exists "profiles_insert_creator_only" on public.profiles;
create policy "profiles_insert_creator_only" on public.profiles
  for insert to authenticated
  with check (public.current_gate_role() = 'creator');

-- Safety net: block demoting the last remaining creator, from any caller
-- (UI, RPC, or a direct SQL editor session) — losing every creator locks
-- everyone out of role management, since only a creator can grant it back.
create or replace function public.prevent_last_creator_demotion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'creator' and new.role <> 'creator' then
    if (select count(*) from public.profiles where role = 'creator') <= 1 then
      raise exception 'Cannot change the last remaining creator''s role.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_last_creator_demotion_trg on public.profiles;
create trigger prevent_last_creator_demotion_trg
  before update on public.profiles
  for each row execute function public.prevent_last_creator_demotion();
