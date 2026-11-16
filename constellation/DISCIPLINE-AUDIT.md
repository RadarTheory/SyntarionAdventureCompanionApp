# Discipline setup audit — October 22, 2026

Checked all 96 configured classes (17 base classes, 79 advanced classes) against the latest user-supplied four-column reference image. Each class resolves its setup from its assigned discipline; the reference table defines those discipline setups, not class-to-discipline assignments.

| Field | Magicka | Ingenium | Praethacy | Nihimence |
|---|---|---|---|---|
| Practitioner | Magus | Axion | Psynth | Ghrimm |
| Special title | Weaver | Artificer | Praetor | Adept |
| Action | Cast | Deploy | Engage | Enact |
| Contained form | Grimoire | Drive | Cloud | Tome |
| Written form | Scroll | Code | Protocol | Dossier |
| Discipline | Mana | Tech | Synthesis | Mundane mastery |
| Primary principle | Mana | Lithium | Psyncrite | Prowess |
| Master title | Archon | Omnifex | Primynth | Prefect |
| Craft levels | 5 | 5 | 5 | 5 |
| Craft types | 13 | 13 | 13 | 12 |
| Ability types | 9 | 9 | 9 | 9 |

Corrections: the distinct Discipline row is now represented separately from Primary principle; Praethacy's last ability type is **Miasm**, replacing Miasma. Nihimence's empty craft-type row is intentionally not treated as a missing ability or invented thirteenth craft type.

The full ordered vocabulary and all eight metadata fields are checked against an independent transcription in `test.mjs`, including the values surfaced by `abilityNodes`. Existing class-specific abilities from Syntarion remain separate from the nine discipline ability types and are not validated by this table. The user is supplying those class-specific abilities.

Class colors and the Psynth-only Praethacy rule follow prior user instructions and the class chart. Gray intermediate classes still inherit their root discipline unless an explicit colored endpoint overrides it; this table does not independently establish their affiliation. No class affiliation or unlock mechanics were changed by this audit.

October 29: the user's eligibility table adds **Ginch** to Nihimence's constructive types (between Feint and Gauge), so Nihimence now has 13 craft/ability types like the other disciplines.
