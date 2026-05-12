export default function PlayDriftstone({ onHome }) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#111', position: 'relative' }}>
      <button
        onClick={onHome}
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          zIndex: 9999,
          background: 'rgba(10, 8, 6, 0.82)',
          border: '1px solid rgba(232, 200, 116, 0.65)',
          borderRadius: 8,
          padding: '10px 16px',
          cursor: 'pointer',
          color: '#e8d9a7',
          fontFamily: "'Cinzel', serif",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}
      >
        ← Back Home
      </button>

      <iframe
        src="/driftstone_1.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Driftstone"
      />
    </div>
  );
}