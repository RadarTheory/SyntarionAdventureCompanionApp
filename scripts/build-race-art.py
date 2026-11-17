"""Build public/RaceArt from the creator's Races folder (F:/Theonhex/SYNTARION/Races): one image per race / variant /
gender, as light WebP files, plus src/wizard/raceArt.js listing them. Run from the app folder:  python scripts/build-race-art.py

How files are recognised (user, 2026-11-17):
  - Humanoid art sits in a folder whose name ends with the race ("6 - Small - Fynlor", "20 - Medium - Maugar") and is
    named "Race - Variant - Male|Female - …" (or "Race - Male|Female - …" for a race without variants). The variant is
    the chart's name (Hrald, Kho, Nereid, Marid…); a few older names still count (Hill = Brughaire, Wood = Reveahn…).
  - Pa'morph art can sit anywhere; it is matched by the bloodline's name in the file name ("Pa'morph - Lioreth - Female").
  - With no Male/Female in the name, one image serves both."""
import os, re, json, sys, subprocess, unicodedata
from PIL import Image

SRC = r'F:/Theonhex/SYNTARION/Races'
APP = r'F:/Theonhex/App Dev/1 syntarion-app'
OUT = APP + '/public/RaceArt'
os.makedirs(OUT, exist_ok=True)

# The chart, read from the app itself so new races and variants are known without editing this script.
CHART = json.loads(subprocess.check_output(['node', '-e', "import('./src/constants.js').then(c=>console.log(JSON.stringify({races:c.RACES.map(r=>({id:r.id,name:r.name,variants:r.variants||[],pm:!!r.isPamorph})),pm:c.PM_ALL})))"], cwd=APP, text=True))
plain = lambda s: re.sub(r'[^a-z]', '', unicodedata.normalize('NFD', str(s).replace('ł', 'l').replace('Ќ', 'K')).lower())
FOLDER_RACE = {
    'Addamar': 'addamar', 'Durinak': 'durinak', 'Telari': 'telari', 'Othrod': 'othrod', 'Terraxian': 'terraxian',
    'Fynlor': 'fynlor', 'Trink': 'trink', 'Fae': 'fae', 'Djinn': 'djinn', 'Helianth': 'helianth', 'Seraphan': 'seraphan',
    'Drakazir': 'drakazir', 'Nazari': 'nazari', 'Chronison': 'chronison', 'Tiol': 'tiol', 'Folwoade': 'folwoade',
    'Goblin': 'goblin',
}
for r in CHART['races']:
    if not r['pm']:
        FOLDER_RACE.setdefault(r['name'], r['id'])
# The art's variant words → the chart's variant names.
VARIANT = {
    'addamar': {'Ankhir': 'Ahnkir', 'Brunar': 'Brunar', 'Eryatav': 'Eryatav', "Jiro'Ki": "Jiro'Ќi", 'Matekwan': 'Matekwan',
                'Pontunean': 'Pontunean', 'Rajava': 'Rajava', 'Sunoacan': 'Sunoàca', 'Tachechana': 'Tachechana',
                'Veridoran': 'Veridoran'},
    'durinak': {'Hill': 'Brughaire', 'Mountain': 'Oinnar'},
    'telari': {'Wood': 'Reveahn', 'Dark': 'Morvyn', 'Eladrin': 'Eladrin'},
    'othrod': {"Kul'kal Rakhar": "Kul'kal Rakhar", 'Jotunnar': 'Jotunnar', 'Grothmogg': 'Grothmogg', 'Telrok': 'Telrok'},
    'fynlor': {'Lightfoot': 'Fhynn'},
    'djinn': {'Efreet': 'Efreet'},
}
# Every chart variant also matches its own name.
for r in CHART['races']:
    for v in r['variants']:
        VARIANT.setdefault(r['id'], {})[v] = v
VARIANT_PLAIN = {rid: {plain(k): v for k, v in m.items()} for rid, m in VARIANT.items()}
PAMORPH = {  # file stem (lower, letters only) -> bloodline id
    'aavarok': 'aaravok', 'kraark': 'kraark', 'cerakhjorn': 'cerakhjorn', 'avali': 'avali', 'dervir': 'dervir',
    'hoshiari': 'hoshiari', 'anpryd': 'anpryd', 'hadrynn': 'hadrynn', 'hraelvan': 'hraelvan', 'jevrak': 'jevrak',
    'limridh': 'limridh', 'pterrotara': 'pterrotara', 'saurok': 'saurok',
}
for b in CHART['pm']:
    PAMORPH.setdefault(plain(b['name']), b['id'])
    PAMORPH.setdefault(plain(b['id']), b['id'])
PAMORPH_ORDER = sorted(PAMORPH, key=len, reverse=True)   # longest first, so Krokodon is never read as Kodan
IMG = re.compile(r'\.(png|jpe?g|jfif|webp)$', re.I)
letters = lambda s: re.sub(r'[^a-z]', '', s.lower())

picked = {}   # key -> (score, path)
def offer(key, path):
    name = os.path.basename(path).lower()
    score = 0 if 'scantily' not in name else 5          # the plainer image first
    score += 0 if re.search(r'\b(gallant|aristocrat)\b', name) else 1
    if key not in picked or score < picked[key][0]:
        picked[key] = (score, path)

for root, _, files in os.walk(SRC):
    for f in files:
        if not IMG.search(f):
            continue
        path = os.path.join(root, f)
        stem = IMG.sub('', f)
        gender = 'f' if re.search(r'\bfemale\b', stem, re.I) else 'm' if re.search(r'\bmale\b', stem, re.I) else None
        folder = os.path.basename(root)
        race = next((rid for word, rid in FOLDER_RACE.items() if plain(folder).endswith(plain(word))), None)
        if race:
            parts = [p.strip() for p in stem.split(' - ')]
            variant = None
            if race in VARIANT and len(parts) > 1:
                variant = VARIANT_PLAIN[race].get(plain(parts[1]))
                if variant is None and parts[1].lower() not in ('male', 'female') and not parts[1].lower().startswith(('male', 'female')):
                    continue                                   # a variant the chart doesn't have (Vald, Stout, Ascend, Spirit…)
            for g in ([gender] if gender else ['m', 'f']):
                offer(f'{race}|{variant or ""}|{g}', path)
            continue
        # Pa'morph bloodlines: in the Pa'morph folders or loose in the top folder.
        bl = None
        for word in PAMORPH_ORDER:
            bid = PAMORPH[word]
            if word in plain(stem):
                bl = bid; break
        if bl:
            for g in ([gender] if gender else ['m', 'f']):
                offer(f'pamorph|{bl}|{g}', path)

import shutil
shutil.rmtree(OUT); os.makedirs(OUT)
manifest = {}
made = {}   # one file per source image, shared by both genders when the art has none
for key, (_, path) in sorted(picked.items()):
    race, variant, g = key.split('|')
    if path in made:
        manifest[key] = made[path]; continue
    fname = f"{race}-{letters(variant) or 'all'}-{g}.webp"
    im = Image.open(path).convert('RGB')
    im.thumbnail((1100, 1100), Image.LANCZOS)
    im.save(os.path.join(OUT, fname), 'WEBP', quality=72, method=6)
    made[path] = f'/RaceArt/{fname}'
    manifest[key] = f'/RaceArt/{fname}'
    print(key, '<-', os.path.relpath(path, SRC))

total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(len(manifest), 'images,', round(total / 1e6, 1), 'MB')
with open(APP + '/src/wizard/raceArt.js', 'w', encoding='utf-8') as fh:
    fh.write("// Race art for the wizard's dive (user, 2026-11-17), from the creator's Races folder: one image per race / variant /\n")
    fh.write("// gender ('m' | 'f'), as light WebP files in public/RaceArt. Generated; keys are race|variant|gender, where variant is a\n")
    fh.write("// chart variant name or a Pa'morph bloodline id, and empty for the race as a whole.\n")
    fh.write('export const RACE_ART = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n\n')
    fh.write('''/** The best image for this choice: the variant in this gender, then the other gender, then the race as a whole. */
export function raceArtFor(race, variant, gender) {
  if (!race) return null;
  const g = gender === 'm' ? ['m', 'f'] : ['f', 'm'];
  for (const v of [variant || '', '']) for (const x of g) {
    const src = RACE_ART[`${race}|${v}|${x}`];
    if (src) return src;
  }
  // A humanoid variant without its own art shows another of its people; a Pa'morph bloodline never borrows another animal.
  if (race !== 'pamorph') {
    for (const x of g) {
      const key = Object.keys(RACE_ART).find(k => k.startsWith(`${race}|`) && k.endsWith(`|${x}`));
      if (key) return RACE_ART[key];
    }
  }
  return null;
}
''')
