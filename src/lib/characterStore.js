import supabase from './supabase';

// ─── Character data layer (user, 2026-11-17) ─────────────────────────────────
// One place for reading and writing a character's `data` blob. Every write here:
//   • reads the row fresh first, because a player's session rewrites the whole blob and merging into a screen's
//     older copy silently undoes whatever changed since (the cause of "it reverted" bugs);
//   • applies the change to that fresh copy — an object to merge, or a function given the current data that
//     returns the new data (use the function form for anything relative, like spending a token);
//   • asks for the written row back, because with RLS on a blocked update reports success with zero rows.
// Typed columns (race, calling, char_level, stat_*, lean_*, …) are generated from `data` by the database
// (supabase/migrations/20261117_character_slots.sql), so they stay in step with every write made here.

const blobOf = d => (typeof d === 'string' ? JSON.parse(d || '{}') : d) || {};

/** The character's data blob, read fresh. */
export async function readCharacterData(id) {
  const { data: row, error } = await supabase.from('characters').select('data').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error('Character not found.');
  return blobOf(row.data);
}

/**
 * The character as the app uses it: the blob with the row's own fields on top.
 * Same shape every screen already loads: { ...row.data, id, status, campaign_id, user_id }.
 */
export async function loadCharacter(id) {
  const { data: row, error } = await supabase.from('characters').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  return { ...blobOf(row.data), id: row.id, status: row.status, campaign_id: row.campaign_id, user_id: row.user_id };
}

/**
 * Change a character's data safely.
 * @param {string} id
 * @param {object|function} change  fields to merge, or (current) => next data (return null to skip the write)
 * @param {object} [opts]
 * @param {object|function} [opts.columns]  real row columns to write in the same update (e.g. at_current), or
 *                                           (next) => columns, when they depend on the data being written
 * @returns {Promise<object|null>}  the data that was written, or null if the change skipped it
 */
export async function updateCharacterData(id, change, { columns = {} } = {}) {
  const current = await readCharacterData(id);
  const next = typeof change === 'function' ? change(current) : { ...current, ...change };
  if (!next) return null;
  const cols = typeof columns === 'function' ? columns(next) : columns;
  const { data: written, error } = await supabase.from('characters')
    .update({ data: next, ...cols })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!written?.length) throw new Error('Nothing was written: a database policy blocked this update.');
  return next;
}
