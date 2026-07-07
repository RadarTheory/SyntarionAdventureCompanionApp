import supabase from './supabase';

// ─── PASSES — with the real celestial bodies visible at each, per the Sovereign Calendar ──
// Colors: Major Sun gold, Green Sun green, White Sun pale white, Yellow Moon amber, Blue Moon cyan-blue.
export const SUN_MAJOR  = '#f0d050';
export const SUN_GREEN  = '#7ed957';
export const SUN_WHITE  = '#f5f3ea';
export const MOON_YELLOW = '#d4b85a';
export const MOON_BLUE   = '#5b8fc7';

export const PASSES = [
  { id: 1,  name: 'Ba\'el',          segment: 'day',   label: 'Dawn',
    desc: 'The Major Sun breaches the horizon.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }] },
  { id: 2,  name: 'Ilowake',         segment: 'day',   label: 'Morning',
    desc: 'Full daylight; the Green Sun appears.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }, { name: 'Green Sun', color: SUN_GREEN }] },
  { id: 3,  name: 'Greenmeet',       segment: 'day',   label: 'Late Morning',
    desc: 'The Green Sun aligns with the Major Sun.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }, { name: 'Green Sun', color: SUN_GREEN }] },
  { id: 4,  name: 'Highday',         segment: 'day',   label: 'Mid-Morning',
    desc: 'The Major Sun reigns alone at its height.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }] },
  { id: 5,  name: 'Harthrise',       segment: 'day',   label: 'Afternoon',
    desc: 'The White Sun rises into prominence.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }, { name: 'White Sun', color: SUN_WHITE }] },
  { id: 6,  name: 'The Zenith Star', segment: 'day',   label: 'Mid-Afternoon',
    desc: 'All three suns stand in perfect confluence.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }, { name: 'Green Sun', color: SUN_GREEN }, { name: 'White Sun', color: SUN_WHITE }] },
  { id: 7,  name: 'Gildenset',       segment: 'day',   label: 'Late Afternoon',
    desc: 'The Major Sun begins its descent.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }, { name: 'White Sun', color: SUN_WHITE }] },
  { id: 8,  name: 'Hul-Mora',        segment: 'day',   label: 'Evening',
    desc: 'The Green Sun sets.', bodies: [{ name: 'Major Sun', color: SUN_MAJOR }] },
  { id: 9,  name: 'Varndurn',        segment: 'day',   label: 'Nightfall',
    desc: 'The White Sun sets, ending the Daylight Phase.', bodies: [] },
  { id: 10, name: 'Nimfall',         segment: 'night', label: 'Deep Night',
    desc: 'Absolute darkness.', bodies: [] },
  { id: 11, name: 'Khoneu',          segment: 'night', label: 'Shadow Hour',
    desc: 'The Yellow Moon rises.', bodies: [{ name: 'Yellow Moon', color: MOON_YELLOW }] },
  { id: 12, name: 'Cyanos',          segment: 'night', label: 'Cold Watch',
    desc: 'The Blue Moon rises.', bodies: [{ name: 'Yellow Moon', color: MOON_YELLOW }, { name: 'Blue Moon', color: MOON_BLUE }] },
  { id: 13, name: 'Lume',            segment: 'night', label: 'Ghost Light',
    desc: 'The final moonglow before dawn.', bodies: [{ name: 'Yellow Moon', color: MOON_YELLOW }, { name: 'Blue Moon', color: MOON_BLUE }] },
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

// ── Sovereign Calendar, exactly as documented ──
// 1 Anui = 13 Greater Cycles = 364 Turns
// 1 Greater Cycle = 28 Turns
// 1 Turn (day) = 13 Passes
// 1 Pass = 120 Fragments
// 1 Fragment ≈ 1 minute  →  a Turn is 1560 minutes = 26 hours
export const FRAGMENTS_PER_TURN = 13 * 120; // 1560
export const MINUTES_PER_FRAGMENT = 1;
export const MINUTES_PER_PASS = 120;
export const MINUTES_PER_TURN = 13 * 120;   // 1560 minutes = 26 hours
export const HOURS_PER_TURN = MINUTES_PER_TURN / 60; // 26

// 1 fragment ≈ 1 real-world minute of live session time (passive, out-of-combat pacing)
export const FRAGMENTS_PER_REAL_SECOND = 1 / 60;

// Hercules combat: 1 round = 6 real seconds = 12 Soterian seconds
export const COMBAT_TURN_SOTERIAN_SECONDS = 12;
const SOTERIAN_SECONDS_PER_FRAGMENT = 60; // 1 fragment ≈ 1 minute ≈ 60 Soterian seconds

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

export function soterianSecondsToFragments(soterianSeconds) {
  return soterianSeconds / SOTERIAN_SECONDS_PER_FRAGMENT;
}

export function getLiveClock(clock) {
  if (!clock) return clock;
  // Lesser Cycle is derived, not stored — attach it on every path so displays never see undefined
  const withLesser = (c) => ({ ...c, lesser_cycle: Math.floor(((c.turn || 1) - 1) / 7) + 1 });
  if (!clock.session_anchor_at || clock.paused) return withLesser(clock);
  const elapsedSeconds = (Date.now() - new Date(clock.session_anchor_at).getTime()) / 1000;
  if (elapsedSeconds <= 0) return withLesser(clock);
  return withLesser(advanceFragments(clock, elapsedSeconds * FRAGMENTS_PER_REAL_SECOND));
}

// Hour:minute readout within Soteria's 26-hour day (13 passes × 120 one-minute fragments)
export function getClockTime(pass, fragment) {
  const totalMinutes = (pass - 1) * MINUTES_PER_PASS + fragment * MINUTES_PER_FRAGMENT;
  const hours = Math.floor(totalMinutes / 60) % HOURS_PER_TURN;
  const minutes = Math.round(totalMinutes % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getLesserCycleName(lesserCycleIndex) {
  const names = ["Isain", "Bherun", "Ysyl", "Qarra"];
  return names[(lesserCycleIndex - 1) % 4] || "Unknown Cycle";
}


export async function advanceCampaignClockByCombatTurn(campaignId) {
  if (!campaignId) return;
  const { data: clock } = await supabase.from('world_clock').select('*')
    .eq('campaign_id', String(campaignId)).maybeSingle();
  if (!clock || clock.paused) return; // Pause always wins, including during combat

  const live = getLiveClock(clock);
  const advanced = advanceFragments(live, soterianSecondsToFragments(COMBAT_TURN_SOTERIAN_SECONDS));
  const patch = {
    ...advanced,
    session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  await supabase.from('world_clock').update(patch).eq('id', clock.id);
}