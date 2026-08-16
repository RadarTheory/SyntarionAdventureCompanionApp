import { createClient } from '@supabase/supabase-js';
import { authStorage } from './authSession';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // PKCE, not the supabase-js default of 'implicit'. Implicit flow returns the
      // session in the URL fragment (/#access_token=...), and a fragment does not
      // survive Android handing a redirect back to an installed home-screen app —
      // the app reopened at a bare "/" with nothing to read, so social sign-in
      // could never stick there. PKCE returns ?code=... in the query string, which
      // does survive. Existing saved sessions are unaffected by this setting.
      flowType: 'pkce',
      // Same localStorage key as the default adapter — existing sessions carry
      // over — but it degrades to memory instead of throwing when the browser
      // blocks site data. See lib/authSession.js.
      storage: authStorage,
    },
  }
);

export default supabase;
