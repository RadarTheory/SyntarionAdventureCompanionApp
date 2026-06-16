const fs = require('fs');
const path = require('path');

const FILES = [
  'src/data/items/armor.js',
  'src/data/items/artifacts.js',
  'src/data/items/blackmarket.js',
  'src/data/items/collectables.js',
  'src/data/items/companion.js',
  'src/data/items/consumables.js',
  'src/data/items/currency.js',
  'src/data/items/documents.js',
  'src/data/items/gear.js',
  'src/data/items/magicItems.js',
  'src/data/items/packs.js',
  'src/data/items/schematicmaterial.js',
  'src/data/items/spellcastingitems.js',
  'src/data/items/techinventions.js',
  'src/data/items/tradegoods.js',
  'src/data/items/weapons.js',
  'src/data/items/wonderousitems.js',
];

function parseRarity(meta) {
  if (!meta) return null;
  const m = meta.match(/rarity:\s*([^;,\n]+)/i);
  if (!m) return null;
  let r = m[1].trim().toLowerCase();
  if (r === 'artifact' || r === 'dm-defined') return 'Artifact';
  if (r === 'primeval mythic') return 'Primeval Mythic';
  const map = {
    'mundane':'Mundane','common':'Common','uncommon':'Uncommon',
    'rare':'Rare','very rare':'Very Rare','epic':'Epic',
    'legendary':'Legendary','very-rare':'Very Rare',
  };
  return map[r] || (r.charAt(0).toUpperCase() + r.slice(1));
}

function parseValue(meta) {
  if (!meta) return null;
  const m = meta.match(/value:\s*([\d,]+)/i);
  if (!m) return null;
  const v = parseInt(m[1].replace(/,/g, ''), 10);
  return isNaN(v) ? null : v;
}

function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function arrLiteral(arr) {
  if (!arr || !arr.length) return "'{}'";
  const escaped = arr.map(t => '"' + String(t).replace(/"/g, '\\"') + '"');
  return "'{" + escaped.join(',') + "}'";
}

function parseItemsFromSource(src) {
  try {
    let code = src.replace(/export\s+const\s+\w+\s*=\s*/g, 'module.exports = ');
    const fn = new Function('module', 'exports', code);
    const mod = { exports: {} };
    fn(mod, mod.exports);
    const val = mod.exports;
    if (Array.isArray(val)) return val;
    const items = [];
    if (typeof val === 'object' && val !== null) {
      for (const k of Object.keys(val)) {
        if (Array.isArray(val[k])) items.push(...val[k]);
      }
    }
    return items;
  } catch (e) {
    console.error('Parse error:', e.message);
    return [];
  }
}

function main() {
  const projectRoot = process.cwd();
  const seen = new Set();
  const rows = [];

  for (const relPath of FILES) {
    const fullPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`-- WARNING: Not found: ${fullPath}`);
      continue;
    }
    const src = fs.readFileSync(fullPath, 'utf8');
    const items = parseItemsFromSource(src);
    if (!items.length) {
      console.error(`-- WARNING: No items from ${relPath}`);
      continue;
    }
    for (const item of items) {
      if (!item || !item.name) continue;
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      rows.push({
        name: item.name,
        category: item.category || 'Uncategorized',
        type: item.type || '',
        desc: item.desc || item.description || '',
        tags: Array.isArray(item.tags) ? item.tags : [],
        meta: item.meta || '',
        rarity: parseRarity(item.meta),
        value: parseValue(item.meta),
      });
    }
  }

  const lines = [
    '-- Syntarion Items Seed',
    `-- ${rows.length} items`,
    '',
    `CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  meta text,
  rarity text,
  value integer,
  is_equippable boolean DEFAULT false,
  equip_slot text,
  is_consumable boolean DEFAULT false,
  is_usable boolean DEFAULT false,
  effect jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);`,
    '',
    'ALTER TABLE items ENABLE ROW LEVEL SECURITY;',
    'DROP POLICY IF EXISTS "allow_all_items" ON items;',
    "CREATE POLICY \"allow_all_items\" ON items FOR ALL USING (true) WITH CHECK (true);",
    '',
    'INSERT INTO items (category, type, name, description, tags, meta, rarity, value) VALUES',
  ];

  rows.forEach((r, i) => {
    const comma = i < rows.length - 1 ? ',' : ';';
    lines.push(`  (${esc(r.category)}, ${esc(r.type)}, ${esc(r.name)}, ${esc(r.desc)}, ${arrLiteral(r.tags)}, ${esc(r.meta)}, ${esc(r.rarity)}, ${r.value === null ? 'NULL' : r.value})${comma}`);
  });

  lines.push('');
  lines.push(`-- Done: ${rows.length} items`);
  lines.push('-- Run these separately to update character_items:');
  lines.push('-- ALTER TABLE character_items ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES items(id);');
  lines.push('-- ALTER TABLE character_items ADD COLUMN IF NOT EXISTS equipped boolean DEFAULT false;');
  lines.push('-- ALTER TABLE character_items ADD COLUMN IF NOT EXISTS charges int;');
  lines.push("-- ALTER TABLE character_items ADD COLUMN IF NOT EXISTS condition text DEFAULT 'intact';");
  lines.push('-- ALTER TABLE character_items ADD COLUMN IF NOT EXISTS notes text;');

  fs.writeFileSync('src/items-seed.sql', lines.join('\n'));
  console.log(`Done. ${rows.length} items written to src/items-seed.sql`);
}

main();