import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, Compass, Bell, Volume2, VolumeX, Palette, Mic, Play, Pause, Download, Users, Camera, Reply, Forward,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, createProfile, checkUsernameTaken,
  searchByUsername, getProfile, updateProfile, sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia, deleteMessage,
} from './supabaseClient.js';


const ACCENT_PALETTES = {
  coral: { coral: '#2E7CF6', coralDeep: '#1B5FD1', gold: '#5FA8FF', teal: '#00C2A8', danger: '#ED4956' },
  ocean: { coral: '#00B4FF', coralDeep: '#0089CC', gold: '#5FD9C4', teal: '#00C2A8', danger: '#ED4956' },
  berry: { coral: '#7C5CFC', coralDeep: '#5E3AE0', gold: '#B98CFF', teal: '#00C2A8', danger: '#ED4956' },
};
const ACCENT = ACCENT_PALETTES.coral;

const THEMES = {
  light: {
    bgGradient: '#F5F7FB',
    glass: 'rgba(255,255,255,0.85)',
    panelBg: '#FFFFFF',
    border: 'rgba(20,30,60,0.09)',
    ink: '#0B1220',
    muted: '#6E7688',
    bubbleMe: '#E9F2FF',
    bubbleThem: '#F1F3F7',
    inputBg: '#F5F7FB',
    rowBg: 'rgba(30,60,120,0.045)',
  },
  dark: {
    bgGradient: '#050810',
    glass: 'rgba(13,18,32,0.85)',
    panelBg: '#0C1120',
    border: 'rgba(120,160,255,0.12)',
    ink: '#F1F4FF',
    muted: '#8892A8',
    bubbleMe: '#123259',
    bubbleThem: '#151A2C',
    inputBg: '#0F1424',
    rowBg: 'rgba(120,160,255,0.07)',
  },
};

const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try { const v = localStorage.getItem('zchat-theme'); return v ? v === 'dark' : true; } catch { return true; }
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
  const [fontScale, setFontScale] = useState(() => {
    try { return parseFloat(localStorage.getItem('zchat-fontscale')) || 1; } catch { return 1; }
  });
  const [chatTheme, setChatTheme] = useState(() => {
    try { return localStorage.getItem('zchat-chattheme') || 'classic'; } catch { return 'classic'; }
  });
  useEffect(() => {
    try { localStorage.setItem('zchat-fontscale', String(fontScale)); } catch {}
  }, [fontScale]);
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
  useEffect(() => {
    try { localStorage.setItem('zchat-chattheme', chatTheme); } catch {}
  }, [chatTheme]);
  const accent = ACCENT_PALETTES[accentName] || ACCENT_PALETTES.coral;
  const theme = { ...THEMES[dark ? 'dark' : 'light'], ...accent, dark };
  return (
    <ThemeContext.Provider value={{ theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, bgPatternOn, setBgPatternOn, fontScale, setFontScale, chatTheme, setChatTheme }}>
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

function ZBrand({ size = 22, showTag = false }) {
  const { theme, chatTheme } = useTheme();
  const dotColor = chatTheme === 'love' ? '#FF4D8D' : chatTheme === 'neon' ? '#00FFDC' : theme.teal;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: size, color: theme.coral, letterSpacing: -0.5 }}>Z</span>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: size * 0.86, color: theme.ink }}>chat</span>
        <span style={{ width: size * 0.24, height: size * 0.24, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}`, flexShrink: 0 }} />
      </div>
      {showTag && <div style={{ fontSize: size * 0.28, letterSpacing: 1.5, color: theme.muted, marginTop: 2, textTransform: 'uppercase' }}>More than messages</div>}
    </div>
  );
}

const CHAT_THEMES = {
  classic: { label: 'Classic', bubbleRadius: 18, borderStyle: 'solid', glow: false, bg: 'none' },
  glass: { label: 'Frosted Glass', bubbleRadius: 22, borderStyle: 'solid', glow: false, bg: 'blobs' },
  love: { label: 'Love', bubbleRadius: 26, borderStyle: 'gradient', glow: 'pink', bg: 'hearts' },
  neon: { label: 'Neon', bubbleRadius: 22, borderStyle: 'solid', glow: 'cyan', bg: 'neon' },
};

function AnimatedChatBackground({ chatTheme }) {
  const spec = CHAT_THEMES[chatTheme] || CHAT_THEMES.classic;
  if (spec.bg === 'none') return null;
  if (spec.bg === 'hearts') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(120,20,80,0.35), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(60,10,60,0.3), transparent 55%)' }} />
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} style={{
            position: 'absolute', left: `${(i * 37) % 100}%`, bottom: -30,
            fontSize: 12 + (i % 5) * 6, opacity: 0.18 + (i % 3) * 0.06,
            animation: `zchat-float-up ${8 + (i % 6)}s linear infinite`, animationDelay: `${i * 1.3}s`,
          }}>💗</span>
        ))}
      </div>
    );
  }
  if (spec.bg === 'blobs') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{
          position: 'absolute', width: 340, height: 340, borderRadius: '50%', top: '-10%', left: '-15%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)',
          animation: 'zchat-drift-a 18s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 280, height: 280, borderRadius: '50%', bottom: '-10%', right: '-10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%)',
          animation: 'zchat-drift-b 22s ease-in-out infinite',
        }} />
      </div>
    );
  }
  if (spec.bg === 'neon') {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 10%, rgba(0,50,60,0.4), transparent 60%), radial-gradient(ellipse at 85% 85%, rgba(40,0,60,0.35), transparent 55%)' }} />
        <div style={{
          position: 'absolute', width: 260, height: 260, borderRadius: '50%', top: '10%', right: '-8%',
          background: 'radial-gradient(circle, rgba(0,255,220,0.16), transparent 70%)',
          animation: 'zchat-drift-a 14s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%', bottom: '5%', left: '-8%',
          background: 'radial-gradient(circle, rgba(190,0,255,0.14), transparent 70%)',
          animation: 'zchat-drift-b 17s ease-in-out infinite',
        }} />
      </div>
    );
  }
  return null;
}

function bubbleThemeStyle(chatTheme, isMe, theme) {
  const spec = CHAT_THEMES[chatTheme] || CHAT_THEMES.classic;
  const base = { borderRadius: spec.bubbleRadius };
  if (spec.borderStyle === 'gradient') {
    base.border = 'none';
    base.backgroundImage = isMe
      ? `linear-gradient(${theme.bubbleMe}, ${theme.bubbleMe}), linear-gradient(135deg, #FF7AA2, #FF4D8D)`
      : `linear-gradient(${theme.bubbleThem}, ${theme.bubbleThem}), linear-gradient(135deg, #FFB6C9, #FF8FAE)`;
    base.backgroundOrigin = 'border-box';
    base.backgroundClip = 'padding-box, border-box';
    base.border = '2px solid transparent';
  }
  if (chatTheme === 'neon') {
    base.border = `1.5px solid ${isMe ? '#00FFDC' : '#B026FF'}`;
    base.background = isMe ? 'rgba(0,255,220,0.10)' : 'rgba(176,38,255,0.10)';
  }
  if (spec.glow === 'pink') base.boxShadow = `0 0 16px ${isMe ? 'rgba(255,77,141,0.35)' : 'rgba(255,182,201,0.25)'}`;
  if (spec.glow === 'cyan') base.boxShadow = `0 0 14px ${isMe ? 'rgba(0,255,220,0.30)' : 'rgba(190,0,255,0.22)'}`;
  return base;
}

const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const MAX_CHARS = 1000;

const VAPID_PUBLIC_KEY = 'BPQngcM9FnRSK09G8_WBfzP_Gx6HXtYhtaIvXYLuGVFbojePmdVS-KUYUU63n6kFky3WBcbJLoZ48IvBmfoutAk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function subscribeToPush(userId) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = subscription.toJSON();
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    }, { onConflict: 'endpoint' });
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
}

async function sendPushNotification(userId, title, body, url, icon) {
  try {
    await supabase.functions.invoke('hyper-worker', { body: { user_id: userId, title, body, url: url || '/', icon: icon || undefined } });
  } catch (err) {
    console.error('Push notify failed:', err);
  }
}

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
      @keyframes zchat-float-up { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-620px) translateX(18px); opacity: 0; } }
      @keyframes zchat-drift-a { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px, 20px); } }
      @keyframes zchat-drift-b { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-24px, -18px); } }
      @keyframes zchat-love-pulse { 0%, 100% { box-shadow: 0 0 10px rgba(255,77,141,0.28); } 50% { box-shadow: 0 0 20px rgba(255,77,141,0.55); } }
      @keyframes zchat-neon-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.18); } }
      .zchat-bubble-love { animation: zchat-love-pulse 2.6s ease-in-out infinite; }
      .zchat-bubble-neon { animation: zchat-neon-pulse 2.2s ease-in-out infinite; }
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
function Avatar({ emoji, name = '', online, size = 40, ring = false }) {
  const { chatTheme, theme } = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = typeof emoji === 'string' && emoji.startsWith('http') && !imgFailed;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const ringColor = chatTheme === 'love' ? '#FF4D8D' : chatTheme === 'neon' ? '#00FFDC' : theme.coral;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: isImage ? 'transparent' : colorForName(name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42, fontWeight: 800, color: 'white', fontFamily: FONT,
        boxShadow: (ring && ringColor) ? `0 0 0 2.5px ${ringColor}, 0 0 10px ${ringColor}88` : 'inset 0 0 0 1px rgba(255,255,255,0.25)',
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
    <div id="zapp-root" style={{
      height: '100dvh', width: '100%', background: theme.bgGradient,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT, padding: 20, boxSizing: 'border-box', overflowY: 'auto', position: 'relative',
      paddingTop: 'calc(20px + env(safe-area-inset-top))',
      paddingLeft: 'calc(20px + env(safe-area-inset-left))',
      paddingRight: 'calc(20px + env(safe-area-inset-right))',
    }}>
      <GlobalStyle />
      <div style={{ position: 'absolute', top: 18, right: 18 }}><ThemeToggleIcon /></div>
      <div style={{ width: '100%', maxWidth: 380 }} className="zchat-fade">
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ display: 'inline-flex' }}><ZBrand size={34} showTag /></div>
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

const COUNTRIES = [
  ['AF','Afghanistan'],['AL','Albania'],['DZ','Algeria'],['AD','Andorra'],['AO','Angola'],['AR','Argentina'],['AM','Armenia'],['AU','Australia'],['AT','Austria'],['AZ','Azerbaijan'],
  ['BH','Bahrain'],['BD','Bangladesh'],['BY','Belarus'],['BE','Belgium'],['BZ','Belize'],['BJ','Benin'],['BT','Bhutan'],['BO','Bolivia'],['BA','Bosnia and Herzegovina'],['BW','Botswana'],
  ['BR','Brazil'],['BN','Brunei'],['BG','Bulgaria'],['BF','Burkina Faso'],['BI','Burundi'],['KH','Cambodia'],['CM','Cameroon'],['CA','Canada'],['CV','Cape Verde'],['CF','Central African Republic'],
  ['TD','Chad'],['CL','Chile'],['CN','China'],['CO','Colombia'],['KM','Comoros'],['CG','Congo'],['CD','DR Congo'],['CR','Costa Rica'],['HR','Croatia'],['CU','Cuba'],
  ['CY','Cyprus'],['CZ','Czechia'],['DK','Denmark'],['DJ','Djibouti'],['DO','Dominican Republic'],['EC','Ecuador'],['EG','Egypt'],['SV','El Salvador'],['EE','Estonia'],['ET','Ethiopia'],
  ['FJ','Fiji'],['FI','Finland'],['FR','France'],['GA','Gabon'],['GM','Gambia'],['GE','Georgia'],['DE','Germany'],['GH','Ghana'],['GR','Greece'],['GT','Guatemala'],
  ['GN','Guinea'],['GY','Guyana'],['HT','Haiti'],['HN','Honduras'],['HK','Hong Kong'],['HU','Hungary'],['IS','Iceland'],['IN','India'],['ID','Indonesia'],['IR','Iran'],
  ['IQ','Iraq'],['IE','Ireland'],['IL','Israel'],['IT','Italy'],['JM','Jamaica'],['JP','Japan'],['JO','Jordan'],['KZ','Kazakhstan'],['KE','Kenya'],['KW','Kuwait'],
  ['KG','Kyrgyzstan'],['LA','Laos'],['LV','Latvia'],['LB','Lebanon'],['LS','Lesotho'],['LR','Liberia'],['LY','Libya'],['LI','Liechtenstein'],['LT','Lithuania'],['LU','Luxembourg'],
  ['MO','Macao'],['MG','Madagascar'],['MW','Malawi'],['MY','Malaysia'],['MV','Maldives'],['ML','Mali'],['MT','Malta'],['MR','Mauritania'],['MU','Mauritius'],['MX','Mexico'],
  ['MD','Moldova'],['MC','Monaco'],['MN','Mongolia'],['ME','Montenegro'],['MA','Morocco'],['MZ','Mozambique'],['MM','Myanmar'],['NA','Namibia'],['NP','Nepal'],['NL','Netherlands'],
  ['NZ','New Zealand'],['NI','Nicaragua'],['NE','Niger'],['NG','Nigeria'],['NO','Norway'],['OM','Oman'],['PK','Pakistan'],['PA','Panama'],['PG','Papua New Guinea'],['PY','Paraguay'],
  ['PE','Peru'],['PH','Philippines'],['PL','Poland'],['PT','Portugal'],['QA','Qatar'],['RO','Romania'],['RU','Russia'],['RW','Rwanda'],['SA','Saudi Arabia'],['SN','Senegal'],
  ['RS','Serbia'],['SG','Singapore'],['SK','Slovakia'],['SI','Slovenia'],['SO','Somalia'],['ZA','South Africa'],['KR','South Korea'],['SS','South Sudan'],['ES','Spain'],['LK','Sri Lanka'],
  ['SD','Sudan'],['SR','Suriname'],['SE','Sweden'],['CH','Switzerland'],['SY','Syria'],['TW','Taiwan'],['TJ','Tajikistan'],['TZ','Tanzania'],['TH','Thailand'],['TG','Togo'],
  ['TT','Trinidad and Tobago'],['TN','Tunisia'],['TR','Turkey'],['TM','Turkmenistan'],['UG','Uganda'],['UA','Ukraine'],['AE','United Arab Emirates'],['GB','United Kingdom'],['US','United States'],['UY','Uruguay'],
  ['UZ','Uzbekistan'],['VE','Venezuela'],['VN','Vietnam'],['YE','Yemen'],['ZM','Zambia'],['ZW','Zimbabwe'],
];
const countryFlag = (code) => code.split('').map((c) => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');

function formatLastSeen(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  const now = new Date();
  const time = then.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const isToday = then.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = then.toDateString() === yesterday.toDateString();
  const diffMin = Math.round((now.getTime() - then.getTime()) / 60000);
  if (diffMin < 1) return 'Last seen just now';
  if (isToday) return `Last seen today at ${time}`;
  if (isYesterday) return `Last seen yesterday at ${time}`;
  const diffDay = Math.round(diffMin / 1440);
  if (diffDay < 7) return `Last seen ${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return `Last seen ${then.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

function getSavedAccounts() {
  try { return JSON.parse(localStorage.getItem('zchat-accounts') || '[]'); } catch { return []; }
}
function saveAccountEntry(entry) {
  const list = getSavedAccounts().filter((a) => a.id !== entry.id);
  list.push(entry);
  try { localStorage.setItem('zchat-accounts', JSON.stringify(list)); } catch {}
}
function removeAccountEntry(id) {
  const list = getSavedAccounts().filter((a) => a.id !== id);
  try { localStorage.setItem('zchat-accounts', JSON.stringify(list)); } catch {}
}


/* Blank out a person's avatar if they've hidden it and we're not looking at ourselves — applied once
   at the source so every screen (list rows, chat header, forward picker, discover, etc.) respects it. */
function sanitizeAvatar(profile, myId) {
  if (!profile) return profile;
  if (profile.hide_photo && profile.id !== myId) return { ...profile, avatar: '' };
  return profile;
}
function sanitizeAvatarList(list, myId) {
  return (list || []).map((p) => sanitizeAvatar(p, myId));
}


function CountryPicker({ value, onSelect, onClose }) {
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const filtered = COUNTRIES.filter(([, name]) => name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 96,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, padding: 18, width: '100%', maxWidth: 320, maxHeight: '70vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <X size={19} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, marginBottom: 10, paddingRight: 24 }}>Choose your country</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search"
          style={{ ...inputStyle(theme), padding: '8px 12px', fontSize: 13, marginBottom: 10 }} />
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map(([code, name]) => (
            <div key={code} onClick={() => { onSelect(code); onClose(); }} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', cursor: 'pointer',
              background: value === code ? theme.rowBg : 'transparent', borderRadius: 10,
            }}>
              <span style={{ fontSize: 20 }}>{countryFlag(code)}</span>
              <span style={{ fontSize: 13, color: theme.ink }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


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


function DeleteAccountConfirm({ onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const ok = text.trim().toUpperCase() === 'DELETE';
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24,
    }} className="zchat-fade">
      <div style={{
        background: theme.panelBg, borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 300,
        textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px',
          background: `${theme.danger}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.danger,
        }}>
          <Trash2 size={22} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: theme.ink }}>Delete your account?</div>
        <div style={{ fontSize: 12.5, marginBottom: 16, lineHeight: 1.5, color: theme.muted }}>
          Your profile disappears everywhere, no one can message you, and this can't be undone. Type DELETE to confirm.
        </div>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE"
          style={{ ...inputStyle(theme), textAlign: 'center', marginBottom: 14, fontWeight: 700 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`,
            background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
          }}>Cancel</button>
          <button onClick={async () => { setBusy(true); await onConfirm(); }} disabled={!ok || busy} style={{
            flex: 1, padding: 11, borderRadius: 13, border: 'none', background: theme.danger, opacity: (!ok || busy) ? 0.5 : 1,
            color: 'white', fontWeight: 700, fontSize: 13.5, cursor: (!ok || busy) ? 'default' : 'pointer', fontFamily: FONT,
          }}>{busy ? <Spinner size={13} /> : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

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

function SettingsPanel({ onClose, onOpenPrivacy, onOpenRequests, onLogout, hideActivity, onToggleActivity, onOpenAccounts, onOpenDelete }) {
  const { theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, bgPatternOn, setBgPatternOn, fontScale, setFontScale, chatTheme, setChatTheme } = useTheme();
  const accentLabels = { coral: 'Coral', ocean: 'Ocean', berry: 'Berry' };
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,10,14,0.45)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', zIndex: 30,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={glass(theme, {
        background: theme.panelBg, borderRadius: '0 24px 24px 0', padding: 26,
        width: '86%', maxWidth: 360, height: '100%', position: 'relative', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        paddingBottom: 'calc(26px + env(safe-area-inset-bottom))',
      })}>
        <X size={20} style={{ position: 'absolute', top: 18, right: 18, cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 19, color: theme.ink, marginBottom: 18 }}>Settings</div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '4px 0 6px 2px' }}>Chat theme</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {Object.entries(CHAT_THEMES).map(([key, spec]) => (
            <div key={key} onClick={() => setChatTheme(key)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14,
              border: chatTheme === key ? `2px solid ${theme.coral}` : `1.5px solid ${theme.border}`, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>{spec.label}</span>
              {chatTheme === key && <Check size={16} color={theme.coral} />}
            </div>
          ))}
        </div>

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

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>Privacy</div>
        <SettingsRow icon={<EyeOff size={16} />} label="Hide activity status" right={<ToggleSwitch on={hideActivity} onClick={onToggleActivity} />} />

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>Text size</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          {[{ v: 0.88, l: 'Small' }, { v: 1, l: 'Default' }, { v: 1.18, l: 'Large' }].map((opt) => (
            <div key={opt.l} onClick={() => setFontScale(opt.v)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontFamily: FONT,
              border: fontScale === opt.v ? `2px solid ${theme.coral}` : `1.5px solid ${theme.border}`,
              color: theme.ink, fontSize: 13 * opt.v, fontWeight: 700,
            }}>{opt.l}</div>
          ))}
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: theme.muted, margin: '16px 0 6px 2px' }}>About</div>
        <SettingsRow icon={<FileText size={16} />} label="Privacy policy" onClick={onOpenPrivacy} />
        <SettingsRow icon={<HelpCircle size={16} />} label="Help & support" onClick={() => {}} />

        <div style={{ height: 10 }} />
        <div onClick={() => setAccountOpen((s) => !s)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', cursor: 'pointer',
          fontSize: 14, fontWeight: 600, color: theme.ink,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${theme.coral}1F`, color: theme.coralDeep, flexShrink: 0,
          }}><User size={16} /></div>
          <div style={{ flex: 1 }}>Account</div>
          <ChevronRight size={17} color={theme.muted} style={{ transform: accountOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        </div>
        {accountOpen && (
          <div className="zchat-fade" style={{ paddingLeft: 4 }}>
            <SettingsRow icon={<Bell size={16} />} label="Follow requests" onClick={onOpenRequests} />
            <SettingsRow icon={<UserPlus size={16} />} label="Switch account" onClick={onOpenAccounts} />
            <SettingsRow icon={<Trash2 size={16} />} label="Delete my account" danger onClick={onOpenDelete} />
            <SettingsRow icon={<LogOut size={16} />} label="Log out" danger onClick={onLogout} />
          </div>
        )}
      </div>
    </div>
  );
}

function AccountSwitcherPanel({ accounts, currentId, onBack, onSwitch, onRemove, onAdd }) {
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
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Switch account</div>
        </div>
        {accounts.map((a) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: `1px solid ${theme.border}` }}>
            <div onClick={() => a.id !== currentId && onSwitch(a)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: a.id !== currentId ? 'pointer' : 'default', minWidth: 0 }}>
              <Avatar emoji={a.avatar} name={a.name} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.ink }}>
                  {a.name}{a.id === currentId && <span style={{ color: theme.coral, fontWeight: 700 }}> · Active</span>}
                </div>
                <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</div>
              </div>
            </div>
            {a.id !== currentId && <X size={16} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => onRemove(a.id)} />}
          </div>
        ))}
        <button onClick={onAdd} style={{ ...primaryBtn(theme, false), marginTop: 16 }}>+ Add another account</button>
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

function FollowListModal({ userId, viewerId, mode, onClose, onOpenProfile }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    (async () => {
      const col = mode === 'followers' ? 'following_id' : 'follower_id';
      const otherCol = mode === 'followers' ? 'follower_id' : 'following_id';
      const { data } = await supabase.from('follows').select('*').eq(col, userId).eq('status', 'accepted');
      const ids = (data || []).map((r) => r[otherCol]);
      if (!ids.length) { setList([]); return; }
      const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
      setList(sanitizeAvatarList(profs, viewerId));
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
    setRequests(sanitizeAvatarList(profs, userId).map((p) => ({ profile: p })));
  };
  useEffect(() => {
    load();
    const channel = supabase.channel('requests-watch-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const row = payload.new || payload.old;
        if (row.following_id === userId) load();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId]);

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

function DiscoverPanel({ myId, blockedIds, onClose, onOpenProfile }) {
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_private', false).eq('is_deleted', false).neq('id', myId).limit(40);
      setPeople(sanitizeAvatarList(data, myId).filter((p) => !blockedIds.has(p.id)));
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



function IconDownload({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" />
    </svg>
  );
}

function MessageContextMenu({ message, isMine, canEditText, canModerate, onClose, onReact, onReply, onCopy, onEdit, onForward, onReport, onDeleteForMe, onDeleteForEveryone, onSelectMultiple }) {
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
          <div style={row} onClick={onReply}><Reply size={16} /> Reply</div>
          {!message.deleted && message.type === 'text' && <div style={row} onClick={onCopy}><Check size={16} /> Copy</div>}
          {!message.deleted && canEditText && <div style={row} onClick={onEdit}><FileText size={16} /> Edit</div>}
          <div style={row} onClick={onForward}><Forward size={16} /> Forward</div>
          <div style={row} onClick={onSelectMultiple}><Check size={16} /> Select multiple</div>
          {!isMine && <div style={{ ...row, color: theme.danger }} onClick={onReport}><Flag size={16} color={theme.danger} /> Report</div>}
          <div style={{ ...row, color: theme.danger }} onClick={onDeleteForMe}><Trash2 size={16} color={theme.danger} /> Delete for me</div>
          {(isMine || canModerate) && !message.deleted && <div style={{ ...row, color: theme.danger }} onClick={onDeleteForEveryone}><Trash2 size={16} color={theme.danger} /> Delete for everyone</div>}
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


const WALLPAPER_PRESETS = ['default', 'coral', 'ocean', 'berry', 'solid-dark', 'solid-light'];
const WALLPAPER_COLORS = { coral: '#FF6B4A', ocean: '#3DA5F5', berry: '#C15CFC' };

function wallpaperBgStyle(key, theme) {
  if (!key || key === 'default') return null;
  if (key === 'solid-dark') return { backgroundColor: '#121319', backgroundImage: 'none' };
  if (key === 'solid-light') return { backgroundColor: '#F6F3EE', backgroundImage: 'none' };
  const color = WALLPAPER_COLORS[key] || WALLPAPER_COLORS.coral;
  const hex = color.replace('#', '%23');
  return {
    backgroundColor: theme.dark ? '#16171F' : '#F6F3EE',
    backgroundSize: '130px 130px',
    backgroundRepeat: 'repeat',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='130' height='130' viewBox='0 0 130 130'%3E%3Cg fill='none' stroke='${hex}' stroke-width='1.6' opacity='0.18'%3E%3Ccircle cx='30' cy='30' r='10'/%3E%3Ccircle cx='95' cy='75' r='7'/%3E%3Cpath d='M70 15 l16 8 -16 8 -16 -8 z'/%3E%3C/g%3E%3C/svg%3E")`,
  };
}

function WallpaperPicker({ value, onSelect, onClose }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 96,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, padding: 20, width: '100%', maxWidth: 320, position: 'relative' }}>
        <X size={19} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, marginBottom: 14, paddingRight: 24 }}>Chat wallpaper</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {WALLPAPER_PRESETS.map((key) => (
            <div key={key} onClick={() => { onSelect(key); onClose(); }} style={{
              height: 64, borderRadius: 14, cursor: 'pointer',
              border: value === key || (!value && key === 'default') ? `2.5px solid ${theme.coral}` : `1.5px solid ${theme.border}`,
              ...(key === 'default' ? { background: theme.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' } : wallpaperBgStyle(key, theme)),
            }}>
              {key === 'default' && <span style={{ fontSize: 10, fontWeight: 700, color: theme.ink }}>Default</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


async function hashPin(pin) {
  const enc = new TextEncoder().encode(pin);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function PinPad({ value, onChange, length = 4 }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: '50%',
          background: i < value.length ? theme.coral : theme.rowBg, border: `1.5px solid ${theme.border}`,
        }} />
      ))}
    </div>
  );
}

function PinKeypad({ onDigit, onBackspace }) {
  const { theme } = useTheme();
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {keys.map((k, i) => (
        <div key={i} onClick={() => { if (k === '⌫') onBackspace(); else if (k) onDigit(k); }} style={{
          height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: theme.ink, background: k ? theme.rowBg : 'transparent',
          cursor: k ? 'pointer' : 'default',
        }}>{k}</div>
      ))}
    </div>
  );
}

function ChatLockSetup({ onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [stage, setStage] = useState('enter');
  const [err, setErr] = useState('');

  const handleDigit = (d) => {
    if (stage === 'enter') {
      if (pin.length < 4) {
        const next = pin + d;
        setPin(next);
        if (next.length === 4) setTimeout(() => setStage('confirm'), 150);
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + d;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) onConfirm(pin);
          else { setErr('PINs did not match'); setTimeout(() => { setPin(''); setConfirmPin(''); setStage('enter'); setErr(''); }, 700); }
        }
      }
    }
  };
  const handleBackspace = () => { if (stage === 'enter') setPin((p) => p.slice(0, -1)); else setConfirmPin((p) => p.slice(0, -1)); };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 97,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30,
    }} className="zchat-fade">
      <Lock size={28} color={theme.coral} style={{ marginBottom: 10 }} />
      <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 4 }}>
        {stage === 'enter' ? 'Set a PIN' : 'Confirm your PIN'}
      </div>
      <div style={{ fontSize: 12, color: err ? theme.danger : theme.muted, marginBottom: 18, minHeight: 16 }}>{err || 'Only you can unlock this chat'}</div>
      <PinPad value={stage === 'enter' ? pin : confirmPin} />
      <div style={{ width: '100%', maxWidth: 220 }}>
        <PinKeypad onDigit={handleDigit} onBackspace={handleBackspace} />
      </div>
      <span style={{ ...ghostBtn(theme), marginTop: 22 }} onClick={onCancel}>Cancel</span>
    </div>
  );
}

function ChatLockUnlock({ onCancel, onUnlock, correctHash }) {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');

  const handleDigit = async (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      const h = await hashPin(next);
      if (h === correctHash) onUnlock();
      else { setErr('Incorrect PIN'); setTimeout(() => { setPin(''); setErr(''); }, 600); }
    }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 97,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30,
    }} className="zchat-fade">
      <Lock size={28} color={theme.coral} style={{ marginBottom: 10 }} />
      <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 4 }}>Enter PIN</div>
      <div style={{ fontSize: 12, color: err ? theme.danger : theme.muted, marginBottom: 18, minHeight: 16 }}>{err || 'This chat is locked'}</div>
      <PinPad value={pin} />
      <div style={{ width: '100%', maxWidth: 220 }}>
        <PinKeypad onDigit={handleDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} />
      </div>
      <span style={{ ...ghostBtn(theme), marginTop: 22 }} onClick={onCancel}>Back</span>
    </div>
  );
}


function ChatSettingsPanel({ conv, myId, isPinned, isLocked, wallpaper, onClose, onTogglePin, onToggleArchive, onSetWallpaper, onEnableLock, onDisableLock, onDeleteChat, onNicknameSaved }) {
  const { theme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showLockSetup, setShowLockSetup] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('contact_nicknames').select('nickname').eq('owner_id', myId).eq('contact_id', conv.otherProfile.id).maybeSingle();
      if (data) setNickname(data.nickname);
    })();
  }, [conv.otherProfile.id]);

  const saveNickname = async (val) => {
    setNicknameSaving(true);
    if (val.trim()) await supabase.from('contact_nicknames').upsert({ owner_id: myId, contact_id: conv.otherProfile.id, nickname: val.trim() }, { onConflict: 'owner_id,contact_id' });
    else await supabase.from('contact_nicknames').delete().eq('owner_id', myId).eq('contact_id', conv.otherProfile.id);
    setNicknameSaving(false);
    onNicknameSaved();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 33,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Chat settings</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <Avatar emoji={conv.otherProfile.avatar} name={conv.realName || conv.otherProfile.name} size={64} />
          <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, marginTop: 8 }}>{conv.realName || conv.otherProfile.name}</div>
          <div style={{ fontSize: 12, color: theme.muted }}>@{conv.otherProfile.username}</div>
        </div>

        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5, fontWeight: 800 }}>NICKNAME</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <input value={nickname} onChange={(e) => setNickname(e.target.value.slice(0, 30))} placeholder="Custom nickname"
            style={{ ...inputStyle(theme), fontSize: 13 }} />
          <button onClick={() => saveNickname(nickname)} disabled={nicknameSaving} style={{
            padding: '0 16px', borderRadius: 13, border: 'none', background: theme.coral, color: 'white',
            fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT,
          }}>{nicknameSaving ? <Spinner size={12} /> : 'Save'}</button>
        </div>

        <SettingsRow icon={<Pin_ />} label={isPinned ? 'Unpin chat' : 'Pin chat'} onClick={onTogglePin} />
        <SettingsRow icon={<FileText size={16} />} label="Archive chat" onClick={onToggleArchive} />
        <SettingsRow icon={<ImageIcon size={16} />} label="Chat wallpaper" onClick={() => setShowWallpaper(true)} />
        <SettingsRow icon={<Lock size={16} />} label={isLocked ? 'Remove chat lock' : 'Lock this chat'}
          onClick={() => (isLocked ? onDisableLock() : setShowLockSetup(true))} />
        <div style={{ height: 10 }} />
        <SettingsRow icon={<Trash2 size={16} />} label="Delete chat" danger onClick={onDeleteChat} />
      </div>
      {showWallpaper && (
        <WallpaperPicker value={wallpaper} onSelect={onSetWallpaper} onClose={() => setShowWallpaper(false)} />
      )}
      {showLockSetup && (
        <ChatLockSetup onCancel={() => setShowLockSetup(false)} onConfirm={(pin) => { setShowLockSetup(false); onEnableLock(pin); }} />
      )}
    </div>
  );
}

function Pin_({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" /><path d="M5 17h14l-1.5-9a2 2 0 00-2-1.7H8.5a2 2 0 00-2 1.7z" />
    </svg>
  );
}


function GroupAvatar({ avatar, name, size = 44 }) {
  const { theme } = useTheme();
  if (avatar) {
    return <img src={avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: theme.coral, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Users size={Math.round(size * 0.5)} color="white" />
    </div>
  );
}

function CreateGroupPanel({ myId, onClose, onCreated }) {
  const { theme } = useTheme();
  const [step, setStep] = useState('members');
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState('');
  const timer = useRef(null);

  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await searchByUsername(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !selected.find((s) => s.id === u.id)));
    }, 300);
  };

  const toggleSelect = (p) => {
    setSelected((prev) => (prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));
  };

  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setErr('');
    let avatarUrl = null;
    if (avatarFile) {
      const { url } = await uploadMedia(avatarFile, myId);
      avatarUrl = url || null;
    }
    const { data: group, error } = await supabase.from('groups').insert({ name: name.trim().slice(0, 50), bio: bio.trim() || null, avatar: avatarUrl, created_by: myId }).select().single();
    if (error || !group) { setCreating(false); setErr(error?.message || 'Could not create the group.'); return; }
    const { error: memberErr } = await supabase.from('group_members').insert({ group_id: group.id, user_id: myId, role: 'admin', added_by: myId });
    if (memberErr) { setCreating(false); setErr(memberErr.message); return; }
    if (selected.length) {
      const { error: inviteErr } = await supabase.from('group_members').insert(selected.slice(0, 49).map((p) => ({ group_id: group.id, user_id: p.id, role: 'member', added_by: myId })));
      if (inviteErr) { setCreating(false); setErr(inviteErr.message); return; }
    }
    await supabase.from('messages').insert({
      sender_id: myId, group_id: group.id, type: 'system',
      content: selected.length ? `Group created and ${selected.map((p) => p.name).join(', ')} added` : 'Group created',
    });
    setCreating(false);
    onCreated(group);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 40, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={() => (step === 'details' ? setStep('members') : onClose())} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>{step === 'members' ? `Add members${selected.length ? ` (${selected.length})` : ''}` : 'Group details'}</div>
      </div>

      {step === 'members' ? (
        <>
          {selected.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 18px', overflowX: 'auto' }}>
              {selected.map((p) => (
                <div key={p.id} onClick={() => toggleSelect(p)} style={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Avatar emoji={p.avatar} name={p.name} size={48} />
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 2, maxWidth: 48, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
              <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search username" autoCapitalize="none"
                style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
            {results.map((p) => (
              <div key={p.id} onClick={() => toggleSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer' }}>
                <Avatar emoji={p.avatar} name={p.name} size={40} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: theme.muted }}>@{p.username}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected.find((s) => s.id === p.id) ? theme.coral : theme.border}`,
                  background: selected.find((s) => s.id === p.id) ? theme.coral : 'transparent',
                }} />
              </div>
            ))}
          </div>
          <div style={{ padding: 18 }}>
            <button onClick={() => setStep('details')} disabled={selected.length === 0} style={primaryBtn(theme, selected.length === 0)}>Next</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div onClick={() => document.getElementById('group-avatar-input').click()} style={{ display: 'inline-block', cursor: 'pointer', position: 'relative' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 84, height: 84, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={28} color="white" />
                </div>
              )}
            </div>
            <input id="group-avatar-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }} />
          </div>
          <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800 }}>GROUP NAME</div>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} placeholder="e.g. Weekend Trip"
            style={{ ...inputStyle(theme), marginBottom: 16 }} />
          <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800 }}>GROUP BIO (OPTIONAL)</div>
          <input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} placeholder="What's this group about?"
            style={{ ...inputStyle(theme), marginBottom: 20 }} />
          <button onClick={create} disabled={!name.trim() || creating} style={primaryBtn(theme, !name.trim() || creating)}>
            {creating ? <Spinner size={14} /> : 'Create group'}
          </button>
          {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{err}</div>}
        </div>
      )}
      {cropFile && (
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => {
          const file = new File([blob], 'group.jpg', { type: 'image/jpeg' });
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(blob));
          setCropFile(null);
        }} />
      )}
    </div>
  );
}

function GroupInfoPanel({ group, members, myId, myRole, isOwner, onClose, onPromote, onDemote, onMute, onUnmute, onKick, onLeave, onOpenProfile, onSaveBio, onSaveName, onSaveAvatar, onAddMembers, onTransferOwnership }) {
  const { theme } = useTheme();
  const isAdmin = myRole === 'admin';
  const [menuFor, setMenuFor] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(group.bio || '');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [cropFile, setCropFile] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const soleAdmin = isAdmin && members.filter((m) => m.role === 'admin').length === 1 && members.length > 1;
  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 40, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Group info</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '14px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div onClick={() => isAdmin && document.getElementById('group-info-avatar-input').click()} style={{ display: 'inline-block', cursor: isAdmin ? 'pointer' : 'default', position: 'relative' }}>
            <GroupAvatar avatar={group.avatar} name={group.name} size={72} />
            {isAdmin && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={12} color="white" />
              </div>
            )}
          </div>
          {isAdmin && (
            <input id="group-info-avatar-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }} />
          )}
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))}
                style={{ ...inputStyle(theme), fontSize: 13, width: 160 }} />
              <button onClick={() => { onSaveName(name); setEditingName(false); }} style={{
                padding: '0 14px', borderRadius: 12, border: 'none', background: theme.coral, color: 'white',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
              }}>Save</button>
            </div>
          ) : (
            <div onClick={() => isAdmin && setEditingName(true)} style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginTop: 8, cursor: isAdmin ? 'pointer' : 'default' }}>
              {group.name}
            </div>
          )}
          <div style={{ fontSize: 12, color: theme.muted }}>{members.length} members</div>
        </div>

        <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5, fontWeight: 800 }}>GROUP BIO</div>
        {editingBio ? (
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            <input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} placeholder="What's this group about?"
              style={{ ...inputStyle(theme), fontSize: 13 }} />
            <button onClick={() => { onSaveBio(bio); setEditingBio(false); }} style={{
              padding: '0 16px', borderRadius: 13, border: 'none', background: theme.coral, color: 'white',
              fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT,
            }}>Save</button>
          </div>
        ) : (
          <div onClick={() => isAdmin && setEditingBio(true)} style={{ fontSize: 13, color: group.bio ? theme.ink : theme.muted, marginBottom: 18, cursor: isAdmin ? 'pointer' : 'default' }}>
            {group.bio || (isAdmin ? 'Add a group bio' : 'No bio yet')}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: theme.muted, fontWeight: 800 }}>MEMBERS</div>
          {isAdmin && (
            <div onClick={() => setShowAddMembers(true)} style={{ fontSize: 12, color: theme.coral, fontWeight: 700, cursor: 'pointer' }}>+ Add</div>
          )}
        </div>
        {members.map((m) => (
          <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', position: 'relative' }}>
            <div onClick={() => onOpenProfile(m.profile)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0 }}>
              <Avatar emoji={m.profile.avatar} name={m.profile.name} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.profile.name}{m.user_id === myId && <span style={{ color: theme.muted, fontWeight: 500 }}>(you)</span>}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                  {m.user_id === group.created_by ? (
                    <span style={{ fontSize: 10.5, color: theme.coral, fontWeight: 700 }}>Owner</span>
                  ) : m.role === 'admin' && <span style={{ fontSize: 10.5, color: theme.coral, fontWeight: 700 }}>Admin</span>}
                  {m.muted && <span style={{ fontSize: 10.5, color: theme.muted, fontWeight: 700 }}>Muted</span>}
                </div>
                <div style={{ fontSize: 10.5, color: theme.muted }}>
                  Added by {m.added_by === m.user_id ? 'themself' : (members.find((x) => x.user_id === m.added_by)?.profile.name || 'someone who left')}
                  {' · '}{m.joined_at ? new Date(m.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + new Date(m.joined_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
            {isAdmin && m.user_id !== myId && m.user_id !== group.created_by && (
              <MoreVertical size={16} color={theme.muted} style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === m.user_id ? null : m.user_id); }} />
            )}
            {menuFor === m.user_id && m.user_id !== group.created_by && (
              <div style={{
                position: 'absolute', right: 0, top: 36, background: theme.panelBg, borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, zIndex: 5, overflow: 'hidden', minWidth: 170,
              }}>
                {isOwner && (m.role === 'admin' ? (
                  <div onClick={() => { onDemote(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Remove as admin</div>
                ) : (
                  <div onClick={() => { onPromote(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Make admin</div>
                ))}
                {isOwner && (
                  <div onClick={() => { onTransferOwnership(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.coral, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Make owner</div>
                )}
                {m.muted ? (
                  <div onClick={() => { onUnmute(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Unmute in group</div>
                ) : (
                  <div onClick={() => { onMute(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Mute in group</div>
                )}
                <div onClick={() => { onKick(m.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.danger, cursor: 'pointer' }}>Remove from group</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: 18, borderTop: `1px solid ${theme.border}` }}>
        <span style={{ ...ghostBtn(theme), color: theme.danger, borderColor: theme.danger, display: 'block', textAlign: 'center', opacity: (soleAdmin || isOwner) ? 0.5 : 1, cursor: (soleAdmin || isOwner) ? 'default' : 'pointer' }}
          onClick={() => { if (!soleAdmin && !isOwner) onLeave(); }}>
          {isOwner ? 'Transfer ownership before leaving' : soleAdmin ? 'Leave group (assign a new admin first)' : 'Leave group'}
        </span>
      </div>
      {cropFile && (
        <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => { onSaveAvatar(blob); setCropFile(null); }} />
      )}
      {showAddMembers && (
        <AddMembersPanel myId={myId} existingIds={members.map((m) => m.user_id)}
          onClose={() => setShowAddMembers(false)}
          onAdd={(people) => { onAddMembers(people); setShowAddMembers(false); }} />
      )}
    </div>
  );
}
function AddMembersPanel({ myId, existingIds, onClose, onAdd }) {
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const timer = useRef(null);

  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await searchByUsername(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !existingIds.includes(u.id) && !selected.find((s) => s.id === u.id)));
    }, 300);
  };

  const toggleSelect = (p) => {
    setSelected((prev) => (prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));
  };

  return (
    <div style={{ position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 45, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Add members{selected.length ? ` (${selected.length})` : ''}</div>
      </div>
      <div style={{ padding: '14px 18px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
          <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search username" autoCapitalize="none"
            style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
        {results.map((p) => (
          <div key={p.id} onClick={() => toggleSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer' }}>
            <Avatar emoji={p.avatar} name={p.name} size={40} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: theme.muted }}>@{p.username}</div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected.find((s) => s.id === p.id) ? theme.coral : theme.border}`,
              background: selected.find((s) => s.id === p.id) ? theme.coral : 'transparent',
            }} />
          </div>
        ))}
      </div>
      <div style={{ padding: 18 }}>
        <button onClick={() => onAdd(selected)} disabled={selected.length === 0} style={primaryBtn(theme, selected.length === 0)}>
          Add {selected.length || ''}
        </button>
      </div>
    </div>
  );
}


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

function ProfilePanel({ profile, isSelf, userId, isOnline, onClose, onReport, onSaved, onOpenSettings, onOpenProfile, onMessage, isBlocked, onBlock, onUnblock }) {
  const { theme, chatTheme } = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : '');
  const [country, setCountry] = useState(profile.country || '');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
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
  const [showMoreDetails, setShowMoreDetails] = useState(false);

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
    const loadCounts = async () => {
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted');
      if (!cancelled) setFollowerCount(followers || 0);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('status', 'accepted');
      if (!cancelled) setFollowingCount(following || 0);
      if (isSelf) return;
      const { data } = await supabase.from('follows').select('status').eq('follower_id', userId).eq('following_id', profile.id).maybeSingle();
      if (!cancelled) setFollowState(data ? data.status : 'none');
    };
    loadCounts();
    const channel = supabase.channel('profile-follows-' + profile.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const row = payload.new || payload.old;
        if (row.following_id === profile.id || row.follower_id === profile.id) loadCounts();
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
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
      { const viewerProfile = (await getProfile(userId)).data;
      sendPushNotification(profile.id, 'ZChat', status === 'pending' ? `${viewerProfile?.name || 'Someone'} requested to follow you` : `${viewerProfile?.name || 'Someone'} started following you`, `/?profile=${userId}`, viewerProfile?.avatar); }
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
    let parsedAge = age.trim() === '' ? null : parseInt(age, 10);
    if (parsedAge != null && Number.isFinite(parsedAge)) {
      if (parsedAge < 12) { setUsernameErr('Age must be at least 12.'); return; }
      if (parsedAge > 99) { setUsernameErr('Age must be 99 or under.'); return; }
    }
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

  return (profile.is_deleted && !isSelf) ? (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 18,
    }} className="zchat-fade">
      <div style={{
        background: theme.panelBg, borderRadius: 28, padding: 30, textAlign: 'center',
        width: '100%', maxWidth: 320, boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
      }}>
        <div onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderRadius: '50%',
          background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><X size={16} color={theme.ink} /></div>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '10px auto 14px', background: theme.rowBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted,
        }}><User size={28} /></div>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 6 }}>User not found</div>
        <div style={{ fontSize: 12.5, color: theme.muted }}>This account no longer exists.</div>
      </div>
    </div>
  ) : (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 18,
    }} className="zchat-fade">
      <div style={{
        background: theme.panelBg, borderRadius: 28,
        width: '100%', maxWidth: 360, position: 'relative', maxHeight: '88vh', overflowY: 'auto',
        boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Header banner */}
        <div style={{
          height: 100, borderRadius: '28px 28px 0 0', position: 'relative',
          background: chatTheme === 'love'
            ? 'linear-gradient(135deg, #FF7AA2 0%, #FF4D8D 100%)'
            : chatTheme === 'neon'
              ? 'linear-gradient(135deg, #00FFDC 0%, #B026FF 100%)'
              : `linear-gradient(135deg, ${theme.coral} 0%, ${theme.gold} 100%)`,
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
              <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: 'white', margin: '0 auto', boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar emoji={(isSelf || !profile.hide_photo) ? profile.avatar : ''} name={profile.name} online={isOnline} size={84} />
            </div>
          )}

          <div style={{ fontWeight: 800, fontSize: 20, marginTop: 14, color: theme.ink, letterSpacing: '-0.01em' }}>{profile.name}</div>
          <div style={{
            display: 'inline-block', fontSize: 12.5, color: theme.coralDeep, fontWeight: 700, marginTop: 4,
            background: `${theme.coral}16`, padding: '3px 12px', borderRadius: 20,
          }}>@{profile.username}</div>
          {!isSelf && !isOnline && !profile.hide_activity && formatLastSeen(profile.last_seen) && (
            <div style={{
              display: 'inline-block', fontSize: 11, color: theme.muted, fontWeight: 600, marginTop: 7,
              background: theme.rowBg, padding: '3px 10px', borderRadius: 12,
            }}>{formatLastSeen(profile.last_seen)}</div>
          )}

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
                  <input value={age} onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                    setAge(digits);
                  }} onBlur={() => { if (age && parseInt(age, 10) < 12) setAge('12'); }}
                    inputMode="numeric" placeholder="Age" style={inputStyle(theme)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' }}>COUNTRY</div>
                  <div onClick={() => setShowCountryPicker(true)} style={{ ...inputStyle(theme), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {country ? <><span style={{ fontSize: 18 }}>{countryFlag(country)}</span></> : <span style={{ color: theme.muted }}>Choose</span>}
                  </div>
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
              </div>
              {!showMoreDetails ? (
                <div onClick={() => setShowMoreDetails(true)} style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: theme.coralDeep, fontWeight: 700, cursor: 'pointer' }}>
                  Show details
                </div>
              ) : (
                <div className="zchat-fade">
                  {(isSelf || (!profile.hide_gender && profile.gender)) && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                      <div style={{ minWidth: 100, background: theme.rowBg, borderRadius: 16, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{profile.gender || '—'}</div>
                        <div style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>Gender</div>
                      </div>
                    </div>
                  )}
                  {(isSelf || !profile.hide_age || !profile.hide_country) && (profile.age || profile.country) && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10, fontSize: 12, color: theme.muted }}>
                      {profile.age != null && (isSelf || !profile.hide_age) && <span>{profile.age} yrs</span>}
                      {profile.country && (isSelf || !profile.hide_country) && <span style={{ fontSize: 15 }}>{countryFlag(profile.country)}</span>}
                    </div>
                  )}
                  {profile.bio && (isSelf || !profile.hide_bio) && (
                    <div style={{ fontSize: 13.5, color: theme.ink, marginTop: 18, lineHeight: 1.6, padding: '0 4px' }}>{profile.bio}</div>
                  )}
                  <div onClick={() => setShowMoreDetails(false)} style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: theme.muted, fontWeight: 700, cursor: 'pointer' }}>
                    Hide details
                  </div>
                </div>
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
                padding: '9px 20px', borderRadius: 22, cursor: followBusy ? 'default' : 'pointer', fontFamily: FONT,
                border: followState !== 'none' ? `1.5px solid ${theme.border}` : 'none',
                background: followState === 'accepted' ? `${theme.coral}18` : followState === 'pending' ? 'transparent' : theme.coral,
                color: followState === 'accepted' ? theme.coralDeep : followState === 'pending' ? theme.ink : 'white',
                fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {followBusy ? <Spinner size={12} color={followState !== 'none' ? theme.ink : 'white'} /> : (
                  <>
                    {followState === 'accepted' ? <Check size={13} /> : followState === 'pending' ? null : <UserPlus size={13} />}
                    {followState === 'accepted' ? 'Following' : followState === 'pending' ? 'Requested' : 'Follow'}
                  </>
                )}
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
          {!isSelf && !editing && (
            <button onClick={() => (isBlocked ? onUnblock(profile.id) : onBlock(profile.id))} style={{
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
              width: '100%', padding: 12, borderRadius: 14, border: `1.5px solid ${theme.border}`, background: 'transparent',
              color: theme.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}>
              {isBlocked ? 'Unblock this account' : 'Block this account'}
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
        <FollowListModal userId={profile.id} viewerId={userId} mode={listModal} onClose={() => setListModal(null)}
          onOpenProfile={(p) => { setListModal(null); onOpenProfile(p); }} />
      )}
      {showPrivacySettings && (
        <AccountPrivacyPanel profile={profile} onClose={() => setShowPrivacySettings(false)}
          onSaved={(updated) => { onSaved(updated); setShowPrivacySettings(false); }} />
      )}
      {showCountryPicker && (
        <CountryPicker value={country} onSelect={setCountry} onClose={() => setShowCountryPicker(false)} />
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

function MessageBubble({ m, isMe, onDelete, selectionMode, selected, onToggleSelect, onLongPress, onOpenImage, reactions, onReact, onOpenWhoReacted, replyPreview, onSwipeReply, senderLabel, senderAvatar, hideReadStatus, onOpenSenderProfile, canModerate }) {
  const { theme, fontScale, chatTheme } = useTheme();
  const [hover, setHover] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);
  const lastTapRef = useRef(0);
  const pressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';

  if (m.type === 'system') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <div style={{ background: theme.rowBg, color: theme.muted, fontSize: 11.5, fontWeight: 600, padding: '6px 14px', borderRadius: 14, textAlign: 'center', maxWidth: '80%' }}>
          {m.content}
        </div>
      </div>
    );
  }

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
      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 8, marginBottom: 10, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
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
      {senderLabel && !m.deleted && (
        <div onClick={onOpenSenderProfile} style={{ cursor: onOpenSenderProfile ? 'pointer' : 'default', flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4 }}>
          <Avatar emoji={senderAvatar} name={senderLabel} size={26} />
        </div>
      )}
      <div style={{ position: 'relative', maxWidth: '72%' }}>
        {!selectionMode && !m.deleted && (
          <div onClick={() => onSwipeReply(m)} style={{
            position: 'absolute', top: 6, [isMe ? 'left' : 'right']: -26, cursor: 'pointer', opacity: hover ? 1 : 0, transition: 'opacity 0.15s',
          }}>
            <Reply size={13} color={theme.muted} />
          </div>
        )}
        <div onClick={handleTap} className={!m.deleted && chatTheme === 'love' ? 'zchat-bubble-love' : !m.deleted && chatTheme === 'neon' ? 'zchat-bubble-neon' : undefined} style={glass(theme, {
          background: m.deleted ? theme.rowBg : (isMe ? theme.bubbleMe : theme.bubbleThem),
          borderRadius: 18,
          borderBottomRightRadius: isMe && !m.deleted ? 4 : 18,
          borderBottomLeftRadius: !isMe && !m.deleted ? 4 : 18,
          padding: m.type === 'text' || m.deleted ? '9px 13px' : 5,
          border: selected ? `2px solid ${theme.coral}` : m.deleted ? `1px dashed ${theme.border}` : `1px solid ${theme.border}`,
          cursor: 'pointer',
          ...(m.deleted ? {} : bubbleThemeStyle(chatTheme, isMe, theme)),
        })}>
          {senderLabel && !m.deleted && (
            <div onClick={(e) => { e.stopPropagation(); onOpenSenderProfile && onOpenSenderProfile(); }} style={{ fontSize: 11.5, fontWeight: 700, color: theme.coralDeep, marginBottom: 3, padding: m.type !== 'text' ? '0 4px' : 0, cursor: onOpenSenderProfile ? 'pointer' : 'default', display: 'inline-block' }}>
              {senderLabel}
            </div>
          )}
          {m.forwarded && !m.deleted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: theme.muted, fontStyle: 'italic',
              marginBottom: 3, padding: m.type !== 'text' ? '0 4px' : 0,
            }}>
              <Forward size={10} color={theme.muted} /> {m.forwarded_from_name ? `Forwarded from ${m.forwarded_from_name}` : 'Forwarded'}
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
                <div style={{ position: 'relative', width: 220, height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: m.content ? 4 : 2 }}>
                  <img src={m.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <a href={m.media_url} download onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Download size={13} color="white" /></a>
                </div>
              )}
              {m.type === 'video' && (
                <div style={{ position: 'relative', width: 220, height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: m.content ? 4 : 2, background: '#000' }}>
                  <video src={m.media_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <a href={m.media_url} download onClick={(e) => e.stopPropagation()} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Download size={13} color="white" /></a>
                </div>
              )}
              {m.type === 'audio' && <AudioBubble url={m.media_url} isMe={isMe} />}
              {m.content && <div style={{ fontSize: 15 * fontScale, color: theme.ink, padding: m.type !== 'text' ? '0 4px' : 0, wordBreak: 'break-word', lineHeight: 1.4 }}>{m.content}</div>}
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 3, padding: m.type !== 'text' && !m.deleted ? '0 4px 2px' : 0 }}>
            {m.edited && !m.deleted && <span style={{ fontSize: 10, color: theme.muted, fontStyle: 'italic' }}>edited</span>}
            <span style={{ fontSize: 10.5, color: theme.muted }}>{time}</span>
            {isMe && !m.deleted && <StatusTicks status={(!hideReadStatus && m.read) ? 'read' : 'sent'} />}
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
        <div style={btn} onClick={onForward}><Forward size={16} /><span>Forward</span></div>
        {canEditActions.canReport && <div style={btn} onClick={onReport}><Flag size={16} color={theme.danger} /><span style={{ color: theme.danger }}>Report</span></div>}
        <div style={btn} onClick={onDeleteForMe}><Trash2 size={16} /><span style={{ whiteSpace: 'nowrap' }}>Delete me</span></div>
        {canEditActions.allMine && <div style={btn} onClick={onDeleteForEveryone}><Trash2 size={16} color={theme.danger} /><span style={{ color: theme.danger, whiteSpace: 'nowrap' }}>Delete all</span></div>}
      </div>
    </div>
  );
}


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
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId));
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

function ChatApp({ session, onLogout, onNeedsProfile, savedAccounts, onSwitchAccount, onAddAccount, onRemoveAccount }) {
  const { theme, bgPatternOn, chatTheme } = useTheme();
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
  const [pendingMedia, setPendingMedia] = useState([]);
  const [activeFollowState, setActiveFollowState] = useState('none');
  const [activeFollowBusy, setActiveFollowBusy] = useState(false);
  const [whoReactedFor, setWhoReactedFor] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [myBlockedIds, setMyBlockedIds] = useState(new Set());
  const [followRequestCount, setFollowRequestCount] = useState(0);
  const [listFilter, setListFilter] = useState('all');
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [myLocks, setMyLocks] = useState({});
  const [unlockedChats, setUnlockedChats] = useState(new Set());
  const [lockPromptFor, setLockPromptFor] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
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

  const myWallpaperField = (conv) => (conv.user_a === session.user.id ? 'wallpaper_a' : 'wallpaper_b');
  const myWallpaper = (conv) => conv[myWallpaperField(conv)];
  const setWallpaper = async (conv, key) => {
    await supabase.from('conversations').update({ [myWallpaperField(conv)]: key }).eq('id', conv.id);
    setActiveProfile((p) => p); // no-op trigger
    loadConversations();
  };

  const loadMyLocks = async () => {
    const { data } = await supabase.from('chat_locks').select('*').eq('owner_id', session.user.id);
    const map = {};
    (data || []).forEach((l) => { map[l.conversation_id] = l.pin_hash; });
    setMyLocks(map);
  };

  const loadMyBlocks = async () => {
    const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', session.user.id);
    setMyBlockedIds(new Set((data || []).map((b) => b.blocked_id)));
  };

  const loadFollowRequestCount = async () => {
    const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id).eq('status', 'pending');
    setFollowRequestCount(count || 0);
  };

  const blockUser = async (userId) => {
    await supabase.from('blocks').insert({ blocker_id: session.user.id, blocked_id: userId });
    setMyBlockedIds((prev) => new Set(prev).add(userId));
    if (activeProfile?.id === userId) { setActiveProfile(null); setMobileShowChat(false); }
    setProfileOf(null);
    loadConversations();
  };
  const unblockUser = async (userId) => {
    await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', userId);
    setMyBlockedIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
  };

  const deleteMyAccount = async () => {
    await supabase.from('profiles').update({ is_deleted: true }).eq('id', session.user.id);
    removeAccountEntry(session.user.id);
    onLogout();
  };

  const enableChatLock = async (conv, pin) => {
    const hash = await hashPin(pin);
    await supabase.from('chat_locks').upsert({ conversation_id: conv.id, owner_id: session.user.id, pin_hash: hash }, { onConflict: 'conversation_id,owner_id' });
    setMyLocks((prev) => ({ ...prev, [conv.id]: hash }));
    setUnlockedChats((prev) => new Set(prev).add(conv.id));
  };
  const disableChatLock = async (conv) => {
    await supabase.from('chat_locks').delete().eq('conversation_id', conv.id).eq('owner_id', session.user.id);
    setMyLocks((prev) => { const n = { ...prev }; delete n[conv.id]; return n; });
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
    const { data: profsRaw } = await supabase.from('profiles').select('*').in('id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000']);
    const profs = sanitizeAvatarList(profsRaw, session.user.id);
    const { data: nicks } = await supabase.from('contact_nicknames').select('*').eq('owner_id', session.user.id);
    const mergedAll = visible
      .map((c) => {
        const otherId = c.user_a === session.user.id ? c.user_b : c.user_a;
        if (myBlockedIds.has(otherId)) return null;
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
    if (me) { loadConversations(); loadMyLocks(); loadGroups(); loadMyBlocks(); subscribeToPush(session.user.id); loadFollowRequestCount(); supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id); }
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const params = new URLSearchParams(window.location.search);
    const dmId = params.get('dm');
    const groupId = params.get('group');
    const profileId = params.get('profile');
    if (dmId) {
      (async () => {
        const { data } = await getProfile(dmId);
        if (data) {
          await openChat(sanitizeAvatar(data, session.user.id), null);
          setTimeout(() => composerRef.current?.focus(), 300);
        }
      })();
    } else if (groupId) {
      (async () => {
        const { data } = await supabase.from('groups').select('*').eq('id', groupId).maybeSingle();
        if (data) await openGroup(data);
      })();
    } else if (profileId) {
      (async () => {
        const { data } = await getProfile(profileId);
        if (data) setProfileOf(sanitizeAvatar(data, session.user.id));
      })();
    }
    if (dmId || groupId || profileId) window.history.replaceState({}, '', window.location.pathname);
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
    if (!me || !activeProfile) return;
    const channel = supabase.channel('reactions-' + activeProfile.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_likes' }, (payload) => {
        const row = payload.new || payload.old;
        const msgId = row.message_id;
        if (!findMessageById(msgId)) return;
        setMessageLikes((prev) => {
          const next = { ...prev };
          const list = (next[msgId] || []).filter((r) => r.user_id !== row.user_id);
          if (payload.eventType !== 'DELETE') list.push({ user_id: row.user_id, emoji: row.emoji });
          next[msgId] = list;
          return next;
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, activeProfile, messages]);

  useEffect(() => {
    if (!me || !activeProfile) return;
    const channel = supabase.channel('follow-watch-' + activeProfile.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const row = payload.new || payload.old;
        if (row.follower_id === session.user.id && row.following_id === activeProfile.id) {
          setActiveFollowState(payload.eventType === 'DELETE' ? 'none' : row.status);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, activeProfile]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('profile-watch-' + me.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const rowRaw = payload.new;
        const row = sanitizeAvatar(rowRaw, session.user.id);
        if (row.id === me.id) setMe((prev) => ({ ...prev, ...rowRaw, email: prev.email }));
        if (activeProfile && row.id === activeProfile.id) setActiveProfile((prev) => ({ ...prev, ...row }));
        setProfileOf((prev) => (prev && prev.id === row.id ? { ...prev, ...row } : prev));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, activeProfile]);

  const myGroupIds = groups.map((g) => g.id);
  const myGroupIdsKey = myGroupIds.join(',');

  useEffect(() => {
    if (!me || !myGroupIds.length) return;
    const channel = supabase.channel('group-messages-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new;
        if (!row.group_id || !myGroupIds.includes(row.group_id)) return;
        if (row.sender_id !== me.id && (!activeGroup || row.group_id !== activeGroup.id)) playPing();
        setMessages((prev) => {
          if (!activeGroup || row.group_id !== activeGroup.id) return prev;
          if (prev.some((m) => m.id === row.id)) return prev;
          return [...prev, row];
        });
        loadGroups();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, myGroupIdsKey, activeGroup]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('group-members-watch-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, (payload) => {
        const row = payload.new || payload.old;
        if (row.user_id === me.id) loadGroups();
        if (activeGroup && row.group_id === activeGroup.id) {
          loadGroupMembers(activeGroup.id);
          if (payload.eventType === 'DELETE' && row.user_id === me.id) { setActiveGroup(null); setMobileShowChat(false); }
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, activeGroup]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('groups-watch-' + me.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups' }, (payload) => {
        const row = payload.new;
        if (activeGroup && row.id === activeGroup.id) setActiveGroup((prev) => ({ ...prev, ...row }));
        loadGroups();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me, activeGroup]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('presence-global', { config: { presence: { key: me.id } } });
    channel.on('presence', { event: 'sync' }, () => {
      setOnlineIds(new Set(Object.keys(channel.presenceState())));
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString() });
    });
    const updateLastSeen = () => { supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id); };
    const heartbeat = setInterval(updateLastSeen, 45000);
    const onVisibility = () => { if (document.visibilityState === 'hidden') updateLastSeen(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', updateLastSeen);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', updateLastSeen);
      updateLastSeen();
    };
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
      setResults(sanitizeAvatarList(data, session.user.id).filter((u) => u.id !== session.user.id && !u.is_deleted && !myBlockedIds.has(u.id)));
      setSearching(false);
    }, 300);
  };

  const loadGroups = async () => {
    const { data: mems } = await supabase.from('group_members').select('*').eq('user_id', session.user.id);
    if (!mems || !mems.length) { setGroups([]); return; }
    const ids = mems.map((m) => m.group_id);
    const { data: groupRows } = await supabase.from('groups').select('*').in('id', ids);
    const { data: lastMsgs } = await supabase.from('messages').select('*').in('group_id', ids).order('created_at', { ascending: false });
    const merged = (groupRows || []).map((g) => {
      const mine = mems.find((m) => m.group_id === g.id);
      const last = (lastMsgs || []).find((m) => m.group_id === g.id);
      return { ...g, myRole: mine?.role || 'member', last_message: last?.content, last_message_type: last?.type, last_message_at: last?.created_at || g.created_at };
    }).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    setGroups(merged);
  };

  const loadGroupMembers = async (groupId) => {
    const { data: mems } = await supabase.from('group_members').select('*').eq('group_id', groupId);
    const ids = (mems || []).map((m) => m.user_id);
    if (!ids.length) { setGroupMembers([]); return; }
    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
    const sanitized = sanitizeAvatarList(profs, session.user.id);
    setGroupMembers((mems || []).map((m) => ({ ...m, profile: sanitized.find((p) => p.id === m.user_id) })).filter((m) => m.profile));
  };

  const openGroup = async (group) => {
    setActiveGroup(group);
    setActiveProfile(null);
    setMobileShowChat(true);
    setLoadingConvo(true);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setReplyingTo(null);
    setEditingMessage(null);
    setPendingForwardItems([]);
    const { data } = await supabase.from('messages').select('*').eq('group_id', group.id).order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingConvo(false);
    loadGroupMembers(group.id);
  };

  const sendGroupMessage = async (type, content, mediaUrl, forwardedFromName) => {
    const { data, error } = await supabase.from('messages').insert({
      sender_id: session.user.id, group_id: activeGroup.id, type, content: content || null, media_url: mediaUrl || null,
      forwarded: !!forwardedFromName, forwarded_from_name: forwardedFromName || null,
    }).select().single();
    if (!error && data) {
      setMessages((prev) => [...prev, data]);
      loadGroups();
      if (type !== 'system') {
        const preview = type === 'text' ? content : type === 'image' ? '📷 Photo' : type === 'audio' ? '🎤 Voice message' : '🎥 Video';
        groupMembers.filter((m) => m.user_id !== session.user.id && !m.muted).forEach((m) => {
          sendPushNotification(m.user_id, `${me.name} in ${activeGroup.name}`, preview, `/?group=${activeGroup.id}`, me.avatar);
        });
      }
    }
    return data;
  };

  const memberName = (userId) => (userId === session.user.id ? 'You' : (groupMembers.find((m) => m.user_id === userId)?.profile.name || 'Someone'));
  const realName = (userId) => (userId === session.user.id ? (me?.name || 'Someone') : (groupMembers.find((m) => m.user_id === userId)?.profile.name || 'Someone'));

  const transferOwnership = async (userId) => {
    if (activeGroup.created_by !== session.user.id) return;
    await supabase.from('group_members').update({ role: 'admin' }).eq('group_id', activeGroup.id).eq('user_id', userId);
    const { error } = await supabase.from('groups').update({ created_by: userId }).eq('id', activeGroup.id);
    if (!error) {
      setActiveGroup((prev) => ({ ...prev, created_by: userId }));
      loadGroupMembers(activeGroup.id);
      loadGroups();
      sendGroupMessage('system', `${realName(session.user.id)} made ${realName(userId)} the group owner`, null);
    }
  };

  const promoteMember = async (userId) => {
    if (activeGroup.created_by !== session.user.id) return;
    await supabase.from('group_members').update({ role: 'admin' }).eq('group_id', activeGroup.id).eq('user_id', userId);
    loadGroupMembers(activeGroup.id);
    sendGroupMessage('system', `${realName(session.user.id)} made ${realName(userId)} an admin`, null);
  };
  const demoteMember = async (userId) => {
    if (activeGroup.created_by !== session.user.id) return;
    await supabase.from('group_members').update({ role: 'member' }).eq('group_id', activeGroup.id).eq('user_id', userId);
    loadGroupMembers(activeGroup.id);
    sendGroupMessage('system', `${realName(session.user.id)} removed ${realName(userId)} as admin`, null);
  };
  const muteMember = async (userId) => {
    await supabase.from('group_members').update({ muted: true }).eq('group_id', activeGroup.id).eq('user_id', userId);
    loadGroupMembers(activeGroup.id);
  };
  const unmuteMember = async (userId) => {
    await supabase.from('group_members').update({ muted: false }).eq('group_id', activeGroup.id).eq('user_id', userId);
    loadGroupMembers(activeGroup.id);
  };
  const toggleHideActivity = async () => {
    const next = !me.hide_activity;
    setMe((prev) => ({ ...prev, hide_activity: next }));
    await supabase.from('profiles').update({ hide_activity: next }).eq('id', session.user.id);
  };

  const saveGroupBio = async (bio) => {
    await supabase.from('groups').update({ bio: bio.trim() || null }).eq('id', activeGroup.id);
    setActiveGroup((prev) => ({ ...prev, bio: bio.trim() || null }));
    loadGroups();
  };
  const saveGroupName = async (name) => {
    if (!name.trim()) return;
    const oldName = activeGroup.name;
    await supabase.from('groups').update({ name: name.trim() }).eq('id', activeGroup.id);
    setActiveGroup((prev) => ({ ...prev, name: name.trim() }));
    loadGroups();
    sendGroupMessage('system', `${realName(session.user.id)} changed the group name from "${oldName}" to "${name.trim()}"`, null);
  };
  const saveGroupAvatar = async (blob) => {
    const file = new File([blob], 'group.jpg', { type: 'image/jpeg' });
    const { url, error } = await uploadMedia(file, session.user.id);
    if (!error && url) {
      await supabase.from('groups').update({ avatar: url }).eq('id', activeGroup.id);
      setActiveGroup((prev) => ({ ...prev, avatar: url }));
      loadGroups();
      sendGroupMessage('system', `${realName(session.user.id)} changed the group photo`, null);
    }
  };
  const addGroupMembers = async (people) => {
    if (!people.length) return;
    await supabase.from('group_members').insert(people.map((p) => ({ group_id: activeGroup.id, user_id: p.id, role: 'member', added_by: session.user.id })));
    loadGroupMembers(activeGroup.id);
    sendGroupMessage('system', `${realName(session.user.id)} added ${people.map((p) => p.name).join(', ')}`, null);
  };
  const kickMember = async (userId) => {
    const name = realName(userId);
    await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', userId);
    loadGroupMembers(activeGroup.id);
    sendGroupMessage('system', `${realName(session.user.id)} removed ${name}`, null);
  };
  const leaveGroup = async () => {
    const name = realName(session.user.id);
    await supabase.from('group_members').delete().eq('group_id', activeGroup.id).eq('user_id', session.user.id);
    await supabase.from('messages').insert({ sender_id: session.user.id, group_id: activeGroup.id, type: 'system', content: `${name} left the group` });
    setShowGroupInfo(false);
    setActiveGroup(null);
    setMobileShowChat(false);
    loadGroups();
  };

  const openChat = async (profile, convId) => {
    if (convId && myLocks[convId] && !unlockedChats.has(convId)) {
      setLockPromptFor({ profile, convId });
      return;
    }
    setActiveProfile(profile);
    setActiveGroup(null);
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
  const labelForSender = (senderId) => {
    if (senderId === session.user.id) return 'You';
    if (activeGroup) return groupMembers.find((gm) => gm.user_id === senderId)?.profile.name || 'Member';
    return activeProfile?.name || 'Unknown';
  };

  const sendingRef = useRef(false);
  const send = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    try {
      await sendInner();
    } finally {
      sendingRef.current = false;
    }
  };
  const sendInner = async () => {
    if (!activeProfile && !activeGroup) return;
    if (pendingMedia.length) {
      const items = pendingMedia;
      setPendingMedia([]);
      const caption = draft.trim().slice(0, MAX_CHARS);
      setDraft('');
      setUploading(true);
      for (let i = 0; i < items.length; i++) {
        const { url, error } = await uploadMedia(items[i].file, session.user.id);
        if (!error && url) {
          const captionForThis = i === 0 ? (caption || null) : null;
          if (activeGroup) {
            await sendGroupMessage(items[i].kind, captionForThis, url);
          } else {
            const { data } = await sendMessage(session.user.id, activeProfile.id, items[i].kind, captionForThis, url);
            if (data) {
              setMessages((prev) => [...prev, data]);
              sendPushNotification(activeProfile.id, me.name, captionForThis || (items[i].kind === 'image' ? '📷 Photo' : '🎥 Video'), `/?dm=${session.user.id}`, me.avatar);
            }
          }
        }
        URL.revokeObjectURL(items[i].url);
      }
      if (activeProfile) await upsertConversation(activeProfile.id, caption || null, items[items.length - 1].kind);
      setUploading(false);
      return;
    }
    if (activeGroup) {
      const items = pendingForwardItems;
      if (items.length) {
        setPendingForwardItems([]);
        for (const item of items) await sendGroupMessage(item.type, item.content, item.media_url, item.forwarded_from_name);
      }
      if (!draft.trim()) return;
      const text = draft.trim().slice(0, MAX_CHARS);
      setDraft('');
      const soloForwardName = items.length === 1 && items[0].type === 'text' ? items[0].forwarded_from_name : null;
      await sendGroupMessage('text', text, null, soloForwardName);
      return;
    }
    const items = pendingForwardItems;
    if (items.length) {
      setPendingForwardItems([]);
      for (const item of items) {
        const { data } = await sendMessage(session.user.id, activeProfile.id, item.type, item.content || null, item.media_url || null);
        if (data) {
          await supabase.from('messages').update({ forwarded: true, forwarded_from_name: item.forwarded_from_name || null }).eq('id', data.id);
          data.forwarded = true;
          data.forwarded_from_name = item.forwarded_from_name || null;
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
      if (wasForward) {
        await supabase.from('messages').update({ forwarded: true, forwarded_from_name: items[0].forwarded_from_name || null }).eq('id', data.id);
        data.forwarded = true;
        data.forwarded_from_name = items[0].forwarded_from_name || null;
      }
      setMessages((prev) => [...prev, data]);
      upsertConversation(activeProfile.id, text, 'text');
      sendPushNotification(activeProfile.id, me.name, text, `/?dm=${session.user.id}`, me.avatar);
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

  const removePendingMedia = (idx) => {
    setPendingMedia((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleFile = (e, kind) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || (!activeProfile && !activeGroup)) return;
    setShowAttach(false);
    const capped = files.slice(0, MAX_PHOTOS_PER_SEND - pendingMedia.length);
    const staged = capped.map((file) => ({ file, url: URL.createObjectURL(file), kind }));
    setPendingMedia((prev) => [...prev, ...staged]);
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
        if (!activeProfile && !activeGroup) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        setUploading(true);
        const { url, error } = await uploadMedia(file, session.user.id);
        if (!error && url) {
          if (activeGroup) {
            await sendGroupMessage('audio', null, url);
          } else {
            const { data } = await sendMessage(session.user.id, activeProfile.id, 'audio', null, url);
            if (data) { setMessages((prev) => [...prev, data]); upsertConversation(activeProfile.id, null, 'audio'); sendPushNotification(activeProfile.id, me.name, '🎤 Voice message', `/?dm=${session.user.id}`, me.avatar); }
          }
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
    const targets = selectedMessages.length ? selectedMessages : (viewerUrl ? [{ type: 'image', media_url: viewerUrl, content: null }] : []);
    setForwardTargets(targets.map((m) => (m.sender_id ? { ...m, forwarded_from_name: labelForSender(m.sender_id) } : m)));
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
  const openForwardSingle = (m) => { setForwardTargets([{ ...m, forwarded_from_name: labelForSender(m.sender_id) }]); setForwardOpen(true); setContextMenuFor(null); };
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
    const targetMessage = findMessageById(messageId);
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
      if (targetMessage && targetMessage.sender_id !== session.user.id) {
        const destUrl = activeGroup ? `/?group=${activeGroup.id}` : `/?dm=${session.user.id}`;
        sendPushNotification(targetMessage.sender_id, me.name, `reacted ${emoji} to your message`, destUrl, me.avatar);
      }
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
      sendPushNotification(activeProfile.id, 'ZChat', status === 'pending' ? `${me.name} requested to follow you` : `${me.name} started following you`, `/?profile=${session.user.id}`, me.avatar);
    }
    setActiveFollowBusy(false);
  };

  const sendTyping = () => {
    if (!typingChannelRef.current || me?.hide_activity) return;
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
    <div id="zapp-root" style={{
      fontFamily: FONT, height: '100dvh', width: '100%', background: theme.bgGradient,
      display: 'flex', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box',
      paddingTop: 'env(safe-area-inset-top)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
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
            isOnline={!profileOf.hide_activity && onlineIds.has(profileOf.id)}
            onClose={() => setProfileOf(null)}
            onReport={handleReport}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={(p) => setProfileOf(p)}
            onMessage={(p) => { setProfileOf(null); openChat(p, null); }}
            onSaved={(updated) => { setMe(updated.id === me.id ? { ...updated, email: me.email } : me); if (activeProfile?.id === updated.id) setActiveProfile(updated); }}
            isBlocked={myBlockedIds.has(profileOf.id)}
            onBlock={blockUser}
            onUnblock={unblockUser}
          />
        )}
        {showSettings && !showPrivacy && (
          <SettingsPanel
            onClose={() => setShowSettings(false)}
            onOpenPrivacy={() => setShowPrivacy(true)}
            onOpenRequests={() => setShowFollowRequests(true)}
            onLogout={() => setShowLogoutConfirm(true)}
            hideActivity={!!me.hide_activity}
            onToggleActivity={toggleHideActivity}
            onOpenAccounts={() => setShowAccountSwitcher(true)}
            onOpenDelete={() => setShowDeleteAccount(true)}
          />
        )}
        {showPrivacy && <PrivacyPanel onBack={() => setShowPrivacy(false)} />}
        {showFollowRequests && (
          <FollowRequestsPanel userId={session.user.id} onClose={() => { setShowFollowRequests(false); loadFollowRequestCount(); }}
            onOpenProfile={(p) => setProfileOf(p)} />
        )}
        {showDiscover && (
          <DiscoverPanel myId={session.user.id} blockedIds={myBlockedIds} onClose={() => setShowDiscover(false)}
            onOpenProfile={(p) => setProfileOf(p)} />
        )}
        {showLogoutConfirm && (
          <LogoutConfirm onCancel={() => setShowLogoutConfirm(false)} onConfirm={onLogout} />
        )}

        <div style={{
          width: 320, minWidth: 320, display: mobileShowChat ? 'none' : 'flex',
          flexDirection: 'column', borderRight: `1px solid ${theme.border}`,
        }} className="zchat-sidebar">
          <div style={{ padding: '16px 16px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <ZBrand size={22} showTag />
              <div onClick={() => setProfileOf(me)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', maxWidth: 130 }}>
                <div style={{ textAlign: 'right', minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
                  <div style={{ fontSize: 10, color: theme.teal, fontWeight: 600 }}>Online</div>
                  {me.bio && <div style={{ fontSize: 9.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>"{me.bio}"</div>}
                </div>
                <Avatar emoji={me.avatar} name={me.name} size={34} ring />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <div onClick={() => { setShowFollowRequests(true); }} style={{
                position: 'relative', width: 32, height: 32, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme.rowBg,
              }}>
                <Bell size={15} color={theme.muted} />
                {followRequestCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2, minWidth: 15, height: 15, borderRadius: 8,
                    background: theme.danger, color: 'white', fontSize: 9.5, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
                  }}>{followRequestCount > 9 ? '9+' : followRequestCount}</span>
                )}
              </div>
              <div onClick={() => setShowCreateGroup(true)} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme.rowBg }}>
                <Users size={15} color={theme.muted} />
              </div>
              <div onClick={() => setShowDiscover(true)} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme.rowBg }}>
                <Compass size={15} color={theme.muted} />
              </div>
              <div onClick={() => setShowSettings(true)} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme.rowBg }}>
                <SettingsIcon size={15} color={theme.muted} />
              </div>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 15, top: 13 }} />
              <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Search chats, people..." autoCapitalize="none"
                style={{ ...inputStyle(theme), padding: '11px 14px 11px 38px', borderRadius: 24, background: theme.rowBg, border: `1.5px solid ${theme.border}` }} />
              {searching && <div style={{ position: 'absolute', right: 15, top: 13 }}><Spinner size={14} color={theme.muted} /></div>}
            </div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto' }}>
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'groups', label: 'Groups' },
                { key: 'dms', label: 'DMs' },
              ].map((f) => (
                <div key={f.key} onClick={() => setListFilter(f.key)} style={{
                  padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  background: listFilter === f.key ? theme.coral : theme.rowBg,
                  color: listFilter === f.key ? 'white' : theme.muted,
                }}>{f.label}</div>
              ))}
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
            {search.length < 2 && groups.length > 0 && listFilter !== 'dms' && listFilter !== 'unread' && (
              <div style={{ marginBottom: 6 }}>
                {groups.map((g) => (
                  <div key={g.id} onClick={() => openGroup(g)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', cursor: 'pointer',
                    borderRadius: 14, marginBottom: 2, borderBottom: `1px solid ${theme.border}`,
                    background: activeGroup?.id === g.id ? theme.rowBg : 'transparent',
                  }}>
                    <GroupAvatar avatar={g.avatar} name={g.name} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.last_message ? g.last_message : (g.last_message_type ? `${g.last_message_type === 'image' ? '📷 Photo' : g.last_message_type === 'video' ? '🎥 Video' : g.last_message_type === 'audio' ? '🎤 Voice message' : ''}` : 'No messages yet')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      <Avatar emoji={u.avatar} name={u.name} online={!u.hide_activity && onlineIds.has(u.id)} size={44} />
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
            ) : (listFilter === 'groups' ? [] : listFilter === 'unread' ? conversations.filter(isUnread) : conversations).length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: theme.muted, fontSize: 12.5, lineHeight: 1.6 }}>
                {listFilter === 'groups' ? 'No groups yet' : listFilter === 'unread' ? 'No unread chats' : 'Search a username above to start a new conversation'}
              </div>
            ) : (
              (listFilter === 'groups' ? [] : listFilter === 'unread' ? conversations.filter(isUnread) : conversations).map((c) => {
                const unread = isUnread(c);
                const pinned = isPinnedByMe(c);
                const locked = !!myLocks[c.id];
                return (
                  <div key={c.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', cursor: 'pointer',
                    borderRadius: 14, marginBottom: 2, borderBottom: `1px solid ${theme.border}`, position: 'relative',
                    background: activeProfile?.id === c.otherProfile.id ? theme.rowBg : (pinned ? `${theme.coral}0A` : 'transparent'),
                  }}>
                    <div onClick={() => openChat(c.otherProfile, c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                      {pinned && chatTheme === 'love' ? (
                        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 0, left: 0 }}>
                            <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} size={32} />
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, right: 0, border: `2px solid ${theme.panelBg}`, borderRadius: '50%' }}>
                            <Avatar emoji={me?.avatar} name={me?.name} size={26} />
                          </div>
                          <span style={{ position: 'absolute', top: -4, right: -4, fontSize: 12 }}>💗</span>
                        </div>
                      ) : (
                        <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} online={!c.otherProfile.hide_activity && onlineIds.has(c.otherProfile.id)} size={44} ring />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {pinned && <span style={{ fontSize: 11 }}>📌</span>}
                          {locked && <Lock size={11} color={theme.muted} />}
                          <div style={{ fontWeight: unread ? 800 : 700, fontSize: 14.5, color: theme.ink }}>{c.otherProfile.name}</div>
                        </div>
                        <div style={{
                          fontSize: 12, color: unread ? theme.ink : theme.muted, fontWeight: unread ? 700 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {locked && !unlockedChats.has(c.id) ? 'Locked chat' : `${c.last_sender_id === session.user.id ? 'You: ' : ''}${c.last_message}`}
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


        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative' }} className="zchat-panel">
          <AnimatedChatBackground chatTheme={chatTheme} />
          {!activeProfile && !activeGroup ? (
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
              ) : activeGroup ? (
                <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                  onClick={() => setShowGroupInfo(true)}>
                  <ArrowLeft size={20} style={{ cursor: 'pointer', display: 'none' }} className="zchat-back"
                    onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }} />
                  <GroupAvatar avatar={activeGroup.avatar} name={activeGroup.name} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{activeGroup.name}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>{groupMembers.length} members</div>
                  </div>
                  <MoreVertical size={19} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 6 }}
                    onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); }} />
                </div>
              ) : (
                <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                  onClick={() => setProfileOf(activeProfile)}>
                  <ArrowLeft size={20} style={{ cursor: 'pointer', display: 'none' }} className="zchat-back"
                    onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); }} />
                  <Avatar emoji={activeProfile.avatar} name={activeProfile.name} online={!activeProfile.hide_activity && onlineIds.has(activeProfile.id)} size={38} ring />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>{activeProfile.name}</div>
                    <div style={{ fontSize: 12, color: typingFrom ? theme.coral : theme.muted, fontWeight: typingFrom ? 700 : 400 }}>
                      {typingFrom ? 'typing...' : `@${activeProfile.username}`}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggleActiveFollow(); }} disabled={activeFollowBusy} style={{
                    padding: '6px 14px', borderRadius: 18, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
                    border: activeFollowState !== 'none' ? `1.5px solid ${theme.border}` : 'none',
                    background: activeFollowState === 'accepted' ? `${theme.coral}18` : activeFollowState === 'pending' ? 'transparent' : theme.coral,
                    color: activeFollowState === 'accepted' ? theme.coralDeep : activeFollowState === 'pending' ? theme.ink : 'white',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    {activeFollowBusy ? <Spinner size={11} color={activeFollowState !== 'none' ? theme.ink : 'white'} /> :
                      (<>{activeFollowState === 'accepted' ? <Check size={11} /> : activeFollowState === 'pending' ? null : <UserPlus size={11} />}</>)}
                    {!activeFollowBusy && (
                      activeFollowState === 'accepted' ? 'Following' : activeFollowState === 'pending' ? 'Requested' : 'Follow'
                    )}
                  </button>
                  <MoreVertical size={19} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 6 }}
                    onClick={(e) => { e.stopPropagation(); setShowChatSettings(true); }} />
                </div>
              )}
              <div ref={scrollRef} style={{
                flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 18px',
                WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
                ...((() => {
                  if (!activeProfile) return {};
                  const activeConv = conversations.find((c) => c.otherProfile.id === activeProfile.id) || archivedConversations.find((c) => c.otherProfile.id === activeProfile.id);
                  const wp = activeConv ? myWallpaper(activeConv) : null;
                  if (wp && wp !== 'default') return wallpaperBgStyle(wp, theme);
                  return {};
                })()),
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
                  messages.map((m) => {
                    const senderMember = activeGroup ? groupMembers.find((gm) => gm.user_id === m.sender_id) : null;
                    const nameFor = (senderId) => {
                      if (senderId === session.user.id) return 'You';
                      if (activeGroup) return groupMembers.find((gm) => gm.user_id === senderId)?.profile.name || 'Member';
                      return activeProfile.name;
                    };
                    return (
                      <MessageBubble
                        key={m.id} m={m} isMe={m.sender_id === session.user.id} onDelete={handleDelete}
                        canModerate={!!(activeGroup && groupMembers.find((gm) => gm.user_id === session.user.id)?.role === 'admin')}
                        selectionMode={selectionMode} selected={selectedIds.has(m.id)} onToggleSelect={toggleSelect}
                        onLongPress={(id) => setContextMenuFor(id)}
                        onOpenImage={setViewerUrl}
                        reactions={messageLikes[m.id] || []}
                        onReact={reactToMessage}
                        onOpenWhoReacted={(id) => setWhoReactedFor(messageLikes[id] || [])}
                        onSwipeReply={(msg) => { setReplyingTo(msg); setEditingMessage(null); }}
                        senderLabel={activeGroup && m.sender_id !== session.user.id ? (senderMember?.profile.name || 'Member') : null}
                        onOpenSenderProfile={activeGroup && senderMember ? () => setProfileOf(senderMember.profile) : undefined}
                        senderAvatar={activeGroup ? senderMember?.profile.avatar : undefined}
                        hideReadStatus={!!activeProfile?.hide_activity}
                        replyPreview={m.reply_to_id ? (() => {
                          const rm = findMessageById(m.reply_to_id);
                          if (!rm) return null;
                          return { content: rm.content, type: rm.type, senderLabel: nameFor(rm.sender_id) };
                        })() : null}
                      />
                    );
                  })
                )}
              </div>
              {pendingMedia.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`, background: theme.rowBg, overflowX: 'auto' }}>
                  {pendingMedia.map((item, idx) => (
                    <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                      {item.kind === 'image' ? (
                        <img src={item.url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                      ) : (
                        <video src={item.url} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#000' }} />
                      )}
                      <div onClick={() => removePendingMedia(idx)} style={{
                        position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%',
                        background: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}><X size={11} color="white" /></div>
                    </div>
                  ))}
                </div>
              )}
              {pendingForwardItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`, background: theme.rowBg }}>
                  <Forward size={14} color={theme.coral} />
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
                    Replying to {replyingTo.sender_id === session.user.id ? 'yourself' : (activeGroup ? (groupMembers.find((gm) => gm.user_id === replyingTo.sender_id)?.profile.name || 'Member') : activeProfile.name)}: {replyingTo.type === 'text' ? replyingTo.content : replyingTo.type === 'image' ? '📷 Photo' : replyingTo.type === 'audio' ? '🎤 Voice message' : '🎥 Video'}
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
                <div style={{ display: 'flex', gap: 14, padding: '10px 16px', borderTop: `1px solid ${theme.border}` }} className="zchat-fade">
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={18} color="#1B1B1F" />
                    </div>
                    <span style={{ fontSize: 10.5, color: theme.muted }}>Photo</span>
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <VideoIcon size={18} color="white" />
                    </div>
                    <span style={{ fontSize: 10.5, color: theme.muted }}>Video</span>
                    <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'video')} />
                  </label>
                </div>
              )}
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${theme.border}` }}>
                {activeGroup && groupMembers.find((gm) => gm.user_id === session.user.id)?.muted ? (
                  <div style={{ textAlign: 'center', padding: '10px 4px', fontSize: 13, color: theme.muted, fontWeight: 600 }}>
                    You've been muted in this group by an admin
                  </div>
                ) : recording ? (
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
                      <textarea ref={composerRef} value={draft} enterKeyHint="enter" onChange={(e) => {
                        setDraft(e.target.value.slice(0, MAX_CHARS)); sendTyping();
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                      }}
                        placeholder={uploading ? 'Uploading...' : editingMessage ? 'Edit message' : pendingMedia.length ? 'Add a caption...' : 'Type a message'} disabled={uploading}
                        rows={1}
                        style={{ ...inputStyle(theme), flex: 1, borderRadius: 20, padding: '9px 14px', resize: 'none', fontFamily: FONT, maxHeight: 120, overflowY: 'auto', lineHeight: 1.35, fontSize: 14.5 }} />
                      {!draft.trim() && !editingMessage && !pendingForwardItems.length && !pendingMedia.length ? (
                        <button onClick={startRecording} style={{
                          width: 38, height: 38, borderRadius: '50%', background: theme.coral,
                          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                        }}><Mic size={17} color="white" /></button>
                      ) : (
                        <button onClick={() => { (editingMessage ? saveEdit() : send()); composerRef.current?.blur(); }} disabled={!draft.trim() && !pendingForwardItems.length && !pendingMedia.length} style={{
                          width: 38, height: 38, borderRadius: '50%', background: (draft.trim() || pendingForwardItems.length || pendingMedia.length) ? theme.coral : theme.rowBg,
                          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: (draft.trim() || pendingForwardItems.length || pendingMedia.length) ? 'pointer' : 'default', flexShrink: 0,
                        }}>
                          {editingMessage ? <Check size={16} color="white" /> : <Send size={16} color="white" />}
                        </button>
                      )}
                    </div>
                    {draft.length > MAX_CHARS - 50 && (
                      <div style={{ textAlign: 'right', fontSize: 10.5, color: theme.danger, marginTop: 4, paddingRight: 4 }}>
                        {draft.length}/{MAX_CHARS}
                      </div>
                    )}
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
              canModerate={!!(activeGroup && groupMembers.find((gm) => gm.user_id === session.user.id)?.role === 'admin')}
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
        {showChatSettings && activeProfile && (() => {
          const activeConv = conversations.find((c) => c.otherProfile.id === activeProfile.id) || archivedConversations.find((c) => c.otherProfile.id === activeProfile.id);
          if (!activeConv) return null;
          return (
            <ChatSettingsPanel
              conv={activeConv} myId={session.user.id}
              isPinned={isPinnedByMe(activeConv)}
              isLocked={!!myLocks[activeConv.id]}
              wallpaper={myWallpaper(activeConv)}
              onClose={() => setShowChatSettings(false)}
              onTogglePin={() => { togglePin(activeConv); }}
              onToggleArchive={() => { setShowChatSettings(false); toggleArchive(activeConv.id, true); setActiveProfile(null); }}
              onSetWallpaper={(key) => setWallpaper(activeConv, key)}
              onEnableLock={(pin) => enableChatLock(activeConv, pin)}
              onDisableLock={() => disableChatLock(activeConv)}
              onDeleteChat={() => { setShowChatSettings(false); setDeleteConvoTarget(activeConv); }}
              onNicknameSaved={() => { loadConversations(); setActiveProfile((p) => ({ ...p })); }}
            />
          );
        })()}
        {lockPromptFor && (
          <ChatLockUnlock
            correctHash={myLocks[lockPromptFor.convId]}
            onCancel={() => setLockPromptFor(null)}
            onUnlock={() => {
              setUnlockedChats((prev) => new Set(prev).add(lockPromptFor.convId));
              const { profile, convId } = lockPromptFor;
              setLockPromptFor(null);
              openChat(profile, convId);
            }}
          />
        )}
        {showCreateGroup && (
          <CreateGroupPanel myId={session.user.id} onClose={() => setShowCreateGroup(false)}
            onCreated={(group) => { setShowCreateGroup(false); loadGroups(); openGroup({ ...group, myRole: 'admin' }); }} />
        )}
        {showGroupInfo && activeGroup && (
          <GroupInfoPanel
            group={activeGroup} members={groupMembers} myId={session.user.id}
            myRole={groupMembers.find((m) => m.user_id === session.user.id)?.role || 'member'}
            isOwner={activeGroup.created_by === session.user.id}
            onClose={() => setShowGroupInfo(false)}
            onPromote={promoteMember} onDemote={demoteMember}
            onMute={muteMember} onUnmute={unmuteMember}
            onKick={kickMember} onLeave={leaveGroup}
            onOpenProfile={(p) => setProfileOf(p)}
            onSaveBio={saveGroupBio}
            onSaveName={saveGroupName}
            onSaveAvatar={saveGroupAvatar}
            onAddMembers={addGroupMembers}
            onTransferOwnership={transferOwnership}
          />
        )}
        {showAccountSwitcher && (
          <AccountSwitcherPanel
            accounts={savedAccounts} currentId={session.user.id}
            onBack={() => setShowAccountSwitcher(false)}
            onSwitch={onSwitchAccount}
            onRemove={onRemoveAccount}
            onAdd={onAddAccount}
          />
        )}
        {showDeleteAccount && (
          <DeleteAccountConfirm onCancel={() => setShowDeleteAccount(false)} onConfirm={deleteMyAccount} />
        )}
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
  const [savedAccounts, setSavedAccounts] = useState(getSavedAccounts());
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

  const handleAddAccount = async () => {
    await supabase.auth.signOut({ scope: 'local' });
    setSession(null);
    setScreen('login');
  };

  const handleSwitchAccount = async (account) => {
    const { data, error } = await supabase.auth.setSession({ access_token: account.access_token, refresh_token: account.refresh_token });
    if (!error && data.session) {
      setSession(data.session);
    } else {
      removeAccountEntry(account.id);
      setSavedAccounts(getSavedAccounts());
      alert('That account session expired. Please log in again.');
    }
  };

  const handleRemoveAccount = (id) => {
    removeAccountEntry(id);
    setSavedAccounts(getSavedAccounts());
  };

  useEffect(() => {
    getSession().then((s) => { setSession(s); setChecked(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); setSession(s); return; }
      if (!passwordRecovery) setSession(s);
    });
    return () => listener.subscription.unsubscribe();
  }, [passwordRecovery]);

  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data: profile } = await getProfile(session.user.id);
      saveAccountEntry({
        id: session.user.id,
        email: session.user.email,
        name: profile?.name || session.user.email,
        username: profile?.username || '',
        avatar: profile?.avatar || '',
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      setSavedAccounts(getSavedAccounts());
    })();
  }, [session?.access_token]);

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
        savedAccounts={savedAccounts}
        onSwitchAccount={handleSwitchAccount}
        onAddAccount={handleAddAccount}
        onRemoveAccount={handleRemoveAccount}
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

