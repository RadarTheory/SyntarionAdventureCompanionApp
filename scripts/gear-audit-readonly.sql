-- READ-ONLY. Dumps what the gear outfitting plan needs: every campaign
-- character (with the sheet fields that matter for gear), what they have in
-- each slot and pack, and the equippable item catalog. Changes nothing.
select jsonb_build_object(
  'characters', (
    select jsonb_agg(jsonb_build_object(
      'id', c.id,
      'campaign', camp.name,
      'status', c.status,
      'name', c.data->>'name',
      'race', c.data->'race',
      'subrace', c.data->'subrace',
      'class', coalesce(c.data->'class', c.data->'charClass', c.data->'calling'),
      'subclass', c.data->'subclass',
      'level', c.data->'level',
      'backstory', left(coalesce(c.data->>'backstory', c.data->>'background', ''), 600),
      'data_keys', (select jsonb_agg(k) from jsonb_object_keys(c.data) k),
      'gear', (
        select jsonb_agg(jsonb_build_object('slot', ci.slot, 'name', ci.name, 'equip_slot', ci.equip_slot) order by ci.slot)
        from character_items ci where ci.character_id::text = c.id::text
      )
    ) order by camp.name, c.data->>'name')
    from characters c
    left join campaigns camp on camp.id::text = c.campaign_id::text
    where c.campaign_id is not null
  ),
  'catalog', (
    select jsonb_agg(jsonb_build_object(
      'name', i.name, 'category', i.category, 'type', i.type, 'slot', i.equip_slot,
      'rarity', i.rarity, 'desc', left(i.description, 160)
    ) order by i.equip_slot, i.name)
    from items i
    where i.equip_slot is not null
       or i.category in ('Weapons','Armor','Magic Items','Artifacts','Spellcasting Items','Accessories','Collectables')
  ),
  'items_columns', (
    select jsonb_agg(column_name order by ordinal_position)
    from information_schema.columns where table_schema = 'public' and table_name = 'items'
  ),
  'character_items_columns', (
    select jsonb_agg(column_name || ':' || data_type order by ordinal_position)
    from information_schema.columns where table_schema = 'public' and table_name = 'character_items'
  )
) as dump;
