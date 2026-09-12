import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, createProfile, checkUsernameTaken,
  searchByUsername, getProfile, updateProfile, sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia, deleteMessage,
} from './supabaseClient.js';

/* ============================= THEME ============================= */

const ACCENT = {
  coral: '#FF6B4A',
  coralDeep: '#E8502F',
  gold: '#F3B54C',
  teal: '#29C7B3',
  danger: '#FF4D5E',
};

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
  useEffect(() => {
    try { localStorage.setItem('zchat-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  const theme = { ...THEMES[dark ? 'dark' : 'light'], ...ACCENT, dark };
  return <ThemeContext.Provider value={{ theme, dark, setDark }}>{children}</ThemeContext.Provider>;
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

/* Avatar now falls back gracefully if the image URL is broken */
function Avatar({ emoji = '🙂', online, size = 40 }) {
  const { theme } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = typeof emoji === 'string' && emoji.startsWith('http') && !imgFailed;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: isImage ? 'transparent' : `linear-gradient(135deg, ${theme.coral}, ${theme.gold})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.5, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
        overflow: 'hidden',
      }}>
        {isImage
          ? <img src={emoji} alt="" onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '🙂'}
      </div>
      {online != null && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: size * 0.28, height: size * 0.28,
          borderRadius: '50%', background: online ? theme.teal : '#B9BCC3', border: '2px solid white',
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
    <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} maxLength={1} inputMode="numeric" value={d}
          onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste}
          style={{
            width: 44, height: 54, textAlign: 'center', fontSize: 21, fontWeight: 800,
            borderRadius: 14, border: `1.5px solid ${theme.border}`, background: theme.inputBg,
            color: theme.ink, outline: 'none', fontFamily: FONT,
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
    if (error) { setErr(error.message); return; }
    onDone();
  };

  const StepDots = ({ active }) => (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 18 }}>
      {['email', 'otp', 'password', 'username'].map((s) => (
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

function SettingsPanel({ onClose, onOpenPrivacy, onLogout }) {
  const { theme, dark, setDark } = useTheme();
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

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>Accounts</div>
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

/* ============================= Profile panel (premium redesign) ============================= */

function ProfilePanel({ profile, isSelf, userId, onClose, onReport, onSaved, onOpenSettings }) {
  const { theme } = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [avatar, setAvatar] = useState(profile.avatar || '🙂');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

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
                <Avatar emoji={avatar} size={84} />
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
              <Avatar emoji={profile.avatar} online={profile.online} size={84} />
            </div>
          )}

          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 14, color: theme.ink, letterSpacing: '-0.01em' }}>{profile.name}</div>
          <div style={{
            display: 'inline-block', fontSize: 12.5, color: theme.coralDeep, fontWeight: 700, marginTop: 4,
            background: `${theme.coral}16`, padding: '3px 12px', borderRadius: 20,
          }}>@{profile.username}</div>

          {isSelf && !editing && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setEditing(true)} style={{
                padding: '9px 22px', borderRadius: 22, border: 'none',
                background: theme.ink, color: theme.dark ? '#121319' : 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
              }}>
                Edit profile
              </button>
            </div>
          )}

          {editing ? (
            <div style={{ marginTop: 22, textAlign: 'left' }}>
              <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>BIO</div>
              <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 140))}
                placeholder="Tell people about yourself"
                style={{ ...inputStyle(theme), height: 64, resize: 'none', fontFamily: FONT, marginBottom: 14 }} />
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
                <button onClick={() => setEditing(false)} style={{ ...primaryBtn(theme, false, theme.rowBg), color: theme.ink, marginTop: 0, flex: 1, boxShadow: 'none' }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ ...primaryBtn(theme, saving), marginTop: 0, flex: 1 }}>
                  {saving ? <Spinner /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20,
              }}>
                <div style={{ flex: profile.gender ? 1 : 'none', minWidth: 90, background: theme.rowBg, borderRadius: 16, padding: '10px 16px' }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{profile.followers ?? 0}</div>
                  <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Followers</div>
                </div>
                {profile.gender && (
                  <div style={{ flex: 1, minWidth: 90, background: theme.rowBg, borderRadius: 16, padding: '10px 16px' }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{profile.gender}</div>
                    <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Gender</div>
                  </div>
                )}
              </div>
              {profile.bio && (
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
    </div>
  );
}

function StatusTicks({ status }) {
  const { theme } = useTheme();
  const color = status === 'read' ? theme.coral : theme.muted;
  if (status === 'sent') return <Check size={14} color={color} />;
  return <CheckCheck size={14} color={color} />;
}

function MessageBubble({ m, isMe, onDelete }) {
  const { theme } = useTheme();
  const [hover, setHover] = useState(false);
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <div
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 6, marginBottom: 8 }}
      onTouchStart={() => setHover(true)}
    >
      {isMe && !m.deleted && (
        <Trash2 size={14} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, opacity: hover ? 1 : 0.35, transition: 'opacity 0.15s' }}
          onClick={() => onDelete(m.id)} />
      )}
      <div style={glass(theme, {
        maxWidth: '72%',
        background: m.deleted ? theme.rowBg : (isMe ? theme.bubbleMe : theme.bubbleThem),
        borderRadius: 16,
        padding: m.type === 'text' || m.deleted ? '9px 13px' : 5,
        border: m.deleted ? `1px dashed ${theme.border}` : `1px solid ${theme.border}`,
      })}>
        {m.deleted ? (
          <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>This message was deleted</div>
        ) : (
          <>
            {m.type === 'image' && <img src={m.media_url} alt="" style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2 }} />}
            {m.type === 'video' && <video src={m.media_url} controls style={{ width: '100%', maxWidth: 260, borderRadius: 12, display: 'block', marginBottom: m.content ? 4 : 2, background: '#000' }} />}
            {m.content && <div style={{ fontSize: 15, color: theme.ink, padding: m.type !== 'text' ? '0 4px' : 0, wordBreak: 'break-word', lineHeight: 1.4 }}>{m.content}</div>}
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3, padding: m.type !== 'text' && !m.deleted ? '0 4px 2px' : 0 }}>
          <span style={{ fontSize: 10.5, color: theme.muted }}>{time}</span>
          {isMe && !m.deleted && <StatusTicks status="delivered" />}
        </div>
      </div>
    </div>
  );
}

function ChatApp({ session, onLogout }) {
  const { theme } = useTheme();
  const [me, setMe] = useState(null);
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
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgGradient }}>
        <Spinner size={28} color={theme.ink} />
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: FONT, height: '100dvh', width: '100vw', background: theme.bgGradient,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 14, boxSizing: 'border-box',
    }}>
      <GlobalStyle />
      <div style={glass(theme, {
        width: '100%', maxWidth: 960, height: '100%', maxHeight: 860, display: 'flex',
        borderRadius: 26, overflow: 'hidden', boxShadow: '0 24px 70px rgba(31,20,15,0.2)',
        position: 'relative',
      })}>
        {profileOf && !showSettings && !showPrivacy && (
          <ProfilePanel
            profile={profileOf.id === me.id ? me : profileOf}
            isSelf={profileOf.id === me.id}
            userId={session.user.id}
            onClose={() => setProfileOf(null)}
            onReport={handleReport}
            onOpenSettings={() => setShowSettings(true)}
            onSaved={(updated) => { setMe(updated.id === me.id ? { ...updated, email: me.email } : me); if (activeProfile?.id === updated.id) setActiveProfile(updated); }}
          />
        )}
        {showSettings && !showPrivacy && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onOpenPrivacy={() => setShowPrivacy(true)}
            onLogout={() => setShowLogoutConfirm(true)}
          />
        )}
        {showPrivacy && <PrivacyPanel onBack={() => setShowPrivacy(false)} />}
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
                <Avatar emoji={me.avatar} size={38} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{me.name}</div>
                  <div style={{ fontSize: 11.5, color: theme.muted }}>@{me.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
            {search.length >= 2 && !searching && results.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: theme.muted, fontSize: 13 }}>No one found with that username</div>
            )}
            {search.length < 2 && (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: theme.muted, fontSize: 12.5, lineHeight: 1.6 }}>
                Search a username above to start a new conversation
              </div>
            )}
            {results.map((u) => (
              <div key={u.id} onClick={() => openChat(u)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', cursor: 'pointer',
                borderRadius: 14, marginBottom: 2,
                background: activeProfile?.id === u.id ? theme.rowBg : 'transparent',
              }}>
                <Avatar emoji={u.avatar} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink }}>{u.name}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>@{u.username}</div>
                </div>
              </div>
            ))}
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
              <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                onClick={() => setProfileOf(activeProfile)}>
                <ArrowLeft size={20} style={{ cursor: 'pointer', display: 'none' }} className="zchat-back"
                  onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }} />
                <Avatar emoji={activeProfile.avatar} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{activeProfile.name}</div>
                  <div style={{ fontSize: 12, color: theme.muted }}>@{activeProfile.username}</div>
                </div>
              </div>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>
                {loadingConvo ? (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}><Spinner color={theme.ink} /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: theme.muted, marginTop: 40, fontSize: 13.5 }}>No messages yet. Say hi 👋</div>
                ) : (
                  messages.map((m) => <MessageBubble key={m.id} m={m} isMe={m.sender_id === session.user.id} onDelete={handleDelete} />)
                )}
              </div>
              {showAttach && (
                <div style={{ display: 'flex', gap: 18, padding: '12px 20px', borderTop: `1px solid ${theme.border}` }} className="zchat-fade">
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={22} color="#1B1B1F" />
                    </div>
                    <span style={{ fontSize: 11.5, color: theme.muted }}>Photo</span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paperclip size={21} color={theme.muted} style={{ cursor: 'pointer', transform: showAttach ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                    onClick={() => setShowAttach((s) => !s)} />
                  <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
                    onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                    placeholder={uploading ? 'Uploading...' : 'Type a message'} disabled={uploading}
                    style={{ ...inputStyle(theme), flex: 1, borderRadius: 22, padding: '11px 16px' }} />
                  <button onClick={send} disabled={!draft.trim()} style={{
                    width: 42, height: 42, borderRadius: '50%', background: draft.trim() ? theme.coral : theme.rowBg,
                    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: draft.trim() ? 'pointer' : 'default', flexShrink: 0,
                  }}>
                    <Send size={18} color="white" />
                  </button>
                </div>
                <div style={{ textAlign: 'right', fontSize: 10.5, color: draft.length > MAX_CHARS - 50 ? theme.danger : theme.muted, marginTop: 4, paddingRight: 4 }}>
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

function AppInner() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState('login');
  const [registering, setRegistering] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgGradient }}>
        <Spinner size={28} color={theme.ink} />
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

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
