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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.style.background = darkMode ? '#14110c' : '#f0eeeb';
  }, [darkMode]);

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

  return <Landing user={session.user} darkMode={darkMode} setDarkMode={setDarkMode} />;
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  };

  const handleEmailAuth = async () => {
    setError('');
    setMessage('');
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: '1px solid rgba(26,23,20,0.25)',
    borderRadius: 6,
    fontFamily: 'Georgia, serif',
    fontSize: 13,
    color: '#1a1714',
    outline: 'none',
    marginBottom: 10,
  };

  const btnStyle = {
    width: '100%',
    background: '#1a1714',
    border: 'none',
    borderRadius: 6,
    padding: '14px 32px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#f0eeeb',
    fontWeight: 700,
    marginBottom: 10,
  };

  const ghostBtnStyle = {
    ...btnStyle,
    background: 'transparent',
    border: '1px solid rgba(26,23,20,0.25)',
    color: '#1a1714',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, fontWeight: 700, letterSpacing: '0.1em', color: '#1a1714', marginBottom: 8 }}>SYNTARION</div>
      <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13, color: 'rgba(26,23,20,0.45)', marginBottom: 48, letterSpacing: '0.03em' }}>Are you ready, Adventurer?</div>

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column' }}>
        <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailAuth()} />

        {error && <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 8, textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ fontSize: 12, color: '#27ae60', marginBottom: 8, textAlign: 'center' }}>{message}</div>}

        <button onClick={handleEmailAuth} style={btnStyle}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(26,23,20,0.5)', marginBottom: 20, cursor: 'pointer' }} onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,23,20,0.15)' }} />
          <span style={{ fontSize: 11, color: 'rgba(26,23,20,0.4)', letterSpacing: '0.1em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,23,20,0.15)' }} />
        </div>

        <button onClick={() => handleOAuth('google')} style={ghostBtnStyle}>Sign in with Google</button>
        <button onClick={() => handleOAuth('facebook')} style={ghostBtnStyle}>Sign in with Facebook</button>
      </div>
    </div>
  );
}