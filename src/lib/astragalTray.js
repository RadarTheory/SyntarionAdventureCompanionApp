import * as THREE from 'three';
import { Vec3 } from 'cannon-es';
import { createDieDefinition, DICE_SKINS, readSettledFace, randomBetween } from './astragalDice.js';
import { createDiceWorld, createDiceBody, createThrowLayout, prepareSpreadThrow, prepareTableCast } from './astragalPhysics.js';
import { loadInteriorModel } from './diceInterior.js';

function surfaceSampler(image, tint, translucent) {
  const color = new THREE.Color(tint);
  const luminance = (r, g, b) => 0.2126 * r * color.r + 0.7152 * g * color.g + 0.0722 * b * color.b;
  if (translucent) return () => 0.24;
  if (!image) return () => luminance(1, 1, 1);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, 48, 48);
  const pixels = context.getImageData(0, 0, 48, 48).data;
  const linear = value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

  return (u, v) => {
    const x = Math.round(u * 47), y = Math.round((1 - v) * 47);
    const samples = [];
    for (let row = Math.max(0, y - 5); row <= Math.min(47, y + 5); row++) {
      for (let column = Math.max(0, x - 5); column <= Math.min(47, x + 5); column++) {
        const i = (row * 48 + column) * 4;
        const alpha = pixels[i + 3] / 255;
        samples.push(luminance(...[0, 1, 2].map(offset => linear(pixels[i + offset] / 255))) * alpha);
      }
    }
    samples.sort((a, b) => a - b);
    return samples[Math.floor(samples.length / 2)] ?? 0.24;
  };
}

function primaryLogoColor(image) {
  if (!image) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, 48, 48);
  const pixels = context.getImageData(0, 0, 48, 48).data;
  const neutralBins = new Map();
  const hueBins = new Map();
  const pixel = new THREE.Color();
  const hsl = { h: 0, s: 0, l: 0 };
  const addSample = (bins, key, color, weight) => {
    const bin = bins.get(key) ?? { weight: 0, color: new THREE.Color(0, 0, 0) };
    bin.weight += weight;
    bin.color.r += color.r * weight;
    bin.color.g += color.g * weight;
    bin.color.b += color.b * weight;
    bins.set(key, bin);
  };
  for (let i = 0; i < pixels.length; i += 4) {
    const opacity = pixels[i + 3] / 255;
    if (opacity < 0.5) continue;
    pixel.setRGB(pixels[i] / 255, pixels[i + 1] / 255, pixels[i + 2] / 255);
    pixel.getHSL(hsl);
    if (hsl.s > 0.24 && hsl.l > 0.17 && hsl.l < 0.96) {
      // Pool shades of the same hue and favor their lit pigment over shadow.
      addSample(hueBins, Math.round(hsl.h * 18) % 18, pixel, opacity * hsl.s * hsl.l ** 3);
    } else {
      addSample(neutralBins, Math.floor(hsl.l * 8), pixel, opacity);
    }
  }
  let dominant;
  for (const bin of (hueBins.size ? hueBins : neutralBins).values()) {
    if (!dominant || bin.weight > dominant.weight) dominant = bin;
  }
  if (!dominant) return null;
  return dominant.color.multiplyScalar(1 / dominant.weight).convertSRGBToLinear();
}

function labelTexture(text, background, primary) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.font = '600 77px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const underlined = text === '6' || text === '9';
  const metrics = ctx.measureText(text);
  const baseline = (underlined ? 60 : 64) + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  const underlineY = baseline + metrics.actualBoundingBoxDescent + 6;

  const ink = primary?.getStyle() ?? (background < 0.34 ? '#f9e8c7' : '#211714');
  const color = primary ?? new THREE.Color(ink);
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  const contrast = (Math.max(background, luminance) + 0.05) / (Math.min(background, luminance) + 0.05);
  const darkEdge = primary ? luminance > 0.18 : luminance > background;
  const edge = darkEdge ? 'rgba(12, 9, 6, .95)' : 'rgba(255, 242, 211, .8)';
  if (primary && contrast < 4.5) {
    // Draw the edge beneath the fill so the logo pigment stays visible.
    ctx.strokeStyle = edge;
    ctx.lineWidth = 3;
    ctx.strokeText(text, 64, baseline, 105);
    if (underlined) ctx.strokeRect(49, underlineY, 30, 3);
  }
  ctx.shadowColor = edge;
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = ink;
  ctx.fillText(text, 64, baseline, 105);
  if (underlined) ctx.fillRect(49, underlineY, 30, 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function logoTexture(image, lightInk) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  const silhouette = document.createElement('canvas');
  silhouette.width = silhouette.height = 224;
  const mask = silhouette.getContext('2d');

  function drawLip(color, x, y, blur = 0) {
    mask.clearRect(0, 0, 224, 224);
    mask.drawImage(image, 0, 0, 224, 224);
    mask.globalCompositeOperation = 'source-in';
    mask.fillStyle = color;
    mask.fillRect(0, 0, 224, 224);
    mask.globalCompositeOperation = 'source-over';
    context.save();
    if (blur) context.filter = `blur(${blur}px)`;
    context.drawImage(silhouette, x, y);
    context.restore();
  }

  drawLip('rgba(10, 7, 5, .85)', 19, 22, 4);
  drawLip(lightInk ? 'rgba(255, 241, 210, .68)' : 'rgba(255, 241, 210, .9)', 14, 20);
  drawLip('rgba(18, 12, 9, .85)', 18, 12);
  context.drawImage(image, 16, 16, 224, 224);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDieMesh(definition, skin, scale) {
  const group = new THREE.Group(), positions = [], uvs = [];
  const faceCoordinates = new Map();
  const faceRotations = new Map();
  for (const face of definition.faces) {
    const u = definition.vertices[face.indices[1]].clone().sub(definition.vertices[face.indices[0]]).normalize(), v = face.normal.clone().cross(u);
    if (definition.sides === 20) {
      faceRotations.set(face, new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u, v, face.normal)));
    }
    const projected = face.indices.map(index => { const point = definition.vertices[index].clone().sub(face.center); return [point.dot(u), point.dot(v)]; });
    const lowU = Math.min(...projected.map(p => p[0])), highU = Math.max(...projected.map(p => p[0]));
    const lowV = Math.min(...projected.map(p => p[1])), highV = Math.max(...projected.map(p => p[1]));
    faceCoordinates.set(face, location => {
      const offset = location.clone().sub(face.center);
      return [(offset.dot(u) - lowU) / (highU - lowU), (offset.dot(v) - lowV) / (highV - lowV)];
    });
    for (let i = 1; i < face.indices.length - 1; i++) {
      for (const corner of [0, i, i + 1]) {
        positions.push(...definition.vertices[face.indices[corner]].toArray());
        uvs.push((projected[corner][0] - lowU) / (highU - lowU), (projected[corner][1] - lowV) / (highV - lowV));
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const translucent = skin.designType === 'interior';
  const sampleSurface = surfaceSampler(skin.patternImage, skin.patternImage ? '#ffffff' : skin.body, translucent);
  const backgroundAt = (face, location) => sampleSurface(...faceCoordinates.get(face)(location));
  let patternSource = skin.patternImage;
  if (translucent && patternSource) {
    // PNG alpha decorates a continuous glass shell; it must not cut holes in it.
    const surface = document.createElement('canvas'); surface.width = surface.height = 512;
    const context = surface.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, 512, 512);
    context.drawImage(patternSource, 0, 0, 512, 512); patternSource = surface;
  }
  const pattern = patternSource ? new THREE.Texture(patternSource) : null;
  if (pattern) { pattern.colorSpace = THREE.SRGBColorSpace; pattern.needsUpdate = true; }
  const mesh = new THREE.Mesh(geometry, translucent
    ? new THREE.MeshPhysicalMaterial({ color: skin.tint || '#a7eadb', map: pattern, metalness: 0, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: Math.max(0.1, Math.min(0.7, Number(skin.shellOpacity) || 0.28)), depthWrite: false, transmission: 0.25, thickness: 0.08, ior: 1.42 })
    : new THREE.MeshStandardMaterial({ color: pattern ? '#ffffff' : skin.body, map: pattern, roughness: skin.roughness, metalness: skin.metalness }));
  mesh.name = 'die-solid';
  mesh.castShadow = !translucent; mesh.receiveShadow = true;
  group.add(mesh);
  if (translucent && skin.interiorScene) {
    const model = skin.interiorScene.clone(true);
    const radius = Math.min(...definition.faces.map(face => face.normal.dot(face.center)));
    const holder = new THREE.Group();
    holder.name = 'die-interior'; holder.add(model);
    holder.scale.setScalar(radius * Math.max(0.4, Math.min(0.95, Number(skin.interiorScale) || 0.85)));
    model.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });
    group.add(holder);
  }
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, definition.sides === 100 ? 5 : 10), new THREE.LineBasicMaterial({ color: skin.edge, transparent: true, opacity: 0.65 })));
  const addLabel = (face, location, value, size) => {
    const text = definition.percentile ? String(value % 10 * 10).padStart(2, '0') : definition.sides === 10 ? String(value % 10) : String(value);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: labelTexture(text, backgroundAt(face, location), skin.numberPigment), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
    label.position.copy(location).addScaledVector(face.normal, 0.008);
    if (faceRotations.has(face)) label.quaternion.copy(faceRotations.get(face));
    else label.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
    label.userData.faceValue = face.value;
    group.add(label);
  };
  for (const face of definition.faces) {
    const radius = Math.min(...face.indices.map((index, i) => {
      const a = definition.vertices[index], b = definition.vertices[face.indices[(i + 1) % face.indices.length]];
      return new THREE.Line3(a, b).closestPointToPoint(face.center, true, new THREE.Vector3()).distanceTo(face.center);
    }));
    if (skin.logoImage && definition.sides === 20 && face.value === 20) {
      const texture = logoTexture(skin.logoImage, backgroundAt(face, face.center) < 0.34);
      const size = radius * 1.65;
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
      logo.position.copy(face.center).addScaledVector(face.normal, 0.012);
      logo.quaternion.copy(faceRotations.get(face)); group.add(logo);
      continue;
    }
    if (definition.sides === 4) {
      // D4 is read at the upper vertex. Repeat its value on all three adjoining faces.
      for (const index of face.indices) {
        const opposite = definition.faces.find(f => !f.indices.includes(index));
        addLabel(face, face.center.clone().lerp(definition.vertices[index], 0.48), opposite.value, 0.37);
      }
    } else {
      addLabel(face, face.center, face.value, radius * (definition.percentile ? 1.48 : 1.72));
    }
  }
  group.scale.setScalar(scale);
  return group;
}

function disposeObject(object) {
  object.traverse(child => {
    child.geometry?.dispose();
    for (const material of Array.isArray(child.material) ? child.material : child.material ? [child.material] : []) {
      material.map?.dispose(); material.dispose();
    }
  });
}

const supportVertex = new Vec3();

export function settledValue(die, time) {
  const { body, definition } = die;
  const value = readSettledFace(definition, body.quaternion);
  if (value === null || body.velocity.lengthSquared() > 0.16 ** 2 || body.angularVelocity.lengthSquared() > 0.24 ** 2) {
    die.rest = null;
    return null;
  }

  // A die has to rest on a face at the tabletop, rather than lean on a wall or another die.
  let floorContacts = 0;
  for (const vertex of body.shapes[0].vertices) {
    body.quaternion.vmult(vertex, supportVertex);
    if (Math.abs(supportVertex.y + body.position.y) < 0.035) floorContacts++;
  }
  if (floorContacts < 3) {
    die.rest = null;
    return null;
  }

  const rest = die.rest;
  const q = body.quaternion;
  const alignment = rest && Math.abs(q.x * rest.rotation.x + q.y * rest.rotation.y + q.z * rest.rotation.z + q.w * rest.rotation.w);
  if (!rest || rest.value !== value || body.position.distanceTo(rest.position) > 0.025 || alignment < 0.9998) {
    die.rest = { value, since: time, position: body.position.clone(), rotation: q.clone() };
    return null;
  }
  return time - rest.since >= 0.55 ? value : null;
}

export function createAstragalTray(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', 'Astragal physical 3D dice tray');
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y';
  container.appendChild(renderer.domElement);
  // A fixed overhead projection makes the physically upper face readable everywhere.
  // Never rotate a settled die, relabel a face, or move the camera to reveal a result.
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 80);
  camera.up.set(0, 0, -1);
  camera.position.set(0, 20, 0); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xfdf1ce, 0x26392c, 3));
  const key = new THREE.DirectionalLight(0xffe1a1, 4);
  key.position.set(-3, 10, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 0.1, far: 40 });
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc8b1, 2); rim.position.set(6, 5, -4); scene.add(rim);
  // Dice and contact shadows render over the app; there is no opaque tray.
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.015; floor.receiveShadow = true; scene.add(floor);
  const { world, diceMaterial, setBounds } = createDiceWorld();
  let dice = [], pending = null, frame = 0, disposed = false, lastTime = 0, elapsed = 0;
  let tableWidth = 12, tableDepth = 8;
  let physicsStep = 1 / 120;
  const render = () => renderer.render(scene, camera);
  const resize = () => {
    const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1), aspect = width / height;
    const halfHeight = Math.max(6, 3.2 / aspect);
    camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
    camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    tableWidth = halfHeight * aspect * 1.76;
    tableDepth = halfHeight * 1.44;
    setBounds(tableWidth, tableDepth);
    renderer.setSize(width, height, false); render();
  };
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  const clearDice = () => { for (const die of dice) { world.removeBody(die.body); scene.remove(die.mesh); disposeObject(die.mesh); } dice = []; };
  const fail = error => { const current = pending; pending = null; cancelAnimationFrame(frame); current?.reject(error); };
  const animate = time => {
    if (!pending || disposed) return;
    try {
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 1 / 60;
      lastTime = time; elapsed += delta;
      world.step(physicsStep, delta, 24);
      dice.forEach(die => { die.mesh.position.copy(die.body.position); die.mesh.quaternion.copy(die.body.quaternion); });
      render();
      const values = dice.map(die => settledValue(die, elapsed));
      if (elapsed > 0.8 && values.every(value => value !== null)) {
        const current = pending; pending = null;
        current.resolve({ values, physicalDice: dice.map((die, i) => ({ sides: die.definition.sides, percentile: die.definition.percentile, face: values[i], position: die.body.position.toArray(), quaternion: die.body.quaternion.toArray() })), durationMs: Math.round(elapsed * 1000), presentation: 'natural-settlement' });
        return;
      }
      if (elapsed > 18) {
        fail(new Error('A die couldn’t rest flat on the table. Cast again to make a new roll.'));
        return;
      }
      frame = requestAnimationFrame(animate);
    } catch (error) { fail(error); }
  };
  const onContextLost = event => { event.preventDefault(); fail(new Error('The 3D tray lost its graphics connection. Reopen Astragal to try again.')); };
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  return {
    async roll({ sides, count, skin = 'bone' }) {
      if (disposed || pending) return Promise.reject(new Error('The tray is not ready for another roll.'));
      if (![4, 6, 8, 10, 12, 20, 100].includes(sides) || !Number.isInteger(count) || count < 1 || count > 10) return Promise.reject(new Error('Invalid dice selection.'));
      clearDice();
      resize();
      try {
        const finish = typeof skin === 'string' ? DICE_SKINS[skin] || DICE_SKINS.bone : { ...DICE_SKINS.bone, ...skin };
        const loadArtwork = async data => {
          if (!data) return null;
          if (!/^data:image\/png;base64,/.test(data) || data.length > 3 * 1024 * 1024) throw new Error('Invalid dice artwork. Re-upload it in the designer.');
          const image = new Image(); image.src = data; await image.decode(); return image;
        };
        const [patternImage, logoImage] = await Promise.all([loadArtwork(finish.pattern), loadArtwork(finish.logo)]);
        if (disposed) throw new Error('Astragal was closed before the roll finished.');
        const interiorScene = finish.designType === 'interior' && finish.interiorModel ? await loadInteriorModel(finish.interiorModel) : null;
        if (finish.designType === 'interior' && !interiorScene) throw new Error('Upload an internal GLB design before casting this finish.');
        if (disposed) throw new Error('Astragal was closed before the roll finished.');
        const numberPigment = /^#[\da-f]{6}$/i.test(finish.numeralColor ?? '')
          ? new THREE.Color(finish.numeralColor)
          : primaryLogoColor(logoImage);
        const renderedSkin = { ...finish, patternImage, logoImage, interiorScene, numberPigment };
        const physicalCount = count;
        const mobile = container.clientWidth < 600;
        const preferredScale = physicalCount <= 3 ? (mobile ? 0.85 : 1.3) : physicalCount <= 10 ? (mobile ? 0.63 : 1.05) : (mobile ? 0.46 : 0.72);
        const layout = createThrowLayout(physicalCount, tableWidth, tableDepth, preferredScale);
        const scale = layout.scale;
        physicsStep = scale < 0.4 ? 1 / 240 : 1 / 120;
        const smallCast = physicalCount <= 3;
        const longAxis = tableWidth >= tableDepth ? 0 : Math.PI / 2;
        const throwAngle = smallCast
          ? longAxis + (randomBetween(0, 1) < 0.5 ? 0 : Math.PI) + randomBetween(-0.36, 0.36)
          : randomBetween(0, Math.PI * 2);
        const throwDirection = { x: Math.cos(throwAngle), z: Math.sin(throwAngle) };
        const definition = createDieDefinition(sides);
        for (let i = 0; i < physicalCount; i++) {
          const body = createDiceBody(definition, diceMaterial, i, physicalCount, scale), mesh = createDieMesh(definition, renderedSkin, scale);
          if (smallCast) prepareTableCast(body, layout.positions[i], layout, tableWidth, tableDepth, throwDirection);
          else prepareSpreadThrow(body, layout.positions[i], randomBetween, throwDirection);
          world.addBody(body); scene.add(mesh); dice.push({ definition, body, mesh });
        }
      } catch (error) { clearDice(); return Promise.reject(error); }
      lastTime = 0; elapsed = 0;
      return new Promise((resolve, reject) => { pending = { resolve, reject }; frame = requestAnimationFrame(animate); });
    },
    dispose() {
      disposed = true; fail(new Error('Astragal was closed before the roll finished.'));
      observer.disconnect(); clearDice(); disposeObject(scene);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
