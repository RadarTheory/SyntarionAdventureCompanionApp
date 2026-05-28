import { useState, useRef } from 'react';
import { COLORS, CAMPAIGNS, RACES, ALL_CLASSES, GODS, SPIRITS } from './constants';
import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_MECHANICS } from './soteria-mechanics';
import { SOTERIA_BESTIARY } from './soteria-bestiary';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-1.5-flash';

// ─── CATEGORY DEFINITIONS ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'npc',
    label: 'NPC',
    icon: '⚔',
    color: COLORS.magic,
    colorBg: COLORS.magicBg,
    desc: 'Named character with role, personality, secrets, and stat block',
    fields: ['Name', 'Role / Occupation', 'Faction affiliation', 'Campaign'],
  },
  {
    id: 'faction',
    label: 'Faction',
    icon: '⬡',
    color: COLORS.tech,
    colorBg: COLORS.techBg,
    desc: 'Organization, guild, order, or criminal syndicate with structure and agenda',
    fields: ['Faction name', 'Type (guild/order/cult/etc)', 'Based in', 'Campaign relevance'],
  },
  {
    id: 'location',
    label: 'City / POI',
    icon: '◈',
    color: '#e8c84a',
    colorBg: 'rgba(232,200,74,0.10)',
    desc: 'Settlement, dungeon, plane of existence, or point of interest',
    fields: ['Location name', 'Type (city/ruin/plane/etc)', 'Region or biome', 'Campaign'],
  },
  {
    id: 'item',
    label: 'Item',
    icon: '◆',
    color: COLORS.spirit,
    colorBg: COLORS.spiritBg,
    desc: 'Weapon, armor, artifact, relic, or wondrous item with mechanics',
    fields: ['Item name', 'Type (weapon/armor/artifact/etc)', 'Rarity', 'Magic or tech'],
  },
  {
    id: 'spell',
    label: 'Spell / Ability',
    icon: '✦',
    color: COLORS.deity,
    colorBg: COLORS.deityBg,
    desc: 'Mote, Charm, Spell, or Weave with discipline and mechanical effect',
    fields: ['Spell name', 'Discipline (Sanctus/Mana/etc)', 'Tier (Mote/Charm/Spell/Weave)', 'Cost'],
  },
  {
    id: 'tech',
    label: 'Tech / Schematic',
    icon: '⚙',
    color: COLORS.techText,
    colorBg: COLORS.techBg,
    desc: 'Tinkertrick, Diagram, Schematic, or Blueprint with engineering notes',
    fields: ['Tech name', 'Category (Tinkertrick/Schematic/Blueprint)', 'Discipline', 'Complexity'],
  },
  {
    id: 'beast',
    label: 'Beast',
    icon: '☽',
    color: '#a8e6a3',
    colorBg: 'rgba(168,230,163,0.10)',
    desc: 'Creature with biome, resonance classification, and threat level',
    fields: ['Creature name', 'Biome', 'Disposition', 'Threat level'],
  },
  {
    id: 'action',
    label: 'Action / Ability',
    icon: '▶',
    color: COLORS.magicText,
    colorBg: COLORS.magicBg,
    desc: 'Combat action, class ability, or racial trait with mechanical text',
    fields: ['Ability name', 'Class or race', 'Tier (Passive/Active/Ultimate)', 'Stat key'],
  },
  {
    id: 'race',
    label: 'Race / Subrace',
    icon: '◉',
    color: '#d8b4fe',
    colorBg: 'rgba(216,180,254,0.10)',
    desc: 'New bloodline, Pa\'morph variant, or cultural subrace',
    fields: ['Race name', 'Base type (humanoid/beast/etc)', 'Tag (magic/tech/any)', 'Cultural origin'],
  },
  {
    id: 'event',
    label: 'Historical Event',
    icon: '⌛',
    color: COLORS.muted,
    colorBg: 'rgba(179,168,156,0.10)',
    desc: 'Named war, era, disaster, or lore entry for the timeline',
    fields: ['Event name', 'Era (E.D. or E.U.)', 'Factions involved', 'Campaign relevance'],
  },
  {
    id: 'deity',
    label: 'Deity / Spirit',
    icon: '★',
    color: '#fbbf24',
    colorBg: 'rgba(251,191,36,0.10)',
    desc: 'God, primordial, elemental spirit, or celestial entity',
    fields: ['Deity name', 'Domain', 'Alignment', 'Affiliation'],
  },
  {
    id: 'condition',
    label: 'Condition / Status',
    icon: '⊗',
    color: '#e05a5a',
    colorBg: 'rgba(224,90,90,0.10)',
    desc: 'Named game state, curse, buff, or environmental effect',
    fields: ['Condition name', 'Type (buff/debuff/curse)', 'Duration', 'Mechanical effect'],
  },
];

// ─── CONTEXT BUILDER ─────────────────────────────────────────────────────────

function buildContext(categoryId) {
  const worldBase = `You are The Scribe — an ancient archival intelligence bound to Soteria, 178 Era of Unity.
You assist the Dungeon Master (the Architect) in generating new lore, characters, creatures, items, and mechanics.
Everything you create must be consistent with the world of Soteria. Be specific, creative, and use existing lore as anchor points.
Do not invent contradictions with established canon. Use Soterian names, factions, and geography where appropriate.

${SOTERIA_LORE}

${SOTERIA_MECHANICS}`;

  // Inject bestiary context only for beast generation
  if (categoryId === 'beast') {
    return worldBase + '\n\n' + SOTERIA_BESTIARY;
  }

  return worldBase;
}

// ─── OUTPUT SCHEMA PROMPTS ───────────────────────────────────────────────────

function buildPrompt(categoryId, userPrompt, fields, campaignId) {
  const campaignCtx = campaignId && campaignId !== 'any'
    ? `This content is for Campaign ${campaignId}.`
    : 'This content is for general Soterian use.';

  const fieldContext = Object.entries(fields)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const schemas = {
    npc: `Generate a fully detailed NPC for Soteria. Return your response in this EXACT structure:

NAME: [full name]
TITLE: [role or epithet]
RACE: [race and variant]
CLASS: [class tier 1-3]
AFFILIATION: [faction or allegiance]
CAMPAIGN: [campaign relevance]

APPEARANCE:
[2-3 sentences describing physical appearance and notable features]

PERSONALITY:
[2-3 sentences describing personality, mannerisms, and what drives them]

SECRET:
[One thing they haven't told anyone — a hidden motive, past, or knowledge]

HOOK:
[How the players might encounter or need this NPC]

STATS (Soterian 8-stat system, values 8-16):
Spirit: [val] | Soul: [val] | Body: [val] | Essence: [val]
Will: [val] | Whim: [val] | Mind: [val] | Dream: [val]

PASSIVE TRAIT: [Name] — [mechanic text in Syntarion style]
ACTIVE TRAIT: [Name] — Once per rest, [mechanic text]

DM NOTES:
[1-2 sentences of DM guidance on how to play this NPC]

CODE BLOCK:
\`\`\`js
// Add to npcs.js
{
  id: '[snake_case_id]',
  name: '[Name]',
  title: '[Title]',
  race: '[race]',
  class: '[class]',
  affiliation: '[faction]',
  campaign: '[campaign_id]',
  secret: '[secret]',
  hook: '[hook]',
  stats: { spirit:[n], soul:[n], body:[n], essence:[n], will:[n], whim:[n], mind:[n], dream:[n] },
  passive: { name: '[name]', text: '[text]' },
  active: { name: '[name]', text: '[text]' },
}
\`\`\``,

    faction: `Generate a fully detailed faction for Soteria. Return your response in this EXACT structure:

NAME: [faction name]
TYPE: [guild/order/cult/syndicate/army/etc]
BASED IN: [city or region]
FOUNDED: [era and approximate year]
ALIGNMENT: [magic-leaning/tech-leaning/neutral]

PURPOSE:
[2-3 sentences on what this faction wants and why it exists]

STRUCTURE:
[Who leads it, how it's organized, how members join or advance]

METHODS:
[How they operate — covert, political, military, economic, spiritual]

SECRET AGENDA:
[What they want that they don't admit publicly]

NOTABLE MEMBERS:
[2-3 named individuals with one-line descriptions]

CAMPAIGN HOOKS:
[2 specific ways this faction could enter the players' story]

CODE BLOCK:
\`\`\`js
// Add to soteria-lore.js FACTIONS section
{
  id: '[snake_case_id]',
  name: '[Name]',
  type: '[type]',
  base: '[location]',
  alignment: '[magic/tech/neutral]',
  purpose: '[purpose]',
  secret: '[secret agenda]',
  hooks: ['[hook1]', '[hook2]'],
}
\`\`\``,

    location: `Generate a fully detailed location for Soteria. Return your response in this EXACT structure:

NAME: [location name]
TYPE: [city/ruin/dungeon/plane/outpost/etc]
REGION: [where in Soteria or beyond]
SIZE: [hamlet/town/city/vast/infinite/etc]
ATMOSPHERE: [mood, weather, resonance feel]

DESCRIPTION:
[3-4 sentences evoking the place — what it looks, sounds, smells like]

HISTORY:
[How it came to be, what happened here, why it matters]

NOTABLE LOCATIONS WITHIN:
[3-5 named sub-locations with one-line descriptions each]

KEY NPCS:
[2-3 named figures associated with this place]

DANGERS:
[What threats exist here — creatures, factions, resonance hazards]

CAMPAIGN HOOKS:
[2 specific reasons the party might come here]

CODE BLOCK:
\`\`\`js
// Add to soteria-lore.js GEOGRAPHY section
{
  id: '[snake_case_id]',
  name: '[Name]',
  type: '[type]',
  region: '[region]',
  atmosphere: '[atmosphere]',
  hooks: ['[hook1]', '[hook2]'],
}
\`\`\``,

    item: `Generate a fully detailed item for Soteria. Return your response in this EXACT structure:

NAME: [item name]
TYPE: [weapon/armor/artifact/relic/wondrous/tool/etc]
RARITY: [common/uncommon/rare/very rare/legendary/unique]
AXIS: [magic/tech/both]
DISCIPLINE: [Sanctus/Mana/Grit/Ingenuity/etc if applicable]

APPEARANCE:
[2 sentences on what it looks like, feels like, sounds like]

LORE:
[2-3 sentences of in-world history — who made it, what it's done]

PASSIVE EFFECT:
[Name] — [mechanical text in Syntarion style, referencing the 8-stat system]

ACTIVE EFFECT:
[Name] — Once per rest, [mechanical text]. [Flavour sentence.]

ATTUNEMENT: [Yes/No — and what attunement requires]

VALUE: [approximate gold/silver equivalent and who might want it]

CODE BLOCK:
\`\`\`js
// Add to appropriate items file (magicitems.js / artifacts.js / weapons.js / etc)
{
  id: '[snake_case_id]',
  name: '[Name]',
  type: '[type]',
  rarity: '[rarity]',
  axis: '[magic/tech/both]',
  attunement: [true/false],
  passive: { name: '[name]', text: '[text]' },
  active: { name: '[name]', text: '[text]' },
  lore: '[lore text]',
  value: '[value]',
}
\`\`\``,

    spell: `Generate a fully detailed spell or ability for Soteria. Return your response in this EXACT structure:

NAME: [spell name]
TIER: [Mote/Charm/Spell/Weave]
DISCIPLINE: [Sanctus/Chiasma/Mana/Essence/Gnosis/Shaeid/Wraill]
REAGENT: [what it costs — Sanctus Orb/Mana Wisp/etc]
COST: [1/2/3]
STAT: [primary stat key]
CLASS: [which class(es) can access this]

DESCRIPTION:
[2 sentences of in-world description — what it looks like when cast]

MECHANICAL EFFECT:
[Precise mechanical text in Syntarion style — what it does, conditions, duration]

NARRATIVE FLAVOUR:
[One sentence of flavour text in the Syntarion writing style]

UPGRADE (optional):
[What happens if the caster spends double the cost]

CODE BLOCK:
\`\`\`js
// Add to CastorDMPanel.jsx MAGIC_DISCIPLINES spells array for the relevant discipline
{ id: '[disc_n]', name: '[Name]', desc: '[mechanical effect]', cost: [n] }
\`\`\``,

    tech: `Generate a fully detailed tech schematic for Soteria. Return your response in this EXACT structure:

NAME: [tech name]
CATEGORY: [Tinkertrick/Diagram/Schematic/Blueprint]
DISCIPLINE: [Gain/Grit/Focus/Matter/Ingenuity/Fortitude/Reason]
TIER: [Tier 1 (basic)/Tier 2 (advanced)/Tier 3 (apex)]
COMPLEXITY: [simple/moderate/complex/masterwork]
MATERIALS: [what's needed to build it]

DESCRIPTION:
[2 sentences — what it looks like, how it works mechanically in the world]

EFFECT:
[Precise mechanical text in Syntarion style]

CONSTRUCTION NOTES:
[What skills, tools, or conditions are needed to craft this]

FAILURE CONDITION:
[What happens if the roll fails or the device is misused]

CODE BLOCK:
\`\`\`js
// Add to techinventions.js
{
  id: '[snake_case_id]',
  name: '[Name]',
  category: '[Tinkertrick/Diagram/Schematic/Blueprint]',
  discipline: '[discipline]',
  tier: [1/2/3],
  materials: '[materials]',
  effect: '[mechanical effect]',
  failCondition: '[failure]',
}
\`\`\``,

    beast: `Generate a fully detailed creature for the Soteria Bestiary. Return your response in this EXACT structure:

NAME: [creature name]
BIOME: [primary biome(s)]
DISPOSITION: [Docile/Aggressive/Predatory/Smaller Game]
THREAT: [LOW/MEDIUM/HIGH/CAMPAIGN-LEVEL]
RESONANCE: [Natural/Spirit-Bound/Void-Tainted/Draethic/Grimrite-Saturated/etc]

DESCRIPTION:
[3-4 sentences evoking the creature — appearance, movement, presence, what it feels like to encounter one]

BEHAVIOUR:
[How it hunts, nests, communicates, or interacts with its environment]

CAMPAIGN NOTES:
[DM guidance — when to use it, what its presence signals, what it knows]

ENCOUNTER TEXTURE:
[One question the DM should ask before running this creature: who benefits, what does it want, is it here by choice?]

PREDATOR CASCADE:
[What ecological shift signals this creature's presence or absence]

CODE BLOCK:
\`\`\`
// Add to soteria-bestiary.js under the appropriate biome section
- [CREATURE NAME] — [one-line description in bestiary style]
\`\`\``,

    action: `Generate a fully detailed class ability or racial trait for Soteria. Return your response in this EXACT structure:

NAME: [ability name]
TYPE: [Passive/Active/Ultimate]
CLASS OR RACE: [which class or race this belongs to]
TIER: [Tier 1/Tier 2/Tier 3]
AP COST: [0 for free / 2 for Tier 2 / 3 for Tier 3]
STAT: [primary stat key]
DISCIPLINE: [if applicable]

MECHANICAL TEXT:
[Precise ability text in Syntarion style — matching the voice of existing racial traits and class abilities]

NARRATIVE FLAVOUR:
[One sentence. Final sentence of the mechanical text, Syntarion style — terse, specific, character-true.]

DESIGN NOTE:
[One sentence explaining the design intention — what playstyle or fantasy this serves]

CODE BLOCK:
\`\`\`js
// For racial trait — add to RACIAL_TRAITS in constants.js
{ name: '[Name]', text: '[mechanical text]' }

// For class ability — add to SOTERIA_MECHANICS in soteria-mechanics.js
[AbilityName] — [mechanical text]
\`\`\``,

    race: `Generate a fully detailed race or bloodline for Soteria. Return your response in this EXACT structure:

NAME: [race name]
SUB: [archetype — Humanoid/Beast-folk/Construct/etc]
TAG: [magic/tech/any]
LEAN: [-2 to +2 alignment lean]
CULTURAL ORIGIN: [which nation, empire, or region]

SHORT DESCRIPTION:
[One sentence — the race card description in Syntarion voice]

EXTENDED LORE:
[3-4 sentences — who they are, how they think, their relationship to Soteria's current era]

PASSIVE TRAIT:
[Name] — [mechanical text in Syntarion style]

ACTIVE TRAIT:
[Name] — Once per rest, [mechanical text]. [Flavour sentence.]

NAMING NOTES:
[Brief note on naming conventions — what their names sound like, any cultural patterns]

CODE BLOCK:
\`\`\`js
// Add to RACES array in constants.js
{ id:'[id]', name:'[Name]', sub:'[Sub]', tag:'[magic/tech/any]', lean:[n], sub2:'[variants]', variants:[], ns:'[id]', desc:"[short description]" }

// Add to RACIAL_TRAITS in constants.js
[raceId]: {
  passive: { name: '[Name]', text: '[text]' },
  active: { name: '[Name]', text: '[text]' },
},
\`\`\``,

    event: `Generate a fully detailed historical event for Soteria's timeline. Return your response in this EXACT structure:

NAME: [event name]
ERA: [E.D. year or E.U. year]
DURATION: [how long it lasted]
SCALE: [local/regional/continental/world-altering]
FACTIONS INVOLVED: [who was part of this]

SUMMARY:
[3-4 sentences — what happened, why, and what changed because of it]

CAUSE:
[What triggered this event — political, magical, spiritual, industrial]

CONSEQUENCES:
[3 lasting effects still felt in 178 E.U.]

FORGOTTEN TRUTH:
[What most historians got wrong, or what was suppressed]

CAMPAIGN HOOKS:
[2 ways this historical event could resurface in current play]

CODE BLOCK:
\`\`\`js
// Add to soteria-lore.js HISTORY section
{
  id: '[snake_case_id]',
  name: '[Name]',
  era: '[E.D./E.U. year]',
  scale: '[scale]',
  summary: '[summary]',
  forgottenTruth: '[truth]',
  hooks: ['[hook1]', '[hook2]'],
}
\`\`\``,

    deity: `Generate a fully detailed deity or spirit for Soteria. Return your response in this EXACT structure:

NAME: [deity name]
DOMAIN: [primary domain]
ALIGNMENT: [Good/Evil/Neutral + Lawful/Chaotic]
AFFILIATION: [pantheon, faction, or plane]
WORSHIPPERS: [who reveres this entity and why]

DIVINE DESCRIPTION:
[2-3 sentences — how they appear to mortals, their voice, their presence]

DOCTRINE:
[What they demand of followers, what they reward, what they punish]

RELATIONSHIP TO OTHER GODS:
[Allies, rivals, or enmities in the pantheon]

MORTAL HOOK:
[How a player character might come to serve or oppose this deity]

CLERGY NOTES:
[What clerics or zealots of this deity look like and how they operate]

CODE BLOCK:
\`\`\`js
// Add to GODS or SPIRITS array in constants.js
{ name:'[Name]', domain:'[Domain]', affil:'[Affiliation]', desc:"[description]", moralityNudge:[n] }
\`\`\``,

    condition: `Generate a fully detailed condition or status effect for Soteria. Return your response in this EXACT structure:

NAME: [condition name]
TYPE: [buff/debuff/curse/environmental/spiritual]
DURATION: [how long it lasts — turns/scenes/days/permanent]
REMOVAL: [how it can be ended or cured]
SOURCE: [what causes this condition — spell/creature/environment/curse]

IN-WORLD DESCRIPTION:
[2 sentences — what the affected creature experiences]

MECHANICAL EFFECT:
[Precise mechanical text — what changes about the creature's stats, actions, or rolls]

VISUAL TELL:
[One sentence — what observers can see that signals someone is afflicted]

STACK RULE:
[Does it stack with duplicates? What happens with multiple applications?]

CODE BLOCK:
\`\`\`js
// Add to conditions system
{
  id: '[snake_case_id]',
  name: '[Name]',
  type: '[type]',
  duration: '[duration]',
  removal: '[removal]',
  effect: '[mechanical effect]',
  visualTell: '[tell]',
}
\`\`\``,
  };

  return `${campaignCtx}

${fieldContext ? `SPECIFIED DETAILS:\n${fieldContext}\n` : ''}

ARCHITECT'S REQUEST: ${userPrompt}

${schemas[categoryId] || schemas.npc}`;
}

// ─── COPY BUTTON ─────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      background: copied ? COLORS.magicBg : 'transparent',
      border: `1px solid ${copied ? COLORS.magic : COLORS.border}`,
      borderRadius: 4,
      padding: '3px 10px',
      cursor: 'pointer',
      fontFamily: "'Cinzel', serif",
      fontSize: 8,
      letterSpacing: '0.12em',
      color: copied ? COLORS.magicText : COLORS.dim,
      transition: 'all 0.15s',
    }}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

// ─── OUTPUT RENDERER ─────────────────────────────────────────────────────────

function ForgeOutput({ output, category }) {
  if (!output) return null;

  // Split on code blocks
  const parts = output.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '');
          return (
            <div key={i} style={{
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${category.color}33`,
              borderRadius: 8,
              marginTop: 12,
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '7px 12px',
                borderBottom: `1px solid ${category.color}22`,
                background: `${category.color}08`,
              }}>
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 8,
                  letterSpacing: '0.14em',
                  color: category.color,
                  textTransform: 'uppercase',
                }}>Code Block — Paste into your codebase</span>
                <CopyButton text={code} />
              </div>
              <pre style={{
                margin: 0,
                padding: '12px 14px',
                fontFamily: 'monospace',
                fontSize: 11,
                color: COLORS.textSub,
                overflowX: 'auto',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>{code}</pre>
            </div>
          );
        }

        // Parse the lore text into sections
        const lines = part.trim().split('\n');
        const rendered = [];
        let buffer = [];

        const flushBuffer = () => {
          if (buffer.length > 0) {
            rendered.push(
              <p key={`buf-${rendered.length}`} style={{
                fontSize: 12,
                color: COLORS.textSub,
                fontFamily: 'Georgia, serif',
                lineHeight: 1.75,
                margin: '0 0 8px',
              }}>{buffer.join(' ')}</p>
            );
            buffer = [];
          }
        };

        lines.forEach((line, li) => {
          const colonIdx = line.indexOf(':');
          const isHeader = colonIdx > 0 && colonIdx < 30 && line === line.trim() &&
            /^[A-Z\s\/\(\)]+:/.test(line.trim());

          if (isHeader) {
            flushBuffer();
            const key = line.substring(0, colonIdx).trim();
            const val = line.substring(colonIdx + 1).trim();
            rendered.push(
              <div key={`h-${li}`} style={{ marginBottom: 10 }}>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 8,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: category.color,
                  marginBottom: 3,
                }}>{key}</div>
                {val && <div style={{
                  fontSize: 12,
                  color: COLORS.text,
                  fontFamily: 'Georgia, serif',
                  lineHeight: 1.6,
                }}>{val}</div>}
              </div>
            );
          } else if (line.trim() === '') {
            flushBuffer();
          } else {
            buffer.push(line.trim());
          }
        });
        flushBuffer();

        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function LoreForge({ activeCampaignId }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [fields, setFields] = useState({});
  const [campaignFilter, setCampaignFilter] = useState(activeCampaignId || 'any');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const outputRef = useRef(null);

  const label8 = {
    fontSize: 8,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontFamily: "'Cinzel', serif",
    display: 'block',
    marginBottom: 6,
  };

  const selectCategory = (cat) => {
    setSelectedCategory(cat);
    setOutput('');
    setError('');
    setFields({});
    setPrompt('');
  };

  const handleGenerate = async () => {
    if (!selectedCategory || !prompt.trim()) return;
    setLoading(true);
    setOutput('');
    setError('');

    try {
      const systemPrompt = buildContext(selectedCategory.id);
      const userPrompt = buildPrompt(selectedCategory.id, prompt, fields, campaignFilter);

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.85,
          max_tokens: 2000,
        }),
      });

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response from Groq');

      setOutput(text);
      setHistory(prev => [{
        id: Date.now(),
        category: selectedCategory,
        prompt,
        output: text,
        campaign: campaignFilter,
        timestamp: new Date(),
      }, ...prev].slice(0, 10));

      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      setError(e.message || 'The Forge is silent. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 18,
          fontWeight: 700,
          color: COLORS.text,
          letterSpacing: '0.08em',
          marginBottom: 6,
        }}>Lore Forge</div>
        <div style={{
          fontSize: 11,
          color: COLORS.dim,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: 1.6,
        }}>
          Generate lore-accurate content for Soteria. The Scribe reads the full archives before writing.
        </div>
      </div>

      {/* ── Campaign context ── */}
      <div style={{ marginBottom: 20 }}>
        <span style={label8}>Campaign context</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div
            onClick={() => setCampaignFilter('any')}
            style={{
              background: campaignFilter === 'any' ? 'rgba(240,238,235,0.08)' : 'transparent',
              border: `1px solid ${campaignFilter === 'any' ? COLORS.borderMid : COLORS.border}`,
              borderRadius: 5,
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: 8,
              letterSpacing: '0.1em',
              color: campaignFilter === 'any' ? COLORS.text : COLORS.dim,
            }}
          >General</div>
          {CAMPAIGNS.map(c => (
            <div
              key={c.id}
              onClick={() => setCampaignFilter(c.id)}
              style={{
                background: campaignFilter === c.id ? 'rgba(240,238,235,0.08)' : 'transparent',
                border: `1px solid ${campaignFilter === c.id ? COLORS.borderMid : COLORS.border}`,
                borderRadius: 5,
                padding: '5px 12px',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 8,
                letterSpacing: '0.1em',
                color: campaignFilter === c.id ? COLORS.text : COLORS.dim,
              }}
            >{c.subtitle}</div>
          ))}
        </div>
      </div>

      {/* ── Category grid ── */}
      <div style={{ marginBottom: 20 }}>
        <span style={label8}>What are you forging?</span>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 6,
        }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => selectCategory(cat)}
                style={{
                  background: isSelected ? cat.colorBg : COLORS.card,
                  border: `1px solid ${isSelected ? cat.color + '66' : COLORS.border}`,
                  borderRadius: 7,
                  padding: '10px 11px',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{
                  fontSize: 14,
                  marginBottom: 4,
                  color: isSelected ? cat.color : COLORS.dim,
                }}>{cat.icon}</div>
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                  fontWeight: 700,
                  color: isSelected ? cat.color : COLORS.text,
                  letterSpacing: '0.06em',
                  marginBottom: 3,
                }}>{cat.label}</div>
                <div style={{
                  fontSize: 8,
                  color: COLORS.dim,
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  lineHeight: 1.4,
                }}>{cat.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Fields + prompt ── */}
      {selectedCategory && (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${selectedCategory.color}33`,
          borderRadius: 10,
          padding: '18px 20px',
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 16, color: selectedCategory.color }}>{selectedCategory.icon}</span>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 11,
              fontWeight: 700,
              color: selectedCategory.color,
              letterSpacing: '0.06em',
            }}>Forge a {selectedCategory.label}</div>
          </div>

          {/* Optional quick fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 14,
          }}>
            {selectedCategory.fields.map(field => (
              <div key={field}>
                <span style={label8}>{field} (optional)</span>
                <input
                  value={fields[field] || ''}
                  onChange={e => setFields(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={`e.g. ${field}…`}
                  style={{
                    width: '100%',
                    background: 'rgba(240,238,235,0.04)',
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 5,
                    padding: '7px 9px',
                    color: COLORS.text,
                    fontSize: 11,
                    fontFamily: 'Georgia, serif',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Main prompt */}
          <div style={{ marginBottom: 14 }}>
            <span style={label8}>Describe what you want *</span>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
              placeholder={`Describe the ${selectedCategory.label.toLowerCase()} you want to create. Be as specific or as vague as you like — the Scribe will fill in the gaps using Soterian lore…`}
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(240,238,235,0.04)',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: '10px 12px',
                color: COLORS.text,
                fontSize: 12,
                fontFamily: 'Georgia, serif',
                lineHeight: 1.6,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{
              fontSize: 8,
              color: COLORS.dim,
              fontFamily: 'Georgia, serif',
              marginTop: 4,
            }}>⌘ + Enter to generate</div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            style={{
              width: '100%',
              background: loading || !prompt.trim() ? 'transparent' : selectedCategory.colorBg,
              border: `1px solid ${loading || !prompt.trim() ? COLORS.border : selectedCategory.color + '66'}`,
              borderRadius: 7,
              padding: '11px',
              cursor: loading || !prompt.trim() ? 'default' : 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: loading || !prompt.trim() ? COLORS.dim : selectedCategory.color,
              fontWeight: 700,
              transition: 'all 0.15s',
            }}
          >
            {loading ? '✦ The Scribe is writing…' : `✦ Forge ${selectedCategory.label}`}
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: COLORS.warnBg,
          border: `1px solid ${COLORS.warn}`,
          borderRadius: 8,
          padding: '12px 14px',
          fontSize: 11,
          color: COLORS.warn,
          fontFamily: 'Georgia, serif',
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ── Output ── */}
      {output && selectedCategory && (
        <div
          ref={outputRef}
          style={{
            background: COLORS.card,
            border: `1px solid ${selectedCategory.color}33`,
            borderRadius: 10,
            padding: '20px 22px',
            marginBottom: 24,
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: `1px solid ${selectedCategory.color}22`,
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              color: selectedCategory.color,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>✦ Forged {selectedCategory.label}</div>
            <CopyButton text={output} />
          </div>

          <ForgeOutput output={output} category={selectedCategory} />
        </div>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <span style={label8}>Recent forgings (this session)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {history.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedCategory(item.category);
                  setOutput(item.output);
                  setPrompt(item.prompt);
                  setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }}
                style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 7,
                  padding: '10px 13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                <span style={{ fontSize: 13, color: item.category.color }}>{item.category.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    color: item.category.color,
                    letterSpacing: '0.08em',
                    marginBottom: 2,
                  }}>{item.category.label}</div>
                  <div style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{item.prompt}</div>
                </div>
                <div style={{
                  fontSize: 8,
                  color: COLORS.dim,
                  fontFamily: 'Georgia, serif',
                  flexShrink: 0,
                }}>
                  {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
