// Bumped whenever the wizard's symbol images are replaced (user, 2026-11-17), so every browser and the installed app
// fetch the new files instead of an older copy they kept.
export const ASSET_V = '20261117b';
export const versioned = (src) => (src ? `${src}?v=${ASSET_V}` : src);
