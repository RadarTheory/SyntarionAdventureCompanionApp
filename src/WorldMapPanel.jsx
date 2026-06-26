import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── TRAVEL CALC ──────────────────────────────────────────────────────────────
const TRAVEL_SPEEDS = {
  walking:   { label: 'Walking',       daily: 22,  emoji: '🚶' },
  horse:     { label: 'Horseback',     daily: 42,  emoji: '🐴' },
  caravan:   { label: 'Caravan',       daily: 17,  emoji: '🛤' },
  barge:     { label: 'River Barge',   daily: 35,  emoji: '⛵' },
  ship:      { label: 'Merchant Ship', daily: 100, emoji: '⚓' },
  fast_ship: { label: 'Fast Vessel',   daily: 197, emoji: '🚢' },
};

// 1% of map ≈ 28 miles (2800-mile continent across 100%)
const PCT_TO_MILES = 28;

function calcDistance(a, b) {
  const dx = (a.x_pct - b.x_pct) * PCT_TO_MILES;
  const dy = (a.y_pct - b.y_pct) * PCT_TO_MILES;
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}

function calcTravelTime(miles, method) {
  const speed = TRAVEL_SPEEDS[method] || TRAVEL_SPEEDS.walking;
  const days = miles / speed.daily;
  if (days < 1) return `${Math.round(days * 24)} hours`;
  if (days < 2) return `~1 day`;
  return `~${Math.round(days)} days`;
}

// ─── PIN TYPE CONFIG ──────────────────────────────────────────────────────────
const PIN_TYPES = {
  city:     { emoji: '🏛', color: '#e8c84a' },
  port:     { emoji: '⚓', color: '#7dd3fc' },
  landmark: { emoji: '◆',  color: '#c4b5fd' },
  dungeon:  { emoji: '☠',  color: '#e05a5a' },
  ruin:     { emoji: '🏚', color: '#a78bfa' },
  camp:     { emoji: '⛺', color: '#79f5a7' },
};

// ─── WORLD MAP PANEL ──────────────────────────────────────────────────────────
export function WorldMapPanel({ campaignId, isDM = false, characters = [] }) {
  const mapRef = useRef(null);
  const imgRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [partyPos, setPartyPos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [toast, setToast] = useState(null);

  // DM pin placement
  const [pendingPin, setPendingPin] = useState(null); // { x_pct, y_pct }
  const [pinForm, setPinForm] = useState({ name: '', type: 'city', region: '', notes: '' });
  const [savingPin, setSavingPin] = useState(false);

  // DM selected pin
  const [selectedPin, setSelectedPin] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // Travel
  const [movingParty, setMovingParty] = useState(false);
  const [travelDest, setTravelDest] = useState(null);
  const [travelMethod, setTravelMethod] = useState('walking');
  const [confirmingTravel, setConfirmingTravel] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    loadAll();
    const sub = supabase.channel(`worldmap-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'party_position' }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const loadAll = async () => {
    setLoading(true);
    const [locRes, posRes] = await Promise.all([
      supabase.from('locations').select('*').or(`campaign_id.is.null,campaign_id.eq.${campaignId}`).order('name'),
      supabase.from('party_position').select('*, locations(*)').eq('campaign_id', String(campaignId)).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (locRes.data) setLocations(locRes.data);
    if (posRes.data) setPartyPos(posRes.data);
    setLoading(false);
  };

  
const handleMapClick = useCallback((e) => {
  if (!isDM) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100;
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100;
    if (movingParty) return;

    // If editing an existing pin, reposition it instead of creating a new one
    if (editMode && selectedPin) {
      supabase.from('locations').update({ x_pct, y_pct }).eq('id', selectedPin.id).then(() => {
        showToast(`📍 ${selectedPin.name} repositioned.`);
        loadAll();
      });
      return;
    }

    setPendingPin({ x_pct, y_pct });
    setPinForm({ name: '', type: 'city', region: '', notes: '' });
    setSelectedPin(null);
    setEditMode(false);
  }, [isDM, movingParty, editMode, selectedPin]);

  const handleMapMoveClick = useCallback((e) => {
    if (!isDM || !movingParty) return;
    // clicking on existing pin handled by pin click — this catches empty map clicks
  }, [isDM, movingParty]);

  // ── Save new pin ───────────────────────────────────────────────────────────
  const savePin = async () => {
    if (!pinForm.name.trim() || !pendingPin) return;
    setSavingPin(true);
    const { error } = await supabase.from('locations').insert({
      name: pinForm.name.trim(),
      type: pinForm.type,
      region: pinForm.region.trim() || null,
      notes: pinForm.notes.trim() || null,
      x_pct: pendingPin.x_pct,
      y_pct: pendingPin.y_pct,
      campaign_id: null, // world location by default
    });
    setSavingPin(false);
    if (!error) {
      showToast(`📍 ${pinForm.name} added to the world.`);
      setPendingPin(null);
      loadAll();
    }
  };

  // ── Update existing pin ────────────────────────────────────────────────────
  const updatePin = async () => {
    if (!selectedPin) return;
    setSavingPin(true);
    await supabase.from('locations').update({
      name: pinForm.name,
      type: pinForm.type,
      region: pinForm.region,
      notes: pinForm.notes,
    }).eq('id', selectedPin.id);
    setSavingPin(false);
    setSelectedPin(null);
    setEditMode(false);
    loadAll();
  };

  const deletePin = async (id) => {
    await supabase.from('locations').delete().eq('id', id);
    setSelectedPin(null);
    loadAll();
  };

  // ── Move party ─────────────────────────────────────────────────────────────
  const confirmMove = async () => {
    if (!travelDest) return;
    setConfirmingTravel(true);

    const dist = partyPos?.locations
      ? calcDistance(partyPos.locations, travelDest)
      : null;

    const travelNote = dist
      ? `${partyPos.locations.name} → ${travelDest.name} · ${dist.toLocaleString()} miles · ${calcTravelTime(dist, travelMethod)} by ${TRAVEL_SPEEDS[travelMethod].label}`
      : `Party arrived at ${travelDest.name}`;

    await supabase.from('party_position').insert({
      campaign_id: String(campaignId),
      location_id: travelDest.id,
      location_name: travelDest.name,
      travel_method: travelMethod,
      arrived_at: new Date().toISOString(),
      travel_notes: travelNote,
    });

    // Log to all active characters' grimoires
    const activeChars = characters.filter(c => String(c.campaign) === String(campaignId));
    for (const char of activeChars) {
      await supabase.from('grimoire_entries').insert({
        character_id: String(char.id),
        campaign_id: String(campaignId),
        type: 'event',
        title: `Arrived: ${travelDest.name}`,
        content: travelNote + (travelDest.notes ? `\n\n${travelDest.notes}` : ''),
        is_dm: false,
      });
    }

    setConfirmingTravel(false);
    setMovingParty(false);
    setTravelDest(null);
    showToast(`Party moved to ${travelDest.name}.`);
    loadAll();
  };

  // ── Proximity filter for players ───────────────────────────────────────────
  const [activeBattleMap, setActiveBattleMap] = useState(null);

  useEffect(() => {
    if (!campaignId) return;
    supabase.from('vtt_sessions').select('map_filename').eq('campaign_id', String(campaignId)).maybeSingle()
      .then(({ data }) => setActiveBattleMap(data?.map_filename || null));
  }, [campaignId]);

  const visibleLocations = isDM ? locations : locations.filter(loc => {
    if (!partyPos?.locations) return false;
    const dist = calcDistance(partyPos.locations, loc);
    return dist < 500;
  });

  

  const currentLoc = partyPos?.locations;
  const travelInfo = travelDest && currentLoc
    ? { miles: calcDistance(currentLoc, travelDest), time: calcTravelTime(calcDistance(currentLoc, travelDest), travelMethod) }
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', userSelect: 'none' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999999, background: '#1a1410', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {/* ── Battle map overlay ── */}
      {activeBattleMap && !isDM && (
        <div style={{ padding: '8px 12px', background: 'rgba(96,150,224,0.06)', borderBottom: '1px solid rgba(96,150,224,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 9, color: '#7da8e0', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>⛶ Current Location Map Available</div>
          <button onClick={() => setActiveBattleMap(m => m === 'open' ? activeBattleMap : 'open')}
            style={{ background: 'rgba(96,150,224,0.12)', border: '1px solid rgba(96,150,224,0.4)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#7da8e0' }}>
            View Map
          </button>
        </div>
      )}
      {activeBattleMap === 'open' && !isDM && (
        <div onClick={() => setActiveBattleMap(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', letterSpacing: '0.12em', marginBottom: 12 }}>{currentLoc?.name || 'Current Location'}</div>
          <img src={`/Maps/${encodeURIComponent(activeBattleMap)}`} alt="Current location" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', borderRadius: 8, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ marginTop: 12, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif" }}>Tap outside to close</div>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
          {isDM ? 'Click map to place PIN' : `${visibleLocations.length} location${visibleLocations.length !== 1 ? 's' : ''} nearby`}
        </div>
        <div style={{ flex: 1 }} />
        {isDM && (
          <button onClick={() => { setMovingParty(o => !o); setTravelDest(null); setPendingPin(null); setSelectedPin(null); }}
            style={{ background: movingParty ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${movingParty ? 'rgba(200,168,74,0.6)' : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: movingParty ? '#e8c84a' : COLORS.dim }}>
            {movingParty ? '✕ Cancel Move' : '⚔ Move Party'}
          </button>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: COLORS.dim, fontSize: 11 }}>+</button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: COLORS.dim, fontSize: 11 }}>−</button>
          <button onClick={() => setZoom(1)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', color: COLORS.dim, fontSize: 8, fontFamily: "'Cinzel', serif" }}>Reset</button>
        </div>
      </div>

      {/* ── Party position bar ── */}
      {currentLoc && (
        <div style={{ padding: '6px 12px', background: 'rgba(200,168,74,0.06)', borderBottom: `1px solid rgba(200,168,74,0.15)`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 8, color: '#e8c84a', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>PARTY</div>
          <div style={{ fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif' }}>{currentLoc.name}</div>
          {currentLoc.region && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{currentLoc.region}</div>}
        </div>
      )}

      {/* ── Travel confirmation bar ── */}
      {movingParty && travelDest && travelInfo && (
        <div style={{ padding: '10px 12px', background: 'rgba(200,168,74,0.08)', borderBottom: '1px solid rgba(200,168,74,0.3)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif' }}>
              {currentLoc ? `${currentLoc.name} → ` : ''}<strong style={{ color: '#e8c84a' }}>{travelDest.name}</strong>
            </div>
            <div style={{ fontSize: 9, color: COLORS.dim }}>{travelInfo.miles.toLocaleString()} miles · {travelInfo.time}</div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            {Object.entries(TRAVEL_SPEEDS).map(([key, val]) => (
              <button key={key} onClick={() => setTravelMethod(key)}
                style={{ background: travelMethod === key ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${travelMethod === key ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: travelMethod === key ? '#e8c84a' : COLORS.dim }}>
                {val.emoji} {val.label}
              </button>
            ))}
          </div>
          <button onClick={confirmMove} disabled={confirmingTravel}
            style={{ width: '100%', background: 'rgba(200,168,74,0.18)', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a', fontWeight: 700 }}>
            {confirmingTravel ? 'Moving…' : `✦ Confirm — Move Party to ${travelDest.name}`}
          </button>
        </div>
      )}

      {/* ── Map container ── */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative', cursor: movingParty ? 'crosshair' : isDM ? 'crosshair' : 'grab' }}
        ref={mapRef}
        onWheel={e => { e.preventDefault(); setZoom(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001))); }}
        onClick={handleMapClick}>
        <div style={{ position: 'relative', width: '100%', transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <img
            src="/SoteriaMap.jpg"
            alt="Soteria World Map"
            draggable={false}
            ref={imgRef}
            style={{ width: '100%', display: 'block', userSelect: 'none' }}
          />

          {/* ── Location pins ── */}
          {visibleLocations.map(loc => {
            const pt = PIN_TYPES[loc.type] || PIN_TYPES.city;
            const isParty = currentLoc?.id === loc.id;
            const isSelected = selectedPin?.id === loc.id;
            const isTravelDest = travelDest?.id === loc.id;
            return (
              <div key={loc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (movingParty) {
                    setTravelDest(loc);
                    return;
                  }
                  if (isDM) {
                    setPendingPin(null);
                    setSelectedPin(isSelected ? null : loc);
                    setPinForm({ name: loc.name, type: loc.type, region: loc.region || '', notes: loc.notes || '' });
                    setEditMode(false);
                  }
                }}
                style={{ position: 'absolute', left: `${loc.x_pct}%`, top: `${loc.y_pct}%`, transform: 'translate(-50%, -100%)', cursor: 'pointer', zIndex: isSelected ? 20 : 10 }}>
                {/* Pin marker */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: isTravelDest ? 22 : isParty ? 20 : 14, filter: isParty ? 'drop-shadow(0 0 6px rgba(200,168,74,0.8))' : isTravelDest ? 'drop-shadow(0 0 6px rgba(121,245,167,0.8))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))', transition: 'all 0.2s' }}>
                    {isParty ? '⚔' : pt.emoji}
                  </div>
                  <div style={{ background: 'rgba(10,8,6,0.85)', border: `1px solid ${isParty ? 'rgba(200,168,74,0.6)' : isTravelDest ? 'rgba(121,245,167,0.6)' : pt.color + '55'}`, borderRadius: 4, padding: '2px 5px', marginTop: 2, whiteSpace: 'nowrap' }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: isParty ? '#e8c84a' : isTravelDest ? '#79f5a7' : pt.color, letterSpacing: '0.06em' }}>{loc.name}</div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ── Pending pin (unconfirmed) ── */}
          {pendingPin && (
            <div style={{ position: 'absolute', left: `${pendingPin.x_pct}%`, top: `${pendingPin.y_pct}%`, transform: 'translate(-50%, -100%)', zIndex: 30, pointerEvents: 'none' }}>
              <div style={{ fontSize: 18, filter: 'drop-shadow(0 0 8px rgba(200,168,74,0.9))' }}>📍</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Pending pin form ── */}
      {isDM && pendingPin && (
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${COLORS.border}`, background: '#100d0a', flexShrink: 0 }}>
          <div style={{ ...label8(), marginBottom: 10, color: '#e8c84a' }}>NEW LOCATION</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={pinForm.name} onChange={e => setPinForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Location name…"
              autoFocus
              style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 12, color: COLORS.text, outline: 'none' }} />
            <select value={pinForm.type} onChange={e => setPinForm(f => ({ ...f, type: e.target.value }))}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
              {Object.entries(PIN_TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {k}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={pinForm.region} onChange={e => setPinForm(f => ({ ...f, region: e.target.value }))}
              placeholder="Region (optional)…"
              style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }} />
          </div>
          <textarea value={pinForm.notes} onChange={e => setPinForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes about this location… (visible to Scribe)"
            rows={2}
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={savePin} disabled={savingPin || !pinForm.name.trim()}
              style={{ flex: 1, background: pinForm.name.trim() ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${pinForm.name.trim() ? 'rgba(200,168,74,0.6)' : COLORS.border}`, borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: pinForm.name.trim() ? '#e8c84a' : COLORS.dim, fontWeight: 700 }}>
              {savingPin ? 'Saving…' : '✦ Commit Location'}
            </button>
            <button onClick={() => setPendingPin(null)}
              style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Selected pin detail / edit ── */}
      {isDM && selectedPin && !pendingPin && (
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${COLORS.border}`, background: '#100d0a', flexShrink: 0 }}>
          {!editMode ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text }}>{selectedPin.name}</div>
                  <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>{PIN_TYPES[selectedPin.type]?.emoji} {selectedPin.type}{selectedPin.region ? ` · ${selectedPin.region}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
                  <button onClick={() => { setEditMode(true); setPinForm({ name: selectedPin.name, type: selectedPin.type, region: selectedPin.region || '', notes: selectedPin.notes || '' }); }}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim, whiteSpace: 'nowrap' }}>Edit</button>
                  <button onClick={() => { setEditMode(true); setPinForm({ name: selectedPin.name, type: selectedPin.type, region: selectedPin.region || '', notes: selectedPin.notes || '' }); showToast('Click the map to reposition this pin.'); }}
                    style={{ background: 'rgba(200,168,74,0.1)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e8c84a', whiteSpace: 'nowrap' }}>↕ Move</button>
                  <button onClick={() => deletePin(selectedPin.id)}
                    style={{ background: 'transparent', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e05a5a', whiteSpace: 'nowrap' }}>Delete</button>
                  <button onClick={() => setSelectedPin(null)}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim }}>✕</button>
                </div>
              </div>
              {selectedPin.notes && <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>{selectedPin.notes}</div>}
              {currentLoc && currentLoc.id !== selectedPin.id && (
                <div style={{ marginTop: 8, fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
                  Distance from party: {calcDistance(currentLoc, selectedPin).toLocaleString()} miles
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ ...label8(), marginBottom: 10, color: '#e8c84a' }}>EDIT LOCATION</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={pinForm.name} onChange={e => setPinForm(f => ({ ...f, name: e.target.value }))}
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 12, color: COLORS.text, outline: 'none' }} />
                <select value={pinForm.type} onChange={e => setPinForm(f => ({ ...f, type: e.target.value }))}
                  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
                  {Object.entries(PIN_TYPES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {k}</option>)}
                </select>
              </div>
              <input value={pinForm.region} onChange={e => setPinForm(f => ({ ...f, region: e.target.value }))}
                placeholder="Region…"
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <textarea value={pinForm.notes} onChange={e => setPinForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={updatePin} disabled={savingPin}
                  style={{ flex: 1, background: 'rgba(200,168,74,0.18)', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a', fontWeight: 700 }}>
                  {savingPin ? 'Saving…' : '✦ Save'}
                </button>
                <button onClick={() => setEditMode(false)}
                  style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Move party: pick destination hint ── */}
      {isDM && movingParty && !travelDest && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid rgba(200,168,74,0.2)`, background: 'rgba(200,168,74,0.04)', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#e8c84a', fontFamily: "'Cinzel', serif", textAlign: 'center' }}>Click a location pin to set travel destination</div>
        </div>
      )}
    </div>
  );
}

export default WorldMapPanel;
