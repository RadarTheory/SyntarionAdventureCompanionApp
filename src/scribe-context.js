// ─── SCRIBE CONTEXT RETRIEVAL ─────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────

import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_MECHANICS } from './soteria-mechanics';
import { SOTERIA_BESTIARY } from './soteria-bestiary';

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
export function buildScribeContext(question, budget = 10000) {
  const queryTerms = terms(question || '');
  const primer = SECTIONS[0]; // SOTERIA — WORLD PRIMER
  const ranked = SECTIONS
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
