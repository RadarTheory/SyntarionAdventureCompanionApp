export const GEAR = [
  // GEAR — Camp
  { category: 'Gear', type: 'Camp', name: 'Bedroll', desc: 'A padded roll for sleep on cold ground. Prevents exhaustion better than bravado does.', tags: ['camping','rest'], meta: 'slot: pack' },
  { category: 'Gear', type: 'Camp', name: 'Waxed Tarp', desc: 'A waterproof sheet for shelter, cargo cover, rain catch, and emergency stretcher work.', tags: ['camping','weather'], meta: 'size: medium' },
  { category: 'Gear', type: 'Camp', name: 'Fire Kit', desc: 'Flint, steel, tinder, and charcoal cloth in a dry case. Essential when magic is unavailable.', tags: ['survival','fire'], meta: 'uses: many' },
  { category: 'Gear', type: 'Camp', name: 'Iron Cookpot', desc: 'A blackened pot for stew, dye, boiling water, and questionable field medicine.', tags: ['camping','cooking'], meta: 'weight: heavy' },
  { category: 'Gear', type: 'Camp', name: 'Travel Kettle', desc: 'A smaller pot with a locking lid. Good for tea, sterilizing needles, and melting snow.', tags: ['camping','cooking'], meta: 'weight: light' },
  { category: 'Gear', type: 'Camp', name: 'Folding Stool', desc: 'A light camp stool that keeps nobles, scribes, and wounded adventurers out of the mud.', tags: ['comfort','camp'], meta: 'bulk: low' },

  // GEAR — Containers
  { category: 'Gear', type: 'Containers', name: 'Oilskin Satchel', desc: 'A waterproof shoulder bag for documents, herbs, and powder. Floats briefly if sealed with air.', tags: ['container','waterproof'], meta: 'capacity: small' },
  { category: 'Gear', type: 'Containers', name: 'Bandolier', desc: 'A chest strap with loops for vials, cartridges, knives, or scroll tubes. Keeps items ready.', tags: ['inventory','quickdraw'], meta: 'slots: small items' },
  { category: 'Gear', type: 'Containers', name: 'Hidden Boot Sheath', desc: 'A concealed sheath for a knife, letter, lockpick, or narrow wand. Uncomfortable but useful.', tags: ['concealed','storage'], meta: 'capacity: tiny' },

  // GEAR — Exploration
  { category: 'Gear', type: 'Exploration', name: 'Silk Rope', desc: 'Strong light rope that packs small and resists rot. Expensive enough that thieves cut it when stealing from climbers.', tags: ['utility','climbing'], meta: 'length: 50 ft' },
  { category: 'Gear', type: 'Exploration', name: 'Hemp Rope', desc: 'Cheap reliable rope for hauling, binding, and camp work. Heavy when wet.', tags: ['utility','common'], meta: 'length: 50 ft' },
  { category: 'Gear', type: 'Exploration', name: 'Grappling Hook', desc: 'A hooked iron anchor for walls, branches, ship rails, and ruin ledges. Loud if thrown carelessly.', tags: ['climbing','tool'], meta: 'requires: rope' },
  { category: 'Gear', type: 'Exploration', name: 'Collapsible Pole', desc: 'A segmented pole for probing floors, vault ceilings, and suspicious pools. Also useful for tents.', tags: ['trap','exploration'], meta: 'reach: extended' },
  { category: 'Gear', type: 'Exploration', name: 'Chalk Line Reel', desc: 'A chalked cord for marking straight paths, measuring rooms, and revealing air currents.', tags: ['mapping','trap'], meta: 'uses: many' },
  { category: 'Gear', type: 'Exploration', name: 'Pitons and Hammer', desc: 'Iron spikes and a small hammer used to secure climbs or wedge doors. Slow but dependable.', tags: ['climbing','dungeon'], meta: 'noise: loud' },
  { category: 'Gear', type: 'Exploration', name: 'Surveyor Compass', desc: 'A directional compass with a sighting notch. Helps map wilderness routes and underground headings.', tags: ['navigation','mapping'], meta: 'requirement: magnetism stable' },
  { category: 'Gear', type: 'Exploration', name: 'Folding Shovel', desc: 'A compact entrenching tool for camp latrines, graves, firepits, and digging under walls.', tags: ['survival','tool'], meta: 'weight: moderate' },
  { category: 'Gear', type: 'Exploration', name: 'Cave Mirror', desc: 'A small polished steel mirror on a rod. Used to see around corners or signal in sunlight.', tags: ['scouting','stealth'], meta: 'fragile: low' },
  { category: 'Gear', type: 'Exploration', name: 'Depth Knotted Cord', desc: 'A measured cord with knots for wells, cliffs, and flooded chambers.', tags: ['supplemental','exploration'], meta: 'metadata: flexible' },

  // GEAR — Investigation
  { category: 'Gear', type: 'Investigation', name: 'Dusting Powder', desc: 'Fine powder that reveals fingerprints, seams, and recent handling.', tags: ['supplemental','investigation'], meta: 'metadata: flexible' },

  // GEAR — Lighting
  { category: 'Gear', type: 'Lighting', name: 'Hooded Lantern', desc: 'A lantern with a shutter to hide or reveal its beam. Standard dungeon equipment.', tags: ['light','exploration'], meta: 'fuel: oil' },
  { category: 'Gear', type: 'Lighting', name: 'Bullseye Lantern', desc: 'A focused lantern projecting light in a narrow path. Good for watches, mines, and signals.', tags: ['light','signal'], meta: 'fuel: oil' },
  { category: 'Gear', type: 'Lighting', name: 'Blueglass Lamp', desc: 'A filtered lamp that preserves night vision and reveals some inks. Dim but discreet.', tags: ['light','investigation'], meta: 'fuel: oil' },

  // GEAR — Survival
  { category: 'Gear', type: 'Survival', name: 'Water Purse', desc: 'A treated water bladder with a charcoal plug. Reduces bad taste and some illness risks.', tags: ['survival','water'], meta: 'capacity: daily' },
  { category: 'Gear', type: 'Survival', name: 'Snare Wire', desc: 'Thin wire for traps, repairs, alarms, and field improvisation. A favorite of patient hunters.', tags: ['survival','trap'], meta: 'uses: expendable' },
  { category: 'Gear', type: 'Survival', name: 'Rain Catch Funnel', desc: 'A folding funnel that feeds clean rain into skins or jars.', tags: ['supplemental','survival'], meta: 'metadata: flexible' },

  // GEAR — Tool
  { category: 'Gear', type: 'Tool', name: 'Wax Seal Kit', desc: 'A small kit for sealing letters, bottles, and evidence bags with marked wax.', tags: ['supplemental','tool'], meta: 'metadata: flexible' },

  // GEAR — Tools
  { category: 'Gear', type: 'Tools', name: 'Thieves Picks', desc: 'Slim picks, tension bars, wedges, and wire probes for locks and fine mechanisms.', tags: ['tool','lock','rogue'], meta: 'requires: proficiency' },
  { category: 'Gear', type: 'Tools', name: 'Smiths Roll', desc: 'Tongs, small files, punch, rivets, and a field hammer for emergency metal repairs.', tags: ['tool','repair'], meta: 'requires: forge for major work' },
  { category: 'Gear', type: 'Tools', name: 'Healers Satchel', desc: 'Bandages, splints, needles, salves, and boiled thread. Stabilizes wounds without invoking miracles.', tags: ['tool','medicine'], meta: 'uses: restocked' },
  { category: 'Gear', type: 'Tools', name: 'Disguise Case', desc: 'Wigs, wax, pigments, false scars, and posture notes. The best disguise changes behavior too.', tags: ['social','stealth'], meta: 'requires: time' },
  { category: 'Gear', type: 'Tools', name: 'Cartographers Case', desc: 'Vellum sheets, charcoal, rulers, wax markers, and waterproof tubes for mapmaking.', tags: ['mapping','knowledge'], meta: 'output: maps' },
  { category: 'Gear', type: 'Tools', name: 'Engineers Rule', desc: 'A folding rule etched with angles and load marks. Useful for bridges, siegeworks, and invention frames.', tags: ['engineering','schematic'], meta: 'requirement: literacy' },
  { category: 'Gear', type: 'Tools', name: 'Glasscutters Wheel', desc: 'A hardened wheel used to score window glass or cut sample panes. Quiet only in skilled hands.', tags: ['infiltration','tool'], meta: 'check: dexterity' },

];
