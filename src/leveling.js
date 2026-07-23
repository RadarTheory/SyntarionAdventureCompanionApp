export const LEVEL_CAP = 50;

export function apForLevel(level) {
  const safeLevel = Math.max(1, Math.min(LEVEL_CAP, Number(level) || 1));
  return 100 * Math.pow(safeLevel - 1, 2);
}

export function levelForAp(ap) {
  const total = Math.max(0, Number(ap) || 0);
  let level = 1;
  for (let next = 2; next <= LEVEL_CAP; next += 1) {
    if (total < apForLevel(next)) break;
    level = next;
  }
  return level;
}

export function getLevelProgress(ap) {
  const total = Math.max(0, Number(ap) || 0);
  const level = levelForAp(total);
  const current = apForLevel(level);
  const next = level >= LEVEL_CAP ? current : apForLevel(level + 1);
  const span = Math.max(1, next - current);
  const intoLevel = Math.max(0, total - current);
  return {
    level,
    currentLevelAp: current,
    nextLevelAp: next,
    intoLevel,
    neededForNext: Math.max(0, next - total),
    percent: level >= LEVEL_CAP ? 100 : Math.round((intoLevel / span) * 100),
  };
}

export async function grantAp(supabase, { targetType, targetId, amount, reason, sourceType = 'dm', sourceId = null }) {
  const grantAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (!targetType || !targetId || grantAmount <= 0) {
    throw new Error('Choose a target and enter a positive AP amount.');
  }

  const { data, error } = await supabase.rpc('grant_ap', {
    p_target_type: targetType,
    p_target_id: String(targetId),
    p_amount: grantAmount,
    p_reason: reason || null,
    p_source_type: sourceType,
    p_source_id: sourceId ? String(sourceId) : null,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
