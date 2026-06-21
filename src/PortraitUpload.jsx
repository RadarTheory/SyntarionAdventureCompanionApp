import { useRef, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

export default function PortraitUpload({ currentUrl, onUploaded, size = 96 }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('portraits').upload(path, file, { upsert: false });
    if (error) { console.error('Portrait upload failed:', error); setUploading(false); return; }
    const { data } = supabase.storage.from('portraits').getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div onClick={() => fileRef.current?.click()} style={{
        width: size, height: size, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
        background: currentUrl ? `url(${currentUrl}) center/cover` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", textAlign: 'center', flexShrink: 0,
      }}>
        {!currentUrl && (uploading ? 'Uploading…' : '+ Portrait')}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      {currentUrl && (
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
          {uploading ? 'Uploading…' : 'Replace'}
        </button>
      )}
    </div>
  );
}