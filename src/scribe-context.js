// ─── SCRIBE CONTEXT RETRIEVAL ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────

import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_MECHANICS } from './soteria-mechanics';
import { SOTERIA_BESTIARY } from './soteria-bestiary';
import supabase from './lib/supabase';
import { TRAVEL_METHODS } from './lib/soteriaclock';

const HEADER = /━{10,}\s*\n([^\n]+)\n━{10,}/g;

function splitSections(corpus, sourceLabel) {
  if (typeof corpus !== 'string' || !corpus.trim()) return [];
  const sections = [];
  const matches = [...corpus.matchAll(HEADER)];
  if (matches.length === 0) {
    return [{ source: sourceLabel, title: sourceLabel, body: corpus.trim() }];
  }
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : corpus.length;
    const body = corpus.slice(start, end).trim();
    if (body) sections.push({ source: sourceLabel, title, body });
  }
  return sections;
}

// Built once at module load
const SECTIONS = [
  ...splitSections(SOTERIA_LORE, 'LORE'),
  ...splitSections(SOTERIA_MECHANICS, 'MECHANICS'),
  ...splitSections(SOTERIA_BESTIARY, 'BESTIARY'),
];

const STOPWORDS = new Set(['the','a','an','and','or','of','to','in','on','for','with','is','are','was','were','it','its','my','our','your','their','his','her','what','who','how','why','when','where','do','does','did','can','could','should','would','about','tell','me','i','you','we','they','that','this','these','those']);

function terms(text) {
  return (text.toLowerCase().match(/[a-z']{3,}/g) || []).filter(w => !STOPWORDS.has(w));
}

function scoreSection(queryTerms, section) {
  if (queryTerms.length === 0) return 0;
  const titleLow = section.title.toLowerCase();
  const bodyLow = section.body.toLowerCase();
  let score = 0;
  for (const t of queryTerms) {
    if (titleLow.includes(t)) score += 6;
    // count body hits, capped so one repeated word can't dominate
    let hits = 0, idx = bodyLow.indexOf(t);
    while (idx !== -1 && hits < 5) { hits++; idx = bodyLow.indexOf(t, idx + t.length); }
    score += hits;
  }
  return score;
}

/**
 * Build a world-context string for a Scribe call.
 * Always includes the WORLD PRIMER (first lore section) as grounding,
 * then fills the remaining budget with the highest-scoring sections.
 */
async function loadLiveNpcSections() {
  const { data, error } = await supabase
    .from('npcs')
    .select('name, role, notes, faction, active')
    .order('name');
  if (error || !data) return [];
  return data
    .filter(n => n.active !== false && n.name)
    .map(n => ({
      source: 'LIVE NPC ROSTER',
      title: n.name,
      body: [
        n.role ? `Role: ${n.role}` : '',
        n.faction ? `Faction: ${n.faction}` : '',
        n.notes ? `Notes: ${String(n.notes).slice(0, 500)}` : '',
      ].filter(Boolean).join('\n') || 'Known NPC.',
    }));
}

export async function buildLiveNpcRoster(limit = 80) {
  const rows = await loadLiveNpcSections();
  return rows.slice(0, limit).map(r => `- ${r.title}: ${r.body.replace(/\n/g, '; ')}`).join('\n');
}

async function loadLiveBeastSections(campaignId) {
  let query = supabase.from('beasts').select('name, description, category, biome, disposition, source, campaign_id');
  query = campaignId
    ? query.or(`source.eq.global,campaign_id.eq.${campaignId}`)
    : query.eq('source', 'global');
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(b => ({
    source: 'BESTIARY',
    title: b.name,
    body: [b.description, b.category ? `Category: ${b.category}` : '', b.biome ? `Biome: ${b.biome}` : '', b.disposition ? `Disposition: ${b.disposition}` : ''].filter(Boolean).join('\n'),
  }));
}

async function loadLiveItemSections() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name')
    .limit(1200);
  if (error || !data) return [];
  return data
    .filter(item => item.name)
    .map(item => ({
      source: 'ITEMS',
      title: item.name,
      body: [
        item.category ? `Category: ${item.category}` : '',
        item.type ? `Type: ${item.type}` : '',
        item.rarity ? `Rarity: ${item.rarity}` : '',
        item.description ? String(item.description).slice(0, 700) : '',
        item.meta ? `Meta: ${String(item.meta).slice(0, 300)}` : '',
        Array.isArray(item.tags) && item.tags.length ? `Tags: ${item.tags.join(', ')}` : '',
      ].filter(Boolean).join('\n') || 'Known item.',
    }));
}

async function loadLocationSections(campaignId) {
  let query = supabase.from('locations').select('*').order('name');
  query = campaignId
    ? query.or(`campaign_id.is.null,campaign_id.eq.${campaignId}`)
    : query.is('campaign_id', null);
  const { data, error } = await query;
  if (error || !data) return [];
  return data
    .filter(loc => loc.name)
    .map(loc => ({
      source: 'POIS / LOCATIONS',
      title: loc.name,
      body: [
        loc.type ? `Type: ${loc.type}` : '',
        loc.region ? `Region: ${loc.region}` : '',
        loc.notes ? String(loc.notes).slice(0, 900) : '',
        Number.isFinite(Number(loc.x_pct)) && Number.isFinite(Number(loc.y_pct)) ? `Map position: ${Number(loc.x_pct).toFixed(2)}%, ${Number(loc.y_pct).toFixed(2)}%` : '',
      ].filter(Boolean).join('\n') || 'Known point of interest.',
    }));
}

function travelMethodSections() {
  return [{
    source: 'TRAVEL TIME',
    title: 'Soteria Travel Speeds',
    body: TRAVEL_METHODS.map(m => `${m.label}: ${m.milesPerDay} miles per Soterian day/turn`).join('\n'),
  }];
}
async function loadDbContextSections(campaignId) {
  let query = supabase.from('scribe_context').select('source, title, body, campaign_id');
  query = campaignId
    ? query.or(`campaign_id.is.null,campaign_id.eq.${campaignId}`)
    : query.is('campaign_id', null);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(r => ({ source: r.source || 'UPLOAD', title: r.title, body: r.body }));
}

export async function buildScribeContext(question, budget = 10000, campaignId = null) {
  const [liveNpcs, liveBeasts, liveItems, locations, dbSections] = await Promise.all([
    loadLiveNpcSections(),
    loadLiveBeastSections(campaignId),
    loadLiveItemSections(),
    loadLocationSections(campaignId),
    loadDbContextSections(campaignId),
  ]);
  const allSections = [...SECTIONS, ...travelMethodSections(), ...liveNpcs, ...liveBeasts, ...liveItems, ...locations, ...dbSections];

  const queryTerms = terms(question || '');
  const primer = SECTIONS[0]; // SOTERIA — WORLD PRIMER
  const ranked = allSections
    .slice(1)
    .map(s => ({ s, score: scoreSection(queryTerms, s) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = [primer];
  let used = primer.body.length + primer.title.length;
  for (const { s } of ranked) {
    const cost = s.title.length + s.body.length + 24;
    if (used + cost > budget) continue;
    picked.push(s);
    used += cost;
    if (used > budget) break;
  }

  return picked
    .map(s => `── ${s.source}: ${s.title} ──\n${s.body}`)
    .join('\n\n');
}

// Optional: quick visibility into what the splitter found (dev only)
export function _scribeContextStats() {
  return SECTIONS.map(s => `${s.source} · ${s.title} · ${s.body.length} chars`);
}
