# Syntarion · The Constellation

This is the Syntarion app's ability tree. It lives in the app repo (`1 syntarion-app/constellation/`) and is the only copy: the app's Vite config copies its runtime files into `public/constellation/` and the character sheet embeds it in host mode, where each build is saved to that character's row. Node 20+; no dependencies or installation.

```powershell
cd 'F:\Theonhex\App Dev syntarion-app'
npm run constellation        # serve it alone, local-only saves
npm run check:constellation  # syntax and progression checks
```

The standalone server runs at http://127.0.0.1:4177.

The cosmic pass uses a persistent canvas for drifting particles and softly flaring stars, animated SVG twinkles, slow nebula movement, and brighter discipline-colored selection halos. Motion on/off controls all ambient effects; reduced-motion preferences start with a still sky. Rendering pauses when the map leaves the viewport or the document is hidden, caps pixel density and particle count, and uses no external effect library. Ability data and lore mappings remain in `data.js` and `legacy-tree.js`.

The cinematic composition lives in `atlas-layout.js`, re-exported through `shared-map.js`, with visual hierarchy in `presentation.css`. Each practice has a fixed, individually arranged star pattern and offset labels. Praethacy sits at the horizontal midpoint of Magicka and Ingenium. Its unnamed dust and orbital traces are purely atmospheric; Psynth remains its only class. The central nexus is deliberately understated. Side panels and the header are quieter, leaving more room for the atlas. Mobile uses a bounded, pannable map rather than overflowing the page; tablet places the detail panel below the sky. No outlined text treatment is used.

The four official practice PNGs supplied from `F:/Theonhex/SYNTARION/Symbols/Syntarion Doctrine — abilities/` are copied unchanged into `assets/practice-icons`. `practice-icons.js` uses their existing alpha as a CSS/SVG mask, displaying green Magicka, blue Ingenium, amber Nihimence, and purple Praethacy on practice cards and constellation headings. The small practice indicator and class-art fallback use the same symbols. Praethacy's art remains absent from the visible UI until revealed; its locked card retains a generic sealed marker. This does not assign a practice symbol as unique Psynth class artwork.

Class PNGs from Syntarion's `public/ClassIcons` are copied unchanged into `assets/class-icons`. `class-icons.js` uses Syntarion's own VTT luminance-to-alpha silhouette technique during rendering to remove the white backdrop and tint the visible symbol to its discipline. The 16 available matching base symbols appear on stars and in the selected-class panel. Advanced classes use their root family's symbol (labeled as a family symbol), pending dedicated art. Psynth uses the user-supplied `pynth.png` from `SYNTARION/Symbols/Syntarion Doctrine — abilities`, copied unchanged to `assets/class-icons/psynth.png` and tinted Praethacy purple; its subclasses use it as their family symbol. Bard uses the user-supplied revised black lyre (converted from WebP to PNG without pixel changes), tinted Magicka green like the other class symbols. Per the user-confirmed correction, Oneir uses the Magister artwork retained in this project, and Poet uses the user-supplied abstract_rogue_symbol.png. Scholar uses the user-supplied transparent black symbol, rendered in Ingenium blue. Practice symbols are separate from class symbols.

**Official symbols (2026-11-15, supersedes the two paragraphs above):** class and practice symbols now come from the user's `SYNTARION/Symbols/C L A S S/O F F I C I A L` folder. 95 classes have their own symbol (79 on the first pass, 16 more plus a newer Whyth in a second sweep the same day), imported as greyscale PNGs of at most 512px (JPEG `.jfif` files converted, off-white pages lifted to white for Monk, Shaman and Nihimence, misspelt `negotiatior` and `luareate` mapped to Negotiator and Laureate). Classes without one borrow their line's symbol. The four practice symbols are converted to transparent PNGs (dark ink opaque) because they are drawn as alpha masks. Archon uses the image in its own folder; a different `archon.png` at the top of OFFICIAL is not used. Every class and practice symbol is then trimmed to its ink and sized optically in a 512px square: width times height averages 80% of the square, with no side past 96%, so tall narrow symbols (Zealot, Loaite) match round ones (Bokor, Poet). Shaman's grey vignette is removed first. Before, spans ran from 52% to 98% (user asked for coherent sizes). Map stars draw symbols at 54 units (84 for master classes); threads fade out as they reach a star (a mask built in `threadHoles`), so nothing dims the sky around them. Not imported: `Ghrimm`, `Ghrimm2`, `wreicht`, `wreicht2`, `psynth2` and the three `unused` files.

Select a calling from the navigator or a star on the map. Search includes only the advanced classes you are aware of. All practices share one atlas. Selection changes emphasis and the detail panel; it does not replace the map, reset its animations, resize it, or reset pan/zoom. Inspect class abilities (or the Class abilities tab, or selecting the selected star again) opens that calling's own constellation; Back to the atlas or All callings returns. Ability, discipline-level, and craft-type selection stays in that panel. Revealing the fourth practice adds Psynth at its reserved coordinates without shifting existing stars. `shared-map.js` owns the stable layout and updates selection in place. Drag the map, scroll or use the zoom buttons, and press the recenter control to restore the view. Keyboard: `/` searches; tab and Enter select stars; when the map container has focus, arrows pan and +/− zoom.

## Callings and their constellations

The player starts at The Self and may awaken any of the 16 base callings (Psynth stays hidden until Praethacy is revealed). Multiclassing is allowed; broad base skills across practices are what open Praethacy. A thread from The Self lights to each calling holding an awakened star; each thread has a fixed bend (`selfBends` in `atlas-layout.js`) that clears every star and label.

Each calling has its own constellation (`calling-layout.js`), transcribed in `data.js` from the user's Class Ability Tree chart: the calling at the base, parallel two-step branches rising (three for Weaver, one for Bard, Poet and Vanguard), converging on one endpoint class, followed by the associated item as a relic. Psynth's lineage is Zeit → Cognizant and Psion → Syzygic, ending in Praetor, with no item.

- A subclass becomes known once any parent is awakened, and opens once any parent is mastered. Unknown next stars show only as faint unnamed dust on an awakened path.
- Mastery is three awakened nodes in a class. It earns that class's title (listed in the detail panel), reveals its next stars, and claims the item once the endpoint is mastered. Mastery never grants points.
- Every branch stays open; the endpoint can be reached from any mastered branch.
- Three independent dimensions decide every purchase: the **discipline level** (how advanced), the **ability** (what it is) and **eligibility** (who may perform it).
  - Each class climbs its own discipline ladder (Mote, Charm, Spell, Glamour, Weave; Tinkertrick…Schematic; Grit…Talent; Psync…Kinetic), bought in order at 1–5 AP, so a level-one Scholar and a level-one Artificer each buy Tinkertrick. Caelyn and Dyreon cross practices and climb in their own words (Dormant, Awakened, Ascendant, Transcendent, Resonant; Initiate, Bonded, Adept, Synchronized, Sovereign; `CLASS_LADDERS`). Depth caps the ladder (`LEVEL_DEPTH`): a calling reaches the second level, tier 2 the third, tier 3 the fourth, and the endpoint the fifth. Ladders climb (`levelReach`): awakening a class further down a class's own line raises its cap to that tier, so Weaver reaches Weave once Archon is awakened. Mastery is still judged at the class's own tier. Players have few points, so choosing which classes to open is the strategy.
  - Every ability is bought once per level its class holds: Mote Vehem needs Zealot's Mote, Charm Vehem needs Zealot's Charm and Mote Vehem, and so on. Each ability purchase costs 1 AP. A class's first purchase (normally its first level) costs one extra point. The panel shows one row per ability with its highest level held and the price of the next.
  - **Ability and bane types are out of play (user decision, 2026-11-05):** the drawer has no Types tab, nothing buys them, Mastery ignores them, and a saved type purchase is refunded on load. A class opens its paths at 3 purchases, or at everything it has if its abilities are not entered yet (`pathsNeed`). The tables below remain in code.
  - Ability and bane types come from the user's eligibility table in `ability-eligibility.js`, restricted to each type's own discipline (user rule). Entries that name another discipline's class or no class at all (items, "Inquisitor-aligned practitioners", "Dedicated Null practitioners"…) are listed in `eligibilityUnresolved`, never guessed. User decisions on top of the table live in `NAME_FIXES` and `ADDITIONS`: items go to the endpoint holding them (Maton → Axion, Engram → Laureate), qualified groups resolve to their class (Bane → Inquisitor, Blight → Dryte, Archona stays Archon's), classes that had nothing to master got types from their branches (Bard Shout; Oneir Dream; Poet Speech, Fable; Eldritch Dream, Plague; Eikon Wish, Wonder, the Magicka counterparts of its earlier Core, Marvel; Dyreon Marvel), Psynth takes Pulse and Rupture, and Infection goes to Ranger and Marauder. A test guards that every class can reach mastery within its own level cap.
  - Mastery is three purchases in a class, levels included.
- States read from glow alone, with no outline rings: available stars breathe softly, awakened stars glow, mastered stars glow most intensely, sealed and unexplored stars are dimmed.

The chart replaced the earlier class list: Inquisitor gained Devout; Vanguard's Null and Warden were dropped. Scholar's Scientist and Inventor were dropped too, then restored by the user on 2026-11-12 as Scholar's third branch (Scientist, then Inventor, converging on Laureate). Caelyn and Dyreon remain blue (Ingenium) per the earlier correction, although the chart draws them green.

Magicka, Ingenium and Nihimence appear first. Reveal discipline requires **three distinct learned nodes total across Ingenium and Nihimence combined, plus three learned Magicka nodes** (counted by the practice of the line each class belongs to, so Caelyn and Dyreon count as Magicka and Eikon as Ingenium; user, 2026-11-15) (raised from one Magicka node by the user on 2026-11-04). Any mix of the two qualifying practices counts (3+0, 2+1, 1+2, or 0+3). Learned abilities, discipline levels, and craft types count; spent AP and simply selecting a class do not. Progress appears on the disabled reveal card. Meeting the requirements enables the button; the reveal still happens only when clicked. Close the veil hides it again. Saved reveal flags are checked against the same requirement, and resetting the build also hides Praethacy. Existing saved Praethacy unlocks are retained but cannot satisfy its gate. Selections and investments persist in this browser. Reset build refunds all points. No backend connection, account, or Syntarion character writes.

## Source and provisional rules

- The English-only being/expression structure follows [The Syntarion Doctrine of Being](https://docs.google.com/document/d/1DHM9Sn9W7yUIq5v_co_jeE0Yu-7tYaHy/edit). `doctrine.js` defines the two groups and class-aspect descriptions; [DOCTRINE-ALIGNMENT.md](./DOCTRINE-ALIGNMENT.md) records the interpretation and mechanical boundary. This presentation does not reassign classes or create new unlock rules.

- `legacy-tree.js` is the extracted TREE data from `F:/Theonhex/App Dev/1 syntarion-app/src/AbilityTree.jsx`. Named abilities and descriptions are reused for matching classes and disciplines.
- `data.js` transcribes the supplied screenshots. The base class and attribute pairings, advanced class names and discipline vocabularies follow those references. Terminal items are explicitly labeled associated items, separate from class advancement. The final clipped practitioner name in the table is provisionally transcribed as Ghrimm.
- Discipline identity is fixed by class: Magicka is green, Ingenium blue, Nihimence amber, and Praethacy purple. Explicit endpoint colors override root colors (including blue Caelyn and Dyreon). Gray intermediate classes inherit the root discipline pending more specific lore. Fighter is Nihimence; Praethic Blade is its associated item, not a class or a discipline assignment.
- Per the user's lore correction, Psynth is the ONLY Praethacy calling; its own lineage (from the Class Ability Tree chart) ends in the Praetor endpoint class. It appears in navigation, search, and the constellation only after Reveal. Revealing selects Psynth; selecting another class restores that class's own discipline. Closing the veil hides Psynth and returns to Weaver if necessary. Cross-discipline ability generation is blocked in the data layer. Old invalid selections are corrected and cross-discipline investments removed/refunded when loading saved builds.
- **Superseded 2026-11-15 (user's chart):** Praethacy's line is now Warden, the hidden Hope class, branching straight into three master classes: Psynth (Praethic Brand), Ghrimm (Praethic Maul) and Wreicht (Praethic Spindle). Ghrimm leans Ingenium and wears its blue, Wreicht leans Magicka and wears its green; both stay Praethacy, and Psynth and Warden stay purple (user, 2026-11-15). Zeit, Cognizant, Psion, Syzygic and Praetor were removed with their abilities. Null is no longer a lone star: Nil, Naught and Nix branch from it and meet at Sentinaut, its master class, which holds the item Noxinix; the whole line stays hidden with Null. Lines of this kind are listed class by class (`members` in `data.js`) and laid out by tier in `calling-layout.js`. Gallant's item is the Sovereign Sword (was Praethic Blade).
- Players start with 5 ability points; further grants come from Syntarion, the master app, never from this explorer. `config.js` sets `DEV_MODE` (currently on), which starts with 200 points for testing deeper paths; set it to false for players. The first ability awakened in any class costs one extra point. Craft costs of 1–5 AP, sequential discipline-level prerequisites, one-point craft/ability-type unlocks and the three-node mastery threshold are prototype rules, not imported campaign rules. Generic discipline descriptions are placeholders and are labeled Discipline Framework. Advancement edges follow the Class Ability Tree chart.
- Syntarion's Cinzel typography, dark surfaces, bronze accents, and discipline colors informed the visual system. Fonts use Google Fonts with local serif/sans-serif fallbacks.
- Controls use original CSS informed by UIverse's outlined buttons and hover treatments: https://uiverse.io/buttons and https://uiverse.io/cssbuttons-io/slippery-jellyfish-67. No third-party component source was copied.

The parent Syntarion repository is unchanged. This folder can be moved and run independently.

## Aspect glyphs

The Pillar and Instrument glyphs (Mind, Soul, Spirit, Body, Will, Whim, Affect, Dream) are cut from the user's `SYNTARION/Currency/Syntarion-defined.png` sheet into `assets/aspect-icons`, with black ink turned into alpha the same way class icons are silhouetted. They mark each aspect row in the navigator and the aspect line in the detail panel, tinted by CSS mask. The ninth glyph, Hope, is Psynth's aspect (user-confirmed): it marks the revealed row in the navigator, Psynth's detail panel, and is traced behind Psynth's sky. Hope sits outside the Pillars and Instruments, so the doctrine's eight aspects are unchanged.

Each calling's own sky (Psynth's included, with Hope) also traces its aspect glyph in faint background stars (`aspect-stars.js`, generated from `assets/aspect-icons` by sampling each glyph's strokes). Every awakened node adds a small star in the discipline's color around its class's star; on the atlas a calling's star gathers the stars of its whole family. New ones pop in once; existing ones twinkle in place.

Inside a calling's sky every star keeps its own practice's color, so cross-practice endpoints (Caelyn and Dyreon are Ingenium blue on Magicka lines, Eikon is Magicka green on an Ingenium line) stand out, and the lines into them blend from the calling's color to theirs; the item takes the endpoint's color. The endpoint class is the sky's monument: a larger symbol, a standing glow, twelve slow-turning rays of light (no outline rings), a larger engraved label, and a wider orbit of unlock stars.

## Magic | Tech axis

A slim meter across the top of the map (beside the caption; under it on phones) mirrors Syntarion's Magic | Tech slider (`magicTechAxis` in `data.js`): −4 Magic to +4 Tech, moving 0.25 per purchase, with ticks at ±3 where Syntarion gates Spells and Schematics. Magicka purchases pull toward Magic and Ingenium toward Tech. Nihimence is not tech, but each Nihimence purchase leans the needle Tech-ward at half an Ingenium step (0.125). Null purchases pull the needle back toward Neutral by 0.25 each, never past it, so a mastered Weaver who takes up Null watches their Magic lean cancel out; the meter shows what remains. It glows green or blue while one side is pure, shades toward purple as Magicka and Ingenium mix (Praethacy purchases count as mixing), and the needle stays amber when only Nihimence is held (it still sits slightly Tech-side). The label never names Praethacy: it reads Magic favoured, Tech favoured, or Neutral, and a centered needle is colorless until it leans one way. The atlas sits 60 units lower (`ATLAS_DROP`) and each calling's item sits at y 135 so the meter never touches a heading, symbol or label; this was checked for the atlas and all 17 skies at 1180, 1440 and 1520px wide and on a 375px phone.

## Null, the hidden Nihimence star

Like Praethacy, Null is hidden: once a player has mastered two different Nihimence classes, its sealed star (The Void) appears on the sky and opens on click. It is a lone star at endpoint depth in Nihimence's region of the atlas, between Poet and Merchant, so its ladder reaches Talent, and it is the dedicated practitioner of the Null type. Its symbol is the user's `null.png` from `SYNTARION/Symbols/Syntarion Doctrine — abilities`, copied unchanged. Null draws on the **Voidpoint**, an inner stillness that unmakes magic and tech alike. Its class abilities are the user's (`OWN_ABILITIES` in `data.js`, 2026-11-12): Sense, Short and Refuse. They replaced the earlier set written with the user (Stillpoint, Hollow Breath, Severing Palm, Unwoven Sight and Blackout, which became The Unmaking at Talent), which had itself replaced the legacy Vanguard-era cog and Whythryn abilities. The panel labels these as class abilities, not archive entries.

## Layout (October 29 readability pass)

The sky is front and center. The discipline cards and the "Your path" navigator were removed: classes are chosen on the sky. The selected constellation is a drawer that slides in from the right when a star is chosen and recedes when closed (× or Escape); a tab on the sky's right edge reopens it. Hidden callings have sealed stars on the sky: **The Veil** appears at Psynth's spot only once Praethacy's gate holds and reveals Psynth when clicked (Close the veil sits in the map toolbar); **The Void** at Null's spot does the same for Null after two Nihimence classes are mastered; neither seal shows before then. All interface text is 11px or larger. On phones the sky sits at the top, a dock pinned to the bottom shows the selected purchase with its Awaken button, the drawer covers the screen, and every tap target is at least 44px.

Sky text was enlarged (star names 21 sky units, about 11px on desktop and 10.6px on phones); every atlas label was re-placed centred on one side of its star, the lines from The Self were re-routed around them, and the atlas (sealed and revealed) and all 18 calling skies were audited clean. The legend lives in the footer bar under the sky.

## Saga of Soteria

The page header text and the Local Sanctum label were removed (the title remains for screen readers), and the sky panel now fills the window height. Ability points and the **Saga of Soteria** card stack, always open, in the sky's empty bottom-left corner (below the sky on phones, where the dock also shows AP left); Reset build sits at the left of the footer bar. The Saga card: the nine aspect glyphs (Mind, Soul, Spirit / Body, Will, Whim / Affect, Dream, Hope) as glass tiles. Each glyph's tooltip names only its aspect; hovering (or tapping to pin) a glyph lights that aspect's callings on the sky and dims the rest. The stack was audited to cover no star, label, line or control at 1180 and 1440px. Hope stays sealed until Psynth is revealed. The header subtitle reads Saga of Soteria.


## Ceremonies

`ceremony.js` turns the core moments into events (no audio, by the user's choice):

- **Hold to awaken.** Awaken (and the phone dock's button) fills while held and buys when full (650 ms); a short press says "Hold to awaken". Enter or Space on a focused button buys at once.
- **Awakening.** The newly committed thread draws in from its parent, the star ignites with a soft bloom and a scatter of motes (glow only, no rings), and the AP figure counts down with a drifting "−n".
- **A class's three big moments.** Each sets its symbol (flashing) and name on the sky for a few seconds: **Discipline unlocked** on the first purchase; **New paths open** on the third purchase, if the class has subclasses to open (its threads trace and new stars rise); **Discipline Mastered** when everything the class can reach is learned. Star glow, the legend, the drawer and the associated item all treat Mastered as that finished state. Three purchases only open paths.
- **The hold's light.** The hold lasts longer for dearer purchases (450 ms + 200 ms per AP). While held, a bright edge travels across the button and light runs along the star's thread on the sky at the same pace (from the Self on the atlas, from its parent in a calling's sky); letting go early makes it fizzle out where it stopped: the head sputters and sheds a few sparks, and the trail goes dark.
- **Camera dive.** Entering a calling (its star, Class abilities) dives the camera into that star and settles into its own sky; leaving pulls back out to the atlas. Awakening from the atlas dives into the calling first, so the ceremony plays where its stars live.
- **Reveals.** Opening the Veil tears a seam of light where the seal stood; its halves part like curtains and dissolve, and Psynth rises through. Opening the Void draws light inward to a point, holds a beat of dark, then Null appears. Each sets a pop-up ("The veil parts" / "The void opens") with the calling's symbol flashing. Psynth keeps a breathing violet glow and a larger symbol on the atlas.
- **Discipline level toast** reads "Grit unlocked · Rogue's discipline level 1 · 2 AP spent".
- **Undo.** The toast after a purchase carries Undo (Ctrl+Z also works) for the last purchase this session.
- With Motion off every result shows at once; the mastery title still appears, without movement.

## Atlas routing notes

- **Artificer's thread** leaves The Self and passes left of Scholar's label, between it and Psynth, to arrive at Artificer from below-left. Before, it swung out right past Scholar and ran alongside the Artificer–Scholar line, which read as a path through Scholar. It crosses no other thread or constellation line (audited with the Veil sealed, ready and revealed).
- To make room, **Psynth's label** (and the Veil's, with its REVEAL line) sits above its star instead of to the right.
- **Drawer:** it is capped to the workspace height (an old 900px minimum had pushed its bottom past the panel), the ability list no longer scrolls inside the scrolling drawer, and Awaken is pinned to the drawer's foot.

## Themed interface chrome

- Every scrollbar is thin with its thumb in the current practice's accent.
- `tooltip.js` replaces the browser's native tooltips (HTML `title` attributes and SVG star `<title>`s) with one themed tooltip, shown on hover or keyboard focus.
- The toast is dark glass with an accent edge, matching the drawer and tooltip.

## Living sky

`cosmic.js` draws the sky behind the stars in three depth layers. Each drifts at its own pace and slides by a different amount when the sky is panned or zoomed (far 6%, middle 16%, near 32% of the camera move, eased so pans glide). The middle layer takes the base practice's colour, the practice of the selected calling: Magicka green, Ingenium blue, Nihimence orange, Praethacy purple. It is kept faint and fades between colours when the selection changes. About one middle-layer star in nine is a prism star that twinkles slowly through all four practice colours. With Motion off the sky is still, but it still follows pans.

## Unlock stars

Each awakened node puts a star around its calling's star on the sky, shaped by kind so a player's abilities read at a glance: an eight-ray star for a discipline level, a long four-ray sparkle for a class ability, a six-point star for an ability type. Each is turned to its own angle (from its id), has a white core and a stronger glow, and the whole set slowly orbits its calling (45 s a turn, 70 s for endpoints; still with Motion off). They stay within 35 units of the star, inside the 38-unit label clearance.

## Traced aspect figures

Each calling's sky draws its aspect glyph in faint stars. The glyph's points are chained nearest-neighbour from the top-left, and a light runs along that chain every seven seconds (5.6 s to cross, then a pause). Each star flares in turn (a gentle swell and brightening with a wide, soft glow), so the glyph looks traced in light. Each star also twinkles on its own. Both run only once the player has awakened a class in that calling (until then the glyph stays still and faint), and both stop with Motion off.

## Drawer only for awakened classes

Selecting a class you haven't awakened yet leaves the drawer closed (its edge tab is hidden too). Instead, an **Awaken** button for its first discipline level sits above the points box in the sky's corner, the same width as the points box, held to buy like any purchase. Buying it dives into the calling (from the atlas), plays the ceremony, then opens the drawer. On phones the dock already offers the same purchase, so the corner button is hidden there.
The corner stack has one fixed width (176px) and the Awaken button one fixed height whatever the class, so names and costs never resize it. Each time the selection changes, the button rises in like smoke: blurred and faint, then sharp and full. It reads class and cost first, then the purchase, e.g. "ONEIR · 2 AP / Awaken Mote".

## Drawer wording and highlights

A learned discipline level reads **LEARNED** in the list and the Awaken button reads **✦ Learned** (never "Level held"). Rows the player can buy right now glow in the practice accent with an accent edge; learned rows read settled; rows not yet available are dimmed. Unless the player picked a row, the drawer opens on the first row that can be bought.

## Ability list export

`ABILITY-LIST.md` (readable) and `ability-list.csv` (one row per ability per class) list every discipline level, ability type, bane type and class ability, generated from `data.js` (593 class/ability rows, 305 class abilities).

## Calling descriptions

`CALLING_LORE` in `data.js` holds the user's description of each calling (16 base callings, Null and Psynth). While a calling is not yet awakened, its description is set on the sky beside the corner Awaken button: no box, small type with a soft shadow, headed by practice and aspect (e.g. "MAGICKA · SOUL"). It rises in like smoke 0.9 s after the button. Its width (up to 260px) is fitted to the free sky beside the corner stack, so it never covers a star or label. The sky is centred in the space beside the corner stack to leave that room. In very small windows (under about 1000px), where under 170px is free, it sits above the button instead. Null's aspect is Hope, like Psynth's (user, 2026-11-04).
The class's own symbol floats above the corner Awaken button: 64px, tinted and glowing in the practice colour, centred over the button and outside the stack's layout so nothing below moves. It smokes in just after the button.

## Atlas heading

On the atlas the top-right reads **ONE SKY. EVERY DISCIPLINE** (was "3 practices · one constellation"). The caption at top-left is just **THE CELESTIAL ATLAS**, set larger in Cinzel across two lines so it clears the Magic | Tech meter; the old "One sky. Every practice." line is gone. A calling's sky still shows "<Calling>'s constellation" under the smaller heading.

## Ability-to-pool list

`ABILITY-SKILLS.md` and `ability-skills.csv` list each ability with the trait it consumes: one row of the character sheet's Magic | Tech table per line (`SHEET_TRAITS` in `data.js`, user decisions, 2026-11-15), shown in the app as a Consumes line under each ability. Amounts are not defined yet.

## Saga card order

The nine glyphs follow the cover of *The Lockcaste* (Saga of Soteria, Book 1), read across each row: Will, Mind, Dream / Spirit, Hope, Soul / Affect, Body, Whim. The order matters to the user. The cover's one bright glyph is for the book only: here all nine are equally bright until hovered or pinned.

After a purchase, the drawer's selection moves to the next row that can be bought.

A thread between classes lights only along the path the player walked: its parent had opened its paths before the child's first purchase. Awakening another parent later leaves that thread dark, so a line never lights by itself.

**Video game pass (user, 2026-11-15):** a shooting star crosses the sky behind the constellation every 8–20 seconds (most pale, about one in four in a practice colour; `cosmic.js`). Every few seconds a spark of light runs along one awakened thread, from The Self outward or from a class to the class it opened. Stars answer the pointer: the symbol grows 20%, glows and its label brightens. All of it stops when Motion is off or the system asks for reduced motion; there is no sound.

## Inside Syntarion (host mode)

Syntarion's Abilities tab (`src/ConstellationTab.jsx` in `1 syntarion-app`) loads this explorer in an iframe as `index.html?host=syntarion`. In host mode (`host.js`) the page asks the parent for the character's build and AP, hides its own header and footer, keeps only view state on the device, and reports each change as an AP spend and a Magic | Tech shift; Syntarion saves it to the character. Purchases are instant (user decision, 2026-11-15). In Syntarion the ability currency is AP and experience is XP.

Syntarion's Vite config copies this folder into `public/constellation/` on every dev start, build and change (`npm run sync:constellation` does it by hand), and rebuilds the Scribe's class reference (`src/soteria-classes.js`) from `data.js` at the same time. Outside host mode nothing changes: the dev build still starts with `DEV_STARTING_POINTS`.

**Pick mode** (`index.html?host=syntarion&pick=1`, user, 2026-11-16): the character wizard's class step shows the atlas to choose a calling. Nothing is bought and no AP, Reset, axis meter, legend or view tabs are shown; the sky never dives into a calling. Selecting any class on a line posts `{type:'pick', classId}` with that line's calling id (hidden and secret lines can't be picked) and makes it glow as the declared calling. The wizard (`src/StepClass.jsx`) lists the calling's abilities beside it.
