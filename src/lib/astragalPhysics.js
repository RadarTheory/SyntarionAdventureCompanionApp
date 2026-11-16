import { Body, Box, ContactMaterial, ConvexPolyhedron, Material, Plane, Vec3, World } from 'cannon-es';
import { randomBetween, randomQuaternion, readSettledFace } from './astragalDice.js';

export const TRAY_WIDTH = 10, TRAY_DEPTH = 8, DIE_SCALE = 0.55;

export function createDiceWorld() {
  const world = new World({ gravity: new Vec3(0, -24, 0), allowSleep: true });
  world.solver.iterations = 40;
  world.addEventListener('postStep', () => {
    for (const body of world.bodies) {
      const definition = body.dieDefinition;
      if (!definition) continue;
      body.allowSleep = readSettledFace(definition, body.quaternion) !== null;
      if (!body.allowSleep && body.sleepState !== Body.AWAKE) body.wakeUp();
    }
  });
  const diceMaterial = new Material('astragal-dice'), trayMaterial = new Material('astragal-tray');
  world.addContactMaterial(new ContactMaterial(diceMaterial, trayMaterial, { friction: 0.25, restitution: 0.28 }));
  // Smooth dice slide off one another instead of gripping into suspended piles.
  world.addContactMaterial(new ContactMaterial(diceMaterial, diceMaterial, { friction: 0.025, restitution: 0.22 }));
  const floor = new Body({ mass: 0, material: trayMaterial, shape: new Plane() });
  floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(floor);
  const walls = [];
  for (const [x, z, hx, hz] of [[-5.2, 0, 0.2, 20], [5.2, 0, 0.2, 20], [0, -4.2, 20, 0.2], [0, 4.2, 20, 0.2]]) {
    const wall = new Body({ mass: 0, material: trayMaterial, shape: new Box(new Vec3(hx, 4, hz)), position: new Vec3(x, 4, z) });
    world.addBody(wall);
    walls.push(wall);
  }
  return { world, diceMaterial, setBounds(width, depth) {
    walls[0].position.x = -width / 2 - 0.2; walls[1].position.x = width / 2 + 0.2;
    walls[2].position.z = -depth / 2 - 0.2; walls[3].position.z = depth / 2 + 0.2;
    walls.forEach(wall => { wall.aabbNeedsUpdate = true; });
  } };
}

export function createDiceBody(definition, material, index, count, scale = DIE_SCALE) {
  const shape = new ConvexPolyhedron({ vertices: definition.vertices.map(v => new Vec3(v.x * scale, v.y * scale, v.z * scale)), faces: definition.faces.map(f => f.indices) });
  const body = new Body({ mass: 1, material, shape, linearDamping: 0.6, angularDamping: 0.55, allowSleep: true, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.6 });
  // Low speed alone is not a landing: the solver must keep integrating a die
  // balanced on an edge instead of freezing it there as an optimization.
  body.dieDefinition = definition;
  body.allowSleep = readSettledFace(definition, body.quaternion) !== null;
  const cols = Math.min(5, count), rows = Math.ceil(count / cols);
  body.position.set((index % cols - (cols - 1) / 2) * 1.65 + randomBetween(-0.12, 0.12), 2.8 + randomBetween(0, 1.3), (Math.floor(index / cols) - (rows - 1) / 2) * 1.5 + randomBetween(-0.12, 0.12));
  const q = randomQuaternion();
  body.quaternion.set(q.x, q.y, q.z, q.w);
  body.velocity.set(randomBetween(-3, 3), randomBetween(-1, 1), randomBetween(-3, 3));
  body.angularVelocity.set(randomBetween(-18, 18), randomBetween(-18, 18), randomBetween(-18, 18));
  return body;
}

// Spread a batch over the available tabletop, with enough room per die to tumble.
// This only prepares the throw; no position/orientation is corrected after launch.
export function createThrowLayout(count, width, depth, preferredScale) {
  let best = null;
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns), cellWidth = width / columns, cellDepth = depth / rows;
    const scale = Math.min(preferredScale, cellWidth * 0.18, cellDepth * 0.18);
    const score = scale - (columns * rows - count) * 0.008 - Math.abs(Math.log(cellWidth / cellDepth)) * 0.005;
    if (!best || score > best.score) best = { columns, rows, cellWidth, cellDepth, scale, score };
  }
  return { scale: best.scale, positions: Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / best.columns), inRow = Math.min(best.columns, count - row * best.columns);
    return { x: (index % best.columns - (inRow - 1) / 2) * best.cellWidth, z: (row - (best.rows - 1) / 2) * best.cellDepth };
  }) };
}

export function prepareSpreadThrow(body, position, random = randomBetween, direction = { x: 1, z: 0 }) {
  // A shared throw direction moves the batch across the table without firing
  // neighboring dice into one another. Every die keeps independent orientation/spin.
  body.position.set(position.x - direction.x * 0.2 + random(-0.04, 0.04), 4.5 + random(0, 0.5), position.z - direction.z * 0.2 + random(-0.04, 0.04));
  body.velocity.set(direction.x * 0.3 + random(-0.12, 0.12), random(-0.3, 0.1), direction.z * 0.3 + random(-0.12, 0.12));
  body.angularVelocity.set(random(-7, 7), random(-24, 24), random(-7, 7));
}

export function prepareTableCast(body, position, layout, width, depth, direction, random = randomBetween) {
  const margin = layout.scale * 1.25 + 0.25;
  const reachX = width / 2 - margin - Math.max(...layout.positions.map(point => Math.abs(point.x)));
  const reachZ = depth / 2 - margin - Math.max(...layout.positions.map(point => Math.abs(point.z)));
  const reach = Math.max(0, Math.min(reachX / Math.max(0.001, Math.abs(direction.x)), reachZ / Math.max(0.001, Math.abs(direction.z))));
  const setback = reach * 0.9;
  const speed = Math.min(12, 3.6 + setback * 1.35);
  body.position.set(position.x - direction.x * setback, random(4.3, 4.8), position.z - direction.z * setback);
  body.velocity.set(direction.x * speed + random(-0.12, 0.12), random(0.3, 0.8), direction.z * speed + random(-0.12, 0.12));
  body.angularVelocity.set(direction.z * 9 + random(-4, 4), random(-12, 12), -direction.x * 9 + random(-4, 4));
}
