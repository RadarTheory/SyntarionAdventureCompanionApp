# Syntarion Adventure Companion App

**A full-stack tabletop RPG platform for running campaigns in the world of Soteria.**

Syntarion is a live companion app for tabletop sessions — part virtual tabletop, part character manager, part AI-assisted lorekeeper. It was built to run campaigns set in **Soteria**, an original fantasy world by Adrian ("Radar Theory") that also spans the novels *The Lockcaste* and *Veinrunner*.

> **Note on licensing:** The source code in this repository is available to read and learn from, but this is **not** an open-source project. The world of Soteria — its lore, names, races, bestiary, maps, and mechanics — is proprietary creative work. See [EULA.md](./EULA.md) and [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md).

---

## Features

**For Players**
- **Character Wizard** — guided character creation across race, class, stats, belief, and backstory, built on Soteria's Constellation (16 callings across Magicka, Ingenium and Nihimence) and 8-stat system
- **Character Sheet & Ability Trees** — live character management with class progression
- **Grimoire** — a per-character journal that automatically records NPCs, beasts, and lore your character encounters
- **Lark** — an in-world letter system for player-to-player and player-to-NPC correspondence
- **Intent Declare** — declare actions in or out of combat, with voice dictation support
- **VTT Viewer** — see the map as your character sees it, with fog of war, token movement requests, and DM-approved moves

**For DMs (The Architect's Toolkit)**
- **VTT Canvas** — fog-of-war painting with undo, grid overlay, token management with race/class silhouettes, portrait hover cards, and per-map state persistence
- **Hercules** — combat engine with bestiary integration and full event logging
- **The Scribe** — AI-assisted lore consultation and session synopsis compilation, powered by a Supabase Edge Function
- **NPC Panel, Bazaar, Solomon** — NPC management with portraits, proximity-based merchant access, and loot governance
- **Soteria Clock** — in-world timekeeping that ticks in fragments, synced to all players
- **Session Manager** — session check-ins, chronicles, and compiled synopses from raw event logs
- **Lore Announce** — broadcast lore drops to DM memory, Grimoires, the Hercules log, and player inboxes simultaneously

**Extras**
- **Driftstone** — a built-in two-player strategy board game
- **Fubin** — minigame companion
- **World Map & Module system** — three-level Module → Campaign → Session hierarchy

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions)
- **AI:** Google Gemini (Scribe lore engine), Groq Whisper (voice transcription) — both server-side via Edge Functions
- **Hosting:** Vercel

## Local Development

```bash
npm install
npm run dev
```

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_DM_USER_ID=uuid-of-the-dm-account
```

AI keys (Gemini, Groq) live in Supabase Edge Function secrets, not the client bundle:

```bash
supabase secrets set GEMINI_API_KEY=...
supabase secrets set GROQ_API_KEY=...
supabase functions deploy scribe
supabase functions deploy transcribe --no-verify-jwt
```

A Supabase project with the Syntarion schema (characters, campaigns, modules, `hercules_events`, `grimoire_entries`, `larks`, `vtt_sessions`, and related tables) is required. The schema is not currently published as a migration set.

## The Constellation (abilities)

The character sheet's Abilities tab is the Syntarion Constellation. Its source lives in this repo at `constellation/` (the only copy; edit it there). `vite.config.js` copies the runtime files into `public/constellation/` (git-ignored) on every dev start, every build, and whenever a constellation file changes, and `src/ConstellationTab.jsx` shows it in an iframe. `npm run sync:constellation` does the copy by hand; `npm run check:constellation` runs its syntax checks and tests; `npm run constellation` serves it alone on http://127.0.0.1:4177 for quick layout work (builds there are local-only, not tied to a character).

- **AP** is spent on abilities. It is stored in `at_current` / `at_total` and granted as the character levels. **XP** is experience: it is stored in `ap_total` and sets the level. Only the labels say AP and XP; the columns keep their names.
- Purchases are instant. The build is stored as constellation unlock ids in the character's `data.abilities`, on that character's `characters` row, so it belongs to whoever owns the character and is read and written under the same access rules as the rest of the sheet.
- A character still holding abilities from the earlier tree has them cleared once, with their AP refunded, the first time the tab opens.
- The casting panel (`src/AbilitiesPanel.jsx`) and Castor list the abilities a character has learned. Each draws on its line's trait (one of the sheet's 16 Magic | Tech rows). A trait's pool holds one point per star (class level) awakened in classes drawing on it; only what is spent is stored, in `data.traitSpent`. A use costs half the ability's level held, rounded up (`costOfUse`): 1 at the first two steps, 2 at the next two, 3 at the top. Castor pays when the cast is sent and gives it back if the Architect denies it. The DM's Long Rest on the Soteria Clock refills every pool in the campaign.
- A character's class label (sheet, campaign sheet, roster, players panel) comes from their build through `classLabelOf` / `src/useConstellation.js`: the highest-tier class awakened on their starting line, plus any other callings they have opened. The sheet's Trait Pools box shows each pool as left / size. The Handbook's class reference is read live from the constellation.
- The DM opens any character's constellation from their editor in the DM view (Constellation · Open). A switch there decides whether changes spend the character's AP or are free; opening it never makes the automatic first-star purchase. Changes save immediately.
- The campaign Sheet tab (`src/CharacterSheetPage.jsx`) is the character's whole page: hero with constellation-style race and class symbols, their own sky (every calling at its atlas position, awakened ones lit and threaded to The Self), a moral compass (Good | Evil × Magic | Tech: `sliders.morality` plus the DM's morality shift, and `sliders.magicTech`), renown (`data.renown`, `data.renownTitles`, set in the DM editor), attributes, scales and trait pools. The Scales tab is merged into it.
- Reactions (`src/reactions.js`, after Arcanum): every NPC holds a 0–100 reaction toward each character, from Spirit, race, Magic | Tech lean (`npcs.alignment`), morality (`npcs.morality`), standing with the NPC's faction, city and region (`data.standing`), reputations (`data.reputations`; a starter set in code plus the DM's in the `reputations` table) and per-NPC regard (`data.regard`). Players see the tier word in the sheet's Regard list (NPCs from their Grimoire); the DM sees numbers and reasons in the census and edits standings and reputations in the character editor. Run `supabase/migrations/20261116_reactions.sql` first.
- In the Abilities tab the constellation's drawer opens on the character's abilities (`constellation/held-abilities.js`); an ability held at several levels asks which level to use. Syntarion pays the trait pool (`costOfUse(level)`) and logs the roll (`ConstellationTab`'s `onUse`). Castor and the Use list read the same learned abilities.
- Creation class ids match the constellation's callings. Magister was renamed Oneir (2026-11-16); `supabase/migrations/20261116_magister_to_oneir.sql` moves saved characters and NPCs.
- Rolls use the class's aspect stat: Soul, Spirit, Mind, Body, Will, Whim and Dream roll that stat, Affect rolls Essence, and Hope (Warden's and Null's lines) rolls Dream.
- The character wizard's class step (`src/StepClass.jsx`) shows the constellation in pick mode: the player chooses a calling on the sky, and it opens as their first star when the Abilities tab first loads.
- The Scribe's class reference, `src/soteria-classes.js`, is generated from the constellation by `scripts/scribe-class-reference.mjs` (run by the Vite config with the sync, or `npm run scribe:classes`); don't edit it by hand.

## Project Status

Syntarion is in active solo development and currently runs live campaigns for a private group. The long-term vision is a modular platform where Soteria ships as the flagship module and other DMs can publish their own worlds.

## License

Copyright © 2026 Adrian Gilmore, doing business as Theonhex Media & Publishing. All rights reserved.

Source code is provided for reference and evaluation under the terms in [EULA.md](./EULA.md). The Soteria setting and all associated creative content are proprietary and may not be reused. Use of the hosted application is governed by [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md).