import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock, Flag, X, Trash2 } from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, createProfile, checkUsernameTaken,
  searchByUsername, getProfile, sendMessage, getConversation, subscribeToMessages,
  reportUser, uploadMedia, deleteMessage,
} from './supabaseClient.js';

const G = {
  ink: '#1C1D21', paper: '#FAF8F5', muted: '#6B6E76', blue: '#0A84FF',
  gold: '#E8B04B', red: '#FF453A', green: '#30D158', border: 'rgba(0,0,0,0.08)',
};

function input() {
  return { width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${G.border}`, fontSize: 14.5, outline: 'none', boxSizing: 'border-box', background: 'white' };
}
function primaryBtn(disabled) {
  return { width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: disabled ? '#D9D3C4' : G.blue, color: 'white', fontSize: 14.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', marginTop: 14 };
}
function ghost() {
  return { background: 'none', border: 'none', color: G.blue, fontSize: 13, cursor: 'pointer', padding: 0 };
}

function AuthShell({ children }) {
  return (
    <div style={{ height: '100vh', width: '100%', background: '#EDEFF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 30 }}>ZChat</div>
        </div>
        <div style={{ background: 'white', borderRadius: 18, padding: 26, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginStep({ onSuccess, onForgot, onGoRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPasswordVal] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 6;

  const submit = async () => {
    setLoading(true);
    setErr('');
    const { data, error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onSuccess(data.session);
  };

  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Sign in</div>
      <input style={{ ...input(), marginBottom: 10 }} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ position: 'relative' }}>
        <input style={input()} type={showPw ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPasswordVal(e.target.value)} />
        <div onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 12, top: 12, cursor: 'pointer', color: G.muted }}>
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 8 }}>
        <span style={ghost()} onClick={onForgot}>Forgot password?</span>
      </div>
      {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      <button style={primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={submit}>
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: G.muted }}>
        New here? <span style={ghost()} onClick={onGoRegister}>Create an account</span>
      </div>
    </div>
  );
}

function ForgotStep({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);
  const submit = async () => {
    await sendPasswordReset(email);
    setSent(true);
  };
  if (sent) {
    return (
      <div style={{ textAlign: 'center' }}>
        <Mail size={30} color={G.blue} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 600, fontSize: 15.5, marginBottom: 6 }}>Check your inbox</div>
        <div style={{ fontSize: 13.5, color: G.muted, marginBottom: 18 }}>We sent a reset link to {email}.</div>
        <span style={ghost()} onClick={onBack}>Back to sign in</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Reset your password</div>
      <input style={input()} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button style={primaryBtn(!valid)} disabled={!valid} onClick={submit}>Send reset link</button>
      <div style={{ textAlign: 'center', marginTop: 14 }}><span style={ghost()} onClick={onBack}>Back to sign in</span></div>
    </div>
  );
}

function ResendRow({ email, onResend }) {
  const CODE_LIFETIME = 120; // matches Supabase's OTP expiry, in seconds (2 minutes)
  const RESEND_COOLDOWN = 60; // how long before the user can request a new code
  const [secondsLeft, setSecondsLeft] = useState(CODE_LIFETIME);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const formatTime = (total) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    setSending(true);
    await onResend();
    setSending(false);
    setSecondsLeft(CODE_LIFETIME);
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <div style={{ fontSize: 12, color: secondsLeft < 60 ? G.red : G.muted }}>
        {secondsLeft > 0 ? `Code expires in ${formatTime(secondsLeft)}` : 'Code has expired'}
      </div>
      <div style={{ marginTop: 8 }}>
        {cooldown > 0 ? (
          <span style={{ fontSize: 12.5, color: G.muted }}>Resend code in {cooldown}s</span>
        ) : (
          <span style={ghost()} onClick={sending ? undefined : handleResend}>
            {sending ? 'Sending...' : 'Resend code'}
          </span>
        )}
      </div>
    </div>
  );
}

function RegisterFlow({ onDone, onBack }) {
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [taken, setTaken] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true); setErr('');
    const { error } = await registerWithEmail(email);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage('otp');
  };

  const verify = async () => {
    setLoading(true); setErr('');
    const { error } = await verifyOtp(email, code);
    setLoading(false);
    if (error) { setErr('Incorrect or expired code.'); return; }
    setStage('password');
  };

  const savePw = async () => {
    if (pw.length < 6 || pw !== pw2) { setErr('Passwords must match and be 6+ characters.'); return; }
    setLoading(true); setErr('');
    const { error } = await setPassword(pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage('username');
  };

  const checkUsername = async (val) => {
    setUsername(val);
    if (val.length >= 3) {
      const { taken } = await checkUsernameTaken(val.toLowerCase());
      setTaken(taken);
    }
  };

  const finish = async () => {
    setLoading(true); setErr('');
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session.user.id;
    const { error } = await createProfile(userId, username.toLowerCase(), name);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onDone();
  };

  if (stage === 'email') {
    const valid = /\S+@\S+\.\S+/.test(email);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Mail size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Create your account</span>
        </div>
        <input style={input()} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={sendCode}>
          {loading ? 'Sending...' : 'Send code'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 14 }}><span style={ghost()} onClick={onBack}>Back to sign in</span></div>
      </div>
    );
  }

  if (stage === 'otp') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ShieldCheck size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Enter the code sent to</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{email}</div>
        <input style={{ ...input(), letterSpacing: 4, fontSize: 18, textAlign: 'center' }} placeholder="••••••••" maxLength={8}
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(code.length < 6 || loading)} disabled={code.length < 6 || loading} onClick={verify}>
          {loading ? 'Verifying...' : 'Verify'}
        </button>
        <ResendRow email={email} onResend={sendCode} />
      </div>
    );
  }

  if (stage === 'password') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Lock size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Create a password</span>
        </div>
        <input style={{ ...input(), marginBottom: 10 }} type="password" placeholder="Password (min 6 characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
        <input style={input()} type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(loading)} disabled={loading} onClick={savePw}>{loading ? 'Saving...' : 'Continue'}</button>
      </div>
    );
  }

  const validU = /^[a-z0-9._]{3,20}$/.test(username.toLowerCase());
  const validN = name.trim().length >= 2;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AtSign size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Choose your identity</span>
      </div>
      <input style={{ ...input(), marginBottom: 10 }} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input style={input()} placeholder="Username" value={username} onChange={(e) => checkUsername(e.target.value)} />
      {username && (
        <div style={{ fontSize: 12.5, marginTop: 8, color: !validU ? G.red : taken ? G.red : G.green }}>
          {!validU ? '3 to 20 characters: letters, numbers, dot or underscore' : taken ? 'That username is taken' : 'Available'}
        </div>
      )}
      {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      <button style={primaryBtn(!validU || !validN || taken || loading)} disabled={!validU || !validN || taken || loading} onClick={finish}>
        {loading ? 'Finishing...' : 'Finish'}
      </button>
    </div>
  );
}

function ChatApp({ session, onLogout }) {
  const [me, setMe] = useState(null);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [activeProfile, setActiveProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getProfile(session.user.id).then(({ data }) => setMe(data));
    const sub = subscribeToMessages(session.user.id, (msg) => {
      setMessages((prev) => (activeProfile && (msg.sender_id === activeProfile.id) ? [...prev, msg] : prev));
    });
    return () => supabase.removeChannel(sub);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const doSearch = async (val) => {
    setSearch(val);
    if (val.length >= 2) {
      const { data } = await searchByUsername(val);
      setResults(data.filter((u) => u.id !== session.user.id));
    } else {
      setResults([]);
    }
  };

  const openChat = async (profile) => {
    setActiveProfile(profile);
    const { data } = await getConversation(session.user.id, profile.id);
    setMessages(data);
  };

  const send = async () => {
    if (!draft.trim() || !activeProfile) return;
    const text = draft.trim().slice(0, 1000);
    setDraft('');
    const { data } = await sendMessage(session.user.id, activeProfile.id, 'text', text, null);
    if (data) setMessages((prev) => [...prev, data]);
  };

  const handleFile = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;
    const { url, error } = await uploadMedia(file, session.user.id);
    e.target.value = '';
    if (error || !url) return;
    const { data } = await sendMessage(session.user.id, activeProfile.id, kind, null, url);
    if (data) setMessages((prev) => [...prev, data]);
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !activeProfile) return;
    await reportUser(session.user.id, activeProfile.id, reportReason.trim());
    setReportOpen(false);
    setReportReason('');
  };

  const handleDelete = async (messageId) => {
    const { data } = await deleteMessage(messageId);
    if (data) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)));
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100vh', width: '100%', background: '#EDEFF5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 14, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 900, height: '100%', maxHeight: 800, display: 'flex', background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', position: 'relative' }}>
        {reportOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: 24, width: '100%', maxWidth: 320, position: 'relative' }}>
              <X size={18} style={{ position: 'absolute', top: 14, right: 14, cursor: 'pointer', color: G.muted }} onClick={() => setReportOpen(false)} />
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Report @{activeProfile?.username}</div>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="What's going on?"
                style={{ ...input(), height: 70, resize: 'none', fontFamily: 'inherit' }} />
              <button style={primaryBtn(!reportReason.trim())} disabled={!reportReason.trim()} onClick={submitReport}>Send report</button>
            </div>
          </div>
        )}
        <div style={{ width: 300, minWidth: 300, borderRight: `1px solid ${G.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{me?.name || '...'}</div>
                <div style={{ fontSize: 11.5, color: G.muted }}>@{me?.username}</div>
              </div>
              <LogOut size={18} style={{ cursor: 'pointer', color: G.muted }} onClick={onLogout} />
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} color={G.muted} style={{ position: 'absolute', left: 12, top: 11 }} />
              <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Find by username"
                style={{ ...input(), padding: '9px 12px 9px 34px', background: '#F2F2F5' }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {results.map((u) => (
              <div key={u.id} onClick={() => openChat(u)} style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${G.border}` }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: G.muted }}>@{u.username}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeProfile ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: G.muted, fontSize: 14, textAlign: 'center', padding: 24 }}>
              Search a username to start a conversation
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${G.border}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{activeProfile.name}</div>
                  <div style={{ fontSize: 12, color: G.muted }}>@{activeProfile.username}</div>
                </div>
                <Flag size={18} color={G.muted} style={{ cursor: 'pointer' }} onClick={() => setReportOpen(true)} />
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                {messages.map((m) => {
                  const isMe = m.sender_id === session.user.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 6, alignItems: 'center', gap: 6 }}>
                      {isMe && !m.deleted && (
                        <Trash2 size={14} color={G.muted} style={{ cursor: 'pointer', flexShrink: 0 }}
                          onClick={() => handleDelete(m.id)} />
                      )}
                      <div style={{ maxWidth: '70%', background: m.deleted ? '#EAEAEA' : (isMe ? '#DCEBFF' : '#F2F2F5'), borderRadius: 12, padding: 8 }}>
                        {m.deleted ? (
                          <div style={{ fontSize: 13.5, color: G.muted, fontStyle: 'italic' }}>This message was deleted</div>
                        ) : (
                          <>
                            {m.type === 'image' && <img src={m.media_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 4 }} />}
                            {m.type === 'video' && <video src={m.media_url} controls style={{ width: '100%', borderRadius: 8, marginBottom: 4 }} />}
                            {m.content && <div style={{ fontSize: 14 }}>{m.content}</div>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 10, borderTop: `1px solid ${G.border}`, display: 'flex', gap: 8, alignItems: 'center' }}>
                <Paperclip size={20} color={G.muted} style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} />
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }}
                  onChange={(e) => handleFile(e, e.target.files[0]?.type.startsWith('video') ? 'video' : 'image')} />
                <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                  placeholder="Type a message" style={{ ...input(), flex: 1, borderRadius: 20 }} />
                <button onClick={send} style={{ width: 40, height: 40, borderRadius: '50%', background: G.blue, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Send size={17} color="white" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState('login');

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) return null;

  if (session) {
    return <ChatApp session={session} onLogout={async () => { await signOut(); setSession(null); setScreen('login'); }} />;
  }

  return (
    <AuthShell>
      {screen === 'login' && <LoginStep onSuccess={setSession} onForgot={() => setScreen('forgot')} onGoRegister={() => setScreen('register')} />}
      {screen === 'forgot' && <ForgotStep onBack={() => setScreen('login')} />}
      {screen === 'register' && <RegisterFlow onBack={() => setScreen('login')} onDone={() => setScreen('login')} />}
    </AuthShell>
  );
}
