-- World Map POIs from the Inkarnate map "Soteria (UPDATED)" (offline backup, 2026-11-17).
-- 119 note pins: name, region (from the Official Reference headings), the pin's note text, and a type picked from the
-- name (dungeon / ruin / camp / port / landmark, otherwise city). Old pins that are moved keep their own type.
-- Positions are percentages of SoteriaMap.jpg, the same 8192-wide export as the Inkarnate scene.
-- 13 pins that sat beside their art were nudged onto it after a close-up check of every pin.
-- Source list: scripts/world-map-pois.json
--
-- Replaces the old shared pins:
--   * an old pin with the same name is moved in place (its id is kept, so party_position rows that point at it survive);
--   * new pins are inserted;
--   * other old shared pins are deleted, unless a party is standing on one (party_position.location_id), which is kept.
-- Campaign-specific pins (campaign_id set) are left alone. Safe to run twice.

begin;

create temp table poi (name text, type text, region text, x_pct double precision, y_pct double precision, notes text) on commit drop;
insert into poi (name, type, region, x_pct, y_pct, notes) values
  ('AEIRHYD''S DEPTHS', 'dungeon', 'Veridora · Sylvan Grove', 45.776, 25.346, 'Resting Place of Aeirhyd, Neutral Sea Dragon of Warman''s Lake'),
  ('Albion', 'city', 'Atu', 31.2991, 85.3272, 'The city on the back of Atuin'),
  ('ALDERMORE', 'city', 'Veridora · Corren Range', 53.638, 35.395, 'Unified Kingdom Village 
Reuhnar''s Temple'),
  ('ANCIENT MAZE', 'dungeon', 'Veridora · Brivihan Plains', 57.239, 50.218, ''),
  ('ARAKA', 'city', 'Aerithos', 66.687, 38.388, 'Kenku Pirate Cove Charrak''s Summoning Circle'),
  ('ARANGHTHAL', 'city', 'Paravel', 43.542, 81.17, 'Jötunbane Dragonborn Clan Camp 
Sons of Serenwen'),
  ('ARIDARA', 'city', 'The Seven Isles', 8.02, 74.139, 'HIMRING: A CITY ON THE SOUTH WESTERN ISLE OF SOTERIA'),
  ('ASHENDELL', 'city', 'Veridora · Corren Range', 54.517, 43.543, 'Unified Kingdom Capitol'),
  ('AVALORA', 'city', 'Beranthes', 64.526, 67.155, 'Kingdom Capitol, King Aric of the Unified Kingdom'),
  ('BA''ELNIM''S RESTING PLACE', 'landmark', 'Beranthes', 66.321, 82.382, ''),
  ('BAELRUS'' PAGODA ALTAR', 'landmark', 'Paravel', 41.65, 90.981, 'Baelrus'' Altar'),
  ('BRINEHOLME FOREST', 'landmark', 'Lilith''iel', 27.759, 57.938, 'The Tree of Týr'),
  ('BROKEN CATHEDRAL', 'ruin', 'Veridora · The Moors', 42.749, 42.521, ''),
  ('BRONZE DOORS', 'landmark', 'Veridora · Chronolithe Wastes', 56.97, 28.031, 'Dwarven Graniteheart Clan'),
  ('CAERLŶF', 'city', 'Veridora · The Moors', 49.561, 66.347, 'Taer''anari Ludas Encampment'),
  ('CALDOR', 'city', 'Makeda Kwetu', 75.33, 69.625, 'Unified Kingdom Camp'),
  ('CIELO DORADO', 'city', 'The Seven Isles', 12.915, 9.811, 'XUNANTUNICH: A CITY ON THE NORTH WESTERN ISLE OF SOTERIA'),
  ('COATL', 'city', 'Aerithos', 64.5262, 26.7717, 'Yuan-Ti City Lyxicah''s Herem'),
  ('CORRANH', 'city', 'The Seven Isles', 90.198, 72.595, 'CORRANHOS: A CITY ON THE SOUTH EASTERN ISLE IN SOTERIA'),
  ('CORREN MOUNTAIN MINES', 'landmark', 'Veridora · Corren Range', 49.133, 39.481, 'Dwarven Grimrock Clan 
Duneyrr''s Obelisk'),
  ('DAR AL-FAKHAMA', 'city', 'Zhallakan', 80.872, 35.3239, 'Brunar Naval City'),
  ('DARK ELF CAMP', 'camp', 'Veridora · Chronolithe Wastes', 58.057, 40.55, ''),
  ('DEADBROOK', 'city', 'Veridora · The Moors', 39.441, 50.337, 'Fishing Town'),
  ('DJEKOTO', 'city', 'Makeda Kwetu', 75.732, 56.346, 'Matekwan Capitol'),
  ('DRAK''AR', 'city', 'Veridora · Sylvan Grove', 42.078, 17.484, 'Drow Capitol 
Firreth Summoning Circle'),
  ('DUNGEON OF THE DRAGON POOL', 'dungeon', 'Veridora · Chronolithe Wastes', 55.908, 32.592, ''),
  ('EBBA', 'city', 'Veridora · The Moors', 53.906, 57.249, 'Unified Kingdom Naval City (Mayor Beckwith)'),
  ('ELDDIM', 'city', 'Veridora · The Moors', 39.27, 40.241, 'Unified Kingdom Capitol'),
  ('ELDRATHAR', 'city', 'Lilith''iel', 31.445, 51.548, 'Loxodon Capitol 
Thàl''s Altar'),
  ('ELMOIRE', 'city', 'Veridora · Corren Range', 52.93, 46.013, 'Satyr Grove 
Dionysia Ritual Site'),
  ('ELVEN RUINS', 'ruin', 'Veridora · Sylvan Grove', 37.207, 26.344, ''),
  ('EMBRELYN', 'city', 'Veridora · Brivihan Plains', 61.755, 55.016, ''),
  ('ENEOWA', 'city', 'Paravel', 38.367, 80.03, 'Unified Kingdom City 
Shevar''s Palace'),
  ('EPHAM', 'city', 'The Seven Isles', 53.0635, 88.5579, 'BRIDGE OF SYLPH: Entrance to the Bridge of Sylph'),
  ('EYMONT', 'city', 'Kul''kal Rakhar', 81.335, 79.602, ''),
  ('FALCHON''S ACHE', 'city', 'Aerithos', 64.966, 46.702, 'Fi''harta Temple'),
  ('FALHZER', 'city', 'Veridora · The Moors', 40.369, 46.369, 'Unified Kingdom City'),
  ('FROSTPEAK', 'city', 'Veridora · Falorn Fjords', 54.028, 27.746, 'Goliath Mountain City'),
  ('GALEKGARDE', 'city', 'Lilith''iel', 23.743, 84.52, 'Southern Inn in Lilith''iel'),
  ('GAMDON', 'city', 'Veridora · Sylvan Grove', 51.086, 19.978, 'Rhae''inar, Loxodon, Giff settlement 
Sharalya''s Tabernacle'),
  ('GATEWAY TO THE WASTES', 'landmark', 'Veridora · Brivihan Plains', 56.946, 41.547, ''),
  ('GIFFTON', 'city', 'Veridora · The Moors', 44.861, 50.099, 'Giff Camp 
Barracks of Klarrosh'),
  ('GLY''WNFRON', 'city', 'Makeda Kwetu', 81.909, 62.879, 'Owlin Capitol 
Luen''eir Reliquery'),
  ('GOLGOTHA PASS', 'landmark', 'Veridora · Corren Range', 47.217, 48.246, ''),
  ('GREAK OAK FORREST', 'landmark', 'Veridora · The Moors', 51.477, 62.523, 'Sy''vros''s Roots'),
  ('GROUNDS OF VEZZAKAR', 'landmark', 'Lilith''iel', 30.566, 56.822, 'Vezzakar''s Altar'),
  ('HADMONT', 'city', 'Veridora · The Moors', 53.711, 70.528, 'Unified Kingdom City (King Praetor) 
Ba''elnariani Temple'),
  ('HAUF', 'city', 'Veridora · Sylvan Grove', 49.426, 24.087, 'Aarakocra encampment 
Ailuris'' Shrine'),
  ('HEIDBOROUGH', 'city', 'Veridora · Brivihan Plains', 58.594, 46.94, 'Gnome underground city hidden under a statue'),
  ('HLONDETH', 'city', 'Veridora · Chronolithe Wastes', 59.399, 35.585, 'Chronolithe Yuan-Ti Encampment Syraxiz Shrine'),
  ('HULNOM', 'city', 'Dorhaven · The Grim Isle', 67.7121, 58.9831, 'Abandoned City Ruins 
Urul''s Offering Stone'),
  ('IFOR''S CAVE', 'dungeon', 'Zhallakan', 71.5578, 22.235, 'Stormdragon''s Hoarde'),
  ('JACK RED-LOCK BAY', 'port', 'Red Lock Bay', 53.577, 8.3383, ''),
  ('JUMLET', 'city', 'Zhallakan', 79.187, 20.572, 'Brunar Trade City
Asherah''s Altar'),
  ('KARAK BYRN', 'city', 'Veridora · The Moors', 47.461, 44.041, 'Dwarven YewHammer Clan Mines'),
  ('KRA''ARK', 'city', 'Zhallakan', 71.399, 26.534, 'Ra''Kesh Kenku Clan Village'),
  ('LUMINA', 'city', 'Veridora · Brivihan Plains', 55.835, 54.019, 'Unified Kingdom City'),
  ('LUTETIA', 'city', 'The Dinidae Insula', 69.812, 4.917, 'Tortle Pirate Cove'),
  ('LYCHARROW', 'city', 'Veridora · Corren Range', 52.405, 53.638, 'Tear''anari Village'),
  ('MAAKURG''S ALTAR', 'landmark', 'Veridora · Corren Range', 50.745, 47.866, 'Maakug''s Altar'),
  ('Maernethim Village', 'city', 'Veridora · Sylvan Grove', 48.462, 15.369, 'Baeshra''s Altar'),
  ('MARAVI', 'city', 'Makeda Kwetu', 77.441, 66.775, 'Matekwan City'),
  ('MARRIGIZH''AR', 'city', 'Lilith''iel', 23.792, 44.445, 'Genasi Abandoned City 
Dra''Agora''s Acropalis'),
  ('MERCHANT''S INLET', 'port', 'Dunalach', 31.1406, 8.5991, 'Naval Trade City'),
  ('MIRADOR', 'city', 'The Seven Isles', 8.105, 44.493, 'UMBERFELL: A CITY ON THE WESTERN OUTSKIRTING ISLE OF SOTERIA'),
  ('MISTCLIFF', 'city', 'Aerithos', 64.148, 32.687, 'Aarakocra Capitol'),
  ('N''QUYTHALAS', 'city', 'Lilith''iel', 27.3561, 22.5908, 'Drow City'),
  ('NEW HARSTEN', 'city', 'Veridora · Brivihan Plains', 58.923, 43.329, ''),
  ('NNEBE', 'city', 'Makeda Kwetu', 80.432, 56.655, 'Matekawn City 
Denke''s Shrine'),
  ('NOVAHR', 'city', 'The Seven Isles', 90.991, 7.221, 'TIBER: A CITY ON THE NORTH EASTERN ISLE OF SOTERIA'),
  ('ORMR', 'city', 'Zhallakan', 75.378, 19.455, 'Brunar Capitol'),
  ('PAIOS', 'city', 'Kul''kal Rakhar', 75.562, 87.798, 'Simian Camp 
Gorùn''s Altar'),
  ('PENTHOSANCTUM', 'city', 'Dorhaven · The Grim Isle', 66.431, 54.066, 'Unified Kingdom Bastille'),
  ('PHLEGETH', 'city', 'Lilith''iel', 22.375, 65.255, 'Tiefling City Capitol'),
  ('POACHER''S CAMP', 'camp', 'Veridora · Sylvan Grove', 42.993, 34.231, 'Thorne Lumber  & Ore Research Team Camp'),
  ('PORT HALDANE', 'port', 'Dunalach', 36.108, 12.139, 'Port City'),
  ('PRIOKOS', 'city', 'Makeda Kwetu', 72.705, 63.853, 'Leonin Pride Settlement 
Auron''s Temple'),
  ('PYROTHOS', 'city', 'Lilith''iel', 23.1686, 75.1843, 'Sýr''eth Sighting'),
  ('QUYNTHE''RA', 'city', 'Veridora · Sylvan Grove', 42.615, 27.556, 'Elven City in the trees 
Fi''harta''s Altar'),
  ('RAZOR''S POINT', 'city', 'Veridora · The Moors', 46.252, 65.872, '(Gra''adok Clan): Orc War Camp'),
  ('RED-LOCK''S SHIPWRECK', 'ruin', 'Beranthes', 72.1553, 80.7185, ''),
  ('REVELRY HEMLOCK', 'city', 'Lilith''iel', 20.9474, 90.8862, 'Satyr Settlement'),
  ('Rimehollow', 'city', 'Veridora · Falorn Fjords', 56.323, 22.211, ''),
  ('ROOKVALE', 'city', 'Veridora · Sylvan Grove', 47.144, 22.163, 'Village on Warman''s Lake Hreidmar''s Altar'),
  ('SANCTUM', 'city', 'Verdelie''re · The Enchanted Isle of Wonders', 74.805, 40.621, 'SANCTUM The Enchanted Isle of Wonders'),
  ('SARAZANA', 'city', 'Paravel', 41.956, 86.824, 'Cath''vari Grand Capitol'),
  ('SERENEA', 'city', 'Veridora · The Moors', 44.995, 43.234, 'Cath''vari settlement 
Selvaris'' Chapel'),
  ('SHEVAR''S ALTAR', 'landmark', 'Veridora · The Moors', 42.102, 62.428, 'Shevar''s Altar'),
  ('SOEFERUS', 'city', 'Lilith''iel', 25.464, 23.256, 'Llewell and Caragar''s Roost: 
Knoneus'' Paramore'),
  ('STEEL COAST', 'landmark', 'Veridora · Chronolithe Wastes', 59.412, 38.364, ''),
  ('STONEMIRK', 'city', 'Veridora · Chronolithe Wastes', 60.034, 27.603, 'Dwarven sentry outpost'),
  ('STORMWATCH', 'city', 'Dunalach', 24.329, 11.592, 'Unified Kingdom Naval City'),
  ('STRANGE POND', 'landmark', 'Veridora · Falorn Fjords', 54.529, 25.631, 'Secret Entrance to the Ebonshroud Hand Compound'),
  ('THE DRAGONMAW CLAN CAMP', 'camp', 'Kul''kal Rakhar', 78.333, 91.337, 'Orc Clan Camp'),
  ('THE FROZEN BOG', 'landmark', 'Veridora · Falorn Fjords', 51.501, 25.679, 'Frostspire Citadel
 Gul''danhrhock Outpost'),
  ('THE GRA''ADOK CLAN CAMP', 'camp', 'Kul''kal Rakhar', 83.716, 82.809, 'Orc Tribe'),
  ('THE GREAT FOUNDRY', 'city', 'Aerithos', 62.695, 14.894, 'Unified Kingdom Industrial Foundry'),
  ('THE GUL''DANHRHOCK CLAN CAMP', 'camp', 'Kul''kal Rakhar', 79.724, 89.698, 'Orc Clan Camp'),
  ('THE OLD LAGOON', 'landmark', 'Veridora · The Moors', 38.367, 33.969, ''),
  ('THE PLACE OF THE LOST VOICES', 'landmark', 'Veridora · Falorn Fjords', 58.411, 25.323, 'Whisphering Frostwraith Lair'),
  ('THE RUINS OF SZAR', 'ruin', 'Veridora · Chronolithe Wastes', 58.618, 30.953, ''),
  ('THE VEILED KNOLLS', 'landmark', 'Veridora · The Moors', 48.523, 52.95, 'Veridoran Village'),
  ('THERIENSTADT', 'city', 'The Menagerie', 46.313, 10.666, 'Pa''morph Capitol'),
  ('THETIS', 'city', 'Beranthes', 61.8528, 74.7327, ''),
  ('THIETMAR''S ALTAR', 'landmark', 'Beranthes', 58.594, 77.583, 'Thietmar''s Altar'),
  ('TREAHNOA', 'city', 'Lilith''iel', 25.598, 67.416, 'Unified Kingdom City on the Coast 
Mýr Temple'),
  ('TREYVIN', 'city', 'The Seven Isles', 92.48, 46.655, 'LIRISIUM: A CITY ON THE EASTERN  ISLE OF SOTERIA'),
  ('TRYSTIQUE', 'city', 'Trystique', 89.27, 25.917, 'The City of Arrana'),
  ('VALESTONE', 'city', 'Lilith''iel', 32.117, 61.953, 'Unified Kingdom City'),
  ('VALORHOLD', 'city', 'Valorhold', 48.059, 71.953, 'Unified Kingdom Outpost 
Lótjarr''s Table'),
  ('VELHURR', 'city', 'Red Lock Bay', 56.36, 8.124, 'Tortle Atoll Ku''rma''s Market'),
  ('VLARETH', 'city', 'Lilith''iel', 30.566, 70.908, 'Örlögsylfir Dragonborn Clan Camp
Sons of Llewell'),
  ('VONYALAR', 'city', 'Nari''ath', 18.335, 23.755, 'Tip of Nazari Captiol'),
  ('WEALDSTONE', 'city', 'Veridora · Brivihan Plains', 58.655, 58.817, 'Veridoran Trade City Ylandar''s Temple'),
  ('WHIMWOOD', 'city', 'Verdelie''re · The Enchanted Isle of Wonders', 77.063, 41.809, 'Fae Village'),
  ('WITHERED DRAKE SIGHTING', 'landmark', 'Veridora · The Moors', 49.841, 68.984, ''),
  ('WOLF CAVE', 'dungeon', 'Veridora · The Moors', 47.095, 55.515, 'Lyo''mir''s Den'),
  ('YÜYAK''E', 'city', 'Veridora · The Moors', 43.811, 55.182, 'Mystical Kitsune Village 
I''nari''s Sacellum'),
  ('ZEPHYRIA', 'city', 'Aerithos', 62.476, 38.293, 'Univiersity of Magic');

-- 1. Old pins with the same name: move them and take the new name, region and note.
update public.locations l
set name = p.name, region = p.region, x_pct = p.x_pct, y_pct = p.y_pct,
    notes = coalesce(nullif(p.notes, ''), l.notes)
from poi p
where l.campaign_id is null and lower(regexp_replace(replace(l.name, '’', ''''), '[^A-Za-z]', '', 'g')) = lower(regexp_replace(replace(p.name, '’', ''''), '[^A-Za-z]', '', 'g'));

-- 2. Pins the app does not have yet.
insert into public.locations (name, type, region, x_pct, y_pct, notes)
select p.name, p.type, p.region, p.x_pct, p.y_pct, nullif(p.notes, '')
from poi p
where not exists (
  select 1 from public.locations l
  where l.campaign_id is null and lower(regexp_replace(replace(l.name, '’', ''''), '[^A-Za-z]', '', 'g')) = lower(regexp_replace(replace(p.name, '’', ''''), '[^A-Za-z]', '', 'g'))
);

-- 3. Old shared pins that are not on the Inkarnate map, unless a party is standing on one.
delete from public.locations l
where l.campaign_id is null
  and not exists (select 1 from poi p where lower(regexp_replace(replace(p.name, '’', ''''), '[^A-Za-z]', '', 'g')) = lower(regexp_replace(replace(l.name, '’', ''''), '[^A-Za-z]', '', 'g')))
  and not exists (select 1 from public.party_position pp where pp.location_id = l.id);

commit;

-- Check afterwards (read-only): expect 119 shared pins, plus any old pin a party is standing on.
-- select count(*) filter (where campaign_id is null) as shared_pins, count(*) as all_pins from public.locations;
