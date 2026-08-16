// Session persistence plumbing, shared by the supabase client and the UI.
//
// Two problems this solves:
//
// 1. Safari Private Browsing, "block all cookies", and some in-app browsers make
//    localStorage.setItem throw. supabase-js treats a failed write as "there is
//    no session to persist", so the player is asked to sign in on every single
//    load with no explanation. We fall back to memory so the tab still works,
//    and record that persistence is unavailable so the login screen can say why.
//
// 2. onAuthStateChange fires SIGNED_OUT both when the player asks to sign out and
//    when a refresh token is rejected (expired, rotated, or a dropped mobile
//    connection). Those need different handling, so callers mark the deliberate
//    ones.

const memory = new Map();
let storageWritable = null; // null = not probed yet

function backingStore() {
  try {
    return window.localStorage;
  } catch {
    return null; // access itself throws when site data is blocked
  }
}

// Write-then-read, because Safari Private Browsing exposes a localStorage object
// that accepts getItem but throws on setItem.
function probeStorage() {
  if (storageWritable !== null) return storageWritable;
  const store = backingStore();
  if (!store) { storageWritable = false; return storageWritable; }
  try {
    const probeKey = '__syn_persist_probe__';
    store.setItem(probeKey, '1');
    storageWritable = store.getItem(probeKey) === '1';
    store.removeItem(probeKey);
  } catch {
    storageWritable = false;
  }
  return storageWritable;
}

// Storage adapter handed to supabase-js. Same backing store and same key as the
// default adapter, so sessions saved by earlier builds keep working — this only
// adds a fallback for the cases where the default adapter would throw.
export const authStorage = {
  getItem(key) {
    if (probeStorage()) {
      try { return backingStore().getItem(key); } catch { /* fall through */ }
    }
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, value);
    if (!probeStorage()) return;
    try {
      backingStore().setItem(key, value);
    } catch {
      // Quota or a policy change mid-session — keep the in-memory copy so the
      // current tab stays signed in, and stop claiming we can persist.
      storageWritable = false;
    }
  },
  removeItem(key) {
    memory.delete(key);
    if (!probeStorage()) return;
    try { backingStore().removeItem(key); } catch { /* nothing to do */ }
  },
};

// False when the browser is discarding saved logins — the session lives only for
// this tab, so the player will be asked to sign in again next visit.
export function isSessionPersistent() {
  return probeStorage();
}

// An installed home-screen app gets its own storage container, and browsers treat
// that container as evictable: iOS clears script-writable storage for web apps it
// considers idle, which drops the saved session and sends the player back to the
// login screen on the next launch. navigator.storage.persist() opts out of that
// eviction — Chrome grants it to installed apps automatically, Safari decides on
// engagement. Safe to call on every load; it reports the existing grant if the
// browser has already decided.
let persistenceGrant = 'unknown'; // 'unknown' | 'granted' | 'denied' | 'unsupported'

export async function requestPersistentStorage() {
  if (!navigator.storage?.persist || !navigator.storage?.persisted) {
    persistenceGrant = 'unsupported';
    return persistenceGrant;
  }
  try {
    const already = await navigator.storage.persisted();
    persistenceGrant = (already || await navigator.storage.persist()) ? 'granted' : 'denied';
  } catch {
    persistenceGrant = 'unsupported';
  }
  return persistenceGrant;
}

export function getPersistenceGrant() {
  return persistenceGrant;
}

// Everything the login screen needs to explain why a player keeps landing back
// here. Deliberately booleans and states only — never token values.
export function collectAuthDiagnostics(storageKey) {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
  let sessionSaved = false;
  let handshakePending = false;
  try {
    sessionSaved = !!window.localStorage.getItem(storageKey);
    // PKCE parks a verifier here between leaving for the provider and coming
    // back. Present on a fresh load means the return trip never completed.
    handshakePending = Object.keys(window.localStorage).some(k => k.endsWith('-code-verifier'));
  } catch { /* storage unreadable — sessionSaved stays false */ }

  return {
    installedApp: standalone,
    savedLoginsAllowed: isSessionPersistent(),
    storageKeptByBrowser: persistenceGrant,
    sessionFoundAtStart: sessionSaved,
    handshakePending,
  };
}

let explicitSignOut = false;

// Call immediately before supabase.auth.signOut() on any user-initiated sign out.
export function markExplicitSignOut() {
  explicitSignOut = true;
}

export function consumeExplicitSignOut() {
  const wasExplicit = explicitSignOut;
  explicitSignOut = false;
  return wasExplicit;
}
