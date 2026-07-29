// Minimal, dependency-free chart primitives for the admin dashboard.
// The app has no charting library installed; these cover the two shapes
// the dashboard needs (a ranked bar row, a 14-day activity bar chart).

export function BarRow({ label, value, max, color, onClick, loading }) {
  const pct = max > 0 ? Math.max(value > 0 ? 3 : 0, (value / max) * 100) : 0;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      title={onClick ? `View ${label}` : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        background: 'transparent',
        border: 'none',
        padding: '3px 0',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'monospace',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 150, flexShrink: 0, fontSize: 10, color: '#8a8378', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, height: 7, background: '#1a1714', borderRadius: 4, overflow: 'hidden' }}>
        <span
          style={{
            display: 'block',
            height: '100%',
            width: `${pct}%`,
            background: color,
            opacity: loading ? 0.35 : 0.85,
            borderRadius: 4,
            transition: 'width 400ms ease-out',
          }}
        />
      </span>
      <span style={{ width: 44, flexShrink: 0, textAlign: 'right', fontSize: 10, color: loading ? '#4a453c' : '#c9c2b6' }}>{loading ? '…' : value.toLocaleString()}</span>
    </Tag>
  );
}

export function ActivityChart({ days, color, height = 56 }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const barWidth = 100 / days.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {days.map((d, i) => {
        const h = (d.count / max) * (height - 14);
        return (
          <g key={d.label}>
            <rect
              x={i * barWidth + barWidth * 0.15}
              y={height - 14 - h}
              width={barWidth * 0.7}
              height={Math.max(h, d.count > 0 ? 1 : 0)}
              fill={color}
              opacity={0.8}
              rx={0.6}
            >
              <title>{`${d.label}: ${d.count}`}</title>
            </rect>
            {i % Math.ceil(days.length / 7) === 0 && (
              <text x={i * barWidth + barWidth / 2} y={height - 3} fontSize={3.4} fill="#5c564c" textAnchor="middle" fontFamily="monospace">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '12px 16px', minWidth: 140, flex: 1 }}>
      <div style={{ fontSize: 10, color: '#8a8378', letterSpacing: '0.1em', marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 24, color, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#5c564c', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
