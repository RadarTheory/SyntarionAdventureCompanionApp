// The Abilities tab: the Syntarion constellation (source in constellation/, copied to public/constellation/ by
// vite.config.js) runs in an iframe in host mode and the character owns the build.
//
// - The build is the list of constellation unlock ids in data.abilities.
// - AP (stored in at_current / "atCurrent" / data.atCurrent, the columns the leveling RPC grants into) is spent
//   instantly; there is no DM approval step (user decision, 2026-11-15).
// - The constellation reports each change as a spend delta and a Magic | Tech delta, so a grant that lands while the
//   tab is open is never overwritten and the lean a character got at creation is kept.
// - Characters still holding abilities from the old tree (keys like "divine|t2|Cleric|Benediction") are cleared once,
//   with their AP refunded and their slider nudges reversed.
import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { loadConstellation, startingCallingOf, startingNodeId, startingCost } from './constellationAbilities';
// The old tree's costs and Magic | Tech nudges (AbilityTree.jsx), needed only to refund an old build.
const OLD_MAGIC_PATHS = new Set(['divine', 'spiritual', 'arcane', 'wild', 'runic', 'mythic', 'shadow']);
const tierCost = tier => (tier === 'base' ? 0 : tier === 't2' ? 2 : 3);
const sliderNudge = pathId => (OLD_MAGIC_PATHS.has(pathId) ? -0.25 : 0.25);

const SRC = '/constellation/index.html?host=syntarion';
const isOldKey = key => typeof key === 'string' && key.includes('|');
const clampAxis = v => Math.max(-4, Math.min(4, Math.round(v * 100) / 100));

const apOf = (row, data) => Math.max(0, Number(row?.at_current ?? row?.atCurrent ?? data?.atCurrent ?? data?.at_current ?? 0) || 0);

const OLD_FIELDS = ['abilities', 'ability_pending', 'ability_overrides'];

// Reads the character fresh so concurrent grants and edits are kept, applies `change`, and writes it back.
// `columns` are extra top-level columns to write, only ever ones the row already has.
async function updateCharacter(id, change) {
  const { data: row, error } = await supabase.from('characters').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error('Character not found.');
  const data = row.data || {};
  const result = change({ row, data, ap: apOf(row, data) });
  if (!result) return null;
  const { ap, fields, columns = {} } = result;
  const nextData = { ...data, ...fields, atCurrent: ap, at_current: ap };
  const apColumns = Object.fromEntries(['at_current', 'atCurrent'].filter(k => k in row).map(k => [k, ap]));
  const { error: saveError } = await supabase.from('characters')
    .update({ data: nextData, ...apColumns, ...columns })
    .eq('id', id);
  if (saveError) throw saveError;
  return nextData;
}

// Old-tree abilities come back as AP; DM overrides were free, so they are cleared without a refund.
function oldBuildRefund(row, data) {
  const list = (...names) => [...new Set(names.flatMap(n => [...(Array.isArray(row?.[n]) ? row[n] : []), ...(Array.isArray(data?.[n]) ? data[n] : [])]))].filter(isOldKey);
  const bought = list('abilities', 'ability_pending', 'abilityPending');
  const granted = list('ability_overrides', 'abilityOverrides').filter(k => !bought.includes(k));
  const refund = bought.reduce((sum, key) => sum + tierCost(key.split('|')[1]), 0);
  const nudge = [...bought, ...granted].reduce((sum, key) => sum + sliderNudge(key.split('|')[0]), 0);
  return { count: bought.length + granted.length, refund, nudge };
}

export default function ConstellationTab({ char, onUpdateChar }) {
  const frame = useRef(null);
  const charRef = useRef(char);
  const queue = useRef(Promise.resolve());
  const [notice, setNotice] = useState(null);
  const [ready, setReady] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => { charRef.current = char; }, [char]);

  const learnedOf = c => (Array.isArray(c.abilities) ? c.abilities : []).filter(key => !isOldKey(key));
  const sendInit = useCallback(() => {
    const c = charRef.current;
    frame.current?.contentWindow?.postMessage({
      type: 'init',
      learned: learnedOf(c),
      available: Math.max(0, Number(c.atCurrent ?? c.at_current ?? 0) || 0),
      characterId: c.id,
      startingCalling: startingCallingOf(c),
    }, window.location.origin);
  }, []);

  // One-time reset and refund of an old-tree build, before the constellation opens.
  useEffect(() => {
    if (migrated || !char?.id) return;
    let cancelled = false;
    (async () => {
      try {
        let summary = null;
        const nextData = await updateCharacter(char.id, ({ row, data, ap }) => {
          summary = oldBuildRefund(row, data);
          if (!summary.count) return null;
          const sliders = { ...(data.sliders || {}), magicTech: clampAxis((data.sliders?.magicTech || 0) - summary.nudge) };
          return {
            ap: ap + summary.refund,
            fields: { abilities: (data.abilities || []).filter(k => !isOldKey(k)), ability_pending: [], ability_overrides: [], abilityPending: [], abilityOverrides: [], sliders },
            columns: Object.fromEntries(OLD_FIELDS.filter(k => Array.isArray(row[k])).map(k => [k, row[k].filter(v => !isOldKey(v))])),
          };
        });
        if (cancelled) return;
        let current = nextData ? { ...charRef.current, ...nextData } : charRef.current;
        // The class declared at creation is opened as the character's first purchase, at its normal price, on a fresh build.
        // With too little AP it waits for the first points to arrive. Once opened, or once the player buys anything else, the flag
        // keeps a later reset or refund from buying it again: after that, every choice is the player's.
        try {
          const d = await loadConstellation();
          const start = startingNodeId(d, current);
          if (start) {
            const cost = startingCost(d, start);
            const withStart = await updateCharacter(char.id, ({ data, ap }) => {
              if (data.constellationStart) return null;
              const held = (Array.isArray(data.abilities) ? data.abilities : []).filter(k => !isOldKey(k));
              if (held.length === 0 && ap < cost) return null;
              const open = held.length === 0;
              return { ap: open ? ap - cost : ap, fields: { constellationStart: true, ...(open ? { abilities: [start] } : {}) } };
            });
            if (withStart) current = { ...current, ...withStart };
          }
        } catch { /* the declared class is still highlighted; it just was not opened */ }
        if (cancelled) return;
        if (current !== charRef.current) onUpdateChar?.(current);
        if (summary?.count) setNotice({ type: 'ok', msg: `Your earlier abilities were cleared for the new constellation · ${summary.refund} AP returned.` });
        setMigrated(true);
      } catch (e) {
        if (!cancelled) setNotice({ type: 'error', msg: e.message || 'Could not prepare your abilities.' });
      }
    })();
    return () => { cancelled = true; };
  }, [migrated, char?.id, onUpdateChar]);

  // Messages from the constellation: 'ready' asks for the build, 'save' reports a change to it.
  useEffect(() => {
    if (!migrated) return undefined;
    const onMessage = e => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const msg = e.data || {};
      if (msg.type === 'ready') { setReady(true); sendInit(); return; }
      if (msg.type !== 'save' || !Array.isArray(msg.learned)) return;
      const spentDelta = Number(msg.spentDelta) || 0, axisDelta = Number(msg.magicTechDelta) || 0;
      // Saves run one after another so quick purchases never race each other.
      queue.current = queue.current.then(async () => {
        try {
          const nextData = await updateCharacter(charRef.current.id, ({ data, ap }) => ({
            ap: Math.max(0, ap - spentDelta),
            fields: {
              abilities: msg.learned.filter(k => typeof k === 'string' && !isOldKey(k)),
              sliders: { ...(data.sliders || {}), magicTech: clampAxis((data.sliders?.magicTech || 0) + axisDelta) },
            },
          }));
          const next = { ...charRef.current, ...nextData };
          charRef.current = next;
          onUpdateChar?.(next);
        } catch (err) {
          setNotice({ type: 'error', msg: `${err.message || 'Save failed.'} Reopen the tab to reload your build.` });
        }
      });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [migrated, sendInit, onUpdateChar]);

  // A grant from elsewhere (the DM levelling the character) reaches the open constellation.
  const available = char.atCurrent ?? char.at_current ?? 0;
  useEffect(() => { if (ready) sendInit(); }, [available, ready, sendInit]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {notice && (
        <div role="status" style={{ margin: '10px 16px 0', padding: '8px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'Georgia, serif', background: notice.type === 'error' ? '#c0503018' : COLORS.card, color: notice.type === 'error' ? '#e0866a' : COLORS.textSub, border: `1px solid ${notice.type === 'error' ? '#c0503055' : COLORS.border}` }}>
          {notice.msg}
        </div>
      )}
      {migrated ? (
        <iframe
          ref={frame}
          src={SRC}
          title="The Constellation"
          style={{ flex: 1, width: '100%', minHeight: 0, border: 0, display: 'block', background: '#0c100f' }}
        />
      ) : (
        <div style={{ padding: 24, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>Preparing your abilities…</div>
      )}
    </div>
  );
}
