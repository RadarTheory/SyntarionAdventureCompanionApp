-- AP economy (decided 2026-11-16): a new character starts with 5 AP, and every level gained grants 2 AP.
-- Mirror of STARTING_AP and AP_PER_LEVEL in src/leveling.js. Level thresholds (XP) are unchanged.

-- 1. grant_ap: AP granted = levels gained x 2 (was x 1). Everything else is the function from 20260722_leveling_system.sql.
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
    v_at_granted := greatest(0, v_level_after - v_level_before) * 2;

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

-- 2. Bring existing characters to the new economy: 5 at creation + 2 per level above 1. Only ever adds (never reduces),
--    adds the same amount to current and total, and is safe to run more than once.
with target as (
  select
    c.id,
    greatest(0, 5 + 2 * (greatest(1, coalesce(c.level, 1)) - 1)
      - greatest(0, coalesce(c.at_total, nullif(c.data->>'atTotal', '')::integer, 0))) as bonus
  from public.characters c
)
update public.characters c
set
  at_current = greatest(0, coalesce(c.at_current, nullif(c.data->>'atCurrent', '')::integer, 0)) + t.bonus,
  at_total   = greatest(0, coalesce(c.at_total,   nullif(c.data->>'atTotal',   '')::integer, 0)) + t.bonus,
  "atCurrent" = greatest(0, coalesce(c.at_current, nullif(c.data->>'atCurrent', '')::integer, 0)) + t.bonus,
  "atTotal"   = greatest(0, coalesce(c.at_total,   nullif(c.data->>'atTotal',   '')::integer, 0)) + t.bonus,
  data = jsonb_set(jsonb_set(coalesce(c.data, '{}'::jsonb),
    '{atCurrent}', to_jsonb(greatest(0, coalesce(c.at_current, nullif(c.data->>'atCurrent', '')::integer, 0)) + t.bonus), true),
    '{atTotal}',   to_jsonb(greatest(0, coalesce(c.at_total,   nullif(c.data->>'atTotal',   '')::integer, 0)) + t.bonus), true)
from target t
where t.id = c.id and t.bonus > 0;
