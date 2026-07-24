import { useEffect } from 'react';

export default function PlayDriftstone({ onHome, onToast }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data;
      if (!message || message.source !== 'driftstone') return;
      if (message.type === 'toast') {
        onToast?.(message.payload);
      }
      if (message.type === 'back') {
        onHome?.();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHome, onToast]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#111', position: 'relative' }}>
      <iframe
        src="/driftstone_1.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="Driftstone"
      />
    </div>
  );
}