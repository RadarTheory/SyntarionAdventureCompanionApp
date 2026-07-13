export default function LoadingScreen() {
  // Force fresh video load by adding timestamp
  const videoSrc = `/loading-stinger-20260712.mp4?t=${Date.now()}`;

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
        key={videoSrc}                    // Important: forces React to reload
        src={videoSrc}
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