import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

// A die definition owns its geometry and face values. Skins never change physics.
export const DICE_SKINS = {
  bone: { name: 'Old Bone', body: '#e8dcc0', ink: '#302316', edge: '#a38c58', metalness: 0.12, roughness: 0.48 },
  obsidian: { name: 'Obsidian', body: '#202b29', ink: '#f5d895', edge: '#b79852', metalness: 0.45, roughness: 0.28 },
  copper: { name: 'Veinrunner Copper', body: '#934d2c', ink: '#fff0c7', edge: '#d4ad66', metalness: 0.7, roughness: 0.34 },
  jade: { name: 'Jade', body: '#408260', ink: '#fff5d7', edge: '#a9cfaa', metalness: 0.12, roughness: 0.32 },
  emerald: { name: 'Emerald', body: '#006349', ink: '#fff2cf', edge: '#52c694', metalness: 0.22, roughness: 0.25 },
  peridot: { name: 'Peridot', body: '#abc54c', ink: '#202b10', edge: '#e0ed9b', metalness: 0.1, roughness: 0.31 },
  ruby: { name: 'Ruby', body: '#a11d42', ink: '#fff2d9', edge: '#f2889a', metalness: 0.24, roughness: 0.24 },
  garnet: { name: 'Garnet', body: '#542139', ink: '#ffe8c2', edge: '#b97485', metalness: 0.2, roughness: 0.3 },
  'rose-quartz': { name: 'Rose Quartz', body: '#ef9dc3', ink: '#4c1736', edge: '#ffe1f1', metalness: 0.08, roughness: 0.31 },
  rhodonite: { name: 'Rhodonite', body: '#c94483', ink: '#fff5e4', edge: '#ffc2d7', metalness: 0.16, roughness: 0.34 },
  sapphire: { name: 'Sapphire', body: '#22459c', ink: '#f8f3ff', edge: '#85affd', metalness: 0.25, roughness: 0.24 },
  lapis: { name: 'Lapis Lazuli', body: '#293672', ink: '#ffe6a0', edge: '#c9a758', metalness: 0.12, roughness: 0.43 },
  aquamarine: { name: 'Aquamarine', body: '#85cdd6', ink: '#11333f', edge: '#d1f5f5', metalness: 0.1, roughness: 0.27 },
  turquoise: { name: 'Turquoise', body: '#2caaad', ink: '#103235', edge: '#96dbcf', metalness: 0.08, roughness: 0.43 },
  amethyst: { name: 'Amethyst', body: '#71469d', ink: '#fff3df', edge: '#c7a0ee', metalness: 0.18, roughness: 0.28 },
  fluorite: { name: 'Fluorite', body: '#ae9add', ink: '#30204a', edge: '#e3d7fa', metalness: 0.1, roughness: 0.31 },
  amber: { name: 'Amber', body: '#ce7931', ink: '#30170b', edge: '#f7bd71', metalness: 0.08, roughness: 0.34 },
  citrine: { name: 'Citrine', body: '#edbf55', ink: '#402912', edge: '#fff1ab', metalness: 0.12, roughness: 0.28 },
  carnelian: { name: 'Carnelian', body: '#ba4d2d', ink: '#fff3df', edge: '#f8a079', metalness: 0.12, roughness: 0.35 },
  moonstone: { name: 'Moonstone', body: '#cdd7e4', ink: '#263043', edge: '#f3f4ff', metalness: 0.14, roughness: 0.31 },
  onyx: { name: 'Onyx', body: '#25242d', ink: '#f7edf8', edge: '#878393', metalness: 0.19, roughness: 0.26 },
  hematite: { name: 'Hematite', body: '#5c5d69', ink: '#fff6ec', edge: '#b6b5c5', metalness: 0.48, roughness: 0.33 },
};

export function randomUnit() {
  if (!globalThis.crypto?.getRandomValues) throw new Error('Secure randomness is unavailable in this browser.');
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 0x100000000;
}

export function randomBetween(min, max) { return min + randomUnit() * (max - min); }

// Uniform orientation on SO(3), rather than three biased random Euler angles.
export function randomQuaternion() {
  const a = randomUnit(), b = randomUnit() * Math.PI * 2, c = randomUnit() * Math.PI * 2;
  return new THREE.Quaternion(Math.sqrt(1 - a) * Math.sin(b), Math.sqrt(1 - a) * Math.cos(b), Math.sqrt(a) * Math.sin(c), Math.sqrt(a) * Math.cos(c));
}

function decahedron() {
  const height = 1.15, cosine = Math.cos(Math.PI / 5);
  const ringHeight = height * (1 - cosine) / (1 + cosine);
  const points = [new THREE.Vector3(0, height, 0), new THREE.Vector3(0, -height, 0)];
  for (let i = 0; i < 10; i++) {
    const angle = i * Math.PI / 5;
    points.push(new THREE.Vector3(Math.cos(angle), i % 2 ? -ringHeight : ringHeight, Math.sin(angle)));
  }
  return new ConvexGeometry(points);
}

function hundredFaceGeometry() {
  // The polar dual of a hull with 100 evenly spaced, antipodal points has
  // 100 flat faces at the same distance from the center.
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < 50; index++) {
    const y = (index + 0.5) / 50;
    const radius = Math.sqrt(1 - y * y);
    const angle = index * goldenAngle;
    const point = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    points.push(point, point.clone().negate());
  }
  const hull = new ConvexGeometry(points);
  const positions = hull.getAttribute('position');
  const corners = [];
  for (let index = 0; index < positions.count; index += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(positions, index);
    const b = new THREE.Vector3().fromBufferAttribute(positions, index + 1);
    const c = new THREE.Vector3().fromBufferAttribute(positions, index + 2);
    const normal = b.sub(a).cross(c.sub(a)).normalize();
    corners.push(normal.multiplyScalar(1 / normal.dot(a)));
  }
  hull.dispose();
  return new ConvexGeometry(corners);
}

export function createDieDefinition(sides, percentile = false) {
  const factory = { 4: () => new THREE.TetrahedronGeometry(1), 6: () => new THREE.BoxGeometry(1.25, 1.25, 1.25), 8: () => new THREE.OctahedronGeometry(1), 10: decahedron, 12: () => new THREE.DodecahedronGeometry(1), 20: () => new THREE.IcosahedronGeometry(1), 100: hundredFaceGeometry }[sides];
  if (!factory) throw new Error(`Unsupported die: d${sides}`);
  const original = factory(), source = original.index ? original.toNonIndexed() : original;
  const positions = source.getAttribute('position'), vertices = [], faces = [], vertexMap = new Map();
  const vertexIndex = p => {
    const key = p.toArray().map(x => x.toFixed(5)).join(',');
    if (!vertexMap.has(key)) { vertexMap.set(key, vertices.length); vertices.push(p); }
    return vertexMap.get(key);
  };
  for (let i = 0; i < positions.count; i += 3) {
    const triangle = [0, 1, 2].map(j => new THREE.Vector3().fromBufferAttribute(positions, i + j));
    const normal = triangle[1].clone().sub(triangle[0]).cross(triangle[2].clone().sub(triangle[0])).normalize();
    let face = faces.find(f => f.normal.dot(normal) > 0.99999);
    if (!face) { face = { normal, indices: new Set() }; faces.push(face); }
    triangle.forEach(p => face.indices.add(vertexIndex(p)));
  }
  faces.forEach(face => {
    const indices = [...face.indices];
    face.center = indices.reduce((v, index) => v.add(vertices[index]), new THREE.Vector3()).divideScalar(indices.length);
    const u = vertices[indices[0]].clone().sub(face.center).normalize(), v = face.normal.clone().cross(u);
    indices.sort((a, b) => {
      const pa = vertices[a].clone().sub(face.center), pb = vertices[b].clone().sub(face.center);
      return Math.atan2(pa.dot(v), pa.dot(u)) - Math.atan2(pb.dot(v), pb.dot(u));
    });
    face.indices = indices;
  });
  // Opposite faces sum to sides + 1 on the centrally symmetric dice.
  let nextValue = 1;
  for (const face of faces) {
    if (face.value != null) continue;
    face.value = nextValue;
    const opposite = faces.find(f => f !== face && f.value == null && f.normal.dot(face.normal) < -0.9999);
    if (opposite) opposite.value = sides + 1 - nextValue;
    nextValue++;
  }
  if (source !== original) source.dispose();
  original.dispose();
  if (faces.length !== sides) throw new Error(`Invalid d${sides} geometry: ${faces.length} faces.`);
  return { sides, percentile, vertices, faces, readDirection: sides === 4 ? -1 : 1 };
}

export function readSettledFace(definition, quaternion) {
  const q = new THREE.Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  const localUp = new THREE.Vector3(0, definition.readDirection, 0).applyQuaternion(q.conjugate());
  let result = null, top = -Infinity, second = -Infinity;
  for (const face of definition.faces) {
    const alignment = face.normal.dot(localUp);
    if (alignment > top) {
      second = top;
      top = alignment;
      result = face.value;
    } else if (alignment > second) second = alignment;
  }
  // A cocked or edge-balanced die must never silently become a valid roll.
  const dense = definition.sides === 100;
  if (top < (dense ? 0.99 : 0.9) || top - second < (dense ? 0.016 : 0.05)) return null;
  return result;
}

export function percentileValue(tens, units) {
  const value = (tens % 10) * 10 + units % 10;
  return value === 0 ? 100 : value;
}

export function resolveDice({ sides, count, mode, physicalValues }) {
  if (physicalValues.length !== count || physicalValues.some(value => !Number.isInteger(value) || value < 1 || value > sides)) throw new Error('The tray returned an invalid roll.');
  const diceResults = [...physicalValues];
  const usedRolls = sides === 20 && mode !== 'normal' ? [mode === 'advantage' ? Math.max(...diceResults) : Math.min(...diceResults)] : [...diceResults];
  const natural = usedRolls[0];
  return { diceResults, usedRolls, diceTotal: usedRolls.reduce((sum, value) => sum + value, 0), crit: sides === 20 ? natural === 20 ? 'critical_success' : natural === 1 ? 'critical_failure' : null : null };
}
