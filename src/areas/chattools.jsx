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
  SAVED_BLUE,
  jsonAfter,
  uploadMedia,
  openPermHelp,
  permDenied,
  AX_TABS_DEFAULT,
  AX_TAB_KEYS,
  ActionSheet,
  AiCardsGlyph,
  AiPracticeGlyph,
  AiTalkGlyph,
  AlbumIcon,
  AskPhotoIcon,
  AudioBubble,
  Avatar,
  AxTabGlyph,
  BADGE_SHAPE_PATH,
  BOMB_MAX,
  BOT_FOLLOWER_BASE,
  BUBBLE_COLORS,
  BUBBLE_CW,
  BackupViewerPage,
  BigButton,
  BroadcastIcon,
  CHAR_BUBBLES,
  CM_FANCY,
  COMPOSER_AUTOSIZE,
  COUNTRIES,
  CalendarIcon,
  ChannelIcon,
  CharBubbleDecor,
  ChatThemePage,
  ChoiceList,
  CommunityGlyph,
  ConfirmDialog,
  ConfirmSheet,
  DRAFT_MAX,
  DayDivider,
  DetailRow,
  DetailSection,
  DraftThumb,
  EditHistoryIcon,
  EmptyState,
  FONT,
  FONT_STYLES,
  FolderIcon,
  FollowActionButton,
  FollowListModal,
  FullPage,
  GamepadIcon,
  GroupAvatar,
  HeaderIconButton,
  IgHeading,
  IgRow,
  IgToggle,
  IgTopBar,
  ImageViewer,
  JOIN_DONE,
  JOIN_ROWS,
  LINK_REGEX,
  LineGlyph,
  LineTabs,
  ListModal,
  LoadFail,
  MAX_CHARS,
  MailBadgeIcon,
  MediaImg,
  NameBadge,
  PROFILE_COLS,
  PageArt,
  PickTiles,
  PillButton,
  Pin_,
  Portal,
  PostTile,
  PreviewLine,
  QRD_EXP,
  QRD_LOG,
  QR_LOGIN_ID,
  ReportReasonPicker,
  RichText,
  SOUNDBOARD,
  SavedPostsGrid,
  SegmentedControl,
  SpamShieldIcon,
  Spinner,
  StudioGlyph,
  TEXT_SIZES,
  TOOL_RAW_ERRORS,
  TRANSLATE_LANGS,
  TextBombIcon,
  TranslateIcon,
  UserListRow,
  VaultPinPage,
  VerifiedBadge,
  VideoThumb,
  VideoViewer,
  ViewerTopBar,
  WaImportIcon,
  WideDim,
  aiVoiceOk,
  albumChatKey,
  announceDrafts,
  appAlert,
  appSnack,
  autoTrFor,
  axCvColor,
  axLook,
  axLookApply,
  axPrefs,
  axSet,
  axTabsOf,
  badgeTierFromTitle,
  billMoney,
  bubbleKeyOf,
  bubbleLayout,
  bubbleWrapCss,
  charBubbleCss,
  chatMarksMem,
  chatPrefKey,
  chatThemeThem,
  chosenPeopleMem,
  cmFancyText,
  copyTextToClipboard,
  countWord,
  countryFlag,
  customTones,
  dayDividerLabel,
  defaultTranslateLang,
  deleteDraft,
  disappearLabel,
  draftSync,
  ensureAudioCtx,
  ensureTextFonts,
  favoriteSync,
  fetchMyProfile,
  fetchPeerKey,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  fmtUsage,
  followRequestsMem,
  followSync,
  fontStyleCss,
  formatBytes,
  formatCount,
  formatListTime,
  friendlyError,
  g1Name,
  g1Questions,
  groupRankOf,
  hapticTap,
  hiddenWordsCfg,
  histCur,
  histServerRow,
  identitySqlKnown,
  igPalette,
  inputStyle,
  isG1Welcome,
  isNetworkProblem,
  isPrivateMedia,
  isSpecialContent,
  isTouchDevice,
  joinRowsFresh,
  kitOnInk,
  langChoiceOptions,
  latestSync,
  linkifyText,
  listenNow,
  loadAlbumsFor,
  loadCustomTones,
  loadFailCode,
  loadImageEl,
  loadImageElement,
  loadJoinRows,
  loadSavedFolders,
  loadSprite,
  mailPanelMem,
  makeAccentPalette,
  mediaCacheKey,
  mediaDbOp,
  messageTextFor,
  myDeviceKey,
  notYetPosted,
  parseBlur,
  parseEventMsg,
  parseExtraCard,
  parseGameMessage,
  parseLocationMessage,
  parseOnce,
  parsePoll,
  parseProfileLink,
  parseWrapped,
  peoplePickerMem,
  plainPreviewText,
  playSoundboard,
  playUiSound,
  pollPicks,
  prepareImageFile,
  primaryBtn,
  privacyAllows,
  processToneBlob,
  profileStatsCache,
  publishDeviceKey,
  pushFoldersRemote,
  putSavedFolders,
  qrAlignments,
  qrLoginOpen,
  qrRawModules,
  quoteTextFor,
  readChatTabs,
  readFolders,
  readJsonLs,
  readQuickReplies,
  readReminders,
  readUsage,
  readVault,
  readersOf,
  realFolderId,
  reducedMotion,
  reminderWhen,
  resolveMedia,
  rpcFailText,
  rpcMissing,
  rtDrop,
  rtKeep,
  rtName,
  rtOnRefresh,
  safeLinkUrl,
  sanitizeAvatarList,
  saveFoldersEverywhere,
  saveHiddenWordsCfg,
  saveProfileStats,
  savedFolderErr,
  savedFolderPending,
  savedFoldersMem,
  savedFoldersOf,
  savedMessagesMem,
  searchAccounts,
  searchPageMem,
  secretSupported,
  sendPushNotification,
  sha256Hex,
  shrinkChatPhoto,
  signedMediaNow,
  specialPreview,
  spriteBufs,
  storyLongPress,
  textSizePx,
  themeGradCss,
  timeAgoLong,
  toolErrorText,
  uploadChatMedia,
  uploadCustomTone,
  usageDayKey,
  usageLimitMin,
  useAx,
  useBackClose,
  useCachedMedia,
  useEdgeSwipeBack,
  useGroupReads,
  useMediaUrl,
  usePref,
  useSheetDrag,
  useTheme,
  useVault,
  useWaImports,
  waCountText,
  waIdx,
  waIdxRefresh,
  waIdxSet,
  waMissing,
  waRange,
  writeJsonLs,
  writeReminders,
  writeVault,
  zchatAichat,
  zchatTools,
} from '../App.jsx';
import {
  AX_TAB_INFO,
  AxTabsPreview,
  BubblesIcon,
  CharBubbleSample,
  ChatToolsSection,
  DetailActions,
  DetailTiles,
  DisappearSheet,
  KitSection,
  KitSlider,
  MediaStrip,
  MediaVideo,
  PdfGlyph,
  PhotoFindIcon,
  SensTileVeil,
  SettingsRowPlain,
  ThemeIcon,
  UnderTabs,
  aiToolOpen,
  aipFit,
  aipImageData,
  aipToken,
  axLookNow,
  detailRows,
  draftDateLabel,
  lastBackupLabel,
  openDraftFull,
  readZipIndex,
  useDraftList,
  useOwnedBubbles,
  useTrendingTags,
  zipEntryBlob,
} from './shared.jsx';

function setAxLook(patch) {
  Object.assign(axLook, patch);
  try { localStorage.setItem('zchat-bold-text', axLook.bold ? '1' : '0'); localStorage.setItem('zchat-colour-vision', axLook.cv); } catch {}
  axLookApply();
  axLook.subs.forEach((f) => { try { f(); } catch {} });
}
function useAxLook() {
  return React.useSyncExternalStore((f) => { axLook.subs.add(f); return () => axLook.subs.delete(f); }, axLookNow, axLookNow);
}
function parseQrLoginLink(text) {
  try {
    const u = new URL(String(text || '').trim());
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    const id = u.searchParams.get('qr');
    return id && QR_LOGIN_ID.test(id) ? id : null;
  } catch { return null; }
}

export function RequestsPage({ items, onOpen, onClose, unreadOf, hidePreviews, spamCount = 0, onOpenSpam }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  return (
    <FullPage title="Message requests" subtitle={items.length ? `${items.length} waiting` : 'Nothing waiting'} onBack={onClose} zIndex={58} pad={false}>
      <div style={{ padding: '10px 18px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Chats from people you do not follow land here. They will not know you saw a message until you accept.</div>
      {spamCount > 0 && onOpenSpam && (
        <div role="button" aria-label={`Possible spam ${spamCount}`} onClick={onOpenSpam} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 8px 2px', padding: '12px 10px', borderRadius: 14, cursor: 'pointer' }}>
          <span style={{ width: 50, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><SpamShieldIcon size={24} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: theme.ink }}>Possible spam</span>
            <span style={{ display: 'block', fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Scams, ads and mass messages</span>
          </span>
          <span style={{ fontSize: 13, color: theme.muted, fontWeight: 700 }}>{spamCount}</span>
          <ChevronRight size={16} color={theme.muted} />
        </div>
      )}
      <div style={{ padding: '0 8px calc(24px + env(safe-area-inset-bottom))' }}>
        {!items.length && <EmptyState art="requests" title="No requests" text="When someone you do not follow messages you, it shows up here first." />}
        {items.map((c) => {
          const p = c.otherProfile;
          const unread = unreadOf ? unreadOf(c) : 0;
          const pv = hidePreviews ? { kind: 'text', text: unread ? 'New message' : 'Message hidden' } : (c.preview && c.preview.text ? c.preview : { kind: 'text', text: 'Sent you a message' });
          return (
            <div key={p.id} role="button" aria-label={`Request from ${p.name}`} onClick={() => onOpen(c)} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 14, cursor: 'pointer' }}>
              <Avatar emoji={p.avatar} name={p.name} size={50} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: unread ? 800 : 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                <PreviewLine preview={pv} color={unread ? theme.ink : theme.muted} weight={unread ? 700 : 400} size={13} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 11.5, color: unread ? theme.coral : theme.muted, fontWeight: unread ? 700 : 400 }}>{c.sortTime || c.last_message_at ? formatListTime(c.sortTime || c.last_message_at) : ''}</span>
                {unread > 0 && <span style={{ minWidth: 20, height: 20, padding: '0 5px', boxSizing: 'border-box', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread > 99 ? '99+' : unread}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </FullPage>
  );
}
export function PeoplePickerPage({ title, subtitle, note, table, ownerCol, otherCol, myId, onClose, onCount, zIndex = 70, scope = null }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const pickKey = `${table}:${myId}${scope ? `:${JSON.stringify(scope)}` : ''}`;
  const pickMem = peoplePickerMem.get(pickKey);
  const [people, setPeople] = useState(() => (pickMem ? pickMem.people : null));
  const [picked, setPicked] = useState(() => (pickMem ? new Set(pickMem.picked) : new Set()));
  const [q, setQ] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const busy = useRef(new Set());
  const pickTouchRef = useRef(new Map());
  useEffect(() => { if (people) peoplePickerMem.set(pickKey, { people, picked: [...picked] }); }, [people, picked]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: a }, { data: b }, { data: cur, error }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted'),
        supabase.from('follows').select('follower_id').eq('following_id', myId).eq('status', 'accepted'),
        supabase.from(table).select(otherCol).eq(ownerCol, myId).match(scope || {}).limit(2000),
      ]);
      if (!alive) return;
      if (error) setUnavailable(true);
      const chosen = new Set((cur || []).map((r) => r[otherCol]));
      pickTouchRef.current.forEach((v, id) => { if (v) chosen.add(id); else chosen.delete(id); });
      if (!error) setPicked(chosen);
      const ids = [...new Set([...(a || []).map((r) => r.following_id), ...(b || []).map((r) => r.follower_id), ...chosen])].filter((x) => x && x !== myId);
      if (!ids.length) { setPeople([]); return; }
      const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge, is_bot, is_deleted').in('id', ids);
      if (!alive) return;
      setPeople(sanitizeAvatarList(profs || [], myId).filter((x) => !x.is_deleted && !x.is_bot).sort((x, y) => (x.name || '').localeCompare(y.name || '')));
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (onCount) onCount(picked.size); }, [picked]);
  const toggle = async (id) => {
    if (unavailable) return;
    const has = picked.has(id);
    pickTouchRef.current.set(id, !has);
    setPicked((prev) => { const n = new Set(prev); if (has) n.delete(id); else n.add(id); return n; });
    hapticTap();
    const res = await latestSync(`pick:${pickKey}:${id}`, !has, (on) => (on
      ? supabase.from(table).insert({ [ownerCol]: myId, [otherCol]: id, ...(scope || {}) })
      : supabase.from(table).delete().eq(ownerCol, myId).eq(otherCol, id).match(scope || {})), has);
    if (!res.ok) {
      const dup = /duplicate|unique/i.test(String((res.error && res.error.message) || ''));
      if (dup) return;
      const back = res.state === undefined ? has : res.state;
      pickTouchRef.current.set(id, back);
      setPicked((prev) => { const n = new Set(prev); if (back) n.add(id); else n.delete(id); return n; });
      if (/schema|relation|does not exist|PGRST20/i.test(String((res.error && (res.error.message || res.error.code)) || ''))) setUnavailable(true);
      else appSnack(friendlyError(res.error, "That change didn't save. Try again."));
    }
  };
  const term = q.trim().toLowerCase();
  const shown = (people || []).filter((p) => !term || String(p.name || '').toLowerCase().includes(term) || String(p.username || '').toLowerCase().includes(term));
  return (
    <FullPage title={title} subtitle={`${picked.size} picked`} onBack={onClose} zIndex={zIndex} pad={false}>
      <div style={{ padding: '6px 16px 4px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{subtitle}</div>
      <div style={{ padding: '6px 16px 8px', position: 'sticky', top: 0, zIndex: 2, background: igPalette(theme).bg }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted }}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label={`Search ${title}`} autoCapitalize="none" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        </label>
      </div>
      {unavailable && <div role="alert" style={{ margin: '4px 16px 8px', padding: 12, borderRadius: 14, background: theme.rowBg, fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>This list is almost ready. It switches on once the latest ZChat setup is finished.</div>}
      <div style={{ padding: '0 8px calc(24px + env(safe-area-inset-bottom))' }}>
        {people === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>}
        {people && !people.length && <EmptyState art="nothing" title="Nobody to pick yet" text="Follow people or get followers and they show up here." />}
        {shown.map((p) => {
          const on = picked.has(p.id);
          return (
            <div key={p.id} role="button" aria-label={`${on ? 'Remove' : 'Add'} ${p.name}`} onClick={() => toggle(p.id)} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 14, cursor: 'pointer' }}>
              <Avatar emoji={p.avatar} name={p.name} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                <div style={{ fontSize: 12.5, color: theme.muted }}>@{p.username}</div>
              </div>
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${on ? theme.coral : theme.muted}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {on && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </span>
            </div>
          );
        })}
        {note && <div style={{ padding: '14px 10px', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>{note}</div>}
      </div>
    </FullPage>
  );
}
function MediaAudio({ src, ...rest }) {
  const url = useMediaUrl(src);
  return url ? <audio src={url} {...rest} /> : null;
}

export function LimitsPage({ me, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [until, setUntil] = useState((me && me.limits_until) || null);
  const [strangers, setStrangers] = useState(!(me && me.limit_strangers === false));
  const [recent, setRecent] = useState(!(me && me.limit_recent === false));
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const active = !!until && new Date(until).getTime() > Date.now();
  const save = async (patch) => {
    setErr('');
    const { error } = await supabase.from('profiles').update(patch).eq('id', me.id);
    if (error) { setErr(/limit|column|schema/i.test(String(error.message || '')) ? 'Limits switch on once the latest ZChat setup is finished.' : friendlyError(error, 'That could not be saved. Try again.')); return false; }
    onSaved(patch);
    return true;
  };
  const turnOn = async () => {
    if (!strangers && !recent) { setErr('Pick at least one group of accounts to limit.'); return; }
    const u = new Date(Date.now() + days * 86400000).toISOString();
    const before = until;
    setUntil(u);
    hapticTap();
    if (!(await save({ limits_until: u, limit_strangers: strangers, limit_recent: recent }))) setUntil(before);
  };
  const turnOff = async () => { const before = until; setUntil(null); hapticTap(); if (!(await save({ limits_until: null }))) setUntil(before); };
  const toggle = async (which) => {
    const next = which === 'strangers' ? !strangers : !recent;
    if (which === 'strangers') setStrangers(next); else setRecent(next);
    if (active && !(await save(which === 'strangers' ? { limit_strangers: next } : { limit_recent: next }))) { if (which === 'strangers') setStrangers(!next); else setRecent(!next); }
  };
  const untilText = until ? new Date(until).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '';
  return (
    <FullPage title="Limits" subtitle={active ? `On until ${untilText}` : 'Off'} onBack={onClose} zIndex={72}
      footer={<BigButton label={busy ? 'Saving' : active ? 'Turn off limits' : 'Turn on limits'} tone={active ? 'plain' : 'accent'} disabled={busy} onClick={active ? turnOff : turnOn} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '8px 4px 4px', textWrap: 'pretty' }}>Getting too much attention? Limits quietly stop comments, story replies and new message requests from the accounts below for a while. People you follow are never limited, and nobody is told.</div>
      <IgHeading>Limit these accounts</IgHeading>
      <div role="button" aria-label={`Accounts that do not follow you ${strangers ? 'on' : 'off'}`} onClick={() => toggle('strangers')} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Accounts that do not follow you</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>Includes brand new accounts</div>
        </div>
        <IgToggle on={strangers} />
      </div>
      <div role="button" aria-label={`Recent followers ${recent ? 'on' : 'off'}`} onClick={() => toggle('recent')} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Recent followers</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>Accounts that followed you in the last week</div>
        </div>
        <IgToggle on={recent} />
      </div>
      {!active && (
        <>
          <IgHeading>How long</IgHeading>
          <ChoiceList label="How long" value={days} onChange={setDays}
            options={[[1, '1 day'], [3, '3 days'], [7, '1 week'], [14, '2 weeks'], [28, '4 weeks']].map(([d, l]) => ({ k: d, label: l, sub: `Until ${new Date(Date.now() + d * 86400000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}` }))} />
        </>
      )}
      {err && <div role="alert" style={{ padding: '10px 4px', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
    </FullPage>
  );
}

const ZIP_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function zipCrc32(u8) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < u8.length; i++) c = ZIP_CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function makeZipBlob(files) {
  const enc = new TextEncoder();
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
  files.forEach((f) => {
    const name = enc.encode(f.name);
    const data = f.data;
    const crc = zipCrc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true); lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true); ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true); ch.setUint16(28, name.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + data.length;
  });
  const cdSize = central.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

function backupWhat(m) {
  if (m.type === 'text') {
    const w = parseWrapped(m.content);
    if (w && w.k === 'sec') return '[Secret message]';
    return specialPreview(m.content) || messageTextFor(m);
  }
  if (m.type === 'system') return String(m.content || '');
  if (m.type === 'image') return m.content || '';
  if (m.type === 'video') return m.content || '';
  if (m.type === 'audio') return '';
  if (m.type === 'sticker') return '[Sticker]';
  return m.content ? String(m.content) : '';
}
function backupExt(m, mime) {
  const t = String(mime || '').toLowerCase();
  if (/jpeg|jpg/.test(t)) return 'jpg';
  if (/png/.test(t)) return 'png';
  if (/webp/.test(t)) return 'webp';
  if (/gif/.test(t)) return 'gif';
  if (/mp4/.test(t)) return 'mp4';
  if (/webm/.test(t)) return m.type === 'audio' ? 'weba' : 'webm';
  if (/ogg/.test(t)) return 'ogg';
  if (/mpeg|mp3/.test(t)) return 'mp3';
  if (/wav/.test(t)) return 'wav';
  if (/m4a|aac/.test(t)) return 'm4a';
  return m.type === 'image' ? 'jpg' : m.type === 'audio' ? 'webm' : m.type === 'video' ? 'mp4' : 'bin';
}
function backupEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function backupHtml(data) {
  const people = data.people || {};
  const chats = data.chats || [];
  const nameOf = (id) => (id === data.me.id ? 'You' : (people[id] && people[id].name) || 'Someone');
  const chatHtml = chats.map((c, ci) => {
    const rows = c.messages.map((m) => {
      const mine = m.from === data.me.id;
      const media = m.media ? (m.type === 'image' ? `<img src="${backupEsc(m.media)}" loading="lazy" alt="">` : m.type === 'video' ? `<video src="${backupEsc(m.media)}" controls preload="none"></video>` : m.type === 'audio' ? `<audio src="${backupEsc(m.media)}" controls preload="none"></audio>` : '') : (m.type === 'image' ? '<i>Photo</i>' : m.type === 'video' ? '<i>Video</i>' : m.type === 'audio' ? '<i>Voice message</i>' : '');
      const who = c.kind === 'group' && !mine ? `<b>${backupEsc(nameOf(m.from))}</b>` : '';
      return `<div class="m ${mine ? 'me' : ''}">${who}${media}${m.text ? `<p>${backupEsc(m.text)}</p>` : ''}<s>${backupEsc(new Date(m.at).toLocaleString())}</s></div>`;
    }).join('');
    return `<section id="c${ci}"><h2>${backupEsc(c.title)}</h2>${rows}</section>`;
  }).join('');
  const list = chats.map((c, ci) => `<a href="#c${ci}">${backupEsc(c.title)} <span>${c.messages.length}</span></a>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ZChat backup</title><style>
body{margin:0;font:15px/1.4 system-ui,sans-serif;background:#f4f3f8;color:#16151c}header{padding:20px 16px;background:#7C5CFC;color:#fff}header h1{margin:0;font-size:22px}header p{margin:4px 0 0;opacity:.85}
nav{display:flex;flex-direction:column;gap:2px;padding:12px}nav a{display:flex;justify-content:space-between;padding:12px 14px;border-radius:12px;background:#fff;color:inherit;text-decoration:none;font-weight:600}nav a span{color:#8a8794;font-weight:500}
section{max-width:720px;margin:0 auto;padding:12px}section h2{position:sticky;top:0;background:#f4f3f8;padding:10px 4px;margin:0;font-size:17px}
.m{max-width:78%;margin:6px 0;padding:8px 12px;border-radius:16px;background:#fff;word-wrap:break-word}.m.me{margin-left:auto;background:#E4DCFF}.m p{margin:0;white-space:pre-wrap}.m b{display:block;font-size:12px;color:#6B48F0}.m s{display:block;text-decoration:none;font-size:11px;color:#8a8794;margin-top:3px}.m img,.m video{display:block;max-width:100%;border-radius:10px;margin:2px 0 4px}.m audio{width:240px;max-width:100%}
</style></head><body><header><h1>ZChat backup</h1><p>${backupEsc(data.me.name || '')} @${backupEsc(data.me.username || '')}, ${backupEsc(new Date(data.created_at).toLocaleString())}</p></header><nav>${list}</nav>${chatHtml}</body></html>`;
}

async function buildChatBackup({ myId, me, withMedia, withVideos, withAccount, onProgress, aliveRef }) {
  const alive = () => !aliveRef || aliveRef.current;
  const step = (phase, done, total) => { if (onProgress) onProgress({ phase, done, total }); };
  const hiddenRes = await supabase.from('hidden_messages').select('message_id').eq('user_id', myId).limit(10000);
  const hidden = new Set(((hiddenRes && hiddenRes.data) || []).map((r) => String(r.message_id)));
  const all = [];
  const page = async (build) => {
    let before = null;
    for (let guard = 0; guard < 80 && alive(); guard++) {
      let q = build().order('created_at', { ascending: false }).limit(1000);
      if (before) q = q.lt('created_at', before);
      const { data, error } = await q;
      if (error) throw error;
      const rows = data || [];
      rows.forEach((m) => { if (!m.deleted && !hidden.has(String(m.id))) all.push(m); });
      step('messages', all.length, 0);
      if (rows.length < 1000) break;
      before = rows[rows.length - 1].created_at;
    }
  };
  await page(() => supabase.from('messages').select('*').or(`sender_id.eq.${myId},receiver_id.eq.${myId}`).is('group_id', null));
  const { data: gm } = await supabase.from('group_members').select('group_id').eq('user_id', myId).limit(500);
  const groupIds = [...new Set((gm || []).map((r) => r.group_id))];
  for (let i = 0; i < groupIds.length && alive(); i += 40) {
    const ids = groupIds.slice(i, i + 40);
    await page(() => supabase.from('messages').select('*').in('group_id', ids));
  }
  if (!alive()) return null;
  const peopleIds = new Set();
  all.forEach((m) => { if (m.sender_id) peopleIds.add(m.sender_id); if (m.receiver_id) peopleIds.add(m.receiver_id); });
  const people = {};
  const pl = [...peopleIds];
  for (let i = 0; i < pl.length; i += 200) {
    const { data } = await supabase.from('profiles').select('id, name, username').in('id', pl.slice(i, i + 200));
    (data || []).forEach((p) => { people[p.id] = { name: p.name || '', username: p.username || '' }; });
  }
  const groups = {};
  if (groupIds.length) {
    const { data } = await supabase.from('groups').select('id, name').in('id', groupIds);
    (data || []).forEach((g) => { groups[g.id] = { name: g.name || 'Group' }; });
  }
  const chatsMap = new Map();
  all.slice().reverse().forEach((m) => {
    const key = m.group_id ? `g:${m.group_id}` : `d:${m.sender_id === myId ? m.receiver_id : m.sender_id}`;
    if (!chatsMap.has(key)) {
      const other = m.group_id ? null : (m.sender_id === myId ? m.receiver_id : m.sender_id);
      chatsMap.set(key, { kind: m.group_id ? 'group' : 'dm', id: m.group_id || other, title: m.group_id ? ((groups[m.group_id] || {}).name || 'Group') : ((people[other] || {}).name || 'Someone'), messages: [] });
    }
    chatsMap.get(key).messages.push(m);
  });
  const files = [];
  const mediaJobs = [];
  const chats = [...chatsMap.values()].map((c) => ({
    kind: c.kind,
    id: c.id,
    title: c.title,
    messages: c.messages.map((m) => {
      const once = parseOnce(m);
      const want = !!m.media_url && !once && withMedia && (m.type === 'image' || m.type === 'audio' || (m.type === 'video' && withVideos));
      const row = { id: m.id, from: m.sender_id, at: m.created_at, type: m.type, text: once ? '[View once]' : backupWhat(m), media: null };
      if (want) mediaJobs.push({ m, row });
      return row;
    }),
  })).sort((a, b) => new Date(b.messages[b.messages.length - 1].at) - new Date(a.messages[a.messages.length - 1].at));
  let done = 0;
  const enc = new TextEncoder();
  const queue = mediaJobs.slice();
  const worker = async () => {
    while (queue.length && alive()) {
      const job = queue.shift();
      try {
        const url = await resolveMedia(job.m.media_url);
        if (url) {
          const res = await fetch(url);
          if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 0 && blob.size <= 40 * 1024 * 1024) {
              const name = `media/${job.m.id}.${backupExt(job.m, blob.type)}`;
              files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
              job.row.media = name;
            }
          }
        }
      } catch {}
      done += 1;
      step('media', done, mediaJobs.length);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (!alive()) return null;
  step('packing', 0, 0);
  const data = { app: 'ZChat', version: 1, created_at: new Date().toISOString(), me: { id: myId, name: (me && me.name) || '', username: (me && me.username) || '' }, people, groups, chats };
  files.unshift({ name: 'chats.json', data: enc.encode(JSON.stringify(data)) });
  files.splice(1, 0, { name: 'chats.html', data: enc.encode(backupHtml(data)) });
  if (withAccount) {
    const [prof, posts, following, followers] = await Promise.all([
      fetchMyProfile(),
      supabase.from('posts').select('id, caption, media_url, media_type, created_at').eq('user_id', myId).order('created_at', { ascending: false }).limit(2000),
      supabase.from('follows').select('following_id, status, created_at').eq('follower_id', myId).limit(5000),
      supabase.from('follows').select('follower_id, status, created_at').eq('following_id', myId).limit(5000),
    ]);
    const p = (prof && prof.data) || {};
    const safeProfile = Object.fromEntries(Object.entries(p).filter(([k]) => !/hash|secret|token|device|lock/i.test(k)));
    files.push({ name: 'account.json', data: enc.encode(JSON.stringify({ profile: safeProfile, posts: (posts && posts.data) || [], following: (following && following.data) || [], followers: (followers && followers.data) || [] }, null, 1)) });
  }
  const blob = makeZipBlob(files);
  return { blob, chats: chats.length, messages: all.length, media: mediaJobs.filter((j) => j.row.media).length };
}

function backupFileName() {
  const d = new Date();
  return `ZChat backup ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} ${d.getFullYear()}.zip`;
}

export function ChatBackupPage({ me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [withMedia, setWithMedia] = useState(true);
  const [withVideos, setWithVideos] = useState(false);
  const [withAccount, setWithAccount] = useState(true);
  const [state, setState] = useState('idle');
  const [prog, setProg] = useState({ phase: '', done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [viewer, setViewer] = useState(null);
  const aliveRef = useRef(true);
  const openRef = useRef(null);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const start = async () => {
    setErr(''); setResult(null); setState('working'); aliveRef.current = true;
    try {
      const r = await buildChatBackup({ myId: me.id, me, withMedia, withVideos, withAccount, onProgress: (p) => setProg(p), aliveRef });
      if (!r) return;
      setResult(r); setState('done');
      try { localStorage.setItem('zchat-last-backup', new Date().toISOString()); } catch {}
      playUiSound('repost');
    } catch { if (aliveRef.current) { setState('idle'); setErr('The backup stopped. Check your connection and try again.'); } }
  };
  const cancel = () => { aliveRef.current = false; setState('idle'); setProg({ phase: '', done: 0, total: 0 }); };
  const save = async () => {
    if (!result) return;
    const name = backupFileName();
    const file = new File([result.blob], name, { type: 'application/zip' });
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) { await navigator.share({ files: [file], title: name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    const href = URL.createObjectURL(file);
    const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 8000);
  };
  const openFile = (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setViewer(f); };
  const phaseText = prog.phase === 'messages' ? `Collecting messages ${formatCount(prog.done)}` : prog.phase === 'media' ? `Saving photos and voice ${prog.done} of ${prog.total}` : prog.phase === 'packing' ? 'Packing your backup' : 'Starting';
  const pct = prog.phase === 'media' && prog.total ? Math.round((prog.done / prog.total) * 100) : prog.phase === 'packing' ? 100 : null;
  const toggleRow = (label, sub, on, set, aria) => (
    <div role="button" aria-label={`${aria} ${on ? 'on' : 'off'}`} onClick={() => { if (state === 'working') return; hapticTap(); set(!on); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 4px', cursor: 'pointer', opacity: state === 'working' ? 0.5 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      <IgToggle on={on} />
    </div>
  );
  return (
    <FullPage title="Chat backup" subtitle={`Last backup ${lastBackupLabel().toLowerCase()}`} onBack={onClose} zIndex={72}
      footer={state === 'done'
        ? <BigButton label="Save backup file" onClick={save} />
        : state === 'working' ? <BigButton label="Cancel" tone="plain" onClick={cancel} /> : <BigButton label="Back up now" onClick={start} />}>
      <input ref={openRef} type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={openFile} />
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '8px 4px 4px', textWrap: 'pretty' }}>Save a copy of your chats as a file on your phone. You can open it later in ZChat, or in any browser, even if the chats were deleted.</div>
      {state === 'working' && (
        <div style={{ padding: '18px 4px 6px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{phaseText}</div>
          <div style={{ height: 6, borderRadius: 3, background: theme.rowBg, overflow: 'hidden', marginTop: 10 }}>
            <div className={pct === null ? 'zmap-shimmer' : undefined} style={{ height: '100%', width: pct === null ? '100%' : `${pct}%`, background: pct === null ? undefined : theme.coral, transition: 'width 200ms' }} />
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 8 }}>Keep ZChat open until it finishes.</div>
        </div>
      )}
      {state === 'done' && result && (
        <div style={{ padding: '18px 4px 6px' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>Your backup is ready</div>
          <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4, lineHeight: 1.5 }}>{formatCount(result.messages)} messages in {result.chats} {result.chats === 1 ? 'chat' : 'chats'}{result.media ? `, ${countWord(result.media, 'photo or voice message', 'photos and voice messages')}` : ''}. {formatBytes(result.blob.size)}.</div>
        </div>
      )}
      {state !== 'working' && (
        <>
          <IgHeading>What to include</IgHeading>
          {toggleRow('Photos and voice messages', 'View once media is never saved', withMedia, setWithMedia, 'Photos and voice messages')}
          {withMedia && toggleRow('Videos', 'Makes the file much bigger', withVideos, setWithVideos, 'Videos')}
          {toggleRow('My account info', 'Profile, posts and followers', withAccount, setWithAccount, 'My account info')}
          <IgHeading>Open a backup</IgHeading>
          <IgRow inset={false} icon={<Archive />} label="Open a backup file" sub="Read old chats from a ZChat backup" onClick={() => openRef.current && openRef.current.click()} />
        </>
      )}
      {err && <div role="alert" style={{ padding: '10px 4px', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
      {viewer && <BackupViewerPage file={viewer} myId={me.id} onClose={() => setViewer(null)} />}
    </FullPage>
  );
}

const PRIVACY_CHOICES = [
  ['everyone', 'Everyone'],
  ['followers', 'My followers'],
  ['chosen', 'Only chosen people'],
];
const PRIVACY_ITEMS = [
  ['privacy_profile', 'Who can see my profile', 'Your posts, followers and highlights'],
  ['privacy_bio', 'Who can see my bio and links', 'The text and links on your profile'],
  ['privacy_online', 'Who can see when I am online', 'The green dot beside your name'],
  ['privacy_lastseen', 'Who can see my last seen', 'When you were last on ZChat'],
  ['privacy_tags', 'Who can tag me', 'Mentions in stories and tags in photos'],
  ['privacy_groups', 'Who can add me to groups', 'Everyone else has to ask first'],
  ['privacy_leaderboard', 'Who can see me on leaderboards', 'Others see Hidden player and cannot open your profile from there'],
];
const PRIVACY_EXTRA_CHOICES = { privacy_leaderboard: [['nobody', 'Nobody']] };
function privacyChoicesFor(key) { return [...PRIVACY_CHOICES, ...(PRIVACY_EXTRA_CHOICES[key] || [])]; }
export function WhoCanSeePanel({ me, onBack, onSaved, initialOpen }) {
  useBackClose(true, onBack);
  const { theme } = useTheme();
  const swipe = useEdgeSwipeBack(true, onBack);
  const [values, setValues] = useState(() => {
    const v = {};
    PRIVACY_ITEMS.forEach(([key]) => { v[key] = (me && me[key]) || 'everyone'; });
    return v;
  });
  const [openKey, setOpenKey] = useState(initialOpen || null);
  const [saveErr, setSaveErr] = useState('');
  useEffect(() => {
    if (!initialOpen) return undefined;
    const t = setTimeout(() => { const el = document.querySelector(`[data-privacy-key="${initialOpen}"]`); if (el) { try { el.scrollIntoView({ block: 'center' }); } catch {} } }, 350);
    return () => clearTimeout(t);
  }, []);
  const [chosenFor, setChosenFor] = useState(null);
  const [people, setPeople] = useState(null);
  const [allow, setAllow] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const allowTouchRef = useRef({});
  useBackClose(!!chosenFor, () => setChosenFor(null));

  const save = async (key, value) => {
    const before = values[key];
    setValues((prev) => ({ ...prev, [key]: value }));
    setOpenKey(null);
    setSaveErr('');
    if (value === 'chosen') openChosen(key);
    const { error } = await supabase.from('profiles').update({ [key]: value }).eq('id', me.id);
    if (error) {
      setValues((prev) => ({ ...prev, [key]: before }));
      if (value === 'chosen') setChosenFor(null);
      setSaveErr('That setting could not be saved yet. Try again in a little while.');
      return;
    }
    onSaved({ [key]: value });
  };

  const openChosen = async (key) => {
    const memKey = `${me.id}:${key}`;
    const cached = chosenPeopleMem.get(memKey);
    setChosenFor(key);
    setPeople(cached ? cached.people : null);
    if (cached) setAllow(new Set(cached.allow));
    const [{ data: followers }, { data: allowRows, error: allowErr }] = await Promise.all([
      supabase.from('follows').select('follower_id').eq('following_id', me.id).eq('status', 'accepted'),
      supabase.from('privacy_allow').select('viewer_id').eq('user_id', me.id).eq('scope', key),
    ]);
    const withTouches = (base) => { const n = new Set(base); const t = allowTouchRef.current[key]; if (t) t.forEach((on, id) => { if (on) n.add(id); else n.delete(id); }); return n; };
    const fresh = withTouches(allowErr && cached ? cached.allow : (allowRows || []).map((r) => r.viewer_id));
    if (!allowErr) setAllow(fresh);
    const ids = [...new Set((followers || []).map((f) => f.follower_id))];
    if (!ids.length) { chosenPeopleMem.set(memKey, { people: [], allow: [...fresh] }); setPeople([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge').in('id', ids);
    const list = sanitizeAvatarList(profs, me.id).filter((x) => !x.is_deleted);
    chosenPeopleMem.set(memKey, { people: list, allow: [...withTouches(fresh)] });
    setPeople(list);
  };

  const toggleAllow = async (viewerId) => {
    const key = chosenFor;
    const has = allow.has(viewerId);
    const mark = (on) => {
      (allowTouchRef.current[key] = allowTouchRef.current[key] || new Map()).set(viewerId, on);
      setAllow((prev) => { const n = new Set(prev); if (on) n.add(viewerId); else n.delete(viewerId); return n; });
      const cm = chosenPeopleMem.get(`${me.id}:${key}`);
      if (cm) chosenPeopleMem.set(`${me.id}:${key}`, { ...cm, allow: on ? [...cm.allow.filter((x) => x !== viewerId), viewerId] : cm.allow.filter((x) => x !== viewerId) });
    };
    mark(!has);
    hapticTap();
    const res = await latestSync(`allow:${key}:${viewerId}`, !has, (on) => (on
      ? supabase.from('privacy_allow').insert({ user_id: me.id, scope: key, viewer_id: viewerId })
      : supabase.from('privacy_allow').delete().eq('user_id', me.id).eq('scope', key).eq('viewer_id', viewerId)), has);
    if (!res.ok && !/duplicate|unique/i.test(String((res.error && res.error.message) || ''))) {
      mark(res.state === undefined ? has : res.state);
      setSaveErr('That change could not be saved. Try again.');
    }
  };

  const label = (v, key) => (privacyChoicesFor(key).find(([k]) => k === v) || PRIVACY_CHOICES[0])[1];

  return (
    <div {...swipe} style={{ position: 'absolute', inset: 0, background: theme.bgGradient, zIndex: 33, display: 'flex', flexDirection: 'column' }} className="zchat-panel-open">
      <IgTopBar title="Who can see what" onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 40px' }}>
        {PRIVACY_ITEMS.map(([key, title, sub]) => (
          <div key={key} data-privacy-key={key} style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div role="button" aria-label={title} aria-expanded={openKey === key} onClick={() => setOpenKey(openKey === key ? null : key)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink }}>{title}</div>
                <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{sub}</div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: openKey === key ? theme.ink : theme.muted, flexShrink: 0, maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label(values[key], key)}</div>
              <ChevronRight size={17} color={theme.muted} style={{ flexShrink: 0, transform: openKey === key ? 'rotate(90deg)' : 'none', transition: reducedMotion() ? 'none' : 'transform 200ms ease-out' }} />
            </div>
            {openKey === key && (
              <div className="zchat-fade" style={{ padding: '0 14px 8px 14px' }}>
                <ChoiceList label={title} value={values[key]} onChange={(v) => save(key, v)}
                  options={privacyChoicesFor(key).map(([v, text]) => ({ k: v, label: text, aria: `${title} ${text}` }))} />
                {values[key] === 'chosen' && (
                  <div role="button" onClick={() => openChosen(key)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: theme.coral, padding: '10px 4px 6px', cursor: 'pointer' }}>
                    Choose the people<ChevronRight size={16} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <LocalTimePrivacyRow />
        {saveErr && <div role="alert" style={{ padding: '12px 18px 0', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{saveErr}</div>}
        <div style={{ padding: '16px 18px', fontSize: 12.5, color: theme.muted, lineHeight: 1.7 }}>
          Chosen people are picked from your followers. Anyone you have not chosen will not see that part of your profile.
        </div>
      </div>
      {chosenFor && (
        <div style={{ position: 'absolute', inset: 0, background: theme.bgGradient, zIndex: 34, display: 'flex', flexDirection: 'column' }} className="zchat-panel-open">
          <IgTopBar title="Chosen people" subtitle={`${allow.size} picked`} onBack={() => setChosenFor(null)} />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {people === null ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 36 }}><Spinner color={theme.ink} /></div>
            ) : !people.length ? (
              <div style={{ textAlign: 'center', padding: 40, color: theme.muted, fontSize: 13.5 }}>Nobody follows you yet, so there is nobody to choose.</div>
            ) : people.map((u) => (
              <div key={u.id} role="button" onClick={() => toggleAllow(u.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
                <Avatar emoji={u.avatar} name={u.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, display: 'flex', alignItems: 'center' }}>
                    <NameBadge name={u.name} verified={u.verified} custom={u.custom_badge} size={12} />
                  </div>
                  <div style={{ fontSize: 12, color: theme.muted }}>@{u.username}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 11, border: `2px solid ${allow.has(u.id) ? theme.coral : theme.muted}`, background: allow.has(u.id) ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {allow.has(u.id) && <Check size={13} color="#fff" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const AX_TZ_CHOICES = [['everyone', 'Everyone'], ['followers', 'My followers'], ['nobody', 'Nobody']];
function LocalTimePrivacyRow() {
  const { theme } = useTheme();
  const ax = useAx();
  const [open, setOpen] = useState(false);
  const title = 'Who can see my local time';
  const value = (AX_TZ_CHOICES.find(([k]) => k === ax.tz_share) || AX_TZ_CHOICES[1])[1];
  const pick = (v) => {
    setOpen(false);
    if (v === ax.tz_share) return;
    if (axPrefs.off) { appSnack('This switches on once the latest ZChat setup is finished.'); return; }
    axSet({ tz_share: v });
  };
  return (
    <div data-privacy-key="local_time" style={{ borderBottom: `1px solid ${theme.border}` }}>
      <div role="button" aria-label={title} aria-expanded={open} onClick={() => setOpen(!open)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink }}>{title}</div>
          <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>Shown in chats when your time is an hour or more apart</div>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: open ? theme.ink : theme.muted, flexShrink: 0, maxWidth: 130, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
        <ChevronRight size={17} color={theme.muted} style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: reducedMotion() ? 'none' : 'transform 200ms ease-out' }} />
      </div>
      {open && (
        <div className="zchat-fade" style={{ padding: '0 14px 8px 14px' }}>
          <ChoiceList label={title} value={ax.tz_share} onChange={pick} options={AX_TZ_CHOICES.map(([v, text]) => ({ k: v, label: text, aria: `${title} ${text}` }))} />
          <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5, padding: '4px 4px 4px' }}>Only your time zone is shared, from your phone, never where you are.</div>
        </div>
      )}
    </div>
  );
}
export function FollowRequestsPanel({ userId, onClose, onOpenProfile, onRequestDone }) {
  const { theme } = useTheme();
  const reqMem = followRequestsMem.get(userId);
  const [requests, setRequests] = useState(() => (reqMem ? reqMem.requests : null));

  const [newFollowers, setNewFollowers] = useState(() => (reqMem ? reqMem.newFollowers : []));
  const load = async () => {
    const [{ data }, { data: accepted }, { data: mine }] = await Promise.all([
      supabase.from('follows').select('*').eq('following_id', userId).eq('status', 'pending'),
      supabase.from('follows').select('follower_id, created_at').eq('following_id', userId).eq('status', 'accepted').order('created_at', { ascending: false }).limit(60),
      supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted'),
    ]);
    const ids = (data || []).map((r) => r.follower_id);
    const iFollow = new Set((mine || []).map((x) => x.following_id));
    const accIds = (accepted || []).map((r) => r.follower_id).filter((id) => !ids.includes(id));
    const allIds = [...new Set([...ids, ...accIds])];
    if (!allIds.length) { followRequestsMem.set(userId, { requests: [], newFollowers: [] }); setRequests([]); setNewFollowers([]); return; }
    const { data: profs } = await fetchProfilesView(allIds);
    const byId = {};
    sanitizeAvatarList(profs, userId).forEach((p) => { byId[p.id] = p; });
    const reqList = ids.map((id) => byId[id]).filter(Boolean).map((p) => ({ profile: p }));
    const newList = accIds.map((id) => byId[id]).filter(Boolean).map((p) => ({ profile: p, followingBack: iFollow.has(p.id), when: (accepted || []).find((r) => r.follower_id === p.id)?.created_at }));
    followRequestsMem.set(userId, { requests: reqList, newFollowers: newList });
    setRequests(reqList);
    setNewFollowers(newList);
  };
  useEffect(() => {
    load();
    const keep = rtKeep(() => supabase.channel(rtName('requests-watch-' + userId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, (payload) => {
        const row = payload.new || payload.old;
        if (row && row.following_id === userId) load();
      }));
    const offRefresh = rtOnRefresh(() => load());
    return () => { rtDrop(keep); offRefresh(); };
  }, [userId]);

  const [handled, setHandled] = useState({});
  const [followingBack, setFollowingBack] = useState({});
  const respond = async (followerId, accept) => {
    const prevHandled = handled[followerId];
    setHandled((prev) => ({ ...prev, [followerId]: accept ? 'accepted' : 'declined' }));
    hapticTap();
    if (onRequestDone) onRequestDone(1);
    const mem0 = followRequestsMem.get(userId);
    const asFollower = (st) => (st === 'accepted' ? true : st === 'pending' ? 'pending' : false);
    if (mem0) {
      const row = mem0.requests.find((x) => x.profile.id === followerId);
      const rest = mem0.requests.filter((x) => x.profile.id !== followerId);
      followRequestsMem.set(userId, { requests: rest, newFollowers: accept && row ? [{ profile: row.profile, followingBack: asFollower(followingBack[followerId]), when: new Date().toISOString() }, ...mem0.newFollowers.filter((x) => x.profile.id !== followerId)] : mem0.newFollowers });
    }
    if (accept) {
      const [{ error }, { data: mine }] = await Promise.all([
        supabase.from('follows').update({ status: 'accepted' }).eq('follower_id', followerId).eq('following_id', userId),
        supabase.from('follows').select('status').eq('follower_id', userId).eq('following_id', followerId).maybeSingle(),
      ]);
      if (!error) {
        setFollowingBack((prev) => (prev[followerId] && prev[followerId] !== 'none' ? prev : { ...prev, [followerId]: mine ? mine.status : 'none' }));
        const m = followRequestsMem.get(userId);
        if (m && mine) followRequestsMem.set(userId, { ...m, newFollowers: m.newFollowers.map((x) => (x.profile.id === followerId && !x.followingBack ? { ...x, followingBack: asFollower(mine.status) } : x)) });
        return;
      }
      setHandled((prev) => ({ ...prev, [followerId]: prevHandled }));
      if (mem0) followRequestsMem.set(userId, mem0);
      if (onRequestDone) onRequestDone(-1);
      appSnack(friendlyError(error, "Couldn't accept that request. Try again."));
    } else {
      const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', userId);
      if (!error) return;
      setHandled((prev) => ({ ...prev, [followerId]: prevHandled }));
      if (mem0) followRequestsMem.set(userId, mem0);
      if (onRequestDone) onRequestDone(-1);
      appSnack(friendlyError(error, "Couldn't remove that request. Try again."));
    }
  };
  const followBack = async (p) => {
    const status = p.is_private ? 'pending' : 'accepted';
    const before = followingBack[p.id] || 'none';
    setFollowingBack((prev) => ({ ...prev, [p.id]: status }));
    hapticTap();
    const markMem = (st) => { const m = followRequestsMem.get(userId); if (m) followRequestsMem.set(userId, { ...m, newFollowers: m.newFollowers.map((x) => (x.profile.id === p.id ? { ...x, followingBack: st === 'accepted' ? true : st === 'pending' ? 'pending' : false } : x)) }); };
    markMem(status);
    const res = await followSync(userId, p.id, status, before);
    if (!res.ok) { setFollowingBack((prev) => ({ ...prev, [p.id]: res.state || 'none' })); markMem(res.state || 'none'); appSnack(friendlyError(res.error, "Couldn't follow right now. Try again.")); return; }
    const { data: meRow } = await supabase.from('profiles').select('name, avatar').eq('id', userId).maybeSingle();
    sendPushNotification(p.id, 'ZChat', status === 'pending' ? `${meRow?.name || 'Someone'} requested to follow you` : `${meRow?.name || 'Someone'} started following you`, status === 'pending' ? '/?requests=1' : `/?profile=${userId}`, meRow?.avatar);
  };

  return (
    <ListModal title="Follow requests" subtitle={requests && requests.length ? `${requests.length} waiting for you` : undefined} onClose={onClose}>
      {requests === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>
      ) : requests.length === 0 ? (
        <EmptyState art="requests" title="No requests right now" text="When someone asks to follow you, it shows up here so you can say yes or no." />
      ) : (
        requests.filter(({ profile: p }) => handled[p.id] !== 'declined').map(({ profile: p }) => (
          <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile(p)} sub={handled[p.id] === 'accepted' ? 'Now following you' : 'Wants to follow you'} rightContent={handled[p.id] === 'accepted' ? (
            followingBack[p.id] === 'accepted' || followingBack[p.id] === 'pending'
              ? <PillButton small disabled label={followingBack[p.id] === 'pending' ? 'Requested' : 'Following'} />
              : <PillButton small primary label="Follow back" onClick={() => followBack(p)} />
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <PillButton small primary label="Accept" onClick={() => respond(p.id, true)} />
              <PillButton small label="Decline" onClick={() => respond(p.id, false)} />
            </div>
          )} />
        ))
      )}
      {newFollowers.length > 0 && (
        <>
          <div style={{ padding: '22px 0 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>New followers</div>
          {newFollowers.map(({ profile: p, followingBack, when }) => (
            <UserListRow key={p.id} profile={p} onClick={() => onOpenProfile && onOpenProfile(p)} sub={`Followed you ${when ? timeAgoLong(when) : 'recently'}`}
              rightContent={followingBack
                ? <PillButton small disabled label={followingBack === 'pending' ? 'Requested' : 'Following'} />
                : <PillButton small primary label={p.is_private ? 'Request' : 'Follow back'} onClick={async () => {
                  playUiSound('tap');
                  const mark = (v) => setNewFollowers((prev) => { const next = prev.map((x) => (x.profile.id === p.id ? { ...x, followingBack: v } : x)); const m = followRequestsMem.get(userId); if (m) followRequestsMem.set(userId, { ...m, newFollowers: next }); return next; });
                  mark(p.is_private ? 'pending' : true);
                  const res = await followSync(userId, p.id, p.is_private ? 'pending' : 'accepted', 'none');
                  if (!res.ok) { mark(res.state === 'pending' ? 'pending' : res.state === 'accepted' ? true : false); appSnack(friendlyError(res.error, "Couldn't follow right now. Try again.")); }
                }} />} />
          ))}
        </>
      )}
    </ListModal>
  );
}
function readRecentSearches() { try { return JSON.parse(localStorage.getItem('zchat-recent-search') || '[]').slice(0, 12); } catch { return []; } }
function pushRecentSearch(item) {
  try {
    const list = readRecentSearches().filter((x) => !(x.k === item.k && x.v === item.v));
    localStorage.setItem('zchat-recent-search', JSON.stringify([item, ...list].slice(0, 12)));
  } catch {}
}

function SuggestionCard({ p, sub, myId, following, onChanged, onOpen }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const follow = async (e) => {
    e.stopPropagation();
    hapticTap();
    const before = following === 'pending' ? 'pending' : following ? 'accepted' : 'none';
    const next = following ? 'none' : (p.is_private ? 'pending' : 'accepted');
    onChanged(p.id, next === 'none' ? null : next);
    const res = await followSync(myId, p.id, next, before);
    if (!res.ok) { onChanged(p.id, res.state && res.state !== 'none' ? res.state : null); appSnack(friendlyError(res.error, "That didn't work. Try again.")); }
  };
  return (
    <div role="button" aria-label={`Suggested ${p.name}`} onClick={() => onOpen(p)} className="zchat-press" style={{ flexShrink: 0, width: 132, padding: '14px 10px 12px', borderRadius: 16, background: theme.soft, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', boxSizing: 'border-box' }}>
      <Avatar emoji={p.avatar} name={p.name} size={64} />
      <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
      <div style={{ fontSize: 11.5, color: theme.muted, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: 15 }}>{sub || `@${p.username}`}</div>
      <div role="button" aria-label={following ? `Unfollow ${p.name}` : `Follow ${p.name}`} onClick={follow} style={{ marginTop: 2, height: 30, minWidth: 92, padding: '0 14px', borderRadius: 9, background: following ? theme.soft2 : theme.coral, color: following ? theme.ink : '#FFFFFF', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
        {busy ? <Spinner size={13} color={following ? theme.ink : '#FFFFFF'} /> : following === 'pending' ? 'Requested' : following ? 'Following' : 'Follow'}
      </div>
    </div>
  );
}
export function SearchPage({ myId, me, blockedIds, onClose, onOpenProfile, onOpenTag, onOpenTrending, onOpenChannels, onOpenPosts, onEditInterests }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const sMem = searchPageMem.get(myId);
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [follows, setFollows] = useState(() => (sMem ? new Map(sMem.follows) : new Map()));
  const [suggested, setSuggested] = useState(() => (sMem ? sMem.suggested : null));
  const [alike, setAlike] = useState(() => (sMem ? sMem.alike : null));
  const [popular, setPopular] = useState(() => (sMem ? sMem.popular : null));
  const [res, setRes] = useState(null);
  const [recent, setRecent] = useState(() => readRecentSearches());
  const trending = useTrendingTags();
  const myInterests = Array.isArray(me && me.interests) ? me.interests : [];
  const followTouchRef = useRef(new Map());
  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ data: mine }, moreRes, alikeRes, postsRes] = await Promise.all([
        supabase.from('follows').select('following_id, status').eq('follower_id', myId).limit(5000),
        supabase.from('profiles').select(PROFILE_COLS).eq('is_private', false).eq('is_deleted', false).neq('id', myId).limit(30),
        myInterests.length ? supabase.from('profiles').select(PROFILE_COLS).overlaps('interests', myInterests).neq('id', myId).limit(30) : Promise.resolve({ data: [] }),
        supabase.from('posts').select('*').gt('created_at', since).order('created_at', { ascending: false }).limit(80),
      ]);
      if (!alive) return;
      const fm = new Map((mine || []).map((r) => [r.following_id, r.status]));
      followTouchRef.current.forEach((st, id) => { if (st) fm.set(id, st); else fm.delete(id); });
      setFollows(fm);
      const myFollowing = [...fm.entries()].filter(([, st]) => st === 'accepted').map(([id]) => id);
      const rows = ((postsRes && postsRes.data) || []).filter((p) => !(blockedIds && blockedIds.has(p.user_id)) && !notYetPosted(p));
      const [fofRes, likesRes] = await Promise.all([
        myFollowing.length ? supabase.from('follows').select('follower_id, following_id').in('follower_id', myFollowing.slice(0, 200)).eq('status', 'accepted').limit(2000) : Promise.resolve({ data: [] }),
        rows.length ? supabase.from('post_likes').select('post_id').in('post_id', rows.map((p) => p.id)) : Promise.resolve({ data: [] }),
      ]);
      if (!alive) return;
      const why = {};
      const score = new Map();
      ((fofRes && fofRes.data) || []).forEach((r) => {
        if (r.following_id === myId || fm.has(r.following_id) || (blockedIds && blockedIds.has(r.following_id))) return;
        score.set(r.following_id, (score.get(r.following_id) || 0) + 1);
        if (!why[r.following_id]) why[r.following_id] = r.follower_id;
      });
      const ids = [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([id]) => id);
      let list = [];
      if (ids.length) {
        const viaWant = [...new Set(ids.map((id) => why[id]).filter(Boolean))];
        const { data } = await fetchProfilesView([...new Set([...ids, ...viaWant])]);
        if (!alive) return;
        const order = new Map(ids.map((id, i) => [id, i]));
        const all = sanitizeAvatarList(data || [], myId);
        const nameOf = new Map(all.map((p) => [p.id, p.username]));
        list = all.filter((p) => order.has(p.id) && !p.is_deleted && !p.is_bot).sort((a, b) => order.get(a.id) - order.get(b.id))
          .map((p) => ({ ...p, __why: nameOf.get(why[p.id]) ? `Followed by ${nameOf.get(why[p.id])}` : null }));
      }
      if (list.length < 6) {
        const more = sanitizeAvatarList((moreRes && moreRes.data) || [], myId).filter((p) => !p.is_bot && !fm.has(p.id) && !(blockedIds && blockedIds.has(p.id)) && !list.some((x) => x.id === p.id));
        list = [...list, ...more].slice(0, 14);
      }
      const lk = myInterests.length && !(alikeRes && alikeRes.error) ? sanitizeAvatarList((alikeRes && alikeRes.data) || [], myId).filter((p) => !p.is_deleted && !p.is_bot && !fm.has(p.id) && !(blockedIds && blockedIds.has(p.id))).slice(0, 12) : [];
      const alikeList = lk.map((p) => ({ ...p, __why: (p.interests || []).filter((x) => myInterests.includes(x)).slice(0, 2).join(', ') }));
      const cnt = {};
      ((likesRes && likesRes.data) || []).forEach((l) => { cnt[l.post_id] = (cnt[l.post_id] || 0) + 1; });
      rows.sort((a, b) => (cnt[b.id] || 0) - (cnt[a.id] || 0) || new Date(b.created_at) - new Date(a.created_at));
      const pop = rows.slice(0, 18);
      searchPageMem.set(myId, { follows: [...fm.entries()], suggested: list, alike: alikeList, popular: pop });
      setSuggested(list);
      setAlike(alikeList);
      setPopular(pop);
    })();
    return () => { alive = false; };
  }, [myId]);
  useEffect(() => {
    const term = q.trim().replace(/^@/, '');
    if (term.length < 1) { setRes(null); return undefined; }
    let alive = true;
    const t = setTimeout(async () => {
      const tagTerm = term.replace(/^#/, '').toLowerCase();
      const [byUser, byName, posts] = await Promise.all([
        supabase.from('profiles').select(PROFILE_COLS).ilike('username', `%${term}%`).limit(20),
        supabase.from('profiles').select(PROFILE_COLS).ilike('name', `%${term}%`).limit(20),
        term.length >= 2 ? supabase.from('posts').select('*').ilike('caption', `%${term}%`).order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
      ]);
      if (!alive) return;
      const seen = new Set();
      const people = sanitizeAvatarList([...((byUser && byUser.data) || []), ...((byName && byName.data) || [])], myId).filter((p) => { if (seen.has(p.id) || p.is_deleted || p.id === myId || (blockedIds && blockedIds.has(p.id))) return false; seen.add(p.id); return true; }).slice(0, 20);
      const tags = (trending || []).filter((r) => r.tag.includes(tagTerm)).slice(0, 6);
      if (/^[\p{L}\p{N}_]{2,40}$/u.test(tagTerm) && !tags.some((r) => r.tag === tagTerm)) tags.unshift({ tag: tagTerm, n: null });
      setRes({ people, tags, posts: ((posts && posts.data) || []).filter((p) => !(blockedIds && blockedIds.has(p.user_id)) && !notYetPosted(p)) });
    }, 220);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);
  const onChanged = (id, st) => {
    followTouchRef.current.set(id, st || null);
    setFollows((m) => { const n = new Map(m); if (st) n.set(id, st); else n.delete(id); const cur = searchPageMem.get(myId); if (cur) searchPageMem.set(myId, { ...cur, follows: [...n.entries()] }); return n; });
  };
  const openPerson = (p) => { pushRecentSearch({ k: 'p', v: p.id, l: p.username, a: p.avatar || null, n: p.name }); setRecent(readRecentSearches()); onOpenProfile(p); };
  const openTag = (tag) => { pushRecentSearch({ k: 't', v: tag, l: `#${tag}` }); setRecent(readRecentSearches()); onOpenTag(tag); };
  const heading = (t, right) => <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px' }}><div style={{ flex: 1, fontSize: 15, fontWeight: 800, color: theme.ink }}>{t}</div>{right}</div>;
  const grid = (list) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
      {list.map((p) => <PostTile key={p.id} p={p} onOpen={() => onOpenPosts(p, list)} pinned={false} />)}
    </div>
  );
  const top3 = (trending || []).slice(0, 3);
  const rest = (trending || []).slice(3, 12);
  const showRecent = focused && !q.trim() && recent.length > 0;
  return (
    <>
    <WideDim onClose={onClose} z={25} />
    <div {...edgeBack} style={{ position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 25, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 'calc(6px + env(safe-area-inset-top)) 8px 4px' }}>
        <div role="button" aria-label="Back" onClick={onClose} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, flexShrink: 0 }}><ArrowLeft size={24} /></div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.ink, letterSpacing: '-0.025em' }}>Search</div>
      </div>
      <div style={{ padding: '4px 20px 6px', position: 'relative' }}>
        <Search size={18} color={theme.muted} style={{ position: 'absolute', left: 32, top: 15 }} />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} placeholder="People, tags and posts" aria-label="Search people, tags and posts" autoCapitalize="none" autoCorrect="off"
          style={{ ...inputStyle(theme), height: 40, padding: '0 36px 0 38px', fontSize: 16, borderRadius: 12, border: 'none', background: theme.soft }} />
        {q && <div role="button" aria-label="Clear search" onClick={() => setQ('')} style={{ position: 'absolute', right: 24, top: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.muted }}><X size={17} /></div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
        {showRecent ? (
          <>
            {heading('Recent', <span role="button" aria-label="Clear recent searches" onMouseDown={(e) => e.preventDefault()} onClick={() => { try { localStorage.removeItem('zchat-recent-search'); } catch {} setRecent([]); }} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Clear all</span>)}
            {recent.map((r) => (
              <div key={`${r.k}${r.v}`} role="button" aria-label={`Recent ${r.l}`} onMouseDown={(e) => e.preventDefault()} onClick={() => (r.k === 'p' ? openPerson({ id: r.v, username: r.l, name: r.n, avatar: r.a }) : openTag(r.v))} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', cursor: 'pointer' }}>
                {r.k === 'p' ? <Avatar emoji={r.a} name={r.n || r.l} size={44} /> : <div style={{ width: 44, height: 44, borderRadius: '50%', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><LineGlyph k="hash" size={22} /></div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{r.k === 'p' ? r.l : r.l}</div>
                  {r.k === 'p' && r.n && <div style={{ fontSize: 13, color: theme.muted }}>{r.n}</div>}
                </div>
              </div>
            ))}
          </>
        ) : res ? (
          <>
            {res.people.length > 0 && heading('People')}
            {res.people.map((p) => (
              <div key={p.id} role="button" aria-label={`Open ${p.name}`} onClick={() => openPerson(p)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', cursor: 'pointer' }}>
                <Avatar emoji={p.avatar} name={p.name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.username} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                  <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}{follows.get(p.id) === 'accepted' ? ', following' : ''}</div>
                </div>
              </div>
            ))}
            {res.tags.length > 0 && heading('Tags')}
            {res.tags.map((r) => (
              <div key={r.tag} role="button" aria-label={`Tag ${r.tag}`} onClick={() => openTag(r.tag)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', cursor: 'pointer' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', border: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><LineGlyph k="hash" size={23} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>#{r.tag}</div>
                  <div style={{ fontSize: 13, color: theme.muted }}>{r.n ? (r.n === 1 ? '1 post this week' : `${formatCount(r.n)} posts this week`) : 'See posts'}</div>
                </div>
              </div>
            ))}
            {res.posts.length > 0 && heading('Posts')}
            {res.posts.length > 0 && grid(res.posts)}
            {!res.people.length && !res.tags.length && !res.posts.length && <div style={{ textAlign: 'center', padding: 40, fontSize: 14, color: theme.muted }}>No results for {q.trim()}</div>}
          </>
        ) : (
          <>
            {suggested && suggested.length > 0 && (
              <>
                {heading('People you may know')}
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 20px 4px' }}>
                  {suggested.map((p) => <SuggestionCard key={p.id} p={p} sub={p.__why} myId={myId} following={follows.get(p.id)} onChanged={onChanged} onOpen={openPerson} />)}
                </div>
              </>
            )}
            {alike && alike.length > 0 ? (
              <>
                {heading('People like you', onEditInterests ? <span role="button" aria-label="Edit interests" onClick={onEditInterests} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Interests</span> : null)}
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 20px 4px' }}>
                  {alike.map((p) => <SuggestionCard key={p.id} p={p} sub={p.__why ? `Into ${p.__why.toLowerCase()}` : null} myId={myId} following={follows.get(p.id)} onChanged={onChanged} onOpen={openPerson} />)}
                </div>
              </>
            ) : (myInterests.length === 0 && onEditInterests) ? (
              <div role="button" aria-label="Pick your interests" onClick={onEditInterests} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 20px 0', padding: '13px 14px', borderRadius: 16, background: theme.accentSoft, cursor: 'pointer' }}>
                <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0 }}><LineGlyph k="heart" size={24} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: theme.ink }}>Find people like you</span>
                  <span style={{ display: 'block', fontSize: 13, color: theme.muted, marginTop: 1 }}>Pick a few things you love</span>
                </span>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            ) : null}
            {top3.length > 0 && (
              <>
                {heading('Trending this week', onOpenTrending ? <span role="button" aria-label="See all trending tags" onClick={onOpenTrending} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>See all</span> : null)}
                {top3.map((r, i) => (
                  <div key={r.tag} role="button" aria-label={`Tag ${r.tag}`} onClick={() => openTag(r.tag)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px', cursor: 'pointer' }}>
                    <div style={{ width: 22, fontSize: 15, fontWeight: 800, color: theme.muted }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>#{r.tag}</div>
                      <div style={{ fontSize: 12.5, color: theme.muted }}>{formatCount(r.n)} {r.n === 1 ? 'post' : 'posts'}</div>
                    </div>
                    {(r.sample || r.sample_url) && <img src={r.sample || r.sample_url} alt="" loading="lazy" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />}
                  </div>
                ))}
                {rest.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12, padding: '2px 20px 0' }}>
                    {rest.map((r, i) => (
                      <div key={r.tag} role="button" aria-label={`Tag ${r.tag}`} onClick={() => openTag(r.tag)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, padding: '7px 0', cursor: 'pointer' }}>
                        <div style={{ width: 22, fontSize: 15, fontWeight: 800, color: theme.muted, flexShrink: 0 }}>{i + 4}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{r.tag}</div>
                          <div style={{ fontSize: 12.5, color: theme.muted }}>{formatCount(r.n)} {r.n === 1 ? 'post' : 'posts'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {onOpenChannels && (
              <div role="button" aria-label="Channels" onClick={onOpenChannels} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px 6px', cursor: 'pointer' }}>
                <span style={{ width: 28, display: 'flex', justifyContent: 'center', color: theme.ink }}><ChannelIcon size={24} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: theme.ink }}>Channels</span>
                  <span style={{ display: 'block', fontSize: 13, color: theme.muted }}>Follow updates from people and pages</span>
                </span>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            )}
            {popular && popular.length > 0 && (
              <>
                {heading('Popular now')}
                {grid(popular)}
              </>
            )}
            {suggested === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>}
          </>
        )}
      </div>
    </div>
    </>
  );
}

const AIP_FN = '/.netlify/functions/zchat-aiphoto';
async function aipCall(action, payload, timeoutMs = 30000) {
  const token = await aipToken();
  if (!token) return { error: 'Please log in again.', status: 401 };
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  try {
    const res = await fetch(AIP_FN, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...(payload || {}), action }), signal: ctrl ? ctrl.signal : undefined });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: json && typeof json.error === 'string' && !TOOL_RAW_ERRORS.has(json.error) ? json.error : '', status: res.status };
    return { data: json || {}, status: res.status };
  } catch {
    return { error: '', status: 0 };
  } finally { clearTimeout(timer); }
}
function aipError(r, kind) {
  if (r.status === 404 || (r.status === 503 && !r.error)) return `${kind} switches on once the ZChat tools are set up.`;
  return toolErrorText(r, kind);
}

function MailIcon({ m, size }) {
  return <MailBadgeIcon type={m.type} size={size} badgeTier={badgeTierFromTitle(m.title)} />;
}
export function MailPanel({ myId, onClose, initialMailId, onUnreadDelta }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const [mails, setMails] = useState(() => mailPanelMem.get(myId) || null);
  const mailTouchRef = useRef(new Map());
  useEffect(() => { if (mails) mailPanelMem.set(myId, mails); }, [mails]);
  const bumpUnread = (d) => { if (d && onUnreadDelta) onUnreadDelta(d); };
  const [selected, setSelected] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`zchat-pinned-mails-${myId}`) || '[]')); } catch { return new Set(); }
  });
  const [actionFor, setActionFor] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [confirmBulk, setConfirmBulk] = useState(null);
  useBackClose(!!selected, () => setSelected(null));
  useBackClose(picking, () => { setPicking(false); setPicked(new Set()); });
  useBackClose(!!actionFor, () => setActionFor(null));
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
    const { data, error } = await supabase.from('mails').select('*').eq('recipient_id', myId).order('created_at', { ascending: false }).limit(100);
    if (error && !data) { setMails((prev) => prev || []); return; }
    const senderIds = [...new Set((data || []).map((m) => m.sender_id).filter(Boolean))];
    if (senderIds.length) {
      const { data: profs } = await fetchProfilesView(senderIds);
      const byId = {};
      sanitizeAvatarList(profs, myId).forEach((p) => { byId[p.id] = p; });
      (data || []).forEach((m) => { if (m.sender_id && byId[m.sender_id]) m.sender = byId[m.sender_id]; });
    }
    const t = mailTouchRef.current;
    setMails((data || []).filter((m) => t.get(m.id) !== 'gone').map((m) => (t.get(m.id) === 'read' ? { ...m, read: true } : m)));
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
      mailTouchRef.current.set(m.id, 'read');
      setMails((prev) => (prev || []).map((x) => (x.id === m.id ? { ...x, read: true } : x)));
      bumpUnread(-1);
      const { error } = await supabase.from('mails').update({ read: true }).eq('id', m.id);
      if (error) { mailTouchRef.current.delete(m.id); setMails((prev) => (prev || []).map((x) => (x.id === m.id ? { ...x, read: false } : x))); bumpUnread(1); }
    }
  };

  const startPress = (m) => {
    longPressFiredRef.current = false;
    clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => { longPressFiredRef.current = true; setActionFor(m); }, 420);
  };
  const cancelPress = () => clearTimeout(pressTimerRef.current);

  const deleteMail = async (id) => {
    const gone = (mails || []).find((x) => x.id === id);
    mailTouchRef.current.set(id, 'gone');
    setMails((prev) => (prev || []).filter((x) => x.id !== id));
    const next = new Set(pinnedIds); next.delete(id); savePinned(next);
    setActionFor(null);
    if (selected?.id === id) setSelected(null);
    if (gone && !gone.read) bumpUnread(-1);
    const { error } = await supabase.from('mails').delete().eq('id', id);
    if (error) { mailTouchRef.current.delete(id); if (gone && !gone.read) bumpUnread(1); load(); }
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
    return fmtDate(new Date(iso), { month: 'short', day: 'numeric' });
  };

  const allIds = (mails || []).map((m) => m.id);
  const togglePick = (id) => {
    setPicked((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const markAllRead = async () => {
    const unread = (mails || []).filter((m) => !m.read).map((m) => m.id);
    if (!unread.length) return;
    unread.forEach((id) => mailTouchRef.current.set(id, 'read'));
    setMails((prev) => prev.map((m) => ({ ...m, read: true })));
    bumpUnread(-unread.length);
    playUiSound('tap');
    const { error } = await supabase.from('mails').update({ read: true }).in('id', unread);
    if (error) { unread.forEach((id) => mailTouchRef.current.delete(id)); bumpUnread(unread.length); load(); }
  };
  const deletePicked = async () => {
    const ids = [...picked];
    if (!ids.length) return;
    const unreadGone = (mails || []).filter((m) => picked.has(m.id) && !m.read).length;
    ids.forEach((id) => mailTouchRef.current.set(id, 'gone'));
    setMails((prev) => prev.filter((m) => !picked.has(m.id)));
    setPicked(new Set());
    setPicking(false);
    setConfirmBulk(null);
    bumpUnread(-unreadGone);
    playUiSound('delete');
    const { error } = await supabase.from('mails').delete().in('id', ids);
    if (error) { ids.forEach((id) => mailTouchRef.current.delete(id)); bumpUnread(unreadGone); load(); }
  };

  return (
    <>
    <WideDim onClose={onClose} z={34} />
    <div {...edgeBack} style={{ position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 34, display: 'flex', flexDirection: 'column' }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title={selected ? 'Message' : picking ? `${picked.size} selected` : 'Mail'} onBack={() => (selected ? setSelected(null) : onClose())}
        right={selected ? (
          <div role="button" aria-label="Delete mail" onClick={() => setConfirmDeleteId(selected.id)} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.danger }}><Trash2 size={20} /></div>
        ) : picking ? (
          <>
            <div role="button" onClick={() => setPicked(picked.size === allIds.length ? new Set() : new Set(allIds))} style={{ fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '0 8px', height: 44, display: 'flex', alignItems: 'center' }}>{picked.size === allIds.length && allIds.length ? 'None' : 'All'}</div>
            <div role="button" aria-label="Delete selected mails" onClick={() => picked.size && setConfirmBulk(picked.size)} style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: picked.size ? 'pointer' : 'default', color: picked.size ? theme.danger : theme.muted }}><Trash2 size={20} /></div>
            <div role="button" aria-label="Stop selecting" onClick={() => { setPicking(false); setPicked(new Set()); }} style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><X size={20} /></div>
          </>
        ) : (
          <>
            <div role="button" aria-label="Mark all read" onClick={markAllRead} style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><CheckCheck size={21} /></div>
            <div role="button" aria-label="Select mails" onClick={() => { setPicking(true); playUiSound('tap'); }} style={{ fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '0 10px', height: 44, display: 'flex', alignItems: 'center' }}>Select</div>
          </>
        )} />
      {selected ? (
        <div key={selected.id} className="zchat-mail-zoom" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '22px 20px', paddingBottom: 'calc(22px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <MailIcon m={selected} size={44} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15.5, color: theme.ink }}>{selected.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: theme.muted, fontWeight: 600 }}>{mailSenderName(selected.type)} <VerifiedTick size={12} /> <span style={{ fontWeight: 400, marginLeft: 2 }}>{new Date(selected.created_at).toLocaleString()}</span></div>
            </div>
          </div>
          <div data-zuser="" style={{ fontSize: 14, color: theme.ink, lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selected.body}</div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 10px', paddingBottom: 'calc(6px + env(safe-area-inset-bottom))' }}>
          {sortedMails === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.ink} /></div>
          ) : sortedMails.length === 0 ? (
            <EmptyState art="mail" title="No mail yet" text="Notes from the ZChat team and account notices land here." />
          ) : (
            sortedMails.map((m) => (
              <div key={m.id} onClick={() => (picking ? togglePick(m.id) : openMail(m))}
                onPointerDown={() => !picking && startPress(m)} onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerCancel={cancelPress}
                style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer', borderRadius: 14, marginBottom: 2,
                background: picked.has(m.id) ? `${theme.coral}1A` : pinnedIds.has(m.id) ? `${theme.coral}0F` : 'transparent',
              }}>
                {picking && (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${picked.has(m.id) ? theme.coral : theme.border}`, background: picked.has(m.id) ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {picked.has(m.id) && <Check size={13} color="white" strokeWidth={4} />}
                  </div>
                )}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {m.sender
                    ? <div style={{ position: 'relative', width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Avatar emoji={m.sender.avatar} name={m.sender.name} size={44} />
                        <div style={{ position: 'absolute', right: -4, bottom: -4, width: 20, height: 20, borderRadius: 7, background: theme.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4 }}><MailIcon m={m} size={16} /></div>
                      </div>
                    : <MailIcon m={m} size={42} />}
                  {!m.read && <div style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: theme.coral, border: `2px solid ${theme.panelBg}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {pinnedIds.has(m.id) && <Pin_ size={11} />}
                    <div style={{ fontWeight: m.read ? 600 : 800, fontSize: 13.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center' }}>
                      {m.sender ? <><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.sender.name}</span><VerifiedBadge tier={m.sender.verified} custom={m.sender.custom_badge} size={12} /><span style={{ color: theme.muted, fontWeight: 600, marginLeft: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title.replace(new RegExp(`^${m.sender.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '')}</span></> : m.title}
                    </div>
                  </div>
                  <div data-zuser="" style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.body}</div>
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
            background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '10px 8px', width: '100%', maxWidth: 460, boxSizing: 'border-box',
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
          body="They will be removed from your mailbox."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmBulk(null)}
          onConfirm={deletePicked} />
      )}
    </div>
    </>
  );
}


function NicknameEditRow({ avatar, label, currentValue, placeholder, onSave }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  return (
    <div style={{ padding: '14px 0' }}>
      <div role="button" aria-label={`Edit name for ${label}`} onClick={() => { if (!editing) { setVal(currentValue || ''); setEditing(true); } }} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: editing ? 'default' : 'pointer' }}>
        <Avatar emoji={avatar} name={label} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700, marginBottom: 3 }}>{label}</div>
          {editing ? (
            <input autoFocus value={val} onChange={(e) => setVal(e.target.value.slice(0, 30))} placeholder={placeholder} aria-label={`Nickname for ${label}`}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              style={{ ...inputStyle(theme), fontSize: 15, padding: '9px 12px' }} />
          ) : (
            <div style={{ fontSize: 15.5, fontWeight: 700, color: currentValue ? theme.ink : theme.muted, fontStyle: currentValue ? 'normal' : 'italic' }}>
              {currentValue || placeholder}
            </div>
          )}
        </div>
        {!editing && <Pencil size={16} color={theme.muted} style={{ flexShrink: 0 }} />}
      </div>
      {editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <PillButton small label="Cancel" onClick={() => { setVal(''); setEditing(false); }} />
          {currentValue && <PillButton small label="Reset" onClick={async () => { setSaving(true); await onSave(''); setSaving(false); setVal(''); setEditing(false); }} />}
          <PillButton small primary disabled={saving} label={saving ? <Spinner size={12} /> : 'Save'} ariaLabel="Save nickname" onClick={async () => { setSaving(true); await onSave(val); setSaving(false); setVal(''); setEditing(false); }} />
        </div>
      )}
    </div>
  );
}

function NicknamesModal({ conv, myAvatar, myName, currentNickname, currentAlias, onSaveNickname, onSaveAlias, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const otherRealName = conv.realName || conv.otherProfile.name;
  return (
    <FullPage title="Nicknames" subtitle="Only you see these" onBack={onClose} zIndex={60}>
      <div style={{ padding: '10px 2px 4px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Tap a name to change how it shows in this chat.</div>
      <NicknameEditRow avatar={conv.otherProfile.avatar} label={otherRealName} currentValue={currentNickname} placeholder={otherRealName} onSave={onSaveNickname} />
      <div style={{ height: 1, background: theme.border }} />
      <NicknameEditRow avatar={myAvatar} label="You" currentValue={currentAlias} placeholder={myName} onSave={onSaveAlias} />
    </FullPage>
  );
}

export function ChatSettingsPanel({ conv, myId, meAvatar, meName, isPinned, isLocked, wallpaper, chatLockAvailable, onClose, onTogglePin, onToggleArchive, onSetWallpaper, onEnableLock, onDisableLock, onDeleteChat, onReportUser, onNicknameSaved, onNeedChatLockSetup, onOpenProfile, isMuted, onSetMute, onCall, disappearSecs, onSetDisappear, tools, messages = [], onOpenMedia }) {
  const [showDisappear, setShowDisappear] = useState(false);
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  useBackClose(showMuteOptions, () => setShowMuteOptions(false));
  const { theme } = useTheme();
  const [nickname, setNickname] = useState('');
  const [myAlias, setMyAlias] = useState('');
  const [showTheme, setShowTheme] = useState(false);
  const [showNicknames, setShowNicknames] = useState(false);
  const [showReportUser, setShowReportUser] = useState(false);
  const [followerCount, setFollowerCount] = useState(() => { const st = profileStatsCache.get(conv.otherProfile.id); return st && st.followers != null ? st.followers : null; });
  const [followingCount, setFollowingCount] = useState(() => { const st = profileStatsCache.get(conv.otherProfile.id); return st && st.following != null ? st.following : null; });
  const [listModal, setListModal] = useState(null);
  const [note, setNote] = useState(() => contactNoteFor(conv.otherProfile.id));
  const [noteOpen, setNoteOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [nickRes, aliasRes, folRes, fingRes] = await Promise.all([
        supabase.from('contact_nicknames').select('nickname').eq('owner_id', myId).eq('contact_id', conv.otherProfile.id).maybeSingle(),
        supabase.from('self_aliases').select('alias').eq('user_id', myId).eq('viewer_id', conv.otherProfile.id).maybeSingle(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', conv.otherProfile.id).eq('status', 'accepted'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', conv.otherProfile.id).eq('status', 'accepted'),
      ]);
      if (!alive) return;
      if (!nickRes.error) setNickname(nickRes.data ? nickRes.data.nickname : '');
      if (!aliasRes.error) setMyAlias(aliasRes.data ? aliasRes.data.alias : '');
      if (!folRes.error) { setFollowerCount(folRes.count || 0); saveProfileStats(conv.otherProfile.id, { followers: folRes.count || 0 }); }
      if (!fingRes.error) { setFollowingCount(fingRes.count || 0); saveProfileStats(conv.otherProfile.id, { following: fingRes.count || 0 }); }
    })();
    return () => { alive = false; };
  }, [conv.otherProfile.id]);

  const saveMyAlias = async (val) => {
    const next = val.trim();
    const before = myAlias;
    setMyAlias(next);
    const undo = (error) => { setMyAlias(before); appAlert(friendlyError(error, "Couldn't save that name. Try again.")); };
    (next
      ? supabase.from('self_aliases').upsert({ user_id: myId, viewer_id: conv.otherProfile.id, alias: next }, { onConflict: 'user_id,viewer_id' })
      : supabase.from('self_aliases').delete().eq('user_id', myId).eq('viewer_id', conv.otherProfile.id)
    ).then(({ error }) => {
      if (error) { undo(error); return; }
      sendMessage(myId, conv.otherProfile.id, 'system', next ? `Now appears as "${next}" to you` : 'Reverted to their real name', null);
    }, undo);
  };
  const saveNickname = async (val) => {
    const next = val.trim();
    const before = nickname;
    const otherId = conv.otherProfile.id;
    setNickname(next);
    onNicknameSaved(next || null, otherId);
    const undo = (error) => { setNickname(before); onNicknameSaved(before || null, otherId); appAlert(friendlyError(error, "Couldn't save that nickname. Try again.")); };
    (next
      ? supabase.from('contact_nicknames').upsert({ owner_id: myId, contact_id: otherId, nickname: next }, { onConflict: 'owner_id,contact_id' })
      : supabase.from('contact_nicknames').delete().eq('owner_id', myId).eq('contact_id', otherId)
    ).then(({ error }) => {
      if (error) { undo(error); return; }
      sendMessage(myId, otherId, 'system', next ? `Nickname updated to "${next}"` : 'Nickname removed', null);
    }, undo);
  };

  const otherName = conv.realName || conv.otherProfile.name;
  const p = conv.otherProfile;
  const infoBits = [
    p.pronouns ? p.pronouns : null,
    p.age != null && !p.hide_age ? `${p.age} yrs` : null,
    p.country && !p.hide_country ? countryFlag(p.country) : null,
  ].filter(Boolean);
  const showBio = p.bio && !p.hide_bio;
  const c = igPalette(theme);
  const muteLabel = isMuted === true ? 'Muted' : isMuted ? `Muted until ${fmtDate(new Date(isMuted), { month: 'short', day: 'numeric' })}` : 'Off';
  const dmMedia = messages.filter((m) => !m.deleted && (m.type === 'image' || m.type === 'video') && m.media_url && !parseOnce(m)).slice(-10).reverse();

  return (
    <>
    <WideDim onClose={onClose} z={33} />
    <div {...edgeBack} style={{
      position: 'fixed', inset: 0, background: c.bg, color: c.fg, zIndex: 33, fontFamily: FONT,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Chat details" onBack={onClose} />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <div style={{ textAlign: 'center', padding: '6px 20px 0' }}>
          <div role="button" aria-label="Open profile" onClick={() => onOpenProfile(p)} style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
            <Avatar emoji={conv.otherProfile.avatar} name={otherName} size={84} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, padding: '0 6px' }}>
            <NameBadge name={otherName} verified={p.verified} custom={p.custom_badge} size={15} lines={2} style={{ justifyContent: 'center', textAlign: 'center', fontWeight: 700, fontSize: otherName.length > 30 ? 16 : 18 }} />
          </div>
          <div style={{ fontSize: 13, color: c.dim, marginTop: 3, padding: '0 16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{conv.otherProfile.username}{infoBits.length ? `, ${infoBits.join(', ')}` : ''}</div>
          {tools && tools.headerExtra}
          {showBio && (
            <div onClick={() => setBioOpen(true)} style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.45, padding: '0 8px', overflow: 'hidden', display: bioOpen ? 'block' : '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', cursor: bioOpen ? 'default' : 'pointer' }}>
              <RichText text={p.bio} onMention={onOpenProfile} />
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 10 }}>
            <div role="button" aria-label="Followers" onClick={conv.otherProfile.is_bot ? undefined : () => setListModal('followers')} style={{ cursor: conv.otherProfile.is_bot ? 'default' : 'pointer' }}>
              <span style={{ fontWeight: 700, fontSize: 14.5 }}>{conv.otherProfile.is_bot ? (BOT_FOLLOWER_BASE + (followerCount || 0)).toLocaleString('en-US') : (followerCount == null ? <span style={{ opacity: 0 }}>0</span> : followerCount)}</span> <span style={{ fontSize: 13, color: c.dim }}>{!conv.otherProfile.is_bot && followerCount === 1 ? 'follower' : 'followers'}</span>
            </div>
            {!conv.otherProfile.is_bot && (
              <div role="button" aria-label="Following" onClick={() => setListModal('following')} style={{ cursor: 'pointer' }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{followingCount == null ? <span style={{ opacity: 0 }}>0</span> : followingCount}</span> <span style={{ fontSize: 13, color: c.dim }}>following</span>
              </div>
            )}
          </div>
        </div>
        <DetailActions items={[
          [<User size={21} strokeWidth={1.7} />, 'Profile', () => onOpenProfile(p)],
          onCall && !(conv.otherProfile.is_bot && !aiVoiceOk()) ? [conv.otherProfile.is_bot ? <AiTalkGlyph size={21} /> : <Phone size={21} strokeWidth={1.7} />, conv.otherProfile.is_bot ? 'Talk' : 'Call', () => onCall('voice')] : null,
          onCall && !conv.otherProfile.is_bot ? [<VideoIcon size={21} strokeWidth={1.7} />, 'Video', () => onCall('video')] : null,
          tools && tools.onSearch ? [<Search size={21} strokeWidth={1.7} />, 'Search', tools.onSearch] : null,
          onSetMute ? [isMuted ? <BellOff size={21} strokeWidth={1.7} /> : <Bell size={21} strokeWidth={1.7} />, isMuted ? 'Muted' : 'Mute', () => setShowMuteOptions(true), !!isMuted] : null,
        ]} />

        {tools && <MediaStrip media={dmMedia} onOpen={onOpenMedia} onSeeAll={tools.onMedia} />}
        {tools && !tools.isBot && !p.is_deleted && <ChatToolsSection chatKey={albumChatKey(myId, p.id)} peer={p} />}

        {tools && (
          <DetailSection title="In this chat" flush>
            <DetailTiles items={[
              tools.onPinned ? { icon: <Pin_ color="currentColor" />, label: 'Pinned', aria: 'Pinned messages', badge: tools.pinnedCount, onClick: tools.onPinned } : null,
              tools.onJumpDate ? { icon: <CalendarIcon />, label: 'Jump to date', aria: 'Jump to a date', onClick: tools.onJumpDate } : null,
              tools.onScheduled ? { icon: <Clock />, label: 'Scheduled', aria: 'Scheduled messages', badge: tools.scheduledCount, onClick: tools.onScheduled } : null,
              tools.onGame ? { icon: <GamepadIcon />, label: 'Games', aria: 'Play a game', onClick: tools.onGame } : null,
              ...(tools.moreTiles || []),
              { icon: <Activity />, label: 'Insights', aria: 'Chat insights', onClick: tools.onInsights },
              { icon: <Download />, label: 'Export', aria: 'Export chat', onClick: tools.onExport },
              tools.onExportPdf ? { icon: <PdfGlyph />, label: 'Export as PDF', aria: 'Export as PDF', onClick: tools.onExportPdf } : null,
            ]} />
          </DetailSection>
        )}

        <DetailSection title="Customize" flush>
          <DetailTiles items={[
            { icon: <ThemeIcon />, label: 'Theme', aria: 'Chat theme', onClick: () => setShowTheme(true) },
            tools ? { icon: <BubblesIcon />, label: 'Bubbles', aria: 'Chat bubbles', onClick: tools.onBubbles } : null,
            { icon: <AtSign />, label: 'Nicknames', onClick: () => setShowNicknames(true) },
            ...((tools && tools.moreCustomize) || []),
          ]} />
        </DetailSection>

        {tools && tools.composeSection}

        <DetailSection title="Privacy and safety">
          {detailRows([
            onSetMute ? <DetailRow icon={isMuted ? <BellOff /> : <Bell />} label="Mute notifications" value={muteLabel} onClick={() => setShowMuteOptions(true)} /> : null,
            <DetailRow icon={<Timer />} label="Disappearing messages" value={disappearLabel(disappearSecs)} onClick={() => setShowDisappear(true)} />,
            <DetailRow icon={<Lock />} label="Lock this chat" onClick={() => { if (isLocked) onDisableLock(); else if (chatLockAvailable) onEnableLock(); else onNeedChatLockSetup(); }} right={<IgToggle on={!!isLocked} />} />,
            <DetailRow icon={<Pin_ color="currentColor" />} label="Pin chat" onClick={onTogglePin} right={<IgToggle on={!!isPinned} />} />,
            <DetailRow icon={<Archive />} label="Archive chat" onClick={onToggleArchive} />,
            ...((tools && tools.morePrivacy) || []),
          ])}
        </DetailSection>

        {tools && tools.msgopsRows && tools.msgopsRows.some(Boolean) && <DetailSection title="Notifications">{detailRows(tools.msgopsRows)}</DetailSection>}

        <DetailSection title="Private note">
          <DetailRow icon={<Pencil />} label={note ? note.split('\n')[0] : 'Add a private note'} sub={note ? 'Only you can see this. Tap to edit.' : 'Only you can see it'} onClick={() => setNoteOpen(true)} last />
        </DetailSection>

        <DetailSection>
          {detailRows([
            tools && tools.onClear ? <DetailRow icon={<Trash2 />} label="Clear chat" danger onClick={tools.onClear} /> : null,
            tools && tools.onToggleBlock ? <DetailRow icon={<Ban />} label={tools.blocked ? `Unblock ${otherName}` : `Block ${otherName}`} danger onClick={tools.onToggleBlock} /> : null,
            !(tools && tools.isBot) ? <DetailRow icon={<Flag />} label={`Report ${otherName}`} danger onClick={() => setShowReportUser(true)} /> : null,
            !(tools && tools.isBot) ? <DetailRow icon={<Trash2 />} label={`Delete chat with ${otherName}`} danger onClick={onDeleteChat} /> : null,
          ])}
        </DetailSection>
        {showDisappear && <DisappearSheet value={disappearSecs} subject="this chat" onPick={onSetDisappear} onClose={() => setShowDisappear(false)} />}
      </div>
      {showMuteOptions && onSetMute && (
        <div onClick={() => setShowMuteOptions(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '18px 18px calc(18px + env(safe-area-inset-bottom))' }}>
            <div style={{ fontWeight: 900, fontSize: 16, color: theme.ink, marginBottom: 12 }}>Mute notifications</div>
            {[['Off', null], ['8 hours', 8 * 3600000], ['1 week', 7 * 86400000], ['Always', 'forever']].map(([label, ms]) => (
              <div key={label} role="button" onClick={() => { onSetMute(ms === 'forever' ? new Date('2999-01-01').toISOString() : ms ? new Date(Date.now() + ms).toISOString() : null); setShowMuteOptions(false); }}
                style={{ padding: '13px 6px', fontSize: 15, fontWeight: 700, color: theme.ink, cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>{label}</div>
            ))}
          </div>
        </div>
      )}
      {showTheme && (
        <ChatThemePage value={wallpaper} userId={myId} mineOnly={conv.user_a === myId ? conv.wallpaper_a !== conv.wallpaper_b && !!conv.wallpaper_a : conv.wallpaper_b !== conv.wallpaper_a && !!conv.wallpaper_b} onSelect={onSetWallpaper} onClose={() => setShowTheme(false)} title={conv.otherProfile.name} avatar={conv.otherProfile.avatar} />
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
      {noteOpen && (
        <ContactNoteSheet name={otherName} value={note} onClose={() => setNoteOpen(false)} onSave={(t) => { saveContactNote(conv.otherProfile.id, t); setNote(contactNoteFor(conv.otherProfile.id)); }} />
      )}
      {listModal && (
        <FollowListModal userId={conv.otherProfile.id} viewerId={myId} mode={listModal} onClose={() => setListModal(null)}
          onOpenProfile={(pf) => { setListModal(null); onOpenProfile(pf); }} />
      )}
    </div>
    </>
  );
}
function joinDoneMark(gid, uids, on) {
  const m = JOIN_DONE.get(gid) || new Map();
  uids.forEach((u) => { if (on) m.set(u, Date.now()); else m.delete(u); });
  JOIN_DONE.set(gid, m);
}
export function JoinRequestsPage({ group, onClose, onReview, onReviewAll }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => JOIN_ROWS.get(group.id) || null);
  const [allBusy, setAllBusy] = useState(false);
  const put = (fn) => setRows((cur) => { const next = fn(cur || []); JOIN_ROWS.set(group.id, next); return next; });
  useEffect(() => {
    let alive = true;
    loadJoinRows(group.id).then((list) => {
      if (!alive) return;
      if (!list) { setRows((cur) => cur || []); return; }
      const next = joinRowsFresh(group.id, list);
      JOIN_ROWS.set(group.id, next);
      setRows(next);
    });
    return () => { alive = false; };
  }, [group.id]);
  const act = async (r, ok) => {
    hapticTap();
    joinDoneMark(group.id, [r.user_id], true);
    put((cur) => cur.filter((x) => x.user_id !== r.user_id));
    const done = await onReview(r.profile, ok);
    if (!done) {
      joinDoneMark(group.id, [r.user_id], false);
      put((cur) => (cur.some((x) => x.user_id === r.user_id) ? cur : [...cur, r].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))));
    }
  };
  const approveAll = async () => {
    if (allBusy) return;
    const before = rows || [];
    if (onReviewAll) {
      hapticTap();
      setAllBusy(true);
      joinDoneMark(group.id, before.map((r) => r.user_id), true);
      put(() => []);
      const done = await onReviewAll();
      setAllBusy(false);
      if (!done) { joinDoneMark(group.id, before.map((r) => r.user_id), false); put(() => before); }
      return;
    }
    for (const r of before) {
      joinDoneMark(group.id, [r.user_id], true);
      put((cur) => cur.filter((x) => x.user_id !== r.user_id));
      const done = await onReview(r.profile, true);
      if (!done) { joinDoneMark(group.id, [r.user_id], false); put((cur) => (cur.some((x) => x.user_id === r.user_id) ? cur : [...cur, r])); }
    }
  };
  return (
    <FullPage title="Join requests" subtitle={group.name} onBack={onClose} zIndex={80}
      footer={rows && rows.length > 1 ? <BigButton label={`Approve all ${rows.length}`} disabled={allBusy} onClick={approveAll} /> : null}>
      {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 34 }}><Spinner size={18} color={theme.muted} /></div>}
      {rows && !rows.length && <EmptyState art="requests" title="No one is waiting" text="When someone opens your invite link, their request shows up here." />}
      {(rows || []).map((r) => (
        <div key={r.user_id} className="zchat-fade" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '10px 0' }}>
          <Avatar emoji={r.profile.avatar} name={r.profile.name} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, minWidth: 0 }}><NameBadge name={r.profile.name} verified={r.profile.verified} custom={r.profile.custom_badge} size={13} /></div>
            <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{timeAgoLong(r.created_at)}</div>
          </div>
          <div role="button" aria-label={`Decline ${r.profile.name}`} onClick={() => act(r, false)} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={20} strokeWidth={2} /></div>
          <div role="button" aria-label={`Approve ${r.profile.name}`} onClick={() => act(r, true)} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 10, background: theme.coral, color: '#FFFFFF', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>Approve</div>
          {r.answers ? <G1JoinAnswerList group={group} answers={r.answers} /> : null}
        </div>
      ))}
    </FullPage>
  );
}

function useG1InfoExtra(m, group, members, myId) {
  const [by, setBy] = useState(null);
  const asGroup = !!m && !!m.group_id && m.sender_id == null;
  const myRank = group && members ? (() => { const row = members.find((x) => x.user_id === myId); return row ? groupRankOf(group, row) : (group.created_by === myId ? 3 : -1); })() : -1;
  useEffect(() => {
    if (!asGroup || myRank < 2 || isG1Welcome(m.content) || !Number.isFinite(Number(m.id))) return undefined;
    let alive = true;
    supabase.from('zchat_grp_as_group').select('sender_id').eq('message_id', m.id).maybeSingle().then(({ data }) => { if (alive && data && data.sender_id) setBy(data.sender_id); }, () => {});
    return () => { alive = false; };
  }, [m && m.id, asGroup, myRank]);
  const when = (v) => (v ? new Date(v).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }) : '');
  const rows = [];
  if (m && m.asked_at) rows.push({ k: 'asked', label: 'Asked to post', value: when(m.asked_at), icon: <Timer size={18} /> });
  if (asGroup && by) rows.push({ k: 'by', label: 'Sent by', value: by === myId ? 'You' : g1Name(members, by), icon: <User size={18} /> });
  return { subtitle: asGroup && group ? (isG1Welcome(m.content) ? `Welcome from ${group.name}` : `Posted as ${group.name}`) : null, rows };
}

function G1JoinAnswerList({ group, answers }) {
  const { theme } = useTheme();
  const qs = g1Questions(group);
  const list = Array.isArray(answers) ? answers.filter((a) => typeof a === 'string') : [];
  if (!list.length) return null;
  return (
    <div style={{ flexBasis: '100%', margin: '0 0 2px 58px', borderRadius: 12, background: theme.rowBg, padding: '6px 12px' }}>
      {list.map((a, i) => (
        <div key={i} style={{ padding: '5px 0' }}>
          <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, wordBreak: 'break-word' }}>{qs[i] || 'Answer'}</div>
          <div style={{ fontSize: 14, color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word', marginTop: 1 }}>{a}</div>
        </div>
      ))}
    </div>
  );
}
export function AddMembersPanel({ myId, existingIds, onClose, onAdd, iFollowIds, privacyAllowed }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const timer = useRef(null);

  const [suggested, setSuggested] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted').limit(200);
      const ids = (f || []).map((x) => x.following_id);
      if (!ids.length) return;
      const { data: profs } = await fetchProfilesView(ids, { live: true });
      if (!alive) return;
      const list = sanitizeAvatarList(profs, myId)
        .filter((u) => !existingIds.includes(u.id))
        .filter((u) => privacyAllows(u, 'privacy_groups', myId, iFollowIds, privacyAllowed))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setSuggested(list);
      setResults(list);
    })();
    return () => { alive = false; };
  }, [myId]);
  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(suggested); return; }
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !existingIds.includes(u.id) && !selected.find((s) => s.id === u.id)));
    }, 300);
  };

  const toggleSelect = (p) => {
    setSelected((prev) => (prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));
  };

  return (
    <>
    <WideDim onClose={onClose} z={45} />
    <div style={{ position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 45, display: 'flex', flexDirection: 'column' }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Add members" subtitle={selected.length ? `${selected.length} selected` : undefined} onBack={onClose} />
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
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
    </>
  );
}
const CHAT_MEDIA_LIMIT = 3000;
async function photoTextOnDevice(src) {
  if (typeof window === 'undefined' || typeof window.TextDetector !== 'function') return null;
  try {
    const url = isPrivateMedia(src) ? await resolveMedia(src) : src;
    const img = await loadImageEl(url);
    const found = await new window.TextDetector().detect(img);
    const items = (found || []).map((t) => ({ t: String((t && t.rawValue) || '').trim(), x: t && t.boundingBox ? t.boundingBox.left : 0, y: t && t.boundingBox ? t.boundingBox.top : 0, h: t && t.boundingBox ? t.boundingBox.height : 0 })).filter((i) => i.t).sort((a, b) => a.y - b.y);
    const rows = [];
    items.forEach((i) => { const r = rows.find((x) => Math.abs(x.y - i.y) < Math.max(x.h, i.h) * 0.5); if (r) r.items.push(i); else rows.push({ y: i.y, h: i.h, items: [i] }); });
    const text = rows.map((r) => r.items.sort((a, b) => a.x - b.x).map((i) => i.t).join(' ')).join('\n').trim();
    return text || null;
  } catch { return null; }
}
const photoTextMem = new Map();
export function PhotoTextSheet({ src, onClose }) {
  const { theme } = useTheme();
  const [state, setState] = useState({ busy: true, text: '', error: '', device: false });
  const [picked, setPicked] = useState('');
  const [mark, setMark] = useState('');
  const [tr, setTr] = useState(null);
  const [lang, setLang] = useState(() => autoTrFor(chatMarksMem.activeKey) || defaultTranslateLang());
  const [langOpen, setLangOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    let alive = true;
    const key = mediaCacheKey(src) || src;
    if (photoTextMem.has(key)) { setState({ busy: false, text: photoTextMem.get(key), error: '', device: false }); return undefined; }
    (async () => {
      const local = await photoTextOnDevice(src);
      if (!alive) return;
      if (local) { photoTextMem.set(key, local); setState({ busy: false, text: local, error: '', device: true }); return; }
      let pic = null;
      try { pic = await aipFit(src, [[1600, 0.86, 2400000], [1200, 0.8, 2400000]]); } catch { pic = null; }
      if (!alive) return;
      if (!pic) { setState({ busy: false, text: '', error: 'That photo could not be opened.', device: false }); return; }
      const r = await aipCall('ocr', { image: pic.data }, 45000);
      if (!alive) return;
      if (r.data) {
        const t = String(r.data.text || '').trim();
        if (!r.data.blocked) photoTextMem.set(key, t);
        setState({ busy: false, text: t, error: r.data.blocked ? 'This photo could not be read.' : '', device: false });
      } else setState({ busy: false, text: '', error: aipError(r, 'Copy text'), device: false });
    })();
    return () => { alive = false; };
  }, [src]);
  useEffect(() => {
    const on = () => {
      const sel = window.getSelection ? window.getSelection() : null;
      const box = boxRef.current;
      if (!sel || !box || sel.isCollapsed || !sel.rangeCount) return;
      if (!box.contains(sel.getRangeAt(0).commonAncestorContainer)) return;
      const t = sel.toString().replace(/\s+/g, ' ').trim();
      if (!t) return;
      setPicked((old) => { if (old !== t.slice(0, 300)) setTr(null); return t.slice(0, 300); });
      if (/\s/.test(t)) setMark('');
    };
    document.addEventListener('selectionchange', on);
    return () => document.removeEventListener('selectionchange', on);
  }, []);
  const tapWord = (e) => {
    const el = e.target;
    if (!el || !el.getAttribute || el.getAttribute('data-w') == null) return;
    try {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {}
    const w = String(el.textContent || '').trim();
    setPicked((old) => { if (old !== w) setTr(null); return w; });
    setMark(el.getAttribute('data-k') || '');
    hapticTap();
  };
  const translate = (to) => {
    const text = (picked || state.text).slice(0, 3000);
    if (!text) return;
    setTr({ busy: true, text: '', error: '', to });
    zchatTools('translate', { text, to }, 30000).then((r) => setTr((cur) => (cur && cur.to === to ? (r.data && r.data.text ? { busy: false, text: r.data.text, error: '', to } : { busy: false, text: '', error: toolErrorText(r, 'Translate'), to }) : cur)));
  };
  const langName = (TRANSLATE_LANGS.find(([k]) => k === lang) || [0, 'English'])[1];
  const short = picked.length > 24 ? `${picked.slice(0, 22).trim()}\u2026` : picked;
  const lines = state.text ? state.text.split('\n') : [];
  const peek = (
    <div style={{ padding: '12px 20px 6px' }}>
      {state.busy ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.muted, fontSize: 14, padding: '10px 0' }}><Spinner size={16} color={theme.muted} />Looking for text</div>
      ) : state.error ? (
        <div role="alert" style={{ fontSize: 14, color: theme.danger, fontWeight: 700, lineHeight: 1.5, padding: '6px 0' }}>{state.error}</div>
      ) : !state.text ? (
        <div style={{ fontSize: 14.5, color: theme.muted, lineHeight: 1.5, padding: '6px 0' }}>No text found in this photo.</div>
      ) : (
        <div ref={boxRef} onClick={tapWord} aria-label="Text in this photo" style={{ fontSize: 16, color: theme.ink, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: tr ? '22vh' : '38vh', overflowY: 'auto', userSelect: 'text', WebkitUserSelect: 'text', WebkitTouchCallout: 'default', cursor: 'text' }}>
          {lines.map((ln, i) => (
            <div key={i} style={{ minHeight: '1.6em' }}>
              {ln.split(/(\s+)/).map((w, j) => (/^\s+$/.test(w) || !w ? w : <span key={j} data-w="1" data-k={`${i}:${j}`} style={{ borderRadius: 5, padding: '1px 2px', margin: '0 -2px', background: mark === `${i}:${j}` ? `${theme.coral}38` : 'transparent', boxShadow: mark === `${i}:${j}` ? `0 0 0 1px ${theme.coral}66` : 'none', transition: 'background 140ms ease' }}>{w}</span>))}
            </div>
          ))}
        </div>
      )}
      {tr && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.muted, marginBottom: 4 }}>{`In ${(TRANSLATE_LANGS.find(([k]) => k === tr.to) || [0, 'English'])[1]}`}</div>
          {tr.busy ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: theme.muted, fontSize: 14, padding: '6px 0' }}><Spinner size={14} color={theme.muted} />Translating</div>
            : tr.error ? <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 700 }}>{tr.error}</div>
            : <div style={{ fontSize: 15.5, color: theme.ink, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '18vh', overflowY: 'auto', userSelect: 'text', WebkitUserSelect: 'text' }}>{tr.text}</div>}
          <div role="button" aria-label="Choose language" aria-expanded={langOpen} onClick={() => { hapticTap(); setLangOpen((v) => !v); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 48, cursor: 'pointer', marginTop: 4 }}>
            <span style={{ display: 'flex', width: 24, justifyContent: 'center', color: theme.muted, flexShrink: 0 }}><TranslateIcon size={20} /></span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: theme.ink }}>Translate into</span>
            <span style={{ fontSize: 15, color: theme.muted, flexShrink: 0 }}>{langName}</span>
            <ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0, transform: langOpen ? 'rotate(90deg)' : 'none', transition: reducedMotion() ? 'none' : 'transform 200ms ease' }} />
          </div>
          {langOpen && <ChoiceList label="Translate into" value={lang} onChange={(k) => { setLang(k); setLangOpen(false); try { localStorage.setItem('zchat-translate-to', k); } catch {} translate(k); }} options={langChoiceOptions((l) => `Translate to ${l}`)} style={{ borderTop: `1px solid ${theme.border}`, margin: '0 -4px' }} />}
        </div>
      )}
    </div>
  );
  const ready = !state.busy && !state.error && !!state.text;
  const actions = ready ? [
    { icon: <Copy size={18} />, label: picked ? `Copy \u201C${short}\u201D` : 'Copy all', onClick: async () => { const ok = await copyTextToClipboard(picked || state.text); appSnack(ok ? 'Copied' : 'Could not copy'); } },
    tr ? null : { icon: <TranslateIcon size={18} />, label: `Translate${picked ? ` \u201C${short}\u201D` : ''} into ${langName}`, keepOpen: true, onClick: () => { hapticTap(); translate(lang); } },
    { icon: <Search size={18} />, label: picked ? `Search \u201C${short}\u201D` : 'Search the web', hint: picked ? null : 'Tap a word first to search just that', onClick: () => { const q = (picked || lines.join(' ')).slice(0, 120); if (q) window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener'); } },
  ] : [];
  return <ChatRowSheet title="Text in this photo" subtitle={ready ? (picked ? 'Tap another word, or drag to pick more' : 'Tap a word to pick it, or copy it all') : state.device ? 'Read on this phone' : undefined} peek={peek} actions={actions} onClose={onClose} zIndex={1250} portal />;
}

const ASK_PHOTO_IDEAS = ['What is this?', 'What does the text say?', 'Where could this be?', 'Describe this photo'];
export function AskPhotoSheet({ src, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const thumb = useCachedMedia(src);
  const [turns, setTurns] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const picRef = useRef(null);
  const aliveRef = useRef(true);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => () => { aliveRef.current = false; }, []);
  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [turns.length, busy]);
  const ask = async (textIn) => {
    const text = String(textIn || q).replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!text || busy) return;
    setQ('');
    setNote('');
    setBusy(true);
    hapticTap();
    const history = turns.filter((t) => t.a).slice(-6).map((t) => ({ q: t.q, a: t.a }));
    setTurns((list) => [...list, { q: text, a: '' }]);
    try {
      if (!picRef.current) picRef.current = await aipFit(src, [[1024, 0.82, 1600000], [768, 0.78, 1600000]]);
    } catch { picRef.current = null; }
    if (!aliveRef.current) return;
    if (!picRef.current) { setTurns((list) => list.slice(0, -1)); setBusy(false); setNote('That photo could not be opened.'); return; }
    const r = await aipCall('ask', { image: picRef.current.data, q: text, history }, 45000);
    if (!aliveRef.current) return;
    setBusy(false);
    if (r.data && r.data.text) {
      setTurns((list) => list.map((t, i) => (i === list.length - 1 ? { ...t, a: String(r.data.text) } : t)));
      playUiSound('receive');
    } else {
      setTurns((list) => list.slice(0, -1));
      setQ(text);
      setNote(aipError(r, 'ZChat Bot'));
    }
  };
  const bubble = (mine, children, key) => (
    <div key={key} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
      {!mine && <img src="/bot-avatar.jpg" alt="" draggable={false} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />}
      <div style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: mine ? '18px 18px 6px 18px' : '18px 18px 18px 6px', background: mine ? theme.coral : theme.rowBg, color: mine ? '#FFFFFF' : theme.ink, fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word', userSelect: 'text', WebkitUserSelect: 'text' }}>{children}</div>
    </div>
  );
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 1250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.45)', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Ask ZChat Bot about this photo" className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, height: 'min(78vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)' }}>
          <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 18px 12px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', background: theme.rowBg, flexShrink: 0 }}>{thumb && <img src={thumb} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>Ask ZChat Bot</div>
                <div style={{ fontSize: 12, color: theme.muted }}>About this photo. Nothing is kept after you close this.</div>
              </div>
            </div>
          </div>
          <div ref={listRef} data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!turns.length && (
              <div role="list" aria-label="Questions to ask" style={{ display: 'flex', flexDirection: 'column', margin: '-4px -4px 0' }}>
                {ASK_PHOTO_IDEAS.map((t, i) => (
                  <div key={t} role="listitem" aria-label={`Ask ${t}`} onClick={() => ask(t)} className="zchat-row-press" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 46, padding: '2px 4px', borderRadius: 10, cursor: 'pointer' }}>
                    <span style={{ display: 'flex', color: theme.muted }}><AskPhotoIcon size={20} /></span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: theme.ink2 }}>{t}</span>
                    <span style={{ display: 'flex', color: theme.muted2 }}><StudioGlyph k="insert" size={18} /></span>
                    {i < ASK_PHOTO_IDEAS.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 36, right: 4, bottom: 0, height: 1, background: theme.hair }} />}
                  </div>
                ))}
              </div>
            )}
            {turns.map((t, i) => (
              <React.Fragment key={i}>
                {bubble(true, t.q, `q${i}`)}
                {t.a ? bubble(false, t.a, `a${i}`) : null}
              </React.Fragment>
            ))}
            {busy && bubble(false, <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: theme.muted }}><Spinner size={13} color={theme.muted} />Looking at the photo</span>, 'busy')}
          </div>
          {note && <div role="alert" style={{ padding: '0 18px 8px', fontSize: 13, fontWeight: 700, color: theme.danger, lineHeight: 1.45 }}>{note}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
            <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value.slice(0, 300)); if (note) setNote(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); ask(); } }} placeholder={turns.length ? 'Ask a follow up' : 'Ask about this photo'} aria-label="Ask about this photo" enterKeyHint="send"
              style={{ ...inputStyle(theme), flex: 1, minWidth: 0, borderRadius: 22, height: 44, padding: '0 16px' }} />
            <div role="button" aria-label="Ask" aria-disabled={!q.trim() || busy} onPointerDown={(e) => e.preventDefault()} onClick={() => ask()} className="zchat-press"
              style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: q.trim() && !busy ? 'pointer' : 'default', background: q.trim() && !busy ? theme.coral : theme.rowBg, color: q.trim() && !busy ? '#FFFFFF' : theme.muted, transition: 'background 160ms ease' }}>
              {busy ? <Spinner size={16} color={theme.muted} /> : <Send size={19} style={{ marginLeft: -2 }} />}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function ForwardPicker({ conversations, groups = [], onCancel, onPick, myId, title = 'Forward to', subtitle = 'Pick a person' }) {
  useBackClose(true, onCancel);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const [suggested, setSuggested] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', myId).eq('status', 'accepted').limit(200);
      const ids = (f || []).map((x) => x.following_id);
      if (!ids.length) return;
      const { data: profs } = await fetchProfilesView(ids, { live: true });
      if (!alive) return;
      const list = sanitizeAvatarList(profs, myId).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setSuggested(list);
      setResults(list);
    })();
    return () => { alive = false; };
  }, [myId]);
  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(suggested); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId));
      setSearching(false);
    }, 300);
  };

  const list = q.trim().length >= 2 ? results : conversations.map((c) => c.otherProfile);

  const searchingMode = q.trim().length >= 2;
  return (
    <FullPage title={title} subtitle={subtitle} onBack={onCancel} zIndex={90}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 6px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search by username" aria-label="Search people to forward to" autoCapitalize="none"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {searching ? <Spinner size={14} color={theme.muted} /> : q ? <X size={16} style={{ cursor: 'pointer' }} onClick={() => doSearch('')} /> : null}
      </label>
      {!searchingMode && list.length > 0 && <div style={{ padding: '14px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>Recent chats</div>}
      {list.length === 0 && (searchingMode || !groups.length) && (
        <EmptyState art={searchingMode ? 'nothing' : 'nochats'} title={searchingMode ? 'No one found' : 'No chats yet'} text={searchingMode ? 'Check the spelling of the username.' : 'Search for someone by username to forward this to them.'} />
      )}
      {list.map((p) => (
        <UserListRow key={p.id} profile={p} onClick={() => onPick(p)} rightContent={<ChevronRight size={18} color={theme.muted} />} />
      ))}
      {!searchingMode && groups.length > 0 && <div style={{ padding: '14px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>Groups</div>}
      {!searchingMode && groups.map((g) => (
        <div key={g.id} role="button" aria-label={`Forward to ${g.name}`} onClick={() => onPick({ __group: g })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', minHeight: 66, cursor: 'pointer' }}>
          <GroupAvatar avatar={g.avatar} name={g.name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 1 }}>Group</div>
          </div>
          <ChevronRight size={18} color={theme.muted} />
        </div>
      ))}
    </FullPage>
  );
}
const WIFI_SECURITY = [['WPA', 'WPA'], ['WEP', 'WEP'], ['nopass', 'None']];
export function WifiSheet({ onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [last] = useState(() => readJsonLs('zchat-wifi-last', null));
  const [network, setNetwork] = useState(last && typeof last.n === 'string' ? last.n.slice(0, 64) : '');
  const [security, setSecurity] = useState(last && ['WPA', 'WEP', 'nopass'].includes(last.s) ? last.s : 'WPA');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(!!(last && last.h));
  const [show, setShow] = useState(true);
  const net = network.trim();
  const netBytes = (() => { try { return new TextEncoder().encode(net).length; } catch { return net.length; } })();
  const pwOk = security === 'nopass' || (security === 'WPA' ? password.length >= 8 && password.length <= 63 : [5, 10, 13, 26].includes(password.length));
  const ok = net.length > 0 && netBytes <= 32 && pwOk;
  const hint = netBytes > 32 ? 'Wifi names fit 32 letters at most.'
    : security === 'nopass' ? 'Anyone nearby can join an open network.'
      : security === 'WPA' && password.length > 0 && password.length < 8 ? 'Wifi passwords have at least 8 characters.'
        : security === 'WEP' && password.length > 0 && !pwOk ? 'WEP keys have 5, 10, 13 or 26 characters.'
          : 'The password shows only inside this chat, never in your chat list or alerts.';
  const send = () => {
    if (!ok) return;
    hapticTap();
    writeJsonLs('zchat-wifi-last', { n: net, s: security, h: hidden });
    onSend({ network: net, security, hidden, password: security === 'nopass' ? '' : password });
  };
  const field = { ...inputStyle(theme), fontSize: 16 };
  const label = (t) => <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '0 2px 7px' }}>{t}</div>;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 880, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} role="dialog" aria-modal="true" aria-label="Share wifi"
          style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, maxHeight: 'calc(100% - 24px)', overflowY: 'auto', background: theme.panelBg, borderRadius: '20px 20px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '4px 16px 14px', touchAction: 'none' }}>Share wifi</div>
          <div style={{ padding: '0 16px' }}>
            {label('Network name')}
            <input value={network} onChange={(e) => setNetwork(e.target.value.slice(0, 64))} placeholder="Like Home or Cafe Guest" aria-label="Network name" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off" enterKeyHint="next" style={{ ...field, marginBottom: 16 }} />
            {label('Security')}
            <SegmentedControl value={security} onChange={(v) => { hapticTap(); setSecurity(v); }} options={WIFI_SECURITY} style={{ marginBottom: 16 }} />
            {security !== 'nopass' && (
              <>
                {label('Password')}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <input value={password} onChange={(e) => setPassword(e.target.value.slice(0, 64))} aria-label="Wifi password" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="off" enterKeyHint="done" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
                    style={{ ...field, paddingRight: 48, WebkitTextSecurity: show ? 'none' : 'disc' }} />
                  <div role="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => { hapticTap(); setShow(!show); }} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer' }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</div>
                </div>
              </>
            )}
            <IgRow inset={false} label="Hidden network" sub="It does not show up in the wifi list" right={<IgToggle on={hidden} onClick={() => setHidden(!hidden)} />} />
            <div role={hint.startsWith('The password') ? undefined : 'status'} style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '4px 2px 14px' }}>{hint}</div>
            <BigButton label="Send wifi" disabled={!ok} onClick={send} />
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function ChatRowSheet({ title, subtitle, avatar, actions, onClose, zIndex = 94, portal = false, peek = null }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const body = (
    <div onClick={onClose} className="zchat-fade" style={{
      position: 'fixed', inset: 0, zIndex, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT,
      background: 'rgba(0,0,0,0.45)',
    }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition,
        width: '100%', maxWidth: 460, maxHeight: 'min(86vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)',
      }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} />
          </div>
          {(title || avatar) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px', borderBottom: `1px solid ${theme.border}` }}>
              {avatar}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                {subtitle && <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
              </div>
            </div>
          )}
        </div>
        <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', paddingTop: peek ? 0 : 4 }}>
          {peek}
          {actions.filter(Boolean).map((a) => (
            <div key={a.label} role="button" aria-label={a.label} onClick={() => { if (!a.keepOpen) onClose(); a.onClick(); }} className="zchat-row-press" style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: a.hint ? '9px 20px' : '14px 20px', cursor: 'pointer', boxSizing: 'border-box', minHeight: 52,
              fontSize: 15, fontWeight: 600, color: a.danger ? theme.danger : theme.ink,
            }}>
              <span style={{ display: 'flex', width: 24, justifyContent: 'center', color: a.danger ? theme.danger : theme.muted, flexShrink: 0 }}>{a.icon}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {a.label}
                {a.hint && <span style={{ display: 'block', fontSize: 12, color: theme.muted, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.hint}</span>}
              </span>
              {a.right}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  return portal ? <Portal>{body}</Portal> : body;
}

const ASK_Q_RE = /\?\s*$|^(what|when|where|who|whose|which|why|how|did|do|does|is|are|was|were|can|could|will|would|should|have|has|had)\b/i;
function chatAskLooks(q) {
  const t = String(q || '').trim();
  return t.length >= 6 && (ASK_Q_RE.test(t) || t.split(/\s+/).length >= 4);
}
function chatAskWhen(at) {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return `${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', ...(d.getFullYear() === new Date().getFullYear() ? {} : { year: 'numeric' }) })} ${fmtHM(d)}`;
}
function chatAskLine(m, labelFor) {
  if (!m || m.deleted || m.type === 'system' || !histServerRow(m)) return null;
  const w = parseWrapped(m.content);
  if (w && w.k === 'sec') return null;
  let t = '';
  if (m.type === 'text') {
    if (isSpecialContent(m.content) || parseGameMessage(m.content) || parseProfileLink(m.content) || parseExtraCard(m.content) || parsePoll(m.content)) return null;
    t = plainPreviewText(messageTextFor(m));
  } else if ((m.type === 'image' || m.type === 'video') && typeof m.content === 'string' && m.content && !/^z[a-z]{2,10}:/.test(m.content) && !parseOnce(m)) {
    t = `(${m.type === 'image' ? 'photo' : 'video'}) ${plainPreviewText(m.content)}`;
  }
  t = String(t || '').replace(/\s+/g, ' ').trim().slice(0, 400);
  if (!t) return null;
  const who = m.bot_reply ? 'ZChat Bot' : labelFor(m.sender_id);
  return { id: String(m.id), n: who === 'You' ? 'Me' : String(who || 'Someone').slice(0, 30), w: chatAskWhen(m.created_at), t, m };
}
export function ChatAskPanel({ query, loaded, fetchOlder, labelFor, chatName, onJump }) {
  const { theme } = useTheme();
  const [st, setSt] = useState(null);
  const runRef = useRef(0);
  const q = String(query || '').trim();
  useEffect(() => { runRef.current += 1; setSt(null); }, [q]);
  useEffect(() => () => { runRef.current += 1; }, []);
  if (!q || (!st && !chatAskLooks(q))) return null;
  const run = async () => {
    const my = ++runRef.current;
    hapticTap();
    setSt({ q, busy: true });
    const today = fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const loadedRows = (loaded || []).filter(histServerRow);
    const older = (async () => {
      let pool = [];
      let before = loadedRows.length ? histCur(loadedRows[0]) : null;
      for (let i = 0; i < 2 && pool.length + loadedRows.length < 600; i++) {
        const more = await fetchOlder(before, 300);
        if (!more || !more.length) break;
        const have = new Set([...pool, ...loadedRows].map((x) => String(x.id)));
        pool = [...more.filter((x) => !have.has(String(x.id))), ...pool];
        before = histCur(more[0]);
        if (more.length < 300) break;
      }
      return pool;
    })().catch(() => []);
    const cut = (list) => {
      let start = list.length;
      let size = 0;
      while (start > 0 && list.length - start < 140 && size + list[start - 1].t.length + 50 < 9000) { start -= 1; size += list[start].t.length + 50; }
      return start;
    };
    const askPart = (part) => zchatAichat('ask', { q, chat: String(chatName || '').slice(0, 60), today, items: part.map(({ id, n, w, t }) => ({ id, n, w, t })) }, 35000);
    let best = null;
    let asked = 0;
    const take = (r, part) => {
      const ids = r.data && Array.isArray(r.data.ids) ? r.data.ids.map(String) : [];
      if (!ids.length) return false;
      const found = { answer: String(r.data.answer || ''), hits: ids.map((id) => part.find((x) => x.id === id)).filter(Boolean) };
      if (!found.hits.length) return false;
      if (!best || r.data.sure) best = found;
      return !!r.data.sure;
    };
    let lines = loadedRows.map((m) => chatAskLine(m, labelFor)).filter(Boolean);
    let end = lines.length;
    if (end > 0) {
      const start = cut(lines.slice(0, end));
      const part = lines.slice(start, end);
      const r = await askPart(part);
      if (my !== runRef.current) return;
      asked += 1;
      if (!r.data) { setSt({ q, error: toolErrorText(r, 'Ask') }); return; }
      if (take(r, part)) { playUiSound('receive'); setSt({ q, answer: best.answer, hits: best.hits }); return; }
      end = start;
    }
    const extra = await older;
    if (my !== runRef.current) return;
    lines = [...extra.map((m) => chatAskLine(m, labelFor)).filter(Boolean), ...lines.slice(0, end)];
    end = lines.length;
    if (!lines.length && !asked) { setSt({ q, none: true, text: 'There is nothing to read in this chat yet.' }); return; }
    while (end > 0 && asked < 4) {
      const start = cut(lines.slice(0, end));
      const part = lines.slice(start, end);
      setSt({ q, busy: true, step: asked + 1 });
      const r = await askPart(part);
      if (my !== runRef.current) return;
      asked += 1;
      if (!r.data) { if (!best) { setSt({ q, error: toolErrorText(r, 'Ask') }); return; } break; }
      if (take(r, part)) break;
      end = start;
    }
    if (!best || !best.hits.length) { setSt({ q, none: true, text: 'ZChat Bot could not find that in this chat.' }); return; }
    playUiSound('receive');
    setSt({ q, answer: best.answer, hits: best.hits });
  };
  const box = { margin: '0 12px 10px', borderRadius: 16, background: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.045)', flexShrink: 0 };
  if (!st) {
    return (
      <div role="button" aria-label="Ask ZChat Bot about this chat" onClick={run} className="zchat-row-press zchat-fade" style={{ ...box, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer' }}>
        <AiPracticeGlyph size={18} color={kitOnInk(theme)} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ fontWeight: 700 }}>Ask ZChat Bot</span><span style={{ color: theme.muted }}>{` ${q}`}</span></span>
        <ChevronRight size={16} color={theme.muted} />
      </div>
    );
  }
  return (
    <div className="zchat-fade" style={{ ...box, padding: '10px 12px 8px', maxHeight: '44vh', overflowY: 'auto', overscrollBehavior: 'contain' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AiPracticeGlyph size={17} color={kitOnInk(theme)} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: theme.muted }}>{st.busy ? (st.step > 1 ? 'Reading older messages' : 'Reading this chat') : 'ZChat Bot'}</span>
        {st.busy ? <Spinner size={14} color={theme.muted} /> : <div role="button" aria-label="Close answer" onClick={() => { runRef.current += 1; setSt(null); }} className="zchat-press" style={{ width: 28, height: 28, marginRight: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.muted }}><X size={16} /></div>}
      </div>
      {st.error && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0 2px', fontSize: 13.5, color: theme.danger, lineHeight: 1.45 }}>
          <span style={{ flex: 1, minWidth: 0 }}>{st.error}</span>
          <span role="button" aria-label="Try again" onClick={run} style={{ fontWeight: 800, color: theme.coral, cursor: 'pointer', flexShrink: 0 }}>Try again</span>
        </div>
      )}
      {st.none && <div style={{ padding: '6px 0 2px', fontSize: 14, color: theme.ink, lineHeight: 1.45 }}>{st.text}</div>}
      {st.hits && (
        <>
          {st.answer && <div data-zuser="" style={{ padding: '6px 0 4px', fontSize: 15, fontWeight: 600, color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word' }}>{st.answer}</div>}
          <div role="list" aria-label="Messages that answer it">
            {st.hits.map((h) => (
              <div key={h.id} role="listitem" aria-label={`Go to the message from ${h.n}`} onClick={() => { hapticTap(); onJump(h.m.id); }} className="zchat-row-press" style={{ display: 'flex', gap: 10, padding: '7px 2px', cursor: 'pointer', borderTop: `1px solid ${theme.hair}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: theme.muted }}><span style={{ fontWeight: 700, color: theme.ink2 }}>{h.n === 'Me' ? 'You' : h.n}</span>{h.w ? `, ${h.w}` : ''}</div>
                  <div style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.4, marginTop: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{h.t}</div>
                </div>
                <ChevronRight size={15} color={theme.muted} style={{ flexShrink: 0, alignSelf: 'center' }} />
              </div>
            ))}
          </div>
        </>
      )}
      {!st.busy && <div style={{ fontSize: 11.5, color: theme.muted, lineHeight: 1.45, paddingTop: 6 }}>Only you see this. ZChat Bot reads these messages once and keeps nothing.</div>}
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

const photoLabelMem = { uid: null, byId: new Map(), chats: new Map(), jobs: new Map(), tried: new Set(), subs: new Set(), all: 'idle' };
function photoLabelPing() { photoLabelMem.subs.forEach((f) => { try { f(); } catch {} }); }
function usePhotoLabels() {
  const [, setN] = useState(0);
  useEffect(() => { const f = () => setN((n) => n + 1); photoLabelMem.subs.add(f); return () => { photoLabelMem.subs.delete(f); }; }, []);
  return photoLabelMem;
}
function photoLabelUser(uid) {
  if (photoLabelMem.uid === uid) return;
  photoLabelMem.uid = uid;
  photoLabelMem.byId.clear();
  photoLabelMem.chats.clear();
  photoLabelMem.jobs.forEach((j) => { j.stopped = true; });
  photoLabelMem.jobs.clear();
  photoLabelMem.tried.clear();
  photoLabelMem.all = 'idle';
}
function photoWords(q) {
  return String(q || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter((w) => w && w.length <= 40).slice(0, 6).map((w) => (w.length > 3 ? w.replace(/s$/, '') : w));
}
function photoMatch(labels, words) {
  const s = ` ${labels || ''}`;
  return words.length > 0 && words.every((w) => s.indexOf(` ${w}`) >= 0);
}
function photoCanLabel(m) {
  return !!m && m.type === 'image' && !!m.media_url && /^\d{1,18}$/.test(String(m.id)) && !/^z(once|blur):/.test(String(m.content || ''));
}
async function photoLabelsLoad(uid, chatKey) {
  photoLabelUser(uid);
  const key = chatKey || '*';
  const st = photoLabelMem.chats.get(key);
  if (st === 'loaded' || st === 'loading') return;
  photoLabelMem.chats.set(key, 'loading');
  let q = supabase.from('photo_labels').select('message_id, labels').limit(5000);
  if (chatKey) q = q.eq('chat_key', chatKey);
  const { data, error } = await q;
  if (photoLabelMem.uid !== uid) return;
  if (error) { photoLabelMem.chats.set(key, rpcMissing(error) ? 'off' : 'idle'); photoLabelPing(); return; }
  (data || []).forEach((r) => photoLabelMem.byId.set(String(r.message_id), String(r.labels || '')));
  photoLabelMem.chats.set(key, 'loaded');
  photoLabelPing();
}
function photoLabelRun(uid, jobKey, photos) {
  photoLabelUser(uid);
  const have = photoLabelMem.jobs.get(jobKey);
  if (have && have.running) return have;
  const todo = photos.filter((m) => photoCanLabel(m) && !photoLabelMem.byId.has(String(m.id)) && !photoLabelMem.tried.has(String(m.id)));
  if (!todo.length) return have || null;
  const job = { running: true, done: 0, total: todo.length, error: '', stopped: false };
  photoLabelMem.jobs.set(jobKey, job);
  photoLabelPing();
  (async () => {
    for (let i = 0; i < todo.length && !job.stopped; i += 6) {
      const batch = todo.slice(i, i + 6);
      batch.forEach((m) => photoLabelMem.tried.add(String(m.id)));
      const items = (await Promise.all(batch.map(async (m) => { try { const p = await aipImageData(m.media_url, 384, 0.7); return { id: String(m.id), img: p.data }; } catch { return null; } }))).filter(Boolean);
      if (job.stopped) break;
      if (items.length) {
        const r = await aipCall('labels', { items }, 60000);
        if (job.stopped) break;
        if (!r.data) { job.error = aipError(r, 'Search photos'); batch.forEach((m) => photoLabelMem.tried.delete(String(m.id))); break; }
        (r.data.items || []).forEach((x) => { if (x && x.id != null) photoLabelMem.byId.set(String(x.id), String(x.labels || '')); });
        if (r.data.capped) { job.done += batch.length; job.error = 'You have looked through a lot of photos today. More tomorrow.'; break; }
      }
      job.done += batch.length;
      photoLabelPing();
    }
    job.running = false;
    photoLabelPing();
  })();
  return job;
}
function PhotoLabelProgress({ job, theme }) {
  if (!job || (!job.running && !job.error)) return null;
  const pct = job.total ? Math.min(100, Math.round((job.done / job.total) * 100)) : 0;
  return (
    <div role="status" style={{ padding: '8px 2px 2px' }}>
      {job.running && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: theme.muted }}>
            <span style={{ flex: 1, minWidth: 0 }}>{`Looking through photos, ${Math.min(job.done, job.total)} of ${job.total}`}</span>
          </div>
          <div aria-hidden="true" style={{ height: 3, borderRadius: 2, background: theme.rowBg, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(4, pct)}%`, height: '100%', background: theme.coral, borderRadius: 2, transition: 'width 300ms ease' }} />
          </div>
        </>
      )}
      {!job.running && job.error && <div role="alert" style={{ fontSize: 12.5, color: theme.danger, fontWeight: 700, lineHeight: 1.45 }}>{job.error}</div>}
    </div>
  );
}
function PhotoSearchField({ value, onChange, theme, autoFocus, onFocus }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted }}>
      <Search size={17} />
      <input value={value} onChange={(e) => onChange(e.target.value.slice(0, 60))} onFocus={onFocus} placeholder="Search photos, like beach or receipt" aria-label="Search photos" autoCapitalize="none" autoComplete="off" enterKeyHint="search" autoFocus={autoFocus}
        style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
      {value && <X size={16} aria-label="Clear search" style={{ cursor: 'pointer' }} onClick={() => onChange('')} />}
    </label>
  );
}
function ChatPhotoSearch({ uid, chatKey, photos, q, onQ, onOpen }) {
  const { theme } = useTheme();
  const mem = usePhotoLabels();
  const words = photoWords(q);
  useEffect(() => { if (words.length) photoLabelsLoad(uid, chatKey); }, [uid, chatKey, words.length > 0]);
  const loaded = mem.chats.get(chatKey);
  const pics = useMemo(() => photos.filter(photoCanLabel).slice().reverse(), [photos]);
  useEffect(() => { if (words.length && loaded === 'loaded' && pics.length) photoLabelRun(uid, chatKey, pics); }, [words.length > 0, loaded, pics.length, chatKey]);
  const job = mem.jobs.get(chatKey) || null;
  const hits = words.length ? pics.filter((m) => photoMatch(mem.byId.get(String(m.id)), words)) : [];
  const labelled = pics.filter((m) => mem.byId.has(String(m.id))).length;
  return (
    <div style={{ padding: '8px 12px 0' }}>
      <PhotoSearchField value={q} onChange={onQ} theme={theme} onFocus={() => photoLabelsLoad(uid, chatKey)} />
      {words.length > 0 && <PhotoLabelProgress job={job} theme={theme} />}
      {loaded === 'off' && words.length > 0 && <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0' }}>Search photos switches on once the latest ZChat setup is finished.</div>}
      {words.length > 0 && (hits.length ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '12px 2px 6px' }}>{hits.length === 1 ? '1 photo' : `${hits.length} photos`}</div>
          <div role="list" aria-label="Matching photos" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, margin: '0 -10px' }}>
            {hits.map((m) => (
              <div key={m.id} role="listitem" aria-label="Open this photo in the chat" onClick={() => { hapticTap(); onOpen(m); }} className="zchat-press" style={{ position: 'relative', aspectRatio: '1 / 1', background: '#000', cursor: 'pointer', overflow: 'hidden' }}>
                <MediaImg src={m.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '30px 16px', fontSize: 13.5, color: theme.muted, lineHeight: 1.5 }}>
          {job && job.running ? 'Nothing yet. Still looking through the photos.' : labelled < pics.length && !(job && job.error) ? 'Looking through the photos' : `No photos of ${q.trim()} in this chat`}
        </div>
      ))}
      {words.length > 0 && <div style={{ fontSize: 11.5, color: theme.muted, padding: '2px 2px 10px', lineHeight: 1.45 }}>ZChat Bot looks at the photos in this chat to find them. The words it picks are kept only for you.</div>}
    </div>
  );
}

export function PhotoFindPage({ uid, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const mem = usePhotoLabels();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const seqRef = useRef(0);
  useEffect(() => { photoLabelsLoad(uid, null); }, [uid]);
  const words = photoWords(q);
  const job = mem.jobs.get('all') || null;
  const search = async (text) => {
    const my = ++seqRef.current;
    if (!photoWords(text).length) { setRes(null); setBusy(false); setErr(''); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('zchat_photo_find', { p_q: text, p_chat: null, p_limit: 90 });
    if (my !== seqRef.current) return;
    setBusy(false);
    if (error) { setErr(rpcFailText('zchat_photo_find', error, 'Search photos switches on once the latest ZChat setup is finished.')); return; }
    setErr('');
    setRes(Array.isArray(data) ? data : []);
  };
  useEffect(() => { const t = setTimeout(() => search(q), words.length ? 260 : 0); return () => clearTimeout(t); }, [q]);
  const doneN = job ? job.done : 0;
  useEffect(() => { if (words.length && job && !job.running) search(q); }, [job && job.running]);
  useEffect(() => { if (words.length && job && job.running && doneN && doneN % 24 === 0) search(q); }, [doneN]);
  const lookThrough = async () => {
    if (job && job.running) return;
    hapticTap();
    setErr('');
    const { data, error } = await supabase.from('messages').select('id, type, content, media_url, created_at, expires_at').eq('type', 'image').eq('deleted', false).order('created_at', { ascending: false }).limit(300);
    if (error) { setErr(friendlyError(error, "Couldn't load your photos. Try again.")); return; }
    const list = (data || []).filter((m) => photoCanLabel(m) && !(m.expires_at && new Date(m.expires_at).getTime() <= Date.now()));
    const run = photoLabelRun(uid, 'all', list);
    if (!run) setErr('All your recent photos are ready to search.');
  };
  const total = mem.byId.size;
  const state = mem.chats.get('*');
  const dateLabel = (iso) => fmtDate(new Date(iso), { day: 'numeric', month: 'short' });
  const ideas = ['beach', 'dog', 'receipt', 'birthday cake'];
  return (
    <FullPage title="Search photos" subtitle="In all your chats" onBack={onClose} zIndex={1200}>
      <div style={{ paddingTop: 8 }}><PhotoSearchField value={q} onChange={setQ} theme={theme} autoFocus={!isTouchDevice()} /></div>
      <PhotoLabelProgress job={job} theme={theme} />
      {err && <div role="alert" style={{ fontSize: 13, color: err.indexOf('ready') >= 0 ? theme.muted : theme.danger, fontWeight: 700, padding: '10px 2px 0' }}>{err}</div>}
      {!words.length && (
        <>
          {total === 0 && state !== 'loading' && !(job && job.running) ? (
            <EmptyState art="search" title="Find photos by what is in them" text="ZChat Bot looks through the photos in your chats so you can search them, like beach, dog or receipt. The words it picks are kept only for you."
              action={<PillButton primary label="Look through my photos" onClick={lookThrough} />} />
          ) : (
            <>
              <DetailSection title="Try">
                {ideas.map((w, i) => <DetailRow key={w} icon={<Search />} label={w.replace(/^./, (c) => c.toUpperCase())} onClick={() => { hapticTap(); setQ(w); }} last={i === ideas.length - 1} />)}
              </DetailSection>
              <DetailSection>
                <DetailRow icon={<PhotoFindIcon />} label={job && job.running ? 'Looking through photos' : 'Look through recent photos'} sub={total === 1 ? '1 photo ready to search' : `${formatCount(total)} photos ready to search`} onClick={lookThrough} last />
              </DetailSection>
            </>
          )}
        </>
      )}
      {words.length > 0 && res && res.length > 0 && (
        <div role="list" aria-label="Matching photos" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, paddingTop: 12 }}>
          {res.map((r) => (
            <div key={r.message_id} role="listitem" aria-label={`Open this photo in your chat with ${r.chat_name || 'them'}`} onClick={() => { hapticTap(); onOpen({ source_message_id: r.message_id, group_id: r.group_id || null, dm_user_id: r.group_id ? null : r.peer_id, message_created_at: r.created_at }); }} className="zchat-press"
              style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 10, overflow: 'hidden', background: theme.rowBg, cursor: 'pointer' }}>
              <MediaImg src={r.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '18px 7px 6px', background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.62))', color: '#FFFFFF' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.chat_name || 'Chat'}</div>
                <div style={{ fontSize: 10.5, opacity: 0.85 }}>{dateLabel(r.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {words.length > 0 && res && !res.length && !busy && !err && (
        <EmptyState art="search" title={`No photos of ${q.trim()}`} text={total ? 'Try another word, or look through more of your recent photos.' : 'Look through your photos first so ZChat Bot can find them.'}
          action={job && job.running ? null : <PillButton label="Look through recent photos" onClick={lookThrough} />} />
      )}
      {words.length > 0 && busy && !res && <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.muted} /></div>}
    </FullPage>
  );
}

export function ChatMediaPanel({ title, myId, otherId, groupId, hiddenIds, labelFor, onClose, onOpenImage, onOpenVideo, onJump }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const [tab, setTab] = useState('media');
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const togglePick = (id) => setPicked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [photoQ, setPhotoQ] = useState('');
  const [store, setStore] = useState({ media: null, links: null, voice: null });
  const [err, setErr] = useState({ media: '', links: '', voice: '' });
  const reqIdRef = useRef(0);

  const scopeQuery = (q) => (groupId ? q.eq('group_id', groupId) : q.is('group_id', null).or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`));
  const stillFresh = (m) => !hiddenIds.has(m.id) && !(m.expires_at && new Date(m.expires_at).getTime() <= Date.now()) && !parseOnce(m);

  const load = async (which) => {
    const myReq = ++reqIdRef.current;
    setErr((prev) => ({ ...prev, [which]: '' }));
    let q = supabase.from('messages').select('*')
      .eq('deleted', false).order('created_at', { ascending: false }).limit(CHAT_MEDIA_LIMIT);
    q = scopeQuery(q);
    q = which === 'links' ? q.eq('type', 'text') : which === 'voice' ? q.eq('type', 'audio') : q.in('type', ['image', 'video']);
    const { data, error } = await q;
    if (reqIdRef.current !== myReq) return;
    if (error) { setErr((prev) => ({ ...prev, [which]: friendlyError(error, "Couldn't load this. Try again.") })); return; }
    setStore((prev) => ({ ...prev, [which]: (data || []).filter(stillFresh) }));
  };

  useEffect(() => { setStore({ media: null, links: null, voice: null }); setErr({ media: '', links: '', voice: '' }); load('media'); }, [otherId, groupId]);
  useEffect(() => { if (store[tab] === null && !err[tab]) load(tab); }, [tab]);

  const downloadOne = async (m) => {
    try {
      const res = await fetch(await resolveMedia(m.media_url));
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `zchat-${m.type}-${m.id}.${m.type === 'video' ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch { const u = safeLinkUrl(signedMediaNow(m.media_url)); if (u) window.open(u, '_blank', 'noopener'); }
  };
  const downloadPicked = async (items) => {
    for (const m of items) { if (picked.has(m.id)) await downloadOne(m); }
    playUiSound('tap');
    setPicking(false); setPicked(new Set());
  };
  const media = (store.media || []).filter((m) => m.media_url).slice().reverse();
  const links = [];
  (store.links || []).slice().reverse().forEach((m) => {
    extractLinks(m.content).forEach((link, i) => links.push({ key: `${m.id}-${i}`, link, m }));
  });
  const voices = (store.voice || []).filter((m) => m.media_url).slice().reverse();
  const dateLabel = (iso) => fmtDate(new Date(iso), { day: 'numeric', month: 'short', year: 'numeric' });
  const countFor = (key, list) => (store[key] === null ? '' : ` (${list.length})`);
  const tabs = [
    { key: 'media', label: `Media${countFor('media', media)}` },
    { key: 'links', label: `Links${countFor('links', links)}` },
    { key: 'voice', label: `Voice${countFor('voice', voices)}` },
  ];
  const openLink = (link) => {
    const isEmail = link.includes('@') && !/^https?:|^www\./i.test(link);
    const href = isEmail ? `mailto:${link}` : (/^https?:/i.test(link) ? link : `https://${link}`);
    window.open(href, '_blank', 'noopener');
  };

  return (
    <>
    <WideDim onClose={onClose} z={60} />
    <div {...edgeBack} style={{ position: 'fixed', inset: 0, zIndex: 60, background: theme.bgGradient, display: 'flex', flexDirection: 'column' }} className="zchat-panel-open zchat-wide-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))', flexShrink: 0 }}>
        <div role="button" aria-label="Back" onClick={onClose} style={{ cursor: 'pointer', color: theme.ink, display: 'flex' }}><ArrowLeft size={20} /></div>
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
        {err[tab] && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <div style={{ fontSize: 13, color: theme.danger, fontWeight: 700, marginBottom: 10 }}>{err[tab]}</div>
            <div role="button" onClick={() => load(tab)} style={{ display: 'inline-block', fontSize: 13, fontWeight: 800, color: theme.coralDeep, cursor: 'pointer' }}>Try again</div>
          </div>
        )}
        {!err[tab] && store[tab] === null && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
        )}
        {!err.media && store.media !== null && tab === 'media' && (
          media.length ? (
            <>
              <ChatPhotoSearch uid={myId} chatKey={albumChatKey(myId, otherId, groupId)} photos={media} q={photoQ} onQ={setPhotoQ} onOpen={(m) => { onJump(m.id); setTimeout(() => onOpenImage(m.media_url), 420); }} />
              {!photoQ && <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px 0' }}>
                <div role="button" onClick={() => { if (picking) setPicked(new Set()); setPicking((v) => !v); }} style={{ fontSize: 12.5, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>{picking ? 'Cancel' : 'Select'}</div>
              </div>
              {(() => {
                const weekAgo = Date.now() - 7 * 86400000;
                const thisWeek = media.filter((m) => new Date(m.created_at).getTime() >= weekAgo);
                const earlier = media.filter((m) => new Date(m.created_at).getTime() < weekAgo);
                const grid = (items) => (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
                    {items.map((m) => (
                      <div key={m.id} onClick={() => (picking ? togglePick(m.id) : (m.type === 'image' ? onOpenImage(m.media_url) : onOpenVideo({ url: m.media_url, trimStart: m.trim_start, trimEnd: m.trim_end, overlayUrl: m.overlay_url })))}
                        style={{ position: 'relative', aspectRatio: '1 / 1', background: '#000', cursor: 'pointer', overflow: 'hidden' }}>
                        {m.type === 'image'
                          ? <MediaImg src={m.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: picking && !picked.has(m.id) ? 0.5 : 1 }} />
                          : <VideoThumb src={m.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', opacity: picking && !picked.has(m.id) ? 0.5 : 1 }} />}
                        {!picking && <SensTileVeil m={m} />}
                        {m.type === 'video' && !picking && (
                          <div style={{ position: 'absolute', left: 6, bottom: 6, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={11} color="white" style={{ marginLeft: 1 }} />
                          </div>
                        )}
                        {picking && (
                          <div style={{ position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: '50%', border: '2px solid white', background: picked.has(m.id) ? '#2563eb' : 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {picked.has(m.id) && <Check size={12} color="white" strokeWidth={4} />}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
                return (
                  <>
                    {thisWeek.length > 0 && <><div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '10px 14px 4px' }}>This week</div>{grid(thisWeek)}</>}
                    {earlier.length > 0 && <><div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '10px 14px 4px' }}>Earlier</div>{grid(earlier)}</>}
                  </>
                );
              })()}
              {picking && (
                <div style={{ position: 'sticky', bottom: 0, padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', background: theme.panelBg, borderTop: `1px solid ${theme.border}` }}>
                  <button disabled={!picked.size} onClick={() => downloadPicked(media)} style={{ width: '100%', padding: '12px', borderRadius: 13, border: 'none', fontFamily: FONT, fontWeight: 800, fontSize: 14, cursor: picked.size ? 'pointer' : 'default', background: picked.size ? theme.coral : theme.rowBg, color: picked.size ? 'white' : theme.muted }}>{picked.size ? `Save ${picked.size} to your phone` : 'Select items to save'}</button>
                </div>
              )}
              </>}
            </>
          ) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Photos and videos you share will show here</div>
        )}
        {!err.links && store.links !== null && tab === 'links' && (
          links.length ? links.map(({ key, link, m }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ width: 32, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}>
                {link.includes('@') && !/^https?:|^www\./i.test(link) ? <Mail size={18} /> : <LinkIcon size={18} />}
              </div>
              <div onClick={() => openLink(link)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.coralDeep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</div>
                <div style={{ fontSize: 11.5, color: theme.muted }}>{labelFor(m.sender_id)}, {dateLabel(m.created_at)}</div>
              </div>
              <span onClick={() => onJump(m.id)} style={{ fontSize: 12, fontWeight: 700, color: theme.muted, cursor: 'pointer', flexShrink: 0 }}>Show</span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Links and emails you share will show here</div>
        )}
        {!err.voice && store.voice !== null && tab === 'voice' && (
          voices.length ? voices.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink }}>{labelFor(m.sender_id)} <span style={{ color: theme.muted, fontWeight: 500, marginLeft: 3 }}>{dateLabel(m.created_at)}</span></div>
                <AudioBubble url={m.media_url} isMe={false} />
              </div>
              <span onClick={() => onJump(m.id)} style={{ fontSize: 12, fontWeight: 700, color: theme.muted, cursor: 'pointer', flexShrink: 0 }}>Show</span>
            </div>
          )) : <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: theme.muted }}>Voice messages will show here</div>
        )}
      </div>
    </div>
    </>
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
export function DraftsPage({ uid, onClose, onOpen, kind = null }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const list = useDraftList(uid, kind);
  const [menu, setMenu] = useState(null);
  const [opening, setOpening] = useState(null);
  const [gone, setGone] = useState(() => new Set());
  const [again, setAgain] = useState(false);
  useEffect(() => { setAgain(false); }, [list]);
  const fail = list && !again && draftSync.err && !draftSync.off ? loadFailCode(draftSync.err) : null;
  const retry = () => { setAgain(true); announceDrafts(); };
  const lp = useRef({});
  const shown = (list || []).filter((d) => !gone.has(d.id));
  const open = async (d) => {
    if (opening) return;
    if (lp.current.fired === d.id) { lp.current.fired = false; return; }
    if (!d.remote) { onOpen(d); return; }
    setOpening(d.id);
    const full = await openDraftFull(d);
    setOpening(null);
    if (full) onOpen(full); else appSnack('That draft could not load. Check your connection and try again.');
  };
  const remove = async (d) => {
    setGone((s) => new Set([...s, d.id]));
    playUiSound('delete');
    await deleteDraft(d.id);
    announceDrafts();
  };
  return (
    <FullPage title="Drafts" subtitle={shown.length ? `${shown.length} of ${DRAFT_MAX}` : undefined} onBack={onClose} zIndex={720} pad={false}>
      {list === null || again ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div> : !shown.length ? (fail !== null ? <LoadFail code={fail} onRetry={retry} /> : (
        <EmptyState art="nothing" title="No drafts" text={kind === 'post' ? 'When you make a post, tap Save draft to finish it later.' : 'When you leave a post or a story before sharing, you can save it here to finish later.'} />
      )) : (
        <div role="list" aria-label="Drafts" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {shown.map((d) => (
            <div key={d.id} role="listitem" aria-label={`${d.kind === 'story' ? 'Story' : 'Post'} draft from ${draftDateLabel(d.at)}`} onClick={() => open(d)} {...storyLongPress(lp.current, d.id, () => setMenu(d))} style={{ cursor: 'pointer', position: 'relative' }}>
              <DraftThumb draft={d} />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 7px 6px', background: 'linear-gradient(transparent, rgba(0,0,0,0.62))', color: '#FFFFFF' }}>
                {d.caption && <div data-zuser="" style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.caption}</div>}
                <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}>{d.kind === 'story' && !kind ? `Story, ${draftDateLabel(d.at)}` : draftDateLabel(d.at)}</div>
              </div>
              {opening === d.id && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={18} color="#FFFFFF" /></div>}
            </div>
          ))}
        </div>
      )}
      {shown.length > 0 && fail !== null && <LoadFail small code={fail} onRetry={retry} />}
      {shown.length > 0 && <div style={{ fontSize: 12.5, color: theme.muted, padding: '14px 20px', lineHeight: 1.5 }}>{draftSync.off ? 'Drafts stay on this phone. Hold one to delete it.' : 'Drafts are saved to your account, so you can finish them on any of your devices. Hold one to delete it.'}</div>}
      {menu && <ActionSheet title="Draft" onClose={() => setMenu(null)} zIndex={760} items={[
        { k: 'open', label: 'Keep editing', icon: <Pencil />, on: () => { const d = menu; setMenu(null); open(d); } },
        { k: 'delete', label: 'Delete draft', icon: <Trash2 />, danger: true, on: () => { const d = menu; setMenu(null); remove(d); } },
      ]} />}
    </FullPage>
  );
}

export function TextStylePanel({ draft, font, size, onFont, onSize, onDone, uid, onOpenBubbles, fancy, onFancy, fancySample }) {
  const { theme, keepTextStyle, setKeepTextStyle, bubbleStyle, setBubbleStyle } = useTheme();
  const [tab, setTab] = useState('font');
  const owned = useOwnedBubbles(uid);
  useEffect(() => { ensureTextFonts(); }, []);
  const previewPx = Math.min(26, Math.max(11, textSizePx(size)));
  const wearing = bubbleKeyOf(bubbleStyle);
  const spec = wearing ? CHAR_BUBBLES[wearing] : null;
  const changed = !!font || size !== 'm' || !!fancy;
  const reset = () => { hapticTap(); onFont(null); onSize('m'); if (onFancy && fancy) onFancy(null); };
  const raw = draft.trim() ? draft.trim().slice(0, 90) : 'Your message looks like this';
  const sample = fancy && onFancy ? cmFancyText(raw, fancy) : raw;
  const bubbleKeys = ['classic', ...(owned || []).filter((k) => CHAR_BUBBLES[k])];
  const tileLine = theme.dark ? 'rgba(255,255,255,0.13)' : 'rgba(17,17,19,0.09)';
  const tabs = [['font', 'Font'], ...(onFancy ? [['fancy', 'Fancy']] : []), ['bubble', 'Bubble']];
  const sizes = [['s', 'Small'], ['m', 'Normal'], ['l', 'Big'], ['xl', 'Huge']];
  const sizeNow = size === 'xxs' || size === 'xs' ? 's' : size || 'm';
  const tile = (on) => ({ position: 'relative', borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 72, boxSizing: 'border-box', background: on ? theme.accentSoft || theme.soft : theme.soft, boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none', color: theme.ink });
  return (
    <div className="zchat-sheet-up" style={{ padding: '10px 14px 12px', background: theme.panelBg, borderTop: `0.5px solid ${theme.border}`, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, boxShadow: '0 -10px 30px rgba(0,0,0,0.18)' }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}><span style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>Text style</span>
        {changed && <div role="button" onClick={reset} className="zchat-press" style={{ height: 34, padding: '0 12px', borderRadius: 17, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: theme.muted, cursor: 'pointer' }}>Reset</div>}
        <div role="button" onClick={onDone} className="zchat-press" style={{ height: 34, padding: '0 18px', borderRadius: 17, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 800, color: '#FFFFFF', background: theme.coral, cursor: 'pointer' }}>Done</div>
      </div>
      <div style={{ borderRadius: 18, padding: '12px 12px 12px', background: theme.dark ? '#0E0E12' : '#F2F2F6', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 92, maxHeight: 150, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <div style={{ alignSelf: 'flex-start', maxWidth: '70%', background: theme.bubbleThem, color: theme.ink, borderRadius: 18, borderBottomLeftRadius: 5, padding: '7px 12px', fontSize: 14.5, lineHeight: 1.3 }}>How does this look?</div>
        {spec ? (
          <div style={{ position: 'relative', alignSelf: 'flex-end', maxWidth: `calc(100% - ${bubbleLayout(spec, true, BUBBLE_CW, previewPx).side}px)`, ...bubbleWrapCss(spec, true, BUBBLE_CW, previewPx) }}>
            <div style={{ ...charBubbleCss(spec, true), lineHeight: 1.3, wordBreak: 'break-word', ...fontStyleCss(font), color: spec.ink, fontSize: previewPx }}>
              <span style={{ position: 'relative' }}>{sample}</span>
              <CharBubbleDecor k={wearing} isMe fontSize={previewPx} />
            </div>
          </div>
        ) : (
          <div style={{ alignSelf: 'flex-end', maxWidth: '86%', background: theme.bubbleMe, borderRadius: 19, borderBottomRightRadius: 5, padding: '8px 13px', lineHeight: 1.3, wordBreak: 'break-word', ...fontStyleCss(font), color: theme.ink, fontSize: previewPx }}>{sample}</div>
        )}
      </div>
      <div role="radiogroup" aria-label="Text size" style={{ display: 'flex', gap: 6, padding: 3, borderRadius: 14, background: theme.soft }}>
        {sizes.map(([k, l]) => {
          const on = sizeNow === k;
          return (
            <div key={k} role="radio" aria-checked={on} aria-label={`Text size ${l}`} onClick={() => { if (!on) { hapticTap(); onSize(k); } }} className="zchat-press"
              style={{ flex: 1, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: on ? theme.panelBg : 'transparent', boxShadow: on ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', color: on ? theme.ink : theme.muted }}>
              <span aria-hidden="true" style={{ fontWeight: 800, fontSize: { s: 12, m: 14.5, l: 17, xl: 20 }[k] || 14 }}>A</span>
              <span style={{ fontSize: 12.5, fontWeight: on ? 750 : 600 }}>{l}</span>
            </div>
          );
        })}
      </div>
      <div role="tablist" aria-label="Style" style={{ display: 'flex', gap: 18, padding: '0 2px', boxShadow: `inset 0 -0.5px 0 ${theme.hair}` }}>
        {tabs.map(([k, l]) => {
          const on = tab === k;
          return (
            <div key={k} role="tab" aria-selected={on} onClick={() => { if (!on) { hapticTap(); setTab(k); } }} style={{ position: 'relative', padding: '6px 2px 9px', fontSize: 14.5, fontWeight: on ? 800 : 600, color: on ? theme.ink : theme.muted, cursor: 'pointer' }}>
              {l}
              {on && <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, borderRadius: 2, background: theme.ink }} />}
            </div>
          );
        })}
      </div>
      {tab === 'fancy' && onFancy ? (
        <CmFancyList value={fancy} sample={raw} onPick={onFancy} />
      ) : tab === 'bubble' ? (
        <div data-testid="bubble-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '2px 4px 4px', margin: '0 -4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {bubbleKeys.map((k) => {
            const on = (wearing || 'classic') === k;
            const label = k === 'classic' ? 'Classic' : CHAR_BUBBLES[k].label;
            return (
              <div key={k} role="button" aria-label={`Bubble style ${label}`} aria-pressed={on} onClick={() => { hapticTap(); setBubbleStyle(k); }} className="zchat-press"
                style={{ flex: '0 0 auto', width: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ position: 'relative', width: '100%', height: 72, borderRadius: 16, boxSizing: 'border-box', padding: '0 8px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: theme.soft, boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none' }}>
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}><CharBubbleSample k={k} text="Hi" cw={38} fontSize={13} /></div>
                </div>
                <span style={{ marginTop: 6, fontSize: 12, fontWeight: on ? 750 : 600, color: on ? theme.ink : theme.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{label}</span>
              </div>
            );
          })}
          {onOpenBubbles && (
            <div role="button" aria-label="See every bubble" onClick={onOpenBubbles} className="zchat-press"
              style={{ flex: '0 0 auto', width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ width: '100%', height: 72, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink2, boxShadow: `inset 0 0 0 1.5px ${tileLine}` }}><BubblesIcon size={26} /></div>
              <span style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: theme.ink2, whiteSpace: 'nowrap' }}>{owned && owned.length ? 'Get more' : 'Get bubbles'}</span>
            </div>
          )}
        </div>
      ) : (
        <div data-testid="font-row" role="radiogroup" aria-label="Font" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, maxHeight: 168, overflowY: 'auto', padding: 2, margin: -2 }}>
          {FONT_STYLES.map((f) => {
            const on = (font || 'classic') === f.key;
            return (
              <div key={f.key} role="radio" aria-checked={on} aria-label={`Font ${f.label}`} onClick={() => { hapticTap(); onFont(f.key === 'classic' ? null : f.key); }} className="zchat-press" style={tile(on)}>
                <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1, ...(f.css || {}) }}>Aa</span>
                <span style={{ fontSize: 11.5, fontWeight: on ? 750 : 600, color: on ? theme.ink : theme.muted, maxWidth: '92%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</span>
              </div>
            );
          })}
        </div>
      )}
      <div role="switch" aria-checked={keepTextStyle} aria-label="Keep this style for next time" onClick={() => setKeepTextStyle(!keepTextStyle)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '2px 0' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: theme.ink }}>Keep this style for next time</span>
        <IgToggle on={!!keepTextStyle} />
      </div>
    </div>
  );
}

function CmFancyList({ value, sample, onPick }) {
  const { theme } = useTheme();
  const rows = [{ k: null, label: 'Normal' }, ...CM_FANCY];
  return (
    <div data-testid="fancy-row" role="radiogroup" aria-label="Fancy text" style={{ display: 'flex', flexDirection: 'column', maxHeight: 176, overflowY: 'auto', margin: '0 -4px', overscrollBehavior: 'contain' }}>
      {rows.map((f, i) => {
        const on = (value || null) === f.k;
        return (
          <div key={f.k || 'normal'} role="radio" aria-checked={on} aria-label={`Fancy text ${f.label}`} onClick={() => onPick(f.k)} className="zchat-row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46, padding: '4px 6px', borderRadius: 10, cursor: 'pointer', position: 'relative' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, color: theme.ink, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.k ? cmFancyText(sample, f.k) : sample}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: on ? kitOnInk(theme) : theme.muted, marginTop: 1 }}>{f.label}</div>
            </div>
            <div aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 10, flexShrink: 0, boxSizing: 'border-box', border: on ? 'none' : `1.6px solid ${theme.muted2}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Check size={12} color="#FFFFFF" strokeWidth={3} />}</div>
            {i < rows.length - 1 && <div aria-hidden="true" style={{ position: 'absolute', left: 6, right: 6, bottom: 0, height: 1, background: theme.hair }} />}
          </div>
        );
      })}
    </div>
  );
}
const CHAT_TABS = [['unread', 'Unread'], ['favs', 'Favourites'], ['unanswered', 'Unanswered'], ['groups', 'Groups']];
function DragHandleIcon({ size = 20, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M5 9h14M5 15h14" /></svg>;
}

export function FoldersManagerPage({ uid, onClose, onEdit, onNew }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(() => readFolders(uid));
  const [tabs, setTabs] = useState(readChatTabs);
  const [drag, setDrag] = useState(null);
  const rowH = 64;
  useEffect(() => {
    const on = () => setList(readFolders(uid));
    window.addEventListener('zchat-folders-changed', on);
    return () => window.removeEventListener('zchat-folders-changed', on);
  }, [uid]);
  const commit = (next) => { setList(next); saveFoldersEverywhere(uid, next); };
  const setTab = (k, v) => {
    const next = { ...tabs, [k]: v };
    setTabs(next);
    try { localStorage.setItem('zchat-chat-tabs', JSON.stringify(next)); } catch {}
    pushFoldersRemote(uid);
    try { window.dispatchEvent(new Event('zchat-folders-changed')); } catch {}
  };
  const startDrag = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    hapticTap();
    setDrag({ from: i, y0: e.clientY, dy: 0, id: e.pointerId });
  };
  const moveDrag = (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    setDrag((d) => (d ? { ...d, dy: e.clientY - d.y0 } : d));
  };
  const endDrag = () => {
    if (!drag) return;
    const to = Math.max(0, Math.min(list.length - 1, drag.from + Math.round(drag.dy / rowH)));
    if (to !== drag.from) {
      const next = list.slice();
      const [m] = next.splice(drag.from, 1);
      next.splice(to, 0, m);
      commit(next);
      hapticTap();
    }
    setDrag(null);
  };
  const target = drag ? Math.max(0, Math.min(list.length - 1, drag.from + Math.round(drag.dy / rowH))) : -1;
  const shiftFor = (i) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < target && i > drag.from && i <= target) return -rowH;
    if (drag.from > target && i < drag.from && i >= target) return rowH;
    return 0;
  };
  const countLabel = (f) => {
    const r = f.rules || {};
    const bits = [];
    if ((f.members || []).length) bits.push(`${f.members.length} ${f.members.length === 1 ? 'chat' : 'chats'}`);
    if (r.groups) bits.push('all groups');
    if (r.dms) bits.push('all one to one chats');
    return bits.length ? bits.join(', ').replace(/^./, (s) => s.toUpperCase()) : 'Empty';
  };
  return (
    <FullPage title="Chat folders" onBack={onClose} zIndex={74} pad={false}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '8px 20px 4px', textWrap: 'pretty' }}>Folders show as tabs above your chats. Hold the lines on the right and drag to change the order.</div>
      <IgHeading>Your folders</IgHeading>
      <div role="list" aria-label="Your folders" style={{ position: 'relative' }}>
        {list.map((f, i) => {
          const dragging = drag && drag.from === i;
          return (
            <div key={f.id} role="listitem" aria-label={`Folder ${f.name}`} style={{ position: 'relative', zIndex: dragging ? 2 : 1, transform: `translateY(${dragging ? drag.dy : shiftFor(i)}px)`, transition: dragging ? 'none' : 'transform 0.2s ease', background: dragging ? theme.panelBg : 'transparent', boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: rowH, padding: '0 8px 0 20px', boxSizing: 'border-box' }}>
                <div role="button" aria-label={`Edit folder ${f.name}`} onClick={() => onEdit(f)} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', height: '100%' }}>
                  <FolderIcon size={22} color={theme.ink} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{countLabel(f)}</div>
                  </div>
                </div>
                <div role="button" aria-label={`Move folder ${f.name}`} onPointerDown={(e) => startDrag(e, i)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
                  <DragHandleIcon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div role="button" aria-label="Create a folder" onClick={onNew} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, height: 56, padding: '0 20px', cursor: 'pointer', color: theme.coral, fontSize: 15.5, fontWeight: 600 }}>
        <Plus size={22} />Create a folder
      </div>
      <IgHeading>Tabs above your chats</IgHeading>
      {CHAT_TABS.map(([k, l]) => (
        <IgRow key={k} label={l} right={<IgToggle on={tabs[k]} onClick={() => setTab(k, !tabs[k])} />} />
      ))}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '8px 20px 0' }}>All is always there. Your folders and tabs follow you to every phone you log in on.</div>
    </FullPage>
  );
}
const replyIdeasMem = new Map();
export function ReplyIdeasPanel({ ideas, onUse }) {
  const { theme } = useTheme();
  const [okd, setOkd] = useState(() => { try { return localStorage.getItem('zchat-reply-ideas-ok') === '1'; } catch { return false; } });
  const [state, setState] = useState(() => (replyIdeasMem.has(ideas.key) ? { items: replyIdeasMem.get(ideas.key), err: '' } : { items: null, err: '' }));
  const boxRef = useRef(null);
  const run = async () => {
    const key = ideas.key;
    setState({ items: null, err: '' });
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { setState({ items: [], err: 'No connection. Reply ideas need the internet.' }); return; }
    const r = await zchatTools('replies', ideas.target.body, 25000);
    if (!boxRef.current || ideas.key !== key) return;
    const list = r && r.data && Array.isArray(r.data.replies) ? r.data.replies.filter((t) => typeof t === 'string' && t.trim()).map((t) => t.trim().slice(0, 300)).slice(0, 3) : [];
    if (list.length) { replyIdeasMem.set(key, list); if (replyIdeasMem.size > 40) replyIdeasMem.delete(replyIdeasMem.keys().next().value); setState({ items: list, err: '' }); return; }
    setState({ items: [], err: (r && r.status === 429 && r.error) || 'Reply ideas are busy right now. Try again soon.' });
  };
  useEffect(() => { if (okd && !replyIdeasMem.has(ideas.key)) run(); }, [okd, ideas.key]);
  useEffect(() => {
    const away = (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (boxRef.current && boxRef.current.contains(t)) return;
      if (t.closest('[data-reply-ideas-btn]')) return;
      ideas.close();
    };
    document.addEventListener('pointerdown', away, true);
    return () => document.removeEventListener('pointerdown', away, true);
  }, []);
  const soft = theme.dark ? 'rgba(124, 92, 252, 0.22)' : 'rgba(124, 92, 252, 0.12)';
  const bubble = { alignSelf: 'flex-end', maxWidth: '86%', boxSizing: 'border-box', padding: '8px 13px', borderRadius: 18, borderBottomRightRadius: 5, background: soft, color: theme.ink, fontSize: 15, lineHeight: 1.32, wordBreak: 'break-word', whiteSpace: 'pre-wrap', boxShadow: `inset 0 0 0 1px ${theme.coral}33` };
  return (
    <div ref={boxRef} className="zchat-fade" role="dialog" aria-label="Reply ideas from ZChat Bot" style={{ flexShrink: 0, padding: '8px 14px 6px', background: theme.bgGradient, borderTop: `1px solid ${theme.hair || theme.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <img src="/bot-avatar.jpg" alt="" draggable={false} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: theme.muted }}>Reply ideas from ZChat Bot</span>
        <div role="button" aria-label="Close reply ideas" onPointerDown={(e) => e.preventDefault()} onClick={ideas.close} className="zchat-press" style={{ width: 30, height: 30, margin: '-6px -6px -6px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={17} /></div>
      </div>
      {!okd ? (
        <div style={{ padding: '2px 2px 4px' }}>
          <div style={{ fontSize: 14, color: theme.ink, lineHeight: 1.45 }}>ZChat Bot reads the last few messages of this chat to write three short replies you could send. Nothing is saved, and nothing is sent until you send it.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div role="button" aria-label="Show reply ideas" onPointerDown={(e) => e.preventDefault()} onClick={() => { hapticTap(); try { localStorage.setItem('zchat-reply-ideas-ok', '1'); } catch {} setOkd(true); }} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 17, background: theme.coral, color: '#FFFFFF', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Show ideas</div>
            <div role="button" aria-label="Not now" onPointerDown={(e) => e.preventDefault()} onClick={ideas.close} className="zchat-press" style={{ height: 34, padding: '0 10px', display: 'flex', alignItems: 'center', color: theme.ink2, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Not now</div>
          </div>
        </div>
      ) : state.items === null ? (
        <div aria-label="Writing reply ideas" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[62, 48, 56].map((w, i) => <div key={i} className="zchat-shimmer" style={{ ...bubble, width: `${w}%`, height: 36, padding: 0, boxShadow: 'none' }} />)}
        </div>
      ) : state.err ? (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px 4px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: theme.muted, lineHeight: 1.45 }}>{state.err}</span>
          <div role="button" aria-label="Try again" onPointerDown={(e) => e.preventDefault()} onClick={run} className="zchat-press" style={{ fontSize: 14, fontWeight: 700, color: theme.coral, cursor: 'pointer', padding: '6px 2px', flexShrink: 0 }}>Try again</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {state.items.map((t, i) => (
            <div key={`${i}-${t}`} role="button" aria-label={`Use reply idea: ${t}`} onPointerDown={(e) => e.preventDefault()} onClick={() => { hapticTap(); onUse(t); ideas.close(); }} className="zchat-press" style={{ ...bubble, cursor: 'pointer' }}>{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const WA_MARKS = /[‎‏‪-‮⁦-⁩﻿]/g;
const WA_LEAD = /^[‎‏‪-‮⁦-⁩﻿]+/;
const WA_HEAD = '(\\d{1,4})([./-])(\\d{1,2})\\2(\\d{1,4}),?\\s+(\\d{1,2})[:.](\\d{2})(?:[:.](\\d{2}))?(?:\\s*([AaPp])\\.?\\s?[Mm]\\.?)?';
const WA_IOS_RE = new RegExp(`^\\[${WA_HEAD}\\]\\s?([\\s\\S]*)$`);
const WA_AND_RE = new RegExp(`^${WA_HEAD}\\s?[-\\u2013]\\s([\\s\\S]*)$`);
const WA_GROUP_EVENT = / (changed the subject|changed the group description|changed this group|created group|created this group)/i;
function waFileKind(name) {
  const n = String(name || '').toLowerCase();
  if (/sticker|^stk-/.test(n)) return 'sticker';
  if (/\.gif$|-gif-/.test(n)) return 'gif';
  if (/\.(jpe?g|png|heic|heif|webp)$/.test(n)) return 'photo';
  if (/\.(mp4|mov|3gp|m4v|webm|mkv)$/.test(n)) return 'video';
  if (/\.(opus|ogg|m4a|mp3|aac|amr|wav)$/.test(n)) return 'audio';
  if (/\.vcf$/.test(n)) return 'contact';
  return 'document';
}
function waKindOf(raw) {
  const s = String(raw || '').replace(WA_MARKS, '').trim();
  if (s.length > 160 || !/(omitted|deleted\.?|message\.?|[>)]|^null)$/i.test(s)) return ['text', null];
  if (/^<media omitted>$/i.test(s) || s === 'null') return ['media', ''];
  if (/^(image|photo) omitted$/i.test(s)) return ['photo', ''];
  if (/^(video|video note) omitted$/i.test(s)) return ['video', ''];
  if (/^(audio|voice message) omitted$/i.test(s)) return ['audio', ''];
  if (/^sticker omitted$/i.test(s)) return ['sticker', ''];
  if (/^gif omitted$/i.test(s)) return ['gif', ''];
  if (/^contact card omitted$/i.test(s)) return ['contact', ''];
  let m = /^(.*?)\s*(?:•\s*\d+\s*pages?\s*)?document omitted$/i.exec(s);
  if (m) return ['document', m[1].replace(/\s*•\s*$/, '').trim()];
  m = /^<attached:\s*(.+?)>$/i.exec(s) || /^(.+?\.[a-z0-9]{2,5}) \(file attached\)$/i.exec(s);
  if (m) { const k = waFileKind(m[1]); return [k, k === 'document' ? m[1].trim() : '']; }
  if (/^(this message was deleted|you deleted this message)\.?$/i.test(s)) return ['deleted', ''];
  return ['text', null];
}
function waKey(e, order) {
  const a = parseInt(e.p[0], 10);
  const b = parseInt(e.p[1], 10);
  const c = parseInt(e.p[2], 10);
  let y;
  let mo;
  let d;
  if (order === 'mdy') { mo = a; d = b; y = c; } else { d = a; mo = b; y = c; }
  if (y < 100) y += 2000;
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return -1;
  let h = parseInt(e.t[0], 10);
  const ap = e.t[3] ? e.t[3].toLowerCase() : '';
  if (ap) { if (h === 12) h = 0; if (ap === 'p') h += 12; }
  return ((((y * 100 + mo) * 100 + d) * 100 + h) * 100 + parseInt(e.t[1], 10)) * 100 + (e.t[2] ? parseInt(e.t[2], 10) : 0);
}
function waWhen(e, order) {
  const n = e.p.map((x) => parseInt(x, 10));
  let y;
  let mo;
  let d;
  if (order === 'ymd') [y, mo, d] = n;
  else if (order === 'mdy') [mo, d, y] = n;
  else [d, mo, y] = n;
  if (y < 100) y += 2000;
  let h = parseInt(e.t[0], 10);
  const mi = parseInt(e.t[1], 10);
  const s = e.t[2] ? parseInt(e.t[2], 10) : 0;
  const ap = e.t[3] ? e.t[3].toLowerCase() : '';
  if (ap) { if (h > 12 || h < 1) return null; if (h === 12) h = 0; if (ap === 'p') h += 12; }
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
  const dt = new Date(y, mo - 1, d, h, mi, s);
  return dt.getMonth() === mo - 1 && dt.getDate() === d ? dt : null;
}
function parseWhatsAppExport(text, prefer) {
  const lines = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').split('\n');
  const heads = [];
  let cur = null;
  for (const raw of lines) {
    const probe = raw.replace(/[   ]/g, ' ').replace(WA_LEAD, '');
    const m = probe[0] === '[' ? WA_IOS_RE.exec(probe) : WA_AND_RE.exec(probe);
    if (m) {
      cur = { p: [m[1], m[3], m[4]], t: [m[5], m[6], m[7], m[8]], rest: m[9], ios: probe[0] === '[' };
      heads.push(cur);
    } else if (cur) cur.rest += `\n${raw}`;
  }
  let order = null;
  if (heads.some((e) => e.p[0].length === 4)) order = 'ymd';
  else {
    const dFirst = heads.some((e) => parseInt(e.p[0], 10) > 12);
    const mFirst = heads.some((e) => parseInt(e.p[1], 10) > 12);
    if (dFirst && !mFirst) order = 'dmy';
    else if (mFirst && !dFirst) order = 'mdy';
  }
  if (!order) {
    const drops = (o) => { let n = 0; let prev = 0; heads.forEach((e) => { const k = waKey(e, o); if (k < 0) { n += 1; return; } if (k < prev) n += 1; prev = k; }); return n; };
    const a = drops('dmy');
    const b = drops('mdy');
    order = a < b ? 'dmy' : b < a ? 'mdy' : (prefer === 'mdy' ? 'mdy' : 'dmy');
  }
  const lo = new Date(2009, 0, 1).getTime();
  const hi = Date.now() + 86400000;
  const messages = [];
  const counts = new Map();
  let skipped = 0;
  heads.forEach((e) => {
    const at = waWhen(e, order);
    if (!at || at.getTime() < lo || at.getTime() > hi) { skipped += 1; return; }
    const rest = e.rest;
    const i = rest.indexOf(': ');
    let author = '';
    let body = rest;
    let system = false;
    if (i > 0 && i <= 80 && rest.slice(0, i).indexOf('\n') < 0 && !(!e.ios && WA_GROUP_EVENT.test(rest.slice(0, i)))) {
      author = rest.slice(0, i).replace(WA_MARKS, '').replace(/^~\s*/, '').trim();
      body = rest.slice(i + 2);
    } else system = true;
    let kind = 'text';
    if (!system) {
      const lead = /^\s*[‎‏]/.test(body);
      const [k, extra] = waKindOf(body);
      if (k !== 'text') { kind = k; body = extra; }
      else if (e.ios && lead) system = true;
    }
    if (system) { kind = 'system'; body = body.replace(WA_MARKS, ''); }
    else if (kind === 'text') body = body.replace(WA_LEAD, '').replace(/\s*<This message was edited>\s*$/i, '');
    body = body.replace(/\s+$/, '');
    if (kind === 'text' && !body) return;
    if (!system && author) counts.set(author, (counts.get(author) || 0) + 1);
    messages.push({ at, author: author.slice(0, 80), kind, text: body.slice(0, 4000) });
  });
  const authors = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  let first = null;
  let last = null;
  messages.forEach((x) => { if (!first || x.at < first) first = x.at; if (!last || x.at > last) last = x.at; });
  return { messages, authors, order, skipped, first, last };
}
function waErrorText(error, peerName, group) {
  const t = `${(error && error.code) || ''} ${(error && error.message) || ''}`;
  if (waMissing(error)) return 'Importing from WhatsApp switches on once the latest ZChat setup is finished.';
  if (/still running/i.test(t)) return 'Another import is still running. Try again in a few minutes.';
  if (/five imports/i.test(t)) return 'This chat already has five imports. Remove one to add another.';
  if (/too many imports/i.test(t)) return 'You have imported a lot today. Try again tomorrow.';
  if (/cannot import into this chat|42501/i.test(t)) return group ? 'Only members who can send messages here can import into this group.' : `You can import here once ${String(peerName || 'they').split(' ')[0]} has written back to you.`;
  if (isNetworkProblem(error)) return 'The import stopped. Check your connection and try again.';
  return 'The import did not go through. Try again in a little while.';
}
function waWho(imp, myId, peer, members) {
  if (imp.importer_id === myId) return 'you';
  if (peer && imp.importer_id === peer.id) return String(peer.name || 'them').split(' ')[0];
  const m = (members || []).find((x) => x.user_id === imp.importer_id);
  return m && m.profile && m.profile.name ? String(m.profile.name).split(' ')[0] : 'a member';
}
async function waReadFile(file) {
  if (!file) throw new Error('none');
  if (file.size > 60 * 1024 * 1024) throw new Error('big');
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (head[0] === 0x50 && head[1] === 0x4b) {
    if (typeof DecompressionStream === 'undefined') throw new Error('nozip');
    const idx = await readZipIndex(file);
    const names = [...idx.keys()].filter((n) => /\.txt$/i.test(n) && !/(^|\/)__MACOSX\//.test(n));
    const pick = names.find((n) => /(^|\/)_chat\.txt$/i.test(n)) || names.find((n) => /whatsapp/i.test(n)) || names[0];
    if (!pick) throw new Error('format');
    const blob = await zipEntryBlob(file, idx.get(pick), 'text/plain');
    return { text: await blob.text(), name: pick.split('/').pop() };
  }
  return { text: await file.text(), name: file.name || '' };
}
async function waRpc(fn, args) {
  let last = null;
  for (let i = 0; i < 3; i++) {
    const res = await supabase.rpc(fn, args);
    if (!res.error) return res;
    last = res;
    if (!isNetworkProblem(res.error)) return res;
    await new Promise((r) => setTimeout(r, 700 * (i + 1)));
  }
  return last;
}
const WA_STEPS = [
  'In WhatsApp, open the chat',
  'Open the menu, then More, then Export chat. On iPhone, tap the chat name, then Export chat',
  'Choose Without media',
  'Save the file, then pick it here. Either the .txt or the .zip file works',
];
export function WaImportPage({ myId, me, peer, group, members, isAdmin, onClose, onView }) {
  const { theme } = useTheme();
  const list = useWaImports(myId, peer ? peer.id : null, group ? group.id : null);
  const [step, setStep] = useState('intro');
  const [parsed, setParsed] = useState(null);
  const [pick, setPick] = useState(null);
  const [err, setErr] = useState('');
  const [prog, setProg] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [askStop, setAskStop] = useState(false);
  const [askRemove, setAskRemove] = useState(null);
  const [gone, setGone] = useState(() => new Set());
  const fileRef = useRef(null);
  const run = useRef({ stop: false, id: null, alive: true });
  useEffect(() => {
    run.current.alive = true;
    waIdxRefresh(myId, true);
    return () => { run.current.alive = false; run.current.stop = true; };
  }, []);
  const name = peer ? peer.name : (group && group.name) || 'this chat';
  const back = () => {
    if (step === 'running') { setAskStop(true); return; }
    onClose();
  };
  useBackClose(!askStop && !askRemove, back);
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setErr('');
    setStep('reading');
    try {
      const { text } = await waReadFile(file);
      const prefer = (() => { try { return /^en-US$/i.test(navigator.language || '') ? 'mdy' : 'dmy'; } catch { return 'dmy'; } })();
      const r = parseWhatsAppExport(text, prefer);
      if (!run.current.alive) return;
      if (!r.messages.length) throw new Error('format');
      const mine = String((me && me.name) || '').trim().toLowerCase();
      const guess = r.authors.find((a) => a.name.toLowerCase() === mine) || (mine ? r.authors.find((a) => a.name.toLowerCase().split(' ')[0] === mine.split(' ')[0]) : null);
      setParsed(r);
      setPick(guess ? guess.name : null);
      setStep('who');
    } catch (x) {
      if (!run.current.alive) return;
      const k = x && x.message;
      setErr(k === 'big' ? 'That file is too big. Export the chat Without media and try again.' : k === 'nozip' ? 'This phone cannot open zip files. Unzip it first, then pick the .txt file inside.' : 'This file does not look like a WhatsApp chat export. Pick the .txt or .zip file WhatsApp made.');
      setStep('intro');
    }
  };
  const total = parsed ? Math.min(parsed.messages.length, 20000) : 0;
  const start = async () => {
    if (!parsed || pick === null) return;
    const rows = parsed.messages.slice(-20000).map((x, i) => ({ s: i, a: x.author || '', m: !!pick && x.author === pick, t: x.text || '', at: x.at.toISOString(), k: x.kind }));
    run.current.stop = false;
    setErr('');
    setProg({ done: 0, total: rows.length });
    setStep('running');
    hapticTap();
    const startRes = await waRpc('zchat_import_start', { p_peer: peer ? peer.id : null, p_group: group ? group.id : null, p_total: rows.length, p_me_name: pick || null, p_title: name });
    if (!run.current.alive) return;
    if (startRes.error || !startRes.data) { setErr(waErrorText(startRes.error, peer && peer.name, group)); setStep('who'); return; }
    const id = startRes.data;
    run.current.id = id;
    let i = 0;
    while (i < rows.length) {
      if (run.current.stop) break;
      const batch = [];
      let size = 0;
      while (i < rows.length && batch.length < 500 && size < 160000) { batch.push(rows[i]); size += rows[i].t.length + rows[i].a.length + 60; i += 1; }
      const res = await waRpc('zchat_import_add', { p_import: id, p_rows: batch });
      if (res.error) {
        supabase.rpc('zchat_import_remove', { p_import: id }).then(() => {}, () => {});
        if (!run.current.alive) return;
        setErr(waErrorText(res.error, peer && peer.name, group));
        setStep('who');
        return;
      }
      if (run.current.alive) setProg({ done: i, total: rows.length });
    }
    if (run.current.stop) {
      const rm = await waRpc('zchat_import_remove', { p_import: id });
      if (!run.current.alive) return;
      setErr(rm.error ? 'Stopped. The messages brought over so far are hidden and will be cleaned up.' : 'Stopped. Nothing was kept.');
      setStep('who');
      return;
    }
    const fin = await waRpc('zchat_import_finish', { p_import: id });
    if (!run.current.alive) return;
    if (fin.error || !fin.data) {
      supabase.rpc('zchat_import_remove', { p_import: id }).then(() => {}, () => {});
      setErr(waErrorText(fin.error, peer && peer.name, group));
      setStep('who');
      return;
    }
    const made = { id, importer_id: myId, peer_id: peer ? peer.id : null, group_id: group ? group.id : null, title: name, me_name: pick || null, count: fin.data.count, first_at: fin.data.first_at, last_at: fin.data.last_at, created_at: new Date().toISOString() };
    waIdxSet([made, ...(waIdx.list || []).filter((x) => x.id !== id)]);
    setResult(made);
    setStep('done');
    hapticTap();
    playUiSound('tap');
  };
  const remove = async (imp) => {
    setAskRemove(null);
    setGone((s) => new Set([...s, imp.id]));
    const before = waIdx.list || [];
    waIdxSet(before.filter((x) => x.id !== imp.id));
    const { error } = await supabase.rpc('zchat_import_remove', { p_import: imp.id });
    if (error) {
      setGone((s) => { const n = new Set(s); n.delete(imp.id); return n; });
      waIdxSet([imp, ...(waIdx.list || []).filter((x) => x.id !== imp.id)]);
      appSnack(waMissing(error) ? 'Importing from WhatsApp switches on once the latest ZChat setup is finished.' : friendlyError(error, 'That did not go through. Try again.'));
    }
  };
  const canRemove = (imp) => imp.importer_id === myId || !group || !!isAdmin;
  const shown = list.filter((x) => !gone.has(x.id));
  const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
  const errBox = err ? <div role="alert" style={{ padding: '10px 4px 4px', fontSize: 13.5, color: theme.danger, fontWeight: 700, lineHeight: 1.45 }}>{err}</div> : null;
  return (
    <FullPage title="Import from WhatsApp" subtitle={peer ? `Into your chat with ${String(peer.name || '').split(' ')[0]}` : group ? `Into ${group.name}` : undefined} onBack={back} zIndex={74}>
      <input ref={fileRef} type="file" accept=".txt,.zip,text/plain,application/zip" onChange={onFile} style={{ display: 'none' }} />
      {(step === 'intro' || step === 'reading') && (
        <>
          <PageArt text={group ? 'Bring the old WhatsApp messages of this group over. They show at the top of the chat for everyone in it.' : `Bring your old WhatsApp messages with ${String(name).split(' ')[0]} over. They show at the top of this chat for both of you.`} />
          {shown.length > 0 && (
            <>
              <IgHeading>Already in this chat</IgHeading>
              {shown.map((imp) => (
                <IgRow key={imp.id} inset={false} icon={<WaImportIcon />} label={waCountText(imp.count)} sub={`${waRange(imp.first_at, imp.last_at)}${waRange(imp.first_at, imp.last_at) ? ', ' : ''}brought over by ${waWho(imp, myId, peer, members)}`}
                  onClick={() => onView(imp)}
                  right={canRemove(imp) ? <div role="button" aria-label="Remove these messages" onClick={(e) => { e.stopPropagation(); setAskRemove(imp); }} className="zchat-press" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><Trash2 size={18} /></div> : <ChevronRight size={18} color={theme.muted} />} />
              ))}
            </>
          )}
          <IgHeading>How to export the chat</IgHeading>
          {WA_STEPS.map((t, i) => (
            <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '8px 0' }}>
              <span style={{ width: 24, height: 24, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: theme.coral, background: theme.dark ? 'rgba(124,92,252,0.18)' : 'rgba(124,92,252,0.1)' }}>{i + 1}</span>
              <span style={{ fontSize: 14.5, lineHeight: 1.45, color: theme.ink, paddingTop: 2 }}>{t}</span>
            </div>
          ))}
          <div style={{ padding: '18px 0 6px' }}>
            <BigButton label={step === 'reading' ? 'Reading the file' : 'Choose the exported file'} disabled={step === 'reading'} onClick={() => { hapticTap(); if (fileRef.current) fileRef.current.click(); }} />
          </div>
          {errBox}
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '8px 2px 0' }}>Only the words come over. Photos, videos and voice messages show as a short note instead. Everyone in this chat can see the imported messages, and you can remove them at any time.</div>
        </>
      )}
      {step === 'who' && parsed && (
        <>
          <div style={{ padding: '14px 14px', margin: '8px 0 4px', borderRadius: 16, background: theme.rowBg }}>
            <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.ink }}>{waCountText(parsed.messages.length)}</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 3, lineHeight: 1.45 }}>{parsed.first ? `From ${fmtDate(parsed.first, { day: 'numeric', month: 'short', year: 'numeric' })} to ${fmtDate(parsed.last, { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}{parsed.messages.length > 20000 ? '. The newest 20,000 come over' : ''}</div>
          </div>
          <IgHeading>Which one is you?</IgHeading>
          <div role="radiogroup" aria-label="Which one is you?">
            {[...parsed.authors.slice(0, 40).map((a) => [a.name, a.name, waCountText(a.count)]), ['', 'None of these', 'All messages show as from others']].map(([k, label, sub]) => {
              const on = pick === k;
              return (
                <div key={`p${k}`} role="radio" aria-checked={on} aria-label={label} onClick={() => { hapticTap(); setPick(k); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, cursor: 'pointer' }}>
                  {k ? <Avatar name={label} size={36} /> : <span style={{ width: 36, height: 36, borderRadius: 18, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, flexShrink: 0 }}><User size={18} /></span>}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 15, fontWeight: on ? 700 : 500, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                    <span style={{ display: 'block', fontSize: 12.5, color: theme.muted }}>{sub}</span>
                  </span>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${on ? theme.coral : theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {on && <span style={{ width: 12, height: 12, borderRadius: '50%', background: theme.coral }} />}
                  </span>
                </div>
              );
            })}
          </div>
          {errBox}
          <div style={{ padding: '16px 0 8px' }}>
            <BigButton label={`Import ${waCountText(total)}`} disabled={pick === null} onClick={start} />
          </div>
          <div role="button" aria-label="Pick another file" onClick={() => { setParsed(null); setErr(''); setStep('intro'); }} style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: theme.coral, padding: '8px 0', cursor: 'pointer' }}>Pick another file</div>
        </>
      )}
      {step === 'running' && (
        <div style={{ padding: '40px 6px 10px' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center' }}>Bringing your messages over</div>
          <div aria-live="polite" style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{formatCount(prog.done)} of {formatCount(prog.total)}</div>
          <div role="progressbar" aria-label="Import progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} style={{ height: 8, borderRadius: 4, background: theme.rowBg, overflow: 'hidden', margin: '18px 0 26px' }}>
            <div style={{ height: '100%', width: `${Math.max(3, pct)}%`, borderRadius: 4, background: theme.coral, transition: reducedMotion() ? 'none' : 'width 260ms ease-out' }} />
          </div>
          <BigButton label="Stop" tone="plain" onClick={() => { run.current.stop = true; hapticTap(); }} />
          <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', lineHeight: 1.5, padding: '12px 10px 0' }}>Keep this page open until it finishes. If you stop, nothing is kept.</div>
        </div>
      )}
      {step === 'done' && result && (
        <div style={{ padding: '34px 6px 10px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coral, background: theme.dark ? 'rgba(124,92,252,0.18)' : 'rgba(124,92,252,0.1)' }}><Check size={30} strokeWidth={2.4} /></div>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>{waCountText(result.count)} brought over</div>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, margin: '6px 8px 22px' }}>They are at the top of this chat now, under Messages from WhatsApp.</div>
          <BigButton label="View them" onClick={() => onView(result)} />
          <div style={{ height: 10 }} />
          <BigButton label="Done" tone="plain" onClick={onClose} />
        </div>
      )}
      {askStop && (
        <ConfirmDialog layer={800} title="Stop importing?" body="The messages brought over so far are removed." confirmLabel="Stop" onCancel={() => setAskStop(false)}
          onConfirm={() => { setAskStop(false); run.current.stop = true; }} />
      )}
      {askRemove && (
        <ConfirmDialog layer={800} title="Remove these messages?" body="Everyone in this chat stops seeing the messages from WhatsApp. This cannot be undone." confirmLabel="Remove" onCancel={() => setAskRemove(null)}
          onConfirm={() => remove(askRemove)} />
      )}
    </FullPage>
  );
}
const waRowsMem = new Map();
const WA_PLACEHOLDER = { photo: 'Photo not imported', video: 'Video not imported', audio: 'Voice message not imported', sticker: 'Sticker not imported', gif: 'GIF not imported', document: 'Document not imported', contact: 'Contact card not imported', media: 'Media not imported' };
function waPlaceholder(r) {
  if (r.kind === 'document' && r.body) return `${r.body}, not imported`;
  return WA_PLACEHOLDER[r.kind] || '';
}
function waEscapeLike(s) { return String(s).replace(/[\\%_]/g, (c) => `\\${c}`); }
export function WaImportViewer({ imp, myId, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const mem = waRowsMem.get(imp.id);
  const [rows, setRows] = useState(() => (mem ? mem.rows : null));
  const [older, setOlder] = useState(() => (mem ? mem.older : false));
  const [newer, setNewer] = useState(() => (mem ? mem.newer : false));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [searchOn, setSearchOn] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState(null);
  const [mark, setMark] = useState(null);
  const scrollRef = useRef(null);
  const st = useRef({ alive: true, keep: null, toBottom: !mem, toSeq: null, busy: false, timer: 0 });
  const cols = 'seq, author, mine, body, sent_at, kind';
  const asPeer = !imp.group_id && imp.peer_id === myId && imp.importer_id !== myId;
  const isMine = (r) => r.kind !== 'system' && (imp.importer_id === myId ? r.mine : asPeer ? !r.mine : false);
  const showNames = !!imp.group_id;
  useEffect(() => {
    st.current.alive = true;
    if (!mem) {
      supabase.from('imported_messages').select(cols).eq('import_id', imp.id).order('seq', { ascending: false }).limit(300).then(({ data, error }) => {
        if (!st.current.alive) return;
        if (error || !data) { setErr(waMissing(error) ? 'These messages are not available right now.' : 'Could not load these messages. Check your connection.'); setRows([]); return; }
        const list = data.slice().reverse();
        setRows(list);
        setOlder(data.length === 300);
        setNewer(false);
      }, () => { if (st.current.alive) { setErr('Could not load these messages. Check your connection.'); setRows([]); } });
    }
    return () => { st.current.alive = false; clearTimeout(st.current.timer); };
  }, []);
  useEffect(() => {
    if (!rows) return;
    waRowsMem.delete(imp.id);
    waRowsMem.set(imp.id, { rows, older, newer });
    while (waRowsMem.size > 3) waRowsMem.delete(waRowsMem.keys().next().value);
  }, [rows, older, newer]);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const s = st.current;
    if (!el || !rows) return;
    if (s.toSeq != null) {
      const node = el.querySelector(`[data-wa-seq="${s.toSeq}"]`);
      if (node) el.scrollTop = Math.max(0, node.offsetTop - el.clientHeight / 2 + node.offsetHeight / 2);
      s.toSeq = null;
      s.keep = null;
    } else if (s.keep != null) {
      el.scrollTop = el.scrollHeight - s.keep;
      s.keep = null;
    } else if (s.toBottom) {
      el.scrollTop = el.scrollHeight;
      s.toBottom = false;
    }
  }, [rows]);
  const loadMore = async (up) => {
    const s = st.current;
    if (s.busy || !rows || !rows.length) return;
    s.busy = true;
    setBusy(true);
    const edge = up ? rows[0].seq : rows[rows.length - 1].seq;
    let qy = supabase.from('imported_messages').select(cols).eq('import_id', imp.id);
    qy = up ? qy.lt('seq', edge).order('seq', { ascending: false }) : qy.gt('seq', edge).order('seq', { ascending: true });
    const { data, error } = await qy.limit(300);
    s.busy = false;
    if (!s.alive) return;
    setBusy(false);
    if (error || !data) return;
    const got = up ? data.slice().reverse() : data;
    const el = scrollRef.current;
    if (up && el) s.keep = el.scrollHeight - el.scrollTop;
    setRows((prev) => (up ? [...got, ...(prev || [])] : [...(prev || []), ...got]));
    if (up) setOlder(data.length === 300); else setNewer(data.length === 300);
  };
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el || searchOn) return;
    if (el.scrollTop < 300 && older) loadMore(true);
    else if (el.scrollHeight - el.scrollTop - el.clientHeight < 300 && newer) loadMore(false);
  };
  useEffect(() => {
    const term = q.trim();
    clearTimeout(st.current.timer);
    if (term.length < 2) { setHits(null); return undefined; }
    st.current.timer = setTimeout(async () => {
      const { data, error } = await supabase.from('imported_messages').select(cols).eq('import_id', imp.id).ilike('body', `%${waEscapeLike(term)}%`).order('seq', { ascending: false }).limit(60);
      if (!st.current.alive || q.trim() !== term) return;
      setHits(error ? [] : data || []);
    }, 280);
    return () => clearTimeout(st.current.timer);
  }, [q]);
  const jump = async (seq) => {
    setSearchOn(false);
    setQ('');
    setHits(null);
    const have = rows && rows.length && rows[0].seq <= seq && rows[rows.length - 1].seq >= seq;
    if (!have) {
      const { data, error } = await supabase.from('imported_messages').select(cols).eq('import_id', imp.id).gte('seq', Math.max(0, seq - 60)).lte('seq', seq + 60).order('seq', { ascending: true });
      if (!st.current.alive || error || !data) return;
      setOlder(data.length > 0 && data[0].seq > 0);
      setNewer(data.length > 0 && data[data.length - 1].seq < (imp.count || 0) - 1);
      st.current.toSeq = seq;
      setRows(data);
    } else {
      st.current.toSeq = seq;
      setRows((prev) => (prev ? prev.slice() : prev));
    }
    setMark(seq);
    setTimeout(() => { if (st.current.alive) setMark(null); }, 1800);
  };
  const term = q.trim().toLowerCase();
  const snippet = (body) => {
    const t = String(body || '');
    const i = t.toLowerCase().indexOf(term);
    if (i < 0) return t.slice(0, 120);
    const from = Math.max(0, i - 40);
    return (
      <>
        {from > 0 ? '…' : ''}{t.slice(from, i)}
        <b style={{ color: theme.ink, fontWeight: 800 }}>{t.slice(i, i + term.length)}</b>
        {t.slice(i + term.length, i + term.length + 80)}
      </>
    );
  };
  const timeOf = (r) => fmtDate(new Date(r.sent_at), { hour: 'numeric', minute: '2-digit' });
  return (
    <FullPage title="Messages from WhatsApp" subtitle={`${waCountText(imp.count)}${waRange(imp.first_at, imp.last_at) ? `, ${waRange(imp.first_at, imp.last_at)}` : ''}`} onBack={onClose} zIndex={76} pad={false} scrollRef={scrollRef} scrollProps={{ onScroll }}
      right={<HeaderIconButton label={searchOn ? 'Close search' : 'Search these messages'} onClick={() => { setSearchOn((v) => !v); setQ(''); setHits(null); }}>{searchOn ? <X /> : <Search />}</HeaderIconButton>}>
      {searchOn && (
        <div style={{ position: 'sticky', top: 0, zIndex: 3, padding: '6px 16px 8px', background: igPalette(theme).bg }}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder="Search these messages" aria-label="Search these messages" enterKeyHint="search"
            style={{ ...inputStyle(theme), height: 40, padding: '0 14px' }} />
        </div>
      )}
      {searchOn ? (
        <div style={{ padding: '0 0 24px' }}>
          {hits === null ? (
            <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', padding: '28px 24px' }}>Type at least two letters</div>
          ) : hits.length === 0 ? (
            <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', padding: '28px 24px' }}>Nothing matches that</div>
          ) : hits.map((r) => (
            <div key={r.seq} role="button" aria-label={`Go to message from ${r.author || 'WhatsApp'}`} onClick={() => jump(r.seq)} className="zchat-row-press" style={{ padding: '10px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.author || 'WhatsApp'}</span>
                <span style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>{fmtDate(new Date(r.sent_at), { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.4, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{snippet(r.body)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '6px 14px 28px', display: 'flex', flexDirection: 'column', minHeight: '100%', boxSizing: 'border-box', justifyContent: 'flex-end' }}>
          {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>}
          {err && <div role="alert" style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', padding: '28px 20px' }}>{err}</div>}
          {busy && older && <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 10px' }}><Spinner size={16} color={theme.muted} /></div>}
          {rows && !older && rows.length > 0 && <div style={{ alignSelf: 'center', fontSize: 12, color: theme.muted, padding: '6px 14px 2px', textAlign: 'center' }}>The start of the chat you brought over</div>}
          {(rows || []).map((r, i, all) => {
            const prev = all[i - 1];
            const at = new Date(r.sent_at);
            const day = !prev || new Date(prev.sent_at).toDateString() !== at.toDateString();
            if (r.kind === 'system') {
              return (
                <React.Fragment key={r.seq}>
                  {day && <DayDivider label={dayDividerLabel(r.sent_at)} />}
                  <div data-wa-seq={r.seq} style={{ alignSelf: 'center', maxWidth: '86%', fontSize: 12.5, color: theme.muted, textAlign: 'center', lineHeight: 1.45, padding: '4px 10px', margin: '4px 0', borderRadius: 10, background: mark === r.seq ? (theme.dark ? 'rgba(124,92,252,0.25)' : 'rgba(124,92,252,0.14)') : 'transparent', wordBreak: 'break-word' }}>{r.body}</div>
                </React.Fragment>
              );
            }
            const mine = isMine(r);
            const sameAuthor = !day && prev && prev.kind !== 'system' && prev.author === r.author;
            const note = r.kind === 'text' ? '' : r.kind === 'deleted' ? 'This message was deleted' : waPlaceholder(r);
            return (
              <React.Fragment key={r.seq}>
                {day && <DayDivider label={dayDividerLabel(r.sent_at)} />}
                <div data-wa-seq={r.seq} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginTop: sameAuthor ? 2 : 8, padding: '7px 12px 6px', borderRadius: 18, background: mine ? theme.bubbleMe : theme.bubbleThem, color: theme.ink, boxShadow: mark === r.seq ? `0 0 0 2px ${theme.coral}` : 'none', transition: 'box-shadow 200ms ease-out' }}>
                  {showNames && !mine && !sameAuthor && r.author && <div style={{ fontSize: 12, fontWeight: 800, color: theme.coral, marginBottom: 2 }}>{r.author}</div>}
                  {note
                    ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: theme.muted, fontStyle: 'italic' }}>{r.kind !== 'deleted' && <ImageIcon size={14} />}{note}</div>
                    : <div style={{ fontSize: 15, lineHeight: 1.38, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{linkifyText(r.body)}<span style={{ float: 'right', fontSize: 10.5, lineHeight: 1, color: theme.muted, whiteSpace: 'nowrap', marginLeft: 10, marginTop: 7, marginBottom: -3 }}>{timeOf(r)}</span></div>}
                  {note && <div style={{ fontSize: 10.5, color: theme.muted, textAlign: 'right', marginTop: 2 }}>{timeOf(r)}</div>}
                </div>
              </React.Fragment>
            );
          })}
          {busy && newer && <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}><Spinner size={16} color={theme.muted} /></div>}
        </div>
      )}
    </FullPage>
  );
}
export function EditTabsPage({ onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const ax = useAx();
  const tabs = axTabsOf(ax);
  const rest = AX_TAB_KEYS.filter((k) => !tabs.includes(k));
  const [drag, setDrag] = useState(null);
  const rowH = 62;
  const save = (next) => axSet({ tabs: next.join() === AX_TABS_DEFAULT.join() ? null : next });
  const flip = (k) => {
    if (k === 'chats') { appSnack('Chats always stays in your tab bar'); return; }
    if (tabs.includes(k)) { save(tabs.filter((x) => x !== k)); return; }
    if (tabs.length >= 5) { hapticTap(); appSnack('Up to 5 tabs fit. Turn one off first.'); return; }
    save([...tabs, k]);
  };
  const startDrag = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    hapticTap();
    setDrag({ from: i, y0: e.clientY, dy: 0, id: e.pointerId });
  };
  const moveDrag = (e) => { if (drag && drag.id === e.pointerId) setDrag((d) => (d ? { ...d, dy: e.clientY - d.y0 } : d)); };
  const target = drag ? Math.max(0, Math.min(tabs.length - 1, drag.from + Math.round(drag.dy / rowH))) : -1;
  const endDrag = () => {
    if (!drag) return;
    if (target !== drag.from) {
      const next = tabs.slice();
      const [m] = next.splice(drag.from, 1);
      next.splice(target, 0, m);
      save(next);
      hapticTap();
    }
    setDrag(null);
  };
  const shiftFor = (i) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < target && i > drag.from && i <= target) return -rowH;
    if (drag.from > target && i < drag.from && i >= target) return rowH;
    return 0;
  };
  const row = (k, i) => {
    const inBar = i >= 0;
    const dragging = !!drag && drag.from === i;
    const [label, sub] = AX_TAB_INFO[k];
    return (
      <div key={k} role="listitem" data-ax-tab={k} aria-label={label} style={{ position: 'relative', zIndex: dragging ? 2 : 1, transform: inBar ? `translateY(${dragging ? drag.dy : shiftFor(i)}px)` : 'none', transition: dragging ? 'none' : 'transform 0.2s ease', background: dragging ? theme.panelBg : 'transparent', boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.18)' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: rowH, padding: inBar ? '0 6px 0 20px' : '0 20px', boxSizing: 'border-box' }}>
          <span style={{ width: 28, display: 'flex', justifyContent: 'center', flexShrink: 0 }}><AxTabGlyph k={k} size={k === 'create' ? 19 : 23} color={theme.ink} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: theme.ink }}>{label}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k === 'chats' ? 'Always in your tab bar' : sub}</div>
          </div>
          {k !== 'chats' && <IgToggle on={inBar} onClick={() => flip(k)} />}
          {inBar && (
            <div role="button" aria-label={`Move ${label}`} onPointerDown={(e) => startDrag(e, i)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'grab', touchAction: 'none', flexShrink: 0 }}>
              <DragHandleIcon size={22} />
            </div>
          )}
        </div>
      </div>
    );
  };
  return (
    <FullPage title="Your tabs" onBack={onClose} zIndex={76} pad={false}>
      <div style={{ padding: '8px 16px 2px' }}><AxTabsPreview tabs={tabs} /></div>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '10px 20px 0', textWrap: 'pretty' }}>Pick up to 5 tabs. Hold the lines on the right and drag to change the order.</div>
      <IgHeading>In your tab bar</IgHeading>
      <div role="list" aria-label="In your tab bar" style={{ position: 'relative' }}>{tabs.map((k, i) => row(k, i))}</div>
      {rest.length > 0 && <IgHeading>More tabs</IgHeading>}
      {rest.length > 0 && <div role="list" aria-label="More tabs">{rest.map((k) => row(k, -1))}</div>}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '14px 20px 0' }}>Your tabs follow you to every phone and computer you log in on.</div>
      {tabs.join() !== AX_TABS_DEFAULT.join() && (
        <div role="button" aria-label="Use the usual tabs" onClick={() => { hapticTap(); save(AX_TABS_DEFAULT); }} style={{ fontSize: 14.5, fontWeight: 700, color: kitOnInk(theme), padding: '16px 20px 4px', cursor: 'pointer', width: 'max-content' }}>Use the usual tabs</div>
      )}
    </FullPage>
  );
}

export function NewChatPage({ userId, blockedIds, onClose, onPick, onNewGroup, onDiscover, onCommunities, allowContacts }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [contactsOpen, setContactsOpen] = useState(false);
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted').limit(400);
      const ids = (f || []).map((x) => x.following_id);
      if (!ids.length) { if (alive) setPeople([]); return; }
      const { data: profs } = await fetchProfilesView(ids, { live: true });
      if (!alive) return;
      setPeople(sanitizeAvatarList(profs, userId).filter((p) => !blockedIds.has(p.id)).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    })();
    return () => { alive = false; };
  }, [userId]);
  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(null); setSearching(false); return; }
    setSearching(true);
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data, userId).filter((u) => u.id !== userId && !blockedIds.has(u.id)));
      setSearching(false);
    }, 280);
  };
  const term = q.trim().toLowerCase();
  const local = (people || []).filter((p) => !term || (p.name || '').toLowerCase().includes(term) || (p.username || '').toLowerCase().includes(term));
  const localIds = new Set(local.map((p) => p.id));
  const extra = (results || []).filter((p) => !localIds.has(p.id));
  const quick = (icon, label, sub, onClick) => (
    <div role="button" aria-label={label} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', cursor: 'pointer' }}>
      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: theme.ink }}>{React.isValidElement(icon) ? React.cloneElement(icon, { size: 24, strokeWidth: 1.8 }) : icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{label}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{sub}</div>
      </div>
      <ChevronRight size={18} color={theme.muted} />
    </div>
  );
  return (
    <FullPage title="New chat" onBack={onClose} zIndex={60}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 6px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search by name or username" aria-label="Search people for a new chat" autoCapitalize="none" autoFocus
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {searching ? <Spinner size={14} color={theme.muted} /> : q ? <X size={16} style={{ cursor: 'pointer' }} onClick={() => doSearch('')} /> : null}
      </label>
      {!term && (
        <div style={{ padding: '4px 0 2px' }}>
          {quick(<Users size={22} />, 'New group', 'Chat with up to 50 people', () => { onClose(); setTimeout(onNewGroup, 60); })}
          {onCommunities && quick(<CommunityGlyph size={22} />, 'Communities', 'Bring your groups together', () => { onClose(); setTimeout(onCommunities, 60); })}
          {quick(<Compass size={22} />, 'Discover people', 'Find public accounts on ZChat', () => { onClose(); setTimeout(onDiscover, 60); })}
          {allowContacts && contactsPickerSupported() && identitySqlKnown() !== false && quick(<ContactsGlyph size={22} />, 'Find people from your contacts', 'See who is already on ZChat', () => { hapticTap(); setContactsOpen(true); })}
        </div>
      )}
      {contactsOpen && <ContactsFindPage uid={userId} blockedIds={blockedIds} onClose={() => setContactsOpen(false)} onPick={(p) => { setContactsOpen(false); onPick(p); }} />}
      {people === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>
      ) : (
        <>
          {local.length > 0 && <div style={{ padding: '14px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>People you follow</div>}
          {local.map((p) => <UserListRow key={p.id} profile={p} onClick={() => onPick(p)} rightContent={<ChevronRight size={18} color={theme.muted} />} />)}
          {extra.length > 0 && <div style={{ padding: '14px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>More people</div>}
          {extra.map((p) => <UserListRow key={p.id} profile={p} onClick={() => onPick(p)} rightContent={<ChevronRight size={18} color={theme.muted} />} />)}
          {!local.length && !extra.length && (
            <EmptyState art={term ? 'nothing' : 'nochats'} title={term ? (term.length < 2 ? 'Keep typing' : searching ? 'Searching' : 'No one found') : 'Nobody to show yet'} text={term ? 'Search by the exact username to find anyone on ZChat.' : 'Follow people and they will show up here, or search a username above.'} />
          )}
        </>
      )}
    </FullPage>
  );
}

function ContactsGlyph({ size = 22, color = 'currentColor', strokeWidth = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="2.8" width="14.5" height="18.4" rx="2.6" />
      <circle cx="12.25" cy="10" r="2.7" />
      <path d="M8.2 17.2c.7-2 2.2-3.1 4.05-3.1s3.35 1.1 4.05 3.1" />
      <path d="M3 7.5h2M3 12h2M3 16.5h2" />
    </svg>
  );
}
const DIAL_CODES = 'AF93 AL355 DZ213 AD376 AO244 AR54 AM374 AU61 AT43 AZ994 BH973 BD880 BY375 BE32 BZ501 BJ229 BT975 BO591 BA387 BW267 BR55 BN673 BG359 BF226 BI257 KH855 CM237 CA1 CV238 CF236 TD235 CL56 CN86 CO57 KM269 CG242 CD243 CR506 HR385 CU53 CY357 CZ420 DK45 DJ253 DO1 EC593 EG20 SV503 EE372 ET251 FJ679 FI358 FR33 GA241 GM220 GE995 DE49 GH233 GR30 GT502 GN224 GY592 HT509 HN504 HK852 HU36 IS354 IN91 ID62 IR98 IQ964 IE353 IL972 IT39 JM1 JP81 JO962 KZ7 KE254 KW965 KG996 LA856 LV371 LB961 LS266 LR231 LY218 LI423 LT370 LU352 MO853 MG261 MW265 MY60 MV960 ML223 MT356 MR222 MU230 MX52 MD373 MC377 MN976 ME382 MA212 MZ258 MM95 NA264 NP977 NL31 NZ64 NI505 NE227 NG234 NO47 OM968 PK92 PA507 PG675 PY595 PE51 PH63 PL48 PT351 QA974 RO40 RU7 RW250 SA966 SN221 RS381 SG65 SK421 SI386 SO252 ZA27 KR82 SS211 ES34 LK94 SD249 SR597 SE46 CH41 SY963 TW886 TJ992 TZ255 TH66 TG228 TT1 TN216 TR90 TM993 UG256 UA380 AE971 GB44 US1 UY598 UZ998 VE58 VN84 YE967 ZM260 ZW263';
const DIAL_MAP = (() => { const m = {}; DIAL_CODES.split(' ').forEach((p) => { m[p.slice(0, 2)] = p.slice(2); }); return m; })();
const TZ_COUNTRY = {
  'Asia/Colombo': 'LK', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Karachi': 'PK', 'Asia/Dhaka': 'BD', 'Asia/Kathmandu': 'NP', 'Asia/Katmandu': 'NP', 'Indian/Maldives': 'MV',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM', 'Asia/Bahrain': 'BH', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY',
  'Asia/Jakarta': 'ID', 'Asia/Manila': 'PH', 'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Hong_Kong': 'HK',
  'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL', 'Europe/Moscow': 'RU',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Perth': 'AU', 'Pacific/Auckland': 'NZ', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA', 'Africa/Cairo': 'EG',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US', 'America/Toronto': 'CA', 'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
};
function guessCountry(fallback) {
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]; } catch {}
  try {
    const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
    for (let i = 0; i < langs.length; i++) { const m = String(langs[i]).match(/[-_]([A-Za-z]{2})(?:$|[-_])/); if (m && DIAL_MAP[m[1].toUpperCase()]) return m[1].toUpperCase(); }
  } catch {}
  return fallback && DIAL_MAP[fallback] ? fallback : 'US';
}
function phoneE164(raw, cc) {
  let s = String(raw || '').trim().replace(/[^\d+]/g, '');
  if (!s) return null;
  let full = null;
  if (s.charAt(0) === '+') full = s.slice(1).replace(/\+/g, '');
  else if (s.slice(0, 2) === '00') full = s.slice(2).replace(/\+/g, '');
  else {
    const code = DIAL_MAP[cc];
    if (!code) return null;
    s = s.replace(/\+/g, '');
    if (s.length >= 11 && s.charAt(0) !== '0' && s.slice(0, code.length) === code) full = s;
    else {
      let nat = s;
      if (code === '1') { if (nat.length === 11 && nat.charAt(0) === '1') nat = nat.slice(1); }
      else if ((code === '7' || cc === 'BY' || cc === 'LT') && nat.charAt(0) === '8' && nat.length >= 10) nat = nat.slice(1);
      else if (cc !== 'IT') nat = nat.replace(/^0+/, '');
      full = code + nat;
    }
  }
  return /^[1-9]\d{7,14}$/.test(full) ? `+${full}` : null;
}
function maskedPhone(saved) {
  const e = saved ? phoneE164(saved.num, saved.cc) : null;
  if (!e) return '';
  const code = DIAL_MAP[saved.cc] || '';
  return `+${code} ••• ${e.slice(-3)}`;
}
function contactsPickerSupported() {
  try { return typeof navigator !== 'undefined' && !!navigator.contacts && typeof navigator.contacts.select === 'function' && typeof window !== 'undefined' && 'ContactsManager' in window; } catch { return false; }
}

export function DialCountryPicker({ value, onSelect, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase().replace(/^\+/, '');
  const list = COUNTRIES.filter(([code, name]) => DIAL_MAP[code] && (!term || name.toLowerCase().includes(term) || DIAL_MAP[code].startsWith(term)));
  return (
    <FullPage title="Country code" onBack={onClose} zIndex={98}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 8px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search countries" aria-label="Search countries" autoCapitalize="none" enterKeyHint="search"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {q && <X size={16} style={{ cursor: 'pointer' }} onClick={() => setQ('')} />}
      </label>
      {list.map(([code, name]) => (
        <div key={code} role="button" aria-label={`${name}, plus ${DIAL_MAP[code]}`} onClick={() => { hapticTap(); onSelect(code); onClose(); }} className="zchat-row-press"
          style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '0 2px', cursor: 'pointer', boxShadow: `inset 0 -0.5px 0 ${theme.hair}` }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: theme.ink, fontWeight: code === value ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <span style={{ fontSize: 14, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>+{DIAL_MAP[code]}</span>
          {code === value && <Check size={18} color={kitOnInk(theme)} strokeWidth={2.6} />}
        </div>
      ))}
      {!list.length && <div style={{ textAlign: 'center', padding: '30px 10px', fontSize: 14, color: theme.muted }}>No country matches that.</div>}
    </FullPage>
  );
}

export function FindMePhonePage({ uid, me, on, onClose, onSaved }) {
  const { theme } = useTheme();
  const saved = readJsonLs(`zchat-findme-num-${uid}`, null);
  const [cc, setCc] = useState(() => (saved && DIAL_MAP[saved.cc] ? saved.cc : guessCountry(me && me.country)));
  const [num, setNum] = useState(() => (saved && typeof saved.num === 'string' ? saved.num : ''));
  const [enabled, setEnabled] = useState(!!on);
  const [picker, setPicker] = useState(false);
  const [err, setErr] = useState('');
  const sentRef = useRef(on && saved ? phoneE164(saved.num, saved.cc) : null);
  const e164 = phoneE164(num, cc);
  const countryName = (COUNTRIES.find(([code]) => code === cc) || [cc, cc])[1];
  const push = async (wantOn, number) => {
    let hash = null;
    try { hash = wantOn && number ? await sha256Hex(number) : null; } catch { return { ok: false }; }
    try {
      const { data, error } = await supabase.rpc('zchat_contacts_set_phone', { p_hash: hash });
      return { ok: !error && !!data && !!data.ok, reason: data && data.reason, error };
    } catch (e) { return { ok: false, error: e }; }
  };
  const remember = () => writeJsonLs(`zchat-findme-num-${uid}`, { cc, num: num.slice(0, 32) });
  const toggle = async () => {
    const next = !enabled;
    if (next && !e164) { setErr(num.trim() ? 'That number does not look right. Check the country code too.' : 'Type your number first.'); return; }
    setErr('');
    setEnabled(next);
    remember();
    onSaved(next);
    const r = await push(next, e164);
    if (!r.ok) {
      setEnabled(!next);
      onSaved(!next);
      setErr(r.reason === 'limited' ? 'You changed your number a lot today. Try again tomorrow.' : friendlyError(r.error, "That didn't save. Try again."));
      return;
    }
    sentRef.current = next ? e164 : null;
  };
  const close = () => {
    remember();
    if (enabled && e164 && e164 !== sentRef.current) {
      const target = e164;
      push(true, target).then((r) => { if (r.ok) sentRef.current = target; else appSnack("Your new number didn't save. Open Phone number and try again."); });
    }
    onClose();
  };
  useBackClose(true, close);
  return (
    <FullPage title="Phone number" onBack={close} zIndex={96}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px 12px', textWrap: 'pretty' }}>People who have your number saved in their phone can find you on ZChat. Your number is turned into a code on this phone and only the code is saved, so nobody can read your number from ZChat.</div>
      <IgRow inset={false} label="Country code" sub={countryName} value={`+${DIAL_MAP[cc] || ''}`} onClick={() => setPicker(true)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 4px' }}>
        <div aria-hidden="true" style={{ height: 46, padding: '0 12px', borderRadius: 12, background: theme.inputBg, color: theme.ink, display: 'flex', alignItems: 'center', fontSize: 16, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>+{DIAL_MAP[cc] || ''}</div>
        <input value={num} onChange={(e) => { setErr(''); setNum(e.target.value.replace(/[^\d\s()+-]/g, '').slice(0, 24)); }} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Your number" aria-label="Your phone number"
          style={{ ...inputStyle(theme), flex: 1, minWidth: 0, fontVariantNumeric: 'tabular-nums' }} />
      </div>
      <IgRow inset={false} label="Let people find me by this number" right={<IgToggle on={enabled} onClick={toggle} />} />
      {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '6px 2px 0' }}>{err}</div>}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.55, padding: '14px 2px 0' }}>ZChat does not check that the number is yours, so people who find you see only your name, photo and username.</div>
      {picker && <DialCountryPicker value={cc} onSelect={(code) => { setCc(code); setErr(''); }} onClose={() => setPicker(false)} />}
    </FullPage>
  );
}

const findMeMem = new Map();
export function FindMeBySection({ uid, me }) {
  const { theme } = useTheme();
  const [st, setSt] = useState(() => findMeMem.get(uid) || readJsonLs(`zchat-findme-${uid}`, null) || { phone: false, email: false });
  const [page, setPage] = useState(false);
  const [err, setErr] = useState('');
  const [hidden, setHidden] = useState(false);
  const stRef = useRef(st);
  stRef.current = st;
  const keep = (next) => { findMeMem.set(uid, next); writeJsonLs(`zchat-findme-${uid}`, next); stRef.current = next; setSt(next); };
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_contacts_get').then(({ data, error }) => {
      if (!alive) return;
      if (error) { if (rpcMissing(error)) setHidden(true); return; }
      if (data && data.ok) keep({ phone: !!data.phone, email: !!data.email });
    }, () => {});
    return () => { alive = false; };
  }, [uid]);
  const flipEmail = async () => {
    const before = stRef.current;
    const next = !before.email;
    setErr('');
    keep({ ...before, email: next });
    let res = null;
    try { res = await supabase.rpc('zchat_contacts_set_email', { p_on: next }); } catch (e) { res = { error: e }; }
    const data = res && res.data;
    if (!res || res.error || !data || !data.ok) {
      keep({ ...stRef.current, email: before.email });
      setErr(data && data.reason === 'email' ? 'Confirm your email address first, then try again.' : friendlyError(res && res.error, "That didn't save. Try again."));
    }
  };
  if (hidden) return null;
  const saved = readJsonLs(`zchat-findme-num-${uid}`, null);
  return (
    <>
      <IgHeading>Find me by</IgHeading>
      <SettingsRowPlain icon={<Phone size={16} />} label="Phone number" sub="People with your number can find you" value={st.phone ? (maskedPhone(saved) || 'On') : 'Off'} onClick={() => setPage(true)} />
      <SettingsRowPlain icon={<Mail size={16} />} label="Email address" sub="People with your email can find you" right={<IgToggle on={!!st.email} onClick={flipEmail} />} />
      {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '6px 2px 0' }}>{err}</div>}
      {page && <FindMePhonePage uid={uid} me={me} on={!!st.phone} onClose={() => setPage(false)} onSaved={(v) => keep({ ...stRef.current, phone: v })} />}
    </>
  );
}

const contactsFindMem = new Map();
export function ContactsFindPage({ uid, blockedIds, onClose, onPick }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const mem = contactsFindMem.get(uid);
  const [stage, setStage] = useState(mem ? 'done' : 'intro');
  const [people, setPeople] = useState(mem ? mem.people : []);
  const [note, setNote] = useState(mem ? mem.note : '');
  const [err, setErr] = useState('');
  const [follows, setFollows] = useState(() => new Map((mem ? mem.people : []).map((p) => [p.id, p.follow || null])));
  const pick = async () => {
    if (stage === 'checking') return;
    setErr('');
    let picked = [];
    try { picked = await navigator.contacts.select(['tel', 'email'], { multiple: true }); } catch (e) {
      if (!e || (e.name !== 'AbortError' && e.name !== 'InvalidStateError')) setErr("Couldn't open your contacts. Try again.");
      return;
    }
    if (!picked || !picked.length) return;
    const saved = readJsonLs(`zchat-findme-num-${uid}`, null);
    const cc = saved && DIAL_MAP[saved.cc] ? saved.cc : guessCountry();
    const values = new Set();
    picked.forEach((c) => {
      ((c && c.tel) || []).forEach((t) => { const e = phoneE164(t, cc); if (e) values.add(e); });
      ((c && c.email) || []).forEach((m) => { const e = String(m || '').trim().toLowerCase(); if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) values.add(e); });
    });
    const all = [...values];
    if (!all.length) { setErr('Those contacts have no phone numbers or emails to look for.'); return; }
    setStage('checking');
    let hashes = [];
    try { hashes = await Promise.all(all.slice(0, 500).map((v) => sha256Hex(v))); } catch { setStage(people.length || mem ? 'done' : 'intro'); setErr("Couldn't check your contacts on this phone."); return; }
    let res = null;
    try { res = await supabase.rpc('zchat_contacts_match', { p_hashes: hashes }); } catch (e) { res = { error: e }; }
    const data = res && res.data;
    if (!res || res.error || !data || !data.ok) {
      setStage(contactsFindMem.get(uid) ? 'done' : 'intro');
      const reason = data && data.reason;
      setErr(reason === 'limited' ? 'You checked your contacts a few times today. Try again tomorrow.' : friendlyError(res && res.error, "Couldn't check your contacts. Try again."));
      return;
    }
    const found = sanitizeAvatarList((Array.isArray(data.people) ? data.people : []).filter((p) => p && p.id && p.id !== uid && !(blockedIds && blockedIds.has(p.id))), uid);
    const n = all.length > 500 ? 'We checked the first 500 numbers and emails you picked.' : '';
    contactsFindMem.set(uid, { people: found, note: n });
    setFollows(new Map(found.map((p) => [p.id, p.follow || null])));
    setPeople(found);
    setNote(n);
    setStage('done');
  };
  const toggleFollow = async (p) => {
    hapticTap();
    const cur = follows.get(p.id) || null;
    const before = cur === 'pending' ? 'pending' : cur ? 'accepted' : 'none';
    const next = cur ? 'none' : (p.is_private ? 'pending' : 'accepted');
    const apply = (st) => {
      setFollows((m) => { const n2 = new Map(m); n2.set(p.id, st && st !== 'none' ? st : null); return n2; });
      const c = contactsFindMem.get(uid);
      if (c) contactsFindMem.set(uid, { ...c, people: c.people.map((x) => (x.id === p.id ? { ...x, follow: st && st !== 'none' ? st : null } : x)) });
    };
    apply(next);
    const res = await followSync(uid, p.id, next, before);
    if (!res.ok) { apply(res.state); appSnack(friendlyError(res.error, "That didn't work. Try again.")); }
  };
  return (
    <FullPage title="From your contacts" onBack={onClose} zIndex={61}>
      {stage === 'intro' && (
        <div className="zchat-tab-in" style={{ padding: '6px 2px 0' }}>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55 }}>Pick the people you want to look for. Their numbers and emails are turned into codes on this phone before anything is sent, and names never leave your phone. Only people who turned on Find me by in their settings can show up.</div>
          {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, paddingTop: 12 }}>{err}</div>}
          <div style={{ marginTop: 18 }}><BigButton label="Pick contacts" onClick={pick} /></div>
        </div>
      )}
      {stage === 'checking' && (
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 10px', color: theme.muted, fontSize: 14 }}>
          <Spinner size={22} color={theme.muted} />
          <span>Checking your contacts</span>
        </div>
      )}
      {stage === 'done' && (
        <>
          {people.length ? (
            <>
              <div style={{ padding: '10px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>{people.length === 1 ? '1 person from your contacts is on ZChat' : `${people.length} people from your contacts are on ZChat`}</div>
              {people.map((p) => (
                <UserListRow key={p.id} profile={p} onClick={() => onPick(p)} rightContent={(
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FollowActionButton size="sm" state={follows.get(p.id) || 'none'} busy={false} onClick={() => toggleFollow(p)} />
                    <div role="button" aria-label={`Message ${p.name}`} onClick={(e) => { e.stopPropagation(); onPick(p); }} className="zchat-press"
                      style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer' }}><MessageSquare size={21} strokeWidth={1.8} /></div>
                  </div>
                )} />
              ))}
            </>
          ) : (
            <EmptyState art="discover" title="No contacts on ZChat yet" text="None of the people you picked have turned on Find me by." />
          )}
          {note && <div style={{ fontSize: 12.5, color: theme.muted, padding: '12px 2px 0', lineHeight: 1.5 }}>{note}</div>}
          {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '12px 2px 0' }}>{err}</div>}
          <div style={{ marginTop: 18 }}><BigButton tone="plain" label="Pick other contacts" onClick={pick} /></div>
        </>
      )}
    </FullPage>
  );
}
export function TextBombSheet({ initial, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [text, setText] = useState(() => String(initial || '').slice(0, 200));
  const [n, setN] = useState(10);
  const ok = text.trim().length > 0;
  const send = () => { if (!ok) return; hapticTap(); onSend(text.trim(), n); };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(0, 0, 0, 0.42)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '0 18px calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 8px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <TextBombIcon size={24} color={theme.ink} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink }}>Text bomb</div>
              <div style={{ fontSize: 13, color: theme.muted }}>Your message lands again and again</div>
            </div>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 200))} rows={2} placeholder="What should it say?" aria-label="Bomb message"
            style={{ ...inputStyle(theme), width: '100%', boxSizing: 'border-box', resize: 'none', fontFamily: FONT, fontSize: 16, lineHeight: 1.35 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 16 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.ink }}>How many times</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
          </div>
          <KitSlider value={n} min={2} max={BOMB_MAX} step={1} onChange={(v) => setN(v)} label="How many times" style={{ marginTop: 8 }} />
          <div style={{ position: 'relative', height: 26, marginTop: 2 }}>
            {[5, 10, 25, BOMB_MAX].map((v) => (
              <div key={v} role="button" aria-pressed={n === v} aria-label={`${v} times`} onClick={() => { setN(v); hapticTap(); }}
                style={{ position: 'absolute', top: 0, left: `calc(12px + (100% - 24px) * ${(v - 2) / (BOMB_MAX - 2)})`, transform: 'translateX(-50%)', padding: '3px 8px', fontSize: 12.5, fontWeight: n === v ? 700 : 600, color: n === v ? kitOnInk(theme) : theme.muted, cursor: 'pointer', fontVariantNumeric: 'tabular-nums', transition: 'color 160ms ease', WebkitTapHighlightColor: 'transparent' }}>{v}</div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}><BigButton label={`Send ${n} times`} onClick={send} disabled={!ok} /></div>
          <div style={{ fontSize: 12, color: theme.muted, textAlign: 'center', marginTop: 10, lineHeight: 1.45 }}>It arrives as one bomb, so it never floods their notifications.</div>
        </div>
      </div>
    </Portal>
  );
}
export function SoundboardSheet({ onClose, onTap, live, peerName, isGroup }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [hit, setHit] = useState(null);
  const taps = useRef([]);
  const liveOn = live > 0;
  const tap = (k, label) => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < 2000);
    if (taps.current.length >= 8) return;
    taps.current.push(now);
    setHit({ k, at: now });
    if (liveOn && !spriteBufs.board && ensureAudioCtx()) {
      loadSprite('board').then(() => { playSoundboard(k); onTap(k, label, true); });
      return;
    }
    playSoundboard(k);
    onTap(k, label, liveOn);
  };
  const who = String(peerName || '').split(' ')[0] || 'them';
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '9px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ padding: '2px 18px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>Sounds</div>
              <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: theme.muted, marginTop: 3, lineHeight: 1.35 }}>
                {liveOn && <span className={reducedMotion() ? undefined : 'zchat-live-dot'} style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}
                <span>{liveOn ? (isGroup ? `Live with ${live} ${live === 1 ? 'person' : 'people'} here. Every tap plays for everyone.` : `Live with ${who}. Every tap plays for both of you.`) : (isGroup ? 'Tap one to send it to the group.' : `Tap one to send it. It plays live when ${who} has this chat open.`)}</span>
              </div>
            </div>
            {liveOn && <div role="button" aria-label="Done" onClick={onClose} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 17, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: theme.soft, color: theme.ink, flexShrink: 0 }}>Done</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 4, padding: '0 10px 6px' }}>
            {SOUNDBOARD.filter((x) => !x[3]).map(([k, label, emo]) => {
              const on = hit && hit.k === k;
              return (
                <div key={k} role="button" aria-label={liveOn ? `Play ${label}` : `Send sound ${label}`} onClick={() => tap(k, label)} className="zchat-press zplain-tile"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 2px 10px', borderRadius: 16, cursor: 'pointer', minWidth: 0 }}>
                  <span key={on ? hit.at : 0} aria-hidden="true" className={on && !reducedMotion() ? 'zchat-emo-pop' : undefined} style={{ fontSize: 30, lineHeight: 1, display: 'inline-block' }}>{emo}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.ink, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Portal>
  );
}
export function HiddenWordsPage({ onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [cfg, setCfg] = useState(() => { const c = hiddenWordsCfg(); return { on: c.on, words: c.words }; });
  const [draft, setDraft] = useState('');
  const commit = (next) => { setCfg(next); saveHiddenWordsCfg(next); };
  const add = () => {
    const parts = draft.split(',').map((x) => x.trim().toLowerCase()).filter((x) => x.length >= 2 && x.length <= 40);
    if (!parts.length) return;
    const words = [...new Set([...parts, ...cfg.words])].slice(0, 200);
    commit({ ...cfg, words });
    setDraft('');
    hapticTap();
  };
  return (
    <FullPage title="Hidden words" onBack={onClose} zIndex={72}>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Messages with these words are covered in your chats. You can still tap to read them. People are not told.</div>
      <IgRow inset={false} icon={<EyeOff size={16} />} label="Hide offensive words" sub="Common swear words and insults" right={<IgToggle on={cfg.on} onClick={() => commit({ ...cfg, on: !cfg.on })} />} />
      <IgHeading>Your own words</IgHeading>
      <div style={{ position: 'relative' }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 120))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Add words, split with commas" aria-label="Add hidden words" style={{ ...inputStyle(theme), paddingRight: 70 }} />
        <button type="button" onClick={add} disabled={!draft.trim()} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', height: 38, padding: '0 14px', border: 'none', background: 'transparent', color: draft.trim() ? kitOnInk(theme) : theme.muted2, fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: draft.trim() ? 'pointer' : 'default', transition: 'color 160ms ease' }}>Add</button>
      </div>
      {cfg.words.length === 0 && <div style={{ fontSize: 13, color: theme.muted, padding: '14px 2px' }}>Words you add show up here.</div>}
      {cfg.words.length > 0 && (
        <div role="list" aria-label="Your hidden words" style={{ padding: '8px 0 14px' }}>
          {cfg.words.map((w, i) => (
            <div key={w} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, paddingLeft: 2, boxShadow: i < cfg.words.length - 1 ? `0 0.5px 0 ${theme.hair}` : 'none' }}>
              <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w}</span>
              <div role="button" aria-label={`Remove ${w}`} onClick={() => { hapticTap(); commit({ ...cfg, words: cfg.words.filter((x) => x !== w) }); }} className="zchat-press" style={{ width: 40, height: 40, marginRight: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          ))}
        </div>
      )}
    </FullPage>
  );
}
async function safetyCodeFor(fpA, fpB) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode([fpA, fpB].sort().join('|')));
  const a = new Uint8Array(h);
  let digits = '';
  for (let i = 0; digits.length < 12 && i < a.length; i++) digits += String(a[i] % 10);
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
}

export function PickPeoplePage({ userId, title, subtitle, multi = true, max = 256, initial, onDone, onClose, actionLabel = 'Done', blockedIds, zIndex = 75 }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [picked, setPicked] = useState(() => new Map((initial || []).map((p) => [p.id, p])));
  const timer = useRef(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted').limit(500);
      const ids = (f || []).map((x) => x.following_id);
      const known = (initial || []).map((p) => p.id);
      const all = [...new Set([...ids, ...known])];
      if (!all.length) { if (alive) setPeople([]); return; }
      const { data: profs } = await fetchProfilesView(all);
      if (!alive) return;
      setPeople(sanitizeAvatarList(profs || [], userId).filter((p) => !p.is_deleted && !p.is_bot && p.id !== userId && !(blockedIds && blockedIds.has(p.id))).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    })();
    return () => { alive = false; };
  }, [userId]);
  const doSearch = (val) => {
    setQ(val);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setResults(null); return; }
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data || [], userId).filter((u) => u.id !== userId && !u.is_bot && !(blockedIds && blockedIds.has(u.id))));
    }, 280);
  };
  const toggle = (p) => {
    hapticTap();
    if (!multi) { onDone([p]); return; }
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(p.id)) next.delete(p.id);
      else if (next.size < max) next.set(p.id, p);
      return next;
    });
  };
  const term = q.trim().toLowerCase();
  const local = (people || []).filter((p) => !term || (p.name || '').toLowerCase().includes(term) || (p.username || '').toLowerCase().includes(term));
  const localIds = new Set(local.map((p) => p.id));
  const extra = (results || []).filter((p) => !localIds.has(p.id));
  const tick = (on) => (
    <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${on ? theme.coral : theme.border}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {on && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
    </span>
  );
  return (
    <FullPage title={title} subtitle={multi ? (picked.size ? `${picked.size} picked` : subtitle) : subtitle} onBack={onClose} zIndex={zIndex}
      right={multi ? <div role="button" aria-label={actionLabel} onClick={() => { if (picked.size) onDone([...picked.values()]); }} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 800, color: picked.size ? theme.coral : theme.muted, cursor: picked.size ? 'pointer' : 'default' }}>{actionLabel}</div> : null}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 6px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search by name or username" aria-label="Search people" autoCapitalize="none"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {q ? <X size={16} style={{ cursor: 'pointer' }} onClick={() => doSearch('')} /> : null}
      </label>
      {multi && picked.size > 0 && (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 0 6px', scrollbarWidth: 'none' }}>
          {[...picked.values()].map((p) => (
            <div key={p.id} role="button" aria-label={`Remove ${p.name}`} onClick={() => toggle(p)} style={{ width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                <Avatar emoji={p.avatar} name={p.name} size={46} />
                <span style={{ position: 'absolute', right: -2, top: -2, width: 18, height: 18, borderRadius: '50%', background: theme.ink, color: theme.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></span>
              </div>
              <span style={{ fontSize: 11, color: theme.ink, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.name || '').split(' ')[0]}</span>
            </div>
          ))}
        </div>
      )}
      {people === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>
      ) : (
        <>
          {local.map((p) => <UserListRow key={p.id} profile={p} onClick={() => toggle(p)} rightContent={multi ? tick(picked.has(p.id)) : <ChevronRight size={18} color={theme.muted} />} />)}
          {extra.length > 0 && <div style={{ padding: '14px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>More people</div>}
          {extra.map((p) => <UserListRow key={p.id} profile={p} onClick={() => toggle(p)} rightContent={multi ? tick(picked.has(p.id)) : <ChevronRight size={18} color={theme.muted} />} />)}
          {!local.length && !extra.length && <EmptyState art="nothing" title={term ? 'No one found' : 'Nobody to show yet'} text={term ? 'Try their exact username.' : 'Follow people and they show up here.'} />}
        </>
      )}
    </FullPage>
  );
}

export function HiddenChatsPage({ uid, conversations, archived, groups, onOpenDm, onOpenGroup, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const vault = useVault(uid);
  const [changePin, setChangePin] = useState(false);
  const [askOff, setAskOff] = useState(null);
  const keys = new Set(vault.keys);
  const dms = [...(conversations || []), ...(archived || [])].filter((c) => c.otherProfile && keys.has(chatPrefKey('dm', c.otherProfile.id)));
  const gs = (groups || []).filter((g) => keys.has(chatPrefKey('group', g.id)));
  const unhide = (key) => {
    const v = readVault(uid);
    writeVault(uid, { ...v, keys: v.keys.filter((k) => k !== key) });
    hapticTap();
  };
  const unhideBtn = (key, name) => (
    <div role="button" aria-label={`Show ${name} in chats`} onClick={(e) => { e.stopPropagation(); setAskOff({ key, name }); }} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40, padding: '0 4px 0 10px', fontSize: 15, fontWeight: 600, color: kitOnInk(theme), cursor: 'pointer', flexShrink: 0 }}><Eye size={17} strokeWidth={2} />Unhide</div>
  );
  return (
    <FullPage title="Hidden chats" subtitle="Only you can open these" onBack={onClose} zIndex={80}
      right={<div role="button" aria-label="Change hidden chats PIN" onClick={() => setChangePin(true)} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Pencil size={19} /></div>}>
      <div style={{ padding: '10px 2px 8px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Hidden chats stay out of your chat list, search and notifications. New messages still arrive here.</div>
      {!dms.length && !gs.length && <EmptyState art="nothing" title="No hidden chats" text="Press and hold a chat in your list, then tap Hide chat." />}
      {dms.map((c) => (
        <UserListRow key={c.id} profile={c.otherProfile} sub={c.preview && c.preview.text ? c.preview.text : `@${c.otherProfile.username}`} onClick={() => onOpenDm(c)} rightContent={unhideBtn(chatPrefKey('dm', c.otherProfile.id), c.otherProfile.name)} />
      ))}
      {gs.map((g) => (
        <div key={g.id} role="button" onClick={() => onOpenGroup(g)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0', cursor: 'pointer' }}>
          <GroupAvatar avatar={g.avatar} name={g.name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
            <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(g.preview && g.preview.text) || 'Group'}</div>
          </div>
          {unhideBtn(chatPrefKey('group', g.id), g.name)}
        </div>
      ))}
      {changePin && <VaultPinPage mode="set" uid={uid} title="New PIN" onClose={() => setChangePin(false)} onDone={() => setChangePin(false)} />}
      {askOff && (
        <ConfirmSheet title={`Show ${askOff.name} again?`} text="It goes back to your chat list and notifications." confirmLabel="Unhide" danger={false} zIndex={95}
          onCancel={() => setAskOff(null)} onConfirm={() => { unhide(askOff.key); setAskOff(null); }} />
      )}
    </FullPage>
  );
}

export function BroadcastPage({ userId, me, blockedIds, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [lists, setLists] = useState(null);
  const [setupMissing, setSetupMissing] = useState(false);
  const [edit, setEdit] = useState(null);
  const [compose, setCompose] = useState(null);
  const load = async () => {
    const { data, error } = await supabase.from('broadcast_lists').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) { setSetupMissing(true); setLists([]); return; }
    setLists(data || []);
  };
  useEffect(() => { load(); }, [userId]);
  return (
    <FullPage title="Broadcast lists" subtitle="Send one message to many people" onBack={onClose} zIndex={70}
      right={<div role="button" aria-label="New broadcast list" onClick={() => setEdit({ name: '', members: [] })} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={22} /></div>}>
      <div style={{ padding: '10px 2px 8px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Everyone gets it as a normal private message from you. They do not see who else got it, and replies come back to your chats.</div>
      {setupMissing && <div style={{ padding: '6px 2px 12px', fontSize: 13, fontWeight: 700, color: theme.danger }}>Broadcast lists switch on once the latest ZChat setup is finished.</div>}
      {lists === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : (
        <>
          {!lists.length && !setupMissing && <EmptyState art="nochats" title="No lists yet" text="Make a list, like Family or Team, then message them all at once." action={<PillButton primary label="New list" onClick={() => setEdit({ name: '', members: [] })} />} />}
          {lists.map((l) => (
            <div key={l.id} role="button" aria-label={`Open list ${l.name}`} onClick={() => setCompose(l)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
              <div style={{ width: 46, height: 46, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BroadcastIcon size={24} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.name}</div>
                <div style={{ fontSize: 12.5, color: theme.muted }}>{(l.member_ids || []).length} {(l.member_ids || []).length === 1 ? 'person' : 'people'}</div>
              </div>
              <div role="button" aria-label={`Edit list ${l.name}`} onClick={(e) => { e.stopPropagation(); setEdit(l); }} style={{ padding: 8, color: theme.muted, cursor: 'pointer' }}><Pencil size={17} /></div>
            </div>
          ))}
        </>
      )}
      {edit && <BroadcastEditPage userId={userId} list={edit} blockedIds={blockedIds} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
      {compose && <BroadcastComposePage userId={userId} me={me} list={compose} onClose={() => setCompose(null)} onSend={onSend} onEdit={() => { setEdit(compose); }} />}
    </FullPage>
  );
}

export function BroadcastEditPage({ userId, list, blockedIds, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(list.name || '');
  const [members, setMembers] = useState(null);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [askDelete, setAskDelete] = useState(false);
  useEffect(() => {
    let alive = true;
    const ids = list.member_ids || [];
    if (!ids.length) { setMembers([]); return undefined; }
    fetchProfilesView(ids).then(({ data }) => { if (alive) setMembers(sanitizeAvatarList(data || [], userId)); });
    return () => { alive = false; };
  }, [list.id]);
  const save = async () => {
    if (busy) return;
    const clean = name.trim().slice(0, 40);
    if (!clean) { setErr('Give the list a name'); return; }
    if (!members || !members.length) { setErr('Add at least one person'); return; }
    setBusy(true);
    setErr('');
    const row = { owner_id: userId, name: clean, member_ids: members.map((p) => p.id) };
    const res = list.id ? await supabase.from('broadcast_lists').update(row).eq('id', list.id).eq('owner_id', userId) : await supabase.from('broadcast_lists').insert(row);
    setBusy(false);
    if (res.error) { setErr('That could not be saved. Try again.'); return; }
    onSaved();
  };
  const remove = async () => {
    await supabase.from('broadcast_lists').delete().eq('id', list.id).eq('owner_id', userId);
    onSaved();
  };
  return (
    <FullPage title={list.id ? 'Edit list' : 'New list'} onBack={onClose} zIndex={76} footer={<BigButton label={busy ? 'Saving' : 'Save list'} disabled={busy} onClick={save} />}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '12px 2px 6px' }}>List name</div>
      <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Family, Team, Classmates" aria-label="List name" style={inputStyle(theme)} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 2px 6px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>{members ? countWord(members.length, 'person', 'people') : 'People'}</span>
        <span role="button" aria-label="Add people to list" onClick={() => setPicking(true)} style={{ fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Add people</span>
      </div>
      {members === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.muted} /></div> : members.map((p) => (
        <UserListRow key={p.id} profile={p} rightContent={<div role="button" aria-label={`Remove ${p.name}`} onClick={() => setMembers((prev) => prev.filter((x) => x.id !== p.id))} style={{ padding: 8, cursor: 'pointer', color: theme.muted }}><X size={18} /></div>} />
      ))}
      {err && <div role="alert" style={{ padding: '10px 2px', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
      {list.id && <div role="button" aria-label="Delete list" onClick={() => setAskDelete(true)} style={{ padding: '22px 2px 6px', fontSize: 14.5, fontWeight: 800, color: theme.danger, cursor: 'pointer' }}>Delete list</div>}
      {picking && <PickPeoplePage userId={userId} title="Add people" subtitle="Pick who gets your broadcasts" initial={members || []} blockedIds={blockedIds} onClose={() => setPicking(false)} onDone={(list2) => { setMembers(list2); setPicking(false); }} zIndex={80} />}
      {askDelete && <ConfirmSheet title="Delete this list?" text="The people in it are not told." confirmLabel="Delete" zIndex={95} onCancel={() => setAskDelete(false)} onConfirm={remove} />}
    </FullPage>
  );
}

export function BroadcastComposePage({ userId, list, onClose, onSend, onEdit }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [state, setState] = useState(null);
  const fileRef = useRef(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const count = (list.member_ids || []).length;
  const go = async () => {
    if (state && state.busy) return;
    if (!text.trim() && !file) return;
    if (navigator.onLine === false) { setState({ done: true, error: 'No connection. Try again when you are back online.' }); return; }
    setState({ busy: true, sent: 0, total: count });
    const res = await onSend(list, text.trim(), file, (n) => setState((s) => ({ ...(s || {}), busy: true, sent: n, total: count })));
    setState({ done: true, ...res });
    if (res && res.sent) { setText(''); setFile(null); setPreview(''); }
  };
  return (
    <FullPage title={list.name} subtitle={`${count} ${count === 1 ? 'person' : 'people'}`} onBack={onClose} zIndex={76}
      right={<div role="button" aria-label="Edit this list" onClick={onEdit} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Pencil size={19} /></div>}
      footer={<BigButton label={state && state.busy ? `Sending ${state.sent} of ${state.total}` : `Send to ${count}`} disabled={(!text.trim() && !file) || !!(state && state.busy)} onClick={go} />}>
      <div style={{ padding: '12px 2px 8px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Each person gets this as a private message from you.</div>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))} placeholder="Write your message" aria-label="Broadcast message" rows={5} style={{ ...inputStyle(theme), resize: 'none', fontFamily: FONT, minHeight: 120 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        {preview ? (
          <div style={{ position: 'relative' }}>
            <img src={preview} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
            <div role="button" aria-label="Remove photo" onClick={() => { setFile(null); setPreview(''); }} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: theme.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={12} color="#FFFFFF" /></div>
          </div>
        ) : (
          <div role="button" aria-label="Add a photo" onClick={() => fileRef.current && fileRef.current.click()} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: theme.rowBg, color: theme.ink, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><ImageIcon size={18} />Add a photo</div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} />
      {state && state.done && (
        <div role="status" style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: theme.rowBg, fontSize: 13.5, fontWeight: 700, color: state.error ? theme.danger : theme.ink }}>
          {state.error || (state.failed ? `Sent to ${state.sent}. ${state.failed} could not get it.` : `Sent to ${state.sent === 1 ? '1 person' : `${state.sent} people`}.`)}
        </div>
      )}
    </FullPage>
  );
}
async function addPhotosToAlbum(album, userId, files, onProgress) {
  const rows = [];
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const kind = (f.type || '').startsWith('video') ? 'video' : 'image';
    let file = f;
    if (kind === 'image') { try { const u = URL.createObjectURL(f); file = await prepareImageFile(f, u); URL.revokeObjectURL(u); } catch {} }
    const { url, error } = await uploadChatMedia(file, userId);
    if (error || !url) { failed += 1; continue; }
    const { data, error: insErr } = await supabase.from('album_photos').insert({ album_id: album.id, user_id: userId, media_url: url, media_type: kind }).select().single();
    if (insErr || !data) { failed += 1; continue; }
    rows.push(data);
    if (onProgress) onProgress(i + 1);
  }
  return { rows, failed };
}

export function AlbumsPage({ chatKey, chatName, userId, onClose, onAdded, initialAlbumId }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [albums, setAlbums] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const load = async () => {
    const r = await loadAlbumsFor(chatKey);
    if (r.error) { setErr('Shared albums switch on once the latest ZChat setup is finished.'); setAlbums([]); return; }
    setAlbums(r.albums);
    if (open) setOpen((cur) => (cur ? r.albums.find((a) => a.id === cur.id) || cur : cur));
  };
  useEffect(() => { load(); }, [chatKey]);
  const autoOpenRef = useRef(false);
  useEffect(() => {
    if (!initialAlbumId || autoOpenRef.current || !albums) return;
    autoOpenRef.current = true;
    const a = albums.find((x) => x.id === initialAlbumId);
    if (a) setOpen(a); else setErr('That album is not available anymore.');
  }, [albums]);
  const create = async () => {
    const t = title.trim().slice(0, 60);
    if (!t) return;
    const { data, error } = await supabase.from('albums').insert({ chat_key: chatKey, title: t, created_by: userId }).select().single();
    if (error || !data) { setErr('That album could not be made. Try again.'); return; }
    setCreating(false);
    setTitle('');
    await load();
    setOpen({ ...data, photos: [] });
  };
  return (
    <FullPage title="Shared albums" subtitle={chatName} onBack={onClose} zIndex={72}
      right={<div role="button" aria-label="New album" onClick={() => setCreating(true)} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={22} /></div>}>
      <div style={{ padding: '10px 2px 10px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Everyone in this chat can add photos and videos to an album. Great for trips, parties and class projects.</div>
      {err && <div role="alert" style={{ padding: '4px 2px 10px', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
      {albums === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : !albums.length && !err ? (
        <EmptyState art="moments" title="No albums yet" text="Make the first one and start adding photos." action={<PillButton primary label="New album" onClick={() => setCreating(true)} />} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {albums.map((a) => (
            <div key={a.id} role="button" aria-label={`Open album ${a.title}`} onClick={() => setOpen(a)} className="zchat-press" style={{ cursor: 'pointer', minWidth: 0 }}>
              <div style={{ aspectRatio: '1 / 1', borderRadius: 16, overflow: 'hidden', background: theme.rowBg, display: 'grid', gridTemplateColumns: a.photos.length > 1 ? '1fr 1fr' : '1fr', gap: 2 }}>
                {a.photos.length ? a.photos.slice(0, a.photos.length > 3 ? 4 : 1).map((p) => <MediaImg key={p.id} src={p.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />)
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}><AlbumIcon size={30} /></div>}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, marginTop: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
              <div style={{ fontSize: 12, color: theme.muted }}>{a.photos.length} {a.photos.length === 1 ? 'item' : 'items'}</div>
            </div>
          ))}
        </div>
      )}
      {creating && (
        <ChatRowSheet title="New album" onClose={() => setCreating(false)} zIndex={96} actions={[]}
          peek={(
            <div style={{ padding: '12px 18px 10px' }}>
              <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 60))} onKeyDown={(e) => { if (e.key === 'Enter') create(); }} placeholder="Name your album" aria-label="Album name" autoFocus style={inputStyle(theme)} />
              <div style={{ marginTop: 10 }}><BigButton label="Create album" disabled={!title.trim()} onClick={create} /></div>
            </div>
          )} />
      )}
      {open && <AlbumPage album={open} userId={userId} onClose={() => { setOpen(null); load(); }} onAdded={(rows) => { if (onAdded) onAdded(open, rows); load(); }} />}
    </FullPage>
  );
}

export function AlbumPage({ album, userId, onClose, onAdded }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [photos, setPhotos] = useState(album.photos || null);
  const [busy, setBusy] = useState(null);
  const [view, setView] = useState(null);
  const [askDelete, setAskDelete] = useState(null);
  const [askAlbumDelete, setAskAlbumDelete] = useState(false);
  const fileRef = useRef(null);
  const pressRef = useRef({});
  const load = async () => {
    const { data } = await supabase.from('album_photos').select('*').eq('album_id', album.id).order('created_at', { ascending: false }).limit(1000);
    setPhotos(data || []);
  };
  useEffect(() => { load(); }, [album.id]);
  const add = async (files) => {
    if (!files.length) return;
    if (navigator.onLine === false) { setBusy({ error: 'No connection. Try again when you are back online.' }); return; }
    setBusy({ n: 0, total: files.length });
    const { rows, failed } = await addPhotosToAlbum(album, userId, files.slice(0, 30), (n) => setBusy({ n, total: files.length }));
    setBusy(failed ? { error: `${failed} could not be added. Try those again.` } : null);
    if (rows.length) { setPhotos((prev) => [...rows.slice().reverse(), ...(prev || [])]); if (onAdded) onAdded(rows); }
  };
  const remove = async (p) => {
    setPhotos((prev) => (prev || []).filter((x) => x.id !== p.id));
    await supabase.from('album_photos').delete().eq('id', p.id);
  };
  const removeAlbum = async () => {
    await supabase.from('albums').delete().eq('id', album.id).eq('created_by', userId);
    onClose();
  };
  const startPress = (p) => {
    clearTimeout(pressRef.current.t);
    pressRef.current.fired = false;
    if (p.user_id !== userId && album.created_by !== userId) return;
    pressRef.current.t = setTimeout(() => { pressRef.current.fired = true; hapticTap(); setAskDelete(p); }, 520);
  };
  const endPress = () => clearTimeout(pressRef.current.t);
  return (
    <FullPage title={album.title} subtitle={photos ? `${photos.length} ${photos.length === 1 ? 'item' : 'items'}` : ''} onBack={onClose} zIndex={78} pad={false}
      right={album.created_by === userId ? <div role="button" aria-label="Delete album" onClick={() => setAskAlbumDelete(true)} style={{ padding: '0 12px', height: 44, display: 'flex', alignItems: 'center', cursor: 'pointer', color: theme.muted }}><Trash2 size={19} /></div> : null}
      footer={<BigButton label={busy && busy.total ? `Adding ${busy.n} of ${busy.total}` : 'Add photos and videos'} disabled={!!(busy && busy.total)} onClick={() => fileRef.current && fileRef.current.click()} />}>
      {busy && busy.error && <div role="alert" style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: theme.danger }}>{busy.error}</div>}
      {photos === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div> : !photos.length ? (
        <EmptyState art="moments" title="Nothing here yet" text="Add the first photos. Everyone in the chat can see them." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {photos.map((p) => (
            <div key={p.id} role="button" aria-label={p.media_type === 'video' ? 'Open video' : 'Open photo'}
              onPointerDown={() => startPress(p)} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
              onContextMenu={(e) => { e.preventDefault(); if (p.user_id === userId || album.created_by === userId) setAskDelete(p); }}
              onClick={() => { if (pressRef.current.fired) { pressRef.current.fired = false; return; } setView(p); }}
              style={{ position: 'relative', aspectRatio: '1 / 1', background: theme.rowBg, cursor: 'pointer', overflow: 'hidden', WebkitTouchCallout: 'none' }}>
              {p.media_type === 'video'
                ? <VideoThumb src={p.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                : <MediaImg src={p.media_url} loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />}
              {p.media_type === 'video' && <Play size={15} color="white" fill="white" style={{ position: 'absolute', top: 7, right: 7, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))' }} />}
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; add(files); }} />
      {view && view.media_type !== 'video' && <Portal><ImageViewer url={view.media_url} onClose={() => setView(null)} /></Portal>}
      {view && view.media_type === 'video' && <Portal><VideoViewer url={view.media_url} onClose={() => setView(null)} /></Portal>}
      {askDelete && <ConfirmSheet title="Remove from album?" text="It is removed for everyone in the chat." confirmLabel="Remove" zIndex={96} onCancel={() => setAskDelete(null)} onConfirm={() => { const p = askDelete; setAskDelete(null); remove(p); }} />}
      {askAlbumDelete && <ConfirmSheet title={`Delete ${album.title}?`} text="The album and everything in it is removed for everyone." confirmLabel="Delete album" zIndex={96} onCancel={() => setAskAlbumDelete(false)} onConfirm={removeAlbum} />}
    </FullPage>
  );
}

export function SecretChatPage({ uid, peer, on, onToggle, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [state, setState] = useState({ busy: true });
  const load = async () => {
    if (!secretSupported()) { setState({ unsupported: true }); return; }
    const mine = await myDeviceKey(uid, false);
    const server = await fetchPeerKey(uid);
    const theirs = await fetchPeerKey(peer.id);
    let code = '';
    if (mine && theirs) { try { code = await safetyCodeFor(mine.fp, theirs.fp); } catch {} }
    setState({ mine, server, theirs, code, otherPhone: !!(mine && server && server.fp !== mine.fp) || (!mine && !!server) });
  };
  useEffect(() => { load(); }, [peer.id]);
  const turnOn = async (force) => {
    setState((s) => ({ ...s, busy: true }));
    const r = await publishDeviceKey(uid, !!force);
    if (!r.ok) { setState((s) => ({ ...s, busy: false, otherPhone: r.reason === 'other', error: r.reason === 'setup' ? 'Secret chats switch on once the latest ZChat setup is finished.' : r.reason === 'unsupported' ? 'This browser cannot do secret chats.' : '' })); return; }
    const theirs = await fetchPeerKey(peer.id);
    if (!theirs) { setState((s) => ({ ...s, busy: false, mine: r.mine, error: `${(peer.name || '').split(' ')[0]} needs to open the new ZChat once before you can start a secret chat.` })); return; }
    onToggle(true);
    await load();
  };
  const first = (peer.name || '').split(' ')[0] || 'them';
  return (
    <FullPage title="Secret chat" subtitle={peer.name} onBack={onClose} zIndex={72}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 8px', color: theme.coral }}><Lock size={42} /></div>
      <div style={{ textAlign: 'center', fontSize: 14, color: theme.muted, lineHeight: 1.55, padding: '0 10px 6px' }}>Messages you send while this is on are locked on your phone and can only be unlocked on {first}'s phone. Not even ZChat can read them.</div>
      {state.unsupported ? <div style={{ textAlign: 'center', padding: 16, fontWeight: 700, color: theme.danger }}>This browser cannot do secret chats.</div> : (
        <>
          <IgRow inset={false} icon={<Lock size={16} />} label="Secret chat" sub={on ? 'On. New text messages are locked.' : 'Off'} right={state.busy ? <Spinner size={16} color={theme.muted} /> : <IgToggle on={!!on} onClick={() => { if (on) { onToggle(false); load(); } else turnOn(false); }} />} />
          {state.otherPhone && !on && (
            <div style={{ margin: '10px 0', padding: 14, borderRadius: 16, background: theme.rowBg, border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: theme.ink }}>Your secret chats live on another phone</div>
              <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, marginTop: 4 }}>You can move them here. Secret messages sent before the move can only be read on the old phone.</div>
              <div role="button" aria-label="Use this phone for secret chats" onClick={() => turnOn(true)} className="zchat-press" style={{ marginTop: 10, height: 42, borderRadius: 12, background: theme.coral, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Use this phone</div>
            </div>
          )}
          {state.error && <div role="alert" style={{ padding: '10px 2px', fontSize: 13, fontWeight: 700, color: theme.danger }}>{state.error}</div>}
          {state.code && (
            <>
              <IgHeading>Security code</IgHeading>
              <div style={{ textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: '0.08em', color: theme.ink, fontVariantNumeric: 'tabular-nums', padding: '6px 0' }}>{state.code}</div>
              <div style={{ textAlign: 'center', fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '0 10px' }}>Check that {first} sees the same code. If it matches, nobody is in the middle.</div>
            </>
          )}
          <IgHeading>Good to know</IgHeading>
          <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.6, padding: '0 2px' }}>Only text messages are locked. Photos, voice notes and stickers are sent the normal way. If you clear this app or change phones, old secret messages cannot be opened again.</div>
        </>
      )}
    </FullPage>
  );
}
async function saveCustomTone(name, blob, secs) {
  const id = `t${Date.now().toString(36)}`;
  const uid = favoriteSync.userId || null;
  const ok = await mediaDbOp('tones', 'readwrite', (s) => s.put({ id, name: String(name || 'My tone').slice(0, 40), blob, at: Date.now(), uid, secs: secs || null }));
  if (!ok) return null;
  await loadCustomTones();
  if (uid) uploadCustomTone(uid, id);
  return `c:${id}`;
}

export function ToneRecorderSheet({ onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [phase, setPhase] = useState('idle');
  const [secs, setSecs] = useState(0);
  const [blob, setBlob] = useState(null);
  const [secsInfo, setSecsInfo] = useState(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const recRef = useRef(null);
  const takeSound = async (raw) => {
    setPhase('busy');
    let done = null;
    try { done = await processToneBlob(raw); } catch { done = null; }
    if (!done) { setErr('This phone could not read that sound. Try an mp3 or m4a file.'); setBlob(null); setPhase('idle'); return; }
    if (done.quiet) { setErr('That sound is silent. Try again a little closer to the mic.'); setBlob(null); setPhase('idle'); return; }
    setErr('');
    setBlob(done.blob);
    setSecsInfo({ secs: done.secs, long: done.long });
    setPhase('review');
  };
  const streamRef = useRef(null);
  const tRef = useRef(0);
  const urlRef = useRef(null);
  const fileRef = useRef(null);
  const stopAll = () => { clearInterval(tRef.current); try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch {} streamRef.current = null; };
  useEffect(() => () => { stopAll(); if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  const start = async () => {
    setErr('');
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = st;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find((m) => { try { return window.MediaRecorder && MediaRecorder.isTypeSupported(m); } catch { return false; } }) || '';
      const rec = new MediaRecorder(st, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { stopAll(); const b = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }); takeSound(b); };
      recRef.current = rec;
      rec.start();
      setPhase('rec');
      setSecs(0);
      const t0 = Date.now();
      tRef.current = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); setSecs(s); if (s >= 10) { try { rec.stop(); } catch {} } }, 200);
      hapticTap();
    } catch (e) { setPhase('idle'); if (permDenied(e)) { setErr(''); openPermHelp('mic'); } else setErr('Your microphone could not start. Try again.'); }
  };
  const stop = () => { try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {} };
  const pickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^audio\//.test(f.type || '')) { setErr('Pick a sound file, like an mp3 or m4a.'); return; }
    if (f.size > 1024 * 1024) { setErr('That sound is too big. Pick one under 1 MB.'); return; }
    setName(String(f.name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').slice(0, 40));
    takeSound(f);
  };
  const preview = () => {
    if (!blob) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(blob);
    const a = new Audio(urlRef.current);
    a.play().catch(() => {});
    setTimeout(() => { try { a.pause(); } catch {} }, 10500);
  };
  const save = async () => {
    if (!blob) return;
    const key = await saveCustomTone(name.trim() || `My tone ${customTones.list.length + 1}`, blob, secsInfo && secsInfo.secs);
    if (!key) { setErr('This phone could not save the tone.'); return; }
    hapticTap();
    onSaved(key);
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 820, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '10px 20px calc(18px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
          <div style={{ textAlign: 'center', fontSize: 16.5, fontWeight: 700, color: theme.ink }}>Make your own tone</div>
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.muted, marginTop: 3 }}>Record up to 10 seconds or pick a sound under 1 MB. ZChat trims the quiet parts and evens out the volume.</div>
          {phase === 'busy' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '30px 0 18px' }}><Spinner size={22} color={theme.coral} /><div style={{ fontSize: 13.5, color: theme.muted }}>Getting your sound ready</div></div>
          ) : phase !== 'review' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 6px' }}>
              <div role="button" aria-label={phase === 'rec' ? 'Stop recording' : 'Record a tone'} onClick={phase === 'rec' ? stop : start} className="zchat-press" style={{ width: 76, height: 76, borderRadius: '50%', background: phase === 'rec' ? '#FF3B30' : theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: phase === 'rec' ? '0 0 0 8px rgba(255,59,48,0.18)' : 'none', transition: 'box-shadow 0.2s' }}>
                {phase === 'rec' ? <span style={{ width: 24, height: 24, borderRadius: 5, background: '#FFFFFF' }} /> : <Mic size={30} color="#FFFFFF" />}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>{phase === 'rec' ? `0:${String(Math.min(10, secs)).padStart(2, '0')} of 0:10` : 'Tap to record'}</div>
              <div role="button" aria-label="Pick a sound file" onClick={() => fileRef.current && fileRef.current.click()} style={{ marginTop: 16, fontSize: 14.5, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Pick a sound file</div>
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={pickFile} />
            </div>
          ) : (
            <div style={{ padding: '18px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div role="button" aria-label="Play tone" onClick={preview} className="zchat-press" style={{ width: 46, height: 46, borderRadius: '50%', background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, flexShrink: 0 }}><Play size={20} /></div>
                <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Name your tone" aria-label="Tone name" enterKeyHint="done" style={{ ...inputStyle(theme), flex: 1, fontSize: 15.5 }} />
              </div>
              {secsInfo && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 8 }}>{secsInfo.long ? `Kept the first 10 seconds` : `${secsInfo.secs < 1 ? 'Under a second' : `${Math.round(secsInfo.secs * 10) / 10} seconds`}`}, saved to your account so it is on your other devices too.</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <div style={{ width: 120 }}><BigButton label="Again" tone="plain" onClick={() => { setBlob(null); setSecsInfo(null); setPhase('idle'); }} /></div>
                <div style={{ flex: 1 }}><BigButton label="Save tone" onClick={save} /></div>
              </div>
            </div>
          )}
          {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, textAlign: 'center', paddingTop: 12 }}>{err}</div>}
        </div>
      </div>
    </Portal>
  );
}
function hslHex(hh, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (k) => { const x = (k + hh / 30) % 12; const c = l - a * Math.max(-1, Math.min(x - 3, 9 - x, 1)); return Math.round(c * 255).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}
function hexHue(hex) {
  const n = parseInt(String(hex || '#7C5CFC').slice(1), 16);
  const r = ((n >> 16) & 255) / 255; const g = ((n >> 8) & 255) / 255; const b = (n & 255) / 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const d = mx - mn;
  if (!d) return 0;
  let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hh *= 60;
  return hh < 0 ? hh + 360 : hh;
}
export function AccentPickerSheet({ value, onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [hue, setHue] = useState(() => Math.round(hexHue(value)));
  const [hex, setHex] = useState(value || '#7C5CFC');
  const [text, setText] = useState(value || '#7C5CFC');
  const barRef = useRef(null);
  const tones = [[0.78, 0.62], [0.82, 0.55], [0.7, 0.48], [0.62, 0.42], [0.55, 0.35]];
  const setFromHue = (hh) => { setHue(hh); const nx = hslHex(hh, 0.82, 0.55); setHex(nx); setText(nx); };
  const drag = (e) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    setFromHue(Math.round(t * 360));
  };
  const pal = makeAccentPalette(hex);
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 820, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '10px 20px calc(18px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
          <div style={{ textAlign: 'center', fontSize: 16.5, fontWeight: 700, color: theme.ink }}>Pick any colour</div>
          <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '18px 0 14px' }}>
            <div style={{ padding: '8px 14px', borderRadius: 18, borderBottomRightRadius: 6, background: theme.dark ? pal.meDark : pal.meLight, color: theme.ink, fontSize: 14.5, fontWeight: 600 }}>Looks good</div>
            <div style={{ height: 36, padding: '0 16px', borderRadius: 10, background: pal.coral, color: '#FFFFFF', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center' }}>Send</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: pal.coral }}>See all</div>
          </div>
          <div ref={barRef} role="slider" aria-label="Color" aria-valuemin={0} aria-valuemax={360} aria-valuenow={hue}
            onPointerDown={(e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} drag(e); }} onPointerMove={(e) => { if (e.buttons || e.pointerType !== 'mouse') drag(e); }}
            style={{ position: 'relative', height: 30, borderRadius: 15, background: 'linear-gradient(90deg, #FF3B30, #FF9500, #FFCC00, #34C759, #00C7BE, #007AFF, #5856D6, #AF52DE, #FF2D55, #FF3B30)', cursor: 'pointer', touchAction: 'none' }}>
            <div style={{ position: 'absolute', top: -3, left: `calc(${(hue / 360) * 100}% - 18px)`, width: 36, height: 36, borderRadius: '50%', background: hslHex(hue, 0.82, 0.55), boxShadow: '0 0 0 3px #FFFFFF, 0 2px 8px rgba(0,0,0,0.35)', pointerEvents: 'none' }} />
          </div>
          <div role="radiogroup" aria-label="Shades" style={{ display: 'flex', justifyContent: 'space-between', padding: '18px 6px 4px' }}>
            {tones.map(([s, l]) => {
              const c = hslHex(hue, s, l);
              const on = c === hex;
              return <div key={`${s}-${l}`} role="radio" aria-checked={on} aria-label={`Shade ${c}`} onClick={() => { setHex(c); setText(c); hapticTap(); }} style={{ width: 44, height: 44, borderRadius: '50%', background: c, cursor: 'pointer', boxShadow: on ? `0 0 0 3px ${theme.panelBg}, 0 0 0 5px ${c}` : 'none' }} />;
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <input value={text} onChange={(e) => { const v = e.target.value.slice(0, 7); setText(v); if (/^#[0-9a-f]{6}$/i.test(v)) { setHex(v.toUpperCase()); setHue(Math.round(hexHue(v))); } }} aria-label="Color code" style={{ ...inputStyle(theme), width: 120, fontSize: 15.5, fontVariantNumeric: 'tabular-nums' }} />
            <div style={{ flex: 1 }}><BigButton label="Use this colour" onClick={() => onPick(hex)} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
function GroupReadList({ group, m, members, myId }) {
  const { theme } = useTheme();
  const reads = useGroupReads(group.id, true);
  const [open, setOpen] = useState(false);
  const { read, waiting } = readersOf(reads, members, myId, m);
  const head = (t) => <div style={{ padding: '12px 20px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>{t}</div>;
  const row = (p, right) => (
    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 20px', minHeight: 48, boxSizing: 'border-box' }}>
      <Avatar emoji={p.avatar} name={p.name} size={34} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
      {right}
    </div>
  );
  if (!reads || !reads.ready) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '18px 0 10px' }}><Spinner size={18} color={theme.muted} /></div>;
  }
  if (!reads.on) {
    return <div style={{ padding: '14px 20px 10px', fontSize: 13.5, lineHeight: 1.45, color: theme.muted }}>Your read receipts are off, so you cannot see who read it. Turn them on in Privacy.</div>;
  }
  return (
    <div style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
      {head('Read by')}
      {read.length
        ? read.map((s) => row(s.p, s.at ? <span style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', flexShrink: 0 }}>{editWhen(new Date(s.at).toISOString())}</span> : null))
        : <div style={{ padding: '6px 20px 10px', fontSize: 14, color: theme.muted }}>Nobody has read it yet</div>}
      {waiting.length > 0 && (
        <>
          <div role="button" aria-expanded={open} aria-label={`Not read yet, ${waiting.length}`} onClick={() => { hapticTap(); setOpen((v) => !v); }} className="zchat-row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px 8px', cursor: 'pointer' }}>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: theme.muted }}>Not read yet</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{waiting.length}</span>
            <ChevronRight size={16} color={theme.muted} style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: reducedMotion() ? 'none' : 'transform 0.2s ease' }} />
          </div>
          {open && <div className="zchat-fade">{waiting.map((p) => row(p, null))}</div>}
        </>
      )}
    </div>
  );
}

export function MessageInfoSheet({ m, isMine, peerName, isGroup, onClose, group = null, members = null, myId = null }) {
  const { theme } = useTheme();
  const g1x = useG1InfoExtra(m, group, members, myId);
  const when = (v) => (v ? new Date(v).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' }) : '');
  const kind = m.type === 'text' ? (parseGameMessage(m.content) ? 'Game' : parsePoll(m.content) ? 'Poll' : parseEventMsg(m.content) ? 'Event' : parseLocationMessage(m.content) ? 'Location' : 'Text') : m.type === 'image' ? 'Photo' : m.type === 'video' ? 'Video' : m.type === 'voice' || m.type === 'audio' ? 'Voice message' : m.type === 'sticker' ? 'Sticker' : 'Message';
  const status = m.g1wait ? (m.g1wait === 'declined' ? 'Not approved' : 'Waiting for approval') : m.queued ? 'Waiting to send' : (m.read && !isGroup) ? `Read by ${peerName || 'them'}` : m.delivered ? 'Delivered' : 'Sent';
  const val = (t) => <span style={{ fontSize: 13.5, color: theme.muted, whiteSpace: 'nowrap' }}>{t}</span>;
  const actions = [
    ...g1x.rows.filter((r) => r.k === 'asked').map((r) => ({ icon: r.icon, label: r.label, right: val(r.value), onClick: () => {} })),
    { icon: <Clock size={18} />, label: g1x.rows.some((r) => r.k === 'asked') ? 'Approved' : 'Sent', right: val(when(m.created_at)), onClick: () => {} },
    ...g1x.rows.filter((r) => r.k !== 'asked').map((r) => ({ icon: r.icon, label: r.label, right: val(r.value), onClick: () => {} })),
    isMine ? { icon: <CheckCheck size={18} />, label: 'Status', right: val(status), onClick: () => {} } : null,
    { icon: <FileText size={18} />, label: 'Type', right: val(kind), onClick: () => {} },
    m.edited ? { icon: <Edit3 size={18} />, label: 'Edited', right: val('Yes'), onClick: () => {} } : null,
    m.type === 'text' && m.content && kind === 'Text' ? { icon: <Type size={18} />, label: 'Length', right: val(countWord(m.content.length, 'character', 'characters')), onClick: () => {} } : null,
    m.expires_at ? { icon: <Timer size={18} />, label: 'Disappears', right: val(when(m.expires_at)), onClick: () => {} } : null,
  ];
  return <ChatRowSheet title="Message info" subtitle={g1x.subtitle || (isMine ? 'Sent by you' : `From ${peerName || 'them'}`)} onClose={onClose} actions={actions} zIndex={96} peek={group && isMine && members && Number.isFinite(Number(m.id)) ? <GroupReadList group={group} m={m} members={members} myId={myId} /> : null} />;
}
const editHistoryMem = new Map();
function editWhen(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtHM(d);
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return `Yesterday, ${fmtHM(d)}`;
  return `${fmtDate(d, { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })}, ${fmtHM(d)}`;
}
export function EditHistorySheet({ m, isMine, senderName, chatTheme, onClose }) {
  useBackClose(true, onClose);
  const { theme, fontScale, bubbleColor } = useTheme();
  const drag = useSheetDrag(onClose);
  const [rows, setRows] = useState(() => editHistoryMem.get(m.id) || null);
  const [note, setNote] = useState('');
  useEffect(() => { if (m.deleted) onClose(); }, [m.deleted]);
  useEffect(() => {
    let alive = true;
    const fail = (text) => { if (!alive) return; setNote(text); setRows((r) => r || []); };
    supabase.rpc('zchat_edit_history', { p_message: m.id }).then(({ data, error }) => {
      if (!alive) return;
      if (error) {
        fail(rpcMissing(error) ? 'Edit history switches on once the latest ZChat setup is finished.' : navigator.onLine === false ? 'No connection. Earlier versions show up when you are back online.' : 'Earlier versions did not load. Try again in a moment.');
        return;
      }
      const list = (Array.isArray(data) ? data : []).filter((r) => r && typeof r.content === 'string');
      editHistoryMem.set(m.id, list);
      if (editHistoryMem.size > 60) editHistoryMem.delete(editHistoryMem.keys().next().value);
      setNote('');
      setRows(list);
    }, () => fail('Earlier versions did not load. Try again in a moment.'));
    return () => { alive = false; };
  }, [m.id, m.content]);
  const spec = BUBBLE_COLORS[bubbleColor] || BUBBLE_COLORS.default;
  const bg = isMine ? ((theme.dark ? spec.meDark : spec.me) || theme.bubbleMe) : ((chatTheme && chatThemeThem(chatTheme, theme.dark)) || spec.them || theme.bubbleThem);
  const ink = isMine && chatTheme ? chatTheme.ink : theme.ink;
  const textCss = {
    fontSize: (m.text_size ? textSizePx(m.text_size) : 15) * fontScale,
    fontWeight: m.text_size === 'l' || m.text_size === 'xl' ? 800 : 400,
    ...fontStyleCss(m.text_font),
    color: ink,
    lineHeight: m.text_size === 'xl' ? 1.12 : m.text_size === 'l' ? 1.2 : 1.32,
  };
  const list = rows || [];
  const oldest = list[list.length - 1];
  const original = !!oldest && !!m.created_at && Math.abs(new Date(oldest.written_at).getTime() - new Date(m.created_at).getTime()) < 2000;
  const count = list.length;
  const label = (t) => <div style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', fontSize: 12, fontWeight: 600, color: theme.muted, padding: '0 4px 6px' }}>{t}</div>;
  const bubble = (text, when, tag, key) => (
    <div key={key} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '86%', marginBottom: 8, boxSizing: 'border-box', background: bg, ...(isMine && chatTheme ? { backgroundImage: themeGradCss(chatTheme) } : {}), borderRadius: 16, [isMine ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 5, padding: '6px 11px', border: isMine && chatTheme ? 'none' : `1px solid ${theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.06)', wordBreak: 'break-word', whiteSpace: 'pre-wrap', display: 'flow-root', ...textCss }}>
      <RichText text={text} />
      <span style={{ float: 'right', display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10, marginTop: 7, marginBottom: -3, fontSize: 10.5, fontWeight: 400, fontStyle: 'normal', fontFamily: FONT, lineHeight: 1, color: isMine && chatTheme ? chatTheme.ink : theme.muted, opacity: isMine && chatTheme ? 0.75 : 1 }}>
        {tag && <span style={{ fontWeight: 700 }}>{tag}</span>}{when}
      </span>
    </div>
  );
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.45)' }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(80vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ display: 'flex', color: theme.muted }}><EditHistoryIcon size={20} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: theme.ink }}>Edit history</div>
                <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {`${isMine ? 'You' : (senderName || 'They')} edited this ${count ? (count === 1 ? 'once' : `${count} times`) : 'message'}`}
                </div>
              </div>
            </div>
          </div>
          <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', background: theme.bgGradient, padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
            {label('Now')}
            {bubble(messageTextFor(m), editWhen(list[0] ? list[0].replaced_at : null), null, 'now')}
            {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 14 }}><Spinner size={18} color={theme.muted} /></div>}
            {count > 0 && <div style={{ height: 6 }} />}
            {count > 0 && label('Before')}
            {list.map((r, i) => bubble(r.content, editWhen(r.written_at), i === count - 1 && original ? 'Original,' : null, `v${i}`))}
            {rows !== null && !count && !note && <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 1.45, padding: '10px 18px 2px' }}>Earlier versions of this message were not kept.</div>}
            {note && <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', lineHeight: 1.45, padding: '10px 18px 2px' }}>{note}</div>}
          </div>
        </div>
      </div>
    </Portal>
  );
}

export function ChecklistComposerPage({ onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState(['', '', '']);
  const [busy, setBusy] = useState(false);
  const refs = useRef([]);
  const clean = items.map((o) => o.trim()).filter(Boolean);
  const ok = title.trim().length > 0 && clean.length >= 1;
  const field = { ...inputStyle(theme), fontSize: 15.5 };
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    await onSend({ t: title.trim().slice(0, 120), i: clean.map((o) => o.slice(0, 80)).slice(0, 15) });
    setBusy(false);
  };
  const addAfter = (i) => {
    if (items.length >= 15) return;
    setItems((p) => [...p.slice(0, i + 1), '', ...p.slice(i + 1)]);
    setTimeout(() => { const el = refs.current[i + 1]; if (el) el.focus(); }, 30);
  };
  return (
    <FullPage title="New checklist" subtitle="Everyone in the chat can tick things off" onBack={onClose} zIndex={70}
      footer={<BigButton label={busy ? 'Sending' : 'Send checklist'} disabled={!ok || busy} onClick={submit} />}>
      <PageArt k="reminders" text="Shopping, packing or plans. Share a list and tick things off together." />
      <IgHeading>Title</IgHeading>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Trip packing, groceries" aria-label="Checklist title" maxLength={120} style={field} />
      <IgHeading>Items</IgHeading>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${theme.muted}`, flexShrink: 0, opacity: 0.7 }} />
            <input ref={(el) => (refs.current[i] = el)} value={o} onChange={(e) => setItems((p) => p.map((x, k) => (k === i ? e.target.value : x)))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAfter(i); } }}
              placeholder={`Item ${i + 1}`} aria-label={`Item ${i + 1}`} maxLength={80} style={{ ...field, flex: 1 }} />
            {items.length > 1 && <div role="button" aria-label={`Remove item ${i + 1}`} onClick={() => setItems((p) => p.filter((_, k) => k !== i))} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>}
          </div>
        ))}
      </div>
      {items.length < 15 && (
        <div role="button" aria-label="Add item" onClick={() => addAfter(items.length - 1)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 2px', color: theme.coral, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}><Plus size={18} />Add an item</div>
      )}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '4px 2px 12px' }}>Up to 15 items. Ticks update live for everyone in the chat.</div>
    </FullPage>
  );
}

const BILL_CURRENCIES = ['$', '€', '£', 'Rs', '₹', '¥', 'A$', 'C$', 'AED'];
export function BillComposerPage({ onClose, onSend, people = 2, isGroup }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [count, setCount] = useState(Math.max(2, Math.min(50, people || 2)));
  const [cur, setCur] = useState(() => { try { return localStorage.getItem('zchat-bill-cur') || '$'; } catch { return '$'; } });
  const [busy, setBusy] = useState(false);
  const rawAmount = String(amount).trim();
  const total = rawAmount.includes('.') || /^\d{1,3}(,\d{3})+$/.test(rawAmount) ? Number(rawAmount.replace(/,/g, '')) : Number(rawAmount.replace(/,/g, '.'));
  const ok = title.trim().length > 0 && Number.isFinite(total) && total > 0 && total < 10000000;
  const field = { ...inputStyle(theme), fontSize: 15.5 };
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    try { localStorage.setItem('zchat-bill-cur', cur); } catch {}
    await onSend({ t: title.trim().slice(0, 80), a: Math.round(total * 100) / 100, n: count, c: cur });
    setBusy(false);
  };
  const stepBtn = (label, d) => (
    <div role="button" aria-label={label} onClick={() => setCount((x) => Math.max(2, Math.min(50, x + d)))} className="zchat-press"
      style={{ width: 44, height: 44, borderRadius: '50%', border: `1.5px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, fontSize: 22, fontWeight: 700, userSelect: 'none' }}>{d > 0 ? '+' : '−'}</div>
  );
  return (
    <FullPage title="Split the bill" subtitle="See who has paid you back" onBack={onClose} zIndex={70}
      footer={<BigButton label={busy ? 'Sending' : ok ? `Send, ${billMoney(cur, total / count)} each` : 'Send'} disabled={!ok || busy} onClick={submit} />}>
      <IgHeading>What for</IgHeading>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Dinner, taxi, movie tickets" aria-label="Bill title" maxLength={80} style={field} />
      <IgHeading>Total</IgHeading>
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={cur} onChange={(e) => setCur(e.target.value)} aria-label="Currency" style={{ ...field, width: 92, flexShrink: 0 }}>
          {BILL_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, '').slice(0, 10))} inputMode="decimal" placeholder="0.00" aria-label="Bill total" style={{ ...field, flex: 1, fontSize: 20, fontWeight: 800 }} />
      </div>
      <IgHeading>People sharing</IgHeading>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, padding: '6px 0' }}>
        {stepBtn('Fewer people', -1)}
        <div style={{ textAlign: 'center', minWidth: 70 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: theme.ink }}>{count}</div>
          <div style={{ fontSize: 12, color: theme.muted, fontWeight: 700 }}>people</div>
        </div>
        {stepBtn('More people', 1)}
      </div>
      {ok && (
        <div style={{ margin: '12px 0 4px', padding: '14px 16px', borderRadius: 16, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, color: theme.muted, fontWeight: 600 }}>Each person pays</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: theme.ink }}>{billMoney(cur, total / count)}</span>
        </div>
      )}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '8px 2px 12px' }}>{isGroup ? 'Everyone in the group can tap I paid once they send you their share.' : 'They can tap I paid once they send you their share.'} ZChat does not move any money.</div>
    </FullPage>
  );
}

export function JumpToDatePage({ messages, firstAt, onFindDay, onClose, onJump }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const real = (messages || []).filter((m) => m && m.created_at && !String(m.id).startsWith('temp-') && m.type !== 'system');
  const days = [];
  const seen = new Map();
  real.forEach((m) => {
    const d = new Date(m.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) { seen.set(key, days.length); days.push({ key, date: d, first: m.id, n: 0 }); }
    days[seen.get(key)].n += 1;
  });
  days.reverse();
  const pad = (n) => String(n).padStart(2, '0');
  const [picked, setPicked] = useState('');
  const go = (value) => {
    setPicked(value);
    if (!value || !real.length) return;
    const start = new Date(`${value}T00:00`).getTime();
    if (onFindDay && start < new Date(real[0].created_at).getTime()) { onFindDay(start); return; }
    const hit = real.find((m) => new Date(m.created_at).getTime() >= start);
    if (hit) onJump(hit.id, new Date(hit.created_at).getTime() - start > 86400000);
    else onJump(real[real.length - 1].id, true);
  };
  const first = firstAt ? new Date(firstAt) : real.length ? new Date(real[0].created_at) : null;
  const today = new Date();
  const label = (d) => {
    const a = new Date(); a.setHours(0, 0, 0, 0);
    const b = new Date(d); b.setHours(0, 0, 0, 0);
    const diff = Math.round((a - b) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };
  return (
    <FullPage title="Jump to a date" subtitle={first ? `Messages since ${fmtDate(first, { day: 'numeric', month: 'short', year: 'numeric' })}` : 'No messages yet'} onBack={onClose} zIndex={70}>
      <IgHeading>Pick a day</IgHeading>
      <input type="date" value={picked} aria-label="Pick a day" min={first ? `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(first.getDate())}` : undefined}
        max={`${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`}
        onChange={(e) => go(e.target.value)} style={{ ...inputStyle(theme), fontSize: 15.5 }} />
      <IgHeading>Days with messages</IgHeading>
      {!days.length && <EmptyState art="nothing" title="Nothing here yet" text="Once you start chatting, every day shows up here." />}
      {days.slice(0, 120).map((d) => (
        <div key={d.key} role="button" aria-label={`Jump to ${label(d.date)}`} onClick={() => onJump(d.first, false)} className="zchat-row-press"
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 4px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: theme.coral, letterSpacing: '0.06em' }}>{d.date.toLocaleString([], { month: 'short' }).toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: theme.ink, lineHeight: 1.1 }}>{d.date.getDate()}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{label(d.date)}</div>
            <div style={{ fontSize: 12.5, color: theme.muted }}>{d.n} {d.n === 1 ? 'message' : 'messages'}</div>
          </div>
          <ChevronRight size={18} color={theme.muted} />
        </div>
      ))}
    </FullPage>
  );
}
export function UsagePage({ onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [data] = useState(readUsage);
  const [limit, setLimitRaw] = useState(usageLimitMin);
  const setLimit = (m) => {
    setLimitRaw(m);
    try { localStorage.setItem('zchat-usage-limit', String(m)); localStorage.removeItem('zchat-usage-reminded'); } catch {}
    hapticTap();
  };
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return { d, s: data[usageDayKey(d)] || 0 };
  });
  const today = days[6].s;
  const avg = Math.round(days.reduce((a, b) => a + b.s, 0) / 7);
  const max = Math.max(60, ...days.map((x) => x.s));
  const opts = [[0, 'Off'], [30, '30 minutes'], [60, '1 hour'], [120, '2 hours'], [180, '3 hours']];
  return (
    <FullPage title="Time on ZChat" subtitle="Counted while ZChat is open on this device" onBack={onClose} zIndex={70}>
      <div style={{ textAlign: 'center', padding: '16px 0 6px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>Today</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: theme.ink, letterSpacing: '-0.02em', marginTop: 2 }}>{fmtUsage(today)}</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>Daily average <b style={{ color: theme.ink, fontWeight: 700 }}>{fmtUsage(avg).toLowerCase()}</b></div>
      </div>
      <div aria-label="Last 7 days" role="img" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, padding: '18px 6px 0' }}>
        {days.map((x, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: 34, height: `${Math.max(3, (x.s / max) * 100)}%`, borderRadius: 8, background: i === 6 ? theme.coral : (theme.dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.12)'), transition: 'height 0.4s ease' }} />
            <div style={{ fontSize: 11.5, fontWeight: 700, color: i === 6 ? theme.ink : theme.muted }}>{fmtDate(x.d, { weekday: 'narrow' })}</div>
          </div>
        ))}
      </div>
      <IgHeading>Daily reminder</IgHeading>
      <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, padding: '0 2px 6px' }}>Get a gentle nudge once a day when you reach this much time.</div>
      {opts.map(([m, l]) => (
        <div key={m} role="button" aria-label={`Reminder ${l}`} onClick={() => setLimit(m)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{l}</span>
          <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${limit === m ? theme.coral : theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {limit === m && <span style={{ width: 12, height: 12, borderRadius: '50%', background: theme.coral }} />}
          </span>
        </div>
      ))}
    </FullPage>
  );
}

export function MentionsPage({ myId, username, groups, hiddenIds, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [people, setPeople] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const ids = (groups || []).map((g) => g.id).filter(Boolean);
      if (!ids.length || !username) { if (alive) setRows([]); return; }
      try {
        const safe = String(username).replace(/[%,()]/g, '');
        const { data } = await supabase.from('messages').select('*').in('group_id', ids).eq('type', 'text').eq('deleted', false)
          .neq('sender_id', myId).ilike('content', `%@${safe}%`).order('created_at', { ascending: false }).limit(60);
        const hidden = hiddenIds || new Set();
        const list = (data || []).filter((m) => !hidden.has(m.id) && !isSpecialContent(m.content) && !parseGameMessage(m.content));
        const who = [...new Set(list.map((m) => m.sender_id))];
        if (who.length) {
          const { data: ps } = await fetchProfilesView(who);
          const map = {};
          (ps || []).forEach((p) => { map[p.id] = p; });
          if (alive) setPeople(map);
        }
        if (alive) setRows(list);
      } catch { if (alive) setRows([]); }
    })();
    return () => { alive = false; };
  }, []);
  return (
    <FullPage title="Mentions" subtitle={`Group messages that tag @${username}`} onBack={onClose} zIndex={66} pad={false}>
      <div style={{ padding: '4px 8px calc(24px + env(safe-area-inset-bottom))' }}>
        {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>}
        {rows && !rows.length && <EmptyState art="nothing" title="No mentions yet" text="When someone tags you in a group, it shows up here." />}
        {rows && rows.map((m) => {
          const group = (groups || []).find((g) => g.id === m.group_id);
          const p = people[m.sender_id];
          return (
            <div key={m.id} role="button" aria-label={`Open mention in ${group ? group.name : 'group'}`} onClick={() => onOpen({ group, profile: null, messageId: m.id, at: m.created_at })} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 8px', borderRadius: 14, cursor: 'pointer' }}>
              <Avatar emoji={p ? p.avatar : null} name={p ? p.name : 'Someone'} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><b>{p ? p.name : 'Someone'}</b><span style={{ color: theme.muted }}> in {group ? group.name : 'a group'}</span></span>
                  <span style={{ fontSize: 11.5, color: theme.muted, flexShrink: 0 }}>{fmtDate(new Date(m.created_at), { day: 'numeric', month: 'short' })}</span>
                </div>
                <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{highlightMatch(plainPreviewText(m.content), `@${username}`, theme.coral)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </FullPage>
  );
}

function readContactNotes() {
  try { const o = JSON.parse(localStorage.getItem('zchat-contact-notes') || '{}'); return o && typeof o === 'object' ? o : {}; } catch { return {}; }
}
function contactNoteFor(id) { return (readContactNotes()[id] || '').toString(); }
function saveContactNote(id, text) {
  const o = readContactNotes();
  const t = String(text || '').trim().slice(0, 500);
  if (t) o[id] = t; else delete o[id];
  try { localStorage.setItem('zchat-contact-notes', JSON.stringify(o)); } catch {}
}
function ContactNoteSheet({ name, value, onSave, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState(value || '');
  return (
    <FullPage title="Private note" subtitle={`Only you can see this about ${name}`} onBack={onClose} zIndex={70}
      footer={<BigButton label="Save note" onClick={() => { onSave(text); onClose(); }} />}>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 10px', textWrap: 'pretty' }}>Birthdays, gift ideas, where you met. The note stays on this device and is never sent to {name}.</div>
      <textarea autoFocus value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} placeholder="Write a note" aria-label="Private note" rows={7}
        style={{ ...inputStyle(theme), fontSize: 15.5, resize: 'none', lineHeight: 1.45 }} />
      <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', padding: '6px 2px' }}>{text.length}/500</div>
    </FullPage>
  );
}

function g2CloseChoices(base) {
  const now = new Date(base);
  const pad = (n) => String(n).padStart(2, '0');
  const dayWord = (d) => { const a = new Date(now); a.setHours(0, 0, 0, 0); const b = new Date(d); b.setHours(0, 0, 0, 0); const diff = Math.round((b - a) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : fmtDate(d, { weekday: 'long' }); };
  const tonight = new Date(now); tonight.setHours(21, 0, 0, 0);
  const hour = new Date(now.getTime() + 3600000);
  const tomorrow = new Date(now.getTime() + 86400000);
  const week = new Date(now.getTime() + 7 * 86400000);
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return {
    list: [
      { k: 'never', label: 'Never', sub: 'You can still end it any time', secs: 0, at: null },
      { k: 'hour', label: 'In 1 hour', sub: `${dayWord(hour)} at ${fmtHM(hour)}`, secs: 3600, at: hour },
      now.getHours() >= 5 && now.getHours() < 20 ? { k: 'tonight', label: 'Tonight', sub: `Today at ${fmtHM(tonight)}`, secs: 7200, at: tonight } : null,
      { k: 'tomorrow', label: 'Tomorrow', sub: `Tomorrow at ${fmtHM(tomorrow)}`, secs: 86400, at: tomorrow },
      { k: 'week', label: 'In a week', sub: `${fmtDate(week, { weekday: 'long', month: 'short', day: 'numeric' })} at ${fmtHM(week)}`, secs: 604800, at: week },
      { k: 'pick', label: 'Pick a time', sub: 'Choose the day and time', secs: 259200, at: null },
    ].filter(Boolean),
    min: local(new Date(now.getTime() + 5 * 60000)),
    max: local(new Date(now.getTime() + 30 * 86400000)),
    dayWord,
  };
}
export function PollComposerPage({ onClose, onSend, userId }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState(['', '']);
  const [pics, setPics] = useState([null, null]);
  const [multi, setMulti] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [anon, setAnon] = useState(false);
  const [right, setRight] = useState(-1);
  const [why, setWhy] = useState('');
  const [closeKey, setCloseKey] = useState('never');
  const [pickAt, setPickAt] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const pickForRef = useRef(-1);
  const choices = g2CloseChoices(listenNow());
  const filled = opts.map((o, i) => (o.trim() ? i : -1)).filter((i) => i >= 0);
  const clean = filled.map((i) => opts[i].trim());
  const answerIdx = quiz ? filled.indexOf(right) : -1;
  const pickedAt = closeKey === 'pick' && pickAt ? new Date(pickAt) : null;
  const pickOk = closeKey !== 'pick' || (!!pickedAt && Number.isFinite(pickedAt.getTime()) && pickedAt.getTime() > listenNow() + 60000);
  const uploading = pics.some((x) => x && x.busy);
  const ok = q.trim().length > 0 && clean.length >= 2 && new Set(clean.map((o) => o.toLowerCase())).size === clean.length && (!quiz || answerIdx >= 0) && pickOk && !uploading;
  const field = { ...inputStyle(theme), fontSize: 15.5 };
  const choosePhoto = (i) => { pickForRef.current = i; if (fileRef.current) fileRef.current.click(); };
  const onPhoto = async (file) => {
    const i = pickForRef.current;
    if (!file || i < 0 || !/^image\//.test(file.type || '')) return;
    const preview = URL.createObjectURL(file);
    const tag = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    setPics((prev) => prev.map((x, k) => (k === i ? { preview, busy: true, tag } : x)));
    let url = null;
    try {
      const img = await loadImageElement(preview);
      const small = await shrinkChatPhoto(file, preview, 1080);
      const scale = Math.min(1, 1080 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const r = await uploadChatMedia(small, userId, { w: (img.naturalWidth || 1) * scale, h: (img.naturalHeight || 1) * scale });
      url = r && !r.error ? r.url : null;
    } catch { url = null; }
    setPics((prev) => prev.map((x) => (x && x.tag === tag ? (url ? { preview, busy: false, tag, url } : null) : x)));
    if (!url) appSnack("That photo didn't upload. Try again.");
  };
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true);
    const out = { q: q.trim().slice(0, 200), o: clean.map((o) => o.slice(0, 80)).slice(0, 8) };
    if (quiz) { out.a = answerIdx; if (why.trim()) out.x = why.trim().slice(0, 200); } else if (multi) out.m = 1;
    const photoList = filled.slice(0, 8).map((i) => (pics[i] && pics[i].url) || null);
    if (photoList.some(Boolean)) out.p = photoList;
    if (anon) out.an = 1;
    const ch = choices.list.find((c) => c.k === closeKey);
    const at = closeKey === 'pick' ? pickedAt : closeKey === 'tonight' ? ch && ch.at : ch && ch.secs ? new Date(listenNow() + ch.secs * 1000) : null;
    if (at && Number.isFinite(at.getTime())) out.e = at.toISOString();
    await onSend(out);
    setBusy(false);
  };
  const removeAt = (i) => {
    setOpts((prev) => prev.filter((_, k) => k !== i));
    setPics((prev) => prev.filter((_, k) => k !== i));
    setRight((r) => (r === i ? -1 : r > i ? r - 1 : r));
  };
  const intro = quiz ? 'Test your friends. Everyone gets one try and sees the right answer after.' : multi ? 'Ask anything. People can pick as many answers as they like.' : 'Ask anything. Everyone picks one answer and can change it later.';
  const note = anon ? 'Everyone sees how many votes each answer gets. Nobody, not even you, can see who picked what.' : quiz ? 'Tap the circle next to the right answer. Votes cannot be changed in a quiz.' : multi ? 'People can pick more than one answer and change them any time.' : 'Each person picks one answer and can change it any time. Results update live for everyone.';
  return (
    <FullPage title={quiz ? 'New quiz' : 'New poll'} subtitle="Everyone in the chat can vote" onBack={onClose} zIndex={70}
      footer={<BigButton label={busy ? 'Sending' : uploading ? 'Adding photos' : quiz ? 'Send quiz' : 'Send poll'} disabled={!ok || busy} onClick={submit} />}>
      <PageArt k="poll" text={intro} />
      <IgHeading>Question</IgHeading>
      <textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder={quiz ? 'What is the capital of Japan?' : 'Ask something'} aria-label="Poll question" maxLength={200} rows={2} style={{ ...field, resize: 'none', lineHeight: 1.4 }} />
      <IgHeading>Answers</IgHeading>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; onPhoto(f); }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {opts.map((o, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {quiz && (
              <div role="button" aria-label={right === i ? `Answer ${i + 1} is right` : `Mark answer ${i + 1} as right`} onClick={() => { hapticTap(); setRight(i); }}
                style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${right === i ? '#16A34A' : theme.border}`, background: right === i ? '#16A34A' : 'transparent', boxSizing: 'border-box' }}>
                {right === i && <Check size={15} color="white" strokeWidth={3.2} />}
              </div>
            )}
            <input value={o} onChange={(e) => setOpts((prev) => prev.map((x, k) => (k === i ? e.target.value : x)))} placeholder={`Answer ${i + 1}`} aria-label={`Answer ${i + 1}`} maxLength={80} style={{ ...field, flex: 1 }} />
            {pics[i] ? (
              <div role="button" aria-label={`Remove photo from answer ${i + 1}`} onClick={() => { hapticTap(); setPics((prev) => prev.map((x, k) => (k === i ? null : x))); }} className="zchat-press" style={{ position: 'relative', width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: theme.rowBg }}>
                <img src={pics[i].preview} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: pics[i].busy ? 0.55 : 1 }} />
                {pics[i].busy ? <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={14} /></span>
                  : <span style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: 8, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} color="white" strokeWidth={3} /></span>}
              </div>
            ) : (
              <div role="button" aria-label={`Add a photo to answer ${i + 1}`} onClick={() => choosePhoto(i)} className="zchat-press" style={{ width: 40, height: 40, borderRadius: 10, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><ImageIcon size={18} /></div>
            )}
            {opts.length > 2 && <div role="button" aria-label={`Remove answer ${i + 1}`} onClick={() => removeAt(i)} style={{ width: 36, height: 36, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={16} /></div>}
          </div>
        ))}
      </div>
      {opts.length < 8 && (
        <div role="button" aria-label="Add answer" onClick={() => { setOpts((prev) => [...prev, '']); setPics((prev) => [...prev, null]); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 2px', color: theme.coral, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}><Plus size={18} />Add an answer</div>
      )}
      <IgHeading>Options</IgHeading>
      <IgRow inset={false} label="Quiz" sub="One right answer, one try each" right={<IgToggle on={quiz} onClick={() => { setQuiz((v) => !v); setMulti(false); }} />} />
      {!quiz && <IgRow inset={false} label="Multiple answers" sub="People can pick more than one" right={<IgToggle on={multi} onClick={() => setMulti((v) => !v)} />} />}
      <IgRow inset={false} label="Anonymous" sub="Nobody sees who voted for what, not even you" right={<IgToggle on={anon} onClick={() => setAnon((v) => !v)} />} />
      {quiz && <textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Explain the answer, optional" aria-label="Quiz explanation" maxLength={200} rows={2} style={{ ...field, resize: 'none', lineHeight: 1.4, marginTop: 6 }} />}
      <IgHeading>Closes</IgHeading>
      <ChoiceList label="Closes" value={closeKey} onChange={(k) => { setCloseKey(k); if (k === 'pick' && !pickAt) { const d = new Date(listenNow() + 86400000); d.setMinutes(0, 0, 0); const pad = (n) => String(n).padStart(2, '0'); setPickAt(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`); } }}
        options={choices.list.map((c) => ({ k: c.k, label: c.label, sub: c.k === 'pick' && pickedAt && Number.isFinite(pickedAt.getTime()) ? `${choices.dayWord(pickedAt)} at ${fmtHM(pickedAt)}` : c.sub, aria: `Closes ${c.label}`, icon: <PollEndGlyph secs={c.secs} /> }))} />
      {closeKey === 'pick' && (
        <div className="zchat-fade" style={{ padding: '6px 0 2px' }}>
          <input type="datetime-local" value={pickAt} min={choices.min} max={choices.max} onChange={(e) => setPickAt(e.target.value)} aria-label="Closing time" style={field} />
          {!pickOk && pickAt && <div role="alert" style={{ fontSize: 12.5, fontWeight: 700, color: theme.danger, padding: '8px 2px 0' }}>Pick a time later than now.</div>}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '14px 2px 12px' }}>{note}</div>
    </FullPage>
  );
}
function PollEndGlyph({ secs, size = 24 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const dot = (x, y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.15" fill="currentColor" />;
  let body;
  if (!secs) body = <path d="M12 12c-1.6-2.2-3-3.4-4.6-3.4a3.4 3.4 0 0 0 0 6.8c1.6 0 3-1.2 4.6-3.4s3-3.4 4.6-3.4a3.4 3.4 0 0 1 0 6.8c-1.6 0-3-1.2-4.6-3.4z" {...p} />;
  else if (secs < 86400) body = <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M12 7.6V12l3 1.8" {...p} /></>;
  else {
    const dots = secs >= 604800 ? [[7.6, 13.4], [10.5, 13.4], [13.4, 13.4], [16.3, 13.4], [7.6, 16.8], [10.5, 16.8], [13.4, 16.8]] : secs >= 259200 ? [[8.4, 15], [12, 15], [15.6, 15]] : [[12, 15]];
    body = <><rect x="4" y="5.5" width="16" height="14.5" rx="3" {...p} /><path d="M4 9.8h16M8.5 3.8v3.4M15.5 3.8v3.4" {...p} />{dots.map(([x, y]) => dot(x, y))}</>;
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>{body}</svg>;
}

function highlightMatch(text, term, color) {
  const t = String(text || '');
  const i = t.toLowerCase().indexOf(term.toLowerCase());
  if (!term || i < 0) return t.slice(0, 140);
  const start = Math.max(0, i - 40);
  const pre = (start > 0 ? '…' : '') + t.slice(start, i);
  return <>{pre}<b style={{ color, fontWeight: 800 }}>{t.slice(i, i + term.length)}</b>{t.slice(i + term.length, i + term.length + 90)}</>;
}
export function SearchMessagesPage({ myId, groups, hiddenIds, initialQuery, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState(initialQuery || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState({});
  const reqRef = useRef(0);
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); setLoading(false); return undefined; }
    setLoading(true);
    const my = ++reqRef.current;
    const t = setTimeout(async () => {
      try {
        const ids = (groups || []).map((g) => g.id).filter(Boolean);
        const safe = term.replace(/[%,()]/g, ' ');
        let qb = supabase.from('messages').select('*').eq('type', 'text').eq('deleted', false).ilike('content', `%${safe}%`).order('created_at', { ascending: false }).limit(80);
        qb = ids.length ? qb.or(`sender_id.eq.${myId},receiver_id.eq.${myId},group_id.in.(${ids.join(',')})`) : qb.or(`sender_id.eq.${myId},receiver_id.eq.${myId}`);
        const { data } = await qb;
        if (my !== reqRef.current) return;
        const hidden = hiddenIds || new Set();
        const rows = (data || []).filter((m) => !hidden.has(m.id) && !parseGameMessage(m.content) && !isSpecialContent(m.content) && !parseProfileLink(m.content));
        const otherIds = [...new Set(rows.filter((m) => !m.group_id).map((m) => (m.sender_id === myId ? m.receiver_id : m.sender_id)).filter(Boolean))];
        const missing = otherIds.filter((id) => !people[id]);
        let map = people;
        if (missing.length) {
          const { data: ps } = await fetchProfilesView(missing);
          map = { ...people };
          (ps || []).forEach((p) => { map[p.id] = p; });
          setPeople(map);
        }
        if (my !== reqRef.current) return;
        setResults(rows);
      } catch { if (my === reqRef.current) setResults([]); }
      if (my === reqRef.current) setLoading(false);
    }, 320);
    return () => clearTimeout(t);
  }, [q]);
  const term = q.trim();
  return (
    <FullPage title="Search messages" subtitle="Every chat and group" onBack={onClose} zIndex={66} pad={false}>
      <div style={{ padding: '6px 16px 8px', position: 'sticky', top: 0, zIndex: 2, background: igPalette(theme).bg }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted }}>
          <Search size={17} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your messages" aria-label="Search your messages" autoCapitalize="none" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15.5 }} />
          {loading ? <Spinner size={14} color={theme.muted} /> : q ? <X size={16} style={{ cursor: 'pointer' }} onClick={() => setQ('')} /> : null}
        </label>
      </div>
      <div style={{ padding: '0 8px calc(24px + env(safe-area-inset-bottom))' }}>
        {term.length < 2 && <EmptyState art="search" title="Find any message" text="Type at least two letters to search every chat and group you are in." />}
        {term.length >= 2 && results && results.length === 0 && !loading && <EmptyState art="nothing" title="No messages found" text="Try a different word." />}
        {term.length >= 2 && results && results.map((m) => {
          const group = m.group_id ? (groups || []).find((g) => g.id === m.group_id) : null;
          const other = !m.group_id ? people[m.sender_id === myId ? m.receiver_id : m.sender_id] : null;
          const name = group ? group.name : other ? other.name : 'Chat';
          const who = m.sender_id === myId ? 'You: ' : '';
          return (
            <div key={m.id} role="button" aria-label={`Open message in ${name}`} onClick={() => onOpen({ group, profile: other, messageId: m.id, at: m.created_at })} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 14, cursor: 'pointer' }}>
              {group ? <GroupAvatar avatar={group.avatar} name={group.name} size={46} /> : <Avatar emoji={other ? other.avatar : null} name={name} size={46} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                  <span style={{ fontSize: 11.5, color: theme.muted, flexShrink: 0 }}>{m.created_at ? fmtDate(new Date(m.created_at), { day: 'numeric', month: 'short' }) : ''}</span>
                </div>
                <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{who}{highlightMatch(m.content, term, theme.coral)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </FullPage>
  );
}
function writeQuickReplies(a) { try { localStorage.setItem('zchat-quick-replies', JSON.stringify(a)); } catch {} try { window.dispatchEvent(new Event('zchat-quick-replies')); } catch {} }
export function QuickRepliesPage({ onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(readQuickReplies);
  const [edit, setEdit] = useState(null);
  useBackClose(!!edit, () => setEdit(null));
  const save = (next) => { setList(next); writeQuickReplies(next); };
  const field = { ...inputStyle(theme), fontSize: 15.5 };
  const keyOk = edit && /^[a-z0-9]{1,16}$/.test(edit.k) && !list.some((r, i) => r.k === edit.k && i !== edit.i);
  const ok = edit && keyOk && edit.t.trim().length > 0;
  return (
    <>
      <FullPage title="Quick replies" subtitle="Type a slash in any chat" onBack={onClose} zIndex={72}
        footer={<BigButton label="Add a quick reply" onClick={() => setEdit({ i: -1, k: '', t: '' })} />}>
        <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 6px' }}>Save messages you send a lot. In a chat, type a slash and the shortcut, like /thanks, then tap the suggestion.</div>
        {list.length === 0 && <EmptyState art="quick" title="No quick replies yet" text="Save the things you type a lot and send them with one tap." />}
        {list.map((r, i) => (
          <div key={r.k} role="button" aria-label={`Edit quick reply ${r.k}`} onClick={() => setEdit({ i, k: r.k, t: r.t })} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: theme.coral, padding: '4px 9px', borderRadius: 9, background: `${theme.coral}1F`, flexShrink: 0 }}>/{r.k}</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</span>
            <ChevronRight size={17} color={theme.muted} />
          </div>
        ))}
      </FullPage>
      {edit && (
        <FullPage title={edit.i >= 0 ? 'Edit quick reply' : 'New quick reply'} onBack={() => setEdit(null)} zIndex={73}
          footer={(
            <div style={{ display: 'flex', gap: 10 }}>
              {edit.i >= 0 && <div style={{ flex: 1 }}><BigButton label="Delete" tone="plain" onClick={() => { save(list.filter((_, k) => k !== edit.i)); setEdit(null); }} /></div>}
              <div style={{ flex: 2 }}><BigButton label="Save" disabled={!ok} onClick={() => { const item = { k: edit.k, t: edit.t.trim().slice(0, 500) }; save(edit.i >= 0 ? list.map((r, k) => (k === edit.i ? item : r)) : [...list, item]); setEdit(null); }} /></div>
            </div>
          )}>
          <IgHeading>Shortcut</IgHeading>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: theme.coral }}>/</span>
            <input value={edit.k} onChange={(e) => setEdit({ ...edit, k: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) })} placeholder="thanks" aria-label="Shortcut" autoCapitalize="none" style={{ ...field, flex: 1 }} />
          </div>
          {edit.k && !keyOk && <div style={{ fontSize: 12.5, color: theme.danger, marginTop: 6 }}>That shortcut is already used.</div>}
          <IgHeading>Message</IgHeading>
          <textarea value={edit.t} onChange={(e) => setEdit({ ...edit, t: e.target.value })} placeholder="The full message" aria-label="Quick reply message" rows={4} maxLength={500} style={{ ...field, resize: 'none', lineHeight: 1.4 }} />
        </FullPage>
      )}
    </>
  );
}

export function ChatInsightsPage({ messages, myId, title, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const data = useMemo(() => {
    const list = (messages || []).filter((m) => !m.deleted && m.type !== 'system' && !String(m.id).startsWith('temp-'));
    const mine = list.filter((m) => m.sender_id === myId).length;
    const kinds = { image: 0, video: 0, audio: 0, sticker: 0, game: 0, link: 0 };
    const emo = {};
    const hours = Array(24).fill(0);
    const days = Array(7).fill(0);
    let words = 0;
    list.forEach((m) => {
      if (m.type === 'text') {
        if (parseGameMessage(m.content)) kinds.game += 1;
        else if (!isSpecialContent(m.content)) {
          const t = m.content || '';
          if (/https?:\/\//i.test(t)) kinds.link += 1;
          words += t.trim() ? t.trim().split(/\s+/).length : 0;
          const found = t.match(/\p{Extended_Pictographic}/gu) || [];
          found.forEach((e) => { emo[e] = (emo[e] || 0) + 1; });
        }
      } else if (kinds[m.type] != null) kinds[m.type] += 1;
      if (m.created_at) { const d = new Date(m.created_at); hours[d.getHours()] += 1; days[d.getDay()] += 1; }
    });
    const first = list.length ? new Date(list[0].created_at) : null;
    const topEmoji = Object.entries(emo).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const busyHour = hours.indexOf(Math.max(...hours));
    const busyDay = days.indexOf(Math.max(...days));
    return { total: list.length, mine, theirs: list.length - mine, kinds, topEmoji, hours, days, first, busyHour, busyDay, words };
  }, [messages, myId]);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hourLabel = (h) => new Date(2020, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' });
  const tile = (label, value) => (
    <div style={{ borderRadius: 16, padding: '13px 14px', background: theme.rowBg }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 2, letterSpacing: '-0.02em', color: theme.ink }}>{value}</div>
    </div>
  );
  const myPct = data.total ? Math.round((data.mine / data.total) * 100) : 50;
  const maxHour = Math.max(1, ...data.hours);
  return (
    <FullPage title="Chat insights" subtitle={title} onBack={onClose} zIndex={66}>
      {data.total === 0 ? <EmptyState art="insights" title="Nothing to show yet" text="Send a few messages and come back." /> : (
        <>
          <PageArt k="insights" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 8 }}>
            {tile('Messages', formatCount(data.total))}
            {tile('Words', formatCount(data.words))}
            {tile('Photos and videos', data.kinds.image + data.kinds.video)}
            {tile('Voice notes', data.kinds.audio)}
          </div>
          <IgHeading>Who talks more</IgHeading>
          <div style={{ height: 16, borderRadius: 8, overflow: 'hidden', display: 'flex', background: theme.rowBg }}>
            <div style={{ width: `${myPct}%`, background: theme.coral }} />
            <div style={{ flex: 1, background: theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.14)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: theme.muted, marginTop: 6, fontWeight: 700 }}>
            <span>You {myPct}%</span><span>Others {100 - myPct}%</span>
          </div>
          <IgHeading>When you chat</IgHeading>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90, padding: '6px 2px 0' }}>
            {data.hours.map((v, h) => <div key={h} title={hourLabel(h)} style={{ flex: 1, height: `${Math.max(4, (v / maxHour) * 100)}%`, borderRadius: 4, background: h === data.busyHour ? theme.coral : `${theme.coral}55` }} />)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.muted, marginTop: 4 }}><span>{hourLabel(0)}</span><span>{hourLabel(12)}</span><span>{hourLabel(23)}</span></div>
          <div style={{ fontSize: 14, color: theme.ink, marginTop: 10, lineHeight: 1.5 }}>Busiest around <b>{hourLabel(data.busyHour)}</b>, and <b>{dayNames[data.busyDay]}</b> is the busiest day.</div>
          {data.topEmoji.length > 0 && (
            <>
              <IgHeading>Top emoji</IgHeading>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.topEmoji.map(([e, n]) => (
                  <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 14, background: theme.rowBg }}><span style={{ fontSize: 22 }}>{e}</span><span style={{ fontSize: 13, fontWeight: 900, color: theme.muted }}>{n}</span></div>
                ))}
              </div>
            </>
          )}
          <IgHeading>More</IgHeading>
          {[['Stickers', data.kinds.sticker], ['Links', data.kinds.link], ['Games played', data.kinds.game], ['First message', data.first ? fmtDate(data.first, { day: 'numeric', month: 'long', year: 'numeric' }) : '']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 2px', borderBottom: `1px solid ${theme.border}`, fontSize: 15 }}>
              <span style={{ color: theme.ink, fontWeight: 600 }}>{l}</span><span style={{ color: theme.muted }}>{v}</span>
            </div>
          ))}
          <div style={{ fontSize: 12, color: theme.muted, padding: '12px 2px' }}>Counted from the messages on this phone.</div>
        </>
      )}
    </FullPage>
  );
}
export function RemindersPage({ uid, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(() => readReminders(uid));
  useEffect(() => { const on = () => setList(readReminders(uid)); window.addEventListener('zchat-reminders', on); return () => window.removeEventListener('zchat-reminders', on); }, [uid]);
  const remove = (id) => { const next = readReminders(uid).filter((r) => r.id !== id); writeReminders(uid, next); setList(next); hapticTap(); };
  const upcoming = list.filter((r) => !r.done).sort((a, b) => a.at - b.at);
  const past = list.filter((r) => r.done).sort((a, b) => b.at - a.at).slice(0, 30);
  const item = (r) => (
    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', borderBottom: `1px solid ${theme.border}` }}>
      <div role="button" aria-label={`Open reminder ${r.text}`} onClick={() => onOpen(r)} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', opacity: r.done ? 0.62 : 1 }}>
        {r.chat && r.chat.kind === 'group' ? <GroupAvatar avatar={r.chat.avatar} name={r.chat.name} size={44} /> : <Avatar emoji={r.chat ? r.chat.avatar : null} name={r.chat ? r.chat.name : ''} size={44} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: r.done ? theme.muted : theme.coral, display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12} />{reminderWhen(r.at)}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{r.text || 'Message'}</div>
          <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.chat ? r.chat.name : ''}</div>
        </div>
      </div>
      <div role="button" aria-label="Remove reminder" onClick={() => remove(r.id)} style={{ width: 36, height: 36, borderRadius: '50%', background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={16} /></div>
    </div>
  );
  return (
    <FullPage title="Reminders" subtitle="Messages to come back to" onBack={onClose} zIndex={66}>
      {upcoming.length === 0 && past.length === 0 && <EmptyState art="reminders" title="No reminders yet" text="Press and hold any message and tap Remind me. ZChat nudges you when it is time." />}
      {upcoming.length > 0 && <IgHeading>Coming up</IgHeading>}
      {upcoming.map(item)}
      {past.length > 0 && <IgHeading>Done</IgHeading>}
      {past.map(item)}
      {past.length > 0 && (
        <div role="button" aria-label="Clear done reminders" onClick={() => { const next = readReminders(uid).filter((r) => !r.done); writeReminders(uid, next); setList(next); }} style={{ padding: '16px 2px', fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer' }}>Clear done</div>
      )}
    </FullPage>
  );
}

export function VotesPage({ title, options, votes, myId, onClose, people: peopleWord, heading, correct }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const list = (votes || []).filter((r) => typeof r.emoji === 'string' && r.emoji.indexOf('zv:') === 0);
  const [people, setPeople] = useState({});
  const idsKey = [...new Set(list.map((r) => r.user_id))].filter(Boolean).sort().join(',');
  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').filter((id) => !people[id]) : [];
    if (!ids.length) return undefined;
    let alive = true;
    supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge').in('id', ids).then(({ data }) => {
      if (!alive) return;
      setPeople((prev) => { const map = { ...prev }; (data || []).forEach((p) => { map[p.id] = p; }); return map; });
    }, () => {});
    return () => { alive = false; };
  }, [idsKey]);
  return (
    <FullPage title={heading || (peopleWord ? 'Answers' : 'Votes')} subtitle={title} onBack={onClose} zIndex={72}>
      {options.map((opt, i) => {
        const voters = list.filter((r) => pollPicks(r.emoji).includes(i));
        return (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 2px 6px' }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: theme.ink, minWidth: 0, wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: 6 }}>{opt}{correct === i && <span aria-label="Right answer" style={{ display: 'inline-flex', width: 18, height: 18, borderRadius: '50%', background: '#16A34A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} color="white" strokeWidth={3.4} /></span>}</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: theme.coral, flexShrink: 0, marginLeft: 10 }}>{voters.length} {peopleWord ? (voters.length === 1 ? 'person' : 'people') : (voters.length === 1 ? 'vote' : 'votes')}</span>
            </div>
            {voters.length === 0 && <div style={{ fontSize: 13, color: theme.muted, padding: '4px 2px 8px' }}>{peopleWord ? 'No one yet' : 'No votes yet'}</div>}
            {voters.map((r) => {
              const p = people[r.user_id];
              const name = r.user_id === myId ? 'You' : (p ? p.name : '');
              return (
                <div key={r.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 2px' }}>
                  <Avatar emoji={p ? p.avatar : null} name={p ? p.name : '?'} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name ? <NameBadge name={name} verified={p && r.user_id !== myId ? p.verified : null} custom={p && r.user_id !== myId ? p.custom_badge : null} size={12} /> : <span style={{ color: theme.muted }}>Loading</span>}</div>
                    {p && p.username && <div style={{ fontSize: 12, color: theme.muted }}>@{p.username}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </FullPage>
  );
}
export function ThreadPage({ root, live, myId, nameOf, avatarOf, onClose, onSend, onJump }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => {
    let alive = true;
    supabase.from('messages').select('*').eq('reply_to_id', root.id).order('created_at', { ascending: true }).limit(300)
      .then(({ data }) => { if (alive) setRows(Array.isArray(data) ? data : []); }, () => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [root.id]);
  const merged = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((r) => map.set(r.id, r));
    (live || []).forEach((r) => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
    return [...map.values()].filter((r) => !r.deleted && r.type !== 'system').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [rows, live]);
  const count = merged.length;
  useEffect(() => { const el = scrollRef.current; if (el && count) el.scrollTop = el.scrollHeight; }, [count]);
  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const ok = await onSend(t);
    setBusy(false);
    if (ok) { setText(''); playUiSound('send'); }
  };
  const bodyOf = (r) => {
    if (r.type === 'text' && !isSpecialContent(r.content) && !parseGameMessage(r.content) && !parseLocationMessage(r.content)) return <RichText text={messageTextFor(r)} />;
    if ((r.type === 'image' || r.type === 'video') && !parseOnce(r) && !parseBlur(r)) return r.content && !String(r.content).startsWith('/') ? r.content : '';
    return <span style={{ color: theme.muted }}>{quoteTextFor(r)}</span>;
  };
  const line = (r, big) => (
    <div key={r.id} style={{ display: 'flex', gap: 11, padding: big ? '14px 0 10px' : '10px 0' }}>
      <Avatar emoji={avatarOf(r.sender_id)} name={nameOf(r.sender_id)} size={big ? 40 : 34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sender_id === myId ? 'You' : nameOf(r.sender_id)}</span>
          <span style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>{r.created_at ? fmtHM(new Date(r.created_at)) : ''}</span>
        </div>
        {r.type === 'image' && !parseOnce(r) && !parseBlur(r) && <MediaImg src={r.media_url} alt="" style={{ display: 'block', marginTop: 6, width: 200, maxWidth: '100%', height: 150, borderRadius: 12, objectFit: 'cover' }} />}
        <div style={{ fontSize: big ? 16 : 15, lineHeight: 1.42, color: theme.ink, marginTop: 2, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{bodyOf(r)}</div>
      </div>
    </div>
  );
  const can = !!text.trim() && !busy;
  return (
    <FullPage title="Thread" subtitle={count === 1 ? '1 reply' : `${count} replies`} onBack={onClose} zIndex={75} scrollRef={scrollRef}
      footer={(
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))} placeholder="Reply in thread" aria-label="Reply in thread" rows={1}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !isTouchDevice()) { e.preventDefault(); submit(); } }}
            style={{ flex: 1, minWidth: 0, resize: 'none', maxHeight: 120, minHeight: 40, boxSizing: 'border-box', padding: '10px 14px', borderRadius: 20, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontFamily: FONT, fontSize: 15.5, outline: 'none', lineHeight: 1.35, ...(COMPOSER_AUTOSIZE ? { fieldSizing: 'content' } : {}) }} />
          <div role="button" aria-label="Send reply" onPointerDown={(e) => e.preventDefault()} onClick={submit} style={{ width: 40, height: 40, borderRadius: '50%', background: can ? theme.coral : theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: can ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.15s ease' }}>
            {busy ? <Spinner size={16} color="white" /> : <Send size={17} color={can ? 'white' : theme.muted} style={{ marginLeft: -1 }} />}
          </div>
        </div>
      )}>
      {line(root, true)}
      {onJump && <div role="button" aria-label="Show in chat" onClick={() => onJump(root.id)} style={{ display: 'inline-block', fontSize: 13, fontWeight: 700, color: theme.coral, cursor: 'pointer', padding: '0 0 12px 51px' }}>Show in chat</div>}
      <div style={{ height: 1, background: theme.border }} />
      {rows === null && !count && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color={theme.muted} /></div>}
      {rows !== null && !count && <div style={{ fontSize: 14, color: theme.muted, padding: '18px 0' }}>No replies yet. Start the thread.</div>}
      {merged.map((r) => line(r, false))}
    </FullPage>
  );
}

export function OnceAudioSheet({ m, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const url = useMediaUrl(m.media_url);
  const ref = useRef(null);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !url) return undefined;
    const onTime = () => setPos(el.currentTime || 0);
    const onMeta = () => setDur(Number.isFinite(el.duration) ? el.duration : 0);
    const onEnd = () => { setPlaying(false); setTimeout(onClose, 350); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('ended', onEnd);
    const pr = el.play();
    if (pr && pr.then) pr.then(() => setPlaying(true), () => setPlaying(false)); else setPlaying(true);
    return () => { el.removeEventListener('timeupdate', onTime); el.removeEventListener('loadedmetadata', onMeta); el.removeEventListener('ended', onEnd); try { el.pause(); } catch {} };
  }, [url]);
  const toggle = () => { const el = ref.current; if (!el) return; if (el.paused) { const pr = el.play(); if (pr && pr.catch) pr.catch(() => {}); setPlaying(true); } else { el.pause(); setPlaying(false); } };
  const pct = dur > 0 ? Math.min(100, (pos / dur) * 100) : 0;
  const fmt = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '26px 26px 0 0', padding: '18px 20px calc(22px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div role="button" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle} style={{ width: 56, height: 56, borderRadius: '50%', background: theme.coral, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{playing ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>Voice message</div>
              <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>Plays once. It is gone when it ends.</div>
              <div style={{ height: 5, borderRadius: 3, background: theme.rowBg, marginTop: 10, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: theme.coral, transition: 'width 0.2s linear' }} /></div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{fmt(dur ? Math.max(0, dur - pos) : pos)}</div>
          </div>
          {url && <audio ref={ref} src={url} preload="auto" style={{ display: 'none' }} />}
        </div>
      </div>
    </Portal>
  );
}
function AxCvArt({ mode, dark }) {
  const pick = (fam, base) => (mode === 'off' ? base : axCvColor(mode, fam, dark) || base);
  const ok = pick('ok', '#22C55E');
  const bad = pick('bad', '#EF4444');
  const warn = pick('warn', '#F59E0B');
  const ring = dark ? '#1F1E25' : '#F1F0F6';
  return (
    <div data-cvk="1" aria-hidden="true" style={{ position: 'relative', width: 62, height: 50 }}>
      <span style={{ position: 'absolute', left: 6, top: 4, width: 28, height: 28, borderRadius: 14, background: dark ? '#3A3942' : '#D6D4DE' }} />
      <span style={{ position: 'absolute', left: 25, top: 23, width: 11, height: 11, borderRadius: 6, background: ok, boxShadow: `0 0 0 2px ${ring}` }} />
      <span style={{ position: 'absolute', right: 2, top: 4, minWidth: 18, height: 18, padding: '0 4px', boxSizing: 'border-box', borderRadius: 9, background: bad, color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
      <span style={{ position: 'absolute', left: 6, bottom: 2, width: 24, height: 6, borderRadius: 3, background: ok }} />
      <span style={{ position: 'absolute', left: 33, bottom: 2, width: 14, height: 6, borderRadius: 3, background: warn }} />
      <span style={{ position: 'absolute', left: 50, bottom: 2, width: 10, height: 6, borderRadius: 3, background: bad }} />
    </div>
  );
}
const AX_CV_OPTIONS = [
  ['off', 'Default', 'The usual ZChat colours.'],
  ['rg', 'Red and green', 'For protanopia and deuteranopia. Greens turn blue and reds turn orange across ZChat. Your purple stays the same.'],
  ['by', 'Blue and yellow', 'For tritanopia. Greens turn cyan and yellows turn orange across ZChat. Your purple stays the same.'],
];
export function AccessibilitySection() {
  const { theme, dark } = useTheme();
  const look = useAxLook();
  const [reduce, setReduce] = usePref('zchat-reduce-motion');
  const page = igPalette(theme).bg;
  const cur = AX_CV_OPTIONS.find(([k]) => k === look.cv) || AX_CV_OPTIONS[0];
  const switchRow = (aria, on, flip, title, sub) => (
    <div role="button" aria-label={aria} aria-pressed={!!on} onClick={() => { hapticTap(); playUiSound('toggle'); flip(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '6px 0', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.35 }}>{sub}</div>
      </div>
      <IgToggle on={!!on} />
    </div>
  );
  return (
    <div style={{ paddingBottom: 28 }}>
      <PageArt text="Make ZChat easier to read and easier to tell apart. These choices are kept on this device." />
      <KitSection title="Colour vision" right={cur[1]} style={{ marginTop: 6 }}>
        <PickTiles label="Colour vision" fit size={84} ringBg={page} value={look.cv} onChange={(k) => { playUiSound('tap'); setAxLook({ cv: k }); }}
          options={AX_CV_OPTIONS.map(([k, label]) => ({ k, label, aria: `Colour vision ${label}`, art: <AxCvArt mode={k} dark={dark} /> }))} />
        <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '8px 2px 0', textWrap: 'pretty' }}>{cur[2]}{look.cv === 'off' ? ' Online dots, check marks, badges and right or wrong answers use green, red and yellow.' : ''}</div>
      </KitSection>
      <KitSection title="Text" style={{ marginTop: 26 }}>
        {switchRow('Bold text', look.bold, () => setAxLook({ bold: !look.bold }), 'Bold text', 'Words across ZChat get a little heavier, like bold text on an iPhone. Text size is in Theme.')}
      </KitSection>
      <KitSection title="Motion" style={{ marginTop: 18 }}>
        {switchRow('Reduce motion', reduce, () => setReduce(!reduce), 'Reduce motion', 'Pages fade instead of sliding, and effects, live wallpapers and animated profile pictures stay still')}
      </KitSection>
    </div>
  );
}

const QRD_ECC = [[7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28], [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26], [13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30], [17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28]];
const QRD_BLOCKS = [[1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8], [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16], [1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20], [1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25]];
function qrdMul(a, b) { return a && b ? QRD_EXP[QRD_LOG[a] + QRD_LOG[b]] : 0; }
function qrdDiv(a, b) { return a ? QRD_EXP[(QRD_LOG[a] + 255 - QRD_LOG[b]) % 255] : 0; }
function qrdSyndromes(cw, nsym) {
  const out = new Array(nsym);
  let bad = false;
  for (let i = 0; i < nsym; i++) {
    const a = QRD_EXP[i];
    let v = 0;
    for (let j = 0; j < cw.length; j++) v = qrdMul(v, a) ^ cw[j];
    out[i] = v;
    if (v) bad = true;
  }
  return bad ? out : null;
}
function qrdFix(cw, nsym) {
  const synd = qrdSyndromes(cw, nsym);
  if (!synd) return true;
  let c = [1];
  let b = [1];
  let len = 0;
  let m = 1;
  let last = 1;
  for (let r = 0; r < nsym; r++) {
    let d = synd[r];
    for (let i = 1; i <= len; i++) d ^= qrdMul(c[i] || 0, synd[r - i]);
    if (!d) { m += 1; continue; }
    const t = c.slice();
    const k = qrdDiv(d, last);
    while (c.length < b.length + m) c.push(0);
    for (let i = 0; i < b.length; i++) c[i + m] ^= qrdMul(k, b[i]);
    if (2 * len <= r) { len = r + 1 - len; b = t; last = d; m = 1; } else m += 1;
  }
  while (c.length > 1 && !c[c.length - 1]) c.pop();
  const deg = c.length - 1;
  if (deg !== len || len * 2 > nsym) return false;
  const n = cw.length;
  const pos = [];
  for (let p = 0; p < n; p++) {
    const xi = QRD_EXP[(255 - p) % 255];
    let v = 0;
    for (let i = deg; i >= 0; i--) v = qrdMul(v, xi) ^ c[i];
    if (!v) pos.push(p);
  }
  if (pos.length !== len) return false;
  const om = new Array(nsym).fill(0);
  for (let i = 0; i < nsym; i++) for (let j = 0; j <= deg && i + j < nsym; j++) om[i + j] ^= qrdMul(synd[i], c[j]);
  for (const p of pos) {
    const xi = QRD_EXP[(255 - p) % 255];
    let num = 0;
    for (let i = nsym - 1; i >= 0; i--) num = qrdMul(num, xi) ^ om[i];
    let den = 0;
    for (let i = 1; i <= deg; i += 2) {
      let term = c[i];
      for (let q = 0; q < i - 1; q++) term = qrdMul(term, xi);
      den ^= term;
    }
    if (!den) return false;
    cw[n - 1 - p] ^= qrdMul(QRD_EXP[p], qrdDiv(num, den));
  }
  return !qrdSyndromes(cw, nsym);
}
function qrdFunctionMap(ver) {
  const n = ver * 4 + 17;
  const fn = new Uint8Array(n * n);
  const mark = (x, y) => { if (x >= 0 && y >= 0 && x < n && y < n) fn[y * n + x] = 1; };
  for (let i = 0; i < n; i++) { mark(6, i); mark(i, 6); }
  [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) mark(cx + dx, cy + dy); });
  const al = qrAlignments(ver);
  const last = al.length - 1;
  al.forEach((ax, i) => al.forEach((ay, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) mark(ax + dx, ay + dy);
  }));
  for (let i = 0; i <= 8; i++) { mark(8, i); mark(i, 8); }
  for (let i = 0; i < 8; i++) { mark(n - 1 - i, 8); mark(8, n - 1 - i); }
  if (ver >= 7) for (let i = 0; i < 18; i++) { mark(n - 11 + (i % 3), Math.floor(i / 3)); mark(Math.floor(i / 3), n - 11 + (i % 3)); }
  return fn;
}
function qrdMaskBit(mask, x, y) {
  if (mask === 0) return (x + y) % 2 === 0;
  if (mask === 1) return y % 2 === 0;
  if (mask === 2) return x % 3 === 0;
  if (mask === 3) return (x + y) % 3 === 0;
  if (mask === 4) return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
  if (mask === 5) return ((x * y) % 2) + ((x * y) % 3) === 0;
  if (mask === 6) return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
  return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
}
function qrdNearest(word, valid) {
  let best = -1;
  let bestD = 4;
  valid.forEach(([code, val]) => {
    let d = 0;
    for (let v = code ^ word; v; v &= v - 1) d += 1;
    if (d < bestD) { bestD = d; best = val; }
  });
  return best;
}
const QRD_FORMATS = (() => {
  const out = [];
  for (let d = 0; d < 32; d++) {
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    out.push([((d << 10) | rem) ^ 0x5412, d]);
  }
  return out;
})();
const QRD_VERSIONS = (() => {
  const out = [];
  for (let v = 7; v <= 20; v++) {
    let rem = v;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    out.push([(v << 12) | rem, v]);
  }
  return out;
})();
function qrdBits(get, n) {
  let a = 0;
  let b = 0;
  for (let i = 0; i <= 5; i++) if (get(8, i)) a |= 1 << i;
  if (get(8, 7)) a |= 1 << 6;
  if (get(8, 8)) a |= 1 << 7;
  if (get(7, 8)) a |= 1 << 8;
  for (let i = 9; i < 15; i++) if (get(14 - i, 8)) a |= 1 << i;
  for (let i = 0; i < 8; i++) if (get(n - 1 - i, 8)) b |= 1 << i;
  for (let i = 8; i < 15; i++) if (get(8, n - 15 + i)) b |= 1 << i;
  const fa = qrdNearest(a, QRD_FORMATS);
  return fa >= 0 ? fa : qrdNearest(b, QRD_FORMATS);
}
function qrdText(bytes, ver) {
  let bit = 0;
  const total = bytes.length * 8;
  const read = (k) => {
    let v = 0;
    for (let i = 0; i < k; i++) { v = (v << 1) | ((bytes[bit >>> 3] >>> (7 - (bit & 7))) & 1); bit += 1; }
    return v;
  };
  const AN = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  const band = ver <= 9 ? 0 : ver <= 26 ? 1 : 2;
  const raw = [];
  let out = '';
  const flush = () => { if (raw.length) { try { out += new TextDecoder('utf-8').decode(new Uint8Array(raw)); } catch { out += String.fromCharCode(...raw); } raw.length = 0; } };
  while (bit + 4 <= total) {
    const mode = read(4);
    if (mode === 0) break;
    if (mode === 4) {
      let count = read([8, 16, 16][band]);
      while (count-- > 0 && bit + 8 <= total) raw.push(read(8));
    } else if (mode === 1) {
      flush();
      let count = read([10, 12, 14][band]);
      while (count >= 3) { out += String(read(10)).padStart(3, '0'); count -= 3; }
      if (count === 2) out += String(read(7)).padStart(2, '0'); else if (count === 1) out += String(read(4));
    } else if (mode === 2) {
      flush();
      let count = read([9, 11, 13][band]);
      while (count >= 2) { const v = read(11); out += AN[Math.floor(v / 45)] + AN[v % 45]; count -= 2; }
      if (count === 1) out += AN[read(6)];
    } else if (mode === 7) {
      const first = read(8);
      if ((first & 0xC0) === 0x80) read(8); else if ((first & 0xE0) === 0xC0) read(16);
    } else if (mode === 3) read(16);
    else if (mode === 5 || mode === 9) continue;
    else break;
    if (bit > total) return null;
  }
  flush();
  return out || null;
}
function qrdRead(get, ver) {
  const n = ver * 4 + 17;
  if (ver >= 7) {
    let a = 0;
    for (let i = 0; i < 18; i++) if (get(n - 11 + (i % 3), Math.floor(i / 3))) a |= 1 << i;
    const v = qrdNearest(a, QRD_VERSIONS);
    if (v > 0 && v !== ver) return { ver: v };
  }
  const fmt = qrdBits(get, n);
  if (fmt < 0) return null;
  const level = [1, 0, 3, 2][fmt >> 3];
  const mask = fmt & 7;
  const fn = qrdFunctionMap(ver);
  const rawLen = Math.floor(qrRawModules(ver) / 8);
  const words = new Uint8Array(rawLen);
  let idx = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
        if (fn[y * n + x] || idx >= rawLen * 8) continue;
        if (get(x, y) !== qrdMaskBit(mask, x, y)) words[idx >>> 3] |= 1 << (7 - (idx & 7));
        idx += 1;
      }
    }
  }
  const nb = QRD_BLOCKS[level][ver - 1];
  const ecc = QRD_ECC[level][ver - 1];
  const numShort = nb - (rawLen % nb);
  const shortLen = Math.floor(rawLen / nb);
  const blocks = [];
  for (let i = 0; i < nb; i++) blocks.push(new Array(shortLen + 1).fill(0));
  let k = 0;
  for (let i = 0; i <= shortLen; i++) {
    for (let j = 0; j < nb; j++) {
      if (i === shortLen - ecc && j < numShort) continue;
      if (k < rawLen) blocks[j][i] = words[k++];
    }
  }
  const data = [];
  for (let j = 0; j < nb; j++) {
    const blk = j < numShort ? blocks[j].filter((_, i) => i !== shortLen - ecc) : blocks[j];
    if (!qrdFix(blk, ecc)) return null;
    for (let i = 0; i < blk.length - ecc; i++) data.push(blk[i]);
  }
  const text = qrdText(data, ver);
  return text ? { text } : null;
}
function qrdSolve(src, dst) {
  const m = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = src[i];
    const [x, y] = dst[i];
    m.push([u, v, 1, 0, 0, 0, -u * x, -v * x, x]);
    m.push([0, 0, 0, u, v, 1, -u * y, -v * y, y]);
  }
  for (let c = 0; c < 8; c++) {
    let piv = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(m[r][c]) > Math.abs(m[piv][c])) piv = r;
    if (Math.abs(m[piv][c]) < 1e-9) return null;
    [m[c], m[piv]] = [m[piv], m[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = m[r][c] / m[c][c];
      if (f) for (let q = c; q < 9; q++) m[r][q] -= f * m[c][q];
    }
  }
  const h = m.map((row, i) => row[8] / row[i]);
  return (u, v) => { const w = h[6] * u + h[7] * v + 1; return [(h[0] * u + h[1] * v + h[2]) / w, (h[3] * u + h[4] * v + h[5]) / w]; };
}
function qrdBinarize(gray, w, h) {
  const W = w + 1;
  const integ = new Uint32Array(W * (h + 1));
  let all = 0;
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { const g = gray[y * w + x]; row += g; all += g; integ[(y + 1) * W + x + 1] = integ[y * W + x + 1] + row; }
  }
  const low = (all / (w * h)) * 0.45;
  const r = Math.max(8, Math.floor(Math.max(w, h) / 14));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(h - 1, y + r);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      const cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
      const sum = integ[(y1 + 1) * W + x1 + 1] - integ[y0 * W + x1 + 1] - integ[(y1 + 1) * W + x0] + integ[y0 * W + x0];
      const g = gray[y * w + x];
      out[y * w + x] = g * cnt * 100 < sum * 88 || g < low ? 1 : 0;
    }
  }
  return out;
}
function qrdFinders(bin, w, h) {
  const at = (x, y) => bin[y * w + x] === 1;
  const ok = (s) => {
    const total = s[0] + s[1] + s[2] + s[3] + s[4];
    if (total < 7) return false;
    const u = total / 7;
    const tol = u * 0.75;
    return Math.abs(u - s[0]) < tol && Math.abs(u - s[1]) < tol && Math.abs(3 * u - s[2]) < 3 * tol && Math.abs(u - s[3]) < tol && Math.abs(u - s[4]) < tol;
  };
  const cross = (cx, cy, dx, dy, maxRun) => {
    const s = [0, 0, 0, 0, 0];
    const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
    let x = cx;
    let y = cy;
    while (inside(x, y) && at(x, y)) { s[2] += 1; x -= dx; y -= dy; }
    while (inside(x, y) && !at(x, y) && s[1] <= maxRun) { s[1] += 1; x -= dx; y -= dy; }
    while (inside(x, y) && at(x, y) && s[0] <= maxRun) { s[0] += 1; x -= dx; y -= dy; }
    x = cx + dx;
    y = cy + dy;
    while (inside(x, y) && at(x, y)) { s[2] += 1; x += dx; y += dy; }
    const endCenter = dx ? x : y;
    while (inside(x, y) && !at(x, y) && s[3] <= maxRun) { s[3] += 1; x += dx; y += dy; }
    while (inside(x, y) && at(x, y) && s[4] <= maxRun) { s[4] += 1; x += dx; y += dy; }
    if (!ok(s)) return null;
    return { c: endCenter - s[2] / 2, total: s[0] + s[1] + s[2] + s[3] + s[4] };
  };
  const found = [];
  const add = (x, y, ms) => {
    for (const f of found) {
      if (Math.abs(f.x - x) <= ms * 2 && Math.abs(f.y - y) <= ms * 2 && Math.abs(f.ms - ms) <= Math.max(1.5, f.ms * 0.5)) {
        f.x = (f.x * f.n + x) / (f.n + 1); f.y = (f.y * f.n + y) / (f.n + 1); f.ms = (f.ms * f.n + ms) / (f.n + 1); f.n += 1;
        return;
      }
    }
    found.push({ x, y, ms, n: 1 });
  };
  const step = Math.max(1, Math.floor(h / 360));
  for (let y = 0; y < h; y += step) {
    const s = [0, 0, 0, 0, 0];
    let st = 0;
    for (let x = 0; x <= w; x++) {
      const dark = x < w && at(x, y);
      if (dark) {
        if (st & 1) st += 1;
        s[st] += 1;
      } else if (!(st & 1)) {
        if (st === 4) {
          if (ok(s)) {
            const cx = Math.floor(x - s[4] - s[3] - s[2] / 2);
            const v = cross(cx, y, 0, 1, s[2] * 2);
            if (v) {
              const hz = cross(cx, Math.floor(v.c), 1, 0, s[2] * 2);
              if (hz) { const vv = cross(Math.floor(hz.c), Math.floor(v.c), 0, 1, s[2] * 2); if (vv) add(hz.c, vv.c, (hz.total + vv.total) / 14); }
            }
          }
          s[0] = s[2]; s[1] = s[3]; s[2] = s[4]; s[3] = 1; s[4] = 0; st = 3;
        } else { st += 1; s[st] += 1; }
      } else s[st] += 1;
    }
  }
  return found;
}
function qrdTriples(found) {
  const list = found.filter((f) => f.n >= 2).sort((a, b) => b.n - a.n).slice(0, 8);
  const out = [];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      for (let k = j + 1; k < list.length; k++) {
        const p = [list[i], list[j], list[k]];
        const msMin = Math.min(p[0].ms, p[1].ms, p[2].ms);
        const msMax = Math.max(p[0].ms, p[1].ms, p[2].ms);
        if (msMax > msMin * 1.6) continue;
        const d = [[dist(p[1], p[2]), 0], [dist(p[0], p[2]), 1], [dist(p[0], p[1]), 2]].sort((a, b) => b[0] - a[0]);
        const tl = p[d[0][1]];
        const others = p.filter((_, q) => q !== d[0][1]);
        const l1 = dist(tl, others[0]);
        const l2 = dist(tl, others[1]);
        if (Math.min(l1, l2) < msMin * 7 || Math.max(l1, l2) > Math.min(l1, l2) * 1.4) continue;
        const hyp = Math.hypot(l1, l2);
        const err = Math.abs(d[0][0] - hyp) / hyp + Math.abs(l1 - l2) / Math.max(l1, l2);
        if (err > 0.35) continue;
        const crossZ = (others[0].x - tl.x) * (others[1].y - tl.y) - (others[0].y - tl.y) * (others[1].x - tl.x);
        const [tr, bl] = crossZ > 0 ? [others[0], others[1]] : [others[1], others[0]];
        const ang = Math.atan2(tr.y - tl.y, tr.x - tl.x);
        out.push({ tl, tr, bl, ms: ((p[0].ms + p[1].ms + p[2].ms) / 3) * Math.max(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang))), err });
      }
    }
  }
  return out.sort((a, b) => a.err - b.err).slice(0, 3);
}
function qrdAlign(bin, w, h, ex, ey, ms) {
  const at = (x, y) => { const xi = Math.round(x); const yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < w && yi < h && bin[yi * w + xi] === 1; };
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  let best = null;
  const rad = Math.max(4, Math.round(ms * 4));
  const step = Math.max(1, Math.round(ms / 3));
  for (let y = ey - rad; y <= ey + rad; y += step) {
    for (let x = ex - rad; x <= ex + rad; x += step) {
      if (!at(x, y)) continue;
      let score = 1;
      dirs.forEach(([dx, dy]) => { if (!at(x + dx * ms, y + dy * ms)) score += 1; const r2 = Math.abs(dx) === 1 || Math.abs(dy) === 1 ? 2 : 2.83; if (at(x + dx * ms * r2, y + dy * ms * r2)) score += 1; });
      const far = Math.hypot(x - ex, y - ey);
      if (!best || score > best.score || (score === best.score && far < best.far)) best = { x, y, score, far };
    }
  }
  return best && best.score >= 15 ? best : null;
}
function qrdGrid(bin, w, h, t, ver) {
  const n = ver * 4 + 17;
  const src = [[3.5, 3.5], [n - 3.5, 3.5], [3.5, n - 3.5]];
  const dst = [[t.tl.x, t.tl.y], [t.tr.x, t.tr.y], [t.bl.x, t.bl.y]];
  let fourth = null;
  if (ver >= 2) {
    const affine = (u, v) => [t.tl.x + ((u - 3.5) / (n - 7)) * (t.tr.x - t.tl.x) + ((v - 3.5) / (n - 7)) * (t.bl.x - t.tl.x), t.tl.y + ((u - 3.5) / (n - 7)) * (t.tr.y - t.tl.y) + ((v - 3.5) / (n - 7)) * (t.bl.y - t.tl.y)];
    const [ex, ey] = affine(n - 6.5, n - 6.5);
    const a = qrdAlign(bin, w, h, Math.round(ex), Math.round(ey), t.ms);
    fourth = [[n - 6.5, n - 6.5], a ? [a.x + 0.5, a.y + 0.5] : [ex, ey]];
  } else {
    fourth = [[n - 3.5, n - 3.5], [t.tr.x + t.bl.x - t.tl.x, t.tr.y + t.bl.y - t.tl.y]];
  }
  const map = qrdSolve([...src, fourth[0]], [...dst, fourth[1]]);
  if (!map) return null;
  const cells = new Uint8Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const [px, py] = map(x + 0.5, y + 0.5);
      const xi = Math.floor(px);
      const yi = Math.floor(py);
      cells[y * n + x] = xi >= 0 && yi >= 0 && xi < w && yi < h ? bin[yi * w + xi] : 0;
    }
  }
  return (x, y) => cells[y * n + x] === 1;
}
function qrDecodeImage(img) {
  try {
    const { data, width: w, height: h } = img;
    const gray = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < gray.length; i++, j += 4) gray[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
    for (let pass = 0; pass < 2; pass++) {
      if (pass) for (let i = 0; i < gray.length; i++) gray[i] = 255 - gray[i];
      const bin = qrdBinarize(gray, w, h);
      const triples = qrdTriples(qrdFinders(bin, w, h));
      for (const t of triples) {
        const side = (Math.hypot(t.tr.x - t.tl.x, t.tr.y - t.tl.y) + Math.hypot(t.bl.x - t.tl.x, t.bl.y - t.tl.y)) / 2;
        const guess = Math.round((side / t.ms + 7 - 17) / 4);
        const tried = new Set();
        const order = [guess, guess + 1, guess - 1];
        for (let i = 0; i < order.length; i++) {
          const ver = order[i];
          if (ver < 1 || ver > 20 || tried.has(ver)) continue;
          tried.add(ver);
          const get = qrdGrid(bin, w, h, t, ver);
          const res = get ? qrdRead(get, ver) : null;
          if (res && res.text) return res.text;
          if (res && res.ver && !tried.has(res.ver)) order.push(res.ver);
        }
      }
    }
  } catch {}
  return null;
}

export function QrScanPage({ onClose, onFound, onLogin, mode }) {
  useBackClose(true, onClose);
  const videoRef = useRef(null);
  const [msg, setMsg] = useState('');
  const supported = typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const loginMode = mode === 'login';
  useEffect(() => {
    if (!supported) return undefined;
    let stream = null;
    let stop = false;
    let timer = null;
    const handle = (text) => {
      const qr = parseQrLoginLink(text);
      if (qr) { stop = true; hapticTap(); playUiSound('point'); (onLogin || qrLoginOpen)(qr); return true; }
      const id = !loginMode && onFound ? parseProfileLink(text) : null;
      if (id) { stop = true; hapticTap(); playUiSound('point'); onFound(id); return true; }
      setMsg(loginMode ? 'That is not a ZChat code. Scan the code on the computer screen.' : 'That code is not a ZChat profile');
      return false;
    };
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (v) { v.srcObject = stream; v.play().catch(() => {}); }
        let det = null;
        try { if ('BarcodeDetector' in window) det = new window.BarcodeDetector({ formats: ['qr_code'] }); } catch { det = null; }
        const canvas = det ? null : document.createElement('canvas');
        const tick = async () => {
          if (stop) return;
          try {
            const vv = videoRef.current;
            if (vv && vv.readyState >= 2) {
              if (det) {
                const codes = await det.detect(vv);
                const hit = (codes || []).find((c) => c && c.rawValue);
                if (hit && handle(hit.rawValue)) return;
              } else if (vv.videoWidth && canvas) {
                const k = Math.min(1, 640 / Math.max(vv.videoWidth, vv.videoHeight));
                canvas.width = Math.round(vv.videoWidth * k);
                canvas.height = Math.round(vv.videoHeight * k);
                const g = canvas.getContext('2d', { willReadFrequently: true });
                g.drawImage(vv, 0, 0, canvas.width, canvas.height);
                const text = qrDecodeImage(g.getImageData(0, 0, canvas.width, canvas.height));
                if (text && handle(text)) return;
              }
            }
          } catch {}
          timer = setTimeout(tick, det ? 280 : 220);
        };
        tick();
      } catch { setMsg('Allow camera access to scan codes'); }
    })();
    return () => { stop = true; clearTimeout(timer); if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);
  const corner = (pos) => <span style={{ position: 'absolute', width: 34, height: 34, borderColor: 'white', borderStyle: 'solid', borderWidth: 0, ...pos }} />;
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: '#000', color: 'white', fontFamily: FONT }}>
        {supported && <video ref={videoRef} playsInline muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <ViewerTopBar onClose={onClose} title={loginMode ? 'Scan the computer code' : 'Scan a QR code'} />
        <div style={{ position: 'absolute', left: '50%', top: '45%', width: 240, height: 240, transform: 'translate(-50%, -50%)', borderRadius: 24, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' }}>
          {corner({ left: 0, top: 0, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 22 })}
          {corner({ right: 0, top: 0, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 22 })}
          {corner({ left: 0, bottom: 0, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 22 })}
          {corner({ right: 0, bottom: 0, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 22 })}
        </div>
        <div style={{ position: 'absolute', left: 24, right: 24, bottom: 'calc(48px + env(safe-area-inset-bottom))', textAlign: 'center', fontSize: 15, fontWeight: 600, lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
          {supported ? (msg || (loginMode ? 'Point your camera at the code on the computer screen' : 'Point your camera at a ZChat profile code')) : 'This browser cannot scan codes. Open your phone camera and point it at the code. It opens ZChat for you.'}
        </div>
      </div>
    </Portal>
  );
}
function useSavedFolders(uid) {
  const [list, setList] = useState(() => savedFoldersOf(uid));
  useEffect(() => {
    const on = () => setList(savedFoldersMem.get(uid) || []);
    window.addEventListener('zchat-saved-folders', on);
    loadSavedFolders(uid);
    return () => window.removeEventListener('zchat-saved-folders', on);
  }, [uid]);
  return list;
}
function createSavedFolder(uid, name) {
  const clean = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const cur = savedFoldersOf(uid) || [];
  if (!clean) return { error: 'Give the folder a name' };
  if (cur.some((f) => f.name.toLowerCase() === clean.toLowerCase())) return { error: 'You already have a folder with that name' };
  if (cur.length >= 50) return { error: 'You can have up to 50 folders' };
  const temp = { id: `temp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: clean, created_at: new Date().toISOString() };
  putSavedFolders(uid, [...cur, temp]);
  const job = Promise.resolve(supabase.from('zchat_saved_folders').insert({ user_id: uid, name: clean }).select('id, name, created_at').single()).then(({ data, error }) => {
    savedFolderPending.delete(temp.id);
    if (error || !data) { putSavedFolders(uid, (savedFoldersMem.get(uid) || []).filter((f) => f.id !== temp.id)); appSnack(savedFolderErr(error)); return null; }
    putSavedFolders(uid, (savedFoldersMem.get(uid) || []).map((f) => (f.id === temp.id ? data : f)));
    try { window.dispatchEvent(new CustomEvent('zchat-saved-folder-real', { detail: { temp: temp.id, id: data.id } })); } catch {}
    return data.id;
  }, () => { savedFolderPending.delete(temp.id); putSavedFolders(uid, (savedFoldersMem.get(uid) || []).filter((f) => f.id !== temp.id)); return null; });
  savedFolderPending.set(temp.id, job);
  return { folder: temp };
}
function FolderNameSheet({ title, initial, cta, onSave, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [name, setName] = useState(initial || '');
  const ok = name.trim().length > 0;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 260, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '10px 18px calc(18px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink, textAlign: 'center', marginBottom: 14 }}>{title}</div>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} onKeyDown={(e) => { if (e.key === 'Enter' && ok) onSave(name.trim()); }} placeholder="Recipes, Funny, Work" aria-label="Folder name" enterKeyHint="done" autoCapitalize="sentences"
            style={{ ...inputStyle(theme), fontSize: 15.5 }} />
          <div style={{ marginTop: 14 }}><BigButton label={cta || 'Save'} disabled={!ok} onClick={() => { if (ok) onSave(name.trim()); }} /></div>
        </div>
      </div>
    </Portal>
  );
}
export function SaveToSheet({ uid, current, title, onPick, onClose }) {
  const { theme } = useTheme();
  const folders = useSavedFolders(uid) || [];
  const [naming, setNaming] = useState(false);
  const tick = (on) => (on ? <Check size={18} color={theme.coral} strokeWidth={2.6} /> : null);
  if (naming) {
    return (
      <FolderNameSheet title="New folder" cta="Create and save" onClose={() => setNaming(false)}
        onSave={(n) => { const r = createSavedFolder(uid, n); if (r.error) { appSnack(r.error); return; } hapticTap(); onPick(r.folder.id, r.folder.name); }} />
    );
  }
  return (
    <ChatRowSheet title={title || 'Save to'} subtitle={folders.length ? 'Pick a folder' : 'Make a folder to keep things together'} onClose={onClose} zIndex={250} portal
      actions={[
        { icon: <Bookmark size={18} />, label: 'All saved', hint: 'No folder', right: tick(current !== undefined && !current), onClick: () => onPick(null, null) },
        ...folders.map((f) => ({ icon: <FolderIcon size={18} />, label: f.name, right: tick(current === f.id), onClick: () => onPick(f.id, f.name) })),
        folders.length < 50 ? { icon: <Plus size={18} />, label: 'New folder', keepOpen: true, onClick: () => setNaming(true) } : null,
      ]} />
  );
}
export function savedPing(uid) { try { window.dispatchEvent(new CustomEvent('zchat-saved-changed', { detail: uid })); } catch {} }
function savedTimeline(list) {
  const asc = list.slice().sort((x, y) => String(x.created_at || '').localeCompare(String(y.created_at || '')));
  const out = [];
  let last = '';
  const now = new Date();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  asc.forEach((r) => {
    const d = new Date(r.created_at || Date.now());
    const k = d.toDateString();
    if (k !== last) {
      last = k;
      const day = k === now.toDateString() ? 'Today' : k === yest.toDateString() ? 'Yesterday' : fmtDate(d, d.getFullYear() === now.getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
      out.push({ day, key: `d${k}` });
    }
    out.push({ r });
  });
  return out;
}
function SavedBubble({ r, onOpenMedia, onMenu, onOpenChat }) {
  const { theme } = useTheme();
  const hold = useRef({ t: 0 });
  const stop = () => clearTimeout(hold.current.t);
  const fwd = r.kind !== 'note' && r.kind !== 'file' && r.from_name && !(r.chat_label === 'Note to self');
  const file = (r.kind === 'file' || (r.content && String(r.content).indexOf('zfile:') === 0)) ? (jsonAfter(r.content, 'zfile:') || {}) : null;
  const pending = String(r.id).startsWith('temp-');
  const media = r.media_url && (r.kind === 'image' || r.kind === 'video' || r.kind === 'sticker' || r.kind === 'audio');
  const text = !file && r.kind !== 'sticker' && r.content ? r.content : '';
  const when = r.created_at ? fmtHM(new Date(r.created_at)) : '';
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '84%', margin: '3px 0', WebkitTouchCallout: 'none' }}
      onPointerDown={(e) => { if (e.target.closest && e.target.closest('a, video, audio')) return; stop(); hold.current.t = setTimeout(() => { hapticTap(); onMenu(); }, 460); }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop} onPointerMove={(e) => { if (Math.abs(e.movementY || 0) > 3) stop(); }}
      onContextMenu={(e) => { if (e.target.closest && e.target.closest('a, video, audio')) return; e.preventDefault(); stop(); onMenu(); }}>
      <div style={{ borderRadius: 18, borderBottomRightRadius: 6, background: r.kind === 'sticker' ? 'transparent' : theme.bubbleMe, color: theme.ink, padding: r.kind === 'sticker' ? 0 : media && !text ? 4 : '8px 12px 6px', overflow: 'hidden', opacity: pending ? 0.7 : 1 }}>
        {fwd && (
          <div role={onOpenChat ? 'button' : undefined} onClick={onOpenChat || undefined} style={{ fontSize: 12.5, fontWeight: 700, color: kitOnInk(theme), padding: media && !text ? '4px 8px 6px' : '0 0 4px', cursor: onOpenChat ? 'pointer' : 'default', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {`From ${r.from_name}${r.chat_label && r.chat_label !== r.from_name ? `, ${r.chat_label}` : ''}`}
          </div>
        )}
        {r.kind === 'image' && r.media_url && <MediaImg src={r.media_url} onClick={() => onOpenMedia(r.media_url)} style={{ width: '100%', maxWidth: 280, maxHeight: 320, objectFit: 'cover', borderRadius: 14, cursor: 'pointer', display: 'block' }} />}
        {r.kind === 'video' && r.media_url && <MediaVideo src={r.media_url} controls playsInline preload="metadata" style={{ width: '100%', maxWidth: 280, maxHeight: 320, borderRadius: 14, background: '#000', display: 'block' }} />}
        {r.kind === 'audio' && r.media_url && <MediaAudio src={r.media_url} controls preload="none" style={{ width: 240, maxWidth: '100%' }} />}
        {r.kind === 'sticker' && r.content && <img src={r.content} alt="" style={{ width: 120, height: 120, objectFit: 'contain', display: 'block' }} />}
        {file && (
          <a href={r.media_url || undefined} target="_blank" rel="noopener noreferrer" onClick={(e) => { if (!r.media_url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: theme.ink, minWidth: 180 }}>
            <span style={{ width: 40, height: 40, borderRadius: 12, background: SAVED_BLUE, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={20} /></span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 650, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.n || 'File'}</span>
              {file.s ? <span style={{ display: 'block', fontSize: 12, color: theme.muted }}>{formatBytes(file.s)}</span> : null}
            </span>
          </a>
        )}
        {text && <div style={{ fontSize: 15.5, lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: media ? '6px 8px 0' : 0 }}><RichText text={text} /></div>}
        {r.kind !== 'sticker' && <div style={{ fontSize: 11, color: theme.muted, textAlign: 'right', marginTop: 2, padding: media && !text ? '0 6px 2px' : 0 }}>{pending ? 'Saving' : when}</div>}
      </div>
    </div>
  );
}
export function SavedMessagesPanel({ myId, me, onClose, onChanged, onOpenChat }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const [savedTab, setSavedTab] = useState('messages');
  const [rows, setRows] = useState(() => savedMessagesMem.get(myId) || null);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const savedGoneRef = useRef(new Set());
  const rowsNowRef = useRef(rows);
  rowsNowRef.current = rows;
  const savedAddedRef = useRef(new Set());
  const folders = useSavedFolders(myId) || [];
  const [folder, setFolder] = useState('all');
  const [rowMenu, setRowMenu] = useState(null);
  const [moveFor, setMoveFor] = useState(null);
  const [folderMenu, setFolderMenu] = useState(null);
  const [naming, setNaming] = useState(null);
  const [delAsk, setDelAsk] = useState(null);
  const [searchOn, setSearchOn] = useState(false);
  const savedScrollRef = useRef(null);
  const holdRef = useRef({ t: 0, fired: false });
  const toBottom = (smooth) => requestAnimationFrame(() => { const el = savedScrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight + 999, behavior: smooth ? 'smooth' : 'auto' }); });
  const lastCount = useRef(-1);
  useLayoutEffect(() => {
    const n = rows ? rows.length : -1;
    if (n !== lastCount.current) { const first = lastCount.current < 1; lastCount.current = n; toBottom(!first); }
  }, [rows, savedTab, folder]);
  useEffect(() => { if (folder !== 'all' && !folders.some((f) => f.id === folder)) setFolder('all'); }, [folders, folder]);
  useEffect(() => {
    const on = (e) => {
      const d = e && e.detail;
      if (!d) return;
      setRows((prev) => (prev && prev.some((r) => r.folder_id === d.temp) ? prev.map((r) => (r.folder_id === d.temp ? { ...r, folder_id: d.id } : r)) : prev));
      setFolder((cur) => (cur === d.temp ? d.id : cur));
    };
    window.addEventListener('zchat-saved-folder-real', on);
    return () => window.removeEventListener('zchat-saved-folder-real', on);
  }, []);
  const moveRow = async (row, fid) => {
    if (!row || String(row.id).startsWith('temp-')) return;
    const before = row.folder_id || null;
    if ((fid || null) === before) return;
    hapticTap();
    setRows((prev) => (prev || []).map((r) => (r.id === row.id ? { ...r, folder_id: fid || null } : r)));
    const real = await realFolderId(fid);
    if (fid && !real) { setRows((prev) => (prev || []).map((r) => (r.id === row.id ? { ...r, folder_id: before } : r))); return; }
    const { error } = await supabase.from('saved_messages').update({ folder_id: real || null }).eq('id', row.id).eq('user_id', myId);
    if (error) { setRows((prev) => (prev || []).map((r) => (r.id === row.id ? { ...r, folder_id: before } : r))); setProblem(savedFolderErr(error)); return; }
    const f = folders.find((x) => x.id === fid || x.id === real);
    appSnack(fid ? `Moved to ${f ? f.name : 'the folder'}` : 'Moved back to All');
  };
  const renameFolder = async (f, name) => {
    const clean = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!clean || clean === f.name) return;
    if (folders.some((x) => x.id !== f.id && x.name.toLowerCase() === clean.toLowerCase())) { setProblem('You already have a folder with that name'); return; }
    const list = savedFoldersOf(myId) || [];
    putSavedFolders(myId, list.map((x) => (x.id === f.id ? { ...x, name: clean } : x)));
    const real = await realFolderId(f.id);
    const { error } = real ? await supabase.from('zchat_saved_folders').update({ name: clean }).eq('id', real).eq('user_id', myId) : { error: { message: 'gone' } };
    if (error) { putSavedFolders(myId, (savedFoldersMem.get(myId) || []).map((x) => (x.id === f.id || x.id === real ? { ...x, name: f.name } : x))); setProblem(savedFolderErr(error)); }
  };
  const deleteFolder = async (f) => {
    const list = savedFoldersOf(myId) || [];
    const inIt = new Set((rows || []).filter((r) => r.folder_id === f.id).map((r) => r.id));
    putSavedFolders(myId, list.filter((x) => x.id !== f.id));
    setRows((prev) => (prev || []).map((r) => (inIt.has(r.id) ? { ...r, folder_id: null } : r)));
    setFolder('all');
    hapticTap();
    const real = await realFolderId(f.id);
    if (!real) return;
    const { error } = await supabase.from('zchat_saved_folders').delete().eq('id', real).eq('user_id', myId);
    if (error) {
      putSavedFolders(myId, [...(savedFoldersMem.get(myId) || []), f].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))));
      setRows((prev) => (prev || []).map((r) => (inIt.has(r.id) ? { ...r, folder_id: f.id } : r)));
      setProblem(savedFolderErr(error));
    }
  };
  useEffect(() => { if (rows) savedMessagesMem.set(myId, rows.filter((r) => !String(r.id).startsWith('temp-'))); }, [rows]);
  const load = async () => {
    const { data, error } = await supabase.from('saved_messages').select('*').eq('user_id', myId).order('created_at', { ascending: false }).limit(300);
    if (error) { setProblem(friendlyError(error, "Couldn't load saved messages.")); setRows((prev) => prev || []); return; }
    setProblem('');
    const fresh = (data || []).filter((r) => !savedGoneRef.current.has(r.id));
    const temps = (rowsNowRef.current || []).filter((r) => String(r.id).startsWith('temp-'));
    const mine = (rowsNowRef.current || []).filter((r) => savedAddedRef.current.has(r.id) && !fresh.some((f) => f.id === r.id) && !savedGoneRef.current.has(r.id));
    setRows([...temps, ...mine, ...fresh]);
  };
  useEffect(() => { load(); }, []);
  const addNote = async () => {
    const text = note.trim();
    if (!text) return;
    const into = folder !== 'all' ? folder : null;
    const temp = { id: `temp-${Date.now()}`, user_id: myId, kind: 'note', content: text.slice(0, 2000), from_name: 'You', chat_label: 'Note to self', created_at: new Date().toISOString(), folder_id: into };
    setProblem('');
    setNote('');
    rowsNowRef.current = [temp, ...(rowsNowRef.current || [])];
    setRows((prev) => [temp, ...(prev || [])]);
    hapticTap();
    const realInto = into ? await realFolderId(into) : null;
    const { data, error } = await supabase.from('saved_messages').insert({ user_id: myId, kind: 'note', content: text.slice(0, 2000), from_name: 'You', chat_label: 'Note to self', ...(realInto ? { folder_id: realInto } : {}) }).select().single();
    if (error || !data) {
      rowsNowRef.current = (rowsNowRef.current || []).filter((r) => r.id !== temp.id);
      setRows((prev) => (prev || []).filter((r) => r.id !== temp.id));
      setNote((cur) => cur || text);
      setProblem(friendlyError(error, "Couldn't save that note. Try again."));
      return;
    }
    savedAddedRef.current.add(data.id);
    rowsNowRef.current = (rowsNowRef.current || []).map((r) => (r.id === temp.id ? data : r));
    setRows((prev) => (prev || []).map((r) => (r.id === temp.id ? data : r)));
    savedMessagesMem.set(myId, [data, ...(savedMessagesMem.get(myId) || []).filter((r) => r.id !== data.id)]);
    savedPing(myId);
  };
  const addFiles = async (files) => {
    const into = folder !== 'all' ? folder : null;
    const list = files.filter((f) => f && f.size <= 50 * 1024 * 1024).slice(0, 10);
    if (list.length < files.length) appSnack('Files over 50 MB were skipped');
    const realInto = into ? await realFolderId(into) : null;
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      const t = String(f.type || '').toLowerCase();
      const kind = t.indexOf('image/') === 0 && !/svg/.test(t) ? 'image' : t.indexOf('video/') === 0 ? 'video' : t.indexOf('audio/') === 0 ? 'audio' : 'file';
      const content = kind === 'file' ? `zfile:${JSON.stringify({ n: String(f.name || 'File').slice(0, 120), s: f.size || 0, m: t.slice(0, 80) })}` : null;
      let local = null;
      try { local = URL.createObjectURL(f); } catch {}
      const temp = { id: `temp-${Date.now()}-${i}`, user_id: myId, kind, content, media_url: kind === 'file' ? null : local, from_name: 'You', chat_label: 'Note to self', created_at: new Date().toISOString(), folder_id: into };
      rowsNowRef.current = [temp, ...(rowsNowRef.current || [])];
      setRows((prev) => [temp, ...(prev || [])]);
      const up = await uploadMedia(f, myId);
      if (!up || up.error || !up.url) {
        rowsNowRef.current = (rowsNowRef.current || []).filter((r) => r.id !== temp.id);
        setRows((prev) => (prev || []).filter((r) => r.id !== temp.id));
        setProblem(friendlyError(up && up.error, `${String(f.name || 'That file').slice(0, 40)} could not be uploaded. Try again.`));
        continue;
      }
      const { data, error } = await supabase.from('saved_messages').insert({ user_id: myId, kind, content, media_url: up.url, from_name: 'You', chat_label: 'Note to self', ...(realInto ? { folder_id: realInto } : {}) }).select().single();
      if (error || !data) {
        rowsNowRef.current = (rowsNowRef.current || []).filter((r) => r.id !== temp.id);
        setRows((prev) => (prev || []).filter((r) => r.id !== temp.id));
        setProblem(friendlyError(error, "Couldn't save that. Try again."));
        continue;
      }
      savedAddedRef.current.add(data.id);
      rowsNowRef.current = (rowsNowRef.current || []).map((r) => (r.id === temp.id ? data : r));
      setRows((prev) => (prev || []).map((r) => (r.id === temp.id ? data : r)));
      if (local) setTimeout(() => { try { URL.revokeObjectURL(local); } catch {} }, 8000);
      savedPing(myId);
    }
  };
  const remove = async (row) => {
    if (String(row.id).startsWith('temp-')) return;
    savedGoneRef.current.add(row.id);
    setRows((prev) => (prev || []).filter((r) => r.id !== row.id));
    const { error } = await supabase.from('saved_messages').delete().eq('id', row.id).eq('user_id', myId);
    if (error) { savedGoneRef.current.delete(row.id); setProblem(friendlyError(error, "Couldn't remove that. Try again.")); load(); return; }
    if (onChanged && row.source_message_id) onChanged(row.source_message_id, false);
    savedPing(myId);
  };
  const term = q.trim().toLowerCase();
  const inFolder = (r) => folder === 'all' || r.folder_id === folder;
  const shown = (rows || []).filter((r) => inFolder(r) && (!term || (r.content || '').toLowerCase().includes(term) || (r.from_name || '').toLowerCase().includes(term) || (r.chat_label || '').toLowerCase().includes(term)));
  const curFolder = folder !== 'all' ? folders.find((f) => f.id === folder) : null;
  const stopHold = () => clearTimeout(holdRef.current.t);
  return (
    <>
    <WideDim onClose={onClose} z={40} />
    <div {...edgeBack} style={{ position: 'fixed', inset: 0, zIndex: 40, background: theme.bgGradient, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Saved Messages" onBack={onClose} right={savedTab === 'messages' ? <div role="button" aria-label={searchOn ? 'Close search' : 'Search saved messages'} onClick={() => { hapticTap(); setSearchOn((v) => !v); if (searchOn) setQ(''); }} className="zchat-press" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}>{searchOn ? <X size={21} /> : <Search size={21} />}</div> : null} />
      <LineTabs fill kind="button" value={savedTab} onChange={(k) => { if (k !== savedTab) { hapticTap(); setSavedTab(k); } }} h={44} fs={15} style={{ marginBottom: 10 }}
        tabs={[['messages', 'Messages'], ['posts', 'Posts']].map(([k, label]) => ({ k, label, aria: `Saved ${label.toLowerCase()}` }))} />
      {savedTab === 'posts' ? (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px calc(16px + env(safe-area-inset-bottom))' }}><SavedPostsGrid me={me} myId={myId} /></div>
      ) : (
      <>
      {searchOn && (
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search saved messages" aria-label="Search saved messages" style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
          </div>
        </div>
      )}
      <LineTabs kind="button" label="Saved folders" value={folder} h={40} fs={14.5} inset={6} style={{ marginBottom: 6 }}
        onChange={(k) => { if (k !== folder) { playUiSound('tap'); setFolder(k); } }}
        tabs={[{ k: 'all', label: 'All' }, ...folders.map((f) => {
          const n = (rows || []).filter((r) => r.folder_id === f.id).length;
          return { k: f.id, label: f.name, meta: n || '', end: folder === f.id ? <span role="button" aria-label={`Edit folder ${f.name}`} onClick={(e) => { e.stopPropagation(); setFolderMenu(f); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, margin: '-6px -8px -6px -3px', color: theme.muted, cursor: 'pointer' }}><Pencil size={13} strokeWidth={2.1} /></span> : null };
        })]}
        after={folders.length < 50 ? <div role="button" aria-label="New folder" onClick={() => { playUiSound('tap'); setNaming({ mode: 'new' }); }} className="zchat-press" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, marginLeft: 2, cursor: 'pointer', color: theme.muted, WebkitTapHighlightColor: 'transparent' }}><Plus size={19} strokeWidth={2} /></div> : null} />
      <div ref={savedScrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '4px 12px 8px', display: 'flex', flexDirection: 'column' }}>
        {problem && <div style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>{problem}</div>}
        {rows === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
        ) : shown.length === 0 ? (
          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 18px' }}>
            <span style={{ width: 76, height: 76, borderRadius: '50%', background: SAVED_BLUE, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Bookmark size={34} fill="#FFFFFF" /></span>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink, marginTop: 14 }}>{term ? 'Nothing found' : curFolder ? `Nothing in ${curFolder.name} yet` : 'Your Saved Messages'}</div>
            <div style={{ fontSize: 14, color: theme.muted, marginTop: 6, lineHeight: 1.5, maxWidth: 300 }}>{term ? 'Try a different word.' : 'Send yourself notes, photos, videos and files. Press and hold any message in a chat and tap Save to keep it here.'}</div>
          </div>
        ) : savedTimeline(shown).map((it) => it.day ? (
          <div key={it.key} style={{ alignSelf: 'center', margin: '10px 0 6px', padding: '4px 11px', borderRadius: 999, background: theme.soft, color: theme.muted, fontSize: 12, fontWeight: 700 }}>{it.day}</div>
        ) : (
          <SavedBubble key={it.r.id} r={it.r} onOpenMedia={(u) => setLightbox(u)} onMenu={() => setRowMenu(it.r)} onOpenChat={onOpenChat && (it.r.dm_user_id || it.r.group_id) ? () => onOpenChat(it.r) : null} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '8px 10px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom))', borderTop: `0.5px solid ${theme.hair}` }}>
        <label aria-label="Add a photo, video or file" className="zchat-press" style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer', flexShrink: 0 }}>
          <Paperclip size={21} />
          <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" style={{ display: 'none' }} onChange={(e) => { const fs = [...(e.target.files || [])]; e.target.value = ''; if (fs.length) addFiles(fs); }} />
        </label>
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 2000))} rows={1} placeholder="Message" aria-label="Write a note to yourself"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isTouchDevice()) { e.preventDefault(); addNote(); } }}
          style={{ ...inputStyle(theme), flex: 1, resize: 'none', maxHeight: 110, padding: '11px 14px', fontSize: 15, borderRadius: 21 }} />
        <div role="button" aria-label="Send to Saved Messages" onClick={addNote} className="zchat-press" style={{ width: 42, height: 42, borderRadius: '50%', background: note.trim() ? theme.coral : theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: note.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
          {busy ? <Spinner size={16} /> : <Send size={18} color={note.trim() ? '#FFFFFF' : theme.muted} />}
        </div>
      </div>
      </>
      )}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <MediaImg src={lightbox} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
      {rowMenu && (
        <ChatRowSheet title={rowMenu.from_name || 'Saved'} subtitle={plainPreviewText(rowMenu.content || (rowMenu.kind === 'image' ? 'Photo' : rowMenu.kind === 'video' ? 'Video' : rowMenu.kind === 'audio' ? 'Voice message' : rowMenu.kind === 'sticker' ? 'Sticker' : '')).slice(0, 80)} onClose={() => setRowMenu(null)} zIndex={250} portal
          actions={[
            !String(rowMenu.id).startsWith('temp-') ? { icon: <FolderIcon size={18} />, label: 'Move to folder', hint: rowMenu.folder_id ? `Now in ${(folders.find((f) => f.id === rowMenu.folder_id) || {}).name || 'a folder'}` : 'Now in All', onClick: () => setMoveFor(rowMenu) } : null,
            rowMenu.content && rowMenu.kind !== 'sticker' ? { icon: <Copy size={18} />, label: 'Copy', onClick: () => { copyTextToClipboard(rowMenu.content).then((ok) => appSnack(ok ? 'Copied' : "Couldn't copy that")); } } : null,
            onOpenChat && (rowMenu.dm_user_id || rowMenu.group_id) ? { icon: <MessageSquare size={18} />, label: 'Open in chat', onClick: () => onOpenChat(rowMenu) } : null,
            { icon: <Trash2 size={18} />, label: 'Remove from Saved', danger: true, onClick: () => remove(rowMenu) },
          ]} />
      )}
      {moveFor && <SaveToSheet uid={myId} current={moveFor.folder_id || null} title="Move to" onClose={() => setMoveFor(null)} onPick={(fid) => { const r = moveFor; setMoveFor(null); moveRow(r, fid); }} />}
      {folderMenu && (
        <ChatRowSheet title={folderMenu.name} subtitle={countWord((rows || []).filter((r) => r.folder_id === folderMenu.id).length, 'saved message', 'saved messages')} onClose={() => setFolderMenu(null)} zIndex={250} portal
          actions={[
            { icon: <Pencil size={18} />, label: 'Rename folder', onClick: () => setNaming({ mode: 'rename', folder: folderMenu }) },
            { icon: <Trash2 size={18} />, label: 'Delete folder', danger: true, onClick: () => setDelAsk(folderMenu) },
          ]} />
      )}
      {naming && (
        <FolderNameSheet title={naming.mode === 'new' ? 'New folder' : 'Rename folder'} initial={naming.folder ? naming.folder.name : ''} cta={naming.mode === 'new' ? 'Create folder' : 'Save'} onClose={() => setNaming(null)}
          onSave={(n) => {
            const job = naming;
            setNaming(null);
            if (job.mode === 'new') { const r = createSavedFolder(myId, n); if (r.error) { setProblem(r.error); return; } hapticTap(); setFolder(r.folder.id); return; }
            renameFolder(job.folder, n);
          }} />
      )}
      {delAsk && <ConfirmDialog title={`Delete ${delAsk.name}?`} body="The folder goes away. Its messages stay in All." confirmLabel="Delete" layer={270} onCancel={() => setDelAsk(null)} onConfirm={() => { const f = delAsk; setDelAsk(null); deleteFolder(f); }} />}
    </div>
    </>
  );
}
