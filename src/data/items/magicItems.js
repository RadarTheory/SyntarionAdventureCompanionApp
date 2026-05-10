// src/data/items/magicItems.js
// Soteria item data module. Imported by allItems.js and rendered by ItemCatalog.jsx.

export const MAGIC_ITEMS = [
  // MAGIC ITEMS — Accessory
  { category: 'Magic Items', type: 'Accessory', name: 'Deck of Marked Cards', desc: 'Essential for cheating at tavern games.', tags: ['accessory','common'], meta: 'originalId: 337; rarity: Common; value: 25' },
  { category: 'Magic Items', type: 'Accessory', name: 'Prism of Refracted Light', desc: 'Splits light into rainbows; mesmerizing to simple creatures.', tags: ['accessory','uncommon'], meta: 'originalId: 429; rarity: Uncommon; value: 75' },
  { category: 'Magic Items', type: 'Accessory', name: 'Trinket of the Lost Soul', desc: 'A small glass container holding a wisp of white smoke.', tags: ['accessory','rare'], meta: 'originalId: 457; rarity: Rare; value: 240' },
  { category: 'Magic Items', type: 'Accessory', name: 'Bangle of the Fire-Dancer', desc: 'Gold bracelet that chimes when the wearer moves; grants fire resistance.', tags: ['accessory','rare','fire'], meta: 'originalId: 458; rarity: Rare; value: 200' },
  { category: 'Magic Items', type: 'Accessory', name: 'Preserved Four-Leaf Clover', desc: 'Pressed between glass; grants a tiny boost to critical hit chance.', tags: ['accessory','uncommon'], meta: 'originalId: 517; rarity: Uncommon; value: 50' },

  // MAGIC ITEMS — Amulet
  { category: 'Magic Items', type: 'Amulet', name: 'Pendant of Lost Tears', desc: 'A blue crystal necklace that feels cold against the skin.', tags: ['accessory','uncommon','amulet','earth'], meta: 'originalId: 126; rarity: Uncommon; value: 75' },
  { category: 'Magic Items', type: 'Amulet', name: 'Talisman of the Storm', desc: 'Grants resistance to lightning damage.', tags: ['accessory','epic','amulet','lightning'], meta: 'originalId: 156; rarity: Epic; value: 480' },
  { category: 'Magic Items', type: 'Amulet', name: 'Amulet of the Phoenix', desc: 'Resurrects the wearer once upon death, then shatters.', tags: ['accessory','legendary','amulet','fire','healing'], meta: 'originalId: 186; rarity: Legendary; value: 5000' },
  { category: 'Magic Items', type: 'Amulet', name: 'Talisman of All-Seeing Eyes', desc: 'An amulet covered in blinking eyes; prevents backstabs.', tags: ['accessory','epic','amulet'], meta: 'originalId: 216; rarity: Epic; value: 550' },
  { category: 'Magic Items', type: 'Amulet', name: 'Medallion of the War Chief', desc: 'Increases the morale and attack speed of nearby allies.', tags: ['accessory','rare','amulet','mobility'], meta: 'originalId: 219; rarity: Rare; value: 180' },
  { category: 'Magic Items', type: 'Amulet', name: 'Serpentine Jade Amulet', desc: 'Grants immunity to snake venom.', tags: ['accessory','rare','amulet','poison'], meta: 'originalId: 246; rarity: Rare; value: 260' },
  { category: 'Magic Items', type: 'Amulet', name: 'Necklace of Dragon\'s Teeth', desc: 'Strung on leather; increases physical damage output.', tags: ['accessory','rare','amulet','beast'], meta: 'originalId: 306; rarity: Rare; value: 320' },
  { category: 'Magic Items', type: 'Amulet', name: 'Medallion of Ursine Fury', desc: 'A bear-shaped amulet that grants a burst of strength when injured.', tags: ['accessory','rare','amulet','beast'], meta: 'originalId: 336; rarity: Rare; value: 230' },
  { category: 'Magic Items', type: 'Amulet', name: 'Pendant of the Screaming Spirit', desc: 'Occasionally emits a terrifying shriek that frightens enemies.', tags: ['accessory','rare','amulet'], meta: 'originalId: 339; rarity: Rare; value: 290' },
  { category: 'Magic Items', type: 'Amulet', name: 'Symbol of the Sun God', desc: 'A gold amulet that glows warmly in the presence of undead.', tags: ['accessory','rare','amulet','fire','holy'], meta: 'originalId: 366; rarity: Rare; value: 200' },
  { category: 'Magic Items', type: 'Amulet', name: 'Necklace of Wolf Fangs', desc: 'A savage trophy that adds a tiny amount of bite to attacks.', tags: ['accessory','common','amulet','beast'], meta: 'originalId: 369; rarity: Common; value: 15; damage: 2' },
  { category: 'Magic Items', type: 'Amulet', name: 'Amulet of the Frozen Heart', desc: 'An ice crystal on a silver chain; grants resistance to cold damage.', tags: ['accessory','rare','amulet','cold','earth'], meta: 'originalId: 396; rarity: Rare; value: 280' },
  { category: 'Magic Items', type: 'Amulet', name: 'Void-Gem Pendant', desc: 'A black stone that absorbs nearby light; hums with dark energy.', tags: ['accessory','rare','amulet','shadow','earth'], meta: 'originalId: 399; rarity: Rare; value: 300' },
  { category: 'Magic Items', type: 'Amulet', name: 'Amulet of Eternal Youth', desc: 'Stops the aging process as long as it is worn.', tags: ['accessory','legendary','amulet'], meta: 'originalId: 486; rarity: Legendary; value: 5000' },
  { category: 'Magic Items', type: 'Amulet', name: 'Pearl Necklace of the Sea', desc: 'Grants the ability to speak with aquatic creatures.', tags: ['accessory','rare','amulet'], meta: 'originalId: 489; rarity: Rare; value: 280' },
  { category: 'Magic Items', type: 'Amulet', name: 'Pendant of the Winter Wolf', desc: 'A silver wolf head with sapphire eyes; grants resistance to cold.', tags: ['accessory','rare','amulet','beast'], meta: 'originalId: 516; rarity: Rare; value: 280' },
  { category: 'Magic Items', type: 'Amulet', name: 'Amulet of Last Light', desc: 'An amulet that glows when the wearer is near death, helping allies find them in darkness.', tags: ['magic','wearable'], meta: 'trigger: wounded' },
  { category: 'Magic Items', type: 'Amulet', name: 'Salt-Circle Pendant', desc: 'A pendant that strengthens simple wards against spirits when placed at a threshold.', tags: ['magic','ward'], meta: 'effect: threshold ward' },

  // MAGIC ITEMS — Armor
  { category: 'Magic Items', type: 'Armor', name: 'Mirror-Mist Cloak', desc: 'A cloak that blurs the wearer\'s outline in fog, rain, or smoke. Useless in dry bright rooms.', tags: ['magic','wearable'], meta: 'condition: mist/smoke' },
  { category: 'Magic Items', type: 'Armor', name: 'Lionheart Breastplate', desc: 'A breastplate that steadies morale when the wearer stands between allies and danger.', tags: ['magic','armor'], meta: 'effect: courage aura' },
  { category: 'Magic Items', type: 'Armor', name: 'Ashen Ward Shield', desc: 'A shield that drinks sparks and cinders, then releases a brief smoky cover.', tags: ['magic','shield'], meta: 'charges: fire-triggered' },
  { category: 'Magic Items', type: 'Armor', name: 'Cloak of Arrow Memory', desc: 'A cloak that stiffens after the first arrow nearly hits the wearer.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },

  // MAGIC ITEMS — Artifact
  { category: 'Magic Items', type: 'Artifact', name: 'Crown Shard of the First Road', desc: 'A broken crown fragment that points toward ancient roads and imperial milestones. Factions dispute ownership.', tags: ['magic','artifact'], meta: 'effect: ancient navigation' },

  // MAGIC ITEMS — Belt
  { category: 'Magic Items', type: 'Belt', name: 'Belt of the Mule', desc: 'A broad belt that improves carrying endurance and stubborn resistance to forced movement.', tags: ['magic','strength'], meta: 'effect: carry more' },

  // MAGIC ITEMS — Boots
  { category: 'Magic Items', type: 'Boots', name: 'Boots of the Sure Ledge', desc: 'Boots that grip wet stone, roof tiles, and ship decks better than normal leather.', tags: ['magic','mobility'], meta: 'effect: balance' },

  // MAGIC ITEMS — Charm
  { category: 'Magic Items', type: 'Charm', name: 'Lucky Rabbit\'s Foot', desc: 'A gruesome but popular charm sold by street peddlers.', tags: ['accessory','common','charm'], meta: 'originalId: 127; rarity: Common; value: 5' },
  { category: 'Magic Items', type: 'Charm', name: 'Ancient Brass Compass', desc: 'It points to the nearest tavern rather than North.', tags: ['accessory','common','charm'], meta: 'originalId: 157; rarity: Common; value: 20' },
  { category: 'Magic Items', type: 'Charm', name: 'Pearl of the Deep Sea', desc: 'Allows the holder to breathe underwater indefinitely.', tags: ['accessory','legendary','charm','water','pirate'], meta: 'originalId: 159; rarity: Legendary; value: 1800' },
  { category: 'Magic Items', type: 'Charm', name: 'Cursed Monkey Paw', desc: 'Grants wishes, but always with a terrible ironic twist.', tags: ['accessory','rare','charm','curse'], meta: 'originalId: 187; rarity: Rare; value: 150' },
  { category: 'Magic Items', type: 'Charm', name: 'Counterfeit Gold Coin', desc: 'Painted lead. Worthless, but might fool a goblin.', tags: ['accessory','common','charm'], meta: 'originalId: 217; rarity: Common; value: 0' },
  { category: 'Magic Items', type: 'Charm', name: 'Brooch of the False King', desc: 'Makes the wearer appear more charismatic and authoritative.', tags: ['accessory','epic','charm','social'], meta: 'originalId: 247; rarity: Epic; value: 500' },
  { category: 'Magic Items', type: 'Charm', name: 'Totem of Spirit Speech', desc: 'A small wooden carving that allows communication with ghosts.', tags: ['accessory','epic','charm','social'], meta: 'originalId: 276; rarity: Epic; value: 550' },
  { category: 'Magic Items', type: 'Charm', name: 'Gambler\'s Loaded Dice', desc: 'Always rolls a six, if you know how to throw it.', tags: ['accessory','uncommon','charm','cold'], meta: 'originalId: 278; rarity: Uncommon; value: 60' },
  { category: 'Magic Items', type: 'Charm', name: 'Pocket Watch of Stopped Time', desc: 'A broken watch that freezes time for 5 seconds when clicked.', tags: ['accessory','legendary','charm'], meta: 'originalId: 307; rarity: Legendary; value: 5000' },
  { category: 'Magic Items', type: 'Charm', name: 'Lodestone Compass', desc: 'A primitive navigation tool made from magnetic rock.', tags: ['accessory','uncommon','charm','earth'], meta: 'originalId: 367; rarity: Uncommon; value: 50' },
  { category: 'Magic Items', type: 'Charm', name: 'Weighted Bone Dice', desc: 'Subtly weighted to roll sevens. Don\'t get caught using them.', tags: ['accessory','uncommon','charm','cold'], meta: 'originalId: 397; rarity: Uncommon; value: 40' },
  { category: 'Magic Items', type: 'Charm', name: 'Bone Dice of the Cheat', desc: 'Slightly uneven weight distribution favors high rolls.', tags: ['accessory','common','charm','cold'], meta: 'originalId: 427; rarity: Common; value: 15' },
  { category: 'Magic Items', type: 'Charm', name: 'Brooch of the King\'s Hand', desc: 'A badge of office that commands respect from guards and officials.', tags: ['accessory','epic','charm','cold'], meta: 'originalId: 459; rarity: Epic; value: 600' },
  { category: 'Magic Items', type: 'Charm', name: 'Charm of the Unbitten', desc: 'A little charm that discourages mundane insects and leeches. It does nothing to giant ones.', tags: ['magic','survival'], meta: 'effect: pest ward' },
  { category: 'Magic Items', type: 'Charm', name: 'Charm of Second Guessing', desc: 'A charm that chills when the bearer is about to sign a dangerously worded agreement.', tags: ['magic','social'], meta: 'effect: contract warning' },
  { category: 'Magic Items', type: 'Charm', name: 'Foxfire Bead', desc: 'A bead that stores a mote of pale light and releases it when crushed.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },

  // MAGIC ITEMS — Gloves
  { category: 'Magic Items', type: 'Gloves', name: 'Gloves of Gentle Theft', desc: 'Gloves that prevent fingerprints and reduce accidental noise while handling small objects.', tags: ['magic','stealth'], meta: 'effect: careful hands' },

  // MAGIC ITEMS — Jewelry
  { category: 'Magic Items', type: 'Jewelry', name: 'Manacles of the Escaped Convict', desc: 'Broken iron cuffs still locked around the wrists.', tags: ['accessory','common','jewelry'], meta: 'originalId: 249; rarity: Common; value: 5' },
  { category: 'Magic Items', type: 'Jewelry', name: 'Collar of the Hell-Hound', desc: 'A spiked choker that grants immunity to fire and fear.', tags: ['accessory','legendary','jewelry','fire'], meta: 'originalId: 279; rarity: Legendary; value: 2500' },

  // MAGIC ITEMS — Locket
  { category: 'Magic Items', type: 'Locket', name: 'Locket of the Lost Lover', desc: 'Contains a faded portrait of someone forgotten.', tags: ['accessory','common','locket'], meta: 'originalId: 189; rarity: Common; value: 15' },
  { category: 'Magic Items', type: 'Locket', name: 'Tarnished Silver Locket', desc: 'Inside is a lock of hair from a long-dead ancestor.', tags: ['accessory','common','locket'], meta: 'originalId: 277; rarity: Common; value: 15' },
  { category: 'Magic Items', type: 'Locket', name: 'Locket of the Banshee', desc: 'Cold silver; wails softly when death is near.', tags: ['accessory','rare','locket'], meta: 'originalId: 426; rarity: Rare; value: 260' },

  // MAGIC ITEMS — Ring
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Feral Wolf', desc: 'A silver ring engraved with lupine motifs; grants night vision.', tags: ['accessory','rare','ring','shadow','beast'], meta: 'originalId: 125; rarity: Rare; value: 130' },
  { category: 'Magic Items', type: 'Ring', name: 'Signet of the Lich King', desc: 'A ring of bone that allows command over lesser undead.', tags: ['accessory','legendary','ring','holy'], meta: 'originalId: 128; rarity: Legendary; value: 3000' },
  { category: 'Magic Items', type: 'Ring', name: 'Choker of Thorns', desc: 'A leather neckband with small spikes; prevents strangulation.', tags: ['accessory','uncommon','ring'], meta: 'originalId: 129; rarity: Uncommon; value: 60' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Miser', desc: 'Vibrates slightly when near large quantities of gold.', tags: ['accessory','uncommon','ring'], meta: 'originalId: 155; rarity: Uncommon; value: 90' },
  { category: 'Magic Items', type: 'Ring', name: 'Obsidian Band of Warding', desc: 'A black ring that generates a faint forcefield.', tags: ['accessory','rare','ring'], meta: 'originalId: 158; rarity: Rare; value: 210; defense: 5' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Water Walking', desc: 'A band of blue glass that defies surface tension.', tags: ['accessory','rare','ring','water','mobility'], meta: 'originalId: 185; rarity: Rare; value: 300' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Earth-Shaker', desc: 'Heavy iron ring that increases the impact of blunt attacks.', tags: ['accessory','epic','ring','earth'], meta: 'originalId: 188; rarity: Epic; value: 450' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Burning Soul', desc: 'A ring of red copper that keeps the wearer warm in blizzards.', tags: ['accessory','rare','ring','fire','cold'], meta: 'originalId: 215; rarity: Rare; value: 220' },
  { category: 'Magic Items', type: 'Ring', name: 'Signet of the Merchant Prince', desc: 'Grants a discount when bartering with city vendors.', tags: ['accessory','uncommon','ring','social'], meta: 'originalId: 218; rarity: Uncommon; value: 130' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Forgetful Sage', desc: 'Increases mana capacity, but occasionally causes spells to fizzle.', tags: ['accessory','common','ring'], meta: 'originalId: 245; rarity: Common; value: 25' },
  { category: 'Magic Items', type: 'Ring', name: 'Ruby-Studded Pirate Earring', desc: 'Fashionable jewelry stolen from a raid on the high seas.', tags: ['accessory','uncommon','ring','pirate'], meta: 'originalId: 248; rarity: Uncommon; value: 95' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Raging Tide', desc: 'Increases swimming speed and lung capacity.', tags: ['accessory','rare','ring','water','mobility'], meta: 'originalId: 275; rarity: Rare; value: 280' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Honest Merchant', desc: 'Glows faintly when someone tells a lie nearby.', tags: ['accessory','uncommon','ring','social'], meta: 'originalId: 305; rarity: Uncommon; value: 90' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of Iron Will', desc: 'A plain iron ring that helps resist mind-control effects.', tags: ['accessory','uncommon','ring'], meta: 'originalId: 308; rarity: Uncommon; value: 70' },
  { category: 'Magic Items', type: 'Ring', name: 'Earring of the Whispering Wind', desc: 'Alerts the wearer to projectile attacks from behind.', tags: ['accessory','rare','ring','mobility','pirate'], meta: 'originalId: 309; rarity: Rare; value: 160' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Cat\'s Paw', desc: 'Reduces the noise made by falling or landing.', tags: ['accessory','uncommon','ring'], meta: 'originalId: 335; rarity: Uncommon; value: 85' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of False Promises', desc: 'Enhances deception skills; the gem changes color when lying.', tags: ['accessory','epic','ring'], meta: 'originalId: 338; rarity: Epic; value: 450' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Green Thumb', desc: 'Plants grow slightly faster when the wearer tends to them.', tags: ['accessory','common','ring'], meta: 'originalId: 365; rarity: Common; value: 30' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Diplomat', desc: 'A signet ring that grants advantage on persuasion attempts.', tags: ['accessory','epic','ring'], meta: 'originalId: 368; rarity: Epic; value: 550' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Sewer Rat', desc: 'Made of rusty wire; grants immunity to filth fever.', tags: ['accessory','common','ring'], meta: 'originalId: 395; rarity: Common; value: 12' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Berserker', desc: 'Increases strength as the wearer\'s health decreases.', tags: ['accessory','epic','ring','healing'], meta: 'originalId: 398; rarity: Epic; value: 500' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Acrobat', desc: 'Improves balance on tightropes and narrow ledges.', tags: ['accessory','uncommon','ring'], meta: 'originalId: 425; rarity: Uncommon; value: 90' },
  { category: 'Magic Items', type: 'Ring', name: 'Signet of the Secret Society', desc: 'Identifies the wearer as a member of the hidden guild.', tags: ['accessory','rare','ring','fire','stealth'], meta: 'originalId: 428; rarity: Rare; value: 210' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Coal Miner', desc: 'A simple iron band that glows dimly in absolute darkness.', tags: ['accessory','common','ring','shadow'], meta: 'originalId: 455; rarity: Common; value: 10' },
  { category: 'Magic Items', type: 'Ring', name: 'Amulet of the Barn Owl', desc: 'Enhances night vision and hearing.', tags: ['accessory','uncommon','ring','shadow'], meta: 'originalId: 456; rarity: Uncommon; value: 95' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Scholar', desc: 'Helps the wearer focus on reading complex texts.', tags: ['accessory','common','ring'], meta: 'originalId: 485; rarity: Common; value: 40' },
  { category: 'Magic Items', type: 'Ring', name: 'Lodestone of Direction', desc: 'A magnetic rock on a string that always points to the largest nearby iron deposit.', tags: ['accessory','uncommon','ring','earth'], meta: 'originalId: 487; rarity: Uncommon; value: 65' },
  { category: 'Magic Items', type: 'Ring', name: 'Copper Ring of Warmth', desc: 'Keeps the finger it is worn on comfortably warm.', tags: ['accessory','common','ring'], meta: 'originalId: 488; rarity: Common; value: 25' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Librarian', desc: 'Helps the wearer organize their thoughts and recall obscure facts.', tags: ['accessory','common','ring'], meta: 'originalId: 515; rarity: Common; value: 35' },
  { category: 'Magic Items', type: 'Ring', name: 'Band of the Unseen', desc: 'Makes the wearer slightly translucent when standing still.', tags: ['accessory','epic','ring','stealth'], meta: 'originalId: 518; rarity: Epic; value: 600' },
  { category: 'Magic Items', type: 'Ring', name: 'Choker of the Vampire', desc: 'A velvet neckband that restores a small amount of health on kill.', tags: ['accessory','rare','ring','healing'], meta: 'originalId: 519; rarity: Rare; value: 350' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Patient Lock', desc: 'A ring that vibrates gently near deliberate mechanisms and hidden latches. It dislikes brute force.', tags: ['magic','ring','detection'], meta: 'effect: find mechanisms' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Shared Breath', desc: 'Two matched rings allowing wearers to share air briefly while touching or bound by cord.', tags: ['magic','ring'], meta: 'effect: breath share' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Quiet Footfalls', desc: 'A dark ring that softens steps on stone and wood. It cannot silence speech or stupidity.', tags: ['magic','stealth'], meta: 'effect: step silence' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Dry Socks', desc: 'A humble ring that keeps footwear dry in ordinary rain and puddles.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },

  // MAGIC ITEMS — Rod
  { category: 'Magic Items', type: 'Rod', name: 'Rod of Measured Silence', desc: 'A rod that suppresses a small area of needless noise, useful for courts, sickrooms, and ambushes.', tags: ['magic','rod','sound'], meta: 'duration: short' },

  // MAGIC ITEMS — Staff
  { category: 'Magic Items', type: 'Staff', name: 'Staff of the Road Shrine', desc: 'A staff that marks campsites as temporarily safe and helps travelers find the nearest path.', tags: ['magic','staff','travel'], meta: 'effect: camp ward' },
  { category: 'Magic Items', type: 'Staff', name: 'Staff of Bitter Roots', desc: 'A living staff that can root into soil, drink poison, or lash with thorny growth.', tags: ['magic','staff','nature'], meta: 'condition: soil' },

  // MAGIC ITEMS — Wand
  { category: 'Magic Items', type: 'Wand', name: 'Wand of Hearth Sparks', desc: 'A wand that lights fires, warms cups, and frightens small pests. Adventurers love it until rain starts.', tags: ['magic','wand','utility'], meta: 'charges: daily' },
  { category: 'Magic Items', type: 'Wand', name: 'Wand of Binding Thread', desc: 'Fires spectral threads that tie small objects, close sacks, or hinder a fleeing target.', tags: ['magic','wand','control'], meta: 'charges: limited' },

  // MAGIC ITEMS — Weapon
  { category: 'Magic Items', type: 'Weapon', name: 'Blade of Returning Dawn', desc: 'A sun-marked blade that sheds dim light and feels warm after courageous acts. It may strike harder against shadowed foes.', tags: ['magic','weapon','rare'], meta: 'attunement: maybe' },
  { category: 'Magic Items', type: 'Weapon', name: 'Oathkeeper Spear', desc: 'A spear that grows heavier in the hands of oathbreakers and steadier for sworn guardians.', tags: ['magic','weapon'], meta: 'effect: oath resonance' },
  { category: 'Magic Items', type: 'Weapon', name: 'Stormbite Axe', desc: 'An axe that crackles before rain and can discharge a thunderous cut when charged.', tags: ['magic','weapon','storm'], meta: 'charges: limited' },
  { category: 'Magic Items', type: 'Weapon', name: 'Grief-Tuned Dagger', desc: 'A dagger that vibrates near the person its bearer most resents.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },

];
