import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import CharacterTokenForge from './CharacterTokenForge';
import { useDevice } from './useDevice';
import { STARTING_AP } from './leveling';
import {
  BS_COMPLICATIONS, pick, ALL_CLASSES, UNAFFILIATED,
  getRaceDisplay,
} from './constants';
import StepStage from './wizard/StepStage';
import { useImageFailed } from './wizard/useImageFailed';
import { versioned } from './wizard/assetVersion';
import './wizard/backstory.css';

// ═════════════════════════════════════════════════════════════════════════════
// STEP BACKSTORY (user, 2026-11-17)
// On the wizard's full-page stage: the character so far on the left (who they are, their faith and calling, and the
// boon their choices earned, locked), the story, campaign hook, token and submission on the right. Saving and
// submitting are exactly as before.
// Props: all from Wizard stepProps
// ═════════════════════════════════════════════════════════════════════════════
const raceIconSrc = (raceId) => raceId ? versioned(`/RaceIcons/${String(raceId).toLowerCase().replace(/[^a-z]/g, '')}.png`) : null;

export default function StepBackstory({
  // Character identity
  fn, ln, age, gender,
  race, rv, pmV,
  beliefType, beliefSub, deity, spirit,
  cp, cid,
  stats,
  portraitUrl,
  // Boon state (generated, read only)
  boonOrigin, boonRole, boonPersonality,
  // Backstory
  backstory, setBackstory,
  // Campaign
  campaign, setCampaign,
  // Build char fn
  buildChar,
  spriteDrafts, setSpriteDrafts,
  selectedSpriteUrl, setSelectedSpriteUrl,
  spriteGenerationCount, setSpriteGenerationCount,
  // Navigation
  goNext, goBack,
  onComplete,
  magicTech = 0, willWhim = 0,
}) {
  const { isMobile } = useDevice();
  const icon = raceIconSrc(race);
  const iconFailed = useImageFailed(icon);

  const [complication, setComplication]   = useState(null);
  const [submitting, setSubmitting]       = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const [submitError, setSubmitError]     = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Pre-fill backstory from boon lines if empty
  useEffect(() => {
    if (!backstory && (boonOrigin || boonRole)) {
      const lines = [boonOrigin, boonRole].filter(Boolean).join('. ');
      setBackstory(lines + '.');
    }
  }, []);

  // Complication pool based on race
  const raceKey = race || 'default';
  const complications = BS_COMPLICATIONS[raceKey] || BS_COMPLICATIONS.default || [];

  const rerollComplication = () => {
    if (complications.length) setComplication(pick(complications));
  };

  // ── SUBMIT TO SCRIBE ──
  const handleSubmit = async (type) => {
    setSubmitting(true);
    setSubmitError(null);
    const status = type === 'oneshot' ? 'awaiting_oneshot' : 'awaiting_adventure';
    try {
      const charData = buildChar();
      const finalChar = {
        ...charData,
        complication: complication || null,
        status,
        submittedAt: Date.now(),
      };

      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('characters')
        .upsert({
          id:          finalChar.id,
          name:        finalChar.name,
          campaign_id: finalChar.campaign || null,
          owner_name:  finalChar.fn,
          status,
          data:        finalChar,
          at_current:  finalChar.atCurrent ?? STARTING_AP,
          at_total:    finalChar.atTotal ?? STARTING_AP,
          atCurrent:   finalChar.atCurrent ?? STARTING_AP,
          atTotal:     finalChar.atTotal ?? STARTING_AP,
          user_id:     user?.id || null,
          player_email: user?.email || null,
          submitted_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Supabase error:', JSON.stringify(error));
        throw error;
      }

      setSubmitted(true);
      setConfirmSubmit(false);
      setTimeout(() => onComplete(finalChar), 2000);

    } catch (err) {
      console.error('Submit error full:', JSON.stringify(err));
      setSubmitError('The archives resisted. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stageProps = {
    back: { label: 'Stats', onClick: goBack },
    next: { label: 'Sheet', onClick: goNext },
    magicTech, willWhim,
  };

  // ── SUBMITTED STATE ──
  if (submitted) {
    return (
      <StepStage {...stageProps} back={null} next={null}>
        <div className="bs-done">
          <h2>Awaiting the Scribe’s approval</h2>
          <div className="wz-lore now"><p>Your character has been submitted. The Scribe will review and deploy you into the campaign. Your sheet remains visible in the meantime.</p></div>
          <small>RETURNING HOME…</small>
        </div>
      </StepStage>
    );
  }

  const name = `${fn || ''} ${ln || ''}`.trim() || 'Unnamed';
  const calling = ALL_CLASSES.find(c => c.id === cid)?.name;
  const faith = beliefType === 'god' ? deity
    : beliefType === 'spirit' ? spirit
    : beliefType === 'unaffiliated' ? (UNAFFILIATED.find(u => u.id === beliefSub)?.label || 'Unaffiliated') : null;
  const faithKind = beliefType === 'god' ? 'Sanctus' : beliefType === 'spirit' ? 'Sacral' : beliefType === 'unaffiliated' ? 'Unaffiliated' : null;

  return (
    <StepStage {...stageProps}>
      <div className="bs">
        {/* ── The character so far ── */}
        <div className="bs-self">
          <div className="wz-caption"><small>AN ADVENTURER BORN</small></div>
          <div className="bs-sigil">
            {portraitUrl
              ? <img className="portrait" src={portraitUrl} alt="" />
              : icon && !iconFailed ? <span className="icon" style={{ '--glyph': `url("${icon}")` }} /> : null}
          </div>
          <h2>{name}</h2>
          <p className="bs-sub">{[getRaceDisplay(race, rv, pmV), age ? `${age} years` : null].filter(Boolean).join(' · ')}</p>
          <dl className="bs-facts">
            {faith && <><dt>FAITH</dt><dd>{faith}{faithKind && faithKind !== faith ? <span style={{ color: '#879581' }}> · {faithKind}</span> : null}</dd></>}
            {calling && <><dt>CALLING</dt><dd>{calling}{cp ? <span style={{ color: '#879581' }}> · {cp === 'magic' ? 'Magic' : 'Tech'}</span> : null}</dd></>}
            {stats && <><dt>STATS</dt><dd>{Object.values(stats).reduce((a, b) => a + (Number(b) || 0), 0)} total</dd></>}
          </dl>

          {(boonOrigin || boonRole || boonPersonality) && (
            <div className="bs-boon">
              <span>CHARACTER BOON <i>⊘ LOCKED</i></span>
              {boonOrigin && <p>{boonOrigin}.</p>}
              {boonRole && <p>{boonRole}.</p>}
              {boonPersonality && (
                <>
                  <p className="trait">{boonPersonality.text}</p>
                  <b>▸ {boonPersonality.boon}</b>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── The story ── */}
        <div className="bs-write">
          <h3>Your backstory</h3>
          <p className="lead">The boon is fixed. It was earned by your choices. The story is yours to write.</p>

          <div className="bs-label"><span>YOUR STORY</span></div>
          <textarea
            className="bs-story"
            value={backstory}
            onChange={e => setBackstory(e.target.value)}
            placeholder="Write your character's backstory. Where did they come from? What drives them? What do they carry?"
            style={{ minHeight: isMobile ? 180 : 220 }}
          />
          <p className="bs-hint">This is your story. Edit freely; the Scribe will read it.</p>

          {complications.length > 0 && (
            <div className="bs-hook">
              <div className="bs-label">
                <span>CAMPAIGN HOOK · OPTIONAL</span>
                <button type="button" className="bs-btn" onClick={rerollComplication}>✦ DRAW A HOOK</button>
              </div>
              {complication ? (
                <div className="wz-lore now" key={complication}>
                  <p>{complication}</p>
                  <button type="button" className="bs-btn" onClick={() => setComplication(null)}>✕ REMOVE</button>
                </div>
              ) : (
                <div className="bs-hook-empty">Draw a campaign hook to give the Scribe a thread to pull.</div>
              )}
            </div>
          )}

          <div className="bs-forge">
            <CharacterTokenForge
              char={buildChar()}
              portraitUrl={portraitUrl}
              drafts={spriteDrafts}
              setDrafts={setSpriteDrafts}
              selectedUrl={selectedSpriteUrl}
              setSelectedUrl={setSelectedSpriteUrl}
              generationCount={spriteGenerationCount}
              setGenerationCount={setSpriteGenerationCount}
            />
          </div>

          {submitError && <p className="bs-error">{submitError}</p>}

          <div className="bs-submit">
            {!confirmSubmit ? (
              <button type="button" className="go" onClick={() => setConfirmSubmit(true)}>📜 SUBMIT TO SCRIBE</button>
            ) : (
              <>
                <em>Submit this character for approval?</em>
                <button type="button" className="go" onClick={() => handleSubmit('campaign')} disabled={submitting}>{submitting ? 'SUBMITTING…' : 'CONFIRM'}</button>
                <button type="button" className="bs-btn" onClick={() => setConfirmSubmit(false)}>CANCEL</button>
              </>
            )}
          </div>
        </div>
      </div>
    </StepStage>
  );
}
