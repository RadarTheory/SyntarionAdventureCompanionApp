import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── TIER LABELS ──────────────────────────────────────────────────────────────
const MAGIC_TIERS = ['Mote', 'Charm', 'Spell', 'Weave', 'Weave (Hidden)'];
const TECH_TIERS  = ['Tinkertrick', 'Diagram', 'Schematic', 'Blueprint', 'Blueprint (Hidden)'];

function getTiers(axis) {
  return axis === 'magic' ? MAGIC_TIERS : TECH_TIERS;
}

function getUnlockedTierCount(charLevel) {
  if (charLevel >= 5) return 5;
  if (charLevel >= 4) return 4;
  if (charLevel >= 3) return 3;
  if (charLevel >= 2) return 2;
  return 1;
}

// ─── ABILITY DATA ─────────────────────────────────────────────────────────────
// Each ability: { id, name, axis, boon, tiers: [t1desc, t2desc, t3desc, t4desc, t5desc] }

const RACE_ABILITIES = {
  // ── ADDAMAR (Human) ────────────────────────────────────────────────────────
  addamar: [
    {
      id: 'touchmark', name: 'Touchmark', axis: 'magic', boon: '+1 Spirit per use',
      tiers: [
        'For 1 hour, add +1 SPIRIT. Leave a glowing personal mark on an object or person that lasts 1 hour.',
        'Low Enchantment — Increase the usefulness of an item by +2, allowing it to add to a related roll.',
        'True Enchantment — Mark an item so only you can effectively use it. Other wielders take -2 when using it.',
        'Attuneless Enchantment — Choose one weapon effect (flaming, freezing, shocking, or keen) as a temporary enhancement. Lasts until the end of your next encounter.',
        '[HIDDEN LVL 5+] Grimrite Enchantment — Use a piece of Grimrite, a matching magical resource, downtime, and DM approval to infuse an item with a permanent magical effect.',
      ],
    },
    {
      id: 'mortal_drive', name: 'Mortal Drive', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Declare one specific, immediate, measurable ambition. The boon applies only to rolls that directly advance that objective.',
        'Rallying Drive — One ally who can see or hear you also gains the +1 when directly advancing that ambition.',
        'Commanding Drive — Up to three allies who can see or hear you gain the +1 when directly advancing that ambition.',
        'Leadership Drive — For 1 hour, your party gains +1 to rolls that directly advance the ambition, as long as they knowingly act toward the same goal.',
        '[HIDDEN LVL 5+] Legacy Drive — If your party completes the declared ambition, each participating ally may carry the +1 forward to one roll tied to a newly declared ambition.',
      ],
    },
    {
      id: 'quickprime', name: 'Quickprime', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Ready powder, shot, fuse, hammer, sight, or firing mechanism with practiced speed. Applies to reloading, readying, drawing, aiming, priming, firing, or handling a firearm.',
        'Clean Load — Reduce the chance of misfire, jam, or faulty preparation when using a firearm or powder-based device.',
        'Deadeye Mechanism — Tune a firearm so the first shot in an encounter gains +2 to a related roll.',
        'Battle-Ready Arm — Prepare a firearm so it remains steady, dry, and usable through your next encounter.',
        '[HIDDEN LVL 5+] Repeating Fire — Modify a firearm with a Chronolithe Spring so it may be fired or readied again +2 faster in combat.',
      ],
    },
    {
      id: 'eldimm_familiar', name: 'Eldimm Familiar', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Build or activate a small mechanical familiar that can carry a sealed note, deliver a message, or scout a short distance. No memory; breaks after 1 hour.',
        'Courier Cog — The familiar gains +2 for delivering mail, following simple routes, or recognising a visible recipient. Lasts 1 day.',
        'Scoutling Memory Gear — Upgrade the familiar with a memory gear. It can remember one route, one recipient, or one repeated command, and may scout before reporting simple findings.',
        'Eldimm Command-Core — Build a stable familiar that can learn up to three standing commands. Lasts until the end of your next encounter or mission.',
        '[HIDDEN LVL 5+] Eldimm Postmaster — A refined familiar with a durable command-core. Can remember routes, carry small sealed objects, scout ahead, and follow one complex linked instruction.',
      ],
    },
  ],

  // ── DURINAK (Dwarf) ────────────────────────────────────────────────────────
  durinak: [
    {
      id: 'stone_palm', name: 'Stone Palm', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Harden your hands with a thin stone-like shell of magicka, allowing you to strike, grip, climb, brace, mine, or work rough material without harming your flesh.',
        'Stonehand — Your hardened hands gain +2 for climbing, grappling, crafting, mining, breaking, lifting, or bracing.',
        'Cairnhand — Your hands become heavy and stonebound. Unarmed strikes, grip checks, and tool-work gain +2, but delicate actions take -2.',
        'Mountain Palm — Your arms and hands take on the weight and endurance of worked stone until the end of your next encounter.',
        '[HIDDEN LVL 5+] Runestone Flesh — Your stone-hardened hands can hold, shape, or resist magical stone, metal, and crafted structures as if they were part of your own body.',
      ],
    },
    {
      id: 'shapemake', name: 'Shapemake', axis: 'magic', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Subtly influence how a small effect, tool, mark, structure, or crafted piece manifests, adjusting its shape, edge, angle, texture, or presentation.',
        'Fair Shape — Add +2 to a roll where the final form of an object, mark, tool, structure, or crafted result matters.',
        'Chosen Shape — When creating, repairing, casting, or building, choose one visible quality of its manifestation (smooth, jagged, compact, broad, heavy, sharp, sealed, or reinforced).',
        'Mastermake — Guide the final manifestation of a larger work, spell, structure, item, or crafted effect so it better fits your intended purpose.',
        '[HIDDEN LVL 5+] Deep Shape — Declare one lasting structural trait (enduring, balanced, hidden, fortified, keen, resonant, or load-bearing).',
      ],
    },
    {
      id: 'daratrors_grip', name: "Daratror's Grip", axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Craft or fit a heavy Durinak handle for a blunderbuss. The grip steadies recoil and can be used as a blunt melee weapon.',
        'Stonebite — The grip gains +2 for bracing, aiming, firing under pressure, resisting disarm, controlling recoil, or striking with the handle.',
        'Minuran Brace — Reinforce the grip with stonewood, iron bands, and earth-set joinery. May be fired from a crouch, tunnel mouth, shield line, or unstable stance.',
        "Daratror's Handcannon — Complete the working handheld blunderbuss: compact, stone-braced, stable recoil, functions as both short-range firearm and blunt weapon.",
        "[HIDDEN LVL 5+] Minura-Bound Handcannon — Masterwork blunderbuss bound with Minura metal. May add +2 to one braced shot or blunt strike. Resists cracking, warping, recoil shock, and close-combat damage.",
      ],
    },
    {
      id: 'duneyrr_clock', name: 'Duneyrr Clock', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Assemble a small dwarven clock with a weak wound coil. Can measure time, delay a simple trigger, or mark the passing of a task. Coil wears after 1 hour.',
        'Cogface Dial — The clock gains +2 for timing, synchronized action, delayed mechanisms, shift changes, or guard rotations. Coil lasts 1 day.',
        'Deepgear Coil — Upgrade with sturdier cogs and more reliable coil. Can trigger a latch, bell, spark, lock, or simple device after a set delay. Coil lasts several days.',
        'Duneyrr Cogprophet — Complete a durable clock with one modular feature: alarm chime, delay trigger, lock timer, route bell, pressure tick, or repeating signal.',
        '[HIDDEN LVL 5+] Stonebound Cogprophet — Masterwork clock using Minura metal, earth-set gearing, and a reinforced deepgear coil. Holds two cog features. Adds +2 to one timing or precision roll.',
      ],
    },
  ],

  // ── TEL'ARI (Elf) ──────────────────────────────────────────────────────────
  telari: [
    {
      id: 'harmonic_whistle', name: "Harmonic Whistle", axis: 'magic', boon: '+1 Soul per use',
      tiers: [
        "For 1 hour, add +1 SOUL. Release a soft Tel'ari whistle that brings a creature, object, room, path, or small gathering into calmer magical resonance, reducing discord or spiritual noise.",
        'Gentle Accord — Add +2 to a roll involving calming, persuading, soothing, mediating, bonding, or restoring emotional balance.',
        'Resonant Accord — Create a field of harmony around a small group. Allies within it gain steadier focus and resist fear, panic, or hostile influence more easily.',
        'Concord Weave — Bind the rhythm of a group together until the end of your next encounter. Each ally may use Help one additional time while acting toward the shared purpose.',
        "[HIDDEN LVL 5+] Living Accord — When allies act in harmony toward the same purpose, one failed cooperative roll may be rerolled or softened by the group's shared resonance.",
      ],
    },
    {
      id: 'quyntheras_ballad', name: "Quynthe'ra's Ballad", axis: 'magic', boon: '+1 Essence per use',
      tiers: [
        "For 1 hour, add +1 ESSENCE. Hear a faint Tel'ari note carried through the wind. The sound reveals subtle truths about your surroundings — nearby movement, open space, weather shifts, or unnatural stillness.",
        'Listening Ballad — Add +2 to a roll involving perception, tracking by sound, sensing movement, detecting hidden presence, reading weather, or noticing changes.',
        'Note in the Wind — The ballad becomes clearer, revealing one useful detail about the nearby environment (movement, danger, shelter, water, hollowness, instability, or hidden passage).',
        'Song of the Surrounding — Until the end of your next encounter, the wind carries layered notes back to you. Heightened awareness of direction, distance, movement, and environmental threats.',
        "[HIDDEN LVL 5+] Quynthe'ran Revelation — Once during the effect, ask the DM one direct question about the nearby environment, hidden movement, safe passage, or unseen danger.",
      ],
    },
    {
      id: 'baelnim_root_box', name: "Ba'elnim Root Box", axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        "For 1 hour, add +1 MIND. Build or place a small Tel'ari root-box that releases a prepared growth pattern, causing nearby roots, vines, or living wood to grow instantly into a simple shape (brace, step, handhold, arch, or shelter-rib).",
        'Rootline Frame — Add +2 to rolls involving natural architecture, living supports, root-shaping, tree platforms, forest shelters, bridges, or water-drawing roots.',
        "Ba'elnim Growth Engine — Upgrade the Root Box with a stronger living pattern. Can grow roots into a functional structure (wall, ladder, canopy, walkway, or small water-bearing root basin).",
        "Quynthe'ran Root-Haven — Complete a larger living-root structure that can function as temporary home, refuge, watchpost, or forest chamber through your next encounter or rest.",
        "[HIDDEN LVL 5+] Living Ba'elnim House — Masterwork Tel'ari root dwelling. Can shelter a small party, conceal itself, provide clean water, and add +2 to one rest, defense, concealment, recovery, or planning roll.",
      ],
    },
    {
      id: 'notewood_bow', name: 'Notewood Bow', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        "For 1 hour, add +1 WHIM. Shape a simple Tel'ari bow from treated wood, root-fiber, and prepared vinecord. Without its string, the curved bow-frame may be used as a light blunt weapon.",
        'Stringless Arc — Add +2 to rolls involving bowcraft, careful aim, silent hunting, firing from natural cover, or striking with the unstrung bow-frame.',
        "Remembered Curve — Reinforce the bow's living curve so it holds tension more reliably and can be quickly unstrung or restrung without cracking.",
        "Tel'ari Honourarc — Complete a refined Tel'ari bow. Functions as a quiet bow when strung and a reliable blunt weapon when unstrung through your next encounter.",
        "[HIDDEN LVL 5+] Greatsong Honourarc — Masterwork Tel'ari bow whose frame answers the Song. Once during the encounter, add +2 to one shot or blunt strike made while acting in harmony with terrain, an ally, or a declared purpose.",
      ],
    },
  ],

  // ── OTHROD (Orc) ───────────────────────────────────────────────────────────
  othrod: [
    {
      id: 'scarwake', name: 'Scarwake', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Awaken the memory of an old wound, scar, bruise, or hardship. Your body remembers how to endure pain, pressure, fear, or exhaustion.',
        'Painlesson — Add +2 to a roll involving endurance, intimidation, resisting pain, surviving injury, pushing through exhaustion, or standing after being struck.',
        "Urul's Mark — Your scars flare with Xzur force. Until the end of your next encounter, the first time you are wounded, staggered, or knocked down, you may immediately steady yourself or press forward.",
        "Path of Scars — Your visible wounds and scars become a source of force. Until the end of your next encounter, allies who can see you may resist fear, panic, or retreat more easily while you remain standing.",
        "[HIDDEN LVL 5+] Scarred Unbroken — Once during an encounter, when you would fall, break, flee, or fail from pain, you may remain standing long enough to complete one decisive action.",
      ],
    },
    {
      id: 'bloodroar', name: 'Bloodroar', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Release a low Othrod war-sound from the chest, calling anger, grief, memory, and survival into one brutal focus.',
        "Clan Cry — Add +2 to a roll involving rallying allies, frightening enemies, beginning a charge, resisting despair, or asserting dominance.",
        "Maakurg's Heart — Your roar carries fierce protection. One ally who can hear you gains steadier resolve against fear, charm, intimidation, or retreat.",
        "Scarred Warband — Until the end of your next encounter, allies who join your charge or stand with you against a shared enemy gain +1 to rolls that keep formation, resist fear, or press the attack.",
        "[HIDDEN LVL 5+] Ancestor Roar — Once during the effect, when your group suffers a loss, wound, or setback, your roar may turn it into momentum. One failed allied roll tied to survival, revenge, protection, or advance may be rerolled or softened.",
      ],
    },
    {
      id: 'warline_marks', name: 'Warline Marks', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Paint Othrod battle-marks across stone, hide, dirt, shields, or weapons to show a simple plan: charge, hold, flank, retreat, ambush, or protect.',
        'Scar-Map — Add +2 to one roll involving battlefield planning, marking enemy movement, setting an ambush, reading a skirmish route, or keeping allies oriented in chaos.',
        'Broken Ground Plan — Prepare a rough tactical layout using scars, stones, bones, arrows, or bloodmarks. Allies who understand it may follow one planned movement, attack, fallback, or defense more easily.',
        'Clan Strategum — Build a complete Othrod battle plan for the next encounter, assigning roles (breaker, shield, runner, bait, watcher, or finisher).',
        "[HIDDEN LVL 5+] Bloodfield Doctrine — Create a brutal but effective war-plan from the scars of the battlefield. Once during the encounter, when the party's formation breaks, you may redirect the group into a new shared tactic without losing momentum.",
      ],
    },
    {
      id: 'gorestandard', name: 'Gorestandard', axis: 'tech', boon: '+1 Spirit per use',
      tiers: [
        'For 1 hour, add +1 SPIRIT. Lash together a crude Othrod field-standard from hide, bone, weapon scraps, cloth, or enemy trophies. While raised, it marks where the group stands, gathers, or charges.',
        'Rally Hide — Add +2 to a roll involving rallying allies, holding ground, intimidating enemies, marking territory, claiming a battlefield position, or preventing confusion.',
        'Iron-Tusk Banner — Reinforce the standard with hooks, stakes, and weapon-braces so it can be planted into earth, wood, stone cracks, or broken shields and remain standing through violence.',
        'Scarclan Standard — Complete a hardened Othrod war-standard for the next encounter. Allies near it may regroup, hold formation, or recover morale more easily.',
        "[HIDDEN LVL 5+] Urul's War-Standard — Raise a sacred scar-standard marked with the memory of pain and survival. Once during the encounter, while the standard is upright, the party gains +2 to one group roll involving courage, defense, intimidation, or a renewed charge.",
      ],
    },
  ],

  // ── TERRAXIAN (Giant/Nephilim) ─────────────────────────────────────────────
  terraxian: [
    {
      id: 'banebrand', name: 'Banebrand', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Mark one visible enemy, obstacle, beast, gate, barrier, rival, or burden as your bane. The boon applies only to rolls that directly oppose, withstand, track, challenge, break, or overcome the branded bane.',
        'Bitter Brand — Add +2 to one roll involving resisting, pursuing, striking, intimidating, breaking through, or standing against your branded bane.',
        "Named Bane — Once during your next encounter or scene, when acting directly against your branded bane, you may declare one visible weakness, habit, exposed point, fear, flaw, or burden the DM confirms as reasonable.",
        "Giant's Grudge — Until the end of your next encounter, your presence presses against the branded bane. The first time it tries to flee, hide, intimidate, resist, or force past you, you may add +2 to one opposed roll.",
        "[HIDDEN LVL 5+] Terraxian Doombrand — Once during a decisive battle, hunt, siege, duel, or confrontation, brand one major foe or obstacle as your true bane. Until the scene ends, one ally may also gain +1 to one roll that directly helps bring that bane down.",
      ],
    },
    {
      id: 'cragknuckles', name: 'Cragknuckles', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Harden your knuckles, fists, elbows, or forearms with rough Terraxian crag-force. Applies to striking, bracing, shoving, breaking, lifting, climbing, anchoring, or forcing a heavy object to move.',
        'Stonebreaker Grip — Add +2 to one roll involving breaking stone, gripping a ledge, shoving a creature, holding a gate, smashing an obstacle, or bracing against force.',
        'Burdened Blow — Once during your next encounter or scene, when you strike, shove, pin, or break something with your hands or body, you may make the impact carry unnatural weight.',
        'Mountainhand — Until the end of your next encounter, your arms and fists carry the pressure of stone. You gain advantage against being moved, disarmed, knocked aside, or forced away from something you are holding.',
        "[HIDDEN LVL 5+] Worldcrag Knuckles — Once during a battle, siege, escape, hunt, collapse, or disaster, add +2 to one roll to stop, hold, topple, pin, anchor, or break a major creature, structure, vehicle, gate, or obstacle.",
      ],
    },
    {
      id: 'landmark_chart', name: 'Landmark Chart', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Sketch a rough Terraxian route-chart using mountains, towers, ruins, rivers, stars, roads, smoke columns, bones, or other large visible markers. Applies to navigation, remembering terrain, choosing routes, or finding the way back.',
        'Highmark Draft — Add +2 to one roll involving mapping landmarks, judging distance, finding a route, avoiding getting lost, reading terrain, or guiding others by visible markers.',
        "Giant's Route Slate — Prepare a durable travel-slate marked with major landmarks, dangers, water points, high ground, campsites, and return paths. Can guide a small group through one journey or dangerous crossing.",
        'Terraxian Waychart — Complete a large-scale chart of an explored region. Until the end of the next journey or mission, allies using the chart navigate, regroup, or retrace their path more easily.',
        "[HIDDEN LVL 5+] Titanmark Atlas — Create a masterwork atlas-page of one dangerous region or hostile territory. Once during the journey, add +2 to one group roll involving navigation, ambush avoidance, route planning, retreat, or reaching a chosen landmark.",
      ],
    },
    {
      id: 'giantstep_map', name: 'Giantstep Map', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Mark a path by stride, reach, slope, handhold, stone, tree, ledge, gate, or broken ground, judging how large bodies and heavy loads can move through it. Applies to marching, climbing, hauling, or crossing rough terrain.',
        'Stride Measure — Add +2 to one roll involving measuring distance by steps, finding a passable route for a large creature, hauling loads, or crossing broken ground.',
        'Burden Route Plan — Prepare a route plan for moving people, beasts, carts, siege parts, heavy gear, or large bodies through difficult ground.',
        'Colossus Trailmap — Complete a practical Terraxian movement-map for one journey, battlefield, ruin, or siege route. Allies can move heavy loads, avoid dead ends, and choose terrain suited to their size.',
        "[HIDDEN LVL 5+] Worldshoulder March-Map — Create a masterwork giant-scale route map. Once during the journey, the party gains +2 to one group roll involving travel, hauling, evacuation, forced march, or crossing dangerous terrain.",
      ],
    },
  ],

  // ── FYNLOR (Halfling) ──────────────────────────────────────────────────────
  fynlor: [
    {
      id: 'fortunefinger', name: 'Fortunefinger', axis: 'magic', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Touch a die, card, coin, game piece, lock-pin, or small token before a game of chance, wager, contest, or risky trick. Applies to luck, gambling, sleight, wagers, games, or chance-based contests.',
        'Lucky Touch — Add +2 to one roll involving a game, wager, contest of chance, sleight-of-hand trick, or lucky guess.',
        'Fightluck — Once during your next encounter, when you or an ally makes a risky attack, dodge, escape, or trick maneuver, you may bend the luck and add +2 to the roll.',
        'Deciding Turn — Once during an encounter, when a single roll could clearly change the direction of the scene, you may invoke Fortunefinger before the result is declared and add +2 to that roll.',
        "[HIDDEN LVL 5+] Party Fortune — Once during a decisive moment, each participating ally gains +1 to one roll that directly advances the shared outcome before the end of the scene.",
      ],
    },
    {
      id: 'pocketwit', name: 'Pocketwit', axis: 'magic', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Focus on one visible creature within speaking distance and make a subtle read of what they carry (coins, keys, papers, tools, food, weapon, trinket, or nothing useful).',
        'Pocket Guess — Add +2 to one roll involving guessing, noticing, locating, or identifying a small carried object on a visible creature.',
        'Deep Pocket — Learn one more specific detail about a small carried object (iron key, sealed note, silver coins, loaded pistol, lockpick set, etc.) as long as the object is not magically concealed.',
        "Thief's Inventory — Until the end of your next encounter or scene, you may read the likely contents of up to three visible creatures' accessible pockets or pouches.",
        "[HIDDEN LVL 5+] Fynlor's Find — Once during a heist, negotiation, pursuit, battle, or escape, you may ask the DM which visible creature nearby carries the most useful small object for your current objective.",
      ],
    },
    {
      id: 'softstep_kit', name: 'Softstep Kit', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Fit yourself with quiet wraps, padded soles, muffling straps, cloth catches, and small balance weights that soften your movement. Applies to sneaking, climbing quietly, moving through tight spaces, or crossing unstable ground.',
        'Hushsole Pattern — Add +2 to one roll involving stealthy movement, silent climbing, careful footing, hiding the sound of gear, or crossing noisy terrain.',
        'Ally-Step Fitting — Prepare a second Softstep Kit for one willing ally. Until the end of your next encounter or scene, that ally may move quietly and reduce gear noise.',
        "Prowler's Company Kit — Prepare Softstep fittings for up to three allies or one larger creature (mount, pack animal, beast companion, or small cart-puller).",
        "[HIDDEN LVL 5+] Fynlor Ghostwalk Rig — Prepare a masterwork movement kit for the party before a heist, ambush, escape, or infiltration. Each fitted ally gains +1 to one roll involving stealthy movement or avoiding detection.",
      ],
    },
    {
      id: 'quickpick', name: 'Quickpick', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Assemble or ready a small Fynlor picking tool from wire, bent metal, bone sliver, thorn, pin, or hidden spring. Applies to locks, latches, clasps, shackles, trap catches, or simple mechanical releases.',
        'Nimble Pin — Add +2 to one roll involving picking a lock, opening a latch, disabling a small catch, escaping a shackle, or finding the working point of a simple mechanism.',
        'Whisperpick Set — Upgrade the tool into a quiet folding pick-set that reduces noise, scratching, and obvious tool marks. Works on finer locks, trapped clasps, desk drawers, lockboxes, and concealed compartments.',
        "Burglar's Turnkey — Complete a refined Fynlor burglary tool that can open, loosen, bypass, or safely test one lock, latch, clasp, or simple trap mechanism during your next encounter or scene.",
        "[HIDDEN LVL 5+] Laughing Keyring — Create a masterwork Fynlor keyring of picks, hooks, and tension wires. Once during a heist, escape, pursuit, or guarded infiltration, add +2 to one roll to open or bypass a lock, restraint, latch, or trap catch without breaking it.",
      ],
    },
  ],

  // ── TRINK (Gnome) ──────────────────────────────────────────────────────────
  trink: [
    {
      id: 'lurkshade', name: 'Lurkshade', axis: 'magic', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Draw a thin veil of gnomish shade around yourself while hiding, crouching, peeking, waiting, or slipping through cluttered spaces. Applies to hiding, staying unnoticed, vanishing into cover, or moving through cramped spaces.',
        'Cornerfade — Add +2 to one roll involving hiding behind cover, slipping out of sight, remaining still, or using clutter, furniture, machinery, or shadows to conceal yourself.',
        'Skulkspark — Once during your next encounter or scene, when a creature would notice you, you may cause a small distracting flicker, creak, tap, glimmer, or false movement nearby, giving yourself a chance to remain hidden or reposition.',
        "Lurker's Bend — Until the end of your next encounter or scene, you may treat cramped spaces, cluttered rooms, machinery, roots, shelves, wagons, or workshop debris as useful cover.",
        "[HIDDEN LVL 5+] Trink Vanishing Trick — Once during an encounter, escape, infiltration, or pursuit, when you or one nearby ally would be spotted, you may bend attention away. The target gains +2 to one roll to hide, slip away, or break pursuit.",
      ],
    },
    {
      id: 'nooksense', name: 'Nooksense', axis: 'magic', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Study a room, machine, alley, workshop, burrow, ruin, shelf, wagon, or cluttered area to sense useful small spaces, crawl gaps, loose panels, hidden corners, vents, floor gaps, or overlooked openings.',
        'Gapwise — Add +2 to one roll involving finding a crawlspace, hiding nook, loose panel, maintenance hatch, vent, burrow-hole, service gap, or overlooked route.',
        'Crawlpath — Choose one nearby room, structure, machine, alley, ruin, or natural space. You may learn one useful small route or hiding place, if one reasonably exists.',
        'Nookmap — Until the end of your next encounter or scene, you may identify up to three useful hiding places, crawl routes, vents, ledges, loose panels, or escape gaps.',
        "[HIDDEN LVL 5+] Old Gnome's Passage — Once during a heist, escape, pursuit, dungeon crawl, or guarded infiltration, you may ask the DM where the most useful small passage or hidden nook nearby is.",
      ],
    },
    {
      id: 'tinkertrink_kit', name: 'Tinkertrink Kit', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Assemble a small gnomish bundle of wire, wax, pins, screws, thread, resin, clamps, gears, buttons, and scrap trinkets. Applies to quick repairs, field fixes, stabilizing broken tools, patching mechanisms, or making damaged devices work briefly.',
        'Clever Patch — Add +2 to one roll involving repairing, stabilizing, adjusting, reinforcing, or temporarily restoring a small tool, device, latch, wheel, hinge, spring, lock, lantern, trigger, or mechanism.',
        'Jury-Rig Frame — Patch a damaged device, tool, weapon part, trap piece, hinge, wheel, or small machine so it functions until the end of your next encounter or scene.',
        "Trink Field-Fix Box — Complete a compact gnomish repair box that can restore function to one broken or failing mundane device during your next encounter, journey, or mission.",
        "[HIDDEN LVL 5+] Masterpatch Wonderbox — Create a masterwork repair kit. Once during a mission, add +2 to one roll to restore, stabilize, modify, or keep working a damaged mechanism, tool, vehicle part, trap, weapon device, or small machine.",
      ],
    },
    {
      id: 'gadgetfly', name: 'Gadgetfly', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Build or release a tiny winged gadget made from wire, paper-thin fins, beetle-shell casing, a wound spring, or scrap clockwork. Can flutter a short distance, tap, click, carry a tiny thread, test a surface, or distract a nearby creature.',
        'Clickwing Pattern — Add +2 to one roll involving testing a floor, distracting a guard, carrying a thread or pin, checking a gap, tapping a signal, or sending the gadget into a place too small for your hand.',
        'Flutterwork Fly — Upgrade the gadget with better wings, a quieter spring, and a simple return twitch. Can flutter through a narrow gap, carry a tiny object, make a timed sound, or report contact with heat, movement, water, or pressure.',
        'Trink Flutterfly — Build a sturdier gnomish gadgetfly that can perform one prepared task: distract, fetch, tug, tap, test, mark, wedge, trigger, or flutter.',
        "[HIDDEN LVL 5+] Grandfather Gadgetfly — Create a masterwork gadgetfly with a refined spring-core. Once during a heist, escape, infiltration, or trap scene, it may complete one linked task of up to three simple actions.",
      ],
    },
  ],

  // ── PA'MORPH MAJOR BLOODLINE ───────────────────────────────────────────────
  pamorph_major: [
    {
      id: 'wildroar', name: 'Wildroar', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        "For 1 hour, add +1 WILL. Release a bestial roar, howl, bellow, shriek, or territorial cry that stirs primal force. Applies to charging, pursuing, resisting fear, intimidating, defending territory, or acting with raw beast-instinct.",
        'Berserk Cry — Add +2 to one roll involving a creature entering a violent charge, resisting fear, breaking restraint, protecting its territory, or overwhelming prey through force.',
        'Borrowed Beast — Once during your next encounter or scene, choose one willing creature you can see. That creature may gain the benefit of another nearby willing creature\'s active boon for one roll.',
        "Pack-Berserk — Until the end of your next encounter or scene, when one willing creature acts in a shared hunt, charge, defense, or escape, you may let it draw on the active boon of another willing creature in the same pack.",
        "[HIDDEN LVL 5+] Primal Booncall — Once during a decisive hunt, battle, escape, or territorial challenge, release a sovereign Wildroar. Choose one willing creature in the party. For one decisive roll, it may gain the active boon of any other willing creature present.",
      ],
    },
    {
      id: 'stir_call', name: 'Stir Call', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        "For 1 hour, add +1 WILL. Release a bestial roar, howl, bellow, shriek, or territorial cry that stirs primal force in yourself or one nearby willing creature. Applies to charging, pursuing, resisting fear, intimidating, defending territory, or acting with raw beast-instinct.",
        'Berserk Cry — Add +2 to one roll involving a creature entering a violent charge, resisting fear, breaking restraint, protecting its territory, or overwhelming prey through force.',
        'Borrowed Beast — Once during your next encounter or scene, choose one willing creature you can see. That creature may gain the benefit of another nearby willing creature\'s active boon for one roll.',
        "Pack-Berserk — Until the end of your next encounter or scene, when one willing creature acts in a shared hunt, charge, defense, or escape, you may let it draw on the active boon of another willing creature in the same pack.",
        "[HIDDEN LVL 5+] Primal Booncall — Once during a decisive hunt, battle, escape, or territorial challenge, release a sovereign Stir Call. Choose one willing creature in the party. For one decisive roll, it may gain the active boon of any other willing creature present.",
      ],
    },
    {
      id: 'harnesscraft', name: 'Harnesscraft', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Fit a simple beast-harness, strap, grip, sling, saddle-strap, lead, pack-frame, or drag-line for yourself, an ally, mount, or trained beast. Applies to riding, carrying, pulling, guiding, restraining, or working with a harnessed creature.',
        'Surestrap Pattern — Add +2 to one roll involving securing a harness, riding through rough ground, keeping a beast steady, hauling a load, preventing a fall, or controlling a mount under pressure.',
        'Trail-Harness Frame — Prepare a stronger harness for one creature or heavy burden. Until the end of your next journey, it helps with riding, hauling, carrying gear, dragging wounded allies, or guiding a beast through difficult terrain.',
        "Packbeast Rig — Complete a reliable Pa'morph harness system for one mount, beast companion, pack animal, or large ally. Supports travel, burden, restraint, rescue, or battlefield movement.",
        "[HIDDEN LVL 5+] Wildbond Harness — Create a masterwork harness fitted to a specific beast, mount, or large ally. Once during a hunt, chase, battle, rescue, or wilderness crossing, add +2 to one roll involving riding, hauling, leaping, rescuing, restraining, or moving together as one body.",
      ],
    },
    {
      id: 'trapcraft', name: 'Trapcraft', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Build, hide, notice, or ready a simple hunting trap, snare, tripline, deadfall marker, bait-cord, noise-maker, pit warning, or restraint loop. Applies to setting traps, spotting traps, baiting prey, preparing ambushes, restraining creatures, or avoiding hunter\'s tricks.',
        'Snarewise Pattern — Add +2 to one roll involving setting a snare, hiding a trap, detecting a trap, baiting prey, marking a safe path, or disabling a simple hunting mechanism.',
        'Toothline Snare — Prepare a more reliable field trap. It may restrain, delay, alarm, mark, or redirect one creature during the next encounter or scene.',
        "Hunter's Killfield — Prepare a small trap-field before a hunt, ambush, defense, or guarded rest. Choose one purpose: slow pursuers, catch small prey, warn the camp, block a route, reveal movement, or create an opening for attack.",
        "[HIDDEN LVL 5+] Primeval Trapline — Create a masterwork Pa'morph trapline before a hunt, pursuit, ambush, or territorial defense. Once during the scene, add +2 to one roll involving catching, delaying, revealing, redirecting, or escaping a creature that enters the prepared ground.",
      ],
    },
  ],

  // ── PA'MORPH MINOR BLOODLINE ───────────────────────────────────────────────
  pamorph_minor: [
    {
      id: 'warharness_rig', name: 'Warharness Rig', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Fit or adjust a sturdy harness, battle-strap, saddle-brace, grip-line, drag-loop, tusk-chain, climbing hold, or load-frame suited to a major Pa\'morph bloodline or large beast. Applies to riding, hauling, charging, restraining, carrying, bracing, pulling, or fighting alongside a large creature.',
        "Bloodline Fit — Add +2 to one roll involving fitting a harness to a major bloodline body shape (wings, horns, claws, jaws, shoulders, hooves, paws, tusks, heavy hide, or long tail).",
        "Beast-Brace Frame — Prepare a reinforced harness for one major bloodline Pa'morph, mount, beast companion, or large ally. Until the end of the next encounter or journey.",
        "Major Bloodline Rig — Complete a reliable warharness system built for one major beast-form or large ally. Choose one prepared purpose: charge, haul, mount, rescue, restrain, guard, climb, or carry.",
        "[HIDDEN LVL 5+] Apex Harnesscraft — Create a masterwork harness fitted to a specific major bloodline or large creature. Once during a hunt, chase, battle, rescue, siege, or wilderness crossing, add +2 to one roll involving moving, holding, carrying, riding, restraining, or striking as one coordinated body.",
      ],
    },
    {
      id: 'littletrap_kit', name: 'Littletrap Kit', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        "For 1 hour, add +1 MIND. Prepare a small Pa'morph trap kit using cord, thorn, bone hooks, scent bait, feather tags, shell chips, mud marks, reed loops, warning bells, or hidden knots suited to minor bloodline instincts.",
        "Smallsnare Pattern — Add +2 to one roll involving hiding a small trap, detecting a hunter's trick, making a quiet alarm, marking a safe path, baiting small prey, or using minor bloodline instincts to prepare an ambush.",
        "Lesser Trapline — Prepare a small trapline suited to one minor bloodline method (hare-run, rat-path, owl-watch, snake-coil, otter-slide, frog-gap, badger-dig, monkey-line, or tortoise-block). May warn, delay, reveal, distract, or redirect one creature.",
        "Minor Bloodline Snarefield — Prepare a compact trap-field before a hunt, infiltration, escape, guarded rest, or territorial defense. Choose one purpose: reveal movement, slow pursuit, hide a route, alarm the camp, or create an opening.",
        "[HIDDEN LVL 5+] Secret Den Trapcraft — Create a masterwork minor-bloodline trapline before a hunt, pursuit, ambush, or guarded approach. Once during the scene, add +2 to one roll involving catching, delaying, hiding from, revealing, redirecting, or escaping a creature that enters the prepared ground.",
      ],
    },
  ],

  // ── DJINN (Genie) ──────────────────────────────────────────────────────────
  djinn: [
    {
      id: 'wishflit', name: 'Wishflit', axis: 'magic', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Speak a small desire aloud and shape a flicker of Djinn wish-magicka around it. Applies to persuasion, bargaining, improvisation, tempting fate, asking for favors, or pursuing a clearly stated desire.',
        'Lesser Wish — Add +2 to one roll involving a small favor, bargain, request, lucky opening, social temptation, or improvised solution.',
        'Bent Wish — Once during your next encounter or scene, when a spoken wish, want, or bargain would influence the moment, you may twist circumstance slightly toward that desire. The effect must be plausible, limited, and DM-approved.',
        'Wish-Turn — Until the end of your next encounter or scene, one stated desire gains magical weight. Once during the scene, add +2 to one roll that directly advances that desire.',
        "[HIDDEN LVL 5+] Emberwish — Once during a decisive bargain, escape, battle, trial, or impossible moment, speak one carefully bounded wish. The DM grants a limited, costly, or twisted version that follows the wording without breaking the scene.",
      ],
    },
    {
      id: 'intendbend', name: 'Intendbend', axis: 'magic', boon: '+1 Soul per use',
      tiers: [
        'For 1 hour, add +1 SOUL. Read the shape of a creature\'s intent through tone, hesitation, longing, envy, fear, hunger, or desire. Applies to reading motives, sensing temptation, negotiating, offering bargains, or understanding what someone truly wants.',
        'Want-Sense — Add +2 to one roll involving reading intent, detecting temptation, judging a bargain, identifying leverage, or understanding what a creature hopes to gain.',
        'Named Want — Choose one visible creature in conversation. You may learn one broad desire it is acting from (safety, wealth, revenge, escape, pride, hunger, love, power, secrecy, or recognition).',
        "Bargainer's Insight — Until the end of your next encounter or scene, you may read the strongest visible desire in a negotiation, contest, interrogation, or bargain. Once during the scene, add +2 to one roll that uses that desire as leverage.",
        "[HIDDEN LVL 5+] Heart's Clause — Once during a major bargain, trial, negotiation, temptation, or pact-making scene, ask the DM what one creature truly wants from the outcome.",
      ],
    },
    {
      id: 'contract_pen', name: 'Contract Pen', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Prepare a Djinn contract pen, ink-mark, wax seal, thread-knot, stamped token, signed scrap, or spoken witness-clause. Applies to contracts, promises, bargains, written terms, witnessed agreements, or remembering exact wording.',
        'Binding Clause — Add +2 to one roll involving drafting terms, noticing vague wording, enforcing a promise, identifying a hidden obligation, or making a bargain harder to deny.',
        'Witnessed Seal — Prepare a contract mark that records one clear agreement between willing parties. Until the end of the scene, those parties have a harder time denying the exact terms they knowingly accepted.',
        "Djinn Bargain Writ — Complete a formal bargain-writ with names, terms, limits, costs, and consequences. Governs one deal, favor, trade, oath, service, or exchange through the next mission or scene.",
        "[HIDDEN LVL 5+] Grand Covenant Pen — Create a masterwork Djinn contract pen. Once during a major bargain, pact, trial, or negotiation, add +2 to one roll involving enforcing, interpreting, resisting, or exposing the terms of a binding agreement.",
      ],
    },
    {
      id: 'pact_loophole_script', name: 'Pact Loophole Script', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Draft, hide, read, or exploit a small loophole in a pact, bargain, rule, contract, order, wager, or promise. Applies to clever wording, technical exceptions, avoiding penalties, escaping obligations, or turning terms to your advantage.',
        'Fine Print — Add +2 to one roll involving finding a loophole, spotting a trap in wording, escaping a technical obligation, twisting a rule, or protecting yourself from a bad bargain.',
        'Escape Clause — Prepare a written or spoken clause that gives one limited way out of an agreement, order, wager, pact, or obligation if a stated condition occurs.',
        "Trickster's Addendum — Complete a hidden or carefully worded addendum to one bargain, contract, oath, deal, pact, or formal challenge. If accepted, gives you one narrow advantage tied to the wording.",
        "[HIDDEN LVL 5+] Sovereign Loophole — Once during a major bargain, trial, pact, curse, contract, or binding command, reveal a masterful loophole. Add +2 to one roll to escape, reinterpret, soften, redirect, or survive the consequence of a binding term.",
      ],
    },
  ],

  // ── HELIANTH (Tiefling) ────────────────────────────────────────────────────
  helianth: [
    {
      id: 'ghauntlet', name: 'Ghauntlet', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Choose your right or left hand. That hand becomes visibly enlarged, hellish, sulfur-veined, and heavier than normal. Applies to striking, gripping, breaking, intimidation, resisting heat, enduring pain, or forcing your way through an obstacle.',
        'Hellhand — Add +2 to one roll involving punching, gripping, crushing, intimidating, resisting flame, breaking a barrier, or holding something in place with your hellish hand.',
        'Molten Hand — Twice per long rest, activate the Ghauntlet and make the chosen hand completely molten until the end of your next action. Can burn, brand, punch through weaker metal, soften bindings, or leave a searing mark.',
        'Lavafist — Until the end of your next encounter or scene, your Ghauntlet grows hotter, heavier, and more weaponlike. Once during the scene, add +2 to one roll involving smashing armor, breaking metal, striking a hardened foe, resisting fire, or forcing through a barred path.',
        "[HIDDEN LVL 5+] Lava Weapon Manifest — Once during a decisive battle, duel, breach, execution, infernal trial, or siege, summon a weapon of your choice from a steady stream of lava flowing out of the Ghauntlet. Lasts until the end of the scene. Add +2 to one striking, cleaving, burning, breaking armor, or intimidation roll.",
      ],
    },
    {
      id: 'stygian_fetch_coin', name: 'Stygian Fetch Coin', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Carry or flip a blackened sulfur coin marked with a hellish fetch-sign. Applies to intimidation, pursuit, sensing danger, tracking prey, resisting fear, calling infernal instinct, or bargaining with a summoned presence.',
        'Fetch Omen — Add +2 to one roll involving hunting, tracking, frightening prey, detecting a threat, resisting panic, reading danger, or judging whether violence is near.',
        "Hellhound Consult — Twice per long rest, consult a hellish hound for a single attack. The hound's presence guides the strike, reveals an opening, or warns of a counter.",
        "Stygian Hunt-Bond — Until the end of your next encounter or scene, the fetch-omen lingers near you. Once during the scene, add +2 to one roll involving pursuit, attack timing, intimidation, guarding an ally, or striking a marked foe.",
        "[HIDDEN LVL 5+] Infernal Fetch Familiar — The coin becomes a pact-token for a hellish familiar of the player's choice (hound, raven, serpent, imp, coal-cat, ash-rat, or horned fetch). Once during a decisive battle, pursuit, bargain, escape, or infernal trial, the familiar may aid one roll.",
      ],
    },
    {
      id: 'oni_card_deck', name: 'Oni Card Deck', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Prepare a marked deck of oni-faced cards, sulfur-stained slips, ash-paper omens, or infernal suit-signs. Applies to gambling, deception, intimidation, reading risk, distracting enemies, tempting fate, or forcing a choice.',
        "Devil's Draw — Add +2 to one roll involving a wager, bluff, threat, distraction, card trick, omen reading, or forcing an opponent to hesitate over a choice.",
        'Loaded Omen Deck — Mark the deck with hidden burns, scent cues, bent corners, or sulfur-inked faces. Until the end of your next encounter or scene, it may be used once to distract, signal, threaten, misdirect, or make a bargain feel cursed.',
        'Oni Fatehand — Complete a refined infernal card deck. During your next encounter or scene, draw one card to frame a risky action and add +1 to one roll that follows the omen.',
        "[HIDDEN LVL 5+] Hellgame Deck — Create a masterwork Oni Card Deck. Once during a bargain, duel, gamble, trial, ambush, or social confrontation, draw a card and add +2 to one roll involving deception, intimidation, risk, luck, temptation, or turning an enemy's choice against them.",
      ],
    },
    {
      id: 'pepperbox', name: 'Pepperbox', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Assemble, load, or ready a compact multi-chamber Helianth firearm, flash-tube, or combustion pistol using sulfur charge, rotating barrels, striker caps, and vented grips. Applies to loading, aiming, firing, clearing smoke, controlling recoil, maintaining a firearm, or handling combustion weapons.',
        'Rotating Chamber — Add +2 to one roll involving readying a chamber, clearing a jam, controlling recoil, firing under pressure, keeping powder dry, or timing a close-range shot.',
        'Brimcap Revolver Frame — Upgrade the Pepperbox with a stronger rotating chamber, safer sulfur caps, and vented recoil grooves. Until the end of your next encounter or scene, may be fired or readied once with reduced risk of smoke, misfire, or recoil loss.',
        'Helianth Pepperbox — Complete a refined combustion sidearm built for close-range land fighting. May support one prepared shot, intimidation draw, smoke-flash, warning fire, or emergency defense action.',
        "[HIDDEN LVL 5+] Infernal Volley Pepperbox — Create a masterwork Helianth Pepperbox with sulfur-fed chambers and reinforced infernal vents. Once during a battle, chase, duel, breach, or escape, add +2 to one roll involving a close-range shot, rapid draw, smoke distraction, controlled volley, or firing through pressure.",
      ],
    },
  ],

  // ── SERAPHAN (Aasimar) ─────────────────────────────────────────────────────
  seraphan: [
    {
      id: 'petition_hymn', name: 'Petition Hymn', axis: 'magic', boon: '+1 Spirit per use',
      tiers: [
        'For 1 hour, add +1 SPIRIT. Sing, whisper, recite, or internally carry a short hymn directed toward a god of your choosing. Applies to prayer, divine insight, moral judgment, resisting corruption, interpreting omens, or acting in service of the chosen god\'s nature.',
        'Lesser Petition — Add +2 to one roll involving prayer, divine appeal, sacred negotiation, resisting temptation, reading an omen, or asking for guidance from a god, shrine, relic, or holy presence.',
        'Answered Sign — Once during your next encounter or scene, you may ask your chosen god for a limited answer. The DM may answer through a sign, instinct, phrase, dream-flash, environmental omen, or holy discomfort.',
        'Divine Intercession — Until the end of your next encounter or scene, your hymn carries enough force to request a small favor from your chosen god. If the request fits the god\'s nature, add +2 to one roll tied directly to that favor.',
        "[HIDDEN LVL 5+] Greater Petition Hymn — Once during a decisive battle, trial, sacrifice, holy crisis, deathbed moment, corruption event, or campaign-defining choice, you may ask your chosen god for a larger favor. If granted, add +2 to one decisive roll directly tied to the divine favor.",
      ],
    },
    {
      id: 'sanctify', name: 'Sanctify', axis: 'magic', boon: '+1 Soul per use',
      tiers: [
        'For 1 hour, add +1 SOUL. Lay a brief holy charge over a creature, object, doorway, wound, weapon, relic, resting place, or patch of ground. Applies to blessing, cleansing, protection, resisting corruption, calming sacred fear, or acting against profane influence.',
        'Lesser Blessing — Add +2 to one roll involving blessing an ally, cleansing a minor taint, protecting a threshold, resisting undead or fiendish influence, steadying a wounded creature, or handling a sacred object.',
        'Hallowed Mark — Once during your next encounter or scene, sanctify one small object, weapon, wound, door, corpse, token, or patch of ground. Until the end of the scene, it may resist corruption, mark sacred intent, or make profane forces hesitate.',
        'Consecrated Presence — Until the end of your next encounter or scene, your sanctified mark radiates a quiet holy pressure. Once during the scene, add +2 to one roll involving protection, cleansing, resisting corruption, defending the innocent, or opposing a profane force.',
        "[HIDDEN LVL 5+] High Sanctification — Once during a decisive battle, exorcism, burial, holy trial, corruption event, or defense of sacred ground, sanctify a creature, object, threshold, weapon, or area. Add +2 to one decisive roll involving protection, purification, warding, mercy, or resisting profane power.",
      ],
    },
    {
      id: 'clergy_pendant', name: 'Clergy Pendant', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Prepare a pendant, prayer-token, reliquary clasp, hymn-bead, seal-chain, or small holy badge. Applies to religious rites, clergy recognition, sacred law, temple procedure, vow-keeping, or recalling doctrine.',
        'Votive Mark — Add +2 to one roll involving identifying clergy, reading temple rank, recalling a rite, presenting holy authority, recording a vow, or gaining trust in a sacred place.',
        'Reliquary Pendant — Upgrade the pendant with a small hidden chamber, prayer-mark, relic shaving, vow thread, or temple seal. Until the end of your next encounter or scene, serves as proof of office, a prayer focus, a vow-token, or a sign of safe passage among the faithful.',
        'Seraphan Vow-Pendant — Complete a refined clergy pendant bound to a specific vow, temple, deity, rite, or holy office. May support one act of recognition, prayer, protection, negotiation, testimony, or sacred duty.',
        "[HIDDEN LVL 5+] High Reliquary Pendant — Create a masterwork clergy pendant carrying a relic-sign, oath-thread, and harmonic prayer mark. Once during a trial, exorcism, pilgrimage, holy negotiation, temple crisis, or divine petition, add +2 to one roll involving sacred authority, vow enforcement, divine appeal, protection, or clergy recognition.",
      ],
    },
    {
      id: 'sacrilege_detector', name: 'Sacrilege Detector', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Prepare a small harmonic detector made from hymn-wire, glass chime, sanctus dust, prayer-needle, relic filings, or tuned brass that reacts to profane disturbance. Applies to detecting desecration, false relics, corrupted shrines, broken vows, hidden profane marks, or disturbed sacred ground.',
        'Profane Chime — Add +2 to one roll involving noticing desecration, sensing corrupted objects, identifying false holiness, reading a broken rite, finding a hidden profane mark, or detecting disturbed sacred space.',
        'Hymn-Tuned Sensor — Upgrade the detector with a tuned chime, prayer-needle, or sanctus filament. Until the end of your next encounter or scene, it may react once to nearby sacrilege, corruption, cursed relics, profane residue, or a broken sacred boundary.',
        'Seraphan Sacrilege Gauge — Complete a refined detector that can test shrines, relics, vows, altars, graves, temple doors, holy weapons, or ritual sites. May reveal whether one sacred thing has been corrupted, falsified, disturbed, or profaned.',
        "[HIDDEN LVL 5+] Archon Harmonic Detector — Create a masterwork sacrilege detector tuned to divine harmonics. Once during an exorcism, temple crisis, relic hunt, holy trial, corruption event, or investigation, add +2 to one roll involving finding, proving, resisting, or exposing sacrilege or desecration.",
      ],
    },
  ],

  // ── CHRONISON (Construct) ──────────────────────────────────────────────────
  chronison: [
    {
      id: 'pulse', name: 'Pulse', axis: 'magic', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Open a small mechanism in the palm of your hand and release a brief disruptive pulse. Applies to timing, disruption, reaction, interrupting motion, disturbing a mechanism, or acting at the exact right moment.',
        'Palm Discharge — Add +2 to one roll involving interrupting a creature\'s movement, jarring a mechanism, disrupting balance, breaking timing, or creating a brief opening.',
        'Pulsebreak — Once during your next encounter or scene, release a stronger palm-pulse that may briefly stagger, misalign, interrupt, or disrupt one nearby creature, object, mechanism, or attack pattern.',
        'Harmonic Disruption — Until the end of your next encounter or scene, your palm mechanism carries a dangerous repeating charge. Once during the scene, add +2 to one roll involving disrupting a foe, disabling a device, breaking formation, interrupting a strike, or forcing a momentary malfunction.',
        "[HIDDEN LVL 5+] Cataclysm Pulse — Once during a decisive battle, collapse, duel, clockwork crisis, siege, or timed disaster, release a violent pulse from your palm mechanism. Add +2 to one decisive roll involving stunning force, disabling machinery, disrupting a major threat, breaking a formation, or stopping a dangerous action before it completes.",
      ],
    },
    {
      id: 'echolocate', name: 'Echolocate', axis: 'magic', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Send a subtle Chronison pulse through your frame, palm, voice, or core and read the returning echo from nearby surfaces, bodies, gears, passages, or moving objects. Applies to sensing layout, finding movement, detecting hidden spaces, reading distance, or navigating in darkness.',
        'Echo-Read — Add +2 to one roll involving locating a hidden passage, sensing a moving creature, reading a room\'s shape, judging distance, finding a hollow wall, or moving without clear sight.',
        'Return Pulse — Once during your next encounter or scene, release a sharper echo-pulse and learn one useful spatial detail nearby (hidden gap, moving creature, hollow chamber, open route, weak wall, or approaching danger).',
        'Pulsemap — Until the end of your next encounter or scene, repeated echoes build a rough map in your mind. Once during the scene, add +2 to one roll involving navigation, avoiding ambush, finding cover, tracking movement, or reading a complex space.',
        "[HIDDEN LVL 5+] Perfect Resonance Map — Once during an investigation, battle, pursuit, dungeon crawl, trap sequence, or clockwork ruin, ask the DM one direct question about nearby movement, hidden space, structural layout, machinery, or the safest route through the area.",
      ],
    },
    {
      id: 'clockheart_key', name: 'Clockheart Key', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Wind, tune, or fit a small clockwork key, gear-pin, timing rod, spring tooth, or regulator into a mechanism, construct, lock, device, or your own inner frame. Applies to clockwork, tuning, timing, repairs, winding, stabilizing gears, or starting a mechanism.',
        'Gearsync Pattern — Add +2 to one roll involving aligning gears, winding a spring, repairing a clockwork part, timing a device, opening a mechanical lock, or stabilizing a construct mechanism.',
        'Regulator Key — Upgrade the key with a measured tooth, tension spring, and pulse-marked handle. Until the end of your next encounter or scene, it may tune one mechanism, stabilize one clockwork failure, or help a construct resist a timing disruption.',
        'Chronison Winder — Complete a refined clockheart key that can restore, delay, start, stop, or synchronize one mundane clockwork mechanism during your next mission or scene.',
        "[HIDDEN LVL 5+] Prime Gearheart Key — Create a masterwork Chronison key tuned to pulse and clockwork. Once during a battle, repair, trap, time-lock, construct crisis, or mechanism challenge, add +2 to one roll involving synchronization, repair, activation, delay, shutdown, or mechanical timing.",
      ],
    },
    {
      id: 'coreshot', name: 'Coreshot', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Attach a compact Chronison launcher to your arm, built from a core-spring, barrel-ring, tension gear, and crude loading mouth. Can fire small stones, scrap metal, bolts, or shaped debris. Applies to aiming, firing, loading, bracing recoil, clearing jams, or using the arm-mounted launcher.',
        'Scrapshot Pattern — Add +2 to one roll involving firing stone or metal shot, targeting mechanisms, or applying force at range.',
        'Corebarrel Frame — Upgrade the Coreshot with a stronger barrel, better recoil brace, and safer loading channel. Until the end of your next encounter or scene, may fire one prepared shot with reduced risk of jam, recoil loss, or misalignment.',
        'Pulse-Coreshot Arm — Complete a refined Chronison arm-weapon that can add a brief pulse to its fired shot. May fire stone, metal, or scrap with enough force to shove, stagger, crack, or interrupt one target or object.',
        "[HIDDEN LVL 5+] Combustion Pulse Cannon — Create a sizeable Chronison arm-cannon that combines core-shot, pulse force, and combustion pressure. Once during a battle, breach, siege, pursuit, or machine crisis, add +2 to one roll involving a powerful ranged shot, breaking armor, blasting an obstacle, staggering a major foe, or firing through heavy resistance.",
      ],
    },
  ],

  // ── DRAKAZIR (Dragonborn) ──────────────────────────────────────────────────
  drakazir: [
    {
      id: 'sauric_breath', name: 'Sauric Breath', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Draw ancient draconic force into your lungs, throat, jaw, or chest. Applies to breath, intimidation, resisting heat, projecting force, surviving fumes, roaring, or channeling your dragonborn nature.',
        'Dragonlung — Add +2 to one roll involving holding breath, resisting smoke, frightening a creature, projecting your voice, enduring heat, or preparing a breath attack.',
        'Breath Burst — Once during your next encounter or scene, release a short burst of sauric breath. Choose the breath expression when used (flame, frost, lightning, acid, smoke, force, or choking ash) based on your Drakazir lineage.',
        'Wyrmbreath Mantle — Until the end of your next encounter or scene, your breath carries visible draconic force. Once during the scene, add +2 to one roll involving breath, intimidation, elemental pressure, resisting fumes, or forcing enemies back.',
        "[HIDDEN LVL 5+] Ancient Sauric Exhale — Once during a decisive battle, duel, siege, monster hunt, or draconic trial, release a full ancient breath. Add +2 to one decisive roll involving elemental breath, fear, destruction, resistance, or breaking through a major threat.",
      ],
    },
    {
      id: 'draconhowl', name: 'Draconhowl', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Speak, roar, or exhale one ancient draconic word that carries force through the air. At first, the word creates a small blast, shove, crack, tremor, or pressure burst. Applies to forceful speech, intimidation, breaking focus, pushing back a threat, commanding attention, or using draconic authority.',
        'Wyrmword — Add +2 to one roll involving frightening a creature, forcing hesitation, cracking a weak object, breaking silence, interrupting a foe, or commanding attention through draconic speech.',
        'Blastword — Once during your next encounter or scene, speak a sharper draconic word that may shove, stagger, rattle, crack, or interrupt one nearby creature, object, door, shield, or fragile barrier.',
        'Elder Howl — Until the end of your next encounter or scene, your draconic word carries heavier force. Once during the scene, add +2 to one roll involving blasting through resistance, interrupting a charge, breaking formation, shaking a structure, or forcing enemies back.',
        "[HIDDEN LVL 5+] Ancient Draconhowl — Once during a decisive battle, siege, dragon trial, collapse, monster hunt, or oath challenge, speak a true ancient draconic word. Add +2 to one decisive roll involving shattering, repelling, stunning, commanding, breaking a barrier, or forcing a major threat to yield ground.",
      ],
    },
    {
      id: 'wyrmglass_swordhilt', name: 'Wyrmglass Swordhilt', axis: 'tech', boon: '+1 Mind per use',
      tiers: [
        'For 1 hour, add +1 MIND. Fit, polish, or awaken a wyrmglass swordhilt, grip, pommel, guard, or focusing shard that can hold and shape draconic force. Applies to sword handling, channeling breath through a weapon, reading elemental residue, resisting heat, striking with precision, or focusing sauric energy.',
        'Glassguard Pattern — Add +2 to one roll involving gripping a weapon under pressure, resisting disarm, handling hot or cold materials, or focusing sauric energy through a weapon.',
        'Breathglass Hilt — Upgrade the swordhilt with a clearer wyrmglass channel, heat-treated guard, and draconic focusing marks. Until the end of your next encounter or scene, it may hold a trace of your breath, allowing one strike, parry, or intimidation display to carry visible draconic force.',
        'Drakazir Glassblade Hilt — Complete a refined wyrmglass hilt capable of shaping a temporary blade-edge, breath-channel, or elemental flare. May add +1 to one roll involving a weapon strike, breath-infused attack, defensive parry, or draconic display.',
        "[HIDDEN LVL 5+] Ancient Wyrmglass Swordhilt — Create a masterwork wyrmglass hilt capable of projecting a luminous draconic blade from stored breath, heat, or elemental force. Once during a battle, duel, breach, dragon trial, or monster hunt, add +2 to one roll involving striking, parrying, cutting through resistance, channeling breath, or manifesting a temporary blade of draconic energy.",
      ],
    },
    {
      id: 'dragonscale_device', name: 'Dragonscale Device', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Remove one loose or prepared Drakazir scale and fit it into a small device, brace, guard, tool, plate, latch, charm-frame, or weapon part. Applies to armor reinforcement, heat resistance, technical adaptation, field repair, weapon fitting, or adding draconic function to a device.',
        'Scaleplate Fit — Add +2 to one roll involving reinforcing armor, patching a device, improving heat resistance, strengthening a tool, adding grip to a weapon, or using a scale as a technical component.',
        'Living Scale Insert — Twice per long rest, remove a prepared scale and fit it into armor, gear, or a device. Until the end of your next encounter or scene, the scale may add one simple function (heat shielding, clawlike grip, breath venting, edge reinforcement, pressure bracing, or elemental resistance).',
        'Drakazir Scale-Engine — Complete a refined scale-device that can accept one of your prepared scales as a functional component. May add armor, reinforce a tool, stabilize a weapon, resist heat, or carry a trace of your sauric breath.',
        "[HIDDEN LVL 5+] Elder Dragonscale Mechanism — Create a masterwork device built around a prepared Drakazir scale. Once during a battle, forge crisis, ruin breach, siege, or monster hunt, add +2 to one roll involving armor, weapon function, technical adaptation, elemental resistance, breath-channeling, or turning your scale into a decisive tool.",
      ],
    },
  ],

  // ── NAZARI (Sea-folk) ──────────────────────────────────────────────────────
  nazari: [
    {
      id: 'pressurepush', name: 'Pressurepush', axis: 'magic', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Shape invisible Vonyetic pressure around your hands, limbs, stance, or weapon without requiring water. Applies to pushing, bracing, gripping, striking, resisting force, holding ground, forcing movement, or fighting through pressure.',
        'Force Palm — Add +2 to one roll involving shoving, pinning, blocking, striking, gripping, breaking through resistance, holding something in place, or forcing a creature back.',
        'Pressure Crush — Once during your next encounter or scene, when you strike, shove, pin, or brace against a creature or object, you may focus Vonyetic pressure into the action and make the impact heavier, denser, or harder to resist.',
        'Land-Tide Force — Until the end of your next encounter or scene, your body carries controlled pressure through your stance and motion. Once during the scene, add +2 to one roll involving strength, restraint, impact, forced movement, or resisting being moved.',
        "[HIDDEN LVL 5+] Abyssal Pressurepush — Once during a decisive battle, duel, rescue, siege, breach, or survival scene, compress Vonyetic force into one overwhelming action. Add +2 to one roll to crush, hold, stop, shove, pin, break, withstand, or redirect a major threat.",
      ],
    },
    {
      id: 'depthdream', name: 'Depthdream', axis: 'magic', boon: '+1 Will per use',
      tiers: [
        'For 1 hour, add +1 WILL. Enter a waking ocean-dream and feel the pull of tide, current, moon, vessel, and deep pressure. Applies to navigation, reading tides, sensing current, guiding boats, resisting disorientation, or acting by deep-water instinct.',
        'Current Dream — Add +2 to one roll involving reading a tide, steering a small boat, sensing current, predicting drift, finding the safest water-path, or resisting the pull of dangerous water.',
        'Tide Nudge — Once during your next encounter or scene, you may bend a small current, tide-pull, wake, or pressure-flow enough to influence the direction of a small boat, swimmer, floating object, or drifting hazard.',
        'Vessel-Tide Dream — Until the end of your next encounter or scene, your dream presses against the water around a vessel. Once during the scene, add +2 to one roll involving turning, slowing, speeding, grounding, redirecting, or stabilizing a ship, boat, raft, or waterborne creature.',
        "[HIDDEN LVL 5+] Moon-Tide Reverie — Once during a decisive voyage, sea battle, storm, eclipse, ritual, harbor crisis, or oceanic omen, dream so deeply that the tide appears to answer the moons themselves. With DM approval, cause a dramatic shift in tide, current, ship direction, or the seeming hour of the sky. Add +2 to one decisive roll that uses that change.",
      ],
    },
    {
      id: 'glideshute', name: 'Glideshute', axis: 'tech', boon: '+1 Whim per use',
      tiers: [
        'For 1 hour, add +1 WHIM. Fit a membranous Nazari glider made from treated sailskin, fin-ribs, reed-bone, pressure-thread, or flexible sea-hide.',
        'Sailfin Pattern — Add +2 to one roll involving catching air, gliding a short distance, landing from a fall, crossing a gap, descending from a ledge, or steering through wind.',
        'Reefwing Frame — Upgrade the Glideshute with stronger ribs, better handholds, and pressure-balanced membranes. Until the end of your next encounter or scene, may slow one fall, extend one leap, or allow one controlled glide across a short distance.',
        'Nazari Glidewing — Complete a refined land-warrior glider worn across the shoulders, arms, or back. Through your next encounter, climb, escape, or mission, the wearer may glide between high points, descend safely, or cross broken terrain with controlled movement.',
        "[HIDDEN LVL 5+] Sky-Tide Wingrig — Create a masterwork Nazari wingrig with pressure-fed membranes and deep-sail geometry. Once during a battle, escape, tower descent, cliff crossing, ship assault, or aerial hazard, the wearer may achieve brief controlled flight. Add +2 to one roll involving flight, descent, evasion, repositioning, or reaching a difficult place.",
      ],
    },
    {
      id: 'sylvan_waterpack', name: 'Sylvan Waterpack', axis: 'tech', boon: '+1 Body per use',
      tiers: [
        'For 1 hour, add +1 BODY. Wear a compact belt-mounted hydration device filled with treated brine, mist reeds, pressure bladders, and skin-feed tubes that keeps a Nazari stable while away from water.',
        'Belt-Brine Pattern — Add +2 to one roll involving resisting dehydration, enduring dry air, crossing hot terrain, recovering after exertion, fighting through land-fatigue, or keeping a sea-folk body stable away from water.',
        'Pressure-Mist Pack — Upgrade the device into a stronger belt-pack with a small pressure chamber. Until the end of your next encounter or scene, the wearer may activate it once to ignore one minor penalty caused by dryness, heat, salt-loss, exhaustion, or extended time away from water.',
        'Backborne Hydrapack — Complete a larger back-worn Nazari hydration pack with pressure valves, brine chambers, and mist lines. Through your next encounter, march, or mission, the wearer remains battle-ready away from water and may activate the pack once to add +1 to one roll involving bracing, shoving, resisting force, or fighting under dry conditions.',
        "[HIDDEN LVL 5+] Tideheart Pressurepack — Create a masterwork Nazari hydra-pressure pack that sustains the body and stores compressed Vonyetic force. Once during a battle, siege, desert crossing, land mission, or survival scene, the wearer may release stored pressure, gaining +2 to one roll involving endurance, strength, recovery, resisting exhaustion, shoving, bracing, or fighting at full power while far from water.",
      ],
    },
  ],

  // ── FAE ────────────────────────────────────────────────────────────────────
  fae: [],
};

// ─── RACE → ABILITY KEY MAPPING ───────────────────────────────────────────────
function getAbilitiesForChar(char) {
  const race = char?.race;
  const rv   = char?.rv;   // variant / Pa'morph major bloodline
  const pmV  = char?.pmV;  // Pa'morph minor bloodline

  if (!race) return [];

  if (race === 'pamorph') {
    const majorAbilities = RACE_ABILITIES.pamorph_major || [];
    const minorAbilities = pmV ? (RACE_ABILITIES.pamorph_minor || []) : [];
    return [...majorAbilities, ...minorAbilities];
  }

  return RACE_ABILITIES[race] || [];
}

// ─── STATUS STYLES ────────────────────────────────────────────────────────────
const STATUS_STYLE = {
  pending:  { color: COLORS.deity,  bg: COLORS.deityBg,        label: 'Pending'  },
  approved: { color: COLORS.magic,  bg: COLORS.magicBg,        label: 'Approved' },
  denied:   { color: '#e05a5a',     bg: 'rgba(224,90,90,0.1)', label: 'Denied'   },
};

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── ABILITY CARD ─────────────────────────────────────────────────────────────
function AbilityCard({ ability, charLevel, char, campaignId, requests, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tiers      = getTiers(ability.axis);
  const unlocked   = getUnlockedTierCount(charLevel);
  const axisColor  = ability.axis === 'magic' ? COLORS.magic : COLORS.tech;
  const axisLabel  = ability.axis === 'magic' ? 'Cast' : 'Deploy';

  const hasPending = requests.some(r => r.ability_id === ability.id && r.status === 'pending');

  const submit = async () => {
    if (!selectedTier || submitting) return;
    setSubmitting(true);
    await onSubmit(ability, selectedTier, note.trim());
    setNote('');
    setSelectedTier(null);
    setOpen(false);
    setSubmitting(false);
  };

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${open ? axisColor + '44' : COLORS.border}`, marginBottom: 6, transition: 'border-color 0.15s' }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: open ? `${axisColor}08` : COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, textAlign: 'left' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, letterSpacing: '0.04em' }}>{ability.name}</div>
            {hasPending && <div style={{ fontSize: 7, color: COLORS.deity, fontFamily: "'Cinzel', serif", background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 3, padding: '1px 5px' }}>PENDING</div>}
          </div>
          <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginTop: 2 }}>{ability.boon} · {tiers[0]}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 7, color: axisColor, fontFamily: "'Cinzel', serif", background: `${axisColor}11`, border: `1px solid ${axisColor}44`, borderRadius: 3, padding: '1px 6px', letterSpacing: '0.08em' }}>
            {ability.axis === 'magic' ? 'MAGIC' : 'TECH'}
          </div>
          <div style={{ fontSize: 10, color: COLORS.dim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
        </div>
      </button>

      {/* Expanded tiers */}
      {open && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
          <div style={{ ...label8(), marginBottom: 8 }}>Select Tier to {axisLabel}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {ability.tiers.map((desc, i) => {
              const tierName   = tiers[i] || `Tier ${i + 1}`;
              const isUnlocked = i < unlocked;
              const isSelected = selectedTier === i;
              const isHidden   = i === 4;

              return (
                <div key={i} onClick={() => isUnlocked && setSelectedTier(isSelected ? null : i)}
                  style={{ background: isSelected ? `${axisColor}14` : isUnlocked ? COLORS.card : 'transparent', border: `1px solid ${isSelected ? axisColor + '55' : isUnlocked ? COLORS.border : COLORS.border + '44'}`, borderRadius: 6, padding: '8px 10px', cursor: isUnlocked ? 'pointer' : 'default', opacity: isUnlocked ? 1 : 0.38, transition: 'all 0.12s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: isSelected ? axisColor : isUnlocked ? COLORS.muted : COLORS.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {tierName}
                      {isHidden && ' ·'} {isHidden && <span style={{ color: COLORS.deity }}>Unlocks at Level 5</span>}
                    </div>
                    {!isUnlocked && <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>LOCKED</div>}
                  </div>
                  <div style={{ fontSize: 10, color: isUnlocked ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{desc}</div>
                </div>
              );
            })}
          </div>

          {selectedTier !== null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="Optional note to the Architect…" rows={2}
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 10, color: COLORS.text, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <button onClick={submit} disabled={submitting}
                style={{ width: '100%', background: submitting ? 'transparent' : `${axisColor}18`, border: `1px solid ${axisColor}66`, borderRadius: 7, padding: '9px', cursor: submitting ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: axisColor, fontWeight: 700, letterSpacing: '0.1em' }}>
                {submitting ? `${axisLabel}ing…` : `⬡ ${axisLabel} ${ability.name} — ${tiers[selectedTier]}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AXIS SECTION ─────────────────────────────────────────────────────────────
function AxisSection({ title, abilities, charLevel, char, campaignId, requests, onSubmit, axis }) {
  const [open, setOpen] = useState(true);
  const color = axis === 'magic' ? COLORS.magic : COLORS.tech;
  const axisAbilities = abilities.filter(a => a.axis === axis);
  if (axisAbilities.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', borderBottom: `1px solid ${color}22`, padding: '8px 0', cursor: 'pointer', marginBottom: open ? 10 : 0 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 9, color, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
      </button>
      {open && axisAbilities.map(ability => (
        <AbilityCard key={ability.id} ability={ability} charLevel={charLevel} char={char} campaignId={campaignId} requests={requests} onSubmit={onSubmit} />
      ))}
    </div>
  );
}

// ─── CASTOR INNER ─────────────────────────────────────────────────────────────
function CastorInner({ char, campaignId, onClose, onBadgeChange }) {
  const [requests, setRequests] = useState([]);
  const [tab, setTab]           = useState('catalog');

  const abilities  = getAbilitiesForChar(char);
  const charLevel  = char?.charLevel || 1;

  useEffect(() => {
    if (!char?.id) return;
    loadRequests();
    const sub = supabase.channel(`castor-player-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_requests', filter: `character_id=eq.${char.id}` }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id]);

  const loadRequests = async () => {
    const { data } = await supabase.from('cast_requests').select('*')
      .eq('character_id', String(char.id))
      .order('created_at', { ascending: false }).limit(40);
    if (data) {
      setRequests(data);
      onBadgeChange?.(data.filter(r => r.status === 'pending').length);
    }
  };

  const handleSubmit = async (ability, tierIndex, note) => {
    if (!char?.id) return;
    const tiers    = getTiers(ability.axis);
    const tierName = tiers[tierIndex] || `Tier ${tierIndex + 1}`;
    const axisLabel = ability.axis === 'magic' ? 'Cast' : 'Deploy';
    const isTales  = String(campaignId || '').startsWith('tales:');

    const { data: req, error } = await supabase.from('cast_requests').insert({
      campaign_id:      String(campaignId),
      character_id:     String(char.id),
      character_name:   char.name || 'Unknown',
      ability_id:       ability.id,
      ability_name:     ability.name,
      discipline_label: tierName,
      axis:             ability.axis,
      stat_key:         '',
      modifier:         0,
      cost:             tierIndex + 1,
      currency_key:     ability.axis === 'magic' ? 'MOTE' : 'TINKERTRICK',
      status:           isTales ? 'approved' : 'pending',
      dm_note:          isTales ? 'Adjudicated by the Scribe (Tales).' : (note || null),
      resolved_at:      isTales ? new Date().toISOString() : null,
    }).select().single();

    if (!error && req && isTales) {
      window.dispatchEvent(new CustomEvent('syntarion-tales-cast', {
        detail: {
          campaignId:      String(campaignId),
          abilityName:     ability.name,
          tierLabel:       tierName,
          disciplineLabel: ability.axis === 'magic' ? 'Magicka' : 'Ingenium',
          effect:          ability.tiers[tierIndex] || '',
          note:            note || '',
        },
      }));
      loadRequests();
      return;
    }

    if (!error && req) {
      const { data: hsession } = await supabase.from('hercules_sessions').select('id')
        .eq('campaign_id', String(campaignId)).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (hsession?.id) {
        await supabase.from('hercules_events').insert({
          session_id:  hsession.id,
          type:        'cast_request',
          actor_name:  char.name || 'Player',
          actor_id:    String(char.id),
          description: `${char.name || 'Player'} requests to ${axisLabel.toLowerCase()} ${ability.name} [${tierName}] — awaiting Architect approval.${note ? ` Note: "${note}"` : ''}`,
          dm_approved: false,
        });
      }
      loadRequests();
    }
  };

  const hasMagic = abilities.some(a => a.axis === 'magic');
  const hasTech  = abilities.some(a => a.axis === 'tech');

  return (
    <>
      {/* Tabs */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(56,189,248,0.1)`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['catalog', 'Abilities'], ['history', 'History']].map(([v, lbl]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ background: tab === v ? 'rgba(56,189,248,0.12)' : 'transparent', border: `1px solid ${tab === v ? 'rgba(56,189,248,0.4)' : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: tab === v ? '#7dd3fc' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
          {charLevel < 5 && tab === 'catalog' && (
            <div style={{ marginLeft: 'auto', fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', alignSelf: 'center' }}>
              Level {charLevel} — {getUnlockedTierCount(charLevel)} tier{getUnlockedTierCount(charLevel) !== 1 ? 's' : ''} unlocked
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {tab === 'catalog' && (
          abilities.length === 0 ? (
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '40px 0' }}>
              No racial abilities found. Contact the Architect.
            </div>
          ) : (
            <div>
              {hasMagic && (
                <AxisSection title="Magicka — Magic Abilities" axis="magic" abilities={abilities} charLevel={charLevel} char={char} campaignId={campaignId} requests={requests} onSubmit={handleSubmit} />
              )}
              {hasTech && (
                <AxisSection title="Ingenium — Tech Abilities" axis="tech" abilities={abilities} charLevel={charLevel} char={char} campaignId={campaignId} requests={requests} onSubmit={handleSubmit} />
              )}
            </div>
          )
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>No requests yet.</div>
            )}
            {requests.map(req => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              return (
                <div key={req.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{req.ability_name}</div>
                    <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 3, padding: '2px 6px' }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', marginBottom: req.dm_note ? 4 : 0 }}>
                    {req.discipline_label} · {req.axis}
                  </div>
                  {req.dm_note && <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>"{req.dm_note}"</div>}
                  {req.status === 'approved' && <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>✦ Approved — use it.</div>}
                  {req.status === 'denied'   && <div style={{ fontSize: 9, color: '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>✕ Denied by the Architect.</div>}
                  <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 6 }}>{new Date(req.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export default function CastorPanel({ char, campaignId, onClose, onBadgeChange, embedded = false }) {
  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#0e0c1a' }}>
        <CastorInner char={char} campaignId={campaignId} onClose={onClose} onBadgeChange={onBadgeChange} />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 400, maxHeight: '82vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#0e0c1a', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(56,189,248,0.14)', background: 'rgba(56,189,248,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#7dd3fc', letterSpacing: '0.18em', fontWeight: 700 }}>CASTOR</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{char?.name} · Racial Abilities</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      <CastorInner char={char} campaignId={campaignId} onClose={onClose} onBadgeChange={onBadgeChange} />
    </div>
  );
}
