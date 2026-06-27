import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

const TABS = ['npcs', 'items', 'maps', 'beasts', 'races', 'classes', 'moments'];

const AssetsPanel = () => {
  const [isDM, setIsDM] = useState(false);
  const [activeTab, setActiveTab] = useState('npcs');
  const [assets, setAssets] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsDM(user?.email === 'adrian.p.gilmore@gmail.com');
    });
  }, []);

  useEffect(() => {
    if (!isDM) return;
    if (activeTab === 'moments') {
      supabase.storage.from('dm_assets').list('moments').then(({ data }) => {
        setAssets(data?.map(file => ({
          id: file.name,
          url: getImageUrl(`moments/${file.name}`),
        })) || []);
      });
    } else {
      supabase.from(activeTab).select('id, name').then(({ data }) => {
        setAssets(data?.map(asset => ({
          ...asset,
          url: getImageUrl(`${activeTab}/${asset.id}.jpg`),
        })) || []);
      });
    }
  }, [isDM, activeTab]);

  const onFileSelected = async (e, id) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = `${activeTab}/${id}.jpg`;
    await supabase.storage.from('dm_assets').upload(path, file, { upsert: true });
    setAssets(assets => assets.map(a => a.id === id ? { ...a, url: getImageUrl(path) } : a));
  };

  const getImageUrl = (path) => {
    const { data } = supabase.storage.from('dm_assets').getPublicUrl(path);
    return data.publicUrl;
  };

  if (!isDM) return null;

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
        {TABS.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: tab === activeTab ? `2px solid ${COLORS.magic}` : 'none',
              cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
              fontSize: 11,
              color: tab === activeTab ? COLORS.magic : COLORS.muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
        {assets.map(asset => (
          <div key={asset.id} style={{ position: 'relative' }}>
            <div style={{
              width: '100%',
              paddingBottom: '100%',
              background: asset.url ? `url(${asset.url}) center/cover` : COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              marginBottom: 6,
            }}/>
            <div style={{
              fontSize: 11,
              color: COLORS.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {asset.name || asset.id}
            </div>
            <label style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'rgba(0,0,0,0.7)',
              color: COLORS.muted,
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              cursor: 'pointer',
            }}>
              ✎
              <input type="file" accept="image/*" ref={fileInputRef} onChange={e => onFileSelected(e, asset.id)} style={{ display: 'none' }}/>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsPanel;