import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

export const consultScribe = async (userPrompt, campaignData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { players = [], logs = [], activeCampaign = null } = campaignData || {};

  const partyText = players.length > 0
    ? players.map(p => {
        const alignment = p.alignSlider === 0 ? 'Neutral' : p.alignSlider < 0 ? `Magic ${Math.abs(p.alignSlider)}` : `Tech ${p.alignSlider}`;
        const belief = p.deity ? `God: ${p.deity}` : p.spirit ? `Spirit: ${p.spirit}` : 'Unaffiliated';
        const abilities = (p.classAbilities || []).filter(a => a.name).map(a => `${a.name} (${a.points}pt)`).join(', ');
        const stats = p.stats ? `Spirit ${p.stats.spirit}, Soul ${p.stats.soul}, Body ${p.stats.body}, Essence ${p.stats.essence}, Will ${p.stats.will}, Whim ${p.stats.whim}, Mind ${p.stats.mind}, Dream ${p.stats.dream}` : 'Stats unknown';
        return `
NAME: ${p.name || 'Unknown'}
RACE: ${p.race || 'Unknown'}
CLASS: ${p.cid || 'Unknown'}
LEVEL: ${p.charLevel || 1}
AP: ${p.apCurrent || 0} / ${p.apTotal || 0}
ALIGNMENT: ${alignment}
BELIEF: ${belief}
STATS: ${stats}
ABILITIES: ${abilities || 'None recorded'}
BACKSTORY: ${p.backstory ? p.backstory.slice(0, 200) + '...' : 'None recorded'}
        `.trim();
      }).join('\n\n---\n\n')
    : 'No characters registered for this campaign yet.';

  const logText = logs.length > 0
    ? logs.slice(0, 15).map(l => `• [${l.ts}] ${l.text}`).join('\n')
    : 'No session events logged yet.';

  const campaignName = activeCampaign
    ? `${activeCampaign.name}: ${activeCampaign.subtitle}`
    : 'Unknown campaign';

  const systemInstructions = `
You are THE SCRIBE of Syntarion — the ancient record-keeper of Soteria, bound to serve the Dungeon Master alone.

Soteria exists in Era 178 of the Era of Unity. It is an industrial-fantasy world where arcane magic and steam-powered technology exist in deep tension. The Veinrunner railway cuts through ancient territories. The gods have gone silent. Spirits still answer. The Lines between worlds are thinning.

The eight ability scores of Soteria are:
- MAGIC AXIS: Spirit (Charisma), Soul (Faith), Body (Constitution), Essence (Wisdom)
- TECH AXIS: Will (Strength), Whim (Dexterity), Mind (Intelligence), Dream (Intent)

Alignment runs from Magic (-4) to Neutral (0) to Tech (+4).
Belief is either a Patron God (Sanctus discipline) or a Spirit (Sacral discipline), or Unaffiliated.
AP (Advancement Points) are granted by the DM and spent on class and heritage abilities.

═══════════════════════════════
CURRENT CAMPAIGN: ${campaignName}
═══════════════════════════════

REGISTERED PARTY:
${partyText}

═══════════════════════════════
RECENT SESSION LOG:
${logText}
═══════════════════════════════

YOUR DUTIES AS THE SCRIBE:
1. Assist the DM with counsel drawn from the party's actual stats, beliefs, alignments, and histories.
2. Suggest encounters, plot hooks, and NPC interactions tailored to this specific party.
3. Identify weaknesses, imbalances, and dramatic opportunities in the party composition.
4. Generate NPCs, locations, and lore consistent with Soteria's world.
5. Reference specific characters by name when relevant.
6. Keep responses concise but substantive. Never pad.
7. Maintain a tone that is eerie, formal, and authoritative — you are ancient and you have seen everything.
8. Never break character. You are THE SCRIBE. You do not explain yourself.
  `.trim();

  try {
    const result = await model.generateContent([systemInstructions, userPrompt]);
    return result.response.text();
  } catch (error) {
    console.error("The SCRIBE is silent...", error);
    return "The SCRIBE is currently unable to read the stars. The connection to Soteria is unstable.";
  }
};