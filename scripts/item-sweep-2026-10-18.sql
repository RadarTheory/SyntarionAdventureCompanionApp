-- Syntarion item sweep, 2026-10-18. Every statement only touches rows that are
-- still in the broken state, so running this twice is harmless.

-- ── 1. Equipped gear with no slot saved ──────────────────────────────────────
-- Fine while worn. Unequipped, these dropped into the pack as 'Misc' and could
-- never be equipped again (14 of them had no "Category|" label either).
update character_items set equip_slot = 'torso', description = 'Armor|' || coalesce(description, '') where id = '6b833f19-7e8d-4c01-99dd-d2cb4ad6b7a2' and equip_slot is null;  -- Sinawar Asiini (Xalora: Reedweave Vest (Torso)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = '2ad75d7b-83aa-4dc0-8074-47748b2478ad' and equip_slot is null;  -- Sinawar Asiini (Xalora: Hand Axe (Main Hand)
update character_items set equip_slot = 'ranged', description = 'Weapons|' || coalesce(description, '') where id = '840adc1f-8e1a-4607-a230-2c96f14afb00' and equip_slot is null;  -- Declan Wellby: Declan's Coglock Three-shooter (Main Hand)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = '70319050-5ca3-4fb8-ad99-5b431085adcf' and equip_slot is null;  -- Declan Wellby: Declan's Trusty Melee-Wrench (Off-Hand)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = '26b17d23-92c4-4819-803c-744238e0a37a' and equip_slot is null;  -- Declan Wellby: Throwing Screwdrivers (Side-Weapon)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = '3450fca1-8dcb-4e81-a210-82259e133339' and equip_slot is null;  -- Zephraim Enoch: Zephraim's Bastard Sword of Wraill (Main Hand)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = 'b4df965e-80b6-4df3-b1c0-078f90ac32ba' and equip_slot is null;  -- Zephraim Enoch: Zephraim's Crooked Wooden Wand (Off-Hand)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = 'dcfd26c7-f530-4908-8ddc-a31293a14637' and equip_slot is null;  -- Dharisa Colm: Dharisa's Claymore (Main Hand)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = '39d0ab89-2d20-4967-a796-c8310c696ff1' and equip_slot is null;  -- Dharisa Colm: Sentinaut Wrist-Blast (Off-Hand)
update character_items set equip_slot = 'waist', description = 'Armor|' || coalesce(description, '') where id = 'a781d88d-224a-4bd0-aece-585fc9011370' and equip_slot is null;  -- Sinawar Asiini (Xalora: Studded Leather (Waist)
update character_items set equip_slot = 'hands', description = 'Armor|' || coalesce(description, '') where id = '588d09fb-8ec1-449d-891a-e78fd8379c57' and equip_slot is null;  -- Sinawar Asiini (Xalora: Gloves of the Pickpocket (Hands)
update character_items set equip_slot = 'blade', description = 'Weapons|' || coalesce(description, '') where id = 'f9b12854-25fe-4a4e-8d89-a3ad3e0606fe' and equip_slot is null;  -- Sinawar Asiini (Xalora: Crescent Kopesh (Off-Hand)
update character_items set equip_slot = 'head', description = 'Armor|' || coalesce(description, '') where id = 'f7bb545d-2126-43c1-ac75-1ba5da6308f2' and equip_slot is null;  -- Sinawar Asiini (Xalora: Mask of the Harlequin (Head)
update character_items set equip_slot = 'boots', description = 'Armor|' || coalesce(description, '') where id = '8201faab-590e-4f6c-a19f-1aad9d02283a' and equip_slot is null;  -- Sinawar Asiini (Xalora: Boots of the Cloud-Stepper (Boots)
update character_items set equip_slot = 'torso' where id = '21d59bcb-f89e-434c-9129-140a0e2d044a' and equip_slot is null;  -- Eryn Vaelithar: Traveling clothes (Torso)
update character_items set equip_slot = 'boots' where id = 'c7748af5-94f8-4ebd-9358-87a1f7df7f5c' and equip_slot is null;  -- Eryn Vaelithar: Travel boots (Boots)
update character_items set equip_slot = 'blade' where id = '4e02ac90-fac9-4ac1-bd2a-48927d5da95c' and equip_slot is null;  -- Eryn Vaelithar: Reliable weapon (Main Hand)
update character_items set equip_slot = 'sidearm' where id = 'a9b490fd-7f64-4c27-b1d2-9ebeaa829998' and equip_slot is null;  -- Eryn Vaelithar: Sidearm (Side-Weapon)
update character_items set equip_slot = 'charm' where id = '3b59e1c3-016d-4fb8-b9bf-e794b9be68e2' and equip_slot is null;  -- Eryn Vaelithar: Adventurer kit (Charm)
update character_items set equip_slot = 'blade' where id = '5fe42584-9b7b-4a38-84b7-276194dd6822' and equip_slot is null;  -- Haruki Ardentbrin: Ring of Mýr (Main Hand)
update character_items set equip_slot = 'torso' where id = '4740b87a-29db-4e2d-aa6c-27a2870d3b6f' and equip_slot is null;  -- Haruki Ardentbrin: Haruki's Leather Armor (Torso)
update character_items set equip_slot = 'blade' where id = '0dad7de9-7f13-4eef-b992-6432020c70e4' and equip_slot is null;  -- Zendrix Grenram: Ironsong (Dwarven Warhammer) (Main Hand)
update character_items set equip_slot = 'staff' where id = '83a2bdc1-f552-4f0e-add1-8d75df37b370' and equip_slot is null;  -- Xin'09 Cipher-77: Speared Terrain Staff (Main Hand)
update character_items set equip_slot = 'boots' where id = '86352919-6086-44a7-bc55-91bfffe9c855' and equip_slot is null;  -- Rystik Zeldethi: Boots of Wraillwalk (Boots)
update character_items set equip_slot = 'blade' where id = 'f8bfdf43-e02d-4095-8092-66985109d77b' and equip_slot is null;  -- Kenzo Umbacca: Kenzo's Aurm (Main Hand)
update character_items set equip_slot = 'ring' where id = 'f5980ee4-1104-4760-9b21-3ebbfad60d40' and equip_slot is null;  -- Rystik Zeldethi: Wraillswitch (Ring I)
update character_items set equip_slot = 'torso' where id = 'c5ea2088-6ea8-493a-9334-429effacf3ce' and equip_slot is null;  -- Kenzo Umbacca: Auric Order Armor (Torso)
update character_items set equip_slot = 'torso' where id = 'e44d2f37-b41e-4089-b06c-3aaaad5ed346' and equip_slot is null;  -- Xin'09 Cipher-77: Chronolithe Plate Armor (Torso)
update character_items set equip_slot = 'blade' where id = 'c07e9e4f-f37a-4e46-ac1e-d97049365a69' and equip_slot is null;  -- Lexity Eyther: Nameah's Chains (Main Hand)
update character_items set equip_slot = 'sidearm' where id = '0e4a9ae7-ad7d-413d-80f4-5b5ebed4bcdb' and equip_slot is null;  -- Lexity Eyther: Boomerang (Off-Hand)
update character_items set equip_slot = 'sidearm' where id = 'cd10dc63-7ffe-463c-9fdf-252af8da43e1' and equip_slot is null;  -- Lexity Eyther: Cath'vari Dagger (Side-Weapon)

-- ── 2. Catalog duplicates where one copy has no slot ─────────────────────────
update items set equip_slot = 'sidearm' where name = 'Boomerang'    and equip_slot is null;
update items set equip_slot = 'blade'   where name = 'Kenzo''s Aurm' and equip_slot is null;

-- ── 3. Greaves still labelled 'boots' (Xin'09, Sinawar) ──────────────────────
update character_items set equip_slot = 'greaves'
where name = 'Ironbound Sentinel Greaves' and equip_slot = 'boots';

-- ── 4. Outfit The Keys of Aerithos from their own packs (empty slots only) ───
-- Duane / Darius Ra'k: House Ra'k hide armour, greaves, boots.
update character_items set slot = 'Torso',   equipped = true, attuned = true where id = 'e52e69d7-851f-4945-b436-abe0988e59ca' and slot like 'pack\_\_%';
update character_items set slot = 'Greaves', equipped = true, attuned = true where id = 'c1ab7222-60af-4a8e-9d42-ba8daa8840dd' and slot like 'pack\_\_%';
update character_items set slot = 'Boots',   equipped = true, attuned = true where id = 'c47b16dd-3bb0-4136-9e79-187a0106abd5' and slot like 'pack\_\_%';
-- Lexity Eyther: leather armour, Tel'ari boots.
update character_items set slot = 'Torso',   equipped = true, attuned = true where id = '7d386207-66d2-41bc-bcdf-791768147085' and slot like 'pack\_\_%';
update character_items set slot = 'Boots',   equipped = true, attuned = true where id = '17bfc63e-1569-4ecd-8ce9-11f90170dcaa' and slot like 'pack\_\_%';
-- Xin'09 Cipher-77: one Ancient Chronolithe Shield in the Off-Hand.
update character_items set slot = 'Off-Hand', equipped = true, attuned = true where id = '5c504610-a402-4dcb-a877-6a7cf5ebce61' and slot like 'pack\_\_%';

-- ── 5. OPTIONAL: carry the eggs and the spider fang as worn artifacts ────────
-- update character_items set slot = 'Relic',    equipped = true, attuned = true where id = '914ce1f1-ba18-4951-8625-e99bacbd86d9' and slot like 'pack\_\_%'; -- Lexity, egg
-- update character_items set slot = 'Artifact', equipped = true, attuned = true where id = '3262c6aa-7591-46aa-a4ac-df4e981df5e6' and slot like 'pack\_\_%'; -- Lexity, egg
-- update character_items set slot = 'Relic',    equipped = true, attuned = true where id = '5d9e4090-79fd-451e-92f7-9c2cd57bfc7b' and slot like 'pack\_\_%'; -- Kenzo, egg
-- update character_items set slot = 'Charm',    equipped = true, attuned = true where id = '0b7bfc3f-0a61-43fe-bafa-d656b19f435d' and slot like 'pack\_\_%'; -- Kenzo, spider fang
