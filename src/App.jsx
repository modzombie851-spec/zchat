import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, Compass, Bell, Volume2, VolumeX, Palette, Mic, Play, Pause, Download,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, createProfile, checkUsernameTaken,
  searchByUsername, getProfile, updateProfile, sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia, deleteMessage,
} from './supabaseClient.js';

/* ============================= THEME ============================= */

const ACCENT_PALETTES = {
  coral: { coral: '#FF6B4A', coralDeep: '#E8502F', gold: '#F3B54C', teal: '#29C7B3', danger: '#FF4D5E' },
  ocean: { coral: '#3DA5F5', coralDeep: '#2178C9', gold: '#5FD9C4', teal: '#29C7B3', danger: '#FF4D5E' },
  berry: { coral: '#C15CFC', coralDeep: '#9B3AE0', gold: '#FF8AC2', teal: '#29C7B3', danger: '#FF4D5E' },
};
const ACCENT = ACCENT_PALETTES.coral;

const THEMES = {
  light: {
    bgGradient: 'linear-gradient(160deg, #F6F3EE 0%, #FBF3EF 45%, #F3EEF6 100%)',
    glass: 'rgba(255,255,255,0.65)',
    panelBg: 'rgba(255,255,255,0.92)',
    border: 'rgba(27,27,31,0.08)',
    ink: '#1B1B1F',
    muted: '#83808A',
    bubbleMe: '#FFE3D9',
    bubbleThem: 'rgba(255,255,255,0.9)',
    inputBg: 'rgba(255,255,255,0.9)',
    rowBg: 'rgba(0,0,0,0.03)',
  },
  dark: {
    bgGradient: 'linear-gradient(160deg, #121319 0%, #16171F 45%, #1A1720 100%)',
    glass: 'rgba(30,31,40,0.65)',
    panelBg: 'rgba(24,26,34,0.96)',
    border: 'rgba(255,255,255,0.08)',
    ink: '#F2F1F6',
    muted: '#8D8FA0',
    bubbleMe: '#3A2A34',
    bubbleThem: '#23252F',
    inputBg: 'rgba(255,255,255,0.06)',
    rowBg: 'rgba(255,255,255,0.04)',
  },
};

const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('zchat-theme') === 'dark'; } catch { return false; }
  });
  const [accentName, setAccentName] = useState(() => {
    try { return localStorage.getItem('zchat-accent') || 'coral'; } catch { return 'coral'; }
  });
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('zchat-sound') !== 'off'; } catch { return true; }
  });
  const [bgPatternOn, setBgPatternOn] = useState(() => {
    try { return localStorage.getItem('zchat-bgpattern') === 'on'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('zchat-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  useEffect(() => {
    try { localStorage.setItem('zchat-accent', accentName); } catch {}
  }, [accentName]);
  useEffect(() => {
    try { localStorage.setItem('zchat-sound', soundOn ? 'on' : 'off'); } catch {}
  }, [soundOn]);
  useEffect(() => {
    try { localStorage.setItem('zchat-bgpattern', bgPatternOn ? 'on' : 'off'); } catch {}
  }, [bgPatternOn]);
  const accent = ACCENT_PALETTES[accentName] || ACCENT_PALETTES.coral;
  const theme = { ...THEMES[dark ? 'dark' : 'light'], ...accent, dark };
  return (
    <ThemeContext.Provider value={{ theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, bgPatternOn, setBgPatternOn }}>
      {children}
    </ThemeContext.Provider>
  );
}

const glass = (theme, extra = {}) => ({
  background: theme.glass,
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  border: `1px solid ${theme.border}`,
  ...extra,
});

const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const MAX_CHARS = 1000;

function inputStyle(theme) {
  return {
    width: '100%', padding: '13px 14px', borderRadius: 13,
    border: `1px solid ${theme.border}`, fontSize: 16, outline: 'none',
    boxSizing: 'border-box', background: theme.inputBg, color: theme.ink, fontFamily: FONT,
  };
}
function primaryBtn(theme, disabled, color) {
  return {
    width: '100%', padding: '14px', borderRadius: 15, border: 'none',
    background: disabled ? (theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)') : (color || theme.coral),
    color: 'white', fontFamily: FONT,
    fontSize: 15.5, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', marginTop: 14,
    boxShadow: disabled ? 'none' : `0 10px 22px ${(color || theme.coral)}40`,
  };
}
function ghostBtn(theme) {
  return { background: 'none', border: 'none', color: theme.coralDeep, fontSize: 13.5, cursor: 'pointer', padding: 0, fontWeight: 700, fontFamily: FONT };
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
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      @keyframes zchat-spin { to { transform: rotate(360deg); } }
      @keyframes zchat-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes zchat-heart-burst { 0% { opacity: 0; transform: scale(0.3); } 30% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(1.6); } }
      .zchat-fade { animation: zchat-fade 0.25s ease; }
      * { font-family: ${FONT}; }
    `}</style>
  );
}

function ThemeToggleIcon({ size = 18 }) {
  const { dark, setDark } = useTheme();
  return (
    <div onClick={() => setDark((d) => !d)} style={{
      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}>
      {dark ? <Sun size={size} color="#F2F1F6" /> : <Moon size={size} color="#1B1B1F" />}
    </div>
  );
}

const AVATAR_COLORS = ['#FF6B4A', '#29C7B3', '#7C5CFC', '#F3B54C', '#FF4D8D', '#3DA5F5', '#4CC98A', '#E85B81'];
function colorForName(name) {
  let hash = 0;
  const str = name || '?';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* WhatsApp-style: real photo if uploaded, otherwise a colored circle with the first initial */
function Avatar({ emoji, name = '', online, size = 40 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = typeof emoji === 'string' && emoji.startsWith('http') && !imgFailed;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: isImage ? 'transparent' : colorForName(name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 800, color: 'white', fontFamily: FONT,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
        overflow: 'hidden',
      }}>
        {isImage
          ? <img src={emoji} alt="" onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initial}
      </div>
      {online != null && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: online ? '#31D158' : '#B9BCC3', border: '2px solid white',
        }} />
      )}
    </div>
  );
}

function AuthShell({ children }) {
  const { theme } = useTheme();
  return (
    <div style={{
      height: '100dvh', width: '100vw', background: theme.bgGradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: 20, boxSizing: 'border-box', overflowY: 'auto', position: 'relative',
    }}>
      <GlobalStyle />
      <div style={{ position: 'absolute', top: 18, right: 18 }}><ThemeToggleIcon /></div>
      <div style={{ width: '100%', maxWidth: 380 }} className="zchat-fade">
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 32, color: theme.ink, letterSpacing: 0.3 }}>ZChat</div>
          <div style={{ color: theme.muted, fontSize: 13.5, marginTop: 4 }}>Message people, your way.</div>
        </div>
        <div style={glass(theme, { borderRadius: 26, padding: 28, boxShadow: '0 12px 40px rgba(31,20,15,0.14)' })}>
          {children}
        </div>
      </div>
    </div>
  );
}

function LoginStep({ onSuccess, onForgot, onGoRegister }) {
  const { theme } = useTheme();
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
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 18, color: theme.ink }}>Welcome back</div>
      <input style={{ ...inputStyle(theme), marginBottom: 10 }} placeholder="Email" autoCapitalize="none"
        value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div style={{ position: 'relative' }}>
        <input style={inputStyle(theme)} type={showPw ? 'text' : 'password'} placeholder="Password"
          value={password} onChange={(e) => setPasswordVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <div onClick={() => setShowPw((s) => !s)} style={{ position: 'absolute', right: 13, top: 14, cursor: 'pointer', color: theme.muted }}>
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: 9 }}>
        <span style={ghostBtn(theme)} onClick={onForgot}>Forgot password?</span>
      </div>
      {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }} className="zchat-fade">{err}</div>}
      <button style={primaryBtn(theme, !valid || loading)} disabled={!valid || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Sign in'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: theme.muted }}>
        New here? <span style={ghostBtn(theme)} onClick={onGoRegister}>Create an account</span>
      </div>
    </div>
  );
}

function ForgotStep({ onBack }) {
  const { theme } = useTheme();
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
        <Mail size={32} color={theme.coral} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 800, fontSize: 16.5, marginBottom: 6, color: theme.ink }}>Check your inbox</div>
        <div style={{ fontSize: 13.5, color: theme.muted, marginBottom: 20, lineHeight: 1.5 }}>
          We sent a reset link to<br /><strong style={{ color: theme.ink }}>{email}</strong>
        </div>
        <span style={ghostBtn(theme)} onClick={onBack}>Back to sign in</span>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, color: theme.ink }}>Reset your password</div>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>We'll email you a secure link.</div>
      <input style={inputStyle(theme)} placeholder="Email" autoCapitalize="none" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button style={primaryBtn(theme, !valid || loading)} disabled={!valid || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Send reset link'}
      </button>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <span style={ghostBtn(theme)} onClick={onBack}>Back to sign in</span>
      </div>
    </div>
  );
}

/* ============================= OTP ============================= */

function OtpBoxes({ value, onChange, onSubmit }) {
  const { theme } = useTheme();
  const refs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const setDigit = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[idx] = clean;
    const joined = next.join('');
    onChange(joined);
    if (clean && idx < 5) refs.current[idx + 1]?.focus();
    if (joined.replace(/\D/g, '').length === 6) onSubmit(joined);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'Enter') onSubmit(value);
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text) { e.preventDefault(); onChange(text); if (text.length === 6) onSubmit(text); }
  };

  return (
    <div style={{ display: 'flex', gap: '2.5%', justifyContent: 'space-between', width: '100%' }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} maxLength={1} inputMode="numeric" value={d}
          onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste}
          style={{
            flex: '1 1 0', minWidth: 0, maxWidth: 48, aspectRatio: '1 / 1.15', textAlign: 'center', fontSize: '5.5vw', fontWeight: 800,
            borderRadius: 14, border: `1.5px solid ${theme.border}`, background: theme.inputBg,
            color: theme.ink, outline: 'none', fontFamily: FONT, boxSizing: 'border-box', padding: 0,
          }} />
      ))}
    </div>
  );
}

function ResendRow({ onResend }) {
  const { theme } = useTheme();
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
      <div style={{ fontSize: 12, color: secondsLeft <= 20 ? theme.danger : theme.muted, fontWeight: secondsLeft <= 20 ? 700 : 500 }}>
        {secondsLeft > 0 ? `Expires in ${fmt(secondsLeft)}` : 'Code expired'}
      </div>
      <div style={{ minHeight: 18 }}>
        {justSent ? (
          <span style={{ fontSize: 12.5, color: theme.teal, fontWeight: 700 }}>Sent</span>
        ) : cooldown > 0 ? (
          <span style={{ fontSize: 12.5, color: theme.muted }}>Resend in {cooldown}s</span>
        ) : (
          <span style={ghostBtn(theme)} onClick={sending ? undefined : handleResend}>
            {sending ? 'Sending...' : 'Resend code'}
          </span>
        )}
      </div>
    </div>
  );
}

function RegisterFlow({ onDone, onBack, onStart }) {
  const { theme } = useTheme();
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
  const [newUserId, setNewUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const usernameTimer = useRef(null);

  const sendCode = async () => {
    setLoading(true); setErr('');
    const { error } = await registerWithEmail(email);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStage('otp');
  };

  const verify = async (codeOverride) => {
    const c = codeOverride ?? code;
    if (c.length < 6 || loading) return;
    setLoading(true); setErr('');
    const { error } = await verifyOtp(email, c);
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
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('unique') || error.code === '23505') {
        setErr('That username was just taken. Try a different one.');
      } else {
        setErr(error.message);
      }
      return;
    }
    setNewUserId(userId);
    setStage('avatar');
  };

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) setCropFile(file);
  };

  const uploadCroppedAvatar = async (blob) => {
    setCropFile(null);
    setAvatarUploading(true);
    const namedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const { url, error } = await uploadMedia(namedFile, newUserId);
    if (!error && url) setAvatarUrl(url);
    setAvatarUploading(false);
  };

  const finishOnboarding = async () => {
    if (avatarUrl && newUserId) await updateProfile(newUserId, { avatar: avatarUrl });
    onDone();
  };

  const StepDots = ({ active }) => (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
      {['email', 'otp', 'password', 'username', 'avatar'].map((s) => (
        <div key={s} style={{
          width: s === active ? 16 : 6, height: 6, borderRadius: 3,
          background: s === active ? theme.coral : theme.border, transition: 'all 0.2s',
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
          <Mail size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Create your account</span>
        </div>
        <input style={inputStyle(theme)} placeholder="you@example.com" autoCapitalize="none"
          value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendCode()} />
        {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(theme, !valid || loading)} disabled={!valid || loading} onClick={sendCode}>
          {loading ? <Spinner /> : 'Send code'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 16 }}><span style={ghostBtn(theme)} onClick={onBack}>Back to sign in</span></div>
      </div>
    );
  }

  if (stage === 'otp') {
    return (
      <div className="zchat-fade">
        <StepDots active="otp" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ShieldCheck size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Enter the code sent to</span>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 16, color: theme.ink }}>{email}</div>
        <OtpBoxes value={code} onChange={setCode} onSubmit={verify} />
        {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 10, textAlign: 'center' }} className="zchat-fade">{err}</div>}
        <ResendRow onResend={sendCode} />
        <button style={primaryBtn(theme, code.length < 6 || loading)} disabled={code.length < 6 || loading} onClick={() => verify()}>
          {loading ? <Spinner /> : 'Verify'}
        </button>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <span style={{ ...ghostBtn(theme), color: theme.muted }} onClick={() => setStage('email')}>Use a different email</span>
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
          <Lock size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Create a password</span>
        </div>
        <input style={{ ...inputStyle(theme), marginBottom: 10 }} type="password" placeholder="Password (min 6 characters)"
          value={pw} onChange={(e) => setPw(e.target.value)} />
        <input style={inputStyle(theme)} type="password" placeholder="Confirm password"
          value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && savePw()} />
        {pw2 && !okPw && pw !== pw2 && <div style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>Passwords don't match</div>}
        {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button style={primaryBtn(theme, !okPw || loading)} disabled={!okPw || loading} onClick={savePw}>
          {loading ? <Spinner /> : 'Continue'}
        </button>
      </div>
    );
  }

  const validU = /^[a-z0-9._]{3,20}$/.test(username);
  const validN = name.trim().length >= 2;
  const canFinish = validU && validN && !taken && !checkingUsername;
  if (stage === 'username') {
    return (
      <div className="zchat-fade">
        <StepDots active="username" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <AtSign size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Choose your identity</span>
        </div>
        <input style={{ ...inputStyle(theme), marginBottom: 10 }} placeholder="Full name"
          value={name} onChange={(e) => setName(e.target.value)} />
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: 13, color: theme.muted, fontSize: 16 }}>@</span>
          <input style={{ ...inputStyle(theme), paddingLeft: 26 }} placeholder="username" autoCapitalize="none"
            value={username} onChange={(e) => checkUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && canFinish && finish()} />
        </div>
        <div style={{ minHeight: 18, marginTop: 8 }}>
          {username.length > 0 && username.length < 3 && (
            <div style={{ fontSize: 12, color: theme.muted }}>At least 3 characters</div>
          )}
          {username.length >= 3 && !validU && (
            <div style={{ fontSize: 12, color: theme.danger }}>Only letters, numbers, dot, underscore</div>
          )}
          {validU && checkingUsername && <div style={{ fontSize: 12, color: theme.muted }}>Checking...</div>}
          {validU && !checkingUsername && taken && <div style={{ fontSize: 12, color: theme.danger }}>That username is taken</div>}
          {validU && !checkingUsername && !taken && <div style={{ fontSize: 12, color: theme.teal }}>@{username} is available</div>}
        </div>
        {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 4 }}>{err}</div>}
        <button style={primaryBtn(theme, !canFinish || loading)} disabled={!canFinish || loading} onClick={finish}>
          {loading ? <Spinner /> : 'Finish'}
        </button>
      </div>
    );
  }

  return (
    <div className="zchat-fade">
      <StepDots active="avatar" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <ImageIcon size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Add a profile photo</span>
      </div>
      <div style={{ textAlign: 'center', margin: '10px 0 22px' }}>
        <div style={{ width: 100, height: 100, margin: '0 auto', position: 'relative' }}>
          <Avatar emoji={avatarUrl} name={name} size={100} />
          <label style={{
            position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: '50%',
            background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '3px solid white',
          }}>
            {avatarUploading ? <Spinner size={13} /> : <ImageIcon size={14} color="white" />}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarPick} />
          </label>
        </div>
      </div>
      <button style={primaryBtn(theme, avatarUploading)} disabled={avatarUploading} onClick={finishOnboarding}>
        {avatarUrl ? 'Continue' : 'Skip for now'}
      </button>
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={uploadCroppedAvatar} />}
    </div>
  );
}

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

/* ============================= Logout confirm modal ============================= */

function LogoutConfirm({ onCancel, onConfirm }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24,
    }} className="zchat-fade">
      <div style={{
        background: theme.panelBg, borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 280,
        textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
          background: `${theme.danger}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.danger,
        }}>
          <LogOut size={22} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: theme.ink }}>Log out of ZChat?</div>
        <div style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.5, color: theme.muted }}>
          You'll need to sign in again to see your messages.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, borderRadius: 13, border: 'none', background: theme.danger,
            color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Log out</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= Settings & Privacy panels ============================= */

function SettingsRow({ icon, label, onClick, danger, right }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', cursor: 'pointer',
      borderBottom: `1px solid ${theme.border}`, fontSize: 14, fontWeight: 600,
      color: danger ? theme.danger : theme.ink,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: danger ? `${theme.danger}1F` : `${theme.coral}1F`, color: danger ? theme.danger : theme.coralDeep, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1 }}>{label}</div>
      {right || (!danger && <ChevronRight size={17} color={theme.muted} />)}
    </div>
  );
}

function ToggleSwitch({ on, onClick }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      width: 44, height: 26, borderRadius: 20, background: on ? theme.coral : theme.border,
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: 3,
        transform: on ? 'translateX(18px)' : 'none', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function SettingsPanel({ onClose, onOpenPrivacy, onOpenRequests, onLogout }) {
  const { theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, bgPatternOn, setBgPatternOn } = useTheme();
  const accentLabels = { coral: 'Coral', ocean: 'Ocean', berry: 'Berry' };
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(28,29,33,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 18,
    }} className="zchat-fade">
      <div style={glass(theme, {
        background: theme.panelBg, borderRadius: 24, padding: 26,
        width: '100%', maxWidth: 340, position: 'relative', maxHeight: '85vh', overflowY: 'auto',
      })}>
        <X size={20} style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 19, color: theme.ink, marginBottom: 18 }}>Settings</div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '4px 0 6px 2px' }}>Appearance</div>
        <SettingsRow icon={dark ? <Sun size={16} /> : <Moon size={16} />} label="Dark mode" right={<ToggleSwitch on={dark} onClick={() => setDark((d) => !d)} />} />
        <div style={{ padding: '10px 4px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${theme.coral}1F`, color: theme.coralDeep }}><Palette size={16} /></div>
            <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>Theme color</div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingLeft: 44 }}>
            {Object.keys(ACCENT_PALETTES).map((key) => (
              <div key={key} onClick={() => setAccentName(key)} style={{
                width: 30, height: 30, borderRadius: '50%', background: ACCENT_PALETTES[key].coral, cursor: 'pointer',
                border: accentName === key ? `3px solid ${theme.ink}` : '3px solid transparent',
              }} title={accentLabels[key]} />
            ))}
          </div>
        </div>
        <SettingsRow icon={<ImageIcon size={16} />} label="Chat background pattern" right={<ToggleSwitch on={bgPatternOn} onClick={() => setBgPatternOn((s) => !s)} />} />
        <SettingsRow icon={soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} label="Message sound" right={<ToggleSwitch on={soundOn} onClick={() => setSoundOn((s) => !s)} />} />

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>Accounts</div>
        <SettingsRow icon={<Bell size={16} />} label="Follow requests" onClick={onOpenRequests} />
        <SettingsRow icon={<UserPlus size={16} />} label="Add another account" onClick={() => {}} />

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>About</div>
        <SettingsRow icon={<FileText size={16} />} label="Privacy policy" onClick={onOpenPrivacy} />
        <SettingsRow icon={<HelpCircle size={16} />} label="Help & support" onClick={() => {}} />

        <div style={{ height: 10 }} />
        <SettingsRow icon={<LogOut size={16} />} label="Log out" danger onClick={onLogout} />
      </div>
    </div>
  );
}

function PrivacyPanel({ onBack }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(28,29,33,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 31, padding: 18,
    }} className="zchat-fade">
      <div style={glass(theme, {
        background: theme.panelBg, borderRadius: 24, padding: 26,
        width: '100%', maxWidth: 340, position: 'relative', maxHeight: '85vh', overflowY: 'auto',
      })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <ArrowLeft size={19} style={{ cursor: 'pointer', color: theme.ink }} onClick={onBack} />
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Privacy policy</div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: theme.muted }}>
          <p>This is placeholder text. Replace it with your actual privacy policy before launch.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>How it's used</h3>
          <p>Solely to operate the chat service. We don't sell your data to third parties.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>Your controls</h3>
          <p>You can delete messages, update your profile, or close your account at any time.</p>
        </div>
      </div>
    </div>
  );
}

/* ============================= User list rows (followers/following/discover) ============================= */

function UserListRow({ profile, rightContent, onClick }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <Avatar emoji={profile.avatar} name={profile.name} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink }}>{profile.name}</div>
        <div style={{ fontSize: 12, color: theme.muted }}>@{profile.username}</div>
      </div>
      {rightContent}
    </div>
  );
}

function ListModal({ title, onClose, children }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 340, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{title}</div>
          <X size={19} style={{ cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function FollowListModal({ userId, mode, onClose, onOpenProfile }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    (async () => {
      const col = mode === 'followers' ? 'following_id' : 'follower_id';
      const otherCol = mode === 'followers' ? 'follower_id' : 'following_id';
      const { data } = await supabase.from('follows').select('*').eq(col, userId).eq('status', 'accepted');
      const ids = (data || []).map((r) => r[otherCol]);
      if (!ids.length) { setList([]); return; }
      const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
      setList(profs || []);
    })();
  }, [userId, mode]);

  return (
    <ListModal title={mode === 'followers' ? 'Followers' : 'Following'} onClose={onClose}>
      {list === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color="#888" /></div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: '#888' }}>Nobody here yet</div>
      ) : (
        list.map((p) => <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} />)
      )}
    </ListModal>
  );
}

function FollowRequestsPanel({ userId, onClose, onOpenProfile }) {
  const { theme } = useTheme();
  const [requests, setRequests] = useState(null);

  const load = async () => {
    const { data } = await supabase.from('follows').select('*').eq('following_id', userId).eq('status', 'pending');
    const ids = (data || []).map((r) => r.follower_id);
    if (!ids.length) { setRequests([]); return; }
    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
    setRequests((profs || []).map((p) => ({ profile: p })));
  };
  useEffect(() => { load(); }, [userId]);

  const respond = async (followerId, accept) => {
    if (accept) await supabase.from('follows').update({ status: 'accepted' }).eq('follower_id', followerId).eq('following_id', userId);
    else await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', userId);
    load();
  };

  return (
    <ListModal title="Follow requests" onClose={onClose}>
      {requests === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color="#888" /></div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: theme.muted }}>No pending requests</div>
      ) : (
        requests.map(({ profile: p }) => (
          <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} rightContent={
            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => respond(p.id, true)} style={{
                padding: '6px 12px', borderRadius: 10, border: 'none', background: theme.coral, color: 'white',
                fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT,
              }}>Accept</button>
              <button onClick={() => respond(p.id, false)} style={{
                padding: '6px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.ink,
                fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT,
              }}>Decline</button>
            </div>
          } />
        ))
      )}
    </ListModal>
  );
}

function DiscoverPanel({ myId, onClose, onOpenProfile }) {
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_private', false).neq('id', myId).limit(40);
      setPeople(data || []);
    })();
  }, [myId]);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 25,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Discover people</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 18px' }}>
        {people === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>
        ) : people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: theme.muted }}>No one to discover yet</div>
        ) : (
          people.map((p) => <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} />)
        )}
      </div>
    </div>
  );
}

/* ============================= Reactions & emoji picker ============================= */

/* ============================= Message context menu (long-press) ============================= */

function IconDownload({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" />
    </svg>
  );
}

function MessageContextMenu({ message, isMine, canEditText, onClose, onReact, onReply, onCopy, onEdit, onForward, onReport, onDeleteForMe, onDeleteForEveryone, onSelectMultiple }) {
  const { theme } = useTheme();
  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: theme.ink };
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 95,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, padding: 16, width: '100%', maxWidth: 300 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 0 14px' }}>
          {REACTION_EMOJIS.map((e) => (
            <div key={e} onClick={() => onReact(e)} style={{ fontSize: 24, cursor: 'pointer' }}>{e}</div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 4 }}>
          <div style={row} onClick={onReply}><Send size={16} style={{ transform: 'scaleX(-1)' }} /> Reply</div>
          {!message.deleted && message.type === 'text' && <div style={row} onClick={onCopy}><Check size={16} /> Copy</div>}
          {!message.deleted && canEditText && <div style={row} onClick={onEdit}><FileText size={16} /> Edit</div>}
          <div style={row} onClick={onForward}><Send size={16} /> Forward</div>
          <div style={row} onClick={onSelectMultiple}><Check size={16} /> Select multiple</div>
          {!isMine && <div style={{ ...row, color: theme.danger }} onClick={onReport}><Flag size={16} color={theme.danger} /> Report</div>}
          <div style={{ ...row, color: theme.danger }} onClick={onDeleteForMe}><Trash2 size={16} color={theme.danger} /> Delete for me</div>
          {isMine && !message.deleted && <div style={{ ...row, color: theme.danger }} onClick={onDeleteForEveryone}><Trash2 size={16} color={theme.danger} /> Delete for everyone</div>}
        </div>
      </div>
    </div>
  );
}

function EmojiPickerBar({ onPick, onClose }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 91,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: 22, padding: '14px 18px', display: 'flex', gap: 14,
      }}>
        {REACTION_EMOJIS.map((e) => (
          <div key={e} onClick={() => onPick(e)} style={{ fontSize: 26, cursor: 'pointer' }}>{e}</div>
        ))}
      </div>
    </div>
  );
}

function WhoReactedModal({ reactions, onClose }) {
  const { theme } = useTheme();
  const [profiles, setProfiles] = useState(null);

  useEffect(() => {
    (async () => {
      const ids = (reactions || []).map((r) => r.user_id);
      if (!ids.length) { setProfiles([]); return; }
      const { data } = await supabase.from('profiles').select('*').in('id', ids);
      setProfiles((data || []).map((p) => ({ ...p, emoji: reactions.find((r) => r.user_id === p.id)?.emoji })));
    })();
  }, [reactions]);

  return (
    <ListModal title="Reactions" onClose={onClose}>
      {profiles === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.ink} /></div>
      ) : (
        profiles.map((p) => <UserListRow key={p.id} profile={p} rightContent={<span style={{ fontSize: 18 }}>{p.emoji}</span>} />)
      )}
    </ListModal>
  );
}

/* ============================= Archived chats ============================= */

function ArchivedChatsPanel({ conversations, onClose, onOpenChat, onUnarchive }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 26,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Archived chats</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 18px' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: theme.muted }}>No archived chats</div>
        ) : (
          conversations.map((c) => (
            <UserListRow key={c.id} profile={c.otherProfile} onClick={() => onOpenChat(c)} rightContent={
              <button onClick={(e) => { e.stopPropagation(); onUnarchive(c.id); }} style={{
                padding: '6px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent',
                color: theme.ink, fontWeight: 700, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT,
              }}>Unarchive</button>
            } />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================= Account privacy settings ============================= */

function PrivacyField({ label, hidden, onToggle }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px', borderBottom: `1px solid ${theme.border}` }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.ink }}>{label}</span>
      <ToggleSwitch on={!hidden} onClick={onToggle} />
    </div>
  );
}

function AccountPrivacyPanel({ profile, onClose, onSaved }) {
  const { theme } = useTheme();
  const [isPrivate, setIsPrivate] = useState(profile.is_private || false);
  const [hidePhoto, setHidePhoto] = useState(profile.hide_photo || false);
  const [hideBio, setHideBio] = useState(profile.hide_bio || false);
  const [hideGender, setHideGender] = useState(profile.hide_gender || false);
  const [hideAge, setHideAge] = useState(profile.hide_age || false);
  const [hideCountry, setHideCountry] = useState(profile.hide_country || false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data } = await updateProfile(profile.id, {
      is_private: isPrivate, hide_photo: hidePhoto, hide_bio: hideBio,
      hide_gender: hideGender, hide_age: hideAge, hide_country: hideCountry,
    });
    setSaving(false);
    if (data) { onSaved(data); onClose(); }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(28,29,33,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 32, padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 24, padding: 26, width: '100%', maxWidth: 340, maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink, marginBottom: 16 }}>Privacy</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px', marginBottom: 6, borderBottom: `1px solid ${theme.border}` }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>Private account</div>
            <div style={{ fontSize: 11, color: theme.muted }}>New followers need your approval</div>
          </div>
          <ToggleSwitch on={isPrivate} onClick={() => setIsPrivate((s) => !s)} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '14px 0 4px 2px' }}>
          Visible to others
        </div>
        <PrivacyField label="Profile photo" hidden={hidePhoto} onToggle={() => setHidePhoto((s) => !s)} />
        <PrivacyField label="Bio" hidden={hideBio} onToggle={() => setHideBio((s) => !s)} />
        <PrivacyField label="Gender" hidden={hideGender} onToggle={() => setHideGender((s) => !s)} />
        <PrivacyField label="Age" hidden={hideAge} onToggle={() => setHideAge((s) => !s)} />
        <PrivacyField label="Country" hidden={hideCountry} onToggle={() => setHideCountry((s) => !s)} />

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: 12, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ ...primaryBtn(theme, saving), marginTop: 0, flex: 1 }}>
            {saving ? <Spinner /> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================= Profile panel (premium redesign) ============================= */

/* ============================= Avatar crop tool ============================= */

function AvatarCropper({ file, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [imgEl, setImgEl] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef(null);
  const wrapRef = useRef(null);
  const C = 240;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!imgEl) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
        <Spinner size={26} color="white" />
      </div>
    );
  }

  const baseScale = Math.max(C / imgEl.naturalWidth, C / imgEl.naturalHeight);
  const scale = baseScale * zoom;
  const drawnW = imgEl.naturalWidth * scale;
  const drawnH = imgEl.naturalHeight * scale;
  const maxX = Math.max(0, (drawnW - C) / 2);
  const maxY = Math.max(0, (drawnH - C) / 2);
  const clampedX = Math.min(maxX, Math.max(-maxX, pos.x));
  const clampedY = Math.min(maxY, Math.max(-maxY, pos.y));
  const left = (C - drawnW) / 2 + clampedX;
  const top = (C - drawnH) / 2 + clampedY;

  const startDrag = (clientX, clientY) => { dragRef.current = { startX: clientX, startY: clientY, origX: pos.x, origY: pos.y }; };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
  };
  const endDrag = () => { dragRef.current = null; };

  const confirm = () => {
    setSaving(true);
    const O = 480;
    const k = O / C;
    const canvas = document.createElement('canvas');
    canvas.width = O; canvas.height = O;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, 0, 0, imgEl.naturalWidth, imgEl.naturalHeight, left * k, top * k, drawnW * k, drawnH * k);
    canvas.toBlob((blob) => { setSaving(false); if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 20,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 24, padding: 24, width: '100%', maxWidth: 320, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 16 }}>Adjust your photo</div>
        <div
          ref={wrapRef}
          style={{
            width: C, height: C, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px',
            position: 'relative', touchAction: 'none', cursor: 'grab', border: `3px solid ${theme.coral}`,
          }}
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => e.buttons === 1 && moveDrag(e.clientX, e.clientY)}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={endDrag}
        >
          <img src={imgEl.src} alt="" draggable={false} style={{
            position: 'absolute', left, top, width: drawnW, height: drawnH, userSelect: 'none', pointerEvents: 'none',
          }} />
        </div>
        <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: theme.coral, marginBottom: 18 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 12, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={confirm} disabled={saving} style={{ ...primaryBtn(theme, saving), marginTop: 0, flex: 1 }}>
            {saving ? <Spinner size={14} /> : 'Use photo'}
          </button>
        </div>
      </div>
    </div>
  );
}
function ProfilePanel({ profile, isSelf, userId, isOnline, onClose, onReport, onSaved, onOpenSettings, onOpenProfile, onMessage }) {
  const { theme } = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : '');
  const [country, setCountry] = useState(profile.country || '');
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [followState, setFollowState] = useState('none'); // none | pending | accepted
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [username, setUsername] = useState(profile.username || '');
  const [usernameErr, setUsernameErr] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameEditing, setNicknameEditing] = useState(false);
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [listModal, setListModal] = useState(null); // 'followers' | 'following'
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);

  const cooldownDaysLeft = (() => {
    if (!profile.username_changed_at) return 0;
    const days = 7 - (Date.now() - new Date(profile.username_changed_at).getTime()) / 86400000;
    return days > 0 ? Math.ceil(days) : 0;
  })();

  useEffect(() => {
    if (isSelf) return;
    (async () => {
      const { data } = await supabase.from('contact_nicknames').select('nickname').eq('owner_id', userId).eq('contact_id', profile.id).maybeSingle();
      if (data) setNickname(data.nickname);
    })();
  }, [profile.id, isSelf]);

  const saveNickname = async () => {
    setNicknameSaving(true);
    if (nickname.trim()) {
      await supabase.from('contact_nicknames').upsert({ owner_id: userId, contact_id: profile.id, nickname: nickname.trim() }, { onConflict: 'owner_id,contact_id' });
    } else {
      await supabase.from('contact_nicknames').delete().eq('owner_id', userId).eq('contact_id', profile.id);
    }
    setNicknameSaving(false);
    setNicknameEditing(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted');
      if (!cancelled) setFollowerCount(followers || 0);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('status', 'accepted');
      if (!cancelled) setFollowingCount(following || 0);
      if (isSelf) return;
      const { data } = await supabase.from('follows').select('status').eq('follower_id', userId).eq('following_id', profile.id).maybeSingle();
      if (!cancelled) setFollowState(data ? data.status : 'none');
    })();
    return () => { cancelled = true; };
  }, [profile.id, isSelf]);

  const toggleFollow = async () => {
    if (followBusy) return;
    setFollowBusy(true);
    if (followState === 'accepted' || followState === 'pending') {
      await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', profile.id);
      if (followState === 'accepted') setFollowerCount((c) => Math.max(0, c - 1));
      setFollowState('none');
    } else {
      const status = profile.is_private ? 'pending' : 'accepted';
      await supabase.from('follows').insert({ follower_id: userId, following_id: profile.id, status });
      if (status === 'accepted') setFollowerCount((c) => c + 1);
      setFollowState(status);
    }
    setFollowBusy(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) setCropFile(file);
  };

  const uploadCropped = async (blob) => {
    setCropFile(null);
    setAvatarUploading(true);
    const namedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const { url, error } = await uploadMedia(namedFile, userId);
    if (!error && url) setAvatar(url);

    setAvatarUploading(false);
  };

  const save = async () => {
    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9._]/g, '');
    const parsedAge = age.trim() === '' ? null : parseInt(age, 10);
    const fields = { bio, gender, avatar, age: Number.isFinite(parsedAge) ? parsedAge : null, country: country.trim() || null };
    if (cleanUsername !== profile.username) {
      if (cooldownDaysLeft > 0) { setUsernameErr(`You can change your username again in ${cooldownDaysLeft} day${cooldownDaysLeft === 1 ? '' : 's'}.`); return; }
      if (cleanUsername.length < 3) { setUsernameErr('Username must be at least 3 characters.'); return; }
      fields.username = cleanUsername;
      fields.username_changed_at = new Date().toISOString();
    }
    setUsernameErr('');
    setSaving(true);
    const { data, error } = await updateProfile(profile.id, fields);
    setSaving(false);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      setUsernameErr(msg.includes('duplicate') || msg.includes('unique') ? 'That username is already taken.' : error.message);
      return;
    }
    if (data) { onSaved(data); setEditing(false); }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 18,
    }} className="zchat-fade">
      <div style={{
        background: theme.panelBg, borderRadius: 28,
        width: '100%', maxWidth: 360, position: 'relative', maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header banner */}
        <div style={{
          height: 100, borderRadius: '28px 28px 0 0', position: 'relative',
          background: `linear-gradient(135deg, ${theme.coral} 0%, ${theme.gold} 100%)`,
        }}>
          <div onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%',
            background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={16} color="white" /></div>
          {isSelf && (
            <div onClick={onOpenSettings} style={{
              position: 'absolute', top: 16, left: 16, width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}><SettingsIcon size={15} color="white" /></div>
          )}
        </div>

        <div style={{ padding: '0 26px 28px', textAlign: 'center', marginTop: -46 }}>
          {editing ? (
            <div style={{ position: 'relative', width: 92, height: 92, margin: '0 auto' }}>
              <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: theme.panelBg, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                <Avatar emoji={avatar} name={profile.name} size={84} />
              </div>
              <label style={{
                position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%',
                background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: `3px solid ${theme.panelBg}`,
              }}>
                {avatarUploading ? <Spinner size={12} /> : <ImageIcon size={13} color="white" />}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            </div>
          ) : (
            <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: theme.panelBg, margin: '0 auto', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <Avatar emoji={(isSelf || !profile.hide_photo) ? profile.avatar : ''} name={profile.name} online={isOnline} size={84} />
            </div>
          )}

          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 14, color: theme.ink, letterSpacing: '-0.01em' }}>{profile.name}</div>
          <div style={{
            display: 'inline-block', fontSize: 12.5, color: theme.coralDeep, fontWeight: 700, marginTop: 4,
            background: `${theme.coral}16`, padding: '3px 12px', borderRadius: 20,
          }}>@{profile.username}</div>

          {!isSelf && !editing && (
            nicknameEditing ? (
              <div style={{ marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5 }}>Nickname for {profile.realName || profile.name}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 30))} placeholder="Custom nickname"
                    style={{ ...inputStyle(theme), padding: '7px 10px', fontSize: 12.5, width: 160 }} />
                  <button onClick={saveNickname} disabled={nicknameSaving} style={{
                    padding: '7px 12px', borderRadius: 10, border: 'none', background: theme.coral, color: 'white',
                    fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
                  }}>{nicknameSaving ? <Spinner size={11} /> : 'Save'}</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setNicknameEditing(true)} style={{ marginTop: 8, fontSize: 11.5, color: theme.coralDeep, fontWeight: 700, cursor: 'pointer' }}>
                {nickname ? `Nickname: ${nickname} (edit)` : 'Set a nickname'}
              </div>
            )
          )}

          {isSelf && !editing && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setEditing(true)} style={{
                padding: '9px 22px', borderRadius: 22, border: 'none',
                background: theme.ink, color: theme.dark ? '#121319' : 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                Edit profile
              </button>
              <button onClick={() => setShowPrivacySettings(true)} style={{
                marginLeft: 8, padding: '9px 16px', borderRadius: 22, border: `1.5px solid ${theme.border}`,
                background: 'transparent', color: theme.ink, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                Privacy
              </button>
            </div>
          )}

          {editing ? (
            <div style={{ marginTop: 22, textAlign: 'left' }}>
              <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>USERNAME</div>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <span style={{ position: 'absolute', left: 14, top: 13, color: theme.muted, fontSize: 16 }}>@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                  style={{ ...inputStyle(theme), paddingLeft: 26 }} autoCapitalize="none" />
              </div>
              {cooldownDaysLeft > 0 && (
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 10 }}>You can change your username again in {cooldownDaysLeft} day{cooldownDaysLeft === 1 ? '' : 's'}.</div>
              )}
              {usernameErr && <div style={{ fontSize: 11.5, color: theme.danger, marginBottom: 10 }}>{usernameErr}</div>}
              <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>BIO</div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 140))}
                placeholder="Tell people about yourself"
                style={{ ...inputStyle(theme), height: 64, resize: 'none', fontFamily: FONT, marginBottom: 14 }} />
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>AGE</div>
                  <input value={age} onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                    inputMode="numeric" placeholder="Age" style={inputStyle(theme)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>COUNTRY</div>
                  <input value={country} onChange={(e) => setCountry(e.target.value.slice(0, 56))}
                    placeholder="Country" style={inputStyle(theme)} />
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>GENDER</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {GENDERS.map((g) => (
                  <div key={g} onClick={() => setGender(g)} style={{
                    padding: '6px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
                    background: gender === g ? theme.coral : theme.rowBg,
                    color: gender === g ? 'white' : theme.muted, fontWeight: 600,
                  }}>{g}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setEditing(false); setUsername(profile.username || ''); setUsernameErr(''); }} style={{ ...primaryBtn(theme, false, theme.rowBg), color: theme.ink, marginTop: 0, flex: 1, boxShadow: 'none' }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ ...primaryBtn(theme, saving), marginTop: 0, flex: 1 }}>
                  {saving ? <Spinner /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <div onClick={() => setListModal('followers')} style={{ flex: 1, minWidth: 80, background: theme.rowBg, borderRadius: 16, padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{followerCount}</div>
                  <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Followers</div>
                </div>
                <div onClick={() => setListModal('following')} style={{ flex: 1, minWidth: 80, background: theme.rowBg, borderRadius: 16, padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{followingCount}</div>
                  <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Following</div>
                </div>
                {(isSelf || (!profile.hide_gender && profile.gender)) && (
                  <div style={{ flex: 1, minWidth: 80, background: theme.rowBg, borderRadius: 16, padding: '10px 12px' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{profile.gender || '—'}</div>
                    <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Gender</div>
                  </div>
                )}
              </div>
              {(isSelf || !profile.hide_age || !profile.hide_country) && (profile.age || profile.country) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, fontSize: 12, color: theme.muted }}>
                  {profile.age != null && (isSelf || !profile.hide_age) && <span>{profile.age} yrs</span>}
                  {profile.country && (isSelf || !profile.hide_country) && <span>{profile.country}</span>}
                </div>
              )}
              {profile.bio && (isSelf || !profile.hide_bio) && (
                <div style={{ fontSize: 13.5, color: theme.ink, marginTop: 18, lineHeight: 1.6, padding: '0 4px' }}>{profile.bio}</div>
              )}
              {isSelf && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${theme.border}` }}>
                  {!showEmail ? (
                    <button onClick={() => setShowEmail(true)} style={{
                      display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT,
                      color: theme.coralDeep, fontSize: 12.5, fontWeight: 700,
                    }}>
                      <Mail size={13} /> Show your email
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.ink }}>{profile.email}</span>
                      <span onClick={() => setShowEmail(false)} style={{ color: theme.coralDeep, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Hide</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!isSelf && !editing && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={toggleFollow} disabled={followBusy} style={{
                padding: '9px 22px', borderRadius: 22, cursor: followBusy ? 'default' : 'pointer', fontFamily: FONT,
                border: followState !== 'none' ? `1.5px solid ${theme.border}` : 'none',
                background: followState !== 'none' ? 'transparent' : theme.coral,
                color: followState !== 'none' ? theme.ink : 'white', fontSize: 12.5, fontWeight: 700,
              }}>
                {followBusy ? <Spinner size={12} color={followState !== 'none' ? theme.ink : 'white'} /> :
                  followState === 'accepted' ? 'Following' : followState === 'pending' ? 'Requested' : 'Follow'}
              </button>
              <button onClick={() => onMessage(profile)} style={{
                padding: '9px 22px', borderRadius: 22, border: 'none', background: theme.ink,
                color: theme.dark ? '#121319' : 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Send size={13} /> Message
              </button>
            </div>
          )}

          {!isSelf && !editing && !reportSent && !reportOpen && (
            <button onClick={() => setReportOpen(true)} style={{
              marginTop: 22, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              width: '100%', padding: 12, borderRadius: 14, border: 'none', background: `${theme.danger}14`,
              color: theme.danger, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}>
              <Flag size={14} /> Report this account
            </button>
          )}
          {!isSelf && reportOpen && !reportSent && (
            <div style={{ marginTop: 16, textAlign: 'left' }} className="zchat-fade">
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                placeholder="What's going on with this account?"
                style={{ ...inputStyle(theme), height: 64, resize: 'none', fontFamily: FONT }} />
              <button disabled={!reportReason.trim()} style={primaryBtn(theme, !reportReason.trim(), theme.danger)}
                onClick={() => { onReport(profile, reportReason); setReportSent(true); }}>
                Send report
              </button>
            </div>
          )}
          {reportSent && (
            <div style={{ marginTop: 16, fontSize: 12.5, color: theme.teal, fontWeight: 700 }} className="zchat-fade">
              Report sent. Thanks for flagging this.
            </div>
          )}
        </div>
      </div>
      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={uploadCropped} />}
      {listModal && (
        <FollowListModal userId={profile.id} mode={listModal} onClose={() => setListModal(null)}
          onOpenProfile={(p) => { setListModal(null); onOpenProfile(p); }} />
      )}
      {showPrivacySettings && (
        <AccountPrivacyPanel profile={profile} onClose={() => setShowPrivacySettings(false)}
          onSaved={(updated) => { onSaved(updated); setShowPrivacySettings(false); }} />
      )}
    </div>
  );
}

function StatusTicks({ status }) {
  const { theme } = useTheme();
  const color = status === 'read' ? theme.coral : theme.muted;
  if (status === 'sent') return <Check size={14} color={color} />;
  return <CheckCheck size={14} color={color} />;
}

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

function AudioBubble({ url, isMe }) {
  const { theme } = useTheme();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  const toggle = (e) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (playing) { el.pause(); } else { el.play(); }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const pct = duration ? (progress / duration) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', minWidth: 190 }}>
      <audio ref={audioRef} src={url}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setProgress(e.target.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <div onClick={toggle} style={{
        width: 32, height: 32, borderRadius: '50%', background: isMe ? theme.coral : theme.coralDeep,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
      }}>
        {playing ? <Pause size={14} color="white" /> : <Play size={14} color="white" style={{ marginLeft: 1 }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ height: 4, borderRadius: 2, background: theme.rowBg, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: theme.coral, borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 10, color: theme.muted, marginTop: 3 }}>{fmt(playing || progress ? progress : duration)}</div>
      </div>
      <a href={url} download onClick={(e) => e.stopPropagation()} style={{ color: theme.muted, flexShrink: 0 }}>
        <Download size={14} />
      </a>
    </div>
  );
}

function MessageBubble({ m, isMe, onDelete, selectionMode, selected, onToggleSelect, onLongPress, onOpenImage, reactions, onReact, onOpenWhoReacted, replyPreview, onSwipeReply }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);
  const lastTapRef = useRef(0);
  const pressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  const grouped = {};
  (reactions || []).forEach((r) => { grouped[r.emoji] = (grouped[r.emoji] || 0) + 1; });
  const groupedEntries = Object.entries(grouped);

  const handleTap = () => {
    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
    if (selectionMode) { onToggleSelect(m.id); return; }
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onReact(m.id, '❤️');
      setBurstHeart(true);
      setTimeout(() => setBurstHeart(false), 650);
    } else if (m.type === 'image') {
      onOpenImage(m.media_url);
    }
    lastTapRef.current = now;
  };

  const clearPressTimer = () => { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; setHover(false); };

  const handlePointerDown = (e) => {
    setHover(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress(m.id);
    }, 500);
  };
  const handlePointerMove = (e) => {
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 8 || dy > 8) clearPressTimer();
  };

  return (
    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 8, marginBottom: 10 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearPressTimer}
      onPointerCancel={clearPressTimer}
      onPointerLeave={clearPressTimer}
    >
      {selectionMode && (
        <div onClick={() => onToggleSelect(m.id)} style={{
          width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? theme.coral : theme.border}`,
          background: selected ? theme.coral : 'transparent', flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <Check size={12} color="white" />}
        </div>
      )}
      {isMe && !m.deleted && !selectionMode && (
        <Trash2 size={14} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, opacity: hover ? 1 : 0.35, transition: 'opacity 0.15s' }}
          onClick={() => onDelete(m.id)} />
      )}
      <div style={{ position: 'relative', maxWidth: '72%' }}>
        {!selectionMode && !m.deleted && (
          <div onClick={() => onSwipeReply(m)} style={{
            position: 'absolute', top: 6, [isMe ? 'left' : 'right']: -26, cursor: 'pointer', opacity: hover ? 1 : 0, transition: 'opacity 0.15s',
          }}>
            <Send size={13} color={theme.muted} style={{ transform: isMe ? 'scaleX(-1)' : 'none' }} />
          </div>
        )}
        <div onClick={handleTap} style={glass(theme, {
          background: m.deleted ? theme.rowBg : (isMe ? theme.bubbleMe : theme.bubbleThem),
          borderRadius: 16,
          padding: m.type === 'text' || m.deleted ? '9px 13px' : 5,
          border: selected ? `2px solid ${theme.coral}` : m.deleted ? `1px dashed ${theme.border}` : `1px solid ${theme.border}`,
          cursor: 'pointer',
        })}>
          {m.forwarded && !m.deleted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: theme.muted, fontStyle: 'italic',
              marginBottom: 3, padding: m.type !== 'text' ? '0 4px' : 0,
            }}>
              <Send size={10} style={{ transform: 'scaleX(-1)' }} /> Forwarded
            </div>
          )}
          {replyPreview && !m.deleted && (
            <div style={{
              borderLeft: `3px solid ${theme.coral}`, background: 'rgba(0,0,0,0.05)', borderRadius: 6,
              padding: '4px 8px', marginBottom: 5, fontSize: 11.5, color: theme.muted,
            }}>
              <div style={{ fontWeight: 700, color: theme.coralDeep, fontSize: 10.5 }}>{replyPreview.senderLabel}</div>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {replyPreview.type === 'text' ? replyPreview.content : replyPreview.type === 'image' ? '📷 Photo' : replyPreview.type === 'audio' ? '🎤 Voice message' : '🎥 Video'}
              </div>
            </div>
          )}
          {m.deleted ? (
            <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>This message was deleted</div>
          ) : (
            <>
              {m.type === 'image' && (
                <div style={{ position: 'relative' }}>
                  <img src={m.media_url} alt="" style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2 }} />
                  <a href={m.media_url} download onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Download size={13} color="white" /></a>
                </div>
              )}
              {m.type === 'video' && (
                <div style={{ position: 'relative' }}>
                  <video src={m.media_url} controls style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2, background: '#000' }} />
                  <a href={m.media_url} download onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Download size={13} color="white" /></a>
                </div>
              )}
              {m.type === 'audio' && <AudioBubble url={m.media_url} isMe={isMe} />}
              {m.content && <div style={{ fontSize: 15, color: theme.ink, padding: m.type !== 'text' ? '0 4px' : 0, wordBreak: 'break-word', lineHeight: 1.4 }}>{m.content}</div>}
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3, padding: m.type !== 'text' && !m.deleted ? '0 4px 2px' : 0 }}>
            {m.edited && !m.deleted && <span style={{ fontSize: 10, color: theme.muted, fontStyle: 'italic' }}>edited</span>}
            <span style={{ fontSize: 10.5, color: theme.muted }}>{time}</span>
            {isMe && !m.deleted && <StatusTicks status={m.read ? 'read' : 'sent'} />}
          </div>
        </div>
        {groupedEntries.length > 0 && !m.deleted && (
          <div onClick={() => onOpenWhoReacted(m.id)} style={{
            position: 'absolute', bottom: -8, [isMe ? 'left' : 'right']: 6, cursor: 'pointer',
            background: theme.panelBg, borderRadius: 10, padding: '1px 6px', fontSize: 10.5,
            display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            {groupedEntries.map(([emoji, count]) => <span key={emoji}>{emoji}{count > 1 ? count : ''}</span>)}
          </div>
        )}
        {burstHeart && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, pointerEvents: 'none', animation: 'zchat-heart-burst 0.6s ease',
          }}>❤️</div>
        )}
      </div>
    </div>
  );
}

function playPing() {
  try {
    if (localStorage.getItem('zchat-sound') === 'off') return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.3);
  } catch {}
}

function pairKey(a, b) { return a < b ? [a, b] : [b, a]; }

/* ============================= Full-screen image viewer ============================= */

function ImageViewer({ url, onClose, onForward, onReport }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const save = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zchat-photo.jpg';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setMenuOpen(false);
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} className="zchat-fade">
      <div onClick={onClose} style={{
        position: 'absolute', top: 18, left: 18, width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
      }}><X size={18} color="white" /></div>
      <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 2 }}>
        <div onClick={() => setMenuOpen((s) => !s)} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><MoreVertical size={18} color="white" /></div>
        {menuOpen && (
          <div style={{ position: 'absolute', top: 44, right: 0, background: 'white', borderRadius: 14, overflow: 'hidden', width: 180, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div onClick={save} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#1B1B1F', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Save to gallery</div>
            <div onClick={() => { setMenuOpen(false); onForward(); }} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#1B1B1F', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Forward</div>
            <div onClick={() => { setMenuOpen(false); onReport(); }} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#FF4D5E', cursor: 'pointer' }}>Report</div>
          </div>
        )}
      </div>
      <img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
    </div>
  );
}

/* ============================= Selection action bar ============================= */

function MessageActionBar({ count, canEditActions, onCancel, onForward, onDeleteForMe, onDeleteForEveryone, onReport }) {
  const { theme } = useTheme();
  const btn = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: theme.ink, fontSize: 10, fontWeight: 600, flexShrink: 0, minWidth: 52 };
  return (
    <div style={{ background: theme.rowBg }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 6px' }}>
        <X size={18} style={{ cursor: 'pointer', color: theme.ink, flexShrink: 0 }} onClick={onCancel} />
        <span style={{ fontWeight: 800, fontSize: 14, color: theme.ink }}>{count} selected</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, padding: '2px 16px 10px' }}>
        <div style={btn} onClick={onForward}><Send size={16} /><span>Forward</span></div>
        {canEditActions.canReport && <div style={btn} onClick={onReport}><Flag size={16} color={theme.danger} /><span style={{ color: theme.danger }}>Report</span></div>}
        <div style={btn} onClick={onDeleteForMe}><Trash2 size={16} /><span style={{ whiteSpace: 'nowrap' }}>Delete me</span></div>
        {canEditActions.allMine && <div style={btn} onClick={onDeleteForEveryone}><Trash2 size={16} color={theme.danger} /><span style={{ color: theme.danger, whiteSpace: 'nowrap' }}>Delete all</span></div>}
      </div>
    </div>
  );
}

/* ============================= Forward picker ============================= */

function ForwardPicker({ conversations, onCancel, onPick, myId }) {
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const { data } = await searchByUsername(val.trim());
      setResults((data || []).filter((u) => u.id !== myId));
      setSearching(false);
    }, 300);
  };

  const list = q.trim().length >= 2 ? results : conversations.map((c) => c.otherProfile);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 20, width: '100%', maxWidth: 340, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 12 }}>Forward to...</div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
          <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search username" autoCapitalize="none"
            style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
          {searching && <div style={{ position: 'absolute', right: 12, top: 11 }}><Spinner size={13} color={theme.muted} /></div>}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {list.length === 0 && <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', padding: 20 }}>
            {q.trim().length >= 2 ? 'No one found' : 'No conversations yet'}
          </div>}
          {list.map((p) => (
            <div key={p.id} onClick={() => onPick(p)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', cursor: 'pointer', borderRadius: 12,
            }}>
              <Avatar emoji={p.avatar} name={p.name} size={38} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>@{p.username}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={onCancel} style={{
          width: '100%', marginTop: 12, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`,
          background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
        }}>Cancel</button>
      </div>
    </div>
  );
}

/* ============================= Report message modal ============================= */

function ReportMessageModal({ onCancel, onSubmit }) {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 12 }}>Report message</div>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What's wrong with this message?"
          style={{ ...inputStyle(theme), height: 64, resize: 'none', fontFamily: FONT, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button disabled={!reason.trim()} onClick={() => onSubmit(reason)} style={primaryBtn(theme, !reason.trim(), theme.danger)}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ============================= Delete conversation confirm ============================= */

function DeleteChatConfirm({ name, onCancel, onConfirm }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 24,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 280, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: theme.ink }}>Delete this chat?</div>
        <div style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.5, color: theme.muted }}>
          Your conversation with {name} will be removed from your list.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: 11, borderRadius: 13, border: 'none', background: theme.danger,
            color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
function ChatApp({ session, onLogout, onNeedsProfile }) {
  const { theme, bgPatternOn } = useTheme();
  const [me, setMe] = useState(null);
  const [profileCheckFailed, setProfileCheckFailed] = useState(false);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [profileOf, setProfileOf] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFollowRequests, setShowFollowRequests] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewerUrl, setViewerUrl] = useState(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [reportModalFor, setReportModalFor] = useState(null);
  const [deleteConvoTarget, setDeleteConvoTarget] = useState(null);
  const [rowMenuFor, setRowMenuFor] = useState(null);
  const [messageLikes, setMessageLikes] = useState({});
  const [typingFrom, setTypingFrom] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [contextMenuFor, setContextMenuFor] = useState(null);
  const [pendingForwardItems, setPendingForwardItems] = useState([]);
  const [activeFollowState, setActiveFollowState] = useState('none');
  const [activeFollowBusy, setActiveFollowBusy] = useState(false);
  const [whoReactedFor, setWhoReactedFor] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const scrollRef = useRef(null);
  const searchTimer = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);

  const archivedChatsKey = () => `zchat-archived-chats-${session.user.id}`;
  const getArchivedChatIds = () => { try { return new Set(JSON.parse(localStorage.getItem(archivedChatsKey()) || '[]')); } catch { return new Set(); } };
  const toggleArchive = (convId, archive) => {
    const cur = getArchivedChatIds();
    if (archive) cur.add(convId); else cur.delete(convId);
    try { localStorage.setItem(archivedChatsKey(), JSON.stringify([...cur])); } catch {}
    loadConversations();
  };

  const hiddenMsgKey = () => `zchat-hidden-msgs-${session.user.id}`;
  const getHiddenMsgIds = () => { try { return new Set(JSON.parse(localStorage.getItem(hiddenMsgKey()) || '[]')); } catch { return new Set(); } };
  const hideMessagesLocally = (ids) => {
    const cur = getHiddenMsgIds();
    ids.forEach((id) => cur.add(id));
    try { localStorage.setItem(hiddenMsgKey(), JSON.stringify([...cur])); } catch {}
  };

  const hiddenChatsKey = () => `zchat-hidden-chats-${session.user.id}`;
  const getHiddenChatIds = () => { try { return new Set(JSON.parse(localStorage.getItem(hiddenChatsKey()) || '[]')); } catch { return new Set(); } };
  const hideChatLocally = (convId) => {
    const cur = getHiddenChatIds();
    cur.add(convId);
    try { localStorage.setItem(hiddenChatsKey(), JSON.stringify([...cur])); } catch {}
  };

  const readKey = (convId) => `zchat-read-${session.user.id}-${convId}`;
  const markRead = (convId) => { try { localStorage.setItem(readKey(convId), Date.now().toString()); } catch {} };
  const isUnread = (conv) => {
    if (conv.last_sender_id === session.user.id) return false;
    try {
      const last = localStorage.getItem(readKey(conv.id));
      if (!last) return true;
      return new Date(conv.last_message_at).getTime() > parseInt(last, 10);
    } catch { return false; }
  };

  const isPinnedByMe = (conv) => (conv.user_a === session.user.id ? conv.pinned_by_a : conv.pinned_by_b);
  const togglePin = async (conv) => {
    const field = conv.user_a === session.user.id ? 'pinned_by_a' : 'pinned_by_b';
    await supabase.from('conversations').update({ [field]: !isPinnedByMe(conv) }).eq('id', conv.id);
    loadConversations();
  };

  const loadConversations = async () => {
    const hidden = getHiddenChatIds();
    const archived = getArchivedChatIds();
    const { data } = await supabase.from('conversations').select('*')
      .or(`user_a.eq.${session.user.id},user_b.eq.${session.user.id}`)
      .order('last_message_at', { ascending: false });
    if (!data || data.length === 0) { setConversations([]); setArchivedConversations([]); return; }
    const visible = data.filter((c) => !hidden.has(c.id));
    const otherIds = visible.map((c) => (c.user_a === session.user.id ? c.user_b : c.user_a));
    const { data: profs } = await supabase.from('profiles').select('*').in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const { data: nicks } = await supabase.from('contact_nicknames').select('*').eq('owner_id', session.user.id);
    const mergedAll = visible
      .map((c) => {
        const otherId = c.user_a === session.user.id ? c.user_b : c.user_a;
        const profile = profs?.find((p) => p.id === otherId);
        const nick = nicks?.find((n) => n.contact_id === otherId);
        if (!profile) return null;
        return { ...c, otherProfile: nick ? { ...profile, name: nick.nickname } : profile, realName: profile.name };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const pa = isPinnedByMe(a) ? 1 : 0, pb = isPinnedByMe(b) ? 1 : 0;
        if (pa !== pb) return pb - pa;
        return new Date(b.last_message_at) - new Date(a.last_message_at);
      });
    setConversations(mergedAll.filter((c) => !archived.has(c.id)));
    setArchivedConversations(mergedAll.filter((c) => archived.has(c.id)));
  };

  const upsertConversation = async (otherId, text, type) => {
    const [a, b] = pairKey(session.user.id, otherId);
    const preview = type === 'text' ? text : type === 'image' ? '📷 Photo' : '🎥 Video';
    await supabase.from('conversations').upsert(
      { user_a: a, user_b: b, last_message: preview, last_message_at: new Date().toISOString(), last_sender_id: session.user.id },
      { onConflict: 'user_a,user_b' }
    );
  };

  useEffect(() => {
    let cancelled = false;
    getProfile(session.user.id)
      .then(({ data }) => {
        if (cancelled) return;
        if (data) { setMe({ ...data, email: session.user.email }); return; }
        // Session exists but profile was never finished (e.g. backed out mid-signup).
        // Don't spin forever — sign out and send back to login with an explanation.
        setProfileCheckFailed(true);
      })
      .catch(() => { if (!cancelled) setProfileCheckFailed(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (profileCheckFailed) onNeedsProfile();
  }, [profileCheckFailed]);

  useEffect(() => {
    if (me) loadConversations();
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('conversations-watch-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        const row = payload.new || payload.old;
        if (row && (row.user_a === me.id || row.user_b === me.id)) loadConversations();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const sub = subscribeToMessages(me.id, (msg) => {
      if (msg.sender_id !== me.id) {
        if (msg.sender_id !== activeProfile?.id) playPing();
        else supabase.from('messages').update({ read: true }).eq('id', msg.id);
      }
      setMessages((prev) => (activeProfile && msg.sender_id === activeProfile.id ? [...prev, msg] : prev));
    });
    return () => supabase.removeChannel(sub);
  }, [me, activeProfile]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('read-receipts-' + me.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new;
        if (row.sender_id === me.id) {
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, read: row.read, edited: row.edited, deleted: row.deleted } : m)));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('presence-global', { config: { presence: { key: me.id } } });
    channel.on('presence', { event: 'sync' }, () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 30);
    return () => clearTimeout(t);
  }, [messages.length, activeProfile, loadingConvo]);

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

  const openChat = async (profile, convId) => {
    setActiveProfile(profile);
    setMobileShowChat(true);
    setLoadingConvo(true);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setReplyingTo(null);
    setEditingMessage(null);
    setPendingForwardItems([]);
    if (convId) markRead(convId);
    const { data: followRow } = await supabase.from('follows').select('status').eq('follower_id', session.user.id).eq('following_id', profile.id).maybeSingle();
    setActiveFollowState(followRow ? followRow.status : 'none');
    const { data } = await getConversation(session.user.id, profile.id);
    const hidden = getHiddenMsgIds();
    const visible = (data || []).filter((m) => !hidden.has(m.id));
    setMessages(visible);
    setLoadingConvo(false);
    const unreadIds = visible.filter((m) => m.sender_id === profile.id && !m.read).map((m) => m.id);
    if (unreadIds.length) {
      await supabase.from('messages').update({ read: true }).in('id', unreadIds);
      setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)));
    }
    if (visible.length) {
      const ids = visible.map((m) => m.id);
      const { data: likes } = await supabase.from('message_likes').select('*').in('message_id', ids);
      const grouped = {};
      (likes || []).forEach((l) => { grouped[l.message_id] = grouped[l.message_id] || []; grouped[l.message_id].push({ user_id: l.user_id, emoji: l.emoji }); });
      setMessageLikes(grouped);
    } else {
      setMessageLikes({});
    }
  };

  const findMessageById = (id) => messages.find((m) => m.id === id);

  const send = async () => {
    if (!activeProfile) return;
    const items = pendingForwardItems;
    if (items.length) {
      setPendingForwardItems([]);
      for (const item of items) {
        const { data } = await sendMessage(session.user.id, activeProfile.id, item.type, item.content || null, item.media_url || null);
        if (data) {
          await supabase.from('messages').update({ forwarded: true }).eq('id', data.id);
          data.forwarded = true;
          setMessages((prev) => [...prev, data]);
          upsertConversation(activeProfile.id, item.content, item.type);
        }
      }
    }
    if (!draft.trim()) return;
    const text = draft.trim().slice(0, MAX_CHARS);
    setDraft('');
    const replyId = replyingTo?.id || null;
    setReplyingTo(null);
    const wasForward = items.length === 1 && items[0].type === 'text';
    const { data } = await sendMessage(session.user.id, activeProfile.id, 'text', text, null);
    if (data) {
      if (replyId) { await supabase.from('messages').update({ reply_to_id: replyId }).eq('id', data.id); data.reply_to_id = replyId; }
      if (wasForward) { await supabase.from('messages').update({ forwarded: true }).eq('id', data.id); data.forwarded = true; }
      setMessages((prev) => [...prev, data]);
      upsertConversation(activeProfile.id, text, 'text');
    }
  };

  const saveEdit = async () => {
    if (!editingMessage || !draft.trim()) return;
    const newText = draft.trim().slice(0, MAX_CHARS);
    await supabase.from('messages').update({ content: newText, edited: true }).eq('id', editingMessage.id);
    setMessages((prev) => prev.map((m) => (m.id === editingMessage.id ? { ...m, content: newText, edited: true } : m)));
    setEditingMessage(null);
    setDraft('');
  };

  const MAX_PHOTOS_PER_SEND = 10;

  const handleFile = async (e, kind) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || !activeProfile) return;
    setShowAttach(false);
    const capped = files.slice(0, MAX_PHOTOS_PER_SEND);
    setUploading(true);
    for (const file of capped) {
      const { url, error } = await uploadMedia(file, session.user.id);
      if (!error && url) {
        const { data } = await sendMessage(session.user.id, activeProfile.id, kind, null, url);
        if (data) setMessages((prev) => [...prev, data]);
      }
    }
    await upsertConversation(activeProfile.id, null, kind);
    setUploading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        setRecording(false);
        if (!activeProfile) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        setUploading(true);
        const { url, error } = await uploadMedia(file, session.user.id);
        if (!error && url) {
          const { data } = await sendMessage(session.user.id, activeProfile.id, 'audio', null, url);
          if (data) { setMessages((prev) => [...prev, data]); upsertConversation(activeProfile.id, null, 'audio'); }
        }
        setUploading(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      alert('Microphone access is needed to send a voice message.');
    }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); };

  const handleDelete = async (messageId) => {
    const { data } = await deleteMessage(messageId);
    if (data) setMessages((prev) => prev.map((m) => (m.id === messageId ? data : m)));
  };

  const handleReport = async (profile, reason) => {
    await reportUser(session.user.id, profile.id, reason);
  };

  const toggleSelect = (id) => {
    setSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };
  const cancelSelection = () => { setSelectionMode(false); setSelectedIds(new Set()); };

  const selectedMessages = messages.filter((m) => selectedIds.has(m.id));
  const selectionInfo = {
    copy: selectedMessages.length === 1 && selectedMessages[0].type === 'text' && !selectedMessages[0].deleted,
    canEditText: selectedMessages.length === 1 && selectedMessages[0].type === 'text' && !selectedMessages[0].deleted && selectedMessages[0].sender_id === session.user.id,
    allMine: selectedMessages.length > 0 && selectedMessages.every((m) => m.sender_id === session.user.id && !m.deleted),
    canReport: selectedMessages.length === 1,
  };

  const doCopy = () => {
    if (selectedMessages[0]?.content) navigator.clipboard?.writeText(selectedMessages[0].content);
    cancelSelection();
  };

  const doStartEdit = () => {
    const m = selectedMessages[0];
    if (!m) return;
    setEditingMessage(m);
    setDraft(m.content || '');
    cancelSelection();
  };

  const doStartReply = () => {
    const m = selectedMessages[0];
    if (!m) return;
    setReplyingTo(m);
    setEditingMessage(null);
    cancelSelection();
  };

  const doDeleteForMe = () => {
    const ids = [...selectedIds];
    hideMessagesLocally(ids);
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    cancelSelection();
  };

  const doDeleteForEveryone = async () => {
    const ids = [...selectedIds];
    for (const id of ids) { await deleteMessage(id); }
    setMessages((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, deleted: true } : m)));
    cancelSelection();
  };

  const openForward = () => {
    setForwardTargets(selectedMessages.length ? selectedMessages : (viewerUrl ? [{ type: 'image', media_url: viewerUrl, content: null }] : []));
    setForwardOpen(true);
  };

  const doForward = async (targetProfile) => {
    setForwardOpen(false);
    setViewerUrl(null);
    cancelSelection();
    await openChat(targetProfile, null);
    setPendingForwardItems(forwardTargets);
    if (forwardTargets.length === 1 && forwardTargets[0].type === 'text') {
      setDraft(forwardTargets[0].content || '');
    }
  };

  const doCopySingle = (m) => { if (m.content) navigator.clipboard?.writeText(m.content); setContextMenuFor(null); };
  const doStartEditSingle = (m) => { setEditingMessage(m); setDraft(m.content || ''); setReplyingTo(null); setContextMenuFor(null); };
  const doStartReplySingle = (m) => { setReplyingTo(m); setEditingMessage(null); setContextMenuFor(null); };
  const doDeleteForMeSingle = (m) => { hideMessagesLocally([m.id]); setMessages((prev) => prev.filter((x) => x.id !== m.id)); setContextMenuFor(null); };
  const doDeleteForEveryoneSingle = async (m) => { await deleteMessage(m.id); setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true } : x))); setContextMenuFor(null); };
  const openForwardSingle = (m) => { setForwardTargets([m]); setForwardOpen(true); setContextMenuFor(null); };
  const doReportSingle = (m) => { setReportModalFor(m.id); setContextMenuFor(null); };
  const doSelectMultipleFrom = (m) => { setContextMenuFor(null); toggleSelect(m.id); };
  const doReactSingle = (m, emoji) => { reactToMessage(m.id, emoji); setContextMenuFor(null); };

  const doReportMessage = async (reason) => {
    const id = reportModalFor || selectedMessages[0]?.id;
    if (id && id !== '__viewer__') await supabase.from('message_reports').insert({ reporter_id: session.user.id, message_id: id, reason });
    setReportModalFor(null);
    cancelSelection();
  };

  const reactToMessage = async (messageId, emoji) => {
    const mine = (messageLikes[messageId] || []).find((r) => r.user_id === session.user.id);
    setMessageLikes((prev) => {
      const next = { ...prev };
      const list = (next[messageId] || []).filter((r) => r.user_id !== session.user.id);
      if (!(mine && mine.emoji === emoji)) list.push({ user_id: session.user.id, emoji });
      next[messageId] = list;
      return next;
    });
    if (mine && mine.emoji === emoji) {
      await supabase.from('message_likes').delete().eq('message_id', messageId).eq('user_id', session.user.id);
    } else {
      await supabase.from('message_likes').upsert({ message_id: messageId, user_id: session.user.id, emoji }, { onConflict: 'message_id,user_id' });
    }
    setReactionPickerFor(null);
  };

  const confirmDeleteChat = () => {
    if (deleteConvoTarget) hideChatLocally(deleteConvoTarget.id);
    if (deleteConvoTarget && activeProfile?.id === deleteConvoTarget.otherProfile.id) { setActiveProfile(null); setMessages([]); }
    setDeleteConvoTarget(null);
    loadConversations();
  };

  const toggleActiveFollow = async () => {
    if (!activeProfile || activeFollowBusy) return;
    setActiveFollowBusy(true);
    if (activeFollowState !== 'none') {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', activeProfile.id);
      setActiveFollowState('none');
    } else {
      const status = activeProfile.is_private ? 'pending' : 'accepted';
      await supabase.from('follows').insert({ follower_id: session.user.id, following_id: activeProfile.id, status });
      setActiveFollowState(status);
    }
    setActiveFollowBusy(false);
  };

  const sendTyping = () => {
    if (!typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { from: session.user.id } });
  };

  useEffect(() => {
    if (!activeProfile) return;
    const [a, b] = pairKey(session.user.id, activeProfile.id);
    const channel = supabase.channel('typing-' + a + '-' + b);
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload.from !== session.user.id) {
        setTypingFrom(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingFrom(false), 2500);
      }
    }).subscribe();
    typingChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); typingChannelRef.current = null; setTypingFrom(false); };
  }, [activeProfile?.id]);

  if (!me) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgGradient }}>
        <Spinner size={28} color={theme.ink} />
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: FONT, height: '100dvh', width: '100vw', background: theme.bgGradient,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, boxSizing: 'border-box',
    }}>
      <GlobalStyle />
      <div style={glass(theme, {
        width: '100%', maxWidth: '100%', height: '100%', maxHeight: '100%', display: 'flex',
        borderRadius: 0, overflow: 'hidden', boxShadow: 'none', border: 'none',
        position: 'relative',
      })}>
        {profileOf && !showSettings && !showPrivacy && (
          <ProfilePanel
            profile={profileOf.id === me.id ? me : profileOf}
            isSelf={profileOf.id === me.id}
            userId={session.user.id}
            isOnline={onlineIds.has(profileOf.id)}
            onClose={() => setProfileOf(null)}
            onReport={handleReport}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={(p) => setProfileOf(p)}
            onMessage={(p) => { setProfileOf(null); openChat(p, null); }}
            onSaved={(updated) => { setMe(updated.id === me.id ? { ...updated, email: me.email } : me); if (activeProfile?.id === updated.id) setActiveProfile(updated); }}
          />
        )}
        {showSettings && !showPrivacy && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onOpenPrivacy={() => setShowPrivacy(true)}
            onOpenRequests={() => setShowFollowRequests(true)}
            onLogout={() => setShowLogoutConfirm(true)}
          />
        )}
        {showPrivacy && <PrivacyPanel onBack={() => setShowPrivacy(false)} />}
        {showFollowRequests && (
          <FollowRequestsPanel userId={session.user.id} onClose={() => setShowFollowRequests(false)}
            onOpenProfile={(p) => { setShowFollowRequests(false); setShowSettings(false); setProfileOf(p); }} />
        )}
        {showDiscover && (
          <DiscoverPanel myId={session.user.id} onClose={() => setShowDiscover(false)}
            onOpenProfile={(p) => { setShowDiscover(false); setProfileOf(p); }} />
        )}
        {showLogoutConfirm && (
          <LogoutConfirm onCancel={() => setShowLogoutConfirm(false)} onConfirm={onLogout} />
        )}

        <div style={{
          width: 320, minWidth: 320, display: mobileShowChat ? 'none' : 'flex',
          flexDirection: 'column', borderRight: `1px solid ${theme.border}`,
        }} className="zchat-sidebar">
          <div style={{ padding: '18px 18px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setProfileOf(me)}>
                <Avatar emoji={me.avatar} name={me.name} size={38} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{me.name}</div>
                  <div style={{ fontSize: 11.5, color: theme.muted }}>@{me.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Compass size={18} style={{ cursor: 'pointer', color: theme.muted }} onClick={() => setShowDiscover(true)} />
                <ThemeToggleIcon size={16} />
                <LogOut size={18} style={{ cursor: 'pointer', color: theme.muted }} onClick={() => setShowLogoutConfirm(true)} />
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 13, top: 12 }} />
              <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Find by username" autoCapitalize="none"
                style={{ ...inputStyle(theme), padding: '10px 12px 10px 36px' }} />
              {searching && <div style={{ position: 'absolute', right: 13, top: 12 }}><Spinner size={14} color={theme.muted} /></div>}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
            {search.length >= 2 ? (
              <>
                {!searching && results.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13 }}>No one found with that username</div>
                )}
                {results.map((u) => {
                  const existingConv = conversations.find((c) => c.otherProfile.id === u.id);
                  const unread = existingConv ? isUnread(existingConv) : false;
                  return (
                    <div key={u.id} onClick={() => { openChat(u, existingConv?.id); setSearch(''); setResults([]); }} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', cursor: 'pointer',
                      borderRadius: 14, marginBottom: 2, borderBottom: `1px solid ${theme.border}`,
                      background: activeProfile?.id === u.id ? theme.rowBg : 'transparent',
                    }}>
                      <Avatar emoji={u.avatar} name={u.name} online={onlineIds.has(u.id)} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: unread ? 800 : 700, fontSize: 14.5, color: theme.ink }}>{u.name}</div>
                        <div style={{
                          fontSize: 12, color: unread ? theme.ink : theme.muted, fontWeight: unread ? 700 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {existingConv ? `${existingConv.last_sender_id === session.user.id ? 'You: ' : ''}${existingConv.last_message}` : `@${u.username}`}
                        </div>
                      </div>
                      {unread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.coral, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </>
            ) : conversations.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: theme.muted, fontSize: 12.5, lineHeight: 1.6 }}>
                Search a username above to start a new conversation
              </div>
            ) : (
              conversations.map((c) => {
                const unread = isUnread(c);
                const pinned = isPinnedByMe(c);
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', cursor: 'pointer',
                    borderRadius: 14, marginBottom: 2, borderBottom: `1px solid ${theme.border}`, position: 'relative',
                    background: activeProfile?.id === c.otherProfile.id ? theme.rowBg : (pinned ? `${theme.coral}0A` : 'transparent'),
                  }}>
                    <div onClick={() => openChat(c.otherProfile, c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} online={onlineIds.has(c.otherProfile.id)} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {pinned && <span style={{ fontSize: 11 }}>📌</span>}
                          <div style={{ fontWeight: unread ? 800 : 700, fontSize: 14.5, color: theme.ink }}>{c.otherProfile.name}</div>
                        </div>
                        <div style={{
                          fontSize: 12, color: unread ? theme.ink : theme.muted, fontWeight: unread ? 700 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {c.last_sender_id === session.user.id ? 'You: ' : ''}{c.last_message}
                        </div>
                      </div>
                      {unread && <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.coral, flexShrink: 0 }} />}
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); setRowMenuFor(rowMenuFor === c.id ? null : c.id); }} style={{ padding: 6, cursor: 'pointer', flexShrink: 0 }}>
                      <MoreVertical size={16} color={theme.muted} />
                    </div>
                    {rowMenuFor === c.id && (
                      <div style={{
                        position: 'absolute', right: 10, top: 44, background: theme.panelBg, borderRadius: 14,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, width: 160, overflow: 'hidden',
                      }}>
                        <div onClick={(e) => { e.stopPropagation(); togglePin(c); setRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
                          {pinned ? 'Unpin chat' : 'Pin chat'}
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); setRowMenuFor(null); toggleArchive(c.id, true); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
                          Archive chat
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); setRowMenuFor(null); setDeleteConvoTarget(c); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.danger, cursor: 'pointer' }}>
                          Delete chat
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {archivedConversations.length > 0 && (
              <div onClick={() => setShowArchived(true)} style={{ textAlign: 'center', padding: '12px 10px', fontSize: 12.5, color: theme.coralDeep, fontWeight: 700, cursor: 'pointer' }}>
                Archived chats ({archivedConversations.length})
              </div>
            )}
          </div>
        </div>


        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }} className="zchat-panel">
          {!activeProfile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: theme.muted, fontSize: 14, textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
              Search a username on the left<br />to start a conversation
            </div>
          ) : (
            <>
              {selectionMode ? (
                <MessageActionBar
                  count={selectedIds.size}
                  canEditActions={selectionInfo}
                  onCancel={cancelSelection}
                  onCopy={doCopy}
                  onForward={openForward}
                  onDeleteForMe={doDeleteForMe}
                  onDeleteForEveryone={doDeleteForEveryone}
                  onReport={() => setReportModalFor(selectedMessages[0]?.id)}
                  onEdit={doStartEdit}
                  onReply={doStartReply}
                  onReact={() => setReactionPickerFor(selectedMessages[0]?.id)}
                />
              ) : (
                <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                  onClick={() => setProfileOf(activeProfile)}>
                  <ArrowLeft size={20} style={{ cursor: 'pointer', display: 'none' }} className="zchat-back"
                    onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }} />
                  <Avatar emoji={activeProfile.avatar} name={activeProfile.name} online={onlineIds.has(activeProfile.id)} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{activeProfile.name}</div>
                    <div style={{ fontSize: 12, color: typingFrom ? theme.coral : theme.muted, fontWeight: typingFrom ? 700 : 400 }}>
                      {typingFrom ? 'typing...' : `@${activeProfile.username}`}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleActiveFollow(); }} disabled={activeFollowBusy} style={{
                    padding: '6px 14px', borderRadius: 18, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
                    border: activeFollowState !== 'none' ? `1.5px solid ${theme.border}` : 'none',
                    background: activeFollowState !== 'none' ? 'transparent' : theme.coral,
                    color: activeFollowState !== 'none' ? theme.ink : 'white',
                  }}>
                    {activeFollowBusy ? <Spinner size={11} color={activeFollowState !== 'none' ? theme.ink : 'white'} /> :
                      activeFollowState === 'accepted' ? 'Following' : activeFollowState === 'pending' ? 'Requested' : 'Follow'}
                  </button>
                </div>
              )}
              <div ref={scrollRef} style={{
                flex: 1, overflowY: 'auto', padding: '16px 18px',
                ...(bgPatternOn ? {
                  backgroundSize: '130px 130px',
                  backgroundRepeat: 'repeat',
                  backgroundImage: theme.dark
                    ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'%3E%3Cg fill='none' stroke='%23FF6B4A' stroke-width='1.6' opacity='0.14'%3E%3Cpath d='M20 20 q0 -8 8 -8 h14 q8 0 8 8 v10 q0 8 -8 8 h-8 l-6 6 v-6 h0 q-8 0 -8 -8 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23F3B54C' stroke-width='1.6' opacity='0.14'%3E%3Cpath d='M95 15 l2.5 6 6.5 0.5 -5 4.3 1.6 6.4 -5.6 -3.6 -5.6 3.6 1.6 -6.4 -5 -4.3 6.5 -0.5 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%2329C7B3' stroke-width='1.6' opacity='0.14'%3E%3Ccircle cx='30' cy='75' r='7'/%3E%3Cpath d='M30 70 v10 M25 75 h10'/%3E%3C/g%3E%3Cg fill='none' stroke='%23FF6B4A' stroke-width='1.6' opacity='0.12'%3E%3Cpath d='M85 70 l14 -7 -5 14 -3 -5 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23F3B54C' stroke-width='1.6' opacity='0.12'%3E%3Cpath d='M55 105 c0 -14 20 -14 20 0 c0 8 -6 10 -10 14 c-4 -4 -10 -6 -10 -14 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%2329C7B3' stroke-width='1.6' opacity='0.12'%3E%3Crect x='10' y='105' width='16' height='12' rx='3'/%3E%3Ccircle cx='18' cy='111' r='3'/%3E%3C/g%3E%3C/svg%3E\")"
                    : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'%3E%3Cg fill='none' stroke='%23FF6B4A' stroke-width='1.6' opacity='0.16'%3E%3Cpath d='M20 20 q0 -8 8 -8 h14 q8 0 8 8 v10 q0 8 -8 8 h-8 l-6 6 v-6 h0 q-8 0 -8 -8 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23F3B54C' stroke-width='1.6' opacity='0.16'%3E%3Cpath d='M95 15 l2.5 6 6.5 0.5 -5 4.3 1.6 6.4 -5.6 -3.6 -5.6 3.6 1.6 -6.4 -5 -4.3 6.5 -0.5 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%2329C7B3' stroke-width='1.6' opacity='0.16'%3E%3Ccircle cx='30' cy='75' r='7'/%3E%3Cpath d='M30 70 v10 M25 75 h10'/%3E%3C/g%3E%3Cg fill='none' stroke='%23FF6B4A' stroke-width='1.6' opacity='0.14'%3E%3Cpath d='M85 70 l14 -7 -5 14 -3 -5 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23F3B54C' stroke-width='1.6' opacity='0.14'%3E%3Cpath d='M55 105 c0 -14 20 -14 20 0 c0 8 -6 10 -10 14 c-4 -4 -10 -6 -10 -14 z'/%3E%3C/g%3E%3Cg fill='none' stroke='%2329C7B3' stroke-width='1.6' opacity='0.14'%3E%3Crect x='10' y='105' width='16' height='12' rx='3'/%3E%3Ccircle cx='18' cy='111' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
                } : {}),
              }}>
                {loadingConvo ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}><Spinner color={theme.ink} /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: theme.muted, marginTop: 40, fontSize: 13.5 }}>No messages yet. Say hi 👋</div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.id} m={m} isMe={m.sender_id === session.user.id} onDelete={handleDelete}
                      selectionMode={selectionMode} selected={selectedIds.has(m.id)} onToggleSelect={toggleSelect}
                      onLongPress={(id) => setContextMenuFor(id)}
                      onOpenImage={setViewerUrl}
                      reactions={messageLikes[m.id] || []}
                      onReact={reactToMessage}
                      onOpenWhoReacted={(id) => setWhoReactedFor(messageLikes[id] || [])}
                      onSwipeReply={(msg) => { setReplyingTo(msg); setEditingMessage(null); }}
                      replyPreview={m.reply_to_id ? (() => {
                        const rm = findMessageById(m.reply_to_id);
                        if (!rm) return null;
                        return { content: rm.content, type: rm.type, senderLabel: rm.sender_id === session.user.id ? 'You' : activeProfile.name };
                      })() : null}
                    />
                  ))
                )}
              </div>
              {pendingForwardItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`, background: theme.rowBg }}>
                  <Send size={14} color={theme.coral} />
                  <div style={{ flex: 1, fontSize: 12, color: theme.ink, fontWeight: 700 }}>
                    {pendingForwardItems.length === 1
                      ? `Forwarding: ${pendingForwardItems[0].type === 'text' ? pendingForwardItems[0].content : pendingForwardItems[0].type === 'image' ? '📷 Photo' : pendingForwardItems[0].type === 'audio' ? '🎤 Voice message' : '🎥 Video'}`
                      : `Forwarding ${pendingForwardItems.length} messages`}
                  </div>
                  <X size={16} style={{ cursor: 'pointer', color: theme.muted }} onClick={() => { setPendingForwardItems([]); setDraft(''); }} />
                </div>
              )}
              {replyingTo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`, background: theme.rowBg }}>
                  <div style={{ flex: 1, borderLeft: `3px solid ${theme.coral}`, paddingLeft: 8, fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Replying to {replyingTo.sender_id === session.user.id ? 'yourself' : activeProfile.name}: {replyingTo.type === 'text' ? replyingTo.content : replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'audio' ? '🎤 Voice message' : '🎥 Video'}
                  </div>
                  <X size={16} style={{ cursor: 'pointer', color: theme.muted }} onClick={() => setReplyingTo(null)} />
                </div>
              )}
              {editingMessage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`, background: theme.rowBg }}>
                  <div style={{ flex: 1, fontSize: 12, color: theme.coralDeep, fontWeight: 700 }}>Editing message</div>
                  <X size={16} style={{ cursor: 'pointer', color: theme.muted }} onClick={() => { setEditingMessage(null); setDraft(''); }} />
                </div>
              )}
              {showAttach && (
                <div style={{ display: 'flex', gap: 18, padding: '12px 20px', borderTop: `1px solid ${theme.border}` }} className="zchat-fade">
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={22} color="#1B1B1F" />
                    </div>
                    <span style={{ fontSize: 11.5, color: theme.muted }}>Photo</span>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <VideoIcon size={22} color="white" />
                    </div>
                    <span style={{ fontSize: 11.5, color: theme.muted }}>Video</span>
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'video')} />
                  </label>
                </div>
              )}
              <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.border}` }}>
                {recording ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: theme.danger, animation: 'zchat-fade 1s infinite alternate' }} />
                    <span style={{ fontSize: 13, color: theme.ink, fontWeight: 700 }}>Recording... {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}</span>
                    <button onClick={stopRecording} style={{ ...primaryBtn(theme, false), marginTop: 0, marginLeft: 'auto', padding: '9px 18px' }}>Send</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Paperclip size={21} color={theme.muted} style={{ cursor: 'pointer', transform: showAttach ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                        onClick={() => setShowAttach((s) => !s)} />
                      <input value={draft} onChange={(e) => { setDraft(e.target.value.slice(0, MAX_CHARS)); sendTyping(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') (editingMessage ? saveEdit() : send()); }}
                        placeholder={uploading ? 'Uploading...' : editingMessage ? 'Edit message' : 'Type a message'} disabled={uploading}
                        style={{ ...inputStyle(theme), flex: 1, borderRadius: 22, padding: '11px 16px' }} />
                      {!draft.trim() && !editingMessage && !pendingForwardItems.length ? (
                        <button onClick={startRecording} style={{
                          width: 42, height: 42, borderRadius: '50%', background: theme.coral,
                          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                        }}><Mic size={19} color="white" /></button>
                      ) : (
                        <button onClick={editingMessage ? saveEdit : send} disabled={!draft.trim() && !pendingForwardItems.length} style={{
                          width: 42, height: 42, borderRadius: '50%', background: (draft.trim() || pendingForwardItems.length) ? theme.coral : theme.rowBg,
                          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: (draft.trim() || pendingForwardItems.length) ? 'pointer' : 'default', flexShrink: 0,
                        }}>
                          {editingMessage ? <Check size={18} color="white" /> : <Send size={18} color="white" />}
                        </button>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10.5, color: draft.length > MAX_CHARS - 50 ? theme.danger : theme.muted, marginTop: 4, paddingRight: 4 }}>
                      {draft.length}/{MAX_CHARS}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {viewerUrl && (
          <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)}
            onForward={() => { setForwardTargets([{ type: 'image', media_url: viewerUrl, content: null }]); setForwardOpen(true); }}
            onReport={() => setReportModalFor('__viewer__')} />
        )}
        {forwardOpen && (
          <ForwardPicker conversations={conversations} myId={session.user.id} onCancel={() => setForwardOpen(false)} onPick={doForward} />
        )}
        {reportModalFor && (
          <ReportMessageModal onCancel={() => setReportModalFor(null)} onSubmit={doReportMessage} />
        )}
        {deleteConvoTarget && (
          <DeleteChatConfirm name={deleteConvoTarget.otherProfile.name} onCancel={() => setDeleteConvoTarget(null)} onConfirm={confirmDeleteChat} />
        )}
        {reactionPickerFor && (
          <EmojiPickerBar onClose={() => setReactionPickerFor(null)} onPick={(emoji) => reactToMessage(reactionPickerFor, emoji)} />
        )}
        {whoReactedFor && (
          <WhoReactedModal reactions={whoReactedFor} onClose={() => setWhoReactedFor(null)} />
        )}
        {showArchived && (
          <ArchivedChatsPanel conversations={archivedConversations} onClose={() => setShowArchived(false)}
            onOpenChat={(c) => { setShowArchived(false); openChat(c.otherProfile, c.id); }}
            onUnarchive={(id) => toggleArchive(id, false)} />
        )}
        {contextMenuFor && (() => {
          const m = findMessageById(contextMenuFor);
          if (!m) return null;
          const isMine = m.sender_id === session.user.id;
          return (
            <MessageContextMenu
              message={m} isMine={isMine} canEditText={isMine && m.type === 'text' && !m.deleted}
              onClose={() => setContextMenuFor(null)}
              onReact={(emoji) => doReactSingle(m, emoji)}
              onReply={() => doStartReplySingle(m)}
              onCopy={() => doCopySingle(m)}
              onEdit={() => doStartEditSingle(m)}
              onForward={() => openForwardSingle(m)}
              onReport={() => doReportSingle(m)}
              onDeleteForMe={() => doDeleteForMeSingle(m)}
              onDeleteForEveryone={() => doDeleteForEveryoneSingle(m)}
              onSelectMultiple={() => doSelectMultipleFrom(m)}
            />
          );
        })()}
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

function ResetPasswordScreen({ onDone }) {
  const { theme } = useTheme();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const okPw = pw.length >= 6 && pw === pw2;

  const submit = async () => {
    if (!okPw || loading) return;
    setLoading(true); setErr('');
    const { error } = await setPassword(pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    onDone();
  };

  return (
    <div className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Lock size={18} color={theme.muted} /><span style={{ fontSize: 13.5, color: theme.muted }}>Set a new password</span>
      </div>
      <input style={{ ...inputStyle(theme), marginBottom: 10 }} type="password" placeholder="New password (min 6 characters)"
        value={pw} onChange={(e) => setPw(e.target.value)} />
      <input style={inputStyle(theme)} type="password" placeholder="Confirm new password"
        value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {pw2 && !okPw && pw !== pw2 && <div style={{ color: theme.danger, fontSize: 12, marginTop: 8 }}>Passwords don't match</div>}
      {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      <button style={primaryBtn(theme, !okPw || loading)} disabled={!okPw || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Update password'}
      </button>
    </div>
  );
}

function AppInner() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState('login');
  const [registering, setRegistering] = useState(false);
  const [resumeNotice, setResumeNotice] = useState('');
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const { theme } = useTheme();

  const handleNeedsProfile = async () => {
    await signOut();
    setSession(null);
    setResumeNotice('Your last signup didn\u2019t finish. Sign in again to pick up where you left off, or create a new account.');
    setScreen('login');
  };

  const handlePasswordUpdated = async () => {
    await signOut();
    setSession(null);
    setPasswordRecovery(false);
    setResumeNotice('Password updated. Sign in with your new password.');
    setScreen('login');
  };

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); setSession(s); return; }
      if (!passwordRecovery) setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, [passwordRecovery]);

  if (!checked) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgGradient }}>
        <Spinner size={28} color={theme.ink} />
      </div>
    );
  }

  if (passwordRecovery) {
    return (
      <AuthShell>
        <ResetPasswordScreen onDone={handlePasswordUpdated} />
      </AuthShell>
    );
  }

  if (session && !registering) {
    return (
      <ChatApp
        session={session}
        onLogout={async () => { await signOut(); setSession(null); setScreen('login'); }}
        onNeedsProfile={handleNeedsProfile}
      />
    );
  }

  return (
    <AuthShell>
      {resumeNotice && screen === 'login' && (
        <div style={{
          fontSize: 12.5, color: theme.coralDeep, background: `${theme.coral}14`, borderRadius: 12,
          padding: '10px 12px', marginBottom: 16, lineHeight: 1.5,
        }} className="zchat-fade">{resumeNotice}</div>
      )}
      {screen === 'login' && <LoginStep onSuccess={(s) => { setResumeNotice(''); setSession(s); }} onForgot={() => setScreen('forgot')} onGoRegister={() => { setResumeNotice(''); setScreen('register'); }} />}
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

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

