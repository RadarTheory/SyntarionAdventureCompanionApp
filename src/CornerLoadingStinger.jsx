import { useEffect, useRef, useState } from 'react';

export default function CornerLoadingStinger({ enabled = true }) {
  const videoRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const playStinger = () => {
      setVisible(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      });

      setTimeout(() => {
        setVisible(false);
      }, 2200);
    };

    window.addEventListener('syntarion-screen-change', playStinger);

    return () => {
      window.removeEventListener('syntarion-screen-change', playStinger);
    };
  }, [enabled]);

  if (!enabled || !visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        width: 180,
        height: 180,
        zIndex: 999999,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 18,
      }}
    >
      <video
        ref={videoRef}
        src="/faviconloadingtransparent.mp4"
        muted
        playsInline
        preload="auto"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          mixBlendMode: 'screen',
          display: 'block',
        }}
      />
    </div>
  );
}