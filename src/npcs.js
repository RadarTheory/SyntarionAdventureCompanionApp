// ═══════════════════════════════════════════════════════════════════════════
//  src/data/npcs.js — Soteria NPC Reference Data
//  Seeded from UPDATED_Official_Reference.docx
//  Structure: array of city objects, each with an array of npcs
//  Fields: id (auto), name, role, status, faction, notes
// ═══════════════════════════════════════════════════════════════════════════

export const DEFAULT_CITIES = [

  // ── VERIDORA / SYLVAN GROVE ─────────────────────────────────────────────

  {
    id: 'elrathia',
    name: 'Elrãthia',
    region: 'Veridora / Sylvan Grove',
    groups: [
      { id: 'g_elrathia_1', name: 'The Orphaned', category: 'Uncategorized' },
      { id: 'g_elrathia_2', name: 'The Caretakers', category: 'Uncategorized' },
    ],
    npcs: [],
  },

  {
    id: 'hauf',
    name: 'Hauf',
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n3', name: 'Aegemon', role: 'Wise Elder / Clan Leader', status: 'Active', faction: 'Aarakocra', notes: 'Revered leader. Deep wisdom of skies and forest. Son of Aethelstan.' },
      { id: 'n4', name: "Me'latheia", role: 'High Sentinel', status: 'Active', faction: 'Aarakocra', notes: 'Leads Aarakocra military forces, chief defender of Hauf.' },
      { id: 'n5', name: 'Phaedymarr', role: 'Sky Sentinel', status: 'Active', faction: 'Aarakocra', notes: 'Patrols skies surrounding Hauf, alerts village of threats.' },
      { id: 'n6', name: 'Lykourgos', role: 'Celestial Shaman', status: 'Active', faction: 'Aarakocra', notes: 'Spiritual leader, communicates with celestial beings.' },
      { id: 'n7', name: 'Hypatios', role: 'Elder Artisan', status: 'Active', faction: 'Aarakocra', notes: 'Master craftsman of wooden structures in the forest canopy.' },
      { id: 'n8', name: 'Thalassios', role: 'Stealth Wing / Scout', status: 'Active', faction: 'Aarakocra', notes: 'Skilled spy and scout, gathers information on outsiders.' },
      { id: 'n9', name: 'Xenokrates', role: 'Resource Gatherer', status: 'Active', faction: 'Aarakocra', notes: 'Expert at finding resources in the forest for crafting and trade.' },
      { id: 'n10', name: 'Ariston', role: 'Sky Trader', status: 'Active', faction: 'Aarakocra', notes: 'Negotiates trade agreements with nearby settlements.' },
    ],
  },

  {
    id: 'gamdon',
    name: 'Gamdon',
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n11', name: 'Borak Tanah', role: 'Innkeeper / The Hearth', status: 'Active', faction: 'Gamdon', notes: 'Former adventurer, Rhae\'inar. Tusks carved with travel tales.' },
      { id: 'n12', name: 'Aakosh Tanah', role: 'Mother Figure', status: 'Active', faction: 'Gamdon', notes: 'Wife of Borak. Natural mother figure, protector of Gamdon children.' },
      { id: 'n13', name: 'Dunehviir Tanah', role: 'Missing Child', status: 'Missing', faction: 'Gamdon', notes: 'Daughter of Borak and Aakosh. Reported missing 178 E.U., likely abducted.' },
      { id: 'n14', name: 'Voslaarum', role: 'Council Advisor', status: 'Active', faction: 'Gamdon', notes: 'Loxodon advisor to the Council of Gamdon.' },
      { id: 'n15', name: 'Umfahren Tajilli', role: 'Fighter', status: 'Active', faction: 'Gamdon', notes: 'Loxodon fighter, lifelong native of Gamdon.' },
      { id: 'n16', name: 'Gorbul Nasser', role: 'Blacksmith', status: 'Active', faction: 'Gamdon', notes: 'Renowned Loxodon blacksmith. Father of Zintharia.' },
      { id: 'n17', name: 'Elaria Nasser', role: 'Jeweler', status: 'Active', faction: 'Gamdon', notes: "Gorbul's wife, skilled jeweler known for intricate designs." },
      { id: 'n18', name: 'Zintharia Nasser', role: 'Missing Child', status: 'Missing', faction: 'Gamdon', notes: 'Missing Loxodon child, daughter of the Nasser family.' },
      { id: 'n19', name: 'Rondin Faespar', role: 'Leatherworker', status: 'Active', faction: 'Gamdon', notes: 'Giff leatherworker, famous for durable stylish creations.' },
      { id: 'n20', name: 'Feylanna', role: 'Glassblower', status: 'Active', faction: 'Gamdon', notes: 'High Elf, renowned glassblower creating enchanting glass sculptures.' },
      { id: 'n21', name: 'Brin Stogrum', role: 'Stonemason', status: 'Active', faction: 'Gamdon / YewHammer Clan', notes: 'Mountain Dwarf, expert stonemason from the YewHammer Clan.' },
      { id: 'n22', name: 'Viconia Faerondaerl', role: 'Potion Maker / Alchemist', status: 'Active', faction: 'Gamdon', notes: 'Talented Drow potion maker and alchemist.' },
      { id: 'n23', name: 'Tiber', role: 'Weaponsmith', status: 'Active', faction: 'Gamdon', notes: 'Dwarven master weaponsmith.' },
      { id: 'n24', name: 'Lyifi', role: 'Seer', status: 'Active', faction: 'Gamdon', notes: 'Residential District seer.' },
      { id: 'n25', name: 'Ruga Ogedei', role: 'Herbalist', status: 'Active', faction: 'Gamdon', notes: 'Giff herbalist with renowned medicinal gardens.' },
      { id: 'n26', name: 'Mila Shirazi', role: 'Baker', status: 'Active', faction: 'Gamdon', notes: 'Rhae\'inar baker whose pastries are village favorites.' },
      { id: 'n27', name: 'Temba Kilat', role: 'Mason', status: 'Active', faction: 'Gamdon', notes: 'Loxodon mason, ensures sturdy construction of Gamdon buildings.' },
      { id: 'n28', name: 'Eldorin Brambleburr', role: 'Cobbler / Toy Whittler', status: 'Active', faction: 'Gamdon', notes: 'Renowned cobbler with a knack for whittling toys for children.' },
      { id: 'n29', name: 'Rhisira', role: 'Librarian', status: 'Active', faction: 'Gamdon', notes: "Rhae'inar librarian managing the Scholar's Grove ancient texts." },
      { id: 'n30', name: 'Balric Alkaios', role: 'Cartographer', status: 'Active', faction: 'Gamdon', notes: 'Giff cartographer, creates detailed maps of Soteria.' },
      { id: 'n31', name: 'Elion', role: 'Astronomer', status: 'Active', faction: 'Gamdon', notes: "Rhae'inar astronomer, operates the village observatory." },
      { id: 'n32', name: 'Marla Noyan', role: 'Merchant', status: 'Active', faction: 'Gamdon', notes: 'Giff merchant known for exotic imports and trade connections.' },
      { id: 'n33', name: 'Korrin Kaidu', role: 'Alchemist', status: 'Active', faction: 'Gamdon', notes: "Rhae'inar alchemist selling potions and elixirs." },
      { id: 'n34', name: 'Zathra Brivihan', role: 'Farmer', status: 'Active', faction: 'Gamdon', notes: 'Loxodon farmer, brings fresh produce and herbs to market.' },
      { id: 'n35', name: 'Pavel Kaidu', role: 'Storyteller', status: 'Active', faction: 'Gamdon', notes: "Rhae'inar storyteller entertaining market-goers." },
      { id: 'n36', name: 'Captain Harrok', role: 'Sea Captain / Militia', status: 'Active', faction: 'Gamdon Militia', notes: 'Giff sea captain who ferries goods and passengers to Gamdon.' },
      { id: 'n37', name: 'Paarthurnara Tusgaard', role: 'Militia Leader', status: 'Active', faction: 'Gamdon Militia', notes: 'Loxodon Militia Leader, oversees all city access and wall safety.' },
      { id: 'n38', name: 'Liora Subutai', role: 'Fisherwoman', status: 'Active', faction: 'Gamdon Militia', notes: "Rhae'inar fisherwoman with exceptional knowledge of the sea." },
      { id: 'n39', name: 'Priestess Nymara', role: 'Priestess', status: 'Active', faction: "Sharalya's Tabernacle", notes: 'Loxodon servant of Sharalya.' },
    ],
  },

  {
    id: 'drakar',
    name: "Drak'ar",
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n40', name: 'Xalanthirr Dirth Norre', role: 'Council Sorcerer', status: 'Active', faction: 'Drak\'ar', notes: 'Powerful sorcerer, advisor to the ruling council.' },
      { id: 'n41', name: "Lirieneth Dwin'orle", role: 'Elite Assassin', status: 'Active', faction: "Drak'ar", notes: 'Skilled assassin, member of the elite city guard.' },
      { id: 'n42', name: 'Zirathra Eyther Arnith', role: 'Merchant', status: 'Active', faction: "Drak'ar", notes: 'Owner of a prominent trade company in Drak\'ar.' },
      { id: 'n43', name: 'Axel Eyther', role: 'Mage Apprentice', status: 'Active', faction: "Drak'ar", notes: 'Drow mage in training, studying to create his own familiar.' },
      { id: 'n44', name: 'Lexity Eyther', role: 'Rogue / Mercenary', status: 'Active', faction: "Drak'ar / Auric Order", notes: 'Fiercely swift rogue, trusted auxiliary hand of the Auric Order.' },
      { id: 'n45', name: 'Valtaris', role: 'High Priestess of Lolth', status: 'Active', faction: "Drak'ar", notes: "High-ranking priestess of Lolth, the spider queen. Oversees city temple." },
      { id: 'n46', name: 'Draxior Auvrea', role: 'Pirate', status: 'Active', faction: "Drak'ar", notes: "Notorious pirate operating out of Drak'ar." },
      { id: 'n47', name: 'Sylveria', role: 'Master Thief', status: 'Active', faction: "Drak'ar", notes: 'Specializes in stealing from the wealthy elite.' },
      { id: 'n48', name: "Keth'thrak Arabis", role: 'Warrior / Council Member', status: 'Active', faction: "Drak'ar", notes: 'Powerful warrior and member of the ruling council.' },
      { id: 'n49', name: "Nethilrae Kre'ven", role: 'Bard', status: 'Active', faction: "Drak'ar", notes: 'Talented bard and performer entertaining city nobles.' },
      { id: 'n50', name: 'Thulgarin Allyian', role: 'Mercenary', status: 'Active', faction: "Drak'ar", notes: 'Dwarven mercenary renowned in Drak\'ar\'s fighting pits.' },
      { id: 'n51', name: "Vaelinar Halten'ea", role: 'Blacksmith', status: 'Active', faction: "Drak'ar", notes: 'Skilled blacksmith crafting finest weapons and armor in the city.' },
    ],
  },

  {
    id: 'elven-ruins',
    name: 'Elven Ruins',
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n52', name: 'Syla Eboneir', role: 'Dark Elf Rogue', status: 'Active', faction: 'Independent', notes: 'Drawn to ruins for ancient artifacts and forgotten dark elf secrets. Allied with Darok and Axar.' },
      { id: 'n53', name: 'Darok', role: 'Dwarf Scavenger', status: 'Active', faction: 'Independent', notes: 'Grudge against elves. Seeks to claim elven arcane secrets for dwarven power.' },
      { id: 'n54', name: 'Axar', role: 'Ancient Elven Necromancer', status: 'Active', faction: 'Independent', notes: 'Seeks to harness necrotic energies to resurrect a lost elven empire.' },
      { id: 'n55', name: 'Ssike Sahahliel', role: 'Yuan-Ti Pureblood', status: 'Active', faction: 'Independent', notes: 'Obsessed with an ancient artifact within the ruins. Leads a group of followers.' },
    ],
  },

  {
    id: 'maernethim',
    name: 'Maernethim Village',
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n56', name: 'Virella Kol', role: 'Shaman', status: 'Active', faction: 'Maernethim', notes: 'Channels primal nature forces to aid warriors. Deep spirit connection.' },
      { id: 'n57', name: 'Nyxstra Taruca', role: 'Assassin', status: 'Active', faction: 'Maernethim', notes: 'Skilled in stealth and deception. Strikes lethally from shadows.' },
      { id: 'n58', name: 'Venoxis Ussun', role: 'Defender', status: 'Active', faction: 'Maernethim', notes: 'Fiercely loyal defender of the village. Shield and spear.' },
      { id: 'n59', name: 'Draxus Huitaca', role: 'Warrior', status: 'Active', faction: 'Maernethim', notes: 'Fearsome warrior with thick scaled armor. Wields massive two-handed sword.' },
      { id: 'n60', name: 'Zalara Eda', role: 'Scout', status: 'Active', faction: 'Maernethim', notes: 'Renowned for stealth and ambush tactics. Remarkable speed.' },
      { id: 'n61', name: 'Makaar Asiini', role: 'Warrior', status: 'Active', faction: 'Maernethim', notes: 'Brother to Sinawar Asiini.' },
    ],
  },

  {
    id: 'poachers-camp',
    name: "Poacher's Camp",
    region: 'Veridora / Sylvan Grove',
    npcs: [
      { id: 'n62', name: 'Faela Sunreif', role: 'Acting Chieftain', status: 'Active', faction: 'Maernethim', notes: 'Maernethim acting chieftain of the away warrior group defending Sylvan Grove.' },
      { id: 'n63', name: 'Braxton Colewell', role: 'Poacher', status: 'Active', faction: 'Poachers', notes: 'Skilled and cunning Veridoran poacher.' },
      { id: 'n64', name: 'Renna', role: 'Poacher / Tracker', status: 'Active', faction: 'Poachers', notes: 'Drow. Nimble and elusive poacher.' },
      { id: 'n65', name: 'Talia Wheer', role: 'Alchemist', status: 'Active', faction: 'Poachers', notes: 'Veridoran. An alchemist with a questionable moral compass.' },
    ],
  },

  {
    id: 'quynthere',
    name: "Quynthe'ra",
    region: 'Veridora / Emerald Forest',
    npcs: [
      { id: 'n66', name: 'Nessaeriel Eryndor', role: 'Head of Council of Elders', status: 'Active', faction: "Quynthe'ra", notes: 'High Elf. Leads the elven Council of Elders.' },
      { id: 'n67', name: 'Karmella Daax', role: 'Deceased Elder', status: 'Deceased', faction: "Quynthe'ra", notes: 'Elven traveler who returned with a half-blood child (Kolette "Mutt" Daax). Now deceased.' },
      { id: 'n68', name: 'Keylith Daax', role: 'Council Member / Spore Druid', status: 'Active', faction: "Quynthe'ra", notes: '200-year-old High Elven spore druid. Newly formed council member. Very powerful.' },
      { id: 'n69', name: 'Galara Thalassion', role: 'Keeper of the Sacred Grove', status: 'Active', faction: "Quynthe'ra", notes: 'High Elf.' },
      { id: 'n70', name: 'Faelivrin Naiadryl', role: 'Master Enchanter', status: 'Active', faction: "Quynthe'ra", notes: 'Tutoring the only known dwarven mage apprentice, Balthorin Adgrun.' },
      { id: 'n71', name: 'Balthorin Adgrun', role: 'Dwarven Mage Apprentice', status: 'Active', faction: "Quynthe'ra", notes: 'The only known dwarven mage apprentice. Unique figure in Soteria.' },
      { id: 'n72', name: 'Elentarien Tathariel', role: 'Captain of the Guard', status: 'Active', faction: "Quynthe'ra", notes: 'High Elf guard captain.' },
      { id: 'n73', name: 'Areniel Calaelen', role: 'Priestess of Fi\'harta', status: 'Active', faction: "Quynthe'ra", notes: "Serves Fi'harta, Elven God of Wisdom." },
    ],
  },

  // ── VERIDORA / THE MOORS ────────────────────────────────────────────────

  {
    id: 'rookvale',
    name: 'Rookvale',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n74', name: 'Nathaniel Grey', role: 'Fisherman', status: 'Active', faction: 'Rookvale', notes: 'Owns a small fishing business on the lake.' },
      { id: 'n75', name: 'Keiran Willoughsby', role: 'Innkeeper', status: 'Active', faction: 'Rookvale', notes: 'Host at the famous Rookvale Inn on the lake shore.' },
      { id: 'n76', name: 'Gwendolyn Hunt', role: 'Mayor', status: 'Active', faction: 'Rookvale', notes: 'Makwetan. Strong advocate for preservation of Sylvan Grove.' },
      { id: 'n77', name: 'Victor Thorne', role: 'Boat Builder', status: 'Active', faction: 'Rookvale', notes: "Veridoran. Owner of Thorn's Boatworks." },
      { id: 'n78', name: 'Isabella Greene', role: 'Healer / Herbalist', status: 'Active', faction: 'Rookvale', notes: 'Brunar. Deep knowledge of Sylvan Grove plants. Author of The Unfettered Power of Love.' },
      { id: 'n79', name: 'Jasper Black', role: 'Lumberjack', status: 'Active', faction: 'Rookvale', notes: 'Veridoran. Owns a small lumber mill.' },
      { id: 'n80', name: 'Grace Wilson', role: 'Schoolteacher', status: 'Active', faction: 'Rookvale', notes: 'Veridoran. Educates the youth of Rookvale.' },
      { id: 'n81', name: 'Oliver Stone', role: 'Blacksmith', status: 'Active', faction: 'Rookvale', notes: 'Veridoran. Crafts tools and weapons.' },
      { id: 'n82', name: "Aiden Daenylor'el", role: 'Druid', status: 'Active', faction: 'Rookvale', notes: "High Elf. Resides in Sylvan Grove. Liaison between city and forest." },
    ],
  },

  {
    id: 'kanthel',
    name: "Kan'Thel",
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n83', name: "Gruk'thak", role: 'Warrior', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From Razor\'s Point. Wields massive warhammer with deadly precision.' },
      { id: 'n84', name: "Zo'ggar", role: 'Guerrilla Fighter', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From The Frozen Bog. Expert in guerrilla tactics and ambushes.' },
      { id: 'n85', name: 'Throknar', role: 'Warrior', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From The Frozen Bog. Wields double-bladed axe.' },
      { id: 'n86', name: 'Drakka', role: 'Hand-to-Hand Fighter', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From Razor\'s Point. Master of unarmed combat.' },
      { id: 'n87', name: 'Garr', role: 'Shield Warrior', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From The Frozen Bog. Resilient defender protecting allies.' },
      { id: 'n88', name: 'Bruna', role: 'Scout', status: 'Active', faction: "Kan'Thel Orcs", notes: "From Razor's Point. Stealth infiltrator, gathers intelligence." },
      { id: 'n89', name: 'Skara', role: 'Berserker', status: 'Active', faction: "Kan'Thel Orcs", notes: 'From The Frozen Bog. Fierce berserker fueled by battle rage.' },
    ],
  },

  {
    id: 'serenea',
    name: 'Serenea',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n90', name: 'Ambrose Dawr', role: 'Leader', status: 'Active', faction: "Cath'vari", notes: 'Wise and revered leader of Serenea.' },
      { id: 'n91', name: 'Lysandiera Dawr', role: 'Huntress', status: 'Active', faction: "Cath'vari", notes: 'Skilled hunter with bow. Leads hunting parties.' },
      { id: 'n92', name: 'Aurelius Wielay', role: 'Shaman', status: 'Active', faction: "Cath'vari", notes: 'Spiritual guide and healer. Communicates with land spirits.' },
      { id: 'n93', name: 'Nyx', role: 'Scout', status: 'Active', faction: "Cath'vari", notes: 'Cunning resourceful scout patrolling misty forests.' },
      { id: 'n94', name: 'Evander Swiftstrike', role: 'Captain of the Guard', status: 'Active', faction: "Cath'vari", notes: 'Honorable warrior leading settlement defense.' },
      { id: 'n95', name: 'Isadora Willow', role: 'Ambassador', status: 'Active', faction: "Cath'vari", notes: 'Graceful diplomat representing Serenea with neighboring communities.' },
      { id: 'n96', name: 'Orion Swyftpaw', role: 'Explorer', status: 'Active', faction: "Cath'vari", notes: 'Adventurous explorer seeking knowledge beyond Serenea.' },
      { id: 'n97', name: 'Selene Frostfur', role: 'Elder', status: 'Active', faction: "Cath'vari", notes: 'Kind-hearted matriarchal elder offering wisdom and counsel.' },
    ],
  },

  {
    id: 'falhzer',
    name: 'Falhzer',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n98', name: 'Captain Brynja', role: 'City Guard Captain', status: 'Active', faction: 'Falhzer', notes: 'Seasoned and courageous leader protecting city from disasters and bandits.' },
      { id: 'n99', name: 'Elara', role: 'Fishing Business Owner', status: 'Active', faction: 'Falhzer', notes: 'Skilled charismatic owner of successful fishing business.' },
      { id: 'n100', name: 'Gareth', role: 'Engineer / Architect', status: 'Active', faction: 'Falhzer', notes: 'Rebuilding and fortifying avalanche-damaged structures.' },
      { id: 'n101', name: 'Lyra', role: 'Thief', status: 'Active', faction: 'Independent', notes: 'Swift agile thief infamous for daring heists on traders and merchants.' },
      { id: 'n102', name: 'Thrain Elkhid', role: 'Adventurer / Guide', status: 'Active', faction: 'Independent', notes: 'Rugged experienced adventurer, serves as guide for travelers.' },
      { id: 'n103', name: 'Mirabelle', role: 'Herbalist / Healer', status: 'Active', faction: 'Falhzer', notes: 'Gifted herbalist with natural remedies for avalanche and bandit injuries.' },
      { id: 'n104', name: 'Aldrick Cole', role: 'Elder / Historian', status: 'Active', faction: 'Falhzer', notes: 'Wise respected elder, unofficial historian and mediator.' },
      { id: 'n105', name: 'Kaelen Caladon', role: 'Mage / Investigator', status: 'Active', faction: 'Independent', notes: 'Mysterious mage investigating the surge of bandit activity.' },
    ],
  },

  {
    id: 'broken-cathedral',
    name: 'Broken Cathedral',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n106', name: 'Valrik Panaarii', role: 'Treasure Hunter', status: 'Active', faction: 'Independent', notes: 'Seasoned and embittered treasure hunter who has claimed the Cathedral as his domain.' },
      { id: 'n107', name: "Tyri'Fon Eboneir", role: 'Guardian Druid', status: 'Active', faction: 'House Eboneir', notes: "Half-elf druid continuing House Eboneir's guardianship of the ruins. Cousins with Alesia." },
    ],
  },

  {
    id: 'deadbrook',
    name: 'Deadbrook',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n108', name: 'Edgar Pembroke', role: 'Elder', status: 'Active', faction: 'Deadbrook / Auric Order', notes: 'Wise and respected elder, wealth of knowledge.' },
      { id: 'n109', name: 'Beatrice Hawthorne', role: 'Healer', status: 'Active', faction: 'Deadbrook', notes: 'Kind-hearted healer offering remedies and comfort.' },
      { id: 'n110', name: 'Arthur Whitmore', role: 'Blacksmith', status: 'Active', faction: 'Deadbrook', notes: 'Skilled blacksmith crafting exquisite metalwork and weapons.' },
      { id: 'n111', name: 'Victoria Somerset', role: 'Council Member', status: 'Active', faction: 'Deadbrook', notes: 'Charismatic and influential town council figure.' },
      { id: 'n112', name: 'Amelia Fairchild', role: 'Tavern Owner', status: 'Active', faction: 'Deadbrook', notes: 'Owns the local tavern, hub of Deadbrook social life.' },
      { id: 'n113', name: 'Percival Ashcroft', role: 'Storyteller', status: 'Active', faction: 'Deadbrook', notes: "Charismatic storyteller regaling tales of the town's mysterious past." },
      { id: 'n114', name: 'Isabella Worthington', role: 'Artist', status: 'Active', faction: 'Deadbrook', notes: 'Talented artist capturing beauty of the moors in paintings.' },
      { id: 'n115', name: 'Reginald Sinclair', role: 'Fisherman', status: 'Active', faction: 'Deadbrook', notes: 'Adventurous fisherman venturing treacherous waters.' },
      { id: 'n116', name: 'Genevieve Middleton', role: 'Scholar', status: 'Active', faction: 'Deadbrook', notes: 'Young ambitious scholar researching marshland history and folklore.' },
      { id: 'n117', name: 'Frederick Hastings', role: 'Gentleman', status: 'Active', faction: 'Deadbrook', notes: 'Well-dressed with deep connections to surrounding towns.' },
    ],
  },

  {
    id: 'shevar-altar',
    name: "Shevar's Altar",
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n118', name: 'Vella Bernfitlacks', role: 'Auric Order / Alchemist', status: 'Active', faction: 'Auric Order', notes: 'Gnome with crimson hair. Oversees Shevar\'s Altar offerings. Skilled alchemist and gemologist.' },
    ],
  },

  {
    id: 'elddim',
    name: 'Elddim',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n119', name: 'Archibald Davenport', role: 'Chief Engineer', status: 'Active', faction: 'Elddim', notes: 'Oversees all major technological projects in the city.' },
      { id: 'n120', name: 'Victoria Whitman', role: 'Academy Head', status: 'Active', faction: 'Elddim', notes: 'Head of the Elddim Academy of Science and Technology.' },
      { id: 'n121', name: 'Corben Thorne', role: 'Factory Owner', status: 'Active', faction: 'Elddim', notes: 'Owner of Blackwood Manufacturing.' },
      { id: 'n122', name: 'Madeline Grey', role: 'Mayor', status: 'Active', faction: 'Elddim', notes: 'Mayor of Elddim.' },
      { id: 'n123', name: 'Oliver Sterling', role: 'Businessman', status: 'Active', faction: 'Elddim', notes: 'Wealthy businessman, owns several factories and mines.' },
      { id: 'n124', name: 'Dr. Theodore Reynolds', role: 'Surgeon', status: 'Active', faction: 'Elddim', notes: 'Renowned surgeon running a private medical practice.' },
      { id: 'n125', name: 'Isabella Hawthorne', role: 'Inventor / Mechanic', status: 'Active', faction: 'Elddim', notes: 'Skilled inventor owning a small workshop.' },
      { id: 'n126', name: 'Captain William Cross', role: 'City Guard Commander', status: 'Active', faction: 'Elddim', notes: 'Commander of the Elddim City Guard.' },
      { id: 'n127', name: 'Professor Amelia Knight', role: 'Historian / Archaeologist', status: 'Active', faction: 'Elddim', notes: 'Works at the Elddim Museum of Natural History.' },
      { id: 'n128', name: 'Henry Donovan', role: 'Editor', status: 'Active', faction: 'Elddim', notes: 'Chief editor of the Elddim Daily Gazette.' },
    ],
  },

  {
    id: 'old-lagoon',
    name: 'Old Lagoon',
    region: 'Veridora / The Moors',
    npcs: [
      { id: 'n129', name: 'Xannek Jartall', role: 'Barbarian', status: 'Active', faction: 'Independent', notes: 'Hulking battle-hardened Tortle. Consumed by vengeance after his tribe was slaughtered by bandits.' },
    ],
  },

  // ── VERIDORA / THE LOWLANDS ─────────────────────────────────────────────

  {
    id: 'razors-point',
    name: "Razor's Point",
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n130', name: 'Grommash Blackgnash', role: 'Clan Chieftain', status: 'Active', faction: "Gra'adok Clan", notes: 'Formidable leader of the Gra\'adok Clan.' },
      { id: 'n131', name: 'Draka Hellhammer', role: 'Clan General', status: 'Active', faction: "Gra'adok Clan", notes: 'Tactical brilliance, commands clan respect.' },
      { id: 'n132', name: 'Grimgor Omenarr', role: 'Clan Executioner', status: 'Active', faction: "Gra'adok Clan", notes: 'Unbridled rage, unmatched ferocity.' },
      { id: 'n133', name: "Zargoth Tora'el", role: 'Clan Shaman', status: 'Active', faction: "Gra'adok Clan", notes: 'Respected and revered clan spiritual leader.' },
      { id: 'n134', name: 'Vorka', role: 'Clan Firecaller', status: 'Active', faction: "Gra'adok Clan", notes: 'Orcish sorcerer harnessing destructive fire magic.' },
    ],
  },

  {
    id: 'karak-byrn',
    name: 'Karak Byrn / Khazad',
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n135', name: 'Haldor Yewhammer', role: 'Clan Leader', status: 'Active', faction: 'YewHammer Clan', notes: 'Resolute and experienced leader overseeing all mining operations.' },
      { id: 'n136', name: "Ghre'nar Grim-Thorne", role: 'Blacksmith', status: 'Active', faction: 'YewHammer Clan', notes: 'Half-dwarf blacksmith secretly living among the dwarves. Father of Durnik and Durhnae Thorne.' },
      { id: 'n137', name: 'Grungar Graniteshield', role: 'Warrior', status: 'Active', faction: 'YewHammer Clan', notes: 'Mountain dwarf warrior. Childhood friends with Ulfgar in Lilith\'iel.' },
      { id: 'n138', name: 'Gunnar Elkhid', role: 'Elite Guard Captain', status: 'Active', faction: 'YewHammer Clan', notes: 'Stalwart defender, captain of the elite guard.' },
      { id: 'n139', name: 'Freydis Graniteheart', role: 'Miner', status: 'Active', faction: 'YewHammer Clan', notes: 'Skilled and tenacious miner, renowned for finding rich veins.' },
      { id: 'n140', name: 'Sigrun Forgewinter', role: 'Merchant', status: 'Active', faction: 'YewHammer Clan', notes: 'Shrewd merchant handling trade negotiations.' },
      { id: 'n141', name: 'Sigrid Stonegaze', role: 'Elder', status: 'Active', faction: 'YewHammer Clan', notes: 'Wise revered elder, keeper of clan history and traditions.' },
    ],
  },

  {
    id: 'hadmont',
    name: 'Hadmont',
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n142', name: 'Artalis', role: "Be'lnariani Paladin", status: 'Active', faction: 'Hadmont', notes: "Valiant Human Be'lnariani Paladin. Beacon of hope and protection." },
      { id: 'n143', name: 'King Praetor', role: 'Ruler of Hadmont', status: 'Active', faction: 'Hadmont', notes: 'Facing pressure from Avalora to join the Sovereign Kingdom. Undecided.' },
      { id: 'n144', name: 'Captain Reynard', role: 'Royal Guard Captain', status: 'Active', faction: 'Hadmont', notes: 'Fiercely loyal to King Praetor.' },
      { id: 'n145', name: 'Ambassador Jarek', role: 'Avalorian Ambassador', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Trying to convince King Praetor to join the Sovereign Kingdom.' },
      { id: 'n146', name: 'Prince Lysander', role: 'Crown Prince', status: 'Active', faction: 'Hadmont', notes: 'Son of King Praetor. Young but strong sense of justice.' },
      { id: 'n147', name: 'Lady Isadora', role: 'Royal Advisor / Sorceress', status: 'Active', faction: 'Hadmont', notes: 'Powerful sorceress and royal advisor. Distrustful of outsiders.' },
      { id: 'n148', name: 'General Mordecai', role: 'Army Leader', status: 'Active', faction: 'Hadmont', notes: 'Pragmatic and ruthless military strategist.' },
      { id: 'n149', name: 'Captain Suri', role: 'Royal Guard', status: 'Active', faction: 'Sovereign Kingdom (secret)', notes: 'Secretly working with Avalorian ambassador to undermine King Praetor.' },
      { id: 'n150', name: 'Sir Tristan', role: 'Navy Commander', status: 'Active', faction: 'Hadmont', notes: 'Fiercely loyal to King Praetor, protects borders and trade routes.' },
      { id: 'n151', name: 'Lady Celeste', role: 'Merchant / Philanthropist', status: 'Active', faction: 'Hadmont', notes: 'Wealthy merchant, owns several ships in the Hadmont Navy.' },
      { id: 'n152', name: 'Lord Kael', role: 'Noble', status: 'Active', faction: "Thieves' Guild", notes: "Powerful noble secretly aligned with the thieves' guild." },
      { id: 'n153', name: 'Druella', role: 'Reclusive Citizen', status: 'Active', faction: 'Hadmont', notes: "Won't see visitors unless they have news of her father, Alexander." },
      { id: 'n154', name: 'Rosie Quill', role: 'Civilian', status: 'Active', faction: 'Hadmont', notes: 'Scrappy young woman living in a run-down cottage on the outskirts.' },
      { id: 'n155', name: 'Thomas Warren', role: 'Bricklayer', status: 'Active', faction: 'Hadmont', notes: 'Middle-aged bricklayer. Lives in run-down apartment with wife and three children.' },
    ],
  },

  {
    id: 'great-oak-forest',
    name: 'Great Oak Forest',
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n156', name: 'Efamos', role: 'Satyr Guide', status: 'Active', faction: 'Great Oak Forest', notes: 'Lively and jovial Satyr with deep knowledge of forest secrets.' },
      { id: 'n157', name: 'Gideon', role: 'Hedgewizard', status: 'Active', faction: 'Great Oak Forest', notes: 'Eccentric reclusive wizard. Master of herbology and mystical arts.' },
      { id: 'n158', name: 'Erisa', role: 'Ebonshroud Cultist', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Mysterious figure spreading corruption in the forest for the Ebonshroud Hand.' },
      { id: 'n159', name: 'Thistle', role: 'Woodland Elf Ranger', status: 'Active', faction: 'Great Oak Forest', notes: 'Guardian of the woodland. Fierce protector of forest and inhabitants.' },
      { id: 'n160', name: 'Tholgrimm "Brumble"', role: 'Treant Guardian', status: 'Active', faction: 'Great Oak Forest', notes: "Massive ancient Treant. Living embodiment of the forest's spirit. Protector and judge." },
    ],
  },

  {
    id: 'ebba',
    name: 'Ebba',
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n161', name: 'Adelaide Beckwith', role: 'Shop Owner / Dancing Needle', status: 'Active', faction: 'Ebba', notes: 'Kind smile and soft spoken. Runs the Dancing Needle.' },
      { id: 'n162', name: 'Mayor Ephraim Blackwood', role: 'Mayor', status: 'Active', faction: 'Ebba', notes: 'Controls a small Veridoran navy trading with Valorhold.' },
      { id: 'n163', name: 'Barnaby Anderton', role: 'Potion Maker / Apothecary', status: 'Active', faction: 'Ebba', notes: 'Skilled potion maker running a small apothecary.' },
      { id: 'n164', name: 'Cressida Clayden', role: 'Healer', status: 'Active', faction: 'Ebba', notes: 'Runs a small clinic, skilled in traditional and magical healing.' },
      { id: 'n165', name: 'Dorian Deighton', role: 'Reclusive Inventor', status: 'Active', faction: 'Ebba', notes: 'Lives in a clock tower on the outskirts of town.' },
      { id: 'n166', name: 'Alec Bythesea', role: 'Blacksmith', status: 'Active', faction: 'Ebba', notes: 'Skilled blacksmith crafting exceptional quality weapons and armor.' },
      { id: 'n167', name: 'Gwendolyn Fernsby', role: 'Enchantress / Fashion', status: 'Active', faction: 'Ebba', notes: 'Powerful enchantress owning a high-end fashion boutique.' },
      { id: 'n168', name: 'Harriet Honeysue', role: 'Baker', status: 'Active', faction: 'Ebba', notes: 'Runs a pastry shop in the town square.' },
      { id: 'n169', name: 'Isadora Winterbourne', role: 'Fortune Teller', status: 'Active', faction: 'Ebba', notes: 'Operates a small fortune telling tent in the town square.' },
      { id: 'n170', name: 'Jasper Ainsley', role: 'Smuggler / Thief', status: 'Active', faction: "Black Market", notes: 'Notorious thief running a black market in underground tunnels.' },
      { id: 'n171', name: 'Lucinda Bentham', role: 'Bard', status: 'Active', faction: 'Ebba', notes: 'Performs at the local tavern.' },
      { id: 'n172', name: 'Hador Brunmar', role: 'Fire Mage / Blacksmith', status: 'Active', faction: 'Ebba', notes: 'Powerful fire mage running a forge in the town square.' },
      { id: 'n173', name: 'Nathaniel Bentham', role: 'Spy Network', status: 'Active', faction: 'Independent', notes: 'Mysterious son of Lucinda Bentham, operates a spy network.' },
      { id: 'n174', name: 'Octavia Anderton', role: 'High Priestess', status: 'Active', faction: 'Ebba', notes: 'Daughter of Barnaby Anderton.' },
      { id: 'n175', name: 'Peregrine Thomas', role: 'Ranger', status: 'Active', faction: 'Ebba', notes: 'Operates a hunting lodge on the outskirts of town.' },
      { id: 'n176', name: 'Quintus Thaddeus Corellan', role: 'Weather Mage', status: 'Active', faction: 'Ebba', notes: 'Operates a small weather station on the edge of town.' },
      { id: 'n177', name: 'Rosalind Abraham', role: 'Botanist', status: 'Active', faction: 'Ebba', notes: 'Runs a greenhouse on the edge of town.' },
      { id: 'n178', name: 'Sebastian Otto', role: "Thieves' Guild Leader", status: 'Active', faction: "Assassins' / Thieves' Guild", notes: "Notorious thief and leader of the thieves' guild that currently runs the town." },
    ],
  },

  {
    id: 'veiled-knolls',
    name: 'The Veiled Knolls',
    region: 'Veridora / The Lowlands',
    npcs: [
      { id: 'n179', name: 'Solaris', role: "Shop Owner / Solaris' Wonderful Wares", status: 'Active', faction: 'Veiled Knolls', notes: 'Owns a shop at the center of The Veiled Knolls.' },
      { id: 'n180', name: 'Doc Robineir', role: 'Sheriff', status: 'Active', faction: 'Veiled Knolls', notes: 'Small-time sheriff keeping law while Mayor deals with bridge issue.' },
      { id: 'n181', name: 'Brother Harn', role: 'Priest', status: 'Active', faction: 'Veiled Knolls', notes: 'Devout and dedicated priest, caretaker of the temple.' },
      { id: 'n182', name: 'Marla Merritt', role: "Tavern Owner / Marla's Tavern", status: 'Active', faction: 'Veiled Knolls', notes: 'Popular spot for locals and travelers to drink and socialize.' },
      { id: 'n183', name: 'Vico Lockwood', role: 'Trapper', status: 'Active', faction: 'Veiled Knolls', notes: 'Gruff but skilled trapper selling furs and animal goods.' },
      { id: 'n184', name: 'Shelly Viola', role: 'Apothecary', status: 'Active', faction: 'Veiled Knolls', notes: 'Quirky woman selling potions and remedies from local flora and fauna.' },
      { id: 'n185', name: 'Garret Rayne', role: 'Gambler / Underground Casino', status: 'Active', faction: 'Independent', notes: 'Charming but shady gambler. Runs underground casino. Planning to rob the local bank.' },
      { id: 'n186', name: 'Marcus Crossley', role: 'Mercenary Company Leader', status: 'Active', faction: 'Independent', notes: 'Grizzled veteran running a small mercenary company out of town.' },
      { id: 'n187', name: 'Silar Tugal', role: 'Hedgewizard Scholar', status: 'Active', faction: 'Independent', notes: 'Reclusive but brilliant scholar living on the outskirts of town.' },
    ],
  },

  // ── VERIDORA / CORREN RANGE ─────────────────────────────────────────────

  {
    id: 'lycharrow',
    name: 'Lycharrow',
    region: 'Veridora / Corren Range',
    npcs: [
      { id: 'n188', name: 'Ulfgar', role: 'Warrior / Village Leader', status: 'Active', faction: "Taer'anari", notes: 'Seasoned warrior known for strategic brilliance and fierce loyalty. Childhood friends with Grungar Graniteshield.' },
      { id: 'n189', name: 'Runa', role: 'Huntress / Tracker', status: 'Active', faction: "Taer'anari", notes: 'Skilled huntress with silver-colored fur. Quick reflexes.' },
      { id: 'n190', name: 'Fenrir', role: 'Blacksmith / Armorer', status: 'Active', faction: "Taer'anari", notes: 'Master craftsman forging weapons from forest materials.' },
      { id: 'n191', name: 'Hati Howl', role: 'Hedgewizard / Spiritual Guide', status: 'Active', faction: "Taer'anari", notes: 'Skilled in the arcane arts. Healing and guidance for the community.' },
      { id: 'n192', name: 'Sif', role: 'Scout / Scoutmaster', status: 'Active', faction: "Taer'anari", notes: 'Unparalleled knowledge of forest terrain and hidden trails.' },
      { id: 'n193', name: 'Vidar', role: 'Elder', status: 'Active', faction: "Taer'anari", notes: 'Wise elder, repository of ancient wisdom and folklore.' },
      { id: 'n194', name: 'Freida', role: 'Young Warrior', status: 'Active', faction: "Taer'anari", notes: 'Daring and adventurous young Taer\'anari eager to prove herself.' },
      { id: 'n195', name: 'Hrall Ur', role: 'Sorcerer of the Trackbind', status: 'Active', faction: "Taer'anari", notes: "Taer'anari sorcerer." },
    ],
  },

  {
    id: 'golgotha-pass',
    name: 'Golgotha Pass',
    region: 'Veridora / Corren Range',
    npcs: [
      { id: 'n196', name: 'Gruglak', role: 'Ogre Leader', status: 'Active', faction: 'Ogre Band', notes: 'Imposing leader of the ogre band that lurks in Golgotha Pass. Cunning and brutal.' },
      { id: 'n197', name: 'Mogg', role: 'Scout', status: 'Active', faction: 'Ogre Band', notes: 'Fastest and most agile ogre. Silent traversal of narrow trails, ambushes travelers.' },
      { id: 'n198', name: 'Snarlag', role: 'Brute', status: 'Active', faction: 'Ogre Band', notes: 'Unmatched physical strength. Fiercely loyal to Gruglak.' },
      { id: 'n199', name: 'Grotha', role: 'Strategist', status: 'Active', faction: 'Ogre Band', notes: 'Cunning strategist devising ambush plans using rugged terrain.' },
    ],
  },

  {
    id: 'corren-mines',
    name: 'Corren Mountain Mines',
    region: 'Veridora / Corren Range',
    npcs: [
      { id: 'n200', name: 'King Dalothaeck Grimrock', role: 'Clan King', status: 'Unknown', faction: 'Grimrock Clan', notes: 'Ruler of the Grimrock Clan. Part of the Luminary (with King Aric and Edwin Thorne). Banished Grimrock Clan to Stygia to protect steam engine origins.' },
      { id: 'n201', name: 'Ermmiir Adgrun', role: 'Chief Engineer', status: 'Unknown', faction: 'Grimrock Clan', notes: 'Chief engineer and architect of the clan tunnel network.' },
      { id: 'n202', name: 'Durnik Grim-Thorne', role: 'Warrior', status: 'Active', faction: 'Grimrock Clan', notes: "Son of Ghre'nar Grim-Thorne. Newest member of the Grimrock Clan." },
      { id: 'n203', name: 'Krag Adgrun', role: 'Master Blacksmith', status: 'Unknown', faction: 'Grimrock Clan', notes: 'Master blacksmith and weaponsmith. Crafts finest weapons in Soteria.' },
      { id: 'n204', name: 'Thora Grimrock', role: 'Warrior / Armed Forces Leader', status: 'Unknown', faction: 'Grimrock Clan', notes: "Daughter to the king. Leader of Corren Mountain's armed forces." },
      { id: 'n205', name: 'Grimgor Daergus', role: 'Warrior', status: 'Unknown', faction: 'Grimrock Clan', notes: 'Fierce and brutal warrior, feared throughout Soteria.' },
      { id: 'n206', name: 'Gherhart Daergus', role: 'Mine Keeper', status: 'Active', faction: 'Grimrock Clan', notes: 'Left behind to maintain the mines while the rest of the clan vanished.' },
      { id: 'n207', name: "Rôk Doraruk", role: 'Orc Warlord', status: 'Active', faction: 'Ebonshroud Hand / Cult of Thorns', notes: 'Malevolent orc warlord now ruling the abandoned mines. Allied with Ebonshroud Hand and Cult of Thorns.' },
    ],
  },

  {
    id: 'aldermore',
    name: 'Aldermore',
    region: 'Veridora / Corren Range',
    npcs: [
      { id: 'n208', name: 'Silas Blackwood', role: 'Blacksmith', status: 'Active', faction: 'Aldermore', notes: "Most affluent member of Aldermore's society. Finest weapons and armor in the region." },
      { id: 'n209', name: 'Abigail Stone', role: 'General Store Owner', status: 'Active', faction: 'Aldermore', notes: 'Kind and friendly owner of the local general store.' },
      { id: 'n210', name: 'Ethan Rivers', role: 'Fisherman', status: 'Active', faction: 'Aldermore', notes: 'Solitary fisherman making his living on the nearby lake.' },
      { id: 'n211', name: 'Lillian Grey', role: 'Healer / Spiritual Advisor', status: 'Active', faction: "Ruehnar's Temple", notes: "Keeper of the altar to Ruehnar, Human Goddess of Love." },
      { id: 'n212', name: 'Jonas Kane', role: 'Militia Captain', status: 'Active', faction: 'Aldermore', notes: "Captain of the town's small militia. Stern and serious." },
      { id: 'n213', name: 'Sarah Mercer', role: 'Tavern Owner', status: 'Active', faction: 'Aldermore', notes: 'Owner of the local tavern, popular gathering spot.' },
    ],
  },

  // ── VERIDORA / ALDER LAKE ───────────────────────────────────────────────

  {
    id: 'ashendell',
    name: 'Ashendell',
    region: 'Veridora / Alder Lake',
    npcs: [
      { id: 'n214', name: 'Edwin Thorne', role: 'Industrialist / Luminary', status: 'Active', faction: 'Thorne Industries / Luminary', notes: 'Wealthy industrialist. Member of the Luminary alongside King Aric and King Dalothaeck. Son potentially being sent to Embrelyn boarding school.' },
      { id: 'n215', name: 'E.S. Beaumont', role: 'Circus Owner', status: 'Active', faction: 'Ashendell', notes: 'Owner of The Grand Ashendellian Circus in the NE magical district.' },
      { id: 'n216', name: "Gul'dan", role: 'Circus Attraction', status: 'Active', faction: 'Ashendell', notes: "Orc on display at The Grand Ashendellian Circus." },
      { id: 'n217', name: 'Kendric Alastair', role: 'Conglomerate Owner', status: 'Active', faction: 'Alastair Enterprises', notes: 'Owner of Alastair Enterprises specializing in trade, banking, and manufacturing.' },
      { id: 'n218', name: 'Daernur Daergus', role: 'Dwarf Warrior', status: 'Active', faction: 'Grimrock Clan', notes: "Rugged dwarf from Ashendell seeking answers about his clan's whereabouts." },
      { id: 'n219', name: 'Madame Effigia', role: 'Brothel Owner', status: 'Active', faction: 'Ashendell', notes: 'Owner of Ashendellian brothel in the lower districts near the docks.' },
      { id: 'n220', name: 'Marianne Fairchild', role: 'Judge', status: 'Active', faction: 'Ashendell', notes: 'Respected judge and member of the city\'s judicial council.' },
      { id: 'n221', name: 'Araminta Fairchild', role: 'Author', status: 'Active', faction: 'Ashendell', notes: 'Daughter of Marianne Fairchild. Author of The Steam Engine, Will it Change the World?' },
      { id: 'n222', name: 'Aurelio Vittori', role: "Underground Thieves' Guild Leader", status: 'Active', faction: "Thieves' Guild", notes: "Leader of the Underground Thieves' Guild. Frequents Madame Effigia's." },
      { id: 'n223', name: 'Magus the Dwarf', role: 'Thief', status: 'Active', faction: 'Independent', notes: 'Thief and frequent patron of the Ashendell Gentlemen\'s club.' },
      { id: 'n224', name: 'Matthew Jameson', role: 'Civilian', status: 'Active', faction: 'Ashendell', notes: 'Lost the ring he was going to use to propose. Fell into an open manhole near city entrance.' },
    ],
  },

  {
    id: 'elmoire',
    name: 'Elmoire',
    region: 'Veridora / Alder Lake',
    npcs: [
      { id: 'n225', name: 'Moon', role: 'Satyr Bard', status: 'Active', faction: 'Elmoire', notes: 'Charismatic satyr bard with enchanting voice and pan flute mastery.' },
      { id: 'n226', name: 'Kep', role: 'Satyr Druid', status: 'Active', faction: 'Elmoire', notes: 'Guardian of Elmoire, protects the grove and communicates with animals.' },
      { id: 'n227', name: 'Brynn Wildstride', role: 'Satyr Rogue', status: 'Active', faction: 'Elmoire', notes: 'Cunning trickster and master of mischief. Skilled acrobat and stealthy.' },
    ],
  },

  // ── VERIDORA / BRIVIHAN PLAINS ──────────────────────────────────────────

  {
    id: 'wealdstone',
    name: 'Wealdstone',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n228', name: 'Cornell Fahrkus', role: 'Merchant', status: 'Active', faction: 'Wealdstone', notes: 'Wealthy merchant specializing in exotic spices and fabrics.' },
      { id: 'n229', name: 'Lydia Gurloes', role: 'Blacksmith', status: 'Active', faction: 'Wealdstone', notes: 'Talented blacksmith running a successful forge. Known for intricate metalwork.' },
      { id: 'n230', name: 'Nathaniel Zaprunder', role: 'Scholar / Historian', status: 'Active', faction: 'University of Arcane Studies', notes: 'Specializes in ancient Soterian history and culture.' },
      { id: 'n231', name: 'Amara Dove', role: 'Priestess of Ylandar', status: 'Active', faction: "Ylandar's Temple", notes: 'Deeply devoted to Ylandar, the god of truth and justice.' },
      { id: 'n232', name: 'Felix Grey', role: 'Street Performer', status: 'Active', faction: 'Wealdstone', notes: 'Acrobatics and juggling acts. Known for infectious energy and charm.' },
      { id: 'n233', name: 'Isabella Dolan', role: 'Crime Family Head', status: 'Active', faction: 'Dolan Family', notes: 'Head of the powerful Dolan family, controlling much of the underground criminal activity.' },
      { id: 'n234', name: 'Arthur Pembroke', role: 'Tavern Owner / Retired Adventurer', status: 'Active', faction: 'Wealdstone', notes: 'Retired adventurer running a popular tavern. Regales patrons with tales.' },
      { id: 'n235', name: 'Adira Stone', role: 'Apothecary', status: 'Active', faction: 'Wealdstone', notes: 'Skilled apothecary with potent and effective herbal remedies.' },
      { id: 'n236', name: 'Valeria Thorne', role: 'Painter / Artist', status: 'Active', faction: 'Wealdstone', notes: 'Talented painter creating landscapes and portraits of Wealdstone.' },
      { id: 'n237', name: 'Jameson Wolfe', role: 'City Guard Captain', status: 'Active', faction: 'Wealdstone', notes: 'Stern but fair leader maintaining law and order. Feared by criminals.' },
    ],
  },

  {
    id: 'riyadh',
    name: 'Riyadh',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n238', name: 'Galdrin Adnan', role: 'Warrior / Explorer', status: 'Active', faction: 'Brunar', notes: 'Seasoned Brunar warrior wielding a massive battle axe. Fearless explorer.' },
      { id: 'n239', name: 'Ajmalara Tariq', role: 'Scout / Tracker', status: 'Active', faction: 'Brunar', notes: 'Resourceful Brunar scout. Expert tracker and survivalist.' },
    ],
  },

  {
    id: 'lumina',
    name: 'Lumina',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n240', name: 'Orin Darrow', role: 'Slave Trader', status: 'Active', faction: 'Lumina Elite', notes: 'Dwarf. Wealthy slave trader owning several plantations.' },
      { id: 'n241', name: 'Mila Vance', role: 'Tavern Owner', status: 'Active', faction: 'Lumina', notes: 'Brunar. Former slave who now runs a small tavern in the slums.' },
      { id: 'n242', name: 'Marian Blaine', role: 'Corrupt Official', status: 'Active', faction: 'Lumina Government', notes: 'Veridoran. Corrupt government official overseeing the slave trade.' },
      { id: 'n243', name: 'Jasper Cole', role: 'Slave Trader Guard', status: 'Active', faction: 'Lumina', notes: 'Half-Orc. Former soldier now working as a guard for a slave trader.' },
      { id: 'n244', name: 'Ada Wright', role: 'Midwife', status: 'Active', faction: 'Independent', notes: 'Makwetan. Secretly helps deliver babies born to slaves.' },
      { id: 'n245', name: 'Samuel Brown', role: 'Merchant', status: 'Active', faction: 'Lumina Elite', notes: 'Veridoran. Wealthy merchant profiting off the slave trade.' },
      { id: 'n246', name: 'Althea Park', role: 'Orphan', status: 'Active', faction: 'Lumina', notes: 'Veridoran. Young girl orphaned after parents were sold into slavery.' },
      { id: 'n247', name: 'Jenson the Knife', role: 'Criminal', status: 'Active', faction: 'Underground', notes: 'Makwetan. Notorious criminal operating in slums, known for brutal tactics.' },
    ],
  },

  {
    id: 'embrelyn',
    name: 'Embrelyn',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n248', name: 'Geoffrey Teraldon Ashe', role: 'Corrupt Wizard', status: 'Active', faction: 'Embrelyn', notes: 'Rose to power through manipulation and deceit.' },
      { id: 'n249', name: 'Treyvin Teach', role: 'Captain', status: 'Active', faction: 'Independent', notes: 'Treacherous captain. Only one brave enough to sail South around the isle of Dorhaven.' },
      { id: 'n250', name: 'Lord Alden Westwick', role: 'Council Head', status: 'Active', faction: 'Council of Embrelyn', notes: 'Brunar. Wealthy nobleman serving as head of the council.' },
      { id: 'n251', name: 'Lady Sophia Blackwood', role: 'Council Member', status: 'Active', faction: 'Council of Embrelyn', notes: 'Shrewd businesswoman using influence to further her own interests.' },
      { id: 'n252', name: 'Sir Marcus Brightwood', role: 'Council Member / Knight', status: 'Active', faction: 'Council of Embrelyn', notes: 'Respected knight known for his sense of honor and duty.' },
      { id: 'n253', name: 'Father Gregory Stone', role: 'Council Member / Priest', status: 'Active', faction: 'Council of Embrelyn', notes: 'Devout priest worshiping Khoneus, God of Shadows.' },
      { id: 'n254', name: 'Master Roland Fenton', role: 'Council Member', status: 'Active', faction: 'Council of Embrelyn', notes: 'Herengon. Skilled craftsman overseeing trade and commerce.' },
      { id: 'n255', name: "S'ria Thorne", role: 'Adventurer', status: 'Active', faction: 'Independent', notes: "Granddaughter to Edwin Thorne. Avid adventurer often found in the darkest corners of taverns." },
      { id: 'n256', name: 'Gerrick', role: 'Tavern Runner / The Golden Griffin', status: 'Active', faction: 'Embrelyn', notes: 'Runner of The Golden Griffin tavern.' },
    ],
  },

  {
    id: 'new-harsten',
    name: 'New Harsten',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n257', name: "Ada'ia Ysayle", role: 'Master Jeweler', status: 'Active', faction: 'New Harsten', notes: 'Elven jeweler with a keen eye for rare gems. Runs a successful shop.' },
      { id: 'n258', name: 'Rurik Stormborn', role: 'Blacksmith', status: 'Active', faction: 'New Harsten', notes: 'Dwarf blacksmith renowned for forging powerful weapons and armor.' },
      { id: 'n259', name: 'Selia Adalgrim', role: 'Street Performer / Bard', status: 'Active', faction: 'New Harsten', notes: 'Young halfling storyteller and musician entertaining the streets.' },
      { id: 'n260', name: 'Halvor', role: 'Tavern Security', status: 'Active', faction: 'New Harsten', notes: 'Sturdy goliath keeping order among rowdy tavern patrons.' },
      { id: 'n261', name: 'Kraven Aleval', role: 'Information Broker', status: 'Active', faction: 'Independent', notes: 'Cunning and elusive kenku operating in the shadows. Best information broker in the business.' },
      { id: 'n262', name: 'Caelyn Wendle', role: 'Merchant', status: 'Active', faction: 'New Harsten', notes: 'Charismatic human merchant with vast trade contacts connecting distant lands.' },
      { id: 'n263', name: 'Elowen', role: 'Ranger / Guide', status: 'Active', faction: 'New Harsten', notes: 'Skilled elven ranger offering guide services to adventurers.' },
      { id: 'n264', name: 'Milo Bagwell', role: 'Crime Lord', status: 'Active', faction: 'Underground', notes: 'Shrewd halfling crime lord controlling a network of smugglers and thieves.' },
    ],
  },

  {
    id: 'heidborough',
    name: 'Heidborough',
    region: 'Veridora / Brivihan Plains',
    npcs: [
      { id: 'n265', name: 'Professor "Tinker" Leagallow', role: 'Inventor', status: 'Active', faction: 'Heidborough', notes: "Eccentric gnome inventor, mastermind behind many of the city's mechanical contraptions." },
      { id: 'n266', name: 'Bonnie Wellby', role: 'Alchemist', status: 'Active', faction: 'Heidborough', notes: 'Skilled gnome alchemist running a popular potion shop.' },
      { id: 'n267', name: 'Gimble', role: 'Head Librarian', status: 'Active', faction: 'Heidborough', notes: "Wise and knowledgeable gnome managing Heidborough's extensive library." },
      { id: 'n268', name: 'Captain Coppercoil', role: "Tinkerer's Guild Leader", status: 'Active', faction: "Tinkerer's Guild", notes: "Fearless leader of the city's tinkerer's guild. Skilled engineer and adventurer." },
      { id: 'n269', name: 'Ellie Lyle', role: 'Artificer', status: 'Active', faction: 'Heidborough', notes: 'Talented artificer crafting magical items and constructs.' },
      { id: 'n270', name: 'Tilda Lyle', role: 'Fortune Teller', status: 'Active', faction: 'Heidborough', notes: 'Jovial gnome fortune teller with surprisingly accurate readings.' },
      { id: 'n271', name: 'Finnan Cogwhistle', role: 'Chief Engineer / Architect', status: 'Active', faction: 'Heidborough', notes: "Chief engineer responsible for the city's quirky and ingenious architecture." },
    ],
  },

  // ── VERIDORA / CHRONOLITHE WASTES ──────────────────────────────────────

  {
    id: 'hlondeth',
    name: 'Hlondeth',
    region: 'Veridora / Chronolithe Wastes',
    npcs: [
      { id: 'n272', name: 'Kaelthas', role: 'Clan Leader', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Charismatic leader. Once a respected Yuan-Ti member, cast out for genetic experiments. Now leads Hlondeth.' },
      { id: 'n273', name: 'Seraffina', role: 'Shaman', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Mysterious and powerful shaman. Deeply connected to ancient land spirits.' },
      { id: 'n274', name: 'Sozsi', role: 'Rogue / Scout', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Cunning rogue, scout and lookout for the village. Cares deeply for villagers.' },
      { id: 'n275', name: 'Hihli', role: 'Trader', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Young Yuan-Ti halfblood establishing trade networks with neighboring settlements.' },
      { id: 'n276', name: 'Eldric', role: 'Village Elder', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Oldest member of Hlondeth. Village historian and advisor to Kaelthas.' },
      { id: 'n277', name: 'Mosa', role: 'Healer', status: 'Active', faction: 'Chronolithe Yuan-Ti', notes: 'Young Yuan-Ti halfblood with unique markings. Hidden talent for healing.' },
    ],
  },

  {
    id: 'bronze-doors',
    name: "Bronze Doors / Tarek'Mor",
    region: 'Veridora / Chronolithe Wastes',
    npcs: [
      { id: 'n278', name: 'Loghaire Graniteheart', role: 'Clan Leader', status: 'Active', faction: 'Graniteheart Clan', notes: 'Leader of the Graniteheart Clan.' },
      { id: 'n279', name: 'Drogan Banmur', role: 'Guard Captain', status: 'Active', faction: 'Graniteheart Clan', notes: 'Captain of the Graniteheart Guard.' },
      { id: 'n280', name: 'Theodrin Khargrim', role: 'Master Blacksmith', status: 'Active', faction: 'Graniteheart Clan', notes: 'Master blacksmith and weaponsmith.' },
      { id: 'n281', name: 'Rigor Dargarn', role: 'Stonemason / Architect', status: 'Active', faction: 'Graniteheart Clan', notes: 'Master stonemason and architect.' },
      { id: 'n282', name: 'Thelkom Khargrim', role: 'Chief Miner / Geologist', status: 'Active', faction: 'Graniteheart Clan', notes: 'Chief miner and geologist.' },
      { id: 'n283', name: 'Orion Dragarn', role: 'Treasury Head', status: 'Active', faction: 'Graniteheart Clan', notes: 'Head of the Graniteheart Treasury.' },
      { id: 'n284', name: 'Dulmir Khargrim', role: 'Master Brewer', status: 'Active', faction: 'Graniteheart Clan', notes: 'Master brewer and distiller.' },
      { id: 'n285', name: 'Bhaldor Grenram', role: 'Master Cook', status: 'Active', faction: 'Graniteheart Clan', notes: 'Master cook and baker.' },
      { id: 'n286', name: 'Galen Grenram', role: 'Warrior Trainer', status: 'Active', faction: 'Graniteheart Clan', notes: 'Trainer of the Graniteheart Warriors.' },
      { id: 'n287', name: 'Ori Graniteheart', role: 'Chief Scribe / Historian', status: 'Active', faction: 'Graniteheart Clan', notes: "Chief Scribe and Keeper of the Clan's Histories." },
    ],
  },

  {
    id: 'ruins-of-szar',
    name: 'Ruins of Szar',
    region: 'Veridora / Chronolithe Wastes',
    npcs: [
      { id: 'n288', name: "Astaria Darr'holm", role: 'Cult of Thorns / Enchantress', status: 'Active', faction: 'Cult of Thorns', notes: 'High-ranking member of the Cult of Thorns. Master of dark magic and manipulation.' },
      { id: 'n289', name: 'Lilith', role: 'Cult of Thorns / Rogue', status: 'Active', faction: 'Cult of Thorns', notes: 'Aarakocra rogue. Master of stealth, infiltration, and sabotage for the Cult.' },
      { id: 'n290', name: 'Aeloriax', role: 'Cursed Drake Knight', status: 'Active', faction: 'Independent', notes: 'Once-noble elven warrior transformed into draconic hybrid by forbidden ritual. Haunts the ruins. Tragic figure.' },
    ],
  },

  // ── VERIDORA / FALORN FJORDS ────────────────────────────────────────────

  {
    id: 'frostpeak',
    name: 'Frostpeak',
    region: 'Veridora / Falorn Fjords',
    npcs: [
      { id: 'n291', name: 'Hrothgar', role: 'Village Elder / Spiritual Leader', status: 'Active', faction: 'Goliath', notes: 'Wise and respected elder, keeper of ancient traditions and combat techniques.' },
      { id: 'n292', name: 'Sigrun', role: 'Chief Defender / Warrior', status: 'Active', faction: 'Goliath', notes: 'Fierce and skilled warrior leading the village militia.' },
      { id: 'n293', name: 'Khuvek', role: 'Master Blacksmith', status: 'Active', faction: 'Goliath', notes: 'Crafting exceptional weapons and armor from mountain materials.' },
      { id: 'n294', name: 'Strongjaw', role: 'Tracker / Scout', status: 'Active', faction: 'Goliath', notes: 'Skilled tracker scouting surroundings and warning of dangers.' },
      { id: 'n295', name: 'Vuma-Theaku', role: 'Storyteller / Historian', status: 'Active', faction: 'Goliath', notes: 'Gifted storyteller preserving oral traditions and histories.' },
    ],
  },

  {
    id: 'strange-pond',
    name: 'Strange Pond / Ebonshroud',
    region: 'Veridora / Falorn Fjords',
    npcs: [
      { id: 'n296', name: 'Draven Thorsteinsson', role: 'Ebonshroud Hand Leader', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Formidable leader of the Ebonshroud Hand. Strikes fear into allies and adversaries alike.' },
    ],
  },

  {
    id: 'frozen-bog',
    name: 'The Frozen Bog',
    region: 'Veridora / Falorn Fjords',
    npcs: [
      { id: 'n297', name: 'Warlord Grakar Gul\'danhrhock', role: 'Clan Warlord', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Fierce and imposing leader. Strategic brilliance and unmatched combat skills.' },
      { id: 'n298', name: 'Grommok Aakre', role: 'Veteran Advisor', status: 'Active', faction: "Gul'danhrhock Clan", notes: "Grakar's most trusted advisor. Vast knowledge of orcish warfare." },
      { id: 'n299', name: 'Drogar Fjordlord', role: 'Bodyguard', status: 'Active', faction: "Gul'danhrhock Clan", notes: "Towering warrior. Grakar's personal bodyguard." },
      { id: 'n300', name: 'Grukka Ghoran', role: 'Scout', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Cunning master of stealth and terrain navigation.' },
      { id: 'n301', name: 'Lazgul Aakre', role: 'Shaman', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Skilled shaman revered for communing with ancestor spirits.' },
      { id: 'n302', name: 'Uzgar Fjordlord', role: 'Blacksmith', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Master blacksmith forging formidable clan weapons and armor.' },
      { id: 'n303', name: 'Rogga Ghoran', role: 'Huntress', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Fierce agile orc huntress providing food for the clan.' },
      { id: 'n304', name: 'Skarnak Aakre', role: 'Warlock', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Talented warlock skilled in dark magic and Fel powers.' },
      { id: 'n305', name: 'Throkka Fjordlord', role: 'Elder', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Wise elder advising on diplomacy and ancestral customs.' },
      { id: 'n306', name: 'Zogrim Ghoran', role: 'Rogue / Spy', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Cunning infiltrator specializing in espionage and sabotage.' },
    ],
  },

  // ── THE PALE KEYS / AERITHOS ────────────────────────────────────────────

  {
    id: 'great-foundry',
    name: 'The Great Foundry',
    region: 'Aerithos',
    npcs: [
      { id: 'n307', name: "Rôk Pyne", role: 'Foundry Overseer', status: 'Active', faction: 'Great Foundry', notes: 'Gruff dwarf overseeing day-to-day operations. Fiercely loyal to workers.' },
      { id: 'n308', name: 'Lyra', role: 'Engineer', status: 'Active', faction: 'Great Foundry', notes: 'Half-elf engineer risen through the ranks. Seeks to make the foundry more sustainable.' },
      { id: 'n309', name: 'Lorne Kerwood', role: 'Merchant', status: 'Active', faction: 'Independent', notes: 'Wealthy merchant lobbying to relax pollution regulations for profit.' },
      { id: 'n310', name: 'Kira Stogrum', role: 'Activist', status: 'Active', faction: 'Local Community', notes: 'Fierce advocate for community harmed by foundry pollution.' },
      { id: 'n311', name: 'Agatha Forrelyth', role: 'Dwarven Council Member', status: 'Active', faction: 'Dwarven Council', notes: 'Torn between loyalty to dwarves and concern for the environment.' },
    ],
  },

  {
    id: 'mistcliff',
    name: 'Mistcliff',
    region: 'Aerithos',
    npcs: [
      { id: 'n312', name: 'High Appointed Yillaf Aeir', role: 'City Leader', status: 'Active', faction: 'Aarakocra', notes: 'Wise and diplomatic leader of Mistcliff. Balancing isolation with global engagement.' },
      { id: 'n313', name: 'Kalia Aeir', role: 'Young Hero in Training', status: 'Active', faction: 'Aarakocra', notes: "Spirited and ambitious daughter of Yillaf. Advocates for more active global involvement." },
      { id: 'n314', name: 'Gralierc Zirr', role: 'Military Advisor', status: 'Active', faction: 'Aarakocra', notes: 'Seasoned warrior and trusted advisor. Strategic military prowess.' },
      { id: 'n315', name: 'Elder Erred', role: 'Spiritual Leader', status: 'Active', faction: 'Aarakocra', notes: 'Spiritual leader of the solar temples. Deep divine connection.' },
      { id: 'n316', name: 'First Officer Akka Dekkea', role: 'Aerial Patrol Leader', status: 'Active', faction: 'Aarakocra', notes: "Courageous leader of the city's aerial patrol." },
      { id: 'n317', name: "Rulerc Ra'k", role: 'Diplomat', status: 'Active', faction: 'Aarakocra', notes: "Skilled diplomat maintaining Mistcliff's relations with other races." },
      { id: 'n318', name: 'Storm Soarsong', role: 'Master Artisan / Architect', status: 'Active', faction: 'Aarakocra', notes: "Creative mind behind Mistcliff's breathtaking structures." },
      { id: 'n319', name: 'Zara', role: 'Healer / Caretaker', status: 'Active', faction: 'Aarakocra', notes: 'Gifted healer tending to physical and emotional well-being.' },
      { id: 'n320', name: 'Rook Rhirref', role: 'Young Militant', status: 'Active', faction: 'Aarakocra', notes: 'Young Aarakocra militant dreaming of greatness.' },
      { id: 'n321', name: 'Liera Ewing', role: 'Changeling Spy', status: 'Active', faction: 'Unknown', notes: 'Enigmatic changeling successfully concealing identity among the Aarakocra for years.' },
      { id: 'n322', name: 'Vikarhen', role: 'Kenku Warrior', status: 'Active', faction: 'Aarakocra', notes: 'Daring Kenku warrior who has earned the respect of the Aarakocra. Courageous and loyal.' },
    ],
  },

  {
    id: 'falchons-ache',
    name: "Falchon's Ache",
    region: 'Aerithos',
    npcs: [
      { id: 'n323', name: 'High Scholar Jeliria', role: 'Wisdom Seekers Leader', status: 'Active', faction: "Fi'harta Temple", notes: "Venerable Aarakocra leading scholarly activities within Falchon's Ache." },
      { id: 'n324', name: "Thes'sara Eryndor", role: 'Mage Scholar', status: 'Active', faction: "Wisdom Seekers", notes: 'Young and ambitious elf adept mage. Seeks to expand understanding of arcane arts.' },
      { id: 'n325', name: 'Gorun Graniteheart', role: 'Metalworker / Craftsman', status: 'Active', faction: 'Wisdom Seekers', notes: "Dwarf artisan crafting intricate engravings depicting Fi'harta's teachings." },
      { id: 'n326', name: 'Lykia Aryiana', role: 'Kenku Guardian', status: 'Active', faction: 'Wisdom Seekers', notes: 'Inquisitive Kenku. Honed combat skills protecting the temple from pirates. Communicates through mimicry.' },
    ],
  },

  {
    id: 'araka',
    name: 'Araka',
    region: 'Aerithos',
    npcs: [
      { id: 'n327', name: 'Captain Shreik', role: 'Pirate Second-in-Command', status: 'Active', faction: 'Kenku Pirates', notes: 'Cunning and ruthless Kenku pirate. Master tactician. Harbors his own ambitions.' },
      { id: 'n328', name: 'Jackdaw', role: 'Thief / Con Artist', status: 'Active', faction: 'Kenku Pirates', notes: 'Mysterious Kenku. Skilled thief operating on the fringes. True motivations unknown.' },
      { id: 'n329', name: 'First Mate Cawthorn', role: 'First Mate', status: 'Active', faction: 'Kenku Pirates', notes: 'Former Sovereign Kingdom Navy. Defected for freedom. Wrestles with guilt over decision.' },
      { id: 'n330', name: 'Constance', role: 'Halfling Rogue / Double Agent', status: 'Active', faction: 'Sovereign Kingdom (secret)', notes: 'Mischievous halfling secretly gathering information to aid the Sovereign Kingdom Navy.' },
      { id: 'n331', name: 'Victor Aethra', role: 'Exiled Aarakocra Warrior', status: 'Active', faction: 'Independent', notes: 'Infiltrates Araka as a Kenku pirate. On a quest to retrieve stolen treasures and seek redemption.' },
    ],
  },

  {
    id: 'zephyria',
    name: 'Zephyria',
    region: 'Aerithos',
    npcs: [
      { id: 'n332', name: 'Lirien Garynnon', role: 'Shadow Mage', status: 'Active', faction: 'The Avid', notes: 'Master of shadow magic and illusion.' },
      { id: 'n333', name: 'Thalas Aelaf', role: 'Aeromancer', status: 'Active', faction: 'The Avid', notes: 'Skilled aeromancer, controls winds and can fly.' },
      { id: 'n334', name: 'Zaria Arnnun', role: 'Diviner', status: 'Active', faction: 'The Avid', notes: 'Adept diviner, sees glimpses of the future.' },
      { id: 'n335', name: 'Corvus Corraer', role: 'Necromancer', status: 'Active', faction: 'The Avid', notes: 'Master of necromancy, raises and controls the dead.' },
      { id: 'n336', name: 'Lyra Sunburst', role: 'Pyromancer', status: 'Active', faction: 'The Avid', notes: 'Prodigy of pyromancy. Summons and controls flames.' },
      { id: 'n337', name: 'Ophelia Keth-Ver', role: 'Enchanter', status: 'Active', faction: 'The Avid', notes: 'Skilled enchanter imbuing objects with magical properties.' },
      { id: 'n338', name: 'Orion Gaellaus', role: 'Cryomancer', status: 'Active', faction: 'The Avid', notes: 'Powerful cryomancer who can freeze foes and create ice walls.' },
      { id: 'n339', name: "Sylphie Uvon'n", role: 'Illusionist', status: 'Active', faction: 'The Avid', notes: 'Adept illusionist creating lifelike illusions and manipulating dreams.' },
      { id: 'n340', name: "Arcturus Key'wyn", role: 'Celestial Mage', status: 'Active', faction: 'The Avid', notes: 'Master of celestial magic, summons power of the stars.' },
      { id: 'n341', name: 'Vega Halthar', role: 'Necromancer / Spirit Caller', status: 'Active', faction: 'The Avid', notes: 'Skilled necromancer, summons and communicates with spirits of the dead.' },
      { id: 'n342', name: 'Malakar Adnan', role: 'First Darkweaver', status: 'Wanted', faction: 'Independent', notes: 'First Darkweaver. Branded enemy of Sovereign Kingdom by King Aric. Defeated by Eirik, the King\'s errant knight.' },
    ],
  },

  {
    id: 'coatl',
    name: 'Coatl',
    region: 'Aerithos',
    npcs: [
      { id: 'n343', name: 'High Priest Xiltotl', role: 'High Priest', status: 'Active', faction: 'Coatl Yuan-Ti', notes: 'Charismatic and ruthless leader. Uses fear and human sacrifice to maintain control.' },
      { id: 'n344', name: 'Lady L.V. Verdant', role: 'Noblewoman / Spy', status: 'Active', faction: 'House Verdant', notes: 'Pureblood Yuan-Ti secretly worshipping older gods. Skilled diplomat and spy.' },
      { id: 'n345', name: 'Lord Vaelin Verdant', role: 'House Patriarch', status: 'Active', faction: 'House Verdant', notes: 'Proud and noble pureblood. Torn between preserving House Verdant legacy and protecting family from heresy charges.' },
      { id: 'n346', name: 'Maya Hyrainth', role: 'Assassin / Spy', status: 'Active', faction: 'House Verdant', notes: 'Cunning half-blood Yuan-Ti spy and assassin loyal to House Verdant. Carries dark secrets.' },
    ],
  },

  // ── BERANTHES ───────────────────────────────────────────────────────────

  {
    id: 'avalora',
    name: 'Avalora',
    region: 'Beranthes',
    npcs: [
      { id: 'n347', name: 'King Aric', role: 'King of the Sovereign Kingdom', status: 'Active', faction: 'Sovereign Kingdom / Luminary', notes: 'Just and noble ruler beloved by his people. Member of the Luminary. Skilled strategist and commander.' },
      { id: 'n348', name: 'Captain Raza', role: 'Navy Captain', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Seasoned and respected military leader in the Avalorian navy.' },
      { id: 'n349', name: 'Thieflord Kael', role: "Thieves' Guild Leader", status: 'Active', faction: "Thieves' Guild", notes: "Ruthless leader of the thieves' guild in Avalora." },
      { id: 'n350', name: 'Advisor Ilphrin', role: 'Royal Advisor', status: 'Active', faction: 'Sovereign Kingdom', notes: "King Aric's trusted advisor. Known for sharp intellect and political acumen." },
      { id: 'n351', name: 'General Kethan Orensken', role: 'Army General', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Highly respected general. Symbol of strength and honor. Tactically brilliant.' },
      { id: 'n352', name: 'Baron Rrostarr', role: 'Noble', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Powerful and influential nobleman with considerable political influence.' },
    ],
  },

  {
    id: 'thetis',
    name: 'Thetis',
    region: 'Beranthes',
    npcs: [
      { id: 'n353', name: 'King Delphinus Pelagian', role: 'Nazari King', status: 'Active', faction: 'Nazari', notes: 'Wise and compassionate leader deeply attuned to the ocean.' },
      { id: 'n354', name: 'Flanrilyn Umuzath', role: 'Army Commander', status: 'Active', faction: 'Nazari', notes: 'Fierce and skilled commander of the Nazari army. Master of water and land combat.' },
      { id: 'n355', name: 'Naida Umuzath', role: 'Sorceress', status: 'Active', faction: 'Nazari', notes: 'Talented sorceress with deep elemental connection. Protects city from natural disasters.' },
      { id: 'n356', name: 'Vemres', role: 'Artisan / Jeweler', status: 'Active', faction: 'Nazari', notes: 'Master artisan crafting intricate sea-inspired jewelry.' },
      { id: 'n357', name: "Cilz'is Amorath", role: 'Musician / Performer', status: 'Active', faction: 'Nazari', notes: 'Gifted musician captivating audiences with sea-inspired songs and dance.' },
      { id: 'n358', name: 'Nereus', role: 'Emissary', status: 'Active', faction: 'Nazari', notes: 'Experienced emissary building diplomatic ties with land-based kingdoms.' },
    ],
  },

  // ── MAKEDA KWETU ────────────────────────────────────────────────────────

  {
    id: 'djekoto',
    name: 'Djekoto',
    region: 'Makeda Kwetu',
    npcs: [
      { id: 'n359', name: 'Chief Jahaira Wava', role: 'Matekwan Chief', status: 'Active', faction: 'Matekwan', notes: 'Wise and respected chief of Djekoto. Visionary leadership.' },
      { id: 'n360', name: 'Kaisa Iweala', role: 'Alchemist', status: 'Active', faction: 'Matekwan', notes: 'Talented Matekwan alchemist. Renowned potions and mastery of arcane arts.' },
      { id: 'n361', name: 'Tariq Jakande', role: 'Engineer / Airship Creator', status: 'Active', faction: 'Matekwan', notes: "Mastermind behind Djekoto's revolutionary flying airships." },
      { id: 'n362', name: 'Shura Nnebe', role: 'Sorcerer', status: 'Active', faction: 'Matekwan', notes: 'Matekwan Sorcerer harnessing mystical forces of nature.' },
      { id: 'n363', name: 'Mosi Jaja', role: 'Druid', status: 'Active', faction: 'Matekwan', notes: 'Matekwan Druid. Deep connection with flora and fauna. Shape-shifter.' },
      { id: 'n364', name: 'Chane Okorie', role: 'Dwarf Engineer', status: 'Active', faction: 'Matekwan', notes: "Matekwan Dwarf engineer. Expertise in complex machinery and devices." },
      { id: 'n365', name: 'Azizi Nnamani', role: 'Rogue', status: 'Active', faction: 'Matekwan', notes: 'Matekwan Rogue. Unparalleled agility and stealth. Security for Djekoto.' },
    ],
  },

  {
    id: 'priokos',
    name: 'Priokos',
    region: 'Makeda Kwetu',
    npcs: [
      { id: 'n366', name: 'Kwame Odion', role: 'General', status: 'Active', faction: 'Matekwan / Ukombozi Pride', notes: 'Seasoned Makwetan general. Strategic brilliance and unwavering determination.' },
      { id: 'n367', name: 'Ifeoma Eze', role: 'Leonin Warrior', status: 'Active', faction: 'Ukombozi Pride', notes: 'Fearsome Leonin warrior. Exceptional blade skills and unbreakable spirit.' },
      { id: 'n368', name: 'Malik and Zain Okoro', role: 'Warrior Brothers', status: 'Active', faction: 'Matekwan', notes: 'Inseparable brothers. Malik is a skilled archer, Zain a dual-blade master.' },
      { id: 'n369', name: 'Nia Azikiwe', role: 'Leonin Scout', status: 'Active', faction: 'Ukombozi Pride', notes: 'Fearless Leonin scout. Gathers vital intelligence beyond the city borders.' },
      { id: 'n370', name: 'Adanna Obi', role: 'Healing Corps Head', status: 'Active', faction: 'Matekwan', notes: 'Head of healing corps. Extensive knowledge of medicinal herbs and remedies.' },
      { id: 'n371', name: 'Kofi Ebo', role: 'War Drummer', status: 'Active', faction: 'Matekwan', notes: 'Maernethim war drummer. Rhythmic beats rally warriors and inspire courage.' },
      { id: 'n372', name: 'Sekou Doumbia', role: 'War Veteran / Trainer', status: 'Active', faction: 'Matekwan', notes: 'Seasoned war veteran training next generation of warriors.' },
    ],
  },

  {
    id: 'caldor',
    name: 'Caldor',
    region: 'Makeda Kwetu',
    npcs: [
      { id: 'n373', name: 'Lord Corrvit Payne', role: 'Ambassador', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Dignified and eloquent noble leading diplomatic efforts at Caldor.' },
      { id: 'n374', name: 'Dorian Stout', role: 'Merchant', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Skilled merchant facilitating trade exchange between cultures.' },
      { id: 'n375', name: 'Professor Elara Treyarc', role: 'Scholar', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Renowned scholar studying Matekwan culture and history.' },
      { id: 'n376', name: 'Marcus Thorndop', role: 'Artisan / Jeweler', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Talented artisan seeking to incorporate Matekwan style into his work.' },
      { id: 'n377', name: 'Leona Thorndop', role: 'Herbalist / Healer', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Skilled herbalist learning from Matekwan wisdom of natural remedies.' },
      { id: 'n378', name: 'Archibald Sablewood', role: 'Historian', status: 'Active', faction: 'Sovereign Kingdom', notes: "Historian dedicated to uncovering ancient secrets. Documenting Matekwan oral traditions." },
      { id: 'n379', name: 'Evelyn', role: 'Linguist', status: 'Active', faction: 'Sovereign Kingdom', notes: "Talented linguist immersing herself in Matekwan's diverse dialects and languages." },
      { id: 'n380', name: 'Lucian', role: 'Entertainer / Storyteller', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Charismatic Tiefling entertainer bringing joy and laughter to both cultures.' },
    ],
  },

  // ── KUL'KAL RAKHAR ──────────────────────────────────────────────────────

  {
    id: 'dragonmaw-camp',
    name: 'Dragonmaw Clan Camp',
    region: "Kul'Kal Rakhar",
    npcs: [
      { id: 'n381', name: 'Gaarna Aakre', role: 'Dragonmaw Chieftain', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Towering Orc with weathered features. Commands respect with strength and authority.' },
      { id: 'n382', name: 'Draka Dragonmaw', role: 'Shaman', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Wise and revered shaman. Healer and spiritual guide for the clan.' },
      { id: 'n383', name: 'Grunk Ghoran', role: 'Weaponsmith', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Towering figure with bulging muscles. Renowned weaponsmith.' },
      { id: 'n384', name: 'Sylra Burzog', role: 'Scout / Tracker', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Lithe and agile Orc with unparalleled knowledge of the marshes.' },
      { id: 'n385', name: "Thorgar Ba'elnohr", role: 'Warrior', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Battle-hardened vanguard warrior with massive axe and plate armor.' },
      { id: 'n386', name: 'Rika Grumsluf', role: 'Clan Elder', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Weathered elder with graying hair. Keeper of ancestral stories and customs.' },
      { id: 'n387', name: 'Gorak Aakre', role: 'Clan Bard', status: 'Active', faction: 'Dragonmaw Clan', notes: 'Lively and charismatic Orc bard. Weaves tales of heroism inspiring the clan.' },
    ],
  },

  {
    id: 'gradok-camp',
    name: "Gra'adok Clan Camp",
    region: "Kul'Kal Rakhar",
    npcs: [
      { id: 'n388', name: 'Gromak Bloodfist', role: 'Clan Chieftain', status: 'Active', faction: "Gra'adok Clan", notes: 'Battle-scarred orc leader of the Gra\'adok Clan. Naval dominance over Azure Tides.' },
      { id: 'n389', name: 'Grommok Ghoran', role: 'High Acolyte', status: 'Active', faction: "Gra'adok Clan", notes: 'Towering High Acolyte of the Zar\'gol Acolytes. Leads religious ceremonies.' },
      { id: 'n390', name: 'Hulgar Fjordlord', role: 'Chief Strategist', status: 'Active', faction: "Gra'adok Clan", notes: 'Cunning tactician. Plans and coordinates military campaigns.' },
      { id: 'n391', name: 'Morga Gra\'adok', role: 'Master Assassin', status: 'Active', faction: "Gra'adok Clan", notes: 'Master of stealth and deception. Clandestine operative of the Zar\'gol Acolytes.' },
      { id: 'n392', name: 'Drakka Aakre', role: 'Weaponsmith', status: 'Active', faction: "Gra'adok Clan", notes: 'Skilled blacksmith using ancient orcish forging techniques.' },
      { id: 'n393', name: 'Throkka Aakre', role: 'Shamanic Healer', status: 'Active', faction: "Gra'adok Clan", notes: 'Wise revered shaman. Healer and spiritual guide.' },
      { id: 'n394', name: "Grugok Gul'danhrhock", role: 'Beastmaster', status: 'Active', faction: "Gra'adok Clan", notes: 'Uncanny bond with creatures. Commands war wolves, raptors, and other beasts.' },
      { id: 'n395', name: "Roknar Gra'adok", role: 'Fire Mage', status: 'Active', faction: "Gra'adok Clan", notes: 'Skilled pyromancer raining fiery devastation on enemies.' },
    ],
  },

  {
    id: 'guldanhrhock-camp',
    name: "Gul'danhrhock Clan Camp",
    region: "Kul'Kal Rakhar",
    npcs: [
      { id: 'n396', name: "Chieftain Tornog Gul'danhrhock", role: 'Clan Chieftain', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Formidable orc warrior chieftain. Unmatched strength and strategic mind.' },
      { id: 'n397', name: "Umog Gul'danhrhrock", role: 'Clan Elder', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Weathered wise orc elder. Oversees central camp and youngling orcs. Devoted to Zar\'gol Creed.' },
      { id: 'n398', name: 'Morvus Thranduil', role: 'Council Member / Hidden Enemy', status: 'Active', faction: 'Khoneus Cult', notes: 'Charming facade hiding allegiance to Khoneus. Master manipulator sowing chaos in the council.' },
      { id: 'n399', name: 'Eira Bula', role: 'Council Member / Shield Maiden', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Formidable shield maiden warrior. Empowers women within the clan.' },
      { id: 'n400', name: 'Gorak', role: 'Council Member / Bard', status: 'Active', faction: "Gul'danhrhock Clan", notes: 'Charismatic orc bard using music and storytelling to unite the clan.' },
    ],
  },

  // ── DUNALACH ────────────────────────────────────────────────────────────

  {
    id: 'merchants-inlet',
    name: "Merchant's Inlet",
    region: 'Dunalach',
    npcs: [
      { id: 'n401', name: 'Captain Greyhook Stormbringer', role: 'Pirate Captain', status: 'Active', faction: 'Independent', notes: 'Grizzled human pirate captain renowned for fearless navigation. Commands The Tempest\'s Fury.' },
      { id: 'n402', name: 'Isabella Seaheart', role: 'Elven Shipwright', status: 'Active', faction: 'Independent', notes: "Skilled and daring elven shipwright. Crafts swift and sleek vessels." },
      { id: 'n403', name: "Barnaby 'Squid-eye' O'Malley", role: 'Ship Cook / Sailor', status: 'Active', faction: 'Independent', notes: 'Jovial eccentric gnome sailor. Legendary culinary skills. Epic sea shanties.' },
      { id: 'n404', name: "Seraphina 'Stormsong' Gale", role: 'Triton Captain', status: 'Active', faction: 'Independent', notes: 'Mysterious Triton captain. Controls winds and storms.' },
      { id: 'n405', name: "Seamus 'The Scar' Blackwood", role: 'Smuggler / Navigator', status: 'Active', faction: 'Underground', notes: 'Rugged half-orc master at navigating dangerous reefs. Leads smuggling operations.' },
      { id: 'n406', name: 'Sable Duskrider', role: "Cath'vari Navigator", status: 'Active', faction: 'Independent', notes: "Stoic and focused navigator with uncanny ability to find safe routes." },
      { id: 'n407', name: "Captain Alonso 'The Salamander' Ramirez", role: 'Fire Genasi Captain', status: 'Active', faction: 'Independent', notes: "Fiery and passionate Fire Genasi captain. Commands The Salamander's Revenge." },
      { id: 'n408', name: "Dahlia 'The Sea Serpent' Morgan", role: 'Marine Biologist / Sailor', status: 'Active', faction: 'Independent', notes: 'Tough half-elf with expertise in sea creatures and ability to communicate with marine life.' },
      { id: 'n409', name: "Gideon 'Ironhook' Flint", role: 'Warship Captain', status: 'Active', faction: 'Independent', notes: 'Gruff battle-hardened dwarf. Commands The Ironhook. Crew defends the isle from pirates.' },
      { id: 'n410', name: 'Lorelei', role: 'Water Genasi Bard', status: 'Active', faction: 'Independent', notes: 'Mesmerizing Water Genasi bard known for enchanting sea shanties.' },
    ],
  },

  {
    id: 'port-haldane',
    name: 'Port Haldane',
    region: 'Dunalach',
    npcs: [
      { id: 'n411', name: 'Captain Sinvell', role: 'Port Captain / Smuggler', status: 'Active', faction: 'Independent', notes: 'Charismatic and ambitious human captain. Alleged involvement in smuggling and slave trafficking.' },
      { id: 'n412', name: 'Naginata', role: 'Halfling Trader', status: 'Active', faction: 'Independent', notes: 'Resourceful and cunning halfling trader. Known for fair trade practices. Whispered to have shadow dealings.' },
      { id: 'n413', name: "Kel'el", role: 'Veridoran Merchant / Navigator', status: 'Active', faction: 'Independent', notes: 'Stoic and disciplined Veridoran merchant. Secretly yearns to uncover port\'s hidden activities.' },
      { id: 'n414', name: 'Adlara', role: "Cath'vari Spice Trader", status: 'Active', faction: 'Independent', notes: "Mysterious and alluring Cath'vari trader dealing in rare spices from Lilith'iel. Alleged ties to underground." },
      { id: 'n415', name: 'Alaric Ironheart', role: 'Dwarf Blacksmith', status: 'Active', faction: 'Independent', notes: 'Stern dwarf blacksmith. Alleged involvement in supplying weapons to unsavory factions.' },
      { id: 'n416', name: "Athen'e", role: 'Eladrin Merchant', status: 'Active', faction: 'Independent', notes: 'Enigmatic reclusive Eladrin dealing in rare magical artifacts and enchanted trinkets.' },
    ],
  },

  {
    id: 'stormwatch',
    name: 'Stormwatch',
    region: 'Dunalach',
    npcs: [
      { id: 'n417', name: 'Pirate Lord Killian "Deathbellow" Almsteadt', role: 'Pirate Lord', status: 'Active', faction: 'Pirate Government', notes: 'Feared and battle-hardened pirate lord. Tactical brilliance and unwavering ruthlessness.' },
      { id: 'n418', name: 'Sable "The Snake" Hart', role: "Cath'vari Rogue", status: 'Active', faction: 'Pirate Government', notes: "High-ranking pirate rogue known for stealth and navigating treacherous waters." },
      { id: 'n419', name: 'Captain Mara "Crimson Blade" O\'Sullivan', role: 'Dwarf Pirate Captain', status: 'Active', faction: 'Pirate Government', notes: "Fiery and fierce dwarf captain commanding The Crimson Blade." },
    ],
  },

  // ── LILITH'IEL ──────────────────────────────────────────────────────────

  {
    id: 'marrigizhar',
    name: "Marrigizh'ar / Xefren Sanctum",
    region: "Lilith'iel",
    npcs: [
      { id: 'n420', name: 'Zephyrion', role: 'Air Genasi Leader', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Wise and venerable leader of the Air Genasi collective. Master of wind manipulation.' },
      { id: 'n421', name: 'Aerisya', role: 'Healer / Spiritual Guide', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Skilled healer with deep connection to the natural world.' },
      { id: 'n422', name: 'Galeth', role: 'Scout / Messenger', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Adventurous and daring Air Genasi. Best scout and messenger. Skilled with a glider.' },
      { id: 'n423', name: 'Sylvara', role: 'Elemental Mage', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Elemental mage specializing in lightning and thunder. Immense power.' },
      { id: 'n424', name: 'Thundara', role: 'Blacksmith / Engineer', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Mastermind behind the floating structures of the collective.' },
      { id: 'n425', name: "Zep'hir", role: 'Young Air Genasi', status: 'Active', faction: 'Xefren / Air Genasi', notes: 'Jovial and curious youngster. Still honing air manipulation skills. Source of joy for the group.' },
    ],
  },

  {
    id: 'nquythalas',
    name: "N'quythalas",
    region: "Lilith'iel",
    npcs: [
      { id: 'n426', name: 'Xalzorin', role: 'Drow Warrior / Ebonshroud Leader', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Formidable Drow warrior leading the elite Ebonshroud Hand assassins.' },
      { id: 'n427', name: 'Dravenar', role: 'Dark Mage / Enforcer', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Practitioner of dark magic. Devoted follower of Lolth. Enforcer for the Ebonshroud Hand.' },
      { id: 'n428', name: 'Zyreth', role: 'Master Spy', status: 'Active', faction: 'Ebonshroud Hand', notes: "Master of espionage and deception. Network of spies throughout N'quythalas." },
      { id: 'n429', name: 'Velora', role: 'Assassin / Poisoner', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Deadly assassin specializing in poisons and toxins. Moves silently through shadows.' },
      { id: 'n430', name: "Vae'l", role: 'High Priest of Lolth', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Powerful figure in religious and political matters. Conducts dark rituals to appease the Spider Queen.' },
      { id: 'n431', name: 'Draegon', role: 'Shadow Sorcerer', status: 'Active', faction: 'Ebonshroud Hand', notes: 'Reclusive and enigmatic Drow. Master of shadow magic. Rumored to bend reality to his will.' },
    ],
  },

  // ── PARAVEL ──────────────────────────────────────────────────────────────

  {
    id: 'eneowa',
    name: 'Eneowa',
    region: 'Paravel',
    npcs: [
      { id: 'n432', name: 'Tavish Hardwick', role: 'Blacksmith', status: 'Active', faction: 'Eneowa', notes: 'Hardworking blacksmith renowned for craftsmanship.' },
      { id: 'n433', name: 'Lysandra Whitewood', role: 'Tavern Owner', status: 'Active', faction: 'Eneowa', notes: 'Charismatic tavern owner running a bustling establishment.' },
      { id: 'n434', name: 'Brother Elias', role: "Shevar's Priest", status: 'Active', faction: 'Shevar Temple', notes: "Humble and devout follower of Shevar. Tends the temple's altar." },
      { id: 'n435', name: 'Greta Ladlemeddle', role: 'Street Vendor / Herbalist', status: 'Active', faction: 'Eneowa', notes: 'Lightfoot halfling street vendor with warm smile and knack for storytelling.' },
      { id: 'n436', name: 'Lord Armand Westcliffe', role: 'Nobleman', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Respected nobleman with strong political acumen.' },
      { id: 'n437', name: 'Sister Clarabelle', role: 'Nun', status: 'Active', faction: "Holy Order of Fi'harta", notes: "Compassionate nun of the Holy Order of Fi'harta. Dedicated to serving the needy." },
      { id: 'n438', name: 'Rolf Grenqys', role: 'Combat Trainer / Retired Veteran', status: 'Active', faction: 'Eneowa', notes: 'Grizzled veteran running a training ground for aspiring warriors.' },
      { id: 'n439', name: 'Lady Isabella Maeir', role: 'Aristocrat / Arts Patron', status: 'Active', faction: 'Eneowa', notes: 'Influential aristocrat hosting extravagant galas and cultural gatherings.' },
      { id: 'n440', name: 'Father Matthias', role: "Be'lnariani Priest", status: 'Active', faction: "Be'lnariani Faith", notes: "Wise and benevolent priest offering solace and guidance." },
      { id: 'n441', name: 'Marius Maeir', role: 'Information Broker / Rogue', status: 'Active', faction: 'Independent', notes: 'Charismatic and enigmatic rogue. Operates in the shadows as a skilled information broker.' },
      { id: 'n442', name: 'High Priestess Elara', role: 'Auric Order High Priestess', status: 'Active', faction: 'Auric Order', notes: "Revered and powerful figure within the Auric Order. Presides over Shevar's temple." },
      { id: 'n443', name: 'Orin Ferdinand', role: 'Street Performer / Acrobat', status: 'Active', faction: 'Eneowa', notes: 'Talented street performer and acrobat captivating crowds.' },
    ],
  },

  {
    id: 'aranghthal',
    name: 'Aranghthal',
    region: 'Paravel',
    npcs: [
      { id: 'n444', name: 'Valdarin', role: 'High Priest / Oracle', status: 'Active', faction: 'Telrok Orc', notes: "Wise and venerable Telrok Orc. High priest of Lótjarr. Interprets signs and symbols." },
      { id: 'n445', name: 'Sylaren', role: 'Guard Captain', status: 'Active', faction: 'Telrok Orc', notes: 'Skilled Telrok Orc warrior. Captain of the guards. Fiercely loyal.' },
      { id: 'n446', name: "Kald'er", role: 'Sage / Historian', status: 'Active', faction: 'Telrok Orc', notes: 'Brooding and contemplative Telrok Orc. Studies fate and destiny.' },
      { id: 'n447', name: 'Nerio', role: 'Triton Elder / Priest', status: 'Active', faction: 'Nazari', notes: 'Wise and experienced triton elder. Spiritual leader and advisor to the Triton Council.' },
      { id: 'n448', name: "Tha'lara", role: 'Triton Guard Captain', status: 'Active', faction: 'Nazari', notes: 'Skilled trident fighter and respected warrior. Protects Nazari shores.' },
    ],
  },

  {
    id: 'sarazana',
    name: 'Sarazana',
    region: 'Paravel',
    npcs: [
      { id: 'n449', name: "Queen Dro'farahn", role: "Cath'vari Queen", status: 'Active', faction: "Cath'vari Kingdom", notes: "Beloved ruler of the Cath'vari Kingdom. Wise, charismatic, and dedicated to diplomacy." },
      { id: 'n450', name: 'Aurelius', role: 'Elder / Elemental Mage', status: 'Active', faction: "Cath'vari Kingdom", notes: "Most esteemed member of the Sect of Elders. Master of elemental magic. Trusted advisor to the Queen." },
      { id: 'n451', name: "Captain Ri'Jirr", role: 'Royal Guard Captain', status: 'Active', faction: "Cath'vari Kingdom", notes: 'Skilled warrior and formidable tactician commanding the Royal Guard.' },
      { id: 'n452', name: "Ambassador Dar'Zamar", role: 'Cath\'vari Ambassador', status: 'Active', faction: "Cath'vari Kingdom", notes: "Charismatic diplomat. Silver tongue and shrewd negotiation skills." },
      { id: 'n453', name: 'Alvasorr', role: 'Official Bard', status: 'Active', faction: "Cath'vari Kingdom", notes: "Gifted artist and storyteller. City's official bard bringing Cath'vari legends to life." },
      { id: 'n454', name: 'Orlen Hulgdirth', role: 'Herbalist / Alchemist', status: 'Active', faction: "Cath'vari Kingdom", notes: 'Skilled herbalist and alchemist running a renowned apothecary.' },
      { id: 'n455', name: "Er'zin-Dar", role: 'Architect / Engineer', status: 'Active', faction: "Cath'vari Kingdom", notes: "Accomplished architect designing Sarazana's most breathtaking structures." },
      { id: 'n456', name: "Captain Dro'Tasarr", role: 'Naval Fleet Captain', status: 'Active', faction: "Cath'vari Kingdom", notes: "Captain of the Cath'vari naval fleet. Strategic brilliance and bravery in battle." },
    ],
  },

  // ── ZHALLAKAN ────────────────────────────────────────────────────────────

  {
    id: 'ormr',
    name: 'Ormr',
    region: 'Zhallakan',
    npcs: [
      { id: 'n457', name: "Necht'an", role: 'Grand Vizier / High Priest', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Cunning and charismatic Yuan-Ti pureblood. Conducts ritual sacrifices. Secretly consolidating power.' },
      { id: 'n458', name: 'Inquisitor Thessa', role: 'Secret Police Head', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Formidable and cunning pureblood. Head of the city\'s secret police. Ruthless and loyal to Grand Vizier.' },
      { id: 'n459', name: 'Councilor Kethra', role: 'Council Advisor', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Charismatic and influential pureblood. Oversees economy and trade.' },
      { id: 'n460', name: 'Enforcer Vixra', role: 'Guard Captain', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Strong and loyal pureblood. Captain of the city\'s guard.' },
      { id: 'n461', name: 'Oracle Seretha', role: 'Seer / Fortune Teller', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Mysterious enigmatic pureblood. Delivers prophecies believed to be divinely inspired.' },
      { id: 'n462', name: 'Archivist Zarssen', role: 'Archivist / Scholar', status: 'Active', faction: 'Yuan-Ti Commandery', notes: 'Intelligent studious pureblood preserving ancient texts and deciphering forgotten lore.' },
      { id: 'n463', name: "Acolyte Sses'suth", role: 'Rebellious Acolyte', status: 'Active', faction: 'Independent', notes: 'Young rebellious pureblood. Chafes under oppressive theocracy. Delves into forbidden ancient knowledge.' },
      { id: 'n464', name: "Lir'ael", role: 'Mearnethim Outsider / Wise Scholar', status: 'Active', faction: 'Independent', notes: 'Wise and enigmatic Mearnethim living in Ormr. Possesses deep knowledge of ancient civilizations.' },
      { id: 'n465', name: 'Renthok', role: 'Telrok Orc Guard Captain', status: 'Active', faction: 'Independent', notes: 'Proud and honorable Telrok Orc. Captain of the city guards. Remains vigilant for corruption.' },
      { id: 'n466', name: 'Vayhr\'hul', role: 'Tortle Elder / Healer', status: 'Active', faction: 'Independent', notes: 'Calm and peaceful Tortle. Respected elder and healer. Bridge between different races.' },
      { id: 'n467', name: 'The Serpentine Voice', role: 'Mysterious Yuan-Ti Figure', status: 'Unknown', faction: 'Unknown', notes: 'Mysterious and powerful Yuan-Ti Chronolithe. Shrouded in ancient prophecies. Resides in depths of the ziggurats.' },
    ],
  },

  {
    id: 'dar-al-fakhama',
    name: 'Dar Al-Fakhama',
    region: 'Zhallakan',
    npcs: [
      { id: 'n468', name: 'Khalif bin Musimah', role: 'Desert Guide', status: 'Active', faction: 'Brunar', notes: 'Knowledgeable and experienced desert guide. Leads travelers safely through the cave network.' },
      { id: 'n469', name: 'Messied Al-Rumara', role: 'Guardian / Water Manager', status: 'Active', faction: 'Brunar', notes: 'Strong and resourceful Brunar warrior. Guardian of the subterranean oasis.' },
      { id: 'n470', name: 'Amani Zuberi', role: 'Matekwan Scholar', status: 'Active', faction: 'Independent', notes: 'Wise and mysterious Matekwan scholar. Seeker of ancient knowledge and lore.' },
      { id: 'n471', name: 'Ophelia Lancaster', role: 'Veridoran Explorer', status: 'Active', faction: 'Independent', notes: 'Refined Veridoran lady with a thirst for exploration. Resting point during desert expeditions.' },
      { id: 'n472', name: 'Kalimah', role: 'Kenku Information Broker', status: 'Active', faction: 'Independent', notes: 'Clever Kenku rogue. Ability to mimic voices allows discreet information gathering and dissemination.' },
      { id: 'n473', name: 'Ohtli Al-Zyanya', role: "Cath'vari Elder / Healer", status: 'Active', faction: "Cath'vari", notes: "Wise and respected Cath'vari elder offering spiritual guidance and healing to weary travelers." },
    ],
  },

  {
    id: 'urvarro',
    name: 'Urvarro',
    region: 'Zhallakan',
    npcs: [
      { id: 'n474', name: 'Aodhfionn', role: 'Kenku Chieftain', status: 'Active', faction: "Ra'kesh Kenku", notes: 'Wise and respected chieftain. Traditionalist valuing preservation of ancient culture.' },
      { id: 'n475', name: "Reva'lee Ra'kesh", role: 'Young Bard', status: 'Active', faction: "Ra'kesh Kenku", notes: "Charismatic and talented young bard. Advocates for sharing Ra'kesh culture with outsiders." },
      { id: 'n476', name: 'Totori', role: 'Elder Artisan / Storyteller', status: 'Active', faction: "Ra'kesh Kenku", notes: 'Skilled artisan and storyteller. Respected elder torn between isolation and sharing their heritage.' },
      { id: 'n477', name: "Kiff Sa'era", role: 'Young Scout / Adventurer', status: 'Active', faction: "Ra'kesh Kenku", notes: 'Young kenku scout with wanderlust. Secretly ventures beyond the village to learn about the world.' },
      { id: 'n478', name: 'Brenna', role: 'Hunter / Tracker', status: 'Active', faction: "Ra'kesh Kenku", notes: "Skilled hunter and tracker. Pragmatic and protective of the clan's way of life." },
    ],
  },

  {
    id: 'jumlet',
    name: 'Jumlet',
    region: 'Zhallakan',
    npcs: [
      { id: 'n479', name: 'Emir Prince Amir Al-Farouk', role: 'City Emir / Prince', status: 'Active', faction: 'Jumlet', notes: 'Charismatic and visionary human leader. Prioritizes prosperity and well-being.' },
      { id: 'n480', name: 'Sultan Hassan Al-Malik', role: 'Sultan', status: 'Active', faction: 'Jumlet', notes: 'Ailing ruler of Jumlet. Wisdom and guidance continue through consultations with Prince Amir.' },
      { id: 'n481', name: 'Captain Rashid Khafaji', role: 'City Guard Captain', status: 'Active', faction: 'Jumlet', notes: 'Seasoned orc warrior and captain of the city guard. Stalwart defender of peace.' },
      { id: 'n482', name: 'Aliyah Farid', role: 'Weaver / Artisan', status: 'Active', faction: 'Jumlet', notes: 'Elven artisan and weaver. Tapestries renowned for intricate beauty.' },
      { id: 'n483', name: 'Ahmed Malik', role: 'Spice Merchant', status: 'Active', faction: 'Jumlet', notes: 'Gnome merchant and owner of a bustling spice shop. Beloved figure.' },
      { id: 'n484', name: 'Safiya Abbas', role: 'Healer / Herbalist', status: 'Active', faction: 'Jumlet', notes: "Halfling healer and herbalist. Trusted figure in the community." },
      { id: 'n485', name: 'Khaled Al-Masri', role: 'Blacksmith / Weaponsmith', status: 'Active', faction: 'Jumlet', notes: 'Skilled dwarf blacksmith. Weapons sought after by warriors from all walks of life.' },
      { id: 'n486', name: 'Naima Hafeez', role: 'Bard / Storyteller', status: 'Active', faction: 'Jumlet', notes: "Half-elf storyteller and bard. Jumlat's most cherished storyteller." },
      { id: 'n487', name: 'Yasir Qadir', role: 'Scholar / Historian', status: 'Active', faction: 'Jumlet', notes: "Human scholar. Writings and lectures preserve the city's rich history." },
    ],
  },

  // ── DORHAVEN / GRIM ISLE ─────────────────────────────────────────────────

  {
    id: 'hulnom',
    name: 'Hulnom',
    region: 'Dorhaven / Grim Isle',
    npcs: [
      { id: 'n488', name: 'Lyra', role: 'Eldritch Knight / Mage-Knight', status: 'Active', faction: 'Independent', notes: 'Young and aspiring mage-knight exploring the mysteries of the ruins.' },
      { id: 'n489', name: 'Gorstag Banmur', role: 'Dwarven Champion Fighter', status: 'Active', faction: 'Independent', notes: 'Stout and muscular dwarf. Seeks to reclaim the lost glory of the ancient city.' },
      { id: 'n490', name: 'Sylvarin', role: 'Elven Battle Master Fighter', status: 'Active', faction: 'Independent', notes: 'Seasoned warrior wielding an elegant elven blade. Leads fighters defending the ruins from intruders.' },
    ],
  },

  {
    id: 'penthosanctum',
    name: 'Penthosanctum',
    region: 'Dorhaven / Grim Isle',
    npcs: [
      { id: 'n491', name: 'Warden Thalgrim Graniteheart', role: 'Prison Warden', status: 'Active', faction: 'Sovereign Kingdom / Graniteheart Clan', notes: 'Hailing from the Graniteheart Clan. Dedicated to upholding the law. Unwavering disciplinarian.' },
      { id: 'n492', name: 'Aria Eryndor', role: 'Elven Inmate', status: 'Imprisoned', faction: 'Unknown', notes: 'Past shrouded in secrecy. Rumored to be a renowned elusive thief. Adapts to prison life patiently.' },
      { id: 'n493', name: 'Guard Captain Brynja Ironhide', role: 'Guard Captain', status: 'Active', faction: 'Sovereign Kingdom', notes: 'Hardened human warrior with scars from countless battles. Commands the prison guard with authority.' },
    ],
  },

  // ── RED LOCK BAY ─────────────────────────────────────────────────────────

  {
    id: 'jack-redlock-bay',
    name: 'Jack Red-Lock Bay',
    region: 'Red Lock Bay',
    npcs: [
      { id: 'n494', name: 'Captain Khargrim', role: 'Pirate Captain / Crew of the Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Seasoned dwarf pirate captain with braided beard. Strategic mind and fierce determination.' },
      { id: 'n495', name: 'Narridh Faerondaerl', role: 'Elven Rogue / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Graceful and elusive elven rogue with keen eye for treasure. Skilled in swordplay and stealth.' },
      { id: 'n496', name: 'Grimgar Bloodfist', role: 'Half-Orc Enforcer / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Hulking half-orc brawler notorious for raw strength. Crew enforcer.' },
      { id: 'n497', name: 'Isolde Farsen', role: 'Genasi Sorcerer / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Fiery-tempered fire genasi sorcerer with explosive spells and volatile nature.' },
      { id: 'n498', name: 'Brynhildr Kol', role: 'Maernethim Assassin / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Mysterious and alluring Maernethim assassin. Moves silently, eliminates targets with deadly precision.' },
      { id: 'n499', name: 'Ellie Corth Tinderdell', role: 'Gnome Mechanic / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Mischievous and inventive gnome mechanic. Maintains and improves crew ships and weaponry.' },
      { id: 'n500', name: 'Finnegan Bramblethorn', role: 'Halfling Rogue / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: "Nimble and agile halfling rogue. Crew's scout. Expert thief and acrobat." },
      { id: 'n501', name: 'Valkyria Graniteheart', role: 'Dwarven First Mate / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Stoic and disciplined dwarven warrior. First mate of the Laden Rest. Skilled in swordplay and archery.' },
      { id: 'n502', name: 'Dunagurk', role: 'Orc Brute / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Fearsome orc brute. Immense strength and intimidating presence. Ship muscle.' },
      { id: 'n503', name: 'Drusilia Illyrth\'wyn', role: 'Elven Bard / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Graceful elven bard. Enchanting melodies boost crew morale during long voyages.' },
      { id: 'n504', name: 'Lanthir Laldir', role: 'Half-Elf Rogue / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Charismatic and cunning half-elf rogue. Silver tongue expert in negotiation and persuasion.' },
      { id: 'n505', name: 'Willo Brandyapple', role: 'Gnome Druid / Laden Rest', status: 'Active', faction: 'Laden Rest Crew', notes: 'Nature-loving gnome druid. Healing and support using druidic magic.' },
    ],
  },

  {
    id: 'velhurr',
    name: 'Velhurr',
    region: 'Red Lock Bay',
    npcs: [
      { id: 'n506', name: "Scrollkeeper Kohr'hul", role: 'Tortle Elder / Spiritual Leader', status: 'Active', faction: 'Tortle Clans', notes: 'Wise venerable Tortle. Spiritual leader and keeper of sacred texts. Preparing for a coming catastrophe after receiving a vision of a falling star.' },
      { id: 'n507', name: "Kai'on", role: 'Young Tortle Adventurer', status: 'Active', faction: 'Tortle Clans', notes: 'Young and adventurous Tortle. Eager to help less fortunate islanders rather than prepare for distant threats.' },
      { id: 'n508', name: 'Lura', role: 'Halfling Trade Liaison', status: 'Active', faction: 'Tortle Clans', notes: "Friendly and nimble Lightfoot Halfling. Main trade liaison with distant islands and communities." },
      { id: 'n509', name: 'Findal Tallblossom', role: 'Gnome Artisan / Tinkerer', status: 'Active', faction: 'Tortle Clans', notes: 'Curious and inventive Gnome. Crafts intricate sculptures infused with magic.' },
      { id: 'n510', name: 'Speaker Treshel', role: 'Tortle Captain / Speaker', status: 'Active', faction: 'Tortle Clans', notes: 'Seasoned and adventurous Tortle captain leading maritime expeditions.' },
      { id: 'n511', name: 'Olutt Ubi', role: 'Dream Interpreter / Astrologer', status: 'Active', faction: 'Tortle Clans', notes: 'Serene and contemplative Tortle. Studies stars and interprets dreams for guidance.' },
    ],
  },

  // ── UNASSIGNED ───────────────────────────────────────────────────────────

  {
    id: 'unassigned',
    name: 'Unassigned',
    region: '',
    npcs: [],
  },
];

// Generate unique IDs for NPC entries
let _npcCounter = 600;
export const newNpcId = () => `npc_${++_npcCounter}_${Date.now()}`;
export const newCityId = () => `city_${Date.now()}`;

