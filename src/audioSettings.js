const AUDIO_SETTINGS_KEY = 'syntarion_audio_settings';

export const DEFAULT_AUDIO_SETTINGS = {
  musicVolume: 0.7,
  environmentVolume: 0.7,
  ambienceVolume: 0.7,
  sfxVolume: 0.85,
  musicEnabled: true,
  environmentEnabled: true,
  ambienceEnabled: true,
  sfxEnabled: true,
};

function clampVolume(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

export function normalizeAudioSettings(value = {}) {
  return {
    musicVolume: clampVolume(value.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
    environmentVolume: clampVolume(value.environmentVolume, DEFAULT_AUDIO_SETTINGS.environmentVolume),
    ambienceVolume: clampVolume(value.ambienceVolume, DEFAULT_AUDIO_SETTINGS.ambienceVolume),
    sfxVolume: clampVolume(value.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
    musicEnabled: value.musicEnabled !== false,
    environmentEnabled: value.environmentEnabled !== false,
    ambienceEnabled: value.ambienceEnabled !== false,
    sfxEnabled: value.sfxEnabled !== false,
  };
}

export function getAudioSettings() {
  if (typeof window === 'undefined') return DEFAULT_AUDIO_SETTINGS;

  try {
    const saved = window.localStorage.getItem(AUDIO_SETTINGS_KEY);
    return normalizeAudioSettings(saved ? JSON.parse(saved) : DEFAULT_AUDIO_SETTINGS);
  } catch (err) {
    console.warn('Could not read audio settings:', err);
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(nextSettings) {
  const settings = normalizeAudioSettings(nextSettings);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('syntarion-audio-settings', { detail: settings }));
  }

  return settings;
}

export function subscribeAudioSettings(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleLocalChange = (event) => callback(event.detail || getAudioSettings());
  const handleStorageChange = (event) => {
    if (event.key === AUDIO_SETTINGS_KEY) callback(getAudioSettings());
  };

  window.addEventListener('syntarion-audio-settings', handleLocalChange);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('syntarion-audio-settings', handleLocalChange);
    window.removeEventListener('storage', handleStorageChange);
  };
}
