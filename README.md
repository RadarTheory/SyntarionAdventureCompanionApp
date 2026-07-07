# Syntarion Adventure Companion App

**A full-stack tabletop RPG platform for running campaigns in the world of Soteria.**

Syntarion is a live companion app for tabletop sessions — part virtual tabletop, part character manager, part AI-assisted lorekeeper. It was built to run campaigns set in **Soteria**, an original fantasy world by Adrian ("Radar Theory") that also spans the novels *The Lockcaste* and *Veinrunner*.

> **Note on licensing:** The source code in this repository is available to read and learn from, but this is **not** an open-source project. The world of Soteria — its lore, names, races, bestiary, maps, and mechanics — is proprietary creative work. See [EULA.md](./EULA.md) and [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md).

---

## Features

**For Players**
- **Character Wizard** — guided character creation across race, class, stats, belief, and backstory, built on Soteria's 16-class ability tree (Magicka / Ingenium disciplines) and 8-stat system
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

- **Frontend:** React 19 + Vite
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

## Project Status

Syntarion is in active solo development and currently runs live campaigns for a private group. The long-term vision is a modular platform where Soteria ships as the flagship module and other DMs can publish their own worlds.

## License

Copyright © 2026 Adrian Gilmore, doing business as Theonhex Media & Publishing. All rights reserved.

Source code is provided for reference and evaluation under the terms in [EULA.md](./EULA.md). The Soteria setting and all associated creative content are proprietary and may not be reused. Use of the hosted application is governed by [TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md).