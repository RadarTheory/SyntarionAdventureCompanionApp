import { useEffect } from 'react';
import { recordLotjarrsGameResult } from './gameStats';
import { useDisplayName } from './lib/displayName';

export default function PlayDriftstone({ onHome, onToast }) {
  const displayName = useDisplayName('Player');

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
      if (message.type === 'result') {
        const { playerName, ...result } = message.payload || {};
        recordLotjarrsGameResult('driftstone', { playerName: playerName || displayName, ...result });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onHome, onToast, displayName]);

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