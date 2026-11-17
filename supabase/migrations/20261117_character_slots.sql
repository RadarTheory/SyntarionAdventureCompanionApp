-- Character slots (user, 2026-11-17): real, typed columns for what lives in characters.data, so the app (and realtime)
-- can read and react to each field directly. They are GENERATED columns: Postgres recomputes them from `data` on every
-- write, so every existing write path keeps working untouched and nothing can drift. When the data layer takes over
-- writes, a later migration turns them into plain columns. Names avoid every existing column (name, abilities, level,
-- ap_total, at_current, at_total, "atCurrent", "atTotal") and `sliders`, which an old Ability Tree write already targets.
-- Numbers are parsed only when the text really is a number, so a stray value can never make a write fail.
-- Safe to run more than once.

-- Identity and lineage
alter table public.characters add column if not exists race             text generated always as (data->>'race') stored;
alter table public.characters add column if not exists race_variant     text generated always as (data->>'rv') stored;
alter table public.characters add column if not exists pamorph_variant  text generated always as (data->>'pmV') stored;
alter table public.characters add column if not exists calling          text generated always as (data->>'cid') stored;
alter table public.characters add column if not exists gender           text generated always as (data->>'gender') stored;
alter table public.characters add column if not exists age              text generated always as (data->>'age') stored;
alter table public.characters add column if not exists deity            text generated always as (data->>'deity') stored;
alter table public.characters add column if not exists boon_role        text generated always as (data->>'boonRole') stored;
alter table public.characters add column if not exists backstory        text generated always as (data->>'backstory') stored;
alter table public.characters add column if not exists portrait_url     text generated always as (data->>'portrait_url') stored;
alter table public.characters add column if not exists sprite_url       text generated always as (data->>'sprite_url') stored;

-- Progression
alter table public.characters add column if not exists char_level integer generated always as (
  case when (data->>'charLevel') ~ '^-?[0-9]{1,9}$' then (data->>'charLevel')::integer end) stored;
alter table public.characters add column if not exists ap_current integer generated always as (
  case when (data->>'apCurrent') ~ '^-?[0-9]{1,9}$' then (data->>'apCurrent')::integer end) stored;

-- The eight attributes
alter table public.characters add column if not exists stats       jsonb   generated always as (data->'stats') stored;
alter table public.characters add column if not exists stat_spirit  integer generated always as (case when (data->'stats'->>'spirit')  ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'spirit')::integer  end) stored;
alter table public.characters add column if not exists stat_soul    integer generated always as (case when (data->'stats'->>'soul')    ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'soul')::integer    end) stored;
alter table public.characters add column if not exists stat_body    integer generated always as (case when (data->'stats'->>'body')    ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'body')::integer    end) stored;
alter table public.characters add column if not exists stat_essence integer generated always as (case when (data->'stats'->>'essence') ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'essence')::integer end) stored;
alter table public.characters add column if not exists stat_will    integer generated always as (case when (data->'stats'->>'will')    ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'will')::integer    end) stored;
alter table public.characters add column if not exists stat_whim    integer generated always as (case when (data->'stats'->>'whim')    ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'whim')::integer    end) stored;
alter table public.characters add column if not exists stat_mind    integer generated always as (case when (data->'stats'->>'mind')    ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'mind')::integer    end) stored;
alter table public.characters add column if not exists stat_dream   integer generated always as (case when (data->'stats'->>'dream')   ~ '^-?[0-9]{1,9}$' then (data->'stats'->>'dream')::integer   end) stored;

-- Leanings (the creation sliders, -4..+4)
alter table public.characters add column if not exists lean_morality  numeric generated always as (case when (data->'sliders'->>'morality')  ~ '^-?[0-9]{1,9}(\.[0-9]{1,6})?$' then (data->'sliders'->>'morality')::numeric  end) stored;
alter table public.characters add column if not exists lean_magic_tech numeric generated always as (case when (data->'sliders'->>'magicTech') ~ '^-?[0-9]{1,9}(\.[0-9]{1,6})?$' then (data->'sliders'->>'magicTech')::numeric end) stored;
alter table public.characters add column if not exists lean_will_whim  numeric generated always as (case when (data->'sliders'->>'willWhim')  ~ '^-?[0-9]{1,9}(\.[0-9]{1,6})?$' then (data->'sliders'->>'willWhim')::numeric  end) stored;

-- The world's view of them, the constellation and their state
alter table public.characters add column if not exists standing        jsonb generated always as (data->'standing') stored;
alter table public.characters add column if not exists reputations     jsonb generated always as (data->'reputations') stored;
alter table public.characters add column if not exists regard          jsonb generated always as (data->'regard') stored;
alter table public.characters add column if not exists learned_stars   jsonb generated always as (data->'abilities') stored;
alter table public.characters add column if not exists conditions      jsonb generated always as (data->'conditions') stored;

-- Fast lookups the screens use most
create index if not exists characters_campaign_status_idx on public.characters (campaign_id, status);
create index if not exists characters_calling_idx on public.characters (calling);
