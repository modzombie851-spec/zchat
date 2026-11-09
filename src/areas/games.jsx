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
  Avatar,
  BigButton,
  ChatRowSheet,
  ConfirmSheet,
  CrownIcon,
  ANIM_STICKERS,
  THEMES,
  ThemeContext,
  DetailRow,
  DetailSection,
  EmptyState,
  FONT,
  FRIEND_GAME_GROUPS,
  FRIEND_GAME_SUBS,
  FullPage,
  G1BallDots,
  G1Canvas,
  G1WelcomeCardBody,
  G1_LEVELS,
  G2EmoImg,
  G2EmojiGrid,
  GA2_PLAYERS,
  GA2_SUBS,
  GAME_ART_BG,
  GAME_RULES,
  GAME_TITLES,
  GH_CARDS,
  GH_GROUP_MORE,
  GH_SECRET,
  Ga1TextBtn,
  GameAgainButton,
  GameArt,
  GameButton,
  GameCardShell,
  GameInfoButton,
  GamepadIcon,
  GhViewCtx,
  GoneGameCard,
  HeaderIconButton,
  HowToPlaySheet,
  IgHeading,
  IgToggle,
  LIVE_GAME_KEYS,
  LineGlyph,
  MediaImg,
  NameBadge,
  PAINT_NAMES,
  PageArt,
  PickTiles,
  Pin_,
  Portal,
  QUIZ_POOL,
  ReactionBoard,
  SOLO_GAMES,
  SegmentedControl,
  SoloGame,
  Spinner,
  TrophyIcon,
  TugBoard,
  appSnack,
  copyTextToClipboard,
  countWord,
  detailsCardBg,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  formatGameScore,
  formatListTime,
  friendlyError,
  g1Clock,
  g1First,
  g1Mem,
  g1Name,
  g1Outcome,
  g1PoolLeft,
  g1Preview,
  g1Send,
  g1Test,
  g2EmoOf,
  g2EmoPut,
  g2KwOf,
  g2KwPing,
  g2KwUse,
  g2Write,
  g3Board,
  g3dk,
  g3lt,
  ga1Name,
  gameKeyTitle,
  gameNet,
  gameNetMissing,
  ghAfterMove,
  ghBotCan,
  ghBotLevel,
  ghEmit,
  ghEnv,
  ghErrText,
  ghFirst,
  ghLiveSet,
  ghMove,
  ghPlural,
  ghRoundLabel,
  ghRpc,
  hapticTap,
  inputStyle,
  isSoloGameKey,
  jsonAfter,
  kitOnInk,
  listenNow,
  listenSyncClock,
  loadImageElement,
  loadMyGames,
  newClientId,
  parseGameMessage,
  parseOnce,
  playUiSound,
  readBest,
  reducedMotion,
  rtDrop,
  rtKeep,
  rtName,
  rtReady,
  seededRandom,
  siteOrigin,
  timeAgoLong,
  useBackClose,
  useG1,
  useG2Emo,
  useG2Kw,
  useGhEnv,
  useGhPub,
  useGhSecret,
  useGhWatchers,
  useRtRefresh,
  useSheetDrag,
  useTheme,
} from '../App.jsx';
import { GameRoom, RoomButton, RoomSheet, sfx as kitSfx } from '../games/kit.jsx';
import {
  KitTabs,
  LIVE_GAME_INFO,
  MemberCrownGlyph,
  MemberRemoveGlyph,
  MemberTagGlyph,
  mutedUntilText,
} from './shared.jsx';

const G1_LOG = new Map();
const G1_FLOW = ['welcome', 'hi', 'hey', 'hello', 'glad', 'good', 'great', 'nice', 'thanks', 'thank', 'please', 'say', 'read', 'be', 'we', "we're", 'you', "you're", 'your', 'this', 'here', 'make', 'feel', 'take', 'check', 'so', 'enjoy', 'have', 'come', 'meet', 'join', 'it', "it's", 'our', 'introduce', 'tell', 'share', 'drop', 'start', 'happy', 'lovely', 'awesome'];
function g1Greeting(first, text) {
  const t = String(text || '');
  if (!first) return t;
  const w = (t.match(/^[A-Za-z']+/) || [''])[0].toLowerCase();
  return G1_FLOW.includes(w) ? `${first}, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : `${first}, ${t}`;
}

export function G1ListEditor({ title, subtitle, items, max, maxLen, placeholder, addLabel, hint, onSave, onClose, saveLabel }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => (items.length ? items.map((t, i) => ({ k: i, t })) : [{ k: 0, t: '' }]));
  const keyRef = useRef(rows.length);
  const refs = useRef({});
  const [focusKey, setFocusKey] = useState(null);
  useEffect(() => { if (focusKey != null && refs.current[focusKey]) { try { refs.current[focusKey].focus(); } catch {} } }, [focusKey]);
  const clean = rows.map((r) => r.t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const same = clean.length === items.length && clean.every((t, i) => t === items[i]);
  const add = () => { if (rows.length >= max) return; hapticTap(); const k = keyRef.current++; setRows((cur) => [...cur, { k, t: '' }]); setFocusKey(k); };
  return (
    <FullPage title={title} subtitle={subtitle} onBack={onClose} zIndex={82}
      footer={<BigButton label={saveLabel || 'Save'} disabled={same} onClick={() => onSave(clean)} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '6px 2px 14px' }}>{hint}</div>
      <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.k} className="zchat-fade" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, padding: '0 8px 0 14px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ flexShrink: 0, width: 18, fontSize: 14.5, fontWeight: 800, color: theme.coral, fontVariantNumeric: 'tabular-nums' }}>{i + 1}.</span>
            <input ref={(el) => { refs.current[r.k] = el; }} value={r.t} maxLength={maxLen} placeholder={i === 0 ? placeholder : ''} aria-label={`${title} ${i + 1}`} enterKeyHint={i === rows.length - 1 && rows.length < max ? 'next' : 'done'}
              onChange={(e) => { const v = e.target.value.slice(0, maxLen); setRows((cur) => cur.map((x) => (x.k === r.k ? { ...x, t: v } : x))); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (i === rows.length - 1) add(); else { const nx = rows[i + 1]; if (nx) setFocusKey(nx.k); } } }}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontSize: 15, fontFamily: FONT, padding: '14px 0' }} />
            {r.t.length > maxLen - 20 && <span style={{ flexShrink: 0, fontSize: 11.5, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{maxLen - r.t.length}</span>}
            <div role="button" aria-label={`Remove ${i + 1}`} onClick={() => { hapticTap(); setRows((cur) => (cur.length > 1 ? cur.filter((x) => x.k !== r.k) : [{ k: keyRef.current++, t: '' }])); }} className="zchat-press" style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
          </div>
        ))}
        {rows.length < max ? (
          <div role="button" aria-label={addLabel} onClick={add} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 50, padding: '0 14px', cursor: 'pointer', color: theme.coral }}>
            <Plus size={19} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{addLabel}</span>
          </div>
        ) : (
          <div style={{ padding: '13px 14px', fontSize: 13, color: theme.muted }}>{`You can add up to ${max}.`}</div>
        )}
      </div>
    </FullPage>
  );
}

export function G1WelcomePage({ group, sampleName, onSave, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [on, setOn] = useState(!!group.welcome_text);
  const [text, setText] = useState(group.welcome_text || '');
  const [named, setNamed] = useState(group.welcome_name !== false);
  const t = text.replace(/[ \t]+/g, ' ').trim();
  const changed = on ? (t !== (group.welcome_text || '') || named !== (group.welcome_name !== false)) : !!group.welcome_text;
  const first = String(sampleName || '').trim().split(' ')[0] || 'Sam';
  return (
    <FullPage title="Welcome message" subtitle={group.name} onBack={onClose} zIndex={82}
      footer={<BigButton label="Save" disabled={!changed || (on && !t)} onClick={() => onSave(on ? { welcome_text: t, welcome_name: named } : { welcome_text: null })} />}>
      <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden', marginTop: 8 }}>
        <DetailRow icon={<Smile />} label="Welcome new members" sub="ZChat posts a card from the group each time someone joins" onClick={() => setOn((v) => !v)} right={<IgToggle on={on} />} last={!on} />
        {on && <DetailRow icon={<User />} label="Start with their name" sub="Each new member sees their own first name first" onClick={() => setNamed((v) => !v)} right={<IgToggle on={named} />} last />}
      </div>
      {on && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '18px 4px 8px' }}>Message</div>
          <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, padding: '10px 14px 8px' }}>
            <textarea value={text} maxLength={300} rows={4} aria-label="Welcome message" placeholder="welcome to the group. Say hi and tell us a little about you."
              onChange={(e) => setText(e.target.value.slice(0, 300))}
              style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: theme.ink, fontSize: 15, lineHeight: 1.45, fontFamily: FONT }} />
            <div style={{ textAlign: 'right', fontSize: 11.5, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{text.length}/300</div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '18px 4px 10px' }}>What new members see</div>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0', borderRadius: 18, background: theme.bgGradient, border: `1px solid ${theme.border}` }}>
            <G1WelcomeCardBody name={group.name} avatar={group.avatar} text={t ? (named ? g1Greeting(first, t) : t) : 'Write a few words above to see the card.'} time={fmtHM(new Date())} />
          </div>
        </>
      )}
    </FullPage>
  );
}

const G1_SETTING_TEXT = {
  send_policy: (v) => (v === 'admins' ? 'made posting admins only' : 'let everyone post'),
  slow_secs: (v) => (Number(v) > 0 ? 'turned on slow mode' : 'turned off slow mode'),
  mention_all: (v) => (v === 'admins' ? 'made @everyone admins only' : 'let everyone use @everyone'),
  join_approval: (v) => (v ? 'turned on join approval' : 'turned off join approval'),
  invite_enabled: (v) => (v === false ? 'turned off the invite link' : 'turned on the invite link'),
  add_members_policy: (v) => (v === 'admins' ? 'made adding people admins only' : 'let everyone add people'),
  disappear_secs: (v) => (Number(v) > 0 ? 'turned on disappearing messages' : 'turned off disappearing messages'),
  wallpaper: () => 'changed the chat theme',
  accent: () => 'changed the group colour',
  topics: () => 'changed the topics',
  approve_posts: (v) => (v ? 'turned on post approval' : 'turned off post approval'),
  admin_links: (v) => (v ? 'made links admins only' : 'let everyone post links'),
  read_only: (v) => (v ? 'made the group read only' : 'turned off read only'),
  welcome_text: (v) => (v ? 'changed the welcome message' : 'turned off the welcome message'),
  welcome_name: () => 'changed the welcome message',
  join_questions: (v) => (v ? 'changed the join questions' : 'removed the join questions'),
  name_bar: () => 'changed the name bar',
};
function g1LogLine(r, nm) {
  const a = nm(r.actor_id);
  const t = nm(r.target_id);
  const d = r.detail || {};
  switch (r.action) {
    case 'created': return [<Users />, `${a} created the group`];
    case 'name': return [<Pencil />, `${a} renamed the group to "${d.to || ''}"`];
    case 'photo': return [<Camera />, `${a} changed the group photo`];
    case 'photo_off': return [<Camera />, `${a} removed the group photo`];
    case 'bio': return [<Pencil />, `${a} changed the description`];
    case 'owner': return [<MemberCrownGlyph size={20} />, `${a} made ${t} the owner`];
    case 'invite_reset': return [<LinkIcon />, `${a} reset the invite link`];
    case 'rules': return [<FileText />, d.n ? `${a} updated the group rules` : `${a} removed the group rules`];
    case 'setting': return [<SettingsIcon />, `${a} ${(G1_SETTING_TEXT[d.key] || (() => 'changed a setting'))(d.value)}`];
    case 'added': return [<UserPlus />, `${a} added ${t}`];
    case 'let_in': return [<UserPlus />, `${a} let ${t} in`];
    case 'joined': return [<UserPlus />, `${t} joined`];
    case 'removed': return [<MemberRemoveGlyph />, `${a} removed ${t}`];
    case 'left': return [<LogOut />, `${t} left`];
    case 'role': return [<ShieldCheck />, d.to === 'admin' ? `${a} made ${t} an admin` : d.to === 'moderator' ? `${a} made ${t} a moderator` : d.from === 'admin' ? `${a} removed ${t} as admin` : `${a} removed ${t} as moderator`];
    case 'muted': return [<MicOff />, `${a} muted ${t}`, d.until ? mutedUntilText(d.until).replace(/^Muted /, 'Until ').replace(/^Until until /, 'Until ') : 'Until they are unmuted'];
    case 'unmuted': return [<Mic />, `${a} unmuted ${t}`];
    case 'title': return [<MemberTagGlyph />, d.to ? `${a} gave ${t} the title "${d.to}"` : `${a} removed the title from ${t}`];
    case 'post_ok': return [<CheckCheck />, `${a} approved a post from ${t}`, d.text || null];
    case 'post_no': return [<X />, `${a} declined a post from ${t}`, d.text || null];
    case 'deleted': return [<Trash2 />, r.target_id ? `${a} deleted a message from ${t}` : `${a} deleted a post from the group`];
    case 'pinned': return [<Pin_ color="currentColor" />, `${a} pinned a message`];
    case 'room_kick': return [<MicOff />, `${a} removed ${t} from the voice room`];
    default: return [<SettingsIcon />, `${a} changed the group`];
  }
}

export function G1LogPage({ group, members, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => G1_LOG.get(group.id) || null);
  const [extra, setExtra] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('zchat_grp_log').select('id, actor_id, action, target_id, detail, created_at').eq('group_id', group.id).order('created_at', { ascending: false }).limit(200);
      if (!alive) return;
      if (error || !data) { setRows((cur) => cur || []); return; }
      G1_LOG.set(group.id, data);
      setRows(data);
      const known = new Set((members || []).map((m) => m.user_id));
      const need = [...new Set(data.flatMap((r) => [r.actor_id, r.target_id]).filter((x) => x && !known.has(x)))].slice(0, 60);
      if (!need.length) return;
      const { data: profs } = await fetchProfilesView(need);
      if (!alive || !profs) return;
      const map = {};
      profs.forEach((p) => { map[p.id] = p.name || p.username; });
      setExtra(map);
    })();
    return () => { alive = false; };
  }, [group.id]);
  const nm = (uid) => (!uid ? 'Someone' : g1Name(members, uid, extra[uid] || 'Someone'));
  const dayOf = (iso) => { const d = new Date(iso); const n = new Date(); const y = new Date(); y.setDate(n.getDate() - 1); return d.toDateString() === n.toDateString() ? 'Today' : d.toDateString() === y.toDateString() ? 'Yesterday' : fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' }); };
  let lastDay = '';
  return (
    <FullPage title="Recent actions" subtitle="Last 90 days" onBack={onClose} zIndex={82}>
      {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 34 }}><Spinner size={18} color={theme.muted} /></div>}
      {rows && !rows.length && <EmptyState art="insights" title="Nothing yet" text="When admins add or remove people, change settings or check posts, it shows up here." />}
      {(rows || []).map((r) => {
        const [icon, text, sub] = g1LogLine(r, nm);
        const day = dayOf(r.created_at);
        const head = day !== lastDay;
        lastDay = day;
        return (
          <React.Fragment key={r.id}>
            {head && <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 4px 6px' }}>{day}</div>}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 4px' }}>
              <span style={{ display: 'flex', color: theme.ink, flexShrink: 0, marginTop: 1 }}>{React.cloneElement(icon, { size: 19 })}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.4, color: theme.ink, wordBreak: 'break-word' }}>{text}</div>
                {sub ? <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div> : null}
              </div>
              <span style={{ flexShrink: 0, fontSize: 12, color: theme.muted, marginTop: 2 }}>{fmtHM(new Date(r.created_at))}</span>
            </div>
          </React.Fragment>
        );
      })}
    </FullPage>
  );
}

export function G1ReviewPage({ group, rows, members, onReview, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [busyAll, setBusyAll] = useState(false);
  const approveAll = async () => {
    if (busyAll) return;
    setBusyAll(true);
    for (const r of rows.slice()) { await onReview(r, true); }
    setBusyAll(false);
  };
  return (
    <FullPage title="Posts to approve" subtitle={group.name} onBack={onClose} zIndex={82}
      footer={rows.length > 1 ? <BigButton label={`Approve all ${rows.length}`} disabled={busyAll} onClick={approveAll} /> : null}>
      {!rows.length && <EmptyState art="quiet" title="Nothing waiting" text="Posts from members show up here while Approve posts is on." />}
      {rows.map((r) => {
        const gm = (members || []).find((m) => m.user_id === r.sender_id);
        const p = r.payload || {};
        const img = p.type === 'image' && p.media_url && !parseOnce(p) ? p.media_url : null;
        return (
          <div key={r.id} className="zchat-fade" style={{ padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar emoji={gm && gm.profile ? gm.profile.avatar : null} name={g1Name(members, r.sender_id)} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g1Name(members, r.sender_id)}</div>
                <div style={{ fontSize: 12, color: theme.muted }}>{timeAgoLong(r.created_at)}</div>
              </div>
              <div role="button" aria-label={`Decline post from ${g1Name(members, r.sender_id)}`} onClick={() => onReview(r, false)} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={20} strokeWidth={2} /></div>
              <div role="button" aria-label={`Approve post from ${g1Name(members, r.sender_id)}`} onClick={() => onReview(r, true)} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>Approve</div>
            </div>
            <div style={{ marginTop: 9, marginLeft: 46, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {img && <MediaImg src={img} draggable={false} style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: theme.rowBg }} />}
              <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.45, color: theme.ink, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g1Preview(p)}</div>
            </div>
          </div>
        );
      })}
    </FullPage>
  );
}
function g2KwClean(w) { return String(w || '').replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 40); }
async function g2KwSave(uid, gid, words) {
  const o = g2KwUse(uid);
  const before = g2KwOf(gid);
  const list = [...new Set(words.map(g2KwClean).filter((w) => w.length >= 2 && /[\p{L}\p{N}]/u.test(w)))].slice(0, 10);
  o.rows = { ...o.rows };
  if (list.length) o.rows[gid] = list; else delete o.rows[gid];
  g2KwPing();
  let r = null;
  try {
    r = await supabase.from('zchat_grp_keywords').upsert({ user_id: uid, group_id: gid, words: list }, { onConflict: 'user_id,group_id' }).select('group_id, words').maybeSingle();
  } catch (e) { r = { error: e || { message: 'failed' } }; }
  if (o.uid !== uid) return false;
  if (r.error) {
    o.rows = { ...o.rows };
    if (before.length) o.rows[gid] = before; else delete o.rows[gid];
    g2KwPing();
    appSnack(friendlyError(r.error, "Couldn't save your words. Try again."));
    return false;
  }
  if (r.data && Array.isArray(r.data.words)) { o.rows = { ...o.rows }; if (r.data.words.length) o.rows[gid] = r.data.words; else delete o.rows[gid]; g2KwPing(); }
  g2Write(uid, 'kw', o.rows);
  return true;
}
export function G2KeywordsPage({ group, myId, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useG2Kw(myId);
  const [text, setText] = useState('');
  const words = g2KwOf(group.id);
  const clean = g2KwClean(text);
  const dup = words.includes(clean);
  const canAdd = clean.length >= 2 && /[\p{L}\p{N}]/u.test(clean) && !dup && words.length < 10;
  const add = () => { if (!canAdd) return; hapticTap(); setText(''); g2KwSave(myId, group.id, [...words, clean]); };
  return (
    <FullPage title="Alert me about" subtitle={group.name} onBack={onClose} zIndex={90}>
      <PageArt text="Get a notification when someone here writes one of these words, even if the group is muted. Only you can see your words." />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 40))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={words.length >= 10 ? 'You have 10 words' : 'A word or a short phrase'} aria-label="Word to alert you about" autoCapitalize="none" autoCorrect="off" enterKeyHint="done" disabled={words.length >= 10} style={{ ...inputStyle(theme), flex: 1, fontSize: 15.5 }} />
        <div role="button" aria-label="Add word" aria-disabled={!canAdd} onClick={add} className={canAdd ? 'zchat-press' : undefined} style={{ height: 44, padding: '0 18px', borderRadius: 12, background: canAdd ? theme.coral : theme.soft, color: canAdd ? '#FFFFFF' : theme.muted, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: canAdd ? 'pointer' : 'default', flexShrink: 0, transition: 'background 160ms ease' }}>Add</div>
      </div>
      {dup && <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0' }}>That one is already on your list.</div>}
      {!words.length ? (
        <EmptyState art="bell" title="No words yet" text="Try your name, a nickname or something you never want to miss, like exam or tickets." />
      ) : (
        <>
          <IgHeading>{`${words.length} of 10`}</IgHeading>
          {words.map((w, i) => (
            <div key={w} className="zchat-fade" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '0 2px', borderBottom: i < words.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
              <Bell size={18} color={theme.muted} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w}</span>
              <div role="button" aria-label={`Remove ${w}`} onClick={() => { hapticTap(); g2KwSave(myId, group.id, words.filter((x) => x !== w)); }} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer' }}><X size={18} /></div>
            </div>
          ))}
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '14px 2px 4px' }}>Whole words only, in any case. Quiet hours still keep things silent at night.</div>
        </>
      )}
    </FullPage>
  );
}
async function g2EmoFile(file) {
  if (!file || !/^image\//.test(file.type || '')) return { error: 'Pick a picture for the emoji.' };
  if (/gif/i.test(file.type)) {
    const head = new Uint8Array(await file.slice(0, 10).arrayBuffer());
    const w = head[6] | (head[7] << 8);
    const h = head[8] | (head[9] << 8);
    if (head[0] !== 0x47 || !w || !h) return { error: 'That GIF could not be read.' };
    if (w > 128 || h > 128 || file.size > 102400) return { error: 'Pick a GIF of 128 px or smaller and under 100 KB.' };
    return { blob: file, ext: 'gif', type: 'image/gif', url: URL.createObjectURL(file) };
  }
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImageElement(src);
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) return { error: 'That picture could not be read.' };
    const out = Math.min(128, side);
    const c = document.createElement('canvas');
    c.width = out;
    c.height = out;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
    let blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.9));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((res) => c.toBlob(res, 'image/png'));
    if (blob && blob.size > 102400) blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.7));
    if (!blob || blob.size > 102400) return { error: 'That picture is too big for an emoji.' };
    const type = blob.type === 'image/webp' ? 'image/webp' : 'image/png';
    return { blob, ext: type === 'image/webp' ? 'webp' : 'png', type, url: URL.createObjectURL(blob) };
  } catch {
    return { error: 'That picture could not be read.' };
  } finally {
    URL.revokeObjectURL(src);
  }
}
export function G2EmojiPage({ group, myId, isAdmin, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const r = useG2Emo(group.id);
  const list = (r && r.list) || [];
  const [draft, setDraft] = useState(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [view, setView] = useState(null);
  const fileRef = useRef(null);
  useBackClose(!!draft, () => { if (!busy) setDraft(null); });
  useBackClose(!!view, () => setView(null));
  const nm = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);
  const nameOk = /^[a-z][a-z0-9]{1,23}$/.test(nm);
  const taken = list.some((e) => e.name === nm);
  const pick = async (file) => {
    setErr('');
    const out = await g2EmoFile(file);
    if (out.error) { appSnack(out.error); return; }
    const base = String((file && file.name) || '').replace(/\.[a-z0-9]+$/i, '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/^[0-9]+/, '').slice(0, 24);
    setName(base.length >= 2 ? base : '');
    setDraft(out);
  };
  const save = async () => {
    if (!draft || !nameOk || taken || busy) return;
    setBusy(true);
    setErr('');
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
    const path = `${myId}/gemoji/${group.id}/${rand}.${draft.ext}`;
    const temp = { id: `tmp-${rand}`, name: nm, url: draft.url, animated: draft.ext === 'gif', pending: true };
    g2EmoPut(group.id, [...list, temp]);
    let reason = '';
    try {
      const up = await supabase.storage.from('chat-media').upload(path, draft.blob, { contentType: draft.type, cacheControl: '31536000' });
      if (up.error) reason = "That picture didn't upload. Try again.";
      else {
        const url = supabase.storage.from('chat-media').getPublicUrl(path).data.publicUrl;
        const { data, error } = await supabase.rpc('zchat_grp_emoji_add', { p_group: group.id, p_name: nm, p_path: path, p_url: url });
        if (error || !data || !data.ok) reason = (data && data.reason) || friendlyError(error, "Couldn't add that emoji. Try again.");
        else {
          const cur = g2EmoOf(group.id);
          g2EmoPut(group.id, [...((cur && cur.list) || []).filter((e) => e.id !== temp.id && e.name !== nm), data.emoji]);
        }
      }
    } catch { reason = "Couldn't add that emoji. Try again."; }
    setBusy(false);
    if (reason) {
      const cur = g2EmoOf(group.id);
      g2EmoPut(group.id, ((cur && cur.list) || []).filter((e) => e.id !== temp.id));
      setErr(reason);
      return;
    }
    hapticTap();
    playUiSound('like');
    setDraft(null);
    setTimeout(() => { try { URL.revokeObjectURL(draft.url); } catch {} }, 4000);
    appSnack(`:${nm}: is ready to use`);
  };
  const remove = async (e) => {
    setView(null);
    const before = list;
    g2EmoPut(group.id, list.filter((x) => x.id !== e.id));
    const { data, error } = await supabase.rpc('zchat_grp_emoji_remove', { p_id: e.id });
    if (error || !data || !data.ok) { g2EmoPut(group.id, before); appSnack((data && data.reason) || friendlyError(error, "Couldn't remove that emoji. Try again.")); }
  };
  return (
    <FullPage title="Group emoji" subtitle={list.length ? `${list.length} of 50` : group.name} onBack={onClose} zIndex={90}
      footer={isAdmin && list.length < 50 && !draft ? <BigButton label="Add emoji" onClick={() => { hapticTap(); if (fileRef.current) fileRef.current.click(); }} /> : null}>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) pick(f); }} />
      <PageArt text={isAdmin ? 'Add small square pictures or short GIFs that only this group can use. Members type :name: or pick them when they react.' : 'Emoji made for this group. Type :name: in a message or pick them when you react.'} />
      {!list.length ? (
        <EmptyState art="stickers" title="No group emoji yet" text={isAdmin ? 'Square pictures work best. They show at 128 px and must be under 100 KB.' : 'When an admin adds some, they show up here.'} />
      ) : (
        <G2EmojiGrid list={list} size={40} onPick={(e) => setView(e)} />
      )}
      {view && (
        <ChatRowSheet portal title={`:${view.name}:`} subtitle={group.name} avatar={<G2EmoImg e={view} size={40} />} zIndex={120} onClose={() => setView(null)} actions={[
          { icon: <Copy size={18} />, label: 'Copy name', onClick: async () => { const ok = await copyTextToClipboard(`:${view.name}:`); appSnack(ok ? 'Copied' : `:${view.name}:`); } },
          isAdmin && !view.pending ? { icon: <Trash2 size={18} />, label: 'Remove from group', danger: true, onClick: () => remove(view) } : null,
        ]} />
      )}
      {draft && (
        <div onClick={() => { if (!busy) setDraft(null); }} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '18px 18px calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><img src={draft.url} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>Name your emoji</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{nameOk ? `People type :${nm}:` : 'Letters and numbers, starting with a letter'}</div>
              </div>
            </div>
            <input value={name} onChange={(e) => { setErr(''); setName(e.target.value.slice(0, 26)); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} placeholder="party" aria-label="Emoji name" autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 14 }} />
            {(taken || err) && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: theme.danger, padding: '8px 2px 0' }}>{err || `There is already an emoji called :${nm}:`}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <BigButton label="Cancel" tone="plain" onClick={() => { if (!busy) setDraft(null); }} style={{ flex: '0 0 110px' }} />
              <BigButton label={busy ? 'Adding' : 'Add emoji'} disabled={!nameOk || taken || busy} onClick={save} />
            </div>
          </div>
        </div>
      )}
    </FullPage>
  );
}

const g2LinkMem = new Map();
const G2_LINK_EXPIRES = [['3600', '1 hour'], ['86400', '1 day'], ['604800', '7 days'], ['0', 'Never']];
const G2_LINK_LIMITS = [['0', 'Any'], ['1', '1'], ['5', '5'], ['10', '10'], ['50', '50'], ['100', '100']];
function g2LinkState(l, now) {
  const left = l.expires_at ? Date.parse(l.expires_at) - now : Infinity;
  const used = l.max_uses ? l.uses >= l.max_uses : false;
  const joined = l.max_uses ? `${l.uses} of ${l.max_uses} joined` : `${l.uses} joined`;
  if (left <= 0) return { dead: true, text: `${joined}, expired` };
  if (used) return { dead: true, text: `${joined}, used up` };
  if (left === Infinity) return { dead: false, text: `${joined}, never expires` };
  const h = Math.round(left / 3600000);
  const when = left < 3600000 ? `${Math.max(1, Math.ceil(left / 60000))} min` : h < 48 ? `${h} ${h === 1 ? 'hour' : 'hours'}` : `${Math.round(left / 86400000)} days`;
  return { dead: false, text: `${joined}, expires in ${when}` };
}
export function G2LinksSection({ group, enabled }) {
  const { theme } = useTheme();
  const [list, setList] = useState(() => g2LinkMem.get(group.id) || null);
  const [edit, setEdit] = useState(null);
  const [menu, setMenu] = useState(null);
  const [del, setDel] = useState(null);
  const put = (fn) => setList((cur) => { const next = fn(cur || []); g2LinkMem.set(group.id, next); return next; });
  const load = () => supabase.from('zchat_grp_links').select('*').eq('group_id', group.id).order('created_at', { ascending: true }).limit(40).then(({ data, error }) => {
    if (error) { setList((cur) => cur || []); return; }
    put(() => data || []);
  }, () => {});
  useEffect(() => { load(); }, [group.id]);
  useRtRefresh(load);
  useEffect(() => {
    const keep = rtKeep(() => supabase.channel(rtName(`g2-links-${group.id}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zchat_grp_links', filter: `group_id=eq.${group.id}` }, (p) => {
        if (p.eventType === 'DELETE') { const id = p.old && p.old.id; if (id) put((cur) => cur.filter((x) => x.id !== id)); return; }
        const row = p.new;
        if (row && row.id) put((cur) => (cur.some((x) => x.id === row.id) ? cur.map((x) => (x.id === row.id ? { ...x, ...row } : x)) : [...cur, row]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'zchat_grp_links' }, (p) => { const id = p && p.old && p.old.id; if (id) put((cur) => (cur.some((x) => x.id === id) ? cur.filter((x) => x.id !== id) : cur)); }));
    return () => rtDrop(keep);
  }, [group.id]);
  const [, setTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setTick((n) => n + 1), 30000); return () => clearInterval(iv); }, []);
  const linkOf = (l) => `${siteOrigin()}/?join=${l.code}`;
  const share = async (l) => {
    const url = linkOf(l);
    try { if (navigator.share) { await navigator.share({ title: `Join ${group.name} on ZChat`, text: `Join the group ${group.name} on ZChat`, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const ok = await copyTextToClipboard(url);
    appSnack(ok ? 'Invite link copied' : url);
  };
  const save = async (form) => {
    const name = form.name.replace(/\s+/g, ' ').trim().slice(0, 32) || 'Invite link';
    const secs = Number(form.exp) || 0;
    const max = Number(form.max) || 0;
    const tempId = form.id || `tmp-${Date.now()}`;
    const before = list || [];
    const optimistic = { id: tempId, group_id: group.id, code: form.code || '', name, expires_at: secs ? new Date(Date.now() + secs * 1000).toISOString() : null, max_uses: max || null, uses: form.uses || 0, created_at: form.created_at || new Date().toISOString(), pending: !form.id };
    put((cur) => (form.id ? cur.map((x) => (x.id === form.id ? { ...x, ...optimistic } : x)) : [...cur, optimistic]));
    setEdit(null);
    hapticTap();
    const { data, error } = await supabase.rpc('zchat_grp_link_save', { p_group: group.id, p_link: form.id || null, p_name: name, p_expires_secs: secs, p_max: max });
    if (error || !data || !data.ok || !data.link) {
      put(() => before);
      appSnack((data && data.reason) || friendlyError(error, "Couldn't save that link. Try again."));
      return;
    }
    put((cur) => { const has = cur.some((x) => x.id === tempId); const rest = cur.filter((x) => x.id !== data.link.id || x.id === tempId); return has ? rest.map((x) => (x.id === tempId ? data.link : x)) : [...rest, data.link]; });
    if (!form.id) { appSnack(`${name} link is ready`); }
  };
  const remove = async (l) => {
    const before = list || [];
    put((cur) => cur.filter((x) => x.id !== l.id));
    const { data, error } = await supabase.rpc('zchat_grp_link_delete', { p_link: l.id });
    if (error || !data || !data.ok) { put(() => before); appSnack((data && data.reason) || friendlyError(error, "Couldn't delete that link. Try again.")); }
  };
  if (!enabled) return null;
  const now = Date.now();
  const rows = list || [];
  const menuRow = menu ? rows.find((x) => x.id === menu) : null;
  return (
    <DetailSection title="More invite links">
      {rows.map((l) => {
        const st = g2LinkState(l, now);
        return <DetailRow key={l.id} icon={<LinkIcon />} label={l.name} sub={l.pending ? 'Making your link' : st.text} onClick={l.pending ? undefined : () => setMenu(l.id)} right={st.dead && !l.pending ? <span style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>Off</span> : null} />;
      })}
      <DetailRow icon={<Plus />} label="New link" sub={rows.length ? undefined : 'Give it a name, a time limit and a number of people'} onClick={() => setEdit({ name: '', exp: '86400', max: '0' })} last />
      {menuRow && (
        <ChatRowSheet portal title={menuRow.name} subtitle={g2LinkState(menuRow, now).text} onClose={() => setMenu(null)} zIndex={120} actions={[
          g2LinkState(menuRow, now).dead ? null : { icon: <Share2 size={18} />, label: 'Share link', onClick: () => share(menuRow) },
          g2LinkState(menuRow, now).dead ? null : { icon: <Copy size={18} />, label: 'Copy link', onClick: async () => { const ok = await copyTextToClipboard(linkOf(menuRow)); appSnack(ok ? 'Invite link copied' : linkOf(menuRow)); } },
          { icon: <Pencil size={18} />, label: 'Edit', hint: 'Changing the time starts it again from now', onClick: () => setEdit({ id: menuRow.id, code: menuRow.code, name: menuRow.name, uses: menuRow.uses, created_at: menuRow.created_at, exp: menuRow.expires_at ? String(G2_LINK_EXPIRES.map((x) => Number(x[0])).filter(Boolean).find((s) => Date.parse(menuRow.expires_at) - Date.parse(menuRow.updated_at || menuRow.created_at) <= s * 1000 + 60000) || 604800) : '0', max: String(menuRow.max_uses || 0) }) },
          { icon: <Trash2 size={18} />, label: 'Delete link', danger: true, onClick: () => setDel(menuRow) },
        ]} />
      )}
      {edit && <G2LinkEditor form={edit} onClose={() => setEdit(null)} onSave={save} />}
      {del && <ConfirmSheet title={`Delete ${del.name}?`} text="People who open it will see that it has expired. Everyone who joined stays in the group." confirmLabel="Delete link" zIndex={130} onCancel={() => setDel(null)} onConfirm={() => { const l = del; setDel(null); remove(l); }} />}
    </DetailSection>
  );
}
function G2LinkEditor({ form, onClose, onSave }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(form.name || '');
  const [exp, setExp] = useState(form.exp || '86400');
  const [max, setMax] = useState(form.max || '0');
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 125, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '18px 18px calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>{form.id ? 'Edit link' : 'New invite link'}</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 3 }}>You see how many people joined with each link.</div>
        <input value={name} onChange={(e) => setName(e.target.value.slice(0, 32))} placeholder="Friends, Class, Team" aria-label="Link name" maxLength={32} enterKeyHint="done" style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 14 }} />
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, margin: '16px 2px 8px' }}>Expires</div>
        <SegmentedControl value={exp} onChange={(k) => { hapticTap(); setExp(k); }} options={G2_LINK_EXPIRES} />
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, margin: '16px 2px 8px' }}>How many people can join</div>
        <SegmentedControl dense value={max} onChange={(k) => { hapticTap(); setMax(k); }} options={G2_LINK_LIMITS} />
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <BigButton label="Cancel" tone="plain" onClick={onClose} style={{ flex: '0 0 110px' }} />
          <BigButton label={form.id ? 'Save' : 'Make link'} onClick={() => onSave({ ...form, name, exp, max })} />
        </div>
      </div>
    </div>
  );
}

export function WatchPartyPage({ msgId, d, me, onClose }) {
  useBackClose(true, onClose);
  const frameRef = useRef(null);
  const chRef = useRef(null);
  const syncRef = useRef({ st: -1, play: 0, t: 0, tAt: 0, ex: null, applyAt: 0, jumped: false, ready: false, sub: false, asked: 0, askT: 0, tries: 0, answered: new Map(), replyT: new Map(), people: [] });
  const [viewers, setViewers] = useState([]);
  const [note, setNote] = useState('');
  const noteTimer = useRef(0);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const src = `https://www.youtube.com/embed/${encodeURIComponent(d.v)}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`;
  const flash = (t) => { clearTimeout(noteTimer.current); setNote(t); noteTimer.current = setTimeout(() => setNote(''), 2200); };
  const post = (obj) => { try { if (frameRef.current && frameRef.current.contentWindow) frameRef.current.contentWindow.postMessage(JSON.stringify(obj), '*'); } catch {} };
  const cmd = (func, args) => post({ event: 'command', func, args: args || [], id: 1, channel: 'widget' });
  const nowPos = () => { const w = syncRef.current; return w.st === 1 && w.tAt ? w.t + (Date.now() - w.tAt) / 1000 : w.t; };
  const send = (a, t, extra) => {
    if (!chRef.current) return;
    const w = syncRef.current;
    w.jumped = false;
    chRef.current.send({ type: 'broadcast', event: 'sync', payload: { a, t: Math.max(0, Number(t) || 0), at: listenNow(), by: me.id, n: (me.name || '').split(' ')[0], ...(extra || {}) } });
  };
  const posOf = (p) => Math.max(0, Number(p.t || 0) + (p.a === 'play' ? Math.min(Math.max(0, (listenNow() - Number(p.at || listenNow())) / 1000), 8) : 0));
  const apply = (p) => {
    const w = syncRef.current;
    w.ex = { st: p.a === 'play' ? 1 : 2, at: Date.now(), p };
    w.applyAt = Date.now();
    w.jumped = false;
    cmd('seekTo', [posOf(p), true]);
    if (p.a === 'play') cmd('playVideo'); else cmd('pauseVideo');
    if (p.n && !p.q) flash(p.a === 'play' ? `${p.n} pressed play` : `${p.n} paused`);
  };
  const askNeed = () => {
    const w = syncRef.current;
    if (!w.ready || !w.sub || !chRef.current || w.asked || w.tries >= 3) return;
    w.asked = Date.now();
    w.tries += 1;
    chRef.current.send({ type: 'broadcast', event: 'need', payload: { by: me.id } });
    clearTimeout(w.askT);
    w.askT = setTimeout(() => { if (w.asked && !w.ex && w.play !== 1 && w.play !== 2) { w.asked = 0; askNeed(); } }, 3000);
  };
  useEffect(() => {
    listenSyncClock();
    const onMsg = (e) => {
      let host = '';
      try { host = new URL(e.origin).hostname; } catch { return; }
      if (!/(^|\.)youtube(-nocookie)?\.com$/.test(host)) return;
      let data = e.data;
      try { if (typeof data === 'string') data = JSON.parse(data); } catch { return; }
      if (!data || typeof data !== 'object') return;
      const w = syncRef.current;
      if (data.event === 'onReady') {
        cmd('addEventListener', ['onStateChange']);
        w.ready = true;
        askNeed();
      }
      const info = data.info;
      const now = Date.now();
      if (data.event === 'infoDelivery' && info && typeof info.currentTime === 'number') {
        const pred = w.st === 1 && w.tAt ? w.t + (now - w.tAt) / 1000 : w.t;
        const jump = w.tAt ? Math.abs(info.currentTime - pred) : 0;
        w.t = info.currentTime;
        w.tAt = now;
        if (jump > 2.5 && !w.ex && now - w.applyAt > 2500 && (w.play === 1 || w.play === 2)) {
          if (w.st === 1 || w.st === 2) send(w.play === 1 ? 'play' : 'pause', w.t);
          else w.jumped = true;
        }
      }
      const stNow = data.event === 'onStateChange' ? Number(info) : (data.event === 'infoDelivery' && info && typeof info.playerState === 'number' ? info.playerState : null);
      if (stNow == null || Number.isNaN(stNow)) return;
      if (stNow !== w.st) { w.st = stNow; w.tAt = now; }
      if (stNow !== 1 && stNow !== 2) return;
      const ex = w.ex;
      if (ex && stNow === ex.st) {
        w.ex = null;
        w.play = stNow;
        w.jumped = false;
        if (stNow === 1 && now - ex.at > 1500) {
          const target = posOf(ex.p);
          if (Math.abs(target - w.t) > 1) { w.applyAt = now; cmd('seekTo', [target, true]); }
        }
        return;
      }
      if (ex && now - ex.at < 1500) return;
      w.ex = null;
      if (stNow === w.play) {
        if (w.jumped && stNow === 1) send('play', w.t);
        return;
      }
      w.play = stNow;
      send(stNow === 1 ? 'play' : 'pause', w.t);
    };
    window.addEventListener('message', onMsg);
    return () => { window.removeEventListener('message', onMsg); const w = syncRef.current; clearTimeout(w.askT); w.replyT.forEach((t) => clearTimeout(t)); };
  }, []);
  useEffect(() => {
    let alive = true;
    const hold = { ch: null };
    rtReady(`watch-${msgId}`).then(() => {
    if (!alive) return;
    const ch = supabase.channel(`watch-${msgId}`, { config: { presence: { key: me.id }, broadcast: { self: false } } });
    hold.ch = ch;
    const sync = () => {
      const st = ch.presenceState ? ch.presenceState() : {};
      const list = [];
      Object.keys(st || {}).forEach((k) => { const v = (st[k] || [])[0]; if (v) list.push({ id: k, name: v.name || 'Someone', avatar: v.avatar || null, at: Number(v.at) || 0 }); });
      list.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
      syncRef.current.people = list;
      setViewers(list);
    };
    ch.on('presence', { event: 'sync' }, sync)
      .on('broadcast', { event: 'sync' }, (msg) => {
        const p = msg && msg.payload;
        if (!p || p.by === me.id) return;
        if (p.to) { syncRef.current.answered.set(p.to, Date.now()); if (p.to !== me.id) return; }
        apply(p);
      })
      .on('broadcast', { event: 'need' }, (msg) => {
        const p = msg && msg.payload;
        const w = syncRef.current;
        if (!p || !p.by || p.by === me.id || (w.play !== 1 && w.play !== 2)) return;
        const asked = Date.now();
        const order = w.people.filter((x) => x.id !== p.by).map((x) => x.id);
        const rank = Math.max(0, order.indexOf(me.id));
        clearTimeout(w.replyT.get(p.by));
        w.replyT.set(p.by, setTimeout(() => {
          w.replyT.delete(p.by);
          if ((w.answered.get(p.by) || 0) >= asked) return;
          send(w.play === 1 ? 'play' : 'pause', nowPos(), { to: p.by, q: 1 });
        }, Math.min(rank, 6) * 350));
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return;
        try { ch.track({ name: me.name || 'Someone', avatar: me.avatar || null, at: Date.now() }); } catch {}
        syncRef.current.sub = true;
        askNeed();
      });
    chRef.current = ch;
    });
    return () => { alive = false; if (hold.ch) { try { supabase.removeChannel(hold.ch); } catch {} } chRef.current = null; syncRef.current.sub = false; };
  }, [msgId]);
  const others = viewers.filter((v) => v.id !== me.id);
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: '#05060A', color: 'white', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 10px' }}>
          <div role="button" aria-label="Leave watch party" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ArrowLeft size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.t || 'Watch together'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{others.length ? `${others.length + 1} watching now` : 'Waiting for others to join'}</div>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000', flexShrink: 0 }}>
          <iframe ref={frameRef} title="YouTube video" src={src} allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            onLoad={() => post({ event: 'listening', id: 1, channel: 'widget' })}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          {note && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: 10, transform: 'translateX(-50%)', padding: '6px 12px', borderRadius: 14, background: 'rgba(0,0,0,0.7)', fontSize: 12.5, fontWeight: 700, pointerEvents: 'none', width: 'max-content', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', textAlign: 'center' }}>{note}</div>}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px calc(20px + env(safe-area-inset-bottom))' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>Watching</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {[{ id: me.id, name: 'You', avatar: me.avatar }, ...others].map((v) => (
              <div key={v.id} style={{ width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <Avatar emoji={v.avatar} name={v.name} size={46} />
                <span style={{ fontSize: 11.5, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(v.name || '').split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div role="button" aria-label="Bring everyone to my spot" onClick={() => { const w = syncRef.current; send(w.play === 1 ? 'play' : 'pause', nowPos()); flash('Everyone is now at your spot'); }} className="zchat-press"
            style={{ marginTop: 22, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}><Repeat size={17} />Bring everyone to my spot</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginTop: 12 }}>Play, pause and skip on the video and everyone here follows along.</div>
        </div>
      </div>
    </Portal>
  );
}
const GH_GROUP_KINDS = ['ttt', 'c4', 'gomoku', 'reversi', 'dots', 'ship', 'hang'];
const GH_TOUR_KINDS = GH_GROUP_KINDS.filter((k) => k !== 'hang');
const GH_LEVELS = [[1, 'Easy'], [2, 'Fair'], [3, 'Hard']];
function ghSetBotLevel(v) { try { localStorage.setItem('zchat-bot-level', String(v)); } catch {} }
function ghStatus(p) {
  if (!p) return '';
  if (p.w) {
    if (p.w === 'd') return 'Draw';
    if (p.gu) return `${ghFirst(p.gu)} gave up`;
    const win = p.w === 'x' ? p.x : p.o;
    return win === ghEnv.uid ? 'You won' : `${ghFirst(win)} won`;
  }
  if (p.g === 'hang') return p.o === ghEnv.uid ? 'Your guess' : `${ghFirst(p.o)} is guessing`;
  if (p.t) return p.t === ghEnv.uid ? 'Your move' : `${ghFirst(p.t)}'s turn`;
  return 'Playing now';
}
function ghDescribe(a, b) {
  if (!a || !b || (b.n || 0) <= (a.n || 0)) return null;
  if (b.gu) return `${ghFirst(b.gu)} gave up`;
  if ((b.n || 0) > (a.n || 0) + 1) return 'Caught up with the latest moves';
  const mover = b.g === 'hang' ? b.o : a.t;
  if (b.to) return `${ghFirst(b.w === 'x' ? b.x : b.o)} won on time`;
  const who = ghFirst(mover);
  if (b.g === 'ship') { const key = mover === b.x ? 'hx' : 'ho'; const hit = (b[key] || []).length > (a[key] || []).length; const sunk = (b[mover === b.x ? 'kx' : 'ko'] || []).length > (a[mover === b.x ? 'kx' : 'ko'] || []).length; return sunk ? `${who} sank a ship` : hit ? `${who} fired and hit` : `${who} fired and missed`; }
  if (b.g === 'hang') { const l = (b.gl || [])[(b.gl || []).length - 1] || ''; return `${who} guessed ${l.toUpperCase()}, ${String(b.sw || '').includes(l) ? 'right' : 'wrong'}`; }
  if (b.g === 'dots') return (b.bx || []).filter(Boolean).length > (a.bx || []).filter(Boolean).length ? `${who} closed a box` : `${who} drew a line`;
  if (b.g === 'c4') { const i = (b.b || []).findIndex((v, k) => v && !(a.b || [])[k]); return i >= 0 ? `${who} dropped in column ${(i % 7) + 1}` : `${who} played`; }
  if (b.g === 'paint') { const i = (b.own || []).indexOf(mover === b.x ? 1 : 2); return i >= 0 ? `${who} picked ${PAINT_NAMES[b.b[i]].toLowerCase()}` : `${who} played`; }
  return `${who} played`;
}
function GhShipWatch({ pub, status }) {
  const { theme } = useTheme();
  const cell = 15;
  const sea = (owner, shots, hits, sunk, fleet) => {
    const S = new Set(shots || []);
    const Hs = new Set(hits || []);
    const K = new Set(sunk || []);
    const F = new Set(fleet || []);
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.muted, marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 6 * cell + 18 }}>{owner === ghEnv.uid ? 'Your sea' : `${ghFirst(owner)}'s sea`}</div>
        <div style={{ ...g3Board('#0369A1', 9), display: 'grid', gridTemplateColumns: `repeat(6, ${cell}px)`, gap: 2, padding: 4, width: 'fit-content' }}>
          {Array.from({ length: 36 }).map((_, i) => {
            const shot = S.has(i);
            const hit = Hs.has(i);
            const bg = K.has(i) ? '#991B1B' : hit ? '#EF4444' : !shot && F.has(i) ? '#64748B' : 'linear-gradient(180deg, #38BDF8 0%, #0EA5E9 100%)';
            return (
              <div key={i} style={{ width: cell, height: cell, borderRadius: 4, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', outline: shot && i === pub.lastIdx ? '1.5px solid #FDE047' : 'none', outlineOffset: -1 }}>
                {shot && !hit && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />}
                {hit && <svg width="8" height="8" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="white" strokeWidth="4" strokeLinecap="round" /></svg>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <GameCardShell k="ship" width={2 * (6 * cell + 18) + 12 + 20} live title="Sea battle" status={status} hot={false}>
      <div style={{ display: 'flex', gap: 12 }}>
        {sea(pub.x, pub.so, pub.ho, pub.ko, pub.fx)}
        {sea(pub.o, pub.sx, pub.hx, pub.kx, pub.fo)}
      </div>
      <div style={{ marginTop: 8, fontSize: 11.5, color: theme.muted, textAlign: 'center' }}>{pub.w ? 'Every ship is shown now' : 'Ships stay hidden until they sink'}</div>
    </GameCardShell>
  );
}
export function GhBoard({ pub, myId, sec, fresh, onMove, onRematch }) {
  const C = GH_CARDS[pub.g];
  if (!C) return <GoneGameCard />;
  const player = myId === pub.x || myId === pub.o;
  const foe = myId === pub.x ? pub.o : pub.x;
  if (player && (!GH_SECRET[pub.g] || (pub.g === 'ship' ? sec && sec.sid : sec && sec.sw))) {
    const st = pub.g === 'ship' ? { ...pub, id: sec.sid } : pub.g === 'hang' ? { ...pub, sw: sec.sw } : pub;
    return <C state={st} myId={myId} live fresh={fresh} peerName={ghFirst(foe)} onMove={onMove} onRematch={onRematch} />;
  }
  const view = { me: ghFirst(pub.x), them: ghFirst(pub.o), status: ghStatus(pub) };
  if (pub.g === 'ship') return <GhViewCtx.Provider value={view}><GhShipWatch pub={pub} status={view.status} /></GhViewCtx.Provider>;
  return (
    <GhViewCtx.Provider value={view}>
      <C state={pub} myId={pub.g === 'hang' ? pub.o : pub.x} live={false} fresh={false} peerName={pub.g === 'hang' ? ghFirst(pub.x) : ghFirst(pub.o)} onMove={() => false} onRematch={null} />
    </GhViewCtx.Provider>
  );
}
export function GhMatchPage({ pid, msgId, card: initial, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const env = useGhEnv();
  const [card, setCard] = useState(initial || null);
  const [failed, setFailed] = useState('');
  const [at, setAt] = useState(null);
  const [feed, setFeed] = useState([]);
  const [ask, setAsk] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [liveMsg, setLiveMsg] = useState(msgId || null);
  const boxRef = useRef(null);
  const take = (c) => { if (c && c.m && c.m.id === pid) setCard((prev) => (!prev || (c.m.n || 0) >= (prev.m.n || 0) ? c : prev)); };
  const load = () => supabase.rpc('zchat_gh_get', { p_game: pid }).then(({ data, error }) => {
    if (data && data.card) { take(jsonAfter(data.card, 'zmatch:')); setAt(data.at || null); if (data.msg != null) setLiveMsg((v) => v || data.msg); } else if (error) setFailed(ghErrText(error, 'This game could not be opened. Try again.'));
  }, () => {});
  useEffect(() => { load(); }, [pid]);
  useEffect(() => {
    if (!liveMsg) return undefined;
    const keep = rtKeep(() => supabase.channel(rtName(`zghm-${liveMsg}`)).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `id=eq.${liveMsg}` }, (p) => { if (p && p.new) take(jsonAfter(p.new.content, 'zmatch:')); }));
    const vis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { rtDrop(keep); document.removeEventListener('visibilitychange', vis); };
  }, [liveMsg, pid]);
  const base = card && card.m;
  const pub = useGhPub(base, pid);
  const histRef = useRef({ before: null, cur: null });
  const firstN = useRef(null);
  useEffect(() => {
    if (!pub) return;
    if (firstN.current == null) firstN.current = pub.n || 0;
    const h = histRef.current;
    if (!h.cur) { h.cur = pub; return; }
    if ((pub.n || 0) > (h.cur.n || 0)) {
      h.before = h.cur;
      h.cur = pub;
      const line = ghDescribe(h.before, pub);
      if (line) setFeed((f) => [{ k: String(pub.n), t: line, at: Date.now() }, ...f].slice(0, 8));
    } else if ((pub.n || 0) === (h.cur.n || 0) && pub !== h.cur) {
      h.cur = pub;
      const line = h.before ? ghDescribe(h.before, pub) : null;
      if (line) setFeed((f) => (f.length && f[0].k === String(pub.n) ? [{ ...f[0], t: line }, ...f.slice(1)] : f));
    }
  }, [pub]);
  const player = !!pub && (env.uid === pub.x || env.uid === pub.o);
  const finished = !!(pub && pub.w);
  const sec = useGhSecret(pid, player && !!pub && !!GH_SECRET[pub.g]);
  const watching = useGhWatchers(pid, !!pub && !finished, !player, env.uid);
  const zoomRef = useRef(1);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const fit = () => {
      const inner = el.firstElementChild;
      const w = inner ? inner.getBoundingClientRect().width / (zoomRef.current || 1) : 0;
      if (!w) return;
      const z = Math.max(1, Math.min(1.6, (Math.min(window.innerWidth, 560) - 32) / w));
      zoomRef.current = z;
      setZoom(z);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pub && pub.g, sec && sec.sid, !!pub]);
  const foe = pub ? (env.uid === pub.x ? pub.o : pub.x) : null;
  const waiting = pub && !finished && (pub.g === 'hang' ? pub.o : pub.t);
  const canClaim = player && !finished && waiting === foe && ((at && Date.now() - Date.parse(at) > 86400000) || (foe && env.members.size > 0 && !env.members.has(foe)));
  const end = async (mode) => {
    setAsk(null);
    const optimistic = { ...pub, n: (pub.n || 0) + 1, w: mode === 'resign' ? (env.uid === pub.x ? 'o' : 'x') : (env.uid === pub.x ? 'x' : 'o'), ...(mode === 'resign' ? { gu: env.uid } : { to: true }) };
    ghLiveSet(pid, optimistic);
    hapticTap();
    const { data, error } = await ghRpc('zchat_gh_end', { p_game: pid, p_mode: mode });
    if (error || !data || !data.ok) { ghLiveSet(pid, null); appSnack(ghErrText(error, 'That did not go through. Try again.')); return; }
    ghLiveSet(pid, data.m);
    ghAfterMove(data.m, data.made);
  };
  const title = pub ? `${ghFirst(pub.x)} vs ${ghFirst(pub.o)}` : 'Game';
  const sub = card ? (card.tr ? `${GAME_TITLES[pub.g] || 'Game'}, ${ghRoundLabel(card.rd).toLowerCase()}` : GAME_TITLES[pub.g] || 'Game') : '';
  return (
    <FullPage title={title} subtitle={sub} onBack={onClose} zIndex={72} right={pub ? <GameInfoButton k={pub.g} header /> : null}>
      {!pub && !failed && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={22} color={theme.muted} /></div>}
      {!pub && failed && <EmptyState art="nothing" title="This game could not be opened" text={failed} />}
      {pub && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '6px 0 14px', fontSize: 13.5, fontWeight: 700, color: theme.muted }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: finished ? theme.muted : '#22C55E', boxShadow: finished ? 'none' : '0 0 0 3px rgba(34,197,94,0.25)' }} />
            <span style={{ color: theme.ink }}>{ghStatus(pub)}</span>
            {!finished && <span>{watching === 0 ? 'Nobody else watching' : ghPlural(watching, 'person watching', 'people watching')}</span>}
          </div>
          <div ref={boxRef} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ zoom, width: 'fit-content' }}>
              <GhBoard pub={pub} myId={env.uid} sec={sec} fresh={(pub.n || 0) > (firstN.current == null ? pub.n || 0 : firstN.current)} onMove={(next) => ghMove(pid, next)} onRematch={finished && player && !card.tr ? () => { onClose(); ghEmit({ type: 'again', pub }); } : null} />
            </div>
          </div>
          {!player && !finished && <div style={{ textAlign: 'center', fontSize: 12.5, color: theme.muted, marginTop: 14 }}>You are watching. Moves show up here as they happen.</div>}
          {feed.length > 0 && (
            <DetailSection title="Moves">
              {feed.map((f, i) => (
                <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: i ? `1px solid ${theme.border}` : 'none', fontSize: 14, color: theme.ink }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{f.t}</span>
                  <span style={{ fontSize: 12, color: theme.muted }}>{Date.now() - f.at < 60000 ? 'Just now' : formatListTime(new Date(f.at).toISOString())}</span>
                </div>
              ))}
            </DetailSection>
          )}
          {player && !finished && (
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              {canClaim && <BigButton label="Claim the win" onClick={() => setAsk('claim')} style={{ flex: 1 }} />}
              <BigButton label="Give up" tone="plain" onClick={() => setAsk('resign')} style={{ flex: 1 }} />
            </div>
          )}
        </>
      )}
      {ask && <ConfirmSheet title={ask === 'resign' ? 'Give up this game?' : 'Claim the win?'} text={ask === 'resign' ? `${ghFirst(foe)} wins this one.` : `${ghFirst(foe)} has not played for a day, so this game counts as your win.`} confirmLabel={ask === 'resign' ? 'Give up' : 'Claim the win'} danger={ask === 'resign'} onConfirm={() => end(ask)} onCancel={() => setAsk(null)} zIndex={96} />}
    </FullPage>
  );
}
let ghSheetTab = 'play';
export function GhGroupSheet({ group, onClose, onPick }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const env = useGhEnv();
  const drag = useSheetDrag(onClose);
  const [tab, setTabRaw] = useState(ghSheetTab);
  const [kind, setKind] = useState(null);
  useBackClose(!!kind, () => setKind(null));
  const [live, setLive] = useState(() => ghLiveLists.get(group.id) || null);
  const setTab = (t) => { ghSheetTab = t; setTabRaw(t); setKind(null); hapticTap(); };
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_gh_live', { p_group: group.id }).then(({ data, error }) => {
      if (!alive) return;
      if (!error && Array.isArray(data)) { ghLiveLists.set(group.id, data); setLive(data); } else setLive((v) => v || []);
    }, () => { if (alive) setLive((v) => v || []); });
    return () => { alive = false; };
  }, [group.id]);
  const people = [...env.members.entries()].filter(([id, p]) => id !== env.uid && p && !p.is_bot && !p.is_deleted).sort((a, b) => String(a[1].name || '').localeCompare(String(b[1].name || '')));
  const gameRow = (k, onClick, sub) => (
    <div key={k} role="button" aria-label={GAME_TITLES[k]} onClick={onClick} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '8px 14px 8px 18px', cursor: 'pointer' }}>
      <GameArt k={k} width={50} height={50} radius={14} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.22)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>{GAME_TITLES[k]}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub || FRIEND_GAME_SUBS[k]}</div>
      </div>
      <GameInfoButton k={k} />
    </div>
  );
  const liveCount = (live || []).length;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 94, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.45)' }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, height: 'min(82vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px' }}>
              <Avatar emoji={group.avatar} name={group.name} size={44} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Games</div>
                <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>In {group.name}</div>
              </div>
            </div>
            <div style={{ padding: '0 16px 10px', borderBottom: `1px solid ${theme.border}` }}>
              <SegmentedControl value={tab} onChange={setTab} options={[['play', 'Play someone'], ['tour', 'Tournament'], ['live', liveCount ? `Live ${liveCount}` : 'Live']]} dense />
            </div>
          </div>
          <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, flex: 1, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '4px 0 6px' }}>
            {tab === 'play' && !kind && (
              <>
                <div style={{ padding: '10px 18px 4px', fontSize: 12.5, color: theme.muted, lineHeight: 1.45 }}>Pick a game, then who to play. Everyone else here can watch.</div>
                {GH_GROUP_KINDS.map((k) => gameRow(k, () => { hapticTap(); setKind(k); }))}
                {GH_GROUP_MORE.length > 0 && <div style={{ padding: '16px 18px 4px', fontSize: 12.5, fontWeight: 800, color: theme.muted }}>Everyone together</div>}
                {GH_GROUP_MORE.map((x) => gameRow(x.k, () => { hapticTap(); onClose(); x.open(group); }, x.sub))}
              </>
            )}
            {tab === 'play' && kind && (
              <>
                <div role="button" aria-label="Back to games" onClick={() => setKind(null)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px 8px', cursor: 'pointer' }}>
                  <ChevronLeft size={18} color={theme.muted} />
                  <span style={{ fontSize: 15, fontWeight: 800, color: theme.ink }}>{`Who will you play at ${String(GAME_TITLES[kind]).toLowerCase()}?`}</span>
                </div>
                {!people.length && <EmptyState art="friends" title="Nobody else is here yet" text="Add people to this group to play with them." />}
                {people.map(([id, p]) => (
                  <div key={id} role="button" aria-label={`Play with ${p.name}`} onClick={() => { onClose(); onPick({ type: 'match', kind, other: id }); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px', cursor: 'pointer' }}>
                    <Avatar emoji={p.avatar} name={p.name} size={42} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      {p.username && <div style={{ fontSize: 12.5, color: theme.muted }}>@{p.username}</div>}
                    </div>
                    <ChevronRight size={18} color={theme.muted} />
                  </div>
                ))}
              </>
            )}
            {tab === 'tour' && (
              <>
                <div style={{ padding: '10px 18px 4px', fontSize: 12.5, color: theme.muted, lineHeight: 1.45 }}>Post a tournament card. People join until you start it, then ZChat pairs everyone up. Winners go through until one is left.</div>
                {GH_TOUR_KINDS.map((k) => gameRow(k, () => { onClose(); onPick({ type: 'tour', kind: k }); }))}
              </>
            )}
            {tab === 'live' && live === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>}
            {tab === 'live' && live && !live.length && <EmptyState art="nothing" title="Nothing is being played" text="Start a game and everyone here can watch it live." />}
            {tab === 'live' && live && live.map((g) => {
              const mine = g.x === env.uid || g.o === env.uid;
              const myTurn = mine && (g.g === 'hang' ? g.o === env.uid : g.t === env.uid);
              return (
                <div key={g.id} role="button" aria-label={mine ? `Open ${GAME_TITLES[g.g]}` : `Watch ${GAME_TITLES[g.g]}`} onClick={() => { onClose(); onPick({ type: 'open', g }); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '8px 14px 8px 18px', cursor: 'pointer' }}>
                  <GameArt k={g.g} width={46} height={46} radius={13} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ghFirst(g.x)} vs {ghFirst(g.o)}</div>
                    <div style={{ fontSize: 12.5, color: myTurn ? kitOnInk(theme) : theme.muted, fontWeight: myTurn ? 700 : 400, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{GAME_TITLES[g.g]}{g.tr ? ', tournament' : ''}{myTurn ? ', your move' : ''}</div>
                  </div>
                  <GameButton small color={myTurn ? 'gold' : 'white'} label={mine ? 'Open' : 'Watch'} ariaLabel={mine ? 'Open' : 'Watch'} onClick={() => { onClose(); onPick({ type: 'open', g }); }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Portal>
  );
}
const ghLiveLists = new Map();
const GA2_GROUPS = [['Party games', ['wyr', 'nhie', 'mlt', 'ttl', 'emoji']], ['Big group games', ['bingo', 'wolf', 'dgs']], ['Cards and words', ['chain']]];
const GROUP_GAME_EXTRA = [];
export function Ga2PickerSheet({ group, onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const row = (k, title, sub, onClick, art) => (
    <div key={k} role="button" aria-label={title} onClick={() => { playUiSound('tap'); onClick(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '8px 14px 8px 18px', cursor: 'pointer' }}>
      {art || <GameArt k={k} width={50} height={50} radius={14} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.22)' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      </div>
      {GAME_RULES[k] && <GameInfoButton k={k} />}
    </div>
  );
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 94, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.45)' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: 'min(88vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px', borderBottom: `1px solid ${theme.border}` }}>
            <Avatar emoji={group.avatar} name={group.name} size={44} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Play a game</div>
              <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>With everyone in {group.name}</div>
            </div>
          </div>
        </div>
        <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '2px 0 6px' }}>
          {GA2_GROUPS.map(([label, keys]) => (
            <div key={label}>
              <div style={{ padding: '12px 18px 4px', fontSize: 12.5, fontWeight: 700, color: theme.muted }}>{label}</div>
              {keys.map((k) => row(k, GAME_TITLES[k], GA2_PLAYERS[k] ? `${GA2_SUBS[k]}, ${GA2_PLAYERS[k]}` : GA2_SUBS[k], () => onPick(k)))}
            </div>
          ))}
          {GROUP_GAME_EXTRA.length > 0 && (
            <div>
              <div style={{ padding: '12px 18px 4px', fontSize: 12.5, fontWeight: 700, color: theme.muted }}>More</div>
              {GROUP_GAME_EXTRA.map((x) => row(x.k, x.title, x.sub, () => { onClose(); x.onPick(group); }, x.art))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function liveQuestions(seed, n) {
  const rnd = seededRandom(`qrace:${seed}`);
  const pool = QUIZ_POOL.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, n);
}

function LiveScoreBar({ me, peer, mineScore, theirScore, isHost }) {
  const { theme } = useTheme();
  const side = (p, label, s, right) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8, flexDirection: right ? 'row-reverse' : 'row' }}>
      <Avatar emoji={p && p.avatar} name={(p && p.name) || label} size={40} />
      <div style={{ minWidth: 0, textAlign: right ? 'right' : 'left' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: theme.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s}</div>
      </div>
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 18, background: theme.rowBg }}>
      {side(me, 'You', mineScore, false)}
      <div style={{ fontSize: 12, fontWeight: 900, color: theme.muted }}>VS</div>
      {side(peer, String((peer && peer.name) || 'Friend').split(' ')[0], theirScore, true)}
    </div>
  );
}

export function QuizRaceBoard({ isHost, bus, seed, onHostFinish, onScore }) {
  const { theme } = useTheme();
  const rounds = LIVE_GAME_INFO.qrace.rounds;
  const qs = useMemo(() => liveQuestions(seed, rounds), [seed]);
  const [qi, setQi] = useState(-1);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [left, setLeft] = useState(9);
  const shownAt = useRef(0);
  const myRole = isHost ? 'x' : 'o';
  const host = useRef({ i: -1, answers: {}, decided: false, timer: 0, score: { x: 0, o: 0 } });
  const decide = (i) => {
    const h = host.current;
    if (h.i !== i || h.decided) return;
    h.decided = true;
    clearTimeout(h.timer);
    const ok = ['x', 'o'].filter((r) => h.answers[r] && h.answers[r].ok).sort((a, b) => h.answers[a].ms - h.answers[b].ms);
    const win = ok[0] || null;
    if (win) h.score = { ...h.score, [win]: h.score[win] + 1 };
    const payload = { t: 'r', i, win, sx: h.score.x, so: h.score.o };
    bus.send(payload);
    applyResult(payload);
    setTimeout(() => {
      if (i + 1 >= rounds) onHostFinish({ sx: h.score.x, so: h.score.o });
      else ask(i + 1);
    }, 1700);
  };
  const ask = (i) => {
    const h = host.current;
    h.i = i;
    h.answers = {};
    h.decided = false;
    bus.send({ t: 'q', i });
    showQuestion(i);
    clearTimeout(h.timer);
    h.timer = setTimeout(() => decide(i), 9200);
  };
  const hostAnswer = (role, a) => {
    const h = host.current;
    if (a.i !== h.i || h.decided || h.answers[role]) return;
    h.answers[role] = a;
    const both = h.answers.x && h.answers.o;
    if (both) { decide(a.i); return; }
    if (a.ok) { clearTimeout(h.timer); h.timer = setTimeout(() => decide(a.i), 450); }
  };
  const showQuestion = (i) => { setQi(i); setPicked(null); setResult(null); shownAt.current = performance.now(); setLeft(9); };
  const applyResult = (p) => { setResult(p); if (onScore) onScore(p.sx, p.so); if (p.win === myRole) playUiSound('like'); };
  useEffect(() => bus.listen((p) => {
    if (p.t === 'q' && !isHost) showQuestion(p.i);
    else if (p.t === 'r' && !isHost) applyResult(p);
    else if (p.t === 'a' && isHost) hostAnswer('o', p);
  }), [bus]);
  useEffect(() => { if (isHost) { const t = setTimeout(() => ask(0), 400); return () => clearTimeout(t); } return undefined; }, []);
  useEffect(() => () => clearTimeout(host.current.timer), []);
  useEffect(() => {
    if (qi < 0 || result) return undefined;
    const iv = setInterval(() => setLeft(Math.max(0, 9 - (performance.now() - shownAt.current) / 1000)), 100);
    return () => clearInterval(iv);
  }, [qi, result]);
  const choose = (idx) => {
    if (picked != null || result || qi < 0) return;
    setPicked(idx);
    hapticTap();
    const ok = idx === qs[qi][2];
    if (!ok) playUiSound('cancel');
    const a = { t: 'a', i: qi, ok, ms: Math.round(performance.now() - shownAt.current) };
    if (isHost) hostAnswer('x', a); else bus.send(a);
  };
  if (qi < 0) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.muted} /></div>;
  const q = qs[qi];
  return (
    <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 800, color: theme.muted }}>
        <span>Question {qi + 1} of {rounds}</span>
        <span style={{ color: left < 3 && !result ? theme.danger : theme.muted, fontVariantNumeric: 'tabular-nums' }}>{result ? 'Done' : `${Math.ceil(left)}s`}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: theme.rowBg, overflow: 'hidden' }}>
        <div style={{ width: `${result ? 0 : (left / 9) * 100}%`, height: '100%', background: theme.coral, transition: 'width 0.1s linear' }} />
      </div>
      <div style={{ padding: '20px 16px', borderRadius: 20, background: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.85)', border: `1px solid ${theme.border}`, fontSize: 19, fontWeight: 800, color: theme.ink, textAlign: 'center', lineHeight: 1.35 }}>{q[0]}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q[1].map((opt, idx) => {
          const right = idx === q[2];
          const showRight = !!result && right;
          const wrongPick = picked === idx && !right;
          return (
            <div key={idx} role="button" aria-label={`Answer ${opt}`} data-silent="1" onClick={() => choose(idx)} className="zchat-press"
              style={{ padding: '14px 10px', borderRadius: 16, textAlign: 'center', fontSize: 15, fontWeight: 800, cursor: picked == null && !result ? 'pointer' : 'default', border: `1.5px solid ${showRight ? '#22C55E' : wrongPick ? theme.danger : theme.border}`, background: showRight ? '#22C55E' : wrongPick ? `${theme.danger}22` : picked === idx ? `${theme.coral}22` : theme.panelBg, color: showRight ? 'white' : theme.ink, transition: 'background 0.15s ease' }}>{opt}</div>
          );
        })}
      </div>
      <div style={{ minHeight: 22, textAlign: 'center', fontSize: 14, fontWeight: 900, color: result && result.win === myRole ? '#16A34A' : theme.muted }}>
        {result ? (result.win === myRole ? 'Point to you' : result.win ? 'Point to them' : 'Nobody scored') : picked != null ? (picked === q[2] ? 'Right, waiting for the result' : 'Wrong, you are out of this one') : ' '}
      </div>
    </div>
  );
}

const LIVE_STICKER_IDS = ['haha', 'love', 'hi', 'yes', 'no', 'angry', 'cry', 'thanks', 'sorry', 'omw', 'sleepy', 'night'];
let liveStickers = null;
function liveStickerList() {
  if (liveStickers) return liveStickers;
  const by = new Map((ANIM_STICKERS || []).map((x) => [x.key, x]));
  liveStickers = [];
  LIVE_STICKER_IDS.forEach((id) => ['cat', 'tuk', 'ele'].forEach((p) => { const x = by.get(`as-${p}-${id}`); if (x) liveStickers.push(x); }));
  return liveStickers;
}

export function LiveGamePage({ initial, me, peer, myId, onClose, onSaveState, onRematch, onPeerAway }) {
  const { theme } = useTheme();
  const [st, setSt] = useState(initial);
  const isHost = st.x === myId;
  const kind = st.g;
  const startPhase = initial.st === 'done' ? 'end' : initial.st === 'gone' ? 'gone' : 'lobby';
  const [phase, setPhase] = useState(startPhase);
  const [peerHere, setPeerHere] = useState(false);
  const [count, setCount] = useState(3);
  const [scores, setScores] = useState({ x: initial.sx || 0, o: initial.so || 0 });
  const [leaveAsk, setLeaveAsk] = useState(false);
  const outerTheme = useContext(ThemeContext);
  const darkValue = useMemo(() => ({ ...outerTheme, theme: { ...outerTheme.theme, ...THEMES.dark, coral: outerTheme.theme.coral, accentSoft: outerTheme.theme.accentSoft }, dark: true }), [outerTheme]);
  const chRef = useRef(null);
  const listeners = useRef(new Set());
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const stRef = useRef(st);
  stRef.current = st;
  const awaySince = useRef(0);
  const pingedRef = useRef(false);
  const bus = useMemo(() => ({
    send: (payload) => { const ch = chRef.current; if (!ch) return; try { const r = ch.send({ type: 'broadcast', event: 'g', payload: { ...payload, from: myId } }); if (r && r.catch) r.catch(() => {}); } catch {} },
    listen: (fn) => { listeners.current.add(fn); return () => listeners.current.delete(fn); },
  }), [myId]);
  const save = (next) => { setSt(next); stRef.current = next; if (isHost && onSaveState) onSaveState(next); };
  const finishHost = ({ sx, so }) => {
    if (phaseRef.current === 'end') return;
    const w = sx === so ? 'd' : sx > so ? 'x' : 'o';
    bus.send({ t: 'end', sx, so, w });
    showEnd({ sx, so, w });
    save({ ...stRef.current, st: 'done', sx, so, w, n: (stRef.current.n || 0) + 1 });
  };
  const showEnd = ({ sx, so, w }) => {
    setScores({ x: sx, o: so });
    setSt((prev) => ({ ...prev, st: 'done', sx, so, w }));
    setPhase('end');
    const iWon = (w === 'x') === isHost && w !== 'd';
    kitSfx(iWon ? 'win' : w === 'd' ? 'turn' : 'lose');
    if (iWon) { try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
  };
  const beginCountdown = () => {
    if (phaseRef.current !== 'lobby') return;
    setPhase('count');
    setCount(3);
    kitSfx('count');
    let n = 3;
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(iv); setPhase('play'); kitSfx('go'); hapticTap(); }
      else { setCount(n); kitSfx('count'); }
    }, 800);
  };
  useEffect(() => {
    let alive = true;
    const hold = { ch: null };
    rtReady(`zrt-${initial.id}`).then(() => {
    if (!alive) return;
    const ch = supabase.channel(`zrt-${initial.id}`, { config: { broadcast: { self: false }, presence: { key: myId } } });
    hold.ch = ch;
    chRef.current = ch;
    ch.on('presence', { event: 'sync' }, () => {
      let here = false;
      try { here = Object.keys(ch.presenceState() || {}).some((k) => k !== myId); } catch {}
      setPeerHere(here);
    });
    ch.on('broadcast', { event: 'g' }, ({ payload }) => {
      if (!payload || payload.from === myId) return;
      if (payload.t === 'start' && !isHost) beginCountdown();
      else if (payload.t === 'end' && !isHost) showEnd(payload);
      else if (payload.t === 'bye') { if (phaseRef.current === 'play' || phaseRef.current === 'count') { setPhase('gone'); if (isHost) save({ ...stRef.current, st: 'gone' }); } }
      listeners.current.forEach((fn) => { try { fn(payload); } catch {} });
    });
    ch.subscribe((status) => { if (status === 'SUBSCRIBED') { try { const r = ch.track({ at: Date.now() }); if (r && r.catch) r.catch(() => {}); } catch {} } });
    });
    return () => {
      alive = false;
      const ch = hold.ch;
      if (ch) {
        try { ch.send({ type: 'broadcast', event: 'g', payload: { t: 'bye', from: myId } }); } catch {}
        try { ch.untrack(); } catch {}
        try { supabase.removeChannel(ch); } catch {}
      }
      chRef.current = null;
    };
  }, [initial.id]);
  useEffect(() => {
    if (!isHost || phase !== 'lobby' || !peerHere) return undefined;
    const t = setTimeout(() => {
      if (phaseRef.current !== 'lobby') return;
      bus.send({ t: 'start' });
      if (stRef.current.st !== 'live') save({ ...stRef.current, st: 'live' });
      beginCountdown();
    }, 700);
    return () => clearTimeout(t);
  }, [isHost, phase, peerHere]);
  useEffect(() => {
    if (phase !== 'lobby' || peerHere || pingedRef.current || !onPeerAway) return undefined;
    const t = setTimeout(() => { if (phaseRef.current === 'lobby') { pingedRef.current = true; onPeerAway(stRef.current); } }, 2500);
    return () => clearTimeout(t);
  }, [phase, peerHere]);
  useEffect(() => {
    if (phase !== 'play') { awaySince.current = 0; return undefined; }
    const iv = setInterval(() => {
      if (peerHere) { awaySince.current = 0; return; }
      if (!awaySince.current) awaySince.current = Date.now();
      if (Date.now() - awaySince.current > 7000 && phaseRef.current === 'play') {
        setPhase('gone');
        if (isHost) save({ ...stRef.current, st: 'gone' });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [phase, peerHere]);
  const leave = () => {
    if (phase === 'play' || phase === 'count') { setLeaveAsk(true); return; }
    onClose();
  };
  useBackClose(true, leave);
  useBackClose(leaveAsk, () => setLeaveAsk(false));
  const social = useMemo(() => ({
    me: myId,
    send: (t, data) => bus.send({ ...(data || {}), t }),
    on: (t, fn) => bus.listen((p) => { if (p && p.t === t) fn(p); }),
    stickers: liveStickerList(),
    phrases: ['Good luck', 'So close', 'Too fast', 'Well played', 'Wow', 'Thanks', 'Again?'],
  }), [bus, myId]);
  const first = String((peer && peer.name) || 'Your friend').split(' ')[0];
  const mineScore = isHost ? scores.x : scores.o;
  const theirScore = isHost ? scores.o : scores.x;
  const expired = st.st === 'wait' && st.exp && Date.now() > st.exp && !peerHere;
  const iWon = st.w && st.w !== 'd' && (st.w === 'x') === isHost;
  const onScore = (sx, so) => setScores({ x: sx, o: so });
  const firstOf = (p, fb) => String((p && p.name) || fb).split(' ')[0];
  const players = [
    { id: myId, name: 'You', avatar: <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={50} />, line: phase === 'play' || phase === 'end' ? `${mineScore} points` : 'Ready', turn: phase === 'play' },
    { id: peer && peer.id, name: first, avatar: <Avatar emoji={peer && peer.avatar} name={(peer && peer.name) || 'Friend'} size={50} />, here: peerHere, line: phase === 'play' || phase === 'end' ? `${theirScore} points` : peerHere ? 'Here' : 'Not here yet', turn: phase === 'play' },
  ];
  const statusText = phase === 'lobby' ? (expired ? 'This invite has ended' : peerHere ? 'Starting' : `Waiting for ${first}`) : phase === 'count' ? 'Get ready' : phase === 'play' ? 'Go' : null;
  return (
    <GameRoom k={kind} title={GAME_TITLES[kind]} sub={phase === 'end' ? 'Game over' : phase === 'gone' ? 'Game stopped' : peerHere ? `${first} is here` : `With ${firstOf(peer, 'your friend')}`}
      players={players} center={phase === 'play' || phase === 'end' ? `${mineScore} : ${theirScore}` : null} status={statusText} statusHot={phase === 'play' || (phase === 'lobby' && peerHere)}
      social={social} still={reducedMotion()} onClose={leave} rules={GAME_RULES[kind]}
      splash={{ title: GAME_TITLES[kind], sub: `You vs ${first}`, art: <GameArt k={kind} width={236} height={148} radius={0} />, players }}
      overlay={leaveAsk ? (
        <RoomSheet title="Leave the game?" text={`${first} will see that you left and nobody gets a win.`} onClose={() => setLeaveAsk(false)}>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <RoomButton label="Stay" onClick={() => setLeaveAsk(false)} style={{ flex: 1 }} />
            <RoomButton label="Leave" kind="danger" onClick={() => { setLeaveAsk(false); bus.send({ t: 'bye' }); if (isHost) save({ ...stRef.current, st: 'gone' }); onClose(); }} style={{ flex: 1 }} />
          </div>
        </RoomSheet>
      ) : null}>
      <ThemeContext.Provider value={darkValue}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 16px', boxSizing: 'border-box', overflowY: 'auto' }}>
          {phase === 'lobby' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', padding: '22px 20px', borderRadius: 26, background: 'rgba(12,10,22,0.62)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
              <GameArt k={kind} width={200} height={124} radius={22} style={{ boxShadow: '0 14px 30px rgba(0,0,0,0.35)' }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>{expired ? 'This invite has ended' : peerHere ? 'Starting' : `Waiting for ${first}`}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 280 }}>{expired ? 'Send a new one and play right away.' : peerHere ? 'Get ready to play.' : `The game starts as soon as ${first} opens it. Stay on this screen.`}</div>
              {!peerHere && !expired && <Spinner size={22} color="#FFFFFF" />}
              {expired && onRematch && <RoomButton label="Send a new invite" kind="go" onClick={onRematch} />}
            </div>
          )}
          {phase === 'count' && (
            <div key={count} className="zchat-roll-land" style={{ fontSize: 110, fontWeight: 900, color: '#FFFFFF', textShadow: '0 10px 40px rgba(0,0,0,0.45)' }}>{count}</div>
          )}
          {phase === 'play' && kind === 'tug' && <TugBoard isHost={isHost} bus={bus} onHostFinish={finishHost} onProgress={(a, b) => setScores(isHost ? { x: a, o: b } : { x: b, o: a })} />}
          {phase === 'play' && kind === 'qrace' && <QuizRaceBoard isHost={isHost} bus={bus} seed={initial.id} onHostFinish={finishHost} onScore={onScore} />}
          {phase === 'play' && kind === 'rrace' && <ReactionBoard isHost={isHost} bus={bus} onHostFinish={finishHost} onScore={onScore} />}
          {phase === 'end' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '24px 22px', borderRadius: 26, background: 'rgba(12,10,22,0.7)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
              <div style={{ position: 'relative' }}>
                {iWon && <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}><CrownIcon size={32} /></div>}
                <Avatar emoji={st.w === 'd' ? (me && me.avatar) : iWon ? (me && me.avatar) : (peer && peer.avatar)} name={iWon || st.w === 'd' ? (me && me.name) : (peer && peer.name)} size={96} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>{st.w === 'd' ? 'It is a draw' : iWon ? 'You won' : `${first} won`}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{mineScore} to {theirScore}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <RoomButton label="Back to chat" onClick={onClose} />
                {onRematch && <RoomButton label="Rematch" kind="go" onClick={onRematch} />}
              </div>
            </div>
          )}
          {phase === 'gone' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', padding: '24px 22px', borderRadius: 26, background: 'rgba(12,10,22,0.7)' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF' }}>{first} left the game</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>Nobody gets a win for this one.</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <RoomButton label="Back to chat" onClick={onClose} />
                {onRematch && <RoomButton label="Play again" kind="go" onClick={onRematch} />}
              </div>
            </div>
          )}
        </div>
      </ThemeContext.Provider>
    </GameRoom>
  );
}
function G1Bar({ left, right, mid }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', flexShrink: 0, borderBottom: `1px solid ${theme.hair}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
      {mid}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>{right}</div>
    </div>
  );
}
function G1Who({ id, label, hot, children, end }) {
  const { theme } = useTheme();
  const n = g1Mem.names[id] || {};
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: end ? 'row-reverse' : 'row', minWidth: 0 }}>
      <div style={{ borderRadius: '50%', boxShadow: hot ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px #4ADE80` : 'none', transition: 'box-shadow 200ms ease' }}><Avatar emoji={n.avatar} name={n.name || label} size={30} /></div>
      <div style={{ minWidth: 0, textAlign: end ? 'right' : 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {children}
      </div>
    </div>
  );
}

function g1GolfSaved(id, n) {
  const k = `${id}:${n}`;
  if (g1Mem.golf.has(k)) return g1Mem.golf.get(k);
  try { const v = JSON.parse(localStorage.getItem(`zchat-g1-golf-${k}`) || 'null'); if (v && Array.isArray(v)) return v; } catch {}
  return [];
}
function g1GolfSave(id, n, shots) {
  const k = `${id}:${n}`;
  g1Mem.golf.set(k, shots);
  try { if (shots.length) localStorage.setItem(`zchat-g1-golf-${k}`, JSON.stringify(shots)); else localStorage.removeItem(`zchat-g1-golf-${k}`); } catch {}
}
export function G1GolfPage({ st, myId, peerName, onClose }) {
  const Z = useG1();
  const { theme } = useTheme();
  const hostRef = useRef(null);
  const ctl = useRef(null);
  const busy = useRef(false);
  const stRef = useRef(st);
  stRef.current = st;
  const shown = useRef(null);
  const [shots, setShots] = useState(() => g1GolfSaved(st.id, st.n));
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const [watch, setWatch] = useState(null);
  const [flash, setFlash] = useState(null);
  const [ask, setAsk] = useState(false);
  const [, setTick] = useState(0);
  useBackClose(true, onClose);
  useBackClose(ask, () => setAsk(false));
  const other = st.x === myId ? st.o : st.x;
  const peer = peerName || g1First(other, 'Them');
  const myMark = st.x === myId ? 'x' : 'o';
  const canPutt = () => { const s = stRef.current; return !s.w && s.t === myId && !busy.current && shown.current === s.n; };
  const putt = (shot) => {
    const c = ctl.current;
    const s = stRef.current;
    if (!c || !Z || !canPutt()) return false;
    const from = Z.golf.playHole(s.h - 1, shotsRef.current).end;
    const r = Z.golf.putt(s.h - 1, from, shot);
    busy.current = true;
    hapticTap();
    playUiSound('tap');
    c.set({ canPutt: false });
    c.animate([r], () => {
      busy.current = false;
      if (stRef.current.n !== s.n || stRef.current.id !== s.id) { c.set({ canPutt: canPutt() }); setTick((x) => x + 1); return; }
      const ns = shotsRef.current.concat([shot]);
      if (r.holed || ns.length >= Z.golf.MAXS) {
        const next = Z.golf.finishHole(stRef.current, ns, myId);
        g1GolfSave(s.id, s.n, []);
        setShots([]);
        const strokes = r.holed ? ns.length : Z.golf.MAXS + 1;
        setFlash(r.holed ? (strokes === 1 ? 'Hole in one' : `In ${strokes}`) : 'Picked up, that counts 7');
        setTimeout(() => setFlash(null), 1600);
        if (r.holed && strokes <= 2) playUiSound('win');
        g1Send(next);
      } else {
        g1GolfSave(s.id, s.n, ns);
        setShots(ns);
        c.set({ canPutt: canPutt() });
      }
      setTick((x) => x + 1);
    });
    return true;
  };
  useEffect(() => {
    if (!Z || !hostRef.current) return undefined;
    const saved = shotsRef.current;
    const ball = saved.length ? Z.golf.playHole(st.h - 1, saved).end : null;
    shown.current = st.n;
    const c = Z.golf.mount(hostRef.current, { hole: st.h - 1, dark: theme.dark, canPutt: canPutt(), ball, onPutt: putt, onHit: (s) => { if (s > 0.1) playUiSound('tap'); }, onHoled: () => { playUiSound('point'); hapticTap(); } });
    if (ball) c.set({ ball });
    ctl.current = c;
    if (g1Test()) window.__g1golf = { putt: (shot) => putt(shot), find: (k) => Z.golf.findPutt(stRef.current.h - 1, Z.golf.playHole(stRef.current.h - 1, shotsRef.current).end, k || 0), hole: () => stRef.current.h, busy: () => busy.current || c.busy(), stats: () => c.stats(), state: () => stRef.current };
    return () => { c.destroy(); ctl.current = null; if (window.__g1golf) delete window.__g1golf; };
  }, [Z]);
  useEffect(() => { if (ctl.current) ctl.current.set({ dark: theme.dark }); }, [theme.dark]);
  const rest = (s) => { const sv = g1GolfSaved(s.id, s.n); return sv.length ? Z.golf.playHole(s.h - 1, sv).end : Z.golf.HOLES[s.h - 1].tee.slice(); };
  useEffect(() => {
    const c = ctl.current;
    if (!c || shown.current === st.n) return;
    shown.current = st.n;
    const fresh = g1GolfSaved(st.id, st.n);
    setShots(fresh);
    if (st.lb && st.lb !== myId && st.ls && st.lh) {
      const parts = Z.golf.playHole(st.lh - 1, st.ls).parts;
      busy.current = true;
      setWatch({ h: st.lh });
      c.set({ hole: st.lh - 1, canPutt: false });
      c.animate(parts, () => { busy.current = false; setWatch(null); const hs = stRef.current; c.set({ hole: hs.h - 1, canPutt: canPutt(), ...(!hs.w && hs.t === myId ? { ball: rest(hs) } : {}) }); setTick((x) => x + 1); });
    } else if (!busy.current) {
      c.set({ hole: st.h - 1, canPutt: canPutt(), ...(!st.w && st.t === myId ? { ball: rest(st) } : {}) });
    }
    setTick((x) => x + 1);
  }, [st.n]);
  const hole = watch ? watch.h : st.h;
  const H = Z ? Z.golf.HOLES[hole - 1] : null;
  const mine = myMark === 'x' ? st.sx : st.so;
  const theirs = myMark === 'x' ? st.so : st.sx;
  const sum = (a) => a.reduce((p, v) => p + v, 0);
  const out = g1Outcome(st, myId);
  const note = flash || (watch ? `Watching ${peer} on hole ${watch.h}` : st.w ? (out === 'draw' ? `Tied on ${sum(mine)}` : out === 'win' ? `You won, ${sum(mine)} to ${sum(theirs)}` : `${peer} won, ${sum(theirs)} to ${sum(mine)}`) : st.t === myId ? (shots.length ? `Putt ${shots.length + 1}. Drag back from the ball` : 'Drag back from the ball and let go') : `Waiting for ${peer} on hole ${st.h}`);
  return (
    <FullPage title={H ? `Hole ${hole}, ${H.n}` : 'Mini golf'} subtitle={H ? `Par ${H.par}` : ''} onBack={onClose} zIndex={63} pad={false}
      right={!st.w ? <HeaderIconButton label="Give up" onClick={() => setAsk(true)}><Flag size={19} /></HeaderIconButton> : null}
      bodyStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0, background: theme.dark ? '#0F0C1A' : '#EEF6EF' }}>
      <G1Bar left={<G1Who id={myId} label={`You, ${sum(mine)}`} hot={!st.w && st.t === myId} />} right={<G1Who id={other} label={`${peer}, ${sum(theirs)}`} hot={!st.w && st.t === other} end />}
        mid={<div style={{ fontSize: 12, fontWeight: 800, color: theme.muted }}>{st.w ? 'Final' : `${Math.min(9, st.h)} of 9`}</div>} />
      <div ref={hostRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>{!Z && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={22} color={theme.muted} /></div>}</div>
      <div style={{ flexShrink: 0, padding: '10px 14px calc(14px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: flash ? 800 : 600, color: flash ? theme.ink : theme.muted, minHeight: 20 }}>{note}</div>
        {st.w && !watch && <GameAgainButton onClick={() => { onClose(); if (g1Mem.host) g1Mem.host.rematch(st); }} />}
      </div>
      {ask && <ConfirmSheet title="Give up this game" text={`${peer} wins if you give up.`} confirmLabel="Give up" onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); g1Send({ ...stRef.current, n: (stRef.current.n || 0) + 1, w: myMark === 'x' ? 'o' : 'x', why: 'resign', ls: null, lb: myId }); }} />}
    </FullPage>
  );
}

function g1SdkRead(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function g1SdkWrite(key, v) { try { if (v) localStorage.setItem(key, JSON.stringify(v)); else localStorage.removeItem(key); } catch {} }
export function G1SudokuBoard({ level, givens: gIn, gameId, onSolved, footer }) {
  const Z = useG1();
  const { theme } = useTheme();
  const key = gameId ? `zchat-g1-sdk-${gameId}` : `zchat-g1-sdk-solo-${level}`;
  const [pz, setPz] = useState(null);
  const [vals, setVals] = useState(null);
  const [notes, setNotes] = useState(null);
  const [sel, setSel] = useState(null);
  const [pencil, setPencil] = useState(false);
  const [showErr, setShowErr] = useState(() => { try { return localStorage.getItem('zchat-g1-sdk-err') === '1'; } catch { return false; } });
  const [done, setDone] = useState(null);
  const hist = useRef([]);
  const t0 = useRef(Date.now());
  const sentRef = useRef(false);
  useEffect(() => {
    if (!Z || pz) return;
    const saved = g1SdkRead(key);
    if (gIn) {
      const sol = Z.sudoku.solve(gIn);
      setPz({ g: gIn, s: sol });
      setVals(saved && saved.g === gIn && saved.v ? saved.v.split('').map(Number) : gIn.split('').map(Number));
      setNotes(saved && saved.g === gIn && Array.isArray(saved.n) ? saved.n : new Array(81).fill(0));
      t0.current = Date.now() - ((saved && saved.g === gIn && saved.ms) || 0);
      return;
    }
    if (saved && saved.g && saved.v && !saved.done) {
      setPz({ g: saved.g, s: Z.sudoku.solve(saved.g) });
      setVals(saved.v.split('').map(Number));
      setNotes(Array.isArray(saved.n) ? saved.n : new Array(81).fill(0));
      t0.current = Date.now() - (saved.ms || 0);
      return;
    }
    const made = Z.sudoku.make(newClientId(), level || 2);
    setPz({ g: made.givens, s: made.sol });
    setVals(made.givens.split('').map(Number));
    setNotes(new Array(81).fill(0));
    t0.current = Date.now();
  }, [Z]);
  useEffect(() => {
    if (!pz || !vals || done) return;
    g1SdkWrite(key, { g: pz.g, v: vals.join(''), n: notes, ms: Date.now() - t0.current });
    if (vals.every((v, i) => String(v) === pz.s[i])) {
      const ms = Date.now() - t0.current;
      setDone(ms);
      playUiSound('win');
      try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {}
      if (!gameId) g1SdkWrite(key, null);
      if (onSolved && !sentRef.current) { sentRef.current = true; onSolved(vals.join(''), ms); }
    }
  }, [vals, notes]);
  const given = (i) => pz && pz.g[i] !== '0';
  const push = () => { hist.current.push([vals.slice(), notes.slice()]); if (hist.current.length > 300) hist.current.shift(); };
  const enter = (d) => {
    if (sel == null || !pz || done || given(sel)) return;
    hapticTap();
    playUiSound('tap');
    push();
    if (pencil && d) {
      const nn = notes.slice(); nn[sel] ^= 1 << (d - 1);
      const nv = vals.slice(); nv[sel] = 0;
      setNotes(nn); setVals(nv);
      return;
    }
    const nv = vals.slice();
    nv[sel] = nv[sel] === d ? 0 : d;
    const nn = notes.slice();
    nn[sel] = 0;
    if (nv[sel]) {
      const r = Math.floor(sel / 9); const c = sel % 9; const b0 = Math.floor(r / 3) * 27 + Math.floor(c / 3) * 3;
      for (let k = 0; k < 9; k++) { nn[r * 9 + k] &= ~(1 << (d - 1)); nn[k * 9 + c] &= ~(1 << (d - 1)); nn[b0 + Math.floor(k / 3) * 9 + (k % 3)] &= ~(1 << (d - 1)); }
    }
    setVals(nv); setNotes(nn);
  };
  const erase = () => { if (sel == null || given(sel) || done) return; push(); const nv = vals.slice(); nv[sel] = 0; const nn = notes.slice(); nn[sel] = 0; setVals(nv); setNotes(nn); hapticTap(); };
  const undo = () => { const h = hist.current.pop(); if (!h || done) return; setVals(h[0]); setNotes(h[1]); hapticTap(); playUiSound('cancel'); };
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && t.closest && t.closest('input, textarea, [contenteditable="true"]')) return;
      if (/^[1-9]$/.test(e.key)) { enter(Number(e.key)); e.preventDefault(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') { erase(); e.preventDefault(); return; }
      if (e.key === 'p' || e.key === 'P') { setPencil((v) => !v); return; }
      if ((e.key === 'z' || e.key === 'Z')) { undo(); return; }
      const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[e.key];
      if (mv) { e.preventDefault(); setSel((s) => { const i = s == null ? 40 : s + mv; return i < 0 || i > 80 || (Math.abs(mv) === 1 && Math.floor(i / 9) !== Math.floor((s == null ? 40 : s) / 9)) ? s : i; }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => { if (pz && g1Test()) window.__g1sdk = { sol: pz.s, givens: pz.g, fillBut: (keep) => setVals((prev) => prev.map((v, i) => (i === keep ? v : Number(pz.s[i])))) }; });
  if (!pz || !vals) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={22} color={theme.muted} /></div>;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const size = Math.min(vw - 28, 440);
  const cell = Math.floor((size - 8) / 9);
  const selV = sel != null ? vals[sel] : 0;
  const counts = new Array(10).fill(0);
  vals.forEach((v) => { if (v) counts[v] += 1; });
  const accent = theme.coral;
  const thick = theme.dark ? '#8C76F2' : '#5B44D4';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
      <div style={{ padding: 3, borderRadius: 12, background: thick, boxShadow: theme.dark ? '0 6px 20px rgba(0,0,0,0.45)' : '0 6px 20px rgba(60,40,140,0.18)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(9, ${cell}px)`, gap: 0, borderRadius: 9, overflow: 'hidden', background: thick }}>
          {vals.map((v, i) => {
            const r = Math.floor(i / 9); const c = i % 9;
            const sr = sel != null ? Math.floor(sel / 9) : -1; const sc = sel != null ? sel % 9 : -1;
            const same = sel != null && (r === sr || c === sc || (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3)));
            const sameNum = selV && v === selV;
            const bad = showErr && v && !given(i) && String(v) !== pz.s[i];
            const bg = sel === i ? (theme.dark ? '#4D3FA0' : '#D9D0FF') : sameNum ? (theme.dark ? '#3A3170' : '#E8E2FF') : same ? (theme.dark ? '#262040' : '#F4F1FF') : (theme.dark ? '#1A1630' : '#FFFFFF');
            return (
              <div key={i} role="button" aria-label={`Row ${r + 1} column ${c + 1}${v ? `, ${v}` : ', empty'}`} data-silent="1" onClick={() => { setSel(i); playUiSound('tap'); }}
                style={{ width: cell, height: cell, boxSizing: 'border-box', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
                  borderRight: c === 8 ? 'none' : `${c % 3 === 2 ? 2 : 0.5}px solid ${c % 3 === 2 ? thick : (theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(43,37,64,0.14)')}`,
                  borderBottom: r === 8 ? 'none' : `${r % 3 === 2 ? 2 : 0.5}px solid ${r % 3 === 2 ? thick : (theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(43,37,64,0.14)')}` }}>
                {v ? <span style={{ fontSize: cell * 0.56, fontWeight: given(i) ? 800 : 600, color: bad ? '#F87171' : given(i) ? theme.ink : accent, lineHeight: 1 }}>{v}</span>
                  : notes[i] ? (
                    <div style={{ position: 'absolute', inset: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}>
                      {Array.from({ length: 9 }).map((_, k) => <span key={k} style={{ fontSize: cell * 0.22, lineHeight: 1, color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{notes[i] & (1 << k) ? k + 1 : ''}</span>)}
                    </div>
                  ) : null}
              </div>
            );
          })}
        </div>
      </div>
      {done != null ? (
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: theme.ink }}>Solved in {g1Clock(done)}</div>
          <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4 }}>{gameId ? 'Your time went to the chat' : `${G1_LEVELS[level] || ''} puzzle done`}</div>
          {!gameId && <GameButton label="New puzzle" color="green" onClick={() => { setPz(null); setVals(null); setNotes(null); setDone(null); hist.current = []; sentRef.current = false; setTimeout(() => { const made = Z.sudoku.make(newClientId(), level || 2); setPz({ g: made.givens, s: made.sol }); setVals(made.givens.split('').map(Number)); setNotes(new Array(81).fill(0)); t0.current = Date.now(); }, 0); }} style={{ marginTop: 14, minWidth: 160 }} />}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, width: size, justifyContent: 'space-between' }}>
            {[['Undo', undo, false], ['Erase', erase, false], [pencil ? 'Pencil on' : 'Pencil', () => { hapticTap(); setPencil((p) => !p); }, pencil], [showErr ? 'Mistakes shown' : 'Show mistakes', () => { hapticTap(); setShowErr((s) => { try { localStorage.setItem('zchat-g1-sdk-err', s ? '0' : '1'); } catch {} return !s; }); }, showErr]].map(([l, f, on]) => (
              <div key={l} role="button" aria-label={l} aria-pressed={on || undefined} onClick={f} className="zchat-press" style={{ flex: '1 1 auto', padding: '0 9px', height: 38, borderRadius: 12, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: on ? '#FFFFFF' : theme.ink, background: on ? accent : (theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(30,20,70,0.06)'), whiteSpace: 'nowrap' }}>{l}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 5, marginTop: 10, width: size }}>
            {Array.from({ length: 9 }).map((_, k) => {
              const d = k + 1;
              const full = counts[d] >= 9;
              return (
                <div key={d} role="button" aria-label={`Number ${d}`} onClick={() => enter(d)} className="zchat-press" style={{ height: 52, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: theme.dark ? 'rgba(255,255,255,0.08)' : '#FFFFFF', boxShadow: theme.dark ? 'none' : '0 1px 3px rgba(40,20,90,0.12)', opacity: full ? 0.35 : 1 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: pencil ? theme.muted : accent, lineHeight: 1 }}>{d}</span>
                </div>
              );
            })}
          </div>
          {vals.every((v) => v) && <div style={{ fontSize: 13, color: theme.muted, marginTop: 12 }}>Every square is full, but something is not right yet</div>}
        </>
      )}
      {footer}
    </div>
  );
}


const G1_KEYS_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
export function G1CrossPage({ st, myId, peerName, onClose }) {
  const { theme } = useTheme();
  const pz = st.pz;
  const W = pz.w;
  const N = pz.w * pz.h;
  const sol = pz.cells;
  const myMark = myId === st.x ? 'x' : 'o';
  const other = myId === st.x ? st.o : st.x;
  const peer = peerName || g1First(other, 'your friend');
  const cacheKey = `zchat-g1-xw-${st.id}`;
  const blank = () => sol.split('').map((ch) => (ch === '#' ? '#' : '.')).join('');
  const [cells, setCells] = useState(() => { try { const v = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (v && v.c && v.c.length === N) return v.c; } catch {} return blank(); });
  const [own, setOwn] = useState(() => { try { const v = JSON.parse(localStorage.getItem(cacheKey) || 'null'); if (v && v.o && v.o.length === N) return v.o; } catch {} return '.'.repeat(N); });
  const firstCell = sol.split('').findIndex((ch) => ch !== '#');
  const [cur, setCur] = useState({ i: firstCell, d: pz.clues.some((c) => c.d === 'a' && c.r * W + c.c === firstCell) ? 'a' : 'd' });
  const [peerCur, setPeerCur] = useState(null);
  const [here, setHere] = useState(false);
  const [bad, setBad] = useState({});
  const chRef = useRef(null);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const ownRef = useRef(own);
  ownRef.current = own;
  const stRef = useRef(st);
  stRef.current = st;
  const sentRef = useRef(false);
  const queue = useRef(new Map());
  useBackClose(true, onClose);
  const solved = st.w === 'done' || (cells === sol);
  const seqRef = useRef(0);
  const dirtyRef = useRef(new Map());
  const setCell = (i, ch, by, local) => {
    seqRef.current += 1;
    dirtyRef.current.set(i, seqRef.current);
    const c = cellsRef.current.split(''); const o = ownRef.current.split('');
    c[i] = ch || '.'; o[i] = ch ? by : '.';
    const nc = c.join(''); const no = o.join('');
    cellsRef.current = nc; ownRef.current = no;
    setCells(nc); setOwn(no);
    if (local) setBad((b) => { if (!b[i]) return b; const nb = { ...b }; delete nb[i]; return nb; });
    try { localStorage.setItem(cacheKey, JSON.stringify({ c: nc, o: no })); } catch {}
  };
  const flush = () => {
    queue.current.forEach((ch, i) => {
      supabase.rpc('zchat_xw_put', { p_game: st.id, p_idx: i, p_ch: ch || '' }).then(({ error }) => { if (!error && queue.current.get(i) === ch) queue.current.delete(i); }, () => {});
    });
  };
  useEffect(() => {
    let alive = true;
    const pull = (full) => { const at = seqRef.current; return supabase.rpc('zchat_xw_get', { p_game: st.id }).then(({ data }) => {
      if (!alive || !data || typeof data.cells !== 'string' || data.cells.length !== N) return;
      const c = data.cells.split(''); const o = (data.owners || '').padEnd(N, '.').split('');
      const lc = cellsRef.current; const lo = ownRef.current;
      for (let i = 0; i < N; i++) if ((dirtyRef.current.get(i) || 0) > at || (!full && (lc[i] !== '.' || c[i] === '.'))) { c[i] = lc[i]; o[i] = lo[i]; }
      queue.current.forEach((ch, i) => { c[i] = ch || '.'; o[i] = ch ? myMark : '.'; });
      const nc = c.map((ch, i) => (sol[i] === '#' ? '#' : ch)).join('');
      if (nc === cellsRef.current && o.join('') === ownRef.current) return;
      cellsRef.current = nc; ownRef.current = o.join('');
      setCells(nc); setOwn(o.join(''));
    }, () => {}); };
    pull(true);
    const again = setInterval(() => { if (document.visibilityState === 'visible' && stRef.current.w !== 'done') pull(false); }, 8000);
    const onVis = () => { if (document.visibilityState === 'visible') pull(false); };
    document.addEventListener('visibilitychange', onVis);
    const hold = { ch: null };
    rtReady(`zxw-${st.id}`).then(() => {
      if (!alive) return;
      const ch = supabase.channel(`zxw-${st.id}`, { config: { broadcast: { self: false }, presence: { key: myId } } });
      hold.ch = ch;
      chRef.current = ch;
      ch.on('presence', { event: 'sync' }, () => { let h = false; try { h = Object.keys(ch.presenceState() || {}).some((k) => k !== myId); } catch {} setHere(h); });
      ch.on('broadcast', { event: 'c' }, ({ payload }) => { if (!payload || payload.by === myMark || typeof payload.i !== 'number') return; setCell(payload.i, payload.ch, payload.by, false); });
      ch.on('broadcast', { event: 'k' }, ({ payload }) => { if (!payload || payload.by === myMark) return; setPeerCur({ i: payload.i, d: payload.d }); });
      ch.subscribe((status) => { if (status === 'SUBSCRIBED') { try { const r = ch.track({ at: Date.now() }); if (r && r.catch) r.catch(() => {}); } catch {} try { ch.send({ type: 'broadcast', event: 'k', payload: { i: cur.i, d: cur.d, by: myMark } }); } catch {} } });
    });
    const iv = setInterval(() => { if (queue.current.size) flush(); }, 4000);
    return () => {
      alive = false;
      clearInterval(again);
      document.removeEventListener('visibilitychange', onVis);
      clearInterval(iv);
      if (queue.current.size) flush();
      const ch = hold.ch;
      if (ch) { try { ch.untrack(); } catch {} try { supabase.removeChannel(ch); } catch {} }
      chRef.current = null;
    };
  }, [st.id]);
  const bcast = (event, payload) => { const ch = chRef.current; if (ch) { try { ch.send({ type: 'broadcast', event, payload: { ...payload, by: myMark } }); } catch {} } };
  useEffect(() => { bcast('k', { i: cur.i, d: cur.d }); }, [cur.i, cur.d]);
  useEffect(() => {
    if (st.w === 'done' || sentRef.current || cells !== sol) return;
    sentRef.current = true;
    playUiSound('win');
    try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {}
    const startAt = stRef.current.at || 0;
    setTimeout(() => {
      const s = stRef.current;
      if (s.w === 'done') return;
      const tm = startAt ? Date.now() - startAt : 0;
      flush();
      setTimeout(() => g1Send({ ...s, n: (s.n || 0) + 1, w: 'done', tm: Math.max(1000, tm) }), 600);
    }, 400);
  }, [cells]);
  const clueOf = (i, d) => pz.clues.find((cl) => cl.d === d && (d === 'a' ? cl.r === Math.floor(i / W) && i % W >= cl.c && i % W < cl.c + cl.l : cl.c === i % W && Math.floor(i / W) >= cl.r && Math.floor(i / W) < cl.r + cl.l));
  const cellsOf = (cl) => Array.from({ length: cl.l }, (_, k) => (cl.d === 'd' ? (cl.r + k) * W + cl.c : cl.r * W + cl.c + k));
  const curClue = clueOf(cur.i, cur.d) || clueOf(cur.i, cur.d === 'a' ? 'd' : 'a');
  const curWord = curClue ? cellsOf(curClue) : [];
  const select = (i) => {
    if (sol[i] === '#') return;
    playUiSound('tap');
    if (i === cur.i) { const nd = cur.d === 'a' ? 'd' : 'a'; if (clueOf(i, nd)) setCur({ i, d: nd }); return; }
    setCur({ i, d: clueOf(i, cur.d) ? cur.d : cur.d === 'a' ? 'd' : 'a' });
  };
  const type = (ch) => {
    if (solved) return;
    const i = cur.i;
    if (i < 0 || sol[i] === '#') return;
    hapticTap();
    playUiSound('key');
    setCell(i, ch, myMark, true);
    bcast('c', { i, ch });
    queue.current.set(i, ch);
    supabase.rpc('zchat_xw_put', { p_game: st.id, p_idx: i, p_ch: ch }).then(({ error }) => { if (!error && queue.current.get(i) === ch) queue.current.delete(i); }, () => {});
    const word = curClue ? cellsOf(curClue) : [i];
    const k = word.indexOf(i);
    const nextEmpty = word.slice(k + 1).find((j) => cellsRef.current[j] === '.');
    const nx = nextEmpty != null ? nextEmpty : word[k + 1];
    if (nx != null) setCur({ i: nx, d: curClue ? curClue.d : cur.d });
  };
  const back = () => {
    if (solved) return;
    const i = cur.i;
    if (cellsRef.current[i] !== '.') { type(''); return; }
    const word = curClue ? cellsOf(curClue) : [i];
    const k = word.indexOf(i);
    if (k > 0) { const j = word[k - 1]; setCur({ i: j, d: cur.d }); setCell(j, '', myMark, true); bcast('c', { i: j, ch: '' }); queue.current.set(j, ''); supabase.rpc('zchat_xw_put', { p_game: st.id, p_idx: j, p_ch: '' }).then(() => {}, () => {}); }
  };
  const check = (list) => {
    hapticTap();
    const nb = {};
    let wrong = 0;
    list.forEach((i) => { if (cellsRef.current[i] !== '.' && cellsRef.current[i] !== sol[i]) { nb[i] = 1; wrong += 1; } });
    setBad((b) => ({ ...b, ...nb }));
    playUiSound(wrong ? 'toggle' : 'point');
    if (!wrong) appSnack(list.length === 1 ? 'That letter is right' : 'Everything there is right so far');
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); type(e.key.toUpperCase()); return; }
      if (e.key === 'Backspace') { e.preventDefault(); back(); return; }
      const mv = { ArrowLeft: [-1, 'a'], ArrowRight: [1, 'a'], ArrowUp: [-W, 'd'], ArrowDown: [W, 'd'] }[e.key];
      if (mv) { e.preventDefault(); let j = cur.i + mv[0]; while (j >= 0 && j < N && sol[j] === '#' && (mv[1] === 'd' || Math.floor(j / W) === Math.floor(cur.i / W))) j += mv[0]; if (j >= 0 && j < N && sol[j] !== '#' && (mv[1] === 'd' || Math.floor(j / W) === Math.floor(cur.i / W))) setCur({ i: j, d: clueOf(j, mv[1]) ? mv[1] : cur.d }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => { if (g1Test()) window.__g1xw = { type, select, check: () => check(curWord), sol, cells: () => cellsRef.current, cur: () => cur, peer: () => peerCur, here: () => here }; });
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const size = Math.min(vw - 28, 420);
  const cell = Math.floor((size - 4) / Math.max(pz.w, pz.h));
  const nums = {};
  pz.clues.forEach((cl) => { nums[cl.r * W + cl.c] = cl.n; });
  const mineCol = theme.dark ? '#B5A3FF' : '#5B3FD6';
  const theirCol = '#EA7317';
  const keyBg = theme.dark ? 'rgba(255,255,255,0.1)' : '#FFFFFF';
  return (
    <FullPage title="Crossword" subtitle={solved ? 'Solved together' : here ? `${peer} is solving with you` : `${peer} is not here right now`} onBack={onClose} zIndex={63} pad={false}
      bodyStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pz.w}, ${cell}px)`, padding: 2, borderRadius: 8, background: theme.dark ? '#0B0914' : '#2B2540' }}>
          {sol.split('').map((s, i) => {
            if (s === '#') return <div key={i} style={{ width: cell, height: cell }} />;
            const v = cells[i];
            const inWord = curWord.includes(i);
            const isCur = cur.i === i;
            const peerHere = peerCur && peerCur.i === i;
            const by = own[i];
            return (
              <div key={i} role="button" aria-label={`Square ${Math.floor(i / W) + 1} ${i % W + 1}${v !== '.' ? `, ${v}` : ''}`} data-silent="1" onClick={() => select(i)}
                style={{ width: cell, height: cell, boxSizing: 'border-box', position: 'relative', cursor: 'pointer', border: `0.5px solid ${theme.dark ? '#0B0914' : '#2B2540'}`, background: solved ? '#E8FBEF' : isCur ? '#FFE27A' : inWord ? '#E4DCFF' : '#FFFFFF', boxShadow: peerHere ? `inset 0 0 0 3px ${theirCol}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {nums[i] && <span style={{ position: 'absolute', left: 2, top: 1, fontSize: Math.max(8, cell * 0.24), fontWeight: 700, color: '#4A4560', lineHeight: 1 }}>{nums[i]}</span>}
                {v !== '.' && <span style={{ fontSize: cell * 0.56, fontWeight: 800, lineHeight: 1, marginTop: cell * 0.08, color: solved ? '#1F7A45' : bad[i] ? '#E11D48' : by === myMark ? mineCol : theirCol, textDecoration: bad[i] ? 'line-through' : 'none' }}>{v}</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, fontSize: 12, fontWeight: 700, color: theme.muted }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: mineCol }} />You</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: theirCol }} />{peer}</span>
        </div>
      </div>
      {solved ? (
        <div style={{ flexShrink: 0, padding: '14px 16px calc(14px + env(safe-area-inset-bottom))', textAlign: 'center', borderTop: `1px solid ${theme.hair}` }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: theme.ink }}>{st.w === 'done' && st.tm ? `Solved in ${g1Clock(st.tm)}` : 'Solved'}</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 3 }}>You and {peer} finished it together</div>
          <GameAgainButton label="New crossword" onClick={() => { onClose(); if (g1Mem.host) g1Mem.host.rematch(stRef.current); }} />
        </div>
      ) : (
      <div style={{ flexShrink: 0, padding: '6px 6px calc(10px + env(safe-area-inset-bottom))', background: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(40,20,90,0.04)', borderTop: `1px solid ${theme.hair}` }}>
        <div role="button" aria-label="Switch direction" onClick={() => { if (clueOf(cur.i, cur.d === 'a' ? 'd' : 'a')) setCur({ i: cur.i, d: cur.d === 'a' ? 'd' : 'a' }); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, background: theme.dark ? 'rgba(124,92,252,0.18)' : '#EDE7FF', margin: '0 4px 8px', cursor: 'pointer' }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: theme.coral, flexShrink: 0 }}>{curClue ? `${curClue.n} ${curClue.d === 'a' ? 'across' : 'down'}` : ''}</div>
          <div style={{ fontSize: 14, color: theme.ink, flex: 1, minWidth: 0, lineHeight: 1.3 }}>{curClue ? curClue.q : 'Tap a square to start'}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, margin: '0 4px 8px' }}>
          <Ga1TextBtn label="Check letter" onClick={() => check([cur.i])} />
          <Ga1TextBtn label="Check word" onClick={() => check(curWord)} />
        </div>
        {G1_KEYS_ROWS.map((row, ri) => (
          <div key={row} style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 5 }}>
            {row.split('').map((k) => (
              <div key={k} role="button" aria-label={`Letter ${k}`} onClick={() => type(k)} className="zchat-press" style={{ flex: '1 1 0', maxWidth: 40, height: 42, borderRadius: 8, background: keyBg, boxShadow: theme.dark ? 'none' : '0 1px 2px rgba(40,20,90,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: theme.ink, cursor: 'pointer', userSelect: 'none' }}>{k}</div>
            ))}
            {ri === 2 && <div role="button" aria-label="Delete" onClick={back} className="zchat-press" style={{ flex: '1.6 1 0', maxWidth: 62, height: 42, borderRadius: 8, background: keyBg, boxShadow: theme.dark ? 'none' : '0 1px 2px rgba(40,20,90,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer' }}><ChevronLeft size={20} /></div>}
          </div>
        ))}
      </div>
      )}
    </FullPage>
  );
}
