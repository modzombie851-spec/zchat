import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, createProfile, checkUsernameTaken,
  searchByUsername, getProfile, updateProfile, sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia, deleteMessage,
} from './supabaseClient.js';

const G = {
  bgGradient: 'linear-gradient(160deg, #E9ECF5 0%, #F6EFF2 45%, #ECEAF7 100%)',
  glass: 'rgba(255,255,255,0.6)',
  border: 'rgba(255,255,255,0.6)',
  ink: '#1C1D21',
  muted: '#6B6E76',
  blue: '#0A84FF',
  gold: '#E8B04B',
  red: '#FF453A',
  green: '#30D158',
  bubbleMe: 'rgba(10,132,255,0.14)',
  bubbleThem: 'rgba(255,255,255,0.8)',
};

const glass = (extra = {}) => ({
  background: G.glass,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${G.border}`,
  ...extra,
});

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
const MAX_CHARS = 1000;

function inputStyle() {
  return {
    width: '100%', padding: '13px 14px', borderRadius: 13,
    border: '1px solid rgba(0,0,0,0.08)', fontSize: 16, outline: 'none',
    boxSizing: 'border-box', background: 'rgba(255,255,255,0.85)', color: G.ink,
  };
}
function primaryBtn(disabled, color = G.blue) {
  return {
    width: '100%', padding: '14px', borderRadius: 13, border: 'none',
    background: disabled ? 'rgba(0,0,0,0.15)' : color, color: 'white',
    fontSize: 15.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer', marginTop: 14,
  };
}
function ghostBtn() {
  return { background: 'none', border: 'none', color: G.blue, fontSize: 13.5, cursor: 'pointer', padding: 0, fontWeight: 500 };
}

function Spinner({ size = 16, color = 'white' }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, border: `2px solid ${color}40`,
      borderTopColor: color, borderRadius: '50%', animation: 'zchat-spin 0.7s linear infinite',
    }} />
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @keyframes zchat-spin { to { transform: rotate(360deg); } }
      @keyframes zchat-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .zchat-fade { animation: zchat-fade 0.25s ease; }
    `}</style>
  );
}

function Avatar({ emoji = '🙂', online, size = 40 }) {
  const isImage = typeof emoji === 'string' && emoji.startsWith('http');
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: isImage ? 'transparent' : 'linear-gradient(135deg, #C9CEDC, #A9B3D6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.5)',
        overflow: 'hidden',
      }}>
        {isImage ? <img src={emoji} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : emoji}
      </div>
      {online != null && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: online ? G.green : '#B9BCC3', border: '2px solid white',
        }} />
      )}
    </div>
  );
}

function AuthShell({ children }) {
  return (
    <div style={{
      height: '100dvh', width: '100vw', background: G.bgGradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: 20, boxSizing: 'border-box', overflowY: 'auto',
    }}>
      <GlobalStyle />
      <div style={{ width: '100%', maxWidth: 380 }} className="zchat-fade">
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: G.ink, letterSpacing: 0.3 }}>ZChat</div>
          <div style={{ color: G.muted, fontSize: 13.5, marginTop: 4 }}>Message people, your way.</div>
        </div>
        <div style={glass({ borderRadius: 24, padding: 28, boxShadow: '0 12px 40px rgba(31,38,71,0.14)' })}>
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
    if (!valid || loading) return;
    setLoading(true); setErr('');
    const { data, error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) { setErr('Incorrect email or password.'); return; }
    onSuccess(data.session);
  };

  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 18, color: G.ink }}>Welcome back</div>
      <input style={{ ...inputStyle(), marginBottom: 10 }} placeholder="Email" autoCapitalize="none"
        value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div style={{ position: 'relative' }}>
        <input style={inputStyle()} type={showPw ? 'text' : 'password'} placeholder="Password"
          value={password} onChange={(e) => setPasswordVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <div onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 13, top: 14, cursor: 'pointer', color: G.muted }}>
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 9 }}>
        <span style={ghostBtn()} onClick={onForgot}>Forgot password?</span>
      </div>
      {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }} className="zchat-fade">{err}</div>}
      <button style={primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Sign in'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: G.muted }}>
        New here? <span style={ghostBtn()} onClick={onGoRegister}>Create an account</span>
      </div>
    </div>
  );
}

function ForgotStep({ onBack }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    await sendPasswordReset(email);
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{ textAlign: 'center' }} className="zchat-fade">
        <Mail size={32} color={G.blue} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 700, fontSize: 16.5, marginBottom: 6, color: G.ink }}>Check your inbox</div>
        <div style={{ fontSize: 13.5, color: G.muted, marginBottom: 20, lineHeight: 1.5 }}>
          We sent a reset link to<br /><strong>{email}</strong>
        </div>
        <span style={ghostBtn()} onClick={onBack}>Back to sign in</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6, color: G.ink }}>Reset your password</div>
      <div style={{ fontSize: 13, color: G.muted, marginBottom: 16 }}>We'll email you a secure link.</div>
      <input style={inputStyle()} placeholder="Email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button style={primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Send reset link'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span style={ghostBtn()} onClick={onBack}>Back to sign in</span>
      </div>
    </div>
  );
}

function ResendRow({ onResend }) {
  const CODE_LIFETIME = 120;
  const RESEND_COOLDOWN = 30;
  const [secondsLeft, setSecondsLeft] = useState(CODE_LIFETIME);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (total) => `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;

  const handleResend = async () => {
    setSending(true);
    await onResend();
    setSending(false);
    setSecondsLeft(CODE_LIFETIME);
    setCooldown(RESEND_COOLDOWN);
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2500);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: 18 }}>
      <div style={{ fontSize: 12, color: secondsLeft <= 20 ? G.red : G.muted, fontWeight: secondsLeft <= 20 ? 600 : 400 }}>
        {secondsLeft > 0 ? `Code expires in ${fmt(secondsLeft)}` : 'Code expired — request a new one'}
      </div>
      <div style={{ marginTop: 8, minHeight: 18 }}>
        {justSent ? (
          <span style={{ fontSize: 12.5, color: G.green, fontWeight: 600 }}>New code sent ✓</span>
        ) : cooldown > 0 ? (
          <span style={{ fontSize: 12.5, color: G.muted }}>Resend code in {cooldown}s</span>
        ) : (
          <span style={ghostBtn()} onClick={sending ? undefined : handleResend}>
            {sending ? 'Sending...' : 'Resend code'}
          </span>
        )}
      </div>
    </div>
  );
}

function RegisterFlow({ onDone, onBack, onStart }) {
  const [stage, setStage] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [taken, setTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const usernameTimer = useRef(null);

  const sendCode = async () => {
    setLoading(true); setErr('');
    const { error } = await registerWithEmail(email);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage('otp');
  };

  const verify = async () => {
    if (code.length < 6 || loading) return;
    setLoading(true); setErr('');
    const { error } = await verifyOtp(email, code);
    setLoading(false);
    if (error) { setErr('Incorrect or expired code.'); return; }
    onStart();
    setStage('password');
  };

  const savePw = async () => {
    if (pw.length < 6 || pw !== pw2) { setErr('Passwords must match and be at least 6 characters.'); return; }
    setLoading(true); setErr('');
    const { error } = await setPassword(pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage('username');
  };

  const checkUsername = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
    setUsername(clean);
    setTaken(false);
    clearTimeout(usernameTimer.current);
    if (clean.length >= 3) {
      setCheckingUsername(true);
      usernameTimer.current = setTimeout(async () => {
        const { taken } = await checkUsernameTaken(clean);
        setTaken(taken);
        setCheckingUsername(false);
      }, 400);
    }
  };

  const finish = async () => {
    setLoading(true); setErr('');
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session.user.id;
    const { error } = await createProfile(userId, username.toLowerCase(), name.trim());
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onDone();
  };

  const StepDots = ({ active }) => (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
      {['email', 'otp', 'password', 'username'].map((s) => (
        <div key={s} style={{
          width: s === active ? 16 : 6, height: 6, borderRadius: 3,
          background: s === active ? G.blue : 'rgba(0,0,0,0.12)', transition: 'all 0.2s',
        }} />
      ))}
    </div>
  );

  if (stage === 'email') {
    const valid = /\S+@\S+\.\S+/.test(email);
    return (
      <div className="zchat-fade">
        <StepDots active="email" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Mail size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Create your account</span>
        </div>
        <input style={inputStyle()} placeholder="you@example.com" autoCapitalize="none"
          value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendCode()} />
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(!valid || loading)} disabled={!valid || loading} onClick={sendCode}>
          {loading ? <Spinner /> : 'Send code'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}><span style={ghostBtn()} onClick={onBack}>Back to sign in</span></div>
      </div>
    );
  }

  if (stage === 'otp') {
    return (
      <div className="zchat-fade">
        <StepDots active="otp" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ShieldCheck size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Enter the code sent to</span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 14, color: G.ink }}>{email}</div>
        <input style={{ ...inputStyle(), letterSpacing: 6, fontSize: 22, textAlign: 'center', fontWeight: 600 }}
          placeholder="••••••••" maxLength={8} inputMode="numeric"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && verify()} />
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8, textAlign: 'center' }} className="zchat-fade">{err}</div>}
        <button style={primaryBtn(code.length < 6 || loading)} disabled={code.length < 6 || loading} onClick={verify}>
          {loading ? <Spinner /> : 'Verify'}
        </button>
        <ResendRow onResend={sendCode} />
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span style={{ ...ghostBtn(), color: G.muted }} onClick={() => setStage('email')}>Use a different email</span>
        </div>
      </div>
    );
  }

  if (stage === 'password') {
    const okPw = pw.length >= 6 && pw === pw2;
    return (
      <div className="zchat-fade">
        <StepDots active="password" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Lock size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Create a password</span>
        </div>
        <input style={{ ...inputStyle(), marginBottom: 10 }} type="password" placeholder="Password (min 6 characters)"
          value={pw} onChange={(e) => setPw(e.target.value)} />
        <input style={inputStyle()} type="password" placeholder="Confirm password"
          value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && savePw()} />
        {pw2 && !okPw && pw !== pw2 && <div style={{ color: G.red, fontSize: 12, marginTop: 8 }}>Passwords don't match</div>}
        {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(!okPw || loading)} disabled={!okPw || loading} onClick={savePw}>
          {loading ? <Spinner /> : 'Continue'}
        </button>
      </div>
    );
  }

  const validU = /^[a-z0-9._]{3,20}$/.test(username);
  const validN = name.trim().length >= 2;
  const canFinish = validU && validN && !taken && !checkingUsername;
  return (
    <div className="zchat-fade">
      <StepDots active="username" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AtSign size={18} color={G.muted} /><span style={{ fontSize: 13.5, color: G.muted }}>Choose your identity</span>
      </div>
      <input style={{ ...inputStyle(), marginBottom: 10 }} placeholder="Full name"
        value={name} onChange={(e) => setName(e.target.value)} />
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: 13, color: G.muted, fontSize: 16 }}>@</span>
        <input style={{ ...inputStyle(), paddingLeft: 26 }} placeholder="username" autoCapitalize="none"
          value={username} onChange={(e) => checkUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && canFinish && finish()} />
      </div>
      <div style={{ minHeight: 18, marginTop: 8 }}>
        {username.length > 0 && username.length < 3 && (
          <div style={{ fontSize: 12, color: G.muted }}>At least 3 characters</div>
        )}
        {username.length >= 3 && !validU && (
          <div style={{ fontSize: 12, color: G.red }}>Only letters, numbers, dot, underscore</div>
        )}
        {validU && checkingUsername && <div style={{ fontSize: 12, color: G.muted }}>Checking...</div>}
        {validU && !checkingUsername && taken && <div style={{ fontSize: 12, color: G.red }}>That username is taken</div>}
        {validU && !checkingUsername && !taken && <div style={{ fontSize: 12, color: G.green }}>@{username} is available</div>}
      </div>
      {err && <div style={{ color: G.red, fontSize: 12.5, marginTop: 4 }}>{err}</div>}
      <button style={primaryBtn(!canFinish || loading)} disabled={!canFinish || loading} onClick={finish}>
        {loading ? <Spinner /> : 'Finish'}
      </button>
    </div>
  );
}

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

function ProfilePanel({ profile, isSelf, userId, onClose, onReport, onSaved }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🙂');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { url, error } = await uploadMedia(file, userId);
    e.target.value = '';
    if (!error && url) setAvatar(url);
    setAvatarUploading(false);
  };

  const save = async () => {
    setSaving(true);
    const { data } = await updateProfile(profile.id, { bio, gender, avatar });
    setSaving(false);
    if (data) { onSaved(data); setEditing(false); }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(28,29,33,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 18,
    }} className="zchat-fade">
      <div style={glass({
        background: 'rgba(255,255,255,0.9)', borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 340, position: 'relative', maxHeight: '85vh', overflowY: 'auto',
      })}>
        <X size={20} style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer', color: G.muted }} onClick={onClose} />
        <div style={{ textAlign: 'center' }}>
          {editing ? (
            <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto' }}>
              <Avatar emoji={avatar} size={76} />
              <label style={{
                position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%',
                background: G.blue, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid white',
              }}>
                {avatarUploading ? <Spinner size={12} /> : <ImageIcon size={13} color="white" />}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
          ) : (
            <Avatar emoji={profile.avatar} online={profile.online} size={76} />
          )}
          <div style={{ fontWeight: 700, fontSize: 19, marginTop: 12, color: G.ink }}>{profile.name}</div>
          <div style={{ fontSize: 13.5, color: G.muted }}>@{profile.username}</div>

          {isSelf && !editing && (
            <button onClick={() => setEditing(true)} style={{
              marginTop: 14, padding: '8px 18px', borderRadius: 20, border: `1px solid rgba(0,0,0,0.1)`,
              background: 'rgba(0,0,0,0.03)', fontSize: 12.5, fontWeight: 600, color: G.ink, cursor: 'pointer',
            }}>
              Edit profile
            </button>
          )}

          {editing ? (
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 4, fontWeight: 600 }}>BIO</div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 140))}
                placeholder="Tell people about yourself"
                style={{ ...inputStyle(), height: 64, resize: 'none', fontFamily: 'inherit', marginBottom: 12 }} />
              <div style={{ fontSize: 12, color: G.muted, marginBottom: 4, fontWeight: 600 }}>GENDER</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {GENDERS.map((g) => (
                  <div key={g} onClick={() => setGender(g)} style={{
                    padding: '6px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                    background: gender === g ? G.blue : 'rgba(0,0,0,0.05)',
                    color: gender === g ? 'white' : G.muted, fontWeight: 500,
                  }}>{g}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{ ...primaryBtn(false, 'rgba(0,0,0,0.08)'), color: G.ink, marginTop: 0, flex: 1 }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ ...primaryBtn(saving), marginTop: 0, flex: 1 }}>
                  {saving ? <Spinner /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: G.ink }}>{profile.followers ?? 0}</div>
                  <div style={{ fontSize: 11, color: G.muted }}>Followers</div>
                </div>
                {profile.gender && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: G.ink }}>{profile.gender}</div>
                    <div style={{ fontSize: 11, color: G.muted }}>Gender</div>
                  </div>
                )}
              </div>
              {profile.bio && <div style={{ fontSize: 13.5, color: G.ink, marginTop: 16, lineHeight: 1.5 }}>{profile.bio}</div>}
              {isSelf && (
                <div style={{ fontSize: 11.5, color: G.muted, marginTop: 16, padding: '8px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 10 }}>
                  {profile.email || 'Email hidden'} <span style={{ color: '#B3ADA0' }}>· only you can see this</span>
                </div>
              )}
            </>
          )}

          {!isSelf && !editing && !reportSent && !reportOpen && (
            <button onClick={() => setReportOpen(true)} style={{
              marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              width: '100%', padding: 11, borderRadius: 12, border: 'none', background: 'rgba(255,69,58,0.1)',
              color: G.red, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              <Flag size={14} /> Report this account
            </button>
          )}
          {!isSelf && reportOpen && !reportSent && (
            <div style={{ marginTop: 16, textAlign: 'left' }} className="zchat-fade">
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                placeholder="What's going on with this account?"
                style={{ ...inputStyle(), height: 64, resize: 'none', fontFamily: 'inherit' }} />
              <button disabled={!reportReason.trim()} style={primaryBtn(!reportReason.trim(), G.red)}
                onClick={() => { onReport(profile, reportReason); setReportSent(true); }}>
                Send report
              </button>
            </div>
          )}
          {reportSent && (
            <div style={{ marginTop: 16, fontSize: 12.5, color: G.green, fontWeight: 600 }} className="zchat-fade">
              Report sent. Thanks for flagging this.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusTicks({ status }) {
  const color = status === 'read' ? G.blue : '#A9ACB3';
  if (status === 'sent') return <Check size={14} color={color} />;
  return <CheckCheck size={14} color={color} />;
}

function MessageBubble({ m, isMe, onDelete }) {
  const [hover, setHover] = useState(false);
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 6, marginBottom: 8 }}
      onTouchStart={() => setHover(true)}
    >
      {isMe && !m.deleted && (
        <Trash2 size={14} color={G.muted} style={{ cursor: 'pointer', flexShrink: 0, opacity: hover ? 1 : 0.35, transition: 'opacity 0.15s' }}
          onClick={() => onDelete(m.id)} />
      )}
      <div style={glass({
        maxWidth: '72%',
        background: m.deleted ? 'rgba(0,0,0,0.04)' : (isMe ? G.bubbleMe : G.bubbleThem),
        borderRadius: 16,
        padding: m.type === 'text' || m.deleted ? '9px 13px' : 5,
        border: m.deleted ? '1px dashed rgba(0,0,0,0.1)' : `1px solid ${G.border}`,
      })}>
        {m.deleted ? (
          <div style={{ fontSize: 13, color: G.muted, fontStyle: 'italic' }}>This message was deleted</div>
        ) : (
          <>
            {m.type === 'image' && <img src={m.media_url} alt="" style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2 }} />}
            {m.type === 'video' && <video src={m.media_url} controls style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2, background: '#000' }} />}
            {m.content && <div style={{ fontSize: 15, color: G.ink, padding: m.type !== 'text' ? '0 4px' : 0, wordBreak: 'break-word', lineHeight: 1.4 }}>{m.content}</div>}
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3, padding: m.type !== 'text' && !m.deleted ? '0 4px 2px' : 0 }}>
          <span style={{ fontSize: 10.5, color: G.muted }}>{time}</span>
          {isMe && !m.deleted && <StatusTicks status="delivered" />}
        </div>
      </div>
    </div>
  );
}

function ChatApp({ session, onLogout }) {
  const [me, setMe] = useState(null);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [profileOf, setProfileOf] = useState(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const scrollRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    getProfile(session.user.id).then(({ data }) => setMe(data ? { ...data, email: session.user.email } : null));
  }, []);

  useEffect(() => {
    if (!me) return;
    const sub = subscribeToMessages(me.id, (msg) => {
      setMessages((prev) => (activeProfile && msg.sender_id === activeProfile.id ? [...prev, msg] : prev));
    });
    return () => supabase.removeChannel(sub);
  }, [me, activeProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeProfile]);

  const doSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const { data } = await searchByUsername(val.trim());
      setResults((data || []).filter((u) => u.id !== session.user.id));
      setSearching(false);
    }, 300);
  };

  const openChat = async (profile) => {
    setActiveProfile(profile);
    setMobileShowChat(true);
    setLoadingConvo(true);
    const { data } = await getConversation(session.user.id, profile.id);
    setMessages(data || []);
    setLoadingConvo(false);
  };

  const send = async () => {
    if (!draft.trim() || !activeProfile) return;
    const text = draft.trim().slice(0, MAX_CHARS);
    setDraft('');
    const { data } = await sendMessage(session.user.id, activeProfile.id, 'text', text, null);
    if (data) setMessages((prev) => [...prev, data]);
  };

  const handleFile = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file || !activeProfile) return;
    setUploading(true);
    const { url, error } = await uploadMedia(file, session.user.id);
    e.target.value = '';
    setShowAttach(false);
    if (!error && url) {
      const { data } = await sendMessage(session.user.id, activeProfile.id, kind, null, url);
      if (data) setMessages((prev) => [...prev, data]);
    }
    setUploading(false);
  };

  const handleDelete = async (messageId) => {
    const { data } = await deleteMessage(messageId);
    if (data) setMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)));
  };

  const handleReport = async (profile, reason) => {
    await reportUser(session.user.id, profile.id, reason);
  };

  if (!me) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.bgGradient }}>
        <Spinner size={28} color={G.ink} />
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: FONT, height: '100dvh', width: '100vw', background: G.bgGradient,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 14, boxSizing: 'border-box',
    }}>
      <GlobalStyle />
      <div style={glass({
        width: '100%', maxWidth: 960, height: '100%', maxHeight: 860, display: 'flex',
        borderRadius: 26, overflow: 'hidden', boxShadow: '0 24px 70px rgba(31,38,71,0.2)',
        background: 'rgba(255,255,255,0.45)', position: 'relative',
      })}>
        {profileOf && (
          <ProfilePanel
            profile={profileOf.id === me.id ? me : profileOf}
            isSelf={profileOf.id === me.id}
            userId={session.user.id}
            onClose={() => setProfileOf(null)}
            onReport={handleReport}
            onSaved={(updated) => { setMe(updated.id === me.id ? { ...updated, email: me.email } : me); if (activeProfile?.id === updated.id) setActiveProfile(updated); }}
          />
        )}

        <div style={{
          width: 320, minWidth: 320, display: mobileShowChat ? 'none' : 'flex',
          flexDirection: 'column', borderRight: `1px solid ${G.border}`,
        }} className="zchat-sidebar">
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setProfileOf(me)}>
                <Avatar emoji={me.avatar} size={38} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: G.ink }}>{me.name}</div>
                  <div style={{ fontSize: 11.5, color: G.muted }}>@{me.username}</div>
                </div>
              </div>
              <LogOut size={18} style={{ cursor: 'pointer', color: G.muted }} onClick={onLogout} />
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} color={G.muted} style={{ position: 'absolute', left: 13, top: 12 }} />
              <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Find by username" autoCapitalize="none"
                style={{ ...inputStyle(), padding: '10px 12px 10px 36px', background: 'rgba(255,255,255,0.75)' }} />
              {searching && <div style={{ position: 'absolute', right: 13, top: 12 }}><Spinner size={14} color={G.muted} /></div>}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
            {search.length >= 2 && !searching && results.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: G.muted, fontSize: 13 }}>No one found with that username</div>
            )}
            {search.length < 2 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: G.muted, fontSize: 12.5, lineHeight: 1.6 }}>
                Search a username above to start a new conversation
              </div>
            )}
            {results.map((u) => (
              <div key={u.id} onClick={() => openChat(u)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', cursor: 'pointer',
                borderRadius: 14, marginBottom: 2,
                background: activeProfile?.id === u.id ? 'rgba(255,255,255,0.6)' : 'transparent',
              }}>
                <Avatar emoji={u.avatar} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: G.ink }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: G.muted }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="zchat-panel">
          {!activeProfile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: G.muted, fontSize: 14, textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              Search a username on the left<br />to start a conversation
            </div>
          ) : (
            <>
              <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${G.border}`, cursor: 'pointer' }}
                onClick={() => setProfileOf(activeProfile)}>
                <ArrowLeft size={20} style={{ cursor: 'pointer', display: 'none' }} className="zchat-back"
                  onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }} />
                <Avatar emoji={activeProfile.avatar} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: G.ink }}>{activeProfile.name}</div>
                  <div style={{ fontSize: 12, color: G.muted }}>@{activeProfile.username}</div>
                </div>
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
                {loadingConvo ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}><Spinner color={G.ink} /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: G.muted, marginTop: 40, fontSize: 13.5 }}>No messages yet. Say hi 👋</div>
                ) : (
                  messages.map((m) => <MessageBubble key={m.id} m={m} isMe={m.sender_id === session.user.id} onDelete={handleDelete} />)
                )}
              </div>
              {showAttach && (
                <div style={{ display: 'flex', gap: 18, padding: '12px 20px', borderTop: `1px solid ${G.border}` }} className="zchat-fade">
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: G.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={22} color={G.ink} />
                    </div>
                    <span style={{ fontSize: 11.5, color: G.muted }}>Photo</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: G.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <VideoIcon size={22} color="white" />
                    </div>
                    <span style={{ fontSize: 11.5, color: G.muted }}>Video</span>
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'video')} />
                  </label>
                </div>
              )}
              <div style={{ padding: '10px 14px', borderTop: `1px solid ${G.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={21} color={G.muted} style={{ cursor: 'pointer', transform: showAttach ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                    onClick={() => setShowAttach((s) => !s)} />
                  <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                    placeholder={uploading ? 'Uploading...' : 'Type a message'} disabled={uploading}
                    style={{ ...inputStyle(), flex: 1, borderRadius: 22, padding: '11px 16px' }} />
                  <button onClick={send} disabled={!draft.trim()} style={{
                    width: 42, height: 42, borderRadius: '50%', background: draft.trim() ? G.blue : 'rgba(0,0,0,0.1)',
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0,
                  }}>
                    <Send size={18} color="white" />
                  </button>
                </div>
                <div style={{ textAlign: 'right', fontSize: 10.5, color: draft.length > MAX_CHARS - 50 ? G.red : G.muted, marginTop: 4, paddingRight: 4 }}>
                  {draft.length}/{MAX_CHARS}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .zchat-sidebar { width: 100% !important; min-width: 100% !important; }
          .zchat-panel { display: ${mobileShowChat ? 'flex' : 'none'} !important; }
          .zchat-back { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState('login');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: G.bgGradient }}>
        <Spinner size={28} color={G.ink} />
      </div>
    );
  }

  if (session && !registering) {
    return <ChatApp session={session} onLogout={async () => { await signOut(); setSession(null); setScreen('login'); }} />;
  }

  return (
    <AuthShell>
      {screen === 'login' && <LoginStep onSuccess={setSession} onForgot={() => setScreen('forgot')} onGoRegister={() => setScreen('register')} />}
      {screen === 'forgot' && <ForgotStep onBack={() => setScreen('login')} />}
      {screen === 'register' && (
        <RegisterFlow
          onStart={() => setRegistering(true)}
          onBack={() => { setRegistering(false); setScreen('login'); }}
          onDone={() => setRegistering(false)}
        />
      )}
    </AuthShell>
  );
}
