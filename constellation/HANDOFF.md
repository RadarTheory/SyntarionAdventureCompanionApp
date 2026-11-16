# Syntarion · The Constellation: handoff

This brief is for an assistant (e.g. ChatGPT) helping to sort and refine the abilities in this project. It covers what the app is, how its rules work, where the data lives, and what format to return changes in so they can be dropped back in. Pair it with `ABILITY-LIST.md` (readable) and `ability-list.csv` (one row per ability per class), both generated from the app's data on 2026-11-04.

**Terms (user, 2026-11-05):** a line runs from its **class** (the base star) through its **subclasses** to its **master class** (the conjoined star at the end). A class's purchases are its **abilities**; do not call them a "kit".

## What this is

**Syntarion · The Constellation** is the ability-tree explorer for the *Saga of Soteria* (the series name; never "Chronicles"). Players spend ability points (AP) on a star map. Each class is a star, and each class has its own constellation of subclasses. It lives inside the Syntarion app (`1 syntarion-app/constellation/`) and runs embedded in host mode (`host.js`): Syntarion supplies the character's AP and learned list and saves every change to that character's row, so a build is tied to its character and owner. The standalone server (`npm run constellation`) keeps builds in localStorage and is for layout work only.

## The world's vocabulary

**Practices** (the four disciplines), each with its own colour, ladder of discipline levels, ability types and bane types:

| Practice | Colour | Discipline levels (1 → 5) | Practitioner / master |
|---|---|---|---|
| Magicka | green | Mote → Charm → Spell → Glamour → Weave | Magus / Archon |
| Ingenium | blue | Tinkertrick → Diagram → Mod → Glimmer → Schematic | Axion / Omnifex |
| Nihimence | orange | Grit → Gambit → Tactic → Feat → Talent | Ghrimm / Prefect |
| Praethacy | purple | Psync → Arc → Flux → Gleam → Kinetic | Psynth / Primynth |

- **Praethacy is hidden.** It appears only once a player has 3 Magicka unlocks plus 3 Ingenium/Nihimence unlocks combined, at which point "The Veil" can be opened on the map.
- **Aspects:** every class has one of nine aspects: Soul, Spirit, Mind, Body, Will, Whim, Affect, Dream, plus Hope, which belongs only to Psynth. The aspect glyphs form the "Saga of Soteria" card in the corner of the map.
- **Magic | Tech axis:** a slider from −4 Magic to +4 Tech. Magicka pulls toward Magic, Ingenium toward Tech, Nihimence leans Tech at half strength, and Null pulls toward neutral.

## How progression works

- **Classes:** 103 in total. There are 18 *callings* (root classes: 16 base callings plus the hidden Warden and Null), each branching into subclasses down to an *endpoint* class (tier 4), which may hold an associated item. Warden (Praethacy) branches straight into three master classes, Psynth, Ghrimm and Wreicht, each with its own Praethic weapon; Null's line runs Nil, Naught and Nix into Sentinaut, its master class, which holds the item Noxinix (user's chart, 2026-11-15).
- **Caelyn and Dyreon have their own level words:** Dormant, Awakened, Ascendant, Transcendent, Resonant (Caelyn) and Initiate, Bonded, Adept, Synchronized, Sovereign (Dyreon), though both stay Ingenium.
- **Tiers cap discipline levels, and ladders climb:** a calling reaches level 2, tier 2 level 3, tier 3 level 4, and an endpoint level 5 (`LEVEL_DEPTH=[1,1,2,3,4]`). Awakening a class further down a class's own line raises its cap to that tier (`levelReach`), so Weaver reaches Weave (level 5, which marks long-time players) once Archon is awakened. Mastery is still judged at the class's own tier.
- **Order of purchase, per class:** discipline levels are bought first and in order. Every ability is then bought once per level the class holds (e.g. Mote Vehem, then Charm Vehem).
- **Cost:** a discipline level costs its level number (1–5 AP), and each ability purchase costs 1 AP. The first purchase in any class costs +1.
- **Three moments:** the first purchase in a class is "Discipline unlocked". The third purchase opens its subclasses ("New paths open"). Learning everything the class can reach is "Discipline Mastered". Players keep everything learned further up their path.
- **Points:** players start with 5 AP (dev builds use 20). All further AP comes from Syntarion, about 1 per character level, with no cap.
- **Null:** a hidden Nihimence calling that appears after two Nihimence classes reach 3 purchases each ("The Void" opens on the map). It draws on the Voidpoint and nulls magic and tech alike. Its abilities are Sense, Short and Refuse (user, 2026-11-12), replacing the earlier Blackout set.

## Three kinds of ability

1. **Class abilities:** a class's own abilities (305 entries). 300 come from the Syntarion archive (`legacy-tree.js`, the older tree); a handful are written specifically for this app (`OWN_ABILITIES` in `data.js`, e.g. Null's abilities). Praethacy classes have none yet.
**Status:** ability and bane types are out of play as of 2026-11-05 (no tab, no purchases, not counted for Mastery). The two items below describe tables that remain in code.

2. **Ability types** (called "crafts" in code): constructive or neutral types per practice, 13 each (e.g. Magicka: Cantrip, Wish, Ward, Mark, Fetch, Bind, Shout, Vow, Dream, Grace, Miracle, Wonder, Archona).
3. **Bane types:** harmful, corruptive or adversarial types per practice (e.g. Magicka: Hex, Curse, Bane, Blight…).

**Who may take each type** comes from the user's eligibility table (`ability-eligibility.js`):
- `ELIGIBILITY` is the table transcribed verbatim.
- `NAME_FIXES` maps names in the table to real classes.
- `ADDITIONS` holds the user's later decisions (e.g. Bard gets Shout; Psynth gets Pulse and Rupture).

A type may only go to classes of its own practice.

## What abilities consume on the character sheet

Every ability consumes one row of the character sheet's Magic | Tech table, chosen per line (user decision, 2026-11-15; this replaced the earlier aspect-stat rule). Magicka lines take Magic rows: Inquisitor Divine/Sanctus, Zealot Spirit/Sacral, Weaver Magic/Mana, Druid Nature/Chi, Sage Glyph/Gnosis, Mystic Light/Shaeid, Oneir Shadow/Wraill, Bard Imagination/Phorym. Nihimence and Ingenium lines take Tech rows: Rogue Fortitude/Lithium, Fighter Grit/Steam, Poet Volition/Crhon, Merchant Reason/Cell, Scholar Focus/Zinc, Vanguard Ingenuity/Null, Alchemist Matter/Volt, Artificer Gain/Ion. Null's line takes Ingenuity/Null, sharing Vanguard's row. Warden's Praethacy line takes Volition/Crhon, following Psynth's header, except Wreicht, which leans Magicka and takes Magic/Mana. Every other class on a line consumes the line's trait (`SHEET_TRAITS` and `traitFor` in `data.js`). `ABILITY-SKILLS.md` and `ability-skills.csv` list every ability with its trait. Still undecided: how much each ability consumes.

## Infrastructure

- **Stack:** vanilla ES modules, HTML and CSS, with no build step and no framework. `npm start` serves it on `http://localhost:4177` (`server.mjs`). `npm run check` syntax-checks the modules and runs the test suite (30 tests, Node's built-in runner, all passing).
- **Saves:** stored in the browser (`localStorage`, key `syntarion-atlas-v1`). Dev saves are disposable; the real save will live on Syntarion's character sheet.

| File | Role |
|---|---|
| `data.js` | Practices, classes and lineages, discipline levels, costs, mastery, gates, Magic/Tech axis, `OWN_ABILITIES` |
| `ability-eligibility.js` | Who may take each ability/bane type (`ELIGIBILITY`, `NAME_FIXES`, `ADDITIONS`) |
| `legacy-tree.js` | The Syntarion archive: the original class abilities with descriptions |
| `config.js` | Starting AP (dev 20, players 5) |
| `doctrine.js`, `aspect-stars.js` | The nine aspects, their glyphs, and the star figures traced from them |
| `atlas-layout.js`, `calling-layout.js` | The shared star map and each calling's own sky (positions, label offsets, connecting threads) |
| `app.js` | The interface: the drawer, purchases, undo, reveals, the corner Awaken button, the Saga card |
| `ceremony.js` | Purchase and mastery ceremonies, hold-to-buy, camera dive, the Veil/Void reveals |
| `cosmic.js` | The living sky (parallax star layers tinted to the selected practice) |
| `tooltip.js` | Themed tooltips |
| `style.css`, `cosmic.css`, `presentation.css` | Styling (`presentation.css` holds the latest layer of decisions) |
| `test.mjs` | Rules tests (levels, costs, eligibility, gates, reveals, the axis) |
| `README.md` | A detailed log of every design decision |

## Design decisions to respect

- Wording: "Discipline unlocked" and "Discipline Mastered" (not "title earned"), "Learned" (not "Level held"), "discipline level" (never "craft level").
- State is shown by glow only, never by outline rings.
- The drawer opens only for classes the player has awakened.
- Content questions are the user's to decide. Flag them rather than resolving them silently.

## What to send back

Changes can be dropped straight in if they come back in one of these shapes.

**Re-sorted or edited abilities:** the same CSV columns as `ability-list.csv`. Add a `Change` column (`keep`, `rename to …`, `move to <class>`, `remove`, `new`) and a short `Note`.

```
Ability,Kind,Practice,Class,Calling,Description,From archive,Change,Note
```

**New class abilities:** one block per class:

```
Class: Rogue
- Name: one-line description of what it does in play
```

**Eligibility changes:** per type, the full list of classes that should have it:

```
Ward (Magicka, ability type): Cleric, Paladin, Wizard, Dryte, Runesiph, Glyphsage
```

Keep names exactly as the class list spells them (see `ability-list.csv`), and say when a change also changes a rule (cost, gate, level cap) rather than just data.

## Open items

- Every class has its own final abilities as of 2026-11-15 (345 in all); none use the archive any more. Text is one line per ability; the five-level text comes later.
- Many ability types carry placeholder descriptions ("Its effects are not yet defined").
- The number of purchases that opens new paths is 3 in this prototype. Null's reveal uses that number too (user decision), not full mastery.
- Syntarion integration (2026-11-15, branch `constellation-integration` in `1 syntarion-app`): the Abilities tab hosts this explorer (README, "Inside Syntarion"), builds save to the character, AP comes from leveling, and the casting panel lists learned abilities by trait pool. Ability amounts are still undecided; a use costs 1 from its pool as a placeholder.
