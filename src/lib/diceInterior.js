import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function validateInteriorGLB(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 20 || buffer.byteLength > 5 * 1024 * 1024) throw new Error('Choose a GLB model under 5 MB.');
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength || view.getUint32(16, true) !== 0x4e4f534a) throw new Error('Choose a valid binary glTF 2.0 (.glb) file.');
  const length = view.getUint32(12, true);
  if (length > buffer.byteLength - 20) throw new Error('The GLB file is incomplete.');
  let document;
  try { document = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, length))); }
  catch { throw new Error('The GLB file contains invalid model data.'); }
  if (document.asset?.version !== '2.0' || !document.meshes?.length) throw new Error('The GLB needs at least one visible mesh.');
  for (const resource of [...(document.buffers || []), ...(document.images || [])]) if (resource.uri && !resource.uri.startsWith('data:')) throw new Error('Export a self-contained GLB with textures embedded.');
  if (document.animations?.length || document.skins?.length) throw new Error('Use a static model without animation or armatures.');
  if ((document.nodes?.length || 0) > 64) throw new Error('Keep the design to 64 objects or fewer.');
  const supported = new Set(['KHR_materials_unlit', 'KHR_materials_emissive_strength', 'KHR_materials_clearcoat', 'KHR_materials_ior', 'KHR_materials_transmission', 'KHR_materials_volume', 'KHR_materials_specular', 'KHR_mesh_quantization', 'KHR_texture_transform']);
  if ((document.extensionsRequired || []).some(name => !supported.has(name))) throw new Error('Export the GLB without geometry or texture compression.');
  let triangles = 0;
  for (const mesh of document.meshes) for (const primitive of mesh.primitives || []) {
    if ((primitive.mode ?? 4) !== 4) throw new Error('Export the model as triangle meshes.');
    const accessor = document.accessors?.[primitive.indices ?? primitive.attributes?.POSITION];
    if (!accessor || !Number.isFinite(accessor.count)) throw new Error('The model has invalid mesh geometry.');
    triangles += accessor.count / 3;
  }
  if (triangles > 50000) throw new Error('Keep the internal design under 50,000 triangles.');
  return { triangles: Math.ceil(triangles), objects: document.nodes?.length || 0 };
}

export async function loadInteriorModel(data) {
  if (!/^data:model\/gltf-binary;base64,/.test(data || '')) throw new Error('Upload an internal GLB model first.');
  const encoded = data.split(',')[1];
  if (encoded.length > 7 * 1024 * 1024) throw new Error('The internal model is too large.');
  const binary = atob(encoded), bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  validateInteriorGLB(bytes.buffer);
  const manager = new THREE.LoadingManager();
  manager.setURLModifier(url => { if (!url.startsWith('data:') && !url.startsWith('blob:')) throw new Error('External model assets are not supported.'); return url; });
  const gltf = await new GLTFLoader(manager).parseAsync(bytes.buffer, '');
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), sphere = box.getBoundingSphere(new THREE.Sphere());
  if (box.isEmpty() || !Number.isFinite(sphere.radius) || sphere.radius <= 0) throw new Error('The internal model has no visible size.');
  const normalized = new THREE.Group();
  model.position.sub(sphere.center);
  normalized.add(model); normalized.scale.setScalar(1 / sphere.radius);
  normalized.updateMatrixWorld(true);
  return normalized;
}

export function disposeInterior(model) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  model.traverse(child => {
    if (child.geometry) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : child.material ? [child.material] : []) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  textures.forEach(texture => { texture.source?.data?.close?.(); texture.dispose(); });
  materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
}
