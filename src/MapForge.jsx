// The Map Forge panel (DM only; src/lib/forge.js): what lies beyond the exit the party just took.
// 1. The Scribe drafts the place (POI name, region, brief); the DM edits it.
// 2. The forge paints two options; the DM can regenerate with a note.
// 3. Approving one makes it canon: saved, locked to its POI, linked both ways, and the party moves there.
import { useEffect, useState } from 'react';
import { COLORS } from './constants';
import { draftBrief, forgePrompt, forgeImage, referenceFor, readImageFile, approveForged } from './lib/forge';

const gold = '#c8a84a';
const btn = (primary = false, disabled = false) => ({ opacity: disabled ? 0.45 : 1, cursor: disabled ? 'default' : 'pointer', background: primary ? 'rgba(200,168,74,0.18)' : COLORS.card, border: `1px solid ${primary ? gold : COLORS.border}`, borderRadius: 6, padding: '8px 14px', whiteSpace: 'nowrap', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.text });
const field = { width: '100%', boxSizing: 'border-box', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' };
const label = { fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: gold, marginBottom: 5 };

export default function MapForge({ request, onClose, onApproved, saveOriginAmbience }) {
  const { exit, travellers, originKey, mapName, img, ambience, campaignId } = request;
  const [poi, setPoi] = useState('');
  const [region, setRegion] = useState('');
  const [brief, setBrief] = useState('');
  const [note, setNote] = useState('');
  const [drafting, setDrafting] = useState(true);
  const [options, setOptions] = useState([]); // [{ image } | { error }]
  const [forging, setForging] = useState(false);
  const [approving, setApproving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    draftBrief({ campaignId, mapName, scene: ambience?.scene || 'outdoor', exit, travellers })
      .then(d => { if (!live) return; setPoi(d.poi || ''); setRegion(d.region || ''); setBrief(d.brief || ''); })
      .catch(e => { if (live) setError(`The Scribe couldn't draft it (${e.message}). Write the brief yourself.`); })
      .finally(() => { if (live) setDrafting(false); });
    return () => { live = false; };
  }, [campaignId, mapName, ambience?.scene, exit, travellers]);

  const promptText = () => forgePrompt({ brief: note.trim() ? `${brief.trim()} DM's note for this attempt: ${note.trim()}` : brief.trim(), exit });

  const forge = async () => {
    if (!brief.trim()) return;
    setForging(true); setError('');
    setOptions(prev => prev.filter(o => o?.own)); // keep an image the DM brought in
    const images = [referenceFor(img, exit)];
    const prompt = promptText();
    const results = await Promise.all([0, 1].map(() => forgeImage({ prompt, images }).then(image => ({ image })).catch(e => ({ error: e.message }))));
    setOptions(prev => [...prev.filter(o => o?.own), ...results]);
    if (results.every(r => r.error)) setError(results[0].error);
    setForging(false);
  };

  // By hand: paint it in Gemini, ChatGPT or Grok with your own subscription, then bring the image back here.
  const [copied, setCopied] = useState('');
  const flash = what => { setCopied(what); setTimeout(() => setCopied(c => (c === what ? '' : c)), 2200); };
  const handPrompt = () => `${promptText()} Paint it as one landscape image, 3:2 (for example 1536 x 1024). Use the attached image as described.`;
  const copyPrompt = async () => {
    setShownPrompt(handPrompt());
    try { await navigator.clipboard.writeText(handPrompt()); flash('prompt'); } catch { /* the box below shows it to copy by hand */ }
  };
  const [shownPrompt, setShownPrompt] = useState('');
  const refPng = () => new Promise(resolve => {
    const ref = referenceFor(img, exit), im = new Image();
    im.onload = () => { const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; c.getContext('2d').drawImage(im, 0, 0); c.toBlob(resolve, 'image/png'); };
    im.src = `data:${ref.mimeType};base64,${ref.data}`;
  });
  const copyReference = async () => {
    const blob = await refPng();
    try { await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]); flash('reference'); }
    catch { // Some browsers can't copy images: save it instead.
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${(poi || mapName).replace(/[^\w' -]+/g, '')} reference.png`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); flash('saved');
    }
  };
  const useOwnImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const image = await readImageFile(file);
      setError('');
      setOptions(prev => [{ image, own: true }, ...prev.filter(o => o?.image && !o.own)]);
    } catch (err) { setError(err.message); }
  };

  const approve = async (i) => {
    const chosen = options[i];
    if (!chosen?.image || !poi.trim()) { setError('Give the place a name before approving.'); return; }
    setApproving(i); setError('');
    try {
      const done = await approveForged({ image: chosen.image, poi: poi.trim(), region: region.trim(), brief: brief.trim(), originKey, exit, originAmbience: ambience, saveOriginAmbience });
      onApproved(done);
    } catch (e) {
      setError(e.message || 'Could not save the map.');
      setApproving(null);
    }
  };

  return (
    <div role="dialog" aria-label="Map Forge" style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(6,5,4,0.82)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(1100px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: 'linear-gradient(180deg,#171310,#100d0b)', border: `1px solid rgba(200,168,74,0.35)`, borderRadius: 12, padding: 20, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>The Map Forge</div>
          <div style={{ flex: 1, fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {travellers.join(', ') || 'The party'} {travellers.length === 1 ? 'leaves' : 'leave'} {mapName} by the {exit.label}. What lies beyond becomes part of Soteria once you approve it.
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 10, marginBottom: 10 }}>
          <div><div style={label}>Place name (POI)</div><input value={poi} onChange={e => setPoi(e.target.value)} placeholder={drafting ? 'The Scribe is drafting…' : 'e.g. Tarek\'Mor · Flooded Gallery'} style={field} /></div>
          <div><div style={label}>Region</div><input value={region} onChange={e => setRegion(e.target.value)} placeholder="e.g. Corren Range" style={field} /></div>
        </div>
        <div style={label}>What lies beyond</div>
        <textarea value={brief} onChange={e => setBrief(e.target.value)} rows={4} placeholder={drafting ? 'The Scribe is reading the session…' : 'Terrain, structures, light, hazards, where the party arrives.'} style={{ ...field, resize: 'vertical' }} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
          <button onClick={forge} disabled={forging || drafting || !brief.trim()} style={btn(true, forging || drafting || !brief.trim())}>{forging ? 'Forging two options…' : options.some(o => !o?.own) ? '↻ Regenerate' : '⚒ Forge two options'}</button>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note for the next attempt (e.g. narrower, add a rope bridge)" style={{ ...field, flex: 1 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', margin: '-2px 0 12px', padding: '10px 12px', border: `1px dashed ${COLORS.border}`, borderRadius: 8 }}>
          <span style={{ ...label, marginBottom: 0, marginRight: 4 }}>Or paint it yourself</span>
          <button onClick={copyPrompt} disabled={drafting || !brief.trim()} style={btn(false, drafting || !brief.trim())}>{copied === 'prompt' ? '✓ Prompt copied' : '⧉ Copy prompt'}</button>
          <button onClick={copyReference} style={btn(false)}>{copied === 'reference' ? '✓ Image copied' : copied === 'saved' ? '✓ Image saved' : `⧉ Copy ${exit.kind === 'edge' ? 'edge strip' : 'style reference'}`}</button>
          <label style={{ ...btn(true), display: 'inline-block' }}>
            ⬆ Use my own image
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={useOwnImage} style={{ display: 'none' }} />
          </label>
          <span style={{ flex: '1 1 220px', fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            Paste the prompt and the image into Gemini, ChatGPT or Grok, then bring the map back here to approve it.
          </span>
          {shownPrompt && (
            <textarea readOnly value={shownPrompt} rows={4} onFocus={e => e.target.select()} aria-label="The forge prompt"
              style={{ ...field, flexBasis: '100%', resize: 'vertical', fontSize: 11, color: COLORS.textSub }} />
          )}
        </div>
        {error && <div style={{ fontSize: 11, color: COLORS.warn, marginBottom: 10, fontFamily: 'Georgia, serif' }}>{error}</div>}

        {(forging || options.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
            {(forging ? [...options, null, null] : options).map((o, i) => (
              <div key={i} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden', background: '#0b0a09' }}>
                <div style={{ aspectRatio: '3 / 2', display: 'grid', placeItems: 'center', position: 'relative' }}>
                  {o?.image ? <img src={`data:${o.image.mimeType};base64,${o.image.data}`} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <span style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{o?.error ? `This option failed: ${o.error}` : 'Painting…'}</span>}
                  {o?.image && exit.kind === 'edge' && (
                    <div aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', borderStyle: 'dashed', borderColor: 'rgba(236,217,154,0.7)', borderWidth: 0,
                      ...({ e: { left: '22%', top: 0, bottom: 0, borderLeftWidth: 1 }, w: { right: '22%', top: 0, bottom: 0, borderRightWidth: 1 }, n: { bottom: '22%', left: 0, right: 0, borderBottomWidth: 1 }, s: { top: '22%', left: 0, right: 0, borderTopWidth: 1 } })[exit.side] }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10 }}>
                  <span style={{ flex: 1, fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{o?.own ? 'Your image' : `Option ${i + 1 - options.filter(x => x?.own).length}`}{exit.kind === 'edge' ? ' · dashed line: where your map ends' : ''}</span>
                  <button onClick={() => approve(i)} disabled={!o?.image || approving !== null} style={btn(true, !o?.image || approving !== null)}>{approving === i ? 'Making it canon…' : '✦ Approve'}</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Approving locks this place to its name in Soteria and links it to this {exit.label} for every campaign. Nothing reaches players until you approve.
        </div>
      </div>
    </div>
  );
}
