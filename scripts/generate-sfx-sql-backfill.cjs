const fs = require('fs');

// Emits an idempotent INSERT statement backfilling public.sfx_library from
// public/sfx-manifest.json. Re-run any time the manifest changes and paste
// the output into the Supabase SQL editor to sync.
const manifest = JSON.parse(fs.readFileSync('public/sfx-manifest.json', 'utf8'));

const escape = (value) => String(value).replace(/'/g, "''");

const rows = manifest.tracks.map(track => (
  `  ('${escape(track.key)}', '${escape(track.title)}', '${escape(track.category)}', '${escape(track.filename)}', '${escape(track.path)}')`
));

const sql = `insert into public.sfx_library (key, title, category, filename, path)
values
${rows.join(',\n')}
on conflict (key) do update set
  title = excluded.title,
  category = excluded.category,
  filename = excluded.filename,
  path = excluded.path;
`;

fs.writeFileSync('scripts/sfx-library-backfill.sql', sql);
console.log(`Wrote scripts/sfx-library-backfill.sql with ${rows.length} rows.`);
