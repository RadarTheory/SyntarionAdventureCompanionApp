import supabase from './supabase';

// character_items carries its own copy of equip_slot, snapshotted when the item
// was granted. Some grant paths never had one to hand — Bazaar trades and
// lootbox claims both dropped it — so gear landed in a pack with no slot. Pack
// category is parsed out of a "Category|desc" description prefix, and when that
// prefix is missing too the category resolves to 'Misc', which matches no slot
// in SLOT_CATEGORIES. The item then fits nowhere and cannot be equipped at all.
//
// These helpers resolve a slot from the catalog by name so a grant can always
// write one, and so packs loaded from older rows heal themselves on read
// instead of waiting for a migration.

const cache = new Map();

// One name. Returns the fallback untouched when the caller already has a slot.
export async function resolveEquipSlot(name, fallback = null) {
  if (fallback) return fallback;
  if (!name) return null;
  const key = String(name);
  if (cache.has(key)) return cache.get(key);
  const { data } = await supabase
    .from('items')
    .select('equip_slot')
    .eq('name', key)
    .not('equip_slot', 'is', null)
    .limit(1)
    .maybeSingle();
  const slot = data?.equip_slot || null;
  cache.set(key, slot);
  return slot;
}

// Many names in one round trip, for a pack that may hold a dozen unslotted
// rows. Returns a plain { name: slot } map and only queries what it has to.
export async function resolveEquipSlots(names) {
  const wanted = [...new Set((names || []).filter(Boolean).map(String))];
  const out = {};
  const missing = [];
  for (const n of wanted) {
    if (cache.has(n)) { if (cache.get(n)) out[n] = cache.get(n); }
    else missing.push(n);
  }
  if (!missing.length) return out;
  const { data } = await supabase
    .from('items')
    .select('name, equip_slot')
    .in('name', missing)
    .not('equip_slot', 'is', null);
  for (const row of data || []) {
    cache.set(row.name, row.equip_slot);
    out[row.name] = row.equip_slot;
  }
  // Remember the misses too, so a pack full of genuinely slotless junk does not
  // re-query the catalog on every load.
  for (const n of missing) if (!cache.has(n)) cache.set(n, null);
  return out;
}
