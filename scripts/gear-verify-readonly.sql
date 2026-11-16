-- READ-ONLY. After 20261116_outfit_campaign_characters.sql: lists every empty
-- equipment slot for characters in an existing campaign. No rows = fully outfitted.
-- (Vexa Hellhammer points at a campaign that no longer exists, so the inner
-- join leaves her out.)
with slots(slot) as (values
  ('Head'),('Torso'),('Waist'),('Hands'),('Greaves'),('Boots'),
  ('Main Hand'),('Off-Hand'),('Side-Weapon'),('Heavy'),
  ('Ring I'),('Ring II'),('Neck'),('Charm'),('Relic'),('Artifact')
)
select camp.subtitle as campaign, c.data->>'name' as character, s.slot as empty_slot
from characters c
join campaigns camp on camp.id::text = c.campaign_id::text
cross join slots s
where not exists (
  select 1 from character_items ci
  where ci.character_id = c.id::text and ci.slot = s.slot and coalesce(ci.name, '') <> ''
)
order by 1, 2, 3;

-- Companion check: the 26 new catalog items, each present exactly once.
-- select name, count(*) from items where name in (
--   'Cutpurse''s Many-Pocket Belt','Soldier''s Buckled War Belt','Oath-Chain Cincture',
--   'Reagent Bandolier Sash','Tinker''s Tool Belt','Braided Vine Girdle','Wraill-Knot Sash',
--   'Riveted Null Girdle','Chronolithe Coupling Belt','Supple Leather Legwraps',
--   'Wayfarer''s Quilted Leggings','Articulated Brass Shinplates','Thornproof Herbalist Gloves',
--   'Field Technician''s Gauge Case','Gunsmith''s Proofing Kit','Grimrite Spark Cell',
--   'Tel''ari Song-Leaf Token','Pa''morph Bloodline Fetish','Nazari Tidepearl',
--   'Drakazir Lineage Scale','Othrod Clan Tusk-Charm','Durinak Hearthstone Shard',
--   'Djinn Ember Vessel','Addamar Waystone','Trink Patent Seal','Chronison Maker''s Plate'
-- ) group by name order by name;
