-- Outfit every campaign character: fill each EMPTY equipment slot.
-- Generated 2026-11-16. Review list: scripts/gear-outfit-plan.md
--
-- Safe to run twice:
--   * new catalog items are inserted only when no item with that name exists;
--   * pack items move to a slot only if they are still in the pack and the slot is empty;
--   * gear rows are inserted only into slots that are still empty.
-- Nothing already equipped is replaced. ap_bonus stays 0, so the held-item AP
-- trigger grants nobody AP. Rejected character Vexa Hellhammer is left alone.

begin;

-- ── 1. New catalog items (26) ─────────────────────────────────────────
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Cutpurse''s Many-Pocket Belt', 'Armor', 'Belt', 'waist', 'A supple belt of hidden pouches and a false buckle. Lockpicks, coin and a spare blade ride where a searching hand won''t find them.', 'Common', 15, array['belt','rogue','stealth']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Cutpurse''s Many-Pocket Belt');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Soldier''s Buckled War Belt', 'Armor', 'Belt', 'waist', 'Thick bridle leather with a brass buckle, frog loops for a sheath and a ration pouch. Every campaign ends up issuing it twice.', 'Common', 12, array['belt','fighter','martial']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Soldier''s Buckled War Belt');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Oath-Chain Cincture', 'Armor', 'Belt', 'waist', 'A cord of blessed iron links worn by Sanctus inquisitors. Each link is pressed with a vow the wearer has kept.', 'Uncommon', 60, array['belt','inquisitor','divine']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Oath-Chain Cincture');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Reagent Bandolier Sash', 'Armor', 'Belt', 'waist', 'A cloth sash sewn with stoppered loops for chalk, inks and reagents, so a caster''s components are always a hand''s reach away.', 'Common', 18, array['belt','caster','components']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Reagent Bandolier Sash');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Tinker''s Tool Belt', 'Armor', 'Belt', 'waist', 'Canvas and leather lined with drivers, callipers, wire and a folding hammer. Smells permanently of lamp oil.', 'Common', 20, array['belt','artificer','tools','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Tinker''s Tool Belt');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Braided Vine Girdle', 'Armor', 'Belt', 'waist', 'Living green vine braided around a hemp core. It slowly mends its own fraying while the wearer sleeps on open ground.', 'Common', 15, array['belt','druid','nature']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Braided Vine Girdle');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Wraill-Knot Sash', 'Armor', 'Belt', 'waist', 'Dark silk tied in the old shrine knots used to keep restless spirits from following the wearer home.', 'Common', 16, array['belt','oneir','wraill','spirits']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Wraill-Knot Sash');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Riveted Null Girdle', 'Armor', 'Belt', 'waist', 'A broad riveted girdle lined with nullstone flakes that dull stray resonance around the wearer''s core. Favoured by anti-magic vanguards.', 'Uncommon', 55, array['belt','vanguard','anti-magic']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Riveted Null Girdle');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Chronolithe Coupling Belt', 'Armor', 'Belt', 'waist', 'A segmented brass coupling ring bolted at the waist joint, carrying spare fasteners, a winding key and an oil reservoir. Built for constructs.', 'Common', 25, array['belt','chronison','construct','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Chronolithe Coupling Belt');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Supple Leather Legwraps', 'Armor', 'Boots/Greaves', 'greaves', 'Oiled leather wrapped from ankle to knee. Quiet, flexible, and enough to turn a briar or a dog''s bite.', 'Common', 10, array['greaves','light','stealth']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Supple Leather Legwraps');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Wayfarer''s Quilted Leggings', 'Armor', 'Boots/Greaves', 'greaves', 'Quilted wool leggings with padded knees, made for long roads, cold floors and longer vigils.', 'Common', 8, array['greaves','light','caster']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Wayfarer''s Quilted Leggings');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Articulated Brass Shinplates', 'Armor', 'Boots/Greaves', 'greaves', 'Riveted brass shinplates on a spring hinge, made to bolt onto a constructed frame or strap over ordinary boots.', 'Uncommon', 45, array['greaves','tech','construct']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Articulated Brass Shinplates');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Thornproof Herbalist Gloves', 'Armor', 'Gloves/Gauntlets', 'hands', 'Waxed doeskin gloves with reinforced fingertips for gathering nettle, briar and things that bite back.', 'Common', 8, array['gloves','druid','nature']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Thornproof Herbalist Gloves');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Field Technician''s Gauge Case', 'Accessories', 'Tool', null, 'A palm-sized brass case of pressure gauges, a continuity tester and spare fuses. Every machine reflects the values of whoever commissioned it; this tells you what it is actually doing.', 'Common', 30, array['relic','artificer','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Field Technician''s Gauge Case');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Gunsmith''s Proofing Kit', 'Accessories', 'Tool', null, 'Bore gauges, a proofing mark punch and a roll of cleaning rods. An apprentice''s first set, kept long after the apprenticeship ended.', 'Common', 30, array['relic','gunsmith','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Gunsmith''s Proofing Kit');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Grimrite Spark Cell', 'Accessories', 'Tool', null, 'A sealed glass cell holding a sliver of Grimrite deposit. For a Chronison it is the one thing that briefly bridges material and resonant.', 'Uncommon', 80, array['relic','chronison','grimrite']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Grimrite Spark Cell');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Tel''ari Song-Leaf Token', 'Artifacts', 'Heirloom', null, 'A pressed leaf sealed in clear resin, inscribed with a verse in a language older than the current era. Tel''ari carry them to remember a grove they may never see again.', 'Uncommon', 40, array['heirloom','telari']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Tel''ari Song-Leaf Token');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Pa''morph Bloodline Fetish', 'Artifacts', 'Heirloom', null, 'Fur, feather or scale from the wearer''s own bloodline bound with knotted cord. Among Pa''morph it says who your kin are before you open your mouth.', 'Uncommon', 35, array['heirloom','pamorph']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Pa''morph Bloodline Fetish');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Nazari Tidepearl', 'Artifacts', 'Heirloom', null, 'A pearl raised from the deep trench-beds. Held to the ear it carries the pressure-hum of home water.', 'Uncommon', 45, array['heirloom','nazari']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Nazari Tidepearl');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Drakazir Lineage Scale', 'Artifacts', 'Heirloom', null, 'A shed scale from an ancestor of the wearer''s lineage, lacquered and etched with their name. Warm to the touch in a way it should not be.', 'Uncommon', 45, array['heirloom','drakazir']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Drakazir Lineage Scale');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Othrod Clan Tusk-Charm', 'Artifacts', 'Heirloom', null, 'A carved tusk-tip marked with the clan sigil. Shown to another Othrod it is a claim of hospitality, or a challenge.', 'Uncommon', 35, array['heirloom','othrod']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Othrod Clan Tusk-Charm');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Durinak Hearthstone Shard', 'Artifacts', 'Heirloom', null, 'A chip of the hearthstone from the wearer''s home hall, carried so no Durinak is ever truly far from the forge.', 'Uncommon', 40, array['heirloom','durinak']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Durinak Hearthstone Shard');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Djinn Ember Vessel', 'Artifacts', 'Heirloom', null, 'A stoppered brass vial holding a mote of the wearer''s own convergence. It flickers with their mood.', 'Uncommon', 50, array['heirloom','djinn']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Djinn Ember Vessel');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Addamar Waystone', 'Artifacts', 'Heirloom', null, 'A smooth stone marked with the road-sign of the wearer''s home people, passed hand to hand by Addamar travellers for luck.', 'Uncommon', 30, array['heirloom','addamar']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Addamar Waystone');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Trink Patent Seal', 'Artifacts', 'Heirloom', null, 'A brass seal stamped with the wearer''s family patent number. Trink present it the way others present a coat of arms.', 'Uncommon', 35, array['heirloom','trink','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Trink Patent Seal');
insert into public.items (name, category, type, equip_slot, description, rarity, value, tags, effect, ap_bonus, is_equippable, is_consumable, is_usable)
select 'Chronison Maker''s Plate', 'Artifacts', 'Heirloom', null, 'The original maker''s plate removed during the wearer''s first repair: serial, foundry mark and date of activation.', 'Uncommon', 40, array['heirloom','chronison','tech']::text[], '{"bonuses":{},"apBonus":0}'::jsonb, 0, true, false, false
where not exists (select 1 from public.items where name = 'Chronison Maker''s Plate');

-- ── 2. Equip items the characters already carry in their packs ─────────────
update public.character_items set slot = 'Main Hand', equipped = true, attuned = true
where id = 'fdcfe380-9989-4e30-87d3-1a6537087361' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'abeb05ca-2735-4ae0-84ef-516b61356110' and x.slot = 'Main Hand');  -- Klarrec (Ylandari Inductee)
update public.character_items set slot = 'Off-Hand', equipped = true, attuned = true
where id = '6655a081-1ae6-45c6-b634-b9970041bae3' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'abeb05ca-2735-4ae0-84ef-516b61356110' and x.slot = 'Off-Hand');  -- Klarrec (Ylandari Inductee)
update public.character_items set slot = 'Side-Weapon', equipped = true, attuned = true
where id = 'f5ce0c6a-75eb-428f-9696-9cd7e5228c77' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'abeb05ca-2735-4ae0-84ef-516b61356110' and x.slot = 'Side-Weapon');  -- Klarrec (Ylandari Inductee)
update public.character_items set slot = 'Relic', equipped = true, attuned = true
where id = '2c21e183-57d9-4bcb-a00d-7ac9b738bee6' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'abeb05ca-2735-4ae0-84ef-516b61356110' and x.slot = 'Relic');  -- Klarrec (Ylandari Inductee)
update public.character_items set slot = 'Off-Hand', equipped = true, attuned = true
where id = '5c504610-a402-4dcb-a877-6a7cf5ebce61' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'e05b54ff-ea1b-47f6-aa79-05b75a9f4a95' and x.slot = 'Off-Hand');  -- Xin'09 Cipher-77
update public.character_items set slot = 'Torso', equipped = true, attuned = true
where id = 'e52e69d7-851f-4945-b436-abe0988e59ca' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'f0de664d-94d4-4252-a2c2-31caee2bb0cc' and x.slot = 'Torso');  -- Duane T. Ra'k
update public.character_items set slot = 'Greaves', equipped = true, attuned = true
where id = 'c1ab7222-60af-4a8e-9d42-ba8daa8840dd' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'f0de664d-94d4-4252-a2c2-31caee2bb0cc' and x.slot = 'Greaves');  -- Duane T. Ra'k
update public.character_items set slot = 'Boots', equipped = true, attuned = true
where id = 'c47b16dd-3bb0-4136-9e79-187a0106abd5' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = 'f0de664d-94d4-4252-a2c2-31caee2bb0cc' and x.slot = 'Boots');  -- Duane T. Ra'k
update public.character_items set slot = 'Torso', equipped = true, attuned = true
where id = '7d386207-66d2-41bc-bcdf-791768147085' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '43c695eb-a49c-4f56-991e-0bbbd2709255' and x.slot = 'Torso');  -- Lexity Eyther
update public.character_items set slot = 'Boots', equipped = true, attuned = true
where id = '17bfc63e-1569-4ecd-8ce9-11f90170dcaa' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '43c695eb-a49c-4f56-991e-0bbbd2709255' and x.slot = 'Boots');  -- Lexity Eyther
update public.character_items set slot = 'Relic', equipped = true, attuned = true
where id = '914ce1f1-ba18-4951-8625-e99bacbd86d9' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '43c695eb-a49c-4f56-991e-0bbbd2709255' and x.slot = 'Relic');  -- Lexity Eyther
update public.character_items set slot = 'Artifact', equipped = true, attuned = true
where id = '3262c6aa-7591-46aa-a4ac-df4e981df5e6' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '43c695eb-a49c-4f56-991e-0bbbd2709255' and x.slot = 'Artifact');  -- Lexity Eyther
update public.character_items set slot = 'Relic', equipped = true, attuned = true
where id = 'e716321c-aec2-4983-8042-79f5d64f3dce' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '0028ff97-98c7-4d2f-9d02-0663fe9baee6' and x.slot = 'Relic');  -- Griz Lupin
update public.character_items set slot = 'Torso', equipped = true, attuned = true
where id = 'beab0484-ffe9-4d8d-aa2f-6cc425753750' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '3046c291-473e-4b47-8e18-af6ac8eff27b' and x.slot = 'Torso');  -- Morghana Proudmoore
update public.character_items set slot = 'Torso', equipped = true, attuned = true
where id = 'c9211e72-bc8c-4cf8-a90e-a0c6cd6d1c15' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '2d6f3262-f6b2-4920-8883-5abc16ba8db8' and x.slot = 'Torso');  -- Zendrix "Ironsong" Grenram
update public.character_items set slot = 'Main Hand', equipped = true, attuned = true
where id = '3a1eee12-868c-4137-ae1e-cd630df4741a' and slot like 'pack\_\_%'
  and not exists (select 1 from public.character_items x where x.character_id = '78525a05-fa8e-41cb-b40a-bfc972fb060a' and x.slot = 'Main Hand');  -- Etowan Sillmeer

-- ── 3. Fill the remaining empty slots from the catalog ─────────────────────
-- One row per (character, slot, item name). A few catalog names are duplicated
-- (e.g. Lament Coin exists as Common, Epic and Very Rare), so the lookup prefers
-- a copy with an equip_slot, then the lowest rarity, then the oldest.
with plan(character_id, slot, item_name) as (values
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Head', 'Cowl of the Dark Whisper'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Torso', 'Studded Leather Jerkin'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Hands', 'Gloves of Gentle Theft'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Greaves', 'Supple Leather Legwraps'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Boots', 'Soft Leather Moccasins'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Main Hand', 'Rapier'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Off-Hand', 'Dagger'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Side-Weapon', 'Harpoon of Salty Splash'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Heavy', 'Light Crossbow'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Ring I', 'Ring of Concealment'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Ring II', 'Signal Ring of the Veinrunner'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Neck', 'Medallion of Silence'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Charm', 'Bone Dice of the Cheat'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Relic', 'Deck of Marked Cards'),
  ('7da65a07-ec41-4ae1-99ff-8223730cbf06', 'Artifact', 'Nazari Tidepearl'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Head', 'Helm of Light'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Torso', 'Chain Shirt'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Waist', 'Oath-Chain Cincture'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Hands', 'Casting Glove'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Boots', 'Tel''ari Boots'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Heavy', 'Light Crossbow'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Ring I', 'Band of Iron Will'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Ring II', 'Ring of the Librarian'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Neck', 'Salt-Circle Pendant'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Charm', 'Foxfire Bead'),
  ('abeb05ca-2735-4ae0-84ef-516b61356110', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Head', 'Hood of the Hedge Wizard'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Torso', 'Tunic of the Forest Ranger'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Waist', 'Braided Vine Girdle'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Hands', 'Thornproof Herbalist Gloves'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Boots', 'Soft Leather Moccasins'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Main Hand', 'Staff of Bitter Roots'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Off-Hand', 'Briar-Patch Buckler'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Side-Weapon', 'River Knife'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Heavy', 'Bramble-Wood Bow'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Ring I', 'Ring of the Green Thumb'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Ring II', 'Wooden Ring'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Neck', 'Kolette''s Tel''ari Necklace'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Charm', 'Charm of the Unbitten'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Relic', 'Thornwood Wand'),
  ('ce94e64d-0d6e-4ef9-901c-f25aef302b29', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Head', 'Coif'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Torso', 'Boiled Leather Jack'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Waist', 'Wraill-Knot Sash'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Hands', 'Bracers of Steel'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Greaves', 'Supple Leather Legwraps'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Boots', 'Worn Boots'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Main Hand', 'Saber'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Off-Hand', 'Blood-Tithe Dagger'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Side-Weapon', 'Throwing Dagger'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Heavy', 'Old Flintlock Pistol'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Ring I', 'Band of Iron Will'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Ring II', 'Silver Ring'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Neck', 'Salt-Circle Pendant'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Charm', 'Lament Coin'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Relic', 'Hollowbone Shard'),
  ('e41793a5-aba3-4fc9-8c33-9dac31cc7e6d', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('6435c508-1c1a-4ff7-8bb5-786a096947d2', 'Heavy', 'Boar Spear'),
  ('6435c508-1c1a-4ff7-8bb5-786a096947d2', 'Charm', 'Lucky Rabbit''s Foot'),
  ('6435c508-1c1a-4ff7-8bb5-786a096947d2', 'Relic', 'Mark of Melee'),
  ('6435c508-1c1a-4ff7-8bb5-786a096947d2', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Head', 'Helm of the Charging Bull'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Torso', 'Scale Shirt'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Waist', 'Soldier''s Buckled War Belt'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Hands', 'Stone-Fist Gauntlets'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Greaves', 'Soldier''s Chain Leggings'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Boots', 'Metal Boots'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Main Hand', 'Longsword'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Off-Hand', 'Heater Shield'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Side-Weapon', 'Hand Axe'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Heavy', 'Halberd'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Ring I', 'Ring of Virility'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Ring II', 'Percussion Ring'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Neck', 'Necklace of Wolf Fangs'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Charm', 'Weighted Bone Dice'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Relic', 'Militia Badge'),
  ('9fe41d0f-bb62-4f52-9e4c-1f245082e011', 'Artifact', 'Drakazir Lineage Scale'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Head', 'Pointy Felt Hat of Wisdom'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Torso', 'Robes of the Arcane Scholar'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Waist', 'Reagent Bandolier Sash'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Hands', 'Gloves of the Alchemist'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Boots', 'Slippers of the Scholar'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Main Hand', 'Runewrought Staff'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Off-Hand', 'Wand of Knots'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Side-Weapon', 'Dagger'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Heavy', 'Gnomish Pistol'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Ring I', 'Ring of the Scholar'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Ring II', 'Circuit Signet of the Artificer'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Neck', 'Pendant of Lost Tears'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Charm', 'Element Charm'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Relic', 'Travel Grimoire'),
  ('3de3f961-5d0b-498d-a4a6-ec0170abe15f', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Head', 'Goggled Helmet'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Waist', 'Chronolithe Coupling Belt'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Boots', 'Metal Boots'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Side-Weapon', 'Mechanical Dagger'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Heavy', 'Ironwood Carbine'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Ring I', 'Calibration Ring'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Ring II', 'Flux Monitor Ring'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Neck', 'Medallion'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Charm', 'Lodestone Compass'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Relic', 'Grimrite Spark Cell'),
  ('e05b54ff-ea1b-47f6-aa79-05b75a9f4a95', 'Artifact', 'Chronison Maker''s Plate'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Head', 'Greathelm of the Vigilant'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Waist', 'Oath-Chain Cincture'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Hands', 'Gauntlets of Ogre Strength'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Greaves', 'Soldier''s Chain Leggings'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Boots', 'Enchanted War Boots'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Off-Hand', 'Kite Shield of the Crusader'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Side-Weapon', 'Flanged Mace'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Ring I', 'Band of Iron Will'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Ring II', 'Ring of the Honest Merchant'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Neck', 'Amulet of Last Light'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Charm', 'Foxfire Bead'),
  ('ba10279d-103a-470d-8125-16d1ece73f3c', 'Relic', 'Blessed Ember Icon'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Head', 'Fleet Helm'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Waist', 'Soldier''s Buckled War Belt'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Hands', 'Bracers of Steel'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Off-Hand', 'Buckler'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Side-Weapon', 'Throwing Knife'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Heavy', 'Flintlock Pistol'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Ring I', 'Band of the Tinkerer''s Oath'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Ring II', 'Copper Ring'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Neck', 'Locket of the Lost Lover'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Charm', 'Charm of Second Guessing'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Relic', 'Lockbox Key'),
  ('f0de664d-94d4-4252-a2c2-31caee2bb0cc', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Head', 'Cowl of the Dark Whisper'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Hands', 'Gloves of the Pickpocket'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Greaves', 'Supple Leather Legwraps'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Heavy', 'Whisperwind Shortbow'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Ring I', 'Ring of Silence'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Ring II', 'Ring of the Patient Lock'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Neck', 'Medallion of Silence'),
  ('43c695eb-a49c-4f56-991e-0bbbd2709255', 'Charm', 'Gambler''s Loaded Dice'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Head', 'Hood of the Hedge Wizard'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Torso', 'Pilgrim’s Road Cloak'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Waist', 'Wraill-Knot Sash'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Hands', 'Casting Glove'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Main Hand', 'Staff of the Road Shrine'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Off-Hand', 'Wand of Binding Thread'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Side-Weapon', 'Bone Dagger'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Heavy', 'Light Crossbow'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Ring II', 'Band of Iron Will'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Neck', 'Salt-Circle Pendant'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Charm', 'Foxfire Bead'),
  ('0f87b982-f83a-499f-a8f0-3c74684c8676', 'Relic', 'Ritual Chalk Set'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Head', 'Horned Viking Helm'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Torso', 'Stitched Beast-Hide Vest'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Waist', 'Belt of the Mule'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Hands', 'Stone-Fist Gauntlets'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Greaves', 'Greaves'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Boots', 'Fine Stout Boots'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Main Hand', 'Greataxe'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Off-Hand', 'Berserker''s Bloody Hatchet'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Side-Weapon', 'Hand Axe'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Heavy', 'Spear'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Ring I', 'Ring of Virility'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Ring II', 'Copper Ring'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Neck', 'Necklace of Wolf Fangs'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Charm', 'Lucky Rabbit''s Foot'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Relic', 'Tattoo of Menace'),
  ('03659350-0e51-47e0-a57e-f0199077ccec', 'Artifact', 'Othrod Clan Tusk-Charm'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Head', 'Cowl of the Dark Whisper'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Torso', 'Smuggler''s Hidden-Pocket Vest'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Hands', 'Gloves of Gentle Theft'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Greaves', 'Supple Leather Legwraps'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Boots', 'Boots of the Alley Cat'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Main Hand', 'Rapier'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Off-Hand', 'Spellbound Dagger'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Side-Weapon', 'Throwing Dagger'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Heavy', 'Pocket Derringer'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Ring I', 'Ring of the Cat''s Paw'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Ring II', 'Ring of the Forgetful Sage'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Neck', 'Ruby-Studded Pirate Earring'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Charm', 'Counterfeit Gold Coin'),
  ('0028ff97-98c7-4d2f-9d02-0663fe9baee6', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Head', 'Top Hat'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Waist', 'Reagent Bandolier Sash'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Hands', 'Casting Glove'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Greaves', 'Supple Leather Legwraps'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Boots', 'Soft-Step Velvet Slippers'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Off-Hand', 'Rapier of the Rose Thorn'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Side-Weapon', 'Dagger'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Heavy', 'Light Crossbow'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Ring I', 'Negotiator''s Ring'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Ring II', 'Fated Ring'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Neck', 'Jewel of Hebe'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Charm', 'Gambler''s Loaded Dice'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Relic', 'Silver Bell Focus'),
  ('ee84906a-3427-43cd-9083-b498aa9ddc15', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Head', 'Spelunker''s Lamp-Hat'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Waist', 'Tinker''s Tool Belt'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Hands', 'Gauntlets of Gripping'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Greaves', 'Soldier''s Chain Leggings'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Boots', 'Fine Stout Boots'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Main Hand', 'Granite-Tooth Pickaxe'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Off-Hand', 'Lantern Shield'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Side-Weapon', 'Hand Axe'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Heavy', 'Lever Repeater'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Ring I', 'Ring of the Coal Miner'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Ring II', 'Pressure Band'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Neck', 'Tarnished Silver Locket'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Charm', 'Lodestone Compass'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Relic', 'Star Brass Astrolabe'),
  ('3046c291-473e-4b47-8e18-af6ac8eff27b', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Head', 'Helmet'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Torso', 'Chain Shirt'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Waist', 'Soldier''s Buckled War Belt'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Hands', 'Bracers of Steel'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Greaves', 'Soldier''s Chain Leggings'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Boots', 'Worn Boots'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Main Hand', 'Iron Defender''s Broadsword'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Off-Hand', 'Round Shield'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Side-Weapon', 'Hand Axe'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Heavy', 'Spear'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Ring I', 'Ring of the Green Thumb'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Ring II', 'Copper Ring'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Neck', 'Medallion'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Charm', 'Lucky Rabbit''s Foot'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Relic', 'Militia Badge'),
  ('00086b12-2d85-49c7-bc2e-4508bbd196f2', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Head', 'Great Helm'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Waist', 'Tinker''s Tool Belt'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Hands', 'Gauntlets of Ogre Strength'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Greaves', 'Ironbound Sentinel Greaves'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Boots', 'Metal Boots'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Off-Hand', 'Old Round Shield'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Side-Weapon', 'Hand Axe'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Heavy', 'Lever Repeater'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Ring I', 'Band of the Tinkerer''s Oath'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Ring II', 'Percussion Ring'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Neck', 'Medallion'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Charm', 'Weighted Bone Dice'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Relic', 'Gunsmith''s Proofing Kit'),
  ('2d6f3262-f6b2-4920-8883-5abc16ba8db8', 'Artifact', 'Durinak Hearthstone Shard'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Head', 'Fleet Helm'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Torso', 'Scout''s Boiled Leather Vest'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Hands', 'Bracers of Steel'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Greaves', 'Supple Leather Legwraps'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Boots', 'Tel''ari Boots'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Main Hand', 'Tel''ari Blade'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Off-Hand', 'Dagger'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Side-Weapon', 'Throwing Knife'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Heavy', 'Longbow'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Ring I', 'Ring of Quiet Footfalls'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Ring II', 'Silver Ring'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Neck', 'Medallion'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Charm', 'Foxfire Bead'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Relic', 'Militia Badge'),
  ('405c74a5-6f63-4994-89e6-e00094cebed2', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Head', 'Cowl of the Dark Whisper'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Hands', 'Gloves of Gentle Theft'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Greaves', 'Supple Leather Legwraps'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Off-Hand', 'Cursebent Dagger'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Heavy', 'Shortbow'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Ring I', 'Ring of Concealment'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Ring II', 'Silver Ring'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Neck', 'Tarnished Silver Locket'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Relic', 'Deck of Marked Cards'),
  ('3e2ced5d-bdfe-4c0e-8532-05cf02c8111c', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Head', 'Cowl of the Dark Whisper'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Torso', 'Studded Leather Jerkin'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Hands', 'Gloves of the Pickpocket'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Greaves', 'Supple Leather Legwraps'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Boots', 'Boots of the Alley Cat'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Main Hand', 'Short Sword'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Off-Hand', 'Dagger'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Side-Weapon', 'Throwing Knife'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Heavy', 'Pocket Revolver'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Ring I', 'Ring of the Sewer Rat'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Ring II', 'Ring of the Patient Lock'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Neck', 'Ruby-Studded Pirate Earring'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Charm', 'Counterfeit Gold Coin'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Relic', 'Coin Purse'),
  ('c0d11cac-02be-424a-9a94-715fe545c310', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Head', 'Hood of the Desert Nomad'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Torso', 'Reinforced Duelist Coat'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Waist', 'Reagent Bandolier Sash'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Hands', 'Casting Glove'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Boots', 'Sandals of the Desert Monk'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Main Hand', 'Scimitar'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Off-Hand', 'Wand of Hearth Sparks'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Side-Weapon', 'Dagger'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Heavy', 'Light Crossbow'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Ring I', 'Fated Ring'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Ring II', 'Negotiator''s Ring'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Neck', 'Lucky Medallion'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Charm', 'Gambler''s Loaded Dice'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Relic', 'Whisper‑Reed Flute'),
  ('df1a335f-d37d-47d3-ba88-de13250d20b0', 'Artifact', 'Djinn Ember Vessel'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Head', 'Trapmaker Spectacles'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Torso', 'Reinforced Duelist Coat'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Waist', 'Cutpurse''s Many-Pocket Belt'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Hands', 'Gloves of Gentle Theft'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Greaves', 'Supple Leather Legwraps'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Boots', 'Fine Stout Boots'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Main Hand', 'Rapier'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Off-Hand', 'Dagger'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Side-Weapon', 'Throwing Knife'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Heavy', 'Officer Revolver'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Ring I', 'Ring of the Librarian'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Ring II', 'Ring of the Honest Merchant'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Neck', 'Medallion of Silence'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Charm', 'Lodestone Compass'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Relic', 'Iron-Clasp Codex'),
  ('d17db417-59bf-4e76-bfd8-ab7f81beb934', 'Artifact', 'Pa''morph Bloodline Fetish'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Head', 'Helmet of Vision'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Torso', 'Gatewarden Plate'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Waist', 'Chronolithe Coupling Belt'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Hands', 'Gauntlets (Catalog)'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Greaves', 'Articulated Brass Shinplates'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Boots', 'Metal Boots'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Main Hand', 'Mechanized Sword'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Off-Hand', 'Tempered Shield'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Side-Weapon', 'Mechanical Dagger'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Heavy', 'Mechanized Gun'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Ring I', 'Dampener Band'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Ring II', 'Thermal Guard Ring'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Neck', 'Medallion'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Charm', 'Lodestone Compass'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Relic', 'Grimrite Spark Cell'),
  ('8a81c1bd-480e-4aee-bb76-12ced49efb6d', 'Artifact', 'Chronison Maker''s Plate'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Head', 'Helmet'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Torso', 'Chain Mail'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Waist', 'Oath-Chain Cincture'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Hands', 'Bracers of Steel'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Greaves', 'Soldier''s Chain Leggings'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Boots', 'Fine Stout Boots'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Main Hand', 'Longsword'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Off-Hand', 'Kite Shield'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Side-Weapon', 'Mace'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Heavy', 'Spear'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Ring I', 'Band of Iron Will'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Ring II', 'Silver Ring'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Neck', 'Amulet of Last Light'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Charm', 'Foxfire Bead'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Relic', 'Sunburst Reliquary'),
  ('7f50141a-df7c-437e-bcac-9ac015bdbfbf', 'Artifact', 'Addamar Waystone'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Head', 'Eye Gear'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Torso', 'Alchemist Fireproof Apron'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Waist', 'Tinker''s Tool Belt'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Hands', 'Gloves of the Alchemist'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Greaves', 'Supple Leather Legwraps'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Boots', 'Fine Stout Boots'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Heavy', 'Tesla Gun'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Ring I', 'Band of the Repairman'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Ring II', 'Schematic Reader''s Loop'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Neck', 'Medallion'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Charm', 'Messenger Stone'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Relic', 'Field Technician''s Gauge Case'),
  ('112738f2-8341-481d-a74c-840c31559c78', 'Artifact', 'Trink Patent Seal'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Head', 'Fine Helmet'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Torso', 'Breastplate and Buff Coat'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Waist', 'Riveted Null Girdle'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Hands', 'Bracers of Steel'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Greaves', 'Soldier''s Chain Leggings'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Boots', 'Metal Boots'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Side-Weapon', 'Throwing Knife'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Heavy', 'Single-Shot Long Rifle'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Ring I', 'Percussion Ring'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Ring II', 'Dampener Band'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Neck', 'Medallion'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Charm', 'Messenger Stone'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Relic', 'Gunsmith''s Proofing Kit'),
  ('b659fa5b-98d8-4567-b7b2-67b0a9384f0c', 'Artifact', 'Addamar Waystone'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Head', 'Elddim Cavalry Mask'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Torso', 'Reinforced Duelist Coat'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Waist', 'Oath-Chain Cincture'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Hands', 'Casting Glove'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Boots', 'Fine Stout Boots'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Off-Hand', 'Buckler of the Rose'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Side-Weapon', 'Noble''s Silvered Rapier'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Heavy', 'Saintmarked Bow'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Ring I', 'Decent Gold Ring'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Ring II', 'Ring of the Honest Merchant'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Neck', 'Pendant of Lost Tears'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Charm', 'Foxfire Bead'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Relic', 'Sanctified Watermark'),
  ('78525a05-fa8e-41cb-b40a-bfc972fb060a', 'Artifact', 'Tel''ari Song-Leaf Token'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Head', 'Hood of the Hedge Wizard'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Torso', 'Quilted Gambeson'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Waist', 'Wraill-Knot Sash'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Hands', 'Casting Glove'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Greaves', 'Wayfarer''s Quilted Leggings'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Boots', 'Sandals of the Ascetic'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Side-Weapon', 'Bone Dagger'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Heavy', 'Light Crossbow'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Ring I', 'Wooden Ring'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Ring II', 'Band of Iron Will'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Neck', 'Salt-Circle Pendant'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Charm', 'Charm of the Unbitten'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Relic', 'Censer of Slow Smoke'),
  ('45e3a298-d877-46c3-b50c-0de5cf22e04d', 'Artifact', 'Tel''ari Song-Leaf Token')
)
insert into public.character_items (character_id, slot, name, description, attuned, bonuses, weight, item_id, equipped, equip_slot, ap_bonus)
select p.character_id, p.slot, i.name,
       i.category || '|' || coalesce(i.description, ''),
       true,
       case when jsonb_typeof(i.effect->'bonuses') = 'object'
            then (i.effect->'bonuses') - 'apBonus' else '{}'::jsonb end,
       1, i.id, true, i.equip_slot, 0
from plan p
cross join lateral (
  select * from public.items it
  where it.name = p.item_name
  order by (it.equip_slot is null),
           case coalesce(it.rarity, 'Mundane')
             when 'Mundane' then 0 when 'Common' then 1 when 'Uncommon' then 2 when 'Rare' then 3
             else 9 end,
           it.created_at
  limit 1
) i
where not exists (
  select 1 from public.character_items x
  where x.character_id = p.character_id and x.slot = p.slot
);

commit;
