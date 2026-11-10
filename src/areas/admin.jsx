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
  ANIM_PACKS,
  ANIM_STICKERS,
  Avatar,
  BigButton,
  CHAR_BUBBLES,
  CHAR_BUBBLE_KEYS,
  CHAT_THEMES,
  CUSTOM_BADGES,
  CX_KINDS,
  ChoiceList,
  CoinIcon,
  DECOR_ALL,
  DECOR_DROPS,
  DECOR_SETS,
  DECOR_SI_SHEET,
  DECOR_SPRITE,
  DecorFrameBadge,
  DecorPlateOnly,
  FONT,
  IgRow,
  IgToggle,
  IgTopBar,
  MediaImg,
  NS_KEYS,
  NameBadge,
  PROFILE_COLS,
  ProfileDecorHero,
  RARITY_STYLE,
  SI_SOUND_PACKS,
  SI_STICKER_PACKS,
  SOUND_SPRITES,
  SUPER_KEYS,
  SUPER_REACTS,
  SegmentedControl,
  Spinner,
  THEME_KEYS,
  TradeArt,
  VERIFIED_TIERS,
  VerifiedBadge,
  WELCOME_PHOTO,
  adminDate,
  adminWalletMem,
  adminWords,
  copyTextToClipboard,
  countWord,
  cxFlag,
  cxSpec,
  cxWord,
  dropPhase,
  fmtDate,
  formatCount,
  friendlyError,
  hapticTap,
  igPalette,
  inputStyle,
  isDecorKey,
  kitOnInk,
  playUiSound,
  primaryBtn,
  reducedMotion,
  rewardActive,
  rpcMissing,
  sanitizeAvatarList,
  siStickerIcon,
  useBackClose,
  useTheme,
  walletKeep,
  walletMem,
  walletShow,
} from '../App.jsx';
import {
  AdminStatus,
  AdminTextBtn,
  ChoiceSheet,
  FX_ART,
  FX_PACK_SI,
  GiftBoxIcon,
  GiftCodeIcon,
  KitSection,
  KitTabs,
  MediaVideo,
  adminHair,
  appFileOk,
  coinTakenBack,
  dropArtMem,
  dropArtReady,
  giftCodeGroups,
  giftCodeWhat,
  loadDrops,
  localInputValue,
} from './shared.jsx';
import { AdminHealth, AdminPhotoFlags } from './launch.jsx';


function appFileList() {
  const out = [];
  const add = (group, url) => { if (url && !out.some((x) => x.url === url)) out.push({ group, url }); };
  DECOR_ALL.forEach((st) => { add(st.name, `/set-${st.file}-frame.webp`); add(st.name, `/set-${st.file}-plate.webp`); });
  add('Set pictures', DECOR_SPRITE);
  add('Profile effects', '/fx-pack.js');
  add('Profile effects', '/fx-pack2.js');
  siAppFiles(add);
  Object.values(FX_ART).forEach((u) => add('Profile effects', u));
  add('Profile themes', '/theme-pack.js');
  add('Super reactions', '/react-pack.js');
  Object.values(SOUND_SPRITES).forEach((sp) => add('Sounds', sp.url));
  add('Login photo', WELCOME_PHOTO);
  Object.values(CUSTOM_BADGES).forEach((b) => add('Charms', b.file));
  CHAT_THEMES.forEach((th) => { if (th.file) add('Chat themes', th.file); });
  ANIM_PACKS.forEach((p) => add('Stickers', p.icon));
  ANIM_STICKERS.forEach((s) => add('Stickers', s.file));
  ['/icon-192.png', '/badge-192.png', '/bot-avatar.jpg', '/manifest.json', '/sw.js'].forEach((u) => add('App', u));
  return out;
}
function AdminFiles() {
  const { theme } = useTheme();
  const [list] = useState(() => appFileList());
  const [state, setState] = useState({ done: 0, missing: [], offline: 0, running: true });
  const run = async () => {
    setState({ done: 0, missing: [], offline: 0, running: true });
    const missing = [];
    let offline = 0;
    let at = 0;
    let done = 0;
    const lane = async () => {
      while (at < list.length) {
        const it = list[at];
        at += 1;
        const ok = await appFileOk(it.url);
        if (ok === false) missing.push(it);
        if (ok === null) offline += 1;
        done += 1;
        setState({ done, missing: missing.slice(), offline, running: true });
      }
    };
    await Promise.all([lane(), lane(), lane(), lane()]);
    setState({ done, missing: missing.slice(), offline, running: false });
  };
  useEffect(() => { run(); }, []);
  const card = { padding: '13px 0', boxShadow: `inset 0 -0.5px 0 ${theme.hair}` };
  const groups = [...new Set(state.missing.map((m) => m.group))];
  return (
    <div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText size={18} color={theme.coral} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: theme.ink }}>App files</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{state.running ? `Checking ${state.done} of ${list.length}` : `Checked ${list.length} files on the site`}</div>
        </div>
        {!state.running && <div role="button" onClick={run} style={{ fontSize: 12.5, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Check again</div>}
      </div>
      {!state.running && state.offline > 0 && <div style={{ ...card, fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{state.offline} files could not be checked. Check your connection and try again.</div>}
      {!state.running && state.missing.length === 0 && state.offline === 0 && (
        <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCheck size={20} color={theme.teal} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>Every file the app needs is on the site.</div>
        </div>
      )}
      {state.missing.length > 0 && (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 14.5, color: theme.danger }}>{state.missing.length === 1 ? '1 file is missing' : `${state.missing.length} files are missing`}</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 4, lineHeight: 1.5 }}>Upload these into the public folder on GitHub. They show up after the next deploy.</div>
          {groups.map((gname) => (
            <div key={gname} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: theme.muted }}>{gname}</div>
              {state.missing.filter((m) => m.group === gname).map((m) => (
                <div key={m.url} style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink, padding: '5px 0', wordBreak: 'break-all', userSelect: 'text', WebkitUserSelect: 'text' }}>{m.url.slice(1)}</div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminErrors() {
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    setErr('');
    const { data, error } = await supabase.from('client_errors').select('*').order('created_at', { ascending: false }).limit(300);
    if (error) { setRows([]); setErr('Crash reports switch on once the latest ZChat setup is finished.'); return; }
    setRows(data || []);
  };
  useEffect(() => { load(); }, []);
  const groupsList = (() => {
    const map = new Map();
    (rows || []).forEach((r) => {
      const k = String(r.message || '').slice(0, 160);
      const g = map.get(k) || { key: k, message: r.message, count: 0, last: r.created_at, versions: new Set(), people: new Set(), sample: r };
      g.count += 1;
      if (r.version) g.versions.add(r.version);
      if (r.user_id) g.people.add(r.user_id);
      map.set(k, g);
    });
    return [...map.values()].sort((a, b) => new Date(b.last) - new Date(a.last));
  })();
  const clearAll = async () => {
    if (busy) return;
    setBusy(true);
    await supabase.from('client_errors').delete().gt('id', 0);
    setBusy(false);
    load();
  };
  const card = { padding: '13px 0', boxShadow: `inset 0 -0.5px 0 ${theme.hair}` };
  return (
    <div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Activity size={18} color={theme.coral} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: theme.ink }}>Problems</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{rows === null ? 'Loading' : `${rows.length} in the last 30 days`}</div>
        </div>
        <div role="button" aria-label="Refresh crash reports" onClick={load} style={{ fontSize: 12.5, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Refresh</div>
        {rows && rows.length > 0 && <div role="button" aria-label="Clear crash reports" onClick={clearAll} style={{ fontSize: 12.5, fontWeight: 800, color: theme.danger, cursor: 'pointer', marginLeft: 6 }}>{busy ? 'Clearing' : 'Clear'}</div>}
      </div>
      {err && <div style={{ ...card, fontSize: 13, color: theme.muted }}>{err}</div>}
      {rows && !rows.length && !err && <div style={{ ...card, fontSize: 13, color: theme.muted }}>No crashes reported. Nice.</div>}
      {[['Pages that did not load', groupsList.filter((g) => /^Did not load/.test(String(g.message || '')))], ['Crashes', groupsList.filter((g) => !/^Did not load/.test(String(g.message || '')))]].filter(([, list]) => list.length > 0).map(([head, list]) => (
        <div key={head}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0 4px' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: theme.muted }}>{head}</span>
            <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: head === 'Crashes' ? theme.soft : theme.danger, color: head === 'Crashes' ? theme.ink : '#FFFFFF', fontSize: 11.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>{list.reduce((n, g) => n + g.count, 0)}</span>
          </div>
          {list.map((g) => (
        <div key={g.key} style={card}>
          <div role="button" onClick={() => setOpen(open === g.key ? null : g.key)} style={{ cursor: 'pointer' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: theme.ink, wordBreak: 'break-word', lineHeight: 1.4 }}>{g.message}</div>
            <div style={{ fontSize: 11.5, color: theme.muted, marginTop: 5 }}>{`${g.count} ${g.count === 1 ? 'time' : 'times'}, ${g.people.size} ${g.people.size === 1 ? 'person' : 'people'}, ${[...g.versions].slice(0, 3).join(', ') || 'no version'}, ${adminDate(g.last)}`}</div>
          </div>
          {open === g.key && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: theme.muted, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, Menlo, monospace', maxHeight: 260, overflowY: 'auto', background: theme.panelBg, borderRadius: 12, padding: 10 }}>
              {`${g.sample.url || ''}\n${g.sample.ua || ''}\n\n${g.sample.stack || 'No stack'}`}
            </div>
          )}
        </div>
      ))}
        </div>
      ))}
    </div>
  );
}
const DECOR_FRAME_CATALOG = Object.fromEntries(DECOR_ALL.map((s) => [s.key, { label: `${s.name} frame`, rarity: s.rarity }]));
const DECOR_PLATE_CATALOG = Object.fromEntries(DECOR_ALL.map((s) => [s.key, { label: `${s.name} nameplate`, rarity: s.rarity }]));
const DECOR_EFFECT_CATALOG = Object.fromEntries(DECOR_ALL.map((s) => [s.key, { label: `${s.name} effect`, rarity: s.rarity }]));
function siAppFiles(add) {
  add('Set pictures', DECOR_SI_SHEET);
  add('Profile effects', FX_PACK_SI);
  SI_STICKER_PACKS.forEach((p) => { add('Sticker packs', siStickerIcon(p.key)); p.list.forEach(([id]) => add('Sticker packs', `/ps-${p.key}-${id}.webp`)); });
  SI_SOUND_PACKS.forEach((p) => add('Sound packs', p.file));
}

function adminLog(action, target, detail) {
  try { Promise.resolve(supabase.rpc('admin_log_action', { p_action: action, p_target: target ? String(target) : null, p_detail: detail || null })).catch(() => {}); } catch {}
}

function AdminSheet({ title, body, confirmLabel, danger, busy, onConfirm, onClose, children }) {
  const { theme } = useTheme();
  useBackClose(true, () => { if (!busy) onClose(); });
  return (
    <div onClick={() => !busy && onClose()} className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 30, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '14px 18px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', maxHeight: '85%', overflowY: 'auto' }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto 14px' }} />
        <div style={{ fontWeight: 900, fontSize: 17, color: theme.ink, marginBottom: 6 }}>{title}</div>
        {body && <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, marginBottom: 14 }}>{body}</div>}
        {children}
        {onConfirm && (
          <button disabled={busy} onClick={onConfirm} style={{ ...primaryBtn(theme, busy), background: danger ? theme.danger : theme.coral, boxShadow: 'none' }}>{busy ? <Spinner /> : confirmLabel}</button>
        )}
        <div onClick={() => !busy && onClose()} style={{ textAlign: 'center', padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
      </div>
    </div>
  );
}
function AdminNote({ text }) {
  const { theme } = useTheme();
  return <div role="status" className="zchat-fade" style={{ padding: '6px 2px 12px', fontSize: 13.5, fontWeight: 600, color: theme.ink, lineHeight: 1.45 }}>{text}</div>;
}

function AdminPeople({ onManage }) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const PAGE = 25;
  const FILTERS = [['all', 'Everyone'], ['new', 'New'], ['banned', 'Banned'], ['paused', 'Paused'], ['verified', 'Badged'], ['bots', 'Bots'], ['private', 'Private']];

  const fetchPage = async (offset) => {
    setLoading(true);
    try {
      let ids = null;
      if (filter === 'paused') {
        const { data: rs } = await supabase.from('user_restrictions').select('user_id').eq('lifted', false).gt('until', new Date().toISOString());
        ids = [...new Set((rs || []).map((r) => r.user_id))];
        if (!ids.length) { setRows([]); setMore(false); setLoading(false); return; }
      }
      let req = supabase.from('profiles').select(PROFILE_COLS).order('created_at', { ascending: false }).range(offset, offset + PAGE - 1);
      const q = query.trim().replace(/[%,()]/g, '');
      if (q) req = req.or(`name.ilike.%${q}%,username.ilike.%${q}%`);
      if (filter === 'banned') req = req.eq('banned', true);
      if (filter === 'verified') req = req.not('verified', 'is', null);
      if (filter === 'bots') req = req.eq('is_bot', true);
      if (filter === 'private') req = req.eq('is_private', true);
      if (filter === 'new') req = req.gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString());
      if (ids) req = req.in('id', ids);
      const { data, error: e } = await req;
      if (e) { setError(friendlyError(e, 'Could not load people.')); setLoading(false); return; }
      setError('');
      const list = sanitizeAvatarList(data || [], '');
      setRows((prev) => (offset === 0 ? list : [...(prev || []), ...list]));
      setMore((data || []).length === PAGE);
    } catch { setError('Could not load people.'); }
    setLoading(false);
  };
  useEffect(() => {
    const t = setTimeout(() => fetchPage(0), 280);
    return () => clearTimeout(t);
  }, [filter, query]);

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 4 }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 14, top: 15 }} />
        <input style={{ ...inputStyle(theme), paddingLeft: 40 }} placeholder="Search name or username" aria-label="Search people" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <KitTabs label="Filter people" value={filter} onChange={setFilter} options={FILTERS} style={{ margin: '0 -16px 6px', padding: '0 8px' }} />
      {error && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '6px 0 10px' }}>{error}</div>}
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
        : rows.length === 0 ? <div style={{ textAlign: 'center', padding: '44px 20px', color: theme.muted, fontSize: 13.5 }}>Nobody matches this.</div>
        : rows.map((p, i) => (
          <div key={p.id} role="button" onClick={() => onManage(p)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '8px 0', cursor: 'pointer', boxShadow: adminHair(theme, i < rows.length - 1) }}>
            <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', flexShrink: 0 }}><Avatar emoji={p.avatar} name={p.name} size={44} /></div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                <VerifiedBadge tier={p.verified} custom={p.custom_badge} size={13} />
              </div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username} {p.created_at ? `joined ${adminDate(p.created_at).split(',')[0]}` : ''}</div>
            </div>
            {p.banned && <AdminStatus tone="danger">Banned</AdminStatus>}
            {p.is_bot && <AdminStatus tone="accent">Bot</AdminStatus>}
            <ChevronRight size={17} color={theme.muted} style={{ flexShrink: 0 }} />
          </div>
        ))}
      {!loading && more && <div role="button" onClick={() => fetchPage(rows.length)} style={{ textAlign: 'center', padding: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Load more</div>}
      {loading && rows && rows.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size={18} color={theme.ink} /></div>}
    </>
  );
}

const ADMIN_CONTENT = {
  posts: { label: 'Posts', who: 'user_id' },
  stories: { label: 'Stories', who: 'user_id' },
  messages: { label: 'Messages', who: 'sender_id' },
  post_comments: { label: 'Comments', who: 'user_id' },
  groups: { label: 'Groups', who: 'created_by' },
};

function AdminContent({ onOpenProfile }) {
  const { theme } = useTheme();
  const [kind, setKind] = useState('posts');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState(null);
  const [people, setPeople] = useState({});
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [delFor, setDelFor] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const PAGE = 20;
  const cfg = ADMIN_CONTENT[kind];

  const fetchPage = async (offset) => {
    setLoading(true);
    const { data, error: e } = await supabase.rpc('admin_table_rows', { p_table: kind, p_search: search.trim(), p_limit: PAGE, p_offset: offset });
    if (e) { setError(friendlyError(e, 'Could not load this. Run the admin SQL first.')); setLoading(false); setRows((prev) => prev || []); return; }
    setError('');
    const list = data || [];
    const ids = [...new Set(list.map((r) => r[cfg.who]).filter(Boolean))].filter((id) => !people[id]);
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge').in('id', ids);
      setPeople((prev) => { const next = { ...prev }; sanitizeAvatarList(profs || [], '').forEach((p) => { next[p.id] = p; }); return next; });
    }
    setRows((prev) => (offset === 0 ? list : [...(prev || []), ...list]));
    setMore(list.length === PAGE);
    setLoading(false);
  };
  useEffect(() => {
    setRows(null);
    const t = setTimeout(() => fetchPage(0), 280);
    return () => clearTimeout(t);
  }, [kind, search]);

  const doDelete = async () => {
    if (!delFor) return;
    setDelBusy(true);
    const { error: e } = await supabase.rpc('admin_delete_content', { p_table: kind, p_id: String(delFor.id) });
    setDelBusy(false);
    if (e) { setError(friendlyError(e, 'Could not delete that.')); setDelFor(null); return; }
    setRows((prev) => (prev || []).filter((r) => r.id !== delFor.id));
    setDelFor(null);
  };

  const media = (r) => {
    if (!r.media_url) return null;
    const isVideo = r.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(r.media_url);
    const st = { width: '100%', maxHeight: 220, borderRadius: 12, objectFit: 'cover', background: '#000', display: 'block', marginTop: 10 };
    return isVideo ? <MediaVideo src={r.media_url} controls playsInline preload="metadata" style={st} /> : <MediaImg live src={r.media_url} style={st} loading="lazy" />;
  };

  return (
    <>
      <KitTabs label="Content type" value={kind} onChange={(k) => { setKind(k); setSearch(''); }} options={Object.entries(ADMIN_CONTENT).map(([k, c]) => [k, c.label])} style={{ margin: '0 -16px 12px', padding: '0 8px' }} />
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 14, top: 15 }} />
        <input style={{ ...inputStyle(theme), paddingLeft: 40 }} placeholder={`Search ${cfg.label.toLowerCase()}`} aria-label={`Search ${cfg.label.toLowerCase()}`} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '6px 0 10px' }}>{error}</div>}
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
        : rows.length === 0 ? <div style={{ textAlign: 'center', padding: '44px 20px', color: theme.muted, fontSize: 13.5 }}>Nothing here.</div>
        : rows.map((r, i) => {
          const who = people[r[cfg.who]];
          const text = kind === 'groups' ? r.name : (r.caption || r.content || '');
          return (
            <div key={r.id} style={{ padding: '12px 0 14px', boxShadow: adminHair(theme, i < rows.length - 1) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {who ? (
                  <div role="button" onClick={() => onOpenProfile(who)} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1, cursor: 'pointer' }}>
                    <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', flexShrink: 0 }}><Avatar emoji={who.avatar} name={who.name} size={34} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{who.name}</div>
                      <div style={{ fontSize: 12, color: theme.muted }}>{adminDate(r.created_at)}</div>
                    </div>
                  </div>
                ) : <div style={{ flex: 1, fontSize: 12.5, color: theme.muted }}>{adminDate(r.created_at)}</div>}
                {kind === 'messages' && <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted, flexShrink: 0 }}>{`${r.type || 'text'}${r.group_id ? ', group' : ''}`}</span>}
                <div role="button" aria-label="Delete" onClick={() => setDelFor(r)} className="zchat-press" style={{ width: 38, height: 38, marginRight: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.danger, flexShrink: 0 }}><Trash2 size={18} strokeWidth={1.8} /></div>
              </div>
              {text ? <div style={{ fontSize: 14, color: theme.ink, marginTop: 8, lineHeight: 1.45, wordBreak: 'break-word' }}>{r.deleted ? 'Deleted message' : String(text).slice(0, 400)}</div> : null}
              {media(r)}
            </div>
          );
        })}
      {!loading && more && <div role="button" onClick={() => fetchPage(rows.length)} style={{ textAlign: 'center', padding: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Load more</div>}
      {loading && rows && rows.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}><Spinner size={18} color={theme.ink} /></div>}
      {delFor && <AdminSheet title={`Delete this ${cfg.label.toLowerCase().replace(/s$/, '')}?`} body="It is removed for everyone and cannot be brought back." confirmLabel="Delete it" danger busy={delBusy} onConfirm={doDelete} onClose={() => setDelFor(null)} />}
    </>
  );
}

function AdminKnowledge() {
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('approved');
  const [topic, setTopic] = useState('');
  const [fact, setFact] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [delFor, setDelFor] = useState(null);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const PAGE = 25;

  const fetchPage = async (offset) => {
    setLoading(true);
    const { data, error: e } = await supabase.rpc('admin_table_rows', { p_table: 'bot_knowledge', p_search: query.trim(), p_limit: PAGE, p_offset: offset });
    setLoading(false);
    if (e) { setError(friendlyError(e, 'Could not load what the bot has learned. Run the bot knowledge SQL first.')); setRows((p) => p || []); return; }
    setError('');
    const list = data || [];
    const extra = await adminResolveNames(list, names);
    setNames((prev) => ({ ...prev, ...extra }));
    setRows((prev) => (offset === 0 ? list : [...(prev || []), ...list]));
    setMore(list.length === PAGE);
  };
  useEffect(() => {
    setRows(null);
    const t = setTimeout(() => fetchPage(0), 280);
    return () => clearTimeout(t);
  }, [query]);

  const teach = async () => {
    if (!topic.trim() || fact.trim().length < 8 || busy) return;
    setBusy(true);
    const { error: e } = await supabase.rpc('admin_add_knowledge', { p_topic: topic.trim(), p_fact: fact.trim() });
    setBusy(false);
    if (e) { setNote(friendlyError(e, 'Could not save that.')); return; }
    setNote('The bot learned it.');
    setTopic(''); setFact('');
    setRows(null); fetchPage(0);
  };
  const setRowStatus = async (r, next) => {
    const { error: e } = await supabase.rpc('admin_update_row', { p_table: 'bot_knowledge', p_id: String(r.id), p_patch: { status: next } });
    if (e) { setNote(friendlyError(e, 'Could not change that.')); return; }
    adminLog(next === 'rejected' ? 'Rejected bot fact' : 'Restored bot fact', r.id, r.topic);
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
  };
  const doDelete = async () => {
    setBusy(true);
    const { error: e } = await supabase.rpc('admin_delete_row', { p_table: 'bot_knowledge', p_id: String(delFor.id) });
    setBusy(false);
    if (e) { setNote(friendlyError(e, 'Could not delete that.')); setDelFor(null); return; }
    setRows((prev) => prev.filter((x) => x.id !== delFor.id));
    setDelFor(null);
  };

  const shown = (rows || []).filter((r) => (r.status || 'approved') === status);
  const countOf = (k) => (rows || []).filter((r) => (r.status || 'approved') === k).length;
  const cantTeach = busy || !topic.trim() || fact.trim().length < 8;

  return (
    <>
      <div style={{ padding: '6px 0 2px' }}>
        <div style={{ fontWeight: 800, fontSize: 19, color: theme.ink, letterSpacing: '-0.01em' }}>What ZChat Bot has learned</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>People teach it in chat. It shares what it learned with others who ask, without saying who taught it. Private details, links and anything unsafe are filtered out before they are saved.</div>
      </div>
      {note && <div style={{ marginTop: 10 }}><AdminNote text={note} /></div>}
      <KitSection title="Teach it something yourself" style={{ marginTop: 22 }}>
        <input style={inputStyle(theme)} placeholder="Topic, like Sri Lanka tea" aria-label="Topic" maxLength={60} value={topic} onChange={(e) => setTopic(e.target.value)} />
        <div style={{ height: 10 }} />
        <textarea style={{ ...inputStyle(theme), minHeight: 80, resize: 'vertical', fontFamily: FONT }} placeholder="One clear fact" aria-label="Fact" maxLength={300} value={fact} onChange={(e) => setFact(e.target.value)} />
        <button style={{ ...primaryBtn(theme, cantTeach), marginTop: 10 }} disabled={cantTeach} onClick={teach}>{busy ? <Spinner /> : 'Teach the bot'}</button>
      </KitSection>
      <KitTabs key={`${countOf('approved')}:${countOf('rejected')}`} label="Facts" value={status} onChange={setStatus} options={[['approved', 'Learned', countOf('approved')], ['rejected', 'Rejected', countOf('rejected')]]} style={{ margin: '26px -16px 12px', padding: '0 8px' }} />
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 14, top: 15 }} />
        <input style={{ ...inputStyle(theme), paddingLeft: 40 }} placeholder="Search what it knows" aria-label="Search what it knows" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {error && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '6px 0 10px' }}>{error}</div>}
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.ink} /></div>
        : shown.length === 0 ? <div style={{ textAlign: 'center', color: theme.muted, fontSize: 13, padding: 28 }}>{status === 'approved' ? 'It has not learned anything yet.' : 'Nothing rejected.'}</div>
        : shown.map((r, i) => (
          <div key={r.id} style={{ padding: '12px 0 6px', boxShadow: adminHair(theme, i < shown.length - 1) }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: kitOnInk(theme) }}>{r.topic}</div>
            <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.45, marginTop: 3, wordBreak: 'break-word' }}>{r.fact}</div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 6 }}>{`Taught by ${(r.taught_by && names[r.taught_by]) || 'unknown'}, ${adminDate(r.created_at)}`}</div>
            <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
              {status === 'approved' ? <AdminTextBtn label="Reject" onClick={() => setRowStatus(r, 'rejected')} /> : <AdminTextBtn label="Restore" tone="main" onClick={() => setRowStatus(r, 'approved')} />}
              <AdminTextBtn label="Delete" tone="danger" onClick={() => setDelFor(r)} />
            </div>
          </div>
        ))}
      {!loading && more && <div role="button" onClick={() => fetchPage(rows.length)} style={{ textAlign: 'center', padding: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Load more</div>}
      {delFor && <AdminSheet title="Delete this fact?" body="The bot forgets it for good." confirmLabel="Delete it" danger busy={busy} onConfirm={doDelete} onClose={() => setDelFor(null)} />}
    </>
  );
}

function AdminNewest({ onManage }) {
  const { theme } = useTheme();
  const [list, setList] = useState(null);
  useEffect(() => {
    supabase.from('profiles').select(PROFILE_COLS).order('created_at', { ascending: false }).limit(12).then(({ data }) => setList(sanitizeAvatarList(data || [], '')));
  }, []);
  if (!list || !list.length) return null;
  return (
    <KitSection title="Newest people" style={{ marginTop: 26 }}>
      <div style={{ display: 'flex', gap: 14, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px', scrollbarWidth: 'none' }}>
        {list.map((p) => (
          <div key={p.id} role="button" aria-label={`Manage ${p.name}`} onClick={() => onManage(p)} className="zchat-press" style={{ flexShrink: 0, width: 64, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', display: 'inline-block' }}><Avatar emoji={p.avatar} name={p.name} size={56} /></div>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.ink2, marginTop: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.name || '').split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </KitSection>
  );
}

export function AdminPanel({ myId, onClose, onOpenProfile, onOpenReports }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const c = igPalette(theme);
  const [tab, setTab] = useState('home');
  useBackClose(tab !== 'home', () => { setTab('home'); setNote(''); });
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [log, setLog] = useState([]);
  const [manageFor, setManageFor] = useState(null);
  const [peopleKey, setPeopleKey] = useState(0);
  const [knowCount, setKnowCount] = useState(null);
  const [bTitle, setBTitle] = useState('');
  const [bBody, setBBody] = useState('');
  const [bBusy, setBBusy] = useState(false);
  const [bConfirm, setBConfirm] = useState(false);
  const [note, setNote] = useState('');

  const loadHome = async () => {
    setStatsError('');
    const { data, error } = await supabase.rpc('admin_stats');
    if (error) { setStats(null); setStatsError(friendlyError(error, 'Could not load the numbers. Run the admin SQL files first.')); } else setStats(data || {});
    const { data: l } = await supabase.rpc('admin_recent_log', { p_limit: 8 });
    setLog(l || []);
    const { data: kc } = await supabase.rpc('admin_bot_knowledge_count');
    setKnowCount(typeof kc === 'number' ? kc : null);
  };
  useEffect(() => { loadHome(); }, []);

  const sendBroadcast = async () => {
    if (!bTitle.trim() || !bBody.trim() || bBusy) return;
    setBBusy(true);
    const { data, error } = await supabase.rpc('admin_broadcast', { p_title: bTitle.trim(), p_body: bBody.trim() });
    setBBusy(false);
    setBConfirm(false);
    if (error) { setNote(friendlyError(error, 'Could not send the announcement.')); return; }
    adminLog('Announcement', null, bTitle.trim());
    setNote(Number(data) === 1 ? 'Announcement sent to 1 person.' : `Announcement sent to ${formatCount(Number(data) || 0)} people.`);
    setBTitle(''); setBBody('');
    loadHome();
  };

  const num = (v) => (v == null ? '\u2026' : formatCount(Number(v) || 0));
  const openReports = stats && Number(stats.open_reports) > 0 ? Number(stats.open_reports) : 0;
  const tiles = [
    [UserPlus, 'Joined this week', stats && stats.new_week],
    [Clock, 'Active in 24 hours', stats && stats.active_day],
    [Mail, 'All messages', stats && stats.messages],
    [ImageIcon, 'Posts', stats && stats.posts],
    [Camera, 'Live stories', stats && stats.stories_live],
    [Users, 'Groups', stats && stats.groups],
    [MessageSquare, 'Bot messages', stats && stats.bot_messages],
    [FileText, 'Bot facts', knowCount, () => setTab('bot')],
    [ShieldAlert, 'Open reports', stats && stats.open_reports, onOpenReports],
    [Ban, 'Banned', stats && stats.banned, () => setTab('people')],
    [Timer, 'Paused right now', stats && stats.paused, () => setTab('people')],
  ];
  const tools = [
    [<ShieldAlert />, 'Reports', openReports ? String(openReports) : '', onOpenReports],
    [<Activity />, 'Health', '', () => setTab('health')],
    [<ImageIcon />, 'Flagged photos', '', () => setTab('photos')],
    [<Activity />, 'Crash reports', '', () => setTab('errors')],
    [<FileText />, 'App files', '', () => setTab('files')],
    [<GiftBoxIcon />, 'Drops', '', () => setTab('drops')],
    [<GiftCodeIcon />, 'Gift codes', '', () => setTab('codes')],
    [<Megaphone />, 'Announce', '', () => setTab('announce')],
    [<MessageSquare />, 'Teach the bot', '', () => setTab('bot')],
    [<Database />, 'Browse data', '', () => setTab('data')],
  ];
  const signups = (stats && stats.signups) || [];
  const maxN = Math.max(1, ...signups.map((d) => Number(d.n) || 0));
  const TABS = [['home', 'Home', LayoutDashboard], ['people', 'People', Users], ['content', 'Content', ImageIcon], ['bot', 'Bot', MessageSquare], ['announce', 'Announce', Megaphone], ['data', 'Data', Database]];
  const cantSend = bBusy || !bTitle.trim() || !bBody.trim();

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: c.bg, color: c.fg, display: 'flex', flexDirection: 'column', fontFamily: FONT, isolation: 'isolate' }} className="zchat-panel-open">
      <IgTopBar title="Admin" subtitle="ZChat control room" onBack={onClose} right={(
        <div role="button" aria-label="Report queue" onClick={onOpenReports} className="zchat-press" style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}>
          <ShieldAlert size={22} strokeWidth={1.8} />
          {openReports > 0 && <span style={{ position: 'absolute', top: 5, right: 3, minWidth: 18, height: 18, borderRadius: 9, background: theme.danger, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxSizing: 'border-box', boxShadow: `0 0 0 2px ${c.bg}` }}>{stats.open_reports}</span>}
        </div>
      )} />

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 16px 28px' }}>
        {note && <AdminNote text={note} />}

        {tab === 'home' && (
          <>
            {statsError && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{statsError}</div>}
            <div style={{ display: 'flex', padding: '10px 0 4px' }}>
              {[['online now', stats && stats.online_now, true], ['people', stats && stats.users], ['messages today', stats && stats.messages_today]].map(([label, v, live], i) => (
                <div key={label} style={{ flex: 1, minWidth: 0, paddingLeft: i ? 14 : 0, boxShadow: i ? `inset 0.5px 0 0 ${theme.hair}` : 'none' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: theme.ink, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{num(v)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: theme.muted, marginTop: 5, whiteSpace: 'nowrap' }}>
                    {live && <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}{label}
                  </div>
                </div>
              ))}
            </div>
            <KitSection title="Tools" style={{ marginTop: 24 }}>
              {tools.map(([icon, label, value, go]) => <IgRow key={label} inset={false} icon={icon} label={label} value={value} onClick={go} />)}
            </KitSection>
            <KitSection title="Numbers" style={{ marginTop: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {tiles.map(([Icon, label, value, go], i) => (
                  <div key={label} role={go ? 'button' : undefined} onClick={go} className={go ? 'zchat-press' : undefined}
                    style={{ gridColumn: i === tiles.length - 1 && i % 2 === 0 ? '1 / -1' : undefined, minWidth: 0, padding: `12px ${i % 2 ? 0 : 14}px 12px ${i % 2 ? 14 : 0}px`, cursor: go ? 'pointer' : 'default', boxShadow: [i >= 2 ? `inset 0 0.5px 0 ${theme.hair}` : '', i % 2 ? `inset 0.5px 0 0 ${theme.hair}` : ''].filter(Boolean).join(', ') || 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: theme.muted, minWidth: 0 }}>
                      <Icon size={15} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                      {go && <ChevronRight size={14} style={{ flexShrink: 0, marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', marginTop: 5, fontVariantNumeric: 'tabular-nums' }}>{num(value)}</div>
                  </div>
                ))}
              </div>
            </KitSection>
            <AdminNewest onManage={(p) => { setTab('people'); setManageFor(p); }} />
            <KitSection title="New people, last 7 days" style={{ marginTop: 26 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 104, paddingTop: 6 }}>
                {signups.length === 0 ? <div style={{ color: theme.muted, fontSize: 12.5 }}>No data yet.</div> : signups.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: i === signups.length - 1 ? theme.ink : theme.muted, fontVariantNumeric: 'tabular-nums' }}>{d.n}</div>
                    <div style={{ width: '100%', maxWidth: 30, height: `${Math.max(6, Math.round(((Number(d.n) || 0) / maxN) * 62))}px`, borderRadius: 7, background: theme.coral, opacity: i === signups.length - 1 ? 1 : 0.45 }} />
                    <div style={{ fontSize: 11, color: theme.muted, fontWeight: 600 }}>{fmtDate(new Date(`${d.day}T12:00:00`), { weekday: 'short' }).slice(0, 3)}</div>
                  </div>
                ))}
              </div>
            </KitSection>
            <KitSection title="Recent admin activity" right={<span role="button" aria-label="Refresh admin activity" onClick={loadHome} style={{ fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Refresh</span>} style={{ marginTop: 26 }}>
              {log.length === 0 ? <div style={{ color: theme.muted, fontSize: 13, padding: '4px 0' }}>Nothing yet. Bans, gifts, pauses and deletes show up here.</div> : log.map((l, i) => (
                <div key={l.id} style={{ padding: '10px 0', boxShadow: adminHair(theme, i < log.length - 1) }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>{l.action}{l.detail ? <span style={{ color: theme.muted, fontWeight: 500 }}>{`, ${l.detail}`}</span> : null}</div>
                  <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{`${l.admin_name || 'Admin'}, ${adminDate(l.created_at)}`}</div>
                </div>
              ))}
            </KitSection>
          </>
        )}

        {tab === 'people' && <AdminPeople key={peopleKey} onManage={setManageFor} />}
        {tab === 'content' && <AdminContent onOpenProfile={onOpenProfile} />}
        {tab === 'bot' && <AdminKnowledge />}
        {tab === 'data' && <AdminDataBrowser />}
        {tab === 'errors' && <AdminErrors />}
        {tab === 'health' && <AdminHealth onOpenPhotos={() => setTab('photos')} />}
        {tab === 'photos' && <AdminPhotoFlags onOpenProfile={(p) => { supabase.from('profiles').select(PROFILE_COLS).eq('id', p.id).maybeSingle().then(({ data }) => { setTab('people'); setManageFor(data ? sanitizeAvatarList([data], '')[0] : p); }, () => {}); }} />}
        {tab === 'files' && <AdminFiles />}
        {tab === 'drops' && <AdminDrops />}
        {tab === 'codes' && <AdminGiftCodes />}

        {tab === 'announce' && (
          <KitSection title="Announcement to everyone" style={{ marginTop: 8 }}>
            <div style={{ fontSize: 13, color: theme.muted, margin: '0 0 14px', lineHeight: 1.5 }}>It lands in every person's Mail, sent from you.</div>
            <input style={inputStyle(theme)} placeholder="Title" aria-label="Announcement title" maxLength={80} value={bTitle} onChange={(e) => setBTitle(e.target.value)} />
            <div style={{ height: 10 }} />
            <textarea style={{ ...inputStyle(theme), minHeight: 130, resize: 'vertical', fontFamily: FONT }} placeholder="Message" aria-label="Announcement message" maxLength={1000} value={bBody} onChange={(e) => setBBody(e.target.value)} />
            <button style={primaryBtn(theme, cantSend)} disabled={cantSend} onClick={() => setBConfirm(true)}>{bBusy ? <Spinner /> : 'Send announcement'}</button>
          </KitSection>
        )}
      </div>

      <div style={{ display: 'flex', borderTop: `1px solid ${theme.border}`, background: c.bg, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map(([k, label, Icon]) => (
          <div key={k} role="button" aria-current={tab === k ? 'page' : undefined} onClick={() => { setTab(k); setNote(''); }} style={{ flex: 1, padding: '9px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: tab === k ? theme.coral : theme.muted }}>
            <Icon size={21} strokeWidth={tab === k ? 2.1 : 1.8} />
            <span style={{ fontSize: 10.5, fontWeight: tab === k ? 700 : 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {manageFor && <AdminUserPanel person={manageFor} myId={myId} onClose={() => { setManageFor(null); setPeopleKey((k) => k + 1); }} onChanged={(fields) => setManageFor((cur) => (cur ? { ...cur, ...fields } : cur))} onOpenProfile={onOpenProfile} />}
      {bConfirm && <AdminSheet title="Send to everyone?" body="This cannot be taken back. Every account will get it in Mail." confirmLabel="Send now" busy={bBusy} onConfirm={sendBroadcast} onClose={() => setBConfirm(false)} />}
    </div>
  );
}
function AdminDrops() {
  const { theme } = useTheme();
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null);
  useBackClose(!!edit, () => { if (!busy) setEdit(null); });
  const load = async () => {
    const { data, error } = await supabase.from('drops').select('*').order('starts_at', { ascending: false }).limit(40);
    if (error) { setErr('Drops switch on once the latest ZChat setup is finished.'); setList([]); return; }
    setErr('');
    setList(data || []);
  };
  useEffect(() => { dropArtMem.clear(); load(); }, []);
  const [artMissing, setArtMissing] = useState({});
  useEffect(() => {
    if (!list) return undefined;
    let off = false;
    list.filter((d) => d.kind === 'set').forEach((d) => { dropArtReady(d.item_key).then((ok) => { if (!off) setArtMissing((m) => (m[d.item_key] === !ok ? m : { ...m, [d.item_key]: !ok })); }); });
    return () => { off = true; };
  }, [list]);
  const fresh = () => {
    const start = new Date(Date.now() + 86400000);
    start.setMinutes(0, 0, 0);
    return { id: null, kind: 'set', item_key: DECOR_DROPS[0] ? DECOR_DROPS[0].key : DECOR_SETS[0].key, title: DECOR_DROPS[0] ? DECOR_DROPS[0].name : '', blurb: '', price: 600, start: localInputValue(start), days: 7 };
  };
  const open = (d) => setEdit(d ? { id: d.id, kind: d.kind, item_key: d.item_key, title: d.title, blurb: d.blurb || '', price: d.price, start: localInputValue(new Date(d.starts_at)), days: Math.max(1, Math.round((Date.parse(d.ends_at) - Date.parse(d.starts_at)) / 86400000)) } : fresh());
  const save = async () => {
    if (!edit || busy) return;
    const startAt = new Date(edit.start);
    if (!edit.title.trim() || Number.isNaN(startAt.getTime()) || !(Number(edit.price) > 0)) { setErr('Add a title, a start time and a price.'); return; }
    setBusy(true);
    const row = { kind: edit.kind, item_key: edit.item_key, title: edit.title.trim().slice(0, 60), blurb: edit.blurb.trim().slice(0, 200) || null, price: Math.round(Number(edit.price)), starts_at: startAt.toISOString(), ends_at: new Date(startAt.getTime() + Number(edit.days) * 86400000).toISOString() };
    const { error } = edit.id ? await supabase.from('drops').update(row).eq('id', edit.id) : await supabase.from('drops').insert(row);
    setBusy(false);
    if (error) { setErr(friendlyError(error, 'Could not save the drop.')); return; }
    adminLog(edit.id ? 'Drop changed' : 'Drop added', null, row.title);
    setEdit(null);
    loadDrops(null, true);
    load();
  };
  const endNow = async (d) => {
    setAsk(null);
    const { error } = await supabase.from('drops').update({ ends_at: new Date(Math.max(Date.parse(d.starts_at) + 60000, Date.now())).toISOString() }).eq('id', d.id);
    if (error) { setErr(friendlyError(error, 'Could not end the drop.')); return; }
    adminLog('Drop ended', null, d.title);
    load();
  };
  const remove = async (d) => {
    setAsk(null);
    const { error } = await supabase.from('drops').delete().eq('id', d.id);
    if (error) { setErr(friendlyError(error, 'Could not delete the drop.')); return; }
    adminLog('Drop deleted', null, d.title);
    load();
  };
  const field = { display: 'block', fontSize: 12.5, fontWeight: 600, color: theme.muted };
  const items = edit && edit.kind === 'bubble' ? CHAR_BUBBLE_KEYS.map((k) => [k, CHAR_BUBBLES[k].label]) : DECOR_ALL.map((st) => [st.key, st.drop ? `${st.name}, drop only` : st.name]);
  return (
    <div>
      {err && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{err}</div>}
      {edit ? (
        <KitSection title={edit.id ? 'Change drop' : 'New drop'} style={{ marginTop: 8 }}>
          <SegmentedControl value={edit.kind} onChange={(k) => setEdit((e) => ({ ...e, kind: k, item_key: k === 'bubble' ? CHAR_BUBBLE_KEYS[0] : (DECOR_DROPS[0] || DECOR_SETS[0]).key }))} options={[['set', 'Frame and nameplate'], ['bubble', 'Chat bubble']]} style={{ margin: '2px 0 12px' }} />
          <select aria-label="Item" value={edit.item_key} onChange={(e) => setEdit((x) => ({ ...x, item_key: e.target.value }))} style={inputStyle(theme)}>
            {items.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <div style={{ height: 10 }} />
          <input aria-label="Title" style={inputStyle(theme)} placeholder="Title" maxLength={60} value={edit.title} onChange={(e) => setEdit((x) => ({ ...x, title: e.target.value }))} />
          <div style={{ height: 10 }} />
          <textarea aria-label="About" style={{ ...inputStyle(theme), minHeight: 70, resize: 'vertical', fontFamily: FONT }} placeholder="A short line about it" maxLength={200} value={edit.blurb} onChange={(e) => setEdit((x) => ({ ...x, blurb: e.target.value }))} />
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <label style={{ ...field, flex: 1 }}>Price in coins<input type="number" min={1} max={100000} value={edit.price} onChange={(e) => setEdit((x) => ({ ...x, price: e.target.value }))} style={{ ...inputStyle(theme), marginTop: 5 }} /></label>
            <label style={{ ...field, flex: 1 }}>Days live<select value={edit.days} onChange={(e) => setEdit((x) => ({ ...x, days: Number(e.target.value) }))} style={{ ...inputStyle(theme), marginTop: 5 }}>{[1, 2, 3, 5, 7, 10, 14, 30].map((n) => <option key={n} value={n}>{n === 1 ? '1 day' : `${n} days`}</option>)}</select></label>
          </div>
          <label style={{ ...field, marginTop: 12 }}>Opens at<input type="datetime-local" value={edit.start} onChange={(e) => setEdit((x) => ({ ...x, start: e.target.value }))} style={{ ...inputStyle(theme), marginTop: 5 }} /></label>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button style={{ ...primaryBtn(theme, false), marginTop: 0, background: theme.soft, color: theme.ink }} onClick={() => setEdit(null)}>Cancel</button>
            <button style={{ ...primaryBtn(theme, busy), marginTop: 0 }} disabled={busy} onClick={save}>{busy ? <Spinner /> : 'Save drop'}</button>
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 12, lineHeight: 1.5 }}>People who tapped Remind me get a notification when it opens. Anyone who already has one part pays half.</div>
        </KitSection>
      ) : (
        <button style={{ ...primaryBtn(theme, false), marginTop: 4, marginBottom: 8 }} onClick={() => open(null)}>New drop</button>
      )}
      {!edit && (list === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div> : list.length === 0 ? <div style={{ color: theme.muted, fontSize: 13, padding: '8px 2px' }}>No drops yet.</div> : list.map((d, i) => {
        const ph = dropPhase(d);
        return (
          <div key={d.id} style={{ padding: '12px 0 4px', boxShadow: adminHair(theme, i < list.length - 1) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
              <AdminStatus tone={ph === 'live' ? 'live' : ph === 'soon' ? 'accent' : 'muted'}>{ph === 'live' ? 'Live' : ph === 'soon' ? 'Coming' : 'Ended'}</AdminStatus>
            </div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 4, lineHeight: 1.45 }}>{`${d.price} coins, ${adminDate(d.starts_at)} to ${adminDate(d.ends_at)}`}</div>
            {d.kind === 'set' && artMissing[d.item_key] && <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.danger, marginTop: 4, lineHeight: 1.45 }}>Hidden from people until its frame and nameplate files are on the site</div>}
            <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
              <AdminTextBtn label="Change" tone="main" onClick={() => open(d)} />
              {ph === 'live' && <AdminTextBtn label="End now" onClick={() => setAsk({ k: 'end', d })} />}
              <AdminTextBtn label="Delete" tone="danger" onClick={() => setAsk({ k: 'del', d })} />
            </div>
          </div>
        );
      }))}
      {ask && <AdminSheet title={ask.k === 'end' ? 'End this drop now?' : 'Delete this drop?'} body={ask.k === 'end' ? 'People keep what they already got. Nobody can get it after this.' : 'People keep what they already got. The drop and its reminders are removed.'} confirmLabel={ask.k === 'end' ? 'End now' : 'Delete'} danger onConfirm={() => (ask.k === 'end' ? endNow(ask.d) : remove(ask.d))} onClose={() => setAsk(null)} />}
    </div>
  );
}

const adminCodesMem = { list: null };
const ADMIN_CODE_KINDS = [['', 'No item'], ['set', 'Full set'], ['frame', 'Frame'], ['nameplate', 'Nameplate'], ['effect', 'Effect'], ['charm', 'Charm'], ['bubble', 'Bubble'], ['namestyle', 'Name style'], ['theme', 'Profile theme'], ['reaction', 'Super reaction']];
function cxAdminCatalog(kind) {
  const out = {};
  const keys = kind === 'namestyle' ? NS_KEYS : kind === 'theme' ? THEME_KEYS : SUPER_KEYS.filter((k) => !SUPER_REACTS[k].free);
  keys.forEach((k) => { const sp = cxSpec(kind, k); out[k] = { label: `${sp.label} ${cxWord(kind)}`, rarity: sp.rarity }; });
  return out;
}
function adminCodeKeys(kind) {
  if (CX_KINDS.includes(kind)) return Object.entries(cxAdminCatalog(kind)).map(([k, v]) => [k, v.label]);
  if (kind === 'set' || kind === 'frame' || kind === 'nameplate' || kind === 'effect') return DECOR_ALL.map((st) => [st.key, st.drop ? `${st.name}, drop only` : st.name]);
  if (kind === 'charm') return Object.keys(CUSTOM_BADGES).map((k) => [k, CUSTOM_BADGES[k].label]);
  if (kind === 'bubble') return CHAR_BUBBLE_KEYS.map((k) => [k, CHAR_BUBBLES[k].label]);
  return [];
}
function adminCodeState(c) {
  if (!c.active) return ['muted', 'Off'];
  if (c.ends_at && Date.parse(c.ends_at) <= Date.now()) return ['muted', 'Ended'];
  if (Number(c.uses) >= Number(c.max_uses)) return ['accent', 'Used up'];
  return ['good', 'Active'];
}
function AdminGiftCodes() {
  const { theme } = useTheme();
  const [list, setList] = useState(() => adminCodesMem.list);
  const [err, setErr] = useState('');
  const [say, setSay] = useState('');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(null);
  const [missing, setMissing] = useState(false);
  useBackClose(!!form, () => { if (!busy) setForm(null); });
  const keep = (next) => { adminCodesMem.list = next; setList(next); };
  const load = async () => {
    let res;
    try { res = await supabase.from('gift_codes').select('*').order('created_at', { ascending: false }).limit(80); } catch (e) { res = { data: null, error: e || {} }; }
    const { data, error } = res;
    if (error) { const gone = rpcMissing(error); setMissing(gone); setErr(gone ? 'Gift codes switch on once the latest ZChat setup is finished.' : friendlyError(error, 'Could not load the codes.')); if (!adminCodesMem.list) keep([]); return; }
    setMissing(false);
    setErr('');
    keep((data || []).map((c) => ({ ...c })));
  };
  useEffect(() => { load(); }, []);
  const blank = () => {
    const end = new Date(Date.now() + 7 * 86400000);
    end.setMinutes(0, 0, 0);
    return { coins: '500', kind: '', key: '', uses: '1', endsOn: false, ends: localInputValue(end), note: '' };
  };
  const coinsN = form ? Math.floor(Number(form.coins) || 0) : 0;
  const usesN = form ? Math.floor(Number(form.uses) || 0) : 0;
  const endMs = form && form.endsOn ? new Date(form.ends).getTime() : 0;
  const formErr = !form ? '' : coinsN > 100000 ? 'Coins can be up to 100,000.' : !coinsN && !form.kind ? 'Add coins, an item or both.' : form.kind && !form.key ? 'Pick the item.' : usesN < 1 || usesN > 100000 ? 'It can be used by 1 to 100,000 people.' : form.endsOn && !(endMs > Date.now() + 300000) ? 'Pick an end date in the future.' : '';
  const create = async () => {
    if (!form || busy || formErr) return;
    setBusy(true);
    setErr('');
    setSay('');
    hapticTap();
    const tmpId = `making-${Date.now()}`;
    const draft = { id: tmpId, code: '', coins: coinsN, item_kind: form.kind || null, item_key: form.kind ? form.key : null, max_uses: usesN, uses: 0, ends_at: form.endsOn ? new Date(endMs).toISOString() : null, active: true, note: form.note.trim() || null, created_at: new Date().toISOString(), making: true };
    keep([draft, ...(adminCodesMem.list || [])]);
    const sent = form;
    setForm(null);
    let res;
    try { res = await supabase.rpc('zchat_code_create', { p_coins: draft.coins, p_kind: draft.item_kind, p_key: draft.item_key, p_max_uses: draft.max_uses, p_ends_at: draft.ends_at, p_note: draft.note }); } catch (e) { res = { error: e }; }
    setBusy(false);
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    if (!row || !row.ok || !row.code) {
      keep((adminCodesMem.list || []).filter((c) => c.id !== tmpId));
      const gone = !!(res && res.error && rpcMissing(res.error));
      if (gone) setMissing(true); else setForm(sent);
      setErr(res && res.error ? (gone ? 'Gift codes switch on once the latest ZChat setup is finished.' : friendlyError(res.error, 'That code could not be made. Try again.')) : (row && row.reason) || 'That code could not be made. Try again.');
      return;
    }
    keep((adminCodesMem.list || []).map((c) => (c.id === tmpId ? row.code : c)));
    setFresh(row.code.id);
    setSay('Code made. Copy it and share it where you like.');
    adminLog('Gift code made', null, giftCodeWhat(row.code.coins, row.code.item_kind, row.code.item_key));
  };
  const copy = async (c) => {
    const ok = await copyTextToClipboard(giftCodeGroups(c.code));
    hapticTap();
    setSay(ok ? `${giftCodeGroups(c.code)} copied` : giftCodeGroups(c.code));
  };
  const flip = async (c) => {
    const on = !c.active;
    hapticTap();
    keep((adminCodesMem.list || []).map((x) => (x.id === c.id ? { ...x, active: on } : x)));
    let res;
    try { res = await supabase.rpc('zchat_code_set', { p_id: c.id, p_active: on }); } catch (e) { res = { error: e }; }
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    if (!row || !row.ok) {
      keep((adminCodesMem.list || []).map((x) => (x.id === c.id ? { ...x, active: !on } : x)));
      setErr(res && res.error ? friendlyError(res.error, 'That did not work. Try again.') : (row && row.reason) || 'That did not work. Try again.');
      return;
    }
    adminLog(on ? 'Gift code on' : 'Gift code off', null, giftCodeGroups(c.code));
  };
  const field = { display: 'block', fontSize: 12.5, fontWeight: 600, color: theme.muted };
  const keys = form ? adminCodeKeys(form.kind) : [];
  return (
    <div>
      <div style={{ padding: '6px 0 2px' }}>
        <div style={{ fontWeight: 800, fontSize: 19, color: theme.ink, letterSpacing: '-0.01em' }}>Gift codes</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>People type a code on their Coins page to get coins, an item or both. Each person can use a code once.</div>
      </div>
      {err && (missing
        ? <div role="status" style={{ background: theme.soft, color: theme.muted, borderRadius: 12, padding: '11px 12px', fontSize: 13, lineHeight: 1.5, margin: '14px 0 0' }}>{err}</div>
        : <div role="alert" style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '12px 0 0' }}>{err}</div>)}
      {say && <div style={{ marginTop: 10 }}><AdminNote text={say} /></div>}
      {missing ? null : form ? (
        <KitSection title="New gift code" style={{ marginTop: 16 }}>
          <label style={field}>Coins<input value={form.coins} inputMode="numeric" pattern="[0-9]*" aria-label="Coins in the code" onChange={(e) => setForm((f) => ({ ...f, coins: String(e.target.value).replace(/[^0-9]/g, '').slice(0, 6) }))} style={{ ...inputStyle(theme), marginTop: 5, fontVariantNumeric: 'tabular-nums' }} /></label>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <label style={{ ...field, flex: 1, minWidth: 0 }}>Item<select aria-label="Item kind" value={form.kind} onChange={(e) => { const k = e.target.value; const first = adminCodeKeys(k)[0]; setForm((f) => ({ ...f, kind: k, key: first ? first[0] : '' })); }} style={{ ...inputStyle(theme), marginTop: 5 }}>{ADMIN_CODE_KINDS.filter(([k]) => cxFlag.on || !CX_KINDS.includes(k)).map(([k, l]) => <option key={k || 'none'} value={k}>{l}</option>)}</select></label>
            {form.kind && <label style={{ ...field, flex: 1.4, minWidth: 0 }}>Which one<select aria-label="Which item" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} style={{ ...inputStyle(theme), marginTop: 5 }}>{keys.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>}
          </div>
          {form.kind && form.key && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <TradeArt kind={form.kind === 'set' ? 'frame' : form.kind} k={form.key} size={64} />
              <div style={{ minWidth: 0, fontSize: 13.5, color: theme.ink2, lineHeight: 1.45 }}>{`People get ${giftCodeWhat(0, form.kind, form.key)}${form.kind === 'set' ? ', with all three pieces' : ''}. If they already have it, they still get the coins.`}</div>
            </div>
          )}
          <label style={{ ...field, marginTop: 12 }}>How many people can use it<input value={form.uses} inputMode="numeric" pattern="[0-9]*" aria-label="How many people can use it" onChange={(e) => setForm((f) => ({ ...f, uses: String(e.target.value).replace(/[^0-9]/g, '').slice(0, 6) }))} style={{ ...inputStyle(theme), marginTop: 5, fontVariantNumeric: 'tabular-nums' }} /></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54, marginTop: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>Ends on a date</div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Off means it works until it is used up</div>
            </div>
            <IgToggle on={form.endsOn} onClick={() => setForm((f) => ({ ...f, endsOn: !f.endsOn }))} />
          </div>
          {form.endsOn && <label style={{ ...field, marginTop: 4 }}>Ends at<input type="datetime-local" aria-label="Ends at" value={form.ends} onChange={(e) => setForm((f) => ({ ...f, ends: e.target.value }))} style={{ ...inputStyle(theme), marginTop: 5 }} /></label>}
          <label style={{ ...field, marginTop: 12 }}>Note for admins<input value={form.note} maxLength={80} aria-label="Note for admins" placeholder="Like where you share it" onChange={(e) => setForm((f) => ({ ...f, note: e.target.value.slice(0, 80) }))} style={{ ...inputStyle(theme), marginTop: 5 }} /></label>
          {formErr && <div style={{ fontSize: 12.5, color: theme.danger, padding: '10px 2px 0' }}>{formErr}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button type="button" style={{ ...primaryBtn(theme, false), marginTop: 0, background: theme.soft, color: theme.ink }} onClick={() => setForm(null)}>Cancel</button>
            <button type="button" style={{ ...primaryBtn(theme, !!formErr || busy), marginTop: 0 }} disabled={!!formErr || busy} onClick={create}>Make code</button>
          </div>
        </KitSection>
      ) : (
        <button type="button" style={{ ...primaryBtn(theme, false), marginTop: 16, marginBottom: 6 }} onClick={() => { hapticTap(); setSay(''); setErr(''); setForm(blank()); }}>New gift code</button>
      )}
      {missing ? null : list === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.muted} /></div> : list.length === 0 ? (
        <div style={{ color: theme.muted, fontSize: 13, padding: '12px 2px' }}>No codes yet. Make one to share in a post, a story or a message.</div>
      ) : (
        <KitSection title="Your codes" right={`${list.length}`} style={{ marginTop: 22 }}>
          {list.map((c, i) => {
            const [tone, label] = c.making ? ['muted', 'Making'] : adminCodeState(c);
            return (
              <div key={c.id} className={c.id === fresh ? 'zchat-fade' : undefined} style={{ padding: '12px 0 4px', boxShadow: adminHair(theme, i < list.length - 1) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: c.making ? theme.muted : theme.ink, fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace", letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.making ? 'Making a code' : giftCodeGroups(c.code)}</div>
                  <AdminStatus tone={tone}>{label}</AdminStatus>
                </div>
                <div style={{ fontSize: 13.5, color: theme.ink2, marginTop: 4 }}>{(() => { const t = giftCodeWhat(Number(c.coins) || 0, c.item_kind, c.item_key); return t ? `${t[0].toUpperCase()}${t.slice(1)}` : ''; })()}</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 3, lineHeight: 1.45 }}>{`${Number(c.uses || 0).toLocaleString('en-US')} of ${Number(c.max_uses || 0).toLocaleString('en-US')} used${c.ends_at ? `, ends ${adminDate(c.ends_at)}` : ''}${c.note ? `, ${c.note}` : ''}`}</div>
                {!c.making && (
                  <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
                    <AdminTextBtn label="Copy" tone="main" icon={<Copy size={15} />} ariaLabel={`Copy ${giftCodeGroups(c.code)}`} onClick={() => copy(c)} />
                    <AdminTextBtn label={c.active ? 'Switch off' : 'Switch on'} tone={c.active ? 'danger' : 'main'} onClick={() => flip(c)} />
                  </div>
                )}
              </div>
            );
          })}
        </KitSection>
      )}
    </div>
  );
}

const ADMIN_RESTRICT_KINDS = [['chat', 'Chat'], ['status', 'Status'], ['post', 'Posts']];
const ADMIN_RESTRICT_HOURS = [[1, '1 hour'], [24, '24 hours'], [72, '3 days'], [168, '7 days'], [720, '30 days']];
const ADMIN_GRANT_DAYS = [[0, 'Forever'], [7, '7 days'], [30, '30 days'], [90, '90 days']];

const ADMIN_ACTIVITY_KINDS = [['posts', 'Posts'], ['stories', 'Stories'], ['follows', 'Follows'], ['group_members', 'Groups'], ['highlights', 'Highlights'], ['user_devices', 'Devices'], ['calls', 'Calls'], ['blocks', 'Blocks'], ['message_reports', 'Reports'], ['saved_messages', 'Saved']];

const ADMIN_COIN_QUICK = [100, 500, 1000, 5000];
const ADMIN_COIN_MAX = 100000;
const ADMIN_COIN_ASK = 10000;
function adminCoinLabel(r) {
  if (coinTakenBack(r)) return r.note ? `Taken back, ${r.note}` : 'Taken back by the ZChat team';
  if (r.note) return r.note;
  return ({ daily: 'Daily reward', invite: 'A friend joined with their link', invited: 'Joined with an invite', gift_in: 'Gift received', gift_out: 'Gift sent', shop: 'Spent in the Shop', gift_item: 'Gift sent', admin: 'From the ZChat team', achievement: 'Achievement reward', purchase: 'Coins bought', refund: 'Purchase refunded', drop: 'Drop', deal: 'Deal of the day', milestone: 'Collection reward', trade: 'Trade', code: 'Gift code', tip_in: 'Tip on their post', tip_out: 'Tip they sent', live_in: 'Live gifts', live_out: 'Live gift sent' }[r.reason] || 'Coins');
}
function adminCoinNote(t) {
  return String(t || '').replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]+/g, '').slice(0, 80).trim();
}
function AdminCoins({ person, onAsk }) {
  const { theme } = useTheme();
  const first = String(person.name || '').split(' ')[0] || 'them';
  const [w, setW] = useState(() => adminWalletMem.get(person.id) || null);
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');
  const [amount, setAmount] = useState(500);
  const [text, setText] = useState('500');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const sayRef = useRef(null);
  const num = (n) => Number(n || 0).toLocaleString('en-US');
  const keep = (next) => { adminWalletMem.set(person.id, next); setW(next); };
  useEffect(() => {
    if (!(err || done) || !sayRef.current) return;
    try { sayRef.current.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch {}
  }, [err, done]);
  const load = async () => {
    const { data, error } = await supabase.rpc('zchat_admin_wallet', { p_user: person.id });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || row.ok === false) {
      setErr(error ? (rpcMissing(error) ? 'Coins for admins switch on once the latest ZChat setup is finished.' : friendlyError(error, 'Could not load their coins.')) : (row && row.reason) || 'Coins for admins switch on once the latest ZChat setup is finished.');
      return;
    }
    keep({ coins: Math.max(0, Number(row.coins) || 0), history: Array.isArray(row.history) ? row.history : [] });
  };
  useEffect(() => { load(); }, [person.id]);
  const valid = Number.isInteger(amount) && amount >= 1 && amount <= ADMIN_COIN_MAX;
  const pick = (n) => { hapticTap(); setAmount(n); setText(String(n)); setDone(''); setErr(''); };
  const type = (v) => { const digits = String(v).replace(/[^0-9]/g, '').slice(0, 6); setText(digits); setAmount(digits ? Number(digits) : 0); setDone(''); setErr(''); };
  const give = async (n, msg) => {
    if (busy) return;
    setBusy(true);
    setErr('');
    setDone('');
    const local = { id: `local-${Date.now()}`, delta: n, reason: 'admin', note: msg || null, created_at: new Date().toISOString() };
    const before = adminWalletMem.get(person.id) || { coins: 0, history: [] };
    keep({ coins: before.coins + n, history: [local, ...before.history].slice(0, 10) });
    hapticTap();
    playUiSound('like');
    let res = null;
    try { res = await supabase.rpc('zchat_admin_coins', { p_user: person.id, p_amount: n, p_note: msg || null }); } catch (e) { res = { error: e }; }
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    const cur = adminWalletMem.get(person.id) || { coins: 0, history: [] };
    setBusy(false);
    if (!row || !row.ok) {
      keep({ coins: Math.max(0, cur.coins - n), history: cur.history.filter((x) => x.id !== local.id) });
      setErr(res && res.error ? (rpcMissing(res.error) ? 'Giving coins switches on once the latest ZChat setup is finished.' : friendlyError(res.error, 'That did not work. Try again.')) : (row && row.reason) || 'That did not work. Try again.');
      return;
    }
    keep({ coins: Math.max(0, Number(row.coins) || 0), history: cur.history });
    if (walletMem.uid === person.id && walletMem.data && walletMem.data.ready) { walletKeep(person.id, { ...walletMem.data, coins: Math.max(0, Number(row.coins) || 0) }); walletMem.mark = Date.now(); walletShow(); }
    setNote('');
    setDone(`${num(n)} ${coinWord(n)} given. ${first} gets a notification.`);
    adminLog(`Gave ${num(n)} coins`, person.id, person.name);
    load();
  };
  const tapGive = () => {
    if (!valid || busy) return;
    const n = amount;
    const msg = adminCoinNote(note);
    if (n > ADMIN_COIN_ASK) {
      onAsk({ title: `Give ${num(n)} coins to ${first}?`, body: 'That is a big gift. The coins land in their wallet right away.', label: `Give ${num(n)} coins`, run: () => give(n, msg) });
      return;
    }
    give(n, msg);
  };
  const [mode, setMode] = useState('give');
  const [short, setShort] = useState(null);
  const taking = mode === 'take';
  const have = w ? Math.max(0, Number(w.coins) || 0) : null;
  const tooMany = taking && valid && have != null && amount > have;
  const canTake = taking && valid && have != null && have > 0 && !tooMany;
  const coinWord = (n) => (n === 1 ? 'coin' : 'coins');
  const take = async (n, msg) => {
    if (busy || !(n > 0)) return;
    setBusy(true);
    setErr('');
    setDone('');
    setShort(null);
    const local = { id: `local-${Date.now()}`, delta: -n, reason: 'admin', note: msg || null, created_at: new Date().toISOString() };
    const before = adminWalletMem.get(person.id) || { coins: 0, history: [] };
    keep({ coins: Math.max(0, before.coins - n), history: [local, ...before.history].slice(0, 10) });
    hapticTap();
    playUiSound('tap');
    let res = null;
    try { res = await supabase.rpc('zchat_admin_take_coins', { p_user: person.id, p_amount: n, p_note: msg || null }); } catch (e) { res = { error: e }; }
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    const cur = adminWalletMem.get(person.id) || { coins: 0, history: [] };
    setBusy(false);
    if (!row || !row.ok) {
      const real = row && row.have != null ? Math.max(0, Number(row.have) || 0) : null;
      keep({ coins: real != null ? real : cur.coins + n, history: cur.history.filter((x) => x.id !== local.id) });
      if (real) setShort(real);
      setErr(res && res.error ? (rpcMissing(res.error) ? 'Taking coins back switches on once the latest ZChat setup is finished.' : friendlyError(res.error, 'That did not work. Try again.')) : (row && row.reason) || 'That did not work. Try again.');
      return;
    }
    const left = Math.max(0, Number(row.coins) || 0);
    keep({ coins: left, history: cur.history });
    if (walletMem.uid === person.id && walletMem.data && walletMem.data.ready) { walletKeep(person.id, { ...walletMem.data, coins: left }); walletMem.mark = Date.now(); walletShow(); }
    setNote('');
    setDone(`${num(n)} ${coinWord(n)} taken back. ${first} gets a notification.`);
    adminLog(`Took back ${num(n)} ${coinWord(n)}`, person.id, person.name);
    load();
  };
  const tapTake = (all) => {
    const n = all ? have : amount;
    if (busy || !n || (!all && !canTake)) return;
    const msg = adminCoinNote(note);
    if (n > ADMIN_COIN_ASK) {
      onAsk({ title: `Take back ${num(n)} coins from ${first}?`, body: 'The coins leave their wallet right away and they get a notification.', label: `Take back ${num(n)} coins`, danger: true, run: () => take(n, msg) });
      return;
    }
    take(n, msg);
  };
  const allLeft = taking && !busy ? (tooMany ? have : short) : null;
  const hist = (w && w.history) || [];
  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0 6px' }}>
        <CoinIcon size={40} />
        <div style={{ minWidth: 0 }}>
          <div aria-label="Their coins" style={{ fontSize: 30, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{w ? num(w.coins) : err ? <span style={{ fontSize: 17, fontWeight: 700, color: theme.muted, letterSpacing: 0 }}>Not available yet</span> : <Spinner size={18} color={theme.muted} />}</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>{`${first}'s coins right now`}</div>
        </div>
      </div>
      <SegmentedControl value={mode} onChange={(k) => { if (k === mode) return; hapticTap(); setMode(k); setErr(''); setDone(''); setShort(null); }} options={[['give', 'Give'], ['take', 'Take back']]} style={{ marginTop: 12 }} />
      <KitSection title="How many" style={{ marginTop: 18 }}>
        <SegmentedControl value={ADMIN_COIN_QUICK.includes(amount) ? amount : null} onChange={pick} options={ADMIN_COIN_QUICK.map((n) => [n, num(n)])} />
        <input value={text} onChange={(e) => type(e.target.value)} inputMode="numeric" pattern="[0-9]*" aria-label="Number of coins" placeholder="Or type any amount" style={{ ...inputStyle(theme), marginTop: 10, fontVariantNumeric: 'tabular-nums' }} />
        <div style={{ fontSize: 12.5, color: (text && !valid) || tooMany || (taking && have === 0) ? theme.danger : theme.muted, padding: '6px 2px 0' }}>{text && !valid ? `Pick an amount from 1 to ${num(ADMIN_COIN_MAX)}` : taking && have === 0 ? `${first} has no coins to take back.` : tooMany ? `${first} only has ${num(have)} ${coinWord(have)}.` : `Any amount from 1 to ${num(ADMIN_COIN_MAX)}. Amounts over ${num(ADMIN_COIN_ASK)} ask you to confirm.`}</div>
        {allLeft ? <div style={{ paddingTop: 2 }}><AdminTextBtn label={`Take all ${num(allLeft)} instead`} ariaLabel={`Take all ${num(allLeft)} ${coinWord(allLeft)} instead`} tone="danger" onClick={() => tapTake(true)} /></div> : null}
      </KitSection>
      <KitSection title="Note" right={`${note.length}/80`} style={{ marginTop: 18 }}>
        <input value={note} onChange={(e) => { setNote(e.target.value.slice(0, 80)); setDone(''); }} maxLength={80} aria-label="Note for them" placeholder={taking ? 'Optional, they see it in the notification' : 'Optional, they see it in their coin history'} style={inputStyle(theme)} />
      </KitSection>
      {taking
        ? <button type="button" disabled={!canTake || busy} onClick={() => tapTake(false)} aria-label={valid ? `Take back ${num(amount)} ${coinWord(amount)}` : 'Take back coins'} className="zchat-press" style={{ ...primaryBtn(theme, !canTake || busy, theme.danger), marginTop: 16 }}>{valid ? `Take back ${num(amount)} ${coinWord(amount)}` : 'Take back coins'}</button>
        : <button type="button" disabled={!valid || busy} onClick={tapGive} aria-label={valid ? `Give ${num(amount)} ${coinWord(amount)}` : 'Give coins'} className="zchat-press" style={{ ...primaryBtn(theme, !valid || busy), marginTop: 16 }}>{valid ? `Give ${num(amount)} ${coinWord(amount)}` : 'Give coins'}</button>}
      <div ref={sayRef}>
        {err && <div role="alert" style={{ fontSize: 13.5, fontWeight: 600, color: theme.danger, padding: '10px 2px 0', lineHeight: 1.45 }}>{err}</div>}
        {done && !err && <div role="status" className="zchat-fade" style={{ fontSize: 13.5, fontWeight: 600, color: theme.ink, padding: '10px 2px 0', lineHeight: 1.45 }}>{done}</div>}
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '10px 2px 0', lineHeight: 1.5 }}>{taking ? `The coins leave ${first}'s wallet right away. Their coin history shows "Taken back by the ZChat team" and the notification shows your note.` : `The coins go straight to ${first}'s wallet. Their coin history shows your note, or "From the ZChat team" when there is no note.`}</div>
      <KitSection title="Recent coins" style={{ marginTop: 24 }}>
        {!w ? null : hist.length === 0 ? <div style={{ fontSize: 13.5, color: theme.muted, padding: '2px 0 6px' }}>No coin history yet.</div> : hist.map((r, i) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', boxShadow: adminHair(theme, i < hist.length - 1) }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminCoinLabel(r)}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>{adminDate(r.created_at)}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: Number(r.delta) > 0 ? '#16A34A' : theme.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Number(r.delta) > 0 ? `+${num(r.delta)}` : `\u2212${num(Math.abs(Number(r.delta)))}`}</div>
          </div>
        ))}
      </KitSection>
    </div>
  );
}

export function AdminUserPanel({ person, myId, onClose, onChanged, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const c = igPalette(theme);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState('info');
  const [giftKind, setGiftKind] = useState('frame');
  const [giftDays, setGiftDays] = useState(0);
  const [equipNow, setEquipNow] = useState(true);
  const [rKind, setRKind] = useState('chat');
  const [rHours, setRHours] = useState(24);
  const [rReason, setRReason] = useState('');
  const [msgs, setMsgs] = useState(null);
  const [eName, setEName] = useState(person.name || '');
  const [eUser, setEUser] = useState(person.username || '');
  const [eBio, setEBio] = useState(person.bio || '');
  const [mTitle, setMTitle] = useState('');
  const [mBody, setMBody] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [actKind, setActKind] = useState('posts');
  const [actPick, setActPick] = useState(false);
  const [confirmDo, setConfirmDo] = useState(null);
  const [multi, setMulti] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const togglePick = (k) => setPicked((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const load = async () => {
    const { data: d, error: e } = await supabase.rpc('admin_user_overview', { p_user_id: person.id });
    if (e) { setError(friendlyError(e, 'Could not load this person. Run the admin SQL files first.')); return; }
    setError('');
    setData(d || {});
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    supabase.rpc('admin_table_rows', { p_table: 'admins', p_search: person.id, p_limit: 5, p_offset: 0 }).then(({ data: d }) => setIsAdminUser(!!(d && d.length)));
  }, [person.id]);
  useEffect(() => {
    if (section !== 'messages' || msgs) return;
    supabase.rpc('admin_user_messages', { p_user_id: person.id, p_limit: 60 }).then(({ data: d, error: e }) => {
      if (e) { setNote(friendlyError(e, 'Could not load messages.')); setMsgs([]); return; }
      setMsgs(d || []);
    });
  }, [section]);

  const act = async (fn, okText, after) => {
    if (busy) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res && res.error) { setNote(friendlyError(res.error, 'That did not work.')); return; }
    setNote(okText);
    adminLog(String(okText).replace(/\.$/, ''), person.id, profile.name);
    if (after) after(res);
    load();
  };

  const profile = (data && data.profile) || person;
  const overviewBio = data && data.profile ? data.profile.bio : undefined;
  useEffect(() => { if (person.bio === undefined && typeof overviewBio === 'string') setEBio((v) => v || overviewBio); }, [overviewBio]);
  const rewards = ((data && data.rewards) || []).filter(rewardActive);
  const restrictions = ((data && data.restrictions) || []).filter((r) => !r.lifted && new Date(r.until).getTime() > Date.now());
  const ownedKey = (kind, key) => rewards.find((r) => r.kind === kind && r.reward_key === key);
  const equippedKey = giftKind === 'frame' ? profile.avatar_frame : giftKind === 'nameplate' ? profile.nameplate : giftKind === 'effect' || giftKind === 'reaction' ? null : giftKind === 'namestyle' ? profile.name_style : giftKind === 'theme' ? profile.profile_theme : profile.custom_badge;
  const catalog = giftKind === 'frame' ? DECOR_FRAME_CATALOG : giftKind === 'nameplate' ? DECOR_PLATE_CATALOG : giftKind === 'effect' ? DECOR_EFFECT_CATALOG : CX_KINDS.includes(giftKind) ? cxAdminCatalog(giftKind) : CUSTOM_BADGES;
  const fieldOf = (kind) => (kind === 'frame' ? 'avatar_frame' : kind === 'nameplate' ? 'nameplate' : kind === 'effect' || kind === 'reaction' ? null : kind === 'namestyle' ? 'name_style' : kind === 'theme' ? 'profile_theme' : 'custom_badge');
  const rpcOk = (res) => (res && !res.error && res.data && res.data.ok === false ? { ...res, error: { message: res.data.reason || 'That did not work.' } } : res);
  const zGrant = (kind, key) => supabase.rpc('zchat_admin_grant', { p_user: person.id, p_kind: kind, p_key: key, p_days: giftDays || null }).then(rpcOk);
  const zRevoke = (kind, key) => supabase.rpc('zchat_admin_revoke', { p_user: person.id, p_kind: kind, p_key: key }).then(rpcOk);
  const noFn = (res) => !!(res && res.error && (res.error.code === 'PGRST202' || /could not find the function/i.test(String(res.error.message || ''))));
  const adminGrant = (kind, key, equip) => (kind === 'effect' || CX_KINDS.includes(kind)
    ? zGrant(kind, key)
    : supabase.rpc('admin_grant_reward', { p_user_id: person.id, p_kind: kind, p_key: key, p_days: giftDays, p_equip: equip }).then((res) => (noFn(res) ? zGrant(kind, key) : res)));
  const adminRevoke = (kind, key) => (kind === 'effect' || CX_KINDS.includes(kind)
    ? zRevoke(kind, key)
    : supabase.rpc('admin_revoke_reward', { p_user_id: person.id, p_kind: kind, p_key: key }).then((res) => (noFn(res) ? zRevoke(kind, key) : res)));
  const isSelf = person.id === myId;

  const code = { background: theme.rowBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: 12 };
  const line = (label, value) => (
    <div key={label} style={{ display: 'flex', gap: 12, padding: '10px 0', boxShadow: `inset 0 0.5px 0 ${theme.hair}`, fontSize: 13.5 }}>
      <div style={{ width: 118, flexShrink: 0, color: theme.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 0, color: theme.ink, wordBreak: 'break-word' }}>{value == null || value === '' ? 'none' : String(value)}</div>
    </div>
  );
  const pickMark = (on) => (
    <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, boxSizing: 'border-box', border: on ? 'none' : `1.6px solid ${theme.muted2}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms ease' }}>
      {on && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
    </span>
  );
  const switchRow = (label, sub, on, flip) => (
    <div role="button" aria-label={label} aria-pressed={!!on} onClick={flip} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54, padding: '4px 0', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{sub}</div>}
      </div>
      <IgToggle on={!!on} />
    </div>
  );
  const rarityColor = (spec) => (RARITY_STYLE[spec.rarity] || RARITY_STYLE.epic).color;

  const giveMany = async () => {
    if (busy || !picked.size) return;
    setBusy(true);
    const keys = [...picked].map((x) => x.split(':'));
    let ok = 0;
    let fail = null;
    const lastOf = {};
    keys.forEach(([kind, key]) => { lastOf[kind] = key; });
    for (const [kind, key] of keys) {
      const res = await adminGrant(kind, key, equipNow && lastOf[kind] === key);
      if (res && res.error) fail = res.error; else ok += 1;
    }
    setBusy(false);
    setNote(fail ? `${ok} given. ${friendlyError(fail, 'Some did not go through.')}` : `${ok} ${ok === 1 ? 'item' : 'items'} given.`);
    if (ok) adminLog(`Gave ${countWord(ok, 'item', 'items')}`, person.id, profile.name);
    if (equipNow && ok) { const patch = {}; Object.entries(lastOf).forEach(([kind, key]) => { if (fieldOf(kind) && !CX_KINDS.includes(kind)) patch[fieldOf(kind)] = key; }); if (Object.keys(patch).length) onChanged(patch); }
    setPicked(new Set());
    setMulti(false);
    load();
  };
  const ban = () => act(() => supabase.rpc('admin_ban', { p_user_id: person.id, p_reason: 'Banned by admin panel' }), 'Account banned.', () => onChanged({ banned: true }));
  const unban = () => act(() => supabase.rpc('admin_unban', { p_user_id: person.id }), 'Account unbanned.', () => onChanged({ banned: false }));
  const actions = [
    profile.banned ? [ShieldCheck, 'Unban account', unban, 'main'] : [Ban, 'Ban account', ban, 'danger'],
    [LogOut, 'Log out everywhere', () => setConfirmDo({ title: 'Log them out everywhere?', body: 'Every phone and browser they are logged in on is logged out.', label: 'Log out', run: () => act(() => supabase.rpc('admin_sign_out_user', { p_user_id: person.id }), 'Logged out everywhere.') }), null],
    [Lock, 'Turn off login approval', () => setConfirmDo({ title: 'Turn off login approval?', body: 'Only do this when they cannot reach any logged in device and lost their recovery codes. Their next login works right away.', label: 'Turn off', run: () => act(() => supabase.rpc('zchat_admin_login_approval_off', { p_user: person.id }).then(rpcOk), 'Login approval turned off.', (res) => { if (res && res.data && res.data.was === false) setNote('Login approval was already off.'); }) }), null],
    [isAdminUser ? ShieldOff : ShieldAlert, isAdminUser ? 'Remove admin' : 'Make admin', () => setConfirmDo({ title: isAdminUser ? 'Remove admin access?' : 'Make them an admin?', body: isAdminUser ? 'They lose the admin panel.' : 'They get this whole panel, including private messages and data.', label: isAdminUser ? 'Remove' : 'Make admin', danger: !isAdminUser, run: () => act(() => supabase.rpc('admin_set_admin', { p_user_id: person.id, p_on: !isAdminUser }), isAdminUser ? 'Admin removed.' : 'Admin added.', () => setIsAdminUser(!isAdminUser)) }), null],
    [MessageSquare, 'Remove their messages', () => setConfirmDo({ title: `Remove every message ${profile.name} sent?`, body: 'Use this for spam. Their messages disappear from every chat and cannot come back. Messages other people sent them stay.', label: 'Remove messages', danger: true, run: () => act(() => supabase.rpc('admin_remove_user_messages', { p_user_id: person.id, p_hours: null }), 'Messages removed.', (res) => { const n = Number(res && res.data && res.data.messages_removed); if (Number.isFinite(n)) setNote(`${countWord(n, 'message', 'messages')} removed.`); }) }), 'danger'],
    [Trash2, 'Delete account', () => setConfirmDo({ title: `Delete ${profile.name} for good?`, body: 'They can never log in again and their profile shows as Deleted Account. Chats with them stay for everyone else.', label: 'Delete account', danger: true, run: () => act(() => supabase.rpc('admin_delete_user', { p_user_id: person.id }), 'Account deleted.', () => onClose()) }), 'danger'],
  ];
  const pauseBlocked = busy || isSelf || !!profile.is_bot;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: c.bg, display: 'flex', flexDirection: 'column', isolation: 'isolate' }} className="zchat-panel-open">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 12px 6px 4px', paddingTop: 'calc(4px + env(safe-area-inset-top))' }}>
        <div role="button" aria-label="Back" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, flexShrink: 0 }}><ArrowLeft size={24} strokeWidth={2} /></div>
        <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', flexShrink: 0 }}><Avatar emoji={profile.avatar} name={profile.name} size={34} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</div>
          <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{profile.username}{profile.banned ? ', banned' : ''}</div>
        </div>
        <AdminTextBtn label="Profile" tone="main" onClick={() => onOpenProfile(profile)} />
      </div>
      <KitTabs label="Account sections" value={section} onChange={(k) => { setSection(k); setNote(''); }} options={[['info', 'Info'], ['gifts', 'Gifts'], ['restrict', 'Restrict'], ['activity', 'Activity'], ['edit', 'Edit'], ['messages', 'Messages'], ['raw', 'Raw']]} style={{ padding: '0 8px', flexShrink: 0 }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '8px 16px 0', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        {note && <AdminNote text={note} />}
        {error && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{error}</div>}
        {!data && !error && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>}

        {data && (section === 'info' || section === 'gifts') && (
          <div style={{ padding: '6px 0 14px', textAlign: 'center', overflow: 'hidden' }}>
            {isDecorKey(profile.avatar_frame) || isDecorKey(profile.nameplate) ? (
              <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate' }}><ProfileDecorHero profile={profile} photo={profile.avatar} frameKey={isDecorKey(profile.avatar_frame) ? profile.avatar_frame : null} plateKey={isDecorKey(profile.nameplate) ? profile.nameplate : null} maxWidth={320} gapColor={c.bg} /></div>
            ) : (
              <>
                <div style={{ display: 'inline-block', position: 'relative', zIndex: 0, isolation: 'isolate' }}><Avatar emoji={profile.avatar} name={profile.name} size={104} /></div>
                <div style={{ marginTop: 10, fontWeight: 800, fontSize: 19, color: theme.ink, display: 'flex', justifyContent: 'center' }}><NameBadge name={profile.name} verified={profile.verified} custom={profile.custom_badge} size={18} style={{ justifyContent: 'center' }} /></div>
              </>
            )}
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 6 }}>This is exactly how they look in ZChat right now.</div>
          </div>
        )}

        {data && section === 'info' && (
          <>
            <div style={{ boxShadow: `inset 0 -0.5px 0 ${theme.hair}` }}>
              {line('Email', data.auth && data.auth.email)}
              {line('Phone', data.auth && data.auth.phone)}
              {line('User id', profile.id)}
              {line('Joined', adminDate(data.auth && data.auth.created_at))}
              {line('Last login', adminDate(data.auth && data.auth.last_sign_in_at))}
              {line('Last seen', adminDate(profile.last_seen))}
              {line('Messages sent', data.messages_sent)}
              {line('Posts', data.posts)}
              {line('Stories', data.stories)}
              {line('Reports against', data.reports_against)}
              {line('Badge', profile.verified)}
              {line('Private account', profile.is_private ? 'yes' : 'no')}
            </div>
            {!isSelf && !profile.is_bot && (
              <KitSection title="Actions" style={{ marginTop: 24 }}>
                {actions.map(([Icon, label, fn, tone], i) => (
                  <div key={label} role="button" aria-disabled={busy || undefined} onClick={busy ? undefined : fn} className={busy ? undefined : 'zchat-row-press'}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 50, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1, color: tone === 'danger' ? theme.danger : tone === 'main' ? kitOnInk(theme) : theme.ink, boxShadow: adminHair(theme, i < actions.length - 1) }}>
                    <Icon size={20} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
                  </div>
                ))}
              </KitSection>
            )}
          </>
        )}

        {data && section === 'gifts' && (
          <>
            <SegmentedControl value={CX_KINDS.includes(giftKind) ? 'namestyle' : giftKind} onChange={setGiftKind} options={[['frame', 'Frames'], ['nameplate', 'Plates'], ['effect', 'Effects'], ['charm', 'Charms'], ...(cxFlag.on ? [['namestyle', 'Styles']] : []), ['badge', 'Badges'], ['coins', 'Coins']]} dense style={{ margin: '2px 0 8px' }} />
            {CX_KINDS.includes(giftKind) && <SegmentedControl value={giftKind} onChange={(k) => { setGiftKind(k); setPicked(new Set()); }} options={[['namestyle', 'Name styles'], ['theme', 'Themes'], ['reaction', 'Super reactions']]} dense style={{ margin: '0 0 8px' }} />}
            {giftKind === 'coins' && <AdminCoins person={profile} onAsk={setConfirmDo} />}
            {giftKind !== 'badge' && giftKind !== 'coins' && (
              <>
                {switchRow('Give several', multi ? `${picked.size} picked` : 'Pick a few, then give them all at once', multi, () => { setMulti((v) => !v); setPicked(new Set()); })}
                {multi && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '0 0 4px' }}>
                    <AdminTextBtn label="Select all here" tone="main" onClick={() => setPicked((prev) => { const n = new Set(prev); Object.keys(catalog).forEach((key) => n.add(`${giftKind}:${key}`)); return n; })} />
                    {picked.size > 0 && <AdminTextBtn label="Clear" onClick={() => setPicked(new Set())} />}
                  </div>
                )}
                <KitSection title="How long" style={{ marginTop: 12 }}>
                  <SegmentedControl value={giftDays} onChange={setGiftDays} options={ADMIN_GRANT_DAYS} />
                </KitSection>
                {giftKind !== 'effect' && !CX_KINDS.includes(giftKind) && <div style={{ marginTop: 6 }}>{switchRow('Wear it right away', null, equipNow, () => setEquipNow((v) => !v))}</div>}
                <div style={{ height: 1, background: theme.hair, margin: '6px 0 0' }} />
              </>
            )}
            {giftKind === 'coins' ? null : giftKind === 'badge' ? (
              [['', 'No badge', theme.muted], ...Object.entries(VERIFIED_TIERS).map(([k, t]) => [k, t.label, t.color])].map(([k, label], i, arr) => (
                <div key={k || 'none'} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '6px 0', boxShadow: adminHair(theme, i < arr.length - 1) }}>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center', minWidth: 0 }}><NameBadge name={profile.name} verified={k || null} size={20} /><span style={{ fontSize: 12.5, color: theme.muted, fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>{label}</span></span>
                  {(profile.verified || '') === k
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), flexShrink: 0 }}><Check size={16} strokeWidth={2.8} />Active</span>
                    : <AdminTextBtn label="Set" tone="main" disabled={busy} onClick={() => act(() => supabase.rpc('admin_set_verified', { p_user_id: person.id, p_tier: k || null }), 'Badge updated.', () => onChanged({ verified: k || null }))} />}
                </div>
              ))
            ) : Object.entries(catalog).map(([key, spec], i, arr) => {
              const own = ownedKey(giftKind, key);
              const worn = equippedKey === key;
              const sel = picked.has(`${giftKind}:${key}`);
              const status = worn ? 'Worn now' : own ? (own.expires_at ? `Owned until ${adminDate(own.expires_at)}` : 'Owned forever') : 'Not owned';
              const preview = giftKind === 'frame' || giftKind === 'effect'
                ? <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', flexShrink: 0 }}><DecorFrameBadge setKey={key} size={76} photo={profile.avatar} name={profile.name} lazy /></div>
                : giftKind === 'charm'
                  ? <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center' }}><NameBadge name={profile.name} verified={profile.verified} custom={key} size={30} /></div>
                  : CX_KINDS.includes(giftKind) ? <TradeArt kind={giftKind} k={key} size={64} photo={profile.avatar} name={profile.name} /> : null;
              return (
                <div key={key} role={multi ? 'button' : undefined} aria-label={multi ? `Pick ${spec.label}` : undefined} aria-pressed={multi ? sel : undefined} onClick={multi ? () => togglePick(`${giftKind}:${key}`) : undefined} className={multi ? 'zchat-row-press' : undefined}
                  style={{ padding: '12px 0', cursor: multi ? 'pointer' : 'default', boxShadow: adminHair(theme, i < arr.length - 1) }}>
                  {giftKind === 'nameplate' && (
                    <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', borderRadius: 12, marginBottom: 10, background: '#101119' }}>
                      <DecorPlateOnly setKey={key} width={260} name={profile.name} username={profile.username} verified={profile.verified} custom={profile.custom_badge} lazy />
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {preview}
                    {giftKind !== 'charm' && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{spec.label}</div>
                        <div style={{ fontSize: 12.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: rarityColor(spec), fontWeight: 700, textTransform: 'capitalize' }}>{spec.rarity || 'epic'}</span><span style={{ color: theme.muted }}>{`, ${status.toLowerCase()}`}</span></div>
                      </div>
                    )}
                    {multi ? pickMark(sel) : (
                      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                        {own && <AdminTextBtn label="Remove" tone="danger" disabled={busy} onClick={() => act(() => adminRevoke(giftKind, key), 'Removed.', () => { if (worn && fieldOf(giftKind)) onChanged({ [fieldOf(giftKind)]: null }); })} />}
                        <AdminTextBtn label={own ? 'Renew' : 'Give'} tone="main" disabled={busy} onClick={() => act(() => adminGrant(giftKind, key, equipNow), 'Given.', () => { if (equipNow && fieldOf(giftKind) && !CX_KINDS.includes(giftKind)) onChanged({ [fieldOf(giftKind)]: key }); })} />
                      </div>
                    )}
                  </div>
                  {giftKind === 'charm' && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 4 }}>{`${spec.label}, ${status.toLowerCase()}`}</div>}
                </div>
              );
            })}
            {multi && picked.size > 0 && giftKind !== 'coins' && (
              <div style={{ position: 'sticky', bottom: 0, padding: '10px 0 6px', background: c.bg, zIndex: 4 }}>
                <BigButton label={busy ? 'Giving' : `Give ${picked.size} ${picked.size === 1 ? 'item' : 'items'}`} disabled={busy} onClick={giveMany} />
              </div>
            )}
          </>
        )}

        {data && section === 'restrict' && (
          <>
            <KitSection title="Pause something for a while" style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, marginBottom: 12 }}>They get a Mail telling them when it ends. The database enforces it, so it cannot be skipped.</div>
              <SegmentedControl value={rKind} onChange={setRKind} options={ADMIN_RESTRICT_KINDS} />
            </KitSection>
            <KitSection title="How long" style={{ marginTop: 20 }}>
              <ChoiceList label="How long" value={rHours} onChange={setRHours} options={ADMIN_RESTRICT_HOURS.map(([h, l]) => ({ k: h, label: l }))} />
            </KitSection>
            <input style={{ ...inputStyle(theme), marginTop: 14 }} placeholder="Reason, they will see it" aria-label="Reason" value={rReason} onChange={(e) => setRReason(e.target.value)} />
            <button style={primaryBtn(theme, pauseBlocked, theme.danger)} disabled={pauseBlocked} onClick={() => act(() => supabase.rpc('admin_restrict', { p_user_id: person.id, p_kind: rKind, p_hours: rHours, p_reason: rReason }), 'Pause applied.', () => setRReason(''))}>{busy ? <Spinner /> : 'Apply pause'}</button>
            <KitSection title="Active pauses" style={{ marginTop: 28 }}>
              {restrictions.length === 0 ? <div style={{ color: theme.muted, fontSize: 13.5, padding: '2px 0' }}>None right now.</div> : restrictions.map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 56, padding: '6px 0', boxShadow: adminHair(theme, i < restrictions.length - 1) }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink }}>{(ADMIN_RESTRICT_KINDS.find((x) => x[0] === r.kind) || [0, r.kind])[1]} paused</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Until {adminDate(r.until)}{r.reason ? `, ${r.reason}` : ''}</div>
                  </div>
                  <AdminTextBtn label="Lift" tone="main" disabled={busy} onClick={() => act(() => supabase.rpc('admin_lift_restriction', { p_id: r.id }), 'Pause lifted.')} />
                </div>
              ))}
            </KitSection>
          </>
        )}

        {data && section === 'edit' && (
          <>
            <KitSection title="Edit profile" style={{ marginTop: 6 }}>
              <input style={inputStyle(theme)} placeholder="Name" aria-label="Name" value={eName} onChange={(e) => setEName(e.target.value)} />
              <div style={{ height: 10 }} />
              <input style={inputStyle(theme)} placeholder="Username" aria-label="Username" value={eUser} onChange={(e) => setEUser(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))} />
              <div style={{ height: 10 }} />
              <textarea style={{ ...inputStyle(theme), minHeight: 90, resize: 'vertical', fontFamily: FONT }} placeholder="Bio" aria-label="Bio" value={eBio} onChange={(e) => setEBio(e.target.value)} />
              <button style={primaryBtn(theme, busy)} disabled={busy} onClick={() => act(() => supabase.rpc('admin_update_profile', { p_user_id: person.id, p_name: eName.trim(), p_username: eUser.trim(), p_bio: eBio }), 'Profile saved.', () => onChanged({ name: eName.trim() || person.name, username: eUser.trim() || person.username, bio: eBio }))}>{busy ? <Spinner /> : 'Save changes'}</button>
            </KitSection>
            <KitSection title="Send a Mail to this person" style={{ marginTop: 30 }}>
              <div style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>Only they will see it.</div>
              <input style={inputStyle(theme)} placeholder="Title" aria-label="Mail title" maxLength={80} value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
              <div style={{ height: 10 }} />
              <textarea style={{ ...inputStyle(theme), minHeight: 90, resize: 'vertical', fontFamily: FONT }} placeholder="Message" aria-label="Mail message" maxLength={1000} value={mBody} onChange={(e) => setMBody(e.target.value)} />
              <button style={primaryBtn(theme, busy || !mTitle.trim() || !mBody.trim())} disabled={busy || !mTitle.trim() || !mBody.trim()} onClick={() => act(() => supabase.rpc('admin_send_mail', { p_user_id: person.id, p_title: mTitle.trim(), p_body: mBody.trim() }), 'Mail sent.', () => { setMTitle(''); setMBody(''); })}>{busy ? <Spinner /> : 'Send mail'}</button>
            </KitSection>
          </>
        )}

        {section === 'activity' && (
          <>
            <div role="button" aria-label="Choose what to show" onClick={() => setActPick(true)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50, cursor: 'pointer', boxShadow: `inset 0 -0.5px 0 ${theme.hair}`, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>Show</span>
              <span style={{ fontSize: 14.5, color: theme.muted }}>{(ADMIN_ACTIVITY_KINDS.find((x) => x[0] === actKind) || ADMIN_ACTIVITY_KINDS[0])[1]}</span>
              <ChevronRight size={17} color={theme.muted} />
            </div>
            <AdminRowList key={actKind} table={actKind} search={person.id} empty="Nothing found for this person." />
            {actPick && <ChoiceSheet title="Show activity" options={ADMIN_ACTIVITY_KINDS} value={actKind} onPick={(k) => { setActKind(k); setActPick(false); }} onClose={() => setActPick(false)} />}
          </>
        )}

        {section === 'messages' && (
          msgs === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
          : msgs.length === 0 ? <div style={{ color: theme.muted, fontSize: 13, textAlign: 'center', padding: 30 }}>No messages found.</div>
          : msgs.map((m, i) => (
            <div key={m.id} style={{ padding: '11px 0', boxShadow: adminHair(theme, i < msgs.length - 1) }}>
              <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600 }}>{`${m.sender_id === person.id ? 'Sent' : 'Received'}, ${adminWords(m.type)}${m.group_id ? ', group' : ''}, ${adminDate(m.created_at)}`}</div>
              <div style={{ fontSize: 14, color: theme.ink, marginTop: 4, wordBreak: 'break-word', lineHeight: 1.4 }}>{m.deleted ? 'Deleted message' : String(m.content || m.media_url || '').slice(0, 400)}</div>
            </div>
          ))
        )}

        {data && section === 'raw' && (
          <pre style={{ ...code, fontSize: 11.5, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '4px 0 0' }}>{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
      {confirmDo && <AdminSheet title={confirmDo.title} body={confirmDo.body} confirmLabel={confirmDo.label} danger={confirmDo.danger} busy={busy} onConfirm={async () => { const run = confirmDo.run; setConfirmDo(null); await run(); }} onClose={() => setConfirmDo(null)} />}
    </div>
  );
}

async function adminResolveNames(rows, known) {
  const ids = new Set();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  rows.forEach((r) => Object.keys(r).forEach((k) => { if (/(_id|_by)$/.test(k) && k !== 'id' && typeof r[k] === 'string' && uuid.test(r[k]) && !(known && known[r[k]])) ids.add(r[k]); }));
  const list = [...ids].slice(0, 120);
  if (!list.length) return {};
  const { data } = await supabase.from('profiles').select('id, name, username').in('id', list);
  const out = {};
  (data || []).forEach((p) => { out[p.id] = `${p.name} (@${p.username})`; });
  return out;
}

function AdminRowCard({ table, row, names, onDeleted, onSaved }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const canAct = row.id !== undefined && row.id !== null && table !== 'admins' && table !== 'admin_log';
  const keys = Object.keys(row);
  const shown = open ? keys : keys.slice(0, 4);
  const show = (k, v) => {
    if (v === null || v === undefined) return 'none';
    if (typeof v === 'string' && names && names[v]) return names[v];
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  };
  const isVideo = row.media_type === 'video' || /\.(mp4|mov|webm)(\?|$)/i.test(String(row.media_url || ''));
  const save = async () => {
    let parsed;
    try { parsed = JSON.parse(text); } catch { setErr('That is not valid JSON.'); return; }
    const patch = {};
    Object.keys(parsed).forEach((k) => { if (k !== 'id' && JSON.stringify(parsed[k]) !== JSON.stringify(row[k])) patch[k] = parsed[k]; });
    if (!Object.keys(patch).length) { setEditing(false); return; }
    setBusy(true);
    const { error } = await supabase.rpc('admin_update_row', { p_table: table, p_id: String(row.id), p_patch: patch });
    setBusy(false);
    if (error) { setErr(friendlyError(error, 'Could not save that.')); return; }
    setEditing(false); setErr('');
    if (onSaved) onSaved({ ...row, ...patch });
  };
  const del = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('admin_delete_row', { p_table: table, p_id: String(row.id) });
    setBusy(false);
    setConfirm(false);
    if (error) { setErr(friendlyError(error, 'Could not delete that.')); return; }
    if (onDeleted) onDeleted();
  };
  return (
    <div style={{ padding: '12px 0 6px', boxShadow: `inset 0 -0.5px 0 ${theme.hair}` }}>
      <div role="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        {shown.map((k) => (
          <div key={k} style={{ display: 'flex', gap: 10, fontSize: 13, padding: '2px 0' }}>
            <div style={{ width: 104, flexShrink: 0, color: theme.muted, fontWeight: 600, wordBreak: 'break-word' }}>{adminWords(k)}</div>
            <div style={{ flex: 1, minWidth: 0, color: theme.ink, wordBreak: 'break-word' }}>{show(k, row[k]).slice(0, open ? 2000 : 90)}</div>
          </div>
        ))}
        {!open && keys.length > 4 && <div style={{ fontSize: 12.5, color: kitOnInk(theme), fontWeight: 700, marginTop: 4 }}>{`Tap for all ${keys.length} fields`}</div>}
      </div>
      {row.media_url && typeof row.media_url === 'string' && (isVideo
        ? <MediaVideo src={row.media_url} controls playsInline preload="metadata" style={{ width: '100%', maxHeight: 220, borderRadius: 12, marginTop: 8, background: '#000' }} />
        : <MediaImg live src={row.media_url} loading="lazy" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginTop: 8 }} />)}
      {err && <div style={{ color: theme.danger, fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{err}</div>}
      {canAct && (
        <div style={{ display: 'flex', gap: 20, marginTop: 2 }}>
          <AdminTextBtn label="Edit" tone="main" onClick={() => { setText(JSON.stringify(row, null, 2)); setErr(''); setEditing(true); }} />
          <AdminTextBtn label="Delete" tone="danger" onClick={() => setConfirm(true)} />
        </div>
      )}
      {editing && (
        <AdminSheet title={`Edit row in ${adminWords(table)}`} body="Change the values you want. Only changed fields are saved." confirmLabel="Save changes" busy={busy} onConfirm={save} onClose={() => setEditing(false)}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} style={{ ...inputStyle(theme), minHeight: 260, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, resize: 'vertical' }} />
          {err && <div style={{ color: theme.danger, fontSize: 12.5, fontWeight: 700, marginTop: 8 }}>{err}</div>}
        </AdminSheet>
      )}
      {confirm && <AdminSheet title="Delete this row?" body={`It is removed from ${adminWords(table)} for good.`} confirmLabel="Delete it" danger busy={busy} onConfirm={del} onClose={() => setConfirm(false)} />}
    </div>
  );
}

function AdminRowList({ table, search, empty }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [names, setNames] = useState({});
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const PAGE = 25;
  const fetchPage = async (offset) => {
    setLoading(true);
    const { data, error: e } = await supabase.rpc('admin_table_rows', { p_table: table, p_search: search || '', p_limit: PAGE, p_offset: offset });
    if (e) { setError(friendlyError(e, 'Could not load this.')); setRows((p) => p || []); setLoading(false); return; }
    setError('');
    const list = data || [];
    const extra = await adminResolveNames(list, names);
    setNames((prev) => ({ ...prev, ...extra }));
    setRows((prev) => (offset === 0 ? list : [...(prev || []), ...list]));
    setMore(list.length === PAGE);
    setLoading(false);
  };
  useEffect(() => { setRows(null); fetchPage(0); }, [table, search]);
  return (
    <>
      {error && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '8px 0 10px' }}>{error}</div>}
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.ink} /></div>
        : rows.length === 0 ? <div style={{ textAlign: 'center', color: theme.muted, fontSize: 13, padding: 28 }}>{empty || 'Nothing here.'}</div>
        : rows.map((r, i) => (
          <AdminRowCard key={r.id !== undefined ? r.id : i} table={table} row={r} names={names}
            onDeleted={() => setRows((prev) => prev.filter((x) => x !== r))}
            onSaved={(nr) => setRows((prev) => prev.map((x) => (x === r ? nr : x)))} />
        ))}
      {!loading && more && <div role="button" onClick={() => fetchPage(rows.length)} style={{ textAlign: 'center', padding: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Load more</div>}
    </>
  );
}

function AdminDataBrowser() {
  const { theme } = useTheme();
  const [tables, setTables] = useState(null);
  const [error, setError] = useState('');
  const [table, setTable] = useState(null);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [names, setNames] = useState({});
  const PAGE = 30;
  useBackClose(!!table, () => { setTable(null); setRows([]); setError(''); });

  useEffect(() => {
    supabase.rpc('admin_list_tables').then(({ data, error: e }) => {
      if (e) { setError(friendlyError(e, 'Could not list tables. Run the admin SQL files first.')); return; }
      setTables(data || []);
    });
  }, []);

  const fetchRows = async (name, text, offset) => {
    setLoading(true);
    const { data, error: e } = await supabase.rpc('admin_table_rows', { p_table: name, p_search: text, p_limit: PAGE, p_offset: offset });
    setLoading(false);
    if (e) { setError(friendlyError(e, 'Could not read that table.')); return; }
    setError('');
    const list = data || [];
    const extra = await adminResolveNames(list, names);
    setNames((prev) => ({ ...prev, ...extra }));
    setRows((prev) => (offset === 0 ? list : [...prev, ...list]));
    setMore(list.length === PAGE);
  };
  useEffect(() => {
    if (!table) return undefined;
    const t = setTimeout(() => { fetchRows(table, search, 0); }, 300);
    return () => clearTimeout(t);
  }, [table, search]);

  const errBox = error ? <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{error}</div> : null;

  if (!table) {
    const list = tables || [];
    return (
      <>
        {errBox}
        {tables === null && !error ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div> : (
          <KitSection title="Tables" right={list.length ? `${list.length}` : null} style={{ marginTop: 6 }}>
            {!list.length && <div style={{ color: theme.muted, fontSize: 13, padding: '4px 0' }}>Nothing to browse yet.</div>}
            {list.map((t, i) => (
              <div key={t.name} role="button" onClick={() => { setTable(t.name); setSearch(''); setRows([]); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 50, cursor: 'pointer', boxShadow: adminHair(theme, i < list.length - 1) }}>
                <Database size={18} strokeWidth={1.8} color={theme.muted} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminWords(t.name)}</div>
                <div style={{ fontSize: 13.5, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{t.rows == null ? '' : formatCount(Number(t.rows) || 0)}</div>
                <ChevronRight size={16} color={theme.muted} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </KitSection>
        )}
      </>
    );
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px -10px' }}>
        <div role="button" aria-label="Back to tables" onClick={() => { setTable(null); setRows([]); setError(''); }} className="zchat-press" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, flexShrink: 0 }}><ArrowLeft size={20} /></div>
        <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminWords(table)}</div>
      </div>
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 14, top: 15 }} />
        <input style={{ ...inputStyle(theme), paddingLeft: 40 }} placeholder="Search inside this table" aria-label="Search inside this table" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {errBox}
      {rows.map((r, i) => (
        <AdminRowCard key={r.id !== undefined ? r.id : i} table={table} row={r} names={names}
          onDeleted={() => setRows((prev) => prev.filter((x) => x !== r))}
          onSaved={(nr) => setRows((prev) => prev.map((x) => (x === r ? nr : x)))} />
      ))}
      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={20} color={theme.ink} /></div>}
      {!loading && rows.length === 0 && !error && <div style={{ textAlign: 'center', color: theme.muted, fontSize: 13, padding: 30 }}>Nothing here.</div>}
      {!loading && more && <div role="button" onClick={() => fetchRows(table, search, rows.length)} style={{ textAlign: 'center', padding: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Load more</div>}
    </>
  );
}
