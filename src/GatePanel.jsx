import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import './gateRoleToggle.css';

const ROLES = ['player', 'admin', 'architect', 'creator'];
const ROLE_COLORS = { player: '#8a8378', admin: '#7dd3fc', architect: '#e8c84a', creator: '#f472b6' };
const STATUS_DWELL_MS = 6000;

const inputStyle = { background: '#1a1714', border: '1px solid #3a352e', borderRadius: 6, padding: '7px 10px', color: '#f0eeeb', fontSize: 11, fontFamily: 'monospace', outline: 'none' };

// Shows a transient status message for STATUS_DWELL_MS instead of it either
// vanishing instantly (if something else resets the same state right after)
// or sitting forever until the next action.
function useTimedStatus(duration = STATUS_DWELL_MS) {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  const show = useCallback((msg) => {
    window.clearTimeout(timerRef.current);
    setMessage(msg);
    if (msg) timerRef.current = window.setTimeout(() => setMessage(''), duration);
  }, [duration]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return [message, show];
}

export default function GatePanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [vaultStatus, showVaultStatus] = useTimedStatus();
  const [vaultBusy, setVaultBusy] = useState(false);

  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [modulePassword, setModulePassword] = useState('');
  const [moduleStatus, showModuleStatus] = useTimedStatus();
  const [moduleBusy, setModuleBusy] = useState(false);

  const [rowStatus, showRowStatus] = useTimedStatus();

  const [messageOpenFor, setMessageOpenFor] = useState(null);
  const [messageCharacters, setMessageCharacters] = useState([]);
  const [messageCharacterId, setMessageCharacterId] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageBusy, setMessageBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profileRows, error: profileErr }, { data: roleRows, error: roleErr }, { data: moduleRows, error: moduleErr }] = await Promise.all([
      supabase.rpc('get_user_profiles'),
      supabase.from('profiles').select('id, role, banned, suspended'),
      supabase.from('modules').select('id, name').order('name', { ascending: true }),
    ]);

    if (profileErr) {
      setLoadError(`Error loading accounts: ${profileErr.message}`);
      setUsers([]);
      setLoading(false);
      return;
    }

    const flagsById = Object.fromEntries((roleRows || []).map((r) => [r.id, r]));
    setUsers(
      (profileRows || [])
        .map((u) => {
          const flags = flagsById[u.id];
          return { ...u, role: flags?.role || 'player', banned: !!flags?.banned, suspended: !!flags?.suspended };
        })
        .sort((a, b) => (a.email || '').localeCompare(b.email || ''))
    );
    setLoadError(roleErr ? `Roles table not reachable yet: ${roleErr.message}` : '');

    if (!moduleErr) {
      setModules(moduleRows || []);
      setSelectedModuleId((current) => current || (moduleRows && moduleRows[0] ? String(moduleRows[0].id) : ''));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setRole = async (userId, role) => {
    showRowStatus('Saving...');
    const { error } = await supabase.from('profiles').upsert({ id: userId, role });
    showRowStatus(error ? `Error: ${error.message}` : 'Saved.');
    void load();
  };

  const toggleFlag = async (userId, field, value) => {
    showRowStatus(`${value ? 'Setting' : 'Clearing'} ${field}...`);
    const { error } = await supabase.from('profiles').upsert({ id: userId, [field]: value });
    showRowStatus(error ? `Error: ${error.message}` : 'Saved.');
    void load();
  };

  const sendPasswordReminder = async (email) => {
    showRowStatus(`Sending password reminder to ${email}...`);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    showRowStatus(error ? `Error: ${error.message}` : `Password reset email sent to ${email}.`);
  };

  const openMessageCompose = async (userId) => {
    setMessageOpenFor(userId);
    setMessageBody('');
    setMessageCharacterId('');
    setMessageCharacters([]);
    const { data } = await supabase.from('characters').select('id, name, campaign_id').eq('user_id', userId);
    setMessageCharacters(data || []);
    if (data && data[0]) setMessageCharacterId(String(data[0].id));
  };

  const sendMessage = async () => {
    if (!messageCharacterId) {
      showRowStatus('Pick a character first.');
      return;
    }
    if (!messageBody.trim()) {
      showRowStatus('Write something first.');
      return;
    }
    const char = messageCharacters.find((c) => String(c.id) === messageCharacterId);
    setMessageBusy(true);
    showRowStatus('Sending...');
    const { error } = await supabase.from('messages').insert({
      character_id: char.id,
      campaign_id: char.campaign_id,
      type: 'dm_reply',
      content: messageBody.trim(),
      sender_name: 'The Architect',
      is_dm: true,
    });
    setMessageBusy(false);
    showRowStatus(error ? `Error: ${error.message}` : 'Message sent.');
    if (!error) {
      setMessageBody('');
      setMessageOpenFor(null);
    }
  };

  const setVaultSigil = async () => {
    if (vaultPassword.trim().length < 6) {
      showVaultStatus('Sigil must be at least 6 characters.');
      return;
    }
    setVaultBusy(true);
    showVaultStatus('Setting sigil...');
    const { error } = await supabase.rpc('set_adminspace_secret', {
      p_setting_key: 'architect_vault_password',
      p_password: vaultPassword,
    });
    setVaultBusy(false);
    showVaultStatus(error ? `Error: ${error.message}` : 'Sigil updated. This is the password Oracle’s Architect vault now checks.');
    if (!error) setVaultPassword('');
  };

  const setModuleDmPassword = async () => {
    if (!selectedModuleId) {
      showModuleStatus('Pick a module first.');
      return;
    }
    if (modulePassword.trim().length < 6) {
      showModuleStatus('Password must be at least 6 characters.');
      return;
    }
    setModuleBusy(true);
    showModuleStatus('Setting password...');
    const { error } = await supabase.rpc('set_module_dm_password', {
      p_module_id: Number(selectedModuleId),
      p_new_password: modulePassword,
    });
    setModuleBusy(false);
    showModuleStatus(error ? `Error: ${error.message}` : 'DM password updated for this module.');
    if (!error) setModulePassword('');
  };

  const query = search.trim().toLowerCase();
  const filtered = users.filter((u) => !query || (u.email || '').toLowerCase().includes(query));

  return (
    <div>
      <div style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '12px 14px', marginBottom: 20, maxWidth: 560 }}>
        <div style={{ color: '#e8c84a', fontSize: 12, marginBottom: 4 }}>ORACLE ARCHITECT VAULT SIGIL</div>
        <div style={{ color: '#5c564c', fontSize: 10, marginBottom: 10 }}>
          The shared password Oracle’s "Architect" vault checks before opening this Admin panel. Setting it here requires creator/architect/admin — everyone else is rejected server-side.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="password"
            style={{ ...inputStyle, flex: 1 }}
            placeholder="new sigil (min 6 chars)"
            value={vaultPassword}
            onChange={(e) => setVaultPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setVaultSigil()}
          />
          <button
            onClick={setVaultSigil}
            disabled={vaultBusy}
            style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', color: '#e8c84a', fontSize: 10, cursor: vaultBusy ? 'default' : 'pointer', fontFamily: 'monospace' }}
          >
            {vaultBusy ? 'Setting…' : 'Set Sigil'}
          </button>
        </div>
        {vaultStatus && <div style={{ fontSize: 10, color: '#e8a84a', marginTop: 8 }}>{vaultStatus}</div>}
      </div>

      <div style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '12px 14px', marginBottom: 20, maxWidth: 560 }}>
        <div style={{ color: '#e8c84a', fontSize: 12, marginBottom: 4 }}>MODULE DM PASSWORD</div>
        <div style={{ color: '#5c564c', fontSize: 10, marginBottom: 10 }}>
          Resets the sigil a player types into the DM-mode prompt for a specific module (e.g. Soteria).
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            style={{ ...inputStyle, width: 180 }}
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
          >
            {modules.length === 0 && <option value="">No modules found</option>}
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            type="password"
            style={{ ...inputStyle, flex: 1 }}
            placeholder="new DM password (min 6 chars)"
            value={modulePassword}
            onChange={(e) => setModulePassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setModuleDmPassword()}
          />
          <button
            onClick={setModuleDmPassword}
            disabled={moduleBusy || !selectedModuleId}
            style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', color: '#e8c84a', fontSize: 10, cursor: moduleBusy ? 'default' : 'pointer', fontFamily: 'monospace' }}
          >
            {moduleBusy ? 'Setting…' : 'Set Password'}
          </button>
        </div>
        {moduleStatus && <div style={{ fontSize: 10, color: '#e8a84a', marginTop: 8 }}>{moduleStatus}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ color: '#e8c84a', fontSize: 13 }}>GATE — USER PERMISSIONS</div>
        <div style={{ fontSize: 10, color: '#8a8378' }}>{loading ? 'loading…' : `${users.length} accounts`}</div>
        <input style={{ ...inputStyle, width: 220, marginLeft: 'auto' }} placeholder="search email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button
          onClick={load}
          style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '6px 12px', color: '#e8c84a', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}
        >
          Refresh
        </button>
      </div>

      {loadError && <div style={{ fontSize: 10, color: '#e8a84a', marginBottom: 10 }}>{loadError}</div>}
      {rowStatus && <div style={{ fontSize: 10, color: '#e8a84a', marginBottom: 10 }}>{rowStatus}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 900 }}>
        {filtered.map((u) => (
          <div key={u.id} style={{ border: '1px solid #2a251e', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f0eeeb', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || u.id}</div>
                <div style={{ color: '#5c564c', fontSize: 10 }}>
                  joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'} · last seen {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : 'never'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                {ROLES.map((r) => (
                  <label
                    key={r}
                    className="role-toggle"
                    title={`Set ${u.email || u.id} to ${r}`}
                    style={{ '--role-color': ROLE_COLORS[r] }}
                  >
                    <span className="role-toggle-box">
                      <input
                        type="checkbox"
                        checked={u.role === r}
                        disabled={u.role === r}
                        onChange={() => setRole(u.id, r)}
                      />
                      <span className="plus1" />
                      <span className="plus2" />
                    </span>
                    <span className="role-label">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => (messageOpenFor === u.id ? setMessageOpenFor(null) : openMessageCompose(u.id))}
                style={{ background: messageOpenFor === u.id ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${messageOpenFor === u.id ? 'rgba(200,168,74,0.5)' : '#3a352e'}`, color: messageOpenFor === u.id ? '#e8c84a' : '#8a8378', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Message
              </button>
              <button
                onClick={() => sendPasswordReminder(u.email)}
                disabled={!u.email}
                style={{ background: 'transparent', border: '1px solid #3a352e', color: '#8a8378', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: u.email ? 'pointer' : 'default', fontFamily: 'monospace' }}
              >
                Send Password Reminder
              </button>
              <button
                onClick={() => toggleFlag(u.id, 'suspended', !u.suspended)}
                title="Can still sign in; blocked from sending messages/Larks"
                style={{ background: u.suspended ? 'rgba(232,168,74,0.16)' : 'transparent', border: `1px solid ${u.suspended ? '#e8a84a' : '#3a352e'}`, color: u.suspended ? '#e8a84a' : '#8a8378', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}
              >
                {u.suspended ? 'Suspended ✓' : 'Suspend'}
              </button>
              <button
                onClick={() => toggleFlag(u.id, 'banned', !u.banned)}
                title="Blocked from the app entirely on next sign-in check"
                style={{ background: u.banned ? 'rgba(224,90,90,0.14)' : 'transparent', border: `1px solid ${u.banned ? 'rgba(224,90,90,0.5)' : '#3a352e'}`, color: u.banned ? '#ef4444' : '#8a8378', borderRadius: 5, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}
              >
                {u.banned ? 'Banned ✓' : 'Ban'}
              </button>
            </div>

            {messageOpenFor === u.id && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'flex-start' }}>
                <select
                  style={{ ...inputStyle, width: 160 }}
                  value={messageCharacterId}
                  onChange={(e) => setMessageCharacterId(e.target.value)}
                >
                  {messageCharacters.length === 0 && <option value="">No characters</option>}
                  {messageCharacters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <textarea
                  style={{ ...inputStyle, flex: 1, minHeight: 50, resize: 'vertical' }}
                  placeholder="Message content..."
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                />
                <button
                  onClick={sendMessage}
                  disabled={messageBusy || !messageCharacterId}
                  style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', color: '#e8c84a', fontSize: 10, cursor: messageBusy ? 'default' : 'pointer', fontFamily: 'monospace' }}
                >
                  {messageBusy ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
          </div>
        ))}
        {!loading && filtered.length === 0 && <div style={{ color: '#4a453c', fontSize: 11, padding: '20px 0' }}>No accounts found.</div>}
      </div>
    </div>
  );
}
