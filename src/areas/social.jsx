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
  openPermHelp,
  permDenied,
  ActionSheet,
  AddMembersPanel,
  Avatar,
  BigButton,
  COMMUNITY_PAGES,
  COMMUNITY_PEOPLE,
  CalendarIcon,
  CarouselCount,
  ChatRowSheet,
  CoinIcon,
  CommunityAvatar,
  ConfirmDialog,
  ConfirmSheet,
  CrMemberMark,
  DetailRow,
  DetailSection,
  EmptyState,
  FONT,
  FeedComments,
  FullPage,
  GiftIcon,
  GroupAvatar,
  IgHeading,
  IgRow,
  IgToggle,
  ImageViewer,
  InstaCommentIcon,
  LIVE_MAX_LISTENERS,
  LikersSheet,
  LineGlyph,
  LiveGiftSheet,
  LiveMicGlyph,
  LivePlanPage,
  LivePlanThumb,
  LiveRingAvatar,
  LoadFail,
  MAX_CHARS,
  MoreDotsIcon,
  NameBadge,
  PhotoCropEditor,
  PillButton,
  PollIcon,
  Portal,
  PostAfterMedia,
  PostMediaOverlay,
  PostTile,
  PreviewLine,
  PsRemixGlyph,
  PsWave,
  QuestionIcon,
  RichText,
  SafetyMap,
  ScreenEffect,
  SegmentedControl,
  SensitiveCover,
  Spinner,
  SpotArt,
  TipCoinIcon,
  TrophyIcon,
  VerifiedBadge,
  VideoCC,
  WatchIcon,
  WideDim,
  announcePostSaved,
  appSnack,
  blockedByRestriction,
  cacheOwner,
  cachedPostStats,
  coinsText,
  copyTextToClipboard,
  countWord,
  cxNs,
  detailsCardBg,
  feedPanelMem,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  forgetPostLocally,
  formatCallDuration,
  formatCount,
  friendlyError,
  hapticTap,
  inputStyle,
  isCarouselPost,
  kitOnInk,
  latestSync,
  liveAddComment,
  liveCallHub,
  liveCid,
  liveEmit,
  liveEnd,
  liveFirst,
  liveGoalApply,
  liveHostConnect,
  liveHostDropSpeaker,
  liveLeave,
  liveMod,
  liveOpenById,
  livePlanById,
  livePlanLive,
  livePlanRemind,
  livePlanStartLive,
  livePlanStartRoom,
  livePlanWhy,
  livePlans,
  livePlansEmit,
  liveQLoad,
  liveQMerge,
  liveRpc,
  liveRt,
  liveSetTalking,
  liveSig,
  liveStart,
  liveStopSpeaking,
  liveWhenLow,
  liveWho,
  loadFailCode,
  loadTagFollows,
  localTz,
  notYetPosted,
  pfFirst,
  playUiSound,
  postGoneIds,
  postThumbOf,
  postVeiled,
  postViewSeen,
  prefOn,
  prepareImageFile,
  profileFnMissing,
  psAltOf,
  psArchiveMem,
  psCanRemix,
  psCcTrack,
  psClock,
  psCreateVoicePost,
  psFeedItems,
  psRevokeLater,
  psSetArchived,
  psStartRemix,
  recordPostEvent,
  reducedMotion,
  rememberPostStats,
  reminderWhen,
  rpcMissing,
  rtDrop,
  rtKeep,
  rtName,
  safeLinkUrl,
  safetyFirst,
  safetyLeft,
  safetyLive,
  safetyPeople,
  safetyPeopleLoad,
  safetySet,
  safetyStore,
  safetyUpdated,
  sanitizeAvatarList,
  savedPostsMem,
  sendPushNotification,
  shortAgo,
  siteOrigin,
  talkMeterPrime,
  talkMeterStart,
  timeAgoLong,
  unforgetPostLocally,
  uploadMedia,
  useBackClose,
  useCallMedia,
  useCarouselPeek,
  useEdgeSwipeBack,
  useLivePlans,
  useLiveRt,
  useNow,
  usePostTips,
  useSafetyStore,
  useSensitiveMode,
  useSheetDrag,
  useTheme,
  youtubeIdOf,
} from '../App.jsx';
import {
  DetailActions,
  GroupRoleBadge,
  JoinBanners,
  LivePollCard,
  MemberRemoveGlyph,
  ModShieldGlyph,
  TagSuggestBar,
  UnderTabs,
  applyTagPick,
  collectionsMem,
  detailRows,
  liveFxCss,
  loadCollections,
} from './shared.jsx';


export function SafetyWatchPage({ uid, id, canCall, onCall, onOpenChat, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const st = useSafetyStore();
  const now = useNow(1000);
  const [gone, setGone] = useState(false);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const t = st.watch.find((x) => x.id === id) || null;
  useEffect(() => {
    if (t || !st.ready) return undefined;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('zchat_safety_timers').select('*').eq('id', id).maybeSingle().then((r) => r, (e) => ({ data: null, error: e || {} }));
      if (!alive) return;
      if (error) { setFail(loadFailCode(error)); return; }
      if (!data || !safetyLive(data)) { setGone(true); return; }
      await safetyPeopleLoad([data.owner_id]);
      safetySet({ watch: [{ ...data, owner: safetyPeople.get(data.owner_id) || null }, ...safetyStore.watch.filter((x) => x.id !== data.id)] });
    })();
    return () => { alive = false; };
  }, [id, !!t, st.ready, tick]);
  const owner = (t && (t.owner || safetyPeople.get(t.owner_id))) || null;
  if (!t) {
    return (
      <FullPage title="Safety timer" onBack={onClose} zIndex={74}>
        {gone ? <EmptyState art="nothing" title="They checked in" text="This safety timer ended, so their location is not shared anymore." /> : fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>}
      </FullPage>
    );
  }
  const alerted = t.status === 'alerted';
  const left = Date.parse(t.ends_at) - now;
  const first = safetyFirst(owner);
  return (
    <FullPage title={owner ? owner.name : 'Safety timer'} subtitle="Safety timer" onBack={onClose} zIndex={74}
      footer={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {owner && canCall(owner) && <BigButton label={`Call ${first}`} tone={alerted ? 'danger' : 'accent'} onClick={() => { onClose(); onCall(owner); }} />}
          {owner && <BigButton label="Message" tone="plain" onClick={() => { onClose(); onOpenChat(owner); }} />}
        </div>
      )}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px 16px' }}>
        {owner && <Avatar emoji={owner.avatar} name={owner.name} size={52} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: alerted ? theme.danger : theme.ink }}>{alerted ? 'Has not checked in' : t.label || 'On the way'}</div>
          <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{alerted ? `Their timer ran out at ${fmtHM(new Date(t.ends_at))}${t.label ? `, ${t.label}` : ''}` : `${safetyLeft(left)}, checks in by ${fmtHM(new Date(t.ends_at))}`}</div>
        </div>
      </div>
      <SafetyMap lat={t.lat} lng={t.lng} live={!alerted} height={190} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px 0' }}>
        <div style={{ flex: 1, fontSize: 12.5, color: theme.muted }}>{t.lat != null ? `${alerted ? 'Last place shared. ' : ''}${safetyUpdated(t.loc_at)}` : 'Their phone has not shared a location yet.'}</div>
        {t.lat != null && <a href={`https://maps.google.com/?q=${t.lat},${t.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 800, color: kitOnInk(theme), textDecoration: 'none' }}>Open in Maps</a>}
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '16px 4px 4px', lineHeight: 1.5, textWrap: 'pretty' }}>{alerted ? `Try calling ${first}. If you can not reach them and you are worried, call someone near them or local emergency services.` : `Only the friends ${first} picked can see this. It stops when they check in.`}</div>
    </FullPage>
  );
}
function communityLink(code) { return `${siteOrigin()}/?community=${code}`; }
function CommunityRow({ avatar, title, sub, right, onClick, last, aria }) {
  const { theme } = useTheme();
  return (
    <div role={onClick ? 'button' : undefined} aria-label={onClick ? (aria || title) : undefined} onClick={onClick} className={onClick ? 'zchat-row-press' : undefined}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 64, padding: '9px 14px', boxSizing: 'border-box', cursor: onClick ? 'pointer' : 'default' }}>
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{sub}</div>}
      </div>
      {right}
      {!last && <div style={{ position: 'absolute', left: 70, right: 0, bottom: 0, height: 1, background: theme.border }} />}
    </div>
  );
}
export function CommunityEditPage({ initial, onClose, onSave }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(initial ? initial.name || '' : '');
  const [bio, setBio] = useState(initial ? initial.bio || '' : '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial ? initial.avatar || null : null);
  const [cropFile, setCropFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pickRef = useRef(null);
  const dirty = !initial || name.trim() !== (initial.name || '') || bio.trim() !== (initial.bio || '') || !!file;
  const save = async () => {
    if (busy || !name.trim() || !dirty) return;
    setBusy(true);
    setErr('');
    const e = await onSave({ name: name.trim(), bio: bio.trim(), file, preview });
    setBusy(false);
    if (e) setErr(e);
  };
  const label = (t) => <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '0 2px 7px' }}>{t}</div>;
  return (
    <FullPage title={initial ? 'Edit community' : 'New community'} onBack={onClose} zIndex={66}
      footer={<BigButton label={busy ? (initial ? 'Saving' : 'Making your community') : initial ? 'Save' : 'Create community'} disabled={busy || !name.trim() || !dirty} onClick={save} />}>
      <div style={{ textAlign: 'center', padding: '14px 0 20px' }}>
        <div role="button" aria-label="Choose a community photo" onClick={() => { if (pickRef.current) pickRef.current.click(); }} className="zchat-press" style={{ display: 'inline-block', position: 'relative', cursor: 'pointer' }}>
          <CommunityAvatar avatar={preview} size={96} />
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, borderRadius: '50%', background: theme.ink, color: theme.panelBg, border: `2px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={14} /></div>
        </div>
        <input ref={pickRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) setCropFile(f); e.target.value = ''; }} />
        {!initial && <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, margin: '14px auto 0', maxWidth: 310 }}>Put your groups under one name. Everyone who joins gets the announcements and can pick the groups they want.</div>}
      </div>
      {label('Community name')}
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Like Campus Crew" aria-label="Community name" autoCapitalize="words" enterKeyHint="next" style={{ ...inputStyle(theme), marginBottom: 18 }} />
      {label('Description')}
      <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 300))} placeholder="What brings people here" aria-label="Community description" rows={3} style={{ ...inputStyle(theme), resize: 'none', lineHeight: 1.45, fontFamily: FONT, display: 'block' }} />
      <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', marginTop: 5 }}>{bio.length}/300</div>
      {err && <div role="alert" style={{ color: theme.danger, fontSize: 13, fontWeight: 700, marginTop: 10, textAlign: 'center' }}>{err}</div>}
      {cropFile && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 160 }}>
            <PhotoCropEditor file={cropFile} onCancel={() => setCropFile(null)} onConfirm={(blob) => { setFile(new File([blob], 'community.jpg', { type: 'image/jpeg' })); setPreview(URL.createObjectURL(blob)); setCropFile(null); }} />
          </div>
        </Portal>
      )}
    </FullPage>
  );
}
function CommunityNewGroupPage({ community, onClose, onCreate }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const go = () => { if (!name.trim()) return; onCreate({ name: name.trim(), bio: bio.trim() }); };
  return (
    <FullPage title="New group" subtitle={community.name} onBack={onClose} zIndex={66}
      footer={<BigButton label="Create group" disabled={!name.trim()} onClick={go} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 16px', textWrap: 'pretty' }}>Everyone in {community.name} can find this group and join it. You can turn on join approval in its settings.</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '0 2px 7px' }}>Group name</div>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} placeholder="Like Study Hall" aria-label="Group name" autoFocus autoCapitalize="words" style={{ ...inputStyle(theme), marginBottom: 18 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '0 2px 7px' }}>What is it about? (optional)</div>
      <input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} placeholder="A line about this group" aria-label="Group description" style={inputStyle(theme)} />
    </FullPage>
  );
}
function CommunityInviteSheet({ c, isAdmin, onClose, onReset, onSnack }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const url = c.invite_code ? communityLink(c.invite_code) : '';
  const copy = async () => { if (!url) return; const ok = await copyTextToClipboard(url); hapticTap(); onSnack(ok ? 'Link copied' : url); };
  const share = async () => {
    if (!url) return;
    try { if (navigator.share) { await navigator.share({ title: `Join ${c.name} on ZChat`, text: `Join the community ${c.name} on ZChat`, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    copy();
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 97, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><CommunityAvatar avatar={c.avatar} size={56} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, textAlign: 'center', wordBreak: 'break-word' }}>Invite people to {c.name}</div>
          <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', lineHeight: 1.5, padding: '4px 10px 14px' }}>Anyone with this link can join the community and read its announcements.</div>
          <div role="button" aria-label="Copy community link" onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: theme.soft, cursor: 'pointer' }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, color: url ? theme.ink : theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url ? url.replace(/^https?:\/\//, '') : 'Making a new link'}</span>
            {url ? <Copy size={18} color={theme.muted} /> : <Spinner size={14} color={theme.muted} />}
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 14 }}>
            <BigButton label="Share link" onClick={share} disabled={!url} />
          </div>
          {isAdmin && <div role="button" aria-label="Reset community link" onClick={onReset} style={{ textAlign: 'center', padding: '14px 0 2px', fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>Reset link</div>}
        </div>
      </div>
    </Portal>
  );
}
export function CommunityMembersPage({ c, uid, onClose, onOpenProfile, onSnack, onCountChange, onAdded, iFollowIds, privacyAllowed, startAdd }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => COMMUNITY_PEOPLE.get(c.id) || null);
  const [sheetFor, setSheetFor] = useState(null);
  const [adding, setAdding] = useState(!!startAdd);
  const [q, setQ] = useState('');
  const put = (fn) => setRows((cur) => { const next = fn(cur || []); COMMUNITY_PEOPLE.set(c.id, next); return next; });
  const bump = (n) => { if (onCountChange && n) onCountChange(n); };
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('community_members').select('user_id, role, joined_at').eq('community_id', c.id).limit(1000);
      if (!alive || error || !data) { if (alive && !rows) setRows([]); return; }
      const ids = data.map((r) => r.user_id);
      const { data: profs } = ids.length ? await fetchProfilesView(ids) : { data: [] };
      if (!alive) return;
      const byId = {};
      sanitizeAvatarList(profs || [], uid).forEach((p) => { byId[p.id] = p; });
      const next = data.map((r) => ({ ...r, profile: byId[r.user_id] })).filter((r) => r.profile);
      COMMUNITY_PEOPLE.set(c.id, next);
      setRows(next);
    })();
    return () => { alive = false; };
  }, [c.id]);
  const rankOf = (r) => (r.user_id === c.created_by ? 2 : r.role === 'admin' ? 1 : 0);
  const myRow = (rows || []).find((r) => r.user_id === uid);
  const myRank = c.role === 'owner' ? 2 : c.role === 'admin' ? 1 : myRow ? rankOf(myRow) : 0;
  const list = (rows || []).filter((r) => !q.trim() || (r.profile.name || '').toLowerCase().includes(q.trim().toLowerCase()) || (r.profile.username || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (rankOf(b) - rankOf(a)) || (a.profile.name || '').localeCompare(b.profile.name || ''));
  const setAdmin = async (r, on) => {
    const was = r.role;
    hapticTap();
    put((cur) => cur.map((x) => (x.user_id === r.user_id ? { ...x, role: on ? 'admin' : 'member' } : x)));
    const { data: out, error } = await supabase.rpc('zchat_community_admin_set', { p_id: c.id, p_user: r.user_id, p_admin: on });
    if (!out || !out.ok) { put((cur) => cur.map((x) => (x.user_id === r.user_id ? { ...x, role: was } : x))); onSnack((out && out.reason) || friendlyError(error, 'That did not save. Try again.')); return; }
    onSnack(on ? `${String(r.profile.name || '').split(' ')[0]} is a community admin now` : `${String(r.profile.name || '').split(' ')[0]} is a member again`);
  };
  const remove = async (r) => {
    put((cur) => cur.filter((x) => x.user_id !== r.user_id));
    bump(-1);
    const { data: out, error } = await supabase.rpc('zchat_community_remove_member', { p_id: c.id, p_user: r.user_id });
    if (!out || !out.ok) { put((cur) => (cur.some((x) => x.user_id === r.user_id) ? cur : [...cur, r])); bump(1); onSnack((out && out.reason) || friendlyError(error, 'They could not be removed. Try again.')); }
  };
  const addPeople = async (people) => {
    setAdding(false);
    if (!people.length) return;
    const fresh = people.filter((p) => !(rows || []).some((r) => r.user_id === p.id));
    if (!fresh.length) return;
    put((cur) => [...cur, ...fresh.map((p) => ({ user_id: p.id, role: 'member', joined_at: new Date().toISOString(), profile: p }))]);
    bump(fresh.length);
    const { data: out, error } = await supabase.rpc('zchat_community_add_members', { p_id: c.id, p_users: fresh.map((p) => p.id) });
    if (!out || !out.ok) { const ids = new Set(fresh.map((p) => p.id)); put((cur) => cur.filter((x) => !ids.has(x.user_id))); bump(-fresh.length); onSnack((out && out.reason) || friendlyError(error, 'Those people could not be added. Try again.')); return; }
    const added = new Set(out.added || []);
    const skipped = fresh.filter((p) => !added.has(p.id));
    if (skipped.length) { put((cur) => cur.filter((x) => !skipped.some((p) => p.id === x.user_id))); bump(-skipped.length); }
    if (added.size && onAdded) onAdded([...added]);
    onSnack(added.size ? `Added ${countWord(added.size, 'person', 'people')}${skipped.length ? `. ${countWord(skipped.length, 'person', 'people')} could not be added` : ''}` : 'Their privacy settings do not let you add them');
  };
  const sheetRow = sheetFor ? (rows || []).find((r) => r.user_id === sheetFor) : null;
  return (
    <FullPage title="Members" subtitle={c.name} onBack={onClose} zIndex={64}
      right={myRank >= 1 ? <div role="button" aria-label="Add people to the community" onClick={() => setAdding(true)} style={{ fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '0 10px', height: 44, display: 'flex', alignItems: 'center' }}>Add</div> : null}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 6px' }}>
        <Search size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" aria-label="Search community members" autoCapitalize="none" enterKeyHint="search" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
      </label>
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 34 }}><Spinner size={18} color={theme.muted} /></div> : null}
      {rows && !list.length && <div style={{ textAlign: 'center', padding: 30, color: theme.muted, fontSize: 13.5 }}>No members match.</div>}
      {list.map((r) => {
        const rank = rankOf(r);
        const canAct = r.user_id !== uid && myRank >= 1 && myRank > rank;
        return (
          <div key={r.user_id} role="button" aria-label={canAct ? `Options for ${r.profile.name}` : `Open ${r.profile.name}`} onClick={() => { if (canAct) { hapticTap(); setSheetFor(r.user_id); } else onOpenProfile(r.profile); }} className="zchat-row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer', borderRadius: 14 }}>
            <Avatar emoji={r.profile.avatar} name={r.profile.name} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.profile.name}{r.user_id === uid ? ' (you)' : ''}</span><VerifiedBadge tier={r.profile.verified} custom={r.profile.custom_badge} size={12} />
              </div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{r.profile.username}</div>
            </div>
            <GroupRoleBadge role={rank === 2 ? 'owner' : rank === 1 ? 'admin' : null} />
          </div>
        );
      })}
      {sheetRow && (() => {
        const rank = rankOf(sheetRow);
        const first = String(sheetRow.profile.name || '').split(' ')[0];
        return (
          <ChatRowSheet title={sheetRow.profile.name} subtitle={rank === 1 ? 'Community admin' : `@${sheetRow.profile.username}`} avatar={<Avatar emoji={sheetRow.profile.avatar} name={sheetRow.profile.name} size={40} />} onClose={() => setSheetFor(null)} zIndex={97} portal
            actions={[
              { label: 'View profile', icon: <User size={19} />, onClick: () => onOpenProfile(sheetRow.profile) },
              rank === 0 ? { label: 'Make community admin', icon: <ShieldCheck size={19} />, hint: 'They post announcements and add groups', onClick: () => setAdmin(sheetRow, true) } : null,
              rank === 1 && myRank === 2 ? { label: 'Remove as admin', icon: <ShieldOff size={19} />, onClick: () => setAdmin(sheetRow, false) } : null,
              { label: `Remove ${first} from the community`, icon: <MemberRemoveGlyph size={19} />, danger: true, onClick: () => remove(sheetRow) },
            ]} />
        );
      })()}
      {adding && (
        <Portal>
          <div style={{ position: 'fixed', inset: 0, zIndex: 120 }}>
            <AddMembersPanel myId={uid} iFollowIds={iFollowIds} privacyAllowed={privacyAllowed} existingIds={(rows || []).map((r) => r.user_id)} onClose={() => setAdding(false)} onAdd={addPeople} />
          </div>
        </Portal>
      )}
    </FullPage>
  );
}
export function CommunityPage({ id, base, uid, myGroups, inCommunity, covered, startLeave, onClose, onOpenGroup, onEdit, onReload, onLeave, onDelete, onJoined, onRequested, onSnack, onOpenProfile, onAddedPeople, iFollowIds, privacyAllowed }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const seed = () => {
    const hit = COMMUNITY_PAGES.get(id);
    if (hit) return base ? { ...hit, ...base, list: hit.list, announce: hit.announce, admins: hit.admins } : hit;
    if (!base) return null;
    return { ...base, admins: [], announce: base.announce_id ? { id: base.announce_id, name: base.name, avatar: base.avatar, member: true } : null, list: null };
  };
  const [data, setData] = useState(seed);
  const [sheet, setSheet] = useState(startLeave ? 'leave' : null);
  const [groupSheet, setGroupSheet] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const busyRef = useRef({});
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const put = (fn) => setData((cur) => { const next = typeof fn === 'function' ? fn(cur) : fn; if (next) COMMUNITY_PAGES.set(id, next); return next; });
  const load = async () => {
    const { data: d, error } = await supabase.rpc('zchat_community_page', { p_id: id });
    if (!aliveRef.current || error) return;
    if (!d) { COMMUNITY_PAGES.delete(id); onSnack('This community is not available anymore.'); onReload(); onClose(); return; }
    put(d);
  };
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (base) setData((cur) => (cur ? { ...cur, name: base.name, bio: base.bio, avatar: base.avatar, invite_code: base.invite_code || cur.invite_code, role: base.role || cur.role, members: base.members != null ? base.members : cur.members } : cur)); }, [base && base.name, base && base.bio, base && base.avatar, base && base.invite_code, base && base.role, base && base.members]);
  if (!data) {
    return (
      <FullPage title="Community" onBack={onClose} zIndex={62} covered={covered}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={20} color={theme.muted} /></div>
      </FullPage>
    );
  }
  const role = data.role;
  const isAdmin = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';
  const list = data.list || null;
  const mine = (list || []).filter((g) => g.member);
  const other = (list || []).filter((g) => !g.member);
  const rowOf = (gid) => (myGroups || []).find((g) => g.id === gid) || null;
  const subFor = (g) => {
    const r = rowOf(g.id);
    if (r && r.preview && r.preview.text) return <PreviewLine preview={r.preview} prefix={r.previewPrefix} color={theme.muted} size={12.5} />;
    return countWord(Number(g.members) || 0, 'member', 'members');
  };
  const unreadOf = (gid) => { const r = rowOf(gid); return r && r.unread > 0 ? r.unread : 0; };
  const badge = (n) => (n > 0 ? <div style={{ minWidth: 20, height: 20, padding: '0 6px', boxSizing: 'border-box', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 11.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n > 99 ? '99+' : n}</div> : null);
  const more = (g) => (isAdmin ? (
    <div role="button" aria-label={`Options for ${g.name}`} onClick={(e) => { e.stopPropagation(); hapticTap(); setGroupSheet(g); }} style={{ display: 'flex', padding: 9, margin: '-9px -9px -9px -2px', cursor: 'pointer', flexShrink: 0, color: theme.muted }}><MoreVertical size={18} /></div>
  ) : null);
  const join = async (g) => {
    if (busyRef.current[g.id]) return;
    busyRef.current[g.id] = true;
    hapticTap();
    const before = (data.list || []).find((x) => x.id === g.id);
    put((cur) => ({ ...cur, list: (cur.list || []).map((x) => (x.id === g.id ? (x.join_approval ? { ...x, requested: true } : { ...x, member: true, members: (Number(x.members) || 0) + 1 }) : x)) }));
    const { data: out, error } = await supabase.rpc('zchat_community_join_group', { p_id: id, p_group: g.id });
    busyRef.current[g.id] = false;
    if (!out || !out.ok) {
      put((cur) => ({ ...cur, list: (cur.list || []).map((x) => (x.id === g.id && before ? before : x)) }));
      onSnack((out && out.reason) || friendlyError(error, 'That did not work. Try again.'));
      return;
    }
    if (out.requested) { onRequested(g); return; }
    onJoined(g, out.group);
  };
  const removeGroup = async (g) => {
    const before = data.list || [];
    put((cur) => ({ ...cur, list: (cur.list || []).filter((x) => x.id !== g.id) }));
    const { data: out, error } = await supabase.rpc('zchat_community_remove_group', { p_id: id, p_group: g.id });
    if (!out || !out.ok) { put((cur) => ({ ...cur, list: before })); onSnack((out && out.reason) || friendlyError(error, 'That group could not be removed. Try again.')); return; }
    onSnack(`${g.name} is a normal group again`);
    onReload();
  };
  const addGroup = async (g) => {
    const before = data.list || [];
    hapticTap();
    put((cur) => ({ ...cur, list: [...(cur.list || []), { id: g.id, name: g.name, avatar: g.avatar || null, bio: g.bio || null, join_approval: !!g.join_approval, members: g.members || 1, member: true, requested: false, admin: true }] }));
    const { data: out, error } = await supabase.rpc('zchat_community_add_group', { p_id: id, p_group: g.id });
    if (!out || !out.ok) { put((cur) => ({ ...cur, list: before })); onSnack((out && out.reason) || friendlyError(error, 'That group could not be added. Try again.')); return; }
    onSnack(`${g.name} is in ${data.name} now`);
    onReload();
  };
  const newGroup = async ({ name, bio }) => {
    setNewGroupOpen(false);
    const tempId = `temp-${Date.now().toString(36)}`;
    put((cur) => ({ ...cur, list: [...(cur.list || []), { id: tempId, name, avatar: null, bio: bio || null, join_approval: false, members: 1, member: true, requested: false, admin: true, pending: true }] }));
    const { data: out, error } = await supabase.rpc('zchat_community_new_group', { p_id: id, p_name: name, p_bio: bio || null });
    if (!out || !out.ok || !out.group) { put((cur) => ({ ...cur, list: (cur.list || []).filter((x) => x.id !== tempId) })); onSnack((out && out.reason) || friendlyError(error, 'The group could not be made. Try again.')); return; }
    put((cur) => ({ ...cur, list: (cur.list || []).map((x) => (x.id === tempId ? { ...x, id: out.group.id, pending: false } : x)) }));
    onReload();
    onSnack(`${name} is ready`);
  };
  const resetLink = async () => {
    const before = data.invite_code;
    put((cur) => ({ ...cur, invite_code: null }));
    const { data: out, error } = await supabase.rpc('zchat_community_invite_reset', { p_id: id });
    if (!out || !out.ok) { put((cur) => ({ ...cur, invite_code: before })); onSnack((out && out.reason) || friendlyError(error, 'The link could not be reset. Try again.')); return; }
    put((cur) => ({ ...cur, invite_code: out.invite_code }));
    onReload();
    onSnack('New link ready. The old one stops working.');
  };
  const candidates = (myGroups || []).filter((g) => !g.archived && (g.myRole === 'admin' || g.created_by === uid) && !inCommunity(g.id) && !(list || []).some((x) => x.id === g.id));
  const announce = data.announce;
  const nameLen = (data.name || '').length;
  return (
    <FullPage title="Community" onBack={onClose} zIndex={62} covered={covered} pad={false}>
      <div style={{ textAlign: 'center', padding: '12px 24px 4px' }}>
        <div style={{ display: 'inline-block' }}><CommunityAvatar avatar={data.avatar} size={92} /></div>
        <div style={{ fontWeight: 800, fontSize: nameLen > 30 ? 19 : 23, color: theme.ink, marginTop: 14, lineHeight: 1.2, wordBreak: 'break-word' }}>{data.name}</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 5 }}>Community, {countWord(Number(data.members) || 0, 'member', 'members')}</div>
        {data.bio && <div data-zuser="" style={{ fontSize: 14, color: theme.ink, lineHeight: 1.5, marginTop: 10, wordBreak: 'break-word' }}>{data.bio}</div>}
      </div>
      <DetailActions items={[
        [<Share2 />, 'Invite', () => setSheet('invite')],
        isAdmin ? [<UserPlus />, 'Add people', () => setMembersOpen('add')] : null,
        isAdmin ? [<Pencil />, 'Edit', () => onEdit(data)] : null,
        [<Users />, 'Members', () => setMembersOpen(true)],
      ]} />
      {announce && (
        <DetailSection>
          <CommunityRow avatar={<CommunityAvatar avatar={data.avatar} size={44} />} title="Announcements" aria="Open announcements"
            sub={rowOf(announce.id) && rowOf(announce.id).preview && rowOf(announce.id).preview.text ? subFor({ id: announce.id }) : isAdmin ? 'Post news for everyone here' : 'Only admins post here'}
            right={badge(unreadOf(announce.id))} onClick={() => onOpenGroup(announce.id)} last />
        </DetailSection>
      )}
      {list === null ? (
        <DetailSection title="Groups">
          {[0, 1].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', animation: `zchat-skel 1.4s ease-in-out ${i * 0.12}s infinite` }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
              <div style={{ flex: 1 }}><div style={{ width: '50%', height: 12, borderRadius: 6, background: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} /></div>
            </div>
          ))}
        </DetailSection>
      ) : (
        <>
          {mine.length > 0 && (
            <DetailSection title="Your groups">
              {mine.map((g, i) => (
                <CommunityRow key={g.id} avatar={<GroupAvatar avatar={g.avatar} name={g.name} size={44} />} title={g.name} aria={`Open ${g.name}`}
                  sub={g.pending ? 'Making the group' : subFor(g)} onClick={g.pending ? undefined : () => onOpenGroup(g.id)}
                  right={<>{g.pending ? <Spinner size={14} color={theme.muted} /> : badge(unreadOf(g.id))}{!g.pending && more(g)}</>} last={i === mine.length - 1} />
              ))}
            </DetailSection>
          )}
          {other.length > 0 && (
            <DetailSection title="Groups you can join">
              {other.map((g, i) => (
                <CommunityRow key={g.id} avatar={<GroupAvatar avatar={g.avatar} name={g.name} size={44} />} title={g.name}
                  sub={g.bio || countWord(Number(g.members) || 0, 'member', 'members')}
                  right={<>{g.requested ? <PillButton small label="Requested" disabled /> : <PillButton small primary label={g.join_approval ? 'Ask to join' : 'Join'} ariaLabel={`${g.join_approval ? 'Ask to join' : 'Join'} ${g.name}`} onClick={() => join(g)} />}{more(g)}</>}
                  last={i === other.length - 1} />
              ))}
            </DetailSection>
          )}
          {!mine.length && !other.length && (
            <div style={{ textAlign: 'center', padding: '22px 30px 4px', fontSize: 13.5, color: theme.muted, lineHeight: 1.5 }}>{isAdmin ? 'No groups yet. Add a group you run, or make a new one for everyone here.' : 'No groups here yet. The admins can add some.'}</div>
          )}
        </>
      )}
      {isAdmin && (
        <DetailSection title="Manage">
          {detailRows([
            <DetailRow icon={<Plus />} label="Add a group you run" onClick={() => setSheet('addgroup')} />,
            <DetailRow icon={<Users />} label="New group" sub="Everyone in the community can join it" onClick={() => setNewGroupOpen(true)} />,
            <DetailRow icon={<LinkIcon />} label="Invite link" onClick={() => setSheet('invite')} />,
          ])}
        </DetailSection>
      )}
      <DetailSection>
        {detailRows([
          isOwner ? <DetailRow icon={<Trash2 />} label="Delete community" danger onClick={() => setSheet('delete')} /> : <DetailRow icon={<LogOut />} label="Leave community" danger onClick={() => setSheet('leave')} />,
        ])}
      </DetailSection>
      {isOwner && <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', padding: '12px 28px 0', lineHeight: 1.5 }}>Deleting the community keeps all its groups as normal groups.</div>}

      {sheet === 'invite' && <CommunityInviteSheet c={data} isAdmin={isAdmin} onClose={() => setSheet(null)} onReset={resetLink} onSnack={onSnack} />}
      {sheet === 'leave' && !isOwner && (
        <ChatRowSheet title={`Leave ${data.name}?`} subtitle="You stop getting its announcements" avatar={<CommunityAvatar avatar={data.avatar} size={40} />} onClose={() => setSheet(null)} zIndex={97} portal
          actions={[
            mine.length ? { label: 'Leave community and groups', icon: <LogOut size={19} />, danger: true, hint: mine.some((g) => g.admin) ? `Except ${mine.filter((g) => g.admin).length === 1 ? 'the group' : `the ${mine.filter((g) => g.admin).length} groups`} you run` : `You also leave its ${countWord(mine.length, 'group', 'groups')}`, onClick: () => onLeave(data, true) } : null,
            { label: mine.length ? 'Leave community only' : 'Leave community', icon: <LogOut size={19} />, danger: !mine.length, hint: mine.length ? 'You stay in the groups you joined' : null, onClick: () => onLeave(data, false) },
          ]} />
      )}
      {(sheet === 'delete' || (sheet === 'leave' && isOwner)) && (
        <ConfirmSheet title={`Delete ${data.name}?`} text={sheet === 'leave' ? 'You run this community, so leaving means deleting it. Its groups and the announcements chat stay as normal groups.' : 'Everyone leaves the community. Its groups and the announcements chat stay as normal groups.'} confirmLabel="Delete community"
          onCancel={() => setSheet(null)} onConfirm={() => { setSheet(null); onDelete(data); }} zIndex={98} />
      )}
      {sheet === 'addgroup' && (
        <ChatRowSheet title="Add a group you run" subtitle={candidates.length ? `It shows up in ${data.name} for everyone` : 'You do not run any other groups yet'} onClose={() => setSheet(null)} zIndex={97} portal
          actions={candidates.length ? candidates.slice(0, 40).map((g) => ({ label: g.name, icon: <GroupAvatar avatar={g.avatar} name={g.name} size={28} />, onClick: () => addGroup(g) }))
            : [{ label: 'Make a new group here', icon: <Plus size={19} />, onClick: () => setNewGroupOpen(true) }]} />
      )}
      {groupSheet && (
        <ChatRowSheet title={groupSheet.name} subtitle={countWord(Number(groupSheet.members) || 0, 'member', 'members')} avatar={<GroupAvatar avatar={groupSheet.avatar} name={groupSheet.name} size={40} />} onClose={() => setGroupSheet(null)} zIndex={97} portal
          actions={[
            groupSheet.member ? { label: 'Open group', icon: <MessageSquare size={19} />, onClick: () => onOpenGroup(groupSheet.id) } : null,
            { label: 'Remove from the community', icon: <LogOut size={19} />, danger: true, hint: 'It stays as a normal group', onClick: () => removeGroup(groupSheet) },
          ]} />
      )}
      {newGroupOpen && <CommunityNewGroupPage community={data} onClose={() => setNewGroupOpen(false)} onCreate={newGroup} />}
      {membersOpen && <CommunityMembersPage c={data} uid={uid} onClose={() => setMembersOpen(false)} onOpenProfile={onOpenProfile} onSnack={onSnack} iFollowIds={iFollowIds} privacyAllowed={privacyAllowed} startAdd={membersOpen === 'add'} onAdded={onAddedPeople} onCountChange={(n) => put((cur) => ({ ...cur, members: Math.max(0, (Number(cur.members) || 0) + n) }))} />}
    </FullPage>
  );
}
function readSavedPostIds() {
  try { const a = JSON.parse(localStorage.getItem('zchat-saved-posts') || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch { return []; }
}
export function FeedPanel({ me, userId, onClose, onOpenProfile, ownerFilter = null, startPostId = null, seedPost = null, seedItems = null, onPostDeleted = null, initialTab = 'foryou', fixedIds = null, title = null, clipsOnly = false, onAt = null }) {
  useBackClose(true, onClose);
  const feedEdgeBack = useEdgeSwipeBack(true, null, { edgeOnly: true });
  useSensitiveMode();
  const [tab, setTab] = useState(initialTab || 'foryou');
  const feedKey = (t) => (fixedIds ? null : `${userId}:${ownerFilter ? `o${ownerFilter.id}` : clipsOnly ? 'clips' : t}`);
  const seeded = useMemo(() => {
    if (!fixedIds) { const hit = feedPanelMem.get(feedKey(initialTab || 'foryou')); return hit ? hit.filter((p) => !postGoneIds.has(p.id)) : null; }
    if (!seedItems || !seedItems.length) return null;
    const byId = new Map(seedItems.filter((p) => p && p.owner && !p.owner.is_deleted).map((p) => [p.id, p]));
    const list = fixedIds.map((id) => byId.get(id)).filter(Boolean);
    return list.length && list.length === fixedIds.length ? list : null;
  }, []);
  const [items, setItems] = useState(seeded);
  const [likes, setLikes] = useState(() => cachedPostStats(seeded, (s) => (s.liked ? true : undefined)));
  const [counts, setCounts] = useState(() => cachedPostStats(seeded, (s) => (s.likes != null ? { likes: s.likes, comments: s.comments || 0 } : undefined)));
  const likeTouchRef = useRef(new Map());
  const firstTabRef = useRef(true);
  const tabNowRef = useRef(tab);
  const [commentsFor, setCommentsFor] = useState(null);
  const [burst, setBurst] = useState(null);
  const [saved, setSaved] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('zchat-saved-posts') || '[]')); } catch { return new Set(); } });
  const [hideUi, setHideUi] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(null);
  const [likersFor, setLikersFor] = useState(null);
  const scrollerRef = useRef(null);
  const startedRef = useRef(false);
  const lastTapRef = useRef(0);
  const holdRef = useRef(null);
  const tabSwipeRef = useRef(null);
  useFeedViewTracking(scrollerRef, items, userId);
  const toggleSave = (post) => {
    const on = !saved.has(post.id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (on) next.add(post.id); else next.delete(post.id);
      try { localStorage.setItem('zchat-saved-posts', JSON.stringify([...next])); } catch {}
      return next;
    });
    playUiSound('tap');
    try {
      const req = on ? supabase.from('saved_posts').upsert({ user_id: userId, post_id: post.id }, { onConflict: 'user_id,post_id' }) : supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', post.id);
      req.then(() => {}, () => {});
    } catch {}
    if (on) announcePostSaved(post);
  };
  const [ownMenu, setOwnMenu] = useState(null);
  const [feedInsights, setFeedInsights] = useState(null);
  const [feedEdit, setFeedEdit] = useState(null);
  const [pinNote, setPinNote] = useState('');
  const feedTips = usePostTips(userId, me, items, (t) => { setPinNote(t); setTimeout(() => setPinNote((cur) => (cur === t ? '' : cur)), 2400); });
  const togglePin = async (post) => {
    const on = !post.pinned_at;
    const stamp = on ? new Date().toISOString() : null;
    setItems((prev) => (prev || []).map((x) => (x.id === post.id ? { ...x, pinned_at: stamp } : x)));
    playUiSound('tap');
    let res = await supabase.rpc('zchat_pin_post', { p_post: post.id, p_on: on });
    if (res.error && /function|schema|find/i.test(String(res.error.message || ''))) res = await supabase.from('posts').update({ pinned_at: stamp }).eq('id', post.id).eq('user_id', userId);
    const err = res.error ? String(res.error.message || '') : '';
    if (err || res.data === false) {
      setItems((prev) => (prev || []).map((x) => (x.id === post.id ? { ...x, pinned_at: post.pinned_at || null } : x)));
      setPinNote(/limit|three|3/i.test(err) || res.data === false ? 'You can pin up to 3 posts' : /pinned_at|column|schema/i.test(err) ? 'Pinning switches on once the latest ZChat setup is finished.' : 'That did not work. Try again.');
    } else setPinNote(on ? 'Pinned to your profile' : 'Unpinned');
    setTimeout(() => setPinNote(''), 2200);
    if (onPostDeleted) onPostDeleted(null);
  };
  const download = async (post) => {
    let src = post.media_url;
    let kind = post.media_type;
    try {
      const list = (post.media_urls || []).filter((x) => x && x.u);
      if (list.length > 1) {
        const car = document.querySelector(`[data-post-view="${post.id}"] [data-pcar]`);
        const i = car ? Math.max(0, Math.min(list.length - 1, Math.round(car.scrollLeft / Math.max(1, car.clientWidth)))) : 0;
        src = list[i].u;
        kind = list[i].t === 'video' ? 'video' : 'image';
      }
    } catch {}
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const name = `zchat-post.${kind === 'video' ? 'mp4' : 'jpg'}`;
      const file = typeof File !== 'undefined' ? new File([blob], name, { type: blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg') }) : null;
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (ios && file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); playUiSound('tap'); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      playUiSound('tap');
    } catch { const u = safeLinkUrl(src); if (u) window.open(u, '_blank', 'noopener'); }
  };
  const tabSwipe = {
    onTouchStart: (e) => { const t = e.touches && e.touches[0]; tabSwipeRef.current = t ? { x: t.clientX, y: t.clientY } : null; holdRef.current = setTimeout(() => setHideUi(true), 450); },
    onTouchMove: () => { if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; } },
    onTouchEnd: (e) => {
      if (holdRef.current) { clearTimeout(holdRef.current); holdRef.current = null; }
      if (hideUi) { setHideUi(false); return; }
      const st = tabSwipeRef.current; tabSwipeRef.current = null;
      const t = e.changedTouches && e.changedTouches[0];
      if (!st || !t) return;
      const dx = t.clientX - st.x; const dy = Math.abs(t.clientY - st.y);
      if (!ownerFilter && !fixedIds && !clipsOnly && Math.abs(dx) > 80 && dy < 50) { setTab(dx < 0 ? 'foryou' : 'following'); playUiSound('tap'); }
    },
  };

  const load = async () => {
    const owner = cacheOwner;
    const want = tab;
    let followingIds = null;
    let tagFilters = [];
    if (!ownerFilter && !fixedIds && tab === 'following') {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted');
      followingIds = (f || []).map((x) => x.following_id);
      const tf = await loadTagFollows(userId);
      tagFilters = Array.from(tf).slice(0, 12).map((t) => `caption.ilike.%#${t.replace(/[%_,()]/g, '')}%`);
      if (!followingIds.length && !tagFilters.length) { setItems([]); return; }
    }
    let posts = null;
    let postsErr = null;
    if (fixedIds) {
      const { data: fx } = fixedIds.length ? await supabase.from('posts').select('*').in('id', fixedIds.slice(0, 300)) : { data: [] };
      const fxMap = new Map((fx || []).map((x) => [x.id, x]));
      posts = fixedIds.map((id) => fxMap.get(id)).filter(Boolean);
    } else {
      let q = supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(60);
      if (clipsOnly) q = q.eq('media_type', 'video');
      if (followingIds && tagFilters.length) q = q.or([...(followingIds.length ? [`user_id.in.(${followingIds.join(',')})`] : []), ...tagFilters].join(','));
      else if (followingIds) q = q.in('user_id', followingIds);
      if (ownerFilter) q = q.or(`user_id.eq.${ownerFilter.id},and(collab_id.eq.${ownerFilter.id},collab_status.eq.accepted)`);
      ({ data: posts, error: postsErr } = await q);
      if (postsErr && ownerFilter) ({ data: posts } = await supabase.from('posts').select('*').eq('user_id', ownerFilter.id).order('created_at', { ascending: false }).limit(60));
    }
    let rows = (posts || []).filter((x) => (x.user_id === userId || !notYetPosted(x)) && !postGoneIds.has(x.id) && (!x.archived_at || !!fixedIds));
    if (seedPost && !fixedIds && !rows.some((p) => p.id === seedPost.id)) rows = [seedPost, ...rows].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
    const ids = [...new Set(rows.flatMap((p) => [p.user_id, p.collab_id || null]).filter(Boolean))];
    const byId = {};
    if (ids.length) {
      const { data: profs } = await fetchProfilesView(ids);
      sanitizeAvatarList(profs, userId).forEach((p) => { byId[p.id] = p; });
    }
    const postIds = rows.map((p) => p.id);
    const likeMap = {}; const countMap = {};
    const statsAt = Date.now();
    if (postIds.length) {
      const [{ data: ls }, { data: cs }] = await Promise.all([
        supabase.from('post_likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('post_comments').select('post_id').in('post_id', postIds),
      ]);
      (ls || []).forEach((l) => {
        countMap[l.post_id] = countMap[l.post_id] || { likes: 0, comments: 0 };
        countMap[l.post_id].likes += 1;
        if (l.user_id === userId) likeMap[l.post_id] = true;
      });
      (cs || []).forEach((c) => {
        countMap[c.post_id] = countMap[c.post_id] || { likes: 0, comments: 0 };
        countMap[c.post_id].comments += 1;
      });
    }
    const keepMine = (id) => (likeTouchRef.current.get(id) || 0) >= statsAt;
    if (owner === cacheOwner) postIds.forEach((id) => { if (!keepMine(id)) rememberPostStats(id, { liked: !!likeMap[id], likes: (countMap[id] || { likes: 0 }).likes, comments: (countMap[id] || { comments: 0 }).comments }); });
    setLikes((prev) => { const out = { ...likeMap }; postIds.forEach((id) => { if (keepMine(id)) out[id] = !!prev[id]; }); return out; });
    setCounts((prev) => { const out = { ...countMap }; postIds.forEach((id) => { if (keepMine(id) && prev[id]) out[id] = prev[id]; }); return out; });
    const built = rows.map((p) => ({ ...p, owner: byId[p.user_id], collab: p.collab_id && (p.collab_status === 'accepted' || p.collab_status === 'pending') ? byId[p.collab_id] || null : null })).filter((p) => p.owner && !p.owner.is_deleted && !postGoneIds.has(p.id));
    const fk = feedKey(want);
    if (fk) { feedPanelMem.set(fk, built); if (feedPanelMem.size > 12) feedPanelMem.delete(feedPanelMem.keys().next().value); }
    if (tabNowRef.current !== want) return;
    setItems(built);
  };
  useEffect(() => {
    tabNowRef.current = tab;
    if (!(firstTabRef.current && seeded)) {
      const hit = feedPanelMem.get(feedKey(tab));
      setItems(hit ? hit.filter((p) => !postGoneIds.has(p.id)) : null);
      if (hit) { setLikes(cachedPostStats(hit, (st) => (st.liked ? true : undefined))); setCounts(cachedPostStats(hit, (st) => (st.likes != null ? { likes: st.likes, comments: st.comments || 0 } : undefined))); }
    }
    firstTabRef.current = false;
    load();
  }, [tab]);
  const respondCollab = async (post, accept) => {
    const { data, error } = await supabase.rpc('zchat_collab_respond', { p_post: post.id, p_accept: accept });
    if (error || data === false) return;
    setItems((prev) => (prev || []).map((x) => (x.id === post.id ? { ...x, collab_status: accept ? 'accepted' : 'declined' } : x)));
    playUiSound(accept ? 'like' : 'tap');
    if (accept && post.user_id !== userId) sendPushNotification(post.user_id, 'ZChat', `${(me && me.name) || 'Someone'} accepted your collab post`, `/?post=${post.id}`, me && me.avatar);
  };
  useEffect(() => {
    if (!startPostId || startedRef.current || !items || !items.length || !scrollerRef.current) return;
    startedRef.current = true;
    const idx = items.findIndex((p) => p.id === startPostId);
    if (idx > 0) scrollerRef.current.scrollTop = idx * scrollerRef.current.clientHeight;
  }, [items && items.length]);
  useEffect(() => { if ((ownerFilter || fixedIds) && items && items.length === 0) onClose(); }, [items && items.length]);
  useEffect(() => {
    const root = scrollerRef.current;
    if (!onAt || !root || !items || !items.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((list) => { list.forEach((en) => { if (en.isIntersecting && en.intersectionRatio >= 0.6) onAt(en.target.getAttribute('data-post-view')); }); }, { root, threshold: [0.6] });
    root.querySelectorAll('[data-post-view]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items, onAt]);

  const countOf = (id) => counts[id] || { likes: 0, comments: 0 };
  const applyLike = (post, on) => {
    likeTouchRef.current.set(post.id, Date.now());
    setLikes((p) => ({ ...p, [post.id]: on }));
    setCounts((p) => { const c = p[post.id] || { likes: 0, comments: 0 }; const was = !!likes[post.id]; return was === on ? p : { ...p, [post.id]: { ...c, likes: Math.max(0, c.likes + (on ? 1 : -1)) } }; });
    const c0 = countOf(post.id);
    rememberPostStats(post.id, { liked: on, likes: Math.max(0, c0.likes + (!!likes[post.id] === on ? 0 : on ? 1 : -1)) });
  };
  const toggleLike = async (post, force) => {
    const isLiked = !!likes[post.id];
    if (isLiked && force) return;
    if (!isLiked) playUiSound('like');
    applyLike(post, !isLiked);
    const res = await latestSync(`like:${post.id}`, !isLiked, (on) => (on
      ? supabase.from('post_likes').upsert({ post_id: post.id, user_id: userId }, { onConflict: 'post_id,user_id' })
      : supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId)), isLiked);
    if (!res.ok) {
      const back = res.state === undefined ? isLiked : res.state;
      likeTouchRef.current.set(post.id, Date.now());
      setLikes((p) => ({ ...p, [post.id]: back }));
      setCounts((p) => { const c = p[post.id] || { likes: 0, comments: 0 }; return !isLiked === back ? p : { ...p, [post.id]: { ...c, likes: Math.max(0, c.likes + (back ? 1 : -1)) } }; });
      rememberPostStats(post.id, { liked: back });
      setPinNote(friendlyError(res.error, 'That did not go through. Try again.'));
      setTimeout(() => setPinNote(''), 2200);
      return;
    }
    if (!isLiked && res.state === true && post.user_id !== userId) sendPushNotification(post.user_id, 'ZChat', `${(me && me.name) || 'Someone'} liked your post`, `/?post=${post.id}`, me && me.avatar);
  };
  const onTapMedia = (post) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setBurst(post.id);
      setTimeout(() => setBurst(null), 700);
      toggleLike(post);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
  };

  const railBtn = (icon, label, onClick, color, name) => (
    <div role="button" aria-label={name || label} onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: color || 'white' }}>
      {icon}
      <span style={{ fontSize: 11.5, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{label}</span>
    </div>
  );

  return (
    <>
    <WideDim onClose={onClose} z={600} />
    <div {...feedEdgeBack} className="zchat-panel-open zchat-wide-feed" style={{ position: 'fixed', inset: 0, zIndex: 600, background: '#000', color: 'white', fontFamily: FONT }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '10px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top))', background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }}>
        <div role="button" aria-label="Close feed" onClick={onClose} style={{ position: 'absolute', left: 12, top: 'calc(10px + env(safe-area-inset-top))', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={19} /></div>
        {(ownerFilter || fixedIds || clipsOnly) && <div style={{ fontSize: 15.5, fontWeight: 800 }}>{title || 'Posts'}</div>}
        {(ownerFilter || fixedIds || clipsOnly ? [] : [['following', 'Following'], ['foryou', 'For you']]).map(([k, label]) => (
          <div key={k} role="button" onClick={() => { setTab(k); playUiSound('tap'); }} style={{ fontSize: 15.5, fontWeight: 800, cursor: 'pointer', color: tab === k ? 'white' : 'rgba(255,255,255,0.6)', borderBottom: tab === k ? '2.5px solid white' : '2.5px solid transparent', paddingBottom: 4 }}>{label}</div>
        ))}
      </div>

      {items === null ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner color="white" /></div>
      ) : !items.length ? (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 30, textAlign: 'center' }}>
          <div style={{ width: '100%', maxWidth: 240, marginBottom: 6 }}><SpotArt k={tab === 'following' ? 'discover' : 'posts'} dark /></div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{clipsOnly ? 'No clips yet' : tab === 'following' ? 'No posts from people you follow' : 'No posts yet'}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{clipsOnly ? 'Videos people post show up here' : tab === 'following' ? 'Follow more people to fill this up' : 'Share the first post from your profile'}</div>
        </div>
      ) : (
        <div ref={scrollerRef} {...tabSwipe} style={{ height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
          {items.map((post) => {
            const c = countOf(post.id);
            const isVideo = post.media_type === 'video';
            const mineP = post.user_id === userId;
            const offC = !!post.comments_off && !mineP;
            const hideL = !!post.hide_likes && !mineP;
            return (
              <div key={post.id} data-post-view={post.id} data-post-owner={post.user_id} style={{ position: 'relative', height: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', overflow: 'hidden' }}>
                <div onClick={() => { if (!isVideo && !isCarouselPost(post)) onTapMedia(post); }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a' }}>
                  {postVeiled(post, userId) ? <SensitiveCover post={post} /> : isCarouselPost(post)
                    ? <PostMediaCarousel post={post} rootRef={scrollerRef} onTap={() => onTapMedia(post)} onDoubleTap={() => { setBurst(post.id); setTimeout(() => setBurst(null), 700); toggleLike(post); }} />
                    : isVideo
                    ? <ReelVideo post={post} rootRef={scrollerRef} onDoubleTap={() => { setBurst(post.id); setTimeout(() => setBurst(null), 700); toggleLike(post); }} />
                    : <img src={post.media_url} alt={psAltOf(post, 0)} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  {post.overlay_url && !isCarouselPost(post) && !postVeiled(post, userId) && <img src={post.overlay_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                  {burst === post.id && <Heart size={110} color="#ff2d55" fill="#ff2d55" className="zchat-heart-burst" style={{ position: 'absolute' }} />}
                  {!postVeiled(post, userId) && <PostMediaOverlay post={post} myId={userId} full onOpenProfile={onOpenProfile} />}
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, transparent 20%, transparent 55%, rgba(0,0,0,0.75) 100%)', pointerEvents: 'none' }} />

                <div style={{ position: 'absolute', right: 10, bottom: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, zIndex: 3, opacity: hideUi ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: hideUi ? 'none' : 'auto' }}>
                  <div role="button" onClick={() => onOpenProfile(post.owner)} style={{ cursor: 'pointer', marginBottom: 2 }}>
                    <Avatar emoji={post.owner.avatar} name={post.owner.name} size={48} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: 'white' }}>
                    <div role="button" aria-label="Like" onClick={() => toggleLike(post)} style={{ display: 'flex', cursor: 'pointer' }}>
                      <Heart size={31} color={likes[post.id] ? '#ff2d55' : 'white'} fill={likes[post.id] ? '#ff2d55' : 'none'} />
                    </div>
                    {!hideL && <span role="button" aria-label="Show who liked" onClick={() => setLikersFor(post)} style={{ fontSize: 11.5, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.6)', cursor: 'pointer', padding: '0 8px' }}>{formatCount(c.likes)}</span>}
                  </div>
                  {!offC && railBtn(<InstaCommentIcon size={29} color="white" />, formatCount(c.comments), () => { setCommentsFor(post); playUiSound('tap'); }, null, 'Comments')}
                  {railBtn(<Bookmark size={27} color={saved.has(post.id) ? '#fbbf24' : 'white'} fill={saved.has(post.id) ? '#fbbf24' : 'none'} />, saved.has(post.id) ? 'Saved' : 'Save', () => toggleSave(post))}
                  {railBtn(<Share2 size={26} />, 'Share', async () => {
                    const link = `${siteOrigin()}/?post=${post.id}`;
                    playUiSound('tap');
                    recordPostEvent(post.id, 'share');
                    try { if (navigator.share) await navigator.share({ title: `${post.owner.name} on ZChat`, text: `See this post by ${post.owner.name} on ZChat`, url: link }); else { await copyTextToClipboard(link); } } catch {}
                  })}
                  {railBtn(<Download size={25} />, 'Save file', () => download(post))}
                  {feedTips.canTip(post) && railBtn(feedTips.tipOf(post.id) ? <CoinIcon size={27} /> : <TipCoinIcon size={27} color="white" />, feedTips.tipOf(post.id) ? 'Tipped' : 'Tip', () => feedTips.open(post), null, feedTips.tipOf(post.id) ? `You tipped ${coinsText(feedTips.tipOf(post.id))}. Tip again` : 'Tip coins')}
                  {psCanRemix(post, userId) && railBtn(<PsRemixGlyph size={27} color="white" />, 'Remix', () => psStartRemix(post), null, 'Remix this post')}
                  {mineP && railBtn(<MoreDotsIcon size={26} color="white" />, 'More', () => setOwnMenu(post), null, 'More options')}
                </div>

                <div style={{ position: 'absolute', left: 14, right: 80, bottom: 26, zIndex: 3, opacity: hideUi ? 0 : 1, transition: 'opacity 0.2s' }}>
                  <div role="button" onClick={() => onOpenProfile(post.owner)} style={{ fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                    <Avatar emoji={post.owner.avatar} name={post.owner.name} size={30} />
                    <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1, flexWrap: 'wrap', gap: 4 }}><NameBadge name={post.owner.name} verified={post.owner.verified} custom={post.owner.custom_badge} size={15} ns={cxNs(post.owner)} nsPlate />{post.collab && post.collab_status === 'accepted' && <span style={{ fontWeight: 800 }}>and {post.collab.name}</span>}</span>
                  </div>
                  {post.collab_id === userId && post.collab_status === 'pending' && (
                    <div style={{ marginTop: 10, padding: 10, borderRadius: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{(post.owner.name || '').split(' ')[0]} invited you to share this post. It shows on your profile too if you accept.</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <div role="button" aria-label="Accept collab" onClick={() => respondCollab(post, true)} style={{ flex: 1, height: 36, borderRadius: 11, background: '#FFFFFF', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>Accept</div>
                        <div role="button" aria-label="Decline collab" onClick={() => respondCollab(post, false)} style={{ flex: 1, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>Decline</div>
                      </div>
                    </div>
                  )}
                  {post.caption && <div style={{ fontSize: 14, marginTop: 6, lineHeight: 1.45, textShadow: '0 1px 6px rgba(0,0,0,0.6)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}><RichText text={post.caption} /></div>}
                  <PostAfterMedia post={post} myId={userId} dark />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{timeAgoLong(post.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pinNote && <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: 'calc(70px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 20, padding: '9px 16px', borderRadius: 20, background: 'rgba(0,0,0,0.78)', color: 'white', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{pinNote}</div>}
      {likersFor && <LikersSheet post={likersFor} meId={userId} onClose={() => setLikersFor(null)} onOpenProfile={(p) => { setLikersFor(null); onOpenProfile(p); }} />}
      {ownMenu && (
        <ActionSheet onClose={() => setOwnMenu(null)} zIndex={680} items={[
          { k: 'pin', label: ownMenu.pinned_at ? 'Unpin from profile' : 'Pin to profile', icon: <Pin />, on: () => { const p0 = ownMenu; setOwnMenu(null); togglePin(p0); } },
          { k: 'edit', label: 'Edit post', icon: <Pencil />, on: () => { const p0 = ownMenu; setOwnMenu(null); setFeedEdit(p0); } },
          { k: 'insights', label: 'View insights', icon: <Activity />, on: () => { const p0 = ownMenu; setOwnMenu(null); setFeedInsights(p0); } },
          ...psFeedItems(ownMenu, userId, { close: () => setOwnMenu(null), gone: (p) => setItems((prev) => (prev || []).filter((x) => x.id !== p.id)), back: () => load(), say: (t) => { setPinNote(t); setTimeout(() => setPinNote((c) => (c === t ? '' : c)), 2400); } }),
          { k: 'delete', label: 'Delete', icon: <Trash2 />, danger: true, on: () => { const p0 = ownMenu; setOwnMenu(null); setConfirmDeletePost(p0); } },
        ]} />
      )}
      {feedInsights && <PostInsightsPage post={feedInsights} onClose={() => setFeedInsights(null)} />}
      {feedTips.sheet}
      {feedEdit && <EditPostPage post={feedEdit} onClose={() => setFeedEdit(null)} onSaved={(np) => { setFeedEdit(null); setItems((prev) => (prev || []).map((x) => (x.id === np.id ? { ...x, ...np } : x))); setPinNote('Post updated'); setTimeout(() => setPinNote(''), 1800); }} />}
      {confirmDeletePost && (
        <ConfirmDialog layer={700} title="Delete this post?" body="It will be removed from your profile." onCancel={() => setConfirmDeletePost(null)}
          onConfirm={async () => {
            const gone = confirmDeletePost;
            setConfirmDeletePost(null);
            setItems((prev) => (prev || []).filter((x) => x.id !== gone.id));
            forgetPostLocally(gone.id);
            const { error } = await supabase.from('posts').delete().eq('id', gone.id).eq('user_id', userId);
            if (error) { unforgetPostLocally(gone.id); load(); setPinNote(friendlyError(error, 'That post could not be deleted. Try again.')); setTimeout(() => setPinNote(''), 2400); return; }
            if (onPostDeleted) onPostDeleted(gone);
          }} />
      )}
      {commentsFor && (
        <FeedComments post={commentsFor} me={me} userId={userId} onClose={() => setCommentsFor(null)}
          onOpenProfile={onOpenProfile} knownEmpty={!!counts[commentsFor.id] && counts[commentsFor.id].comments === 0}
          onCount={(n) => { const pid = commentsFor.id; rememberPostStats(pid, { comments: n }); setCounts((p) => ({ ...p, [pid]: { ...(p[pid] || { likes: 0, comments: 0 }), comments: n } })); }} />
      )}
    </div>
    </>
  );
}

function useFeedViewTracking(scrollerRef, items, myId) {
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;
    const timers = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const id = en.target.getAttribute('data-post-view');
        if (!id) return;
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          if (!timers.has(id)) timers.set(id, setTimeout(() => { recordPostEvent(id, 'view'); io.unobserve(en.target); }, 900));
        } else if (timers.has(id)) { clearTimeout(timers.get(id)); timers.delete(id); }
      });
    }, { root, threshold: [0, 0.6, 1] });
    root.querySelectorAll('[data-post-view]').forEach((el) => { if (el.getAttribute('data-post-owner') !== myId && !postViewSeen.has(`view:${el.getAttribute('data-post-view')}`)) io.observe(el); });
    return () => { timers.forEach((t) => clearTimeout(t)); io.disconnect(); };
  }, [items, myId]);
}

function InsightBar({ label, value, max, color }) {
  const { theme } = useTheme();
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: theme.ink, marginBottom: 6 }}><span>{label}</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatCount(value)}</span></div>
      <div style={{ height: 6, borderRadius: 3, background: theme.soft, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color || theme.coral, transition: 'width 0.5s ease' }} /></div>
    </div>
  );
}
const tipSumMem = new Map();
const tipSumWait = new Map();
function tipSumLoad(postId) {
  if (!postId) return Promise.resolve(null);
  const live = tipSumWait.get(postId);
  if (live) return live;
  const job = (async () => {
    let res;
    try { res = await supabase.rpc('zchat_tip_summary', { p_post: postId }); } catch (e) { res = { error: e }; }
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    if (!row || typeof row !== 'object') return null;
    const recent = Array.isArray(row.recent) ? row.recent.filter((r) => r && typeof r === 'object').slice(0, 5) : [];
    const who = sanitizeAvatarList(recent.map((r) => ({ id: r.user_id, name: r.name, username: r.username, avatar: r.avatar })), '');
    const next = { coins: Math.max(0, Number(row.coins) || 0), tips: Math.max(0, Number(row.tips) || 0), people: Math.max(0, Number(row.people) || 0), recent: recent.map((r, i) => ({ ...r, who: who[i] || null })), at: Date.now() };
    tipSumMem.set(postId, next);
    return next;
  })().catch(() => null).finally(() => { tipSumWait.delete(postId); });
  tipSumWait.set(postId, job);
  return job;
}
function PostTipsInsight({ postId }) {
  const { theme } = useTheme();
  const [data, setData] = useState(() => tipSumMem.get(postId) || null);
  useEffect(() => {
    let alive = true;
    const have = tipSumMem.get(postId);
    if (have && Date.now() - have.at < 15000) { setData(have); return undefined; }
    tipSumLoad(postId).then((next) => { if (alive && next) setData(next); });
    return () => { alive = false; };
  }, [postId]);
  if (!data || !data.tips) return null;
  return (
    <>
      <IgHeading>Tips</IgHeading>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 4px', fontSize: 15, color: theme.ink, boxShadow: `0 0.5px 0 ${theme.hair}` }}>
        <span>Coins from tips</span><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={16} />{data.coins.toLocaleString('en-US')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 4px', fontSize: 15, color: theme.ink, boxShadow: `0 0.5px 0 ${theme.hair}` }}>
        <span>People who tipped</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{data.people.toLocaleString('en-US')}</span>
      </div>
      {data.recent.map((r, i) => (
        <div key={`${r.user_id}:${r.created_at}:${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', boxShadow: i < data.recent.length - 1 ? `0 0.5px 0 ${theme.hair}` : 'none' }}>
          <Avatar emoji={r.who && r.who.avatar} name={(r.who && r.who.name) || '?'} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(r.who && (r.who.username || r.who.name)) || 'Someone'}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note ? `"${r.note}"` : shortAgo(r.created_at)}</div>
          </div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{`+${Number(r.amount || 0).toLocaleString('en-US')}`}</div>
        </div>
      ))}
    </>
  );
}
export function PostInsightsPage({ post, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [limited, setLimited] = useState(false);
  useEffect(() => {
    let alive = true;
    tipSumLoad(post.id);
    (async () => {
      const { data: d, error } = await supabase.rpc('zchat_post_insights', { p_post: post.id, p_tz: localTz() });
      if (!alive) return;
      if (!error && d && typeof d === 'object') { setData(d); return; }
      const [{ count: likes }, { count: comments }] = await Promise.all([
        supabase.from('post_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('post_comments').select('post_id', { count: 'exact', head: true }).eq('post_id', post.id),
      ]);
      if (!alive) return;
      setLimited(true);
      setData({ likes: Number(likes) || 0, comments: Number(comments) || 0, views: null, reach: null, saves: null, shares: null, profile: null, followers: null, non_followers: null, hours: null });
    })();
    return () => { alive = false; };
  }, [post.id]);
  const thumb = postThumbOf(post);
  const n = (v) => (v == null ? 'Soon' : formatCount(Number(v) || 0));
  const interactions = data ? (Number(data.likes) || 0) + (Number(data.comments) || 0) + (Number(data.saves) || 0) + (Number(data.shares) || 0) : 0;
  const reach = data && data.reach != null ? Number(data.reach) || 0 : null;
  const hours = data && Array.isArray(data.hours) && data.hours.length === 24 ? data.hours.map((x) => Number(x) || 0) : null;
  const hourMax = hours ? Math.max(1, ...hours) : 1;
  const stat = (label, value) => (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{label}</div>
    </div>
  );
  return (
    <FullPage title="Post insights" onBack={onClose} zIndex={760}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 18px' }}>
        <div style={{ width: 64, height: 80, borderRadius: 10, overflow: 'hidden', background: theme.soft, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
          {thumb && thumb.url ? <img src={thumb.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Play size={20} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.caption || 'Your post'}</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 3 }}>Posted {fmtDate(new Date(post.created_at), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
        </div>
      </div>
      {data === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>
      ) : (
        <>
          <div style={{ display: 'flex', padding: '14px 0', borderRadius: 16, background: theme.soft }}>
            {stat('Views', n(data.reach))}
            {stat('Times seen', n(data.views))}
            {stat('Interactions', formatCount(interactions))}
          </div>
          <IgHeading>Interactions</IgHeading>
          {[['Likes', data.likes], ['Comments', data.comments], ['Saves', data.saves], ['Shares', data.shares]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 4px', fontSize: 15, color: theme.ink, boxShadow: `0 0.5px 0 ${theme.hair}` }}>
              <span>{l}</span><span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{n(v)}</span>
            </div>
          ))}
          <PostTipsInsight postId={post.id} />
          {reach != null && reach > 0 && (
            <>
              <IgHeading>Who saw it</IgHeading>
              <InsightBar label="Followers" value={Number(data.followers) || 0} max={reach} />
              <InsightBar label="Not following you" value={Number(data.non_followers) || 0} max={reach} color={theme.dark ? '#A3A0B0' : '#8E8C98'} />
              {data.profile != null && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px', fontSize: 15, color: theme.ink }}><span>Profile visits from this post</span><span style={{ fontWeight: 700 }}>{n(data.profile)}</span></div>}
            </>
          )}
          {hours && hours.some((x) => x > 0) && (
            <>
              <IgHeading>When people looked</IgHeading>
              <div role="img" aria-label="Views by hour of the day" style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 96, padding: '0 2px' }}>
                {hours.map((v, i) => <div key={i} style={{ flex: 1, height: `${Math.max(4, Math.round((v / hourMax) * 100))}%`, borderRadius: 3, background: v ? theme.coral : theme.soft }} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: theme.muted, padding: '6px 2px 0' }}><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span></div>
            </>
          )}
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '18px 4px 0' }}>{limited ? 'Views and reach start counting once the latest ZChat setup is finished.' : 'Only you can see these numbers. Views count each account once and never your own. Times seen counts each account once a day.'}</div>
        </>
      )}
    </FullPage>
  );
}

export function EditPostPage({ post, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [caption, setCaption] = useState(post.caption || '');
  const [location, setLocation] = useState(post.location || '');
  const [hideLikes, setHideLikes] = useState(!!post.hide_likes);
  const [commentsOff, setCommentsOff] = useState(!!post.comments_off);
  const [remixOk, setRemixOk] = useState(post.remix_ok !== false);
  const [alts, setAlts] = useState(() => psEditAlts(post));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const thumb = postThumbOf(post);
  const save = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    const patch = { caption: caption.trim() || null, location: location.trim() || null, hide_likes: hideLikes, comments_off: commentsOff };
    if ('archived_at' in post) Object.assign(patch, psEditPatch(post, remixOk, alts));
    let { error } = await supabase.from('posts').update(patch).eq('id', post.id).eq('user_id', post.user_id);
    if (error && /hide_likes|comments_off|location|column|schema/i.test(String(error.message || ''))) {
      ({ error } = await supabase.from('posts').update({ caption: patch.caption }).eq('id', post.id).eq('user_id', post.user_id));
      if (!error) { setBusy(false); onSaved({ ...post, caption: patch.caption }); return; }
    }
    setBusy(false);
    if (error) { setErr(friendlyError(error, 'That did not save. Try again.')); return; }
    onSaved({ ...post, ...patch });
  };
  return (
    <FullPage title="Edit post" onBack={onClose} zIndex={760}
      right={<div role="button" aria-label="Save post changes" onClick={save} style={{ padding: '0 12px', height: 40, display: 'flex', alignItems: 'center', fontSize: 15.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>{busy ? <Spinner size={16} color={theme.coral} /> : 'Done'}</div>}>
      <div style={{ display: 'flex', gap: 12, padding: '8px 0 6px' }}>
        <div style={{ width: 72, height: 90, borderRadius: 10, overflow: 'hidden', background: theme.soft, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
          {thumb && thumb.url ? <img src={thumb.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Play size={20} />}
        </div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 2200))} placeholder="Write a caption" aria-label="Caption" rows={4}
          style={{ flex: 1, minWidth: 0, resize: 'none', border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15.5, lineHeight: 1.4, padding: '4px 0' }} />
      </div>
      <TagSuggestBar text={caption} dark={false} onPick={(tag, typed) => setCaption(applyTagPick(caption, typed, tag).slice(0, 2200))} />
      <IgHeading>Location</IgHeading>
      <input value={location} onChange={(e) => setLocation(e.target.value.slice(0, 60))} placeholder="Add a place" aria-label="Location" style={{ ...inputStyle(theme), fontSize: 15.5 }} />
      <IgHeading>Options</IgHeading>
      <IgRow inset={false} label="Hide like count" sub="Only you see how many people liked this" right={<IgToggle on={hideLikes} onClick={() => setHideLikes((v) => !v)} />} />
      <IgRow inset={false} label="Turn off comments" sub="Nobody can add new comments" right={<IgToggle on={commentsOff} onClick={() => setCommentsOff((v) => !v)} />} />
      {'remix_ok' in post && post.kind !== 'voice' && <IgRow inset={false} label="Allow remixes" sub="People can post their own photo or video next to this one, with credit to you" right={<IgToggle on={remixOk} onClick={() => setRemixOk((v) => !v)} />} />}
      {alts.length > 0 && <PsEditAltList alts={alts} onChange={setAlts} />}
      {err && <div role="alert" style={{ color: theme.danger, fontSize: 13.5, fontWeight: 600, padding: '12px 4px' }}>{err}</div>}
    </FullPage>
  );
}

function CollectionCover({ posts, size }) {
  const { theme } = useTheme();
  const pics = posts.slice(0, 4).map((p) => postThumbOf(p)).map((t) => (t && t.url) || null);
  return (
    <div style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', background: theme.soft, display: 'grid', gridTemplateColumns: pics.length > 1 ? '1fr 1fr' : '1fr', gridTemplateRows: pics.length > 2 ? '1fr 1fr' : '1fr', gap: 1.5 }}>
      {pics.length ? pics.map((u, i) => <div key={i} style={{ background: theme.soft2, minHeight: 0 }}>{u && <img src={u} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</div>) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}><Bookmark size={size || 26} /></div>}
    </div>
  );
}
export function SavedPostsGrid({ me, myId }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => { const m = savedPostsMem.get(myId); return m ? m.rows : null; });
  const [cols, setCols] = useState(() => { const m = savedPostsMem.get(myId); return m ? m.cols : []; });
  const [view, setView] = useState(null);
  const [open, setOpen] = useState(null);
  const [menu, setMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [askDelete, setAskDelete] = useState(null);
  const load = async () => {
    let saved = readSavedPostIds().slice().reverse().map((id) => ({ post_id: id, collection_id: null }));
    try {
      const { data, error } = await supabase.from('saved_posts').select('*').eq('user_id', myId).order('created_at', { ascending: false }).limit(400);
      if (!error && Array.isArray(data)) {
        const seen = new Set(data.map((r) => r.post_id));
        saved = [...data.map((r) => ({ post_id: r.post_id, collection_id: r.collection_id || null })), ...saved.filter((r) => !seen.has(r.post_id))];
      }
    } catch {}
    const [colList, postsRes] = await Promise.all([
      loadCollections(myId, true),
      saved.length ? supabase.from('posts').select('*').in('id', saved.map((r) => r.post_id).slice(0, 400)) : Promise.resolve({ data: [] }),
    ]);
    const byId = new Map(((postsRes && postsRes.data) || []).map((x) => [x.id, x]));
    const nextRows = saved.map((r) => (byId.get(r.post_id) ? { ...byId.get(r.post_id), __col: r.collection_id } : null)).filter(Boolean);
    savedPostsMem.set(myId, { rows: nextRows, cols: colList });
    setCols(colList);
    setRows(nextRows);
  };
  useEffect(() => {
    load();
    const on = () => load();
    window.addEventListener('zchat-collections', on);
    return () => window.removeEventListener('zchat-collections', on);
  }, []);
  const rename = async (col, name) => {
    const n = name.trim().slice(0, 40);
    if (!n) return;
    const { error } = await supabase.from('saved_collections').update({ name: n }).eq('id', col.id).eq('user_id', myId);
    if (!error) { setCols((l) => l.map((c) => (c.id === col.id ? { ...c, name: n } : c))); if (view && view.id === col.id) setView({ ...view, name: n }); }
    setRenaming(null);
  };
  const remove = async (col) => {
    setAskDelete(null);
    await supabase.from('saved_posts').update({ collection_id: null }).eq('user_id', myId).eq('collection_id', col.id);
    await supabase.from('saved_collections').delete().eq('id', col.id).eq('user_id', myId);
    collectionsMem.list = null;
    setView(null);
    load();
  };
  if (rows === null) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>;
  if (!rows.length && !cols.length) return <EmptyState art="saved" title="No saved posts yet" text="Tap the bookmark on any post in Vibes to keep it here." />;
  const shown = view ? rows.filter((r) => (view.id === 'all' ? true : r.__col === view.id)) : rows;
  if (view) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 12px' }}>
          <div role="button" aria-label="Back to collections" onClick={() => setView(null)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, marginLeft: -8 }}><ChevronLeft size={22} /></div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{view.name}</div>
          {view.id !== 'all' && <div role="button" aria-label={`Options for ${view.name}`} onClick={() => setMenu(view)} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><MoreDotsIcon size={20} /></div>}
        </div>
        {!shown.length ? <EmptyState art="saved" title="Nothing here yet" text="When you save a post, tap Save to collection to add it here." /> : (
          <div role="list" aria-label={`${view.name} posts`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, margin: '0 -16px' }}>
            {shown.map((x) => <PostTile key={x.id} p={x} onOpen={setOpen} />)}
          </div>
        )}
        {open && <Portal><FeedPanel me={me} userId={myId} fixedIds={shown.map((x) => x.id)} title={view.name} startPostId={open.id} seedPost={open} onClose={() => { setOpen(null); load(); }} onOpenProfile={() => setOpen(null)} /></Portal>}
        {menu && <ActionSheet title={menu.name} onClose={() => setMenu(null)} zIndex={720} items={[
          { k: 'rename', label: 'Rename collection', icon: <Pencil />, on: () => { const c = menu; setMenu(null); setRenaming({ col: c, name: c.name }); } },
          { k: 'delete', label: 'Delete collection', icon: <Trash2 />, danger: true, on: () => { const c = menu; setMenu(null); setAskDelete(c); } },
        ]} />}
        {renaming && (
          <ConfirmDialog layer={740} danger={false} title="Rename collection" confirmLabel="Save" onCancel={() => setRenaming(null)} onConfirm={() => rename(renaming.col, renaming.name)}
            body={<input autoFocus value={renaming.name} onChange={(e) => setRenaming((r) => ({ ...r, name: e.target.value.slice(0, 40) }))} aria-label="Collection name" style={{ ...inputStyle(theme), fontSize: 16, marginTop: 6 }} />} />
        )}
        {askDelete && <ConfirmDialog layer={740} title={`Delete ${askDelete.name}?`} body="The posts stay in All posts." confirmLabel="Delete" onCancel={() => setAskDelete(null)} onConfirm={() => remove(askDelete)} />}
      </>
    );
  }
  return (
    <>
      <div role="list" aria-label="Collections" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, padding: '4px 0 12px' }}>
        {[{ id: 'all', name: 'All posts' }, ...cols].map((col) => {
          const posts = col.id === 'all' ? rows : rows.filter((r) => r.__col === col.id);
          return (
            <div key={col.id} role="listitem" aria-label={`Collection ${col.name}`} onClick={() => setView(col)} className="zchat-press" style={{ cursor: 'pointer', minWidth: 0 }}>
              <CollectionCover posts={posts} />
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
export function SchedulePostSheet({ value, onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const pad = (n) => String(n).padStart(2, '0');
  const toLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const [custom, setCustom] = useState(() => toLocal(value ? new Date(value) : new Date(Date.now() + 3600000)));
  const at = (h, addDays) => { const d = new Date(); d.setDate(d.getDate() + addDays); d.setHours(h, 0, 0, 0); return d; };
  const now = new Date();
  const opts = [
    ['hour', 'In 1 hour', new Date(Date.now() + 3600000)],
    now.getHours() < 19 ? ['tonight', 'Tonight at 8:00 PM', at(20, 0)] : null,
    ['morning', 'Tomorrow at 9:00 AM', at(9, 1)],
    ['evening', 'Tomorrow at 7:00 PM', at(19, 1)],
  ].filter(Boolean);
  const okCustom = (() => { const d = new Date(custom); return !Number.isNaN(d.getTime()) && d.getTime() > Date.now() + 60000 && d.getTime() < Date.now() + 75 * 86400000; })();
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '8px 0 calc(16px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 8px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: theme.ink, padding: '2px 20px 4px' }}>Schedule this post</div>
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.muted, padding: '0 24px 10px' }}>It goes up by itself at the time you pick.</div>
          {opts.map(([k, l, d]) => (
            <div key={k} role="button" aria-label={l} onClick={() => { hapticTap(); onPick(d.toISOString()); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', minHeight: 52, cursor: 'pointer', fontSize: 16, color: theme.ink }}>
              <Clock size={20} color={theme.muted} />{l}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px 4px' }}>
            <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Pick a date and time" style={{ ...inputStyle(theme), flex: 1, fontSize: 15.5 }} />
            <div role="button" aria-label="Use this time" onClick={() => { if (okCustom) { hapticTap(); onPick(new Date(custom).toISOString()); } }} style={{ height: 44, padding: '0 16px', borderRadius: 12, background: okCustom ? theme.coral : theme.soft, color: okCustom ? '#FFFFFF' : theme.muted, display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 700, cursor: okCustom ? 'pointer' : 'default', flexShrink: 0 }}>Set</div>
          </div>
          {value && <div role="button" aria-label="Post now instead" onClick={() => onPick(null)} style={{ textAlign: 'center', padding: '14px 0 4px', fontSize: 15, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Post now instead</div>}
        </div>
      </div>
    </Portal>
  );
}

function psEditAlts(post) {
  if (!post || !('archived_at' in post) || post.kind === 'voice') return [];
  const list = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls : [{ u: post.media_url, t: post.media_type === 'video' ? 'video' : 'image' }];
  return list.map((m, i) => ({ i, u: m && m.u, video: !!m && m.t === 'video', a: psAltOf(post, i) })).filter((x) => x.u && !x.video);
}
function psEditPatch(post, remixOk, alts) {
  const out = {};
  if ('remix_ok' in post && post.kind !== 'voice' && remixOk !== (post.remix_ok !== false)) out.remix_ok = remixOk;
  const n = Array.isArray(post.media_urls) && post.media_urls.length ? post.media_urls.length : 1;
  const next = Array.from({ length: n }, (_, i) => { const x = alts.find((y) => y.i === i); const v = x ? String(x.a || '').trim().slice(0, 300) : psAltOf(post, i); return v || null; });
  const was = Array.from({ length: n }, (_, i) => psAltOf(post, i) || null);
  if (JSON.stringify(next) !== JSON.stringify(was)) out.alt_texts = next.some(Boolean) ? next : null;
  return out;
}
function PsEditAltList({ alts, onChange }) {
  const { theme } = useTheme();
  return (
    <>
      <IgHeading>Alt text</IgHeading>
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '0 4px 8px' }}>Say what is in each photo for people who use a screen reader.</div>
      {alts.map((x) => (
        <div key={x.i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '6px 0' }}>
          <img src={x.u} alt="" draggable={false} style={{ width: 44, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: theme.soft }} />
          <input value={x.a} onChange={(e) => { const v = e.target.value.slice(0, 300); onChange(alts.map((y) => (y.i === x.i ? { ...y, a: v } : y))); }} placeholder="Describe this photo" aria-label={alts.length > 1 ? `Alt text for photo ${x.i + 1}` : 'Alt text'} style={{ ...inputStyle(theme), fontSize: 15.5, flex: 1, minWidth: 0 }} />
        </div>
      ))}
    </>
  );
}

async function pfTool(action, payload, timeoutMs = 9000) {
  let token = '';
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch {}
  if (!token) return { error: 'login', status: 401 };
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  try {
    const res = await fetch('/.netlify/functions/zchat-profile', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...(payload || {}), action }), signal: ctrl ? ctrl.signal : undefined });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: (json && json.error) || 'error', status: res.status };
    return { data: json || {}, status: res.status };
  } catch {
    return { error: 'network', status: 0 };
  } finally {
    clearTimeout(timer);
  }
}
function ListIconPf({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7.5 9h9M7.5 12.5h9M7.5 16h5" />
    </svg>
  );
}
const WATCH_REACTS = [['love', 'heart', 'Loved it', '#F43F5E'], ['laugh', 'smile', 'Funny', '#E8930C'], ['wow', 'eye', 'Wow', '#0EA5E9'], ['fire', 'party', 'Hyped', '#F97316'], ['sleep', 'sleep', 'Boring', '#6366F1']];
const WATCH_REACT_BY = Object.fromEntries(WATCH_REACTS.map(([k, g, l, c]) => [k, { k, g, l, c }]));
const watchMem = new Map();
const watchSearchMem = new Map();
const watchNameMem = new Map();
function watchMerge(list, row) {
  if (!row || !row.id) return list;
  const i = list.findIndex((x) => x.id === row.id || (row.cid && x.cid === row.cid));
  if (row.removed_at) return i >= 0 ? list.filter((_, k) => k !== i) : list;
  if (i < 0) return [row, ...list];
  const next = list.slice();
  next[i] = { ...next[i], ...row, cid: undefined };
  return next;
}
function WatchPoster({ src, size = 46 }) {
  const { theme } = useTheme();
  const [bad, setBad] = useState(false);
  const h = Math.round(size * 1.45);
  return (
    <div style={{ width: size, height: h, borderRadius: 8, overflow: 'hidden', background: theme.rowBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
      {src && !bad ? <img src={src} alt="" loading="lazy" onError={() => setBad(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <WatchIcon size={20} />}
    </div>
  );
}
export function WatchListPage({ chatKey, chatName, myId, onClose, onWatch, onCompose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const mem = watchMem.get(chatKey);
  const [items, setItems] = useState(() => (mem ? mem.items : null));
  const [reacts, setReacts] = useState(() => (mem ? mem.reacts : []));
  const [tab, setTab] = useState('want');
  const [q, setQ] = useState('');
  const [found, setFound] = useState(null);
  const [searching, setSearching] = useState(false);
  const [manual, setManual] = useState(null);
  const [menu, setMenu] = useState(null);
  const [, setNames] = useState(0);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  if (chatKey.indexOf('dm:') === 0 && chatName) chatKey.slice(3).split(':').forEach((id) => { if (id && id !== myId && !watchNameMem.has(id)) watchNameMem.set(id, chatName); });
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const keep = (nextItems, nextReacts) => { watchMem.set(chatKey, { items: nextItems || itemsRef.current || [], reacts: nextReacts || reacts }); };
  const loadNames = (list) => {
    const want = [...new Set((list || []).map((x) => x.added_by).filter((id) => id && id !== myId && !watchNameMem.has(id)))].slice(0, 100);
    if (!want.length) return;
    fetchProfilesView(want).then(({ data }) => { (data || []).forEach((p) => watchNameMem.set(p.id, p.name || '')); setNames((n) => n + 1); }, () => {});
  };
  useEffect(() => {
    let alive = true;
    Promise.all([
      supabase.from('zchat_watch_items').select('*').eq('chat_key', chatKey).is('removed_at', null).order('created_at', { ascending: false }).limit(300),
      supabase.from('zchat_watch_reacts').select('item_id, user_id, emoji').eq('chat_key', chatKey),
    ]).then(([a, b]) => {
      if (!alive) return;
      if (a.error && !(profileFnMissing(a.error) || /zchat_watch|schema cache/i.test(String(a.error.message || '')))) { setFail(loadFailCode(a.error)); return; }
      if (a.error) { if (!itemsRef.current) setItems([]); appSnack('Watch lists switch on once the latest ZChat setup is finished.'); return; }
      setFail(null);
      const pending = (itemsRef.current || []).filter((x) => x.cid);
      const list = [...pending, ...(a.data || []).filter((x) => !x.removed_at)];
      const rs = b.error ? [] : (b.data || []).filter((r) => r.emoji !== 'none');
      setItems(list);
      setReacts(rs);
      watchMem.set(chatKey, { items: list, reacts: rs });
      loadNames(list);
    }, () => { if (alive) setFail(''); });
    return () => { alive = false; };
  }, [chatKey, tick]);
  useEffect(() => {
    const ch = rtKeep(() => supabase.channel(rtName(`pf-watch-${chatKey}`))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zchat_watch_items', filter: `chat_key=eq.${chatKey}` }, (p) => { const r = p && p.new; if (!r || !r.id) return; setItems((l) => { const n = watchMerge(l || [], r); watchMem.set(chatKey, { items: n, reacts: (watchMem.get(chatKey) || {}).reacts || [] }); return n; }); loadNames([r]); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zchat_watch_reacts', filter: `chat_key=eq.${chatKey}` }, (p) => { const r = p && p.new; if (!r || !r.item_id) return; setReacts((l) => { const n = [...l.filter((x) => !(x.item_id === r.item_id && x.user_id === r.user_id)), ...(r.emoji && r.emoji !== 'none' ? [{ item_id: r.item_id, user_id: r.user_id, emoji: r.emoji }] : [])]; watchMem.set(chatKey, { items: itemsRef.current || [], reacts: n }); return n; }); }));
    return () => { rtDrop(ch); };
  }, [chatKey]);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setFound(null); setSearching(false); return undefined; }
    const hit = watchSearchMem.get(term.toLowerCase());
    if (hit) { setFound(hit); setSearching(false); return undefined; }
    setSearching(true);
    let alive = true;
    const t = setTimeout(() => {
      pfTool('movies', { q: term }).then(({ data, error }) => {
        if (!alive) return;
        setSearching(false);
        const list = !error && data && Array.isArray(data.items) ? data.items.slice(0, 12) : [];
        if (!error) watchSearchMem.set(term.toLowerCase(), list);
        setFound(error ? 'off' : list);
      });
    }, 380);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);
  const add = async (it) => {
    const title = String(it.t || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!title) return;
    const cid = `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const temp = { id: cid, cid, chat_key: chatKey, title, kind: it.kind === 'show' ? 'show' : 'movie', year: it.y || null, poster: it.poster || null, link: it.link || null, added_by: myId, watched_at: null, created_at: new Date().toISOString() };
    hapticTap();
    setItems((l) => [temp, ...(l || [])]);
    setTab('want');
    setQ('');
    setManual(null);
    const { data, error } = await supabase.rpc('zchat_watch_add', { p_key: chatKey, p_title: title, p_kind: temp.kind, p_year: temp.year, p_poster: temp.poster, p_link: temp.link });
    if (error || !data || !data.ok) {
      setItems((l) => (l || []).filter((x) => x.id !== cid));
      const why = data && data.why;
      appSnack(why === 'dupe' ? 'That one is already on the list.' : why === 'full' ? 'This watch list is full. Remove something first.' : why === 'link' ? 'That link cannot be used.' : why === 'busy' ? 'You added a lot just now. Try again in a bit.' : profileFnMissing(error) ? 'Watch lists switch on once the latest ZChat setup is finished.' : friendlyError(error, 'That could not be added. Try again.'));
      return;
    }
    setItems((l) => { const n = (l || []).filter((x) => x.id !== cid && x.id !== data.item.id); const next = [data.item, ...n]; keep(next); return next; });
  };
  const mark = async (it) => {
    const on = !it.watched_at;
    const patch = { watched_at: on ? new Date().toISOString() : null, watched_by: on ? myId : null };
    hapticTap();
    setItems((l) => (l || []).map((x) => (x.id === it.id ? { ...x, ...patch } : x)));
    const { data, error } = await supabase.rpc('zchat_watch_mark', { p_id: it.id, p_watched: on });
    if (error || !data || !data.ok) { setItems((l) => (l || []).map((x) => (x.id === it.id ? { ...x, watched_at: it.watched_at, watched_by: it.watched_by } : x))); appSnack(friendlyError(error, 'That could not be changed. Try again.')); return; }
    if (on) appSnack(`Moved ${it.title} to watched`);
  };
  const react = async (it, k) => {
    const cur = reacts.find((r) => r.item_id === it.id && r.user_id === myId);
    const next = cur && cur.emoji === k ? null : k;
    const before = reacts;
    hapticTap();
    setReacts((l) => [...l.filter((r) => !(r.item_id === it.id && r.user_id === myId)), ...(next ? [{ item_id: it.id, user_id: myId, emoji: next }] : [])]);
    const { data, error } = await supabase.rpc('zchat_watch_react', { p_id: it.id, p_emoji: next });
    if (error || !data || !data.ok) { setReacts(before); appSnack(friendlyError(error, 'That could not be saved. Try again.')); }
  };
  const remove = async (it) => {
    const before = itemsRef.current || [];
    hapticTap();
    setItems(before.filter((x) => x.id !== it.id));
    const { data, error } = await supabase.rpc('zchat_watch_remove', { p_id: it.id });
    if (error || !data || !data.ok) { setItems(before); appSnack(data && data.why === 'owner' ? 'Only the person who added it, or a group admin, can remove it.' : friendlyError(error, 'That could not be removed. Try again.')); }
  };
  const together = (it) => {
    const v = youtubeIdOf(it.link || '');
    setMenu(null);
    if (v) { onWatch({ v, t: it.title.slice(0, 80), at: new Date().toISOString() }); return; }
    onCompose(it.title.slice(0, 80));
  };
  const list = (items || []).filter((x) => (tab === 'seen' ? !!x.watched_at : !x.watched_at));
  const seenCount = (items || []).filter((x) => !!x.watched_at).length;
  const wantCount = (items || []).length - seenCount;
  const who = (id) => (id === myId ? 'you' : watchNameMem.has(id) ? pfFirst(watchNameMem.get(id), 'someone') : null);
  const by = (pre, id) => { const n = who(id); return n ? `${pre} ${n}` : null; };
  const term = q.trim();
  const menuItem = menu ? (items || []).find((x) => x.id === menu) : null;
  const myReact = (id) => { const r = reacts.find((x) => x.item_id === id && x.user_id === myId); return r ? r.emoji : null; };
  return (
    <FullPage title="Watch list" subtitle={chatName} onBack={onClose} zIndex={96}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '10px 0 4px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 120))} onKeyDown={(e) => { if (e.key === 'Enter' && term) { e.preventDefault(); if (Array.isArray(found) && found[0]) add(found[0]); else setManual({ t: term, kind: 'movie', link: '' }); } }} placeholder="Add a movie or show" aria-label="Add a movie or show" autoComplete="off" enterKeyHint="done" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {searching ? <Spinner size={15} color={theme.muted} /> : q ? <X size={16} style={{ cursor: 'pointer' }} onClick={() => setQ('')} /> : null}
      </label>
      {term.length >= 2 && (
        <div role="list" aria-label="Search results" style={{ marginBottom: 6 }}>
          {Array.isArray(found) && found.map((it, i) => (
            <div key={`${it.t}:${it.y}:${i}`} role="listitem" aria-label={`Add ${it.t}`} onClick={() => add(it)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 2px', cursor: 'pointer' }}>
              <WatchPoster src={it.poster} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.t}</div>
                <div style={{ fontSize: 12.5, color: theme.muted }}>{[it.y, it.kind === 'show' ? 'Show' : 'Movie'].filter(Boolean).join(', ')}</div>
              </div>
              <Plus size={20} color={kitOnInk(theme)} />
            </div>
          ))}
          {found === 'off' && <div style={{ fontSize: 13, color: theme.muted, padding: '6px 2px' }}>Search is not available right now. You can still add it by name.</div>}
          {Array.isArray(found) && !found.length && !searching && <div style={{ fontSize: 13, color: theme.muted, padding: '6px 2px' }}>Nothing found by that name.</div>}
          <div role="button" aria-label={`Add ${term} by name`} onClick={() => setManual({ t: term, kind: 'movie', link: '' })} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 2px', cursor: 'pointer', color: kitOnInk(theme), fontSize: 15, fontWeight: 600 }}>
            <Plus size={20} />{`Add “${term.slice(0, 40)}” by name`}
          </div>
        </div>
      )}
      {manual && (
        <div style={{ padding: '12px', borderRadius: 16, background: theme.rowBg, margin: '4px 0 10px' }}>
          <input value={manual.t} onChange={(e) => setManual({ ...manual, t: e.target.value.slice(0, 120) })} placeholder="Title" aria-label="Title" style={{ ...inputStyle(theme), background: theme.panelBg }} />
          <SegmentedControl value={manual.kind} onChange={(v) => setManual({ ...manual, kind: v })} options={[['movie', 'Movie'], ['show', 'Show']]} style={{ marginTop: 10 }} />
          <input value={manual.link} onChange={(e) => setManual({ ...manual, link: e.target.value.slice(0, 500) })} placeholder="A link, if you have one" aria-label="Link" inputMode="url" autoCapitalize="none" style={{ ...inputStyle(theme), background: theme.panelBg, marginTop: 10 }} />
          {manual.link && !/^https:\/\//i.test(manual.link.trim()) && <div style={{ fontSize: 12.5, color: theme.danger, fontWeight: 600, paddingTop: 6 }}>Links start with https://</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div style={{ width: 110 }}><BigButton label="Cancel" tone="plain" onClick={() => setManual(null)} /></div>
            <div style={{ flex: 1 }}><BigButton label="Add to the list" disabled={!manual.t.trim() || (manual.link.trim() && !/^https:\/\//i.test(manual.link.trim()))} onClick={() => add({ t: manual.t, kind: manual.kind, link: manual.link.trim() || null })} /></div>
          </div>
        </div>
      )}
      <SegmentedControl value={tab} onChange={(v) => { hapticTap(); setTab(v); }} options={[['want', wantCount ? `To watch ${wantCount}` : 'To watch'], ['seen', seenCount ? `Watched ${seenCount}` : 'Watched']]} style={{ marginTop: 8 }} />
      {items === null ? (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 36 }}><Spinner size={20} color={theme.muted} /></div>)
        : !list.length ? (tab === 'want'
          ? <EmptyState art="moments" title="Nothing to watch yet" text="Add movies and shows you want to see together. Everyone in this chat can add to it." />
          : <EmptyState art="nothing" title="Nothing watched yet" text="Mark something as watched and it moves here." />)
        : (
          <div role="list" aria-label={tab === 'want' ? 'To watch' : 'Watched'} style={{ paddingTop: 6 }}>
            {list.map((it, i) => {
              const counts = WATCH_REACTS.map(([k]) => [k, reacts.filter((r) => r.item_id === it.id && r.emoji === k).length]).filter(([, n]) => n > 0);
              const mineR = myReact(it.id);
              return (
                <div key={it.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderBottom: i < list.length - 1 ? `1px solid ${theme.hair}` : 'none', opacity: it.cid ? 0.7 : 1 }}>
                  <div role="button" aria-label={`Options for ${it.title}`} onClick={() => { if (!it.cid) { hapticTap(); setMenu(it.id); } }} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                    <WatchPoster src={it.poster} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                      <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[it.year, it.kind === 'show' ? 'Show' : 'Movie', it.watched_at ? (it.watched_by ? by('marked by', it.watched_by) : 'watched') : by('added by', it.added_by)].filter(Boolean).join(', ')}</div>
                      {counts.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                          {counts.map(([k, n]) => { const r = WATCH_REACT_BY[k]; return <span key={k} aria-label={`${r.l} ${n}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 22, padding: '0 7px', borderRadius: 11, background: mineR === k ? (theme.dark ? `${r.c}33` : `${r.c}1F`) : theme.rowBg, fontSize: 12, fontWeight: 700, color: theme.ink2 }}><LineGlyph k={r.g} size={14} color={r.c} />{n}</span>; })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div role="button" aria-label={it.watched_at ? `Move ${it.title} back to watch` : `Mark ${it.title} as watched`} onClick={() => !it.cid && mark(it)} className="zchat-press" style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: it.watched_at ? theme.coral : 'transparent', border: it.watched_at ? 'none' : `1.6px solid ${theme.muted2}`, boxSizing: 'border-box', color: it.watched_at ? '#FFFFFF' : theme.muted }}>
                    <Check size={18} strokeWidth={2.4} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {menuItem && (
        <ChatRowSheet title={menuItem.title} subtitle={[menuItem.year, menuItem.kind === 'show' ? 'Show' : 'Movie'].filter(Boolean).join(', ')} zIndex={120} onClose={() => setMenu(null)}
          avatar={<WatchPoster src={menuItem.poster} size={34} />}
          peek={(
            <div role="group" aria-label="React" style={{ display: 'flex', justifyContent: 'space-between', gap: 4, padding: '4px 4px 10px' }}>
              {WATCH_REACTS.map(([k, g, l, c]) => (
                <div key={k} role="button" aria-label={l} aria-pressed={myReact(menuItem.id) === k} onClick={() => { react(menuItem, k); setMenu(null); }} className="zchat-press" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '8px 0', borderRadius: 14, cursor: 'pointer', background: myReact(menuItem.id) === k ? (theme.dark ? `${c}33` : `${c}1F`) : 'transparent' }}>
                  <LineGlyph k={g} size={24} color={c} /><span style={{ fontSize: 11.5, fontWeight: 600, color: theme.ink2 }}>{l}</span>
                </div>
              ))}
            </div>
          )}
          actions={[
            { label: 'Watch together', hint: youtubeIdOf(menuItem.link || '') ? 'Start a watch party with the link' : 'Pick a YouTube link to watch', icon: <WatchIcon size={20} />, onClick: () => together(menuItem) },
            menuItem.link ? { label: 'Open the link', icon: <LinkIcon size={20} />, onClick: () => { try { window.open(menuItem.link, '_blank', 'noopener,noreferrer'); } catch {} } } : null,
            { label: menuItem.watched_at ? 'Move back to watch' : 'Mark as watched', icon: <Check size={20} />, onClick: () => mark(menuItem) },
            menuItem.added_by === myId || chatKey.indexOf('g:') === 0 ? { label: 'Remove from the list', icon: <Trash2 size={20} />, danger: true, onClick: () => remove(menuItem) } : null,
          ]} />
      )}
    </FullPage>
  );
}

export function WatchComposerSheet({ links, onSend, onClose, initialTitle = '', onOpenList = null }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [title, setTitle] = useState(initialTitle || '');
  const [busy, setBusy] = useState(false);
  const vid = youtubeIdOf(text);
  const recent = (links || []).map((u) => ({ u, v: youtubeIdOf(u) })).filter((x) => x.v).slice(0, 6);
  const go = async (v) => {
    if (!v || busy) return;
    setBusy(true);
    const ok = await onSend({ v, t: title.trim().slice(0, 80) || '', at: new Date().toISOString() });
    if (!ok) setBusy(false);
  };
  return (
    <FullPage title="Watch together" onBack={onClose} zIndex={96} footer={<BigButton label={busy ? 'Starting' : 'Start watch party'} disabled={!vid || busy} onClick={() => go(vid)} />}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 6px', color: '#FF3B30' }}><WatchIcon size={44} /></div>
      <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '0 8px 12px', textWrap: 'balance' }}>Paste a YouTube link. When anyone plays, pauses or skips, it happens for everyone watching.</div>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a YouTube link" aria-label="YouTube link" autoCapitalize="none" style={inputStyle(theme)} />
      {text && !vid && <div style={{ fontSize: 12.5, color: theme.danger, padding: '6px 2px 0', fontWeight: 700 }}>That does not look like a YouTube link</div>}
      {vid && (
        <div style={{ marginTop: 12, borderRadius: 14, overflow: 'hidden', aspectRatio: '16 / 9', background: '#000' }}>
          <img src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}
      <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Give it a name (optional)" aria-label="Watch party name" style={{ ...inputStyle(theme), marginTop: 12 }} />
      {initialTitle && !vid && <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', lineHeight: 1.45 }}>{`Paste a YouTube link for ${initialTitle}, like the trailer, to watch it together.`}</div>}
      {onOpenList && <div role="button" aria-label="Open the watch list" onClick={onOpenList} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, marginTop: 10, cursor: 'pointer' }}><ListIconPf /><span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>Pick from your watch list</span><ChevronRight size={18} color={theme.muted} /></div>}
      {recent.length > 0 && (
        <>
          <IgHeading>From this chat</IgHeading>
          {recent.map((x) => (
            <div key={x.u} role="button" aria-label="Use this video" onClick={() => setText(x.u)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 2px', cursor: 'pointer' }}>
              <img src={`https://i.ytimg.com/vi/${x.v}/default.jpg`} alt="" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} style={{ width: 72, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: theme.rowBg }} />
              <span style={{ fontSize: 13, color: theme.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{x.u}</span>
            </div>
          ))}
        </>
      )}
    </FullPage>
  );
}
function liveInvite(uid) {
  if (((liveRt.live && liveRt.live.speakers) || []).length >= 3) { appSnack('Up to 3 people can speak at once'); return; }
  liveRt.invited.add(uid);
  liveSig({ k: 'invite', to: uid });
  hapticTap();
  appSnack(`Invited ${liveFirst(liveWho(uid).n)} to speak`);
}
function liveUnspeak(uid) {
  liveMod('speaker_remove', uid);
  liveSig({ k: 'unspeak', to: uid });
  liveHostDropSpeaker(uid);
  if (liveRt.pcs.has(uid)) liveHostConnect(uid, false);
}
function liveMuteSpeaker(uid, on) {
  if (on) liveRt.spkMuted.add(uid); else liveRt.spkMuted.delete(uid);
  const m = liveRt.mixer;
  const s = m && m.spk.get(uid);
  if (s) { try { s.gain.gain.value = on ? 0 : 1; } catch {} }
  if (on) liveRt.talking.delete(uid);
  liveSig({ k: 'smute', to: uid, on: !!on });
  hapticTap();
  liveEmit();
}
async function liveAcceptInvite() {
  if (!liveRt.invite || liveRt.role !== 'listener') return;
  liveRt.invite = null;
  liveEmit();
  if (liveCallHub.callOn) { appSnack('Finish your call first, then speak'); liveSig({ k: 'nospeak' }); return; }
  talkMeterPrime();
  let mic = null;
  try { mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); } catch {}
  if (!mic) { appSnack('Allow microphone access to speak'); liveSig({ k: 'nospeak' }); return; }
  if (liveRt.role !== 'listener' || liveRt.status === 'ended') { mic.getTracks().forEach((t) => t.stop()); return; }
  liveRt.mic = mic;
  liveRt.speaking = true;
  liveRt.myMuted = false;
  liveRt.hostMutedMe = false;
  liveCallHub.liveBusy = true;
  talkMeterStart(mic, liveSetTalking);
  liveSig({ k: 'speak' });
  hapticTap();
  liveEmit();
}
function liveDeclineInvite() {
  if (!liveRt.invite) return;
  liveRt.invite = null;
  liveSig({ k: 'nospeak' });
  liveEmit();
}
function liveToggleMyMic() {
  if (!liveRt.mic) return;
  if (liveRt.role === 'listener' && liveRt.hostMutedMe && liveRt.myMuted) { appSnack('The host muted your mic'); return; }
  const next = !liveRt.myMuted;
  liveRt.mic.getAudioTracks().forEach((t) => { t.enabled = !next; });
  liveRt.myMuted = next;
  if (next) liveSetTalking(false);
  hapticTap();
  liveEmit();
}
async function liveSendComment(text) {
  const body = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!body || !liveRt.id || liveRt.id === 'pending' || !liveRt.me) return false;
  if (blockedByRestriction('chat')) return false;
  const cid = liveCid();
  liveRt.comments = [...liveRt.comments, { id: cid, cid, u: liveRt.me.id, body, at: Date.now(), pending: true }].slice(-60);
  liveEmit();
  const { data, error } = await Promise.resolve(supabase.rpc('zchat_live_comment', { p_live: liveRt.id, p_body: body, p_cid: cid })).catch(() => ({ data: null, error: { message: 'network' } }));
  if (error || !data || data.ok === false) {
    liveRt.comments = liveRt.comments.filter((c) => c.cid !== cid);
    liveEmit();
    const why = data && data.reason;
    if (why === 'muted') { liveRt.ban = 'mute'; liveEmit(); }
    if (why === 'off' && liveRt.live) { liveRt.live = { ...liveRt.live, comments_on: false }; liveEmit(); }
    appSnack(why === 'off' ? 'The host turned comments off' : why === 'muted' ? 'The host muted your comments' : why === 'slow' ? 'Slow down a little' : why === 'ended' ? 'This live has ended' : why === 'paused' ? 'Your comments are paused for now' : friendlyError(error, "Couldn't send that. Try again."));
    return false;
  }
  if (data.comment) liveAddComment(data.comment);
  return true;
}

function LiveAudio({ stream, muted }) {
  const ref = useRef(null);
  useCallMedia(ref, stream, !!muted);
  return <audio ref={ref} data-zchat-call-audio="1" autoPlay playsInline />;
}
function LiveFace({ uid, size, talking, muted, label, ring = '#0B0A10' }) {
  const w = liveWho(uid);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', borderRadius: '50%', boxShadow: talking ? '0 0 0 3px #2EDB6B, 0 0 24px rgba(46,219,107,0.45)' : `0 0 0 3px ${ring}`, transition: reducedMotion() ? 'none' : 'box-shadow 150ms ease-out' }}>
        <Avatar emoji={w.a} name={w.n} size={size} />
        {muted && <span aria-label="Muted" style={{ position: 'absolute', right: 0, bottom: 0, width: Math.max(20, Math.round(size * 0.3)), height: Math.max(20, Math.round(size * 0.3)), borderRadius: '50%', background: '#2A2A30', border: `2px solid ${ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}><MicOff size={Math.max(11, Math.round(size * 0.14))} color="#FF6B6B" /></span>}
      </div>
      {label && <div style={{ fontSize: 12.5, fontWeight: 700, maxWidth: size + 24, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: talking ? '#7CF2A6' : '#FFFFFF' }}>{label}</div>}
    </div>
  );
}
function LiveTimer({ from }) {
  const [, setT] = useState(0);
  useEffect(() => { const iv = setInterval(() => setT((n) => n + 1), 1000); return () => clearInterval(iv); }, []);
  return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCallDuration(Date.now() - (from || Date.now()))}</span>;
}
export function LiveStartPage({ me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [later, setLater] = useState(false);
  const lp = useLivePlans();
  const next = lp.missing ? null : lp.list.find((p) => p.host_id === me.id && p.kind === 'live' && !p.pending && livePlanLive(p) && Date.parse(p.starts_at) - Date.now() < 3 * 3600000) || null;
  const go = async () => {
    if (busy) return;
    setBusy(true);
    const ok = await liveStart(title.trim() || `${liveFirst(me.name)}'s live`, me);
    if (!ok) setBusy(false);
  };
  const goPlan = async () => {
    if (busy || !next) return;
    setBusy(true);
    const ok = await livePlanStartLive(next, me);
    if (!ok) setBusy(false);
  };
  if (later) return <LivePlanPage kind="live" me={me} onClose={() => setLater(false)} onDone={() => { setLater(false); onClose(); }} />;
  return (
    <FullPage title="Go live" onBack={onClose} zIndex={640} footer={<BigButton label={busy ? 'Starting' : 'Go live'} disabled={busy} onClick={go} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 8px 6px' }}>
        <LiveRingAvatar profile={me} size={96} />
        <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, textAlign: 'center', padding: '22px 6px 14px', maxWidth: 330, textWrap: 'balance' }}>Talk while your followers listen, comment and send coins. They get one notification when you start.</div>
      </div>
      {next && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px 10px 12px', marginBottom: 12, borderRadius: 16, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
          <LivePlanThumb plan={next} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{next.title}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Scheduled for {liveWhenLow(Date.parse(next.starts_at))}</div>
          </div>
          <div role="button" aria-label={`Start ${next.title}`} onClick={goPlan} className="zchat-press" style={{ height: 34, padding: '0 14px', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1, flexShrink: 0 }}>Start it</div>
        </div>
      )}
      <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} placeholder="What are you talking about?" aria-label="Live title" enterKeyHint="go" autoComplete="off" style={inputStyle(theme)} />
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 0' }}>Up to {LIVE_MAX_LISTENERS} people can listen at once. You can invite up to 3 of them to talk with you.</div>
      {!lp.missing && (
        <div style={{ margin: '18px -16px 0', borderTop: `1px solid ${theme.border}` }}>
          <IgRow icon={<CalendarIcon />} label="Schedule for later" sub="Pick a time, and your followers can ask for a reminder" onClick={() => { if (!busy) { hapticTap(); setLater(true); } }} />
        </div>
      )}
    </FullPage>
  );
}
function LivePeopleSheet({ people, speakers, muted, onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(80vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', color: theme.ink }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ padding: '10px 20px 12px', fontSize: 15, fontWeight: 800, borderBottom: `1px solid ${theme.border}` }}>{people.length === 1 ? '1 person listening' : `${people.length} people listening`}</div>
        </div>
        <div role="list" aria-label="Listening" data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', paddingTop: 4 }}>
          {!people.length && <div style={{ padding: '22px 20px 18px', fontSize: 14, color: theme.muted, lineHeight: 1.5 }}>Nobody is listening yet. People who follow you got a notification.</div>}
          {people.map((p) => {
            const w = liveWho(p.u);
            const hint = speakers.includes(p.u) ? 'Speaking' : muted.has(p.u) ? 'Comments muted' : null;
            return (
              <div key={p.u} role="listitem" aria-label={`Options for ${w.n}`} onClick={() => { onClose(); onPick(p.u); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 20px', cursor: 'pointer', boxSizing: 'border-box' }}>
                <Avatar emoji={w.a} name={w.n} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.n}</div>
                  {hint && <div style={{ fontSize: 12.5, color: theme.muted }}>{hint}</div>}
                </div>
                <MoreDotsIcon size={20} color={theme.muted} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function LiveCommentList({ comments, onPick, pinned, onUnpin, isHost, max = '46%' }) {
  const ref = useRef(null);
  const stick = useRef(true);
  const last = comments.length ? comments[comments.length - 1].id : '';
  useLayoutEffect(() => { const el = ref.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [comments.length, last, max]);
  return (
    <div style={{ position: 'relative', zIndex: 2, flex: '0 1 auto', maxHeight: max, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {pinned && (
        <div role="note" aria-label="Pinned comment" className="zchat-fade" style={{ margin: '4px 14px 6px', padding: '9px 10px 9px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'flex-start', gap: 9, flexShrink: 0 }}>
          <Pin size={14} color="#C9BCFF" style={{ marginTop: 3, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.4, wordBreak: 'break-word' }}><b style={{ fontWeight: 800 }}>{liveFirst(pinned.name)}</b> {pinned.body}</div>
          {isHost && <div role="button" aria-label="Unpin comment" onClick={onUnpin} style={{ display: 'flex', padding: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><X size={16} /></div>}
        </div>
      )}
      <div ref={ref} role="list" aria-label="Comments" onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }} style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '18px 14px 6px', WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 30px)', maskImage: 'linear-gradient(180deg, transparent 0, #000 30px)' }}>
        {!comments.length && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', padding: '0 2px 6px' }}>Comments show up here</div>}
        {comments.map((c) => {
          const w = c.who && c.who.name ? { n: c.who.name, a: c.who.avatar } : liveWho(c.u);
          const tap = onPick && !c.gift && !c.pending;
          return (
            <div key={c.id} role="listitem" aria-label={tap ? `Comment from ${w.n}` : undefined} onClick={tap ? () => onPick(c) : undefined} className="zchat-fade"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '5px 0', cursor: tap ? 'pointer' : 'default', opacity: c.pending ? 0.7 : 1, flexShrink: 0 }}>
              <Avatar emoji={w.a} name={w.n} size={28} />
              <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, lineHeight: 1.4, wordBreak: 'break-word', paddingTop: 4 }}>
                <b style={{ fontWeight: 800, marginRight: 6 }}>{liveFirst(w.n)}</b>
                {!c.gift && <CrMemberMark creator={(liveRt.live && liveRt.live.host_id) || liveRt.hostId} user={c.u} dark />}
                {c.gift ? <span className={reducedMotion() ? undefined : 'zchat-pop'} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#FFD86B', fontWeight: 700, verticalAlign: 'bottom' }}><CoinIcon size={16} />{`sent ${c.gift} ${c.gift === 1 ? 'coin' : 'coins'}`}</span> : <span data-zuser="" style={{ color: 'rgba(255,255,255,0.92)' }}>{c.body}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function LiveGiftBursts({ fx }) {
  if (!fx.length || reducedMotion()) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6, overflow: 'hidden' }}>
      {fx.map((f, i) => (
        <div key={f.id} className="zchat-react-float" style={{ position: 'absolute', left: `${78 - (i % 3) * 9}%`, bottom: 'calc(84px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <CoinIcon size={40} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#FFD86B', textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>+{f.amount}</span>
        </div>
      ))}
    </div>
  );
}

export function LivePage({ me }) {
  const rt = useLiveRt();
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [gift, setGift] = useState(false);
  const [askEnd, setAskEnd] = useState(false);
  const [pick, setPick] = useState(null);
  const [people, setPeople] = useState(false);
  const [tools, setTools] = useState(false);
  const [sheet, setSheet] = useState(null);
  const isHost = rt.role === 'host';
  const leave = () => { if (isHost) setAskEnd(true); else liveLeave(); };
  useBackClose(true, leave);
  const live = rt.live || {};
  const host = live.host || {};
  const hostId = live.host_id || rt.hostId;
  const mods = Array.isArray(live.mods) ? live.mods : [];
  const extras = Object.prototype.hasOwnProperty.call(live, 'qa_on');
  const isMod = extras && !isHost && mods.includes(me.id);
  const qaOn = extras && live.qa_on !== false;
  const poll = rt.pb ? rt.pb.poll : null;
  const pollArgs = { p_live: rt.id, p_group: null };
  const showingQ = rt.qs.find((q) => q.status === 'showing') || null;
  const myQ = rt.qs.find((q) => q.user_id === me.id && q.status === 'waiting') || null;
  const waitingQ = rt.qs.filter((q) => q.status === 'waiting').length;
  const pollBy = poll && poll.created_by && poll.created_by !== me.id ? liveWho(poll.created_by).n : null;
  const startPoll = (q, opts) => { if (rt.pb) rt.pb.start(pollArgs, q, opts); };
  const now = Date.now();
  const talking = (uid) => { const at = rt.talking.get(uid); return !!(at && at > now); };
  const speakers = Array.isArray(live.speakers) ? live.speakers : [];
  const listeners = rt.people.filter((p) => p.r !== 'host');
  const count = isHost ? listeners.length : Math.max(listeners.length, 1);
  const commentsOn = live.comments_on !== false;
  const status = rt.status;
  const callOn = liveCallHub.callOn;
  const mutedMe = rt.ban === 'mute';
  const short = typeof window !== 'undefined' && window.innerHeight < 700;
  const canType = status !== 'ended' && status !== 'starting' && (isHost || (commentsOn && !mutedMe));
  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    const ok = await liveSendComment(body);
    if (!ok) setText((t) => t || body);
  };
  const btn = { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF', WebkitTapHighlightColor: 'transparent', flexShrink: 0 };
  const pill = { height: 34, padding: '0 12px', borderRadius: 17, background: 'rgba(255,255,255,0.13)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, flexShrink: 0 };
  const endedView = !isHost && (status === 'ended' || status === 'full' || status === 'removed' || status === 'gone' || status === 'lost');
  const endText = status === 'ended' ? 'This live has ended' : status === 'full' ? 'This live is full' : status === 'removed' ? 'The host took you out of this live' : status === 'lost' ? "Couldn't reach the live" : 'This live is not available';
  const endSub = status === 'ended' ? `Thanks for listening to ${liveFirst(host.name)}.` : status === 'full' ? `Up to ${LIVE_MAX_LISTENERS} people can listen at once. Try again in a little while.` : status === 'lost' ? 'Check your connection and try again.' : status === 'removed' ? "You can't rejoin this one." : 'It may have ended, or it is only for their followers.';
  const retry = () => { const id = rt.id; liveLeave(); setTimeout(() => liveOpenById(id, me), 30); };
  const sub = isHost
    ? (status === 'starting' ? 'Getting your mic ready' : listeners.length ? `${listeners.length} listening` : 'Waiting for people to join')
    : status === 'connecting' ? `Connecting to ${liveFirst(host.name)}` : callOn ? 'Muted while you are on a call' : (host.name || '');
  const pickInfo = pick ? (() => {
    const w = liveWho(pick.u);
    return { w, f: liveFirst(w.n), isSpk: speakers.includes(pick.u), here: rt.people.some((p) => p.u === pick.u), self: pick.u === me.id };
  })() : null;
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 640, background: '#0B0A10', color: '#FFFFFF', fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 60% at 50% 0%, ${theme.coral}38, rgba(11,10,16,0) 70%)`, pointerEvents: 'none' }} />
        {!isHost && rt.remote && <LiveAudio stream={rt.remote} muted={callOn} />}
        {isHost && [...rt.spkStreams.entries()].map(([uid, s]) => <LiveAudio key={uid} stream={s} muted={rt.spkMuted.has(uid)} />)}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, padding: 'calc(10px + env(safe-area-inset-top)) 12px 0', flexShrink: 0 }}>
          <div role="button" aria-label={isHost ? 'End live' : 'Leave live'} onClick={leave} className="zchat-press" style={{ ...btn, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }}><X size={20} /></div>
          <div style={{ flex: 1 }} />
          {!endedView && (
            <div style={{ ...pill, background: status === 'live' ? theme.coral : 'rgba(255,255,255,0.13)' }}>
              <span className={status === 'live' && !reducedMotion() ? 'zchat-live-dot' : undefined} style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFFFFF' }} />
              {status === 'starting' ? 'Starting' : status === 'connecting' ? 'Connecting' : <>Live <LiveTimer from={rt.startedAt} /></>}
            </div>
          )}
          {!endedView && (isHost || isMod) && (qaOn || waitingQ > 0) && (
            <div role="button" aria-label={waitingQ ? `Questions, ${waitingQ} waiting` : 'Questions'} onClick={() => setSheet('qs')} className="zchat-press" style={{ ...pill, cursor: 'pointer', background: waitingQ ? 'rgba(255,255,255,0.24)' : pill.background }}><QuestionIcon size={16} />{waitingQ > 0 && waitingQ}</div>
          )}
          {!endedView && (
            <div role={isHost ? 'button' : undefined} aria-label={`${count} listening`} onClick={isHost ? () => setPeople(true) : undefined} className={isHost ? 'zchat-press' : undefined} style={{ ...pill, cursor: isHost ? 'pointer' : 'default' }}><Users size={15} />{count}</div>
          )}
        </div>
        {!endedView && rt.goal && <LiveGoalBar goal={rt.goal} isHost={isHost} onTap={() => setSheet('goalmenu')} />}
        {!endedView && <JoinBanners people={rt.people} myId={me && me.id} top="calc(58px + env(safe-area-inset-top))" />}
        {endedView ? (
          <div className="zchat-fade" style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px 12vh', textAlign: 'center' }}>
            <Avatar emoji={host.avatar} name={host.name || 'Host'} size={96} />
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 18 }}>{endText}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 6, lineHeight: 1.5, maxWidth: 300 }}>{endSub}</div>
            {status === 'ended' && <LiveEndedSupporters id={rt.id} initial={rt.endTop} />}
            <div style={{ display: 'flex', gap: 10, marginTop: 26 }}>
              {(status === 'full' || status === 'lost') && <div role="button" aria-label="Try again" onClick={retry} className="zchat-press" style={{ ...btn, height: 44, padding: '0 22px', borderRadius: 22, background: '#FFFFFF', color: '#0B0A10', fontWeight: 800, fontSize: 15 }}>Try again</div>}
              <div role="button" aria-label="Close" onClick={() => liveLeave()} className="zchat-press" style={{ ...btn, height: 44, padding: '0 22px', borderRadius: 22, background: 'rgba(255,255,255,0.14)', fontWeight: 800, fontSize: 15 }}>Close</div>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', zIndex: 2, flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 20px 10px', overflow: 'hidden' }}>
              <LiveFace uid={hostId} size={short ? 84 : 104} talking={talking(hostId) && !(isHost && rt.myMuted)} muted={isHost && rt.myMuted} />
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 14, textAlign: 'center', lineHeight: 1.25, maxWidth: '100%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{live.title || 'Live'}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3, minHeight: 18 }}>{sub}</div>
              {speakers.length > 0 && (
                <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
                  {speakers.map((uid) => {
                    const mine = uid === me.id;
                    const mutedSpk = isHost ? rt.spkMuted.has(uid) : mine ? rt.myMuted : false;
                    return (
                      <div key={uid} role={isHost ? 'button' : undefined} aria-label={isHost ? `Speaker ${liveWho(uid).n}` : undefined} onClick={isHost ? () => setPick({ u: uid }) : undefined} style={{ cursor: isHost ? 'pointer' : 'default' }}>
                        <LiveFace uid={uid} size={short ? 46 : 56} talking={talking(uid) && !mutedSpk} muted={mutedSpk} label={mine ? 'You' : liveFirst(liveWho(uid).n)} />
                      </div>
                    );
                  })}
                </div>
              )}
              {showingQ && <LiveQuestionOnScreen key={showingQ.id} q={showingQ} isHost={isHost} short={short} />}
            </div>
            <LiveCommentList comments={rt.comments} pinned={live.pinned || null} isHost={isHost} onUnpin={() => liveMod('unpin')} onPick={isHost ? (c) => setPick({ u: c.u, c }) : null} max={poll ? '30%' : '46%'} />
            {poll && <LivePollCard box={rt.pb} runner={isHost || isMod} by={pollBy} args={pollArgs} />}
            <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
              {canType ? (
                <input value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder="Say something" aria-label="Write a comment" enterKeyHint="send" autoComplete="off"
                  style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', color: '#FFFFFF', padding: '0 16px', fontSize: 15, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
              ) : (
                <div style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 22, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '0 16px', fontSize: 14, display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{status === 'starting' ? 'Comments open when you are live' : mutedMe ? 'The host muted your comments' : 'The host turned comments off'}</span></div>
              )}
              {canType && text.trim() && <div role="button" aria-label="Send comment" onClick={send} className="zchat-press" style={{ ...btn, width: 44, height: 44, borderRadius: '50%', background: theme.coral }}><Send size={18} /></div>}
              {(isHost || rt.speaking) && <div role="button" aria-label={rt.myMuted ? 'Unmute your mic' : 'Mute your mic'} onClick={liveToggleMyMic} className="zchat-press" style={{ ...btn, width: 44, height: 44, borderRadius: '50%', background: rt.myMuted ? '#FFFFFF' : 'rgba(255,255,255,0.13)', color: rt.myMuted ? '#0B0A10' : '#FFFFFF' }}>{rt.myMuted ? <MicOff size={19} /> : <Mic size={19} />}</div>}
              {!isHost && rt.speaking && <div role="button" aria-label="Stop speaking" onClick={() => liveStopSpeaking(true)} className="zchat-press" style={{ ...btn, height: 44, padding: '0 14px', borderRadius: 22, background: 'rgba(255,255,255,0.13)', fontSize: 13.5, fontWeight: 700 }}>Listen only</div>}
              {!isHost && !rt.speaking && qaOn && !mutedMe && status !== 'starting' && <div role="button" aria-label={myQ ? 'Your question is waiting' : 'Ask a question'} onClick={() => setSheet('ask')} className="zchat-press" style={{ ...btn, position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }}><QuestionIcon size={20} />{myQ && <span aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: '50%', background: theme.coral, boxShadow: '0 0 0 2px #0B0A10' }} />}</div>}
              {!isHost && !rt.speaking && <div role="button" aria-label="Send a gift" onClick={() => setGift(true)} className="zchat-press" style={{ ...btn, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }}><GiftIcon size={20} /></div>}
              {isMod && <div role="button" aria-label="Moderator tools" onClick={() => setSheet('modtools')} className="zchat-press" style={{ ...btn, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }}><ModShieldGlyph size={19} /></div>}
              {isHost && <div role="button" aria-label="Live settings" onClick={() => setTools(true)} className="zchat-press" style={{ ...btn, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.13)' }}><MoreDotsIcon size={20} /></div>}
            </div>
          </>
        )}
        <LiveGiftBursts fx={rt.fx} />
        {gift && !endedView && <LiveGiftSheet host={host} me={me} onClose={() => setGift(false)} />}
        {rt.invite && !isHost && !endedView && (
          <ChatRowSheet title={`${liveFirst(host.name)} invited you to speak`} subtitle="Everyone in the live will hear you" zIndex={32} avatar={<Avatar emoji={host.avatar} name={host.name || 'Host'} size={40} />} onClose={liveDeclineInvite}
            actions={[{ label: 'Speak', icon: <Mic size={19} />, keepOpen: true, onClick: () => liveAcceptInvite() }, { label: 'Not now', icon: <X size={19} />, keepOpen: true, onClick: () => liveDeclineInvite() }]} />
        )}
        {askEnd && <ConfirmDialog title="End your live?" body="Everyone listening will be told it has ended." confirmLabel="End live" layer={700} onCancel={() => setAskEnd(false)} onConfirm={() => { setAskEnd(false); liveEnd(); }} />}
        {tools && isHost && (
          <ChatRowSheet title="Live settings" zIndex={30} onClose={() => setTools(false)}
            actions={[
              !extras ? null : poll && poll.status === 'open' ? { label: 'End the poll', icon: <PollIcon size={19} />, onClick: () => rt.pb.end() } : { label: 'Start a poll', icon: <PollIcon size={19} />, onClick: () => setSheet('poll') },
              extras ? { label: rt.goal ? 'Change the gift goal' : 'Set a gift goal', icon: <GiftIcon size={19} />, onClick: () => setSheet('goal') } : null,
              rt.goal ? { label: 'End the gift goal', icon: <GiftIcon size={19} />, onClick: () => liveGoalEnd() } : null,
              { label: commentsOn ? 'Turn comments off' : 'Turn comments on', icon: <MessageSquare size={19} />, onClick: () => liveMod('comments', null, commentsOn ? 'off' : 'on') },
              extras ? { label: qaOn ? 'Turn questions off' : 'Turn questions on', icon: <QuestionIcon size={19} />, onClick: () => liveMod('questions', null, qaOn ? 'off' : 'on') } : null,
              { label: 'Who is listening', icon: <Users size={19} />, onClick: () => setPeople(true) },
              live.pinned ? { label: 'Unpin comment', icon: <Pin size={19} />, onClick: () => liveMod('unpin') } : null,
              { label: 'End live', icon: <X size={19} />, danger: true, onClick: () => setAskEnd(true) },
            ]} />
        )}
        {people && isHost && <LivePeopleSheet people={listeners} speakers={speakers} muted={rt.muted} onClose={() => setPeople(false)} onPick={(u) => setPick({ u })} />}
        {pickInfo && isHost && (
          <ChatRowSheet title={pickInfo.self ? 'Your comment' : pickInfo.w.n} subtitle={pick.c ? pick.c.body : pickInfo.isSpk ? 'Speaking' : 'Listening'} zIndex={31} avatar={<Avatar emoji={pickInfo.w.a} name={pickInfo.w.n} size={40} />} onClose={() => setPick(null)}
            actions={[
              pick.c ? (live.pinned && live.pinned.id === pick.c.id ? { label: 'Unpin comment', icon: <Pin size={19} />, onClick: () => liveMod('unpin') } : { label: 'Pin comment', icon: <Pin size={19} />, onClick: () => liveMod('pin', null, pick.c.id) }) : null,
              !pickInfo.self && pickInfo.isSpk ? { label: rt.spkMuted.has(pick.u) ? `Unmute ${pickInfo.f}` : `Mute ${pickInfo.f}`, icon: rt.spkMuted.has(pick.u) ? <Mic size={19} /> : <MicOff size={19} />, onClick: () => liveMuteSpeaker(pick.u, !rt.spkMuted.has(pick.u)) } : null,
              !pickInfo.self && pickInfo.isSpk ? { label: `Move ${pickInfo.f} back to listening`, icon: <Users size={19} />, onClick: () => liveUnspeak(pick.u) } : null,
              !pickInfo.self && !pickInfo.isSpk && pickInfo.here && speakers.length < 3 ? { label: `Invite ${pickInfo.f} to speak`, icon: <Mic size={19} />, onClick: () => liveInvite(pick.u) } : null,
              pickInfo.self ? null : rt.muted.has(pick.u) ? { label: `Let ${pickInfo.f} comment`, icon: <MessageSquare size={19} />, onClick: () => liveMod('unmute', pick.u) } : { label: `Mute ${pickInfo.f}'s comments`, icon: <MessageSquare size={19} />, onClick: () => liveMod('mute', pick.u) },
              pickInfo.self || !extras ? null : mods.includes(pick.u) ? { label: `Remove ${pickInfo.f} as moderator`, icon: <ModShieldGlyph size={19} />, onClick: () => liveMod('mod_remove', pick.u) } : pickInfo.here ? { label: `Make ${pickInfo.f} a moderator`, hint: 'They can run polls and take down questions', icon: <ModShieldGlyph size={19} />, onClick: () => liveMod('mod_add', pick.u) } : null,
              pickInfo.self ? null : { label: `Take ${pickInfo.f} out of the live`, icon: <X size={19} />, danger: true, onClick: () => liveMod('remove', pick.u) },
            ]} />
        )}
        {sheet === 'modtools' && isMod && (
          <ChatRowSheet title="Moderator tools" subtitle={`You help ${liveFirst(host.name)} run this live`} zIndex={30} onClose={() => setSheet(null)}
            actions={[
              poll && poll.status === 'open' ? { label: 'End the poll', icon: <PollIcon size={19} />, onClick: () => rt.pb.end() } : { label: 'Start a poll', icon: <PollIcon size={19} />, onClick: () => setSheet('poll') },
              { label: waitingQ ? `Questions, ${waitingQ} waiting` : 'Questions', icon: <QuestionIcon size={19} />, onClick: () => setSheet('qs') },
            ]} />
        )}
        {sheet === 'goalmenu' && isHost && rt.goal && (
          <ChatRowSheet title={rt.goal.title} subtitle={`${(Number(rt.goal.progress) || 0).toLocaleString('en-US')} of ${coinsText(Number(rt.goal.target) || 0)}`} zIndex={30} onClose={() => setSheet(null)}
            actions={[
              { label: 'Set a new goal', icon: <GiftIcon size={19} />, onClick: () => setSheet('goal') },
              { label: 'End this goal', icon: <X size={19} />, danger: true, onClick: () => liveGoalEnd() },
            ]} />
        )}
        {sheet === 'poll' && (isHost || isMod) && !endedView && <LivePollSheet onStart={startPoll} onClose={() => setSheet(null)} />}
        {sheet === 'goal' && isHost && <LiveGoalSheet goal={rt.goal} onClose={() => setSheet(null)} />}
        {sheet === 'ask' && !isHost && !endedView && <LiveAskSheet host={host} onClose={() => setSheet(null)} />}
        {sheet === 'qs' && (isHost || isMod) && !endedView && <LiveQuestionsSheet isHost={isHost} onClose={() => setSheet(null)} />}
        {rt.goalFx > 0 && prefOn('zchat-effects') && !reducedMotion() && <ScreenEffect key={rt.goalFx} kind="confetti" onDone={() => { liveRt.goalFx = 0; liveEmit(); }} />}
      </div>
    </Portal>
  );
}
export function LiveSummaryPage({ s, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const rows = [
    ['Time live', formatCallDuration(s.secs * 1000)],
    ['People who listened', String(s.listeners)],
    ['Most at once', String(s.peak)],
    ['Comments', String(s.comments)],
    ['Coins from gifts', s.coins.toLocaleString('en-US')],
  ];
  return (
    <FullPage title="Your live ended" onBack={onClose} zIndex={640} footer={<BigButton label="Done" onClick={onClose} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 8px 18px' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.accentSoft || theme.soft, color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LiveMicGlyph size={34} /></div>
        <div style={{ fontSize: 15, color: theme.muted, marginTop: 12, textAlign: 'center' }}>Here is how it went.</div>
      </div>
      <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        {rows.map(([l, v], i) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', minHeight: 52, padding: '0 16px', borderTop: i ? `1px solid ${theme.border}` : 'none' }}>
            <span style={{ flex: 1, fontSize: 15, color: theme.ink }}>{l}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: theme.ink, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 6 }}>{l === 'Coins from gifts' && <CoinIcon size={17} />}{s.pending && l !== 'Time live' ? <Spinner size={14} color={theme.muted} /> : v}</span>
          </div>
        ))}
      </div>
      {s.id && <LiveSupportersBlock id={s.id} initial={s.top} />}
    </FullPage>
  );
}

export function LivePollSheet({ onStart, onClose, zIndex = 30 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const tidy = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const clean = opts.map(tidy).filter(Boolean);
  const uniq = new Set(clean.map((o) => o.toLowerCase()));
  const ok = !!tidy(q) && clean.length >= 2 && uniq.size === clean.length;
  const go = () => { if (!ok) return; onClose(); onStart(tidy(q).slice(0, 140), clean.map((o) => o.slice(0, 60))); };
  const field = { ...inputStyle(theme), padding: '12px 14px' };
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(88vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', color: theme.ink, paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ padding: '8px 20px 2px', fontSize: 16, fontWeight: 800 }}>Start a poll</div>
          <div style={{ padding: '0 20px 12px', fontSize: 13, color: theme.muted }}>Everyone here can vote once. You see the votes as they come in.</div>
        </div>
        <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, padding: '0 16px', WebkitOverflowScrolling: 'touch' }}>
          <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 140))} placeholder="Ask something" aria-label="Poll question" enterKeyHint="next" autoComplete="off" style={{ ...field, fontWeight: 600 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {opts.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input value={o} onChange={(e) => { const v = e.target.value.slice(0, 60); setOpts((l) => l.map((x, j) => (j === i ? v : x))); }} placeholder={`Option ${i + 1}`} aria-label={`Option ${i + 1}`} enterKeyHint={i === opts.length - 1 ? 'done' : 'next'} autoComplete="off" style={{ ...field, flex: 1, minWidth: 0 }} />
                {opts.length > 2 && <div role="button" aria-label={`Remove option ${i + 1}`} onClick={() => { hapticTap(); setOpts((l) => l.filter((x, j) => j !== i)); }} style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>}
              </div>
            ))}
          </div>
          {opts.length < 4 && (
            <div role="button" aria-label="Add an option" onClick={() => { hapticTap(); setOpts((l) => [...l, '']); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 46, marginTop: 4, padding: '0 4px', color: theme.coral, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}><Plus size={19} />Add an option</div>
          )}
          {clean.length >= 2 && uniq.size !== clean.length && <div style={{ fontSize: 12.5, color: theme.danger, padding: '2px 4px 0' }}>Two options are the same</div>}
        </div>
        <div style={{ padding: '12px 16px 0', flexShrink: 0 }}><BigButton label="Start poll" disabled={!ok} onClick={go} /></div>
      </div>
    </div>
  );
}
async function liveAsk(body) {
  const id = liveRt.id;
  const me = liveRt.me;
  const text = String(body || '').replace(/\s+/g, ' ').trim().slice(0, 200);
  if (!id || id === 'pending' || !me || !text) return false;
  if (blockedByRestriction('chat')) return false;
  const cid = liveCid();
  const before = liveRt.askAt;
  liveRt.qs = [...liveRt.qs, { id: cid, client_id: cid, live_id: id, user_id: me.id, body: text, status: 'waiting', created_at: new Date().toISOString(), pending: true }];
  liveRt.askAt = Date.now();
  hapticTap();
  playUiSound('send');
  liveEmit();
  const { data, error } = await liveRpc('zchat_live_ask', { p_live: id, p_body: text, p_cid: cid });
  if (liveRt.id !== id) return false;
  if (error || !data || data.ok === false) {
    liveRt.qs = liveRt.qs.filter((q) => q.client_id !== cid);
    const why = data && data.reason;
    const wait = Math.max(1, Math.min(60, Number(data && data.wait) || 30));
    liveRt.askAt = why === 'slow' ? Date.now() - (30 - wait) * 1000 : before;
    if (why === 'off' && liveRt.live) liveRt.live = { ...liveRt.live, qa_on: false };
    if (why === 'muted' && !liveRt.ban) liveRt.ban = 'mute';
    liveEmit();
    appSnack(why === 'slow' ? `You can ask again in ${wait} ${wait === 1 ? 'second' : 'seconds'}` : why === 'waiting' ? 'Your last question is still waiting' : why === 'off' ? 'Questions are off right now' : why === 'muted' ? 'The host muted you in this live' : why === 'ended' ? 'This live has ended' : why === 'paused' ? 'Your messages are paused for now' : rpcMissing(error) ? 'Questions switch on once the latest ZChat setup is finished.' : friendlyError(error, "Couldn't send your question. Try again."));
    return false;
  }
  if (data.question) liveQMerge(data.question);
  return true;
}
async function liveQSet(q, action) {
  const id = liveRt.id;
  if (!q || !id || q.pending) return;
  const before = liveRt.qs;
  const at = Date.now();
  const want = action === 'show' ? 'showing' : action === 'done' ? 'answered' : 'removed';
  if (action === 'remove' && liveRt.me && q.user_id === liveRt.me.id) liveRt.qBack.add(String(q.id));
  liveRt.qs = liveRt.qs.map((x) => {
    if (String(x.id) === String(q.id)) return { ...x, status: want, want, wantAt: at, answered_at: want === 'answered' ? new Date().toISOString() : x.answered_at };
    if (action === 'show' && x.status === 'showing') return { ...x, status: 'answered', want: 'answered', wantAt: at, answered_at: new Date().toISOString() };
    return x;
  }).filter((x) => x.status !== 'removed');
  hapticTap();
  liveEmit();
  const { data, error } = await liveRpc('zchat_live_question_set', { p_question: q.id, p_action: action });
  if (liveRt.id !== id) return;
  if (error || !data || data.ok === false) {
    liveRt.qs = before;
    liveEmit();
    appSnack(data && data.reason === 'state' ? 'Someone already took care of that question' : friendlyError(error, "Couldn't change that question. Try again."));
    if (data && data.question) liveQMerge(data.question);
    return;
  }
  if (data.question) liveQMerge(data.question);
}
function LiveQuestionOnScreen({ q, isHost, short }) {
  const w = q.who && q.who.name ? { n: q.who.name, a: q.who.avatar } : liveWho(q.user_id);
  liveFxCss();
  return (
    <div role="note" aria-label={`Question from ${w.n}`} className="zlv-up" style={{ width: '100%', maxWidth: 420, marginTop: short ? 10 : 16, padding: '11px 14px 13px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', boxSizing: 'border-box', textAlign: 'left', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar emoji={w.a} name={w.n} size={24} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveFirst(w.n)} asks</span>
        {isHost && <div role="button" aria-label="Done with this question" onClick={() => liveQSet(q, 'done')} className="zchat-press" style={{ height: 30, padding: '0 13px', borderRadius: 15, background: '#FFFFFF', color: '#0B0A10', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>Done</div>}
      </div>
      <div data-zuser="" style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.35, marginTop: 7, wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: short ? 3 : 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.body}</div>
    </div>
  );
}
export function LiveAskSheet({ host, onClose }) {
  useBackClose(true, onClose);
  const rt = useLiveRt();
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [text, setText] = useState('');
  const now = useNow(1000);
  const me = rt.me && rt.me.id;
  const mine = rt.qs.filter((q) => q.user_id === me);
  const cur = mine.find((q) => q.status === 'showing') || mine.find((q) => q.status === 'waiting') || null;
  const left = rt.askAt ? Math.max(0, 30 - Math.floor((now - rt.askAt) / 1000)) : 0;
  const hostFirst = liveFirst(host && host.name);
  const send = () => { const b = text.trim(); if (!b || cur || left > 0) return; onClose(); liveAsk(b); };
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', color: theme.ink }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ padding: '8px 20px 2px', fontSize: 16, fontWeight: 800 }}>Ask {hostFirst} a question</div>
        <div style={{ padding: '0 20px 12px', fontSize: 13, color: theme.muted, lineHeight: 1.45 }}>{hostFirst} picks which ones to answer. You can have one question waiting at a time.</div>
        {cur ? (
          <div style={{ margin: '0 16px', padding: '12px 14px', borderRadius: 14, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 12.5, color: cur.status === 'showing' ? theme.coral : theme.muted, fontWeight: 700 }}>{cur.status === 'showing' ? `${hostFirst} is answering it now` : cur.pending ? 'Sending' : `Waiting for ${hostFirst}`}</div>
            <div data-zuser="" style={{ fontSize: 15, marginTop: 4, lineHeight: 1.4, wordBreak: 'break-word' }}>{cur.body}</div>
            {cur.status === 'waiting' && !cur.pending && <div role="button" aria-label="Take it back" onClick={() => liveQSet(cur, 'remove')} style={{ display: 'inline-block', marginTop: 10, color: theme.danger, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Take it back</div>}
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} rows={3} placeholder={`What do you want to ask ${hostFirst}?`} aria-label="Your question" enterKeyHint="send"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} style={{ ...inputStyle(theme), resize: 'none', lineHeight: 1.45, fontSize: 16, minHeight: 92 }} />
            {text.length > 170 && <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', marginTop: 4 }}>{200 - text.length} left</div>}
            <div style={{ height: 10 }} />
            <BigButton label={left > 0 ? `You can ask again in ${left} ${left === 1 ? 'second' : 'seconds'}` : 'Send question'} disabled={!text.trim() || left > 0} onClick={send} />
          </div>
        )}
      </div>
    </div>
  );
}
export function LiveQuestionsSheet({ isHost, onClose }) {
  useBackClose(true, onClose);
  const rt = useLiveRt();
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  useEffect(() => { liveQLoad(); }, []);
  const rank = { showing: 0, waiting: 1, answered: 2 };
  const list = rt.qs.filter((q) => q.status !== 'removed').slice().sort((a, b) => ((rank[a.status] ?? 3) - (rank[b.status] ?? 3)) || (a.status === 'answered' ? Date.parse(b.answered_at || b.created_at) - Date.parse(a.answered_at || a.created_at) : Date.parse(a.created_at) - Date.parse(b.created_at)));
  const waiting = list.filter((q) => q.status === 'waiting').length;
  const qaOn = !rt.live || rt.live.qa_on !== false;
  const pillBtn = (label, onClick, primary) => <div role="button" aria-label={label} onClick={onClick} className="zchat-press" style={{ height: 32, padding: '0 14px', borderRadius: 9, background: primary ? theme.coral : theme.soft, color: primary ? '#FFFFFF' : theme.ink, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>{label}</div>;
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(82vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', color: theme.ink }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0, borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ padding: '10px 20px 12px' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Questions</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{!qaOn ? 'Questions are off. Turn them on in Live settings.' : waiting ? `${waiting} waiting` : 'Nothing waiting right now'}</div>
          </div>
        </div>
        <div role="list" aria-label="Questions" data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', paddingTop: 4 }}>
          {!list.length && <div style={{ padding: '22px 20px 18px', fontSize: 14, color: theme.muted, lineHeight: 1.5 }}>No questions yet. People can send one with the question button next to the comment box.</div>}
          {list.map((q) => {
            const w = q.who && q.who.name ? { n: q.who.name, a: q.who.avatar } : liveWho(q.user_id);
            const done = q.status === 'answered';
            return (
              <div key={q.id} role="listitem" aria-label={`Question from ${w.n}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 20px' }}>
                <div style={{ opacity: done ? 0.55 : 1, flexShrink: 0 }}><Avatar emoji={w.a} name={w.n} size={36} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: theme.muted, fontWeight: 600 }}>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{w.n}</span>
                    <span style={{ flexShrink: 0 }}>{shortAgo(q.created_at)}</span>
                    {q.status === 'showing' && <span style={{ color: theme.coral, fontWeight: 700, flexShrink: 0 }}>On screen</span>}
                    {done && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}><Check size={13} strokeWidth={3} />Answered</span>}
                  </div>
                  <div data-zuser="" style={{ fontSize: 15, lineHeight: 1.4, wordBreak: 'break-word', marginTop: 2, color: done ? theme.muted : theme.ink }}>{q.body}</div>
                  {!done && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                      {isHost && q.status === 'waiting' && pillBtn('Answer', () => { onClose(); liveQSet(q, 'show'); }, true)}
                      {isHost && q.status === 'showing' && pillBtn('Done', () => liveQSet(q, 'done'), true)}
                      {pillBtn('Remove', () => liveQSet(q, 'remove'), false)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
async function liveGoalSet(title, target) {
  const id = liveRt.id;
  if (!id || id === 'pending' || liveRt.role !== 'host' || !liveRt.me) return false;
  const before = liveRt.goal;
  liveRt.goal = { id: liveCid(), live_id: id, host_id: liveRt.me.id, title, target, progress: 0, status: 'active', created_at: new Date().toISOString(), pending: true };
  hapticTap();
  liveEmit();
  const { data, error } = await liveRpc('zchat_live_goal_set', { p_live: id, p_title: title, p_target: target });
  if (liveRt.id !== id) return false;
  if (error || !data || data.ok === false || !data.goal) {
    if (liveRt.goal && liveRt.goal.pending) liveRt.goal = before;
    liveEmit();
    const why = data && data.reason;
    appSnack(why === 'target' ? 'Pick a goal from 10 to 100,000 coins' : why === 'slow' ? 'Give it a moment, then try again' : why === 'busy' ? 'That is a lot of goals for one live' : rpcMissing(error) ? 'Gift goals switch on once the latest ZChat setup is finished.' : friendlyError(error, "Couldn't set the goal. Try again."));
    return false;
  }
  if (liveRt.goal && liveRt.goal.pending) liveRt.goal = null;
  liveGoalApply(data.goal);
  return true;
}
async function liveGoalEnd() {
  const id = liveRt.id;
  const before = liveRt.goal;
  if (!id || !before || before.pending) return;
  liveRt.goal = null;
  hapticTap();
  liveEmit();
  const { data, error } = await liveRpc('zchat_live_goal_end', { p_live: id });
  if (liveRt.id !== id) return;
  if (error || !data || data.ok === false) {
    if (!liveRt.goal) liveRt.goal = before;
    liveEmit();
    appSnack(friendlyError(error, "Couldn't end the goal. Try again."));
  }
}
function LiveGoalBar({ goal, isHost, onTap }) {
  const rt = useLiveRt();
  liveFxCss();
  const floor = rt.goalFloor && String(rt.goalFloor.id) === String(goal.id) && rt.goalFloor.until > Date.now() ? rt.goalFloor.v : 0;
  const got = Math.max(Number(goal.progress) || 0, floor);
  const target = Math.max(1, Number(goal.target) || 1);
  const pct = Math.min(100, (got / target) * 100);
  const reached = goal.status === 'reached' || got >= target;
  const label = `${got.toLocaleString('en-US')} of ${target.toLocaleString('en-US')}`;
  return (
    <div role={isHost ? 'button' : 'group'} aria-label={isHost ? `Gift goal ${goal.title}, ${label} coins` : `Gift goal ${goal.title}, ${label} coins`} onClick={isHost ? onTap : undefined} className={rt.goalFx ? 'zlv-cheer' : 'zchat-fade'}
      style={{ position: 'relative', zIndex: 3, margin: '10px 14px 0', padding: '8px 12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', cursor: isHost ? 'pointer' : 'default', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700 }}>
        <GiftIcon size={14} color="#FFD86B" />
        <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{goal.title}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: reached ? '#FFD86B' : 'rgba(255,255,255,0.72)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{reached ? <><Check size={13} strokeWidth={3} />Goal reached</> : <><CoinIcon size={13} />{label}</>}</span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(got, target)} aria-label="Goal progress" style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.14)', marginTop: 7, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: '#FFD86B', transition: reducedMotion() ? 'none' : 'width 420ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
      </div>
    </div>
  );
}
const LIVE_GOAL_PICKS = [500, 1000, 2000, 5000];
export function LiveGoalSheet({ goal, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('1000');
  const n = Math.floor(Number(String(amount).replace(/[^0-9]/g, '')) || 0);
  const ok = !!title.trim() && n >= 10 && n <= 100000;
  const go = () => { if (!ok) return; onClose(); liveGoalSet(title.replace(/\s+/g, ' ').trim().slice(0, 40), n); };
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', color: theme.ink }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ padding: '8px 20px 2px', fontSize: 16, fontWeight: 800 }}>{goal ? 'New gift goal' : 'Set a gift goal'}</div>
        <div style={{ padding: '0 20px 12px', fontSize: 13, color: theme.muted, lineHeight: 1.45 }}>{goal ? 'This replaces your current goal. ' : ''}Gifts from now on fill the bar, and everyone in the live sees it.</div>
        <div style={{ padding: '0 16px' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 40))} placeholder="What is it for? Like a new mic" aria-label="Goal name" enterKeyHint="next" autoComplete="off" style={{ ...inputStyle(theme), fontWeight: 600 }} />
          <div role="radiogroup" aria-label="Coins" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
            {LIVE_GOAL_PICKS.map((v) => {
              const on = n === v;
              return (
                <div key={v} role="radio" aria-checked={on} aria-label={`${v.toLocaleString('en-US')} coins`} onClick={() => { hapticTap(); setAmount(String(v)); }} className="zchat-press" style={{ height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: on ? theme.coral : detailsCardBg(theme), border: `1px solid ${on ? theme.coral : theme.border}`, color: on ? '#FFFFFF' : theme.ink, fontSize: 14.5, fontWeight: 800, fontVariantNumeric: 'tabular-nums', cursor: 'pointer' }}>{v.toLocaleString('en-US')}</div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <CoinIcon size={22} />
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]*" aria-label="Goal in coins" placeholder="Coins" style={{ ...inputStyle(theme), flex: 1, fontVariantNumeric: 'tabular-nums' }} />
          </div>
          {n > 100000 && <div style={{ fontSize: 12.5, color: theme.danger, marginTop: 6 }}>Goals go up to 100,000 coins</div>}
          <div style={{ height: 12 }} />
          <BigButton label={ok ? `Set goal for ${coinsText(n)}` : 'Set goal'} disabled={!ok} onClick={go} />
        </div>
      </div>
    </div>
  );
}

function liveSupportersText(n) { return coinsText(Number(n) || 0); }
function LiveSupportersBlock({ id, initial }) {
  const { theme } = useTheme();
  const [st, setSt] = useState(() => (Array.isArray(initial) && initial.length ? { list: initial, shown: false, thanked: false } : null));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    liveRpc('zchat_live_supporters', { p_live: id }).then(({ data }) => { if (alive && data && data.ok !== false) setSt((s) => ({ list: Array.isArray(data.list) ? data.list : [], shown: !!data.shown, thanked: !!data.thanked || !!(s && s.thanked) })); });
    return () => { alive = false; };
  }, [id]);
  if (!st || !st.list.length) return null;
  const me = liveRt.me;
  const thank = async () => {
    if (st.thanked || busy) return;
    setBusy(true);
    setSt((s) => ({ ...s, thanked: true }));
    hapticTap();
    const { data, error } = await liveRpc('zchat_live_thank', { p_live: id });
    setBusy(false);
    if (error || !data || data.ok === false) { setSt((s) => ({ ...s, thanked: false })); appSnack(rpcMissing(error) ? 'Thank you notes switch on once the latest ZChat setup is finished.' : friendlyError(error, "Couldn't send your thanks. Try again.")); return; }
    playUiSound('send');
    appSnack(st.list.length === 1 ? `Thanks sent to ${liveFirst(st.list[0].name)}` : `Thanks sent to ${st.list.length} people`);
    const push = Array.isArray(data.push) ? data.push.slice(0, 5) : [];
    if (me && push.length) push.forEach((uid) => sendPushNotification(uid, 'ZChat', `${me.name || 'Someone'} thanked you for supporting their live`.slice(0, 120), `/?profile=${me.id}`, me.avatar));
  };
  const show = async () => {
    const next = !st.shown;
    setSt((s) => ({ ...s, shown: next }));
    const { data, error } = await liveRpc('zchat_live_supporters_show', { p_live: id, p_on: next });
    if (error || !data || data.ok === false) { setSt((s) => ({ ...s, shown: !next })); appSnack(friendlyError(error, "Couldn't change that. Try again.")); }
  };
  return (
    <>
      <IgHeading>Top supporters</IgHeading>
      <div role="list" aria-label="Top supporters" style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        {st.list.map((s, i) => (
          <div key={s.user_id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 16px', borderTop: i ? `1px solid ${theme.border}` : 'none' }}>
            <Avatar emoji={s.avatar} name={s.name || s.username || 'Someone'} size={36} />
            <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name || s.username || 'Someone'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14.5, fontWeight: 700, color: theme.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}><CoinIcon size={16} />{(Number(s.coins) || 0).toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <BigButton label={st.thanked ? 'Thanks sent' : st.list.length === 1 ? `Thank ${liveFirst(st.list[0].name)}` : 'Thank them all'} tone={st.thanked ? 'plain' : 'accent'} disabled={st.thanked} onClick={thank} />
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '8px 2px 0' }}>Each of them gets a thank you note from you.</div>
      <div style={{ margin: '14px -16px 0' }}>
        <IgRow icon={<TrophyIcon />} label="Show on your ended live" sub="People who open this live later see who supported you" right={<IgToggle on={st.shown} onClick={show} />} />
      </div>
    </>
  );
}
function LiveEndedSupporters({ id, initial }) {
  const [list, setList] = useState(Array.isArray(initial) ? initial : null);
  useEffect(() => {
    if (!id) return undefined;
    let alive = true;
    const load = () => liveRpc('zchat_live_supporters', { p_live: id }).then(({ data }) => { if (alive && data && data.ok !== false) setList(data.shown && Array.isArray(data.list) ? data.list : []); });
    if (!Array.isArray(initial)) load();
    let keep = null;
    try { keep = rtKeep(() => supabase.channel(rtName(`livetop-${id}`)).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_sessions', filter: `id=eq.${id}` }, (p) => { if (p && p.new && 'show_supporters' in p.new) load(); })); } catch {}
    return () => { alive = false; if (keep) rtDrop(keep); };
  }, [id]);
  if (!list || !list.length) return null;
  return (
    <div className="zchat-fade" style={{ marginTop: 24, width: '100%', maxWidth: 320 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>Top supporters</div>
      <div role="list" aria-label="Top supporters" style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        {list.slice(0, 5).map((s) => (
          <div key={s.user_id} role="listitem" aria-label={`${s.name || 'Someone'}, ${liveSupportersText(s.coins)}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, width: 58 }}>
            <Avatar emoji={s.avatar} name={s.name || s.username || 'Someone'} size={44} />
            <span style={{ fontSize: 12, fontWeight: 700, maxWidth: 58, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{liveFirst(s.name || s.username)}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color: '#FFD86B', fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={12} />{(Number(s.coins) || 0).toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
async function livePlanCancel(plan) {
  const k = String(plan.id);
  livePlans.gone.add(k);
  hapticTap();
  livePlansEmit();
  const { data, error } = await liveRpc('zchat_plan_cancel', { p_plan: plan.id });
  if (error || !data || data.ok === false) {
    livePlans.gone.delete(k);
    livePlansEmit();
    appSnack(livePlanWhy(data && data.reason, error, "Couldn't call that off. Try again."));
    return false;
  }
  livePlans.list = livePlans.list.filter((p) => String(p.id) !== k);
  livePlansEmit();
  return true;
}
export function LivePlanSheet({ plan, me, rank = -1, group, members, onClose, onEdit }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  useLivePlans();
  const [ask, setAsk] = useState(false);
  const p = livePlanById(plan.id) || plan;
  const mine = !!me && p.host_id === me.id;
  const room = p.kind === 'room';
  const h = p.host || {};
  const g = p.group || {};
  const at = Date.parse(p.starts_at);
  const canCancel = mine || (room && rank >= 2);
  const gone = livePlans.gone.has(String(p.id)) || p.status !== 'planned';
  const asked = Math.max(0, Number(p.reminders) || 0);
  const others = p.mine ? asked - 1 : asked;
  const remindLine = p.mine ? (others > 0 ? `You and ${others === 1 ? '1 other person' : `${others.toLocaleString('en-US')} others`} want a reminder` : null) : asked > 0 ? (asked === 1 ? '1 person wants a reminder' : `${asked.toLocaleString('en-US')} people want a reminder`) : null;
  useEffect(() => { if (gone && !ask) onClose(); }, [gone]);
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 650, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(90vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', color: theme.ink, boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          </div>
          <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
            {p.cover && <img src={p.cover} alt="" draggable={false} style={{ display: 'block', width: 'calc(100% - 32px)', margin: '2px 16px 0', aspectRatio: '2.6 / 1', maxHeight: 180, objectFit: 'cover', borderRadius: 16, background: theme.rowBg }} />}
            <div style={{ padding: '14px 20px 0' }}>
              <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.3, wordBreak: 'break-word' }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
                <Avatar emoji={room ? g.avatar : h.avatar} name={(room ? g.name : h.name) || 'Someone'} size={26} />
                <span style={{ fontSize: 14, color: theme.ink2, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room ? `Voice room in ${g.name || 'your group'}${mine ? '' : h.name ? `, by ${liveFirst(h.name)}` : ''}` : mine ? 'Your live' : `Live with ${h.name || 'someone'}`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9, fontSize: 14, color: theme.ink2 }}><Clock size={18} color={theme.muted} style={{ marginLeft: 4, flexShrink: 0 }} />{Number.isFinite(at) ? reminderWhen(at) : ''}</div>
              {remindLine && <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 9, fontSize: 14, color: theme.ink2 }}><Bell size={18} color={theme.muted} style={{ marginLeft: 4, flexShrink: 0 }} />{remindLine}</div>}
            </div>
            <div style={{ padding: '18px 16px 4px' }}>
              {mine ? (
                <BigButton label={room ? 'Start the room now' : 'Go live now'} disabled={!!p.pending} onClick={() => { onClose(); if (room) livePlanStartRoom(p, me, group, members); else livePlanStartLive(p, me); }} />
              ) : (
                <BigButton label={p.mine ? 'Reminder set' : 'Remind me'} tone={p.mine ? 'plain' : 'accent'} disabled={!!p.pending} onClick={() => livePlanRemind(p, !p.mine)} />
              )}
              <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', padding: '8px 10px 0', lineHeight: 1.45 }}>
                {mine ? (room ? `People in ${g.name || 'the group'} who asked get told when you start.` : 'People who asked for a reminder get told when you go live.') : p.mine ? 'You get a reminder 10 minutes before. Tap again to turn it off.' : 'Get a reminder 10 minutes before it starts.'}
              </div>
            </div>
            {(mine || canCancel || (room && livePlans.openGroup)) && (
              <div style={{ marginTop: 6, borderTop: `1px solid ${theme.border}` }}>
                {mine && onEdit && <IgRow icon={<Pencil />} label="Edit" onClick={() => { onClose(); onEdit(p); }} />}
                {room && livePlans.openGroup && !group && <IgRow icon={<Users />} label={`Open ${g.name || 'the group'}`} onClick={() => { onClose(); livePlans.openGroup(p.group_id); }} />}
                {canCancel && <IgRow icon={<X />} label={room ? 'Call off this room' : 'Call off this live'} danger onClick={() => setAsk(true)} />}
              </div>
            )}
          </div>
        </div>
      </div>
      {ask && <ConfirmDialog title={room ? 'Call off this room?' : 'Call off your live?'} body={Number(p.reminders) > 0 ? 'People who asked for a reminder will be told.' : 'It comes off Coming up for everyone.'} confirmLabel="Call it off" layer={700} onCancel={() => setAsk(false)} onConfirm={() => { setAsk(false); onClose(); livePlanCancel(p); }} />}
    </Portal>
  );
}

function PostMediaCarousel({ post, rootRef, onTap, onDoubleTap }) {
  const list = Array.isArray(post.media_urls) ? post.media_urls.filter((x) => x && x.u) : [];
  const [idx, setIdx] = useState(0);
  const ref = useRef(null);
  const onScroll = () => { const el = ref.current; if (!el) return; const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (i !== idx) setIdx(i); };
  const peek = useCarouselPeek(idx);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={ref} onScroll={onScroll} data-pcar="1" style={{ position: 'absolute', inset: 0, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {list.map((it, i) => (
          <div key={i} onClick={() => { if (it.t !== 'video' && onTap) onTap(); }} style={{ position: 'relative', flex: '0 0 100%', height: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05060a' }}>
            {it.t === 'video'
              ? <ReelVideo post={{ ...post, media_url: it.u, media_type: 'video', overlay_url: it.o || null }} rootRef={rootRef} onDoubleTap={onDoubleTap} />
              : <img src={it.u} alt={psAltOf(post, i)} loading={i < 2 ? 'eager' : 'lazy'} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
            {it.o && it.t !== 'video' && <img src={it.o} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
          </div>
        ))}
      </div>
      {list.length > 1 && (
        <>
          <CarouselCount n={idx + 1} total={list.length} show={peek} style={{ top: 'calc(64px + env(safe-area-inset-top))', right: 14 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, display: 'flex', justifyContent: 'center', gap: 5, pointerEvents: 'none' }}>
            {list.map((_, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === idx ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }} />)}
          </div>
        </>
      )}
    </div>
  );
}

function psPeaks(levels, n = 48) {
  const src = (levels || []).filter((v) => Number.isFinite(v));
  if (!src.length) return Array.from({ length: n }, () => 20);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i / n) * src.length);
    const b = Math.max(a + 1, Math.floor(((i + 1) / n) * src.length));
    let m = 0;
    for (let k = a; k < b; k++) m = Math.max(m, src[k] || 0);
    out.push(m);
  }
  const top = Math.max(0.0001, ...out);
  return out.map((v) => Math.max(6, Math.min(100, Math.round((v / top) * 100))));
}
async function psBlobPeaks(blob) {
  try {
    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AC) return null;
    const ctx = new AC(1, 8000, 8000);
    const buf = await new Promise((res, rej) => { blob.arrayBuffer().then((raw) => { const p = ctx.decodeAudioData(raw, res, rej); if (p && p.then) p.then(res, rej); }, rej); });
    const d = buf.getChannelData(0);
    const lv = [];
    const step = Math.max(1, Math.floor(d.length / 480));
    for (let i = 0; i < d.length; i += step) { let m = 0; for (let k = i; k < Math.min(d.length, i + step); k += 8) m = Math.max(m, Math.abs(d[k])); lv.push(m); }
    return { peaks: psPeaks(lv), dur: buf.duration };
  } catch { return null; }
}
async function psVoiceCard(peaks, dur) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const g = c.getContext('2d');
  g.fillStyle = '#1B1730'; g.fillRect(0, 0, 1080, 1350);
  const bars = peaks.length;
  const gap = 8; const w = (900 - gap * (bars - 1)) / bars;
  g.fillStyle = '#FFFFFF';
  peaks.forEach((p, i) => { const h = Math.max(14, (p / 100) * 300); const x = 90 + i * (w + gap); const y = 675 - h / 2; if (g.roundRect) { g.beginPath(); g.roundRect(x, y, w, h, w / 2); g.fill(); } else g.fillRect(x, y, w, h); });
  g.font = `700 54px ${FONT}`; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.9)';
  g.fillText(psClock(dur), 540, 975);
  const blob = await new Promise((r) => { try { c.toBlob(r, 'image/jpeg', 0.88); } catch { r(null); } });
  return blob ? new File([blob], 'voice-cover.jpg', { type: 'image/jpeg' }) : null;
}
function PsLevelBars({ levels, color, n = 32, h = 44 }) {
  const list = levels.slice(-n);
  while (list.length < n) list.unshift(0);
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3, height: h }}>
      {list.map((v, i) => <span key={i} style={{ width: 4, borderRadius: 2, height: Math.max(4, Math.round(v * h)), background: color, transition: 'height 90ms linear' }} />)}
    </div>
  );
}
export function VoicePostComposer({ me, userId, onClose }) {
  const { theme } = useTheme();
  const [st, setSt] = useState('idle');
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState([]);
  const [rec, setRec] = useState(null);
  const [caption, setCaption] = useState('');
  const [cover, setCover] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  const [err, setErr] = useState('');
  const [askLeave, setAskLeave] = useState(false);
  const r = useRef({});
  const coverInput = useRef(null);
  const leave = () => { if ((rec || st === 'rec') && !askLeave) { setAskLeave(true); return; } onClose(); };
  useBackClose(true, leave);
  useEffect(() => () => {
    const x = r.current;
    clearInterval(x.timer); clearInterval(x.lv);
    try { if (x.rec && x.rec.state !== 'inactive') { x.cancel = true; x.rec.stop(); } } catch {}
    try { if (x.stream) x.stream.getTracks().forEach((t) => t.stop()); } catch {}
    try { if (x.actx) x.actx.close(); } catch {}
    if (x.audio) { try { x.audio.pause(); } catch {} }
  }, []);
  useEffect(() => () => { if (coverUrl) psRevokeLater(coverUrl); }, [coverUrl]);
  useEffect(() => () => { if (rec && rec.url) psRevokeLater(rec.url); }, [rec]);
  const canRecord = typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const stop = () => { const x = r.current; if (x.rec && x.rec.state !== 'inactive') { try { x.rec.stop(); } catch {} } };
  const start = async () => {
    if (st === 'rec') { stop(); return; }
    setErr('');
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { if (permDenied(e)) openPermHelp('mic'); else setErr('Your microphone could not start. Try again.'); return; }
    const mimes = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac', 'audio/ogg'];
    const mime = mimes.find((t) => typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t));
    let mr;
    try { mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch { stream.getTracks().forEach((t) => t.stop()); setErr('This browser cannot record sound.'); return; }
    const x = r.current;
    const actual = mr.mimeType || mime || 'audio/webm';
    const ext = actual.includes('mp4') ? 'm4a' : actual.includes('ogg') ? 'ogg' : actual.includes('aac') ? 'aac' : 'webm';
    x.stream = stream; x.rec = mr; x.chunks = []; x.cancel = false; x.levels = []; x.t0 = Date.now();
    try {
      const ACtx = window.AudioContext || window.webkitAudioContext;
      if (ACtx) {
        const actx = new ACtx(); const an = actx.createAnalyser(); an.fftSize = 256;
        actx.createMediaStreamSource(stream).connect(an);
        const buf = new Uint8Array(an.fftSize); x.actx = actx;
        x.lv = setInterval(() => { an.getByteTimeDomainData(buf); let pk = 0; for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128); if (v > pk) pk = v; } const lv = Math.min(1, pk / 60); x.levels.push(lv); setLevels((p) => [...p.slice(-47), lv]); }, 90);
      }
    } catch {}
    mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) x.chunks.push(e.data); };
    mr.onstop = async () => {
      clearInterval(x.timer); clearInterval(x.lv);
      try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      try { if (x.actx) x.actx.close(); } catch {}
      x.actx = null;
      if (x.cancel) return;
      const blob = new Blob(x.chunks, { type: actual });
      const took = (Date.now() - x.t0) / 1000;
      if (blob.size < 1000 || took < 1) { setSt('idle'); setLevels([]); setErr('That was very short. Tap the button and talk a little longer.'); return; }
      setSt('busy');
      const got = await psBlobPeaks(blob);
      const dur = Math.min(60, got && got.dur && Number.isFinite(got.dur) ? got.dur : took);
      const peaks = (got && got.peaks) || psPeaks(x.levels);
      const card = await psVoiceCard(peaks, dur);
      setRec({ file: new File([blob], `voice.${ext}`, { type: actual }), url: URL.createObjectURL(blob), dur, peaks, card });
      setSt('done');
      playUiSound('tap');
    };
    mr.start(250);
    setSt('rec'); setSecs(0); setLevels([]);
    hapticTap();
    x.timer = setInterval(() => { const s = (Date.now() - x.t0) / 1000; setSecs(s); if (s >= 60) stop(); }, 200);
  };
  const play = () => {
    const x = r.current;
    if (!rec) return;
    if (!x.audio) { x.audio = new Audio(rec.url); x.audio.onended = () => setSt('done'); x.audio.ontimeupdate = () => setSecs(x.audio.currentTime); }
    if (x.audio.src !== rec.url) x.audio.src = rec.url;
    if (st === 'play') { x.audio.pause(); setSt('done'); } else { x.audio.currentTime = 0; x.audio.play().then(() => setSt('play'), () => {}); }
  };
  const redo = () => { const x = r.current; if (x.audio) { try { x.audio.pause(); } catch {} x.audio = null; } setRec(null); setSt('idle'); setSecs(0); setLevels([]); };
  const share = async () => {
    if (!rec) return;
    const x = r.current;
    if (x.audio) { try { x.audio.pause(); } catch {} }
    const recNow = rec; const capNow = caption.trim(); const coverNow = cover;
    onClose();
    appSnack('Posting');
    const res = await psCreateVoicePost(userId, me, recNow, capNow, coverNow);
    if (res.ok) { appSnack('Posted to your profile'); playUiSound('send'); }
    else appSnack(friendlyError(res.error, 'Could not post. Check your connection and try again.'));
  };
  const pickCover = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f || !(f.type || '').startsWith('image')) return;
    setCover(f); setCoverUrl(URL.createObjectURL(f));
  };
  const recording = st === 'rec';
  const left = Math.max(0, 60 - Math.floor(secs));
  return (
    <FullPage title="Voice post" onBack={leave} zIndex={800}
      right={<div role="button" aria-label="Share voice post" aria-disabled={!rec ? 'true' : undefined} onClick={share} style={{ padding: '0 12px', height: 40, display: 'flex', alignItems: 'center', fontSize: 15.5, fontWeight: 700, color: rec ? theme.coral : theme.muted, cursor: rec ? 'pointer' : 'default' }}>Share</div>}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 0 10px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '4 / 5', borderRadius: 20, overflow: 'hidden', background: coverUrl ? '#000000' : (theme.dark ? '#1B1730' : '#ECE8F7'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          {coverUrl && <img src={coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }} />}
          <div style={{ position: 'relative', minHeight: 44, display: 'flex', alignItems: 'center' }}>
            {rec ? <PsWave peaks={rec.peaks} pct={st === 'play' && rec.dur ? secs / rec.dur : 0} color={coverUrl || theme.dark ? '#FFFFFF' : theme.coral} dim={coverUrl || theme.dark ? 'rgba(255,255,255,0.4)' : 'rgba(124,92,252,0.3)'} width={240} /> : <PsLevelBars levels={levels} color={coverUrl || theme.dark ? '#FFFFFF' : theme.coral} />}
          </div>
          <div style={{ position: 'relative', fontSize: 15, fontWeight: 700, color: coverUrl || theme.dark ? '#FFFFFF' : theme.ink, fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
            {recording ? `${psClock(secs)}, ${left} ${left === 1 ? 'second' : 'seconds'} left` : rec ? psClock(st === 'play' ? secs : rec.dur) : st === 'busy' ? 'Getting it ready' : 'Up to 1 minute'}
          </div>
          {canRecord ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18 }}>
              {rec && <div role="button" aria-label="Record again" onClick={redo} className="zchat-press" style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF' }}><Undo2 size={20} /></div>}
              <div role="button" aria-label={recording ? 'Stop recording' : rec ? (st === 'play' ? 'Pause' : 'Play your recording') : 'Start recording'} onClick={rec ? play : start} className="zchat-press"
                style={{ width: 76, height: 76, borderRadius: '50%', background: recording ? theme.danger : theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: recording ? `0 0 0 8px ${theme.danger}33` : 'none', transition: 'box-shadow 200ms ease, background 200ms ease' }}>
                {st === 'busy' ? <Spinner size={22} /> : recording ? <span style={{ width: 24, height: 24, borderRadius: 6, background: '#FFFFFF' }} /> : rec ? (st === 'play' ? <Pause size={28} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={28} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />) : <Mic size={30} color="#FFFFFF" />}
              </div>
            </div>
          ) : <div style={{ position: 'relative', fontSize: 14, color: theme.muted, padding: '0 24px', textAlign: 'center' }}>This browser cannot record sound. Try ZChat in Chrome or Safari.</div>}
        </div>
        {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, textAlign: 'center', padding: '12px 10px 0', lineHeight: 1.45 }}>{err}</div>}
      </div>
      <textarea value={caption} onChange={(e) => setCaption(e.target.value.slice(0, MAX_CHARS))} placeholder="Write a caption" aria-label="Caption" rows={2}
        style={{ ...inputStyle(theme), width: '100%', boxSizing: 'border-box', resize: 'none', fontSize: 16, lineHeight: 1.4, marginTop: 6 }} />
      <input ref={coverInput} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickCover} />
      <DetailSection>
        <DetailRow icon={<ImageIcon />} label={cover ? 'Change cover photo' : 'Add a cover photo'} sub={cover ? null : 'Optional. People see it behind the waveform.'} onClick={() => coverInput.current && coverInput.current.click()} right={cover ? <span role="button" aria-label="Remove cover photo" onClick={(e) => { e.stopPropagation(); setCover(null); setCoverUrl(null); }} style={{ display: 'flex', padding: 6, cursor: 'pointer', color: theme.muted }}><X size={18} /></span> : null} last />
      </DetailSection>
      {askLeave && (
        <ActionSheet title="Leave this voice post?" onClose={() => setAskLeave(false)} zIndex={900} items={[
          { k: 'stay', label: 'Keep editing', icon: <Pencil />, on: () => setAskLeave(false) },
          { k: 'discard', label: 'Discard', icon: <Trash2 />, danger: true, on: () => { setAskLeave(false); onClose(); } },
        ]} />
      )}
    </FullPage>
  );
}

export function PostArchivePage({ me, userId, onClose }) {
  const { theme } = useTheme();
  useBackClose(true, onClose);
  const [rows, setRows] = useState(() => psArchiveMem.get(userId) || null);
  const [menu, setMenu] = useState(null);
  const [ask, setAsk] = useState(null);
  const [open, setOpen] = useState(null);
  const [note, setNote] = useState('');
  const say = (t) => { setNote(t); setTimeout(() => setNote((c) => (c === t ? '' : c)), 2200); };
  const load = async () => {
    const { data, error } = await supabase.from('posts').select('*').eq('user_id', userId).not('archived_at', 'is', null).order('archived_at', { ascending: false }).limit(300);
    if (error && !data) { setRows((p) => p || []); return; }
    const list = (data || []).filter((p) => p.archived_at);
    psArchiveMem.set(userId, list);
    setRows(list);
  };
  useEffect(() => { load(); }, []);
  const keep = (list) => { psArchiveMem.set(userId, list); setRows(list); };
  const showAgain = async (p) => {
    setMenu(null);
    const before = rows || [];
    keep(before.filter((x) => x.id !== p.id));
    hapticTap();
    const err = await psSetArchived(p, false);
    if (err) { keep(before); say(err); return; }
    say('Back on your profile');
  };
  const remove = async (p) => {
    setAsk(null);
    const before = rows || [];
    keep(before.filter((x) => x.id !== p.id));
    forgetPostLocally(p.id);
    const { error } = await supabase.from('posts').delete().eq('id', p.id).eq('user_id', userId);
    if (error) { keep(before); unforgetPostLocally(p.id); say(friendlyError(error, 'That post could not be deleted. Try again.')); }
  };
  const groups = [];
  (rows || []).forEach((p) => {
    const d = new Date(p.archived_at || p.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, label: fmtDate(d, { month: 'long', year: 'numeric' }), items: [] }; groups.push(g); }
    g.items.push(p);
  });
  return (
    <FullPage title="Post archive" subtitle={rows && rows.length ? `${rows.length} ${rows.length === 1 ? 'post' : 'posts'}` : null} onBack={onClose} zIndex={92} pad={false}>
      {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.coral} /></div>}
      {rows && !rows.length && <EmptyState art="archive" title="Nothing archived" text="Archive a post from its menu to take it off your profile without deleting it. Only you can see posts here." />}
      {groups.map((g) => (
        <div key={g.key}>
          <div style={{ fontSize: 13, fontWeight: 800, color: theme.muted, padding: '14px 16px 8px' }}>{g.label}</div>
          <div role="list" aria-label={`Archived in ${g.label}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            {g.items.map((p) => <PostTile key={p.id} p={p} onOpen={() => setMenu(p)} myId={userId} />)}
          </div>
        </div>
      ))}
      {rows && rows.length > 0 && <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '18px 16px 26px', textAlign: 'center' }}>Only you can see your archived posts.</div>}
      {menu && (
        <ActionSheet title={menu.caption ? String(menu.caption).slice(0, 60) : 'Archived post'} onClose={() => setMenu(null)} zIndex={800} items={[
          { k: 'show', label: 'Show on profile again', icon: <Eye />, on: () => showAgain(menu) },
          { k: 'open', label: 'View post', icon: <ImageIcon />, on: () => { const p0 = menu; setMenu(null); setOpen(p0); } },
          { k: 'delete', label: 'Delete', icon: <Trash2 />, danger: true, on: () => { const p0 = menu; setMenu(null); setAsk(p0); } },
        ]} />
      )}
      {ask && <ConfirmDialog layer={820} title="Delete this post?" body="It will be gone for good. This cannot be undone." onCancel={() => setAsk(null)} onConfirm={() => remove(ask)} />}
      {open && <Portal><FeedPanel me={me} userId={userId} fixedIds={(rows || []).map((x) => x.id)} title="Post archive" startPostId={open.id} seedPost={open} seedItems={(rows || []).map((x) => ({ ...x, owner: me }))} onClose={() => setOpen(null)} onOpenProfile={() => setOpen(null)} onPostDeleted={() => load()} /></Portal>}
      {note && <div className="zchat-pop" role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(28px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 830, padding: '9px 16px', borderRadius: 20, background: theme.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{note}</div>}
    </FullPage>
  );
}

async function loadChannels(q) {
  const { data, error } = await supabase.rpc('zchat_channels', { p_query: q || null, p_limit: 60 });
  if (error) return { error };
  return { rows: Array.isArray(data) ? data : [] };
}
function ChannelRow({ c, onOpen, onFollow, busy }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label={`Open channel ${c.name}`} onClick={onOpen} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', cursor: 'pointer' }}>
      <Avatar emoji={c.avatar} name={c.name} size={50} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatCount(Number(c.followers) || 0)} {Number(c.followers) === 1 ? 'follower' : 'followers'}{c.bio ? `, ${c.bio}` : ''}</div>
      </div>
      {onFollow && (
        <div role="button" aria-label={c.following ? `Following ${c.name}` : `Follow ${c.name}`} onClick={(e) => { e.stopPropagation(); onFollow(c); }} className="zchat-press" style={{ height: 32, minWidth: 92, padding: '0 14px', boxSizing: 'border-box', borderRadius: 9, background: c.following ? theme.soft2 : theme.coral, color: c.following ? theme.ink : '#FFFFFF', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{busy ? <Spinner size={13} color={c.following ? theme.ink : '#FFFFFF'} /> : c.following ? 'Following' : 'Follow'}</div>
      )}
    </div>
  );
}
async function setChannelFollow(channelId, userId, on) {
  if (on) return supabase.from('channel_follows').upsert({ channel_id: channelId, user_id: userId }, { onConflict: 'channel_id,user_id' });
  return supabase.from('channel_follows').delete().eq('channel_id', channelId).eq('user_id', userId);
}
export function ChannelsPage({ userId, me, onClose, onShare, initialId }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [tab, setTab] = useState('following');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(initialId ? { id: initialId } : null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const load = async () => {
    const r = await loadChannels(tab === 'discover' ? q.trim() : '');
    if (r.error) { setErr('Channels switch on once the latest ZChat setup is finished.'); setRows([]); return; }
    setErr('');
    setRows(r.rows);
  };
  useEffect(() => { const t = setTimeout(load, tab === 'discover' && q ? 300 : 0); return () => clearTimeout(t); }, [tab, q]);
  const follow = async (c) => {
    setBusyId(c.id);
    const { error } = await setChannelFollow(c.id, userId, !c.following);
    setBusyId(null);
    if (!error) setRows((prev) => (prev || []).map((x) => (x.id === c.id ? { ...x, following: !c.following, followers: Number(x.followers || 0) + (c.following ? -1 : 1) } : x)));
  };
  const mine = (rows || []).filter((c) => c.owner_id === userId);
  const following = (rows || []).filter((c) => c.following && c.owner_id !== userId);
  const discover = (rows || []).filter((c) => c.owner_id !== userId);
  return (
    <FullPage title="Channels" subtitle="Updates from people and pages you follow" onBack={onClose} zIndex={70}
      right={<div role="button" aria-label="Create a channel" onClick={() => setCreating(true)} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={22} /></div>}>
      <UnderTabs style={{ margin: '2px 0 10px' }} value={tab} onChange={setTab} tabs={[['following', 'Following'], ['discover', 'Find channels']]} />
      {tab === 'discover' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, marginBottom: 6 }}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search channels" aria-label="Search channels" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        </label>
      )}
      {err && <div role="alert" style={{ padding: '8px 2px', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : tab === 'following' ? (
        <>
          {mine.length > 0 && <IgHeading>Your channels</IgHeading>}
          {mine.map((c) => <ChannelRow key={c.id} c={c} onOpen={() => setOpen(c)} />)}
          {following.length > 0 && <IgHeading>Following</IgHeading>}
          {following.map((c) => <ChannelRow key={c.id} c={c} onOpen={() => setOpen(c)} />)}
          {!mine.length && !following.length && !err && <EmptyState art="moments" title="No channels yet" text="Find channels to follow, or start your own to share updates with everyone." action={<PillButton primary label="Find channels" onClick={() => setTab('discover')} />} />}
        </>
      ) : (
        <>
          {discover.map((c) => <ChannelRow key={c.id} c={c} busy={busyId === c.id} onOpen={() => setOpen(c)} onFollow={follow} />)}
          {!discover.length && !err && <EmptyState art="nothing" title={q ? 'No channels found' : 'No channels to show'} text={q ? 'Try another word.' : 'Be the first and create one.'} />}
        </>
      )}
      {creating && <CreateChannelPage userId={userId} onClose={() => setCreating(false)} onCreated={(c) => { setCreating(false); load(); setOpen(c); }} />}
      {open && <ChannelPage channelId={open.id} seed={open.name ? open : null} userId={userId} me={me} onShare={onShare} onClose={() => { setOpen(null); load(); }} />}
    </FullPage>
  );
}

export function CreateChannelPage({ userId, onClose, onCreated }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [cropFile, setCropFile] = useState(null);
  const fileRef = useRef(null);
  const pickAvatar = async (blob) => {
    setCropFile(null);
    setBusy(true);
    const { url, error } = await uploadMedia(new File([blob], 'channel.jpg', { type: 'image/jpeg' }), userId);
    setBusy(false);
    if (!error && url) setAvatar(url);
  };
  const create = async () => {
    const n = name.trim().slice(0, 60);
    if (!n) { setErr('Give your channel a name'); return; }
    setBusy(true);
    setErr('');
    const { data, error } = await supabase.from('channels').insert({ owner_id: userId, name: n, bio: bio.trim().slice(0, 300) || null, avatar }).select().single();
    if (error || !data) { setBusy(false); setErr(/channels|schema|relation/i.test(String((error && error.message) || '')) ? 'Channels switch on once the latest ZChat setup is finished.' : 'The channel could not be made. Try again.'); return; }
    await setChannelFollow(data.id, userId, true);
    setBusy(false);
    onCreated(data);
  };
  return (
    <FullPage title="New channel" onBack={onClose} zIndex={76} footer={<BigButton label={busy ? 'Working' : 'Create channel'} disabled={busy} onClick={create} />}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 10px' }}>
        <div role="button" aria-label="Channel photo" onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'relative', cursor: 'pointer' }}>
          <Avatar emoji={avatar} name={name || 'Channel'} size={92} />
          <span style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: '50%', background: theme.ink, color: theme.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={15} /></span>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setCropFile(f); }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '8px 2px 6px' }}>Name</div>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 60))} placeholder="Like Campus News or Daily Memes" aria-label="Channel name" style={inputStyle(theme)} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '14px 2px 6px' }}>About</div>
      <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 300))} placeholder="What will you post here?" aria-label="Channel description" rows={3} style={{ ...inputStyle(theme), resize: 'none', fontFamily: FONT }} />
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 0' }}>Anyone on ZChat can find and follow your channel. Only you can post in it. Followers do not see each other.</div>
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
      {cropFile && <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={pickAvatar} />}
    </FullPage>
  );
}

export function ChannelPage({ channelId, seed, userId, me, onClose, onShare }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [ch, setCh] = useState(seed || null);
  const [posts, setPosts] = useState(null);
  const [stats, setStats] = useState({});
  const [follow, setFollow] = useState(seed ? { on: !!seed.following, n: Number(seed.followers) || 0 } : { on: false, n: 0 });
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [view, setView] = useState(null);
  const [askDelete, setAskDelete] = useState(null);
  const fileRef = useRef(null);
  const isAdmin = !!ch && (ch.owner_id === userId || (Array.isArray(ch.admin_ids) && ch.admin_ids.includes(userId)));
  const load = async () => {
    const [{ data: c }, { data: list }, st, fol, cnt] = await Promise.all([
      supabase.from('channels').select('*').eq('id', channelId).maybeSingle(),
      supabase.from('channel_posts').select('*').eq('channel_id', channelId).order('created_at', { ascending: false }).limit(100),
      supabase.rpc('zchat_channel_post_stats', { p_channel: channelId }),
      supabase.from('channel_follows').select('user_id, muted').eq('channel_id', channelId).eq('user_id', userId).maybeSingle(),
      supabase.rpc('zchat_channels', { p_query: null, p_limit: 100 }),
    ]);
    if (!c) { setErr('This channel is not available.'); setPosts([]); return; }
    setCh(c);
    setPosts(list || []);
    const m = {};
    (Array.isArray(st.data) ? st.data : []).forEach((r) => { m[r.post_id] = { likes: Number(r.likes) || 0, liked: !!r.liked }; });
    setStats(m);
    const row = (Array.isArray(cnt.data) ? cnt.data : []).find((x) => x.id === channelId);
    setFollow({ on: !!(fol.data), muted: !!(fol.data && fol.data.muted), n: row ? Number(row.followers) || 0 : follow.n });
  };
  useEffect(() => { load(); }, [channelId]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const toggleFollow = async () => {
    const on = !follow.on;
    setFollow((f) => ({ ...f, on, n: Math.max(0, f.n + (on ? 1 : -1)) }));
    hapticTap();
    const { error } = await setChannelFollow(channelId, userId, on);
    if (error) setFollow((f) => ({ ...f, on: !on, n: Math.max(0, f.n + (on ? -1 : 1)) }));
  };
  const toggleMute = async () => {
    const muted = !follow.muted;
    setFollow((f) => ({ ...f, muted }));
    await supabase.from('channel_follows').update({ muted }).eq('channel_id', channelId).eq('user_id', userId);
  };
  const like = async (p) => {
    const cur = stats[p.id] || { likes: 0, liked: false };
    const next = { likes: Math.max(0, cur.likes + (cur.liked ? -1 : 1)), liked: !cur.liked };
    setStats((s) => ({ ...s, [p.id]: next }));
    if (!cur.liked) playUiSound('like');
    const { error } = cur.liked
      ? await supabase.from('channel_post_likes').delete().eq('post_id', p.id).eq('user_id', userId)
      : await supabase.from('channel_post_likes').upsert({ post_id: p.id, user_id: userId }, { onConflict: 'post_id,user_id' });
    if (error) setStats((s) => ({ ...s, [p.id]: cur }));
  };
  const post = async () => {
    if (busy || (!text.trim() && !file)) return;
    setBusy(true);
    setErr('');
    let media = null;
    if (file) {
      let f = file;
      try { const u = URL.createObjectURL(file); f = await prepareImageFile(file, u); URL.revokeObjectURL(u); } catch {}
      const up = await uploadMedia(f, userId);
      if (up.error || !up.url) { setBusy(false); setErr('The photo did not upload. Try again.'); return; }
      media = up.url;
    }
    const { data, error } = await supabase.from('channel_posts').insert({ channel_id: channelId, author_id: userId, content: text.trim().slice(0, 4000) || null, media_url: media, media_type: media ? 'image' : null }).select().single();
    setBusy(false);
    if (error || !data) { setErr('That did not post. Try again.'); return; }
    setPosts((prev) => [data, ...(prev || [])]);
    setText(''); setFile(null); setPreview('');
    playUiSound('send');
    (async () => {
      const { data: fol } = await supabase.from('channel_follows').select('user_id, muted').eq('channel_id', channelId).limit(300);
      (fol || []).filter((r) => r.user_id !== userId && !r.muted).forEach((r) => sendPushNotification(r.user_id, ch.name, data.content ? String(data.content).slice(0, 120) : 'New photo', `/?channel=${channelId}`, ch.avatar || undefined));
    })();
  };
  const removePost = async (p) => {
    setPosts((prev) => (prev || []).filter((x) => x.id !== p.id));
    await supabase.from('channel_posts').delete().eq('id', p.id);
  };
  const share = async () => {
    if (!ch) return;
    const link = `${siteOrigin()}/?channel=${channelId}`;
    if (onShare) { onShare(ch); return; }
    try { if (navigator.share) await navigator.share({ title: ch.name, text: `Follow ${ch.name} on ZChat`, url: link }); else await copyTextToClipboard(link); } catch {}
  };
  return (
    <FullPage title={ch ? ch.name : 'Channel'} subtitle={`${formatCount(follow.n)} ${Number(follow.n) === 1 ? 'follower' : 'followers'}`} onBack={onClose} zIndex={78}
      right={<div role="button" aria-label="Share channel" onClick={share} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Share2 size={20} /></div>}
      footer={isAdmin ? (
        <div>
          {preview && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 8 }}>
              <img src={preview} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
              <div role="button" aria-label="Remove photo" onClick={() => { setFile(null); setPreview(''); }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={11} color="#FFFFFF" /></div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div role="button" aria-label="Add photo to post" onClick={() => fileRef.current && fileRef.current.click()} style={{ width: 42, height: 42, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: theme.ink }}><ImageIcon size={19} /></div>
            <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 4000))} placeholder="Post an update" aria-label="Channel update" rows={1} style={{ ...inputStyle(theme), flex: 1, resize: 'none', fontFamily: FONT, maxHeight: 120 }} />
            <div role="button" aria-label="Post update" onClick={post} style={{ width: 42, height: 42, borderRadius: '50%', background: text.trim() || file ? theme.coral : theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{busy ? <Spinner size={16} /> : <Send size={17} color={text.trim() || file ? '#FFFFFF' : theme.muted} />}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
        </div>
      ) : null}>
      {ch && (
        <div style={{ textAlign: 'center', padding: '16px 6px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar emoji={ch.avatar} name={ch.name} size={84} /></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, marginTop: 10, wordBreak: 'break-word' }}>{ch.name}</div>
          {ch.bio && <div data-zuser="" style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, marginTop: 6, wordBreak: 'break-word' }}>{ch.bio}</div>}
          {!isAdmin && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
              <div role="button" aria-label={follow.on ? 'Unfollow channel' : 'Follow channel'} onClick={toggleFollow} className="zchat-press" style={{ padding: '10px 22px', borderRadius: 14, background: follow.on ? theme.rowBg : theme.coral, color: follow.on ? theme.ink : '#FFFFFF', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>{follow.on ? 'Following' : 'Follow'}</div>
              {follow.on && <div role="button" aria-label={follow.muted ? 'Turn on channel alerts' : 'Mute channel alerts'} onClick={toggleMute} className="zchat-press" style={{ width: 42, borderRadius: 14, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}>{follow.muted ? <BellOff size={18} /> : <Bell size={18} />}</div>}
            </div>
          )}
        </div>
      )}
      {err && <div role="alert" style={{ padding: '10px 2px', fontSize: 13, fontWeight: 700, color: theme.danger, textAlign: 'center' }}>{err}</div>}
      {posts === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : !posts.length && !err ? (
        <EmptyState art="moments" title="No updates yet" text={isAdmin ? 'Post your first update below. Followers get a notification.' : 'Follow to get updates when they post.'} />
      ) : posts.map((p) => {
        const st = stats[p.id] || { likes: 0, liked: false };
        return (
          <div key={p.id} style={{ margin: '14px 0 0', padding: 12, borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
            {p.content && <div style={{ fontSize: 14.5, color: theme.ink, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><RichText text={p.content} /></div>}
            {p.media_url && <img src={p.media_url} alt="" loading="lazy" draggable={false} onClick={() => setView(p)} style={{ width: '100%', borderRadius: 14, marginTop: p.content ? 10 : 0, display: 'block', cursor: 'pointer', maxHeight: 420, objectFit: 'cover' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <div role="button" aria-label={st.liked ? 'Unlike update' : 'Like update'} onClick={() => like(p)} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: st.liked ? '#FF2D55' : theme.muted, fontSize: 13, fontWeight: 700 }}><Heart size={18} fill={st.liked ? '#FF2D55' : 'none'} />{st.likes || ''}</div>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: theme.muted }}>{timeAgoLong(p.created_at)}</span>
              {isAdmin && <div role="button" aria-label="Delete update" onClick={() => setAskDelete(p)} style={{ color: theme.muted, cursor: 'pointer', display: 'flex' }}><Trash2 size={16} /></div>}
            </div>
          </div>
        );
      })}
      {view && <Portal><ImageViewer url={view.media_url} caption={view.content || ''} onClose={() => setView(null)} /></Portal>}
      {askDelete && <ConfirmSheet title="Delete this update?" confirmLabel="Delete" zIndex={96} onCancel={() => setAskDelete(null)} onConfirm={() => { const p = askDelete; setAskDelete(null); removePost(p); }} />}
    </FullPage>
  );
}

function ReelVideo({ post, rootRef, onDoubleTap }) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const barRef = useRef(null);
  const tapAtRef = useRef(0);
  const tapTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const pausedByUserRef = useRef(false);
  const [muted, setMuted] = useState(true);
  const [flash, setFlash] = useState(null);
  const [portrait, setPortrait] = useState(false);
  const showFlash = (kind) => {
    setFlash(kind);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 550);
  };
  useEffect(() => {
    const el = videoRef.current;
    const wrap = wrapRef.current;
    if (!el || !wrap) return undefined;
    const start = () => { const p = el.play(); if (p && p.catch) p.catch(() => {}); };
    if (typeof IntersectionObserver === 'undefined') { start(); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && en.intersectionRatio >= 0.6) {
          if (!pausedByUserRef.current) start();
        } else {
          el.pause();
          if (!en.isIntersecting) { pausedByUserRef.current = false; try { el.currentTime = 0; } catch {} }
        }
      });
    }, { root: (rootRef && rootRef.current) || null, threshold: [0, 0.6, 1] });
    io.observe(wrap);
    return () => io.disconnect();
  }, []);
  useEffect(() => { if (videoRef.current) videoRef.current.muted = muted; }, [muted]);
  useEffect(() => () => { clearTimeout(tapTimerRef.current); clearTimeout(flashTimerRef.current); }, []);
  const togglePause = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      pausedByUserRef.current = false;
      const p = el.play(); if (p && p.catch) p.catch(() => {});
      showFlash('play');
    } else {
      pausedByUserRef.current = true;
      el.pause();
      showFlash('pause');
    }
  };
  const onTap = () => {
    const now = Date.now();
    if (now - tapAtRef.current < 280) {
      clearTimeout(tapTimerRef.current);
      tapAtRef.current = 0;
      if (onDoubleTap) onDoubleTap();
      return;
    }
    tapAtRef.current = now;
    tapTimerRef.current = setTimeout(() => { tapAtRef.current = 0; togglePause(); }, 280);
  };
  return (
    <div ref={wrapRef} onClick={onTap} data-reel-video={post.id} style={{ position: 'absolute', inset: 0 }}>
      <video ref={videoRef} src={post.media_url} playsInline loop muted preload="auto"
        onLoadedMetadata={(e) => setPortrait(e.currentTarget.videoHeight >= e.currentTarget.videoWidth)}
        onTimeUpdate={(e) => { const v = e.currentTarget; if (barRef.current && v.duration) barRef.current.style.width = `${Math.min(100, (v.currentTime / v.duration) * 100)}%`; }}
        style={{ width: '100%', height: '100%', objectFit: portrait ? 'cover' : 'contain' }} />
      {flash && (
        <div className="zchat-pop" style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -32, marginTop: -32, width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {flash === 'pause' ? <Pause size={30} color="white" fill="white" /> : <Play size={30} color="white" fill="white" />}
        </div>
      )}
      <div role="button" aria-label={muted ? 'Turn sound on' : 'Turn sound off'} onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
        style={{ position: 'absolute', top: 'calc(64px + env(safe-area-inset-top))', right: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 4 }}>
        {muted ? <VolumeX size={18} color="white" /> : <Volume2 size={18} color="white" />}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }}>
        <div ref={barRef} style={{ height: '100%', width: 0, background: 'white' }} />
      </div>
      <VideoCC videoRef={videoRef} track={psCcTrack(post, post.media_url)} full />
    </div>
  );
}
