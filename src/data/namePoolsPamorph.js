// ─── Pa'morph bloodline name pools (user, 2026-11-17) ────────────────────────────────────────────────────────────
// Each bloodline draws on a real-world tradition tied to its animal's homeland or folklore; the Sauric, Ferra and
// Astral bloodlines share one pool per group. No names from games, novels or rulebooks. Keys are bloodline ids.

const SAURIC = {
  // Great old lizard-folk → Quechua and Aymara of the high Andes.
  m: 'Amaru|Apu|Atoq|Awki|Illapa|Inti-runa|Kusi|Mallku|Manqu|Pachaku|Qhapaq|Rumi|Sinchi|Tupaq|Wayra|Yawar|Kuntur|Ukumari',
  f: 'Chaska|Illari|Kantu|Killa|Kusi-Qoyllur|Mayta|Micay|Nayra|Pacha|Phaxsi|Qoya|Sisa|Suyana|Tamya|Urpi|Wayta',
  s: 'Antisuyu|Chinchay|Hatun-Rumi|Kallawaya|Machu|Pachamama-kin|Qollasuyu|Rumiñawi|Sach\'a|Wari|Yupanki',
};
const FERRA = {
  // Chitinous and tentacled folk → Lithuanian and Latvian, with an edge of the strange.
  m: 'Algirdas|Arvydas|Gediminas|Jurgis|Kestutis|Mindaugas|Rimvydas|Skirmantas|Vytenis|Zigmas|Kristaps|Valdis|Arturs|Janis',
  f: 'Aldona|Biruta|Danute|Gintare|Jurate|Laima|Milda|Ruta|Saule|Zemyna|Austra|Ieva|Liga|Zane',
  s: 'Chitinaitis|Gelmeikis|Kaulas|Klevas|Kriauklis|Liepa|Medzius|Nendre|Ozolins|Spiralis|Vilks-Ass|Zvejnieks',
};
const ASTRAL = {
  // Otherworldly star-touched folk → Sanskrit names of stars and sky.
  m: 'Aakash|Angaraka|Ashvin|Budha|Chandrak|Dhruva-khel|Graha|Jyotis|Mrigash|Nakshatra|Pushya|Rohit|Shravan|Tarak|Vyom',
  f: 'Anuradha|Ashlesha|Chitra|Jyeshtha|Kritika|Revati|Shatabhisha|Swati|Tara|Uttara|Vishakha|Rohini-khel',
  s: 'Akashganga|Dhumaketu|Grahavarti|Jyotirmaya|Nakshatri|Taravali|Vyomachari|of the Khell',
};

export const PAMORPH_POOLS = {
  // ── Major without a list ──
  // Feline, from Ehlsse → Persian and Kurdish.
  karazelith: {
    m: 'Arsalan|Babak|Dariush|Ferydun|Kourosh|Manuchehr|Nariman|Shahin|Sohrab|Zal|Kaveh-zel|Mazdak',
    f: 'Afarin|Banafsheh|Farangis|Golbahar|Mahsa|Nazanin|Pegah|Rudabeh|Shahnaz|Tahmineh|Zhila',
    s: 'Ehlssevar|Golestan|Kermani|Mazandar|Pahlavand|Shahnameh-kin|Zarrin',
  },
  // Elephant, ancestral memory → Thai and Khmer.
  gajaroi: {
    m: 'Anan|Boonmee|Chakri|Kiet|Prasert|Sakda|Somchai|Sunthorn|Thongchai|Veha|Chanthy|Sokha',
    f: 'Achara|Boupha|Chantrea|Dara|Kanya|Malee|Nittaya|Pranee|Sophea|Srey|Wanida',
    s: 'Angkorn|Chaiyaphum|Khmerath|Naga-Thong|Ratanak|Siamwong|Thepkhun',
  },
  // Bear → Finnish and Sámi.
  kodan: {
    m: 'Aatu|Eero|Hannu|Ilmari|Jouko|Kalevi|Lauri|Mikko|Otso|Pekka|Toivo|Unto|Ánde|Niillas',
    f: 'Aino|Elina|Helmi|Ilona|Kaisu|Lempi|Marjatta|Otsela|Saara|Tyyne|Ánne|Máret',
    s: 'Karhunen|Korpela|Metsola|Otsonen|Pohjola|Talvela|Tunturi|Vuorinen',
  },
  // Hare: its list lost names lifted from a game; refilled from Irish hare folklore and given names.
  harelin: {
    m: 'Ciarán|Cormac|Donal|Fergal|Giolla|Lorcan|Ruairí|Tadhg', f: 'Clodagh|Gráinne|Maeve|Niamh|Orlaith|Saoirse|Sorcha',
    s: 'Ó Giorria|Mac Gearr|Moorhare',
  },
  // ── Minor ──
  arbor: { // Boar → Gaulish and old Breton.
    m: 'Ambiorix|Brennos|Cingeto|Dumnorix|Esugen|Moccos|Orgetor|Taranis-son|Uxellos|Vercassiv', f: 'Arduinna|Brigantia|Dannonia|Epona-ka|Moccia|Nantosvelta|Rosmerta|Sirona-ka|Uxella',
    s: 'Moccos-Wold|Oakhollow|Tuskhaven|Vernemeton|Wildsow',
  },
  avali: { // Songbird → Hawaiian-inspired syllables of song.
    m: 'Kalani|Keoni|Lono|Makoa|Nalu|Pono|Kekoa|Ikaika|Mele-ko', f: 'Alani|Hoku|Iolana|Kailani|Leilani|Malia|Mele|Nohea|Puanani',
    s: 'Manu-lele|Mele-ana|Nahenahe|Olioli|Pualani',
  },
  bjoral: { // Badger → Norwegian.
    m: 'Bjarte|Eilev|Gaute|Hallstein|Kjetil|Ottar|Sjur|Tarjei|Torgeir|Vebjørn', f: 'Aslaug|Borghild|Gro|Hallgerd|Ragnfrid|Sigrun|Torunn-vik|Turid|Vigdis-dal',
    s: 'Grevling|Hiholt|Myrvold|Stenseth|Tunnelsvik',
  },
  dervir: { // Elk → Scottish Gaelic highlands.
    m: 'Aonghas|Brochan|Cailean|Dughall|Fionn|Gormal|Loarn|Seumas|Tavish', f: 'Ailsa|Brighde|Eithne|Fionnuala|Isla|Mairi|Oighrig|Peigi|Seonaid',
    s: 'Ardmore|Glenlyon|Mac Fhiadh|Rannoch|Strathspey',
  },
  faylorn: { // Animal still to be recorded → Cornish, old and soft.
    m: 'Bran-ow|Cadoc|Gerens|Jory|Kenan|Madern|Petrok|Ruan|Tristan|Yestin', f: 'Bryluen|Demelza|Elestren|Kerensa|Lowena|Morwenna-ow|Rosenwyn|Tamsin|Wenna',
    s: 'Chywoone|Pengelly|Polgrain|Tregarthen|Trevanion',
  },
  rylkath: { // Canine, of the open plains → Kazakh and Mongolian.
    m: 'Altan|Arslan|Batu|Bolat|Chingis-ar|Erlan|Kairat|Nurlan|Temur|Yesugei', f: 'Aigerim|Altynai|Anar|Gulnara|Khulan|Saule-ai|Tomiris|Zarina-ai|Oyuun',
    s: 'Bori-khan|Kokzhal|Steppeborn|Ulaan-chono|Zhetisu',
  },
  rhulkin: { // Frog, wet ground → Vietnamese.
    m: 'An-thuy|Binh|Duc|Hai|Hung|Khanh|Long-ho|Minh|Phuc|Thanh|Tuan', f: 'Anh|Hoa|Lan|Linh|Mai|Ngoc|Phuong|Thu|Tuyet|Xuan',
    s: 'Bao-dam|Ho-ven|Lua-nuoc|Mekong-tu|Song-xanh',
  },
  krokodon: { // Crocodile → Ancient Egyptian of the Nile marshes.
    m: 'Bakenkhons|Hapi-ankh|Iahmes|Khonsu-em|Nebsen|Sebek-em|Senbi|Wenni', f: 'Amunet-sa|Hapi-nefer|Ipy|Meresankh|Nebetta|Sebekneferu|Takhat|Wabet',
    s: 'of Shedet|of the Reeds|Nile-mouth|Sobekhaven',
  },
  lutrav: { // Otter → Welsh river names.
    m: 'Afon|Dafydd|Emlyn|Gwyn|Ianto|Iolo|Llew|Meurig|Owain|Tudur', f: 'Angharad|Ffion|Gwenllian|Lowri|Mared|Nia|Nonn|Siwan|Tegan',
    s: 'Aberdyfi|Glanrafon|Llynfi|Rhydlewis|Tywi-glan',
  },
  murinor: { // Mouse → Italian, small towns.
    m: 'Beppe|Ciro|Dario|Enzo|Gigi|Lino|Nello|Pino|Rocco|Tito', f: 'Bice|Carmela|Gina|Lucia-na|Nina|Pina|Rina|Teresina|Tina',
    s: 'Bellini|Formaggio|Granello|Picciolo|Topolini',
  },
  musteiah: { // Weasel → Romani and Balkan.
    m: 'Bavol|Django|Fonso|Kizzy-o|Luca|Milosh|Pesha|Shandor|Stevo|Tamás', f: 'Drina|Florica|Kezia|Lala|Mirela-ka|Nadya|Shofranka|Tsura|Zora-ka',
    s: 'Lungo-drom|Mustelan|Quickpaw|Rombal|Sly-Vardo',
  },
  oryzd: { // Rat (Oryzo) → Victorian London streets.
    m: 'Alf|Arfur|Bert|Dodger-ley|Erb|Fred|Jem|Nobby|Sid|Wilf', f: 'Dot|Flo|Gert|Lil|Mags|Nell|Polly|Queenie|Vi',
    s: 'Blackfriars|Cheapside|Gutterwick|Limehouse|Smithfield',
  },
  porthu: { // Animal still to be recorded → Portuguese seafaring.
    m: 'Afonso|Bartolomeu|Duarte|Fernão|Gaspar-o|Henrique|Nuno|Pêro|Tristão|Vasco', f: 'Branca|Filipa|Graça|Inês-a|Leonor-a|Madalena|Mécia|Violante|Urraca',
    s: 'da Ponta|de Sagres|do Mar|Ribeira|Tejo-alto',
  },
  procyon: { // Raccoon, dexterous and inquisitive → Cajun and Acadian French.
    m: 'Alcide|Amédée|Boudreaux|Clovis|Dolphus|Euclide|Lucien|Ovide|Thibodeaux', f: 'Adélaïde|Clémence|Delphine-o|Émeline|Odile|Philomène|Rosalie|Séraphine',
    s: 'Arceneaux|Bayou-Teche|Fontenot|Guidry|LeBlanc-Mask',
  },
  quercian: { // Squirrel, of the oak → Romanian.
    m: 'Bogdan-u|Codrin|Dorin|Florin|Horea|Ionuț|Mircea|Radu|Sorin|Tudor', f: 'Anca|Codruța|Doina|Ileana|Ioana|Miruna|Oana|Sânziana|Viorica',
    s: 'Codreanu|Frunză|Ghinda|Stejaru|Veverița',
  },
  soricyn: { // Shrew, quick and small → Czech.
    m: 'Bořek|Jiříček|Kuba|Lojza|Matěj|Pepík|Tonda|Vašek|Vojta', f: 'Anička|Bětka|Eliška|Jitka|Kačka|Liduška|Majda|Zdenka',
    s: 'Drobný|Hraboš|Myšák|Rychlík|Šedivka',
  },
  suiei: { // Animal still to be confirmed → Japanese, river and reed.
    m: 'Kawa-ji|Mizuki|Ren|Sōta|Suiei|Taiga|Yūsei|Hotaru-o', f: 'Ayumi|Hotaru|Izumi|Minori|Mizuho|Nagisa|Shizuku|Suzume',
    s: 'Ashihara|Kawabe|Minase|Mizushima|Suimon',
  },
  talpyn: { // Mole, of the deep tunnels → Cornish tin-miners.
    m: 'Bal-Jory|Cador|Davey|Jago|Kitto|Pascoe|Treloar|Zacky', f: 'Blejan|Cherry|Jenna|Kitty|Loveday|Morvoren|Tressa|Wenna-bal',
    s: 'Bal-maiden|Carn-dhu|Delve-deep|Penhallow|Wheal-Rose',
  },
  vanara: null, // The simian pool already serves the Vanara.
  brumal: { // Bear, of winter → Russian north.
    m: 'Afanasy|Burian|Gleb|Kuzma|Matvei|Prokhor|Savva|Trofim|Zakhar', f: 'Agafya|Fevronia|Marfa|Praskovya|Snezhka|Ulyana|Vasilisa-zima|Yevdokia',
    s: 'Belomorov|Medvedev|Morozko|Severin|Zimovy',
  },
  // ── Sauric, Ferra and Astral share their group's pool ──
  hraelvan: SAURIC, jevrak: SAURIC, pterrotara: SAURIC, hadrynn: SAURIC, saurok: SAURIC, cerakhjorn: SAURIC, anpryd: SAURIC, limridh: SAURIC,
  illithid: FERRA, arachim: FERRA, prajn: FERRA, mawjacket: FERRA,
  khellv: ASTRAL, khellskini: ASTRAL, khellhanae: ASTRAL, khellyuum: ASTRAL,
};
