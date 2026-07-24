import { useDevice } from './useDevice';

// ─── GameUI ───────────────────────────────────────────────────────────────────
// Shared "sleek" menu kit for Lótjarr's Bag mini-games (Elddimgates, Fubin,
// Undercrypts, Nodewright). Gold-on-dark / Cinzel look shared across the bag,
// wired to useDevice so touch targets and spacing scale up on phones.
// ─────────────────────────────────────────────────────────────────────────────

const VARIANTS = {
  primary: {
    border: 'rgba(244,206,100,0.7)',
    bg: 'linear-gradient(180deg, rgba(77,58,22,0.92), rgba(16,11,6,0.95))',
    color: '#f0dfad',
  },
  secondary: {
    border: 'rgba(215,180,90,0.28)',
    bg: 'linear-gradient(180deg, rgba(30,23,12,0.88), rgba(9,7,5,0.9))',
    color: '#d8c797',
  },
  ghost: {
    border: 'rgba(215,180,90,0.18)',
    bg: 'transparent',
    color: 'rgba(216,199,151,0.72)',
  },
  danger: {
    border: 'rgba(205,92,92,0.5)',
    bg: 'linear-gradient(180deg, rgba(70,20,20,0.7), rgba(16,6,6,0.92))',
    color: '#f0c3c3',
  },
};

export function GameButton({
  variant = 'secondary',
  active = false,
  disabled = false,
  full = false,
  onClick,
  children,
  title,
  type = 'button',
  style,
}) {
  const { isMobile } = useDevice();
  const v = VARIANTS[variant] || VARIANTS.secondary;
  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={{
        width: full ? '100%' : undefined,
        minHeight: isMobile ? 46 : 38,
        padding: isMobile ? '0 18px' : '0 16px',
        borderRadius: 9,
        border: `1px solid ${active ? 'rgba(244,206,100,0.9)' : v.border}`,
        background: v.bg,
        color: active ? '#f4ce64' : v.color,
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: isMobile ? 11 : 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.36 : 1,
        boxShadow: active
          ? '0 0 22px rgba(215,180,90,0.18), inset 0 1px 0 rgba(255,244,204,0.16)'
          : 'inset 0 1px 0 rgba(255,244,204,0.06)',
        transition: 'border-color 160ms ease, box-shadow 160ms ease, transform 120ms ease',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function GamePanel({ title, children, style }) {
  return (
    <div
      style={{
        border: '1px solid rgba(215,180,90,0.22)',
        borderRadius: 14,
        background: 'linear-gradient(150deg, rgba(240,238,235,0.05), rgba(9,7,4,0.88))',
        boxShadow: '0 24px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,244,204,0.07)',
        padding: 16,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(215,180,90,0.72)',
            marginBottom: 12,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// Fullscreen modal — pause / game-over / confirm dialogs. Tap outside or the
// close affordance to dismiss (onClose is optional — omit for a blocking modal).
export function GameOverlay({ open, onClose, children }) {
  const { isMobile } = useDevice();
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(4,3,2,0.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: isMobile ? 16 : 24,
        boxSizing: 'border-box',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          width: 'min(440px, 100%)',
          maxHeight: '86vh',
          overflowY: 'auto',
          border: '1px solid rgba(244,206,100,0.4)',
          borderRadius: 18,
          background: 'linear-gradient(160deg, rgba(30,23,12,0.98), rgba(6,5,3,0.99))',
          boxShadow: '0 40px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,244,204,0.1)',
          padding: isMobile ? 20 : 26,
          boxSizing: 'border-box',
          textAlign: 'center',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function GameBackButton({ onClick, label = 'Back to Bag' }) {
  const { isMobile } = useDevice();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'fixed',
        top: isMobile ? 10 : 18,
        left: isMobile ? 10 : 18,
        zIndex: 50,
        border: '1px solid rgba(215,180,90,0.44)',
        borderRadius: 8,
        background: 'linear-gradient(180deg, rgba(27,21,12,0.96), rgba(8,6,4,0.88))',
        color: '#d7c79a',
        padding: isMobile ? '9px 12px' : '10px 16px',
        fontFamily: "'Cinzel', serif",
        fontSize: isMobile ? 10 : 9,
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: '0 12px 32px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,236,176,0.11)',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        whiteSpace: 'nowrap',
      }}
    >
      {`← ${label}`}
    </button>
  );
}

// Gate for games whose core interaction (mouse-aim combat, drag, etc.) isn't
// touch-ready yet. Shown instead of the game on phones.
export function ComingSoonScreen({ onExit, name = 'This game' }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#080604',
        padding: 24,
        boxSizing: 'border-box',
        textAlign: 'center',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ maxWidth: 340 }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 12,
            letterSpacing: '0.2em',
            color: 'rgba(215,180,90,0.75)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Mobile Coming Soon
        </div>
        <p style={{ color: 'rgba(235,220,178,0.68)', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 24 }}>
          {name} needs a bigger screen and a mouse for now — swing back on desktop.
        </p>
        <GameButton variant="primary" full onClick={onExit}>Back to Bag</GameButton>
      </div>
    </div>
  );
}
