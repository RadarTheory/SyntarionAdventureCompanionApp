import { useEffect, useRef, useState } from 'react';
import { AstragalRoller } from './Astragal';
import DiceDesigner from './DiceDesigner';
import { loadFinishes, saveFinishes } from './lib/diceFinishStore.js';
import { loadOfficialFinishes, readFinishFile } from './lib/diceFinishBundle.js';
import './diceDesigner.css';

export default function AdminDice() {
  const [local, setLocal] = useState({});
  const [official, setOfficial] = useState({});
  const [draft, setDraft] = useState(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    loadFinishes().then(finishes => {
      if (!active) return;
      setLocal(finishes ?? {});
      setReady(true);
    }).catch(() => { if (active) setError('Could not open the local dice library.'); });
    loadOfficialFinishes().then(finishes => {
      if (active) setOfficial(finishes);
    }).catch(() => { if (active) setError('Could not load the official dice library.'); });
    return () => { active = false; };
  }, []);

  async function save(finish) {
    if (!ready || busy.current) throw new Error('The dice library is busy. Try again.');
    busy.current = true;
    try {
      const next = { ...local, [`custom-${crypto.randomUUID()}`]: finish };
      await saveFinishes(next);
      setLocal(next);
    } finally { busy.current = false; }
  }

  async function importFinishes(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !ready || busy.current) return;
    busy.current = true;
    setError('');
    setMessage('');
    try {
      const incoming = await readFinishFile(file);
      const additions = Object.entries(incoming).filter(([id]) => !Object.hasOwn(local, id) && !Object.hasOwn(official, id));
      const next = { ...local, ...Object.fromEntries(additions) };
      await saveFinishes(next);
      setLocal(next);
      setMessage(`Imported ${additions.length} finishes into this browser.`);
    } catch (failure) {
      setError(failure.message || 'Could not import the finishes.');
    } finally { busy.current = false; }
  }

  const designs = { ...local, ...official };
  return <section style={{ maxWidth: 980, padding: 16 }}>
    <h2>Astragal Dice</h2>
    <label>
      Import a workshop export{' '}
      <input type="file" accept=".json,application/json" onChange={importFinishes} disabled={!ready} />
    </label>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <p>{Object.keys(official).length} official · {Object.keys(local).length} saved on this browser</p>
    {ready && <DiceDesigner isAdmin onPreview={finish => setDraft({ ...finish, name: `${finish.name} (draft)` })} onPublish={save} />}
    <h3>Test roll</h3>
    <AstragalRoller customFinishes={{ ...designs, ...(draft ? { draft } : {}) }} preferredSkin={draft ? 'draft' : null} />
    {draft && <button type="button" onClick={() => setDraft(null)}>Choose a saved finish</button>}
  </section>;
}
