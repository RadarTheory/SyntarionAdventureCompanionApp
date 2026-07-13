-- ═══════════════════════════════════════════════════════════════════
-- THE SCRIBE'S TALE — AI DM state tables
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- One row per running adventure ("tale"). Holds the Scribe's rolling memory
-- so we never re-send full transcripts to Gemini (fixes the quota problem).
create table if not exists scribe_tales (
  id          uuid primary key default gen_random_uuid(),
  campaign_id text not null,
  character_id text not null,          -- the tale's owner (solo play, Phase 1)
  title       text default 'An Untitled Tale',
  scene       text default 'The tale has not yet begun.',
  act         int  default 1,
  tension     int  default 1,          -- 1 calm … 5 climax
  summary     text default '',         -- rolling compressed story memory
  epilogue    text,
  status      text default 'active',   -- active | concluded | abandoned
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Full turn transcript (for the player's record + replay; the AI only ever
-- sees the summary + last N turns).
create table if not exists scribe_tale_turns (
  id         uuid primary key default gen_random_uuid(),
  tale_id    uuid not null references scribe_tales(id) on delete cascade,
  role       text not null,            -- 'player' | 'scribe' | 'roll' | 'system'
  content    text not null,
  actions    jsonb,                    -- what the dispatcher executed, for audit
  created_at timestamptz default now()
);

create index if not exists idx_tale_turns_tale on scribe_tale_turns(tale_id, created_at);
create index if not exists idx_tales_campaign on scribe_tales(campaign_id, character_id);

-- Existing installs can run this file again safely.
alter table scribe_tales add column if not exists act int default 1;
alter table scribe_tales add column if not exists epilogue text;

-- RLS: signed-in users can read/write their tales (matches your current
-- permissive pattern; tighten to claimed_by later if desired)
alter table scribe_tales enable row level security;
alter table scribe_tale_turns enable row level security;

drop policy if exists "tales_all_authed" on scribe_tales;
create policy "tales_all_authed" on scribe_tales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "tale_turns_all_authed" on scribe_tale_turns;
create policy "tale_turns_all_authed" on scribe_tale_turns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
