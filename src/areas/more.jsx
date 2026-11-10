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
  ANIM_STICKER_FILES,
  Avatar,
  BigButton,
  ChoiceList,
  CoinIcon,
  CommunityAvatar,
  CrCoinsLine,
  CrGlyph,
  CrNote,
  CrSheet,
  DetailRow,
  DetailSection,
  EmptyState,
  FONT,
  FeedPanel,
  FocusIcon,
  FollowStatusPill,
  HeaderIconButton,
  HomeHeader,
  IgHeading,
  IgToggle,
  IgTopBar,
  InkVeil,
  LineTabs,
  LoadFail,
  PROFILE_COLS,
  PickTiles,
  PillButton,
  Portal,
  STICKERS,
  Spinner,
  Star_,
  StudioGlyph,
  UserListRow,
  WideDim,
  appSnack,
  backStack,
  bfxPlay,
  cmEnsureCss,
  coinsText,
  countWord,
  crCall,
  crFirst,
  crFresh,
  crPatch,
  crS,
  crSpend,
  formatCount,
  friendlyError,
  getFavoriteStickerKeys,
  hapticTap,
  igPalette,
  inputStyle,
  kitOnInk,
  loadFailCode,
  loadImageElement,
  loadMissing,
  moreCoinsText,
  navCtl,
  overlayKindOf,
  playUiSound,
  postThumbOf,
  prefOn,
  psAltOf,
  psFetchTagReqs,
  psPendingMem,
  psPhotosMem,
  psTagDrop,
  psTagReqMem,
  readMyStickersLocal,
  reducedMotion,
  resolveMedia,
  rtDrop,
  rtKeep,
  rtName,
  rtOnRefresh,
  sanitizeAvatarList,
  shortAgo,
  stackPing,
  stackSubs,
  toggleFavoriteSticker,
  useBackClose,
  useCr,
  useEdgeSwipeBack,
  useSheetDrag,
  useTheme,
  useWallet,
  writeMyStickersLocal,
  zchatTools,
} from '../App.jsx';
import {
  AiStyleThumb,
  KitSection,
  StudioDark,
  StudioTool,
  TagThumb,
  aipDropJob,
  aipFit,
  aipStartJob,
  aipWaitJob,
  saveImageToDevice,
  useTrendingTags,
} from './shared.jsx';

function navRootNow() {
  try {
    if (navCtl.rootCount) return Math.max(0, Number(navCtl.rootCount()) || 0);
    return navCtl.rootOpen && navCtl.rootOpen() ? 1 : 0;
  } catch { return 0; }
}
function rootPageEls() {
  const out = [];
  if (typeof document === 'undefined') return out;
  try {
    const root = document.getElementById('zapp-root');
    if (!root) return out;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const wide = w >= 900;
    const els = root.querySelectorAll('.zchat-panel-open, .zchat-fade');
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (el.getAttribute('data-ghost-skip') != null || el.getAttribute('data-ghost') != null) continue;
      const chat = el.classList.contains('zchat-chat-panel');
      let k = null;
      if (chat) { if (wide) continue; }
      else { k = overlayKindOf(el); if (k !== 'page' && k !== 'fade' && k !== 'dialog') continue; }
      const r = el.getBoundingClientRect();
      const column = wide && (el.classList.contains('zchat-wide-page') || el.classList.contains('zchat-wide-feed'));
      if (r.width < (column ? Math.min(w * 0.6, 560) : w * 0.6) || r.height < h * 0.5) continue;
      const cs = getComputedStyle(el);
      if (cs.pointerEvents === 'none') continue;
      if (k === 'dialog' || k === 'fade') {
        const m = /rgba?\(([^)]+)\)/.exec(cs.backgroundColor || '');
        const alpha = m ? (m[1].split(',').length > 3 ? Number(m[1].split(',')[3]) : 1) : 0;
        if (alpha < 0.9 && cs.backgroundImage === 'none') continue;
      }
      out.push(el);
    }
  } catch {}
  return out;
}
function useRootPageCover(on = true) {
  const [hid, setHid] = useState(false);
  useLayoutEffect(() => {
    if (!on) return undefined;
    let base = null;
    const check = () => {
      if (!base) { base = { stack: backStack.length, root: navRootNow(), els: new Set(rootPageEls()) }; return; }
      const grew = backStack.length > base.stack || navRootNow() > base.root;
      const next = grew && rootPageEls().some((el) => !base.els.has(el));
      setHid((v) => (v === next ? v : next));
    };
    stackSubs.add(check);
    stackPing();
    return () => { stackSubs.delete(check); };
  }, [on]);
  return on && hid;
}

function usePageCover(hidden, pageRef, scrollEl) {
  const [gone, setGone] = useState(!!hidden);
  const keep = useRef(-1);
  const first = useRef(true);
  useLayoutEffect(() => {
    const el = pageRef.current;
    const sc = scrollEl ? scrollEl() : null;
    const wasFirst = first.current;
    first.current = false;
    if (hidden) {
      if (sc) keep.current = sc.scrollTop;
      if (!el || wasFirst || reducedMotion()) { setGone(true); return undefined; }
      el.style.animation = 'zchat-panel-zoom-out 0.21s cubic-bezier(0.4, 0, 1, 1) forwards';
      el.style.pointerEvents = 'none';
      const t = setTimeout(() => setGone(true), 230);
      return () => clearTimeout(t);
    }
    if (el) {
      el.style.pointerEvents = '';
      if (!wasFirst) el.style.animation = reducedMotion() ? 'none' : 'zchat-panel-back-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
    setGone(false);
    return undefined;
  }, [hidden]);
  useLayoutEffect(() => {
    if (gone || hidden) return;
    const sc = scrollEl ? scrollEl() : null;
    if (sc && keep.current >= 0) { sc.scrollTop = keep.current; keep.current = -1; }
  }, [gone]);
  return gone;
}
export function TopLayer({ children, zIndex = 76 }) {
  const ref = useRef(null);
  const hidden = useRootPageCover(true);
  const gone = usePageCover(hidden, ref, null);
  return <Portal><div ref={ref} style={{ position: 'fixed', inset: 0, zIndex, display: gone ? 'none' : 'block' }}>{children}</div></Portal>;
}
export function FullPage({ title, subtitle, onBack, right, zIndex = 60, children, pad = true, portal = true, footer, bodyStyle, scrollRef, covered = false, scrollProps }) {
  const { theme } = useTheme();
  const c = igPalette(theme);
  const edgeBack = useEdgeSwipeBack(true);
  const pageRef = useRef(null);
  const innerScroll = useRef(null);
  const setScroll = (n) => { innerScroll.current = n; if (typeof scrollRef === 'function') scrollRef(n); else if (scrollRef) scrollRef.current = n; };
  const auto = useRootPageCover(portal);
  const hidden = !!covered || auto;
  const gone = usePageCover(hidden, pageRef, () => innerScroll.current);
  const body = (
    <>
    {!gone && <WideDim onClose={onBack} z={zIndex} />}
    <div {...edgeBack} ref={pageRef} data-zwhere={typeof title === 'string' ? title : undefined} className="zchat-panel-open zchat-wide-page" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex, background: c.bg, color: c.fg, fontFamily: FONT, display: gone ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <IgTopBar title={title} subtitle={subtitle} onBack={onBack} right={right} />
      <div ref={setScroll} {...(scrollProps || {})} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: pad ? '4px 16px' : 0, paddingBottom: footer ? 16 : 'calc(28px + env(safe-area-inset-bottom))', ...(bodyStyle || {}) }}>{children}</div>
      {footer && <div style={{ flexShrink: 0, padding: '10px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', background: c.bg, borderTop: `1px solid ${c.line}` }}>{footer}</div>}
    </div>
    </>
  );
  return portal ? <Portal>{body}</Portal> : body;
}

export function DiscoverPanel({ myId, blockedIds, onClose, onOpenProfile, onOpenTag, onOpenTrending }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);
  const [iFollow, setIFollow] = useState(new Set());
  const [followsMe, setFollowsMe] = useState(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select(PROFILE_COLS).eq('is_private', false).eq('is_deleted', false).neq('id', myId).limit(40);
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
    <>
    <WideDim onClose={onClose} z={25} />
    <div {...edgeBack} style={{
      position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 25,
      display: 'flex', flexDirection: 'column',
    }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Discover" subtitle={people && people.length ? `${people.length} public accounts` : undefined} onBack={onClose} />
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, padding: '4px 18px', paddingBottom: 'calc(4px + env(safe-area-inset-bottom))' }}>
        {onOpenTag && <TrendingStrip userId={myId} onOpenTag={onOpenTag} onSeeAll={onOpenTrending} />}
        {people === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>
        ) : people.length === 0 ? (
          <EmptyState art="discover" title="No one to discover yet" text="Public accounts show up here as people join ZChat." />
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
    </>
  );
}
function animPackOf(file) {
  if (!ANIM_STICKER_FILES.has(file)) return null;
  const m = /^\/as-([a-z0-9]+)-/.exec(file);
  return m ? ANIM_PACKS.find((p) => p.pack === m[1]) || null : null;
}
export function CommunitiesPage({ list, ready, covered, onClose, onOpen, onNew, inline = false }) {
  useBackClose(!inline, onClose);
  const { theme } = useTheme();
  const owned = list.filter((c) => c.role === 'owner').length;
  const body = (
    <>
      {!list.length && !ready ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={18} color={theme.muted} /></div>
      ) : !list.length ? (
        <EmptyState art="friends" title="No communities yet" text="A community keeps related groups together, like a class, a club or a team, with one announcements chat for everyone." action={<PillButton primary label="New community" onClick={onNew} />} />
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '8px 2px 8px', textWrap: 'pretty' }}>Groups that belong together, with one place for announcements.</div>
          {list.map((c) => {
            const n = (c.groups || []).length;
            return (
              <div key={c.id} role="button" aria-label={`Open ${c.name}`} onClick={() => onOpen(c)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 4px', borderRadius: 14, cursor: 'pointer' }}>
                <CommunityAvatar avatar={c.avatar} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[c.role === 'owner' ? 'You run it' : c.role === 'admin' ? 'You are an admin' : null, n > 0 ? countWord(n, 'group', 'groups') : null, countWord(Number(c.members) || 0, 'member', 'members')].filter(Boolean).join(', ')}
                  </div>
                </div>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            );
          })}
          {owned >= 5 && <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', padding: '14px 8px 4px' }}>You run 5 communities, the most one person can make.</div>}
        </>
      )}
    </>
  );
  if (inline) {
    return (
      <div className="zchat-tab-in" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <HomeHeader title="Communities" right={list.length && owned < 5 ? <HeaderIconButton label="New community" onClick={() => { hapticTap(); onNew(); }}><Plus /></HeaderIconButton> : null} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px calc(16px + env(safe-area-inset-bottom))' }}>{body}</div>
      </div>
    );
  }
  return (
    <FullPage title="Communities" onBack={onClose} zIndex={61} covered={covered}
      footer={list.length ? <BigButton label="New community" onClick={onNew} disabled={owned >= 5} /> : null}>
      {body}
    </FullPage>
  );
}

const RESTYLE_STYLES = [['oil', 'Painting'], ['cartoon', 'Cartoon'], ['sketch', 'Sketch'], ['comic', 'Comic'], ['watercolor', 'Watercolour']];
const RESTYLE_WAIT = ['Looking at your photo', 'Choosing the colours', 'Painting it in', 'Adding the details', 'Almost there'];
function restyleRatio(w, h) {
  const r = w / Math.max(1, h);
  const opts = [['1:1', 1], ['4:5', 0.8], ['3:4', 0.75], ['9:16', 0.5625], ['16:9', 16 / 9], ['4:3', 4 / 3]];
  return opts.reduce((b, o) => (Math.abs(Math.log(o[1] / r)) < Math.abs(Math.log(b[1] / r)) ? o : b))[0];
}
export function RestyleSheet({ item, onClose, onUse }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [style, setStyle] = useState('oil');
  const [stage, setStage] = useState('pick');
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [orig, setOrig] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const aliveRef = useRef(true);
  const jobRef = useRef(null);
  const startedRef = useRef(null);
  const resultRef = useRef(null);
  useEffect(() => () => { aliveRef.current = false; aipDropJob(jobRef.current || (startedRef.current ? { id: startedRef.current } : null)); if (resultRef.current) { const gone = resultRef.current.url; setTimeout(() => { try { URL.revokeObjectURL(gone); } catch {} }, 1500); } }, []);
  useEffect(() => {
    if (stage !== 'busy') return undefined;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(RESTYLE_WAIT.length - 1, s + 1)), 3400);
    return () => clearInterval(t);
  }, [stage]);
  const run = async () => {
    if (stage === 'busy') return;
    setNote('');
    playUiSound('tap');
    aipDropJob(jobRef.current);
    jobRef.current = null;
    setStage('busy');
    let pic = null;
    try { pic = await aipFit(item.file, [[1024, 0.82, 240000], [896, 0.78, 240000], [768, 0.74, 240000], [640, 0.7, 240000], [512, 0.66, 240000]]); } catch { pic = null; }
    if (!aliveRef.current) return;
    if (!pic || pic.data.length > 240000) { setStage(result ? 'done' : 'pick'); setNote('That photo could not be opened. Try another one.'); return; }
    const started = await aipStartJob('restyle', { style, photo: pic.data, ratio: restyleRatio(pic.w, pic.h) });
    if (!aliveRef.current) return;
    if (started.error) { setStage(result ? 'done' : 'pick'); setNote(started.error); return; }
    startedRef.current = started.id;
    const row = await aipWaitJob(started.id, aliveRef);
    if (!aliveRef.current || !row) return;
    jobRef.current = row;
    startedRef.current = null;
    if (row.status !== 'done' || !Array.isArray(row.urls) || !row.urls.length) { setStage(result ? 'done' : 'pick'); setNote(row.error || 'The photo could not be restyled. Try another style.'); return; }
    try {
      const src = await resolveMedia(row.urls[0]);
      const blob = await (await fetch(src)).blob();
      const type = /png|webp/.test(blob.type) ? blob.type : 'image/jpeg';
      const file = new File([blob], `restyled-${Date.now()}.${type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'}`, { type });
      const url = URL.createObjectURL(file);
      const img = await loadImageElement(url);
      if (!aliveRef.current) { URL.revokeObjectURL(url); return; }
      if (resultRef.current) { try { URL.revokeObjectURL(resultRef.current.url); } catch {} }
      resultRef.current = { file, url, w: img.naturalWidth, h: img.naturalHeight, style };
      setResult(resultRef.current);
      setOrig(false);
      setStage('done');
      playUiSound('repost');
      aipDropJob(row);
      jobRef.current = null;
    } catch {
      setStage(result ? 'done' : 'pick');
      setNote('The new picture did not load. Try again.');
    }
  };
  const use = () => {
    if (!result) return;
    hapticTap();
    onUse(result.file, result.w, result.h);
  };
  const saveIt = async () => {
    if (!result || saving) return;
    setSaving(true);
    try { const done = await saveImageToDevice(result.url, `zchat-${Date.now()}.jpg`); if (done === 'saved') appSnack('Image saved'); } catch { setNote('That did not save. Try again.'); }
    if (aliveRef.current) setSaving(false);
  };
  const shown = stage === 'done' && result && !orig ? result.url : item.url;
  const label = (RESTYLE_STYLES.find(([k]) => k === (result ? result.style : style)) || [0, ''])[1];
  return (
    <div className="zchat-fade" role="dialog" aria-label="Restyle photo" style={{ position: 'absolute', inset: 0, zIndex: 40, background: '#000', color: 'white', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 12px', minHeight: 60, boxSizing: 'border-box', flexShrink: 0 }}>
        <span role="button" aria-label="Cancel" onClick={onClose} style={{ width: 70, fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: '8px 10px' }}>Cancel</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{stage === 'done' ? label : 'Restyle'}</span>
        <span role="button" aria-label="Use this photo" aria-disabled={stage !== 'done'} onClick={stage === 'done' ? use : undefined} style={{ width: 70, textAlign: 'right', boxSizing: 'border-box', fontSize: 15, fontWeight: 800, cursor: stage === 'done' ? 'pointer' : 'default', padding: '8px 10px', color: theme.gold, opacity: stage === 'done' ? 1 : 0 }}>Use</span>
      </div>
      <div onPointerDown={() => { if (stage === 'done') setOrig(true); }} onPointerUp={() => setOrig(false)} onPointerCancel={() => setOrig(false)} onPointerLeave={() => setOrig(false)} onContextMenu={(e) => e.preventDefault()}
        style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}>
        <img src={shown} alt={stage === 'done' && !orig ? 'Restyled photo' : 'Your photo'} draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 14, display: 'block', filter: stage === 'busy' ? 'saturate(0.6) brightness(0.7)' : 'none', transition: 'filter 220ms ease' }} />
        {stage === 'busy' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, pointerEvents: 'none' }}>
            <Spinner size={22} />
            <div style={{ fontSize: 15.5, fontWeight: 800, marginTop: 8, textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)' }}>{RESTYLE_WAIT[step]}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255, 255, 255, 0.75)', textShadow: '0 1px 8px rgba(0, 0, 0, 0.6)' }}>This usually takes a few seconds</div>
          </div>
        )}
        {stage === 'done' && orig && <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', padding: '6px 12px', borderRadius: 14, background: 'rgba(0, 0, 0, 0.6)', fontSize: 12.5, fontWeight: 700, pointerEvents: 'none' }}>Original</div>}
      </div>
      <div style={{ padding: '10px 14px 0', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0, width: '100%', maxWidth: 520, margin: '0 auto', boxSizing: 'border-box' }}>
        {stage !== 'busy' && (
          <StudioDark>
            <PickTiles label="Restyle as" size={64} bleed={14} ringBg="#000000" value={style} onChange={(k) => { setStyle(k); setNote(''); }}
              options={RESTYLE_STYLES.map(([k, l]) => ({ k, label: l, aria: `Restyle as ${l}`, art: <AiStyleThumb k={k} /> }))} />
          </StudioDark>
        )}
        {note && <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: '#FF8A8A', textAlign: 'center', lineHeight: 1.45 }}>{note}</div>}
        {stage === 'pick' && <BigButton label="Restyle photo" onClick={run} style={{ height: 50, borderRadius: 16 }} />}
        {stage === 'busy' && <div role="button" aria-label="Stop" onClick={() => { aliveRef.current = false; onClose(); }} className="zchat-press" style={{ alignSelf: 'center', padding: '12px 20px', fontSize: 15, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}>Cancel</div>}
        {stage === 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StudioDark>
              <StudioTool label={result && style === result.style ? 'Again' : 'Try this'} glyph={<StudioGlyph k="retry" />} onClick={run} width={70} />
              <StudioTool label={saving ? 'Saving' : 'Save'} glyph={<StudioGlyph k="save" />} disabled={saving} onClick={saveIt} width={62} />
            </StudioDark>
            <div style={{ flex: 1 }}><BigButton label="Use this photo" onClick={use} style={{ height: 50, borderRadius: 16 }} /></div>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.55)', textAlign: 'center' }}>{stage === 'done' ? 'Hold the photo to see the original' : 'Faces and everything in the photo stay the same. Only the style changes.'}</div>
      </div>
    </div>
  );
}

export function StickerPreviewSheet({ message, isMine, onClose, onReport, userId, onNotice }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const sticker = STICKERS.find((s) => s.file === message.content);
  const animPack = animPackOf(message.content);
  const [favs, setFavs] = useState(() => getFavoriteStickerKeys());
  const fav = sticker ? favs.has(sticker.key) : false;
  const customUrl = !sticker && typeof message.content === 'string' && /^https?:/i.test(message.content) ? message.content : null;
  const [alreadyMine, setAlreadyMine] = useState(() => !!customUrl && readMyStickersLocal(userId).some((x) => x.url === customUrl));
  const saveToMine = async () => {
    if (!customUrl || alreadyMine) return;
    setAlreadyMine(true);
    let row = null;
    try {
      const { data, error } = await supabase.from('user_stickers').insert({ user_id: userId, url: customUrl }).select('id, url').single();
      if (!error && data) row = { id: data.id, url: data.url };
    } catch {}
    const item = row || { id: `local-${Date.now()}`, url: customUrl };
    writeMyStickersLocal(userId, [item, ...readMyStickersLocal(userId).filter((x) => x.url !== customUrl)]);
    if (onNotice) onNotice('Added to your stickers');
    onClose();
  };
  const row = (icon, label, onClick, danger) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', fontSize: 14.5, fontWeight: 700, color: danger ? theme.danger : theme.ink, borderTop: `1px solid ${theme.border}` }}>
      <span style={{ display: 'flex' }}>{icon}</span>{label}
    </div>
  );
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 440, background: theme.panelBg, borderRadius: '26px 26px 0 0', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 18px' }}>
          {message.content && (message.content.startsWith('/') || /^https?:/i.test(message.content))
            ? <img src={message.content} alt="" className="zchat-wave-pop" draggable={false} style={{ width: 150, height: 150, objectFit: 'contain' }} />
            : <div style={{ fontSize: 110, lineHeight: 1 }}>{message.content}</div>}
        </div>
        {animPack && <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: theme.muted, margin: '-8px 0 14px' }}>{animPack.label} stickers</div>}
        {sticker && row(<Star_ size={19} color="#FFB800" filled={fav} />, fav ? 'Remove from favourites' : 'Add to favourites', () => { setFavs(new Set(toggleFavoriteSticker(sticker.key))); onClose(); })}
        {customUrl && !alreadyMine && row(<Plus size={19} />, 'Add to my stickers', saveToMine)}
        {!isMine && row(<Flag size={19} />, 'Report sticker', () => { onClose(); onReport(); }, true)}
        {row(<X size={19} />, 'Close', onClose)}
      </div>
    </div>
  );
}
function TrendingStrip({ userId, onOpenTag, onSeeAll }) {
  const { theme } = useTheme();
  const rows = useTrendingTags();
  if (!rows || !rows.length) return null;
  return (
    <div style={{ padding: '6px 0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0 8px' }}>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>Trending this week</div>
        <div role="button" aria-label="See all trending tags" onClick={onSeeAll} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>See all</div>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -18px', padding: '0 14px' }}>
        {rows.slice(0, 10).map((r) => <TagThumb key={r.tag} tag={r.tag} sample={r.sample} sub={`${formatCount(r.n)} ${r.n === 1 ? 'post' : 'posts'}`} onOpen={onOpenTag} size={64} />)}
      </div>
    </div>
  );
}

export function TagRequestsPage({ userId, me, onClose }) {
  const { theme } = useTheme();
  useBackClose(true, onClose);
  const [rows, setRows] = useState(() => psTagReqMem.get(userId) || null);
  const [auto, setAuto] = useState(() => psTagReqMem.get(`${userId}:auto`) || 'ask');
  const [open, setOpen] = useState(null);
  const [fail, setFail] = useState(null);
  const touched = useRef(new Map());
  const load = async () => {
    const startedAt = Date.now();
    const got = await psFetchTagReqs(userId).catch((e) => ({ rows: null, auto: null, error: e || {} }));
    if (got.auto && !(touched.current.get('auto') > startedAt)) { setAuto(got.auto); psTagReqMem.set(`${userId}:auto`, got.auto); }
    if (!got.rows && got.error && !loadMissing(got.error)) { setFail(loadFailCode(got.error)); return; }
    if (!got.rows) { setRows((p) => p || []); return; }
    setFail(null);
    const built = got.rows.map((r) => {
      const local = touched.current.get(r.id);
      return local && local.at > startedAt ? { ...r, status: local.status } : r;
    }).filter((r) => r.status !== 'removed');
    psTagReqMem.set(userId, built);
    setRows(built);
  };
  useEffect(() => {
    load();
    let timer = 0;
    const keep = rtKeep(() => supabase.channel(rtName(`ps-tagreq-${userId}`)).on('postgres_changes', { event: '*', schema: 'public', table: 'zchat_post_tags', filter: `user_id=eq.${userId}` }, () => { clearTimeout(timer); timer = setTimeout(load, 250); }));
    const offRefresh = rtOnRefresh(() => load());
    return () => { clearTimeout(timer); rtDrop(keep); offRefresh(); };
  }, []);
  const decide = async (r, action) => {
    hapticTap();
    const before = rows || [];
    touched.current.set(r.id, { at: Date.now(), status: action === 'approve' ? 'approved' : 'removed' });
    const next = action === 'approve' ? before.map((x) => (x.id === r.id ? { ...x, status: 'approved' } : x)) : before.filter((x) => x.id !== r.id);
    setRows(next); psTagReqMem.set(userId, next);
    const undo = psTagDrop(r.post_id, r.id, action === 'approve' ? { status: 'approved' } : null);
    const { data, error } = await supabase.rpc('zchat_tag_decide', { p_tag: r.id, p_action: action });
    if (error || data === false) {
      touched.current.delete(r.id);
      setRows(before); psTagReqMem.set(userId, before);
      if (undo) undo();
      appSnack(friendlyError(error, 'That did not work. Try again.'));
      return;
    }
    psPendingMem.n = Math.max(0, next.filter((x) => x.status === 'pending').length);
    psPhotosMem.delete(userId);
    try { window.dispatchEvent(new Event('zchat-ps-tags')); } catch {}
  };
  const setAutoMode = async () => {
    const want = auto === 'following' ? 'ask' : 'following';
    const was = auto;
    touched.current.set('auto', Date.now());
    setAuto(want); psTagReqMem.set(`${userId}:auto`, want);
    const { error } = await supabase.from('zchat_tag_settings').upsert({ user_id: userId, auto: want, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { setAuto(was); psTagReqMem.set(`${userId}:auto`, was); appSnack(friendlyError(error, 'That did not save. Try again.')); }
  };
  const who = (me && me.privacy_tags) || 'everyone';
  const whoLabel = who === 'followers' ? 'Your followers' : who === 'chosen' ? 'Only people you chose' : 'Everyone';
  const waiting = (rows || []).filter((r) => r.status === 'pending');
  const shown = (rows || []).filter((r) => r.status === 'approved');
  const row = (r) => {
    const thumb = postThumbOf(r.post);
    return (
      <div key={r.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
        <div role="button" aria-label="Open the photo" onClick={() => setOpen(r.post)} style={{ width: 52, height: 64, borderRadius: 9, overflow: 'hidden', background: theme.soft, flexShrink: 0, cursor: 'pointer' }}>{thumb && thumb.url ? <img src={thumb.url} alt={psAltOf(r.post, 0)} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.35 }}><b style={{ fontWeight: 700 }}>{r.by.username || r.by.name}</b> tagged you</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{shortAgo(r.created_at)}</div>
        </div>
        {r.status === 'pending' ? (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <PillButton small primary label="Approve" ariaLabel={`Approve the tag from ${r.by.name}`} onClick={() => decide(r, 'approve')} />
            <PillButton small label="Remove" ariaLabel={`Remove the tag from ${r.by.name}`} onClick={() => decide(r, 'remove')} />
          </div>
        ) : <PillButton small label="Remove" ariaLabel={`Remove the tag from ${r.by.name}`} onClick={() => decide(r, 'remove')} />}
      </div>
    );
  };
  return (
    <FullPage title="Tags" onBack={onClose} zIndex={92}>
      <DetailSection>
        <DetailRow icon={<Check />} label="Approve people I follow" sub="Their tags show at once. Others wait for you." right={<IgToggle on={auto === 'following'} onClick={setAutoMode} />} />
        <DetailRow icon={<User />} label="Who can tag me" value={whoLabel} sub="You can change this in Settings, Privacy" last />
      </DetailSection>
      {rows === null && (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); load(); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>)}
      {rows && !rows.length && <EmptyState art="posts" title="No tags yet" text="When someone tags you in a photo, it shows up here first. Nothing goes on your profile until you say so." />}
      {waiting.length > 0 && <><IgHeading>Waiting for you</IgHeading><div role="list" aria-label="Waiting for you">{waiting.map(row)}</div></>}
      {shown.length > 0 && <><IgHeading>On your profile</IgHeading><div role="list" aria-label="On your profile">{shown.map(row)}</div></>}
      {open && <Portal><FeedPanel me={me} userId={userId} fixedIds={[open.id]} title="Photo" startPostId={open.id} seedPost={open} seedItems={[open]} onClose={() => setOpen(null)} onOpenProfile={() => setOpen(null)} /></Portal>}
    </FullPage>
  );
}
const BFX_KINDS = [['slam', 'Slam', 'Lands hard and the chat shakes'], ['loud', 'Loud', 'Grows big and shakes'], ['gentle', 'Gentle', 'Starts small and grows softly'], ['ink', 'Invisible ink', 'Hidden under dust until tapped']];

const FOCUS_LENGTHS = [15, 25, 45, 60];
const FOCUS_LABELS = ['Study', 'Work', 'Read', 'Workout', 'Clean up', 'Create'];
export function FocusComposerSheet({ onSend, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [mins, setMins] = useState(25);
  const [label, setLabel] = useState('Study');
  const [busy, setBusy] = useState(false);
  return (
    <FullPage title="Focus together" onBack={onClose} zIndex={96}
      footer={<BigButton label={busy ? 'Starting' : `Start ${mins} minutes`} disabled={busy} onClick={async () => { setBusy(true); const ok = await onSend({ m: mins, t: label.trim().slice(0, 40) || 'Focus', at: new Date().toISOString() }); if (!ok) setBusy(false); }} />}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 8px', color: theme.coral }}><FocusIcon size={44} /></div>
      <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '0 10px 4px', textWrap: 'balance' }}>Start a timer and invite the chat to focus with you. While it runs, other chats stay quiet for everyone who joins.</div>
      <KitSection title="How long" style={{ marginTop: 20 }}>
        <PickTiles label="How long" size={62} fit value={mins} onChange={(m) => setMins(m)}
          options={FOCUS_LENGTHS.map((m) => ({ k: m, label: `${m} min`, aria: `${m} minutes`, art: (on) => <FocusDialGlyph m={m} on={on} /> }))} />
      </KitSection>
      <KitSection title="What for" style={{ marginTop: 20 }}>
        <PickTiles label="What for" size={62} fit value={FOCUS_LABELS.includes(label) ? label : null} onChange={(l) => setLabel(l)}
          style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 16 }}
          options={FOCUS_LABELS.map((l) => ({ k: l, label: l, aria: l, art: <FocusForGlyph k={l} /> }))} />
      </KitSection>
      <input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 40))} placeholder="Or name it yourself" aria-label="Focus session name" style={{ ...inputStyle(theme), marginTop: 18 }} />
    </FullPage>
  );
}
function FocusDialGlyph({ m, on, size = 36 }) {
  const a = (Math.min(60, Math.max(0, m)) / 60) * Math.PI * 2;
  const r = 12;
  const x = 16 + r * Math.sin(a);
  const y = 16 - r * Math.cos(a);
  const full = m >= 60;
  const wedge = full ? null : `M16 16 L16 ${16 - r} A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)} Z`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block' }}>
      {full ? <circle cx="16" cy="16" r={r} fill="currentColor" opacity={on ? 0.4 : 0.28} /> : <path d={wedge} fill="currentColor" opacity={on ? 0.4 : 0.28} />}
      <circle cx="16" cy="16" r={r} fill="none" stroke="currentColor" strokeWidth="1.8" />
      {!full && <path d={`M16 16 L16 ${16 - r} M16 16 L${x.toFixed(2)} ${y.toFixed(2)}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}
function FocusForGlyph({ k, size = 32 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const body = (() => {
    if (k === 'Study') return <><path d="M3.5 12.6 16 7.2l12.5 5.4L16 18z" {...p} /><path d="M8.6 15v5.2c2 1.8 4.6 2.8 7.4 2.8s5.4-1 7.4-2.8V15" {...p} /><path d="M28.5 12.6v6.6" {...p} /></>;
    if (k === 'Work') return <><rect x="4.5" y="10" width="23" height="15.5" rx="3" {...p} /><path d="M12 10V8.2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V10M4.5 16.6h23M14.4 16.6v2.2h3.2v-2.2" {...p} /></>;
    if (k === 'Read') return <><path d="M16 9.6c-2.8-2-6.4-2.6-10.5-2v16c4.1-.6 7.7 0 10.5 2 2.8-2 6.4-2.6 10.5-2v-16c-4.1-.6-7.7 0-10.5 2z" {...p} /><path d="M16 9.6v16" {...p} /></>;
    if (k === 'Workout') return <><path d="M10.6 16h10.8" {...p} /><rect x="6" y="10" width="4.6" height="12" rx="1.6" {...p} /><rect x="21.4" y="10" width="4.6" height="12" rx="1.6" {...p} /><path d="M6 13.4H3.8v5.2H6M26 13.4h2.2v5.2H26" {...p} /></>;
    if (k === 'Clean up') return <><path d="M22.6 4.6 17.4 15" {...p} /><path d="M13.2 13.4l8 4-1.5 3.1c-.9 1.9-1.3 4.1-1.1 6.2l-12.4-6.2c1.9-.8 3.6-2.3 4.5-4.2z" {...p} /><path d="M10.2 23.6l2-3.3M13.8 25.4l1.5-3.5" {...p} /></>;
    if (k === 'Create') return <><path d="M26.4 5.6 15 17" {...p} /><path d="M15 17c-2.6-.7-5.1.6-5.7 3.3-.4 1.9-1.5 3.3-3.6 4.1 3.3 1.6 7.6 1.2 9.9-1.2 1.5-1.6 1.5-3.7-.6-6.2z" {...p} /><path d="M23.4 8.6l2 2" {...p} /></>;
    return <circle cx="16" cy="16" r="9" {...p} />;
  })();
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{body}</svg>;
}
const TITLE_IDEAS = ['Captain', 'Planner', 'DJ', 'Photographer', 'Gamer', 'Chef', 'Helper', 'Legend'];
export function MemberTitleSheet({ member, onSave, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState(member.title || '');
  const [busy, setBusy] = useState(false);
  const save = async (val) => {
    if (busy) return;
    setBusy(true);
    const ok = await onSave(val);
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <FullPage title="Member title" subtitle={member.profile ? member.profile.name : ''} onBack={onClose} zIndex={72}
      footer={<div style={{ display: 'flex', gap: 8 }}>{member.title && <BigButton label="Remove" tone="plain" onClick={() => save('')} style={{ flex: '0 0 110px' }} />}<BigButton label={busy ? 'Saving' : 'Save title'} disabled={busy || !text.trim()} onClick={() => save(text.trim())} /></div>}>
      <div style={{ padding: '12px 2px 8px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Titles show next to their name in the group, so everyone knows who does what.</div>
      <input value={text} onChange={(e) => setText(e.target.value.slice(0, 24))} placeholder="Like Captain or Planner" aria-label="Title" autoFocus style={inputStyle(theme)} />
      <KitSection title="Ideas" style={{ marginTop: 22 }}>
        <PickTiles label="Title ideas" size={60} fit value={TITLE_IDEAS.includes(text.trim()) ? text.trim() : null} onChange={(k) => setText(k)}
          style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', columnGap: 0, rowGap: 16, margin: '0 -14px' }}
          options={TITLE_IDEAS.map((t) => ({ k: t, label: t, aria: `Use title ${t}`, art: <TitleIdeaGlyph k={t} /> }))} />
      </KitSection>
    </FullPage>
  );
}
function TitleIdeaGlyph({ k, size = 32 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const dot = { fill: 'currentColor', stroke: 'none' };
  const body = (() => {
    if (k === 'Captain') return <><circle cx="16" cy="7.2" r="2.6" {...p} /><path d="M16 9.8V27M10.6 14h10.8" {...p} /><path d="M6.2 19.8c.9 4.3 4.8 7.2 9.8 7.2s8.9-2.9 9.8-7.2" {...p} /><path d="M4 22l2.2-2.4 2.6 1.4M28 22l-2.2-2.4-2.6 1.4" {...p} /></>;
    if (k === 'Planner') return <><rect x="5.5" y="7.5" width="21" height="19" rx="3.6" {...p} /><path d="M5.5 13.2h21M11 5v5M21 5v5" {...p} /><path d="M12.2 19.7l2.7 2.6 5-5.2" {...p} /></>;
    if (k === 'DJ') return <><path d="M6 20v-3.5a10 10 0 0 1 20 0V20" {...p} /><rect x="4.6" y="18.4" width="5.6" height="8.6" rx="2.3" {...p} /><rect x="21.8" y="18.4" width="5.6" height="8.6" rx="2.3" {...p} /></>;
    if (k === 'Photographer') return <><path d="M4.8 12.2A3.2 3.2 0 0 1 8 9h2.4l1.9-2.8h7.4L21.6 9H24a3.2 3.2 0 0 1 3.2 3.2v10.6A3.2 3.2 0 0 1 24 26H8a3.2 3.2 0 0 1-3.2-3.2z" {...p} /><circle cx="16" cy="17.4" r="4.6" {...p} /><circle cx="23" cy="12.8" r="1.1" {...dot} /></>;
    if (k === 'Gamer') return <><path d="M10.6 10.5h10.8a6.2 6.2 0 0 1 6.1 7.3l-.8 4.6a3.2 3.2 0 0 1-5.6 1.5l-2.6-2.9h-5l-2.6 2.9a3.2 3.2 0 0 1-5.6-1.5l-.8-4.6a6.2 6.2 0 0 1 6.1-7.3z" {...p} /><path d="M11 14.6v4.6M8.7 16.9h4.6" {...p} /><circle cx="21.2" cy="15.4" r="1.2" {...dot} /><circle cx="23.7" cy="18.3" r="1.2" {...dot} /></>;
    if (k === 'Chef') return <><path d="M10 26.5v-6.7c-2.9-.6-4.8-3-4.8-5.8a6 6 0 0 1 7.9-5.7C14 6.6 15 6 16 6s2 .6 2.9 2.3a6 6 0 0 1 7.9 5.7c0 2.8-1.9 5.2-4.8 5.8v6.7z" {...p} /><path d="M10 22.8h12" {...p} /></>;
    if (k === 'Helper') return <><circle cx="16" cy="16" r="10.6" {...p} /><circle cx="16" cy="16" r="4.4" {...p} /><path d="M8.5 8.5l4.4 4.4M19.1 19.1l4.4 4.4M23.5 8.5l-4.4 4.4M12.9 19.1l-4.4 4.4" {...p} /></>;
    if (k === 'Legend') return <><path d="M5.5 25.5h21" {...p} /><path d="M6.6 21.6 4.8 10.6l6.4 4.8L16 7.4l4.8 8 6.4-4.8-1.8 11z" {...p} /></>;
    return <circle cx="16" cy="16" r="9" {...p} />;
  })();
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{body}</svg>;
}

export function MemberJoinSheet({ profile, me, onClose, onOpenWallet }) {
  const { theme } = useTheme();
  const page = useCr('page', profile.id);
  const w = useWallet(me.id);
  const first = crFirst(profile);
  const price = page && page.member_price ? Number(page.member_price) : 0;
  const bal = w && w.ready ? w.coins : 0;
  const enough = price > 0 && bal >= price;
  const go = async () => {
    if (!price) return;
    if (!enough) { onClose(); if (onOpenWallet) onOpenWallet(); return; }
    const before = page.mine;
    const res = await crSpend(me.id, price, `Join ${first}'s membership for ${coinsText(price)} a month`, () => {
      onClose();
      playUiSound('like');
      hapticTap();
      crPatch('page', profile.id, (p) => ({ ...p, members: (Number(p.members) || 0) + 1, mine: { status: 'active', price, period_end: new Date(Date.now() + 30 * 86400000).toISOString(), cancel_at_end: false } }));
      appSnack(`You are now a member of ${first}'s page`);
      return crCall('zchat_cr_member_join', { p_creator: profile.id, p_expect: price });
    });
    if (res.cancelled) return;
    if (res.error) {
      crPatch('page', profile.id, (p) => ({ ...p, members: Math.max(0, (Number(p.members) || 1) - 1), mine: before }));
      appSnack(res.error);
      crFresh('page', profile.id);
      return;
    }
    const m = res.row && res.row.member;
    crPatch('page', profile.id, (p) => ({ ...p, mine: m || p.mine, group_id: (res.row && res.row.group_id) || p.group_id }));
    crS.mem.at.delete(profile.id);
  };
  return (
    <CrSheet title={`Join ${first}'s membership`} sub={<CrCoinsLine uid={me.id} />} avatar={<Avatar emoji={profile.avatar} name={profile.name} size={40} />} onClose={onClose}
      footer={<BigButton label={!price ? 'Loading' : enough ? `Join for ${coinsText(price)}` : `You need ${moreCoinsText(price - bal)}`} disabled={!price} onClick={go} />}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, padding: '14px 0 4px' }}>
        <CoinIcon size={30} />
        <span style={{ fontSize: 40, fontWeight: 750, color: theme.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{price ? formatCount(price) : ' '}</span>
        <span style={{ fontSize: 15, color: theme.muted }}>a month</span>
      </div>
      {page && page.member_perks && <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.5, textAlign: 'center', padding: '6px 6px 4px', wordBreak: 'break-word' }}>{page.member_perks}</div>}
      <div style={{ padding: '10px 0 0' }}>
        {[['lock', 'Members only posts and stories'], ['chat', `A members chat with ${first}`], ['member', `A members badge in ${first}'s lives and comments`]].map(([k, t]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 40, fontSize: 14.5, color: theme.ink }}>
            <span style={{ display: 'flex', color: kitOnInk(theme) }}>{k === 'chat' ? <Users size={19} /> : k === 'lock' ? <Lock size={19} /> : <CrGlyph k={k} size={19} />}</span>{t}
          </div>
        ))}
      </div>
      <CrNote>It renews from your coins every month. We remind you 3 days before, and you can cancel any time. You stay a member until the month ends.</CrNote>
    </CrSheet>
  );
}

function gifErrorText(r) {
  if (r.status === 0) return 'No connection. Try again.';
  if (r.status === 503 || r.status === 404 || /set up|key/i.test(r.error || '')) return 'GIF search switches on once a GIPHY key is added to ZChat.';
  if (r.status === 429) return r.error || 'Lots of GIF searches today. Try again soon.';
  return 'GIFs did not load. Try again.';
}
const gifMem = new Map();
const GIF_TOPICS = [['', 'Trending'], ['love', 'Love'], ['happy', 'Happy'], ['lol', 'Funny'], ['sad', 'Sad'], ['hello', 'Hello'], ['thank you', 'Thanks'], ['wow', 'Wow'], ['dance', 'Dance'], ['yes', 'Yes'], ['no', 'No'], ['sleepy', 'Sleepy'], ['hungry', 'Hungry'], ['happy birthday', 'Birthday'], ['cat', 'Cats'], ['dog', 'Dogs']];
export function GifGrid({ onPick }) {
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const term = (q.trim() || topic).slice(0, 50);
  const [page, setPage] = useState(() => gifMem.get('') || null);
  const [err, setErr] = useState('');
  const [more, setMore] = useState(false);
  const scrollRef = useRef(null);
  const termRef = useRef(term);
  termRef.current = term;
  useEffect(() => {
    let alive = true;
    const hit = gifMem.get(term);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (hit) { setPage(hit); setErr(''); return undefined; }
    setPage(null);
    const t = setTimeout(async () => {
      const r = await zchatTools('gifs', { q: term, limit: 30 }, 12000);
      if (!alive) return;
      if (r.data && Array.isArray(r.data.items)) {
        const pg = { items: r.data.items, next: r.data.next == null ? (r.data.items.length >= 30 ? 30 : null) : r.data.next };
        gifMem.set(term, pg); setPage(pg); setErr('');
      } else { setPage({ items: [], next: null }); setErr(gifErrorText(r)); }
    }, q.trim() ? 380 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [term]);
  const loadMore = async () => {
    const cur = gifMem.get(term);
    if (more || !cur || cur.next == null) return;
    setMore(true);
    const want = term;
    const r = await zchatTools('gifs', { q: want, limit: 30, offset: cur.next }, 12000);
    setMore(false);
    if (termRef.current !== want || !r.data || !Array.isArray(r.data.items)) return;
    const seen = new Set(cur.items.map((g) => g.id));
    const add = r.data.items.filter((g) => !seen.has(g.id));
    const pg = { items: [...cur.items, ...add], next: add.length && r.data.next != null ? r.data.next : null };
    gifMem.set(want, pg);
    setPage(pg);
  };
  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 600) loadMore();
  };
  const cols = [[], []];
  const hs = [0, 0];
  ((page && page.items) || []).forEach((g) => {
    const i = hs[0] <= hs[1] ? 0 : 1;
    cols[i].push(g);
    hs[i] += g.w && g.h ? g.h / g.w : 1;
  });
  const card = (g) => (
    <div key={g.id} role="button" aria-label={`Send GIF ${g.title || ''}`.trim()} onClick={() => onPick(g)} className="zchat-press"
      style={{ borderRadius: 12, overflow: 'hidden', background: theme.rowBg, cursor: 'pointer', aspectRatio: g.w && g.h ? `${g.w} / ${g.h}` : '1 / 1' }}>
      <img src={g.preview || g.url} alt={g.title || 'GIF'} loading="lazy" decoding="async" draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ position: 'relative', marginBottom: 8, flexShrink: 0 }}>
        <Search size={14} color={theme.muted} style={{ position: 'absolute', left: 11, top: 10 }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search GIPHY" aria-label="Search GIFs" style={{ ...inputStyle(theme), padding: '8px 12px 8px 32px', fontSize: 13 }} />
      </div>
      {!q.trim() && (
        <LineTabs kind="button" label="GIF topics" value={topic} onChange={(k) => { if (k !== topic) { hapticTap(); setTopic(k); } }} h={38} fs={14} style={{ margin: '0 -12px 8px' }}
          tabs={GIF_TOPICS.map(([k, l]) => ({ k, label: l, aria: `GIFs ${l}` }))} />
      )}
      <div ref={scrollRef} onScroll={onScroll} data-sheet-scroll="true" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
        {page === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.muted} /></div>}
        {err && <div style={{ textAlign: 'center', padding: 20, fontSize: 12.5, color: theme.muted }}>{err}</div>}
        {page && !err && !page.items.length && <div style={{ textAlign: 'center', padding: 20, fontSize: 12.5, color: theme.muted }}>No GIFs found</div>}
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {cols.map((c, i) => <div key={i} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>{c.map(card)}</div>)}
        </div>
        {more && <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}><Spinner size={16} color={theme.muted} /></div>}
      </div>
      <div style={{ fontSize: 10.5, color: theme.muted, textAlign: 'center', paddingTop: 6, flexShrink: 0 }}>Powered by GIPHY</div>
    </div>
  );
}

export function BubbleFxPage({ text, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [fx, setFx] = useState('slam');
  const [run, setRun] = useState(0);
  const bubRef = useRef(null);
  useEffect(() => { cmEnsureCss(); }, []);
  useEffect(() => {
    if (fx === 'ink') return undefined;
    const play = () => bfxPlay(bubRef.current, fx, true);
    const t0 = setTimeout(play, 160);
    const iv = setInterval(play, 2800);
    return () => { clearTimeout(t0); clearInterval(iv); };
  }, [fx, run]);
  const label = ((BFX_KINDS.find((x) => x[0] === fx) || [])[1] || '').toLowerCase();
  const body = String(text || '').slice(0, 280);
  const still = prefOn('zchat-reduce-motion');
  return (
    <FullPage title="Send with effect" onBack={onClose} zIndex={96}
      footer={<BigButton label={`Send with ${label}`} onClick={() => onSend(fx)} />}>
      <div data-bfx-stage="1" aria-label="Preview" style={{ borderRadius: 20, padding: '26px 14px 18px', background: theme.dark ? '#0F0F13' : '#F4F4F7', boxShadow: `inset 0 0 0 1px ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200, justifyContent: 'flex-end', overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-start', maxWidth: '78%', background: theme.bubbleThem, color: theme.ink, borderRadius: 18, borderBottomLeftRadius: 5, padding: '8px 13px', fontSize: 15, lineHeight: 1.3 }}>So what do you think?</div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '82%' }}>
          <div ref={bubRef} key={`${fx}-${run}`} style={{ background: theme.bubbleMe, color: theme.ink, borderRadius: 18, borderBottomRightRadius: 5, padding: '8px 13px', fontSize: 15, lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {fx === 'ink' ? <InkVeil on temp id={`preview-${run}`} ink={theme.ink}>{body}</InkVeil> : body}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '10px 4px 0' }}>{still ? 'Reduce motion is on, so effects stay still on this phone. Others still see them.' : fx === 'ink' ? 'Tap the dust to see it. They tap it too.' : 'They see it play once when the message comes into view.'}</div>
      <IgHeading>Effect</IgHeading>
      <ChoiceList label="Bubble effect" value={fx} onChange={(k) => { setFx(k); setRun((r) => r + 1); }} options={BFX_KINDS.map(([k, l, sub]) => ({ k, label: l, sub, icon: <BfxKindIcon kind={k} /> }))} />
    </FullPage>
  );
}
function BfxKindIcon({ kind, size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'slam' && (<><path d="M5 13a5 5 0 0 1 5-5h4a5 5 0 0 1 0 10h-2l-3 2.5v-2.8A5 5 0 0 1 5 13z" /><path d="M8.5 2v3M12 1.5v4M15.5 2v3M2 21l2-1.5M22 21l-2-1.5" /></>)}
      {kind === 'loud' && (<><path d="M3.5 11a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9l-3.5 3v-3.6A5 5 0 0 1 3.5 11z" /><path d="M18.5 8.5a4 4 0 0 1 0 5M20.8 6.5a7 7 0 0 1 0 9" /></>)}
      {kind === 'gentle' && (<><path d="M2.5 17.5A2.5 2.5 0 0 1 5 15h2a2.5 2.5 0 0 1 0 5H5.5l-2 1.5v-2A2.5 2.5 0 0 1 2.5 17.5z" /><path d="M11 8.5a4.5 4.5 0 0 1 4.5-4.5h2a4.5 4.5 0 0 1 0 9H16l-3 2.4V12.5A4.5 4.5 0 0 1 11 8.5z" /><path d="M8.5 13.5l1.5-1.5" strokeDasharray="1 2" /></>)}
      {kind === 'ink' && (<><path d="M4 10.5a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6h-2.5L7 20v-4A6 6 0 0 1 4 10.5z" /><circle cx="9" cy="9.5" r="0.4" fill={color} /><circle cx="12.5" cy="8.5" r="0.4" fill={color} /><circle cx="15" cy="11" r="0.4" fill={color} /><circle cx="10.5" cy="12.5" r="0.4" fill={color} /><circle cx="13.5" cy="13" r="0.4" fill={color} /></>)}
    </svg>
  );
}
