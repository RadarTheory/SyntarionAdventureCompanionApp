// The constellation's source lives in constellation/ inside this app. This copies its runtime files into
// public/constellation/ (git-ignored), where the Abilities tab loads it in an iframe (src/ConstellationTab.jsx).
// vite.config.js runs it on every dev start, on every build, and whenever a constellation file changes, so there
// is no manual step. Docs, tests, the standalone dev server and preview images stay behind.
// `npm run sync:constellation` still runs it by hand.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONSTELLATION_DIR = join(root, 'constellation');
const target = join(root, 'public', 'constellation');

const RUNTIME = new Set(['.html', '.js', '.css', '.png', '.svg', '.webp']);
const SKIP = new Set(['test.mjs', 'server.mjs']);

export function syncConstellation() {
  if (!existsSync(join(CONSTELLATION_DIR, 'index.html'))) {
    throw new Error(`No constellation found at ${CONSTELLATION_DIR}.`);
  }
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  let files = 0;
  for (const name of readdirSync(CONSTELLATION_DIR)) {
    const from = join(CONSTELLATION_DIR, name);
    if (statSync(from).isDirectory()) {
      if (name === 'assets') { cpSync(from, join(target, name), { recursive: true }); files++; }
      continue;
    }
    if (SKIP.has(name) || !RUNTIME.has(extname(name).toLowerCase())) continue;
    cpSync(from, join(target, name));
    files++;
  }
  return files;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Constellation synced: ${syncConstellation()} entries from ${CONSTELLATION_DIR} to public/constellation/`);
}
