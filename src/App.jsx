import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import Landing from './Landing';
import ScribeLite from './ScribeLite';
import LoadingScreen from './LoadingScreen';
import LotjarrsBag from './LotjarrsBag';
import PlayDriftstone from './PlayDriftstone';
import Fubin from './Fubin';
import Elddimgates from './Elddimgates';
import Undercrypts from './Undercrypts';
import OcpNodewright from './OcpNodewright';

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [splashLoading, setSplashLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('syn_dark') === '1');
  useEffect(() => { localStorage.setItem('syn_dark', darkMode ? '1' : '0'); }, [darkMode]);
  const [view, setView] = useState(() => {
   const saved = localStorage.getItem('syntarion_view');
    return ['driftstone', 'fubin', 'elddimgates', 'undercrypts', 'ocp-nodewright'].includes(saved) ? saved : 'landing';
  });
  const [inSession, setInSession] = useState(false);
  const [inCampaign, setInCampaign] = useState(false);
  const [banStatus, setBanStatus] = useState({ checked: false, banned: false });
  const [recoveryMode, setRecoveryMode] = useState(false);

  const goLandingHome = () => {
    localStorage.removeItem('syntarion_view');
    localStorage.setItem('syn_view', 'home');
    setView('landing');
  };

  const openBag = () => {
    localStorage.removeItem('syntarion_view');
    setView('bag');
  };


  const launchGame = (id) => {
    if (!id) return;
    localStorage.setItem('syntarion_view', id);
    setView(id);
  };

  const returnToBag = () => {
    localStorage.removeItem('syntarion_view');
    setView('bag');
  };

  useEffect(() => {
    document.body.style.background = darkMode ? '#14110c' : '#dbdcdf';
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      setSession(session);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setBanStatus({ checked: false, banned: false });
      return;
    }
    let active = true;
    supabase
      .from('profiles')
      .select('banned')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setBanStatus({ checked: true, banned: !!data?.banned });
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  // Show splash screen first, regardless of auth state
  if (splashLoading) return <LoadingScreen />;

  // While auth resolves after splash, show nothing (avoids flash)
  if (authLoading) return null;

  // A password-recovery link just signed this session in — finish that
  // flow before anything else, gameplay or ban-check included.
  if (recoveryMode) return <SetNewPasswordScreen onDone={() => setRecoveryMode(false)} />;

  // Not logged in → show login screen
  if (!session) return <LoginScreen />;

  // Wait for the ban check before rendering anything gameplay-related
  if (!banStatus.checked) return null;
  if (banStatus.banned) return <BannedScreen onSignOut={() => supabase.auth.signOut()} />;

  // Bag / mini-game views (auth still required to reach these)
  if (view === 'bag') return <LotjarrsBag onHome={goLandingHome} onLaunchGame={launchGame} />;
  if (view === 'driftstone') return <PlayDriftstone onHome={returnToBag} />;
  if (view === 'fubin') return <Fubin onHome={goLandingHome} />;
  if (view === 'elddimgates') return <Elddimgates onExit={returnToBag} />;
  if (view === 'undercrypts') return <Undercrypts onExit={returnToBag} />;
  if (view === 'ocp-nodewright') return <OcpNodewright onExit={returnToBag} />;

  // Main app — pass real session user
  return (
    <>

      <Landing
        user={session.user}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenBag={openBag}
        onViewChange={setInCampaign}
      />
      <ScribeLite dismiss={inCampaign} />
    </>
  );
}


function SetNewPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
    boxSizing: 'border-box',
  };

  const submit = async () => {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setBusy(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    onDone();
  };

  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#dbdcdf',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(255, 250, 240, 0.65) 0%, transparent 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1a1714', marginBottom: 14, textAlign: 'center' }}>
          Set A New Password
        </div>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          style={inputStyle}
        />
        {error && <div style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#b23b3b', marginBottom: 10 }}>{error}</div>}
        <button
          onClick={submit}
          disabled={busy}
          style={{
            width: '100%',
            background: '#1a1714',
            border: 'none',
            borderRadius: 6,
            padding: '14px 32px',
            cursor: busy ? 'default' : 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#f0eeeb',
            fontWeight: 700,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? 'Saving…' : 'Set Password'}
        </button>
      </div>
    </div>
  );
}

function BannedScreen({ onSignOut }) {
  return (
    <div
      style={{
        minHeight: '100svh',
        background: '#dbdcdf',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(255, 250, 240, 0.65) 0%, transparent 70%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#1a1714', marginBottom: 14 }}>
          Account Suspended
        </div>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: '#3a352e', lineHeight: 1.6, marginBottom: 22 }}>
          This account has been banned from Syntarion. If you believe this is a mistake, contact your DM.
        </p>
        <button
          onClick={onSignOut}
          style={{
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
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleOAuth = async (provider) => {
    setError('');
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  const handleEmailAuth = async () => {
    setError('');
    setMessage('');

    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email to confirm your account.');
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
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
    <div
      style={{
        minHeight: '100svh',
        background: '#dbdcdf',
        backgroundImage: `radial-gradient(circle at 50% 20%, rgba(255, 250, 240, 0.65) 0%, transparent 70%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        padding: 'calc(24px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom))',
      }}

      
    >
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; }
        `}
      </style>

      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#1a1714',
          marginBottom: 8,
        }}
      >
        SYNTARION
      </div>

      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'rgba(26,23,20,0.45)',
          marginBottom: 48,
          letterSpacing: '0.03em',
        }}
      >
        Are you ready, Adventurer?
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column' }}>
        <input
          style={inputStyle}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={inputStyle}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleEmailAuth(); }}
        />

        {error && (
          <div style={{ fontSize: 12, color: '#c0392b', marginBottom: 8, textAlign: 'center' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ fontSize: 12, color: '#27ae60', marginBottom: 8, textAlign: 'center' }}>
            {message}
          </div>
        )}

        <button onClick={handleEmailAuth} style={btnStyle}>
          {isSignUp ? 'Create Account' : 'Sign In'}
        </button>

        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'rgba(26,23,20,0.5)',
            marginBottom: 20,
            cursor: 'pointer',
          }}
          onClick={() => setIsSignUp((c) => !c)}
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,23,20,0.15)' }} />
          <span style={{ fontSize: 11, color: 'rgba(26,23,20,0.4)', letterSpacing: '0.1em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(26,23,20,0.15)' }} />
        </div>

        <button onClick={() => handleOAuth('google')} style={ghostBtnStyle}>
          Sign in with Google
        </button>

        <button onClick={() => handleOAuth('facebook')} style={ghostBtnStyle}>
          Sign in with Facebook
        </button>
      </div>
    </div>
  );
}

