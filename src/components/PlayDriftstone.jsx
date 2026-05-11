export default function PlayDriftstone({ onHome }) {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#111' }}>
      <iframe
        src="/driftstone_1.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Driftstone"
      />
    </div>
  );
}
