import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import {
  COLORS, BS_COMPLICATIONS, BS_ORIGINS, BS_ROLE, BS_PERSONALITY, pick,
} from './constants';

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase        = createClient(supabaseUrl, supabaseAnonKey);

// ─── SHARED BUTTON STYLE ──────────────────────────────────────────────────────
const genBtnStyle = {
  background: 'transparent',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  padding: '4px 8px',
  cursor: 'pointer',
  fontFamily: "'Cinzel', serif",
  fontSize: 10,
  color: COLORS.muted,
  marginLeft: 10,
  flexShrink: 0,
};

// ═════════════════════════════════════════════════════════════════════════════
// STEP BACKSTORY
// ═════════════════════════════════════════════════════════════════════════════
export default function StepBackstory({
  setBoonOrigin, setBoonRole, setBoonPersonality,
  fn, ln, age, gender,
  race, rv, pmV,
  beliefType, beliefSub, deity, spirit,
  cp, cid,
  stats,
  boonOrigin, boonRole, boonPersonality,
  backstory, setBackstory,
  campaign, setCampaign,
  buildChar,
  goNext, goBack,
  onComplete,
}) {
  const { isMobile } = useDevice();

  const [complication, setComplication]   = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [submitError, setSubmitError]     = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const raceKey       = race || 'default';
  const complications = BS_COMPLICATIONS[raceKey] || BS_COMPLICATIONS.default || [];

  const rerollComplication = () => {
    if (complications.length) setComplication(pick(complications));
  };

  const getRoles        = () => cp === 'magic' ? BS_ROLE.magic        : cp === 'tech' ? BS_ROLE.tech        : BS_ROLE.any;
  const getPersonalities = () => cp === 'magic' ? BS_PERSONALITY.magic : cp === 'tech' ? BS_PERSONALITY.tech : BS_PERSONALITY.any;

  // ── SUBMIT ──
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const charData  = buildChar();
      const finalChar = {
        ...charData,
        complication: complication || null,
        status: 'awaiting_adventure',
        submittedAt: Date.now(),
      };

      const { error } = await supabase.from('characters').upsert({
        id:          finalChar.id,
        name:        finalChar.name,
        campaign_id: finalChar.campaign || null,
        owner_name:  finalChar.fn,
        user_id:     finalChar.userId || null,  // ← add this
        status:      'awaiting_adventure',
        data:        finalChar,
      });

      const { error: upsertError } = await supabase.from('characters').upsert({
        id:          finalChar.id,
        name:        finalChar.name,
        campaign_id: finalChar.campaign || null,
        owner_name:  finalChar.fn,
        status:      'awaiting_adventure',
        data:        finalChar,
      });

      if (upsertError) throw upsertError;
      setSubmitted(true);
      setConfirmSubmit(false);
      setTimeout(() => onComplete(finalChar), 2000);
    } catch (err) {
      console.error('Submit error:', err.message);
      setSubmitError('The archives resisted. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUBMITTED STATE ──
  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📜</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 20, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
          Awaiting the Scribe's Approval
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7, maxWidth: 400 }}>
          Your character has been submitted. The Scribe will review and deploy you into the campaign.
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
          Returning to home…
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>

      {/* Title */}
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 18 : 22, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em', marginBottom: 4 }}>
        Adventurer Backstory
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6 }}>
        Shape your story. The Scribe will read what you leave behind.
      </div>

      {/* ── CHARACTER FORMING — individual generate buttons ── */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px 18px', marginBottom: 20 }}>
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif", marginBottom: 12 }}>
          Character Forming
        </div>

        {/* Origin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75, margin: 0, flex: 1 }}>
            {boonOrigin || <span style={{ color: COLORS.dim }}>No origin yet — generate one.</span>}
          </p>
          <button
            onClick={() => setBoonOrigin(pick(BS_ORIGINS[raceKey] || BS_ORIGINS.default))}
            style={genBtnStyle}
          >✦</button>
        </div>

        {/* Role */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75, margin: 0, flex: 1 }}>
            {boonRole || <span style={{ color: COLORS.dim }}>No role yet — generate one.</span>}
          </p>
          <button
            onClick={() => setBoonRole(pick(getRoles()))}
            style={genBtnStyle}
          >✦</button>
        </div>

        {/* Personality + Boon */}
        <div style={{ paddingTop: 10, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <p style={{ fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.75, margin: 0, flex: 1 }}>
              {boonPersonality?.text || <span style={{ color: COLORS.dim }}>No personality yet — generate one.</span>}
            </p>
            <button
              onClick={() => setBoonPersonality(pick(getPersonalities()))}
              style={genBtnStyle}
            >✦</button>
          </div>
          {boonPersonality?.boon && (
            <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: COLORS.magicText, fontFamily: "'Cinzel', serif", background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '3px 10px' }}>
              ▸ {boonPersonality.boon}
            </div>
          )}
        </div>
      </div>

      {/* ── YOUR STORY ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>
            Your story
          </div>
          <button
            onClick={() => {
              const newOrigin = pick(BS_ORIGINS[raceKey] || BS_ORIGINS.default);
              const newRole   = pick(getRoles());
              const newPersonality = pick(getPersonalities());
              setBoonOrigin(newOrigin);
              setBoonRole(newRole);
              setBoonPersonality(newPersonality);
              setBackstory(`${newOrigin}. ${newRole}.`);
            }}
            style={{ ...genBtnStyle, padding: '4px 10px', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >✦ Generate </button>
        </div>
        <textarea
          value={backstory}
          onChange={e => setBackstory(e.target.value)}
          placeholder="Write your character's backstory. Where did they come from? What drives them? What do they carry?"
          style={{
            width: '100%', minHeight: 160,
            background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 8, padding: '12px 14px',
            color: COLORS.text, fontSize: 13,
            fontFamily: 'Georgia, serif', lineHeight: 1.75,
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
        />
        <div style={{ marginTop: 6, fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          This is your story. Edit freely — the Scribe will read it.
        </div>
      </div>

      {/* ── CAMPAIGN HOOK ── */}
      {complications.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>
              Campaign hook (optional)
            </div>
            <button onClick={rerollComplication} style={{ ...genBtnStyle, padding: '4px 10px', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ✦ Draw a hook
            </button>
          </div>

          {complication ? (
            <div
              onClick={() => setComplication(null)}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.borderMid}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}
            >
              <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.7, margin: 0, flex: 1 }}>
                {complication}
              </p>
              <span style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", flexShrink: 0, marginTop: 2 }}>✕ Remove</span>
            </div>
          ) : (
            <div style={{ padding: '12px 14px', border: `1px dashed ${COLORS.border}`, borderRadius: 8, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              Draw a campaign hook to give the Scribe a thread to pull.
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT ERROR ── */}
      {submitError && (
        <div style={{ marginBottom: 16, padding: '10px 14px', background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 8, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {submitError}
        </div>
      )}

      {/* ── NAVIGATION + SUBMIT ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, gap: 10, flexWrap: 'wrap' }}>
        <button onClick={goBack} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '10px 20px', color: COLORS.muted, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          ← Stats
        </button>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={goNext} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '10px 20px', color: COLORS.muted, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            View Sheet →
          </button>

          {!confirmSubmit ? (
            <button onClick={() => setConfirmSubmit(true)} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 4, padding: '10px 24px', color: COLORS.deityText, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
              📜 Submit to Scribe
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 4, padding: '8px 14px' }}>
              <span style={{ fontSize: 10, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Submit this character for approval?
              </span>
              <button onClick={handleSubmit} disabled={submitting} style={{ background: COLORS.deity, border: 'none', borderRadius: 4, padding: '5px 14px', cursor: submitting ? 'default' : 'pointer', color: '#fff', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmSubmit(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '5px 10px', cursor: 'pointer', color: COLORS.muted, fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}