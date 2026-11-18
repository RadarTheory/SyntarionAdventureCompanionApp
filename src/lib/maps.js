// Where a map's image comes from. Built-in maps live in public/Maps and are named by file ('Tarek'Mor.png'); maps the DM
// uploads live in the 'maps' storage bucket and are named 'upload:<path>' everywhere a map is stored (vtt_sessions,
// map_ambience, campaigns.map_url). See supabase/migrations/20261118_map_uploads.sql.
import { useCallback, useEffect, useState } from 'react';
import supabase from './supabase';
import { STANDARD_PX } from './grid';

export const isUploaded = name => typeof name === 'string' && name.startsWith('upload:');

export function mapSrc(name) {
  if (!name) return '';
  if (isUploaded(name)) return supabase.storage.from('maps').getPublicUrl(name.slice(7)).data.publicUrl;
  if (/^https?:\/\//.test(name)) return name;
  return `/Maps/${encodeURIComponent(String(name).replace(/^Maps[\\/]/i, ''))}`;
}

// Uploaded maps load from another origin; asking for CORS keeps the canvas readable, so painted lights can be found.
export function loadMapImage(name, onLoad) {
  const img = new Image();
  if (isUploaded(name)) img.crossOrigin = 'anonymous';
  img.onload = () => onLoad(img);
  img.src = mapSrc(name);
  return img;
}

// The DM's uploaded maps, as map-picker entries ({ id, name, filename, uploaded, width, height }).
export function useUploadedMaps() {
  const [maps, setMaps] = useState([]);
  const load = useCallback(async () => {
    const { data } = await supabase.from('vtt_maps').select('*').order('name');
    return (data || []).map(m => ({ id: m.key, name: m.poi || m.name, filename: m.key, uploaded: true, canon: !!m.locked, region: m.region || null, width: m.width, height: m.height }));
  }, []);
  useEffect(() => { let live = true; load().then(list => { if (live) setMaps(list); }); return () => { live = false; }; }, [load]);
  const reload = useCallback(() => load().then(setMaps), [load]);
  return { maps, reload };
}

const imageSize = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
  img.onerror = () => { reject(new Error('That file is not an image the browser can open.')); URL.revokeObjectURL(url); };
  img.src = url;
});

// Upload a map image. Returns { key, name, width, height, onStandard, squares }: onStandard says whether it follows the
// map standard (whole squares of 100 px); squares is its size in squares at the standard.
export async function uploadMap(file, name) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose a PNG, JPG or WebP image.');
  if (file.size > 25 * 1024 * 1024) throw new Error('That image is over 25 MB. Export it smaller (about 4000 × 3000 px is the most a map needs).');
  const { width, height } = await imageSize(file);
  const clean = (name || file.name.replace(/\.[^.]+$/, '')).trim() || 'Untitled map';
  const ext = (file.name.match(/\.([a-z0-9]+)$/i)?.[1] || 'png').toLowerCase();
  const path = `${Date.now().toString(36)}-${clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'map'}.${ext}`;
  const { error } = await supabase.storage.from('maps').upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' });
  if (error) throw new Error(/bucket/i.test(error.message) ? 'Run supabase/migrations/20261118_map_uploads.sql to enable map uploads.' : error.message);
  const key = `upload:${path}`;
  const { error: rowError } = await supabase.from('vtt_maps').insert({ key, name: clean, path, width, height });
  if (rowError) throw new Error(rowError.message);
  return { key, name: clean, width, height, onStandard: width % STANDARD_PX === 0 && height % STANDARD_PX === 0, squares: [Math.round(width / STANDARD_PX), Math.round(height / STANDARD_PX)] };
}
