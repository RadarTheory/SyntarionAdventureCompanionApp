-- AP progression and AT unlock economy.
-- AP raises level. AT (Ability Tokens) are minted on level-up and spent on ability tree unlocks.

create extension if not exists pgcrypto;

create or replace function public.syntarion_ap_for_level(p_level integer)
returns integer
language sql
immutable
as $$
  select case
    when p_level is null or p_level <= 1 then 0
    when p_level >= 50 then 100 * 49 * 49
    else 100 * (p_level - 1) * (p_level - 1)
  end;
$$;

create or replace function public.syntarion_level_for_ap(p_ap integer)
returns integer
language plpgsql
immutable
as $$
declare
  v_ap integer := greatest(0, coalesce(p_ap, 0));
  v_level integer := 1;
  v_next integer;
begin
  for v_next in 2..50 loop
    exit when v_ap < public.syntarion_ap_for_level(v_next);
    v_level := v_next;
  end loop;
  return v_level;
end;
$$;

alter table public.characters add column if not exists ap_total integer not null default 0;
alter table public.characters add column if not exists level integer not null default 1;
alter table public.characters add column if not exists at_current integer not null default 0;
alter table public.characters add column if not exists at_total integer not null default 0;
alter table public.characters add column if not exists "atCurrent" integer not null default 0;
alter table public.characters add column if not exists "atTotal" integer not null default 0;

alter table public.npcs add column if not exists ap_total integer not null default 0;
alter table public.npcs add column if not exists level integer not null default 1;
alter table public.beasts add column if not exists ap_total integer not null default 0;
alter table public.beasts add column if not exists level integer not null default 1;

alter table public.items add column if not exists ap_bonus integer not null default 0;
alter table public.character_items add column if not exists ap_bonus integer not null default 0;
alter table public.lootbox_items add column if not exists ap_bonus integer not null default 0;

create table if not exists public.ap_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('character', 'npc', 'beast')),
  target_id text not null,
  amount integer not null check (amount > 0),
  ap_before integer not null default 0,
  ap_after integer not null default 0,
  level_before integer not null default 1,
  level_after integer not null default 1,
  at_granted integer not null default 0,
  source_type text not null default 'dm',
  source_id text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists ap_events_target_idx on public.ap_events (target_type, target_id, created_at desc);

create table if not exists public.item_ap_claims (
  id uuid primary key default gen_random_uuid(),
  character_id text not null,
  item_key text not null,
  character_item_id uuid,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (character_id, item_key)
);

update public.characters
set
  ap_total = greatest(0, coalesce(nullif(data->>'apTotal', '')::integer, ap_total, 0)),
  level = public.syntarion_level_for_ap(greatest(0, coalesce(nullif(data->>'apTotal', '')::integer, ap_total, 0))),
  at_current = greatest(0, coalesce(nullif(data->>'atCurrent', '')::integer, nullif(data->>'apCurrent', '')::integer, at_current, "atCurrent", 0)),
  at_total = greatest(0, coalesce(nullif(data->>'atTotal', '')::integer, nullif(data->>'apTotal', '')::integer, at_total, "atTotal", 0)),
  "atCurrent" = greatest(0, coalesce(nullif(data->>'atCurrent', '')::integer, nullif(data->>'apCurrent', '')::integer, "atCurrent", at_current, 0)),
  "atTotal" = greatest(0, coalesce(nullif(data->>'atTotal', '')::integer, nullif(data->>'apTotal', '')::integer, "atTotal", at_total, 0)),
  data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(coalesce(data, '{}'::jsonb), '{apTotal}', to_jsonb(greatest(0, coalesce(nullif(data->>'apTotal', '')::integer, ap_total, 0))), true),
        '{charLevel}', to_jsonb(public.syntarion_level_for_ap(greatest(0, coalesce(nullif(data->>'apTotal', '')::integer, ap_total, 0)))), true
      ),
      '{atCurrent}', to_jsonb(greatest(0, coalesce(nullif(data->>'atCurrent', '')::integer, nullif(data->>'apCurrent', '')::integer, "atCurrent", at_current, 0))), true
    ),
    '{atTotal}', to_jsonb(greatest(0, coalesce(nullif(data->>'atTotal', '')::integer, nullif(data->>'apTotal', '')::integer, "atTotal", at_total, 0))), true
  );

create or replace function public.grant_ap(
  p_target_type text,
  p_target_id text,
  p_amount integer,
  p_reason text default null,
  p_source_type text default 'dm',
  p_source_id text default null
)
returns table (
  event_id uuid,
  target_type text,
  target_id text,
  ap_before integer,
  ap_after integer,
  level_before integer,
  level_after integer,
  at_granted integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount integer := greatest(0, coalesce(p_amount, 0));
  v_ap_before integer;
  v_ap_after integer;
  v_level_before integer;
  v_level_after integer;
  v_at_granted integer := 0;
  v_event_id uuid;
  v_row_id uuid;
  v_data jsonb;
begin
  if p_target_type not in ('character', 'npc', 'beast') then
    raise exception 'Unsupported AP target type: %', p_target_type;
  end if;
  if v_amount <= 0 then
    raise exception 'AP amount must be positive';
  end if;

  if p_target_type = 'character' then
    v_row_id := p_target_id::uuid;
    select c.ap_total, c.data into v_ap_before, v_data from public.characters c where c.id = v_row_id for update;
    if not found then raise exception 'Character not found: %', p_target_id; end if;
    v_ap_before := greatest(0, coalesce(v_ap_before, nullif(v_data->>'apTotal', '')::integer, 0));
    v_level_before := public.syntarion_level_for_ap(v_ap_before);
    v_ap_after := v_ap_before + v_amount;
    v_level_after := public.syntarion_level_for_ap(v_ap_after);
    v_at_granted := greatest(0, v_level_after - v_level_before);

    update public.characters
    set
      ap_total = v_ap_after,
      level = v_level_after,
      at_current = greatest(0, coalesce(at_current, "atCurrent", nullif(data->>'atCurrent', '')::integer, 0)) + v_at_granted,
      at_total = greatest(0, coalesce(at_total, "atTotal", nullif(data->>'atTotal', '')::integer, 0)) + v_at_granted,
      "atCurrent" = greatest(0, coalesce("atCurrent", at_current, nullif(data->>'atCurrent', '')::integer, 0)) + v_at_granted,
      "atTotal" = greatest(0, coalesce("atTotal", at_total, nullif(data->>'atTotal', '')::integer, 0)) + v_at_granted,
      data = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(coalesce(data, '{}'::jsonb), '{apTotal}', to_jsonb(v_ap_after), true), '{apCurrent}', to_jsonb(v_ap_after), true), '{charLevel}', to_jsonb(v_level_after), true), '{atCurrent}', to_jsonb(greatest(0, coalesce(at_current, "atCurrent", nullif(data->>'atCurrent', '')::integer, 0)) + v_at_granted), true), '{atTotal}', to_jsonb(greatest(0, coalesce(at_total, "atTotal", nullif(data->>'atTotal', '')::integer, 0)) + v_at_granted), true)
    where id = v_row_id;
  elsif p_target_type = 'npc' then
    v_row_id := p_target_id::uuid;
    select n.ap_total into v_ap_before from public.npcs n where n.id = v_row_id for update;
    if not found then raise exception 'NPC not found: %', p_target_id; end if;
    v_ap_before := greatest(0, coalesce(v_ap_before, 0));
    v_level_before := public.syntarion_level_for_ap(v_ap_before);
    v_ap_after := v_ap_before + v_amount;
    v_level_after := public.syntarion_level_for_ap(v_ap_after);
    update public.npcs set ap_total = v_ap_after, level = v_level_after where id = v_row_id;
  else
    v_row_id := p_target_id::uuid;
    select b.ap_total into v_ap_before from public.beasts b where b.id = v_row_id for update;
    if not found then raise exception 'Beast not found: %', p_target_id; end if;
    v_ap_before := greatest(0, coalesce(v_ap_before, 0));
    v_level_before := public.syntarion_level_for_ap(v_ap_before);
    v_ap_after := v_ap_before + v_amount;
    v_level_after := public.syntarion_level_for_ap(v_ap_after);
    update public.beasts set ap_total = v_ap_after, level = v_level_after where id = v_row_id;
  end if;

  insert into public.ap_events (target_type, target_id, amount, ap_before, ap_after, level_before, level_after, at_granted, source_type, source_id, reason)
  values (p_target_type, p_target_id, v_amount, v_ap_before, v_ap_after, v_level_before, v_level_after, v_at_granted, coalesce(p_source_type, 'dm'), p_source_id, p_reason)
  returning id into v_event_id;

  event_id := v_event_id;
  target_type := p_target_type;
  target_id := p_target_id;
  ap_before := v_ap_before;
  ap_after := v_ap_after;
  level_before := v_level_before;
  level_after := v_level_after;
  at_granted := v_at_granted;
  return next;
end;
$$;

create or replace function public.apply_character_item_ap_bonus()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bonus integer;
  v_item_key text;
begin
  v_bonus := greatest(0, coalesce(NEW.ap_bonus, nullif(NEW.bonuses->>'apBonus', '')::integer, 0));
  if v_bonus <= 0 or NEW.character_id is null then return NEW; end if;
  v_item_key := encode(digest(lower(coalesce(NEW.name, 'unnamed-item')) || ':' || v_bonus::text, 'sha256'), 'hex');

  insert into public.item_ap_claims (character_id, item_key, character_item_id, amount)
  values (NEW.character_id::text, v_item_key, NEW.id, v_bonus)
  on conflict (character_id, item_key) do nothing;

  if found then
    perform * from public.grant_ap('character', NEW.character_id::text, v_bonus, 'Held item AP: ' || coalesce(NEW.name, 'Unnamed item'), 'item', NEW.id::text);
  end if;
  return NEW;
end;
$$;

drop trigger if exists character_items_apply_ap_bonus on public.character_items;
create trigger character_items_apply_ap_bonus
after insert or update of character_id, name, bonuses, ap_bonus
on public.character_items
for each row
execute function public.apply_character_item_ap_bonus();
