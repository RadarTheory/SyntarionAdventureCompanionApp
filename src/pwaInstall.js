let deferredInstallPrompt = null;
const listeners = new Set();

function isAppleDevice() {
  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  const iPadOS = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(userAgent) || iPadOS;
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function getPlatform() {
  if (isAppleDevice()) return 'apple';
  if (/Android/i.test(navigator.userAgent || '')) return 'android';
  return 'desktop';
}

function emit() {
  const state = getPWAInstallState();
  listeners.forEach(listener => listener(state));
}

export function getPWAInstallState() {
  return {
    canPrompt: Boolean(deferredInstallPrompt),
    isInstalled: isStandalone(),
    platform: getPlatform(),
  };
}

export function subscribePWAInstall(listener) {
  listeners.add(listener);
  listener(getPWAInstallState());
  return () => listeners.delete(listener);
}

export function setupPWAInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    emit();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    emit();
  });
}

export async function promptPWAInstall() {
  if (!deferredInstallPrompt) return { outcome: 'unavailable' };

  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  emit();

  promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  emit();
  return choice;
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations?.()
        .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
        .then(() => caches?.keys?.())
        .then(keys => keys ? Promise.all(keys.map(key => caches.delete(key))) : null)
        .catch(error => console.warn('Syntarion dev service worker cleanup failed:', error));
    });
    return;
  }

  if (!window.isSecureContext && window.location.hostname !== 'localhost') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Syntarion service worker registration failed:', error);
    });
  });
}
