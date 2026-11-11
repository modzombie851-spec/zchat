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
  AV_BG,
  AV_EXTRA,
  AV_EYES,
  AV_FACE,
  AV_GLASSES,
  AV_HAIR,
  AV_HAIRC,
  AV_MOUTH,
  AV_SHIRT,
  AV_SKIN,
  ActionSheet,
  AlbumIcon,
  AlbumPickSheet,
  Avatar,
  BigButton,
  ChoiceList,
  ConfirmDialog,
  ConfirmSheet,
  DRAFT_MAX,
  DiceLineIcon,
  EmptyState,
  FONT,
  FilterStrip,
  FilterFx,
  FullPage,
  GLASS_OK,
  GroupAvatar,
  HiddenPhotoIcon,
  IgHeading,
  IgRow,
  IgToggle,
  KitGlyph,
  LoadFail,
  MAX_CHARS,
  MapPinIcon,
  MemeIcon,
  MusicNoteIcon,
  MusicPicker,
  OnceIcon,
  PAINT_DATA_KEY,
  PHOTO_FILTERS,
  PageArt,
  PaintToolIcon,
  PeoplePickerPage,
  PickPeoplePage,
  PickTiles,
  PlacePicker,
  Portal,
  PsAltSheet,
  PsCaptionsSheet,
  PsCcGlyph,
  PsPollSheet,
  PsRemixGlyph,
  PsTagGlyph,
  PsTagPicker,
  RestyleSheet,
  SOCIAL_MAX,
  SOCIAL_PLATFORMS,
  SONG_LOOKS,
  ScanDocIcon,
  SchedulePostSheet,
  SegmentedControl,
  SharedStoryIcon,
  SocialIcon,
  Spinner,
  StatusIcon,
  StoryListsPage,
  StoryMentionPicker,
  StudioGlyph,
  VideoThumb,
  ViewerButton,
  announceDrafts,
  appSnack,
  applyPhotoFilter,
  avatarCfgOf,
  avatarSvgUrl,
  backStack,
  boothClock,
  boothClockSample,
  boothLocal,
  boothNote,
  cachedMediaLookup,
  chatClearedAt,
  cleanWhatsappNumber,
  countWord,
  cxPack,
  dataSaverOn,
  describeMessage,
  detectSocialPlatform,
  draftMissing,
  draftSync,
  ensureTextFonts,
  featureCardSummary,
  fmtDate,
  fmtHM,
  fmtSchedule,
  formatBytes,
  formatCount,
  friendlyError,
  hapticTap,
  histChatQuery,
  histCur,
  histKeepRows,
  igPalette,
  inputStyle,
  isGifUrl,
  isRoundVideo,
  isTouchDevice,
  kitOnInk,
  layerPosOf,
  listDraftsAll,
  loadFailCode,
  loadImageElement,
  madeGifUrl,
  mediaDbOp,
  messageTextFor,
  navSync,
  normalizeSocialUrl,
  orderStickersForPick,
  paintReadProjectBytes,
  paintZip,
  parseBlur,
  parseFeatureCard,
  parseLocationMessage,
  parseOnce,
  parsePostLink,
  parseWrapped,
  photoFilterCss,
  plainPreviewText,
  playSong,
  playUiSound,
  postSensCol,
  postThumbOf,
  prefetchMusic,
  prepareImageFile,
  psCols,
  psX,
  quoteTextFor,
  readSocialLinks,
  reducedMotion,
  resolveMedia,
  rpcMissing,
  rtDrop,
  rtKeep,
  rtName,
  rtReady,
  safeUploadFile,
  safeUploadType,
  silentDownload,
  socialLinkLabel,
  songEl,
  songPlayer,
  specialPreview,
  stopSong,
  toggleSong,
  uploadMedia,
  useBackClose,
  useSheetDrag,
  useSongPlaying,
  useTheme,
  validPlace,
  EfGroup,
  LinkThumb,
  validSong,
} from '../App.jsx';
import {
  ANIM_PX,
  AddYoursCard,
  CloseFriendsIcon,
  CloseFriendsPicker,
  CloseShareButton,
  CountdownDigits,
  KitSection,
  KitSlider,
  KitTabs,
  LinkStickerPill,
  MEME_FONT,
  MomentBadge,
  PaintSheet,
  PdfGlyph,
  STORY_REF_W,
  StickerCardFrame,
  StoryListIcon,
  StoryMusicSticker,
  StudioDark,
  StudioTool,
  TagSuggestBar,
  aipPack,
  animBlobOf,
  animCanvas,
  animDuration,
  animRecord,
  animSeek,
  applyTagPick,
  draftExt,
  hexLum,
  hexRgb,
  loadStoryLists,
  useCloseFriendCount,
  useStoryLists,
  validStorySticker,
} from './shared.jsx';

function StoryListMembersPage({ uid, list, onClose, zIndex = 760 }) {
  return (
    <PeoplePickerPage title={list.name} zIndex={zIndex} myId={uid} onClose={() => { loadStoryLists(uid); onClose(); }} table="zchat_story_list_members" ownerCol="owner_id" otherCol="member_id" scope={{ list_id: list.id }}
      subtitle="Only people on this list see stories you share to it. Nobody is told when you add or remove them." />
  );
}
function StoryAudienceSheet({ uid, value, closeCount, onPick, onEditClose, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const lists = useStoryLists(uid);
  const [listsOpen, setListsOpen] = useState(false);
  const [editList, setEditList] = useState(null);
  const options = [
    { k: 'all', label: 'Your story', sub: 'Your followers, for 24 hours', icon: <StatusIcon size={21} /> },
    closeCount !== -1 ? { k: 'close', label: 'Close friends', sub: closeCount ? countWord(closeCount, 'person', 'people') : 'Pick who is on it', icon: <CloseFriendsIcon size={21} /> } : null,
    ...(lists || []).map((l) => ({ k: `list:${l.id}`, label: l.name, sub: l.n ? countWord(l.n, 'person', 'people') : 'Add people first', icon: <StoryListIcon size={21} /> })),
  ].filter(Boolean);
  const pick = (k) => {
    if (k === 'close' && !closeCount) { onEditClose(); return; }
    const l = (lists || []).find((x) => `list:${x.id}` === k);
    if (l && !l.n) { setEditList(l); return; }
    onPick(k, l || null);
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, maxHeight: 'min(86vh, calc(100% - 24px))', overflowY: 'auto', background: theme.panelBg, borderRadius: '20px 20px 0 0', padding: '0 14px calc(12px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ fontSize: 15, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '4px 16px 8px' }}>Who sees this story</div>
          <ChoiceList label="Who sees this story" options={options} value={value || 'all'} onChange={pick} />
          {lists && <IgRow inset={false} icon={<StoryListIcon />} label={lists.length ? 'Edit lists' : 'Make a list'} sub={lists.length ? null : 'Like Family, Team or School'} onClick={() => setListsOpen(true)} />}
        </div>
      </div>
      {listsOpen && <StoryListsPage uid={uid} zIndex={760} onClose={() => setListsOpen(false)} onOpenList={setEditList} />}
      {editList && <StoryListMembersPage uid={uid} list={editList} zIndex={800} onClose={() => setEditList(null)} />}
    </Portal>
  );
}
function StoryShareHint({ closeCount, aud, listsOn, onEditClose, onAudience }) {
  const base = !aud ? 'Shared with your followers for 24 hours' : aud.k === 'close' ? 'Only your close friends see it, for 24 hours' : `Only ${aud.name} sees it, for 24 hours`;
  const link = listsOn || aud ? <span role="button" aria-label="Choose who sees this story" onClick={onAudience} style={{ color: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}>{aud ? 'Change' : 'Lists'}</span> : null;
  if (aud || closeCount === -1 || closeCount === null) return <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', padding: '6px 18px 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><span>{base}</span>{link}</div>;
  return <CloseShareHint count={closeCount} base={base} onEdit={onEditClose} extra={link} />;
}

function CloseShareHint({ count, onEdit, base, extra = null }) {
  return (
    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', padding: '6px 18px 0', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span>{base}</span>
      {count > 0 && <span role="button" aria-label="Edit close friends" onClick={onEdit} style={{ color: '#7CF0A6', fontWeight: 800, cursor: 'pointer' }}>Close friends {count}</span>}
      {count === 0 && <span role="button" aria-label="Edit close friends" onClick={onEdit} style={{ color: '#7CF0A6', fontWeight: 800, cursor: 'pointer' }}>Pick close friends</span>}
      {extra}
    </div>
  );
}

function pdfPack() { return cxPack('/pdf-pack.js', 'ZPDF'); }
const PDF_MAX_MESSAGES = 10000;
function pdfPlain(t) {
  return String(t || '').replace(/\|\|([^|\n]+?)\|\|/g, '$1').replace(/```[a-zA-Z0-9]*\n?([\s\S]*?)```/g, '$1').replace(/`([^`\n]*)`/g, '$1').replace(/\*\*([^*\n]+)\*\*/g, '$1').replace(/__([^_\n]+)__/g, '$1').replace(/~~([^~\n]+)~~/g, '$1').replace(/(^|[\s(])([*_~])(\S(?:[^\n]*?\S)?)\2(?=[\s).,!?:;]|$)/gm, '$1$3');
}
function pdfDayIso(d) { const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; }
function fmtClipSecs(s) { const v = Math.max(0, Math.round(s || 0)); return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; }
function voiceSecondsOf(raw) {
  return new Promise((resolve) => {
    let done = false;
    let a = null;
    const fin = (v) => { if (done) return; done = true; clearTimeout(t); try { if (a) { a.removeAttribute('src'); a.load(); } } catch {} resolve(Number.isFinite(v) && v > 0 ? v : null); };
    const t = setTimeout(() => fin(null), 2500);
    resolveMedia(raw).then((u) => {
      if (!u || done) { fin(null); return; }
      a = document.createElement('audio');
      a.preload = 'metadata';
      a.muted = true;
      a.onloadedmetadata = () => {
        if (Number.isFinite(a.duration) && a.duration > 0) { fin(a.duration); return; }
        a.ondurationchange = () => { if (Number.isFinite(a.duration) && a.duration > 0) fin(a.duration); };
        try { a.currentTime = 1e7; } catch { fin(null); }
      };
      a.onerror = () => fin(null);
      a.src = u;
    }, () => fin(null));
  });
}
async function pdfLoadImage(src) {
  let own = null;
  try {
    let u = typeof src === 'string' && src.startsWith('/') ? src : await cachedMediaLookup(src);
    if (!u) {
      const link = await resolveMedia(src);
      if (!link) return null;
      const res = await fetch(link);
      if (!res.ok) return null;
      own = URL.createObjectURL(await res.blob());
      u = own;
    }
    const im = await loadImageElement(u);
    return { el: im, w: im.naturalWidth, h: im.naturalHeight, close: own ? () => { try { URL.revokeObjectURL(own); } catch {} } : null };
  } catch {
    if (own) { try { URL.revokeObjectURL(own); } catch {} }
    return null;
  }
}
function pdfItemsFor(rows, { myId, isGroup, nameOf, photos }) {
  const byId = new Map(rows.map((m) => [String(m.id), m]));
  const items = [];
  const voices = [];
  let lastDay = '';
  const dayOpts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  rows.forEach((m) => {
    const d = new Date(m.created_at);
    const dk = d.toDateString();
    if (dk !== lastDay) { lastDay = dk; items.push({ k: 'day', t: fmtDate(d, dayOpts) }); }
    const time = fmtHM(d);
    if (m.type === 'system') { const ds = describeMessage(m); if (ds && ds.text) items.push({ k: 'sys', t: ds.text, time }); return; }
    const mine = m.sender_id === myId;
    const it = { k: 'm', me: mine, who: isGroup && !mine ? (m.bot_reply ? 'ZChat Bot' : nameOf(m.sender_id)) : null, time, text: '', edited: !!m.edited, fwd: !!m.forwarded };
    if (m.reply_to_id != null) {
      const rm = byId.get(String(m.reply_to_id));
      if (rm && !rm.deleted) it.quote = { who: rm.sender_id === myId ? 'You' : nameOf(rm.sender_id), t: parseOnce(rm) || parseBlur(rm) ? quoteTextFor(rm) : plainPreviewText(quoteTextFor(rm)).slice(0, 180) };
    }
    if (m.story_id && !it.quote) it.quote = { who: null, t: 'Replied to a story' };
    const once = parseOnce(m);
    const blur = parseBlur(m);
    const gif = m.type === 'image' && (isGifUrl(m.media_url) || madeGifUrl(m.media_url));
    if (once) it.att = { k: 'line', icon: 'once', t: m.type === 'video' ? 'View once video' : m.type === 'audio' ? 'Voice message, plays once' : 'View once photo' };
    else if (blur) it.att = { k: 'line', icon: 'once', t: m.type === 'video' ? 'Hidden video' : 'Hidden photo' };
    else if (m.type === 'image') { it.att = photos && m.media_url ? { k: 'photo', src: m.media_url, gif, miss: gif ? 'GIF' : 'Photo' } : { k: 'line', icon: 'card', t: gif ? 'GIF' : 'Photo' }; it.text = pdfPlain(m.content || ''); }
    else if (m.type === 'video') { it.att = { k: 'line', icon: 'video', t: isRoundVideo(m) ? 'Video message' : 'Video' }; if (!isRoundVideo(m)) it.text = pdfPlain(m.content || ''); }
    else if (m.type === 'audio' || m.type === 'voice') { it.att = { k: 'line', icon: 'voice', t: 'Voice message' }; if (m.media_url) voices.push([it, m.media_url]); }
    else if (m.type === 'sticker') {
      const c = String(m.content || '');
      if (photos && (/^https?:/i.test(c) || c.startsWith('/'))) it.att = { k: 'sticker', src: c };
      else if (/^https?:|^\//i.test(c)) it.att = { k: 'line', icon: 'card', t: 'Sticker' };
      else it.text = c || 'Sticker';
    } else {
      const w = parseWrapped(m.content);
      const fc = parseFeatureCard(m.content);
      const sp = specialPreview(m.content);
      if (w && w.k === 'sec') it.att = { k: 'line', icon: 'once', t: 'Secret message' };
      else if (fc && fc.k === 'file') it.att = { k: 'line', icon: 'file', t: `${fc.d.n || 'File'}${fc.d.s ? `, ${formatBytes(fc.d.s)}` : ''}` };
      else if (w) it.text = pdfPlain(w.text || '');
      else if (sp || fc) it.att = { k: 'line', icon: parseLocationMessage(m.content) ? 'location' : 'card', t: sp || featureCardSummary(fc) || 'Card' };
      else if (parsePostLink(m.content)) it.att = { k: 'line', icon: 'card', t: 'Shared a post' };
      else if (typeof m.content === 'string' && /^z[a-z]{2,12}:[{[]/.test(m.content)) { const ds = describeMessage(m); it.att = { k: 'line', icon: 'card', t: (ds && ds.text && !/^z[a-z]{2,12}:/.test(ds.text) ? ds.text : 'Shared a card').slice(0, 160) }; }
      else it.text = pdfPlain(messageTextFor(m));
    }
    if (!it.text && !it.att) return;
    items.push(it);
  });
  return { items, voices };
}
export function PdfExportPage({ chat, title, myId, myName, nameOf, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [range, setRange] = useState('all');
  const [from, setFrom] = useState(() => pdfDayIso(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => pdfDayIso(new Date()));
  const [photos, setPhotos] = useState(true);
  const [state, setState] = useState('idle');
  const [prog, setProg] = useState({ phase: '', n: 0, p: 0, a: 0, b: 0 });
  const [done, setDone] = useState(null);
  const [err, setErr] = useState('');
  const signalRef = useRef(null);
  useEffect(() => () => { if (signalRef.current) signalRef.current.stopped = true; }, []);
  useEffect(() => { pdfPack(); }, []);
  const cancel = () => { if (signalRef.current) signalRef.current.stopped = true; setState('idle'); };
  useBackClose(state === 'working', cancel);
  const start = async () => {
    const signal = { stopped: false };
    signalRef.current = signal;
    setErr(''); setDone(null);
    const fromMs = range === 'range' ? new Date(`${from}T00:00:00`).getTime() : null;
    const toMs = range === 'range' ? new Date(`${to}T23:59:59.999`).getTime() : null;
    if (range === 'range' && (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || fromMs > toMs)) { setErr('Pick a start date that comes before the end date.'); return; }
    setState('working');
    setProg({ phase: 'read', n: 0, p: 0, a: 0, b: 0 });
    try {
      const packJob = pdfPack();
      const hidden = new Set();
      try { JSON.parse(localStorage.getItem(`zchat-hidden-msgs-${myId}`) || '[]').forEach((k) => hidden.add(String(k))); } catch {}
      try { const { data } = await supabase.from('hidden_messages').select('message_id').eq('user_id', myId).limit(10000); (data || []).forEach((r) => hidden.add(String(r.message_id))); } catch {}
      const cut = chatClearedAt(hidden, chat.kind, chat.id);
      let rows = [];
      let cur = null;
      let more = false;
      while (!signal.stopped && rows.length < PDF_MAX_MESSAGES) {
        let q = histChatQuery(chat, myId, cur, 'older', false);
        if (fromMs != null) q = q.gte('created_at', new Date(fromMs).toISOString());
        if (toMs != null) q = q.lte('created_at', new Date(toMs).toISOString());
        const { data, error } = await q.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(1000);
        if (error) throw error;
        const list = data || [];
        rows = rows.concat(list);
        setProg((p) => ({ ...p, n: rows.length }));
        if (list.length < 1000) break;
        cur = histCur(list[list.length - 1]);
        if (rows.length >= PDF_MAX_MESSAGES) more = true;
      }
      if (signal.stopped) return;
      const keep = histKeepRows(rows, hidden, cut).filter((m) => m && !m.deleted && !String(m.id).startsWith('temp-')).slice(0, PDF_MAX_MESSAGES)
        .sort((a, b) => (Date.parse(a.created_at) || 0) - (Date.parse(b.created_at) || 0) || (Number(a.id) || 0) - (Number(b.id) || 0));
      if (!keep.length) { setState('idle'); setErr(range === 'range' ? 'There are no messages between those dates.' : 'There are no messages to export yet.'); return; }
      const { items, voices } = pdfItemsFor(keep, { myId, isGroup: !!chat.g, nameOf, photos });
      let voiceJob = Promise.resolve();
      if (voices.length && voices.length <= 300) {
        setProg((p) => ({ ...p, phase: 'voice', a: 0, b: voices.length }));
        let at = 0;
        let fin = 0;
        const stopAt = Date.now() + 5000;
        const worker = async () => {
          while (at < voices.length && !signal.stopped && Date.now() < stopAt) {
            const [it, u] = voices[at++];
            const sec = await voiceSecondsOf(u);
            if (sec) it.att.t = `Voice message, ${fmtClipSecs(sec)}`;
            fin += 1;
            setProg((p) => ({ ...p, a: fin }));
          }
        };
        voiceJob = Promise.race([Promise.all([worker(), worker(), worker(), worker()]), new Promise((r) => setTimeout(r, 5200))]);
      }
      const [ok] = await Promise.all([packJob, voiceJob]);
      if (signal.stopped) return;
      if (!ok || !window.ZPDF) throw new Error('pack');
      const first = new Date(keep[0].created_at);
      const last = new Date(keep[keep.length - 1].created_at);
      const dOpts = { day: 'numeric', month: 'long', year: 'numeric' };
      const span = pdfDayIso(first) === pdfDayIso(last) ? `Messages from ${fmtDate(first, dOpts)}` : `Messages from ${fmtDate(first, dOpts)} to ${fmtDate(last, dOpts)}`;
      const lines = [chat.g ? 'Group chat on ZChat' : `Chat between ${myName || 'you'} and ${title}`, span, `${countWord(keep.length, 'message', 'messages')}, exported on ${fmtDate(new Date(), dOpts)}${more ? `. Only the newest ${formatCount(PDF_MAX_MESSAGES)} are in this file` : ''}`];
      setProg((p) => ({ ...p, phase: 'build', p: 0 }));
      const res = await window.ZPDF.chatPdf({
        title, footer: chat.g ? title : `Chat with ${title}`, lines, items, signal, loadImage: pdfLoadImage,
        onProgress: (p, a, b) => setProg((x) => ({ ...x, phase: 'build', p, a, b })),
        onWrite: (p) => setProg((x) => ({ ...x, phase: 'write', p })),
      });
      if (signal.stopped) return;
      const base = `ZChat ${title}`.replace(/[\\/:*?"<>|#%]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 70) || 'ZChat chat';
      const file = new File([res.blob], `${base}.pdf`, { type: 'application/pdf' });
      setDone({ file, pages: res.pages, count: keep.length });
      setState('done');
      playUiSound('repost');
    } catch {
      if (signal.stopped) return;
      setState('idle');
      setErr(navigator.onLine === false ? 'No connection. Try again when you are back online.' : 'The PDF could not be made. Try again.');
    }
  };
  const save = () => {
    if (!done) return;
    const href = URL.createObjectURL(done.file);
    const a = document.createElement('a');
    a.href = href;
    a.download = done.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 8000);
    appSnack('PDF saved');
  };
  const share = async () => {
    if (!done) return;
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [done.file] })) { await navigator.share({ files: [done.file], title: done.file.name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    save();
  };
  const canShare = (() => { try { return !!(done && navigator.share && navigator.canShare && navigator.canShare({ files: [done.file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')); } catch { return false; } })();
  const phaseText = prog.phase === 'read' ? `Reading messages${prog.n ? ` ${formatCount(prog.n)}` : ''}` : prog.phase === 'voice' ? `Timing voice messages ${prog.a} of ${prog.b}` : prog.phase === 'build' ? (prog.b ? `Adding photos ${prog.a} of ${prog.b}` : 'Laying out the pages') : prog.phase === 'write' ? 'Finishing your PDF' : 'Starting';
  const pct = prog.phase === 'build' ? Math.round(prog.p * 92) : prog.phase === 'write' ? 92 + Math.round(prog.p * 8) : prog.phase === 'voice' && prog.b ? Math.round((prog.a / prog.b) * 100) : null;
  const dateInput = (label, value, set) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 4px', cursor: 'pointer' }}>
      <span style={{ flex: 1, fontSize: 15, color: theme.ink }}>{label}</span>
      <input type="date" value={value} max={pdfDayIso(new Date())} onChange={(e) => set(e.target.value)} aria-label={label}
        style={{ border: 'none', outline: 'none', background: theme.rowBg, color: theme.ink, borderRadius: 10, padding: '8px 10px', fontFamily: FONT, fontSize: 15, colorScheme: theme.dark ? 'dark' : 'light' }} />
    </label>
  );
  return (
    <FullPage title="Export as PDF" subtitle={title} onBack={onClose} zIndex={66}
      footer={state === 'done'
        ? (canShare ? <BigButton label="Share PDF" onClick={share} /> : <BigButton label="Save PDF" onClick={save} />)
        : state === 'working' ? <BigButton label="Cancel" tone="plain" onClick={cancel} /> : <BigButton label="Make PDF" onClick={start} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '8px 4px 4px', textWrap: 'pretty' }}>A tidy document of this chat with names, times, photos and page numbers. Deleted, hidden and view once messages are left out.</div>
      {state === 'working' && (
        <div style={{ padding: '18px 4px 6px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{phaseText}</div>
          <div style={{ height: 6, borderRadius: 3, background: theme.rowBg, overflow: 'hidden', marginTop: 10 }}>
            <div className={pct === null ? 'zmap-shimmer' : undefined} style={{ height: '100%', width: pct === null ? '100%' : `${pct}%`, background: pct === null ? undefined : theme.coral, transition: 'width 200ms' }} />
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 8 }}>You can keep using ZChat while it works.</div>
        </div>
      )}
      {state === 'done' && done && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 4px 6px' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: theme.rowBg, color: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PdfGlyph size={24} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{done.file.name}</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{countWord(done.pages, 'page', 'pages')}, {countWord(done.count, 'message', 'messages')}, {formatBytes(done.file.size)}</div>
          </div>
          {canShare && <div role="button" aria-label="Save PDF to this phone" onClick={save} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer' }}><Download size={20} /></div>}
        </div>
      )}
      {state !== 'working' && (
        <>
          <IgHeading>Messages</IgHeading>
          <div style={{ padding: '2px 4px 6px' }}>
            <SegmentedControl value={range} onChange={(v) => { hapticTap(); setRange(v); setDone(null); setState('idle'); }} options={[['all', 'Whole chat'], ['range', 'Pick dates']]} />
          </div>
          {range === 'range' && (
            <>
              {dateInput('From', from, (v) => { setFrom(v); setDone(null); setState('idle'); })}
              {dateInput('To', to, (v) => { setTo(v); setDone(null); setState('idle'); })}
            </>
          )}
          <div role="button" aria-label={`Photos and stickers ${photos ? 'on' : 'off'}`} onClick={() => { hapticTap(); setPhotos((v) => !v); setDone(null); setState('idle'); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Photos and stickers</div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>Turn off for a smaller file</div>
            </div>
            <IgToggle on={photos} />
          </div>
        </>
      )}
      {err && <div role="alert" style={{ padding: '10px 4px', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
    </FullPage>
  );
}

function animPack() { return cxPack('/anim-pack.js', 'ZANIM'); }
const STICKER_SHAPES = [['square', 'Square'], ['circle', 'Circle'], ['heart', 'Heart'], ['star', 'Star']];
const MOVING_STICKER_MAX = 560 * 1024;
function stickerShapeD(k, S, inset) {
  const a = inset;
  const w = S - inset * 2;
  const f = (n) => Math.round(n * 100) / 100;
  if (k === 'circle') { const r = w / 2; const c = S / 2; return `M${f(c - r)} ${f(c)}A${f(r)} ${f(r)} 0 1 0 ${f(c + r)} ${f(c)}A${f(r)} ${f(r)} 0 1 0 ${f(c - r)} ${f(c)}Z`; }
  if (k === 'heart') {
    const P = (x, y) => `${f(a + x * w)} ${f(a + y * w)}`;
    return `M${P(0.5, 0.94)}C${P(0.17, 0.73)} ${P(0, 0.53)} ${P(0.03, 0.32)}C${P(0.07, 0.1)} ${P(0.36, 0.02)} ${P(0.5, 0.21)}C${P(0.64, 0.02)} ${P(0.93, 0.1)} ${P(0.97, 0.32)}C${P(1, 0.53)} ${P(0.83, 0.73)} ${P(0.5, 0.94)}Z`;
  }
  if (k === 'star') {
    const c = S / 2;
    const R = w / 2;
    const cy = c + R * 0.09;
    let d = '';
    for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? R * 0.52 : R; d += `${i ? 'L' : 'M'}${f(c + r * Math.cos(t))} ${f(cy + r * Math.sin(t))}`; }
    return `${d}Z`;
  }
  const r = w * 0.23;
  return `M${f(a + r)} ${f(a)}H${f(a + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(a + w)} ${f(a + r)}V${f(a + w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(a + w - r)} ${f(a + w)}H${f(a + r)}A${f(r)} ${f(r)} 0 0 1 ${f(a)} ${f(a + w - r)}V${f(a + r)}A${f(r)} ${f(r)} 0 0 1 ${f(a + r)} ${f(a)}Z`;
}
function stickerEdge(S, soft) { return { B: Math.round(S * 0.034), M: Math.round(S * (soft ? 0.03 : 0.012)) }; }
function stickerOutline(S, shape, soft) {
  const { B, M } = stickerEdge(S, soft);
  const p = new Path2D(stickerShapeD(shape, S, M + B));
  const c = animCanvas(S);
  const x = c.getContext('2d');
  if (soft) { x.shadowColor = 'rgba(0, 0, 0, 0.26)'; x.shadowBlur = S * 0.02; x.shadowOffsetY = S * 0.006; }
  x.fillStyle = '#FFFFFF';
  x.strokeStyle = '#FFFFFF';
  x.lineWidth = B * 2;
  x.lineJoin = 'round';
  x.stroke(p);
  x.fill(p);
  return { c, p };
}
function paintStickerFrame(ctx, S, shape, src, crop, soft, cached) {
  const o = cached || stickerOutline(S, shape, soft);
  ctx.clearRect(0, 0, S, S);
  ctx.drawImage(o.c, 0, 0);
  ctx.save();
  ctx.clip(o.p);
  ctx.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sw, 0, 0, S, S);
  ctx.restore();
}
function useClipLoop(vidRef, trimRef, holdRef, on) {
  useEffect(() => {
    if (!on) return undefined;
    let raf = 0;
    const loop = () => {
      const v = vidRef.current;
      if (v && !holdRef.current) {
        const { start: s, len: l } = trimRef.current;
        if (v.currentTime >= s + l - 0.02 || v.currentTime < s - 0.3) { try { v.currentTime = s; } catch {} }
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}
function ClipTrim({ src, dur, start, len, maxLen, onChange, onSeek, onDone, hint }) {
  const { theme } = useTheme();
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const [thumbs, setThumbs] = useState([]);
  const cap = Math.min(maxLen, dur || maxLen);
  const minLen = Math.min(0.5, cap);
  useEffect(() => {
    if (!src || !dur) return undefined;
    let alive = true;
    const tv = document.createElement('video');
    tv.muted = true;
    tv.playsInline = true;
    tv.preload = 'auto';
    tv.src = src;
    (async () => {
      await new Promise((r) => { if (tv.readyState >= 1) r(); else { tv.onloadedmetadata = () => r(); setTimeout(r, 3000); } });
      const c = animCanvas(72);
      const x = c.getContext('2d');
      const list = [];
      for (let i = 0; i < 8 && alive; i++) {
        await animSeek(tv, Math.min(dur - 0.05, ((i + 0.5) * dur) / 8));
        if (!alive || !tv.videoWidth) break;
        const s = Math.min(tv.videoWidth, tv.videoHeight);
        try { x.drawImage(tv, (tv.videoWidth - s) / 2, (tv.videoHeight - s) / 2, s, s, 0, 0, 72, 72); list.push(c.toDataURL('image/jpeg', 0.6)); } catch { break; }
        if (alive) setThumbs(list.slice());
      }
    })();
    return () => { alive = false; try { tv.removeAttribute('src'); tv.load(); } catch {} };
  }, [src, dur]);
  const down = (e) => {
    if (!dur || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const x0 = (start / dur) * r.width;
    const x1 = ((start + len) / dur) * r.width;
    let mode = 'move';
    let s0 = start;
    if (Math.abs(x - x0) <= 16 && x <= (x0 + x1) / 2) mode = 'l';
    else if (Math.abs(x - x1) <= 16) mode = 'r';
    else if (x < x0 || x > x1) { s0 = Math.max(0, Math.min(dur - len, (x / r.width) * dur - len / 2)); onChange(s0, len); }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, x, w: r.width, s0, e0: s0 + len };
    onSeek(mode === 'r' ? s0 + len : s0);
  };
  const move = (e) => {
    const d = dragRef.current;
    if (!d || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const ds = ((e.clientX - r.left - d.x) / d.w) * dur;
    if (d.mode === 'move') { const s = Math.max(0, Math.min(dur - (d.e0 - d.s0), d.s0 + ds)); onChange(s, d.e0 - d.s0); onSeek(s); }
    else if (d.mode === 'l') { const s = Math.max(Math.max(0, d.e0 - cap), Math.min(d.e0 - minLen, d.s0 + ds)); onChange(s, d.e0 - s); onSeek(s); }
    else { const en = Math.max(d.s0 + minLen, Math.min(Math.min(dur, d.s0 + cap), d.e0 + ds)); onChange(d.s0, en - d.s0); onSeek(en); }
  };
  const up = () => { if (!dragRef.current) return; dragRef.current = null; onDone(); };
  const key = (e) => {
    const k = e.key;
    const by = k === 'ArrowRight' || k === 'ArrowUp' ? 0.1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -0.1 : 0;
    if (!by || !dur) return;
    e.preventDefault();
    onChange(Math.max(0, Math.min(dur - len, Math.round((start + by) * 10) / 10)), len);
  };
  const x0p = dur ? (start / dur) * 100 : 0;
  const wp = dur ? (len / dur) * 100 : 100;
  return (
    <div>
      <div ref={trackRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ position: 'relative', height: 52, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', touchAction: 'none', cursor: 'pointer' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {thumbs.map((u, i) => <img key={i} src={u} alt="" draggable={false} style={{ flex: '1 1 0', minWidth: 0, height: '100%', objectFit: 'cover', display: 'block' }} />)}
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${x0p}%`, background: 'rgba(0,0,0,0.6)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p + wp}%`, right: 0, background: 'rgba(0,0,0,0.6)' }} />
        <div role="slider" tabIndex={0} aria-label="Start of your clip" aria-valuemin={0} aria-valuemax={Math.max(0, Math.round((dur - len) * 10) / 10)} aria-valuenow={Math.round(start * 10) / 10} aria-valuetext={`${start.toFixed(1)} seconds in`} onKeyDown={key}
          style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p}%`, width: `${wp}%`, border: `3px solid ${theme.gold}`, borderLeftWidth: 12, borderRightWidth: 12, borderRadius: 12, boxSizing: 'border-box', outline: 'none' }}>
          <span style={{ position: 'absolute', left: -8, top: '50%', width: 4, height: 18, marginTop: -9, borderRadius: 2, background: 'rgba(0,0,0,0.55)' }} />
          <span style={{ position: 'absolute', right: -8, top: '50%', width: 4, height: 18, marginTop: -9, borderRadius: 2, background: 'rgba(0,0,0,0.55)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>
        <span>{hint}</span>
        <span style={{ color: 'white', fontWeight: 800 }}>{`${len.toFixed(1)} seconds`}</span>
      </div>
    </div>
  );
}
function MakerRing({ pct, label }) {
  const { theme } = useTheme();
  const R = 26;
  const L = 2 * Math.PI * R;
  return (
    <div aria-live="polite" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 'inherit' }}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
        <circle cx="32" cy="32" r={R} fill="none" stroke={theme.gold} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${L * Math.max(0.02, Math.min(1, pct))} ${L}`} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dasharray 0.2s ease-out' }} />
      </svg>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>{label}</div>
    </div>
  );
}
export function VideoStickerMaker({ file, userId, onCancel, onSaved }) {
  const { theme } = useTheme();
  const isGif = String(file.type || '').toLowerCase() === 'image/gif' || /\.gif$/i.test(file.name || '');
  const [url, setUrl] = useState(null);
  const [nat, setNat] = useState(null);
  const [gif, setGif] = useState(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(ANIM_MAX_MS / 1000);
  const [shape, setShape] = useState('square');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [failed, setFailed] = useState('');
  const [tiles, setTiles] = useState({});
  const vidRef = useRef(null);
  const gifImgRef = useRef(null);
  const signalRef = useRef(null);
  const busyRef = useRef(false);
  const holdRef = useRef(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const trimRef = useRef({ start: 0, len: ANIM_MAX_MS / 1000 });
  trimRef.current = { start, len };
  const size = Math.max(220, Math.min((typeof window !== 'undefined' ? window.innerWidth : 360) - 48, 320));
  const stopMaking = () => { if (signalRef.current) signalRef.current.stopped = true; busyRef.current = false; holdRef.current = false; setBusy(false); };
  const cancel = () => { if (busyRef.current) { stopMaking(); return; } onCancel(); };
  useBackClose(true, onCancel);
  useBackClose(busy, stopMaking);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    let alive = true;
    if (isGif) {
      file.arrayBuffer().then((buf) => {
        if (!alive) return;
        const g = gifRead(buf);
        if (!g) { setFailed('That GIF could not be read. Try another one.'); return; }
        if (g.frames.length < 2) { setFailed('That GIF does not move. Use Create for a still sticker.'); return; }
        setGif(g);
        setNat({ w: g.W, h: g.H });
      }, () => { if (alive) setFailed('That GIF could not be read. Try another one.'); });
    }
    return () => { alive = false; if (signalRef.current) signalRef.current.stopped = true; setTimeout(() => URL.revokeObjectURL(u), 1000); };
  }, [file]);
  const onMeta = async () => {
    const v = vidRef.current;
    if (!v) return;
    if (!v.videoWidth || !v.videoHeight) { setFailed('That video could not be opened. Try another one.'); return; }
    const d = await animDuration(v);
    if (!d || d < 0.4) { setFailed('That video is too short. Pick one that is at least half a second long.'); return; }
    setNat({ w: v.videoWidth, h: v.videoHeight });
    setDur(d);
    setLen(Math.min(ANIM_MAX_MS / 1000, d));
    setStart(0);
    try { v.currentTime = 0; v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {}
  };
  useClipLoop(vidRef, trimRef, holdRef, !isGif && dur > 0 && !busy);
  const base = nat ? Math.max(size / nat.w, size / nat.h) : 1;
  const dispW = nat ? nat.w * base * zoom : size;
  const dispH = nat ? nat.h * base * zoom : size;
  const clampOffset = (o, z) => {
    if (!nat) return o;
    const mx = Math.max(0, (nat.w * base * z - size) / 2);
    const my = Math.max(0, (nat.h * base * z - size) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const setZoomSafe = (z) => { const nz = Math.max(1, Math.min(5, z)); setZoom(nz); setOffset((o) => clampOffset(o, nz)); };
  const crop = () => { const sc = base * zoom; return { sx: (dispW / 2 - size / 2 - offset.x) / sc, sy: (dispH / 2 - size / 2 - offset.y) / sc, sw: size / sc }; };
  const onDown = (e) => {
    if (busy) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) { const [a, b] = [...pointersRef.current.values()]; pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom }; }
  };
  const onMove = (e) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2 && pinchRef.current) { const [a, b] = [...pointersRef.current.values()]; setZoomSafe(pinchRef.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinchRef.current.dist))); return; }
    setOffset((o) => clampOffset({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }, zoom));
  };
  const onUp = (e) => { pointersRef.current.delete(e.pointerId); if (pointersRef.current.size < 2) pinchRef.current = null; };
  useEffect(() => {
    if (!nat || busy) return undefined;
    const t = setTimeout(() => {
      const src = isGif ? gifImgRef.current : vidRef.current;
      if (!src) return;
      const c = crop();
      const out = {};
      const cv = animCanvas(132);
      const x = cv.getContext('2d');
      try { STICKER_SHAPES.forEach(([k]) => { paintStickerFrame(x, 132, k, src, c, true); out[k] = cv.toDataURL('image/png'); }); setTiles(out); } catch {}
    }, Object.keys(tiles).length ? 260 : 60);
    return () => clearTimeout(t);
  }, [nat, zoom, offset.x, offset.y, start, busy]);
  const make = async () => {
    if (busyRef.current || !nat || failed) return;
    const signal = { stopped: false };
    signalRef.current = signal;
    busyRef.current = true;
    setBusy(true);
    setPct(0);
    const c = crop();
    try {
      if (!(await animPack()) || !window.ZANIM) throw new Error('pack');
      const Z = window.ZANIM;
      const soft = await Z.canWebp();
      const S = soft ? 512 : 320;
      const fps = 10;
      const step = 1000 / fps;
      const cv = animCanvas(S);
      const ctx = cv.getContext('2d', { willReadFrequently: !soft });
      const enc = soft ? null : Z.gifEncoder({ w: S, h: S, transparent: true, maxColors: 160 });
      const frames = [];
      const delays = [];
      let src = null;
      let n = 0;
      let seekTo = null;
      if (gif) {
        n = Math.max(2, Math.round(Math.min(ANIM_MAX_MS, gif.total) / step));
        const gc = document.createElement('canvas');
        gc.width = gif.W;
        gc.height = gif.H;
        const gx = gc.getContext('2d');
        const img = gx.createImageData(gif.W, gif.H);
        const next = gifComposer(gif);
        let fi = -1;
        let fEnd = 0;
        src = gc;
        seekTo = async (i) => {
          const t = i * step;
          let moved = false;
          while (t >= fEnd && fi < gif.frames.length - 1) { const px = next(); if (!px) break; fi += 1; fEnd += gif.frames[fi].delay; img.data.set(px); moved = true; }
          if (moved || i === 0) gx.putImageData(img, 0, 0);
        };
      } else {
        const v = vidRef.current;
        if (!v) throw new Error('video');
        holdRef.current = true;
        v.pause();
        const s = trimRef.current.start;
        n = Math.max(2, Math.round(trimRef.current.len * fps));
        src = v;
        seekTo = (i) => animSeek(v, Math.min(s + (i * step) / 1000, (dur || 1e9) - 0.02));
      }
      const budget = (MOVING_STICKER_MAX * 0.8) / n;
      const outline = stickerOutline(S, shape, soft);
      let q = 0.72;
      let used = 0;
      const pending = [];
      const take = async () => {
        const fr = await pending.shift();
        if (!fr) throw new Error('webp');
        frames.push(fr);
        used += fr.data.length;
        const want = budget * frames.length;
        if ((fr.data.length > budget * 1.05 || used > want * 1.04) && q > 0.28) q = Math.max(0.28, q - (used > want * 1.2 ? 0.12 : 0.06));
        else if (fr.data.length < budget * 0.6 && used < want * 0.8 && q < 0.8) q = Math.min(0.8, q + 0.03);
        setPct((frames.length / n) * 0.92);
      };
      for (let i = 0; i < n; i++) {
        if (signal.stopped) return;
        await seekTo(i);
        paintStickerFrame(ctx, S, shape, src, c, soft, outline);
        delays.push(step);
        if (soft) {
          pending.push(Z.webpFromCanvas(cv, q));
          if (pending.length >= 3) await take();
        } else {
          enc.add(ctx.getImageData(0, 0, S, S));
          setPct(((i + 1) / n) * 0.6);
        }
      }
      while (pending.length) await take();
      if (signal.stopped) return;
      const blob = soft ? Z.webpAnimate(frames, S, S, delays, 0) : await enc.finish(delays, (p) => setPct(0.6 + p * 0.32));
      if (signal.stopped) return;
      if (!blob || !blob.size) throw new Error('empty');
      if (blob.size > MOVING_STICKER_MAX * 1.6) { busyRef.current = false; setBusy(false); holdRef.current = false; appSnack('That came out too big. Try a shorter part.'); return; }
      const ext = soft ? 'webp' : 'gif';
      const { url: up, error } = await uploadMedia(new File([blob], `sticker-${Date.now()}.${ext}`, { type: soft ? 'image/webp' : 'image/gif' }), userId);
      if (signal.stopped) return;
      if (error || !up) throw error || new Error('upload');
      setPct(1);
      let row = null;
      try {
        const { data, error: insertErr } = await supabase.from('user_stickers').insert({ user_id: userId, url: up }).select('id, url').single();
        if (!insertErr && data) row = { id: data.id, url: data.url };
      } catch {}
      busyRef.current = false;
      onSaved(row || { id: `local-${Date.now()}`, url: up });
    } catch {
      if (signal.stopped) return;
      busyRef.current = false;
      holdRef.current = false;
      setBusy(false);
      appSnack(navigator.onLine === false ? 'No connection. Your sticker is still here, try again when you are back online.' : 'That sticker could not be made on this device. Try another clip.');
    }
  };
  const B = stickerEdge(512, true);
  const inset = ((B.M + B.B) * size) / 512;
  const shapeD = stickerShapeD(shape, size, inset);
  return (
    <Portal>
      <div className="zchat-fade" role="dialog" aria-label="Moving sticker" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 420, background: '#0E0C14', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px' }}>
          <div role="button" aria-label={busy ? 'Stop making the sticker' : 'Close moving sticker'} onClick={cancel} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} /></div>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Moving sticker</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} onWheel={(e) => { if (!busy) setZoomSafe(zoom * (1 - e.deltaY * 0.0015)); }}>
          <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            style={{ position: 'relative', width: size, height: size, touchAction: 'none', cursor: busy ? 'default' : 'grab', borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
            {url && !failed && (isGif
              ? (nat && <img ref={gifImgRef} src={url} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none', transform: `translate(${size / 2 - dispW / 2 + offset.x}px, ${size / 2 - dispH / 2 + offset.y}px)` }} />)
              : <video ref={vidRef} src={url} muted playsInline preload="auto" onLoadedMetadata={onMeta} onError={() => setFailed('That video could not be opened. Try another one.')}
                  style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', pointerEvents: 'none', opacity: nat ? 1 : 0, transform: `translate(${size / 2 - dispW / 2 + offset.x}px, ${size / 2 - dispH / 2 + offset.y}px)` }} />)}
            {!nat && !failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>}
            {failed && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontSize: 14.5, lineHeight: 1.45, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{failed}</div>}
            {nat && !failed && (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <path d={`M0 0H${size}V${size}H0Z ${shapeD}`} fill="rgba(14, 12, 20, 0.66)" fillRule="evenodd" />
                <path d={shapeD} fill="none" stroke="#FFFFFF" strokeWidth={((B.B * 2) * size) / 512} strokeLinejoin="round" />
              </svg>
            )}
            {busy && <MakerRing pct={pct} label="Making your sticker" />}
          </div>
        </div>
        <div style={{ padding: '6px 14px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, opacity: busy ? 0.45 : 1, pointerEvents: busy ? 'none' : 'auto', maxWidth: 520, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {!isGif && dur > 0 && (
            <ClipTrim src={url} dur={dur} start={start} len={len} maxLen={ANIM_MAX_MS / 1000} hint="Drag to pick up to 3 seconds"
              onChange={(s, l) => { setStart(s); setLen(l); }}
              onSeek={(t) => { holdRef.current = true; const v = vidRef.current; if (v) { try { v.pause(); v.currentTime = t; } catch {} } }}
              onDone={() => { holdRef.current = false; }} />
          )}
          {isGif && gif && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textAlign: 'center' }}>{gif.total > ANIM_MAX_MS ? 'The first 3 seconds of your GIF are used.' : 'Your GIF loops as a sticker.'}</div>}
          <StudioDark>
            <PickTiles label="Sticker shape" size={58} fit ringBg="#0E0C14" value={shape} onChange={(k) => { hapticTap(); setShape(k); }}
              options={STICKER_SHAPES.map(([k, label]) => ({ k, label, aria: `Shape ${label}`, art: tiles[k] ? <img src={tiles[k]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: 12 }} /> }))} />
          </StudioDark>
          <BigButton label={busy ? 'Making your sticker' : 'Save sticker'} disabled={!nat || busy || !!failed} onClick={make} style={{ height: 52, borderRadius: 16 }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>Drag or pinch to frame it. It goes into My stickers.</div>
        </div>
      </div>
    </Portal>
  );
}

const TEXT_STICKER_STYLES = [['outline', 'Cut out'], ['bubble', 'Bubble'], ['pop', 'Pop'], ['neon', 'Neon'], ['retro', 'Retro']];
const TEXT_STICKER_COLORS = ['#7C5CFC', '#FF4D6D', '#FF8A00', '#FFD60A', '#22C55E', '#14B8E6', '#111114', '#FFFFFF'];
function shadeHex(hex, amt) {
  const h = String(hex || '#000000').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
  return `#${ch.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
}
function stickerFillHoles(cv, hex) {
  const W = cv.width;
  const H = cv.height;
  const g = cv.getContext('2d');
  let img;
  try { img = g.getImageData(0, 0, W, H); } catch { return; }
  const d = img.data;
  const seen = new Uint8Array(W * H);
  const st = [];
  const push = (p) => { if (!seen[p] && d[p * 4 + 3] < 128) { seen[p] = 1; st.push(p); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (st.length) {
    const p = st.pop();
    const x = p % W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < W * (H - 1)) push(p + W);
  }
  const [r, gg, b] = hexRgb(hex);
  const holes = [];
  for (let p = 0; p < W * H; p++) if (!seen[p] && d[p * 4 + 3] < 128) holes.push(p);
  if (!holes.length) return;
  const paint = (q) => { const k = q * 4; if (d[k + 3] === 255) return; d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255; };
  holes.forEach((p) => {
    const x = p % W;
    const y = (p - x) / W;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) paint(ny * W + nx);
      }
    }
  });
  g.putImageData(img, 0, 0);
}
function drawTextSticker(canvas, textIn, style, color) {
  const S = 512;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  const words = String(textIn || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const font = (px) => `900 ${px}px ${FONT}`;
  const maxW = S - 120;
  let size = 156;
  let lines = [];
  for (; size >= 34; size -= 6) {
    ctx.font = font(size);
    lines = [];
    let cur = '';
    let fits = true;
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width <= maxW) cur = t;
      else {
        if (cur) lines.push(cur);
        cur = w;
        if (ctx.measureText(w).width > maxW) { fits = false; break; }
      }
    }
    if (cur) lines.push(cur);
    if (fits && lines.length <= 4 && lines.length * size * 1.06 <= S - 150) break;
  }
  ctx.font = font(size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  const lh = size * 1.06;
  const total = lines.length * lh;
  const blockW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const white = color.toUpperCase() === '#FFFFFF';
  const dark = color.toUpperCase() === '#111114';
  const tilt = style === 'pop' ? -0.07 : style === 'bubble' ? -0.04 : style === 'retro' ? -0.05 : 0;
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  ctx.save();
  ctx.translate(S / 2, S / 2);
  ctx.rotate(tilt);
  const y0 = -total / 2 + lh / 2;
  const eachLine = (fn) => lines.forEach((l, i) => fn(l, 0, y0 + i * lh));
  if (style === 'bubble') {
    const bw = blockW + size * 0.9;
    const bh = total + size * 0.62;
    const r = Math.min(bh / 2, size * 0.55);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = white ? '#111114' : '#FFFFFF';
    rr(-bw / 2, -bh / 2, bw, bh, r);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = white ? '#FFFFFF' : color;
    eachLine((l, x, y) => ctx.fillText(l, x, y));
  } else if (style === 'neon') {
    const bw = blockW + size * 0.8;
    const bh = total + size * 0.6;
    ctx.fillStyle = 'rgba(14,10,30,0.92)';
    rr(-bw / 2, -bh / 2, bw, bh, size * 0.4);
    ctx.fill();
    const glow = dark ? '#7C5CFC' : color;
    ctx.strokeStyle = glow;
    ctx.lineWidth = size * 0.06;
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.35;
    eachLine((l, x, y) => ctx.strokeText(l, x, y));
    ctx.shadowBlur = size * 0.15;
    eachLine((l, x, y) => ctx.strokeText(l, x, y));
    ctx.shadowBlur = 0;
    ctx.fillStyle = shadeHex(glow, 0.75);
    eachLine((l, x, y) => ctx.fillText(l, x, y));
  } else if (style === 'pop') {
    const depth = size * 0.09;
    ctx.fillStyle = dark ? '#7C5CFC' : '#111114';
    ctx.strokeStyle = dark ? '#7C5CFC' : '#111114';
    ctx.lineWidth = size * 0.3;
    eachLine((l, x, y) => { ctx.strokeText(l, x + depth, y + depth); ctx.fillText(l, x + depth, y + depth); });
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size * 0.22;
    eachLine((l, x, y) => ctx.strokeText(l, x, y));
    ctx.fillStyle = white ? '#FFD60A' : color;
    eachLine((l, x, y) => ctx.fillText(l, x, y));
  } else if (style === 'retro') {
    const base = white ? '#FF4D6D' : color;
    const side = shadeHex(base, -0.45);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = size * 0.2;
    const steps = Math.max(6, Math.round(size * 0.08));
    eachLine((l, x, y) => ctx.strokeText(l, x + steps, y + steps));
    ctx.fillStyle = side;
    for (let s = steps; s >= 1; s--) eachLine((l, x, y) => ctx.fillText(l, x + s, y + s));
    ctx.fillStyle = base;
    eachLine((l, x, y) => ctx.fillText(l, x, y));
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.save();
    ctx.beginPath();
    ctx.rect(-S / 2, -total / 2 - size, S, total / 2 + size * 0.55);
    ctx.clip();
    eachLine((l, x, y) => ctx.fillText(l, x, y));
    ctx.restore();
  } else {
    const edge = white ? '#111114' : '#FFFFFF';
    const cut = document.createElement('canvas');
    cut.width = S;
    cut.height = S;
    const cx = cut.getContext('2d');
    cx.font = ctx.font;
    cx.textAlign = 'center';
    cx.textBaseline = 'middle';
    cx.lineJoin = 'round';
    cx.miterLimit = 2;
    cx.translate(S / 2, S / 2);
    cx.rotate(tilt);
    cx.strokeStyle = edge;
    cx.lineWidth = size * 0.46;
    eachLine((l, x, y) => cx.strokeText(l, x, y));
    stickerFillHoles(cut, edge);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(cut, 0, 0);
    ctx.restore();
    ctx.fillStyle = color;
    eachLine((l, x, y) => ctx.fillText(l, x, y));
  }
  ctx.restore();
  return true;
}
const textStickerThumbs = new Map();
function textStickerThumb(style, color) {
  const key = `${style}|${color}`;
  if (textStickerThumbs.has(key)) return textStickerThumbs.get(key);
  let url = '';
  try {
    const big = document.createElement('canvas');
    drawTextSticker(big, 'Aa', style, color);
    const small = document.createElement('canvas');
    small.width = 132;
    small.height = 132;
    const ctx = small.getContext('2d');
    ctx.drawImage(big, 46, 46, 420, 420, 0, 0, 132, 132);
    url = small.toDataURL('image/png');
  } catch {}
  textStickerThumbs.set(key, url);
  return url;
}
export function TextStickerMaker({ userId, onClose, onDone }) {
  useBackClose(true, onClose);
  const [text, setText] = useState('');
  const [style, setStyle] = useState('outline');
  const [color, setColor] = useState('#7C5CFC');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const canvasRef = useRef(null);
  useEffect(() => { if (canvasRef.current) drawTextSticker(canvasRef.current, text.trim() ? text : 'Your text', style, color); }, [text, style, color]);
  const save = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setErr('');
    try {
      const c = document.createElement('canvas');
      drawTextSticker(c, text, style, color);
      const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
      if (!blob) throw new Error('blob');
      const { url, error } = await uploadMedia(new File([blob], `text-sticker-${Date.now()}.png`, { type: 'image/png' }), userId);
      if (error || !url) throw error || new Error('upload');
      let row = null;
      try {
        const { data, error: insertErr } = await supabase.from('user_stickers').insert({ user_id: userId, url }).select('id, url').single();
        if (!insertErr && data) row = { id: data.id, url: data.url };
      } catch {}
      onDone(row || { id: `local-${Date.now()}`, url });
    } catch {
      setErr("Couldn't make that sticker. Try again.");
      setBusy(false);
    }
  };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 420, background: '#0E0C14', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px' }}>
          <div role="button" aria-label="Close text sticker" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} /></div>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>Text sticker</div>
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
          <canvas ref={canvasRef} aria-label="Sticker preview" style={{ width: 'min(68vw, 300px, 40vh)', height: 'min(68vw, 300px, 40vh)', opacity: text.trim() ? 1 : 0.45, transition: 'opacity 0.2s ease' }} />
        </div>
        <div style={{ padding: '0 14px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={text} onChange={(e) => setText(e.target.value.slice(0, 40))} placeholder="Type a word or two" aria-label="Sticker text" autoFocus maxLength={40}
            style={{ height: 48, borderRadius: 24, border: 'none', outline: 'none', padding: '0 18px', background: 'rgba(255,255,255,0.12)', color: 'white', fontFamily: FONT, fontSize: 16 }} />
          <StudioDark>
            <PickTiles label="Sticker style" size={58} fit ringBg="#0E0C14" value={style} onChange={(k) => setStyle(k)}
              options={TEXT_STICKER_STYLES.map(([k, label]) => ({ k, label, aria: `Style ${label}`, art: <img src={textStickerThumb(k, color)} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> }))} />
          </StudioDark>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', padding: '0 4px' }}>
            {TEXT_STICKER_COLORS.map((c) => (
              <div key={c} role="button" aria-label={`Colour ${c}`} aria-pressed={color === c} onClick={() => { hapticTap(); setColor(c); }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0, boxShadow: color === c ? '0 0 0 2.5px #0E0C14, 0 0 0 4.5px #FFFFFF' : 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.3)', transition: 'box-shadow 160ms ease' }} />
            ))}
          </div>
          {err && <div style={{ fontSize: 13, fontWeight: 700, color: '#FF8A8A', textAlign: 'center' }}>{err}</div>}
          <BigButton label={busy ? 'Making your sticker' : 'Send sticker'} disabled={!text.trim() || busy} onClick={save} style={{ height: 52, borderRadius: 16 }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>It is saved to My stickers too.</div>
        </div>
      </div>
    </Portal>
  );
}
const ANIM_FILE_MAX = 3 * 1024 * 1024;
const ANIM_MAX_MS = 3000;
function gifRead(buf) {
  const b = new Uint8Array(buf);
  if (b.length < 14 || b[0] !== 0x47 || b[1] !== 0x49 || b[2] !== 0x46) return null;
  const W = b[6] | (b[7] << 8);
  const H = b[8] | (b[9] << 8);
  if (!W || !H || W * H > 16000000) return null;
  let p = 13;
  let gct = null;
  if (b[10] & 0x80) { const n = 3 * (1 << ((b[10] & 7) + 1)); gct = b.subarray(p, p + n); p += n; }
  const skip = () => { while (p < b.length && b[p] !== 0) p += b[p] + 1; p += 1; };
  const frames = [];
  let gce = null;
  while (p < b.length) {
    const t = b[p++];
    if (t === 0x3B) break;
    if (t === 0x21) {
      const label = b[p++];
      if (label === 0xF9 && b[p] >= 4 && p + 4 < b.length) {
        const pk = b[p + 1];
        gce = { delay: b[p + 2] | (b[p + 3] << 8), disp: (pk >> 2) & 7, trans: (pk & 1) ? b[p + 4] : -1 };
      }
      skip();
      continue;
    }
    if (t !== 0x2C || p + 9 > b.length) break;
    const lf = b[p + 8];
    const f = { x: b[p] | (b[p + 1] << 8), y: b[p + 2] | (b[p + 3] << 8), w: b[p + 4] | (b[p + 5] << 8), h: b[p + 6] | (b[p + 7] << 8), inter: !!(lf & 0x40), pal: gct };
    p += 9;
    if (lf & 0x80) { const n = 3 * (1 << ((lf & 7) + 1)); f.pal = b.subarray(p, p + n); p += n; }
    f.min = b[p++];
    f.start = p;
    skip();
    f.end = Math.min(p, b.length);
    const g = gce || { delay: 0, disp: 0, trans: -1 };
    gce = null;
    f.delay = g.delay <= 1 ? 100 : g.delay * 10;
    f.disp = g.disp;
    f.trans = g.trans;
    if (f.w && f.h && f.pal && f.min >= 1 && f.min <= 11) frames.push(f);
  }
  if (!frames.length) return null;
  return { b, W, H, frames, total: frames.reduce((s, f) => s + f.delay, 0) };
}
function gifPixels(b, f) {
  const npix = f.w * f.h;
  const out = new Uint8Array(npix);
  const clear = 1 << f.min;
  const eoi = clear + 1;
  const prefix = new Uint16Array(4096);
  const suffix = new Uint8Array(4096);
  const stack = new Uint8Array(4097);
  for (let i = 0; i < clear; i++) suffix[i] = i;
  let size = f.min + 1;
  let mask = (1 << size) - 1;
  let next = eoi + 1;
  let old = -1;
  let first = 0;
  let datum = 0;
  let bits = 0;
  let op = 0;
  let p = f.start;
  let left = 0;
  while (op < npix) {
    while (bits < size) {
      if (left === 0) {
        if (p >= f.end) return out;
        left = b[p++];
        if (left === 0) return out;
      }
      datum |= b[p++] << bits;
      bits += 8;
      left -= 1;
    }
    let code = datum & mask;
    datum >>>= size;
    bits -= size;
    if (code === clear) { size = f.min + 1; mask = (1 << size) - 1; next = eoi + 1; old = -1; continue; }
    if (code === eoi) break;
    if (old < 0) { first = suffix[code]; out[op++] = first; old = code; continue; }
    const cur = code;
    let sp = 0;
    if (code >= next) { stack[sp++] = first; code = old; }
    while (code > eoi && sp < 4096) { stack[sp++] = suffix[code]; code = prefix[code]; }
    first = suffix[code];
    stack[sp++] = first;
    if (next < 4096) {
      prefix[next] = old;
      suffix[next] = first;
      next += 1;
      if ((next & mask) === 0 && next < 4096) { size += 1; mask = (1 << size) - 1; }
    }
    old = cur;
    while (sp > 0 && op < npix) out[op++] = stack[--sp];
  }
  return out;
}
function gifComposer(g) {
  const { W, H } = g;
  const px = new Uint8ClampedArray(W * H * 4);
  let saved = null;
  let prev = null;
  let i = 0;
  const clearRect = (f) => {
    for (let y = f.y; y < Math.min(H, f.y + f.h); y++) px.fill(0, (y * W + f.x) * 4, (y * W + Math.min(W, f.x + f.w)) * 4);
  };
  return () => {
    if (i >= g.frames.length) return null;
    if (prev) {
      if (prev.disp === 2) clearRect(prev);
      else if (prev.disp === 3 && saved) px.set(saved);
    }
    const f = g.frames[i];
    saved = f.disp === 3 ? px.slice() : null;
    const idx = gifPixels(g.b, f);
    const pal = f.pal;
    const ncol = Math.floor(pal.length / 3);
    const rows = new Int32Array(f.h);
    if (f.inter) { let r = 0; [[0, 8], [4, 8], [2, 4], [1, 2]].forEach(([s, d]) => { for (let y = s; y < f.h; y += d) rows[r++] = y; }); } else for (let r = 0; r < f.h; r++) rows[r] = r;
    for (let r = 0; r < f.h; r++) {
      const y = f.y + rows[r];
      if (y >= H) continue;
      const base = r * f.w;
      for (let c = 0; c < f.w; c++) {
        const x = f.x + c;
        if (x >= W) break;
        const k = idx[base + c];
        if (k === f.trans || k >= ncol) continue;
        const o = (y * W + x) * 4;
        px[o] = pal[k * 3];
        px[o + 1] = pal[k * 3 + 1];
        px[o + 2] = pal[k * 3 + 2];
        px[o + 3] = 255;
      }
    }
    prev = f;
    i += 1;
    return px;
  };
}
async function gifFramesFor(g, crop, loopMs, onStep) {
  const src = document.createElement('canvas');
  src.width = g.W;
  src.height = g.H;
  const sctx = src.getContext('2d');
  const img = sctx.createImageData(g.W, g.H);
  const out = animCanvas(ANIM_PX);
  const octx = out.getContext('2d', { willReadFrequently: true });
  const big = animCanvas(640);
  const step = gifComposer(g);
  const frames = [];
  let t = 0;
  for (let i = 0; i < g.frames.length && t < loopMs; i++) {
    const px = step();
    if (!px) break;
    img.data.set(px);
    sctx.putImageData(img, 0, 0);
    if (i === 0) {
      const bx = big.getContext('2d');
      bx.fillStyle = '#FFFFFF';
      bx.fillRect(0, 0, 640, 640);
      bx.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sw, 0, 0, 640, 640);
    }
    octx.fillStyle = '#FFFFFF';
    octx.fillRect(0, 0, ANIM_PX, ANIM_PX);
    octx.drawImage(src, crop.sx, crop.sy, crop.sw, crop.sw, 0, 0, ANIM_PX, ANIM_PX);
    const data = octx.getImageData(0, 0, ANIM_PX, ANIM_PX);
    const last = frames[frames.length - 1];
    if (last && t - last.at < 33) last.data = data; else frames.push({ at: t, data });
    t += g.frames[i].delay;
    if (i % 6 === 5) { if (onStep) onStep(Math.min(1, t / loopMs)); await new Promise((r) => setTimeout(r, 0)); }
  }
  return { frames, poster: big };
}

export function AnimatedAvatarMaker({ file, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const isGif = String(file.type || '').toLowerCase() === 'image/gif' || /\.gif$/i.test(file.name || '');
  const [url, setUrl] = useState(null);
  const [nat, setNat] = useState(null);
  const [gif, setGif] = useState(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(ANIM_MAX_MS / 1000);
  const [thumbs, setThumbs] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [failed, setFailed] = useState('');
  const vidRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const signalRef = useRef(null);
  const busyRef = useRef(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const trimRef = useRef({ start: 0, len: ANIM_MAX_MS / 1000 });
  trimRef.current = { start, len };
  const size = Math.max(220, Math.min((typeof window !== 'undefined' ? window.innerWidth : 360) - 48, isGif ? 340 : 300));
  const cancel = () => { if (busyRef.current && signalRef.current) { signalRef.current.stopped = true; busyRef.current = false; setBusy(false); return; } onCancel(); };
  useBackClose(true, cancel);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    let alive = true;
    if (isGif) {
      file.arrayBuffer().then((buf) => {
        if (!alive) return;
        const g = gifRead(buf);
        if (!g) { setFailed('That GIF could not be read. Try another one.'); return; }
        if (g.frames.length < 2) { setFailed('That GIF does not move. Use Change photo for a still picture.'); return; }
        setGif(g);
        setNat({ w: g.W, h: g.H });
      }, () => { if (alive) setFailed('That GIF could not be read. Try another one.'); });
    }
    return () => { alive = false; if (signalRef.current) signalRef.current.stopped = true; setTimeout(() => URL.revokeObjectURL(u), 1000); };
  }, [file]);

  const onMeta = async () => {
    const v = vidRef.current;
    if (!v) return;
    if (!v.videoWidth || !v.videoHeight) { setFailed('That video could not be opened. Try another one.'); return; }
    const d = await animDuration(v);
    if (!d || d < 0.4) { setFailed('That video is too short. Pick one that is at least half a second long.'); return; }
    setNat({ w: v.videoWidth, h: v.videoHeight });
    setDur(d);
    setLen(Math.min(ANIM_MAX_MS / 1000, d));
    setStart(0);
    try { v.currentTime = 0; v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {}
  };

  useEffect(() => {
    if (isGif || !url || !dur) return undefined;
    let alive = true;
    const tv = document.createElement('video');
    tv.muted = true;
    tv.playsInline = true;
    tv.preload = 'auto';
    tv.src = url;
    const n = 8;
    const run = async () => {
      await new Promise((r) => { if (tv.readyState >= 1) r(); else { tv.onloadedmetadata = () => r(); setTimeout(r, 3000); } });
      const c = animCanvas(72);
      const x = c.getContext('2d');
      const list = [];
      for (let i = 0; i < n && alive; i++) {
        await animSeek(tv, Math.min(dur - 0.05, ((i + 0.5) * dur) / n));
        if (!alive || !tv.videoWidth) break;
        const s = Math.min(tv.videoWidth, tv.videoHeight);
        try { x.drawImage(tv, (tv.videoWidth - s) / 2, (tv.videoHeight - s) / 2, s, s, 0, 0, 72, 72); list.push(c.toDataURL('image/jpeg', 0.6)); } catch { break; }
        if (alive) setThumbs(list.slice());
      }
    };
    run();
    return () => { alive = false; try { tv.removeAttribute('src'); tv.load(); } catch {} };
  }, [url, dur, isGif]);

  useEffect(() => {
    if (isGif || !dur || busy) return undefined;
    let raf = 0;
    const loop = () => {
      const v = vidRef.current;
      if (v && !dragRef.current && !busyRef.current) {
        const { start: s, len: l } = trimRef.current;
        if (v.currentTime >= s + l - 0.02 || v.currentTime < s - 0.3) { try { v.currentTime = s; } catch {} }
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dur, isGif, busy]);

  const base = nat ? Math.max(size / nat.w, size / nat.h) : 1;
  const dispW = nat ? nat.w * base * zoom : size;
  const dispH = nat ? nat.h * base * zoom : size;
  const clampOffset = (o, z) => {
    if (!nat) return o;
    const mx = Math.max(0, (nat.w * base * z - size) / 2);
    const my = Math.max(0, (nat.h * base * z - size) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const setZoomSafe = (z) => {
    const nz = Math.max(1, Math.min(5, z));
    setZoom(nz);
    setOffset((o) => clampOffset(o, nz));
  };
  const onDown = (e) => {
    if (busy) return;
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
      setZoomSafe(pinchRef.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinchRef.current.dist)));
      return;
    }
    setOffset((o) => clampOffset({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }, zoom));
  };
  const onUp = (e) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const maxLen = Math.min(ANIM_MAX_MS / 1000, dur || ANIM_MAX_MS / 1000);
  const minLen = Math.min(0.5, maxLen);
  const showAt = (t) => { const v = vidRef.current; if (v) { try { v.pause(); v.currentTime = t; } catch {} } };
  const trackDown = (e) => {
    if (busy || !dur || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const x0 = (start / dur) * r.width;
    const x1 = ((start + len) / dur) * r.width;
    let mode = 'move';
    let s0 = start;
    if (Math.abs(x - x0) <= 16 && x <= (x0 + x1) / 2) mode = 'l';
    else if (Math.abs(x - x1) <= 16) mode = 'r';
    else if (x < x0 || x > x1) { s0 = Math.max(0, Math.min(dur - len, (x / r.width) * dur - len / 2)); setStart(s0); }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, x, w: r.width, s0, e0: s0 + len };
    showAt(mode === 'r' ? s0 + len : s0);
  };
  const trackMove = (e) => {
    const d = dragRef.current;
    if (!d || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const ds = ((e.clientX - r.left - d.x) / d.w) * dur;
    if (d.mode === 'move') { const s = Math.max(0, Math.min(dur - (d.e0 - d.s0), d.s0 + ds)); setStart(s); showAt(s); }
    else if (d.mode === 'l') { const s = Math.max(Math.max(0, d.e0 - maxLen), Math.min(d.e0 - minLen, d.s0 + ds)); setStart(s); setLen(d.e0 - s); showAt(s); }
    else { const en = Math.max(d.s0 + minLen, Math.min(Math.min(dur, d.s0 + maxLen), d.e0 + ds)); setLen(en - d.s0); showAt(en); }
  };
  const trackUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const v = vidRef.current;
    if (v) { try { v.currentTime = trimRef.current.start; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {} }
  };
  const trackKey = (e) => {
    if (!dur) return;
    const k = e.key;
    const stepBy = k === 'ArrowRight' || k === 'ArrowUp' ? 0.1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -0.1 : 0;
    if (!stepBy) return;
    e.preventDefault();
    setStart((s) => Math.max(0, Math.min(dur - len, Math.round((s + stepBy) * 10) / 10)));
  };

  const crop = () => {
    const scale = base * zoom;
    return { sx: (dispW / 2 - size / 2 - offset.x) / scale, sy: (dispH / 2 - size / 2 - offset.y) / scale, sw: size / scale };
  };
  const loopOfGif = () => {
    const loop = Math.min(ANIM_MAX_MS, gif.total);
    const reps = Math.max(1, Math.min(Math.floor(ANIM_MAX_MS / loop), Math.ceil(1500 / loop)));
    return { loop, total: loop * reps };
  };
  const make = async () => {
    if (busyRef.current || !nat || failed) return;
    const signal = { stopped: false };
    signalRef.current = signal;
    busyRef.current = true;
    setBusy(true);
    setPct(0);
    const c = crop();
    try {
      let clip = null;
      let poster = null;
      if (gif) {
        const { loop, total } = loopOfGif();
        const r = await gifFramesFor(gif, c, loop, (p) => setPct(p * 0.25));
        if (signal.stopped) return;
        poster = await animBlobOf(r.poster, 'image/jpeg', 0.9);
        let k = 0;
        clip = await animRecord({
          len: total, signal, onTick: (p) => setPct(0.25 + p * 0.75),
          paint: (ctx, t) => {
            if (t >= total) return false;
            const tt = t % loop;
            if (k >= r.frames.length || r.frames[k].at > tt) k = 0;
            while (k + 1 < r.frames.length && r.frames[k + 1].at <= tt) k += 1;
            ctx.putImageData(r.frames[k].data, 0, 0);
            return true;
          },
        });
      } else {
        const v = vidRef.current;
        if (!v) return;
        const s = trimRef.current.start;
        const l = trimRef.current.len;
        v.pause();
        await animSeek(v, s);
        if (signal.stopped) return;
        const big = animCanvas(640);
        big.getContext('2d').drawImage(v, c.sx, c.sy, c.sw, c.sw, 0, 0, 640, 640);
        poster = await animBlobOf(big, 'image/jpeg', 0.9);
        await v.play();
        const endAt = s + l;
        clip = await animRecord({
          len: l * 1000, signal, onTick: setPct,
          paint: (ctx, t) => {
            if (v.ended || v.currentTime >= endAt - 0.015 || t > Math.min(l * 1000 + 250, ANIM_MAX_MS + 150)) return false;
            ctx.drawImage(v, c.sx, c.sy, c.sw, c.sw, 0, 0, ANIM_PX, ANIM_PX);
            return true;
          },
        });
        try { v.pause(); } catch {}
      }
      if (signal.stopped) return;
      if (!clip || !clip.size || !poster) throw new Error('empty');
      if (clip.size > ANIM_FILE_MAX) { busyRef.current = false; setBusy(false); appSnack('That came out too big. Try a shorter part.'); return; }
      onConfirm({ clip, poster, ext: /mp4/i.test(clip.type) ? 'mp4' : 'webm' });
    } catch (e) {
      if (signal.stopped) return;
      busyRef.current = false;
      setBusy(false);
      appSnack(signal.late ? 'Keep ZChat open while your picture is made, then try again.' : 'Your animated picture could not be made on this device. Try another file.');
    }
  };

  const ringR = 26;
  const ringC = 2 * Math.PI * ringR;
  const x0p = dur ? (start / dur) * 100 : 0;
  const wp = dur ? (len / dur) * 100 : 100;
  return (
    <div role="dialog" aria-label="Animated picture" style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 150, display: 'flex', flexDirection: 'column',
      paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', color: 'white',
    }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span role="button" aria-label="Cancel" onClick={cancel} style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 6 }}>Cancel</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Animated picture</span>
        <span role="button" aria-label="Use this animated picture" aria-disabled={!nat || busy || !!failed} onClick={make} style={{ fontSize: 15, fontWeight: 800, cursor: nat && !busy && !failed ? 'pointer' : 'default', padding: 6, color: theme.gold, opacity: nat && !failed ? 1 : 0.45 }}>{busy ? <Spinner size={15} /> : 'Done'}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}
        onWheel={(e) => { if (!busy) setZoomSafe(zoom * (1 - e.deltaY * 0.0015)); }}>
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position: 'relative', width: size, height: size, touchAction: 'none', cursor: busy ? 'default' : 'grab' }}>
          {url && !failed && (isGif
            ? (nat && <img src={url} alt="" draggable={false} style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', userSelect: 'none', pointerEvents: 'none', background: '#FFFFFF', transform: `translate(${size / 2 - dispW / 2 + offset.x}px, ${size / 2 - dispH / 2 + offset.y}px)` }} />)
            : <video ref={vidRef} src={url} muted playsInline preload="auto" onLoadedMetadata={onMeta} onError={() => setFailed('That video could not be opened. Try another one.')}
                style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', pointerEvents: 'none', opacity: nat ? 1 : 0, transform: `translate(${size / 2 - dispW / 2 + offset.x}px, ${size / 2 - dispH / 2 + offset.y}px)` }} />)}
          {!nat && !failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>}
          {failed && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontSize: 14.5, lineHeight: 1.45, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{failed}</div>}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 2000px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.85)', pointerEvents: 'none' }} />
          {busy && (
            <div aria-live="polite" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.38)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r={ringR} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="4" />
                <circle cx="32" cy="32" r={ringR} fill="none" stroke={theme.gold} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${ringC * Math.max(0.02, pct)} ${ringC}`} transform="rotate(-90 32 32)" />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Making your picture</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 24px 18px', display: 'flex', flexDirection: 'column', gap: 14, opacity: busy ? 0.4 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ImageIcon size={14} color="rgba(255,255,255,0.7)" />
          <input type="range" aria-label="Zoom" min="1" max="5" step="0.01" value={zoom} onChange={(e) => setZoomSafe(parseFloat(e.target.value))} style={{ flex: 1, accentColor: theme.coral }} />
          <ImageIcon size={20} color="rgba(255,255,255,0.9)" />
        </div>
        {!isGif && dur > 0 && (
          <div>
            <div ref={trackRef} onPointerDown={trackDown} onPointerMove={trackMove} onPointerUp={trackUp} onPointerCancel={trackUp}
              style={{ position: 'relative', height: 52, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', touchAction: 'none', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {thumbs.map((u, i) => <img key={i} src={u} alt="" draggable={false} style={{ flex: '1 1 0', minWidth: 0, height: '100%', objectFit: 'cover', display: 'block' }} />)}
              </div>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${x0p}%`, background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p + wp}%`, right: 0, background: 'rgba(0,0,0,0.6)' }} />
              <div role="slider" tabIndex={0} aria-label="Start of your clip" aria-valuemin={0} aria-valuemax={Math.max(0, Math.round((dur - len) * 10) / 10)} aria-valuenow={Math.round(start * 10) / 10} aria-valuetext={`${start.toFixed(1)} seconds in`} onKeyDown={trackKey}
                style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p}%`, width: `${wp}%`, border: `3px solid ${theme.gold}`, borderLeftWidth: 12, borderRightWidth: 12, borderRadius: 12, boxSizing: 'border-box', outline: 'none' }}>
                <span style={{ position: 'absolute', left: -8, top: '50%', width: 4, height: 18, marginTop: -9, borderRadius: 2, background: 'rgba(0,0,0,0.55)' }} />
                <span style={{ position: 'absolute', right: -8, top: '50%', width: 4, height: 18, marginTop: -9, borderRadius: 2, background: 'rgba(0,0,0,0.55)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>
              <span>Drag to pick up to 3 seconds</span>
              <span style={{ color: 'white', fontWeight: 800 }}>{`${len.toFixed(1)} seconds`}</span>
            </div>
          </div>
        )}
        {isGif && gif && (
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textAlign: 'center' }}>
            {gif.total > ANIM_MAX_MS ? 'The first 3 seconds of your GIF play on your profile.' : 'Your GIF loops on your profile.'}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoCropEditor({ file, onCancel, onConfirm }) {
  useBackClose(true, onCancel);
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [grid, setGrid] = useState(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const imgRef = useRef(null);
  const size = Math.max(220, Math.min((typeof window !== 'undefined' ? window.innerWidth : 360) - 24, (typeof window !== 'undefined' ? window.innerHeight : 700) - 220, 480));
  const touchUi = typeof window !== 'undefined' && !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  useEffect(() => {
    let alive = true;
    const u = URL.createObjectURL(file);
    setUrl(u);
    loadImageElement(u).then((img) => { if (!alive) return; imgRef.current = img; setNatural({ w: img.naturalWidth, h: img.naturalHeight }); }).catch(() => { if (alive) onCancel(); });
    return () => { alive = false; setTimeout(() => URL.revokeObjectURL(u), 1000); };
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
    setGrid(true);
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
    if (!pointersRef.current.size) setGrid(false);
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
        <span onClick={confirm} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: 6, color: '#8DB4FF' }}>{saving ? <Spinner size={15} /> : 'Done'}</span>
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
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 2000px rgba(0,0,0,0.62)', border: '1.5px solid rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none', opacity: grid ? 1 : 0, transition: 'opacity 0.2s ease' }}>
            {[1, 2].map((k) => <span key={`v${k}`} style={{ position: 'absolute', top: 0, bottom: 0, left: `${(k * 100) / 3}%`, width: 1, background: 'rgba(255,255,255,0.35)' }} />)}
            {[1, 2].map((k) => <span key={`h${k}`} style={{ position: 'absolute', left: 0, right: 0, top: `${(k * 100) / 3}%`, height: 1, background: 'rgba(255,255,255,0.35)' }} />)}
          </div>
        </div>
      </div>
      {touchUi ? (
        <div style={{ padding: '14px 28px 24px', textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>Drag to move, pinch to zoom</div>
      ) : (
        <div style={{ padding: '14px 28px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <ImageIcon size={14} color="rgba(255,255,255,0.7)" />
          <input type="range" min="1" max="5" step="0.01" value={zoom} aria-label="Zoom" onChange={(e) => setZoomSafe(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#FFFFFF' }} />
          <ImageIcon size={20} color="rgba(255,255,255,0.9)" />
        </div>
      )}
    </div>
  );
}

const EDITOR_COLORS = ['#FFFFFF', '#111111', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#2E7CF6', '#AF52DE', '#FF2D92'];
const DRAW_LOOK = {
  pen: { op: 1, cap: 'round', w: 1 },
  marker: { op: 0.78, cap: 'round', w: 1.7 },
  neon: { op: 1, cap: 'round', w: 1 },
  hl: { op: 0.42, cap: 'square', w: 2.6 },
  erase: { op: 1, cap: 'round', w: 2.2 },
};
const DRAW_BRUSHES = [['pen', 'Pen'], ['marker', 'Marker'], ['neon', 'Neon'], ['hl', 'Highlighter'], ['erase', 'Eraser']];
function DrawBrushSample({ k, color }) {
  const gid = `dbs${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (k === 'erase') return <PaintToolIcon k="eraser" size={25} />;
  const d = 'M5 17.5C9 9.5 13.5 8 18 12.5S27.5 17 33 8';
  const look = DRAW_LOOK[k] || DRAW_LOOK.pen;
  const w = k === 'hl' ? 8 : k === 'marker' ? 5 : k === 'neon' ? 3.2 : 2.6;
  const faint = hexLum(color) < 0.06;
  return (
    <svg width="38" height="24" viewBox="0 0 38 24" aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      {k === 'neon' && <defs><filter id={gid} x="-30%" y="-90%" width="160%" height="280%"><feGaussianBlur stdDeviation="1.9" /></filter></defs>}
      {faint && <path d={d} stroke="rgba(255, 255, 255, 0.42)" strokeWidth={w + 2.4} fill="none" strokeLinecap={look.cap} strokeLinejoin="round" />}
      {k === 'neon' && <path d={d} stroke={color} strokeWidth={w * 2.2} fill="none" strokeLinecap="round" filter={`url(#${gid})`} />}
      <path d={d} stroke={color} strokeOpacity={look.op} strokeWidth={w} fill="none" strokeLinecap={look.cap} strokeLinejoin="round" />
      {k === 'neon' && <path d={d} stroke="#FFFFFF" strokeOpacity="0.92" strokeWidth={w * 0.4} fill="none" strokeLinecap="round" />}
    </svg>
  );
}
function drawStrokeEl(s, i, W, H, ids) {
  const look = DRAW_LOOK[s.b] || DRAW_LOOK.pen;
  const d = strokeToPath(s.points, W, H);
  const w = s.size * W * look.w;
  if (s.b === 'neon') {
    return (
      <g key={i}>
        <path d={d} stroke={s.color} strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${ids}-g${i})`} />
        <path d={d} stroke="#FFFFFF" strokeOpacity="0.92" strokeWidth={w * 0.36} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  return <path key={i} d={d} stroke={s.color} strokeOpacity={look.op} strokeWidth={w} fill="none" strokeLinecap={look.cap} strokeLinejoin="round" />;
}
function drawStrokeTree(strokes, W, H, ids) {
  let body = [];
  const defs = [];
  const big = { x: -W, y: -H, width: W * 3, height: H * 3 };
  strokes.forEach((s, i) => {
    if (s.b === 'erase') {
      const id = `${ids}-m${i}`;
      defs.push(
        <mask key={id} id={id} maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill="#FFFFFF" />
          <path d={strokeToPath(s.points, W, H)} stroke="#000000" strokeWidth={s.size * W * DRAW_LOOK.erase.w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </mask>,
      );
      body = [<g key={`${id}g`} mask={`url(#${id})`}>{body}</g>];
      return;
    }
    if (s.b === 'neon') {
      defs.push(
        <filter key={`${ids}-g${i}`} id={`${ids}-g${i}`} filterUnits="userSpaceOnUse" {...big}>
          <feGaussianBlur stdDeviation={s.size * W * 0.55} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>,
      );
    }
    body.push(drawStrokeEl(s, i, W, H, ids));
  });
  return { defs, body };
}
function paintComposerStroke(ctx, s, W, H, ox, oy, sc) {
  if (!s.points || !s.points.length) return;
  const look = DRAW_LOOK[s.b] || DRAW_LOOK.pen;
  const w = s.size * W * sc * look.w;
  const path = () => {
    ctx.beginPath();
    s.points.forEach((pt, i) => { const x = pt[0] * W * sc - ox; const y = pt[1] * H * sc - oy; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
    if (s.points.length === 1) ctx.lineTo(s.points[0][0] * W * sc - ox + 0.1, s.points[0][1] * H * sc - oy);
  };
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = look.cap;
  ctx.lineWidth = w;
  if (s.b === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000000';
    path();
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.globalAlpha = look.op;
  ctx.strokeStyle = s.color;
  if (s.b === 'neon') {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = w * 1.3;
    path();
    ctx.stroke();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = w * 0.36;
    path();
    ctx.stroke();
  } else {
    path();
    ctx.stroke();
  }
  ctx.restore();
}

function softBlur(src, cell) {
  const w = src.width;
  const h = src.height;
  const tw = Math.max(2, Math.round(w / cell));
  const th = Math.max(2, Math.round(h / cell));
  const make = (cw, ch) => { const c = document.createElement('canvas'); c.width = Math.max(1, cw); c.height = Math.max(1, ch); const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; return [c, x]; };
  let cur = src;
  while (cur.width / 2 > tw * 1.5) { const [n, nx] = make(Math.round(cur.width / 2), Math.round(cur.height / 2)); nx.drawImage(cur, 0, 0, n.width, n.height); cur = n; }
  const [t, tx] = make(tw, th);
  tx.drawImage(cur, 0, 0, tw, th);
  const [m, mx] = make(Math.min(w, tw * 4), Math.min(h, th * 4));
  mx.drawImage(t, 0, 0, m.width, m.height);
  const [out, ox] = make(w, h);
  ox.drawImage(m, 0, 0, w, h);
  return out;
}
function blurBaseFrom(img, filter) {
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const k = Math.min(1, 1000 / Math.max(1, nw, nh));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(nw * k));
  c.height = Math.max(1, Math.round(nh * k));
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, c.width, c.height);
  if (filter && filter !== 'none') applyPhotoFilter(x, c.width, c.height, filter);
  return softBlur(c, Math.max(4, c.width / 26));
}
function blurShapes(ctx, list, live, sx, sy, ox, oy) {
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  (live ? [...list, live] : list).forEach((b) => {
    if (b.t === 'f') {
      if (!b.on) return;
      ctx.beginPath();
      ctx.ellipse((b.x + b.w / 2) * sx - ox, (b.y + b.h / 2) * sy - oy, (b.w / 2) * sx * 1.2, (b.h / 2) * sy * 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    const pts = b.pts || [];
    if (!pts.length) return;
    ctx.lineWidth = Math.max(1, b.size * sx);
    ctx.beginPath();
    pts.forEach((p, i) => { const X = p[0] * sx - ox; const Y = p[1] * sy - oy; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    if (pts.length === 1) ctx.lineTo(pts[0][0] * sx - ox + 0.1, pts[0][1] * sy - oy);
    ctx.stroke();
  });
}
function paintBlurLayer(ctx, mask, list, live, base, sx, sy, ox, oy) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  if (mask.width !== w || mask.height !== h) { mask.width = w; mask.height = h; }
  const mx = mask.getContext('2d');
  mx.globalCompositeOperation = 'source-over';
  mx.clearRect(0, 0, w, h);
  blurShapes(mx, list, live, sx, sy, ox, oy);
  mx.globalCompositeOperation = 'source-in';
  mx.drawImage(base, 0, 0, w, h);
  mx.globalCompositeOperation = 'source-over';
  ctx.drawImage(mask, 0, 0);
}
function bakeBlurs(ctx, item, W, H, ox, oy, scale) {
  const list = (item.blurs || []).filter((b) => b.t !== 'f' || b.on);
  if (!list.length) return;
  const cv = ctx.canvas;
  const base = softBlur(cv, Math.max(4, (W * scale) / 26));
  paintBlurLayer(ctx, document.createElement('canvas'), list, null, base, W * scale, H * scale, ox, oy);
}
const faceApi = { off: false };
function faceFinderOk() { return !faceApi.off && typeof window !== 'undefined' && typeof window.FaceDetector === 'function'; }
async function detectFacesIn(url) {
  if (!faceFinderOk()) return null;
  try {
    const img = await loadImageElement(url);
    const k = Math.min(1, 1600 / Math.max(1, img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * k));
    c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const det = new window.FaceDetector({ fastMode: false, maxDetectedFaces: 30 });
    const list = await det.detect(c);
    return (list || []).map((f) => f && f.boundingBox).filter((b) => b && b.width > 2 && b.height > 2).map((b) => ({ x: b.x / c.width, y: b.y / c.height, w: b.width / c.width, h: b.height / c.height }));
  } catch { return null; }
}
function BlurFaceIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" strokeDasharray="2.6 2.4" />
      <circle cx="9.3" cy="10.4" r="0.6" fill={color} /><circle cx="14.7" cy="10.4" r="0.6" fill={color} />
      <path d="M9.2 14.6c1.6 1.2 4 1.2 5.6 0" />
    </svg>
  );
}
let memeMeasure = null;
function memeLinesFit(text, size, maxW) {
  if (!memeMeasure) { try { memeMeasure = document.createElement('canvas').getContext('2d'); } catch {} }
  const c = memeMeasure;
  if (!c) return { lines: [text], fits: true };
  c.font = `400 ${size * 1000}px ${MEME_FONT}`;
  const lines = memeWrap(c, text, maxW * 1000);
  return { lines, fits: lines.every((l) => c.measureText(l).width <= maxW * 1000) };
}
function memeFitLayer(text, r, W, H) {
  const aspect = H / Math.max(1, W);
  const maxW = 0.92 * r.w;
  const regionH = r.h * aspect;
  let size = Math.min(r.w * 0.13, regionH * 0.15);
  let got = memeLinesFit(text, size, maxW);
  for (let i = 0; i < 34; i++) {
    if (got.lines.length <= 3 && got.lines.length * size * 1.08 <= regionH * 0.3 && got.fits) break;
    size *= 0.92;
    got = memeLinesFit(text, size, maxW);
  }
  return { size, w: maxW, lines: got.lines, hn: (got.lines.length * size * 1.08) / aspect };
}

function strokeToPath(points, W, H) {
  if (!points || !points.length) return '';
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${(p[0] * W).toFixed(1)} ${(p[1] * H).toFixed(1)}`).join(' ');
  return points.length === 1 ? `${d} l0.1 0` : d;
}
const layerHintsSeen = new Set();
function stickerWithPos(s) {
  if (!s || s.k === 'moment') return s;
  return layerPosOf(s.pos) ? s : { ...s, pos: { x: 0.5, y: 0.5, s: 1, r: 0 } };
}
const LAYER_COLORS = ['#FFFFFF', '#111111', '#7C5CFC', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#2E7CF6', '#5AC8FA', '#AF52DE', '#FF2D92', '#FFD6E7', '#C9F4D6', '#FFE9A8'];
const TEXT_LAYER_FONTS = [
  { k: 'classic', label: 'Classic', family: FONT, weight: 800, lh: 1.2 },
  { k: 'modern', label: 'Modern', family: '"Fredoka", system-ui, sans-serif', weight: 500, lh: 1.2 },
  { k: 'neon', label: 'Neon', family: '"Righteous", system-ui, sans-serif', weight: 400, lh: 1.24, neon: true },
  { k: 'type', label: 'Typewriter', family: '"Special Elite", "Courier New", monospace', weight: 400, lh: 1.26 },
  { k: 'strong', label: 'Strong', family: '"Bebas Neue", Impact, "Arial Narrow", sans-serif', weight: 400, lh: 1.12 },
  { k: 'script', label: 'Script', family: '"Pacifico", "Brush Script MT", cursive', weight: 400, lh: 1.42 },
  { k: 'marker', label: 'Marker', family: '"Permanent Marker", "Comic Sans MS", cursive', weight: 400, lh: 1.24 },
  { k: 'serif', label: 'Elegant', family: '"Playfair Display", Georgia, serif', weight: 500, lh: 1.22, italic: true },
  { k: 'meme', label: 'Meme', family: 'Anton, Impact, "Arial Black", sans-serif', weight: 400, lh: 1.08, meme: true },
];
const TEXT_LAYER_BGS = ['none', 'solid', 'soft'];
const TEXT_LAYER_ALIGNS = ['center', 'left', 'right'];
const textLayerStyle = { font: 'classic', bg: 'none', align: 'center', color: '#FFFFFF' };
function textLayerFontOf(t) {
  return TEXT_LAYER_FONTS.find((f) => f.k === (t && t.font)) || TEXT_LAYER_FONTS[0];
}
function textLayerCanvasFont(f, px) {
  return `${f.italic ? 'italic ' : ''}${f.weight} ${Math.max(1, px)}px ${f.family}`;
}
function hexToWhite(hex, k) {
  const [r, g, b] = hexRgb(hex).map((v) => Math.round(v + (255 - v) * k));
  return `rgb(${r}, ${g}, ${b})`;
}
function textLayerLook(t, F) {
  const f = textLayerFontOf(t);
  const color = /^#[0-9a-f]{6}$/i.test(String(t.color || '')) ? t.color : '#FFFFFF';
  const bg = TEXT_LAYER_BGS.includes(t.bg) ? t.bg : 'none';
  const look = { f, F, L: F * f.lh, padX: F * 0.32, rad: F * 0.3, align: TEXT_LAYER_ALIGNS.includes(t.align) ? t.align : 'center', box: null, ink: color, glow: null, shade: false };
  if (bg === 'solid') { look.box = color; look.ink = hexLum(color) > 0.5 ? '#111111' : '#FFFFFF'; }
  else if (bg === 'soft') look.box = 'rgba(14, 14, 18, 0.52)';
  if (f.neon && bg !== 'solid') { look.glow = color; look.ink = hexToWhite(color, 0.72); }
  if (bg === 'none' && !look.glow) look.shade = true;
  if (f.meme) { look.box = null; look.glow = null; look.shade = false; look.ink = color; look.edge = hexLum(color) < 0.12 ? '#FFFFFF' : '#000000'; look.padX = F * 0.12; }
  return look;
}
function textLayerLines(t) {
  const text = String((t && t.text) || '');
  if (Array.isArray(t.lines) && t.lines.length && t.lines.every((x) => typeof x === 'string') && t.lines.join('').replace(/\s+/g, '') === text.replace(/\s+/g, '')) return t.lines;
  return text.split('\n');
}
function textLineCorners(lines, lefts, widths, rad) {
  const out = lines.map(() => [rad, rad, rad, rad]);
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i] || !lines[i + 1]) continue;
    const dl = lefts[i + 1] - lefts[i];
    if (Math.abs(dl) < rad) { out[i][3] = 0; out[i + 1][0] = 0; } else if (dl > 0) out[i + 1][0] = 0; else out[i][3] = 0;
    const dr = (lefts[i] + widths[i]) - (lefts[i + 1] + widths[i + 1]);
    if (Math.abs(dr) < rad) { out[i][2] = 0; out[i + 1][1] = 0; } else if (dr > 0) out[i + 1][1] = 0; else out[i][2] = 0;
  }
  return out;
}
let textMeasureCtx = null;
function textLayerBoxes(t, F, ctx) {
  const look = textLayerLook(t, F);
  const lines = textLayerLines(t);
  let c = ctx;
  if (!c) { if (!textMeasureCtx) { try { textMeasureCtx = document.createElement('canvas').getContext('2d'); } catch {} } c = textMeasureCtx; }
  if (c) c.font = textLayerCanvasFont(look.f, F);
  const widths = lines.map((ln) => (ln ? (c ? c.measureText(ln).width : ln.length * F * 0.55) : 0));
  const boxW = widths.map((w) => (w ? w + look.padX * 2 : 0));
  const B = Math.max(F * 0.6, ...boxW);
  const lefts = boxW.map((bw) => (look.align === 'left' ? 0 : look.align === 'right' ? B - bw : (B - bw) / 2));
  return { look, lines, boxW, B, H: Math.max(1, lines.length) * look.L, lefts, corners: textLineCorners(lines, lefts, boxW, look.rad) };
}
function textPillPath(bx) {
  const L = bx.look.L;
  let d = '';
  bx.lines.forEach((ln, i) => {
    if (!ln) return;
    const lift = i && bx.lines[i - 1] ? 0.6 : 0;
    const x = bx.lefts[i];
    const y = i * L - lift;
    const w = bx.boxW[i];
    const h = L + lift;
    const [tl, tr, br, bl] = bx.corners[i].map((r) => Math.max(0, Math.min(r, w / 2, h / 2)));
    const f = (n) => Math.round(n * 100) / 100;
    d += `M${f(x + tl)} ${f(y)}H${f(x + w - tr)}${tr ? `A${f(tr)} ${f(tr)} 0 0 1 ${f(x + w)} ${f(y + tr)}` : ''}V${f(y + h - br)}${br ? `A${f(br)} ${f(br)} 0 0 1 ${f(x + w - br)} ${f(y + h)}` : ''}H${f(x + bl)}${bl ? `A${f(bl)} ${f(bl)} 0 0 1 ${f(x)} ${f(y + h - bl)}` : ''}V${f(y + tl)}${tl ? `A${f(tl)} ${f(tl)} 0 0 1 ${f(x + tl)} ${f(y)}` : ''}Z`;
  });
  return d;
}
function textLayerShadow(look) {
  const F = look.F;
  if (look.glow) return `0 0 ${F * 0.05}px rgba(255, 255, 255, 0.85), 0 0 ${F * 0.18}px ${look.glow}, 0 0 ${F * 0.42}px ${look.glow}, 0 0 ${F * 0.85}px ${look.glow}`;
  if (look.shade) return `0 ${F * 0.03}px ${F * 0.25}px rgba(0, 0, 0, 0.45)`;
  return 'none';
}
function TextLayerBody({ t, F, placeholder }) {
  const bx = textLayerBoxes(t, F);
  const { look } = bx;
  const shadow = textLayerShadow(look);
  const font = { fontFamily: look.f.family, fontWeight: look.f.weight, fontStyle: look.f.italic ? 'italic' : 'normal', fontSize: F, letterSpacing: 'normal' };
  if (placeholder && !String(t.text || '').trim()) {
    return <div style={{ ...font, lineHeight: `${look.L}px`, whiteSpace: 'pre', color: look.ink, opacity: 0.55, textShadow: shadow, padding: `0 ${look.padX}px`, borderRadius: look.rad, background: look.box || 'transparent' }}>{placeholder}</div>;
  }
  return (
    <div style={{ position: 'relative', width: bx.B, height: bx.H }}>
      {look.box && <svg width={bx.B} height={bx.H} viewBox={`0 0 ${bx.B} ${bx.H}`} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}><path d={textPillPath(bx)} fill={look.box} /></svg>}
      {look.edge && bx.lines.map((ln, i) => (ln ? <div key={`e${i}`} aria-hidden="true" style={{ ...font, position: 'absolute', left: bx.lefts[i], top: i * look.L, width: bx.boxW[i], height: look.L, lineHeight: `${look.L}px`, textAlign: 'center', whiteSpace: 'pre', color: look.edge, WebkitTextStroke: `${F * 0.16}px ${look.edge}` }}>{ln}</div> : null))}
      {bx.lines.map((ln, i) => (ln ? <div key={i} style={{ ...font, position: 'absolute', left: bx.lefts[i], top: i * look.L, width: bx.boxW[i], height: look.L, lineHeight: `${look.L}px`, textAlign: 'center', whiteSpace: 'pre', color: look.ink, textShadow: shadow }}>{ln}</div> : null))}
    </div>
  );
}
function paintTextLayer(ctx, t, F, cx, cy) {
  if (!String(t.text || '').trim() || F <= 0) return;
  const bx = textLayerBoxes(t, F, ctx);
  const { look } = bx;
  ctx.save();
  ctx.translate(cx, cy);
  if (t.r) ctx.rotate((t.r * Math.PI) / 180);
  ctx.translate(-bx.B / 2, -bx.H / 2);
  if (look.box) {
    ctx.fillStyle = look.box;
    let drawn = false;
    if (typeof Path2D !== 'undefined') { try { ctx.fill(new Path2D(textPillPath(bx))); drawn = true; } catch {} }
    if (!drawn) bx.lines.forEach((ln, i) => { if (ln) ctx.fillRect(bx.lefts[i], i * look.L, bx.boxW[i], look.L + 0.6); });
  }
  ctx.font = textLayerCanvasFont(look.f, F);
  ctx.textAlign = 'center';
  bx.lines.forEach((ln, i) => {
    if (!ln) return;
    const x = bx.lefts[i] + bx.boxW[i] / 2;
    const top = i * look.L;
    const tm = ctx.measureText(ln);
    let y;
    if (Number.isFinite(tm.fontBoundingBoxAscent) && Number.isFinite(tm.fontBoundingBoxDescent)) { ctx.textBaseline = 'alphabetic'; y = top + (look.L - (tm.fontBoundingBoxAscent + tm.fontBoundingBoxDescent)) / 2 + tm.fontBoundingBoxAscent; }
    else { ctx.textBaseline = 'middle'; y = top + look.L / 2; }
    if (look.glow) {
      ctx.shadowColor = look.glow;
      ctx.fillStyle = look.glow;
      [0.85, 0.42].forEach((b) => { ctx.shadowBlur = F * b; ctx.fillText(ln, x, y); });
      ctx.shadowBlur = F * 0.18;
      ctx.fillStyle = look.ink;
      ctx.fillText(ln, x, y);
      ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowBlur = F * 0.05;
      ctx.fillText(ln, x, y);
    } else {
      if (look.shade) { ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'; ctx.shadowBlur = F * 0.25; ctx.shadowOffsetY = F * 0.03; }
      else { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
      if (look.edge) { ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.lineWidth = F * 0.16; ctx.strokeStyle = look.edge; ctx.strokeText(ln, x, y); }
      ctx.fillStyle = look.ink;
      ctx.fillText(ln, x, y);
    }
  });
  ctx.restore();
}
async function loadTextLayerFonts(texts) {
  try {
    if (!texts || !texts.length || !document.fonts || !document.fonts.load) return;
    const want = new Set(texts.map((t) => textLayerCanvasFont(textLayerFontOf(t), 40)));
    await Promise.race([Promise.all([...want].map((f) => document.fonts.load(f).catch(() => null))), new Promise((r) => setTimeout(r, 2500))]);
  } catch {}
}
function readWrappedLines(el) {
  const node = el && el.firstChild;
  const text = node && node.nodeType === 3 ? node.textContent : '';
  if (!text) return [''];
  const out = [];
  const range = document.createRange();
  let line = '';
  let top = null;
  let i = 0;
  while (i < text.length) {
    const cp = text.codePointAt(i);
    const len = cp > 0xffff ? 2 : 1;
    const ch = text.slice(i, i + len);
    if (ch === '\n') { out.push(line.replace(/\s+$/, '')); line = ''; top = null; i += len; continue; }
    range.setStart(node, i);
    range.setEnd(node, i + len);
    const rects = range.getClientRects();
    const rt = rects.length ? rects[0].top : null;
    if (rt != null && top != null && rt > top + 2) { out.push(line.replace(/\s+$/, '')); line = ch; }
    else line += ch;
    if (rt != null) top = rt;
    i += len;
  }
  out.push(line.replace(/\s+$/, ''));
  return out;
}
function roundLayerPos(p) {
  const q = layerPosOf(p);
  if (!q) return undefined;
  return { x: Math.round(q.x * 10000) / 10000, y: Math.round(q.y * 10000) / 10000, s: Math.round(q.s * 1000) / 1000, r: Math.round(q.r * 10) / 10 };
}
function normDeg(d) {
  let x = d % 360;
  if (x > 180) x -= 360;
  if (x < -180) x += 360;
  return x;
}

function paintEdits(ctx, item, W, H, offsetX, offsetY, scale, stickerImages = {}) {
  (item.stickers || []).forEach((st) => {
    const img = stickerImages[st.id];
    if (!img || !img.naturalWidth) return;
    const w = st.size * W * scale;
    const h = w * (img.naturalHeight / img.naturalWidth);
    ctx.save();
    ctx.translate(st.x * W * scale - offsetX, st.y * H * scale - offsetY);
    if (st.r) ctx.rotate((st.r * Math.PI) / 180);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  });
  if (item.strokes.length) {
    let layer = null;
    let lc = ctx;
    if (item.strokes.some((s) => s.b === 'erase')) {
      layer = document.createElement('canvas');
      layer.width = ctx.canvas.width;
      layer.height = ctx.canvas.height;
      lc = layer.getContext('2d');
      try { lc.setTransform(ctx.getTransform()); } catch {}
    }
    item.strokes.forEach((s) => paintComposerStroke(lc, s, W, H, offsetX, offsetY, scale));
    if (layer) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.restore();
    }
  }
  item.texts.forEach((t) => paintTextLayer(ctx, t, t.size * W * scale, t.x * W * scale - offsetX, t.y * H * scale - offsetY));
}

async function loadStickerImages(item) {
  const out = {};
  for (const st of item.stickers || []) {
    try { out[st.id] = await loadImageElement(st.src); } catch {}
  }
  return out;
}

async function exportEditedImage(item, hd, maxSide) {
  const hasEdits = item.crop || item.texts.length || item.strokes.length || (item.stickers || []).length || (item.filter && item.filter !== 'none') || (item.blurs || []).some((b) => b.t !== 'f' || b.on);
  if (!hasEdits) return prepareImageFile(item.file, item.url, hd, maxSide);
  await loadTextLayerFonts(item.texts);
  const img = await loadImageElement(item.url);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const c = item.crop || { x: 0, y: 0, w: 1, h: 1 };
  const rw = c.w * W;
  const rh = c.h * H;
  const chatCap = !hd && maxSide ? (dataSaverOn() ? Math.min(maxSide, 1280) : maxSide) : 0;
  const scale = Math.min(1, (hd ? 4096 : chatCap || (dataSaverOn() ? 1600 : 2560)) / Math.max(rw, rh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rw * scale));
  canvas.height = Math.max(1, Math.round(rh * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, c.x * W, c.y * H, rw, rh, 0, 0, canvas.width, canvas.height);
  if (item.filter && item.filter !== 'none') applyPhotoFilter(ctx, canvas.width, canvas.height, item.filter);
  if ((item.blurs || []).length) bakeBlurs(ctx, item, W, H, c.x * W * scale, c.y * H * scale, scale);
  paintEdits(ctx, item, W, H, c.x * W * scale, c.y * H * scale, scale, await loadStickerImages(item));
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', hd ? 0.95 : chatCap ? (dataSaverOn() ? 0.74 : 0.82) : dataSaverOn() ? 0.78 : 0.9));
  return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : item.file;
}

async function exportVideoOverlay(item) {
  if (!item.texts.length && !item.strokes.length && !(item.stickers || []).length) return null;
  if (!item.width || !item.height) return null;
  await loadTextLayerFonts(item.texts);
  const scale = Math.min(1, 1280 / Math.max(item.width, item.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(item.width * scale);
  canvas.height = Math.round(item.height * scale);
  paintEdits(canvas.getContext('2d'), item, item.width, item.height, 0, 0, scale, await loadStickerImages(item));
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  return blob ? new File([blob], 'overlay.png', { type: 'image/png' }) : null;
}

function useVisualKeyboard(on) {
  const [kb, setKb] = useState({ lift: 0, top: 0 });
  useEffect(() => {
    if (!on) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    let f = 0;
    const up = () => {
      cancelAnimationFrame(f);
      f = requestAnimationFrame(() => {
        const lift = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        const top = Math.max(0, Math.round(vv.offsetTop));
        setKb((p) => (p.lift === lift && p.top === top ? p : { lift, top }));
      });
    };
    vv.addEventListener('resize', up);
    vv.addEventListener('scroll', up);
    up();
    return () => { cancelAnimationFrame(f); vv.removeEventListener('resize', up); vv.removeEventListener('scroll', up); };
  }, [on]);
  return kb;
}
function AlignGlyph({ align }) {
  const rows = [16, 10, 16, 12];
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
      {rows.map((w, i) => { const y = 6 + i * 4; const x1 = align === 'left' ? 4 : align === 'right' ? 20 - w : 12 - w / 2; return <line key={i} x1={x1} y1={y} x2={x1 + w} y2={y} />; })}
    </svg>
  );
}
function TextBgGlyph({ mode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {mode === 'solid' && <rect x="3" y="3" width="18" height="18" rx="5.5" fill="currentColor" />}
      {mode === 'soft' && <rect x="3" y="3" width="18" height="18" rx="5.5" fill="currentColor" fillOpacity="0.42" />}
      {(!mode || mode === 'none') && <rect x="3.9" y="3.9" width="16.2" height="16.2" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />}
      <text x="12" y="16.6" textAnchor="middle" fontSize="12.5" fontWeight="800" fontFamily={FONT} fill={mode === 'solid' ? '#111111' : 'currentColor'}>A</text>
    </svg>
  );
}
function EditorSizeRail({ value, min, max, onChange, label = 'Text size' }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const H = 214;
  const set = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const v = 1 - Math.max(0, Math.min(1, (e.clientY - r.top - 10) / Math.max(1, r.height - 20)));
    onChange(min + v * (max - min));
  };
  return (
    <div ref={ref} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(t * 100)}
      onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setOn(true); set(e); }}
      onPointerMove={(e) => { if (on) set(e); }}
      onPointerUp={() => setOn(false)} onPointerCancel={() => setOn(false)} onClick={(e) => e.stopPropagation()}
      style={{ position: 'absolute', left: 6, top: '50%', width: 40, height: H, marginTop: -H / 2, touchAction: 'none', cursor: 'ns-resize', zIndex: 3 }}>
      <svg width="40" height={H} viewBox={`0 0 40 ${H}`} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        <path d={`M15.5 10 Q20 6 24.5 10 L21.2 ${H - 10} Q20 ${H - 8} 18.8 ${H - 10} Z`} fill="rgba(255, 255, 255, 0.38)" />
      </svg>
      <div style={{ position: 'absolute', left: 8, top: 10 + (1 - t) * (H - 20) - 12, width: 24, height: 24, borderRadius: '50%', background: '#FFFFFF', boxShadow: on ? '0 0 0 7px rgba(29,123,240,0.38), 0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.32)', transition: 'box-shadow 0.15s ease' }} />
    </div>
  );
}
function StudioTileGrid({ options, value, onChange, label, cols = 4, ratio = 1, gap = 10, ringBg, radius = 14 }) {
  const { theme } = useTheme();
  const ring = ringBg || theme.panelBg;
  const line = theme.dark ? 'rgba(255,255,255,0.13)' : 'rgba(17,17,19,0.09)';
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: gap, rowGap: 14, padding: '6px 2px 8px' }}>
      {options.map((o) => {
        const on = value === o.k;
        return (
          <div key={o.k} role="radio" aria-checked={on} aria-label={o.aria || o.label} onClick={() => { hapticTap(); onChange(o.k); }} className="zchat-press"
            style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: String(ratio), borderRadius: radius, background: o.bg || (theme.dark ? '#1F1E25' : '#F1F0F6'), boxShadow: on ? `0 0 0 2px ${ring}, 0 0 0 4px ${theme.coral}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: on ? kitOnInk(theme) : theme.ink2, transition: 'box-shadow 160ms ease, color 160ms ease' }}>
              {typeof o.art === 'function' ? o.art(on) : o.art}
              {!on && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: radius, boxShadow: `inset 0 0 0 1px ${line}`, pointerEvents: 'none' }} />}
            </div>
            {o.label && <div style={{ marginTop: 7, width: '100%', fontSize: 12.5, lineHeight: 1.2, fontWeight: on ? 700 : 600, color: on ? kitOnInk(theme) : theme.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{o.label}</div>}
          </div>
        );
      })}
    </div>
  );
}
export function TextLayerEditor({ draft, onChange, onLines, onDone, innerW, frameW, areaW }) {
  const taRef = useRef(null);
  const mirrorRef = useRef(null);
  const openedAt = useRef(Date.now());
  const kb = useVisualKeyboard(true);
  const { theme } = useTheme();
  const [lines, setLines] = useState(() => textLayerLines(draft));
  const f = textLayerFontOf(draft);
  const iw = Math.max(1, innerW);
  const wPx = Math.max(40, (draft.w || (0.86 * frameW) / iw) * iw);
  const k = Math.min(1, Math.max(0.2, (Math.max(160, areaW) - 76) / wPx));
  const F = Math.max(6, draft.size * iw * k);
  const W = wPx * k;
  const look = textLayerLook(draft, F);
  useEffect(() => {
    ensureTextFonts();
    const ta = taRef.current;
    if (!ta) return;
    try { ta.focus({ preventScroll: true }); const n = ta.value.length; ta.setSelectionRange(n, n); } catch {}
  }, []);
  useLayoutEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = '0px'; ta.style.height = `${Math.max(Math.ceil(look.L), ta.scrollHeight)}px`; }
    const next = readWrappedLines(mirrorRef.current);
    if (onLines) onLines(next);
    setLines((prev) => (prev.length === next.length && prev.every((x, i) => x === next[i]) ? prev : next));
  });
  const keep = (e) => e.preventDefault();
  const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];
  const fontCss = { fontFamily: f.family, fontWeight: f.weight, fontStyle: f.italic ? 'italic' : 'normal', fontSize: F, lineHeight: `${look.L}px`, letterSpacing: 'normal', wordSpacing: 'normal', textIndent: 0, textTransform: 'none' };
  const wrapCss = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'normal', textAlign: look.align };
  const sizeFrame = (draft.size * iw) / Math.max(1, frameW);
  const roundBtn = (label, onClick, child, active) => (
    <div role="button" aria-label={label} aria-pressed={active ? true : undefined} onPointerDown={keep} onClick={onClick} className="zchat-press"
      style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF', background: active ? 'rgba(29,123,240,0.9)' : 'rgba(255, 255, 255, 0.14)', flexShrink: 0 }}>{child}</div>
  );
  const bodyPos = look.align === 'left' ? { left: 0 } : look.align === 'right' ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };
  return (
    <div onClick={() => { if (Date.now() - openedAt.current > 400) onDone(); }} className="zchat-fade"
      style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(8, 8, 12, 0.6)', backdropFilter: GLASS_OK ? 'blur(5px)' : undefined, WebkitBackdropFilter: GLASS_OK ? 'blur(5px)' : undefined, fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, top: kb.top, padding: 'calc(10px + env(safe-area-inset-top)) 12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        {roundBtn(`Align text ${cycle(TEXT_LAYER_ALIGNS, look.align)}`, () => onChange({ align: cycle(TEXT_LAYER_ALIGNS, look.align) }), <AlignGlyph align={look.align} />)}
        {roundBtn(draft.bg === 'solid' ? 'Text background solid' : draft.bg === 'soft' ? 'Text background soft' : 'Text background off', () => onChange({ bg: cycle(TEXT_LAYER_BGS, TEXT_LAYER_BGS.includes(draft.bg) ? draft.bg : 'none') }), <TextBgGlyph mode={draft.bg} />, draft.bg === 'solid' || draft.bg === 'soft')}
        <div aria-live="polite" style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: 'rgba(255, 255, 255, 0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
        <div role="button" aria-label="Done" onPointerDown={keep} onClick={onDone} className="zchat-press" style={{ height: 38, padding: '0 20px', borderRadius: 19, background: theme.coral, color: '#FFFFFF', fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)' }}>Done</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: `calc(${kb.top + 62}px + env(safe-area-inset-top))`, bottom: kb.lift + 118, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <EditorSizeRail value={sizeFrame} min={0.035} max={0.24} onChange={(v) => onChange({ size: (v * Math.max(1, frameW)) / iw })} />
        <div onClick={(e) => { e.stopPropagation(); if (taRef.current && document.activeElement !== taRef.current) taRef.current.focus({ preventScroll: true }); }} style={{ position: 'relative', width: W, maxHeight: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, pointerEvents: 'none', ...bodyPos }}><TextLayerBody t={{ ...draft, lines }} F={F} placeholder="Type something" /></div>
          <div ref={mirrorRef} aria-hidden="true" style={{ ...fontCss, ...wrapCss, position: 'absolute', left: 0, top: 0, width: W, padding: `0 ${look.padX}px`, boxSizing: 'border-box', visibility: 'hidden', pointerEvents: 'none' }}>{draft.text}</div>
          <textarea ref={taRef} value={draft.text} rows={1} aria-label="Your text" spellCheck={false} autoCapitalize="sentences" enterKeyHint="enter"
            onChange={(e) => onChange({ text: e.target.value.slice(0, 300) })}
            style={{ ...fontCss, ...wrapCss, position: 'relative', display: 'block', width: W, minHeight: look.L, padding: `0 ${look.padX}px`, margin: 0, boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'none', overflow: 'hidden', background: 'transparent', color: 'transparent', WebkitTextFillColor: 'transparent', caretColor: look.glow ? '#FFFFFF' : look.ink, WebkitAppearance: 'none', appearance: 'none', borderRadius: 0, WebkitTapHighlightColor: 'transparent' }} />
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, bottom: kb.lift, paddingBottom: kb.lift ? 10 : 'calc(12px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '6px 16px 12px', scrollbarWidth: 'none' }}>
          {LAYER_COLORS.map((c) => {
            const on = String(draft.color).toUpperCase() === c;
            return <div key={c} role="button" aria-label={`Text color ${c}`} aria-pressed={on} onPointerDown={keep} onClick={() => onChange({ color: c })} style={{ width: 26, height: 26, borderRadius: '50%', background: c, flexShrink: 0, cursor: 'pointer', boxShadow: on ? '0 0 0 2.5px rgba(8, 8, 12, 0.9), 0 0 0 4.5px #FFFFFF' : 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.34), 0 1px 3px rgba(0, 0, 0, 0.3)', transition: 'box-shadow 160ms ease' }} />;
          })}
        </div>
        <div role="radiogroup" aria-label="Font" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 16px 2px', scrollbarWidth: 'none' }}>
          {TEXT_LAYER_FONTS.map((ff) => {
            const on = ff.k === f.k;
            return (
              <div key={ff.k} role="button" aria-label={`Font ${ff.label}`} aria-pressed={on} onPointerDown={keep} onClick={() => onChange({ font: ff.k })} className="zchat-press"
                style={{ flexShrink: 0, width: 46, height: 46, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#FFFFFF' : 'rgba(255, 255, 255, 0.1)', boxShadow: on ? '0 2px 10px rgba(0, 0, 0, 0.35)' : 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)', color: on ? '#111114' : '#FFFFFF', fontFamily: ff.family, fontWeight: ff.weight, fontStyle: ff.italic ? 'italic' : 'normal', fontSize: ff.k === 'strong' ? 23 : ff.k === 'script' ? 16 : 18, lineHeight: 1, textShadow: ff.neon ? (on ? '0 0 6px rgba(29,123,240,0.75)' : '0 0 8px rgba(190, 168, 255, 0.95)') : 'none', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'background 160ms ease, color 160ms ease' }}>Aa</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MediaComposer({ files, recipientName, onCancel, onSend: onSendBase, onActivity, mode: composerMode = 'chat', mentionGroups = [], myId, privacyCtx, onceDefault, hiddenDefault, initialSticker, country, draft = null, albumCtx = null, startMeme = false, sharedTo = null, initialSong = null }) {
  const requestCloseRef = useRef(onCancel);
  useBackClose(true, () => requestCloseRef.current());
  const { theme } = useTheme();
  const [items, setItems] = useState(() => files.map((f, i) => {
    const d = draft && Array.isArray(draft.items) ? draft.items[i] : null;
    return {
      id: `${Date.now()}-${i}`, kind: (f.type || '').startsWith('video') ? 'video' : 'image', file: f, url: URL.createObjectURL(f),
      width: (d && d.width) || 0, height: (d && d.height) || 0, duration: (d && d.duration) || 0, crop: (d && d.crop) || null,
      texts: d && Array.isArray(d.texts) ? d.texts : [], strokes: d && Array.isArray(d.strokes) ? d.strokes : [], stickers: d && Array.isArray(d.stickers) ? d.stickers : [],
      trimStart: (d && d.trimStart) || 0, trimEnd: d && d.trimEnd != null ? d.trimEnd : null, filter: (d && d.filter) || 'none',
      blurs: d && Array.isArray(d.blurs) ? d.blurs : [],
    };
  }));
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState('view');
  const [caption, setCaption] = useState(() => (draft && draft.caption) || '');
  const [scheduleAt, setScheduleAt] = useState(null);
  const [schedOpen, setSchedOpen] = useState(false);
  const [askClose, setAskClose] = useState(false);
  const [draftNote, setDraftNote] = useState('');
  const [once, setOnce] = useState(!!onceDefault);
  const [hd, setHd] = useState(false);
  const [hideIt, setHideIt] = useState(!!hiddenDefault && !onceDefault);
  const [markSens, setMarkSens] = useState(() => !!(draft && draft.sensitive));
  const [sensColOk, setSensColOk] = useState(() => postSensCol.ok !== false);
  const [album, setAlbum] = useState(null);
  const [albumPick, setAlbumPick] = useState(false);
  const [sending, setSending] = useState(false);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [draftCrop, setDraftCrop] = useState(null);
  const [cropAspect, setCropAspect] = useState(null);
  const [brushColor, setBrushColor] = useState('#FF3B30');
  const [brushSize, setBrushSize] = useState(8);
  const [brushKind, setBrushKind] = useState('pen');
  const [textDraft, setTextDraft] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [mentions, setMentions] = useState(() => (draft && Array.isArray(draft.mentions) ? draft.mentions : []));
  const [place, setPlace] = useState(() => (draft && validPlace(draft.place)) || null);
  const [placePick, setPlacePick] = useState(false);
  const [storyAud, setStoryAud] = useState(null);
  const [audOpen, setAudOpen] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [dragKey, setDragKey] = useState(null);
  const [, setFontTick] = useState(0);
  const [layerHint, setLayerHint] = useState('');
  const [blurSize, setBlurSize] = useState(34);
  const [faceNote, setFaceNote] = useState('');
  const [faceBusy, setFaceBusy] = useState(false);
  const [meme, setMeme] = useState({ top: '', bot: '' });
  const blurCanvasRef = useRef(null);
  const blurMaskRef = useRef(null);
  const blurBaseRef = useRef({ key: '', cv: null });
  const blurLiveRef = useRef(null);
  const blurDragRef = useRef(null);
  const blurHistRef = useRef([]);
  const [restyle, setRestyle] = useState(false);
  const isStory = composerMode === 'story';
  const isPost = composerMode === 'post';
  useEffect(() => {
    if (!isPost) return undefined;
    let alive = true;
    postSensColumnReady().then((ok) => { if (alive && !ok) { setSensColOk(false); setMarkSens(false); } });
    return () => { alive = false; };
  }, []);
  const [storySticker, setStorySticker] = useState(() => { const s0 = validStorySticker(initialSticker || (draft && draft.sticker)); return s0 ? stickerWithPos(s0) : null; });
  const [stickerEdit, setStickerEdit] = useState(false);
  const [storySong, setStorySong] = useState(() => (draft && draft.song && validSong(draft.song) ? draft.song : (composerMode === 'story' && initialSong && validSong(initialSong)) || null));
  const [musicPick, setMusicPick] = useState(false);
  const [railMore, setRailMore] = useState(false);
  const songPlayingId = useSongPlaying();
  useEffect(() => { if (isStory || isPost) prefetchMusic(country); return () => stopSong(); }, []);
  const postSongOk = isPost && items.length > 0 && items.every((x) => x.kind === 'image');
  useEffect(() => { if (isPost && storySong && !postSongOk) { setStorySong(null); stopSong(); } }, [postSongOk]);
  useEffect(() => {
    if (!storySong) return undefined;
    const el = songEl();
    const again = () => { if (songPlayer.cur === storySong.id) playSong(storySong, true); };
    el.addEventListener('ended', again);
    return () => el.removeEventListener('ended', again);
  }, [storySong && storySong.id]);
  const songAutoRef = useRef(null);
  useEffect(() => {
    if (musicPick || !storySong || songAutoRef.current !== storySong.id) return;
    songAutoRef.current = null;
    playSong(storySong, true);
  }, [storySong && storySong.id, musicPick]);
  useEffect(() => {
    const fs = typeof document !== 'undefined' ? document.fonts : null;
    if (!fs || !fs.addEventListener) return undefined;
    const on = () => setFontTick((n) => n + 1);
    fs.addEventListener('loadingdone', on);
    return () => fs.removeEventListener('loadingdone', on);
  }, []);
  const hintTimer = useRef(0);
  const showLayerHint = (key, text) => {
    if (layerHintsSeen.has(key)) return;
    layerHintsSeen.add(key);
    clearTimeout(hintTimer.current);
    setLayerHint(text);
    hintTimer.current = setTimeout(() => setLayerHint(''), 2800);
  };
  useEffect(() => () => clearTimeout(hintTimer.current), []);
  useEffect(() => {
    if (!files.some((f) => (f.type || '').startsWith('image'))) return undefined;
    let seen = false;
    try { seen = localStorage.getItem('zchat-tip-filter-swipe') === '1'; localStorage.setItem('zchat-tip-filter-swipe', '1'); } catch { seen = true; }
    if (seen) return undefined;
    const t = setTimeout(() => showLayerHint('filterswipe', 'Swipe the photo to change the filter'), 700);
    return () => clearTimeout(t);
  }, []);
  const [collab, setCollab] = useState(() => (draft && draft.collab) || null);
  const [pickCollab, setPickCollab] = useState(false);
  const [closeCount, reloadClose] = useCloseFriendCount(isStory ? myId : null);
  const storyLists = useStoryLists(isStory && !sharedTo ? myId : null);
  const canDraft = (isPost || isStory) && !!myId;
  const draftIdRef = useRef((draft && draft.id) || null);
  const draftSig = () => { try { return JSON.stringify([caption, items.map((it) => [it.crop, it.texts, it.strokes, it.stickers, it.trimStart, it.trimEnd, it.filter]), storySticker, storySong && storySong.id, mentions.length, place && place.n, collab && collab.id, markSens]); } catch { return String(Date.now()); } };
  const draftBaseRef = useRef(undefined);
  if (draftBaseRef.current === undefined) draftBaseRef.current = draft ? draftSig() : null;
  const keepDraft = async () => {
    if (!draftIdRef.current && (await draftCountAll(myId)) >= DRAFT_MAX) { setDraftNote(`You have ${DRAFT_MAX} drafts. Delete one to save this.`); setTimeout(() => setDraftNote(''), 2600); return false; }
    const id = draftIdRef.current || `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const rec = { id, uid: myId, at: Date.now(), kind: isStory ? 'story' : 'post', caption, collab: collab ? { id: collab.id, name: collab.name } : null, items: items.map((it, i) => ({ kind: it.kind, file: it.file, path: draft && draft.items && draft.items[i] && draft.items[i].file === it.file ? draft.items[i].path : undefined, crop: it.crop, texts: it.texts, strokes: it.strokes, stickers: it.stickers, trimStart: it.trimStart, trimEnd: it.trimEnd, filter: it.filter, width: it.width, height: it.height, duration: it.duration, blurs: it.blurs })) };
    if (markSens) rec.sensitive = true;
    if (place) rec.place = place;
    if (isStory) { if (storySticker) rec.sticker = storySticker; if (storySong) rec.song = storySong; if (mentions.length) rec.mentions = mentions; if (sharedTo) rec.shared = sharedTo; }
    if (isPost && storySong) rec.song = storySong;
    let ok = await saveDraft(rec);
    if (!ok) ok = await saveDraft({ ...rec, items: rec.items.map((x) => ({ kind: x.kind, file: x.file })) });
    if (!ok) { setDraftNote('This phone could not keep the draft'); setTimeout(() => setDraftNote(''), 2200); return false; }
    draftIdRef.current = id;
    draftBaseRef.current = draftSig();
    announceDrafts();
    return true;
  };
  requestCloseRef.current = () => {
    if (askClose) { setAskClose(false); return; }
    if (canDraft && !sentRef.current && (draftBaseRef.current === null || draftBaseRef.current !== draftSig())) { setAskClose(true); return; }
    onCancel();
  };
  const onSend = (outs, cap, mns, opts) => onSendBase(outs, cap, mns, {
    ...opts,
    ...(isStory ? { audience: closeShareRef.current ? 'close' : storyAud && !sharedTo ? storyAud.k : undefined, audienceName: !closeShareRef.current && storyAud ? storyAud.name : undefined, shared: sharedTo || undefined, draftId: draftIdRef.current || undefined } : {}),
    ...((isStory || isPost) && place ? { place } : {}),
  });
  const [closeEdit, setCloseEdit] = useState(false);
  const closeShareRef = useRef(false);
  const stageRef = useRef(null);
  const innerRef = useRef(null);
  const videoRef = useRef(null);
  const livePathRef = useRef(null);
  const liveCoreRef = useRef(null);
  const liveEraseRef = useRef(null);
  const liveBlurRef = useRef(null);
  const drawRef = useRef(null);
  const dragRef = useRef(null);
  const frameRef = useRef({ frameW: 1, frameH: 1, innerW: 1, innerH: 1 });
  const trimBarRef = useRef(null);
  const sentRef = useRef(false);
  useBackClose(mode !== 'view', () => setMode('view'));
  useBackClose(!!textDraft, () => saveText());
  useBackClose(showStickerPicker, () => setShowStickerPicker(false));

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
  useEffect(() => { if (startMeme) { ensureMemeFont(); ensureTextFonts(); setMode('meme'); } }, []);

  function updateItem(id, patch) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...(typeof patch === 'function' ? patch(it) : patch) } : it)));
  }

  const textLinesRef = useRef(null);
  const gestRef = useRef(null);
  const binRef = useRef(null);
  const guideXRef = useRef(null);
  const guideYRef = useRef(null);
  const tapGuardRef = useRef(0);
  const wheelRef = useRef(null);
  const fsRef = useRef(null);
  const fsImgRef = useRef(null);
  const [filterFlash, setFilterFlash] = useState(null);
  const flashTimer = useRef(0);
  useEffect(() => () => clearTimeout(flashTimer.current), []);
  const postX = usePostExtras(isPost, items, cur, myId);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      const lay = e.target && e.target.closest ? e.target.closest('[data-layer]') : null;
      if (!lay || modeRef.current !== 'view' || gestRef.current) return;
      e.preventDefault();
      if (wheelRef.current) wheelRef.current(lay.getAttribute('data-layer'), e);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);
  const blurKey = cur && cur.kind === 'image' ? `${cur.url}|${cur.filter || 'none'}` : '';
  const paintBlurNow = () => {
    const cv = blurCanvasRef.current;
    if (!cv || !cur || cur.kind !== 'image') return;
    const fr = frameRef.current;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const w = Math.max(1, Math.round(fr.innerW * dpr));
    const h = Math.max(1, Math.round(fr.innerH * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const x = cv.getContext('2d');
    x.clearRect(0, 0, w, h);
    const list = cur.blurs || [];
    const live = blurLiveRef.current;
    const base = blurBaseRef.current.key === blurKey ? blurBaseRef.current.cv : null;
    if (base && (live || list.some((b) => b.t !== 'f' || b.on))) {
      if (!blurMaskRef.current) blurMaskRef.current = document.createElement('canvas');
      paintBlurLayer(x, blurMaskRef.current, list, live, base, w, h, 0, 0);
    }
    if (modeRef.current === 'blur') {
      list.forEach((b) => {
        if (b.t !== 'f') return;
        x.save();
        x.beginPath();
        x.ellipse((b.x + b.w / 2) * w, (b.y + b.h / 2) * h, (b.w / 2) * w * 1.2, (b.h / 2) * h * 1.3, 0, 0, Math.PI * 2);
        x.lineWidth = 2 * dpr;
        x.strokeStyle = b.on ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.95)';
        if (!b.on) x.setLineDash([7 * dpr, 6 * dpr]);
        x.stroke();
        x.restore();
      });
    }
  };
  const blurCount = cur ? (cur.blurs || []).length : 0;
  useEffect(() => {
    if (!blurKey) return undefined;
    if (!blurCount && mode !== 'blur') { paintBlurNow(); return undefined; }
    let alive = true;
    if (blurBaseRef.current.key !== blurKey) {
      loadImageElement(cur.url).then((img) => { if (!alive) return; blurBaseRef.current = { key: blurKey, cv: blurBaseFrom(img, cur.filter) }; paintBlurNow(); }, () => {});
    } else paintBlurNow();
    return () => { alive = false; };
  }, [blurKey, blurCount, mode, cur && cur.blurs, stage.w, stage.h, cur && cur.crop, cur && cur.width]);

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
  const svgIds = `zc${String(cur.id).replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokeTree = drawStrokeTree(cur.strokes, W, H, svgIds);
  const svgBig = { x: -W, y: -H, width: W * 3, height: H * 3 };

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
  const liveEls = (s) => {
    const d = s ? strokeToPath(s.points, W, H) : '';
    const erase = s && s.b === 'erase';
    if (livePathRef.current) livePathRef.current.setAttribute('d', erase ? '' : d);
    if (liveCoreRef.current) liveCoreRef.current.setAttribute('d', s && s.b === 'neon' ? d : '');
    if (liveEraseRef.current) liveEraseRef.current.setAttribute('d', erase ? d : '');
  };
  const drawDown = (e) => {
    if (mode !== 'draw' || !innerRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawRef.current = { points: [pointOnInner(e)], size: brushSize / frameRef.current.innerW, color: brushColor, b: brushKind };
    const s0 = drawRef.current;
    const look = DRAW_LOOK[s0.b] || DRAW_LOOK.pen;
    const w = s0.size * W * look.w;
    const lp = livePathRef.current;
    if (lp) {
      lp.setAttribute('stroke', s0.color);
      lp.setAttribute('stroke-opacity', String(look.op));
      lp.setAttribute('stroke-width', String(w));
      lp.setAttribute('stroke-linecap', look.cap);
      if (s0.b === 'neon') lp.setAttribute('filter', `url(#${svgIds}-glive)`); else lp.removeAttribute('filter');
    }
    if (liveBlurRef.current) liveBlurRef.current.setAttribute('stdDeviation', String(s0.size * W * 0.55));
    if (liveCoreRef.current) liveCoreRef.current.setAttribute('stroke-width', String(w * 0.36));
    if (liveEraseRef.current) liveEraseRef.current.setAttribute('stroke-width', String(s0.size * W * DRAW_LOOK.erase.w));
    liveEls(s0);
  };
  const drawMove = (e) => {
    if (!drawRef.current) return;
    const ne = e.nativeEvent;
    const list = ne && ne.getCoalescedEvents ? ne.getCoalescedEvents() : [];
    (list && list.length ? list : [e]).forEach((ev) => drawRef.current.points.push(pointOnInner(ev)));
    liveEls(drawRef.current);
  };
  const drawUp = () => {
    const s = drawRef.current;
    drawRef.current = null;
    liveEls(null);
    if (s && s.points.length) {
      if (s.b === 'erase' && !cur.strokes.some((x) => x.b !== 'erase')) return;
      updateItem(cur.id, (it) => ({ strokes: [...it.strokes, s] }));
    }
  };
  const setBlurs = (fn) => {
    blurHistRef.current.push(cur.blurs || []);
    if (blurHistRef.current.length > 40) blurHistRef.current.shift();
    updateItem(cur.id, (it) => ({ blurs: fn(it.blurs || []) }));
  };
  const undoBlur = () => { const prev = blurHistRef.current.pop(); if (prev) { hapticTap(); updateItem(cur.id, { blurs: prev }); } };
  const startBlur = () => { blurHistRef.current = []; setFaceNote(''); setMode('blur'); };
  const blurPt = (e) => { const r = blurCanvasRef.current.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width))), Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)))]; };
  const blurDown = (e) => {
    if (mode !== 'blur' || !blurCanvasRef.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    blurDragRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, pts: [blurPt(e)] };
  };
  const blurMove = (e) => {
    const d = blurDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const ne = e.nativeEvent;
    const list = ne && ne.getCoalescedEvents ? ne.getCoalescedEvents() : [];
    (list && list.length ? list : [e]).forEach((ev) => d.pts.push(blurPt(ev)));
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    if (d.moved) { blurLiveRef.current = { t: 's', pts: d.pts, size: blurSize / Math.max(1, frameRef.current.innerW) }; paintBlurNow(); }
  };
  const blurUp = (e) => {
    const d = blurDragRef.current;
    if (!d || d.id !== e.pointerId) return;
    blurDragRef.current = null;
    const live = blurLiveRef.current;
    blurLiveRef.current = null;
    if (!d.moved) {
      const [px, py] = d.pts[0];
      const faces = (cur.blurs || []).filter((b) => b.t === 'f');
      const hit = faces.reverse().find((b) => { const rx = (b.w / 2) * 1.2; const ry = (b.h / 2) * 1.3; return ((px - b.x - b.w / 2) / rx) ** 2 + ((py - b.y - b.h / 2) / ry) ** 2 <= 1; });
      if (hit) { hapticTap(); setBlurs((l) => l.map((b) => (b.id === hit.id ? { ...b, on: !b.on } : b))); } else paintBlurNow();
      return;
    }
    if (live && e.type !== 'pointercancel') setBlurs((l) => [...l, live]); else paintBlurNow();
  };
  const findFaces = async () => {
    if (faceBusy) return;
    setFaceBusy(true);
    setFaceNote('');
    const found = await detectFacesIn(cur.url);
    setFaceBusy(false);
    if (found === null) { faceApi.off = true; setFaceNote('This browser could not look for faces. Paint over them instead.'); return; }
    if (!found.length) { setFaceNote('No faces found. Paint over anything you want to hide.'); return; }
    hapticTap();
    const stamp = Date.now();
    setBlurs((l) => [...l.filter((b) => b.t !== 'f'), ...found.map((f, i) => ({ t: 'f', id: `f${stamp}${i}`, ...f, on: true }))]);
    setFaceNote(found.length === 1 ? 'Blurred 1 face. Tap it to show it again.' : `Blurred ${found.length} faces. Tap one to show it again.`);
  };
  const openMeme = () => {
    ensureMemeFont();
    ensureTextFonts();
    const t = cur.texts.find((x) => x.id === 'mtop');
    const b = cur.texts.find((x) => x.id === 'mbot');
    setMeme({ top: t ? t.text : '', bot: b ? b.text : '' });
    setMode('meme');
  };
  const memeSet = (which, raw) => {
    const value = String(raw || '').toUpperCase().replace(/\n/g, ' ').slice(0, 80);
    setMeme((m) => ({ ...m, [which]: value }));
    const id = which === 'top' ? 'mtop' : 'mbot';
    const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
    updateItem(cur.id, (it) => {
      const others = it.texts.filter((t) => t.id !== id);
      if (!value.trim()) return { texts: others };
      const ex = it.texts.find((t) => t.id === id);
      const fit = memeFitLayer(value.trim(), r, it.width || 1, it.height || 1);
      const autoY = which === 'top' ? r.y + fit.hn / 2 + r.h * 0.035 : r.y + r.h - fit.hn / 2 - r.h * 0.035;
      const moved = ex && ex.ay != null && (Math.abs(ex.y - ex.ay) > 0.0005 || Math.abs(ex.x - (r.x + r.w / 2)) > 0.0005);
      const keepLines = moved ? memeLinesFit(value.trim(), ex.size, ex.w || fit.w).lines : fit.lines;
      return { texts: [...others, { id, text: value.trim(), color: ex ? ex.color : '#FFFFFF', size: moved ? ex.size : fit.size, font: 'meme', bg: 'none', align: 'center', w: moved ? ex.w || fit.w : fit.w, lines: keepLines, x: moved ? ex.x : r.x + r.w / 2, y: moved ? ex.y : autoY, ay: moved ? ex.ay : autoY, r: moved ? ex.r || 0 : 0 }] };
    });
  };
  const finishMeme = () => { setMode('view'); if (meme.top.trim() || meme.bot.trim()) showLayerHint('meme', 'Drag the words to move them. Pinch to resize.'); };

  const openTextEditor = (t) => {
    ensureTextFonts();
    textLinesRef.current = null;
    if (t) { setTextDraft({ id: t.id, text: t.text, color: t.color || '#FFFFFF', size: t.size, font: t.font || 'classic', bg: t.bg || 'none', align: t.align || 'center', w: t.w || null, lines: t.lines || null }); return; }
    setTextDraft({ id: null, text: '', color: textLayerStyle.color || '#FFFFFF', size: 0.07, font: textLayerStyle.font, bg: textLayerStyle.bg, align: textLayerStyle.align, w: null, lines: null });
  };
  const removeText = (id) => {
    const gone = cur.texts.find((x) => x.id === id);
    updateItem(cur.id, (it) => ({ texts: it.texts.filter((x) => x.id !== id) }));
    if (gone && gone.mention) setMentions((prev) => prev.filter((x) => !(x.id === gone.mention.id && x.kind === gone.mention.kind)));
  };
  const saveText = () => {
    const td = textDraft;
    setTextDraft(null);
    if (!td) return;
    const raw = textLinesRef.current;
    textLinesRef.current = null;
    const value = String(td.text || '').replace(/\s+$/, '');
    if (!value.trim()) {
      if (td.id) removeText(td.id);
      return;
    }
    const lines = Array.isArray(raw) && raw.length ? raw.slice() : value.split('\n');
    while (lines.length > 1 && !lines[lines.length - 1].trim()) lines.pop();
    const wFull = td.w || (0.86 * frameRef.current.frameW) / Math.max(1, frameRef.current.innerW);
    const patch = { text: value, color: td.color, size: td.size, font: td.font || 'classic', bg: td.bg || 'none', align: td.align || 'center', w: wFull, lines };
    textLayerStyle.font = patch.font;
    textLayerStyle.bg = patch.bg;
    textLayerStyle.align = patch.align;
    textLayerStyle.color = patch.color;
    if (td.id) {
      updateItem(cur.id, (it) => ({ texts: it.texts.map((x) => (x.id === td.id ? { ...x, ...patch } : x)) }));
    } else {
      const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
      updateItem(cur.id, (it) => ({ texts: [...it.texts, { id: `t${Date.now()}`, ...patch, x: r.x + r.w / 2, y: r.y + r.h * 0.42, r: 0 }] }));
      showLayerHint('text', 'Drag it anywhere. Pinch to resize or turn it.');
    }
  };

  const layerNow = (key) => {
    if (key === 'song') { const p = storySong && layerPosOf(storySong.pos); return p ? { box: 'frame', ...p, rot: true, base: 1 } : null; }
    if (key === 'card') { const p = storySticker && layerPosOf(storySticker.pos); return p ? { box: 'frame', ...p, rot: storySticker.k !== 'slider', base: 1 } : null; }
    const id = key.slice(2);
    if (key[0] === 't') { const t = cur.texts.find((x) => x.id === id); return t ? { box: 'inner', x: t.x, y: t.y, s: 1, r: t.r || 0, rot: true, base: t.size } : null; }
    const st = (cur.stickers || []).find((x) => x.id === id);
    return st ? { box: 'inner', x: st.x, y: st.y, s: 1, r: st.r || 0, rot: true, base: st.size } : null;
  };
  const layerScaleLimit = (key, info, v) => {
    if (key === 'song' || key === 'card') return Math.max(0.45, Math.min(3, v));
    const lo = key[0] === 't' ? 0.012 : 0.05;
    const hi = key[0] === 't' ? 0.6 : 1.6;
    const b = Math.max(0.0001, info.base || 1);
    return Math.max(lo / b, Math.min(hi / b, v));
  };
  const layerTransform = (key, c, bin) => {
    const fr = frameRef.current;
    const k = bin ? 0.42 : 1;
    if (key === 'song' || key === 'card') return `translate(-50%, -50%) rotate(${c.r}deg) scale(${(c.s * fr.frameW * k) / STORY_REF_W})`;
    const sc = c.s * k;
    return Math.abs(sc - 1) > 0.0005 ? `translate(-50%, -50%) rotate(${c.r}deg) scale(${sc})` : `translate(-50%, -50%) rotate(${c.r}deg)`;
  };
  const paintLayer = (g) => {
    const el = g.el;
    if (!el) return;
    el.style.left = `${g.cur.x * 100}%`;
    el.style.top = `${g.cur.y * 100}%`;
    el.style.transform = layerTransform(g.key, g.cur, g.bin);
    el.style.opacity = g.bin ? '0.72' : '';
  };
  const binLook = (on) => {
    const b = binRef.current;
    if (!b) return;
    b.style.transform = on ? 'translateX(-50%) scale(1.22)' : 'translateX(-50%)';
    b.style.background = on ? '#FF3B30' : 'rgba(18, 18, 24, 0.55)';
    b.style.boxShadow = on ? '0 0 0 6px rgba(255, 59, 48, 0.25)' : 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.55)';
  };
  const guideLook = (ref, on) => { if (ref.current) ref.current.style.opacity = on ? '1' : '0'; };
  const pinchBase = (g) => {
    const [a, b] = [...g.pts.values()];
    return { d: Math.max(10, Math.hypot(b.x - a.x, b.y - a.y)), ang: Math.atan2(b.y - a.y, b.x - a.x), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, s: g.cur.s, r: g.cur.r, x: g.cur.x, y: g.cur.y };
  };
  const commitLayer = (key, c) => {
    if (key === 'song') { setStorySong((sg) => (sg ? { ...sg, pos: { x: c.x, y: c.y, s: c.s, r: c.r } } : sg)); return; }
    if (key === 'card') { setStorySticker((sk) => (sk ? { ...sk, pos: { x: c.x, y: c.y, s: c.s, r: sk.k === 'slider' ? 0 : c.r } } : sk)); return; }
    const id = key.slice(2);
    if (key[0] === 't') {
      updateItem(cur.id, (it) => ({ texts: it.texts.map((t) => (t.id === id ? { ...t, x: c.x, y: c.y, r: c.r, size: Math.max(0.012, Math.min(0.6, t.size * c.s)), w: t.w ? t.w * c.s : t.w } : t)) }));
      return;
    }
    updateItem(cur.id, (it) => ({ stickers: (it.stickers || []).map((st) => (st.id === id ? { ...st, x: c.x, y: c.y, r: c.r, size: Math.max(0.05, Math.min(1.6, st.size * c.s)) } : st)) }));
  };
  const removeLayer = (key) => {
    if (key === 'song') { stopSong(); setStorySong(null); return; }
    if (key === 'card') { setStorySticker(null); return; }
    const id = key.slice(2);
    if (key[0] === 't') { removeText(id); return; }
    updateItem(cur.id, (it) => ({ stickers: (it.stickers || []).filter((x) => x.id !== id) }));
  };
  const tapLayer = (key) => {
    if (key === 'song' && storySong) {
      hapticTap();
      const next = SONG_LOOKS[(SONG_LOOKS.indexOf(storySong.look || 'pill') + 1) % SONG_LOOKS.length];
      setStorySong((sg) => (sg ? { ...sg, look: next } : sg));
      return;
    }
    if (key[0] === 't') { const t = cur.texts.find((x) => x.id === key.slice(2)); if (t) openTextEditor(t); }
  };
  const filterIndexOf = (k) => Math.max(0, PHOTO_FILTERS.findIndex((f) => f.k === (k || 'none')));
  const flashFilter = (k) => {
    const i = filterIndexOf(k);
    clearTimeout(flashTimer.current);
    setFilterFlash({ k, i, n: Date.now() });
    flashTimer.current = setTimeout(() => setFilterFlash(null), 1100);
  };
  const fsLook = (dx, cand) => {
    const img = fsImgRef.current;
    if (!img) return;
    if (cand == null || !dx) { img.style.display = 'none'; return; }
    const fr = frameRef.current;
    const reg = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
    const left = reg.x * fr.innerW;
    img.style.display = 'block';
    img.style.filter = photoFilterCss(PHOTO_FILTERS[cand].k);
    img.style.clipPath = dx < 0 ? `inset(0 0 0 ${Math.max(0, left + fr.frameW + dx)}px)` : `inset(0 ${Math.max(0, fr.innerW - (left + dx))}px 0 0)`;
  };
  const fsDown = (e) => {
    if ((mode !== 'view' && mode !== 'filter') || !cur || cur.kind !== 'image' || textDraft || sending || gestRef.current || dragKey) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target && e.target.closest && e.target.closest('[data-layer], [data-tool], [role="button"]')) return;
    fsRef.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, t: Date.now(), dx: 0, on: false, cand: null };
  };
  const fsMove = (e) => {
    const s = fsRef.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.sx;
    const dy = e.clientY - s.sy;
    if (!s.on) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { fsRef.current = null; return; }
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      if (gestRef.current) { fsRef.current = null; return; }
      s.on = true;
      try { stageRef.current.setPointerCapture(e.pointerId); } catch {}
    }
    const fw = frameRef.current.frameW || 1;
    const i = filterIndexOf(cur.filter);
    const cand = dx < 0 ? (i < PHOTO_FILTERS.length - 1 ? i + 1 : null) : (i > 0 ? i - 1 : null);
    s.cand = cand;
    s.dx = cand == null ? dx * 0.18 : Math.max(-fw, Math.min(fw, dx));
    fsLook(cand == null ? 0 : s.dx, cand);
  };
  const fsEnd = (e) => {
    const s = fsRef.current;
    if (!s || s.id !== e.pointerId) return;
    fsRef.current = null;
    try { stageRef.current.releasePointerCapture(e.pointerId); } catch {}
    if (!s.on) return;
    tapGuardRef.current = Date.now();
    const fw = frameRef.current.frameW || 1;
    const fast = Math.abs(s.dx) / Math.max(1, Date.now() - s.t) > 0.45 && Math.abs(s.dx) > 34;
    const img = fsImgRef.current;
    if (s.cand != null && e.type !== 'pointercancel' && (Math.abs(s.dx) > fw * 0.24 || fast)) {
      const k = PHOTO_FILTERS[s.cand].k;
      if (img) { img.style.transition = 'clip-path 0.16s ease-out'; fsLook(s.dx < 0 ? -fw : fw, s.cand); }
      hapticTap();
      setTimeout(() => {
        updateItem(cur.id, { filter: k });
        flashFilter(k);
        requestAnimationFrame(() => { if (fsImgRef.current) { fsImgRef.current.style.transition = ''; fsImgRef.current.style.display = 'none'; } });
      }, 150);
      return;
    }
    if (img && s.cand != null) {
      img.style.transition = 'clip-path 0.16s ease-out';
      fsLook(s.dx < 0 ? -0.01 : 0.01, s.cand);
      setTimeout(() => { if (fsImgRef.current) { fsImgRef.current.style.transition = ''; fsImgRef.current.style.display = 'none'; } }, 170);
    } else fsLook(0, null);
  };
  const gStart = (e) => {
    if (mode !== 'view' || textDraft || sending) return;
    const g = gestRef.current;
    if (g) {
      if (g.pts.has(e.pointerId) || g.pts.size >= 2) return;
      e.stopPropagation();
      g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { stageRef.current.setPointerCapture(e.pointerId); } catch {}
      g.pinch = pinchBase(g);
      if (!g.moved) { g.moved = true; setDragKey(g.key); }
      if (g.bin) { g.bin = false; binLook(false); }
      return;
    }
    const el = e.target && e.target.closest ? e.target.closest('[data-layer]') : null;
    if (!el || !stageRef.current || !stageRef.current.contains(el)) return;
    const key = el.getAttribute('data-layer');
    const info = layerNow(key);
    if (!info) return;
    e.stopPropagation();
    try { stageRef.current.setPointerCapture(e.pointerId); } catch {}
    const fr = frameRef.current;
    gestRef.current = { key, el, info, cur: { x: info.x, y: info.y, s: info.s, r: info.r }, pts: new Map([[e.pointerId, { x: e.clientX, y: e.clientY }]]), sx: e.clientX, sy: e.clientY, ox: info.x, oy: info.y, moved: false, pinch: null, bin: false, snapX: false, snapY: false, bw: Math.max(1, info.box === 'frame' ? fr.frameW : fr.innerW), bh: Math.max(1, info.box === 'frame' ? fr.frameH : fr.innerH) };
    el.style.willChange = 'transform';
  };
  const gMove = (e) => {
    const g = gestRef.current;
    if (!g || !g.pts.has(e.pointerId)) return;
    g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    let x;
    let y;
    let sc = g.cur.s;
    let r = g.cur.r;
    if (g.pts.size >= 2 && g.pinch) {
      const [a, b] = [...g.pts.values()];
      const d = Math.max(10, Math.hypot(b.x - a.x, b.y - a.y));
      sc = layerScaleLimit(g.key, g.info, g.pinch.s * (d / g.pinch.d));
      if (g.info.rot) r = normDeg(g.pinch.r + ((Math.atan2(b.y - a.y, b.x - a.x) - g.pinch.ang) * 180) / Math.PI);
      x = g.pinch.x + ((a.x + b.x) / 2 - g.pinch.mx) / g.bw;
      y = g.pinch.y + ((a.y + b.y) / 2 - g.pinch.my) / g.bh;
    } else {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (!g.moved && Math.hypot(dx, dy) < 6) return;
      x = g.ox + dx / g.bw;
      y = g.oy + dy / g.bh;
    }
    if (!g.moved) { g.moved = true; setDragKey(g.key); }
    const fr = frameRef.current;
    const reg = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
    const inner = g.info.box === 'inner';
    const lo = inner ? reg : { x: 0, y: 0, w: 1, h: 1 };
    x = Math.max(lo.x, Math.min(lo.x + lo.w, x));
    y = Math.max(lo.y, Math.min(lo.y + lo.h, y));
    const fx = inner ? (x - reg.x) * fr.innerW : x * fr.frameW;
    const fy = inner ? (y - reg.y) * fr.innerH : y * fr.frameH;
    const snapX = Math.abs(fx - fr.frameW / 2) < 8;
    const snapY = Math.abs(fy - fr.frameH / 2) < 8;
    if (snapX) x = inner ? reg.x + fr.frameW / 2 / Math.max(1, fr.innerW) : 0.5;
    if (snapY) y = inner ? reg.y + fr.frameH / 2 / Math.max(1, fr.innerH) : 0.5;
    if (snapX !== g.snapX) { g.snapX = snapX; guideLook(guideXRef, snapX); if (snapX) hapticTap(); }
    if (snapY !== g.snapY) { g.snapY = snapY; guideLook(guideYRef, snapY); if (snapY) hapticTap(); }
    if (g.info.rot) { const near = Math.round(r / 90) * 90; if (Math.abs(r - near) < 4) r = normDeg(near); } else r = 0;
    g.cur = { x, y, s: sc, r };
    let bin = false;
    if (g.pts.size === 1 && binRef.current) {
      const br = binRef.current.getBoundingClientRect();
      bin = Math.hypot(e.clientX - (br.left + br.width / 2), e.clientY - (br.top + br.height / 2)) < 50;
    }
    if (bin !== g.bin) { g.bin = bin; binLook(bin); if (bin) hapticTap(); }
    paintLayer(g);
  };
  const gEnd = (e) => {
    const g = gestRef.current;
    if (!g || !g.pts.has(e.pointerId)) return;
    g.pts.delete(e.pointerId);
    try { stageRef.current.releasePointerCapture(e.pointerId); } catch {}
    if (g.pts.size === 1) {
      const [pt] = [...g.pts.values()];
      g.sx = pt.x; g.sy = pt.y; g.ox = g.cur.x; g.oy = g.cur.y; g.pinch = null;
      return;
    }
    if (g.pts.size > 0) return;
    gestRef.current = null;
    if (g.el) g.el.style.willChange = '';
    guideLook(guideXRef, false);
    guideLook(guideYRef, false);
    if (!g.moved) { tapLayer(g.key); return; }
    tapGuardRef.current = Date.now();
    setDragKey(null);
    binLook(false);
    if (g.bin && e.type !== 'pointercancel') { hapticTap(); playUiSound('delete'); removeLayer(g.key); return; }
    const done = { ...g.cur, s: g.info.box === 'inner' ? 1 : g.cur.s };
    if (g.el) { g.el.style.opacity = ''; g.el.style.left = `${done.x * 100}%`; g.el.style.top = `${done.y * 100}%`; g.el.style.transform = layerTransform(g.key, done, false); }
    commitLayer(g.key, g.cur);
  };
  wheelRef.current = (key, e) => {
    const info = layerNow(key);
    if (!info) return;
    if (e.shiftKey || e.altKey) { commitLayer(key, { x: info.x, y: info.y, s: info.s, r: info.rot ? normDeg(info.r + (e.deltaY > 0 ? 6 : -6)) : 0 }); return; }
    const f = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
    commitLayer(key, { x: info.x, y: info.y, s: layerScaleLimit(key, info, info.s * f), r: info.r });
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
          const file = await exportEditedImage(it, !isPost && !isStory && hd, !isPost && !isStory ? 1600 : 0);
          outputs.push({ kind: 'image', file, url: it.url });
        } else {
          const overlayFile = await exportVideoOverlay(it);
          const trimmed = it.duration && ((it.trimStart || 0) > 0.05 || (it.trimEnd != null && it.trimEnd < it.duration - 0.05));
          outputs.push({ kind: 'video', file: it.file, url: it.url, overlayFile, trimStart: trimmed ? (it.trimStart || 0) : null, trimEnd: trimmed ? (it.trimEnd != null ? it.trimEnd : it.duration) : null });
        }
      }
      if (isPost && markSens) outputs.forEach((o) => { o.sensitive = true; });
      sentRef.current = true;
      onSend(outputs, caption.trim(), mentions, { hd: !isPost && !isStory && hd, once: !isPost && !isStory && once, blur: !isPost && !isStory && !once && hideIt, album: !isPost && !isStory && !once && !hideIt && album ? album : undefined, audience: isStory && closeShareRef.current ? 'close' : undefined, sticker: isStory && storySticker ? (storySticker.k === 'moment' ? storySticker : { ...storySticker, pos: roundLayerPos(storySticker.pos) }) : undefined, song: isStory && storySong ? validSong({ ...storySong, pos: roundLayerPos(storySong.pos) }) || undefined : isPost && postSongOk && storySong ? validSong({ ...storySong, pos: undefined, look: undefined }) || undefined : undefined, collab: isPost && collab ? { id: collab.id, name: collab.name } : undefined, scheduleAt: isPost && scheduleAt ? scheduleAt : undefined, draftId: isPost ? draftIdRef.current || undefined : undefined });
    } catch {
      closeShareRef.current = false;
      setSending(false);
    }
  };

  const fmt = (s) => `${Math.floor((s || 0) / 60)}:${Math.floor((s || 0) % 60).toString().padStart(2, '0')}`;
  const toolBtn = (icon, label, onClick, active) => (
    <div role="button" aria-label={label} onClick={onClick} className="zchat-press" style={{
      width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      background: active ? 'white' : 'rgba(24, 24, 30, 0.46)', color: active ? '#000' : 'white', flexShrink: 0,
      boxShadow: active ? 'none' : 'inset 0 0 0 0.5px rgba(255, 255, 255, 0.24)',
      backdropFilter: !active && GLASS_OK ? 'blur(12px)' : undefined, WebkitBackdropFilter: !active && GLASS_OK ? 'blur(12px)' : undefined,
    }}>{icon}</div>
  );
  const colorRow = (value, onPick) => (
    <div role="radiogroup" aria-label="Brush colour" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {EDITOR_COLORS.map((c) => (
        <div key={c} role="radio" aria-checked={value === c} aria-label={`Brush colour ${c}`} onClick={() => { hapticTap(); onPick(c); }} style={{
          width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0,
          boxShadow: value === c ? '0 0 0 2.5px #000000, 0 0 0 4.5px #FFFFFF' : 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.3)', transition: 'box-shadow 160ms ease',
        }} />
      ))}
    </div>
  );
  const optBtn = (o) => (
    <div key={o.k} role="button" aria-label={o.aria} aria-pressed={o.toggle ? o.on : undefined} onClick={() => { hapticTap(); if (o.toggle) playUiSound('toggle'); o.tap(); }} className="zchat-press"
      style={{ flexShrink: 0, minWidth: 64, maxWidth: o.wide ? 150 : 96, padding: '0 4px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#FFFFFF', WebkitTapHighlightColor: 'transparent' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: o.on ? '#FFFFFF' : 'transparent', color: o.on ? '#000000' : '#FFFFFF', transition: 'background 160ms ease, color 160ms ease' }}>{o.icon}</div>
      <div style={{ maxWidth: '100%', fontSize: 11.5, lineHeight: '14px', fontWeight: o.on ? 700 : 600, color: o.on ? '#FFFFFF' : 'rgba(255, 255, 255, 0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</div>
    </div>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 120, background: '#000', color: 'white', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }} className="zchat-fade">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', flexShrink: 0, minHeight: 60, boxSizing: 'border-box' }}>
        {mode === 'view' && (
          <>
            {toolBtn(<X size={20} />, 'Close', () => requestCloseRef.current())}
            <div style={{ display: 'flex', gap: 8, opacity: dragKey ? 0 : 1, transition: 'opacity 0.16s ease', pointerEvents: dragKey ? 'none' : undefined }}>
              {(isStory || isPost) && storySong && toolBtn(songPlayingId === storySong.id ? <Volume2 size={18} /> : <VolumeX size={18} />, songPlayingId === storySong.id ? 'Pause music' : 'Play music', () => toggleSong(storySong))}
              {!isPost && !isStory && items.some((x) => x.kind === 'image') && toolBtn(<span style={{ fontSize: 12.5, fontWeight: 900, letterSpacing: '-0.02em', fontFamily: FONT }}>HD</span>, hd ? 'HD photo on' : 'HD photo off', () => { hapticTap(); playUiSound('toggle'); setHd((v) => !v); }, hd)}
            </div>
          </>
        )}
        {mode === 'draw' && (
          <>
            {toolBtn(<Undo2 size={18} />, 'Undo', () => updateItem(cur.id, (it) => ({ strokes: it.strokes.slice(0, -1) })))}
            <span style={{ fontSize: 15, fontWeight: 800 }}>Draw</span>
            <span role="button" aria-label="Done" onClick={() => setMode('view')} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
          </>
        )}
        {mode === 'blur' && (
          <>
            {toolBtn(<Undo2 size={18} />, 'Undo', undoBlur)}
            <span style={{ fontSize: 15, fontWeight: 800 }}>Blur</span>
            <span role="button" aria-label="Done" onClick={() => setMode('view')} style={{ fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
          </>
        )}
        {mode === 'meme' && (
          <>
            <span style={{ width: 60 }} />
            <span style={{ fontSize: 15, fontWeight: 800 }}>Meme</span>
            <span role="button" aria-label="Done" onClick={finishMeme} style={{ width: 60, textAlign: 'right', boxSizing: 'border-box', fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
          </>
        )}
        {mode === 'filter' && (
          <>
            <span style={{ width: 60 }} />
            <span style={{ fontSize: 15, fontWeight: 800 }}>Filters</span>
            <span role="button" aria-label="Done" onClick={() => setMode('view')} style={{ width: 60, textAlign: 'right', boxSizing: 'border-box', fontSize: 15, fontWeight: 800, cursor: 'pointer', padding: '8px 10px', color: theme.gold }}>Done</span>
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

      <div ref={stageRef} onPointerDownCapture={gStart} onPointerDown={fsDown} onPointerMove={(e) => { gMove(e); fsMove(e); }} onPointerUp={(e) => { gEnd(e); fsEnd(e); }} onPointerCancel={(e) => { gEnd(e); fsEnd(e); }}
        onClick={(e) => { if (Date.now() - tapGuardRef.current < 350 || (e.target && e.target.closest && e.target.closest('[data-layer], [data-tool]'))) return; if (mode === 'view' && cur.kind === 'video') togglePlay(); }}
        style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' }}>
        {cur.width && stage.w ? (
          <div style={{ position: 'relative', width: frameW, height: frameH, flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, overflow: mode === 'crop' ? 'visible' : 'hidden' }}>
            <div ref={innerRef}
              onPointerDown={drawDown} onPointerMove={drawMove} onPointerUp={drawUp} onPointerCancel={drawUp}
              style={{ position: 'absolute', left: -region.x * innerW, top: -region.y * innerH, width: innerW, height: innerH, touchAction: 'none', cursor: mode === 'draw' ? 'crosshair' : 'default' }}>
              {cur.kind === 'image' ? (
                <>
                  <img src={cur.url} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none', filter: photoFilterCss(cur.filter) }} />
                  <FilterFx k={cur.filter} />
                  <img ref={fsImgRef} src={cur.url} alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'none', userSelect: 'none', pointerEvents: 'none', willChange: 'clip-path' }} />
                  <canvas ref={blurCanvasRef} aria-label={mode === 'blur' ? 'Paint to blur' : undefined} aria-hidden={mode === 'blur' ? undefined : 'true'} onPointerDown={blurDown} onPointerMove={blurMove} onPointerUp={blurUp} onPointerCancel={blurUp}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: blurCount || mode === 'blur' ? 'block' : 'none', pointerEvents: mode === 'blur' ? 'auto' : 'none', touchAction: 'none', cursor: mode === 'blur' ? 'crosshair' : 'default' }} />
                </>
              ) : (
                <video ref={videoRef} src={cur.url} data-zmix={isStory ? 'mix' : undefined} playsInline preload="auto"
                  onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={onVideoTime}
                  onLoadedMetadata={(e) => { if (cur.trimStart) e.currentTarget.currentTime = cur.trimStart; }}
                  style={{ width: '100%', height: '100%', display: 'block', objectFit: 'fill', pointerEvents: 'none' }} />
              )}
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                <defs>
                  {strokeTree.defs}
                  <mask id={`${svgIds}-live`} maskUnits="userSpaceOnUse" {...svgBig}>
                    <rect {...svgBig} fill="#FFFFFF" />
                    <path ref={liveEraseRef} stroke="#000000" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </mask>
                  <filter id={`${svgIds}-glive`} filterUnits="userSpaceOnUse" {...svgBig}>
                    <feGaussianBlur ref={liveBlurRef} stdDeviation="4" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <g mask={`url(#${svgIds}-live)`}>{strokeTree.body}</g>
                <path ref={livePathRef} stroke={brushColor} strokeWidth={(brushSize / Math.max(1, innerW)) * W} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path ref={liveCoreRef} stroke="#FFFFFF" strokeOpacity="0.92" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {mode === 'view' && (
                <div ref={binRef} aria-hidden="true" style={{ position: 'absolute', left: (region.x + region.w / 2) * innerW, top: (region.y + region.h) * innerH - Math.min(22, Math.max(6, frameH * 0.04)) - 56, width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(18, 18, 24, 0.55)', boxShadow: 'inset 0 0 0 1.5px rgba(255, 255, 255, 0.55)', backdropFilter: GLASS_OK ? 'blur(10px)' : undefined, WebkitBackdropFilter: GLASS_OK ? 'blur(10px)' : undefined, transform: 'translateX(-50%)', transition: 'transform 0.16s cubic-bezier(0.2, 0.9, 0.3, 1.3), background 0.16s ease, opacity 0.16s ease', opacity: dragKey ? 1 : 0, pointerEvents: 'none' }}>
                  <Trash2 size={22} color="#FFFFFF" />
                </div>
              )}
              {(cur.stickers || []).map((st) => (
                <img key={st.id} data-layer={`k:${st.id}`} src={st.src} alt="" draggable={false}
                  style={{ position: 'absolute', left: `${st.x * 100}%`, top: `${st.y * 100}%`, width: st.size * innerW, transform: `translate(-50%, -50%) rotate(${st.r || 0}deg)`, touchAction: 'none', cursor: 'grab', pointerEvents: mode === 'view' && !textDraft ? 'auto' : 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', zIndex: dragKey === `k:${st.id}` ? 3 : 1 }} />
              ))}
              {cur.texts.map((t) => (textDraft && textDraft.id === t.id ? null : (
                <div key={t.id} data-layer={`t:${t.id}`}
                  style={{ position: 'absolute', left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: `translate(-50%, -50%) rotate(${t.r || 0}deg)`, pointerEvents: mode === 'view' && !textDraft ? 'auto' : 'none', touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', zIndex: dragKey === `t:${t.id}` ? 3 : 2 }}>
                  <TextLayerBody t={t} F={t.size * innerW} />
                </div>
              )))}
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
            {isStory && storySticker && storySticker.k !== 'moment' && storySticker.pos && mode === 'view' && (
              <div data-layer="card" style={{ position: 'absolute', left: `${storySticker.pos.x * 100}%`, top: `${storySticker.pos.y * 100}%`, width: STORY_REF_W, display: 'flex', justifyContent: 'center', transform: `translate(-50%, -50%) rotate(${storySticker.k === 'slider' ? 0 : storySticker.pos.r}deg) scale(${(storySticker.pos.s * frameW) / STORY_REF_W})`, zIndex: dragKey === 'card' ? 8 : 5, pointerEvents: 'none', touchAction: 'none', cursor: 'grab' }}>
                <StoryStickerPreview sticker={storySticker} />
              </div>
            )}
            {isStory && storySong && storySong.pos && mode === 'view' && (
              <div data-layer="song" style={{ position: 'absolute', left: `${storySong.pos.x * 100}%`, top: `${storySong.pos.y * 100}%`, transform: `translate(-50%, -50%) rotate(${storySong.pos.r}deg) scale(${(storySong.pos.s * frameW) / STORY_REF_W})`, zIndex: dragKey === 'song' ? 8 : 6, touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' }}>
                <StoryMusicSticker song={storySong} look={storySong.look} playing={songPlayingId === storySong.id} />
              </div>
            )}
            {mode === 'view' && (
              <>
                <div ref={guideXRef} aria-hidden="true" style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, marginLeft: -0.5, background: '#8EC5FF', boxShadow: '0 0 6px rgba(29,123,240,0.9)', opacity: 0, transition: 'opacity 0.12s ease', pointerEvents: 'none', zIndex: 9 }} />
                <div ref={guideYRef} aria-hidden="true" style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, marginTop: -0.5, background: '#8EC5FF', boxShadow: '0 0 6px rgba(29,123,240,0.9)', opacity: 0, transition: 'opacity 0.12s ease', pointerEvents: 'none', zIndex: 9 }} />
              </>
            )}
            {postX && mode === 'view' && postX.stage}
          </div>
        ) : (
          <Spinner size={26} />
        )}
        {mode === 'view' && !textDraft && !showStickerPicker && !musicPick && !stickerEdit && !showMentionPicker && !pickCollab && (
          (() => {
            const pv = () => { if (videoRef.current) videoRef.current.pause(); };
            const img = cur.kind === 'image';
            const all = [
              { k: 'text', icon: <Type size={21} />, label: 'Text', aria: 'Add text', on: () => openTextEditor(null), pri: true },
              (isStory || postSongOk) ? { k: 'music', icon: <MusicNoteIcon size={21} />, label: 'Music', aria: storySong ? 'Change music' : 'Add music', on: () => { setMusicPick(true); pv(); }, act: !!storySong, pri: true } : null,
              { k: 'stickers', icon: <Smile size={21} />, label: 'Stickers', aria: 'Stickers', on: () => { setShowStickerPicker(true); pv(); }, pri: true },
              isStory && !(storySticker && storySticker.k === 'moment') ? { k: 'sticker', icon: <StickerQIcon size={21} />, label: 'Poll and more', aria: 'Story sticker', on: () => { setStickerEdit(true); pv(); }, act: !!storySticker, pri: true } : null,
              img ? { k: 'filters', icon: <FilterIcon size={21} />, label: 'Filters', aria: 'Filters', on: () => setMode('filter'), act: !!(cur.filter && cur.filter !== 'none'), pri: !isStory } : null,
              { k: 'draw', icon: <Pencil size={21} />, label: 'Draw', aria: 'Draw', on: () => { setMode('draw'); pv(); }, pri: isStory || !isPost },
              img ? { k: 'crop', icon: <Crop size={21} />, label: 'Crop', aria: 'Crop', on: startCrop, pri: isPost } : null,
              isStory ? { k: 'mention', icon: <AtSign size={21} />, label: 'Mention', aria: 'Mention', on: () => setShowMentionPicker(true) } : null,
              (isStory || isPost) && myId ? { k: 'place', icon: <MapPinIcon size={21} />, label: 'Place', aria: place ? 'Change place' : 'Add a place', on: () => { setPlacePick(true); pv(); }, act: !!place } : null,
              isPost && myId ? { k: 'collab', icon: <UserPlus size={21} />, label: 'Collaborator', aria: 'Invite a collaborator', on: () => setPickCollab(true), act: !!collab } : null,
              img ? { k: 'restyle', icon: <PaintToolIcon k="brush" size={21} />, label: 'Restyle', aria: 'Restyle', on: () => { hapticTap(); setRestyle(true); } } : null,
              img ? { k: 'blur', icon: <BlurFaceIcon size={21} />, label: 'Blur faces', aria: 'Blur faces', on: startBlur, act: blurCount > 0 } : null,
              img ? { k: 'meme', icon: <MemeIcon size={21} strokeWidth={1.9} />, label: 'Meme', aria: 'Meme', on: openMeme, act: cur.texts.some((t) => t.id === 'mtop' || t.id === 'mbot') } : null,
              cur.kind === 'video' && cur.duration > 1 ? { k: 'trim', icon: <Scissors size={21} />, label: 'Trim', aria: 'Trim', on: () => { setMode('trim'); pv(); }, pri: true } : null,
            ].filter(Boolean);
            const pri = all.filter((x) => x.pri);
            const rest = all.filter((x) => !x.pri);
            const shown = railMore ? [...pri, ...rest] : pri;
            const one = (x) => (
              <div key={x.k} role="button" aria-label={x.aria} aria-pressed={x.act || undefined} onClick={() => { x.on(); setRailMore(false); }} className="zchat-press"
                style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, cursor: 'pointer', color: '#FFFFFF' }}>
                {railMore && <span style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.75)' }}>{x.label}</span>}
                <span style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: x.act ? '#FFFFFF' : 'transparent', color: x.act ? '#000000' : '#FFFFFF', filter: x.act ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}>{x.icon}</span>
              </div>
            );
            return (
              <div data-tool="rail" style={{ position: 'absolute', right: 8, top: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, zIndex: 12, opacity: dragKey ? 0 : 1, transform: dragKey ? 'translateX(12px)' : 'none', transition: 'opacity 0.16s ease, transform 0.2s ease', pointerEvents: dragKey ? 'none' : undefined, ...(railMore ? { padding: '4px 4px 4px 14px', borderRadius: 18, background: 'linear-gradient(270deg, rgba(0,0,0,0.5), rgba(0,0,0,0))' } : null) }}>
                {shown.map(one)}
                {rest.length > 0 && (
                  <div role="button" aria-label={railMore ? 'Fewer tools' : 'More tools'} aria-expanded={railMore} onClick={() => { hapticTap(); setRailMore((v) => !v); }} className="zchat-press"
                    style={{ width: 40, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: railMore ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                )}
              </div>
            );
          })()
        )}
        {mode === 'draw' && <EditorSizeRail label="Brush size" value={brushSize} min={2} max={40} onChange={setBrushSize} />}
        {mode === 'blur' && <EditorSizeRail label="Blur brush size" value={blurSize} min={14} max={96} onChange={setBlurSize} />}
        {filterFlash && (mode === 'view' || mode === 'filter') && PHOTO_FILTERS[filterFlash.i] && (
          <div key={filterFlash.n} className="zchat-filter-flash" role="status" style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% - 34px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none', zIndex: 14 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', textShadow: '0 2px 18px rgba(0, 0, 0, 0.5)' }}>{PHOTO_FILTERS[filterFlash.i].label}</div>
            <div style={{ display: 'flex', gap: 5 }}>{PHOTO_FILTERS.map((f, i) => (f.g === PHOTO_FILTERS[filterFlash.i].g ? <span key={f.k} style={{ width: i === filterFlash.i ? 14 : 5, height: 5, borderRadius: 3, background: i === filterFlash.i ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)' }} /> : null))}</div>
          </div>
        )}
        {layerHint && mode === 'view' && !dragKey && <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', bottom: 26, transform: 'translateX(-50%)', zIndex: 13, padding: '9px 15px', borderRadius: 18, background: 'rgba(18, 18, 24, 0.72)', color: '#FFFFFF', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', maxWidth: 'calc(100% - 32px)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{layerHint}</div>}
      </div>

      {mode === 'crop' && (
        <div style={{ padding: '6px 14px 0', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <StudioDark>
            <PickTiles label="Crop shape" size={50} fit ringBg="#000000" value={cropAspect == null ? 'free' : String(cropAspect)}
              onChange={(k) => applyAspect(k === 'free' ? null : Number(k))}
              options={[['free', 'Free', null, 'crop_free'], ['1', 'Square', '1:1', 'size_square'], ['0.8', 'Portrait', '4:5', 'size_portrait'], [String(16 / 9), 'Wide', '16:9', 'size_wide']].map(([k, label, sub, g]) => ({ k, label, sub, aria: `Crop ${label}`, art: g === 'size_square' || g === 'size_portrait' ? <KitGlyph k={g} size={30} /> : <StudioGlyph k={g} size={30} /> }))} />
          </StudioDark>
        </div>
      )}

      {mode === 'draw' && (
        <div style={{ padding: '4px 10px 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div role="radiogroup" aria-label="Brush" style={{ display: 'flex', justifyContent: 'space-around' }}>
            {DRAW_BRUSHES.map(([k, label]) => {
              const on = brushKind === k;
              return (
                <div key={k} role="radio" aria-checked={on} aria-label={label} onClick={() => { hapticTap(); setBrushKind(k); }} className="zchat-press"
                  style={{ flex: '1 1 0', minWidth: 0, maxWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '4px 0', cursor: 'pointer', color: '#FFFFFF', opacity: on ? 1 : 0.55, transition: 'opacity 160ms ease', WebkitTapHighlightColor: 'transparent' }}>
                  <div style={{ height: 26, display: 'flex', alignItems: 'center' }}><DrawBrushSample k={k} color={brushColor} /></div>
                  <div style={{ fontSize: 11.5, lineHeight: '14px', fontWeight: on ? 700 : 600, whiteSpace: 'nowrap' }}>{label}</div>
                  <div aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 2, background: on ? theme.gold : 'transparent', transition: 'background 160ms ease' }} />
                </div>
              );
            })}
          </div>
          <div style={{ minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {brushKind === 'erase'
              ? <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>Rub over your drawing to erase it</div>
              : colorRow(brushColor, setBrushColor)}
          </div>
        </div>
      )}

      {mode === 'blur' && (
        <div style={{ padding: '6px 14px 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {faceFinderOk() && (
            <div role="button" aria-label="Find and blur faces" onClick={findFaces} className="zchat-press" style={{ height: 42, padding: '0 18px', borderRadius: 21, background: '#FFFFFF', color: '#000000', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
              {faceBusy ? <Spinner size={15} color="#000000" /> : <BlurFaceIcon size={18} />}{faceBusy ? 'Looking for faces' : 'Find faces'}
            </div>
          )}
          <div role="status" style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.72)', textAlign: 'center', minHeight: 18, lineHeight: 1.4 }}>{faceNote || 'Paint over faces or anything private. The blur is saved into the photo you send.'}</div>
        </div>
      )}
      {mode === 'meme' && (
        <div style={{ padding: '6px 12px 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {[['top', 'Top text', 'next'], ['bot', 'Bottom text', 'done']].map(([k, ph, hint]) => (
            <input key={k} value={meme[k]} onChange={(e) => memeSet(k, e.target.value)} placeholder={ph} aria-label={ph} autoCapitalize="characters" enterKeyHint={hint} maxLength={80}
              onKeyDown={(e) => { if (e.key === 'Enter' && k === 'bot') finishMeme(); }}
              style={{ height: 46, minWidth: 0, padding: '0 18px', borderRadius: 23, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.14)', color: 'white', fontFamily: FONT, fontSize: 16 }} />
          ))}
          <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>Tap Done, then drag the words to move them or pinch to resize</div>
        </div>
      )}
      {mode === 'filter' && (
        <div style={{ padding: '10px 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          <FilterStrip value={cur.filter} big src={cur.url} video={cur.kind === 'video'} onPick={(k) => updateItem(cur.id, { filter: k })} />
          <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', paddingTop: 12 }}>Swipe the photo to try them</div>
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
        <div style={{ flexShrink: 0, paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', opacity: dragKey ? 0 : 1, visibility: textDraft ? 'hidden' : 'visible', transition: 'opacity 0.16s ease', pointerEvents: dragKey ? 'none' : undefined }}>
          {items.length > 1 && (
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px 4px', overflowX: 'auto' }}>
              {items.map((it, i) => (
                <div key={it.id} onClick={() => setIndex(i)} style={{
                  position: 'relative', width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                  border: i === index ? '2px solid white' : '2px solid transparent', boxSizing: 'border-box',
                }}>
                  {it.kind === 'image'
                    ? <img src={it.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <VideoThumb src={it.url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {mentions.map((mn) => (
                <div key={`${mn.kind}-${mn.id}`} role="button" aria-label={`Remove mention ${mn.label}`} onClick={() => setMentions((prev) => prev.filter((x) => !(x.id === mn.id && x.kind === mn.kind)))} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 13, fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  {mn.kind === 'group' ? <Users size={14} /> : <AtSign size={14} />}{mn.label}<X size={14} style={{ opacity: 0.5, marginLeft: 1 }} />
                </div>
              ))}
            </div>
          )}
          {place && (
            <div style={{ display: 'flex', padding: '8px 16px 0' }}>
              <div role="button" aria-label={`Remove place ${place.n}`} onClick={() => setPlace(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}><MapPinIcon size={14} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.n}</span><X size={14} style={{ opacity: 0.5, marginLeft: 1, flexShrink: 0 }} /></div>
            </div>
          )}
          {isPost && storySong && (
            <div style={{ display: 'flex', padding: '8px 16px 0' }}>
              <div role="button" aria-label={`Remove music ${storySong.t}`} onClick={() => { setStorySong(null); stopSong(); }} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}><MusicNoteIcon size={14} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{storySong.a ? `${storySong.t}, ${storySong.a}` : storySong.t}</span><X size={14} style={{ opacity: 0.5, marginLeft: 1, flexShrink: 0 }} /></div>
            </div>
          )}
          {isPost && collab && (
            <div style={{ display: 'flex', padding: '8px 16px 0' }}>
              <div role="button" aria-label="Remove collaborator" onClick={() => setCollab(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer' }}><UserPlus size={14} />With {collab.name}<X size={14} style={{ opacity: 0.5, marginLeft: 1 }} /></div>
            </div>
          )}
          {(isPost || isStory) && <TagSuggestBar text={caption} onPick={(tag, typed) => setCaption(applyTagPick(caption, typed, tag).slice(0, MAX_CHARS))} />}
          {!isPost && !isStory && (
            <div style={{ display: 'flex', gap: 2, padding: '6px 6px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { k: 'once', toggle: true, on: once, label: 'View once', aria: once ? 'View once on' : 'View once off', icon: <OnceIcon size={20} color="currentColor" used={once} />, tap: () => { setOnce((v) => { if (!v) { setHideIt(false); setAlbum(null); } return !v; }); } },
                { k: 'hidden', toggle: true, on: hideIt, label: 'Hidden', aria: hideIt ? 'Hidden photo on' : 'Hidden photo off', icon: <HiddenPhotoIcon size={19} color="currentColor" />, tap: () => { setHideIt((v) => { if (!v) { setOnce(false); setAlbum(null); } return !v; }); } },
                albumCtx ? { k: 'album', toggle: true, on: !!album, label: album ? String(album.title || 'Album').slice(0, 22) : 'Album', aria: album ? `Adding to the album ${album.title}` : 'Add to a shared album', icon: <AlbumIcon size={19} color="currentColor" />, tap: () => { if (album) setAlbum(null); else setAlbumPick(true); } } : null,
              ].filter(Boolean).map(optBtn)}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 0' }}>
            <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, MAX_CHARS))} placeholder={isPost ? 'Write a caption' : 'Add a caption'}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isTouchDevice()) { e.preventDefault(); send(); } }}
              style={{ flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: 24, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.14)', color: 'white', fontFamily: FONT, fontSize: 15 }} />
            {isPost ? (
              <div onPointerDown={(e) => e.preventDefault()} onClick={send} role="button" aria-label="Share post" style={{
                height: 48, padding: '0 18px', borderRadius: 24, background: theme.coral, color: 'white', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, fontWeight: 800, fontSize: 14,
              }}>{sending ? <Spinner size={16} /> : scheduleAt ? <><Clock size={17} color="white" /> Schedule</> : <><ImageIcon size={17} color="white" /> Share post</>}</div>
            ) : isStory ? (
              <>
                <div onPointerDown={(e) => e.preventDefault()} onClick={() => { closeShareRef.current = false; send(); }} role="button" aria-label={sharedTo ? `Add to ${sharedTo.title}` : storyAud ? `Share with ${storyAud.name}` : 'Share to your story'} style={{
                  height: 48, padding: '0 16px', borderRadius: 24, background: 'white', color: '#000', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0, fontWeight: 800, fontSize: 14, maxWidth: 190, boxSizing: 'border-box',
                }}>{sending && !closeShareRef.current ? <Spinner size={16} color="#000" /> : <>{sharedTo ? <SharedStoryIcon size={17} color="#000" /> : storyAud && storyAud.k !== 'close' ? <StoryListIcon size={17} color="#000" /> : <StatusIcon size={17} color="#000" />}<span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sharedTo ? sharedTo.title : storyAud ? storyAud.name : 'Your story'}</span></>}</div>
                {!sharedTo && <CloseShareButton count={closeCount} size={48} disabled={sending} busy={sending && closeShareRef.current} onEmpty={() => setCloseEdit(true)} onShare={() => { closeShareRef.current = true; send(); }} />}
              </>
            ) : (
              <div onPointerDown={(e) => e.preventDefault()} onClick={send} role="button" aria-label="Send" style={{
                width: 48, height: 48, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}>{sending ? <Spinner size={18} /> : <Send size={20} color="white" style={{ marginLeft: -2 }} />}</div>
            )}
          </div>
          {isPost && (
            <div style={{ display: 'flex', gap: 2, padding: '8px 6px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {postX && postX.opts.map(optBtn)}
              {[
                { k: 'schedule', on: !!scheduleAt, wide: !!scheduleAt, label: scheduleAt ? fmtSchedule(scheduleAt).replace(/^./, (s) => s.toUpperCase()) : 'Schedule', aria: scheduleAt ? `Scheduled for ${fmtSchedule(scheduleAt)}` : 'Schedule post', icon: <StudioGlyph k="schedule" size={22} />, tap: () => setSchedOpen(true) },
                sensColOk ? { k: 'sensitive', toggle: true, on: markSens, label: 'Sensitive', aria: markSens ? 'Marked as sensitive' : 'Mark as sensitive', icon: <HiddenPhotoIcon size={19} color="currentColor" />, tap: () => setMarkSens((v) => !v) } : null,
                canDraft ? { k: 'draft', on: false, label: 'Save draft', aria: 'Save draft', icon: <StudioGlyph k="draft" size={22} />, tap: async () => { if (await keepDraft()) { setDraftNote('Draft saved'); setTimeout(() => setDraftNote(''), 1600); } } } : null,
              ].filter(Boolean).map(optBtn)}
            </div>
          )}
          {isPost
            ? <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', padding: '6px 18px 0' }}>{scheduleAt ? `Goes up ${fmtSchedule(scheduleAt)}. Only you can see it until then.` : items.length > 1 ? `All ${items.length} go in one post, people swipe through them` : collab ? `Shows on your profile, and on ${collab.name.split(' ')[0]}'s once they accept` : 'Shows on your profile and in Vibes'}</div>
            : isStory
            ? (sharedTo ? <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', padding: '6px 18px 0' }}>Everyone in {sharedTo.title} sees it until the shared story ends</div> : <StoryShareHint closeCount={closeCount} aud={storyAud} listsOn={storyLists !== null} onEditClose={() => setCloseEdit(true)} onAudience={() => setAudOpen(true)} />)
            : recipientName && <div style={{ fontSize: 11.5, color: once || hideIt || album ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: once || hideIt || album ? 700 : 400, padding: '6px 18px 0' }}>{album ? `Goes into the album ${album.title}, everyone in the chat can see it` : `To ${recipientName}${once ? ', opens once' : hideIt ? ', hidden until they tap' : ''}`}</div>}
          {isPost && markSens && <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.6)', padding: '2px 18px 0' }}>Marked sensitive, people see it blurred until they tap</div>}
          {closeEdit && <CloseFriendsPicker myId={myId} zIndex={700} onClose={() => { setCloseEdit(false); reloadClose(); }} />}
        </div>
      )}
      {schedOpen && <SchedulePostSheet value={scheduleAt} onClose={() => setSchedOpen(false)} onPick={(iso) => { setScheduleAt(iso); setSchedOpen(false); }} />}
      {postX && postX.sheets}
      {albumPick && albumCtx && <AlbumPickSheet chatKey={albumCtx.chatKey} userId={albumCtx.userId} zIndex={800} subtitle="Your photos go into it and the chat gets a card" onClose={() => setAlbumPick(false)} onPick={(a) => { setAlbumPick(false); setAlbum({ id: a.id, title: a.title }); setOnce(false); setHideIt(false); hapticTap(); }} />}
      {placePick && <PlacePicker uid={myId} onClose={() => setPlacePick(false)} onPick={(p) => { setPlacePick(false); setPlace(p); hapticTap(); }} />}
      {audOpen && <StoryAudienceSheet uid={myId} value={storyAud ? storyAud.k : 'all'} closeCount={closeCount} onClose={() => setAudOpen(false)} onEditClose={() => { setAudOpen(false); setCloseEdit(true); }}
        onPick={(k, l) => { setAudOpen(false); hapticTap(); setStoryAud(k === 'all' ? null : { k, name: k === 'close' ? 'Close friends' : l.name }); }} />}
      {askClose && (
        <ActionSheet title="Save as draft?" onClose={() => setAskClose(false)} zIndex={900} items={[
          { k: 'draft', label: 'Save draft', icon: <Download />, on: async () => { setAskClose(false); if (await keepDraft()) { sentRef.current = false; onCancel(); } } },
          { k: 'discard', label: draftIdRef.current ? 'Leave without saving' : 'Discard', icon: <Trash2 />, danger: true, on: () => { setAskClose(false); onCancel(); } },
        ]} />
      )}
      {draftNote && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: 'calc(74px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 30, padding: '8px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.92)', color: '#111', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{draftNote}</div>}

      {isStory && storySticker && storySticker.k === 'moment' && mode === 'view' && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(76px + env(safe-area-inset-top))', display: 'flex', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
          <StoryStickerPreview sticker={storySticker} />
        </div>
      )}
      {musicPick && <MusicPicker country={country} title={isPost ? 'Music for your post' : 'Music for your story'} onClose={() => setMusicPick(false)} onPick={(sg) => {
        setMusicPick(false);
        const had = !!storySong;
        if (isPost) setStorySong({ ...sg });
        else setStorySong({ ...sg, pos: storySong && storySong.pos ? storySong.pos : { x: 0.5, y: 0.2, s: 1, r: 0 }, look: storySong && storySong.look ? storySong.look : 'pill' });
        stopSong();
        playSong(sg, true);
        songAutoRef.current = sg.id;
        if (!had && !isPost) showLayerHint('song', 'Tap the music to change its look');
      }} />}
      {stickerEdit && <StoryStickerEditor onClose={() => setStickerEdit(false)} onDone={(sk) => { const had = !!storySticker; setStorySticker(stickerWithPos({ ...sk, pos: storySticker && storySticker.pos ? storySticker.pos : undefined })); setStickerEdit(false); if (!had) showLayerHint('card', 'Drag it anywhere. Drop it on the bin to remove it.'); }} />}
      {pickCollab && myId && <PickPeoplePage userId={myId} title="Invite a collaborator" subtitle="They accept to show it on their profile too" multi={false} onClose={() => setPickCollab(false)} onDone={(list) => { setCollab(list[0] || null); setPickCollab(false); }} zIndex={760} />}
      {showStickerPicker && (
        <div onClick={() => setShowStickerPicker(false)} style={{ position: 'absolute', inset: 0, zIndex: 8, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', height: '60%', background: '#11151F', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>Stickers</span>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setShowStickerPicker(false)} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: '0 12px 14px' }}>
              {orderStickersForPick().map((stk) => (
                <div key={stk.key} onClick={() => {
                  setShowStickerPicker(false);
                  const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
                  const id = `s${Date.now()}`;
                  updateItem(cur.id, (it) => ({ stickers: [...(it.stickers || []), { id, src: stk.file, x: r.x + r.w / 2, y: r.y + r.h / 2, size: 0.32, r: 0 }] }));
                  showLayerHint('sticker', 'Pinch to resize. Drop it on the bin to remove it.');
                }} style={{ aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 14, background: 'rgba(255,255,255,0.05)' }}>
                  <img src={stk.file} alt="" loading="lazy" draggable={false} style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showMentionPicker && (
        <StoryMentionPicker myId={myId} groups={mentionGroups} privacyCtx={privacyCtx} onClose={() => setShowMentionPicker(false)}
          onPick={(mn) => {
            setShowMentionPicker(false);
            setMentions((prev) => (prev.some((x) => x.id === mn.id && x.kind === mn.kind) ? prev : [...prev, mn]));
            const r = cur.crop || { x: 0, y: 0, w: 1, h: 1 };
            updateItem(cur.id, (it) => ({ texts: [...it.texts, { id: `m${Date.now()}`, text: `@${mn.label}`, color: '#FFFFFF', size: 0.06, font: 'classic', bg: 'solid', align: 'center', r: 0, mention: { id: mn.id, kind: mn.kind }, x: r.x + r.w / 2, y: r.y + r.h * (0.62 + Math.min(0.24, it.texts.length * 0.08)) }] }));
          }} />
      )}
      {restyle && cur && cur.kind === 'image' && <RestyleSheet item={cur} onClose={() => setRestyle(false)} onUse={(file, w, h) => { const old = cur.url; updateItem(cur.id, { file, url: URL.createObjectURL(file), width: w, height: h }); setRestyle(false); setTimeout(() => { try { URL.revokeObjectURL(old); } catch {} }, 4000); }} />}
      {textDraft && (
        <TextLayerEditor draft={textDraft} innerW={innerW} frameW={frameW} areaW={stage.w || (typeof window !== 'undefined' ? window.innerWidth : 390)}
          onChange={(patch) => setTextDraft((d) => (d ? { ...d, ...patch } : d))}
          onLines={(ls) => { textLinesRef.current = ls; }}
          onDone={saveText} />
      )}
    </div>
  );
}

const COVER_BGS = [['#7C5CFC', 'Purple'], ['#16161C', 'Black'], ['#FFFFFF', 'White'], ['#F2A7BE', 'Rose'], ['#F6D35B', 'Butter'], ['#0F8B83', 'Teal'], ['#3B82C4', 'Sky'], ['#E8573F', 'Coral']];
export function HighlightCoverEditor({ userId, highlight, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const meta0 = highlight.cover_meta && typeof highlight.cover_meta === 'object' ? highlight.cover_meta : null;
  const [items, setItems] = useState(null);
  const [src, setSrc] = useState(null);
  const [dim, setDim] = useState(null);
  const [dur, setDur] = useState(0);
  const [t, setT] = useState(meta0 && Number.isFinite(meta0.t) ? meta0.t : 0);
  const [z, setZ] = useState(meta0 && Number.isFinite(meta0.z) ? meta0.z : 1);
  const [off, setOff] = useState(meta0 && Number.isFinite(meta0.x) && Number.isFinite(meta0.y) ? { x: meta0.x, y: meta0.y } : { x: 0, y: 0 });
  const [bg, setBg] = useState(meta0 && /^#[0-9A-F]{6}$/i.test(meta0.bg || '') ? meta0.bg : '#7C5CFC');
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const fileRef = useRef(null);
  const mediaRef = useRef(null);
  const dragRef = useRef(null);
  const D = Math.min(260, typeof window !== 'undefined' ? window.innerWidth - 100 : 260);
  useEffect(() => {
    let alive = true;
    supabase.from('highlight_items').select('*').eq('highlight_id', highlight.id).order('created_at', { ascending: true }).limit(100).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setFail(loadFailCode(error)); return; }
      const list = data || [];
      setItems(list);
      const start = (meta0 && list.find((x) => x.id === meta0.src)) || list[0];
      if (start) setSrc({ id: start.id, url: start.media_url, video: start.media_type === 'video' });
      else if (highlight.cover_url) setSrc({ id: 'cover', url: highlight.cover_url, video: highlight.cover_type === 'video' });
    }, () => { if (alive) setFail(''); });
    return () => { alive = false; };
  }, [highlight.id, tick]);
  useEffect(() => () => { if (src && src.blob) URL.revokeObjectURL(src.url); }, [src && src.url]);
  const pickSource = (s) => { hapticTap(); setDim(null); setDur(0); setT(0); setZ(1); setOff({ x: 0, y: 0 }); setSrc(s); };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f || !/^image\//.test(f.type || '')) return;
    pickSource({ id: 'upload', url: URL.createObjectURL(f), video: false, blob: true });
  };
  const base = dim ? Math.max(D / dim.w, D / dim.h) : 1;
  const w = dim ? dim.w * base * z : D;
  const h = dim ? dim.h * base * z : D;
  const left = (D - w) / 2 + off.x * D;
  const top = (D - h) / 2 + off.y * D;
  const clampOff = (o, zz) => {
    if (!dim) return o;
    const ww = dim.w * base * zz;
    const hh = dim.h * base * zz;
    const mx = Math.max(0, (ww - D) / 2 + D * 0.25) / D;
    const my = Math.max(0, (hh - D) / 2 + D * 0.25) / D;
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const down = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const d = dragRef.current || { pts: new Map() };
    d.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.pts.size === 1) { d.sx = e.clientX; d.sy = e.clientY; d.o = off; }
    if (d.pts.size === 2) { const [a, b] = [...d.pts.values()]; d.dist = Math.hypot(a.x - b.x, a.y - b.y); d.z = z; }
    dragRef.current = d;
  };
  const move = (e) => {
    const d = dragRef.current;
    if (!d || !d.pts.has(e.pointerId)) return;
    d.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.pts.size >= 2 && d.dist) {
      const [a, b] = [...d.pts.values()];
      const nz = Math.max(0.5, Math.min(3, d.z * (Math.hypot(a.x - b.x, a.y - b.y) / d.dist)));
      setZ(nz);
      setOff((o) => clampOff(o, nz));
      return;
    }
    setOff(clampOff({ x: d.o.x + (e.clientX - d.sx) / D, y: d.o.y + (e.clientY - d.sy) / D }, z));
  };
  const up = (e) => {
    const d = dragRef.current;
    if (!d) return;
    d.pts.delete(e.pointerId);
    if (d.pts.size === 1) { const [p] = [...d.pts.values()]; d.sx = p.x; d.sy = p.y; d.o = off; d.dist = 0; }
    if (!d.pts.size) dragRef.current = null;
  };
  const onWheel = (e) => { const nz = Math.max(0.5, Math.min(3, z * (e.deltaY < 0 ? 1.08 : 0.93))); setZ(nz); setOff((o) => clampOff(o, nz)); };
  const seek = (v) => { setT(v); const el = mediaRef.current; if (el && src && src.video) { try { el.currentTime = v; } catch {} } };
  const save = async () => {
    const el = mediaRef.current;
    if (!el || !dim || busy) return;
    setBusy(true);
    const S = 360;
    const k = S / D;
    const cv = document.createElement('canvas');
    cv.width = S;
    cv.height = S;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);
    let blob = null;
    try {
      ctx.drawImage(el, left * k, top * k, w * k, h * k);
      blob = await new Promise((r) => cv.toBlob((b) => r(b), 'image/jpeg', 0.9));
    } catch { blob = null; }
    if (!blob) { setBusy(false); appSnack('That picture cannot be used as a cover. Try another one.'); return; }
    const file = new File([blob], `cover-${Date.now().toString(36)}.jpg`, { type: 'image/jpeg' });
    const local = URL.createObjectURL(blob);
    const meta = { src: src.id === 'upload' || src.id === 'cover' ? src.id : src.id, t: Math.round(t * 100) / 100, z: Math.round(z * 1000) / 1000, x: Math.round(off.x * 1000) / 1000, y: Math.round(off.y * 1000) / 1000, bg };
    onSaved({ ...highlight, cover_url: local, cover_type: 'image', cover_meta: meta, __local: true });
    onClose();
    const { url, error } = await uploadMedia(file, userId);
    if (error || !url) { onSaved(highlight); appSnack('The new cover did not save. Try again.'); return; }
    let { error: upErr } = await supabase.from('highlights').update({ cover_url: url, cover_type: 'image', cover_meta: meta }).eq('id', highlight.id).eq('user_id', userId);
    if (upErr && /cover_meta|column|schema/i.test(String(upErr.message || ''))) ({ error: upErr } = await supabase.from('highlights').update({ cover_url: url, cover_type: 'image' }).eq('id', highlight.id).eq('user_id', userId));
    if (upErr) { onSaved(highlight); appSnack(friendlyError(upErr, 'The new cover did not save. Try again.')); return; }
    onSaved({ ...highlight, cover_url: url, cover_type: 'image', cover_meta: meta });
    setTimeout(() => URL.revokeObjectURL(local), 4000);
  };
  const tile = (key, label, active, onClick, content) => (
    <div key={key} role="radio" aria-checked={active} aria-label={label} onClick={onClick} className="zchat-press" style={{ width: 54, height: 72, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: theme.soft, boxShadow: active ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}>{content}</div>
  );
  return (
    <FullPage title="Edit cover" subtitle={highlight.title} onBack={onClose} zIndex={760}
      right={<div role="button" aria-label="Save cover" onClick={save} style={{ padding: '0 12px', height: 40, display: 'flex', alignItems: 'center', fontSize: 15.5, fontWeight: 700, color: dim && !busy ? theme.coral : theme.muted, cursor: dim ? 'pointer' : 'default' }}>{busy ? <Spinner size={16} color={theme.coral} /> : 'Done'}</div>}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 8px' }}>
        <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={onWheel} aria-label="Move and zoom the cover"
          style={{ position: 'relative', width: D, height: D, borderRadius: '50%', overflow: 'hidden', background: bg, touchAction: 'none', cursor: 'grab', boxShadow: `0 0 0 1px ${theme.border}`, transition: 'background 160ms ease' }}>
          {src && (src.video
            ? <video key={src.url} ref={mediaRef} src={src.url} crossOrigin="anonymous" muted playsInline preload="auto" onLoadedMetadata={(e) => { const v = e.currentTarget; setDim({ w: v.videoWidth || 720, h: v.videoHeight || 1280 }); setDur(Number.isFinite(v.duration) ? v.duration : 0); try { v.currentTime = Math.min(t, v.duration || 0); } catch {} }} style={{ position: 'absolute', left, top, width: w, height: h, pointerEvents: 'none' }} />
            : <img key={src.url} ref={mediaRef} src={src.url} crossOrigin="anonymous" alt="" draggable={false} onLoad={(e) => { const im = e.currentTarget; setDim({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 }); }} onError={() => setDim(null)} style={{ position: 'absolute', left, top, width: w, height: h, pointerEvents: 'none', userSelect: 'none' }} />)}
          {!dim && (src || (items === null && fail === null)) && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={20} color="#FFFFFF" /></div>}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center' }}>Drag to move, pinch or use the slider to zoom</div>
      <IgHeading>Zoom</IgHeading>
      <KitSlider label="Zoom" value={Math.round(z * 100)} min={50} max={300} onChange={(v) => { const nz = v / 100; setZ(nz); setOff((o) => clampOff(o, nz)); }} />
      {src && src.video && dur > 0.2 && (
        <>
          <IgHeading>Frame</IgHeading>
          <KitSlider label="Pick a frame" value={Math.round(t * 10)} min={0} max={Math.floor(dur * 10)} onChange={(v) => seek(v / 10)} />
        </>
      )}
      <IgHeading>Background</IgHeading>
      <div role="radiogroup" aria-label="Background colour" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 2px' }}>
        {COVER_BGS.map(([c, l]) => (
          <div key={c} role="radio" aria-checked={bg === c} aria-label={l} onClick={() => { hapticTap(); setBg(c); }} style={{ width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer', boxShadow: bg === c ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : `inset 0 0 0 1px ${theme.border}`, transition: 'box-shadow 160ms ease' }} />
        ))}
      </div>
      <div style={{ fontSize: 12, color: theme.muted, padding: '6px 2px 0' }}>Shows when you zoom out past the edges.</div>
      <IgHeading>Pick from</IgHeading>
      <div role="radiogroup" aria-label="Cover picture" style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '6px 4px 10px', margin: '0 -4px' }}>
        {tile('upload', 'Upload a picture', src && src.id === 'upload', () => fileRef.current && fileRef.current.click(), <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}><Plus size={20} />Upload</div>)}
        {items === null && fail === null && <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px' }}><Spinner size={16} color={theme.muted} /></div>}
        {(items || []).map((it) => tile(it.id, it.media_type === 'video' ? 'Video from this highlight' : 'Photo from this highlight', src && src.id === it.id, () => pickSource({ id: it.id, url: it.media_url, video: it.media_type === 'video' }),
          it.media_type === 'video' ? <VideoThumb src={it.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <img src={it.media_url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />))}
      </div>
      {items === null && fail !== null && <LoadFail small code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} />}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
    </FullPage>
  );
}

export function SocialLinksEditor({ links, onChange, whatsapp, onWhatsappChange, labelStyle, compact }) {
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
  const addForm = adding && (
    <div style={{ padding: 12, boxShadow: compact ? `inset 0 -0.5px 0 ${theme.hair}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SocialIcon platform={previewPlatform || 'website'} size={34} round />
        <input autoFocus value={draftUrl} inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="Paste your link, like instagram.com/you"
          onChange={(e) => { setDraftUrl(e.target.value); setErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          style={{ ...inputStyle(theme), flex: 1, ...(compact ? { background: theme.panelBg } : null) }} />
      </div>
      <input value={draftTitle} maxLength={30} placeholder="Title (optional)" onChange={(e) => setDraftTitle(e.target.value)} style={{ ...inputStyle(theme), marginTop: 8, ...(compact ? { background: theme.panelBg } : null) }} />
      {previewPlatform && <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 6 }}>Detected: <b style={{ color: theme.ink }}>{SOCIAL_PLATFORMS.find((p) => p.key === previewPlatform).label}</b></div>}
      {err && <div style={{ fontSize: 12, color: theme.danger, marginTop: 6, fontWeight: 600 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => { setAdding(false); setDraftUrl(''); setDraftTitle(''); setErr(''); }} style={{ flex: 1, padding: 10, borderRadius: 12, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.ink, fontWeight: 700, fontFamily: FONT, cursor: 'pointer' }}>Cancel</button>
        <button onClick={add} style={{ flex: 1, padding: 10, borderRadius: 12, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontFamily: FONT, cursor: 'pointer' }}>Add</button>
      </div>
    </div>
  );
  if (compact) {
    const hair = `inset 0 -0.5px 0 ${theme.hair}`;
    return (
      <>
        <EfGroup title={list.length ? `Links, ${list.length} of ${SOCIAL_MAX}` : 'Links'}>
          {list.map((l, i) => (
            <div key={l.url} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58, padding: '0 6px 0 14px', boxShadow: hair }}>
              <LinkThumb url={l.url} platform={l.platform} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.title || socialLinkLabel(l.url, l.platform)}</div>
                <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.url.replace(/^https?:\/\//, '')}</div>
              </div>
              <div role="button" aria-label="Remove link" onClick={() => onChange(list.filter((_, idx) => idx !== i).map((x) => ({ url: x.url, title: x.title })))} className="zchat-press" style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          ))}
          {!adding && list.length < SOCIAL_MAX && (
            <div role="button" onClick={() => setAdding(true)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54, padding: '0 14px', cursor: 'pointer', boxShadow: hair }}>
              <span style={{ width: 36, height: 36, borderRadius: '50%', background: theme.soft2, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></svg>
              </span>
              <span style={{ fontSize: 15, fontWeight: 650, color: theme.ink }}>Add link</span>
            </div>
          )}
          {addForm}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58, padding: '0 14px' }}>
            <SocialIcon platform="whatsapp" size={36} round />
            <input value={whatsapp} inputMode="tel" placeholder="WhatsApp number with country code" aria-label="WhatsApp number" onChange={(e) => onWhatsappChange(cleanWhatsappNumber(e.target.value))}
              style={{ flex: 1, minWidth: 0, height: 48, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15.5, padding: 0 }} />
          </div>
        </EfGroup>
        {whatsapp ? <div style={{ fontSize: 12, color: theme.muted, padding: '6px 4px 0', lineHeight: 1.4 }}>Everyone who can see your profile can see this number.</div> : null}
      </>
    );
  }
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}><span>Links</span><span style={{ fontWeight: 600 }}>{list.length}/{SOCIAL_MAX}</span></div>
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
            <span style={{ display: 'flex', color: theme.ink }}><Plus size={22} strokeWidth={1.6} /></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>Add link</span>
          </div>
        )}
        {addForm}
      </div>
      <div style={{ ...labelStyle, marginTop: 14 }}>WhatsApp number</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SocialIcon platform="whatsapp" size={38} round />
        <input value={whatsapp} inputMode="tel" placeholder="Country code and number" onChange={(e) => onWhatsappChange(cleanWhatsappNumber(e.target.value))} style={{ ...inputStyle(theme), flex: 1 }} />
      </div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 5 }}>Include your country code. Everyone who can see your profile can see this number.</div>
    </div>
  );
}
async function saveDraft(draft) {
  if (draft && draft.id && Array.isArray(draft.items)) {
    const prev = await mediaDbOp('drafts', 'readonly', (s) => s.get(draft.id));
    if (prev && Array.isArray(prev.items)) draft = { ...draft, thumbPath: draft.thumbPath || prev.thumbPath, synced: prev.synced, items: draft.items.map((it, i) => { const p = prev.items[i]; return !it.path && p && p.path && p.file && it.file && p.file.size === it.file.size ? { ...it, path: p.path } : it; }) };
  }
  const ok = await mediaDbOp('drafts', 'readwrite', (s) => s.put(draft));
  if (ok && draft && draft.uid) draftPushSoon(draft);
  return ok;
}
function draftPushSoon(rec) {
  draftSync.uid = rec.uid;
  const old = draftSync.timers.get(rec.id);
  if (old) clearTimeout(old);
  draftSync.timers.set(rec.id, setTimeout(() => { draftSync.timers.delete(rec.id); pushDraft(rec.id).then((ok) => { if (ok) announceDrafts(); }); }, 500));
}
function videoFrameEl(url, at) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let done = false;
    const end = (ok) => { if (done) return; done = true; clearTimeout(t); resolve(ok ? v : null); };
    const t = setTimeout(() => end(false), 5000);
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.crossOrigin = 'anonymous';
    v.onloadeddata = () => { try { v.currentTime = Math.min(at, Math.max(0, (v.duration || 1) / 2)); } catch { end(true); } };
    v.onseeked = () => end(true);
    v.onerror = () => end(false);
    v.src = url;
  });
}
async function draftThumbBlob(it) {
  if (!it || !it.file || typeof document === 'undefined') return null;
  const url = URL.createObjectURL(it.file);
  try {
    const src = it.kind === 'video' ? await videoFrameEl(url, 0.1) : await loadImageElement(url);
    if (!src) return null;
    const sw = src.videoWidth || src.naturalWidth || 0;
    const sh = src.videoHeight || src.naturalHeight || 0;
    if (!sw || !sh) return null;
    const W = 240;
    const H = 320;
    const k = Math.max(W / sw, H / sh);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.drawImage(src, (W - sw * k) / 2, (H - sh * k) / 2, sw * k, sh * k);
    return await new Promise((r) => { try { cv.toBlob((b) => r(b), 'image/jpeg', 0.8); } catch { r(null); } });
  } catch { return null; } finally { URL.revokeObjectURL(url); }
}
async function pushDraft(id) {
  if (draftSync.off) return false;
  const rec = await mediaDbOp('drafts', 'readonly', (s) => s.get(id));
  if (!rec || !rec.uid || !Array.isArray(rec.items)) return false;
  const uid = rec.uid;
  const base = `${uid}/drafts/${rec.id}`;
  const put = (path, body, type) => supabase.storage.from('chat-private').upload(path, body, { contentType: type, cacheControl: '31536000' }).then(({ error }) => (error ? null : path), () => null);
  const itemJobs = rec.items.map((it, i) => {
    if (typeof it.path === 'string' && it.path.indexOf(`${base}/`) === 0) return Promise.resolve(it.path);
    if (!it.file) return Promise.resolve(null);
    return put(`${base}/${i}-${Math.random().toString(36).slice(2, 8)}.${draftExt(it.file, it.kind)}`, safeUploadFile(it.file), safeUploadType(it.file.type));
  });
  const oldThumb = typeof rec.thumbPath === 'string' && rec.thumbPath.indexOf(`${base}/`) === 0 ? rec.thumbPath : null;
  const thumbJob = oldThumb ? Promise.resolve(oldThumb) : draftThumbBlob(rec.items[0]).then((tb) => (tb ? put(`${base}/thumb-${Math.random().toString(36).slice(2, 6)}.jpg`, tb, 'image/jpeg') : null), () => null);
  const [paths, thumb] = await Promise.all([Promise.all(itemJobs), thumbJob]);
  if (paths.some((p) => !p)) return false;
  const items = rec.items.map((it, i) => { const { file, ...meta } = it; return { ...meta, path: paths[i] }; });
  const data = { caption: rec.caption || '', collab: rec.collab || null, sensitive: !!rec.sensitive, place: rec.place || null, sticker: rec.sticker || null, song: rec.song || null, mentions: rec.mentions || [], shared: rec.shared || null, at: rec.at, items };
  let body = data;
  try { if (JSON.stringify(data).length > 280000) body = { ...data, items: items.map((x) => ({ kind: x.kind, path: x.path, width: x.width, height: x.height, duration: x.duration, crop: x.crop, filter: x.filter, trimStart: x.trimStart, trimEnd: x.trimEnd })) }; } catch { return false; }
  const { error } = await supabase.from('zchat_drafts').upsert({ user_id: uid, id: rec.id, kind: rec.kind === 'story' ? 'story' : 'post', data: body, thumb }, { onConflict: 'user_id,id' });
  if (error) { if (draftMissing(error)) draftSync.off = true; return false; }
  const still = await mediaDbOp('drafts', 'readonly', (s) => s.get(id));
  if (still) await mediaDbOp('drafts', 'readwrite', (s) => s.put({ ...still, thumbPath: thumb, synced: Date.now(), items: still.items.map((x, i) => ({ ...x, path: x.path || (items[i] && items[i].path) })) }));
  draftSync.rows = null;
  return true;
}
async function draftCountAll(uid) { return (await listDraftsAll(uid)).length; }

const FOLDER_RULES = [
  ['groups', 'All groups', 'Every group you are in'],
  ['dms', 'All one to one chats', 'Every chat with a single person'],
  ['noMuted', 'Leave out muted chats', 'Muted chats stay out of this folder'],
  ['noRead', 'Leave out read chats', 'Only chats with new messages show here'],
];
const DT_ALPHA = { marker: 0.75, highlighter: 0.4 };
function dtAlphaOf(op) {
  if (op.t !== 'k' || op.e) return 1;
  return (DT_ALPHA[op.b] || 1) * (op.a > 0 && op.a < 1 ? op.a : 1);
}
function dtSeed(sid) {
  let h = 7;
  const str = String(sid || '');
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h || 7;
}
function dtCleanOp(raw, fallbackBy) {
  if (!raw || !raw.sid) return null;
  const num = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
  const col = /^#[0-9a-fA-F]{6}$/.test(String(raw.c || '')) ? String(raw.c) : '#111114';
  const t = raw.t === 'h' || raw.t === 'm' ? raw.t : 'k';
  const base = { t, sid: String(raw.sid).slice(0, 48), by: String(raw.by || fallbackBy || '') };
  if (t === 'h') {
    const kinds = PAINT_SHAPES.map((x) => x.k);
    return { ...base, k: kinds.includes(raw.k) ? raw.k : 'rect', c: col, w: num(raw.w, 0.002, 0.12, 0.02), f: raw.f ? 1 : 0, x0: num(raw.x0, 0, 1, 0), y0: num(raw.y0, 0, 1, 0), x1: num(raw.x1, 0, 1, 0), y1: num(raw.y1, 0, 1, 0) };
  }
  if (t === 'm') {
    const e = String(raw.e || '').slice(0, 16);
    if (!e) return null;
    return { ...base, e, x: num(raw.x, 0, 1, 0.5), y: num(raw.y, 0, 1, 0.5), z: num(raw.z, 0.03, 0.5, 0.1) };
  }
  const brushes = PAINT_BRUSHES.map((x) => x.k);
  return { ...base, b: brushes.includes(raw.b) ? raw.b : 'pen', c: raw.e ? '#000000' : col, w: num(raw.w, 0.002, 0.25, 0.02), a: num(raw.a, 0.05, 1, 1), s: Number.isFinite(Number(raw.s)) ? Number(raw.s) >>> 0 : dtSeed(raw.sid), e: raw.e ? 1 : 0, pts: [], done: false, rt: null };
}
function dtCleanPts(list) {
  const out = [];
  (Array.isArray(list) ? list : []).slice(0, 600).forEach((pt) => { if (Array.isArray(pt) && Number.isFinite(pt[0]) && Number.isFinite(pt[1])) out.push([Math.max(0, Math.min(1, pt[0])), Math.max(0, Math.min(1, pt[1]))]); });
  return out;
}
function dtStrokeRenderer(op, W, H) {
  const p = { brush: op.e ? 'pen' : op.b, color: op.e ? '#000000' : op.c, size: Math.max(1, op.w * W), seed: op.s || 7, sym: 'off', eraser: !!op.e, pts: op.pts.map((q) => [q[0] * W, q[1] * H, 0.5]) };
  return { p, r: makePaintRenderer(p, W, H) };
}
function dtPaintOne(ctx, op, W, H, scale, scratch) {
  if (op.t === 'h') { paintDrawShape(ctx, { kind: op.k, x0: op.x0 * W, y0: op.y0 * H, x1: op.x1 * W, y1: op.y1 * H, size: Math.max(1, op.w * W), color: op.c, fill: !!op.f }); return; }
  if (op.t === 'm') { paintDrawStamp(ctx, { emoji: op.e, x: op.x * W, y: op.y * H, size: op.z * W }); return; }
  if (!op.pts.length) return;
  const { r } = dtStrokeRenderer(op, W, H);
  const a = dtAlphaOf(op);
  if (a < 1 && scratch) {
    const sc = scratch.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0);
    sc.clearRect(0, 0, scratch.width, scratch.height);
    sc.setTransform(scale, 0, 0, scale, 0, 0);
    r(sc, null, true);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = a;
    ctx.drawImage(scratch, 0, 0);
    ctx.restore();
    return;
  }
  ctx.save();
  if (op.e) ctx.globalCompositeOperation = 'destination-out';
  r(ctx, null, true);
  ctx.restore();
}
function dtDrawBg(ctx, key, W, H) {
  const spec = PAINT_BACKGROUNDS.find((x) => x[0] === key) || PAINT_BACKGROUNDS[0];
  ctx.fillStyle = spec[1];
  ctx.fillRect(0, 0, W, H);
  const u = W / 1080;
  if (key === 'grid') {
    ctx.strokeStyle = 'rgba(80,90,120,0.18)';
    ctx.lineWidth = Math.max(1, 2 * u);
    for (let x = 45 * u; x < W; x += 45 * u) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 45 * u; y < H; y += 45 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (key === 'dots') {
    ctx.fillStyle = 'rgba(80,90,120,0.28)';
    for (let x = 30 * u; x < W; x += 40 * u) for (let y = 30 * u; y < H; y += 40 * u) { ctx.beginPath(); ctx.arc(x, y, Math.max(1, 3 * u), 0, Math.PI * 2); ctx.fill(); }
  } else if (key === 'lines') {
    ctx.strokeStyle = 'rgba(70,110,200,0.25)';
    ctx.lineWidth = Math.max(1, 2 * u);
    for (let y = 120 * u; y < H; y += 60 * u) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(230,80,90,0.35)';
    ctx.beginPath(); ctx.moveTo(110 * u, 0); ctx.lineTo(110 * u, H); ctx.stroke();
  }
}
const DT_TOOLS = [['brush', 'Brush'], ['eraser', 'Eraser'], ['shapes', 'Shapes'], ['stamp', 'Stickers']];
export function DrawTogetherPage({ id, me, onClose, onSendImage }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const c = igPalette(theme);
  const wrapRef = useRef(null);
  const viewRef = useRef(null);
  const L = useRef({ ink: null, bg: null, scratch: null, w: 0, h: 0, dpr: 1 });
  const opsRef = useRef(new Map());
  const orderRef = useRef([]);
  const mineRef = useRef([]);
  const tmpRef = useRef(new Set());
  const curRef = useRef(null);
  const previewRef = useRef(null);
  const flushRef = useRef(0);
  const rafRef = useRef(0);
  const gotAllRef = useRef(false);
  const chRef = useRef(null);
  const bgRef = useRef('white');
  const [tool, setTool] = useState('brush');
  const [brush, setBrush] = useState('pen');
  const [shape, setShape] = useState('rect');
  const [fill, setFill] = useState(false);
  const [stamp, setStamp] = useState(PAINT_STAMPS[0]);
  const [color, setColor] = useState('#111111');
  const [alpha, setAlpha] = useState(1);
  const [size, setSize] = useState(8);
  const [bgKey, setBgKey] = useState('white');
  const [sheet, setSheet] = useState(null);
  const [people, setPeople] = useState([]);
  const [sending, setSending] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [count, setCount] = useState(0);
  const [mineN, setMineN] = useState(0);
  const toolRef = useRef({});
  toolRef.current = { tool, brush, shape, fill, stamp, color, alpha, size };
  const mkCanvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  const compose = () => {
    rafRef.current = 0;
    const v = viewRef.current;
    const Lc = L.current;
    if (!v || !Lc.ink) return;
    const vc = v.getContext('2d');
    vc.setTransform(1, 0, 0, 1, 0, 0);
    vc.clearRect(0, 0, v.width, v.height);
    vc.drawImage(Lc.bg, 0, 0);
    vc.drawImage(Lc.ink, 0, 0);
    tmpRef.current.forEach((sid) => {
      const op = opsRef.current.get(sid);
      if (!op || !op.rt || !op.rt.tmp) return;
      vc.globalAlpha = dtAlphaOf(op);
      vc.drawImage(op.rt.tmp, 0, 0);
      vc.globalAlpha = 1;
    });
    if (previewRef.current) {
      vc.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
      dtPaintOne(vc, previewRef.current, Lc.w, Lc.h, Lc.dpr, null);
    }
  };
  const schedule = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(compose); };
  const liveRt = (op) => {
    if (op.rt) return op.rt;
    const Lc = L.current;
    const rt = dtStrokeRenderer(op, Lc.w, Lc.h);
    if (dtAlphaOf(op) < 1) { rt.tmp = mkCanvas(Lc.ink.width, Lc.ink.height); tmpRef.current.add(op.sid); }
    op.rt = rt;
    return rt;
  };
  const renderLive = (op, final) => {
    const Lc = L.current;
    if (!Lc.ink) return;
    const rt = liveRt(op);
    if (rt.tmp) {
      const tc = rt.tmp.getContext('2d');
      tc.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
      rt.r(tc, null, final);
      if (final) {
        const ic = Lc.ink.getContext('2d');
        ic.setTransform(1, 0, 0, 1, 0, 0);
        ic.globalAlpha = dtAlphaOf(op);
        ic.drawImage(rt.tmp, 0, 0);
        ic.globalAlpha = 1;
        tmpRef.current.delete(op.sid);
        rt.tmp = null;
      }
    } else {
      const ic = Lc.ink.getContext('2d');
      ic.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
      ic.save();
      if (op.e) ic.globalCompositeOperation = 'destination-out';
      rt.r(ic, null, final);
      ic.restore();
    }
    if (final) op.rt = null;
    schedule();
  };
  const redrawAll = () => {
    const Lc = L.current;
    if (!Lc.ink) return;
    const ic = Lc.ink.getContext('2d');
    ic.setTransform(1, 0, 0, 1, 0, 0);
    ic.clearRect(0, 0, Lc.ink.width, Lc.ink.height);
    tmpRef.current.clear();
    orderRef.current.forEach((sid) => {
      const op = opsRef.current.get(sid);
      if (!op) return;
      op.rt = null;
      if (op.t === 'k' && !op.done) { renderLive(op, false); return; }
      ic.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
      dtPaintOne(ic, op, Lc.w, Lc.h, Lc.dpr, Lc.scratch);
    });
    schedule();
  };
  const drawBgLayer = () => {
    const Lc = L.current;
    if (!Lc.bg) return;
    const bc = Lc.bg.getContext('2d');
    bc.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
    dtDrawBg(bc, bgRef.current, Lc.w, Lc.h);
    schedule();
  };
  const addOp = (op) => {
    if (opsRef.current.has(op.sid)) return opsRef.current.get(op.sid);
    opsRef.current.set(op.sid, op);
    orderRef.current.push(op.sid);
    setCount(orderRef.current.length);
    return op;
  };
  const addStrokePts = (op, pts) => {
    if (!pts.length) return;
    const wasDone = op.done;
    pts.forEach((q) => op.pts.push(q));
    if (wasDone) { redrawAll(); return; }
    if (op.rt) { const Lc = L.current; pts.forEach((q) => op.rt.p.pts.push([q[0] * Lc.w, q[1] * Lc.h, 0.5])); }
    op.lastAt = Date.now();
    renderLive(op, false);
  };
  const endStroke = (op) => {
    if (!op || op.done) return;
    op.done = true;
    renderLive(op, true);
  };
  const dropOp = (sid) => {
    if (!opsRef.current.has(sid)) return;
    opsRef.current.delete(sid);
    orderRef.current = orderRef.current.filter((x) => x !== sid);
    tmpRef.current.delete(sid);
    setCount(orderRef.current.length);
    redrawAll();
  };
  const clearOps = () => {
    opsRef.current.clear();
    orderRef.current = [];
    mineRef.current = [];
    tmpRef.current.clear();
    setCount(0);
    setMineN(0);
    redrawAll();
  };
  const applyBg = (k) => {
    if (!PAINT_BACKGROUNDS.some((x) => x[0] === k)) return;
    bgRef.current = k;
    setBgKey(k);
    drawBgLayer();
  };
  useLayoutEffect(() => {
    const fit = () => {
      const el = wrapRef.current;
      if (!el) return;
      const W = el.clientWidth - 24;
      const H = el.clientHeight - 20;
      let w = W;
      let h = (W * 4) / 3;
      if (h > H) { h = H; w = (H * 3) / 4; }
      setBox({ w: Math.max(120, Math.floor(w)), h: Math.max(160, Math.floor(h)) });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const v = viewRef.current;
    if (!v || !box.w) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.round(box.w * dpr);
    const ph = Math.round(box.h * dpr);
    v.width = pw;
    v.height = ph;
    L.current = { ink: mkCanvas(pw, ph), bg: mkCanvas(pw, ph), scratch: mkCanvas(pw, ph), w: box.w, h: box.h, dpr };
    drawBgLayer();
    redrawAll();
  }, [box.w, box.h]);
  useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now();
      opsRef.current.forEach((op) => { if (op.t === 'k' && !op.done && op.by !== me.id && op.lastAt && now - op.lastAt > 2500) endStroke(op); });
    }, 1000);
    return () => { clearInterval(t); cancelAnimationFrame(rafRef.current); };
  }, []);
  const remoteStroke = (pl) => {
    let op = opsRef.current.get(String(pl.sid));
    if (!op) { const fresh = dtCleanOp({ ...pl, t: 'k' }, pl.by); if (!fresh) return null; op = addOp(fresh); }
    return op;
  };
  const takeOps = (list) => {
    (Array.isArray(list) ? list : []).forEach((raw) => {
      if (!raw || !raw.sid || opsRef.current.has(String(raw.sid))) return;
      const op = dtCleanOp(raw, raw.by);
      if (!op) return;
      if (op.t === 'k') { op.pts = dtCleanPts(raw.pts); op.done = true; }
      opsRef.current.set(op.sid, op);
      orderRef.current.push(op.sid);
    });
    setCount(orderRef.current.length);
    redrawAll();
  };
  useEffect(() => {
    let alive = true;
    const hold = { ch: null };
    rtReady(`draw-${id}`).then(() => {
      if (!alive) return;
      const ch = supabase.channel(`draw-${id}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
      hold.ch = ch;
      const sync = () => {
        const st = ch.presenceState ? ch.presenceState() : {};
        const list = [];
        Object.keys(st || {}).forEach((k) => { const v = (st[k] || [])[0]; if (v) list.push({ id: k, name: v.name || 'Someone', avatar: v.avatar || null }); });
        setPeople(list);
      };
      ch.on('presence', { event: 'sync' }, sync)
        .on('broadcast', { event: 'pts' }, ({ payload: pl }) => {
          if (!pl || !pl.sid || !Array.isArray(pl.pts)) return;
          const op = remoteStroke(pl);
          if (op) addStrokePts(op, dtCleanPts(pl.pts));
        })
        .on('broadcast', { event: 'end' }, ({ payload: pl }) => { if (pl && pl.sid) endStroke(opsRef.current.get(String(pl.sid))); })
        .on('broadcast', { event: 'shape' }, ({ payload: pl }) => { const op = dtCleanOp({ ...pl, t: 'h' }, pl && pl.by); if (op && !opsRef.current.has(op.sid)) { addOp(op); redrawAll(); } })
        .on('broadcast', { event: 'stamp' }, ({ payload: pl }) => { const op = dtCleanOp({ ...pl, t: 'm' }, pl && pl.by); if (op && !opsRef.current.has(op.sid)) { addOp(op); redrawAll(); } })
        .on('broadcast', { event: 'bg' }, ({ payload: pl }) => { if (pl && pl.k) applyBg(String(pl.k)); })
        .on('broadcast', { event: 'undo' }, ({ payload: pl }) => { if (pl && pl.sid) dropOp(String(pl.sid)); })
        .on('broadcast', { event: 'clear' }, () => clearOps())
        .on('broadcast', { event: 'need' }, ({ payload: pl }) => {
          if (!orderRef.current.length && bgRef.current === 'white') return;
          const all = orderRef.current.map((sid) => opsRef.current.get(sid)).filter(Boolean);
          let total = 0;
          const keep = [];
          for (let i = all.length - 1; i >= 0; i--) {
            const op = all[i];
            total += op.t === 'k' ? op.pts.length : 4;
            if (total > 6000) break;
            const { rt, done, lastAt, ...rest } = op;
            keep.unshift(rest);
          }
          const legacy = keep.filter((op) => op.t === 'k').map((op) => ({ sid: op.sid, by: op.by, c: op.e ? '#FFFFFF' : op.c, w: op.w, pts: op.pts }));
          try { ch.send({ type: 'broadcast', event: 'all', payload: { to: pl && pl.by, bg: bgRef.current, ops: keep, strokes: legacy } }); } catch {}
        })
        .on('broadcast', { event: 'all' }, ({ payload: pl }) => {
          if (!pl || (pl.to && pl.to !== me.id) || gotAllRef.current) return;
          gotAllRef.current = true;
          if (pl.bg) applyBg(String(pl.bg));
          if (Array.isArray(pl.ops)) takeOps(pl.ops);
          else if (Array.isArray(pl.strokes)) takeOps(pl.strokes.map((x) => ({ ...x, t: 'k', b: 'pen' })));
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') return;
          try { ch.track({ name: me.name || 'Someone', avatar: me.avatar || null }); } catch {}
          setTimeout(() => { try { ch.send({ type: 'broadcast', event: 'need', payload: { by: me.id } }); } catch {} }, 350);
        });
      chRef.current = ch;
    });
    return () => { alive = false; clearInterval(flushRef.current); if (hold.ch) { try { supabase.removeChannel(hold.ch); } catch {} } chRef.current = null; };
  }, [id]);
  const say = (event, payload) => { try { if (chRef.current) chRef.current.send({ type: 'broadcast', event, payload }); } catch {} };
  const toNorm = (ev) => {
    const r = viewRef.current.getBoundingClientRect();
    return [Math.round(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * 10000) / 10000, Math.round(Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)) * 10000) / 10000];
  };
  const newSid = () => `${String(me.id).slice(0, 6)}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const flush = () => {
    const cur = curRef.current;
    if (!cur || cur.kind !== 'stroke' || !cur.pending.length) return;
    const op = cur.op;
    const pts = cur.pending;
    cur.pending = [];
    say('pts', { sid: op.sid, by: me.id, b: op.b, c: op.e ? '#FFFFFF' : op.c, w: op.w, a: op.a, s: op.s, e: op.e, pts });
  };
  const remember = (sid) => { mineRef.current.push(sid); setMineN(mineRef.current.length); };
  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (curRef.current || !L.current.ink) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const tr = toolRef.current;
    const pt = toNorm(e);
    if (tr.tool === 'stamp') {
      const op = { t: 'm', sid: newSid(), by: me.id, e: tr.stamp, x: pt[0], y: pt[1], z: (18 + tr.size * 2.2) / 360 };
      addOp(op);
      remember(op.sid);
      const Lc = L.current;
      const ic = Lc.ink.getContext('2d');
      ic.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
      dtPaintOne(ic, op, Lc.w, Lc.h, Lc.dpr, Lc.scratch);
      schedule();
      hapticTap();
      say('stamp', op);
      curRef.current = { kind: 'tap', pid: e.pointerId };
      return;
    }
    if (tr.tool === 'shapes') {
      previewRef.current = { t: 'h', sid: newSid(), by: me.id, k: tr.shape, c: tr.color, w: Math.max(2, tr.size) / 360, f: tr.fill ? 1 : 0, x0: pt[0], y0: pt[1], x1: pt[0], y1: pt[1] };
      curRef.current = { kind: 'shape', pid: e.pointerId };
      schedule();
      return;
    }
    const eraser = tr.tool === 'eraser';
    const sid = newSid();
    const op = { t: 'k', sid, by: me.id, b: eraser ? 'pen' : tr.brush, c: eraser ? '#000000' : tr.color, w: (eraser ? Math.max(10, tr.size * 2.2) : tr.size) / 360, a: eraser ? 1 : tr.alpha, s: dtSeed(sid), e: eraser ? 1 : 0, pts: [], done: false, rt: null };
    addOp(op);
    remember(sid);
    curRef.current = { kind: 'stroke', pid: e.pointerId, op, pending: [pt] };
    addStrokePts(op, [pt]);
    clearInterval(flushRef.current);
    flushRef.current = setInterval(flush, 60);
  };
  const onMove = (e) => {
    const cur = curRef.current;
    if (!cur || cur.pid !== e.pointerId) return;
    const ne = e.nativeEvent;
    if (cur.kind === 'shape') {
      const pt = toNorm(ne || e);
      previewRef.current = { ...previewRef.current, x1: pt[0], y1: pt[1] };
      schedule();
      return;
    }
    if (cur.kind !== 'stroke') return;
    const list = ne && ne.getCoalescedEvents ? ne.getCoalescedEvents() : [];
    const pts = (list && list.length ? list : [ne || e]).map((ev) => toNorm(ev));
    cur.pending.push(...pts);
    addStrokePts(cur.op, pts);
  };
  const onUp = (e) => {
    const cur = curRef.current;
    if (!cur || cur.pid !== e.pointerId) return;
    curRef.current = null;
    if (cur.kind === 'shape') {
      const pv = previewRef.current;
      previewRef.current = null;
      if (pv && Math.hypot(pv.x1 - pv.x0, (pv.y1 - pv.y0) * (L.current.h / Math.max(1, L.current.w))) > 0.015) {
        addOp(pv);
        remember(pv.sid);
        const Lc = L.current;
        const ic = Lc.ink.getContext('2d');
        ic.setTransform(Lc.dpr, 0, 0, Lc.dpr, 0, 0);
        dtPaintOne(ic, pv, Lc.w, Lc.h, Lc.dpr, Lc.scratch);
        say('shape', pv);
      }
      schedule();
      return;
    }
    if (cur.kind !== 'stroke') return;
    curRef.current = cur;
    flush();
    curRef.current = null;
    clearInterval(flushRef.current);
    endStroke(cur.op);
    say('end', { sid: cur.op.sid });
  };
  const undo = () => {
    const sid = mineRef.current.pop();
    setMineN(mineRef.current.length);
    if (!sid) return;
    hapticTap();
    dropOp(sid);
    say('undo', { sid });
  };
  const clearAll = () => {
    clearOps();
    say('clear', { by: me.id });
  };
  const pickBg = (k) => {
    hapticTap();
    applyBg(k);
    say('bg', { k });
  };
  const send = async () => {
    if (sending || !orderRef.current.length) return;
    setSending(true);
    try {
      const W = 1080;
      const H = 1440;
      const out = mkCanvas(W, H);
      const oc = out.getContext('2d');
      dtDrawBg(oc, bgRef.current, W, H);
      const ink = mkCanvas(W, H);
      const ic = ink.getContext('2d');
      const scratch = mkCanvas(W, H);
      orderRef.current.forEach((sid) => { const op = opsRef.current.get(sid); if (op) { ic.setTransform(1, 0, 0, 1, 0, 0); dtPaintOne(ic, op, W, H, 1, scratch); } });
      oc.drawImage(ink, 0, 0);
      const blob = await new Promise((res) => out.toBlob(res, 'image/jpeg', 0.92));
      if (blob) await onSendImage(new File([blob], 'drawing.jpg', { type: 'image/jpeg' }));
    } catch {}
    setSending(false);
  };
  const previews = useMemo(() => {
    if (sheet !== 'brush') return {};
    const out = {};
    const pc = color.toUpperCase() === '#FFFFFF' ? '#111111' : color;
    PAINT_BRUSHES.forEach((x) => { out[x.k] = paintBrushPreview(x.k, pc); });
    return out;
  }, [sheet, color]);
  const others = people.filter((x) => x.id !== me.id);
  const brushLabel = (PAINT_BRUSHES.find((x) => x.k === brush) || PAINT_BRUSHES[0]).label;
  const shapeLabel = (PAINT_SHAPES.find((x) => x.k === shape) || PAINT_SHAPES[0]).label;
  const barBtn = (k, label, onClick, disabled) => (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="zchat-press"
      style={{ width: 42, height: 42, border: 'none', background: 'transparent', color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1, padding: 0, flexShrink: 0 }}><PaintToolIcon k={k} size={23} /></button>
  );
  const pickTool = (k) => { hapticTap(); setTool(k); };
  return (
    <Portal>
      <div className="zchat-fade" data-no-swipe="true" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 640, background: c.bg, color: c.fg, fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 54, padding: '0 6px', gap: 2 }}>
            <button type="button" aria-label="Leave the drawing" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}><X size={24} /></button>
            {barBtn('undo', 'Undo', undo, !mineN)}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {others.length > 0 && (
                <div style={{ display: 'flex', flexShrink: 0 }}>
                  {others.slice(0, 3).map((v, i) => <div key={v.id} style={{ marginLeft: i ? -9 : 0, borderRadius: '50%', boxShadow: `0 0 0 2px ${theme.panelBg}` }}><Avatar emoji={v.avatar} name={v.name} size={26} /></div>)}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: c.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{others.length ? `${others.length + 1} drawing now` : 'Waiting for others'}</div>
            </div>
            {barBtn('more', 'Page options', () => setSheet('page'))}
            <button type="button" onClick={send} disabled={sending || !count} className="zchat-press"
              style={{ height: 38, padding: '0 16px', marginLeft: 4, borderRadius: 19, border: 'none', background: theme.coral, color: '#fff', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer', opacity: sending || !count ? 0.45 : 1, flexShrink: 0 }}>{sending ? 'Sending' : 'Send'}</button>
          </div>
        </div>
        <div ref={wrapRef} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.dark ? '#121214' : '#E7E7EC' }}>
          <canvas ref={viewRef} aria-label="Shared drawing board" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            style={{ width: box.w, height: box.h, borderRadius: 14, touchAction: 'none', boxShadow: '0 6px 24px rgba(0,0,0,0.18)', cursor: 'crosshair', display: 'block' }} />
        </div>
        <div style={{ flexShrink: 0, background: c.bg, borderTop: `1px solid ${c.line}`, paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div role="toolbar" aria-label="Drawing tools" style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 4px 0' }}>
              {DT_TOOLS.map(([k, label]) => {
                const on = tool === k;
                return (
                  <button key={k} type="button" aria-label={label} aria-pressed={on} onClick={() => pickTool(k)} className="zchat-press"
                    style={{ flex: '0 1 64px', height: 46, border: 'none', background: 'transparent', color: on ? kitOnInk(theme) : c.fg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', padding: 0, transition: 'color 160ms ease' }}>
                    <PaintToolIcon k={k} />
                    <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 2, background: on ? theme.coral : 'transparent', transition: 'background 160ms ease' }} />
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 14px 0', minHeight: 52 }}>
              {tool !== 'eraser' && tool !== 'stamp' && (
                <button type="button" aria-label="Choose colour" onClick={() => setSheet('color')} className="zchat-press"
                  style={{ width: 36, height: 36, marginRight: 4, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, background: color, boxShadow: `0 0 0 2px ${c.bg}, 0 0 0 3.5px ${theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(17,17,19,0.2)'}`, opacity: Math.max(0.35, alpha) }} />
              )}
              {tool === 'brush' && <StudioTool label={brushLabel} aria="Choose brush" ink={c.fg} width={66} glyph={<PaintBrushChip k={brush} color={color} />} onClick={() => setSheet('brush')} />}
              {tool === 'shapes' && <StudioTool label={shape === 'round' ? 'Rounded' : shape === 'bubble' ? 'Bubble' : shapeLabel} aria="Choose shape" ink={c.fg} width={60} glyph={<PaintShapeIcon k={shape} color="currentColor" fill={fill ? color : false} size={28} />} onClick={() => setSheet('shapes')} />}
              {tool === 'shapes' && <StudioTool label={fill ? 'Filled' : 'Outline'} aria="Fill shape" on={fill} pressed={fill} ink={c.fg} width={54} glyph={<PaintFillGlyph on={fill} />} onClick={() => setFill((v) => !v)} />}
              {tool === 'stamp' && <StudioTool label="Sticker" aria="Choose sticker" ink={c.fg} width={56} glyph={<span style={{ fontSize: 23, lineHeight: 1 }}>{stamp}</span>} onClick={() => setSheet('stamp')} />}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, paddingLeft: 4 }}>
                <KitSlider value={size} min={1} max={40} label="Size" onChange={setSize} style={{ flex: 1, minWidth: 0 }} />
                <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {tool === 'stamp'
                    ? <span style={{ fontSize: Math.max(12, Math.min(26, 10 + size * 0.5)), lineHeight: 1 }}>{stamp}</span>
                    : <div style={{ width: Math.max(3, Math.min(28, (tool === 'eraser' ? size * 2.2 : size) * 0.7)), height: Math.max(3, Math.min(28, (tool === 'eraser' ? size * 2.2 : size) * 0.7)), borderRadius: '50%', background: tool === 'eraser' ? 'transparent' : color, border: tool === 'eraser' ? `2px solid ${c.fg}` : 'none', boxSizing: 'border-box' }} />}
                </div>
              </div>
            </div>
            {tool !== 'eraser' && tool !== 'stamp' && (
              <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '6px 14px 2px', scrollbarWidth: 'none' }}>
                {PAINT_PALETTE.map((col) => (
                  <div key={col} role="button" aria-label={`Color ${col}`} onClick={() => { hapticTap(); setColor(col); }}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: col, cursor: 'pointer', flexShrink: 0, boxShadow: color === col ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${c.fg}` : `inset 0 0 0 1px ${c.line}` }} />
                ))}
              </div>
            )}
            {tool === 'stamp' && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '6px 14px 4px', scrollbarWidth: 'none' }}>
                {PAINT_STAMPS.map((em) => (
                  <div key={em} role="button" aria-label={`Sticker ${em}`} aria-pressed={stamp === em} onClick={() => { hapticTap(); setStamp(em); }}
                    style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, lineHeight: 1, cursor: 'pointer', flexShrink: 0, background: stamp === em ? c.field : 'transparent', boxShadow: stamp === em ? `0 0 0 2px ${c.bg}, 0 0 0 3.5px ${theme.coral}` : 'none', transition: 'box-shadow 160ms ease' }}>{em}</div>
                ))}
              </div>
            )}
            {tool === 'eraser' && <div style={{ fontSize: 12.5, color: c.dim, padding: '6px 14px 6px', minHeight: 22 }}>Rub out any part of the page. It erases for everyone.</div>}
          </div>
        </div>
      </div>
      {sheet === 'color' && (
        <PaintSheet title="Colour" z={700} onClose={() => setSheet(null)}>
          <PaintColorPanel color={color} alpha={alpha} onColor={setColor} onAlpha={setAlpha} recent={[]} />
        </PaintSheet>
      )}
      {sheet === 'brush' && (
        <PaintSheet title="Brushes" z={700} onClose={() => setSheet(null)}>
          <StudioTileGrid label="Brushes" cols={2} ratio={2.7} gap={14} value={brush} onChange={(k) => { setBrush(k); setTool('brush'); setSheet(null); }}
            options={PAINT_BRUSHES.map((x) => ({ k: x.k, label: x.label, aria: `Brush ${x.label}`, bg: '#FFFFFF', art: previews[x.k] ? <img src={previews[x.k]} alt="" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /> : null }))} />
        </PaintSheet>
      )}
      {sheet === 'shapes' && (
        <PaintSheet title="Shapes" z={700} onClose={() => setSheet(null)}>
          <StudioTileGrid label="Shapes" cols={3} ratio={1.35} gap={12} value={shape} onChange={(k) => { setShape(k); setTool('shapes'); setSheet(null); }}
            options={PAINT_SHAPES.map((sp) => ({ k: sp.k, label: sp.label, aria: `Shape ${sp.label}`, art: <PaintShapeIcon k={sp.k} color="currentColor" fill={fill} size={46} /> }))} />
        </PaintSheet>
      )}
      {sheet === 'stamp' && (
        <PaintSheet title="Stickers" z={700} onClose={() => setSheet(null)}>
          <StudioTileGrid label="Stickers" cols={4} ratio={1} gap={12} value={stamp} onChange={(em) => { setStamp(em); setTool('stamp'); setSheet(null); }}
            options={PAINT_STAMPS.map((em) => ({ k: em, aria: `Sticker ${em}`, art: <span style={{ fontSize: 34, lineHeight: 1 }}>{em}</span> }))} />
        </PaintSheet>
      )}
      {sheet === 'page' && (
        <PaintSheet title="Page" z={700} onClose={() => setSheet(null)}>
          <KitSection title="Background for everyone" style={{ marginTop: 2 }}>
            <PickTiles label="Background for everyone" size={60} bleed={18} value={bgKey} onChange={(k) => pickBg(k)}
              options={PAINT_BACKGROUNDS.map(([k, col, label]) => ({ k, label, aria: `Background ${label}`, art: paintBgArt(k, col) }))} />
          </KitSection>
          <div role="button" aria-label="Clear the page for everyone" onClick={() => { setSheet(null); if (count) setAskClear(true); }} className="zchat-row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, marginTop: 14, cursor: count ? 'pointer' : 'default', opacity: count ? 1 : 0.4, color: theme.danger, fontSize: 15, fontWeight: 600 }}>
            <Trash2 size={19} />Clear the page for everyone
          </div>
        </PaintSheet>
      )}
      {askClear && <ConfirmSheet title="Clear the page?" text="It clears for everyone drawing with you." confirmLabel="Clear" zIndex={720} onCancel={() => setAskClear(false)} onConfirm={() => { setAskClear(false); clearAll(); }} />}
    </Portal>
  );
}
function boothMerge(cur, next) {
  if (!next) return cur;
  if (!cur || cur.id !== next.id) return next;
  const people = Array.isArray(next.people) ? next.people.map((p) => { const old = (cur.people || []).find((x) => x.user_id === p.user_id); return old && old.photo_url && !p.photo_url ? { ...p, photo_url: old.photo_url } : p; }) : cur.people;
  return { ...cur, ...next, people };
}
function boothImage(src) {
  return new Promise((resolve) => {
    if (!src || !/^(https?:|blob:|data:|\/)/.test(src)) { resolve(null); return; }
    const im = new Image();
    if (!/^(blob:|data:)/.test(src)) im.crossOrigin = 'anonymous';
    im.decoding = 'async';
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}
function boothCover(ctx, im, x, y, w, h) {
  const sw = im.naturalWidth || im.videoWidth || im.width;
  const sh = im.naturalHeight || im.videoHeight || im.height;
  if (!sw || !sh) return;
  const k = Math.max(w / sw, h / sh);
  const cw = w / k;
  const ch = h / k;
  ctx.drawImage(im, (sw - cw) / 2, (sh - ch) / 2, cw, ch, x, y, w, h);
}
async function makeBoothStrip(entries, when, title) {
  const n = entries.length;
  const FW = 520;
  const FH = 600;
  const pad = 34;
  const gap = 22;
  const foot = 150;
  const W = FW + pad * 2;
  const H = pad + n * FH + (n - 1) * gap + foot;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#F7F4EC';
  ctx.fillRect(0, 0, W, H);
  const imgs = await Promise.all(entries.map(async (e) => { const photo = await boothImage(e.photo); return [photo, photo ? null : await boothImage(e.profile && e.profile.avatar)]; }));
  entries.forEach((e, i) => {
    const y = pad + i * (FH + gap);
    const [photo, ava] = imgs[i];
    ctx.save();
    ctx.fillStyle = '#E9E4F7';
    ctx.fillRect(pad, y, FW, FH);
    if (photo) boothCover(ctx, photo, pad, y, FW, FH);
    else {
      const r = 150;
      const cx = pad + FW / 2;
      const cy = y + FH / 2 - 30;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      if (ava) boothCover(ctx, ava, cx - r, cy - r, r * 2, r * 2);
      else { ctx.fillStyle = '#7C5CFC'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.fillStyle = '#FFFFFF'; ctx.font = `800 120px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String((e.profile && e.profile.name) || '?').trim().charAt(0).toUpperCase() || '?', cx, cy + 6); }
      ctx.restore();
      ctx.fillStyle = '#3A3550';
      ctx.font = `700 34px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(String((e.profile && e.profile.name) || '').split(' ')[0].slice(0, 18), cx, cy + r + 62);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad + 1, y + 1, FW - 2, FH - 2);
    ctx.restore();
  });
  const fy = H - foot;
  ctx.fillStyle = '#2B2638';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 40px Georgia, "Times New Roman", serif';
  ctx.fillText(fmtDate(when, { day: 'numeric', month: 'long', year: 'numeric' }), W / 2, fy + 66);
  ctx.fillStyle = '#7A7488';
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText(String(title || '').slice(0, 34), W / 2, fy + 108);
  ctx.fillStyle = '#7C5CFC';
  ctx.font = `800 20px ${FONT}`;
  ctx.fillText('ZChat photo booth', W / 2, fy + 138);
  const blob = await new Promise((r) => { try { cv.toBlob((b) => r(b), 'image/jpeg', 0.9); } catch { r(null); } });
  if (!blob) return null;
  return { blob, url: URL.createObjectURL(blob), file: new File([blob], `zchat-booth-${Date.now().toString(36)}.jpg`, { type: 'image/jpeg' }), w: W, h: H };
}
async function makeBoothStory(strip) {
  const im = await boothImage(strip.url);
  if (!im) return strip.file;
  const W = 1080;
  const H = 1920;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#2A1F5C');
  g.addColorStop(1, '#120E26');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const k = Math.min((H * 0.86) / strip.h, (W * 0.62) / strip.w);
  const w = strip.w * k;
  const h = strip.h * k;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-0.035);
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 16;
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
  const blob = await new Promise((r) => { try { cv.toBlob((b) => r(b), 'image/jpeg', 0.9); } catch { r(null); } });
  return blob ? new File([blob], `zchat-booth-story-${Date.now().toString(36)}.jpg`, { type: 'image/jpeg' }) : strip.file;
}
export function PhotoBoothScreen({ me, chatKey, chatName, boothId, profileOf, onClose, onOpened, onSend, onStory }) {
  const [booth, setBooth] = useState(null);
  const [err, setErr] = useState('');
  const [cam, setCam] = useState(null);
  const [, setTick] = useState(0);
  const [shot, setShot] = useState(null);
  const [strip, setStrip] = useState(null);
  const [flash, setFlash] = useState(false);
  const [sending, setSending] = useState('');
  const [starting, setStarting] = useState(false);
  const videoRef = useRef(null);
  const firedRef = useRef('');
  const composingRef = useRef(false);
  const boothRef = useRef(null);
  boothRef.current = booth;
  const uid = me && me.id;
  const leave = () => {
    const b = boothRef.current;
    if (b && boothLocal(b.shoot_at) > Date.now()) supabase.rpc('zchat_booth_leave', { p_booth: b.id }).then(() => {}, () => {});
    onClose();
  };
  useBackClose(true, leave);
  useEffect(() => {
    let alive = true;
    let stream = null;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no camera');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 1280 } }, audio: false });
        if (!alive) { stream.getTracks().forEach((tr) => tr.stop()); return; }
        setCam(stream);
      } catch { if (alive) setCam(false); }
    })();
    return () => { alive = false; if (stream) stream.getTracks().forEach((tr) => tr.stop()); };
  }, []);
  useEffect(() => {
    const v = videoRef.current;
    if (v && cam) { v.srcObject = cam; v.play().catch(() => {}); }
  }, [cam, booth && booth.id]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const t0 = Date.now();
      const res = boothId ? await supabase.rpc('zchat_booth_join', { p_booth: boothId, p_cam: true }) : await supabase.rpc('zchat_booth_open', { p_key: chatKey });
      const t1 = Date.now();
      if (!alive) return;
      if (res.error || !res.data) { setErr(rpcMissing(res.error) ? 'The photo booth switches on once the latest ZChat setup is finished.' : friendlyError(res.error, 'The photo booth did not open. Try again.')); return; }
      boothClockSample(t0, t1, res.data.now);
      setBooth(res.data);
      boothNote(res.data);
      if (!boothId && onOpened && res.data.created_by === uid && Date.now() - Date.parse(res.data.created_at) < 15000 + Math.abs(boothClock.offset)) onOpened(res.data);
      for (let i = 0; i < 2 && alive; i++) {
        const a = Date.now();
        const { data } = await supabase.rpc('zchat_booth_clock');
        const b = Date.now();
        if (data) boothClockSample(a, b, typeof data === 'string' ? data : data.now || data);
      }
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (cam === false && booth && (booth.people || []).some((p) => p.user_id === uid && p.cam)) {
      supabase.rpc('zchat_booth_join', { p_booth: booth.id, p_cam: false }).then(({ data }) => { if (data) setBooth((cur) => boothMerge(cur, data)); }, () => {});
    }
  }, [cam, booth && booth.id]);
  useEffect(() => {
    if (!booth) return undefined;
    const id = booth.id;
    const refresh = async () => {
      const a = Date.now();
      const { data } = await supabase.rpc('zchat_booth_state', { p_booth: id });
      const b = Date.now();
      if (data) { boothClockSample(a, b, data.now); setBooth((cur) => boothMerge(cur, data)); boothNote(data); }
    };
    const onPeople = (p) => {
      const row = p.eventType === 'DELETE' ? p.old : p.new;
      if (!row || !row.user_id || row.booth_id !== id) return;
      setBooth((cur) => {
        if (!cur) return cur;
        const list = (cur.people || []).filter((x) => x.user_id !== row.user_id);
        const old = (cur.people || []).find((x) => x.user_id === row.user_id);
        const next = p.eventType === 'DELETE' ? list : [...list, { user_id: row.user_id, joined_at: row.joined_at || (old && old.joined_at), cam: row.cam !== false, photo_url: row.photo_url || (old && old.photo_url) || null }];
        next.sort((x, y) => Date.parse(x.joined_at || 0) - Date.parse(y.joined_at || 0) || String(x.user_id).localeCompare(String(y.user_id)));
        return { ...cur, people: next };
      });
    };
    const keep = rtKeep(() => supabase.channel(rtName(`booth-${id}`))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'zchat_booth_people', filter: `booth_id=eq.${id}` }, onPeople)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'zchat_booth_people', filter: `booth_id=eq.${id}` }, onPeople)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'zchat_booth_people' }, onPeople)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'zchat_booths', filter: `id=eq.${id}` }, (p) => { if (p.new) { setBooth((cur) => (cur ? { ...cur, ...p.new, people: cur.people } : cur)); boothNote(p.new); } }));
    const shootIn = boothLocal(booth.shoot_at) - Date.now();
    const joinIn = boothLocal(booth.join_until) - Date.now();
    const timers = [joinIn + 300, shootIn + 2500, shootIn + 6000, shootIn + 10000].filter((ms) => ms > 0).map((ms) => setTimeout(refresh, ms));
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { rtDrop(keep); timers.forEach(clearTimeout); document.removeEventListener('visibilitychange', onVis); };
  }, [booth && booth.id, booth && booth.shoot_at]);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 100); return () => clearInterval(t); }, []);
  const capture = async () => {
    const b = boothRef.current;
    if (!b || firedRef.current === b.shoot_at) return;
    firedRef.current = b.shoot_at;
    if ((b.people || []).length < 2) return;
    setFlash(Date.now());
    playUiSound('shutter');
    hapticTap();
    setTimeout(() => setFlash(false), 320);
    const v = videoRef.current;
    if (!cam || !v || !v.videoWidth) return;
    let frame = null;
    try { frame = typeof createImageBitmap === 'function' ? await createImageBitmap(v) : null; } catch { frame = null; }
    const W = 720;
    const H = 830;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
    boothCover(ctx, frame || v, 0, 0, W, H);
    try { if (frame && frame.close) frame.close(); } catch {}
    const blob = await new Promise((r) => { try { cv.toBlob((x) => r(x), 'image/jpeg', 0.88); } catch { r(null); } });
    if (!blob) return;
    setShot(URL.createObjectURL(blob));
    const { url, error } = await uploadMedia(new File([blob], `booth-${b.id.slice(0, 8)}.jpg`, { type: 'image/jpeg' }), uid);
    if (error || !url) return;
    const { data } = await supabase.rpc('zchat_booth_shot', { p_booth: b.id, p_url: url });
    if (data) setBooth((cur) => boothMerge(cur, data));
  };
  useEffect(() => {
    if (!booth || booth.status !== 'open') return undefined;
    const ms = boothLocal(booth.shoot_at) - Date.now();
    if (ms < -5000) return undefined;
    const t = setTimeout(capture, Math.max(0, ms));
    return () => clearTimeout(t);
  }, [booth && booth.shoot_at, booth && booth.status, cam]);
  const people = (booth && booth.people) || [];
  const now = Date.now();
  const joinLeft = booth ? Math.ceil((boothLocal(booth.join_until) - now) / 1000) : 30;
  const shootLeft = booth ? (boothLocal(booth.shoot_at) - now) / 1000 : 99;
  const after = booth && shootLeft <= 0;
  const alone = after && people.length < 2;
  const ready = after && people.length >= 2 && people.every((p) => !p.cam || p.photo_url || (p.user_id === uid && shot));
  const late = after && shootLeft < -12;
  const photoKey = people.slice(0, 6).map((p) => (p.user_id === uid ? (shot ? 's' : '') : p.cam && p.photo_url ? 'p' : '')).join(',');
  useEffect(() => {
    if (!booth || sending || composingRef.current || alone || !(ready || late) || (strip && strip.key === photoKey)) return;
    composingRef.current = true;
    const first = !strip;
    const entries = people.slice(0, 6).map((p) => ({ photo: p.user_id === uid && shot ? shot : p.cam ? p.photo_url : null, profile: p.user_id === uid ? me : profileOf(p.user_id) }));
    makeBoothStrip(entries, new Date(Date.parse(booth.shoot_at)), chatName).then((r) => { composingRef.current = false; if (r) { setStrip({ ...r, key: photoKey }); if (first) playUiSound('pad2'); } });
  }, [ready, late, alone, booth && booth.id, photoKey, sending, strip]);
  useEffect(() => () => { if (strip) { const u = strip.url; setTimeout(() => URL.revokeObjectURL(u), 3000); } }, [strip]);
  useEffect(() => () => { if (shot) setTimeout(() => URL.revokeObjectURL(shot), 3000); }, [shot]);
  const startNow = async () => {
    if (!booth || starting) return;
    setStarting(true);
    const t0 = Date.now();
    const { data, error } = await supabase.rpc('zchat_booth_start', { p_booth: booth.id });
    const t1 = Date.now();
    setStarting(false);
    if (error || !data) { appSnack(friendlyError(error, 'That did not work. Try again.')); return; }
    boothClockSample(t0, t1, data.now);
    setBooth((cur) => boothMerge(cur, data));
    boothNote(data);
  };
  const doSend = async () => { if (!strip || sending) return; setSending('chat'); await onSend(strip.file); setSending(''); };
  const doStory = async () => { if (!strip || sending) return; setSending('story'); const f = await makeBoothStory(strip); setSending(''); onStory(f); };
  const doSave = () => { if (!strip) return; const a = document.createElement('a'); a.href = strip.url; a.download = strip.file.name; document.body.appendChild(a); a.click(); a.remove(); };
  const isMaker = booth && booth.created_by === uid;
  const counting = booth && !after && shootLeft <= 3.05 && people.length >= 2;
  const status = err ? err : !booth ? 'Opening the photo booth' : booth.status === 'cancelled' ? 'This photo booth was closed' : alone ? 'Nobody else joined in time' : strip ? '' : after ? 'Developing your strip' : joinLeft > 0 ? (people.length < 2 ? `Waiting for friends to join, ${joinLeft}s` : `${countWord(people.length, 'person', 'people')} in, closes in ${joinLeft}s`) : 'Get ready';
  const frame = { position: 'relative', width: 'min(78vw, 300px)', aspectRatio: '520 / 600', borderRadius: 18, overflow: 'hidden', background: '#1C1A26', boxShadow: '0 12px 40px rgba(0,0,0,0.45)' };
  return ReactDOM.createPortal(
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#0E0C16', color: '#FFFFFF', fontFamily: FONT, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
      <style>{'@keyframes zboothFlash{from{opacity:1}to{opacity:0}}@keyframes zboothDrop{from{opacity:0;transform:translateY(-28px) rotate(-1.5deg)}to{opacity:1;transform:translateY(0) rotate(-1.5deg)}}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', flexShrink: 0 }}>
        <div role="button" aria-label="Close photo booth" onClick={leave} className="zchat-press" style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.1)' }}><X size={20} /></div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Photo booth</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.62)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chatName}</div>
        </div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px 16px' }}>
        {strip ? (
          <div style={{ width: 'min(62vw, 250px)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 16px 44px rgba(0,0,0,0.5)', transform: 'rotate(-1.5deg)', marginTop: 6, animation: reducedMotion() ? undefined : 'zboothDrop 0.42s cubic-bezier(0.2, 0.9, 0.3, 1) both' }}>
            <img src={strip.url} alt={`Photo strip with ${countWord(people.length, 'person', 'people')}`} style={{ width: '100%', display: 'block' }} />
          </div>
        ) : (
          <div style={frame}>
            {cam ? <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
                  {me && <Avatar emoji={me.avatar} name={me.name} size={110} />}
                  {cam === false && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>No camera here, so your profile picture goes in the strip</div>}
                </div>}
            {shot && after && <img src={shot} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
            {counting && <div key={Math.ceil(shootLeft)} className="zchat-pop" aria-live="assertive" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 120, fontWeight: 800, textShadow: '0 4px 24px rgba(0,0,0,0.5)', fontVariantNumeric: 'tabular-nums' }}>{Math.max(1, Math.ceil(shootLeft))}</div>}
            {flash && <div data-booth-flash={String(flash)} aria-hidden="true" style={{ position: 'absolute', inset: 0, background: '#FFFFFF', animation: 'zboothFlash 0.32s ease-out forwards' }} />}
            {after && !strip && !alone && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 14, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color="#FFFFFF" /></div>}
          </div>
        )}
        <div role="status" style={{ fontSize: 14, fontWeight: 600, color: err ? '#FF8A95' : 'rgba(255,255,255,0.82)', textAlign: 'center', marginTop: 16, minHeight: 20, lineHeight: 1.4 }}>{status}</div>
        {!strip && (
          <div role="list" aria-label="People in the photo booth" style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 340 }}>
            {people.map((p) => {
              const pr = p.user_id === uid ? me : profileOf(p.user_id);
              const done = !!(p.photo_url || (p.user_id === uid && shot));
              return (
                <div key={p.user_id} role="listitem" aria-label={pr ? pr.name : 'Someone'} className="zchat-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 54 }}>
                  <div style={{ position: 'relative', borderRadius: '50%', boxShadow: done ? '0 0 0 2px #7C5CFC' : 'none' }}><Avatar emoji={pr && pr.avatar} name={(pr && pr.name) || '?'} size={44} />{!p.cam && <span aria-label="No camera" style={{ position: 'absolute', right: -3, bottom: -3, width: 18, height: 18, borderRadius: '50%', background: '#2A2734', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VideoOff size={10} color="#FFFFFF" /></span>}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', maxWidth: 54, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.user_id === uid ? 'You' : String((pr && pr.name) || '').split(' ')[0]}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, padding: '10px 16px calc(16px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', maxWidth: 440, width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        {strip ? (
          <>
            <BigButton label={sending === 'chat' ? 'Sending' : 'Send to chat'} onClick={doSend} disabled={!!sending} />
            <div style={{ display: 'flex', gap: 10 }}>
              <BigButton tone="plain" label={sending === 'story' ? 'Getting it ready' : 'Share to story'} onClick={doStory} disabled={!!sending} style={{ flex: 1, background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }} />
              <BigButton tone="plain" label="Save" onClick={doSave} style={{ flex: '0 0 96px', width: 96, background: 'rgba(255,255,255,0.12)', color: '#FFFFFF' }} />
            </div>
          </>
        ) : alone || (booth && booth.status === 'cancelled') || err ? (
          <BigButton label="Close" onClick={onClose} />
        ) : isMaker && joinLeft > 0 && people.length >= 2 ? (
          <BigButton label={starting ? 'Starting' : 'Start now'} onClick={startNow} disabled={starting} />
        ) : (
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.45 }}>Everyone's front camera takes the photo at the same moment. Up to 6 people.</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function PackEditorPage({ userId, mine, pack, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(pack ? pack.name : '');
  const [picked, setPicked] = useState(() => new Set(pack ? pack.stickers : []));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const toggle = (u) => setPicked((prev) => { const n = new Set(prev); if (n.has(u)) n.delete(u); else if (n.size < 120) n.add(u); return n; });
  const save = async () => {
    const clean = name.trim().slice(0, 40);
    if (!clean) { setErr('Give your pack a name'); return; }
    if (!picked.size) { setErr('Pick at least one sticker'); return; }
    setBusy(true);
    setErr('');
    const row = { owner_id: userId, name: clean, stickers: [...picked], updated_at: new Date().toISOString() };
    const res = pack && pack.id ? await supabase.from('sticker_packs').update(row).eq('id', pack.id).eq('owner_id', userId).select().single() : await supabase.from('sticker_packs').insert(row).select().single();
    setBusy(false);
    if (res.error || !res.data) { setErr(/sticker_packs|schema|relation/i.test(String((res.error && res.error.message) || '')) ? 'Sticker packs switch on once the latest ZChat setup is finished.' : 'That pack could not be saved. Try again.'); return; }
    onSaved(res.data);
  };
  return (
    <FullPage title={pack ? 'Edit pack' : 'New sticker pack'} subtitle={`${picked.size} picked`} onBack={onClose} zIndex={720} footer={<BigButton label={busy ? 'Saving' : 'Save pack'} disabled={busy} onClick={save} />}>
      <div style={{ padding: '12px 2px 8px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Bundle your stickers into a pack, then share it so friends can add all of them at once.</div>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Pack name" aria-label="Pack name" style={inputStyle(theme)} />
      {!mine.length && <EmptyState art="nothing" title="No stickers yet" text="Make a few stickers from your photos first, then come back here." />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, paddingTop: 14 }}>
        {mine.map((s) => {
          const on = picked.has(s.url);
          return (
            <div key={s.id} role="button" aria-label={on ? 'Remove sticker from pack' : 'Add sticker to pack'} onClick={() => toggle(s.url)} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 14, background: theme.rowBg, border: `2px solid ${on ? theme.coral : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <img src={s.url} alt="" loading="lazy" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
              {on && <span style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} color="#FFFFFF" strokeWidth={3} /></span>}
            </div>
          );
        })}
      </div>
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
    </FullPage>
  );
}

function StickerQIcon({ size = 18, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1.1.9-1.1 1.6v.4" /><circle cx="12" cy="16.8" r="0.6" fill={color} />
    </svg>
  );
}
const SLIDER_EMOJIS = ['\u{1F60D}', '\u{1F525}', '\u{1F602}', '\u{1F44F}', '\u{1F62E}', '\u{1F4AF}', '❤️', '\u{1F92F}'];
const STORY_STICKER_KINDS = [['question', 'Question'], ['poll', 'Poll'], ['quiz', 'Quiz'], ['addyours', 'Add yours'], ['count', 'Countdown'], ['slider', 'Slider'], ['link', 'Link']];
function StoryStickerKindArt({ k, emoji }) {
  const gid = `ssk${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const grad = `url(#${gid})`;
  const card = <rect x="5" y="7" width="30" height="26" rx="5.5" fill="#FFFFFF" />;
  const band = <path d="M5 12.5A5.5 5.5 0 0 1 10.5 7h19A5.5 5.5 0 0 1 35 12.5V14H5z" fill={grad} />;
  const body = (() => {
    if (k === 'question') return <>{card}{band}<rect x="9.5" y="19.5" width="21" height="8" rx="4" fill="#ECEBF2" /><rect x="12.5" y="22.6" width="9" height="1.8" rx="0.9" fill="#B9B7C6" /></>;
    if (k === 'poll') return <>{card}<rect x="10" y="11" width="14" height="2.6" rx="1.3" fill="#C9C7D4" /><rect x="9" y="17" width="22" height="5.4" rx="2.7" fill="#EEECF5" /><rect x="9" y="17" width="14.5" height="5.4" rx="2.7" fill={grad} /><rect x="9" y="25" width="22" height="5.4" rx="2.7" fill="#EEECF5" /><rect x="9" y="25" width="6.5" height="5.4" rx="2.7" fill="#C9BCFF" /></>;
    if (k === 'quiz') return <>{card}<rect x="10" y="10.5" width="13" height="2.6" rx="1.3" fill="#C9C7D4" />{[16.5, 21.8, 27.1].map((y, i) => <g key={y}><circle cx="11.6" cy={y} r="2.2" fill={i === 1 ? '#22C55E' : 'none'} stroke={i === 1 ? '#22C55E' : '#C9C7D4'} strokeWidth="1.2" />{i === 1 && <path d={`M10.6 ${y}l.8.8 1.6-1.7`} stroke="#FFFFFF" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />}<rect x="15.5" y={y - 1.2} width={i === 1 ? 14 : 11} height="2.4" rx="1.2" fill="#DDDBE6" /></g>)}</>;
    if (k === 'addyours') return <>{card}{band}<circle cx="20" cy="22.6" r="5.6" fill={grad} /><rect x="17.2" y="20.9" width="5.6" height="4" rx="1.1" fill="none" stroke="#FFFFFF" strokeWidth="1.1" /><circle cx="20" cy="22.9" r="1.1" fill="#FFFFFF" /></>;
    if (k === 'count') return <>{card}{band}{[8.5, 16.5, 24.5].map((x) => <rect key={x} x={x} y="18.5" width="7" height="9.5" rx="2" fill="#2A2834" />)}<rect x="10.4" y="22.4" width="3.2" height="1.6" rx="0.8" fill="#FFFFFF" /><rect x="18.4" y="22.4" width="3.2" height="1.6" rx="0.8" fill="#FFFFFF" /><rect x="26.4" y="22.4" width="3.2" height="1.6" rx="0.8" fill="#FFFFFF" /></>;
    if (k === 'slider') return <>{card}<rect x="10" y="11.5" width="14" height="2.6" rx="1.3" fill="#C9C7D4" /><rect x="9" y="23" width="22" height="3" rx="1.5" fill="#ECEBF2" /><rect x="9" y="23" width="13" height="3" rx="1.5" fill={grad} /><text x="22.5" y="28.6" textAnchor="middle" fontSize="10">{emoji}</text></>;
    if (k === 'link') return <><rect x="3.5" y="13.5" width="33" height="13" rx="6.5" fill="#FFFFFF" /><g fill="none" stroke="#7C5CFC" strokeWidth="1.6" strokeLinecap="round"><path d="M10.2 21.4l3.4-3.4" /><path d="M11.6 16.9l1.2-1.2a2.6 2.6 0 0 1 3.7 3.7l-1.2 1.2" /><path d="M12.2 22.5l-1.2 1.2a2.6 2.6 0 0 1-3.7-3.7l1.2-1.2" /></g><rect x="19" y="18.8" width="13" height="2.6" rx="1.3" fill="#C9C7D4" /></>;
    return null;
  })();
  return (
    <svg width="46" height="46" viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8B5CF6" /><stop offset="0.55" stopColor="#EC4899" /><stop offset="1" stopColor="#F59E0B" /></linearGradient></defs>
      {body}
    </svg>
  );
}
export function StoryStickerEditor({ onDone, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const pad = (n) => String(n).padStart(2, '0');
  const soon = new Date(Date.now() + 26 * 3600 * 1000);
  const [kind, setKind] = useState('question');
  const [q, setQ] = useState('Ask me anything');
  const [opts, setOpts] = useState(['Yes', 'No']);
  const [right, setRight] = useState(0);
  const [emoji, setEmoji] = useState(SLIDER_EMOJIS[0]);
  const [date, setDate] = useState(`${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}`);
  const [time, setTime] = useState('20:00');
  const [url, setUrl] = useState('');
  const presetQ = { question: 'Ask me anything', poll: 'Which one?', quiz: 'Guess the answer', slider: 'How much do you like this?', count: 'Party time', link: '', addyours: 'Show your view right now' };
  const pickKind = (k) => { setKind(k); setQ(presetQ[k]); if (k === 'quiz') { setOpts(['', '']); setRight(0); } else if (k === 'poll') setOpts(['Yes', 'No']); };
  const when = new Date(`${date}T${time || '00:00'}`);
  const cleanUrl = kind === 'link' ? normalizeSocialUrl(url) : null;
  const filled = opts.map((o) => o.trim()).filter(Boolean);
  const ok = kind === 'link' ? !!cleanUrl
    : kind === 'count' ? !!q.trim() && Number.isFinite(when.getTime()) && when.getTime() > Date.now()
    : kind === 'quiz' ? !!q.trim() && filled.length >= 2 && !!(opts[right] || '').trim()
    : !!q.trim() && (kind !== 'poll' || filled.length >= 2);
  const done = () => {
    if (!ok) return;
    const t = q.trim().slice(0, 80);
    if (kind === 'poll') onDone({ k: 'poll', q: t, a: filled.map((o) => o.slice(0, 30)).slice(0, 4) });
    else if (kind === 'quiz') {
      const list = opts.map((o, i) => ({ o: o.trim().slice(0, 30), i })).filter((x) => x.o).slice(0, 4);
      onDone({ k: 'quiz', q: t, a: list.map((x) => x.o), c: Math.max(0, list.findIndex((x) => x.i === right)) });
    } else if (kind === 'slider') onDone({ k: 'slider', q: t, e: emoji });
    else if (kind === 'count') onDone({ k: 'count', q: t, t: when.toISOString() });
    else if (kind === 'link') onDone({ k: 'link', u: cleanUrl, l: q.trim().slice(0, 40) || undefined });
    else if (kind === 'addyours') onDone({ k: 'addyours', q: t, c: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}` });
    else onDone({ k: 'question', q: t });
  };
  const field ={ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: FONT, fontSize: 15, colorScheme: 'dark' };
  const placeholder = { question: 'Your question', poll: 'Your question', quiz: 'Your question', slider: 'Your question', count: 'What are you counting down to?', link: 'Text on the sticker, optional', addyours: 'Your prompt' }[kind];
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxHeight: '86%', overflowY: 'auto', boxSizing: 'border-box', background: '#15151B', borderRadius: '22px 22px 0 0', padding: '16px 16px calc(16px + env(safe-area-inset-bottom))', color: '#FFFFFF', fontFamily: FONT }}>
        <div style={{ fontSize: 16, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>Add a sticker</div>
        <div style={{ marginBottom: 12 }}>
          <StudioDark>
            <PickTiles label="Sticker type" size={62} bleed={16} ringBg="#15151B" value={kind} onChange={pickKind}
              options={STORY_STICKER_KINDS.map(([k, label]) => ({ k, label, aria: `${label} sticker`, art: <StoryStickerKindArt k={k} emoji={emoji} /> }))} />
          </StudioDark>
        </div>
        {kind === 'link' && <input value={url} onChange={(e) => setUrl(e.target.value.slice(0, 300))} placeholder="Paste a link" aria-label="Sticker link" inputMode="url" autoCapitalize="none" style={{ ...field, marginBottom: 10 }} />}
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder={placeholder} aria-label="Sticker question" style={field} />
        {(kind === 'poll' || kind === 'quiz') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {opts.map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {kind === 'quiz' && (
                  <div role="button" aria-label={right === i ? `Option ${i + 1} is right` : `Mark option ${i + 1} as right`} onClick={() => { hapticTap(); setRight(i); }} style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box', border: `2px solid ${right === i ? '#22C55E' : 'rgba(255,255,255,0.3)'}`, background: right === i ? '#22C55E' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{right === i && <Check size={15} color="#FFFFFF" strokeWidth={3.2} />}</div>
                )}
                <input value={o} onChange={(e) => { const v = e.target.value.slice(0, 30); setOpts((prev) => prev.map((x, j) => (j === i ? v : x))); }} placeholder={`Option ${i + 1}`} aria-label={`Poll option ${i + 1}`} style={{ ...field, flex: 1 }} />
                {opts.length > 2 && <div role="button" aria-label={`Remove option ${i + 1}`} onClick={() => { setOpts((prev) => prev.filter((_, j) => j !== i)); setRight((r) => (r === i ? 0 : r > i ? r - 1 : r)); }} className="zchat-press" style={{ width: 36, height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255, 255, 255, 0.6)' }}><X size={19} /></div>}
              </div>
            ))}
            {opts.length < 4 && <div role="button" aria-label="Add poll option" onClick={() => setOpts((prev) => [...prev, ''])} style={{ fontSize: 14, fontWeight: 800, color: '#C9B8FF', cursor: 'pointer', padding: '4px 2px' }}>Add an option</div>}
            {kind === 'quiz' && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>Tap the circle next to the right answer.</div>}
          </div>
        )}
        {kind === 'slider' && (
          <div role="radiogroup" aria-label="Slider emoji" style={{ display: 'flex', justifyContent: 'space-between', gap: 4, padding: '14px 4px 2px' }}>
            {SLIDER_EMOJIS.map((e) => {
              const on = emoji === e;
              return <div key={e} role="radio" aria-checked={on} aria-label={`Slider emoji ${e}`} onClick={() => { hapticTap(); setEmoji(e); }} className="zchat-press" style={{ width: 38, height: 38, flexShrink: 0, borderRadius: '50%', fontSize: 23, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: on ? 'rgba(255, 255, 255, 0.16)' : 'transparent', boxShadow: on ? `0 0 0 2px #15151B, 0 0 0 4px ${theme.coral}` : 'none', transition: 'box-shadow 160ms ease, background 160ms ease' }}>{e}</div>;
            })}
          </div>
        )}
        {kind === 'count' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Countdown date" style={{ ...field, flex: 1.3 }} />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Countdown time" style={{ ...field, flex: 1 }} />
          </div>
        )}
        {kind === 'addyours' && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 10, lineHeight: 1.45 }}>Friends tap Add yours to post their own story with the same prompt.</div>}
        <div role="button" aria-label="Add sticker to story" onClick={done} className={ok ? 'zchat-press' : undefined} style={{ marginTop: 16, height: 48, borderRadius: 14, background: ok ? theme.coral : 'rgba(255,255,255,0.12)', color: ok ? '#FFFFFF' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, cursor: ok ? 'pointer' : 'default', transition: 'background 160ms ease, color 160ms ease' }}>Add to story</div>
      </div>
    </div>
  );
}
function StoryStickerPreview({ sticker }) {
  if (!sticker) return null;
  if (sticker.k === 'moment') return <MomentBadge late={!!sticker.late} />;
  if (sticker.k === 'poll') {
    return <StickerCardFrame title={sticker.q}>{sticker.a.map((o, i) => <div key={i} style={{ padding: '11px 14px', borderRadius: 14, background: '#F2F2F5', fontWeight: 700, fontSize: 14.5, marginTop: i ? 8 : 0, textAlign: 'center' }}>{o}</div>)}</StickerCardFrame>;
  }
  if (sticker.k === 'slider') {
    return <StickerCardFrame title={sticker.q}><div style={{ position: 'relative', height: 34, display: 'flex', alignItems: 'center' }}><div style={{ flex: 1, height: 8, borderRadius: 4, background: '#ECECF1' }} /><span style={{ position: 'absolute', left: '10%', fontSize: 28 }}>{sticker.e}</span></div></StickerCardFrame>;
  }
  if (sticker.k === 'quiz') {
    return <StickerCardFrame title={sticker.q}>{sticker.a.map((o, i) => <div key={i} style={{ padding: '11px 14px', borderRadius: 14, background: '#F2F2F5', fontWeight: 700, fontSize: 14.5, marginTop: i ? 8 : 0, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: i === sticker.c ? '#22C55E' : 'transparent', border: i === sticker.c ? 'none' : '2px solid #D5D5DD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i === sticker.c && <Check size={13} color="#FFFFFF" strokeWidth={3.2} />}</span>{o}</div>)}</StickerCardFrame>;
  }
  if (sticker.k === 'count') return <StickerCardFrame title={sticker.q}><CountdownDigits t={sticker.t} /></StickerCardFrame>;
  if (sticker.k === 'link') return <LinkStickerPill sticker={sticker} />;
  if (sticker.k === 'addyours') return <AddYoursCard sticker={sticker} />;
  return <StickerCardFrame title={sticker.q}><div style={{ padding: '11px 14px', borderRadius: 14, background: '#F2F2F5', color: '#8A8A95', fontSize: 14.5, textAlign: 'center' }}>Type something</div></StickerCardFrame>;
}
function postSensColumnReady() {
  if (postSensCol.ok !== null) return Promise.resolve(postSensCol.ok);
  if (!postSensCol.job) {
    postSensCol.job = Promise.resolve(supabase.from('posts').select('sensitive').limit(1)).then(({ error }) => {
      if (!error) postSensCol.ok = true;
      else if (/sensitive|42703|PGRST204/i.test(`${error.code || ''} ${error.message || ''}`)) postSensCol.ok = false;
      return postSensCol.ok !== false;
    }, () => true).then((ok) => { postSensCol.job = null; return ok; });
  }
  return postSensCol.job;
}
function psReady() {
  if (psCols.ok !== null) return Promise.resolve(psCols.ok);
  if (!psCols.job) {
    psCols.job = Promise.resolve(supabase.from('posts').select('kind, poll, alt_texts, captions, remix_of, archived_at').limit(1)).then(({ error }) => {
      if (!error) psCols.ok = true;
      else if (/42703|PGRST204|column|schema/i.test(`${error.code || ''} ${error.message || ''}`)) psCols.ok = false;
      return psCols.ok !== false;
    }, () => true).then((ok) => { psCols.job = null; return ok; });
  }
  return psCols.job;
}
function psTakeRemix() {
  const r = psX.remix;
  psX.remix = null;
  return r && Date.now() - r.at < 4000 ? r : null;
}
function PsAltGlyph({ size = 22, color = 'currentColor', strokeWidth = 1.9 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="3.5" /><path d="M6.4 15l1.7-6 1.7 6M6.9 13.2h2.4M12.3 9v6h2.1M16.2 9h2.6M17.5 9v6" /></svg>;
}
function PsPollGlyph({ size = 22, color = 'currentColor', strokeWidth = 2.1 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" aria-hidden="true"><path d="M4.5 6.5h9M4.5 12h15M4.5 17.5h6" /></svg>;
}

function PsTagChip({ t, onRemove }) {
  return (
    <div data-tool="tag" style={{ position: 'absolute', left: `${t.x * 100}%`, top: `${t.y * 100}%`, transform: 'translate(-50%, 7px)', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto' }}>
      <span aria-hidden="true" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(14,14,18,0.82)' }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: 160, padding: onRemove ? '5px 6px 5px 10px' : '5px 10px', borderRadius: 8, background: 'rgba(14,14,18,0.82)', color: '#FFFFFF', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.user.username || t.user.name}</span>
        {onRemove && <span role="button" aria-label={`Remove tag ${t.user.username || t.user.name}`} onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ display: 'flex', cursor: 'pointer', opacity: 0.75 }}><X size={14} /></span>}
      </span>
    </div>
  );
}

function usePostExtras(on, items, cur, myId) {
  const [ready, setReady] = useState(() => psCols.ok !== false);
  useEffect(() => {
    if (!on) return undefined;
    let alive = true;
    psReady().then((ok) => { if (alive) setReady(ok); });
    return () => { alive = false; };
  }, []);
  const [x, setX] = useState({});
  const [poll, setPoll] = useState(null);
  const [remix] = useState(() => (on ? psTakeRemix() : null));
  const [layout, setLayoutRaw] = useState(() => (remix ? remix.l : 'side'));
  const [sheet, setSheet] = useState(null);
  const [tagging, setTagging] = useState(false);
  const [pickAt, setPickAt] = useState(null);
  useBackClose(on && tagging && !sheet, () => setTagging(false));
  useEffect(() => {
    if (!on) return;
    items.forEach((it) => { psX.items.set(it.url, x[it.url] || {}); psX.polls.set(it.url, poll); });
    while (psX.items.size > 40) psX.items.delete(psX.items.keys().next().value);
    while (psX.polls.size > 40) psX.polls.delete(psX.polls.keys().next().value);
  }, [x, poll, items]);
  const vid = !!cur && cur.kind === 'video';
  const forcedCorner = !!remix && vid;
  useEffect(() => { if (remix) remix.l = forcedCorner ? 'corner' : layout; }, [layout, forcedCorner]);
  useEffect(() => { if (!cur || cur.kind !== 'image') setTagging(false); }, [cur && cur.id]);
  if (!on || !ready || !cur) return null;
  const img = cur.kind === 'image';
  const cx = x[cur.url] || {};
  const patch = (url, p) => setX((all) => ({ ...all, [url]: { ...(all[url] || {}), ...p } }));
  const tags = cx.tags || [];
  const opts = [
    remix ? { k: 'pslayout', on: false, wide: true, label: forcedCorner || layout === 'corner' ? 'In the corner' : 'Side by side', aria: forcedCorner ? 'Remix layout, their post in the corner' : `Remix layout, ${layout === 'corner' ? 'their post in the corner' : 'side by side'}. Tap to change`, icon: <PsRemixGlyph size={21} />, tap: () => { if (!forcedCorner) setLayoutRaw((l) => (l === 'corner' ? 'side' : 'corner')); } } : null,
    img && !remix ? { k: 'pstag', on: tags.length > 0, label: tags.length ? `${tags.length} tagged` : 'Tag people', aria: tags.length ? `${tags.length} tagged, tap to edit tags` : 'Tag people', icon: <PsTagGlyph size={21} />, tap: () => setTagging(true) } : null,
    img ? { k: 'psalt', on: !!cx.alt, label: 'Alt text', aria: cx.alt ? 'Edit alt text' : 'Add alt text', icon: <PsAltGlyph size={21} />, tap: () => setSheet('alt') } : null,
    !remix ? { k: 'pspoll', on: !!poll, label: 'Poll', aria: poll ? 'Edit poll' : 'Add a poll', icon: <PsPollGlyph size={21} />, tap: () => setSheet('poll') } : null,
    vid ? { k: 'pscc', on: !!cx.cc, label: 'Captions', aria: cx.cc ? 'Edit captions' : 'Add captions', icon: <PsCcGlyph size={21} />, tap: () => setSheet('cc') } : null,
  ].filter(Boolean);
  const stage = tagging && img ? (
    <div data-tool="tags" aria-label="Tap the photo where someone is" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (tags.length >= 20) { appSnack('A photo can have up to 20 tags'); return; } setPickAt({ x: Math.max(0.02, Math.min(0.98, (e.clientX - r.left) / Math.max(1, r.width))), y: Math.max(0.02, Math.min(0.92, (e.clientY - r.top) / Math.max(1, r.height))) }); setSheet('pick'); }}
      style={{ position: 'absolute', inset: 0, zIndex: 16, cursor: 'crosshair', background: 'rgba(0,0,0,0.22)', touchAction: 'manipulation' }}>
      {tags.map((t) => <PsTagChip key={t.user.id} t={t} onRemove={() => patch(cur.url, { tags: tags.filter((y) => y.user.id !== t.user.id) })} />)}
    </div>
  ) : null;
  const sheets = (
    <>
      {remix && remix.post && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(66px + env(safe-area-inset-top))', zIndex: 25, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 'calc(100% - 120px)', padding: '5px 12px 5px 5px', borderRadius: 18, background: 'rgba(18,18,24,0.72)', color: '#FFFFFF', fontSize: 13, fontWeight: 700 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.15)' }}>{postThumbOf(remix.post) && postThumbOf(remix.post).url ? <img src={postThumbOf(remix.post).url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Remix of {(remix.post.owner && (remix.post.owner.username || remix.post.owner.name)) || 'a post'}</span>
          </div>
        </div>
      )}
      {tagging && img && !sheet && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(66px + env(safe-area-inset-top))', zIndex: 26, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div role="status" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12, padding: '6px 6px 6px 14px', borderRadius: 20, background: 'rgba(18,18,24,0.82)', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600 }}>
            {tags.length ? 'Tap to tag someone else' : 'Tap where someone is'}
            <span role="button" aria-label="Done tagging" onClick={() => setTagging(false)} style={{ height: 30, padding: '0 14px', borderRadius: 15, background: '#FFFFFF', color: '#000000', display: 'flex', alignItems: 'center', fontWeight: 800, cursor: 'pointer' }}>Done</span>
          </div>
        </div>
      )}
      {sheet === 'alt' && img && <PsAltSheet item={cur} value={cx.alt || ''} onSave={(v) => patch(cur.url, { alt: v })} onClose={() => setSheet(null)} />}
      {sheet === 'poll' && <PsPollSheet value={poll} onSave={setPoll} onClose={() => setSheet(null)} />}
      {sheet === 'cc' && vid && <PsCaptionsSheet item={cur} value={cx.cc || null} onSave={(v) => patch(cur.url, { cc: v })} onClose={() => setSheet(null)} />}
      {sheet === 'pick' && pickAt && <PsTagPicker myId={myId} taken={new Set(tags.map((t) => t.user.id))} onClose={() => setSheet(null)} onPick={(p) => { setSheet(null); hapticTap(); patch(cur.url, { tags: [...tags.filter((y) => y.user.id !== p.id), { user: { id: p.id, name: p.name, username: p.username, avatar: p.avatar }, x: pickAt.x, y: pickAt.y }] }); }} />}
    </>
  );
  return { opts, stage, sheets };
}
function avatarPngBlob(cfg, size = 512) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        c.getContext('2d').drawImage(img, 0, 0, size, size);
        c.toBlob((b) => resolve(b), 'image/png');
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = avatarSvgUrl(cfg);
  });
}

const AV_NAMES = { short: 'Short', fringe: 'Fringe', long: 'Long', bun: 'Bun', curly: 'Curly', spiky: 'Spiky', side: 'Side part', pony: 'Ponytail', buzz: 'Buzz cut', dots: 'Dots', happy: 'Happy', big: 'Big', sleepy: 'Sleepy', wink: 'Wink', lashes: 'Lashes', smile: 'Smile', grin: 'Grin', small: 'Small', o: 'Surprised', tongue: 'Tongue', flat: 'Flat', round: 'Round', oval: 'Oval', soft: 'Soft', square: 'Square', shades: 'Shades', earrings: 'Earrings', headphones: 'Headphones', cap: 'Cap', flower: 'Flower', bow: 'Bow', freckles: 'Freckles', none: 'None' };
export function AvatarMakerPage({ initial, onClose, onSave }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [cfg, setCfg] = useState(() => avatarCfgOf(initial));
  const [tab, setTab] = useState('skin');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => { setCfg((c) => ({ ...c, [k]: v })); hapticTap(); };
  const random = () => {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    setCfg(avatarCfgOf({ skin: Math.floor(Math.random() * AV_SKIN.length), face: Math.floor(Math.random() * AV_FACE.length), hair: pick(AV_HAIR), hairColor: Math.floor(Math.random() * AV_HAIRC.length), eyes: pick(AV_EYES), mouth: pick(AV_MOUTH), glasses: Math.random() < 0.7 ? 'none' : pick(AV_GLASSES), extra: Math.random() < 0.5 ? 'none' : pick(AV_EXTRA), shirt: Math.floor(Math.random() * AV_SHIRT.length), bg: Math.floor(Math.random() * AV_BG.length), cheeks: Math.random() < 0.7 }));
    playUiSound('tap');
  };
  const tabs = [['skin', 'Skin'], ['face', 'Face'], ['hair', 'Hair'], ['hairColor', 'Hair colour'], ['eyes', 'Eyes'], ['mouth', 'Mouth'], ['glasses', 'Glasses'], ['extra', 'Extras'], ['shirt', 'Top'], ['bg', 'Background']];
  const swatches = (list, key) => (
    <div role="radiogroup" aria-label={(tabs.find(([k]) => k === key) || [key, key])[1]} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 14, justifyItems: 'center', padding: '6px 2px' }}>
      {list.map((col, i) => {
        const on = cfg[key] === i;
        return <div key={col} role="radio" aria-checked={on} aria-label={`${key} colour ${i + 1}`} onClick={() => set(key, i)} className="zchat-press" style={{ width: 44, height: 44, borderRadius: '50%', background: col, cursor: 'pointer', boxShadow: on ? `0 0 0 2.5px ${theme.bgGradient}, 0 0 0 4.5px ${theme.coral}` : `inset 0 0 0 1px ${theme.dark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,19,0.12)'}`, transition: 'box-shadow 160ms ease' }} />;
      })}
    </div>
  );
  const options = (list, key) => (
    <StudioTileGrid label={(tabs.find(([k]) => k === key) || [key, key])[1]} cols={4} radius={18} ringBg={theme.bgGradient} value={cfg[key]} onChange={(val) => setCfg((c) => ({ ...c, [key]: val }))}
      options={list.map((v, idx) => {
        const val = key === 'face' ? idx : v;
        return { k: val, label: key === 'hair' && v === 'none' ? 'Bald' : (AV_NAMES[v] || String(v)), aria: `${key} ${v}`, art: <img src={avatarSvgUrl({ ...cfg, [key]: val })} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} /> };
      })} />
  );
  const save = async () => {
    if (busy) return;
    setBusy(true);
    const blob = await avatarPngBlob(cfg);
    if (!blob) { setBusy(false); return; }
    const ok = await onSave(blob, cfg);
    setBusy(false);
    if (ok !== false) onClose();
  };
  return (
    <FullPage title="Avatar maker" onBack={onClose} zIndex={720} pad={false}
      right={<div role="button" aria-label="Random avatar" onClick={random} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><DiceLineIcon size={21} /></div>}
      footer={<BigButton label={busy ? 'Saving' : 'Use as my photo'} disabled={busy} onClick={save} />}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 10px' }}>
        <img src={avatarSvgUrl(cfg)} alt="Your avatar" draggable={false} style={{ width: 168, height: 168, borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.18)' }} />
      </div>
      <KitTabs label="Avatar parts" value={tab} onChange={setTab} options={tabs} style={{ margin: '4px 0 0', padding: '0 4px' }} />
      <div style={{ padding: '12px 16px 20px' }}>
        {tab === 'skin' && swatches(AV_SKIN, 'skin')}
        {tab === 'hairColor' && swatches(AV_HAIRC, 'hairColor')}
        {tab === 'shirt' && swatches(AV_SHIRT, 'shirt')}
        {tab === 'bg' && swatches(AV_BG, 'bg')}
        {tab === 'face' && options(AV_FACE, 'face')}
        {tab === 'hair' && options(AV_HAIR, 'hair')}
        {tab === 'eyes' && options(AV_EYES, 'eyes')}
        {tab === 'mouth' && options(AV_MOUTH, 'mouth')}
        {tab === 'glasses' && options(AV_GLASSES, 'glasses')}
        {tab === 'extra' && (
          <>
            {options(AV_EXTRA, 'extra')}
            <IgRow inset={false} label="Rosy cheeks" right={<IgToggle on={cfg.cheeks} onClick={() => set('cheeks', !cfg.cheeks)} />} />
          </>
        )}
      </div>
    </FullPage>
  );
}
function FilterIcon({ size = 20, color = 'currentColor', strokeWidth = 1.9, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} style={style} aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" /><circle cx="15" cy="9" r="5.5" /><circle cx="12" cy="15" r="5.5" />
    </svg>
  );
}

const PAINT_PALETTE = ['#111111', '#4B5563', '#9CA3AF', '#FFFFFF', '#7F1D1D', '#EF4444', '#F97316', '#F59E0B', '#FACC15', '#FDE68A', '#14532D', '#22C55E', '#86EFAC', '#0E7490', '#06B6D4', '#1E3A8A', '#3B82F6', '#93C5FD', '#4C1D95', '#8B5CF6', '#C4B5FD', '#9D174D', '#EC4899', '#F9A8D4', '#78350F', '#B45309', '#D6A77A', '#FDE7D3'];
const PAINT_BRUSHES = [
  { k: 'pen', label: 'Pen' }, { k: 'pencil', label: 'Pencil' }, { k: 'marker', label: 'Marker' }, { k: 'highlighter', label: 'Highlighter' },
  { k: 'crayon', label: 'Crayon' }, { k: 'spray', label: 'Spray' }, { k: 'calligraphy', label: 'Calligraphy' }, { k: 'neon', label: 'Neon' },
];
const PAINT_SHAPES = [
  { k: 'line', label: 'Line' }, { k: 'arrow', label: 'Arrow' }, { k: 'rect', label: 'Box' }, { k: 'round', label: 'Rounded box' },
  { k: 'ellipse', label: 'Circle' }, { k: 'triangle', label: 'Triangle' }, { k: 'star', label: 'Star' }, { k: 'heart', label: 'Heart' }, { k: 'bubble', label: 'Speech bubble' },
];
const PAINT_SIZES = { square: [1080, 1080, 'Square'], portrait: [1080, 1350, 'Portrait'], story: [1080, 1920, 'Story'] };
const PAINT_BACKGROUNDS = [['white', '#FFFFFF', 'White'], ['paper', '#FBF6EC', 'Paper'], ['black', '#141416', 'Black'], ['grid', '#FFFFFF', 'Grid'], ['dots', '#FFFFFF', 'Dots'], ['lines', '#FFFFFF', 'Lines'], ['sky', '#E6F0FF', 'Sky'], ['mint', '#E3F6EE', 'Mint']];
const PAINT_STAMPS = ['❤️', '⭐', '✨', '\u{1F525}', '\u{1F602}', '\u{1F970}', '\u{1F60E}', '\u{1F431}', '\u{1F436}', '\u{1F338}', '\u{1F308}', '☀️', '\u{1F319}', '\u{1F389}', '\u{1F44D}', '\u{1F4AF}'];
const PAINT_FONTS = [['sans', 'Clean', `800 {s}px ${FONT}`], ['serif', 'Classic', '700 {s}px Georgia, "Times New Roman", serif'], ['mono', 'Typewriter', '700 {s}px "Courier New", Courier, monospace'], ['hand', 'Hand', '700 {s}px "Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive']];
const PAINT_IDEAS = ['A cat in a spaceship', 'Your dream house', 'A monster eating pizza', 'Your best friend as a superhero', 'A city at night', 'A tiny dragon', 'Breakfast with a face', 'A robot walking a dog', 'The view from your window', 'A fish wearing a hat', 'Your pet as a king', 'A rainy day', 'An alien at the beach', 'A treehouse', 'A birthday cake for a friend', 'A dinosaur playing football', 'Your favourite food', 'A happy cloud', 'A snowman on holiday', 'A secret door in a tree', 'The moon having a party', 'A cactus with feelings', 'A bus full of animals', 'A castle made of candy', 'Your face as an emoji', 'A sleepy owl', 'Two cats asleep on a bed at night', 'A rocket made of fruit', 'A shark at the dentist', 'A garden on a roof'];
const PAINT_BOT_ASKS = [
  { k: 'guess', label: 'What did I draw?', sub: 'Let ZChat Bot guess', prompt: 'Look at my drawing and guess what it is. Keep it short and fun, like a friend guessing.' },
  { k: 'rate', label: 'Rate my drawing', sub: 'A score and one thing it likes', prompt: 'Rate my drawing out of 10 and tell me one thing you like about it. Be kind and short.' },
  { k: 'tip', label: 'How can I make it better?', sub: 'One simple tip', prompt: 'Give me one simple tip to make this drawing better. One or two short sentences.' },
  { k: 'idea', label: 'What should I draw?', sub: 'A fresh idea', prompt: 'Give me one fun idea for what to draw next. Just the idea in one short sentence.' },
];

function paintRng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function paintSymXf(sym, W, H) {
  const id = (x, y) => [x, y];
  if (sym === 'mirror') return [id, (x, y) => [W - x, y]];
  if (sym === 'quad') return [id, (x, y) => [W - x, y], (x, y) => [x, H - y], (x, y) => [W - x, H - y]];
  if (sym === 'radial') {
    const cx = W / 2;
    const cy = H / 2;
    return [0, 1, 2, 3, 4, 5].map((k) => {
      const a = (k * Math.PI) / 3;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return (x, y) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
    });
  }
  return [id];
}

function paintStrokeWidth(op, p) {
  if (op.brush === 'pen' && op.pressure) return Math.max(1, op.size * (0.25 + (p || 0.5) * 1.1));
  if (op.brush === 'pencil') return Math.max(1, op.size * 0.55);
  if (op.brush === 'highlighter') return op.size * 1.6;
  if (op.brush === 'marker') return op.size * 1.2;
  return op.size;
}

function makePaintRenderer(op, W, H) {
  const rnd = paintRng(op.seed || 7);
  const xfs = paintSymXf(op.sym || 'off', W, H);
  const brush = op.eraser ? 'pen' : op.brush;
  let i = 0;
  let tailDone = false;
  const color = op.eraser ? '#000000' : op.color;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const smoothSeg = (ctx, pts, k) => {
    const w = paintStrokeWidth(op, pts[k][2]);
    xfs.forEach((xf) => {
      ctx.beginPath();
      if (k === 0) {
        const [x, y] = xf(pts[0][0], pts[0][1]);
        ctx.arc(x, y, w / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        return;
      }
      const a = k === 1 ? pts[0] : mid(pts[k - 2], pts[k - 1]);
      const c = pts[k - 1];
      const b = mid(pts[k - 1], pts[k]);
      const A = xf(a[0], a[1]);
      const C = xf(c[0], c[1]);
      const B = xf(b[0], b[1]);
      ctx.moveTo(A[0], A[1]);
      if (k === 1) ctx.lineTo(B[0], B[1]); else ctx.quadraticCurveTo(C[0], C[1], B[0], B[1]);
      ctx.lineWidth = w;
      ctx.strokeStyle = color;
      ctx.stroke();
    });
  };
  const point = (ctx, pts, k) => {
    const p = pts[k];
    const prev = k > 0 ? pts[k - 1] : p;
    if (brush === 'pen' || brush === 'marker' || brush === 'neon' || brush === 'highlighter') {
      ctx.lineCap = brush === 'highlighter' ? 'square' : 'round';
      ctx.lineJoin = 'round';
      if (brush === 'neon') { ctx.shadowColor = color; ctx.shadowBlur = op.size * 1.4; }
      smoothSeg(ctx, pts, k);
      if (brush === 'neon') {
        ctx.shadowBlur = 0;
        const w = Math.max(1, op.size * 0.32);
        xfs.forEach((xf) => {
          const A = xf(prev[0], prev[1]);
          const B = xf(p[0], p[1]);
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(B[0], B[1]);
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(255,255,255,0.85)';
          ctx.stroke();
        });
      }
      return;
    }
    const dx = p[0] - prev[0];
    const dy = p[1] - prev[1];
    const len = Math.hypot(dx, dy);
    if (brush === 'pencil') {
      const w = paintStrokeWidth(op, p[2]);
      xfs.forEach((xf) => {
        for (let j = 0; j < 3; j++) {
          const jx = (rnd() - 0.5) * w * 0.9;
          const jy = (rnd() - 0.5) * w * 0.9;
          const A = xf(prev[0] + jx, prev[1] + jy);
          const B = xf(p[0] + jx, p[1] + jy);
          ctx.beginPath();
          ctx.moveTo(A[0], A[1]);
          ctx.lineTo(B[0], B[1]);
          ctx.lineWidth = Math.max(0.8, w * (0.35 + rnd() * 0.4));
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.28 + rnd() * 0.4;
          ctx.strokeStyle = color;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      });
      return;
    }
    if (brush === 'crayon') {
      const step = Math.max(1.5, op.size * 0.22);
      const n = Math.max(1, Math.ceil(len / step));
      xfs.forEach((xf) => {
        for (let j = 0; j <= n; j++) {
          const t = j / n;
          for (let q = 0; q < 4; q++) {
            const ox = (rnd() - 0.5) * op.size * 0.9;
            const oy = (rnd() - 0.5) * op.size * 0.9;
            const [x, y] = xf(prev[0] + dx * t + ox, prev[1] + dy * t + oy);
            const r = op.size * (0.08 + rnd() * 0.12);
            ctx.globalAlpha = 0.35 + rnd() * 0.55;
            ctx.fillStyle = color;
            ctx.fillRect(x - r, y - r, r * 2, r * 2);
          }
        }
        ctx.globalAlpha = 1;
      });
      return;
    }
    if (brush === 'spray') {
      const r0 = op.size * 1.3;
      const n = Math.ceil(op.size * 1.1) + Math.ceil(len * 0.4);
      xfs.forEach((xf) => {
        for (let j = 0; j < n; j++) {
          const a = rnd() * Math.PI * 2;
          const rr = Math.sqrt(rnd()) * r0;
          const t = rnd();
          const [x, y] = xf(prev[0] + dx * t + Math.cos(a) * rr, prev[1] + dy * t + Math.sin(a) * rr);
          const d = Math.max(0.6, op.size * 0.05) * (0.6 + rnd() * 0.9);
          ctx.fillStyle = color;
          ctx.fillRect(x - d / 2, y - d / 2, d, d);
        }
      });
      return;
    }
    if (brush === 'calligraphy') {
      const nx = Math.cos(-Math.PI / 4) * op.size * 0.55;
      const ny = Math.sin(-Math.PI / 4) * op.size * 0.55;
      xfs.forEach((xf) => {
        const A1 = xf(prev[0] + nx, prev[1] + ny);
        const B1 = xf(p[0] + nx, p[1] + ny);
        const B2 = xf(p[0] - nx, p[1] - ny);
        const A2 = xf(prev[0] - nx, prev[1] - ny);
        ctx.beginPath();
        ctx.moveTo(A1[0], A1[1]);
        ctx.lineTo(B1[0], B1[1]);
        ctx.lineTo(B2[0], B2[1]);
        ctx.lineTo(A2[0], A2[1]);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
      });
    }
  };
  return (ctx, upto, final) => {
    const pts = op.pts;
    const end = Math.min(upto == null ? pts.length : upto, pts.length);
    ctx.save();
    for (; i < end; i++) point(ctx, pts, i);
    if (final && !tailDone && pts.length > 1 && (brush === 'pen' || brush === 'marker' || brush === 'neon' || brush === 'highlighter')) {
      tailDone = true;
      const n = pts.length;
      const w = paintStrokeWidth(op, pts[n - 1][2]);
      if (brush === 'neon') { ctx.shadowColor = color; ctx.shadowBlur = op.size * 1.4; }
      xfs.forEach((xf) => {
        const a = mid(pts[n - 2], pts[n - 1]);
        const A = xf(a[0], a[1]);
        const B = xf(pts[n - 1][0], pts[n - 1][1]);
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.lineWidth = w;
        ctx.lineCap = brush === 'highlighter' ? 'square' : 'round';
        ctx.strokeStyle = color;
        ctx.stroke();
      });
    }
    ctx.restore();
  };
}

function paintShapePath(ctx, op) {
  const { kind } = op;
  const x0 = op.x0;
  const y0 = op.y0;
  const x1 = op.x1;
  const y1 = op.y1;
  const l = Math.min(x0, x1);
  const t = Math.min(y0, y1);
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  ctx.beginPath();
  if (kind === 'line' || kind === 'arrow') {
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    if (kind === 'arrow') {
      const a = Math.atan2(y1 - y0, x1 - x0);
      const hl = Math.max(22, op.size * 3.2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - hl * Math.cos(a - 0.45), y1 - hl * Math.sin(a - 0.45));
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - hl * Math.cos(a + 0.45), y1 - hl * Math.sin(a + 0.45));
    }
    return false;
  }
  if (kind === 'poly' && op.pts) {
    op.pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    return true;
  }
  if (kind === 'rect') ctx.rect(l, t, w, h);
  else if (kind === 'round') {
    const r = Math.min(w, h) * 0.2;
    ctx.moveTo(l + r, t);
    ctx.arcTo(l + w, t, l + w, t + h, r);
    ctx.arcTo(l + w, t + h, l, t + h, r);
    ctx.arcTo(l, t + h, l, t, r);
    ctx.arcTo(l, t, l + w, t, r);
    ctx.closePath();
  } else if (kind === 'ellipse') ctx.ellipse(l + w / 2, t + h / 2, Math.max(0.5, w / 2), Math.max(0.5, h / 2), 0, 0, Math.PI * 2);
  else if (kind === 'triangle') {
    ctx.moveTo(l + w / 2, t);
    ctx.lineTo(l + w, t + h);
    ctx.lineTo(l, t + h);
    ctx.closePath();
  } else if (kind === 'star') {
    const cx = l + w / 2;
    const cy = t + h / 2 + h * 0.04;
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rx = (k % 2 ? 0.2 : 0.5) * w;
      const ry = (k % 2 ? 0.2 : 0.5) * h;
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * ry;
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (kind === 'heart') {
    ctx.moveTo(l + w / 2, t + h * 0.95);
    ctx.bezierCurveTo(l - w * 0.1, t + h * 0.5, l + w * 0.1, t - h * 0.08, l + w / 2, t + h * 0.28);
    ctx.bezierCurveTo(l + w * 0.9, t - h * 0.08, l + w * 1.1, t + h * 0.5, l + w / 2, t + h * 0.95);
    ctx.closePath();
  } else if (kind === 'bubble') {
    const bh = h * 0.78;
    const r = Math.min(w, bh) * 0.3;
    ctx.moveTo(l + r, t);
    ctx.arcTo(l + w, t, l + w, t + bh, r);
    ctx.arcTo(l + w, t + bh, l, t + bh, r);
    ctx.lineTo(l + w * 0.36, t + bh);
    ctx.lineTo(l + w * 0.18, t + h);
    ctx.lineTo(l + w * 0.22, t + bh);
    ctx.arcTo(l, t + bh, l, t, r);
    ctx.arcTo(l, t, l + w, t, r);
    ctx.closePath();
  }
  return true;
}

function paintDrawShape(ctx, op) {
  ctx.save();
  ctx.strokeStyle = op.color;
  ctx.fillStyle = op.color;
  ctx.lineWidth = op.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const closed = paintShapePath(ctx, op);
  if (closed && op.fill) ctx.fill(); else ctx.stroke();
  ctx.restore();
}

function paintFontFor(op) {
  const f = PAINT_FONTS.find((x) => x[0] === op.font) || PAINT_FONTS[0];
  return f[2].replace('{s}', String(Math.round(op.size)));
}

function paintDrawText(ctx, op) {
  ctx.save();
  ctx.font = paintFontFor(op);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = String(op.text || '').split('\n');
  const lh = op.size * 1.18;
  const top = op.y - ((lines.length - 1) * lh) / 2;
  lines.forEach((ln, k) => {
    if (op.outline) {
      ctx.lineWidth = Math.max(3, op.size * 0.16);
      ctx.strokeStyle = op.outline;
      ctx.lineJoin = 'round';
      ctx.strokeText(ln, op.x, top + k * lh);
    }
    ctx.fillStyle = op.color;
    ctx.fillText(ln, op.x, top + k * lh);
  });
  ctx.restore();
}

function paintDrawStamp(ctx, op) {
  ctx.save();
  ctx.font = `${Math.round(op.size)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(op.x, op.y);
  if (op.rot) ctx.rotate(op.rot);
  ctx.fillText(op.emoji, 0, 0);
  ctx.restore();
}

function paintHexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}

function paintFloodMask(img, W, H, sx, sy, tol) {
  const d = img.data;
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  if (x0 < 0 || y0 < 0 || x0 >= W || y0 >= H) return null;
  const i0 = (y0 * W + x0) * 4;
  const tr = d[i0];
  const tg = d[i0 + 1];
  const tb = d[i0 + 2];
  const ta = d[i0 + 3];
  const mask = new Uint8Array(W * H);
  const same = (p) => {
    const k = p * 4;
    return Math.abs(d[k] - tr) <= tol && Math.abs(d[k + 1] - tg) <= tol && Math.abs(d[k + 2] - tb) <= tol && Math.abs(d[k + 3] - ta) <= tol;
  };
  const stack = [x0, y0];
  let count = 0;
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    let lx = x;
    const row = y * W;
    while (lx > 0 && !mask[row + lx - 1] && same(row + lx - 1)) lx -= 1;
    let rx = x;
    while (rx < W - 1 && !mask[row + rx + 1] && same(row + rx + 1)) rx += 1;
    for (let xx = lx; xx <= rx; xx++) {
      const p = row + xx;
      if (mask[p]) continue;
      mask[p] = 1;
      count += 1;
      if (y > 0) { const q = p - W; if (!mask[q] && same(q)) stack.push(xx, y - 1); }
      if (y < H - 1) { const q = p + W; if (!mask[q] && same(q)) stack.push(xx, y + 1); }
    }
  }
  if (!count) return null;
  const grown = new Uint8Array(mask);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (mask[p]) continue;
      if (mask[p - 1] || mask[p + 1] || mask[p - W] || mask[p + W]) grown[p] = 1;
    }
  }
  return grown;
}

const PAINT_TEMPLATES = {
  cat: { label: 'Cat', draw: (ctx) => {
    const P = (d) => ctx.stroke(new Path2D(d));
    ctx.save();
    ctx.translate(100, 70);
    ctx.scale(8, 8);
    ctx.lineWidth = 1.4;
    P('M68 92 C86 96 96 84 90 71 C88.5 67.5 91.5 64.5 95 66.5 L97.5 61.5 C91 58 84.5 63 85.4 71.6 C90 82 82 89 68 87');
    P('M32 57 C25 69 23 84 28 98 C28.6 99.4 30 100 31.6 100 H68.4 C70 100 71.4 99.4 72 98 C77 84 75 69 68 57');
    P('M43 62 C40 73 41 85 44 96.5 H56 C59 85 60 73 57 62');
    P('M33 99 C33 96 37 94.4 41 94.4 C45 94.4 49 96 49 99 M51 99 C51 96 55 94.4 59 94.4 C63 94.4 67 96 67 99');
    P('M29 36 L25 12 C24.6 8.5 27 7.6 29.5 9.6 L45 23 M71 36 L75 12 C75.4 8.5 73 7.6 70.5 9.6 L55 23');
    P('M30.5 28 L29 15.5 L39 23.2 Z M69.5 28 L71 15.5 L61 23.2 Z');
    P('M22 46 C21 31 33 21 50 21 C67 21 79 31 78 46 C77 57 66 64 50 64 C34 64 23 57 22 46 Z');
    P('M37.5 51.5 C37.5 46 43 43 50 43 C57 43 62.5 46 62.5 51.5 C62.5 57 57 60.3 50 60.3 C43 60.3 37.5 57 37.5 51.5 Z');
    P('M35 43 Q39.5 38.5 44 43 M56 43 Q60.5 38.5 65 43');
    P('M47 48.4 H53 L50 51.6 Z M50 51.6 Q50 55 46.6 55.4 M50 51.6 Q50 55 53.4 55.4');
    P('M29 50 L16 48 M29 53.5 L16 55.5 M71 50 L84 48 M71 53.5 L84 55.5');
    P('M44 25 L45.4 31 M50 24 L50 31 M56 25 L54.6 31');
    ctx.restore();
  } },
  house: { label: 'House', draw: (ctx) => {
    const P = (d) => ctx.stroke(new Path2D(d));
    P('M200 480 L500 220 L800 480 Z');
    P('M250 478 H750 V830 H250 Z');
    P('M440 830 V650 Q440 615 475 615 H525 Q560 615 560 650 V830');
    P('M300 540 H405 V640 H300 Z M352 540 V640 M300 590 H405');
    P('M595 540 H700 V640 H595 Z M647 540 V640 M595 590 H700');
    P('M630 350 V250 H700 V410');
    P('M60 830 H940');
    P('M790 160 A62 62 0 1 0 914 160 A62 62 0 1 0 790 160 Z');
    P('M852 60 V76 M852 244 V260 M752 160 H768 M936 160 H952 M781 89 L792 100 M912 220 L923 231 M781 231 L792 220 M912 100 L923 89');
    P('M120 300 C108 262 150 238 186 256 C206 222 268 226 280 268 C318 266 334 306 300 322 H140 C104 322 94 296 120 300 Z');
    P('M100 830 C100 770 180 760 200 810 C210 780 260 780 262 830 M740 830 C740 780 800 770 820 810 C830 784 890 786 900 830');
  } },
  flower: { label: 'Flower', draw: (ctx) => {
    const P = (d) => ctx.stroke(new Path2D(d));
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.ellipse(500 + Math.cos(a) * 128, 330 + Math.sin(a) * 128, 78, 46, a, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(500, 330, 72, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(500, 330, 72, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(500, 330, 34, 0, Math.PI * 2); ctx.stroke();
    P('M500 470 C488 590 516 700 500 830');
    P('M504 640 C580 580 660 590 704 622 C642 672 570 680 504 640 Z');
    P('M496 720 C420 660 340 670 296 702 C358 752 430 760 496 720 Z');
    P('M370 830 H630 L600 960 H400 Z M352 830 H648 V870 H352 Z');
  } },
  fish: { label: 'Fish', draw: (ctx) => {
    const P = (d) => ctx.stroke(new Path2D(d));
    P('M200 500 C290 330 560 320 700 500 C560 680 290 670 200 500 Z');
    P('M690 500 L870 370 Q835 500 870 630 Z');
    ctx.beginPath(); ctx.arc(320, 470, 28, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(326, 466, 10, 0, Math.PI * 2); ctx.fill();
    P('M420 410 Q378 500 420 590');
    P('M430 372 Q500 262 600 366');
    P('M470 628 Q510 712 576 648');
    P('M500 470 Q530 450 560 470 M540 520 Q570 500 600 520 M480 540 Q510 520 540 540');
    ctx.beginPath(); ctx.arc(170, 300, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(130, 220, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(186, 160, 14, 0, Math.PI * 2); ctx.stroke();
    P('M40 860 Q140 800 240 860 T440 860 T640 860 T840 860 T1000 860');
  } },
  rocket: { label: 'Rocket', draw: (ctx) => {
    const P = (d) => ctx.stroke(new Path2D(d));
    P('M500 120 C610 230 650 400 626 650 H374 C350 400 390 230 500 120 Z');
    ctx.beginPath(); ctx.arc(500, 380, 64, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(500, 380, 40, 0, Math.PI * 2); ctx.stroke();
    P('M380 520 L270 690 L376 650 Z M620 520 L730 690 L624 650 Z');
    P('M420 652 Q500 930 580 652 M456 652 Q500 810 544 652');
    P('M440 220 Q500 200 560 220');
    [[180, 200], [820, 280], [170, 720], [840, 760]].forEach(([x, y]) => {
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 18 : 42;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    });
  } },
  mandala: { label: 'Mandala', draw: (ctx) => {
    [70, 150, 250, 350, 440].forEach((r) => { ctx.beginPath(); ctx.arc(500, 500, r, 0, Math.PI * 2); ctx.stroke(); });
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      ctx.beginPath();
      ctx.ellipse(500 + Math.cos(a) * 200, 500 + Math.sin(a) * 200, 50, 26, a, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(500 + Math.cos(a) * 70, 500 + Math.sin(a) * 70);
      ctx.lineTo(500 + Math.cos(a) * 150, 500 + Math.sin(a) * 150);
      ctx.stroke();
    }
    for (let k = 0; k < 24; k++) {
      const a = (k * Math.PI) / 12;
      ctx.beginPath();
      ctx.arc(500 + Math.cos(a) * 300, 500 + Math.sin(a) * 300, 24, 0, Math.PI * 2);
      ctx.stroke();
      const a2 = a + Math.PI / 24;
      ctx.beginPath();
      ctx.moveTo(500 + Math.cos(a) * 350, 500 + Math.sin(a) * 350);
      ctx.quadraticCurveTo(500 + Math.cos(a2) * 470, 500 + Math.sin(a2) * 470, 500 + Math.cos(a + Math.PI / 12) * 350, 500 + Math.sin(a + Math.PI / 12) * 350);
      ctx.stroke();
    }
  } },
};

function paintRecognize(pts) {
  const n = pts.length;
  if (n < 6) return null;
  let L = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let k = 0; k < n; k++) {
    const [x, y] = pts[k];
    if (k) L += Math.hypot(x - pts[k - 1][0], y - pts[k - 1][1]);
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const diag = Math.hypot(w, h);
  if (diag < 40) return null;
  const first = pts[0];
  const last = pts[n - 1];
  const gap = Math.hypot(last[0] - first[0], last[1] - first[1]);
  if (gap > Math.max(30, L * 0.16)) {
    const d = gap;
    if (d < 40 || L / d > 1.12) return null;
    let dev = 0;
    for (let k = 0; k < n; k++) {
      const [x, y] = pts[k];
      const t = Math.abs((last[1] - first[1]) * x - (last[0] - first[0]) * y + last[0] * first[1] - last[1] * first[0]) / d;
      dev = Math.max(dev, t);
    }
    if (dev > Math.max(8, d * 0.06)) return null;
    return { kind: 'line', x0: first[0], y0: first[1], x1: last[0], y1: last[1] };
  }
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  let err = 0;
  for (let k = 0; k < n; k++) {
    const [x, y] = pts[k];
    const r = Math.hypot((x - cx) / Math.max(1, w / 2), (y - cy) / Math.max(1, h / 2));
    err += Math.abs(r - 1);
  }
  err /= n;
  const simplify = (list, eps) => {
    if (list.length < 3) return list;
    let idx = -1;
    let dmax = 0;
    const a = list[0];
    const b = list[list.length - 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    for (let k = 1; k < list.length - 1; k++) {
      const p = list[k];
      const dd = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
      if (dd > dmax) { dmax = dd; idx = k; }
    }
    if (dmax > eps) {
      const l1 = simplify(list.slice(0, idx + 1), eps);
      const l2 = simplify(list.slice(idx), eps);
      return [...l1.slice(0, -1), ...l2];
    }
    return [a, b];
  };
  let far = 0;
  let fi = 0;
  for (let k = 0; k < n; k++) {
    const dd = Math.hypot(pts[k][0] - first[0], pts[k][1] - first[1]);
    if (dd > far) { far = dd; fi = k; }
  }
  const eps = diag * 0.07;
  const half1 = simplify(pts.slice(0, fi + 1).map((p) => [p[0], p[1]]), eps);
  const half2 = simplify(pts.slice(fi).map((p) => [p[0], p[1]]), eps);
  let verts = [...half1.slice(0, -1), ...half2.slice(0, -1)];
  const merged = [];
  verts.forEach((v) => {
    const prev = merged[merged.length - 1];
    if (!prev || Math.hypot(v[0] - prev[0], v[1] - prev[1]) > diag * 0.12) merged.push(v);
  });
  if (merged.length > 2 && Math.hypot(merged[0][0] - merged[merged.length - 1][0], merged[0][1] - merged[merged.length - 1][1]) < diag * 0.12) merged.pop();
  verts = merged;
  if (verts.length === 3 && err > 0.1) return { kind: 'poly', pts: verts, x0: minX, y0: minY, x1: maxX, y1: maxY };
  if (verts.length === 4 && err > 0.1) {
    let ok = true;
    for (let k = 0; k < 4; k++) {
      const a = verts[(k + 3) % 4];
      const b = verts[k];
      const c = verts[(k + 1) % 4];
      const v1 = [a[0] - b[0], a[1] - b[1]];
      const v2 = [c[0] - b[0], c[1] - b[1]];
      const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / ((Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1])) || 1);
      if (Math.abs(cos) > 0.42) ok = false;
    }
    if (ok) return { kind: 'rect', x0: minX, y0: minY, x1: maxX, y1: maxY };
    return { kind: 'poly', pts: verts, x0: minX, y0: minY, x1: maxX, y1: maxY };
  }
  if (err < 0.14) return { kind: 'ellipse', x0: minX, y0: minY, x1: maxX, y1: maxY };
  return null;
}

function paintHsv(hex) {
  const [r, g, b] = paintHexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max];
}
function paintHex(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rgb = [0, 0, 0];
  if (h < 60) rgb = [c, x, 0]; else if (h < 120) rgb = [x, c, 0]; else if (h < 180) rgb = [0, c, x]; else if (h < 240) rgb = [0, x, c]; else if (h < 300) rgb = [x, 0, c]; else rgb = [c, 0, x];
  return `#${rgb.map((u) => Math.round((u + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

const paintThumbs = new Map();
function paintTplThumb(k) {
  if (paintThumbs.has(k)) return paintThumbs.get(k);
  let url = '';
  try {
    const tpl = PAINT_TEMPLATES[k];
    const cv = document.createElement('canvas');
    cv.width = 192; cv.height = 192;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 192, 192);
    const s = (192 / 1000) * 0.84;
    ctx.translate((192 - 1000 * s) / 2, (192 - 1000 * s) / 2);
    ctx.scale(s, s);
    ctx.strokeStyle = '#1B1A22';
    ctx.fillStyle = '#1B1A22';
    ctx.lineWidth = 15;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tpl) tpl.draw(ctx);
    url = cv.toDataURL('image/png');
  } catch {}
  paintThumbs.set(k, url);
  return url;
}
function paintBgArt(k, col) {
  const base = { position: 'absolute', inset: 0, background: col };
  if (k === 'grid') return <div style={{ ...base, backgroundImage: 'linear-gradient(rgba(80,90,130,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(80,90,130,0.24) 1px, transparent 1px)', backgroundSize: '10px 10px', backgroundPosition: '4px 4px' }} />;
  if (k === 'dots') return <div style={{ ...base, backgroundImage: 'radial-gradient(rgba(80,90,130,0.42) 1.1px, transparent 1.4px)', backgroundSize: '10px 10px', backgroundPosition: '4px 4px' }} />;
  if (k === 'lines') return <div style={{ ...base, backgroundImage: 'linear-gradient(90deg, transparent 13px, rgba(230,80,90,0.4) 13px, rgba(230,80,90,0.4) 14px, transparent 14px), linear-gradient(rgba(70,110,200,0.32) 1px, transparent 1px)', backgroundSize: '100% 100%, 100% 10px', backgroundPosition: '0 0, 0 6px' }} />;
  if (k === 'paper') return <div style={{ ...base, backgroundImage: 'radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.7), rgba(236,222,196,0.55))' }} />;
  if (k === 'sky') return <div style={{ ...base, backgroundImage: 'linear-gradient(180deg, #CFE2FF 0%, #EEF5FF 100%)' }} />;
  if (k === 'mint') return <div style={{ ...base, backgroundImage: 'linear-gradient(180deg, #CDEFE0 0%, #EEFAF4 100%)' }} />;
  return <div style={base} />;
}

export function PaintColorPanel({ color, alpha, onColor, onAlpha, recent }) {
  const { theme } = useTheme();
  const [hsv, setHsv] = useState(() => paintHsv(color));
  const [hexText, setHexText] = useState(color);
  const svRef = useRef(null);
  const hueRef = useRef(null);
  const alphaRef = useRef(null);
  useEffect(() => { setHexText(color); }, [color]);
  const commit = (h, s, v) => { setHsv([h, s, v]); onColor(paintHex(h, s, v)); };
  const dragOn = (ref, fn, pad = 0) => (e) => {
    const el = ref.current;
    if (!el) return;
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const go = (ev) => { const r = el.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (ev.clientX - r.left - pad) / Math.max(1, r.width - pad * 2))), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height))); };
    go(e);
    const mv = (ev) => go(ev);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };
  const [h, s, v] = hsv;
  const dot = (c, key) => (
    <div key={key} role="button" aria-label={`Color ${c}`} onClick={() => { hapticTap(); setHsv(paintHsv(c)); onColor(c); }}
      style={{ width: 34, height: 34, borderRadius: '50%', background: c, cursor: 'pointer', boxShadow: c.toUpperCase() === String(color).toUpperCase() ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.ink}` : `inset 0 0 0 1px ${theme.border}` }} />
  );
  return (
    <div>
      <div ref={svRef} onPointerDown={dragOn(svRef, (x, y) => commit(h, x, 1 - y))} style={{ position: 'relative', height: 170, borderRadius: 14, cursor: 'crosshair', touchAction: 'none', background: `linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, hsl(${Math.round(h)}, 100%, 50%))` }}>
        <div style={{ position: 'absolute', left: `${s * 100}%`, top: `${(1 - v) * 100}%`, width: 22, height: 22, marginLeft: -11, marginTop: -11, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)', background: color, pointerEvents: 'none' }} />
      </div>
      <div ref={hueRef} role="slider" aria-label="Hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(h)} onPointerDown={dragOn(hueRef, (x) => commit(x * 359.9, s || 0.8, v || 0.8), 12)} style={{ position: 'relative', height: 24, borderRadius: 12, marginTop: 16, cursor: 'pointer', touchAction: 'none', background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}>
        <div style={{ position: 'absolute', left: `calc(12px + (100% - 24px) * ${h / 360})`, top: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)', background: `hsl(${Math.round(h)}, 100%, 50%)`, pointerEvents: 'none' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: theme.ink2, whiteSpace: 'nowrap' }}>See through</span>
        <div ref={alphaRef} role="slider" aria-label="See through" aria-valuemin={5} aria-valuemax={100} aria-valuenow={Math.round(alpha * 100)} onPointerDown={dragOn(alphaRef, (x) => onAlpha(Math.max(0.05, Math.round(x * 100) / 100)), 12)} style={{ position: 'relative', flex: 1, height: 24, borderRadius: 12, cursor: 'pointer', touchAction: 'none', backgroundColor: '#ccc', backgroundImage: `linear-gradient(to right, rgba(0,0,0,0), ${color}), linear-gradient(45deg, #999 25%, transparent 25%, transparent 75%, #999 75%), linear-gradient(45deg, #999 25%, transparent 25%, transparent 75%, #999 75%)`, backgroundSize: '100% 100%, 12px 12px, 12px 12px', backgroundPosition: '0 0, 0 0, 6px 6px' }}>
          <div style={{ position: 'absolute', left: `calc(12px + (100% - 24px) * ${alpha})`, top: '50%', width: 24, height: 24, marginLeft: -12, marginTop: -12, borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.5)', background: color, opacity: Math.max(0.3, alpha), pointerEvents: 'none' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: theme.ink, width: 40, textAlign: 'right' }}>{Math.round(alpha * 100)}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: color, boxShadow: `inset 0 0 0 1px ${theme.border}`, flexShrink: 0 }} />
        <input value={hexText} aria-label="Color code" onChange={(e) => {
          const t = e.target.value.toUpperCase();
          setHexText(t);
          if (/^#[0-9A-F]{6}$/.test(t)) { setHsv(paintHsv(t)); onColor(t); }
        }} style={{ ...inputStyle(theme), fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: 1 }} />
      </div>
      {recent && recent.length > 0 && (
        <KitSection title="Recent">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '2px 2px 0' }}>{recent.map((c) => dot(c, `r${c}`))}</div>
        </KitSection>
      )}
      <KitSection title="Colours">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 34px)', gap: 10, justifyContent: 'space-between', padding: '2px 2px 6px' }}>{PAINT_PALETTE.map((c) => dot(c, c))}</div>
      </KitSection>
    </div>
  );
}
let paintCrcTable = null;
function paintCrc32(bytes, start, end) {
  if (!paintCrcTable) {
    paintCrcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      paintCrcTable[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (let i = start; i < end; i++) c = paintCrcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function paintCompactOps(ops) {
  const r1 = (n) => Math.round(n * 10) / 10;
  return ops.map((op) => {
    const o = { ...op };
    const keepP = o.t === 'stroke' && o.pressure;
    if (Array.isArray(o.pts)) o.pts = o.pts.map((p) => (keepP && p.length > 2 ? [r1(p[0]), r1(p[1]), Math.round((p[2] || 0) * 100) / 100] : [r1(p[0]), r1(p[1])]));
    ['x', 'y', 'x0', 'y0', 'x1', 'y1'].forEach((k) => { if (typeof o[k] === 'number') o[k] = r1(o[k]); });
    if (Array.isArray(o.m)) o.m = o.m.map((v, i) => (i < 4 ? Math.round(v * 1e4) / 1e4 : r1(v)));
    return o;
  });
}
async function paintEmbedProject(blob, project) {
  try {
    const json = new TextEncoder().encode(JSON.stringify(project));
    const packed = await paintZip(json, 'in');
    const payload = packed || json;
    const flag = packed ? 1 : 0;
    const src = new Uint8Array(await blob.arrayBuffer());
    if (src[0] === 0x89 && src[1] === 0x50 && src[2] === 0x4E && src[3] === 0x47) {
      if (src.length < 33 || String.fromCharCode(src[12], src[13], src[14], src[15]) !== 'IHDR') return blob;
      const at = 8 + 12 + (((src[8] << 24) | (src[9] << 16) | (src[10] << 8) | src[11]) >>> 0);
      if (at > src.length) return blob;
      const key = new TextEncoder().encode(PAINT_DATA_KEY);
      const dataLen = key.length + 5 + payload.length;
      const chunk = new Uint8Array(12 + dataLen);
      const dv = new DataView(chunk.buffer);
      dv.setUint32(0, dataLen);
      chunk.set([0x69, 0x54, 0x58, 0x74], 4);
      let o = 8;
      chunk.set(key, o); o += key.length;
      chunk[o++] = 0; chunk[o++] = flag; chunk[o++] = 0; chunk[o++] = 0; chunk[o++] = 0;
      chunk.set(payload, o); o += payload.length;
      dv.setUint32(o, paintCrc32(chunk, 4, o));
      const out = new Uint8Array(src.length + chunk.length);
      out.set(src.subarray(0, at), 0);
      out.set(chunk, at);
      out.set(src.subarray(at), at + chunk.length);
      return new Blob([out], { type: 'image/png' });
    }
    if (src[0] === 0xFF && src[1] === 0xD8) {
      const head = new TextEncoder().encode('ZCPAINT');
      const per = 65000;
      const total = Math.ceil(payload.length / per);
      if (!total || total > 250) return blob;
      const segs = [];
      for (let k = 0; k < total; k++) {
        const part = payload.subarray(k * per, Math.min(payload.length, (k + 1) * per));
        const seg = new Uint8Array(15 + part.length);
        const L = 13 + part.length;
        seg[0] = 0xFF; seg[1] = 0xEB; seg[2] = (L >> 8) & 0xFF; seg[3] = L & 0xFF;
        seg.set(head, 4); seg[11] = 0; seg[12] = k; seg[13] = total; seg[14] = flag;
        seg.set(part, 15);
        segs.push(seg);
      }
      let at = 2;
      while (at + 4 <= src.length && src[at] === 0xFF && src[at + 1] >= 0xE0 && src[at + 1] <= 0xEF) at += 2 + ((src[at + 2] << 8) | src[at + 3]);
      if (at > src.length) at = 2;
      const extra = segs.reduce((a, sg) => a + sg.length, 0);
      const out = new Uint8Array(src.length + extra);
      out.set(src.subarray(0, at), 0);
      let o = at;
      segs.forEach((sg) => { out.set(sg, o); o += sg.length; });
      out.set(src.subarray(at), o);
      return new Blob([out], { type: 'image/jpeg' });
    }
  } catch {}
  return blob;
}
let paintMeasureCanvas = null;
function paintMeasure() {
  if (!paintMeasureCanvas) paintMeasureCanvas = document.createElement('canvas');
  return paintMeasureCanvas.getContext('2d');
}
function paintOpBox(op, W, H) {
  if (!op) return null;
  if (op.t === 'stroke' && Array.isArray(op.pts) && op.pts.length) {
    const xfs = paintSymXf(op.sym || 'off', W, H);
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    op.pts.forEach((p) => xfs.forEach((xf) => { const q = xf(p[0], p[1]); x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }));
    const f = op.brush === 'spray' ? 1.4 : op.brush === 'neon' ? 1.5 : op.brush === 'highlighter' ? 0.85 : 0.7;
    const pad = (op.size || 8) * f + 2;
    return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
  }
  if (op.t === 'shape') {
    const pad = (op.size || 6) / 2 + (op.kind === 'arrow' ? Math.max(22, (op.size || 6) * 3.2) : 2);
    if (op.kind === 'poly' && Array.isArray(op.pts) && op.pts.length) {
      const xs = op.pts.map((p) => p[0]);
      const ys = op.pts.map((p) => p[1]);
      return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
    }
    return [Math.min(op.x0, op.x1) - pad, Math.min(op.y0, op.y1) - pad, Math.max(op.x0, op.x1) + pad, Math.max(op.y0, op.y1) + pad];
  }
  if (op.t === 'text') {
    const ctx = paintMeasure();
    ctx.font = paintFontFor(op);
    const lines = String(op.text || '').split('\n');
    const w = Math.max(10, ...lines.map((l) => ctx.measureText(l).width));
    const h = lines.length * op.size * 1.18;
    const pad = op.outline ? Math.max(3, op.size * 0.16) : 4;
    return [op.x - w / 2 - pad, op.y - h / 2 - pad, op.x + w / 2 + pad, op.y + h / 2 + pad];
  }
  if (op.t === 'stamp') {
    const r = (op.size || 60) * 0.62;
    return [op.x - r, op.y - r, op.x + r, op.y + r];
  }
  return null;
}
function paintMatMul(D, M) {
  return [
    D[0] * M[0] + D[2] * M[1], D[1] * M[0] + D[3] * M[1],
    D[0] * M[2] + D[2] * M[3], D[1] * M[2] + D[3] * M[3],
    D[0] * M[4] + D[2] * M[5] + D[4], D[1] * M[4] + D[3] * M[5] + D[5],
  ];
}
function paintMatInv(M) {
  const det = M[0] * M[3] - M[1] * M[2] || 1e-9;
  return [M[3] / det, -M[1] / det, -M[2] / det, M[0] / det, (M[2] * M[5] - M[3] * M[4]) / det, (M[1] * M[4] - M[0] * M[5]) / det];
}
function paintMatApply(M, x, y) {
  return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
}
function paintMatIsId(M) {
  return !M || (Math.abs(M[0] - 1) < 1e-6 && Math.abs(M[1]) < 1e-6 && Math.abs(M[2]) < 1e-6 && Math.abs(M[3] - 1) < 1e-6 && Math.abs(M[4]) < 0.01 && Math.abs(M[5]) < 0.01);
}
function paintMatScale(M) {
  return Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) || 1;
}
function paintMatGesture(cx, cy, dx, dy, s, th) {
  const a = s * Math.cos(th);
  const b = s * Math.sin(th);
  return [a, b, -b, a, cx + dx - (a * cx - b * cy), cy + dy - (b * cx + a * cy)];
}
function paintBoxXf(b, M) {
  if (!b || !M) return b;
  const pts = [paintMatApply(M, b[0], b[1]), paintMatApply(M, b[2], b[1]), paintMatApply(M, b[2], b[3]), paintMatApply(M, b[0], b[3])];
  return [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];
}
function paintHitOp(op, x, y, W, H, M, tol) {
  let ux = x;
  let uy = y;
  let t = tol;
  if (M) {
    const q = paintMatApply(paintMatInv(M), x, y);
    ux = q[0];
    uy = q[1];
    t = tol / paintMatScale(M);
  }
  if (op.t === 'stroke') {
    const xfs = paintSymXf(op.sym || 'off', W, H);
    const lim = (op.size || 8) / 2 + t;
    const pts = op.pts || [];
    for (const xf of xfs) {
      for (let k = 0; k < pts.length; k++) {
        const p = xf(pts[k][0], pts[k][1]);
        if (k === 0) { if (Math.hypot(ux - p[0], uy - p[1]) <= lim) return true; continue; }
        const q = xf(pts[k - 1][0], pts[k - 1][1]);
        const dx = p[0] - q[0];
        const dy = p[1] - q[1];
        const L2 = dx * dx + dy * dy || 1;
        const tt = Math.max(0, Math.min(1, ((ux - q[0]) * dx + (uy - q[1]) * dy) / L2));
        if (Math.hypot(ux - (q[0] + tt * dx), uy - (q[1] + tt * dy)) <= lim) return true;
      }
    }
    return false;
  }
  const b = paintOpBox(op, W, H);
  if (!b) return false;
  return ux >= b[0] - t && ux <= b[2] + t && uy >= b[1] - t && uy <= b[3] + t;
}

function paintBrushPreview(k, color) {
  const c = document.createElement('canvas');
  c.width = 220;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 220, 64);
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([18 + t * 184, 32 + Math.sin(t * Math.PI * 2) * 14, 0.5]); }
  const op = { brush: k, color, size: k === 'spray' ? 9 : k === 'pencil' ? 6 : 8, pts, seed: 11, sym: 'off' };
  const r = makePaintRenderer(op, 220, 64);
  if (k === 'marker' || k === 'highlighter') {
    const t = document.createElement('canvas');
    t.width = 220; t.height = 64;
    r(t.getContext('2d'), null, true);
    ctx.globalAlpha = k === 'highlighter' ? 0.4 : 0.75;
    ctx.drawImage(t, 0, 0);
    ctx.globalAlpha = 1;
  } else r(ctx, null, true);
  return c.toDataURL();
}

const paintBrushThumbs = new Map();
function paintBrushThumb(k, color) {
  const key = `${k}|${color}`;
  if (!paintBrushThumbs.has(key)) {
    let url = '';
    try { url = paintBrushPreview(k, color); } catch {}
    if (paintBrushThumbs.size > 60) paintBrushThumbs.clear();
    paintBrushThumbs.set(key, url);
  }
  return paintBrushThumbs.get(key);
}
function paintInkFor(color) {
  return /^#F[0-9A-F]F[0-9A-F]F[0-9A-F]$/i.test(color) || String(color).toUpperCase() === '#FFFFFF' ? '#111111' : color;
}
function PaintBrushChip({ k, color }) {
  const src = paintBrushThumb(k, paintInkFor(color));
  return <span style={{ display: 'block', width: 40, height: 22, borderRadius: 6, overflow: 'hidden', background: '#FFFFFF', boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.18)' }}>{src && <img src={src} alt="" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />}</span>;
}
function PaintFillGlyph({ on }) {
  const back = on ? { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 } : { fill: 'currentColor', fillOpacity: 0.32, stroke: 'none' };
  const front = on ? { fill: 'currentColor', stroke: 'currentColor', strokeWidth: 1.8 } : { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 };
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="6" y="6" width="14" height="14" rx="3.2" {...back} />
      <rect x="12" y="12" width="14" height="14" rx="3.2" {...front} strokeLinejoin="round" />
    </svg>
  );
}
function PaintFontPicker({ value, onChange }) {
  const { theme } = useTheme();
  return (
    <div role="radiogroup" aria-label="Font" style={{ display: 'flex', height: 40, borderRadius: 11, background: theme.soft, padding: 3, boxSizing: 'border-box', flexShrink: 0 }}>
      {PAINT_FONTS.map(([k, label, spec]) => {
        const on = value === k;
        return (
          <div key={k} role="radio" aria-checked={on} aria-label={`Font ${label}`} onPointerDown={(e) => e.preventDefault()} onClick={() => { if (!on) { hapticTap(); onChange(k); } }}
            style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', background: on ? (theme.dark ? '#2E2D35' : '#FFFFFF') : 'transparent', boxShadow: on ? '0 1px 4px rgba(0, 0, 0, 0.16)' : 'none', color: on ? theme.ink : theme.muted, font: spec.replace('{s}', '17'), lineHeight: 1, transition: 'background 160ms ease, color 160ms ease' }}>Aa</div>
        );
      })}
    </div>
  );
}
export function PaintStudio({ onClose, onSend, recipientName, onAskBot, initial }) {
  const { theme } = useTheme();
  const stageRef = useRef(null);
  const viewRef = useRef(null);
  const L = useRef(null);
  const [docKey, setDocKey] = useState('square');
  const [W, H] = PAINT_SIZES[docKey];
  const [tool, setTool] = useState('brush');
  const [brush, setBrush] = useState('pen');
  const [shape, setShape] = useState('rect');
  const [shapeFill, setShapeFill] = useState(false);
  const [color, setColor] = useState('#111111');
  const [alpha, setAlpha] = useState(1);
  const [size, setSize] = useState(12);
  const [sym, setSym] = useState('off');
  const [steady, setSteady] = useState(0);
  const [magic, setMagic] = useState(false);
  const [bgKey, setBgKey] = useState('white');
  const [bgPhoto, setBgPhoto] = useState(null);
  const [template, setTemplate] = useState(null);
  const [stamp, setStamp] = useState(PAINT_STAMPS[0]);
  const [recent, setRecent] = useState([]);
  const [count, setCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [askState, setAskState] = useState(null);
  const [textEdit, setTextEdit] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [idea, setIdea] = useState('');
  const [zoomPct, setZoomPct] = useState(100);
  const [selInfo, setSelInfo] = useState(null);
  const [loadGen, setLoadGen] = useState(0);
  const photoInputRef = useRef(null);
  const st = useRef({ ops: [], redo: [], cps: [], live: null, liveRender: null, shape: null, pointers: new Map(), pinch: null, view: { s: 1, ox: 0, oy: 0, z: 1, px: 0, py: 0 }, dirty: true, raf: 0, steadyPt: null, magicUndo: null, downAt: 0, textDrag: null, idSeq: 0, xf: new Map(), hide: new Set(), lift: new Map(), liftAt: new Map(), idx: new Map(), sel: null, mv: null, marquee: null, pinchHold: false, keyTimer: 0 });
  const toolRef = useRef({});
  toolRef.current = { tool, brush, shape, shapeFill, color, alpha, size, sym, steady, magic, stamp, textEdit };

  const toastTimer = useRef(null);
  const say = (t) => { setToast(t); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => { setToast(''); st.current.magicUndo = null; }, 2600); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  if (!L.current || L.current.W !== W || L.current.H !== H) {
    const tmp = mk(W, H);
    tmp.getContext('2d', { willReadFrequently: true });
    L.current = { W, H, bg: mk(W, H), paint: mk(W, H), live: mk(W, H), art: mk(W, H), work: mk(W, H), tmp, fillc: mk(W, H), objc: mk(W, H) };
  }

  const drawBg = () => {
    const { bg } = L.current;
    const ctx = bg.getContext('2d');
    const spec = PAINT_BACKGROUNDS.find((b) => b[0] === bgKey) || PAINT_BACKGROUNDS[0];
    ctx.fillStyle = spec[1];
    ctx.fillRect(0, 0, W, H);
    if (bgPhoto) {
      const iw = bgPhoto.naturalWidth || bgPhoto.width;
      const ih = bgPhoto.naturalHeight || bgPhoto.height;
      const s = Math.max(W / iw, H / ih);
      ctx.drawImage(bgPhoto, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
      return;
    }
    if (bgKey === 'grid') {
      ctx.strokeStyle = 'rgba(80,90,120,0.18)';
      ctx.lineWidth = 2;
      for (let x = 45; x < W; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 45; y < H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else if (bgKey === 'dots') {
      ctx.fillStyle = 'rgba(80,90,120,0.28)';
      for (let x = 30; x < W; x += 40) for (let y = 30; y < H; y += 40) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
    } else if (bgKey === 'lines') {
      ctx.strokeStyle = 'rgba(70,110,200,0.25)';
      ctx.lineWidth = 2;
      for (let y = 120; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(230,80,90,0.35)';
      ctx.beginPath(); ctx.moveTo(110, 0); ctx.lineTo(110, H); ctx.stroke();
    }
  };
  const drawArt = () => {
    const { art } = L.current;
    const ctx = art.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const tpl = template && PAINT_TEMPLATES[template];
    if (!tpl) return;
    const s = (Math.min(W, H) / 1000) * 0.92;
    ctx.save();
    ctx.translate((W - 1000 * s) / 2, (H - 1000 * s) / 2);
    ctx.scale(s, s);
    ctx.strokeStyle = '#141416';
    ctx.fillStyle = '#141416';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    tpl.draw(ctx);
    ctx.restore();
  };
  const composite = () => {
    const { tmp, bg, paint, art } = L.current;
    const ctx = tmp.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(paint, 0, 0);
    ctx.drawImage(art, 0, 0);
    return ctx;
  };
  const applyOpRaw = (op, ctx, M) => {
    ctx.save();
    if (op.t === 'clear') { ctx.clearRect(0, 0, W, H); ctx.restore(); return; }
    if (op.t === 'stroke') {
      const { work } = L.current;
      const wctx = work.getContext('2d');
      wctx.setTransform(1, 0, 0, 1, 0, 0);
      wctx.clearRect(0, 0, W, H);
      if (M) wctx.setTransform(M[0], M[1], M[2], M[3], M[4], M[5]);
      makePaintRenderer(op, W, H)(wctx, null, true);
      wctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = op.alpha * (op.brush === 'highlighter' ? 0.4 : op.brush === 'marker' ? 0.8 : 1);
      ctx.globalCompositeOperation = op.eraser ? 'destination-out' : 'source-over';
      ctx.drawImage(work, 0, 0);
    } else if (op.t === 'shape') {
      ctx.globalAlpha = op.alpha;
      if (M) ctx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
      paintDrawShape(ctx, op);
    } else if (op.t === 'text') {
      ctx.globalAlpha = op.alpha;
      if (M) ctx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
      paintDrawText(ctx, op);
    } else if (op.t === 'stamp') {
      if (M) ctx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
      paintDrawStamp(ctx, op);
    } else if (op.t === 'fill') {
      const cctx = composite();
      let img;
      try { img = cctx.getImageData(0, 0, W, H); } catch { ctx.restore(); return; }
      const seed = M ? paintMatApply(M, op.x, op.y) : [op.x, op.y];
      const mask = paintFloodMask(img, W, H, seed[0], seed[1], op.tol || 40);
      if (mask) {
        const fc = L.current.fillc;
        const fctx = fc.getContext('2d');
        const out = fctx.createImageData(W, H);
        const d = out.data;
        const [r, g, b] = paintHexToRgb(op.color);
        const a = Math.round(255 * op.alpha);
        for (let p = 0; p < mask.length; p++) {
          if (!mask[p]) continue;
          const k = p * 4;
          d[k] = r;
          d[k + 1] = g;
          d[k + 2] = b;
          d[k + 3] = a;
        }
        fctx.putImageData(out, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(fc, 0, 0);
      }
    }
    ctx.restore();
  };
  const computeXf = () => {
    const s = st.current;
    const xf = new Map();
    const hide = new Set();
    const lift = new Map();
    const liftAt = new Map();
    const idx = new Map();
    s.ops.forEach((op, k) => {
      if (op.t !== 'xform') { if (op.id != null) idx.set(op.id, k); return; }
      (op.refs || []).forEach((id) => {
        if (op.hide) { hide.add(id); return; }
        if (!Array.isArray(op.m)) return;
        const prev = xf.get(id);
        xf.set(id, prev ? paintMatMul(op.m, prev) : op.m.slice());
        lift.set(id, k);
      });
    });
    lift.forEach((k, id) => {
      const j = idx.get(id);
      if (j == null || j > k) return;
      if (!liftAt.has(k)) liftAt.set(k, []);
      liftAt.get(k).push(j);
    });
    liftAt.forEach((arr) => arr.sort((a, b) => a - b));
    s.xf = xf;
    s.hide = hide;
    s.lift = lift;
    s.liftAt = liftAt;
    s.idx = idx;
  };
  const matFor = (op) => {
    const d = op.id != null ? st.current.xf.get(op.id) : null;
    if (op.m && d) return paintMatMul(d, op.m);
    return d || op.m || null;
  };
  const hiddenOp = (op, extra) => st.current.hide.has(op.id) || !!(extra && extra.has(op.id));
  const drawStep = (k, ctx, extra) => {
    const s = st.current;
    const op = s.ops[k];
    if (op.t === 'xform') {
      const list = s.liftAt.get(k);
      if (list) list.forEach((j) => { const o = s.ops[j]; if (!hiddenOp(o, extra)) applyOpRaw(o, ctx, matFor(o)); });
      return;
    }
    if (s.lift.has(op.id) || hiddenOp(op, extra)) return;
    applyOpRaw(op, ctx, matFor(op));
  };
  const drawOrder = () => {
    const s = st.current;
    const out = [];
    s.ops.forEach((op, k) => {
      if (op.t === 'xform') { const list = s.liftAt.get(k); if (list) list.forEach((j) => out.push(j)); return; }
      if (s.lift.has(op.id)) return;
      out.push(k);
    });
    return out;
  };
  const rebuild = (extraIn) => {
    const s = st.current;
    const extra = s.editHide != null ? new Set([...(extraIn || []), s.editHide]) : extraIn;
    computeXf();
    const { paint } = L.current;
    const ctx = paint.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const n = s.ops.length;
    let lastX = -1;
    let minHide = n;
    for (let k = 0; k < n; k++) {
      const op = s.ops[k];
      if (op.t === 'xform') lastX = k;
      if (extra && minHide === n && extra.has(op.id)) minHide = k;
    }
    const cp = s.cps.filter((c) => c.i <= n && c.i > lastX && c.i <= minHide).sort((a, b) => b.i - a.i)[0];
    let from = 0;
    if (cp) { ctx.drawImage(cp.c, 0, 0); from = cp.i; }
    for (let k = from; k < n; k++) drawStep(k, ctx, extra);
    s.dirty = true;
    schedule();
  };
  const snapshot = () => {
    const s = st.current;
    const c = mk(W, H);
    c.getContext('2d').drawImage(L.current.paint, 0, 0);
    s.cps = s.cps.filter((x) => x.i !== s.ops.length);
    s.cps.push({ i: s.ops.length, c });
    if (s.cps.length > 4) s.cps.shift();
  };
  const pushOp = (op) => {
    const s = st.current;
    if (op.id == null) { s.idSeq += 1; op.id = s.idSeq; }
    s.ops.push(op);
    s.redo = [];
    s.cps = s.cps.filter((c) => c.i <= s.ops.length - 1);
    if (op.t === 'xform') {
      rebuild();
      snapshot();
    } else {
      s.idx.set(op.id, s.ops.length - 1);
      applyOpRaw(op, L.current.paint.getContext('2d'), matFor(op));
      if (s.ops.length % 12 === 0) snapshot();
    }
    setCount(s.ops.length);
    setRedoCount(0);
    s.dirty = true;
    schedule();
    return op;
  };
  const clearSel = () => {
    const s = st.current;
    clearTimeout(s.keyTimer);
    const lifted = s.mv && s.mv.lifted;
    s.sel = null;
    s.mv = null;
    s.marquee = null;
    if (lifted) rebuild();
    setSelInfo(null);
    s.dirty = true;
    schedule();
  };
  const undo = () => {
    const s = st.current;
    if (!s.ops.length) return;
    hapticTap();
    if (textEdit && textEdit.replaces != null) { s.editHide = null; setTextEdit(null); }
    const b = s.ops[s.ops.length - 1].batch;
    do { s.redo.push(s.ops.pop()); } while (b && s.ops.length && s.ops[s.ops.length - 1].batch === b);
    s.magicUndo = null;
    s.sel = null;
    s.mv = null;
    setSelInfo(null);
    rebuild();
    setCount(s.ops.length);
    setRedoCount(s.redo.length);
  };
  const redo = () => {
    const s = st.current;
    if (!s.redo.length) return;
    hapticTap();
    if (textEdit && textEdit.replaces != null) { s.editHide = null; setTextEdit(null); }
    const b = s.redo[s.redo.length - 1].batch;
    const back = [];
    do { back.push(s.redo.pop()); } while (b && s.redo.length && s.redo[s.redo.length - 1].batch === b);
    s.sel = null;
    s.mv = null;
    setSelInfo(null);
    back.forEach((op) => s.ops.push(op));
    if (back.some((op) => op.t === 'xform')) rebuild();
    else {
      computeXf();
      back.forEach((op) => applyOpRaw(op, L.current.paint.getContext('2d'), matFor(op)));
    }
    setCount(s.ops.length);
    setRedoCount(s.redo.length);
    s.dirty = true;
    schedule();
  };

  const boxOf = (op) => {
    const b = paintOpBox(op, W, H);
    const M = matFor(op);
    return M ? paintBoxXf(b, M) : b;
  };
  const visibleObjects = () => {
    const s = st.current;
    const order = drawOrder();
    const out = [];
    for (let q = order.length - 1; q >= 0; q--) {
      const op = s.ops[order[q]];
      if (op.t === 'clear') break;
      if (op.t === 'fill' || (op.t === 'stroke' && op.eraser) || s.hide.has(op.id)) continue;
      out.push(order[q]);
    }
    return out;
  };
  const hitAt = (x, y, pointerType, only) => {
    const s = st.current;
    const tol = (pointerType === 'touch' ? 16 : 8) / s.view.s;
    const list = visibleObjects();
    for (let q = 0; q < list.length; q++) {
      const op = s.ops[list[q]];
      if (only && op.t !== only) continue;
      if (paintHitOp(op, x, y, W, H, matFor(op), tol)) return list[q];
    }
    return -1;
  };
  const selBox = () => {
    const s = st.current;
    if (!s.sel) return null;
    let b = null;
    s.sel.ids.forEach((id) => {
      const k = s.idx.get(id);
      if (k == null || s.hide.has(id)) return;
      const bb = boxOf(s.ops[k]);
      if (!bb) return;
      b = b ? [Math.min(b[0], bb[0]), Math.min(b[1], bb[1]), Math.max(b[2], bb[2]), Math.max(b[3], bb[3])] : bb.slice();
    });
    return b;
  };
  const groupFor = (ids) => {
    const s = st.current;
    const set = new Set(ids);
    const order = drawOrder();
    const pos = new Map();
    order.forEach((k, q) => pos.set(k, q));
    const boxes = [];
    let firstPos = Infinity;
    ids.forEach((id) => {
      const k = s.idx.get(id);
      if (k == null) return;
      const b = boxOf(s.ops[k]);
      if (b) boxes.push(b);
      firstPos = Math.min(firstPos, pos.has(k) ? pos.get(k) : Infinity);
    });
    let lastClear = -1;
    order.forEach((k, q) => { if (s.ops[k].t === 'clear') lastClear = q; });
    const owners = [];
    order.forEach((k, q) => {
      const op = s.ops[k];
      if (q <= lastClear || s.hide.has(op.id) || op.t === 'fill' || op.t === 'clear' || (op.t === 'stroke' && op.eraser)) return;
      const b = boxOf(op);
      if (b) owners.push({ q, id: op.id, b, area: Math.max(1, (b[2] - b[0]) * (b[3] - b[1])) });
    });
    order.forEach((k, q) => {
      const op = s.ops[k];
      if (q <= firstPos || q <= lastClear || set.has(op.id) || s.hide.has(op.id)) return;
      if (op.t === 'fill') {
        const M = matFor(op);
        const p = M ? paintMatApply(M, op.x, op.y) : [op.x, op.y];
        let best = null;
        owners.forEach((o) => {
          if (o.q >= q || p[0] < o.b[0] || p[0] > o.b[2] || p[1] < o.b[1] || p[1] > o.b[3]) return;
          if (!best || o.area < best.area || (o.area === best.area && o.q > best.q)) best = o;
        });
        if (best && set.has(best.id)) set.add(op.id);
      } else if (op.t === 'stroke' && op.eraser) {
        const b = boxOf(op);
        if (!b) return;
        const area = Math.max(1, (b[2] - b[0]) * (b[3] - b[1]));
        const inside = boxes.some((g) => {
          const ix = Math.max(0, Math.min(b[2], g[2]) - Math.max(b[0], g[0]));
          const iy = Math.max(0, Math.min(b[3], g[3]) - Math.max(b[1], g[1]));
          return (ix * iy) / area >= 0.7;
        });
        if (inside) set.add(op.id);
      }
    });
    return [...set];
  };
  const setSelection = (ids) => {
    const s = st.current;
    if (!ids || !ids.length) { clearSel(); return; }
    s.sel = { ids: ids.slice(), group: groupFor(ids), box: null };
    s.sel.box = selBox();
    const one = ids.length === 1 ? s.ops[s.idx.get(ids[0])] : null;
    setSelInfo({ n: ids.length, text: !!(one && one.t === 'text') });
    s.dirty = true;
    schedule();
  };
  const liftSel = () => {
    const s = st.current;
    if (!s.sel) return;
    const hideSet = new Set(s.sel.group);
    rebuild(hideSet);
    const { objc } = L.current;
    const octx = objc.getContext('2d');
    octx.setTransform(1, 0, 0, 1, 0, 0);
    octx.globalAlpha = 1;
    octx.globalCompositeOperation = 'source-over';
    octx.clearRect(0, 0, W, H);
    const keep = L.current.paint;
    L.current.paint = objc;
    try {
      drawOrder().forEach((k) => { const o = s.ops[k]; if (hideSet.has(o.id) && !s.hide.has(o.id)) applyOpRaw(o, octx, matFor(o)); });
    } finally { L.current.paint = keep; }
  };
  const finishMove = () => {
    const s = st.current;
    const mv = s.mv;
    s.mv = null;
    clearTimeout(s.keyTimer);
    if (!mv || !mv.lifted) return;
    if (s.sel && !paintMatIsId(mv.D)) { pushOp({ t: 'xform', refs: s.sel.group.slice(), m: mv.D }); hapticTap(); }
    else rebuild();
    if (s.sel) s.sel.box = selBox();
    s.dirty = true;
    schedule();
  };
  const deleteSel = () => {
    const s = st.current;
    if (!s.sel) return;
    if (s.mv) finishMove();
    if (!s.sel) return;
    hapticTap();
    pushOp({ t: 'xform', refs: s.sel.group.slice(), hide: true });
    clearSel();
    say('Deleted');
  };
  const frontSel = () => {
    const s = st.current;
    if (!s.sel) return;
    if (s.mv) finishMove();
    if (!s.sel) return;
    hapticTap();
    pushOp({ t: 'xform', refs: s.sel.group.slice(), m: [1, 0, 0, 1, 0, 0] });
    s.sel.box = selBox();
    say('Moved to the front');
  };
  const copySel = () => {
    const s = st.current;
    if (!s.sel) return;
    if (s.mv) finishMove();
    if (!s.sel) return;
    hapticTap();
    const group = new Set(s.sel.group);
    const batch = `c${Date.now()}`;
    const off = [1, 0, 0, 1, 36, 36];
    const map = new Map();
    drawOrder().forEach((k) => {
      const o = s.ops[k];
      if (!group.has(o.id) || s.hide.has(o.id)) return;
      const c = JSON.parse(JSON.stringify(o));
      delete c.id;
      c.m = paintMatMul(off, matFor(o) || [1, 0, 0, 1, 0, 0]);
      c.batch = batch;
      pushOp(c);
      map.set(o.id, c.id);
    });
    setSelection(s.sel.ids.map((id) => map.get(id)).filter((x) => x != null));
    say('Copied');
  };
  const selectAll = () => {
    const s = st.current;
    const ids = visibleObjects().map((k) => s.ops[k].id);
    if (!ids.length) { say('Draw something first'); return; }
    hapticTap();
    setSelection(ids);
  };
  const nudge = (dx, dy) => {
    const s = st.current;
    if (!s.sel) return;
    if (s.mv && s.mv.kind !== 'key') return;
    if (!s.mv) { liftSel(); s.mv = { kind: 'key', D: [1, 0, 0, 1, 0, 0], lifted: true }; }
    s.mv.D = [1, 0, 0, 1, s.mv.D[4] + dx, s.mv.D[5] + dy];
    clearTimeout(s.keyTimer);
    s.keyTimer = setTimeout(() => finishMove(), 650);
    s.dirty = true;
    schedule();
  };
  const editText = (op, from) => {
    const M = matFor(op);
    clearSel();
    st.current.editHide = op.id;
    rebuild();
    setTextEdit({ x: op.x, y: op.y, text: op.text, font: op.font || 'sans', size: op.size, color: op.color, alpha: op.alpha == null ? 1 : op.alpha, outline: op.outline || null, m: M, replaces: op.id, from });
    setTool('text');
  };
  const rawPt = (te, x, y) => (te && te.m ? paintMatApply(paintMatInv(te.m), x, y) : [x, y]);
  const hasVisible = () => {
    const s = st.current;
    let start = 0;
    s.ops.forEach((op, k) => { if (op.t === 'clear') start = k + 1; });
    return s.ops.slice(start).some((op) => op.t !== 'xform' && op.t !== 'clear' && !(op.t === 'stroke' && op.eraser) && !s.hide.has(op.id));
  };

  const fit = () => {
    const stage = stageRef.current;
    const cv = viewRef.current;
    if (!stage || !cv) return;
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(sw * dpr);
    cv.height = Math.round(sh * dpr);
    cv.style.width = `${sw}px`;
    cv.style.height = `${sh}px`;
    const v = st.current.view;
    const base = Math.min((sw - 24) / W, (sh - 24) / H);
    v.base = base;
    v.dpr = dpr;
    v.sw = sw;
    v.sh = sh;
    applyZoom(v.z || 1, v.px || 0, v.py || 0);
  };
  const applyZoom = (z, px, py) => {
    const v = st.current.view;
    v.z = Math.max(1, Math.min(6, z));
    v.s = v.base * v.z;
    const maxX = Math.max(0, (W * v.s - v.sw) / 2 + 40);
    const maxY = Math.max(0, (H * v.s - v.sh) / 2 + 40);
    v.px = v.z <= 1.001 ? 0 : Math.max(-maxX, Math.min(maxX, px));
    v.py = v.z <= 1.001 ? 0 : Math.max(-maxY, Math.min(maxY, py));
    v.ox = (v.sw - W * v.s) / 2 + v.px;
    v.oy = (v.sh - H * v.s) / 2 + v.py;
    setZoomPct(Math.round(v.z * 100));
    st.current.dirty = true;
    schedule();
  };
  const schedule = () => {
    const s = st.current;
    if (s.raf) return;
    s.raf = requestAnimationFrame(frame);
  };
  const frame = () => {
    const s = st.current;
    s.raf = 0;
    const cv = viewRef.current;
    if (!cv || !L.current) return;
    const ctx = cv.getContext('2d');
    const v = s.view;
    const { bg, paint, live, art, work } = L.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(v.dpr * v.s, 0, 0, v.dpr * v.s, v.dpr * v.ox, v.dpr * v.oy);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.28)';
    ctx.shadowBlur = 18 / v.s;
    ctx.shadowOffsetY = 4 / v.s;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    ctx.imageSmoothingEnabled = v.s < 1.5;
    ctx.drawImage(bg, 0, 0);
    if (s.live && s.live.eraser) {
      const w = work.getContext('2d');
      w.globalCompositeOperation = 'source-over';
      w.globalAlpha = 1;
      w.clearRect(0, 0, W, H);
      w.drawImage(paint, 0, 0);
      w.globalCompositeOperation = 'destination-out';
      w.globalAlpha = s.live.alpha;
      w.drawImage(live, 0, 0);
      w.globalCompositeOperation = 'source-over';
      w.globalAlpha = 1;
      ctx.drawImage(work, 0, 0);
    } else {
      ctx.drawImage(paint, 0, 0);
      if (s.live) {
        ctx.save();
        ctx.globalAlpha = s.live.alpha * (s.live.brush === 'highlighter' ? 0.4 : s.live.brush === 'marker' ? 0.8 : 1);
        ctx.drawImage(live, 0, 0);
        ctx.restore();
      }
    }
    const mv = s.mv;
    if (mv && mv.lifted) {
      ctx.save();
      ctx.transform(mv.D[0], mv.D[1], mv.D[2], mv.D[3], mv.D[4], mv.D[5]);
      ctx.drawImage(L.current.objc, 0, 0);
      ctx.restore();
    }
    ctx.drawImage(art, 0, 0);
    if (s.shape) { ctx.save(); ctx.globalAlpha = s.shape.alpha; paintDrawShape(ctx, s.shape); ctx.restore(); }
    const te = toolRef.current.textEdit;
    if (te && te.text) {
      const k = te.m ? paintMatScale(te.m) : 1;
      ctx.save();
      if (te.m) ctx.transform(te.m[0], te.m[1], te.m[2], te.m[3], te.m[4], te.m[5]);
      ctx.globalAlpha = te.alpha;
      paintDrawText(ctx, te);
      ctx.restore();
      ctx.save();
      if (te.m) ctx.transform(te.m[0], te.m[1], te.m[2], te.m[3], te.m[4], te.m[5]);
      ctx.font = paintFontFor(te);
      const lines = te.text.split('\n');
      const wmax = Math.max(...lines.map((l) => ctx.measureText(l).width));
      const hh = lines.length * te.size * 1.18;
      ctx.setLineDash([10 / (v.s * k), 8 / (v.s * k)]);
      ctx.lineWidth = 2 / (v.s * k);
      ctx.strokeStyle = '#8C6CFF';
      ctx.strokeRect(te.x - wmax / 2 - 14, te.y - hh / 2 - 10, wmax + 28, hh + 20);
      ctx.restore();
    }
    if (s.sel && s.sel.box && toolRef.current.tool === 'move') {
      const cs = selCorners(s.sel.box, mv && mv.lifted ? mv.D : null);
      const hd = selHandles(cs);
      const poly = () => { ctx.beginPath(); cs.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
      ctx.save();
      ctx.lineWidth = 3.4 / v.s;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      poly();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(hd.top[0], hd.top[1]);
      ctx.lineTo(hd.rotate[0], hd.rotate[1]);
      ctx.stroke();
      ctx.setLineDash([9 / v.s, 6 / v.s]);
      ctx.lineWidth = 1.8 / v.s;
      ctx.strokeStyle = '#8C6CFF';
      poly();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(hd.top[0], hd.top[1]);
      ctx.lineTo(hd.rotate[0], hd.rotate[1]);
      ctx.stroke();
      [hd.scale, hd.rotate].forEach((p) => {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 10 / v.s, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2.6 / v.s;
        ctx.strokeStyle = '#8C6CFF';
        ctx.stroke();
      });
      ctx.restore();
    }
    if (s.marquee) {
      const q = s.marquee;
      const x0 = Math.min(q.x0, q.x1);
      const y0 = Math.min(q.y0, q.y1);
      ctx.save();
      ctx.fillStyle = 'rgba(140,108,255,0.10)';
      ctx.fillRect(x0, y0, Math.abs(q.x1 - q.x0), Math.abs(q.y1 - q.y0));
      ctx.setLineDash([9 / v.s, 6 / v.s]);
      ctx.lineWidth = 1.8 / v.s;
      ctx.strokeStyle = '#8C6CFF';
      ctx.strokeRect(x0, y0, Math.abs(q.x1 - q.x0), Math.abs(q.y1 - q.y0));
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  const selCorners = (b, D) => {
    const pad = 8 / st.current.view.s;
    const c = [[b[0] - pad, b[1] - pad], [b[2] + pad, b[1] - pad], [b[2] + pad, b[3] + pad], [b[0] - pad, b[3] + pad]];
    return D ? c.map((p) => paintMatApply(D, p[0], p[1])) : c;
  };
  const selHandles = (cs) => {
    const off = 34 / st.current.view.s;
    const cx = (cs[0][0] + cs[2][0]) / 2;
    const cy = (cs[0][1] + cs[2][1]) / 2;
    const tx = (cs[0][0] + cs[1][0]) / 2;
    const ty = (cs[0][1] + cs[1][1]) / 2;
    const len = Math.hypot(tx - cx, ty - cy) || 1;
    return { scale: cs[2], rotate: [tx + ((tx - cx) / len) * off, ty + ((ty - cy) / len) * off], top: [tx, ty], c: [cx, cy] };
  };

  const refreshFills = () => {
    const s = st.current;
    if (!s.ops.some((o) => o.t === 'fill')) return;
    s.cps = [];
    rebuild();
  };
  useEffect(() => { drawBg(); refreshFills(); st.current.dirty = true; schedule(); }, [bgKey, bgPhoto, W, H]);
  useEffect(() => { drawArt(); refreshFills(); st.current.dirty = true; schedule(); }, [template, W, H]);
  useEffect(() => { schedule(); }, [textEdit]);
  useEffect(() => {
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => fit()) : null;
    if (ro && stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', fit);
    return () => { if (ro) ro.disconnect(); window.removeEventListener('resize', fit); cancelAnimationFrame(st.current.raf); };
  }, [W, H]);
  useEffect(() => () => clearTimeout(st.current.keyTimer), []);

  const toDocXY = (cx, cy) => {
    const r = viewRef.current.getBoundingClientRect();
    const v = st.current.view;
    return [(cx - r.left - v.ox) / v.s, (cy - r.top - v.oy) / v.s];
  };
  const toDoc = (e) => toDocXY(e.clientX, e.clientY);
  const toScreen = (p) => {
    const r = viewRef.current.getBoundingClientRect();
    const v = st.current.view;
    return [r.left + v.ox + p[0] * v.s, r.top + v.oy + p[1] * v.s];
  };
  const rememberColor = (c) => setRecent((prev) => [c, ...prev.filter((x) => x !== c)].slice(0, 8));
  const sampleAt = (x, y) => {
    const ctx = composite();
    try {
      const d = ctx.getImageData(Math.max(0, Math.min(W - 1, Math.floor(x))), Math.max(0, Math.min(H - 1, Math.floor(y))), 1, 1).data;
      return `#${[d[0], d[1], d[2]].map((u) => u.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    } catch { return null; }
  };
  const beginStroke = (x, y, e) => {
    const t = toolRef.current;
    const eraser = t.tool === 'eraser';
    const op = { t: 'stroke', brush: eraser ? 'pen' : t.brush, eraser, color: t.color, alpha: eraser ? 1 : t.alpha, size: eraser ? Math.max(6, t.size * 1.6) : t.size, sym: t.sym, seed: Math.floor(Math.random() * 1e9), pressure: e.pointerType === 'pen', pts: [[x, y, e.pressure || 0.5]] };
    const s = st.current;
    s.live = op;
    s.steadyPt = [x, y];
    L.current.live.getContext('2d').clearRect(0, 0, W, H);
    s.liveRender = makePaintRenderer(op, W, H);
    s.liveRender(L.current.live.getContext('2d'));
    s.dirty = true;
    schedule();
  };
  const extendStroke = (x, y, p) => {
    const s = st.current;
    const op = s.live;
    if (!op) return;
    let nx = x;
    let ny = y;
    const R = toolRef.current.steady * 5;
    if (R > 0 && s.steadyPt) {
      const dx = x - s.steadyPt[0];
      const dy = y - s.steadyPt[1];
      const d = Math.hypot(dx, dy);
      if (d <= R) return;
      nx = s.steadyPt[0] + (dx / d) * (d - R);
      ny = s.steadyPt[1] + (dy / d) * (d - R);
      s.steadyPt = [nx, ny];
    }
    const last = op.pts[op.pts.length - 1];
    if (Math.hypot(nx - last[0], ny - last[1]) < 1.2) return;
    op.pts.push([nx, ny, p || 0.5]);
    s.liveRender(L.current.live.getContext('2d'));
    s.dirty = true;
    schedule();
  };
  const endStroke = (discard) => {
    const s = st.current;
    const op = s.live;
    if (!op) return;
    s.live = null;
    const lctx = L.current.live.getContext('2d');
    if (!discard && op.pts.length) {
      const t = toolRef.current;
      const shapeGuess = t.magic && !op.eraser && op.pts.length > 5 && (op.brush === 'pen' || op.brush === 'marker' || op.brush === 'pencil' || op.brush === 'crayon' || op.brush === 'neon') ? paintRecognize(op.pts) : null;
      if (shapeGuess) {
        pushOp({ t: 'shape', ...shapeGuess, color: op.color, size: Math.max(2, op.size), alpha: op.alpha, fill: false });
        s.magicUndo = op;
        say(shapeGuess.kind === 'ellipse' ? 'Made it a circle' : shapeGuess.kind === 'rect' ? 'Made it a box' : shapeGuess.kind === 'line' ? 'Made it a straight line' : 'Made it neat');
      } else {
        pushOp(op);
      }
    }
    lctx.clearRect(0, 0, W, H);
    s.dirty = true;
    schedule();
  };
  const keepMyLine = () => {
    const s = st.current;
    if (!s.magicUndo) return;
    const op = s.magicUndo;
    s.magicUndo = null;
    s.ops.pop();
    rebuild();
    pushOp(op);
    setToast('');
  };

  const onDown = (e) => {
    const s = st.current;
    if (e.pointerType === 'mouse' && (e.button === 1 || (e.button === 0 && s.spaceHeld))) {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      s.panDrag = { id: e.pointerId, x: e.clientX, y: e.clientY, px: s.view.px, py: s.view.py };
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType === 'touch' && [...s.pointers.values()].some((p) => p.pen)) return;
    if (e.pointerType === 'pen') {
      let dropped = false;
      s.pointers.forEach((pt, id) => { if (!pt.pen) { s.pointers.delete(id); dropped = true; } });
      if (dropped) {
        if (s.live) endStroke(true);
        s.pinch = null;
        s.shape = null;
        s.marquee = null;
        if (s.mv && s.mv.kind === 'pinch') finishMove();
        s.pinchHold = false;
      }
    }
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pen: e.pointerType === 'pen' });
    if (s.pinchHold) return;
    if (s.mv && s.mv.kind === 'key') finishMove();
    if (s.pointers.size === 2) {
      if (s.live) endStroke(s.live.pts.length < 6 || Date.now() - s.downAt < 180);
      if (s.shape) s.shape = null;
      if (s.marquee) { s.marquee = null; s.dirty = true; schedule(); }
      if (toolRef.current.tool === 'move' && s.sel) {
        if (!s.mv || !s.mv.lifted) liftSel();
        const base = s.mv && s.mv.lifted ? s.mv.D : [1, 0, 0, 1, 0, 0];
        s.mv = { kind: 'pinch', base, D: base, lifted: true, p0: [...s.pointers.values()].slice(0, 2).map((p) => toDocXY(p.x, p.y)) };
        s.tap = null;
        return;
      }
      const [a, b] = [...s.pointers.values()];
      const v = s.view;
      s.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: v.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, px0: v.px, py0: v.py };
      return;
    }
    if (s.pointers.size > 2 || s.pinch) return;
    s.downAt = Date.now();
    const [x, y] = toDoc(e);
    const t = toolRef.current;
    s.tap = { x, y, cx: e.clientX, cy: e.clientY, moved: false };
    if (t.textEdit) {
      const te = t.textEdit;
      const [rx, ry] = rawPt(te, x, y);
      if (Math.abs(rx - te.x) < 400 && Math.abs(ry - te.y) < Math.max(80, te.size * 2)) s.textDrag = { dx: te.x - rx, dy: te.y - ry };
      return;
    }
    if (t.tool === 'move') {
      const I = [1, 0, 0, 1, 0, 0];
      const near = (p, rad) => { const q = toScreen(p); return Math.hypot(e.clientX - q[0], e.clientY - q[1]) <= rad; };
      if (s.sel && s.sel.box) {
        const hd = selHandles(selCorners(s.sel.box, null));
        if (near(hd.rotate, 26)) { s.mv = { kind: 'rotate', c: hd.c, a0: Math.atan2(y - hd.c[1], x - hd.c[0]), D: I, lifted: false }; return; }
        if (near(hd.scale, 26)) { s.mv = { kind: 'scale', c: hd.c, d0: Math.max(1, Math.hypot(x - hd.c[0], y - hd.c[1])), D: I, lifted: false }; return; }
        const b = s.sel.box;
        const pad = 10 / s.view.s;
        if (x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad) { s.mv = { kind: 'drag', x0: x, y0: y, D: I, lifted: false, wasSel: true }; return; }
      }
      const k = hitAt(x, y, e.pointerType);
      if (k >= 0) { setSelection([s.ops[k].id]); s.mv = { kind: 'drag', x0: x, y0: y, D: I, lifted: false, wasSel: false }; return; }
      if (s.sel) clearSel();
      s.marquee = { x0: x, y0: y, x1: x, y1: y };
      return;
    }
    if (t.tool === 'brush' || t.tool === 'eraser') beginStroke(x, y, e);
    else if (t.tool === 'shapes') s.shape = { t: 'shape', kind: t.shape, x0: x, y0: y, x1: x, y1: y, color: t.color, size: t.size, alpha: t.alpha, fill: t.shapeFill };
  };
  const onMove = (e) => {
    const s = st.current;
    if (s.panDrag && s.panDrag.id === e.pointerId) {
      applyZoom(s.view.z, s.panDrag.px + (e.clientX - s.panDrag.x), s.panDrag.py + (e.clientY - s.panDrag.y));
      return;
    }
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pen: e.pointerType === 'pen' });
    if (s.pinchHold) return;
    if (s.mv && s.mv.kind === 'pinch') {
      if (s.pointers.size < 2) return;
      const [a, b] = [...s.pointers.values()].slice(0, 2).map((p) => toDocXY(p.x, p.y));
      const [a0, b0] = s.mv.p0;
      const m0 = [(a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2];
      const m1 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const sc = Math.max(0.05, Math.min(20, (Math.hypot(a[0] - b[0], a[1] - b[1]) || 1) / (Math.hypot(a0[0] - b0[0], a0[1] - b0[1]) || 1)));
      const th = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.atan2(b0[1] - a0[1], b0[0] - a0[0]);
      s.mv.D = paintMatMul(paintMatGesture(m0[0], m0[1], m1[0] - m0[0], m1[1] - m0[1], sc, th), s.mv.base);
      s.dirty = true;
      schedule();
      return;
    }
    if (s.pinch && s.pointers.size >= 2) {
      const [a, b] = [...s.pointers.values()];
      const p = s.pinch;
      const z = p.z0 * ((Math.hypot(a.x - b.x, a.y - b.y) || 1) / p.d0);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      applyZoom(z, p.px0 + (mx - p.mx), p.py0 + (my - p.my));
      return;
    }
    if (s.tap && Math.hypot(e.clientX - s.tap.cx, e.clientY - s.tap.cy) > 6) s.tap.moved = true;
    if (s.textDrag && toolRef.current.textEdit) {
      const [x, y] = toDoc(e);
      setTextEdit((te) => { if (!te) return te; const [rx, ry] = rawPt(te, x, y); return { ...te, x: rx + s.textDrag.dx, y: ry + s.textDrag.dy }; });
      return;
    }
    if (s.mv && s.mv.kind !== 'key') {
      const mv = s.mv;
      const [x, y] = toDoc(e);
      if (!mv.lifted) {
        if (!s.tap || Math.hypot(e.clientX - s.tap.cx, e.clientY - s.tap.cy) < 4) return;
        liftSel();
        mv.lifted = true;
      }
      if (mv.kind === 'drag') mv.D = [1, 0, 0, 1, x - mv.x0, y - mv.y0];
      else if (mv.kind === 'scale') mv.D = paintMatGesture(mv.c[0], mv.c[1], 0, 0, Math.max(0.05, Math.min(20, Math.hypot(x - mv.c[0], y - mv.c[1]) / mv.d0)), 0);
      else if (mv.kind === 'rotate') {
        let th = Math.atan2(y - mv.c[1], x - mv.c[0]) - mv.a0;
        th = Math.atan2(Math.sin(th), Math.cos(th));
        const snap = Math.round(th / (Math.PI / 4)) * (Math.PI / 4);
        if (Math.abs(th - snap) < 0.055) th = snap;
        mv.D = paintMatGesture(mv.c[0], mv.c[1], 0, 0, 1, th);
      }
      s.dirty = true;
      schedule();
      return;
    }
    if (s.marquee) {
      const [x, y] = toDoc(e);
      s.marquee.x1 = x;
      s.marquee.y1 = y;
      s.dirty = true;
      schedule();
      return;
    }
    if (s.live) {
      const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
      (evs && evs.length ? evs : [e]).forEach((ev) => { const [x, y] = toDoc(ev); extendStroke(x, y, ev.pressure); });
      return;
    }
    if (s.shape) {
      const [x, y] = toDoc(e);
      s.shape.x1 = x;
      s.shape.y1 = y;
      s.dirty = true;
      schedule();
    }
  };
  const onUp = (e) => {
    const s = st.current;
    if (s.panDrag && s.panDrag.id === e.pointerId) { s.panDrag = null; return; }
    if (!s.pointers.has(e.pointerId)) return;
    s.pointers.delete(e.pointerId);
    if (s.mv && s.mv.kind === 'pinch') { finishMove(); s.pinchHold = s.pointers.size > 0; return; }
    if (s.pinchHold) { if (s.pointers.size === 0) s.pinchHold = false; return; }
    if (s.pinch) { if (s.pointers.size === 0) s.pinch = null; return; }
    if (s.pointers.size > 0) return;
    const t = toolRef.current;
    const tap = s.tap;
    s.tap = null;
    if (s.textDrag) { s.textDrag = null; return; }
    if (s.mv && s.mv.kind !== 'key') {
      const mv = s.mv;
      if (mv.lifted) { finishMove(); return; }
      s.mv = null;
      if (mv.wasSel && tap && !tap.moved && s.sel && s.sel.ids.length === 1) {
        const one = s.ops[s.idx.get(s.sel.ids[0])];
        if (one && one.t === 'text') editText(one, 'move');
      }
      return;
    }
    if (s.marquee) {
      const q = s.marquee;
      s.marquee = null;
      const r = [Math.min(q.x0, q.x1), Math.min(q.y0, q.y1), Math.max(q.x0, q.x1), Math.max(q.y0, q.y1)];
      if (r[2] - r[0] > 6 / s.view.s && r[3] - r[1] > 6 / s.view.s) {
        const ids = visibleObjects().map((k) => s.ops[k]).filter((op) => {
          const b = boxOf(op);
          if (!b) return false;
          const ix = Math.max(0, Math.min(b[2], r[2]) - Math.max(b[0], r[0]));
          const iy = Math.max(0, Math.min(b[3], r[3]) - Math.max(b[1], r[1]));
          return (ix * iy) / Math.max(1, (b[2] - b[0]) * (b[3] - b[1])) >= 0.6;
        }).map((op) => op.id);
        if (ids.length) { hapticTap(); setSelection(ids); } else say('Nothing there to pick');
      }
      s.dirty = true;
      schedule();
      return;
    }
    if (s.live) { endStroke(false); return; }
    if (s.shape) {
      const sh = s.shape;
      s.shape = null;
      if (Math.hypot(sh.x1 - sh.x0, sh.y1 - sh.y0) > 6) pushOp(sh);
      else { s.dirty = true; schedule(); }
      return;
    }
    if (!tap || tap.moved) return;
    if (tap.x < 0 || tap.y < 0 || tap.x > W || tap.y > H) return;
    if (t.tool === 'fill') {
      hapticTap();
      pushOp({ t: 'fill', x: tap.x, y: tap.y, color: t.color, alpha: t.alpha, tol: 40 });
      rememberColor(t.color);
    } else if (t.tool === 'picker') {
      const c = sampleAt(tap.x, tap.y);
      if (c) { setColor(c); rememberColor(c); setTool(toolRef.current.prevTool || 'brush'); say('Colour picked'); }
    } else if (t.tool === 'stamp') {
      hapticTap();
      pushOp({ t: 'stamp', x: tap.x, y: tap.y, emoji: t.stamp, size: Math.max(40, t.size * 6), rot: (Math.random() - 0.5) * 0.5 });
    } else if (t.tool === 'text' && t.textEdit) {
      setTextEdit((te) => { if (!te) return te; const [rx, ry] = rawPt(te, tap.x, tap.y); return { ...te, x: rx, y: ry }; });
    } else if (t.tool === 'text' && !t.textEdit) {
      const k = hitAt(tap.x, tap.y, e.pointerType, 'text');
      if (k >= 0) { editText(st.current.ops[k], 'text'); return; }
      setTextEdit({ x: tap.x, y: tap.y, text: '', font: 'sans', size: Math.max(48, t.size * 4), color: t.color, alpha: t.alpha, outline: null });
    }
  };
  const zoomAt = (cx, cy, z) => {
    const v = st.current.view;
    const r = viewRef.current.getBoundingClientRect();
    const mx = cx - r.left;
    const my = cy - r.top;
    const dx = (mx - v.ox) / v.s;
    const dy = (my - v.oy) / v.s;
    const nz = Math.max(1, Math.min(6, z));
    const ns = v.base * nz;
    applyZoom(nz, mx - (v.sw - W * ns) / 2 - dx * ns, my - (v.sh - H * ns) / 2 - dy * ns);
  };
  const zoomRef = useRef(null);
  zoomRef.current = zoomAt;
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return undefined;
    let g0 = null;
    const wheel = (e) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    const gs = (e) => { e.preventDefault(); g0 = st.current.pointers.size ? null : st.current.view.z; };
    const gc = (e) => { e.preventDefault(); if (g0 != null && !st.current.pointers.size && zoomRef.current) zoomRef.current(e.clientX, e.clientY, g0 * (e.scale || 1)); };
    const ge = (e) => { e.preventDefault(); g0 = null; };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('gesturestart', gs);
    el.addEventListener('gesturechange', gc);
    el.addEventListener('gestureend', ge);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('gesturestart', gs);
      el.removeEventListener('gesturechange', gc);
      el.removeEventListener('gestureend', ge);
    };
  }, []);
  const onWheel = (e) => {
    const v = st.current.view;
    const pixel = e.deltaMode === 0;
    const trackpad = pixel && (Math.abs(e.deltaX) > 0.5 || (Math.abs(e.deltaY) < 40 && !Number.isInteger(e.deltaY)));
    if (e.ctrlKey || e.metaKey) { zoomAt(e.clientX, e.clientY, v.z * Math.exp(-e.deltaY * (pixel ? 0.01 : 0.3))); return; }
    if (trackpad) { if (v.z > 1.001) applyZoom(v.z, v.px - e.deltaX, v.py - e.deltaY); return; }
    zoomAt(e.clientX, e.clientY, v.z * (e.deltaY < 0 ? 1.15 : 0.87));
  };
  const keyRef = useRef(null);
  keyRef.current = (e) => {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || sheet || confirmLeave || confirmClear) return;
    const key = String(e.key || '');
    const low = key.toLowerCase();
    if (key === ' ' && !textEdit) { e.preventDefault(); st.current.spaceHeld = true; return; }
    if ((e.ctrlKey || e.metaKey) && low === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if ((e.ctrlKey || e.metaKey) && low === 'y') { e.preventDefault(); redo(); return; }
    const sel = st.current.sel;
    if ((e.ctrlKey || e.metaKey) && low === 'd' && sel) { e.preventDefault(); copySel(); return; }
    if ((e.ctrlKey || e.metaKey) && low === 'a' && tool === 'move') { e.preventDefault(); selectAll(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (sel && (key === 'Delete' || key === 'Backspace')) { e.preventDefault(); deleteSel(); return; }
    if (sel && key === 'Escape') { e.preventDefault(); e.stopPropagation(); clearSel(); return; }
    if (sel && key.startsWith('Arrow')) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 2;
      nudge(key === 'ArrowLeft' ? -d : key === 'ArrowRight' ? d : 0, key === 'ArrowUp' ? -d : key === 'ArrowDown' ? d : 0);
      return;
    }
    const map = { b: 'brush', e: 'eraser', g: 'fill', s: 'shapes', t: 'text', i: 'picker', v: 'move' };
    const k = map[low];
    if (k && !textEdit) switchTool(k);
  };
  useEffect(() => {
    const onKey = (e) => { if (keyRef.current) keyRef.current(e); };
    const onKeyUp = (e) => { if (e.key === ' ') st.current.spaceHeld = false; };
    const onBlur = () => { st.current.spaceHeld = false; };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', onBlur);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKeyUp, true); window.removeEventListener('blur', onBlur); };
  }, []);
  const switchTool = (k) => {
    if (k !== 'move' && st.current.sel) { if (st.current.mv) finishMove(); clearSel(); }
    setTool(k);
  };

  const pickTool = (k) => {
    hapticTap();
    if (k === 'picker') toolRef.current.prevTool = tool === 'picker' ? 'brush' : tool;
    if (textEdit && k !== 'text') commitText();
    switchTool(k);
    if (k === 'move' && tool !== 'move' && !st.current.sel) say('Tap something you drew, then drag it');
    if (k === 'shapes' && tool === 'shapes') setSheet('shapes');
    if (k === 'brush' && tool === 'brush') setSheet('brush');
    if (k === 'stamp' && tool === 'stamp') setSheet('stamp');
  };
  const commitText = () => {
    const te = textEdit;
    setTextEdit(null);
    st.current.editHide = null;
    if (!te) return;
    const text = te.text.replace(/\s+$/, '');
    const { m, replaces, from, ...rest } = te;
    if (replaces != null) {
      const s = st.current;
      const prev = s.ops[s.idx.get(replaces)];
      const same = prev && prev.text === text && prev.font === rest.font && prev.size === rest.size && prev.color === rest.color && (prev.outline || null) === (rest.outline || null) && prev.x === rest.x && prev.y === rest.y;
      if (same || !prev) rebuild();
      else {
        const batch = `t${Date.now()}`;
        pushOp({ t: 'xform', refs: [replaces], hide: true, batch });
        if (text.trim()) { const op = { t: 'text', ...rest, text, batch }; if (m) op.m = m; pushOp(op); }
      }
    } else if (text.trim()) pushOp({ t: 'text', ...rest, text });
    if (text.trim()) rememberColor(te.color);
    if (from) setTool(from);
  };
  const projectData = () => {
    const s = st.current;
    let start = 0;
    s.ops.forEach((op, k) => { if (op.t === 'clear') start = k + 1; });
    let photo = null;
    if (bgPhoto) { try { photo = L.current.bg.toDataURL('image/jpeg', 0.82); } catch {} }
    return { v: 1, doc: docKey, bg: bgKey, tpl: template || null, photo, ops: paintCompactOps(s.ops.slice(start)) };
  };
  const exportBlob = async (withProject) => {
    if (st.current.mv) finishMove();
    const out = mk(W, H);
    const ctx = out.getContext('2d');
    ctx.drawImage(L.current.bg, 0, 0);
    ctx.drawImage(L.current.paint, 0, 0);
    ctx.drawImage(L.current.art, 0, 0);
    const type = bgPhoto ? 'image/jpeg' : 'image/png';
    const blob = await new Promise((res) => out.toBlob(res, type, 0.92));
    if (!blob || !withProject) return blob;
    return paintEmbedProject(blob, projectData());
  };
  const loadProject = (p) => {
    const s = st.current;
    const ops = (Array.isArray(p.ops) ? p.ops : []).filter((o) => o && typeof o.t === 'string').slice(0, 6000);
    s.idSeq = ops.reduce((mx, o) => Math.max(mx, Number(o.id) || 0), 0);
    ops.forEach((o) => { if (o.id == null) { s.idSeq += 1; o.id = s.idSeq; } });
    s.ops = ops;
    s.loadedLen = ops.length;
    s.redo = [];
    s.cps = [];
    s.sel = null;
    s.mv = null;
    setSelInfo(null);
    setDocKey(PAINT_SIZES[p.doc] ? p.doc : 'square');
    setBgKey(PAINT_BACKGROUNDS.some((b) => b[0] === p.bg) ? p.bg : 'white');
    setTemplate(p.tpl && PAINT_TEMPLATES[p.tpl] ? p.tpl : null);
    if (typeof p.photo === 'string' && p.photo.startsWith('data:image/')) {
      const img = new Image();
      img.onload = () => setBgPhoto(img);
      img.src = p.photo;
    } else setBgPhoto(null);
    setCount(ops.length);
    setRedoCount(0);
    setLoadGen((g) => g + 1);
  };
  useEffect(() => { if (loadGen) rebuild(); }, [loadGen]);
  useEffect(() => {
    if (!initial) return;
    if (initial.project) { loadProject(initial.project); say('Your drawing is ready to edit'); return; }
    if (!initial.photo) return;
    st.current.loadedLen = 0;
    const url = URL.createObjectURL(initial.photo);
    const img = new Image();
    img.onload = () => {
      const r = (img.naturalHeight || 1) / Math.max(1, img.naturalWidth || 1);
      setDocKey(r >= 1.55 ? 'story' : r >= 1.12 ? 'portrait' : 'square');
      setBgPhoto(img);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };
    img.onerror = () => { URL.revokeObjectURL(url); say('That photo could not be opened'); };
    img.src = url;
  }, []);
  const hasWork = () => st.current.ops.length > 0 || !!template || !!bgPhoto;
  const send = async () => {
    if (busy || !hasWork()) return;
    if (textEdit) commitText();
    setBusy(true);
    const blob = await exportBlob(true);
    if (blob) await onSend(new File([blob], `drawing-${Date.now()}.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`, { type: blob.type }));
    setBusy(false);
  };
  const saveToPhone = async () => {
    const blob = await exportBlob(true);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zchat-drawing-${Date.now()}.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    say('Saved');
  };
  const ask = async (q) => {
    if (!onAskBot) return;
    setAskState({ k: q.k, loading: true, text: '' });
    let file = null;
    if (q.k !== 'idea' && hasWork()) {
      const blob = await exportBlob(false);
      if (blob) file = new File([blob], `drawing-${Date.now()}.${blob.type === 'image/jpeg' ? 'jpg' : 'png'}`, { type: blob.type });
    }
    if (q.k !== 'idea' && !file) { setAskState({ k: q.k, loading: false, text: 'Draw something first, then ask again.' }); return; }
    const res = await onAskBot(file, q.prompt);
    setAskState({ k: q.k, loading: false, text: (res && (res.text || res.error)) || 'ZChat Bot could not answer right now. Try again in a moment.' });
  };
  const [backGen, setBackGen] = useState(0);
  const requestClose = (fromBack) => {
    if (sheet) { setSheet(null); if (fromBack) setBackGen((g) => g + 1); return; }
    if (fromBack && st.current.sel) { clearSel(); setBackGen((g) => g + 1); return; }
    if (hasWork() && st.current.loadedLen != null && st.current.ops.length === st.current.loadedLen && !textEdit) { onClose(); return; }
    if (hasWork()) { setConfirmLeave(true); if (fromBack) setBackGen((g) => g + 1); return; }
    onClose();
  };
  const reqCloseRef = useRef(requestClose);
  reqCloseRef.current = requestClose;
  useEffect(() => {
    const entry = () => { reqCloseRef.current(true); };
    backStack.push(entry);
    navSync();
    return () => { const i = backStack.lastIndexOf(entry); if (i >= 0) backStack.splice(i, 1); navSync(); };
  }, [backGen]);
  const pickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setSheet(null);
    if (!hasWork()) {
      try {
        const project = await paintReadProjectBytes(new Uint8Array(await f.arrayBuffer()));
        if (project) { loadProject(project); say('Opened your drawing'); return; }
      } catch {}
    }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => { setBgPhoto(img); setTimeout(() => URL.revokeObjectURL(url), 2000); };
    img.onerror = () => { URL.revokeObjectURL(url); say('That photo could not be opened'); };
    img.src = url;
  };
  const changeSize = (k) => {
    if (k === docKey) return;
    if (hasVisible()) { say('Clear the canvas first to change its shape'); return; }
    clearSel();
    st.current.ops = [];
    st.current.redo = [];
    setCount(0);
    setRedoCount(0);
    st.current.cps = [];
    st.current.view.z = 1;
    st.current.view.px = 0;
    st.current.view.py = 0;
    setDocKey(k);
  };
  useEffect(() => { rebuild(); }, [W, H]);

  const c = igPalette(theme);
  const barBtn = (k, label, onClick, disabled) => (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className="zchat-press"
      style={{ width: 42, height: 42, borderRadius: 12, border: 'none', background: 'transparent', color: disabled ? c.faint : c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', padding: 0, flexShrink: 0 }}>
      <PaintToolIcon k={k} />
    </button>
  );
  const tools = [['brush', 'Brush'], ['eraser', 'Eraser'], ['fill', 'Fill'], ['shapes', 'Shapes'], ['text', 'Text'], ['stamp', 'Stickers'], ['move', 'Move'], ['picker', 'Pick colour']];
  const brushLabel = (PAINT_BRUSHES.find((b) => b.k === brush) || PAINT_BRUSHES[0]).label;
  const shapeLabel = (PAINT_SHAPES.find((b) => b.k === shape) || PAINT_SHAPES[0]).label;
  const stageBg = theme.dark ? '#121214' : '#E7E7EC';
  const stageNote = { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: theme.dark ? 'rgba(242, 242, 244, 0.8)' : 'rgba(17, 17, 19, 0.66)', textShadow: `0 0 6px ${stageBg}, 0 0 2px ${stageBg}` };
  const doneBtn = (aria, onClick) => (
    <button type="button" aria-label={aria} onClick={onClick} className="zchat-press"
      style={{ height: 36, padding: '0 18px', borderRadius: 18, border: 'none', background: theme.coral, color: '#FFFFFF', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer', flexShrink: 0 }}>Done</button>
  );
  const rowLabel = (t) => <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '16px 0 8px' }}>{t}</div>;
  const optionRow = (label, sub, right, onClick) => (
    <div role={onClick ? 'button' : undefined} onClick={onClick} className={onClick ? 'zchat-row-press' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
  const previews = useMemo(() => {
    if (sheet !== 'brush') return {};
    const out = {};
    const pc = /^#F[0-9A-F]F[0-9A-F]F[0-9A-F]$/i.test(color) || color.toUpperCase() === '#FFFFFF' ? '#111111' : color;
    PAINT_BRUSHES.forEach((b) => { out[b.k] = paintBrushPreview(b.k, pc); });
    return out;
  }, [sheet, color]);

  return (
    <Portal>
      <div className="zchat-panel-open" data-no-swipe="true" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 90, background: c.bg, color: c.fg, fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 54, padding: '0 6px', gap: 2 }}>
            <button type="button" aria-label="Close" onClick={() => requestClose(false)} className="zchat-press" style={{ width: 44, height: 44, border: 'none', background: 'transparent', color: c.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}><X size={24} /></button>
            {barBtn('undo', 'Undo', undo, !count)}
            {barBtn('redo', 'Redo', redo, !redoCount)}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 12.5, color: c.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zoomPct > 100 ? `${zoomPct}%` : (recipientName ? `To ${recipientName}` : '')}</div>
            {zoomPct > 100 && barBtn('fit', 'Fit to screen', () => applyZoom(1, 0, 0))}
            {onAskBot && barBtn('bot', 'Ask ZChat Bot', () => { setAskState(null); setSheet('ask'); })}
            {barBtn('more', 'More options', () => setSheet('more'))}
            {onSend && (
              <button type="button" onClick={send} disabled={busy || !(count || template || bgPhoto)} className="zchat-press"
                style={{ height: 38, padding: '0 16px', marginLeft: 4, borderRadius: 19, border: 'none', background: theme.coral, color: '#fff', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer', opacity: busy || !(count || template || bgPhoto) ? 0.45 : 1, flexShrink: 0 }}>{busy ? 'Sending' : 'Send'}</button>
            )}
          </div>
        </div>
        <div ref={stageRef} style={{ flex: 1, minHeight: 0, position: 'relative', background: theme.dark ? '#121214' : '#E7E7EC', overflow: 'hidden' }}>
          <canvas ref={viewRef} aria-label="Drawing area" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
            style={{ position: 'absolute', left: 0, top: 0, touchAction: 'none', cursor: tool === 'picker' ? 'copy' : tool === 'text' ? 'text' : tool === 'move' ? 'move' : 'crosshair' }} />
          {(sym !== 'off' || magic || steady > 0 || template) && (
            <div role="status" style={{ position: 'absolute', left: 14, top: 10, right: 14, display: 'flex', gap: 14, flexWrap: 'wrap', pointerEvents: 'none' }}>
              {sym !== 'off' && <span style={stageNote}><KitGlyph k={sym === 'mirror' ? 'sym_mirror' : sym === 'quad' ? 'sym_quad' : 'sym_radial'} size={18} />{sym === 'mirror' ? 'Mirror' : sym === 'quad' ? 'Four way' : 'Kaleidoscope'}</span>}
              {magic && <span style={stageNote}><PaintToolIcon k="shapes" size={15} />Magic shapes</span>}
              {steady > 0 && <span style={stageNote}><StudioGlyph k="steady" size={18} />Steady {steady}</span>}
            </div>
          )}
          {toast && (
            <div className="zchat-pop" style={{ position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 8px 14px', borderRadius: 18, background: 'rgba(20,20,24,0.9)', color: '#fff', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {toast}
              {st.current.magicUndo && <button type="button" onClick={keepMyLine} style={{ height: 28, padding: '0 10px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Keep my line</button>}
            </div>
          )}
          {idea && (
            <div style={{ position: 'absolute', left: 12, right: 12, top: 12, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ maxWidth: 360, padding: '9px 14px', borderRadius: 14, background: theme.panelBg, color: theme.ink, fontSize: 14, fontWeight: 700, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', textAlign: 'center' }}>Draw this: {idea}</div>
            </div>
          )}
        </div>
        {textEdit ? (
          <div style={{ flexShrink: 0, padding: '10px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${c.line}`, background: c.bg }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <textarea autoFocus value={textEdit.text} onChange={(e) => setTextEdit((te) => ({ ...te, text: e.target.value.slice(0, 200) }))} placeholder="Type something" aria-label="Text to add" rows={2}
                style={{ ...inputStyle(theme), flex: 1, resize: 'none', fontSize: 16, lineHeight: 1.35 }} />
              <button type="button" onClick={commitText} style={{ height: 44, padding: '0 16px', borderRadius: 12, border: 'none', background: theme.coral, color: '#fff', fontWeight: 800, fontSize: 14.5, fontFamily: FONT, cursor: 'pointer', flexShrink: 0 }}>Done</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 8 }}>
              <PaintFontPicker value={textEdit.font} onChange={(k) => setTextEdit((te) => ({ ...te, font: k }))} />
              <div style={{ flex: 1, minWidth: 4 }} />
              <StudioTool label="Outline" aria={textEdit.outline ? 'Outline on' : 'Outline'} on={!!textEdit.outline} pressed={!!textEdit.outline} width={52} ink={c.fg} keepFocus
                glyph={<StudioGlyph k="textoutline" size={25} />} onClick={() => setTextEdit((te) => ({ ...te, outline: te.outline ? null : (te.color.toUpperCase() === '#FFFFFF' ? '#111111' : '#FFFFFF') }))} />
              <StudioTool label="Smaller" width={52} ink={c.fg} keepFocus disabled={textEdit.size <= 20} glyph={<StudioGlyph k="smaller" size={25} />} onClick={() => setTextEdit((te) => ({ ...te, size: Math.max(20, te.size - 10) }))} />
              <StudioTool label="Bigger" width={52} ink={c.fg} keepFocus disabled={textEdit.size >= 320} glyph={<StudioGlyph k="bigger" size={25} />} onClick={() => setTextEdit((te) => ({ ...te, size: Math.min(320, te.size + 10) }))} />
            </div>
            <div style={{ fontSize: 12.5, color: c.dim, paddingTop: 6 }}>{textEdit.replaces != null ? 'Editing your text. Clear it all to delete it.' : 'Drag the text on the canvas to move it.'}</div>
            </div>
          </div>
        ) : (
          <div style={{ flexShrink: 0, background: c.bg, borderTop: `1px solid ${c.line}`, paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div role="toolbar" aria-label="Paint tools" style={{ display: 'flex', justifyContent: 'space-around', padding: '6px 4px 0' }}>
              {tools.map(([k, label]) => {
                const on = tool === k;
                return (
                  <button key={k} type="button" aria-label={label} aria-pressed={on} onClick={() => pickTool(k)} className="zchat-press"
                    style={{ flex: '0 1 46px', minWidth: 34, height: 46, border: 'none', background: 'transparent', color: on ? kitOnInk(theme) : c.fg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', padding: 0, transition: 'color 160ms ease' }}>
                    <PaintToolIcon k={k} />
                    <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 2, background: on ? theme.coral : 'transparent', transition: 'background 160ms ease' }} />
                  </button>
                );
              })}
            </div>
            {tool === 'move' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 12px 0 8px', minHeight: 52 }}>
                  {selInfo ? (
                    <>
                      <StudioTool label="Copy" aria="Copy selection" ink={c.fg} glyph={<StudioGlyph k="copy" />} onClick={copySel} />
                      <StudioTool label="To front" aria="Bring to front" ink={c.fg} glyph={<StudioGlyph k="front" />} onClick={frontSel} width={60} />
                      {selInfo.text && <StudioTool label="Edit text" ink={c.fg} glyph={<StudioGlyph k="edittext" />} onClick={() => { const s = st.current; const one = s.sel && s.ops[s.idx.get(s.sel.ids[0])]; if (one) editText(one, 'move'); }} width={60} />}
                      <StudioTool label="Delete" aria="Delete selection" danger glyph={<StudioGlyph k="trash" />} onClick={deleteSel} />
                      <div style={{ flex: 1, minWidth: 6 }} />
                      {doneBtn('Done moving', () => { hapticTap(); if (st.current.mv) finishMove(); clearSel(); })}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, color: c.dim, fontWeight: 600, flex: 1, minWidth: 0, paddingLeft: 6 }}>Tap something you drew to move it</span>
                      <StudioTool label="Select all" ink={c.fg} glyph={<StudioGlyph k="selectall" />} onClick={selectAll} width={64} />
                    </>
                  )}
                </div>
                <div style={{ height: 26, margin: '4px 14px 2px', display: 'flex', alignItems: 'center', fontSize: 12.5, color: c.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selInfo ? (selInfo.n === 1 ? 'Drag to move it. Corner dot resizes, top dot turns.' : `${selInfo.n} parts picked. Drag to move them together.`) : 'Or drag across a few parts to pick them together.'}
                </div>
              </>
            ) : (
            <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 14px 0', minHeight: 52 }}>
              <button type="button" aria-label="Choose colour" onClick={() => setSheet('color')} className="zchat-press"
                style={{ width: 36, height: 36, marginRight: 4, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, background: color, boxShadow: `0 0 0 2px ${c.bg}, 0 0 0 3.5px ${theme.dark ? 'rgba(255,255,255,0.32)' : 'rgba(17,17,19,0.2)'}`, opacity: Math.max(0.35, alpha) }} />
              {tool === 'brush' && <StudioTool label={brushLabel} aria="Choose brush" ink={c.fg} width={66} glyph={<PaintBrushChip k={brush} color={color} />} onClick={() => setSheet('brush')} />}
              {tool === 'shapes' && <StudioTool label={shape === 'round' ? 'Rounded' : shape === 'bubble' ? 'Bubble' : shapeLabel} aria="Choose shape" ink={c.fg} width={60} glyph={<PaintShapeIcon k={shape} color="currentColor" fill={shapeFill ? color : false} size={28} />} onClick={() => setSheet('shapes')} />}
              {tool === 'shapes' && <StudioTool label={shapeFill ? 'Filled' : 'Outline'} aria="Fill shape" on={shapeFill} pressed={shapeFill} ink={c.fg} width={54} glyph={<PaintFillGlyph on={shapeFill} />} onClick={() => setShapeFill((v) => !v)} />}
              {tool === 'stamp' && <StudioTool label="Sticker" aria="Choose sticker" ink={c.fg} width={56} glyph={<span style={{ fontSize: 23, lineHeight: 1 }}>{stamp}</span>} onClick={() => setSheet('stamp')} />}
              {tool === 'fill' && <span style={{ fontSize: 13, color: c.dim, fontWeight: 600, flex: 1, paddingLeft: 4 }}>Tap an area to fill it</span>}
              {tool === 'picker' && <span style={{ fontSize: 13, color: c.dim, fontWeight: 600, flex: 1, paddingLeft: 4 }}>Tap the drawing to pick a colour</span>}
              {tool === 'text' && <span style={{ fontSize: 13, color: c.dim, fontWeight: 600, flex: 1, paddingLeft: 4 }}>Tap where the text should go</span>}
              {(tool === 'brush' || tool === 'eraser' || tool === 'shapes' || tool === 'stamp') && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, paddingLeft: 4 }}>
                  <KitSlider value={size} min={1} max={80} label="Size" onChange={setSize} style={{ flex: 1, minWidth: 0 }} />
                  <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: Math.max(3, Math.min(28, size * 0.45)), height: Math.max(3, Math.min(28, size * 0.45)), borderRadius: '50%', background: tool === 'eraser' ? 'transparent' : color, border: tool === 'eraser' ? `2px solid ${c.fg}` : 'none', boxShadow: tool === 'eraser' ? 'none' : `0 0 0 1px ${c.line}` }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '6px 14px 2px', scrollbarWidth: 'none' }}>
              {[...recent, ...PAINT_PALETTE.filter((x) => !recent.includes(x))].map((col) => (
                <div key={col} role="button" aria-label={`Color ${col}`} onClick={() => { hapticTap(); setColor(col); rememberColor(col); if (tool === 'eraser' || tool === 'picker') setTool('brush'); }}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: col, cursor: 'pointer', flexShrink: 0, boxShadow: color === col ? `0 0 0 2px ${c.bg}, 0 0 0 4px ${c.fg}` : `inset 0 0 0 1px ${c.line}` }} />
              ))}
            </div>
            </>
            )}
            </div>
          </div>
        )}
        <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
      </div>
      {sheet === 'color' && (
        <PaintSheet title="Colour" onClose={() => { setSheet(null); rememberColor(color); }}>
          <PaintColorPanel color={color} alpha={alpha} onColor={(x) => { setColor(x); if (tool === 'eraser' || tool === 'picker') setTool('brush'); }} onAlpha={setAlpha} recent={recent} />
        </PaintSheet>
      )}
      {sheet === 'brush' && (
        <PaintSheet title="Brushes" onClose={() => setSheet(null)}>
          <StudioTileGrid label="Brushes" cols={2} ratio={2.7} gap={14} value={brush} onChange={(k) => { setBrush(k); setTool('brush'); setSheet(null); }}
            options={PAINT_BRUSHES.map((b) => ({ k: b.k, label: b.label, aria: `Brush ${b.label}`, bg: '#FFFFFF', art: previews[b.k] ? <img src={previews[b.k]} alt="" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} /> : null }))} />
        </PaintSheet>
      )}
      {sheet === 'shapes' && (
        <PaintSheet title="Shapes" onClose={() => setSheet(null)}>
          <StudioTileGrid label="Shapes" cols={3} ratio={1.35} gap={12} value={shape} onChange={(k) => { setShape(k); setTool('shapes'); setSheet(null); }}
            options={PAINT_SHAPES.map((sp) => ({ k: sp.k, label: sp.label, aria: `Shape ${sp.label}`, art: <PaintShapeIcon k={sp.k} color="currentColor" fill={shapeFill} size={46} /> }))} />
          {optionRow('Fill shapes', 'Solid shapes instead of outlines', <IgToggle on={shapeFill} onClick={() => setShapeFill((v) => !v)} />)}
        </PaintSheet>
      )}
      {sheet === 'stamp' && (
        <PaintSheet title="Stickers" onClose={() => setSheet(null)}>
          <StudioTileGrid label="Stickers" cols={4} ratio={1} gap={12} value={stamp} onChange={(em) => { setStamp(em); setTool('stamp'); setSheet(null); }}
            options={PAINT_STAMPS.map((em) => ({ k: em, aria: `Sticker ${em}`, art: <span style={{ fontSize: 34, lineHeight: 1 }}>{em}</span> }))} />
        </PaintSheet>
      )}
      {sheet === 'ask' && (
        <PaintSheet title="Ask ZChat Bot" onClose={() => setSheet(null)}>
          {!askState && (
            <>
              <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, marginBottom: 6 }}>ZChat Bot looks at your drawing and answers. Your question and drawing also show up in your chat with ZChat Bot.</div>
              {PAINT_BOT_ASKS.map((q) => optionRow(q.label, q.sub, <ChevronRight size={18} color={theme.muted} />, () => ask(q)))}
            </>
          )}
          {askState && askState.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 4px' }}>
              <Spinner size={20} color={theme.coral} />
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>ZChat Bot is looking</div>
            </div>
          )}
          {askState && !askState.loading && (
            <div style={{ padding: '6px 0 10px' }}>
              <div style={{ fontSize: 15.5, lineHeight: 1.55, color: theme.ink, background: theme.rowBg, borderRadius: 16, padding: '14px 16px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{askState.text}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <div style={{ flex: 1 }}><BigButton label="Ask something else" tone="plain" onClick={() => setAskState(null)} /></div>
                <div style={{ flex: 1 }}><BigButton label="Back to drawing" onClick={() => setSheet(null)} /></div>
              </div>
            </div>
          )}
        </PaintSheet>
      )}
      {sheet === 'more' && (
        <PaintSheet title="Options" onClose={() => setSheet(null)}>
          {rowLabel('Drawing help')}
          {optionRow('Magic shapes', 'Draw a rough circle, box or line and it snaps neat', <IgToggle on={magic} onClick={() => setMagic((v) => !v)} />)}
          {optionRow('Steady hand', steady ? `Smoothing ${steady} of 10` : 'Smooths shaky lines', <KitSlider value={steady} min={0} max={10} label="Steady hand" onChange={setSteady} style={{ width: 132 }} />)}
          {optionRow('Need an idea?', idea || 'Get something fun to draw', <span style={{ fontSize: 13.5, fontWeight: 800, color: theme.coral }}>{idea ? 'Another' : 'Give me one'}</span>, () => { const pool = PAINT_IDEAS.filter((x) => x !== idea); setIdea(pool[Math.floor(Math.random() * pool.length)]); })}
          {idea && optionRow('Hide the idea', null, null, () => setIdea(''))}
          <KitSection title="Mirror">
            <PickTiles label="Mirror" size={60} fit value={sym} onChange={(k) => setSym(k)}
              options={[['off', 'Off', 'sym_off'], ['mirror', 'Mirror', 'sym_mirror'], ['quad', 'Four way', 'sym_quad'], ['radial', 'Kaleidoscope', 'sym_radial']].map(([k, label, g]) => ({ k, label, aria: `Mirror ${label}`, art: <KitGlyph k={g} size={34} /> }))} />
          </KitSection>
          <KitSection title="Background">
            <PickTiles label="Background" size={60} bleed={18} value={bgPhoto ? 'photo' : bgKey}
              onChange={(k) => {
                if (k === 'photo') { if (photoInputRef.current) photoInputRef.current.click(); return; }
                setBgPhoto(null); setBgKey(k); if (k === 'black' && color === '#111111') setColor('#FFFFFF'); if (k !== 'black' && bgKey === 'black' && color === '#FFFFFF') setColor('#111111');
              }}
              options={[...PAINT_BACKGROUNDS.map(([k, col, label]) => ({ k, label, aria: `Background ${label}`, art: paintBgArt(k, col) })), { k: 'photo', label: bgPhoto ? 'Your photo' : 'Photo', aria: 'Draw on a photo', art: <KitGlyph k="photo" size={32} /> }]} />
          </KitSection>
          <KitSection title="Colouring pages">
            <PickTiles label="Colouring pages" size={68} bleed={18} value={template || 'none'}
              onChange={(k) => { if (k === 'none') { setTemplate(null); return; } setTemplate(k); setTool('fill'); setSheet(null); say('Pick a colour and tap to fill'); }}
              options={[{ k: 'none', label: 'Blank', aria: 'No colouring page', art: <KitGlyph k="none" size={30} /> }, ...Object.entries(PAINT_TEMPLATES).map(([k, tpl]) => ({ k, label: tpl.label, aria: `Colouring page ${tpl.label}`, bg: '#FFFFFF', art: <img src={paintTplThumb(k)} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> }))]} />
          </KitSection>
          <KitSection title="Canvas">
            <PickTiles label="Canvas" size={60} fit value={docKey} onChange={(k) => changeSize(k)}
              options={Object.entries(PAINT_SIZES).map(([k, v]) => ({ k, label: v[2], sub: k === 'square' ? '1:1' : k === 'portrait' ? '4:5' : '9:16', aria: `Canvas ${v[2]}`, art: <KitGlyph k={`size_${k}`} size={34} /> }))} />
          </KitSection>
          <div style={{ height: 10 }} />
          {optionRow('Save to phone', 'Download as a picture', <Download size={18} color={theme.muted} />, saveToPhone)}
          {optionRow('Clear canvas', 'Start over', <Trash2 size={18} color={theme.danger} />, () => { if (st.current.ops.length) setConfirmClear(true); })}
        </PaintSheet>
      )}
      {confirmClear && (
        <ConfirmDialog title="Clear the canvas?" body="You can still undo this." confirmLabel="Clear" onCancel={() => setConfirmClear(false)}
          onConfirm={() => { setConfirmClear(false); setSheet(null); clearSel(); pushOp({ t: 'clear' }); }} />
      )}
      {confirmLeave && (
        <ConfirmDialog title="Throw away this drawing?" body="It has not been sent or saved yet." confirmLabel="Throw away" onCancel={() => setConfirmLeave(false)}
          onConfirm={() => { setConfirmLeave(false); onClose(); }} />
      )}
    </Portal>
  );
}

function PaintShapeIcon({ k, color, fill, size = 44 }) {
  const d = (() => {
    if (k === 'line') return 'M6 34 L38 6';
    if (k === 'arrow') return 'M6 34 L38 6 M38 6 L26 8 M38 6 L36 18';
    if (k === 'rect') return 'M6 8 H38 V34 H6 Z';
    if (k === 'round') return 'M14 8 H30 Q38 8 38 16 V26 Q38 34 30 34 H14 Q6 34 6 26 V16 Q6 8 14 8 Z';
    if (k === 'ellipse') return 'M22 7 C32 7 39 13 39 21 C39 29 32 35 22 35 C12 35 5 29 5 21 C5 13 12 7 22 7 Z';
    if (k === 'triangle') return 'M22 6 L39 35 H5 Z';
    if (k === 'star') return 'M22 4 L27 15.5 L39 16.5 L30 24.5 L33 36 L22 29.5 L11 36 L14 24.5 L5 16.5 L17 15.5 Z';
    if (k === 'heart') return 'M22 36 C6 26 2 16 8 10 C13 5 19 7 22 12 C25 7 31 5 36 10 C42 16 38 26 22 36 Z';
    if (k === 'bubble') return 'M12 6 H32 Q39 6 39 13 V22 Q39 29 32 29 H18 L10 36 L12 29 Q5 29 5 22 V13 Q5 6 12 6 Z';
    return '';
  })();
  const solid = fill && k !== 'line' && k !== 'arrow';
  return <svg width={size} height={(size * 40) / 44} viewBox="0 0 44 40" fill={solid ? (fill === true ? color : fill) : 'none'} stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

export function FolderEditorPage({ folder, conversations, groups, onClose, onSave, onDelete, preset }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(folder ? folder.name : '');
  const [members, setMembers] = useState(() => new Set(folder ? folder.members : (preset || [])));
  const [rules, setRules] = useState(() => ({ ...((folder && folder.rules) || {}) }));
  const [q, setQ] = useState('');
  const [askDelete, setAskDelete] = useState(false);
  const term = q.trim().toLowerCase();
  const rows = [
    ...conversations.filter((c) => c.otherProfile).map((c) => ({ key: `dm-${c.otherProfile.id}`, name: c.otherProfile.name, sub: `@${c.otherProfile.username}`, avatar: <Avatar emoji={c.otherProfile.avatar} name={c.otherProfile.name} size={42} /> })),
    ...groups.filter((g) => !g.archived).map((g) => ({ key: `group-${g.id}`, name: g.name, sub: 'Group', avatar: <GroupAvatar avatar={g.avatar} name={g.name} size={42} /> })),
  ].filter((r) => !term || (r.name || '').toLowerCase().includes(term) || (r.sub || '').toLowerCase().includes(term));
  const toggle = (k) => setMembers((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const hasRule = !!(rules.groups || rules.dms);
  const ok = name.trim().length > 0 && (members.size > 0 || hasRule);
  const saveLabel = !ok ? 'Save folder' : members.size ? `Save ${members.size} ${members.size === 1 ? 'chat' : 'chats'}` : 'Save folder';
  return (
    <FullPage title={folder ? 'Edit folder' : 'New folder'} onBack={onClose} zIndex={78}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          {folder && <div style={{ width: 120 }}><BigButton label="Delete" tone="plain" onClick={() => setAskDelete(true)} /></div>}
          <div style={{ flex: 1 }}><BigButton label={saveLabel} disabled={!ok} onClick={() => onSave({ id: folder ? folder.id : `f${Date.now().toString(36)}`, name: name.trim().slice(0, 24), members: [...members], rules: Object.fromEntries(Object.entries(rules).filter(([, v]) => v)) })} /></div>
        </div>
      )}>
      {!folder && <PageArt text="Group the chats you care about, like Family, Work or Squad. Folders show up as tabs above your chats." />}
      <IgHeading>Folder name</IgHeading>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} placeholder="Family, Work, Squad" aria-label="Folder name" style={{ ...inputStyle(theme), fontSize: 16 }} />
      <IgHeading>Include and leave out</IgHeading>
      {FOLDER_RULES.map(([k, l, sub]) => (
        <IgRow key={k} inset={false} label={l} sub={sub} right={<IgToggle on={!!rules[k]} onClick={() => setRules((r) => ({ ...r, [k]: !r[k] }))} />} />
      ))}
      <IgHeading>Chats in this folder</IgHeading>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.soft, color: theme.muted, marginBottom: 6 }}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search chats for folder" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
      </label>
      {rows.map((r) => {
        const on = members.has(r.key);
        return (
          <div key={r.key} role="button" aria-label={`${on ? 'Remove' : 'Add'} ${r.name}`} onClick={() => { hapticTap(); toggle(r.key); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 2px', cursor: 'pointer', borderRadius: 12 }}>
            {r.avatar}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: theme.muted }}>{r.sub}</div>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: 12, border: `2px solid ${on ? theme.coral : theme.border}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{on && <Check size={14} color="#fff" strokeWidth={3} />}</div>
          </div>
        );
      })}
      {askDelete && <ConfirmDialog layer={800} title={`Delete ${folder.name}?`} body="The chats stay in your list. Only the folder goes away." confirmLabel="Delete folder" onCancel={() => setAskDelete(false)} onConfirm={() => { setAskDelete(false); onDelete(folder); }} />}
    </FullPage>
  );
}
const GIF_SPEEDS = [['slow', 'Slow', 1000], ['normal', 'Normal', 500], ['fast', 'Fast', 250]];
const GIF_MAX_SECS = 6;
const GIF_MAX_PHOTOS = 20;
const GIF_MAX_BYTES = 3 * 1024 * 1024;
function ensureMemeFont() {
  try {
    if (!document.getElementById('zchat-meme-font')) {
      const l = document.createElement('link');
      l.id = 'zchat-meme-font';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Anton&display=swap';
      document.head.appendChild(l);
    }
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([document.fonts.load('48px Anton').catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  } catch { return Promise.resolve(); }
}
function memeWrap(ctx, text, maxW) {
  const lines = [];
  let cur = '';
  text.split(/\s+/).filter(Boolean).forEach((w) => {
    const t = cur ? `${cur} ${w}` : w;
    if (!cur || ctx.measureText(t).width <= maxW) cur = t; else { lines.push(cur); cur = w; }
  });
  if (cur) lines.push(cur);
  return lines;
}
function drawMemeText(ctx, textIn, W, H, pos) {
  const text = String(textIn || '').trim().toUpperCase();
  if (!text) return;
  const maxW = W * 0.92;
  let size = Math.max(10, Math.round(Math.min(W * 0.13, H * 0.15)));
  let lines = [];
  for (; size > 9; size = Math.floor(size * 0.92)) {
    ctx.font = `400 ${size}px ${MEME_FONT}`;
    lines = memeWrap(ctx, text, maxW);
    if (lines.length <= 3 && lines.length * size * 1.08 <= H * 0.3 && lines.every((l) => ctx.measureText(l).width <= maxW)) break;
  }
  ctx.save();
  ctx.font = `400 ${size}px ${MEME_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(2, size * 0.16);
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = '#FFFFFF';
  const lh = size * 1.08;
  const pad = Math.max(4, H * 0.035);
  const y0 = pos === 'top' ? pad : H - pad - lines.length * lh;
  lines.forEach((l, i) => { ctx.strokeText(l, W / 2, y0 + i * lh); ctx.fillText(l, W / 2, y0 + i * lh); });
  ctx.restore();
}
function coverDraw(ctx, el, sw, sh, W, H) {
  const r = W / H;
  let sx = 0; let sy = 0; let w = sw; let h = sh;
  if (sw / sh > r) { w = sh * r; sx = (sw - w) / 2; } else { h = sw / r; sy = (sh - h) / 2; }
  ctx.drawImage(el, sx, sy, w, h, 0, 0, W, H);
}
export function GifMakerPage({ onClose, onSend }) {
  const { theme } = useTheme();
  const [src, setSrc] = useState(null);
  const [nat, setNat] = useState(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(GIF_MAX_SECS);
  const [speed, setSpeed] = useState('normal');
  const [text, setText] = useState('');
  const [pos, setPos] = useState('bottom');
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [slide, setSlide] = useState(0);
  const [err, setErr] = useState('');
  const videoInRef = useRef(null);
  const photoInRef = useRef(null);
  const vidRef = useRef(null);
  const overlayRef = useRef(null);
  const holdRef = useRef(false);
  const signalRef = useRef(null);
  const urlsRef = useRef([]);
  const trimRef = useRef({ start: 0, len: GIF_MAX_SECS });
  trimRef.current = { start, len };
  const keepUrl = (u) => { urlsRef.current.push(u); return u; };
  useEffect(() => () => { if (signalRef.current) signalRef.current.stopped = true; const list = urlsRef.current.slice(); setTimeout(() => list.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} }), 2500); }, []);
  useEffect(() => { ensureMemeFont(); }, []);
  const stop = () => { if (signalRef.current) signalRef.current.stopped = true; holdRef.current = false; setBusy(false); };
  const dropSrc = () => { stop(); setResult(null); setSrc(null); setNat(null); setDur(0); setErr(''); };
  useBackClose(true, onClose);
  useBackClose(!!src, dropSrc);
  useBackClose(!!result, () => setResult(null));
  useBackClose(busy, stop);
  const pickVideo = (f) => {
    if (!f) return;
    setResult(null); setErr(''); setNat(null); setDur(0); setStart(0); setLen(GIF_MAX_SECS);
    setSrc({ kind: 'video', url: keepUrl(URL.createObjectURL(f)) });
  };
  const pickPhotos = async (list) => {
    const all = Array.from(list || []).filter((f) => /^image\//i.test(f.type || ''));
    const fs = all.slice(0, GIF_MAX_PHOTOS);
    if (!fs.length) return;
    if (all.length > GIF_MAX_PHOTOS) appSnack(`The first ${GIF_MAX_PHOTOS} photos go into your GIF`);
    const items = fs.map((f, i) => ({ id: `${Date.now()}-${i}`, url: keepUrl(URL.createObjectURL(f)) }));
    setResult(null); setErr(''); setSlide(0); setNat(null);
    setSrc({ kind: 'photos', items });
    try { const im = await loadImageElement(items[0].url); setNat({ w: im.naturalWidth, h: im.naturalHeight }); } catch { setErr('Those photos could not be opened. Try others.'); }
  };
  const removePhoto = (id) => {
    hapticTap();
    setSrc((s) => {
      if (!s || s.kind !== 'photos') return s;
      const items = s.items.filter((x) => x.id !== id);
      if (!items.length) { setNat(null); return null; }
      if (s.items[0].id === id) loadImageElement(items[0].url).then((im) => setNat({ w: im.naturalWidth, h: im.naturalHeight }), () => {});
      return { ...s, items };
    });
    setSlide(0);
  };
  const onMeta = async () => {
    const v = vidRef.current;
    if (!v) return;
    if (!v.videoWidth || !v.videoHeight) { setErr('That video could not be opened. Try another one.'); return; }
    const d = await animDuration(v);
    if (!d || d < 0.4) { setErr('That video is too short. Pick one that is at least half a second long.'); return; }
    setNat({ w: v.videoWidth, h: v.videoHeight });
    setDur(d);
    setLen(Math.min(GIF_MAX_SECS, d));
    setStart(0);
    try { v.currentTime = 0; v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {}
  };
  useClipLoop(vidRef, trimRef, holdRef, !!src && src.kind === 'video' && dur > 0 && !busy && !result);
  const ms = (GIF_SPEEDS.find((x) => x[0] === speed) || GIF_SPEEDS[1])[2];
  useEffect(() => {
    if (!src || src.kind !== 'photos' || result || busy || src.items.length < 2) return undefined;
    const t = setInterval(() => setSlide((i) => (i + 1) % src.items.length), ms);
    return () => clearInterval(t);
  }, [src, ms, result, busy]);
  const out = (() => {
    if (!nat || !src) return null;
    let r = nat.w / nat.h;
    r = src.kind === 'photos' ? Math.max(0.75, Math.min(1.5, r)) : Math.max(9 / 16, Math.min(16 / 9, r));
    return r >= 1 ? { w: 480, h: Math.round(480 / r / 2) * 2 } : { w: Math.round((480 * r) / 2) * 2, h: 480 };
  })();
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const boxMaxW = Math.min(vw - 32, 440);
  const boxMaxH = Math.max(180, vh * 0.44);
  const ratio = result ? result.w / result.h : out ? out.w / out.h : 1;
  const boxW = Math.round(Math.min(boxMaxW, boxMaxH * ratio));
  const boxH = Math.round(boxW / ratio);
  useEffect(() => {
    const cv = overlayRef.current;
    if (!cv) return undefined;
    let alive = true;
    const paint = () => {
      if (!alive) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(boxW * dpr);
      cv.height = Math.round(boxH * dpr);
      const x = cv.getContext('2d');
      x.clearRect(0, 0, cv.width, cv.height);
      drawMemeText(x, text, cv.width, cv.height, pos);
    };
    paint();
    ensureMemeFont().then(paint);
    return () => { alive = false; };
  }, [text, pos, boxW, boxH, !!result, !!src]);
  const make = async () => {
    if (!out || busy || !src) return;
    const signal = { stopped: false };
    signalRef.current = signal;
    setBusy(true); setPct(0); setErr('');
    try {
      if (!(await animPack()) || !window.ZANIM) throw new Error('pack');
      await ensureMemeFont();
      let scale = 1;
      let done = null;
      for (let attempt = 0; attempt < 3 && !done; attempt++) {
        const W = Math.max(2, Math.round((out.w * scale) / 2) * 2);
        const H = Math.max(2, Math.round((out.h * scale) / 2) * 2);
        const cv = document.createElement('canvas');
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext('2d', { willReadFrequently: true });
        const enc = window.ZANIM.gifEncoder({ w: W, h: H, dither: true });
        const delays = [];
        if (src.kind === 'video') {
          const v = vidRef.current;
          if (!v) throw new Error('video');
          holdRef.current = true;
          v.pause();
          const s = trimRef.current.start;
          const n = Math.max(2, Math.round(trimRef.current.len * 10));
          for (let i = 0; i < n; i++) {
            if (signal.stopped) { enc.cancel(); return; }
            await animSeek(v, Math.min(s + i * 0.1, dur - 0.02));
            coverDraw(ctx, v, v.videoWidth, v.videoHeight, W, H);
            drawMemeText(ctx, text, W, H, pos);
            enc.add(ctx.getImageData(0, 0, W, H));
            delays.push(100);
            setPct(((i + 1) / n) * 0.6);
          }
        } else {
          for (let i = 0; i < src.items.length; i++) {
            if (signal.stopped) { enc.cancel(); return; }
            let im = null;
            try { im = await loadImageElement(src.items[i].url); } catch {}
            if (!im) continue;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);
            coverDraw(ctx, im, im.naturalWidth, im.naturalHeight, W, H);
            drawMemeText(ctx, text, W, H, pos);
            enc.add(ctx.getImageData(0, 0, W, H));
            delays.push(ms);
            setPct(((i + 1) / src.items.length) * 0.6);
          }
        }
        if (!delays.length) throw new Error('empty');
        const blob = await enc.finish(delays, (p) => setPct(0.6 + p * 0.4));
        if (signal.stopped) return;
        if (blob.size <= GIF_MAX_BYTES || attempt === 2) done = { blob, w: W, h: H, secs: delays.reduce((a, b) => a + b, 0) / 1000 };
        else scale *= Math.max(0.5, Math.sqrt(GIF_MAX_BYTES / blob.size) * 0.9);
      }
      if (!done) return;
      if (done.blob.size > GIF_MAX_BYTES * 1.3) { holdRef.current = false; setBusy(false); setErr('That GIF came out too big. Try a shorter part or fewer photos.'); return; }
      setResult({ ...done, url: keepUrl(URL.createObjectURL(done.blob)) });
      holdRef.current = false;
      setBusy(false);
      playUiSound('pop');
    } catch {
      if (signal.stopped) return;
      holdRef.current = false;
      setBusy(false);
      setErr('Your GIF could not be made on this device. Try another clip.');
    }
  };
  const send = () => { if (!result) return; hapticTap(); onSend({ file: new File([result.blob], `zchat-${Date.now()}.gif`, { type: 'image/gif' }), w: result.w, h: result.h }); };
  const pill = { height: 46, borderRadius: 23, border: 'none', outline: 'none', padding: '0 18px', background: 'rgba(255,255,255,0.12)', color: 'white', fontFamily: FONT, fontSize: 16, minWidth: 0 };
  const choice = (k, icon, title, sub, onTap) => (
    <div key={k} role="button" aria-label={title} onClick={onTap} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>{sub}</div>
      </div>
      <ChevronRight size={18} color="rgba(255,255,255,0.45)" />
    </div>
  );
  const kb = result ? `${formatBytes(result.blob.size)}, ${Math.round(result.secs * 10) / 10} ${result.secs === 1 ? 'second' : 'seconds'}` : '';
  return (
    <Portal>
      <div className="zchat-fade" role="dialog" aria-label="Make a GIF" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 420, background: '#0E0C14', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px' }}>
          <div role="button" aria-label={src ? 'Back' : 'Close GIF maker'} onClick={() => (busy ? stop() : result ? setResult(null) : src ? dropSrc() : onClose())} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{src ? <ArrowLeft size={23} /> : <X size={24} />}</div>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>{result ? 'Your GIF' : 'Make a GIF'}</div>
          {result && <div role="button" aria-label="Save GIF" onClick={() => silentDownload(result.url, 'zchat.gif')} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download size={21} /></div>}
        </div>
        {!src ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12, padding: '0 16px calc(24px + env(safe-area-inset-bottom))', maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            {choice('video', <VideoIcon size={22} />, 'From a video', `Pick up to ${GIF_MAX_SECS} seconds`, () => videoInRef.current && videoInRef.current.click())}
            {choice('photos', <ImageIcon size={22} />, 'From photos', `Up to ${GIF_MAX_PHOTOS}, shown one after another`, () => photoInRef.current && photoInRef.current.click())}
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
              <div style={{ position: 'relative', width: boxW, height: boxH, borderRadius: 16, overflow: 'hidden', background: '#000' }}>
                {result ? <img src={result.url} alt="Your GIF" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
                  : src.kind === 'video' ? <video ref={vidRef} src={src.url} muted playsInline preload="auto" onLoadedMetadata={onMeta} onError={() => setErr('That video could not be opened. Try another one.')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: nat ? 1 : 0 }} />
                    : <img src={src.items[Math.min(slide, src.items.length - 1)].url} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                {!result && <canvas ref={overlayRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />}
                {!nat && !err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>}
                {busy && <MakerRing pct={pct} label="Making your GIF" />}
              </div>
            </div>
            <div style={{ padding: '6px 14px calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
              {err && <div role="alert" style={{ fontSize: 13.5, fontWeight: 700, color: '#FF8A8A', textAlign: 'center' }}>{err}</div>}
              {result ? (
                <>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center' }}>{kb}</div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div role="button" aria-label="Change it" onClick={() => setResult(null)} className="zchat-press" style={{ flex: 1, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Change it</div>
                    <BigButton label="Send GIF" onClick={send} style={{ flex: 1.4, height: 52, borderRadius: 16 }} />
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: busy ? 0.45 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
                  {src.kind === 'video' && dur > 0 && (
                    <ClipTrim src={src.url} dur={dur} start={start} len={len} maxLen={GIF_MAX_SECS} hint={`Drag to pick up to ${GIF_MAX_SECS} seconds`}
                      onChange={(s, l) => { setStart(s); setLen(l); }}
                      onSeek={(t) => { holdRef.current = true; const v = vidRef.current; if (v) { try { v.pause(); v.currentTime = t; } catch {} } }}
                      onDone={() => { holdRef.current = false; }} />
                  )}
                  {src.kind === 'photos' && (
                    <>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px 0' }}>
                        {src.items.map((it, i) => (
                          <div key={it.id} style={{ position: 'relative', width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, boxShadow: i === slide ? '0 0 0 2px #FFFFFF' : 'none' }}>
                            <img src={it.url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div role="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removePhoto(it.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={11} color="white" /></div>
                          </div>
                        ))}
                      </div>
                      <StudioDark><SegmentedControl value={speed} onChange={(v) => { hapticTap(); setSpeed(v); }} options={GIF_SPEEDS.map(([k, l]) => [k, l])} /></StudioDark>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} placeholder="Add text" aria-label="GIF text" maxLength={60} enterKeyHint="done" style={{ ...pill, flex: 1 }} />
                    <StudioDark><SegmentedControl dense value={pos} onChange={(v) => { hapticTap(); setPos(v); }} options={[['top', 'Top'], ['bottom', 'Bottom']]} style={{ width: 132 }} /></StudioDark>
                  </div>
                  <BigButton label={busy ? 'Making your GIF' : 'Make GIF'} disabled={!out || busy || (!!err && !nat)} onClick={make} style={{ height: 52, borderRadius: 16 }} />
                </div>
              )}
            </div>
          </>
        )}
        <input ref={videoInRef} type="file" accept="video/*" style={{ display: 'none' }} data-testid="gif-video-file" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; pickVideo(f); }} />
        <input ref={photoInRef} type="file" accept="image/*" multiple style={{ display: 'none' }} data-testid="gif-photo-files" onChange={(e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; pickPhotos(fs); }} />
      </div>
    </Portal>
  );
}
function RotatePageIcon({ size = 20, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
      <path d="M19.5 4v4.5H15" />
    </svg>
  );
}
const SCAN_MODES = [['color', 'Colour'], ['bw', 'Black and white']];
function scanDefaultQuad(w, h) {
  const mx = w * 0.08;
  const my = h * 0.08;
  return [[mx, my], [w - mx, my], [w - mx, h - my], [mx, h - my]];
}
function scanThumb(cv, side) {
  const s = side / Math.max(cv.width, cv.height);
  const t = document.createElement('canvas');
  t.width = Math.max(1, Math.round(cv.width * s));
  t.height = Math.max(1, Math.round(cv.height * s));
  t.getContext('2d').drawImage(cv, 0, 0, t.width, t.height);
  return t.toDataURL('image/jpeg', 0.8);
}
function scanBlobUrl(cv, q) {
  return new Promise((res) => {
    try { cv.toBlob((b) => res(b ? URL.createObjectURL(b) : cv.toDataURL('image/jpeg', q)), 'image/jpeg', q); } catch { res(cv.toDataURL('image/jpeg', q)); }
  });
}
function scanDropUrl(u) { if (typeof u === 'string' && u.indexOf('blob:') === 0) { try { URL.revokeObjectURL(u); } catch {} } }
function ScanCorners({ shot, onChange }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [drag, setDrag] = useState(-1);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
    return () => { if (ro) ro.disconnect(); };
  }, []);
  const W = shot.canvas.width;
  const H = shot.canvas.height;
  const s = box.w && box.h ? Math.min((box.w - 36) / W, (box.h - 36) / H) : 0;
  const x0 = (box.w - W * s) / 2;
  const y0 = (box.h - H * s) / 2;
  const q = shot.quad;
  const toImg = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return [Math.max(0, Math.min(W, (e.clientX - r.left - x0) / s)), Math.max(0, Math.min(H, (e.clientY - r.top - y0) / s))];
  };
  const down = (i) => (e) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDrag(i); hapticTap(); };
  const move = (i) => (e) => { if (drag !== i || !s) return; const p = toImg(e); onChange(q.map((pt, k) => (k === i ? p : pt))); };
  const up = () => setDrag(-1);
  const pts = q.map(([x, y]) => [x0 + x * s, y0 + y * s]);
  const loupe = drag >= 0 ? pts[drag] : null;
  const L = 96;
  const zoom = 2.4;
  return (
    <div ref={boxRef} style={{ position: 'relative', flex: 1, minHeight: 0, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
      {s > 0 && (
        <>
          <img src={shot.url} alt="Your photo of the page" draggable={false} style={{ position: 'absolute', left: x0, top: y0, width: W * s, height: H * s, display: 'block', pointerEvents: 'none' }} />
          <svg width={box.w} height={box.h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
            <path d={`M0 0H${box.w}V${box.h}H0Z M${pts.map((p) => p.join(' ')).join(' L')} Z`} fill="rgba(0, 0, 0, 0.45)" fillRule="evenodd" />
            <polygon points={pts.map((p) => p.join(',')).join(' ')} fill="rgba(29,123,240,0.12)" stroke="#6FB0F7" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          {pts.map(([x, y], i) => (
            <div key={i} role="slider" aria-label={['Top left corner', 'Top right corner', 'Bottom right corner', 'Bottom left corner'][i]} aria-valuenow={Math.round(q[i][0])} tabIndex={0}
              onPointerDown={down(i)} onPointerMove={move(i)} onPointerUp={up} onPointerCancel={up}
              style={{ position: 'absolute', left: x - 24, top: y - 24, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', touchAction: 'none' }}>
              <div style={{ width: drag === i ? 26 : 22, height: drag === i ? 26 : 22, borderRadius: '50%', background: 'rgba(29,123,240,0.28)', border: '2.5px solid #FFFFFF', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)', transition: 'width 120ms ease, height 120ms ease' }} />
            </div>
          ))}
          {loupe && (
            <div aria-hidden="true" style={{ position: 'absolute', left: Math.max(4, Math.min(box.w - L - 4, loupe[0] - L / 2)), top: loupe[1] - L - 40 < 4 ? loupe[1] + 40 : loupe[1] - L - 40, width: L, height: L, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #FFFFFF', boxShadow: '0 6px 18px rgba(0, 0, 0, 0.5)', pointerEvents: 'none',
              backgroundImage: `url(${shot.url})`, backgroundRepeat: 'no-repeat', backgroundSize: `${W * s * zoom}px ${H * s * zoom}px`, backgroundPosition: `${L / 2 - (loupe[0] - x0) * zoom}px ${L / 2 - (loupe[1] - y0) * zoom}px`, backgroundColor: '#000' }}>
              <div style={{ position: 'absolute', left: L / 2 - 8, top: L / 2 - 0.75, width: 16, height: 1.5, background: '#6FB0F7' }} />
              <div style={{ position: 'absolute', left: L / 2 - 0.75, top: L / 2 - 8, width: 1.5, height: 16, background: '#6FB0F7' }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
export function DocScanner({ onClose, onSend }) {
  const [stage, setStage] = useState('camera');
  const [pages, setPages] = useState([]);
  const [cur, setCur] = useState(0);
  const [shot, setShot] = useState(null);
  const [camErr, setCamErr] = useState('');
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [packOk, setPackOk] = useState(null);
  const [flash, setFlash] = useState(false);
  const [askClose, setAskClose] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);
  const smoothRef = useRef(null);
  const urlsRef = useRef(new Set());
  const keepUrl = (u) => { urlsRef.current.add(u); return u; };
  const dropUrl = (u) => { setTimeout(() => { if (urlsRef.current.delete(u)) scanDropUrl(u); }, 1500); };
  useEffect(() => () => { const gone = [...urlsRef.current]; urlsRef.current.clear(); setTimeout(() => gone.forEach(scanDropUrl), 1500); }, []);
  const leave = () => { if (pages.length) setAskClose(true); else onClose(); };
  useBackClose(true, () => {
    if (busy) return;
    if (stage === 'adjust') { setShot(null); setStage(pages.length ? 'review' : 'camera'); return; }
    if (stage === 'camera' && pages.length) { setStage('review'); return; }
    leave();
  });
  useEffect(() => { let alive = true; aipPack().then((ok) => { if (alive) setPackOk(!!ok); }); return () => { alive = false; }; }, []);
  const stopCam = () => { const st = streamRef.current; streamRef.current = null; if (st) st.getTracks().forEach((t) => t.stop()); };
  useEffect(() => {
    if (stage !== 'camera') return undefined;
    let cancelled = false;
    setReady(false);
    (async () => {
      const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
      if (!md || !md.getUserMedia) { setCamErr('This browser cannot open the camera. Pick a photo of the page instead.'); return; }
      try {
        const stream = await md.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; v.play().catch(() => {}); }
        setCamErr('');
        setReady(true);
      } catch {
        if (!cancelled) setCamErr('Allow camera access to scan, or pick a photo of the page.');
      }
    })();
    return () => { cancelled = true; stopCam(); setLive(null); smoothRef.current = null; };
  }, [stage]);
  useEffect(() => {
    if (stage !== 'camera' || !ready || !packOk) return undefined;
    let alive = true;
    let timer = 0;
    const cv = document.createElement('canvas');
    const tick = () => {
      if (!alive) return;
      const v = videoRef.current;
      if (v && v.videoWidth && !document.hidden && window.ZAIP) {
        const k = 240 / Math.max(v.videoWidth, v.videoHeight);
        cv.width = Math.round(v.videoWidth * k);
        cv.height = Math.round(v.videoHeight * k);
        try {
          cv.getContext('2d').drawImage(v, 0, 0, cv.width, cv.height);
          const r = window.ZAIP.findPage(cv);
          const q = r ? r.quad.map(([x, y]) => [x / k, y / k]) : null;
          const prev = smoothRef.current;
          const diag = Math.hypot(v.videoWidth, v.videoHeight);
          const next = q && prev && q.every((p, i) => Math.hypot(p[0] - prev[i][0], p[1] - prev[i][1]) < diag * 0.08) ? q.map((p, i) => [prev[i][0] * 0.55 + p[0] * 0.45, prev[i][1] * 0.55 + p[1] * 0.45]) : q;
          smoothRef.current = next;
          setLive(next ? { quad: next, w: v.videoWidth, h: v.videoHeight } : null);
        } catch {}
      }
      timer = setTimeout(tick, 300);
    };
    tick();
    return () => { alive = false; clearTimeout(timer); };
  }, [stage, ready, packOk]);
  const openShot = async (canvas, hint) => {
    let quad = hint;
    if (!quad && window.ZAIP) { try { const r = window.ZAIP.findPage(canvas); quad = r ? r.quad : null; } catch {} }
    const url = keepUrl(await scanBlobUrl(canvas, 0.86));
    setShot((old) => { if (old) dropUrl(old.url); return { canvas, quad: quad || scanDefaultQuad(canvas.width, canvas.height), found: !!quad, url }; });
    setNote('');
    setStage('adjust');
  };
  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    playUiSound('shutter');
    setFlash(true);
    setTimeout(() => setFlash(false), 140);
    openShot(c, smoothRef.current);
  };
  const pickFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f || busy) return;
    setBusy('Finding the page');
    await new Promise((r) => { requestAnimationFrame(() => setTimeout(r, 0)); setTimeout(r, 80); });
    const url = URL.createObjectURL(f);
    try {
      const img = await loadImageElement(url);
      const k = Math.min(1, 2600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      if (!window.ZAIP) await aipPack();
      await openShot(c, null);
    } catch {
      setNote('That photo could not be opened. Try another one.');
    } finally { URL.revokeObjectURL(url); setBusy(''); }
  };
  const keep = async () => {
    if (!shot || busy) return;
    setBusy('Straightening the page');
    await new Promise((r) => setTimeout(r, 40));
    try {
      if (!window.ZAIP && !(await aipPack())) throw new Error('pack');
      const mode = pages.length ? pages[pages.length - 1].mode : 'color';
      const flat = window.ZAIP.warp(shot.canvas, shot.quad, 1800);
      if (!flat) throw new Error('warp');
      const out = window.ZAIP.clean(flat, mode);
      const page = { id: `${Date.now()}`, flat, out, mode, view: keepUrl(await scanBlobUrl(out, 0.82)), thumb: scanThumb(out, 160) };
      setCur(pages.length);
      setPages((list) => [...list, page]);
      dropUrl(shot.url);
      setShot(null);
      setStage('review');
      hapticTap();
    } catch {
      setNote(window.ZAIP ? 'That page could not be straightened. Move the corners and try again.' : 'The scanner did not load. Check your connection and try again.');
    }
    setBusy('');
  };
  const setMode = async (m) => {
    const p = pages[cur];
    if (!p || p.mode === m || busy) return;
    hapticTap();
    setBusy('Cleaning up');
    await new Promise((r) => setTimeout(r, 30));
    try {
      const out = window.ZAIP.clean(p.flat, m);
      const view = keepUrl(await scanBlobUrl(out, 0.82));
      dropUrl(p.view);
      setPages((list) => list.map((x) => (x.id === p.id ? { ...x, out, mode: m, view, thumb: scanThumb(out, 160) } : x)));
    } catch {}
    setBusy('');
  };
  const turnPage = async () => {
    const p = pages[cur];
    if (!p || busy || !window.ZAIP) return;
    hapticTap();
    const flat = window.ZAIP.rotate(p.flat);
    const out = window.ZAIP.rotate(p.out);
    const view = keepUrl(await scanBlobUrl(out, 0.82));
    dropUrl(p.view);
    setPages((list) => list.map((x) => (x.id === p.id ? { ...x, flat, out, view, thumb: scanThumb(out, 160) } : x)));
  };
  const dropPage = () => {
    const p = pages[cur];
    if (!p) return;
    playUiSound('delete');
    const next = pages.filter((x) => x.id !== p.id);
    dropUrl(p.view);
    setPages(next);
    setCur(Math.max(0, Math.min(cur, next.length - 1)));
    if (!next.length) setStage('camera');
  };
  const send = async () => {
    if (!pages.length || busy) return;
    setBusy('Making your PDF');
    await new Promise((r) => setTimeout(r, 30));
    try {
      const list = [];
      for (const p of pages) {
        const bytes = await new Promise((res, rej) => p.out.toBlob((b) => (b ? b.arrayBuffer().then((ab) => res(new Uint8Array(ab)), rej) : rej(new Error('jpeg'))), 'image/jpeg', p.mode === 'bw' ? 0.72 : 0.8));
        list.push({ bytes, w: p.out.width, h: p.out.height });
      }
      const name = `Scan ${fmtDate(new Date(), { day: 'numeric', month: 'short', year: 'numeric' })}`.replace(/[\\/:*?"<>|]/g, ' ').trim();
      const blob = window.ZAIP.pdf(list, name);
      onSend(new File([blob], `${name}.pdf`, { type: 'application/pdf' }), list.length);
    } catch {
      setBusy('');
      setNote('The PDF could not be made. Try again.');
    }
  };
  const page = pages[cur] || null;
  const vw = live ? live.w : 1;
  const vh = live ? live.h : 1;
  const bar = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 'calc(12px + env(safe-area-inset-top)) 14px 8px', position: 'relative', zIndex: 2 };
  const n = pages.length;
  return (
    <Portal>
      <div className="zchat-fade" role="dialog" aria-label="Scan a document" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 520, background: '#000', color: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: FONT, overflow: 'hidden' }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} data-testid="scan-file" onChange={pickFile} />
        {stage === 'camera' && (
          <>
            <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: camErr ? 'none' : 'block' }} />
            {live && !camErr && (
              <svg viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} aria-hidden="true">
                <polygon points={live.quad.map((p) => p.join(',')).join(' ')} fill="rgba(29,123,240,0.16)" stroke="#6FB0F7" strokeWidth={Math.max(vw, vh) / 260} strokeLinejoin="round" style={{ transition: 'all 260ms ease-out' }} />
              </svg>
            )}
            {flash && <div style={{ position: 'absolute', inset: 0, background: '#FFFFFF', opacity: 0.8 }} />}
            <div style={bar}>
              <ViewerButton label="Close" onClick={() => (n ? setStage('review') : onClose())}><X size={25} strokeWidth={2.6} /></ViewerButton>
              <div style={{ fontWeight: 800, fontSize: 15.5, textShadow: '0 1px 6px rgba(0, 0, 0, 0.6)' }}>Scan a document</div>
              <div style={{ width: 46 }} />
            </div>
            {camErr && (
              <div style={{ position: 'relative', margin: 'auto', padding: 28, textAlign: 'center', maxWidth: 340 }}>
                <div style={{ display: 'flex', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.8)', marginBottom: 14 }}><ScanDocIcon size={44} strokeWidth={1.4} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 18 }}>{camErr}</div>
                <BigButton label="Pick a photo" onClick={() => fileRef.current && fileRef.current.click()} />
              </div>
            )}
            {!camErr && <div style={{ flex: 1 }} />}
            {!camErr && (
              <>
                <div role="status" style={{ position: 'relative', textAlign: 'center', fontSize: 13, fontWeight: 600, opacity: 0.9, marginBottom: 14, textShadow: '0 1px 6px rgba(0, 0, 0, 0.6)' }}>{!ready ? 'Opening the camera' : live ? 'Page found. Hold still and tap the button.' : 'Fit the whole page in view'}</div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 24px', paddingBottom: 'calc(30px + env(safe-area-inset-bottom))' }}>
                  <div role="button" aria-label="Pick a photo" onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0, 0, 0, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ImageIcon size={22} /></div>
                  <div role="button" aria-label="Take the scan" onClick={capture} style={{ position: 'relative', width: 78, height: 78, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '5px solid #FFFFFF' }} />
                    <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: '#FFFFFF' }} />
                  </div>
                  {n ? (
                    <div role="button" aria-label={`Done, ${n === 1 ? '1 page' : `${n} pages`}`} onClick={() => setStage('review')} style={{ position: 'relative', width: 48, height: 48, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 0 0 2px #FFFFFF' }}>
                      <img src={pages[n - 1].thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <span style={{ position: 'absolute', right: 2, bottom: 2, minWidth: 18, height: 18, borderRadius: 9, background: '#1D7BF0', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxSizing: 'border-box' }}>{n}</span>
                    </div>
                  ) : <div style={{ width: 48, height: 48 }} />}
                </div>
              </>
            )}
          </>
        )}
        {stage === 'adjust' && shot && (
          <>
            <div style={bar}>
              <span role="button" aria-label="Retake" onClick={() => { dropUrl(shot.url); setShot(null); setStage('camera'); }} style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '8px 4px', minWidth: 64 }}>Retake</span>
              <div style={{ fontWeight: 800, fontSize: 15.5 }}>Fit the corners</div>
              <span style={{ minWidth: 64 }} />
            </div>
            <ScanCorners shot={shot} onChange={(quad) => setShot((sh) => (sh ? { ...sh, quad } : sh))} />
            <div style={{ padding: '8px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 520, margin: '0 auto', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.65)', textAlign: 'center' }}>{shot.found ? 'Drag a corner if the edges are not quite right' : 'Drag the corners to the edges of the page'}</div>
              {note && <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: '#FF8A8A', textAlign: 'center' }}>{note}</div>}
              <BigButton label="Keep scan" onClick={keep} disabled={!!busy} style={{ height: 50, borderRadius: 16 }} />
            </div>
          </>
        )}
        {stage === 'review' && page && (
          <>
            <div style={bar}>
              <ViewerButton label="Close" onClick={leave}><X size={25} strokeWidth={2.6} /></ViewerButton>
              <div style={{ fontWeight: 800, fontSize: 15.5 }}>{n === 1 ? '1 page' : `Page ${cur + 1} of ${n}`}</div>
              <ViewerButton label="Remove this page" onClick={dropPage}><Trash2 size={20} /></ViewerButton>
            </div>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 18px' }}>
              <img src={page.view} alt={`Scanned page ${cur + 1}`} draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)', background: '#FFFFFF' }} />
            </div>
            <div style={{ padding: '10px 16px 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 520, margin: '0 auto', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}><StudioDark><SegmentedControl value={page.mode} onChange={setMode} options={SCAN_MODES} /></StudioDark></div>
                <div role="button" aria-label="Turn the page" onClick={turnPage} className="zchat-press" style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255, 255, 255, 0.1)', color: '#FFFFFF' }}><RotatePageIcon size={19} /></div>
              </div>
              <div role="list" aria-label="Pages" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', padding: '2px 2px 4px' }}>
                {pages.map((p, i) => (
                  <div key={p.id} role="listitem" aria-label={`Page ${i + 1}`} aria-current={i === cur ? 'true' : undefined} onClick={() => { hapticTap(); setCur(i); }}
                    style={{ position: 'relative', width: 46, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', boxShadow: i === cur ? '0 0 0 2px #000, 0 0 0 4px #A895FF' : 'inset 0 0 0 1px rgba(255, 255, 255, 0.2)', background: '#FFFFFF' }}>
                    <img src={p.thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <span style={{ position: 'absolute', left: 3, bottom: 3, fontSize: 10, fontWeight: 800, color: '#111', background: 'rgba(255, 255, 255, 0.85)', borderRadius: 4, padding: '0 3px' }}>{i + 1}</span>
                  </div>
                ))}
                {n < 20 && (
                  <div role="button" aria-label="Add a page" onClick={() => { hapticTap(); setStage('camera'); }} style={{ width: 46, height: 60, borderRadius: 8, flexShrink: 0, cursor: 'pointer', border: '1.5px dashed rgba(255, 255, 255, 0.4)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255, 255, 255, 0.85)' }}><Plus size={20} /></div>
                )}
              </div>
              {note && <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: '#FF8A8A', textAlign: 'center' }}>{note}</div>}
              <BigButton label={n === 1 ? 'Send PDF' : `Send PDF, ${n} pages`} onClick={send} disabled={!!busy} style={{ height: 50, borderRadius: 16 }} />
            </div>
          </>
        )}
        {askClose && <ConfirmSheet title="Discard this scan?" text={n === 1 ? 'The page you scanned is not saved anywhere.' : `The ${n} pages you scanned are not saved anywhere.`} confirmLabel="Discard" onConfirm={() => { setAskClose(false); onClose(); }} onCancel={() => setAskClose(false)} zIndex={30} />}
        {busy && (
          <div role="status" className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(0, 0, 0, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 20, background: 'rgba(24, 24, 27, 0.9)', fontSize: 14.5, fontWeight: 700 }}><Spinner size={16} />{busy}</div>
          </div>
        )}
      </div>
    </Portal>
  );
}
