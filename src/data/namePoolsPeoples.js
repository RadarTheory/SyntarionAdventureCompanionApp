// ─── Name pools for the other peoples (user, 2026-11-17) ─────────────────────────────────────────────────────────
// Real-world naming traditions, lightly shaped where a people calls for it; no names from games, novels or rulebooks.
// Keys are race ns → variant (or '*' to grow the race's own list). Lists are '|'-separated (m, f, s = surnames).

export const PEOPLE_POOLS = {
  durinak: {
    // Crag Dúrinak of chasms and hard metalwork → Icelandic and Old Norse smith-names.
    Kho: {
      m: 'Arngrim|Bardr|Bolverk|Dvalinn-son|Eyvind|Glumr|Gudbrand|Hallbjorn|Hrafnkel|Jarngrim|Kolbein|Kolskegg|Ljotr|Ofeig|Onund|Skapti|Starkad|Sturla|Thorgils|Thrand|Uni|Vemund',
      f: 'Asgerd|Bera|Gjaflaug|Grima|Hallveig|Hrefna|Jarngerd|Katla|Ljufa|Ormhild|Rannveig|Saeunn|Skjalda|Steinvor|Thorkatla|Una|Vigdis',
      s: 'Anvilcleft|Cragborn|Emberkeel|Gorgeholt|Hammarvik|Kolbrand|Sindrason|Slagveil|Smidhr|Steinholt|Tindrafell|Vatnajok',
    },
  },
  telari: {
    // Coastal and aquatic Tel'ari → Greek sea names and Breton / Welsh coastal names.
    Nereid: {
      m: 'Aegeon|Brennoc|Doros|Euripon|Gwynedd-ar|Halios|Kymon|Lir|Malo|Morvran|Nerion|Okeanor|Pelagon|Poros|Tegid|Thalasson|Triton-el|Yann|Zephyron',
      f: 'Amphitea|Bronwen|Ceridwen|Doris|Galene|Glaukea|Halia|Ianthe|Kymothea|Maela|Morwenna|Nerissa|Rhiannon|Spio|Thalassa|Thetisa|Tryfena|Ysolde',
      s: 'Ar-Mor|Coralline|Deepwater|Kerlaz|Lyonesse|Mer-Ys|Pelagios|Saltmere|Seafarrow|Tidewrought|Ys-Bihan|Wavecrest',
    },
  },
  fynlor: {
    // Periann of the yeoman shires → old English villagers.
    Hobylt: {
      m: 'Abel|Ambrose|Barnaby|Bartholomew|Benedick|Cuthbert|Dickon|Ebenezer|Fulk|Gilbert|Hob|Humphrey|Jasper|Josiah|Lambert|Ned|Oswin|Piers|Rafe|Simkin|Thaddeus|Wat|Wilkin',
      f: 'Agnes|Alys|Amice|Avice|Bess|Cicely|Dorcas|Edith|Elsabeth|Hawise|Isot|Joan|Kat|Lettice|Mabel|Maud|Nan|Petronel|Rosamund|Tibby|Win',
      s: 'Applegarth|Barleycorn|Brewer|Cobbold|Dimbleby|Fairweather|Goodyear|Hayward|Honeysett|Kettlewell|Littlejohn|Meadowcroft|Pennyfeather|Puddifoot|Thatcher|Underhay|Wheatley|Woolcott',
    },
    // Periann of the open steppe → Hungarian and Magyar country names.
    Kuduk: {
      m: 'Andras|Arpad|Balazs|Bence|Csaba|Dezso|Ferko|Gergo|Imre|Janko|Kalman|Laci|Miklos|Pista|Sandor|Szilard|Tibor|Zoltan|Gyuri',
      f: 'Aniko|Boglarka|Dorka|Erzsi|Etelka|Hajnal|Ilonka|Juci|Kata|Kincso|Marika|Piroska|Reka|Sari|Terka|Zsuzsa|Emese',
      s: 'Bakos|Csizmar|Fazekas|Gulyas|Juhasz|Kertesz|Kocsis|Lakatos|Molnar|Pasztor|Szabo|Takacs|Varga|Vadas',
    },
  },
  trink: {
    // Small-statured Trink of the high valleys → Alpine Swiss and Tyrolean.
    Pygmie: {
      m: 'Alois|Anselm|Beat|Florian|Fridolin|Gallus|Jost|Kaspar|Leodegar|Meinrad|Ruedi|Sepp|Toni|Ueli|Wendelin|Xaver',
      f: 'Annili|Brigitta|Dorli|Fränzi|Gritli|Heidi|Kathi|Lisi|Margritli|Mili|Rösli|Trudi|Vreni|Zita',
      s: 'Ammann|Brändli|Fässler|Gisler|Imhof|Käslin|Murer|Oberholzer|Schnyder|Tschudi|Wyss|Zgraggen',
    },
    // The mischievous, uncanny Trink of the borders → Scots Borders.
    Powrie: {
      m: 'Archie|Dand|Dougal|Eck|Fergie|Geordie|Hamish|Jock|Kenzie|Lachie|Murdo|Rab|Sandy|Tam|Wattie|Wull',
      f: 'Effie|Elspeth|Grizel|Ishbel|Jessie|Kirsty|Lilias|Maisie|Morag|Nessa|Senga|Tibbie',
      s: 'Armstrang|Crozier|Elliot-Ha|Graeme|Kerr|Laidlaw|Nixon-Burn|Rutherfurd|Scott-o-Buccleuch|Turnbull',
    },
    // The household and hearth Trink → Danish and Norwegian.
    Nisse: {
      m: 'Anders|Asmund|Bendt|Eskil|Frode|Gorm|Halvor|Jens|Knud|Mogens|Niels|Ole|Palle|Svend|Tormod|Troels',
      f: 'Ase|Bodil|Dorte|Gunhild|Inger|Karen|Kirsten|Lone|Mette|Rigmor|Sidsel|Tove|Ulla|Vibeke',
      s: 'Bakkegaard|Brønd|Fjeldsted|Grønbæk|Hjorth|Krogh|Lund|Nørgaard|Skovbo|Toft|Vestergaard-lille|Østergaard',
    },
    // The homestead Trink → Swedish farmstead names.
    Tomte: {
      m: 'Algot|Arvid|Bengt|Birger|Edvin|Folke|Gustav|Helmer|Ivar|Måns|Nils|Ragnar|Sixten|Torsten|Valdemar|Yngve',
      f: 'Agda|Alva|Britta|Ebba|Elin|Hedvig|Ingeborg|Karin|Linnea|Märta|Saga|Signe|Stina|Tyra',
      s: 'Bergqvist|Dahlgren|Ekholm|Forsberg|Gårdsman|Hedlund|Lindqvist|Lövgren|Nyström|Sandberg|Torpare|Åkerlund',
    },
  },
  djinn: {
    // Fire, heat and volatile force → Arabic and Persian names of fire and light.
    Efreet: {
      m: 'Azar|Barq|Jamr|Lahab|Muhrik|Nar-al-Din|Nuri|Saqr|Shihab|Sirr-al-Nar|Tawhaj|Wahhaj|Zafar|Atash|Azarbad|Mehrdad|Shararah-ibn',
      f: 'Azara|Dhuha|Lumia|Nahla|Nar|Noor|Saba|Shams|Shula|Sanaa|Tajalli|Wahaj|Atashi|Mehrnaz|Roshana|Tabassum',
      s: 'al-Jamra|al-Lahib|al-Mushta|Atashkadeh|Ibn Barq|Ibn Shihab|Kindled|of the Brass City|Sulphurine|Zafarani',
    },
    // Deep waters and fluid power → Arabic and Persian names of sea and rain.
    Marid: {
      m: 'Bahr|Ghayth|Ma-al-Ain|Mawj|Nahr|Ra\'d|Sahab|Yamm|Abtin|Daryush|Kiamars|Nilufar-son|Shadab|Tirdad',
      f: 'Bahara|Dima|Ghadir|Lujain|Maysun|Muzna|Nahra|Ruwayda|Yara|Abnous|Daryana|Mahtab|Nilou|Sahar',
      s: 'al-Bahri|al-Ghadir|Daryadel|Ibn Mawj|Lulu-ibn|Nahrawan|Saltborn|Tidebound',
    },
    // Earth, stone, the deep places → Arabic and Ottoman Turkish names of stone and mountain.
    Dao: {
      m: 'Akram|Ard|Hajar|Jabal|Jandal|Rasikh|Sakhr|Thabit|Tawd|Ahmet-Taş|Doruk|Kaya|Tunç|Yalın|Demir|Erkan',
      f: 'Fayruz|Jumana|Lulwa|Marjan|Yaqut|Zumurrud|Akasya|Bengisu|Derya-Taş|Elmas|Kayra|Mercan|Yeşim',
      s: 'al-Hajari|al-Jabali|Ibn Sakhr|Kayalı|Demirci|Taşkent-oğlu|Yerebatan|Deepvault',
    },
    // The Hinn → Persian names of wind and breath (their affinity is still to be set).
    Hinn: {
      m: 'Bad-e-Saba|Behrouz|Farhad|Golshan|Hirad|Kamran|Navid|Parviz|Shahab|Siavash|Sorush|Vahid|Yazdan',
      f: 'Arezoo|Azadeh|Bahar|Ghazal|Golnar|Laleh|Mina|Nasim|Pari|Sepideh|Shabnam|Taraneh|Yasaman',
      s: 'Badavi|Hamavi|Khorasani|Nasimi|Sabaei|Shahrzad-zadeh|Windward|Zephyrine',
    },
  },
  goblin: {
    // Troublesome, furtive, unsettling → Yorkshire and Lancashire dialect names.
    Boggart: {
      m: 'Aggie-lad|Bodkin|Dobbin|Grimbald|Hob|Lob|Mumbletoe|Nackerby|Nobbin|Scratt|Skulker|Tatterby|Thrumble|Tib|Wudget',
      f: 'Bessie-Nab|Dorrit|Grizzle|Hagsbeth|Midge|Nettie|Nobbet|Peggy-Lonk|Ratty|Scraddle|Tansy|Wenna',
      s: 'Barghest|Clatterbone|Coalhole|Dobbybrook|Gnarlwick|Hobthrush|Muckle|Pothole|Skrike|Tatter|Under-the-stair',
    },
    // Mischief, trickery, unpredictable encounters → Elizabethan English, playhouse and village.
    Puck: {
      m: 'Bottom|Christopher|Dickon|Fennel|Flute|Gobbo|Hal|Kit|Launce|Lob|Peaseblossom|Quince|Robin|Snug|Tobias|Will',
      f: 'Bess|Cicely|Doll|Fennella|Gillian|Jenny|Kate|Mab|Moll|Nell|Phoebe|Rosalin|Tib',
      s: 'Goodfellow|Gossamer|Hedgeborn|Merriwick|Pinchbeck|Quickthorn|Ragwort|Swiftly|Tumbledown|Wildwood',
    },
  },
  chronison: {
    // Forged by the Sszaral → sibilant designations.
    Ssythrilson: {
      m: 'Sessil|Sythrax|Ssarith|Syrrex|Issath|Vessix|Shassal|Ixsyl|Sorrith|Thessis|Sylix|Zassath',
      f: 'Sessil|Sythrax|Ssarith|Syrrex|Issath|Vessix|Shassal|Ixsyl|Sorrith|Thessis|Sylix|Zassath',
      s: 'Coil-3|Coil-9|Fang-12|Scale-40|Sibil-7|Sloughed-1|Venom-22|Shed-15|Hood-8|Tongue-31',
    },
    // Forged by the Dúrinak → rune-cut designations.
    Minurason: {
      m: 'Anvilwright|Bolt|Cinder|Crucible|Forgeling|Ingot|Kiln|Rivet|Runemark|Slag|Tempered|Tongs',
      f: 'Anvilwright|Bolt|Cinder|Crucible|Forgeling|Ingot|Kiln|Rivet|Runemark|Slag|Tempered|Tongs',
      s: 'Hall-IV|Hall-IX|Deep-7|Rune-Ansuz|Rune-Thurs|Rune-Kaun|Seam-13|Vein-21|Anvil-3|Hearth-40',
    },
    // Forged by Ramaei → designations of craft and hand.
    Ainison: {
      m: 'Amber|Attendant|Clement|Constant|Herald|Measure|Patient|Steward|Tender|Vigil|Votive|Witness',
      f: 'Amber|Attendant|Clement|Constant|Herald|Measure|Patient|Steward|Tender|Vigil|Votive|Witness',
      s: 'Ramaei-1|Ramaei-7|Ramaei-12|Hand-of-R|First-Made|Second-Made|Ninth-Made|Workshop-3|Mark-II|Mark-V',
    },
  },
  drakazir: {
    // Lineage-proud, ancient → Akkadian, Babylonian and old Persian, grown into clan names.
    '*': {
      m: 'Adad-shar|Ashur-nasir|Belshar|Ea-nasir|Enlil-dan|Gimil|Hammur|Ishme|Kurigal|Marduk-zakir|Nabu-rai|Nergal-ush|Sargon-az|Shalmar|Tiglath|Zimrilim|Ardashir|Bahram|Kambiz|Khshayar|Vishtasp',
      f: 'Ahassunu|Amat-Ishtar|Belessunu|Enheduan|Ishtaru|Kubaba|Naqia-ra|Ninsun|Sammur|Sabitum|Shibtu|Tashmetu|Zakutu|Atossa|Parysat|Rhodogune|Shahrzad',
      s: 'Ashurkhal|Babilani|Dur-Sharrukin|Eridu-kar|Isinnu|Kalhu-zar|Lagashi|Nimrudan|Nippuri|Sipparan|Ummaki|Urukhan|Achaemen|Pasargadi',
    },
  },
  helianth: {
    // Infernal ancestry, cool-blooded → Late Latin, Byzantine Greek and Akkadian.
    '*': {
      m: 'Abaddon-el|Asmodan|Basilides|Belisar|Caspian|Cyprian|Demetrian|Eligius|Flavian|Gaius|Isauros|Lucan|Maximin|Nikephor|Severian|Tiberian|Valens|Zosimus|Nergaliel|Shamash-el',
      f: 'Anthousa|Basilissa|Cassia|Eudokia|Galla|Irene|Justa|Lucilla|Marcia|Melania|Placidia|Severa|Sophronia|Theodosia|Thekla|Zoe|Lilit|Ninlil-a',
      s: 'Ashgrave|Calcedon|Cinderhall|Dukas|Komnenos|Laskaris|Mournhold|Phokas|Sulphurine|Tarsus|Vatatzes|Vesperine',
    },
  },
  seraphan: {
    // Celestial-blooded → Hebrew, Latin and Greek names of light and grace (the female names and surnames were thin).
    '*': {
      m: 'Ariel|Azariah|Barachiel|Gabriel|Jophiel|Lucian|Raphael|Sealtiel|Uriel|Zadkiel',
      f: 'Aurelia|Azariah|Celeste|Elianna|Eliora|Galatea|Halcyon|Iolanthe|Liora|Lucia|Lumina|Ophira|Orla|Seraphine|Solenne|Talia|Uriela|Yael|Zahara|Zerah',
      s: 'Brightvale|Candor|Clearwater|Dawnward|Halcyon|Lightborne|Morningstar-Vale|Radiant|Sunmantle|Truehaven|Vigil|Whitehallow',
    },
  },
  maugar: {
    // Tall, broad, braided, unfailingly courteous wilderness folk → Scottish Gaelic and Irish.
    '*': {
      m: 'Ailean|Beathan|Calum|Coinneach|Donnchadh|Eachann|Fearchar|Fionnlagh|Gilleasbuig|Iain-mor|Lachlann|Murchadh|Niall|Ruairidh|Somhairle|Tormod|Uisdean',
      f: 'Aoife|Beathag|Caitriona|Ciorstaidh|Deirdre|Eilidh|Fionnghal|Isbeal|Mairead|Morag|Muireall|Raghnaid|Seonag|Sine|Una',
      s: 'Mac an Fhraoich|MacCoinnich|MacLeòid|MacRath|Moran-Glen|Ó Dálaigh|Ó Fiannachta|Strathbeg|Torridon|Uí Néill',
    },
  },
  tiol: {
    // Born of Vàld Addamar and Dark Tel'ari → Norse given names with an elvish turn.
    '*': {
      m: 'Arnvaldir|Bjarnael|Eirvald|Geirion|Haldaris|Hrafnel|Ingvaril|Ketilor|Ormaril|Skaldrin|Sveinael|Thorvalin|Ulfaris|Vemundel',
      f: 'Asthiel|Brynhael|Eydisa|Freyael|Gunnveil|Hildara|Ingriel|Ragnael|Sigrael|Solvaria|Thyrael|Valdisa',
      s: 'Darkfjord|Hrafnvald|Night-Jarl|Shadowkeel|Skjaldborn|Stormreave|Ulfmoor|Vald-of-Diymyr',
    },
  },
  folwoade: {
    // Coalesced from pure resonance → Latin and Welsh words of light and song.
    '*': {
      m: 'Aether|Cantor|Caradoc|Ennis|Gwion|Ithel|Lumen|Lyric|Meirion|Resonant|Sylvan|Taliesin|Tegwyn|Vesper',
      f: 'Aria|Cadence|Carys|Echo|Eirian|Gwawr|Heledd|Lumina|Lyra|Melisande|Seren|Sirona|Tesni|Vesperine',
      s: 'Brightsong|Chime|Glimmer|Harmonia|Lightwell|Resonance|Shimmerfall|Starthread|Stillwater|Wellspring',
    },
  },
};
