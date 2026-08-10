// Declutter crowded map tokens WITHOUT moving them.
//
// Battlefield positioning is exact in this game, so we never displace a token.
// Instead we detect which tokens would visually collide (their full portrait
// discs overlap) and let the renderers draw those as small pins instead of big
// portraits. Pins sit precisely on the token's true position; hovering one shows
// the full character card. Tokens with room around them stay full portraits.
//
// Returns a Set of tokenLayoutKey(tok) values that are crowded.

export function tokenLayoutKey(tok, index = 0) {
  return String(tok?.id ?? tok?.token_id ?? tok?.characterId ?? tok?.label ?? index);
}

const TOKEN_R = 14; // full token radius in canvas px (matches the renderers)

export function computeCrowdedKeys(tokens, mapRect) {
  const crowded = new Set();
  if (!tokens || tokens.length < 2 || !mapRect || !mapRect.w || !mapRect.h) return crowded;

  // Positions in canvas px (absolute mapRect offset cancels for distance checks).
  const pts = tokens.map((t, i) => ({
    key: tokenLayoutKey(t, i),
    x: t.x * mapRect.w,
    y: t.y * mapRect.h,
  }));

  // Two full portrait discs (radius TOKEN_R) overlap when their centers are
  // closer than 2*TOKEN_R. Any token that overlaps another becomes a pin.
  const touch = TOKEN_R * 2;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      if (dx * dx + dy * dy < touch * touch) {
        crowded.add(pts[i].key);
        crowded.add(pts[j].key);
      }
    }
  }
  return crowded;
}
