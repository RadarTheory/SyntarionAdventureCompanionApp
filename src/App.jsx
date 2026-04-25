import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Landing from './Landing';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  if (!session) return <LoginScreen />;

  return <Landing user={session.user} />;
}

function LoginScreen() {
  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#f0eeeb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700, letterSpacing: '0.1em', color: '#1a1714', marginBottom: 8 }}>
        SYNTARION
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,23,20,0.45)', marginBottom: 48, letterSpacing: '0.03em' }}>
        Are you ready, Adventurer?
      </div>
      <button onClick={handleGoogleLogin} style={{
        background: '#1a1714', border: 'none', borderRadius: 6,
        padding: '14px 32px', cursor: 'pointer',
        fontFamily: "'Cinzel', serif", fontSize: 11,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: '#f0eeeb', fontWeight: 700,
      }}>
        Sign in with Google
      </button>
    </div>
  );
}