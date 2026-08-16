// Downscale images before they go into storage. DM assets get projected onto a
// screen, not printed, so a 4000px original costs upload time and bandwidth for
// detail nobody sees.

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_QUALITY = 0.86;

// Alpha matters here: item art is often a cutout meant to sit over the map, and
// re-encoding it as JPEG would paint the transparency black. Sample the corners
// and a sparse grid rather than every pixel.
function hasTransparency(canvas, ctx) {
  const { width, height } = canvas;
  let pixels;
  try { pixels = ctx.getImageData(0, 0, width, height).data; }
  catch { return true; } // can't tell — assume alpha and keep PNG
  const step = Math.max(4, Math.floor((width * height) / 6000)) * 4;
  for (let i = 3; i < pixels.length; i += step) {
    if (pixels[i] < 250) return true;
  }
  return false;
}

/**
 * Returns { blob, ext, contentType } ready to upload. Falls back to the original
 * file whenever re-encoding wouldn't help or isn't safe (GIF loses animation,
 * SVG is already vector, decode failures).
 */
export async function prepareImageForUpload(file, { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY } = {}) {
  const passthrough = (ext, contentType) => ({ blob: file, ext, contentType: contentType || file.type });

  if (!file?.type?.startsWith('image/')) return passthrough('bin', 'application/octet-stream');
  if (file.type === 'image/gif') return passthrough('gif');          // keep animation
  if (file.type === 'image/svg+xml') return passthrough('svg');      // already vector

  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { return passthrough(file.type === 'image/png' ? 'png' : 'jpg'); }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxEdge / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const keepAlpha = hasTransparency(canvas, ctx);
  const contentType = keepAlpha ? 'image/png' : 'image/jpeg';
  const ext = keepAlpha ? 'png' : 'jpg';

  const blob = await new Promise(resolve => canvas.toBlob(resolve, contentType, quality));
  if (!blob) return passthrough(ext, contentType);

  // Re-encoding a small, already-optimised file can make it bigger. Keep whichever wins.
  if (blob.size >= file.size && scale === 1) return passthrough(file.type === 'image/png' ? 'png' : 'jpg');
  return { blob, ext, contentType };
}
