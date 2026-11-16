const MAX_BUNDLE_BYTES = 64 * 1024 * 1024;
const hex = /^#[0-9a-f]{6}$/i;
const embeddedImage = /^data:image\/png;base64,[a-z0-9+/]+={0,2}$/i;
const embeddedModel = /^data:model\/gltf-binary;base64,[a-z0-9+/]+={0,2}$/i;

export function parseFinishBundle(bundle) {
  if (bundle?.version !== 1 || !bundle.finishes || typeof bundle.finishes !== 'object' || Array.isArray(bundle.finishes)) {
    throw new Error('Choose an Astragal finishes export.');
  }
  return Object.fromEntries(Object.entries(bundle.finishes).map(([id, finish]) => {
    if (!/^custom-[0-9a-f-]{36}$/i.test(id) || typeof finish?.name !== 'string' || !finish.name.trim() || finish.name.length > 40) {
      throw new Error('The export contains an invalid finish.');
    }
    for (const field of ['body', 'edge', 'ink', 'tint', 'numeralColor']) {
      if (finish[field] != null && !hex.test(finish[field])) throw new Error(`${finish.name} has an invalid color.`);
    }
    for (const field of ['pattern', 'logo']) {
      if (finish[field] != null && (typeof finish[field] !== 'string' || finish[field].length > 3 * 1024 * 1024 || !embeddedImage.test(finish[field]))) {
        throw new Error(`${finish.name} has invalid image artwork.`);
      }
    }
    if (finish.designType === 'interior' && (typeof finish.interiorModel !== 'string' || finish.interiorModel.length > 7 * 1024 * 1024 || !embeddedModel.test(finish.interiorModel))) {
      throw new Error(`${finish.name} needs an embedded GLB model.`);
    }
    if (finish.designType != null && !['surface', 'interior'].includes(finish.designType)) throw new Error('Unsupported finish type.');
    return [id, finish];
  }));
}

export async function readFinishFile(file) {
  if (file.size > MAX_BUNDLE_BYTES) throw new Error('The finishes export exceeds 64 MB.');
  return parseFinishBundle(JSON.parse(await file.text()));
}

let officialRequest;
export function loadOfficialFinishes() {
  officialRequest ??= fetch('/astragal/official-finishes.json')
    .then(response => {
      if (!response.ok) throw new Error('Could not load official dice.');
      return response.json();
    })
    .then(parseFinishBundle)
    .catch(error => {
      officialRequest = null;
      throw error;
    });
  return officialRequest;
}
