export const CURRENCY = [
  // CURRENCY — Banking Instrument
  { category: 'Currency', type: 'Banking Instrument', name: 'Guild Credit Note', desc: 'A signed paper promising payment through a recognized guildhouse. Safer than coin but worthless if the issuing guild is disgraced.', tags: ['document','economy','faction'], meta: 'requirement: literacy or seal check' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Temple Alms Token', desc: 'A sanctified charity token redeemable for food, healing, or shelter at participating shrines.', tags: ['divine','aid','token'], meta: 'restriction: shrine network' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Mercenary Blood Bond', desc: 'A pay certificate issued to soldiers after dangerous service. Often bought at a discount by speculators.', tags: ['military','contract','risky'], meta: 'effect: delayed payment' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Port Authority Tallystick', desc: 'A notched stick split between shipmaster and dock clerk. Matching halves prove cargo taxes were paid.', tags: ['legal','port','trade'], meta: 'requirement: matching half' },

  // CURRENCY — Counterfeit/Curiosity
  { category: 'Currency', type: 'Counterfeit/Curiosity', name: 'Washed Crown', desc: 'A real gold coin chemically stripped and restamped by a crooked mint. Hard to detect without acid or a scale.', tags: ['counterfeit','intrigue'], meta: 'check: appraisal' },

  // CURRENCY — Regional Currency
  { category: 'Currency', type: 'Regional Currency', name: 'Avali Azerheim Bead', desc: 'A carved songbird bead strung in counted cords. Recognized by Avali enclaves and caravan factors.', tags: ['race','barter','cultural'], meta: 'exchange: regional' },
  { category: 'Currency', type: 'Regional Currency', name: 'Taer-anari Bone Shilling', desc: 'A polished bone token etched with pack lineage. It carries social meaning as much as monetary value.', tags: ['race','token','oath'], meta: 'exchange: clan dependent' },
  { category: 'Currency', type: 'Regional Currency', name: 'Cath-Vari Djezet', desc: 'A slim crescent coin used in feline courts and spice markets. Its edge pattern helps detect forged pieces by touch.', tags: ['race','trade','tactile'], meta: 'exchange: regional' },
  { category: 'Currency', type: 'Regional Currency', name: 'Tel\'ari Elysian', desc: 'A luminous ceremonial coin used in temple offerings and high diplomacy. Some glow faintly under sacred flame.', tags: ['race','divine','prestige'], meta: 'exchange: temple favored' },
  { category: 'Currency', type: 'Regional Currency', name: 'Trinkling Gemfrag', desc: 'Tiny broken gem chips weighed in sealed vials. Popular among tinkers because value scales cleanly by mass.', tags: ['crafting','gem','divisible'], meta: 'exchange: weight based' },
  { category: 'Currency', type: 'Regional Currency', name: 'Hill Dwarf Gromril Ingot', desc: 'A thumb-sized ingot of stamped dwarf metal, accepted for bulk arms purchases and forge debts.', tags: ['Durinak','metal','trade'], meta: 'exchange: high trust' },
  { category: 'Currency', type: 'Regional Currency', name: 'Air Vorthren Gust Rupee', desc: 'A light glassy coin suspended in a wire ring. It is valued in skyports and by weather-sail crews.', tags: ['elemental','air','travel'], meta: 'exchange: sky market' },
  { category: 'Currency', type: 'Regional Currency', name: "Pa'morph Harmony Credit", desc: 'A communal credit chit representing service owed within beast-folk settlements. Outsiders must earn trust before using it.', tags: ['social','credit','communal'], meta: 'exchange: reputation linked' },
  { category: 'Currency', type: 'Regional Currency', name: 'Kitsune Hihi-irokane Scale', desc: 'A red-gold scale token used in clever bargains, masked festivals, and illusionist guild payments.', tags: ['race','prestige','magic-adjacent'], meta: 'exchange: negotiated' },
  { category: 'Currency', type: 'Regional Currency', name: 'Aarakocra Horacalcum Ring', desc: 'A thin ring coin worn on cords or talons. Used for sky-route fees and messenger contracts.', tags: ['race','air','courier'], meta: 'exchange: regional' },

  // CURRENCY — Sovereign Coin
  { category: 'Currency', type: 'Sovereign Coin', name: 'Copper Mark', desc: 'The common street coin for bread, torch oil, tips, tolls, and cheap repairs. Often stamped by city mints and clipped by desperate hands.', tags: ['economy','common','trade'], meta: 'value: base minor coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Silver Writ', desc: 'A reliable middle coin accepted by soldiers, inns, ferrymen, and guild clerks. Useful for day wages and modest adventuring purchases.', tags: ['economy','standard'], meta: 'value: daily expense coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Electrum Span', desc: 'An older alloy coin used in border markets and noble ledgers. Some merchants discount it unless the mint mark is verified.', tags: ['economy','mixed','appraisal'], meta: 'value: variable exchange' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Gold Crown', desc: 'A high-trust coin used for arms, animals, bribes, and formal contracts. Counterfeiting one is usually a hanging crime.', tags: ['economy','high value'], meta: 'value: major coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Platinum Sovereign', desc: 'A heavy reserve coin used by banks, temples, war offices, and crown agents. Rarely used in open markets.', tags: ['economy','reserve','rare'], meta: 'value: large settlement' },
];