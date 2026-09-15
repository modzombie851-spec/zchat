import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, Compass, Bell, Volume2, VolumeX, Palette, Mic, Play, Pause, Download, Users, Camera, Reply, Forward, Ban, Edit3, Archive, Sparkles,
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
  const [reactionSoundOn, setReactionSoundOn] = useState(() => {
    try { return localStorage.getItem('zchat-reaction-sound') !== 'off'; } catch { return true; }
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
  const [bubbleColor, setBubbleColor] = useState(() => {
    try { return localStorage.getItem('zchat-bubblecolor') || 'default'; } catch { return 'default'; }
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
    try { localStorage.setItem('zchat-reaction-sound', reactionSoundOn ? 'on' : 'off'); } catch {}
  }, [reactionSoundOn]);
  useEffect(() => {
    try { localStorage.setItem('zchat-bgpattern', bgPatternOn ? 'on' : 'off'); } catch {}
  }, [bgPatternOn]);
  useEffect(() => {
    try { localStorage.setItem('zchat-chattheme', chatTheme); } catch {}
  }, [chatTheme]);
  useEffect(() => {
    try { localStorage.setItem('zchat-bubblecolor', bubbleColor); } catch {}
  }, [bubbleColor]);
  const accent = ACCENT_PALETTES[accentName] || ACCENT_PALETTES.coral;
  const theme = { ...THEMES[dark ? 'dark' : 'light'], ...accent, dark };
  return (
    <ThemeContext.Provider value={{ theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, reactionSoundOn, setReactionSoundOn, bgPatternOn, setBgPatternOn, fontScale, setFontScale, chatTheme, setChatTheme, bubbleColor, setBubbleColor }}>
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
  classic: { label: 'Classic', bubbleRadius: 16, borderStyle: 'solid', glow: false, bg: 'none' },
  glass: { label: 'Frosted Glass', bubbleRadius: 16, borderStyle: 'solid', glow: false, bg: 'blobs' },
  love: { label: 'Love', bubbleRadius: 16, borderStyle: 'thin', glow: false, bg: 'hearts' },
  neon: { label: 'Neon', bubbleRadius: 16, borderStyle: 'thin', glow: false, bg: 'neon' },
};

const BUBBLE_COLORS = {
  default: { label: 'Default', me: null, them: null },
  coral: { label: 'Coral', me: '#FFDCCB', them: null },
  mint: { label: 'Mint', me: '#D6F5E3', them: null },
  lavender: { label: 'Lavender', me: '#E6DEFB', them: null },
  sunny: { label: 'Sunny', me: '#FFF3C4', them: null },
  sky: { label: 'Sky', me: '#D6ECFF', them: null },
  rose: { label: 'Rose', me: '#FBDCE6', them: null },
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
  if (chatTheme === 'love') {
    base.border = `1px solid ${isMe ? 'rgba(255,77,141,0.4)' : 'rgba(255,182,201,0.3)'}`;
  }
  if (chatTheme === 'neon') {
    base.border = `1px solid ${isMe ? 'rgba(0,255,220,0.4)' : 'rgba(176,38,255,0.35)'}`;
  }
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
      @keyframes zchat-wave-pop { 0% { opacity: 0; transform: scale(0.4) translateY(10px); } 60% { opacity: 1; transform: scale(1.08) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes zchat-panel-zoom-in { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes zchat-panel-slide-in { 0% { opacity: 0; transform: translateX(14px) scale(0.985); } 100% { opacity: 1; transform: translateX(0) scale(1); } }
      @keyframes zchat-pull-spin { to { transform: rotate(360deg); } }
      .zchat-fire-ring {
        background: linear-gradient(135deg, #FFD23F, #FF6B00, #FF2D55);
      }
      .zchat-bubble-love { animation: zchat-love-pulse 2.6s ease-in-out infinite; }
      .zchat-bubble-neon { animation: zchat-neon-pulse 2.2s ease-in-out infinite; }
      .zchat-fade { animation: zchat-fade 0.25s ease; }
      .zchat-wave-pop { animation: zchat-wave-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .zchat-panel-open { animation: zchat-panel-zoom-in 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
      .zchat-msglist { scroll-behavior: smooth; }
      * { font-family: ${FONT}; }
      *:not(input):not(textarea) {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        user-select: none;
      }
      input, textarea {
        -webkit-user-select: text;
        user-select: text;
      }
      img, video {
        -webkit-touch-callout: none;
        -webkit-user-drag: none;
        user-select: none;
      }
      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      *::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
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
          ? <img src={emoji} alt="" onError={() => setImgFailed(true)} onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
      {cropFile && <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={(blob) => uploadCroppedAvatar(blob)} />}
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

function SettingsPanel({ onClose, onOpenPrivacy, onOpenRequests, onLogout, hideActivity, onToggleActivity, onOpenAccounts, onOpenDelete, chatLockSet, chatLockHash, onSetChatLockPassword, onTurnOffChatLock, autoOpenLockSetup, onConsumedAutoOpen }) {
  const { theme, dark, setDark, accentName, setAccentName, soundOn, setSoundOn, reactionSoundOn, setReactionSoundOn, bgPatternOn, setBgPatternOn, fontScale, setFontScale, chatTheme, setChatTheme, bubbleColor, setBubbleColor } = useTheme();
  const accentLabels = { coral: 'Coral', ocean: 'Ocean', berry: 'Berry' };
  const [lockFlow, setLockFlow] = useState(null);
  const [section, setSection] = useState('main');
  const [dragX, setDragX] = useState(0);
  const dragStartRef = useRef(null);
  const draggingRef = useRef(false);

  const onDragStart = (e) => { dragStartRef.current = e.touches[0].clientX; draggingRef.current = false; };
  const onDragMove = (e) => {
    if (dragStartRef.current == null) return;
    const dx = e.touches[0].clientX - dragStartRef.current;
    if (dx < 0) { draggingRef.current = true; setDragX(Math.max(dx, -320)); }
  };
  const onDragEnd = () => {
    if (draggingRef.current && dragX < -70) { onClose(); }
    setDragX(0);
    dragStartRef.current = null;
    draggingRef.current = false;
  };

  useEffect(() => {
    if (autoOpenLockSetup) {
      setSection('privacy');
      setLockFlow('set');
      onConsumedAutoOpen();
    }
  }, [autoOpenLockSetup]);

  const CategoryRow = ({ icon, label, sub, onClick }) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${theme.coral}1F`, color: theme.coralDeep, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight size={17} color={theme.muted} />
    </div>
  );

  const SectionHeader = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <ArrowLeft size={19} style={{ cursor: 'pointer', color: theme.ink }} onClick={() => setSection('main')} />
      <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>{title}</div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,14,0.45)',
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start', zIndex: 30,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={glass(theme, {
        background: theme.panelBg, borderRadius: '0 24px 24px 0', padding: 26,
        width: '86%', maxWidth: 360, height: '100%', position: 'relative', overflowY: 'auto',
        WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        paddingTop: 'calc(26px + env(safe-area-inset-top))',
        paddingBottom: 'calc(26px + env(safe-area-inset-bottom))',
        transform: `translateX(${dragX}px)`, transition: draggingRef.current ? 'none' : 'transform 0.25s ease',
      })}
        onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd} onTouchCancel={onDragEnd}
      >
        <X size={20} style={{ position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', right: 18, cursor: 'pointer', color: theme.muted }} onClick={onClose} />

        {section === 'main' && (
          <>
            <div style={{ fontWeight: 800, fontSize: 19, color: theme.ink, marginBottom: 18 }}>Settings</div>
            <CategoryRow icon={<Palette size={17} />} label="Appearance" sub="Theme, chat style, text size" onClick={() => setSection('appearance')} />
            <CategoryRow icon={<EyeOff size={17} />} label="Privacy & Security" sub="Activity status, Chat Lock" onClick={() => setSection('privacy')} />
            <CategoryRow icon={<Bell size={17} />} label="Notifications" sub="Sounds, alerts" onClick={() => setSection('notifications')} />
            <CategoryRow icon={<HelpCircle size={17} />} label="About" sub="Privacy policy, help" onClick={() => setSection('about')} />
            <CategoryRow icon={<UserPlus size={17} />} label="Account" sub="Follow requests, switch, delete" onClick={() => setSection('account')} />
            <div style={{ height: 4 }} />
            <SettingsRow icon={<LogOut size={16} />} label="Log out" danger onClick={onLogout} />
            <div style={{ textAlign: 'center', fontSize: 10.5, color: theme.muted, marginTop: 18, fontWeight: 600 }}>ZChat v2.6</div>
          </>
        )}

        {section === 'appearance' && (
          <>
            <SectionHeader title="Appearance" />
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
            <div style={{ padding: '10px 4px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${theme.coral}1F`, color: theme.coralDeep }}><Sparkles size={16} /></div>
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>Bubble color</div>
              </div>
              <div style={{ display: 'flex', gap: 8, paddingLeft: 44, flexWrap: 'wrap' }}>
                {Object.entries(BUBBLE_COLORS).map(([key, spec]) => (
                  <div key={key} onClick={() => setBubbleColor(key)} title={spec.label} style={{
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer',
                    background: spec.me || theme.bubbleMe,
                    border: bubbleColor === key ? `3px solid ${theme.ink}` : `3px solid transparent`,
                    boxShadow: `0 0 0 1px ${theme.border}`,
                  }} />
                ))}
              </div>
            </div>
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
          </>
        )}

        {section === 'privacy' && (
          <>
            <SectionHeader title="Privacy & Security" />
            <SettingsRow icon={<EyeOff size={16} />} label="Hide activity status" right={<ToggleSwitch on={hideActivity} onClick={onToggleActivity} />} />
            <SettingsRow icon={<Lock size={16} />} label={chatLockSet ? 'Change Chat Lock password' : 'Set Chat Lock password'} onClick={() => setLockFlow(chatLockSet ? 'verify-then-change' : 'set')} />
            {chatLockSet && (
              <SettingsRow icon={<Lock size={16} />} label="Turn off Chat Lock" danger onClick={() => setLockFlow('verify-then-off')} />
            )}
          </>
        )}

        {section === 'notifications' && (
          <>
            <SectionHeader title="Notifications" />
            <SettingsRow icon={soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} label="Message sound" right={<ToggleSwitch on={soundOn} onClick={() => setSoundOn((s) => !s)} />} />
            <SettingsRow icon={reactionSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} label="Reaction sound" right={<ToggleSwitch on={reactionSoundOn} onClick={() => setReactionSoundOn((s) => !s)} />} />
          </>
        )}

        {section === 'about' && (
          <>
            <SectionHeader title="About" />
            <SettingsRow icon={<FileText size={16} />} label="Privacy policy" onClick={onOpenPrivacy} />
            <SettingsRow icon={<HelpCircle size={16} />} label="Help & support" onClick={() => {}} />
          </>
        )}

        {section === 'account' && (
          <>
            <SectionHeader title="Account" />
            <SettingsRow icon={<Bell size={16} />} label="Follow requests" onClick={onOpenRequests} />
            <SettingsRow icon={<UserPlus size={16} />} label="Switch account" onClick={onOpenAccounts} />
            <SettingsRow icon={<Trash2 size={16} />} label="Delete my account" danger onClick={onOpenDelete} />
          </>
        )}

        <div style={{ height: 20 }} />
      </div>
      {lockFlow === 'set' && (
        <ChatLockSetup onCancel={() => setLockFlow(null)} onConfirm={(pin) => { onSetChatLockPassword(pin); setLockFlow(null); }} />
      )}
      {lockFlow === 'verify-then-change' && (
        <ChatLockUnlock correctHash={chatLockHash} onCancel={() => setLockFlow(null)} onUnlock={() => setLockFlow('set')} />
      )}
      {lockFlow === 'verify-then-off' && (
        <ChatLockUnlock correctHash={chatLockHash} onCancel={() => setLockFlow(null)} onUnlock={() => { onTurnOffChatLock(); setLockFlow(null); }} />
      )}
    </div>
  );
}

function AccountSwitcherPanel({ accounts, currentId, switchingId, onBack, onSwitch, onRemove, onAdd }) {
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
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: `1px solid ${theme.border}`, opacity: switchingId && switchingId !== a.id ? 0.5 : 1 }}>
            <div onClick={() => a.id !== currentId && !switchingId && onSwitch(a)} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: a.id !== currentId && !switchingId ? 'pointer' : 'default', minWidth: 0 }}>
              <Avatar emoji={a.avatar} name={a.name} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.ink }}>
                  {a.name}{a.id === currentId && <span style={{ color: theme.coral, fontWeight: 700 }}> Active</span>}
                </div>
                <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</div>
              </div>
              {switchingId === a.id && <Spinner size={14} color={theme.coral} />}
            </div>
            {a.id !== currentId && !switchingId && <X size={16} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => onRemove(a.id)} />}
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


function FollowStatusPill({ theirId, viewerId, viewerFollowsThem, theyFollowViewer, theirIsPrivate, onChanged }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  if (theirId === viewerId) return null;

  const label = viewerFollowsThem ? 'Following' : theyFollowViewer ? 'Follow back' : 'Follow';

  const toggle = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    if (viewerFollowsThem) {
      await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', theirId);
      onChanged(theirId, false);
    } else {
      const status = theirIsPrivate ? 'pending' : 'accepted';
      await supabase.from('follows').insert({ follower_id: viewerId, following_id: theirId, status });
      onChanged(theirId, status === 'accepted');
    }
    setBusy(false);
  };

  return (
    <button onClick={toggle} disabled={busy} style={{
      padding: '6px 13px', borderRadius: 16, cursor: busy ? 'default' : 'pointer', fontFamily: FONT, flexShrink: 0,
      border: viewerFollowsThem ? `1.5px solid ${theme.border}` : 'none',
      background: viewerFollowsThem ? 'transparent' : theme.coral,
      color: viewerFollowsThem ? theme.ink : 'white',
      fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {busy ? <Spinner size={11} color={viewerFollowsThem ? theme.ink : 'white'} /> : label}
    </button>
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
  const [iFollow, setIFollow] = useState(new Set());
  const [followsMe, setFollowsMe] = useState(new Set());

  const load = async () => {
    const col = mode === 'followers' ? 'following_id' : 'follower_id';
    const otherCol = mode === 'followers' ? 'follower_id' : 'following_id';
    const { data } = await supabase.from('follows').select('*').eq(col, userId).eq('status', 'accepted');
    const ids = (data || []).map((r) => r[otherCol]);
    if (!ids.length) { setList([]); return; }
    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
    setList(sanitizeAvatarList(profs, viewerId));
    /* Relationship between the person browsing (viewerId) and everyone in this
       list -- so "Follow back" / "Following" / "Follow" reads correctly no
       matter whose followers/following list this is. */
    const { data: mine } = await supabase.from('follows').select('following_id').eq('follower_id', viewerId).eq('status', 'accepted').in('following_id', ids);
    setIFollow(new Set((mine || []).map((r) => r.following_id)));
    const { data: theirs } = await supabase.from('follows').select('follower_id').eq('following_id', viewerId).eq('status', 'accepted').in('follower_id', ids);
    setFollowsMe(new Set((theirs || []).map((r) => r.follower_id)));
  };

  useEffect(() => { load(); }, [userId, mode]);

  const handleChanged = (theirId, nowFollowing) => {
    setIFollow((prev) => { const n = new Set(prev); if (nowFollowing) n.add(theirId); else n.delete(theirId); return n; });
  };

  return (
    <ListModal title={mode === 'followers' ? 'Followers' : 'Following'} onClose={onClose}>
      {list === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color="#888" /></div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: '#888' }}>Nobody here yet</div>
      ) : (
        list.map((p) => (
          <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} rightContent={
            <FollowStatusPill theirId={p.id} viewerId={viewerId} viewerFollowsThem={iFollow.has(p.id)} theyFollowViewer={followsMe.has(p.id)}
              theirIsPrivate={p.is_private} onChanged={handleChanged} />
          } />
        ))
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

const EXTRA_EMOJIS = ['\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F923}', '\u{1F60A}', '\u{1F60D}', '\u{1F618}', '\u{1F61C}', '\u{1F914}', '\u{1F60E}', '\u{1F634}', '\u{1F62D}', '\u{1F621}', '\u{1F973}', '\u{1F92F}', '\u{1F970}', '\u{1F607}', '\u{1F644}', '\u{1F62C}', '\u{1F917}', '\u{1F929}', '\u{1F61D}', '\u{1F622}', '\u{1F631}', '\u{1F91D}', '\u{1F44D}', '\u{1F64F}', '\u{1F4AA}', '\u{1F44F}', '\u{1F44E}', '\u{1F44C}', '\u{270C}\u{FE0F}', '\u{1F919}', '\u{1F44B}', '\u{1F4AF}', '\u{1F525}', '\u{2728}', '\u{1F389}', '\u{1F382}', '\u{2764}\u{FE0F}', '\u{1F9E1}', '\u{1F49B}', '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F494}', '\u{1F624}', '\u{1F921}', '\u{1F480}', '\u{1F440}', '\u{1F648}', '\u{1F436}', '\u{1F431}'];

const STICKERS = [
  { key: 'goma-showingaffectiongoma-20787', label: 'Affectionate', file: '/goma-showingaffectiongoma-20787.gif', category: 'goma' },
  { key: 'goma-angygoma-373337', label: 'Angry', file: '/goma-angygoma-373337.gif', category: 'goma' },
  { key: 'goma-gomabeingcute-617073', label: 'Being Cute', file: '/goma-gomabeingcute-617073.gif', category: 'goma' },
  { key: 'goma-beingcute-672399', label: 'Being Cute 2', file: '/goma-beingcute-672399.gif', category: 'goma' },
  { key: 'goma-blowingkissgoma-373625', label: 'Blowing Kiss', file: '/goma-blowingkissgoma-373625.gif', category: 'goma' },
  { key: 'goma-bouncinggomahead-541389', label: 'Bouncing', file: '/goma-bouncinggomahead-541389.gif', category: 'goma' },
  { key: 'goma-drinkingbubbleteagoma-849455', label: 'Bubble Tea', file: '/goma-drinkingbubbleteagoma-849455.gif', category: 'goma' },
  { key: 'goma-confessinggoma-894554', label: 'Confessing', file: '/goma-confessinggoma-894554.gif', category: 'goma' },
  { key: 'goma-confusedgoma-256952', label: 'Confused', file: '/goma-confusedgoma-256952.gif', category: 'goma' },
  { key: 'goma-cutiegoma-984704', label: 'Cutie', file: '/goma-cutiegoma-984704.gif', category: 'goma' },
  { key: 'goma-excitedgoma-36564', label: 'Excited', file: '/goma-excitedgoma-36564.gif', category: 'goma' },
  { key: 'goma-frustratedgoma-987352', label: 'Frustrated', file: '/goma-frustratedgoma-987352.gif', category: 'goma' },
  { key: 'goma-furiousbutcutegoma-783456', label: 'Furious but Cute', file: '/goma-furiousbutcutegoma-783456.gif', category: 'goma' },
  { key: 'goma-heartbrokengoma-680541', label: 'Heartbroken', file: '/goma-heartbrokengoma-680541.gif', category: 'goma' },
  { key: 'goma-hidinggoma-36286', label: 'Hiding', file: '/goma-hidinggoma-36286.gif', category: 'goma' },
  { key: 'goma-kawaiigoma-46218', label: 'Kawaii', file: '/goma-kawaiigoma-46218.gif', category: 'goma' },
  { key: 'goma-laughinggoma-327651', label: 'Laughing', file: '/goma-laughinggoma-327651.gif', category: 'goma' },
  { key: 'goma-mischievousgoma-452331', label: 'Mischievous', file: '/goma-mischievousgoma-452331.gif', category: 'goma' },
  { key: 'goma-nervousgoma-647040', label: 'Nervous', file: '/goma-nervousgoma-647040.gif', category: 'goma' },
  { key: 'goma-noddinggoma-326592', label: 'Nodding', file: '/goma-noddinggoma-326592.gif', category: 'goma' },
  { key: 'goma-posingforpicturegoma-484835', label: 'Posing', file: '/goma-posingforpicturegoma-484835.gif', category: 'goma' },
  { key: 'goma-gettingscolded-688067', label: 'Scolded', file: '/goma-gettingscolded-688067.gif', category: 'goma' },
  { key: 'goma-sideeyesgoma-429768', label: 'Side Eyes', file: '/goma-sideeyesgoma-429768.gif', category: 'goma' },
  { key: 'goma-sleepygoma-411565', label: 'Sleepy', file: '/goma-sleepygoma-411565.gif', category: 'goma' },
  { key: 'goma-smirkinggoma-860750', label: 'Smirking', file: '/goma-smirkinggoma-860750.gif', category: 'goma' },
  { key: 'goma-sobbinggoma-173681', label: 'Sobbing', file: '/goma-sobbinggoma-173681.gif', category: 'goma' },
  { key: 'goma-tauntgoma-15819', label: 'Taunting', file: '/goma-tauntgoma-15819.gif', category: 'goma' },
  { key: 'goma-tauntinggoma-642299', label: 'Taunting 2', file: '/goma-tauntinggoma-642299.gif', category: 'goma' },
  { key: 'goma-affectionatetearyeyedgoma-826928', label: 'Teary Eyed', file: '/goma-affectionatetearyeyedgoma-826928.gif', category: 'goma' },
  { key: 'goma-upsetgoma-256743', label: 'Upset', file: '/goma-upsetgoma-256743.gif', category: 'goma' },
  { key: 'goma-wavinggoma-957027', label: 'Waving', file: '/goma-wavinggoma-957027.gif', category: 'goma' },
  { key: 'teto-tetobaka-490591', label: 'Baka', file: '/teto-tetobaka-490591.gif', category: 'teto' },
  { key: 'teto-tetohaha-782312', label: 'Haha', file: '/teto-tetohaha-782312.png', category: 'teto' },
  { key: 'teto-terohi-298969', label: 'Hi', file: '/teto-terohi-298969.png', category: 'teto' },
  { key: 'teto-tetojudge-985315', label: 'Judging', file: '/teto-tetojudge-985315.png', category: 'teto' },
  { key: 'teto-tetolove-837749', label: 'Love', file: '/teto-tetolove-837749.png', category: 'teto' },
  { key: 'teto-tetolurk-448100', label: 'Lurk', file: '/teto-tetolurk-448100.png', category: 'teto' },
  { key: 'teto-tetosadd-40814', label: 'Sad', file: '/teto-tetosadd-40814.png', category: 'teto' },
  { key: 'teto-tetosing-759707', label: 'Singing', file: '/teto-tetosing-759707.png', category: 'teto' },
  { key: 'teto-tetosmug-422535', label: 'Smug', file: '/teto-tetosmug-422535.png', category: 'teto' },
  { key: 'teto-tetosurprised-590968', label: 'Surprised', file: '/teto-tetosurprised-590968.png', category: 'teto' },
  { key: 'hearts-blowingkisses-731843', label: 'Blowing Kisses', file: '/hearts-blowingkisses-731843.gif', category: 'hearts' },
  { key: 'hearts-heartsparkle-209871', label: 'Heart Sparkle', file: '/hearts-heartsparkle-209871.gif', category: 'hearts' },
  { key: 'hearts-heartbeat-546809', label: 'Heartbeat', file: '/hearts-heartbeat-546809.gif', category: 'hearts' },
  { key: 'hearts-pastelhearts-823826', label: 'Pastel Hearts', file: '/hearts-pastelhearts-823826.gif', category: 'hearts' },
  { key: 'hearts-pinkbow-35911', label: 'Pink Bow', file: '/hearts-pinkbow-35911.png', category: 'hearts' },
  { key: 'hearts-pinkheart-500819', label: 'Pink Heart', file: '/hearts-pinkheart-500819.gif', category: 'hearts' },
  { key: 'hearts-pinkheartservertag-166596', label: 'Pink Heart Tag', file: '/hearts-pinkheartservertag-166596.png', category: 'hearts' },
  { key: 'hearts-pinkroll-227721', label: 'Pink Roll', file: '/hearts-pinkroll-227721.png', category: 'hearts' },
  { key: 'hearts-greysparkles-725335', label: 'Sparkles', file: '/hearts-greysparkles-725335.gif', category: 'hearts' },
  { key: 'hearts-torolove-549764', label: 'Toro Love', file: '/hearts-torolove-549764.gif', category: 'hearts' },
  { key: 'red-redbutterflywingleft-5507', label: 'Butterfly Left', file: '/red-redbutterflywingleft-5507.png', category: 'red' },
  { key: 'red-redbutterflywingright-7840', label: 'Butterfly Right', file: '/red-redbutterflywingright-7840.png', category: 'red' },
  { key: 'red-redcandycane-1768', label: 'Candy Cane', file: '/red-redcandycane-1768.gif', category: 'red' },
  { key: 'red-redcheesecakez-44395', label: 'Cheesecake', file: '/red-redcheesecakez-44395.png', category: 'red' },
  { key: 'red-redcrystalball-4533', label: 'Crystal Ball', file: '/red-redcrystalball-4533.png', category: 'red' },
  { key: 'red-joobi-red-disappearing-46032', label: 'Disappearing', file: '/red-joobi-red-disappearing-46032.png', category: 'red' },
  { key: 'red-gothred-36852', label: 'Goth', file: '/red-gothred-36852.gif', category: 'red' },
  { key: 'red-red-heart-guild-tag-14405', label: 'Heart Tag', file: '/red-red-heart-guild-tag-14405.png', category: 'red' },
  { key: 'red-joobi-red-kitty-face-99645', label: 'Kitty Face', file: '/red-joobi-red-kitty-face-99645.png', category: 'red' },
  { key: 'red-red-11042', label: 'Red', file: '/red-red-11042.gif', category: 'red' },
  { key: 'red-red-33111', label: 'Red', file: '/red-red-33111.png', category: 'red' },
  { key: 'red-red-50876', label: 'Red', file: '/red-red-50876.png', category: 'red' },
  { key: 'red-ruby-4015', label: 'Ruby', file: '/red-ruby-4015.png', category: 'red' },
  { key: 'red-joobi-red-silly-happy-10374', label: 'Silly Happy', file: '/red-joobi-red-silly-happy-10374.png', category: 'red' },
  { key: 'red-spider-lily-3967', label: 'Spider Lily', file: '/red-spider-lily-3967.png', category: 'red' },
  { key: 'red-redstar-30379', label: 'Star', file: '/red-redstar-30379.png', category: 'red' },
  { key: 'cute-cinnamoroll-635595', label: 'Cinnamoroll', file: '/cute-cinnamoroll-635595.png', category: 'cute' },
  { key: 'cute-hellokittybeg-600386', label: 'Hello Kitty', file: '/cute-hellokittybeg-600386.gif', category: 'cute' },
  { key: 'cute-sakura-685984', label: 'Sakura', file: '/cute-sakura-685984.gif', category: 'cute' },
  { key: 'cute-uwu-263966', label: 'UwU', file: '/cute-uwu-263966.png', category: 'cute' },
];

const STICKER_CATEGORIES = [
  { key: 'favorites', label: 'Favorites' },
  { key: 'goma', label: 'Goma' },
  { key: 'teto', label: 'Teto' },
  { key: 'hearts', label: 'Hearts' },
  { key: 'red', label: 'Red Pack' },
  { key: 'cute', label: 'Cute' },
];

function getFavoriteStickerKeys() {
  try { return new Set(JSON.parse(localStorage.getItem('zchat-fav-stickers') || '[]')); } catch { return new Set(); }
}
function toggleFavoriteSticker(key) {
  const cur = getFavoriteStickerKeys();
  if (cur.has(key)) cur.delete(key); else cur.add(key);
  try { localStorage.setItem('zchat-fav-stickers', JSON.stringify([...cur])); } catch {}
  return cur;
}

function StickerPicker({ onPick, onClose }) {
  const { theme } = useTheme();
  const [favKeys, setFavKeys] = useState(() => getFavoriteStickerKeys());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(() => (getFavoriteStickerKeys().size > 0 ? 'favorites' : 'goma'));

  const toggleFav = (e, key) => {
    e.stopPropagation();
    setFavKeys(new Set(toggleFavoriteSticker(key)));
  };

  const filtered = STICKERS.filter((s) => {
    if (query.trim()) return s.label.toLowerCase().includes(query.trim().toLowerCase());
    if (category === 'favorites') return favKeys.has(s.key);
    return s.category === category;
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 93,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={glass(theme, {
        borderRadius: '26px 26px 0 0', padding: '18px 18px 16px', width: '100%', maxWidth: 460,
        height: '40vh', maxHeight: 360, minHeight: 300, display: 'flex', flexDirection: 'column',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        border: 'none', borderTop: `1px solid ${theme.border}`,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
      })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexShrink: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>Stickers</div>
          <div onClick={onClose} style={{
            width: 26, height: 26, borderRadius: '50%', background: theme.rowBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={14} color={theme.muted} /></div>
        </div>
        <div style={{ position: 'relative', marginBottom: 10, flexShrink: 0 }}>
          <Search size={14} color={theme.muted} style={{ position: 'absolute', left: 11, top: 10 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search stickers"
            style={{ ...inputStyle(theme), padding: '8px 12px 8px 32px', fontSize: 13 }} />
        </div>
        {!query.trim() && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto', flexShrink: 0 }}>
            {STICKER_CATEGORIES.map((c) => (
              <div key={c.key} onClick={() => setCategory(c.key)} style={{
                padding: '6px 13px', borderRadius: 16, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                background: category === c.key ? theme.coral : theme.rowBg, color: category === c.key ? 'white' : theme.muted,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>{c.key === 'favorites' && <Star_ size={11} color={category === c.key ? 'white' : '#FFB800'} filled />}{c.label}</div>
            ))}
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, alignContent: 'flex-start', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, fontSize: 12.5, color: theme.muted }}>
              {category === 'favorites' ? 'No favorites yet -- tap the star on any sticker' : 'No stickers found'}
            </div>
          )}
          {filtered.map((s) => (
            <div key={s.key} onClick={() => onPick(s)} style={{
              position: 'relative', borderRadius: 16, background: theme.rowBg, cursor: 'pointer',
              border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1 / 1', overflow: 'hidden',
            }}>
              <img src={s.file} alt={s.label} loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()}
                style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
              <div onClick={(e) => toggleFav(e, s.key)} style={{
                position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Star_ size={11} color={favKeys.has(s.key) ? '#FFB800' : 'white'} filled={favKeys.has(s.key)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Star_({ size = 14, color = '#FFB800', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2.5l2.9 6.4 6.9.7-5.2 4.7 1.5 6.8L12 17.8l-6.1 3.3 1.5-6.8-5.2-4.7 6.9-.7z" />
    </svg>
  );
}

function FullEmojiPicker({ onPick, onClose }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 92,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: 22, padding: 18, width: '100%', maxWidth: 340, maxHeight: '60vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>React with</div>
          <X size={18} style={{ cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        </div>
        <div style={{ overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {EXTRA_EMOJIS.map((e, i) => (
            <div key={e + i} onClick={() => onPick(e)} style={{ fontSize: 24, cursor: 'pointer', textAlign: 'center', padding: '6px 0' }}>{e}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
function MessageContextMenu({ message, isMine, canEditText, canModerate, onClose, onReact, onReply, onCopy, onEdit, onForward, onReport, onDeleteForMe, onDeleteForEveryone, onSelectMultiple }) {
  const { theme } = useTheme();
  const [showFullEmoji, setShowFullEmoji] = useState(false);
  const row = { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: theme.ink };
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 95,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, padding: 16, width: '100%', maxWidth: 300 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '4px 0 14px' }}>
          {REACTION_EMOJIS.map((e) => (
            <div key={e} onClick={() => onReact(e)} style={{ fontSize: 24, cursor: 'pointer' }}>{e}</div>
          ))}
          <div onClick={() => setShowFullEmoji(true)} style={{
            width: 26, height: 26, borderRadius: '50%', background: theme.rowBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}><span style={{ fontSize: 16, fontWeight: 800, color: theme.muted, lineHeight: 1 }}>+</span></div>
        </div>
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 4 }}>
          <div style={row} onClick={onReply}><Reply size={16} /> Reply</div>
          {!message.deleted && message.type === 'text' && <div style={row} onClick={onCopy}><Check size={16} /> Copy</div>}
          {!message.deleted && canEditText && <div style={row} onClick={onEdit}><Edit3 size={16} /> Edit</div>}
          <div style={row} onClick={onForward}><Forward size={16} /> Forward</div>
          <div style={row} onClick={onSelectMultiple}><Check size={16} /> Select multiple</div>
          {!isMine && <div style={{ ...row, color: theme.danger }} onClick={onReport}><Flag size={16} color={theme.danger} /> Report</div>}
          <div style={{ ...row, color: theme.danger }} onClick={onDeleteForMe}><Trash2 size={16} color={theme.danger} /> Delete for me</div>
          {(isMine || canModerate) && !message.deleted && <div style={{ ...row, color: theme.danger }} onClick={onDeleteForEveryone}><Trash2 size={16} color={theme.danger} /> Delete for everyone</div>}
        </div>
      </div>
      {showFullEmoji && (
        <FullEmojiPicker onClose={() => setShowFullEmoji(false)} onPick={(e) => { onReact(e); setShowFullEmoji(false); }} />
      )}
    </div>
  );
}

function EmojiPickerBar({ onPick, onClose }) {
  const { theme } = useTheme();
  const [showFullEmoji, setShowFullEmoji] = useState(false);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 91,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: 22, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        {REACTION_EMOJIS.map((e) => (
          <div key={e} onClick={() => onPick(e)} style={{ fontSize: 26, cursor: 'pointer' }}>{e}</div>
        ))}
        <div onClick={() => setShowFullEmoji(true)} style={{
          width: 30, height: 30, borderRadius: '50%', background: theme.rowBg, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}><span style={{ fontSize: 18, fontWeight: 800, color: theme.muted, lineHeight: 1 }}>+</span></div>
      </div>
      {showFullEmoji && (
        <FullEmojiPicker onClose={() => setShowFullEmoji(false)} onPick={(e) => { onPick(e); setShowFullEmoji(false); }} />
      )}
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

const WALLPAPER_PRESETS = [
  { key: 'elements-duel', label: 'Elements Duel', file: '/wallpaper-elements-duel.jpg' },
  { key: 'rain-reflection', label: 'Rain Reflection', file: '/wallpaper-rain-reflection.jpg' },
  { key: 'inner-flame', label: 'Inner Flame', file: '/wallpaper-inner-flame.jpg' },
  { key: 'blue-eyes', label: 'Blue Eyes', file: '/wallpaper-blue-eyes.jpg' },
  { key: 'cherry-night', label: 'Cherry Night', file: '/wallpaper-cherry-night.jpg' },
  { key: 'shadow-knight', label: 'Shadow Knight', file: '/wallpaper-shadow-knight.jpg' },
  { key: 'moonlit-bench', label: 'Moonlit Bench', file: '/wallpaper-moonlit-bench.jpg' },
  { key: 'sunset-hearts', label: 'Sunset Hearts', file: '/wallpaper-sunset-hearts.jpg' },
  { key: 'day-and-night', label: 'Day and Night', file: '/wallpaper-day-and-night.jpg' },
  { key: 'red-lantern', label: 'Red Lantern', file: '/wallpaper-red-lantern.jpg' },
  { key: 'forest-rain', label: 'Forest Rain', file: '/wallpaper-forest-rain.jpg' },
  { key: 'umbrella-hearts', label: 'Umbrella Hearts', file: '/wallpaper-umbrella-hearts.jpg' },
  { key: 'moon-leaves', label: 'Moon Leaves', file: '/wallpaper-moon-leaves.jpg' },
  { key: 'you-mean-the-world', label: 'You Mean The World', file: '/wallpaper-you-mean-the-world.jpg' },
  { key: 'lonely-walk', label: 'Lonely Walk', file: '/wallpaper-lonely-walk.jpg' },
  { key: 'leaf-rain', label: 'Leaf Rain', file: '/wallpaper-leaf-rain.jpg' },
  { key: 'squad-hands', label: 'Squad Hands', file: '/wallpaper-squad-hands.jpg' },
  { key: 'rainy-street', label: 'Rainy Street', file: '/wallpaper-rainy-street.jpg' },
  { key: 'two-friends-night', label: 'Two Friends Night', file: '/wallpaper-two-friends-night.jpg' },
  { key: 'rooftop-moon', label: 'Rooftop Moon', file: '/wallpaper-rooftop-moon.jpg' },
  { key: 'sunset-cheers', label: 'Sunset Cheers', file: '/wallpaper-sunset-cheers.jpg' },
  { key: 'river-sunset', label: 'River Sunset', file: '/wallpaper-river-sunset.jpg' },
  { key: 'storm-embrace', label: 'Storm Embrace', file: '/wallpaper-storm-embrace.jpg' },
  { key: 'balcony-moon', label: 'Balcony Moon', file: '/wallpaper-balcony-moon.jpg' },
  { key: 'girls-sky', label: 'Girls Sky', file: '/wallpaper-girls-sky.jpg' },
  { key: 'friend-circle', label: 'Friend Circle', file: '/wallpaper-friend-circle.jpg' },
  { key: 'cat-squad', label: 'Cat Squad', file: '/wallpaper-cat-squad.jpg' },
];

function wallpaperBgStyle(key) {
  const preset = WALLPAPER_PRESETS.find((p) => p.key === key);
  if (!preset) return null;
  return {
    backgroundImage: `url('${preset.file}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

function WallpaperPicker({ value, onSelect, onClose }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: theme.panelBg, zIndex: 96,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Chat wallpaper</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div onClick={() => { onSelect(null); onClose(); }} style={{
            aspectRatio: '9 / 16', borderRadius: 14, cursor: 'pointer', background: theme.bgGradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: !value ? `2.5px solid ${theme.coral}` : `1.5px solid ${theme.border}`,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.ink }}>Default</span>
          </div>
          {WALLPAPER_PRESETS.map((p) => (
            <div key={p.key} onClick={() => { onSelect(p.key); onClose(); }} style={{
              aspectRatio: '9 / 16', borderRadius: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              border: value === p.key ? `2.5px solid ${theme.coral}` : `1.5px solid ${theme.border}`,
              ...wallpaperBgStyle(p.key),
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.65) 100%)' }} />
              <span style={{
                position: 'absolute', left: 6, bottom: 5, right: 6, fontSize: 10, fontWeight: 700, color: 'white',
                lineHeight: 1.2,
              }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const NAME_BAR_PRESETS = [
  { key: 'ice', label: 'Ice Wolf', file: '/name-bar-ice-wolf.png' },
  { key: 'eclipse', label: 'Eclipse Night', file: '/name-bar-eclipse-night.png' },
  { key: 'ocean', label: 'Ocean Heart', file: '/name-bar-ocean-heart.png' },
  { key: 'together', label: 'Together Forever', file: '/name-bar-together-forever.png' },
  { key: 'whale', label: 'Cosmic Whale', file: '/name-bar-cosmic-whale.png' },
  { key: 'inferno', label: 'Inferno Wolf', file: '/name-bar-inferno-wolf.png' },
  { key: 'blossom', label: 'Cherry Blossom', file: '/name-bar-cherry-blossom.png' },
  { key: 'forest', label: 'Emerald Forest', file: '/name-bar-emerald-forest.png' },
  { key: 'horizon', label: 'Golden Horizon', file: '/name-bar-golden-horizon.png' },
  { key: 'aurora', label: 'Aurora Nights', file: '/name-bar-aurora-nights.png' },
];
function nameBarBgStyle(key) {
  const preset = NAME_BAR_PRESETS.find((p) => p.key === key);
  if (!preset) return null;
  return {
    backgroundImage: `url('${preset.file}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
}

function NameBarPicker({ value, onSelect, onClose }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 96,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, padding: 20, width: '100%', maxWidth: 340, maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
        <X size={19} style={{ position: 'absolute', top: 16, right: 16, cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, marginBottom: 14, paddingRight: 24 }}>Header style</div>
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div onClick={() => { onSelect(null); onClose(); }} style={{
            height: 44, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: !value ? `2.5px solid ${theme.coral}` : `1.5px solid ${theme.border}`, background: theme.rowBg,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.ink }}>None</span>
          </div>
          {NAME_BAR_PRESETS.map((p) => (
            <div key={p.key} onClick={() => { onSelect(p.key); onClose(); }} style={{
              height: 56, borderRadius: 12, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              border: value === p.key ? `2.5px solid ${theme.coral}` : `1.5px solid ${theme.border}`,
              ...nameBarBgStyle(p.key),
            }}>
              <span style={{
                position: 'absolute', left: 10, bottom: 6, fontSize: 11, fontWeight: 800, color: 'white',
                textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              }}>{p.label}</span>
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
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '\u232B'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {keys.map((k, i) => (
        <div key={i} onClick={() => { if (k === '\u232B') onBackspace(); else if (k) onDigit(k); }} style={{
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
    <div onClick={(e) => e.stopPropagation()} style={{
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
    <div onClick={(e) => e.stopPropagation()} style={{
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


function NicknameEditRow({ avatar, label, currentValue, placeholder, onSave }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ padding: '14px 4px' }}>
      <div onClick={() => !editing && setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: editing ? 'default' : 'pointer' }}>
        <Avatar emoji={avatar} name={label} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
          {editing ? (
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value.slice(0, 30))} placeholder={placeholder}
              style={{ ...inputStyle(theme), fontSize: 13.5, padding: '7px 10px' }} />
          ) : (
            <div style={{ fontSize: 14.5, fontWeight: 700, color: currentValue ? theme.ink : theme.muted, fontStyle: currentValue ? 'normal' : 'italic' }}>
              {currentValue || placeholder}
            </div>
          )}
        </div>
      </div>
      {editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
          <span style={ghostBtn(theme)} onClick={() => { setVal(''); setEditing(false); }}>Cancel</span>
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave(val); setSaving(false); setVal(''); setEditing(false); }} style={{
            padding: '7px 16px', borderRadius: 12, border: 'none', background: theme.coral, color: 'white',
            fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT,
          }}>{saving ? <Spinner size={12} /> : 'Save'}</button>
        </div>
      )}
    </div>
  );
}

function NicknamesModal({ conv, myAvatar, myName, currentNickname, currentAlias, onSaveNickname, onSaveAlias, onClose }) {
  const { theme } = useTheme();
  const otherRealName = conv.realName || conv.otherProfile.name;
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 34,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: '18px 20px', width: '100%', maxWidth: 340 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Nicknames</div>
          <X size={19} style={{ cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>Tap either name to change it. Only visible to you.</div>
        <NicknameEditRow avatar={conv.otherProfile.avatar} label={otherRealName} currentValue={currentNickname} placeholder={otherRealName} onSave={onSaveNickname} />
        <div style={{ height: 1, background: theme.border }} />
        <NicknameEditRow avatar={myAvatar} label="You" currentValue={currentAlias} placeholder={myName} onSave={onSaveAlias} />
      </div>
    </div>
  );
}

function PillRow({ icon, label, onClick, danger }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', marginBottom: 8,
      borderRadius: 999, cursor: 'pointer',
      background: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.035)',
      border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'}`,
      backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: danger ? `${theme.danger}1F` : `${theme.coral}1F`, color: danger ? theme.danger : theme.coralDeep, flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: danger ? theme.danger : theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      {!danger && <ChevronRight size={14} color={theme.muted} style={{ flexShrink: 0 }} />}
    </div>
  );
}

function ChatSettingsPanel({ conv, myId, meAvatar, meName, isPinned, isLocked, wallpaper, nameBar, chatLockAvailable, onClose, onTogglePin, onToggleArchive, onSetWallpaper, onSetNameBar, onEnableLock, onDisableLock, onDeleteChat, onReportUser, onNicknameSaved, onNeedChatLockSetup, onOpenProfile }) {
  const { theme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [myAlias, setMyAlias] = useState('');
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showNameBar, setShowNameBar] = useState(false);
  const [showNicknames, setShowNicknames] = useState(false);
  const [showReportUser, setShowReportUser] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [listModal, setListModal] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('contact_nicknames').select('nickname').eq('owner_id', myId).eq('contact_id', conv.otherProfile.id).maybeSingle();
      setNickname(data ? data.nickname : '');
      const { data: aliasRow } = await supabase.from('self_aliases').select('alias').eq('user_id', myId).eq('viewer_id', conv.otherProfile.id).maybeSingle();
      setMyAlias(aliasRow ? aliasRow.alias : '');
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', conv.otherProfile.id).eq('status', 'accepted');
      setFollowerCount(followers || 0);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', conv.otherProfile.id).eq('status', 'accepted');
      setFollowingCount(following || 0);
    })();
  }, [conv.otherProfile.id]);

  const saveMyAlias = async (val) => {
    if (val.trim()) {
      await supabase.from('self_aliases').upsert({ user_id: myId, viewer_id: conv.otherProfile.id, alias: val.trim() }, { onConflict: 'user_id,viewer_id' });
    } else {
      await supabase.from('self_aliases').delete().eq('user_id', myId).eq('viewer_id', conv.otherProfile.id);
    }
    await sendMessage(myId, conv.otherProfile.id, 'system', val.trim() ? `Now appears as "${val.trim()}" to you` : 'Reverted to their real name', null);
    setMyAlias(val.trim());
  };
  const saveNickname = async (val) => {
    if (val.trim()) {
      await supabase.from('contact_nicknames').upsert({ owner_id: myId, contact_id: conv.otherProfile.id, nickname: val.trim() }, { onConflict: 'owner_id,contact_id' });
      await sendMessage(myId, conv.otherProfile.id, 'system', `Nickname updated to "${val.trim()}"`, null);
    } else {
      await supabase.from('contact_nicknames').delete().eq('owner_id', myId).eq('contact_id', conv.otherProfile.id);
      await sendMessage(myId, conv.otherProfile.id, 'system', 'Nickname removed', null);
    }
    setNickname(val.trim());
    onNicknameSaved(val.trim() || null, conv.otherProfile.id);
  };

  const otherName = conv.realName || conv.otherProfile.name;
  const p = conv.otherProfile;
  const infoBits = [
    p.gender && !p.hide_gender ? p.gender : null,
    p.age != null && !p.hide_age ? `${p.age} yrs` : null,
    p.country && !p.hide_country ? countryFlag(p.country) : null,
  ].filter(Boolean);
  const showBio = p.bio && !p.hide_bio;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 33,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} className="zchat-fade">
      <div style={{
        position: 'absolute', inset: 0, backgroundImage: "url('/chat-bg.jpg')",
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35, pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, position: 'relative', flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Chat settings</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 18px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', marginBottom: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar emoji={conv.otherProfile.avatar} name={otherName} size={56} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 14.5, color: theme.ink, marginTop: 7 }}>{otherName}</div>
          <div style={{ fontSize: 11.5, color: theme.muted }}>@{conv.otherProfile.username}</div>
          {infoBits.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {infoBits.map((bit, i) => (
                <span key={i} style={{
                  fontSize: 11, color: theme.ink, fontWeight: 600, background: theme.rowBg,
                  padding: '3px 10px', borderRadius: 12,
                }}>{bit}</span>
              ))}
            </div>
          )}
          {showBio && (
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, padding: '0 24px', lineHeight: 1.5 }}>{p.bio}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
            <div onClick={() => setListModal('followers')} style={{ flex: 1, maxWidth: 130, background: theme.rowBg, borderRadius: 14, padding: '8px 10px', cursor: 'pointer' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: theme.ink }}>{followerCount}</div>
              <div style={{ fontSize: 9.5, color: theme.muted, fontWeight: 600 }}>Followers</div>
            </div>
            <div onClick={() => setListModal('following')} style={{ flex: 1, maxWidth: 130, background: theme.rowBg, borderRadius: 14, padding: '8px 10px', cursor: 'pointer' }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: theme.ink }}>{followingCount}</div>
              <div style={{ fontSize: 9.5, color: theme.muted, fontWeight: 600 }}>Following</div>
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, paddingBottom: 20 }}>
          <PillRow icon={<AtSign size={14} />} label="Nicknames" onClick={() => setShowNicknames(true)} />
          <PillRow icon={<Pin_ size={14} />} label={isPinned ? 'Unpin chat' : 'Pin chat'} onClick={onTogglePin} />
          <PillRow icon={<Archive size={14} />} label="Archive chat" onClick={onToggleArchive} />
          <PillRow icon={<ImageIcon size={14} />} label="Chat wallpaper" onClick={() => setShowWallpaper(true)} />
          <PillRow icon={<Sparkles size={14} />} label="Header style" onClick={() => setShowNameBar(true)} />
          <PillRow icon={<Lock size={14} />} label={isLocked ? 'Remove chat lock' : 'Lock this chat'}
            onClick={() => { if (isLocked) onDisableLock(); else if (chatLockAvailable) onEnableLock(); else onNeedChatLockSetup(); }} />
          <PillRow icon={<Flag size={14} />} label={`Report ${otherName}`} danger onClick={() => setShowReportUser(true)} />
          <PillRow icon={<Trash2 size={14} />} label={`Delete chat with ${otherName}`} danger onClick={onDeleteChat} />
        </div>
      </div>
      {showWallpaper && (
        <WallpaperPicker value={wallpaper} onSelect={onSetWallpaper} onClose={() => setShowWallpaper(false)} />
      )}
      {showNameBar && (
        <NameBarPicker value={nameBar} onSelect={onSetNameBar} onClose={() => setShowNameBar(false)} />
      )}
      {showNicknames && (
        <NicknamesModal
          conv={conv} myAvatar={meAvatar} myName={meName}
          currentNickname={nickname} currentAlias={myAlias}
          onSaveNickname={saveNickname} onSaveAlias={saveMyAlias}
          onClose={() => setShowNicknames(false)}
        />
      )}
      {showReportUser && (
        <ReportMessageModal
          title={`Report ${otherName}`}
          onCancel={() => setShowReportUser(false)}
          onSubmit={(reason) => { onReportUser(reason); setShowReportUser(false); }}
        />
      )}
      {listModal && (
        <FollowListModal userId={conv.otherProfile.id} viewerId={myId} mode={listModal} onClose={() => setListModal(null)}
          onOpenProfile={(pf) => { setListModal(null); onOpenProfile(pf); }} />
      )}
    </div>
  );
}

function Pin_({ size = 16, color = '#FF3B30' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.5 2.5a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4l-3 3a1 1 0 0 1-1.3.1l-1-.7-3.6 3.6.6 2.7a1 1 0 0 1-.3.9l-1 1a1 1 0 0 1-1.4 0l-3.1-3.1-4.3 4.3a.75.75 0 0 1-1-1l4.3-4.3-3.1-3.1a1 1 0 0 1 0-1.4l1-1a1 1 0 0 1 .9-.3l2.7.6 3.6-3.6-.7-1a1 1 0 0 1 .1-1.3z"
        fill={color} stroke={color} strokeWidth="0.6" strokeLinejoin="round" strokeLinecap="round"
        transform="rotate(45 12 12)" />
    </svg>
  );
}


function GroupAvatar({ avatar, name, size = 44 }) {
  const { theme } = useTheme();
  if (avatar) {
    return <img src={avatar} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
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
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>{step === 'members' ? `Add participants${selected.length ? ` (${selected.length})` : ''}` : 'New group'}</div>
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
                <img src={avatarPreview} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }} />
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
        <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={(blob) => {
          const file = new File([blob], 'group.jpg', { type: 'image/jpeg' });
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(blob));
          setCropFile(null);
        }} />
      )}
    </div>
  );
}

function GroupInfoPanel({ group, members, myId, myRole, isOwner, onClose, onPromote, onDemote, onMute, onUnmute, onKick, onLeave, onOpenProfile, onSaveBio, onSaveName, onSaveAvatar, onAddMembers, onTransferOwnership, onSetWallpaper, onSetHeaderStyle }) {
  const { theme } = useTheme();
  const isAdmin = myRole === 'admin';
  const [menuFor, setMenuFor] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(group.bio || '');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [cropFile, setCropFile] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showHeaderStyle, setShowHeaderStyle] = useState(false);
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

        {isAdmin && (
          <>
            <SettingsRow icon={<ImageIcon size={16} />} label="Chat wallpaper" onClick={() => setShowWallpaper(true)} />
            <SettingsRow icon={<Sparkles size={16} />} label="Header style" onClick={() => setShowHeaderStyle(true)} />
            <div style={{ height: 12 }} />
          </>
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
                  {m.joined_at ? ` on ${new Date(m.joined_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} at ${new Date(m.joined_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}
                </div>
              </div>
            </div>
            {isAdmin && m.user_id !== myId && m.user_id !== group.created_by && (
              <MoreVertical size={16} color={theme.muted} style={{ cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuFor(menuFor === m.user_id ? null : m.user_id); }} />
            )}
          </div>
        ))}
        <SmartMenu anchorEl={menuAnchor} open={!!menuFor} onClose={() => setMenuFor(null)} width={190}>
          {(() => {
            const mm = members.find((x) => x.user_id === menuFor);
            if (!mm || mm.user_id === group.created_by) return null;
            return (
              <div style={{ background: theme.panelBg, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                {isOwner && (mm.role === 'admin' ? (
                  <div onClick={() => { onDemote(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Remove as admin</div>
                ) : (
                  <div onClick={() => { onPromote(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Make admin</div>
                ))}
                {isOwner && (
                  <div onClick={() => { onTransferOwnership(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.coral, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Make owner</div>
                )}
                {mm.muted ? (
                  <div onClick={() => { onUnmute(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Unmute in group</div>
                ) : (
                  <div onClick={() => { onMute(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>Mute in group</div>
                )}
                <div onClick={() => { onKick(mm.user_id); setMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.danger, cursor: 'pointer' }}>Remove from group</div>
              </div>
            );
          })()}
        </SmartMenu>
      </div>
      <div style={{ padding: 18, borderTop: `1px solid ${theme.border}` }}>
        <span style={{ ...ghostBtn(theme), color: theme.danger, borderColor: theme.danger, display: 'block', textAlign: 'center', opacity: (soleAdmin || isOwner) ? 0.5 : 1, cursor: (soleAdmin || isOwner) ? 'default' : 'pointer' }}
          onClick={() => { if (!soleAdmin && !isOwner) onLeave(); }}>
          {isOwner ? 'Transfer ownership before leaving' : soleAdmin ? 'Leave group (assign a new admin first)' : 'Leave group'}
        </span>
      </div>
      {cropFile && (
        <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={(blob) => { onSaveAvatar(blob); setCropFile(null); }} />
      )}
      {showWallpaper && (
        <WallpaperPicker value={group.wallpaper} onSelect={onSetWallpaper} onClose={() => setShowWallpaper(false)} />
      )}
      {showHeaderStyle && (
        <NameBarPicker value={group.name_bar} onSelect={onSetHeaderStyle} onClose={() => setShowHeaderStyle(false)} />
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

function PhotoCropEditor({ file, isAvatar = false, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [imgEl, setImgEl] = useState(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [rect, setRect] = useState(null);
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const BOX = 320;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const boxW = BOX;
  const boxH = imgEl ? Math.min(420, BOX * (imgEl.naturalHeight / imgEl.naturalWidth)) : BOX;
  const displayScale = imgEl ? Math.min(boxW / imgEl.naturalWidth, boxH / imgEl.naturalHeight) : 1;
  const drawnW = imgEl ? imgEl.naturalWidth * displayScale : boxW;
  const drawnH = imgEl ? imgEl.naturalHeight * displayScale : boxH;
  const offsetX = (boxW - drawnW) / 2;
  const offsetY = (boxH - drawnH) / 2;

  useEffect(() => {
    if (!imgEl) return;
    if (isAvatar) {
      const side = Math.min(drawnW, drawnH) * 0.86;
      setRect({ x: offsetX + (drawnW - side) / 2, y: offsetY + (drawnH - side) / 2, w: side, h: side });
    } else {
      const pad = 0.06;
      setRect({ x: offsetX + drawnW * pad, y: offsetY + drawnH * pad, w: drawnW * (1 - pad * 2), h: drawnH * (1 - pad * 2) });
    }
  }, [imgEl]);

  if (!imgEl || !rect) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
        <Spinner size={26} color="white" />
      </div>
    );
  }

  const MIN_SIZE = 60;
  const imgBounds = { left: offsetX, top: offsetY, right: offsetX + drawnW, bottom: offsetY + drawnH };

  const clampRect = (r) => {
    let { x, y, w, h } = r;
    w = Math.max(MIN_SIZE, Math.min(w, imgBounds.right - imgBounds.left));
    h = Math.max(MIN_SIZE, Math.min(h, imgBounds.bottom - imgBounds.top));
    x = Math.max(imgBounds.left, Math.min(x, imgBounds.right - w));
    y = Math.max(imgBounds.top, Math.min(y, imgBounds.bottom - h));
    return { x, y, w, h };
  };

  const startDrag = (mode, clientX, clientY) => {
    dragRef.current = { mode, startX: clientX, startY: clientY, orig: { ...rect } };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current || !boxRef.current) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const o = dragRef.current.orig;
    const { mode } = dragRef.current;
    let next = { ...o };
    if (mode === 'move') {
      next = { x: o.x + dx, y: o.y + dy, w: o.w, h: o.h };
    } else if (isAvatar) {
      const delta = mode.includes('right') || mode.includes('bottom') ? Math.max(dx, dy) : -Math.max(-dx, -dy);
      const side = Math.max(MIN_SIZE, o.w + delta);
      if (mode === 'nw') next = { x: o.x + (o.w - side), y: o.y + (o.h - side), w: side, h: side };
      else if (mode === 'ne') next = { x: o.x, y: o.y + (o.h - side), w: side, h: side };
      else if (mode === 'sw') next = { x: o.x + (o.w - side), y: o.y, w: side, h: side };
      else next = { x: o.x, y: o.y, w: side, h: side };
    } else {
      if (mode.includes('n')) { next.y = o.y + dy; next.h = o.h - dy; }
      if (mode.includes('s')) { next.h = o.h + dy; }
      if (mode.includes('w')) { next.x = o.x + dx; next.w = o.w - dx; }
      if (mode.includes('e')) { next.w = o.w + dx; }
    }
    setRect(clampRect(next));
  };
  const endDrag = () => { dragRef.current = null; };

  const confirm = () => {
    setSaving(true);
    const outSize = isAvatar ? 480 : 1080;
    const cropXOnImg = (rect.x - offsetX) / displayScale;
    const cropYOnImg = (rect.y - offsetY) / displayScale;
    const cropWOnImg = rect.w / displayScale;
    const cropHOnImg = rect.h / displayScale;
    const canvas = document.createElement('canvas');
    const outW = isAvatar ? outSize : outSize;
    const outH = isAvatar ? outSize : Math.round(outSize * (cropHOnImg / cropWOnImg));
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgEl, cropXOnImg, cropYOnImg, cropWOnImg, cropHOnImg, 0, 0, outW, outH);
    canvas.toBlob((blob) => { setSaving(false); if (blob) onConfirm(blob, caption.trim()); }, 'image/jpeg', isAvatar ? 0.92 : 0.9);
  };

  const Handle = ({ mode, style }) => (
    <div
      onMouseDown={(e) => { e.stopPropagation(); startDrag(mode, e.clientX, e.clientY); }}
      onTouchStart={(e) => { e.stopPropagation(); startDrag(mode, e.touches[0].clientX, e.touches[0].clientY); }}
      style={{
        position: 'absolute', width: 22, height: 22, borderRadius: isAvatar ? '50%' : 6,
        background: 'white', border: `3px solid ${theme.coral}`, ...style, touchAction: 'none',
      }}
    />
  );

  return (
    <div
      style={{
        position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.92)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 20,
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
      }}
      className="zchat-fade"
      onMouseMove={(e) => moveDrag(e.clientX, e.clientY)} onMouseUp={endDrag} onMouseLeave={endDrag}
      onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)} onTouchEnd={endDrag}
    >
      <div onClick={onCancel} style={{
        position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 16, width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
      }}><X size={18} color="white" /></div>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 14 }}>{isAvatar ? 'Adjust your photo' : 'Edit photo'}</div>
      <div ref={boxRef} style={{ width: boxW, height: boxH, position: 'relative', marginBottom: 16, touchAction: 'none' }}>
        <img src={imgEl.src} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{
          position: 'absolute', left: offsetX, top: offsetY, width: drawnW, height: drawnH, userSelect: 'none', pointerEvents: 'none',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', clipPath: `polygon(0 0, 0 100%, ${rect.x}px 100%, ${rect.x}px ${rect.y}px, ${rect.x + rect.w}px ${rect.y}px, ${rect.x + rect.w}px ${rect.y + rect.h}px, ${rect.x}px ${rect.y + rect.h}px, ${rect.x}px 100%, 100% 100%, 100% 0)` }} />
        <div
          onMouseDown={(e) => startDrag('move', e.clientX, e.clientY)}
          onTouchStart={(e) => startDrag('move', e.touches[0].clientX, e.touches[0].clientY)}
          style={{
            position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h,
            border: `2px solid ${theme.coral}`, borderRadius: isAvatar ? '50%' : 4, cursor: 'move', touchAction: 'none',
          }}
        />
        <Handle mode="nw" style={{ left: rect.x - 11, top: rect.y - 11, cursor: 'nwse-resize' }} />
        <Handle mode="ne" style={{ left: rect.x + rect.w - 11, top: rect.y - 11, cursor: 'nesw-resize' }} />
        <Handle mode="sw" style={{ left: rect.x - 11, top: rect.y + rect.h - 11, cursor: 'nesw-resize' }} />
        <Handle mode="se" style={{ left: rect.x + rect.w - 11, top: rect.y + rect.h - 11, cursor: 'nwse-resize' }} />
        {!isAvatar && (
          <>
            <Handle mode="n" style={{ left: rect.x + rect.w / 2 - 11, top: rect.y - 11, cursor: 'ns-resize' }} />
            <Handle mode="s" style={{ left: rect.x + rect.w / 2 - 11, top: rect.y + rect.h - 11, cursor: 'ns-resize' }} />
            <Handle mode="w" style={{ left: rect.x - 11, top: rect.y + rect.h / 2 - 11, cursor: 'ew-resize' }} />
            <Handle mode="e" style={{ left: rect.x + rect.w - 11, top: rect.y + rect.h / 2 - 11, cursor: 'ew-resize' }} />
          </>
        )}
      </div>
      {!isAvatar && (
        <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 1000))} placeholder="Add a caption..."
          style={{ width: boxW, padding: '10px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: FONT, fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
      )}
      <div style={{ display: 'flex', gap: 10, width: boxW }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: 12, borderRadius: 13, border: '1.5px solid rgba(255,255,255,0.3)',
          background: 'transparent', color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
        }}>Cancel</button>
        <button onClick={confirm} disabled={saving} style={{
          flex: 1, padding: 12, borderRadius: 13, border: 'none', background: theme.coral, color: 'white',
          fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
        }}>{saving ? <Spinner size={14} /> : (isAvatar ? 'Use photo' : 'Done')}</button>
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
      await sendMessage(userId, profile.id, 'system', `Nickname updated to "${nickname.trim()}"`, null);
    } else {
      await supabase.from('contact_nicknames').delete().eq('owner_id', userId).eq('contact_id', profile.id);
      await sendMessage(userId, profile.id, 'system', 'Nickname removed', null);
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
      <div className="zchat-fire-ring" style={{ borderRadius: 31, padding: 3, width: '100%', maxWidth: 366, maxHeight: '89vh' }}>
      <div style={{
        background: theme.panelBg, borderRadius: 28,
        width: '100%', maxHeight: '100%', position: 'relative', overflowY: 'auto',
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
              <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: theme.panelBg, boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
            <div style={{ width: 92, height: 92, borderRadius: '50%', padding: 4, background: theme.panelBg, margin: '0 auto', boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <button onClick={save} disabled={saving || avatarUploading} style={{ ...primaryBtn(theme, saving || avatarUploading), marginTop: 0, flex: 1 }}>
                  {(saving || avatarUploading) ? <Spinner /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {(!isSelf && profile.is_private && followState !== 'accepted') ? (
                <div style={{ marginTop: 20, padding: '22px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', margin: '0 auto 10px', background: theme.rowBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted,
                  }}><Lock size={20} /></div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: theme.ink, marginBottom: 4 }}>This account is private</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>
                    Follow {profile.name} to see their followers, following, and profile details.
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
                  {(profile.gender || profile.age != null || profile.country || profile.bio) && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                      {profile.gender && (isSelf || !profile.hide_gender) && <span style={{ fontSize: 11, color: theme.ink, fontWeight: 600, background: theme.rowBg, padding: '3px 10px', borderRadius: 12 }}>{profile.gender}</span>}
                      {profile.age != null && (isSelf || !profile.hide_age) && <span style={{ fontSize: 11, color: theme.ink, fontWeight: 600, background: theme.rowBg, padding: '3px 10px', borderRadius: 12 }}>{profile.age} yrs</span>}
                      {profile.country && (isSelf || !profile.hide_country) && <span style={{ fontSize: 14, background: theme.rowBg, padding: '3px 10px', borderRadius: 12 }}>{countryFlag(profile.country)}</span>}
                    </div>
                  )}
                  {profile.bio && (isSelf || !profile.hide_bio) && (
                    <div style={{ fontSize: 12.5, color: theme.ink, marginTop: 10, lineHeight: 1.5, padding: '0 8px', textAlign: 'center' }}>{profile.bio}</div>
                  )}
                </>
              )}
              {isSelf && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
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
              {followState === 'accepted' && (
                <button onClick={() => onMessage(profile)} style={{
                  padding: '9px 22px', borderRadius: 22, border: 'none', background: theme.ink,
                  color: theme.dark ? '#121319' : 'white', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Send size={13} /> Message
                </button>
              )}
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
              <Ban size={15} />
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
      </div>
      {cropFile && <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={uploadCropped} />}
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
  if (status === 'sent') return <Check size={14} color={theme.muted} />;
  if (status === 'read') return <CheckCheck size={14} color={theme.coral} />;
  return <CheckCheck size={14} color={theme.muted} />;
}

const REACTION_EMOJIS = ['\u{2764}\u{FE0F}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F44D}', '\u{1F525}'];

const LINK_REGEX = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,:;!?'")\]]|[\w.+-]+@[\w-]+\.[\w.-]+)/gi;
function linkifyText(text) {
  if (!text) return text;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  LINK_REGEX.lastIndex = 0;
  while ((match = LINK_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const isEmail = token.includes('@') && !token.toLowerCase().startsWith('http') && !token.toLowerCase().startsWith('www.');
    const href = isEmail ? `mailto:${token}` : (token.toLowerCase().startsWith('http') ? token : `https://${token}`);
    parts.push(
      <a key={key++} href={href} target={isEmail ? undefined : '_blank'} rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>
        {token}
      </a>
    );
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

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
    </div>
  );
}

async function silentDownload(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function MessageBubble({ m, isMe, onDelete, selectionMode, selected, onToggleSelect, onLongPress, onOpenImage, onOpenVideo, reactions, onReact, onOpenWhoReacted, replyPreview, onSwipeReply, onJumpToMessage, highlighted, senderLabel, senderAvatar, hideReadStatus, onOpenSenderProfile, canModerate }) {
  const { theme, fontScale, chatTheme, bubbleColor } = useTheme();
  const [hover, setHover] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);
  const lastTapRef = useRef(0);
  const pressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const [dragX, setDragX] = useState(0);
  const draggingRef = useRef(false);
  const swipedPastThresholdRef = useRef(false);
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const bubbleColorSpec = BUBBLE_COLORS[bubbleColor] || BUBBLE_COLORS.default;

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

  const handleRowTap = (e) => {
    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
    if (selectionMode) { onToggleSelect(m.id); return; }
    const now = Date.now();
    if (now - lastTapRef.current < 350) {
      onReact(m.id, '\u2764\u{FE0F}');
      setBurstHeart(true);
      setTimeout(() => setBurstHeart(false), 650);
    } else if (m.type === 'image') {
      onOpenImage(m.media_url);
    } else if (m.type === 'video') {
      onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end });
    }
    lastTapRef.current = now;
  };

  const clearPressTimer = () => { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; setHover(false); };

  const handlePointerDown = (e) => {
    setHover(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    swipedPastThresholdRef.current = false;
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress(m.id);
    }, 350);
  };
  const handlePointerMove = (e) => {
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearPressTimer();
    if (!m.deleted && !selectionMode && Math.abs(dx) > Math.abs(dy) && dx > 0) {
      draggingRef.current = true;
      const clamped = Math.min(dx, 60);
      setDragX(clamped);
      swipedPastThresholdRef.current = clamped >= 40;
    }
  };
  const finalizeDrag = () => {
    clearPressTimer();
    if (draggingRef.current) {
      const shouldFire = swipedPastThresholdRef.current;
      draggingRef.current = false;
      setDragX(0);
      if (shouldFire) onSwipeReply(m);
    }
  };

  const bubbleBg = m.deleted ? theme.rowBg : (isMe ? (bubbleColorSpec.me || theme.bubbleMe) : (bubbleColorSpec.them || theme.bubbleThem));

  return (
    <div
      id={`msg-${m.id}`}
      style={{
        display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 8, marginBottom: 14,
        touchAction: 'pan-y', WebkitTapHighlightColor: 'transparent', overscrollBehaviorX: 'none', cursor: 'pointer',
        background: selected ? `${theme.coral}14` : highlighted ? `${theme.coral}22` : 'transparent',
        transition: 'background 0.3s ease',
        marginLeft: -18, marginRight: -18, paddingLeft: 18, paddingRight: 18, paddingTop: 2, paddingBottom: 2,
      }}
      onClick={handleRowTap}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finalizeDrag}
      onPointerCancel={finalizeDrag}
      onPointerLeave={finalizeDrag}
    >
      {selectionMode && (
        <div style={{
          width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected ? theme.coral : theme.border}`,
          background: selected ? theme.coral : 'transparent', flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
        }}>
          {selected && <Check size={12} color="white" />}
        </div>
      )}
      {isMe && !m.deleted && !selectionMode && (
        <Trash2 size={14} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, opacity: hover ? 1 : 0.35, transition: 'opacity 0.15s', marginTop: 4 }}
          onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} />
      )}
      {senderLabel && !m.deleted && (
        <div onClick={(e) => { e.stopPropagation(); onOpenSenderProfile && onOpenSenderProfile(); }} style={{ cursor: onOpenSenderProfile ? 'pointer' : 'default', flexShrink: 0 }}>
          <Avatar emoji={senderAvatar} name={senderLabel} size={26} />
        </div>
      )}
      <div style={{ position: 'relative', maxWidth: '72%' }}>
        {!selectionMode && !m.deleted && (
          <div style={{
            position: 'absolute', top: 10, left: -30, transform: 'translateY(-50%)',
            opacity: Math.min(1, dragX / 40), pointerEvents: 'none',
          }}>
            <Reply size={16} color={theme.coral} />
          </div>
        )}
        <div style={{ transform: `translateX(${dragX}px)`, transition: draggingRef.current ? 'none' : 'transform 0.2s ease' }}>
        <div style={{ position: 'relative' }}>
        <div style={glass(theme, {
          background: bubbleBg,
          borderRadius: 19,
          borderBottomRightRadius: isMe && !m.deleted ? 5 : 19,
          borderBottomLeftRadius: !isMe && !m.deleted ? 5 : 19,
          padding: m.type === 'text' || m.deleted ? '6px 11px' : 4,
          border: m.deleted ? `1px dashed ${theme.border}` : `1px solid ${theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          boxShadow: m.deleted ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
          ...(m.deleted ? {} : bubbleThemeStyle(chatTheme, isMe, theme)),
        })}>
          {senderLabel && !m.deleted && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.coralDeep, marginBottom: 3, padding: m.type !== 'text' ? '0 4px' : 0 }}>
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
            <div onClick={(e) => { e.stopPropagation(); onJumpToMessage && onJumpToMessage(replyPreview.id); }} style={{
              borderLeft: `3px solid ${theme.coral}`, background: 'rgba(0,0,0,0.05)', borderRadius: 6,
              padding: '4px 8px', marginBottom: 5, fontSize: 11.5, color: theme.muted, cursor: 'pointer',
            }}>
              <div style={{ fontWeight: 700, color: theme.coralDeep, fontSize: 10.5 }}>{replyPreview.senderLabel}</div>
              <div style={{ wordBreak: 'break-word', lineHeight: 1.35 }}>
                {replyPreview.type === 'text' ? replyPreview.content : replyPreview.type === 'image' ? 'Photo' : replyPreview.type === 'audio' ? 'Voice message' : replyPreview.type === 'sticker' ? 'Sticker' : 'Video'}
              </div>
            </div>
          )}
          {m.deleted ? (
            <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>This message was deleted</div>
          ) : (
            <>
              {m.type === 'image' && (
                <div style={{ position: 'relative', width: 220, height: 220, borderRadius: 14, overflow: 'hidden', marginBottom: m.content ? 4 : 2 }}>
                  <img src={m.media_url} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div onClick={(e) => { e.stopPropagation(); silentDownload(m.media_url, 'zchat-photo.jpg'); }} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}><Download size={13} color="white" /></div>
                </div>
              )}
              {m.type === 'video' && (
                <div onClick={(e) => { e.stopPropagation(); onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end }); }} style={{ position: 'relative', width: 220, height: 220, borderRadius: 14, overflow: 'hidden', marginBottom: m.content ? 4 : 2, background: '#000', cursor: 'pointer' }}>
                  <video src={m.media_url} preload="metadata" onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                    background: 'rgba(0,0,0,0.18)',
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={20} color="white" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); silentDownload(m.media_url, 'zchat-video.mp4'); }} style={{
                    position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}><Download size={13} color="white" /></div>
                </div>
              )}
              {m.type === 'audio' && <AudioBubble url={m.media_url} isMe={isMe} />}
              {m.type === 'sticker' && (
                m.content && m.content.startsWith('/') ? (
                  <img src={m.content} alt="sticker" className="zchat-wave-pop" onContextMenu={(e) => e.preventDefault()} draggable={false}
                    style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }} />
                ) : (
                  <div className="zchat-wave-pop" style={{ fontSize: 64, lineHeight: 1, padding: '4px 10px' }}>{m.content}</div>
                )
              )}
              {m.type === 'text' && m.content && <div style={{ fontSize: 15 * fontScale, color: theme.ink, wordBreak: 'break-word', lineHeight: 1.32 }}>{linkifyText(m.content)}</div>}
            </>
          )}
        </div>
        {groupedEntries.length > 0 && !m.deleted && (
          <div onClick={(e) => { e.stopPropagation(); onOpenWhoReacted(m.id); }} style={{
            position: 'absolute', bottom: -10, [isMe ? 'left' : 'right']: 6, cursor: 'pointer',
            background: theme.panelBg, borderRadius: 10, padding: '1px 6px', fontSize: 10.5,
            display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', zIndex: 1,
          }}>
            {groupedEntries.map(([emoji, count]) => <span key={emoji}>{emoji}{count > 1 ? count : ''}</span>)}
          </div>
        )}
        {burstHeart && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44, pointerEvents: 'none', animation: 'zchat-heart-burst 0.6s ease',
          }}>{'\u2764\u{FE0F}'}</div>
        )}
        </div>
        {!m.deleted && (
          <div style={{
            display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'center', gap: 3,
            marginTop: groupedEntries.length > 0 ? 10 : 2, padding: isMe ? '0 3px 0 0' : '0 0 0 3px',
          }}>
            {m.edited && <span style={{ fontSize: 8.5, color: theme.muted, fontStyle: 'italic' }}>edited</span>}
            <span style={{ fontSize: 9.5, color: theme.muted }}>{time}</span>
            {isMe && <StatusTicks status={(!hideReadStatus && m.read) ? 'read' : m.delivered ? 'delivered' : 'sent'} />}
          </div>
        )}
        </div>
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
function playReactionPing() {
  try {
    if (localStorage.getItem('zchat-reaction-sound') === 'off') return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 1320;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.13, ctx.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.18);
  } catch {}
}

function pairKey(a, b) { return a < b ? [a, b] : [b, a]; }


function ImageViewer({ url, onClose, onForward, onReport }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} className="zchat-fade">
      <div onClick={onClose} style={{
        position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', left: 18, width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
      }}><X size={18} color="white" /></div>
      <div style={{ position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', right: 18, zIndex: 2 }}>
        <div onClick={() => setMenuOpen((s) => !s)} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><MoreVertical size={18} color="white" /></div>
        {menuOpen && (
          <div style={{ position: 'absolute', top: 44, right: 0, background: 'white', borderRadius: 14, overflow: 'hidden', width: 180, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <div onClick={() => { silentDownload(url, 'zchat-photo.jpg'); setMenuOpen(false); }} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#1B1B1F', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Save to gallery</div>
            <div onClick={() => { setMenuOpen(false); onForward(); }} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#1B1B1F', cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>Forward</div>
            <div onClick={() => { setMenuOpen(false); onReport(); }} style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#FF4D5E', cursor: 'pointer' }}>Report</div>
          </div>
        )}
      </div>
      <img src={url} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
    </div>
  );
}

function VideoViewer({ url, trimStart, trimEnd, onClose, onForward }) {
  const videoRef = useRef(null);
  const seekedRef = useRef(false);
  const onLoadedMetadata = (e) => {
    if (trimStart && !seekedRef.current) { e.target.currentTime = trimStart; seekedRef.current = true; }
  };
  const onTimeUpdate = (e) => {
    if (trimEnd && e.target.currentTime >= trimEnd) {
      e.target.pause();
      e.target.currentTime = trimStart || 0;
    }
  };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }} className="zchat-fade">
      <div onClick={onClose} style={{
        position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', left: 18, width: 36, height: 36, borderRadius: '50%',
        background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
      }}><X size={18} color="white" /></div>
      <div style={{ position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', right: 18, display: 'flex', gap: 10, zIndex: 2 }}>
        <div onClick={() => silentDownload(url, 'zchat-video.mp4')} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Download size={17} color="white" /></div>
        <div onClick={onForward} style={{
          width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Forward size={17} color="white" /></div>
      </div>
      <video ref={videoRef} src={url} controls autoPlay playsInline onContextMenu={(e) => e.preventDefault()} onLoadedMetadata={onLoadedMetadata} onTimeUpdate={onTimeUpdate}
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
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


function ReportMessageModal({ onCancel, onSubmit, title = 'Report message' }) {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 90,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 12 }}>{title}</div>
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
          Your conversation with {name} will be cleared from your list. If they message you again, it'll start fresh.
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

function AccountGoneModal({ name, onOk }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 24,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 280, textAlign: 'center' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', margin: '0 auto 14px', background: theme.rowBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted,
        }}><User size={22} /></div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: theme.ink }}>Account not found</div>
        <div style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.5, color: theme.muted }}>
          {name}'s account no longer exists.
        </div>
        <button onClick={onOk} style={{
          width: '100%', padding: 11, borderRadius: 13, border: 'none', background: theme.coral,
          color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
        }}>OK</button>
      </div>
    </div>
  );
}


function DeleteMessageConfirm({ onCancel, onConfirm }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.45)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 92, padding: 24,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 20, padding: '24px 22px', width: '100%', maxWidth: 280, textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6, color: theme.ink }}>Delete this message?</div>
        <div style={{ fontSize: 12.5, marginBottom: 20, lineHeight: 1.5, color: theme.muted }}>
          This can't be undone.
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

function VideoTrimEditor({ file, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [caption, setCaption] = useState('');
  const [dragging, setDragging] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const onLoadedMetadata = (e) => {
    const d = e.target.duration;
    setDuration(d);
    setEnd(d);
  };

  const pctFromEvent = (clientX) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };
  const handleMove = (clientX) => {
    if (!dragging || !duration) return;
    const t = pctFromEvent(clientX) * duration;
    if (dragging === 'start') setStart(Math.min(t, end - 0.5));
    else setEnd(Math.max(t, start + 0.5));
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const trimmedTooShort = duration > 0 && end - start < 1;

  if (!url) {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90 }}>
        <Spinner size={26} color="white" />
      </div>
    );
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 20, paddingTop: 'calc(20px + env(safe-area-inset-top))' }}
      className="zchat-fade"
      onMouseMove={(e) => handleMove(e.clientX)} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)} onTouchEnd={() => setDragging(null)}
    >
      <div onClick={onCancel} style={{
        position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 16, width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2,
      }}><X size={18} color="white" /></div>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 14 }}>Trim video</div>
      <video src={url} onLoadedMetadata={onLoadedMetadata} controls playsInline onContextMenu={(e) => e.preventDefault()}
        style={{ width: 280, maxHeight: 340, borderRadius: 16, marginBottom: 16, background: '#000' }} />
      {duration > 0 && (
        <>
          <div ref={barRef} style={{ position: 'relative', width: 280, height: 30, marginBottom: 6 }}>
            <div style={{ position: 'absolute', top: 11, left: 0, right: 0, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{
              position: 'absolute', top: 11, height: 8, borderRadius: 4, background: theme.coral,
              left: `${(start / duration) * 100}%`, width: `${((end - start) / duration) * 100}%`,
            }} />
            <div onMouseDown={(e) => { e.stopPropagation(); setDragging('start'); }} onTouchStart={(e) => { e.stopPropagation(); setDragging('start'); }} style={{
              position: 'absolute', top: 1, left: `calc(${(start / duration) * 100}% - 11px)`, width: 22, height: 22, borderRadius: '50%',
              background: 'white', border: `3px solid ${theme.coral}`, cursor: 'grab', touchAction: 'none',
            }} />
            <div onMouseDown={(e) => { e.stopPropagation(); setDragging('end'); }} onTouchStart={(e) => { e.stopPropagation(); setDragging('end'); }} style={{
              position: 'absolute', top: 1, left: `calc(${(end / duration) * 100}% - 11px)`, width: 22, height: 22, borderRadius: '50%',
              background: 'white', border: `3px solid ${theme.coral}`, cursor: 'grab', touchAction: 'none',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: 280, fontSize: 11.5, color: 'rgba(255,255,255,0.8)', marginBottom: 14 }}>
            <span>{fmt(start)}</span>
            <span>{fmt(end - start)} selected</span>
            <span>{fmt(end)}</span>
          </div>
        </>
      )}
      <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 1000))} placeholder="Add a caption..."
        style={{ width: 280, padding: '10px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: 'white', fontFamily: FONT, fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 10, width: 280 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: 12, borderRadius: 13, border: '1.5px solid rgba(255,255,255,0.3)',
          background: 'transparent', color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT,
        }}>Cancel</button>
        <button onClick={() => onConfirm(file, url, start, end, caption.trim())} disabled={trimmedTooShort} style={{
          flex: 1, padding: 12, borderRadius: 13, border: 'none', background: theme.coral, color: 'white',
          fontWeight: 700, fontSize: 13.5, cursor: trimmedTooShort ? 'default' : 'pointer', fontFamily: FONT, opacity: trimmedTooShort ? 0.5 : 1,
        }}>{trimmedTooShort ? 'Too short' : 'Done'}</button>
      </div>
    </div>
  );
}

const PREFETCH_ASSET_VERSION = 'v2';
function useAssetPrefetch() {
  const [progress, setProgress] = useState(null);
  useEffect(() => {
    const doneKey = 'zchat-assets-cached-' + PREFETCH_ASSET_VERSION;
    try { if (localStorage.getItem(doneKey) === '1') return; } catch {}
    const urls = [...NAME_BAR_PRESETS.map((p) => p.file), '/chat-bg.jpg'];
    let done = 0;
    let cancelled = false;
    setProgress({ done: 0, total: urls.length });
    Promise.all(urls.map((url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        done += 1;
        if (!cancelled) setProgress({ done, total: urls.length });
        resolve();
      };
      img.src = url;
    }))).then(() => {
      if (cancelled) return;
      try { localStorage.setItem(doneKey, '1'); } catch {}
      setTimeout(() => { if (!cancelled) setProgress(null); }, 600);
    });
    return () => { cancelled = true; };
  }, []);
  return progress;
}

function AssetDownloadBar({ progress }) {
  const { theme } = useTheme();
  if (!progress) return null;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 15,
      background: theme.panelBg, borderRadius: 14, padding: '8px 14px', boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 210, border: `1px solid ${theme.border}`,
    }} className="zchat-fade">
      <Spinner size={13} color={theme.coral} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: theme.ink, marginBottom: 3 }}>Downloading theme assets {progress.done}/{progress.total}</div>
        <div style={{ height: 4, borderRadius: 2, background: theme.rowBg, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: theme.coral, borderRadius: 2, transition: 'width 0.2s' }} />
        </div>
      </div>
    </div>
  );
}

function NotificationHelpModal({ onClose }) {
  const { theme } = useTheme();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const steps = isIOS
    ? ['Open the iPhone Settings app', 'Scroll down and tap Safari (or Chrome)', 'Tap Notifications', 'Find ZChat and turn it on']
    : isAndroid
      ? ['Tap the lock or info icon next to the web address', 'Tap Permissions (or Site settings)', 'Turn Notifications on', 'Reload the page']
      : ['Click the lock or info icon next to the web address', 'Find Notifications in the site settings', 'Change it to Allow', 'Reload the page'];
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 97,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 6 }}>Turn notifications back on</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Notifications were blocked for ZChat. Since your browser controls this permission, ZChat can't turn it back on for you, but here's how:
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, marginBottom: 18 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontSize: 12.5, color: theme.ink, marginBottom: 6, lineHeight: 1.4 }}>{s}</li>
          ))}
        </ol>
        <button onClick={onClose} style={primaryBtn(theme, false)}>Got it</button>
      </div>
    </div>
  );
}

function NotificationPermissionBanner({ onOpenHelp, onDismiss, top }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', top, left: 10, right: 10, zIndex: 14, maxWidth: 340, margin: '0 auto',
      background: theme.panelBg, borderRadius: 14, padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10,
    }} className="zchat-fade">
      <Bell size={16} color={theme.danger} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 11, color: theme.ink, fontWeight: 600 }}>Notifications are off for ZChat</div>
      <span onClick={onOpenHelp} style={{ fontSize: 11.5, color: theme.coral, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Fix</span>
      <X size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onDismiss} />
    </div>
  );
}

function InstallAppBanner({ onOpenHelp, onInstallNow, canInstallDirectly, onDismiss, top }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'absolute', top, left: 10, right: 10, zIndex: 14, maxWidth: 340, margin: '0 auto',
      background: theme.panelBg, borderRadius: 14, padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10,
    }} className="zchat-fade">
      <Download size={16} color={theme.coral} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 11, color: theme.ink, fontWeight: 600 }}>Install ZChat on your home screen</div>
      <span onClick={canInstallDirectly ? onInstallNow : onOpenHelp} style={{ fontSize: 11.5, color: theme.coral, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Install</span>
      <X size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onDismiss} />
    </div>
  );
}

function InstallAppHelpModal({ onClose }) {
  const { theme } = useTheme();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const steps = isIOS
    ? ['Tap the Share icon at the bottom of Safari (the square with an arrow)', 'Scroll down and tap "Add to Home Screen"', 'Tap "Add" in the top right', 'ZChat now opens full-screen from your home screen, just like any other app']
    : ['Tap the 3-dot menu in the top right of your browser', 'Tap "Add to Home screen" or "Install app"', 'Confirm by tapping "Add" or "Install"', 'ZChat now opens full-screen from your home screen, just like any other app'];
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 97,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 6 }}>Install ZChat</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Add ZChat to your home screen so it opens instantly, full-screen, with no browser bar -- exactly like an app you installed from a store.
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, marginBottom: 18 }}>
          {steps.map((s, i) => (
            <li key={i} style={{ fontSize: 12.5, color: theme.ink, marginBottom: 6, lineHeight: 1.4 }}>{s}</li>
          ))}
        </ol>
        <button onClick={onClose} style={primaryBtn(theme, false)}>Got it</button>
      </div>
    </div>
  );
}

function SmartMenu({ anchorEl, open, onClose, children, width = 170 }) {
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!open || !anchorEl) { setPos(null); return; }
    const compute = () => {
      const r = anchorEl.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const estHeight = 170;
      let top = r.bottom + 6;
      if (top + estHeight > vh - 8) top = Math.max(8, r.top - estHeight - 6);
      let left = r.right - width;
      if (left < 8) left = 8;
      if (left + width > vw - 8) left = vw - width - 8;
      setPos({ top, left });
    };
    compute();
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', onClose, true);
    return () => { window.removeEventListener('resize', compute); window.removeEventListener('scroll', onClose, true); };
  }, [open, anchorEl, onClose]);

  if (!open || !pos) return null;
  return ReactDOM.createPortal(
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
      <div style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 999 }} onClick={(e) => e.stopPropagation()} className="zchat-fade">
        {children}
      </div>
    </>,
    document.body
  );
}

function ChatApp({ session, onLogout, onNeedsProfile, savedAccounts, onSwitchAccount, onAddAccount, onRemoveAccount, switchingAccountId }) {
  const { theme, bgPatternOn, chatTheme } = useTheme();
  const assetProgress = useAssetPrefetch();
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(() => {
    try { return sessionStorage.getItem('zchat-notif-banner-dismissed') === '1'; } catch { return false; }
  });
  const [showNotifHelp, setShowNotifHelp] = useState(false);
  useEffect(() => {
    const check = () => { if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission); };
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => { document.removeEventListener('visibilitychange', check); window.removeEventListener('focus', check); };
  }, []);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    try { return localStorage.getItem('zchat-install-banner-dismissed') === '1'; } catch { return false; }
  });
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator.standalone === true;
    setIsStandaloneApp(!!standalone);
    const onBeforeInstall = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);
  const handleInstallNow = async () => {
    if (!deferredInstallPrompt) { setShowInstallHelp(true); return; }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
  };
  const [me, setMe] = useState(null);
  const [profileCheckFailed, setProfileCheckFailed] = useState(false);
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [profileOf, setProfileOf] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoOpenLockSetup, setAutoOpenLockSetup] = useState(false);
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
  const [viewerVideoUrl, setViewerVideoUrl] = useState(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardTargets, setForwardTargets] = useState([]);
  const [reportModalFor, setReportModalFor] = useState(null);
  const [deleteConvoTarget, setDeleteConvoTarget] = useState(null);
  const [rowMenuFor, setRowMenuFor] = useState(null);
  const [rowMenuAnchor, setRowMenuAnchor] = useState(null);
  const [groupRowMenuFor, setGroupRowMenuFor] = useState(null);
  const [groupRowMenuAnchor, setGroupRowMenuAnchor] = useState(null);
  const [messageLikes, setMessageLikes] = useState({});
  const [typingFrom, setTypingFrom] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [contextMenuFor, setContextMenuFor] = useState(null);
  const [pendingQuickDelete, setPendingQuickDelete] = useState(null);
  const [pendingForwardItems, setPendingForwardItems] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [photoEditQueue, setPhotoEditQueue] = useState([]);
  const [videoEditQueue, setVideoEditQueue] = useState([]);
  const [activeFollowState, setActiveFollowState] = useState('none');
  const [activeFollowBusy, setActiveFollowBusy] = useState(false);
  const [activeFollowerFollowsMe, setActiveFollowerFollowsMe] = useState(false);
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
  const [deletedAccountAlertFor, setDeletedAccountAlertFor] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const highlightTimerRef = useRef(null);
  const jumpToMessage = (id) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedMsgId(id);
    clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedMsgId(null), 1400);
  };
  const [refreshing, setRefreshing] = useState(false);
  const pullStartYRef = useRef(null);
  const sidebarListRef = useRef(null);
  const chatScrollPositions = useRef({});
  const lastScrollKeyRef = useRef(null);
  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const searchTimer = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const recordStartRef = useRef(0);
  const pendingStopRef = useRef(false);
  const [unreadCounts, setUnreadCounts] = useState({});

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
  const unhideChatLocally = (convId) => {
    const cur = getHiddenChatIds();
    if (!cur.has(convId)) return;
    cur.delete(convId);
    try { localStorage.setItem(hiddenChatsKey(), JSON.stringify([...cur])); } catch {}
  };

  const readKey = (convId) => `zchat-read-${session.user.id}-${convId}`;
  const markRead = (convId) => { try { localStorage.setItem(readKey(convId), Date.now().toString()); } catch {} };
  const isUnread = (conv) => (unreadCounts[conv.otherProfile.id] || 0) > 0;
  /* Presence via the realtime channel can miss people briefly (a missed sync
     event, a reconnect, etc), especially on Android. Fall back to last_seen:
     anyone whose heartbeat landed in the last 60s (heartbeat interval is 45s)
     counts as online even if the presence channel hasn't caught up. */
  const isUserOnline = (profile) => {
    if (!profile) return false;
    if (onlineIds.has(profile.id)) return true;
    if (profile.last_seen) {
      const age = Date.now() - new Date(profile.last_seen).getTime();
      if (age >= 0 && age < 60000) return true;
    }
    return false;
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
    const { error } = await supabase.from('conversations').update({ wallpaper_a: key, wallpaper_b: key }).eq('id', conv.id);
    if (error) { alert('Could not change wallpaper: ' + error.message); return; }
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, wallpaper_a: key, wallpaper_b: key } : c)));
    const label = key ? (WALLPAPER_PRESETS.find((p) => p.key === key)?.label || key) : 'Default';
    await sendMessage(session.user.id, conv.otherProfile.id, 'system', `Wallpaper changed to ${label}`, null);
    await upsertConversation(conv.otherProfile.id, `Wallpaper changed to ${label}`, 'system');
    loadConversations();
  };

  const setNameBar = async (conv, key) => {
    const { error } = await supabase.from('conversations').update({ name_bar: key }).eq('id', conv.id);
    if (error) { alert('Could not change header style: ' + error.message); return; }
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, name_bar: key } : c)));
    const label = key ? (NAME_BAR_PRESETS.find((p) => p.key === key)?.label || key) : 'None';
    await sendMessage(session.user.id, conv.otherProfile.id, 'system', `Header style changed to ${label}`, null);
    await upsertConversation(conv.otherProfile.id, `Header style changed to ${label}`, 'system');
    loadConversations();
  };

  const setGroupWallpaper = async (key) => {
    if (!activeGroup || groupMembers.find((gm) => gm.user_id === session.user.id)?.role !== 'admin') return;
    const { error } = await supabase.from('groups').update({ wallpaper: key }).eq('id', activeGroup.id);
    if (error) { alert('Could not change wallpaper: ' + error.message); return; }
    setActiveGroup((prev) => ({ ...prev, wallpaper: key }));
    const label = key ? (WALLPAPER_PRESETS.find((p) => p.key === key)?.label || key) : 'Default';
    sendGroupMessage('system', `${realName(session.user.id)} changed the wallpaper to ${label}`, null);
    loadGroups();
  };

  const setGroupHeaderStyle = async (key) => {
    if (!activeGroup || groupMembers.find((gm) => gm.user_id === session.user.id)?.role !== 'admin') return;
    const { error } = await supabase.from('groups').update({ name_bar: key }).eq('id', activeGroup.id);
    if (error) { alert('Could not change header style: ' + error.message); return; }
    setActiveGroup((prev) => ({ ...prev, name_bar: key }));
    const label = key ? (NAME_BAR_PRESETS.find((p) => p.key === key)?.label || key) : 'None';
    sendGroupMessage('system', `${realName(session.user.id)} changed the header style to ${label}`, null);
    loadGroups();
  };

  const loadMyLocks = async () => {
    const { data } = await supabase.from('chat_locks').select('*').eq('owner_id', session.user.id);
    const map = {};
    (data || []).forEach((l) => { map[l.conversation_id] = true; });
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

  const enableChatLock = async (conv) => {
    if (!me?.chat_lock_hash) return;
    await supabase.from('chat_locks').upsert({ conversation_id: conv.id, owner_id: session.user.id, pin_hash: 'master' }, { onConflict: 'conversation_id,owner_id' });
    setMyLocks((prev) => ({ ...prev, [conv.id]: true }));
    /* Locking a chat must re-lock it immediately -- it should NOT be added to
       unlockedChats here (that used to make every newly-locked chat silently
       stay "unlocked" for the rest of the session, so the PIN prompt never
       showed again until the app was reloaded). If you're actively looking at
       this chat when you lock it, back out of it right away so the content
       isn't left on screen. */
    setUnlockedChats((prev) => { const n = new Set(prev); n.delete(conv.id); return n; });
    if (activeProfile?.id === conv.otherProfile.id) {
      setActiveProfile(null);
      setMobileShowChat(false);
      setMessages([]);
    }
  };
  const disableChatLock = async (conv) => {
    await supabase.from('chat_locks').delete().eq('conversation_id', conv.id).eq('owner_id', session.user.id);
    setMyLocks((prev) => { const n = { ...prev }; delete n[conv.id]; return n; });
  };
  const setChatLockPassword = async (pin) => {
    const hash = await hashPin(pin);
    await supabase.from('profiles').update({ chat_lock_hash: hash, chat_lock_enabled: true }).eq('id', session.user.id);
    setMe((p) => ({ ...p, chat_lock_hash: hash, chat_lock_enabled: true }));
  };
  const turnOffChatLock = async () => {
    await supabase.from('profiles').update({ chat_lock_hash: null, chat_lock_enabled: false }).eq('id', session.user.id);
    await supabase.from('chat_locks').delete().eq('owner_id', session.user.id);
    setMe((p) => ({ ...p, chat_lock_hash: null, chat_lock_enabled: false }));
    setMyLocks({});
  };

  const loadUnreadCounts = async () => {
    const { data } = await supabase.from('messages').select('sender_id')
      .eq('receiver_id', session.user.id).eq('read', false).not('deleted', 'is', true);
    const map = {};
    (data || []).forEach((m) => { map[m.sender_id] = (map[m.sender_id] || 0) + 1; });
    setUnreadCounts(map);
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
    const { data: aliasesForMe } = await supabase.from('self_aliases').select('*').eq('viewer_id', session.user.id);
    const { data: myLastMsgs } = await supabase.from('messages').select('receiver_id, read, delivered, created_at')
      .eq('sender_id', session.user.id).in('receiver_id', otherIds.length ? otherIds : ['00000000-0000-0000-0000-000000000000'])
      .order('created_at', { ascending: false });
    const lastMineByReceiver = {};
    (myLastMsgs || []).forEach((m) => { if (!lastMineByReceiver[m.receiver_id]) lastMineByReceiver[m.receiver_id] = m; });
    const mergedAll = visible
      .map((c) => {
        const otherId = c.user_a === session.user.id ? c.user_b : c.user_a;
        if (myBlockedIds.has(otherId)) return null;
        const profile = profs?.find((p) => p.id === otherId);
        const nick = nicks?.find((n) => n.contact_id === otherId);
        const theirAlias = aliasesForMe?.find((a) => a.user_id === otherId);
        const baseName = theirAlias ? theirAlias.alias : profile?.name;
        if (!profile) return null;
        const lastMine = lastMineByReceiver[otherId];
        return {
          ...c, otherProfile: nick ? { ...profile, name: nick.nickname } : { ...profile, name: baseName }, realName: profile.name,
          lastMineRead: lastMine?.read || false, lastMineDelivered: lastMine?.delivered || false,
        };
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
    const preview = type === 'text' ? text
      : type === 'image' ? 'Photo'
      : type === 'audio' ? 'Voice message'
      : type === 'sticker' ? 'Sticker'
      : type === 'system' ? text
      : 'Video';
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
        setProfileCheckFailed(true);
      })
      .catch(() => { if (!cancelled) setProfileCheckFailed(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (profileCheckFailed) onNeedsProfile();
  }, [profileCheckFailed]);

  useEffect(() => {
    if (me) { loadConversations(); loadUnreadCounts(); loadMyLocks(); loadGroups(); loadMyBlocks(); subscribeToPush(session.user.id); loadFollowRequestCount(); supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id); }
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
        unhideChatLocally(pairKey(me.id, msg.sender_id).join('-'));
        if (msg.sender_id !== activeProfile?.id || !mobileShowChatRef.current) { playPing(); supabase.from('messages').update({ delivered: true }).eq('id', msg.id); }
        else supabase.from('messages').update({ read: true, delivered: true }).eq('id', msg.id);
        loadUnreadCounts();
        loadConversations();
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
        /* This has to fire for messages where I'm either side of the conversation --
           it was only updating when I was the sender, which is why deleting or editing
           a message never reached the OTHER person live; they only saw it after leaving
           and reopening the chat, which re-fetches everything fresh from the server. */
        if (row.sender_id === me.id || row.receiver_id === me.id) {
          setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, read: row.read, delivered: row.delivered, edited: row.edited, deleted: row.deleted, content: row.deleted ? m.content : row.content } : m)));
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
        const targetMsg = findMessageById(msgId);
        if (!targetMsg) return;
        if (payload.eventType === 'INSERT' && row.user_id !== me.id && targetMsg.sender_id === me.id) playReactionPing();
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
        if (activeProfile && row.id === activeProfile.id) setActiveProfile((prev) => ({ ...prev, ...row, name: prev.name }));
        setProfileOf((prev) => (prev && prev.id === row.id ? { ...prev, ...row, name: prev.name } : prev));
        setConversations((prev) => prev.map((c) => (c.otherProfile.id === row.id ? { ...c, otherProfile: { ...c.otherProfile, ...row, name: c.otherProfile.name }, realName: row.name } : c)));
        setArchivedConversations((prev) => prev.map((c) => (c.otherProfile.id === row.id ? { ...c, otherProfile: { ...c.otherProfile, ...row, name: c.otherProfile.name }, realName: row.name } : c)));
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
        if (row.sender_id !== me.id && (!activeGroup || row.group_id !== activeGroup.id)) { playPing(); supabase.from('messages').update({ delivered: true }).eq('id', row.id); }
        if (row.sender_id !== me.id && activeGroup && row.group_id === activeGroup.id) { supabase.from('messages').update({ read: true, delivered: true }).eq('id', row.id); }
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

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const mobileShowChatRef = useRef(mobileShowChat);
  useEffect(() => { mobileShowChatRef.current = mobileShowChat; }, [mobileShowChat]);

  useEffect(() => {
    if (composerRef.current && draft === '') {
      composerRef.current.style.height = 'auto';
    }
  }, [draft]);

  useEffect(() => {
    /* Populating the draft programmatically (tapping Edit on a message, or a
       forwarded caption) doesn't fire the textarea's own onChange handler, so the
       auto-grow logic there never runs -- a long message being edited would stay
       squashed into one line instead of expanding to show it. */
    if (composerRef.current && editingMessage) {
      const el = composerRef.current;
      requestAnimationFrame(() => {
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 110) + 'px';
      });
    }
  }, [editingMessage]);

  useEffect(() => {
    if (!profileOf || profileOf.id === me?.id) return;
    let cancelled = false;
    getProfile(profileOf.id).then(({ data }) => {
      if (!cancelled && data) setProfileOf((prev) => (prev && prev.id === data.id ? { ...prev, ...sanitizeAvatar(data, session.user.id), name: prev.name } : prev));
    });
    return () => { cancelled = true; };
  }, [profileOf?.id]);

  useEffect(() => {
    if (!activeProfile) return;
    const poll = setInterval(async () => {
      const currentMessages = messagesRef.current;
      const myIds = currentMessages.filter((m) => m.sender_id === session.user.id && !m.deleted).map((m) => m.id);
      if (myIds.length) {
        const { data } = await supabase.from('messages').select('id, read, delivered').in('id', myIds);
        if (data) {
          setMessages((prev) => prev.map((m) => {
            const fresh = data.find((d) => d.id === m.id);
            return fresh ? { ...m, read: fresh.read, delivered: fresh.delivered } : m;
          }));
        }
      }
      if (!mobileShowChatRef.current) return;
      const theirUnreadIds = currentMessages.filter((m) => m.sender_id === activeProfile.id && !m.read).map((m) => m.id);
      if (theirUnreadIds.length) {
        await supabase.from('messages').update({ read: true, delivered: true }).in('id', theirUnreadIds);
        setMessages((prev) => prev.map((m) => (theirUnreadIds.includes(m.id) ? { ...m, read: true, delivered: true } : m)));
        loadUnreadCounts();
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [activeProfile]);

  useEffect(() => {
    const key = activeGroup?.id || activeProfile?.id;
    if (!key || loadingConvo) return;
    const el = scrollRef.current;
    if (!el) return;
    const isNewConversation = lastScrollKeyRef.current !== key;
    const t = setTimeout(() => {
      if (isNewConversation) {
        /* Just opened this chat -- resume where you left off last time
           instead of always jumping to the newest message, unless this
           is the first time you've opened it this session. */
        const saved = chatScrollPositions.current[key];
        el.scrollTop = (saved != null) ? saved : el.scrollHeight;
        lastScrollKeyRef.current = key;
      } else {
        /* Already in this chat and a new message came in -- only snap to
           the bottom if you were already near it, so a new message doesn't
           yank you away from something you were reading further up. */
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceFromBottom < 200) el.scrollTop = el.scrollHeight;
      }
    }, 30);
    return () => clearTimeout(t);
  }, [messages.length, activeProfile, activeGroup, loadingConvo]);

  const handleChatScroll = () => {
    const key = activeGroup?.id || activeProfile?.id;
    if (key && scrollRef.current) chatScrollPositions.current[key] = scrollRef.current.scrollTop;
  };

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
      return { ...g, myRole: mine?.role || 'member', pinned: mine?.pinned || false, archived: mine?.archived || false, last_message: last?.content, last_message_type: last?.type, last_message_at: last?.created_at || g.created_at };
    }).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    setGroups(merged);
  };

  const toggleGroupPin = async (g) => {
    await supabase.from('group_members').update({ pinned: !g.pinned }).eq('group_id', g.id).eq('user_id', session.user.id);
    loadGroups();
  };
  const toggleGroupArchive = async (g) => {
    await supabase.from('group_members').update({ archived: !g.archived }).eq('group_id', g.id).eq('user_id', session.user.id);
    loadGroups();
  };
  const leaveGroupById = async (g) => {
    const name = realName(session.user.id);
    await supabase.from('group_members').delete().eq('group_id', g.id).eq('user_id', session.user.id);
    await supabase.from('messages').insert({ sender_id: session.user.id, group_id: g.id, type: 'system', content: `${name} left the group` });
    if (activeGroup?.id === g.id) { setActiveGroup(null); setMobileShowChat(false); }
    loadGroups();
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
        const preview = type === 'text' ? content : type === 'image' ? 'Photo' : type === 'audio' ? 'Voice message' : type === 'sticker' ? 'Sticker' : 'Video';
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
    const { data: freshCheck } = await getProfile(profile.id);
    if (freshCheck?.is_deleted) {
      setDeletedAccountAlertFor(profile.name || 'This person');
      return;
    }
    if (convId) {
      /* Check the locally-cached lock map first (instant, and not dependent on
         a fresh round-trip succeeding) and fall back to a live DB check in case
         the chat was locked elsewhere and myLocks hasn't caught up yet. Either
         one finding a lock is enough to require the PIN. */
      let isLocked = !!myLocks[convId];
      if (!isLocked) {
        const { data: lockRow } = await supabase.from('chat_locks').select('conversation_id').eq('conversation_id', convId).eq('owner_id', session.user.id).maybeSingle();
        isLocked = !!lockRow;
      }
      if (isLocked && !unlockedChats.has(convId)) {
        setLockPromptFor({ profile, convId });
        return;
      }
    }
    setActiveProfile(profile);
    getProfile(profile.id).then(({ data }) => {
      if (data) setActiveProfile((prev) => (prev && prev.id === data.id ? { ...prev, ...sanitizeAvatar(data, session.user.id), name: prev.name } : prev));
    });
    setActiveFollowState(null);
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
    const { data: theyFollowMeRow } = await supabase.from('follows').select('status').eq('follower_id', profile.id).eq('following_id', session.user.id).eq('status', 'accepted').maybeSingle();
    setActiveFollowerFollowsMe(!!theyFollowMeRow);
    const { data } = await getConversation(session.user.id, profile.id);
    const hidden = getHiddenMsgIds();
    const visible = (data || []).filter((m) => !hidden.has(m.id));
    setMessages(visible);
    setLoadingConvo(false);
    const unreadIds = visible.filter((m) => m.sender_id === profile.id && !m.read).map((m) => m.id);
    if (unreadIds.length) {
      await supabase.from('messages').update({ read: true, delivered: true }).in('id', unreadIds);
      setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true, delivered: true } : m)));
      loadUnreadCounts();
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
  const activeConvForBar = activeProfile ? (conversations.find((c) => c.otherProfile.id === activeProfile.id) || archivedConversations.find((c) => c.otherProfile.id === activeProfile.id)) : null;
  const activeConvNameBar = activeConvForBar?.name_bar || null;
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

  const sendSticker = async (sticker) => {
    setShowStickers(false);
    if (!activeProfile && !activeGroup) return;
    const filePath = sticker.file;
    if (activeGroup) {
      await sendGroupMessage('sticker', filePath, null);
      return;
    }
    const { data } = await sendMessage(session.user.id, activeProfile.id, 'sticker', filePath, null);
    if (data) {
      setMessages((prev) => [...prev, data]);
      upsertConversation(activeProfile.id, filePath, 'sticker');
      sendPushNotification(activeProfile.id, me.name, 'Sticker', `/?dm=${session.user.id}`, me.avatar);
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
          let insertedRow = null;
          if (activeGroup) {
            insertedRow = await sendGroupMessage(items[i].kind, captionForThis, url);
          } else {
            const { data } = await sendMessage(session.user.id, activeProfile.id, items[i].kind, captionForThis, url);
            insertedRow = data;
            if (data) {
              setMessages((prev) => [...prev, data]);
              sendPushNotification(activeProfile.id, me.name, captionForThis || (items[i].kind === 'image' ? 'Photo' : 'Video'), `/?dm=${session.user.id}`, me.avatar);
            }
          }
          if (insertedRow && items[i].kind === 'video' && (items[i].trimStart != null || items[i].trimEnd != null)) {
            const trimStart = items[i].trimStart || 0;
            const trimEnd = items[i].trimEnd || null;
            await supabase.from('messages').update({ trim_start: trimStart, trim_end: trimEnd }).eq('id', insertedRow.id);
            setMessages((prev) => prev.map((m) => (m.id === insertedRow.id ? { ...m, trim_start: trimStart, trim_end: trimEnd } : m)));
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
    if (kind === 'image') {
      setPhotoEditQueue((prev) => [...prev, ...capped]);
    } else {
      setVideoEditQueue((prev) => [...prev, ...capped]);
    }
  };

  const MIN_RECORDING_MS = 700;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac', 'audio/ogg'];
      const supportedMime = mimeCandidates.find((t) => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t));
      const recorder = supportedMime ? new MediaRecorder(stream, { mimeType: supportedMime }) : new MediaRecorder(stream);
      const actualMime = recorder.mimeType || supportedMime || 'audio/webm';
      const ext = actualMime.includes('mp4') ? 'm4a' : actualMime.includes('ogg') ? 'ogg' : actualMime.includes('aac') ? 'aac' : 'webm';
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        setRecording(false);
        if (!activeProfile && !activeGroup) return;
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        if (blob.size < 1000) {
          alert('That recording was too short or got cut off, please try again.');
          return;
        }
        const file = new File([blob], `voice.${ext}`, { type: actualMime });
        setUploading(true);
        const { url, error } = await uploadMedia(file, session.user.id);
        if (!error && url) {
          if (activeGroup) {
            await sendGroupMessage('audio', null, url);
          } else {
            const { data } = await sendMessage(session.user.id, activeProfile.id, 'audio', null, url);
            if (data) { setMessages((prev) => [...prev, data]); upsertConversation(activeProfile.id, null, 'audio'); sendPushNotification(activeProfile.id, me.name, 'Voice message', `/?dm=${session.user.id}`, me.avatar); }
          }
        }
        setUploading(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      recordStartRef.current = Date.now();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      if (pendingStopRef.current) { pendingStopRef.current = false; stopRecording(); }
    } catch {
      alert('Microphone access is needed to send a voice message.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) { pendingStopRef.current = true; return; }
    const elapsed = Date.now() - recordStartRef.current;
    if (elapsed < MIN_RECORDING_MS) {
      setTimeout(() => mediaRecorderRef.current?.stop(), MIN_RECORDING_MS - elapsed);
    } else {
      mediaRecorderRef.current?.stop();
    }
  };
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
  const doStartReplySingle = (m) => { setReplyingTo(m); setEditingMessage(null); setContextMenuFor(null); setTimeout(() => composerRef.current?.focus(), 30); };
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
      /* A reaction counts as the latest activity in the chat too -- without this the
         main list never reflected that someone just reacted until an actual new
         message came in. */
      if (activeProfile) upsertConversation(activeProfile.id, `Reacted ${emoji}`, 'text');
    }
    setReactionPickerFor(null);
  };

  const confirmDeleteChat = async () => {
    const target = deleteConvoTarget;
    setDeleteConvoTarget(null);
    if (!target) return;
    hideChatLocally(target.id);
    /* Always fetch the full message history fresh from the server before hiding it --
       relying on whatever happened to already be loaded in `messages` meant deleting a
       chat straight from the list (without opening it first) hid nothing, so the entire
       old history came back the moment they messaged again. */
    const { data: allMsgs } = await getConversation(session.user.id, target.otherProfile.id);
    const allIds = (allMsgs || []).map((m) => m.id);
    if (allIds.length) hideMessagesLocally(allIds);
    if (activeProfile?.id === target.otherProfile.id) { setActiveProfile(null); setMobileShowChat(false); setMessages([]); }
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

  const handlePullTouchStart = (e) => {
    if (sidebarListRef.current && sidebarListRef.current.scrollTop <= 0) {
      pullStartYRef.current = e.touches[0].clientY;
    } else {
      pullStartYRef.current = null;
    }
  };
  const handlePullTouchMove = (e) => {
    if (pullStartYRef.current == null || refreshing) return;
    const dy = e.touches[0].clientY - pullStartYRef.current;
    if (dy > 0 && sidebarListRef.current && sidebarListRef.current.scrollTop <= 0) {
      setPullDistance(Math.min(dy * 0.5, 70));
    }
  };
  const handlePullTouchEnd = async () => {
    if (pullDistance > 45 && !refreshing) {
      setRefreshing(true);
      setPullDistance(50);
      await Promise.all([loadConversations(), loadGroups(), loadUnreadCounts(), loadFollowRequestCount()]);
      setTimeout(() => { setRefreshing(false); setPullDistance(0); }, 400);
    } else {
      setPullDistance(0);
    }
    pullStartYRef.current = null;
  };

  if (!me) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bgGradient }}>
        <Spinner size={28} color={theme.ink} />
      </div>
    );
  }

  const displayListSortByPin = (a, b, getPinned) => {
    const pa = getPinned(a) ? 1 : 0, pb = getPinned(b) ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.last_message_at) - new Date(a.last_message_at);
  };

  const displayList = listFilter === 'groups'
    ? groups.filter((g) => !g.archived).sort((a, b) => displayListSortByPin(a, b, (x) => x.pinned))
    : listFilter === 'dms'
      ? conversations
      : listFilter === 'unread'
        ? conversations.filter(isUnread)
        : [...conversations.map((c) => ({ ...c, __kind: 'dm' })), ...groups.filter((g) => !g.archived).map((g) => ({ ...g, __kind: 'group' }))]
            .sort((a, b) => displayListSortByPin(a, b, (x) => (x.__kind === 'dm' ? isPinnedByMe(x) : x.pinned)));

  const activeWallpaperKey = activeGroup ? activeGroup.wallpaper : (activeConvForBar ? myWallpaper(activeConvForBar) : null);
  const activeNameBarKey = activeGroup ? activeGroup.name_bar : activeConvNameBar;

  return (
    <div id="zapp-root" style={{
      height: '100dvh', width: '100%', background: theme.bgGradient, fontFamily: FONT,
      display: 'flex', overflow: 'hidden', position: 'relative', boxSizing: 'border-box',
      paddingTop: 'env(safe-area-inset-top)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      <GlobalStyle />
      <AssetDownloadBar progress={assetProgress} />
      {notifPermission === 'denied' && !notifBannerDismissed && (
        <NotificationPermissionBanner top="calc(10px + env(safe-area-inset-top))" onOpenHelp={() => setShowNotifHelp(true)}
          onDismiss={() => { setNotifBannerDismissed(true); try { sessionStorage.setItem('zchat-notif-banner-dismissed', '1'); } catch {} }} />
      )}
      {!isStandaloneApp && !installBannerDismissed && !mobileShowChat && (
        <InstallAppBanner
          top={notifPermission === 'denied' && !notifBannerDismissed ? 'calc(60px + env(safe-area-inset-top))' : 'calc(10px + env(safe-area-inset-top))'}
          canInstallDirectly={!!deferredInstallPrompt} onInstallNow={handleInstallNow} onOpenHelp={() => setShowInstallHelp(true)}
          onDismiss={() => { setInstallBannerDismissed(true); try { localStorage.setItem('zchat-install-banner-dismissed', '1'); } catch {} }} />
      )}
      {showInstallHelp && <InstallAppHelpModal onClose={() => setShowInstallHelp(false)} />}
      {/* Sidebar */}
      <div style={{
        width: mobileShowChat ? 0 : '100%', maxWidth: mobileShowChat ? 0 : '100%', overflow: 'hidden',
        borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'none',
      }} className="zchat-sidebar-desktop">
        <div style={{
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <ZBrand size={22} showTag />
          <div onClick={() => setProfileOf(me)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', maxWidth: 160 }}>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
              <div style={{ fontSize: 10, color: theme.teal, fontWeight: 600 }}>Online</div>
              {me.bio && <div style={{ fontSize: 9.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>"{me.bio}"</div>}
            </div>
            <Avatar emoji={me.avatar} name={me.name} size={34} ring />
          </div>
        </div>

        <div style={{ padding: '0 16px 10px', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 11 }} />
            <input value={search} onChange={(e) => doSearch(e.target.value)} placeholder="Search by username" autoCapitalize="none"
              style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
            {searching && <div style={{ position: 'absolute', right: 12, top: 10 }}><Spinner size={13} color={theme.muted} /></div>}
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '2px 10px 12px', flexShrink: 0,
        }}>
          <div onClick={() => setShowFollowRequests(true)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Bell size={16} /></div>
            {followRequestCount > 0 && (
              <div style={{ position: 'absolute', top: -3, right: -3, background: theme.danger, color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 8, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{followRequestCount}</div>
            )}
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Requests</span>
          </div>
          <div onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Users size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Group</span>
          </div>
          <div onClick={() => setShowDiscover(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Compass size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Discover</span>
          </div>
          <div onClick={() => setShowArchived(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Archive size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Archive</span>
          </div>
          <div onClick={() => setShowSettings(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><SettingsIcon size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Settings</span>
          </div>
        </div>

        {search.trim().length >= 2 ? (
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px' }}>
            {results.length === 0 && !searching && <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: theme.muted }}>No one found</div>}
            {results.map((p) => (
              <div key={p.id} onClick={() => { setSearch(''); setResults([]); setProfileOf(p); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 14,
              }}>
                <Avatar emoji={p.avatar} name={p.name} size={42} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: theme.muted }}>@{p.username}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, padding: '0 16px 10px', flexShrink: 0, overflowX: 'auto' }}>
              {[{ k: 'all', l: 'All' }, { k: 'unread', l: 'Unread' }, { k: 'groups', l: 'Groups' }, { k: 'dms', l: 'Chats' }].map((f) => (
                <div key={f.k} onClick={() => setListFilter(f.k)} style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  background: listFilter === f.k ? theme.coral : theme.rowBg, color: listFilter === f.k ? 'white' : theme.muted,
                }}>{f.l}</div>
              ))}
            </div>
            <div
              ref={sidebarListRef}
              onTouchStart={handlePullTouchStart}
              onTouchMove={handlePullTouchMove}
              onTouchEnd={handlePullTouchEnd}
              style={{
                overflowY: 'auto', flex: 1, padding: '0 10px', position: 'relative',
                transform: pullDistance ? `translateY(${pullDistance}px)` : 'none',
                transition: pullStartYRef.current ? 'none' : 'transform 0.25s ease',
                scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch',
              }}
            >
              {(refreshing || pullDistance > 4) && (
                <div style={{ position: 'absolute', top: -38, left: '50%', transform: `translateX(-50%) rotate(${refreshing ? 0 : pullDistance * 4}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spinner size={18} color={theme.coral} />
                </div>
              )}
              {displayList.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: theme.muted }}>
                  {listFilter === 'unread' ? 'No unread chats' : 'Search a username above to start chatting, or create a group.'}
                </div>
              )}
              {displayList.map((item) => {
                const isGroup = item.__kind === 'group' || (!item.__kind && listFilter === 'groups');
                if (isGroup) {
                  const g = item;
                  const isActive = activeGroup?.id === g.id;
                  return (
                    <div key={'g-' + g.id} onClick={() => openGroup(g)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 16,
                      background: isActive ? theme.rowBg : 'transparent', position: 'relative',
                    }}>
                      <GroupAvatar avatar={g.avatar} name={g.name} size={46} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: theme.ink, display: 'flex', alignItems: 'center', gap: 4 }}>
                            {g.pinned && <Pin_ size={13} />}{g.name}
                          </span>
                          {g.last_message_at && <span style={{ fontSize: 10.5, color: theme.muted, flexShrink: 0 }}>{new Date(g.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.last_message_type === 'image' ? 'Photo' : g.last_message_type === 'audio' ? 'Voice message' : g.last_message_type === 'video' ? 'Video' : g.last_message_type === 'sticker' ? 'Sticker' : (g.last_message || 'No messages yet')}
                        </div>
                      </div>
                      <MoreVertical size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }}
                        onClick={(e) => { e.stopPropagation(); setGroupRowMenuAnchor(e.currentTarget); setGroupRowMenuFor(groupRowMenuFor === g.id ? null : g.id); }} />
                      <SmartMenu anchorEl={groupRowMenuAnchor} open={groupRowMenuFor === g.id} onClose={() => setGroupRowMenuFor(null)} width={190}>
                        <div style={{ background: theme.panelBg, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                          <div onClick={() => { toggleGroupPin(g); setGroupRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>{g.pinned ? `Unpin ${g.name}` : `Pin ${g.name}`}</div>
                          <div onClick={() => { toggleGroupArchive(g); setGroupRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>{`Archive ${g.name}`}</div>
                          <div onClick={() => { leaveGroupById(g); setGroupRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.danger, cursor: 'pointer' }}>{`Leave ${g.name}`}</div>
                        </div>
                      </SmartMenu>
                    </div>
                  );
                }
                const c = item;
                const isActive = activeProfile?.id === c.otherProfile.id;
                const unread = isUnread(c);
                return (
                  <div key={'c-' + c.id} onClick={() => openChat(c.otherProfile, c.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 16,
                    background: isActive ? theme.rowBg : 'transparent', position: 'relative',
                  }}>
                    <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} online={isUserOnline(c.otherProfile) && !c.otherProfile.hide_activity} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: unread ? 800 : 700, fontSize: 14, color: theme.ink, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                          {isPinnedByMe(c) && <Pin_ size={13} />}{c.otherProfile.name}
                        </span>
                        {c.last_message_at && <span style={{ fontSize: 10.5, color: unread ? theme.coral : theme.muted, fontWeight: unread ? 700 : 400, flexShrink: 0 }}>{new Date(c.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.last_sender_id === session.user.id && <StatusTicks status={c.lastMineRead ? 'read' : c.lastMineDelivered ? 'delivered' : 'sent'} />}
                        <div style={{ fontSize: 12, color: unread ? theme.ink : theme.muted, fontWeight: unread ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.last_message || 'Say hi \u{1F44B}'}
                        </div>
                      </div>
                    </div>
                    {unread && <div style={{ width: 20, height: 20, borderRadius: 10, background: theme.coral, color: 'white', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unreadCounts[c.otherProfile.id]}</div>}
                    <MoreVertical size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); setRowMenuAnchor(e.currentTarget); setRowMenuFor(rowMenuFor === c.id ? null : c.id); }} />
                    <SmartMenu anchorEl={rowMenuAnchor} open={rowMenuFor === c.id} onClose={() => setRowMenuFor(null)} width={190}>
                      <div style={{ background: theme.panelBg, borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                        <div onClick={() => { togglePin(c); setRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>{isPinnedByMe(c) ? `Unpin ${c.otherProfile.name}` : `Pin ${c.otherProfile.name}`}</div>
                        <div onClick={() => { toggleArchive(c.id, true); setRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>{`Archive ${c.otherProfile.name}`}</div>
                        <div onClick={() => { setDeleteConvoTarget(c); setRowMenuFor(null); }} style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: theme.danger, cursor: 'pointer' }}>{`Delete ${c.otherProfile.name}`}</div>
                      </div>
                    </SmartMenu>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Chat panel */}
      <div style={{
        flex: 1, display: mobileShowChat ? 'flex' : 'none', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative',
        paddingTop: (activeProfile || activeGroup) ? 64 : 0,
      }} className={mobileShowChat ? 'zchat-chat-panel zchat-panel-open' : 'zchat-chat-panel'}>
        {(activeProfile || activeGroup) ? (
          <>
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 15,
              borderBottom: activeNameBarKey ? 'none' : `1px solid ${theme.border}`,
              boxShadow: activeNameBarKey ? '0 2px 16px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.16)' : 'none',
              background: activeNameBarKey ? undefined : theme.panelBg,
              ...(nameBarBgStyle(activeNameBarKey) || {}),
            }}>
              <div style={{ height: 'env(safe-area-inset-top)', width: '100%' }} />
              <div
                style={{
                  padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10,
                  minHeight: 64, boxSizing: 'border-box',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}
                onClick={() => (activeGroup ? setShowGroupInfo(true) : setProfileOf(activeProfile))}>
              {activeNameBarKey && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.3) 75%, rgba(0,0,0,0.14) 100%), linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.22) 100%)',
                }} />
              )}
              <ArrowLeft size={20} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none', position: 'relative' }}
                onClick={(e) => { e.stopPropagation(); setMobileShowChat(false); setActiveProfile(null); setActiveGroup(null); }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, position: 'relative' }}>
                {activeGroup ? <GroupAvatar avatar={activeGroup.avatar} name={activeGroup.name} size={38} /> : <Avatar emoji={activeProfile.avatar} name={activeProfile.name} online={isUserOnline(activeProfile) && !activeProfile.hide_activity} size={38} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: activeNameBarKey ? 'white' : theme.ink, textShadow: activeNameBarKey ? '0 1px 4px rgba(0,0,0,0.7)' : 'none',
                  }}>{activeGroup ? activeGroup.name : activeProfile.name}</div>
                  <div style={{ fontSize: 11, color: activeNameBarKey ? 'rgba(255,255,255,0.85)' : theme.muted, textShadow: activeNameBarKey ? '0 1px 4px rgba(0,0,0,0.7)' : 'none' }}>
                    {activeGroup ? `${groupMembers.length} members` : typingFrom ? 'typing...' : (isUserOnline(activeProfile) && !activeProfile.hide_activity ? 'Online' : (!activeProfile.hide_activity && formatLastSeen(activeProfile.last_seen)) || '')}
                  </div>
                </div>
              </div>
              {!activeGroup && activeFollowState !== null && (
                <button onClick={(e) => { e.stopPropagation(); toggleActiveFollow(); }} disabled={activeFollowBusy} style={{
                  padding: '6px 14px', borderRadius: 18, fontSize: 11.5, fontWeight: 700, cursor: activeFollowBusy ? 'default' : 'pointer', fontFamily: FONT, flexShrink: 0,
                  position: 'relative', marginRight: 4,
                  border: activeNameBarKey
                    ? '1.5px solid rgba(255,255,255,0.5)'
                    : (activeFollowState !== 'none' ? `1.5px solid ${theme.border}` : 'none'),
                  background: activeNameBarKey
                    ? (activeFollowState === 'accepted' ? 'rgba(0,0,0,0.45)' : activeFollowState === 'pending' ? 'rgba(0,0,0,0.35)' : theme.coral)
                    : (activeFollowState === 'accepted' ? `${theme.coral}18` : activeFollowState === 'pending' ? 'transparent' : theme.coral),
                  color: activeNameBarKey
                    ? 'white'
                    : (activeFollowState === 'accepted' ? theme.coralDeep : activeFollowState === 'pending' ? theme.ink : 'white'),
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {activeFollowBusy ? <Spinner size={11} color={activeNameBarKey ? 'white' : (activeFollowState !== 'none' ? theme.ink : 'white')} /> : (
                    <>{activeFollowState === 'accepted' ? <Check size={11} /> : activeFollowState === 'pending' ? null : <UserPlus size={11} />}</>
                  )}
                  {!activeFollowBusy && (activeFollowState === 'accepted' ? 'Following' : activeFollowState === 'pending' ? 'Requested' : (activeFollowerFollowsMe ? 'Follow back' : 'Follow'))}
                </button>
              )}
              <MoreVertical size={19} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none', position: 'relative' }}
                onClick={(e) => { e.stopPropagation(); (activeGroup ? setShowGroupInfo(true) : setShowChatSettings(true)); }} />
              </div>
            </div>

            {selectionMode && (
              <MessageActionBar count={selectedIds.size} canEditActions={selectionInfo} onCancel={cancelSelection}
                onForward={openForward} onDeleteForMe={doDeleteForMe} onDeleteForEveryone={doDeleteForEveryone}
                onReport={() => setReportModalFor('__selection__')} />
            )}

            <div ref={scrollRef} className="zchat-msglist" onScroll={handleChatScroll} style={{
              flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 18px', position: 'relative',
              WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y',
              ...(wallpaperBgStyle(activeWallpaperKey) || {}),
            }}>
              <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              {!activeWallpaperKey && <AnimatedChatBackground chatTheme={chatTheme} />}
              {bgPatternOn && !activeWallpaperKey && (
                <div style={{
                  position: 'absolute', inset: 0, opacity: theme.dark ? 0.05 : 0.04, pointerEvents: 'none',
                  backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '18px 18px', color: theme.ink,
                }} />
              )}
              {loadingConvo ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Spinner size={22} color={theme.ink} /></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', paddingTop: 60, color: theme.muted, fontSize: 13 }}>
                  {activeGroup ? 'No messages yet. Say hello!' : `No messages yet. Say hi to ${activeProfile.name}!`}
                </div>
              ) : (
                messages.map((m) => {
                  const replyPreview = m.reply_to_id ? (() => {
                    const rm = findMessageById(m.reply_to_id);
                    return rm ? { ...rm, senderLabel: labelForSender(rm.sender_id) } : null;
                  })() : null;
                  const isMe = m.sender_id === session.user.id;
                  const showSenderLabel = activeGroup && !isMe;
                  return (
                    <MessageBubble
                      key={m.id} m={m} isMe={isMe}
                      selectionMode={selectionMode} selected={selectedIds.has(m.id)} onToggleSelect={toggleSelect}
                      onLongPress={() => { if (!selectionMode) setContextMenuFor(m.id); }}
                      onDelete={(id) => setPendingQuickDelete(id)}
                      onOpenImage={setViewerUrl} onOpenVideo={setViewerVideoUrl}
                      reactions={messageLikes[m.id]} onReact={(id, emoji) => reactToMessage(id, emoji)}
                      onOpenWhoReacted={(id) => setWhoReactedFor(messageLikes[id] || [])}
                      replyPreview={replyPreview} onSwipeReply={(msg) => { setReplyingTo(msg); setEditingMessage(null); setTimeout(() => composerRef.current?.focus(), 0); }}
                      onJumpToMessage={jumpToMessage} highlighted={highlightedMsgId === m.id}
                      senderLabel={showSenderLabel ? memberName(m.sender_id) : null}
                      senderAvatar={showSenderLabel ? groupMembers.find((gm) => gm.user_id === m.sender_id)?.profile.avatar : null}
                      hideReadStatus={!!activeGroup}
                      onOpenSenderProfile={showSenderLabel ? () => { const p = groupMembers.find((gm) => gm.user_id === m.sender_id)?.profile; if (p) setProfileOf(p); } : null}
                      canModerate={activeGroup ? (groupMembers.find((gm) => gm.user_id === session.user.id)?.role === 'admin') : false}
                    />
                  );
                })
              )}
              </div>
            </div>

            {(replyingTo || editingMessage) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderTop: `1px solid ${theme.border}`,
                background: theme.glass, flexShrink: 0,
              }}>
                <div style={{ width: 3, alignSelf: 'stretch', background: theme.coral, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: theme.coralDeep }}>{editingMessage ? 'Editing message' : `Replying to ${labelForSender(replyingTo.sender_id)}`}</div>
                  <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(editingMessage || replyingTo).type === 'text' ? (editingMessage || replyingTo).content : (editingMessage || replyingTo).type === 'image' ? 'Photo' : (editingMessage || replyingTo).type === 'audio' ? 'Voice message' : 'Video'}
                  </div>
                </div>
                <X size={16} style={{ cursor: 'pointer', color: theme.muted, flexShrink: 0 }} onClick={() => { setReplyingTo(null); setEditingMessage(null); setDraft(''); }} />
              </div>
            )}

            {pendingMedia.length > 0 && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 16px 0', overflowX: 'auto', flexShrink: 0 }}>
                {pendingMedia.map((item, i) => (
                  <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                    {item.kind === 'image' ? (
                      <img src={item.url} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                    ) : (
                      <video src={item.url} onContextMenu={(e) => e.preventDefault()} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', background: '#000' }} />
                    )}
                    <div onClick={() => removePendingMedia(i)} style={{
                      position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%',
                      background: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    }}><X size={11} color="white" /></div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 14px', flexShrink: 0, paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}>
              {recording ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: theme.inputBg, borderRadius: 22, padding: '9px 16px' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: theme.danger, animation: 'zchat-love-pulse 1s infinite' }} />
                  <span style={{ fontSize: 13, color: theme.ink, fontWeight: 700 }}>Recording {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}</span>
                  <div style={{ flex: 1 }} />
                  <X size={17} color={theme.muted} style={{ cursor: 'pointer' }} onClick={() => { mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop()); clearInterval(recordTimerRef.current); setRecording(false); mediaRecorderRef.current = null; }} />
                </div>
              ) : (
                <>
                  <div onClick={() => setShowAttach((s) => !s)} style={{
                    width: 40, height: 40, borderRadius: '50%', background: theme.rowBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: theme.coralDeep,
                  }}><Paperclip size={18} /></div>
                  <div onClick={() => setShowStickers((s) => !s)} style={{
                    width: 40, height: 40, borderRadius: '50%', background: theme.rowBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: theme.coralDeep, fontSize: 18,
                  }}><Smile size={18} /></div>
                  <textarea
                    ref={composerRef}
                    value={draft}
                    enterKeyHint="enter"
                    data-keyboard-heal="true"
                    onChange={(e) => { setDraft(e.target.value.slice(0, MAX_CHARS)); sendTyping(); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editingMessage ? saveEdit() : send(); } }}
                    placeholder={editingMessage ? 'Edit message' : 'Message'}
                    rows={1}
                    style={{
                      flex: 1, resize: 'none', height: 38, maxHeight: 110, minHeight: 38, boxSizing: 'border-box', padding: '9px 14px', borderRadius: 20,
                      border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink,
                      fontFamily: FONT, fontSize: 15, outline: 'none', lineHeight: 1.35,
                    }}
                  />
                  {(draft.trim() || pendingMedia.length > 0) ? (
                    <div onClick={editingMessage ? saveEdit : send} style={{
                      width: 40, height: 40, borderRadius: '50%', background: theme.coral, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    }}><Send size={17} color="white" style={{ marginLeft: -1 }} /></div>
                  ) : (
                    <div
                      onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                      onPointerUp={stopRecording}
                      onPointerLeave={stopRecording}
                      style={{
                        width: 40, height: 40, borderRadius: '50%', background: theme.coral, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, touchAction: 'none',
                      }}><Mic size={17} color="white" /></div>
                  )}
                </>
              )}
            </div>

            {showAttach && (
              <div style={{ position: 'absolute', bottom: 76, left: 14, zIndex: 12, display: 'flex', gap: 10 }} className="zchat-fade">
                <label style={{
                  width: 52, height: 52, borderRadius: '50%', background: theme.coral, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}>
                  <ImageIcon size={20} color="white" />
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleFile(e, 'image')} />
                </label>
                <label style={{
                  width: 52, height: 52, borderRadius: '50%', background: theme.coralDeep, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}>
                  <VideoIcon size={20} color="white" />
                  <input type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleFile(e, 'video')} />
                </label>
              </div>
            )}

            {showStickers && (
              <StickerPicker onPick={sendSticker} onClose={() => setShowStickers(false)} />
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: theme.muted }}>
            <ZBrand size={30} />
            <div style={{ fontSize: 13 }}>Select a conversation to start chatting</div>
          </div>
        )}
      </div>

      {profileOf && (
        <ProfilePanel
          profile={profileOf} isSelf={profileOf.id === session.user.id} userId={session.user.id}
          isOnline={isUserOnline(profileOf) && !profileOf.hide_activity} onClose={() => setProfileOf(null)}
          onReport={handleReport} onSaved={(updated) => setProfileOf(updated)}
          onOpenSettings={() => { setProfileOf(null); setShowSettings(true); }}
          onOpenProfile={(p) => setProfileOf(p)}
          onMessage={(p) => { openChat(p, null); setProfileOf(null); }}
          isBlocked={myBlockedIds.has(profileOf.id)} onBlock={blockUser} onUnblock={unblockUser}
        />
      )}

      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onOpenPrivacy={() => setShowPrivacy(true)}
          onOpenRequests={() => { setShowSettings(false); setShowFollowRequests(true); }}
          onLogout={() => setShowLogoutConfirm(true)}
          hideActivity={!!me.hide_activity} onToggleActivity={toggleHideActivity}
          onOpenAccounts={() => { setShowSettings(false); setShowAccountSwitcher(true); }}
          onOpenDelete={() => { setShowSettings(false); setShowDeleteAccount(true); }}
          chatLockSet={!!me.chat_lock_enabled} chatLockHash={me.chat_lock_hash}
          onSetChatLockPassword={setChatLockPassword} onTurnOffChatLock={turnOffChatLock}
          autoOpenLockSetup={autoOpenLockSetup} onConsumedAutoOpen={() => setAutoOpenLockSetup(false)}
        />
      )}
      {showPrivacy && <PrivacyPanel onBack={() => setShowPrivacy(false)} />}
      {showLogoutConfirm && (
        <LogoutConfirm onCancel={() => setShowLogoutConfirm(false)} onConfirm={onLogout} />
      )}
      {showFollowRequests && (
        <FollowRequestsPanel userId={session.user.id} onClose={() => { setShowFollowRequests(false); loadFollowRequestCount(); }} onOpenProfile={(p) => { setShowFollowRequests(false); setProfileOf(p); }} />
      )}
      {showDiscover && (
        <DiscoverPanel myId={session.user.id} blockedIds={myBlockedIds} onClose={() => setShowDiscover(false)} onOpenProfile={(p) => { setShowDiscover(false); setProfileOf(p); }} />
      )}
      {showAccountSwitcher && (
        <AccountSwitcherPanel accounts={savedAccounts} currentId={session.user.id} switchingId={switchingAccountId}
          onBack={() => setShowAccountSwitcher(false)} onSwitch={onSwitchAccount} onRemove={onRemoveAccount} onAdd={onAddAccount} />
      )}
      {showDeleteAccount && (
        <DeleteAccountConfirm onCancel={() => setShowDeleteAccount(false)} onConfirm={deleteMyAccount} />
      )}
      {contextMenuFor && (() => {
        const m = findMessageById(contextMenuFor);
        if (!m) return null;
        const isMine = m.sender_id === session.user.id;
        return (
          <MessageContextMenu
            message={m} isMine={isMine}
            canEditText={isMine && m.type === 'text' && !m.deleted}
            canModerate={activeGroup ? (groupMembers.find((gm) => gm.user_id === session.user.id)?.role === 'admin') : false}
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
      {pendingQuickDelete && (
        <DeleteMessageConfirm onCancel={() => setPendingQuickDelete(null)} onConfirm={() => { handleDelete(pendingQuickDelete); setPendingQuickDelete(null); }} />
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
      {whoReactedFor && (
        <WhoReactedModal reactions={whoReactedFor} onClose={() => setWhoReactedFor(null)} />
      )}
      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} onForward={() => { openForward(); }} onReport={() => setReportModalFor('__viewer__')} />
      )}
      {viewerVideoUrl && (
        <VideoViewer url={viewerVideoUrl.url} trimStart={viewerVideoUrl.trimStart} trimEnd={viewerVideoUrl.trimEnd} onClose={() => setViewerVideoUrl(null)} onForward={() => { setViewerVideoUrl(null); openForward(); }} />
      )}
      {showArchived && (
        <ArchivedChatsPanel conversations={archivedConversations} onClose={() => setShowArchived(false)}
          onOpenChat={(c) => { setShowArchived(false); openChat(c.otherProfile, c.id); }}
          onUnarchive={(id) => toggleArchive(id, false)} />
      )}
      {showChatSettings && activeConvForBar && (
        <ChatSettingsPanel
          conv={activeConvForBar} myId={session.user.id} meAvatar={me.avatar} meName={me.name}
          isPinned={isPinnedByMe(activeConvForBar)} isLocked={!!myLocks[activeConvForBar.id]}
          wallpaper={myWallpaper(activeConvForBar)} nameBar={activeConvForBar.name_bar}
          chatLockAvailable={!!me.chat_lock_enabled}
          onClose={() => setShowChatSettings(false)}
          onTogglePin={() => togglePin(activeConvForBar)}
          onToggleArchive={() => { toggleArchive(activeConvForBar.id, true); setShowChatSettings(false); setMobileShowChat(false); setActiveProfile(null); }}
          onSetWallpaper={(key) => setWallpaper(activeConvForBar, key)}
          onSetNameBar={(key) => setNameBar(activeConvForBar, key)}
          onEnableLock={() => enableChatLock(activeConvForBar)}
          onDisableLock={() => disableChatLock(activeConvForBar)}
          onDeleteChat={() => { setShowChatSettings(false); setDeleteConvoTarget(activeConvForBar); }}
          onReportUser={(reason) => handleReport(activeConvForBar.otherProfile, reason)}
          onNicknameSaved={(nick, otherId) => setConversations((prev) => prev.map((c) => (c.otherProfile.id === otherId ? { ...c, otherProfile: { ...c.otherProfile, name: nick || c.realName } } : c)))}
          onNeedChatLockSetup={() => { setShowChatSettings(false); setShowSettings(true); setAutoOpenLockSetup(true); }}
          onOpenProfile={(p) => { setShowChatSettings(false); setProfileOf(p); }}
        />
      )}
      {showCreateGroup && (
        <CreateGroupPanel myId={session.user.id} onClose={() => setShowCreateGroup(false)}
          onCreated={(g) => { setShowCreateGroup(false); loadGroups(); openGroup({ ...g, myRole: 'admin' }); }} />
      )}
      {showGroupInfo && activeGroup && (
        <GroupInfoPanel
          group={activeGroup} members={groupMembers} myId={session.user.id}
          myRole={groupMembers.find((gm) => gm.user_id === session.user.id)?.role || 'member'}
          isOwner={activeGroup.created_by === session.user.id}
          onClose={() => setShowGroupInfo(false)}
          onPromote={promoteMember} onDemote={demoteMember} onMute={muteMember} onUnmute={unmuteMember}
          onKick={kickMember} onLeave={leaveGroup}
          onOpenProfile={(p) => { setShowGroupInfo(false); setProfileOf(p); }}
          onSaveBio={saveGroupBio} onSaveName={saveGroupName} onSaveAvatar={saveGroupAvatar}
          onAddMembers={addGroupMembers} onTransferOwnership={transferOwnership}
          onSetWallpaper={setGroupWallpaper} onSetHeaderStyle={setGroupHeaderStyle}
        />
      )}
      {lockPromptFor && (
        <ChatLockUnlock correctHash={me.chat_lock_hash} onCancel={() => { setLockPromptFor(null); setMobileShowChat(false); }}
          onUnlock={() => { const { profile, convId } = lockPromptFor; setUnlockedChats((prev) => new Set(prev).add(convId)); setLockPromptFor(null); openChat(profile, convId); }} />
      )}
      {deletedAccountAlertFor && (
        <AccountGoneModal name={deletedAccountAlertFor} onOk={() => { setDeletedAccountAlertFor(null); setMobileShowChat(false); loadConversations(); }} />
      )}
      {showNotifHelp && <NotificationHelpModal onClose={() => setShowNotifHelp(false)} />}
      {photoEditQueue.length > 0 && (
        <PhotoCropEditor
          file={photoEditQueue[0]}
          onCancel={() => setPhotoEditQueue((prev) => prev.slice(1))}
          onConfirm={(blob, caption) => {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const url = URL.createObjectURL(blob);
            setPendingMedia((prev) => [...prev, { file, url, kind: 'image' }]);
            if (caption) setDraft(caption);
            setPhotoEditQueue((prev) => prev.slice(1));
          }}
        />
      )}
      {videoEditQueue.length > 0 && (
        <VideoTrimEditor
          file={videoEditQueue[0]}
          onCancel={() => setVideoEditQueue((prev) => prev.slice(1))}
          onConfirm={(file, url, trimStart, trimEnd, caption) => {
            setPendingMedia((prev) => [...prev, { file, url, kind: 'video', trimStart, trimEnd }]);
            if (caption) setDraft(caption);
            setVideoEditQueue((prev) => prev.slice(1));
          }}
        />
      )}
    </div>
  );
}

function ResetPasswordScreen({ onDone }) {
  const { theme } = useTheme();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const okPw = pw.length >= 6 && pw === pw2;

  const submit = async () => {
    if (!okPw || loading) return;
    setLoading(true); setErr('');
    const { error } = await setPassword(pw);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
    setTimeout(onDone, 1400);
  };

  if (done) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center' }} className="zchat-fade">
          <ShieldCheck size={32} color={theme.teal} style={{ marginBottom: 12 }} />
          <div style={{ fontWeight: 800, fontSize: 16.5, color: theme.ink }}>Password updated</div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 6, color: theme.ink }}>Set a new password</div>
      <div style={{ fontSize: 13, color: theme.muted, marginBottom: 16 }}>Choose something secure you haven't used before.</div>
      <input style={{ ...inputStyle(theme), marginBottom: 10 }} type="password" placeholder="New password"
        value={pw} onChange={(e) => setPw(e.target.value)} />
      <input style={inputStyle(theme)} type="password" placeholder="Confirm new password"
        value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
      <button style={primaryBtn(theme, !okPw || loading)} disabled={!okPw || loading} onClick={submit}>
        {loading ? <Spinner /> : 'Update password'}
      </button>
    </AuthShell>
  );
}

function AppInner() {
  const [session, setSession] = useState(undefined);
  const [screen, setScreen] = useState('login');
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [switchingAccountId, setSwitchingAccountId] = useState(null);

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) setIsPasswordRecovery(true);
    getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(sess);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      getProfile(session.user.id).then(({ data }) => {
        if (data) saveAccountEntry({ id: session.user.id, name: data.name, avatar: data.avatar, email: session.user.email });
      });
    }
  }, [session?.user?.id]);

  const handleAddAccount = () => {
    setSession(null);
    setScreen('login');
  };

  const handleSwitchAccount = async (account) => {
    setSwitchingAccountId(account.id);
    const savedSessionRaw = (() => { try { return localStorage.getItem(`zchat-session-${account.id}`); } catch { return null; } })();
    if (savedSessionRaw) {
      try {
        const savedSession = JSON.parse(savedSessionRaw);
        const { data, error } = await supabase.auth.setSession({ access_token: savedSession.access_token, refresh_token: savedSession.refresh_token });
        if (!error && data.session) { setSession(data.session); setSwitchingAccountId(null); return; }
      } catch {}
    }
    setSwitchingAccountId(null);
    alert("Couldn't switch to that account automatically. Please sign in again.");
    setSession(null);
    setScreen('login');
  };

  useEffect(() => {
    if (session?.user) {
      try {
        localStorage.setItem(`zchat-session-${session.user.id}`, JSON.stringify({ access_token: session.access_token, refresh_token: session.refresh_token }));
      } catch {}
    }
  }, [session?.access_token]);

  const handleRemoveAccount = (id) => {
    removeAccountEntry(id);
    try { localStorage.removeItem(`zchat-session-${id}`); } catch {}
  };

  const handleLogout = async () => {
    if (session?.user) { try { localStorage.removeItem(`zchat-session-${session.user.id}`); } catch {} removeAccountEntry(session.user.id); }
    await signOut();
    setSession(null);
    setScreen('login');
  };

  if (isPasswordRecovery) {
    return <ResetPasswordScreen onDone={() => { setIsPasswordRecovery(false); window.location.hash = ''; }} />;
  }

  if (session === undefined) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={26} color="#1B1B1F" />
      </div>
    );
  }

  if (!session || needsProfile) {
    if (needsProfile) {
      return (
        <RegisterFlow
          onStart={() => {}}
          onDone={() => { setNeedsProfile(false); }}
          onBack={() => { setNeedsProfile(false); supabase.auth.signOut(); setSession(null); }}
        />
      );
    }
    return (
      <AuthShell>
        {screen === 'login' && (
          <LoginStep onSuccess={setSession} onForgot={() => setScreen('forgot')} onGoRegister={() => setScreen('register')} />
        )}
        {screen === 'forgot' && <ForgotStep onBack={() => setScreen('login')} />}
        {screen === 'register' && (
          <RegisterFlow onStart={() => {}} onDone={() => setScreen('login')} onBack={() => setScreen('login')} />
        )}
      </AuthShell>
    );
  }

  return (
    <ChatApp
      session={session}
      onLogout={handleLogout}
      onNeedsProfile={() => setNeedsProfile(true)}
      savedAccounts={getSavedAccounts()}
      onSwitchAccount={handleSwitchAccount}
      onAddAccount={handleAddAccount}
      onRemoveAccount={handleRemoveAccount}
      switchingAccountId={switchingAccountId}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
        }
