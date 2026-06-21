import supabase from './supabase';

// ─── PASSES ────────────────────────────────────────────────────────────────────
export const PASSES = [
  { id: 1,  name: 'Ba\'el',          segment: 'day',   label: 'Dawn' },
  { id: 2,  name: 'Ilowake',         segment: 'day',   label: 'Morning' },
  { id: 3,  name: 'Greenmeet',       segment: 'day',   label: 'Late Morning' },
  { id: 4,  name: 'Highday',         segment: 'day',   label: 'Mid-Morning' },
  { id: 5,  name: 'Harthrise',       segment: 'day',   label: 'Afternoon' },
  { id: 6,  name: 'The Zenith Star', segment: 'day',   label: 'Mid-Afternoon' },
  { id: 7,  name: 'Gildenset',       segment: 'day',   label: 'Late Afternoon' },
  { id: 8,  name: 'Hul-Mora',        segment: 'day',   label: 'Evening' },
  { id: 9,  name: 'Varndurn',        segment: 'day',   label: 'Nightfall' },
  { id: 10, name: 'Nimfall',         segment: 'night', label: 'Deep Night' },
  { id: 11, name: 'Khoneu',          segment: 'night', label: 'Shadow Hour' },
  { id: 12, name: 'Cyanos',          segment: 'night', label: 'Cold Watch' },
  { id: 13, name: 'Lume',            segment: 'night', label: 'Ghost Light' },
];

export const GREATER_CYCLES_EU = [
  'Aman','Balanor','Ylandrium','Renascendum','Espoir',
  'Lumiere','Concordia','Ilostea','Fi\'harium','Veriquel',
  'Solaris','Unifallum','Soronii',
];
export const GREATER_CYCLES_ED = [
  'Maeleth','Urkzar','Firrethium','Drakonis','Malivos',
  'Skotos','Khoneum','Infernalis','Morbulus','Chaotica',
  'Tormentum','Nuctemoron','Soronii',
];

// Real overland/sea travel speeds (Soteria Travel Times & Distances reference).
// Daily distance = miles covered in one turn, since 1 turn = 1 Soterian day.
export const TRAVEL_METHODS = [
  { key: 'walking',  label: 'Walking',           milesPerDay: 22.5 },
  { key: 'horse',    label: 'Horseback',         milesPerDay: 42.5 },
  { key: 'caravan',  label: 'Caravan',           milesPerDay: 17.5 },
  { key: 'river',    label: 'River Barge',       milesPerDay: 35   },
  { key: 'merchant', label: 'Merchant Ship',     milesPerDay: 100  },
  { key: 'fastship', label: 'Fast Naval Vessel', milesPerDay: 197.5 },
];

// ── Soteria runs a 48-hour day, not 24 ──
export const HOURS_PER_DAY = 48;
export const MINUTES_PER_DAY = HOURS_PER_DAY * 60;       // 2880
export const SECONDS_PER_DAY = MINUTES_PER_DAY * 60;     // 172,800

export const FRAGMENTS_PER_TURN = 13 * 120; // 13 passes * 120 fragments = 1 Soterian day
export const SECONDS_PER_FRAGMENT = SECONDS_PER_DAY / FRAGMENTS_PER_TURN; // ~110.77 Soterian seconds
export const MINUTES_PER_PASS = MINUTES_PER_DAY / 13;
export const MINUTES_PER_FRAGMENT = MINUTES_PER_PASS / 120;

// 1 real-world minute of session time = 2 fragments (used for passive out-of-combat ticking only)
export const FRAGMENTS_PER_REAL_SECOND = 2 / 60;

export function getCycleName(era, idx) {
  const arr = era === 'EU' ? GREATER_CYCLES_EU : GREATER_CYCLES_ED;
  return arr[(idx - 1) % arr.length] || '?';
}

export function getPassInfo(pass) {
  return PASSES.find(p => p.id === pass) || PASSES[0];
}

export function advanceFragments(clock, frags) {
  let { anui, greater_cycle, turn, pass, fragment } = clock;
  fragment += frags;
  while (fragment >= 120) { fragment -= 120; pass++; }
  while (pass > 13)        { pass -= 13;     turn++; }
  while (turn > 28)        { turn -= 28;     greater_cycle++; }
  while (greater_cycle > 13){ greater_cycle -= 13; anui++; }
  return { ...clock, anui, greater_cycle, turn, pass, fragment };
}

// Convert a span of in-world (Soterian) seconds directly to fragments
export function soterianSecondsToFragments(soterianSeconds) {
  return soterianSeconds / SECONDS_PER_FRAGMENT;
}

// The clock only moves passively while a session is actively running, anchored to
// when it started. Computed fresh on every render from real elapsed time — no
// setInterval ticking required, so it stays correct even if no tab has it open.
export function getLiveClock(clock) {
  if (!clock?.session_anchor_at || clock.paused) return clock;
  const elapsedSeconds = (Date.now() - new Date(clock.session_anchor_at).getTime()) / 1000;
  if (elapsedSeconds <= 0) return clock;
  return advanceFragments(clock, elapsedSeconds * FRAGMENTS_PER_REAL_SECOND);
}

// HH:MM readout on a 48-hour Soterian clock face
export function getClockTime(pass, fragment) {
  const totalMinutes = (pass - 1) * MINUTES_PER_PASS + fragment * MINUTES_PER_FRAGMENT;
  const hours = Math.floor(totalMinutes / 60) % HOURS_PER_DAY;
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ── Combat-turn clock nudge ──
// Each Hercules combat round = 6 real seconds = 12 Soterian seconds.
// Called instead of relying on passive real-time ticking during combat, since a
// long real-world debate over tactics shouldn't cost minutes of in-fiction time.
export const COMBAT_TURN_SOTERIAN_SECONDS = 12;

export async function advanceCampaignClockByCombatTurn(campaignId) {
  if (!campaignId) return;
  const { data: clock } = await supabase.from('world_clock').select('*')
    .eq('campaign_id', String(campaignId)).maybeSingle();
  if (!clock || clock.paused) return; // Pause always wins, including during combat

  const live = getLiveClock(clock);
  const advanced = advanceFragments(live, soterianSecondsToFragments(COMBAT_TURN_SOTERIAN_SECONDS));
  const patch = {
    ...advanced,
    // Re-anchor to now if a session is live, so passive ticking resumes correctly from this new point
    session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  await supabase.from('world_clock').update(patch).eq('id', clock.id);
}