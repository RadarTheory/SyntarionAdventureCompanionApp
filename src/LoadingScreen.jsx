export default function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#050505',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        src="/faviconloadingtransparent.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          width: 180,
          height: 180,
          objectFit: 'contain',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}