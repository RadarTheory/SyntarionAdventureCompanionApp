import { useState, useEffect } from 'react';

/** True once the image at `src` has failed to load (a CSS mask can't report that itself). */
export function useImageFailed(src) {
  const [failedSrc, setFailedSrc] = useState(null);
  useEffect(() => {
    if (!src) return undefined;
    const img = new Image();
    img.onerror = () => setFailedSrc(src);
    img.src = src;
    return () => { img.onerror = null; };
  }, [src]);
  return !!src && failedSrc === src;
}
