-- Ban/suspend flags on profiles, plus DB-level enforcement for suspend.
--
-- Ban is deliberately a *soft* app-level flag (checked in App.jsx after
-- sign-in, forces sign-out) — not a real Supabase Auth ban, per explicit
-- choice: simpler, no service-role/admin-API server function needed.
--
-- Suspend is narrower: the account can still sign in and play, but is
-- blocked from sending anything through `messages` or `larks`. That's
-- enforced here with a trigger rather than only in the UI, because there
-- are 16+ separate call sites across the app that insert into `messages`
-- alone (AbilitiesPanel, Argus, BazaarPanel, CampaignView, CastorDMPanel,
-- DMView, ItemCatalog, LoreAnnouncePanel, dialogue.js, ScribeConsult,
-- ScribePanel, QuestorPanel) — a client-side-only check would need to be
-- duplicated in all of them and is easy to miss one. The trigger checks
-- auth.uid() directly (the actual authenticated caller), not any
-- client-supplied column, since most of those call sites never populate
-- messages.sender_id/larks.sender_id with a real auth user id anyway.
--
-- Run this AFTER 20260728_gate_roles.sql.

alter table public.profiles
  add column if not exists banned boolean not null default false,
  add column if not exists suspended boolean not null default false;

create or replace function public.current_user_blocked_from_sending()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select banned or suspended from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.block_suspended_sender()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_blocked_from_sending() then
    raise exception 'This account cannot send messages right now.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists block_suspended_messages_trg on public.messages;
create trigger block_suspended_messages_trg
  before insert on public.messages
  for each row execute function public.block_suspended_sender();

drop trigger if exists block_suspended_larks_trg on public.larks;
create trigger block_suspended_larks_trg
  before insert on public.larks
  for each row execute function public.block_suspended_sender();
