import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, createContext, useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  Send, Paperclip, Search, Mail, ShieldCheck, ShieldOff, AtSign, LogOut, Eye, EyeOff, Lock,
  Flag, X, Trash2, User, Phone, MoreVertical, Image as ImageIcon, Video as VideoIcon, Pin,
  Smile, ArrowLeft, Check, CheckCheck, Settings as SettingsIcon, Moon, Sun, UserPlus,
  FileText, HelpCircle, ChevronRight, ChevronLeft, Compass, Bell, Volume2, Volume1, VolumeX, Palette, Mic, Play, Pause, Download, Users, Camera, Reply, Forward, Ban, Edit3, Archive, Bookmark, Share2, Copy, Crop, Type, Pencil, Undo2, Scissors, BellOff, Link as LinkIcon, ShieldAlert, Heart, Repeat, PhoneOff, MicOff, VideoOff, SwitchCamera, Clock, Timer, Smartphone, Plus, ThumbsUp, ThumbsDown, LayoutDashboard, Megaphone, Database, Activity, MessageSquare,
} from 'lucide-react';
import {
  supabase, registerWithEmail, verifyOtp, setPassword, signInWithPassword,
  sendPasswordReset, signOut, getSession, checkUsernameTaken,
  sendMessage, getConversation,
  subscribeToMessages, reportUser, uploadMedia as uploadMediaRaw, deleteMessage,
} from '../supabaseClient.js';
import {
  APP_VERSION,
  AppPinPad,
  Avatar,
  avatarAnimSrc,
  AxTabGlyph,
  BoardIcon,
  CHAR_BUBBLES,
  CL,
  CLOSE_GREEN,
  CUSTOM_BADGES,
  CharBubbleDecor,
  CoinIcon,
  CollPrice,
  CrCard,
  DECOR_BY_KEY,
  DISAPPEAR_OPTIONS,
  DecorArt,
  DecorHero,
  DetailRow,
  DetailSection,
  EDITION_FIRST,
  EditionSeal,
  EditionTag,
  FONT,
  FullPage,
  GLASS_OK,
  HiddenPhotoIcon,
  IgRow,
  JokeIcon,
  LIVE_WALLS,
  LineGlyph,
  LineTabs,
  MediaImg,
  MomentIcon,
  MusicNoteIcon,
  NAME_STYLES,
  NS_ROOM,
  NoteIcon,
  PeoplePickerPage,
  PieceDots,
  PlaylistIcon,
  PollIcon,
  Portal,
  RarityTag,
  SI_KINDS,
  SONG_LOOKS,
  SUPER_REACTS,
  SessionDeviceIcon,
  SongBars,
  Spinner,
  StatusIcon,
  StoryUsIcon,
  StyledName,
  SuperMark,
  THEMES,
  ThemeContext,
  VerifiedBadge,
  VideoThumb,
  WALL_PHOTO_PREFIX,
  adminWords,
  animRecordMime,
  appSnack,
  axErrRing,
  axLook,
  axMissing,
  bubbleLayout,
  bubbleWrapCss,
  charBubbleCss,
  coinsText,
  colorForName,
  crCut,
  ctEntry,
  ctLoad,
  ctOpen,
  cxKnown,
  cxNs,
  cxPack,
  cxWord,
  decorPartPrice,
  detailsCardBg,
  draftSync,
  editionText,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  formatCount,
  friendlyError,
  hapticTap,
  hashAppPin,
  igPalette,
  isDecorKey,
  isNetworkProblem,
  isPrivateMedia,
  kitOnInk,
  lapDecide,
  lapNudge,
  lapRead,
  lapWhen,
  limitMem,
  limitWarm,
  listDraftsAll,
  listText,
  liveFirst,
  loadImageEl,
  loadImageElement,
  loadOwnedBubbles,
  loadSpendLimit,
  mediaDbOp,
  moneyToastSubs,
  msMem,
  muteDayGap,
  nsOwn,
  ownedBubblesMem,
  ownedBubblesSubs,
  pfFirst,
  playUiSound,
  prefOn,
  privMetaPush,
  ptTextFx,
  readAppLock,
  reducedMotion,
  resolveMedia,
  rpcFailText,
  rpcMissing,
  sensReveal,
  sensStore,
  shopPing,
  shopPrice,
  siSpec,
  superDpr,
  superPack,
  tradeItemName,
  uiZoom,
  uploadMedia,
  useBackClose,
  useCtTick,
  useMediaUrl,
  useSensitiveMessage,
  useSheetDrag,
  useShopTick,
  useTheme,
  wallPhotoCache,
  writeAppLock,
} from '../App.jsx';

export function axLookNow() {
  if (!axLook.snap || axLook.snap.bold !== axLook.bold || axLook.snap.cv !== axLook.cv) axLook.snap = { bold: axLook.bold, cv: axLook.cv };
  return axLook.snap;
}

export function UnderTabs({ tabs, value, onChange, style }) {
  return (
    <LineTabs fill kind="button" h={42} fs={14.5} value={value} style={style}
      onChange={(k) => { if (k !== value) onChange(k); }}
      tabs={tabs.map(([k, label, aria]) => ({ k, label, aria: aria || label }))} />
  );
}

export function CloseFriendsIcon({ size = 20, color = 'currentColor', filled = false, bare = false }) {
  if (bare) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8l2.75 5.86 6.4.72-4.75 4.36 1.3 6.32L12 16.9l-5.7 3.16 1.3-6.32L2.85 9.38l6.4-.72z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill={filled ? color : 'none'} />
      <path d="M12 6.6l1.6 3.4 3.7.4-2.8 2.5.8 3.6L12 14.6l-3.3 1.9.8-3.6-2.8-2.5 3.7-.4z" fill={filled ? '#FFFFFF' : color} />
    </svg>
  );
}

export function useCloseFriendCount(myId) {
  const [n, setN] = useState(null);
  const load = () => {
    if (!myId) return;
    supabase.from('close_friends').select('friend_id').eq('owner_id', myId).limit(1000)
      .then(({ data, error }) => setN(error ? -1 : (data || []).length), () => setN(-1));
  };
  useEffect(load, [myId]);
  return [n, load];
}

export function CloseFriendsPicker({ myId, onClose, zIndex }) {
  return (
    <PeoplePickerPage title="Close friends" zIndex={zIndex} myId={myId} onClose={onClose} table="close_friends" ownerCol="owner_id" otherCol="friend_id"
      subtitle="Only people on this list see stories you share to close friends. Nobody is told when you add or remove them." />
  );
}

const storyListMem = { uid: null, lists: null, off: false, job: null, subs: new Set() };
export function storyListsCached(uid) {
  if (storyListMem.uid === uid && storyListMem.lists) return storyListMem.lists;
  try { const v = JSON.parse(localStorage.getItem(`zchat-story-lists-${uid}`) || 'null'); if (Array.isArray(v)) return v; } catch {}
  return null;
}
export function storyListsSet(uid, lists) {
  storyListMem.uid = uid;
  storyListMem.lists = lists;
  try { localStorage.setItem(`zchat-story-lists-${uid}`, JSON.stringify(lists)); } catch {}
  storyListMem.subs.forEach((fn) => { try { fn(lists); } catch {} });
}
export function loadStoryLists(uid) {
  if (!uid) return Promise.resolve(null);
  if (storyListMem.job && storyListMem.uid === uid) return storyListMem.job;
  storyListMem.uid = uid;
  storyListMem.job = Promise.all([
    supabase.from('zchat_story_lists').select('id, name, created_at').eq('owner_id', uid).order('created_at', { ascending: true }).limit(20),
    supabase.from('zchat_story_list_members').select('list_id').eq('owner_id', uid).limit(10000),
  ]).then(([a, b]) => {
    storyListMem.job = null;
    if (a.error) {
      if (/zchat_story_lists|schema|relation|exist|PGRST20/i.test(`${a.error.code || ''} ${a.error.message || ''}`)) { storyListMem.off = true; storyListsSet(uid, []); }
      storyListMem.err = a.error;
      return storyListsCached(uid);
    }
    storyListMem.off = false;
    storyListMem.err = null;
    const n = {};
    (b.data || []).forEach((r) => { n[r.list_id] = (n[r.list_id] || 0) + 1; });
    const lists = (a.data || []).map((l) => ({ id: l.id, name: l.name, n: n[l.id] || 0 }));
    storyListsSet(uid, lists);
    return lists;
  }, (e) => { storyListMem.job = null; storyListMem.err = e || {}; return storyListsCached(uid); });
  return storyListMem.job;
}
export function storyListsErr() { return storyListMem.err || null; }
export function useStoryLists(uid) {
  const [lists, setLists] = useState(() => (uid ? storyListsCached(uid) : null));
  useEffect(() => {
    if (!uid) return undefined;
    const on = (l) => setLists(l);
    storyListMem.subs.add(on);
    loadStoryLists(uid);
    return () => { storyListMem.subs.delete(on); };
  }, [uid]);
  return storyListMem.off || !uid ? null : lists;
}
export function StoryListIcon({ size = 20, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16.5 7h4.5M16.5 11h4.5M18 15h3" />
    </svg>
  );
}

export function CloseShareButton({ count, onShare, onEmpty, disabled, busy, size = 46 }) {
  if (count === -1) return null;
  const tap = () => {
    if (disabled) return;
    hapticTap();
    if (!count) { if (onEmpty) onEmpty(); return; }
    onShare();
  };
  return (
    <div role="button" aria-label="Share to close friends" onPointerDown={(e) => e.preventDefault()} onClick={tap} className="zchat-press"
      style={{ width: size, height: size, borderRadius: '50%', background: CLOSE_GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', flexShrink: 0, opacity: disabled ? 0.55 : 1 }}>
      {busy ? <Spinner size={16} color="#FFFFFF" /> : <CloseFriendsIcon size={Math.round(size * 0.46)} color="#FFFFFF" bare />}
    </div>
  );
}
export function MediaVideo({ src, style, ...rest }) {
  const url = useMediaUrl(src);
  if (!url) return <span aria-hidden="true" style={{ display: 'block', minHeight: 120, background: 'rgba(0,0,0,0.35)', ...(style || {}) }} />;
  return <video src={url} style={style} {...rest} />;
}
export async function appFileOk(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return false;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return !(ct.includes('text/html') && !/\.html?$/i.test(url));
  } catch {
    return null;
  }
}

export function SettingsRowPlain(p) {
  return <IgRow {...p} inset={false} />;
}

export function ChoiceSheet({ title, sub, options, value, onPick, onClose, zIndex = 760 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ textAlign: 'center', padding: '4px 20px 12px', touchAction: 'none' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>{title}</div>
            {sub && <div style={{ fontSize: 13, color: theme.muted, marginTop: 3, textWrap: 'balance' }}>{sub}</div>}
          </div>
          <div role="radiogroup" aria-label={title}>
            {options.map(([k, l, hint]) => {
              const on = value === k;
              return (
                <div key={k} role="radio" aria-checked={on} aria-label={l} onClick={() => { hapticTap(); onPick(k); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', minHeight: 54, cursor: 'pointer' }}>
                  <div style={{ flex: 1, minWidth: 0, padding: '10px 0' }}>
                    <div style={{ fontSize: 16, color: theme.ink, fontWeight: on ? 700 : 500 }}>{l}</div>
                    {hint && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{hint}</div>}
                  </div>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${on ? theme.coral : theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <span style={{ width: 12, height: 12, borderRadius: '50%', background: theme.coral }} />}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Portal>
  );
}
export async function readZipIndex(blob) {
  const tailLen = Math.min(blob.size, 65557);
  const tail = new DataView(await blob.slice(blob.size - tailLen).arrayBuffer());
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) { if (tail.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
  if (eocd < 0) throw new Error('zip');
  const count = tail.getUint16(eocd + 10, true);
  const cdSize = tail.getUint32(eocd + 12, true);
  const cdOff = tail.getUint32(eocd + 16, true);
  const cd = new DataView(await blob.slice(cdOff, cdOff + cdSize).arrayBuffer());
  const dec = new TextDecoder();
  const out = new Map();
  let p = 0;
  for (let k = 0; k < count && p + 46 <= cd.byteLength; k++) {
    if (cd.getUint32(p, true) !== 0x02014b50) break;
    const method = cd.getUint16(p + 10, true);
    const csize = cd.getUint32(p + 20, true);
    const nlen = cd.getUint16(p + 28, true);
    const xlen = cd.getUint16(p + 30, true);
    const clen = cd.getUint16(p + 32, true);
    const loff = cd.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nlen));
    out.set(name, { method, size: csize, loff });
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
export async function zipEntryBlob(blob, ent, type) {
  const lh = new DataView(await blob.slice(ent.loff, ent.loff + 30).arrayBuffer());
  const start = ent.loff + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
  const raw = blob.slice(start, start + ent.size);
  if (ent.method === 0) return new Blob([raw], { type: type || '' });
  if (ent.method !== 8 || typeof DecompressionStream === 'undefined') throw new Error('compressed');
  const out = await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();
  return new Blob([out], { type: type || '' });
}
export function lastBackupLabel() {
  try {
    const v = localStorage.getItem('zchat-last-backup');
    if (!v) return 'Never';
    const days = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
    return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
  } catch { return 'Never'; }
}
export function PdfGlyph({ size = 22, color = 'currentColor', strokeWidth = 1.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2.5 2.5 0 0 0-2.5 2.5v13A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V8.5z" /><path d="M14 3v5.5h5.5" /><path d="M8.5 13h7M8.5 16.5h4.5" />
    </svg>
  );
}
export function coinTakenBack(r) {
  return !!r && r.reason === 'admin' && Number(r.delta) < 0;
}

export function GiftCodeIcon({ size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2.2a1.9 1.9 0 0 0 0 3.6V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-2.2a1.9 1.9 0 0 0 0-3.6Z" /><path d="M14.5 6.5v11" strokeDasharray="1.6 2.2" />
    </svg>
  );
}
export function giftCodeClean(v) {
  return String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}
export function giftCodeGroups(v) {
  const c = giftCodeClean(v);
  return [c.slice(0, 4), c.slice(4, 8), c.slice(8, 12)].filter(Boolean).join(' ');
}
export function giftCodeWhat(coins, kind, key) {
  const item = !kind || !key ? null : kind === 'set' ? `the ${DECOR_BY_KEY[key] ? DECOR_BY_KEY[key].name : adminWords(key)} set` : `the ${tradeItemName(kind, key)}`;
  return listText([coins > 0 ? coinsText(coins) : null, item]);
}

export const GIFT_PAPERS = [
  { k: 'lilac', label: 'Lilac', c: ['#C9BBFF', '#A68BFA'] },
  { k: 'rose', label: 'Rose', c: ['#FFB3C1', '#FB7A93'] },
  { k: 'mint', label: 'Mint', c: ['#A6EBD0', '#5DD0A4'] },
  { k: 'sky', label: 'Sky', c: ['#B3DCFF', '#6FB2F7'] },
  { k: 'sun', label: 'Sunny', c: ['#FFE39A', '#F7BE45'] },
  { k: 'ink', label: 'Ink', c: ['#454B6E', '#262A42'] },
  { k: 'confetti', label: 'Confetti', c: ['#8A6CFF', '#5B3FD6'] },
  { k: 'stripes', label: 'Stripes', c: ['#FFF3E8', '#FF8AA0'] },
  { k: 'dots', label: 'Polka dots', c: ['#37C8B9', '#1F9E91'] },
  { k: 'stars', label: 'Starry night', c: ['#24316A', '#141B42'] },
  { k: 'galaxy', label: 'Galaxy', shop: true, c: ['#4A2A93', '#100B2E'] },
  { k: 'goldfoil', label: 'Gold foil', shop: true, c: ['#FBE29A', '#C48F24'] },
  { k: 'sakura', label: 'Sakura', shop: true, c: ['#FFEAF1', '#FFC3D5'] },
  { k: 'neon', label: 'Neon', shop: true, c: ['#1A1038', '#0A0618'] },
];
export const GIFT_PAPER_EXTRA = { birthday: { k: 'birthday', label: 'Birthday', c: ['#FFD9E6', '#FF9DBE'] } };
export const GIFT_RIBBONS = [['gold', 'Gold', '#F4BC35', '#D08F16'], ['silver', 'Silver', '#E3E7EE', '#A7AFBC'], ['red', 'Red', '#F25563', '#C22E3C'], ['white', 'White', '#FFFFFF', '#D3D7DF'], ['purple', 'Purple', '#9479FF', '#6447E0'], ['black', 'Black', '#34343E', '#121217']];
export function giftPaper(k) { return GIFT_PAPERS.find((p) => p.k === k) || GIFT_PAPER_EXTRA[k] || null; }
export function giftRibbon(k) { return GIFT_RIBBONS.find((r) => r[0] === k) || GIFT_RIBBONS[0]; }
export function giftWrapText(w) {
  const p = w && giftPaper(w.p);
  if (!p) return 'Plain box';
  return `${p.label} paper, ${giftRibbon(w.r)[1].toLowerCase()} ribbon`;
}
function PaperDefs({ id, k }) {
  const p = giftPaper(k) || GIFT_PAPERS[0];
  const [a, b] = p.c;
  const base = <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>;
  const pat = (w, h, kids, extra) => <pattern id={`${id}p`} patternUnits="userSpaceOnUse" width={w} height={h} {...(extra || {})}><rect width={w} height={h} fill={`url(#${id}g)`} />{kids}</pattern>;
  const star = (x, y, s, c) => { const q = (n) => +(n * s).toFixed(2); return <path key={`${x}${y}`} d={`M${x} ${y - s}c${q(0.1)} ${q(0.73)} ${q(0.27)} ${q(0.9)} ${s} ${s}c${q(-0.73)} ${q(0.1)} ${q(-0.9)} ${q(0.27)} ${-s} ${s}c${q(-0.1)} ${q(-0.73)} ${q(-0.27)} ${q(-0.9)} ${-s} ${-s}c${q(0.73)} ${q(-0.1)} ${q(0.9)} ${q(-0.27)} ${s} ${-s}z`} fill={c} />; };
  let body = null;
  if (k === 'confetti') body = pat(44, 44, [['#FFD66B', 6, 8, 20], ['#FF8FB0', 26, 6, -30], ['#7CF2C9', 34, 26, 40], ['#FFFFFF', 12, 30, -15], ['#FFD66B', 22, 38, 60]].map(([c, x, y, r]) => <rect key={`${x}${y}`} x={x} y={y} width="7" height="3.2" rx="1.6" fill={c} transform={`rotate(${r} ${x + 3.5} ${y + 1.6})`} />));
  else if (k === 'stripes') body = pat(26, 26, <rect x="0" y="0" width="10" height="26" fill={b} />, { patternTransform: 'rotate(40)' });
  else if (k === 'dots') body = pat(30, 30, [<circle key="a" cx="7.5" cy="7.5" r="4.2" fill="#FFFFFF" fillOpacity="0.92" />, <circle key="b" cx="22.5" cy="22.5" r="4.2" fill="#FFFFFF" fillOpacity="0.92" />]);
  else if (k === 'stars') body = pat(48, 48, [star(12, 12, 4.2, '#FFD66B'), star(36, 30, 3.2, '#FFE9A8'), <circle key="c" cx="30" cy="10" r="1.1" fill="#FFFFFF" />, <circle key="d" cx="10" cy="36" r="1.3" fill="#FFFFFF" fillOpacity="0.8" />, <circle key="e" cx="42" cy="44" r="0.9" fill="#FFFFFF" />]);
  else if (k === 'galaxy') body = pat(70, 70, [<ellipse key="n" cx="40" cy="30" rx="34" ry="12" fill="#B07CFF" fillOpacity="0.22" transform="rotate(-24 40 30)" />, star(18, 18, 3.4, '#FFFFFF'), star(52, 50, 2.6, '#E7D9FF'), ...[[8, 44, 1], [30, 60, 0.8], [62, 14, 1.1], [44, 8, 0.7], [24, 32, 0.9]].map(([x, y, r]) => <circle key={`s${x}`} cx={x} cy={y} r={r} fill="#FFFFFF" />)]);
  else if (k === 'goldfoil') body = pat(36, 36, [<path key="a" d="M0 36L36 0" stroke="#FFF6D2" strokeOpacity="0.55" strokeWidth="5" />, <path key="b" d="M-9 9L9 -9M27 45L45 27" stroke="#FFF6D2" strokeOpacity="0.55" strokeWidth="5" />, <path key="c" d="M0 18L18 0M18 36L36 18" stroke="#8A5A0A" strokeOpacity="0.16" strokeWidth="1.4" />]);
  else if (k === 'sakura') body = pat(54, 54, [[14, 14, 1], [40, 38, 0.8]].map(([x, y, s]) => <g key={`${x}`} transform={`translate(${x} ${y}) scale(${s})`}>{[0, 72, 144, 216, 288].map((r) => <ellipse key={r} cx="0" cy="-5.6" rx="3.6" ry="5.4" fill="#FF8FB4" transform={`rotate(${r})`} />)}<circle r="2" fill="#FFE07A" /></g>));
  else if (k === 'neon') body = pat(24, 24, [<path key="a" d="M0 0.5H24" stroke="#38E1FF" strokeOpacity="0.7" strokeWidth="1.2" />, <path key="b" d="M0.5 0V24" stroke="#FF5CC6" strokeOpacity="0.55" strokeWidth="1.2" />]);
  else if (k === 'birthday') body = pat(46, 46, [<g key="a" transform="translate(12 12)"><rect x="-2.2" y="0" width="4.4" height="11" rx="1.4" fill="#FFFFFF" /><path d="M0 -6c2.4 2.6 2.4 4.4 0 5.6c-2.4-1.2-2.4-3 0-5.6z" fill="#FFB938" /></g>, <circle key="b" cx="34" cy="10" r="2.6" fill="#8A6CFF" fillOpacity="0.75" />, <circle key="c" cx="30" cy="34" r="2.2" fill="#FFFFFF" fillOpacity="0.9" />, <rect key="d" x="6" y="34" width="7" height="3" rx="1.5" fill="#57C7FF" transform="rotate(25 9 35)" />]);
  return <defs>{base}{body}</defs>;
}
function wrapFillOf(id, k) { return ['confetti', 'stripes', 'dots', 'stars', 'galaxy', 'goldfoil', 'sakura', 'neon', 'birthday'].includes(k) ? `url(#${id}p)` : `url(#${id}g)`; }
export function WrapBoxArt({ paper, ribbon, size = 200, open = false, still }) {
  const id = `zw${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const rb = giftRibbon(ribbon);
  const fill = wrapFillOf(id, paper);
  const calm = still || reducedMotion();
  const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const zig = 'L106 72 L95 84 L106 96 L95 108 L106 120 L95 132 L106 144 L95 156 L106 168 L95 180 L100 190';
  const half = (side) => (
    <g clipPath={`url(#${id}${side})`} style={{ transformBox: 'fill-box', transformOrigin: side === 'l' ? '100% 100%' : '0% 100%', transition: calm ? 'none' : `transform 520ms ${ease} 170ms, opacity 360ms ease 330ms`, transform: open ? (side === 'l' ? 'translate(-64px, 34px) rotate(-26deg)' : 'translate(64px, 34px) rotate(26deg)') : 'none', opacity: open ? 0 : 1 }}>
      <rect x="36" y="86" width="128" height="94" rx="14" fill={fill} />
      <rect x="36" y="86" width="128" height="94" rx="14" fill={`url(#${id}s)`} />
      <rect x="36" y="86" width="128" height="18" fill="rgba(0,0,0,0.16)" />
      <rect x="28" y="64" width="144" height="30" rx="10" fill={fill} />
      <rect x="28" y="64" width="144" height="30" rx="10" fill={`url(#${id}t)`} />
      <rect x="36" y="128" width="128" height="15" fill={`url(#${id}r)`} />
      <path d="M38 72h44" stroke="rgba(255,255,255,0.42)" strokeWidth="4" strokeLinecap="round" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <PaperDefs id={id} k={paper} />
      <defs>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={rb[2]} /><stop offset="1" stopColor={rb[3]} /></linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000000" stopOpacity="0" /><stop offset="1" stopColor="#000000" stopOpacity="0.22" /></linearGradient>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" /><stop offset="1" stopColor="#000000" stopOpacity="0.08" /></linearGradient>
        <clipPath id={`${id}l`}><path d={`M0 0H100V60${zig}V200H0Z`} /></clipPath>
        <clipPath id={`${id}rt`}><path d={`M200 0H100V60${zig}V200H200Z`} /></clipPath>
      </defs>
      <ellipse cx="100" cy="186" rx="70" ry="7" fill="rgba(0,0,0,0.28)" style={{ transition: calm ? 'none' : 'opacity 300ms ease 300ms', opacity: open ? 0 : 1 }} />
      {half('l')}
      <g clipPath={`url(#${id}rt)`} style={{ transformBox: 'fill-box', transformOrigin: '0% 100%', transition: calm ? 'none' : `transform 520ms ${ease} 170ms, opacity 360ms ease 330ms`, transform: open ? 'translate(64px, 34px) rotate(26deg)' : 'none', opacity: open ? 0 : 1 }}>
        <rect x="36" y="86" width="128" height="94" rx="14" fill={fill} />
        <rect x="36" y="86" width="128" height="94" rx="14" fill={`url(#${id}s)`} />
        <rect x="36" y="86" width="128" height="18" fill="rgba(0,0,0,0.16)" />
        <rect x="28" y="64" width="144" height="30" rx="10" fill={fill} />
        <rect x="28" y="64" width="144" height="30" rx="10" fill={`url(#${id}t)`} />
        <rect x="36" y="128" width="128" height="15" fill={`url(#${id}r)`} />
      </g>
      <rect x="91" y="64" width="18" height="116" fill={`url(#${id}r)`} style={{ transformBox: 'fill-box', transformOrigin: '50% 0%', transition: calm ? 'none' : `transform 240ms ${ease}, opacity 200ms ease 60ms`, transform: open ? 'scaleY(0)' : 'none', opacity: open ? 0 : 1 }} />
      <g style={{ transformBox: 'fill-box', transformOrigin: '50% 80%', transition: calm ? 'none' : `transform 300ms ${ease}, opacity 220ms ease 80ms`, transform: open ? 'translateY(-26px) rotate(130deg) scale(0.3)' : 'none', opacity: open ? 0 : 1 }}>
        <path d="M100 66c-10-22-40-30-44-12-3 14 22 18 44 12z" fill={`url(#${id}r)`} stroke={rb[3]} strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 66c10-22 40-30 44-12 3 14-22 18-44 12z" fill={`url(#${id}r)`} stroke={rb[3]} strokeWidth="2" strokeLinejoin="round" />
        <path d="M96 70c-6 10-12 18-20 22M104 70c6 10 12 18 20 22" stroke={rb[3]} strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx="100" cy="66" r="8" fill={rb[2]} stroke={rb[3]} strokeWidth="2" />
      </g>
    </svg>
  );
}

export async function buyShopItem(kind, key) {
  const { data, error } = await supabase.rpc('zchat_buy_item', { p_kind: kind, p_key: key });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) return { error: rpcFailText('Shop buy', error, 'The Shop switches on once the latest ZChat setup is finished.') };
  if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
  return { ok: true, coins: row.coins };
}
export function useMoneyToast(say) {
  const ref = useRef(say);
  ref.current = say;
  useEffect(() => {
    const fn = (t) => { ref.current(t); return true; };
    moneyToastSubs.add(fn);
    return () => { moneyToastSubs.delete(fn); };
  }, []);
}
export function aipPack() { return cxPack('/aiphoto-pack.js', 'ZAIP'); }
export async function aipToken() {
  try { const { data } = await supabase.auth.getSession(); return (data && data.session && data.session.access_token) || ''; } catch { return ''; }
}
export async function aipImageData(src, max, quality = 0.84) {
  const own = typeof Blob !== 'undefined' && src instanceof Blob;
  const url = own ? URL.createObjectURL(src) : isPrivateMedia(src) ? await resolveMedia(src) : src;
  if (!url) throw new Error('nourl');
  let temp = own ? url : '';
  try {
    let img = null;
    try { img = await loadImageEl(url); } catch { img = null; }
    if (!img) {
      const blob = await (await fetch(url)).blob();
      temp = URL.createObjectURL(blob);
      img = await loadImageElement(temp);
    }
    const s = Math.min(1, max / Math.max(1, img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { data: c.toDataURL('image/jpeg', quality), w: c.width, h: c.height };
  } finally { if (temp) setTimeout(() => { try { URL.revokeObjectURL(temp); } catch {} }, 0); }
}
export async function aipFit(src, steps) {
  let last = null;
  for (const [max, q, limit] of steps) {
    last = await aipImageData(src, max, q);
    if (last.data.length <= limit) return last;
  }
  return last;
}
export async function aipStartJob(kind, opts) {
  const { data: id, error } = await supabase.rpc('zchat_aiphoto_job', { p_kind: kind, p_prompt: opts.prompt || null, p_style: opts.style });
  if (error || !id) return { error: rpcMissing(error) ? 'This switches on once the latest ZChat setup is finished.' : error && error.code === 'P0001' && error.message ? error.message : 'Could not start. Check your connection and try again.' };
  const token = await aipToken();
  const drop = () => { supabase.from('ai_photo_jobs').delete().eq('id', id).then(() => {}, () => {}); };
  try {
    const res = await fetch('/.netlify/functions/zchat-aiphoto-background', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id, photo: opts.photo || undefined, ratio: opts.ratio || undefined }) });
    if (!res.ok && res.status !== 202) { drop(); return { error: res.status === 404 ? 'ZChat Bot drawing switches on once the ZChat tools are set up.' : 'ZChat Bot can not draw right now. Try again soon.' }; }
  } catch {
    drop();
    return { error: 'Could not reach ZChat. Check your connection and try again.' };
  }
  return { id };
}
export async function aipWaitJob(id, aliveRef) {
  const started = Date.now();
  while (aliveRef.current && Date.now() - started < 170000) {
    await new Promise((r) => setTimeout(r, 2000));
    if (!aliveRef.current) return null;
    const { data } = await supabase.from('ai_photo_jobs').select('id, kind, status, urls, error').eq('id', id).maybeSingle();
    if (data && (data.status === 'done' || data.status === 'failed')) return data;
  }
  return aliveRef.current ? { id, status: 'failed', error: 'This one is taking too long. Try again in a minute.' } : null;
}
export function aipDropJob(job) {
  if (!job || !job.id) return;
  const paths = (Array.isArray(job.urls) ? job.urls : []).filter((u) => isPrivateMedia(u)).map((u) => u.slice(3));
  if (paths.length) { try { supabase.storage.from('chat-private').remove(paths).then(() => {}, () => {}); } catch {} }
  supabase.from('ai_photo_jobs').delete().eq('id', job.id).then(() => {}, () => {});
}
export const LIVE_WALL_PAID = LIVE_WALLS.filter((x) => !x.free).map((x) => x.k);
export function LiveWallLock({ price }) {
  return (
    <span style={{ position: 'absolute', top: 7, right: 7, display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px 0 6px', borderRadius: 11, background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      <CoinIcon size={13} />{price}
    </span>
  );
}

export function ThemeIcon({ size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill={color} stroke="none" />
    </svg>
  );
}
export function DetailTiles({ items }) {
  const { theme } = useTheme();
  const list = items.filter(Boolean);
  if (!list.length) return null;
  return (
    <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
      {list.map((t, i) => {
        const name = t.aria || t.label;
        const right = t.badge || t.dot ? (
          <>
            {t.dot ? <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: '50%', background: t.dot, flexShrink: 0 }} /> : null}
            {t.badge ? <span style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 10, background: theme.danger, color: '#FFFFFF', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.badge > 99 ? '99+' : t.badge}</span> : null}
            <ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} />
          </>
        ) : undefined;
        return <DetailRow key={name} icon={t.icon} label={name} value={t.value || null} onClick={t.onClick} right={right} last={i === list.length - 1} />;
      })}
    </div>
  );
}

export function MediaStrip({ media, onOpen, onSeeAll }) {
  const { theme } = useTheme();
  const list = (media || []).slice(0, 10);
  return (
    <DetailSection title="Media, links and voice" right={<div role="button" aria-label="See all media" onClick={onSeeAll} style={{ fontSize: 13, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '2px 0 2px 10px' }}>See all</div>} flush>
      {list.length ? (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', margin: '0 -16px', padding: '0 16px' }}>
          {list.map((m) => (
            <div key={m.id} role="button" aria-label={m.type === 'video' ? 'Open video' : 'Open photo'} onClick={() => onOpen && onOpen(m)} style={{ position: 'relative', width: 78, height: 78, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: detailsCardBg(theme), cursor: 'pointer' }}>
              {m.type === 'video'
                ? <VideoThumb src={m.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                : <MediaImg src={m.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
              <SensTileVeil m={m} />
              {m.type === 'video' && <Play size={14} color="white" style={{ position: 'absolute', top: 6, right: 6, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }} />}
            </div>
          ))}
        </div>
      ) : (
        <div role="button" aria-label="Open media, links and voice" onClick={onSeeAll} style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, padding: '14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <ImageIcon size={20} color={theme.muted} />
          <div style={{ flex: 1, fontSize: 13.5, color: theme.muted }}>Photos, videos, links and voice notes show up here</div>
          <ChevronRight size={18} color={theme.muted} />
        </div>
      )}
    </DetailSection>
  );
}
export function DetailActions({ items }) {
  const { theme } = useTheme();
  const c = igPalette(theme);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 14, padding: '0 8px' }}>
      {items.filter(Boolean).map(([icon, label, fn, on]) => (
        <div key={label} role="button" aria-label={label} onClick={fn} className="zchat-press" style={{ flex: '0 1 72px', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 2px 4px', cursor: 'pointer', color: on ? theme.coral : theme.ink }}>
          {React.cloneElement(icon, { size: 24, strokeWidth: 1.6 })}
          <div style={{ fontSize: 12, fontWeight: on ? 700 : 500, color: on ? theme.coral : c.dim, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

export function detailRows(rows) {
  const list = rows.filter(Boolean);
  return list.map((r, i) => React.cloneElement(r, { key: i, last: i === list.length - 1 }));
}
export function mutedUntilText(until) {
  const d = new Date(until);
  const gap = muteDayGap(until);
  const t = fmtHM(d);
  if (gap <= 0) return `Muted until ${t}`;
  if (gap === 1) return `Muted until tomorrow ${t}`;
  return `Muted until ${fmtDate(d, { day: 'numeric', month: 'short' })}`;
}
export function ModShieldGlyph({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 3.2 5 6v5.2c0 4.3 2.9 8.1 7 9.6 4.1-1.5 7-5.3 7-9.6V6z" />
    </svg>
  );
}
export function GroupRoleBadge({ role }) {
  const { theme } = useTheme();
  if (!role || role === 'member') return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 13, fontWeight: 600, color: theme.muted }}>
      {role === 'owner' ? <MemberCrownGlyph size={15} color={theme.dark ? '#F2C14E' : '#C98A00'} /> : role === 'admin' ? <ShieldCheck size={14} strokeWidth={2.1} color={kitOnInk(theme)} /> : <ModShieldGlyph size={14} color={kitOnInk(theme)} />}
      {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Moderator'}
    </span>
  );
}
export function MemberCrownGlyph({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M4.5 19h15" /><path d="M5 15.8 3.6 7.6l4.8 3.6L12 5.2l3.6 6 4.8-3.6L19 15.8z" />
    </svg>
  );
}
export function MemberTagGlyph({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 12.3V5.5a2 2 0 0 1 2-2h6.8l8.2 8.2a2 2 0 0 1 0 2.8l-6 6a2 2 0 0 1-2.8 0z" /><circle cx="8.3" cy="8.3" r="1.5" />
    </svg>
  );
}
export function MemberRemoveGlyph({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9.5" cy="8" r="3.8" /><path d="M2.5 20c.9-3.6 3.7-5.6 7-5.6s6.1 2 7 5.6" /><path d="M16.5 11h5" />
    </svg>
  );
}

export const ANIM_PX = 320;
export function animCanvas(n, m) {
  const c = document.createElement('canvas');
  c.width = n;
  c.height = m || n;
  return c;
}
export function animBlobOf(canvas, type, q) {
  return new Promise((res) => { try { canvas.toBlob((b) => res(b || null), type, q); } catch { res(null); } });
}
const MP4_MATRIX = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
function mpU32(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
function mpU16(n) { return [(n >> 8) & 255, n & 255]; }
function mpTag(s) { return [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)]; }
function mpBox(type, parts) {
  let len = 8;
  parts.forEach((x) => { len += x.length; });
  const out = new Uint8Array(len);
  out.set(mpU32(len), 0);
  out.set(mpTag(type), 4);
  let o = 8;
  parts.forEach((x) => { out.set(x, o); o += x.length; });
  return out;
}
function mpFull(type, version, flags, parts) { return mpBox(type, [[version, (flags >> 16) & 255, (flags >> 8) & 255, flags & 255], ...parts]); }
function mpWords(list) { const out = []; list.forEach((n) => out.push(...mpU32(n))); return out; }
export const ZCHAT_MP4_BRAND = 'zcht';
export function mp4Mux({ w, h, desc, samples }) {
  const TS = 90000;
  const list = samples.slice().sort((a, b) => a.ts - b.ts);
  const t0 = list[0].ts;
  const ticks = list.map((x) => Math.round(((x.ts - t0) * TS) / 1e6));
  const deltas = ticks.map((t, i) => (i + 1 < ticks.length ? Math.max(1, ticks[i + 1] - t) : 0));
  const avg = deltas.length > 1 ? Math.max(1, Math.round((ticks[ticks.length - 1] - ticks[0]) / (ticks.length - 1))) : 3000;
  deltas[deltas.length - 1] = avg;
  const total = deltas.reduce((a, b) => a + b, 0);
  const durMs = Math.max(1, Math.round((total * 1000) / TS));
  const stts = [];
  deltas.forEach((d) => { const last = stts[stts.length - 1]; if (last && last[1] === d) last[0] += 1; else stts.push([1, d]); });
  const keys = [];
  list.forEach((x, i) => { if (x.key) keys.push(i + 1); });
  if (!keys.length || keys[0] !== 1) keys.unshift(1);
  const ftyp = mpBox('ftyp', [mpTag('isom'), mpU32(512), mpTag('isom'), mpTag('iso2'), mpTag('avc1'), mpTag('mp41'), mpTag(ZCHAT_MP4_BRAND)]);
  const avc1 = mpBox('avc1', [
    [0, 0, 0, 0, 0, 0], mpU16(1), mpU16(0), mpU16(0), mpWords([0, 0, 0]), mpU16(w), mpU16(h),
    mpU32(0x00480000), mpU32(0x00480000), mpU32(0), mpU16(1), new Array(32).fill(0), mpU16(0x18), mpU16(0xFFFF),
    mpBox('avcC', [desc]),
  ]);
  const stbl = (offset) => mpBox('stbl', [
    mpFull('stsd', 0, 0, [mpU32(1), avc1]),
    mpFull('stts', 0, 0, [mpU32(stts.length), mpWords(stts.flat())]),
    mpFull('stss', 0, 0, [mpU32(keys.length), mpWords(keys)]),
    mpFull('stsc', 0, 0, [mpU32(1), mpWords([1, list.length, 1])]),
    mpFull('stsz', 0, 0, [mpU32(0), mpU32(list.length), mpWords(list.map((x) => x.data.length))]),
    mpFull('stco', 0, 0, [mpU32(1), mpU32(offset)]),
  ]);
  const moov = (offset) => mpBox('moov', [
    mpFull('mvhd', 0, 0, [mpWords([0, 0, 1000, durMs, 0x00010000]), mpU16(0x0100), mpU16(0), mpWords([0, 0]), mpWords(MP4_MATRIX), mpWords([0, 0, 0, 0, 0, 0]), mpU32(2)]),
    mpBox('trak', [
      mpFull('tkhd', 0, 3, [mpWords([0, 0, 1, 0, durMs, 0, 0]), mpU16(0), mpU16(0), mpU16(0), mpU16(0), mpWords(MP4_MATRIX), mpU32(w * 65536), mpU32(h * 65536)]),
      mpBox('mdia', [
        mpFull('mdhd', 0, 0, [mpWords([0, 0, TS, total]), mpU16(0x55C4), mpU16(0)]),
        mpFull('hdlr', 0, 0, [mpU32(0), mpTag('vide'), mpWords([0, 0, 0]), [86, 105, 100, 101, 111, 0]]),
        mpBox('minf', [
          mpFull('vmhd', 0, 1, [mpU16(0), mpU16(0), mpU16(0), mpU16(0)]),
          mpBox('dinf', [mpFull('dref', 0, 0, [mpU32(1), mpFull('url ', 0, 1, [])])]),
          stbl(offset),
        ]),
      ]),
    ]),
  ]);
  const size = list.reduce((a, x) => a + x.data.length, 0);
  const head = moov(0).length;
  const offset = ftyp.length + head + 8;
  const mv = moov(offset);
  const out = new Uint8Array(ftyp.length + mv.length + 8 + size);
  out.set(ftyp, 0);
  out.set(mv, ftyp.length);
  let o = ftyp.length + mv.length;
  out.set(mpU32(8 + size), o);
  out.set(mpTag('mdat'), o + 4);
  o += 8;
  list.forEach((x) => { out.set(x.data, o); o += x.data.length; });
  return out;
}
export function mp4IsOurs(buf) {
  try {
    const b = new Uint8Array(buf, 0, Math.min(64, buf.byteLength));
    if (b.length < 16 || String.fromCharCode(b[4], b[5], b[6], b[7]) !== 'ftyp') return false;
    const n = Math.min(b.length, (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]);
    for (let i = 16; i + 4 <= n; i += 4) if (String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]) === ZCHAT_MP4_BRAND) return true;
  } catch {}
  return false;
}
const animCodec = { broken: false, memo: new Map() };
export function animCodecConfig(w, h, bps) {
  const key = `${w}x${h}x${bps}`;
  if (animCodec.memo.has(key)) return animCodec.memo.get(key);
  const job = (async () => {
    if (animCodec.broken || typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined' || typeof VideoEncoder.isConfigSupported !== 'function') return null;
    if (w % 2 || h % 2) return null;
    const codecs = ['avc1.42E01F', 'avc1.42E01E', 'avc1.42001F', 'avc1.42001E'];
    for (let i = 0; i < codecs.length; i++) {
      const cfg = { codec: codecs[i], width: w, height: h, bitrate: bps, framerate: 30, avc: { format: 'avc' } };
      try { const r = await VideoEncoder.isConfigSupported(cfg); if (r && r.supported) return cfg; } catch {}
    }
    return null;
  })();
  animCodec.memo.set(key, job);
  return job;
}
function animRecordCodec({ paint, len, signal, onTick, w, h, cfg }) {
  return new Promise((resolve, reject) => {
    const cv = animCanvas(w, h);
    const ctx = cv.getContext('2d');
    const samples = [];
    let desc = null;
    let bad = null;
    let enc = null;
    try {
      enc = new VideoEncoder({
        output: (chunk, meta) => {
          const d = meta && meta.decoderConfig && meta.decoderConfig.description;
          if (d && !desc) desc = d instanceof ArrayBuffer ? new Uint8Array(d.slice(0)) : new Uint8Array(d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          samples.push({ ts: chunk.timestamp, key: chunk.type === 'key', data });
        },
        error: (e) => { bad = e || new Error('encoder'); },
      });
      enc.configure(cfg);
      paint(ctx, 0);
    } catch (e) { animCodec.broken = true; try { if (enc) enc.close(); } catch {} reject(e); return; }
    let n = 0;
    let lastAt = -1;
    let over = false;
    const push = (t) => {
      if (enc.encodeQueueSize > 6) return;
      let f = null;
      try {
        f = new VideoFrame(cv, { timestamp: Math.round(t * 1000), duration: 33333 });
        enc.encode(f, { keyFrame: n % 30 === 0 });
        n += 1;
        lastAt = t;
      } catch (e) { bad = bad || e; }
      try { if (f) f.close(); } catch {}
    };
    const end = async () => {
      if (over) return;
      over = true;
      clearTimeout(guard);
      try {
        if (signal.stopped) throw new Error('stopped');
        if (bad) throw bad;
        await enc.flush();
        try { enc.close(); } catch {}
        if (bad || !desc || !samples.length) throw bad || new Error('empty');
        resolve(new Blob([mp4Mux({ w, h, desc, samples })], { type: 'video/mp4' }));
      } catch (e) {
        try { enc.close(); } catch {}
        if (!signal.stopped && e && e.message !== 'stopped') animCodec.broken = true;
        reject(e);
      }
    };
    const guard = setTimeout(() => { signal.late = true; end(); }, len + 6000);
    push(0);
    const t0 = performance.now();
    let shown = 0;
    const tick = () => {
      if (over) return;
      if (signal.stopped || bad) { end(); return; }
      const t = performance.now() - t0;
      if (paint(ctx, t) === false) { if (onTick) onTick(1); end(); return; }
      if (t - lastAt >= 31) push(t);
      if (onTick && t - shown > 90) { shown = t; onTick(Math.min(1, t / len)); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
export async function animRecord(opts) {
  const w = opts.w || ANIM_PX;
  const h = opts.h || w;
  const cfg = await animCodecConfig(w, h, opts.bps || 650000);
  if (cfg && !opts.signal.stopped) return animRecordCodec({ ...opts, w, h, cfg });
  return animRecordMr(opts);
}
function animRecordMr({ paint, len, signal, onTick, w, h, bps }) {
  return new Promise((resolve, reject) => {
    const mime = animRecordMime();
    const cv = animCanvas(w || ANIM_PX, h);
    const ctx = cv.getContext('2d');
    let stream = null;
    let rec = null;
    try {
      paint(ctx, 0);
      stream = cv.captureStream(30);
      rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bps || 650000 });
    } catch (e) { reject(e); return; }
    const chunks = [];
    let bytes = 0;
    let over = false;
    const finish = () => { if (over) return; over = true; try { rec.stop(); } catch {} };
    rec.ondataavailable = (e) => { if (e.data && e.data.size) { chunks.push(e.data); bytes += e.data.size; } };
    rec.onstop = () => {
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      if (signal.stopped) reject(new Error('stopped'));
      else resolve(new Blob(chunks, { type: mime.split(';')[0] }));
    };
    const guard = setTimeout(() => { signal.late = true; finish(); }, len + 6000);
    const drain = () => {
      const d0 = Date.now();
      let seen = bytes;
      let quiet = 0;
      const look = () => {
        if (over) return;
        if (signal.stopped) { finish(); return; }
        try { rec.requestData(); } catch {}
        setTimeout(() => {
          if (bytes === seen) quiet += 1; else { quiet = 0; seen = bytes; }
          if (quiet >= 2 || Date.now() - d0 > 2500) { clearTimeout(guard); finish(); } else look();
        }, 160);
      };
      look();
    };
    const t0 = performance.now();
    let shown = 0;
    const tick = () => {
      if (over) return;
      if (signal.stopped) { clearTimeout(guard); finish(); return; }
      const t = performance.now() - t0;
      if (paint(ctx, t) === false) { if (onTick) onTick(1); drain(); return; }
      if (onTick && t - shown > 90) { shown = t; onTick(Math.min(1, t / len)); }
      requestAnimationFrame(tick);
    };
    try { rec.start(200); } catch (e) { clearTimeout(guard); reject(e); return; }
    requestAnimationFrame(tick);
  });
}
const ANIM_FIX_KEY = 'zchat-anim-fixed';
function animFixRead() { try { const v = JSON.parse(localStorage.getItem(ANIM_FIX_KEY) || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; } }
function animFixNote(path, val) {
  const m = animFixRead();
  m[path] = val;
  const keys = Object.keys(m);
  if (keys.length > 24) keys.slice(0, keys.length - 24).forEach((k) => { delete m[k]; });
  try { localStorage.setItem(ANIM_FIX_KEY, JSON.stringify(m)); } catch {}
}
export function animNeedsCheck(path) {
  if (!path || typeof VideoEncoder === 'undefined') return false;
  const v = animFixRead()[path];
  return !(v === 'ok' || (typeof v === 'number' && v >= 2));
}
async function animFixOne(uid, job, alive) {
  const { col, path, w, h, bps, max } = job;
  const url = avatarAnimSrc(path);
  if (!url || !alive()) return null;
  let buf = null;
  try { const r = await fetch(url, { cache: 'force-cache' }); if (!r.ok) return null; buf = await r.arrayBuffer(); } catch { return null; }
  if (!alive()) return null;
  if (mp4IsOurs(buf)) { animFixNote(path, 'ok'); return null; }
  const cfg = await animCodecConfig(w, h, bps);
  if (!cfg || !alive()) return null;
  const tries = (typeof animFixRead()[path] === 'number' ? animFixRead()[path] : 0) + 1;
  animFixNote(path, tries);
  const src = URL.createObjectURL(new Blob([buf], { type: /\.webm$/i.test(path) ? 'video/webm' : 'video/mp4' }));
  const v = document.createElement('video');
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.preload = 'auto';
  try {
    const okLoad = await new Promise((res) => {
      const done = (x) => { clearTimeout(tm); v.onloadeddata = null; v.onerror = null; res(x); };
      const tm = setTimeout(() => done(false), 8000);
      v.onloadeddata = () => done(true);
      v.onerror = () => done(false);
      v.src = src;
    });
    if (!okLoad || !v.videoWidth || !alive() || document.visibilityState !== 'visible') return null;
    await v.play();
    const signal = { stopped: false };
    const watch = setInterval(() => { if (!alive() || document.visibilityState !== 'visible') signal.stopped = true; }, 250);
    let clip = null;
    try {
      clip = await animRecordCodec({
        len: max, signal, w, h, cfg,
        paint: (ctx, t) => {
          if (t > 0 && (v.ended || t > max)) return false;
          ctx.drawImage(v, 0, 0, w, h);
          return true;
        },
      });
    } finally { clearInterval(watch); }
    if (!clip || clip.size < 2000 || !alive()) return null;
    const up = await uploadMediaRaw(new File([clip], `${col === 'cover_anim' ? 'cover' : 'avatar'}.mp4`, { type: 'video/mp4' }), uid);
    if (!up || up.error || !up.url || !alive()) return null;
    const s0 = String(up.url);
    const i = s0.lastIndexOf(`${uid}/`);
    let next = i < 0 ? '' : s0.slice(i).split(/[?#]/)[0];
    try { next = decodeURIComponent(next); } catch {}
    if (!avatarAnimSrc(next)) return null;
    const { error } = await supabase.from('profiles').update({ [col]: next }).eq('id', uid);
    if (error) return null;
    animFixNote(path, 'ok');
    animFixNote(next, 'ok');
    return { [col]: next };
  } catch { return null; } finally {
    try { v.pause(); v.removeAttribute('src'); v.load(); } catch {}
    setTimeout(() => URL.revokeObjectURL(src), 1000);
  }
}
export async function animRepairRun(me, alive, onPatch) {
  const uid = me && me.id;
  if (!uid) return;
  const jobs = [];
  if (animNeedsCheck(me.avatar_anim)) jobs.push({ col: 'avatar_anim', path: me.avatar_anim, w: ANIM_PX, h: ANIM_PX, bps: 650000, max: 3150 });
  if (animNeedsCheck(me.cover_anim)) jobs.push({ col: 'cover_anim', path: me.cover_anim, w: 780, h: 300, bps: 1500000, max: 8200 });
  for (let k = 0; k < jobs.length; k++) {
    if (!alive()) return;
    const patch = await animFixOne(uid, jobs[k], alive);
    if (patch && alive() && onPatch) onPatch(patch);
  }
}
export function animSeek(v, t) {
  return new Promise((res) => {
    if (Math.abs(v.currentTime - t) < 0.01 && v.readyState >= 2) { res(); return; }
    const done = () => { v.removeEventListener('seeked', done); clearTimeout(tm); res(); };
    const tm = setTimeout(done, 2500);
    v.addEventListener('seeked', done);
    try { v.currentTime = t; } catch { done(); }
  });
}
export function animDuration(v) {
  return new Promise((res) => {
    if (Number.isFinite(v.duration) && v.duration > 0) { res(v.duration); return; }
    let tm = 0;
    const done = () => { v.removeEventListener('durationchange', on); clearTimeout(tm); const d = Number.isFinite(v.duration) ? v.duration : 0; try { v.currentTime = 0; } catch {} res(d); };
    const on = () => { if (Number.isFinite(v.duration) && v.duration > 0) done(); };
    tm = setTimeout(done, 3000);
    v.addEventListener('durationchange', on);
    try { v.currentTime = 1e101; } catch { done(); }
  });
}

export const STORY_REF_W = 360;
export function hexRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function hexLum(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function StudioDark({ children }) {
  const ctx = useTheme();
  const value = useMemo(() => (ctx.theme.dark ? ctx : { ...ctx, dark: true, theme: { ...ctx.theme, ...THEMES.dark, dark: true, pureBlack: false } }), [ctx]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function StudioTool({ label, aria, glyph, onClick, on, pressed, danger, disabled, ink, sub, accent, width = 56, keepFocus }) {
  const { theme } = useTheme();
  const base = ink || theme.ink;
  const fg = danger ? theme.danger : on ? (accent || kitOnInk(theme)) : base;
  const lab = danger || on ? fg : (sub || theme.ink2);
  return (
    <button type="button" aria-label={aria || label} aria-pressed={pressed} disabled={disabled}
      onPointerDown={keepFocus ? (e) => e.preventDefault() : undefined}
      onClick={(e) => { if (disabled) return; hapticTap(); if (onClick) onClick(e); }} className="zchat-press"
      style={{ width, minWidth: 0, flexShrink: 0, height: 50, padding: 0, border: 'none', background: 'transparent', color: fg, fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.38 : 1, WebkitTapHighlightColor: 'transparent', transition: 'color 160ms ease, opacity 160ms ease' }}>
      <span aria-hidden="true" style={{ height: 27, minWidth: 27, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{glyph}</span>
      <span style={{ maxWidth: '100%', fontSize: 11.5, lineHeight: '14px', fontWeight: on ? 700 : 600, color: lab, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 160ms ease' }}>{label}</span>
    </button>
  );
}
export function PhotoFindIcon({ size = 24, color = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M11 3.5H6A2.5 2.5 0 0 0 3.5 6v12A2.5 2.5 0 0 0 6 20.5h6" />
      <path d="M3.8 16.6l4.3-4.2 2.9 2.8" />
      <circle cx="8.6" cy="8.4" r="1.6" />
      <circle cx="17" cy="14" r="3.6" />
      <path d="M19.6 16.6l2 2" />
    </svg>
  );
}
const trendingMem = { at: 0, rows: null, job: null };
const TAG_RE = /#([\p{L}\p{N}_]{2,40})/gu;
function tagsInText(text) {
  const out = [];
  const s = String(text || '');
  let m;
  TAG_RE.lastIndex = 0;
  while ((m = TAG_RE.exec(s))) { const t = m[1].toLowerCase(); if (!out.includes(t)) out.push(t); }
  return out;
}
export function loadTrendingTags(force) {
  if (!force && trendingMem.rows && Date.now() - trendingMem.at < 10 * 60000) return Promise.resolve(trendingMem.rows);
  if (trendingMem.job) return trendingMem.job;
  trendingMem.job = (async () => {
    let rows = null;
    try {
      const { data, error } = await supabase.rpc('zchat_trending_tags', { p_days: 7, p_limit: 24 });
      if (!error && Array.isArray(data)) rows = data.map((r) => ({ tag: String(r.tag || '').toLowerCase(), n: Number(r.n) || 0, sample: r.sample_url || null, sampleId: r.sample_id || null })).filter((r) => r.tag);
    } catch {}
    if (!rows) {
      try {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data } = await supabase.from('posts').select('id, caption, media_url, created_at').gt('created_at', since).ilike('caption', '%#%').order('created_at', { ascending: false }).limit(400);
        const map = new Map();
        (data || []).forEach((po) => { tagsInText(po.caption).forEach((t) => { const cur = map.get(t) || { tag: t, n: 0, sample: po.media_url, sampleId: po.id }; cur.n += 1; map.set(t, cur); }); });
        rows = Array.from(map.values()).sort((a, b) => b.n - a.n).slice(0, 24);
      } catch { rows = []; }
    }
    trendingMem.rows = rows;
    trendingMem.at = Date.now();
    trendingMem.job = null;
    return rows;
  })();
  return trendingMem.job;
}
export function useTrendingTags() {
  const [rows, setRows] = useState(() => trendingMem.rows);
  useEffect(() => { let alive = true; loadTrendingTags().then((r) => { if (alive) setRows(r); }); return () => { alive = false; }; }, []);
  return rows;
}
export function TagSuggestBar({ text, onPick, dark = true }) {
  const rows = useTrendingTags();
  const m = String(text || '').match(/(?:^|\s)#([\p{L}\p{N}_]*)$/u);
  if (!m || !rows || !rows.length) return null;
  const q = m[1].toLowerCase();
  const list = rows.filter((r) => r.tag.startsWith(q) && r.tag !== q).slice(0, 8);
  if (!list.length) return null;
  const line = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)';
  return (
    <div role="list" aria-label="Tag suggestions" style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 4px 0', color: dark ? '#FFFFFF' : '#111113' }}>
      {list.map((r, i) => (
        <React.Fragment key={r.tag}>
          {i > 0 && <span aria-hidden="true" style={{ width: 1, height: 18, flexShrink: 0, background: line }} />}
          <div role="listitem" aria-label={`Use tag ${r.tag}`} onPointerDown={(e) => e.preventDefault()} onClick={() => onPick(r.tag, m[1])} className="zchat-press" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', cursor: 'pointer' }}>
            <LineGlyph k="hash" size={15} sw={2.6} style={{ opacity: 0.7 }} />
            <span style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{r.tag}</span>
            <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.6, whiteSpace: 'nowrap' }}>{formatCount(r.n)} {r.n === 1 ? 'post' : 'posts'}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
export function applyTagPick(text, typed, tag) {
  const s = String(text || '');
  const cut = s.length - typed.length - 1;
  return `${s.slice(0, Math.max(0, cut))}#${tag} `;
}
export function TagThumb({ tag, sample, sub, onOpen, size = 64 }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label={`Tag ${tag}`} onClick={() => onOpen(tag)} className="zchat-press" style={{ width: size + 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: size, height: size, borderRadius: Math.round(size * 0.28), overflow: 'hidden', background: theme.soft, color: theme.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {sample ? <img src={sample} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <LineGlyph k="hash" size={Math.round(size * 0.42)} />}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', boxShadow: `inset 0 0 0 1px ${theme.hair}`, pointerEvents: 'none' }} />
      </div>
      <div style={{ marginTop: 7, maxWidth: '100%', fontSize: 12.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{tag}</div>
      {sub && <div style={{ maxWidth: '100%', fontSize: 11, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
}
export const DECOR_PIECES = ['frame', 'nameplate', 'effect'];
export const FX_PACK_SI = '/fx-pack-si.js';
export const FX_ART = { crystal_phoenix: '/fx-crystal-phoenix.webp', fire_phoenix: '/fx-fire-phoenix.webp' };
export function ThemeMockProfile({ me, dark, nsKey }) {
  const ink = dark ? '#F4F4F6' : '#111113';
  const muted = dark ? 'rgba(235,235,245,0.62)' : 'rgba(17,17,19,0.58)';
  const name = (me && (me.name || me.username)) || 'You';
  return (
    <div style={{ position: 'relative', padding: '64px 18px 0', color: ink, ...ptTextFx(dark) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ borderRadius: '50%', boxShadow: `0 0 0 3px ${dark ? '#0C0C0E' : '#FFFFFF'}` }}><Avatar emoji={me && me.avatar} name={name} size={84} /></div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-around' }}>
          {[['posts', 12], ['followers', 248], ['following', 180]].map(([l, v]) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{v}</div>
              <div style={{ fontSize: 12.5, color: muted }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(nsKey ? NS_ROOM : null) }}>{nsKey ? <StyledName name={name} k={nsKey} dark={dark} /> : name}</div>
      <div style={{ fontSize: 13.5, color: muted, marginTop: 1 }}>@{(me && me.username) || 'you'}</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        {['Edit profile', 'Share profile'].map((t) => <div key={t} style={{ flex: 1, height: 36, borderRadius: 10, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,19,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{t}</div>)}
      </div>
    </div>
  );
}

export function DecorConfetti({ colors }) {
  const pieces = Array.from({ length: 26 }, (_, i) => i);
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      {pieces.map((i) => (
        <span key={i} style={{ position: 'absolute', top: -20, left: `${(i * 37) % 100}%`, width: 7, height: 12, borderRadius: 2, background: colors[i % colors.length], opacity: 0.9, animation: `zchat-confetti ${1.9 + (i % 5) * 0.3}s linear ${(i % 7) * 0.08}s 1 both` }} />
      ))}
    </div>
  );
}

export const dropsMem = { uid: null, list: null, mine: new Set(), at: 0 };
export const dropArtMem = new Map();
export function dropArtReady(key) {
  const set = DECOR_BY_KEY[key];
  if (!set) return Promise.resolve(false);
  if (!dropArtMem.has(key)) dropArtMem.set(key, Promise.all([appFileOk(`/set-${set.file}-frame.webp`), appFileOk(`/set-${set.file}-plate.webp`)]).then((r) => r.every((v) => v !== false)));
  return dropArtMem.get(key);
}
const dropSubs = new Set();
export async function loadDrops(uid, force) {
  if (!force && dropsMem.list && dropsMem.uid === uid && Date.now() - dropsMem.at < 60000) return dropsMem.list;
  try {
    const { data, error } = await supabase.from('drops').select('id, kind, item_key, title, blurb, price, starts_at, ends_at').gt('ends_at', new Date().toISOString()).order('starts_at', { ascending: true }).limit(6);
    if (error) throw error;
    const known = (data || []).filter((d) => (d.kind === 'set' ? !!DECOR_BY_KEY[d.item_key] : !!CHAR_BUBBLES[d.item_key]));
    const ready = await Promise.all(known.map((d) => (d.kind === 'set' ? dropArtReady(d.item_key) : true)));
    const list = known.filter((d, i) => ready[i]);
    let mine = new Set();
    if (uid && list.length) {
      const { data: rem } = await supabase.from('drop_reminders').select('drop_id').eq('user_id', uid).in('drop_id', list.map((d) => d.id));
      mine = new Set((rem || []).map((r) => r.drop_id));
    }
    Object.assign(dropsMem, { uid, list, mine, at: Date.now() });
  } catch {
    if (!dropsMem.list || dropsMem.uid !== uid) Object.assign(dropsMem, { uid, list: [], mine: new Set(), at: Date.now() });
  }
  dropSubs.forEach((fn) => { try { fn(); } catch {} });
  return dropsMem.list;
}
export function useDrops(uid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    dropSubs.add(fn);
    loadDrops(uid);
    return () => { dropSubs.delete(fn); };
  }, [uid]);
  return dropsMem.uid === uid ? dropsMem.list : null;
}
export function useSpendLimit(uid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    limitMem.subs.add(fn);
    loadSpendLimit(uid, true);
    const onW = () => loadSpendLimit(uid, true);
    window.addEventListener('zchat-wallet', onW);
    return () => { limitMem.subs.delete(fn); window.removeEventListener('zchat-wallet', onW); };
  }, [uid]);
  limitWarm(uid);
  return limitMem.uid === uid ? limitMem.data : null;
}
export const shopMem = { popular: null, popularAt: 0, popularJob: null, deal: null, dealAt: 0, dealJob: null };
export function shopKnown(kind, key) {
  return kind === 'set' ? isDecorKey(key) && !DECOR_BY_KEY[key].drop : kind === 'bubble' ? !!CHAR_BUBBLES[key] : kind === 'charm' ? !!CUSTOM_BADGES[key] && !!shopPrice('charm', key) : cxKnown(kind, key);
}
export function shopWarm() {
  if (shopMem.warm) return;
  shopMem.warm = true;
  try {
    const o = JSON.parse(localStorage.getItem('zchat-shop-cache') || 'null');
    if (!o || typeof o !== 'object') return;
    if (!shopMem.popular && Array.isArray(o.popular)) shopMem.popular = o.popular.filter((r) => r && shopKnown(r.kind, r.key));
    const d = o.deal;
    if (shopMem.deal === null && d && Date.parse(d.ends_at) > Date.now() && shopKnown(d.kind, d.key) && Number(d.price) > 0) shopMem.deal = d;
  } catch {}
}
export function shopSave() {
  try { localStorage.setItem('zchat-shop-cache', JSON.stringify({ popular: shopMem.popular || [], deal: shopMem.deal || null })); } catch {}
}
function loadDeal(force) {
  shopWarm();
  const d = shopMem.deal;
  if (!force && d !== null && Date.now() - shopMem.dealAt < 600000 && (!d || Date.parse(d.ends_at) > Date.now())) return Promise.resolve(d);
  if (shopMem.dealJob) return shopMem.dealJob;
  shopMem.dealJob = supabase.rpc('zchat_deal_today')
    .then(({ data, error }) => {
      const row = Array.isArray(data) ? data[0] : data;
      const ok = !error && row && typeof row === 'object' && row.key && Number(row.price) > 0 && Number(row.was) > Number(row.price);
      const known = ok && (row.kind === 'set' ? isDecorKey(row.key) && !DECOR_BY_KEY[row.key].drop : row.kind === 'bubble' ? !!CHAR_BUBBLES[row.key] : row.kind === 'charm' ? !!CUSTOM_BADGES[row.key] : cxKnown(row.kind, row.key));
      shopMem.deal = known ? { kind: row.kind, key: row.key, price: Number(row.price), was: Number(row.was), ends_at: row.ends_at } : false;
      shopMem.dealAt = Date.now();
      shopSave();
      return shopMem.deal;
    }, () => { shopMem.deal = false; shopMem.dealAt = Date.now(); return false; })
    .then((v) => { shopMem.dealJob = null; shopPing(); return v; });
  return shopMem.dealJob;
}
export function useDeal() {
  useShopTick();
  shopWarm();
  useEffect(() => { loadDeal(); }, []);
  const d = shopMem.deal;
  return d && Date.parse(d.ends_at) > Date.now() ? d : null;
}
export async function buyDeal(kind, key) {
  const { data, error } = await supabase.rpc('zchat_buy_deal', { p_kind: kind, p_key: key });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) return { error: rpcFailText('Deal', error, 'Deals switch on once the latest ZChat setup is finished.') };
  if (!row || !row.ok) { loadDeal(true); return { error: (row && row.reason) || 'That did not work. Try again.' }; }
  return { ok: true, got: row.got || [], coins: row.coins };
}
export function msWarm(uid) {
  if (!uid || (msMem.uid === uid && msMem.data)) return;
  if (msMem.uid !== uid) { Object.assign(msMem, { uid, data: null, job: null }); msMem.pend.clear(); }
  try {
    const o = JSON.parse(localStorage.getItem(`zchat-milestones-${uid}`) || 'null');
    if (o && typeof o === 'object' && Array.isArray(o.claimed)) msMem.data = { count: Number(o.count) || 0, claimed: o.claimed.map(Number) };
  } catch {}
}
export function loadMilestones(uid, force) {
  if (!uid) return Promise.resolve(null);
  msWarm(uid);
  if (!force && msMem.uid === uid && msMem.data) return Promise.resolve(msMem.data);
  if (msMem.job && msMem.uid === uid) return msMem.job;
  msMem.uid = uid;
  const job = supabase.rpc('zchat_milestones')
    .then(({ data, error }) => {
      if (msMem.uid !== uid) return null;
      const row = Array.isArray(data) ? data[0] : data;
      if (error && msMem.data && !msMem.data.off) return msMem.data;
      msMem.data = !error && row && typeof row === 'object' ? { count: Number(row.count) || 0, claimed: [...new Set([...(Array.isArray(row.claimed) ? row.claimed.map(Number) : []), ...msMem.pend])].sort((a, b) => a - b) } : { count: 0, claimed: [], off: true };
      try { if (!msMem.data.off) localStorage.setItem(`zchat-milestones-${uid}`, JSON.stringify(msMem.data)); } catch {}
      return msMem.data;
    }, () => { if (msMem.uid !== uid) return null; if (!msMem.data) msMem.data = { count: 0, claimed: [], off: true }; return msMem.data; })
    .then((v) => { if (msMem.job === job) msMem.job = null; shopPing(); return v; });
  msMem.job = job;
  return job;
}

export function SegTabs({ items, value, onChange, style }) {
  const at = Math.max(0, items.findIndex(([k]) => k === value));
  return (
    <div role="tablist" style={{ position: 'relative', display: 'flex', padding: 3, borderRadius: 12, background: CL.card2, ...(style || {}) }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: `calc((100% - 6px) / ${items.length})`, borderRadius: 9, background: CL.thumb, boxShadow: '0 1px 4px rgba(0,0,0,0.35)', transform: `translateX(${at * 100}%)`, transition: reducedMotion() ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.85, 0.3, 1)' }} />
      {items.map(([k, label]) => (
        <div key={k} role="tab" aria-selected={value === k} aria-label={label} onClick={() => { if (value !== k) { hapticTap(); onChange(k); } }}
          style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: items.length > 5 ? 12.5 : 13.5, fontWeight: 600, color: value === k ? CL.ink : CL.ink2, cursor: 'pointer', transition: 'color 0.2s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 2px' }}>{label}</div>
      ))}
    </div>
  );
}
export function EditionLine({ n, left, size = 12.5, style }) {
  if (n) {
    const first = n <= EDITION_FIRST;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: size, color: CL.ink2, lineHeight: 1.3, ...(style || {}) }}>
        {first && <EditionSeal size={size} />}
        <span>You own <span style={{ color: first ? CL.gold : CL.ink, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{editionText(n)}</span>{first ? ', a first edition' : ''}</span>
      </div>
    );
  }
  if (left > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: size, color: CL.ink2, lineHeight: 1.3, ...(style || {}) }}>
        <EditionSeal size={size} />
        <span><span style={{ color: CL.gold, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>{left}</span> first {left === 1 ? 'edition' : 'editions'} left</span>
      </div>
    );
  }
  return null;
}

export function SetCard({ set, me, own, wearing, width, onOpen, owned = false, free = false, mark = false, edition = null }) {
  const missing = 3 - (own.count || 0);
  return (
    <div role="button" aria-label={`${set.name} set${mark ? ', Owned' : ''}${edition ? `, number ${Math.floor(edition).toLocaleString()}` : ''}`} onClick={onOpen} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 1px ${wearing ? set.accent : CL.line}`, display: 'flex', flexDirection: 'column' }}>
      {edition ? <EditionTag n={edition} size={11} style={{ position: 'absolute', top: 10, right: 11, zIndex: 1 }} /> : null}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 4px 0' }}>
        <DecorHero frameKey={set.key} plateKey={set.key} width={width} photo={me.avatar} name={me.name} lazy compact gapColor={CL.card} />
      </div>
      <div style={{ padding: '6px 12px 12px', minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{set.name}</div>
        <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minWidth: 0 }}>
          <RarityTag rarity={set.rarity} size={11.5} />
          {owned
            ? (wearing ? <CollPrice wearing size={12.5} /> : mark ? <CollPrice full size={13} /> : <PieceDots own={own} />)
            : <CollPrice price={missing * decorPartPrice(set.key)} free={free} size={13} />}
        </div>
      </div>
    </div>
  );
}
export function siWord(kind) { return kind === 'stickerpack' ? 'sticker pack' : kind === 'soundpack' ? 'sound pack' : kind === 'gamekit' ? 'game style' : 'typing style'; }
export function siAccent(kind, k) {
  const sp = siSpec(kind, k);
  if (kind === 'typing') return k === 'hearts' ? '#FF6F91' : k === 'sparks' ? '#FFC94D' : k === 'wave' || k === 'bubbles' ? '#5BC0EB' : CL.accent;
  return sp && sp.accent ? sp.accent : CL.accent;
}
export function shopKindWord(kind) {
  if (SI_KINDS.includes(kind)) return siWord(kind);
  if (kind === 'wallpaper') return 'live wallpaper';
  if (kind === 'set') return 'set';
  if (kind === 'bubble') return 'bubble';
  if (kind === 'charm') return 'charm';
  return cxWord(kind);
}
export const shopOwnersMem = new Map();
const shopOwnersSubs = new Set();
function loadShopOwners(kind, key) {
  const id = `${kind}:${key}`;
  if (shopOwnersMem.has(id)) return Promise.resolve(shopOwnersMem.get(id));
  const job = supabase.rpc('zchat_shop_owners', { p_kind: kind, p_key: key })
    .then(({ data, error }) => {
      const n = error ? null : Number(Array.isArray(data) ? data[0] : data);
      shopOwnersMem.set(id, Number.isFinite(n) ? n : null);
      shopOwnersSubs.forEach((fn) => { try { fn(); } catch {} });
      return shopOwnersMem.get(id);
    }, () => { shopOwnersMem.set(id, null); return null; });
  shopOwnersMem.set(id, job);
  return job;
}
export function useShopOwners(kind, key) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    shopOwnersSubs.add(fn);
    if (kind && key) loadShopOwners(kind, key);
    return () => { shopOwnersSubs.delete(fn); };
  }, [kind, key]);
  const v = shopOwnersMem.get(`${kind}:${key}`);
  return typeof v === 'number' ? v : null;
}

export function BubbleTileDark({ k, on, status, tone, onPick, edition = null }) {
  const spec = CHAR_BUBBLES[k];
  const label = spec ? spec.label : 'Classic';
  return (
    <div role="button" aria-label={`Bubble ${label}${status ? `, ${status}` : ''}${edition ? `, number ${Math.floor(edition).toLocaleString()}` : ''}`} aria-pressed={on} onClick={onPick} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, borderRadius: 18, padding: '16px 12px 12px', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? CL.accent : CL.line}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {edition ? <EditionTag n={edition} size={11} style={{ position: 'absolute', top: 10, right: 11 }} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 60, justifyContent: 'flex-end', paddingRight: 2 }}>
        <CharBubbleSample k={k} text="Hi there" cw={44} fontSize={13.5} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        {tone === 'coin'
          ? <CollPrice price={Number(status)} size={13} />
          : status ? <span style={{ fontSize: 12.5, fontWeight: 600, color: tone === 'use' ? '#B9A6FF' : tone === 'own' ? CL.own : CL.gold, flexShrink: 0 }}>{status}</span> : null}
      </div>
    </div>
  );
}

export function WishHeart({ on, onToggle, size = 40, light = false }) {
  return (
    <div role="button" aria-label={on ? 'Remove from your wishlist' : 'Add to your wishlist'} aria-pressed={on} onClick={(e) => { e.stopPropagation(); onToggle(); }} className="zchat-press"
      style={{ width: size, height: size, borderRadius: size / 2, background: light ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.4 16.1 3 13.1 3 9.3 3 6.6 5.1 4.5 7.7 4.5c1.7 0 3.2.9 4.3 2.3 1.1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2.1 4.7 4.8 0 3.8-3.4 6.8-8.2 10.8-.2.2-.5.3-.8.3z" fill={on ? '#FF4D6A' : 'none'} stroke={on ? '#FF4D6A' : '#FFFFFF'} strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
export function ShopDayNight({ dark, onChange }) {
  return (
    <div role="tablist" aria-label="Day or night" style={{ position: 'relative', display: 'flex', width: 124, height: 32, padding: 3, boxSizing: 'border-box', borderRadius: 16, flexShrink: 0, background: CL.card2 }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', borderRadius: 13, background: CL.thumb, transform: `translateX(${dark ? 100 : 0}%)`, transition: reducedMotion() ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.85, 0.3, 1)' }} />
      {[['day', 'Day', false], ['night', 'Night', true]].map(([v, l, d]) => (
        <div key={v} role="tab" aria-selected={dark === d} aria-label={l} onClick={() => { if (dark !== d) { hapticTap(); onChange(d); } }} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', color: dark === d ? CL.ink : CL.ink2 }}>{l}</div>
      ))}
    </div>
  );
}
function ShopMockName({ name, nsKey, charm, verified, dark, size = 15, weight = 700 }) {
  const styled = !!(nsKey && (NAME_STYLES[nsKey] || nsOwn(nsKey)));
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', minWidth: 0, maxWidth: '100%', fontSize: size, fontWeight: weight }}>
      <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(styled ? NS_ROOM : null) }}>{styled ? <StyledName name={name} k={nsKey} dark={dark} /> : name}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}><VerifiedBadge tier={verified} custom={charm} size={Math.round(size * 0.92)} /></span>
    </span>
  );
}
export function ShopChatMock({ me, dark = true, bubble = null, nsKey = null, charm = null, group = false, reaction = null }) {
  const stage = useRef(null);
  const cv = useRef(null);
  const bub = useRef(null);
  const [hint, setHint] = useState(false);
  const play = () => {
    if (!reaction || !cv.current || !stage.current || !bub.current || reducedMotion()) return;
    superPack().then((ok) => {
      if (!ok || !window.ZSRX || !cv.current || !stage.current || !bub.current) return;
      const s = stage.current.getBoundingClientRect();
      const b = bub.current.getBoundingClientRect();
      try { window.ZSRX.play(cv.current, reaction, { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height / 2, tx: b.left - s.left + 22, ty: b.bottom - s.top + 2, el: bub.current, dark, solo: true, dprCap: superDpr() }); } catch {}
      setHint(true);
    });
  };
  useEffect(() => {
    if (!reaction) return undefined;
    const t = setTimeout(play, 420);
    return () => { clearTimeout(t); try { if (window.ZSRX && cv.current) { window.ZSRX.stop(cv.current); if (window.ZSRX.drop) window.ZSRX.drop(cv.current); } } catch {} };
  }, [reaction, dark]);
  const T = THEMES[dark ? 'dark' : 'light'];
  const page = dark ? '#0C0C0E' : '#FFFFFF';
  const meName = (me && (me.name || me.username)) || 'You';
  const t = fmtHM(new Date());
  const them = [{ name: 'Nethmi', color: '#29C7B3' }, { name: 'Kasun', color: '#E9A23B' }];
  const rx = reaction ? SUPER_REACTS[reaction] : null;
  const stamp = (mine) => <span style={{ display: 'inline-block', fontSize: 10.5, color: mine ? 'rgba(255,255,255,0.72)' : T.muted, marginLeft: 8, verticalAlign: 'bottom', whiteSpace: 'nowrap' }}>{t}</span>;
  const dayChip = <div style={{ alignSelf: 'center', fontSize: 11.5, fontWeight: 600, color: T.muted, background: T.soft, borderRadius: 10, padding: '3px 10px', marginBottom: 2 }}>Today</div>;
  const incoming = (text, who, withName) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, alignSelf: 'flex-start', maxWidth: '84%', minWidth: 0 }}>
      {group && (who === 'me'
        ? <div style={{ flexShrink: 0 }}><Avatar emoji={me.avatar} name={meName} size={26} /></div>
        : <div style={{ width: 26, height: 26, borderRadius: 13, background: who.color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{who.name[0]}</div>)}
      <div style={{ minWidth: 0 }}>
        {withName && (
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3, paddingLeft: 2, color: who === 'me' ? T.ink : who.color, display: 'flex', minWidth: 0 }}>
            {who === 'me' ? <ShopMockName name={meName} nsKey={nsKey} charm={charm} verified={me.verified} dark={dark} size={12.5} /> : who.name}
          </div>
        )}
        <div style={{ background: T.bubbleThem, color: T.ink, borderRadius: 18, borderBottomLeftRadius: 6, padding: '8px 12px 7px', fontSize: 14.5, lineHeight: 1.3 }}>{text}{stamp(false)}</div>
      </div>
    </div>
  );
  const mine = (text, withMark) => (bubble && CHAR_BUBBLES[bubble]
    ? <CharBubbleSample k={bubble} text={<>{text}{stamp(false)}</>} isMe cw={52} fontSize={14.5} />
    : (
      <div ref={withMark ? bub : undefined} style={{ position: 'relative', alignSelf: 'flex-end', maxWidth: '78%', background: T.bubbleMe, color: dark ? '#FFFFFF' : T.ink, borderRadius: 18, borderBottomRightRadius: 6, padding: '8px 12px 7px', fontSize: 14.5, lineHeight: 1.3, marginBottom: withMark ? 14 : 0 }}>
        {text}{stamp(dark)}
        {withMark && rx && <span style={{ position: 'absolute', bottom: -13, left: 8, padding: '1px 6px', borderRadius: 10, background: T.soft2, boxShadow: '0 1px 4px rgba(0,0,0,0.3)', fontSize: 10.5, color: T.ink }}><SuperMark k={reaction} emoji={rx.base} count={1} /></span>}
      </div>
    ));
  return (
    <div role={reaction ? 'button' : undefined} aria-label={reaction && rx ? `Play ${rx.label}` : undefined} onClick={reaction ? () => { hapticTap(); play(); } : undefined} style={{ borderRadius: 20, background: page, boxShadow: dark ? `inset 0 0 0 1px ${CL.line}` : 'none', overflow: 'hidden', color: T.ink, fontFamily: FONT, cursor: reaction ? 'pointer' : 'default' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: `1px solid ${T.hair}` }}>
        <ArrowLeft size={18} color={T.ink} style={{ flexShrink: 0 }} />
        {group
          ? <div style={{ width: 34, height: 34, borderRadius: 17, background: dark ? '#2A2A33' : '#E6E3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={17} color={T.muted} /></div>
          : <div style={{ width: 34, height: 34, borderRadius: 17, background: them[0].color, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 }}>N</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group ? 'Weekend plans' : them[0].name}</div>
          <div style={{ fontSize: 12, color: group ? T.muted : '#22C55E' }}>{group ? `You, ${them[0].name}, ${them[1].name}` : 'Online'}</div>
        </div>
        <Phone size={18} color={T.ink} style={{ flexShrink: 0 }} />
      </div>
      <div ref={stage} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 12px', minHeight: reaction ? 236 : 0, justifyContent: reaction ? 'flex-end' : 'flex-start' }}>
        {dayChip}
        {group ? (
          <>
            {incoming('Who is coming on Saturday?', them[0], true)}
            {incoming('Count me in', 'me', true)}
            {incoming('Same here', them[1], true)}
          </>
        ) : reaction ? (
          <>
            {incoming('I passed my driving test', them[0], false)}
            {mine('No way, well done', true)}
          </>
        ) : (
          <>
            {incoming('Is that a new bubble?', them[0], false)}
            {mine('Yes, I got it today')}
            {incoming('It suits you', them[0], false)}
            {mine('Thanks, I love it')}
          </>
        )}
        {reaction && <canvas ref={cv} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />}
        {reaction && <div style={{ position: 'absolute', left: 0, right: 0, top: 10, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: T.muted, opacity: hint ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>Tap to play it again</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 12px' }}>
        <div style={{ flex: 1, height: 38, borderRadius: 19, background: T.inputBg, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: T.muted }}>Message</div>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: '#7C5CFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} color="#FFFFFF" /></div>
      </div>
    </div>
  );
}
export function ShopProfileMock({ me, frameKey = null, plateKey = null, charm, nsKey, width, dark = true }) {
  const T = THEMES[dark ? 'dark' : 'light'];
  const page = dark ? '#0C0C0E' : '#FFFFFF';
  const name = (me && (me.name || me.username)) || 'You';
  const F = isDecorKey(frameKey) ? frameKey : null;
  const P = isDecorKey(plateKey) ? plateKey : null;
  const W = Math.round(Math.max(220, Math.min(380, width - 28)));
  return (
    <div style={{ borderRadius: 20, background: page, boxShadow: dark ? `inset 0 0 0 1px ${CL.line}` : 'none', padding: '18px 14px 16px', color: T.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', fontFamily: FONT }}>
      <div data-fx-hero="1" style={{ display: 'flex', justifyContent: 'center', maxWidth: '100%' }}>
        {F || P
          ? <DecorHero frameKey={F} plateKey={P} width={W} photo={me.avatar} name={name} username={me.username} verified={me.verified} custom={charm} nsk={nsKey} gapColor={page} />
          : <Avatar emoji={me.avatar} name={name} size={96} />}
      </div>
      {!P && (
        <div style={{ textAlign: 'center', marginTop: F ? 2 : 10, maxWidth: '100%', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', minWidth: 0, letterSpacing: '-0.02em' }}><ShopMockName name={name} nsKey={nsKey} charm={charm} verified={me.verified} dark={dark} size={21} weight={800} /></div>
          <div style={{ fontSize: 13.5, color: T.muted, marginTop: 1 }}>@{me.username || 'you'}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 14, width: '100%', maxWidth: 360 }}>
        {['Edit profile', 'Share profile'].map((l) => <div key={l} style={{ flex: 1, height: 34, borderRadius: 10, background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,19,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 700 }}>{l}</div>)}
      </div>
    </div>
  );
}
export function ShopPagePill({ coins, onOpenWallet }) {
  return <div role="button" aria-label={`${formatCount(coins)} coins`} onClick={onOpenWallet} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 12px 0 10px', borderRadius: 17, background: CL.card2, fontSize: 14.5, fontWeight: 650, color: CL.ink, cursor: 'pointer', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={18} />{formatCount(coins)}</div>;
}
export function siRoute(open) { return !!open && (SI_KINDS.includes(open.kind) || (open.kind === 'namestyle' && open.key === 'own')); }

export const collectionsMem = { uid: null, list: null };
export async function loadCollections(uid, force) {
  if (!force && collectionsMem.uid === uid && collectionsMem.list) return collectionsMem.list;
  const { data, error } = await supabase.from('saved_collections').select('*').eq('user_id', uid).order('created_at', { ascending: true }).limit(100);
  const list = error ? [] : (data || []);
  collectionsMem.uid = uid;
  collectionsMem.list = list;
  return list;
}
export function draftExt(file, kind) {
  const fromName = (String((file && file.name) || '').match(/\.([a-z0-9]{2,5})$/i) || [])[1];
  const fromType = String((file && file.type) || '').split('/')[1] || '';
  return String(fromName || fromType.replace(/[^a-z0-9]/gi, '').slice(0, 5) || (kind === 'video' ? 'mp4' : 'jpg')).toLowerCase();
}
export async function openDraftFull(d) {
  if (!d || !d.remote) return d;
  const r = d.row || {};
  const meta = r.data || {};
  const items = Array.isArray(meta.items) ? meta.items : [];
  const paths = items.map((x) => x.path).filter(Boolean);
  if (!paths.length) return null;
  let signed = [];
  try { const { data } = await supabase.storage.from('chat-private').createSignedUrls(paths, 600); signed = data || []; } catch { return null; }
  const urlOf = {};
  signed.forEach((x) => { if (x && x.signedUrl) urlOf[x.path] = x.signedUrl; });
  const full = [];
  for (const x of items) {
    const u = urlOf[x.path];
    if (!u) return null;
    let b = null;
    try { const res = await fetch(u); if (res.ok) b = await res.blob(); } catch {}
    if (!b) return null;
    const type = b.type && b.type !== 'application/octet-stream' ? b.type : x.kind === 'video' ? 'video/mp4' : 'image/jpeg';
    full.push({ ...x, file: new File([b], `draft-${full.length}.${draftExt({ type }, x.kind)}`, { type }) });
  }
  const rec = { id: d.id, uid: d.uid, at: d.at, kind: d.kind, caption: meta.caption || '', collab: meta.collab || null, items: full, thumbPath: r.thumb || undefined, synced: Date.now() };
  if (meta.sensitive) rec.sensitive = true;
  ['place', 'sticker', 'song', 'shared'].forEach((k) => { if (meta[k]) rec[k] = meta[k]; });
  if (Array.isArray(meta.mentions) && meta.mentions.length) rec.mentions = meta.mentions;
  await mediaDbOp('drafts', 'readwrite', (s) => s.put(rec));
  return rec;
}
export function useDraftList(uid, kind) {
  const [list, setList] = useState(() => draftSync.mem.get(`${uid}:${kind || ''}`) || null);
  useEffect(() => {
    if (!uid) return undefined;
    let alive = true;
    const on = () => listDraftsAll(uid, kind).then((l) => { if (alive) setList(l); });
    on();
    window.addEventListener('zchat-drafts', on);
    return () => { alive = false; window.removeEventListener('zchat-drafts', on); };
  }, [uid, kind]);
  return list;
}
export function draftDateLabel(at) {
  const d = new Date(at);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  return fmtDate(d, d.getFullYear() === today.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' });
}
export function CharBubbleSample({ k, text, isMe = true, cw = 46, fontSize = 14 }) {
  const { theme } = useTheme();
  const spec = CHAR_BUBBLES[k];
  if (!spec) {
    return <div style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', background: isMe ? theme.bubbleMe : theme.bubbleThem, color: theme.ink, borderRadius: 18, padding: '8px 13px', fontSize, lineHeight: 1.3, maxWidth: '100%' }}>{text}</div>;
  }
  return (
    <div style={{ position: 'relative', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: `calc(100% - ${bubbleLayout(spec, isMe, cw, fontSize).side}px)`, ...bubbleWrapCss(spec, isMe, cw, fontSize) }}>
      <div style={{ ...charBubbleCss(spec, isMe, cw), fontSize, lineHeight: 1.3, display: 'flex', alignItems: 'center', minHeight: Math.round(cw * 0.66) }}>
        <span style={{ position: 'relative' }}>{text}</span>
        <CharBubbleDecor k={k} isMe={isMe} cw={cw} fontSize={fontSize} />
      </div>
    </div>
  );
}
export function useOwnedBubbles(uid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    ownedBubblesSubs.add(fn);
    loadOwnedBubbles(uid);
    const onWallet = () => loadOwnedBubbles(uid, true);
    window.addEventListener('zchat-wallet', onWallet);
    return () => { ownedBubblesSubs.delete(fn); window.removeEventListener('zchat-wallet', onWallet); };
  }, [uid]);
  return ownedBubblesMem.uid === uid && ownedBubblesMem.keys ? ownedBubblesMem.keys : null;
}

export function GiftBoxIcon({ size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /><path d="M12 8.5v12" /><path d="M12 8.5c-1.5-3.5-5.5-4-5.5-1.6 0 1.4 2 1.6 5.5 1.6z" /><path d="M12 8.5c1.5-3.5 5.5-4 5.5-1.6 0 1.4-2 1.6-5.5 1.6z" />
    </svg>
  );
}
export const AX_TAB_INFO = {
  chats: ['Chats', 'Your chats and groups'],
  moments: ['Vibes', 'Stories, posts and clips'],
  create: ['Create', 'A post, story, group or live'],
  calls: ['Calls', 'Your calls and call links'],
  me: ['Me', 'Your profile, coins and settings'],
  communities: ['Communities', 'Groups that belong together'],
  shop: ['Shop', 'Sets, bubbles, charms and more'],
};
export function AxTabsPreview({ tabs, active }) {
  const { theme } = useTheme();
  const on = active || tabs[0];
  const line = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(17,17,19,0.07)';
  return (
    <div aria-hidden="true" style={{ borderRadius: 18, border: `1px solid ${theme.border}`, background: igPalette(theme).bg, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[0.62, 0.84, 0.5].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: line, flexShrink: 0 }} />
            <span style={{ height: 8, borderRadius: 4, width: `${w * 100}%`, background: line }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'stretch', height: 54, borderTop: `1px solid ${theme.border}` }}>
        {tabs.map((k) => {
          const hit = k === on;
          const color = hit ? theme.coral : theme.muted;
          return (
            <div key={k} className="zchat-fade" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              {k === 'create' ? <AxTabGlyph k="create" size={19} color={theme.ink} /> : <AxTabGlyph k={k} on={hit} size={22} color={color} />}
              {k !== 'create' && <span style={{ fontSize: 10, fontWeight: hit ? 700 : 500, color, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{AX_TAB_INFO[k][0]}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export function KitTabs({ value, onChange, options, label, style }) {
  const { theme } = useTheme();
  const wrapRef = useRef(null);
  const [bar, setBar] = useState(null);
  useLayoutEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    const el = w.querySelector(`[data-kit-tab="${value}"]`);
    if (!el) { setBar(null); return; }
    setBar({ x: el.offsetLeft + 6, w: Math.max(12, el.offsetWidth - 12) });
    if (el.offsetLeft < w.scrollLeft || el.offsetLeft + el.offsetWidth > w.scrollLeft + w.clientWidth) w.scrollTo({ left: Math.max(0, el.offsetLeft - 24), behavior: 'smooth' });
  }, [value, options.length]);
  return (
    <div ref={wrapRef} role="tablist" aria-label={label} style={{ position: 'relative', display: 'flex', gap: 2, overflowX: 'auto', borderBottom: `1px solid ${theme.hair}`, ...(style || {}) }}>
      {options.map((o) => {
        const k = Array.isArray(o) ? o[0] : o.k;
        const l = Array.isArray(o) ? o[1] : o.label;
        const n = Array.isArray(o) ? o[2] : o.count;
        const on = value === k;
        return (
          <div key={k} data-kit-tab={k} role="tab" aria-selected={on} aria-label={n ? `${l}, ${n}` : l} onClick={() => { if (!on) { hapticTap(); onChange(k); } }}
            style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, height: 42, padding: '0 12px', cursor: 'pointer', fontSize: 15, fontWeight: on ? 700 : 600, color: on ? theme.ink : theme.muted, whiteSpace: 'nowrap', transition: 'color 160ms ease' }}>
            {l}
            {n ? <span style={{ minWidth: 18, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: 9, background: on ? theme.coral : theme.soft2, color: on ? '#FFFFFF' : theme.ink2, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{n > 99 ? '99+' : n}</span> : null}
          </div>
        );
      })}
      {bar && <div aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: -1, height: 2.5, borderRadius: 2, width: bar.w, transform: `translateX(${bar.x}px)`, background: theme.coral, transition: 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1), width 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />}
    </div>
  );
}
export function KitSlider({ value, min = 0, max = 100, step = 1, onChange, label, style }) {
  const { theme } = useTheme();
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <input type="range" className="zchat-range" min={min} max={max} step={step} value={value} aria-label={label}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ '--zfill': `${Math.max(0, Math.min(100, pct))}%`, '--zacc': theme.coral, ...(style || {}) }} />
  );
}
export function KitSection({ title, right, children, style }) {
  const { theme } = useTheme();
  return (
    <div style={{ marginTop: 18, ...(style || {}) }}>
      {(title || right) && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, letterSpacing: '-0.01em' }}>{title}</div>
          {right && <div style={{ fontSize: 13, color: theme.muted, flexShrink: 0 }}>{right}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
export function AvatarMakerIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="0.9" fill={color} /><circle cx="15" cy="10.5" r="0.9" fill={color} /><path d="M8.8 14.6c1.8 1.7 4.6 1.7 6.4 0" /><path d="M6.5 6.8c2-1.9 6.8-2.6 10.4.2" />
    </svg>
  );
}
export function SongArt({ song, size, radius }) {
  if (song.art) return <img src={song.art} alt="" draggable={false} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', display: 'block', flexShrink: 0 }} />;
  return <span style={{ width: size, height: size, borderRadius: radius, background: 'linear-gradient(140deg, #8B6CFF, #5B3FE0)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MusicNoteIcon size={Math.round(size * 0.42)} color="#FFFFFF" /></span>;
}
export function StoryMusicSticker({ song, look, playing, waiting }) {
  const kind = SONG_LOOKS.includes(look) ? look : 'pill';
  const pulse = waiting ? <Spinner size={12} color={kind === 'card' ? '#7C5CFC' : '#FFFFFF'} /> : playing ? <SongBars color={kind === 'card' ? '#7C5CFC' : '#FFFFFF'} size={12} /> : <MusicNoteIcon size={13} color={kind === 'card' ? '#7C5CFC' : '#FFFFFF'} />;
  const one = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
  const glass = { background: 'rgba(22, 22, 28, 0.5)', backdropFilter: 'blur(14px) saturate(160%)', WebkitBackdropFilter: 'blur(14px) saturate(160%)', boxShadow: 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.22), 0 8px 22px rgba(0, 0, 0, 0.22)' };
  if (kind === 'vinyl') {
    const spin = playing && !waiting && !reducedMotion();
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: 156, fontFamily: FONT, color: '#FFFFFF' }}>
        <div style={{ position: 'relative', width: 108, height: 108 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-radial-gradient(circle at 50% 50%, #16161b 0 1.4px, #25252d 1.4px 2.9px)', boxShadow: '0 12px 28px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.07)', animation: 'zchat-vinyl-spin 2.8s linear infinite', animationPlayState: spin ? 'running' : 'paused' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: 46, height: 46, marginLeft: -23, marginTop: -23, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 0 3px #0E0E12' }}><SongArt song={song} size={46} radius={23} /></div>
            <div style={{ position: 'absolute', left: '50%', top: '50%', width: 7, height: 7, marginLeft: -3.5, marginTop: -3.5, borderRadius: '50%', background: '#0B0B0E', boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.25)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(from 25deg, transparent 0 9%, rgba(255, 255, 255, 0.13) 14%, transparent 20% 57%, rgba(255, 255, 255, 0.09) 62%, transparent 68%)', pointerEvents: 'none' }} />
        </div>
        <div style={{ ...glass, maxWidth: 156, boxSizing: 'border-box', padding: '6px 12px', borderRadius: 13, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, minWidth: 0 }}>{pulse}<span style={{ ...one, fontSize: 12.5, fontWeight: 800 }}>{song.t}</span></div>
          <div style={{ ...one, fontSize: 11, opacity: 0.78, marginTop: 1 }}>{song.a || 'Song'}</div>
        </div>
      </div>
    );
  }
  if (kind === 'card') {
    return (
      <div style={{ width: 152, boxSizing: 'border-box', padding: 8, borderRadius: 20, background: '#FFFFFF', color: '#111114', boxShadow: '0 14px 32px rgba(0, 0, 0, 0.32)', fontFamily: FONT }}>
        <SongArt song={song} size={136} radius={14} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 3px 2px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...one, fontSize: 13, fontWeight: 800 }}>{song.t}</div>
            <div style={{ ...one, fontSize: 11.5, color: '#6B6B76', marginTop: 1 }}>{song.a || 'Song'}</div>
          </div>
          <span style={{ display: 'flex', flexShrink: 0 }}>{pulse}</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...glass, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 15px 6px 6px', borderRadius: 18, color: '#FFFFFF', maxWidth: 248, boxSizing: 'border-box', fontFamily: FONT }}>
      <SongArt song={song} size={40} radius={12} />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>{pulse}<span style={{ ...one, fontSize: 13.5, fontWeight: 700 }}>{song.t}</span></span>
        <span style={{ ...one, display: 'block', fontSize: 12, opacity: 0.78, marginTop: 1 }}>{song.a || 'Song'}</span>
      </span>
    </div>
  );
}
function ctSummary(key) {
  const e = ctEntry(key);
  const s = e.summary || {};
  const n = e.note;
  const line = n !== undefined ? (n && n.body.trim() ? n.body.trim().split('\n')[0] : '') : (s.note && s.note.line) || '';
  return {
    songs: e.songs ? e.songs.length : s.songs || 0,
    board: e.board ? e.board.length : s.board || 0,
    jokes: e.jokes ? e.jokes.length : s.jokes || 0,
    line: line.replace(/[*_~`]/g, '').slice(0, 80),
  };
}

export function ChatToolsSection({ chatKey, peer }) {
  useCtTick();
  useEffect(() => { if (chatKey) ctLoad(chatKey, 'summary', true); }, [chatKey]);
  if (!chatKey) return null;
  const s = ctSummary(chatKey);
  const num = (n) => (n > 0 ? n.toLocaleString('en-US') : null);
  const dm = chatKey.indexOf('dm:') === 0;
  return (
    <DetailSection title="Together">
      {detailRows([
        <DetailRow icon={<PlaylistIcon />} label="Playlist" value={num(s.songs)} onClick={() => ctOpen('playlist')} />,
        <DetailRow icon={<BoardIcon />} label="Board" value={num(s.board)} onClick={() => ctOpen('board')} />,
        <DetailRow icon={<NoteIcon />} label="Note" sub={s.line || 'For plans, lists and addresses'} onClick={() => ctOpen('note')} />,
        <DetailRow icon={<JokeIcon />} label="Inside jokes" value={num(s.jokes)} onClick={() => ctOpen('jokes')} />,
        dm && peer && !peer.is_bot && !peer.is_deleted ? <DetailRow icon={<StoryUsIcon />} label="Story of us" onClick={() => ctOpen('story')} /> : null,
      ])}
    </DetailSection>
  );
}
const joinSeenAt = new Map();
const joinDecorMem = new Map();
let joinCssOn = false;
function joinCss() {
  if (joinCssOn || typeof document === 'undefined') return;
  joinCssOn = true;
  try {
    const el = document.createElement('style');
    el.textContent = '@keyframes zpf-join-in { 0% { opacity: 0; transform: translateY(-10px) scale(0.96); } 100% { opacity: 1; transform: none; } } @keyframes zpf-join-out { to { opacity: 0; transform: translateY(-6px); } } @keyframes zpf-burst { 0% { opacity: 0.95; transform: translate(0, 0) scale(0.5); } 100% { opacity: 0; transform: translate(var(--zx), var(--zy)) scale(1); } }';
    document.head.appendChild(el);
  } catch {}
}
function joinDecorOf(uid) {
  const hit = joinDecorMem.get(uid);
  if (hit && Date.now() - hit.at < 600000) return Promise.resolve(hit);
  return fetchProfilesView([uid]).then(({ data }) => {
    const p = data && data[0];
    const d = { at: Date.now(), name: p ? p.name : null, avatar: p && !p.hide_photo ? p.avatar : null, frame: p && isDecorKey(p.avatar_frame) ? p.avatar_frame : null, plate: p && isDecorKey(p.nameplate) ? p.nameplate : null, ns: p ? cxNs(p) : null };
    joinDecorMem.set(uid, d);
    if (joinDecorMem.size > 200) joinDecorMem.delete(joinDecorMem.keys().next().value);
    return d;
  }, () => null);
}
export function JoinBanners({ people, myId, top = 'calc(60px + env(safe-area-inset-top))' }) {
  const [list, setList] = useState([]);
  const prev = useRef(null);
  const ids = (people || []).map((p) => p && p.u).filter(Boolean);
  const key = ids.slice().sort().join(',');
  useEffect(() => {
    const now = new Set(ids);
    if (prev.current === null) { prev.current = now; return; }
    const fresh = (people || []).filter((p) => p && p.u && p.u !== myId && !prev.current.has(p.u));
    prev.current = now;
    fresh.forEach((p) => {
      if (Date.now() - (joinSeenAt.get(p.u) || 0) < 60000) return;
      joinSeenAt.set(p.u, Date.now());
      const t0 = Date.now();
      joinDecorOf(p.u).then((d) => {
        if (Date.now() - t0 > 6000) return;
        const set = d ? (d.frame || d.plate) : null;
        const item = { id: `${p.u}:${t0}`, u: p.u, n: (d && d.name) || p.n || 'Someone', a: (d && d.avatar) || p.a || null, set, frame: d ? d.frame : null, ns: d ? d.ns : null };
        setList((l) => [...l.filter((x) => x.u !== p.u), item].slice(-3));
        setTimeout(() => setList((l) => l.filter((x) => x.id !== item.id)), set ? 3800 : 2800);
      });
    });
  }, [key]);
  if (!list.length) return null;
  joinCss();
  const still = prefOn('zchat-reduce-motion');
  return (
    <div aria-live="polite" style={{ position: 'absolute', left: 0, right: 0, top, zIndex: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none', padding: '0 16px' }}>
      {list.map((x) => (x.set ? <VipEntrance key={x.id} x={x} still={still} /> : (
        <div key={x.id} role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px 0 4px', borderRadius: 17, background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, fontFamily: FONT, animation: still ? undefined : 'zpf-join-in 0.24s ease-out both, zpf-join-out 0.3s ease-in 2.4s forwards' }}>
          <Avatar emoji={x.a} name={x.n} size={26} />
          <span style={{ whiteSpace: 'nowrap', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${pfFirst(x.n, 'Someone')} joined`}</span>
        </div>
      )))}
    </div>
  );
}
function VipEntrance({ x, still }) {
  const set = DECOR_BY_KEY[x.set];
  const photo = 38;
  const k = photo / 440;
  const fsz = Math.round(720 * k);
  const inset = Math.round(140 * k);
  const dots = useMemo(() => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; const r = 46 + (i % 3) * 14; return { x: Math.round(Math.cos(a) * r * 1.6), y: Math.round(Math.sin(a) * r * 0.7), d: (i % 4) * 60, s: 5 + (i % 3) * 2 }; }), []);
  if (!set) return null;
  const first = pfFirst(x.n, 'Someone');
  return (
    <div role="status" aria-label={`${first} joined`} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6, height: 58, padding: '0 18px 0 6px', borderRadius: 29, background: set.tint, color: '#FFFFFF', boxShadow: `0 0 0 1.5px ${set.accent}, 0 10px 28px ${set.accent}55`, fontFamily: FONT, animation: still ? undefined : 'zpf-join-in 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) both, zpf-join-out 0.35s ease-in 3.3s forwards' }}>
      {!still && dots.map((d, i) => <span key={i} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: d.s, height: d.s, marginLeft: -d.s / 2, marginTop: -d.s / 2, borderRadius: '50%', background: i % 2 ? set.accent : '#FFFFFF', '--zx': `${d.x}px`, '--zy': `${d.y}px`, animation: `zpf-burst 0.9s ease-out ${120 + d.d}ms both`, pointerEvents: 'none' }} />)}
      <div style={{ position: 'relative', width: x.frame ? fsz : photo, height: x.frame ? fsz : photo, margin: x.frame ? `${-Math.round((fsz - 58) / 2)}px 0` : 0, flexShrink: 0 }}>
        <div style={{ position: 'absolute', left: x.frame ? inset : 0, top: x.frame ? inset : 0, width: photo, height: photo, borderRadius: '50%', overflow: 'hidden' }}><Avatar emoji={x.a} name={x.n} size={photo} /></div>
        {x.frame && <DecorArt setKey={x.frame} part="frame" width={fsz} style={{ left: 0, top: 0 }} />}
      </div>
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ fontSize: 15.5, fontWeight: 800, whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', ...(x.ns ? NS_ROOM : null) }}>{x.ns ? <StyledName name={first} k={x.ns} dark /> : first}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>joined</div>
      </div>
    </div>
  );
}
export const CR_PRICES = { group: [50, 100, 200, 300, 500, 1000, 2000], pack: [50, 100, 150, 200, 300, 500], member: [50, 100, 200, 300, 500, 1000], message: [20, 50, 100, 200, 500], shout: [200, 300, 500, 1000, 2000, 5000] };
export function CrPriceList({ list, value, onChange, unit = '', off, earn = true }) {
  const { theme } = useTheme();
  const rows = off ? [null, ...list] : list;
  return (
    <CrCard>
      <div role="radiogroup">
        {rows.map((n, i) => {
          const on = value === n;
          const label = n == null ? off : `${coinsText(n)}${unit ? ` ${unit}` : ''}`;
          return (
            <div key={String(n)} role="radio" aria-checked={on} aria-label={label} onClick={() => { if (!on) { hapticTap(); onChange(n); } }} className="zchat-row-press"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: n == null || !earn ? 50 : 58, padding: '0 14px', cursor: 'pointer' }}>
              <span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0, color: theme.muted }}>{n == null ? <X size={18} /> : <CoinIcon size={20} />}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: on ? 700 : 500, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{label}</div>
                {n != null && earn && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{`You get ${coinsText(crCut(n))}`}</div>}
              </div>
              {on && <Check size={18} color={kitOnInk(theme)} strokeWidth={2.6} />}
              {i < rows.length - 1 && <div style={{ position: 'absolute', left: 48, right: 0, bottom: 0, height: 1, background: theme.border }} />}
            </div>
          );
        })}
      </div>
    </CrCard>
  );
}

let liveFxCssOn = false;
export function liveFxCss() {
  if (liveFxCssOn || typeof document === 'undefined') return;
  liveFxCssOn = true;
  try {
    const el = document.createElement('style');
    el.setAttribute('data-zlv', '1');
    el.textContent = [
      '@keyframes zlv-up { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: none; } }',
      '@keyframes zlv-cheer { 0% { transform: scale(1); } 40% { transform: scale(1.035); } 100% { transform: scale(1); } }',
      '.zlv-up { animation: zlv-up 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }',
      '.zlv-cheer { animation: zlv-cheer 300ms ease-out; }',
      '@media (prefers-reduced-motion: reduce) { .zlv-up, .zlv-cheer { animation: none; } }',
    ].join('\n');
    document.head.appendChild(el);
  } catch {}
}
function livePct(n, total) { return total > 0 ? Math.round(((Number(n) || 0) / total) * 100) : 0; }
function liveVotesText(n) { const v = Number(n) || 0; return v === 1 ? '1 vote' : `${v.toLocaleString('en-US')} votes`; }

export function LivePollCard({ box, runner, by, args }) {
  const { theme } = useTheme();
  const p = box.poll;
  const [open, setOpen] = useState(true);
  const pid = p ? String(p.id) : '';
  const voted = !!p && p.mine != null;
  const ended = !!p && p.status === 'ended';
  useEffect(() => { setOpen(true); }, [pid]);
  useEffect(() => {
    if (!pid || runner || !voted || ended) return undefined;
    const t = setTimeout(() => setOpen(false), 1400);
    return () => clearTimeout(t);
  }, [pid, voted, runner, ended]);
  useEffect(() => { if (ended) setOpen(true); }, [ended]);
  if (!p) return null;
  liveFxCss();
  const results = runner || ended || voted;
  const top = Math.max(0, ...p.counts);
  const chev = (up) => <ChevronRight size={17} style={{ transform: `rotate(${up ? -90 : 90}deg)`, flexShrink: 0 }} />;
  const shell = { position: 'relative', zIndex: 3, margin: '0 12px 8px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', flexShrink: 0, boxSizing: 'border-box' };
  if (!open) {
    return (
      <div key={pid} role="button" aria-label="Show the poll" onClick={() => { hapticTap(); setOpen(true); }} className="zlv-up" style={{ ...shell, padding: '10px 12px 11px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700 }}>
          <PollIcon size={14} color="rgba(255,255,255,0.75)" />
          <span data-zuser="" style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.question}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{liveVotesText(p.total)}</span>
          {chev(true)}
        </div>
        <div aria-hidden="true" style={{ display: 'flex', gap: 2, height: 5, marginTop: 8, borderRadius: 3, overflow: 'hidden' }}>
          {p.options.map((o, i) => (
            <div key={i} style={{ flexGrow: p.total ? p.counts[i] : 1, flexShrink: 1, flexBasis: 0, minWidth: p.counts[i] || !p.total ? 3 : 0, background: p.mine === i ? theme.coral : `rgba(255,255,255,${[0.55, 0.38, 0.27, 0.19][i]})`, transition: reducedMotion() ? 'none' : 'flex-grow 320ms ease-out' }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div key={pid} role="group" aria-label={ended ? 'Poll result' : 'Poll'} className="zlv-up" style={{ ...shell, padding: '11px 14px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
        <PollIcon size={14} />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ended ? 'Final result' : box.me && p.created_by === box.me ? 'Your poll' : by ? `Poll from ${liveFirst(by)}` : 'Poll'}</span>
        {results && <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{liveVotesText(p.total)}</span>}
        {!ended && <div role="button" aria-label="Make the poll smaller" onClick={() => setOpen(false)} style={{ display: 'flex', padding: 2, margin: '-2px -4px -2px 0', cursor: 'pointer' }}>{chev(false)}</div>}
      </div>
      <div data-zuser="" style={{ fontSize: 15.5, fontWeight: 800, lineHeight: 1.3, marginTop: 6, wordBreak: 'break-word' }}>{p.question}</div>
      <div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
        {p.options.map((o, i) => {
          if (!results) {
            return (
              <div key={i} role="button" aria-label={`Vote ${o}`} onClick={() => box.vote(i, args)} className="zchat-press" style={{ minHeight: 42, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.13)', fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: p.pending ? 'default' : 'pointer', boxSizing: 'border-box', wordBreak: 'break-word', opacity: p.pending ? 0.6 : 1 }}>{o}</div>
            );
          }
          const pct = livePct(p.counts[i], p.total);
          const win = ended && p.total > 0 && p.counts[i] === top;
          const lit = p.mine === i || win;
          return (
            <div key={i} role="listitem" aria-label={`${o}, ${pct} percent`} style={{ position: 'relative', minHeight: 38, borderRadius: 11, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
              <div aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: lit ? theme.coral : 'rgba(255,255,255,0.2)', transition: reducedMotion() ? 'none' : 'width 320ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', fontSize: 14, fontWeight: win ? 800 : 650 }}>
                <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{o}</span>
                {p.mine === i && <Check size={15} strokeWidth={3} style={{ flexShrink: 0 }} />}
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, flexShrink: 0 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
      {runner && !ended && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 11 }}>
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>{p.pending ? 'Starting' : 'Votes come in live'}</span>
          <div role="button" aria-label="End poll" onClick={() => box.end()} className="zchat-press" style={{ height: 34, padding: '0 15px', borderRadius: 17, background: '#FFFFFF', color: '#0B0A10', fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: p.pending ? 0.5 : 1, flexShrink: 0 }}>End poll</div>
        </div>
      )}
    </div>
  );
}
export function validStorySticker(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.k === 'question' && typeof s.q === 'string') return s;
  if (s.k === 'poll' && typeof s.q === 'string' && Array.isArray(s.a) && s.a.length >= 2) return s;
  if (s.k === 'slider' && typeof s.q === 'string') return s;
  if (s.k === 'moment') return s;
  if (s.k === 'quiz' && typeof s.q === 'string' && Array.isArray(s.a) && s.a.length >= 2 && Number.isInteger(s.c) && s.c >= 0 && s.c < s.a.length) return s;
  if (s.k === 'count' && typeof s.q === 'string' && typeof s.t === 'string' && Number.isFinite(Date.parse(s.t))) return s;
  if (s.k === 'link' && typeof s.u === 'string' && /^https?:\/\//i.test(s.u)) return s;
  if (s.k === 'addyours' && typeof s.q === 'string' && typeof s.c === 'string') return s;
  return null;
}
function stickerHost(u) {
  try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return 'Link'; }
}
export function countdownParts(t) {
  const ms = Math.max(0, Date.parse(t) - Date.now());
  const s = Math.floor(ms / 1000);
  return { done: ms <= 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
export function CountdownDigits({ t, dark }) {
  const [, setTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setTick((n) => n + 1), 1000); return () => clearInterval(iv); }, []);
  const c = countdownParts(t);
  if (c.done) return <div style={{ textAlign: 'center', fontSize: 22, fontWeight: 900, padding: '6px 0', color: dark ? '#FFFFFF' : '#111' }}>It is time</div>;
  const cells = [[c.d, 'days'], [c.h, 'hours'], [c.m, 'mins'], [c.s, 'secs']];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
      {cells.map(([v, l]) => (
        <div key={l} style={{ minWidth: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: 'tabular-nums', padding: '6px 0', borderRadius: 10, background: dark ? 'rgba(255,255,255,0.12)' : '#F2F2F5', color: dark ? '#FFFFFF' : '#111' }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: dark ? 'rgba(255,255,255,0.7)' : '#8A8A95', marginTop: 4 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

export const STICKER_GRAD = 'linear-gradient(135deg, #8B5CF6, #EC4899 55%, #F59E0B)';
export function StickerCardFrame({ title, children, width = 270 }) {
  return (
    <div data-story-control onPointerDown={(e) => e.stopPropagation()} style={{ width, maxWidth: '86%', borderRadius: 22, overflow: 'hidden', background: '#FFFFFF', color: '#111', boxShadow: '0 12px 34px rgba(0,0,0,0.35)', fontFamily: FONT, pointerEvents: 'auto' }}>
      <div style={{ background: STICKER_GRAD, color: '#FFFFFF', padding: '12px 16px', fontSize: 15.5, fontWeight: 800, textAlign: 'center', lineHeight: 1.3, wordBreak: 'break-word' }}>{title}</div>
      <div style={{ padding: 12 }}>{children}</div>
    </div>
  );
}
export function MomentBadge({ late }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 2px', color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.005em', fontFamily: FONT, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
      <span style={{ display: 'flex', color: late ? '#FDBA74' : '#FFFFFF', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}><MomentIcon size={17} /></span>{late ? 'Late daily moment' : 'Daily moment'}
    </div>
  );
}

export function LinkStickerPill({ sticker, onOpen }) {
  return (
    <div data-story-control role="button" aria-label={`Open link ${stickerHost(sticker.u)}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, maxWidth: '80%', padding: '11px 16px', borderRadius: 14, background: '#FFFFFF', color: '#2563EB', fontFamily: FONT, fontSize: 15, fontWeight: 800, boxShadow: '0 10px 28px rgba(0,0,0,0.3)', cursor: onOpen ? 'pointer' : 'default', pointerEvents: 'auto' }}>
      <LinkIcon size={18} style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sticker.l || stickerHost(sticker.u)}</span>
    </div>
  );
}
export function AddYoursCard({ sticker, count, people, onAdd, isMine }) {
  return (
    <div data-story-control onPointerDown={(e) => e.stopPropagation()} style={{ width: 270, maxWidth: '86%', borderRadius: 22, overflow: 'hidden', background: '#FFFFFF', color: '#111', boxShadow: '0 12px 34px rgba(0,0,0,0.35)', fontFamily: FONT, padding: '14px 16px 14px', textAlign: 'center', pointerEvents: 'auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800, color: '#7C5CFC' }}><StatusIcon size={14} color="#7C5CFC" />Add yours</div>
      <div data-zuser="" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.25, marginTop: 6, wordBreak: 'break-word' }}>{sticker.q}</div>
      {count > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700, color: '#6B6B76' }}>
          <div style={{ display: 'flex' }}>{(people || []).slice(0, 3).map((pp, i) => <div key={pp.id} style={{ marginLeft: i ? -8 : 0, borderRadius: '50%', boxShadow: '0 0 0 2px #FFFFFF' }}><Avatar emoji={pp.avatar} name={pp.name} size={22} /></div>)}</div>
          {count === 1 ? '1 person added theirs' : `${count} people added theirs`}
        </div>
      )}
      {onAdd && !isMine && (
        <div role="button" aria-label="Add yours" onClick={(e) => { e.stopPropagation(); onAdd(); }} className="zchat-press" style={{ marginTop: 12, height: 42, borderRadius: 14, background: '#111114', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}><Plus size={17} />Add yours</div>
      )}
    </div>
  );
}

export async function shrinkToDataUrl(file, max = 768, quality = 0.86) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImageEl(url);
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * s));
    c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', quality);
  } finally { URL.revokeObjectURL(url); }
}

export async function imageUrlToFile(url, name, max = 1440, type = 'image/jpeg', quality = 0.9, square = false) {
  const img = await loadImageEl(url);
  let sx = 0; let sy = 0; let sw = img.naturalWidth; let sh = img.naturalHeight;
  if (square) { const side = Math.min(sw, sh); sx = Math.round((sw - side) / 2); sy = Math.round((sh - side) / 2); sw = side; sh = side; }
  const s = Math.min(1, max / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(sw * s));
  c.height = Math.max(1, Math.round(sh * s));
  c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  const blob = await new Promise((res) => c.toBlob(res, type, quality));
  if (!blob) throw new Error('encode');
  return new File([blob], name, { type });
}

export async function saveImageToDevice(url, name) {
  const file = await imageUrlToFile(url, name, 2048, 'image/jpeg', 0.92);
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) { await navigator.share({ files: [file] }); return 'shared'; }
  } catch (err) { if (err && err.name === 'AbortError') return 'cancel'; }
  const href = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = href; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
  return 'saved';
}

export function AiSparkIcon({ size = 20, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5" />
      <path d="M16 5h6M19 2v6" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      <circle cx="9" cy="9" r="2" />
    </svg>
  );
}

export function AiStyleThumb({ k }) {
  const id = `aist-${k}`;
  const body = {
    cartoon: <><rect width="64" height="64" fill="#FFD84D" /><circle cx="32" cy="33" r="17" fill="#FFF4C9" stroke="#1E1E1E" strokeWidth="3" /><circle cx="26" cy="30" r="2.6" fill="#1E1E1E" /><circle cx="38" cy="30" r="2.6" fill="#1E1E1E" /><path d="M24.5 37.5c4.5 5 10.5 5 15 0" fill="none" stroke="#1E1E1E" strokeWidth="3" strokeLinecap="round" /></>,
    anime: <><rect width="64" height="64" fill="#FFD3E4" /><ellipse cx="32" cy="34" rx="12" ry="15" fill="#3B2A6B" /><ellipse cx="32" cy="38" rx="8" ry="9" fill="#7C5CFC" /><circle cx="27.5" cy="28" r="4" fill="#FFFFFF" /><circle cx="36" cy="41" r="2" fill="#FFFFFF" /><path d="M50 13l1.6 4.4L56 19l-4.4 1.6L50 25l-1.6-4.4L44 19l4.4-1.6Z" fill="#FFFFFF" /></>,
    threed: <><defs><radialGradient id={id} cx="0.36" cy="0.32" r="0.75"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.35" stopColor="#7FA6FF" /><stop offset="1" stopColor="#1D3FA8" /></radialGradient></defs><rect width="64" height="64" fill="#D6E6FF" /><ellipse cx="33" cy="52" rx="15" ry="3.5" fill="#1D3FA8" opacity="0.22" /><circle cx="32" cy="31" r="17" fill={`url(#${id})`} /></>,
    comic: <><defs><pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.7" fill="#F2545B" /></pattern></defs><rect width="64" height="64" fill="#FFE45C" /><rect width="64" height="64" fill={`url(#${id})`} opacity="0.55" /><path d="M32 10l5 12 12-4-6 11 11 6-12 3 3 13-11-8-9 10-1-13-13 1 9-9-9-9 13 1Z" fill="#FFFFFF" stroke="#1E1E1E" strokeWidth="2.5" strokeLinejoin="round" /></>,
    watercolor: <><defs><filter id={id}><feGaussianBlur stdDeviation="2" /></filter></defs><rect width="64" height="64" fill="#FAF7F2" /><g filter={`url(#${id})`} opacity="0.75"><circle cx="25" cy="27" r="13" fill="#7FB8E6" /><circle cx="39" cy="28" r="12" fill="#F4A3B5" /><circle cx="32" cy="40" r="12" fill="#F7D27A" /></g></>,
    sticker: <><rect width="64" height="64" fill="#7C5CFC" /><path d="M32 49C20 41 13 34 13 26c0-6 4.5-10 10-10 4 0 7 2 9 5.5C34 18 37 16 41 16c5.5 0 10 4 10 10 0 8-7 15-19 23Z" fill="#FF6B9A" stroke="#FFFFFF" strokeWidth="4.5" strokeLinejoin="round" /></>,
    clay: <><rect width="64" height="64" fill="#F7D3B8" /><ellipse cx="33" cy="51" rx="16" ry="3.5" fill="#B5603A" opacity="0.25" /><path d="M16 36c0-11 7-20 17-20s15 8 15 17-6 16-16 16-16-4-16-13Z" fill="#E9875A" /><ellipse cx="26" cy="27" rx="5" ry="3.2" fill="#FFFFFF" opacity="0.45" /></>,
    pixel: <><rect width="64" height="64" fill="#1F2440" />{[[2,1],[3,1],[5,1],[6,1],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[2,4],[3,4],[4,4],[5,4],[6,4],[3,5],[4,5],[5,5],[4,6]].map(([x, y]) => <rect key={`${x}-${y}`} x={8 + x * 5.5} y={12 + y * 5.5} width="5.5" height="5.5" fill={y === 2 && x === 2 ? '#FFB3C1' : '#FF4D6D'} />)}</>,
    pop: <><rect width="64" height="64" fill="#FF4D8D" /><circle cx="26" cy="28" r="15" fill="#FFE14D" stroke="#1E1E1E" strokeWidth="2.5" /><circle cx="42" cy="42" r="10" fill="#2EC4F1" stroke="#1E1E1E" strokeWidth="2.5" /></>,
    sketch: <><rect width="64" height="64" fill="#F1F1EC" /><circle cx="32" cy="31" r="15" fill="none" stroke="#4A4A4A" strokeWidth="1.4" /><circle cx="32.6" cy="30.4" r="14.6" fill="none" stroke="#4A4A4A" strokeWidth="0.8" opacity="0.6" />{[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${22 + i * 3.4} ${44 - i * 0.6}l${6} ${-12}`} stroke="#6A6A6A" strokeWidth="1" strokeLinecap="round" />)}</>,
    oil: <><rect width="64" height="64" fill="#24406E" /><path d="M8 26c8-8 18-8 24 0s16 8 24 0" fill="none" stroke="#F2C14E" strokeWidth="5" strokeLinecap="round" /><path d="M8 40c8-7 18-7 24 0s16 7 24 0" fill="none" stroke="#F5EFE2" strokeWidth="4" strokeLinecap="round" /><path d="M10 52c7-5 15-5 21 0" fill="none" stroke="#E8743B" strokeWidth="4" strokeLinecap="round" /><circle cx="48" cy="14" r="5" fill="#F2C14E" /></>,
    neon: <><defs><filter id={id} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" /></filter></defs><rect width="64" height="64" fill="#0E0B1F" /><path d="M14 40l9-16 9 16 9-16 9 16" fill="none" stroke="#FF3FD8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id})`} /><path d="M14 40l9-16 9 16 9-16 9 16" fill="none" stroke="#FFC2F3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></>,
    dreamy: <><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#C9B8FF" /><stop offset="1" stopColor="#FFC9E0" /></linearGradient></defs><rect width="64" height="64" fill={`url(#${id})`} /><circle cx="32" cy="32" r="13" fill="#FFFFFF" opacity="0.55" /><circle cx="32" cy="32" r="8" fill="#FFFFFF" opacity="0.8" /><circle cx="14" cy="16" r="1.6" fill="#FFFFFF" /><circle cx="50" cy="48" r="1.4" fill="#FFFFFF" /><circle cx="48" cy="14" r="1.1" fill="#FFFFFF" /></>,
    minimal: <><rect width="64" height="64" fill="#ECEDF0" /><circle cx="38" cy="26" r="9" fill="#7C5CFC" /><path d="M12 44h40" stroke="#1E1E1E" strokeWidth="2.5" strokeLinecap="round" /></>,
    realistic: <><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7DB6F5" /><stop offset="1" stopColor="#E6F1FC" /></linearGradient></defs><rect width="64" height="64" fill={`url(#${id})`} /><circle cx="46" cy="18" r="5" fill="#FFF3C4" /><path d="M0 50l16-20 10 12 12-18 26 26v14H0Z" fill="#5C7FA8" /><path d="M0 56l20-14 14 8 12-6 18 10v10H0Z" fill="#2F4C6E" /></>,
  }[k];
  return <svg width="100%" height="100%" viewBox="0 0 64 64" aria-hidden="true" style={{ display: 'block' }}>{body}</svg>;
}
export function aiToolOpen(k, detail) {
  try { window.dispatchEvent(new CustomEvent('zchat-ai-tool', { detail: { k, ...(detail || {}) } })); } catch {}
}

export function BubblesIcon({ size = 24, color = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M4 4h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8.5L5 16v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><path d="M18 8h2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1v3l-3.5-3H12a2 2 0 0 1-2-2v-.5" />
    </svg>
  );
}
export function LoginRequestList({ uid }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!uid || !lapRead(uid).on) return undefined;
    let alive = true;
    supabase.rpc('zchat_login_pending').then((res) => { if (alive && res && !res.error && Array.isArray(res.data)) setRows(res.data); }, () => {});
    return () => { alive = false; };
  }, [uid]);
  if (!rows.length) return null;
  const decide = async (r, approve) => {
    hapticTap();
    setRows((l) => l.filter((x) => x.session_id !== r.session_id));
    const res = await lapDecide(r.session_id, approve);
    if (!res.ok && res.reason !== 'gone') { setRows((l) => (l.some((x) => x.session_id === r.session_id) ? l : [r, ...l])); appSnack(res.msg); return; }
    if (res.ok) lapNudge(r.session_id);
    appSnack(res.ok ? (approve ? 'Login approved' : 'Login denied. That device was logged out.') : res.msg);
  };
  return (
    <div style={{ paddingBottom: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '12px 2px 2px' }}>Waiting for approval</div>
      <div role="list" aria-label="Logins waiting for approval">
        {rows.map((r) => {
          const label = r.label || 'New device';
          return (
            <div key={r.session_id} role="listitem" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 2px', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><SessionDeviceIcon label={label} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lapWhen(r.created_at)}</div>
              </div>
              <div role="button" aria-label={`Deny ${label}`} onClick={() => decide(r, false)} className="zchat-press" style={{ fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: '8px 6px' }}>Deny</div>
              <div role="button" aria-label={`Approve ${label}`} onClick={() => decide(r, true)} className="zchat-press" style={{ fontSize: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', padding: '8px 4px 8px 6px' }}>Approve</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export const bioPinGate = { at: 0 };
export function AppPinSetupPage({ title, note, onDone, onClose, zIndex = 90 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [step, setStep] = useState('set');
  const [first, setFirst] = useState('');
  const [err, setErr] = useState(0);
  const [mismatch, setMismatch] = useState(false);
  const onPin = async (pin) => {
    if (step === 'set') { setFirst(pin); setMismatch(false); setStep('confirm'); return; }
    if (pin !== first) { setErr((e) => e + 1); setMismatch(true); setStep('set'); return; }
    const h = await hashAppPin(pin);
    const cur = readAppLock();
    writeAppLock({ ...cur, h, d: cur.d || 0 });
    if (cur.h && cur.h !== h) supabase.rpc('zchat_spend_pin', { p_hash: h, p_old: cur.h }).then(() => {}, () => {});
    bioPinGate.at = Date.now();
    playUiSound('like');
    onDone();
  };
  const sub = step === 'set' ? (mismatch ? 'The PINs did not match, start again' : 'Four digits you will remember') : 'Type the same PIN again';
  return (
    <FullPage title={step === 'set' ? (title || 'Choose a PIN') : 'Confirm your PIN'} onBack={onClose} zIndex={zIndex}>
      {note && <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, textAlign: 'center', padding: '10px 14px 0', visibility: step === 'set' ? 'visible' : 'hidden' }}>{note}</div>}
      <AppPinPad key={step} subtitle={sub} onComplete={onPin} error={err} />
    </FullPage>
  );
}
export function reasonLine(text, theme) {
  if (!text) return null;
  return <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.45, marginTop: 4, maxWidth: 320 }}>{text}</div>;
}
export function SensTileVeil({ m }) {
  const on = useSensitiveMessage(m, !m || (!!sensStore.uid && m.sender_id === sensStore.uid), sensStore.uid);
  if (!on) return null;
  return (
    <div role="button" aria-label={m.type === 'video' ? 'Show blurred video' : 'Show blurred photo'} onClick={(e) => { e.stopPropagation(); hapticTap(); sensReveal(String(m.id)); }}
      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: GLASS_OK ? 'rgba(0,0,0,0.2)' : 'rgba(40,40,46,0.94)', backdropFilter: GLASS_OK ? 'blur(14px)' : undefined, WebkitBackdropFilter: GLASS_OK ? 'blur(14px)' : undefined, cursor: 'pointer' }}>
      <HiddenPhotoIcon size={20} color="#FFFFFF" />
    </div>
  );
}

export function AxGlyph({ k, size = 20, color = 'currentColor', strokeWidth = 1.8 }) {
  const p = { fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      {k === 'access' && <><circle cx="12" cy="4.6" r="1.7" {...p} /><path d="M4.5 8.2c2.4.9 4.9 1.3 7.5 1.3s5.1-.4 7.5-1.3M12 9.5v4.2M12 13.7l-3 6.6M12 13.7l3 6.6" {...p} /></>}
      {k === 'report' && <><path d="M4 19.5V5.8A1.8 1.8 0 0 1 5.8 4h12.4A1.8 1.8 0 0 1 20 5.8v8.4a1.8 1.8 0 0 1-1.8 1.8H8.4L4 19.5Z" {...p} /><path d="M12 7.6v4.2M12 14.1v.1" {...p} /></>}
      {k === 'labs' && <><path d="M9.5 3.5h5M10.4 3.5v5.3L5.2 17.6A2 2 0 0 0 6.9 20.5h10.2a2 2 0 0 0 1.7-2.9l-5.2-8.8V3.5" {...p} /><path d="M7.6 14.2h8.8" {...p} /></>}
      {k === 'shot' && <><rect x="3.5" y="5" width="17" height="14" rx="3" {...p} /><circle cx="12" cy="12" r="3.2" {...p} /><path d="M8.5 5l1.2-1.6h4.6L15.5 5" {...p} /></>}
      {k === 'pic' && <><rect x="3.5" y="4.5" width="17" height="15" rx="3" {...p} /><circle cx="9" cy="10" r="1.6" {...p} /><path d="m4.5 17.5 4.6-4.6a1.4 1.4 0 0 1 2 0l2.4 2.4 1.6-1.6a1.4 1.4 0 0 1 2 0l2.4 2.4" {...p} /></>}
    </svg>
  );
}
function axRecentErrors() {
  const out = axErrRing.slice(-5);
  try {
    const c = JSON.parse(localStorage.getItem('zchat-last-crash') || 'null');
    if (c && c.msg && Date.now() - Date.parse(c.at) < 7 * 86400000) out.unshift({ at: c.at, msg: `${c.where || 'app'}: ${c.msg}`.slice(0, 240) });
  } catch {}
  return out.slice(-6);
}
export function axDeviceInfo(dark) {
  const ua = String((typeof navigator !== 'undefined' && navigator.userAgent) || '');
  const ver = (re) => { const m = re.exec(ua); return m ? m[1].replace(/_/g, '.') : ''; };
  const os = /Android/.test(ua) ? `Android ${ver(/Android\s([\d.]+)/)}`.trim()
    : /iPhone|iPad|iPod/.test(ua) ? `${/iPad/.test(ua) ? 'iPad' : 'iPhone'}, iOS ${ver(/OS ([\d_]+)/)}`.trim()
      : /Mac OS X/.test(ua) ? (navigator.maxTouchPoints > 1 ? 'iPad' : 'Mac') : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
  const browser = /EdgA?\//.test(ua) ? `Edge ${ver(/EdgA?\/(\d+)/)}` : /SamsungBrowser\//.test(ua) ? `Samsung Internet ${ver(/SamsungBrowser\/(\d+)/)}`
    : /CriOS\//.test(ua) ? `Chrome ${ver(/CriOS\/(\d+)/)}` : /FxiOS\/|Firefox\//.test(ua) ? `Firefox ${ver(/(?:FxiOS|Firefox)\/(\d+)/)}`
      : /Chrome\//.test(ua) ? `Chrome ${ver(/Chrome\/(\d+)/)}` : /Safari\//.test(ua) ? `Safari ${ver(/Version\/(\d+)/)}`.trim() : 'Unknown';
  let installed = false;
  try { installed = window.matchMedia('(display-mode: standalone)').matches || !!navigator.standalone; } catch {}
  const sc = typeof screen !== 'undefined' ? screen : { width: 0, height: 0 };
  return {
    app: APP_VERSION, os, browser, installed,
    screen: `${Math.round(sc.width)} x ${Math.round(sc.height)}`,
    window: `${Math.round(window.innerWidth)} x ${Math.round(window.innerHeight)}`,
    pixels: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    lang: String(navigator.language || '').slice(0, 20), online: navigator.onLine !== false,
    theme: dark ? 'dark' : 'light', text: uiZoom.v, bold: axLook.bold, colours: axLook.cv,
    ua: ua.slice(0, 300), errors: axRecentErrors(),
  };
}
export async function axSendReport(uid, { kind, lab, body, files, device }) {
  const shots = [];
  for (const f of (files || []).slice(0, 3)) {
    let file = f;
    const tmp = URL.createObjectURL(f);
    try { file = await imageUrlToFile(tmp, 'shot.jpg', 1600, 'image/jpeg', 0.85); } catch {}
    try { URL.revokeObjectURL(tmp); } catch {}
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const path = `${uid}/${id}.jpg`;
    const up = await supabase.storage.from('zchat-reports').upload(path, file, { contentType: 'image/jpeg', cacheControl: '3600' });
    if (up && up.error) return { error: up.error };
    shots.push(path);
  }
  const { error } = await supabase.from('zchat_problem_reports').insert({ user_id: uid, kind, lab: lab || null, body, shots, device: device || null });
  return { error };
}
export function axReportError(error) {
  if (axMissing(error)) return 'Reports switch on once the latest ZChat setup is finished.';
  if (isNetworkProblem(error)) return 'That did not send. Check your connection and try again.';
  const m = String((error && error.message) || '');
  if (/few reports just now|a little more/i.test(m)) return `${m.replace(/\.$/, '')}.`;
  return friendlyError(error, 'That did not send. Try again in a moment.');
}

export function PaintSheet({ title, onClose, children, z = 120 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: z, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 520, maxHeight: 'min(82vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
        {title && <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, padding: '8px 18px 10px' }}>{title}</div>}
        <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, padding: '0 18px 6px', touchAction: 'pan-y' }}>{children}</div>
      </div>
    </div>
  );
}
export async function makeWallPhoto(file, userId) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
    const max = 1440;
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s);
    c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const data = c.toDataURL('image/jpeg', 0.82);
    if (userId) {
      try {
        const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.82));
        if (blob) {
          const up = await uploadMedia(new File([blob], 'wallpaper.jpg', { type: 'image/jpeg' }), userId);
          if (up && up.url) { const k = `url:${up.url}`; wallPhotoCache.set(k, data); return k; }
        }
      } catch {}
    }
    const key = `${WALL_PHOTO_PREFIX}${Date.now().toString(36)}`;
    try { localStorage.setItem(`zchat-wall-${key}`, data); } catch {
      try { Object.keys(localStorage).filter((k) => k.indexOf(`zchat-wall-${WALL_PHOTO_PREFIX}`) === 0).forEach((k) => localStorage.removeItem(k)); } catch {}
      try { localStorage.setItem(`zchat-wall-${key}`, data); } catch { return null; }
    }
    wallPhotoCache.set(key, data);
    return key;
  } catch { return null; } finally { setTimeout(() => URL.revokeObjectURL(url), 1500); }
}
export const LIVE_GAME_INFO = {
  tug: { title: 'Tug of war', sub: 'Tap faster to pull the rope your way', secs: 15 },
  qrace: { title: 'Quiz race', sub: 'Same questions, the fastest right answer scores', rounds: 7 },
  rrace: { title: 'Reaction race', sub: 'First to tap on green, best of five', rounds: 5 },
};
export const MEME_FONT = 'Anton, Impact, "Arial Black", sans-serif';
export function setTypingStyleMine(uid, k) {
  try { if (k) localStorage.setItem(`zchat-typing-style-${uid}`, k); else localStorage.removeItem(`zchat-typing-style-${uid}`); } catch {}
  privMetaPush(uid, 'typing_style', k || '');
  try { window.dispatchEvent(new Event('zchat-typing-style')); } catch {}
}

export function AdminStatus({ tone = 'muted', children }) {
  const { theme } = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'live' ? '#FF3B5C' : tone === 'accent' ? kitOnInk(theme) : tone === 'good' ? '#16A34A' : theme.muted;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {children}
    </span>
  );
}
export function AdminTextBtn({ label, onClick, tone, disabled, icon, ariaLabel }) {
  const { theme } = useTheme();
  const color = tone === 'danger' ? theme.danger : tone === 'main' ? kitOnInk(theme) : theme.ink2;
  return (
    <div role="button" aria-label={ariaLabel} aria-disabled={disabled || undefined} onClick={disabled ? undefined : onClick} className={disabled ? undefined : 'zchat-press'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 36, padding: '0 2px', fontSize: 14, fontWeight: 700, color, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap', flexShrink: 0, WebkitTapHighlightColor: 'transparent' }}>
      {icon}{label}
    </div>
  );
}
export function adminHair(theme, on) {
  return on ? `inset 0 -0.5px 0 ${theme.hair}` : 'none';
}

export function localInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DisappearSheet({ value, canEdit = true, subject = 'this chat', onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const current = Number(value || 0);
  const sheet = (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '20px 18px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
        <div style={{ fontWeight: 900, fontSize: 17, color: theme.ink }}>Disappearing messages</div>
        <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, margin: '6px 0 12px' }}>
          New messages in {subject} disappear for everyone after the time you choose. Messages already sent stay.
        </div>
        {DISAPPEAR_OPTIONS.map(([secs, label]) => (
          <div key={secs} role="button" onClick={() => { if (!canEdit) return; if (secs !== current) onPick(secs); onClose(); }} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 4px', borderTop: `1px solid ${theme.border}`,
            cursor: canEdit ? 'pointer' : 'default', opacity: canEdit || secs === current ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink }}>{label}</span>
            <span style={{ width: 20, height: 20, borderRadius: 10, border: `2px solid ${current === secs ? theme.coral : theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {current === secs && <span style={{ width: 10, height: 10, borderRadius: 5, background: theme.coral }} />}
            </span>
          </div>
        ))}
        {!canEdit && <div style={{ fontSize: 12, color: theme.muted, marginTop: 10 }}>Only group admins can change this.</div>}
      </div>
    </div>
  );
  return ReactDOM.createPortal(sheet, document.body);
}
export function groupAccent(group) { return (group && group.accent) || colorForName((group && group.name) || 'group'); }
