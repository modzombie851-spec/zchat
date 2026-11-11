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
  ActionSheet,
  Avatar,
  BigButton,
  CLOSE_GREEN,
  ChoiceList,
  ConfirmDialog,
  ConfirmSheet,
  CrGlyph,
  DoodleIcon,
  DraftThumb,
  EmptyState,
  FONT,
  FullPage,
  GroupAvatar,
  HiddenPhotoIcon,
  IgHeading,
  IgRow,
  IgToggle,
  ImageViewer,
  LineGlyph,
  LoadFail,
  MapPinIcon,
  MediaImg,
  MusicNoteIcon,
  NameBadge,
  PickPeoplePage,
  Portal,
  RichText,
  SharedStoryIcon,
  SongBars,
  Spinner,
  SpotArt,
  StatusIcon,
  StudioGlyph,
  VerifiedBadge,
  VideoThumb,
  VideoViewer,
  appSnack,
  copyTextToClipboard,
  countWord,
  dataSaverOn,
  fetchProfilesView,
  fmtDate,
  formatCount,
  friendlyError,
  groupMemories,
  hapticTap,
  hideBroken,
  highlightsMem,
  hushOtherMedia,
  inputStyle,
  isActiveUntil,
  layerPosOf,
  loadFailCode,
  loadMemories,
  loadSharedStories,
  pauseSong,
  playSong,
  playUiSound,
  privacyAllows,
  readReminders,
  removeSharedClip,
  rpcMissing,
  sanitizeAvatarList,
  searchAccounts,
  sharedEndsText,
  sharedInviteNotify,
  sharedNotify,
  sharedStore,
  silentDownload,
  siteOrigin,
  songEl,
  songEta,
  songPing,
  songPlayer,
  songWarm,
  stopSong,
  storyArchiveMem,
  storyGoneIds,
  storyLongPress,
  storySoundPref,
  storyViewersMem,
  useBackClose,
  useCanInteract,
  useSharedStories,
  useSheetDrag,
  useSongPlaying,
  useTheme,
  validPlace,
  validSong,
  warmSong,
  writeReminders,
} from '../App.jsx';
import {
  AddYoursCard,
  CloseFriendsIcon,
  CloseFriendsPicker,
  CloseShareButton,
  CountdownDigits,
  LinkStickerPill,
  MomentBadge,
  STICKER_GRAD,
  STORY_REF_W,
  StickerCardFrame,
  StoryListIcon,
  StoryMusicSticker,
  draftDateLabel,
  loadStoryLists,
  openDraftFull,
  storyListsCached,
  storyListsErr,
  storyListsSet,
  useCloseFriendCount,
  useDraftList,
  useStoryLists,
  validStorySticker,
} from './shared.jsx';


function CloseFriendsBadge() {
  return (
    <span aria-label="Close friends" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px 2px 5px', borderRadius: 10, background: CLOSE_GREEN, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, flexShrink: 0, lineHeight: 1.3 }}>
      <CloseFriendsIcon size={11} color="#FFFFFF" bare />Close friends
    </span>
  );
}
function storyListName(uid, audience) {
  if (typeof audience !== 'string' || audience.indexOf('list:') !== 0) return null;
  const l = (storyListsCached(uid) || []).find((x) => `list:${x.id}` === audience);
  return l ? l.name : 'Your list';
}
function NameSheet({ title, value = '', placeholder, max = 30, saveLabel = 'Save', onSave, onClose, zIndex = 900 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState(value);
  const ok = text.trim().length > 0;
  const save = () => { if (ok) onSave(text.trim().slice(0, max)); };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex, background: 'rgba(5,8,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-pop" style={{ width: '100%', maxWidth: 320, background: theme.panelBg, borderRadius: 22, padding: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink, marginBottom: 12, textAlign: 'center' }}>{title}</div>
          <input autoFocus value={text} maxLength={max} placeholder={placeholder} aria-label={title} enterKeyHint="done"
            onChange={(e) => setText(e.target.value.slice(0, max))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} style={inputStyle(theme)} />
          <div style={{ fontSize: 11, color: theme.muted, textAlign: 'right', marginTop: 4 }}>{text.length}/{max}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 13, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.ink, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Cancel</button>
            <button type="button" onClick={save} disabled={!ok} style={{ flex: 1, padding: 11, borderRadius: 13, border: 'none', background: theme.coral, color: '#FFFFFF', fontWeight: 800, fontFamily: FONT, cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.5 }}>{saveLabel}</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
export function StoryListsPage({ uid, onClose, onOpenList, zIndex = 740 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const lists = useStoryLists(uid);
  const [naming, setNaming] = useState(null);
  const [menu, setMenu] = useState(null);
  const [delFor, setDelFor] = useState(null);
  const [fail, setFail] = useState(null);
  const load = () => loadStoryLists(uid).then(() => { const e = storyListsErr(); setFail(e ? loadFailCode(e) : null); });
  useEffect(() => { load(); }, [uid]);
  const all = lists || [];
  const create = async (name) => {
    setNaming(null);
    const temp = { id: `temp-${Date.now().toString(36)}`, name, n: 0, temp: true };
    storyListsSet(uid, [...all, temp]);
    hapticTap();
    const { data, error } = await supabase.from('zchat_story_lists').insert({ owner_id: uid, name }).select('id, name').single();
    const cur = storyListsCached(uid) || [];
    if (error || !data) { storyListsSet(uid, cur.filter((x) => x.id !== temp.id)); appSnack(friendlyError(error, 'That list did not save. Try again.')); return; }
    const made = { id: data.id, name: data.name, n: 0 };
    storyListsSet(uid, cur.map((x) => (x.id === temp.id ? made : x)));
    if (onOpenList) onOpenList(made);
  };
  const rename = async (l, name) => {
    setNaming(null);
    storyListsSet(uid, all.map((x) => (x.id === l.id ? { ...x, name } : x)));
    const { error } = await supabase.from('zchat_story_lists').update({ name }).eq('id', l.id).eq('owner_id', uid);
    if (error) { storyListsSet(uid, (storyListsCached(uid) || []).map((x) => (x.id === l.id ? { ...x, name: l.name } : x))); appSnack(friendlyError(error, 'That name did not save. Try again.')); }
  };
  const remove = async (l) => {
    setDelFor(null);
    storyListsSet(uid, all.filter((x) => x.id !== l.id));
    playUiSound('delete');
    const { error } = await supabase.from('zchat_story_lists').delete().eq('id', l.id).eq('owner_id', uid);
    if (error) { loadStoryLists(uid); appSnack(friendlyError(error, 'That list is still there. Try again.')); }
  };
  return (
    <FullPage title="Lists" subtitle={lists ? `${all.length} of 10` : undefined} onBack={onClose} zIndex={zIndex}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '6px 2px 8px', textWrap: 'pretty' }}>Share a story with just one list, like Family or Team. Only people on it can see that story.</div>
      {lists === null && (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); load(); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>)}
      {lists && !all.length && <EmptyState art="love" title="No lists yet" text="Make one for family, your team or your class." />}
      {all.map((l) => (
        <IgRow key={l.id} inset={false} icon={<StoryListIcon />} label={l.name} sub={countWord(l.n, 'person', 'people')} onClick={l.temp ? undefined : () => onOpenList(l)}
          right={l.temp ? <Spinner size={16} color={theme.muted} /> : (
            <div role="button" aria-label={`More for ${l.name}`} onClick={(e) => { e.stopPropagation(); setMenu(l); }} style={{ width: 40, height: 40, marginRight: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer' }}><MoreVertical size={19} /></div>
          )} />
      ))}
      {lists && all.length < 10 && <IgRow inset={false} icon={<Plus />} label="New list" onClick={() => setNaming({ make: true })} />}
      {naming && <NameSheet title={naming.make ? 'New list' : 'Rename list'} value={naming.list ? naming.list.name : ''} placeholder="Family" saveLabel={naming.make ? 'Create' : 'Save'} onClose={() => setNaming(null)} onSave={(name) => (naming.make ? create(name) : rename(naming.list, name))} />}
      {menu && <ActionSheet title={menu.name} onClose={() => setMenu(null)} zIndex={zIndex + 20} items={[
        { k: 'people', label: 'Edit people', icon: <Users />, on: () => { const l = menu; setMenu(null); onOpenList(l); } },
        { k: 'rename', label: 'Rename', icon: <Edit3 />, on: () => { const l = menu; setMenu(null); setNaming({ list: l }); } },
        { k: 'delete', label: 'Delete list', icon: <Trash2 />, danger: true, on: () => { const l = menu; setMenu(null); setDelFor(l); } },
      ]} />}
      {delFor && <ConfirmSheet title={`Delete ${delFor.name}?`} text="Stories you already shared with it stay with the people on it until they end." confirmLabel="Delete" zIndex={zIndex + 30} onCancel={() => setDelFor(null)} onConfirm={() => remove(delFor)} />}
    </FullPage>
  );
}
function StoryListBadge({ name }) {
  const { theme } = useTheme();
  return (
    <span aria-label={`Shared with ${name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px 2px 5px', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, flexShrink: 1, minWidth: 0, maxWidth: 120, lineHeight: 1.3, overflow: 'hidden' }}>
      <StoryListIcon size={11} color="#FFFFFF" style={{ flexShrink: 0 }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
    </span>
  );
}
const STORY_IMAGE_MS = 5000;
const STORY_SONG_MS = 15000;

function timeShort(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

const TEXT_STORY_BGS = [
  { k: 'violet', label: 'Violet', bg: '#5B3FD0', ink: '#FFFFFF' },
  { k: 'coral', label: 'Coral', bg: '#E8573F', ink: '#FFFFFF' },
  { k: 'teal', label: 'Teal', bg: '#0F8B83', ink: '#FFFFFF' },
  { k: 'ink', label: 'Ink', bg: '#16161C', ink: '#FFFFFF' },
  { k: 'butter', label: 'Butter', bg: '#F6D35B', ink: '#2B2208' },
  { k: 'rose', label: 'Rose', bg: '#F2A7BE', ink: '#3A1020' },
  { k: 'sky', label: 'Sky', bg: '#3B82C4', ink: '#FFFFFF' },
  { k: 'forest', label: 'Forest', bg: '#24563A', ink: '#F2FFF4' },
  { k: 'paper', label: 'Paper', bg: '#F4EEDF', ink: '#2E2618', lines: 'rgba(80,60,30,0.16)' },
  { k: 'dots', label: 'Dots', bg: '#2E2A6B', ink: '#FFFFFF', dots: 'rgba(255,255,255,0.14)' },
  { k: 'grid', label: 'Grid', bg: '#FFFFFF', ink: '#1C2333', grid: 'rgba(59,130,246,0.18)' },
];
const TEXT_STORY_FONTS = [
  { k: 'classic', label: 'Classic', css: `800 {px}px ${FONT}` },
  { k: 'serif', label: 'Serif', css: '700 {px}px Georgia, "Times New Roman", serif' },
  { k: 'type', label: 'Typewriter', css: '600 {px}px ui-monospace, Menlo, Consolas, "Courier New", monospace' },
  { k: 'marker', label: 'Marker', css: '700 {px}px "Marker Felt", "Comic Sans MS", "Chalkboard SE", cursive' },
  { k: 'round', label: 'Rounded', css: '800 {px}px ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif' },
];
function textStoryFont(fontIdx, px) {
  const f = TEXT_STORY_FONTS[fontIdx] || TEXT_STORY_FONTS[0];
  return f.css.replace('{px}', String(px));
}
function wrapStoryLines(ctx, text, maxW) {
  const out = [];
  String(text || '').split('\n').forEach((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { out.push(''); return; }
    let line = '';
    words.forEach((w) => {
      const tryLine = line ? `${line} ${w}` : w;
      if (ctx.measureText(tryLine).width <= maxW || !line) {
        if (!line && ctx.measureText(w).width > maxW) {
          let chunk = '';
          Array.from(w).forEach((ch) => {
            if (ctx.measureText(chunk + ch).width > maxW && chunk) { out.push(chunk); chunk = ch; } else chunk += ch;
          });
          line = chunk;
        } else line = tryLine;
      } else { out.push(line); line = w; }
    });
    out.push(line);
  });
  return out;
}
function paintTextStoryBg(ctx, W, H, b) {
  ctx.fillStyle = b.bg;
  ctx.fillRect(0, 0, W, H);
  if (b.lines) {
    ctx.strokeStyle = b.lines; ctx.lineWidth = 3;
    for (let y = 140; y < H; y += 84) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(220,80,80,0.28)'; ctx.beginPath(); ctx.moveTo(120, 0); ctx.lineTo(120, H); ctx.stroke();
  }
  if (b.dots) {
    ctx.fillStyle = b.dots;
    for (let y = 30; y < H; y += 60) for (let x = (y / 60) % 2 ? 30 : 60; x < W; x += 60) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
  }
  if (b.grid) {
    ctx.strokeStyle = b.grid; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 54) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 54) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
}
function layoutTextStory(ctx, text, fontIdx, W, H) {
  const maxW = W - 180;
  const maxH = H - 520;
  let px = 128;
  let lines = [];
  for (; px >= 46; px -= 6) {
    ctx.font = textStoryFont(fontIdx, px);
    lines = wrapStoryLines(ctx, text, maxW);
    if (lines.length * px * 1.22 <= maxH) break;
  }
  return { px, lines };
}
async function renderTextStory(text, bgIdx, fontIdx, align) {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const b = TEXT_STORY_BGS[bgIdx] || TEXT_STORY_BGS[0];
  paintTextStoryBg(ctx, W, H, b);
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch {}
  const { px, lines } = layoutTextStory(ctx, text, fontIdx, W, H);
  ctx.font = textStoryFont(fontIdx, px);
  ctx.fillStyle = b.ink;
  ctx.textBaseline = 'middle';
  ctx.textAlign = align === 'left' ? 'left' : 'center';
  const lh = px * 1.22;
  const top = H / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, align === 'left' ? 90 : W / 2, top + i * lh));
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
  if (!blob) return null;
  return new File([blob], `zchat-text-story-${Date.now()}.jpg`, { type: 'image/jpeg' });
}

export function TextStoryComposer({ onClose, onShare, myId }) {
  useBackClose(true, onClose);
  const [closeCount, reloadClose] = useCloseFriendCount(myId || null);
  const [closeEdit, setCloseEdit] = useState(false);
  const [closeBusy, setCloseBusy] = useState(false);
  const [text, setText] = useState('');
  const [bgIdx, setBgIdx] = useState(() => { try { const v = parseInt(localStorage.getItem('zchat-textstory-bg') || '0', 10); return Number.isFinite(v) ? v % TEXT_STORY_BGS.length : 0; } catch { return 0; } });
  const [fontIdx, setFontIdx] = useState(0);
  const [align, setAlign] = useState('center');
  const [busy, setBusy] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const areaRef = useRef(null);
  const b = TEXT_STORY_BGS[bgIdx] || TEXT_STORY_BGS[0];
  useEffect(() => { try { localStorage.setItem('zchat-textstory-bg', String(bgIdx)); } catch {} }, [bgIdx]);
  useEffect(() => { const t = setTimeout(() => { try { areaRef.current && areaRef.current.focus(); } catch {} }, 250); return () => clearTimeout(t); }, []);
  const len = text.trim().length;
  const previewPx = len < 20 ? 40 : len < 60 ? 32 : len < 140 ? 26 : 21;
  const f = TEXT_STORY_FONTS[fontIdx] || TEXT_STORY_FONTS[0];
  const fam = f.css.replace(/^\d+ \{px\}px /, '');
  const weight = (f.css.match(/^(\d+)/) || [0, 700])[1];
  const bgCss = b.lines ? { backgroundColor: b.bg, backgroundImage: `repeating-linear-gradient(0deg, transparent 0 26px, ${b.lines} 26px 27px)` }
    : b.dots ? { backgroundColor: b.bg, backgroundImage: `radial-gradient(circle, ${b.dots} 1.6px, transparent 2px)`, backgroundSize: '19px 19px' }
      : b.grid ? { backgroundColor: b.bg, backgroundImage: `linear-gradient(${b.grid} 1px, transparent 1px), linear-gradient(90deg, ${b.grid} 1px, transparent 1px)`, backgroundSize: '17px 17px' }
        : { background: b.bg };
  const share = async (close) => {
    if (!len || busy) return;
    const toClose = close === true;
    setBusy(true);
    if (toClose) setCloseBusy(true);
    const file = await renderTextStory(text.trim(), bgIdx, fontIdx, align);
    setBusy(false);
    setCloseBusy(false);
    if (file) onShare(file, toClose ? { audience: 'close' } : undefined);
  };
  const btn = { width: 42, height: 42, borderRadius: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.22)', color: '#FFFFFF', fontFamily: FONT, border: 'none' };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, ...bgCss, display: 'flex', flexDirection: 'column', fontFamily: FONT, color: b.ink, transition: 'background-color 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
          <button type="button" aria-label="Back" onClick={onClose} style={btn}><X size={22} color="#FFFFFF" /></button>
          <div style={{ flex: 1 }} />
          <button type="button" aria-label="Change font" onClick={() => setFontIdx((i) => (i + 1) % TEXT_STORY_FONTS.length)} style={{ ...btn, width: 'auto', padding: '0 14px', fontWeight: 800, fontSize: 15 }}>
            <span style={{ fontFamily: fam, fontWeight: weight }}>Aa</span><span style={{ fontSize: 12.5, marginLeft: 7, opacity: 0.9 }}>{f.label}</span>
          </button>
          <button type="button" aria-label="Change alignment" onClick={() => setAlign((a) => (a === 'center' ? 'left' : 'center'))} style={btn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">{align === 'center' ? <path d="M4 6h16M7 12h10M5 18h14" /> : <path d="M4 6h16M4 12h10M4 18h14" />}</svg>
          </button>
          <button type="button" aria-label="Change colour" onClick={() => setShowColors((s) => !s)} style={btn}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: b.bg, border: '2.5px solid #FFFFFF', boxSizing: 'border-box' }} />
          </button>
        </div>
        {showColors && (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 14px 10px', scrollbarWidth: 'none' }}>
            {TEXT_STORY_BGS.map((o, i) => (
              <div key={o.k} role="button" aria-label={`Background ${o.label}`} onClick={() => setBgIdx(i)} style={{ width: 34, height: 34, flexShrink: 0, borderRadius: '50%', background: o.bg, border: i === bgIdx ? '3px solid #FFFFFF' : '2px solid rgba(255,255,255,0.5)', boxSizing: 'border-box', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
            ))}
          </div>
        )}
        <div onClick={() => { try { areaRef.current && areaRef.current.focus(); } catch {} }} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 26px', cursor: 'text' }}>
          <textarea ref={areaRef} value={text} onChange={(e) => setText(e.target.value.slice(0, 700))} placeholder="Type a status" aria-label="Status text" rows={1}
            style={{ width: '100%', maxHeight: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: b.ink, textAlign: align, fontFamily: fam, fontWeight: weight, fontSize: previewPx, lineHeight: 1.22, caretColor: b.ink, overflow: 'auto', fieldSizing: 'content', minHeight: previewPx * 1.3 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div style={{ flex: 1, fontSize: 12.5, opacity: 0.85, fontWeight: 600 }}>{len ? `${len}/700` : 'Shared with your followers for 24 hours'}</div>
          <button type="button" aria-label="Share to your story" disabled={!len || busy} onClick={share} style={{ height: 44, padding: '0 18px', borderRadius: 22, border: 'none', background: '#FFFFFF', color: '#111', fontFamily: FONT, fontWeight: 800, fontSize: 14.5, display: 'flex', alignItems: 'center', gap: 8, cursor: len ? 'pointer' : 'default', opacity: len ? 1 : 0.55 }}>
            {busy && !closeBusy ? <Spinner size={16} color="#111" /> : <StatusIcon size={17} color="#111" />}Your story
          </button>
          <CloseShareButton count={closeCount} size={44} disabled={!len || busy} busy={closeBusy} onEmpty={() => setCloseEdit(true)} onShare={() => share(true)} />
        </div>
        {closeEdit && <CloseFriendsPicker myId={myId} zIndex={700} onClose={() => { setCloseEdit(false); reloadClose(); }} />}
      </div>
    </Portal>
  );
}

export function StoryCreateSheet({ onClose, onCamera, onGallery, onText, onDraw, uid = null, onDraft = null, onShared = null }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const items = [
    { k: 'camera', label: 'Camera', icon: <Camera />, on: onCamera },
    { k: 'gallery', label: 'Photos and videos', short: 'Gallery', icon: <ImageIcon />, on: onGallery },
    { k: 'text', label: 'Text', icon: <Type />, on: onText },
    { k: 'draw', label: 'Draw', icon: <DoodleIcon />, on: onDraw },
    onShared ? { k: 'shared', label: 'Shared story', short: 'Shared', icon: <SharedStoryIcon />, on: onShared } : null,
  ].filter(Boolean);
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 4px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '6px 16px 14px' }}>New story</div>
          {uid && onDraft && <DraftsRow uid={uid} kind="story" onOpen={onDraft} />}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: 4, padding: '0 10px 4px' }}>
            {items.map((it) => (
              <div key={it.k} role="button" aria-label={it.label} onClick={() => { playUiSound('tap'); it.on(); }} className="zchat-press zplain-tile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, padding: '13px 2px 11px', borderRadius: 16, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(it.icon, { size: 30, strokeWidth: 1.6, color: theme.ink })}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.ink }}>{it.short || it.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', padding: '14px 24px 0', lineHeight: 1.45 }}>Stories disappear after 24 hours. Your followers can see them.</div>
        </div>
      </div>
    </Portal>
  );
}

export function AddToHighlightSheet({ userId, story, onClose, onDone }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [list, setList] = useState(() => { const m = highlightsMem.get(userId); return m ? [...m].reverse() : null; });
  const [busy, setBusy] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  useEffect(() => {
    let alive = true;
    supabase.from('highlights').select('*').eq('user_id', userId).order('created_at', { ascending: false }).then(({ data, error }) => { if (alive) setList((prev) => (error && !data ? prev || [] : data || [])); });
    return () => { alive = false; };
  }, [userId]);
  const item = (hid) => ({ highlight_id: hid, user_id: userId, media_url: story.media_url, media_type: story.media_type, overlay_url: story.overlay_url || null, caption: story.caption || null });
  const addTo = async (h) => {
    if (busy) return;
    onDone(`Added to ${h.title}`);
    const { error } = await supabase.from('highlight_items').insert(item(h.id));
    if (error) appSnack(friendlyError(error, "Couldn't add it. Try again."));
  };
  const createNew = async () => {
    if (busy) return;
    const name = (title.trim() || 'Highlights').slice(0, 20);
    onDone(`Added to ${name}`);
    const { data: h, error } = await supabase.from('highlights').insert({ user_id: userId, title: name, cover_url: story.media_url, cover_type: story.media_type }).select().single();
    if (error || !h) { appSnack(friendlyError(error, "Couldn't make the highlight. Try again.")); return; }
    highlightsMem.set(userId, [...(highlightsMem.get(userId) || []).filter((x) => x.id !== h.id), h]);
    await supabase.from('highlight_items').insert(item(h.id));
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, maxHeight: 'min(80vh, calc(100% - 24px))', overflowY: 'auto', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 4px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '6px 16px 12px' }}>Add to highlight</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '2px 16px 10px', scrollbarWidth: 'none' }}>
            <div role="button" aria-label="New highlight" onClick={() => setCreating(true)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', width: 70 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px dashed ${theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}><Plus size={24} /></div>
              <div style={{ fontSize: 12, color: theme.ink, fontWeight: 600 }}>New</div>
            </div>
            {list === null && <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}><Spinner size={18} color={theme.muted} /></div>}
            {(list || []).map((h) => (
              <div key={h.id} role="button" aria-label={`Highlight ${h.title}`} onClick={() => addTo(h)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, cursor: 'pointer', width: 70, opacity: busy && busy !== h.id ? 0.5 : 1 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: theme.rowBg, border: `2px solid ${theme.border}`, position: 'relative' }}>
                  {h.cover_type === 'video' ? <VideoThumb src={h.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={h.cover_url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {busy === h.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} color="#FFFFFF" /></div>}
                </div>
                <div style={{ fontSize: 12, color: theme.ink, fontWeight: 600, maxWidth: 70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.title}</div>
              </div>
            ))}
          </div>
          {creating && (
            <div style={{ display: 'flex', gap: 8, padding: '6px 16px 4px' }}>
              <input autoFocus value={title} onChange={(e) => setTitle(e.target.value.slice(0, 20))} placeholder="Highlight name" aria-label="Highlight name" style={{ ...inputStyle(theme), flex: 1 }} />
              <button type="button" onClick={createNew} disabled={busy === 'new'} style={{ padding: '0 16px', borderRadius: 12, border: 'none', background: theme.coral, color: '#FFFFFF', fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>{busy === 'new' ? <Spinner size={14} color="#FFFFFF" /> : 'Add'}</button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
export function StoryArchivePage({ userId, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => storyArchiveMem.get(userId) || null);
  useEffect(() => {
    let alive = true;
    supabase.from('stories').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(300).then(({ data, error }) => {
      if (error && !data) { if (alive) setRows((prev) => prev || []); return; }
      const list = (data || []).filter((s) => !s.repost_of && !storyGoneIds.has(s.id));
      storyArchiveMem.set(userId, list);
      if (alive) setRows(list);
    });
    return () => { alive = false; };
  }, [userId]);
  const groups = [];
  (rows || []).forEach((s) => {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = fmtDate(d, { month: 'long', year: 'numeric' });
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, label, items: [] }; groups.push(g); }
    g.items.push(s);
  });
  const all = rows || [];
  return (
    <FullPage title="Story archive" subtitle={rows ? `${rows.length} ${rows.length === 1 ? 'story' : 'stories'}` : null} onBack={onClose} zIndex={90} pad={false} portal={false}>
      {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.coral} /></div>}
      {rows && !rows.length && <EmptyState art="moments" title="No old stories yet" text="Stories you share are kept here after they disappear. Only you can see them." />}
      {groups.map((g) => (
        <div key={g.key}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.muted, padding: '14px 16px 8px' }}>{g.label}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {g.items.map((s) => (
              <div key={s.id} role="button" aria-label="Open old story" onClick={() => onOpen(all, s.id)} style={{ position: 'relative', aspectRatio: '9 / 16', background: theme.rowBg, overflow: 'hidden', cursor: 'pointer' }}>
                {s.media_type === 'video' ? <VideoThumb src={s.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={s.media_url} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                <div style={{ position: 'absolute', left: 6, top: 6, background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', borderRadius: 8, padding: '3px 7px', fontSize: 11.5, fontWeight: 800, lineHeight: 1.1, textAlign: 'center' }}>
                  <div>{new Date(s.created_at).getDate()}</div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, opacity: 0.85 }}>{fmtDate(new Date(s.created_at), { month: 'short' })}</div>
                </div>
                {isActiveUntil(s.expires_at) && <div style={{ position: 'absolute', right: 6, bottom: 6, background: theme.coral, color: '#FFFFFF', borderRadius: 7, padding: '2px 6px', fontSize: 10, fontWeight: 800 }}>Live</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </FullPage>
  );
}

export function StoryMentionPicker({ myId, groups, privacyCtx, onPick, onClose }) {
  useBackClose(true, onClose);
  const [q, setQ] = useState('');
  const [people, setPeople] = useState([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  useEffect(() => {
    const term = q.trim().replace(/^@/, '');
    if (term.length < 1) { setPeople([]); setHiddenCount(0); return undefined; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await searchAccounts(term);
      const found = sanitizeAvatarList(data, myId).filter((p) => p.id !== myId && !p.is_deleted).slice(0, 24);
      let tagSetting = null;
      if (found.length) {
        const { data: rows, error } = await fetchProfilesView(found.map((p) => p.id));
        if (!error && rows) tagSetting = new Map(rows.map((r) => [r.id, r.privacy_tags]));
      }
      const ctx = privacyCtx || {};
      const iFollow = ctx.iFollow || new Set();
      const allowed = ctx.allowed || new Set();
      const ok = found.filter((p) => privacyAllows({ ...p, privacy_tags: tagSetting ? tagSetting.get(p.id) : p.privacy_tags }, 'privacy_tags', myId, iFollow, allowed));
      if (!cancelled) { setPeople(ok.slice(0, 12)); setHiddenCount(found.length - ok.length); }
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
              <Avatar emoji={p.avatar} name={p.name} size={38} />
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 11.5, opacity: 0.6 }}>@{p.username}</div></div>
            </div>
          ))}
          {!groupMatches.length && !people.length && (
            <div style={{ textAlign: 'center', padding: 20, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{term ? (hiddenCount > 0 ? 'No one you can tag matches that' : 'No one found') : 'Type a name to mention someone'}</div>
          )}
          {hiddenCount > 0 && (
            <div style={{ textAlign: 'center', padding: '6px 16px 10px', fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
              {hiddenCount === 1 ? '1 account does not allow tags from you.' : `${hiddenCount} accounts do not allow tags from you.`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function setStorySoundPref(on) { storySoundPref.on = !!on; try { localStorage.setItem('zchat-story-sound', on ? 'on' : 'off'); } catch {} }
function releaseVideo(v) {
  if (!v) return;
  try { v.pause(); } catch {}
  try { v.removeAttribute('src'); v.load(); } catch {}
}
const storyPreVideos = [];
export function StoryViewer({ onAddYours, groupsList, startGroup = 0, startStoryId = null, onAddStory, onShare, externalPause = false, readOnly = false, highlightLike = null, initialRepostedIds = null, myId, seen, liked, onSeen, onClose, onLike, onReply, onRepost, onDelete, onReport, onOpenProfile, onOpenMention, mutedIds = null, onToggleMute, onAddToHighlight, onOpenArchive, extraActions, onOpenPlace = null, onShared = null }) {
  useBackClose(true, onClose);
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
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [hideUi, setHideUi] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(() => !storySoundPref.on);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [reply, setReply] = useState('');
  const [replyFocus, setReplyFocus] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [menu, setMenu] = useState(false);
  useBackClose(menu, () => setMenu(false));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRepost, setConfirmRepost] = useState(false);
  const [flash, setFlash] = useState('');
  const [viewCount, setViewCount] = useState(null);
  const [likeBurst, setLikeBurst] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState('');
  const [repostedIds, setRepostedIds] = useState(() => new Set(initialRepostedIds || []));
  const [repostBusy, setRepostBusy] = useState(false);
  const [repostPop, setRepostPop] = useState(false);
  const [keyboardLift, setKeyboardLift] = useState(0);
  const [viewTop, setViewTop] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [settling, setSettling] = useState(false);
  const [slideIn, setSlideIn] = useState('');
  const [pageHidden, setPageHidden] = useState(false);
  const [stickerBusy, setStickerBusy] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [songWait, setSongWait] = useState(false);
  const [vidWait, setVidWait] = useState(false);
  const [mediaDim, setMediaDim] = useState(null);
  const [stageDim, setStageDim] = useState(null);
  const [sensSeen, setSensSeen] = useState(() => new Set());
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 760);
  const videoRef = useRef(null);
  const attachRef = useRef(null);
  if (!attachRef.current) attachRef.current = (el) => { const prev = videoRef.current; if (prev && prev !== el) releaseVideo(prev); videoRef.current = el || null; };
  const attachVideo = attachRef.current;
  useEffect(() => () => { releaseVideo(videoRef.current); videoRef.current = null; storyPreVideos.splice(0).forEach(releaseVideo); }, []);
  const elapsedRef = useRef(0);
  const lastTickRef = useRef(0);
  const durationRef = useRef(STORY_IMAGE_MS);
  const progressRef = useRef(0);
  const pressRef = useRef(null);
  const barRefs = useRef([]);
  const flashTimer = useRef(0);
  const stageRef = useRef(null);

  const group0 = groupsList[gi];
  const story = group0 ? group0.stories[Math.min(si, group0.stories.length - 1)] : null;
  const shared = group0 && group0.shared ? group0.shared : null;
  const group = shared && story ? { ...group0, profile: (shared.people && shared.people[story.user_id]) || group0.profile } : group0;
  const replyOk = useCanInteract('story_reply', myId, group && group.profile ? group.profile.id : null);
  const isMine = !!group && group.profile.id === myId;
  const veiled = !!story && story.photo_flag === 'sensitive' && !isMine && !sensSeen.has(story.id);
  const stoppedBase = veiled || paused || holding || replyFocus || showViewers || menu || confirmDelete || confirmRepost || externalPause || !loaded || pageHidden || dragX !== 0 || settling || stickerBusy || showResponses;
  const stopped = stoppedBase || songWait;
  const stoppedRef = useRef(stopped);
  stoppedRef.current = stopped;

  const showFlash = (text, ms = 1500) => { clearTimeout(flashTimer.current); setFlash(text); flashTimer.current = setTimeout(() => setFlash(''), ms); };

  function goNext() {
    if (!group) return;
    if (si < group.stories.length - 1) { setSi(si + 1); return; }
    if (gi < groupsList.length - 1) {
      const nextGroup = groupsList[gi + 1];
      const idx = nextGroup.stories.findIndex((s) => !seen.has(s.id));
      setSlideIn('next');
      setGi(gi + 1);
      setSi(idx >= 0 ? idx : 0);
      return;
    }
    onClose();
  }
  function goPrev() {
    if (!group) return;
    if (si > 0) { setSi(si - 1); return; }
    if (gi > 0) { setSlideIn('prev'); setSi(groupsList[gi - 1].stories.length - 1); setGi(gi - 1); return; }
    elapsedRef.current = 0;
    progressRef.current = 0;
    const bar = barRefs.current[si];
    if (bar) bar.style.width = '0%';
    if (videoRef.current) { try { videoRef.current.currentTime = 0; } catch {} }
    if (storySong && songPlayer.el && songPlayer.cur === storySong.id) { try { songPlayer.el.currentTime = 0; } catch {} }
  }
  function goGroup(dir) {
    if (dir > 0) {
      if (gi < groupsList.length - 1) { const ng = groupsList[gi + 1]; const idx = ng.stories.findIndex((s) => !seen.has(s.id)); setSlideIn('next'); setGi(gi + 1); setSi(idx >= 0 ? idx : 0); } else onClose();
    } else if (gi > 0) { setSlideIn('prev'); setGi(gi - 1); setSi(0); } else { goPrev(); }
  }

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { setKeyboardLift(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))); setViewTop(Math.max(0, Math.round(vv.offsetTop))); });
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();
    return () => { cancelAnimationFrame(frame); vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);
  useEffect(() => {
    const onVis = () => setPageHidden(document.visibilityState === 'hidden');
    const onResize = () => setWide(window.innerWidth >= 760);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('resize', onResize); clearTimeout(flashTimer.current); };
  }, []);
  useEffect(() => {
    if (!groupsList.length) { onClose(); return; }
    if (!groupsList[gi]) { setGi(groupsList.length - 1); setSi(0); return; }
    const count = groupsList[gi].stories.length;
    if (si >= count) setSi(Math.max(0, count - 1));
  }, [groupsList]);
  useEffect(() => {
    if (!story) return;
    elapsedRef.current = 0;
    progressRef.current = 0;
    setLoaded(false);
    setFailed(false);
    setMediaDim(null);
    setVidWait(false);
    const hasSong = !!validSong(story.song);
    durationRef.current = hasSong ? STORY_SONG_MS : STORY_IMAGE_MS;
    setSongWait(hasSong && !(muted || soundBlocked));
    onSeen(story);
    setViewCount(null);
    if (!readOnly && group.profile.id === myId) {
      supabase.from('story_views').select('*', { count: 'exact', head: true }).eq('story_id', story.id).then(({ count }) => setViewCount(count || 0));
    }
    const pre = [];
    if (group.stories[si + 1]) pre.push(group.stories[si + 1]);
    const ng = groupsList[gi + 1];
    if (ng && ng.stories.length) pre.push(ng.stories[Math.max(0, ng.stories.findIndex((s) => !seen.has(s.id)))]);
    storyPreVideos.splice(0).forEach(releaseVideo);
    pre.forEach((s) => {
      if (!s || !s.media_url) return;
      if (s.media_type === 'video') { const v = document.createElement('video'); v.preload = 'auto'; v.muted = true; v.src = s.media_url; storyPreVideos.push(v); } else { const im = new Image(); im.decoding = 'async'; im.src = s.media_url; }
      const ns = validSong(s.song);
      if (ns && !(muted || soundBlocked) && !dataSaverOn()) warmSong(ns);
    });
  }, [story && story.id]);
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const fit = () => { const w = el.clientWidth; const h = el.clientHeight; setStageDim((p) => (p && Math.abs(p.w - w) < 0.5 && Math.abs(p.h - h) < 0.5 ? p : { w, h })); };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [gi, wide]);
  useEffect(() => {
    if (!slideIn) return undefined;
    const t = setTimeout(() => setSlideIn(''), 320);
    return () => clearTimeout(t);
  }, [slideIn, gi]);
  useEffect(() => {
    if (!holding) { setHideUi(false); return undefined; }
    const t = setTimeout(() => setHideUi(true), 240);
    return () => clearTimeout(t);
  }, [holding]);
  useEffect(() => {
    if (!story) return undefined;
    let frame = 0;
    lastTickRef.current = performance.now();
    const tick = (t) => {
      const dt = Math.min(100, t - lastTickRef.current);
      lastTickRef.current = t;
      if (!stoppedRef.current) {
        let p;
        const v = videoRef.current;
        if (story.media_type === 'video' && v && !failed && Number.isFinite(v.duration) && v.duration > 0) {
          const total = Math.min(v.duration, 60);
          p = v.ended ? 1 : Math.min(1, v.currentTime / total);
          if (v.currentTime >= total - 0.04) p = 1;
        } else {
          elapsedRef.current += dt;
          p = Math.min(1, elapsedRef.current / durationRef.current);
        }
        progressRef.current = p;
        const bar = barRefs.current[si];
        if (bar) bar.style.width = `${p * 100}%`;
        if (p >= 1) { goNext(); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [gi, si, story && story.id, failed]);
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !v.isConnected || !story || story.media_type !== 'video') return;
    if (stopped && loaded) v.pause();
    else if (!stopped) v.play().catch((err) => {
      if (err && err.name === 'NotAllowedError' && !v.muted) { v.muted = true; setSoundBlocked(true); v.play().catch(() => {}); }
    });
  }, [stopped, loaded, story && story.id]);
  const soundOff = muted || soundBlocked;
  const storySong = validSong(story && story.song);
  const songPlayingId = useSongPlaying();
  const songStoryRef = useRef(null);
  const songStartRef = useRef(null);
  const songGiveUpRef = useRef(null);
  const songAlignRef = useRef(null);
  const songLiveRef = useRef(null);
  songLiveRef.current = storySong && !soundOff ? storySong.id : null;
  const storyClockRef = useRef(() => 0);
  storyClockRef.current = () => {
    const v = videoRef.current;
    if (story && story.media_type === 'video' && v && Number.isFinite(v.currentTime)) return v.currentTime;
    return elapsedRef.current / 1000;
  };
  useEffect(() => {
    const el = songEl();
    const ours = () => !!songLiveRef.current && songPlayer.id === songLiveRef.current;
    const onPlaying = () => {
      if (!ours()) return;
      const sid = songStoryRef.current;
      if (sid && songAlignRef.current === sid) {
        songAlignRef.current = null;
        const at = storyClockRef.current();
        if (Number.isFinite(at) && at > 0.3 && Math.abs((el.currentTime || 0) - at) > 0.3) { try { el.currentTime = at; } catch {} }
      }
      setSongWait(false);
    };
    const onWaiting = () => {
      if (!ours()) return;
      const sid = songStoryRef.current;
      if (!sid || songGiveUpRef.current === sid) return;
      setSongWait(true);
    };
    const onEnded = () => setSongWait(false);
    const onFail = () => { if (songStoryRef.current) songGiveUpRef.current = songStoryRef.current; setSongWait(false); };
    el.addEventListener('playing', onPlaying);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onFail);
    return () => { el.removeEventListener('playing', onPlaying); el.removeEventListener('waiting', onWaiting); el.removeEventListener('ended', onEnded); el.removeEventListener('error', onFail); };
  }, []);
  useEffect(() => {
    const sid = story && story.id;
    if (!storySong) { setSongWait(false); songStoryRef.current = null; if (songPlayer.id || songPlayer.cur || songPlayer.wait) stopSong(); return undefined; }
    if (songStoryRef.current !== sid) { songStoryRef.current = sid; songStartRef.current = null; songAlignRef.current = null; if (!soundOff) primeSong(storySong); }
    if (soundOff) { setSongWait(false); pauseSong(); return undefined; }
    if (stoppedBase || vidWait) { pauseSong(); return undefined; }
    const first = songStartRef.current !== sid;
    songStartRef.current = sid;
    if (first && storyClockRef.current() > 0.3) songAlignRef.current = sid;
    const el = songEl();
    const live = songPlayer.cur === storySong.id && !el.paused && el.readyState >= 3;
    if (songGiveUpRef.current !== sid && !live) setSongWait(true);
    const pr = playSong(storySong, first);
    if (pr && pr.then) {
      pr.then(null, (err) => {
        if (songStoryRef.current !== sid || (err && err.name === 'AbortError')) return;
        songGiveUpRef.current = sid;
        songAlignRef.current = sid;
        setSongWait(false);
        if (err && err.name === 'NotAllowedError') setSoundBlocked(true);
      });
    }
    return undefined;
  }, [story && story.id, stoppedBase, vidWait, soundOff, !!storySong]);
  useEffect(() => {
    if (!songWait || stoppedBase) return undefined;
    const sid = story && story.id;
    const t = setTimeout(() => { if (sid) { songGiveUpRef.current = sid; songAlignRef.current = sid; } setSongWait(false); }, 2500);
    return () => clearTimeout(t);
  }, [songWait, stoppedBase, story && story.id]);
  useEffect(() => { hushOtherMedia(null, true); return () => stopSong(); }, []);
  const kickSong = () => {
    if (!storySong || !story || stoppedBase) return;
    songAlignRef.current = story.id;
    playSong(storySong, songPlayer.cur !== storySong.id);
  };
  const toggleSound = () => {
    const v = videoRef.current;
    if (soundBlocked) { setSoundBlocked(false); setMuted(false); setStorySoundPref(true); if (v) { v.muted = false; v.play().catch(() => {}); } kickSong(); return; }
    const n = !muted;
    setMuted(n);
    setStorySoundPref(!n);
    if (v) v.muted = n;
    if (!n) kickSong();
  };
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!group || !story) return null;

  const width = () => (stageRef.current ? stageRef.current.getBoundingClientRect().width : window.innerWidth);
  const onDown = (e) => {
    if (e.target.closest && e.target.closest('[data-story-control]')) return;
    pressRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), horiz: false };
    setHolding(true);
  };
  const onMove = (e) => {
    const p = pressRef.current;
    if (!p || replyFocus) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!p.horiz && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.2) p.horiz = true;
    if (p.horiz) {
      const atEdge = dx > 0 && gi === 0;
      setDragX(atEdge ? dx * 0.3 : dx);
    }
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
    if (p.horiz) {
      const w = width();
      const fast = Math.abs(dx) / Math.max(1, Date.now() - p.t) > 0.5;
      if ((Math.abs(dx) > w * 0.22 || (fast && Math.abs(dx) > 40)) && !(dx > 0 && gi === 0)) {
        setDragX(0);
        goGroup(dx < 0 ? 1 : -1);
      } else {
        setSettling(true);
        setDragX(0);
        setTimeout(() => setSettling(false), 200);
      }
      return;
    }
    if (dy > 90 && Math.abs(dy) > Math.abs(dx)) { onClose(); return; }
    if (dy < -70 && Math.abs(dy) > Math.abs(dx) && isMine && !readOnly) { setShowViewers(true); return; }
    if (dy < -70 && Math.abs(dy) > Math.abs(dx) && !isMine && !readOnly) { setReplyFocus(true); const el = document.querySelector('[data-story-reply]'); if (el) el.focus(); return; }
    if (Date.now() - p.t > 260 || Math.abs(dx) > 14 || Math.abs(dy) > 14) return;
    if (e.clientX - (stageRef.current ? stageRef.current.getBoundingClientRect().left : 0) < width() * 0.3) goPrev(); else goNext();
  };

  const isLiked = liked.has(story.id);
  const toggleLike = () => {
    if (!isLiked) { setLikeBurst(true); setTimeout(() => setLikeBurst(false), 700); }
    onLike(story, !isLiked);
  };
  const repostedHere = repostedIds.has(story.id);
  const doRepost = async () => {
    setConfirmRepost(false);
    playUiSound('repost');
    const target = story;
    setRepostedIds((prev) => new Set(prev).add(target.id));
    setRepostPop(true);
    setTimeout(() => setRepostPop(false), 700);
    showFlash('Added to your story', 1600);
    const result = await onRepost(target, group.profile);
    if (result !== 'ok' && result !== 'already') setRepostedIds((prev) => { const n = new Set(prev); n.delete(target.id); return n; });
  };
  const sendReply = async () => {
    const text = reply.trim();
    if (!text) return;
    setReply('');
    const el = document.querySelector('[data-story-reply]');
    if (el) el.blur();
    setReplyFocus(false);
    showFlash('Sent', 1400);
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
  const ownerMuted = !!(mutedIds && !isMine && mutedIds.has(group.profile.id));
  const uiFade = { opacity: hideUi ? 0 : 1, transition: 'opacity 0.18s ease', pointerEvents: hideUi ? 'none' : undefined };
  const sharedItems = shared && onShared && !readOnly ? [
    shared.canAdd ? { k: 'sadd', label: `Add to ${shared.title}`, on: () => onShared('add', shared, story) } : null,
    { k: 'sinfo', label: 'Shared story details', on: () => onShared('info', shared, story) },
    shared.mine && story.user_id !== myId ? { k: 'srm', label: 'Remove this clip', danger: true, on: () => onShared('remove', shared, story) } : null,
  ] : [];
  const menuItems = [...sharedItems, ...(isMine && !readOnly ? [
    onShare ? { k: 'share', label: 'Share', on: () => onShare(story, group.profile) } : null,
    onAddToHighlight ? { k: 'hl', label: 'Add to highlight', on: () => onAddToHighlight(story) } : null,
    { k: 'save', label: 'Save to phone', on: () => { silentDownload(story.media_url, story.media_type === 'video' ? 'zchat-story.mp4' : 'zchat-story.jpg'); showFlash('Saving'); } },
    onOpenArchive ? { k: 'archive', label: 'Story archive', on: () => onOpenArchive() } : null,
    { k: 'delete', label: 'Delete story', danger: true, on: () => setConfirmDelete(true) },
  ] : [
    onShare ? { k: 'share', label: 'Share', on: () => onShare(story, group.profile) } : null,
    onToggleMute ? { k: 'mute', label: ownerMuted ? `Unmute stories from ${(group.profile.name || '').split(' ')[0]}` : `Mute stories from ${(group.profile.name || '').split(' ')[0]}`, on: () => { const nowMuted = !ownerMuted; onToggleMute(group.profile, nowMuted); showFlash(nowMuted ? 'Muted' : 'Unmuted'); } } : null,
    { k: 'profile', label: 'View profile', on: () => onOpenProfile(group.profile) },
    { k: 'report', label: 'Report', danger: true, on: () => onReport(group.profile) },
  ])].filter((it) => !(shared && it && it.k === 'mute'));
  const navBtn = { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20, border: 'none' };
  const storyTool = { flex: '0 0 auto', minWidth: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '2px 6px', cursor: 'pointer', color: '#FFFFFF', fontSize: 11.5, fontWeight: 600, lineHeight: 1.2, textShadow: '0 1px 3px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' };
  const storyToolGlyph = { height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))' };
  const mediaFit = mediaDim && stageDim && stageDim.w > 0 && stageDim.h > 0 ? (() => { const k = Math.min(stageDim.w / mediaDim.w, stageDim.h / mediaDim.h); const w = mediaDim.w * k; const h = mediaDim.h * k; return { x: (stageDim.w - w) / 2, y: (stageDim.h - h) / 2, w, h }; })() : null;
  const stageAnim = slideIn === 'next' ? 'zchat-story-in-next 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)' : slideIn === 'prev' ? 'zchat-story-in-prev 0.3s cubic-bezier(0.2, 0.9, 0.3, 1)' : undefined;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: '#000', display: 'flex', justifyContent: 'center' }} className="zchat-fade">
      {wide && (gi > 0 || si > 0) && <button type="button" aria-label="Previous story" data-story-control onClick={goPrev} style={{ ...navBtn, left: 'calc(50% - 320px)' }}><ChevronLeft size={24} color="#FFFFFF" /></button>}
      {wide && <button type="button" aria-label="Next story" data-story-control onClick={goNext} style={{ ...navBtn, right: 'calc(50% - 320px)' }}><ChevronRight size={24} color="#FFFFFF" /></button>}
      <div ref={stageRef} key={`g-${gi}`} style={{ position: 'relative', width: '100%', maxWidth: 520, height: '100%', overflow: 'hidden', color: 'white', transform: dragX ? `translateX(${dragX}px)` : undefined, transition: settling ? 'transform 0.2s ease' : 'none', animation: stageAnim, borderRadius: wide ? 14 : 0 }}>
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { pressRef.current = null; setHolding(false); setDragX(0); }}
          onDoubleClick={() => { if (!isMine && !readOnly) toggleLike(); }}
          style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none' }}>
          {story.media_type === 'video' ? (
            <video key={story.id} ref={attachVideo} data-zmix="story" src={story.media_url} playsInline autoPlay muted={soundOff}
              onLoadedMetadata={(e) => { const v = e.currentTarget; const d = v.duration; durationRef.current = Number.isFinite(d) && d > 0 ? Math.min(d, 60) * 1000 : 15000; if (v.videoWidth && v.videoHeight) setMediaDim({ w: v.videoWidth, h: v.videoHeight }); setLoaded(true); }}
              onWaiting={() => setVidWait(true)} onPlaying={() => setVidWait(false)}
              onError={() => { setFailed(true); setLoaded(true); }}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
          ) : (
            <img key={story.id} src={story.media_url} alt="" draggable={false} onLoad={(e) => { const im = e.currentTarget; if (im.naturalWidth && im.naturalHeight) setMediaDim({ w: im.naturalWidth, h: im.naturalHeight }); setLoaded(true); }} onError={() => { setFailed(true); setLoaded(true); }}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none' }} />
          )}
          {veiled && !failed && (
            <div role="button" aria-label="Show sensitive story" data-story-control onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); hapticTap(); setSensSeen((s) => new Set(s).add(story.id)); }}
              style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 24, textAlign: 'center', color: '#FFFFFF', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(38px) saturate(1.2)', WebkitBackdropFilter: 'blur(38px) saturate(1.2)', cursor: 'pointer' }}>
              <HiddenPhotoIcon size={30} color="#FFFFFF" />
              <div style={{ fontSize: 15, fontWeight: 800 }}>Sensitive</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.85 }}>Tap to view</div>
            </div>
          )}
          {story.overlay_url && story.media_type === 'video' && !failed && (
            <img src={story.overlay_url} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          )}
          {!loaded && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={26} /></div>}
          {failed && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30, textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>This story couldn't load</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Check your connection. It moves on by itself.</div>
            </div>
          )}
          {soundBlocked && (story.media_type === 'video' || storySong) && !failed && (
            <div role="button" aria-label="Tap for sound" data-story-control onClick={(e) => { e.stopPropagation(); toggleSound(); }} className="zchat-fade" style={{ position: 'absolute', left: '50%', bottom: 118, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', zIndex: 6 }}><VolumeX size={15} color="#FFFFFF" />Tap for sound</div>
          )}
          {paused && !holding && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}><div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pause size={28} color="#FFFFFF" /></div></div>}
          {burstEmoji && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', fontSize: 120, animation: 'zchat-heart-burst 0.9s ease' }}>{burstEmoji}</div>}
          {likeBurst && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', animation: 'zchat-heart-burst 0.7s ease' }}><Heart size={110} color="#FF3B5C" fill="#FF3B5C" /></div>}
        </div>

        {storySong && !failed && (storySong.pos ? (mediaFit && loaded && (
          <div style={{ position: 'absolute', left: mediaFit.x + storySong.pos.x * mediaFit.w, top: mediaFit.y + storySong.pos.y * mediaFit.h, transform: `translate(-50%, -50%) rotate(${storySong.pos.r}deg) scale(${(storySong.pos.s * mediaFit.w) / STORY_REF_W})`, zIndex: 4, pointerEvents: 'none' }}>
            <StoryMusicSticker song={storySong} look={storySong.look} playing={songPlayingId === storySong.id && !songWait} waiting={songWait && !soundOff} />
          </div>
        )) : (
          <div style={{ position: 'absolute', left: 14, top: `calc(${viewTop}px + 78px + env(safe-area-inset-top))`, zIndex: 5, pointerEvents: 'none', ...uiFade }}>
            <StorySongTag song={storySong} playing={songPlayingId === storySong.id && !songWait} waiting={songWait && !soundOff && loaded} />
          </div>
        ))}
        {story.sticker && !failed && <StoryStickerView key={`sk-${story.id}`} story={story} frame={loaded ? mediaFit : null} isMine={isMine && !readOnly} myId={myId} onBusy={setStickerBusy} onOpenResponses={() => setShowResponses(true)} owner={group.profile} onAddYours={onAddYours && !readOnly ? (st) => onAddYours(st) : null} />}
        <div style={{ position: 'absolute', left: 0, right: 0, top: viewTop, zIndex: 5, padding: 'calc(8px + env(safe-area-inset-top)) 10px 28px', background: 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))', pointerEvents: 'none', ...uiFade }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {group.stories.map((s, i) => (
              <div key={s.id} style={{ flex: 1, height: 2.5, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
                <div ref={(el) => { barRefs.current[i] = el; }} style={{ height: '100%', background: 'white', width: `${i < si ? 100 : i === si ? progressRef.current * 100 : 0}%` }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, pointerEvents: hideUi ? 'none' : 'auto' }} data-story-control>
            <div onClick={() => onOpenProfile(group.profile)} style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <Avatar emoji={group.profile.avatar} name={group.profile.name} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shared ? shared.title : isMine && !readOnly ? 'Your story' : group.profile.name}{!shared && <VerifiedBadge tier={group.profile.verified} custom={group.profile.custom_badge} size={13} />}</span>
                  <span style={{ fontSize: 12, opacity: 0.75, flexShrink: 0 }}>{timeShort(story.created_at)}</span>
                  {story.audience === 'close' && <CloseFriendsBadge />}{story.members_only && <CrMembersBadge />}
                  {isMine && !shared && String(story.audience || '').indexOf('list:') === 0 && <StoryListBadge name={storyListName(myId, story.audience)} />}
                </div>
                {story.repost_of && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.8 }}><Repeat size={11} /> Reposted{story.repost_label ? ` from @${story.repost_label}` : ''}</div>}
                {shared && <div style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Added by {story.user_id === myId ? 'you' : String(group.profile.name || 'someone').split(' ')[0]}</div>}
                {onOpenPlace && <PlaceTagLine place={story.place} onOpen={onOpenPlace} style={{ opacity: 0.92 }} />}
              </div>
            </div>
            <div role="button" aria-label={paused ? 'Play story' : 'Pause story'} onClick={() => setPaused((pp) => !pp)} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}>{paused ? <Play size={20} color="white" /> : <Pause size={20} color="white" />}</div>
            {(story.media_type === 'video' || storySong) && (
              <div role="button" aria-label={soundOff ? 'Sound on' : 'Sound off'} onClick={toggleSound} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}>{soundOff ? <VolumeX size={20} color="white" /> : <Volume2 size={20} color="white" />}</div>
            )}
            {!readOnly && <div role="button" aria-label="Story options" onClick={() => setMenu(true)} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}><MoreVertical size={20} color="white" /></div>}
            <div role="button" aria-label="Close story" onClick={onClose} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}><X size={22} color="white" /></div>
          </div>
        </div>

        {(story.caption || mentions.length > 0) && !replyFocus && (
          <div data-story-control style={{ position: 'absolute', left: 14, right: 14, bottom: `calc(${readOnly && extraActions && extraActions.length ? 112 : isMine && !readOnly ? 120 : 84}px + env(safe-area-inset-bottom))`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, ...uiFade }}>
            {story.caption && <div style={{ padding: '2px 6px', fontSize: 15.5, fontWeight: 600, lineHeight: 1.35, textAlign: 'center', maxWidth: '100%', wordBreak: 'break-word', whiteSpace: 'pre-wrap', textShadow: '0 1px 2px rgba(0,0,0,0.75), 0 0 14px rgba(0,0,0,0.5)' }}><RichText text={story.caption} onMention={(p) => onOpenProfile(p)} /></div>}
            {mentions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', columnGap: 14, rowGap: 2, color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.65)' }}>
                {mentions.map((mn) => (
                  <div key={`${mn.kind}-${mn.id}`} role="button" aria-label={`Open ${mn.label}`} onClick={() => onOpenMention(mn)} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 5, minHeight: 30, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    <span style={{ display: 'flex', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.55))' }}>{mn.kind === 'group' ? <LineGlyph k="friends" size={17} /> : <AtSign size={15} strokeWidth={2.4} />}</span>{mn.label}
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
        <div data-story-control style={{ position: 'absolute', left: 0, right: 0, bottom: keyboardLift, zIndex: 4, padding: '14px 12px', paddingBottom: keyboardLift ? 10 : 'calc(14px + env(safe-area-inset-bottom))', background: replyFocus ? 'transparent' : 'linear-gradient(0deg, rgba(0,0,0,0.6), rgba(0,0,0,0))', display: 'flex', alignItems: 'center', gap: 10, transition: 'bottom 0.18s ease, opacity 0.18s ease', opacity: hideUi ? 0 : 1, pointerEvents: hideUi ? 'none' : undefined }}>
          {readOnly ? (
            highlightLike ? (
              <>
                <div style={{ flex: 1 }} />
                <div onClick={highlightLike.onToggle} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', cursor: 'pointer' }}>
                  <Heart size={27} color={highlightLike.liked ? '#FF3B5C' : 'white'} fill={highlightLike.liked ? '#FF3B5C' : 'none'} />
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{highlightLike.count > 0 ? formatCount(highlightLike.count) : ''}</span>
                </div>
              </>
            ) : extraActions && extraActions.length ? (
              <div role="toolbar" aria-label="Story actions" style={{ display: 'flex', width: '100%', justifyContent: 'space-around', alignItems: 'flex-start' }}>
                {extraActions.map((a) => (
                  <div key={a.label} role="button" aria-label={a.label} onClick={() => a.on(story)} className="zchat-press" style={storyTool}><span style={storyToolGlyph}>{React.isValidElement(a.icon) ? React.cloneElement(a.icon, { size: 23 }) : a.icon}</span>{a.label}</div>
                ))}
              </div>
            ) : null
          ) : isMine ? (
            <>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', opacity: 0.85 }}>
                <ChevronRight size={18} style={{ transform: 'rotate(-90deg)' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700 }}>Swipe up for activity</span>
              </div>
              <div role="button" aria-label="Story viewers" onClick={() => setShowViewers(true)} className="zchat-press" style={{ ...storyTool, flex: '0 0 auto', alignItems: 'flex-start', minWidth: 64 }}>
                <span style={storyToolGlyph}><LineGlyph k="eye" size={24} sw={2} /></span>{viewCount == null ? 'Viewers' : `${viewCount} ${viewCount === 1 ? 'viewer' : 'viewers'}`}
              </div>
              <div style={{ position: 'relative', zIndex: 12, flex: 1 }} />
              {onShare && (
                <div role="button" aria-label="Share story" onClick={() => onShare(story, group.profile)} className="zchat-press" style={storyTool}><span style={storyToolGlyph}><LineGlyph k="send" size={23} sw={2} /></span>Share</div>
              )}
              {(shared ? shared.canAdd && onShared : onAddStory) && (
                <div role="button" aria-label={shared ? `Add to ${shared.title}` : 'Add to your story'} onClick={shared ? () => onShared('add', shared, story) : onAddStory} className="zchat-press" style={storyTool}><span style={storyToolGlyph}><LineGlyph k="highlight" size={24} sw={2} /></span>Add</div>
              )}
              <div role="button" aria-label="Delete story" onClick={() => setConfirmDelete(true)} className="zchat-press" style={storyTool}><span style={storyToolGlyph}><LineGlyph k="trash" size={23} sw={2} /></span>Delete</div>
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
              {replyOk ? (
              <input data-story-reply value={reply} onChange={(e) => setReply(e.target.value.slice(0, 1000))} onFocus={() => setReplyFocus(true)} onBlur={() => setTimeout(() => { if (document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-story-reply')) return; setReplyFocus(false); }, 160)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } }}
                  placeholder={`Reply to ${(group.profile.name || '').split(' ')[0]}`} aria-label="Reply to story"
                  style={{ flex: 1, minWidth: 0, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.55)', background: 'rgba(0,0,0,0.25)', color: 'white', outline: 'none', fontFamily: FONT, fontSize: 15 }} />
              ) : (
                <div aria-label="Replies are off" style={{ flex: 1, minWidth: 0, padding: '11px 16px', borderRadius: 24, border: '1.5px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)', fontSize: 14.5, fontFamily: FONT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Replies are off</div>
              )}
              {reply.trim() ? (
                <div role="button" aria-label="Send reply" onPointerDown={(e) => e.preventDefault()} onClick={sendReply} style={{ padding: '10px 14px', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>Send</div>
              ) : (
                <>
                  <div role="button" aria-label={isLiked ? 'Unlike story' : 'Like story'} onClick={toggleLike} style={{ padding: 6, cursor: 'pointer', position: 'relative', zIndex: 12, display: 'flex' }}><Heart size={26} color={isLiked ? '#FF3B5C' : 'white'} fill={isLiked ? '#FF3B5C' : 'none'} /></div>
                  {!shared && String(story.audience || '').indexOf('list:') !== 0 && (<div role="button" aria-label="Repost" onClick={() => {
                    if (repostBusy) return;
                    if (repostedHere) { showFlash('Already on your story', 1600); return; }
                    setConfirmRepost(true);
                  }} style={{ padding: 6, cursor: 'pointer', position: 'relative', display: 'flex' }}>
                    {repostPop && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #34D399', animation: 'zchat-repost-ring 0.6s ease-out', pointerEvents: 'none' }} />}
                    <div style={{ transition: 'transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.5)', transform: repostPop ? 'rotate(180deg) scale(1.25)' : 'rotate(0deg) scale(1)', display: 'flex' }}>
                      {repostBusy ? <Spinner size={22} color="white" /> : <Repeat size={24} color={repostedHere ? '#34D399' : 'white'} strokeWidth={repostedHere ? 2.6 : 2} />}
                    </div>
                    {repostedHere && <div style={{ position: 'absolute', right: 1, bottom: 2, width: 13, height: 13, borderRadius: '50%', background: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid black' }}><Check size={8} color="black" strokeWidth={4} /></div>}
                  </div>)}
                  {onShare && <div role="button" aria-label="Send story" onClick={() => onShare(story, group.profile)} style={{ padding: 6, cursor: 'pointer', display: 'flex' }}><Send size={23} color="white" /></div>}
                </>
              )}
            </>
          )}
        </div>

        {flash && <div style={{ position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', padding: '9px 16px', borderRadius: 20, fontSize: 13.5, fontWeight: 700, zIndex: 30, pointerEvents: 'none' }} className="zchat-pop">{flash}</div>}

        {menu && (
          <div onClick={() => setMenu(false)} style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
            <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: '#15151B', borderRadius: '22px 22px 0 0', padding: '8px 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 6px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }} /></div>
              {menuItems.filter(Boolean).map((it) => (
                <div key={it.k} role="button" aria-label={it.label} onClick={() => { setMenu(false); it.on(); }} style={{ padding: '15px 22px', fontWeight: 700, fontSize: 15, cursor: 'pointer', color: it.danger ? '#FF5A6A' : '#FFFFFF' }}>{it.label}</div>
              ))}
              <div role="button" onClick={() => setMenu(false)} style={{ padding: '15px 22px', opacity: 0.7, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</div>
            </div>
          </div>
        )}
        {showViewers && <StoryViewersSheet story={story} myId={myId} onClose={() => setShowViewers(false)} onOpenProfile={(p) => { setShowViewers(false); onOpenProfile(p); }} />}
        {showResponses && <StoryResponsesSheet story={story} onClose={() => setShowResponses(false)} onOpenProfile={(p) => { setShowResponses(false); onOpenProfile(p); }} />}
        {confirmDelete && (
          <ConfirmDialog title="Delete this story?" body="It will be removed for everyone right away."
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => { setConfirmDelete(false); const remaining = group.stories.length - 1; await onDelete(story); if (remaining <= 0) onClose(); else if (si >= remaining) setSi(remaining - 1); }} />
        )}
        {confirmRepost && (
          <ConfirmDialog title="Add to your story?" body={`${(group.profile.name || 'Their').split(' ')[0]}'s story will show on your story for 24 hours, with their name on it.`} confirmLabel="Add" danger={false} layer={420}
            onCancel={() => setConfirmRepost(false)} onConfirm={doRepost} />
        )}
      </div>
    </div>
  );
}
const SHARED_AUDIENCES = [
  ['members', 'Only the people in it', 'Everyone you invite can see it and add to it'],
  ['followers', 'Your followers too', 'People who follow you can watch it'],
  ['everyone', 'Everyone', 'Anyone who can see your stories can watch it'],
];
export function SharedStoryNewPage({ uid, me, groups, onClose, onCreated }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [aud, setAud] = useState('members');
  const [keep, setKeep] = useState(false);
  const [people, setPeople] = useState([]);
  const [group, setGroup] = useState(null);
  const [pick, setPick] = useState(false);
  const [groupPick, setGroupPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ok = title.trim().length > 0 && !busy;
  const create = async () => {
    if (!ok) return;
    setBusy(true);
    setErr('');
    const { data, error } = await supabase.rpc('zchat_shared_create', { p_title: title.trim().slice(0, 40), p_audience: aud, p_people: people.map((p) => p.id), p_group: group ? group.id : null, p_keep: keep });
    setBusy(false);
    if (error || !data || !data.row) { setErr(rpcMissing(error) ? 'Shared stories switch on once the latest ZChat setup is finished.' : friendlyError(error, 'That did not work. Try again.')); return; }
    hapticTap();
    playUiSound('tap');
    const wanted = people.length;
    if (!group && wanted && Number(data.added) < wanted) appSnack('Some people were not added. You can invite people you follow or who follow you.');
    onCreated(data.row, Number(data.added) || 0);
  };
  return (
    <FullPage title="New shared story" onBack={onClose} zIndex={730} footer={<BigButton label={busy ? 'Making it' : 'Create'} disabled={!ok} onClick={create} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '6px 2px 4px', textWrap: 'pretty' }}>One story that friends add to together, for a party, a trip or a class. It lasts 24 hours.</div>
      <IgHeading>Name</IgHeading>
      <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 40))} placeholder="Beach day" aria-label="Shared story name" enterKeyHint="done" style={{ ...inputStyle(theme), fontSize: 16 }} />
      <IgHeading>Who is in it</IgHeading>
      <IgRow inset={false} icon={<UserPlus />} label={people.length ? `${countWord(people.length, 'person', 'people')} picked` : 'Invite people'} sub={people.length ? people.map((p) => String(p.name || '').split(' ')[0]).slice(0, 4).join(', ') + (people.length > 4 ? ` and ${people.length - 4} more` : '') : 'People you follow or who follow you'} onClick={() => setPick(true)} />
      {(groups || []).length > 0 && <IgRow inset={false} icon={<Users />} label={group ? group.name : 'Invite a group'} sub={group ? 'Everyone in the group is added' : 'Add everyone in one of your groups'} onClick={() => setGroupPick(true)} right={group ? <span role="button" aria-label="Remove group" onClick={(e) => { e.stopPropagation(); setGroup(null); }} style={{ display: 'flex', padding: 6, color: theme.muted, cursor: 'pointer' }}><X size={18} /></span> : null} />}
      <IgHeading>Who can see it</IgHeading>
      <ChoiceList label="Who can see it" value={aud} onChange={setAud} options={SHARED_AUDIENCES.map(([k, l, s]) => ({ k, label: l, sub: s }))} />
      <IgHeading>After 24 hours</IgHeading>
      <IgRow inset={false} label="Keep it as a highlight" sub="It stays on your profile when the 24 hours are up" right={<IgToggle on={keep} onClick={() => setKeep((v) => !v)} />} />
      {err && <div role="alert" style={{ color: theme.danger, fontSize: 13.5, fontWeight: 600, padding: '12px 2px' }}>{err}</div>}
      {pick && <PickPeoplePage userId={uid} title="Invite people" subtitle="They can add photos and videos to it" initial={people} max={50} onClose={() => setPick(false)} onDone={(list) => { setPeople(list || []); setPick(false); }} zIndex={760} />}
      {groupPick && <ActionSheet title="Invite a group" onClose={() => setGroupPick(false)} zIndex={760} items={(groups || []).slice(0, 30).map((g) => ({ k: g.id, label: g.name, icon: <Users />, on: () => { setGroupPick(false); setGroup({ id: g.id, name: g.name }); } }))} />}
    </FullPage>
  );
}
export function SharedStoryPage({ uid, me, sharedId, onClose, onAddClip, onOpenClip, onOpenProfile, covered = false }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const list = useSharedStories(uid);
  const cached = (list || []).find((x) => x.s.id === sharedId) || null;
  const [row, setRow] = useState(() => (cached ? cached.s : null));
  const [members, setMembers] = useState(null);
  const [clips, setClips] = useState(() => (cached ? cached.clips : null));
  const [gone, setGone] = useState(false);
  const [menuFor, setMenuFor] = useState(null);
  const [ask, setAsk] = useState(null);
  const [naming, setNaming] = useState(false);
  const [adding, setAdding] = useState(false);
  const [fail, setFail] = useState(null);
  const lp = useRef({});
  const load = async () => {
    const [sRes, mRes, cRes] = await Promise.all([
      supabase.from('zchat_shared_stories').select('*').eq('id', sharedId).maybeSingle(),
      supabase.from('zchat_shared_members').select('user_id, added_by, created_at').eq('shared_id', sharedId).limit(300),
      supabase.from('stories').select('*').eq('shared_id', sharedId).order('created_at', { ascending: true }).limit(200),
    ]).catch((e) => [{ error: e || {} }, { error: e || {} }, { error: e || {} }]);
    if (!sRes.error && !sRes.data) { setGone(true); return; }
    if (sRes.error || mRes.error || cRes.error) { setFail(loadFailCode(sRes.error || mRes.error || cRes.error)); return; }
    setFail(null);
    const ids = [...new Set([...(mRes.data || []).map((m) => m.user_id), ...(cRes.data || []).map((c) => c.user_id), sRes.data.owner_id])].filter((id) => id && !sharedStore.people[id] && id !== uid);
    if (ids.length) { const pr = await fetchProfilesView(ids); if (pr && pr.data) sanitizeAvatarList(pr.data, uid).forEach((p) => { sharedStore.people[p.id] = p; }); }
    setRow(sRes.data);
    setMembers((mRes.data || []).filter((m) => m.user_id === uid || sharedStore.people[m.user_id]));
    setClips((cRes.data || []).filter((c) => !storyGoneIds.has(c.id)));
  };
  useEffect(() => { load(); }, [sharedId]);
  useEffect(() => {
    if (!cached) return;
    setClips((cur) => {
      if (!cur) return cached.clips;
      const live = new Set(cached.clips.map((c) => c.id));
      const have = new Set(cur.map((c) => c.id));
      return [...cur.filter((c) => live.has(c.id) || !isActiveUntil(c.expires_at)), ...cached.clips.filter((c) => !have.has(c.id))].filter((c) => !storyGoneIds.has(c.id));
    });
  }, [cached && cached.clips]);
  const isOwner = !!row && row.owner_id === uid;
  const isMember = isOwner || !!(members || []).some((m) => m.user_id === uid);
  const active = !!row && Date.parse(row.expires_at) > Date.now();
  const personOf = (id) => (id === uid ? me : sharedStore.people[id]) || null;
  const patch = async (fields, undo) => {
    setRow((r) => (r ? { ...r, ...fields } : r));
    const { error } = await supabase.rpc('zchat_shared_update', { p_shared: sharedId, p_title: fields.title || null, p_audience: fields.audience || null, p_keep: typeof fields.keep === 'boolean' ? fields.keep : null });
    if (error) { setRow((r) => (r ? { ...r, ...undo } : r)); appSnack(friendlyError(error, 'That change did not save. Try again.')); return; }
    loadSharedStories(uid, null, true);
  };
  const removePerson = async (m) => {
    setAsk(null);
    const before = members;
    setMembers((cur) => (cur || []).filter((x) => x.user_id !== m.user_id));
    setClips((cur) => (cur || []).filter((c) => c.user_id !== m.user_id));
    playUiSound('delete');
    const { error } = await supabase.rpc('zchat_shared_remove', { p_shared: sharedId, p_user: m.user_id });
    if (error) { setMembers(before); load(); appSnack(friendlyError(error, 'That did not work. Try again.')); return; }
    if (m.user_id === uid) { loadSharedStories(uid, null, true); onClose(); return; }
    loadSharedStories(uid, null, true);
  };
  const removeClip = async (c) => {
    setAsk(null);
    setClips((cur) => (cur || []).filter((x) => x.id !== c.id));
    const ok = await removeSharedClip(c);
    if (!ok) load();
  };
  const removeAll = async () => {
    setAsk(null);
    playUiSound('delete');
    sharedStore.list = (sharedStore.list || []).filter((x) => x.s.id !== sharedId);
    sharedNotify();
    onClose();
    const { error } = await supabase.from('zchat_shared_stories').delete().eq('id', sharedId).eq('owner_id', uid);
    if (error) { appSnack(friendlyError(error, 'That shared story is still there. Try again.')); loadSharedStories(uid, null, true); }
  };
  const addPeople = async (list) => {
    setAdding(false);
    const fresh = (list || []).filter((p) => !(members || []).some((m) => m.user_id === p.id));
    if (!fresh.length) return;
    fresh.forEach((p) => { sharedStore.people[p.id] = p; });
    setMembers((cur) => [...(cur || []), ...fresh.map((p) => ({ user_id: p.id, added_by: uid, created_at: new Date().toISOString(), temp: true }))]);
    const { data, error } = await supabase.rpc('zchat_shared_add', { p_shared: sharedId, p_people: fresh.map((p) => p.id), p_group: null });
    if (error) { appSnack(friendlyError(error, 'Those people were not added. Try again.')); load(); return; }
    if (Number(data && data.added) < fresh.length) appSnack('Some people were not added. You can invite people you follow or who follow you.');
    fresh.forEach((p) => { if (me) sharedInviteNotify(p.id, me, row); });
    load();
  };
  if (gone) {
    return (
      <FullPage title="Shared story" onBack={onClose} zIndex={730} covered={covered}>
        <EmptyState art="moments" title="This shared story is gone" text="The person who made it ended it, or you are not in it anymore." />
      </FullPage>
    );
  }
  const clipsShown = clips || [];
  const memberRows = (members || []).slice().sort((a, b) => (a.user_id === (row && row.owner_id) ? -1 : b.user_id === (row && row.owner_id) ? 1 : Date.parse(a.created_at) - Date.parse(b.created_at)));
  return (
    <FullPage title={row ? row.title : 'Shared story'} subtitle={row ? sharedEndsText(row) : undefined} onBack={onClose} zIndex={730} covered={covered}
      right={isOwner ? <div role="button" aria-label="Rename shared story" onClick={() => setNaming(true)} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer' }}><Edit3 size={20} /></div> : null}
      footer={isMember && active ? <BigButton label="Add a photo or video" onClick={() => onAddClip({ id: sharedId, title: row ? row.title : '' })} /> : null}>
      {!row && (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); load(); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>)}
      {row && (
        <>
          <IgHeading>{clipsShown.length ? `${countWord(clipsShown.length, 'clip', 'clips')}` : 'Clips'}</IgHeading>
          {!clipsShown.length ? (
            <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '2px 2px 6px' }}>{isMember && active ? 'Nothing here yet. Add the first photo or video.' : 'Nothing here yet.'}</div>
          ) : (
            <div role="list" aria-label="Clips" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, margin: '0 -2px' }}>
              {clipsShown.map((c, i) => {
                const who = personOf(c.user_id);
                const canRemove = isOwner || c.user_id === uid;
                return (
                  <div key={c.id} role="listitem" aria-label={`Clip by ${who ? who.name : 'someone'}`} onClick={() => { if (lp.current.fired === c.id) { lp.current.fired = false; return; } onOpenClip(c, clipsShown, row); }}
                    {...storyLongPress(lp.current, c.id, canRemove ? () => setMenuFor(c) : null)}
                    style={{ position: 'relative', aspectRatio: '9 / 16', borderRadius: 10, overflow: 'hidden', background: theme.rowBg, cursor: 'pointer', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                    {c.media_type === 'video' ? <VideoThumb src={c.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={c.media_url} alt="" loading="lazy" draggable={false} onError={hideBroken} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                    <div style={{ position: 'absolute', left: 6, top: 6, minWidth: 18, height: 18, borderRadius: 9, background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxSizing: 'border-box' }}>{i + 1}</div>
                    {who && <div style={{ position: 'absolute', left: 6, bottom: 6, right: 6, display: 'flex', alignItems: 'center', gap: 5, color: '#FFFFFF', fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}><Avatar emoji={who.avatar} name={who.name} size={18} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.user_id === uid ? 'You' : String(who.name || '').split(' ')[0]}</span></div>}
                  </div>
                );
              })}
            </div>
          )}
          {clipsShown.length > 0 && (isOwner || clipsShown.some((c) => c.user_id === uid)) && <div style={{ fontSize: 12, color: theme.muted, padding: '8px 2px 0' }}>{isOwner ? 'Hold a clip to remove it.' : 'Hold one of your clips to remove it.'}</div>}
          <IgHeading>{members ? countWord(members.length, 'person', 'people') : 'People'}</IgHeading>
          {members === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size={18} color={theme.muted} /></div>}
          {memberRows.map((m) => {
            const p = personOf(m.user_id);
            if (!p) return null;
            const ownerRow = m.user_id === row.owner_id;
            return (
              <IgRow key={m.user_id} inset={false} icon={<Avatar emoji={p.avatar} name={p.name} size={34} />} label={m.user_id === uid ? `${p.name} (you)` : p.name} sub={ownerRow ? 'Made it' : `${clipsShown.filter((c) => c.user_id === m.user_id).length ? countWord(clipsShown.filter((c) => c.user_id === m.user_id).length, 'clip', 'clips') : 'No clips yet'}`}
                onClick={m.user_id === uid ? undefined : () => onOpenProfile(p)}
                right={isOwner && !ownerRow ? <span role="button" aria-label={`Remove ${p.name}`} onClick={(e) => { e.stopPropagation(); setAsk({ kind: 'person', m, p }); }} style={{ display: 'flex', padding: 8, marginRight: -6, color: theme.muted, cursor: 'pointer' }}><X size={18} /></span> : null} />
            );
          })}
          {isOwner && active && <IgRow inset={false} icon={<UserPlus />} label="Add people" onClick={() => setAdding(true)} />}
          {isOwner && (
            <>
              <IgHeading>Who can see it</IgHeading>
              <ChoiceList label="Who can see it" value={row.audience} onChange={(k) => { if (k !== row.audience) patch({ audience: k }, { audience: row.audience }); }} options={SHARED_AUDIENCES.map(([k, l, s]) => ({ k, label: l, sub: s }))} />
              <IgRow inset={false} label="Keep it as a highlight" sub="It stays on your profile when the 24 hours are up" right={<IgToggle on={!!row.keep} onClick={() => patch({ keep: !row.keep }, { keep: !!row.keep })} />} />
            </>
          )}
          <div style={{ height: 14 }} />
          {isOwner ? <IgRow inset={false} danger icon={<Trash2 />} label="Delete shared story" onClick={() => setAsk({ kind: 'all' })} />
            : isMember ? <IgRow inset={false} danger icon={<LogOut />} label="Leave shared story" onClick={() => setAsk({ kind: 'leave' })} /> : null}
        </>
      )}
      {menuFor && <ActionSheet title="Clip" onClose={() => setMenuFor(null)} zIndex={760} items={[{ k: 'rm', label: menuFor.user_id === uid ? 'Remove my clip' : 'Remove this clip', icon: <Trash2 />, danger: true, on: () => { const c = menuFor; setMenuFor(null); setAsk({ kind: 'clip', c }); } }]} />}
      {ask && ask.kind === 'clip' && <ConfirmSheet title="Remove this clip?" text="It is taken out of the shared story for everyone." confirmLabel="Remove" zIndex={780} onCancel={() => setAsk(null)} onConfirm={() => removeClip(ask.c)} />}
      {ask && ask.kind === 'person' && <ConfirmSheet title={`Remove ${String(ask.p.name || '').split(' ')[0]}?`} text="Their clips are taken out too. They are not told." confirmLabel="Remove" zIndex={780} onCancel={() => setAsk(null)} onConfirm={() => removePerson(ask.m)} />}
      {ask && ask.kind === 'leave' && <ConfirmSheet title="Leave this shared story?" text="Your clips are taken out of it." confirmLabel="Leave" zIndex={780} onCancel={() => setAsk(null)} onConfirm={() => removePerson({ user_id: uid })} />}
      {ask && ask.kind === 'all' && <ConfirmSheet title="Delete this shared story?" text="Every clip in it is removed for everyone." confirmLabel="Delete" zIndex={780} onCancel={() => setAsk(null)} onConfirm={removeAll} />}
      {naming && row && <NameSheet title="Rename shared story" value={row.title} max={40} onClose={() => setNaming(false)} onSave={(t) => { setNaming(false); if (t !== row.title) patch({ title: t }, { title: row.title }); }} />}
      {adding && <PickPeoplePage userId={uid} title="Add people" subtitle="They can add photos and videos to it" max={50} onClose={() => setAdding(false)} onDone={addPeople} zIndex={760} />}
    </FullPage>
  );
}

function storyShareLink(ownerId, storyId) {
  const origin = siteOrigin();
  return `${origin}/?story=${ownerId}&s=${storyId}`;
}

export function StoryShareSheet({ story, owner, conversations, groups, onSend, onClose }) {
  useBackClose(true, onClose);
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
  const action = (glyph, label, onClick) => (
    <div role="button" aria-label={label} onClick={() => { hapticTap(); onClick(); }} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', width: 80, WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><StudioGlyph k={glyph} size={26} /></div>
      <span style={{ fontSize: 11.5, fontWeight: 600, color: theme.ink2, textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</span>
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
                <div key={it.key} role="checkbox" aria-checked={on} aria-label={`Send to ${it.name}`} onClick={() => { hapticTap(); toggle(it); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 2px', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ position: 'relative', borderRadius: '50%', boxShadow: on ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : 'none', transition: 'box-shadow 160ms ease' }}>
                    {it.kind === 'group' ? <GroupAvatar avatar={it.avatar} name={it.name} size={56} /> : <Avatar emoji={it.avatar} name={it.name} size={56} />}
                    {on && <div style={{ position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: '50%', background: theme.coral, border: `2.5px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="white" strokeWidth={3} /></div>}
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
            {action('link', 'Copy link', async () => { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); })}
            {action('share', 'Share to apps', async () => {
              if (navigator.share) { try { await navigator.share({ title: `${owner.name} on ZChat`, text: `See ${owner.name}'s status on ZChat`, url: link }); } catch {} } else { const ok = await copyTextToClipboard(link); say(ok ? 'Link copied' : "Couldn't copy the link"); }
            })}
            {action('chatphone', 'WhatsApp', () => window.open(`https://wa.me/?text=${encodeURIComponent(`See ${owner.name}'s status on ZChat ${link}`)}`, '_blank', 'noopener'))}
            {action('mail', 'Email', () => { window.location.href = `mailto:?subject=${encodeURIComponent(`${owner.name} on ZChat`)}&body=${encodeURIComponent(link)}`; })}
          </div>
        )}
        {flash && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: -48, transform: 'translateX(-50%)', background: theme.ink, color: theme.panelBg, padding: '9px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{flash}</div>}
      </div>
    </div>
  );
}

const QUICK_STORY_REACTIONS = ['\u{1F602}', '\u{1F62E}', '\u{1F60D}', '\u{1F622}', '\u{1F44F}', '\u{1F525}', '\u{1F389}', '\u{1F4AF}'];
export function StoryViewersSheet({ story, myId, onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [rows, setRows] = useState(() => storyViewersMem.get(story.id) || null);
  const [tab, setTab] = useState('views');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: views, error: ve }, { data: likes }, { data: reps }] = await Promise.all([
        supabase.from('story_views').select('*').eq('story_id', story.id),
        supabase.from('story_likes').select('*').eq('story_id', story.id),
        supabase.from('messages').select('sender_id, content, created_at').eq('story_id', story.id).eq('receiver_id', myId).order('created_at', { ascending: false }).limit(300),
      ]);
      if (ve && !views) { if (!cancelled) setRows((prev) => prev || []); return; }
      const replyBy = {};
      (reps || []).forEach((r) => { if (r && r.sender_id && replyBy[r.sender_id] == null && typeof r.content === 'string') replyBy[r.sender_id] = r.content; });
      const ids = [...new Set([...(views || []).map((v) => v.viewer_id), ...(likes || []).map((l) => l.user_id), ...Object.keys(replyBy)])].filter((id) => id !== myId);
      if (!ids.length) { storyViewersMem.set(story.id, []); if (!cancelled) setRows([]); return; }
      const { data: profs } = await fetchProfilesView(ids);
      const likedSet = new Set((likes || []).map((l) => l.user_id));
      const viewedAt = {};
      (views || []).forEach((v) => { viewedAt[v.viewer_id] = v.viewed_at || v.created_at; });
      const list = sanitizeAvatarList(profs, myId).map((p) => ({ profile: p, liked: likedSet.has(p.id), at: viewedAt[p.id], reply: replyBy[p.id] || null }))
        .sort((a, b) => (b.liked - a.liked) || (new Date(b.at || 0) - new Date(a.at || 0)));
      storyViewersMem.set(story.id, list);
      if (storyViewersMem.size > 40) storyViewersMem.delete(storyViewersMem.keys().next().value);
      if (!cancelled) setRows(list);
    })();
    return () => { cancelled = true; };
  }, [story.id]);
  const likedRows = (rows || []).filter((r) => r.liked);
  const replyRows = (rows || []).filter((r) => r.reply);
  const shown = tab === 'likes' ? likedRows : tab === 'replies' ? replyRows : (rows || []);
  const born = story.created_at ? new Date(story.created_at).getTime() : 0;
  const early = born && rows ? rows.filter((r) => r.at && new Date(r.at).getTime() - born < 3600000).length : 0;
  const leftH = born ? Math.max(0, Math.ceil((born + 86400000 - Date.now()) / 3600000)) : 0;
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 9, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', height: '62%', background: theme.panelBg, borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px 0', borderBottom: `1px solid ${theme.border}` }}>
          {[{ k: 'views', icon: <Eye size={16} />, n: rows ? rows.length : null, l: 'Viewers', one: 'viewer' }, { k: 'likes', icon: <Heart size={16} />, n: rows ? likedRows.length : null, l: 'Likes', one: 'like' }, { k: 'replies', icon: <MessageSquare size={16} />, n: rows ? replyRows.length : null, l: 'Replies', one: 'reply' }].map((t) => (
            <div key={t.k} onClick={() => setTab(t.k)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', cursor: 'pointer', fontSize: 13.5, fontWeight: 800, color: tab === t.k ? theme.ink : theme.muted, borderBottom: tab === t.k ? `2.5px solid ${theme.coral}` : '2.5px solid transparent' }}>
              {t.icon}{t.n == null ? t.l : `${t.n} ${t.n === 1 ? t.one : t.l.toLowerCase()}`}
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <X size={20} color={theme.muted} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div data-sheet-scroll style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 14px', touchAction: 'pan-y' }}>
          {rows && rows.length > 0 && tab === 'views' && born > 0 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 6px 4px' }}>
              {[[String(early), 'In the first hour'], [rows.length ? `${Math.round((likedRows.length / rows.length) * 100)}%` : '0%', 'Liked it'], [leftH ? `${leftH} h` : 'Ended', leftH ? 'Left to view' : 'Story time']].map(([v, l]) => (
                <div key={l} style={{ flex: '1 1 0', minWidth: 0, padding: '8px 6px', borderRadius: 12, background: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                  <div style={{ fontSize: 11, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>
                </div>
              ))}
            </div>
          )}
          {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color={theme.ink} /></div>}
          {rows && !shown.length && <div style={{ textAlign: 'center', padding: '18px 24px 26px', fontSize: 13.5, color: theme.muted }}><div style={{ maxWidth: 220, margin: '0 auto 12px' }}><SpotArt k={tab === 'likes' ? 'love' : 'insights'} dark={theme.dark} radius={18} /></div>{tab === 'likes' ? 'No likes yet' : 'No views yet'}</div>}
          {shown.map((r) => (
            <div key={r.profile.id} onClick={() => onOpenProfile(r.profile)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 8px', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <Avatar emoji={r.profile.avatar} name={r.profile.name} size={44} />
                {r.liked && <div style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: '50%', background: theme.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={13} color="#FF3B5C" fill="#FF3B5C" /></div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={r.profile.name} verified={r.profile.verified} custom={r.profile.custom_badge} size={12} /></div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>@{r.profile.username}{r.at ? `, ${timeShort(r.at)}` : ''}</div>
                {r.reply && <div style={{ fontSize: 12.5, color: theme.ink, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Replied: {r.reply}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function DraftsRow({ uid, kind, onOpen }) {
  const { theme } = useTheme();
  const list = useDraftList(uid, kind);
  const [opening, setOpening] = useState(null);
  if (!list || !list.length) return null;
  const open = async (d) => {
    if (opening) return;
    hapticTap();
    if (!d.remote) { onOpen(d); return; }
    setOpening(d.id);
    const full = await openDraftFull(d);
    setOpening(null);
    if (full) onOpen(full); else appSnack('That draft could not load. Check your connection and try again.');
  };
  return (
    <div style={{ padding: '0 0 12px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '0 18px 8px' }}>Drafts</div>
      <div role="list" aria-label="Drafts" style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 16px' }}>
        {list.map((d) => (
          <div key={d.id} role="listitem" aria-label={`Draft from ${draftDateLabel(d.at)}`} onClick={() => open(d)} className="zchat-press" style={{ width: 62, flexShrink: 0, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 84, borderRadius: 12, overflow: 'hidden', position: 'relative', background: theme.soft }}>
              <DraftThumb draft={d} />
              {opening === d.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={16} color="#FFFFFF" /></div>}
            </div>
            <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{draftDateLabel(d.at)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function primeSong(song) {
  if (!song) return;
  try {
    const el = songEl();
    if (songPlayer.cur === song.id && el.getAttribute('src')) return;
    songPlayer.hold = true;
    try { el.pause(); } catch {}
    songPlayer.cur = song.id;
    el.preload = 'auto';
    const st = songWarm.get(song.p);
    if (st && !st.url && st.job && songEta(st) < 1500) { if (el.getAttribute('src')) { el.removeAttribute('src'); try { el.load(); } catch {} } }
    else {
      if (st && !st.url && st.ctrl) { try { st.ctrl.abort(); } catch {} }
      el.src = st && st.url ? st.url : song.p;
      try { el.load(); } catch {}
    }
    if (songPlayer.id) { songPlayer.id = null; songPlayer.wait = false; songPing(); }
  } catch {}
}
function StorySongTag({ song, playing, waiting, style }) {
  return (
    <div data-story-control style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '6px 12px 6px 6px', borderRadius: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', color: '#FFFFFF', maxWidth: 240, boxSizing: 'border-box', ...(style || {}) }}>
      {song.art ? <img src={song.art} alt="" draggable={false} style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} /> : <span style={{ width: 34, height: 34, borderRadius: 9, background: '#1D7BF0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MusicNoteIcon size={16} color="#FFFFFF" /></span>}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>{waiting ? <Spinner size={11} color="#FFFFFF" /> : playing && <SongBars color="#FFFFFF" size={11} />}<span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.t}</span></span>
        <span style={{ display: 'block', fontSize: 11.5, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.a || 'Song'}</span>
      </span>
    </div>
  );
}
function CrMembersBadge() {
  const { theme } = useTheme();
  return (
    <span aria-label="Members only" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px 2px 5px', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, flexShrink: 0, lineHeight: 1.3 }}>
      <CrGlyph k="member" size={11} color="#FFFFFF" sw={2.4} />Members
    </span>
  );
}

const storyResultMem = new Map();
function StoryStickerView({ story, frame, isMine, myId, onBusy, onOpenResponses, owner, onAddYours }) {
  const sticker = validStorySticker(story.sticker);
  const placed = sticker && sticker.k !== 'moment' ? layerPosOf(sticker.pos) : null;
  const [res, setRes] = useState(() => storyResultMem.get(story.id) || null);
  const [mine, setMine] = useState(() => ((storyResultMem.get(story.id) || {}).mine || {}));
  const [answer, setAnswer] = useState('');
  const [typing, setTyping] = useState(false);
  const [drag, setDrag] = useState(null);
  const [sent, setSent] = useState(false);
  const trackRef = useRef(null);
  const load = async () => {
    const { data, error } = await supabase.rpc('zchat_story_results', { p_story: story.id });
    if (error || !data) return;
    storyResultMem.set(story.id, data);
    setRes(data);
    setMine(data.mine || {});
  };
  const [ay, setAy] = useState(null);
  const [remindOn, setRemindOn] = useState(() => readReminders(myId).some((r) => r.storyId === story.id && !r.done));
  useEffect(() => { if (sticker && (sticker.k === 'poll' || sticker.k === 'quiz' || sticker.k === 'slider' || sticker.k === 'question')) load(); }, [story.id]);
  useEffect(() => {
    if (!sticker || sticker.k !== 'addyours') return undefined;
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase.from('stories').select('id, user_id').eq('sticker->>c', sticker.c).gt('expires_at', new Date().toISOString()).limit(60);
        const ids = [...new Set((data || []).map((r) => r.user_id))];
        let people = [];
        if (ids.length) {
          const { data: profs } = await supabase.from('profiles').select('id, name, avatar').in('id', ids.slice(0, 3));
          people = profs || [];
        }
        if (alive) setAy({ n: ids.length, people });
      } catch {}
    })();
    return () => { alive = false; };
  }, [story.id]);
  useEffect(() => { if (onBusy) onBusy(typing || drag != null); }, [typing, drag != null]);
  useEffect(() => () => { if (onBusy) onBusy(false); }, []);
  if (!sticker) return null;
  const respond = async (kind, value, num) => {
    const row = { story_id: story.id, user_id: myId, kind, value: value == null ? null : String(value).slice(0, 300), num: num == null ? null : num };
    const { error } = await supabase.from('story_responses').upsert(row, { onConflict: 'story_id,user_id,kind' });
    if (!error) load();
    return !error;
  };
  const wrap = (child) => {
    if (placed) {
      if (!frame) return null;
      return <div style={{ position: 'absolute', left: frame.x + placed.x * frame.w, top: frame.y + placed.y * frame.h, width: STORY_REF_W, transform: `translate(-50%, -50%) rotate(${sticker.k === 'slider' ? 0 : placed.r}deg) scale(${(placed.s * frame.w) / STORY_REF_W})`, zIndex: 4, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>{child}</div>;
    }
    return <div style={{ position: 'absolute', left: 0, right: 0, top: sticker.k === 'moment' ? 'calc(70px + env(safe-area-inset-top))' : '52%', transform: sticker.k === 'moment' ? 'none' : 'translateY(-50%)', zIndex: 4, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>{child}</div></div>;
  };
  if (sticker.k === 'moment') return wrap(<MomentBadge late={!!sticker.late} />);
  if (sticker.k === 'link') {
    return wrap(<LinkStickerPill sticker={sticker} onOpen={() => {
      try {
        const u = new URL(sticker.u);
        const ours = /(^|\.)getzchat\.com$/i.test(u.hostname) || u.host === window.location.host;
        if (ours && (u.searchParams.get('post') || u.searchParams.get('profile'))) { window.dispatchEvent(new CustomEvent('zchat-open-deep', { detail: u.search })); return; }
      } catch {}
      try { window.open(sticker.u, '_blank', 'noopener,noreferrer'); } catch {}
    }} />);
  }
  if (sticker.k === 'addyours') {
    return wrap(<AddYoursCard sticker={sticker} count={ay ? ay.n : 0} people={ay ? ay.people : []} isMine={isMine} onAdd={onAddYours ? () => onAddYours(sticker) : null} />);
  }
  if (sticker.k === 'count') {
    const future = Date.parse(sticker.t) > Date.now();
    const remind = () => {
      if (remindOn || !future) return;
      const list = readReminders(myId);
      list.push({ id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`, at: Date.parse(sticker.t), msgId: null, storyId: story.id, text: `${sticker.q} starts now`, chat: owner ? { kind: 'dm', id: owner.id, name: owner.name, avatar: owner.avatar || null } : null, done: false });
      writeReminders(myId, list);
      try { window.dispatchEvent(new CustomEvent('zchat-reminders')); } catch {}
      hapticTap();
      setRemindOn(true);
    };
    return wrap(
      <StickerCardFrame title={sticker.q}>
        <CountdownDigits t={sticker.t} />
        <div style={{ fontSize: 12.5, color: '#8A8A95', textAlign: 'center', marginTop: 8 }}>{fmtDate(new Date(sticker.t), { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</div>
        {!isMine && future && (
          <div role="button" aria-label={remindOn ? 'Reminder set' : 'Remind me'} onClick={remind} style={{ marginTop: 10, height: 40, borderRadius: 12, background: remindOn ? '#F2F2F5' : '#111114', color: remindOn ? '#6B6B76' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 800, fontSize: 14, cursor: remindOn ? 'default' : 'pointer' }}>
            {remindOn ? <><Check size={16} />Reminder set</> : <><Bell size={16} />Remind me</>}
          </div>
        )}
      </StickerCardFrame>
    );
  }
  const seeAll = isMine && onOpenResponses ? (
    <div role="button" aria-label="See responses" onClick={onOpenResponses} style={{ marginTop: 10, textAlign: 'center', fontSize: 13.5, fontWeight: 800, color: '#8B5CF6', cursor: 'pointer' }}>See responses</div>
  ) : null;
  if (sticker.k === 'poll') {
    const counts = (res && res.poll) || {};
    const total = sticker.a.reduce((n, _, i) => n + (Number(counts[String(i)]) || 0), 0);
    const voted = mine.poll != null && mine.poll !== '';
    const showPct = voted || isMine;
    return wrap(
      <StickerCardFrame title={sticker.q}>
        {sticker.a.map((o, i) => {
          const n = Number(counts[String(i)]) || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const me = String(mine.poll) === String(i);
          return (
            <div key={i} role="button" aria-label={`Vote ${o}`} onClick={() => { if (isMine) return; hapticTap(); setMine((m) => ({ ...m, poll: String(i) })); respond('poll', i, null); }}
              style={{ position: 'relative', overflow: 'hidden', padding: '11px 14px', borderRadius: 14, background: '#F2F2F5', fontWeight: 700, fontSize: 14.5, marginTop: i ? 8 : 0, cursor: isMine ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: me ? '2px solid #8B5CF6' : '2px solid transparent' }}>
              {showPct && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(139,92,246,0.22)', transition: 'width 0.4s ease' }} />}
              <span style={{ position: 'relative' }}>{o}</span>
              {showPct && <span style={{ position: 'relative', fontSize: 13, color: '#6B6B76' }}>{pct}%</span>}
            </div>
          );
        })}
        {showPct && <div style={{ fontSize: 12, color: '#8A8A95', textAlign: 'center', marginTop: 8 }}>{total} {total === 1 ? 'vote' : 'votes'}</div>}
        {seeAll}
      </StickerCardFrame>
    );
  }
  if (sticker.k === 'quiz') {
    const counts = (res && res.poll) || {};
    const total = sticker.a.reduce((n, _, i) => n + (Number(counts[String(i)]) || 0), 0);
    const picked = mine.poll != null && mine.poll !== '' ? Number(mine.poll) : null;
    const reveal = picked != null || isMine;
    return wrap(
      <StickerCardFrame title={sticker.q}>
        {sticker.a.map((o, i) => {
          const n = Number(counts[String(i)]) || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          const isRight = reveal && i === sticker.c;
          const isWrong = picked === i && i !== sticker.c;
          return (
            <div key={i} role="button" aria-label={`Answer ${o}`} onClick={() => { if (isMine || picked != null) return; hapticTap(); playUiSound(i === sticker.c ? 'like' : 'tap'); setMine((m) => ({ ...m, poll: String(i) })); respond('poll', i, null); }}
              style={{ position: 'relative', overflow: 'hidden', padding: '11px 14px', borderRadius: 14, background: isRight ? '#DCFCE7' : isWrong ? '#FEE2E2' : '#F2F2F5', fontWeight: 700, fontSize: 14.5, marginTop: i ? 8 : 0, cursor: isMine || picked != null ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', background: isRight ? '#22C55E' : isWrong ? '#EF4444' : 'transparent', border: isRight || isWrong ? 'none' : '2px solid #D5D5DD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isRight ? <Check size={13} color="#FFFFFF" strokeWidth={3.2} /> : isWrong ? <X size={13} color="#FFFFFF" strokeWidth={3.2} /> : null}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{o}</span>
              {reveal && <span style={{ fontSize: 13, color: '#6B6B76' }}>{pct}%</span>}
            </div>
          );
        })}
        {picked != null && <div style={{ fontSize: 12.5, fontWeight: 800, textAlign: 'center', marginTop: 8, color: picked === sticker.c ? '#16A34A' : '#DC2626' }}>{picked === sticker.c ? 'You got it right' : 'Not this time'}</div>}
        {isMine && <div style={{ fontSize: 12, color: '#8A8A95', textAlign: 'center', marginTop: 8 }}>{total} {total === 1 ? 'answer' : 'answers'}</div>}
        {seeAll}
      </StickerCardFrame>
    );
  }
  if (sticker.k === 'slider') {
    const avg = res && res.slider ? Number(res.slider.avg) || 0 : 0;
    const n = res && res.slider ? Number(res.slider.n) || 0 : 0;
    const my = mine.slider != null ? Number(mine.slider) : null;
    const pos = drag != null ? drag : (my != null ? my : 0.1);
    const fromEvent = (e) => { const el = trackRef.current; if (!el) return 0; const r = el.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width))); };
    return wrap(
      <StickerCardFrame title={sticker.q}>
        <div ref={trackRef} role="slider" aria-label={sticker.q} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos * 100)}
          onPointerDown={(e) => { if (isMine || my != null) return; e.currentTarget.setPointerCapture(e.pointerId); setDrag(fromEvent(e)); }}
          onPointerMove={(e) => { if (drag != null) setDrag(fromEvent(e)); }}
          onPointerUp={(e) => { if (drag == null) return; const v = fromEvent(e); setDrag(null); setMine((m) => ({ ...m, slider: String(v) })); hapticTap(); respond('slider', null, Math.round(v * 1000) / 1000); }}
          style={{ position: 'relative', height: 40, display: 'flex', alignItems: 'center', touchAction: 'none', cursor: isMine || my != null ? 'default' : 'pointer' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 4, background: '#ECECF1' }} />
          <div style={{ position: 'absolute', left: 0, width: `${pos * 100}%`, height: 8, borderRadius: 4, background: STICKER_GRAD }} />
          {(my != null || isMine) && n > 0 && <div title="Average" style={{ position: 'absolute', left: `calc(${avg * 100}% - 7px)`, width: 14, height: 14, borderRadius: '50%', background: '#111', border: '3px solid #FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />}
          {!isMine && <span style={{ position: 'absolute', left: `calc(${pos * 100}% - 16px)`, fontSize: drag != null ? 36 : 30, transition: drag != null ? 'none' : 'font-size 0.15s ease', lineHeight: 1 }}>{sticker.e}</span>}
        </div>
        {(my != null || isMine) && <div style={{ fontSize: 12, color: '#8A8A95', textAlign: 'center', marginTop: 4 }}>{n ? `Average ${Math.round(avg * 100)}% from ${n} ${n === 1 ? 'person' : 'people'}` : 'No answers yet'}</div>}
        {seeAll}
      </StickerCardFrame>
    );
  }
  const answered = sent || (mine.answer != null && mine.answer !== '');
  return wrap(
    <StickerCardFrame title={sticker.q}>
      {isMine ? (
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#6B6B76', padding: '6px 0' }}>{res ? `${Number(res.answers) || 0} ${Number(res.answers) === 1 ? 'answer' : 'answers'}` : 'Answers show here'}</div>
      ) : answered && !typing ? (
        <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#6B6B76', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Check size={16} color="#22C55E" />Sent. Only they can see it.</div>
      ) : typing ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={answer} onChange={(e) => setAnswer(e.target.value.slice(0, 300))} autoFocus placeholder="Type something" aria-label="Your answer"
            onKeyDown={(e) => { if (e.key === 'Enter' && answer.trim()) { e.preventDefault(); const t = answer.trim(); setTyping(false); setSent(true); setAnswer(''); respond('answer', t, null); } }}
            onBlur={() => { if (!answer.trim()) setTyping(false); }}
            style={{ flex: 1, minWidth: 0, padding: '11px 12px', borderRadius: 12, border: '1px solid #E4E4EA', outline: 'none', fontFamily: FONT, fontSize: 14.5, color: '#111', background: '#FFFFFF' }} />
          <div role="button" aria-label="Send answer" onPointerDown={(e) => e.preventDefault()} onClick={() => { const t = answer.trim(); if (!t) return; setTyping(false); setSent(true); setAnswer(''); respond('answer', t, null); }} style={{ padding: '0 14px', borderRadius: 12, background: answer.trim() ? '#8B5CF6' : '#ECECF1', color: answer.trim() ? '#FFFFFF' : '#8A8A95', display: 'flex', alignItems: 'center', fontWeight: 800, cursor: 'pointer' }}>Send</div>
        </div>
      ) : (
        <div role="button" aria-label="Answer the question" onClick={() => setTyping(true)} style={{ padding: '11px 14px', borderRadius: 14, background: '#F2F2F5', color: '#8A8A95', fontSize: 14.5, textAlign: 'center', cursor: 'text' }}>Type something</div>
      )}
      {seeAll}
    </StickerCardFrame>
  );
}

export function StoryResponsesSheet({ story, onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const sticker = validStorySticker(story.sticker) || {};
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from('story_responses').select('*').eq('story_id', story.id).order('created_at', { ascending: false }).limit(500);
      const list = data || [];
      const ids = [...new Set(list.map((r) => r.user_id))];
      const byId = {};
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified').in('id', ids);
        (profs || []).forEach((p) => { byId[p.id] = p; });
      }
      if (alive) setRows(list.map((r) => ({ ...r, profile: byId[r.user_id] })).filter((r) => r.profile));
    })();
    return () => { alive = false; };
  }, [story.id]);
  const label = (r) => {
    if (r.kind === 'poll') return `Voted ${(sticker.a || [])[Number(r.value)] || ''}`.trim();
    if (r.kind === 'slider') return `Slid to ${Math.round((Number(r.num) || 0) * 100)}%`;
    return r.value || '';
  };
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 12, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxHeight: '70%', display: 'flex', flexDirection: 'column', background: '#15151B', color: '#FFFFFF', borderRadius: '22px 22px 0 0', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', fontFamily: FONT }}>
        <div style={{ padding: '14px 18px 10px', fontSize: 16, fontWeight: 800, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{sticker.q || 'Responses'}</div>
        <div style={{ overflowY: 'auto', padding: '6px 14px' }}>
          {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div>}
          {rows && !rows.length && <div style={{ textAlign: 'center', padding: '18px 24px 26px', fontSize: 14, color: 'rgba(255,255,255,0.65)' }}><div style={{ maxWidth: 220, margin: '0 auto 12px' }}><SpotArt k="comments" dark radius={18} /></div>No responses yet</div>}
          {(rows || []).map((r) => (
            <div key={r.id || `${r.user_id}-${r.kind}`} role="button" onClick={() => onOpenProfile && onOpenProfile(r.profile)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', cursor: 'pointer' }}>
              <Avatar emoji={r.profile.avatar} name={r.profile.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{r.profile.name}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)', marginTop: 2, wordBreak: 'break-word' }}>{label(r)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function MemoriesPage({ onClose, onShare }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true; loadMemories().then((r) => { if (alive) setRows(r); }); return () => { alive = false; }; }, []);
  const groups = groupMemories(rows);
  const today = fmtDate(new Date(), { month: 'long', day: 'numeric' });
  return (
    <FullPage title="Memories" subtitle={`On this day, ${today}`} onBack={onClose} zIndex={72}>
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : !groups.length ? (
        <EmptyState art="moments" title="No memories today" text="Photos and stories you shared on this day in past years show up here. Check back tomorrow." />
      ) : groups.map((g) => (
        <div key={g.y}>
          <IgHeading>{g.y === 1 ? '1 year ago' : `${g.y} years ago`}</IgHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {g.items.map((it) => (
              <div key={`${it.kind}-${it.id}`} role="button" aria-label="Open memory" onClick={() => setView(it)} style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 10, overflow: 'hidden', background: theme.rowBg, cursor: 'pointer' }}>
                {it.media_type === 'video'
                  ? <VideoThumb src={it.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  : <MediaImg src={it.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                <span style={{ position: 'absolute', left: 6, bottom: 6, padding: '2px 7px', borderRadius: 8, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: 10.5, fontWeight: 800 }}>{it.kind === 'story' ? 'Story' : it.kind === 'post' ? 'Post' : 'Chat'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {view && (
        <Portal>
          {view.media_type === 'video' ? <VideoViewer url={view.media_url} onClose={() => setView(null)} /> : <ImageViewer url={view.media_url} caption={view.caption || ''} onClose={() => setView(null)} />}
          {onShare && (
            <div role="button" aria-label="Share memory to your story" onClick={async () => { if (busy) return; setBusy(true); const ok = await onShare(view); setBusy(false); if (ok) setView(null); }} className="zchat-press"
              style={{ position: 'fixed', left: '50%', bottom: 'calc(26px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 1300, height: 46, padding: '0 20px', borderRadius: 23, background: '#FFFFFF', color: '#111', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
              {busy ? <Spinner size={16} color="#111" /> : <StatusIcon size={17} color="#111" />}Share to story
            </div>
          )}
        </Portal>
      )}
    </FullPage>
  );
}
function PlaceTagLine({ place, onOpen, style }) {
  const pl = validPlace(place);
  if (!pl) return null;
  return (
    <div role="button" aria-label={`Open place ${pl.n}`} onClick={(e) => { e.stopPropagation(); hapticTap(); onOpen(pl); }} onPointerDown={(e) => e.stopPropagation()}
      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', minWidth: 0, ...(style || {}) }}>
      <MapPinIcon size={11} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pl.n}</span>
    </div>
  );
}
