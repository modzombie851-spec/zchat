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
  ACCENT_PALETTES,
  APP_VERSION,
  AUTO_DL_CHOICES,
  AccentPickerSheet,
  AccessibilitySection,
  AchievementArt,
  AiStudioPage,
  AppPinPad,
  AppleLogo,
  ApprovalGlyph,
  Avatar,
  BUBBLE_COLORS,
  BigButton,
  BioGlyph,
  BubbleShopPage,
  CHAR_BUBBLES,
  CHAR_BUBBLE_KEYS,
  CHAT_THEMES,
  CR_SHARE,
  CakeLineIcon,
  CalendarIcon,
  ChatBackupPage,
  ChatLockUnlock,
  ChatRowSheet,
  ChoiceList,
  CoinIcon,
  CommunityGlyph,
  ConfirmDialog,
  ConfirmSheet,
  CrNote,
  CrSheet,
  CustomToneRows,
  DecorStill,
  DetailRow,
  DetailSection,
  EditTabsPage,
  EmptyState,
  FONT,
  FindMeBySection,
  FolderIcon,
  FullEmojiPicker,
  FullPage,
  G1ListEditor,
  G1WelcomePage,
  GamepadIcon,
  G1_ME,
  G2KeywordsPage,
  G2LinksSection,
  GOOGLE_CLIENT_ID,
  GoogleLogo,
  GroupAvatar,
  GuestbookIcon,
  HeaderIconButton,
  HiddenPhotoIcon,
  HiddenWordsPage,
  IgHeading,
  IgRow,
  IgToggle,
  IgTopBar,
  LIVE_WALLS,
  LIVE_WALL_PRICE,
  LaptopIcon,
  LimitsPage,
  LineTabs,
  LiveWallCanvas,
  LoadFail,
  MakeImageGlyph,
  MomentIcon,
  NOTIF_TONES,
  NameBadge,
  PROFILE_THEMES,
  PageArt,
  PartyIcon,
  PasskeyGlyph,
  PeoplePickerPage,
  PickPeoplePage,
  PickTiles,
  PillButton,
  PinKeypad,
  PinPad,
  Pin_,
  PollIcon,
  Portal,
  ProfileFxIcon,
  QrScanPage,
  QuestionIcon,
  QuickRepliesPage,
  RARITY_STYLE,
  REACTION_EMOJIS,
  ReportProblemPage,
  RestrictIcon,
  SAFETY_KINDS,
  SafetyIcon,
  SantaHatIcon,
  SecGlyph,
  SessionsSection,
  SoundPackRows,
  Spinner,
  StatusIcon,
  TextBombIcon,
  ThemeCanvas,
  TopicHashIcon,
  TwoFactorSection,
  VerifiedBadge,
  VibrateIcon,
  WALLPAPER_PRESETS,
  WALL_PHOTO_PREFIX,
  WhoCanSeePanel,
  WideDim,
  WriteHelpIcon,
  appAlert,
  appSnack,
  autoDlCfg,
  autoDlMem,
  autoDlNet,
  autoDlPing,
  axPrefs,
  axRow,
  axSet,
  axTabsOf,
  bioB64u,
  bioCredId,
  bioGlyphKind,
  bioName,
  bioRpId,
  bioUnb64u,
  bootSnapPeek,
  bootSnapPut,
  bubbleKeyOf,
  chatMem,
  chatThemeBg,
  chatThemeOf,
  chatThemeThem,
  coinsText,
  countWord,
  crCall,
  crCut,
  crOpen,
  cxNs,
  detailsCardBg,
  disappearLabel,
  fmtDate,
  fmtHM,
  fmtUsage,
  followSync,
  forgetLocalUser,
  formatBytes,
  formatCount,
  formatListTime,
  friendlyError,
  g1List,
  g1On,
  g1Says,
  g2Kw,
  g2KwOf,
  gbOpen,
  getDeviceId,
  getQuickReactions,
  ghostBtn,
  giftNoteText,
  giftOfNote,
  giftOpenStore,
  guestbookMem,
  hapticTap,
  hashAppPin,
  hiddenWordsCfg,
  homeSnapPart,
  identitySqlKnown,
  identitySqlMark,
  igPalette,
  inputStyle,
  isDecorKey,
  isTouchDevice,
  keepChatsLocal,
  kitOnInk,
  lapMarkOk,
  lapRead,
  lapSid,
  lapWrite,
  latestSync,
  listText,
  liveWallBg,
  liveWallOf,
  liveWallPaid,
  liveWallVeil,
  loadAnniversaries,
  loadFailCode,
  loadGoogleIdentityScript,
  localDbDelete,
  localDbGet,
  localDbKeys,
  loginDeviceLabel,
  makeAccentPalette,
  mediaBlobCache,
  mediaDbOp,
  mixHex,
  moneyRun,
  moreCoinsText,
  notifPageMem,
  notifSeenAt,
  openLiveById,
  openPlanById,
  passkeyCall,
  passkeyFail,
  passkeysSupported,
  pfOpenPage,
  playUiSound,
  postThumbOf,
  primaryBtn,
  privMetaPush,
  profileFnMissing,
  qrLoginOpen,
  randomNonce,
  readAppLock,
  readJsonLs,
  readMapShare,
  readNearbyCfg,
  readQuiet,
  readRingtone,
  readSpendCfg,
  readStoredAuth,
  readTone,
  readUsage,
  readVip,
  reducedMotion,
  reminderWhen,
  requireSpendAuth,
  restrictedRowsMem,
  rewardOpt,
  rpcMissing,
  rtDrop,
  rtKeep,
  rtName,
  rtOnRefresh,
  safetyLive,
  safetyOpen,
  sanitizeAvatarList,
  saveHiddenWordsCfg,
  setSensitiveMode,
  sha256Hex,
  shortAgo,
  siteOrigin,
  spPlay,
  spamFilterOn,
  spendGate,
  spendLockActive,
  spendSentToday,
  syncAlertPrefs,
  themeFallback,
  themeGradCss,
  themeSwatchCss,
  timeAgoLong,
  uiZoom,
  uiZoomPlan,
  uiZoomSub,
  updateProfile,
  usageDayKey,
  useAuthProviders,
  useAx,
  useBackClose,
  useBioReady,
  useBootSnap,
  useEdgeSwipeBack,
  useG2Kw,
  usePref,
  usePullRefresh,
  useSafetyStore,
  useSensitiveMode,
  useSheetDrag,
  useTheme,
  useWallet,
  verifyPin,
  vipNow,
  wallDimFor,
  wallPhotoCache,
  wallPhotoData,
  wallpaperBgStyle,
  writeAppLock,
  writeJsonLs,
  writeWorkerPref,
  zchatSafety,
  groupWrite,
} from '../App.jsx';
import {
  AppPinSetupPage,
  AxGlyph,
  AxTabsPreview,
  BubblesIcon,
  CR_PRICES,
  CharBubbleSample,
  ChoiceSheet,
  CloseFriendsIcon,
  CloseFriendsPicker,
  CrPriceList,
  DisappearSheet,
  GiftBoxIcon,
  KitSection,
  KitSlider,
  LiveWallLock,
  LoginRequestList,
  SettingsRowPlain,
  ThemeMockProfile,
  axDeviceInfo,
  axLookNow,
  axReportError,
  axSendReport,
  bioPinGate,
  buyShopItem,
  detailRows,
  lastBackupLabel,
  makeWallPhoto,
  readZipIndex,
  useOwnedBubbles,
  zipEntryBlob,
} from './shared.jsx';
import { ZLANGS, setZLang, useZLang, zlangWanted, zt } from '../i18n/index.js';
import { useGamePrivacy, setGamePrivacy } from '../games/live.js';

function useUiTextScale() {
  return React.useSyncExternalStore(uiZoomSub, () => uiZoom.v, () => 1);
}

function SettingsLayer({ onBack, children, z = 2 }) {
  const { theme } = useTheme();
  const swipe = useEdgeSwipeBack(true, onBack);
  return (
    <div {...swipe} className="zchat-panel-open" style={{ position: 'absolute', inset: 0, zIndex: z, background: igPalette(theme).bg, overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ padding: '0 16px calc(24px + env(safe-area-inset-bottom))' }}>{children}</div>
    </div>
  );
}

function ReminderAlertsSection({ me, onSaved }) {
  const { theme } = useTheme();
  const [local, setLocal] = useState({});
  const [err, setErr] = useState('');
  if (!me) return null;
  const isOn = (key) => (key in local ? local[key] : me[key] !== false);
  const flip = async (key) => {
    const next = !isOn(key);
    setLocal((l) => ({ ...l, [key]: next }));
    setErr('');
    const res = await latestSync(`alert:${key}`, next, (v) => supabase.from('profiles').update({ [key]: v }).eq('id', me.id), !next);
    if (!res.ok) {
      const back = res.state === undefined ? !next : res.state;
      setLocal((l) => ({ ...l, [key]: back }));
      setErr(/alert|column|schema/i.test(String((res.error && res.error.message) || '')) ? 'These switch on once the latest ZChat setup is finished.' : 'That could not be saved. Try again.');
      return;
    }
    if (onSaved) onSaved({ [key]: res.state });
  };
  const row = (key, icon, label, sub) => {
    const on = isOn(key);
    return <IgRow inset={false} icon={icon} label={label} sub={sub} right={<IgToggle on={on} onClick={() => flip(key)} />} />;
  };
  return (
    <>
      <IgHeading>Reminders</IgHeading>
      {row('alert_moment', <MomentIcon size={16} />, 'Daily moment', 'A heads up when it is time to post')}
      {row('alert_birthday', <CakeLineIcon size={16} />, 'Friends birthdays', 'A reminder on the day so you can wish them')}
      {err && <div role="alert" style={{ padding: '10px 12px 0', fontSize: 12.5, fontWeight: 700, color: theme.danger }}>{err}</div>}
    </>
  );
}


function ToggleSwitch({ on, onClick }) {
  const { theme } = useTheme();
  return (
    <div onClick={(e) => { hapticTap(); playUiSound('toggle'); if (onClick) onClick(e); }} style={{
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

function GamePrivacyPage({ onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const P = useGamePrivacy();
  const row = (label, sub, on, dim, flip) => (
    <div role="switch" aria-checked={!!on} aria-label={label} onClick={() => { if (dim) return; hapticTap(); flip(); }} className="zchat-row-press"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: dim ? 'default' : 'pointer', opacity: dim ? 0.5 : 1 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{label}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <IgToggle on={!!on} />
    </div>
  );
  return (
    <FullPage title="Games" onBack={onClose} zIndex={70}>
      <IgHeading>What friends see</IgHeading>
      {row('Show friends what I play', 'Friends see the game you are in on Games, in your chat and on your profile.', P.show, false, () => setGamePrivacy({ show: !P.show }))}
      <IgHeading>While you play</IgHeading>
      {row('Let friends watch', 'They see your game live and can send reactions. They cannot touch anything.', P.show && P.watch, !P.show, () => setGamePrivacy({ watch: !P.watch }))}
      {row('Let friends join', 'They can take a free seat in your room, or play the same game and see your score.', P.show && P.join, !P.show, () => setGamePrivacy({ join: !P.join }))}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '12px 4px' }}>Only friends and people you chat with see this. You can also change it from the eye button in any game.</div>
    </FullPage>
  );
}

export function MessagePrivacyPage({ me, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [value, setValue] = useState((me && me.privacy_messages) || 'everyone');
  const [readOn, setReadOn] = useState(!(me && me.read_receipts === false));
  const [spamOn, setSpamOn] = useState(() => spamFilterOn());
  const [err, setErr] = useState('');
  const toggleSpam = () => {
    const next = !spamOn;
    setSpamOn(next);
    hapticTap();
    try { localStorage.setItem('zchat-spam-filter', next ? 'on' : 'off'); } catch {}
    try { window.dispatchEvent(new Event('zchat-spam-pref')); } catch {}
  };
  const save = async (col, v, before, revert) => {
    setErr('');
    const res = await latestSync(`msgpriv:${col}`, v, (x) => supabase.from('profiles').update({ [col]: x }).eq('id', me.id), before);
    if (!res.ok) { revert(res.state === undefined ? before : res.state); setErr('That could not be saved yet. Try again in a little while.'); return; }
    onSaved({ [col]: res.state });
  };
  const pick = (v) => { if (v === value) return; const before = value; setValue(v); hapticTap(); save('privacy_messages', v, before, setValue); };
  const toggleRead = () => { const next = !readOn; setReadOn(next); hapticTap(); save('read_receipts', next, !next, setReadOn); };
  const choice = (v, title, sub) => (
    <div role="button" aria-label={title} onClick={() => pick(v)} className="zchat-row-press"
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>
      </div>
      <span style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${value === v ? theme.coral : theme.muted}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {value === v && <span style={{ width: 12, height: 12, borderRadius: '50%', background: theme.coral }} />}
      </span>
    </div>
  );
  return (
    <FullPage title="Messages and requests" onBack={onClose} zIndex={70}>
      <IgHeading>Who can message me</IgHeading>
      {choice('everyone', 'Everyone', 'People you do not follow go to Message requests first.')}
      {choice('following', 'Only people I follow', 'Anyone else cannot start a new chat with you.')}
      <IgHeading>Read receipts</IgHeading>
      <div role="button" aria-label={readOn ? 'Read receipts on' : 'Read receipts off'} onClick={toggleRead} className="zchat-row-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Show when I read messages</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>When this is off, you also will not see when others read yours.</div>
        </div>
        <IgToggle on={readOn} />
      </div>
      <IgHeading>Spam</IgHeading>
      <div role="button" aria-label={spamOn ? 'Spam filter on' : 'Spam filter off'} onClick={toggleSpam} className="zchat-row-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 4px', cursor: 'pointer' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Filter possible spam</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>Requests that look like scams, ads or mass messages go to Possible spam. ZChat may use AI to check first messages from people you do not follow.</div>
        </div>
        <IgToggle on={spamOn} />
      </div>
      {err && <div role="alert" style={{ padding: '10px 4px', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
    </FullPage>
  );
}

function ChangeEmailPage({ email, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState('');
  const clean = next.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) && clean !== String(email || '').toLowerCase();
  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true); setErr('');
    try {
      const { error } = await supabase.auth.updateUser({ email: clean }, { emailRedirectTo: window.location.origin });
      if (error) {
        const msg = String(error.message || '');
        setErr(/already|registered|exists/i.test(msg) ? 'That email is already used by another account.' : /rate|seconds|too many/i.test(msg) ? 'Please wait a minute before trying again.' : 'Could not change your email right now. Try again soon.');
      } else setSent(clean);
    } catch { setErr('Could not change your email right now. Try again soon.'); }
    setBusy(false);
  };
  return (
    <FullPage title="Email address" subtitle={email || ''} onBack={onClose} zIndex={70}
      footer={sent ? <BigButton label="Done" onClick={onClose} /> : <BigButton label={busy ? 'Sending' : 'Send confirmation'} disabled={!valid || busy} onClick={submit} />}>
      {sent ? (
        <div style={{ textAlign: 'center', padding: '36px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 14px', color: theme.ink }}><Mail size={40} strokeWidth={1.4} /></div>
          <div style={{ fontSize: 19, fontWeight: 900, color: theme.ink }}>Check your inbox</div>
          <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.55, marginTop: 8 }}>We sent a link to {sent}. Open it to finish the change. You may also get a link at your current email, open that one too.</div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '12px 2px 4px', textWrap: 'pretty' }}>Your current email is {email || 'not set'}. You keep using it to log in until you confirm the new one.</div>
          <IgHeading>New email</IgHeading>
          <input value={next} onChange={(e) => { setNext(e.target.value); setErr(''); }} placeholder="you@example.com" aria-label="New email" type="email" autoCapitalize="none" autoComplete="email"
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} style={{ ...inputStyle(theme), fontSize: 16 }} />
          {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '10px 2px 0' }}>{err}</div>}
        </>
      )}
    </FullPage>
  );
}

function StoryHiddenPicker({ myId, onClose, zIndex }) {
  return (
    <PeoplePickerPage title="Hide story from" zIndex={zIndex} myId={myId} onClose={onClose} table="story_hidden" ownerCol="owner_id" otherCol="hidden_id"
      subtitle="People you pick here will not see any of your stories. They are not told." />
  );
}

const INTERACTION_SPECS = [
  { col: 'privacy_comments', title: 'Comments', sub: 'Who can comment on your posts', options: [['everyone', 'Everyone'], ['followers', 'Your followers'], ['following', 'People you follow'], ['off', 'No one']] },
  { col: 'privacy_mentions', title: 'Mentions', sub: 'Who can mention you in stories, posts and groups', options: [['everyone', 'Everyone'], ['following', 'People you follow'], ['nobody', 'No one']] },
  { col: 'privacy_calls', title: 'Calls', sub: 'Who can call you', options: [['everyone', 'Everyone'], ['following', 'People you follow'], ['nobody', 'No one']] },
  { col: 'privacy_story_replies', title: 'Story replies', sub: 'Who can reply to your stories', options: [['everyone', 'Everyone'], ['following', 'People you follow'], ['off', 'No one']] },
  { col: 'typing_privacy', title: 'Typing status', sub: 'Who sees when you are typing or recording', options: [['everyone', 'Everyone'], ['following', 'People you follow', 'Only in your chats with them, never in groups'], ['nobody', 'No one']] },
];
function interactionLabel(spec, v) {
  const hit = spec.options.find(([k]) => k === (v || 'everyone'));
  return hit ? hit[1] : spec.options[0][1];
}

function limitsActive(p) {
  return !!(p && p.limits_until && new Date(p.limits_until).getTime() > Date.now());
}

function InteractionsPage({ me, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [vals, setVals] = useState(() => Object.fromEntries(INTERACTION_SPECS.map((s) => [s.col, (me && me[s.col]) || 'everyone'])));
  const [open, setOpen] = useState(null);
  const [err, setErr] = useState('');
  const pick = async (spec, v) => {
    setOpen(null);
    const before = vals[spec.col];
    if (before === v) return;
    setVals((x) => ({ ...x, [spec.col]: v }));
    setErr('');
    const { error } = await supabase.from('profiles').update({ [spec.col]: v }).eq('id', me.id);
    if (error) { setVals((x) => ({ ...x, [spec.col]: before })); setErr('That could not be saved yet. Try again in a little while.'); return; }
    onSaved({ [spec.col]: v });
  };
  const spec = open ? INTERACTION_SPECS.find((s) => s.col === open) : null;
  return (
    <FullPage title="Interactions" subtitle="Choose who can reach you and how" onBack={onClose} zIndex={72}>
      <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, padding: '6px 4px 6px' }}>These apply to everyone except people you block. Blocked accounts can never reach you.</div>
      {INTERACTION_SPECS.map((s) => (
        <IgRow key={s.col} inset={false} label={s.title} sub={s.sub} value={interactionLabel(s, vals[s.col])} onClick={() => setOpen(s.col)} />
      ))}
      {err && <div role="alert" style={{ padding: '10px 4px', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
      {spec && <ChoiceSheet title={spec.title} sub={spec.sub} options={spec.options} value={vals[spec.col]} onPick={(v) => pick(spec, v)} onClose={() => setOpen(null)} />}
    </FullPage>
  );
}
export function RestrictedAccountsPage({ myId, ids, onClose, onUnrestrict, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rowsRaw, setRows] = useState(() => restrictedRowsMem.get(myId) || null);
  const rows = rowsRaw ? rowsRaw.filter((p) => ids.has(p.id)) : rowsRaw;
  const key = [...ids].sort().join(',');
  useEffect(() => {
    let alive = true;
    const list = [...ids];
    if (!list.length) { setRows([]); return undefined; }
    supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge, is_deleted').in('id', list).then(({ data, error }) => {
      if (error && !data) { if (alive) setRows((prev) => prev || []); return; }
      const next = sanitizeAvatarList(data || [], myId).filter((p) => !p.is_deleted);
      restrictedRowsMem.set(myId, next);
      if (alive) setRows(next);
    }, () => { if (alive) setRows((prev) => prev || []); });
    return () => { alive = false; };
  }, [key]);
  return (
    <FullPage title="Restricted accounts" subtitle={rows ? `${rows.length} ${rows.length === 1 ? 'account' : 'accounts'}` : undefined} onBack={onClose} zIndex={72} pad={false}>
      <div style={{ padding: '10px 18px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Restricted people can still see your profile. Their chats go to Message requests, they cannot see when you are online or have read their messages, and they are not told.</div>
      {rows === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>
      ) : !rows.length ? (
        <EmptyState art="blocked" title="No restricted accounts" text="Restrict someone from their profile or chat menu to quietly limit them." />
      ) : (
        <div role="list" aria-label="Restricted accounts" style={{ padding: '4px 0 20px' }}>
          {rows.map((p) => (
            <div key={p.id} role="listitem" aria-label={`Restricted ${p.name}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px' }}>
              <div role="button" onClick={() => onOpenProfile && onOpenProfile(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <Avatar emoji={p.avatar} name={p.name} size={48} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                  <div style={{ fontSize: 13, color: theme.muted }}>@{p.username}</div>
                </div>
              </div>
              <PillButton small label="Unrestrict" ariaLabel={`Unrestrict ${p.name}`} onClick={async () => { await onUnrestrict(p); setRows((r) => (r || []).filter((x) => x.id !== p.id)); }} />
            </div>
          ))}
        </div>
      )}
    </FullPage>
  );
}

const EXPORT_DEVICE_KEYS = /^zchat-(theme-mode|theme-sched|sound|reaction-sound|data-saver|hidden-words|translate-to|fontscale|reduce-motion|format|spam-filter|quiet|tone|chat-tones|enter-send|autoplay|auto-download|bubble|wallpaper)/;
function exportDeviceSettings() {
  const out = {};
  try {
    for (let i = 0; i < localStorage.length && Object.keys(out).length < 60; i++) {
      const k = localStorage.key(i);
      if (k && EXPORT_DEVICE_KEYS.test(k) && !/token|lock|secret|hash|auth|session|pin|key/i.test(k.replace(/^zchat-/, ''))) out[k] = String(localStorage.getItem(k) || '').slice(0, 2000);
    }
  } catch {}
  return out;
}
const exportMem = new Map();
export function DataExportPage({ uid, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [row, setRow] = useState(() => (exportMem.has(uid) ? exportMem.get(uid) : undefined));
  const [off, setOff] = useState(false);
  const [err, setErr] = useState('');
  const [fail, setFail] = useState(null);
  const [linkBusy, setLinkBusy] = useState(0);
  const put = (r) => { exportMem.set(uid, r); setRow(r); };
  const load = async () => {
    const { data, error } = await supabase.from('zchat_data_exports').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).then((r) => r, (e) => ({ data: null, error: e || {} }));
    if (error && !/relation|schema|PGRST20|does not exist/i.test(`${error.code || ''} ${error.message || ''}`)) { setFail(loadFailCode(error)); return; }
    if (error) { setOff(true); if (!exportMem.has(uid)) put(null); return; }
    setFail(null);
    const cur = exportMem.get(uid);
    const next = (data || [])[0] || null;
    if (cur && String(cur.id) === 'temp' && (!next || Date.parse(next.created_at) < Date.parse(cur.created_at) - 60000)) return;
    put(next);
  };
  useEffect(() => {
    load();
    const keep = rtKeep(() => supabase.channel(rtName(`exports-${uid}`)).on('postgres_changes', { event: '*', schema: 'public', table: 'zchat_data_exports', filter: `user_id=eq.${uid}` }, (p) => {
      const r = p && p.new;
      if (!r || !r.id || r.user_id !== uid) return;
      const cur = exportMem.get(uid);
      if (!cur || cur.id === r.id || String(cur.id) === 'temp' || Date.parse(r.created_at) >= Date.parse(cur.created_at)) put({ ...(cur && cur.id === r.id ? cur : {}), ...r });
    }));
    const offR = rtOnRefresh(() => load());
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { rtDrop(keep); offR(); document.removeEventListener('visibilitychange', onVis); };
  }, [uid]);
  const start = async () => {
    const before = row;
    setErr('');
    put({ id: 'temp', user_id: uid, status: 'queued', progress: 0, phase: null, parts: [], created_at: new Date().toISOString() });
    hapticTap();
    const r = await zchatSafety('export_start', { device: exportDeviceSettings() }, 20000);
    if (r.status === 200 && r.data && r.data.id) {
      const cur = exportMem.get(uid);
      if (cur && (String(cur.id) === 'temp' || cur.id === r.data.id)) put({ ...cur, id: r.data.id, status: cur.id === r.data.id ? cur.status : (r.data.status || 'queued') });
      load();
      return;
    }
    put(before);
    if (r.status === 429 && r.data && r.data.next_at) setErr(`You can ask for your data once a day. Try again ${reminderWhen(new Date(r.data.next_at)).toLowerCase()}.`);
    else if (r.status === 404 && !r.error) setErr('Download your data switches on once the latest ZChat setup is finished.');
    else setErr(r.status === 0 ? 'No connection. Try again.' : r.error || 'Could not start right now. Try again later.');
  };
  const download = async (part) => {
    if (linkBusy) return;
    setLinkBusy(part.n);
    const r = await zchatSafety('export_link', { id: row.id, part: part.n }, 15000);
    setLinkBusy(0);
    if (!r.data || !r.data.url) { appSnack(r.error || 'Could not make the link. Try again.'); return; }
    try { const a = document.createElement('a'); a.href = r.data.url; a.download = r.data.name || 'ZChat data.zip'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); } catch { window.location.href = r.data.url; }
  };
  const status = row && row.status;
  const expired = row && status === 'ready' && row.expires_at && Date.parse(row.expires_at) < Date.now();
  const working = status === 'queued' || status === 'working';
  const ready = status === 'ready' && !expired;
  const parts = ready && Array.isArray(row.parts) ? row.parts : [];
  const nextAt = row && row.created_at && status !== 'failed' && String(row.id) !== 'temp' ? Date.parse(row.created_at) + 86400000 : 0;
  const canAsk = !working && (!nextAt || nextAt <= Date.now());
  const pct = working ? Math.max(3, Math.min(99, Number(row.progress) || 0)) : 0;
  const phase = row && row.phase === 'media' ? 'Adding your photos, videos and voice messages' : row && row.phase === 'packing' ? 'Packing your file' : 'Collecting your posts and chats';
  const what = [
    [<User key="u" />, 'Profile and account', 'Your details, followers and people you follow'],
    [<ImageIcon key="i" />, 'Posts and stories', 'With the photos and videos in them'],
    [<MessageSquare key="m" />, 'Chats', 'Messages in your chats, and the photos, videos and voice messages you sent'],
    [<CoinIcon key="c" size={22} />, 'Coins', 'Your balance and coin history'],
    [<SettingsIcon key="s" />, 'Settings', 'Privacy settings, your lists and settings on this phone'],
  ];
  return (
    <FullPage title="Download your data" onBack={onClose} zIndex={74}
      footer={off ? null : ready ? null : working ? null : <BigButton label="Request my data" disabled={!canAsk || row === undefined} onClick={start} />}>
      <PageArt text="Get a copy of what you shared on ZChat in one zip file. We build it in the background and tell you when it is ready." style={{ paddingTop: 8 }} />
      {off && <div role="status" style={{ margin: '4px 0 8px', padding: 12, borderRadius: 14, background: theme.rowBg, fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Download your data switches on once the latest ZChat setup is finished.</div>}
      {row === undefined && fail !== null && <LoadFail small code={fail} onRetry={() => { setFail(null); load(); }} />}
      {working && (
        <div className="zchat-fade" role="status" aria-label={`Building your file, ${pct} percent`} style={{ padding: '14px 4px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: theme.ink }}>{phase}</div>
            <div style={{ fontSize: 13, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{pct}%</div>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: theme.rowBg, overflow: 'hidden', marginTop: 10 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: theme.coral, transition: 'width 300ms ease-out' }} />
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 8, lineHeight: 1.45 }}>You can leave this page or close ZChat. We will tell you when it is ready.</div>
        </div>
      )}
      {ready && (
        <div className="zchat-fade" style={{ padding: '12px 0 4px' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink, padding: '0 4px' }}>Your data is ready</div>
          <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4, lineHeight: 1.5, padding: '0 4px' }}>{formatBytes(Number(row.bytes) || parts.reduce((t, x) => t + (Number(x.size) || 0), 0))}{parts.length > 1 ? ` in ${parts.length} parts. Keep all parts together.` : '.'} Available until {reminderWhen(new Date(row.expires_at)).toLowerCase()}.</div>
          <div style={{ marginTop: 8 }}>
            {parts.map((part) => (
              <IgRow key={part.n} inset={false} icon={linkBusy === part.n ? <Spinner size={18} color={theme.muted} /> : <Download />} label={parts.length > 1 ? `Download part ${part.n} of ${parts.length}` : 'Download'} sub={formatBytes(Number(part.size) || 0)} onClick={() => download(part)} />
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, padding: '6px 4px 0', lineHeight: 1.5 }}>The file has your chats in it. Keep it somewhere private.</div>
        </div>
      )}
      {(status === 'failed' || expired) && !working && <div style={{ fontSize: 13.5, color: theme.muted, padding: '12px 4px 2px', lineHeight: 1.5 }}>{expired ? 'Your last download expired. You can ask for a new one.' : 'Your last file did not finish. You can ask again.'}</div>}
      {!working && !ready && nextAt > Date.now() && status !== 'failed' && !expired && <div style={{ fontSize: 13.5, color: theme.muted, padding: '12px 4px 2px', lineHeight: 1.5 }}>You can ask again {reminderWhen(new Date(nextAt)).toLowerCase()}.</div>}
      {err && <div role="alert" style={{ padding: '10px 4px 0', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
      <IgHeading>What is in it</IgHeading>
      {what.map(([icon, label, sub]) => <IgRow key={label} inset={false} icon={icon} label={label} sub={sub} />)}
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '10px 2px 4px', lineHeight: 1.5, textWrap: 'pretty' }}>Other people's photos and voice messages stay with them. Big accounts come in more than one part. You can ask once a day, and each file can be downloaded for 3 days.</div>
    </FullPage>
  );
}

function BackupMedia({ zip, entries, m }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    let made = null;
    const ent = m.media && entries.get(m.media);
    if (!ent) return undefined;
    const type = m.type === 'image' ? 'image/jpeg' : m.type === 'video' ? 'video/mp4' : m.type === 'audio' ? 'audio/webm' : '';
    zipEntryBlob(zip, ent, /\.png$/.test(m.media) ? 'image/png' : /\.webp$/.test(m.media) ? 'image/webp' : type).then((b) => { made = URL.createObjectURL(b); if (alive) setUrl(made); else URL.revokeObjectURL(made); }, () => {});
    return () => { alive = false; if (made) URL.revokeObjectURL(made); };
  }, [m.media]);
  if (!m.media) return m.type === 'image' || m.type === 'video' || m.type === 'audio' ? <div style={{ fontSize: 13, color: theme.muted, fontStyle: 'italic' }}>{m.type === 'image' ? 'Photo not saved' : m.type === 'video' ? 'Video not saved' : 'Voice message not saved'}</div> : null;
  if (!url) return <div style={{ width: 180, height: m.type === 'audio' ? 40 : 140, borderRadius: 12, background: theme.rowBg }} />;
  if (m.type === 'image') return <img src={url} alt="" style={{ display: 'block', maxWidth: 220, maxHeight: 280, borderRadius: 12 }} />;
  if (m.type === 'video') return <video src={url} controls playsInline style={{ display: 'block', maxWidth: 240, borderRadius: 12 }} />;
  return <audio src={url} controls style={{ width: 220 }} />;
}

export function BackupViewerPage({ file, myId, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(300);
  useEffect(() => { setLimit(300); }, [open]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const idx = await readZipIndex(file);
        const ent = idx.get('chats.json');
        if (!ent) throw new Error('missing');
        const text = await (await zipEntryBlob(file, ent, 'application/json')).text();
        const json = JSON.parse(text);
        if (!json || json.app !== 'ZChat' || !Array.isArray(json.chats)) throw new Error('format');
        if (alive) { setEntries(idx); setData(json); }
      } catch { if (alive) setErr('This file is not a ZChat backup, or it is damaged.'); }
    })();
    return () => { alive = false; };
  }, [file]);
  const meId = data ? data.me.id : myId;
  const nameOf = (id) => (data && data.people && data.people[id] && data.people[id].name) || 'Someone';
  const chats = data ? data.chats.filter((c) => !q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase())) : [];
  const chat = open !== null && data ? data.chats[open] : null;
  return (
    <FullPage title={chat ? chat.title : 'Backup'} subtitle={chat ? countWord(chat.messages.length, 'message', 'messages') : data ? `${countWord(data.chats.length, 'chat', 'chats')}, saved ${new Date(data.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : undefined} onBack={chat ? () => setOpen(null) : onClose} zIndex={760} pad={false}>
      {err && <EmptyState art="nothing" title="Could not open this file" text={err} />}
      {!err && !data && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>}
      {data && !chat && (
        <>
          <div style={{ padding: '10px 16px 4px' }}>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats" aria-label="Search backup chats" style={{ ...inputStyle(theme), height: 40, padding: '0 14px' }} />
          </div>
          <div role="list" aria-label="Backup chats" style={{ padding: '6px 0 24px' }}>
            {chats.map((c) => {
              const i = data.chats.indexOf(c);
              const last = c.messages[c.messages.length - 1];
              return (
                <div key={`${c.kind}${c.id}`} role="listitem" aria-label={`Backup chat ${c.title}`} onClick={() => setOpen(i)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', cursor: 'pointer' }}>
                  <Avatar name={c.title} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{last ? (last.text || (last.type === 'image' ? 'Photo' : last.type === 'audio' ? 'Voice message' : last.type === 'video' ? 'Video' : '')) : ''}</div>
                  </div>
                  <span style={{ fontSize: 11.5, color: theme.muted, flexShrink: 0 }}>{last ? formatListTime(last.at) : ''}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      {chat && (
        <div style={{ padding: '10px 12px 30px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {chat.messages.length > limit && <div role="button" aria-label="Show earlier messages" onClick={() => setLimit((n) => n + 500)} style={{ alignSelf: 'center', fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer', padding: '8px 12px' }}>Show earlier messages</div>}
          {chat.messages.slice(-limit).map((m, i, shown) => {
            const mine = m.from === meId;
            const prev = shown[i - 1];
            const day = !prev || new Date(prev.at).toDateString() !== new Date(m.at).toDateString();
            return (
              <React.Fragment key={m.id}>
                {day && <div style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: theme.muted, padding: '12px 0 6px' }}>{new Date(m.at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>}
                <div style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', padding: '8px 12px', borderRadius: 18, background: mine ? theme.bubbleMe : theme.bubbleThem, color: theme.ink, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {chat.kind === 'group' && !mine && <div style={{ fontSize: 12, fontWeight: 800, color: theme.coral }}>{nameOf(m.from)}</div>}
                  {(m.type === 'image' || m.type === 'video' || m.type === 'audio') && <BackupMedia zip={file} entries={entries} m={m} />}
                  {m.text && <div style={{ fontSize: 15, lineHeight: 1.38, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>}
                  <div style={{ fontSize: 11, color: theme.muted, alignSelf: 'flex-end' }}>{new Date(m.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </FullPage>
  );
}

const SENS_CHOICES = [
  ['follow', "Blur from people I don't follow", 'People you follow show as usual'],
  ['all', 'Blur all photos and videos', 'Each one stays blurred until you tap it'],
  ['off', "Don't blur", 'Show every photo and video right away'],
];
const SENS_SUBS = { follow: "Blurred from people you don't follow", all: 'All photos and videos blurred until you tap', off: 'Nothing is blurred' };
function ChatPrivacyRows({ me }) {
  const sens = useSensitiveMode();
  const [picking, setPicking] = useState(false);
  const uid = me && me.id;
  return (
    <>
      <SettingsRowPlain icon={<HiddenPhotoIcon />} label="Sensitive photos" sub={SENS_SUBS[sens]} onClick={() => setPicking(true)} />
      {picking && (
        <ChoiceSheet title="Sensitive photos" sub="For chats, groups, message requests and Vibes posts marked sensitive" options={SENS_CHOICES} value={sens}
          onPick={(v) => { setPicking(false); if (v === sens) return; setSensitiveMode(v); privMetaPush(uid, 'sensitive_media', v); }} onClose={() => setPicking(false)} />
      )}
    </>
  );
}

function TrustedFriendsIcon({ size = 22, color = 'currentColor', strokeWidth = 1.8, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.4 2.8-5.4 5.5-5.4 1.2 0 2.3.4 3.2 1" />
      <path d="M17.5 12.3l3.5 1.4v2.5c0 2.2-1.5 3.9-3.5 4.6-2-.7-3.5-2.4-3.5-4.6v-2.5z" />
    </svg>
  );
}
function SafetyPrivacyRows({ me }) {
  const st = useSafetyStore();
  const running = !!(st.mine && safetyLive(st.mine));
  return (
    <>
      <SettingsRowPlain icon={<SafetyIcon size={16} />} label="Safety timer" sub={running ? 'Running now, tap to check in' : 'Let friends know you got there safe'} onClick={() => safetyOpen({ page: 'timer' })} />
      <SettingsRowPlain icon={<Download size={16} />} label="Download your data" sub="A copy of your profile, posts, chats, coins and settings" onClick={() => safetyOpen({ page: 'export' })} />
      <SearchVisibilityRow me={me} />
    </>
  );
}
function SearchVisibilityRow({ me }) {
  const key = `zchat-search-${me.id}`;
  const [on, setOn] = useState(() => { const v = readJsonLs(key, null); return typeof v === 'boolean' ? v : !me.is_private; });
  const touched = useRef(0);
  useEffect(() => {
    let alive = true;
    const at = Date.now();
    Promise.resolve(supabase.rpc('zchat_search_pref_get')).then(({ data, error }) => {
      if (!alive || error || !data || typeof data.visible !== 'boolean' || touched.current > at) return;
      setOn(data.visible);
      writeJsonLs(key, data.visible);
    }, () => {});
    return () => { alive = false; };
  }, [me.id]);
  const toggle = async () => {
    const next = !on;
    touched.current = Date.now();
    setOn(next);
    writeJsonLs(key, next);
    const { data, error } = await supabase.rpc('zchat_search_pref_set', { p_on: next });
    if (error || !data || !data.ok) {
      setOn(!next);
      writeJsonLs(key, !next);
      appSnack(rpcMissing(error) ? 'This switches on once the latest ZChat setup is finished.' : friendlyError(error, 'That did not save. Try again.'));
    }
  };
  return <SettingsRowPlain icon={<Search size={16} />} label="Show my profile on search engines" sub={on ? 'Google and others can list your public profile' : 'Search engines are asked not to list your profile or posts'} right={<IgToggle on={on} onClick={toggle} />} />;
}
function safetyNotifLine(r, who, theme) {
  const snippet = r.text ? String(r.text).slice(0, 80) : '';
  const b = (t, c) => <b style={{ fontWeight: 700, color: c || theme.ink }}>{t}</b>;
  const ev = r.meta && r.meta.ev;
  switch (r.kind) {
    case 'safety_start': return <>{who} started a safety timer{snippet ? `: ${snippet}` : ''}. You can see where they are until they check in.</>;
    case 'safety_alert': return <>{who} {b('has not checked in.', theme.danger)} Their safety timer ran out. Tap to see where they were.</>;
    case 'safety_ok': return r.meta && r.meta.more ? <>{who} is okay and added more time to their safety timer.</> : <>{who} checked in. They are safe.</>;
    case 'safety_check': return <>{b('Are you okay?')} Your safety timer ran out and your friends were told. Tap to let them know.</>;
    case 'trusted_added': return <>{who} picked you as a trusted friend. If they ever lose access to their account, they may ask you for help.</>;
    case 'recovery_help': return <>{who} asked for your help getting back into their account. Only help if you have talked to them.</>;
    case 'recovery_denied': return <>{who} said a request to get into your account was not you, so it was stopped.</>;
    case 'data_ready': return <>{b('Your ZChat data is ready.')} You can download it for 3 days.</>;
    case 'recovery_notice':
      if (ev === 'waiting') return <>{b('Your login email is about to change.')} Your trusted friends confirmed it was you. Not you? Tap to stop it.</>;
      if (ev === 'done') return <>You got back into your account with help from your trusted friends.{r.meta && r.meta.approval_off ? ' Login approval was turned off, you can turn it on again in Settings.' : ''}</>;
      if (ev === 'cancelled') return <>A request to change how you log in was stopped from your email.</>;
      return <>{b('Someone asked your trusted friends for help')} to get into your account. Not you? Tap to stop it.</>;
    default: return null;
  }
}
function safetyNotifTarget(r) {
  const m = r.meta || {};
  if (r.kind === 'safety_start' || r.kind === 'safety_alert' || r.kind === 'safety_ok') return m.timer_id ? () => safetyOpen({ page: 'watch', id: m.timer_id }) : null;
  if (r.kind === 'safety_check') return () => safetyOpen({ page: 'timer' });
  if (r.kind === 'recovery_help') return m.request_id ? () => safetyOpen({ page: 'help', id: m.request_id, seed: r.profile && r.profile.id ? { id: m.request_id, user: r.profile, created_at: r.at || r.created_at || new Date().toISOString(), state: 'new' } : null }) : null;
  if (r.kind === 'recovery_notice' || r.kind === 'recovery_denied') return () => safetyOpen({ page: 'trusted' });
  if (r.kind === 'data_ready') return () => safetyOpen({ page: 'export' });
  return null;
}

function PasswordGlyph({ size = 22, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  );
}

function TwoFactorGlyph({ size = 22, color = 'currentColor', strokeWidth = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="2" width="14" height="20" rx="2.5" /><path d="M10.5 18.5h3" /><circle cx="8.5" cy="11" r="1.1" fill={color} stroke="none" /><circle cx="12" cy="11" r="1.1" fill={color} stroke="none" /><circle cx="15.5" cy="11" r="1.1" fill={color} stroke="none" />
    </svg>
  );
}

function CreatorToolsGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h16" /><path d="M7 16.5V11" /><path d="M12 16.5V6.5" /><path d="M17 16.5v-3.5" /><path d="M15.5 6.5l1.5-2.5 1.5 2.5" />
    </svg>
  );
}
export function SettingsPanel({ onOpenWallet, onClose, onOpenPrivacy, onLogout, hideActivity, onToggleActivity, visitorsOn = true, onToggleVisitors, restrictedCount = 0, onOpenRestricted, onOpenAccounts, onOpenDelete, onOpenBlocked, blockedCount = 0, chatLockSet, chatLockHash, onSetChatLockPassword, onTurnOffChatLock, autoOpenLockSetup, onConsumedAutoOpen, me, onEditProfile, onPrivacySaved, isZAdmin, onOpenReports, onOpenAdmin, hasPasswordLogin, sessionForLinks, onOpenWhatsNew, onOpenUsage, initialSection }) {
  useBackClose(true, onClose);
  const [permText, setPermText] = useState('Checking…');
  const notifState = (typeof Notification !== 'undefined' && Notification.permission) || 'default';
  const checkPerms = async () => {
    try {
      if (!navigator.permissions) { setPermText('Tap to allow'); return; }
      const [cam, mic] = await Promise.all([navigator.permissions.query({ name: 'camera' }).catch(() => null), navigator.permissions.query({ name: 'microphone' }).catch(() => null)]);
      const st = [cam && cam.state, mic && mic.state];
      if (st.every((x) => x === 'granted')) setPermText('Allowed');
      else if (st.some((x) => x === 'denied')) setPermText('Blocked, tap to fix');
      else setPermText('Tap to allow');
    } catch { setPermText('Tap to allow'); }
  };
  useEffect(() => { checkPerms(); }, []);
  const fixPermissions = async () => {
    playUiSound('tap');
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      st.getTracks().forEach((t) => t.stop());
      setPermText('Allowed');
    } catch {
      try { const a = await navigator.mediaDevices.getUserMedia({ audio: true }); a.getTracks().forEach((t) => t.stop()); } catch {}
      setPermText('Blocked, tap to fix');
      openPermHelp('camera');
    }
    checkPerms();
  };
  const { theme, themeMode, soundOn, setSoundOn, reactionSoundOn, setReactionSoundOn } = useTheme();
  const [dataSaver, setDataSaver] = usePref('zchat-data-saver');
  const [creatorOn, setCreatorOn] = usePref('zchat-creator-tools');
  const [lockFlow, setLockFlow] = useState(null);
  const [igQuery, setIgQuery] = useState('');
  const [section, setSection] = useState(() => (initialSection && String(initialSection).indexOf('sub:') !== 0 ? String(initialSection).split(':')[0] : 'main'));
  const [subPage, setSubPage] = useState(() => (initialSection && String(initialSection).indexOf('sub:') === 0 ? String(initialSection).slice(4) : null));
  const currentEmail = (sessionForLinks && sessionForLinks.user && sessionForLinks.user.email) || (me && me.email) || '';
  const edgeBack = useEdgeSwipeBack(section === 'main');
  const SETTINGS_PARENT = { whocansee: 'privacy' };
  useBackClose(section !== 'main', () => setSection(SETTINGS_PARENT[section] || 'main'));
  const layerSections = section === 'main' ? [] : (SETTINGS_PARENT[section] ? [SETTINGS_PARENT[section], section] : [section]);
  const [appLockOn, setAppLockOn] = useState(() => !!readAppLock().h);
  useEffect(() => {
    const on = () => setAppLockOn(!!readAppLock().h);
    window.addEventListener('zchat-applock-changed', on);
    return () => window.removeEventListener('zchat-applock-changed', on);
  }, []);
  useEffect(() => {
    if (autoOpenLockSetup) {
      setSection('privacy');
      setLockFlow('set');
      onConsumedAutoOpen();
    }
  }, [autoOpenLockSetup]);

  const c = igPalette(theme);
  const SettingsRow = SettingsRowPlain;
  const ToggleSwitch = IgToggle;
  const SectionHeader = useMemo(() => function SectionHeader({ title }) { return <IgTopBar title={title} onBack={() => setSection('main')} sticky bleed={16} />; }, []);

  const notifValue = notifState === 'granted' ? 'On' : notifState === 'denied' ? 'Blocked' : 'Off';
  const themeLabel = { light: 'Light', dark: 'Dark', auto: 'Auto', schedule: 'Scheduled' }[themeMode] || 'Light';
  const uiLang = useZLang();
  const uiScale = useUiTextScale();
  const finePointer = (() => { try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch { return false; } })();
  const igGroups = [
    { title: 'Your account', rows: [
      { icon: <User />, label: 'Edit profile', onClick: onEditProfile },
      { icon: <UserPlus />, label: 'Switch account', onClick: onOpenAccounts },
      { icon: <Mail />, label: 'Email address', value: currentEmail.length > 20 ? `${currentEmail.slice(0, 18)}\u2026` : currentEmail, onClick: () => setSubPage('email') },
      me ? { icon: <Moon />, label: 'Take a break', onClick: () => setSubPage('break') } : null,
      me ? { icon: <CreatorToolsGlyph />, label: 'Creator tools', toggle: !!creatorOn, onClick: () => { setCreatorOn(!creatorOn); appSnack(creatorOn ? 'Creator tools are off. Turn them on here any time.' : 'Creator tools are on. Find them on your profile.'); } } : null,
    ] },
    { title: 'Login and security', rows: [
      { icon: <SecGlyph k="checkup" />, label: 'Security checkup', value: checkupLabel(me && me.id), onClick: () => setSubPage('checkup') },
      { icon: <PasswordGlyph />, label: 'Change password', onClick: () => setSection('password') },
      { icon: <TwoFactorGlyph />, label: 'Two factor authentication', onClick: () => setSection('twofactor') },
      { icon: <Smartphone />, label: 'Login activity', onClick: () => setSection('sessions') },
      me ? { icon: <LaptopIcon />, label: 'Linked devices', value: (qrDevicesMem.get(me.id) || []).length ? String(qrDevicesMem.get(me.id).length) : undefined, onClick: () => setSection('computers') } : null,
      me && passkeysSupported() && identitySqlKnown() !== false ? { icon: <PasskeyGlyph />, label: 'Passkeys', value: (passkeyListMem.get(me.id) || []).length ? String(passkeyListMem.get(me.id).length) : undefined, onClick: () => setSection('passkeys') } : null,
      me && identitySqlKnown() !== false ? { icon: <ApprovalGlyph />, label: 'Login approval', value: lapRead(me.id).on ? 'On' : 'Off', onClick: () => setSection('approval') } : null,
      me ? { icon: <TrustedFriendsIcon />, label: 'Trusted friends', onClick: () => safetyOpen({ page: 'trusted' }) } : null,
      { icon: <LinkIcon />, label: 'Login methods', value: sessionForLinks && sessionForLinks.user && sessionForLinks.user.identities ? `${sessionForLinks.user.identities.length} linked` : undefined, onClick: () => setSection('linked') },
      { icon: <Lock />, label: 'App lock', value: appLockOn ? 'On' : 'Off', onClick: () => setSection('applock') },
      { icon: <SecGlyph k="spend" />, label: 'Spending lock', value: appLockOn && spendLockActive() ? 'On' : 'Off', onClick: () => setSection('spendlock') },
    ] },
    { title: 'Who can see your content', rows: [
      { icon: <Eye />, label: 'Privacy', onClick: () => setSection('privacy') },
      { icon: <CloseFriendsIcon />, label: 'Close friends', onClick: () => setSubPage('close') },
      { icon: <EyeOff />, label: 'Hide activity status', toggle: !!hideActivity, onClick: onToggleActivity },
      onToggleVisitors ? { icon: <Eye />, label: 'Profile visitors', toggle: !!visitorsOn, onClick: () => onToggleVisitors(!visitorsOn) } : null,
      { icon: <Ban />, label: 'Blocked accounts', value: blockedCount ? String(blockedCount) : 'None', onClick: onOpenBlocked },
    ] },
    { title: 'How others can reach you', rows: [
      { icon: <MessageSquare />, label: 'Messages and requests', value: me && me.privacy_messages === 'following' ? 'People I follow' : undefined, onClick: () => setSubPage('messages') },
      { icon: <Users />, label: 'Interactions', onClick: () => setSubPage('interactions') },
      { icon: <Timer />, label: 'Limits', value: limitsActive(me) ? 'On' : 'Off', onClick: () => setSubPage('limits') },
      onOpenRestricted ? { icon: <ShieldOff />, label: 'Restricted accounts', value: restrictedCount ? String(restrictedCount) : 'None', onClick: onOpenRestricted } : null,
      { icon: <StatusIcon />, label: 'Hide story from', onClick: () => setSubPage('hidden') },
      { icon: <Clock />, label: 'Away message', value: me && me.away_on ? 'On' : 'Off', onClick: () => setSubPage('away') },
      { icon: <EyeOff />, label: 'Hidden words', value: hiddenWordsCfg().on || hiddenWordsCfg().words.length ? 'On' : 'Off', onClick: () => setSubPage('hiddenwords') },
    ] },
    { title: 'Your app', rows: [
      { icon: <Palette />, label: 'Theme', value: themeLabel, onClick: () => setSection('appearance') },
      { icon: <LangGlyph />, label: 'Language', value: (ZLANGS.find((l) => l.k === uiLang) || ZLANGS[0]).native, onClick: () => setSection('language') },
      { icon: <Type />, label: 'Text size', value: THEME_TEXT_SIZES[textSizeIdx(uiScale)][1], onClick: () => setSection('textsize') },
      { icon: <AxGlyph k="access" />, label: 'Accessibility', value: axLookNow().bold || axLookNow().cv !== 'off' ? 'On' : undefined, onClick: () => setSection('accessibility') },
      { icon: soundOn ? <Volume2 /> : <VolumeX />, label: 'Sounds', toggle: !!soundOn, onClick: () => setSoundOn(!soundOn) },
      { icon: <Bell />, label: 'Notifications', value: notifValue, onClick: () => setSection('notifications') },
      { icon: <Camera />, label: 'Camera and microphone', value: permText, onClick: fixPermissions },
      { icon: <MessageSquare />, label: 'Chats', onClick: () => setSection('chats') },
      ...(onOpenUsage ? [{ icon: <Timer />, label: 'Time on ZChat', value: fmtUsage(readUsage()[usageDayKey()] || 0), onClick: onOpenUsage }] : []),
      ...(finePointer ? [{ icon: <KeyboardIcon />, label: 'Keyboard shortcuts', onClick: () => setSection('shortcuts') }] : []),
      { icon: <Download />, label: 'Chat backup', value: lastBackupLabel(), onClick: () => setSubPage('backup') },
      { icon: <Database />, label: 'Storage', onClick: () => setSection('storage') },
      { icon: <Activity />, label: 'Data saver', toggle: !!dataSaver, onClick: () => setDataSaver(!dataSaver) },
    ] },
    { title: 'Admin', rows: isZAdmin ? [{ icon: <ShieldCheck />, label: 'Admin panel', onClick: onOpenAdmin }, { icon: <ShieldAlert />, label: 'Report queue', onClick: onOpenReports }] : [] },
    { title: 'More info and support', rows: [
      { icon: <Megaphone />, label: 'What is new', value: APP_VERSION, onClick: () => { if (onOpenWhatsNew) onOpenWhatsNew(); } },
      { icon: <AxGlyph k="report" />, label: 'Report a problem', onClick: () => setSubPage('report') },
      { icon: <AxGlyph k="labs" />, label: 'ZChat Labs', value: axRow().labs.filter((k) => LABS.some((l) => l.k === k)).length ? `${axRow().labs.filter((k) => LABS.some((l) => l.k === k)).length} on` : undefined, onClick: () => setSubPage('labs') },
      { icon: <HelpCircle />, label: 'About ZChat', value: `Version ${APP_VERSION}`, onClick: () => setSection('about') },
    ] },
    { title: 'Login', rows: [
      { icon: <LogOut />, label: 'Log out', bold: true, onClick: onLogout },
      { icon: <Trash2 />, label: 'Delete my account', bold: true, onClick: onOpenDelete },
    ] },
  ];
  const igTerm = igQuery.trim().toLowerCase();
  const igVisible = igGroups
    .map((g) => ({ ...g, rows: g.rows.filter(Boolean).filter((r) => !igTerm || r.label.toLowerCase().includes(igTerm) || zt(r.label).toLowerCase().includes(igTerm)) }))
    .filter((g) => g.rows.length);
  const setWallet = useWallet(me ? me.id : null);

  return (
    <>
    <WideDim onClose={onClose} z={30} />
    <div {...edgeBack} style={{
      position: 'fixed', inset: 0, zIndex: 30, background: c.bg, color: c.fg, fontFamily: FONT,
    }} className="zchat-panel-open zchat-wide-page">
      <div style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative', zIndex: 1 }}>

        {(
          <>
            <IgTopBar title="Settings" onBack={onClose} sticky />
            <div style={{ padding: '4px 16px 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 12px', borderRadius: 10, background: c.field, color: c.dim }}>
                <Search size={17} />
                <input value={igQuery} onChange={(e) => setIgQuery(e.target.value)} placeholder="Search" aria-label="Search settings" autoCapitalize="none"
                  style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: c.fg, fontFamily: FONT, fontSize: 15 }} />
                {igQuery && <X size={16} style={{ cursor: 'pointer' }} onClick={() => setIgQuery('')} />}
              </label>
            </div>
            {me && !igTerm && (
              <div style={{ padding: '14px 16px 2px' }}>
                <div style={{ borderRadius: 18, background: c.field, overflow: 'hidden' }}>
                  <div role="button" aria-label="Your profile" onClick={onEditProfile} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                    <Avatar emoji={me.avatar} name={me.name} size={52} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 16.5, fontWeight: 700, color: c.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span data-zuser="">{me.name}</span><VerifiedBadge tier={me.verified} custom={me.custom_badge} size={15} /></div>
                      <div style={{ fontSize: 13.5, color: c.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{me.username}</div>
                    </div>
                    <ChevronRight size={18} color={c.dim} />
                  </div>
                  {onOpenWallet && (
                    <div role="button" aria-label="Coins" onClick={onOpenWallet} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', boxShadow: `inset 0 0.5px 0 ${c.line || 'rgba(127,127,127,0.18)'}` }}>
                      <CoinIcon size={24} />
                      <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: c.fg }}>Coins</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: c.fg, fontVariantNumeric: 'tabular-nums' }}>{setWallet && setWallet.ready ? formatCount(setWallet.coins) : ''}</div>
                      <ChevronRight size={18} color={c.dim} />
                    </div>
                  )}
                </div>
              </div>
            )}
            {igVisible.map((g) => (
              <DetailSection key={g.title} title={g.title === 'Login' ? null : g.title}>
                {detailRows(g.rows.map((r) => (
                  <DetailRow icon={r.icon} label={r.label} value={r.value} danger={!!r.bold} onClick={r.onClick}
                    right={r.toggle !== undefined ? <IgToggle on={r.toggle} /> : undefined} />
                )))}
              </DetailSection>
            ))}
            {igTerm && igVisible.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: c.dim, fontSize: 14 }}>No settings match that.</div>
            )}
            <div style={{ textAlign: 'center', padding: '28px 16px calc(36px + env(safe-area-inset-bottom))', fontSize: 12, color: c.faint }}>ZChat {APP_VERSION}</div>
          </>
        )}

      </div>
      {layerSections.filter((sec) => sec !== 'whocansee').map((sec, li) => (
        <SettingsLayer key={sec} z={3 + li} onBack={() => setSection('main')}>
        {sec === 'twofactor' && (
          <>
            <SectionHeader title="Two factor authentication" />
            <TwoFactorSection />
          </>
        )}

        {sec === 'sessions' && (
          <>
            <SectionHeader title="Login activity" />
            <SessionsSection userId={me && me.id} />
          </>
        )}

        {sec === 'computers' && me && (
          <>
            <SectionHeader title="Linked devices" />
            <LinkedDevicesSection uid={me.id} />
          </>
        )}

        {sec === 'passkeys' && me && (
          <>
            <SectionHeader title="Passkeys" />
            <PasskeysSection uid={me.id} />
          </>
        )}

        {sec === 'approval' && me && (
          <>
            <SectionHeader title="Login approval" />
            <LoginApprovalSection uid={me.id} />
          </>
        )}

        {sec === 'password' && (
          <>
            <SectionHeader title="Change password" />
            <PageArt k="password" text="Use something long that you do not use on any other app." />
            <ChangePasswordForm email={me && me.email} hasPassword={!!hasPasswordLogin} onDone={() => setSection('main')} />
          </>
        )}

        {sec === 'appearance' && (
          <>
            <SectionHeader title="Theme" />
            <AppearanceSection uid={me && me.id} />
          </>
        )}

        {sec === 'language' && (
          <>
            <SectionHeader title="Language" />
            <LanguageSection />
          </>
        )}

        {sec === 'textsize' && (
          <>
            <SectionHeader title="Text size" />
            <TextSizeSection />
          </>
        )}

        {sec === 'accessibility' && (
          <>
            <SectionHeader title="Accessibility" />
            <AccessibilitySection />
          </>
        )}

        {sec === 'privacy' && (
          <>
            <SectionHeader title="Privacy" />
            <PageArt k="privacy" text="Choose who can see your profile and who can reach you." />
            <SettingsRow icon={<SecGlyph k="checkup" />} label="Security checkup" sub="Go through the important settings one at a time" onClick={() => setSubPage('checkup')} />
            <SettingsRow icon={<Eye size={16} />} label="Who can see what" sub="Profile, bio, online, tags, groups, leaderboards" onClick={() => setSection('whocansee')} />
            <SettingsRow icon={<GamepadIcon size={16} />} label="Games" sub="What you play, watching and joining" onClick={() => setSubPage('games')} />
            <SettingsRow icon={<MessageSquare size={16} />} label="Messages and requests" sub="Who can message me, read receipts" onClick={() => setSubPage('messages')} />
            {me && <GuestbookPrivacyRow uid={me.id} />}
            <ChatPrivacyRows me={me} />
            <SettingsRow icon={<CloseFriendsIcon size={16} />} label="Close friends" sub="Share stories with a smaller group" onClick={() => setSubPage('close')} />
            <SettingsRow icon={<StatusIcon size={16} />} label="Hide story from" sub="Keep your stories from certain people" onClick={() => setSubPage('hidden')} />
            {me && <SafetyPrivacyRows me={me} />}
            <SettingsRow icon={<Lock size={16} />} label={chatLockSet ? 'Change Chat Lock password' : 'Set Chat Lock password'} onClick={() => setLockFlow(chatLockSet ? 'verify-then-change' : 'set')} />
            {chatLockSet && (
              <SettingsRow icon={<Lock size={16} />} label="Turn off Chat Lock" danger onClick={() => setLockFlow('verify-then-off')} />
            )}
            {me && identitySqlKnown() !== false && <FindMeBySection uid={me.id} me={me} />}
          </>
        )}


        {sec === 'storage' && (
          <>
            <SectionHeader title="Storage" />
            <PageArt k="storage" text="ZChat keeps your chats, photos and stickers on this phone so they open fast, even with no connection. Clearing them is safe, nothing is lost." />
            <StorageSection uid={me && me.id} />
          </>
        )}

        {sec === 'chats' && (
          <>
            <SectionHeader title="Chats" />
            <PageArt k="chats" text="Change how your chats look and behave on this phone." />
            <ChatsPrefsSection />
          </>
        )}

        {sec === 'applock' && (
          <>
            <SectionHeader title="App lock" />
            <AppLockSection />
          </>
        )}

        {sec === 'spendlock' && (
          <>
            <SectionHeader title="Spending lock" />
            <SpendLockSection uid={me && me.id} />
          </>
        )}

        {sec === 'shortcuts' && (
          <>
            <SectionHeader title="Keyboard shortcuts" />
            <PageArt k="shortcuts" text="Get around faster with your keyboard." />
            <ShortcutsSection />
          </>
        )}

        {sec === 'notifications' && (
          <>
            <SectionHeader title="Notifications" />
            <PageArt k="notifications" text="Pick how ZChat gets your attention. Quiet hours keep it calm at night." />
            <SettingsRow icon={soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} label="Message sound" right={<ToggleSwitch on={soundOn} onClick={() => setSoundOn((s) => !s)} />} />
            <SettingsRow icon={reactionSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} label="Reaction sound" right={<ToggleSwitch on={reactionSoundOn} onClick={() => setReactionSoundOn((s) => !s)} />} />
            <IgHeading>Message tone</IgHeading>
            <ToneList />
            <IgHeading>Ringtone</IgHeading>
            <RingtoneList />
            <IgHeading>Friends nearby</IgHeading>
            {me && <NearbySettingsRows uid={me.id} />}
            <IgHeading>Keyword alerts</IgHeading>
            {me && <G2KeywordSettings uid={me.id} />}
            <IgHeading>Quiet hours</IgHeading>
            <QuietHoursSection />
            <IgHeading>VIP</IgHeading>
            {me && <VipSection uid={me.id} />}
            <ReminderAlertsSection me={me} onSaved={onPrivacySaved} />
            <EmailDigestRow />
          </>
        )}

        {sec === 'about' && (
          <>
            <SectionHeader title="About" />
            <PageArt k="about" text="ZChat is made by Zombie, one late night at a time. Thanks for being here." />
            <SettingsRow icon={<Megaphone size={16} />} label="What is new" value={APP_VERSION} onClick={() => { if (onOpenWhatsNew) onOpenWhatsNew(); }} />
            <SettingsRow icon={<FileText size={16} />} label="Terms of use" onClick={() => { try { window.open('/?page=terms', '_blank'); } catch {} }} />
            <SettingsRow icon={<ShieldCheck size={16} />} label="Privacy policy" onClick={onOpenPrivacy} />
            <SettingsRow icon={<FileText size={16} />} label="Refund policy" onClick={() => { try { window.open('/?page=refund', '_blank'); } catch {} }} />
            <div style={{ textAlign: 'center', padding: '22px 0 6px', fontSize: 12.5, color: theme.muted }}>Version {APP_VERSION}</div>

          </>
        )}

        {sec === 'linked' && (
          <>
            <SectionHeader title="Login methods" />
            <LinkedAccountsSection session={sessionForLinks} />
          </>
        )}

        </SettingsLayer>
      ))}
      {subPage === 'messages' && me && <MessagePrivacyPage me={me} onClose={() => setSubPage(null)} onSaved={(patch) => { if (onPrivacySaved) onPrivacySaved(patch); }} />}
      {subPage === 'hiddenwords' && <HiddenWordsPage onClose={() => setSubPage(null)} />}
      {subPage === 'interactions' && me && <InteractionsPage me={me} onClose={() => setSubPage(null)} onSaved={(patch) => { if (onPrivacySaved) onPrivacySaved(patch); }} />}
      {subPage === 'backup' && me && <ChatBackupPage me={me} onClose={() => setSubPage(null)} />}
      {subPage === 'limits' && me && <LimitsPage me={me} onClose={() => setSubPage(null)} onSaved={(patch) => { if (onPrivacySaved) onPrivacySaved(patch); }} />}
      {subPage === 'away' && me && <AwayMessagePage me={me} onClose={() => setSubPage(null)} onSaved={(patch) => { if (onPrivacySaved) onPrivacySaved(patch); }} />}
      {subPage === 'close' && me && <CloseFriendsPicker myId={me.id} onClose={() => setSubPage(null)} />}
      {subPage === 'games' && <GamePrivacyPage onClose={() => setSubPage(null)} />}
      {subPage === 'hidden' && me && <StoryHiddenPicker myId={me.id} onClose={() => setSubPage(null)} />}
      {subPage === 'email' && <ChangeEmailPage email={currentEmail} onClose={() => setSubPage(null)} />}
      {subPage === 'report' && <ReportProblemPage me={me} onClose={() => setSubPage(null)} />}
      {subPage === 'labs' && <LabsPage me={me} onClose={() => setSubPage(null)} />}
      {subPage === 'break' && <TakeBreakPage onClose={() => setSubPage(null)} onStarted={() => { try { window.dispatchEvent(new Event('zchat-break-start')); } catch {} }} />}
      {subPage === 'checkup' && me && (
        <SecurityCheckupPage me={me} onClose={() => setSubPage(null)} onSaved={(patch) => { if (onPrivacySaved) onPrivacySaved(patch); }}
          hideActivity={!!hideActivity} onToggleActivity={onToggleActivity} restrictedCount={restrictedCount} onOpenRestricted={onOpenRestricted} />
      )}
      {section === 'whocansee' && me && (
        <WhoCanSeePanel me={me} onBack={() => setSection('privacy')} onSaved={onPrivacySaved} initialOpen={initialSection && String(initialSection).indexOf('whocansee:') === 0 ? String(initialSection).slice(10) : null} />
      )}
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
    </>
  );
}

export function AccountSwitcherPanel({ accounts, currentId, switchingId, onBack, onSwitch, onRemove, onAdd }) {
  useBackClose(true, onBack);
  const { theme } = useTheme();
  const [removeAsk, setRemoveAsk] = useState(null);
  useBackClose(!!removeAsk, () => setRemoveAsk(null));
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
    <FullPage title="Switch account" onBack={onBack} zIndex={60}
      footer={<button onClick={onAdd} className="zchat-press" style={{ ...primaryBtn(theme, false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Plus size={18} strokeWidth={2.6} />Add another account</button>}>
      <div style={{ padding: '8px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Tap an account to switch to it. Only this phone remembers these logins.</div>
      <div>
        {accounts.map((a, idx) => (
          <div key={a.id} role="button" aria-label={`Account ${a.name}`} onClick={() => a.id !== currentId && !switchingId && onSwitch(a)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 4px', minHeight: 70, borderRadius: 14, cursor: a.id !== currentId && !switchingId ? 'pointer' : 'default', opacity: switchingId && switchingId !== a.id ? 0.5 : 1 }}>
            <Avatar emoji={a.avatar} name={a.name} size={50} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center', minWidth: 0 }}>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{a.name}</span><VerifiedBadge tier={tiers[a.id] || a.verified} custom={a.custom_badge} size={14} />
              </div>
              <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{a.id === currentId ? 'Logged in now' : a.email}</div>
            </div>
            {switchingId === a.id ? <Spinner size={16} color={theme.coral} /> : a.id === currentId ? (
              <div style={{ width: 26, height: 26, borderRadius: 13, background: theme.coral, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={15} strokeWidth={3} /></div>
            ) : !switchingId ? (
              <div role="button" aria-label={`Remove ${a.name}`} onClick={(e) => { e.stopPropagation(); setRemoveAsk(a); }} style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={19} /></div>
            ) : null}
          </div>
        ))}
      </div>
      {removeAsk && (
        <div onClick={() => setRemoveAsk(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.62)', zIndex: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22,
        }} className="zchat-fade">
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.panelBg, borderRadius: 22, width: '100%', maxWidth: 330, padding: 22, textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 16.5, color: theme.ink, marginBottom: 8 }}>Remove this account?</div>
            <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.65, marginBottom: 18 }}>
              {removeAsk.name || 'This account'} will be taken off the switcher on this phone. Nothing is deleted, and you can log back in any time.
            </div>
            <button style={{ ...primaryBtn(theme), background: theme.danger }}
              onClick={() => { const id = removeAsk.id; setRemoveAsk(null); onRemove(id); }}>Remove</button>
            <div onClick={() => setRemoveAsk(null)} style={{ padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
          </div>
        </div>
      )}
    </FullPage>
  );
}
function setNotifSeenAt(uid, t) { try { localStorage.setItem(`zchat-notif-seen-${uid}`, String(t)); } catch {} try { window.dispatchEvent(new Event('zchat-notif-seen')); } catch {} }

function NotifThumb({ thumb }) {
  const { theme } = useTheme();
  const [failedSrc, setFailedSrc] = useState(null);
  if (!thumb) return null;
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}>
      {thumb.url && failedSrc !== thumb.url ? <img src={thumb.url} alt="" loading="lazy" draggable={false} onError={() => setFailedSrc(thumb.url)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : thumb.video ? <Play size={16} /> : null}
    </div>
  );
}

function notifCoinReward(r) {
  const m = r && r.meta;
  return !!r && r.kind === 'reward' && !!m && typeof m === 'object' && (m.kind === 'coins' || (!m.kind && m.coins != null));
}
const NOTIF_PROFILE_COLS = 'id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge, is_private, is_deleted';
function notifBaseRows(raw) {
  const rows = [];
  (raw.reqs || []).forEach((r) => rows.push({ key: `rq${r.follower_id}`, kind: 'follow_request', actor: r.follower_id, at: r.created_at || new Date().toISOString() }));
  (raw.fols || []).forEach((r) => rows.push({ key: `fo${r.follower_id}`, kind: 'follow', actor: r.follower_id, at: r.created_at }));
  const likeGroups = new Map();
  (raw.nots || []).forEach((r) => {
    if (r.kind === 'like' && r.post_id) {
      const k = `${r.post_id}:${new Date(r.created_at).toDateString()}`;
      const g = likeGroups.get(k);
      if (g) { g.others.push(r.actor_id); if (new Date(r.created_at) > new Date(g.at)) { g.at = r.created_at; } return; }
      const item = { key: `n${r.id}`, kind: 'like', actor: r.actor_id, others: [], at: r.created_at, post_id: r.post_id, id: r.id };
      likeGroups.set(k, item);
      rows.push(item);
      return;
    }
    rows.push({ key: `n${r.id}`, kind: r.kind, actor: r.actor_id, at: r.created_at, post_id: r.post_id, text: r.text, meta: r.meta, id: r.id });
  });
  (raw.ann || []).forEach((a) => rows.push(a));
  return rows;
}
function notifRowsFrom(raw) {
  return notifBaseRows(raw)
    .map((r) => ({ ...r, profile: r.actor ? raw.byId[r.actor] : null, post: r.post_id ? raw.postById[r.post_id] : null }))
    .filter((r) => (r.actor ? !!r.profile : true) && (!r.post_id || !!r.post || r.kind === 'story_mention'))
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}
function notifSnapFor(uid) {
  const s = bootSnapPeek(uid, 'notifs');
  if (!s || !Array.isArray(s.items)) return null;
  const items = s.items.filter((r) => r && r.key && r.kind && r.at && (!r.actor || (r.profile && r.profile.id === r.actor)));
  return { items, iFollow: new Map(Array.isArray(s.follow) ? s.follow.filter((x) => Array.isArray(x) && x.length === 2) : []) };
}
function NotifNewPill({ onClick }) {
  const { theme } = useTheme();
  return (
    <div style={{ position: 'sticky', top: 8, zIndex: 5, height: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div role="button" aria-label="New notifications, go to top" onClick={onClick} className="zchat-pop" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px 0 11px', borderRadius: 17, background: theme.coral, color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, boxShadow: '0 6px 18px rgba(0,0,0,0.22)', cursor: 'pointer', whiteSpace: 'nowrap', WebkitTapHighlightColor: 'transparent' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="M5.5 11.5 12 5l6.5 6.5" /></svg>
        New notifications
      </div>
    </div>
  );
}
const notifVisitMem = new Map();
function NotifVisitorsRow({ myId, onOpen }) {
  const { theme } = useTheme();
  const [v, setV] = useState(() => notifVisitMem.get(myId) || null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await supabase.from('profile_visits').select('viewer_id, viewed_at').eq('profile_id', myId).gt('viewed_at', since).order('viewed_at', { ascending: false }).limit(60);
      if (error || !alive) return;
      const list = data || [];
      const ids = list.slice(0, 3).map((r) => r.viewer_id);
      let faces = [];
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, name, avatar, is_deleted').in('id', ids);
        const by = {};
        (profs || []).forEach((pr) => { if (!pr.is_deleted) by[pr.id] = pr; });
        faces = ids.map((id) => by[id]).filter(Boolean);
      }
      const next = { n: list.length, faces };
      notifVisitMem.set(myId, next);
      if (alive) setV(next);
    })();
    return () => { alive = false; };
  }, [myId]);
  if (!v || !v.n) return null;
  return (
    <div role="button" aria-label="Profile visitors" onClick={() => { hapticTap(); onOpen(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: 46, height: 46, flexShrink: 0 }}>
        {v.faces.slice(0, 2).map((f, i) => (
          <div key={f.id} style={{ position: 'absolute', left: i ? 14 : 0, top: i ? 14 : 0, borderRadius: '50%', boxShadow: i ? `0 0 0 2px ${theme.panelBg}` : 'none' }}><Avatar emoji={f.avatar} name={f.name} size={i || v.faces.length === 1 ? (v.faces.length === 1 ? 46 : 32) : 32} /></div>
        ))}
        {!v.faces.length && <div style={{ width: 46, height: 46, borderRadius: '50%', background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={22} /></div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Profile visitors</div>
        <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 1 }}>{v.n === 1 ? '1 person viewed your profile this week' : `${v.n} people viewed your profile this week`}</div>
      </div>
      <ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} />
    </div>
  );
}
export function NotificationsPage({ visitorsOn = false, onOpenVisitors = null, myId, onClose, onOpenProfile, onOpenPost, onOpenStory, onOpenChat, onOpenSettings, onOpenAchievements, onOpenLogins, onOpenQuestions, onOpenCollection, onOpenWallet, onOpenLive, onOpenGift, onChanged, onRequestDone, covered = false, onOpenGroup }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const notifScrollRef = useRef(null);
  const mem = notifPageMem.get(myId);
  const snap0 = useMemo(() => (mem ? null : notifSnapFor(myId)), []);
  const [items, setItems] = useState(() => (mem ? mem.items : snap0 ? snap0.items : null));
  const [iFollow, setIFollow] = useState(() => (mem ? mem.iFollow : snap0 ? snap0.iFollow : new Map()));
  const lateSnap = useBootSnap(myId, 'notifs', !mem && !snap0);
  useEffect(() => {
    if (!lateSnap || rawRef.current) return;
    const sn = notifSnapFor(myId);
    if (!sn) return;
    setItems((cur) => cur || sn.items);
    setIFollow((cur) => (cur && cur.size ? cur : sn.iFollow));
  }, [lateSnap]);
  const [busy, setBusy] = useState({});
  const [done, setDone] = useState({});
  const [fresh, setFresh] = useState(0);
  const seenRef = useRef(notifSeenAt(myId));
  const seenUpToRef = useRef(Date.now());
  const touchedRef = useRef({ req: new Map(), fol: new Map() });
  const rawRef = useRef(null);
  const pendingLiveRef = useRef([]);
  const anchorRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const iFollowRef = useRef(iFollow);
  iFollowRef.current = iFollow;
  const patchMem = (fn) => { const cur = notifPageMem.get(myId); if (cur) notifPageMem.set(myId, fn(cur)); };
  const withTouched = (list) => {
    const t = touchedRef.current;
    const seenFo = new Set((list || []).filter((r) => r.kind === 'follow').map((r) => r.actor));
    return (list || []).filter((r) => !(r.kind === 'follow_request' && (t.req.get(r.actor) === 'deleted' || (t.req.get(r.actor) === 'accepted' && seenFo.has(r.actor)))))
      .map((r) => (r.kind === 'follow_request' && t.req.get(r.actor) === 'accepted' ? { ...r, kind: 'follow', key: `fo${r.actor}` } : r));
  };
  const remember = (shownList, followMap) => {
    notifPageMem.set(myId, { items: shownList, iFollow: followMap });
    const keep = shownList.slice(0, 60);
    const actors = new Set(keep.map((r) => r.actor).filter(Boolean));
    bootSnapPut(myId, 'notifs', { items: keep, follow: [...followMap.entries()].filter(([id]) => actors.has(id)) });
  };
  const atTop = () => { const el = notifScrollRef.current; return !el || el.scrollTop < 24; };
  const pickAnchor = () => {
    const el = notifScrollRef.current;
    if (!el || el.scrollTop < 24) return null;
    const top = el.getBoundingClientRect().top;
    const out = [];
    const nodes = el.querySelectorAll('[data-nkey]');
    for (let i = 0; i < nodes.length && out.length < 4; i++) {
      const rr = nodes[i].getBoundingClientRect();
      if (rr.bottom > top + 1) out.push({ key: nodes[i].getAttribute('data-nkey'), off: rr.top - top });
    }
    return out.length ? out : null;
  };
  useLayoutEffect(() => {
    const list = anchorRef.current;
    anchorRef.current = null;
    const el = notifScrollRef.current;
    if (!list || !el) return;
    const top = el.getBoundingClientRect().top;
    for (let i = 0; i < list.length; i++) {
      const node = el.querySelector(`[data-nkey="${list[i].key}"]`);
      if (!node) continue;
      const delta = node.getBoundingClientRect().top - top - list[i].off;
      if (Math.abs(delta) > 0.5) el.scrollTop += delta;
      return;
    }
  }, [items]);
  const rebuild = (opts) => {
    const raw = rawRef.current;
    if (!raw) return;
    const before = new Set((itemsRef.current || []).map((r) => r.key));
    const shownList = withTouched(notifRowsFrom(raw));
    const added = shownList.filter((r) => !before.has(r.key) && new Date(r.at).getTime() > seenRef.current).length;
    const anchor = opts && opts.live ? pickAnchor() : null;
    if (anchor) anchorRef.current = anchor;
    if (opts && opts.live && added) {
      if (anchor) setFresh((n) => n + added);
      else seenUpToRef.current = Math.max(seenUpToRef.current, Date.now());
    }
    remember(shownList, iFollowRef.current);
    setItems(shownList);
  };
  const fetchMissing = async (actorIds, postIds) => {
    const raw = rawRef.current;
    if (!raw) return;
    const needP = [...new Set(actorIds.filter((id) => id && !raw.byId[id]))];
    const needPost = [...new Set(postIds.filter((id) => id && !raw.postById[id]))];
    if (!needP.length && !needPost.length) return;
    const [profs, posts] = await Promise.all([
      needP.length ? supabase.from('profiles').select(NOTIF_PROFILE_COLS).in('id', needP.slice(0, 100)) : Promise.resolve({ data: [] }),
      needPost.length ? supabase.from('posts').select('*').in('id', needPost.slice(0, 100)) : Promise.resolve({ data: [] }),
    ]);
    if (rawRef.current !== raw) return;
    sanitizeAvatarList((profs && profs.data) || [], myId).forEach((p) => { if (!p.is_deleted) raw.byId[p.id] = p; });
    ((posts && posts.data) || []).forEach((p) => { raw.postById[p.id] = p; });
  };
  const applyLive = async (ev) => {
    const raw = rawRef.current;
    if (!raw) { pendingLiveRef.current.push(ev); return; }
    const { table, type, row, old } = ev;
    if (table === 'notifications') {
      if (type === 'DELETE') {
        const id = old && old.id;
        if (!id || !raw.nots.some((n) => n.id === id)) return;
        raw.nots = raw.nots.filter((n) => n.id !== id);
        rebuild({ live: true });
        return;
      }
      if (!row || row.user_id !== myId || !row.id || !row.created_at) return;
      const others = raw.nots.filter((n) => n.id !== row.id);
      raw.nots = [row, ...others].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 250);
      await fetchMissing([row.actor_id], [row.post_id]);
      rebuild({ live: true });
      return;
    }
    if (table === 'follows') {
      const r = type === 'DELETE' ? old : row;
      if (!r || r.following_id !== myId || !r.follower_id || r.follower_id === myId) return;
      raw.reqs = raw.reqs.filter((x) => x.follower_id !== r.follower_id);
      raw.fols = raw.fols.filter((x) => x.follower_id !== r.follower_id);
      if (type !== 'DELETE') {
        const at = r.created_at || new Date().toISOString();
        if (r.status === 'pending') raw.reqs = [{ follower_id: r.follower_id, created_at: at }, ...raw.reqs];
        else if (r.status === 'accepted') raw.fols = [{ follower_id: r.follower_id, created_at: at }, ...raw.fols];
        await fetchMissing([r.follower_id], []);
      }
      rebuild({ live: true });
    }
  };
  const load = async () => {
    const startedAt = Date.now();
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const annJob = loadAnniversaries(myId).catch(() => []);
    const [reqs, fols, mine, nots] = await Promise.all([
      supabase.from('follows').select('follower_id, created_at').eq('following_id', myId).eq('status', 'pending').limit(100),
      supabase.from('follows').select('follower_id, created_at').eq('following_id', myId).eq('status', 'accepted').gt('created_at', since).order('created_at', { ascending: false }).limit(80),
      supabase.from('follows').select('following_id, status').eq('follower_id', myId).limit(5000),
      supabase.from('notifications').select('*').eq('user_id', myId).gt('created_at', since).order('created_at', { ascending: false }).limit(250),
    ]);
    const followMap = new Map(((mine && mine.data) || []).map((r) => [r.following_id, r.status]));
    touchedRef.current.fol.forEach((st, id) => { if (st) followMap.set(id, st); else followMap.delete(id); });
    iFollowRef.current = followMap;
    setIFollow(followMap);
    const raw = { reqs: (reqs && reqs.data) || [], fols: (fols && fols.data) || [], nots: (nots && !nots.error && nots.data) || [], ann: [], byId: {}, postById: {} };
    try {
      const ann = await annJob;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      raw.ann = ann.map((a) => ({ key: `an${a.id}`, kind: 'anniversary', actor: a.id, at: today.toISOString(), text: null, years: a.years }));
    } catch {}
    const base = notifBaseRows(raw);
    const actorIds = [...new Set(base.flatMap((r) => [r.actor, ...(r.others || [])]).filter(Boolean))];
    const postIds = [...new Set(base.map((r) => r.post_id).filter(Boolean))];
    const [profs, posts] = await Promise.all([
      actorIds.length ? supabase.from('profiles').select(NOTIF_PROFILE_COLS).in('id', actorIds.slice(0, 300)) : Promise.resolve({ data: [] }),
      postIds.length ? supabase.from('posts').select('*').in('id', postIds.slice(0, 200)) : Promise.resolve({ data: [] }),
    ]);
    sanitizeAvatarList((profs && profs.data) || [], myId).forEach((p) => { if (!p.is_deleted) raw.byId[p.id] = p; });
    ((posts && posts.data) || []).forEach((p) => { raw.postById[p.id] = p; });
    rawRef.current = raw;
    const shownList = withTouched(notifRowsFrom(raw));
    remember(shownList, followMap);
    setItems(shownList);
    seenUpToRef.current = Math.max(seenUpToRef.current, startedAt);
    const queued = pendingLiveRef.current;
    pendingLiveRef.current = [];
    for (let i = 0; i < queued.length; i++) await applyLive(queued[i]);
  };
  const liveRef = useRef(applyLive);
  liveRef.current = applyLive;
  useEffect(() => {
    load();
    setNotifSeenAt(myId, seenUpToRef.current);
    const onLive = (e) => { const d = e && e.detail; if (d && liveRef.current) liveRef.current(d); };
    window.addEventListener('zchat-notif-live', onLive);
    const keep = rtKeep(() => supabase.channel(rtName(`notif-gone-${myId}`))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (p) => { if (liveRef.current) liveRef.current({ table: 'notifications', type: 'DELETE', row: null, old: p && p.old }); }));
    const offRefresh = rtOnRefresh(() => { if (document.visibilityState === 'visible') load(); });
    return () => {
      window.removeEventListener('zchat-notif-live', onLive);
      rtDrop(keep);
      offRefresh();
      setNotifSeenAt(myId, seenUpToRef.current);
      const raw = rawRef.current;
      const unseen = raw ? [...raw.nots, ...raw.reqs, ...raw.fols].filter((r) => r && r.created_at && new Date(r.created_at).getTime() > seenUpToRef.current).length : 0;
      if (onChanged) onChanged(unseen);
    };
  }, []);
  const goTop = () => {
    const el = notifScrollRef.current;
    hapticTap();
    setFresh(0);
    seenUpToRef.current = Math.max(seenUpToRef.current, Date.now());
    if (!el) return;
    try { el.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch { el.scrollTop = 0; }
  };
  const onListScroll = (e) => {
    if (e.currentTarget.scrollTop < 24 && fresh) { setFresh(0); seenUpToRef.current = Math.max(seenUpToRef.current, Date.now()); }
  };
  const notifPull = usePullRefresh(notifScrollRef, () => load());
  const respond = async (r, accept) => {
    const verdict = accept ? 'accepted' : 'deleted';
    touchedRef.current.req.set(r.actor, verdict);
    setDone((d) => ({ ...d, [r.key]: verdict }));
    patchMem((m) => ({ ...m, items: withTouched(m.items) }));
    hapticTap();
    if (onRequestDone) onRequestDone(1);
    const { error } = accept
      ? await supabase.from('follows').update({ status: 'accepted' }).eq('follower_id', r.actor).eq('following_id', myId)
      : await supabase.from('follows').delete().eq('follower_id', r.actor).eq('following_id', myId);
    if (error) {
      touchedRef.current.req.delete(r.actor);
      setDone((d) => { const n = { ...d }; delete n[r.key]; return n; });
      notifPageMem.delete(myId);
      if (onRequestDone) onRequestDone(-1);
      appSnack(friendlyError(error, accept ? "Couldn't accept that request. Try again." : "Couldn't remove that request. Try again."));
      return;
    }
    if (onChanged) onChanged();
  };
  const followBack = async (r) => {
    const p = r.profile;
    const status = p.is_private ? 'pending' : 'accepted';
    const before = iFollow.get(p.id) || 'none';
    touchedRef.current.fol.set(p.id, status);
    setIFollow((m) => new Map(m).set(p.id, status));
    patchMem((m) => ({ ...m, iFollow: new Map(m.iFollow).set(p.id, status) }));
    hapticTap();
    const res = await followSync(myId, p.id, status, before);
    if (!res.ok) {
      const back = res.state && res.state !== 'none' ? res.state : null;
      touchedRef.current.fol.set(p.id, back);
      setIFollow((m) => { const n = new Map(m); if (back) n.set(p.id, back); else n.delete(p.id); return n; });
      notifPageMem.delete(myId);
      appSnack(friendlyError(res.error, "Couldn't follow right now. Try again."));
    }
  };
  const thanks = async (r) => {
    setDone((d) => ({ ...d, [r.key]: 'thanked' }));
    hapticTap();
    const { error } = await sendMessage(myId, r.actor, 'text', 'Thank you for the gift!', null);
    if (error) { setDone((d) => { const n = { ...d }; delete n[r.key]; return n; }); appSnack(friendlyError(error, "Couldn't send your thanks. Try again.")); }
  };
  const btn = (label, onClick, primary, aria) => (
    <div role="button" aria-label={aria || label} onClick={(e) => { e.stopPropagation(); onClick(); }} className="zchat-press" style={{ height: 32, padding: '0 14px', borderRadius: 9, background: primary ? theme.coral : theme.soft, color: primary ? '#FFFFFF' : theme.ink, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer', whiteSpace: 'nowrap' }}>{label}</div>
  );
  const nameOf = (p) => (p && (p.username || p.name)) || 'Someone';
  const lineFor = (r) => {
    const who = <b style={{ fontWeight: 700, color: theme.ink }}>{nameOf(r.profile)}</b>;
    const snippet = r.text ? String(r.text).slice(0, 80) : '';
    const planLine = liveNotifPlanText(r, who, theme);
    if (planLine) return planLine;
    if (SAFETY_KINDS.has(r.kind)) { const sl = safetyNotifLine(r, who, theme); if (sl) return sl; }
    switch (r.kind) {
      case 'follow_request': return <>{who} wants to follow you.</>;
      case 'follow': return <>{who} started following you.</>;
      case 'like': return r.others && r.others.length ? <>{who} and {r.others.length} {r.others.length === 1 ? 'other' : 'others'} liked your post.</> : <>{who} liked your post.</>;
      case 'comment': return snippet ? <>{who} commented: {snippet}</> : <>{who} commented on your post.</>;
      case 'reply': return snippet ? <>{who} replied to your comment: {snippet}</> : <>{who} replied to your comment.</>;
      case 'comment_like': return <>{who} liked your comment{snippet ? `: ${snippet}` : '.'}</>;
      case 'mention': return <>{who} mentioned you{snippet ? `: ${snippet}` : '.'}</>;
      case 'story_mention': return <>{who} mentioned you in a story.</>;
      case 'gift': return r.meta && Array.isArray(r.meta.from) && r.meta.from.length > 1 ? <><b style={{ fontWeight: 700, color: theme.ink }}>{listText(r.meta.from.slice(0, 3).map((x) => String(x).slice(0, 24)))}</b>{r.meta.from.length > 3 ? ` and ${r.meta.from.length - 3} more` : ''} sent you {snippet || 'a gift'}.</> : r.meta && r.meta.bday ? <>{who} sent you a birthday gift, {snippet || 'a gift'}.</> : <>{who} sent you {snippet || 'a gift'}.</>;
      case 'santa': return <>{snippet || 'Secret Santa news.'}</>;
      case 'trade': return r.meta && r.meta.ev === 'done' ? <>Your trade with {who} is done. Your new items are in your Collection.</> : <>{who} {snippet || 'sent you a trade offer'}.</>;
      case 'creator': return r.profile ? <>{who} {snippet}</> : <>{snippet}</>;
      case 'tip': return r.meta && r.meta.coins ? <>{who} tipped {coinsText(r.meta.coins)} on your post{r.meta.note ? `: "${String(r.meta.note).slice(0, 80)}"` : '.'}</> : <>{who} {snippet || 'tipped you'}.</>;
      case 'coins': return r.meta && Number(r.meta.coins) < 0 ? <><b style={{ fontWeight: 700, color: theme.ink }}>The ZChat team</b> took back {coinsText(-Number(r.meta.coins))}{r.meta.note ? `: "${String(r.meta.note).slice(0, 80)}"` : '.'}</> : <>{snippet || 'Your coins changed.'}</>;
      case 'anniversary': return <>{snippet || <>You and {who} met on ZChat {r.years && r.years > 1 ? `${r.years} years` : 'a year'} ago today.</>}</>;
      case 'achievement': return <><b style={{ fontWeight: 700, color: theme.ink }}>New achievement</b> {snippet}</>;
      case 'question': return <><b style={{ fontWeight: 700, color: theme.ink }}>New question</b> {snippet}</>;
      case 'reward': return /^(You |\d[\d,]* coins were )/.test(snippet) ? <>{snippet}</> : <><b style={{ fontWeight: 700, color: theme.ink }}>Reward</b> {snippet}</>;
      case 'login': return r.meta && r.meta.device_id && r.meta.device_id === getDeviceId()
        ? <><b style={{ fontWeight: 700, color: theme.ink }}>New login</b> on this device{r.meta.place ? `, ${r.meta.place}` : ''}.</>
        : <><b style={{ fontWeight: 700, color: theme.ink }}>New login</b> on {snippet || 'a new device'}. Not you? Tap to review your devices.</>;
      case 'approval': return <><b style={{ fontWeight: 700, color: theme.ink }}>Login approval</b> was turned on. If this was not you, change your password.</>;
      case 'drop': return <><b style={{ fontWeight: 700, color: theme.ink }}>New drop</b> {snippet}</>;
      case 'capsule': {
        const gn = r.meta && r.meta.group_id && snippet ? <b style={{ fontWeight: 700, color: theme.ink }}>{snippet}</b> : null;
        if (r.meta && r.meta.mine) return r.meta.self ? <>Your time capsule to yourself just opened.</> : gn ? <>Your time capsule in {gn} just opened.</> : <>Your time capsule for {who} just opened.</>;
        return gn ? <>A time capsule from {who} in {gn} just opened.</> : <>A time capsule from {who} just opened.</>;
      }
      case 'guestbook': return r.meta && r.meta.sticker ? <>{who} left a sticker in your guestbook.</> : <>{who} wrote in your guestbook{snippet ? `: ${snippet}` : '.'}</>;
      case 'poll': return <><b style={{ fontWeight: 700, color: theme.ink }}>Your poll closed</b>{r.meta && r.meta.q ? ` "${String(r.meta.q).slice(0, 60)}"` : ''}. {snippet}</>;
      case 'callplan': {
        const gname = r.meta && r.meta.group_id ? <b style={{ fontWeight: 700, color: theme.ink }}>{String(r.meta.g || 'your group')}</b> : null;
        const tail = snippet ? <>: {snippet}</> : '.';
        if (gname) return r.meta.mine ? <>Your call in {gname} starts in 10 minutes{tail}</> : <>The call {who} planned in {gname} starts in 10 minutes{tail}</>;
        return <>Your call with {who} starts in 10 minutes{tail}</>;
      }
      case 'compliment': return <>{who} sent you a compliment. Tap to open it.</>;
      case 'bday_card': return <>{who} started a birthday card for {snippet || 'a friend'}. Add your message.</>;
      case 'bday_open': return <><b style={{ fontWeight: 700, color: theme.ink }}>Happy birthday!</b> Your friends made you a card.</>;
      default: return <>{who} {snippet}</>;
    }
  };
  const actionFor = (r) => {
    if (r.kind === 'follow_request') {
      if (done[r.key] === 'accepted') return iFollow.get(r.actor) ? btn('Following', () => {}, false) : btn('Follow back', () => followBack(r), true, `Follow back ${nameOf(r.profile)}`);
      if (done[r.key] === 'deleted') return <span style={{ fontSize: 13, color: theme.muted }}>Removed</span>;
      return <div style={{ display: 'flex', gap: 6 }}>{btn(busy[r.key] ? 'Accepting' : 'Accept', () => respond(r, true), true, `Accept ${nameOf(r.profile)}`)}{btn('Delete', () => respond(r, false), false, `Delete request from ${nameOf(r.profile)}`)}</div>;
    }
    if (r.kind === 'follow') {
      const st = iFollow.get(r.actor);
      return st ? btn(st === 'pending' ? 'Requested' : 'Following', () => {}, false) : btn('Follow back', () => followBack(r), true, `Follow back ${nameOf(r.profile)}`);
    }
    if (r.kind === 'gift') return done[r.key] ? <span style={{ fontSize: 13, color: theme.muted }}>Thanked</span> : btn(busy[r.key] ? 'Sending' : 'Thanks', () => thanks(r), false, `Thank ${nameOf(r.profile)}`);
    if (r.kind === 'anniversary') return btn('Say hi', () => onOpenChat(r.profile), false, `Say hi to ${nameOf(r.profile)}`);
    if (r.post) return <NotifThumb thumb={postThumbOf(r.post)} />;
    if (r.kind === 'story_mention' && r.meta && (r.meta.media || r.meta.video)) return <NotifThumb thumb={{ url: r.meta.media || null, video: !!r.meta.video }} />;
    return null;
  };
  const targetOf = (r) => {
    const planGo = liveNotifPlanTarget(r, onOpenGroup, onClose);
    if (planGo !== undefined) return planGo;
    if (SAFETY_KINDS.has(r.kind) && r.kind !== 'trusted_added') return safetyNotifTarget(r);
    if (r.post && onOpenPost) return () => onOpenPost(r.post);
    if (r.kind === 'story_mention') return onOpenStory ? () => onOpenStory(r.actor, r.profile) : (r.profile && onOpenProfile ? () => onOpenProfile(r.profile) : null);
    if (r.kind === 'achievement') return onOpenAchievements ? () => onOpenAchievements() : null;
    if (r.kind === 'login' || r.kind === 'approval') return onOpenLogins ? () => onOpenLogins() : null;
    if (r.kind === 'question') return onOpenQuestions ? () => onOpenQuestions() : null;
    if (r.kind === 'drop') return onOpenCollection ? () => onOpenCollection('__drop') : null;
    if (r.kind === 'guestbook') return () => guestbookOpen({ id: myId });
    if (r.kind === 'compliment' && r.meta && r.meta.compliment) return () => pfOpenPage({ k: 'reveal', item: { id: r.meta.compliment, k: r.meta.k, note: r.text || null, from: { id: r.actor, name: r.profile ? r.profile.name : 'Someone', avatar: r.profile ? r.profile.avatar : null } } });
    if ((r.kind === 'bday_card' || r.kind === 'bday_open') && r.meta && r.meta.card) return () => pfOpenPage({ k: 'card', id: r.meta.card, reveal: r.kind === 'bday_open' });
    if (r.kind === 'reward') {
      if (r.meta && r.meta.kind && !notifCoinReward(r)) return onOpenCollection ? () => onOpenCollection() : null;
      return onOpenWallet ? () => onOpenWallet() : null;
    }
    if (r.kind === 'live' && r.meta && r.meta.live) { const lid = r.meta.live; return onOpenLive ? () => onOpenLive(lid) : () => { onClose(); setTimeout(() => openLiveById(lid), 0); }; }
    if (r.kind === 'trade') {
      if (r.meta && r.meta.ev === 'done' && onOpenCollection) return () => onOpenCollection();
      return r.profile && onOpenChat ? () => onOpenChat(r.profile) : null;
    }
    if (r.kind === 'coins' || r.kind === 'invite' || r.kind === 'tip') return onOpenWallet ? () => onOpenWallet() : null;
    if (r.kind === 'santa') return r.meta && r.meta.group && onOpenGroup ? () => onOpenGroup(r.meta.group) : null;
    if (r.kind === 'creator') return crNoteTarget(r, onOpenChat, onOpenWallet);
    if (r.kind === 'capsule') return r.meta && r.meta.group_id ? (onOpenGroup ? () => onOpenGroup(r.meta.group_id) : null) : (r.profile && onOpenChat ? () => onOpenChat(r.profile) : null);
    if (r.kind === 'poll') return r.meta && r.meta.group_id ? (onOpenGroup ? () => onOpenGroup(r.meta.group_id) : null) : (r.profile && onOpenChat ? () => onOpenChat(r.profile) : null);
    if (r.kind === 'callplan') return r.meta && r.meta.group_id ? (onOpenGroup ? () => onOpenGroup(r.meta.group_id) : null) : (r.profile && onOpenChat ? () => onOpenChat(r.profile) : null);
    if (r.kind === 'gift' && onOpenGift && r.id && giftOfNote({ text: r.text, meta: r.meta }) && !giftOpenStore(myId).read().includes(r.id)) return () => onOpenGift({ id: r.id, gift: giftOfNote({ text: r.text, meta: r.meta }), note: giftNoteText({ text: r.text }), from: r.profile || null, at: r.at, meta: r.meta || null });
    if (r.kind === 'gift' || r.kind === 'anniversary') return r.profile && onOpenChat ? () => onOpenChat(r.profile) : null;
    return r.profile && onOpenProfile ? () => onOpenProfile(r.profile) : null;
  };
  const open = (r) => {
    const go = targetOf(r);
    if (!go) return;
    hapticTap();
    go();
  };
  const sections = (() => {
    if (!items) return [];
    const now = new Date();
    const groups = [['Today', []], ['This week', []], ['This month', []]];
    items.forEach((r) => {
      const d = new Date(r.at);
      if (d.toDateString() === now.toDateString()) groups[0][1].push(r);
      else if (now - d < 7 * 86400000) groups[1][1].push(r);
      else groups[2][1].push(r);
    });
    return groups.filter((g) => g[1].length);
  })();
  return (
    <FullPage title="Notifications" onBack={onClose} zIndex={66} pad={false} covered={covered} scrollRef={notifScrollRef} scrollProps={{ ...notifPull.handlers, onScroll: onListScroll }}
      right={onOpenSettings ? <HeaderIconButton label="Notification settings" onClick={onOpenSettings}><SettingsIcon /></HeaderIconButton> : null}>
      {notifPull.indicator}
      {fresh > 0 && <NotifNewPill onClick={goTop} />}
      {visitorsOn && onOpenVisitors && <NotifVisitorsRow myId={myId} onOpen={onOpenVisitors} />}
      {items === null ? (
        <div style={{ padding: '8px 0' }}>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 20px' }}><div style={{ width: 46, height: 46, borderRadius: '50%', background: theme.soft }} /><div style={{ flex: 1 }}><div style={{ height: 12, width: '70%', borderRadius: 6, background: theme.soft }} /><div style={{ height: 10, width: '40%', borderRadius: 5, background: theme.soft, marginTop: 8 }} /></div></div>)}</div>
      ) : !items.length ? (
        <EmptyState art="nothing" title="Nothing new" text="Likes, comments, new followers and gifts show up here." />
      ) : (
        <div style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          {sections.map(([title, list]) => (
            <div key={title} role="list" aria-label={title}>
              <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink, padding: '14px 20px 6px', letterSpacing: '-0.01em' }}>{title}</div>
              {list.map((r) => {
                const unread = new Date(r.at).getTime() > seenRef.current;
                const isAch = r.kind === 'achievement' || r.kind === 'reward' || r.kind === 'question' || r.kind === 'login';
                const canOpen = !!targetOf(r);
                return (
                  <div key={r.key} data-nkey={r.key} role="listitem" aria-label={`Notification ${String(r.kind || '').replace(/_/g, ' ')}`} onClick={() => open(r)} className={canOpen ? 'zchat-row-press' : undefined} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 12, rowGap: 8, padding: '9px 20px', cursor: canOpen ? 'pointer' : 'default', background: unread ? mixHex(theme.coral, theme.bgGradient, theme.dark ? 0.1 : 0.06) : 'transparent' }}>
                    {r.kind === 'login' || r.kind === 'approval' || (SAFETY_KINDS.has(r.kind) && !r.actor) ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme) }}><SecGlyph k="alert" size={25} sw={2} /></div>
                    ) : r.kind === 'plan_start' ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme) }}><CalendarIcon size={22} /></div>
                    ) : r.kind === 'drop' ? (
                      <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: '#11131F', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{r.meta && isDecorKey(r.meta.key) ? <DecorStill setKey={r.meta.key} part="frame" width={44} /> : <GiftBoxIcon size={22} color="#FFFFFF" />}</div>
                    ) : r.kind === 'coins' || (r.kind === 'creator' && !r.profile) ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CoinIcon size={28} /></div>
                    ) : r.kind === 'santa' ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.dark ? 'rgba(239,75,90,0.16)' : '#FFEEF0', color: '#E5484D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SantaHatIcon size={25} /></div>
                    ) : r.kind === 'question' ? (
                      <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}><QuestionIcon size={22} /></div>
                    ) : notifCoinReward(r) ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CoinIcon size={26} /></div>
                    ) : r.kind === 'poll' ? (
                      <div aria-hidden="true" style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, background: theme.soft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kitOnInk(theme) }}><PollIcon size={22} /></div>
                    ) : isAch ? (
                      <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden' }}><AchievementArt k={(r.meta && r.meta.key) || r.kind} size={46} /></div>
                    ) : (
                      <div onClick={(e) => { e.stopPropagation(); if (r.profile) onOpenProfile(r.profile); }} style={{ flexShrink: 0 }}><Avatar emoji={r.profile && r.profile.avatar} name={r.profile ? r.profile.name : '?'} size={46} /></div>
                    )}
                    <div style={{ flex: '1 1 130px', minWidth: 0, fontSize: 14.5, lineHeight: 1.35, color: theme.ink, wordBreak: 'break-word' }}>{lineFor(r)} <span style={{ color: theme.muted }}>{shortAgo(r.at)}</span></div>
                    {(() => { const act = actionFor(r); return act ? <div style={{ marginLeft: 'auto', flexShrink: 0 }}>{act}</div> : null; })()}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </FullPage>
  );
}
const ownedWallsMem = { uid: null, set: new Set(), on: new Set(), job: null, subs: new Set() };
function ownedWallsPing() { ownedWallsMem.subs.forEach((fn) => { try { fn(); } catch {} }); }
function ownedWallsUse(uid) {
  const o = ownedWallsMem;
  if (o.uid === uid) return o;
  o.uid = uid;
  o.on = new Set();
  o.job = null;
  try { const v = JSON.parse(localStorage.getItem(`zchat-walls-${uid}`) || '[]'); o.set = new Set(Array.isArray(v) ? v.filter((k) => liveWallPaid(k)) : []); } catch { o.set = new Set(); }
  return o;
}
function loadOwnedWalls(uid) {
  if (!uid) return;
  const o = ownedWallsUse(uid);
  if (o.job) return;
  o.job = supabase.from('user_rewards').select('reward_key, expires_at').eq('user_id', uid).eq('kind', 'wallpaper').then(({ data, error }) => {
    o.job = null;
    if (error || !Array.isArray(data) || o.uid !== uid) return;
    o.set = new Set(data.filter((r) => r && liveWallPaid(r.reward_key) && (!r.expires_at || Date.parse(r.expires_at) > Date.now())).map((r) => r.reward_key));
    try { localStorage.setItem(`zchat-walls-${uid}`, JSON.stringify([...o.set])); } catch {}
    ownedWallsPing();
  }, () => { o.job = null; });
}
function noteOwnedWall(uid, k, on) {
  if (!uid) return;
  const o = ownedWallsUse(uid);
  if (on) o.on.add(k); else o.on.delete(k);
  ownedWallsPing();
}
function useOwnedWalls(uid) {
  const [, setV] = useState(0);
  useEffect(() => {
    const fn = () => setV((x) => x + 1);
    ownedWallsMem.subs.add(fn);
    loadOwnedWalls(uid);
    return () => { ownedWallsMem.subs.delete(fn); };
  }, [uid]);
  const out = new Set(LIVE_WALLS.filter((x) => x.free).map((x) => x.k));
  if (!uid) return out;
  const o = ownedWallsUse(uid);
  o.set.forEach((k) => out.add(k));
  o.on.forEach((k) => out.add(k));
  rewardOpt.rows.forEach((r) => { if (r.kind === 'wallpaper' && r.user_id === uid) out.add(r.reward_key); });
  return out;
}
function LiveWallTile({ spec, on, locked, onPick, dark }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label={`Live wallpaper ${spec.label}${locked ? `, ${LIVE_WALL_PRICE} coins` : ''}`} aria-pressed={on} onClick={onPick} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', minWidth: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', background: liveWallBg(spec, dark), boxShadow: on ? `0 0 0 2.5px ${theme.coral}, 0 0 0 4.5px ${igPalette(theme).bg}` : `inset 0 0 0 1px ${theme.border}` }}>
        <LiveWallCanvas k={spec.k} dark={dark} small />
        <div style={{ position: 'absolute', left: 8, right: 8, bottom: 9, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ alignSelf: 'flex-start', width: '58%', height: 12, borderRadius: 7, background: dark ? 'rgba(30,30,36,0.86)' : 'rgba(255,255,255,0.93)' }} />
          <div style={{ alignSelf: 'flex-end', width: '50%', height: 12, borderRadius: 7, background: theme.coral }} />
        </div>
        {locked && <LiveWallLock price={LIVE_WALL_PRICE} />}
      </div>
      <span style={{ fontSize: 12, fontWeight: on ? 700 : 500, color: on ? theme.ink : theme.muted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</span>
    </div>
  );
}
const THEME_TABS = [['color', 'Colors'], ['pattern', 'Patterns'], ['scene', 'Scenes'], ['live', 'Live'], ['photo', 'Photos']];
function ThemeTileArt({ t, dark, label, on, onPick, photoUrl }) {
  const { theme } = useTheme();
  const bg = t ? chatThemeBg(t, dark) : null;
  const sceneUrl = t && t.cat === 'scene' ? t.file : null;
  return (
    <div role="button" aria-label={`Theme ${label}`} aria-pressed={on} onClick={onPick} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', minWidth: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', boxShadow: on ? `0 0 0 2.5px ${theme.coral}, 0 0 0 4.5px ${igPalette(theme).bg}` : `inset 0 0 0 1px ${theme.border}`, ...(bg && !sceneUrl ? bg : { background: dark ? '#1A1A1F' : '#F2F2F5' }) }}>
        {(sceneUrl || photoUrl) && <img src={sceneUrl || photoUrl} alt="" loading="lazy" decoding="async" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        {sceneUrl && dark && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${Math.max(0.28, t.dim || 0)})` }} />}
        {t && (
          <div style={{ position: 'absolute', left: 8, right: 8, bottom: 9, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ alignSelf: 'flex-start', width: '58%', height: 12, borderRadius: 7, background: chatThemeThem(t, dark) }} />
            <div style={{ alignSelf: 'flex-end', width: '50%', height: 12, borderRadius: 7, background: themeGradCss(t) }} />
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: on ? 700 : 500, color: on ? theme.ink : theme.muted, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
  );
}
export function ChatThemePage({ value, onSelect, onClose, title, avatar, group, userId, mineOnly }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const c = igPalette(theme);
  const isCustomWall = (k) => !!k && (String(k).indexOf(WALL_PHOTO_PREFIX) === 0 || String(k).indexOf('url:') === 0);
  const startTheme = chatThemeOf(value);
  const start = startTheme ? `theme:${startTheme.key}` : (value || null);
  const [pick, setPick] = useState(start);
  const [tab, setTab] = useState(() => (startTheme ? startTheme.cat : liveWallOf(value) ? 'live' : value ? 'photo' : 'color'));
  const [scope, setScope] = useState(mineOnly ? 'me' : 'both');
  const [dimTick, setDimTick] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [customKey, setCustomKey] = useState(() => (isCustomWall(value) ? value : null));
  const photoRef = useRef(null);
  const gridRef = useRef(null);
  const changed = (pick || null) !== (start || null) || (!group && (scope === 'me') !== !!mineOnly);
  const ownedWalls = useOwnedWalls(userId);
  const pickedLive = liveWallOf(pick);
  const lockedLive = !!pickedLive && !ownedWalls.has(pickedLive.k) && pick !== start;
  const [wallAsk, setWallAsk] = useState(false);
  const wallet = useWallet(userId);
  const wallShort = lockedLive && wallet && wallet.ready ? Math.max(0, LIVE_WALL_PRICE - (Number(wallet.coins) || 0)) : 0;
  const buyWall = async () => {
    setWallAsk(false);
    if (!pickedLive) return;
    if (!(await spendGate(`Get the ${pickedLive.label} live wallpaper for ${LIVE_WALL_PRICE} coins`, { coins: LIVE_WALL_PRICE }))) return;
    const k = pickedLive.k;
    noteOwnedWall(userId, k, true);
    const job = moneyRun(userId, { coins: LIVE_WALL_PRICE, grants: [['wallpaper', k]], run: () => buyShopItem('wallpaper', k) }).then((r) => {
      if (r && r.error) { noteOwnedWall(userId, k, false); appSnack(r.error); } else loadOwnedWalls(userId);
      return r;
    });
    hapticTap();
    playUiSound('like');
    onSelect(pick, scope, job);
    onClose();
  };
  const pickedTheme = chatThemeOf(pick);
  const isPhoto = !!pick && !pickedTheme && !pickedLive;
  const dim = isPhoto ? wallDimFor(pick) : 0;
  void dimTick;
  const choose = (k) => { hapticTap(); playUiSound('tap'); setPick(k); };
  const pickPhoto = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setPhotoBusy(true);
    let failed = false;
    const key = await makeWallPhoto(f, userId, () => { failed = true; });
    setPhotoBusy(false);
    if (!key) { appAlert('That photo could not be used. Try a different one.'); return; }
    if (failed && group) { appAlert('Your photo did not upload, so the group would not see it. Check your connection and try again.'); return; }
    if (failed) { setScope('me'); appSnack('Your photo did not upload, so only this phone shows it.'); }
    hapticTap(); setPick(key); setCustomKey(key);
  };
  const counts = { color: 0, pattern: 0, scene: 0, live: LIVE_WALLS.length, photo: WALLPAPER_PRESETS.length };
  CHAT_THEMES.forEach((t) => { counts[t.cat] += 1; });
  const items = CHAT_THEMES.filter((t) => t.cat === tab);
  const changeTab = (k) => { if (k === tab) return; hapticTap(); setTab(k); if (gridRef.current) gridRef.current.scrollTop = 0; };
  const circle = (t, label, key, swatch) => {
    const on = (pick || null) === key;
    return (
      <div key={key || 'none'} role="button" aria-label={`Theme ${label}`} aria-pressed={on} onClick={() => choose(key)} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer', minWidth: 0 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: swatch, boxShadow: on ? `0 0 0 2.5px ${c.bg}, 0 0 0 5px ${theme.coral}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {on && <Check size={22} color={t && t.ink !== '#FFFFFF' ? t.ink : '#FFFFFF'} strokeWidth={2.6} />}
        </div>
        <span style={{ fontSize: 12, fontWeight: on ? 700 : 500, color: on ? theme.ink : theme.muted, textAlign: 'center', maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      </div>
    );
  };
  return (
    <FullPage title="Theme" subtitle={group ? 'Everyone in the group sees it' : scope === 'me' ? 'Only you see it' : 'Both of you see it'} onBack={onClose} zIndex={96} pad={false}
      footer={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!group && (
            <div role="radiogroup" aria-label="Who sees the theme" style={{ display: 'flex', height: 36, borderRadius: 10, background: theme.rowBg, padding: 3 }}>
              {[['both', 'Both of us'], ['me', 'Just me']].map(([k, l]) => (
                <div key={k} role="radio" aria-checked={scope === k} aria-label={l} onClick={() => { hapticTap(); setScope(k); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', background: scope === k ? c.bg : 'transparent', color: scope === k ? theme.ink : theme.muted, boxShadow: scope === k ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{l}</div>
              ))}
            </div>
          )}
          <BigButton label={lockedLive ? (wallShort > 0 ? `You need ${moreCoinsText(wallShort)}` : `Get it for ${LIVE_WALL_PRICE} coins`) : changed ? 'Use this theme' : 'Done'} onClick={() => { if (lockedLive) { if (wallShort > 0) { hapticTap(); appSnack(`${pickedLive.label} costs ${LIVE_WALL_PRICE} coins. You need ${moreCoinsText(wallShort)}.`); return; } setWallAsk(true); return; } if (changed) onSelect(pick, scope); onClose(); }} />
        </div>
      )}
      bodyStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: '6px 16px 0' }}>
        <ChatLookPreview key={`${pick}-${dimTick}`} wallpaper={pick} title={title} avatar={avatar} height={172} />
        {isPhoto && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
            <span aria-hidden="true" style={{ display: 'flex', color: theme.muted, flexShrink: 0 }}><Sun size={17} strokeWidth={2} /></span>
            <KitSlider value={Math.round(dim * 100)} min={0} max={70} step={5} label="Dim wallpaper" onChange={(v) => { setWallDim(pick, v / 100); setDimTick((t) => t + 1); }} style={{ flex: 1, width: 'auto', minWidth: 0 }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.muted, width: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Math.round(dim * 100)}%</span>
          </div>
        )}
        <LineTabs fill label="Theme kinds" value={tab} onChange={(k) => changeTab(k)} h={44} fs={14.5} style={{ margin: '6px -16px 0' }}
          tabs={THEME_TABS.map(([k, l]) => ({ k, label: l, aria: `${l}, ${counts[k]}` }))} />
      </div>
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
      <div ref={gridRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 16px 18px' }}>
        {tab === 'color' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', rowGap: 18, columnGap: 8, paddingTop: 6 }}>
            {circle(null, 'Default', null, theme.dark ? '#3D2F86' : '#E6DEFB')}
            {items.map((t) => circle(t, t.label, `theme:${t.key}`, themeSwatchCss(t)))}
          </div>
        ) : tab === 'live' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 14, columnGap: 10, paddingTop: 6 }}>
              {LIVE_WALLS.map((w) => <LiveWallTile key={w.k} spec={w} on={pick === `live:${w.k}`} locked={!ownedWalls.has(w.k) && start !== `live:${w.k}`} onPick={() => choose(`live:${w.k}`)} dark={theme.dark} />)}
            </div>
            <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', padding: '14px 10px 2px', lineHeight: 1.5 }}>They move gently and rest when you leave the chat. Rain on glass and Night sky are free.</div>
          </>
        ) : tab === 'photo' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 14, columnGap: 10, paddingTop: 6 }}>
            <div role="button" aria-label="Wallpaper your photo" onClick={() => { if (!photoBusy && photoRef.current) photoRef.current.click(); }} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
              <div style={{ aspectRatio: '3 / 4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, boxShadow: `inset 0 0 0 1px ${theme.border}`, background: theme.rowBg }}>{photoBusy ? <Spinner color={theme.muted} /> : <ImageIcon size={24} />}</div>
              <span style={{ fontSize: 12, fontWeight: 500, color: theme.muted, textAlign: 'center' }}>Your photo</span>
            </div>
            {userId && (
              <div role="button" aria-label="Create a wallpaper with AI" onClick={() => setAiOpen(true)} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
                <div style={{ aspectRatio: '3 / 4', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, boxShadow: `inset 0 0 0 1px ${theme.border}`, background: theme.rowBg }}><MakeImageGlyph size={28} /></div>
                <span style={{ fontSize: 12, fontWeight: 500, color: theme.muted, textAlign: 'center' }}>Create with AI</span>
              </div>
            )}
            {customKey && <ThemeTileArt key={customKey} label="Yours" on={pick === customKey} onPick={() => choose(customKey)} photoUrl={String(customKey).indexOf(WALL_PHOTO_PREFIX) === 0 ? wallPhotoData(customKey) : (wallPhotoCache.get(customKey) || String(customKey).slice(4))} dark={theme.dark} />}
            {WALLPAPER_PRESETS.map((p) => <ThemeTileArt key={p.key} label={p.label} on={pick === p.key} onPick={() => choose(p.key)} photoUrl={p.file} dark={theme.dark} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', rowGap: 14, columnGap: 10, paddingTop: 6 }}>
            {items.map((t) => <ThemeTileArt key={t.key} t={t} label={t.label} on={pick === `theme:${t.key}`} onPick={() => choose(`theme:${t.key}`)} dark={theme.dark} />)}
          </div>
        )}
      </div>
      {aiOpen && <AiStudioPage myId={userId} mode="image" startKind="wallpaper" onClose={() => setAiOpen(false)} onUseWallpaper={(key) => { hapticTap(); setPick(key); setCustomKey(key); setTab('photo'); }} />}
      {wallAsk && pickedLive && <ConfirmSheet title={`Get ${pickedLive.label}?`} text={`It costs ${LIVE_WALL_PRICE} coins and it is yours to keep, for every chat.`} confirmLabel={`Pay ${LIVE_WALL_PRICE} coins`} danger={false} zIndex={120} onCancel={() => setWallAsk(false)} onConfirm={buyWall} />}
    </FullPage>
  );
}

function ChatLockSetup({ onCancel, onConfirm }) {
  useBackClose(true, onCancel);
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
async function g1SaveGroup(gid, patch) {
  const r = await groupWrite(gid, patch);
  if (!r.ok) return { ok: false, error: r.error || (r.reason ? { message: r.reason } : null), reason: r.reason };
  return { ok: true, row: r.row || {} };
}

function G1SettingsBlock({ group, isOwner, onPatchGroup }) {
  const sampleName = G1_ME.name;
  const { theme } = useTheme();
  const [page, setPage] = useState(null);
  const [askRo, setAskRo] = useState(false);
  const [local, setLocal] = useState({});
  const holdRef = useRef({});
  const val = (k) => { const h = holdRef.current[k]; return h && Date.now() - h < 4000 && k in local ? local[k] : group[k]; };
  if (!g1On(group)) return null;
  const save = async (patch) => {
    const before = {};
    Object.keys(patch).forEach((k) => { before[k] = group[k] === undefined ? null : group[k]; holdRef.current[k] = Date.now(); });
    setLocal((cur) => ({ ...cur, ...patch }));
    if (onPatchGroup) onPatchGroup(patch);
    const out = await g1SaveGroup(group.id, patch);
    if (!out.ok) {
      Object.keys(patch).forEach((k) => { delete holdRef.current[k]; });
      setLocal((cur) => { const n = { ...cur }; Object.keys(patch).forEach((k) => { delete n[k]; }); return n; });
      if (onPatchGroup) onPatchGroup(before);
      appSnack(g1Says(out.error) || friendlyError(out.error, "Couldn't save that. Try again."));
      return false;
    }
    const fresh = {};
    ['group_rules', 'rules_version', 'welcome_text', 'join_questions'].forEach((k) => { if (k in out.row) fresh[k] = out.row[k]; });
    if (onPatchGroup) onPatchGroup(fresh);
    return true;
  };
  const flip = (k) => save({ [k]: !val(k) });
  const rules = g1List(val('group_rules'), 10);
  const qs = g1List(val('join_questions'), 3);
  const welcome = val('welcome_text');
  const ro = !!val('read_only');
  return (
    <>
      <DetailSection title="Posting">
        <DetailRow icon={<CheckCheck />} label="Approve posts" sub="Admins and moderators check member posts before they show" onClick={() => flip('approve_posts')} right={<IgToggle on={!!val('approve_posts')} />} />
        <DetailRow icon={<LinkIcon />} label="Only admins can post links" sub="Covers messages, captions and link previews" onClick={() => flip('admin_links')} right={<IgToggle on={!!val('admin_links')} />} />
        {isOwner
          ? <DetailRow icon={<Lock />} label="Read only" sub="Nobody can post, react or pin, admins too" onClick={() => { if (ro) save({ read_only: false }); else setAskRo(true); }} right={<IgToggle on={ro} />} last />
          : <DetailRow icon={<Lock />} label="Read only" sub="Only the owner can change this" value={ro ? 'On' : 'Off'} last />}
      </DetailSection>
      <DetailSection title="Welcome and rules">
        <DetailRow icon={<Smile />} label="Welcome message" sub={welcome ? welcome.split('\n')[0] : 'Greet new members with a card from the group'} value={welcome ? 'On' : 'Off'} onClick={() => setPage('welcome')} />
        <DetailRow icon={<FileText />} label="Group rules" sub="New members agree to them before they post" value={rules.length ? String(rules.length) : 'None'} onClick={() => setPage('rules')} last={!group.join_approval} />
        {group.join_approval ? <DetailRow icon={<HelpCircle />} label="Join questions" sub="People asking to join answer these first" value={qs.length ? String(qs.length) : 'None'} onClick={() => setPage('questions')} last /> : null}
      </DetailSection>
      {askRo && <ConfirmSheet title="Make the group read only?" text="Nobody can post, react or pin until you turn it off, admins included. People can still read and leave." confirmLabel="Make read only" danger={false} onCancel={() => setAskRo(false)} onConfirm={() => { setAskRo(false); save({ read_only: true }); }} zIndex={98} />}
      {page === 'welcome' && <G1WelcomePage group={{ ...group, welcome_text: welcome, welcome_name: val('welcome_name') }} sampleName={sampleName} onClose={() => setPage(null)} onSave={(p) => { setPage(null); save(p).then((ok) => { if (ok) appSnack(p.welcome_text ? 'Welcome message saved' : 'Welcome message turned off'); }); }} />}
      {page === 'rules' && <G1ListEditor title="Group rules" subtitle={group.name} items={rules} max={10} maxLen={120} placeholder="Be kind to each other" addLabel="Add a rule" hint="Keep each rule short. Members agree to the rules before they post, and agree again when you change them." onClose={() => setPage(null)} onSave={(list) => { setPage(null); save({ group_rules: list.length ? list : null }).then((ok) => { if (ok) appSnack(list.length ? 'Rules saved' : 'Rules removed'); }); }} />}
      {page === 'questions' && <G1ListEditor title="Join questions" subtitle={group.name} items={qs} max={3} maxLen={100} placeholder="How did you find us?" addLabel="Add a question" hint="People asking to join answer these. Only admins and moderators see the answers." onClose={() => setPage(null)} onSave={(list) => { setPage(null); save({ join_questions: list.length ? list : null }).then((ok) => { if (ok) appSnack(list.length ? 'Questions saved' : 'Questions removed'); }); }} />}
    </>
  );
}
function CrEntryPriceSection({ group, isOwner, onPatchGroup }) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const price = group && group.entry_price ? Number(group.entry_price) : null;
  if (!isOwner || !group) return null;
  return (
    <>
      <DetailSection title="Paid entry">
        <DetailRow icon={<CoinIcon size={20} />} label="Entry price" sub={price ? `People pay once to join. You get ${coinsText(crCut(price))} each.` : 'Ask a one time price to join with the link'} value={price ? coinsText(price) : 'Off'} onClick={() => { hapticTap(); setOpen(true); }} last />
      </DetailSection>
      {open && <CrEntryPriceSheet group={group} onClose={() => setOpen(false)} onPatchGroup={onPatchGroup} />}
    </>
  );
}
function CrEntryPriceSheet({ group, onClose, onPatchGroup }) {
  const { theme } = useTheme();
  const before = group.entry_price ? Number(group.entry_price) : null;
  const [price, setPrice] = useState(before);
  const save = async () => {
    onClose();
    if (price === before) return;
    if (onPatchGroup) onPatchGroup({ entry_price: price });
    hapticTap();
    const r = await crCall('zchat_cr_group_price', { p_group: group.id, p_price: price });
    if (!r.ok) { if (onPatchGroup) onPatchGroup({ entry_price: before }); appSnack(r.reason || 'That did not save. Try again.'); return; }
    appSnack(price ? `Entry price set to ${coinsText(price)}` : 'Entry price turned off');
  };
  return (
    <CrSheet title="Entry price" sub={group.name} onClose={onClose} z={790} avatar={<GroupAvatar avatar={group.avatar} name={group.name} size={40} />} footer={<BigButton label="Save" onClick={save} />}>
      <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 12px' }}>{`People see the price on the invite page and pay once to join. ZChat keeps ${CR_SHARE} percent and you get the rest a day after they join.`}</div>
      <CrPriceList list={CR_PRICES.group} value={price} onChange={setPrice} off="Free to join" />
      <CrNote>If you remove someone within a day of joining, they get their coins back. People you add yourself join for free.</CrNote>
    </CrSheet>
  );
}

export function GroupSettingsPanel({ group, myId, isAdmin, isOwner, isMuted, onSetMute, isPinned, onTogglePin, onClose, onLeave, onDeleteGroup, onOpenAdmins, onOpenEdit, disappearSecs, onSetDisappear, topicsCount, onOpenTopics, pendingJoins, onOpenJoinRequests, onJoinApproval, isMod, community, onOpenCommunity, onPatchGroup }) {
  useBackClose(true, onClose);
  const [showDisappear, setShowDisappear] = useState(false);
  const { theme } = useTheme();
  const [showMuteOptions, setShowMuteOptions] = useState(false);
  useBackClose(showMuteOptions, () => setShowMuteOptions(false));
  const [addPolicy, setAddPolicy] = useState(group.add_members_policy || 'everyone');
  const [sendPolicy, setSendPolicy] = useState(group.send_policy || 'everyone');
  const [slowSecs, setSlowSecs] = useState(Number(group.slow_secs || 0));
  const [mentionAll, setMentionAll] = useState(group.mention_all || 'everyone');
  const [slowSheet, setSlowSheet] = useState(false);
  const [mentionSheet, setMentionSheet] = useState(false);
  const [inviteCode, setInviteCode] = useState(group.invite_code || '');
  const [inviteEnabled, setInviteEnabled] = useState(group.invite_enabled !== false);
  const [joinApproval, setJoinApproval] = useState(!!group.join_approval);
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase.from('messages').select('sender_id, created_at').eq('group_id', group.id).gte('created_at', since).order('created_at', { ascending: false }).limit(500);
      if (!alive) return;
      const rows = data || [];
      const counts = {};
      rows.forEach((r) => { if (r.sender_id) counts[r.sender_id] = (counts[r.sender_id] || 0) + 1; });
      const topId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null;
      let topProfile = null;
      if (topId) {
        const { data: prof } = await supabase.from('profiles').select('id, name, username').eq('id', topId).maybeSingle();
        topProfile = prof;
      }
      setActivity({
        weekCount: rows.length,
        top: topProfile ? { name: topProfile.name || topProfile.username, count: counts[topId] } : null,
        lastActivity: rows[0] ? rows[0].created_at : null,
      });
    })();
    return () => { alive = false; };
  }, [group.id]);

  const announce = !!(community && community.announce_id === group.id);
  const savePolicy = async (field, value, setter, before) => {
    setter(value);
    const r = await groupWrite(group.id, { [field]: value });
    if (!r.ok) { setter(before); appSnack(r.reason || friendlyError(r.error, "Couldn't save that. Try again.")); return; }
    if (onPatchGroup) onPatchGroup({ [field]: value });
  };
  const resetInvite = async (quiet) => {
    const before = inviteCode;
    const fresh = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, '0')).join('');
    setInviteCode(fresh);
    const r = await groupWrite(group.id, { invite_code: fresh });
    if (!r.ok) { setInviteCode(before); if (!quiet) appSnack(r.reason || friendlyError(r.error, "Couldn't reset the link. Try again.")); return; }
    if (onPatchGroup) onPatchGroup({ invite_code: fresh });
    if (!quiet) { hapticTap(); appSnack('New link ready. The old one stops working.'); }
  };
  const toggleInvite = async () => {
    const next = !inviteEnabled;
    setInviteEnabled(next);
    const r = await groupWrite(group.id, { invite_enabled: next });
    if (!r.ok) { setInviteEnabled(!next); appSnack(r.reason || friendlyError(r.error, "Couldn't change the link. Try again.")); return; }
    if (onPatchGroup) onPatchGroup({ invite_enabled: next });
  };
  useEffect(() => { if (isAdmin && !announce && !inviteCode) resetInvite(true); }, []);
  const copyInvite = async () => {
    if (!inviteCode) return;
    const link = `${siteOrigin()}/?join=${inviteCode}`;
    try { if (navigator.share) await navigator.share({ title: `Join ${group.name} on ZChat`, text: `Join the group ${group.name} on ZChat`, url: link }); else { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } } catch {}
  };
  const doDelete = async () => {
    if (busy) return;
    setBusy(true);
    await onDeleteGroup();
  };

  const muteLabel = isMuted === true ? 'Muted' : isMuted ? `Muted until ${fmtDate(new Date(isMuted), { month: 'short', day: 'numeric' })}` : 'Off';

  const c = igPalette(theme);
  const segRow = (label, value, onPick) => (
    <div style={{ padding: '13px 14px 14px' }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', height: 36, padding: 3, borderRadius: 10, boxSizing: 'border-box', background: theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(17,17,19,0.06)' }}>
        {[['everyone', 'Everyone'], ['admins', 'Admins only']].map(([val, lab]) => {
          const on = value === val;
          return (
            <div key={val} role="button" aria-label={`${label} ${lab}`} aria-pressed={on} onClick={() => { if (!on) hapticTap(); onPick(val); }} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              color: on ? theme.ink : theme.muted, background: on ? (theme.dark ? '#3A3941' : '#FFFFFF') : 'transparent', boxShadow: on ? '0 1px 4px rgba(0,0,0,0.14)' : 'none', transition: 'background 160ms ease, color 160ms ease',
            }}>{lab}</div>
          );
        })}
      </div>
    </div>
  );
  return (
    <>
    <WideDim onClose={onClose} z={34} />
    <div style={{ position: 'fixed', inset: 0, background: c.bg, color: c.fg, zIndex: 34, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Group settings" onBack={onClose} />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(28px + env(safe-area-inset-bottom))' }}>
        <DetailSection title="Your settings">
          {detailRows([
            <DetailRow icon={isMuted ? <BellOff /> : <Bell />} label="Mute notifications" value={muteLabel} onClick={() => setShowMuteOptions(true)} />,
            <DetailRow icon={<Pin_ color="currentColor" />} label="Pin group" onClick={onTogglePin} right={<IgToggle on={!!isPinned} />} />,
            <DetailRow icon={<Timer />} label="Disappearing messages" value={disappearLabel(disappearSecs)} onClick={() => setShowDisappear(true)} />,
          ])}
        </DetailSection>
        {showDisappear && <DisappearSheet value={disappearSecs} subject="this group" canEdit={isAdmin} onPick={onSetDisappear} onClose={() => setShowDisappear(false)} />}

        {announce && (
          <DetailSection title="Community">
            {detailRows([
              <DetailRow icon={<CommunityGlyph />} label={community.name} sub="Members, groups and the invite link live on the community page" onClick={() => onOpenCommunity({})} />,
              isAdmin ? <DetailRow icon={<Pencil />} label="Edit name, photo and description" onClick={() => onOpenCommunity({ edit: true })} /> : null,
            ])}
          </DetailSection>
        )}
        {isMod && !isAdmin && !announce && joinApproval && (
          <DetailSection title="New members">
            <DetailRow icon={<Users />} label="Join requests" value={pendingJoins ? String(pendingJoins) : 'None'} onClick={onOpenJoinRequests} last />
          </DetailSection>
        )}
        {isAdmin && !announce && (
          <>
            <DetailSection title="Admin controls">
              {detailRows([
                <DetailRow icon={<Pencil />} label="Edit name, photo and description" onClick={onOpenEdit} />,
                <DetailRow icon={<ShieldCheck />} label="Manage members and admins" onClick={onOpenAdmins} />,
                <DetailRow icon={<TopicHashIcon />} label="Topics" sub="Split the chat into subjects" value={topicsCount ? String(topicsCount) : 'Off'} onClick={onOpenTopics} />,
              ])}
            </DetailSection>
            <DetailSection title="Permissions">
              {segRow('Who can add members', addPolicy, (val) => savePolicy('add_members_policy', val, setAddPolicy, addPolicy))}
              <div style={{ height: 1, background: theme.border, marginLeft: 14 }} />
              {segRow('Who can send messages', sendPolicy, (val) => savePolicy('send_policy', val, setSendPolicy, sendPolicy))}
              <div style={{ height: 1, background: theme.border, marginLeft: 14 }} />
              <DetailRow icon={<Timer />} label="Slow mode" sub="Members wait between messages" value={slowModeLabel(slowSecs)} onClick={() => setSlowSheet(true)} />
              <DetailRow icon={<AtSign />} label="Mention everyone" sub="Who can use @everyone" value={mentionAll === 'admins' ? 'Admins only' : 'Everyone'} onClick={() => setMentionSheet(true)} last />
            </DetailSection>
            <G1SettingsBlock group={group} isOwner={isOwner} onPatchGroup={onPatchGroup} />
            <DetailSection title="Invite link">
              <DetailRow icon={<LinkIcon />} label="Invite link" sub={inviteEnabled ? 'Anyone with the link can join' : 'Turned off'} onClick={toggleInvite} right={<IgToggle on={inviteEnabled} />} last={!inviteEnabled} />
              {inviteEnabled && (
                <>
                  <div style={{ position: 'relative', padding: '0 14px 12px 46px' }}>
                    <div style={{ fontSize: 13, color: c.dim, wordBreak: 'break-all', lineHeight: 1.4 }}>{inviteCode ? `${siteOrigin()}/?join=${inviteCode}` : 'Making your link'}</div>
                    <div style={{ position: 'absolute', left: 46, right: 0, bottom: 0, height: 1, background: theme.border }} />
                  </div>
                  {[['Share invite link', copied ? 'Copied' : 'Share link', copied ? <Check size={20} /> : <Share2 size={20} />, copyInvite, kitOnInk(theme), false], ['Reset invite link', 'Reset link', <Repeat size={20} />, () => resetInvite(false), theme.danger, true]].map(([aria, lab, icon, fn, tint, last]) => (
                    <div key={aria} role="button" aria-label={aria} onClick={fn} className="zchat-row-press" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 50, padding: '0 14px', cursor: 'pointer' }}>
                      <span style={{ display: 'flex', color: tint, flexShrink: 0 }}>{icon}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: tint }}>{lab}</span>
                      {!last && <div style={{ position: 'absolute', left: 46, right: 0, bottom: 0, height: 1, background: theme.border }} />}
                    </div>
                  ))}
                </>
              )}
            </DetailSection>
            <G2LinksSection group={group} enabled={inviteEnabled} />
            <DetailSection title="New members">
              <DetailRow icon={<UserPlus />} label="Approve new members" sub="An admin says yes before people join with the link" onClick={async () => { const next = !joinApproval; setJoinApproval(next); const ok = await onJoinApproval(next); if (!ok) setJoinApproval(!next); }} right={<IgToggle on={joinApproval} />} last={!joinApproval} />
              {joinApproval && <DetailRow icon={<Users />} label="Join requests" value={pendingJoins ? String(pendingJoins) : 'None'} onClick={onOpenJoinRequests} last />}
            </DetailSection>
            <CrEntryPriceSection group={group} isOwner={isOwner} onPatchGroup={onPatchGroup} />
          </>
        )}

        <DetailSection title="Activity">
          {activity === null ? (
            <div style={{ padding: 20, textAlign: 'center' }}><Spinner size={18} color={c.dim} /></div>
          ) : detailRows([
            activity.top ? <DetailRow icon={<Users />} label="Most active this week" sub={`${activity.top.name}, ${countWord(activity.top.count, 'message', 'messages')}`} /> : null,
            <DetailRow icon={<Clock />} label="Last activity" sub={activity.lastActivity ? timeAgoLong(activity.lastActivity) : 'No messages this week'} />,
          ])}
        </DetailSection>

        <DetailSection>
          {detailRows([
            announce ? <DetailRow icon={<LogOut />} label="Leave community" danger onClick={() => onOpenCommunity({ leave: true })} /> : <DetailRow icon={<LogOut />} label="Leave group" danger onClick={onLeave} />,
            isOwner && !announce ? <DetailRow icon={<Trash2 />} label="Delete group" danger onClick={() => setConfirmDelete(true)} /> : null,
          ])}
        </DetailSection>
      </div>

      {showMuteOptions && (() => {
        const forever = isMuted === true || (!!isMuted && new Date(isMuted).getFullYear() >= 2900);
        const opts = [['Off', null, <Bell size={20} />], ['8 hours', 8 * 3600000, <Clock size={20} />], ['1 week', 7 * 86400000, <CalendarIcon size={20} />], ['Always', 'forever', <BellOff size={20} />]];
        return (
          <div onClick={() => setShowMuteOptions(false)} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '0 16px calc(12px + env(safe-area-inset-bottom))', boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 8px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
              <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink, padding: '2px 4px 0' }}>Mute notifications</div>
              <div style={{ fontSize: 13, color: theme.muted, padding: '3px 4px 6px' }}>{isMuted && !forever ? muteLabel : 'How long the group stays quiet for you'}</div>
              <ChoiceList label="Mute for" value={!isMuted ? 'Off' : forever ? 'Always' : null}
                onChange={(k) => { const ms = (opts.find((o) => o[0] === k) || [])[1]; onSetMute(ms === 'forever' ? new Date('2999-01-01').toISOString() : ms ? new Date(Date.now() + ms).toISOString() : null); setShowMuteOptions(false); }}
                options={opts.map(([l, , icon]) => ({ k: l, label: l, icon }))} />
            </div>
          </div>
        );
      })()}

      {slowSheet && <SlowModeSheet value={slowSecs} onClose={() => setSlowSheet(false)} onPick={(v) => savePolicy('slow_secs', v, setSlowSecs, slowSecs)} />}
      {mentionSheet && <MentionAllSheet value={mentionAll} onClose={() => setMentionSheet(false)} onPick={(v) => savePolicy('mention_all', v, setMentionAll, mentionAll)} />}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${group.name}?`}
          body="This removes the group and its messages for everyone. This can't be undone."
          confirmLabel="Delete group"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={doDelete}
        />
      )}
    </div>
    </>
  );
}
function G2KeywordSettings({ uid }) {
  const { theme } = useTheme();
  useG2Kw(uid);
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState(() => { const n = {}; const list = homeSnapPart(uid, 'groups', []); (Array.isArray(list) ? list : []).forEach((g) => { if (g && g.id) n[g.id] = { id: g.id, name: g.name, avatar: g.avatar }; }); return n; });
  const [edit, setEdit] = useState(null);
  useBackClose(open && !edit, () => setOpen(false));
  const gids = Object.keys(g2Kw.uid === uid ? g2Kw.rows : {});
  const key = gids.slice().sort().join(',');
  useEffect(() => {
    if (!open || !gids.length) return undefined;
    let alive = true;
    supabase.from('groups').select('id, name, avatar').in('id', gids).then(({ data }) => { if (alive && data) setNames((cur) => { const n = { ...cur }; data.forEach((g) => { n[g.id] = g; }); return n; }); }, () => {});
    return () => { alive = false; };
  }, [open, key]);
  const total = gids.reduce((t, g) => t + g2KwOf(g).length, 0);
  return (
    <>
      <SettingsRowPlain icon={<Bell size={16} />} label="Keyword alerts" value={gids.length ? countWord(gids.length, 'group', 'groups') : 'Off'} onClick={() => setOpen(true)} />
      {open && (
        <FullPage title="Keyword alerts" subtitle={total ? countWord(total, 'word', 'words') : undefined} onBack={() => setOpen(false)} zIndex={80}>
          {!gids.length ? (
            <EmptyState art="bell" title="No keyword alerts" text="Open a group, tap its name, then Alert me about to pick words that always notify you there." />
          ) : gids.map((g, i) => {
            const grp = names[g] || { id: g, name: 'Group' };
            return (
              <div key={g} role="button" aria-label={`Words for ${grp.name}`} onClick={() => setEdit(grp)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 2px', cursor: 'pointer', borderBottom: i < gids.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                <GroupAvatar avatar={grp.avatar} name={grp.name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{grp.name}</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{g2KwOf(g).join(', ')}</div>
                </div>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            );
          })}
        </FullPage>
      )}
      {open && edit && <G2KeywordsPage group={edit} myId={uid} onClose={() => setEdit(null)} />}
    </>
  );
}

function PrivacyField({ label, hidden, onToggle, last }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label={label} onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 2px', borderBottom: last ? 'none' : `1px solid ${theme.border}`, cursor: 'pointer' }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</span>
      <ToggleSwitch on={!hidden} onClick={(e) => { e.stopPropagation(); onToggle(); }} />
    </div>
  );
}

export function AccountPrivacyPanel({ profile, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [isPrivate, setIsPrivate] = useState(profile.is_private || false);
  const [hidePhoto, setHidePhoto] = useState(profile.hide_photo || false);
  const [hideBio, setHideBio] = useState(profile.hide_bio || false);
  const [hideGender] = useState(profile.hide_gender || false);
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
    if (data) { onSaved({ ...profile, ...data }); onClose(); }
  };

  const dirty = isPrivate !== !!profile.is_private || hidePhoto !== !!profile.hide_photo || hideBio !== !!profile.hide_bio || hideGender !== !!profile.hide_gender || hideAge !== !!profile.hide_age || hideCountry !== !!profile.hide_country;
  return (
    <FullPage title="Privacy" onBack={onClose} zIndex={60}
      footer={<button onClick={save} disabled={saving || !dirty} className="zchat-press" style={{ ...primaryBtn(theme, saving || !dirty) }}>{saving ? <Spinner /> : 'Save changes'}</button>}>
      <div style={{ marginTop: 6 }}>
        <div role="button" aria-label="Private account" onClick={() => setIsPrivate((s) => !s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 2px', cursor: 'pointer' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Private account</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>New followers need your approval before they see your posts</div>
          </div>
          <ToggleSwitch on={isPrivate} onClick={(e) => { e.stopPropagation(); setIsPrivate((s) => !s); }} />
        </div>
      </div>
      <div style={{ padding: '22px 2px 4px', fontSize: 13, fontWeight: 600, color: theme.muted }}>Visible to others</div>
      <div>
        <PrivacyField label="Profile photo" hidden={hidePhoto} onToggle={() => setHidePhoto((s) => !s)} />
        <PrivacyField label="Bio" hidden={hideBio} onToggle={() => setHideBio((s) => !s)} />
        <PrivacyField label="Age" hidden={hideAge} onToggle={() => setHideAge((s) => !s)} />
        <PrivacyField label="Country" hidden={hideCountry} onToggle={() => setHideCountry((s) => !s)} last />
      </div>
      <div style={{ padding: '14px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.6 }}>Switch something off and it disappears from your profile for everyone except you.</div>
    </FullPage>
  );
}
function guestbookOpen(owner) {
  if (!owner || !owner.id) return;
  gbOpen.job = owner;
  gbOpen.subs.forEach((f) => { try { f(); } catch {} });
}
const GB_WHO = [['everyone', 'Everyone'], ['followers', 'Your followers'], ['following', 'People you follow'], ['nobody', 'No one']];

const BREAK_QUIET = [[24, 'A day'], [72, '3 days'], [168, 'A week'], [336, '2 weeks'], [0, 'Until I come back']];
function TakeBreakPage({ onClose, onStarted }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [quiet, setQuiet] = useState(168);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase.rpc('zchat_break_start', { p_quiet_hours: quiet });
    if (error) { setBusy(false); setAsk(false); appSnack(profileFnMissing(error) ? 'Take a break switches on once the latest ZChat setup is finished.' : friendlyError(error, 'Your break could not start. Try again.')); return; }
    hapticTap();
    onStarted();
  };
  const rows = [
    [<Moon key="a" />, 'Your profile says you are taking a break'],
    [<EyeOff key="b" />, 'Your posts and stories are hidden'],
    [<MessageSquare key="c" />, 'People cannot send you new messages'],
    [<LogOut key="d" />, 'You are logged out on every device'],
    [<Undo2 key="e" />, 'Log back in whenever you like. That ends your break.'],
  ];
  return (
    <FullPage title="Take a break" subtitle="Step away for a while" onBack={onClose} zIndex={70}
      footer={<BigButton label="Take a break" onClick={() => { hapticTap(); setAsk(true); }} />}>
      <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.55, padding: '14px 2px 6px' }}>Your chats stay just as they are for everyone else. Here is what happens while you are away.</div>
      <div role="list" aria-label="What happens on a break">
        {rows.map(([icon, text]) => (
          <div key={text} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 50, fontSize: 15, color: theme.ink }}>
            <span style={{ width: 24, display: 'flex', justifyContent: 'center', color: kitOnInk(theme), flexShrink: 0 }}>{React.cloneElement(icon, { size: 21, strokeWidth: 1.9 })}</span>
            <span style={{ lineHeight: 1.35 }}>{text}</span>
          </div>
        ))}
      </div>
      <KitSection title="Keep notifications quiet for">
        <ChoiceList label="Keep notifications quiet for" value={quiet} onChange={setQuiet} options={BREAK_QUIET.map(([h, l]) => ({ k: h, label: l, sub: h === 0 ? 'Nothing reaches you until you log back in' : null }))} />
        {quiet !== 0 && <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, marginTop: 6 }}>After that, notifications from your groups can reach you again as a gentle reminder.</div>}
      </KitSection>
      {ask && <ConfirmSheet title="Take a break now?" text="You will be logged out on every device. Log back in any time to come back." confirmLabel={busy ? 'Starting' : 'Take a break'} danger={false} busy={busy} onConfirm={go} onCancel={() => { if (!busy) setAsk(false); }} zIndex={140} />}
    </FullPage>
  );
}

function GuestbookPrivacyRow({ uid }) {
  const [who, setWho] = useState(() => { try { return localStorage.getItem(`zchat-gb-who-${uid}`) || 'followers'; } catch { return 'followers'; } });
  const [open, setOpen] = useState(false);
  const remember = (v) => { try { localStorage.setItem(`zchat-gb-who-${uid}`, v); } catch {} };
  useEffect(() => {
    let alive = true;
    supabase.from('zchat_guestbook_prefs').select('who').eq('user_id', uid).maybeSingle().then(({ data, error }) => {
      if (!alive || error) return;
      const v = (data && data.who) || 'followers';
      setWho(v);
      remember(v);
    }, () => {});
    return () => { alive = false; };
  }, [uid]);
  const pick = async (v) => {
    setOpen(false);
    const before = who;
    if (v === before) return;
    setWho(v);
    remember(v);
    const { error } = await supabase.from('zchat_guestbook_prefs').upsert({ user_id: uid, who: v, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { setWho(before); remember(before); appSnack(friendlyError(error, "Couldn't save that. Try again.")); return; }
    guestbookMem.delete(uid);
  };
  const label = (GB_WHO.find(([k]) => k === who) || GB_WHO[1])[1];
  return (
    <>
      <IgRow inset={false} icon={<GuestbookIcon size={16} />} label="Guestbook" sub="Who can leave you notes" value={label} onClick={() => setOpen(true)} />
      {open && <ChoiceSheet title="Guestbook" sub="Who can write notes on your profile. You still choose which notes show." options={GB_WHO} value={who} onPick={pick} onClose={() => setOpen(false)} />}
    </>
  );
}

const AUTO_DL_KINDS = [['photo', 'Photos'], ['video', 'Videos'], ['voice', 'Voice messages'], ['file', 'Files']];
function setAutoDl(kind, choice) {
  const next = { ...autoDlCfg(), [kind]: choice };
  autoDlMem.cfg = next;
  try { localStorage.setItem('zchat-auto-download', JSON.stringify(next)); } catch {}
  autoDlPing();
}
export function ThemePreviewPage({ me, k, startDark = true, onClose, action }) {
  useBackClose(true, onClose);
  const spec = PROFILE_THEMES[k];
  const [dark, setDark] = useState(!!startDark);
  if (!spec) return null;
  const r = RARITY_STYLE[spec.rarity] || RARITY_STYLE.epic;
  const page = dark ? '#0C0C0E' : '#FFFFFF';
  const bg = dark ? '12,12,14' : '255,255,255';
  const mask = 'linear-gradient(180deg, #000 0px, #000 calc(100% - 190px), rgba(0,0,0,0.5) calc(100% - 90px), transparent 100%)';
  const scrim = `linear-gradient(180deg, rgba(${bg},0.3) 0px, rgba(${bg},0) 84px, rgba(${bg},0.06) 46%, rgba(${bg},${dark ? 0.4 : 0.5}) calc(100% - 150px), rgba(${bg},0.7) 100%)`;
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 905, background: page, transition: 'background 0.25s ease', fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 'calc(470px + env(safe-area-inset-top))', overflow: 'hidden', background: themeFallback(k, dark), WebkitMaskImage: mask, maskImage: mask }}>
          <ThemeCanvas k={k} dark={dark} still={reducedMotion()} />
          <div style={{ position: 'absolute', inset: 0, background: scrim }} />
        </div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
          <div role="button" aria-label="Close preview" onClick={onClose} className="zchat-press" style={{ width: 38, height: 38, borderRadius: 19, background: dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)', color: dark ? '#FFFFFF' : '#111113', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={19} /></div>
          <div style={{ flex: 1, minWidth: 0, color: dark ? '#FFFFFF' : '#111113' }}>
            <div style={{ fontSize: 16, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</div>
            <div style={{ fontSize: 12.5, fontWeight: 650, color: dark ? r.color : mixHex(r.color, '#000000', 0.62) }}>{r.label} theme</div>
          </div>
          <div role="tablist" aria-label="Day or night" style={{ position: 'relative', display: 'flex', width: 132, height: 34, padding: 3, boxSizing: 'border-box', borderRadius: 17, flexShrink: 0, background: dark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.72)' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: 3, bottom: 3, left: 3, width: 'calc(50% - 3px)', borderRadius: 14, background: dark ? 'rgba(255,255,255,0.2)' : '#FFFFFF', boxShadow: dark ? 'none' : '0 1px 4px rgba(0,0,0,0.12)', transform: `translateX(${dark ? 100 : 0}%)`, transition: reducedMotion() ? 'none' : 'transform 0.25s cubic-bezier(0.25, 0.85, 0.3, 1)' }} />
            {[['day', 'Day', false], ['night', 'Night', true]].map(([v, l, d]) => (
              <div key={v} role="tab" aria-selected={dark === d} aria-label={l} onClick={() => { if (dark !== d) { hapticTap(); setDark(d); } }} style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer', color: dark ? (dark === d ? '#FFFFFF' : 'rgba(255,255,255,0.7)') : (dark === d ? '#111113' : 'rgba(17,17,19,0.6)') }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ThemeMockProfile me={me} dark={dark} nsKey={cxNs(me)} />
          <div style={{ padding: '120px 22px 8px', fontSize: 13.5, lineHeight: 1.5, color: dark ? 'rgba(235,235,245,0.62)' : 'rgba(17,17,19,0.58)', textWrap: 'pretty' }}>{spec.about} People see the day version in light mode and the night version in dark mode.</div>
        </div>
        {action && (
          <div style={{ position: 'relative', zIndex: 2, padding: '12px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
            <button type="button" disabled={!!action.disabled} onClick={action.onClick} className="zchat-press" style={{ width: '100%', height: 52, borderRadius: 15, border: 'none', background: action.disabled ? (dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,19,0.07)') : '#1D7BF0', color: action.disabled ? (dark ? 'rgba(235,235,245,0.62)' : 'rgba(17,17,19,0.55)') : '#FFFFFF', fontFamily: FONT, fontSize: 16, fontWeight: 650, cursor: action.disabled ? 'default' : 'pointer' }}>{action.label}</button>
          </div>
        )}
      </div>
    </Portal>
  );
}
function setQuickReactions(a) { try { localStorage.setItem('zchat-quick-reactions', JSON.stringify(a)); } catch {} }
const LABS = [
  { k: 'call_blur', t: 'Background blur in video calls', d: 'Your video calls start with what is behind you softened, so the call is about you and not your room. You can still change it in Call settings. Hair and hands can look a little soft at the edges, and older phones may get warm.' },
  { k: 'call_captions', t: 'Live captions in calls', d: 'Your calls start with captions on, so what people say shows as words at the bottom. It is still learning, so names, slang and quiet voices can come out wrong.' },
];
function AxTabsRow() {
  const { theme } = useTheme();
  const ax = useAx();
  const [open, setOpen] = useState(false);
  const tabs = axTabsOf(ax);
  return (
    <KitSection title="Tab bar" right={countWord(tabs.length, 'tab', 'tabs')} style={{ marginTop: 26 }}>
      <div role="button" aria-label="Edit your tabs" onClick={() => { hapticTap(); setOpen(true); }} className="zchat-press" style={{ cursor: 'pointer' }}>
        <AxTabsPreview tabs={tabs} />
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', lineHeight: 1.45 }}>Tap to choose your tabs and their order. You can also press and hold the tab bar.</div>
      {open && <EditTabsPage onClose={() => setOpen(false)} />}
    </KitSection>
  );
}
const FRIEND_EMOJI_INFO = [
  ['\u{1F49B}', 'Best friends', "You are each other's number one"],
  ['\u{1F60A}', 'Close friend', 'One of the people you talk to most'],
  ['\u{1F60F}', 'Their best friend', 'You are their number one, but they are not yours'],
  ['\u{1F525}', 'Streak', 'You both sent a message every day'],
  ['\u{1F4AF}', 'Hundred days', 'A streak of 100 days or more'],
  ['⏳', 'Streak ending', 'Send a message today to keep it'],
  ['\u{1F382}', 'Birthday', 'It is their birthday today'],
];

const AWAY_PRESETS = ['I am away right now and will reply when I am back.', 'On holiday for a few days. I will get back to you soon.', 'Busy at the moment, I will reply later today.', 'Driving now, talk soon.'];
function AwayMessagePage({ me, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [on, setOn] = useState(!!(me && me.away_on));
  const [text, setText] = useState((me && me.away_text) || AWAY_PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);
  const save = async (nextOn) => {
    if (busy) return;
    const clean = text.trim().slice(0, 300);
    if (nextOn && !clean) { setErr('Write your away message first'); return; }
    setErr('');
    const patch = { away_on: !!nextOn, away_text: clean || null };
    const before = { away_on: !!(me && me.away_on), away_text: (me && me.away_text) || null };
    const wasOn = on;
    setOn(!!nextOn);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
    onSaved(patch);
    const { error } = await supabase.from('profiles').update(patch).eq('id', me.id);
    if (error) {
      setOn(wasOn);
      setSaved(false);
      onSaved(before);
      setErr(/away|column|schema/i.test(String(error.message || '')) ? 'Away messages switch on once the latest ZChat setup is finished.' : 'That could not be saved. Try again.');
    }
  };
  return (
    <FullPage title="Away message" onBack={onClose} zIndex={72} footer={<BigButton label={busy ? 'Saving' : saved ? 'Saved' : 'Save message'} disabled={busy} onClick={() => save(on)} />}>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>When this is on, people who message you get this reply. Each person gets it at most once every 6 hours. Groups never get it.</div>
      <IgRow inset={false} icon={<Clock size={16} />} label="Send away message" sub={on ? 'On' : 'Off'} right={<IgToggle on={on} onClick={() => save(!on)} />} />
      <IgHeading>Message</IgHeading>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} rows={4} aria-label="Away message text" style={{ ...inputStyle(theme), resize: 'none', fontFamily: FONT }} />
      <div style={{ textAlign: 'right', fontSize: 12, color: theme.muted, padding: '4px 2px 0' }}>{text.length}/300</div>
      <IgHeading>Quick picks</IgHeading>
      {AWAY_PRESETS.map((t) => (
        <div key={t} role="button" aria-label={`Use ${t}`} onClick={() => { setText(zt(t)); hapticTap(); }} className="zchat-row-press" style={{ padding: '12px 2px', borderBottom: `1px solid ${theme.border}`, fontSize: 14, color: theme.ink, cursor: 'pointer', lineHeight: 1.4 }}>{t}</div>
      ))}
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
    </FullPage>
  );
}

const SLOW_MODE_STEPS = [[0, 'Off'], [10, '10 seconds'], [30, '30 seconds'], [60, '1 minute'], [300, '5 minutes'], [900, '15 minutes'], [3600, '1 hour']];
function slowModeLabel(secs) {
  const hit = SLOW_MODE_STEPS.find(([v]) => v === Number(secs || 0));
  if (hit) return hit[1];
  const s = Number(secs || 0);
  return s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`;
}
function SlowModeSheet({ value, onPick, onClose }) {
  const { theme } = useTheme();
  return (
    <ChatRowSheet title="Slow mode" subtitle="Members wait between messages. Admins are not slowed." onClose={onClose} zIndex={96}
      actions={SLOW_MODE_STEPS.map(([v, l]) => ({ label: l, icon: <Timer size={18} />, onClick: () => onPick(v), right: Number(value || 0) === v ? <Check size={18} color={theme.coral} strokeWidth={2.6} /> : null }))} />
  );
}
function MentionAllSheet({ value, onPick, onClose }) {
  const { theme } = useTheme();
  return (
    <ChatRowSheet title="Who can mention everyone" subtitle="Typing @everyone notifies the whole group" onClose={onClose} zIndex={96}
      actions={[['everyone', 'Everyone'], ['admins', 'Admins only']].map(([v, l]) => ({ label: l, icon: <AtSign size={18} />, onClick: () => onPick(v), right: (value || 'everyone') === v ? <Check size={18} color={theme.coral} strokeWidth={2.6} /> : null }))} />
  );
}
function crNoteTarget(r, onOpenChat, onOpenWallet) {
  const ev = r.meta && r.meta.ev;
  if (['msg_paid', 'msg_refund', 'shout_done'].includes(ev) && r.profile && onOpenChat) return () => onOpenChat(r.profile);
  if (['shout_order', 'member_join', 'pack_sold', 'pack_live', 'pack_rejected', 'entry_paid'].includes(ev)) return () => crOpen('hub');
  if (['member_soon', 'member_ended', 'member_closed', 'shout_declined', 'shout_refund'].includes(ev) && r.profile) return () => crOpen('creator', { profile: r.profile });
  return onOpenWallet ? () => onOpenWallet() : null;
}
function liveNotifPlanText(r, who, theme) {
  const m = r.meta || {};
  const t = r.text ? String(r.text).slice(0, 80) : '';
  const gn = m.gname ? <b style={{ fontWeight: 700, color: theme.ink }}>{String(m.gname).slice(0, 60)}</b> : 'your group';
  if (r.kind === 'plan_soon') return m.kind === 'room' ? <>The voice room in {gn} starts in 10 minutes{t ? `: ${t}` : '.'}</> : <>{who} goes live in 10 minutes{t ? `: ${t}` : '.'}</>;
  if (r.kind === 'plan_start') return m.kind === 'room' ? <>It is time for your room in {gn}{t ? `: ${t}` : ''}. Tap to start it.</> : <>It is time for your live{t ? `: ${t}` : ''}. Tap to go live.</>;
  if (r.kind === 'plan_live') return <>{who} started the voice room in {gn}{t ? `: ${t}` : '.'}</>;
  if (r.kind === 'plan_off') return m.kind === 'room' ? <>{who} called off the room in {gn}{t ? `: ${t}` : '.'}</> : <>{who} called off their live{t ? `: ${t}` : '.'}</>;
  if (r.kind === 'live_thanks') return <>{who} thanked you for supporting their live{t ? `: ${t}` : '.'}</>;
  return null;
}
function liveNotifPlanTarget(r, onOpenGroup, onClose) {
  const m = r.meta || {};
  if (!/^plan_/.test(String(r.kind || ''))) return undefined;
  if (m.kind === 'room' && m.group) return onOpenGroup ? () => onOpenGroup(m.group) : null;
  if (m.plan && r.kind !== 'plan_off') return () => { if (onClose) onClose(); setTimeout(() => openPlanById(m.plan), 0); };
  return undefined;
}

async function linkGoogleWithTap() {
  try {
    const rawNonce = randomNonce();
    const hashedNonce = await sha256Hex(rawNonce);
    await loadGoogleIdentityScript();
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return 'skip';
    return await new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true,
        callback: async (response) => {
          try {
            const { error } = await supabase.auth.linkIdentity({ provider: 'google', token: response.credential, nonce: rawNonce });
            finish(error || 'linked');
          } catch (err) { finish(err || 'skip'); }
        },
      });
      window.google.accounts.id.prompt((n) => {
        if ((n.isNotDisplayed && n.isNotDisplayed()) || (n.isSkippedMoment && n.isSkippedMoment())) setTimeout(() => finish('skip'), 50);
      });
      setTimeout(() => finish('skip'), 90000);
    });
  } catch { return 'skip'; }
}

export function LinkedAccountsSection({ session }) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [linkedNow, setLinkedNow] = useState(() => new Set());
  const providers = useAuthProviders();
  const identities = (session && session.user && session.user.identities) || [];
  const has = (p) => linkedNow.has(p) || identities.some((i) => i.provider === p);
  const link = async (provider) => {
    setBusy(provider);
    setNote('');
    try {
      if (!supabase.auth.linkIdentity) throw new Error('unsupported');
      if (provider === 'google') {
        const tap = await linkGoogleWithTap();
        if (tap === 'linked') {
          setBusy('');
          setLinkedNow((s) => new Set([...s, 'google']));
          try { await supabase.auth.refreshSession(); } catch {}
          return;
        }
        if (tap && tap !== 'skip') throw tap;
      }
      const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (e) {
      setBusy('');
      const msg = String((e && e.message) || '');
      setNote(/not enabled|unsupported|manual linking/i.test(msg) ? `Linking ${provider === 'apple' ? 'Apple' : 'Google'} is not switched on for ZChat yet.` : (msg || 'Could not link that account right now.'));
    }
  };
  const row = (icon, label, provider, sub) => {
    const linked = provider === 'email' ? identities.some((i) => i.provider === 'email') || !!(session && session.user && session.user.email) : has(provider);
    return (
      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 2px', borderBottom: `1px solid ${theme.border}` }}>
        <span style={{ width: 24, display: 'flex', justifyContent: 'center', color: theme.ink }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{linked ? (sub || 'Linked') : 'Not linked'}</div>
        </div>
        {linked ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 800, color: '#22c55e' }}><Check size={14} strokeWidth={3} />Linked</span>
        ) : provider === 'email' ? null : (
          <PillButton small label={busy === provider ? <Spinner size={12} /> : 'Link'} onClick={() => link(provider)} />
        )}
      </div>
    );
  };
  return (
    <div>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Ways you can log in to this ZChat account.</div>
      {row(<Mail size={20} strokeWidth={1.7} />, 'Email and password', 'email', session && session.user && session.user.email)}
      {row(<GoogleLogo size={18} />, 'Google', 'google', 'Linked')}
      {(has('apple') || (providers && providers.apple)) && row(<AppleLogo size={19} />, 'Apple', 'apple', 'Linked')}
      {note && <div style={{ padding: '12px 2px 0', fontSize: 12.5, color: theme.danger, lineHeight: 1.5 }}>{note}</div>}
    </div>
  );
}


function KeyboardIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
      <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
    </svg>
  );
}
function RingtoneList() {
  const { theme } = useTheme();
  const [ring, setRing] = useState(readRingtone);
  const pick = (k) => {
    try { if (k) localStorage.setItem('zchat-ringtone', k); else localStorage.removeItem('zchat-ringtone'); } catch {}
    setRing(k);
    hapticTap();
    if (k) spPlay(k);
  };
  return (
    <div>
      <div role="button" aria-label="Ringtone ZChat ring" onClick={() => pick(null)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
        <span style={{ width: 24, display: 'flex', justifyContent: 'center', color: theme.muted }}><Phone size={15} /></span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>ZChat ring</span>
        {!ring && <Check size={18} color={theme.coral} strokeWidth={2.6} />}
      </div>
      <SoundPackRows kind="ring" current={ring} onPick={pick} />
      <div style={{ padding: '10px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>Calls ring with this sound on the ZChat calling screen. When ZChat is fully closed, your phone uses its own ringtone.</div>
    </div>
  );
}

function fmtBytesShort(b) {
  if (b == null) return 'Unknown';
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1048576).toFixed(b < 10485760 ? 1 : 0)} MB`;
  return `${(b / 1073741824).toFixed(2)} GB`;
}
async function measureCaches() {
  let total = 0;
  try {
    if (!window.caches) return 0;
    const names = (await caches.keys()).filter((k) => !/^zchat-(shell|share|prefs)/.test(k));
    for (const n of names) {
      const c = await caches.open(n);
      const reqs = (await c.keys()).slice(0, 500);
      for (const r of reqs) {
        const res = await c.match(r);
        if (!res) continue;
        const len = Number(res.headers.get('content-length'));
        if (len) total += len; else { try { total += (await res.blob()).size; } catch {} }
      }
    }
  } catch {}
  return total;
}
async function measureLocalChats(uid) {
  const keys = await localDbKeys(`${uid}|`);
  const out = [];
  for (const k of keys.slice(0, 200)) {
    const v = await localDbGet(k);
    let size = 0;
    try { size = JSON.stringify(v || {}).length * 2; } catch {}
    out.push({ key: k, size, count: v && Array.isArray(v.rows) ? v.rows.length : 0 });
  }
  return out.sort((a, b) => b.size - a.size);
}
async function measureMediaDb() {
  const [drafts, tones] = await Promise.all([mediaDbOp('drafts', 'readonly', (s) => s.getAll()), mediaDbOp('tones', 'readonly', (s) => s.getAll())]);
  let size = 0;
  (Array.isArray(drafts) ? drafts : []).forEach((d) => (d.items || []).forEach((it) => { size += (it.file && it.file.size) || 0; }));
  (Array.isArray(tones) ? tones : []).forEach((t) => { size += (t.blob && t.blob.size) || 0; });
  return { size, drafts: Array.isArray(drafts) ? drafts.length : 0, tones: Array.isArray(tones) ? tones.length : 0 };
}

export function StorageSection({ uid: uidIn, names }) {
  const { theme } = useTheme();
  const [saver, setSaver] = usePref('zchat-data-saver');
  const [cell, setCell] = usePref('zchat-saver-cellular');
  const [keep, setKeep] = useState(() => keepChatsLocal());
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [chatsOpen, setChatsOpen] = useState(false);
  const [dlCfg, setDlCfg] = useState(() => autoDlCfg());
  const [dlPick, setDlPick] = useState(null);
  const uid = uidIn || (() => { const s = readStoredAuth(); return s && s.user ? s.user.id : null; })();
  const load = async () => {
    let usage = null; let quota = null;
    try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); usage = e.usage || 0; quota = e.quota || 0; } } catch {}
    const [cacheBytes, chats, media] = await Promise.all([measureCaches(), uid ? measureLocalChats(uid) : Promise.resolve([]), measureMediaDb()]);
    const chatBytes = chats.reduce((a, c) => a + c.size, 0);
    const ids = { dm: [], group: [] };
    chats.slice(0, 12).forEach((c) => { const [kind, id] = (String(c.key).split('|')[1] || '').split(':'); if (id && ids[kind]) ids[kind].push(id); });
    const nm = {};
    try {
      const [pr, gr] = await Promise.all([
        ids.dm.length ? supabase.from('profiles').select('id, name').in('id', ids.dm) : Promise.resolve({ data: [] }),
        ids.group.length ? supabase.from('groups').select('id, name').in('id', ids.group) : Promise.resolve({ data: [] }),
      ]);
      ((pr && pr.data) || []).forEach((x) => { nm[`dm:${x.id}`] = x.name; });
      ((gr && gr.data) || []).forEach((x) => { nm[`group:${x.id}`] = x.name; });
    } catch {}
    setInfo({ usage, quota, cacheBytes, chats, chatBytes, media, nm });
  };
  useEffect(() => { load(); }, []);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2600); };
  const clearMedia = async () => {
    setBusy('media');
    try { if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.filter((k) => !/^zchat-(shell|share|prefs)/.test(k)).map((k) => caches.delete(k))); } } catch {}
    try { Object.keys(localStorage).filter((k) => k.startsWith('zchat-img-') || k.startsWith('zchat-media-')).forEach((k) => localStorage.removeItem(k)); } catch {}
    mediaBlobCache.clear();
    setBusy('');
    flash('Photos and videos were cleared from this phone. They download again when you open them.');
    load();
  };
  const clearChats = async () => {
    if (!uid) return;
    setBusy('chats');
    await forgetLocalUser(uid);
    setBusy('');
    flash('Saved chats were removed from this phone. They are still safe on the server.');
    load();
  };
  const clearOne = async (c) => {
    await localDbDelete([c.key]);
    chatMem.delete(c.key);
    hapticTap();
    load();
  };
  const toggleKeep = async () => {
    const next = !keep;
    try { localStorage.setItem('zchat-keep-chats', next ? '1' : '0'); } catch {}
    setKeep(next);
    if (!next && uid) { await forgetLocalUser(uid); load(); }
  };
  const total = info ? Math.max(info.usage || 0, info.cacheBytes + info.chatBytes + info.media.size) : 0;
  const seg = info ? [
    ['Photos and videos', info.cacheBytes, theme.coral],
    ['Chats', info.chatBytes, '#3897F0'],
    ['Drafts and tones', info.media.size, '#F2994A'],
    ['App files', Math.max(0, total - info.cacheBytes - info.chatBytes - info.media.size), theme.dark ? '#5A5964' : '#B9B7C2'],
  ] : [];
  const nameOf = (k) => {
    const part = String(k).split('|')[1] || '';
    const [kind, id] = part.split(':');
    const nmx = info && info.nm ? info.nm[`${kind}:${id}`] : null;
    return nmx || (kind === 'group' ? 'Group chat' : 'Chat');
  };
  return (
    <div>
      {info === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>
      ) : (
        <>
          <div style={{ padding: '10px 2px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em' }}>{fmtBytesShort(total)}</div>
              <div style={{ fontSize: 13, color: theme.muted }}>{info.quota ? `of ${fmtBytesShort(info.quota)} this phone allows` : 'used by ZChat'}</div>
            </div>
            <div role="img" aria-label="Storage used by type" style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: theme.soft, marginTop: 10 }}>
              {seg.map(([l, v, c]) => (v > 0 && total > 0 ? <div key={l} style={{ width: `${Math.max(1.5, (v / total) * 100)}%`, background: c }} /> : null))}
            </div>
            <div style={{ marginTop: 12 }}>
              {seg.map(([l, v, c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14.5, color: theme.ink }}>{l}</span>
                  <span style={{ fontSize: 14, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{fmtBytesShort(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <IgHeading>Clean up</IgHeading>
          <IgRow inset={false} label="Clear photos and videos" sub="They download again when you open them" onClick={busy ? undefined : clearMedia} right={busy === 'media' ? <Spinner size={16} color={theme.muted} /> : <span style={{ fontSize: 14, color: theme.muted }}>{fmtBytesShort(info.cacheBytes)}</span>} />
          {keep && uid && <IgRow inset={false} label="Chats saved on this phone" sub={`${info.chats.length} ${info.chats.length === 1 ? 'chat' : 'chats'}, tap to see the biggest`} onClick={() => setChatsOpen((v) => !v)} right={<span style={{ fontSize: 14, color: theme.muted }}>{fmtBytesShort(info.chatBytes)}</span>} />}
          {chatsOpen && keep && (
            <div style={{ padding: '0 0 6px' }}>
              {info.chats.slice(0, 12).map((c) => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px 8px 40px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(c.key)}</div>
                    <div style={{ fontSize: 12, color: theme.muted }}>{countWord(c.count, 'message', 'messages')}, {fmtBytesShort(c.size)}</div>
                  </div>
                  <div role="button" aria-label={`Clear ${nameOf(c.key)} from this phone`} onClick={() => clearOne(c)} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, cursor: 'pointer', padding: 6 }}>Clear</div>
                </div>
              ))}
              <div role="button" aria-label="Clear all saved chats" onClick={busy ? undefined : clearChats} style={{ padding: '8px 4px 8px 40px', fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>{busy === 'chats' ? 'Clearing' : 'Clear all saved chats'}</div>
            </div>
          )}
          {info.media.drafts + info.media.tones > 0 && <IgRow inset={false} label="Drafts and tones" sub={`${info.media.drafts} ${info.media.drafts === 1 ? 'draft' : 'drafts'}, ${info.media.tones} ${info.media.tones === 1 ? 'tone' : 'tones'}`} right={<span style={{ fontSize: 14, color: theme.muted }}>{fmtBytesShort(info.media.size)}</span>} />}
        </>
      )}
      <IgHeading>Data use</IgHeading>
      <IgRow inset={false} label="Data saver" sub="Photos and videos load when you tap them, and your uploads are smaller" right={<IgToggle on={saver} onClick={() => setSaver(!saver)} />} />
      {!saver && <IgRow inset={false} label="Only on mobile data" sub="Save data automatically when you are away from wifi" right={<IgToggle on={cell} onClick={() => setCell(!cell)} />} />}
      <IgRow inset={false} label="Keep chats on this phone" sub="Read your recent chats with no connection" right={<IgToggle on={keep} onClick={toggleKeep} />} />
      <IgHeading>Auto download</IgHeading>
      {AUTO_DL_KINDS.map(([k, l]) => (
        <IgRow key={k} inset={false} label={l} value={(AUTO_DL_CHOICES.find(([c]) => c === dlCfg[k]) || AUTO_DL_CHOICES[0])[1]} onClick={() => setDlPick(k)} />
      ))}
      <div style={{ padding: '4px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.55 }}>
        {saver ? 'Data saver is on, so photos and videos still wait for a tap. ' : ''}{autoDlNet() === 'unknown' ? 'This device does not tell ZChat when it is on wifi, so Wifi only works like Wifi and mobile data here.' : 'Anything that does not download on its own shows its size and waits for a tap.'}
      </div>
      {dlPick && (
        <ChoiceSheet title={(AUTO_DL_KINDS.find(([k]) => k === dlPick) || ['', 'Auto download'])[1]} sub="When should these download on their own?" options={AUTO_DL_CHOICES} value={dlCfg[dlPick]}
          onPick={(c) => { setAutoDl(dlPick, c); setDlCfg(autoDlCfg()); setDlPick(null); playUiSound('toggle'); }} onClose={() => setDlPick(null)} />
      )}
      <div style={{ padding: '12px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.6 }}>{note || 'Your messages and photos stay safe on the server. This only removes the copies on this phone.'}</div>
    </div>
  );
}
const qrDevicesMem = new Map();
export function LinkedDevicesSection({ uid }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => qrDevicesMem.get(uid) || null);
  const [scan, setScan] = useState(false);
  const [typing, setTyping] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const put = (list) => { qrDevicesMem.set(uid, list); setRows(list); };
  const load = async () => {
    let res = null;
    try { res = await supabase.rpc('zchat_qr_devices'); } catch {}
    if (!res || res.error || !Array.isArray(res.data)) { setRows((r) => r || []); return; }
    put(res.data.filter((r) => r && r.id));
  };
  useEffect(() => {
    if (!uid) return undefined;
    load();
    let t = 0;
    const later = () => { clearTimeout(t); t = setTimeout(load, 2500); };
    const onVis = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('zchat-qr-linked', later);
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(t); window.removeEventListener('zchat-qr-linked', later); document.removeEventListener('visibilitychange', onVis); };
  }, [uid]);
  const logOut = async (r) => {
    setConfirm(null);
    const before = rows || [];
    put(before.filter((x) => x.id !== r.id));
    hapticTap();
    appSnack(`${r.label || 'That computer'} is logged out`);
    let res = null;
    try { res = await supabase.rpc('zchat_qr_logout', { p_id: r.id }); } catch {}
    if (!res || res.error || !res.data || !res.data.ok) {
      put(before);
      appSnack(friendlyError(res && res.error, "Couldn't log it out. Try again."));
    }
  };
  const host = (typeof window !== 'undefined' && window.location.host) || 'getzchat.com';
  const active = (r) => r.last_active && Date.now() - new Date(r.last_active).getTime() < 6 * 60000;
  const list = rows || [];
  const scanBtn = <BigButton label="Scan a code" onClick={() => { hapticTap(); setScan(true); }} />;
  const typeLink = <div role="button" aria-label="Type the code instead" onClick={() => setTyping(true)} style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: kitOnInk(theme), padding: 12, cursor: 'pointer' }}>Type the code instead</div>;
  return (
    <div style={{ paddingBottom: 24 }}>
      {rows !== null && !list.length ? (
        <>
          <EmptyState art="chats" title="Use ZChat on a computer" text={`Open ${host} on the computer, then scan the code on its screen with this phone.`} />
          {scanBtn}
          {typeLink}
        </>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px 14px', textWrap: 'pretty' }}>{`Open ${host} on a computer and scan the code on its screen to use ZChat there.`}</div>
          {scanBtn}
          {typeLink}
          <KitSection title="Computers" right={list.length ? String(list.length) : undefined} style={{ marginTop: 10 }}>
            {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} color={theme.muted} /></div> : (
              <div role="list" aria-label="Linked computers">
                {list.map((r) => (
                  <div key={r.id} role="listitem" aria-label={r.label || 'Computer'} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 2px', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
                    <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><LaptopIcon size={22} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label || 'Computer'}</div>
                      <div style={{ fontSize: 12.5, color: r.current || active(r) ? '#16A34A' : theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.current ? 'This computer' : active(r) ? 'Active now' : r.last_active ? `Last active ${timeAgoLong(r.last_active).toLowerCase()}` : `Linked ${timeAgoLong(r.linked_at).toLowerCase()}`}
                        <span style={{ color: theme.muted }}>{r.place ? `, ${r.place}` : ''}</span>
                      </div>
                    </div>
                    {!r.current && <div role="button" aria-label={`Log out ${r.label || 'computer'}`} onClick={() => setConfirm(r)} style={{ fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: 6, flexShrink: 0 }}>Log out</div>}
                  </div>
                ))}
              </div>
            )}
          </KitSection>
        </>
      )}
      {scan && <QrScanPage mode="login" onClose={() => setScan(false)} onLogin={(id) => { setScan(false); qrLoginOpen(id); }} />}
      {typing && <QrCodeEntrySheet onClose={() => setTyping(false)} />}
      {confirm && (
        <ConfirmDialog layer={700} title={`Log out ${confirm.label || 'this computer'}?`} body="ZChat on that computer will be logged out. To use it there again, scan a new code."
          confirmLabel="Log out" onCancel={() => setConfirm(null)} onConfirm={() => logOut(confirm)} />
      )}
    </div>
  );
}
async function lapCurrentSid() {
  try { const { data } = await supabase.auth.getSession(); return lapSid(data && data.session); } catch { return 'none'; }
}
function QrCodeEntrySheet({ onClose }) {
  const { theme } = useTheme();
  const [val, setVal] = useState('');
  useBackClose(true, onClose);
  const raw = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  const shown = raw.length > 4 ? `${raw.slice(0, 4)} ${raw.slice(4)}` : raw;
  const go = () => { if (raw.length !== 8) return; hapticTap(); onClose(); qrLoginOpen(null, raw); };
  return (
    <Portal>
      <div className="zchat-fade" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="dialog" aria-modal="true" aria-label="Type the code" className="zchat-sheet-up" onClick={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 460, boxSizing: 'border-box', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '10px 18px calc(16px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, textAlign: 'center' }}>Type the code</div>
          <div style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 1.5, margin: '6px 8px 16px' }}>It is under the code on the computer screen.</div>
          <input value={shown} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') go(); }} autoFocus inputMode="text" autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Code from the computer" placeholder="ABCD 1234"
            style={{ ...inputStyle(theme), textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', height: 58 }} />
          <div style={{ marginTop: 14 }}><BigButton label="Continue" disabled={raw.length !== 8} onClick={go} /></div>
        </div>
      </div>
    </Portal>
  );
}

function RecoveryCodesView({ codes, confirmLabel, busy, err, onConfirm }) {
  const { theme } = useTheme();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `ZChat recovery codes\n\n${codes.map((c, i) => `${i + 1}. ${c.slice(0, 5)} ${c.slice(5)}`).join('\n')}\n\nEach code works once.\n`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); hapticTap(); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { appSnack("Couldn't copy them. Write them down instead."); }
  };
  const save = () => {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ZChat recovery codes.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { appSnack("Couldn't save the file. Copy them instead."); }
  };
  const flip = () => { hapticTap(); setSaved((v) => !v); };
  return (
    <div className="zchat-tab-in">
      <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, padding: '8px 2px 4px' }}>Save your recovery codes</div>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '0 2px 14px', textWrap: 'pretty' }}>If none of your other devices are around when you log in, one of these codes gets you in. Each code works once. Keep them somewhere safe, like a password manager or paper. You will not see them again.</div>
      <div role="list" aria-label="Recovery codes" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', padding: '16px 14px', borderRadius: 16, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
        {codes.map((c, i) => (
          <div key={c} role="listitem" aria-label={`Code ${i + 1}, ${c.split('').join(' ')}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
            <span aria-hidden="true" style={{ width: 16, textAlign: 'right', fontSize: 12, color: theme.muted, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{i + 1}</span>
            <span aria-hidden="true" style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, 'Roboto Mono', monospace", fontSize: 15, fontWeight: 600, letterSpacing: '0.04em', color: theme.ink, whiteSpace: 'nowrap', userSelect: 'all' }}>{c.slice(0, 5)} {c.slice(5)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1 }}><BigButton tone="plain" label={copied ? 'Copied' : 'Copy codes'} onClick={copy} /></div>
        <div style={{ flex: 1 }}><BigButton tone="plain" label="Save as file" onClick={save} /></div>
      </div>
      <div role="checkbox" aria-checked={saved} tabIndex={0} onClick={flip} onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } }} className="zchat-row-press"
        style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '8px 2px', marginTop: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, boxSizing: 'border-box', border: saved ? 'none' : `1.8px solid ${theme.muted2}`, background: saved ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms ease' }}>
          {saved && <Check size={15} color="#FFFFFF" strokeWidth={3} />}
        </span>
        <span style={{ fontSize: 15, color: theme.ink, lineHeight: 1.35 }}>I saved these codes somewhere safe</span>
      </div>
      {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '4px 2px 8px' }}>{err}</div>}
      <div style={{ marginTop: 8 }}><BigButton label={busy ? 'Saving' : confirmLabel} disabled={!saved || busy} onClick={onConfirm} /></div>
    </div>
  );
}

export function LapPasswordSheet({ title, body, actionLabel, needPassword, busy, err, onSubmit, onClose, actionTone = 'danger' }) {
  const { theme } = useTheme();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  useBackClose(true, () => { if (!busy) onClose(); });
  const ready = !needPassword || pw.length > 0;
  const go = () => { if (ready && !busy) onSubmit(pw); };
  return (
    <Portal>
      <div className="zchat-fade" onClick={() => { if (!busy) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: 720, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="zchat-sheet-up"
          style={{ width: '100%', maxWidth: 460, boxSizing: 'border-box', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '10px 18px calc(16px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em', padding: '0 2px' }}>{title}</div>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '6px 2px 14px' }}>{body}</div>
          {needPassword && (
            <div style={{ position: 'relative' }}>
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} autoFocus
                placeholder="Your password" aria-label="Your password" autoComplete="current-password" autoCapitalize="none" spellCheck={false}
                style={{ ...inputStyle(theme), paddingRight: 48 }} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, border: 'none', background: 'transparent', color: theme.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                {show ? <Eye size={19} strokeWidth={1.8} /> : <EyeOff size={19} strokeWidth={1.8} />}
              </button>
            </div>
          )}
          {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '10px 2px 0' }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <div style={{ flex: '0 0 38%' }}><BigButton tone="plain" label="Cancel" onClick={() => { if (!busy) onClose(); }} /></div>
            <div style={{ flex: 1 }}><BigButton tone={actionTone} label={busy ? 'Checking' : actionLabel} disabled={!ready || busy} onClick={go} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

const lapStateMem = new Map();
function LoginApprovalSection({ uid }) {
  const { theme } = useTheme();
  const [st, setSt] = useState(() => lapStateMem.get(uid) || { on: lapRead(uid).on, codes: null, password: true, waiting: 0 });
  const [missing, setMissing] = useState(false);
  const [codes, setCodes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ask, setAsk] = useState(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askErr, setAskErr] = useState('');
  const stRef = useRef(st);
  stRef.current = st;
  const pwRef = useRef(null);
  const keep = (next) => { lapStateMem.set(uid, next); stRef.current = next; setSt(next); };
  useEffect(() => () => { pwRef.current = null; }, []);
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_login_approval_state').then(({ data, error }) => {
      if (!alive) return;
      if (error) { if (rpcMissing(error)) { identitySqlMark(false); setMissing(true); } return; }
      if (!data) return;
      identitySqlMark(true);
      keep({ on: !!data.on, codes: Number(data.codes) || 0, password: !!data.password, waiting: Number(data.waiting) || 0 });
      const c = lapRead(uid);
      if (!!data.on !== c.on) lapWrite(uid, { ...c, on: !!data.on });
    }, () => {});
    return () => { alive = false; };
  }, [uid]);
  const codeReason = (reason, turningOn) => (reason === 'limited' ? 'Too many tries. Wait 15 minutes and try again.'
    : reason === 'many' ? 'You made new codes a few times already. Try again in an hour.'
    : reason === 'password' ? 'That password is not right.'
    : reason === 'recent' ? (turningOn ? 'Log in again to turn this on.' : 'Log in again to get new codes.')
    : turningOn ? "Couldn't turn it on. Try again." : "Couldn't make your codes. Try again.");
  const startOn = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    const { data, error } = await supabase.rpc('zchat_login_codes_new', { p_password: null });
    setBusy(false);
    if (error || !data || !data.ok || !Array.isArray(data.codes)) { setErr(error ? friendlyError(error, "Couldn't make your codes. Try again.") : codeReason(data && data.reason, true)); return; }
    pwRef.current = null;
    setCodes({ list: data.codes, mode: 'enable' });
  };
  const confirmOn = async () => {
    if (busy || !codes) return;
    const kept = codes;
    const before = stRef.current;
    setErr('');
    setCodes(null);
    keep({ ...before, on: true, codes: kept.list.length });
    playUiSound('toggle');
    const { data, error } = await supabase.rpc('zchat_login_approval_set', { p_on: true, p_password: pwRef.current });
    if (error || !data || !data.ok) {
      const reason = data && data.reason;
      keep(before);
      if (!error && ['codes', 'password', 'recent', 'limited'].includes(reason)) {
        pwRef.current = null;
        setErr(reason === 'codes' ? 'Those codes expired. Turn it on again to get new ones.' : codeReason(reason, true));
        return;
      }
      setCodes(kept);
      setErr(friendlyError(error, "Couldn't turn it on. Try again."));
      return;
    }
    pwRef.current = null;
    lapMarkOk(uid, await lapCurrentSid());
    appSnack('Login approval is on');
  };
  const renewDone = async () => {
    if (!codes) return;
    const kept = codes;
    const before = stRef.current;
    setErr('');
    setCodes(null);
    keep({ ...before, codes: kept.list.length });
    let res = null;
    try { res = await supabase.rpc('zchat_login_codes_confirm'); } catch (e) { res = { error: e }; }
    if (!res || res.error || !res.data || !res.data.ok) {
      keep(before);
      setCodes(kept);
      setErr(res && res.data && res.data.reason === 'codes' ? 'Those codes expired. Get new codes again.' : friendlyError(res && res.error, "Couldn't save your new codes. Try again."));
      return;
    }
    appSnack('Your new recovery codes are ready. The old ones no longer work.');
  };
  const submitAsk = async (pw) => {
    if (askBusy) return;
    setAskBusy(true);
    setAskErr('');
    if (ask === 'renew' || ask === 'on') {
      const turningOn = ask === 'on';
      const { data, error } = await supabase.rpc('zchat_login_codes_new', { p_password: pw || null });
      setAskBusy(false);
      if (error || !data || !data.ok || !Array.isArray(data.codes)) { setAskErr(error ? friendlyError(error, "Couldn't make your codes. Try again.") : codeReason(data && data.reason, turningOn)); return; }
      pwRef.current = turningOn ? (pw || null) : null;
      setAsk(null);
      setCodes({ list: data.codes, mode: turningOn ? 'enable' : 'renew' });
      return;
    }
    const { data, error } = await supabase.rpc('zchat_login_approval_set', { p_on: false, p_password: pw || null });
    setAskBusy(false);
    if (error || !data || !data.ok) {
      const reason = data && data.reason;
      setAskErr(error ? friendlyError(error, "Couldn't turn it off. Try again.") : reason === 'password' ? 'That password is not right.' : reason === 'limited' ? 'Too many tries. Wait 15 minutes and try again.' : "Couldn't turn it off. Try again.");
      return;
    }
    setAsk(null);
    keep({ ...stRef.current, on: false, codes: 0, waiting: 0 });
    lapWrite(uid, { on: false });
    playUiSound('toggle');
    const ended = Number(data.ended) || 0;
    appSnack(ended === 1 ? 'Login approval is off. 1 login that was still waiting was logged out.' : ended > 1 ? `Login approval is off. ${ended} logins that were still waiting were logged out.` : 'Login approval is off');
  };
  if (missing) return <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px' }}>Login approval is not available yet.</div>;
  if (codes) {
    return <RecoveryCodesView codes={codes.list} confirmLabel={codes.mode === 'enable' ? 'Turn on login approval' : 'Use the new codes'} busy={busy} err={err} onConfirm={codes.mode === 'enable' ? confirmOn : renewDone} />;
  }
  const codesLeft = st.codes == null ? '' : st.codes === 1 ? '1 left' : `${st.codes} left`;
  return (
    <div>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px 4px', textWrap: 'pretty' }}>When this is on, a new login only works after you approve it on a phone or computer that is already logged in. If none are around, use a recovery code.</div>
      <IgRow inset={false} icon={<ApprovalGlyph />} label="Login approval" sub={st.on ? 'New logins need your OK first' : 'New logins work right away'} right={busy ? <Spinner size={16} color={theme.muted} /> : <IgToggle on={st.on} onClick={() => { if (st.on) { setAskErr(''); setAsk('off'); } else if (st.password) { setErr(''); setAskErr(''); setAsk('on'); } else startOn(); }} />} />
      {st.on && <IgRow inset={false} icon={<Lock />} label="Recovery codes" sub="New codes replace the old ones" value={codesLeft} onClick={() => { setAskErr(''); setAsk('renew'); }} />}
      {err && <div role="alert" style={{ fontSize: 13, color: theme.danger, fontWeight: 700, padding: '8px 2px' }}>{err}</div>}
      {st.on && <LoginRequestList uid={uid} />}
      {st.on && <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.55, padding: '12px 2px 0' }}>Logging in with a passkey counts as approved, because it only works on your own devices.</div>}
      {ask && (
        <LapPasswordSheet
          title={ask === 'on' ? 'Turn on login approval?' : ask === 'off' ? 'Turn off login approval?' : 'Get new recovery codes?'}
          body={ask === 'on'
            ? (st.password ? 'Type your password first. Then you get 10 recovery codes to save.' : 'You get 10 recovery codes to save.')
            : ask === 'off'
              ? (st.password ? 'Type your password to turn it off. Any login that is still waiting gets logged out.' : 'Any login that is still waiting gets logged out.')
              : (st.password ? 'Type your password to make 10 new codes. Your old codes stop working.' : 'You get 10 new codes and your old codes stop working.')}
          actionLabel={ask === 'on' ? 'Continue' : ask === 'off' ? 'Turn off' : 'Get new codes'} actionTone={ask === 'on' ? 'accent' : 'danger'}
          needPassword={st.password} busy={askBusy} err={askErr}
          onSubmit={submitAsk} onClose={() => { if (!askBusy) setAsk(null); }} />
      )}
    </div>
  );
}

const passkeyListMem = new Map();
function passkeyUsedText(r) {
  const added = fmtDate(new Date(r.created_at), { day: 'numeric', month: 'short', year: new Date(r.created_at).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
  if (!r.last_used_at) return `Added ${added}, not used yet`;
  const rel = timeAgoLong(r.last_used_at);
  return `Added ${added}, used ${/ago$|^Just now$/.test(rel) ? rel.charAt(0).toLowerCase() + rel.slice(1) : rel}`;
}
export function PasskeysSection({ uid }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => passkeyListMem.get(uid) || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [missing, setMissing] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const goneRef = useRef(new Set());
  const addedRef = useRef(new Map());
  const keep = (list) => { passkeyListMem.set(uid, list); rowsRef.current = list; setRows(list); };
  useEffect(() => {
    let alive = true;
    supabase.from('passkeys').select('id, device_name, created_at, last_used_at').eq('user_id', uid).order('created_at', { ascending: true }).limit(20).then(({ data, error }) => {
      if (!alive) return;
      if (error) { if (rpcMissing(error)) setMissing(true); else if (!rowsRef.current) setRows([]); return; }
      const fresh = (data || []).filter((r) => r && r.id && !goneRef.current.has(r.id));
      const extra = [...addedRef.current.values()].filter((r) => !fresh.some((x) => x.id === r.id) && !goneRef.current.has(r.id));
      keep([...fresh, ...extra]);
    }, () => { if (alive && !rowsRef.current) setRows([]); });
    return () => { alive = false; };
  }, [uid]);
  const add = async () => {
    if (busy) return;
    setBusy(true);
    setErr('');
    setNote('');
    try {
      const { data: sd } = await supabase.auth.getSession();
      const token = sd && sd.session ? sd.session.access_token : '';
      if (!token) throw { msg: 'Please log in again.' };
      const o = await passkeyCall('reg_options', {}, token);
      if (o.error !== undefined) throw { msg: o.status === 404 && !o.error ? 'Passkeys are not ready yet. Try again later.' : passkeyFail(o) };
      const pk = o.data.publicKey;
      const cred = await navigator.credentials.create({ publicKey: {
        ...pk, challenge: bioUnb64u(pk.challenge), user: { ...pk.user, id: bioUnb64u(pk.user.id) },
        excludeCredentials: (pk.excludeCredentials || []).map((c) => ({ type: 'public-key', id: bioUnb64u(c.id) })),
      } });
      const r = cred && cred.response;
      const spki = r && typeof r.getPublicKey === 'function' ? r.getPublicKey() : null;
      if (!spki) throw { msg: 'This browser cannot save passkeys for ZChat.' };
      const label = loginDeviceLabel();
      const v = await passkeyCall('reg_verify', {
        id: bioB64u(cred.rawId), clientDataJSON: bioB64u(r.clientDataJSON), authenticatorData: bioB64u(r.getAuthenticatorData()), publicKey: bioB64u(spki),
        publicKeyAlgorithm: r.getPublicKeyAlgorithm(), transports: typeof r.getTransports === 'function' ? r.getTransports() : [], name: label,
      }, token);
      if (v.error !== undefined) throw { msg: passkeyFail(v) };
      hapticTap();
      playUiSound('toggle');
      const row = { id: v.data.id, device_name: label, created_at: new Date().toISOString(), last_used_at: null };
      addedRef.current.set(row.id, row);
      keep([...(rowsRef.current || []).filter((x) => x.id !== row.id), row]);
      setNote('Passkey added. Next time, tap Log in with a passkey.');
    } catch (e) {
      const n = e && e.name;
      if (n === 'InvalidStateError') setErr('This device already has a ZChat passkey.');
      else if (n !== 'NotAllowedError' && n !== 'AbortError') setErr(e && e.msg ? e.msg : n === 'SecurityError' ? 'Passkeys do not work on this address.' : "Couldn't add a passkey. Try again.");
    }
    setBusy(false);
  };
  const remove = async (row) => {
    setConfirm(null);
    setErr('');
    setNote('');
    goneRef.current.add(row.id);
    const before = rowsRef.current || [];
    keep(before.filter((x) => x.id !== row.id));
    const { data, error } = await supabase.rpc('zchat_passkey_remove', { p_id: row.id });
    if (error || data !== true) {
      goneRef.current.delete(row.id);
      keep([...(rowsRef.current || []), row].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))));
      setErr(friendlyError(error, "Couldn't remove that passkey. Try again."));
    }
  };
  if (missing) return <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px' }}>Passkeys are not available yet.</div>;
  return (
    <div>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px 4px', textWrap: 'pretty' }}>Log in with your fingerprint, face or screen lock instead of typing your password. Each passkey stays on the device that made it.</div>
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} color={theme.muted} /></div> : rows.length === 0 ? (
        <div style={{ fontSize: 14, color: theme.muted, padding: '14px 2px' }}>No passkeys yet.</div>
      ) : (
        <div role="list" aria-label="Your passkeys">
          {rows.map((r) => (
            <div key={r.id} role="listitem" aria-label={r.device_name || 'Passkey'} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 2px', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><PasskeyGlyph size={22} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.device_name || 'Passkey'}</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{passkeyUsedText(r)}</div>
              </div>
              <div role="button" aria-label={`Remove ${r.device_name || 'passkey'}`} onClick={() => setConfirm(r)} className="zchat-press" style={{ fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: 6 }}>Remove</div>
            </div>
          ))}
        </div>
      )}
      {note && <div role="status" style={{ color: theme.ink, fontSize: 13.5, fontWeight: 600, padding: '12px 2px 0', lineHeight: 1.45, textWrap: 'pretty' }}>{note}</div>}
      {err && <div role="alert" style={{ color: theme.danger, fontSize: 13, fontWeight: 700, padding: '12px 2px 0', lineHeight: 1.45 }}>{err}</div>}
      <div style={{ marginTop: 16 }}><BigButton label={busy ? 'Waiting for your device' : 'Add a passkey for this device'} disabled={busy} onClick={add} /></div>
      {confirm && (
        <ConfirmDialog layer={700} title="Remove this passkey?" body="You can't log in with it after this. You can also delete it from your phone's password manager."
          confirmLabel="Remove" onCancel={() => setConfirm(null)} onConfirm={() => remove(confirm)} />
      )}
    </div>
  );
}
function writeNearbyCfg(cfg) { try { localStorage.setItem('zchat-nearby', JSON.stringify(cfg)); } catch {} }
function NearbySettingsRows({ uid }) {
  const { theme } = useTheme();
  const [cfg, setCfg] = useState(readNearbyCfg);
  const sharing = readMapShare(uid) !== 'off';
  const set = (next) => { setCfg(next); writeNearbyCfg(next); hapticTap(); };
  return (
    <>
      <IgRow inset={false} label="Friend nearby alerts" sub={sharing ? 'Hear when a friend who shares their location is close by, while ZChat is open' : 'Turn on location sharing in Friends map first'} right={<IgToggle on={cfg.on} onClick={() => set({ ...cfg, on: !cfg.on })} />} />
      {cfg.on && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '0 0 8px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 500, color: theme.ink }}>Alert me within</span>
          <NearbyRadiusPicker value={cfg.r} onChange={(r) => set({ ...cfg, r })} />
        </div>
      )}
    </>
  );
}
function NearbyRadiusPicker({ value, onChange }) {
  const { theme } = useTheme();
  const opts = [[500, '500 m'], [1000, '1 km'], [2000, '2 km']];
  const at = Math.max(0, opts.findIndex(([r]) => r === value));
  return (
    <div role="radiogroup" aria-label="How close" style={{ position: 'relative', display: 'flex', width: 172, height: 34, padding: 2, boxSizing: 'border-box', borderRadius: 10, background: theme.soft, flexShrink: 0 }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: 2, bottom: 2, left: 2, width: 'calc((100% - 4px) / 3)', borderRadius: 8, background: theme.dark ? '#34333B' : '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.05)', transform: `translateX(${at * 100}%)`, transition: reducedMotion() ? 'none' : 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
      {opts.map(([r, l]) => {
        const on = r === value;
        return <div key={r} role="radio" aria-checked={on} aria-label={`Within ${l}`} onClick={() => { if (!on) onChange(r); }} style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: on ? 700 : 600, color: on ? theme.ink : theme.muted, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 160ms ease' }}>{l}</div>;
      })}
    </div>
  );
}

function ModeScheduleRows() {
  const { theme, themeSched, setThemeSched } = useTheme();
  const s = themeSched || { from: '19:00', to: '07:00' };
  const row = (label, key, fallback) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}>
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: theme.ink }}>{label}</span>
      <input type="time" value={s[key]} aria-label={label} onChange={(e) => setThemeSched({ ...s, [key]: e.target.value || fallback })} style={{ ...inputStyle(theme), width: 150, padding: '9px 12px', fontSize: 15.5 }} />
    </label>
  );
  return (
    <div style={{ padding: '12px 0 2px' }}>
      {row('Dark mode starts', 'from', '19:00')}
      {row('Light mode starts', 'to', '07:00')}
    </div>
  );
}

function ToneList() {
  const { theme } = useTheme();
  const [tone, setTone] = useState(readTone);
  const pick = (k) => {
    try { localStorage.setItem('zchat-tone', k); } catch {}
    setTone(k);
    hapticTap();
    playUiSound('receive');
  };
  return (
    <div>
      {NOTIF_TONES.map((t) => (
        <div key={t.k} role="button" aria-label={`Tone ${t.l}`} onClick={() => pick(t.k)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
          <span style={{ width: 24, display: 'flex', justifyContent: 'center', color: theme.muted }}><Play size={15} /></span>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>{t.l}</span>
          {tone === t.k && <Check size={18} color={theme.coral} strokeWidth={2.6} />}
        </div>
      ))}
      <CustomToneRows current={tone} onPick={pick} />
      <SoundPackRows kind="tone" current={tone} onPick={pick} />
      <div style={{ padding: '10px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>Tap a tone to hear it. Tones play while ZChat is open on your screen. When ZChat is closed or in the background, your phone uses its own notification sound.</div>
    </div>
  );
}

function ChatsPrefsSection() {
  const { theme } = useTheme();
  const [enterSend, setEnterSend] = usePref('zchat-enter-send');
  const [dbl, setDbl] = usePref('zchat-doubletap');
  const [swipe, setSwipe] = usePref('zchat-swipe-reply');
  const [haptics, setHaptics] = usePref('zchat-haptics');
  const [reduce, setReduce] = usePref('zchat-reduce-motion');
  const [fmt, setFmt] = usePref('zchat-format');
  const [fx, setFx] = usePref('zchat-effects');
  const [pfx, setPfx] = usePref('zchat-profile-fx');
  const [touch_, setTouch_] = usePref('zchat-touch-sounds');
  const [stk, setStk] = usePref('zchat-sticker-suggest');
  const [emo, setEmo] = usePref('zchat-emoji-suggest');
  const [wHelp, setWHelp] = usePref('zchat-writing-help');
  const [vauto, setVauto] = usePref('zchat-voice-autoplay');
  const [hidePrev, setHidePrev] = usePref('zchat-hide-previews');
  const [typingOn, setTypingOn] = usePref('zchat-typing-indicator');
  const [badgeOn, setBadgeOn] = usePref('zchat-app-badge');
  const [friendEmo, setFriendEmo] = usePref('zchat-friend-emojis');
  const [railOn, setRailOn] = usePref('zchat-quick-rail');
  const [quick, setQuick] = useState(getQuickReactions);
  const [editAt, setEditAt] = useState(null);
  const [qrOpen, setQrOpen] = useState(false);
  const touch = isTouchDevice();
  const row = (icon, label, sub, on, set) => <IgRow inset={false} icon={icon} label={label} sub={sub} right={<IgToggle on={on} onClick={() => set(!on)} />} />;
  return (
    <div>
      <IgHeading>Messages</IgHeading>
      {!touch && row(<Send size={16} />, 'Enter sends the message', enterSend ? 'Shift and Enter adds a new line' : 'Ctrl and Enter sends instead', enterSend, setEnterSend)}
      {row(<Heart size={16} />, 'Double tap to heart', 'Tap a message twice to react with a heart', dbl, setDbl)}
      {row(<Reply size={16} />, 'Swipe to reply', 'Drag a message to the right to reply to it', swipe, setSwipe)}
      {row(<Type size={16} />, 'Text formatting', 'Stars for bold, tildes to strike, low lines for italic, two bars for a spoiler', fmt, setFmt)}
      {row(<PartyIcon size={16} />, 'Message effects', 'Confetti, hearts, balloons and snow fill the screen for party emoji', fx, setFx)}
      {row(<Smile size={16} />, 'Sticker suggestions', 'Type lol, hi or a single emoji to see matching stickers', stk, setStk)}
      {row(<Smile size={16} />, 'Emoji suggestions', 'Type a word like love or party to see matching emoji', emo, setEmo)}
      {row(<WriteHelpIcon size={16} />, 'Writing help', 'A pen button helps fix spelling or change the tone before you send', wHelp, setWHelp)}
      {row(<TextBombIcon size={16} />, 'Quick actions in chats', 'A small tab on the right edge for bomb, style, buzz and coin flip. Tuck it away with Hide', railOn, setRailOn)}
      <IgRow inset={false} icon={<FolderIcon size={16} />} label="Chat folders" sub="Make tabs like Family or Work and pick the order" onClick={() => { try { window.dispatchEvent(new Event('zchat-open-folders')); } catch {} }} />
      {row(<Mic size={16} />, 'Play voice messages in a row', 'The next voice message starts when one ends', vauto, setVauto)}
      <IgHeading>Privacy on this device</IgHeading>
      {row(<EyeOff size={16} />, 'Hide message previews', 'Your chat list shows New message instead of the text', hidePrev, setHidePrev)}
      {row(<Type size={16} />, 'Show when I am typing', 'Turn off and nobody sees you typing or recording', typingOn, setTypingOn)}
      {row(<Bell size={16} />, 'Unread count on app icon', 'Shows a number on the ZChat icon when installed', badgeOn, setBadgeOn)}
      <IgHeading>Friend emojis</IgHeading>
      {row(<Smile size={16} />, 'Show friend emojis', 'Small emojis next to names in your chat list', friendEmo, setFriendEmo)}
      {friendEmo && (
        <div style={{ padding: '2px 2px 10px' }}>
          {FRIEND_EMOJI_INFO.map(([e, t, s]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 0' }}>
              <span aria-hidden="true" style={{ width: 24, textAlign: 'center', fontSize: 20, lineHeight: 1 }}>{e}</span>
              <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: theme.ink }}>{t}</span><span style={{ display: 'block', fontSize: 12.5, color: theme.muted }}>{s}</span></span>
            </div>
          ))}
        </div>
      )}
      <IgHeading>Quick reactions</IgHeading>
      <div style={{ padding: '4px 2px 10px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>These six show when you hold a message. Tap one to swap it.</div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 16px' }}>
        <div role="group" aria-label="Quick reactions" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, height: 54, padding: '0 7px', borderRadius: 27, background: theme.panelBg, boxShadow: theme.dark ? '0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.45)' : '0 0 0 1px rgba(17,17,19,0.06), 0 8px 22px rgba(17,17,19,0.12)' }}>
          {quick.map((e, i) => (
            <div key={i} role="button" aria-label={`Quick reaction ${i + 1}`} onClick={() => setEditAt(i)} className="zchat-press" style={{ width: 42, height: 42, borderRadius: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, lineHeight: 1, cursor: 'pointer', background: editAt === i ? theme.rowBg : 'transparent' }}>{e}</div>
          ))}
        </div>
      </div>
      <div role="button" aria-label="Reset quick reactions" onClick={() => { setQuickReactions(REACTION_EMOJIS); setQuick(REACTION_EMOJIS); hapticTap(); }} style={{ fontSize: 13.5, fontWeight: 700, color: theme.coral, padding: '0 2px 12px', cursor: 'pointer' }}>Reset to default</div>
      <IgHeading>Quick replies</IgHeading>
      <IgRow inset={false} icon={<MessageSquare size={16} />} label="Quick replies" sub="Type a slash in a chat to send a saved message" onClick={() => setQrOpen(true)} />
      <IgHeading>Feel</IgHeading>
      {row(<VibrateIcon size={16} />, 'Haptic feedback', 'A small buzz on taps and swipes', haptics, setHaptics)}
      {row(<Volume1 size={16} />, 'Touch sounds', 'A soft tick on every button, row and tile', touch_, setTouch_)}
      {row(<ProfileFxIcon size={16} />, 'Profile effects', 'Play the animation when you open a profile that wears a set with an effect', pfx, setPfx)}
      {row(<Activity size={16} />, 'Reduce motion', 'Pages fade instead of sliding, and effects, live wallpapers and animated profile pictures stay still', reduce, setReduce)}
      {qrOpen && <QuickRepliesPage onClose={() => setQrOpen(false)} />}
      {editAt != null && <FullEmojiPicker onClose={() => setEditAt(null)} onPick={(e) => { const next = quick.slice(); next[editAt] = e; setQuickReactions(next); setQuick(next); setEditAt(null); hapticTap(); }} />}
    </div>
  );
}

const KEY_SHORTCUTS = [
  ['Ctrl K', 'Search chats and people'],
  ['Esc', 'Go back or close what is open'],
  ['Alt \u2191  Alt \u2193', 'Previous or next chat'],
  ['Ctrl Shift U', 'Show only unread chats'],
  ['Ctrl Shift D', 'Switch dark mode'],
  ['Enter', 'Send the message'],
  ['Shift Enter', 'Add a new line'],
  ['\u2191 in an empty box', 'Edit your last message'],
  ['Arrows', 'Steer in Snake, 2048, Bricks and Sky hop'],
];
function ShortcutsSection() {
  const { theme } = useTheme();
  const mac = (() => { try { return /Mac|iPhone|iPad/.test(navigator.platform || ''); } catch { return false; } })();
  const show = (k) => (mac ? k.replace('Ctrl', '\u2318').replace('Alt', '\u2325') : k);
  return (
    <div>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>These work when ZChat is open on a computer.</div>
      {KEY_SHORTCUTS.map(([k, l]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px', borderBottom: `1px solid ${theme.border}` }}>
          <span style={{ flex: 1, fontSize: 15, color: theme.ink, fontWeight: 600 }}>{l}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.muted, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{show(k)}</span>
        </div>
      ))}
    </div>
  );
}

function AppLockSection() {
  const { theme } = useTheme();
  const [cfg, setCfg] = useState(readAppLock);
  const [flow, setFlow] = useState(null);
  const [err, setErr] = useState(0);
  useEffect(() => {
    const on = () => setCfg(readAppLock());
    window.addEventListener('zchat-applock-changed', on);
    return () => window.removeEventListener('zchat-applock-changed', on);
  }, []);
  useBackClose(!!flow, () => setFlow(null));
  const save = (next) => { writeAppLock(next); setCfg(next); };
  const begin = (mode, next) => { setErr(0); setFlow({ mode, next }); };
  const onPin = async (pin) => {
    if (!flow) return;
    if (flow.mode === 'verify') {
      const ok = await verifyPin(pin);
      if (!ok) { setErr((e) => e + 1); return; }
      if (flow.next === 'off') { appLockTurnOff(); setCfg(readAppLock()); setFlow(null); playUiSound('toggle'); }
      else { setErr(0); setFlow({ mode: 'set' }); }
      return;
    }
    if (flow.mode === 'set') { setErr(0); setFlow({ mode: 'confirm', first: pin }); return; }
    if (flow.mode === 'confirm') {
      if (pin !== flow.first) { setErr((e) => e + 1); setFlow({ mode: 'set', mismatch: true }); return; }
      const h = await hashAppPin(pin);
      save({ h, d: cfg.d || 0, ...(cfg.b ? { b: cfg.b } : {}) });
      bioPinGate.at = Date.now();
      setFlow(null);
      playUiSound('like');
    }
  };
  const on = !!cfg.h;
  const delays = [[0, 'Immediately'], [60, 'After 1 minute'], [300, 'After 5 minutes'], [1800, 'After 30 minutes']];
  const titles = { verify: 'Enter your PIN', set: 'Choose a PIN', confirm: 'Confirm your PIN' };
  const subs = flow ? (flow.mode === 'verify' ? (err ? 'Wrong PIN, try again' : 'Your current PIN') : flow.mode === 'set' ? (flow.mismatch ? 'The PINs did not match, start again' : 'Four digits you will remember') : 'Type the same PIN again') : '';
  return (
    <div>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Ask for a PIN when you come back to ZChat. Your chats stay hidden until you enter it.</div>
      <IgRow inset={false} icon={<Lock size={16} />} label="Require PIN" sub={on && spendLockActive() ? 'The spending lock uses this PIN too' : undefined} right={<IgToggle on={on} onClick={() => (on ? begin('verify', 'off') : begin('set'))} />} />
      {on && <BioToggleRow sub="Also opens hidden chats and locked chats" />}
      {on && <IgRow inset={false} icon={<Pencil size={16} />} label="Change PIN" onClick={() => begin('verify', 'change')} />}
      {on && <IgRow inset={false} icon={<EyeOff size={16} />} label="Lock now" onClick={() => { try { window.dispatchEvent(new Event('zchat-lock-now')); } catch {} }} />}
      {on && (
        <>
          <IgHeading>Lock again</IgHeading>
          {delays.map(([d, l]) => (
            <div key={d} role="button" aria-label={l} onClick={() => { save({ ...cfg, d }); hapticTap(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>{l}</span>
              {(cfg.d || 0) === d && <Check size={18} color={theme.coral} strokeWidth={2.6} />}
            </div>
          ))}
          <div style={{ padding: '10px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>Counted from the moment you leave the app or switch tabs.</div>
        </>
      )}
      {flow && (
        <FullPage title={titles[flow.mode]} onBack={() => setFlow(null)} zIndex={70}>
          <AppPinPad key={flow.mode} subtitle={subs} onComplete={onPin} error={err} />
        </FullPage>
      )}
    </div>
  );
}
function BioToggleRow({ sub }) {
  const { theme } = useTheme();
  const ready = useBioReady();
  const [on, setOn] = useState(() => !!bioCredId());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [verify, setVerify] = useState(false);
  useEffect(() => {
    const f = () => setOn(!!bioCredId());
    window.addEventListener('zchat-applock-changed', f);
    return () => window.removeEventListener('zchat-applock-changed', f);
  }, []);
  if (!ready) return null;
  const enroll = async () => {
    setBusy(true);
    let id = null;
    try { id = await bioRegister(); } catch { id = null; }
    setBusy(false);
    if (id) { bioPinGate.at = 0; writeAppLock({ ...readAppLock(), b: id }); playUiSound('like'); }
    else setNote(`${bioNameTitle()} is not on yet. Tap the switch to try again.`);
  };
  const toggle = () => {
    if (busy) return;
    setNote('');
    if (on) { const c = { ...readAppLock() }; delete c.b; writeAppLock(c); return; }
    if (!readAppLock().h) { setNote('Turn on App lock first'); return; }
    if (Date.now() - bioPinGate.at < 60000) { enroll(); return; }
    setVerify(true);
  };
  return (
    <>
      <IgRow inset={false} icon={<BioGlyph />} label={`Unlock with ${bioName()}`} sub={note || sub} right={busy ? <Spinner size={16} color={theme.muted} /> : <IgToggle on={on} onClick={toggle} />} />
      {verify && <AppPinVerifyPage sub={`Enter your PIN to turn on ${bioName()}`} onClose={() => setVerify(false)} onDone={() => { setVerify(false); bioPinGate.at = Date.now(); enroll(); }} />}
    </>
  );
}

function appLockTurnOff() {
  const cur = readAppLock();
  writeAppLock({ d: cur.d || 0 });
  const s = readSpendCfg();
  if (s.on) writeSpendCfg({ ...s, on: false });
}
function AppPinVerifyPage({ title, sub, onDone, onClose, zIndex = 90 }) {
  useBackClose(true, onClose);
  const [err, setErr] = useState(0);
  const onPin = async (pin) => {
    if (await verifyPin(pin)) { playUiSound('toggle'); onDone(); return; }
    setErr((e) => e + 1);
    playUiSound('cancel');
  };
  return (
    <FullPage title={title || 'Enter your PIN'} onBack={onClose} zIndex={zIndex}>
      <AppPinPad subtitle={err ? 'Wrong PIN, try again' : (sub || 'Your current PIN')} onComplete={onPin} error={err} />
    </FullPage>
  );
}
function writeSpendCfg(c) {
  const n = (v) => (Number(v) > 0 ? Math.floor(Number(v)) : 0);
  writeJsonLs('zchat-spendlock', { on: !!c.on, lim: n(c.lim), g: n(c.g) });
  try { window.dispatchEvent(new Event('zchat-spendlock-changed')); } catch {}
}
function useSpendLockToggle() {
  const [cfg, setCfg] = useState(readSpendCfg);
  const [setup, setSetup] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => {
    const f = () => { setCfg(readSpendCfg()); setTick((t) => t + 1); };
    window.addEventListener('zchat-spendlock-changed', f);
    window.addEventListener('zchat-applock-changed', f);
    return () => { window.removeEventListener('zchat-spendlock-changed', f); window.removeEventListener('zchat-applock-changed', f); };
  }, []);
  const on = spendLockActive(cfg);
  const turnOn = () => { writeSpendCfg({ ...readSpendCfg(), on: true }); playUiSound('like'); };
  const toggle = async () => {
    if (on) {
      if (await requireSpendAuth('Turn off the spending lock', { force: true })) writeSpendCfg({ ...readSpendCfg(), on: false });
      return;
    }
    if (!readAppLock().h) { setSetup(true); return; }
    turnOn();
  };
  const node = setup ? (
    <AppPinSetupPage title="Create a PIN" note="This PIN protects your coins. It also locks ZChat when you leave, which you can change in App lock."
      onClose={() => setSetup(false)} onDone={() => { setSetup(false); turnOn(); }} />
  ) : null;
  return { on, cfg, toggle, node };
}
const SPEND_LIMITS = [0, 100, 250, 500, 1000];
function SpendLockSection({ uid }) {
  const { theme } = useTheme();
  const t = useSpendLockToggle();
  const cfg = t.cfg;
  const [sent, setSent] = useState(() => spendSentToday(uid));
  useEffect(() => {
    const f = () => setSent(spendSentToday(uid));
    window.addEventListener('zchat-spendlock-changed', f);
    return () => window.removeEventListener('zchat-spendlock-changed', f);
  }, [uid]);
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const pickLimit = async (lim) => {
    const cur = readSpendCfg();
    if (lim === cur.lim) return;
    const looser = cur.lim > 0 && (lim === 0 || lim > cur.lim);
    if (looser && spendLockActive(cur) && !(await requireSpendAuth(lim ? `Raise your daily limit to ${fmt(lim)} coins` : 'Remove your daily limit', { force: true }))) return;
    writeSpendCfg({ ...readSpendCfg(), lim });
  };
  const pickAsk = async (g) => {
    const cur = readSpendCfg();
    if (g === cur.g) return;
    if (g > cur.g && spendLockActive(cur) && !(await requireSpendAuth('Ask for your PIN less often', { force: true }))) return;
    writeSpendCfg({ ...readSpendCfg(), g });
  };
  return (
    <div>
      <div style={{ padding: '12px 2px 6px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Ask for your PIN before any coins leave your account, so nobody else can spend them on your phone.</div>
      <IgRow inset={false} icon={<SecGlyph k="spend" />} label="Spending lock" sub="Shop, gifts and sending coins" right={<IgToggle on={t.on} onClick={t.toggle} />} />
      {t.on && <BioToggleRow sub="Confirm with a touch or a glance" />}
      {t.on && (
        <KitSection title="When to ask">
          <ChoiceList label="When to ask" value={cfg.g >= 900 ? 900 : 0} onChange={pickAsk} options={[
            { k: 0, label: 'Every time', sub: 'Before each purchase, gift or coin transfer' },
            { k: 900, label: 'Once every 15 minutes', sub: 'Buy a few things in a row without asking again' },
          ]} />
        </KitSection>
      )}
      <KitSection title="Daily sending limit" right={sent ? `${fmt(sent)} sent today` : undefined}>
        <ChoiceList label="Daily sending limit" value={SPEND_LIMITS.includes(cfg.lim) ? cfg.lim : 0} onChange={pickLimit}
          options={SPEND_LIMITS.map((n) => ({ k: n, label: n ? `${fmt(n)} coins a day` : 'No limit', sub: n ? undefined : 'Send as many coins as you like' }))} />
        <div style={{ padding: '10px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>Counts the coins you send to people from this phone. It starts again at midnight.</div>
      </KitSection>
      {t.node}
    </div>
  );
}

function checkupLabel(uid) {
  const s = uid ? readJsonLs(`zchat-checkup-${uid}`, null) : null;
  return s && s.t ? `${s.s} of ${s.t}` : undefined;
}
function CheckupProgress({ i, n }) {
  const { theme } = useTheme();
  const still = reducedMotion();
  return (
    <div style={{ padding: '8px 2px 0' }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.muted, marginBottom: 8 }}>{`Step ${i + 1} of ${n}`}</div>
      <div role="progressbar" aria-label="Checkup progress" aria-valuemin={1} aria-valuemax={n} aria-valuenow={i + 1} style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: n }).map((_, k) => (
          <div key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: theme.rowBg, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: theme.coral, transform: `scaleX(${k <= i ? 1 : 0})`, transformOrigin: 'left center', transition: still ? 'none' : 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
function CheckupScore({ steps, onJump }) {
  const { theme } = useTheme();
  const n = steps.length;
  const s = steps.filter((x) => x.good).length;
  const frac = n ? s / n : 0;
  const still = reducedMotion();
  const [shown, setShown] = useState(still ? frac : 0);
  useEffect(() => { const t = setTimeout(() => setShown(frac), 60); return () => clearTimeout(t); }, [frac]);
  const R = 54;
  const C = 2 * Math.PI * R;
  const headline = frac >= 0.85 ? 'Your account is well protected' : frac >= 0.5 ? 'A few things are worth a look' : 'Your account could be safer';
  return (
    <div style={{ padding: '14px 0 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div role="img" aria-label={`Score ${s} of ${n}`} style={{ position: 'relative', width: 128, height: 128 }}>
          <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden="true" style={{ display: 'block' }}>
            <circle cx="64" cy="64" r={R} fill="none" stroke={theme.rowBg} strokeWidth="9" />
            <circle cx="64" cy="64" r={R} fill="none" stroke={theme.coral} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${C * shown} ${C}`} transform="rotate(-90 64 64)"
              style={{ opacity: shown > 0 ? 1 : 0, transition: still ? 'none' : 'stroke-dasharray 300ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: theme.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s}</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>{`of ${n}`}</div>
          </div>
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em', marginTop: 18 }}>{headline}</div>
        <div style={{ fontSize: 14.5, color: theme.muted, lineHeight: 1.5, marginTop: 6, maxWidth: 320 }}>{s === n ? 'Everything is on. Come back any time from Settings.' : 'Tap anything below to go back and change it.'}</div>
      </div>
      <div style={{ marginTop: 22, borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
        {steps.map((st, i) => (
          <div key={st.k} role="button" aria-label={`${st.title}, ${st.good ? 'done' : 'review'}`} onClick={() => onJump(i)} className="zchat-row-press"
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '0 14px', position: 'relative', cursor: 'pointer' }}>
            <span style={{ display: 'flex', color: theme.ink }}><SecGlyph k={st.g} size={22} sw={2.3} /></span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.title}</span>
            {st.good
              ? <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0 }}><SecGlyph k="check" size={20} sw={3} /></span>
              : <span style={{ fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), flexShrink: 0 }}>Review</span>}
            {i < steps.length - 1 && <div style={{ position: 'absolute', left: 48, right: 0, bottom: 0, height: 1, background: theme.border }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
export function SecurityCheckupPage({ me, onClose, onSaved, hideActivity, onToggleActivity, restrictedCount = 0, onOpenRestricted }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const uid = me.id;
  const bioReady = useBioReady();
  const spend = useSpendLockToggle();
  const [idx, setIdx] = useState(0);
  const [finished, setFinished] = useState(false);
  const [tfa, setTfa] = useState(null);
  const [lock, setLock] = useState(readAppLock);
  const [lockFlow, setLockFlow] = useState(null);
  const [msg, setMsg] = useState(me.privacy_messages || 'everyone');
  const [priv, setPriv] = useState(!!me.is_private);
  const [online, setOnline] = useState(me.privacy_online || 'everyone');
  const [lastSeen, setLastSeen] = useState(me.privacy_lastseen || 'everyone');
  const [others, setOthers] = useState(null);
  const [reviewed, setReviewed] = useState(() => { const v = readJsonLs(`zchat-checkup-dev-${uid}`, []); return Array.isArray(v) ? v : []; });
  const [words, setWords] = useState(() => { const c = hiddenWordsCfg(); return { on: c.on, words: c.words }; });
  const [wordsPage, setWordsPage] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    const mfa = supabase.auth && supabase.auth.mfa;
    if (!mfa || !mfa.listFactors) { setTfa(false); return undefined; }
    mfa.listFactors().then(({ data }) => { if (alive) setTfa(!!((data && data.totp) || []).find((f) => f.status === 'verified')); }, () => { if (alive) setTfa(false); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    let alive = true;
    supabase.from('user_devices').select('device_id, revoked').eq('user_id', uid).limit(40).then(({ data, error }) => {
      if (!alive) return;
      const mine = getDeviceId();
      setOthers(error ? [] : (data || []).filter((r) => !r.revoked && r.device_id !== mine).map((r) => r.device_id));
    }, () => { if (alive) setOthers([]); });
    const f = () => setLock(readAppLock());
    window.addEventListener('zchat-applock-changed', f);
    return () => { alive = false; window.removeEventListener('zchat-applock-changed', f); };
  }, []);
  const failed = () => setErr('That could not be saved yet. Try again in a little while.');
  const saveCols = async (patch, revert) => {
    setErr('');
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    if (error) { revert(); failed(); return; }
    if (onSaved) onSaved(patch);
  };
  const pickMsg = (v) => { if (v === msg) return; const before = msg; setMsg(v); saveCols({ privacy_messages: v }, () => setMsg(before)); };
  const pickSeen = (v) => {
    if (v === online && v === lastSeen) return;
    const b1 = online;
    const b2 = lastSeen;
    setOnline(v);
    setLastSeen(v);
    saveCols({ privacy_online: v, privacy_lastseen: v }, () => { setOnline(b1); setLastSeen(b2); });
  };
  const togglePrivate = async () => {
    const next = !priv;
    setPriv(next);
    setErr('');
    const { data, error } = await updateProfile(uid, { is_private: next });
    if (error || !data) { setPriv(!next); failed(); return; }
    if (onSaved) onSaved({ is_private: next });
  };
  const toggleWords = () => { const next = { ...words, on: !words.on }; setWords(next); saveHiddenWordsCfg(next); };
  if (bioReady === null) return <FullPage title="Security checkup" onBack={onClose} zIndex={70}><div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div></FullPage>;
  const steps = [
    { k: 'tfa', g: 'tfa', title: 'Two factor authentication', why: 'A code from an app on your phone stops anyone who only knows your password.', good: tfa === true },
    { k: 'lock', g: 'lock', title: 'App lock', why: 'A PIN keeps your chats private when someone else picks up your phone.', good: !!lock.h },
    bioReady ? { k: 'bio', g: bioGlyphKind(), title: bioNameTitle(), why: 'Unlock in a moment, without anyone watching you type your PIN.', good: !!lock.b } : null,
    { k: 'spend', g: 'spend', title: 'Spending lock', why: 'Nobody can spend your coins or send gifts from your phone without your PIN.', good: spend.on },
    { k: 'msg', g: 'msg', title: 'Who can message you', why: 'Fewer strangers in your chats means less spam and fewer scams.', good: msg === 'following' },
    { k: 'private', g: 'private', title: 'Private account', why: 'Only followers you approve can see your posts and stories.', good: priv },
    { k: 'seen', g: 'seen', title: 'Last seen and online', why: 'Choose who can tell when you are on ZChat.', good: !!hideActivity || (online !== 'everyone' && lastSeen !== 'everyone') },
    { k: 'devices', g: 'devices', title: 'Logged in devices', why: 'A phone or browser you do not recognise could be someone else in your account.', good: others !== null && others.every((d) => reviewed.includes(d)) },
    { k: 'safety', g: 'safety', title: 'Hidden words and restrict', why: 'Cover rude words before you read them, and quietly limit people who bother you.', good: words.on || words.words.length > 0 || restrictedCount > 0 },
  ].filter(Boolean);
  const total = steps.length;
  const at = Math.min(idx, total - 1);
  const cur = steps[at];
  const score = steps.filter((x) => x.good).length;
  const saveScore = () => writeJsonLs(`zchat-checkup-${uid}`, { s: score, t: total, at: Date.now() });
  const next = () => {
    if (cur.k === 'devices' && others) {
      const seen = [...new Set([...reviewed, ...others])];
      setReviewed(seen);
      writeJsonLs(`zchat-checkup-dev-${uid}`, seen);
    }
    setErr('');
    hapticTap();
    if (at >= total - 1) { setFinished(true); return; }
    setIdx(at + 1);
  };
  if (finished) saveScore();
  const card = (children, pad = '4px 14px') => <div style={{ marginTop: 20, borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, padding: pad }}>{children}</div>;
  const seenValue = online === lastSeen ? online : null;
  const control = (k) => {
    if (k === 'tfa') {
      if (tfa === null) return <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}><Spinner size={18} color={theme.muted} /></div>;
      if (tfa) return card(<IgRow inset={false} icon={<SecGlyph k="tfa" />} label="Two factor is on" sub="You need a code from your authenticator app to log in" />);
      return card(<TwoFactorSection onChange={(v) => setTfa(!!v)} />, '14px 14px 16px');
    }
    if (k === 'lock') return card(<IgRow inset={false} icon={<SecGlyph k="lock" />} label="Require PIN" sub={lock.h ? 'ZChat asks for it when you come back' : 'Ask for a PIN when you come back to ZChat'} right={<IgToggle on={!!lock.h} onClick={() => setLockFlow(lock.h ? 'off' : 'on')} />} />);
    if (k === 'bio') return card(<BioToggleRow sub={lock.h ? 'Works for app lock, hidden chats and spending' : 'Turn on App lock first, one step back'} />);
    if (k === 'spend') return card(<IgRow inset={false} icon={<SecGlyph k="spend" />} label="Spending lock" sub={lock.h ? 'Shop, gifts and sending coins' : 'You will create a PIN first'} right={<IgToggle on={spend.on} onClick={spend.toggle} />} />);
    if (k === 'msg') {
      return card(<ChoiceList label="Who can message you" value={msg} onChange={pickMsg} options={[
        { k: 'everyone', label: 'Everyone', sub: 'People you do not follow go to Message requests first' },
        { k: 'following', label: 'Only people I follow', sub: 'Anyone else cannot start a new chat with you' },
      ]} />, '4px 10px');
    }
    if (k === 'private') return card(<IgRow inset={false} icon={<SecGlyph k="private" />} label="Private account" sub="New followers need your approval first" right={<IgToggle on={priv} onClick={togglePrivate} />} />);
    if (k === 'seen') {
      return (
        <>
          {card(<IgRow inset={false} icon={<EyeOff />} label="Hide activity status" sub="Nobody sees when you are online or last seen" right={<IgToggle on={!!hideActivity} onClick={() => { if (onToggleActivity) onToggleActivity(); }} />} />)}
          {!hideActivity && card(
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '10px 4px 2px' }}>Who can see it</div>
              <ChoiceList label="Who can see when you are online" value={seenValue} onChange={pickSeen} options={[
                { k: 'everyone', label: 'Everyone' },
                { k: 'followers', label: 'My followers' },
                ...(online === 'chosen' || lastSeen === 'chosen' ? [{ k: 'chosen', label: 'Only chosen people', sub: 'Pick them in Who can see what' }] : []),
              ]} />
            </>,
            '4px 10px',
          )}
        </>
      );
    }
    if (k === 'devices') return card(<SessionsSection userId={uid} />, '6px 14px 14px');
    if (k === 'safety') {
      return card(
        <>
          <IgRow inset={false} icon={<EyeOff />} label="Hide offensive words" sub="Common swear words and insults are covered" right={<IgToggle on={words.on} onClick={toggleWords} />} />
          <IgRow inset={false} icon={<SecGlyph k="safety" />} label="Your own words" value={words.words.length ? String(words.words.length) : 'None'} onClick={() => setWordsPage(true)} />
          {onOpenRestricted && <IgRow inset={false} icon={<RestrictIcon />} label="Restricted accounts" sub="Restrict someone from their profile or chat" value={restrictedCount ? String(restrictedCount) : 'None'} onClick={onOpenRestricted} />}
        </>,
      );
    }
    return null;
  };
  const footer = finished
    ? <BigButton label="Done" onClick={onClose} />
    : (
      <div style={{ display: 'flex', gap: 10 }}>
        {at > 0 && <div style={{ flex: '0 0 36%' }}><BigButton label="Back" ariaLabel="Previous step" tone="plain" onClick={() => { setErr(''); setIdx(at - 1); }} /></div>}
        <div style={{ flex: 1 }}><BigButton label={at >= total - 1 ? 'See my score' : 'Next'} ariaLabel={at >= total - 1 ? 'See my score' : 'Next step'} onClick={next} /></div>
      </div>
    );
  return (
    <FullPage title="Security checkup" onBack={onClose} zIndex={70} footer={footer}>
      {finished ? (
        <CheckupScore steps={steps} onJump={(i) => { setFinished(false); setIdx(i); }} />
      ) : (
        <>
          <CheckupProgress i={at} n={total} />
          <div key={cur.k} className={reducedMotion() ? undefined : 'zchat-tab-in'}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 8px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.accentSoft, color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SecGlyph k={cur.g} size={36} /></div>
              <div style={{ fontSize: 21, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em', marginTop: 16 }}>{cur.title}</div>
              <div style={{ fontSize: 14.5, color: theme.muted, lineHeight: 1.5, marginTop: 6, maxWidth: 330 }}>{cur.why}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 13.5, fontWeight: 700, color: cur.good ? kitOnInk(theme) : theme.muted }}>
                {cur.good ? <SecGlyph k="check" size={16} sw={3} /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.muted2 }} />}
                {cur.good ? 'Looks good' : 'Recommended'}
              </div>
            </div>
            {control(cur.k)}
            {err && <div role="alert" style={{ padding: '12px 4px 0', fontSize: 13, color: theme.danger, fontWeight: 700 }}>{err}</div>}
          </div>
        </>
      )}
      {lockFlow === 'on' && <AppPinSetupPage onClose={() => setLockFlow(null)} onDone={() => setLockFlow(null)} />}
      {lockFlow === 'off' && (
        <AppPinVerifyPage sub={spendLockActive() ? 'Your current PIN. The spending lock turns off too.' : 'Your current PIN'}
          onClose={() => setLockFlow(null)} onDone={() => { appLockTurnOff(); setLockFlow(null); }} />
      )}
      {spend.node}
      {wordsPage && <HiddenWordsPage onClose={() => { setWordsPage(false); const c = hiddenWordsCfg(); setWords({ on: c.on, words: c.words }); }} />}
    </FullPage>
  );
}
function QuietHoursSection() {
  const { theme } = useTheme();
  const [q, setQ] = useState(readQuiet);
  const save = (next) => { setQ(next); try { localStorage.setItem('zchat-quiet', JSON.stringify(next)); } catch {} writeWorkerPref('/__quiet', () => next); };
  const hourLabel = (h) => fmtHM(new Date(2020, 0, 1, h));
  const sel = { ...inputStyle(theme), width: 'auto', minWidth: 110, padding: '8px 10px', fontSize: 14.5 };
  return (
    <div>
      <IgRow inset={false} icon={<Moon size={16} />} label="Quiet hours" sub="No message sounds while you sleep" right={<IgToggle on={q.on} onClick={() => save({ ...q, on: !q.on })} />} />
      {q.on && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 2px', borderBottom: `1px solid ${theme.border}`, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, color: theme.ink, fontWeight: 600 }}>From</span>
          <select aria-label="Quiet from" value={q.from} onChange={(e) => save({ ...q, from: parseInt(e.target.value, 10) })} style={sel}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</select>
          <span style={{ fontSize: 14.5, color: theme.ink, fontWeight: 600 }}>to</span>
          <select aria-label="Quiet to" value={q.to} onChange={(e) => save({ ...q, to: parseInt(e.target.value, 10) })} style={sel}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</select>
        </div>
      )}
    </div>
  );
}
function writeVip(uid, list) {
  const clean = list.slice(0, 50).map((p) => ({ id: p.id, name: p.name || '', username: p.username || '', avatar: p.avatar || null }));
  writeJsonLs(`zchat-vip-${uid}`, clean);
  if (vipNow.uid === uid) vipNow.ids = new Set(clean.map((p) => p.id));
  syncAlertPrefs(uid);
  try { window.dispatchEvent(new Event('zchat-vip')); } catch {}
}
function VipSection({ uid }) {
  const { theme } = useTheme();
  const [list, setList] = useState(() => readVip(uid));
  const [picking, setPicking] = useState(false);
  useEffect(() => { const on = () => setList(readVip(uid)); window.addEventListener('zchat-vip', on); return () => window.removeEventListener('zchat-vip', on); }, [uid]);
  const save = (next) => { setList(next); writeVip(uid, next); };
  return (
    <div>
      {list.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 2px', borderBottom: `1px solid ${theme.border}` }}>
          <Avatar emoji={p.avatar} name={p.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || p.username}</div>
            {p.username && <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>}
          </div>
          <div role="button" aria-label={`Remove ${p.name || p.username} from VIP`} onClick={() => { hapticTap(); save(list.filter((x) => x.id !== p.id)); }} className="zchat-press" style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={17} /></div>
        </div>
      ))}
      <IgRow inset={false} icon={<UserPlus size={16} />} label={list.length ? 'Add or remove people' : 'Add people'} onClick={() => setPicking(true)} />
      <div style={{ padding: '10px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>VIP people still reach you with sound and vibration during quiet hours. Chats you muted stay muted.</div>
      {picking && (
        <PickPeoplePage userId={uid} title="VIP" subtitle="They get through during quiet hours" initial={list} max={50} actionLabel="Save" zIndex={90}
          onClose={() => setPicking(false)} onDone={(picked) => { setPicking(false); hapticTap(); save(picked); }} />
      )}
    </div>
  );
}

function ChatLookPreview({ wallpaper, bubbleStyle: styleIn, title, avatar, height = 168, composer }) {
  const { theme, bubbleColor, bubbleStyle: styleTheme, fontScale, bgPatternOn } = useTheme();
  const styleKey = styleIn !== undefined ? styleIn : styleTheme;
  const colorSpec = BUBBLE_COLORS[bubbleColor] || BUBBLE_COLORS.default;
  const ct = chatThemeOf(wallpaper);
  const meBg = ct ? themeGradCss(ct) : ((theme.dark ? colorSpec.meDark : colorSpec.me) || theme.bubbleMe);
  const meInk = ct ? ct.ink : theme.dark ? '#FFFFFF' : (colorSpec.me ? '#15151A' : theme.ink);
  const themBg = ct ? chatThemeThem(ct, theme.dark) : theme.bubbleThem;
  const charKey = bubbleKeyOf(styleKey);
  const wp = wallpaper ? wallpaperBgStyle(wallpaper, theme.dark) : null;
  const fs = 14 * (fontScale || 1);
  const name = title || 'Sam';
  const them = (text) => (
    <div style={{ alignSelf: 'flex-start', maxWidth: '78%', background: themBg, color: theme.ink, padding: '8px 12px', borderRadius: 18, borderBottomLeftRadius: 6, fontSize: fs, lineHeight: 1.35 }}>{text}</div>
  );
  const mine = (text) => (charKey ? (
    <CharBubbleSample k={charKey} text={text} cw={42} fontSize={fs} />
  ) : (
    <div style={{ alignSelf: 'flex-end', maxWidth: '78%', background: meBg, color: meInk, padding: '8px 12px', borderRadius: 18, borderBottomRightRadius: 6, fontSize: fs, lineHeight: 1.35 }}>{text}</div>
  ));
  return (
    <div aria-label="Preview" style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${theme.border}`, background: theme.bgGradient, flexShrink: 0 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: theme.panelBg, borderBottom: `1px solid ${theme.border}` }}>
        <ArrowLeft size={18} color={theme.ink} style={{ position: 'relative', flexShrink: 0 }} />
        <div style={{ position: 'relative', display: 'flex' }}><Avatar emoji={avatar} name={name} size={30} /></div>
        <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontSize: 11, color: theme.muted }}>online</div>
        </div>
      </div>
      <div style={{ position: 'relative', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 6, minHeight: height, boxSizing: 'border-box', ...(wp || {}) }}>
        {liveWallOf(wallpaper) && <><LiveWallCanvas k={liveWallOf(wallpaper).k} dark={theme.dark} /><div style={{ position: 'absolute', inset: 0, background: liveWallVeil(theme.dark) }} /></>}
        {!wp && bgPatternOn && <div style={{ position: 'absolute', inset: 0, opacity: theme.dark ? 0.06 : 0.05, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '18px 18px', color: theme.ink }} />}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {them('Are we still on for tonight?')}
          {mine('Yes, see you at 8')}
          {them('Perfect')}
        </div>
      </div>
      {composer && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderTop: `1px solid ${theme.border}`, background: theme.panelBg }}>
          <div style={{ flex: 1, height: 32, borderRadius: 16, background: theme.inputBg, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 13 * (fontScale || 1), color: theme.muted }}>Message</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={15} color="white" /></div>
        </div>
      )}
    </div>
  );
}

const THEME_TEXT_SIZES = [[0.9, 'Small'], [1, 'Default'], [1.1, 'Large'], [1.2, 'Extra large'], [1.3, 'Largest']];
function textSizeIdx(v) {
  let best = 1;
  let gap = 9;
  THEME_TEXT_SIZES.forEach(([s], i) => { const d = Math.abs(s - (v || 1)); if (d < gap) { gap = d; best = i; } });
  return best;
}
function ModeArt({ kind, theme }) {
  const cid = `zm${React.useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const lightMe = makeAccentPalette(theme.coral).meLight;
  const darkMe = makeAccentPalette(theme.coral).meDark;
  const screen = (bg, bar, them, me, line) => (
    <>
      <rect x="0" y="0" width="64" height="64" fill={bg} />
      <rect x="0" y="0" width="64" height="15" fill={bar} />
      <circle cx="9.5" cy="7.5" r="3.6" fill={line} />
      <rect x="16.5" y="5.6" width="19" height="3.8" rx="1.9" fill={line} />
      <rect x="6" y="22" width="30" height="9" rx="4.5" fill={them} />
      <rect x="25" y="35" width="33" height="9" rx="4.5" fill={me} />
      <rect x="6" y="48" width="21" height="8" rx="4" fill={them} />
    </>
  );
  const light = screen('#F3F3F6', '#FFFFFF', '#E1E1E8', lightMe, '#C9C9D2');
  const dark = screen('#17171B', '#24242A', '#2E2E35', darkMe, '#4A4A54');
  return (
    <svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%' }}>
      {kind === 'schedule' ? (
        <>
          <defs><clipPath id={`${cid}b`}><path d="M0 0H64V30H0Z" /></clipPath></defs>
          {dark}
          <g clipPath={`url(#${cid}b)`}>{light}</g>
          <circle cx="51" cy="52.5" r="6" fill="#17171B" stroke="#C9C9D2" strokeWidth="1.6" />
          <path d="M51 49.4v3.3l2.2 1.4" fill="none" stroke="#C9C9D2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : kind === 'auto' ? (
        <>
          <defs><clipPath id={`${cid}a`}><path d="M0 0H64L0 64Z" /></clipPath></defs>
          {dark}
          <g clipPath={`url(#${cid}a)`}>{light}</g>
        </>
      ) : kind === 'dark' ? dark : light}
    </svg>
  );
}

function ThemeBubbleArt({ k, me, ink }) {
  const spec = CHAR_BUBBLES[k];
  if (!spec) return <div style={{ padding: '7px 12px', borderRadius: 16, borderBottomRightRadius: 5, background: me, color: ink, fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Hi</div>;
  return <div style={{ display: 'flex', justifyContent: 'center', width: '100%', padding: '0 8px', boxSizing: 'border-box' }}><CharBubbleSample k={k} text="Hi" cw={30} fontSize={12} /></div>;
}

function TextSizePreview({ meBg, meInk, k = 1, kb = 1 }) {
  const { theme } = useTheme();
  const bubble = (mine, text) => (
    <div style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', background: mine ? meBg : theme.bubbleThem, color: mine ? meInk : theme.ink, padding: '8px 12px', borderRadius: 18, [mine ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 6, fontSize: 15 * kb, lineHeight: 1.32, transition: 'font-size 0.15s ease' }}>{text}</div>
  );
  return (
    <div aria-label="Text size preview" style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${theme.border}`, background: theme.bgGradient, marginBottom: 14 }}>
      <div style={{ padding: '14px 16px 2px', fontSize: 24 * k, fontWeight: 800, letterSpacing: '-0.02em', color: theme.ink }}>Chats</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px 10px' }}>
        <Avatar name="Maya" size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 16 * k, fontWeight: 700, letterSpacing: '-0.01em', color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Maya</div>
            <div style={{ fontSize: 12.5 * k, fontWeight: 600, color: theme.coral, flexShrink: 0 }}>9:41</div>
          </div>
          <div style={{ fontSize: 14.5 * k, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>Did you see the sunset?</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px 14px', borderTop: `1px solid ${theme.hair}` }}>
        {bubble(false, 'Did you see the sunset?')}
        {bubble(true, 'I did, I took a photo for you')}
      </div>
    </div>
  );
}

function keepSpot(el, change) {
  let sc = el ? el.parentElement : null;
  while (sc && !(sc.scrollHeight > sc.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
  const before = el ? el.getBoundingClientRect().top / Math.max(1, window.innerHeight) : 0;
  change();
  if (!el || !sc) return;
  requestAnimationFrame(() => {
    if (!el.isConnected) return;
    const delta = el.getBoundingClientRect().top - before * window.innerHeight;
    if (Math.abs(delta) > 1) sc.scrollTop += delta;
  });
}

function TextSizeBlock({ meBg, meInk, showLabel }) {
  const { theme, setFontScale } = useTheme();
  const cur = useUiTextScale();
  const curIdx = textSizeIdx(cur);
  const [drag, setDrag] = useState(null);
  const idx = drag == null ? curIdx : drag;
  const n = THEME_TEXT_SIZES.length;
  const rowRef = useRef(null);
  const trackRef = useRef(null);
  const plan = uiZoomPlan(drag == null ? cur : THEME_TEXT_SIZES[drag][0]);
  const z0 = uiZoom.z || 1;
  const pick = (i) => {
    setDrag(null);
    const v = THEME_TEXT_SIZES[i][0];
    if (Math.abs(v - cur) < 0.001) return;
    hapticTap(); playUiSound('tap');
    keepSpot(rowRef.current, () => setFontScale(v));
  };
  const at = (x) => {
    const el = trackRef.current;
    if (!el) return idx;
    const r = el.getBoundingClientRect();
    const f = (x - r.left - 9) / Math.max(1, r.width - 18);
    return Math.max(0, Math.min(n - 1, Math.round(f * (n - 1))));
  };
  const down = (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} setDrag(at(e.clientX)); };
  const move = (e) => { if (drag == null) return; const i = at(e.clientX); if (i !== drag) { setDrag(i); hapticTap(); } };
  const up = (e) => { if (drag == null) return; pick(at(e.clientX)); };
  const key = (e) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    pick(Math.max(0, Math.min(n - 1, curIdx + step)));
  };
  const label = THEME_TEXT_SIZES[idx][1];
  return (
    <>
      <TextSizePreview meBg={meBg} meInk={meInk} k={plan.z / z0} kb={plan.v / z0} />
      {showLabel && <div aria-live="polite" style={{ textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: theme.ink, margin: '2px 0 8px' }}>{label}</div>}
      <div ref={rowRef} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 0' }}>
        <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 700, color: theme.muted, width: 14, textAlign: 'center' }}>A</span>
        <div ref={trackRef} role="slider" tabIndex={0} aria-label="Text size" aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={idx} aria-valuetext={label}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)} onKeyDown={key}
          style={{ position: 'relative', flex: 1, height: 40, cursor: 'pointer', touchAction: 'pan-y', outline: 'none' }}>
          <div style={{ position: 'absolute', left: 9, right: 9, top: 18, height: 4, borderRadius: 2, background: theme.dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)' }} />
          <div style={{ position: 'absolute', left: 9, top: 18, height: 4, borderRadius: 2, width: `calc((100% - 18px) * ${idx / (n - 1)})`, background: theme.coral, transition: 'width 0.15s ease' }} />
          {THEME_TEXT_SIZES.map(([v, l], i) => (
            <div key={l} aria-hidden="true" style={{ position: 'absolute', top: 3, left: `calc(9px + (100% - 18px) * ${i / (n - 1)} - 17px)`, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: i === idx ? 24 : 8, height: i === idx ? 24 : 8, borderRadius: '50%', background: i === idx ? '#FFFFFF' : (i < idx ? theme.coral : (theme.dark ? '#3A3A42' : '#D5D5DC')), boxShadow: i === idx ? '0 1px 2px rgba(0,0,0,0.18), 0 3px 10px rgba(0,0,0,0.16), 0 0 0 0.5px rgba(0,0,0,0.06)' : 'none', transform: i === idx && drag != null ? 'scale(1.12)' : 'none', transition: 'all 0.15s ease' }} />
            </div>
          ))}
        </div>
        <span aria-hidden="true" style={{ fontSize: 21, fontWeight: 700, color: theme.muted, width: 16, textAlign: 'center' }}>A</span>
      </div>
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '6px 2px 0', lineHeight: 1.45 }}>Changes text across ZChat on this device, chat bubbles included.</div>
    </>
  );
}

function bubbleInks(theme, bubbleColor) {
  const spec = BUBBLE_COLORS[BUBBLE_COLORS[bubbleColor] ? bubbleColor : 'default'];
  return { meBg: (theme.dark ? spec.meDark : spec.me) || theme.bubbleMe, meInk: theme.dark ? '#FFFFFF' : (spec.me ? '#15151A' : theme.ink) };
}

function TextSizeSection() {
  const { theme, bubbleColor } = useTheme();
  const { meBg, meInk } = bubbleInks(theme, bubbleColor);
  return <div style={{ padding: '10px 0 28px' }}><TextSizeBlock meBg={meBg} meInk={meInk} showLabel /></div>;
}

function LangGlyph({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17" />
      <path d="M12 3c2.5 2.4 3.8 5.4 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3z" />
    </svg>
  );
}

function LanguageSection() {
  const { theme } = useTheme();
  const cur = useZLang();
  const [want, setWant] = useState(zlangWanted);
  const pick = (k) => { if (k === want && k === cur) return; hapticTap(); setWant(k); setZLang(k); };
  return (
    <div style={{ paddingTop: 6 }}>
      <div role="radiogroup" aria-label="Language">
        {ZLANGS.map((l) => (
          <div key={l.k} role="radio" aria-checked={want === l.k} lang={l.k} onClick={() => pick(l.k)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '8px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div data-zuser="" style={{ fontSize: 16, fontWeight: 600, color: theme.ink, lineHeight: 1.4 }}>{l.native}</div>
              {l.k !== cur && <div style={{ fontSize: 13, color: theme.muted, marginTop: 1, lineHeight: 1.4 }}>{l.name}</div>}
            </div>
            {want === l.k && (want === cur ? <Check size={18} color={theme.coral} strokeWidth={2.6} /> : <Spinner size={16} color={theme.coral} />)}
          </div>
        ))}
      </div>
      <div style={{ padding: '12px 2px 0', fontSize: 12.5, color: theme.muted, lineHeight: 1.5 }}>Messages, names and posts stay the way people wrote them.</div>
    </div>
  );
}

export function AppearanceSection({ uid }) {
  const { theme, dark, themeMode, setThemeMode, accentName, setAccentName, bubbleColor, setBubbleColor, bubbleStyle, setBubbleStyle, fontScale, setFontScale, bgPatternOn, setBgPatternOn, pureBlack, setPureBlack, accentCustom, setAccentCustom } = useTheme();
  const ownedBubbles = useOwnedBubbles(uid);
  const [allStyles, setAllStyles] = useState(false);
  const [pickAccent, setPickAccent] = useState(false);
  const tap = () => { hapticTap(); playUiSound('tap'); };
  const mode = themeMode || (dark ? 'dark' : 'light');
  const artTheme = { ...theme, accentKey: accentName };
  const page = igPalette(theme).bg;
  const textScale = useUiTextScale();
  const styleKey = bubbleKeyOf(bubbleStyle) || 'classic';
  const quick = ['classic', ...(ownedBubbles || []).filter((k) => CHAR_BUBBLES[k])];
  const styleLabel = styleKey === 'classic' ? 'Classic' : CHAR_BUBBLES[styleKey].label;
  const isDefault = mode === 'dark' && accentName === 'coral' && (bubbleColor || 'default') === 'default' && styleKey === 'classic' && Math.abs((textScale || 1) - 1) < 0.01 && !bgPatternOn && !pureBlack;
  const reset = () => {
    tap();
    setPureBlack(false);
    setThemeMode('dark');
    setAccentName('coral');
    setBubbleColor('default');
    setBubbleStyle('classic');
    setFontScale(1);
    setBgPatternOn(false);
  };
  const ring = (on) => (on ? `0 0 0 2.5px ${page}, 0 0 0 4.5px ${theme.coral}` : `inset 0 0 0 1px ${theme.dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)'}`);
  const dotSwatch = (key, color, on, onPick, label, size) => (
    <div key={key} role="button" aria-label={label} aria-pressed={on} onClick={() => { tap(); onPick(); }} className="zchat-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minWidth: 0, flex: 1, padding: '5px 0' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: color, boxShadow: ring(on), display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 180ms ease-out' }}>
        {on && <Check size={15} color={/^#F|^#E|^#D/i.test(String(color)) ? '#15151A' : '#FFFFFF'} strokeWidth={3} />}
      </div>
    </div>
  );
  const colorKey = BUBBLE_COLORS[bubbleColor] ? bubbleColor : 'default';
  const colorLabel = colorKey === 'default' ? 'Same as app colour' : BUBBLE_COLORS[colorKey].label;
  const colorSpec = BUBBLE_COLORS[colorKey];
  const meBg = (theme.dark ? colorSpec.meDark : colorSpec.me) || theme.bubbleMe;
  const meInk = theme.dark ? '#FFFFFF' : (colorSpec.me ? '#15151A' : theme.ink);
  const subHead = (title, value, right) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 28, marginBottom: 6 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.ink, flexShrink: 0 }}>{title}</div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {right}
    </div>
  );
  const switchRow = (aria, on, flip, title, sub, lead) => (
    <div role="button" aria-label={aria} aria-pressed={!!on} onClick={() => { tap(); flip(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '6px 0', cursor: 'pointer' }}>
      {lead}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{title}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.35 }}>{sub}</div>
      </div>
      <IgToggle on={!!on} />
    </div>
  );
  const accentLabel = accentName === 'custom' ? 'Your own colour' : (ACCENT_PALETTES[accentName] || ACCENT_PALETTES.blue).label;
  return (
    <div style={{ paddingBottom: 28 }}>
      <div style={{ paddingTop: 6 }}>
        <ChatLookPreview height={124} composer />
      </div>

      <KitSection title="Mode" style={{ marginTop: 22 }}>
        <PickTiles label="Mode" fit size={66} ringBg={page} value={mode} onChange={(k) => { playUiSound('tap'); setThemeMode(k); }}
          options={[['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto'], ['schedule', 'Timed']].map(([k, label]) => ({ k, label, aria: label, bg: k === 'dark' ? '#17171B' : '#F3F3F6', art: <ModeArt kind={k} theme={artTheme} /> }))} />
        {(mode === 'auto' || mode === 'schedule') && <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '8px 2px 0' }}>{mode === 'auto' ? 'Follows your phone. Light in the day and dark at night if your phone does that.' : 'Dark at the times you pick, light the rest of the day.'}</div>}
        {mode === 'schedule' && <ModeScheduleRows />}
        <div style={{ marginTop: 6 }}>{switchRow('Pure black', pureBlack, () => setPureBlack(!pureBlack), 'Pure black', 'Dark mode uses true black. Easier on battery for phones with OLED screens.')}</div>
      </KitSection>

      <KitSection title="App colour" right={accentLabel} style={{ marginTop: 22 }}>
        <div role="group" aria-label="App color" style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {Object.entries(ACCENT_PALETTES).map(([key, spec]) => dotSwatch(key, spec.coral, accentName === key, () => setAccentName(key), `App color ${spec.label}`, 36))}
          {dotSwatch('custom', accentName === 'custom' ? accentCustom : 'conic-gradient(#FF3B30, #FFCC00, #34C759, #00C7BE, #007AFF, #AF52DE, #FF2D55, #FF3B30)', accentName === 'custom', () => setPickAccent(true), 'Any color', 36)}
        </div>
        <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', lineHeight: 1.45 }}>Buttons, links and highlights across ZChat.</div>
      </KitSection>

      <KitSection title="Your bubbles" style={{ marginTop: 26 }}>
        {subHead('Colour', colorLabel)}
        <div role="group" aria-label="Bubble color" style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {Object.entries(BUBBLE_COLORS).map(([key, spec]) => dotSwatch(key, spec.me || theme.bubbleMe, colorKey === key, () => setBubbleColor(key), key === 'default' ? 'Bubble color same as app' : `Bubble color ${spec.label}`, 34))}
        </div>
        <div style={{ height: 18 }} />
        {subHead('Style', `${styleLabel}. Everyone you chat with sees it.`, <div role="button" aria-label="All bubble styles" onClick={() => { tap(); setAllStyles(true); }} style={{ fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', padding: '6px 0 6px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}>See all</div>)}
        <PickTiles label="Bubble style" size={80} bleed={16} ringBg={page} value={styleKey}
          onChange={(k) => { if (k === '__more') { tap(); setAllStyles(true); return; } playUiSound('tap'); setBubbleStyle(k); }}
          options={[
            ...quick.map((k) => ({ k, label: k === 'classic' ? 'Classic' : CHAR_BUBBLES[k].label, aria: `Bubble style ${k === 'classic' ? 'Classic' : CHAR_BUBBLES[k].label}`, art: <ThemeBubbleArt k={k} me={meBg} ink={meInk} /> })),
            { k: '__more', label: `${CHAR_BUBBLE_KEYS.length} bubbles`, aria: 'More bubble styles', art: <BubblesIcon size={26} strokeWidth={1.8} /> },
          ]} />
      </KitSection>

      <KitSection title="Text size" right={THEME_TEXT_SIZES[textSizeIdx(textScale)][1]} style={{ marginTop: 26 }}>
        <TextSizeBlock meBg={meBg} meInk={meInk} />
      </KitSection>

      <AxTabsRow />

      <KitSection title="Chat background" style={{ marginTop: 26 }}>
        {switchRow('Dot pattern', bgPatternOn, () => setBgPatternOn(!bgPatternOn), 'Dot pattern', 'A soft pattern behind chats with no wallpaper', (
          <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: theme.bgGradient, boxShadow: `inset 0 0 0 1px ${theme.border}`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: theme.dark ? 0.3 : 0.22, backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px', color: theme.ink }} />
          </div>
        ))}
      </KitSection>

      {pickAccent && <AccentPickerSheet value={accentName === 'custom' ? accentCustom : theme.coral} onClose={() => setPickAccent(false)} onPick={(hex) => { setAccentCustom(hex); setAccentName('custom'); setPickAccent(false); hapticTap(); }} />}
      {!isDefault && (
        <div role="button" aria-label="Reset theme" onClick={reset} style={{ marginTop: 22, textAlign: 'center', fontSize: 14.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', padding: 10 }}>Reset to default</div>
      )}
      {allStyles && uid && <BubbleShopPage uid={uid} zIndex={700} onClose={() => setAllStyles(false)} />}
    </div>
  );
}

function EmailDigestRow() {
  const ax = useAx();
  const on = !!ax.email_missed;
  const flip = () => {
    if (axPrefs.off) { appSnack('Emails switch on once the latest ZChat setup is finished.'); return; }
    axSet({ email_missed: !on });
  };
  return (
    <>
      <IgHeading>Email</IgHeading>
      <IgRow inset={false} icon={<Mail size={16} />} label="Email me about missed messages" sub="Once a day at most, if messages wait for you. Names only, never what was said." right={<IgToggle on={on} onClick={flip} />} />
    </>
  );
}
const axLabDraft = {};
function LabFeedbackSheet({ lab, onClose, onSend }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  useBackClose(true, onClose);
  const [text, setText] = useState(() => axLabDraft[lab.k] || '');
  const clean = text.trim();
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 880, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} role="dialog" aria-modal="true" aria-label={`Feedback on ${lab.t}`}
          style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '20px 20px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '4px 16px 2px', touchAction: 'none' }}>Send feedback</div>
          <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', padding: '0 20px 12px' }}>{lab.t}</div>
          <div style={{ padding: '0 16px' }}>
            <textarea value={text} onChange={(e) => { const v = e.target.value.slice(0, 1000); axLabDraft[lab.k] = v; setText(v); }} autoFocus rows={4} aria-label="Your feedback" placeholder="What worked, what did not"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'none', minHeight: 110, padding: '12px 14px', borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontFamily: FONT, fontSize: 16, lineHeight: 1.4, outline: 'none' }} />
            <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 12px' }}>Your phone, browser and app version go with it so we can see what you saw.</div>
            <BigButton label="Send feedback" disabled={clean.length < 2} onClick={() => { if (clean.length >= 2) onSend(clean); }} />
          </div>
        </div>
      </div>
    </Portal>
  );
}
function LabsPage({ me, onClose }) {
  useBackClose(true, onClose);
  const { theme, dark } = useTheme();
  const ax = useAx();
  const [feedback, setFeedback] = useState(null);
  const flip = (k) => {
    const on = ax.labs.includes(k);
    axSet({ labs: on ? ax.labs.filter((x) => x !== k) : [...ax.labs, k] });
  };
  const sendFeedback = (lab, body) => {
    setFeedback(null);
    playUiSound('send');
    appSnack('Thanks. Your feedback is with the team.');
    if (!me) return;
    const device = axDeviceInfo(dark);
    axSendReport(me.id, { kind: 'lab', lab: lab.k, body, files: [], device: { ...device, labs: ax.labs } }).then(({ error }) => { if (error) { appSnack(axReportError(error)); return; } delete axLabDraft[lab.k]; }, () => appSnack('That feedback did not send. Your words are kept, so try again.'));
  };
  return (
    <FullPage title="ZChat Labs" onBack={onClose} zIndex={72} pad={false}>
      {!LABS.length ? (
        <EmptyState art="nothing" title="Nothing to try right now" text="New features show up here first." />
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '10px 20px 4px', textWrap: 'pretty' }}>Features we are still testing. Turn one on to try it before everyone else. They can change, and some may not stay.</div>
          {LABS.map((lab, i) => {
            const on = ax.labs.includes(lab.k);
            return (
              <div key={lab.k} data-lab={lab.k} style={{ padding: '14px 20px 12px', borderBottom: i < LABS.length - 1 ? `1px solid ${theme.hair}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, color: theme.ink, lineHeight: 1.3 }}>{lab.t}</div>
                  <IgToggle on={on} onClick={() => flip(lab.k)} />
                </div>
                <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.45, marginTop: 6, textWrap: 'pretty' }}>{lab.d}</div>
                <div role="button" aria-label={`Send feedback about ${lab.t}`} onClick={() => { hapticTap(); setFeedback(lab); }} style={{ display: 'inline-block', marginTop: 8, fontSize: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', padding: '4px 0' }}>Send feedback</div>
              </div>
            );
          })}
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '16px 20px 0' }}>Your choices here follow you to every phone and computer you log in on.</div>
        </>
      )}
      {feedback && <LabFeedbackSheet lab={feedback} onClose={() => setFeedback(null)} onSend={(body) => sendFeedback(feedback, body)} />}
    </FullPage>
  );
}
async function bioRegister() {
  const rpId = bioRpId();
  if (!rpId) return null;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  let userId = null;
  try { userId = new TextEncoder().encode(`zchat:${getDeviceId()}`).slice(0, 64); } catch { userId = crypto.getRandomValues(new Uint8Array(16)); }
  const cred = await navigator.credentials.create({ publicKey: {
    challenge, rp: { id: rpId, name: 'ZChat' }, user: { id: userId, name: 'ZChat unlock', displayName: 'Unlock ZChat on this device' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged', requireResidentKey: false },
    timeout: 60000, attestation: 'none',
  } });
  return cred && cred.rawId ? bioB64u(cred.rawId) : null;
}
function bioNameTitle() {
  const n = bioName();
  return n.charAt(0).toUpperCase() + n.slice(1);
}
function setWallDim(key, v) {
  try { const m = JSON.parse(localStorage.getItem('zchat-wall-dim') || '{}'); m[key] = Math.round(v * 100) / 100; localStorage.setItem('zchat-wall-dim', JSON.stringify(m)); } catch {}
}

function ChangePasswordForm({ email, hasPassword, onDone }) {
  const { theme } = useTheme();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const sameAsCurrent = hasPassword && next.length > 0 && next === current;
  const problem = next.length > 0 && next.length < 6 ? 'Use at least 6 characters.'
    : again.length > 0 && next !== again ? 'The two passwords do not match.'
    : sameAsCurrent ? 'Your new password must be different from the current one.' : '';
  const ready = (!hasPassword || current.length > 0) && next.length >= 6 && next === again && !sameAsCurrent;

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setErr('');
    if (hasPassword) {
      const { error: checkErr } = await signInWithPassword(email, current);
      if (checkErr) {
        setBusy(false);
        setErr(/invalid|credentials|incorrect|wrong/i.test(String(checkErr.message || checkErr)) ? 'Your current password is not right.' : friendlyError(checkErr, "Couldn't check your current password. Try again."));
        return;
      }
    }
    const { error } = await setPassword(next);
    setBusy(false);
    if (error) { setErr(friendlyError(error, "Couldn't update your password. Try again.")); return; }
    setDone(true);
    setCurrent(''); setNext(''); setAgain('');
    setTimeout(onDone, 1400);
  };

  const field = (value, setValue, placeholder, autoComplete) => (
    <div style={{ position: 'relative', marginBottom: 10 }}>
      <input style={{ ...inputStyle(theme), paddingRight: 44 }} type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} autoComplete={autoComplete} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      <div role="button" aria-label={show ? 'Hide passwords' : 'Show passwords'} onClick={() => setShow((v) => !v)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: theme.muted, display: 'flex' }}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </div>
    </div>
  );

  if (done) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0' }} className="zchat-fade">
        <ShieldCheck size={32} color={theme.teal} style={{ marginBottom: 10 }} />
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Password updated</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, marginBottom: 14 }}>
        {hasPassword ? 'Enter your current password, then choose a new one.' : 'You logged in with Google. Add a password to also log in with your email.'}
      </div>
      {hasPassword && field(current, setCurrent, 'Current password', 'current-password')}
      {field(next, setNext, 'New password', 'new-password')}
      {field(again, setAgain, 'Confirm new password', 'new-password')}
      {(problem || err) && <div style={{ color: theme.danger, fontSize: 12.5, marginBottom: 6 }}>{err || problem}</div>}
      <button style={primaryBtn(theme, !ready || busy)} disabled={!ready || busy} onClick={submit}>
        {busy ? <Spinner /> : 'Update password'}
      </button>
    </div>
  );
}
