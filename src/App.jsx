import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, ChevronLeft, Compass, Bell, Volume2, VolumeX, Palette, Mic, Play, Pause, Download, Users, Camera, Reply, Forward, Ban, Edit3, Archive, Sparkles, Share2, Copy, Crop, Type, Pencil, Undo2, Scissors, BellOff, Link as LinkIcon, ShieldAlert, Heart, Repeat, PhoneOff, MicOff, VideoOff, SwitchCamera,
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
  useEffect(() => {
    const bg = THEMES[dark ? 'dark' : 'light'].bgGradient;
    try {
      document.documentElement.style.background = bg;
      document.body.style.background = bg;
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'theme-color'); document.head.appendChild(meta); }
      meta.setAttribute('content', bg);
    } catch {}
  }, [dark]);
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

function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && typeof Notification !== 'undefined';
}

async function subscribeToPush(userId, askPermission = false) {
  try {
    if (!pushSupported()) return;
    if (Notification.permission !== 'granted') {
      if (!askPermission || Notification.permission === 'denied') return;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
    }
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
    const base = url || '/';
    const withAccount = base.includes('acc=') ? base : `${base}${base.includes('?') ? '&' : '?'}acc=${userId}`;
    await supabase.functions.invoke('hyper-worker', { body: { user_id: userId, title, body, url: withAccount, icon: icon || undefined } });
  } catch (err) {
    console.error('Push notify failed:', err);
  }
}

function isTouchDevice() {
  try { return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches; } catch { return false; }
}

function canHoverPointer() {
  try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; }
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
      @keyframes zchat-mail-zoom-in { 0% { opacity: 0; transform: scale(0.82); } 100% { opacity: 1; transform: scale(1); } }
      .zchat-mail-zoom { animation: zchat-mail-zoom-in 0.22s cubic-bezier(.2,.8,.3,1); }
      @keyframes zchat-float-up { 0% { transform: translateY(0) translateX(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-620px) translateX(18px); opacity: 0; } }
      @keyframes zchat-drift-a { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(30px, 20px); } }
      @keyframes zchat-drift-b { 0%, 100% { transform: translate(0,0); } 50% { transform: translate(-24px, -18px); } }
      @keyframes zchat-love-pulse { 0%, 100% { box-shadow: 0 0 10px rgba(255,77,141,0.28); } 50% { box-shadow: 0 0 20px rgba(255,77,141,0.55); } }
      @keyframes zchat-neon-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.18); } }
      @keyframes zchat-wave-pop { 0% { opacity: 0; transform: scale(0.4) translateY(10px); } 60% { opacity: 1; transform: scale(1.08) translateY(-2px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes zchat-panel-zoom-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      @keyframes zchat-panel-slide-in { 0% { opacity: 0; transform: translateX(14px) scale(0.985); } 100% { opacity: 1; transform: translateX(0) scale(1); } }
      @keyframes zchat-pull-spin { to { transform: rotate(360deg); } }
      @keyframes zchat-toast-in { 0% { opacity: 0; transform: translateY(-28px) scale(0.97); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes zchat-pop-in { 0% { opacity: 0; transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes zchat-sheet-up { 0% { transform: translateY(40px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
      @keyframes zchat-dots { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
      .zchat-toast-in { animation: zchat-toast-in 0.28s cubic-bezier(0.2, 0.9, 0.3, 1.1); }
      .zchat-pop { animation: zchat-pop-in 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
      .zchat-sheet-up { animation: zchat-sheet-up 0.22s cubic-bezier(0.2, 0.9, 0.3, 1); }
      @keyframes zchat-call-pulse { 0% { box-shadow: 0 0 0 0 rgba(52,199,89,0.55); } 70% { box-shadow: 0 0 0 16px rgba(52,199,89,0); } 100% { box-shadow: 0 0 0 0 rgba(52,199,89,0); } }
      @keyframes zchat-call-ring { 0% { transform: scale(0.92); opacity: 0.85; } 100% { transform: scale(1.4); opacity: 0; } }
      .zchat-call-pulse { animation: zchat-call-pulse 1.6s infinite; }
      html, body { overscroll-behavior: none; }
      [style*="overflow-y: auto"] { overflow-x: hidden; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch; }
      @keyframes zchat-confetti { 0% { transform: translateY(-20px) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }
      @keyframes zchat-badge-pulse { 0%, 100% { transform: scale(0.94); opacity: 0.75; } 50% { transform: scale(1.06); opacity: 1; } }
      @keyframes zchat-frame-spin { to { transform: rotate(360deg); } }
      @keyframes zchat-frame-fire { 0%, 100% { filter: brightness(1) saturate(1.05) drop-shadow(0 0 4px rgba(255,90,20,0.45)); } 25% { filter: brightness(1.12) saturate(1.2) drop-shadow(0 0 9px rgba(255,120,30,0.7)); } 50% { filter: brightness(0.96) saturate(1.1) drop-shadow(0 0 5px rgba(255,70,10,0.5)); } 75% { filter: brightness(1.18) saturate(1.25) drop-shadow(0 0 11px rgba(255,140,40,0.75)); } }
      @keyframes zchat-frame-ice { 0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(56,189,248,0.4)); } 50% { filter: brightness(1.15) drop-shadow(0 0 12px rgba(56,189,248,0.8)); } }
      .zchat-frame-mask { -webkit-mask-image: radial-gradient(circle closest-side, #000 84%, rgba(0,0,0,0) 100%); mask-image: radial-gradient(circle closest-side, #000 84%, rgba(0,0,0,0) 100%); }
      @keyframes zchat-post-heart { 0% { transform: scale(0); opacity: 0; } 15% { transform: scale(1.2); opacity: 1; } 30% { transform: scale(0.95); } 45% { transform: scale(1); } 80% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.2) translateY(-60px); opacity: 0; } }
      img, video { -webkit-touch-callout: none; -webkit-user-drag: none; }
      body { -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
      .zchat-call-ring { animation: zchat-call-ring 1.8s ease-out infinite; }
      .zchat-fire-ring {
        background: linear-gradient(135deg, #FFD23F, #FF6B00, #FF2D55);
      }
      .zchat-bubble-love { animation: zchat-love-pulse 2.6s ease-in-out infinite; }
      .zchat-bubble-neon { animation: zchat-neon-pulse 2.2s ease-in-out infinite; }
      .zchat-fade { animation: zchat-fade 0.25s ease; }
      .zchat-wave-pop { animation: zchat-wave-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
      .zchat-panel-open { animation: zchat-panel-zoom-in 0.24s cubic-bezier(0.16, 1, 0.3, 1); }
      * { font-family: ${FONT}; }
      html, body { margin: 0; padding: 0; overscroll-behavior: none; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
      @supports (-webkit-touch-callout: none) {
        input, textarea, select { font-size: 16px !important; }
      }
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
function hiddenAccountProfile(profile) {
  if (!profile) return profile;
  return {
    ...profile,
    name: 'ZChat user', username: 'zchatuser', avatar: '', bio: '',
    verified: null, avatar_frame: null, custom_badge: null,
    social_links: null, whatsapp: null, pronouns: null, country: null, age: null,
    hidden_account: true,
  };
}

function colorForName(name) {
  let hash = 0;
  const str = name || '?';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ emoji, name = '', online, size = 40, ring = false, frame = null, frameFit }) {
  const { chatTheme, theme } = useTheme();
  const frameUrl = useFrameUrl(frame && size >= 22 ? frame : null);
  const frameSpec = frame ? AVATAR_FRAMES[frame] : null;
  const fitFrame = frameSpec ? (frameFit === undefined ? size <= 72 : !!frameFit) : false;
  const photo = fitFrame ? Math.round(size / frameSpec.scale) : size;
  const inset = (size - photo) / 2;
  const [imgFailed, setImgFailed] = useState(false);
  const isImage = typeof emoji === 'string' && emoji.startsWith('http') && !imgFailed;
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  const ringColor = chatTheme === 'love' ? '#FF4D8D' : chatTheme === 'neon' ? '#00FFDC' : theme.coral;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', left: inset, top: inset,
        width: photo, height: photo, borderRadius: '50%',
        background: isImage ? 'transparent' : colorForName(name),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: photo * 0.42, fontWeight: 800, color: 'white', fontFamily: FONT,
        boxShadow: (ring && ringColor) ? `0 0 0 2.5px ${ringColor}, 0 0 10px ${ringColor}88` : 'inset 0 0 0 1px rgba(255,255,255,0.25)',
        overflow: 'hidden',
      }}>
        {isImage
          ? <img src={emoji} alt="" onError={() => setImgFailed(true)} onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initial}
      </div>
      {frameUrl && frameSpec && (() => {
        const spec = frameSpec;
        const w = photo * spec.scale;
        return (
          <img src={frameUrl} alt="" draggable={false} aria-hidden="true"
            style={{ ...frameMaskStyle(spec), position: 'absolute', width: w, height: w, left: size / 2 - w * (spec.centerX ?? 0.5), top: size / 2 - w * spec.centerY, pointerEvents: 'none', userSelect: 'none', zIndex: 2, maxWidth: 'none', animation: (theme.dark ? spec.animation : (spec.animationLight || spec.animation)) || 'none' }} />
        );
      })()}
      {online != null && (
        <div style={{
          position: 'absolute', bottom: inset, right: inset, width: photo * 0.28, height: photo * 0.28, zIndex: 3,
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

function GoogleLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.36-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const GOOGLE_CLIENT_ID = '103023880766-q4ok0uqj8pndf72vr3mrgg9r4sgnjhu9.apps.googleusercontent.com';

let googleScriptPromise = null;
function loadGoogleIdentityScript() {
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const existing = document.getElementById('google-identity-script');
    if (existing) { existing.addEventListener('load', () => resolve()); existing.addEventListener('error', reject); return; }
    const script = document.createElement('script');
    script.id = 'google-identity-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('load-failed'));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

async function sha256Hex(input) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function GoogleButton({ onError }) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const rawNonce = randomNonce();
      const hashedNonce = await sha256Hex(rawNonce);
      await loadGoogleIdentityScript();
      if (!window.google?.accounts?.id) throw new Error('unavailable');
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          setLoading(false);
          const { error } = await supabase.auth.signInWithIdToken({
            provider: 'google', token: response.credential, nonce: rawNonce,
          });
          if (error && onError) onError(friendlyError(error, "Couldn't sign in with Google. Try again."));
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          setLoading(false);
          supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
        }
      });
    } catch {
      setLoading(false);
      if (onError) onError("Couldn't load Google sign-in. Check your connection and try again.");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        width: '100%', padding: '13px', borderRadius: 15, border: `1.5px solid ${theme.border}`,
        background: theme.dark ? 'rgba(255,255,255,0.04)' : 'white', color: theme.ink,
        fontSize: 14.5, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: FONT,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
      {loading ? <Spinner size={15} color={theme.ink} /> : (<><GoogleLogo size={17} />Continue with Google</>)}
    </button>
  );
}

function OrDivider() {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
      <span style={{ fontSize: 11.5, color: theme.muted, fontWeight: 600 }}>OR</span>
      <div style={{ flex: 1, height: 1, background: theme.border }} />
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
      <GoogleButton onError={setErr} />
      <OrDivider />
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
  const RESEND_COOLDOWN = 62;
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
    const ok = await onResend();
    setSending(false);
    if (ok) {
      setSecondsLeft(CODE_LIFETIME);
      setCooldown(RESEND_COOLDOWN);
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2500);
    } else {
      setCooldown(10);
    }
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

function RegisterFlow({ onDone, onBack, onStart, initialStage = 'email' }) {
  const { theme } = useTheme();
  const [stage, setStage] = useState(initialStage);
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

  useEffect(() => {
    if (initialStage !== 'username') return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data?.user?.user_metadata;
      if (meta?.full_name && !name) setName(meta.full_name);
      if (meta?.avatar_url && !avatarUrl) setAvatarUrl(meta.avatar_url);
    })();
  }, [initialStage]);
  const usernameTimer = useRef(null);

  const sendCode = async () => {
    setLoading(true); setErr('');
    const { error } = await registerWithEmail(email);
    setLoading(false);
    if (error) { setErr(friendlyError(error, "Couldn't send the code. Try again.")); return false; }
    setStage('otp');
    return true;
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
    if (error) { setErr(friendlyError(error, "Couldn't save your password. Try again.")); return; }
    setStage('username');
  };

  const checkUsername = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, USERNAME_MAX);
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
        setErr(friendlyError(error, "Couldn't create your profile. Try again."));
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

  const validU = !usernameProblem(username);
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
          value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))} />
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
            <div style={{ fontSize: 12, color: theme.danger }}>{usernameProblem(username)}</div>
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

function SettingsPanel({ onClose, onOpenPrivacy, onOpenRequests, onLogout, hideActivity, onToggleActivity, onOpenAccounts, onOpenDelete, onOpenBlocked, blockedCount = 0, chatLockSet, chatLockHash, onSetChatLockPassword, onTurnOffChatLock, autoOpenLockSetup, onConsumedAutoOpen }) {
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
        width: '80%', maxWidth: 340, height: '100%', position: 'relative', overflowY: 'auto',
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
            <div style={{ textAlign: 'center', fontSize: 10.5, color: theme.muted, marginTop: 18, fontWeight: 600 }}>ZChat {APP_VERSION}</div>
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
            <SettingsRow icon={<Ban size={16} />} label="Blocked accounts" onClick={onOpenBlocked} right={<span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: theme.muted }}>{blockedCount > 0 ? blockedCount : ''}<ChevronRight size={16} /></span>} />
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
  const [tiers, setTiers] = useState({});
  useEffect(() => {
    const ids = accounts.map((a) => a.id).filter(Boolean);
    if (!ids.length) return;
    supabase.from('profiles').select('id, verified').in('id', ids).then(({ data }) => {
      const next = {};
      (data || []).forEach((r) => { next[r.id] = r.verified; });
      setTiers(next);
    });
  }, [accounts.map((a) => a.id).join(',')]);
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
              <Avatar emoji={a.avatar} name={a.name} frame={a.avatar_frame} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.ink, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{a.name}</span><VerifiedBadge tier={tiers[a.id] || a.verified} custom={a.custom_badge} size={13} />{a.id === currentId && <span style={{ color: theme.coral, fontWeight: 700, flexShrink: 0 }}>&nbsp;Active</span>}
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
          <p>ZChat keeps only what it needs to run your account and deliver your messages.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>What we store</h3>
          <p>Your email, username, name, and the profile details you choose to add, such as photo, bio, pronouns, age, and country. We also store your messages, photos, videos, voice messages, reactions, follows, and group memberships so they can reach the people you send them to.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>How it's used</h3>
          <p>Only to run ZChat: showing your profile, delivering messages, sending notifications you allow, and keeping the community safe when someone reports an account. We don't sell your data or show ads.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>Who can see it</h3>
          <p>Messages are visible to the people in that chat. You decide who sees your photo, bio, age, country, and activity status in Privacy, and you can make your account private.</p>
          <h3 style={{ color: theme.ink, fontSize: 14, margin: '16px 0 4px' }}>Your controls</h3>
          <p>You can edit your profile, delete messages, block or report accounts, turn notifications off, and delete your account at any time from Settings.</p>
        </div>
      </div>
    </div>
  );
}


function FollowStatusPill({ theirId, viewerId, viewerFollowsThem, theyFollowViewer, theirIsPrivate, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (viewerFollowsThem || !theirIsPrivate || theirId === viewerId) return undefined;
    supabase.from('follows').select('status').eq('follower_id', viewerId).eq('following_id', theirId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setPending(!!data && data.status === 'pending'); });
    return () => { cancelled = true; };
  }, [theirId, viewerId, viewerFollowsThem, theirIsPrivate]);
  if (theirId === viewerId) return null;
  const state = viewerFollowsThem ? 'accepted' : pending ? 'pending' : 'none';

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    if (viewerFollowsThem || pending) {
      await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', theirId);
      setPending(false);
      onChanged(theirId, false);
    } else {
      const status = theirIsPrivate ? 'pending' : 'accepted';
      const { error } = await supabase.from('follows').insert({ follower_id: viewerId, following_id: theirId, status });
      if (!error) {
        if (status === 'pending') setPending(true);
        onChanged(theirId, status === 'accepted');
      }
    }
    setBusy(false);
  };

  return <FollowActionButton size="sm" state={state} theyFollowMe={theyFollowViewer} busy={busy} onClick={toggle} />;
}

function UserListRow({ profile, rightContent, onClick }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', cursor: onClick ? 'pointer' : 'default',
      borderBottom: `1px solid ${theme.border}`,
    }}>
      <FramedAvatar frame={profile.avatar_frame} size={40}><Avatar emoji={profile.avatar} name={profile.name} frame={profile.avatar_frame} size={40} /></FramedAvatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}<VerifiedBadge tier={profile.verified} custom={profile.custom_badge} size={12} /></div>
        <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{profile.username}</div>
      </div>
      {rightContent && <div style={{ flexShrink: 0 }}>{rightContent}</div>}
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
    let ids = [];
    if (mode === 'mutual') {
      const { data: theirs } = await supabase.from('follows').select('follower_id').eq('following_id', userId).eq('status', 'accepted');
      const { data: mine } = await supabase.from('follows').select('following_id').eq('follower_id', viewerId).eq('status', 'accepted');
      const mineSet = new Set((mine || []).map((r) => r.following_id));
      ids = (theirs || []).map((r) => r.follower_id).filter((id) => mineSet.has(id));
    } else {
      const col = mode === 'followers' ? 'following_id' : 'follower_id';
      const otherCol = mode === 'followers' ? 'follower_id' : 'following_id';
      const { data } = await supabase.from('follows').select('*').eq(col, userId).eq('status', 'accepted');
      ids = (data || []).map((r) => r[otherCol]);
    }
    if (!ids.length) { setList([]); return; }
    const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
    setList(sanitizeAvatarList(profs, viewerId));
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
    <ListModal title={mode === 'followers' ? 'Followers' : mode === 'mutual' ? 'Mutual followers' : 'Following'} onClose={onClose}>
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

  const [handled, setHandled] = useState({});
  const [followingBack, setFollowingBack] = useState({});
  const respond = async (followerId, accept) => {
    if (accept) {
      await supabase.from('follows').update({ status: 'accepted' }).eq('follower_id', followerId).eq('following_id', userId);
      const { data: mine } = await supabase.from('follows').select('status').eq('follower_id', userId).eq('following_id', followerId).maybeSingle();
      setFollowingBack((prev) => ({ ...prev, [followerId]: mine ? mine.status : 'none' }));
      setHandled((prev) => ({ ...prev, [followerId]: 'accepted' }));
    } else {
      await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', userId);
      setHandled((prev) => ({ ...prev, [followerId]: 'declined' }));
    }
  };
  const followBack = async (p) => {
    const status = p.is_private ? 'pending' : 'accepted';
    setFollowingBack((prev) => ({ ...prev, [p.id]: status }));
    const { error } = await supabase.from('follows').insert({ follower_id: userId, following_id: p.id, status });
    if (error) { setFollowingBack((prev) => ({ ...prev, [p.id]: 'none' })); return; }
    const { data: meRow } = await supabase.from('profiles').select('name, avatar').eq('id', userId).maybeSingle();
    sendPushNotification(p.id, 'ZChat', status === 'pending' ? `${meRow?.name || 'Someone'} requested to follow you` : `${meRow?.name || 'Someone'} started following you`, status === 'pending' ? '/?requests=1' : `/?profile=${userId}`, meRow?.avatar);
  };

  return (
    <ListModal title="Follow requests" onClose={onClose}>
      {requests === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color="#888" /></div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: theme.muted }}>No pending requests</div>
      ) : (
        requests.filter(({ profile: p }) => handled[p.id] !== 'declined').map(({ profile: p }) => (
          <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} rightContent={handled[p.id] === 'accepted' ? (
            <div onClick={(e) => e.stopPropagation()}>
              {followingBack[p.id] === 'accepted' || followingBack[p.id] === 'pending' ? (
                <button disabled style={{ padding: '6px 12px', borderRadius: 10, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.muted, fontWeight: 700, fontSize: 11.5, fontFamily: FONT }}>{followingBack[p.id] === 'pending' ? 'Requested' : 'Following'}</button>
              ) : (
                <button onClick={() => followBack(p)} style={{ padding: '6px 14px', borderRadius: 10, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT }}>Follow back</button>
              )}
            </div>
          ) : (
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
          )} />
        ))
      )}
    </ListModal>
  );
}

function DiscoverPanel({ myId, blockedIds, onClose, onOpenProfile }) {
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);
  const [iFollow, setIFollow] = useState(new Set());
  const [followsMe, setFollowsMe] = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').eq('is_private', false).eq('is_deleted', false).neq('id', myId).limit(40);
      const list = sanitizeAvatarList(data, myId).filter((p) => !blockedIds.has(p.id));
      setPeople(list);
      const ids = list.map((p) => p.id);
      if (!ids.length) return;
      const { data: mine } = await supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted').in('following_id', ids);
      setIFollow(new Set((mine || []).map((r) => r.following_id)));
      const { data: theirs } = await supabase.from('follows').select('follower_id').eq('following_id', myId).eq('status', 'accepted').in('follower_id', ids);
      setFollowsMe(new Set((theirs || []).map((r) => r.follower_id)));
    })();
  }, [myId]);

  const handleChanged = (theirId, nowFollowing) => {
    setIFollow((prev) => { const n = new Set(prev); if (nowFollowing) n.add(theirId); else n.delete(theirId); return n; });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 25,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Discover people</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '4px 18px', paddingBottom: 'calc(4px + env(safe-area-inset-bottom))' }}>
        {people === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>
        ) : people.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: theme.muted }}>No one to discover yet</div>
        ) : (
          people.map((p) => (
            <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} rightContent={
              <FollowStatusPill theirId={p.id} viewerId={myId} viewerFollowsThem={iFollow.has(p.id)} theyFollowViewer={followsMe.has(p.id)}
                theirIsPrivate={p.is_private} onChanged={handleChanged} />
            } />
          ))
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

const EXTRA_EMOJIS = [
  '\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F923}', '\u{1F60A}', '\u{1F60D}',
  '\u{1F618}', '\u{1F61C}', '\u{1F914}', '\u{1F60E}', '\u{1F634}', '\u{1F62D}',
  '\u{1F621}', '\u{1F973}', '\u{1F92F}', '\u{1F970}', '\u{1F607}', '\u{1F644}',
  '\u{1F62C}', '\u{1F917}', '\u{1F929}', '\u{1F61D}', '\u{1F622}', '\u{1F631}',
  '\u{1F91D}', '\u{1F44D}', '\u{1F64F}', '\u{1F4AA}', '\u{1F44F}', '\u{1F44E}',
  '\u{1F44C}', '\u{270C}\u{FE0F}', '\u{1F919}', '\u{1F44B}', '\u{1F4AF}', '\u{1F525}',
  '\u{2728}', '\u{1F389}', '\u{1F382}', '\u{2764}\u{FE0F}', '\u{1F9E1}', '\u{1F49B}',
  '\u{1F49A}', '\u{1F499}', '\u{1F49C}', '\u{1F5A4}', '\u{1F494}', '\u{1F624}',
  '\u{1F921}', '\u{1F480}', '\u{1F440}', '\u{1F648}', '\u{1F436}', '\u{1F431}'
];

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
  { key: 'new-gtacoolguy-11111', label: 'Gtacoolguy', file: '/new-gtacoolguy-11111.png', category: 'cool' },
  { key: 'new-wot-11158', label: 'Wot', file: '/new-wot-11158.png', category: 'reactions' },
  { key: 'new-huh-12583', label: 'Huh', file: '/new-huh-12583.png', category: 'reactions' },
  { key: 'new-eyes-12705', label: 'Eyes', file: '/new-eyes-12705.gif', category: 'reactions' },
  { key: 'new-penguread-13316', label: 'Penguread', file: '/new-penguread-13316.png', category: 'reactions' },
  { key: 'new-pepe-studying-1498', label: 'Pepe Studying', file: '/new-pepe-studying-1498.png', category: 'frogs' },
  { key: 'new-topaz-15004', label: 'Topaz', file: '/new-topaz-15004.png', category: 'reactions' },
  { key: 'new-fbm-sunglasses-1509', label: 'Fbm Sunglasses', file: '/new-fbm-sunglasses-1509.png', category: 'cool' },
  { key: 'new-happycat-15177', label: 'Happycat', file: '/new-happycat-15177.png', category: 'cats' },
  { key: 'new-alta-portal-turret-cry-15297', label: 'Alta Portal Turret Cry', file: '/new-alta-portal-turret-cry-15297.png', category: 'reactions' },
  { key: 'new-alta-portal-turret-atomic-15446', label: 'Alta Portal Turret Atomic', file: '/new-alta-portal-turret-atomic-15446.png', category: 'reactions' },
  { key: 'new-sunglasses-yum-15484', label: 'Sunglasses Yum', file: '/new-sunglasses-yum-15484.png', category: 'cool' },
  { key: 'new-pepestare-15959', label: 'Pepestare', file: '/new-pepestare-15959.png', category: 'frogs' },
  { key: 'new-vday-bye-17285', label: 'Vday Bye', file: '/new-vday-bye-17285.png', category: 'reactions' },
  { key: 'new-console-18794', label: 'Console', file: '/new-console-18794.png', category: 'reactions' },
  { key: 'new-coolturtle-18891', label: 'Coolturtle', file: '/new-coolturtle-18891.png', category: 'cool' },
  { key: 'new-sunglasses-sob-18994', label: 'Sunglasses Sob', file: '/new-sunglasses-sob-18994.png', category: 'cool' },
  { key: 'new-treecool-20039', label: 'Treecool', file: '/new-treecool-20039.png', category: 'cool' },
  { key: 'new-gtayoga-20562', label: 'Gtayoga', file: '/new-gtayoga-20562.png', category: 'gta' },
  { key: 'new-notsure-21094', label: 'Notsure', file: '/new-notsure-21094.png', category: 'reactions' },
  { key: 'new-simp-23337', label: 'Simp', file: '/new-simp-23337.png', category: 'reactions' },
  { key: 'new-elonsunglasses-24420', label: 'Elonsunglasses', file: '/new-elonsunglasses-24420.png', category: 'cool' },
  { key: 'new-zad-2817', label: 'Zad', file: '/new-zad-2817.png', category: 'reactions' },
  { key: 'new-peachconfused-2921', label: 'Peachconfused', file: '/new-peachconfused-2921.gif', category: 'reactions' },
  { key: 'new-thumbs-up-glasses-31522', label: 'Thumbs Up Glasses', file: '/new-thumbs-up-glasses-31522.png', category: 'cool' },
  { key: 'new-head-shaking-verticallyandroid10-31966', label: 'Head Shaking Verticallyandroid10', file: '/new-head-shaking-verticallyandroid10-31966.png', category: 'reactions' },
  { key: 'new-penguquestionmark-32092', label: 'Penguquestionmark', file: '/new-penguquestionmark-32092.gif', category: 'reactions' },
  { key: 'new-animal-jam-cool-3322', label: 'Animal Jam Cool', file: '/new-animal-jam-cool-3322.png', category: 'cool' },
  { key: 'new-imvu-01-34819', label: 'Imvu 01', file: '/new-imvu-01-34819.png', category: 'reactions' },
  { key: 'new-mochicatshy-3489', label: 'Mochicatshy', file: '/new-mochicatshy-3489.gif', category: 'cats' },
  { key: 'new-happy-ghast-pixel-38985', label: 'Happy Ghast Pixel', file: '/new-happy-ghast-pixel-38985.png', category: 'reactions' },
  { key: 'new-catsmile-39143', label: 'Catsmile', file: '/new-catsmile-39143.png', category: 'cats' },
  { key: 'new-happemonke-40236', label: 'Happemonke', file: '/new-happemonke-40236.png', category: 'reactions' },
  { key: 'new-cat-blush-42127', label: 'Cat Blush', file: '/new-cat-blush-42127.png', category: 'cats' },
  { key: 'new-animal-jam-glasses-white-42873', label: 'Animal Jam Glasses White', file: '/new-animal-jam-glasses-white-42873.png', category: 'cool' },
  { key: 'new-demonfire-ability-brawlstars-43431', label: 'Demonfire Ability Brawlstars', file: '/new-demonfire-ability-brawlstars-43431.png', category: 'reactions' },
  { key: 'new-witchycauldron-44270', label: 'Witchycauldron', file: '/new-witchycauldron-44270.png', category: 'reactions' },
  { key: 'new-kokomi-reading-4613', label: 'Kokomi Reading', file: '/new-kokomi-reading-4613.png', category: 'reactions' },
  { key: 'new-catvogue-47473', label: 'Catvogue', file: '/new-catvogue-47473.png', category: 'cats' },
  { key: 'new-sugar-apple-47824', label: 'Sugar Apple', file: '/new-sugar-apple-47824.png', category: 'reactions' },
  { key: 'new-drained-48594', label: 'Drained', file: '/new-drained-48594.png', category: 'reactions' },
  { key: 'new-behindthemask-49741', label: 'Behindthemask', file: '/new-behindthemask-49741.png', category: 'reactions' },
  { key: 'new-sad-sponge-49747', label: 'Sad Sponge', file: '/new-sad-sponge-49747.png', category: 'reactions' },
  { key: 'new-tejo-love-50557', label: 'Tejo Love', file: '/new-tejo-love-50557.png', category: 'reactions' },
  { key: 'new-crycat-53368', label: 'Crycat', file: '/new-crycat-53368.gif', category: 'cats' },
  { key: 'new-nerdpengu-54180', label: 'Nerdpengu', file: '/new-nerdpengu-54180.gif', category: 'reactions' },
  { key: 'new-pepe-dab-5450', label: 'Pepe Dab', file: '/new-pepe-dab-5450.png', category: 'frogs' },
  { key: 'new-lunasnowcreditcard-54970', label: 'Lunasnowcreditcard', file: '/new-lunasnowcreditcard-54970.png', category: 'reactions' },
  { key: 'new-huhcat-5560', label: 'Huhcat', file: '/new-huhcat-5560.png', category: 'cats' },
  { key: 'new-pengubook-56005', label: 'Pengubook', file: '/new-pengubook-56005.png', category: 'reactions' },
  { key: 'new-animal-jam-glasses-rainbow-56794', label: 'Animal Jam Glasses Rainbow', file: '/new-animal-jam-glasses-rainbow-56794.png', category: 'cool' },
  { key: 'new-akchually-57632', label: 'Akchually', file: '/new-akchually-57632.png', category: 'reactions' },
  { key: 'new-frogboo-62316', label: 'Frogboo', file: '/new-frogboo-62316.png', category: 'frogs' },
  { key: 'new-pengupitviper-64344', label: 'Pengupitviper', file: '/new-pengupitviper-64344.gif', category: 'reactions' },
  { key: 'new-yasifiedkitty-69285', label: 'Yasifiedkitty', file: '/new-yasifiedkitty-69285.png', category: 'reactions' },
  { key: 'new-cat-hat-69333', label: 'Cat Hat', file: '/new-cat-hat-69333.png', category: 'cats' },
  { key: 'new-bratz-72434', label: 'Bratz', file: '/new-bratz-72434.png', category: 'reactions' },
  { key: 'new-gabrielemod-72595', label: 'Gabrielemod', file: '/new-gabrielemod-72595.png', category: 'reactions' },
  { key: 'new-gag-mimicoctopus-73140', label: 'Gag Mimicoctopus', file: '/new-gag-mimicoctopus-73140.png', category: 'reactions' },
  { key: 'new-dead-spin-74594', label: 'Dead Spin', file: '/new-dead-spin-74594.gif', category: 'reactions' },
  { key: 'new-kitsune-77220', label: 'Kitsune', file: '/new-kitsune-77220.png', category: 'reactions' },
  { key: 'new-catsmirk-78491', label: 'Catsmirk', file: '/new-catsmirk-78491.png', category: 'cats' },
  { key: 'new-lust-79131', label: 'Lust', file: '/new-lust-79131.png', category: 'reactions' },
  { key: 'new-ehhehe-80287', label: 'Ehhehe', file: '/new-ehhehe-80287.png', category: 'reactions' },
  { key: 'new-no34-80374', label: 'No34', file: '/new-no34-80374.png', category: 'reactions' },
  { key: 'new-catwave-80386', label: 'Catwave', file: '/new-catwave-80386.png', category: 'cats' },
  { key: 'new-omaga-80492', label: 'Omaga', file: '/new-omaga-80492.gif', category: 'reactions' },
  { key: 'new-gtarobber-81329', label: 'Gtarobber', file: '/new-gtarobber-81329.png', category: 'gta' },
  { key: 'new-sunglasses-grin-82026', label: 'Sunglasses Grin', file: '/new-sunglasses-grin-82026.png', category: 'cool' },
  { key: 'new-frogbutt-82527', label: 'Frogbutt', file: '/new-frogbutt-82527.png', category: 'frogs' },
  { key: 'new-luffy-83104', label: 'Luffy', file: '/new-luffy-83104.gif', category: 'reactions' },
  { key: 'new-slaynerdy-8503', label: 'Slaynerdy', file: '/new-slaynerdy-8503.png', category: 'reactions' },
  { key: 'new-crying-86913', label: 'Crying', file: '/new-crying-86913.png', category: 'reactions' },
  { key: 'new-eugene-88351', label: 'Eugene', file: '/new-eugene-88351.png', category: 'reactions' },
  { key: 'new-alta-portal-turret-love-89822', label: 'Alta Portal Turret Love', file: '/new-alta-portal-turret-love-89822.png', category: 'reactions' },
  { key: 'new-very-cool-90098', label: 'Very Cool', file: '/new-very-cool-90098.png', category: 'cool' },
  { key: 'new-flashbang-9183', label: 'Flashbang', file: '/new-flashbang-9183.gif', category: 'reactions' },
  { key: 'new-sunglasses-smirk-91991', label: 'Sunglasses Smirk', file: '/new-sunglasses-smirk-91991.png', category: 'cool' },
  { key: 'new-shockedcat-93363', label: 'Shockedcat', file: '/new-shockedcat-93363.png', category: 'cats' },
  { key: 'new-bruhcatsad-9355', label: 'Bruhcatsad', file: '/new-bruhcatsad-9355.png', category: 'cats' },
  { key: 'new-cathappy-95818', label: 'Cathappy', file: '/new-cathappy-95818.png', category: 'cats' },
  { key: 'new-pepeglasses-97378', label: 'Pepeglasses', file: '/new-pepeglasses-97378.png', category: 'frogs' },
  { key: 'new-goldenpray-97521', label: 'Goldenpray', file: '/new-goldenpray-97521.png', category: 'reactions' },
  { key: 'new-cat-office-99163', label: 'Cat Office', file: '/new-cat-office-99163.png', category: 'cats' },
  { key: 'new-catsweat-99164', label: 'Catsweat', file: '/new-catsweat-99164.png', category: 'cats' },
  { key: 'new-growastrawberry-99169', label: 'Growastrawberry', file: '/new-growastrawberry-99169.gif', category: 'reactions' },
  { key: 'new-gtahandcuffs-99593', label: 'Gtahandcuffs', file: '/new-gtahandcuffs-99593.png', category: 'gta' },
  { key: 'zs-pepeheart', label: 'Pepeheart', file: '/zs-pepeheart.webp', category: 'memes' },
  { key: 'zs-terrified', label: 'Terrified', file: '/zs-terrified.webp', category: 'fresh' },
  { key: 'zs-bet', label: 'Bet', file: '/zs-bet.webp', category: 'memes' },
  { key: 'zs-catgoodjob', label: 'Catgoodjob', file: '/zs-catgoodjob.webp', category: 'cats' },
  { key: 'zs-vibecat', label: 'Vibecat', file: '/zs-vibecat.webp', category: 'cats' },
  { key: 'zs-surprised-cat', label: 'Surprised Cat', file: '/zs-surprised-cat.webp', category: 'cats' },
  { key: 'zs-whatulookinat', label: 'Whatulookinat', file: '/zs-whatulookinat.webp', category: 'fresh' },
  { key: 'zs-fax', label: 'Fax', file: '/zs-fax.webp', category: 'memes' },
  { key: 'zs-bunnywave', label: 'Bunnywave', file: '/zs-bunnywave.webp', category: 'animals' },
  { key: 'zs-pusheen-gasp', label: 'Pusheen Gasp', file: '/zs-pusheen-gasp.webp', category: 'cats' },
  { key: 'zs-pepe-spit', label: 'Pepe Spit', file: '/zs-pepe-spit.webp', category: 'memes' },
  { key: 'zs-sweetangel', label: 'Sweetangel', file: '/zs-sweetangel.webp', category: 'fresh' },
  { key: 'zs-catnoted', label: 'Catnoted', file: '/zs-catnoted.webp', category: 'cats' },
  { key: 'zs-stinky', label: 'Stinky', file: '/zs-stinky.webp', category: 'memes' },
  { key: 'zs-miku-sleeping', label: 'Miku Sleeping', file: '/zs-miku-sleeping.webp', category: 'anime' },
  { key: 'zs-miku-stareyes', label: 'Miku Stareyes', file: '/zs-miku-stareyes.webp', category: 'anime' },
  { key: 'zs-rabbitpeace', label: 'Rabbitpeace', file: '/zs-rabbitpeace.webp', category: 'animals' },
  { key: 'zs-puppylickies', label: 'Puppylickies', file: '/zs-puppylickies.webp', category: 'animals' },
  { key: 'zs-pusheen-sad', label: 'Pusheen Sad', file: '/zs-pusheen-sad.webp', category: 'cats' },
  { key: 'zs-catdonut', label: 'Catdonut', file: '/zs-catdonut.webp', category: 'cats' },
  { key: 'zs-catcried', label: 'Catcried', file: '/zs-catcried.webp', category: 'cats' },
  { key: 'zs-cat-slide', label: 'Cat Slide', file: '/zs-cat-slide.webp', category: 'cats' },
  { key: 'zs-pusheen-angry', label: 'Pusheen Angry', file: '/zs-pusheen-angry.webp', category: 'cats' },
  { key: 'zs-nerdcat', label: 'Nerdcat', file: '/zs-nerdcat.webp', category: 'cats' },
  { key: 'zs-doakes', label: 'Doakes', file: '/zs-doakes.webp', category: 'memes' },
  { key: 'zs-cat-cry', label: 'Cat Cry', file: '/zs-cat-cry.webp', category: 'cats' },
  { key: 'zs-miku-cool', label: 'Miku Cool', file: '/zs-miku-cool.webp', category: 'anime' },
  { key: 'zs-shocked-cat', label: 'Shocked Cat', file: '/zs-shocked-cat.webp', category: 'cats' },
  { key: 'zs-heartforyou', label: 'Heartforyou', file: '/zs-heartforyou.webp', category: 'fresh' },
  { key: 'zs-blehh-cat', label: 'Blehh Cat', file: '/zs-blehh-cat.webp', category: 'cats' },
  { key: 'zs-peachnoodles', label: 'Peachnoodles', file: '/zs-peachnoodles.webp', category: 'food' },
  { key: 'zs-duckwaddle', label: 'Duckwaddle', file: '/zs-duckwaddle.webp', category: 'animals' },
  { key: 'zs-peachpizza', label: 'Peachpizza', file: '/zs-peachpizza.webp', category: 'food' },
  { key: 'zs-reverso', label: 'Reverso', file: '/zs-reverso.webp', category: 'memes' },
  { key: 'zs-pusheen-happy', label: 'Pusheen Happy', file: '/zs-pusheen-happy.webp', category: 'cats' },
  { key: 'zs-huh', label: 'Huh', file: '/zs-huh.webp', category: 'memes' },
  { key: 'zs-cat-dead', label: 'Cat Dead', file: '/zs-cat-dead.webp', category: 'cats' },
  { key: 'zs-pusheen-annoyed', label: 'Pusheen Annoyed', file: '/zs-pusheen-annoyed.webp', category: 'cats' },
  { key: 'zs-dogparty', label: 'Dogparty', file: '/zs-dogparty.webp', category: 'animals' },
  { key: 'zs-cat-mog', label: 'Cat Mog', file: '/zs-cat-mog.webp', category: 'cats' },
  { key: 'zs-walterjam', label: 'Walterjam', file: '/zs-walterjam.webp', category: 'fresh' },
  { key: 'zs-catjamming', label: 'Catjamming', file: '/zs-catjamming.webp', category: 'cats' },
  { key: 'zs-137-catscream', label: '137 Catscream', file: '/zs-137-catscream.webp', category: 'cats' },
  { key: 'zs-redcard', label: 'Redcard', file: '/zs-redcard.webp', category: 'fresh' },
  { key: 'zs-pusheen-playful', label: 'Pusheen Playful', file: '/zs-pusheen-playful.webp', category: 'cats' },
  { key: 'zs-cat-pichi', label: 'Cat Pichi', file: '/zs-cat-pichi.webp', category: 'cats' },
  { key: 'zs-screamingcat', label: 'Screamingcat', file: '/zs-screamingcat.webp', category: 'cats' },
  { key: 'zs-pusheen-comfy', label: 'Pusheen Comfy', file: '/zs-pusheen-comfy.webp', category: 'cats' },
  { key: 'zs-peachtableflip', label: 'Peachtableflip', file: '/zs-peachtableflip.webp', category: 'fresh' },
  { key: 'zs-bunnylovegun', label: 'Bunnylovegun', file: '/zs-bunnylovegun.webp', category: 'animals' },
  { key: 'zs-plotting', label: 'Plotting', file: '/zs-plotting.webp', category: 'fresh' },
  { key: 'zs-cat-cry2', label: 'Cat Cry', file: '/zs-cat-cry2.webp', category: 'cats' },
  { key: 'zs-goofy-ah-cat', label: 'Goofy Ah Cat', file: '/zs-goofy-ah-cat.webp', category: 'cats' },
  { key: 'zs-miku-begging', label: 'Miku Begging', file: '/zs-miku-begging.webp', category: 'anime' },
  { key: 'zs-catheart', label: 'Catheart', file: '/zs-catheart.webp', category: 'cats' },
  { key: 'zs-miku-blushing', label: 'Miku Blushing', file: '/zs-miku-blushing.webp', category: 'anime' },
  { key: 'zs-bearkissphone', label: 'Bearkissphone', file: '/zs-bearkissphone.webp', category: 'animals' },
  { key: 'zs-bunnydance', label: 'Bunnydance', file: '/zs-bunnydance.webp', category: 'animals' },
  { key: 'zs-downvote', label: 'Downvote', file: '/zs-downvote.webp', category: 'fresh' },
  { key: 'zs-silly-cat', label: 'Silly Cat', file: '/zs-silly-cat.webp', category: 'cats' },
  { key: 'zs-polarbearsleep', label: 'Polarbearsleep', file: '/zs-polarbearsleep.webp', category: 'animals' },
  { key: 'zs-95-crythumbsup', label: '95 Crythumbsup', file: '/zs-95-crythumbsup.webp', category: 'fresh' },
  { key: 'zs-sniffdog', label: 'Sniffdog', file: '/zs-sniffdog.webp', category: 'animals' },
  { key: 'zs-miku-headpat', label: 'Miku Headpat', file: '/zs-miku-headpat.webp', category: 'anime' },
  { key: 'zs-dogdance', label: 'Dogdance', file: '/zs-dogdance.webp', category: 'animals' },
  { key: 'zs-whiteteddybear', label: 'Whiteteddybear', file: '/zs-whiteteddybear.webp', category: 'animals' },
  { key: 'zs-peachbreakfast', label: 'Peachbreakfast', file: '/zs-peachbreakfast.webp', category: 'fresh' },
  { key: 'zs-5577-pusheen-popcorn', label: '5577 Pusheen Popcorn', file: '/zs-5577-pusheen-popcorn.webp', category: 'cats' },
  { key: 'zs-catwave', label: 'Catwave', file: '/zs-catwave.webp', category: 'cats' },
  { key: 'zs-pepe-evil', label: 'Pepe Evil', file: '/zs-pepe-evil.webp', category: 'memes' },
  { key: 'zs-chipichapa', label: 'Chipichapa', file: '/zs-chipichapa.webp', category: 'fresh' },
  { key: 'zs-im-done', label: 'Im Done', file: '/zs-im-done.webp', category: 'fresh' },
  { key: 'zs-cat-sus', label: 'Cat Sus', file: '/zs-cat-sus.webp', category: 'cats' },
  { key: 'zs-glasses', label: 'Glasses', file: '/zs-glasses.webp', category: 'fresh' },
  { key: 'zs-miku-shocked', label: 'Miku Shocked', file: '/zs-miku-shocked.webp', category: 'anime' },
  { key: 'zs-whaat', label: 'Whaat', file: '/zs-whaat.webp', category: 'fresh' },
  { key: 'zs-bearballoons', label: 'Bearballoons', file: '/zs-bearballoons.webp', category: 'animals' },
  { key: 'zs-bunnycry', label: 'Bunnycry', file: '/zs-bunnycry.webp', category: 'animals' },
  { key: 'zs-shiba', label: 'Shiba', file: '/zs-shiba.webp', category: 'fresh' },
  { key: 'zs-bunnyheartbounce', label: 'Bunnyheartbounce', file: '/zs-bunnyheartbounce.webp', category: 'animals' },
  { key: 'zs-pusheen-laughing', label: 'Pusheen Laughing', file: '/zs-pusheen-laughing.webp', category: 'cats' },
  { key: 'zs-peace', label: 'Peace', file: '/zs-peace.webp', category: 'fresh' },
  { key: 'zs-peachcoffee', label: 'Peachcoffee', file: '/zs-peachcoffee.webp', category: 'fresh' },
  { key: 'zs-satisfiedbob', label: 'Satisfiedbob', file: '/zs-satisfiedbob.webp', category: 'fresh' },
  { key: 'zs-cat-pat', label: 'Cat Pat', file: '/zs-cat-pat.webp', category: 'cats' },
  { key: 'zs-thousandyardstare', label: 'Thousandyardstare', file: '/zs-thousandyardstare.webp', category: 'fresh' },
  { key: 'zs-6746-52-crycat', label: '6746 52 Crycat', file: '/zs-6746-52-crycat.webp', category: 'cats' },
  { key: 'zs-gigachad', label: 'Gigachad', file: '/zs-gigachad.webp', category: 'fresh' },
  { key: 'zs-catlust', label: 'Catlust', file: '/zs-catlust.webp', category: 'cats' },
  { key: 'zs-scaredhampter', label: 'Scaredhampter', file: '/zs-scaredhampter.webp', category: 'fresh' },
  { key: 'zs-soldierhamster', label: 'Soldierhamster', file: '/zs-soldierhamster.webp', category: 'fresh' },
  { key: 'zs-miku-grossedout', label: 'Miku Grossedout', file: '/zs-miku-grossedout.webp', category: 'anime' },
  { key: 'zs-bunnyphone', label: 'Bunnyphone', file: '/zs-bunnyphone.webp', category: 'animals' },
  { key: 'zs-pusheen-nervous', label: 'Pusheen Nervous', file: '/zs-pusheen-nervous.webp', category: 'cats' },
  { key: 'zs-annoyed', label: 'Annoyed', file: '/zs-annoyed.webp', category: 'fresh' },
  { key: 'zs-bunnydrool', label: 'Bunnydrool', file: '/zs-bunnydrool.webp', category: 'animals' },
  { key: 'zs-miku-angry', label: 'Miku Angry', file: '/zs-miku-angry.webp', category: 'anime' },
  { key: 'zs-pusheen-hungry', label: 'Pusheen Hungry', file: '/zs-pusheen-hungry.webp', category: 'cats' },
  { key: 'zs-drinkwater', label: 'Drinkwater', file: '/zs-drinkwater.webp', category: 'fresh' },
  { key: 'zs-cat-stare', label: 'Cat Stare', file: '/zs-cat-stare.webp', category: 'cats' },
  { key: 'zs-pusheen-donut', label: 'Pusheen Donut', file: '/zs-pusheen-donut.webp', category: 'cats' },
  { key: 'zs-peachlurk', label: 'Peachlurk', file: '/zs-peachlurk.webp', category: 'fresh' },
  { key: 'zs-pusheen-laying', label: 'Pusheen Laying', file: '/zs-pusheen-laying.webp', category: 'cats' },
  { key: 'zs-shhhhh', label: 'Shhhhh', file: '/zs-shhhhh.webp', category: 'fresh' },
  { key: 'zs-peachtoy', label: 'Peachtoy', file: '/zs-peachtoy.webp', category: 'fresh' },
  { key: 'zs-jaja', label: 'Jaja', file: '/zs-jaja.webp', category: 'fresh' },
  { key: 'zs-hammysigh', label: 'Hammysigh', file: '/zs-hammysigh.webp', category: 'fresh' },
  { key: 'zs-pusheen-blush', label: 'Pusheen Blush', file: '/zs-pusheen-blush.webp', category: 'cats' },
  { key: 'zs-beardance', label: 'Beardance', file: '/zs-beardance.webp', category: 'animals' },
  { key: 'zs-debil', label: 'Debil', file: '/zs-debil.webp', category: 'fresh' },
  { key: 'zs-thinky', label: 'Thinky', file: '/zs-thinky.webp', category: 'fresh' },
  { key: 'zs-plink', label: 'Plink', file: '/zs-plink.webp', category: 'fresh' },
  { key: 'zs-miku-leek', label: 'Miku Leek', file: '/zs-miku-leek.webp', category: 'anime' },
  { key: 'zs-tiredcat', label: 'Tiredcat', file: '/zs-tiredcat.webp', category: 'cats' },
  { key: 'zs-bunnyhearteyes', label: 'Bunnyhearteyes', file: '/zs-bunnyhearteyes.webp', category: 'animals' },
  { key: 'zs-no', label: 'No', file: '/zs-no.webp', category: 'fresh' },
  { key: 'zs-angelbunnylaugh', label: 'Angelbunnylaugh', file: '/zs-angelbunnylaugh.webp', category: 'animals' },
  { key: 'zs-shutseagullmeme', label: 'Shutseagullmeme', file: '/zs-shutseagullmeme.webp', category: 'fresh' },
  { key: 'zs-catbowtie', label: 'Catbowtie', file: '/zs-catbowtie.webp', category: 'cats' },
  { key: 'zs-catbunny', label: 'Catbunny', file: '/zs-catbunny.webp', category: 'cats' },
  { key: 'zs-bunnydance2', label: 'Bunnydance', file: '/zs-bunnydance2.webp', category: 'animals' },
  { key: 'zs-peachflowers', label: 'Peachflowers', file: '/zs-peachflowers.webp', category: 'fresh' },
  { key: 'zs-cateating', label: 'Cateating', file: '/zs-cateating.webp', category: 'cats' },
  { key: 'zs-whitebearheart', label: 'Whitebearheart', file: '/zs-whitebearheart.webp', category: 'animals' },
  { key: 'zs-pusheen-heart', label: 'Pusheen Heart', file: '/zs-pusheen-heart.webp', category: 'cats' },
  { key: 'zs-alarm-dancing-cat', label: 'Alarm Dancing Cat', file: '/zs-alarm-dancing-cat.webp', category: 'cats' },
  { key: 'zs-rahhh', label: 'Rahhh', file: '/zs-rahhh.webp', category: 'fresh' },
  { key: 'zs-kekwlaugh', label: 'Kekwlaugh', file: '/zs-kekwlaugh.webp', category: 'fresh' },
  { key: 'zs-stopit', label: 'Stopit', file: '/zs-stopit.webp', category: 'fresh' },
  { key: 'zs-pomunderattack', label: 'Pomunderattack', file: '/zs-pomunderattack.webp', category: 'fresh' },
  { key: 'zs-pusheen-thinking', label: 'Pusheen Thinking', file: '/zs-pusheen-thinking.webp', category: 'cats' },
  { key: 'zs-catsweet', label: 'Catsweet', file: '/zs-catsweet.webp', category: 'cats' },
  { key: 'zs-bearpeek', label: 'Bearpeek', file: '/zs-bearpeek.webp', category: 'animals' },
  { key: 'zs-kitty-cat-heart', label: 'Kitty Cat Heart', file: '/zs-kitty-cat-heart.webp', category: 'cats' },
  { key: 'zs-cat-feeling-love-emotionsexpression-emojisticker-animation', label: 'Cat Feeling Love Emoti', file: '/zs-cat-feeling-love-emotionsexpression-emojisticker-animation.webp', category: 'cats' },
  { key: 'zs-cat-laughing-loudly-hahahahlol-emojisticker-animation', label: 'Cat Laughing Loudly Ha', file: '/zs-cat-laughing-loudly-hahahahlol-emojisticker-animation.webp', category: 'cats' },
  { key: 'zs-sticker-29', label: 'Sticker 29', file: '/zs-sticker-29.webp', category: 'fresh' },
  { key: 'zs-sticker-30', label: 'Sticker 30', file: '/zs-sticker-30.webp', category: 'fresh' },
];

const STICKER_CATEGORIES = [
  { key: 'favorites', label: 'Favorites' },
  { key: 'goma', label: 'Goma' },
  { key: 'teto', label: 'Teto' },
  { key: 'hearts', label: 'Hearts' },
  { key: 'red', label: 'Red Pack' },
  { key: 'cute', label: 'Cute' },
  { key: 'cats', label: 'Cats' },
  { key: 'frogs', label: 'Frogs' },
  { key: 'cool', label: 'Cool' },
  { key: 'gta', label: 'GTA' },
  { key: 'reactions', label: 'Reactions' },
  { key: 'anime', label: 'Anime' },
  { key: 'animals', label: 'Animals' },
  { key: 'memes', label: 'Memes' },
  { key: 'food', label: 'Food' },
  { key: 'fresh', label: 'Fresh' },
];

function getFavoriteStickerKeys() {
  try {
    const raw = localStorage.getItem(`zchat-fav-stickers-${favoriteSync.userId || 'local'}`) ?? localStorage.getItem('zchat-fav-stickers') ?? '[]';
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}
function toggleFavoriteSticker(key) {
  const cur = getFavoriteStickerKeys();
  const adding = !cur.has(key);
  if (adding) cur.add(key); else cur.delete(key);
  writeFavoriteKeys(cur);
  if (favoriteSync.userId) {
    if (adding) supabase.from('sticker_favorites').upsert({ user_id: favoriteSync.userId, sticker_key: key }, { onConflict: 'user_id,sticker_key' }).then(() => {});
    else supabase.from('sticker_favorites').delete().eq('user_id', favoriteSync.userId).eq('sticker_key', key).then(() => {});
  }
  return cur;
}

function StickerPicker({ onPick, onClose }) {
  const { theme } = useTheme();
  const [favKeys, setFavKeys] = useState(() => getFavoriteStickerKeys());
  useEffect(() => {
    const onChange = () => setFavKeys(getFavoriteStickerKeys());
    window.addEventListener('zchat-favorites', onChange);
    return () => window.removeEventListener('zchat-favorites', onChange);
  }, []);
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
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexWrap: 'wrap', gap: 14, alignContent: 'flex-start' }}>
          {filtered.length === 0 && (
            <div style={{ width: '100%', textAlign: 'center', padding: 20, fontSize: 12.5, color: theme.muted }}>
              {category === 'favorites' ? 'No favorites yet, tap the star on any sticker' : 'No stickers found'}
            </div>
          )}
          {filtered.map((s) => (
            <div key={s.key} style={{ width: 'calc((100% - 28px) / 3)', flexShrink: 0, flexGrow: 0 }}>
              <div
                onClick={() => onPick(s)}
                style={{
                position: 'relative', width: '100%', paddingBottom: '100%', height: 0,
                borderRadius: 16, background: theme.rowBg, cursor: 'pointer',
                border: `1px solid ${theme.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 16 }}>
                  <img src={s.file} alt={s.label} loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()}
                    style={{ width: '72%', height: '72%', objectFit: 'contain' }} />
                </div>
                <div onClick={(e) => toggleFav(e, s.key)} style={{
                  position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  <Star_ size={11} color={favKeys.has(s.key) ? '#FFB800' : 'white'} filled={favKeys.has(s.key)} />
                </div>
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

function WhoReactedModal({ reactions, myId, onClose, onRemoveMine }) {
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
        profiles.map((p) => {
          const isMine = p.id === myId;
          return (
            <UserListRow key={p.id} profile={p} onClick={isMine ? () => { onRemoveMine(p.emoji); onClose(); } : undefined} rightContent={
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{p.emoji}</span>
                {isMine && <span style={{ fontSize: 10.5, color: theme.muted, fontWeight: 600 }}>Tap to remove</span>}
              </div>
            } />
          );
        })
      )}
    </ListModal>
  );
}

function MailPanel({ myId, onClose, initialMailId }) {
  const { theme } = useTheme();
  const [mails, setMails] = useState(null);
  const [selected, setSelected] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`zchat-pinned-mails-${myId}`) || '[]')); } catch { return new Set(); }
  });
  const [actionFor, setActionFor] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [confirmBulk, setConfirmBulk] = useState(null);
  const openedInitialRef = useRef(false);
  const pressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  const savePinned = (next) => {
    setPinnedIds(next);
    try { localStorage.setItem(`zchat-pinned-mails-${myId}`, JSON.stringify([...next])); } catch {}
  };
  const togglePin = (id) => {
    const next = new Set(pinnedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    savePinned(next);
    setActionFor(null);
  };

  const load = async () => {
    const { data } = await supabase.from('mails').select('*').eq('recipient_id', myId).order('created_at', { ascending: false }).limit(100);
    setMails(data || []);
  };
  useEffect(() => { load(); }, [myId]);
  useEffect(() => {
    if (!mails || !initialMailId || openedInitialRef.current) return;
    const target = mails.find((x) => x.id === initialMailId);
    if (target) { openedInitialRef.current = true; openMail(target); }
  }, [mails, initialMailId]);

  const sortedMails = mails ? [...mails].sort((a, b) => {
    const pa = pinnedIds.has(a.id) ? 1 : 0, pb = pinnedIds.has(b.id) ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return new Date(b.created_at) - new Date(a.created_at);
  }) : null;

  const openMail = async (m) => {
    if (longPressFiredRef.current) { longPressFiredRef.current = false; return; }
    setSelected(m);
    if (!m.read) {
      await supabase.from('mails').update({ read: true }).eq('id', m.id);
      setMails((prev) => prev.map((x) => (x.id === m.id ? { ...x, read: true } : x)));
    }
  };

  const startPress = (m) => {
    longPressFiredRef.current = false;
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => { longPressFiredRef.current = true; setActionFor(m); }, 420);
  };
  const cancelPress = () => clearTimeout(pressTimerRef.current);

  const deleteMail = async (id) => {
    setMails((prev) => (prev || []).filter((x) => x.id !== id));
    const next = new Set(pinnedIds); next.delete(id); savePinned(next);
    setActionFor(null);
    if (selected?.id === id) setSelected(null);
    await supabase.from('mails').delete().eq('id', id);
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const MailIcon = ({ m, size }) => <MailBadgeIcon type={m.type} size={size} badgeTier={badgeTierFromTitle(m.title)} />;
  const allIds = (mails || []).map((m) => m.id);
  const togglePick = (id) => {
    setPicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const markAllRead = async () => {
    const unread = (mails || []).filter((m) => !m.read).map((m) => m.id);
    if (!unread.length) return;
    setMails((prev) => prev.map((m) => ({ ...m, read: true })));
    playUiSound('tap');
    await supabase.from('mails').update({ read: true }).in('id', unread);
  };
  const deletePicked = async () => {
    const ids = [...picked];
    if (!ids.length) return;
    setMails((prev) => prev.filter((m) => !picked.has(m.id)));
    setPicked(new Set());
    setPicking(false);
    setConfirmBulk(null);
    playUiSound('delete');
    await supabase.from('mails').delete().in('id', ids);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 34, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={() => (selected ? setSelected(null) : onClose())} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink, flex: 1 }}>{selected ? 'Message' : picking ? `${picked.size} selected` : 'Mail'}</div>
        {selected ? (
          <Trash2 size={18} style={{ cursor: 'pointer', color: theme.danger, flexShrink: 0 }} onClick={() => setConfirmDeleteId(selected.id)} />
        ) : picking ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div role="button" onClick={() => setPicked(picked.size === allIds.length ? new Set() : new Set(allIds))} style={{ fontSize: 13, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>{picked.size === allIds.length && allIds.length ? 'None' : 'All'}</div>
            <Trash2 size={18} style={{ cursor: picked.size ? 'pointer' : 'default', color: picked.size ? theme.danger : theme.muted }} onClick={() => picked.size && setConfirmBulk(picked.size)} />
            <X size={18} style={{ cursor: 'pointer', color: theme.ink }} onClick={() => { setPicking(false); setPicked(new Set()); }} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div role="button" aria-label="Mark all read" onClick={markAllRead} style={{ cursor: 'pointer', color: theme.ink, display: 'flex' }}><Check size={19} /></div>
            <div role="button" aria-label="Select mails" onClick={() => { setPicking(true); playUiSound('tap'); }} style={{ fontSize: 13, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Select</div>
          </div>
        )}
      </div>
      {selected ? (
        <div key={selected.id} className="zchat-mail-zoom" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 20px', paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <MailIcon m={selected} size={44} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: theme.ink }}>{selected.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: theme.muted, fontWeight: 600 }}>{mailSenderName(selected.type)} <VerifiedTick size={12} /> <span style={{ fontWeight: 400 }}>· {new Date(selected.created_at).toLocaleString()}</span></div>
            </div>
          </div>
          <div style={{ fontSize: 14, color: theme.ink, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selected.body}</div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 10px', paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}>
          {sortedMails === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>
          ) : sortedMails.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>No mail yet</div>
          ) : (
            sortedMails.map((m) => (
              <div key={m.id} onClick={() => (picking ? togglePick(m.id) : openMail(m))}
                onPointerDown={() => !picking && startPress(m)} onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerCancel={cancelPress}
                style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', cursor: 'pointer', borderRadius: 18, marginBottom: 8,
                border: `1px solid ${picked.has(m.id) ? theme.coral : m.read ? theme.border : `${theme.coral}55`}`,
                boxShadow: m.read ? 'none' : `0 6px 18px ${theme.coral}14`,
                background: picked.has(m.id) ? `${theme.coral}1A` : pinnedIds.has(m.id) ? `${theme.coral}0F` : m.read ? theme.panelBg : theme.rowBg,
              }}>
                {picking && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${picked.has(m.id) ? theme.coral : theme.border}`, background: picked.has(m.id) ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {picked.has(m.id) && <Check size={13} color="white" strokeWidth={4} />}
                  </div>
                )}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <MailIcon m={m} size={42} />
                  {!m.read && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: theme.coral, border: `2px solid ${theme.panelBg}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {pinnedIds.has(m.id) && <Pin_ size={11} />}
                    <div style={{ fontWeight: m.read ? 600 : 800, fontSize: 13.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</div>
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.body}</div>
                </div>
                <div style={{ fontSize: 10.5, color: theme.muted, flexShrink: 0 }}>{timeAgo(m.created_at)}</div>
              </div>
            ))
          )}
        </div>
      )}
      {actionFor && (
        <div onClick={() => setActionFor(null)} style={{
          position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 2,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} className="zchat-fade">
          <div onClick={(e) => e.stopPropagation()} style={{
            background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '10px 8px', width: '100%', maxWidth: 460,
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
          }}>
            <div onClick={() => togglePin(actionFor.id)} style={{
              padding: '13px 10px', fontSize: 14, fontWeight: 600, color: theme.ink, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}><Pin_ size={16} /> {pinnedIds.has(actionFor.id) ? 'Unpin' : 'Pin'}</div>
            <div onClick={() => { setConfirmDeleteId(actionFor.id); setActionFor(null); }} style={{
              padding: '13px 10px', fontSize: 14, fontWeight: 600, color: theme.danger, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            }}><Trash2 size={16} color={theme.danger} /> Delete</div>
          </div>
        </div>
      )}
      {confirmDeleteId && (
        <ConfirmDialog title="Delete this mail?" body="It will be removed from your mailbox. This can't be undone."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={async () => { const id = confirmDeleteId; setConfirmDeleteId(null); await deleteMail(id); }} />
      )}
      {confirmBulk != null && (
        <ConfirmDialog
          title={`Delete ${confirmBulk} ${confirmBulk === 1 ? 'mail' : 'mails'}?`}
          body="They will be removed from your mail box."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmBulk(null)}
          onConfirm={deletePicked} />
      )}
    </div>
  );
}

function ArchivedChatsPanel({ conversations, onClose, onOpenChat, onUnarchive }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 26,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Archived chats</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '4px 18px', paddingBottom: 'calc(4px + env(safe-area-inset-bottom))' }}>
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
  { key: 'zc01', label: 'Wall 1', file: '/wallpaper-zc01.webp' },
  { key: 'zc02', label: 'Wall 2', file: '/wallpaper-zc02.webp' },
  { key: 'zc03', label: 'Wall 3', file: '/wallpaper-zc03.webp' },
  { key: 'zc04', label: 'Wall 4', file: '/wallpaper-zc04.webp' },
  { key: 'zc05', label: 'Wall 5', file: '/wallpaper-zc05.webp' },
  { key: 'zc06', label: 'Wall 6', file: '/wallpaper-zc06.webp' },
  { key: 'zc07', label: 'Wall 7', file: '/wallpaper-zc07.webp' },
  { key: 'zc08', label: 'Wall 8', file: '/wallpaper-zc08.webp' },
  { key: 'zc09', label: 'Wall 9', file: '/wallpaper-zc09.webp' },
  { key: 'zc10', label: 'Wall 10', file: '/wallpaper-zc10.webp' },
  { key: 'zc11', label: 'Wall 11', file: '/wallpaper-zc11.webp' },
  { key: 'zc12', label: 'Wall 12', file: '/wallpaper-zc12.webp' },
  { key: 'zc13', label: 'Wall 13', file: '/wallpaper-zc13.webp' },
  { key: 'zc14', label: 'Wall 14', file: '/wallpaper-zc14.webp' },
  { key: 'zc15', label: 'Wall 15', file: '/wallpaper-zc15.webp' },
  { key: 'zc16', label: 'Wall 16', file: '/wallpaper-zc16.webp' },
  { key: 'zc17', label: 'Wall 17', file: '/wallpaper-zc17.webp' },
  { key: 'zc18', label: 'Wall 18', file: '/wallpaper-zc18.webp' },
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


const REPORT_REASONS = [
  'Spam',
  'Nudity or sexual activity',
  'Hate speech or symbols',
  'Bullying or harassment',
  'False information',
  'Scam or fraud',
  'Violence or dangerous organizations',
  'Sale of illegal or regulated goods',
  'Suicide, self harm or eating disorders',
  "I just don't like it",
  'Something else',
];


async function sendReportMail(reportedUserId, reasonLabel) {
  if (!reportedUserId) return;
  const { data: sent, error } = await supabase.rpc('send_report_warning', { p_reported: reportedUserId, p_reason: reasonLabel });
  if (!error && sent) sendPushNotification(reportedUserId, 'ZChat', 'Account warning. Open your mail to see why.', '/?mail=1');
}

function ReportReasonPicker({ reportedUserId, onCancel, onSubmit }) {
  const { theme } = useTheme();
  const [submitting, setSubmitting] = useState(null);

  const choose = async (reason) => {
    if (submitting) return;
    setSubmitting(reason);
    await onSubmit(reason);
    if (reportedUserId) await sendReportMail(reportedUserId, reason);
    setSubmitting(null);
  };

  return (
    <div onClick={onCancel} style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 91,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '20px 18px', width: '100%', maxWidth: 460,
        maxHeight: '78vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 3 }}>Report</div>
        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 14 }}>Why are you reporting this?</div>
        {REPORT_REASONS.map((r) => (
          <div key={r} onClick={() => choose(r)} style={{
            padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, fontSize: 14, fontWeight: 600, color: theme.ink,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {r}
            {submitting === r ? <Spinner size={14} color={theme.ink} /> : <ChevronRight size={16} color={theme.muted} />}
          </div>
        ))}
        <div onClick={onCancel} style={{ textAlign: 'center', padding: '16px 0 4px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
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
    p.pronouns ? p.pronouns : null,
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
            <Avatar emoji={conv.otherProfile.avatar} name={otherName} frame={conv.otherProfile.avatar_frame} size={56} />
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
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 8, padding: '0 24px', lineHeight: 1.5 }}><RichText text={p.bio} onMention={onOpenProfile} /></div>
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
        <ReportReasonPicker
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
      <path d="M10.7 12.4 L19.5 19.5 L12.4 10.7 Z" fill={color} />
      <circle cx="8" cy="8" r="5.4" fill={color} />
      <circle cx="6.2" cy="6.2" r="1.8" fill="white" opacity="0.4" />
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
      const { data } = await searchAccounts(val.trim());
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
    if (error || !group) { setCreating(false); setErr(friendlyError(error, "Couldn't create the group. Try again.")); return; }
    const { error: memberErr } = await supabase.from('group_members').insert({ group_id: group.id, user_id: myId, role: 'admin', added_by: myId });
    if (memberErr) { setCreating(false); setErr(friendlyError(memberErr, "Couldn't create the group. Try again.")); return; }
    if (selected.length) {
      const { error: inviteErr } = await supabase.from('group_members').insert(selected.slice(0, 49).map((p) => ({ group_id: group.id, user_id: p.id, role: 'member', added_by: myId })));
      if (inviteErr) { setCreating(false); setErr(friendlyError(inviteErr, "Couldn't add those people. Try again.")); return; }
      const { data: creator } = await getProfile(myId);
      selected.slice(0, 49).forEach((p) => sendPushNotification(p.id, 'ZChat', `${creator?.name || 'Someone'} added you to ${group.name}`, `/?group=${group.id}`, creator?.avatar));
    }
    await supabase.from('messages').insert({
      sender_id: myId, group_id: group.id, type: 'system',
      content: selected.length ? `Group created and ${selected.map((p) => p.name).join(', ')} added` : 'Group created',
    });
    setCreating(false);
    onCreated(group);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 40, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={() => (step === 'details' ? setStep('members') : onClose())} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>{step === 'members' ? `Add participants${selected.length ? ` (${selected.length})` : ''}` : 'New group'}</div>
      </div>

      {step === 'members' ? (
        <>
          {selected.length > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 18px', overflowX: 'auto' }}>
              {selected.map((p) => (
                <div key={p.id} onClick={() => toggleSelect(p)} style={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={48} />
                  <div style={{ fontSize: 10, color: theme.muted, marginTop: 2, maxWidth: 48, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
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
                <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
                  <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected.find((s) => s.id === p.id) ? theme.coral : theme.border}`,
                  background: selected.find((s) => s.id === p.id) ? theme.coral : 'transparent',
                }} />
              </div>
            ))}
          </div>
          <div style={{ padding: 18, paddingBottom: 'calc(18px + env(safe-area-inset-bottom))' }}>
            <button onClick={() => setStep('details')} disabled={selected.length === 0} style={primaryBtn(theme, selected.length === 0)}>Next</button>
          </div>
        </>
      ) : (
        <div style={{ padding: 20, paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', flex: 1, overflowY: 'auto' }}>
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
    <div style={{ position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 40, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Group info</div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '14px 18px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
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
            {group.bio ? <RichText text={group.bio} onMention={onOpenProfile} /> : (isAdmin ? 'Add a group bio' : 'No bio yet')}
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
              <Avatar emoji={m.profile.avatar} name={m.profile.name} frame={m.profile.avatar_frame} size={40} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: theme.ink, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{m.profile.name}</span><VerifiedBadge tier={m.profile.verified} custom={m.profile.custom_badge} size={12} />{m.user_id === myId && <span style={{ color: theme.muted, fontWeight: 500, flexShrink: 0 }}>(you)</span>}
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
              <MoreVertical size={16} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }}
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
      <div style={{ padding: 18, paddingBottom: 'calc(18px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.border}` }}>
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
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !existingIds.includes(u.id) && !selected.find((s) => s.id === u.id)));
    }, 300);
  };

  const toggleSelect = (p) => {
    setSelected((prev) => (prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: theme.panelBg, zIndex: 45, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', paddingTop: 'calc(16px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
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
            <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
              <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', border: `2px solid ${selected.find((s) => s.id === p.id) ? theme.coral : theme.border}`,
              background: selected.find((s) => s.id === p.id) ? theme.coral : 'transparent',
            }} />
          </div>
        ))}
      </div>
      <div style={{ padding: 18, paddingBottom: 'calc(18px + env(safe-area-inset-bottom))' }}>
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

const PROFILE_LINK_REGEX = /^https?:\/\/[^\s/]+\/\?profile=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const CHAT_HISTORY_LIMIT = 800;
const PUBLIC_SITE_URL = 'https://getzchat.com';
function siteOrigin() {
  if (typeof window === 'undefined') return PUBLIC_SITE_URL;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return window.location.origin;
  return PUBLIC_SITE_URL;
}

function profileShareLink(profileId) {
  const origin = siteOrigin();
  return `${origin}/?profile=${profileId}`;
}

function parseProfileLink(text) {
  if (!text) return null;
  const match = String(text).trim().match(PROFILE_LINK_REGEX);
  return match ? match[1] : null;
}

async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch {}
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const sharedProfileCache = new Map();

function ProfileLinkCard({ profileId, onOpen }) {
  const { theme } = useTheme();
  const [p, setP] = useState(() => sharedProfileCache.get(profileId));

  useEffect(() => {
    if (sharedProfileCache.has(profileId)) { setP(sharedProfileCache.get(profileId)); return undefined; }
    let cancelled = false;
    getProfile(profileId)
      .then(({ data }) => {
        const value = data && !data.is_deleted ? data : null;
        sharedProfileCache.set(profileId, value);
        if (!cancelled) setP(value);
      })
      .catch(() => { if (!cancelled) setP(null); });
    return () => { cancelled = true; };
  }, [profileId]);

  if (p === undefined) {
    return (
      <div style={{ width: 210, height: 176, borderRadius: 16, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={16} color={theme.muted} />
      </div>
    );
  }
  if (p === null) {
    return (
      <div style={{ width: 210, borderRadius: 16, background: theme.rowBg, padding: '18px 14px', textAlign: 'center', fontSize: 12.5, color: theme.muted }}>
        This profile is not available
      </div>
    );
  }
  const photo = p.hide_photo ? '' : p.avatar;
  const hasPhoto = typeof photo === 'string' && photo.startsWith('http');
  return (
    <div style={{ width: 210, borderRadius: 16, overflow: 'hidden', background: theme.rowBg }}>
      <div style={{ height: 110, position: 'relative', background: hasPhoto ? '#000' : colorForName(p.name) }}>
        {hasPhoto ? (
          <img src={photo} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>
            {(p.name || '?').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 10px 6px', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)', color: 'white' }}>
          <div style={{ fontSize: 14, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
          <div style={{ fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
        </div>
      </div>
      <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(p); }} style={{
        margin: 8, padding: '8px 0', borderRadius: 12, background: theme.coral, color: 'white', textAlign: 'center',
        fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
      }}>View profile</div>
    </div>
  );
}

function ShareProfileSheet({ profile, myId, conversations, groups, onSend, onClose }) {
  const { theme } = useTheme();
  const link = profileShareLink(profile.id);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(link)}`;
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef(null);
  const toastTimer = useRef(null);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const userItem = (p) => ({ key: 'u-' + p.id, kind: 'user', id: p.id, name: p.name, avatar: p.avatar, sub: '@' + p.username });
  const groupItem = (g) => ({ key: 'g-' + g.id, kind: 'group', id: g.id, name: g.name, avatar: g.avatar, sub: 'Group' });

  const baseItems = [
    ...(conversations || []).filter((c) => !c.otherProfile.is_deleted).map((c) => userItem(c.otherProfile)),
    ...(groups || []).map(groupItem),
  ];

  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      const people = sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !u.is_deleted).map(userItem);
      const term = val.trim().toLowerCase();
      const groupMatches = (groups || []).filter((g) => (g.name || '').toLowerCase().includes(term)).map(groupItem);
      setResults([...groupMatches, ...people]);
    }, 300);
  };

  const list = q.trim().length >= 2 ? results : baseItems;
  const isSelected = (item) => selected.some((s) => s.key === item.key);
  const toggle = (item) => setSelected((prev) => (prev.some((s) => s.key === item.key) ? prev.filter((s) => s.key !== item.key) : [...prev, item]));

  const doCopy = async () => {
    const ok = await copyTextToClipboard(link);
    flash(ok ? 'Link copied' : "Couldn't copy the link");
  };

  const doNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.name} on ZChat`, text: `Check out ${profile.name} (@${profile.username}) on ZChat`, url: link });
      } catch {}
      return;
    }
    doCopy();
  };

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    await onSend(selected, note.trim(), link);
    setSending(false);
    flash(selected.length === 1 ? `Sent to ${selected[0].name}` : `Sent to ${selected.length} chats`);
    setSelected([]);
    setNote('');
  };

  const actionBtn = (icon, label, onClick) => (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}>{icon}</div>
      <span style={{ fontSize: 11.5, color: theme.muted, fontWeight: 600 }}>{label}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.55)', zIndex: 60,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: '26px 26px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Share profile</div>
          <X size={20} style={{ cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        </div>

        <div style={{ margin: '0 18px', borderRadius: 24, background: theme.coral, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 10 }}>
            <img src={qrUrl} alt="" width={170} height={170} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ display: 'block', width: 170, height: 170 }} />
          </div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 18, marginTop: 12 }}>@{profile.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 2 }}>{profile.name} on ZChat</div>
        </div>

        <div style={{ display: 'flex', padding: '16px 18px 6px' }}>
          {actionBtn(<Copy size={20} />, 'Copy link', doCopy)}
          {actionBtn(<Share2 size={20} />, 'Share to', doNativeShare)}
          {actionBtn(<Download size={20} />, 'Save QR', () => silentDownload(qrUrl, `zchat-${profile.username}-qr.png`))}
        </div>

        <div style={{ padding: '12px 18px 4px', fontSize: 13, fontWeight: 800, color: theme.ink }}>Send in ZChat</div>
        <div style={{ padding: '4px 18px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
            <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search people or groups" autoCapitalize="none"
              style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
          </div>
        </div>
        <div style={{ padding: '0 12px', paddingBottom: selected.length ? 8 : 'calc(18px + env(safe-area-inset-bottom))' }}>
          {list.length === 0 && (
            <div style={{ textAlign: 'center', padding: 18, fontSize: 13, color: theme.muted }}>
              {q.trim().length >= 2 ? 'No one found' : 'Your chats will show here'}
            </div>
          )}
          {list.map((item) => (
            <div key={item.key} onClick={() => toggle(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', cursor: 'pointer', borderRadius: 12 }}>
              {item.kind === 'group' ? <GroupAvatar avatar={item.avatar} name={item.name} size={42} /> : <Avatar emoji={item.avatar} name={item.name} frame={item.avatar_frame} size={42} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isSelected(item) ? theme.coral : theme.border}`, background: isSelected(item) ? theme.coral : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isSelected(item) && <Check size={13} color="white" />}</div>
            </div>
          ))}
        </div>

        {selected.length > 0 && (
          <div style={{
            position: 'sticky', bottom: 0, background: theme.panelBg, borderTop: `1px solid ${theme.border}`,
            padding: '10px 18px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Write a message"
              style={{ ...inputStyle(theme), padding: '10px 14px', fontSize: 14, borderRadius: 22 }} />
            <button onClick={send} disabled={sending} style={{
              padding: '10px 18px', borderRadius: 22, border: 'none', background: theme.coral, color: 'white',
              fontWeight: 700, fontSize: 13.5, cursor: sending ? 'default' : 'pointer', fontFamily: FONT, flexShrink: 0,
            }}>{sending ? <Spinner size={13} /> : (selected.length > 1 ? `Send (${selected.length})` : 'Send')}</button>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'sticky', bottom: selected.length ? 70 : 16, margin: '0 auto', width: 'fit-content',
            background: theme.ink, color: theme.panelBg, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 20,
          }} className="zchat-fade">{toast}</div>
        )}
      </div>
    </div>
  );
}

function PosterIconButton({ onClick, children, label }) {
  return (
    <div role="button" aria-label={label} onClick={onClick} style={{
      width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.38)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0,
    }}>{children}</div>
  );
}

function ProfilePanel({ profile, isSelf, userId, isOnline, onClose, onReport, onSaved, onOpenSettings, onOpenProfile, onMessage, isBlocked, onBlock, onUnblock, shareConversations, shareGroups, onShareToChats, canCall, onCall, onOpenHighlight, meProfile, onOpenCollection }) {
  const { theme } = useTheme();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || '');
  const [age, setAge] = useState(profile.age != null ? String(profile.age) : '');
  const [country, setCountry] = useState(profile.country || '');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [avatar, setAvatar] = useState(profile.avatar || '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const cachedStats = profileStatsCache.get(profile.id) || {};
  const [followState, setFollowState] = useState(cachedStats.followState || 'none');
  const [theyFollowMe, setTheyFollowMe] = useState(!!cachedStats.theyFollowMe);
  const [followerCount, setFollowerCount] = useState(cachedStats.followers ?? null);
  const [followingCount, setFollowingCount] = useState(cachedStats.following ?? null);
  const [mutualCount, setMutualCount] = useState(cachedStats.mutual ?? null);
  const [postCount, setPostCount] = useState(cachedStats.posts ?? null);
  const [ownedRewards, setOwnedRewards] = useState([]);
  const [tryOnFrame, setTryOnFrame] = useState(null);
  useEffect(() => {
    let alive = true;
    supabase.from('user_rewards').select('kind, reward_key, expires_at').eq('user_id', profile.id).then(({ data, error }) => {
      if (!alive || error) return;
      setOwnedRewards(data || []);
    });
    return () => { alive = false; };
  }, [profile.id]);
  const profileFrameUrl = useFrameUrl(profile.avatar_frame);
  useEffect(() => {
    let cancelled = false;
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).then(({ count, error }) => {
      if (cancelled) return;
      const value = error ? 0 : (count || 0);
      setPostCount(value);
      saveProfileStats(profile.id, { posts: value });
    });
    return () => { cancelled = true; };
  }, [profile.id]);
  const [followBusy, setFollowBusy] = useState(false);
  const [username, setUsername] = useState(profile.username || '');
  const [displayName, setDisplayName] = useState(profile.name || '');
  const [socialLinks, setSocialLinks] = useState(() => readSocialLinks(profile.social_links).map((l) => ({ url: l.url, title: l.title })));
  const [pronouns, setPronouns] = useState(profile.pronouns || '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp || '');
  const [usernameErr, setUsernameErr] = useState('');
  const [listModal, setListModal] = useState(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const bioRef = useRef(null);
  const [bioMention, setBioMention] = useState(null);

  const pickBioMention = (picked) => {
    if (!bioMention) return;
    const { value, caret } = applyMention(bio, bioMention, picked.username, BIO_MAX);
    setBio(value);
    setBioMention(null);
    requestAnimationFrame(() => {
      const el = bioRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  const cooldownDaysLeft = (() => {
    if (!profile.username_changed_at) return 0;
    const days = 7 - (Date.now() - new Date(profile.username_changed_at).getTime()) / 86400000;
    return days > 0 ? Math.ceil(days) : 0;
  })();

  useEffect(() => {
    let cancelled = false;
    const loadCounts = async () => {
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted');
      if (!cancelled && followers != null) { setFollowerCount((prev) => (prev === followers ? prev : followers)); saveProfileStats(profile.id, { followers }); }
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('status', 'accepted');
      if (!cancelled && following != null) { setFollowingCount((prev) => (prev === following ? prev : following)); saveProfileStats(profile.id, { following }); }
      if (isSelf) return;
      const { data } = await supabase.from('follows').select('status').eq('follower_id', userId).eq('following_id', profile.id).maybeSingle();
      const nextState = data ? data.status : 'none';
      if (!cancelled) { setFollowState((prev) => (prev === nextState ? prev : nextState)); saveProfileStats(profile.id, { followState: nextState }); }
      const { data: back } = await supabase.from('follows').select('status').eq('follower_id', profile.id).eq('following_id', userId).eq('status', 'accepted').maybeSingle();
      if (!cancelled) { setTheyFollowMe(!!back); saveProfileStats(profile.id, { theyFollowMe: !!back }); }
      const { data: myFollowing } = await supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted');
      const ids = (myFollowing || []).map((r) => r.following_id).filter((id) => id !== profile.id).slice(0, 300);
      if (!ids.length) { if (!cancelled) { setMutualCount(0); saveProfileStats(profile.id, { mutual: 0 }); } return; }
      const { count: mutual } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted').in('follower_id', ids);
      if (!cancelled) { setMutualCount(mutual || 0); saveProfileStats(profile.id, { mutual: mutual || 0 }); }
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
      if (followState === 'accepted') setFollowerCount((c) => Math.max(0, (c || 0) - 1));
      setFollowState('none');
    } else {
      const status = profile.is_private ? 'pending' : 'accepted';
      await supabase.from('follows').insert({ follower_id: userId, following_id: profile.id, status });
      if (status === 'accepted') setFollowerCount((c) => (c || 0) + 1);
      setFollowState(status);
      const viewerProfile = (await getProfile(userId)).data;
      sendPushNotification(profile.id, 'ZChat', status === 'pending' ? `${viewerProfile?.name || 'Someone'} requested to follow you` : `${viewerProfile?.name || 'Someone'} started following you`, status === 'pending' ? '/?requests=1' : `/?profile=${userId}`, viewerProfile?.avatar);
    }
    setFollowBusy(false);
  };

  const startEditing = () => {
    setBio(profile.bio || '');
    setAge(profile.age != null ? String(profile.age) : '');
    setCountry(profile.country || '');
    setAvatar(profile.avatar || '');
    setUsername(profile.username || '');
    setDisplayName(profile.name || '');
    setSocialLinks(readSocialLinks(profile.social_links).map((l) => ({ url: l.url, title: l.title })));
    setPronouns(profile.pronouns || '');
    setWhatsapp(profile.whatsapp || '');
    setUsernameErr('');
    setBioMention(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setUsername(profile.username || '');
    setUsernameErr('');
    setBioMention(null);
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
    const cleanName = displayName.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
    if (cleanName.length < 1) { setUsernameErr('Add your name.'); return; }
    const fields = { name: cleanName, bio: bio.slice(0, BIO_MAX), avatar, age: Number.isFinite(parsedAge) ? parsedAge : null, country: country.trim() || null };
    if (cleanUsername !== profile.username) {
      if (cooldownDaysLeft > 0) { setUsernameErr(`You can change your username again in ${cooldownDaysLeft} day${cooldownDaysLeft === 1 ? '' : 's'}.`); return; }
      const problem = usernameProblem(cleanUsername);
      if (problem) { setUsernameErr(`${problem}.`); return; }
      fields.username = cleanUsername;
      fields.username_changed_at = new Date().toISOString();
    }
    setUsernameErr('');
    setSaving(true);
    const cleanLinks = readSocialLinks(socialLinks).map((l) => ({ url: l.url, title: l.title || null }));
    const phone = cleanWhatsappNumber(whatsapp);
    let { data, error } = await updateProfile(profile.id, { ...fields, social_links: cleanLinks, whatsapp: phone || null, pronouns: pronouns.trim().slice(0, 40) || null });
    if (error && /pronouns/i.test(error.message || '')) {
      ({ data, error } = await updateProfile(profile.id, { ...fields, social_links: cleanLinks, whatsapp: phone || null }));
    }
    if (error && /social_links|whatsapp|column/i.test(error.message || '')) {
      ({ data, error } = await updateProfile(profile.id, fields));
    }
    setSaving(false);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      setUsernameErr(msg.includes('duplicate') || msg.includes('unique') ? 'That username is already taken.' : friendlyError(error, "Couldn't save your profile. Try again."));
      return;
    }
    if (data) { notifyBioMentions(data, profile.bio, data.bio); onSaved(data); setEditing(false); }
  };

  if (profile.is_deleted && !isSelf) {
    return (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 18,
      }} className="zchat-fade">
        <div style={{
          background: theme.panelBg, borderRadius: 28, padding: 30, textAlign: 'center', position: 'relative',
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
    );
  }

  const canSeeDetails = isSelf || !profile.is_private || followState === 'accepted';
  const shownPhoto = editing ? avatar : ((isSelf || !profile.hide_photo) ? profile.avatar : '');
  const hasPhoto = typeof shownPhoto === 'string' && shownPhoto.startsWith('http');
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase() || '?';
  const lastSeenText = !isSelf && !isOnline && !profile.hide_activity ? formatLastSeen(profile.last_seen) : null;
  const statusText = isOnline ? 'Online now' : lastSeenText;
  const countryName = profile.country ? (COUNTRIES.find(([c]) => c === profile.country)?.[1] || profile.country) : null;
  const infoBits = canSeeDetails ? [
    countryName && (isSelf || !profile.hide_country) ? `${countryFlag(profile.country)} ${countryName}` : null,
    profile.age != null && (isSelf || !profile.hide_age) ? `${profile.age}` : null,
  ].filter(Boolean) : [];
  const showBio = canSeeDetails && profile.bio && (isSelf || !profile.hide_bio);
  const labelStyle = { fontSize: 11.5, color: theme.muted, marginBottom: 5, fontWeight: 800, letterSpacing: '0.04em' };
  const pillBtn = (primary) => ({
    flex: 1, height: 46, padding: '0 10px', borderRadius: 16, cursor: 'pointer', fontFamily: FONT, fontSize: 13.5, fontWeight: 700, boxSizing: 'border-box', whiteSpace: 'nowrap', minWidth: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    border: primary ? 'none' : `1px solid ${theme.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'}`,
    background: primary ? `linear-gradient(135deg, ${theme.coral}, #8b5cf6)` : (theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'),
    color: primary ? 'white' : theme.ink,
    boxShadow: primary ? `0 6px 16px ${theme.coral}40` : 'none',
  });

  const stat = (value, label, onClick) => (
    <div onClick={onClick} style={{ flex: 1, textAlign: 'center', cursor: onClick ? 'pointer' : 'default', padding: '4px 2px' }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', minHeight: 24 }}>{value == null ? '' : formatCount(value)}</div>
      <div style={{ fontSize: 13, color: theme.muted, fontWeight: 500, marginTop: 1 }}>{label}</div>
    </div>
  );
  const statDivider = <div style={{ width: 1, height: 16, background: theme.border, alignSelf: 'center' }} />;
  const pageBg = theme.dark ? '#000' : '#fff';
  const glassFill = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
  const glassCircle = { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, background: theme.dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.65)', border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}`, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };
  const statTile = (value, label, onClick) => (
    <div role={onClick ? 'button' : undefined} onClick={onClick} style={{ padding: '11px 4px', borderRadius: 18, textAlign: 'center', cursor: onClick ? 'pointer' : 'default', background: glassFill, border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.06)'}` }}>
      <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', minHeight: 23 }}>{value == null ? '' : formatCount(value)}</div>
      <div style={{ fontSize: 11.5, color: theme.muted, fontWeight: 600, marginTop: 1 }}>{label}</div>
    </div>
  );

  const sheetRow = (icon, label, onClick, danger) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 10px', cursor: 'pointer',
      fontSize: 14.5, fontWeight: 600, color: danger ? theme.danger : theme.ink,
    }}>{icon}{label}</div>
  );

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget && !editing) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(5,8,16,0.6)', display: 'flex', justifyContent: 'center' }} className="zchat-fade">
    <div style={{ width: '100%', maxWidth: 560, height: '100%', background: theme.dark ? '#000' : '#fff', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
        {editing ? (
        <div style={{ position: 'relative', height: 'min(42vh, 320px)', minHeight: 240, background: hasPhoto ? '#000' : colorForName(profile.name), overflow: 'hidden' }}>
          {hasPhoto ? (
            <img src={shownPhoto} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 80, fontSize: 130, fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: FONT }}>{initial}</div>
          )}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.82) 100%)' }} />

          <div style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', left: 14, right: 14, display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
            <PosterIconButton label="Close" onClick={editing ? cancelEditing : onClose}><ArrowLeft size={19} /></PosterIconButton>
            {!editing && (
              <div style={{ display: 'flex', gap: 8 }}>
                <PosterIconButton label="Share profile" onClick={() => setShowShare(true)}><Share2 size={17} /></PosterIconButton>
                {isSelf ? (
                  <PosterIconButton label="Settings" onClick={onOpenSettings}><SettingsIcon size={17} /></PosterIconButton>
                ) : (
                  <PosterIconButton label="More" onClick={() => setShowMore(true)}><MoreVertical size={18} /></PosterIconButton>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 20px 18px', color: 'white', zIndex: 1 }}>
            {editing ? (
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 24, cursor: 'pointer',
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontSize: 13.5, fontWeight: 700,
              }}>
                {avatarUploading ? <Spinner size={14} /> : <Camera size={16} />}
                Change photo
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </label>
            ) : (
              <>
                {statusText && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, marginBottom: 8,
                    background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: 20,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#31D158' : '#B9BCC3' }} />
                    {statusText}
                  </div>
                )}
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.45)', wordBreak: 'break-word' }}>{profile.name}<VerifiedBadge tier={profile.verified} custom={profile.custom_badge} size={24} /></div>
                <div style={{ fontSize: 13.5, marginTop: 4, color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  @{profile.username}{profile.pronouns ? ` · ${profile.pronouns}` : ''}{infoBits.map((b) => ` · ${b}`).join('')}
                </div>
              </>
            )}
          </div>
        </div>
        ) : (
          <div style={{ position: 'relative', paddingBottom: 4 }}>
            <div style={{ position: 'absolute', left: -60, right: -60, top: -60, height: 540, overflow: 'hidden', pointerEvents: 'none' }}>
              {hasPhoto
                ? <img src={shownPhoto} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(1.25)', opacity: theme.dark ? 0.95 : 0.8, transform: 'scale(1.08)' }} />
                : <div style={{ position: 'absolute', inset: 0, background: colorForName(profile.name), filter: 'blur(50px)', opacity: theme.dark ? 0.75 : 0.5 }} />}
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 480, pointerEvents: 'none', background: `linear-gradient(180deg, ${theme.dark ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)'} 0%, rgba(0,0,0,0) 45%, ${pageBg} 100%)` }} />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
              <div role="button" aria-label="Close" onClick={onClose} style={glassCircle}><ArrowLeft size={19} /></div>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, display: 'flex', alignItems: 'center', minWidth: 0, maxWidth: '55%' }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.username}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {isSelf && <div role="button" aria-label="Share profile" onClick={() => setShowShare(true)} style={glassCircle}><Share2 size={17} /></div>}
                {isSelf
                  ? <div role="button" aria-label="Settings" onClick={onOpenSettings} style={glassCircle}><SettingsIcon size={17} /></div>
                  : <div role="button" aria-label="More" onClick={() => setShowMore(true)} style={glassCircle}><MoreVertical size={18} /></div>}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', marginTop: 22 }}>
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                {(() => {
                  const fspec = AVATAR_FRAMES[profile.avatar_frame];
                  const photo = fspec ? Math.round(Math.min(178, Math.max(120, 200 / fspec.scale))) : 176;
                  const off = (200 - photo) / 2;
                  const fw = photo * (fspec ? fspec.scale : 1);
                  return (
                    <>
                      {!fspec && (
                        <>
                          <div style={{ position: 'absolute', inset: -9, borderRadius: '50%', background: 'conic-gradient(#f59e0b, #ef4444, #d946ef, #6366f1, #22d3ee, #f59e0b)', animation: 'zchat-frame-spin 6s linear infinite' }} />
                          <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: pageBg }} />
                        </>
                      )}
                      <div style={{ position: 'absolute', left: off, top: off, width: photo, height: photo, borderRadius: '50%', overflow: 'hidden', background: hasPhoto ? '#000' : colorForName(profile.name), boxShadow: '0 20px 60px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {hasPhoto
                          ? <img src={shownPhoto} alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <span style={{ fontSize: photo * 0.46, fontWeight: 800, color: 'rgba(255,255,255,0.92)', fontFamily: FONT }}>{initial}</span>}
                      </div>
                      {fspec && profileFrameUrl && (
                        <img src={profileFrameUrl} alt="" draggable={false} aria-hidden="true" style={{ ...frameMaskStyle(fspec), position: 'absolute', width: fw, height: fw, left: 100 - fw * (fspec.centerX ?? 0.5), top: 100 - fw * fspec.centerY, pointerEvents: 'none', zIndex: 2, maxWidth: 'none', animation: (theme.dark ? fspec.animation : (fspec.animationLight || fspec.animation)) || 'none' }} />
                      )}
                      {isOnline && (
                        <div style={{ position: 'absolute', right: off + photo * 0.06, bottom: off + photo * 0.06, width: 26, height: 26, borderRadius: '50%', background: '#22c55e', border: `5px solid ${pageBg}`, zIndex: 3 }} />
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 16, padding: '0 20px' }}>
              <div style={{ fontSize: 27, fontWeight: 900, color: theme.ink, letterSpacing: '-0.02em', lineHeight: 1.15, wordBreak: 'break-word' }}>{profile.name}<VerifiedBadge tier={profile.verified} custom={profile.custom_badge} size={22} /></div>
              <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4 }}>
                @{profile.username}{profile.pronouns ? ` · ${profile.pronouns}` : ''}{infoBits.map((b) => ` · ${b}`).join('')}
              </div>
              {statusText && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, marginTop: 10, padding: '4px 11px', borderRadius: 14, color: isOnline ? '#22c55e' : theme.muted, background: isOnline ? 'rgba(34,197,94,0.12)' : glassFill }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOnline ? '#22c55e' : theme.muted }} />
                  {statusText}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ paddingTop: editing ? 16 : 14, paddingLeft: editing ? 18 : 14, paddingRight: editing ? 18 : 14, paddingBottom: 'calc(28px + env(safe-area-inset-bottom))', maxWidth: 520, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {editing ? (
            <div>
              <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}><span>NAME</span><span style={{ fontWeight: 600 }}>{displayName.length}/{NAME_MAX}</span></div>
              <input value={displayName} maxLength={NAME_MAX} onChange={(e) => setDisplayName(e.target.value.slice(0, NAME_MAX))}
                style={{ ...inputStyle(theme), marginBottom: 12 }} placeholder="Name" />
              <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}><span>USERNAME</span><span style={{ fontWeight: 600 }}>{username.length}/{USERNAME_MAX}</span></div>
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <span style={{ position: 'absolute', left: 14, top: 13, color: theme.muted, fontSize: 16 }}>@</span>
                <input value={username} maxLength={USERNAME_MAX} onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, USERNAME_MAX)); setUsernameErr(''); }}
                  style={{ ...inputStyle(theme), paddingLeft: 26 }} autoCapitalize="none" />
              </div>
              {username !== profile.username && usernameProblem(username) && <div style={{ fontSize: 11.5, color: theme.danger, marginBottom: 8 }}>{usernameProblem(username)}</div>}
              {cooldownDaysLeft > 0 && (
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 10 }}>You can change your username again in {cooldownDaysLeft} day{cooldownDaysLeft === 1 ? '' : 's'}.</div>
              )}
              {usernameErr && <div style={{ fontSize: 11.5, color: theme.danger, marginBottom: 10 }}>{usernameErr}</div>}
              <SocialLinksEditor links={socialLinks} onChange={setSocialLinks} whatsapp={whatsapp} onWhatsappChange={setWhatsapp} labelStyle={labelStyle} />
              <div style={{ ...labelStyle, marginTop: 10, display: 'flex', justifyContent: 'space-between' }}><span>BIO</span><span style={{ fontWeight: 600, color: bio.length >= BIO_MAX ? theme.danger : theme.muted }}>{bio.length}/{BIO_MAX}</span></div>
              <textarea ref={bioRef} value={bio}
                onChange={(e) => { const v = e.target.value.slice(0, BIO_MAX); setBio(v); setBioMention(getActiveMention(v, e.target.selectionStart)); }}
                onClick={(e) => setBioMention(getActiveMention(e.target.value, e.target.selectionStart))}
                placeholder="Tell people about yourself, type @ to mention someone"
                style={{ ...inputStyle(theme), height: 76, resize: 'none', fontFamily: FONT, marginBottom: bioMention ? 0 : 14 }} />
              {bioMention && (
                <div style={{ margin: '6px 0 14px' }}>
                  <MentionSuggestions query={bioMention.query} excludeIds={[profile.id]} myId={userId} onPick={pickBioMention} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>AGE</div>
                  <input value={age} onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                    onBlur={() => { if (age && parseInt(age, 10) < 12) setAge('12'); }}
                    inputMode="numeric" placeholder="Age" style={inputStyle(theme)} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>COUNTRY</div>
                  <div onClick={() => setShowCountryPicker(true)} style={{ ...inputStyle(theme), cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {country ? <span style={{ fontSize: 18 }}>{countryFlag(country)}</span> : <span style={{ color: theme.muted }}>Choose</span>}
                  </div>
                </div>
              </div>
              <PronounsPicker value={pronouns} onChange={setPronouns} labelStyle={labelStyle} />
              <div style={{ height: 18 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cancelEditing} style={pillBtn(false)}>Cancel</button>
                <button onClick={save} disabled={saving || avatarUploading} style={pillBtn(true)}>
                  {(saving || avatarUploading) ? <Spinner size={14} /> : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {canSeeDetails && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                  {statTile(postCount, 'Posts', null)}
                  {statTile(followerCount, 'Followers', () => setListModal('followers'))}
                  {statTile(followingCount, 'Following', () => setListModal('following'))}
                </div>
              )}
              {isSelf ? (
                <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={startEditing} style={pillBtn(true)}><Edit3 size={15} /> Edit profile</button>
                  <button onClick={() => setShowShare(true)} style={pillBtn(false)}><Share2 size={15} /> Share</button>
                  <button onClick={() => setShowPrivacySettings(true)} aria-label="Privacy" style={{ ...pillBtn(false), flex: '0 0 46px', padding: 0 }}><Lock size={16} /></button>
                </div>
                <div role="button" onClick={onOpenCollection} style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 16, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,88,12,0.12))', border: '1px solid rgba(245,158,11,0.35)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 11, background: 'linear-gradient(135deg, #f59e0b, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={18} color="#1a0f02" /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: theme.ink }}>Collection</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>Avatar frames and name charms</div>
                  </div>
                  <ChevronRight size={18} color={theme.muted} />
                </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex' }}>
                    <FollowActionButton state={followState} theyFollowMe={theyFollowMe} busy={followBusy} onClick={toggleFollow} />
                  </div>
                  {followState === 'accepted' ? (
                    <button onClick={() => onMessage(profile)} style={pillBtn(false)}><ChatBubbleIcon size={17} /> Message</button>
                  ) : (
                    <button onClick={() => setShowShare(true)} style={pillBtn(false)}><Share2 size={15} /> Share</button>
                  )}
                  {canCall && followState === 'accepted' && (
                    <>
                      <button onClick={() => onCall('voice')} aria-label="Voice call" style={{ ...pillBtn(false), flex: '0 0 44px', padding: 0 }}><Phone size={17} /></button>
                      <button onClick={() => onCall('video')} aria-label="Video call" style={{ ...pillBtn(false), flex: '0 0 44px', padding: 0 }}><VideoIcon size={18} /></button>
                    </>
                  )}
                </div>
              )}

              {reportSent && (
                <div style={{ marginTop: 12, fontSize: 12.5, color: theme.teal, fontWeight: 700, textAlign: 'center' }} className="zchat-fade">
                  Report sent. Thanks for flagging this.
                </div>
              )}

              {canSeeDetails ? (
                <>
                  {showBio && (
                    <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.55, marginTop: 16, wordBreak: 'break-word', textAlign: 'center', padding: '0 10px' }}>
                      <RichText text={profile.bio} onMention={(p) => onOpenProfile(sanitizeAvatar(p, userId))} />
                    </div>
                  )}
                  <ProfileSocialRow links={profile.social_links} whatsapp={profile.whatsapp} />
                  <ProfileCollectionShowcase profile={profile} rewards={ownedRewards} isSelf={isSelf} onPreview={(k) => setTryOnFrame(k)} onOpenCollection={onOpenCollection} />
                  {!isSelf && mutualCount > 0 && (
                    <div role="button" onClick={() => setListModal('mutual')} style={{ textAlign: 'center', fontSize: 12.5, color: theme.muted, marginTop: 12, cursor: 'pointer' }}>
                      Followed by <b style={{ color: theme.ink }}>{formatCount(mutualCount)}</b> {mutualCount === 1 ? 'person' : 'people'} you follow
                    </div>
                  )}
                  {!editing && <ProfileHighlights profile={profile} isSelf={isSelf} userId={userId} onOpenHighlight={(h) => onOpenHighlight && onOpenHighlight(h, profile)} />}
                  {!editing && <ProfilePosts profile={profile} isSelf={isSelf} userId={userId} meProfile={meProfile} />}
                </>
              ) : (
                <div style={{ marginTop: 20, padding: '22px 16px', textAlign: 'center', borderRadius: 20, background: theme.rowBg }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: '50%', margin: '0 auto 10px', border: `1.5px solid ${theme.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted,
                  }}><Lock size={20} /></div>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: theme.ink, marginBottom: 4 }}>This account is private</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>
                    Follow {profile.name} to see their bio, followers, and more.
                  </div>
                </div>
              )}

              {isSelf && (
                <div style={{ marginTop: 18, textAlign: 'center' }}>
                  {!showEmail ? (
                    <span onClick={() => setShowEmail(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: theme.coralDeep, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                      <Mail size={13} /> Show your email
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: theme.ink }}>{profile.email}</span>
                      <span onClick={() => setShowEmail(false)} style={{ color: theme.coralDeep, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>Hide</span>
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showMore && (
        <div onClick={() => setShowMore(false)} style={{
          position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.5)', zIndex: 58,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }} className="zchat-fade">
          <div onClick={(e) => e.stopPropagation()} style={{
            background: theme.panelBg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '10px 10px',
            paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
          }}>
            {sheetRow(<Share2 size={18} />, 'Share profile', () => { setShowMore(false); setShowShare(true); })}
            {sheetRow(<Copy size={18} />, 'Copy profile link', async () => { await copyTextToClipboard(profileShareLink(profile.id)); setShowMore(false); })}
            {!reportSent && sheetRow(<Flag size={18} color={theme.danger} />, 'Report account', () => { setShowMore(false); setReportOpen(true); }, true)}
            {sheetRow(<Ban size={18} color={theme.danger} />, isBlocked ? 'Unblock account' : 'Block account', () => { setShowMore(false); if (isBlocked) onUnblock(profile.id); else onBlock(profile.id); }, true)}
            <div onClick={() => setShowMore(false)} style={{ textAlign: 'center', padding: '12px 0 4px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
          </div>
        </div>
      )}
      {tryOnFrame && (
        <FrameTryOnPage me={profile} frameKey={tryOnFrame} onClose={() => setTryOnFrame(null)} action={null} />
      )}
      {showShare && (
        <ShareProfileSheet profile={profile} myId={userId} conversations={shareConversations} groups={shareGroups}
          onSend={onShareToChats} onClose={() => setShowShare(false)} />
      )}
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
      {reportOpen && !reportSent && (
        <ReportReasonPicker onCancel={() => setReportOpen(false)} onSubmit={async (reason) => { await onReport(profile, reason); setReportSent(true); setReportOpen(false); }} />
      )}
    </div>
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

const MENTION_REGEX = /(^|[^a-zA-Z0-9._@])@([a-zA-Z0-9._]{3,30})/g;
function splitMentions(text) {
  const out = [];
  let last = 0;
  let match;
  MENTION_REGEX.lastIndex = 0;
  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const handle = match[2].replace(/\.+$/, '');
    if (handle.length < 3 || handle.length > USERNAME_MAX) continue;
    const at = match.index + match[1].length;
    if (at > last) out.push(text.slice(last, at));
    out.push({ mention: handle.toLowerCase(), raw: '@' + handle });
    last = at + 1 + handle.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function extractMentions(text) {
  const found = new Set();
  if (!text) return found;
  splitMentions(text).forEach((seg) => { if (seg && seg.mention) found.add(seg.mention); });
  return found;
}

const mentionCache = new Map();
const mentionPending = new Set();
const mentionListeners = new Set();
let mentionTimer = null;
function requestMentionProfiles(names) {
  names.forEach((n) => { if (n && !mentionCache.has(n)) mentionPending.add(n); });
  if (!mentionPending.size || mentionTimer) return;
  mentionTimer = setTimeout(async () => {
    const batch = [...mentionPending];
    mentionPending.clear();
    mentionTimer = null;
    const { data, error } = await supabase.from('profiles').select('*').in('username', batch);
    if (error) return;
    batch.forEach((n) => mentionCache.set(n, null));
    (data || []).forEach((p) => { if (!p.is_deleted && p.username) mentionCache.set(p.username.toLowerCase(), p); });
    mentionListeners.forEach((fn) => fn());
  }, 50);
}

function useMentionProfiles(names) {
  const [, setTick] = useState(0);
  const key = names.slice().sort().join(',');
  useEffect(() => {
    if (!key) return undefined;
    const listener = () => setTick((t) => t + 1);
    mentionListeners.add(listener);
    requestMentionProfiles(key.split(','));
    return () => { mentionListeners.delete(listener); };
  }, [key]);
}

function RichText({ text, onMention }) {
  const { theme } = useTheme();
  const linked = linkifyText(text);
  const pieces = [];
  (Array.isArray(linked) ? linked : [linked]).forEach((part) => {
    if (typeof part === 'string') splitMentions(part).forEach((seg) => pieces.push(seg));
    else pieces.push(part);
  });
  const names = [...new Set(pieces.filter((seg) => seg && seg.mention).map((seg) => seg.mention))];
  useMentionProfiles(names);
  return (
    <>
      {pieces.map((seg, i) => {
        if (!seg || !seg.mention) return <React.Fragment key={i}>{seg}</React.Fragment>;
        const found = mentionCache.get(seg.mention);
        if (!found) return <React.Fragment key={i}>{seg.raw}</React.Fragment>;
        return (
          <span key={i}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (onMention) onMention(found); }}
            style={{ color: theme.dark ? theme.gold : theme.coralDeep, fontWeight: 700, cursor: onMention ? 'pointer' : 'default' }}>
            {seg.raw}
          </span>
        );
      })}
    </>
  );
}

function getActiveMention(text, caret) {
  if (caret == null) return null;
  const before = text.slice(0, caret);
  const match = before.match(/(^|[^a-zA-Z0-9._@])@([a-zA-Z0-9._]{0,30})$/);
  if (!match) return null;
  return { query: match[2].toLowerCase(), start: caret - match[2].length - 1, end: caret };
}

function applyMention(text, mention, username, maxLen) {
  const before = text.slice(0, mention.start);
  const after = text.slice(mention.end).replace(/^[a-zA-Z0-9._]*/, '').replace(/^\s/, '');
  const insert = `@${username} `;
  const value = (before + insert + after).slice(0, maxLen);
  return { value, caret: Math.min(before.length + insert.length, value.length) };
}

function MentionSuggestions({ query, priority, excludeIds, myId, onPick }) {
  const { theme } = useTheme();
  const [remote, setRemote] = useState([]);
  useEffect(() => {
    let cancelled = false;
    if (!query) { setRemote([]); return undefined; }
    const timer = setTimeout(async () => {
      const pattern = query.replace(/[\\%_]/g, (c) => `\\${c}`) + '%';
      const { data } = await supabase.from('profiles').select('id, name, username, avatar, hide_photo, is_deleted')
        .ilike('username', pattern).not('is_deleted', 'is', true).limit(8);
      if (!cancelled) setRemote(data || []);
    }, 180);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const excluded = new Set(excludeIds || []);
  const seen = new Set();
  const list = [];
  const consider = (p) => {
    if (!p || !p.username || p.is_deleted || excluded.has(p.id) || seen.has(p.id)) return;
    const uname = p.username.toLowerCase();
    if (query && !uname.startsWith(query) && !(p.name || '').toLowerCase().startsWith(query)) return;
    seen.add(p.id);
    list.push(sanitizeAvatar(p, myId));
  };
  (priority || []).forEach(consider);
  remote.forEach(consider);
  if (!list.length) return null;

  return (
    <div className="zchat-fade" style={{
      background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)', maxHeight: 208, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {list.slice(0, 8).map((p, i) => (
        <div key={p.id}
          onPointerDown={(e) => e.preventDefault()}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer',
            borderTop: i ? `1px solid ${theme.border}` : 'none',
          }}>
          <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={30} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
            <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
          </div>
        </div>
      ))}
    </div>
  );
}


function MessageBubble({ m, isMe, onDelete, selectionMode, selected, onToggleSelect, onLongPress, onOpenImage, onOpenVideo, reactions, onReact, onOpenWhoReacted, replyPreview, onSwipeReply, onJumpToMessage, highlighted, senderLabel, senderAvatar, hideReadStatus, onOpenSenderProfile, canModerate, onOpenMention, mentionsMe, onOpenStoryRef, onCallBack, onOpenSticker, tightBelow, senderVerified, onOpenPost, tightAbove, senderFrame, senderCustomBadge }) {
  const { theme, fontScale, chatTheme, bubbleColor } = useTheme();
  const [hover, setHover] = useState(false);
  const [burstHeart, setBurstHeart] = useState(false);
  const lastTapRef = useRef(0);
  const pressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const activePointerRef = useRef(null);
  const [mouseOver, setMouseOver] = useState(false);
  const dragXRef = useRef(0);
  const bubbleWrapRef = useRef(null);
  const replyArrowRef = useRef(null);
  const draggingRef = useRef(false);
  const swipedPastThresholdRef = useRef(false);
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const bubbleColorSpec = BUBBLE_COLORS[bubbleColor] || BUBBLE_COLORS.default;
  const sharedProfileId = m.type === 'text' && !m.deleted ? parseProfileLink(m.content) : null;
  const sharedPostId = m.type === 'text' && !m.deleted ? parsePostLink(m.content) : null;
  const linkPreviewUrl = m.type === 'text' && !m.deleted && !sharedPostId && !sharedProfileId ? firstPreviewableUrl(m.content) : null;
  const inlineTime = m.type === 'text' && !m.deleted && !!m.content && !sharedProfileId && !sharedPostId && !(m.story_id && (m.content === STORY_MENTION_TEXT || m.content === STORY_GROUP_MENTION_TEXT || m.content === STORY_SHARE_TEXT));

  if (m.type === 'system' && parseCallLog(m.content)) {
    return <CallLogBubble m={m} isMe={isMe} onCallBack={onCallBack} />;
  }
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
      onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end, overlayUrl: m.overlay_url });
    }
    lastTapRef.current = now;
  };

  const clearPressTimer = () => { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; setHover(false); };

  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    activePointerRef.current = e.pointerId;
    setHover(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    swipedPastThresholdRef.current = false;
    if (bubbleWrapRef.current) bubbleWrapRef.current.style.transition = 'none';
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      onLongPress(m.id);
    }, 420);
  };
  const handlePointerMove = (e) => {
    if (activePointerRef.current !== e.pointerId) return;
    if (e.pointerType === 'mouse' && (e.buttons & 1) !== 1) { finalizeDrag(); return; }
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearPressTimer();
    if (!m.deleted && !selectionMode && Math.abs(dx) > Math.abs(dy) && dx > 0) {
      draggingRef.current = true;
      const clamped = Math.min(dx, 60);
      dragXRef.current = clamped;
      if (bubbleWrapRef.current) bubbleWrapRef.current.style.transform = `translateX(${clamped}px)`;
      if (replyArrowRef.current) replyArrowRef.current.style.opacity = Math.min(1, clamped / 40);
      swipedPastThresholdRef.current = clamped >= 40;
    }
  };
  const finalizeDrag = () => {
    activePointerRef.current = null;
    clearPressTimer();
    if (draggingRef.current) {
      const shouldFire = swipedPastThresholdRef.current;
      draggingRef.current = false;
      dragXRef.current = 0;
      if (bubbleWrapRef.current) {
        bubbleWrapRef.current.style.transition = 'transform 0.2s ease';
        bubbleWrapRef.current.style.transform = 'translateX(0px)';
      }
      if (replyArrowRef.current) replyArrowRef.current.style.opacity = 0;
      if (shouldFire) onSwipeReply(m);
    }
  };

  const bubbleBg = m.deleted ? theme.rowBg : (isMe ? (bubbleColorSpec.me || theme.bubbleMe) : (bubbleColorSpec.them || theme.bubbleThem));

  return (
    <div
      id={`msg-${m.id}`}
      style={{
        display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 8, marginBottom: groupedEntries.length > 0 && !m.deleted ? 14 : tightBelow ? 1 : 6,
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
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setMouseOver(false); finalizeDrag(); }}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setMouseOver(true); }}
      onContextMenu={(e) => { if (isTouchDevice()) return; e.preventDefault(); if (!selectionMode) onLongPress(m.id); }}
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
      {isMe && !m.deleted && !selectionMode && canHoverPointer() && (
        <Trash2 size={14} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, visibility: mouseOver ? 'visible' : 'hidden', marginTop: 4 }}
          onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} />
      )}
      {senderLabel && !m.deleted && (
        tightBelow
          ? <div style={{ width: 24, flexShrink: 0 }} />
          : (
            <div onClick={(e) => { e.stopPropagation(); onOpenSenderProfile && onOpenSenderProfile(); }} style={{ cursor: onOpenSenderProfile ? 'pointer' : 'default', flexShrink: 0, alignSelf: 'flex-end' }}>
              <Avatar emoji={senderAvatar} name={senderLabel} frame={senderFrame} size={24} />
            </div>
          )
      )}
      <div style={{ position: 'relative', maxWidth: senderLabel ? 'calc(80% - 30px)' : '80%' }}>
        {!selectionMode && !m.deleted && (
          <div ref={replyArrowRef} style={{
            position: 'absolute', top: 10, left: -30, transform: 'translateY(-50%)',
            opacity: 0, pointerEvents: 'none',
          }}>
            <Reply size={16} color={theme.coral} />
          </div>
        )}
        <div ref={bubbleWrapRef} style={{ transform: 'translateX(0px)' }}>
        <div style={{ position: 'relative' }}>
        <div style={glass(theme, {
          background: bubbleBg,
          borderRadius: 19,
          borderBottomRightRadius: isMe && !m.deleted ? 5 : 19,
          borderBottomLeftRadius: !isMe && !m.deleted ? 5 : 19,
          padding: m.type === 'text' || m.deleted ? '6px 11px' : 4,
          border: m.deleted ? `1px dashed ${theme.border}` : mentionsMe ? `1.5px solid ${theme.coral}` : `1px solid ${theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
          boxShadow: m.deleted ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
          ...(m.deleted ? {} : bubbleThemeStyle(chatTheme, isMe, theme)),
        })}>
          {senderLabel && !m.deleted && !tightAbove && (
            <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.coralDeep, marginBottom: 3, padding: m.type !== 'text' ? '0 4px' : 0 }}>
              {senderLabel}<VerifiedBadge tier={senderVerified} custom={senderCustomBadge} size={11} />
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
                {replyPreview.type === 'sticker' && replyPreview.content && replyPreview.content.startsWith('/')
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><img src={replyPreview.content} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />Sticker</span>
                  : replyPreview.type === 'text' ? (parseProfileLink(replyPreview.content) ? 'Profile' : replyPreview.content) : replyPreview.type === 'image' ? 'Photo' : replyPreview.type === 'audio' ? 'Voice message' : replyPreview.type === 'sticker' ? 'Sticker' : 'Video'}
              </div>
            </div>
          )}
          {m.deleted ? (
            <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>This message was deleted</div>
          ) : (
            <>
              {m.type === 'image' && <ChatImage src={m.media_url} caption={m.content} />}
              {m.type === 'video' && (
                <div onClick={(e) => { e.stopPropagation(); onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end, overlayUrl: m.overlay_url }); }} style={{ position: 'relative', width: 240, maxWidth: '100%', height: 240, borderRadius: 14, overflow: 'hidden', marginBottom: m.content ? 4 : 2, background: '#000', cursor: 'pointer' }}>
                  <video src={m.media_url ? `${m.media_url}#t=0.1` : undefined} preload="metadata" playsInline muted onContextMenu={(e) => e.preventDefault()} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                  {m.overlay_url && <img src={m.overlay_url} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />}
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
              {m.type === 'audio' && <div style={{ paddingBottom: 14 }}><AudioBubble url={m.media_url} isMe={isMe} /></div>}
              {m.type === 'sticker' && (
                m.content && m.content.startsWith('/') ? (
                  <div onClick={(e) => { if (selectionMode || !onOpenSticker) return; e.stopPropagation(); onOpenSticker(m); }} style={{ cursor: 'pointer' }}>
                    <LoopingSticker src={m.content} size={96} className="zchat-wave-pop" style={{ display: 'block', marginBottom: 18 }} />
                  </div>
                ) : (
                  <div className="zchat-wave-pop" style={{ fontSize: 64, lineHeight: 1, padding: '4px 10px' }}>{m.content}</div>
                )
              )}
              {m.story_id && <StoryRefCard m={m} isMe={isMe} onOpen={onOpenStoryRef} />}
              {sharedPostId && (
                <div style={{ paddingTop: 2, paddingBottom: 16 }}>
                  <PostLinkCard postId={sharedPostId} onOpen={onOpenPost} />
                </div>
              )}
              {sharedProfileId && (
                <div style={{ paddingTop: 2, paddingBottom: 16 }}>
                  <ProfileLinkCard profileId={sharedProfileId} onOpen={onOpenMention} />
                </div>
              )}
              {m.type === 'text' && m.content && !sharedProfileId && !sharedPostId && !(m.story_id && (m.content === STORY_MENTION_TEXT || m.content === STORY_GROUP_MENTION_TEXT || m.content === STORY_SHARE_TEXT)) && (
                <div style={{ fontSize: 15 * fontScale, color: theme.ink, wordBreak: 'break-word', lineHeight: 1.32, display: 'flow-root' }}>
                  <RichText text={m.content} onMention={onOpenMention} />
                  {linkPreviewUrl && <LinkPreviewCard url={linkPreviewUrl} />}
                  <span data-msg-time="true" style={{ float: 'right', display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 10, marginTop: 7, marginBottom: -3, height: 14, lineHeight: 1, position: 'relative', top: 1, userSelect: 'none' }}>
                    {m.edited && <span style={{ fontSize: 8, color: theme.muted, fontStyle: 'italic' }}>edited</span>}
                    <span style={{ fontSize: 9, color: theme.muted }}>{time}</span>
                    {isMe && <StatusTicks status={(!hideReadStatus && m.read) ? 'read' : m.delivered ? 'delivered' : 'sent'} />}
                  </span>
                </div>
              )}
            </>
          )}
          {!m.deleted && !inlineTime && (
            <div style={{
              position: 'absolute', bottom: 4, right: 8, display: 'flex', alignItems: 'center', gap: 3,
              background: m.type === 'text' ? 'none' : 'rgba(0,0,0,0.4)', borderRadius: 8,
              padding: m.type === 'text' ? 0 : '1px 5px',
            }}>
              {m.edited && <span style={{ fontSize: 8, color: m.type === 'text' ? theme.muted : 'rgba(255,255,255,0.85)', fontStyle: 'italic' }}>edited</span>}
              <span style={{ fontSize: 9, color: m.type === 'text' ? theme.muted : 'rgba(255,255,255,0.85)' }}>{time}</span>
              {isMe && <StatusTicks status={(!hideReadStatus && m.read) ? 'read' : m.delivered ? 'delivered' : 'sent'} />}
            </div>
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
      const { data } = await searchAccounts(val.trim());
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
              <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
                <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
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

function EnableNotificationsBanner({ onEnable, onDismiss, top, inline }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: inline ? 'relative' : 'absolute', top: inline ? 'auto' : top, left: inline ? 'auto' : 10, right: inline ? 'auto' : 10, zIndex: 14, maxWidth: inline ? 'none' : 340, margin: inline ? '8px 12px 0' : '0 auto',
      background: theme.panelBg, borderRadius: 14, padding: '10px 12px', boxShadow: '0 6px 20px rgba(0,0,0,0.22)',
      border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 10,
    }} className="zchat-fade">
      <Bell size={16} color={theme.coral} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, fontSize: 11, color: theme.ink, fontWeight: 600 }}>Get notified when someone messages you</div>
      <span onClick={onEnable} style={{ fontSize: 11.5, color: theme.coral, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Turn on</span>
      <X size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onDismiss} />
    </div>
  );
}

function NotificationPermissionBanner({ onOpenHelp, onDismiss, top, inline }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: inline ? 'relative' : 'absolute', top: inline ? 'auto' : top, left: inline ? 'auto' : 10, right: inline ? 'auto' : 10, zIndex: 14, maxWidth: inline ? 'none' : 340, margin: inline ? '8px 12px 0' : '0 auto',
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

function InstallAppBanner({ onOpenHelp, onInstallNow, canInstallDirectly, onDismiss, top, inline }) {
  const { theme } = useTheme();
  return (
    <div style={{
      position: inline ? 'relative' : 'absolute', top: inline ? 'auto' : top, left: inline ? 'auto' : 10, right: inline ? 'auto' : 10, zIndex: 14, maxWidth: inline ? 'none' : 340, margin: inline ? '8px 12px 0' : '0 auto',
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
    ? ['Tap the Share icon at the bottom of Safari (the square with an arrow)', 'Scroll down and tap "Add to Home Screen"', 'Tap "Add" in the top right', 'ZChat now opens full screen from your home screen, just like any other app']
    : ['Tap the three dot menu in the top right of your browser', 'Tap "Add to Home screen" or "Install app"', 'Confirm by tapping "Add" or "Install"', 'ZChat now opens full screen from your home screen, just like any other app'];
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(20,16,14,0.5)', zIndex: 97,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
    }} className="zchat-fade">
      <div style={{ background: theme.panelBg, borderRadius: 22, padding: 22, width: '100%', maxWidth: 320 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 6 }}>Install ZChat</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Add ZChat to your home screen so it opens instantly in full screen with no browser bar, just like an app from the store.
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

function friendlyError(error, fallback = 'Something went wrong. Try again.') {
  const msg = String((error && error.message) || error || '').toLowerCase();
  if (!msg) return fallback;
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed')) return "You're offline. Check your connection and try again.";
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) return 'That email already has an account. Sign in instead.';
  if (msg.includes('duplicate') || msg.includes('unique')) return 'That name is already taken. Try another one.';
  if (msg.includes('invalid login') || msg.includes('invalid credentials')) return 'Incorrect email or password.';
  if (msg.includes('same password') || msg.includes('different from the old')) return 'Choose a password you have not used before.';
  if (msg.includes('password') && (msg.includes('characters') || msg.includes('short') || msg.includes('weak'))) return 'Use a stronger password with at least 6 characters.';
  if (msg.includes('expired') || msg.includes('otp') || msg.includes('token')) return 'That code expired. Ask for a new one.';
  if (msg.includes('email') && msg.includes('invalid')) return 'Enter a valid email address.';
  if (msg.includes('too large') || msg.includes('exceeded the maximum')) return 'That file is too big.';
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('not allowed') || msg.includes('jwt') || msg.includes('unauthorized')) return "You don't have permission to do that.";
  return fallback;
}

function formatListTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], d.getFullYear() === now.getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}

function describeMessage(m) {
  if (!m) return { kind: 'none', text: '' };
  if (m.deleted) return { kind: 'deleted', text: 'This message was deleted' };
  if (m.story_id) {
    if (m.content === STORY_MENTION_TEXT || m.content === STORY_GROUP_MENTION_TEXT || m.content === STORY_SHARE_TEXT) return { kind: 'story', text: m.content };
    return { kind: 'story', text: `Story reply: ${m.content || ''}` };
  }
  switch (m.type) {
    case 'image': return { kind: 'image', text: m.content || 'Photo' };
    case 'video': return { kind: 'video', text: m.content || 'Video' };
    case 'audio': return { kind: 'audio', text: 'Voice message' };
    case 'sticker': return { kind: 'sticker', text: 'Sticker' };
    case 'system': {
      const log = parseCallLog(m.content);
      if (log) {
        const Kind = log.k === 'video' ? 'Video' : 'Voice';
        const text = log.s === 'group' ? `${Kind} group call` : (log.s === 'missed' || log.s === 'declined') ? `Missed ${Kind.toLowerCase()} call` : `${Kind} call \u00b7 ${formatCallDuration((log.d || 0) * 1000)}`;
        return { kind: log.s === 'missed' || log.s === 'declined' ? 'callmissed' : 'call', text };
      }
      return { kind: 'system', text: m.content || '' };
    }
    default: return { kind: 'text', text: parseProfileLink(m.content) ? 'Shared a profile' : parsePostLink(m.content) ? 'Shared a post' : (m.content || '') };
  }
}

const PREVIEW_ICONS = { image: Camera, video: VideoIcon, audio: Mic, sticker: Smile, deleted: Ban, story: StatusIcon, call: Phone, callmissed: PhoneMissedIcon };
function PhoneMissedIcon({ size = 14, style }) { return <Phone size={size} color="#FF3B30" style={style} />; }

function PreviewLine({ preview, prefix, color, weight = 400, size = 12 }) {
  const Icon = preview ? PREVIEW_ICONS[preview.kind] : null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, fontSize: size, color, fontWeight: weight, fontStyle: preview && preview.kind === 'deleted' ? 'italic' : 'normal' }}>
      {prefix ? <span style={{ flexShrink: 0 }}>{prefix}</span> : null}
      {Icon ? <Icon size={size + 1} style={{ flexShrink: 0 }} /> : null}
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{preview ? preview.text : ''}</span>
    </span>
  );
}

function activityLabel(kind) {
  const labels = {
    typing: 'typing',
    sticker: 'choosing a sticker',
    photo: 'selecting a photo',
    video: 'selecting a video',
    voice: 'recording a voice message',
  };
  return `${labels[kind] || 'typing'}\u2026`;
}

function InAppMessageToast({ toast, top, onOpen, onDismiss }) {
  const { theme } = useTheme();
  const startRef = useRef(null);
  const suppressRef = useRef(false);
  const holdRef = useRef(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    setDragY(0);
    let left = 6000;
    const t = setInterval(() => {
      if (!holdRef.current) left -= 250;
      if (left <= 0) { clearInterval(t); onDismiss(); }
    }, 250);
    return () => clearInterval(t);
  }, [toast.key]);

  return (
    <div key={toast.key} className="zchat-toast-in"
      onPointerDown={(e) => { e.stopPropagation(); holdRef.current = true; startRef.current = { y: e.clientY, moved: false }; }}
      onPointerMove={(e) => {
        const s = startRef.current;
        if (!s) return;
        const dy = e.clientY - s.y;
        if (Math.abs(dy) > 12) s.moved = true;
        if (s.moved) setDragY(Math.min(0, dy));
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        holdRef.current = false;
        const s = startRef.current;
        startRef.current = null;
        if (s && s.moved) {
          suppressRef.current = true;
          setTimeout(() => { suppressRef.current = false; }, 80);
          if (dragY < -28) onDismiss(); else setDragY(0);
        }
      }}
      onPointerCancel={() => { holdRef.current = false; startRef.current = null; setDragY(0); }}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (suppressRef.current) return; onOpen(); }}
      style={{
        position: 'fixed', top, left: 10, right: 10, zIndex: 300, maxWidth: 420, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px 11px 11px', borderRadius: 20,
        background: theme.dark ? 'rgba(20,26,44,0.96)' : 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        border: `1px solid ${theme.border}`, borderLeft: toast.accent === 'missed' ? '4px solid #FF3B30' : `1px solid ${theme.border}`, boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        transform: `translateY(${dragY}px)`, transition: startRef.current ? 'none' : 'transform 0.2s ease',
        cursor: 'pointer', touchAction: 'pan-x', userSelect: 'none', WebkitTapHighlightColor: 'transparent',
      }}>
      <div style={{ position: 'relative', flexShrink: 0, pointerEvents: 'none' }}>
        {toast.kind === 'notice' ? (
          toast.icon ? <MailBadgeIcon type={toast.icon === 'warning' ? 'report_warning' : toast.icon === 'mention' ? 'mention' : toast.icon === 'update' ? 'update' : toast.icon === 'badge' ? 'badge' : 'mail'} badgeTier={toast.badgeTier} size={42} />
            : toast.isGroupIcon ? <GroupAvatar avatar={toast.groupAvatar} name={toast.title} size={42} /> : <Avatar emoji={toast.avatar} name={toast.avatarName} frame={toast.frame} size={42} />
        ) : toast.kind === 'group'
          ? <GroupAvatar avatar={toast.groupAvatar} name={toast.title} size={42} />
          : <Avatar emoji={toast.avatar} name={toast.avatarName} frame={toast.frame} size={42} />}
        {toast.kind === 'group' && (
          <div style={{ position: 'absolute', right: -4, bottom: -4, borderRadius: '50%', border: `2px solid ${theme.panelBg}` }}>
            <Avatar emoji={toast.avatar} name={toast.avatarName} frame={toast.frame} size={20} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toast.title}<VerifiedBadge tier={toast.verified} custom={toast.customBadge} size={12} /></span>
          <span style={{ fontSize: 10.5, color: theme.muted, flexShrink: 0 }}>now</span>
        </div>
        <PreviewLine preview={toast.preview} prefix={toast.prefix} color={theme.muted} size={12.5} />
      </div>
    </div>
  );
}

function ChatRowSheet({ title, subtitle, avatar, actions, onClose }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  return (
    <div onClick={onClose} className="zchat-fade" style={{
      position: 'fixed', inset: 0, zIndex: 94, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: theme.dark ? 'rgba(3,6,14,0.5)' : 'rgba(230,234,244,0.5)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle,
        width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px', borderBottom: `1px solid ${theme.border}` }}>
          {avatar}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
          </div>
        </div>
        {actions.filter(Boolean).map((a) => (
          <div key={a.label} onClick={() => { onClose(); a.onClick(); }} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer',
            fontSize: 14.5, fontWeight: 600, color: a.danger ? theme.danger : theme.ink,
          }}>
            <span style={{ display: 'flex', color: a.danger ? theme.danger : theme.muted }}>{a.icon}</span>
            {a.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function MessageContextMenu({ message, isMine, canEditText, canModerate, anchorRect, bubble, isPinned, onPin, onUnpin, onClose, onReact, onReply, onCopy, onEdit, onForward, onReport, onDeleteForMe, onDeleteForEveryone, onSelectMultiple, onSave }) {
  const { theme } = useTheme();
  const [showFullEmoji, setShowFullEmoji] = useState(false);
  const [favKeys, setFavKeys] = useState(() => getFavoriteStickerKeys());
  const [measured, setMeasured] = useState({ menu: 0, bubble: 0 });
  const menuRef = useRef(null);
  const bubbleRef = useRef(null);
  const openedAtRef = useRef(Date.now());
  const guard = (fn) => (...args) => { if (Date.now() - openedAtRef.current < 450) return; if (fn) fn(...args); };
  const stickerMatch = message.type === 'sticker' ? STICKERS.find((s) => s.file === message.content) : null;

  useEffect(() => {
    setMeasured({ menu: menuRef.current ? menuRef.current.offsetHeight : 0, bubble: bubbleRef.current ? bubbleRef.current.offsetHeight : 0 });
  }, []);

  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const vw = window.innerWidth;
  const rect = anchorRect || { top: vh * 0.3, left: Math.max(0, (vw - Math.min(vw, 560)) / 2), width: Math.min(vw, 560), height: 60 };
  const maxBubble = Math.round(vh * 0.38);
  const bubbleH = Math.min(measured.bubble || rect.height, maxBubble);
  const barH = 50;
  const gap = 10;
  const minTop = 52 + barH + gap;
  const maxTop = vh - 14 - (measured.menu || 300) - gap - bubbleH;
  const top = Math.max(minTop, Math.min(rect.top, Math.max(minTop, maxTop)));
  const sideStyle = isMine
    ? { right: Math.max(10, vw - (rect.left + rect.width) + 14) }
    : { left: Math.max(10, rect.left + 14) };
  const ready = measured.menu > 0;

  const row = (icon, label, onClick, danger) => (
    <div onClick={guard(onClick)} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '12px 16px', cursor: 'pointer',
      fontSize: 14.5, fontWeight: 600, color: danger ? theme.danger : theme.ink, borderTop: `1px solid ${theme.border}`,
    }}>
      <span>{label}</span>
      <span style={{ display: 'flex' }}>{icon}</span>
    </div>
  );

  return (
    <div onClick={guard(onClose)} onContextMenu={(e) => e.preventDefault()} style={{ position: 'fixed', inset: 0, zIndex: 95 }}>
      <div className="zchat-fade" style={{
        position: 'absolute', inset: 0,
        background: theme.dark ? 'rgba(3,6,14,0.5)' : 'rgba(235,239,247,0.5)',
        backdropFilter: 'blur(18px) saturate(140%)', WebkitBackdropFilter: 'blur(18px) saturate(140%)',
      }} />
      {!message.deleted && (
        <div onClick={(e) => e.stopPropagation()} className={ready ? 'zchat-pop' : ''} style={{
          position: 'absolute', top: top - barH - gap, ...sideStyle, height: barH, boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px', borderRadius: 26,
          background: theme.panelBg, boxShadow: '0 8px 28px rgba(0,0,0,0.28)', opacity: ready ? 1 : 0,
        }}>
          {REACTION_EMOJIS.map((e) => (
            <div key={e} onClick={guard(() => onReact(e))} style={{ fontSize: 25, cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>{e}</div>
          ))}
          <div onClick={() => setShowFullEmoji(true)} style={{
            width: 30, height: 30, borderRadius: '50%', background: theme.rowBg, display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: theme.muted, fontSize: 18, fontWeight: 800,
          }}>+</div>
        </div>
      )}
      <div ref={bubbleRef} style={{
        position: 'absolute', top, left: rect.left, width: rect.width, paddingLeft: 18, paddingRight: 18, boxSizing: 'border-box',
        maxHeight: maxBubble, overflow: 'hidden', pointerEvents: 'none', opacity: ready ? 1 : 0,
        transform: ready ? 'scale(1)' : 'scale(0.97)', transition: 'transform 0.18s ease, opacity 0.12s ease',
      }}>{bubble}</div>
      <div ref={menuRef} onClick={(e) => e.stopPropagation()} className={ready ? 'zchat-pop' : ''} style={{
        position: 'absolute', top: top + bubbleH + gap, ...sideStyle, width: 236, borderRadius: 16, overflow: 'hidden',
        background: theme.panelBg, boxShadow: '0 10px 32px rgba(0,0,0,0.3)', opacity: ready ? 1 : 0,
      }}>
        <div style={{ marginTop: -1 }}>
          {!message.deleted && row(<Reply size={18} />, 'Reply', onReply)}
          {!message.deleted && message.type === 'text' && row(<Copy size={18} />, 'Copy', onCopy)}
          {!message.deleted && canEditText && row(<Edit3 size={18} />, 'Edit', onEdit)}
          {!message.deleted && (message.type === 'image' || message.type === 'video') && row(<Download size={18} />, 'Save', onSave)}
          {!message.deleted && stickerMatch && row(<Star_ size={18} color="#FFB800" filled={favKeys.has(stickerMatch.key)} />, favKeys.has(stickerMatch.key) ? 'Remove from favorites' : 'Add to favorites', () => setFavKeys(new Set(toggleFavoriteSticker(stickerMatch.key))))}
          {!message.deleted && row(<Forward size={18} />, 'Forward', onForward)}
          {!message.deleted && message.type !== 'system' && onPin && row(<Pin_ size={18} color={theme.ink} />, isPinned ? 'Unpin' : 'Pin', isPinned ? onUnpin : onPin)}
          {row(<CheckCheck size={18} />, 'Select', onSelectMultiple)}
          {!isMine && !message.deleted && row(<Flag size={18} />, 'Report', onReport, true)}
          {row(<Trash2 size={18} />, 'Delete for me', onDeleteForMe, true)}
          {(isMine || canModerate) && !message.deleted && row(<Trash2 size={18} />, 'Delete for everyone', onDeleteForEveryone, true)}
        </div>
      </div>
      {showFullEmoji && (
        <FullEmojiPicker onClose={() => setShowFullEmoji(false)} onPick={(e) => { onReact(e); setShowFullEmoji(false); }} />
      )}
    </div>
  );
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function PhotoCropEditor({ file, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const imgRef = useRef(null);
  const size = Math.max(220, Math.min((typeof window !== 'undefined' ? window.innerWidth : 360) - 48, 340));

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    loadImageElement(u).then((img) => { imgRef.current = img; setNatural({ w: img.naturalWidth, h: img.naturalHeight }); }).catch(() => onCancel());
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const base = natural ? Math.max(size / natural.w, size / natural.h) : 1;
  const dispW = natural ? natural.w * base * zoom : size;
  const dispH = natural ? natural.h * base * zoom : size;
  const clampOffset = (o, z) => {
    if (!natural) return o;
    const w = natural.w * base * z;
    const h = natural.h * base * z;
    const mx = Math.max(0, (w - size) / 2);
    const my = Math.max(0, (h - size) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const setZoomSafe = (z) => {
    const nz = Math.max(1, Math.min(5, z));
    setZoom(nz);
    setOffset((o) => clampOffset(o, nz));
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };
  const onMove = (e) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      setZoomSafe(pinchRef.current.zoom * (dist / Math.max(1, pinchRef.current.dist)));
      return;
    }
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    setOffset((o) => clampOffset({ x: o.x + dx, y: o.y + dy }, zoom));
  };
  const onUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const confirm = () => {
    if (!natural || !imgRef.current || saving) return;
    setSaving(true);
    const scale = base * zoom;
    const sw = size / scale;
    const sx = (dispW / 2 - size / 2 - offset.x) / scale;
    const sy = (dispH / 2 - size / 2 - offset.y) / scale;
    const out = 640;
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgRef.current, sx, sy, sw, sw, 0, 0, out, out);
    canvas.toBlob((blob) => { setSaving(false); if (blob) onConfirm(blob); }, 'image/jpeg', 0.92);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 150, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', color: 'white',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span onClick={onCancel} style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 6 }}>Cancel</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Move and scale</span>
        <span onClick={confirm} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: 6, color: theme.gold }}>{saving ? <Spinner size={15} /> : 'Done'}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
        onWheel={(e) => setZoomSafe(zoom * (1 - e.deltaY * 0.0015))}>
        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position: 'relative', width: size, height: size, touchAction: 'none', cursor: 'grab' }}>
          {url && natural ? (
            <img src={url} alt="" draggable={false} style={{
              position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none',
              transform: `translate(${size / 2 - dispW / 2 + offset.x}px, ${size / 2 - dispH / 2 + offset.y}px)`,
            }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>
          )}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 2000px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.85)', pointerEvents: 'none' }} />
        </div>
      </div>
      <div style={{ padding: '14px 28px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <ImageIcon size={14} color="rgba(255,255,255,0.7)" />
        <input type="range" min="1" max="5" step="0.01" value={zoom} onChange={(e) => setZoomSafe(parseFloat(e.target.value))} style={{ flex: 1, accentColor: theme.coral }} />
        <ImageIcon size={20} color="rgba(255,255,255,0.9)" />
      </div>
    </div>
  );
}

const EDITOR_COLORS = ['#FFFFFF', '#111111', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#2E7CF6', '#AF52DE', '#FF2D92'];
const BRUSH_SIZES = [4, 8, 14];

function strokeToPath(points, W, H) {
  if (!points || !points.length) return '';
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(p[0] * W).toFixed(1)} ${(p[1] * H).toFixed(1)}`).join(' ');
  return points.length === 1 ? `${d} l0.1 0` : d;
}

function paintEdits(ctx, item, W, H, offsetX, offsetY, scale, stickerImages = {}) {
  (item.stickers || []).forEach((st) => {
    const img = stickerImages[st.id];
    if (!img || !img.naturalWidth) return;
    const w = st.size * W * scale;
    const h = w * (img.naturalHeight / img.naturalWidth);
    ctx.drawImage(img, st.x * W * scale - offsetX - w / 2, st.y * H * scale - offsetY - h / 2, w, h);
  });
  item.strokes.forEach((s) => {
    if (!s.points.length) return;
    ctx.save();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size * W * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const x = p[0] * W * scale - offsetX;
      const y = p[1] * H * scale - offsetY;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    if (s.points.length === 1) ctx.lineTo(s.points[0][0] * W * scale - offsetX + 0.1, s.points[0][1] * H * scale - offsetY);
    ctx.stroke();
    ctx.restore();
  });
  item.texts.forEach((t) => {
    const fontSize = t.size * W * scale;
    const lines = t.text.split('\n');
    const lineHeight = fontSize * 1.18;
    const cx = t.x * W * scale - offsetX;
    const cy = t.y * H * scale - offsetY;
    ctx.save();
    ctx.font = `800 ${fontSize}px Manrope, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = t.color;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = fontSize * 0.25;
    ctx.shadowOffsetY = fontSize * 0.04;
    lines.forEach((line, i) => ctx.fillText(line, cx, cy + (i - (lines.length - 1) / 2) * lineHeight));
    ctx.restore();
  });
}

async function loadStickerImages(item) {
  const out = {};
  for (const st of item.stickers || []) {
    try { out[st.id] = await loadImageElement(st.src); } catch {}
  }
  return out;
}

async function prepareImageFile(file, url) {
  if (/gif/i.test(file.type)) return file;
  if (file.size < 1.8 * 1024 * 1024 && /jpe?g|png|webp/i.test(file.type)) return file;
  try {
    const img = await loadImageElement(url);
    const scale = Math.min(1, 2560 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.88));
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

async function exportEditedImage(item) {
  const hasEdits = item.crop || item.texts.length || item.strokes.length || (item.stickers || []).length;
  if (!hasEdits) return prepareImageFile(item.file, item.url);
  try { if (document.fonts && document.fonts.load) await document.fonts.load('800 40px Manrope'); } catch {}
  const img = await loadImageElement(item.url);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = item.crop || { x: 0, y: 0, w: 1, h: 1 };
  const rw = c.w * W;
  const rh = c.h * H;
  const scale = Math.min(1, 2560 / Math.max(rw, rh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rw * scale));
  canvas.height = Math.max(1, Math.round(rh * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, c.x * W, c.y * H, rw, rh, 0, 0, canvas.width, canvas.height);
  paintEdits(ctx, item, W, H, c.x * W * scale, c.y * H * scale, scale, await loadStickerImages(item));
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
  return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : item.file;
}

async function exportVideoOverlay(item) {
  if (!item.texts.length && !item.strokes.length && !(item.stickers || []).length) return null;
  if (!item.width || !item.height) return null;
  try { if (document.fonts && document.fonts.load) await document.fonts.load('800 40px Manrope'); } catch {}
  const scale = Math.min(1, 1280 / Math.max(item.width, item.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(item.width * scale);
  canvas.height = Math.round(item.height * scale);
  paintEdits(canvas.getContext('2d'), item, item.width, item.height, 0, 0, scale, await loadStickerImages(item));
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  return blob ? new File([blob], 'overlay.png', { type: 'image/png' }) : null;
}

function MediaComposer({ files, recipientName, onCancel, onSend, onActivity, mode: composerMode = 'chat', mentionGroups = [], myId }) {
  const { theme } = useTheme();
  const [items, setItems] = useState(() => files.map((f, i) => ({
    id: `${Date.now()}-${i}`, kind: (f.type || '').startsWith('video') ? 'video' : 'image', file: f, url: URL.createObjectURL(f),
    width: 0, height: 0, duration: 0, crop: null, texts: [], strokes: [], stickers: [], trimStart: 0, trimEnd: null,
  })));
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('view');
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [draftCrop, setDraftCrop] = useState(null);
  const [cropAspect, setCropAspect] = useState(null);
  const [brushColor, setBrushColor] = useState('#FF3B30');
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [textDraft, setTextDraft] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [mentions, setMentions] = useState([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const isStory = composerMode === 'story';
  const stageRef = useRef(null);
  const innerRef = useRef(null);
  const videoRef = useRef(null);
  const livePathRef = useRef(null);
  const drawRef = useRef(null);
  const dragRef = useRef(null);
  const frameRef = useRef({ frameW: 1, frameH: 1, innerW: 1, innerH: 1 });
  const trimBarRef = useRef(null);
  const sentRef = useRef(false);

  const cur = items[Math.min(index, items.length - 1)];

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
    window.addEventListener('resize', measure);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  useEffect(() => {
    items.forEach((it) => {
      if (it.width) return;
      if (it.kind === 'image') {
        loadImageElement(it.url).then((img) => updateItem(it.id, { width: img.naturalWidth, height: img.naturalHeight })).catch(() => updateItem(it.id, { width: 1000, height: 1000 }));
      } else {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.muted = true;
        v.playsInline = true;
        v.onloadedmetadata = () => updateItem(it.id, { width: v.videoWidth || 720, height: v.videoHeight || 1280, duration: Number.isFinite(v.duration) ? v.duration : 0 });
        v.onerror = () => updateItem(it.id, { width: 720, height: 1280 });
        v.src = it.url;
      }
    });
  }, [items.length]);

  useEffect(() => {
    if (!onActivity || !cur) return undefined;
    onActivity(cur.kind === 'video' ? 'video' : 'photo');
    const t = setInterval(() => onActivity(cur.kind === 'video' ? 'video' : 'photo'), 2000);
    return () => clearInterval(t);
  }, [cur && cur.kind]);

  useEffect(() => () => {
    if (!sentRef.current) items.forEach((it) => URL.revokeObjectURL(it.url));
  }, []);

  useEffect(() => { setMode('view'); setPlaying(false); }, [index]);

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it)));
  }

  if (!cur) return null;

  const W = cur.width || 1;
  const H = cur.height || 1;
  const region = mode === 'crop' || !cur.crop ? { x: 0, y: 0, w: 1, h: 1 } : cur.crop;
  const pad = mode === 'crop' ? 26 : 0;
  const availW = Math.max(60, stage.w - pad * 2);
  const availH = Math.max(60, stage.h - pad * 2);
  const scale = Math.min(availW / (region.w * W), availH / (region.h * H));
  const frameW = region.w * W * scale;
  const frameH = region.h * H * scale;
  const innerW = W * scale;
  const innerH = H * scale;
  frameRef.current = { frameW, frameH, innerW, innerH };

  const removeItem = (id) => {
    const it = items.find((x) => x.id === id);
    if (it) URL.revokeObjectURL(it.url);
    const next = items.filter((x) => x.id !== id);
    if (!next.length) { onCancel(); return; }
    setItems(next);
    setIndex((i) => Math.min(i, next.length - 1));
  };

  const startCrop = () => {
    setDraftCrop(cur.crop || { x: 0, y: 0, w: 1, h: 1 });
    setCropAspect(null);
    setMode('crop');
  };

  const applyAspect = (ratio) => {
    setCropAspect(ratio);
    if (!ratio) return;
    setDraftCrop(() => {
      let w = 1;
      let h = (w * W) / (H * ratio);
      if (h > 1) { h = 1; w = (h * H * ratio) / W; }
      return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
    });
  };

  const cropDown = (e, handle) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { type: 'crop', handle, sx: e.clientX, sy: e.clientY, orig: { ...draftCrop } };
  };
  const cropMove = (e) => {
    const d = dragRef.current;
    if (!d || d.type !== 'crop') return;
    const { frameW: fw, frameH: fh } = frameRef.current;
    const dx = (e.clientX - d.sx) / fw;
    const dy = (e.clientY - d.sy) / fh;
    const o = d.orig;
    const min = 0.1;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    if (d.handle === 'move') {
      setDraftCrop({ ...o, x: clamp(o.x + dx, 0, 1 - o.w), y: clamp(o.y + dy, 0, 1 - o.h) });
      return;
    }
    const right = o.x + o.w;
    const bottom = o.y + o.h;
    let x = o.x;
    let y = o.y;
    let w = o.w;
    let h = o.h;
    if (d.handle.includes('w')) { x = clamp(o.x + dx, 0, right - min); w = right - x; }
    if (d.handle.includes('e')) { w = clamp(o.w + dx, min, 1 - o.x); }
    if (d.handle.includes('n')) { y = clamp(o.y + dy, 0, bottom - min); h = bottom - y; }
    if (d.handle.includes('s')) { h = clamp(o.h + dy, min, 1 - o.y); }
    if (cropAspect) {
      h = (w * W) / (H * cropAspect);
      const maxH = d.handle.includes('n') ? bottom : 1 - o.y;
      if (h > maxH) { h = maxH; w = (h * H * cropAspect) / W; }
      if (d.handle.includes('w')) x = right - w;
      if (d.handle.includes('n')) y = bottom - h;
    }
    setDraftCrop({ x, y, w, h });
  };
  const dragEnd = () => { dragRef.current = null; };

  const finishCrop = () => {
    const c = draftCrop;
    const full = !c || (c.x < 0.002 && c.y < 0.002 && c.w > 0.996 && c.h > 0.996);
    updateItem(cur.id, { crop: full ? null : c });
    setMode('view');
  };

  const pointOnInner = (e) => {
    const rect = innerRef.current.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))];
  };
  const drawDown = (e) => {
    if (mode !== 'draw' || !innerRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawRef.current = { points: [pointOnInner(e)], size: brushSize / frameRef.current.innerW, color: brushColor };
    if (livePathRef.current) livePathRef.current.setAttribute('d', strokeToPath(drawRef.current.points, W, H));
  };
  const drawMove = (e) => {
    if (!drawRef.current) return;
    drawRef.current.points.push(pointOnInner(e));
    if (livePathRef.current) livePathRef.current.setAttribute('d', strokeToPath(drawRef.current.points, W, H));
  };
  const drawUp = () => {
    const s = drawRef.current;
    drawRef.current = null;
    if (livePathRef.current) livePathRef.current.setAttribute('d', '');
    if (s && s.points.length) updateItem(cur.id, (it) => ({ strokes: [...it.strokes, s] }));
  };

  const textDown = (e, t) => {
    if (mode === 'draw' || mode === 'crop') return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { type: 'text', id: t.id, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, moved: false };
  };
  const textMove = (e) => {
    const d = dragRef.current;
    if (!d || d.type !== 'text') return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    if (!d.moved) return;
    const { innerW: iw, innerH: ih } = frameRef.current;
    updateItem(cur.id, (it) => ({ texts: it.texts.map((x) => (x.id === d.id ? { ...x, x: Math.max(0, Math.min(1, d.ox + dx / iw)), y: Math.max(0, Math.min(1, d.oy + dy / ih)) } : x)) }));
  };
  const textUp = (e, t) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.type === 'text' && !d.moved) setTextDraft({ id: t.id, text: t.text, color: t.color, size: t.size });
  };

  const saveText = () => {
    const td = textDraft;
    setTextDraft(null);
    if (!td) return;
    const value = td.text.replace(/\s+$/, '');
    if (!value.trim()) {
      if (td.id) updateItem(cur.id, (it) => ({ texts: it.texts.filter((x) => x.id !== td.id) }));
      return;
    }
    if (td.id) {
      updateItem(cur.id, (it) => ({ texts: it.texts.map((x) => (x.id === td.id ? { ...x, text: value, color: td.color, size: td.size } : x)) }));
    } else {
      const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
      updateItem(cur.id, (it) => ({ texts: [...it.texts, { id: `t${Date.now()}`, text: value, color: td.color, size: td.size, x: r.x + r.w / 2, y: r.y + r.h * 0.42 }] }));
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); }
  };

  const onVideoTime = (e) => {
    const v = e.currentTarget;
    const end = cur.trimEnd != null ? cur.trimEnd : v.duration;
    if (end && v.currentTime >= end) { v.currentTime = cur.trimStart || 0; if (mode !== 'trim') v.play().catch(() => {}); }
    if (cur.trimStart && v.currentTime < cur.trimStart - 0.2) v.currentTime = cur.trimStart;
  };

  const trimDown = (e, which) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { type: 'trim', which };
  };
  const trimMove = (e) => {
    const d = dragRef.current;
    if (!d || d.type !== 'trim' || !trimBarRef.current || !cur.duration) return;
    const rect = trimBarRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * cur.duration;
    const end = cur.trimEnd != null ? cur.trimEnd : cur.duration;
    if (d.which === 'start') {
      const v = Math.min(t, end - 1);
      updateItem(cur.id, { trimStart: Math.max(0, v) });
      if (videoRef.current) videoRef.current.currentTime = Math.max(0, v);
    } else {
      const v = Math.max(t, (cur.trimStart || 0) + 1);
      updateItem(cur.id, { trimEnd: Math.min(cur.duration, v) });
      if (videoRef.current) videoRef.current.currentTime = Math.min(cur.duration, v);
    }
  };

  const send = async () => {
    if (sending) return;
    setSending(true);
    try {
      const outputs = [];
      for (const it of items) {
        if (it.kind === 'image') {
          const file = await exportEditedImage(it);
          outputs.push({ kind: 'image', file, url: it.url });
        } else {
          const overlayFile = await exportVideoOverlay(it);
          const trimmed = it.duration && ((it.trimStart || 0) > 0.05 || (it.trimEnd != null && it.trimEnd < it.duration - 0.05));
          outputs.push({ kind: 'video', file: it.file, url: it.url, overlayFile, trimStart: trimmed ? (it.trimStart || 0) : null, trimEnd: trimmed ? (it.trimEnd != null ? it.trimEnd : it.duration) : null });
        }
      }
      sentRef.current = true;
      onSend(outputs, caption.trim(), mentions);
    } catch {
      setSending(false);
    }
  };

  const fmt = (s) => `${Math.floor((s || 0) / 60)}:${Math.floor((s || 0) % 60).toString().padStart(2, '0')}`;
  const toolBtn = (icon, label, onClick, active) => (
    <div role="button" aria-label={label} onClick={onClick} style={{
      width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      background: active ? 'white' : 'rgba(0,0,0,0.45)', color: active ? '#000' : 'white', flexShrink: 0,
    }}>{icon}</div>
  );
  const colorRow = (value, onPick) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
      {EDITOR_COLORS.map((c) => (
        <div key={c} onClick={() => onPick(c)} style={{
          width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', boxSizing: 'border-box',
          border: value === c ? '3px solid white' : '2px solid rgba(255,255,255,0.35)', transform: value === c ? 'scale(1.15)' : 'none',
        }} />
      ))}
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: '#000', color: 'white', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', flexShrink: 0, minHeight: 60, boxSizing: 'border-box' }}>
        {mode === 'view' && (
          <>
            {toolBtn(<X size={20} />, 'Close', onCancel)}
            <div style={{ display: 'flex', gap: 8 }}>
              {cur.kind === 'image' && toolBtn(<Crop size={18} />, 'Crop', startCrop)}
              {cur.kind === 'video' && cur.duration > 1 && toolBtn(<Scissors size={18} />, 'Trim', () => { setMode('trim'); if (videoRef.current) videoRef.current.pause(); })}
              {toolBtn(<Smile size={18} />, 'Stickers', () => { setShowStickerPicker(true); if (videoRef.current) videoRef.current.pause(); })}
              {toolBtn(<Type size={18} />, 'Add text', () => setTextDraft({ id: null, text: '', color: '#FFFFFF', size: 0.07 }))}
              {toolBtn(<Pencil size={18} />, 'Draw', () => { setMode('draw'); if (videoRef.current) videoRef.current.pause(); })}
              {isStory && toolBtn(<AtSign size={18} />, 'Mention', () => setShowMentionPicker(true))}
            </div>
          </>
        )}
        {mode === 'draw' && (
          <>
            {toolBtn(<Undo2 size={18} />, 'Undo', () => updateItem(cur.id, (it) => ({ strokes: it.strokes.slice(0, -1) })))}
            <span style={{ fontSize: 15, fontWeight: 800 }}>Draw</span>
            <span onClick={() => setMode('view')} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px' }}>Done</span>
          </>
        )}
        {mode === 'crop' && (
          <>
            <span onClick={() => setMode('view')} style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '8px 10px' }}>Cancel</span>
            <span onClick={() => { setDraftCrop({ x: 0, y: 0, w: 1, h: 1 }); setCropAspect(null); }} style={{ fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '8px 10px', color: 'rgba(255,255,255,0.75)' }}>Reset</span>
            <span onClick={finishCrop} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
          </>
        )}
        {mode === 'trim' && (
          <>
            <span style={{ width: 60 }} />
            <span style={{ fontSize: 15, fontWeight: 800 }}>Trim video</span>
            <span onClick={() => setMode('view')} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
          </>
        )}
      </div>

      <div ref={stageRef} onClick={() => { if (mode === 'view' && cur.kind === 'video') togglePlay(); }}
        style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' }}>
        {cur.width && stage.w ? (
          <div style={{ position: 'relative', width: frameW, height: frameH, overflow: mode === 'crop' ? 'visible' : 'hidden', flexShrink: 0 }}>
            <div ref={innerRef}
              onPointerDown={drawDown} onPointerMove={drawMove} onPointerUp={drawUp} onPointerCancel={drawUp}
              style={{ position: 'absolute', left: -region.x * innerW, top: -region.y * innerH, width: innerW, height: innerH, touchAction: 'none', cursor: mode === 'draw' ? 'crosshair' : 'default' }}>
              {cur.kind === 'image' ? (
                <img src={cur.url} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
              ) : (
                <video ref={videoRef} src={cur.url} playsInline preload="auto"
                  onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={onVideoTime}
                  onLoadedMetadata={(e) => { if (cur.trimStart) e.currentTarget.currentTime = cur.trimStart; }}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill', pointerEvents: 'none' }} />
              )}
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                {cur.strokes.map((s, i) => (
                  <path key={i} d={strokeToPath(s.points, W, H)} stroke={s.color} strokeWidth={s.size * W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                <path ref={livePathRef} stroke={brushColor} strokeWidth={(brushSize / Math.max(1, innerW)) * W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {(cur.stickers || []).map((st) => (
                <img key={st.id} src={st.src} alt="" draggable={false}
                  onPointerDown={(e) => {
                    if (mode !== 'view') return;
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture?.(e.pointerId);
                    dragRef.current = { type: 'sticker', id: st.id, sx: e.clientX, sy: e.clientY, ox: st.x, oy: st.y, moved: false };
                  }}
                  onPointerMove={(e) => {
                    const d = dragRef.current;
                    if (!d || d.type !== 'sticker' || d.id !== st.id) return;
                    const dx = e.clientX - d.sx;
                    const dy = e.clientY - d.sy;
                    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
                    if (!d.moved) return;
                    const { innerW: iw, innerH: ih } = frameRef.current;
                    updateItem(cur.id, (it) => ({ stickers: it.stickers.map((x) => (x.id === st.id ? { ...x, x: Math.max(0, Math.min(1, d.ox + dx / iw)), y: Math.max(0, Math.min(1, d.oy + dy / ih)) } : x)) }));
                  }}
                  onPointerUp={() => { const d = dragRef.current; dragRef.current = null; if (d && d.type === 'sticker' && !d.moved) setSelectedSticker(st.id === selectedSticker ? null : st.id); }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', left: `${st.x * 100}%`, top: `${st.y * 100}%`, width: st.size * innerW, transform: 'translate(-50%, -50%)', touchAction: 'none', cursor: 'grab', pointerEvents: mode === 'view' ? 'auto' : 'none', outline: selectedSticker === st.id ? '2px dashed rgba(255,255,255,0.85)' : 'none', outlineOffset: 4, borderRadius: 8, userSelect: 'none' }} />
              ))}
              {cur.texts.map((t) => (
                <div key={t.id}
                  onPointerDown={(e) => textDown(e, t)} onPointerMove={textMove} onPointerUp={(e) => textUp(e, t)} onPointerCancel={() => { dragRef.current = null; }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute', left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: 'translate(-50%, -50%)',
                    color: t.color, fontSize: t.size * innerW, fontWeight: 800, lineHeight: 1.18, whiteSpace: 'pre', textAlign: 'center',
                    textShadow: '0 1px 8px rgba(0,0,0,0.45)', pointerEvents: mode === 'draw' || mode === 'crop' ? 'none' : 'auto',
                    touchAction: 'none', cursor: 'grab', userSelect: 'none', fontFamily: FONT,
                  }}>{t.text}</div>
              ))}
            </div>
            {cur.kind === 'video' && mode === 'view' && !playing && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Play size={28} color="white" style={{ marginLeft: 3 }} />
                </div>
              </div>
            )}
            {mode === 'crop' && draftCrop && (
              <div onPointerDown={(e) => cropDown(e, 'move')} onPointerMove={cropMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
                style={{
                  position: 'absolute', left: draftCrop.x * frameW, top: draftCrop.y * frameH, width: draftCrop.w * frameW, height: draftCrop.h * frameH,
                  boxShadow: '0 0 0 4000px rgba(0,0,0,0.6)', outline: '1px solid rgba(255,255,255,0.9)', touchAction: 'none', cursor: 'move',
                }}>
                {[1, 2].map((n) => (
                  <React.Fragment key={n}>
                    <div style={{ position: 'absolute', left: `${(n * 100) / 3}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: `${(n * 100) / 3}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  </React.Fragment>
                ))}
                {['nw', 'ne', 'sw', 'se'].map((hnd) => (
                  <div key={hnd} onPointerDown={(e) => cropDown(e, hnd)} onPointerMove={cropMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
                    style={{ position: 'absolute', width: 48, height: 48, [hnd[0] === 'n' ? 'top' : 'bottom']: -24, [hnd[1] === 'w' ? 'left' : 'right']: -24, touchAction: 'none', cursor: hnd === 'nw' || hnd === 'se' ? 'nwse-resize' : 'nesw-resize' }}>
                    <div style={{
                      position: 'absolute', width: 22, height: 22, [hnd[0] === 'n' ? 'top' : 'bottom']: 21, [hnd[1] === 'w' ? 'left' : 'right']: 21,
                      [hnd[0] === 'n' ? 'borderTop' : 'borderBottom']: '4px solid white', [hnd[1] === 'w' ? 'borderLeft' : 'borderRight']: '4px solid white',
                    }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Spinner size={26} />
        )}
      </div>

      {mode === 'crop' && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '14px 12px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          {[{ l: 'Free', v: null }, { l: 'Square', v: 1 }, { l: '4:5', v: 0.8 }, { l: '16:9', v: 16 / 9 }].map((opt) => (
            <div key={opt.l} onClick={() => applyAspect(opt.v)} style={{
              padding: '8px 14px', borderRadius: 18, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: cropAspect === opt.v ? 'white' : 'rgba(255,255,255,0.14)', color: cropAspect === opt.v ? '#000' : 'white',
            }}>{opt.l}</div>
          ))}
        </div>
      )}

      {mode === 'draw' && (
        <div style={{ padding: '12px 14px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          {colorRow(brushColor, setBrushColor)}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, alignItems: 'center' }}>
            {BRUSH_SIZES.map((s) => (
              <div key={s} onClick={() => setBrushSize(s)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', background: brushSize === s ? 'rgba(255,255,255,0.18)' : 'transparent' }}>
                <div style={{ width: s + 4, height: s + 4, borderRadius: '50%', background: brushColor }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === 'trim' && (
        <div style={{ padding: '14px 22px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <div ref={trimBarRef} style={{ position: 'relative', height: 44, touchAction: 'none' }}>
            <div style={{ position: 'absolute', top: 16, left: 0, right: 0, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{
              position: 'absolute', top: 16, height: 12, borderRadius: 6, background: theme.coral,
              left: `${((cur.trimStart || 0) / (cur.duration || 1)) * 100}%`,
              width: `${(((cur.trimEnd != null ? cur.trimEnd : cur.duration) - (cur.trimStart || 0)) / (cur.duration || 1)) * 100}%`,
            }} />
            {['start', 'end'].map((which) => {
              const value = which === 'start' ? (cur.trimStart || 0) : (cur.trimEnd != null ? cur.trimEnd : cur.duration);
              return (
                <div key={which} onPointerDown={(e) => trimDown(e, which)} onPointerMove={trimMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}
                  style={{ position: 'absolute', top: 0, width: 44, height: 44, marginLeft: -22, left: `${(value / (cur.duration || 1)) * 100}%`, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', cursor: 'ew-resize' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'white', border: `3px solid ${theme.coral}` }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            <span>{fmt(cur.trimStart)}</span>
            <span>{fmt((cur.trimEnd != null ? cur.trimEnd : cur.duration) - (cur.trimStart || 0))} selected</span>
            <span>{fmt(cur.trimEnd != null ? cur.trimEnd : cur.duration)}</span>
          </div>
        </div>
      )}

      {mode === 'view' && (
        <div style={{ flexShrink: 0, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
          {items.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px 4px', overflowX: 'auto' }}>
              {items.map((it, i) => (
                <div key={it.id} onClick={() => setIndex(i)} style={{
                  position: 'relative', width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                  border: i === index ? '2px solid white' : '2px solid transparent', boxSizing: 'border-box',
                }}>
                  {it.kind === 'image'
                    ? <img src={it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <video src={it.url} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  {i === index && (
                    <div onClick={(e) => { e.stopPropagation(); removeItem(it.id); }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={16} color="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isStory && mentions.length > 0 && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px 0', overflowX: 'auto' }}>
              {mentions.map((mn) => (
                <div key={`${mn.kind}-${mn.id}`} onClick={() => setMentions((prev) => prev.filter((x) => !(x.id === mn.id && x.kind === mn.kind)))} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.16)', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  {mn.kind === 'group' ? <Users size={12} /> : <AtSign size={12} />}{mn.label}<X size={12} />
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 0' }}>
            <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, MAX_CHARS))} placeholder="Add a caption"
              onKeyDown={(e) => { if (e.key === 'Enter' && !isTouchDevice()) { e.preventDefault(); send(); } }}
              style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 24, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.14)', color: 'white', fontFamily: FONT, fontSize: 15 }} />
            {isStory ? (
              <div onPointerDown={(e) => e.preventDefault()} onClick={send} role="button" aria-label="Share to your story" style={{
                height: 48, padding: '0 16px', borderRadius: 24, background: 'white', color: '#000', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, fontWeight: 800, fontSize: 14,
              }}>{sending ? <Spinner size={16} color="#000" /> : <><StatusIcon size={17} color="#000" /> Your story</>}</div>
            ) : (
              <div onPointerDown={(e) => e.preventDefault()} onClick={send} role="button" aria-label="Send" style={{
                width: 48, height: 48, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}>{sending ? <Spinner size={18} /> : <Send size={20} color="white" style={{ marginLeft: -2 }} />}</div>
            )}
          </div>
          {isStory
            ? <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', padding: '6px 18px 0' }}>Shared with your followers for 24 hours</div>
            : recipientName && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', padding: '6px 18px 0' }}>To {recipientName}</div>}
        </div>
      )}

      {selectedSticker && mode === 'view' && (cur.stickers || []).some((x) => x.id === selectedSticker) && (
        <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: 'calc(70px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 6, display: 'flex', gap: 8, padding: 6, borderRadius: 22, background: 'rgba(0,0,0,0.65)' }}>
          {[{ l: 'Smaller', f: 0.8 }, { l: 'Bigger', f: 1.25 }].map((b) => (
            <div key={b.l} onClick={() => updateItem(cur.id, (it) => ({ stickers: it.stickers.map((x) => (x.id === selectedSticker ? { ...x, size: Math.max(0.08, Math.min(0.9, x.size * b.f)) } : x)) }))} style={{ padding: '8px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.14)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{b.l}</div>
          ))}
          <div onClick={() => { updateItem(cur.id, (it) => ({ stickers: it.stickers.filter((x) => x.id !== selectedSticker) })); setSelectedSticker(null); }} style={{ padding: '8px 14px', borderRadius: 16, background: '#FF3B30', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Remove</div>
        </div>
      )}
      {showStickerPicker && (
        <div onClick={() => setShowStickerPicker(false)} style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', height: '60%', background: '#11151F', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Stickers</span>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowStickerPicker(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 12px 14px' }}>
              {[...STICKERS].sort((x, y) => (getFavoriteStickerKeys().has(y.key) ? 1 : 0) - (getFavoriteStickerKeys().has(x.key) ? 1 : 0)).map((stk) => (
                <div key={stk.key} onClick={() => {
                  setShowStickerPicker(false);
                  const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
                  const id = `s${Date.now()}`;
                  updateItem(cur.id, (it) => ({ stickers: [...(it.stickers || []), { id, src: stk.file, x: r.x + r.w / 2, y: r.y + r.h / 2, size: 0.32 }] }));
                  setSelectedSticker(id);
                }} style={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 14, background: 'rgba(255,255,255,0.05)' }}>
                  <img src={stk.file} alt="" loading="lazy" draggable={false} style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showMentionPicker && (
        <StoryMentionPicker myId={myId} groups={mentionGroups} onClose={() => setShowMentionPicker(false)}
          onPick={(mn) => {
            setShowMentionPicker(false);
            setMentions((prev) => (prev.some((x) => x.id === mn.id && x.kind === mn.kind) ? prev : [...prev, mn]));
            const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
            updateItem(cur.id, (it) => ({ texts: [...it.texts, { id: `m${Date.now()}`, text: `@${mn.label}`, color: '#FFFFFF', size: 0.06, x: r.x + r.w / 2, y: r.y + r.h * (0.62 + Math.min(0.24, it.texts.length * 0.08)) }] }));
          }} />
      )}
      {textDraft && (
        <div onClick={saveText} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
            {textDraft.id
              ? <span onClick={() => { const id = textDraft.id; setTextDraft(null); updateItem(cur.id, (it) => ({ texts: it.texts.filter((x) => x.id !== id) })); }} style={{ fontSize: 15, fontWeight: 700, color: '#FF6B6B', cursor: 'pointer', padding: 8 }}>Delete</span>
              : <span style={{ width: 50 }} />}
            <input type="range" min="0.035" max="0.16" step="0.005" value={textDraft.size} onChange={(e) => setTextDraft((d) => ({ ...d, size: parseFloat(e.target.value) }))} style={{ width: 130, accentColor: 'white' }} />
            <span onClick={saveText} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: 8 }}>Done</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <textarea autoFocus value={textDraft.text} onClick={(e) => e.stopPropagation()} onChange={(e) => setTextDraft((d) => ({ ...d, text: e.target.value.slice(0, 200) }))}
              placeholder="Type something" rows={3}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', textAlign: 'center',
                color: textDraft.color, fontFamily: FONT, fontWeight: 800, fontSize: Math.max(22, Math.min(46, textDraft.size * 380)), lineHeight: 1.18,
                textShadow: '0 1px 8px rgba(0,0,0,0.45)',
              }} />
          </div>
          <div onClick={(e) => e.stopPropagation()} style={{ padding: '10px 14px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
            {colorRow(textDraft.color, (c) => setTextDraft((d) => ({ ...d, color: c })))}
          </div>
        </div>
      )}
    </div>
  );
}

function VideoViewer({ url, trimStart, trimEnd, overlayUrl, onClose, onForward }) {
  const seekedRef = useRef(false);
  const [ratio, setRatio] = useState(null);
  const onLoadedMetadata = (e) => {
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) setRatio(v.videoWidth / v.videoHeight);
    if (trimStart && !seekedRef.current) { v.currentTime = trimStart; seekedRef.current = true; }
  };
  const onTimeUpdate = (e) => {
    if (trimEnd && e.currentTarget.currentTime >= trimEnd) {
      e.currentTarget.pause();
      e.currentTarget.currentTime = trimStart || 0;
    }
  };
  const boxStyle = ratio
    ? { position: 'relative', width: `min(100vw, calc(100dvh * ${ratio}))`, aspectRatio: String(ratio), maxHeight: '100dvh' }
    : { position: 'relative', maxWidth: '100%', maxHeight: '100%' };
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }} className="zchat-fade">
      <div onClick={onClose} style={{
        position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', left: 16, width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3,
      }}><X size={18} color="white" /></div>
      <div style={{ position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', right: 16, display: 'flex', gap: 10, zIndex: 3 }}>
        <div onClick={() => silentDownload(url, 'zchat-video.mp4')} style={{
          width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Download size={17} color="white" /></div>
        <div onClick={onForward} style={{
          width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}><Forward size={17} color="white" /></div>
      </div>
      <div style={boxStyle}>
        <video src={url} controls autoPlay playsInline onContextMenu={(e) => e.preventDefault()} onLoadedMetadata={onLoadedMetadata} onTimeUpdate={onTimeUpdate}
          style={ratio ? { width: '100%', height: '100%', display: 'block', objectFit: 'contain' } : { maxWidth: '100vw', maxHeight: '100dvh', display: 'block' }} />
        {overlayUrl && ratio && (
          <img src={overlayUrl} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', objectFit: 'contain' }} />
        )}
      </div>
    </div>
  );
}

async function silentDownload(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('download');
    const blob = await res.blob();
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
    if (isAppleMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return true;
      } catch (err) {
        if (err && err.name === 'AbortError') return false;
      }
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    return true;
  } catch {
    return false;
  }
}

function isActiveUntil(value) {
  return !!value && new Date(value).getTime() > Date.now();
}

function muteLabel(value) {
  if (!isActiveUntil(value)) return '';
  const until = new Date(value);
  if (until.getFullYear() >= 2090) return 'Muted';
  return `Muted until ${until.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

function LoopingSticker({ src, size = 128, style, className, alt = 'sticker' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return undefined;
    const restart = () => { const url = el.getAttribute('data-src'); if (url) { el.src = ''; el.src = url; } };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) restart(); });
    }, { threshold: 0.15 });
    io.observe(el);
    const onShow = () => { if (document.visibilityState === 'visible') restart(); };
    document.addEventListener('visibilitychange', onShow);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onShow); };
  }, [src]);
  return (
    <img ref={ref} src={src} data-src={src} alt={alt} className={className} draggable={false}
      onContextMenu={(e) => e.preventDefault()} decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', ...style }} />
  );
}

function ConfirmDialog({ title, body, confirmLabel = 'Delete', onCancel, onConfirm, danger = true }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  return (
    <div onClick={onCancel} className="zchat-fade" style={{
      position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(5,8,16,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-pop" style={{ background: theme.panelBg, borderRadius: 22, padding: '22px 20px 18px', width: '100%', maxWidth: 300, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 6 }}>{title}</div>
        {body && <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, marginBottom: 18 }}>{body}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: 11, borderRadius: 13, border: `1.5px solid ${theme.border}`, background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} style={{ flex: 1, padding: 11, borderRadius: 13, border: 'none', background: danger ? theme.danger : theme.coral, color: 'white', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT }}>
            {busy ? <Spinner size={13} /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatSearchBar({ query, onChange, count, position, onPrev, onNext, onClose }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${theme.border}`, background: theme.panelBg, flexShrink: 0 }} className="zchat-fade">
      <div style={{ position: 'relative', flex: 1 }}>
        <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 11 }} />
        <input autoFocus value={query} onChange={(e) => onChange(e.target.value)} placeholder="Search in this chat"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) onNext(); else onPrev(); } if (e.key === 'Escape') onClose(); }}
          style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 14, borderRadius: 20 }} />
      </div>
      <span style={{ fontSize: 12, color: theme.muted, minWidth: 44, textAlign: 'center', fontWeight: 600 }}>
        {query.trim() ? (count ? `${position} of ${count}` : 'No results') : ''}
      </span>
      <div role="button" aria-label="Older result" onClick={onPrev} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: count ? 'pointer' : 'default', color: count ? theme.ink : theme.muted, background: theme.rowBg }}>
        <ChevronRight size={17} style={{ transform: 'rotate(-90deg)' }} />
      </div>
      <div role="button" aria-label="Newer result" onClick={onNext} style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: count ? 'pointer' : 'default', color: count ? theme.ink : theme.muted, background: theme.rowBg }}>
        <ChevronRight size={17} style={{ transform: 'rotate(90deg)' }} />
      </div>
      <X size={19} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onClose} />
    </div>
  );
}

function PinnedMessagesBar({ pins, index, labelFor, onOpen }) {
  const { theme } = useTheme();
  if (!pins.length) return null;
  const current = pins[Math.min(index, pins.length - 1)];
  const preview = describeMessage(current);
  return (
    <div onClick={onOpen} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
      background: theme.glass, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${theme.border}`,
    }} className="zchat-fade">
      {pins.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignSelf: 'stretch', justifyContent: 'center' }}>
          {pins.map((p, i) => (
            <div key={p.id} style={{ width: 3, flex: 1, maxHeight: 12, borderRadius: 2, background: i === index ? theme.coral : theme.border }} />
          ))}
        </div>
      )}
      <Pin_ size={16} color={theme.coral} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 800, color: theme.coral }}>
          {pins.length > 1 ? `Pinned message ${index + 1} of ${pins.length}` : 'Pinned message'}
        </div>
        <PreviewLine preview={preview} prefix={`${labelFor(current.sender_id)}: `} color={theme.ink} size={12.5} />
      </div>
      {(current.type === 'image') && current.media_url && (
        <img src={current.media_url} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
      )}
    </div>
  );
}

function extractLinks(text) {
  if (!text) return [];
  const found = [];
  LINK_REGEX.lastIndex = 0;
  let match;
  while ((match = LINK_REGEX.exec(text)) !== null) found.push(match[0]);
  return found;
}

function ChatMediaPanel({ title, messages, labelFor, onClose, onOpenImage, onOpenVideo, onJump }) {
  const { theme } = useTheme();
  const [tab, setTab] = useState('media');
  const visible = messages.filter((m) => !m.deleted);
  const media = visible.filter((m) => (m.type === 'image' || m.type === 'video') && m.media_url).slice().reverse();
  const links = [];
  visible.slice().reverse().forEach((m) => {
    if (m.type === 'system') return;
    extractLinks(m.content).forEach((link, i) => links.push({ key: `${m.id}-${i}`, link, m }));
  });
  const voices = visible.filter((m) => m.type === 'audio' && m.media_url).slice().reverse();
  const dateLabel = (iso) => new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  const tabs = [
    { key: 'media', label: `Media (${media.length})` },
    { key: 'links', label: `Links (${links.length})` },
    { key: 'voice', label: `Voice (${voices.length})` },
  ];
  const openLink = (link) => {
    const isEmail = link.includes('@') && !/^https?:|^www\./i.test(link);
    const href = isEmail ? `mailto:${link}` : (/^https?:/i.test(link) ? link : `https://${link}`);
    window.open(href, '_blank', 'noopener');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: theme.panelBg, display: 'flex', flexDirection: 'column' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))', flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          <div style={{ fontSize: 11.5, color: theme.muted }}>Media, links and voice messages</div>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        {tabs.map((t) => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, textAlign: 'center', padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            color: tab === t.key ? theme.ink : theme.muted, borderBottom: tab === t.key ? `2.5px solid ${theme.coral}` : '2.5px solid transparent',
          }}>{t.label}</div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {tab === 'media' && (
          media.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
              {media.map((m) => (
                <div key={m.id} onClick={() => (m.type === 'image' ? onOpenImage(m.media_url) : onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end, overlayUrl: m.overlay_url }))}
                  style={{ position: 'relative', aspectRatio: '1 / 1', background: '#000', cursor: 'pointer', overflow: 'hidden' }}>
                  {m.type === 'image'
                    ? <img src={m.media_url} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <video src={`${m.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />}
                  {m.type === 'video' && (
                    <div style={{ position: 'absolute', left: 6, bottom: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={11} color="white" style={{ marginLeft: 1 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Photos and videos you share will show here</div>
        )}
        {tab === 'links' && (
          links.length ? links.map(({ key, link, m }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coral, flexShrink: 0 }}>
                {link.includes('@') && !/^https?:|^www\./i.test(link) ? <Mail size={18} /> : <LinkIcon size={18} />}
              </div>
              <div onClick={() => openLink(link)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.coralDeep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>{labelFor(m.sender_id)} · {dateLabel(m.created_at)}</div>
              </div>
              <span onClick={() => onJump(m.id)} style={{ fontSize: 12, fontWeight: 700, color: theme.muted, cursor: 'pointer', flexShrink: 0 }}>Show</span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Links and emails you share will show here</div>
        )}
        {tab === 'voice' && (
          voices.length ? voices.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink }}>{labelFor(m.sender_id)} <span style={{ color: theme.muted, fontWeight: 500 }}>· {dateLabel(m.created_at)}</span></div>
                <AudioBubble url={m.media_url} isMe={false} />
              </div>
              <span onClick={() => onJump(m.id)} style={{ fontSize: 12, fontWeight: 700, color: theme.muted, cursor: 'pointer', flexShrink: 0 }}>Show</span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Voice messages will show here</div>
        )}
      </div>
    </div>
  );
}

const NAME_MAX = 30;
const USERNAME_MAX = 30;
const BIO_MAX = 150;
const STORY_MENTION_TEXT = 'Mentioned you in their story';
const STORY_GROUP_MENTION_TEXT = 'Mentioned this group in their story';
const STORY_IMAGE_MS = 5000;

function usernameProblem(u) {
  if (!u) return 'Choose a username';
  if (u.length < 3) return 'Use at least 3 characters';
  if (u.length > USERNAME_MAX) return `Use ${USERNAME_MAX} characters or fewer`;
  if (!/^[a-z0-9._]+$/.test(u)) return 'Only letters, numbers, periods and underscores';
  if (u.startsWith('.') || u.endsWith('.')) return "Usernames can't start or end with a period";
  if (u.includes('..')) return "Usernames can't have two periods in a row";
  if (/^[0-9._]+$/.test(u)) return 'Add at least one letter';
  return '';
}

function timeShort(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function badgeTierFromTitle(title) {
  const m = String(title || '').toLowerCase().match(/\b(blue|red|gold|pink|green|purple)\b/);
  return m ? m[1] : null;
}

function MailBadgeIcon({ type, size = 42, badgeTier = null }) {
  const warning = type === 'report_warning';
  const mention = type === 'mention';
  const update = type === 'update';
  const badge = type === 'badge';
  const bg = warning ? 'linear-gradient(135deg, #FF5F6D 0%, #FF2E4D 55%, #B3122E 100%)'
    : mention ? 'linear-gradient(135deg, #7C5CFC 0%, #2E7CF6 100%)'
      : update ? 'linear-gradient(135deg, #00C2A8 0%, #2E7CF6 55%, #7C5CFC 100%)'
        : badge ? 'linear-gradient(135deg, #1B2036 0%, #0B0F19 100%)'
      : 'linear-gradient(135deg, #2E7CF6 0%, #00C2A8 100%)';
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0, position: 'relative',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: warning ? '0 4px 14px rgba(255,46,77,0.35)' : '0 4px 14px rgba(46,124,246,0.3)',
    }}>
      {badge ? <VerifiedBadge tier={badgeTier || 'blue'} size={size * 0.62} style={{ marginLeft: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }} />
        : warning ? <ShieldAlert size={size * 0.5} color="white" strokeWidth={2.2} />
        : mention ? <AtSign size={size * 0.46} color="white" strokeWidth={2.4} />
          : update ? <Sparkles size={size * 0.48} color="white" strokeWidth={2.2} />
          : <span style={{ fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: size * 0.5, color: 'white', lineHeight: 1 }}>Z</span>}
      <div style={{ position: 'absolute', inset: 0, borderRadius: size * 0.32, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
    </div>
  );
}

function mailSenderName(type) {
  if (type === 'report_warning') return 'ZChat Safety';
  if (type === 'mention') return 'ZChat Mentions';
  if (type === 'badge') return 'ZChat Team';
  return 'ZChat Team';
}

function VerifiedTick({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#3D9DF2" d={BADGE_SHAPE_PATH} />
      <path d="M8.6 12.3l2.3 2.2 4.6-3.6" fill="none" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StoryAvatar({ profile, size = 64, ring = 'none', onClick, badgePlus = false, dim = false }) {
  const { theme } = useTheme();
  const framed = !!(profile && AVATAR_FRAMES[profile.avatar_frame]);
  const pad = ring === 'none' || framed ? 0 : 3;
  const ringBg = ring === 'unseen'
    ? `conic-gradient(from 210deg, ${theme.coral}, ${theme.teal}, ${theme.gold}, ${theme.coral})`
    : ring === 'seen' ? theme.border : 'transparent';
  return (
    <div onClick={onClick} style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', opacity: dim ? 0.55 : 1 }}>
      <div style={{ width: size, height: size, borderRadius: '50%', padding: pad, boxSizing: 'border-box', background: framed ? 'transparent' : ringBg }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', padding: framed ? 0 : (ring === 'none' ? 0 : 2), boxSizing: 'border-box', background: framed ? 'transparent' : theme.panelBg }}>
          <Avatar emoji={profile?.avatar} name={profile?.name || '?'} frame={profile?.avatar_frame} size={size - (framed || ring === 'none' ? 0 : 10)} />
        </div>
      </div>
      {framed && ring !== 'none' && (
        <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `2px solid ${ring === 'unseen' ? theme.coral : theme.border}`, pointerEvents: 'none' }} />
      )}
      {badgePlus && (
        <div style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 6, width: size * 0.32, height: size * 0.32, borderRadius: '50%', background: theme.coral, border: `2.5px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: size * 0.22, lineHeight: 1 }}>+</div>
      )}
    </div>
  );
}

function StoryMentionPicker({ myId, groups, onPick, onClose }) {
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [people, setPeople] = useState([]);
  useEffect(() => {
    const term = q.trim().replace(/^@/, '');
    if (term.length < 1) { setPeople([]); return undefined; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await searchAccounts(term);
      if (!cancelled) setPeople(sanitizeAvatarList(data, myId).filter((p) => p.id !== myId && !p.is_deleted).slice(0, 12));
    }, 220);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);
  const term = q.trim().replace(/^@/, '').toLowerCase();
  const groupMatches = (groups || []).filter((g) => !term || (g.name || '').toLowerCase().includes(term)).slice(0, 8);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxHeight: '70%', background: '#11151F', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AtSign size={18} color="white" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mention people or groups"
            style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', outline: 'none', color: 'white', borderRadius: 18, padding: '10px 14px', fontFamily: FONT, fontSize: 15 }} />
          <X size={20} color="white" style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 8px 12px' }}>
          {groupMatches.map((g) => (
            <div key={`g-${g.id}`} onClick={() => onPick({ id: g.id, kind: 'group', label: g.name })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', cursor: 'pointer', color: 'white' }}>
              <GroupAvatar avatar={g.avatar} name={g.name} size={38} />
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{g.name}</div><div style={{ fontSize: 11.5, opacity: 0.6 }}>Group</div></div>
            </div>
          ))}
          {people.map((p) => (
            <div key={p.id} onClick={() => onPick({ id: p.id, kind: 'user', label: p.username })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px', cursor: 'pointer', color: 'white' }}>
              <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={38} />
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 11.5, opacity: 0.6 }}>@{p.username}</div></div>
            </div>
          ))}
          {!groupMatches.length && !people.length && (
            <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{term ? 'No one found' : 'Type a name to mention someone'}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryViewer({ groupsList, startGroup = 0, startStoryId = null, onAddStory, onShare, externalPause = false, readOnly = false, highlightLike = null, initialRepostedIds = null, myId, seen, liked, onSeen, onClose, onLike, onReply, onRepost, onDelete, onReport, onOpenProfile, onOpenMention }) {
  const [gi, setGi] = useState(startGroup);
  const [si, setSi] = useState(() => {
    const g = groupsList[startGroup];
    if (!g) return 0;
    if (startStoryId) {
      const at = g.stories.findIndex((s) => s.id === startStoryId);
      if (at >= 0) return at;
    }
    const idx = g.stories.findIndex((s) => !seen.has(s.id));
    return idx >= 0 && g.profile.id !== myId ? idx : 0;
  });
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reply, setReply] = useState('');
  const [replyFocus, setReplyFocus] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [flash, setFlash] = useState('');
  const [viewCount, setViewCount] = useState(null);
  const [likeBurst, setLikeBurst] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState('');
  const [repostedIds, setRepostedIds] = useState(() => new Set(initialRepostedIds || []));
  const [repostBusy, setRepostBusy] = useState(false);
  const [repostPop, setRepostPop] = useState(false);
  const [keyboardLift, setKeyboardLift] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setKeyboardLift(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))));
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => { cancelAnimationFrame(frame); vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  const videoRef = useRef(null);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const durationRef = useRef(STORY_IMAGE_MS);
  const pressRef = useRef(null);

  const group = groupsList[gi];
  const story = group ? group.stories[Math.min(si, group.stories.length - 1)] : null;
  const isMine = group && group.profile.id === myId;
  const stopped = paused || holding || replyFocus || showViewers || menu || confirmDelete || externalPause || !loaded;

  useEffect(() => {
    if (!story) return;
    elapsedRef.current = 0;
    setProgress(0);
    setLoaded(false);
    durationRef.current = STORY_IMAGE_MS;
    onSeen(story);
    setViewCount(null);
    if (!readOnly && group.profile.id === myId) {
      supabase.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', story.id).then(({ count }) => setViewCount(count || 0));
    }
  }, [story && story.id]);

  useEffect(() => {
    let frame = 0;
    lastTickRef.current = performance.now();
    const tick = (t) => {
      const dt = t - lastTickRef.current;
      lastTickRef.current = t;
      if (!stopped) {
        elapsedRef.current += dt;
        const p = Math.min(1, elapsedRef.current / durationRef.current);
        setProgress(p);
        if (p >= 1) { goNext(); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stopped, gi, si]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stopped && loaded) v.pause(); else if (!stopped) v.play().catch(() => { setMuted(true); });
  }, [stopped, loaded, story && story.id]);

  if (!group || !story) return null;

  function goNext() {
    if (si < group.stories.length - 1) { setSi(si + 1); return; }
    if (gi < groupsList.length - 1) {
      const nextGroup = groupsList[gi + 1];
      const idx = nextGroup.stories.findIndex((s) => !seen.has(s.id));
      setGi(gi + 1);
      setSi(idx >= 0 ? idx : 0);
      return;
    }
    onClose();
  }
  function goPrev() {
    if (si > 0) { setSi(si - 1); return; }
    if (gi > 0) { setSi(groupsList[gi - 1].stories.length - 1); setGi(gi - 1); return; }
    elapsedRef.current = 0;
    setProgress(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }

  const onDown = (e) => {
    if (e.target.closest && e.target.closest('[data-story-control]')) return;
    pressRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setHolding(true);
  };
  const onUp = (e) => {
    const p = pressRef.current;
    pressRef.current = null;
    setHolding(false);
    if (!p) return;
    if (replyFocus) {
      const el = document.querySelector('[data-story-reply]');
      if (el) el.blur();
      setReplyFocus(false);
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) { onClose(); return; }
    if (dy < -70 && Math.abs(dy) > Math.abs(dx) && isMine && !readOnly) { setShowViewers(true); return; }
    if (dy < -70 && Math.abs(dy) > Math.abs(dx) && !isMine && !readOnly) { setReplyFocus(true); const el = document.querySelector('[data-story-reply]'); if (el) el.focus(); return; }
    if (Date.now() - p.t > 260 || Math.abs(dx) > 14 || Math.abs(dy) > 14) return;
    const width = e.currentTarget.getBoundingClientRect().width;
    if (e.clientX < width * 0.32) goPrev(); else goNext();
  };

  const isLiked = liked.has(story.id);
  const toggleLike = () => {
    if (!isLiked) { setLikeBurst(true); setTimeout(() => setLikeBurst(false), 700); }
    onLike(story, !isLiked);
  };
  const repostedHere = !!(story && repostedIds.has(story.id));
  useEffect(() => {
    if (!groupsList.length) { onClose(); return; }
    if (!groupsList[gi]) { setGi(groupsList.length - 1); setSi(0); return; }
    const count = groupsList[gi].stories.length;
    if (si >= count) setSi(Math.max(0, count - 1));
  }, [groupsList]);
  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setReply('');
    const el = document.querySelector('[data-story-reply]');
    if (el) el.blur();
    setReplyFocus(false);
    setFlash('Sent');
    setTimeout(() => setFlash(''), 1400);
    await onReply(story, group.profile, text);
  };
  const sendQuickReaction = async (emo) => {
    const el = document.querySelector('[data-story-reply]');
    if (el) el.blur();
    setReplyFocus(false);
    setBurstEmoji(emo);
    setTimeout(() => setBurstEmoji(''), 900);
    await onReply(story, group.profile, emo);
  };
  const mentions = Array.isArray(story.mentions) ? story.mentions : [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#000', display: 'flex', justifyContent: 'center' }} className="zchat-fade">
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: '100%', overflow: 'hidden', color: 'white' }}>
        <div onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { pressRef.current = null; setHolding(false); }}
          onDoubleClick={() => { if (!isMine) toggleLike(); }}
          style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none' }}>
          {story.media_type === 'video' ? (
            <video key={story.id} ref={videoRef} src={story.media_url} playsInline autoPlay muted={muted}
              onLoadedMetadata={(e) => { const d = e.currentTarget.duration; durationRef.current = Number.isFinite(d) && d > 0 ? Math.min(d, 60) * 1000 : 15000; setLoaded(true); }}
              onError={() => setLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
          ) : (
            <img key={story.id} src={story.media_url} alt="" draggable={false} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
          )}
          {story.overlay_url && story.media_type === 'video' && (
            <img src={story.overlay_url} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          )}
          {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={26} /></div>}
          {burstEmoji && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', fontSize: 120, animation: 'zchat-heart-burst 0.9s ease' }}>{burstEmoji}</div>}
          {likeBurst && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', animation: 'zchat-heart-burst 0.7s ease' }}><Heart size={110} color="#FF3B5C" fill="#FF3B5C" /></div>}
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: 'calc(8px + env(safe-area-inset-top)) 10px 28px', background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {group.stories.map((s, i) => (
              <div key={s.id} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'white', width: `${i < si ? 100 : i === si ? progress * 100 : 0}%` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, pointerEvents: 'auto' }} data-story-control>
            <div onClick={() => onOpenProfile(group.profile)} style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <Avatar emoji={group.profile.avatar} name={group.profile.name} frame={group.profile.avatar_frame} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMine && !readOnly ? 'Your story' : group.profile.name}<VerifiedBadge tier={group.profile.verified} custom={group.profile.custom_badge} size={13} /></span>
                  <span style={{ fontSize: 12, opacity: 0.75, flexShrink: 0 }}>{timeShort(story.created_at)}</span>
                </div>
                {story.repost_of && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.8 }}><Repeat size={11} /> Reposted{story.repost_label ? ` from @${story.repost_label}` : ''}</div>}
              </div>
            </div>
            {story.media_type === 'video' && (
              <div onClick={() => setMuted((m) => !m)} style={{ padding: 6, cursor: 'pointer' }}>{muted ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}</div>
            )}
            {!readOnly && <div onClick={() => setMenu(true)} style={{ padding: 6, cursor: 'pointer' }}><MoreVertical size={20} color="white" /></div>}
            <div onClick={onClose} style={{ padding: 6, cursor: 'pointer' }}><X size={22} color="white" /></div>
          </div>
        </div>

        {(story.caption || mentions.length > 0) && !replyFocus && (
          <div data-story-control style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(84px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {story.caption && <div style={{ background: 'rgba(0,0,0,0.45)', padding: '8px 14px', borderRadius: 14, fontSize: 14.5, fontWeight: 600, textAlign: 'center', maxWidth: '100%', wordBreak: 'break-word' }}>{story.caption}</div>}
            {mentions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {mentions.map((mn) => (
                  <div key={`${mn.kind}-${mn.id}`} onClick={() => onOpenMention(mn)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.92)', color: '#111', padding: '5px 11px', borderRadius: 14, fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}>
                    {mn.kind === 'group' ? <Users size={13} /> : <AtSign size={13} />}{mn.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {replyFocus && (
          <div onPointerDown={(e) => { e.preventDefault(); const el = document.querySelector('[data-story-reply]'); if (el) el.blur(); setReplyFocus(false); }}
            className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(0,0,0,0.55)' }} />
        )}
        <div data-story-control style={{ position: 'absolute', left: 0, right: 0, bottom: keyboardLift, zIndex: 4, padding: '14px 12px', paddingBottom: keyboardLift ? 10 : 'calc(14px + env(safe-area-inset-bottom))', background: replyFocus ? 'transparent' : 'linear-gradient(0deg, rgba(0,0,0,0.6), rgba(0,0,0,0))', display: 'flex', alignItems: 'center', gap: 10, transition: 'bottom 0.18s ease' }}>
          {readOnly ? (
            highlightLike ? (
              <>
                <div style={{ flex: 1 }} />
                <div onClick={highlightLike.onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', cursor: 'pointer' }}>
                  <Heart size={27} color={highlightLike.liked ? '#FF3B5C' : 'white'} fill={highlightLike.liked ? '#FF3B5C' : 'none'} />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{highlightLike.count > 0 ? formatCount(highlightLike.count) : ''}</span>
                </div>
              </>
            ) : null
          ) : isMine ? (
            <>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', opacity: 0.85 }}>
                <ChevronRight size={18} style={{ transform: 'rotate(-90deg)' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700 }}>Swipe up for activity</span>
              </div>
              <div onClick={() => setShowViewers(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 22, background: 'rgba(255,255,255,0.14)', cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
                <Eye size={17} /> {viewCount == null ? 'Viewers' : `${viewCount} ${viewCount === 1 ? 'viewer' : 'viewers'}`}
              </div>
              <div style={{ flex: 1 }} />
              {onShare && (
                <div onClick={() => onShare(story, group.profile)} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Share2 size={18} color="white" /></div>
              )}
              {onAddStory && (
                <div onClick={onAddStory} style={{ height: 42, padding: '0 14px', borderRadius: 21, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: 13.5 }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> Add
                </div>
              )}
              <div onClick={() => setConfirmDelete(true)} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={18} color="white" /></div>
            </>
          ) : (
            <>
              {replyFocus && !reply.trim() && (
                <div className="zchat-sheet-up" style={{ position: 'absolute', left: 0, right: 0, bottom: '100%', padding: '16px 18px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  {QUICK_STORY_REACTIONS.map((emo) => (
                    <div key={emo} onPointerDown={(e) => e.preventDefault()} onClick={() => sendQuickReaction(emo)}
                      style={{ fontSize: 38, textAlign: 'center', cursor: 'pointer', lineHeight: 1.2 }}>{emo}</div>
                  ))}
                </div>
              )}
              <input data-story-reply value={reply} onChange={(e) => setReply(e.target.value.slice(0, 1000))} onFocus={() => setReplyFocus(true)} onBlur={() => setTimeout(() => { if (document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-story-reply')) return; setReplyFocus(false); }, 160)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } }}
                placeholder={`Reply to ${(group.profile.name || '').split(' ')[0]}`}
                style={{ flex: 1, minWidth: 0, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.55)', background: 'rgba(0,0,0,0.25)', color: 'white', outline: 'none', fontFamily: FONT, fontSize: 15 }} />
              {reply.trim() ? (
                <div onPointerDown={(e) => e.preventDefault()} onClick={sendReply} style={{ padding: '10px 14px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>Send</div>
              ) : (
                <>
                  <div onClick={toggleLike} style={{ padding: 6, cursor: 'pointer' }}><Heart size={26} color={isLiked ? '#FF3B5C' : 'white'} fill={isLiked ? '#FF3B5C' : 'none'} /></div>
                  <div role="button" aria-label="Repost" onClick={async () => {
                    if (repostBusy) return;
                    if (repostedHere) { setFlash('Already on your story'); setTimeout(() => setFlash(''), 1600); return; }
                    setRepostBusy(true);
                    const result = await onRepost(story, group.profile);
                    setRepostBusy(false);
                    if (result === 'ok' || result === 'already') {
                      setRepostedIds((prev) => new Set(prev).add(story.id));
                      setRepostPop(true);
                      setTimeout(() => setRepostPop(false), 700);
                      setFlash(result === 'ok' ? 'Added to your story' : 'Already on your story');
                      setTimeout(() => setFlash(''), 1600);
                    }
                  }} style={{ padding: 6, cursor: 'pointer', position: 'relative', display: 'flex' }}>
                    <div style={{ transition: 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.5)', transform: repostPop ? 'rotate(180deg) scale(1.25)' : 'rotate(0deg) scale(1)', display: 'flex' }}>
                      {repostBusy ? <Spinner size={22} color="white" /> : <Repeat size={24} color={repostedHere ? '#34D399' : 'white'} strokeWidth={repostedHere ? 2.6 : 2} />}
                    </div>
                    {repostedHere && <div style={{ position: 'absolute', right: 1, bottom: 2, width: 13, height: 13, borderRadius: '50%', background: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid black' }}><Check size={8} color="black" strokeWidth={4} /></div>}
                  </div>
                  {onShare && <div onClick={() => onShare(story, group.profile)} style={{ padding: 6, cursor: 'pointer' }}><Send size={23} color="white" /></div>}
                </>
              )}
            </>
          )}
        </div>

        {flash && <div style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', padding: '9px 16px', borderRadius: 20, fontSize: 13.5, fontWeight: 700 }} className="zchat-pop">{flash}</div>}

        {menu && (
          <div onClick={() => setMenu(false)} style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: '#11151F', borderRadius: '22px 22px 0 0', padding: '8px 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
              {isMine ? (
                <>
                  {onShare && <div onClick={() => { setMenu(false); onShare(story, group.profile); }} style={{ padding: '15px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Share</div>}
                  <div onClick={() => { setMenu(false); setConfirmDelete(true); }} style={{ padding: '15px 22px', color: '#FF5A6A', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Delete story</div>
                </>
              ) : (
                <>
                  {onShare && <div onClick={() => { setMenu(false); onShare(story, group.profile); }} style={{ padding: '15px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Share</div>}
                  <div onClick={() => { setMenu(false); onOpenProfile(group.profile); }} style={{ padding: '15px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>View profile</div>
                  <div onClick={() => { setMenu(false); onReport(group.profile); }} style={{ padding: '15px 22px', color: '#FF5A6A', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Report</div>
                </>
              )}
              <div onClick={() => setMenu(false)} style={{ padding: '15px 22px', opacity: 0.7, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</div>
            </div>
          </div>
        )}
        {showViewers && <StoryViewersSheet story={story} myId={myId} onClose={() => setShowViewers(false)} onOpenProfile={(p) => { setShowViewers(false); onOpenProfile(p); }} />}
        {confirmDelete && (
          <ConfirmDialog title="Delete this story?" body="It will be removed for everyone right away."
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => { setConfirmDelete(false); const remaining = group.stories.length - 1; await onDelete(story); if (remaining <= 0) onClose(); else if (si >= remaining) setSi(remaining - 1); }} />
        )}
      </div>
    </div>
  );
}

function JumpToLatestButton({ count, onClick, bottom }) {
  const { theme } = useTheme();
  return (
    <div onPointerDown={(e) => e.preventDefault()} onClick={onClick} className="zchat-pop" role="button" aria-label="Jump to latest message" style={{
      position: 'absolute', right: 14, bottom, zIndex: 11, width: 42, height: 42, borderRadius: '50%', cursor: 'pointer',
      background: theme.panelBg, border: `1px solid ${theme.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.28)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink,
    }}>
      <ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} />
      {count > 0 && (
        <div style={{ position: 'absolute', top: -7, right: -4, minWidth: 20, height: 20, padding: '0 5px', boxSizing: 'border-box', borderRadius: 10, background: theme.coral, color: 'white', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {count > 99 ? '99+' : count}
        </div>
      )}
    </div>
  );
}

async function notifyBioMentions(profile, oldBio, newBio) {
  try {
    const before = extractMentions(oldBio || '');
    const after = extractMentions(newBio || '');
    const fresh = [...after].filter((u) => !before.has(u) && u !== (profile.username || '').toLowerCase());
    if (!fresh.length) return;
    const { data } = await supabase.from('profiles').select('id, username').in('username', fresh);
    for (const p of data || []) {
      if (p.id === profile.id) continue;
      const { data: sent, error } = await supabase.rpc('send_bio_mention', { p_target: p.id });
      if (!error && sent) sendPushNotification(p.id, 'ZChat', `${profile.name} mentioned you in their bio`, `/?profile=${profile.id}`, profile.avatar);
    }
  } catch {}
}

const CALL_TURN_URLS = '';
const CALL_TURN_USERNAME = '';
const CALL_TURN_CREDENTIAL = '';
const CALL_RING_MS = 45000;

function callIceConfig() {
  const servers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
  if (CALL_TURN_URLS) servers.push({ urls: CALL_TURN_URLS.split(',').map((u) => u.trim()).filter(Boolean), username: CALL_TURN_USERNAME, credential: CALL_TURN_CREDENTIAL });
  return { iceServers: servers, iceCandidatePoolSize: 4 };
}

function formatCallDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

function startCallTone(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return () => {};
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const master = ctx.createGain();
    master.gain.value = kind === 'incoming' ? 0.9 : 0.55;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);
    let stopped = false;
    const note = (freq, start, length, volume, type = 'sine') => {
      const t0 = ctx.currentTime + start;
      [1, 2, 3].forEach((harmonic, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = i === 0 ? type : 'sine';
        o.frequency.value = freq * harmonic;
        const v = volume / (harmonic * harmonic * 1.4);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(v, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
        o.connect(g);
        g.connect(master);
        o.start(t0);
        o.stop(t0 + length + 0.05);
      });
    };
    const incomingPhrase = () => {
      const seq = [659.25, 830.61, 987.77, 1318.51, 987.77, 1318.51];
      seq.forEach((f, i) => note(f, i * 0.16, 0.5, 0.22, 'triangle'));
      [659.25, 830.61, 987.77].forEach((f, i) => note(f, 1.25 + i * 0.16, 0.6, 0.2, 'triangle'));
      if (navigator.vibrate) { try { navigator.vibrate([500, 300, 500]); } catch {} }
    };
    const outgoingPhrase = () => {
      note(440, 0, 1.4, 0.08);
      note(480, 0, 1.4, 0.08);
    };
    const pattern = () => {
      if (stopped) return;
      if (kind === 'incoming') incomingPhrase(); else outgoingPhrase();
    };
    pattern();
    const iv = setInterval(pattern, kind === 'incoming' ? 2600 : 4000);
    return () => {
      stopped = true;
      clearInterval(iv);
      if (navigator.vibrate) { try { navigator.vibrate(0); } catch {} }
      ctx.close().catch(() => {});
    };
  } catch {
    return () => {};
  }
}

function useCallEngine(options) {
  const [call, setCall] = useState(null);
  const callRef = useRef(null);
  const pcsRef = useRef(new Map());
  const pendingIceRef = useRef(new Map());
  const channelRef = useRef(null);
  const localRef = useRef(null);
  const timersRef = useRef({});
  const toneStopRef = useRef(null);
  const screenRef = useRef(null);
  const optsRef = useRef(options);
  optsRef.current = options;

  const put = (value) => { callRef.current = value; setCall(value); };
  const patch = (fnOrObj) => {
    const prev = callRef.current;
    if (!prev) return;
    const next = { ...prev, ...(typeof fnOrObj === 'function' ? fnOrObj(prev) : fnOrObj) };
    callRef.current = next;
    setCall(next);
  };
  const stopTone = () => { if (toneStopRef.current) { toneStopRef.current(); toneStopRef.current = null; } };
  const playTone = (kind) => { stopTone(); toneStopRef.current = startCallTone(kind); };
  const send = (msg) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({ type: 'broadcast', event: 'signal', payload: { ...msg, from: optsRef.current.myId } });
  };

  const getMedia = async (kind, facing = 'user') => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      optsRef.current.snack("Calls aren't supported in this browser");
      return null;
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: kind === 'video' ? { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      });
    } catch {
      optsRef.current.snack(kind === 'video' ? 'Allow camera and microphone to make video calls' : 'Allow microphone access to make calls');
      return null;
    }
  };

  const cleanup = () => {
    Object.values(timersRef.current).forEach((t) => clearTimeout(t));
    timersRef.current = {};
    stopTone();
    if (screenRef.current) { screenRef.current.stream.getTracks().forEach((t) => t.stop()); screenRef.current = null; }
    pcsRef.current.forEach((pc) => { try { pc.close(); } catch {} });
    pcsRef.current = new Map();
    pendingIceRef.current = new Map();
    if (localRef.current) localRef.current.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
  };

  const removePeer = (peerId) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) { try { pc.close(); } catch {} }
    pcsRef.current.delete(peerId);
    patch((prev) => {
      const remoteStreams = { ...prev.remoteStreams };
      delete remoteStreams[peerId];
      return { remoteStreams, participants: prev.participants.filter((id) => id !== peerId) };
    });
  };

  const flushIce = async (peerId) => {
    const pc = pcsRef.current.get(peerId);
    const queue = pendingIceRef.current.get(peerId) || [];
    pendingIceRef.current.delete(peerId);
    for (const c of queue) { try { await pc.addIceCandidate(c); } catch {} }
  };

  const createPeer = (peerId) => {
    const pc = new RTCPeerConnection(callIceConfig());
    pcsRef.current.set(peerId, pc);
    const local = localRef.current;
    if (local) local.getTracks().forEach((t) => pc.addTrack(t, local));
    pc.ontrack = (e) => {
      const stream = (e.streams && e.streams[0]) || new MediaStream([e.track]);
      patch((prev) => ({ remoteStreams: { ...prev.remoteStreams, [peerId]: stream } }));
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: 'ice', to: peerId, candidate: typeof e.candidate.toJSON === 'function' ? e.candidate.toJSON() : e.candidate });
    };
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        stopTone();
        clearTimeout(timersRef.current[`drop-${peerId}`]);
        patch((prev) => ({ status: 'active', startedAt: prev.startedAt || Date.now(), reconnecting: false }));
        const cur = callRef.current;
        if (cur) {
          send({ type: 'mute', muted: !!cur.muted });
          if (cur.kind === 'video') send({ type: 'camera', off: !!cur.cameraOff });
        }
      } else if (state === 'disconnected' || state === 'failed') {
        patch({ reconnecting: true });
        if (optsRef.current.myId < peerId && pc.signalingState === 'stable') offerTo(peerId, true).catch(() => {});
        clearTimeout(timersRef.current[`drop-${peerId}`]);
        timersRef.current[`drop-${peerId}`] = setTimeout(() => {
          if (pc.connectionState === 'connected') return;
          const current = callRef.current;
          if (!current) return;
          if (current.mode === 'direct') finish('failed'); else removePeer(peerId);
        }, state === 'failed' ? 9000 : 18000);
      }
    };
    return pc;
  };

  const offerTo = async (peerId, restart) => {
    const pc = pcsRef.current.get(peerId) || createPeer(peerId);
    const offer = await pc.createOffer(restart ? { iceRestart: true } : undefined);
    await pc.setLocalDescription(offer);
    send({ type: 'offer', to: peerId, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
  };

  const handleSignal = async (p) => {
    const c = callRef.current;
    const myId = optsRef.current.myId;
    if (!c || !p || p.from === myId) return;
    if (p.to && p.to !== myId) return;
    try {
      if (p.type === 'accept' && c.mode === 'direct' && c.direction === 'outgoing') {
        stopTone();
        clearTimeout(timersRef.current.noAnswer);
        patch({ status: 'connecting' });
        await offerTo(p.from);
      } else if (p.type === 'join' && c.mode === 'group' && c.status !== 'ringing') {
        patch((prev) => ({ participants: prev.participants.includes(p.from) ? prev.participants : [...prev.participants, p.from] }));
        if (!pcsRef.current.has(p.from)) {
          if (myId < p.from) await offerTo(p.from); else send({ type: 'hello', to: p.from });
        }
      } else if (p.type === 'hello' && c.mode === 'group') {
        if (!pcsRef.current.has(p.from)) await offerTo(p.from);
      } else if (p.type === 'offer') {
        const pc = pcsRef.current.get(p.from) || createPeer(p.from);
        await pc.setRemoteDescription(p.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: 'answer', to: p.from, sdp: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
        await flushIce(p.from);
        if (c.mode === 'group') patch((prev) => ({ participants: prev.participants.includes(p.from) ? prev.participants : [...prev.participants, p.from] }));
      } else if (p.type === 'answer') {
        const pc = pcsRef.current.get(p.from);
        if (pc && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(p.sdp);
          await flushIce(p.from);
        }
      } else if (p.type === 'ice') {
        const pc = pcsRef.current.get(p.from);
        if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(p.candidate); } catch {} } else {
          const q = pendingIceRef.current.get(p.from) || [];
          q.push(p.candidate);
          pendingIceRef.current.set(p.from, q);
        }
      } else if (p.type === 'decline' && c.mode === 'direct') {
        finish('declined');
      } else if (p.type === 'end' && c.mode === 'direct') {
        finish('remote');
      } else if (p.type === 'leave' && c.mode === 'group') {
        removePeer(p.from);
      } else if (p.type === 'mute') {
        patch((prev) => ({ remoteMuted: { ...(prev.remoteMuted || {}), [p.from]: !!p.muted } }));
      } else if (p.type === 'force-mute') {
        const cur = callRef.current;
        if (cur && !cur.muted && localRef.current) {
          localRef.current.getAudioTracks().forEach((t) => { t.enabled = false; });
          patch({ muted: true });
          send({ type: 'mute', muted: true });
          optsRef.current.snack('Someone in the call muted you');
        }
      } else if (p.type === 'camera') {
        patch((prev) => ({ remoteCameraOff: { ...(prev.remoteCameraOff || {}), [p.from]: !!p.off } }));
      }
    } catch {}
  };

  const joinChannel = (callId) => new Promise((resolve) => {
    const ch = supabase.channel(`call-${callId}`, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'signal' }, ({ payload }) => { handleSignal(payload); });
    channelRef.current = ch;
    let done = false;
    const finishJoin = () => { if (!done) { done = true; resolve(); } };
    ch.subscribe((status) => { if (status === 'SUBSCRIBED') finishJoin(); });
    setTimeout(finishJoin, 5000);
  });

  const finish = (reason = 'hangup') => {
    const c = callRef.current;
    if (!c || c.status === 'ended') return;
    const nowIso = new Date().toISOString();
    const connected = !!c.startedAt;
    if (c.mode === 'direct') {
      if (reason === 'hangup' || reason === 'no_answer' || reason === 'failed') send({ type: 'end' });
      if (reason !== 'declined' && reason !== 'busy') {
        const status = connected ? 'ended' : reason === 'no_answer' ? 'missed' : c.direction === 'outgoing' ? 'cancelled' : 'ended';
        supabase.from('calls').update({ status, ended_at: nowIso }).eq('id', c.id).then(() => {});
      }
      if (c.direction === 'outgoing' && optsRef.current.onDirectEnded) optsRef.current.onDirectEnded(c, connected ? Date.now() - c.startedAt : 0, reason);
    } else {
      send({ type: 'leave' });
      if (pcsRef.current.size === 0) supabase.from('calls').update({ status: 'ended', ended_at: nowIso }).eq('id', c.id).then(() => {});
    }
    cleanup();
    const labels = { declined: 'Call declined', busy: 'On another call', no_answer: 'No answer', failed: 'Call dropped', remote: 'Call ended', hangup: 'Call ended' };
    put({ ...c, status: 'ended', minimized: false, endLabel: labels[reason] || 'Call ended', endedAt: Date.now(), summaryDuration: connected ? Date.now() - c.startedAt : 0, localStream: null, remoteStreams: {} });
    const endedId = c.id;
    setTimeout(() => { if (callRef.current && callRef.current.id === endedId && callRef.current.status === 'ended') put(null); }, 15000);
  };

  const startDirect = async (profile, kind) => {
    if (callRef.current && callRef.current.status === 'ended') put(null);
    if (callRef.current) return;
    const opts = optsRef.current;
    const local = await getMedia(kind);
    if (!local) return;
    localRef.current = local;
    const { data: row, error } = await supabase.from('calls').insert({ caller_id: opts.myId, callee_id: profile.id, kind, status: 'ringing' }).select().single();
    if (error || !row) {
      local.getTracks().forEach((t) => t.stop());
      localRef.current = null;
      opts.snack(friendlyError(error, "Couldn't start the call. You can only call people who follow you back."));
      return;
    }
    put({ id: row.id, mode: 'direct', kind, direction: 'outgoing', status: 'ringing', peer: profile, group: null, localStream: local, remoteStreams: {}, participants: [], muted: false, cameraOff: false, facing: 'user' });
    playTone('outgoing');
    await joinChannel(row.id);
    opts.notify(profile.id, opts.myName, `Incoming ${kind === 'video' ? 'video' : 'voice'} call`, `/?call=${row.id}`, opts.myAvatar);
    timersRef.current.noAnswer = setTimeout(() => {
      const current = callRef.current;
      if (current && current.id === row.id && current.status === 'ringing') finish('no_answer');
    }, CALL_RING_MS);
  };

  const startGroup = async (group, kind) => {
    if (callRef.current && callRef.current.status === 'ended') put(null);
    if (callRef.current) return;
    const opts = optsRef.current;
    const local = await getMedia(kind);
    if (!local) return;
    localRef.current = local;
    const { data: row, error } = await supabase.from('calls').insert({ caller_id: opts.myId, group_id: group.id, kind, status: 'ringing' }).select().single();
    if (error || !row) {
      local.getTracks().forEach((t) => t.stop());
      localRef.current = null;
      opts.snack(friendlyError(error, "Couldn't start the group call. Try again."));
      return;
    }
    put({ id: row.id, mode: 'group', kind, direction: 'outgoing', status: 'active', peer: null, group, localStream: local, remoteStreams: {}, participants: [], muted: false, cameraOff: false, facing: 'user', startedAt: Date.now() });
    await joinChannel(row.id);
    send({ type: 'join' });
    if (opts.onGroupStarted) opts.onGroupStarted(row, group);
  };

  const joinGroupCall = async (row, group, joinOpts = {}) => {
    if (callRef.current && callRef.current.status === 'ended') put(null);
    if (callRef.current) return;
    const local = await getMedia(row.kind);
    if (!local) return;
    localRef.current = local;
    if (joinOpts.cameraOff) local.getVideoTracks().forEach((t) => { t.enabled = false; });
    put({ id: row.id, mode: 'group', kind: row.kind, direction: 'incoming', status: 'active', peer: null, group, localStream: local, remoteStreams: {}, participants: [], muted: false, cameraOff: !!joinOpts.cameraOff, facing: 'user', startedAt: Date.now() });
    await joinChannel(row.id);
    supabase.from('calls').update({ status: 'active' }).eq('id', row.id).eq('status', 'ringing').then(() => {});
    send({ type: 'join' });
  };

  const incoming = (row, caller, group) => {
    if (callRef.current && callRef.current.status === 'ended') put(null);
    if (callRef.current) {
      if (row.callee_id) supabase.from('calls').update({ status: 'busy', ended_at: new Date().toISOString() }).eq('id', row.id).then(() => {});
      return;
    }
    put({ id: row.id, mode: row.group_id ? 'group' : 'direct', kind: row.kind, direction: 'incoming', status: 'ringing', peer: caller, group: group || null, row, localStream: null, remoteStreams: {}, participants: [], muted: false, cameraOff: false, facing: 'user' });
    playTone('incoming');
    const age = Math.max(0, Date.now() - new Date(row.created_at || Date.now()).getTime());
    timersRef.current.ringOut = setTimeout(() => {
      const current = callRef.current;
      if (current && current.id === row.id && current.status === 'ringing') {
        cleanup();
        put(null);
        if (optsRef.current.onMissed) optsRef.current.onMissed(current);
      }
    }, Math.max(5000, CALL_RING_MS - age));
  };

  const accept = async (acceptOpts = {}) => {
    const c = callRef.current;
    if (!c || c.direction !== 'incoming' || c.status !== 'ringing') return;
    stopTone();
    clearTimeout(timersRef.current.ringOut);
    if (c.mode === 'group') {
      put(null);
      await joinGroupCall(c.row || { id: c.id, kind: c.kind }, c.group, acceptOpts);
      return;
    }
    const local = await getMedia(c.kind);
    if (!local) { decline(); return; }
    localRef.current = local;
    if (acceptOpts.cameraOff) local.getVideoTracks().forEach((t) => { t.enabled = false; });
    patch({ localStream: local, status: 'connecting', cameraOff: !!acceptOpts.cameraOff });
    await joinChannel(c.id);
    supabase.from('calls').update({ status: 'accepted', answered_at: new Date().toISOString() }).eq('id', c.id).then(() => {});
    send({ type: 'accept' });
  };

  const decline = () => {
    const c = callRef.current;
    if (!c) return;
    if (c.mode === 'direct' && c.status === 'ringing') supabase.from('calls').update({ status: 'declined', ended_at: new Date().toISOString() }).eq('id', c.id).then(() => {});
    cleanup();
    put(null);
  };

  const onRowUpdate = (row) => {
    const c = callRef.current;
    if (!c || !row || row.id !== c.id) return;
    if (c.mode === 'direct') {
      if (c.direction === 'outgoing' && (row.status === 'declined' || row.status === 'busy')) finish(row.status);
      else if (c.direction === 'incoming' && c.status === 'ringing' && ['cancelled', 'missed', 'ended', 'accepted'].includes(row.status)) {
        cleanup();
        put(null);
        if (row.status !== 'accepted' && optsRef.current.onMissed) optsRef.current.onMissed(c);
      }
    } else if (c.direction === 'incoming' && c.status === 'ringing' && row.status === 'ended') {
      cleanup();
      put(null);
    }
  };

  const toggleMute = () => {
    const c = callRef.current;
    if (!c || !localRef.current) return;
    const next = !c.muted;
    localRef.current.getAudioTracks().forEach((t) => { t.enabled = !next; });
    patch({ muted: next });
    send({ type: 'mute', muted: next });
  };

  const toggleCamera = () => {
    const c = callRef.current;
    if (!c || !localRef.current || c.kind !== 'video') return;
    const next = !c.cameraOff;
    localRef.current.getVideoTracks().forEach((t) => { t.enabled = !next; });
    patch({ cameraOff: next });
    send({ type: 'camera', off: next });
  };

  const flipCamera = async () => {
    const c = callRef.current;
    if (!c || c.kind !== 'video' || !localRef.current) return;
    const facing = c.facing === 'user' ? 'environment' : 'user';
    try {
      const fresh = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
      const track = fresh.getVideoTracks()[0];
      track.enabled = !c.cameraOff;
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(track);
      });
      const old = localRef.current.getVideoTracks()[0];
      if (old) { localRef.current.removeTrack(old); old.stop(); }
      localRef.current.addTrack(track);
      patch({ facing, localStream: new MediaStream(localRef.current.getTracks()) });
    } catch {
      optsRef.current.snack("Couldn't switch camera");
    }
  };

  const minimize = (value) => patch({ minimized: value });

  const stopScreenShare = () => {
    const sc = screenRef.current;
    if (!sc) return;
    screenRef.current = null;
    sc.stream.getTracks().forEach((t) => t.stop());
    const cam = localRef.current && localRef.current.getVideoTracks()[0];
    pcsRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && cam) sender.replaceTrack(cam);
    });
    patch({ sharingScreen: false, screenStream: null });
    const cur = callRef.current;
    if (cur) send({ type: 'camera', off: !!cur.cameraOff });
  };
  const toggleScreenShare = async () => {
    const c = callRef.current;
    if (!c || c.kind !== 'video' || !localRef.current) return;
    if (screenRef.current) { stopScreenShare(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { optsRef.current.snack('Screen sharing works in computer browsers'); return; }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      screenRef.current = { stream: display, track };
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(track);
      });
      track.onended = () => stopScreenShare();
      patch({ sharingScreen: true, screenStream: display });
      send({ type: 'camera', off: false });
    } catch {}
  };

  useEffect(() => {
    const resume = async () => {
      if (document.visibilityState !== 'visible') return;
      const c = callRef.current;
      if (!c || c.status === 'ended' || c.status === 'ringing') return;
      document.querySelectorAll('video, audio').forEach((el) => {
        if (el.srcObject && el.paused) { const p = el.play(); if (p && p.catch) p.catch(() => {}); }
      });
      const local = localRef.current;
      if (local) {
        const dead = local.getTracks().filter((t) => t.readyState === 'ended');
        if (dead.length) {
          try {
            const fresh = await navigator.mediaDevices.getUserMedia({
              audio: dead.some((t) => t.kind === 'audio') ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
              video: dead.some((t) => t.kind === 'video') ? { facingMode: c.facing || 'user' } : false,
            });
            fresh.getTracks().forEach((track) => {
              const old = dead.find((t) => t.kind === track.kind);
              if (old) local.removeTrack(old);
              if (track.kind === 'audio') track.enabled = !c.muted;
              if (track.kind === 'video') track.enabled = !c.cameraOff;
              local.addTrack(track);
              pcsRef.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track && s.track.kind === track.kind);
                if (sender) sender.replaceTrack(track);
              });
            });
            patch({ localStream: new MediaStream(local.getTracks()) });
          } catch {}
        }
      }
      pcsRef.current.forEach((pc, peerId) => {
        if ((pc.connectionState === 'disconnected' || pc.connectionState === 'failed') && pc.signalingState === 'stable') offerTo(peerId, true).catch(() => {});
      });
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('focus', resume);
    };
  }, []);
  const muteOther = (peerId) => send({ type: 'force-mute', to: peerId });
  const dismissSummary = () => { if (callRef.current && callRef.current.status === 'ended') put(null); };

  useEffect(() => () => cleanup(), []);

  return { call, startDirect, startGroup, joinGroupCall, incoming, accept, decline, hangup: () => finish('hangup'), onRowUpdate, toggleMute, toggleCamera, flipCamera, minimize, muteOther, dismissSummary, toggleScreenShare };
}

function CallVideo({ stream, muted, mirror, fit = 'cover' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream || null;
    if (stream) { const p = el.play && el.play(); if (p && p.catch) p.catch(() => {}); }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted={muted} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block', background: '#000', transform: mirror ? 'scaleX(-1)' : 'none' }} />;
}

function CallAudio({ stream }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.srcObject !== stream) el.srcObject = stream || null;
    if (stream) { const p = el.play && el.play(); if (p && p.catch) p.catch(() => {}); }
  }, [stream]);
  return <audio ref={ref} autoPlay playsInline />;
}

function GroupCallBar({ row, onJoin }) {
  const { theme } = useTheme();
  return (
    <div className="zchat-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', flexShrink: 0, background: `${theme.teal}1F`, borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="zchat-call-pulse">
        {row.kind === 'video' ? <VideoIcon size={16} color="white" /> : <Phone size={16} color="white" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink }}>{row.kind === 'video' ? 'Video call' : 'Voice call'} in progress</div>
        <div style={{ fontSize: 11.5, color: theme.muted }}>Tap join to hop in</div>
      </div>
      <button onClick={onJoin} style={{ padding: '8px 18px', borderRadius: 18, border: 'none', background: '#34C759', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Join</button>
    </div>
  );
}

function StoryTray({ me, myStories, trayUsers, seen, onAdd, onOpen }) {
  const { theme } = useTheme();
  const hasMine = myStories.length > 0;
  const label = (text, highlight) => (
    <div style={{ fontSize: 11, fontWeight: highlight ? 700 : 600, color: highlight ? theme.ink : theme.muted, marginTop: 5, maxWidth: 66, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{text}</div>
  );
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 18px 12px', marginTop: -14, overflowX: 'auto', overflowY: 'hidden', flexShrink: 0, WebkitOverflowScrolling: 'touch' }}>
      <div onClick={() => (hasMine ? onOpen(me.id) : onAdd())} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: 'pointer', position: 'relative' }}>
        <StoryAvatar profile={me} size={62} ring={hasMine ? (myStories.every((s) => seen.has(s.id)) ? 'seen' : 'unseen') : 'none'} />
        <div role="button" aria-label="Add to your story" onClick={(e) => { e.stopPropagation(); onAdd(); }} style={{
          position: 'absolute', right: -2, top: 42, zIndex: 6, width: 24, height: 24, borderRadius: '50%', background: theme.coral, border: `2.5px solid ${theme.panelBg}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 17, lineHeight: 1, boxSizing: 'border-box',
        }}>+</div>
        {label('Your story', true)}
      </div>
      {trayUsers.map((u) => {
        const allSeen = u.stories.every((s) => seen.has(s.id));
        return (
          <div key={u.profile.id} onClick={() => onOpen(u.profile.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <StoryAvatar profile={u.profile} size={62} ring={allSeen ? 'seen' : 'unseen'} />
            {label(<>{(u.profile.name || u.profile.username || '').split(' ')[0]}<VerifiedBadge tier={u.profile.verified} custom={u.profile.custom_badge} size={10} style={{ marginLeft: 2 }} /></>, !allSeen)}
          </div>
        );
      })}
    </div>
  );
}

const APP_VERSION = '3.8V';
const STORY_SHARE_TEXT = 'Shared a story';
const accountsThatBlockedMe = new Set();

async function searchAccounts(term) {
  const res = await searchByUsername(term);
  if (res && Array.isArray(res.data)) return { ...res, data: res.data.filter((p) => !accountsThatBlockedMe.has(p.id)) };
  return res;
}

function storyShareLink(ownerId, storyId) {
  const origin = siteOrigin();
  return `${origin}/?story=${ownerId}&s=${storyId}`;
}

function BlockBullet({ icon, text }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '9px 0' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}>{icon}</div>
      <div style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.45, paddingTop: 7 }}>{text}</div>
    </div>
  );
}

function BlockConfirmSheet({ profile, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onCancel);
  const [busy, setBusy] = useState(false);
  return (
    <div onClick={onCancel} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 420, background: 'rgba(5,8,16,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '26px 26px 0 0', padding: '10px 22px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 14px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar emoji={profile.avatar} name={profile.name} frame={profile.avatar_frame} size={72} />
            <div style={{ position: 'absolute', right: -4, bottom: -2, width: 28, height: 28, borderRadius: '50%', background: theme.danger, border: `3px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ban size={14} color="white" /></div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, marginTop: 12 }}>Block {profile.name}<VerifiedBadge tier={profile.verified} custom={profile.custom_badge} size={15} />?</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>@{profile.username}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <BlockBullet icon={<Send size={15} />} text="They won't be able to message you, call you or find your profile." />
          <BlockBullet icon={<Sparkles size={15} />} text="They won't see your status, and you'll both stop following each other." />
          <BlockBullet icon={<BellOff size={15} />} text="They won't be notified that you blocked them." />
          <BlockBullet icon={<SettingsIcon size={15} />} text="You can unblock them anytime in Settings." />
        </div>
        <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 16, border: 'none', background: theme.danger, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
          {busy ? <Spinner size={15} /> : 'Block'}
        </button>
        <button onClick={onCancel} style={{ width: '100%', marginTop: 8, padding: 13, borderRadius: 16, border: 'none', background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 14.5, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
      </div>
    </div>
  );
}

function UnblockConfirmSheet({ profile, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  return (
    <div onClick={onCancel} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 420, background: 'rgba(5,8,16,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-pop" style={{ width: '100%', maxWidth: 320, background: theme.panelBg, borderRadius: 24, padding: '22px 20px 14px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar emoji={profile.avatar} name={profile.name} frame={profile.avatar_frame} size={60} /></div>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink, marginTop: 12 }}>Unblock {profile.name}?</div>
        <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, marginTop: 8 }}>
          They'll be able to message you, call you, see your status and follow you again. They won't be notified that you unblocked them.
        </div>
        <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} style={{ width: '100%', marginTop: 18, padding: 13, borderRadius: 14, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: FONT }}>
          {busy ? <Spinner size={15} /> : 'Unblock'}
        </button>
        <button onClick={onCancel} style={{ width: '100%', marginTop: 6, padding: 12, borderRadius: 14, border: 'none', background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
      </div>
    </div>
  );
}

function BlockedAccountsPanel({ myId, blockedIds, onClose, onUnblock, onOpenProfile }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const idsKey = [...blockedIds].sort().join(',');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: blocks } = await supabase.from('blocks').select('*').eq('blocker_id', myId);
      const list = blocks || [];
      if (!list.length) { if (!cancelled) setRows([]); return; }
      const { data: profs } = await supabase.from('profiles').select('*').in('id', list.map((b) => b.blocked_id));
      const byId = {};
      sanitizeAvatarList(profs, myId).forEach((p) => { byId[p.id] = p; });
      const merged = list.map((b) => ({ profile: byId[b.blocked_id] || { id: b.blocked_id, name: 'Deleted Account', username: 'deleted', avatar: '', is_deleted: true }, at: b.created_at }))
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
      if (!cancelled) setRows(merged);
    })();
    return () => { cancelled = true; };
  }, [idsKey]);
  const term = q.trim().toLowerCase();
  const shown = (rows || []).filter((r) => !term || (r.profile.name || '').toLowerCase().includes(term) || (r.profile.username || '').toLowerCase().includes(term));
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 70, background: theme.panelBg, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))', flexShrink: 0 }}>
        <ArrowLeft size={20} style={{ cursor: 'pointer', color: theme.ink }} onClick={onClose} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Blocked accounts</div>
          <div style={{ fontSize: 11.5, color: theme.muted }}>{rows ? `${rows.length} ${rows.length === 1 ? 'account' : 'accounts'}` : 'Loading'}</div>
        </div>
      </div>
      {rows && rows.length > 4 && (
        <div style={{ padding: '0 16px 10px', position: 'relative', flexShrink: 0 }}>
          <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 30, top: 12 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocked accounts" style={{ ...inputStyle(theme), paddingLeft: 38 }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>}
        {rows && rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ width: 78, height: 78, borderRadius: '50%', margin: '0 auto', border: `2px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}><Ban size={34} /></div>
            <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginTop: 16 }}>No blocked accounts</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>When you block someone, they'll show up here. You can unblock them anytime.</div>
          </div>
        )}
        {shown.map((r) => (
          <div key={r.profile.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px' }}>
            <div onClick={() => !r.profile.is_deleted && onOpenProfile(r.profile)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <Avatar emoji={r.profile.avatar} name={r.profile.name} frame={r.profile.avatar_frame} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.profile.name}<VerifiedBadge tier={r.profile.verified} custom={r.profile.custom_badge} size={12} /></div>
                <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{r.profile.username}</div>
              </div>
            </div>
            <button onClick={() => onUnblock(r.profile)} style={{ padding: '8px 18px', borderRadius: 12, border: `1.5px solid ${theme.border}`, background: theme.rowBg, color: theme.ink, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>Unblock</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryShareSheet({ story, owner, conversations, groups, onSend, onClose }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const [flash, setFlash] = useState('');
  const [sending, setSending] = useState(false);
  const link = storyShareLink(owner.id, story.id);
  const items = [
    ...groups.map((g) => ({ key: `g-${g.id}`, kind: 'group', id: g.id, name: g.name, avatar: g.avatar, sub: 'Group' })),
    ...conversations.filter((c) => !c.otherProfile.is_deleted).map((c) => ({ key: `u-${c.otherProfile.id}`, kind: 'user', id: c.otherProfile.id, name: c.otherProfile.name, avatar: c.otherProfile.avatar, sub: `@${c.otherProfile.username}` })),
  ];
  const term = q.trim().toLowerCase();
  const shown = items.filter((it) => !term || it.name.toLowerCase().includes(term) || it.sub.toLowerCase().includes(term));
  const toggle = (it) => setPicked((prev) => (prev.some((p) => p.key === it.key) ? prev.filter((p) => p.key !== it.key) : [...prev, it]));
  const say = (text) => { setFlash(text); setTimeout(() => setFlash(''), 1600); };
  const action = (icon, label, onClick) => (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', width: 76 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: theme.ink, textAlign: 'center' }}>{label}</span>
    </div>
  );
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 280, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 520, maxHeight: '82%', background: theme.panelBg, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ padding: '6px 16px 10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 13, top: 12 }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats and groups" style={{ ...inputStyle(theme), paddingLeft: 36 }} />
          </div>
        </div>
        <div data-sheet-scroll style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 10px', touchAction: 'pan-y' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {shown.map((it) => {
              const on = picked.some((p) => p.key === it.key);
              return (
                <div key={it.key} onClick={() => toggle(it)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }}>
                    {it.kind === 'group' ? <GroupAvatar avatar={it.avatar} name={it.name} size={56} /> : <Avatar emoji={it.avatar} name={it.name} frame={it.avatar_frame} size={56} />}
                    {on && <div style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: '50%', background: theme.coral, border: `2.5px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="white" /></div>}
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: on ? 800 : 600, color: theme.ink, marginTop: 5, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.name.split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
          {!shown.length && <div style={{ textAlign: 'center', padding: 24, fontSize: 13, color: theme.muted }}>No chats found</div>}
        </div>
        {picked.length > 0 ? (
          <div style={{ padding: '12px 16px 14px', borderTop: `1px solid ${theme.border}` }}>
            <button disabled={sending} onClick={async () => { setSending(true); await onSend(picked); setSending(false); onClose(); }} style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
              {sending ? <Spinner size={15} /> : picked.length === 1 ? `Send to ${picked[0].name.split(' ')[0]}` : `Send to ${picked.length} chats`}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 10px 16px', borderTop: `1px solid ${theme.border}` }}>
            {action(<Copy size={20} />, 'Copy link', async () => { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); })}
            {action(<Share2 size={20} />, 'Share to apps', async () => {
              if (navigator.share) { try { await navigator.share({ title: `${owner.name} on ZChat`, text: `See ${owner.name}'s status on ZChat`, url: link }); } catch {} } else { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); }
            })}
            {action(<Send size={20} />, 'WhatsApp', () => window.open(`https://wa.me/?text=${encodeURIComponent(`See ${owner.name}'s status on ZChat ${link}`)}`, '_blank', 'noopener'))}
            {action(<Mail size={20} />, 'Email', () => { window.location.href = `mailto:?subject=${encodeURIComponent(`${owner.name} on ZChat`)}&body=${encodeURIComponent(link)}`; })}
          </div>
        )}
        {flash && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: -48, transform: 'translateX(-50%)', background: theme.ink, color: theme.panelBg, padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{flash}</div>}
      </div>
    </div>
  );
}

const QUICK_STORY_REACTIONS = ['\u{1F602}', '\u{1F62E}', '\u{1F60D}', '\u{1F622}', '\u{1F44F}', '\u{1F525}', '\u{1F389}', '\u{1F4AF}'];

function StatusIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r={r} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${c * 0.2} ${c * 0.05}`} transform="rotate(-81 12 12)" />
      <circle cx="12" cy="12" r="3.6" fill={color} />
    </svg>
  );
}

function parseCallLog(content) {
  if (typeof content !== 'string' || !content.startsWith('call:')) return null;
  try { return JSON.parse(content.slice(5)); } catch { return null; }
}

function callLogLabel(log, isMe) {
  const kind = log.k === 'video' ? 'video' : 'voice';
  const Kind = kind === 'video' ? 'Video' : 'Voice';
  if (log.s === 'group') return `${Kind} group call`;
  if (log.s === 'missed') return isMe ? `${Kind} call, no answer` : `Missed ${kind} call`;
  if (log.s === 'declined') return isMe ? `${Kind} call declined` : `Missed ${kind} call`;
  return `${Kind} call`;
}

function CallLogBubble({ m, isMe, onCallBack }) {
  const { theme } = useTheme();
  const log = parseCallLog(m.content) || {};
  const missed = log.s === 'missed' || log.s === 'declined';
  const time = m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const sub = log.s === 'group' ? 'Tap to join or call' : missed ? (isMe ? 'Tap to call again' : 'Tap to call back') : formatCallDuration((log.d || 0) * 1000);
  const Icon = log.k === 'video' ? VideoIcon : Phone;
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', margin: '4px 0 6px' }}>
      <div onClick={() => onCallBack && onCallBack(log.k === 'video' ? 'video' : 'voice')} style={{
        display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px 10px 10px', borderRadius: 18, cursor: 'pointer', minWidth: 210,
        background: isMe ? theme.bubbleMe : theme.bubbleThem, border: `1px solid ${theme.border}`,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: missed ? `${theme.danger}22` : `${theme.teal}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
          <Icon size={18} color={missed ? theme.danger : theme.teal} />
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ position: 'absolute', right: -1, bottom: -1, background: theme.panelBg, borderRadius: '50%' }}>
            <path d={isMe ? 'M4 10 L10 4 M5.5 4 H10 V8.5' : 'M10 4 L4 10 M4 5.5 V10 H8.5'} stroke={missed ? theme.danger : theme.teal} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: missed && !isMe ? theme.danger : theme.ink }}>{callLogLabel(log, isMe)}</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>{sub}</div>
        </div>
        <span style={{ fontSize: 10, color: theme.muted, alignSelf: 'flex-end' }}>{time}</span>
      </div>
    </div>
  );
}

function StickerPreviewSheet({ message, isMine, onClose, onReport }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const sticker = STICKERS.find((s) => s.file === message.content);
  const [favs, setFavs] = useState(() => getFavoriteStickerKeys());
  const fav = sticker ? favs.has(sticker.key) : false;
  const row = (icon, label, onClick, danger) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', fontSize: 14.5, fontWeight: 700, color: danger ? theme.danger : theme.ink, borderTop: `1px solid ${theme.border}` }}>
      <span style={{ display: 'flex' }}>{icon}</span>{label}
    </div>
  );
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, background: theme.dark ? 'rgba(3,6,14,0.55)' : 'rgba(230,234,244,0.55)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 440, background: theme.panelBg, borderRadius: '26px 26px 0 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px' }}>
          {message.content && message.content.startsWith('/')
            ? <img src={message.content} alt="" className="zchat-wave-pop" draggable={false} style={{ width: 150, height: 150, objectFit: 'contain' }} />
            : <div style={{ fontSize: 110, lineHeight: 1 }}>{message.content}</div>}
        </div>
        {sticker && row(<Star_ size={19} color="#FFB800" filled={fav} />, fav ? 'Remove from favorites' : 'Add to favorites', () => setFavs(new Set(toggleFavoriteSticker(sticker.key))))}
        {!isMine && row(<Flag size={19} />, 'Report sticker', () => { onClose(); onReport(); }, true)}
        {row(<X size={19} />, 'Close', onClose)}
      </div>
    </div>
  );
}

function AvatarPeek({ profile, online, lastSeen, hasStory, storySeen, canCall, onCall, onClose, onMessage, onProfile, onStory }) {
  const { theme } = useTheme();
  const photo = typeof profile.avatar === 'string' && profile.avatar.startsWith('http') ? profile.avatar : '';
  const btn = (icon, label, onClick, primary) => (
    <div role="button" onClick={() => { onClose(); onClick(); }} style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '11px 4px', cursor: 'pointer', borderRadius: 16,
      background: primary ? `linear-gradient(135deg, ${theme.coral}, ${theme.teal})` : theme.rowBg, color: primary ? 'white' : theme.ink,
    }}>
      {icon}
      <span style={{ fontSize: 11.5, fontWeight: 800 }}>{label}</span>
    </div>
  );
  return (
    <div onClick={onClose} className="zchat-fade" style={{
      position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: theme.dark ? 'rgba(3,6,14,0.6)' : 'rgba(230,234,244,0.6)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-pop" style={{ width: '100%', maxWidth: 300, borderRadius: 28, overflow: 'hidden', background: theme.panelBg, boxShadow: '0 28px 70px rgba(0,0,0,0.5)' }}>
        <div onClick={() => { onClose(); if (hasStory) onStory(); else onProfile(); }} style={{ position: 'relative', aspectRatio: '1 / 1', background: photo ? '#000' : colorForName(profile.name), cursor: 'pointer' }}>
          {photo
            ? <img src={photo} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 110, fontWeight: 800, color: 'rgba(255,255,255,0.92)' }}>{(profile.name || '?').charAt(0).toUpperCase()}</div>}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, padding: '14px 16px 30px', background: 'linear-gradient(180deg, rgba(0,0,0,0.62), rgba(0,0,0,0))', color: 'white' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.name}<VerifiedBadge tier={profile.verified} custom={profile.custom_badge} size={15} /></div>
            <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 5 }}>
              {online && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34C759' }} />}
              {online ? 'Online now' : lastSeen || `@${profile.username}`}
            </div>
          </div>
          {hasStory && (
            <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px 7px 9px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', color: 'white', fontSize: 12, fontWeight: 800 }}>
              <StatusIcon size={16} color={storySeen ? '#C9CCD3' : theme.teal} />
              {storySeen ? 'Status' : 'New status'}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 10 }}>
          {btn(<ChatBubbleIcon size={19} />, 'Message', onMessage)}
          {canCall && btn(<Phone size={19} />, 'Call', onCall)}
          {btn(<User size={19} />, 'Profile', onProfile)}
          {hasStory && btn(<StatusIcon size={19} color="white" />, 'Status', onStory, true)}
        </div>
      </div>
    </div>
  );
}

function StoryRefCard({ m, isMe, onOpen }) {
  const { theme } = useTheme();
  const isShare = m.content === STORY_SHARE_TEXT;
  const isMention = m.content === STORY_MENTION_TEXT || m.content === STORY_GROUP_MENTION_TEXT || isShare;
  const label = isShare ? (isMe ? 'You shared a story' : 'Shared a story')
    : isMention ? (isMe ? 'You mentioned them in your story' : m.content === STORY_GROUP_MENTION_TEXT ? 'Mentioned this group in their story' : 'Mentioned you in their story')
      : (isMe ? 'You replied to their story' : 'Replied to your story');
  const src = m.story_media_url;
  const isVideo = m.story_media_type === 'video';
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(m); }} style={{ cursor: 'pointer', marginBottom: isMention ? 18 : 6 }}>
      <div style={{ fontSize: 11, color: theme.muted, fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <StatusIcon size={12} color={theme.muted} /> {label}
      </div>
      <div style={{ width: 118, height: 210, borderRadius: 14, overflow: 'hidden', background: '#000', position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
        {src ? (
          <>
            {isVideo
              ? <video src={`${src}#t=0.1`} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(0.6)', transform: 'scale(1.2)', pointerEvents: 'none' }} />
              : <img src={src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(0.6)', transform: 'scale(1.2)' }} />}
            {isVideo
              ? <video src={`${src}#t=0.1`} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
              : <img src={src} alt="" loading="lazy" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />}
            {isVideo && <div style={{ position: 'absolute', left: 8, bottom: 8, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Play size={12} color="white" style={{ marginLeft: 1 }} /></div>}
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Story</div>
        )}
      </div>
    </div>
  );
}

function StoryViewersSheet({ story, myId, onClose, onOpenProfile }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [rows, setRows] = useState(null);
  const [tab, setTab] = useState('views');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: views } = await supabase.from('story_views').select('*').eq('story_id', story.id);
      const { data: likes } = await supabase.from('story_likes').select('*').eq('story_id', story.id);
      const ids = [...new Set([...(views || []).map((v) => v.viewer_id), ...(likes || []).map((l) => l.user_id)])].filter((id) => id !== myId);
      if (!ids.length) { if (!cancelled) setRows([]); return; }
      const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
      const likedSet = new Set((likes || []).map((l) => l.user_id));
      const viewedAt = {};
      (views || []).forEach((v) => { viewedAt[v.viewer_id] = v.viewed_at; });
      const list = sanitizeAvatarList(profs, myId).map((p) => ({ profile: p, liked: likedSet.has(p.id), at: viewedAt[p.id] }))
        .sort((a, b) => (b.liked - a.liked) || (new Date(b.at || 0) - new Date(a.at || 0)));
      if (!cancelled) setRows(list);
    })();
    return () => { cancelled = true; };
  }, [story.id]);
  const likedRows = (rows || []).filter((r) => r.liked);
  const shown = tab === 'likes' ? likedRows : (rows || []);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', height: '62%', background: theme.panelBg, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px 0', borderBottom: `1px solid ${theme.border}` }}>
          {[{ k: 'views', icon: <Eye size={16} />, n: rows ? rows.length : null, l: 'Viewers' }, { k: 'likes', icon: <Heart size={16} />, n: rows ? likedRows.length : null, l: 'Likes' }].map((t) => (
            <div key={t.k} onClick={() => setTab(t.k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', cursor: 'pointer', fontSize: 13.5, fontWeight: 800, color: tab === t.k ? theme.ink : theme.muted, borderBottom: tab === t.k ? `2.5px solid ${theme.coral}` : '2.5px solid transparent' }}>
              {t.icon}{t.n == null ? t.l : `${t.n} ${t.l.toLowerCase()}`}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <X size={20} color={theme.muted} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div data-sheet-scroll style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 14px', touchAction: 'pan-y' }}>
          {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color={theme.ink} /></div>}
          {rows && !shown.length && <div style={{ textAlign: 'center', padding: 30, fontSize: 13, color: theme.muted }}>{tab === 'likes' ? 'No likes yet' : 'No views yet'}</div>}
          {shown.map((r) => (
            <div key={r.profile.id} onClick={() => onOpenProfile(r.profile)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <Avatar emoji={r.profile.avatar} name={r.profile.name} frame={r.profile.avatar_frame} size={44} />
                {r.liked && <div style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: '50%', background: theme.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={13} color="#FF3B5C" fill="#FF3B5C" /></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.profile.name}<VerifiedBadge tier={r.profile.verified} custom={r.profile.custom_badge} size={12} /></div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>@{r.profile.username}{r.at ? ` · ${timeShort(r.at)}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallTile({ tile, isVideo, muted, cameraOff, facing, onMenu }) {
  const hasVideo = isVideo && tile.stream && !cameraOff && tile.stream.getVideoTracks().length > 0;
  return (
    <div onClick={onMenu} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#131826', minHeight: 0, minWidth: 0, cursor: onMenu ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${colorForName(tile.avatarName || tile.name)}55, #131826 75%)` }}>
        <Avatar emoji={tile.avatar} name={tile.avatarName || tile.name} size={76} />
      </div>
      {tile.stream && (
        <div style={{ position: 'absolute', inset: 0, opacity: hasVideo ? 1 : 0, transition: 'opacity 0.25s ease' }}>
          <CallVideo stream={tile.stream} muted={tile.local} mirror={tile.local && facing === 'user'} />
        </div>
      )}
      {!tile.local && tile.stream && !isVideo && <CallAudio stream={tile.stream} />}
      <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', fontSize: 12, fontWeight: 700, color: 'white' }}>
        {muted && <MicOff size={12} color="#FF6B6B" />}{tile.name}
      </div>
    </div>
  );
}

function CallScreen({ call, me, nameFor, avatarFor, onAccept, onDecline, onHangup, onToggleMute, onToggleCamera, onFlip, onMinimize, onMuteOther, onCloseSummary, onCallAgain, onMessage, onShareScreen }) {
  const [now, setNow] = useState(Date.now());
  const [pipCorner, setPipCorner] = useState('tr');
  const [joinCameraOff, setJoinCameraOff] = useState(false);
  const [tileMenu, setTileMenu] = useState(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const isVideo = call.kind === 'video';
  const isGroup = call.mode === 'group';
  const ringingIn = call.direction === 'incoming' && call.status === 'ringing';
  const ended = call.status === 'ended';
  const remotes = Object.entries(call.remoteStreams || {});
  const title = isGroup ? (call.group ? call.group.name : 'Group call') : (call.peer ? call.peer.name : '');
  const photo = !isGroup && call.peer && typeof call.peer.avatar === 'string' && call.peer.avatar.startsWith('http') ? call.peer.avatar : '';
  const remoteMuted = call.remoteMuted || {};
  const remoteCamOff = call.remoteCameraOff || {};

  if (ended) {
    const d = call.summaryDuration || 0;
    return (
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#05070D', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT, overflow: 'hidden' }}>
        {photo
          ? <img src={photo} alt="" draggable={false} style={{ position: 'absolute', inset: -40, width: 'calc(100% + 80px)', height: 'calc(100% + 80px)', objectFit: 'cover', filter: 'blur(40px) brightness(0.35)' }} />
          : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${colorForName(title)}55, #05070D 70%)` }} />}
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'flex-end', padding: 'calc(14px + env(safe-area-inset-top)) 16px 0', boxSizing: 'border-box' }}>
          <div role="button" aria-label="Close" onClick={onCloseSummary} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></div>
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          {isGroup ? <GroupAvatar avatar={call.group && call.group.avatar} name={title} size={112} /> : <Avatar emoji={call.peer && call.peer.avatar} name={title} frame={call.peer && call.peer.avatar_frame} size={112} />}
          <div style={{ fontSize: 26, fontWeight: 800, marginTop: 18 }}>{title}{!isGroup && call.peer && <VerifiedBadge tier={call.peer.verified} custom={call.peer.custom_badge} size={20} />}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>{call.endLabel || 'Call ended'}</div>
          <div style={{ marginTop: 14, fontSize: 34, fontWeight: 300, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>{d > 0 ? formatCallDuration(d) : '0:00'}</div>
          <div style={{ marginTop: 6, fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>
            {isVideo ? 'Video call' : 'Voice call'} ended at {new Date(call.endedAt || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', gap: 14, padding: '0 24px', paddingBottom: 'calc(34px + env(safe-area-inset-bottom))' }}>
          {!isGroup && onCallAgain && (
            <>
              <div role="button" onClick={() => onCallAgain('voice')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={24} /></div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Voice</span>
              </div>
              <div role="button" onClick={() => onCallAgain('video')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VideoIcon size={25} /></div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Video</span>
              </div>
            </>
          )}
          <div role="button" onClick={onMessage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={23} /></div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Message</span>
          </div>
        </div>
      </div>
    );
  }

  let status;
  if (ringingIn) status = isGroup ? `${call.peer ? call.peer.name.split(' ')[0] : 'Someone'} is calling the group` : `Incoming ${isVideo ? 'video' : 'voice'} call`;
  else if (call.reconnecting) status = 'Reconnecting\u2026';
  else if (call.status === 'ringing') status = 'Ringing\u2026';
  else if (call.status === 'connecting') status = 'Connecting\u2026';
  else if (isGroup && !remotes.length) status = 'Waiting for others to join';
  else status = call.startedAt ? formatCallDuration(now - call.startedAt) : '';

  const directRemote = !isGroup && remotes.length ? remotes[0][1] : null;
  const peerId = call.peer ? call.peer.id : null;
  const remoteVideoOn = !!(directRemote && isVideo && directRemote.getVideoTracks().length > 0 && !remoteCamOff[peerId]);
  const localVideoOn = !!(isVideo && call.localStream && !call.cameraOff);
  const showRemoteFull = !isGroup && !ringingIn && remoteVideoOn;
  const showLocalFull = !isGroup && !ringingIn && !remoteVideoOn && localVideoOn;

  const tiles = [
    { id: me.id, name: 'You', avatarName: me.name, avatar: me.avatar, stream: call.localStream, local: true },
    ...remotes.map(([id, stream]) => ({ id, name: nameFor(id), avatar: avatarFor(id), stream, local: false })),
  ];
  const cols = tiles.length <= 2 ? 1 : 2;
  const rows = Math.ceil(tiles.length / cols);

  const ctrl = (icon, label, onClick, variant) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 64 }}>
      <div role="button" aria-label={label} onClick={onClick} style={{
        width: 60, height: 60, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: variant === 'end' ? '#FF3B30' : variant === 'on' ? 'white' : 'rgba(255,255,255,0.16)', color: variant === 'on' ? '#0B0F19' : 'white',
        boxShadow: variant === 'end' ? '0 8px 22px rgba(255,59,48,0.45)' : 'none', transition: 'background 0.2s ease',
      }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
    </div>
  );

  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#05070D', color: 'white', display: call.minimized ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {photo
          ? <img src={photo} alt="" draggable={false} style={{ position: 'absolute', inset: -40, width: 'calc(100% + 80px)', height: 'calc(100% + 80px)', objectFit: 'cover', filter: 'blur(40px) brightness(0.42)' }} />
          : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 28%, ${colorForName(title)}66, #05070D 72%)` }} />}
      </div>
      {!isGroup && (
        <>
          <div style={{ position: 'absolute', inset: 0, opacity: showRemoteFull ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
            {directRemote && <CallVideo stream={directRemote} fit="cover" />}
          </div>
          <div style={{ position: 'absolute', inset: 0, opacity: showLocalFull ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
            {call.localStream && isVideo && <CallVideo stream={call.localStream} muted mirror={call.facing === 'user'} />}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          </div>
          {!isVideo && remotes.map(([id, stream]) => <CallAudio key={id} stream={stream} />)}
        </>
      )}

      {isGroup && !ringingIn && (
        <div style={{
          position: 'absolute', left: 8, right: 8, top: 'calc(112px + env(safe-area-inset-top))', bottom: 'calc(150px + env(safe-area-inset-bottom))',
          display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gap: 8,
        }}>
          {tiles.map((t) => (
            <CallTile key={t.id} tile={t} isVideo={isVideo} facing={call.facing}
              muted={t.local ? call.muted : !!remoteMuted[t.id]} cameraOff={t.local ? call.cameraOff : !!remoteCamOff[t.id]}
              onMenu={!t.local ? () => setTileMenu(t) : null} />
          ))}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(10px + env(safe-area-inset-top)) 14px 0' }}>
        {!ringingIn ? (
          <div role="button" aria-label="Back to chats" onClick={onMinimize} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} />
          </div>
        ) : <div style={{ width: 42 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}><Lock size={11} /> End to end encrypted</div>
        <div style={{ width: 42 }} />
      </div>

      {(isGroup ? ringingIn : !showRemoteFull) ? (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '9vh', padding: '0 24px' }}>
          <div style={{ position: 'relative' }}>
            {(call.status === 'ringing' || call.status === 'connecting') && (
              <>
                <div className="zchat-call-ring" style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.28)' }} />
                <div className="zchat-call-ring" style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)', animationDelay: '0.9s' }} />
              </>
            )}
            {isGroup ? <GroupAvatar avatar={call.group && call.group.avatar} name={title} size={122} /> : <Avatar emoji={call.peer && call.peer.avatar} name={title} frame={call.peer && call.peer.avatar_frame} size={122} />}
          </div>
          <div style={{ marginTop: 22, fontSize: 29, fontWeight: 800, textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>{title}{!isGroup && call.peer && <VerifiedBadge tier={call.peer.verified} custom={call.peer.custom_badge} size={22} />}</div>
          <div style={{ marginTop: 6, fontSize: 15, color: 'rgba(255,255,255,0.82)', fontVariantNumeric: 'tabular-nums' }}>{status}</div>
          {!isGroup && peerId && remoteMuted[peerId] && !ringingIn && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', fontSize: 12.5, fontWeight: 700 }}><MicOff size={13} color="#FF6B6B" /> {title.split(' ')[0]} is muted</div>}
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.6)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {!isGroup && peerId && remoteMuted[peerId] && <MicOff size={13} color="#FF6B6B" />}{status}
          </div>
        </div>
      )}

      {!isGroup && localVideoOn && remoteVideoOn && !ringingIn && (
        <div onClick={() => setPipCorner((c) => (c === 'tr' ? 'tl' : c === 'tl' ? 'bl' : c === 'bl' ? 'br' : 'tr'))} style={{
          position: 'absolute', zIndex: 4, width: 104, height: 150, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 10px 26px rgba(0,0,0,0.45)', cursor: 'pointer',
          top: pipCorner[0] === 't' ? 'calc(70px + env(safe-area-inset-top))' : 'auto', bottom: pipCorner[0] === 'b' ? 'calc(160px + env(safe-area-inset-bottom))' : 'auto',
          left: pipCorner[1] === 'l' ? 14 : 'auto', right: pipCorner[1] === 'r' ? 14 : 'auto', transition: 'top 0.25s ease, bottom 0.25s ease, left 0.25s ease, right 0.25s ease',
        }}>
          <CallVideo stream={call.sharingScreen && call.screenStream ? call.screenStream : call.localStream} muted mirror={!call.sharingScreen && call.facing === 'user'} />
        </div>
      )}

      <div style={{ flex: 1 }} />
      {ringingIn ? (
        <div style={{ position: 'relative', zIndex: 4, padding: '0 34px', paddingBottom: 'calc(46px + env(safe-area-inset-bottom))' }}>
          {isVideo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
              <div role="button" onClick={() => setJoinCameraOff((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 22, cursor: 'pointer', background: joinCameraOff ? 'white' : 'rgba(255,255,255,0.16)', color: joinCameraOff ? '#0B0F19' : 'white', fontSize: 13, fontWeight: 800 }}>
                {joinCameraOff ? <VideoOff size={16} /> : <VideoIcon size={16} />}{joinCameraOff ? 'Camera off when you join' : 'Camera on when you join'}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 320, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div role="button" aria-label="Decline" onClick={onDecline} style={{ width: 76, height: 76, borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 28px rgba(255,59,48,0.45)' }}><PhoneOff size={30} /></div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Decline</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div role="button" aria-label="Accept" onClick={() => onAccept({ cameraOff: isVideo && joinCameraOff })} className="zchat-call-pulse" style={{ width: 76, height: 76, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {isVideo ? <VideoIcon size={31} /> : <Phone size={30} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Accept</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 4, margin: '0 10px', marginBottom: 'calc(14px + env(safe-area-inset-bottom))', padding: '16px 10px 14px', borderRadius: 30, background: 'rgba(18,22,34,0.72)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-evenly' }}>
          {ctrl(call.muted ? <MicOff size={24} /> : <Mic size={24} />, call.muted ? 'Unmute' : 'Mute', onToggleMute, call.muted ? 'on' : null)}
          {isVideo && ctrl(call.cameraOff ? <VideoOff size={24} /> : <VideoIcon size={24} />, call.cameraOff ? 'Camera' : 'Camera', onToggleCamera, call.cameraOff ? 'on' : null)}
          {isVideo && ctrl(<SwitchCamera size={24} />, 'Flip', onFlip)}
          {isVideo && onShareScreen && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && ctrl(<Share2 size={23} />, call.sharingScreen ? 'Stop share' : 'Share', onShareScreen, call.sharingScreen ? 'on' : null)}
          {ctrl(<PhoneOff size={26} />, 'End', onHangup, 'end')}
        </div>
      )}

      {tileMenu && (
        <div onClick={() => setTileMenu(null)} style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: '#141926', borderRadius: '24px 24px 0 0', padding: '14px 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 20px 12px' }}>
              <Avatar emoji={tileMenu.avatar} name={tileMenu.name} frame={tileMenu.avatar_frame} size={40} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>{tileMenu.name}</div>
            </div>
            <div onClick={() => { onMuteOther(tileMenu.id); setTileMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', fontWeight: 700, opacity: remoteMuted[tileMenu.id] ? 0.45 : 1 }}>
              <MicOff size={19} /> {remoteMuted[tileMenu.id] ? 'Already muted' : `Mute ${tileMenu.name.split(' ')[0]}`}
            </div>
            <div onClick={() => setTileMenu(null)} style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 700, opacity: 0.7 }}>Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CallMiniBar({ call, remoteVideo, onOpen, onHangup }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const title = call.mode === 'group' ? (call.group ? call.group.name : 'Group call') : (call.peer ? call.peer.name : 'Call');
  const text = call.status === 'ringing' ? 'Ringing\u2026' : call.status === 'connecting' ? 'Connecting\u2026' : call.startedAt ? formatCallDuration(now - call.startedAt) : '';
  return (
    <>
      <div onClick={onOpen} className="zchat-fade" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 480, cursor: 'pointer',
        background: 'linear-gradient(90deg, #1FA855, #34C759)', color: 'white',
        paddingTop: 'env(safe-area-inset-top)', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 14px' }}>
          <div className="zchat-call-pulse" style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {call.kind === 'video' ? <VideoIcon size={14} /> : <Phone size={13} />}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title} <span style={{ fontWeight: 600, opacity: 0.9 }}>· Tap to return</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{text}</span>
          <div role="button" aria-label="End call" onClick={(e) => { e.stopPropagation(); onHangup(); }} style={{ width: 30, height: 30, borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <PhoneOff size={15} />
          </div>
        </div>
      </div>
      {remoteVideo && (
        <div onClick={onOpen} className="zchat-pop" style={{ position: 'fixed', right: 12, bottom: 'calc(96px + env(safe-area-inset-bottom))', width: 108, height: 156, zIndex: 480, borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.45)', border: '2px solid rgba(255,255,255,0.25)', cursor: 'pointer', background: '#000' }}>
          <CallVideo stream={remoteVideo} fit="cover" muted />
        </div>
      )}
    </>
  );
}

const profileStatsCache = (() => {
  try { return new Map(Object.entries(JSON.parse(localStorage.getItem('zchat-profile-stats') || '{}'))); } catch { return new Map(); }
})();
function saveProfileStats(id, patch) {
  const next = { ...(profileStatsCache.get(id) || {}), ...patch };
  profileStatsCache.set(id, next);
  try {
    const entries = [...profileStatsCache.entries()].slice(-150);
    localStorage.setItem('zchat-profile-stats', JSON.stringify(Object.fromEntries(entries)));
  } catch {}
}

const favoriteSync = { userId: null };
function writeFavoriteKeys(keys) {
  try { localStorage.setItem(`zchat-fav-stickers-${favoriteSync.userId || 'local'}`, JSON.stringify([...keys])); } catch {}
  try { window.dispatchEvent(new CustomEvent('zchat-favorites')); } catch {}
}

function ChatBubbleIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M12 3.2c5 0 9 3.4 9 7.7s-4 7.7-9 7.7c-1 0-2-.1-2.9-.4L4.6 20.2c-.5.2-1-.3-.8-.8l1.3-3.3C3.8 14.7 3 12.9 3 10.9 3 6.6 7 3.2 12 3.2z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
      <circle cx="8.3" cy="11" r="1.15" fill={color} />
      <circle cx="12" cy="11" r="1.15" fill={color} />
      <circle cx="15.7" cy="11" r="1.15" fill={color} />
    </svg>
  );
}

function followLabel(state, theyFollowMe) {
  if (state === 'accepted') return 'Following';
  if (state === 'pending') return 'Requested';
  return theyFollowMe ? 'Follow back' : 'Follow';
}

function FollowActionButton({ state, theyFollowMe, busy, onClick, size = 'md', onDark = false }) {
  const { theme } = useTheme();
  const filled = state !== 'accepted' && state !== 'pending';
  const dims = size === 'sm' ? { width: 104, height: 32, fontSize: 12, radius: 10 } : { width: '100%', height: 46, fontSize: 14, radius: 16 };
  return (
    <button onClick={(e) => { e.stopPropagation(); if (!busy) onClick(); }} disabled={busy} style={{
      width: dims.width, minWidth: dims.width, height: dims.height, borderRadius: dims.radius, flexShrink: 0, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: busy ? 'default' : 'pointer', fontFamily: FONT,
      fontSize: dims.fontSize, fontWeight: 700, letterSpacing: 0.1, transition: 'background 0.2s ease, color 0.2s ease',
      border: filled ? 'none' : `1px solid ${onDark ? 'rgba(255,255,255,0.45)' : theme.border}`,
      background: filled ? `linear-gradient(135deg, ${theme.coral}, ${size === 'sm' ? (theme.coralDeep || theme.coral) : '#8b5cf6'})` : (onDark ? 'rgba(0,0,0,0.35)' : (size === 'sm' ? theme.rowBg : (theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'))),
      color: filled || onDark ? 'white' : theme.ink,
      boxShadow: filled ? `0 6px 16px ${theme.coral}40` : 'none',
    }}>
      {busy ? <Spinner size={13} color={filled || onDark ? 'white' : theme.ink} /> : followLabel(state, theyFollowMe)}
    </button>
  );
}

const BADGE_SHAPE_PATH = (() => {
  const lobes = 12;
  const steps = 144;
  const radius = 9.9;
  const depth = 0.075;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = radius * (1 - depth * Math.cos(lobes * a));
    const x = 12 + r * Math.cos(a - Math.PI / 2);
    const y = 12 + r * Math.sin(a - Math.PI / 2);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d}Z`;
})();

const VERIFIED_TIERS = {
  blue: { color: '#3D9DF2', glow: 'rgba(61,157,242,0.45)', label: 'Verified', desc: 'This account is verified.' },
  red: { color: '#F5334F', glow: 'rgba(245,51,79,0.5)', label: 'Official ZChat', desc: 'This is the official ZChat account.' },
  gold: { color: '#F6B40E', glow: 'rgba(246,180,14,0.5)', label: 'Verified email', desc: 'This account has a verified email.' },
  pink: { color: '#FF4FA3', glow: 'rgba(255,79,163,0.5)', label: 'Creator', desc: 'This account is a ZChat creator.' },
  green: { color: '#22C55E', glow: 'rgba(34,197,94,0.5)', label: 'Partner', desc: 'This account is a ZChat partner.' },
  purple: { color: '#8B5CF6', glow: 'rgba(139,92,246,0.5)', label: 'Premium', desc: 'This account is a ZChat premium member.' },
  orange: { color: '#F97316', glow: 'rgba(249,115,22,0.5)', label: 'Rising star', desc: 'This account is a ZChat rising star.' },
  teal: { color: '#14B8A6', glow: 'rgba(20,184,166,0.5)', label: 'Mentor', desc: 'This account is a ZChat mentor.' },
  black: { color: '#111827', glow: 'rgba(148,163,184,0.45)', label: 'Elite', desc: 'This account is a ZChat elite member.', ring: '#94A3B8' },
  silver: { color: '#94A3B8', glow: 'rgba(203,213,225,0.5)', label: 'Legend', desc: 'This account is a ZChat legend.', gradient: ['#F8FAFC', '#94A3B8', '#475569'] },
  diamond: { color: '#67E8F9', glow: 'rgba(103,232,249,0.55)', label: 'Diamond', desc: 'This account is a ZChat diamond member.', gradient: ['#E0F2FE', '#67E8F9', '#6366F1'] },
  rainbow: { color: '#EC4899', glow: 'rgba(236,72,153,0.5)', label: 'Icon', desc: 'This account is a ZChat icon.', gradient: ['#F43F5E', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7'] },
};

const CUSTOM_BADGES = {
  cat: { file: '/badges/badge-cat.webp', fallback: '/badge-cat.webp', label: 'Cute cat charm', ratio: 1.182, rarity: 'epic', animated: true },
  grey_butterfly: { file: '/badges/charm-grey_butterfly.webp', fallback: '/charm-grey_butterfly.webp', label: 'Grey Butterfly charm', ratio: 1.018, rarity: 'rare', animated: true },
  milkbear: { file: '/badges/charm-milkbear.webp', fallback: '/charm-milkbear.webp', label: 'Milkbear charm', ratio: 1.291, rarity: 'rare', animated: true },
  milkbear2: { file: '/badges/charm-milkbear2.webp', fallback: '/charm-milkbear2.webp', label: 'Milkbear2 charm', ratio: 0.809, rarity: 'rare', animated: true },
  milk2: { file: '/badges/charm-milk2.webp', fallback: '/charm-milk2.webp', label: 'Milk2 charm', ratio: 0.864, rarity: 'rare', animated: true },
  cathug: { file: '/badges/charm-cathug.webp', fallback: '/charm-cathug.webp', label: 'Cathug charm', ratio: 0.864, rarity: 'epic', animated: true },
  cutecat_heart: { file: '/badges/charm-cutecat_heart.webp', fallback: '/charm-cutecat_heart.webp', label: 'Cutecat Heart charm', ratio: 1.1, rarity: 'epic', animated: true },
  milk1: { file: '/badges/charm-milk1.webp', fallback: '/charm-milk1.webp', label: 'Milk1 charm', ratio: 1.291, rarity: 'rare', animated: true },
  milk9: { file: '/badges/charm-milk9.webp', fallback: '/charm-milk9.webp', label: 'Milk9 charm', ratio: 0.836, rarity: 'rare', animated: true },
  scuba_cat: { file: '/badges/charm-scuba_cat.webp', fallback: '/charm-scuba_cat.webp', label: 'Scuba Cat charm', ratio: 0.964, rarity: 'legendary', animated: true },
  penguinlove: { file: '/badges/charm-penguinlove.webp', fallback: '/charm-penguinlove.webp', label: 'Penguinlove charm', ratio: 1.1, rarity: 'epic', animated: true },
  milk10: { file: '/badges/charm-milk10.webp', fallback: '/charm-milk10.webp', label: 'Milk10 charm', ratio: 1.245, rarity: 'rare', animated: true },
  milk6: { file: '/badges/charm-milk6.webp', fallback: '/charm-milk6.webp', label: 'Milk6 charm', ratio: 1.336, rarity: 'rare', animated: true },
  milk3: { file: '/badges/charm-milk3.webp', fallback: '/charm-milk3.webp', label: 'Milk3 charm', ratio: 1.136, rarity: 'rare', animated: true },
  milkdance: { file: '/badges/charm-milkdance.webp', fallback: '/charm-milkdance.webp', label: 'Milkdance charm', ratio: 1.018, rarity: 'rare', animated: true },
  milklaughing: { file: '/badges/charm-milklaughing.webp', fallback: '/charm-milklaughing.webp', label: 'Milklaughing charm', ratio: 1.018, rarity: 'rare', animated: true },
  milkrock: { file: '/badges/charm-milkrock.webp', fallback: '/charm-milkrock.webp', label: 'Milkrock charm', ratio: 1.082, rarity: 'rare', animated: true },
};
const customBadgeUrlCache = new Map();
function useCustomBadgeUrl(key) {
  const [url, setUrl] = useState(() => (key && customBadgeUrlCache.has(key) ? customBadgeUrlCache.get(key) : null));
  useEffect(() => {
    let alive = true;
    const spec = key && CUSTOM_BADGES[key];
    if (!spec) { setUrl(null); return undefined; }
    if (customBadgeUrlCache.has(key)) { setUrl(customBadgeUrlCache.get(key)); return undefined; }
    const tryLoad = (raw) => new Promise(async (resolve) => { if (!raw) { resolve(null); return; } const src = await cachedAssetUrl(raw); if (!src) { resolve(null); return; } const img = new Image(); img.onload = () => resolve(src); img.onerror = () => resolve(null); img.src = src; });
    tryLoad(spec.file).then((u) => u || tryLoad(spec.fallback)).then((u) => { if (u) customBadgeUrlCache.set(key, u); if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [key]);
  return url;
}

function CustomBadgeIcon({ badge, size, closeToName }) {
  const url = useCustomBadgeUrl(badge);
  const spec = CUSTOM_BADGES[badge];
  if (!spec || !url) return null;
  const h = Math.round(size * 1.18);
  return (
    <img src={url} alt="" aria-label={spec.label} draggable={false}
      style={{ display: 'inline-block', height: h, width: Math.round(h * spec.ratio), verticalAlign: '-0.22em', marginLeft: closeToName ? 3 : 1, objectFit: 'contain', flexShrink: 0 }} />
  );
}

function VerifiedBadge({ tier, size = 14, style, custom }) {
  const t = VERIFIED_TIERS[tier];
  const hasCustom = !!(custom && CUSTOM_BADGES[custom]);
  if (!t && !hasCustom) return null;
  return (
    <>
      {hasCustom && <CustomBadgeIcon badge={custom} size={size} closeToName />}
      {t && (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: '-0.12em', marginLeft: hasCustom ? 2 : 4, ...style }} aria-label={t.label}>
          {t.gradient && (
            <defs>
              <linearGradient id={`zchat-vb-${tier}`} x1="0" y1="0" x2="1" y2="1">
                {t.gradient.map((c, i) => <stop key={i} offset={`${(i / (t.gradient.length - 1)) * 100}%`} stopColor={c} />)}
              </linearGradient>
            </defs>
          )}
          <path fill={t.gradient ? `url(#zchat-vb-${tier})` : t.color} d={BADGE_SHAPE_PATH} stroke={t.ring || 'none'} strokeWidth={t.ring ? 0.9 : 0} />
          <path d="M8.6 12.3l2.3 2.2 4.6-3.6" fill="none" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
}

function isAppleMobile() {
  const ua = navigator.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

function VerifiedCelebration({ tier, name, onClose }) {
  const t = VERIFIED_TIERS[tier] || VERIFIED_TIERS.blue;
  const pieces = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'radial-gradient(circle at 50% 38%, #1a1f33 0%, #05070D 70%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, overflow: 'hidden', fontFamily: FONT, textAlign: 'center' }}>
      {pieces.map((i) => (
        <span key={i} style={{
          position: 'absolute', top: -20, left: `${(i * 97) % 100}%`, width: 8, height: 14, borderRadius: 2,
          background: [t.color, '#FFFFFF', '#7C5CFC', '#00C2A8'][i % 4], opacity: 0.9,
          animation: `zchat-confetti ${2.6 + (i % 5) * 0.4}s linear ${(i % 9) * 0.25}s infinite`,
        }} />
      ))}
      <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${t.glow} 0%, transparent 70%)`, animation: 'zchat-badge-pulse 2s ease-in-out infinite' }} />
        <div className="zchat-pop"><VerifiedBadge tier={tier} size={110} style={{ marginLeft: 0, filter: `drop-shadow(0 10px 30px ${t.glow})` }} /></div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 26 }}>Congratulations!</div>
      <div style={{ fontSize: 16, marginTop: 10, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {name}<VerifiedBadge tier={tier} size={17} />
      </div>
      <div style={{ fontSize: 14, marginTop: 14, opacity: 0.7, maxWidth: 300, lineHeight: 1.55 }}>
        You're now <b style={{ color: t.color }}>{t.label}</b>. Your badge shows next to your name everywhere on ZChat.
      </div>
      <button onClick={onClose} style={{ marginTop: 34, padding: '14px 44px', borderRadius: 16, border: 'none', background: t.color, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 10px 30px ${t.glow}` }}>Awesome</button>
    </div>
  );
}

function AvatarFrame({ size, tier, children }) {
  const palette = tier === 'red' ? ['#FF2D55', '#FF9500', '#FF2D55']
    : tier === 'gold' ? ['#F5B800', '#FFF1A8', '#C98A00']
      : tier === 'pink' ? ['#FF4FA3', '#FFB3D9', '#C026D3']
        : tier === 'green' ? ['#22C55E', '#A7F3D0', '#059669']
          : tier === 'purple' ? ['#8B5CF6', '#C4B5FD', '#6D28D9']
            : ['#2E7CF6', '#7C5CFC', '#00E5FF'];
  const pad = Math.max(3, Math.round(size * 0.08));
  const outer = size + pad * 2;
  return (
    <div style={{ position: 'relative', width: outer, height: outer, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: `radial-gradient(circle, ${palette[0]}55 40%, transparent 72%)`, animation: 'zchat-badge-pulse 2.4s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 0deg, ${palette[0]}, ${palette[1]}, ${palette[2]}, transparent 60%, ${palette[0]})`, animation: 'zchat-frame-spin 2.8s linear infinite' }} />
      <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', animation: 'zchat-frame-spin 4.5s linear infinite reverse' }}>
        <span style={{ position: 'absolute', top: 0, left: '50%', width: 5, height: 5, marginLeft: -2.5, borderRadius: '50%', background: 'white', boxShadow: `0 0 8px 2px ${palette[1]}` }} />
        <span style={{ position: 'absolute', bottom: 0, left: '50%', width: 4, height: 4, marginLeft: -2, borderRadius: '50%', background: palette[2], boxShadow: `0 0 8px 2px ${palette[0]}` }} />
      </div>
      <div style={{ position: 'absolute', inset: pad - 1, borderRadius: '50%', background: '#05070D', padding: 1 }}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      </div>
    </div>
  );
}

function formatCount(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) return `${(v / 1000000).toFixed(v >= 10000000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (v >= 10000) return `${(v / 1000).toFixed(v >= 100000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return v.toLocaleString();
}

function ProfileHighlights({ profile, isSelf, userId, onOpenHighlight }) {
  const { theme } = useTheme();
  const [items, setItems] = useState(null);
  const [creating, setCreating] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [renameFor, setRenameFor] = useState(null);
  const [renameText, setRenameText] = useState('');
  const [deleteFor, setDeleteFor] = useState(null);
  const pressRef = useRef({ timer: null, fired: false });
  const load = async () => {
    const { data } = await supabase.from('highlights').select('*').eq('user_id', profile.id).order('created_at', { ascending: true });
    setItems(data || []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`highlights-${profile.id}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'highlights' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [profile.id]);
  if (items === null || (!items.length && !isSelf)) return null;
  const startPress = (h) => {
    if (!isSelf) return;
    pressRef.current.fired = false;
    clearTimeout(pressRef.current.timer);
    pressRef.current.timer = setTimeout(() => { pressRef.current.fired = true; if (navigator.vibrate) navigator.vibrate(12); setMenuFor(h); }, 480);
  };
  const endPress = () => clearTimeout(pressRef.current.timer);
  const circle = (content, dashed) => (
    <div style={{ width: 70, height: 70, borderRadius: '50%', padding: 3, boxSizing: 'border-box', background: dashed ? 'transparent' : theme.border, border: dashed ? `1.5px dashed ${theme.border}` : 'none' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: theme.dark ? '#000' : '#fff', padding: 2, boxSizing: 'border-box' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{content}</div>
      </div>
    </div>
  );
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {isSelf && (
          <div onClick={() => setCreating(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, width: 74 }}>
            {circle(<span style={{ fontSize: 30, fontWeight: 300, color: theme.ink, lineHeight: 1 }}>+</span>, true)}
            <span style={{ fontSize: 12.5, color: theme.ink }}>New</span>
          </div>
        )}
        {items.map((h) => (
          <div key={h.id}
            onPointerDown={() => startPress(h)} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
            onContextMenu={(e) => { e.preventDefault(); if (isSelf) setMenuFor(h); }}
            onClick={() => { if (pressRef.current.fired) { pressRef.current.fired = false; return; } onOpenHighlight(h); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0, width: 74 }}>
            {circle(h.cover_url
              ? (h.cover_type === 'video' ? <video src={`${h.cover_url}#t=0.1`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={h.cover_url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)
              : null)}
            <span style={{ fontSize: 12.5, color: theme.ink, maxWidth: 74, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</span>
          </div>
        ))}
      </div>
      {creating && <HighlightCreator userId={userId} onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); }} />}
      {menuFor && (
        <ChatRowSheet title={menuFor.title} subtitle="Highlight" avatar={<div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: theme.rowBg }}>{menuFor.cover_url && menuFor.cover_type !== 'video' && <img src={menuFor.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>}
          onClose={() => setMenuFor(null)}
          actions={[
            { icon: <Edit3 size={18} />, label: 'Rename highlight', onClick: () => { setRenameText(menuFor.title || ''); setRenameFor(menuFor); } },
            { icon: <Trash2 size={18} />, label: 'Delete highlight', onClick: () => setDeleteFor(menuFor), danger: true },
          ]} />
      )}
      {renameFor && (
        <div onClick={() => setRenameFor(null)} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 420, background: 'rgba(5,8,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-pop" style={{ width: '100%', maxWidth: 320, background: theme.panelBg, borderRadius: 22, padding: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 12, textAlign: 'center' }}>Rename highlight</div>
            <input autoFocus value={renameText} maxLength={20} onChange={(e) => setRenameText(e.target.value.slice(0, 20))} style={inputStyle(theme)} />
            <div style={{ fontSize: 11, color: theme.muted, textAlign: 'right', marginTop: 4 }}>{renameText.length}/20</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setRenameFor(null)} style={{ flex: 1, padding: 11, borderRadius: 13, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.ink, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                const title = renameText.trim() || 'Highlights';
                const target = renameFor;
                setRenameFor(null);
                setItems((prev) => (prev || []).map((x) => (x.id === target.id ? { ...x, title } : x)));
                await supabase.from('highlights').update({ title }).eq('id', target.id).eq('user_id', userId);
              }} style={{ flex: 1, padding: 11, borderRadius: 13, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>Save</button>
            </div>
          </div>
        </div>
      )}
      {deleteFor && (
        <ConfirmDialog title="Delete this highlight?" body="It will be removed from your profile. Your statuses stay in your archive."
          onCancel={() => setDeleteFor(null)}
          onConfirm={async () => { const target = deleteFor; setDeleteFor(null); setItems((prev) => (prev || []).filter((x) => x.id !== target.id)); await supabase.from('highlights').delete().eq('id', target.id).eq('user_id', userId); }} />
      )}
    </div>
  );
}

function HighlightCreator({ userId, onClose, onCreated }) {
  const { theme } = useTheme();
  const [stories, setStories] = useState(null);
  const [picked, setPicked] = useState([]);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    supabase.from('stories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(90).then(({ data }) => setStories(data || []));
  }, [userId]);
  const save = async () => {
    if (!picked.length || saving) return;
    setSaving(true);
    const chosen = stories.filter((s) => picked.includes(s.id)).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const { data: h, error } = await supabase.from('highlights').insert({ user_id: userId, title: (title.trim() || 'Highlights').slice(0, 20), cover_url: chosen[0].media_url, cover_type: chosen[0].media_type }).select().single();
    if (error || !h) { setSaving(false); return; }
    await supabase.from('highlight_items').insert(chosen.map((s) => ({ highlight_id: h.id, user_id: userId, media_url: s.media_url, media_type: s.media_type, overlay_url: s.overlay_url || null, caption: s.caption || null })));
    setSaving(false);
    onCreated();
  };
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 90, background: theme.dark ? '#000' : '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))' }}>
        <X size={22} color={theme.ink} style={{ cursor: 'pointer' }} onClick={onClose} />
        <div style={{ flex: 1, fontWeight: 800, fontSize: 16, color: theme.ink }}>New highlight</div>
        <button onClick={save} disabled={!picked.length || saving} style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: picked.length ? theme.coral : theme.rowBg, color: picked.length ? 'white' : theme.muted, fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>{saving ? <Spinner size={13} /> : 'Save'}</button>
      </div>
      <div style={{ padding: '0 16px 12px' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 20))} placeholder="Highlight name" style={inputStyle(theme)} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, alignContent: 'start' }}>
        {stories === null && <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>}
        {stories && !stories.length && <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 30, color: theme.muted, fontSize: 13 }}>Share a status first, then add it to a highlight.</div>}
        {(stories || []).map((s) => {
          const on = picked.includes(s.id);
          return (
            <div key={s.id} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s.id) : [...p, s.id]))} style={{ position: 'relative', aspectRatio: '9 / 16', background: '#111', cursor: 'pointer' }}>
              {s.media_type === 'video' ? <video src={`${s.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={s.media_url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: '50%', border: '2px solid white', background: on ? theme.coral : 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 800 }}>{on ? picked.indexOf(s.id) + 1 : ''}</div>
              <div style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 10, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{new Date(s.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfilePosts({ profile, isSelf, userId, meProfile }) {
  const { theme } = useTheme();
  const [posts, setPosts] = useState(null);
  const [composer, setComposer] = useState(null);
  const [openPost, setOpenPost] = useState(null);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef(null);
  const load = async () => {
    const { data } = await supabase.from('posts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(120);
    setPosts(data || []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`posts-${profile.id}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, (payload) => {
        const row = payload.new && payload.new.user_id ? payload.new : payload.old;
        if (!row || !row.user_id || row.user_id === profile.id) load();
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [profile.id]);
  const share = async (outputs, caption) => {
    setComposer(null);
    setPosting(true);
    for (const item of outputs) {
      const { url, error } = await uploadMedia(item.file, userId);
      if (error || !url) continue;
      let overlayUrl = null;
      if (item.overlayFile) { const up = await uploadMedia(item.overlayFile, userId); if (!up.error) overlayUrl = up.url; }
      await supabase.from('posts').insert({ user_id: userId, media_url: url, media_type: item.kind === 'video' ? 'video' : 'image', overlay_url: overlayUrl, caption: caption || null });
    }
    setPosting(false);
    load();
  };
  return (
    <div style={{ marginTop: 18, marginLeft: -20, marginRight: -20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`, color: theme.ink, fontWeight: 800, fontSize: 13, position: 'sticky', top: 0, zIndex: 5, background: theme.dark ? '#000' : '#fff' }}>
        <ImageIcon size={16} /> Posts
        {isSelf && (
          <div onClick={() => inputRef.current && inputRef.current.click()} style={{ position: 'absolute', right: 16, width: 30, height: 30, borderRadius: 10, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 400 }}>+</div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => { const f = Array.from(e.target.files || []).slice(0, 10); e.target.value = ''; if (f.length) setComposer({ key: Date.now(), files: f }); }} />
      {posting && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, fontSize: 12.5, color: theme.muted }}><Spinner size={13} color={theme.coral} /> Posting</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {(posts || []).map((p) => (
          <div key={p.id} onClick={() => setOpenPost(p)} style={{ position: 'relative', aspectRatio: '3 / 4', background: theme.rowBg, cursor: 'pointer', overflow: 'hidden' }}>
            {p.media_type === 'video' ? <video src={`${p.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={p.media_url} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {p.media_type === 'video' && <Play size={16} color="white" style={{ position: 'absolute', top: 8, right: 8, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }} />}
          </div>
        ))}
      </div>
      {posts && !posts.length && (
        <div style={{ textAlign: 'center', padding: '34px 20px', color: theme.muted }}>
          <div style={{ width: 62, height: 62, borderRadius: '50%', border: `2px solid ${theme.ink}`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}><Camera size={26} /></div>
          <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>{isSelf ? 'Share your first post' : 'No posts yet'}</div>
          {isSelf && <div onClick={() => inputRef.current && inputRef.current.click()} style={{ marginTop: 8, color: theme.coral, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Share a photo or video</div>}
        </div>
      )}
      {composer && <MediaComposer key={composer.key} files={composer.files} recipientName="your profile" onCancel={() => setComposer(null)} onSend={share} />}
      {openPost && <PostViewer post={openPost} owner={profile} userId={userId} meProfile={meProfile} onClose={() => setOpenPost(null)} onDeleted={() => { setOpenPost(null); load(); }} />}
    </div>
  );
}

function postShareLink(postId) {
  const origin = siteOrigin();
  return `${origin}/?post=${postId}`;
}

function timeAgoLong(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

function InstaCommentIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function InstaShareIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <line x1="22" y1="3" x2="9.218" y2="10.083" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

const COMMENT_QUICK_EMOJIS = ['\u2764\uFE0F', '\u{1F64C}', '\u{1F525}', '\u{1F44F}', '\u{1F622}', '\u{1F60D}', '\u{1F62E}', '\u{1F602}'];

function CommentBody({ content, theme }) {
  if (typeof content === 'string' && content.startsWith('sticker:')) {
    const src = content.slice(8);
    return <img src={src} alt="sticker" draggable={false} style={{ width: 88, height: 88, objectFit: 'contain', display: 'block', marginTop: 4 }} />;
  }
  return <div style={{ fontSize: 14.5, lineHeight: 1.45, marginTop: 2, wordBreak: 'break-word', color: theme.ink }}>{content}</div>;
}

function PostViewer({ post, owner, userId, meProfile, onClose, onDeleted }) {
  const { theme } = useTheme();
  const [likes, setLikes] = useState([]);
  const [likerNames, setLikerNames] = useState({});
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [sheet, setSheet] = useState(null);
  const [burst, setBurst] = useState(false);
  const [flash, setFlash] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const lastTapRef = useRef(0);
  const [commentStickers, setCommentStickers] = useState(false);
  const drag = useSheetDrag(() => { setSheet(null); setCommentStickers(false); });
  const liked = likes.some((l) => l.user_id === userId);
  const bg = theme.dark ? '#000' : '#fff';
  const link = postShareLink(post.id);

  const load = async () => {
    const { data: l } = await supabase.from('post_likes').select('*').eq('post_id', post.id).order('created_at', { ascending: false });
    setLikes(l || []);
    const { data: c } = await supabase.from('post_comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true });
    const ids = [...new Set([...(c || []).map((x) => x.user_id), ...((l || []).slice(0, 1).map((x) => x.user_id))])];
    const byId = {};
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', ids);
      sanitizeAvatarList(profs, userId).forEach((p) => { byId[p.id] = p; });
    }
    setLikerNames(byId);
    setComments((c || []).map((x) => ({ ...x, profile: byId[x.user_id] })));
  };
  useEffect(() => {
    load();
    const ch = supabase.channel(`post-${post.id}-${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, () => load())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [post.id]);

  const say = (t) => { setFlash(t); setTimeout(() => setFlash(''), 1600); };
  const like = async (force) => {
    if (liked && force) return;
    if (liked) {
      setLikes((p) => p.filter((l) => l.user_id !== userId));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId);
      return;
    }
    playUiSound('like');
    setLikes((p) => [{ post_id: post.id, user_id: userId }, ...p]);
    await supabase.from('post_likes').upsert({ post_id: post.id, user_id: userId }, { onConflict: 'post_id,user_id' });
    if (owner.id !== userId) sendPushNotification(owner.id, 'ZChat', `${(meProfile && meProfile.name) || 'Someone'} liked your post`, link, meProfile && meProfile.avatar);
  };
  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setBurst(true);
      setTimeout(() => setBurst(false), 850);
      like(true);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };
  const sendComment = async () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: userId, content: value.slice(0, 500) });
    if (owner.id !== userId) sendPushNotification(owner.id, 'ZChat', `${(meProfile && meProfile.name) || 'Someone'} commented: ${value.slice(0, 80)}`, link, meProfile && meProfile.avatar);
    load();
  };
  const sendStickerComment = async (file) => {
    setCommentStickers(false);
    await supabase.from('post_comments').insert({ post_id: post.id, user_id: userId, content: `sticker:${file}` });
    if (owner.id !== userId) sendPushNotification(owner.id, 'ZChat', `${(meProfile && meProfile.name) || 'Someone'} commented with a sticker`, link, meProfile && meProfile.avatar);
    load();
  };
  const deleteComment = async (c) => {
    setComments((prev) => (prev || []).filter((x) => x.id !== c.id));
    await supabase.from('post_comments').delete().eq('id', c.id);
  };
  const firstLiker = likes.length ? likerNames[likes[0].user_id] : null;
  const iconBtn = (icon, onClick, label) => (
    <div role="button" aria-label={label} onClick={onClick} style={{ padding: '8px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>{icon}</div>
  );

  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 90, background: bg, color: theme.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', paddingTop: 'calc(10px + env(safe-area-inset-top))', borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={24} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={onClose} />
        <div style={{ flex: 1, textAlign: 'center', marginRight: 38, lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{owner.username}</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Posts</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <FramedAvatar frame={owner.avatar_frame} size={34}><Avatar emoji={owner.avatar} name={owner.name} frame={owner.avatar_frame} size={34} /></FramedAvatar>
          <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14, marginLeft: owner.avatar_frame ? 6 : 0 }}>{owner.username}<VerifiedBadge tier={owner.verified} custom={owner.custom_badge} size={13} /></div>
          <MoreVertical size={20} style={{ cursor: 'pointer', transform: 'rotate(90deg)' }} onClick={() => setSheet('more')} />
        </div>
        <div onClick={onMediaTap} style={{ position: 'relative', background: '#000', userSelect: 'none' }}>
          {post.media_type === 'video'
            ? <video src={post.media_url} playsInline controls style={{ width: '100%', maxHeight: '78vh', display: 'block', objectFit: 'contain' }} />
            : <img src={post.media_url} alt="" draggable={false} style={{ width: '100%', maxHeight: '78vh', display: 'block', objectFit: 'contain' }} />}
          {post.overlay_url && post.media_type === 'video' && <img src={post.overlay_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
          {burst && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ animation: 'zchat-post-heart 0.85s ease forwards' }}><Heart size={96} color="white" fill="white" style={{ filter: 'drop-shadow(0 6px 20px rgba(0,0,0,0.35))' }} /></div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 6px 0' }}>
          {iconBtn(<><Heart size={27} strokeWidth={2} color={liked ? '#FF3040' : theme.ink} fill={liked ? '#FF3040' : 'none'} style={{ transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.4)', transform: liked ? 'scale(1.1)' : 'scale(1)' }} />{likes.length > 0 && <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 6, color: theme.ink }}>{formatCount(likes.length)}</span>}</>, () => like(false), 'Like')}
          {iconBtn(<><InstaCommentIcon size={25} color={theme.ink} />{comments && comments.length > 0 && <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 6, color: theme.ink }}>{formatCount(comments.length)}</span>}</>, () => setSheet('comments'), 'Comments')}
          {iconBtn(<InstaShareIcon size={24} color={theme.ink} />, () => setSheet('share'), 'Share')}
        </div>
        <div style={{ padding: '2px 14px', fontSize: 14, fontWeight: 700 }}>
          {likes.length === 0 ? 'Be the first to like this' : likes.length === 1 && firstLiker ? <>Liked by {firstLiker.username}<VerifiedBadge tier={firstLiker.verified} custom={firstLiker.custom_badge} size={12} /></> : firstLiker ? <>Liked by {firstLiker.username}<VerifiedBadge tier={firstLiker.verified} custom={firstLiker.custom_badge} size={12} /> and {formatCount(likes.length - 1)} others</> : `${formatCount(likes.length)} likes`}
        </div>
        {post.caption && (
          <div style={{ padding: '4px 14px 0', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' }}>
            <b>{owner.username}</b><VerifiedBadge tier={owner.verified} custom={owner.custom_badge} size={12} /> {post.caption}
          </div>
        )}
        {comments && comments.length > 2 && (
          <div onClick={() => setSheet('comments')} style={{ padding: '6px 14px 0', fontSize: 14, color: theme.muted, cursor: 'pointer' }}>
            View all {comments.length} comments
          </div>
        )}
        {(comments || []).slice(-2).map((c) => (
          <div key={c.id} onClick={() => setSheet('comments')} style={{ padding: '4px 14px 0', fontSize: 14, lineHeight: 1.4, color: theme.ink, cursor: 'pointer', wordBreak: 'break-word' }}>
            <b>{c.profile ? c.profile.username : 'user'}</b><VerifiedBadge tier={c.profile && c.profile.verified} custom={c.profile && c.profile.custom_badge} size={11} />{' '}
            {typeof c.content === 'string' && c.content.startsWith('sticker:') ? <span style={{ color: theme.muted }}>sent a sticker</span> : c.content}
          </div>
        ))}
        <div style={{ padding: '6px 14px 18px', fontSize: 11.5, color: theme.muted }}>{timeAgoLong(post.created_at)}</div>
      </div>

      {sheet === 'comments' && (
        <div onClick={() => setSheet(null)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', height: '78%', background: bg, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 15, padding: '4px 0 12px', borderBottom: `1px solid ${theme.border}` }}>Comments</div>
            <div data-sheet-scroll style={{ flex: 1, overflowY: 'auto', padding: '6px 0', touchAction: 'pan-y' }}>
              {comments && !comments.length && (
                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>No comments yet</div>
                  <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6 }}>Start the conversation.</div>
                </div>
              )}
              {(comments || []).map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 12, padding: '12px 16px' }}>
                  <Avatar emoji={c.profile && c.profile.avatar} name={(c.profile && c.profile.name) || '?'} frame={c.profile && c.profile.avatar_frame} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5 }}><b>{c.profile ? c.profile.username : 'user'}</b><VerifiedBadge tier={c.profile && c.profile.verified} custom={c.profile && c.profile.custom_badge} size={11} /> <span style={{ color: theme.muted }}>{timeShort(c.created_at)}</span></div>
                    <CommentBody content={c.content} theme={theme} />
                  </div>
                  {(c.user_id === userId || owner.id === userId) && <Trash2 size={15} color={theme.muted} style={{ cursor: 'pointer', flexShrink: 0, marginTop: 4 }} onClick={() => deleteComment(c)} />}
                </div>
              ))}
            </div>
            {commentStickers && (
              <div data-sheet-scroll style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, padding: '8px 12px', borderTop: `1px solid ${theme.border}`, touchAction: 'pan-y' }}>
                {STICKERS.map((stk) => (
                  <div key={stk.key} onClick={() => sendStickerComment(stk.file)} style={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 12, background: theme.rowBg }}>
                    <img src={stk.file} alt="" loading="lazy" draggable={false} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '10px 10px 2px', borderTop: `1px solid ${theme.border}` }}>
              {COMMENT_QUICK_EMOJIS.map((emo) => (
                <span key={emo} onClick={() => setText((t) => `${t}${emo}`)} style={{ fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>{emo}</span>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
              <Avatar emoji={meProfile && meProfile.avatar} name={(meProfile && meProfile.name) || '?'} frame={meProfile && meProfile.avatar_frame} size={34} />
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendComment(); }}
                placeholder={`Add a comment for ${owner.username}`} style={{ flex: 1, minWidth: 0, border: `1px solid ${theme.border}`, borderRadius: 22, padding: '11px 16px', background: theme.rowBg, color: theme.ink, outline: 'none', fontFamily: FONT, fontSize: 14 }} />
              <div role="button" aria-label="Stickers" onClick={() => setCommentStickers((v) => !v)} style={{ display: 'flex', cursor: 'pointer', color: commentStickers ? theme.coral : theme.ink }}><Smile size={24} /></div>
              {text.trim() && <span onClick={sendComment} style={{ fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Post</span>}
            </div>
          </div>
        </div>
      )}

      {(sheet === 'share' || sheet === 'more') && (
        <div onClick={() => setSheet(null)} style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', background: bg, borderRadius: '22px 22px 0 0', padding: '8px 0', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 10px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            {[
              { icon: <Copy size={20} />, label: 'Copy link', onClick: async () => { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); } },
              { icon: <Share2 size={20} />, label: 'Share to apps', onClick: async () => { if (navigator.share) { try { await navigator.share({ title: `${owner.username} on ZChat`, url: link }); } catch {} } else { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); } } },
              { icon: <Send size={20} />, label: 'Share on WhatsApp', onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`See this post on ZChat ${link}`)}`, '_blank', 'noopener') },
              owner.id === userId && sheet === 'more' ? { icon: <Trash2 size={20} />, label: 'Delete post', danger: true, onClick: () => setConfirmDelete(true) } : null,
            ].filter(Boolean).map((a) => (
              <div key={a.label} onClick={() => { setSheet(null); a.onClick(); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: a.danger ? theme.danger : theme.ink }}>
                {a.icon}{a.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {flash && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', bottom: 'calc(90px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', background: theme.ink, color: bg, padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, zIndex: 6 }}>{flash}</div>}
      {confirmDelete && <ConfirmDialog title="Delete this post?" body="It will be removed from your profile." onCancel={() => setConfirmDelete(false)} onConfirm={async () => { await supabase.from('posts').delete().eq('id', post.id).eq('user_id', userId); onDeleted(); }} />}
    </div>
  );
}

function useSheetDrag(onClose) {
  const [dy, setDy] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(null);
  const onPointerDown = (e) => {
    const t = e.target;
    if (t.closest && t.closest('input, textarea, select')) return;
    const scroller = t.closest && t.closest('[data-sheet-scroll]');
    if (scroller && scroller.scrollTop > 0) return;
    startRef.current = { y: e.clientY, t: Date.now() };
  };
  const onPointerMove = (e) => {
    const s = startRef.current;
    if (!s) return;
    const d = e.clientY - s.y;
    if (!dragging && d > 6) setDragging(true);
    if (d > 0) setDy(d);
  };
  const finish = (e) => {
    const s = startRef.current;
    startRef.current = null;
    if (!s) return;
    const d = Math.max(0, (e && e.clientY ? e.clientY : s.y) - s.y);
    const velocity = d / Math.max(1, Date.now() - s.t);
    setDragging(false);
    if (d > 110 || (d > 30 && velocity > 0.7)) {
      setDy(window.innerHeight);
      setTimeout(() => { onClose(); setDy(0); }, 200);
    } else {
      setDy(0);
    }
  };
  return {
    sheetProps: { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: () => { startRef.current = null; setDragging(false); setDy(0); } },
    sheetStyle: { transform: `translateY(${dy}px)`, transition: dragging ? 'none' : 'transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1)', touchAction: 'none' },
    dragging,
  };
}

function parsePostLink(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (/\s/.test(trimmed)) return null;
  const m = trimmed.match(/[?&]post=([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  return m ? m[1] : null;
}

const sharedPostCache = new Map();

function PostLinkCard({ postId, onOpen }) {
  const { theme } = useTheme();
  const [data, setData] = useState(() => sharedPostCache.get(postId) || null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (data) return;
    let cancelled = false;
    (async () => {
      const { data: post } = await supabase.from('posts').select('*').eq('id', postId).maybeSingle();
      if (!post) { if (!cancelled) setMissing(true); return; }
      const { data: owner } = await supabase.from('profiles').select('*').eq('id', post.user_id).maybeSingle();
      const value = { post, owner: owner || { username: 'user', name: 'User' } };
      sharedPostCache.set(postId, value);
      if (!cancelled) setData(value);
    })();
    return () => { cancelled = true; };
  }, [postId]);
  if (missing) return <div style={{ fontSize: 13, color: theme.muted, padding: '6px 2px' }}>This post isn't available</div>;
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (data && onOpen) onOpen(data.post, data.owner); }}
      style={{ width: 230, borderRadius: 16, overflow: 'hidden', background: theme.dark ? '#0d0d0d' : '#fff', border: `1px solid ${theme.border}`, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <Avatar emoji={data && data.owner.avatar} name={(data && data.owner.name) || '?'} frame={data && data.owner.avatar_frame} size={24} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data ? data.owner.username : ''}</span>
        {data && <VerifiedBadge tier={data.owner.verified} custom={data.owner.custom_badge} size={12} />}
      </div>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#111' }}>
        {data ? (data.post.media_type === 'video'
          ? <video src={`${data.post.media_url}#t=0.1`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
          : <img src={data.post.media_url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />)
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={18} /></div>}
        {data && data.post.media_type === 'video' && <Play size={18} color="white" style={{ position: 'absolute', top: 8, right: 8, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }} />}
      </div>
      {data && data.post.caption && (
        <div style={{ padding: '8px 10px', fontSize: 12.5, color: theme.ink, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          <b>{data.owner.username}</b> {data.post.caption}
        </div>
      )}
    </div>
  );
}

function getBottomShift() {
  try { const v = parseInt(localStorage.getItem('zchat-bottom-shift') || '0', 10); return Number.isFinite(v) ? Math.max(-60, Math.min(90, v)) : 0; } catch { return 0; }
}
function setBottomShift(v) {
  try { localStorage.setItem('zchat-bottom-shift', String(v)); } catch {}
  try { window.dispatchEvent(new CustomEvent('zchat-bottom-shift')); } catch {}
}

function BottomPositionSetting() {
  const { theme } = useTheme();
  const [value, setValue] = useState(() => getBottomShift());
  if (!isAppleMobile()) return null;
  const update = (v) => { const next = Math.max(-60, Math.min(90, v)); setValue(next); setBottomShift(next); };
  const btn = (label, onClick) => (
    <div role="button" onClick={onClick} style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, fontSize: 20, fontWeight: 700, userSelect: 'none' }}>{label}</div>
  );
  return (
    <div style={{ padding: '12px 4px', borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink }}>Message bar position</div>
      <div style={{ fontSize: 12, color: theme.muted, marginTop: 2, lineHeight: 1.45 }}>If there's empty space under the message bar, tap + until it touches the bottom of the screen. If the bar is hidden, tap −.</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
        {btn('−', () => update(value - 4))}
        <div style={{ minWidth: 60, textAlign: 'center', fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{value > 0 ? `+${value}` : value}</div>
        {btn('+', () => update(value + 4))}
        <div role="button" onClick={() => update(0)} style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Reset</div>
      </div>
    </div>
  );
}

function ScreenDebugInfo() {
  const { theme } = useTheme();
  const [info, setInfo] = useState(null);
  const measure = () => {
    const vv = window.visualViewport;
    const probe = (side) => { const el = document.createElement('div'); el.style.cssText = `position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-${side});visibility:hidden;pointer-events:none;`; document.body.appendChild(el); const h = el.getBoundingClientRect().height; document.body.removeChild(el); return h; };
    const root = document.getElementById('zapp-root');
    const r = root ? root.getBoundingClientRect() : null;
    setInfo({
      standalone: String(window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)),
      innerHeight: window.innerHeight, innerWidth: window.innerWidth, outerHeight: window.outerHeight,
      screen: `${window.screen.width} x ${window.screen.height}`, docHeight: document.documentElement.clientHeight,
      vvHeight: vv ? Math.round(vv.height) : 'n/a', vvOffsetTop: vv ? Math.round(vv.offsetTop) : 'n/a', vvScale: vv ? vv.scale : 'n/a',
      safeTop: probe('top'), safeBottom: probe('bottom'), scrollY: window.scrollY,
      rootTop: r ? Math.round(r.top) : 'n/a', rootBottom: r ? Math.round(r.bottom) : 'n/a', rootHeight: r ? Math.round(r.height) : 'n/a',
      shift: getBottomShift(), dpr: window.devicePixelRatio, ua: navigator.userAgent.slice(0, 80),
    });
  };
  useEffect(() => { measure(); const t = setInterval(measure, 2000); return () => clearInterval(t); }, []);
  if (!info) return null;
  return (
    <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: theme.rowBg, fontSize: 11.5, fontFamily: 'ui-monospace, monospace', color: theme.ink, lineHeight: 1.6, wordBreak: 'break-all' }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Screen info (send a screenshot of this)</div>
      {Object.entries(info).map(([k, v]) => <div key={k}>{k}: {String(v)}</div>)}
    </div>
  );
}








const imageAspectCache = new Map();

function ChatImage({ src, onOpen, caption }) {
  const [aspect, setAspect] = useState(() => imageAspectCache.get(src) || null);
  const maxW = 250;
  const box = (() => {
    if (!aspect) return { width: 230, height: 230 };
    if (aspect >= 1) {
      const width = maxW;
      return { width, height: Math.max(130, Math.round(width / Math.min(aspect, 2.2))) };
    }
    const height = Math.min(330, Math.round(220 / aspect));
    return { width: Math.max(160, Math.round(height * aspect)), height };
  })();
  return (
    <div style={{ position: 'relative', width: box.width, maxWidth: '100%', height: box.height, borderRadius: 14, overflow: 'hidden', marginBottom: caption ? 4 : 2, background: 'rgba(0,0,0,0.18)' }}>
      <img src={src} alt="" loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth && img.naturalHeight) {
            const a = img.naturalWidth / img.naturalHeight;
            imageAspectCache.set(src, a);
            setAspect((prev) => (prev && Math.abs(prev - a) < 0.01 ? prev : a));
          }
        }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div onClick={(e) => { e.stopPropagation(); silentDownload(src, 'zchat-photo.jpg'); }} style={{
        position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%',
        background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      }}><Download size={13} color="white" /></div>
    </div>
  );
}

let uiAudioCtx = null;
function playUiSound(kind) {
  try {
    if (localStorage.getItem('zchat-sound') === 'off') return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!uiAudioCtx) uiAudioCtx = new Ctx();
    const ctx = uiAudioCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const tone = (freqFrom, freqTo, start, length, volume, type = 'sine') => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freqFrom, t + start);
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t + start + length);
      g.gain.setValueAtTime(0.0001, t + start);
      g.gain.exponentialRampToValueAtTime(volume, t + start + Math.min(0.015, length / 3));
      g.gain.exponentialRampToValueAtTime(0.0001, t + start + length);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t + start);
      o.stop(t + start + length + 0.03);
    };
    if (kind === 'send') { tone(520, 980, 0, 0.11, 0.09); tone(980, 1180, 0.05, 0.08, 0.05); }
    else if (kind === 'like') { tone(740, 1100, 0, 0.09, 0.08); tone(1100, 1480, 0.07, 0.1, 0.06); }
    else if (kind === 'repost') { tone(660, 660, 0, 0.08, 0.06); tone(880, 880, 0.08, 0.08, 0.06); tone(1320, 1320, 0.16, 0.14, 0.07); }
    else if (kind === 'record-start') { tone(420, 700, 0, 0.12, 0.08); }
    else if (kind === 'record-stop') { tone(700, 420, 0, 0.12, 0.07); }
    else if (kind === 'cancel') { tone(300, 160, 0, 0.16, 0.08, 'triangle'); }
    else if (kind === 'shutter') { tone(1800, 600, 0, 0.05, 0.08, 'square'); tone(900, 300, 0.05, 0.07, 0.05, 'triangle'); }
    else if (kind === 'delete') { tone(380, 200, 0, 0.14, 0.07, 'triangle'); }
    else if (kind === 'tap') { tone(1500, 1300, 0, 0.03, 0.035); }
  } catch {}
}

function voiceBars(seed, count = 30) {
  let h = 0;
  const str = String(seed || 'z');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  const out = [];
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const base = 0.25 + ((h >>> 8) % 1000) / 1000 * 0.75;
    const shape = 0.55 + 0.45 * Math.sin((i / count) * Math.PI);
    out.push(Math.max(0.18, Math.min(1, base * shape + 0.1)));
  }
  return out;
}

function AudioBubble({ url, isMe }) {
  const { theme } = useTheme();
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const fixingRef = useRef(false);
  const bars = useMemo(() => voiceBars(url), [url]);

  const fmt = (s) => {
    const v = Number.isFinite(s) ? Math.max(0, s) : 0;
    return `${Math.floor(v / 60)}:${Math.floor(v % 60).toString().padStart(2, '0')}`;
  };
  const onMeta = (e) => {
    const el = e.currentTarget;
    if (Number.isFinite(el.duration) && el.duration > 0) { setDuration(el.duration); return; }
    fixingRef.current = true;
    el.currentTime = 1e7;
  };
  const onTime = (e) => {
    const el = e.currentTarget;
    if (fixingRef.current) {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        fixingRef.current = false;
        setDuration(el.duration);
        el.currentTime = 0;
      }
      return;
    }
    setProgress(el.currentTime);
  };
  const toggle = (e) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause(); else { el.playbackRate = speed; el.play().catch(() => {}); }
  };
  const seek = (e) => {
    e.stopPropagation();
    const el = audioRef.current;
    if (!el || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration;
    setProgress(el.currentTime);
  };
  const cycleSpeed = (e) => {
    e.stopPropagation();
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };
  const pct = duration ? progress / duration : 0;
  const active = isMe ? 'rgba(255,255,255,0.95)' : theme.coral;
  const idle = isMe ? 'rgba(255,255,255,0.38)' : (theme.dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 4px 6px', minWidth: 220 }}>
      <audio ref={audioRef} src={url} preload="metadata"
        onLoadedMetadata={onMeta} onDurationChange={(e) => { const d = e.currentTarget.duration; if (Number.isFinite(d) && d > 0 && !fixingRef.current) setDuration(d); }}
        onTimeUpdate={onTime}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setProgress(0); }} />
      <div role="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
        background: isMe ? 'rgba(255,255,255,0.22)' : theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {playing ? <Pause size={17} color="white" fill="white" /> : <Play size={17} color="white" fill="white" style={{ marginLeft: 2 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div onClick={seek} style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28, cursor: 'pointer' }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, height: `${Math.round(b * 100)}%`, minHeight: 3, borderRadius: 2, background: (i + 0.5) / bars.length <= pct ? active : idle, transition: 'background 0.15s linear' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: isMe ? 'rgba(255,255,255,0.8)' : theme.muted, fontVariantNumeric: 'tabular-nums' }}>
            {playing || progress > 0 ? fmt(progress) : fmt(duration)}
          </span>
          {(playing || progress > 0) && (
            <span role="button" onClick={cycleSpeed} style={{ fontSize: 10.5, fontWeight: 800, padding: '1px 7px', borderRadius: 9, cursor: 'pointer', background: isMe ? 'rgba(255,255,255,0.22)' : theme.rowBg, color: isMe ? 'white' : theme.ink }}>{speed}x</span>
          )}
        </div>
      </div>
    </div>
  );
}

const AVATAR_FRAMES = {
  fire_wolf: { file: '/frames/frame-fire-wolf.webp', fallback: '/frame-fire-wolf.webp', label: 'Inferno wolf frame', scale: 1.428, centerX: 0.5002, centerY: 0.4605, glow: '#ff5a1f', rarity: 'legendary' },
  ice_wolf: { file: '/frames/frame-ice-wolf.webp', fallback: '/frame-ice-wolf.webp', label: 'Frost wolf frame', scale: 1.399, centerX: 0.4968, centerY: 0.4791, glow: '#38bdf8', rarity: 'legendary' },
  frost_dragon: { file: '/frames/frame-frost-dragon.webp', fallback: '/frame-frost-dragon.webp', label: 'Frost dragon frame', scale: 1.521, centerX: 0.4802, centerY: 0.5087, mask: false, rarity: 'legendary' },
  emerald_lion: { file: '/frames/frame-emerald-lion.webp', fallback: '/frame-emerald-lion.webp', label: 'Emerald lion frame', scale: 1.567, centerX: 0.4978, centerY: 0.4488, mask: false, rarity: 'legendary' },
  crystal_deer: { file: '/frames/frame-crystal-deer.webp', fallback: '/frame-crystal-deer.webp', label: 'Crystal deer frame', scale: 1.413, centerX: 0.4877, centerY: 0.4499, mask: false, rarity: 'epic' },
  azure_phoenix: { file: '/frames/frame-azure-phoenix.webp', fallback: '/frame-azure-phoenix.webp', label: 'Azure phoenix frame', scale: 1.4, centerX: 0.5081, centerY: 0.4923, mask: false, rarity: 'epic' },
  lilac_kitty: { file: '/frames/frame-lilac-kitty.webp', fallback: '/frame-lilac-kitty.webp', label: 'Lilac kitty frame', scale: 1.38, centerX: 0.4907, centerY: 0.477, mask: false, rarity: 'epic' },
  fairy_princess: { file: '/frames/frame-fairy-princess.webp', fallback: '/frame-fairy-princess.webp', label: 'Fairy princess frame', scale: 1.416, centerX: 0.5068, centerY: 0.4836, mask: false, rarity: 'epic' },
  rose_hearts: { file: '/frames/frame-rose-hearts.webp', fallback: '/frame-rose-hearts.webp', label: 'Rose hearts frame', scale: 1.604, centerX: 0.5132, centerY: 0.4549, mask: false, rarity: 'rare' },
  crimson_lily: { file: '/frames/frame-crimson-lily.webp', fallback: '/frame-crimson-lily.webp', label: 'Crimson lily frame', scale: 1.309, centerX: 0.5151, centerY: 0.4588, mask: false, rarity: 'rare' },
  sapphire_butterfly: { file: '/frames/frame-sapphire-butterfly.webp', fallback: '/frame-sapphire-butterfly.webp', label: 'Sapphire butterfly frame', scale: 1.317, centerX: 0.4983, centerY: 0.5, mask: false, rarity: 'rare' },
};

function frameMaskStyle(spec) {
  if (spec.mask === false) return {};
  const inner = Math.max(0, Math.min(80, 90 / (spec.scale || 1.5)));
  const mask = `radial-gradient(circle closest-side, rgba(0,0,0,0) ${inner.toFixed(1)}%, #000 ${(inner + 4).toFixed(1)}%, #000 86%, rgba(0,0,0,0) 100%)`;
  return { WebkitMaskImage: mask, maskImage: mask };
}
const frameUrlCache = new Map();
const frameWaiters = new Map();
const frameImageKeep = [];
async function cachedAssetUrl(url) {
  if (!url) return null;
  try {
    if (typeof caches === 'undefined') return url;
    const cache = await caches.open('zchat-assets-v1');
    let res = await cache.match(url);
    if (!res) {
      const net = await fetch(url, { cache: 'no-cache' });
      if (!net.ok) return null;
      const type = net.headers.get('content-type') || '';
      if (type.includes('text/html')) return null;
      await cache.put(url, net.clone());
      res = net;
    }
    const blob = await res.blob();
    if (!blob.size) return null;
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}
function loadFrameImage(rawUrl) {
  return new Promise(async (resolve) => {
    if (!rawUrl) { resolve(null); return; }
    const url = await cachedAssetUrl(rawUrl);
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      frameImageKeep.push(img);
      const done = () => resolve(url);
      if (img.decode) img.decode().then(done, done); else done();
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
function resolveFrameUrl(key) {
  const spec = AVATAR_FRAMES[key];
  if (!spec) return Promise.resolve(null);
  if (frameUrlCache.has(key)) return Promise.resolve(frameUrlCache.get(key));
  if (frameWaiters.has(key)) return frameWaiters.get(key);
  const p = loadFrameImage(spec.file)
    .then((u) => u || loadFrameImage(spec.fallback))
    .then((u) => {
      frameWaiters.delete(key);
      if (u) frameUrlCache.set(key, u);
      return u;
    });
  frameWaiters.set(key, p);
  return p;
}
function useFrameUrl(key) {
  const [url, setUrl] = useState(() => (key && frameUrlCache.has(key) ? frameUrlCache.get(key) : null));
  useEffect(() => {
    let alive = true;
    if (!key || !AVATAR_FRAMES[key]) { setUrl(null); return undefined; }
    if (frameUrlCache.has(key)) { setUrl(frameUrlCache.get(key)); return undefined; }
    setUrl(null);
    resolveFrameUrl(key).then((u) => { if (alive) setUrl(u); });
    return () => { alive = false; };
  }, [key]);
  return url;
}

function FramedAvatar({ children }) {
  return children;
}

function ReportThanksSheet({ profile, isBlocked, onBlock, onClose }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 430, background: 'rgba(5,8,16,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '26px 26px 0 0', padding: '10px 22px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 16px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div className="zchat-pop" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto', background: `${theme.teal}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCheck size={34} color={theme.teal} />
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, marginTop: 14 }}>Thanks for letting us know</div>
        <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, marginTop: 8 }}>
          Your report helps keep ZChat safe. We'll review it, and{profile ? ` ${profile.name}` : ' they'} won't know who reported them.
        </div>
        {profile && !isBlocked && onBlock && (
          <button onClick={() => { onClose(); onBlock(profile); }} style={{ width: '100%', marginTop: 18, padding: 13, borderRadius: 15, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.danger, fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: FONT }}>
            Block {profile.name}
          </button>
        )}
        <button onClick={onClose} style={{ width: '100%', marginTop: 8, padding: 13, borderRadius: 15, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 14.5, cursor: 'pointer', fontFamily: FONT }}>Done</button>
      </div>
    </div>
  );
}

function CameraCapture({ onClose, onCapture, onPickGallery }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const holdTimerRef = useRef(null);
  const startedAtRef = useRef(0);
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState(false);
  const MAX_MS = 60000;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; v.play().catch(() => {}); }
        setReady(true);
        setError('');
      } catch {
        setError('Allow camera access to take photos and videos.');
      }
    })();
    return () => { cancelled = true; };
  }, [facing]);

  useEffect(() => () => {
    clearTimeout(holdTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    if (!recordingVideo) return undefined;
    const t = setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsed(ms);
      if (ms >= MAX_MS) stopVideo();
    }, 100);
    return () => clearInterval(t);
  }, [recordingVideo]);

  const takePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    if (facing === 'user') { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, c.width, c.height);
    playUiSound('shutter');
    setFlash(true);
    setTimeout(() => setFlash(false), 160);
    c.toBlob((blob) => { if (blob) onCapture(new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })); }, 'image/jpeg', 0.92);
  };

  const startVideo = () => {
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === 'undefined') return;
    const types = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    let rec;
    try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch { return; }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const type = rec.mimeType || mime || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      if (blob.size > 2000) onCapture(new File([blob], `video-${Date.now()}.${type.includes('mp4') ? 'mp4' : 'webm'}`, { type }));
    };
    recorderRef.current = rec;
    rec.start(250);
    startedAtRef.current = Date.now();
    setElapsed(0);
    setRecordingVideo(true);
    playUiSound('record-start');
  };

  function stopVideo() {
    const rec = recorderRef.current;
    recorderRef.current = null;
    setRecordingVideo(false);
    if (rec && rec.state !== 'inactive') { playUiSound('record-stop'); rec.stop(); }
  }

  const onShutterDown = (e) => {
    e.preventDefault();
    if (!ready) return;
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => { holdTimerRef.current = null; startVideo(); }, 350);
  };
  const onShutterUp = (e) => {
    e.preventDefault();
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; takePhoto(); return; }
    if (recorderRef.current) stopVideo();
  };

  const ring = recordingVideo ? Math.min(1, elapsed / MAX_MS) : 0;
  const secs = Math.floor(elapsed / 1000);

  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 520, background: '#000', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />
      {flash && <div style={{ position: 'absolute', inset: 0, background: 'white', opacity: 0.85 }} />}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(14px + env(safe-area-inset-top)) 16px 0' }}>
        <div role="button" aria-label="Close" onClick={onClose} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={22} /></div>
        {recordingVideo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 16, background: 'rgba(0,0,0,0.45)', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30' }} />{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}
          </div>
        )}
        <div style={{ width: 42 }} />
      </div>
      {error && <div style={{ position: 'relative', margin: 'auto', textAlign: 'center', padding: 24, fontSize: 15, fontWeight: 600 }}>{error}</div>}
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative', textAlign: 'center', fontSize: 12.5, fontWeight: 600, opacity: 0.85, marginBottom: 14 }}>{recordingVideo ? 'Release to stop' : 'Tap for photo, hold for video'}</div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))' }}>
        <div role="button" aria-label="Gallery" onClick={onPickGallery} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', visibility: recordingVideo ? 'hidden' : 'visible' }}><ImageIcon size={22} /></div>
        <div role="button" aria-label="Shutter" onPointerDown={onShutterDown} onPointerUp={onShutterUp} onPointerCancel={onShutterUp} onContextMenu={(e) => e.preventDefault()}
          style={{ position: 'relative', width: 84, height: 84, cursor: 'pointer', touchAction: 'none', userSelect: 'none' }}>
          <svg width="84" height="84" viewBox="0 0 84 84" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
            <circle cx="42" cy="42" r="38" fill="none" stroke="white" strokeWidth="5" opacity={recordingVideo ? 0.35 : 1} />
            {recordingVideo && <circle cx="42" cy="42" r="38" fill="none" stroke="#FF3B30" strokeWidth="5" strokeDasharray={`${2 * Math.PI * 38 * ring} ${2 * Math.PI * 38}`} strokeLinecap="round" />}
          </svg>
          <div style={{ position: 'absolute', inset: recordingVideo ? 22 : 11, borderRadius: recordingVideo ? 10 : '50%', background: recordingVideo ? '#FF3B30' : 'white', transition: 'all 0.2s ease' }} />
        </div>
        <div role="button" aria-label="Flip camera" onClick={() => !recordingVideo && setFacing((f) => (f === 'user' ? 'environment' : 'user'))} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', visibility: recordingVideo ? 'hidden' : 'visible' }}><SwitchCamera size={22} /></div>
      </div>
    </div>
  );
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)', hosts: ['instagram.com', 'instagr.am'] },
  { key: 'tiktok', label: 'TikTok', bg: '#000000', hosts: ['tiktok.com'] },
  { key: 'facebook', label: 'Facebook', bg: '#1877F2', hosts: ['facebook.com', 'fb.com', 'fb.me', 'fb.watch'] },
  { key: 'x', label: 'X', bg: '#000000', hosts: ['x.com', 'twitter.com'] },
  { key: 'youtube', label: 'YouTube', bg: '#FF0000', hosts: ['youtube.com', 'youtu.be'] },
  { key: 'threads', label: 'Threads', bg: '#000000', hosts: ['threads.net', 'threads.com'] },
  { key: 'snapchat', label: 'Snapchat', bg: '#FFFC00', hosts: ['snapchat.com'] },
  { key: 'whatsapp', label: 'WhatsApp', bg: '#25D366', hosts: ['wa.me', 'whatsapp.com', 'chat.whatsapp.com'] },
  { key: 'telegram', label: 'Telegram', bg: '#229ED9', hosts: ['t.me', 'telegram.me', 'telegram.org'] },
  { key: 'discord', label: 'Discord', bg: '#5865F2', hosts: ['discord.gg', 'discord.com', 'discordapp.com'] },
  { key: 'twitch', label: 'Twitch', bg: '#9146FF', hosts: ['twitch.tv'] },
  { key: 'kick', label: 'Kick', bg: '#0B0E0F', hosts: ['kick.com'] },
  { key: 'reddit', label: 'Reddit', bg: '#FF4500', hosts: ['reddit.com', 'redd.it'] },
  { key: 'pinterest', label: 'Pinterest', bg: '#E60023', hosts: ['pinterest.com', 'pin.it'] },
  { key: 'linkedin', label: 'LinkedIn', bg: '#0A66C2', hosts: ['linkedin.com', 'lnkd.in'] },
  { key: 'github', label: 'GitHub', bg: '#181717', hosts: ['github.com'] },
  { key: 'spotify', label: 'Spotify', bg: '#1DB954', hosts: ['spotify.com', 'spotify.link'] },
  { key: 'soundcloud', label: 'SoundCloud', bg: '#FF5500', hosts: ['soundcloud.com', 'on.soundcloud.com'] },
  { key: 'steam', label: 'Steam', bg: '#171A21', hosts: ['steamcommunity.com', 'steampowered.com', 's.team'] },
  { key: 'linktree', label: 'Linktree', bg: '#43E55E', hosts: ['linktr.ee'] },
  { key: 'website', label: 'Website', bg: 'linear-gradient(135deg, #6366F1, #06B6D4)', hosts: [] },
];
const SOCIAL_MAX = 5;

function normalizeSocialUrl(input) {
  let v = String(input || '').trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, '')}`;
  try {
    const u = new URL(v);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    return u.toString().replace(/\/$/, '');
  } catch { return null; }
}

function detectSocialPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\.|^m\./, '');
    const hit = SOCIAL_PLATFORMS.find((p) => p.hosts.some((h) => host === h || host.endsWith(`.${h}`)));
    return hit ? hit.key : 'website';
  } catch { return 'website'; }
}

function socialLinkLabel(url, platform) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const first = (parts[0] || '').replace(/^@/, '');
    if (platform === 'website') return u.hostname.replace(/^www\./, '');
    if (platform === 'youtube' && parts[0] && parts[0].startsWith('@')) return parts[0];
    if (first && !['channel', 'c', 'user', 'invite', 'add', 'profile.php', 'in', 'u', 'user'].includes(first)) return `@${first}`.slice(0, 24);
    if (parts[1]) return parts[1].slice(0, 24);
    return SOCIAL_PLATFORMS.find((p) => p.key === platform)?.label || u.hostname;
  } catch { return url; }
}

function readSocialLinks(raw) {
  const legacyUrl = { instagram: (h) => `https://instagram.com/${h}`, tiktok: (h) => `https://www.tiktok.com/@${h}`, facebook: (h) => `https://facebook.com/${h}`, x: (h) => `https://x.com/${h}`, youtube: (h) => `https://youtube.com/@${h}`, snapchat: (h) => `https://snapchat.com/add/${h}`, telegram: (h) => `https://t.me/${h}`, discord: (h) => `https://discord.gg/${h}` };
  return (Array.isArray(raw) ? raw : []).map((l) => {
    if (!l) return null;
    const url = l.url ? normalizeSocialUrl(l.url) : (l.platform && l.handle && legacyUrl[l.platform] ? legacyUrl[l.platform](l.handle) : null);
    if (!url) return null;
    return { url, title: (l.title || '').slice(0, 30), platform: detectSocialPlatform(url) };
  }).filter(Boolean).slice(0, SOCIAL_MAX);
}

function cleanWhatsappNumber(v) {
  const digits = String(v || '').replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? `+${digits.slice(1).replace(/\+/g, '')}` : digits.replace(/\+/g, '');
  return normalized.slice(0, 18);
}

function SocialGlyph({ platform, size = 20 }) {
  const s = size;
  const W = 'white';
  const txt = (t, fs = 13, fill = W, weight = 900, y = 16.5) => <text x="12" y={y} textAnchor="middle" fontSize={fs} fontWeight={weight} fill={fill} fontFamily="Arial, Helvetica, sans-serif">{t}</text>;
  switch (platform) {
    case 'instagram':
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5.5" stroke={W} strokeWidth="2" /><circle cx="12" cy="12" r="4.2" stroke={W} strokeWidth="2" /><circle cx="17.3" cy="6.7" r="1.3" fill={W} /></svg>);
    case 'tiktok': {
      const d = 'M16.6 3c.4 2.4 1.9 3.9 4.1 4.1v3.1c-1.5 0-2.9-.4-4.1-1.2v6.3c0 3.5-2.6 5.7-5.7 5.7-3.2 0-5.6-2.5-5.6-5.5 0-3.3 2.8-5.8 6.3-5.4v3.2c-1.6-.3-3.1.7-3.1 2.2 0 1.3 1 2.3 2.3 2.3 1.4 0 2.4-1 2.4-2.6V3h3.4z';
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d={d} fill="#25F4EE" transform="translate(-0.7 -0.5)" /><path d={d} fill="#FE2C55" transform="translate(0.7 0.5)" /><path d={d} fill={W} /></svg>);
    }
    case 'facebook':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3.1z" fill={W} /></svg>);
    case 'x':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" fill={W} /></svg>);
    case 'youtube':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill={W} /><path d="M10 9.2v5.6l4.8-2.8z" fill="#FF0000" /></svg>);
    case 'threads':
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M16.8 11.2c-.2-2.6-1.9-4-4.5-4-2.3 0-3.8 1.3-4.1 2.8M12.5 21c-4.9 0-8-3.3-8-9s3.1-9 8-9c4.3 0 7 2.4 7.8 6M16.8 11.2c.2 2.1-1 4.3-3.9 4.4-1.9.1-3.1-.9-3.1-2.3 0-1.5 1.4-2.4 3.4-2.4 3.9 0 6.5 1.6 6.5 4.4 0 3.1-3 5.7-6.7 5.7" stroke={W} strokeWidth="2" strokeLinecap="round" /></svg>);
    case 'snapchat':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 3.2c2.9 0 4.9 2.2 4.9 5v1.9l1.3-.4c.6-.2 1.2.5.7 1-.5.5-1.4.8-2 1 .4 1.4 1.7 2.8 3.3 3.3.5.2.4.8-.1.9-.8.2-1.6.3-1.9.7-.2.3 0 .9-.4 1.1-.6.2-1.6-.2-2.6.1-1 .3-1.8 1.7-3.2 1.7s-2.2-1.4-3.2-1.7c-1-.3-2 .1-2.6-.1-.4-.2-.2-.8-.4-1.1-.3-.4-1.1-.5-1.9-.7-.5-.1-.6-.7-.1-.9 1.6-.5 2.9-1.9 3.3-3.3-.6-.2-1.5-.5-2-1-.5-.5.1-1.2.7-1l1.3.4V8.2c0-2.8 2-5 4.9-5z" fill={W} stroke="#111" strokeWidth="1.1" strokeLinejoin="round" /></svg>);
    case 'whatsapp':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2.8a9.1 9.1 0 0 0-7.8 13.8L3 21l4.5-1.2A9.1 9.1 0 1 0 12 2.8z" fill="none" stroke={W} strokeWidth="1.9" strokeLinejoin="round" /><path d="M9.1 7.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 3 4.6 4 2.3.9 2.7.7 3.2.7.5 0 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3l-1.8-.9c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.6-1.6z" fill={W} /></svg>);
    case 'telegram':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M20.7 4.3L3.5 11c-1.2.5-1.2 1.2-.2 1.5l4.4 1.4 1.7 5.2c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.1-2.1 4.4 3.3c.8.4 1.4.2 1.6-.8l2.9-13.6c.3-1.2-.5-1.8-1.4-1.9zM8.6 13.5l8.9-5.6c.4-.3.8-.1.5.2l-7.3 6.6-.3 3-1.8-4.2z" fill={W} /></svg>);
    case 'discord':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M19.3 5.4A16 16 0 0 0 15.4 4l-.5 1a14.8 14.8 0 0 0-5.8 0l-.5-1c-1.4.2-2.7.7-3.9 1.4C2.3 9.1 1.7 12.7 2 16.3a16 16 0 0 0 4.8 2.4l1-1.6c-.6-.2-1.1-.5-1.6-.8l.4-.3a11.4 11.4 0 0 0 10.8 0l.4.3c-.5.3-1 .6-1.6.8l1 1.6a16 16 0 0 0 4.8-2.4c.4-4.2-.7-7.8-2.7-10.9zM8.7 14.1c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2zm6.6 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.8 2-1.7 2z" fill={W} /></svg>);
    case 'twitch':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M5 3L3.5 6.5V19h4.2v2.5h2.4l2.5-2.5h3.4L21 14.1V3H5zm14 10.2l-2.7 2.7h-4.2l-2.3 2.3v-2.3H6.3V5H19v8.2z" fill={W} /><rect x="11" y="7.6" width="1.9" height="5" fill={W} /><rect x="15.2" y="7.6" width="1.9" height="5" fill={W} /></svg>);
    case 'kick':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M4 3h5.2v4.2h2.1V5.1h2.1V3h6.6v6.3h-2.1v2.1h-2.1v1.2h2.1v2.1h2.1V21h-6.6v-2.1h-2.1v-2.1H9.2V21H4V3z" fill="#53FC18" /></svg>);
    case 'reddit':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><ellipse cx="12" cy="14" rx="8" ry="5.6" fill={W} /><circle cx="18.6" cy="9.6" r="1.8" fill={W} /><circle cx="5.4" cy="9.6" r="1.8" fill={W} /><circle cx="17.4" cy="4.4" r="1.5" fill={W} /><path d="M12 8.4l1.2-4.6 4.1 1" stroke={W} strokeWidth="1.3" fill="none" strokeLinecap="round" /><circle cx="9" cy="13.4" r="1.3" fill="#FF4500" /><circle cx="15" cy="13.4" r="1.3" fill="#FF4500" /><path d="M9.2 16.4c1.7 1.2 3.9 1.2 5.6 0" stroke="#FF4500" strokeWidth="1.2" fill="none" strokeLinecap="round" /></svg>);
    case 'pinterest':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M12.3 2.5C7 2.5 4.3 6.3 4.3 9.5c0 1.9.7 3.6 2.3 4.2.3.1.5 0 .6-.3l.2-.9c.1-.3 0-.4-.2-.7-.5-.6-.8-1.3-.8-2.4 0-3.1 2.3-5.8 6-5.8 3.3 0 5.1 2 5.1 4.7 0 3.5-1.6 6.5-3.9 6.5-1.3 0-2.2-1-1.9-2.3.4-1.5 1.1-3.2 1.1-4.3 0-1-.5-1.8-1.6-1.8-1.3 0-2.3 1.3-2.3 3.1 0 1.1.4 1.9.4 1.9l-1.5 6.4c-.4 1.9-.1 4.2 0 4.4 0 .1.2.2.3.1.1-.2 1.5-1.9 2-3.6l.8-3c.4.7 1.5 1.4 2.7 1.4 3.5 0 5.9-3.2 5.9-7.5 0-3.2-2.7-6.3-6.9-6.3z" fill={W} /></svg>);
    case 'linkedin':
      return (<svg width={s} height={s} viewBox="0 0 24 24">{txt('in', 14, W, 900, 17)}</svg>);
    case 'github':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1.1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.2 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.5 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z" fill={W} /></svg>);
    case 'spotify':
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9.2c4-1.3 8.6-.9 12.2 1.1M6.8 12.6c3.3-1 7-.6 9.9 1M7.6 15.8c2.6-.7 5.3-.4 7.6.9" stroke={W} strokeWidth="2" strokeLinecap="round" /></svg>);
    case 'soundcloud':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M11 8.5c.8-.6 1.9-1 3-1 2.6 0 4.7 2 4.9 4.5a2.8 2.8 0 0 1 0 5.6H11V8.5z" fill={W} />{[2.2, 4, 5.8, 7.6, 9.4].map((x, i) => <rect key={x} x={x} y={12 - i * 0.9} width="1.1" height={4.6 + i * 0.9} rx="0.5" fill={W} />)}</svg>);
    case 'steam':
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="15.5" cy="8.8" r="3.6" stroke={W} strokeWidth="1.8" /><circle cx="15.5" cy="8.8" r="1.4" fill={W} /><circle cx="8" cy="16" r="2.6" stroke={W} strokeWidth="1.8" /><path d="M2.5 13.2l3.4 1.4M10.2 14.6l2.7-3.3" stroke={W} strokeWidth="1.8" strokeLinecap="round" /></svg>);
    case 'linktree':
      return (<svg width={s} height={s} viewBox="0 0 24 24"><path d="M10.6 3h2.8v5.2l3.6-3.7 1.9 2-3.8 3.6h5.4v2.8h-5.4l3.8 3.7-1.9 1.9-5.2-5.2-5.2 5.2-1.9-1.9 3.8-3.7H3.1V10h5.4L4.7 6.5l1.9-2 3.9 3.7V3zm0 12.5h2.8V21h-2.8v-5.5z" fill="#000" /></svg>);
    default:
      return (<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={W} strokeWidth="1.8" /><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" stroke={W} strokeWidth="1.8" /></svg>);
  }
}

function SocialIcon({ platform, size = 40, round = false }) {
  const meta = SOCIAL_PLATFORMS.find((p) => p.key === platform) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
  return (
    <div style={{ width: size, height: size, borderRadius: round ? '50%' : size * 0.3, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', lineHeight: 0 }}>
      <SocialGlyph platform={meta.key} size={Math.round(size * 0.56)} />
    </div>
  );
}

function ProfileCollectionShowcase({ profile, rewards, isSelf, onPreview, onOpenCollection }) {
  const { theme } = useTheme();
  const frames = (rewards || [])
    .filter((r) => r.kind === 'frame' && AVATAR_FRAMES[r.reward_key] && rewardActive(r))
    .sort((a, b) => (STORE_RARITY_ORDER[AVATAR_FRAMES[a.reward_key].rarity] ?? 9) - (STORE_RARITY_ORDER[AVATAR_FRAMES[b.reward_key].rarity] ?? 9));
  const charms = (rewards || []).filter((r) => r.kind === 'charm' && CUSTOM_BADGES[r.reward_key] && rewardActive(r));
  const total = frames.length + charms.length;
  if (!total) return null;
  const best = frames.length ? (RARITY_STYLE[AVATAR_FRAMES[frames[0].reward_key].rarity] || RARITY_STYLE.rare) : RARITY_STYLE.rare;
  return (
    <div style={{ marginTop: 18, borderRadius: 22, overflow: 'hidden', background: theme.dark ? 'linear-gradient(160deg, #15121f 0%, #0c0d13 100%)' : 'linear-gradient(160deg, #f6f4ff 0%, #ffffff 100%)', border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : theme.border}`, textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px 10px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 10, background: `linear-gradient(135deg, ${best.color}, #f97316)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={16} color="#1a0f02" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 900, color: theme.ink }}>Collection</div>
          <div style={{ fontSize: 11.5, color: theme.muted, fontWeight: 600 }}>{total} unlocked{frames.length ? ` · ${frames.length} ${frames.length === 1 ? 'frame' : 'frames'}` : ''}</div>
        </div>
        {isSelf && onOpenCollection && (
          <div role="button" onClick={onOpenCollection} style={{ fontSize: 12.5, fontWeight: 800, color: '#fbbf24', cursor: 'pointer', padding: '6px 10px', borderRadius: 10, background: 'rgba(245,158,11,0.12)' }}>Manage</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 14px 14px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {frames.map((r) => {
          const spec = AVATAR_FRAMES[r.reward_key];
          const rr = RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare;
          return (
            <div key={r.reward_key} role="button" onClick={() => onPreview(r.reward_key)} style={{ flexShrink: 0, width: 104, borderRadius: 16, padding: '8px 6px 10px', cursor: 'pointer', background: rr.bg, border: `1px solid ${rr.color}55`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: rr.color }} />
              <div style={{ height: 74, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar emoji={profile.avatar} name={profile.name} size={68} frame={r.reward_key} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'white', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label.replace(/ frame$/i, '')}</div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: rr.color, marginTop: 2 }}>{rr.label}</div>
            </div>
          );
        })}
        {charms.map((r) => {
          const spec = CUSTOM_BADGES[r.reward_key];
          const rr = RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare;
          return (
            <div key={`c-${r.reward_key}`} style={{ flexShrink: 0, width: 104, borderRadius: 16, padding: '8px 6px 10px', background: rr.bg, border: `1px solid ${rr.color}55`, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: rr.color }} />
              <div style={{ height: 74, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CharmPreview charm={r.reward_key} size={54} /></div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'white', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label.replace(/ charm$/i, '')}</div>
              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: rr.color, marginTop: 2 }}>Charm</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProfileSocialRow({ links, whatsapp }) {
  const { theme } = useTheme();
  const list = readSocialLinks(links);
  const phone = cleanWhatsappNumber(whatsapp);
  const items = [
    ...list.map((l) => ({ key: l.url, platform: l.platform, label: l.title || (l.platform === 'website' ? socialLinkLabel(l.url, l.platform) : (SOCIAL_PLATFORMS.find((p) => p.key === l.platform) || {}).label), href: l.url })),
    ...(phone ? [{ key: 'wa-number', platform: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/${phone.replace(/^\+/, '')}` }] : []),
  ];
  if (!items.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 2px 2px', margin: '14px auto 0', width: 'fit-content', maxWidth: '100%', scrollbarWidth: 'none' }}>
      {items.map((it) => (
        <div key={it.key} role="button" aria-label={it.label} onClick={() => window.open(it.href, '_blank', 'noopener')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 74, cursor: 'pointer' }}>
          <div style={{ width: 58, height: 58, borderRadius: '50%', padding: 3, boxSizing: 'border-box', background: `linear-gradient(135deg, ${theme.border}, ${theme.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'})`, transition: 'transform 0.15s ease' }}
            onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }} onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }} onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', boxSizing: 'border-box', background: theme.dark ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SocialIcon platform={it.platform} size={46} round />
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.ink, maxWidth: 74, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function SocialLinksEditor({ links, onChange, whatsapp, onWhatsappChange, labelStyle }) {
  const { theme } = useTheme();
  const [adding, setAdding] = useState(false);
  const [draftUrl, setDraftUrl] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [err, setErr] = useState('');
  const list = readSocialLinks(links);
  const preview = normalizeSocialUrl(draftUrl);
  const previewPlatform = preview ? detectSocialPlatform(preview) : null;
  const add = () => {
    const url = normalizeSocialUrl(draftUrl);
    if (!url) { setErr('Enter a valid link'); return; }
    if (list.some((l) => l.url === url)) { setErr('You already added this link'); return; }
    onChange([...list.map((l) => ({ url: l.url, title: l.title })), { url, title: draftTitle.trim().slice(0, 30) }]);
    setDraftUrl(''); setDraftTitle(''); setErr(''); setAdding(false);
  };
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}><span>LINKS</span><span style={{ fontWeight: 600 }}>{list.length}/{SOCIAL_MAX}</span></div>
      <div style={{ borderRadius: 16, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        {list.map((l, i) => (
          <div key={l.url} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
            <SocialIcon platform={l.platform} size={36} round />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title || socialLinkLabel(l.url, l.platform)}</div>
              <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.url.replace(/^https?:\/\//, '')}</div>
            </div>
            <div role="button" aria-label="Remove link" onClick={() => onChange(list.filter((_, idx) => idx !== i).map((x) => ({ url: x.url, title: x.title })))} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.danger }}><Trash2 size={16} /></div>
          </div>
        ))}
        {!adding && list.length < SOCIAL_MAX && (
          <div role="button" onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, fontSize: 20 }}>+</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>Add link</span>
          </div>
        )}
        {adding && (
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SocialIcon platform={previewPlatform || 'website'} size={36} round />
              <input autoFocus value={draftUrl} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="Paste your link, like instagram.com/you"
                onChange={(e) => { setDraftUrl(e.target.value); setErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
                style={{ ...inputStyle(theme), flex: 1 }} />
            </div>
            <input value={draftTitle} maxLength={30} placeholder="Title (optional)" onChange={(e) => setDraftTitle(e.target.value)} style={{ ...inputStyle(theme), marginTop: 8 }} />
            {previewPlatform && <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 6 }}>Detected: <b style={{ color: theme.ink }}>{SOCIAL_PLATFORMS.find((p) => p.key === previewPlatform).label}</b></div>}
            {err && <div style={{ fontSize: 12, color: theme.danger, marginTop: 6, fontWeight: 600 }}>{err}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => { setAdding(false); setDraftUrl(''); setDraftTitle(''); setErr(''); }} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.ink, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Cancel</button>
              <button onClick={add} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>Add</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ ...labelStyle, marginTop: 14 }}>WHATSAPP NUMBER</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SocialIcon platform="whatsapp" size={38} round />
        <input value={whatsapp} inputMode="tel" placeholder="Country code and number" onChange={(e) => onWhatsappChange(cleanWhatsappNumber(e.target.value))} style={{ ...inputStyle(theme), flex: 1 }} />
      </div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 5 }}>Include your country code. Everyone who can see your profile can see this number.</div>
    </div>
  );
}

const PRONOUN_OPTIONS = ['he/him', 'she/her', 'they/them', 'he/they', 'she/they', 'any pronouns'];

function PronounsPicker({ value, onChange, labelStyle }) {
  const { theme } = useTheme();
  const selected = String(value || '').split(',').map((x) => x.trim()).filter(Boolean);
  const [full, setFull] = useState(false);
  const toggle = (p) => {
    if (selected.includes(p)) { onChange(selected.filter((x) => x !== p).join(', ')); setFull(false); return; }
    if (p === 'any pronouns') { onChange(p); setFull(false); return; }
    const base = selected.filter((x) => x !== 'any pronouns');
    if (base.length >= 2) { setFull(true); setTimeout(() => setFull(false), 1400); return; }
    onChange([...base, p].join(', '));
    setFull(false);
  };
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}><span>PRONOUNS</span><span style={{ fontWeight: 600, color: full ? theme.danger : undefined }}>{full ? 'remove one first' : 'up to 2'}</span></div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {PRONOUN_OPTIONS.map((p) => {
          const on = selected.includes(p);
          return (
            <div key={p} role="button" onClick={() => toggle(p)} style={{ padding: '7px 13px', borderRadius: 16, fontSize: 12.5, cursor: 'pointer', fontWeight: 600, background: on ? theme.coral : theme.rowBg, color: on ? 'white' : theme.muted, border: `1px solid ${on ? theme.coral : theme.border}` }}>{p}</div>
          );
        })}
      </div>
    </div>
  );
}

const linkPreviewCache = new Map();
const URL_IN_TEXT = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+\.[a-z]{2,}[^\s<>"']*/i;

function firstPreviewableUrl(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(URL_IN_TEXT);
  if (!m) return null;
  const raw = m[0].replace(/[),.!?]+$/, '');
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(url);
    if (/(^|\.)getzchat\.com$/i.test(u.hostname) && (u.searchParams.get('post') || u.searchParams.get('profile') || u.searchParams.get('story'))) return null;
    return u.toString();
  } catch { return null; }
}

function LinkPreviewCard({ url }) {
  const { theme } = useTheme();
  const [data, setData] = useState(() => linkPreviewCache.get(url) || null);
  useEffect(() => {
    if (linkPreviewCache.has(url)) { setData(linkPreviewCache.get(url)); return undefined; }
    let cancelled = false;
    try {
      const stored = sessionStorage.getItem(`zchat-lp-${url}`);
      if (stored) { const v = JSON.parse(stored); linkPreviewCache.set(url, v); setData(v); return undefined; }
    } catch {}
    (async () => {
      try {
        const { data: res, error } = await supabase.functions.invoke('link-preview', { body: { url } });
        const value = !error && res && (res.title || res.image) ? res : { empty: true };
        linkPreviewCache.set(url, value);
        try { sessionStorage.setItem(`zchat-lp-${url}`, JSON.stringify(value)); } catch {}
        if (!cancelled) setData(value);
      } catch {
        linkPreviewCache.set(url, { empty: true });
      }
    })();
    return () => { cancelled = true; };
  }, [url]);
  if (!data || data.empty) return null;
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
  const platform = detectSocialPlatform(url);
  return (
    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); window.open(url, '_blank', 'noopener'); }}
      style={{ marginTop: 6, width: 250, maxWidth: '100%', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', background: theme.dark ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.05)', border: `1px solid ${theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
      {data.image && (
        <div style={{ width: '100%', aspectRatio: '1.91 / 1', background: '#111' }}>
          <img src={data.image} alt="" loading="lazy" draggable={false} onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <div style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        {platform !== 'website' && <SocialIcon platform={platform} size={22} round />}
        <div style={{ minWidth: 0, flex: 1 }}>
          {data.title && <div style={{ fontSize: 13, fontWeight: 700, color: theme.ink, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{data.title}</div>}
          {data.description && <div style={{ fontSize: 11.5, color: theme.muted, lineHeight: 1.35, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{data.description}</div>}
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 3 }}>{data.siteName || host}</div>
        </div>
      </div>
    </div>
  );
}

function useNewVersionAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const currentScript = () => {
      const el = document.querySelector('script[type="module"][src*="/assets/"]');
      return el ? el.getAttribute('src') : null;
    };
    const mine = currentScript();
    if (!mine) return undefined;
    let stopped = false;
    const check = async () => {
      if (stopped || document.visibilityState === 'hidden') return;
      try {
        const res = await fetch(`/?v=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const html = await res.text();
        const m = html.match(/<script[^>]+type="module"[^>]+src="([^"]*\/assets\/[^"]+)"/i) || html.match(/src="([^"]*\/assets\/index[^"]+\.js)"/i);
        if (m && m[1] && m[1] !== mine) setAvailable(true);
      } catch {}
    };
    const timer = setInterval(check, 3 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    const first = setTimeout(check, 20000);
    return () => { stopped = true; clearInterval(timer); clearTimeout(first); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  return available;
}

function UpdateAvailableBanner({ onUpdate, onLater }) {
  const { theme } = useTheme();
  return (
    <div className="zchat-sheet-up" style={{ position: 'fixed', left: 12, right: 12, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 640, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 14px', borderRadius: 18, background: theme.panelBg, border: `1px solid ${theme.border}`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${theme.coral}, #8b5cf6)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Sparkles size={20} color="white" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: theme.ink }}>New update ready</div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>Tap update to get the latest ZChat</div>
      </div>
      <button onClick={onLater} style={{ padding: '9px 10px', borderRadius: 12, border: 'none', background: 'transparent', color: theme.muted, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Later</button>
      <button onClick={onUpdate} style={{ padding: '9px 14px', borderRadius: 12, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>Update</button>
    </div>
  );
}

function RewardCelebration({ kind, rewardKey, me, onClaim }) {
  const [claiming, setClaiming] = useState(false);
  const isFrame = kind === 'frame';
  const spec = isFrame ? AVATAR_FRAMES[rewardKey] : CUSTOM_BADGES[rewardKey];
  if (!spec) return null;
  const glow = (isFrame ? (spec.glow || (RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare).color) : '#f472b6') || '#8b5cf6';
  const shownFrame = isFrame ? rewardKey : (AVATAR_FRAMES[me.avatar_frame] ? me.avatar_frame : null);
  const frameRoom = shownFrame ? Math.round(150 * ((AVATAR_FRAMES[shownFrame].scale || 1.5) - 1) / 2) + 14 : 22;
  const pieces = Array.from({ length: 30 }, (_, i) => i);
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 701, color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, overflow: 'hidden', fontFamily: FONT, textAlign: 'center', background: `radial-gradient(circle at 50% 44%, ${glow}38 0%, rgba(11,15,25,0) 55%), #05070D` }}>
      {pieces.map((i) => (
        <span key={i} style={{ position: 'absolute', top: -20, left: `${(i * 97) % 100}%`, width: 7, height: 13, borderRadius: 2, background: [glow, '#FFFFFF', '#7C5CFC', '#fbbf24'][i % 4], opacity: 0.85, animation: `zchat-confetti ${2.8 + (i % 5) * 0.4}s linear ${(i % 9) * 0.25}s infinite` }} />
      ))}
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', color: glow, textTransform: 'uppercase' }}>{isFrame ? 'New avatar frame' : 'New name charm'}</div>
      <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>Congratulations!</div>
      <div style={{ fontSize: 14.5, opacity: 0.75, marginTop: 6, maxWidth: 300, lineHeight: 1.5 }}>You unlocked the <b style={{ color: glow }}>{spec.label}</b>. It's saved in your Collection. Here's how it looks on you.</div>

      <div className="zchat-pop" style={{ position: 'relative', marginTop: frameRoom + 12, marginBottom: frameRoom, width: 150, height: 150 }}>
        <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, ${glow}55 0%, transparent 70%)`, animation: 'zchat-badge-pulse 2.2s ease-in-out infinite' }} />
        <Avatar emoji={me.avatar} name={me.name} size={150} frame={shownFrame} />
      </div>

      <div style={{ fontSize: 24, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        {me.name}<VerifiedBadge tier={me.verified} custom={isFrame ? me.custom_badge : rewardKey} size={20} />
      </div>
      <div style={{ fontSize: 14, opacity: 0.6, marginTop: 2 }}>@{me.username}</div>
      {!isFrame && (
        <div style={{ marginTop: 14, padding: '8px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', fontSize: 13, opacity: 0.85 }}>Shows next to your name everywhere on ZChat</div>
      )}

      <button disabled={claiming} onClick={async () => { setClaiming(true); await onClaim(); }} style={{ marginTop: 30, padding: '15px 56px', borderRadius: 18, border: 'none', background: `linear-gradient(135deg, ${glow}, #8b5cf6)`, color: 'white', fontWeight: 900, fontSize: 16, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 12px 34px ${glow}66`, opacity: claiming ? 0.7 : 1 }}>
        {claiming ? 'Claiming…' : 'Claim & equip'}
      </button>
    </div>
  );
}

const RARITY_STYLE = {
  mythic: { label: 'Mythic', color: '#ff4d6d', bg: 'linear-gradient(160deg, #3b0a17 0%, #16060b 100%)', glow: 'rgba(255,77,109,0.55)' },
  legendary: { label: 'Legendary', color: '#fbbf24', bg: 'linear-gradient(160deg, #3a2606 0%, #140d02 100%)', glow: 'rgba(251,191,36,0.5)' },
  epic: { label: 'Epic', color: '#c084fc', bg: 'linear-gradient(160deg, #2a0f45 0%, #0f0719 100%)', glow: 'rgba(192,132,252,0.45)' },
  rare: { label: 'Rare', color: '#60a5fa', bg: 'linear-gradient(160deg, #0b2447 0%, #060d1a 100%)', glow: 'rgba(96,165,250,0.45)' },
};

function FrameTryOnPage({ me, frameKey, charmKey, onClose, action }) {
  const isCharm = !!charmKey;
  const spec = isCharm ? CUSTOM_BADGES[charmKey] : AVATAR_FRAMES[frameKey];
  if (!spec) return null;
  const r = RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare;
  const name = me ? (me.name || me.username || 'You') : 'You';
  const username = me ? me.username : 'you';
  const photo = me && typeof me.avatar === 'string' && me.avatar.startsWith('http') ? me.avatar : null;
  const bg = photo ? null : colorForName(name);
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const mockCard = { borderRadius: 20, background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' };
  const label = { fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.5)', margin: '22px 4px 8px' };
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#07080d', color: 'white', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', paddingTop: 'calc(10px + env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,8,13,0.9)', zIndex: 2 }}>
        <div role="button" aria-label="Close preview" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</div>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: r.color }}>{r.label}{spec.animated ? ' · Animated' : ''} · Preview</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 14px 130px' }}>
        <div style={label}>YOUR PROFILE</div>
        <div style={{ ...mockCard, position: 'relative' }}>
          <div style={{ position: 'absolute', left: -40, right: -40, top: -40, height: 330, overflow: 'hidden', pointerEvents: 'none' }}>
            {photo
              ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(1.25)', opacity: 0.9, transform: 'scale(1.08)' }} />
              : <div style={{ position: 'absolute', inset: 0, background: bg, filter: 'blur(40px)', opacity: 0.75 }} />}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, #0f1117 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: '26px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar emoji={me ? me.avatar : ''} name={name} size={138} frame={isCharm ? (me && me.avatar_frame) : frameKey} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {name}{me && <VerifiedBadge tier={me.verified} custom={isCharm ? charmKey : me.custom_badge} size={19} />}
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>@{username}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, marginTop: 10, padding: '4px 11px', borderRadius: 14, color: '#22c55e', background: 'rgba(34,197,94,0.12)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />Online now
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, alignSelf: 'stretch', marginTop: 16 }}>
              {[['Posts', '24'], ['Followers', '1.2K'], ['Following', '312']].map(([k, v]) => (
                <div key={k} style={{ padding: '10px 0', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: 17, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={label}>IN THE CHAT LIST</div>
        <div style={mockCard}>
          {[
            { me: true, text: 'Love my new frame 😍', unread: 2, time },
            { me: false, name: 'Alex', text: 'See you tomorrow!', time: 'Yesterday', color: '#29C7B3' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {row.me
                  ? <Avatar emoji={me ? me.avatar : ''} name={name} size={46} frame={isCharm ? (me && me.avatar_frame) : frameKey} />
                  : <div style={{ width: 46, height: 46, borderRadius: '50%', background: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{row.name[0]}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.me ? name : row.name}</span>
                  {row.me && me && <VerifiedBadge tier={me.verified} custom={isCharm ? charmKey : me.custom_badge} size={13} />}
                </div>
                <div style={{ fontSize: 13, color: row.unread ? 'white' : 'rgba(255,255,255,0.55)', fontWeight: row.unread ? 700 : 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.text}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 11.5, color: row.unread ? '#60a5fa' : 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{row.time}</div>
                {row.unread && <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#3b82f6', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{row.unread}</div>}
              </div>
            </div>
          ))}
        </div>

        <div style={label}>IN A CHAT</div>
        <div style={mockCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <ChevronLeft size={20} color="rgba(255,255,255,0.7)" />
            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Avatar emoji={me ? me.avatar : ''} name={name} size={38} frame={isCharm ? (me && me.avatar_frame) : frameKey} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center' }}>{name}{me && <VerifiedBadge tier={me.verified} custom={isCharm ? charmKey : me.custom_badge} size={13} />}</div>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>Online</div>
            </div>
          </div>
          <div style={{ padding: '14px 12px 16px', display: 'flex', flexDirection: 'column', gap: 8, background: 'linear-gradient(180deg, #0d1016, #0b0d12)' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '78%', padding: '8px 12px', borderRadius: '16px 16px 16px 4px', background: '#1c1f27', fontSize: 14 }}>Your frame looks amazing 🔥</div>
            <div style={{ alignSelf: 'flex-end', maxWidth: '78%', padding: '8px 12px', borderRadius: '16px 16px 4px 16px', background: '#2563eb', fontSize: 14 }}>Thanks! Just got it ✨</div>
          </div>
        </div>
      </div>

      {action && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(7,8,13,0) 0%, rgba(7,8,13,0.96) 30%)' }}>
          <button onClick={action.onClick} disabled={action.disabled} style={{ width: '100%', padding: '15px 16px', borderRadius: 18, border: 'none', fontFamily: FONT, fontWeight: 900, fontSize: 16.5, cursor: action.disabled ? 'default' : 'pointer', color: action.disabled ? 'rgba(255,255,255,0.6)' : '#1a0f02', background: action.disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fde047, #f59e0b 45%, #ea580c)', boxShadow: action.disabled ? 'none' : '0 12px 30px rgba(245,158,11,0.35)' }}>{action.label}</button>
          {action.sub && <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 700 }}>{action.sub}</div>}
        </div>
      )}
    </div>
  );
}

const FRAME_STORE = {
  checkoutUrl: '',
  priceLabel: '$2',
  periodLabel: '2 months',
};

function rewardActive(r) {
  return !r.expires_at || new Date(r.expires_at).getTime() > Date.now();
}

function daysLeft(r) {
  if (!r || !r.expires_at) return null;
  return Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - Date.now()) / 86400000));
}

function openFrameCheckout(userId, email, frameKey) {
  if (!FRAME_STORE.checkoutUrl || !AVATAR_FRAMES[frameKey]) return false;
  const params = new URLSearchParams();
  params.set('checkout[custom][user_id]', userId);
  params.set('checkout[custom][frame]', frameKey);
  if (email) params.set('checkout[email]', email);
  const sep = FRAME_STORE.checkoutUrl.includes('?') ? '&' : '?';
  window.location.href = `${FRAME_STORE.checkoutUrl}${sep}${params.toString()}`;
  return true;
}

function CollectionPanel({ me, rewards, onClose, onEquip, userEmail }) {
  const [tab, setTab] = useState('frame');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tryOn, setTryOn] = useState(null);
  const rewardFor = (kind, key) => (rewards || []).find((r) => r.kind === kind && r.reward_key === key) || null;
  const activeRewards = (rewards || []).filter(rewardActive);
  const ownedFrames = new Set(activeRewards.filter((r) => r.kind === 'frame').map((r) => r.reward_key));
  const ownedCharms = new Set(activeRewards.filter((r) => r.kind === 'charm').map((r) => r.reward_key));

  const items = tab === 'frame'
    ? Object.entries(AVATAR_FRAMES).map(([key, spec]) => ({ key, spec, owned: ownedFrames.has(key), equipped: me.avatar_frame === key, reward: rewardFor('frame', key) }))
    : tab === 'charm'
      ? Object.entries(CUSTOM_BADGES).map(([key, spec]) => ({ key, spec, owned: ownedCharms.has(key), equipped: me.custom_badge === key, reward: rewardFor('charm', key) }))
      : Object.entries(VERIFIED_TIERS).map(([key, t]) => ({ key, spec: { label: `${t.label} badge`, rarity: key === 'red' ? 'mythic' : key === 'gold' ? 'legendary' : 'epic', color: t.color }, owned: me.verified === key, equipped: me.verified === key, reward: null, badge: true }));

  const sorted = [...items].sort((x, y) => Number(y.owned) - Number(x.owned));
  const totalOwned = ownedFrames.size + ownedCharms.size + (me.verified ? 1 : 0);
  const totalItems = Object.keys(AVATAR_FRAMES).length + Object.keys(CUSTOM_BADGES).length + Object.keys(VERIFIED_TIERS).length;
  const pct = totalItems ? Math.round((totalOwned / totalItems) * 100) : 0;
  const rarity = (spec) => RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare;
  const equippedNow = tab === 'frame' ? (me.avatar_frame && AVATAR_FRAMES[me.avatar_frame] ? { key: me.avatar_frame, spec: AVATAR_FRAMES[me.avatar_frame], kind: 'frame' } : null)
    : tab === 'charm' ? (me.custom_badge && CUSTOM_BADGES[me.custom_badge] ? { key: me.custom_badge, spec: CUSTOM_BADGES[me.custom_badge], kind: 'charm' } : null)
      : (me.verified && VERIFIED_TIERS[me.verified] ? { key: me.verified, spec: { label: `${VERIFIED_TIERS[me.verified].label} badge`, rarity: 'epic' }, kind: 'badge' } : null);

  const equip = async (kind, key) => {
    if (busy || kind === 'badge') return;
    setBusy(true);
    playUiSound('like');
    await onEquip(kind, key);
    setBusy(false);
  };

  const sel = selected ? items.find((it) => it.key === selected) : null;

  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 620, background: 'radial-gradient(circle at 50% 0%, #1b1533 0%, #07080d 55%)', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 8px', paddingTop: 'calc(12px + env(safe-area-inset-top))' }}>
        <div role="button" aria-label="Close collection" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 900 }}>Collection</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{totalOwned} of {totalItems} unlocked</div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24' }}>{pct}%</div>
      </div>
      <div style={{ margin: '0 16px 14px', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f97316)', transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[['frame', 'Frames'], ['charm', 'Charms'], ['badge', 'Badges']].map(([k, label]) => (
          <div key={k} role="button" onClick={() => { setTab(k); setSelected(null); playUiSound('tap'); }} style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 13, fontWeight: 900, fontSize: 13, cursor: 'pointer', background: tab === k ? 'linear-gradient(135deg, #fbbf24, #f97316)' : 'rgba(255,255,255,0.06)', color: tab === k ? '#1a0f02' : 'rgba(255,255,255,0.75)' }}>{label}</div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: `0 14px ${equippedNow ? 130 : 30}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {sorted.map((it) => {
            const r = rarity(it.spec);
            const left = daysLeft(it.reward);
            return (
              <div key={it.key} role="button" onClick={() => { setSelected(it.key); playUiSound('tap'); }} style={{ position: 'relative', borderRadius: 20, padding: '12px 10px 14px', cursor: 'pointer', textAlign: 'center', overflow: 'hidden', background: it.owned ? r.bg : 'linear-gradient(160deg, #151620 0%, #0a0b0f 100%)', border: `1.5px solid ${selected === it.key ? '#fbbf24' : it.owned ? `${r.color}66` : 'rgba(255,255,255,0.07)'}`, boxShadow: it.equipped ? `0 0 20px ${r.glow}` : 'none' }}>
                {it.equipped && <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 7px', borderRadius: 7, background: '#22c55e', color: '#052e1c', fontSize: 9.5, fontWeight: 900 }}>EQUIPPED</div>}
                {!it.owned && <div style={{ position: 'absolute', top: 8, right: 8 }}><Lock size={13} color="rgba(255,255,255,0.6)" /></div>}
                <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: it.owned ? 'none' : 'grayscale(1) brightness(0.5)' }}>
                  {tab === 'frame' ? <Avatar emoji={me.avatar} name={me.name} size={92} frame={it.key} />
                    : tab === 'charm' ? <CharmPreview charm={it.key} size={56} />
                      : <svg width="56" height="56" viewBox="0 0 24 24"><path fill={it.spec.color} d={BADGE_SHAPE_PATH} /><path d="M8.6 12.3l2.3 2.2 4.6-3.6" fill="none" stroke="white" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div style={{ fontWeight: 900, fontSize: 13.5, marginTop: 8, color: it.owned ? 'white' : 'rgba(255,255,255,0.55)' }}>{it.spec.label.replace(/ (frame|charm|badge)$/i, '')}</div>
                <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: it.owned ? r.color : 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                  {it.owned ? `${r.label}${left != null ? ` · ${left}d left` : ''}` : tab === 'frame' && FRAME_STORE.checkoutUrl ? `LOCKED · ${FRAME_STORE.priceLabel}` : 'LOCKED'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {equippedNow && !sel && (
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(14px + env(safe-area-inset-bottom))', padding: '12px 14px', borderRadius: 20, background: 'rgba(18,20,28,0.97)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {equippedNow.kind === 'frame' ? <Avatar emoji={me.avatar} name={me.name} size={62} frame={equippedNow.key} />
              : equippedNow.kind === 'charm' ? <CharmPreview charm={equippedNow.key} size={42} />
                : <svg width="40" height="40" viewBox="0 0 24 24"><path fill={(VERIFIED_TIERS[me.verified] || {}).color} d={BADGE_SHAPE_PATH} /><path d="M8.6 12.3l2.3 2.2 4.6-3.6" fill="none" stroke="white" strokeWidth="1.65" strokeLinecap="round" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.1em', color: rarity(equippedNow.spec).color, textTransform: 'uppercase' }}>{rarity(equippedNow.spec).label}</div>
            <div style={{ fontWeight: 900, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{equippedNow.spec.label.replace(/ (frame|charm|badge)$/i, '')}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>Wearing now</div>
          </div>
          {equippedNow.kind !== 'badge' && (
            <button disabled={busy} onClick={() => equip(equippedNow.kind, null)} style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 900, fontSize: 12.5, fontFamily: FONT, cursor: 'pointer' }}>Take off</button>
          )}
        </div>
      )}

      {sel && (
        <div className="zchat-sheet-up" style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, bottom: 0, padding: '16px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(20,18,32,0.98), #0a0a10)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px 24px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div role="button" onClick={() => tab !== 'badge' && setTryOn({ kind: tab, key: sel.key })} style={{ width: 92, height: 92, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: tab === 'badge' ? 'default' : 'pointer', filter: sel.owned ? 'none' : 'grayscale(0.2)' }}>
              {tab === 'frame' ? <Avatar emoji={me.avatar} name={me.name} size={88} frame={sel.key} />
                : tab === 'charm' ? <CharmPreview charm={sel.key} size={54} />
                  : <svg width="54" height="54" viewBox="0 0 24 24"><path fill={sel.spec.color} d={BADGE_SHAPE_PATH} /><path d="M8.6 12.3l2.3 2.2 4.6-3.6" fill="none" stroke="white" strokeWidth="1.65" strokeLinecap="round" /></svg>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: rarity(sel.spec).color }}>{rarity(sel.spec).label}{sel.spec.animated ? ' · Animated' : ''}</div>
              <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2 }}>{sel.spec.label}</div>
              {sel.owned && daysLeft(sel.reward) != null && <div style={{ fontSize: 12, fontWeight: 700, color: daysLeft(sel.reward) <= 5 ? '#fca5a5' : 'rgba(255,255,255,0.6)', marginTop: 3 }}>Expires in {daysLeft(sel.reward)} days</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {tab === 'badge' ? (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{sel.owned ? 'You have this badge' : 'Given by the ZChat team'}</div>
                ) : sel.owned ? (
                  <>
                    <button disabled={busy || sel.equipped} onClick={() => equip(tab, sel.key)} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', fontWeight: 900, fontFamily: FONT, fontSize: 13.5, cursor: sel.equipped ? 'default' : 'pointer', background: sel.equipped ? 'rgba(52,211,153,0.2)' : 'linear-gradient(135deg, #fbbf24, #ea580c)', color: sel.equipped ? '#34d399' : '#1a0f02' }}>{sel.equipped ? '✓ EQUIPPED' : busy ? 'EQUIPPING…' : 'EQUIP'}</button>
                    <button onClick={() => setTryOn({ kind: tab, key: sel.key })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'white', fontWeight: 800, fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Preview</button>
                  </>
                ) : (
                  <>
                    {tab === 'frame' && FRAME_STORE.checkoutUrl ? (
                      <button onClick={() => openFrameCheckout(me.id, userEmail, sel.key)} style={{ padding: '11px 20px', borderRadius: 12, border: 'none', fontWeight: 900, fontFamily: FONT, fontSize: 13.5, cursor: 'pointer', background: 'linear-gradient(135deg, #fbbf24, #ea580c)', color: '#1a0f02' }}>UNLOCK · {FRAME_STORE.priceLabel} for {FRAME_STORE.periodLabel}</button>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', fontSize: 12.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}><Lock size={13} /> Locked · Earn it from ZChat events and gifts</div>
                    )}
                    <button onClick={() => setTryOn({ kind: tab, key: sel.key })} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'transparent', color: 'white', fontWeight: 800, fontFamily: FONT, fontSize: 13, cursor: 'pointer' }}>Preview</button>
                  </>
                )}
              </div>
            </div>
            <div role="button" aria-label="Close details" onClick={() => setSelected(null)} style={{ alignSelf: 'flex-start', padding: 4, cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><X size={18} /></div>
          </div>
        </div>
      )}

      {tryOn && (() => {
        const isCharm = tryOn.kind === 'charm';
        const rw = rewardFor(tryOn.kind, tryOn.key);
        const has = rw && rewardActive(rw);
        const isEq = (isCharm ? me.custom_badge : me.avatar_frame) === tryOn.key;
        const action = has
          ? { label: isEq ? '✓ Equipped' : (isCharm ? 'Equip this charm' : 'Equip this frame'), disabled: isEq || busy, onClick: async () => { await equip(tryOn.kind, tryOn.key); setTryOn(null); }, sub: daysLeft(rw) != null ? `${daysLeft(rw)} days left` : 'Yours to keep' }
          : !isCharm && FRAME_STORE.checkoutUrl
            ? { label: `Unlock for ${FRAME_STORE.priceLabel} · ${FRAME_STORE.periodLabel}`, onClick: () => openFrameCheckout(me.id, userEmail, tryOn.key), sub: 'Single payment · Secure checkout by Lemon Squeezy' }
            : { label: 'Locked', disabled: true, sub: isCharm ? 'Earn this charm from ZChat events and gifts' : 'This frame goes on sale very soon' };
        return <FrameTryOnPage me={me} frameKey={isCharm ? null : tryOn.key} charmKey={isCharm ? tryOn.key : null} onClose={() => setTryOn(null)} action={action} />;
      })()}
    </div>
  );
}

function CharmPreview({ charm, size }) {
  const url = useCustomBadgeUrl(charm);
  const spec = CUSTOM_BADGES[charm];
  if (!spec || !url) return <div style={{ width: size * (spec ? spec.ratio : 1), height: size }} />;
  return <img src={url} alt="" draggable={false} style={{ height: size, width: Math.round(size * spec.ratio), objectFit: 'contain' }} />;
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [viewportBox, setViewportBox] = useState({ height: null, offset: 0 });

  const [isWide, setIsWide] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 900 : false));
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const fullHeightRef = useRef(0);
  const fullWidthRef = useRef(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let frame = 0;
    const isTypingField = (el) => !!el && (el.tagName === 'TEXTAREA' || el.isContentEditable || (el.tagName === 'INPUT' && !['checkbox', 'radio', 'button', 'submit', 'file', 'range', 'color'].includes(el.type)));
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = window.innerWidth;
        if (Math.abs(width - fullWidthRef.current) > 40) {
          fullWidthRef.current = width;
          fullHeightRef.current = 0;
        }
        const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
        const typing = isTypingField(document.activeElement);
        if (!typing) fullHeightRef.current = Math.max(vv.height, layoutHeight);
        else fullHeightRef.current = Math.max(fullHeightRef.current, layoutHeight);
        const open = typing && fullHeightRef.current - vv.height > 120;
        const standalone = isAppleMobile() && (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
        let fill = null;
        setKeyboardOpen((prev) => (prev === open ? prev : open));
        setViewportBox((prev) => {
          const next = open
            ? { height: Math.round(vv.height), offset: Math.max(0, Math.round(vv.offsetTop)) }
            : { height: null, offset: 0 };
          return prev.height === next.height && prev.offset === next.offset ? prev : next;
        });
      });
    };
    const settle = () => setTimeout(() => {
      update();
      if (!isTypingField(document.activeElement) && (window.scrollY || document.documentElement.scrollTop)) window.scrollTo(0, 0);
    }, 300);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('focusin', update);
    window.addEventListener('focusout', settle);
    window.addEventListener('orientationchange', settle);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('focusin', update);
      window.removeEventListener('focusout', settle);
      window.removeEventListener('orientationchange', settle);
    };
  }, []);
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
  const [searchIFollow, setSearchIFollow] = useState(new Set());
  const [searchFollowsMe, setSearchFollowsMe] = useState(new Set());
  const [activeProfile, setActiveProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [composerMention, setComposerMention] = useState(null);
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
  const [activityFrom, setActivityFrom] = useState(null);
  const [mediaComposer, setMediaComposer] = useState(null);
  const [inAppToast, setInAppToast] = useState(null);
  const [contextRect, setContextRect] = useState(null);
  const [rowSheet, setRowSheet] = useState(null);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [chatMenuAnchor, setChatMenuAnchor] = useState(null);
  const [chatSearch, setChatSearch] = useState(null);
  const [showChatMedia, setShowChatMedia] = useState(false);
  const [pinIndex, setPinIndex] = useState(0);
  const [pinSheetFor, setPinSheetFor] = useState(null);
  const [muteSheet, setMuteSheet] = useState(null);
  const [mailOpenId, setMailOpenId] = useState(null);
  const [storyData, setStoryData] = useState({ byUser: {}, profiles: {}, seen: new Set(), liked: new Set(), ready: false });
  const [storyViewer, setStoryViewer] = useState(null);
  const [mutualIds, setMutualIds] = useState(new Set());
  const [blockedByIds, setBlockedByIds] = useState(new Set());
  const [blockConfirmFor, setBlockConfirmFor] = useState(null);
  const [unblockConfirmFor, setUnblockConfirmFor] = useState(null);
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [storyShareFor, setStoryShareFor] = useState(null);
  const [stickerSheetFor, setStickerSheetFor] = useState(null);
  const [celebrateTier, setCelebrateTier] = useState(null);
  const [deepPost, setDeepPost] = useState(null);
  const [reportThanks, setReportThanks] = useState(null);
  const [rewardReady, setRewardReady] = useState({});
  const [myRewards, setMyRewards] = useState([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const backStateRef = useRef({});
  const exitHintRef = useRef(0);
  backStateRef.current.closeTop = () => {
    const steps = [
      [collectionOpen, () => setCollectionOpen(false)],
      [showStickers, () => setShowStickers(false)],
      [showSettings, () => setShowSettings(false)],
      [showMail, () => setShowMail(false)],
      [showDiscover, () => setShowDiscover(false)],
      [showArchived, () => setShowArchived(false)],
      [profileOf, () => setProfileOf(null)],
      [mobileShowChat || activeProfile || activeGroup, () => { setMobileShowChat(false); setActiveProfile(null); setActiveGroup(null); }],
    ];
    const hit = steps.find(([open]) => !!open);
    if (!hit) return false;
    hit[1]();
    return true;
  };
  const newVersionAvailable = useNewVersionAvailable();
  const [updateLater, setUpdateLater] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recordLocked, setRecordLocked] = useState(false);
  const [recordDragX, setRecordDragX] = useState(0);
  const recordCancelRef = useRef(false);
  const recordGestureRef = useRef(null);
  const cameraGalleryRef = useRef(null);
  const blockRefreshTimerRef = useRef(null);
  const blockRefreshRef = useRef(null);
  const [activeGroupCall, setActiveGroupCall] = useState(null);
  const followRefreshTimerRef = useRef(null);
  const followRefreshRef = useRef(null);
  const storyFollowSetRef = useRef(new Set());
  const storyFeedRef = useRef(null);
  const callEngineRef = useRef(null);
  const handleCallRowRef = useRef(null);
  const [storyComposer, setStoryComposer] = useState(null);
  const [avatarPeek, setAvatarPeek] = useState(null);
  const [snack, setSnack] = useState('');
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [newBelowCount, setNewBelowCount] = useState(0);
  const stickToBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const storyInputRef = useRef(null);
  const openStoryRefRef = useRef(null);
  const storyDataRef = useRef(null);
  const reloadStoriesRef = useRef(null);
  const storyReloadTimerRef = useRef(null);
  const pendingStoryUserRef = useRef(null);
  const snackTimerRef = useRef(null);
  const groupMembersRef = useRef([]);
  const archivedConversationsRef = useRef([]);
  const [, setClockTick] = useState(0);
  const visibleIdsRef = useRef(new Set());
  const profileCacheRef = useRef(new Map());
  const rowPressRef = useRef({ timer: null, fired: false, x: 0, y: 0 });
  const listReloadTimerRef = useRef(null);
  const reloadListsRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [reactionPickerFor, setReactionPickerFor] = useState(null);
  const [contextMenuFor, setContextMenuFor] = useState(null);
  const [pendingQuickDelete, setPendingQuickDelete] = useState(null);
  const [pendingForwardItems, setPendingForwardItems] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
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
  const [showMail, setShowMail] = useState(false);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [listFilter, setListFilter] = useState('all');
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [composerTall, setComposerTall] = useState(false);
  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    if (!draft) {
      el.style.height = '38px';
      el.style.overflowY = 'hidden';
      setComposerTall(false);
      return;
    }
    el.style.height = '0px';
    const full = el.scrollHeight + 2;
    const next = Math.max(38, Math.min(148, full));
    el.style.height = `${next}px`;
    el.style.overflowY = full > 148 ? 'auto' : 'hidden';
    setComposerTall(next > 40);
  }, [draft, activeProfile && activeProfile.id, activeGroup && activeGroup.id]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [myLocks, setMyLocks] = useState({});
  const [unlockedChats, setUnlockedChats] = useState(new Set());
  const lastLeftChatAtRef = useRef({});
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
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!keyboardOpen) return undefined;
    const el = scrollRef.current;
    if (!el) return undefined;
    const t = setTimeout(() => {
      if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    }, 60);
    return () => clearTimeout(t);
  }, [keyboardOpen, viewportBox.height]);
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
  const conversationsRef = useRef([]);
  const groupsRef = useRef([]);
  const blockedRef = useRef(new Set());
  const locksRef = useRef({});
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

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
  const saveHiddenChatMap = (map) => { try { localStorage.setItem(hiddenChatsKey(), JSON.stringify(map)); } catch {} };
  const getHiddenChatMap = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(hiddenChatsKey()) || '{}');
      if (Array.isArray(raw)) {
        const now = Date.now();
        const map = {};
        raw.forEach((id) => { map[id] = now; });
        saveHiddenChatMap(map);
        return map;
      }
      return raw && typeof raw === 'object' ? raw : {};
    } catch {
      return {};
    }
  };
  const hideChatLocally = (otherUserId) => {
    const map = getHiddenChatMap();
    map[otherUserId] = Date.now();
    saveHiddenChatMap(map);
  };
  const unhideChatLocally = (otherUserId) => {
    const map = getHiddenChatMap();
    if (!(otherUserId in map)) return;
    delete map[otherUserId];
    saveHiddenChatMap(map);
  };

  const readKey = (convId) => `zchat-read-${session.user.id}-${convId}`;
  const markRead = (convId) => { try { localStorage.setItem(readKey(convId), Date.now().toString()); } catch {} };
  const isUnread = (conv) => (unreadCounts[conv.otherProfile.id] || 0) > 0;
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
    if (error) { alert(friendlyError(error, "Couldn't change the wallpaper. Try again.")); return; }
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, wallpaper_a: key, wallpaper_b: key } : c)));
    const label = key ? (WALLPAPER_PRESETS.find((p) => p.key === key)?.label || key) : 'Default';
    await sendMessage(session.user.id, conv.otherProfile.id, 'system', `Wallpaper changed to ${label}`, null);
    await upsertConversation(conv.otherProfile.id, `Wallpaper changed to ${label}`, 'system');
    loadConversations();
  };

  const setNameBar = async (conv, key) => {
    const { error } = await supabase.from('conversations').update({ name_bar: key }).eq('id', conv.id);
    if (error) { alert(friendlyError(error, "Couldn't change the header style. Try again.")); return; }
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, name_bar: key } : c)));
    const label = key ? (NAME_BAR_PRESETS.find((p) => p.key === key)?.label || key) : 'None';
    await sendMessage(session.user.id, conv.otherProfile.id, 'system', `Header style changed to ${label}`, null);
    await upsertConversation(conv.otherProfile.id, `Header style changed to ${label}`, 'system');
    loadConversations();
  };

  const setGroupWallpaper = async (key) => {
    if (!activeGroup || groupMembers.find((gm) => gm.user_id === session.user.id)?.role !== 'admin') return;
    const { error } = await supabase.from('groups').update({ wallpaper: key }).eq('id', activeGroup.id);
    if (error) { alert(friendlyError(error, "Couldn't change the wallpaper. Try again.")); return; }
    setActiveGroup((prev) => ({ ...prev, wallpaper: key }));
    const label = key ? (WALLPAPER_PRESETS.find((p) => p.key === key)?.label || key) : 'Default';
    sendGroupMessage('system', `${realName(session.user.id)} changed the wallpaper to ${label}`, null);
    loadGroups();
  };

  const setGroupHeaderStyle = async (key) => {
    if (!activeGroup || groupMembers.find((gm) => gm.user_id === session.user.id)?.role !== 'admin') return;
    const { error } = await supabase.from('groups').update({ name_bar: key }).eq('id', activeGroup.id);
    if (error) { alert(friendlyError(error, "Couldn't change the header style. Try again.")); return; }
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
    const { data: against } = await supabase.from('blocks').select('blocker_id').eq('blocked_id', session.user.id);
    const ids = new Set((against || []).map((b) => b.blocker_id));
    accountsThatBlockedMe.clear();
    ids.forEach((id) => accountsThatBlockedMe.add(id));
    setBlockedByIds(ids);
  };

  const loadFollowRequestCount = async () => {
    const { count } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', session.user.id).eq('status', 'pending');
    setFollowRequestCount(count || 0);
  };

  const loadUnreadMailCount = async () => {
    const { count } = await supabase.from('mails').select('*', { count: 'exact', head: true }).eq('recipient_id', session.user.id).eq('read', false);
    setUnreadMailCount(count || 0);
  };

  const blockUser = async (target) => {
    const userId = typeof target === 'string' ? target : target.id;
    const myId = session.user.id;
    const { error } = await supabase.from('blocks').insert({ blocker_id: myId, blocked_id: userId });
    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) { alert(friendlyError(error, "Couldn't block this account. Try again.")); return false; }
    await supabase.from('follows').delete().eq('follower_id', myId).eq('following_id', userId);
    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', myId);
    setMyBlockedIds((prev) => new Set(prev).add(userId));
    if (activeProfile?.id === userId) { setActiveFollowState('none'); setActiveFollowerFollowsMe(false); setReplyingTo(null); setEditingMessage(null); setDraft(''); }
    setProfileOf(null);
    setMutualIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    loadConversations();
    loadFollowRequestCount();
    loadMutuals();
    loadStories();
    return true;
  };
  const unblockUser = async (target) => {
    const userId = typeof target === 'string' ? target : target.id;
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', session.user.id).eq('blocked_id', userId);
    if (error) { alert(friendlyError(error, "Couldn't unblock this account. Try again.")); return false; }
    setMyBlockedIds((prev) => { const n = new Set(prev); n.delete(userId); return n; });
    loadConversations();
    loadStories();
    return true;
  };
  blockRefreshRef.current = () => { loadMyBlocks(); loadConversations(); loadMutuals(); loadStories(); };
  useEffect(() => {
    if (profileOf && blockedByIds.has(profileOf.id)) {
      setProfileOf(null);
      showSnack("This account isn't available");
    }
  }, [profileOf, blockedByIds]);

  const deleteMyAccount = async () => {
    await supabase.from('profiles').update({ is_deleted: true }).eq('id', session.user.id);
    removeAccountEntry(session.user.id);
    onLogout();
  };

  const enableChatLock = async (conv) => {
    if (!me?.chat_lock_hash) return;
    await supabase.from('chat_locks').upsert({ conversation_id: conv.id, owner_id: session.user.id, pin_hash: 'master' }, { onConflict: 'conversation_id,owner_id' });
    setMyLocks((prev) => ({ ...prev, [conv.id]: true }));
    setUnlockedChats((prev) => { const n = new Set(prev); n.delete(conv.id); return n; });
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
    const myId = session.user.id;
    const hiddenMap = getHiddenChatMap();
    const hiddenMsgs = getHiddenMsgIds();
    const archived = getArchivedChatIds();
    const { data } = await supabase.from('conversations').select('*')
      .or(`user_a.eq.${myId},user_b.eq.${myId}`)
      .order('last_message_at', { ascending: false });
    if (!data || data.length === 0) { setConversations([]); setArchivedConversations([]); return; }
    const { data: recentMsgs } = await supabase.from('messages')
      .select('id, sender_id, receiver_id, type, content, deleted, created_at, read, delivered, story_id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`).is('group_id', null)
      .order('created_at', { ascending: false }).limit(800);
    const lastByOther = {};
    (recentMsgs || []).forEach((m) => {
      if (hiddenMsgs.has(m.id)) return;
      const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
      if (otherId && !lastByOther[otherId]) lastByOther[otherId] = m;
    });
    let hiddenChanged = false;
    const visible = data.filter((c) => {
      const otherId = c.user_a === myId ? c.user_b : c.user_a;
      if (!(otherId in hiddenMap)) return true;
      const last = lastByOther[otherId];
      if (last && last.sender_id !== myId && new Date(last.created_at).getTime() > Number(hiddenMap[otherId] || 0)) {
        delete hiddenMap[otherId];
        hiddenChanged = true;
        return true;
      }
      return false;
    });
    if (hiddenChanged) saveHiddenChatMap(hiddenMap);
    const otherIds = visible.map((c) => (c.user_a === myId ? c.user_b : c.user_a));
    const noIds = ['00000000-0000-0000-0000-000000000000'];
    const { data: profsRaw } = await supabase.from('profiles').select('*').in('id', otherIds.length ? otherIds : noIds);
    const profs = sanitizeAvatarList(profsRaw, myId);
    const { data: nicks } = await supabase.from('contact_nicknames').select('*').eq('owner_id', myId);
    const { data: aliasesForMe } = await supabase.from('self_aliases').select('*').eq('viewer_id', myId);
    const mergedAll = visible
      .map((c) => {
        const otherId = c.user_a === myId ? c.user_b : c.user_a;
        const nick = nicks?.find((n) => n.contact_id === otherId);
        const theirAlias = aliasesForMe?.find((al) => al.user_id === otherId);
        const foundProfile = profs?.find((p) => p.id === otherId);
        const profile = foundProfile || { id: otherId, name: 'Deleted Account', username: 'deleted', avatar: '', is_deleted: true };
        const baseName = theirAlias ? theirAlias.alias : profile.name;
        const last = lastByOther[otherId];
        const convTime = c.last_message_at ? new Date(c.last_message_at).getTime() : 0;
        const msgTime = last ? new Date(last.created_at).getTime() : 0;
        const useStored = !last || (c.last_message && convTime - msgTime > 1500);
        const preview = useStored ? { kind: 'text', text: c.last_message || '' } : describeMessage(last);
        const lastFromMe = useStored ? c.last_sender_id === myId : last.sender_id === myId;
        return {
          ...c, otherProfile: profile.is_deleted ? hiddenAccountProfile(profile) : (nick && foundProfile ? { ...profile, name: nick.nickname } : { ...profile, name: baseName }), realName: profile.name,
          preview, lastFromMe, sortTime: Math.max(convTime, msgTime),
          lastMineRead: last && last.sender_id === myId ? !!last.read : false,
          lastMineDelivered: last && last.sender_id === myId ? !!last.delivered : false,
        };
      })
      .filter(Boolean)
      .sort((x, y) => {
        const px = isPinnedByMe(x) ? 1 : 0;
        const py = isPinnedByMe(y) ? 1 : 0;
        if (px !== py) return py - px;
        return y.sortTime - x.sortTime;
      });
    setConversations(mergedAll.filter((c) => !archived.has(c.id)));
    setArchivedConversations(mergedAll.filter((c) => archived.has(c.id)));
  };

  const upsertConversation = async (otherId, text, type) => {
    unhideChatLocally(otherId);
    const [a, b] = pairKey(session.user.id, otherId);
    const preview = type === 'text' ? (parseProfileLink(text) ? 'Shared a profile' : text)
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
    if (me) { loadConversations(); loadUnreadCounts(); loadMyLocks(); loadGroups(); loadMyBlocks(); loadStories(); subscribeToPush(session.user.id, false); loadFollowRequestCount(); loadUnreadMailCount(); supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id); }
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const params = new URLSearchParams(window.location.search);
    const acc = params.get('acc');
    if (acc && acc !== session.user.id) {
      ['dm', 'group', 'post', 'story', 'mail', 's', 'acc'].forEach((k) => params.delete(k));
      const rest = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`);
      showSnack('That notification is for your other account. Switch account to open it.');
      return;
    }
    const dmId = params.get('dm');
    const postFlag = params.get('post');
    if (postFlag) {
      (async () => {
        const { data: postRow } = await supabase.from('posts').select('*').eq('id', postFlag).maybeSingle();
        if (!postRow) { showSnack("This post isn't available"); return; }
        const { data: ownerRow } = await getProfile(postRow.user_id);
        if (ownerRow) setDeepPost({ post: postRow, owner: sanitizeAvatar(ownerRow, session.user.id) });
      })();
    }
    const groupId = params.get('group');
    const profileId = params.get('profile');
    const requestsFlag = params.get('requests');
    const mailFlag = params.get('mail');
    const storyFlag = params.get('story');
    const callFlag = params.get('call');
    const storyItemFlag = params.get('s');
    if (storyItemFlag) { pendingStoryUserRef.current = null; setTimeout(() => { if (openStoryRefRef.current) openStoryRefRef.current({ story_id: storyItemFlag }); }, 700); }
    if (callFlag) {
      (async () => {
        const { data: callRow } = await supabase.from('calls').select('*').eq('id', callFlag).maybeSingle();
        if (callRow && handleCallRowRef.current) handleCallRowRef.current(callRow);
      })();
    }
    if (storyFlag) pendingStoryUserRef.current = storyFlag;
    if (requestsFlag) setShowFollowRequests(true);
    if (mailFlag) setShowMail(true);
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
    if (dmId || groupId || profileId || requestsFlag || mailFlag || storyFlag || callFlag || postFlag) window.history.replaceState({}, '', window.location.pathname);
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
    if (!me) return undefined;
    const channel = supabase.channel('stories-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, (payload) => {
        const row = payload.new;
        if (!row || !storyFollowSetRef.current.has(row.user_id)) return;
        clearTimeout(storyReloadTimerRef.current);
        storyReloadTimerRef.current = setTimeout(() => { if (reloadStoriesRef.current) reloadStoriesRef.current(); }, 80);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, (payload) => {
        const id = payload.old && payload.old.id;
        if (!id) return;
        setStoryData((prev) => {
          const byUser = {};
          Object.entries(prev.byUser).forEach(([uid, list]) => { byUser[uid] = list.filter((s) => s.id !== id); });
          return { ...prev, byUser };
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'story_likes' }, async (payload) => {
        const row = payload.new;
        if (!row || row.user_id === me.id) return;
        const data = storyDataRef.current;
        const mine = data && (data.byUser[me.id] || []).some((s) => s.id === row.story_id);
        if (!mine) return;
        const who = await cachedProfile(row.user_id);
        if (!who) return;
        setInAppToast({ key: `slike-${row.story_id}-${row.user_id}`, kind: 'notice', title: who.name, verified: who.verified, avatar: who.avatar, avatarName: who.name,
          preview: { kind: 'story', text: 'liked your story' }, action: { type: 'story', userId: me.id } });
      })
      .subscribe();
    const feed = supabase.channel('story-feed', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'story' }, ({ payload }) => {
        if (!payload || !storyFollowSetRef.current.has(payload.userId)) return;
        clearTimeout(storyReloadTimerRef.current);
        storyReloadTimerRef.current = setTimeout(() => { if (reloadStoriesRef.current) reloadStoriesRef.current(); }, 60);
      })
      .subscribe();
    storyFeedRef.current = feed;
    const poll = setInterval(() => { if (document.visibilityState === 'visible' && reloadStoriesRef.current) reloadStoriesRef.current(); }, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible' && reloadStoriesRef.current) reloadStoriesRef.current(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(feed);
      storyFeedRef.current = null;
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [me]);

  useEffect(() => {
    if (!me) return undefined;
    const channel = supabase.channel('notices-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, (payload) => {
        const row = payload.new && payload.new.blocker_id ? payload.new : payload.old;
        if (row && row.blocker_id && row.blocker_id !== me.id && row.blocked_id !== me.id) return;
        clearTimeout(blockRefreshTimerRef.current);
        blockRefreshTimerRef.current = setTimeout(() => { if (blockRefreshRef.current) blockRefreshRef.current(); }, 400);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const row = payload.new && payload.new.follower_id ? payload.new : payload.old;
        if (row && row.follower_id && row.follower_id !== me.id && row.following_id !== me.id) return;
        clearTimeout(followRefreshTimerRef.current);
        followRefreshTimerRef.current = setTimeout(() => { if (followRefreshRef.current) followRefreshRef.current(); }, 500);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'follows' }, async (payload) => {
        const row = payload.new;
        if (!row || row.following_id !== me.id || row.follower_id === me.id) return;
        loadFollowRequestCount();
        const who = await cachedProfile(row.follower_id);
        if (!who) return;
        setInAppToast({ key: `follow-${row.follower_id}-${Date.now()}`, kind: 'notice', title: who.name, verified: who.verified, avatar: who.avatar, avatarName: who.name,
          preview: { kind: 'text', text: row.status === 'pending' ? 'requested to follow you' : 'started following you' },
          action: row.status === 'pending' ? { type: 'requests' } : { type: 'profile', profile: who } });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'follows' }, async (payload) => {
        const row = payload.new;
        if (!row || row.follower_id !== me.id || row.status !== 'accepted') return;
        if (payload.old && payload.old.status === 'accepted') return;
        const who = await cachedProfile(row.following_id);
        if (!who) return;
        setInAppToast({ key: `accepted-${row.following_id}-${Date.now()}`, kind: 'notice', title: who.name, verified: who.verified, avatar: who.avatar, avatarName: who.name,
          preview: { kind: 'text', text: 'accepted your follow request' }, action: { type: 'profile', profile: who } });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mails' }, (payload) => {
        const row = payload.new;
        if (!row || row.recipient_id !== me.id) return;
        setInAppToast({ key: `mail-${row.id}`, kind: 'notice', icon: row.type === 'report_warning' ? 'warning' : row.type === 'mention' ? 'mention' : row.type === 'update' ? 'update' : row.type === 'badge' ? 'badge' : 'mail', badgeTier: badgeTierFromTitle(row.title), title: row.title || 'New mail',
          preview: { kind: 'text', text: row.body || '' }, action: { type: 'mail', id: row.id } });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, async (payload) => {
        const row = payload.new;
        if (!row || row.user_id !== me.id || !row.added_by || row.added_by === me.id) return;
        const { data: g } = await supabase.from('groups').select('*').eq('id', row.group_id).maybeSingle();
        if (!g) return;
        const who = await cachedProfile(row.added_by);
        loadGroups();
        setInAppToast({ key: `group-${row.group_id}-${Date.now()}`, kind: 'notice', isGroupIcon: true, groupAvatar: g.avatar, title: g.name,
          preview: { kind: 'text', text: `${who?.name || 'Someone'} added you to this group` }, action: { type: 'group', group: g } });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('mail-watch-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mails' }, (payload) => {
        const row = payload.new || payload.old;
        if (row && row.recipient_id === me.id) loadUnreadMailCount();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    if (!me) return undefined;
    const sub = subscribeToMessages(me.id, (msg) => {
      const current = activeProfileRefForCalls.current;
      if (msg.sender_id !== me.id) {
        if (blockedRef.current.has(msg.sender_id)) return;
        unhideChatLocally(msg.sender_id);
        if (msg.sender_id !== (current && current.id) || !mobileShowChatRef.current) {
          supabase.from('messages').update({ delivered: true }).eq('id', msg.id);
          const senderConv = conversationsRef.current.find((c) => c.otherProfile.id === msg.sender_id) || archivedConversationsRef.current.find((c) => c.otherProfile.id === msg.sender_id);
          if (!(senderConv && isActiveUntil(senderConv[senderConv.user_a === me.id ? 'muted_until_a' : 'muted_until_b']))) {
            playPing();
            showMessageToast(msg);
          }
        } else {
          supabase.from('messages').update({ read: true, delivered: true }).eq('id', msg.id);
          setActivityFrom(null);
        }
        loadUnreadCounts();
        clearTimeout(listReloadTimerRef.current);
        listReloadTimerRef.current = setTimeout(() => { if (reloadListsRef.current) reloadListsRef.current(); }, 250);
      }
      setMessages((prev) => (current && msg.sender_id === current.id && !prev.some((x) => x.id === msg.id) ? [...prev, msg] : prev));
    });
    const mine = supabase.channel('my-sent-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new;
        if (!row || row.sender_id !== me.id || row.group_id) return;
        const current = activeProfileRefForCalls.current;
        if (current && row.receiver_id === current.id) setMessages((prev) => (prev.some((x) => x.id === row.id) ? prev : [...prev, row]));
        clearTimeout(listReloadTimerRef.current);
        listReloadTimerRef.current = setTimeout(() => { if (reloadListsRef.current) reloadListsRef.current(); }, 400);
      })
      .subscribe();
    const meWatch = supabase.channel('me-profile-' + me.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const row = payload.new;
        if (!row || row.id !== me.id) return;
        setMe((prev) => (prev ? { ...prev, ...row, email: prev.email } : prev));
      })
      .subscribe();
    const blockContext = (e) => {
      const t = e.target;
      if (t && (t.closest('input, textarea, [contenteditable="true"]'))) return;
      e.preventDefault();
    };
    document.addEventListener('contextmenu', blockContext);
    return () => { supabase.removeChannel(sub); supabase.removeChannel(mine); supabase.removeChannel(meWatch); document.removeEventListener('contextmenu', blockContext); };
  }, [me && me.id]);

  useEffect(() => {
    if (me) { loadConversations(); loadStories(); }
  }, [myBlockedIds]);

  useEffect(() => {
    if (!me) return;
    const channel = supabase.channel('read-receipts-' + me.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const row = payload.new;
        if (!row || !row.id) return;
        if (row.deleted || row.edited || row.sender_id === me.id || row.receiver_id === me.id) {
          clearTimeout(listReloadTimerRef.current);
          listReloadTimerRef.current = setTimeout(() => { if (reloadListsRef.current) reloadListsRef.current(); }, 500);
          if (row.receiver_id === me.id && row.read) loadUnreadCounts();
        }
        setMessages((prev) => (prev.some((m) => m.id === row.id)
          ? prev.map((m) => (m.id === row.id ? { ...m, read: row.read, delivered: row.delivered, edited: row.edited, deleted: row.deleted, content: row.deleted ? m.content : row.content, pinned_until: row.pinned_until, pinned_by: row.pinned_by, pinned_at: row.pinned_at } : m))
          : prev));
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);

  useEffect(() => {
    if (!me || (!activeProfile && !activeGroup)) return;
    const channel = supabase.channel('reactions-' + (activeGroup ? activeGroup.id : activeProfile.id))
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
  }, [me, activeProfile, activeGroup, messages]);

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
        if (row.sender_id !== me.id && (!activeGroup || row.group_id !== activeGroup.id)) {
          supabase.from('messages').update({ delivered: true }).eq('id', row.id);
          const mutedGroup = groupsRef.current.find((x) => x.id === row.group_id);
          const mentioned = row.type === 'text' && extractMentions(row.content || '').has((me.username || '').toLowerCase());
          if (!(mutedGroup && isActiveUntil(mutedGroup.mutedUntil)) || mentioned) { playPing(); showMessageToast(row); }
        }
        if (row.sender_id !== me.id && activeGroup && row.group_id === activeGroup.id) { markGroupRead(activeGroup.id); supabase.from('messages').update({ read: true, delivered: true }).eq('id', row.id); }
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
    let subscribed = false;
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setOnlineIds(new Set(Object.keys(state)));
      visibleIdsRef.current = new Set(Object.entries(state).filter(([, metas]) => (metas || []).some((meta) => meta && meta.visible === true)).map(([id]) => id));
    });
    const trackPresence = () => {
      if (!subscribed) return;
      channel.track({ online_at: new Date().toISOString(), visible: document.visibilityState === 'visible' }).catch(() => {});
    };
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') { subscribed = true; trackPresence(); }
    });
    const updateLastSeen = () => { supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', me.id); };
    const heartbeat = setInterval(updateLastSeen, 45000);
    const onVisibility = () => { trackPresence(); if (document.visibilityState === 'hidden') updateLastSeen(); };
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
    if (draft === '') setComposerMention(null);
    if (composerRef.current && draft === '') {
      composerRef.current.style.height = 'auto';
    }
  }, [draft]);

  useEffect(() => {
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

  const preloadedImagesRef = useRef(new Set());
  useEffect(() => {
    const files = [];
    const add = (list, key) => { const preset = key && list.find((x) => x.key === key); if (preset) files.push(preset.file); };
    conversations.forEach((c) => {
      add(NAME_BAR_PRESETS, c.name_bar);
      add(WALLPAPER_PRESETS, c[c.user_a === session.user.id ? 'wallpaper_a' : 'wallpaper_b']);
    });
    groups.forEach((g) => { add(NAME_BAR_PRESETS, g.name_bar); add(WALLPAPER_PRESETS, g.wallpaper); });
    files.forEach((file) => {
      if (preloadedImagesRef.current.has(file)) return;
      preloadedImagesRef.current.add(file);
      const img = new Image();
      img.decoding = 'async';
      img.src = file;
    });
  }, [conversations, groups]);
  const chatKey = activeGroup?.id || activeProfile?.id || null;
  const activeProfileIdForSeen = activeGroup ? null : (activeProfile ? activeProfile.id : null);
  useEffect(() => {
    if (!activeProfileIdForSeen) return undefined;
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supabase.from('profiles').select('id, last_seen, hide_activity, verified, name, avatar').eq('id', activeProfileIdForSeen).maybeSingle();
      if (cancelled || !data) return;
      setActiveProfile((prev) => (prev && prev.id === data.id ? { ...prev, last_seen: data.last_seen, hide_activity: data.hide_activity, verified: data.verified } : prev));
    };
    refresh();
    const t = setInterval(refresh, 20000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; clearInterval(t); document.removeEventListener('visibilitychange', onVisible); };
  }, [activeProfileIdForSeen]);
  const scrollChatToBottom = (smooth) => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    if (smooth && typeof el.scrollTo === 'function') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    else el.scrollTop = el.scrollHeight;
    setNewBelowCount(0);
    setShowJumpButton(false);
  };
  useEffect(() => {
    stickToBottomRef.current = true;
    prevMsgCountRef.current = 0;
    setNewBelowCount(0);
    setShowJumpButton(false);
  }, [chatKey]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !chatKey || loadingConvo) return;
    const prev = prevMsgCountRef.current;
    const count = messages.length;
    prevMsgCountRef.current = count;
    if (prev === 0 || count <= prev) {
      if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
      return;
    }
    const added = messages.slice(prev);
    const mine = added.some((x) => x.sender_id === session.user.id && x.type !== 'system');
    if (mine || stickToBottomRef.current) {
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    } else {
      const incoming = added.filter((x) => x.sender_id !== session.user.id && x.type !== 'system').length;
      if (incoming) setNewBelowCount((n) => n + incoming);
    }
  }, [messages, loadingConvo, chatKey]);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !chatKey || typeof ResizeObserver === 'undefined') return undefined;
    const inner = el.firstElementChild;
    const ro = new ResizeObserver(() => { if (stickToBottomRef.current) el.scrollTop = el.scrollHeight; });
    ro.observe(el);
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [chatKey, loadingConvo]);

  const handleChatScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < 80;
    const show = distance > 320;
    setShowJumpButton((prev) => (prev === show ? prev : show));
    if (distance < 80) setNewBelowCount((n) => (n ? 0 : n));
  };


  const doSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    if (val.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      const list = sanitizeAvatarList(data, session.user.id).filter((u) => u.id !== session.user.id && !u.is_deleted && !myBlockedIds.has(u.id));
      setResults(list);
      setSearching(false);
      const ids = list.map((u) => u.id);
      if (!ids.length) { setSearchIFollow(new Set()); setSearchFollowsMe(new Set()); return; }
      const { data: mine } = await supabase.from('follows').select('following_id').eq('follower_id', session.user.id).eq('status', 'accepted').in('following_id', ids);
      setSearchIFollow(new Set((mine || []).map((r) => r.following_id)));
      const { data: theirs } = await supabase.from('follows').select('follower_id').eq('following_id', session.user.id).eq('status', 'accepted').in('follower_id', ids);
      setSearchFollowsMe(new Set((theirs || []).map((r) => r.follower_id)));
    }, 300);
  };

  const groupReadKey = (groupId) => `zchat-group-read-${session.user.id}-${groupId}`;
  const markGroupRead = (groupId) => { try { localStorage.setItem(groupReadKey(groupId), new Date().toISOString()); } catch {} };
  const getGroupReadAt = (groupId) => { try { return localStorage.getItem(groupReadKey(groupId)); } catch { return null; } };
  const activeGroupIdRef = useRef(null);
  useEffect(() => { activeGroupIdRef.current = activeGroup ? activeGroup.id : null; }, [activeGroup]);

  const loadGroups = async () => {
    const { data: mems } = await supabase.from('group_members').select('*').eq('user_id', session.user.id);
    if (!mems || !mems.length) { setGroups([]); return; }
    const ids = mems.map((m) => m.group_id);
    const { data: groupRows } = await supabase.from('groups').select('*').in('id', ids);
    const { data: recent } = await supabase.from('messages').select('id, group_id, sender_id, type, content, created_at, deleted')
      .in('group_id', ids).order('created_at', { ascending: false }).limit(Math.min(1500, ids.length * 60));
    const hiddenMsgs = getHiddenMsgIds();
    const visibleRecent = (recent || []).filter((m) => !hiddenMsgs.has(m.id));
    const lastSenderIds = [...new Set(ids.map((gid) => visibleRecent.find((m) => m.group_id === gid)).filter((m) => m && m.sender_id !== session.user.id && m.type !== 'system').map((m) => m.sender_id))];
    const senderNames = {};
    if (lastSenderIds.length) {
      const { data: senders } = await supabase.from('profiles').select('id, name').in('id', lastSenderIds);
      (senders || []).forEach((s) => { senderNames[s.id] = s.name; });
    }
    const merged = (groupRows || []).map((g) => {
      const mine = mems.find((m) => m.group_id === g.id);
      const groupMsgs = visibleRecent.filter((m) => m.group_id === g.id);
      const last = groupMsgs[0];
      let readAt = getGroupReadAt(g.id);
      if (!readAt) { markGroupRead(g.id); readAt = new Date().toISOString(); }
      const readTime = new Date(readAt).getTime();
      const unread = activeGroupIdRef.current === g.id ? 0 : groupMsgs.filter((m) => m.sender_id !== session.user.id && m.type !== 'system' && !m.deleted && new Date(m.created_at).getTime() > readTime).length;
      const preview = last ? describeMessage(last) : { kind: 'text', text: 'No messages yet' };
      const previewPrefix = !last || last.type === 'system' ? '' : last.sender_id === session.user.id ? 'You: ' : `${(senderNames[last.sender_id] || 'Someone').split(' ')[0]}: `;
      return { ...g, myRole: mine?.role || 'member', pinned: mine?.pinned || false, archived: mine?.archived || false, last_message: last?.deleted ? 'This message was deleted' : last?.content, last_message_type: last?.deleted ? 'text' : last?.type, last_message_at: last?.created_at || g.created_at, unread, preview, previewPrefix, mutedUntil: mine?.notify_muted_until || null };
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
    if (g.created_by === session.user.id) { await openGroup(g); setShowGroupInfo(true); return; }
    if (g.myRole === 'admin') {
      const { count: adminCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id).eq('role', 'admin');
      const { count: memberCount } = await supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', g.id);
      if ((adminCount || 0) <= 1 && (memberCount || 0) > 1) { await openGroup(g); setShowGroupInfo(true); return; }
    }
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
    setActiveGroupCall(null);
    supabase.from('calls').select('*').eq('group_id', group.id).in('status', ['ringing', 'active']).order('created_at', { ascending: false }).limit(1)
      .then(({ data }) => {
        const row = data && data[0];
        if (row && Date.now() - new Date(row.created_at).getTime() < 3 * 3600000 && activeGroupIdRef.current === group.id) setActiveGroupCall(row);
      });
    setChatSearch(null);
    setShowChatMedia(false);
    setPinIndex(0);
    markGroupRead(group.id);
    activeGroupIdRef.current = group.id;
    setGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, unread: 0 } : g)));
    setActiveGroup(group);
    setActiveProfile(null);
    setMobileShowChat(true);
    setLoadingConvo(true);
    setSelectionMode(false);
    setSelectedIds(new Set());
    setReplyingTo(null);
    setEditingMessage(null);
    setPendingForwardItems([]);
    const { data: newestFirst } = await supabase.from('messages').select('*').eq('group_id', group.id).order('created_at', { ascending: false }).limit(CHAT_HISTORY_LIMIT);
    const data = (newestFirst || []).slice().reverse();
    const hidden = getHiddenMsgIds();
    const visible = (data || []).filter((m) => !hidden.has(m.id));
    setMessages(visible);
    setLoadingConvo(false);
    loadGroupMembers(group.id);
    const ids = visible.map((m) => m.id).slice(-400);
    if (ids.length) {
      const { data: likes } = await supabase.from('message_likes').select('*').in('message_id', ids);
      const grouped = {};
      (likes || []).forEach((l) => { grouped[l.message_id] = grouped[l.message_id] || []; grouped[l.message_id].push({ user_id: l.user_id, emoji: l.emoji }); });
      setMessageLikes(grouped);
    } else {
      setMessageLikes({});
    }
  };

  const sendGroupMessage = async (type, content, mediaUrl, forwardedFromName, replyToId) => {
    const row = {
      sender_id: session.user.id, group_id: activeGroup.id, type, content: content || null, media_url: mediaUrl || null,
      forwarded: !!forwardedFromName, forwarded_from_name: forwardedFromName || null,
    };
    if (replyToId) row.reply_to_id = replyToId;
    const tempId = type === 'system' ? null : `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if (tempId) {
      setMessages((prev) => [...prev, { ...row, id: tempId, created_at: new Date().toISOString(), read: false, delivered: false, deleted: false, sending: true }]);
    }
    const { data, error } = await supabase.from('messages').insert(row).select().single();
    if (tempId) setMessages((prev) => prev.filter((x) => x.id !== tempId || (error ? true : false)).map((x) => (x.id === tempId && error ? { ...x, sending: false, failed: true } : x)));
    if (!error && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      loadGroups();
      if (type !== 'system') {
        const preview = type === 'text' ? (parseProfileLink(content) ? 'Shared a profile' : content) : type === 'image' ? 'Photo' : type === 'audio' ? 'Voice message' : type === 'sticker' ? 'Sticker' : 'Video';
        const mentioned = extractMentions(content || '');
        groupMembers.filter((m) => m.user_id !== session.user.id).forEach((m) => {
          if (mentioned.has((m.profile?.username || '').toLowerCase())) {
            notifyUser(m.user_id, `${me.name} mentioned you in ${activeGroup.name}`, preview, `/?group=${activeGroup.id}`, me.avatar);
          } else if (!m.muted) {
            notifyUser(m.user_id, `${me.name} in ${activeGroup.name}`, preview, `/?group=${activeGroup.id}`, me.avatar);
          }
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
    people.forEach((p) => notifyUser(p.id, 'ZChat', `${me.name} added you to ${activeGroup.name}`, `/?group=${activeGroup.id}`, me.avatar));
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
    if (activeConvForBar && activeConvForBar.otherProfile.id !== profile.id && myLocks[activeConvForBar.id]) {
      lastLeftChatAtRef.current[activeConvForBar.id] = Date.now();
    }
    if (!convId) {
      const { data: freshCheck } = await getProfile(profile.id);
      if (freshCheck?.is_deleted) {
        setDeletedAccountAlertFor(profile.name || 'This person');
        return;
      }
    }
    if (convId) {
      let isLocked = !!myLocks[convId];
      if (!isLocked) {
        const { data: lockRow } = await supabase.from('chat_locks').select('conversation_id').eq('conversation_id', convId).eq('owner_id', session.user.id).maybeSingle();
        isLocked = !!lockRow;
      }
      if (isLocked) {
        const lastLeft = lastLeftChatAtRef.current[convId];
        const graceExpired = lastLeft != null && (Date.now() - lastLeft) >= 5000;
        if (graceExpired && unlockedChats.has(convId)) {
          setUnlockedChats((prev) => { const n = new Set(prev); n.delete(convId); return n; });
        }
        const stillUnlocked = unlockedChats.has(convId) && !graceExpired;
        if (!stillUnlocked) {
          setLockPromptFor({ profile, convId });
          return;
        }
      }
    }
    await actuallyOpenChat(profile, convId);
  };

  const actuallyOpenChat = async (profile, convId) => {
    setActiveGroupCall(null);
    setChatSearch(null);
    setShowChatMedia(false);
    setPinIndex(0);
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
    const myId = session.user.id;
    const { data: newestFirst } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${myId})`)
      .is('group_id', null)
      .order('created_at', { ascending: false })
      .limit(CHAT_HISTORY_LIMIT);
    const data = (newestFirst || []).slice().reverse();
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
    const replyId = replyingTo ? replyingTo.id : null;
    setReplyingTo(null);
    if (activeGroup) {
      await sendGroupMessage('sticker', filePath, null, null, replyId);
      return;
    }
    const { data } = replyId
      ? await supabase.from('messages').insert({ sender_id: session.user.id, receiver_id: activeProfile.id, group_id: null, type: 'sticker', content: filePath, reply_to_id: replyId }).select().single()
      : await sendMessage(session.user.id, activeProfile.id, 'sticker', filePath, null);
    if (data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      upsertConversation(activeProfile.id, filePath, 'sticker');
      notifyUser(activeProfile.id, me.name, 'Sticker', `/?dm=${session.user.id}`, me.avatar);
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
              setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
              notifyUser(activeProfile.id, me.name, captionForThis || (items[i].kind === 'image' ? 'Photo' : 'Video'), `/?dm=${session.user.id}`, me.avatar);
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
      const groupReplyId = replyingTo?.id || null;
      setReplyingTo(null);
      await sendGroupMessage('text', text, null, soloForwardName, groupReplyId);
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
          setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
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
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimistic = {
      id: tempId, sender_id: session.user.id, receiver_id: activeProfile.id, group_id: null,
      type: 'text', content: text, media_url: null, reply_to_id: replyId || null,
      created_at: new Date().toISOString(), read: false, delivered: false, deleted: false, sending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    const { data } = replyId
      ? (await supabase.from('messages').insert({ sender_id: session.user.id, receiver_id: activeProfile.id, group_id: null, type: 'text', content: text, reply_to_id: replyId }).select().single())
      : await sendMessage(session.user.id, activeProfile.id, 'text', text, null);
    if (!data) {
      setMessages((prev) => prev.map((x) => (x.id === tempId ? { ...x, sending: false, failed: true } : x)));
    }
    if (data) {
      setMessages((prev) => prev.filter((x) => x.id !== tempId));
      if (wasForward) {
        await supabase.from('messages').update({ forwarded: true, forwarded_from_name: items[0].forwarded_from_name || null }).eq('id', data.id);
        data.forwarded = true;
        data.forwarded_from_name = items[0].forwarded_from_name || null;
      }
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      upsertConversation(activeProfile.id, text, 'text');
      notifyUser(activeProfile.id, me.name, parseProfileLink(text) ? 'Shared a profile' : text, `/?dm=${session.user.id}`, me.avatar);
    }
  };

  const pickComposerMention = (picked) => {
    if (!composerMention) return;
    const { value, caret } = applyMention(draft, composerMention, picked.username, MAX_CHARS);
    setDraft(value);
    setComposerMention(null);
    requestAnimationFrame(() => {
      const el = composerRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 110) + 'px';
    });
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

  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    openMediaComposer(files);
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
        setRecordLocked(false);
        setRecordDragX(0);
        mediaRecorderRef.current = null;
        if (recordCancelRef.current) { recordCancelRef.current = false; return; }
        if (!activeProfile && !activeGroup) return;
        const blob = new Blob(audioChunksRef.current, { type: actualMime });
        if (blob.size < 1000) {
          showSnack('Hold the mic a little longer to record');
          return;
        }
        playUiSound('send');
        const file = new File([blob], `voice.${ext}`, { type: actualMime });
        setUploading(true);
        const { url, error } = await uploadMedia(file, session.user.id);
        if (!error && url) {
          if (activeGroup) {
            await sendGroupMessage('audio', null, url);
          } else {
            const { data } = await sendMessage(session.user.id, activeProfile.id, 'audio', null, url);
            if (data) { setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data])); upsertConversation(activeProfile.id, null, 'audio'); notifyUser(activeProfile.id, me.name, 'Voice message', `/?dm=${session.user.id}`, me.avatar); }
          }
        }
        setUploading(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      recordStartRef.current = Date.now();
      recordCancelRef.current = false;
      playUiSound('record-start');
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
      if (pendingStopRef.current) { pendingStopRef.current = false; stopRecording(); }
    } catch {
      alert('Microphone access is needed to send a voice message.');
    }
  };

  const cancelRecording = () => {
    recordCancelRef.current = true;
    playUiSound('cancel');
    if (!mediaRecorderRef.current) { pendingStopRef.current = true; return; }
    try { mediaRecorderRef.current.stop(); } catch {}
  };
  const onMicDown = (e) => {
    e.preventDefault();
    if (recording) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    recordGestureRef.current = { x: e.clientX, y: e.clientY, locked: false, cancelled: false };
    setRecordDragX(0);
    setRecordLocked(false);
    startRecording();
  };
  const onMicMove = (e) => {
    const g = recordGestureRef.current;
    if (!g || g.locked || g.cancelled) return;
    const dx = Math.min(0, e.clientX - g.x);
    const dy = e.clientY - g.y;
    if (dy < -70) { g.locked = true; setRecordLocked(true); setRecordDragX(0); if (navigator.vibrate) navigator.vibrate(15); return; }
    setRecordDragX(dx);
    if (dx < -110) { g.cancelled = true; setRecordDragX(0); cancelRecording(); }
  };
  const onMicUp = () => {
    const g = recordGestureRef.current;
    recordGestureRef.current = null;
    if (!g || g.locked || g.cancelled) return;
    setRecordDragX(0);
    stopRecording();
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
    setReportThanks({ profile });
    await reportUser(session.user.id, profile.id, reason);
    await sendReportMail(profile.id, reason);
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
  const focusComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    const len = el.value.length;
    try { el.setSelectionRange(len, len); } catch {}
  };
  const doStartEditSingle = (m) => { setEditingMessage(m); setDraft(m.content || ''); setReplyingTo(null); setContextMenuFor(null); focusComposer(); };
  const doStartReplySingle = (m) => { setReplyingTo(m); setEditingMessage(null); setContextMenuFor(null); focusComposer(); };
  const doDeleteForMeSingle = (m) => { hideMessagesLocally([m.id]); setMessages((prev) => prev.filter((x) => x.id !== m.id)); setContextMenuFor(null); };
  const doDeleteForEveryoneSingle = async (m) => { await deleteMessage(m.id); setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted: true } : x))); setContextMenuFor(null); };
  const openForwardSingle = (m) => { setForwardTargets([{ ...m, forwarded_from_name: labelForSender(m.sender_id) }]); setForwardOpen(true); setContextMenuFor(null); };
  const doReportSingle = (m) => { setReportModalFor(m.id); setContextMenuFor(null); };
  const doSelectMultipleFrom = (m) => { setContextMenuFor(null); toggleSelect(m.id); };
  const doReactSingle = (m, emoji) => { reactToMessage(m.id, emoji); setContextMenuFor(null); };

  const doReportMessage = async (reason) => {
    let id = reportModalFor;
    if (id === '__selection__') id = selectedMessages[0]?.id;
    else if (id === '__viewer__') id = messages.find((x) => x.media_url === viewerUrl)?.id;
    setReportModalFor(null);
    cancelSelection();
    if (id) {
      const reportedMsg = findMessageById(id);
      const senderProfile = reportedMsg ? (activeGroup ? ((groupMembers.find((gm) => gm.user_id === reportedMsg.sender_id) || {}).profile || null) : (activeProfile && activeProfile.id === reportedMsg.sender_id ? activeProfile : null)) : null;
      setReportThanks({ profile: senderProfile && senderProfile.id !== session.user.id ? senderProfile : null });
      await supabase.from('message_reports').insert({ reporter_id: session.user.id, message_id: id, reason });
      if (reportedMsg) await sendReportMail(reportedMsg.sender_id, reason);
    }
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
      if (activeProfile) {
        const { data: lastReal } = await supabase.from('messages').select('*')
          .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${activeProfile.id}),and(sender_id.eq.${activeProfile.id},receiver_id.eq.${session.user.id})`)
          .eq('deleted', false).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (lastReal) {
          const preview = lastReal.type === 'text' ? lastReal.content
            : lastReal.type === 'image' ? 'Photo'
            : lastReal.type === 'audio' ? 'Voice message'
            : lastReal.type === 'sticker' ? 'Sticker'
            : lastReal.type === 'system' ? lastReal.content
            : 'Video';
          const [a, b] = pairKey(session.user.id, activeProfile.id);
          await supabase.from('conversations').update({ last_message: preview, last_message_at: lastReal.created_at, last_sender_id: lastReal.sender_id }).eq('user_a', a).eq('user_b', b);
        }
      }
    } else {
      await supabase.from('message_likes').upsert({ message_id: messageId, user_id: session.user.id, emoji }, { onConflict: 'message_id,user_id' });
      if (targetMessage && targetMessage.sender_id !== session.user.id) {
        const destUrl = activeGroup ? `/?group=${activeGroup.id}` : `/?dm=${session.user.id}`;
        notifyUser(targetMessage.sender_id, me.name, `reacted ${emoji} to your message`, destUrl, me.avatar);
      }
      if (activeProfile) upsertConversation(activeProfile.id, `Reacted ${emoji}`, 'text');
    }
    setReactionPickerFor(null);
  };

  const confirmDeleteChat = async () => {
    const target = deleteConvoTarget;
    setDeleteConvoTarget(null);
    if (!target) return;
    hideChatLocally(target.otherProfile.id);
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
      notifyUser(activeProfile.id, 'ZChat', status === 'pending' ? `${me.name} requested to follow you` : `${me.name} started following you`, status === 'pending' ? '/?requests=1' : `/?profile=${session.user.id}`, me.avatar);
    }
    setActiveFollowBusy(false);
  };


  const shareProfileToChats = async (targets, note, link) => {
    const noteText = note ? note.slice(0, MAX_CHARS) : '';
    for (const t of targets) {
      if (t.kind === 'group') {
        await supabase.from('messages').insert({ sender_id: session.user.id, group_id: t.id, type: 'text', content: link });
        if (noteText) await supabase.from('messages').insert({ sender_id: session.user.id, group_id: t.id, type: 'text', content: noteText });
        const { data: mems } = await supabase.from('group_members').select('user_id, muted').eq('group_id', t.id);
        (mems || []).filter((gm) => gm.user_id !== session.user.id && !gm.muted).forEach((gm) => {
          notifyUser(gm.user_id, `${me.name} in ${t.name}`, noteText || 'Shared a profile', `/?group=${t.id}`, me.avatar);
        });
      } else {
        const { data: cardRow } = await sendMessage(session.user.id, t.id, 'text', link, null);
        let noteRow = null;
        if (noteText) noteRow = (await sendMessage(session.user.id, t.id, 'text', noteText, null)).data;
        await upsertConversation(t.id, noteText || link, 'text');
        if (activeProfile && activeProfile.id === t.id) setMessages((prev) => [...prev, ...[cardRow, noteRow].filter(Boolean)]);
        notifyUser(t.id, me.name, noteText || 'Shared a profile', `/?dm=${session.user.id}`, me.avatar);
      }
    }
    loadConversations();
    loadGroups();
  };

  const activitySentRef = useRef({});
  const sendActivity = (kind) => {
    if (!typingChannelRef.current || me?.hide_activity) return;
    const now = Date.now();
    if (now - (activitySentRef.current[kind] || 0) < 1500) return;
    activitySentRef.current[kind] = now;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { from: session.user.id, kind } }).catch?.(() => {});
  };
  const sendTyping = () => sendActivity('typing');

  useEffect(() => {
    let key = null;
    if (activeGroup) key = `typing-group-${activeGroup.id}`;
    else if (activeProfile) { const [a, b] = pairKey(session.user.id, activeProfile.id); key = `typing-${a}-${b}`; }
    if (!key) return undefined;
    const channel = supabase.channel(key);
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (!payload || payload.from === session.user.id) return;
      setActivityFrom({ kind: payload.kind || 'typing', from: payload.from });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setActivityFrom(null), 3200);
    }).subscribe();
    typingChannelRef.current = channel;
    activitySentRef.current = {};
    return () => { supabase.removeChannel(channel); typingChannelRef.current = null; clearTimeout(typingTimeoutRef.current); setActivityFrom(null); };
  }, [activeProfile?.id, activeGroup?.id]);

  const liveActivity = recording ? 'voice' : showStickers ? 'sticker' : null;
  useEffect(() => {
    if (!liveActivity) return undefined;
    sendActivity(liveActivity);
    const t = setInterval(() => sendActivity(liveActivity), 2000);
    return () => clearInterval(t);
  }, [liveActivity, activeProfile?.id, activeGroup?.id]);

  conversationsRef.current = conversations;
  archivedConversationsRef.current = archivedConversations;
  groupMembersRef.current = groupMembers;
  groupsRef.current = groups;
  blockedRef.current = myBlockedIds;
  locksRef.current = myLocks;
  reloadListsRef.current = () => { loadConversations(); loadGroups(); };

  const notifyUser = (userId, title, body, url, icon) => {
    if (!userId || visibleIdsRef.current.has(userId)) return;
    if (url && url.startsWith('/?dm=')) {
      const conv = conversationsRef.current.find((c) => c.otherProfile.id === userId) || archivedConversationsRef.current.find((c) => c.otherProfile.id === userId);
      if (conv && isActiveUntil(conv[conv.user_a === session.user.id ? 'muted_until_b' : 'muted_until_a'])) return;
    }
    if (url && url.startsWith('/?group=') && !/mentioned you|added you/.test(title || '')) {
      const member = groupMembersRef.current.find((gm) => gm.user_id === userId);
      if (member && isActiveUntil(member.notify_muted_until)) return;
    }
    sendPushNotification(userId, title, body, url, icon);
  };

  storyDataRef.current = storyData;
  const showSnack = (text) => {
    setSnack(text);
    clearTimeout(snackTimerRef.current);
    snackTimerRef.current = setTimeout(() => setSnack(''), 2200);
  };

  const loadStories = async () => {
    const myId = session.user.id;
    const { data: fol } = await supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted');
    const { data: fans } = await supabase.from('follows').select('follower_id').eq('following_id', myId).eq('status', 'accepted');
    const iFollowSet = new Set((fol || []).map((r) => r.following_id));
    const followsMeSet = new Set((fans || []).map((r) => r.follower_id));
    const ids = [...new Set([myId, ...iFollowSet, ...followsMeSet])].filter((id) => !myBlockedIds.has(id) && !accountsThatBlockedMe.has(id));
    storyFollowSetRef.current = new Set(ids);
    const { data: rows, error } = await supabase.from('stories').select('*').in('user_id', ids).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true });
    if (error) { setStoryData((prev) => ({ ...prev, ready: true })); return; }
    const byUser = {};
    (rows || []).forEach((s) => { (byUser[s.user_id] = byUser[s.user_id] || []).push(s); });
    const storyIds = (rows || []).map((s) => s.id);
    let seen = new Set();
    let liked = new Set();
    if (storyIds.length) {
      const { data: views } = await supabase.from('story_views').select('story_id').eq('viewer_id', myId).in('story_id', storyIds);
      seen = new Set((views || []).map((v) => v.story_id));
      const { data: likes } = await supabase.from('story_likes').select('story_id').eq('user_id', myId).in('story_id', storyIds);
      liked = new Set((likes || []).map((l) => l.story_id));
    }
    (byUser[myId] || []).forEach((s) => seen.add(s.id));
    const userIds = Object.keys(byUser);
    const profiles = {};
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);
      sanitizeAvatarList(profs, myId).forEach((p) => { profiles[p.id] = p; });
    }
    Object.keys(byUser).forEach((uid) => {
      if (uid === myId) return;
      const owner = profiles[uid];
      const allowed = owner && (owner.is_private ? followsMeSet.has(uid) : iFollowSet.has(uid));
      if (!allowed) delete byUser[uid];
    });
    setStoryData({ byUser, profiles, seen, liked, ready: true });
    if (pendingStoryUserRef.current && byUser[pendingStoryUserRef.current]) {
      const target = pendingStoryUserRef.current;
      pendingStoryUserRef.current = null;
      setTimeout(() => openStoriesFor(target, { byUser, profiles, seen, liked }), 50);
    }
  };
  reloadStoriesRef.current = loadStories;

  const activeStoriesOf = (userId, data = storyData) => (data.byUser[userId] || []).filter((s) => isActiveUntil(s.expires_at));
  const trayUsers = Object.keys(storyData.byUser)
    .filter((id) => id !== session.user.id && activeStoriesOf(id).length && storyData.profiles[id])
    .map((id) => ({ profile: storyData.profiles[id], stories: activeStoriesOf(id) }))
    .sort((a, b) => {
      const ua = a.stories.every((s) => storyData.seen.has(s.id)) ? 1 : 0;
      const ub = b.stories.every((s) => storyData.seen.has(s.id)) ? 1 : 0;
      if (ua !== ub) return ua - ub;
      return new Date(b.stories[b.stories.length - 1].created_at) - new Date(a.stories[a.stories.length - 1].created_at);
    });
  const storyRingFor = (userId) => {
    const list = activeStoriesOf(userId);
    if (!list.length) return 'none';
    return list.every((s) => storyData.seen.has(s.id)) ? 'seen' : 'unseen';
  };

  const openStoriesFor = (userId, dataOverride) => {
    const data = dataOverride || storyDataRef.current || storyData;
    const listFor = (id) => (data.byUser[id] || []).filter((s) => isActiveUntil(s.expires_at));
    if (userId === session.user.id) {
      const mine = listFor(userId);
      if (!mine.length) return;
      setStoryViewer({ key: Date.now(), groupsList: [{ profile: me, stories: mine }], startGroup: 0 });
      return;
    }
    const order = Object.keys(data.byUser).filter((id) => id !== session.user.id && listFor(id).length && data.profiles[id])
      .map((id) => ({ profile: data.profiles[id], stories: listFor(id) }))
      .sort((a, b) => {
        const ua = a.stories.every((s) => data.seen.has(s.id)) ? 1 : 0;
        const ub = b.stories.every((s) => data.seen.has(s.id)) ? 1 : 0;
        if (ua !== ub) return ua - ub;
        return new Date(b.stories[b.stories.length - 1].created_at) - new Date(a.stories[a.stories.length - 1].created_at);
      });
    const start = order.findIndex((g) => g.profile.id === userId);
    if (start < 0) return;
    setStoryViewer({ key: Date.now(), groupsList: order, startGroup: start });
  };

  const markStorySeen = (story) => {
    if (!story || story.user_id === session.user.id) return;
    if (storyDataRef.current && storyDataRef.current.seen.has(story.id)) return;
    setStoryData((prev) => { const seen = new Set(prev.seen); seen.add(story.id); return { ...prev, seen }; });
    supabase.from('story_views').upsert({ story_id: story.id, viewer_id: session.user.id }, { onConflict: 'story_id,viewer_id' }).then(() => {});
  };

  const likeStory = async (story, like) => {
    playUiSound('like');
    setStoryData((prev) => { const liked = new Set(prev.liked); if (like) liked.add(story.id); else liked.delete(story.id); return { ...prev, liked }; });
    if (like) {
      await supabase.from('story_likes').upsert({ story_id: story.id, user_id: session.user.id }, { onConflict: 'story_id,user_id' });
      notifyUser(story.user_id, me.name, 'liked your story', `/?story=${story.user_id}`, me.avatar);
    } else {
      await supabase.from('story_likes').delete().eq('story_id', story.id).eq('user_id', session.user.id);
    }
  };

  const storyMessageFields = (story) => ({ story_id: story.id, story_media_url: story.media_url, story_media_type: story.media_type, story_owner_id: story.user_id });

  const replyToStory = async (story, owner, text) => {
    const row = { sender_id: session.user.id, receiver_id: owner.id, group_id: null, type: 'text', content: text.slice(0, MAX_CHARS), ...storyMessageFields(story) };
    const { data, error } = await supabase.from('messages').insert(row).select().single();
    if (error) { showSnack(friendlyError(error, "Couldn't send your reply. Try again.")); return; }
    if (data && activeProfile && activeProfile.id === owner.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
    await upsertConversation(owner.id, text, 'text');
    notifyUser(owner.id, me.name, `Replied to your story: ${text}`, `/?dm=${session.user.id}`, me.avatar);
    loadConversations();
  };

  const repostStory = async (story, owner) => {
    const mine = (storyData.byUser[session.user.id] || []);
    if (mine.some((s) => s.repost_of === story.id)) return 'already';
    const { data: existing } = await supabase.from('stories').select('id').eq('user_id', session.user.id).eq('repost_of', story.id).gt('expires_at', new Date().toISOString()).limit(1);
    if (existing && existing.length) return 'already';
    playUiSound('repost');
    const { error } = await supabase.from('stories').insert({
      user_id: session.user.id, media_url: story.media_url, media_type: story.media_type, overlay_url: story.overlay_url || null,
      caption: null, mentions: [], repost_of: story.id, repost_label: owner.username,
    });
    if (error) {
      if (/duplicate|unique/i.test(error.message || '')) return 'already';
      showSnack(friendlyError(error, "Couldn't add it to your story. Try again."));
      return 'error';
    }
    notifyUser(owner.id, me.name, 'shared your story to their story', `/?story=${session.user.id}`, me.avatar);
    if (storyFeedRef.current) storyFeedRef.current.send({ type: 'broadcast', event: 'story', payload: { userId: session.user.id } });
    loadStories();
    return 'ok';
  };

  const deleteStory = async (story) => {
    playUiSound('delete');
    setStoryData((prev) => ({ ...prev, byUser: { ...prev.byUser, [story.user_id]: (prev.byUser[story.user_id] || []).filter((s) => s.id !== story.id) } }));
    await supabase.from('stories').delete().eq('id', story.id).eq('user_id', session.user.id);
    if (storyFeedRef.current) storyFeedRef.current.send({ type: 'broadcast', event: 'story', payload: { userId: session.user.id } });
    setStoryData((prev) => ({ ...prev, byUser: { ...prev.byUser, [story.user_id]: (prev.byUser[story.user_id] || []).filter((s) => s.id !== story.id) } }));
    loadStories();
  };

  const postStories = async (outputs, caption, mentions) => {
    setStoryComposer(null);
    if (!outputs.length) return;
    showSnack('Sharing to your story\u2026');
    let firstStory = null;
    for (const item of outputs) {
      const { url, error } = await uploadMedia(item.file, session.user.id);
      if (error || !url) continue;
      let overlayUrl = null;
      if (item.overlayFile) {
        const up = await uploadMedia(item.overlayFile, session.user.id);
        if (!up.error && up.url) overlayUrl = up.url;
      }
      const { data, error: insertError } = await supabase.from('stories').insert({
        user_id: session.user.id, media_url: url, media_type: item.kind === 'video' ? 'video' : 'image', overlay_url: overlayUrl,
        caption: caption || null, mentions: mentions || [],
      }).select().single();
      if (insertError) { showSnack(friendlyError(insertError, "Couldn't share your story. Try again.")); return; }
      if (!firstStory) firstStory = data;
      if (item.url) URL.revokeObjectURL(item.url);
    }
    if (!firstStory) { showSnack("Couldn't share your story. Try again."); return; }
    if (storyFeedRef.current) storyFeedRef.current.send({ type: 'broadcast', event: 'story', payload: { userId: session.user.id } });
    for (const mn of mentions || []) {
      if (mn.kind === 'group') {
        await supabase.from('messages').insert({ sender_id: session.user.id, group_id: mn.id, type: 'text', content: STORY_GROUP_MENTION_TEXT, ...storyMessageFields(firstStory) });
        const { data: mems } = await supabase.from('group_members').select('user_id').eq('group_id', mn.id);
        (mems || []).filter((gm) => gm.user_id !== session.user.id).forEach((gm) => notifyUser(gm.user_id, 'ZChat', `${me.name} mentioned ${mn.label} in their story`, `/?group=${mn.id}`, me.avatar));
      } else if (mn.id !== session.user.id) {
        const { data } = await supabase.from('messages').insert({ sender_id: session.user.id, receiver_id: mn.id, group_id: null, type: 'text', content: STORY_MENTION_TEXT, ...storyMessageFields(firstStory) }).select().single();
        if (data && activeProfile && activeProfile.id === mn.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
        await upsertConversation(mn.id, STORY_MENTION_TEXT, 'text');
        notifyUser(mn.id, 'ZChat', `${me.name} mentioned you in their story`, `/?story=${session.user.id}`, me.avatar);
      }
    }
    showSnack('Shared to your story');
    loadStories();
    loadConversations();
    loadGroups();
  };

  const openStoryRef = async (m) => {
    if (!m || !m.story_id) return;
    const { data: story } = await supabase.from('stories').select('*').eq('id', m.story_id).maybeSingle();
    if (!story || !isActiveUntil(story.expires_at)) { showSnack('This story is no longer available'); return; }
    const owner = story.user_id === session.user.id ? me : (await cachedProfile(story.user_id));
    if (!owner) { showSnack('This story is no longer available'); return; }
    const { data: list } = await supabase.from('stories').select('*').eq('user_id', story.user_id).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true });
    setStoryViewer({ key: Date.now(), groupsList: [{ profile: owner, stories: (list && list.length) ? list : [story] }], startGroup: 0, startStoryId: story.id, detached: true });
  };

  openStoryRefRef.current = openStoryRef;
  const shareStoryToChats = async (targets, story) => {
    const fields = storyMessageFields(story);
    for (const t of targets) {
      if (t.kind === 'group') {
        const { data } = await supabase.from('messages').insert({ sender_id: session.user.id, group_id: t.id, type: 'text', content: STORY_SHARE_TEXT, ...fields }).select().single();
        if (data && activeGroupIdRef.current === t.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      } else {
        const { data } = await supabase.from('messages').insert({ sender_id: session.user.id, receiver_id: t.id, group_id: null, type: 'text', content: STORY_SHARE_TEXT, ...fields }).select().single();
        if (data && activeProfile && activeProfile.id === t.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
        await upsertConversation(t.id, STORY_SHARE_TEXT, 'text');
        notifyUser(t.id, me.name, 'Shared a story with you', `/?dm=${session.user.id}`, me.avatar);
      }
    }
    showSnack(targets.length === 1 ? `Sent to ${targets[0].name.split(' ')[0]}` : `Sent to ${targets.length} chats`);
    loadConversations();
    loadGroups();
  };

  const openStoryMention = async (mn) => {
    setStoryViewer(null);
    if (mn.kind === 'group') {
      const g = groups.find((x) => x.id === mn.id);
      if (g) openGroup(g); else showSnack("You're not in that group");
      return;
    }
    const p = await cachedProfile(mn.id);
    if (p) setProfileOf(p);
  };

  const loadMutuals = async () => {
    const myId = session.user.id;
    const { data: outgoing } = await supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted');
    const { data: incomingRows } = await supabase.from('follows').select('follower_id').eq('following_id', myId).eq('status', 'accepted');
    const iFollow = new Set((outgoing || []).map((r) => r.following_id));
    setMutualIds(new Set((incomingRows || []).map((r) => r.follower_id).filter((id) => iFollow.has(id))));
  };
  followRefreshRef.current = () => { loadMutuals(); loadStories(); };
  const canCall = (profile) => !!profile && profile.id !== session.user.id && !profile.is_deleted && mutualIds.has(profile.id) && !myBlockedIds.has(profile.id) && !blockedByIds.has(profile.id);

  const callEngine = useCallEngine({
    myId: session.user.id,
    myName: me ? me.name : '',
    myAvatar: me ? me.avatar : '',
    snack: (text) => showSnack(text),
    notify: (...args) => notifyUser(...args),
    onDirectEnded: async (c, durationMs, reason) => {
      if (!c.peer) return;
      const kindLabel = c.kind === 'video' ? 'video' : 'voice';
      const status = durationMs > 0 ? 'ok' : reason === 'declined' ? 'declined' : 'missed';
      const payload = `call:${JSON.stringify({ k: kindLabel, s: status, d: Math.round(durationMs / 1000), by: session.user.id })}`;
      const friendly = status === 'ok' ? `${kindLabel === 'video' ? 'Video' : 'Voice'} call \u00b7 ${formatCallDuration(durationMs)}` : `Missed ${kindLabel} call`;
      const { data } = await sendMessage(session.user.id, c.peer.id, 'system', payload, null);
      if (data && activeProfileRefForCalls.current && activeProfileRefForCalls.current.id === c.peer.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      await upsertConversation(c.peer.id, friendly, 'system');
      if (status !== 'ok') notifyUser(c.peer.id, me.name, `Missed ${kindLabel} call`, `/?dm=${session.user.id}`, me.avatar);
      loadConversations();
    },
    onMissed: (c) => {
      const kindLabel = c.kind === 'video' ? 'video' : 'voice';
      if (c.mode === 'group') {
        setInAppToast({ key: `missed-${c.id}`, kind: 'notice', accent: 'missed', isGroupIcon: true, groupAvatar: c.group && c.group.avatar, title: c.group ? c.group.name : 'Group call', preview: { kind: 'callmissed', text: `Missed group ${kindLabel} call` }, action: { type: 'group', group: c.group } });
      } else if (c.peer) {
        setInAppToast({ key: `missed-${c.id}`, kind: 'notice', accent: 'missed', verified: c.peer.verified, title: c.peer.name, avatar: c.peer.avatar, avatarName: c.peer.name, preview: { kind: 'callmissed', text: `Missed ${kindLabel} call` }, action: { type: 'dm', profile: c.peer } });
      }
    },
    onGroupStarted: async (row, group) => {
      const kindLabel = row.kind === 'video' ? 'video' : 'voice';
      const { data } = await supabase.from('messages').insert({ sender_id: session.user.id, group_id: group.id, type: 'system', content: `call:${JSON.stringify({ k: kindLabel, s: 'group', d: 0, by: session.user.id })}` }).select().single();
      if (data && activeGroupIdRef.current === group.id) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
      if (activeGroupIdRef.current === group.id) setActiveGroupCall(row);
      const { data: mems } = await supabase.from('group_members').select('user_id').eq('group_id', group.id);
      (mems || []).filter((gm) => gm.user_id !== session.user.id).forEach((gm) => notifyUser(gm.user_id, group.name, `${me.name} started a ${kindLabel} call`, `/?call=${row.id}`, group.avatar || me.avatar));
    },
  });
  callEngineRef.current = callEngine;
  useEffect(() => {
    if (!me) return undefined;
    try { window.history.replaceState({ zchat: 'root' }, ''); window.history.pushState({ zchat: 'app' }, ''); } catch {}
    const onPop = () => {
      const st = backStateRef.current;
      const closed = st.closeTop && st.closeTop();
      try { window.history.pushState({ zchat: 'app' }, ''); } catch {}
      if (closed) return;
      const now = Date.now();
      if (now - exitHintRef.current < 2500) {
        try { window.history.go(-3); } catch {}
        return;
      }
      exitHintRef.current = now;
      showSnack('Press back again to close ZChat');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [me && me.id]);
  useEffect(() => {
    if (!me) return undefined;
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase.from('user_rewards').select('*').eq('user_id', session.user.id).order('granted_at', { ascending: true });
      if (!alive || error) return;
      setMyRewards(data || []);
    };
    load();
    const ch = supabase.channel('rewards-' + session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_rewards' }, (payload) => {
        const row = payload.new && payload.new.user_id ? payload.new : payload.old;
        if (row && row.user_id && row.user_id !== session.user.id) return;
        load();
      })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [me && me.id]);
  const pendingReward = (myRewards || []).find((r) => !r.seen && rewardActive(r) && (r.kind === 'frame' ? AVATAR_FRAMES[r.reward_key] : CUSTOM_BADGES[r.reward_key])) || null;
  useEffect(() => {
    if (!me) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('purchase') !== 'done') return;
    params.delete('purchase');
    const q = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}`);
    showSnack('Payment received! Your frame unlocks in a few seconds.');
  }, [me && me.id]);
  const equipReward = async (kind, key) => {
    const field = kind === 'frame' ? 'avatar_frame' : 'custom_badge';
    const prevValue = me[field];
    setMe((prev) => (prev ? { ...prev, [field]: key } : prev));
    const { error } = await supabase.from('profiles').update({ [field]: key }).eq('id', session.user.id);
    if (error) { setMe((prev) => (prev ? { ...prev, [field]: prevValue } : prev)); showSnack("Couldn't equip that. Try again."); return false; }
    playUiSound('like');
    return true;
  };
  useEffect(() => {
    if (!me) return undefined;
    let alive = true;
    const markReady = (id) => { if (alive) setRewardReady((prev) => (prev[id] ? prev : { ...prev, [id]: true })); };
    if (pendingReward && pendingReward.kind === 'frame') {
      const id = `frame:${pendingReward.reward_key}`;
      const timer = setTimeout(() => markReady(id), 8000);
      resolveFrameUrl(pendingReward.reward_key).then(() => { clearTimeout(timer); markReady(id); });
    }
    if (pendingReward && pendingReward.kind === 'charm') {
      const id = `charm:${pendingReward.reward_key}`;
      const spec = CUSTOM_BADGES[pendingReward.reward_key];
      const timer = setTimeout(() => markReady(id), 8000);
      cachedAssetUrl(spec.file).then((u) => u || cachedAssetUrl(spec.fallback)).then((u) => {
        if (u) customBadgeUrlCache.set(pendingReward.reward_key, u);
        clearTimeout(timer); markReady(id);
      });
    }
    return () => { alive = false; };
  }, [pendingReward && pendingReward.id]);
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      Object.keys(AVATAR_FRAMES).forEach((k) => { resolveFrameUrl(k); });
      Object.values(CUSTOM_BADGES).forEach((b) => { cachedAssetUrl(b.file).then((u) => { if (!u) cachedAssetUrl(b.fallback); }); });
    };
    const t = setTimeout(() => { if (window.requestIdleCallback) window.requestIdleCallback(warm, { timeout: 4000 }); else warm(); }, 2500);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);
  useEffect(() => {
    const used = new Set();
    if (me && me.avatar_frame) used.add(me.avatar_frame);
    conversations.forEach((c) => { if (c.otherProfile && c.otherProfile.avatar_frame) used.add(c.otherProfile.avatar_frame); });
    used.forEach((k) => { if (AVATAR_FRAMES[k]) resolveFrameUrl(k); });
  }, [me && me.avatar_frame, conversations]);
  useEffect(() => {
    if (!storyViewer || storyViewer.readOnly || storyViewer.detached) return;
    const live = new Set();
    Object.values(storyData.byUser || {}).forEach((list) => (list || []).forEach((s) => live.add(s.id)));
    const next = storyViewer.groupsList
      .map((g) => ({ ...g, stories: g.stories.filter((s) => live.has(s.id)) }))
      .filter((g) => g.stories.length);
    const changed = next.length !== storyViewer.groupsList.length || next.some((g, i) => g.stories.length !== storyViewer.groupsList[i].stories.length);
    if (!changed) return;
    if (!next.length) { setStoryViewer(null); return; }
    setStoryViewer((prev) => (prev ? { ...prev, groupsList: next } : prev));
  }, [storyData]);
  useEffect(() => {
    if (!me || !me.verified || !VERIFIED_TIERS[me.verified]) return;
    if (me.verified_seen === me.verified) return;
    setCelebrateTier(me.verified);
  }, [me && me.verified, me && me.verified_seen]);
  const openHighlight = async (h, owner) => {
    const { data } = await supabase.from('highlight_items').select('*').eq('highlight_id', h.id).order('created_at', { ascending: true });
    if (!data || !data.length) { showSnack('This highlight is empty'); return; }
    const far = new Date(Date.now() + 365 * 86400000).toISOString();
    const items = data.map((it) => ({ id: it.id, user_id: owner.id, media_url: it.media_url, media_type: it.media_type, overlay_url: it.overlay_url, caption: it.caption, mentions: [], created_at: it.created_at, expires_at: far }));
    const { data: likeRows } = await supabase.from('highlight_likes').select('user_id').eq('highlight_id', h.id);
    const likedByMe = (likeRows || []).some((r) => r.user_id === session.user.id);
    setStoryViewer({ key: Date.now(), groupsList: [{ profile: owner, stories: items }], startGroup: 0, readOnly: true, highlight: { id: h.id, ownerId: owner.id, liked: likedByMe, count: (likeRows || []).length } });
  };
  const toggleHighlightLike = async () => {
    const hl = storyViewer && storyViewer.highlight;
    if (!hl) return;
    const nextLiked = !hl.liked;
    setStoryViewer((prev) => (prev && prev.highlight ? { ...prev, highlight: { ...prev.highlight, liked: nextLiked, count: Math.max(0, prev.highlight.count + (nextLiked ? 1 : -1)) } } : prev));
    if (nextLiked) {
      await supabase.from('highlight_likes').upsert({ highlight_id: hl.id, user_id: session.user.id }, { onConflict: 'highlight_id,user_id' });
      if (hl.ownerId !== session.user.id) notifyUser(hl.ownerId, me.name, 'liked your highlight', `/?profile=${session.user.id}`, me.avatar);
    } else {
      await supabase.from('highlight_likes').delete().eq('highlight_id', hl.id).eq('user_id', session.user.id);
    }
  };
  useEffect(() => {
    if (!me) return undefined;
    favoriteSync.userId = me.id;
    const pull = async () => {
      const { data, error } = await supabase.from('sticker_favorites').select('sticker_key').eq('user_id', me.id);
      if (error) return;
      const remote = new Set((data || []).map((r) => r.sticker_key));
      const mergedFlag = `zchat-fav-merged-${me.id}`;
      let alreadyMerged = false;
      try { alreadyMerged = localStorage.getItem(mergedFlag) === '1'; } catch {}
      if (!alreadyMerged) {
        const local = getFavoriteStickerKeys();
        const missing = [...local].filter((k) => !remote.has(k));
        if (missing.length) {
          await supabase.from('sticker_favorites').upsert(missing.map((k) => ({ user_id: me.id, sticker_key: k })), { onConflict: 'user_id,sticker_key' });
          missing.forEach((k) => remote.add(k));
        }
        try { localStorage.setItem(mergedFlag, '1'); } catch {}
      }
      writeFavoriteKeys(remote);
    };
    pull();
    const channel = supabase.channel('favorites-' + me.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sticker_favorites' }, (payload) => {
        const row = payload.new && payload.new.user_id ? payload.new : payload.old;
        if (row && row.user_id && row.user_id !== me.id) return;
        pull();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [me]);
  const callBarShown = !!(callEngine.call && callEngine.call.minimized && callEngine.call.status !== 'ended');
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return undefined;
    const previous = meta.getAttribute('content');
    if (callBarShown) meta.setAttribute('content', '#1FA855');
    return () => { if (callBarShown && previous) meta.setAttribute('content', previous); };
  }, [callBarShown]);
  const activeProfileRefForCalls = useRef(null);
  activeProfileRefForCalls.current = activeProfile;
  const activeGroupResumeRef = useRef(null);
  activeGroupResumeRef.current = activeGroup;
  const hiddenAtRef = useRef(0);
  const resumingRef = useRef(false);
  useEffect(() => {
    if (!me) return undefined;
    const refreshActiveChat = async () => {
      const g = activeGroupResumeRef.current;
      const pr = activeProfileRefForCalls.current;
      const myId = session.user.id;
      let query;
      if (g) query = supabase.from('messages').select('*').eq('group_id', g.id);
      else if (pr) query = supabase.from('messages').select('*').or(`and(sender_id.eq.${myId},receiver_id.eq.${pr.id}),and(sender_id.eq.${pr.id},receiver_id.eq.${myId})`).is('group_id', null);
      else return;
      const { data, error } = await query.order('created_at', { ascending: false }).limit(CHAT_HISTORY_LIMIT);
      if (error || !data) return;
      const same = g
        ? (activeGroupResumeRef.current && activeGroupResumeRef.current.id === g.id)
        : (activeProfileRefForCalls.current && activeProfileRefForCalls.current.id === pr.id);
      if (!same) return;
      const hidden = getHiddenMsgIds();
      const fresh = data.slice().reverse().filter((m) => !hidden.has(m.id));
      const newestServer = fresh.length ? new Date(fresh[fresh.length - 1].created_at).getTime() : 0;
      setMessages((prev) => {
        const ids = new Set(fresh.map((m) => m.id));
        const localNewer = prev.filter((m) => !ids.has(m.id) && new Date(m.created_at).getTime() > newestServer);
        return [...fresh, ...localNewer];
      });
      setLoadingConvo(false);
    };
    const resume = async (force) => {
      if (document.visibilityState !== 'visible') return;
      const awayMs = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
      if (!force && awayMs < 1500) return;
      if (resumingRef.current) return;
      resumingRef.current = true;
      hiddenAtRef.current = 0;
      try {
        try { supabase.auth.startAutoRefresh && supabase.auth.startAutoRefresh(); } catch {}
        const { data: sessData } = await supabase.auth.getSession();
        let current = sessData && sessData.session;
        if (current && current.expires_at && current.expires_at * 1000 - Date.now() < 90 * 1000) {
          const { data: refreshed } = await supabase.auth.refreshSession();
          if (refreshed && refreshed.session) current = refreshed.session;
        }
        try {
          if (current && supabase.realtime && supabase.realtime.setAuth) supabase.realtime.setAuth(current.access_token);
          if (supabase.realtime && supabase.realtime.isConnected && !supabase.realtime.isConnected()) supabase.realtime.connect();
        } catch {}
        if (reloadListsRef.current) reloadListsRef.current();
        loadUnreadCounts();
        if (reloadStoriesRef.current) reloadStoriesRef.current();
        await refreshActiveChat();
        setTimeout(() => {
          if (document.visibilityState !== 'visible') return;
          if (reloadListsRef.current) reloadListsRef.current();
          refreshActiveChat();
        }, 2500);
      } finally {
        resumingRef.current = false;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now();
        try { supabase.auth.stopAutoRefresh && supabase.auth.stopAutoRefresh(); } catch {}
      } else {
        resume(false);
      }
    };
    const onPageShow = (e) => { if (e.persisted) resume(true); };
    const onOnline = () => resume(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('online', onOnline);
    };
  }, [me && me.id]);

  const startDirectCall = (profile, kind) => {
    if (!canCall(profile)) { showSnack('You can call people who follow you back'); return; }
    callEngine.startDirect(profile, kind);
  };
  const startGroupCall = (group, kind) => {
    if (!group) return;
    if (activeGroupCall && activeGroupCall.group_id === group.id) { callEngine.joinGroupCall(activeGroupCall, group); return; }
    callEngine.startGroup(group, kind);
  };
  const callNameFor = (id) => {
    const gm = groupMembers.find((x) => x.user_id === id);
    if (gm && gm.profile) return gm.profile.name;
    const cached = profileCacheRef.current.get(id);
    return cached ? cached.name : 'Member';
  };
  const callAvatarFor = (id) => {
    const gm = groupMembers.find((x) => x.user_id === id);
    if (gm && gm.profile) return gm.profile.avatar;
    const cached = profileCacheRef.current.get(id);
    return cached ? cached.avatar : '';
  };
  const remoteCallIdsKey = callEngine.call ? Object.keys(callEngine.call.remoteStreams || {}).join(',') : '';
  useEffect(() => {
    if (!remoteCallIdsKey) return;
    remoteCallIdsKey.split(',').forEach((id) => {
      if (id && !profileCacheRef.current.has(id) && !groupMembers.some((x) => x.user_id === id)) cachedProfile(id).then(() => setClockTick((n) => n + 1));
    });
  }, [remoteCallIdsKey]);

  handleCallRowRef.current = async (row) => {
    if (!row || row.caller_id === session.user.id) return;
    const age = Date.now() - new Date(row.created_at || Date.now()).getTime();
    if (row.callee_id === session.user.id) {
      if (row.status !== 'ringing' || age > CALL_RING_MS) return;
      if (blockedRef.current.has(row.caller_id) || accountsThatBlockedMe.has(row.caller_id)) return;
      const caller = await cachedProfile(row.caller_id);
      if (caller) callEngineRef.current.incoming(row, caller, null);
    } else if (row.group_id) {
      const g = groupsRef.current.find((x) => x.id === row.group_id);
      if (!g || !['ringing', 'active'].includes(row.status) || age > 3 * 3600000) return;
      if (activeGroupIdRef.current === row.group_id) setActiveGroupCall(row);
      if (row.status !== 'ringing' || age > CALL_RING_MS) return;
      const caller = await cachedProfile(row.caller_id);
      callEngineRef.current.incoming(row, caller || { id: row.caller_id, name: 'Someone', avatar: '' }, g);
    }
  };

  useEffect(() => {
    if (!me) return undefined;
    const channel = supabase.channel('calls-' + me.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'calls' }, (payload) => {
        if (handleCallRowRef.current) handleCallRowRef.current(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'calls' }, (payload) => {
        const row = payload.new;
        if (!row) return;
        if (callEngineRef.current) callEngineRef.current.onRowUpdate(row);
        if (row.group_id && activeGroupIdRef.current === row.group_id) setActiveGroupCall(['ringing', 'active'].includes(row.status) ? row : null);
      })
      .subscribe();
    loadMutuals();
    return () => supabase.removeChannel(channel);
  }, [me]);

  const myConvMuteField = (conv) => (conv.user_a === session.user.id ? 'muted_until_a' : 'muted_until_b');
  const isConvMutedForMe = (conv) => !!conv && isActiveUntil(conv[myConvMuteField(conv)]);
  const setChatMute = async (target, until) => {
    if (!target) return;
    if (target.kind === 'group') {
      const { error } = await supabase.from('group_members').update({ notify_muted_until: until }).eq('group_id', target.id).eq('user_id', session.user.id);
      if (error) { alert(friendlyError(error, "Couldn't change notifications. Try again.")); return; }
      setGroups((prev) => prev.map((g) => (g.id === target.id ? { ...g, mutedUntil: until } : g)));
      setGroupMembers((prev) => prev.map((gm) => (gm.user_id === session.user.id ? { ...gm, notify_muted_until: until } : gm)));
      return;
    }
    const conv = target.conv;
    const field = myConvMuteField(conv);
    const { error } = await supabase.from('conversations').update({ [field]: until }).eq('id', conv.id);
    if (error) { alert(friendlyError(error, "Couldn't change notifications. Try again.")); return; }
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, [field]: until } : c)));
    setArchivedConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, [field]: until } : c)));
  };
  const muteFor = (option) => (option === 'always' ? '2099-12-31T00:00:00.000Z' : new Date(Date.now() + (option === '8h' ? 8 * 3600000 : 7 * 86400000)).toISOString());

  const pinnedMessages = messages.filter((m) => !m.deleted && isActiveUntil(m.pinned_until))
    .sort((a, b) => new Date(b.pinned_at || 0).getTime() - new Date(a.pinned_at || 0).getTime());
  const pinMessage = async (m, days) => {
    const others = pinnedMessages.filter((x) => x.id !== m.id);
    if (others.length >= 3) {
      const oldest = others[others.length - 1];
      const clear = { pinned_until: null, pinned_by: null, pinned_at: null };
      await supabase.from('messages').update(clear).eq('id', oldest.id);
      setMessages((prev) => prev.map((x) => (x.id === oldest.id ? { ...x, ...clear } : x)));
    }
    const patch = { pinned_until: new Date(Date.now() + days * 86400000).toISOString(), pinned_by: session.user.id, pinned_at: new Date().toISOString() };
    const { error } = await supabase.from('messages').update(patch).eq('id', m.id);
    if (error) { alert(friendlyError(error, "Couldn't pin that message. Try again.")); return; }
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
    setPinIndex(0);
    const note = `${me.name} pinned a message`;
    if (activeGroup) {
      await sendGroupMessage('system', note, null);
    } else if (activeProfile) {
      const { data } = await sendMessage(session.user.id, activeProfile.id, 'system', note, null);
      if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
    }
  };
  const unpinMessage = async (m) => {
    const clear = { pinned_until: null, pinned_by: null, pinned_at: null };
    const { error } = await supabase.from('messages').update(clear).eq('id', m.id);
    if (error) { alert(friendlyError(error, "Couldn't unpin that message. Try again.")); return; }
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...clear } : x)));
    setPinIndex(0);
  };

  const searchMatchesFor = (query) => {
    const q = (query || '').trim().toLowerCase();
    if (!q) return [];
    return messages.filter((m) => !m.deleted && m.type !== 'system' && (m.content || '').toLowerCase().includes(q) && !parseProfileLink(m.content));
  };
  const chatSearchMatches = chatSearch ? searchMatchesFor(chatSearch.query) : [];
  const stepSearch = (delta) => {
    if (!chatSearch || !chatSearchMatches.length) return;
    const nextPos = Math.max(0, Math.min(chatSearchMatches.length - 1, chatSearch.pos + delta));
    setChatSearch({ ...chatSearch, pos: nextPos });
    const target = chatSearchMatches[chatSearchMatches.length - 1 - nextPos];
    if (target) jumpToMessage(target.id);
  };
  const changeSearch = (query) => {
    setChatSearch({ query, pos: 0 });
    const found = searchMatchesFor(query);
    if (found.length) jumpToMessage(found[found.length - 1].id);
  };

  const cachedProfile = async (userId) => {
    if (profileCacheRef.current.has(userId)) return profileCacheRef.current.get(userId);
    const { data } = await getProfile(userId);
    const p = data ? sanitizeAvatar(data, session.user.id) : null;
    if (p) profileCacheRef.current.set(userId, p);
    return p;
  };

  const showMessageToast = async (msg) => {
    if (!msg || msg.type === 'system') return;
    const preview = describeMessage(msg);
    if (msg.group_id) {
      const g = groupsRef.current.find((x) => x.id === msg.group_id);
      if (!g) return;
      const sender = await cachedProfile(msg.sender_id);
      setInAppToast({ key: msg.id, kind: 'group', group: g, title: g.name, groupAvatar: g.avatar, avatar: sender?.avatar, frame: sender?.avatar_frame, avatarName: sender?.name || g.name, prefix: `${(sender?.name || 'Someone').split(' ')[0]}: `, preview });
      return;
    }
    const conv = conversationsRef.current.find((c) => c.otherProfile.id === msg.sender_id);
    const profile = conv ? conv.otherProfile : await cachedProfile(msg.sender_id);
    if (!profile) return;
    const locked = conv && locksRef.current[conv.id];
    setInAppToast({ key: msg.id, kind: 'dm', profile, convId: conv ? conv.id : null, title: profile.name, verified: profile.verified, customBadge: profile.custom_badge, avatar: profile.avatar, frame: profile.avatar_frame, avatarName: profile.name, prefix: '', preview: locked ? { kind: 'text', text: 'New message' } : preview });
  };

  const openToast = (toast) => {
    setInAppToast(null);
    setProfileOf(null);
    if (toast.kind === 'notice') {
      const action = toast.action || {};
      if (action.type === 'requests') setShowFollowRequests(true);
      else if (action.type === 'mail') { setMailOpenId(action.id); setShowMail(true); }
      else if (action.type === 'profile') setProfileOf(action.profile);
      else if (action.type === 'group') openGroup(action.group);
      else if (action.type === 'story') openStoriesFor(action.userId);
      else if (action.type === 'dm') openChat(action.profile, null);
      return;
    }
    if (toast.kind === 'group') openGroup(toast.group);
    else openChat(toast.profile, toast.convId);
  };

  const startRowPress = (e, sheet) => {
    const r = rowPressRef.current;
    r.fired = false;
    r.x = e.clientX;
    r.y = e.clientY;
    clearTimeout(r.timer);
    r.timer = setTimeout(() => { r.fired = true; if (navigator.vibrate) navigator.vibrate(12); setRowSheet(sheet); }, 450);
  };
  const moveRowPress = (e) => {
    const r = rowPressRef.current;
    if (Math.abs(e.clientX - r.x) > 8 || Math.abs(e.clientY - r.y) > 8) clearTimeout(r.timer);
  };
  const endRowPress = () => clearTimeout(rowPressRef.current.timer);
  const guardRowClick = (fn) => () => {
    if (rowPressRef.current.fired) { rowPressRef.current.fired = false; return; }
    fn();
  };

  const markChatRead = async (otherId) => {
    await supabase.from('messages').update({ read: true, delivered: true }).eq('sender_id', otherId).eq('receiver_id', session.user.id).eq('read', false);
    loadUnreadCounts();
  };

  const openMediaComposer = (files) => {
    const list = Array.from(files || []).filter((f) => f && ((f.type || '').startsWith('image') || (f.type || '').startsWith('video'))).slice(0, MAX_PHOTOS_PER_SEND);
    if (!list.length || (!activeProfile && !activeGroup)) return;
    setShowAttach(false);
    setShowStickers(false);
    setMediaComposer({ key: Date.now(), files: list });
  };

  const sendMediaItems = async (outputs, caption) => {
    setMediaComposer(null);
    if (!outputs.length || (!activeProfile && !activeGroup)) return;
    const targetProfile = activeProfile;
    const targetGroup = activeGroup;
    setUploading(outputs.length);
    for (let i = 0; i < outputs.length; i++) {
      const item = outputs[i];
      const { url, error } = await uploadMedia(item.file, session.user.id);
      if (!error && url) {
        const captionForThis = i === 0 ? (caption || null) : null;
        let inserted = null;
        if (targetGroup) {
          inserted = await sendGroupMessage(item.kind, captionForThis, url);
        } else {
          const { data } = await sendMessage(session.user.id, targetProfile.id, item.kind, captionForThis, url);
          inserted = data;
          if (data) {
            setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
            notifyUser(targetProfile.id, me.name, captionForThis || (item.kind === 'image' ? 'Photo' : 'Video'), `/?dm=${session.user.id}`, me.avatar);
          }
        }
        if (inserted && item.kind === 'video') {
          if (item.trimStart != null || item.trimEnd != null) {
            const trimPatch = { trim_start: item.trimStart || 0, trim_end: item.trimEnd || null };
            await supabase.from('messages').update(trimPatch).eq('id', inserted.id);
            setMessages((prev) => prev.map((x) => (x.id === inserted.id ? { ...x, ...trimPatch } : x)));
          }
          if (item.overlayFile) {
            const up = await uploadMedia(item.overlayFile, session.user.id);
            if (!up.error && up.url) {
              const { error: overlayError } = await supabase.from('messages').update({ overlay_url: up.url }).eq('id', inserted.id);
              if (!overlayError) setMessages((prev) => prev.map((x) => (x.id === inserted.id ? { ...x, overlay_url: up.url } : x)));
            }
          }
        }
      }
      if (item.url) URL.revokeObjectURL(item.url);
      setUploading((n) => Math.max(0, (typeof n === 'number' ? n : 1) - 1));
    }
    if (targetProfile) await upsertConversation(targetProfile.id, caption || null, outputs[outputs.length - 1].kind);
    setUploading(0);
  };

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
        ? [...conversations.filter(isUnread).map((c) => ({ ...c, __kind: 'dm' })), ...groups.filter((g) => !g.archived && g.unread > 0).map((g) => ({ ...g, __kind: 'group' }))]
            .sort((a, b) => displayListSortByPin(a, b, (x) => (x.__kind === 'dm' ? isPinnedByMe(x) : x.pinned)))
        : [...conversations.map((c) => ({ ...c, __kind: 'dm' })), ...groups.filter((g) => !g.archived).map((g) => ({ ...g, __kind: 'group' }))]
            .sort((a, b) => displayListSortByPin(a, b, (x) => (x.__kind === 'dm' ? isPinnedByMe(x) : x.pinned)));

  const activeWallpaperKey = activeGroup ? activeGroup.wallpaper : (activeConvForBar ? myWallpaper(activeConvForBar) : null);
  const activeNameBarKey = activeGroup ? activeGroup.name_bar : activeConvNameBar;

  return (
    <div id="zapp-root" style={{
      position: 'fixed', left: 0, right: 0, top: viewportBox.height ? viewportBox.offset : 0,
      ...(viewportBox.height ? { height: viewportBox.height } : { bottom: 0 }),
      background: theme.bgGradient, fontFamily: FONT,
      display: 'flex', overflow: 'hidden', boxSizing: 'border-box',
      paddingTop: callBarShown ? 'calc(env(safe-area-inset-top) + 42px)' : 'env(safe-area-inset-top)',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
    }}>
      <GlobalStyle />
      <AssetDownloadBar progress={assetProgress} />
      {showInstallHelp && <InstallAppHelpModal onClose={() => setShowInstallHelp(false)} />}
      <div style={{
        width: isWide ? 360 : (mobileShowChat ? 0 : '100%'), maxWidth: isWide ? 360 : (mobileShowChat ? 0 : '100%'), overflow: 'hidden',
        borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'none',
      }} className="zchat-sidebar-desktop">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {notifPermission === 'default' && pushSupported() && !notifBannerDismissed && (
          <EnableNotificationsBanner inline
            onEnable={async () => { await subscribeToPush(session.user.id, true); if (typeof Notification !== 'undefined') setNotifPermission(Notification.permission); }}
            onDismiss={() => { setNotifBannerDismissed(true); try { sessionStorage.setItem('zchat-notif-banner-dismissed', '1'); } catch {} }} />
        )}
        {notifPermission === 'denied' && !notifBannerDismissed && (
          <NotificationPermissionBanner inline onOpenHelp={() => setShowNotifHelp(true)}
            onDismiss={() => { setNotifBannerDismissed(true); try { sessionStorage.setItem('zchat-notif-banner-dismissed', '1'); } catch {} }} />
        )}
        {!isStandaloneApp && !installBannerDismissed && (
          <InstallAppBanner
            inline
            canInstallDirectly={!!deferredInstallPrompt} onInstallNow={handleInstallNow} onOpenHelp={() => setShowInstallHelp(true)}
            onDismiss={() => { setInstallBannerDismissed(true); try { localStorage.setItem('zchat-install-banner-dismissed', '1'); } catch {} }} />
        )}
        </div>
        <div style={{
          padding: '14px 16px 10px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <ZBrand size={22} showTag />
          <div onClick={() => setProfileOf(me)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', maxWidth: 160 }}>
            <div style={{ textAlign: 'right', minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}<VerifiedBadge tier={me.verified} custom={me.custom_badge} size={11} /></div>
              <div style={{ fontSize: 10, color: theme.teal, fontWeight: 600 }}>Online</div>
              {me.bio && <div style={{ fontSize: 9.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>"{me.bio}"</div>}
            </div>
            <Avatar emoji={me.avatar} name={me.name} frame={me.avatar_frame} size={34} ring />
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
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 14px 12px', flexShrink: 0,
        }}>
          <div onClick={() => setShowMail(true)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Mail size={16} /></div>
            {unreadMailCount > 0 && (
              <div style={{ position: 'absolute', top: -3, right: -3, background: theme.danger, color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 8, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{unreadMailCount > 99 ? '99+' : unreadMailCount}</div>
            )}
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Mail</span>
          </div>
          <div onClick={() => setShowFollowRequests(true)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Bell size={16} /></div>
            {followRequestCount > 0 && (
              <div style={{ position: 'absolute', top: -3, right: -3, background: theme.danger, color: 'white', fontSize: 9, fontWeight: 800, borderRadius: 8, minWidth: 15, height: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{followRequestCount}</div>
            )}
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Requests</span>
          </div>
          <div onClick={() => setShowCreateGroup(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Users size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Group</span>
          </div>
          <div onClick={() => setShowDiscover(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Compass size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Discover</span>
          </div>
          <div onClick={() => setShowArchived(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><Archive size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Archive</span>
          </div>
          <div onClick={() => setShowSettings(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coralDeep }}><SettingsIcon size={16} /></div>
            <span style={{ fontSize: 9, color: theme.muted, fontWeight: 600 }}>Settings</span>
          </div>
        </div>

        <input ref={storyInputRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
          onChange={(e) => {
            const picked = Array.from(e.target.files || []).filter((f) => (f.type || '').startsWith('image') || (f.type || '').startsWith('video')).slice(0, 10);
            e.target.value = '';
            if (picked.length) setStoryComposer({ key: Date.now(), files: picked });
          }} />
        {search.trim().length < 2 && (
          <StoryTray me={me} myStories={activeStoriesOf(session.user.id)} trayUsers={trayUsers} seen={storyData.seen}
            onAdd={() => storyInputRef.current && storyInputRef.current.click()} onOpen={(id) => openStoriesFor(id)} />
        )}

        {search.trim().length >= 2 ? (
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px' }}>
            {results.length === 0 && !searching && <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: theme.muted }}>No one found</div>}
            {results.map((p) => (
              <div key={p.id} onClick={() => { setSearch(''); setResults([]); setProfileOf(p); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 14,
              }}>
                <Avatar emoji={p.avatar} name={p.name} frame={p.avatar_frame} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}<VerifiedBadge tier={p.verified} custom={p.custom_badge} size={12} /></div>
                  <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
                </div>
                <FollowStatusPill theirId={p.id} viewerId={session.user.id} viewerFollowsThem={searchIFollow.has(p.id)} theyFollowViewer={searchFollowsMe.has(p.id)}
                  theirIsPrivate={p.is_private} onChanged={(id, now) => setSearchIFollow((prev) => { const n = new Set(prev); if (now) n.add(id); else n.delete(id); return n; })} />
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
              {(() => {
                const renderRow = (item) => {
                const isGroup = item.__kind === 'group' || (!item.__kind && listFilter === 'groups');
                if (isGroup) {
                  const g = item;
                  const isActive = activeGroup?.id === g.id;
                  return (
                    <div key={'g-' + g.id} onClick={guardRowClick(() => openGroup(g))}
                      onPointerDown={(e) => startRowPress(e, { kind: 'group', group: g })} onPointerMove={moveRowPress} onPointerUp={endRowPress} onPointerLeave={endRowPress} onPointerCancel={endRowPress}
                      onContextMenu={(e) => { e.preventDefault(); endRowPress(); setRowSheet({ kind: 'group', group: g }); }}
                      style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 16,
                      background: isActive ? theme.rowBg : 'transparent', position: 'relative',
                    }}>
                      <GroupAvatar avatar={g.avatar} name={g.name} size={46} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: g.unread ? 800 : 700, fontSize: 14, color: theme.ink, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                            {g.pinned && <Pin_ size={13} />}{g.name}
                          </span>
                          {g.last_message_at && <span style={{ fontSize: 10.5, color: g.unread ? theme.coral : theme.muted, fontWeight: g.unread ? 700 : 400, flexShrink: 0 }}>{formatListTime(g.last_message_at)}</span>}
                        </div>
                        <PreviewLine preview={g.preview || { kind: 'text', text: 'No messages yet' }} prefix={g.previewPrefix} color={g.unread ? theme.ink : theme.muted} weight={g.unread ? 700 : 400} />
                      </div>
                      {isActiveUntil(g.mutedUntil) && <BellOff size={14} color={theme.muted} style={{ flexShrink: 0 }} />}
                      {g.unread > 0 && <div style={{ minWidth: 20, height: 20, padding: '0 5px', boxSizing: 'border-box', borderRadius: 10, background: isActiveUntil(g.mutedUntil) ? theme.muted : theme.coral, color: 'white', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.unread > 99 ? '99+' : g.unread}</div>}
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
                  <div key={'c-' + c.id} onClick={guardRowClick(() => openChat(c.otherProfile, c.id))}
                    onPointerDown={(e) => startRowPress(e, { kind: 'dm', conv: c })} onPointerMove={moveRowPress} onPointerUp={endRowPress} onPointerLeave={endRowPress} onPointerCancel={endRowPress}
                    onContextMenu={(e) => { e.preventDefault(); endRowPress(); setRowSheet({ kind: 'dm', conv: c }); }}
                    style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', cursor: 'pointer', borderRadius: 16,
                    background: isActive ? theme.rowBg : 'transparent', position: 'relative',
                  }}>
                    <div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setAvatarPeek(c); }} style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}>
                      {storyRingFor(c.otherProfile.id) !== 'none'
                        ? <StoryAvatar profile={c.otherProfile} size={50} ring={storyRingFor(c.otherProfile.id)} />
                        : <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} frame={c.otherProfile.avatar_frame} online={isUserOnline(c.otherProfile) && !c.otherProfile.hide_activity} size={46} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: unread ? 800 : 700, fontSize: 14, color: theme.ink, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                          {isPinnedByMe(c) && <Pin_ size={13} />}{c.otherProfile.name}<VerifiedBadge tier={c.otherProfile.verified} custom={c.otherProfile.custom_badge} size={13} />
                        </span>
                        {(c.sortTime || c.last_message_at) && <span style={{ fontSize: 10.5, color: unread ? theme.coral : theme.muted, fontWeight: unread ? 700 : 400, flexShrink: 0 }}>{formatListTime(c.sortTime || c.last_message_at)}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.lastFromMe && c.preview && c.preview.kind !== 'deleted' && c.preview.kind !== 'system' && <StatusTicks status={c.lastMineRead ? 'read' : c.lastMineDelivered ? 'delivered' : 'sent'} />}
                        <PreviewLine preview={c.preview && c.preview.text ? c.preview : { kind: 'text', text: 'Say hi \u{1F44B}' }} color={unread ? theme.ink : theme.muted} weight={unread ? 700 : 400} />
                      </div>
                    </div>
                    {isConvMutedForMe(c) && <BellOff size={14} color={theme.muted} style={{ flexShrink: 0 }} />}
                    {unread && <div style={{ width: 20, height: 20, borderRadius: 10, background: isConvMutedForMe(c) ? theme.muted : theme.coral, color: 'white', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{unreadCounts[c.otherProfile.id]}</div>}
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
                };
                return displayList.map(renderRow);
              })()}
            </div>
          </>
        )}
      </div>

      <div style={{
        flex: 1, display: (isWide || mobileShowChat) ? 'flex' : 'none', flexDirection: 'column', minWidth: 0, minHeight: 0, position: 'relative',
        paddingTop: (activeProfile || activeGroup) ? (isAppleMobile() ? 64 : 74) : 0,
      }} className={mobileShowChat ? 'zchat-chat-panel zchat-panel-open' : 'zchat-chat-panel'}>
        {(activeProfile || activeGroup) ? (
          <>
            <div style={{
              position: 'fixed', top: (viewportBox.height ? viewportBox.offset : 0) + (callBarShown ? 42 : 0), left: isWide ? 'calc(360px + env(safe-area-inset-left))' : 0, right: 0, zIndex: 15,
              borderBottom: activeNameBarKey ? 'none' : `1px solid ${theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
              overflow: 'hidden',
              ...(!isAppleMobile() ? { borderTopLeftRadius: 22, borderTopRightRadius: 22 } : {}),
              transform: 'translateZ(0)',
              ...(activeNameBarKey
                ? (nameBarBgStyle(activeNameBarKey) || {})
                : { background: theme.dark ? 'rgba(10,13,22,0.68)' : 'rgba(255,255,255,0.72)', backdropFilter: 'blur(26px) saturate(180%)', WebkitBackdropFilter: 'blur(26px) saturate(180%)' }),
              boxShadow: activeNameBarKey ? '0 2px 16px rgba(0,0,0,0.28)' : 'none',
            }}>
              {activeNameBarKey && (
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0.26) 75%, rgba(0,0,0,0.12) 100%), linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.2) 100%)',
                }} />
              )}
              <div style={{ height: isAppleMobile() ? 'env(safe-area-inset-top)' : 10, width: '100%' }} />
              <div
                style={{
                  padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10,
                  height: 64, boxSizing: 'border-box',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}
                onClick={() => (activeGroup ? setShowGroupInfo(true) : setProfileOf(activeProfile))}>
              <ArrowLeft size={20} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none', position: 'relative' }}
                onClick={(e) => { e.stopPropagation(); if (activeConvForBar && myLocks[activeConvForBar.id]) lastLeftChatAtRef.current[activeConvForBar.id] = Date.now(); if (activeGroup) markGroupRead(activeGroup.id); if (reloadListsRef.current) reloadListsRef.current(); loadUnreadCounts(); setMobileShowChat(false); setActiveProfile(null); setActiveGroup(null); }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, position: 'relative' }}>
                {activeGroup ? <GroupAvatar avatar={activeGroup.avatar} name={activeGroup.name} size={38} /> : AVATAR_FRAMES[activeProfile.avatar_frame] ? <div style={{ margin: '0 6px' }}><FramedAvatar frame={activeProfile.avatar_frame} size={36}><Avatar emoji={activeProfile.avatar} name={activeProfile.name} frame={activeProfile.avatar_frame} frameFit={false} online={isUserOnline(activeProfile) && !activeProfile.hide_activity} size={36} /></FramedAvatar></div> : <AvatarFrame size={34} tier={activeProfile.verified}><Avatar emoji={activeProfile.avatar} name={activeProfile.name} frame={activeProfile.avatar_frame} online={isUserOnline(activeProfile) && !activeProfile.hide_activity} size={34} /></AvatarFrame>}
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 800, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    color: activeNameBarKey ? 'white' : theme.ink, textShadow: activeNameBarKey ? '0 1px 4px rgba(0,0,0,0.7)' : 'none',
                  }}>
                    {(activeGroup ? !!(groups.find((x) => x.id === activeGroup.id) || {}).pinned : !!(activeConvForBar && isPinnedByMe(activeConvForBar))) && <span style={{ marginRight: 4, display: 'inline-flex', verticalAlign: 'middle' }}><Pin_ size={12} /></span>}
                    {activeGroup ? activeGroup.name : activeProfile.name}
                    {!activeGroup && <VerifiedBadge tier={activeProfile.verified} custom={activeProfile.custom_badge} size={13} />}
                  </div>
                  <div style={{ fontSize: 11, color: activeNameBarKey ? 'rgba(255,255,255,0.85)' : theme.muted, textShadow: activeNameBarKey ? '0 1px 4px rgba(0,0,0,0.7)' : 'none' }}>
                    {activityFrom ? (
                      <span style={{ color: activeNameBarKey ? 'white' : theme.coral, fontWeight: 700 }}>
                        {activeGroup ? `${(groupMembers.find((gm) => gm.user_id === activityFrom.from)?.profile.name || 'Someone').split(' ')[0]} is ` : ''}{activityLabel(activityFrom.kind)}
                      </span>
                    ) : activeGroup ? `${groupMembers.length} members` : (blockedByIds.has(activeProfile.id) || myBlockedIds.has(activeProfile.id) || activeProfile.hide_activity) ? '' : isUserOnline(activeProfile) ? 'Online' : (formatLastSeen(activeProfile.last_seen) || 'Last seen recently')}
                  </div>
                </div>
              </div>
              {!activeGroup && canCall(activeProfile) && (
                <>
                  <Phone size={20} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, position: 'relative', marginRight: 6, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none' }}
                    onClick={(e) => { e.stopPropagation(); startDirectCall(activeProfile, 'voice'); }} />
                  <VideoIcon size={23} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, position: 'relative', marginRight: 6, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none' }}
                    onClick={(e) => { e.stopPropagation(); startDirectCall(activeProfile, 'video'); }} />
                </>
              )}
              {activeGroup && (
                <>
                  <Phone size={20} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, position: 'relative', marginRight: 6, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none' }}
                    onClick={(e) => { e.stopPropagation(); startGroupCall(activeGroup, 'voice'); }} />
                  <VideoIcon size={23} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, position: 'relative', marginRight: 6, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none' }}
                    onClick={(e) => { e.stopPropagation(); startGroupCall(activeGroup, 'video'); }} />
                </>
              )}
              {!activeGroup && activeFollowState !== null && !canCall(activeProfile) && !myBlockedIds.has(activeProfile.id) && !blockedByIds.has(activeProfile.id) && (
                <div style={{ position: 'relative', marginRight: 6 }}>
                  <FollowActionButton size="sm" state={activeFollowState} theyFollowMe={activeFollowerFollowsMe} busy={activeFollowBusy} onDark={!!activeNameBarKey} onClick={toggleActiveFollow} />
                </div>
              )}
              <MoreVertical size={19} style={{ cursor: 'pointer', color: activeNameBarKey ? 'white' : theme.ink, flexShrink: 0, filter: activeNameBarKey ? 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' : 'none', position: 'relative' }}
                onClick={(e) => { e.stopPropagation(); setChatMenuAnchor(e.currentTarget); }} />
              </div>
            </div>

            {chatSearch && (
              <ChatSearchBar query={chatSearch.query} onChange={changeSearch} count={chatSearchMatches.length}
                position={chatSearchMatches.length ? chatSearchMatches.length - Math.min(chatSearch.pos, chatSearchMatches.length - 1) : 0}
                onPrev={() => stepSearch(1)} onNext={() => stepSearch(-1)} onClose={() => setChatSearch(null)} />
            )}
            {activeGroup && activeGroupCall && activeGroupCall.group_id === activeGroup.id && !(callEngine.call && callEngine.call.id === activeGroupCall.id) && (
              <GroupCallBar row={activeGroupCall} onJoin={() => callEngine.joinGroupCall(activeGroupCall, activeGroup)} />
            )}
            {!chatSearch && pinnedMessages.length > 0 && (
              <PinnedMessagesBar pins={pinnedMessages} index={Math.min(pinIndex, pinnedMessages.length - 1)} labelFor={labelForSender}
                onOpen={() => {
                  const idx = Math.min(pinIndex, pinnedMessages.length - 1);
                  jumpToMessage(pinnedMessages[idx].id);
                  setPinIndex((idx + 1) % pinnedMessages.length);
                }} />
            )}

            {selectionMode && (
              <MessageActionBar count={selectedIds.size} canEditActions={selectionInfo} onCancel={cancelSelection}
                onForward={openForward} onDeleteForMe={doDeleteForMe} onDeleteForEveryone={doDeleteForEveryone}
                onReport={() => setReportModalFor('__selection__')} />
            )}

            <div ref={scrollRef} className="zchat-msglist" onScroll={handleChatScroll} style={{
              flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 18px 4px', position: 'relative',
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
                messages.map((m, msgIndex) => {
                  const nextMsg = messages[msgIndex + 1];
                  const tightBelow = !!nextMsg && nextMsg.sender_id === m.sender_id && nextMsg.type !== 'system' && m.type !== 'system';
                  const prevMsg = messages[msgIndex - 1];
                  const tightAbove = !!prevMsg && prevMsg.sender_id === m.sender_id && prevMsg.type !== 'system' && m.type !== 'system' && !prevMsg.deleted;
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
                      onLongPress={() => {
                        if (selectionMode) return;
                        const el = document.getElementById(`msg-${m.id}`);
                        setContextRect(el ? el.getBoundingClientRect() : null);
                        if (navigator.vibrate) navigator.vibrate(15);
                        setContextMenuFor(m.id);
                      }}
                      onDelete={(id) => setPendingQuickDelete(id)}
                      onOpenImage={setViewerUrl} onOpenVideo={setViewerVideoUrl}
                      reactions={messageLikes[m.id]} onReact={(id, emoji) => reactToMessage(id, emoji)}
                      onOpenWhoReacted={(id) => setWhoReactedFor({ messageId: id, reactions: messageLikes[id] || [] })}
                      replyPreview={replyPreview} onSwipeReply={(msg) => { setReplyingTo(msg); setEditingMessage(null); focusComposer(); }}
                      onJumpToMessage={jumpToMessage} highlighted={highlightedMsgId === m.id}
                      senderLabel={showSenderLabel ? memberName(m.sender_id) : null}
                      senderVerified={showSenderLabel ? ((groupMembers.find((gm) => gm.user_id === m.sender_id) || {}).profile || {}).verified : null}
                      senderAvatar={showSenderLabel ? groupMembers.find((gm) => gm.user_id === m.sender_id)?.profile.avatar : null}
                      senderFrame={showSenderLabel ? ((groupMembers.find((gm) => gm.user_id === m.sender_id) || {}).profile || {}).avatar_frame : null}
                      senderCustomBadge={showSenderLabel ? ((groupMembers.find((gm) => gm.user_id === m.sender_id) || {}).profile || {}).custom_badge : null}
                      hideReadStatus={!!activeGroup}
                      onOpenSenderProfile={showSenderLabel ? () => { const p = groupMembers.find((gm) => gm.user_id === m.sender_id)?.profile; if (p) setProfileOf(p); } : null}
                      canModerate={activeGroup ? (groupMembers.find((gm) => gm.user_id === session.user.id)?.role === 'admin') : false}
                      onOpenMention={(p) => setProfileOf(sanitizeAvatar(p, session.user.id))}
                      mentionsMe={!!activeGroup && !isMe && !m.deleted && m.type === 'text' && extractMentions(m.content).has((me.username || '').toLowerCase())}
                      onOpenStoryRef={openStoryRef}
                      tightBelow={tightBelow}
                      tightAbove={tightAbove}
                      onCallBack={(kind) => { if (activeGroup) startGroupCall(activeGroup, kind); else if (activeProfile) startDirectCall(activeProfile, kind); }}
                      onOpenSticker={(msg) => setStickerSheetFor(msg)}
                      onOpenPost={(post, owner) => setDeepPost({ post, owner: sanitizeAvatar(owner, session.user.id) })}
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
                    {(editingMessage || replyingTo).type === 'text' ? (editingMessage || replyingTo).content : (editingMessage || replyingTo).type === 'image' ? 'Photo' : (editingMessage || replyingTo).type === 'audio' ? 'Voice message' : (editingMessage || replyingTo).type === 'sticker' ? 'Sticker' : (editingMessage || replyingTo).type === 'system' ? 'Message' : 'Video'}
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

            {composerMention && !recording && !activeProfile?.is_deleted && (
              <div style={{ padding: '6px 14px 2px', flexShrink: 0 }}>
                <MentionSuggestions
                  query={composerMention.query}
                  myId={session.user.id}
                  priority={activeGroup ? groupMembers.map((gm) => gm.profile) : (activeProfile ? [activeProfile] : [])}
                  excludeIds={[session.user.id, ...myBlockedIds]}
                  onPick={pickComposerMention}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '6px 14px', flexShrink: 0, position: 'relative', paddingBottom: keyboardOpen ? 6 : 'max(6px, calc(env(safe-area-inset-bottom) - 24px))' }}>
              {activeProfile && !activeGroup && myBlockedIds.has(activeProfile.id) ? (
                <div className="zchat-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '8px 4px 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: theme.ink, fontWeight: 700 }}><Ban size={15} color={theme.danger} /> You blocked {activeProfile.name}</div>
                  <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center' }}>You can't message or call them while they're blocked.</div>
                  <button onClick={() => setUnblockConfirmFor(activeProfile)} style={{ padding: '9px 26px', borderRadius: 14, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT }}>Unblock</button>
                </div>
              ) : activeProfile && !activeGroup && blockedByIds.has(activeProfile.id) ? (
                <div className="zchat-fade" style={{ flex: 1, textAlign: 'center', padding: '12px 4px', fontSize: 12.5, color: theme.muted, fontWeight: 600 }}>
                  You can't reply to this conversation. This account isn't available.
                </div>
              ) : activeProfile?.is_deleted ? (
                <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', fontSize: 12.5, color: theme.muted, fontWeight: 600 }}>
                  This account no longer exists. You can't send new messages here.
                </div>
              ) : (recording && recordLocked) ? (
                <div className="zchat-fade" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div role="button" aria-label="Delete recording" onClick={cancelRecording} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.danger, flexShrink: 0 }}><Trash2 size={20} /></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: theme.inputBg, borderRadius: 22, padding: '10px 16px', border: `1px solid ${theme.border}` }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30', animation: 'zchat-love-pulse 1s infinite' }} />
                    <span style={{ fontSize: 14, color: theme.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 18, overflow: 'hidden' }}>
                      {voiceBars(`live-${recordSeconds}`, 22).map((b, i) => <div key={i} style={{ flex: 1, height: `${Math.round(b * 100)}%`, borderRadius: 2, background: theme.coral, opacity: 0.75 }} />)}
                    </div>
                  </div>
                  <div role="button" aria-label="Send voice message" onClick={() => { setRecordLocked(false); stopRecording(); }} style={{ width: 44, height: 44, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Send size={18} color="white" style={{ marginLeft: -1 }} /></div>
                </div>
              ) : (
                <>
                  {recording ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 6px 0 12px', overflow: 'hidden' }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30', animation: 'zchat-love-pulse 1s infinite', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: theme.ink, fontWeight: 700, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: theme.muted, fontSize: 13.5, fontWeight: 600, transform: `translateX(${recordDragX}px)`, opacity: Math.max(0.2, 1 + recordDragX / 140), whiteSpace: 'nowrap' }}>
                        <ChevronLeft size={16} /> Slide to cancel
                      </div>
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
                    onChange={(e) => { const next = e.target.value.slice(0, MAX_CHARS); setDraft(next); setComposerMention(getActiveMention(next, Math.min(e.target.selectionStart, next.length))); sendTyping(); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'; }}
                    onClick={(e) => setComposerMention(getActiveMention(e.target.value, e.target.selectionStart))}
                    onPaste={(e) => {
                      const pasted = Array.from((e.clipboardData && e.clipboardData.files) || []).filter((f) => (f.type || '').startsWith('image') || (f.type || '').startsWith('video'));
                      if (pasted.length) { e.preventDefault(); openMediaComposer(pasted); }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !isTouchDevice()) { e.preventDefault(); if (editingMessage) saveEdit(); else send(); } }}
                    placeholder={editingMessage ? 'Edit message' : 'Message'}
                    rows={1}
                    style={{
                      flex: 1, resize: 'none', maxHeight: 148, minHeight: 38, boxSizing: 'border-box', padding: '9px 14px', borderRadius: composerTall ? 18 : 20,
                      wordBreak: 'break-word',
                      border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink,
                      fontFamily: FONT, fontSize: 15, outline: 'none', lineHeight: 1.35,
                    }}
                  />
                  </>
                  )}
                  {(!recording && (draft.trim() || pendingMedia.length > 0)) ? (
                    <div onPointerDown={(e) => e.preventDefault()} onMouseDown={(e) => e.preventDefault()} onClick={() => { if (!editingMessage) playUiSound('send'); (editingMessage ? saveEdit : send)(); }} style={{
                      width: 40, height: 40, borderRadius: '50%', background: theme.coral, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    }}><Send size={17} color="white" style={{ marginLeft: -1 }} /></div>
                  ) : (
                    <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                      {recording && (
                        <div className="zchat-fade" style={{ position: 'absolute', left: '50%', bottom: 62, transform: 'translateX(-50%)', width: 36, padding: '8px 0', borderRadius: 18, background: theme.panelBg, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: theme.muted, boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                          <Lock size={15} />
                          <ChevronLeft size={14} style={{ transform: 'rotate(90deg)' }} />
                        </div>
                      )}
                      <div
                        role="button" aria-label="Hold to record"
                        onPointerDown={onMicDown}
                        onPointerMove={onMicMove}
                        onPointerUp={onMicUp}
                        onPointerCancel={onMicUp}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          position: 'absolute', left: '50%', top: '50%', width: 40, height: 40, borderRadius: '50%', background: theme.coral, display: 'flex',
                          alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'none', userSelect: 'none',
                          transform: `translate(-50%, -50%) scale(${recording ? 1.55 : 1})`, transition: 'transform 0.18s cubic-bezier(0.2, 0.9, 0.3, 1.3)',
                          boxShadow: recording ? `0 0 0 8px ${theme.coral}33` : 'none', zIndex: 2,
                        }}><Mic size={17} color="white" /></div>
                    </div>
                  )}
                </>
              )}
            </div>

            {showJumpButton && !selectionMode && (
              <JumpToLatestButton count={newBelowCount} bottom={pendingMedia.length ? 150 : (replyingTo || editingMessage) ? 118 : 72} onClick={() => scrollChatToBottom(true)} />
            )}

            {uploading > 0 && (
              <div style={{ position: 'absolute', bottom: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 11, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderRadius: 20, background: theme.panelBg, border: `1px solid ${theme.border}`, boxShadow: '0 6px 18px rgba(0,0,0,0.2)', fontSize: 12, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap' }} className="zchat-fade">
                <Spinner size={12} color={theme.coral} />
                {uploading > 1 ? `Sending ${uploading} items\u2026` : 'Sending\u2026'}
              </div>
            )}

            {showAttach && (
              <div style={{ position: 'absolute', bottom: 76, left: 14, zIndex: 12, display: 'flex', gap: 10 }} className="zchat-fade">
                <div role="button" aria-label="Camera" onClick={() => { setShowAttach(false); setCameraOpen(true); }} style={{
                  width: 52, height: 52, borderRadius: '50%', background: '#111827', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}><Camera size={21} color="white" /></div>
                <label style={{
                  width: 52, height: 52, borderRadius: '50%', background: theme.coral, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}>
                  <ImageIcon size={20} color="white" />
                  <input ref={cameraGalleryRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFile} />
                </label>
                <label style={{
                  width: 52, height: 52, borderRadius: '50%', background: theme.coralDeep, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                }}>
                  <VideoIcon size={20} color="white" />
                  <input type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFile} />
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
          onReport={handleReport} onSaved={(updated) => { setProfileOf({ ...updated, email: me.email }); if (updated.id === me.id) setMe((prev) => ({ ...prev, ...updated, email: prev.email })); }}
          onOpenSettings={() => { setProfileOf(null); setShowSettings(true); }}
          onOpenProfile={(p) => setProfileOf(p)}
          onMessage={(p) => { openChat(p, null); setProfileOf(null); }}
          isBlocked={myBlockedIds.has(profileOf.id)} onBlock={() => setBlockConfirmFor(profileOf)} onUnblock={() => setUnblockConfirmFor(profileOf)}
          shareConversations={conversations} shareGroups={groups.filter((g) => !g.archived)} onShareToChats={shareProfileToChats}
          canCall={canCall(profileOf)} onCall={(kind) => { const target = profileOf; setProfileOf(null); startDirectCall(target, kind); }}
          onOpenHighlight={openHighlight} meProfile={me} onOpenCollection={() => setCollectionOpen(true)}
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
          onOpenBlocked={() => setShowBlockedList(true)} blockedCount={myBlockedIds.size}
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
        const cloneSender = activeGroup && !isMine;
        const cloneReply = m.reply_to_id ? (() => { const rm = findMessageById(m.reply_to_id); return rm ? { ...rm, senderLabel: labelForSender(rm.sender_id) } : null; })() : null;
        const noop = () => {};
        return (
          <MessageContextMenu
            message={m} isMine={isMine} anchorRect={contextRect}
            bubble={(
              <MessageBubble m={m} isMe={isMine} selectionMode={false} selected={false} onToggleSelect={noop} onLongPress={noop} onDelete={noop}
                onOpenImage={noop} onOpenVideo={noop} reactions={messageLikes[m.id]} onReact={noop} onOpenWhoReacted={noop}
                replyPreview={cloneReply} onSwipeReply={noop} onJumpToMessage={noop} highlighted={false}
                senderLabel={cloneSender ? memberName(m.sender_id) : null}
                senderAvatar={cloneSender ? groupMembers.find((gm) => gm.user_id === m.sender_id)?.profile.avatar : null}
                hideReadStatus={!!activeGroup} onOpenSenderProfile={null} canModerate={false} onOpenMention={noop} mentionsMe={false} />
            )}
            onSave={() => { silentDownload(m.media_url, m.type === 'video' ? 'zchat-video.mp4' : 'zchat-photo.jpg'); setContextMenuFor(null); }}
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
            isPinned={isActiveUntil(m.pinned_until)}
            onPin={() => { setContextMenuFor(null); setPinSheetFor(m); }}
            onUnpin={() => { setContextMenuFor(null); unpinMessage(m); }}
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
        <ReportReasonPicker onCancel={() => setReportModalFor(null)} onSubmit={doReportMessage} />
      )}
      {deleteConvoTarget && (
        <DeleteChatConfirm name={deleteConvoTarget.otherProfile.name} onCancel={() => setDeleteConvoTarget(null)} onConfirm={confirmDeleteChat} />
      )}
      {whoReactedFor && (
        <WhoReactedModal reactions={whoReactedFor.reactions} myId={session.user.id} onClose={() => setWhoReactedFor(null)}
          onRemoveMine={(emoji) => reactToMessage(whoReactedFor.messageId, emoji)} />
      )}
      {viewerUrl && (
        <ImageViewer url={viewerUrl} onClose={() => setViewerUrl(null)} onForward={() => { openForward(); }} onReport={() => setReportModalFor('__viewer__')} />
      )}
      {viewerVideoUrl && (
        <VideoViewer url={viewerVideoUrl.url} trimStart={viewerVideoUrl.trimStart} trimEnd={viewerVideoUrl.trimEnd} overlayUrl={viewerVideoUrl.overlayUrl} onClose={() => setViewerVideoUrl(null)} onForward={() => { setViewerVideoUrl(null); openForward(); }} />
      )}
      {showArchived && (
        <ArchivedChatsPanel conversations={archivedConversations} onClose={() => setShowArchived(false)}
          onOpenChat={(c) => { setShowArchived(false); openChat(c.otherProfile, c.id); }}
          onUnarchive={(id) => toggleArchive(id, false)} />
      )}
      {showMail && (
        <MailPanel myId={session.user.id} initialMailId={mailOpenId} onClose={() => { setShowMail(false); setMailOpenId(null); loadUnreadMailCount(); }} />
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
          onUnlock={() => { const { profile, convId } = lockPromptFor; setUnlockedChats((prev) => new Set(prev).add(convId)); setLockPromptFor(null); actuallyOpenChat(profile, convId); }} />
      )}
      {deletedAccountAlertFor && (
        <AccountGoneModal name={deletedAccountAlertFor} onOk={() => { setDeletedAccountAlertFor(null); setMobileShowChat(false); loadConversations(); }} />
      )}
      {showNotifHelp && <NotificationHelpModal onClose={() => setShowNotifHelp(false)} />}
      {mediaComposer && (
        <MediaComposer key={mediaComposer.key} files={mediaComposer.files}
          recipientName={activeGroup ? activeGroup.name : activeProfile ? activeProfile.name : ''}
          onActivity={sendActivity}
          onCancel={() => setMediaComposer(null)}
          onSend={sendMediaItems} />
      )}
      {inAppToast && (
        <InAppMessageToast toast={inAppToast} top={`calc(8px + env(safe-area-inset-top) + ${viewportBox.offset || 0}px)`}
          onOpen={() => openToast(inAppToast)} onDismiss={() => setInAppToast(null)} />
      )}
      {rowSheet && rowSheet.kind === 'dm' && (() => {
        const c = rowSheet.conv;
        const blocked = myBlockedIds.has(c.otherProfile.id);
        return (
          <ChatRowSheet title={<>{c.otherProfile.name}<VerifiedBadge tier={c.otherProfile.verified} custom={c.otherProfile.custom_badge} size={13} /></>} subtitle={`@${c.otherProfile.username}`}
            avatar={<Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} frame={c.otherProfile.avatar_frame} size={44} />}
            onClose={() => setRowSheet(null)}
            actions={[
              { icon: <Pin_ size={18} />, label: isPinnedByMe(c) ? 'Unpin chat' : 'Pin chat', onClick: () => togglePin(c) },
              isUnread(c) ? { icon: <CheckCheck size={18} />, label: 'Mark as read', onClick: () => markChatRead(c.otherProfile.id) } : null,
              { icon: <Archive size={18} />, label: 'Archive chat', onClick: () => toggleArchive(c.id, true) },
              { icon: <User size={18} />, label: 'View profile', onClick: () => setProfileOf(c.otherProfile) },
              canCall(c.otherProfile) ? { icon: <Phone size={18} />, label: 'Voice call', onClick: () => startDirectCall(c.otherProfile, 'voice') } : null,
              canCall(c.otherProfile) ? { icon: <VideoIcon size={18} />, label: 'Video call', onClick: () => startDirectCall(c.otherProfile, 'video') } : null,
              { icon: <Ban size={18} />, label: blocked ? 'Unblock' : 'Block', onClick: () => (blocked ? setUnblockConfirmFor(c.otherProfile) : setBlockConfirmFor(c.otherProfile)), danger: !blocked },
              { icon: <Flag size={18} />, label: 'Report', onClick: () => setReportUserTarget(c.otherProfile), danger: true },
              { icon: <Trash2 size={18} />, label: 'Delete chat', onClick: () => setDeleteConvoTarget(c), danger: true },
            ]} />
        );
      })()}
      {rowSheet && rowSheet.kind === 'group' && (() => {
        const g = rowSheet.group;
        return (
          <ChatRowSheet title={g.name} subtitle="Group"
            avatar={<GroupAvatar avatar={g.avatar} name={g.name} size={44} />}
            onClose={() => setRowSheet(null)}
            actions={[
              { icon: <Pin_ size={18} />, label: g.pinned ? 'Unpin group' : 'Pin group', onClick: () => toggleGroupPin(g) },
              g.unread > 0 ? { icon: <CheckCheck size={18} />, label: 'Mark as read', onClick: () => { markGroupRead(g.id); setGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, unread: 0 } : x))); } } : null,
              { icon: <Archive size={18} />, label: 'Archive group', onClick: () => toggleGroupArchive(g) },
              { icon: <Users size={18} />, label: 'Group info', onClick: async () => { await openGroup(g); setShowGroupInfo(true); } },
              { icon: <Phone size={18} />, label: 'Group voice call', onClick: async () => { await openGroup(g); startGroupCall(g, 'voice'); } },
              { icon: <VideoIcon size={18} />, label: 'Group video call', onClick: async () => { await openGroup(g); startGroupCall(g, 'video'); } },
              { icon: <LogOut size={18} />, label: 'Leave group', onClick: () => leaveGroupById(g), danger: true },
            ]} />
        );
      })()}
      {storyShareFor && (
        <StoryShareSheet story={storyShareFor.story} owner={storyShareFor.owner}
          conversations={conversations.filter((c) => !myBlockedIds.has(c.otherProfile.id) && !blockedByIds.has(c.otherProfile.id))} groups={groups.filter((g) => !g.archived)}
          onClose={() => setStoryShareFor(null)} onSend={(targets) => shareStoryToChats(targets, storyShareFor.story)} />
      )}
      {blockConfirmFor && (
        <BlockConfirmSheet profile={blockConfirmFor} onCancel={() => setBlockConfirmFor(null)}
          onConfirm={async () => { const p = blockConfirmFor; const ok = await blockUser(p); setBlockConfirmFor(null); if (ok) showSnack(`You blocked ${p.name}`); }} />
      )}
      {unblockConfirmFor && (
        <UnblockConfirmSheet profile={unblockConfirmFor} onCancel={() => setUnblockConfirmFor(null)}
          onConfirm={async () => { const p = unblockConfirmFor; const ok = await unblockUser(p); setUnblockConfirmFor(null); if (ok) showSnack(`You unblocked ${p.name}`); }} />
      )}
      {showBlockedList && (
        <BlockedAccountsPanel myId={session.user.id} blockedIds={myBlockedIds} onClose={() => setShowBlockedList(false)}
          onUnblock={(p) => setUnblockConfirmFor(p)} onOpenProfile={(p) => setProfileOf(p)} />
      )}
      {callEngine.call && (
        <CallScreen call={callEngine.call} me={me} nameFor={callNameFor} avatarFor={callAvatarFor}
          onAccept={callEngine.accept} onDecline={callEngine.decline} onHangup={callEngine.hangup}
          onToggleMute={callEngine.toggleMute} onToggleCamera={callEngine.toggleCamera} onFlip={callEngine.flipCamera}
          onMinimize={() => callEngine.minimize(true)} onMuteOther={callEngine.muteOther}
          onCloseSummary={callEngine.dismissSummary} onShareScreen={callEngine.toggleScreenShare}
          onCallAgain={callEngine.call.mode === 'direct' && callEngine.call.peer && canCall(callEngine.call.peer) ? (kind) => { const peer = callEngine.call.peer; callEngine.dismissSummary(); setTimeout(() => startDirectCall(peer, kind), 60); } : null}
          onMessage={() => {
            const c = callEngine.call;
            callEngine.dismissSummary();
            if (c.mode === 'group' && c.group) openGroup(c.group); else if (c.peer) openChat(c.peer, null);
          }} />
      )}
      {callEngine.call && callEngine.call.minimized && callEngine.call.status !== 'ended' && (
        <CallMiniBar call={callEngine.call}
          remoteVideo={(() => {
            const c = callEngine.call;
            if (c.mode !== 'direct' || c.kind !== 'video' || !c.peer) return null;
            const stream = (c.remoteStreams || {})[c.peer.id];
            if (!stream || !stream.getVideoTracks().length || (c.remoteCameraOff || {})[c.peer.id]) return null;
            return stream;
          })()}
          onOpen={() => callEngine.minimize(false)} onHangup={callEngine.hangup} />
      )}
      {newVersionAvailable && !updateLater && (
        <UpdateAvailableBanner
          onLater={() => setUpdateLater(true)}
          onUpdate={async () => {
            try {
              if ('serviceWorker' in navigator) { const reg = await navigator.serviceWorker.getRegistration(); if (reg) await reg.update(); }
              if (window.caches && caches.keys) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
            } catch {}
            window.location.reload();
          }} />
      )}
      {reportThanks && (
        <ReportThanksSheet profile={reportThanks.profile} isBlocked={!!(reportThanks.profile && myBlockedIds.has(reportThanks.profile.id))}
          onBlock={(p) => setBlockConfirmFor(p)} onClose={() => setReportThanks(null)} />
      )}
      {cameraOpen && (
        <CameraCapture onClose={() => setCameraOpen(false)}
          onPickGallery={() => { setCameraOpen(false); if (cameraGalleryRef.current) cameraGalleryRef.current.click(); }}
          onCapture={(file) => { setCameraOpen(false); openMediaComposer([file]); }} />
      )}
      {deepPost && (
        <PostViewer post={deepPost.post} owner={deepPost.owner} userId={session.user.id} meProfile={me}
          onClose={() => setDeepPost(null)} onDeleted={() => setDeepPost(null)} />
      )}
      {!celebrateTier && me && pendingReward && rewardReady[`${pendingReward.kind}:${pendingReward.reward_key}`] && (
        <RewardCelebration kind={pendingReward.kind === 'frame' ? 'frame' : 'badge'} rewardKey={pendingReward.reward_key} me={me}
          onClaim={async () => {
            const reward = pendingReward;
            setMyRewards((prev) => prev.map((r) => (r.id === reward.id ? { ...r, seen: true } : r)));
            await supabase.from('user_rewards').update({ seen: true }).eq('id', reward.id);
            await equipReward(reward.kind, reward.reward_key);
          }} />
      )}
      {collectionOpen && me && (
        <CollectionPanel me={me} rewards={myRewards} userEmail={session.user.email} onClose={() => setCollectionOpen(false)} onEquip={equipReward} />
      )}
      {celebrateTier && (
        <VerifiedCelebration tier={celebrateTier} name={me.name}
          onClose={async () => {
            const tier = celebrateTier;
            setCelebrateTier(null);
            setMe((prev) => (prev ? { ...prev, verified_seen: tier } : prev));
            await supabase.from('profiles').update({ verified_seen: tier }).eq('id', session.user.id);
          }} />
      )}
      {stickerSheetFor && (
        <StickerPreviewSheet message={stickerSheetFor} isMine={stickerSheetFor.sender_id === session.user.id}
          onClose={() => setStickerSheetFor(null)} onReport={() => doReportSingle(stickerSheetFor)} />
      )}
      {storyComposer && (
        <MediaComposer key={storyComposer.key} files={storyComposer.files} mode="story" myId={session.user.id}
          mentionGroups={groups} onCancel={() => setStoryComposer(null)} onSend={postStories} />
      )}
      {storyViewer && (
        <StoryViewer key={storyViewer.key} groupsList={storyViewer.groupsList} startGroup={storyViewer.startGroup} startStoryId={storyViewer.startStoryId} readOnly={!!storyViewer.readOnly}
          highlightLike={storyViewer.highlight ? { liked: storyViewer.highlight.liked, count: storyViewer.highlight.count, onToggle: toggleHighlightLike } : null}
          myId={session.user.id} seen={storyData.seen} liked={storyData.liked}
          onSeen={markStorySeen} onClose={() => setStoryViewer(null)} onLike={likeStory} onReply={replyToStory} onRepost={repostStory}
          initialRepostedIds={(storyData.byUser[session.user.id] || []).map((s) => s.repost_of).filter(Boolean)}
          onDelete={deleteStory} onReport={(p) => { setStoryViewer(null); setReportUserTarget(p); }}
          onAddStory={() => { setStoryViewer(null); if (storyInputRef.current) storyInputRef.current.click(); }}
          onShare={(story, owner) => setStoryShareFor({ story, owner })} externalPause={!!storyShareFor}
          onOpenProfile={(p) => { setStoryViewer(null); setProfileOf(p); }} onOpenMention={openStoryMention} />
      )}
      {avatarPeek && (() => {
        const c = avatarPeek;
        const ring = storyRingFor(c.otherProfile.id);
        return (
          <AvatarPeek profile={c.otherProfile} online={isUserOnline(c.otherProfile) && !c.otherProfile.hide_activity}
            lastSeen={!c.otherProfile.hide_activity ? formatLastSeen(c.otherProfile.last_seen) : null}
            hasStory={ring !== 'none'} storySeen={ring === 'seen'} onClose={() => setAvatarPeek(null)}
            canCall={canCall(c.otherProfile)} onCall={() => startDirectCall(c.otherProfile, 'voice')}
            onMessage={() => openChat(c.otherProfile, c.id)} onProfile={() => setProfileOf(c.otherProfile)} onStory={() => openStoriesFor(c.otherProfile.id)} />
        );
      })()}
      {snack && (
        <div className="zchat-pop" style={{ position: 'fixed', left: '50%', bottom: 'calc(150px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 320, background: theme.ink, color: theme.panelBg, padding: '10px 16px', borderRadius: 22, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>{snack}</div>
      )}
      {chatMenuAnchor && (activeProfile || activeGroup) && (() => {
        const groupRow = activeGroup ? (groups.find((x) => x.id === activeGroup.id) || activeGroup) : null;
        const mutedUntil = activeGroup ? groupRow?.mutedUntil : (activeConvForBar ? activeConvForBar[myConvMuteField(activeConvForBar)] : null);
        const muteTarget = activeGroup ? { kind: 'group', id: activeGroup.id } : (activeConvForBar ? { kind: 'dm', conv: activeConvForBar } : null);
        const blocked = activeProfile ? myBlockedIds.has(activeProfile.id) : false;
        const close = () => setChatMenuAnchor(null);
        const item = (icon, label, onClick, danger, hint) => (
          <div key={label} onClick={() => { close(); onClick(); }} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: danger ? theme.danger : theme.ink, borderTop: `1px solid ${theme.border}`,
          }}>
            <span style={{ display: 'flex', color: danger ? theme.danger : theme.muted }}>{icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              {label}
              {hint && <span style={{ display: 'block', fontSize: 11, color: theme.muted, fontWeight: 500 }}>{hint}</span>}
            </span>
          </div>
        );
        const items = activeGroup ? [
          item(<Users size={17} />, 'Group info', () => setShowGroupInfo(true)),
          item(<Search size={17} />, 'Search', () => setChatSearch({ query: '', pos: 0 })),
          item(<ImageIcon size={17} />, 'Media, links and voice', () => setShowChatMedia(true)),
          item(<Phone size={17} />, activeGroupCall ? 'Join voice call' : 'Group voice call', () => startGroupCall(activeGroup, 'voice')),
          item(<VideoIcon size={17} />, activeGroupCall ? 'Join video call' : 'Group video call', () => startGroupCall(activeGroup, 'video')),
          pinnedMessages.length ? item(<Pin_ size={17} color={theme.muted} />, `Pinned messages (${pinnedMessages.length})`, () => jumpToMessage(pinnedMessages[0].id)) : null,
          item(isActiveUntil(mutedUntil) ? <Bell size={17} /> : <BellOff size={17} />, isActiveUntil(mutedUntil) ? 'Unmute notifications' : 'Mute notifications', () => (isActiveUntil(mutedUntil) ? setChatMute(muteTarget, null) : setMuteSheet(muteTarget)), false, muteLabel(mutedUntil)),
          item(<LogOut size={17} />, `Leave ${activeGroup.name}`, () => leaveGroupById(groupRow), true),
        ] : [
          item(<User size={17} />, `View ${activeProfile.name}`, () => setProfileOf(activeProfile)),
          item(<Search size={17} />, 'Search', () => setChatSearch({ query: '', pos: 0 })),
          item(<ImageIcon size={17} />, 'Media, links and voice', () => setShowChatMedia(true)),
          canCall(activeProfile) ? item(<Phone size={17} />, 'Voice call', () => startDirectCall(activeProfile, 'voice')) : null,
          canCall(activeProfile) ? item(<VideoIcon size={17} />, 'Video call', () => startDirectCall(activeProfile, 'video')) : null,
          pinnedMessages.length ? item(<Pin_ size={17} color={theme.muted} />, `Pinned messages (${pinnedMessages.length})`, () => jumpToMessage(pinnedMessages[0].id)) : null,
          muteTarget ? item(isActiveUntil(mutedUntil) ? <Bell size={17} /> : <BellOff size={17} />, isActiveUntil(mutedUntil) ? 'Unmute notifications' : 'Mute notifications', () => (isActiveUntil(mutedUntil) ? setChatMute(muteTarget, null) : setMuteSheet(muteTarget)), false, muteLabel(mutedUntil)) : null,
          activeConvForBar ? item(<SettingsIcon size={17} />, 'Chat settings', () => setShowChatSettings(true), false, 'Nicknames, wallpaper, lock and more') : null,
          item(<Ban size={17} />, blocked ? `Unblock ${activeProfile.name}` : `Block ${activeProfile.name}`, () => (blocked ? setUnblockConfirmFor(activeProfile) : setBlockConfirmFor(activeProfile)), !blocked),
          item(<Flag size={17} />, `Report ${activeProfile.name}`, () => setReportUserTarget(activeProfile), true),
          activeConvForBar ? item(<Trash2 size={17} />, 'Delete chat', () => setDeleteConvoTarget(activeConvForBar), true) : null,
        ];
        return (
          <SmartMenu anchorEl={chatMenuAnchor} open onClose={close} width={250}>
            <div className="zchat-pop" style={{ background: theme.panelBg, borderRadius: 16, boxShadow: '0 12px 34px rgba(0,0,0,0.3)', border: `1px solid ${theme.border}`, overflow: 'hidden', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ marginTop: -1 }}>{items.filter(Boolean)}</div>
            </div>
          </SmartMenu>
        );
      })()}
      {showChatMedia && (activeProfile || activeGroup) && (
        <ChatMediaPanel title={activeGroup ? activeGroup.name : activeProfile.name} messages={messages} labelFor={labelForSender}
          onClose={() => setShowChatMedia(false)} onOpenImage={setViewerUrl} onOpenVideo={setViewerVideoUrl}
          onJump={(id) => { setShowChatMedia(false); setTimeout(() => jumpToMessage(id), 150); }} />
      )}
      {muteSheet && (
        <ChatRowSheet title="Mute notifications" subtitle={muteSheet.kind === 'group' ? 'Mentions will still notify you' : 'No sounds or alerts for this chat'}
          avatar={<div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}><BellOff size={20} /></div>}
          onClose={() => setMuteSheet(null)}
          actions={[
            { icon: <BellOff size={18} />, label: '8 hours', onClick: () => setChatMute(muteSheet, muteFor('8h')) },
            { icon: <BellOff size={18} />, label: '1 week', onClick: () => setChatMute(muteSheet, muteFor('1w')) },
            { icon: <BellOff size={18} />, label: 'Always', onClick: () => setChatMute(muteSheet, muteFor('always')) },
          ]} />
      )}
      {pinSheetFor && (
        <ChatRowSheet title="Pin message" subtitle="Choose how long it stays pinned"
          avatar={<div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pin_ size={20} color={theme.coral} /></div>}
          onClose={() => setPinSheetFor(null)}
          actions={[
            { icon: <Pin_ size={18} color={theme.muted} />, label: '24 hours', onClick: () => pinMessage(pinSheetFor, 1) },
            { icon: <Pin_ size={18} color={theme.muted} />, label: '7 days', onClick: () => pinMessage(pinSheetFor, 7) },
            { icon: <Pin_ size={18} color={theme.muted} />, label: '30 days', onClick: () => pinMessage(pinSheetFor, 30) },
          ]} />
      )}
      {reportUserTarget && (
        <ReportReasonPicker onCancel={() => setReportUserTarget(null)}
          onSubmit={async (reason) => { const target = reportUserTarget; setReportUserTarget(null); await handleReport(target, reason); }} />
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
    if (error) { setErr(friendlyError(error, "Couldn't update your password. Try again.")); return; }
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
  const [registering, setRegistering] = useState(false);

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
        if (data) saveAccountEntry({ id: session.user.id, name: data.name, avatar: data.avatar, email: session.user.email, verified: data.verified || null });
      });
    }
  }, [session?.user?.id]);

  const handleAddAccount = () => {
    setSession(null);
    setScreen('login');
  };

  const handleSwitchAccount = async (account) => {
    setSwitchingAccountId(account.id);
    const previousUserId = session?.user?.id;
    const savedSessionRaw = (() => { try { return localStorage.getItem(`zchat-session-${account.id}`); } catch { return null; } })();
    if (savedSessionRaw) {
      try {
        const savedSession = JSON.parse(savedSessionRaw);
        const { data, error } = await supabase.auth.setSession({ access_token: savedSession.access_token, refresh_token: savedSession.refresh_token });
        if (!error && data.session) { setSession(data.session); setSwitchingAccountId(null); return; }
      } catch {}
    }
    setSwitchingAccountId(null);
    if (previousUserId && previousUserId !== account.id) {
      const previousRaw = (() => { try { return localStorage.getItem(`zchat-session-${previousUserId}`); } catch { return null; } })();
      if (previousRaw) {
        try {
          const previousSaved = JSON.parse(previousRaw);
          const { data, error } = await supabase.auth.setSession({ access_token: previousSaved.access_token, refresh_token: previousSaved.refresh_token });
          if (!error && data.session) {
            setSession(data.session);
            alert("That account's saved session expired. Remove it and sign in again to reconnect it. You're still on your current account.");
            return;
          }
        } catch {}
      }
    }
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

  if (!session || needsProfile || registering) {
    if (needsProfile) {
      const isGoogleUser = session?.user?.app_metadata?.provider === 'google';
      return (
        <AuthShell>
          <RegisterFlow
            initialStage={isGoogleUser ? 'username' : 'email'}
            onStart={() => setRegistering(true)}
            onDone={() => { setRegistering(false); setNeedsProfile(false); }}
            onBack={() => { setRegistering(false); setNeedsProfile(false); supabase.auth.signOut(); setSession(null); }}
          />
        </AuthShell>
      );
    }
    return (
      <AuthShell>
        {screen === 'login' && (
          <LoginStep onSuccess={setSession} onForgot={() => setScreen('forgot')} onGoRegister={() => setScreen('register')} />
        )}
        {screen === 'forgot' && <ForgotStep onBack={() => setScreen('login')} />}
        {screen === 'register' && (
          <RegisterFlow onStart={() => setRegistering(true)} onDone={() => { setRegistering(false); setScreen('login'); }} onBack={() => { setRegistering(false); setScreen('login'); }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 22, fontSize: 12.5, fontFamily: FONT }}>
          {[['/?page=store', 'Store'], ['/?page=terms', 'Terms'], ['/?page=refund', 'Refunds'], ['/?page=privacy', 'Privacy']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: 'rgba(140,150,170,0.95)', textDecoration: 'none', fontWeight: 700 }}>{label}</a>
          ))}
        </div>
      </AuthShell>
    );
  }

  return (
    <ChatApp
      key={session.user.id}
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

const PUBLIC_PAGES = ['/store', '/terms', '/refund', '/privacy'];
const SUPPORT_EMAIL = 'support@getzchat.com';

function PublicShell({ title, children, wide }) {
  const nav = [['/?page=store', 'Store'], ['/?page=terms', 'Terms'], ['/?page=refund', 'Refunds'], ['/?page=privacy', 'Privacy']];
  const pageParam = (new URLSearchParams(window.location.search).get('page') || '').toLowerCase();
  const here = pageParam ? `/?page=${pageParam}` : '';
  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', background: '#07080d', color: '#e8eaf0', fontFamily: FONT }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(7,8,13,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: wide ? 960 : 820, margin: '0 auto', padding: '10px 14px 8px', paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'white' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16 }}>Z</div>
            <div style={{ fontWeight: 900, fontSize: 17 }}>ZChat</div>
          </a>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {nav.map(([href, label]) => (
              <a key={href} href={href} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 11, fontSize: 13, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', color: here === href ? '#1a0f02' : 'rgba(255,255,255,0.75)', background: here === href ? 'linear-gradient(135deg, #fbbf24, #f97316)' : 'rgba(255,255,255,0.06)' }}>{label}</a>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: wide ? 960 : 820, margin: '0 auto', padding: '0 16px 50px' }}>
        {title && <h1 style={{ fontSize: 30, fontWeight: 900, margin: '28px 0 8px', color: 'white' }}>{title}</h1>}
        {children}
        <div style={{ marginTop: 44, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
          <div>ZChat · <a href="https://getzchat.com" style={{ color: 'rgba(255,255,255,0.7)' }}>getzchat.com</a></div>
          <div>Contact: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fbbf24' }}>{SUPPORT_EMAIL}</a></div>
          <div>Payments are processed securely by Lemon Squeezy, our reseller and merchant of record.</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
            {nav.map(([href, label]) => <a key={href} href={href} style={{ color: 'rgba(255,255,255,0.65)' }}>{label}</a>)}
          </div>
        </div>
      </div>
    </div>
  );
}

const legalH = { fontSize: 18, fontWeight: 900, color: 'white', margin: '26px 0 8px' };
const legalP = { fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', margin: '0 0 10px' };

function LazyShow({ children, height, rootMargin = '250px' }) {
  const ref = useRef(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!('IntersectionObserver' in window)) { setShow(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setShow(true); io.disconnect(); } });
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ minHeight: height }}>{show ? children : null}</div>;
}

function useStoreViewer() {
  const [viewer, setViewer] = useState({ loading: true, profile: null, rewards: [], email: '' });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data && data.session;
        if (!session) { if (alive) setViewer({ loading: false, profile: null, rewards: [], email: '' }); return; }
        const [{ data: prof }, { data: rw }] = await Promise.all([
          supabase.from('profiles').select('id, name, username, avatar, verified, custom_badge, avatar_frame').eq('id', session.user.id).maybeSingle(),
          supabase.from('user_rewards').select('*').eq('user_id', session.user.id),
        ]);
        if (alive) setViewer({ loading: false, profile: prof || null, rewards: rw || [], email: session.user.email || '' });
      } catch {
        if (alive) setViewer({ loading: false, profile: null, rewards: [], email: '' });
      }
    })();
    return () => { alive = false; };
  }, []);
  return viewer;
}

const STORE_RARITY_ORDER = { mythic: 0, legendary: 1, epic: 2, rare: 3 };

function PublicStorePage() {
  const viewer = useStoreViewer();
  const me = viewer.profile;
  const frames = Object.entries(AVATAR_FRAMES).sort((a, b) => (STORE_RARITY_ORDER[a[1].rarity] ?? 9) - (STORE_RARITY_ORDER[b[1].rarity] ?? 9));
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(frames[0][0]);
  const [tryOn, setTryOn] = useState(false);
  const topRef = useRef(null);
  const spec = AVATAR_FRAMES[selected];
  const r = RARITY_STYLE[spec.rarity] || RARITY_STYLE.rare;
  const reward = (viewer.rewards || []).find((x) => x.kind === 'frame' && x.reward_key === selected);
  const owned = reward && rewardActive(reward);
  const left = owned ? daysLeft(reward) : null;
  const shown = frames.filter(([, s]) => filter === 'all' || s.rarity === filter);
  const displayName = me ? (me.name || me.username) : 'You';
  const ownedCount = (viewer.rewards || []).filter((x) => x.kind === 'frame' && rewardActive(x) && AVATAR_FRAMES[x.reward_key]).length;

  const buy = () => {
    if (!me) { window.location.href = '/'; return; }
    if (!FRAME_STORE.checkoutUrl) return;
    openFrameCheckout(me.id, viewer.email, selected);
  };
  const pick = (key) => {
    setSelected(key);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cta = !me
    ? { label: 'Sign in to buy', sub: 'Free account, takes a minute', disabled: false }
    : !FRAME_STORE.checkoutUrl
      ? { label: 'Store opening soon', sub: 'Frames go on sale very soon', disabled: true }
      : owned
        ? { label: `Add 2 more months · ${FRAME_STORE.priceLabel}`, sub: `Active · ${left} ${left === 1 ? 'day' : 'days'} left`, disabled: false }
        : { label: `Unlock for ${FRAME_STORE.priceLabel}`, sub: '2 months · single payment', disabled: false };

  return (
    <PublicShell wide>
      <style>{`
        @keyframes zs-glow { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .9; transform: scale(1.08); } }
        @keyframes zs-shine { 0% { transform: translateX(-120%) skewX(-20deg); } 60%,100% { transform: translateX(220%) skewX(-20deg); } }
        @keyframes zs-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .zs-card { transition: transform .18s ease, border-color .18s ease; }
        .zs-card:active { transform: scale(.97); }
      `}</style>

      <div ref={topRef} style={{ scrollMarginTop: 70 }} />
      <div style={{ position: 'relative', marginTop: 16, borderRadius: 28, overflow: 'hidden', background: `radial-gradient(circle at 50% 30%, ${r.color}33 0%, rgba(10,10,18,0) 60%), linear-gradient(180deg, #120f1f 0%, #0a0a12 100%)`, border: `1px solid ${r.color}40` }}>
        <div style={{ position: 'absolute', left: '50%', top: 40, width: 320, height: 320, marginLeft: -160, borderRadius: '50%', background: `radial-gradient(circle, ${r.glow} 0%, transparent 65%)`, animation: 'zs-glow 3.2s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '18px 18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.55)' }}>AVATAR FRAME STORE</div>
            {me && <div style={{ fontSize: 11.5, fontWeight: 800, padding: '4px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>{ownedCount} owned</div>}
          </div>

          <div key={selected} style={{ width: 230, height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '18px 0 6px', animation: 'zs-rise .35s ease' }}>
            <Avatar emoji={me ? me.avatar : ''} name={me ? (me.name || me.username) : 'Z'} size={132} frame={selected} />
          </div>

          <div style={{ fontSize: 20, fontWeight: 900, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            {displayName}{me && <VerifiedBadge tier={me.verified} custom={me.custom_badge} size={17} />}
          </div>
          {me && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>@{me.username}</div>}
          {!me && !viewer.loading && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Sign in to see frames on your own photo</div>}

          <div style={{ marginTop: 14, fontSize: 11, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: r.color }}>{r.label}{spec.animated ? ' · Animated' : ''}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginTop: 2 }}>{spec.label.replace(/ frame$/i, '')}</div>
          <button onClick={() => setTryOn(true)} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: 'white', fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}><Eye size={15} /> See it on {me ? 'your profile' : 'a profile'}</button>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 34, fontWeight: 900, color: '#fbbf24' }}>{FRAME_STORE.priceLabel}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>for {FRAME_STORE.periodLabel}</span>
          </div>

          <button onClick={buy} disabled={cta.disabled} style={{ position: 'relative', overflow: 'hidden', marginTop: 14, width: '100%', maxWidth: 360, padding: '16px 18px', borderRadius: 18, border: 'none', fontFamily: FONT, fontWeight: 900, fontSize: 17, letterSpacing: '0.02em', cursor: cta.disabled ? 'default' : 'pointer', color: cta.disabled ? 'rgba(255,255,255,0.6)' : '#1a0f02', background: cta.disabled ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #fde047, #f59e0b 45%, #ea580c)', boxShadow: cta.disabled ? 'none' : '0 12px 30px rgba(245,158,11,0.35)' }}>
            {!cta.disabled && <span style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', animation: 'zs-shine 2.6s ease-in-out infinite' }} />}
            <span style={{ position: 'relative' }}>{cta.label}</span>
          </button>
          <div style={{ fontSize: 12.5, color: owned ? '#34d399' : 'rgba(255,255,255,0.55)', marginTop: 8, fontWeight: 700 }}>{cta.sub}</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['⚡ Instant delivery', '🔁 Not a subscription', '🔒 Secure checkout'].map((t) => (
              <span key={t} style={{ fontSize: 12, fontWeight: 800, padding: '6px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '22px 0 12px', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
        {[['all', 'All'], ['mythic', 'Mythic'], ['legendary', 'Legendary'], ['epic', 'Epic'], ['rare', 'Rare']].map(([k, label]) => {
          const on = filter === k;
          const c = k === 'all' ? '#fbbf24' : RARITY_STYLE[k].color;
          return (
            <button key={k} onClick={() => setFilter(k)} style={{ flexShrink: 0, padding: '9px 14px', borderRadius: 12, fontFamily: FONT, fontWeight: 900, fontSize: 13, cursor: 'pointer', border: `1px solid ${on ? c : 'rgba(255,255,255,0.1)'}`, background: on ? `${c}22` : 'rgba(255,255,255,0.04)', color: on ? c : 'rgba(255,255,255,0.7)' }}>{label}</button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {shown.map(([key, s]) => {
          const rr = RARITY_STYLE[s.rarity] || RARITY_STYLE.rare;
          const rw = (viewer.rewards || []).find((x) => x.kind === 'frame' && x.reward_key === key);
          const has = rw && rewardActive(rw);
          const isSel = selected === key;
          return (
            <div key={key} className="zs-card" role="button" onClick={() => pick(key)} style={{ position: 'relative', borderRadius: 20, padding: '8px 8px 12px', cursor: 'pointer', background: rr.bg, border: `1.5px solid ${isSel ? '#fbbf24' : `${rr.color}40`}`, boxShadow: isSel ? `0 0 22px ${rr.glow}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', contentVisibility: 'auto', containIntrinsicSize: '220px' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: rr.color }} />
              {has
                ? <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 8, background: 'rgba(52,211,153,0.9)', color: '#052e1c', fontSize: 10.5, fontWeight: 900 }}>OWNED</div>
                : <div style={{ position: 'absolute', top: 8, right: 8, padding: '3px 8px', borderRadius: 8, background: 'rgba(245,158,11,0.92)', color: '#1a0f02', fontSize: 10.5, fontWeight: 900 }}>{FRAME_STORE.priceLabel}</div>}
              <LazyShow height={130}>
                <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Avatar emoji={me ? me.avatar : ''} name={me ? (me.name || me.username) : 'Z'} size={70} frame={key} />
                </div>
              </LazyShow>
              <div style={{ fontWeight: 900, fontSize: 14, color: 'white', textAlign: 'center', marginTop: 4 }}>{s.label.replace(/ frame$/i, '')}</div>
              <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: rr.color, marginTop: 3 }}>{rr.label}{s.animated ? ' · Animated' : ''}</div>
            </div>
          );
        })}
      </div>

      {tryOn && <FrameTryOnPage me={me} frameKey={selected} onClose={() => setTryOn(false)} action={{ label: cta.label, disabled: cta.disabled, onClick: buy, sub: cta.sub }} />}
      <h2 style={{ ...legalH, marginTop: 34 }}>How it works</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {[
          ['1', 'Pick a frame', 'Preview every frame on your own profile photo right here.'],
          ['2', 'Pay $2 securely', 'Checkout by Lemon Squeezy. One payment, never charged again.'],
          ['3', 'Wear it everywhere', 'It appears instantly on your profile, chats, lists and posts for 2 months.'],
        ].map(([n, t, d]) => (
          <div key={n} style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: 'linear-gradient(135deg, #fbbf24, #f97316)', color: '#1a0f02', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
            <div style={{ fontWeight: 900, color: 'white', marginTop: 10, fontSize: 15.5 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>

      <h2 style={legalH}>Questions</h2>
      {[
        ['Is it a subscription?', 'No. You pay $2 once and the frame stays active for 2 months. Buy again anytime to add another 2 months.'],
        ['When do I get it?', 'Within seconds of payment. A claim screen appears in ZChat and the frame is equipped for you.'],
        ['Can I switch frames?', 'Yes. Every frame you own is saved in Profile, Collection, and you can switch anytime.'],
        ['Refunds?', 'Only for technical problems. See the Refund Policy.'],
      ].map(([q, a]) => (
        <div key={q} style={{ borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
          <div style={{ fontWeight: 900, color: 'white', fontSize: 14.5 }}>{q}</div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 1.5 }}>{a}{q === 'Refunds?' && <> <a href="/?page=refund" style={{ color: '#fbbf24' }}>Read it</a></>}</div>
        </div>
      ))}
    </PublicShell>
  );
}

function PublicTermsPage() {
  return (
    <PublicShell title="Terms of Service">
      <p style={legalP}>Last updated: September 2026</p>
      <p style={legalP}>These terms apply when you use ZChat at getzchat.com. By creating an account or using ZChat you agree to them.</p>
      <h2 style={legalH}>1. Your account</h2>
      <p style={legalP}>You are responsible for your account and for keeping your login secure. You must give accurate information and must not create accounts to impersonate others.</p>
      <h2 style={legalH}>2. Acceptable use</h2>
      <p style={legalP}>Do not use ZChat to harass, threaten, scam or spam people, or to share illegal, sexual or violent content, hate speech, or content that harms children. We may remove content and suspend or delete accounts that break these rules.</p>
      <h2 style={legalH}>3. Digital items</h2>
      <p style={legalP}>Avatar frames and other cosmetic items are digital items for use inside ZChat only. They have no cash value, cannot be transferred or sold, and give no ownership rights. Paid frames stay active for the period shown at purchase (2 months). Items given as gifts or rewards may be permanent or time limited as shown.</p>
      <h2 style={legalH}>4. Payments</h2>
      <p style={legalP}>Purchases are processed by Lemon Squeezy, who acts as our reseller and merchant of record. Prices are shown in USD. Purchases are single payments, not subscriptions. Lemon Squeezy's own terms also apply to your payment.</p>
      <h2 style={legalH}>5. Refunds</h2>
      <p style={legalP}>Refunds are handled under our <a href="/?page=refund" style={{ color: '#fbbf24' }}>Refund Policy</a>.</p>
      <h2 style={legalH}>6. Changes and availability</h2>
      <p style={legalP}>We may update ZChat, change or retire features and items, or update these terms. If a paid frame is permanently removed while still active, we will provide a replacement or a refund for the unused time.</p>
      <h2 style={legalH}>7. Suspension</h2>
      <p style={legalP}>If your account is suspended or deleted for breaking these terms, active paid items are lost and are not refunded.</p>
      <h2 style={legalH}>8. Liability</h2>
      <p style={legalP}>ZChat is provided as is. To the extent allowed by law, we are not liable for indirect losses, lost data or content, or interruptions of the service.</p>
      <h2 style={legalH}>9. Contact</h2>
      <p style={legalP}>Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fbbf24' }}>{SUPPORT_EMAIL}</a></p>
    </PublicShell>
  );
}

function PublicRefundPage() {
  return (
    <PublicShell title="Refund Policy">
      <p style={legalP}>Last updated: September 2026</p>
      <p style={legalP}>Avatar frames are digital items delivered instantly to your account, so <b>purchases are final and not refundable</b>, except in the case of a technical problem described below.</p>
      <h2 style={legalH}>When you can get a refund</h2>
      <p style={legalP}>You can request a full refund if, because of a technical problem on our side:</p>
      <p style={legalP}>• you were charged but the frame was not added to your account within 24 hours,</p>
      <p style={legalP}>• you were charged more than once for the same purchase by mistake, or</p>
      <p style={legalP}>• the frame does not display or work in ZChat and we cannot fix it within 7 days of your report.</p>
      <h2 style={legalH}>When refunds are not given</h2>
      <p style={legalP}>Refunds are not given for changing your mind, not liking how a frame looks, not using a frame, a frame reaching the end of its 2 month period, or an account being suspended for breaking our <a href="/?page=terms" style={{ color: '#fbbf24' }}>Terms of Service</a>.</p>
      <h2 style={legalH}>How to request</h2>
      <p style={legalP}>Email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fbbf24' }}>{SUPPORT_EMAIL}</a> within 14 days of purchase with your order number from the Lemon Squeezy receipt and a short description of the problem. Approved refunds are returned to your original payment method by Lemon Squeezy. When a refund is issued, the frame is removed from your account.</p>
    </PublicShell>
  );
}

function PublicPrivacyPage() {
  return (
    <PublicShell title="Privacy Policy">
      <p style={legalP}>Last updated: September 2026</p>
      <h2 style={legalH}>What we collect</h2>
      <p style={legalP}>Account details you provide (email, username, name, profile photo and optional profile information), the messages, posts and statuses you create, and basic technical data needed to run the app (such as when you were last active).</p>
      <h2 style={legalH}>How we use it</h2>
      <p style={legalP}>To run ZChat, deliver your messages and notifications, show your profile to others according to your privacy settings, keep the service safe, and deliver items you buy.</p>
      <h2 style={legalH}>Payments</h2>
      <p style={legalP}>Payments are handled by Lemon Squeezy. We never receive or store your card details. We only receive an order confirmation linked to your ZChat account so we can deliver your item.</p>
      <h2 style={legalH}>Sharing</h2>
      <p style={legalP}>We do not sell your personal data. We use trusted providers to run the service, such as hosting, database and payment processing, and share data with them only as needed to operate ZChat, or when required by law.</p>
      <h2 style={legalH}>Your choices</h2>
      <p style={legalP}>You can edit your profile and privacy settings in the app, and you can ask us to delete your account and its data by emailing <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fbbf24' }}>{SUPPORT_EMAIL}</a>.</p>
      <h2 style={legalH}>Contact</h2>
      <p style={legalP}>Privacy questions: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: '#fbbf24' }}>{SUPPORT_EMAIL}</a></p>
    </PublicShell>
  );
}

function PublicPage({ path }) {
  if (path === '/store') return <PublicStorePage />;
  if (path === '/terms') return <PublicTermsPage />;
  if (path === '/refund') return <PublicRefundPage />;
  return <PublicPrivacyPage />;
}

export default function App() {
  const pageParam = (typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('page') || '').toLowerCase() : '');
  const publicPath = pageParam ? `/${pageParam}` : (typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '').toLowerCase() : '');
  if (PUBLIC_PAGES.includes(publicPath)) {
    return (
      <ThemeProvider>
        <PublicPage path={publicPath} />
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
