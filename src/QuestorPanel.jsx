import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const TYPE_COLOR = {
  main:   { text: '#e8c84a', border: 'rgba(200,168,74,0.5)', bg: 'rgba(200,168,74,0.08)' },
  side:   { text: COLORS?.magic || '#7B68D8', border: 'rgba(123,104,216,0.4)', bg: 'rgba(123,104,216,0.07)' },
  hidden: { text: '#e05a5a', border: 'rgba(224,90,90,0.3)', bg: 'rgba(224,90,90,0.06)' },
};

const ALL_EIGHT_KEYS = ['spirit','soul','body','essence','will','whim','mind','dream'];

// ─── PLAYER QUESTOR PANEL ─────────────────────────────────────────────────────
export function QuestorPlayerPanel({ char, campaignId, embedded = false }) {
  const [quests, setQuests]         = useState([]);
  const [myQuests, setMyQuests]     = useState([]); // quest_characters rows
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState('board'); // 'board' | 'mine'
  const [expanded, setExpanded]     = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    if (!char?.id) return;
    loadAll();
    const sub = supabase.channel(`questor-player-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quest_characters' }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id, campaignId]);

  const loadAll = async () => {
    setLoading(true);
    const [questsRes, myRes] = await Promise.all([
      supabase.from('quests').select('*').in('visibility', ['public']).eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('quest_characters').select('*, quests(*)').eq('character_id', String(char.id)),
    ]);
    if (questsRes.data) setQuests(questsRes.data);
    if (myRes.data) setMyQuests(myRes.data);
    setLoading(false);
  };

  const pickUpQuest = async (quest) => {
    const already = myQuests.find(q => q.quest_id === quest.id);
    if (already) return;
    await supabase.from('quest_characters').insert({
      quest_id: quest.id,
      character_id: String(char.id),
      character_name: char.name,
      status: 'active',
    });
    await supabase.from('grimoire_entries').insert({
      character_id: String(char.id),
      campaign_id: campaignId,
      type: 'event',
      title: `Quest Accepted — ${quest.title}`,
      content: `${char.name} has taken up the quest: ${quest.title}. ${quest.description || ''}`,
      is_dm: false,
    });
    showToast(`Quest accepted: ${quest.title}`);
    loadAll();
  };

  const containerStyle = embedded ? { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {};

  const allMyQuests = myQuests.map(mq => mq.quests).filter(Boolean);

  return (
    <div style={{ fontFamily: 'Georgia, serif', ...containerStyle }}>
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, background: '#1a1410', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexShrink: 0 }}>
        {[['board', 'Quest Board'], ['mine', `My Quests (${allMyQuests.length})`]].map(([v, lbl]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: view === v ? '#e8c84a' : COLORS.dim }}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Loading…</div>}

        {/* ── QUEST BOARD ── */}
        {!loading && view === 'board' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quests.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No quests posted. Speak to the locals.</div>}
            {quests.map(quest => {
              const tc = TYPE_COLOR[quest.type] || TYPE_COLOR.side;
              const isOpen = expanded === quest.id;
              const taken = myQuests.find(q => q.quest_id === quest.id);
              const steps = quest.steps || [];
              return (
                <div key={quest.id} style={{ border: `1px solid ${tc.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : quest.id)}
                    style={{ width: '100%', background: tc.bg, border: 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}>{quest.title}</div>
                        <div style={{ fontSize: 7, color: tc.text, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', border: `1px solid ${tc.border}`, borderRadius: 3, padding: '1px 5px' }}>{quest.type}</div>
                        {taken && <div style={{ fontSize: 7, color: '#79f5a7', fontFamily: "'Cinzel', serif", border: '1px solid rgba(121,245,167,0.3)', borderRadius: 3, padding: '1px 5px' }}>ACTIVE</div>}
                      </div>
                      {quest.giver_npc_name && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>From: {quest.giver_npc_name}{quest.region ? ` · ${quest.region}` : ''}</div>}
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${tc.border}` }}>
                      {quest.description && <p style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px' }}>{quest.description}</p>}

                      {steps.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ ...label8(), marginBottom: 8 }}>Objectives</div>
                          {steps.map((step, i) => (
                            <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${step.completed ? '#79f5a7' : COLORS.border}`, background: step.completed ? 'rgba(121,245,167,0.15)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step.completed && <div style={{ fontSize: 8, color: '#79f5a7' }}>✓</div>}
                              </div>
                              <div style={{ fontSize: 10, color: step.completed ? COLORS.dim : COLORS.text, fontFamily: 'Georgia, serif', textDecoration: step.completed ? 'line-through' : 'none' }}>{step.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rewards */}
                      <div style={{ background: 'rgba(200,168,74,0.05)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
                        <div style={{ ...label8(), marginBottom: 6, color: '#e8c84a' }}>Rewards</div>
                        {quest.reward_ap > 0 && <div style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>✦ {quest.reward_ap} Ability Points</div>}
                        {quest.reward_item_name && <div style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>⬡ {quest.reward_item_name}</div>}
                        {quest.reward_stat_bonuses && Object.entries(quest.reward_stat_bonuses).some(([,v]) => v > 0) && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                            {Object.entries(quest.reward_stat_bonuses).filter(([,v]) => v > 0).map(([k,v]) => (
                              <div key={k} style={{ fontSize: 8, color: COLORS.magic, fontFamily: "'Cinzel', serif" }}>+{v} {k}</div>
                            ))}
                          </div>
                        )}
                        {quest.reward_notes && <div style={{ fontSize: 9, color: COLORS.dim, fontStyle: 'italic', marginTop: 4 }}>{quest.reward_notes}</div>}
                      </div>

                      {!taken && (
                        <button onClick={() => pickUpQuest(quest)}
                          style={{ width: '100%', background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 7, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText, fontWeight: 700, letterSpacing: '0.1em' }}>
                          ✦ Accept Quest
                        </button>
                      )}
                      {taken && taken.status === 'completed' && (
                        <div style={{ textAlign: 'center', fontSize: 10, color: '#79f5a7', fontFamily: "'Cinzel', serif" }}>✓ Completed</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── MY QUESTS ── */}
        {!loading && view === 'mine' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allMyQuests.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No quests accepted yet.</div>}
            {myQuests.map(mq => {
              const quest = mq.quests;
              if (!quest) return null;
              const tc = TYPE_COLOR[quest.type] || TYPE_COLOR.side;
              const isOpen = expanded === mq.id;
              const steps = quest.steps || [];
              const completedSteps = steps.filter(s => s.completed).length;
              return (
                <div key={mq.id} style={{ border: `1px solid ${mq.status === 'completed' ? 'rgba(121,245,167,0.3)' : tc.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : mq.id)}
                    style={{ width: '100%', background: mq.status === 'completed' ? 'rgba(121,245,167,0.06)' : tc.bg, border: 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, marginBottom: 3 }}>{quest.title}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim }}>
                        {steps.length > 0 ? `${completedSteps}/${steps.length} objectives` : 'No objectives set'}
                        {mq.status === 'completed' && ' · Completed'}
                      </div>
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${tc.border}` }}>
                      {quest.description && <p style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px' }}>{quest.description}</p>}
                      {steps.length > 0 && (
                        <div>
                          <div style={{ ...label8(), marginBottom: 8 }}>Objectives</div>
                          {steps.map((step, i) => (
                            <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${step.completed ? '#79f5a7' : COLORS.border}`, background: step.completed ? 'rgba(121,245,167,0.15)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {step.completed && <div style={{ fontSize: 8, color: '#79f5a7' }}>✓</div>}
                              </div>
                              <div style={{ fontSize: 10, color: step.completed ? COLORS.dim : COLORS.text, fontFamily: 'Georgia, serif', textDecoration: step.completed ? 'line-through' : 'none' }}>{step.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DM QUESTOR PANEL ─────────────────────────────────────────────────────────
export function QuestorDMPanel({ campaignId, onClose }) {
  const [view, setView]         = useState('board');  // 'board' | 'new'
  const [quests, setQuests]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [npcs, setNpcs]         = useState([]);

  const EMPTY_QUEST = {
    title: '', description: '', type: 'side', visibility: 'public',
    campaign_id: campaignId, giver_npc_id: '', giver_npc_name: '', region: '',
    steps: [],
    reward_ap: 0, reward_stat_bonuses: {}, reward_item_name: '', reward_item_desc: '', reward_notes: '',
  };
  const [draft, setDraft]     = useState(EMPTY_QUEST);
  const [newStep, setNewStep] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    loadAll();
    const sub = supabase.channel(`questor-dm-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quests' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quest_characters' }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const loadAll = async () => {
    setLoading(true);
    const [questsRes, npcRes] = await Promise.all([
      supabase.from('quests').select('*, quest_characters(*)').order('created_at', { ascending: false }),
      supabase.from('npcs').select('id, name, role'),
    ]);
    if (questsRes.data) setQuests(questsRes.data);
    if (npcRes.data) setNpcs(npcRes.data);
    setLoading(false);
  };

  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setRewardBonus = (k, v) => setDraft(d => ({ ...d, reward_stat_bonuses: { ...d.reward_stat_bonuses, [k]: Number(v) } }));

  const addStep = () => {
    if (!newStep.trim()) return;
    setDraft(d => ({ ...d, steps: [...d.steps, { id: Date.now(), label: newStep.trim(), completed: false }] }));
    setNewStep('');
  };

  const removeStep = (id) => setDraft(d => ({ ...d, steps: d.steps.filter(s => s.id !== id) }));

  const saveQuest = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('quests').insert({
      ...draft,
      reward_ap: Number(draft.reward_ap) || 0,
      campaign_id: campaignId,
    });
    setSaving(false);
    if (!error) {
      showToast(`Quest created: ${draft.title}`);
      setDraft(EMPTY_QUEST);
      setView('board');
      loadAll();
    }
  };

  const toggleStep = async (quest, stepId) => {
    const steps = quest.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed, completed_at: !s.completed ? new Date().toISOString() : null } : s);
    await supabase.from('quests').update({ steps }).eq('id', quest.id);

    // Check if all steps complete — offer to complete quest
    const allDone = steps.every(s => s.completed);
    if (allDone) {
      showToast('All objectives complete — mark quest as completed to award rewards.');
    }
    loadAll();
  };

  const completeQuest = async (quest) => {
    setSaving(true);
    await supabase.from('quests').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', quest.id);

    // Award rewards to all characters on this quest
    const chars = quest.quest_characters || [];
    for (const qc of chars) {
      if (qc.status === 'completed') continue;

      // AP reward
      if (quest.reward_ap > 0) {
        const { data: charRow } = await supabase.from('characters').select('data').eq('id', qc.character_id).single();
        if (charRow) {
          let d = {};
          try { d = typeof charRow.data === 'string' ? JSON.parse(charRow.data) : charRow.data; } catch (_) {}
          const newAP = (d.apCurrent || 0) + quest.reward_ap;
          await supabase.from('characters').update({ data: { ...d, apCurrent: newAP } }).eq('id', qc.character_id);
        }
      }

      // Item reward
      if (quest.reward_item_name) {
        await supabase.from('character_items').insert({
          character_id: qc.character_id,
          slot: `pack__${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          name: quest.reward_item_name,
          description: `Misc|${quest.reward_item_desc || 'Quest reward'}`,
          attuned: false, bonuses: {}, weight: 1,
        });
      }

      // Mark quest_characters completed
      await supabase.from('quest_characters').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', qc.id);

      // Grimoire entry
      await supabase.from('grimoire_entries').insert({
        character_id: qc.character_id,
        campaign_id: campaignId,
        type: 'event',
        title: `Quest Completed — ${quest.title}`,
        content: `${qc.character_name} completed the quest: ${quest.title}.${quest.reward_ap > 0 ? ` Awarded ${quest.reward_ap} Ability Points.` : ''}${quest.reward_item_name ? ` Received: ${quest.reward_item_name}.` : ''}${quest.reward_notes ? ` ${quest.reward_notes}` : ''}`,
        is_dm: false,
        architect_note: `Quest completed by The Architect. Rewards disbursed.`,
      });

      // Message
      await supabase.from('messages').insert({
        type: 'dm', is_dm: true, sender_name: 'The Architect',
        character_id: qc.character_id,
        campaign_id: campaignId,
        content: `**Quest Complete: ${quest.title}**\n\nRewards:\n${quest.reward_ap > 0 ? `• ${quest.reward_ap} Ability Points added\n` : ''}${quest.reward_item_name ? `• ${quest.reward_item_name} added to pack\n` : ''}${quest.reward_notes || ''}`,
        session_id: null,
      });
    }

    setSaving(false);
    showToast(`Quest completed — rewards disbursed.`);
    loadAll();
  };

  const archiveQuest = async (questId) => {
    await supabase.from('quests').update({ status: 'archived' }).eq('id', questId);
    loadAll();
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 500, maxHeight: '85vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500000, background: '#1a1410', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(200,168,74,0.15)', background: 'rgba(200,168,74,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.16em', fontWeight: 700 }}>QUESTOR</div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Quest Board · Architect View</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['board', 'All Quests'], ['new', '+ New Quest']].map(([v, lbl]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: view === v ? '#e8c84a' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Loading…</div>}

        {/* ── QUEST BOARD ── */}
        {!loading && view === 'board' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quests.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No quests created yet.</div>}
            {quests.map(quest => {
              const tc = TYPE_COLOR[quest.type] || TYPE_COLOR.side;
              const isOpen = expanded === quest.id;
              const steps = quest.steps || [];
              const completedSteps = steps.filter(s => s.completed).length;
              const chars = quest.quest_characters || [];
              const allStepsDone = steps.length > 0 && completedSteps === steps.length;
              return (
                <div key={quest.id} style={{ border: `1px solid ${quest.status === 'completed' ? 'rgba(121,245,167,0.3)' : tc.border}`, borderRadius: 8, overflow: 'hidden', opacity: quest.status === 'archived' ? 0.5 : 1 }}>
                  <button onClick={() => setExpanded(isOpen ? null : quest.id)}
                    style={{ width: '100%', background: quest.status === 'completed' ? 'rgba(121,245,167,0.06)' : tc.bg, border: 'none', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{quest.title}</div>
                        <div style={{ fontSize: 7, color: tc.text, fontFamily: "'Cinzel', serif", border: `1px solid ${tc.border}`, borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>{quest.type}</div>
                        <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '1px 5px' }}>{quest.visibility}</div>
                        {quest.status !== 'active' && <div style={{ fontSize: 7, color: '#79f5a7', fontFamily: "'Cinzel', serif", border: '1px solid rgba(121,245,167,0.3)', borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase' }}>{quest.status}</div>}
                      </div>
                      <div style={{ fontSize: 8, color: COLORS.dim }}>{chars.length} character{chars.length !== 1 ? 's' : ''} · {steps.length > 0 ? `${completedSteps}/${steps.length} steps` : 'No steps'}</div>
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</div>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${tc.border}` }}>
                      {quest.description && <p style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6, margin: '0 0 12px' }}>{quest.description}</p>}

                      {/* Steps */}
                      {steps.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ ...label8(), marginBottom: 8 }}>Objectives</div>
                          {steps.map((step, i) => (
                            <div key={step.id || i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                              <button onClick={() => toggleStep(quest, step.id)}
                                style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${step.completed ? '#79f5a7' : COLORS.border}`, background: step.completed ? 'rgba(121,245,167,0.2)' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                {step.completed && <div style={{ fontSize: 8, color: '#79f5a7' }}>✓</div>}
                              </button>
                              <div style={{ fontSize: 10, color: step.completed ? COLORS.dim : COLORS.text, fontFamily: 'Georgia, serif', textDecoration: step.completed ? 'line-through' : 'none', flex: 1 }}>{step.label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Characters */}
                      {chars.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ ...label8(), marginBottom: 6 }}>Characters on Quest</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {chars.map(c => (
                              <div key={c.id} style={{ fontSize: 8, color: c.status === 'completed' ? '#79f5a7' : COLORS.text, fontFamily: "'Cinzel', serif", background: COLORS.card, border: `1px solid ${c.status === 'completed' ? 'rgba(121,245,167,0.3)' : COLORS.border}`, borderRadius: 4, padding: '2px 7px' }}>
                                {c.character_name}{c.status === 'completed' ? ' ✓' : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rewards summary */}
                      <div style={{ background: 'rgba(200,168,74,0.05)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 6, padding: '8px 10px', marginBottom: 12 }}>
                        <div style={{ ...label8(), marginBottom: 4, color: '#e8c84a' }}>Rewards</div>
                        {quest.reward_ap > 0 && <div style={{ fontSize: 9, color: COLORS.text }}>✦ {quest.reward_ap} AP</div>}
                        {quest.reward_item_name && <div style={{ fontSize: 9, color: COLORS.text }}>⬡ {quest.reward_item_name}</div>}
                        {quest.reward_stat_bonuses && Object.entries(quest.reward_stat_bonuses).some(([,v]) => v > 0) && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                            {Object.entries(quest.reward_stat_bonuses).filter(([,v]) => v > 0).map(([k,v]) => (
                              <div key={k} style={{ fontSize: 8, color: COLORS.magic, fontFamily: "'Cinzel', serif" }}>+{v} {k}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {quest.status === 'active' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {chars.length > 0 && (
                            <button onClick={() => completeQuest(quest)} disabled={saving}
                              style={{ flex: 1, background: allStepsDone ? 'rgba(121,245,167,0.14)' : 'rgba(200,168,74,0.10)', border: `1px solid ${allStepsDone ? 'rgba(121,245,167,0.5)' : 'rgba(200,168,74,0.35)'}`, borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: allStepsDone ? '#79f5a7' : '#e8c84a', fontWeight: 700 }}>
                              ✦ Complete & Award
                            </button>
                          )}
                          <button onClick={() => archiveQuest(quest.id)}
                            style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim }}>
                            Archive
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── NEW QUEST ── */}
        {!loading && view === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ ...label8(), marginBottom: 6 }}>Title *</div>
              <input value={draft.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. The Missing Miners of Corren"
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', fontSize: 12, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Type</div>
                <select value={draft.type} onChange={e => set('type', e.target.value)}
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
                  <option value="main">Main</option>
                  <option value="side">Side</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Visibility</div>
                <select value={draft.visibility} onChange={e => set('visibility', e.target.value)}
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
                  <option value="public">Public Board</option>
                  <option value="discoverable">Discoverable</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Region</div>
                <input value={draft.region} onChange={e => set('region', e.target.value)}
                  placeholder="e.g. Corren"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div>
              <div style={{ ...label8(), marginBottom: 6 }}>Quest Giver NPC</div>
              <select value={draft.giver_npc_id} onChange={e => {
                const npc = npcs.find(n => n.id === e.target.value);
                set('giver_npc_id', e.target.value);
                set('giver_npc_name', npc?.name || '');
              }}
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }}>
                <option value="">None / Anonymous</option>
                {npcs.map(n => <option key={n.id} value={n.id}>{n.name}{n.role ? ` — ${n.role}` : ''}</option>)}
              </select>
            </div>

            <div>
              <div style={{ ...label8(), marginBottom: 6 }}>Description</div>
              <textarea value={draft.description} onChange={e => set('description', e.target.value)}
                rows={3} placeholder="Quest lore, context, what's needed…"
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            {/* Steps */}
            <div>
              <div style={{ ...label8(), marginBottom: 8 }}>Objectives / Steps</div>
              {draft.steps.map((step, i) => (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ fontSize: 9, color: COLORS.dim, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}.</div>
                  <div style={{ flex: 1, fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 8px' }}>{step.label}</div>
                  <button onClick={() => removeStep(step.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e05a5a', fontSize: 12 }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={newStep} onChange={e => setNewStep(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStep()}
                  placeholder="Add an objective…"
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }} />
                <button onClick={addStep} style={{ background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 5, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a' }}>+ Add</button>
              </div>
            </div>

            {/* Rewards */}
            <div style={{ background: 'rgba(200,168,74,0.04)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...label8(), marginBottom: 12, color: '#e8c84a' }}>Rewards on Completion</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ ...label8(), marginBottom: 5 }}>Ability Points</div>
                  <input type="number" min={0} value={draft.reward_ap} onChange={e => set('reward_ap', e.target.value)}
                    style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: COLORS.text, outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ ...label8(), marginBottom: 5 }}>Item Reward</div>
                  <input value={draft.reward_item_name} onChange={e => set('reward_item_name', e.target.value)}
                    placeholder="Item name…"
                    style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ ...label8(), marginBottom: 8 }}>Stat Bonuses</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                {ALL_EIGHT_KEYS.map(k => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.muted, width: 54, textTransform: 'capitalize' }}>{k}</div>
                    <input type="number" min={0} value={draft.reward_stat_bonuses[k] || 0} onChange={e => setRewardBonus(k, e.target.value)}
                      style={{ width: 48, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                  </div>
                ))}
              </div>
              <div>
                <div style={{ ...label8(), marginBottom: 5 }}>Reward Notes</div>
                <input value={draft.reward_notes} onChange={e => set('reward_notes', e.target.value)}
                  placeholder="Additional reward details…"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <button onClick={saveQuest} disabled={saving || !draft.title.trim()}
              style={{ width: '100%', background: draft.title.trim() ? COLORS.magicBg : 'transparent', border: `1px solid ${draft.title.trim() ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '11px', cursor: draft.title.trim() ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: draft.title.trim() ? COLORS.magicText : COLORS.dim, fontWeight: 700, letterSpacing: '0.1em' }}>
              {saving ? 'Creating…' : '✦ Create Quest'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestorPlayerPanel;
