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
  APP_VERSION,
  ART_BG,
  ActionSheet,
  AiCharIcon,
  AppPinPad,
  ArtCtx,
  Avatar,
  BIRTHDAY_PINK,
  BigButton,
  BroadcastIcon,
  CHAR_BUBBLES,
  CHAR_BUBBLE_KEYS,
  CL,
  COMPLIMENT_BY,
  CR_SHARE,
  CUSTOM_BADGES,
  CX_KINDS,
  CapsuleEnvelope,
  ChannelIcon,
  CharmPreview,
  ChatRowSheet,
  ChoiceList,
  CoinIcon,
  CollPrice,
  CollSection,
  CollectionIcon,
  ComplimentFace,
  ConfirmDialog,
  ConfirmSheet,
  CrCard,
  CrCoinsLine,
  CrGlyph,
  CrNote,
  CrSheet,
  CxArt,
  CxTile,
  DECOR_ALL,
  DECOR_BY_KEY,
  DECOR_SPRITE,
  DecorFrameBadge,
  DecorHero,
  DecorPlateOnly,
  DetailRow,
  DetailSection,
  DropArt,
  EditionTag,
  EmptyState,
  FONT,
  FeedPanel,
  FlameIcon,
  FullEmojiPicker,
  FullPage,
  GamepadIcon,
  GiftItemArt,
  GroupAvatar,
  HeaderIconButton,
  HomeHeader,
  IgHeading,
  IgRow,
  IgToggle,
  ImageViewer,
  LIVE_WALLS,
  LIVE_WALL_BY,
  LIVE_WALL_PRICE,
  LineGlyph,
  LinkPreviewCard,
  ListenArt,
  ListenIcon,
  LiveWallCanvas,
  LoadFail,
  MONTH_NAMES,
  MediaImg,
  MoreDotsIcon,
  MusicNoteIcon,
  NAME_STYLES,
  NS_KEYS,
  NS_OWN_ITEM,
  NS_OWN_SAMPLE,
  NS_ROOM,
  NameBadge,
  NameStyleArt,
  NoteIcon,
  PackIcon,
  PhotoCropEditor,
  PickTiles,
  PillButton,
  Portal,
  PostTile,
  ProfileEffectLayer,
  ProfileFxIcon,
  QrIcon,
  QuestionIcon,
  RARITY_STYLE,
  RarityTag,
  RichText,
  SI_KINDS,
  SI_SOUND_BY,
  SI_SOUND_PACKS,
  SI_STICKER_BY,
  SI_STICKER_PACKS,
  SI_TYPING,
  SI_TYPING_BY,
  SPOT_SCENES,
  STICKERS,
  STORE_RARITY_ORDER,
  SUPER_FAV_MAX,
  SUPER_FREE,
  SUPER_KEYS,
  SUPER_REACTS,
  SantaHatIcon,
  SecGlyph,
  SegmentedControl,
  SessionDeviceIcon,
  SetShopPage,
  ShopBagIcon,
  ShopItemPage,
  SiItemArt,
  SongBars,
  SongPill,
  Spinner,
  SpotArt,
  StatusMark,
  StoryUsIcon,
  StudioGlyph,
  StyledName,
  SuperFace,
  SuperMark,
  THEMES,
  THEME_KEYS,
  ThemeArt,
  ThemeCanvas,
  ThemePreviewPage,
  TradeArt,
  TypingStyleBubble,
  VERIFIED_TIERS,
  VerifiedBadge,
  WN_SCENES,
  WN_THUMBS,
  WideDim,
  activeStatusOf,
  announceWallet,
  appAlert,
  appSnack,
  bdayForMem,
  birthdayRowMem,
  bubbleKeyOf,
  cachedMediaLookup,
  capsuleCss,
  capsuleOpenText,
  coinsText,
  collectionStats,
  colorForName,
  copyTextToClipboard,
  countWord,
  crCall,
  crCut,
  crDay,
  crErr,
  crFirst,
  crFresh,
  crMissing,
  crOpen,
  crPatch,
  crPut,
  crS,
  crSpend,
  ctAlpha,
  ctBoardAdd,
  ctBoardPut,
  ctBoardSettle,
  ctBumpCount,
  ctClose,
  ctDayName,
  ctDayTime,
  ctEmit,
  ctEntry,
  ctErr,
  ctFindStats,
  ctFirst,
  ctHub,
  ctLoad,
  ctLoadPoll,
  ctMsgText,
  ctNewest,
  ctPeople,
  ctPlay,
  ctSlotAt,
  ctTimeLabel,
  ctTmp,
  cxFlag,
  cxHas,
  cxKnown,
  cxNs,
  cxOwns,
  cxSpec,
  cxWord,
  dataSaverOn,
  daysLeft,
  decorOwned,
  detailsCardBg,
  dropOwned,
  dropPhase,
  editionOf,
  fetchMusic,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  formatCount,
  friendlyError,
  getDeviceId,
  gfCardMem,
  gfCardPut,
  giftRpc,
  hapticTap,
  hashAppPin,
  hashtagPostsMem,
  homeSnapPart,
  homeSnapSet,
  igPalette,
  inputStyle,
  isDecorKey,
  isTouchDevice,
  kitOnInk,
  laterInputValue,
  limitKeep,
  limitLeft,
  limitMem,
  limitNorm,
  linkPreviewCache,
  listText,
  listenCommit,
  listenDurOf,
  listenHub,
  listenItemArtist,
  listenItemTitle,
  listenNow,
  listenPosAt,
  listenTapToListen,
  listenToggle,
  listenUid,
  listenView,
  liveCallHub,
  liveWallBg,
  liveWallVeil,
  loadFailCode,
  loadOwnedBubbles,
  loadTagFollows,
  localTz,
  looksMem,
  mixHex,
  mmss,
  moneyRun,
  moreCoinsText,
  msMem,
  musicKey,
  musicMem,
  notYetPosted,
  nsOwn,
  nsOwnSaved,
  openPhotoTool,
  parseCallLog,
  patchMyProfile,
  pauseSong,
  pfExtrasReload,
  pfFirst,
  pickRecorderType,
  plainPreviewText,
  playSong,
  playUiSound,
  postGoneIds,
  postThumbOf,
  prefetchMusic,
  prepareImageFile,
  primaryBtn,
  privacyAllows,
  profileFnMissing,
  profileShareLink,
  psClock,
  psOpen,
  ptKeyOf,
  questionsMem,
  readAppLock,
  readMeCache,
  readRingtone,
  readTone,
  readUsage,
  reducedMotion,
  relLuminance,
  reminderWhen,
  resolveMedia,
  rewardActive,
  rpcFailText,
  sanitizeAvatar,
  sanitizeAvatarList,
  searchAccounts,
  sendPushNotification,
  shopItemName,
  shopPing,
  shopPrice,
  shortAgo,
  siOwns,
  siSpec,
  siteOrigin,
  songPlayer,
  spPlay,
  specialPreview,
  spendGate,
  statusAt,
  statusGlyphOf,
  statusLive,
  statusNote,
  stopSong,
  stripSilent,
  superDpr,
  superFavList,
  superFavLoad,
  superFavMem,
  superFavPing,
  superFavSave,
  superPack,
  tagFollowMem,
  themeFallback,
  timeAgoLong,
  toggleSong,
  toolErrorText,
  typingStyleMine,
  uploadChatMedia,
  uploadMedia,
  usageDayKey,
  useBackClose,
  useCr,
  useCtTick,
  useDecorLoaded,
  useEdgeSwipeBack,
  useListen,
  useSecondTick,
  useSheetDrag,
  useShopTick,
  useSongPlaying,
  useSongWait,
  useTheme,
  useWallet,
  useWidthOf,
  useWishlist,
  validSong,
  walletAfter,
  walletKeep,
  walletMem,
  walletSettle,
  walletShow,
  walletSpend,
  warmSong,
  writeJsonLs,
} from '../App.jsx';
import {
  AiSparkIcon,
  AppPinSetupPage,
  AvatarMakerIcon,
  BubbleTileDark,
  CR_PRICES,
  CrPriceList,
  DECOR_PIECES,
  DecorConfetti,
  DetailTiles,
  EditionLine,
  GIFT_PAPERS,
  GIFT_RIBBONS,
  GiftBoxIcon,
  KitSection,
  KitSlider,
  LIVE_GAME_INFO,
  LIVE_WALL_PAID,
  LiveWallLock,
  LoginRequestList,
  MEME_FONT,
  PhotoFindIcon,
  SegTabs,
  SetCard,
  ShopChatMock,
  ShopDayNight,
  ShopPagePill,
  ShopProfileMock,
  SongArt,
  TagThumb,
  WishHeart,
  WrapBoxArt,
  buyDeal,
  buyShopItem,
  collectionsMem,
  countdownParts,
  detailRows,
  dropsMem,
  giftCodeClean,
  giftCodeGroups,
  giftCodeWhat,
  giftPaper,
  giftWrapText,
  groupAccent,
  loadCollections,
  loadMilestones,
  loadTrendingTags,
  localInputValue,
  msWarm,
  reasonLine,
  setTypingStyleMine,
  shopKindWord,
  shrinkToDataUrl,
  siAccent,
  siRoute,
  siWord,
  useDeal,
  useDrops,
  useMoneyToast,
  useShopOwners,
  useSpendLimit,
  useTrendingTags,
} from './shared.jsx';

const GIFT_CODE_ABC = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
function GiftCodeArt({ kind, k, me, width }) {
  if (CX_KINDS.includes(kind)) return <CxArt kind={kind} k={k} me={me} size={Math.round(width * 0.62)} dark />;
  if (kind === 'set' && isDecorKey(k)) return <DecorHero frameKey={k} plateKey={k} width={width} photo={me && me.avatar} name={me && me.name} username={me && me.username} gapColor="#15151A" />;
  if (kind === 'nameplate' && isDecorKey(k)) return <DecorPlateOnly setKey={k} width={width} name={me && me.name} username={me && me.username} />;
  if ((kind === 'frame' || kind === 'effect') && isDecorKey(k)) return <TradeArt kind={kind} k={k} size={Math.round(width * 0.62)} photo={me && me.avatar} name={me && me.name} />;
  if (kind === 'charm' || kind === 'bubble') return <TradeArt kind={kind} k={k} size={Math.round(width * 0.5)} photo={me && me.avatar} name={me && me.name} />;
  return null;
}
export function RedeemCodeSheet({ uid, me, onClose, onOpenCollection }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [won, setWon] = useState(null);
  const raw = giftCodeClean(text);
  const bad = [...raw].some((ch) => !GIFT_CODE_ABC.includes(ch));
  const full = raw.length === 12;
  const redeem = async () => {
    if (busy || !full) return;
    if (bad) { setErr('Codes never use 0, O, 1, I or L. Check the code and try again.'); return; }
    setBusy(true);
    setErr('');
    hapticTap();
    let res;
    try { res = await supabase.rpc('zchat_code_redeem', { p_code: raw }); } catch (e) { res = { error: e }; }
    setBusy(false);
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    if (res.error) { setErr(rpcFailText('Gift code', res.error, 'Gift codes switch on once the latest ZChat setup is finished.')); return; }
    if (!row || !row.ok) { setErr((row && row.reason) || 'That code did not work. Try again.'); playUiSound('cancel'); return; }
    const added = Math.max(0, Number(row.coins_added) || 0);
    const gotItem = Array.isArray(row.got) && row.got.length > 0;
    if (walletMem.uid === uid && walletMem.data && walletMem.data.ready && row.coins != null) { walletKeep(uid, { ...walletMem.data, coins: Math.max(0, Math.floor(Number(row.coins) || 0)) }); walletMem.mark = Date.now(); walletShow(); }
    announceWallet();
    if (gotItem) {
      try { window.dispatchEvent(new Event('zchat-rewards-reload')); } catch {}
      if (row.kind === 'bubble') loadOwnedBubbles(uid, true);
    }
    playUiSound('win');
    setWon({ coins: added, kind: gotItem ? row.kind : null, key: gotItem ? row.key : null, had: !!row.had_item, hadKind: row.kind, hadKey: row.key });
  };
  const title = won ? `You got ${giftCodeWhat(won.coins, won.kind, won.key)}` : 'Redeem a code';
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 780, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '90%', overflowY: 'auto', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 4px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>{won ? 'Code redeemed' : 'Redeem a code'}</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          {won ? (
            <div className="zchat-pop" style={{ padding: '10px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {won.kind ? (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '14px 0', borderRadius: 20, background: '#15151A', overflow: 'hidden' }}><GiftCodeArt kind={won.kind} k={won.key} me={me} width={Math.min(260, (typeof window !== 'undefined' ? window.innerWidth : 390) - 80)} /></div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 2px' }}><CoinIcon size={56} /><span style={{ fontSize: 40, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>+{won.coins.toLocaleString('en-US')}</span></div>
              )}
              <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, marginTop: 14, letterSpacing: '-0.01em', lineHeight: 1.3, textWrap: 'balance' }}>{title}</div>
              <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6, lineHeight: 1.5, textWrap: 'balance' }}>
                {won.kind ? `${won.coins > 0 ? `The coins are in your wallet and the ${CX_KINDS.includes(won.kind) ? cxWord(won.kind) : won.kind}` : `The ${CX_KINDS.includes(won.kind) ? cxWord(won.kind) : won.kind}`} is in your Collection, yours to keep.` : won.had ? `The coins are in your wallet. You already had ${giftCodeWhat(0, won.hadKind, won.hadKey)}, so you keep the one you have.` : 'The coins are in your wallet.'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 20 }}>
                {won.kind && onOpenCollection && <BigButton label="Open your Collection" onClick={onOpenCollection} />}
                <BigButton label="Done" tone={won.kind && onOpenCollection ? 'plain' : 'accent'} onClick={onClose} />
              </div>
            </div>
          ) : (
            <div style={{ padding: '6px 20px 0' }}>
              <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5 }}>Type the 12 letters and numbers from your code. Spaces and small letters are fine.</div>
              <input value={giftCodeGroups(text)} onChange={(e) => { setText(e.target.value); setErr(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); redeem(); } }}
                aria-label="Gift code" placeholder="XXXX XXXX XXXX" autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} inputMode="text" enterKeyHint="go" maxLength={16}
                style={{ ...inputStyle(theme), marginTop: 14, height: 58, fontSize: 22, fontWeight: 700, textAlign: 'center', fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace", letterSpacing: '0.04em', textTransform: 'uppercase' }} />
              {err && <div role="alert" style={{ fontSize: 13.5, fontWeight: 600, color: theme.danger, padding: '10px 2px 0', lineHeight: 1.45 }}>{err}</div>}
              <div style={{ marginTop: 16 }}><BigButton label={busy ? 'Checking' : 'Redeem'} disabled={busy || !full} onClick={redeem} /></div>
              <div style={{ fontSize: 12.5, color: theme.muted, padding: '10px 2px 0', lineHeight: 1.5 }}>Each code works once for you. After 10 wrong tries in an hour, you have to wait a little.</div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
const WRAP_PRICE = 50;
const myWrapsMem = { uid: null, set: null, job: null };
function loadMyWraps(uid, force) {
  if (!uid) return Promise.resolve(new Set());
  if (!force && myWrapsMem.uid === uid && myWrapsMem.set) return Promise.resolve(myWrapsMem.set);
  if (myWrapsMem.job && myWrapsMem.uid === uid) return myWrapsMem.job;
  myWrapsMem.uid = uid;
  myWrapsMem.job = supabase.from('user_rewards').select('reward_key').eq('user_id', uid).eq('kind', 'wrap').then(({ data }) => {
    const s = new Set([...(myWrapsMem.set || []), ...(data || []).map((r) => r.reward_key)]);
    myWrapsMem.set = s;
    myWrapsMem.job = null;
    return s;
  }, () => { myWrapsMem.job = null; return myWrapsMem.set || new Set(); });
  return myWrapsMem.job;
}
export function WrapPickerSheet({ uid, value, onPick, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const w = useWallet(uid);
  const [cur, setCur] = useState(value);
  const [owned, setOwned] = useState(() => (myWrapsMem.uid === uid && myWrapsMem.set) || new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { let alive = true; loadMyWraps(uid).then((s) => { if (alive) setOwned(new Set(s)); }); return () => { alive = false; }; }, [uid]);
  const paper = giftPaper(cur.p);
  const needBuy = !!(paper && paper.shop && !owned.has(paper.k));
  const coins = w ? w.coins : 0;
  const buy = async () => {
    if (busy || !needBuy) return;
    if (coins < WRAP_PRICE) { setErr(`You need ${moreCoinsText(WRAP_PRICE - coins)} for this wrap.`); return; }
    if (!(await spendGate(`Get the ${paper.label} gift wrap for ${WRAP_PRICE} coins`, { coins: WRAP_PRICE }))) return;
    setBusy(true);
    setErr('');
    hapticTap();
    const key = paper.k;
    setOwned((s) => new Set([...s, key]));
    const r = await moneyRun(uid, { coins: WRAP_PRICE, run: async () => {
      const { data, error } = await supabase.rpc('zchat_buy_wrap', { p_key: key });
      const row = Array.isArray(data) ? data[0] : data;
      if (error) return { error: rpcFailText('Wrap buy', error, 'Gift wraps switch on once the latest ZChat setup is finished.') };
      if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
      return { ok: true, coins: row.coins };
    } });
    setBusy(false);
    if (r.error) { setOwned((s) => { const n = new Set(s); n.delete(key); return n; }); setErr(r.error); return; }
    myWrapsMem.uid = uid;
    myWrapsMem.set = new Set([...(myWrapsMem.set || []), key]);
    playUiSound('like');
  };
  const done = () => {
    if (needBuy) { buy(); return; }
    writeJsonLs('zchat-gift-wrap', cur);
    onPick(cur);
  };
  const tile = (p) => ({
    k: p.k, label: p.label, aria: `${p.label} paper${p.shop && !owned.has(p.k) ? `, ${WRAP_PRICE} coins` : ''}`,
    sub: p.shop ? (owned.has(p.k) ? 'Yours' : `${WRAP_PRICE} coins`) : undefined,
    bg: theme.dark ? '#1F1E25' : '#F1F0F6',
    art: <WrapBoxArt paper={p.k} ribbon={cur.r} size={58} still />,
  });
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 775, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '92%', background: theme.panelBg, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ flexShrink: 0, touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 2px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>Gift wrap</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0 6px' }}>
              <div key={`${cur.p}${cur.r}`} className="zchat-pop"><WrapBoxArt paper={cur.p} ribbon={cur.r} size={128} still /></div>
              <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2 }}>{giftWrapText(cur)}</div>
            </div>
            <KitSection title="Paper" style={{ marginTop: 6 }}>
              <PickTiles label="Paper" size={62} wrap value={cur.p} onChange={(k) => { setErr(''); setCur((c) => ({ ...c, p: k })); }} options={GIFT_PAPERS.map(tile)} />
            </KitSection>
            <KitSection title="Ribbon">
              <div role="radiogroup" aria-label="Ribbon" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 2px' }}>
                {GIFT_RIBBONS.map(([k, l, a, b]) => {
                  const on = cur.r === k;
                  return (
                    <div key={k} role="radio" aria-checked={on} aria-label={`${l} ribbon`} onClick={() => { hapticTap(); setCur((c) => ({ ...c, r: k })); }} className="zchat-press"
                      style={{ width: 40, height: 40, borderRadius: 20, cursor: 'pointer', background: `linear-gradient(135deg, ${a}, ${b})`, boxShadow: on ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : `inset 0 0 0 1px ${theme.dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,19,0.12)'}`, transition: 'box-shadow 160ms ease' }} />
                  );
                })}
              </div>
            </KitSection>
            {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
            <div style={{ fontSize: 12.5, color: theme.muted, padding: '12px 2px 4px', lineHeight: 1.5 }}>They see it when the gift arrives, and tear it open themselves. Shop wraps are yours to keep.</div>
          </div>
          <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
            <BigButton label={busy ? 'Getting it' : needBuy ? `Get ${paper.label} for ${WRAP_PRICE} coins` : 'Use this wrap'} disabled={busy} onClick={done} />
          </div>
        </div>
      </div>
    </Portal>
  );
}
export function ChipStartSheet({ uid, to, gift, people, wrap, onClose, onDone }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const w = useWallet(uid);
  const coins = w ? w.coins : 0;
  const [mine, setMine] = useState(() => Math.min(Math.round(gift.price / Math.max(2, people.length + 1)), coins));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const first = String(to.name || '').split(' ')[0] || 'them';
  const names = people.map((p) => String(p.name || p.username || '').split(' ')[0]).filter(Boolean);
  const cap = Math.max(0, Math.min(gift.price - 1, coins));
  const start = async () => {
    if (busy || !people.length) return;
    if (mine > 0 && !(await spendGate(`Chip in ${coinsText(mine)} for ${first}'s gift`, { coins: mine, send: true }))) return;
    setBusy(true);
    setErr('');
    hapticTap();
    const r = await moneyRun(uid, { coins: mine, run: async () => {
      const x = await giftRpc('zchat_chip_start', { p_to: to.id, p_kind: gift.kind, p_key: gift.key, p_people: people.map((p) => p.id), p_coins: mine, p_note: note.trim().slice(0, 80) || null, p_paper: wrap ? wrap.p : null, p_ribbon: wrap ? wrap.r : null }, 'Group gift');
      return x.error ? { error: x.error } : { ok: true, coins: x.row.balance, row: x.row };
    } });
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    playUiSound('like');
    onDone(r.row, people);
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 777, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '90%', overflowY: 'auto', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 4px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>Group gift for {first}</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div style={{ padding: '6px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, background: theme.soft }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: theme.dark ? '#15151A' : '#ECEAF4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}><GiftItemArt kind={gift.kind} k={gift.key} me={to} size={56} dark={theme.dark} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>{gift.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: theme.muted, marginTop: 2 }}><CoinIcon size={13} />{formatCount(gift.price)} coins in all</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: theme.ink2, lineHeight: 1.5, margin: '14px 2px 4px' }}>{`${listText(names.slice(0, 3))}${names.length > 3 ? ` and ${names.length - 3} more` : ''} get${names.length === 1 ? 's' : ''} a message to add coins. When it is fully paid, ${first} gets it as one gift from all of you. If it is not done in 7 days, everyone gets their coins back.`}</div>
            <KitSection title="Your part now" right={`${formatCount(mine)} of ${formatCount(gift.price)}`}>
              <KitSlider value={Math.min(mine, cap)} min={0} max={Math.max(1, cap)} step={1} label="Your coins" onChange={(n) => { setMine(n); setErr(''); }} />
              <div style={{ fontSize: 12.5, color: mine > coins ? theme.danger : theme.muted, padding: '8px 2px 0' }}>{mine > 0 ? 'Your coins go in now.' : 'You can also add your part later from the chat.'} You have {formatCount(coins)} {coins === 1 ? 'coin' : 'coins'}.</div>
            </KitSection>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 80))} placeholder={`A note for ${first}`} aria-label="Gift note" style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 14 }} />
            {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
            <div style={{ marginTop: 14 }}><BigButton label={busy ? 'Starting' : `Start with ${people.length === 1 ? '1 friend' : `${people.length} friends`}`} disabled={busy || !people.length} onClick={start} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
export function CxGiftPicker({ to, first, chosen, owns, onPick, maxPrice }) {
  const { theme } = useTheme();
  const fits = (kind, k) => !maxPrice || (shopPrice(kind, k) || 0) <= maxPrice;
  const siBox = useRef(null);
  useEffect(() => { if (!chosen || !siRoute(chosen)) return; const el = siBox.current && siBox.current.querySelector('[aria-checked="true"]'); if (el) { try { el.scrollIntoView({ block: 'center' }); } catch {} } }, []);
  const tile = (on) => ({ borderRadius: 16, padding: '10px 6px 9px', cursor: 'pointer', background: theme.dark ? 'rgba(255,255,255,0.045)' : '#F5F5F7', boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 });
  const priceTag = (kind, k, low) => <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: theme.ink, marginTop: low ? 'auto' : 0 }}><CoinIcon size={12} />{formatCount(shopPrice(kind, k) || 0)}</span>;
  const nameOf = (kind, k) => <span style={{ alignSelf: 'stretch', fontSize: 12, lineHeight: 1.25, fontWeight: 600, color: theme.ink, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cxSpec(kind, k).label}</span>;
  const head = (t) => <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink, margin: '10px 2px 8px' }}>{t}</div>;
  const ns = NS_KEYS.filter((k) => !owns('namestyle', k) && fits('namestyle', k));
  const th = THEME_KEYS.filter((k) => !owns('theme', k) && fits('theme', k));
  const rx = SUPER_KEYS.filter((k) => cxKnown('reaction', k) && !owns('reaction', k) && fits('reaction', k));
  const wl = LIVE_WALL_PAID.filter((k) => !owns('wallpaper', k) && fits('wallpaper', k));
  const isOn = (kind, k) => !!chosen && chosen.kind === kind && chosen.key === k;
  const siLeft = [...(owns('namestyle', 'own') ? [] : [['namestyle', 'own']]), ...SI_KINDS.filter((kind) => kind !== 'gamekit').flatMap((kind) => (kind === 'stickerpack' ? SI_STICKER_PACKS : kind === 'soundpack' ? SI_SOUND_PACKS : SI_TYPING).map((x) => [kind, x.key])).filter(([kind, k]) => !owns(kind, k))].filter(([kind, k]) => fits(kind, k));
  if (!ns.length && !th.length && !rx.length && !wl.length && !siLeft.length) return <div style={{ textAlign: 'center', fontSize: 14, color: theme.muted, padding: '28px 12px' }}>{first} already has every style.</div>;
  return (
    <div ref={siBox} role="radiogroup" aria-label="Pick a style" style={{ padding: '0 0 6px' }}>
      {ns.length > 0 && head('Name styles')}
      {ns.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {ns.map((k) => (
            <div key={k} role="radio" aria-checked={isOn('namestyle', k)} aria-label={`${cxSpec('namestyle', k).label} name style`} onClick={() => onPick('namestyle', k)} className="zchat-press" style={{ ...tile(isOn('namestyle', k)), alignItems: 'stretch', padding: '14px 12px 10px' }}>
              <NameStyleArt k={k} name={to.name} size={17} width={130} dark={theme.dark} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}><span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cxSpec('namestyle', k).label}</span>{priceTag('namestyle', k)}</div>
            </div>
          ))}
        </div>
      )}
      {th.length > 0 && head('Profile themes')}
      {th.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {th.map((k) => (
            <div key={k} role="radio" aria-checked={isOn('theme', k)} aria-label={`${cxSpec('theme', k).label} theme`} onClick={() => onPick('theme', k)} className="zchat-press" style={tile(isOn('theme', k))}>
              <ThemeArt k={k} me={to} w={78} h={92} dark={theme.dark} live={false} radius={10} />
              {nameOf('theme', k)}
              {priceTag('theme', k, true)}
            </div>
          ))}
        </div>
      )}
      {rx.length > 0 && head('Super reactions')}
      {rx.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
          {rx.map((k) => (
            <div key={k} role="radio" aria-checked={isOn('reaction', k)} aria-label={`${cxSpec('reaction', k).label} super reaction`} onClick={() => onPick('reaction', k)} className="zchat-press" style={tile(isOn('reaction', k))}>
              <SuperFace k={k} size={42} />
              {nameOf('reaction', k)}
              {priceTag('reaction', k, true)}
            </div>
          ))}
        </div>
      )}
      {wl.length > 0 && head('Live wallpapers')}
      {wl.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {wl.map((k) => (
            <div key={k} role="radio" aria-checked={isOn('wallpaper', k)} aria-label={`${LIVE_WALL_BY[k].label} live wallpaper`} onClick={() => onPick('wallpaper', k)} className="zchat-press" style={tile(isOn('wallpaper', k))}>
              <div style={{ position: 'relative', width: 66, height: 88, borderRadius: 10, overflow: 'hidden', background: liveWallBg(LIVE_WALL_BY[k], theme.dark) }}><LiveWallCanvas k={k} dark={theme.dark} small fps={15} /></div>
              <span style={{ alignSelf: 'stretch', fontSize: 12, lineHeight: 1.25, fontWeight: 600, color: theme.ink, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LIVE_WALL_BY[k].label}</span>
              {priceTag('wallpaper', k, true)}
            </div>
          ))}
        </div>
      )}
      {siLeft.length > 0 && head('Packs and typing styles')}
      {siLeft.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
          {siLeft.map(([kind, k]) => (
            <div key={`${kind}:${k}`} role="radio" aria-checked={isOn(kind, k)} aria-label={`${shopItemName(kind, k)} ${shopKindWord(kind)}`} onClick={() => onPick(kind, k)} className="zchat-press" style={tile(isOn(kind, k))}>
              {kind === 'namestyle' ? <div style={{ height: 66, display: 'flex', alignItems: 'center' }}><NameStyleArt k="own" name={to.name} size={17} width={80} dark={theme.dark} /></div> : <SiItemArt kind={kind} k={k} me={to} size={66} dark={theme.dark} />}
              <span style={{ alignSelf: 'stretch', fontSize: 12, lineHeight: 1.25, fontWeight: 600, color: theme.ink, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kind === 'namestyle' ? 'Custom style' : shopItemName(kind, k)}</span>
              {priceTag(kind, k, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
async function makeAnswerCard(question, answer, me, accent) {
  const W = 1080; const H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, mixHex(accent, '#FFFFFF', 0.85));
  g.addColorStop(1, mixHex(accent, '#000000', 0.7));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const font = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const wrap = (text, size, weight, maxW) => {
    x.font = `${weight} ${size}px ${font}`;
    const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let cur = '';
    words.forEach((w) => { const t = cur ? `${cur} ${w}` : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur);
    return lines.slice(0, 9);
  };
  const qLines = wrap(question, 58, 700, 780);
  const boxH = 120 + qLines.length * 74;
  const bx = 110; const by = 520; const bw = 860;
  x.fillStyle = '#FFFFFF';
  const r = 48;
  x.beginPath(); x.moveTo(bx + r, by); x.arcTo(bx + bw, by, bx + bw, by + boxH, r); x.arcTo(bx + bw, by + boxH, bx, by + boxH, r); x.arcTo(bx, by + boxH, bx, by, r); x.arcTo(bx, by, bx + bw, by, r); x.closePath(); x.fill();
  x.fillStyle = accent; x.font = `700 36px ${font}`; x.textAlign = 'center';
  x.fillText('Someone asked', W / 2, by + 70);
  x.fillStyle = '#111113'; x.font = `700 58px ${font}`;
  qLines.forEach((l, i) => x.fillText(l, W / 2, by + 150 + i * 74));
  const aLines = wrap(answer, 64, 800, 860);
  x.fillStyle = '#FFFFFF'; x.font = `800 64px ${font}`;
  aLines.forEach((l, i) => x.fillText(l, W / 2, by + boxH + 150 + i * 84));
  x.font = `600 34px ${font}`; x.fillStyle = 'rgba(255,255,255,0.8)';
  x.fillText(`Ask ${me && me.username ? `@${me.username}` : 'me'} anything on ZChat`, W / 2, H - 220);
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
  return blob ? new File([blob], 'answer.jpg', { type: 'image/jpeg' }) : null;
}
export function QuestionsPage({ me, onClose, onShareStory, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rows, setRows] = useState(() => (me && questionsMem.get(me.id)) || null);
  const [open, setOpen] = useState(null);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [on, setOn] = useState(!(me && me.ama_on === false));
  const link = `${siteOrigin()}/?ask=${encodeURIComponent((me && me.username) || '')}`;
  useBackClose(!!open, () => setOpen(null));
  const goneRef = useRef(new Set());
  const load = async () => {
    const { data, error } = await supabase.rpc('zchat_my_questions');
    if (error || !Array.isArray(data)) { setRows((prev) => prev || []); return; }
    const list = data.filter((x) => !goneRef.current.has(x.id));
    if (me) questionsMem.set(me.id, list);
    setRows(list);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (rows && me) questionsMem.set(me.id, rows); }, [rows]);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2200); };
  const toggle = async () => {
    const next = !on;
    setOn(next);
    const { error } = await supabase.from('profiles').update({ ama_on: next }).eq('id', me.id);
    if (error) { setOn(!next); flash('That could not be saved yet. Try again later.'); return; }
    if (onSaved) onSaved({ ama_on: next });
  };
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'Ask me anything', text: 'Ask me anything on ZChat. I will not see who asked.', url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const ok = await copyTextToClipboard(link);
    flash(ok ? 'Link copied' : link);
  };
  const saveAnswer = async (toStory) => {
    if (!open || busy) return;
    const text = answer.trim();
    if (!text) return;
    setBusy(true);
    await supabase.rpc('zchat_answer_question', { p_id: open.id, p_answer: text.slice(0, 500) });
    if (toStory) {
      const file = await makeAnswerCard(open.body, text, me, theme.coral);
      setBusy(false);
      setOpen(null); setAnswer('');
      if (file && onShareStory) onShareStory(file);
      load();
      return;
    }
    setBusy(false);
    setOpen(null); setAnswer('');
    flash('Answer saved');
    load();
  };
  const remove = async (q) => {
    goneRef.current.add(q.id);
    setRows((r) => (r || []).filter((x) => x.id !== q.id));
    setOpen(null);
    const { error } = await supabase.rpc('zchat_delete_question', { p_id: q.id });
    if (error) { goneRef.current.delete(q.id); flash(friendlyError(error, 'That question could not be deleted. Try again.')); load(); }
  };
  return (
    <FullPage title="Questions" onBack={onClose} zIndex={760}>
      <div style={{ borderRadius: 18, background: theme.soft, padding: 14, marginTop: 6 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>Your ask me anything link</div>
        <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 3, lineHeight: 1.45 }}>Share it anywhere. People can ask you questions and you never see who asked.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '0 6px 0 12px', height: 44, borderRadius: 12, background: theme.panelBg }}>
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: theme.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.replace(/^https?:\/\//, '')}</div>
          <div role="button" aria-label="Copy question link" onClick={async () => { const ok = await copyTextToClipboard(link); flash(ok ? 'Link copied' : link); }} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink2 }}><Copy size={18} /></div>
        </div>
        <div style={{ marginTop: 12 }}><BigButton label="Share link" onClick={share} /></div>
      </div>
      <IgRow inset={false} label="Let people ask me questions" sub="Turn off to stop new questions" right={<IgToggle on={on} onClick={toggle} />} />
      <IgHeading>Questions</IgHeading>
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color={theme.muted} /></div> : !rows.length ? (
        <EmptyState art="nothing" title="No questions yet" text="Share your link and questions show up here." />
      ) : (
        <div role="list" aria-label="Questions">
          {rows.map((q) => (
            <div key={q.id} role="listitem" aria-label={`Question ${q.body}`} onClick={() => { setOpen(q); setAnswer(q.answer || ''); }} className="zchat-row-press" style={{ padding: '12px 4px', boxShadow: `0 0.5px 0 ${theme.hair}`, cursor: 'pointer' }}>
              <div data-zuser="" style={{ fontSize: 15, color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word' }}>{q.body}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: q.answer ? kitOnInk(theme) : theme.muted, marginTop: 4, fontWeight: q.answer ? 600 : 400 }}>{q.answer && <LineGlyph k="check" size={14} sw={3.2} />}{q.answer ? 'Answered' : shortAgo(q.created_at) === 'now' ? 'Just now' : `${shortAgo(q.created_at)} ago`}</div>
            </div>
          ))}
        </div>
      )}
      {open && (
        <Portal>
          <div onClick={() => setOpen(null)} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 800, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
            <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '14px 18px calc(14px + env(safe-area-inset-bottom))' }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
              <div style={{ fontSize: 13, color: theme.muted, fontWeight: 600 }}>Someone asked</div>
              <div data-zuser="" style={{ fontSize: 17, fontWeight: 700, color: theme.ink, marginTop: 4, lineHeight: 1.4, wordBreak: 'break-word' }}>{open.body}</div>
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value.slice(0, 500))} placeholder="Write your answer" aria-label="Your answer" rows={3}
                style={{ ...inputStyle(theme), width: '100%', boxSizing: 'border-box', resize: 'none', fontSize: 16, lineHeight: 1.4, marginTop: 12, minHeight: 90 }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1 }}><BigButton label={busy ? 'Working' : 'Share to story'} disabled={!answer.trim() || busy} onClick={() => saveAnswer(true)} /></div>
                <div style={{ width: 110 }}><BigButton label="Save" tone="plain" disabled={!answer.trim() || busy} onClick={() => saveAnswer(false)} /></div>
              </div>
              <div role="button" aria-label="Delete question" onClick={() => remove(open)} style={{ textAlign: 'center', padding: '14px 0 2px', fontSize: 14.5, fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>Delete question</div>
            </div>
          </div>
        </Portal>
      )}
      {note && <div className="zchat-pop" role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(30px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 900, padding: '9px 16px', borderRadius: 18, background: theme.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none' }}>{note}</div>}
    </FullPage>
  );
}

export function AskPage({ username, userId, onClose, onOwnLink }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [target, setTarget] = useState(undefined);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    supabase.from('profiles').select('id, name, username, avatar, ama_on, is_deleted').ilike('username', String(username || '').replace(/[%_]/g, '')).maybeSingle().then(({ data }) => { if (alive) setTarget(data && !data.is_deleted ? data : null); }, () => { if (alive) setTarget(null); });
    return () => { alive = false; };
  }, [username]);
  const send = async () => {
    const body = text.trim();
    if (!body || busy || !target) return;
    setBusy(true); setErr('');
    const { data, error } = await supabase.rpc('zchat_ask', { p_to: target.id, p_body: body.slice(0, 300) });
    setBusy(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || !row.ok) { setErr((row && row.reason) || 'That question could not be sent. Try again later.'); return; }
    hapticTap();
    setSent(true);
    setText('');
  };
  const first = target ? String(target.name || '').split(' ')[0] : '';
  return (
    <FullPage title="Ask anything" onBack={onClose} zIndex={760}>
      {target === undefined ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div> : !target ? (
        <EmptyState art="nothing" title="Link not working" text="This person may have changed their username." />
      ) : target.id === userId ? (
        <EmptyState art="nothing" title="This is your link" text="Share it so others can ask you questions." action={<BigButton label="See your questions" onClick={onOwnLink} />} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 4px 0' }}>
          <Avatar emoji={target.avatar} name={target.name} size={84} />
          <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, marginTop: 12 }}>Ask {first} anything</div>
          <div style={{ fontSize: 14, color: theme.muted, marginTop: 4, textAlign: 'center' }}>{first} will not see who asked.</div>
          {sent ? (
            <div style={{ width: '100%', marginTop: 26, textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink }}>Sent</div>
              <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>Ask another one or get your own link.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <div style={{ flex: 1 }}><BigButton label="Ask another" tone="plain" onClick={() => setSent(false)} /></div>
                <div style={{ flex: 1 }}><BigButton label="Get your link" onClick={onOwnLink} /></div>
              </div>
            </div>
          ) : target.ama_on === false ? (
            <div style={{ fontSize: 14.5, color: theme.muted, marginTop: 24 }}>{first} is not taking questions right now.</div>
          ) : (
            <div style={{ width: '100%', marginTop: 22 }}>
              <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder="Type your question" aria-label="Your question" rows={4}
                style={{ ...inputStyle(theme), width: '100%', boxSizing: 'border-box', resize: 'none', fontSize: 16.5, lineHeight: 1.4, minHeight: 120 }} />
              <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'right', padding: '6px 2px 0' }}>{text.length}/300</div>
              {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '6px 2px 0' }}>{err}</div>}
              <div style={{ marginTop: 10 }}><BigButton label={busy ? 'Sending' : 'Send anonymously'} disabled={!text.trim() || busy} onClick={send} /></div>
            </div>
          )}
        </div>
      )}
    </FullPage>
  );
}
export function SellPackSheet({ pack, uid, onClose }) {
  const { theme } = useTheme();
  const mine = useCr('mine', uid, 15000);
  const sale = (Array.isArray(mine) ? mine : []).find((p) => p.pack_id === pack.id) || null;
  const [price, setPrice] = useState(sale ? Number(sale.price) : 100);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (sale) setPrice(Number(sale.price)); }, [sale && sale.id]);
  const n = (pack.stickers || []).length;
  const status = !sale ? null : sale.status === 'live' ? `On sale, ${countWord(Number(sale.sales) || 0, 'sale', 'sales')} so far` : sale.status === 'review' ? 'Waiting for a quick check by the ZChat team' : sale.status === 'off' ? 'Off sale. People who bought it keep it.' : `Not approved: ${sale.note || 'it looks like art you did not make'}`;
  const submit = async () => {
    if (busy) return;
    if (n < 4) { appSnack('Add at least 4 stickers to the pack first.'); return; }
    setBusy(true);
    const r = await crCall('zchat_cr_pack_sell', { p_pack: pack.id, p_price: price });
    setBusy(false);
    if (!r.ok) { appSnack(r.reason || 'That did not work. Try again.'); return; }
    if (r.pack) crPatch('mine', uid, (l) => [r.pack, ...(l || []).filter((x) => x.id !== r.pack.id)]);
    if (!crS.mine.m.has(uid) && r.pack) crPut('mine', uid, [r.pack]);
    hapticTap();
    onClose();
    appSnack(r.review ? 'Sent for a quick check. It goes on sale once it is approved.' : r.pack && r.pack.status === 'live' ? 'Saved. Your pack is on sale.' : 'Saved');
  };
  const stop = async () => {
    if (!sale || busy) return;
    setBusy(true);
    const r = await crCall('zchat_cr_pack_stop', { p_id: sale.id });
    setBusy(false);
    if (!r.ok) { appSnack(r.reason || 'That did not work. Try again.'); return; }
    crPatch('mine', uid, (l) => (l || []).map((x) => (x.id === sale.id ? r.pack : x)));
    onClose();
    appSnack('Taken off sale. People who bought it keep it.');
  };
  const pics = (pack.stickers || []).slice(0, 4);
  const live = sale && (sale.status === 'live' || sale.status === 'review');
  return (
    <CrSheet title="Sell this pack" sub={`${pack.name} · ${countWord(n, 'sticker', 'stickers')}`} onClose={onClose} z={790}
      avatar={<div style={{ width: 40, height: 40, borderRadius: 12, background: theme.rowBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>{pics[0] ? <img src={pics[0]} alt="" draggable={false} style={{ width: '80%', height: '80%', objectFit: 'contain' }} /> : <PackIcon size={20} />}</div>}
      footer={<div style={{ display: 'flex', gap: 8 }}>{live && <BigButton tone="plain" label="Stop selling" onClick={stop} disabled={busy} style={{ width: 140, flexShrink: 0 }} />}<BigButton label={busy ? 'Saving' : sale && sale.status !== 'rejected' ? 'Save' : 'Send for review'} onClick={submit} disabled={busy} /></div>}>
      {status && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '10px 12px', borderRadius: 12, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, fontSize: 13.5, color: sale.status === 'rejected' ? theme.danger : theme.ink, fontWeight: 600 }}>{sale.status === 'live' ? <Check size={16} color="#22C55E" /> : <Clock size={16} color={theme.muted} />}{status}</div>}
      <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '12px 2px 12px' }}>{`People buy it from your profile and the sticker picker, and keep it forever. ZChat keeps ${CR_SHARE} percent. Only stickers you made yourself can be sold, and the ZChat team checks each pack first.`}</div>
      <CrPriceList list={CR_PRICES.pack} value={price} onChange={setPrice} />
    </CrSheet>
  );
}
function LiveWallShelf({ rewards, onOpen }) {
  const own = new Set((rewards || []).filter((r) => r.kind === 'wallpaper' && rewardActive(r)).map((r) => r.reward_key));
  const mineN = LIVE_WALLS.filter((w) => w.free || own.has(w.k)).length;
  return (
    <CollSection title="Live wallpapers" sub={`${mineN} of ${LIVE_WALLS.length} yours. Pick one in any chat from Theme.`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        {LIVE_WALLS.map((w) => {
          const mine = w.free || own.has(w.k);
          return (
            <div key={w.k} role="button" aria-label={mine ? `${w.label}, yours` : `${w.label}, ${LIVE_WALL_PRICE} coins`} onClick={() => { if (!w.free && onOpen) { playUiSound('tap'); onOpen(w.k); } else { hapticTap(); appSnack(`${w.label} is free. Open a chat, then Theme, then Live.`); } }} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', minWidth: 0 }}>
              <div style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', background: liveWallBg(w, true), boxShadow: `inset 0 0 0 1px ${CL.line}`, opacity: mine ? 1 : 0.72 }}>
                <LiveWallCanvas k={w.k} dark small fps={15} />
                {!mine && <LiveWallLock price={LIVE_WALL_PRICE} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.label}</span>
                {mine && <span style={{ fontSize: 11.5, fontWeight: 600, color: w.free ? CL.ink3 : CL.own, flexShrink: 0 }}>{w.free ? 'Free' : 'Yours'}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </CollSection>
  );
}
const complimentsMem = { list: null };
export function ComplimentsPage({ myId, onClose, onOpen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(complimentsMem.list);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_compliments_mine').then(({ data, error }) => { if (!alive) return; if (error || !data) { setFail(loadFailCode(error)); return; } setFail(null); complimentsMem.list = data.items || []; setList(complimentsMem.list); }, () => { if (alive) setFail(''); });
    return () => { alive = false; };
  }, [tick]);
  const flip = async (c) => {
    const next = !c.shown;
    const set = (v) => setList((l) => { const n = (l || []).map((x) => (x.id === c.id ? { ...x, shown: v } : x)); complimentsMem.list = n; return n; });
    set(next);
    hapticTap();
    const { data, error } = await supabase.rpc('zchat_compliment_set', { p_id: c.id, p_shown: next });
    if (error || (data && data.ok === false)) { set(!next); appSnack(friendlyError(error, 'That could not be changed. Try again.')); return; }
    pfExtrasReload(myId);
  };
  return (
    <FullPage title="Compliments" subtitle="Only you see this list" onBack={onClose} zIndex={130}>
      {list === null ? (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>)
        : !list.length ? <EmptyState art="love" title="No compliments yet" text="When friends send you one, it lands here first. You choose which ones show on your profile." />
        : (
          <div role="list" aria-label="Your compliments" style={{ paddingTop: 6 }}>
            {list.map((c, i) => {
              const card = COMPLIMENT_BY[c.kind] || COMPLIMENT_BY.kind;
              return (
                <div key={c.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', borderBottom: i < list.length - 1 ? `1px solid ${theme.hair}` : 'none' }}>
                  <div role="button" aria-label={`Open ${card.t}`} onClick={() => onOpen({ id: c.id, k: c.kind, note: c.note, shown: c.shown, from: { id: c.from_id, name: c.name, avatar: c.avatar } })} className="zchat-press" style={{ cursor: 'pointer' }}><ComplimentFace k={c.kind} w={52} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>{card.t}</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`From ${c.name || 'someone'}, ${shortAgo(c.created_at)}`}</div>
                    {c.note && <div data-zuser="" style={{ fontSize: 13.5, color: theme.ink2, marginTop: 3, lineHeight: 1.35, wordBreak: 'break-word' }}>{c.note}</div>}
                  </div>
                  <div role="switch" aria-checked={!!c.shown} aria-label={`Show ${card.t} on my profile`} onClick={() => flip(c)} style={{ cursor: 'pointer', flexShrink: 0 }}><IgToggle on={!!c.shown} /></div>
                </div>
              );
            })}
          </div>
        )}
    </FullPage>
  );
}

const bdayCardMem = new Map();
function bdayOpenText(iso) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '';
  return fmtDate(new Date(t), { weekday: 'long', day: 'numeric', month: 'long' });
}
export function BdayCardStartPage({ person, cardId, onClose, onStarted }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(null);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const [picked, setPicked] = useState([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const first = pfFirst(person && person.name);
  const info = person ? bdayForMem.get(person.id) : null;
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_bday_candidates', { p_user: person.id }).then(({ data, error }) => { if (!alive) return; if (error ? !profileFnMissing(error) : !Array.isArray(data)) { setFail(loadFailCode(error)); return; } setList(error ? [] : data); }, () => { if (alive) setFail(''); });
    return () => { alive = false; };
  }, [person && person.id, tick]);
  const term = q.trim().toLowerCase();
  const shown = (list || []).filter((p) => !term || `${p.name || ''} ${p.username || ''}`.toLowerCase().includes(term));
  const go = async () => {
    if (busy) return;
    setBusy(true);
    hapticTap();
    const { data, error } = cardId
      ? await supabase.rpc('zchat_bday_card_invite', { p_card: cardId, p_invite: picked })
      : await supabase.rpc('zchat_bday_card_start', { p_user: person.id, p_invite: picked });
    setBusy(false);
    if (error) { appSnack(profileFnMissing(error) ? 'Birthday cards switch on once the latest ZChat setup is finished.' : friendlyError(error, 'That did not work. Try again.')); return; }
    try { window.dispatchEvent(new CustomEvent('zchat-bday-card', { detail: person.id })); } catch {}
    if (cardId) { appSnack(data && data.invited ? `Invited ${data.invited} ${data.invited === 1 ? 'person' : 'people'}` : 'Nobody new to invite'); bdayCardMem.delete(cardId); onStarted(cardId); return; }
    if (data && data.ok) { onStarted(data.id); return; }
    if (data && data.why === 'exists' && data.id) { onStarted(data.id); return; }
    appSnack(data && data.why === 'taken' ? `Someone already started a card for ${first} this year.` : data && data.why === 'early' ? `You can start a card in the month before ${first}'s birthday.` : 'That did not work. Try again.');
  };
  return (
    <FullPage title={cardId ? 'Invite more people' : `A card for ${first}`} subtitle={info && info.opens_at ? `Opens ${bdayOpenText(info.opens_at)} at midnight, their time` : 'Opens at midnight on their birthday'} onBack={onClose} zIndex={130}
      footer={<BigButton label={busy ? (cardId ? 'Inviting' : 'Starting') : cardId ? (picked.length ? `Invite ${picked.length}` : 'Invite') : picked.length ? `Start and invite ${picked.length}` : 'Start the card'} disabled={busy || (cardId && !picked.length)} onClick={go} />}>
      {!cardId && <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '12px 2px 2px' }}>{`Everyone you invite can sign it with a note, a sticker or a photo. ${first} only sees it when their birthday starts.`}</div>}
      {(list || []).length > 8 && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '12px 0 2px' }}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search friends" aria-label="Search friends" autoCapitalize="none" enterKeyHint="search" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        </label>
      )}
      <KitSection title="Invite friends" right={picked.length ? `${picked.length} picked` : null}>
        {list === null ? (fail !== null ? <LoadFail small code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={18} color={theme.muted} /></div>)
          : !shown.length ? <div style={{ fontSize: 13.5, color: theme.muted, padding: '6px 2px 10px', lineHeight: 1.5 }}>{term ? 'Nobody matches that name.' : `Friends you share with ${first}, and people in your groups with ${first}, show up here.`}</div>
          : <ChoiceList label="Invite friends" value={picked} onChange={(id) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}
              options={shown.map((p) => ({ k: p.id, label: p.name || p.username, sub: p.via === 'group' ? 'From your groups' : 'Friends with both of you', icon: <Avatar emoji={p.avatar} name={p.name} size={28} /> }))} />}
      </KitSection>
    </FullPage>
  );
}
const BDAY_STICKER_CATS = ['hearts', 'cute', 'cats', 'goma'];
export function BdayCardPage({ id, reveal, myId, onClose, onInvite }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [d, setD] = useState(() => bdayCardMem.get(id) || null);
  const [failed, setFailed] = useState(false);
  const [mode, setMode] = useState('note');
  const [text, setText] = useState('');
  const [sticker, setSticker] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [crop, setCrop] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef(null);
  const load = () => supabase.rpc('zchat_bday_card_get', { p_card: id }).then(({ data, error }) => {
    if (error || !data || data.ok === false) { setFailed(true); return; }
    bdayCardMem.set(id, data);
    setD(data);
  }, () => setFailed(true));
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (reveal && d && d.role === 'owner' && !d.seen) supabase.rpc('zchat_bday_card_mark', { p_card: id, p_seen: true }).then(() => {}, () => {}); }, [reveal, d && d.role]);
  const stickers = useMemo(() => STICKERS.filter((x) => BDAY_STICKER_CATS.includes(x.category) && typeof x.file === 'string' && /^\/[A-Za-z0-9][A-Za-z0-9._-]{1,90}\.(webp|gif|png)$/.test(x.file)).slice(0, 40), []);
  const mine = d && (d.signs || []).find((s) => s.user_id === myId);
  const forName = d && d.for ? d.for.name : '';
  const first = pfFirst(forName, 'them');
  const put = (next) => { const v = { ...d, ...next }; bdayCardMem.set(id, v); setD(v); };
  const sign = async () => {
    const body = mode === 'note' ? text.replace(/\s+/g, ' ').trim().slice(0, 140) : '';
    const st = mode === 'sticker' ? sticker : null;
    const ph = mode === 'photo' ? photo : null;
    if (!body && !st && !ph) return;
    if (busy) return;
    const before = d;
    const me = { user_id: myId, name: 'You', avatar: null, body: body || null, sticker: st, photo: ph, at: new Date().toISOString() };
    hapticTap();
    playUiSound('send');
    put({ signs: [...(d.signs || []).filter((s) => s.user_id !== myId), me] });
    setEditing(false);
    setText('');
    setBusy(true);
    const { data, error } = await supabase.rpc('zchat_bday_card_sign', { p_card: id, p_body: body || null, p_sticker: st, p_photo: ph });
    setBusy(false);
    if (error || (data && data.ok === false)) {
      bdayCardMem.set(id, before);
      setD(before);
      appSnack(data && data.why === 'late' ? 'This card is closed now.' : data && data.why === 'photo' ? 'That photo could not be used. Try another one.' : friendlyError(error, 'Your message could not be added. Try again.'));
      return;
    }
    load();
  };
  const unsign = async () => {
    const before = d;
    hapticTap();
    put({ signs: (d.signs || []).filter((s) => s.user_id !== myId) });
    const { error } = await supabase.rpc('zchat_bday_card_unsign', { p_card: id });
    if (error) { bdayCardMem.set(id, before); setD(before); appSnack(friendlyError(error, 'That could not be removed. Try again.')); }
  };
  const toggleShown = async () => {
    const next = !d.shown;
    hapticTap();
    put({ shown: next });
    const { data, error } = await supabase.rpc('zchat_bday_card_mark', { p_card: id, p_shown: next });
    if (error || (data && data.ok === false)) { put({ shown: !next }); appSnack(friendlyError(error, 'That could not be changed. Try again.')); return; }
    pfExtrasReload(myId);
  };
  const owner = d && d.role === 'owner';
  const signs = (d && d.signs) || [];
  const canWrite = d && d.can_sign && (!mine || editing);
  return (
    <FullPage title={owner ? 'Your birthday card' : 'Birthday card'} subtitle={d ? (owner ? `${signs.length} ${signs.length === 1 ? 'friend' : 'friends'} signed it` : d.open ? `For ${forName}` : `Opens ${bdayOpenText(d.opens_at)} for ${first}`) : ''} onBack={onClose} zIndex={135}>
      {!d ? (failed ? <EmptyState art="nothing" title="This card is not here" text="It may be private, or it has not opened yet." /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>) : (
        <>
          <div className={reveal && !reducedMotion() ? 'zchat-pop' : undefined} style={{ marginTop: 12, borderRadius: 24, padding: '26px 18px 22px', textAlign: 'center', background: theme.dark ? `${BIRTHDAY_PINK}2B` : `${BIRTHDAY_PINK}1A`, boxShadow: `inset 0 0 0 1px ${BIRTHDAY_PINK}33` }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}><LineGlyph k="cake" size={52} color={BIRTHDAY_PINK} /></div>
            <div style={{ fontSize: 23, fontWeight: 800, color: theme.ink, marginTop: 12, letterSpacing: '-0.02em' }}>{owner ? `Happy birthday, ${first}!` : `Happy birthday, ${first}`}</div>
            <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4 }}>{owner ? `From ${signs.length} ${signs.length === 1 ? 'friend' : 'friends'} who love you` : d.open ? `${d.year}` : `It opens for ${first} at midnight on their birthday. They cannot see it before then.`}</div>
          </div>
          {owner && (
            <div role="button" aria-label="Show on my profile" onClick={toggleShown} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 54, marginTop: 8, cursor: 'pointer', borderBottom: `1px solid ${theme.hair}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>Show on my profile</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>People who can see your profile can open it</div>
              </div>
              <IgToggle on={!!d.shown} />
            </div>
          )}
          <KitSection title={signs.length ? 'Signed by' : 'Nobody has signed yet'} right={d.role === 'member' && d.people ? `${signs.length} of ${d.people.length}` : null}>
            <div role="list" aria-label="Signatures">
              {signs.map((s, i) => (
                <div key={s.user_id} role="listitem" className={reveal ? 'zchat-fade' : undefined} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: i < signs.length - 1 ? `1px solid ${theme.hair}` : 'none', animationDelay: reveal ? `${Math.min(i, 8) * 60}ms` : undefined }}>
                  <Avatar emoji={s.avatar} name={s.user_id === myId ? 'You' : s.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>{s.user_id === myId ? 'You' : s.name}</div>
                    {s.body && <div data-zuser="" style={{ fontSize: 14.5, color: theme.ink, marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }}>{s.body}</div>}
                    {s.sticker && <img src={s.sticker} alt="Sticker" style={{ width: 96, height: 96, objectFit: 'contain', marginTop: 4, display: 'block' }} />}
                    {s.photo && <img src={s.photo} alt="Photo" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 14, marginTop: 6, display: 'block' }} />}
                  </div>
                  {s.user_id === myId && d.can_sign && !editing && (
                    <div style={{ display: 'flex', gap: 12, flexShrink: 0, paddingTop: 2 }}>
                      <div role="button" aria-label="Change your message" onClick={() => { setEditing(true); setText(s.body || ''); setMode(s.photo ? 'photo' : s.sticker ? 'sticker' : 'note'); setSticker(s.sticker || null); setPhoto(s.photo || null); }} style={{ fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Change</div>
                      <div role="button" aria-label="Remove your message" onClick={unsign} style={{ fontSize: 13.5, fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>Remove</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </KitSection>
          {canWrite && (
            <KitSection title={mine ? 'Change your message' : 'Sign the card'}>
              <SegmentedControl value={mode} onChange={(v) => { hapticTap(); setMode(v); }} options={[['note', 'Note'], ['sticker', 'Sticker'], ['photo', 'Photo']]} />
              {mode === 'note' && (
                <>
                  <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 140))} placeholder={`Write something for ${first}`} aria-label="Your message" rows={3} style={{ ...inputStyle(theme), height: 88, resize: 'none', fontFamily: FONT, marginTop: 12 }} />
                  <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', marginTop: 4 }}>{text.length}/140</div>
                </>
              )}
              {mode === 'sticker' && (
                <div role="radiogroup" aria-label="Stickers" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 8, marginTop: 12, maxHeight: 220, overflowY: 'auto' }}>
                  {stickers.map((x) => (
                    <div key={x.file} role="radio" aria-checked={sticker === x.file} aria-label="Sticker" onClick={() => { hapticTap(); setSticker(x.file); }} className="zchat-press" style={{ aspectRatio: '1 / 1', borderRadius: 14, background: sticker === x.file ? theme.soft2 : theme.rowBg, boxShadow: sticker === x.file ? `0 0 0 2px ${theme.coral}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <img src={x.file} alt="" loading="lazy" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              )}
              {mode === 'photo' && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  {photo ? <img src={photo} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 14 }} /> : null}
                  <div role="button" aria-label={photo ? 'Pick another photo' : 'Add a photo'} onClick={() => fileRef.current && fileRef.current.click()} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: theme.rowBg, color: theme.ink, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{busy ? <Spinner size={15} color={theme.muted} /> : <ImageIcon size={18} />}{photo ? 'Pick another' : 'Add a photo'}</div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) setCrop(f); }} />
                </div>
              )}
              <div style={{ marginTop: 14 }}><BigButton label={mine ? 'Save' : 'Sign'} disabled={busy || (mode === 'note' ? !text.trim() : mode === 'sticker' ? !sticker : !photo)} onClick={sign} /></div>
            </KitSection>
          )}
          {d.role === 'member' && d.starter && d.can_sign && onInvite && (
            <div role="button" aria-label="Invite more people" onClick={() => onInvite(d)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, marginTop: 10, cursor: 'pointer' }}>
              <UserPlus size={20} color={kitOnInk(theme)} /><span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: kitOnInk(theme) }}>Invite more people</span><ChevronRight size={18} color={theme.muted} />
            </div>
          )}
          {d.role === 'member' && d.people && d.people.some((p) => !p.signed && p.id !== myId) && (
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 12, lineHeight: 1.5 }}>{`Still to sign: ${d.people.filter((p) => !p.signed && p.id !== myId).map((p) => pfFirst(p.name, '')).filter(Boolean).slice(0, 6).join(', ')}`}</div>
          )}
        </>
      )}
      {crop && <PhotoCropEditor file={crop} isAvatar onCancel={() => setCrop(null)} onConfirm={async (blob) => {
        setCrop(null);
        setBusy(true);
        const { url, error } = await uploadMedia(new File([blob], 'card.jpg', { type: 'image/jpeg' }), myId).catch(() => ({ url: null, error: true }));
        setBusy(false);
        if (error || !url) { appSnack('That photo could not be uploaded. Try another one.'); return; }
        setPhoto(url);
      }} />}
    </FullPage>
  );
}
function superFavToggle(uid, key) {
  if (!uid || !SUPER_REACTS[key]) return null;
  superFavLoad(uid);
  const on = superFavMem.list.includes(key);
  if (!on && superFavMem.list.length >= SUPER_FAV_MAX) return 'full';
  superFavMem.list = on ? superFavMem.list.filter((k) => k !== key) : [...superFavMem.list, key];
  superFavMem.at = Date.now();
  superFavSave(uid);
  superFavPing();
  clearTimeout(superFavMem.timer);
  const snap = { k: superFavMem.list, at: superFavMem.at };
  superFavMem.timer = setTimeout(() => { supabase.auth.updateUser({ data: { zsf: snap } }).catch(() => {}); }, 1200);
  return on ? 'off' : 'on';
}
function useSuperFavs(uid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    superFavMem.subs.add(fn);
    return () => { superFavMem.subs.delete(fn); };
  }, []);
  return superFavList(uid);
}

const REACT_MAX_SECS = 120;
function rrectPath(x, l, t, w, h, r) {
  x.beginPath();
  x.moveTo(l + r, t);
  x.arcTo(l + w, t, l + w, t + h, r);
  x.arcTo(l + w, t + h, l, t + h, r);
  x.arcTo(l, t + h, l, t, r);
  x.arcTo(l, t, l + w, t, r);
  x.closePath();
}
export function ReactionRecorder({ url: rawUrl, trimStart, trimEnd, onClose, onSend }) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState('prep');
  const [err, setErr] = useState('');
  const [theirSound, setTheirSound] = useState(true);
  const [secs, setSecs] = useState(0);
  const [out, setOut] = useState(null);
  const [dims, setDims] = useState({ w: 405, h: 720 });
  const theirRef = useRef(null);
  const camRef = useRef(null);
  const canvasRef = useRef(null);
  const st = useRef({ cam: null, actx: null, src: null, toSpk: null, toRec: null, dest: null, rec: null, raf: 0, tick: 0, chunks: [], t0: 0, own: null, discard: false, alive: true });
  const soundRef = useRef(true);
  soundRef.current = theirSound;
  const cleanup = () => {
    const s = st.current;
    s.alive = false;
    cancelAnimationFrame(s.raf);
    clearInterval(s.tick);
    try { if (s.rec && s.rec.state !== 'inactive') { s.discard = true; s.rec.stop(); } } catch {}
    try { if (s.cam) s.cam.getTracks().forEach((t) => t.stop()); } catch {}
    try { if (s.actx) s.actx.close(); } catch {}
    const own = s.own;
    if (own) setTimeout(() => { try { URL.revokeObjectURL(own); } catch {} }, 2500);
  };
  useEffect(() => () => { cleanup(); }, []);
  useEffect(() => () => { const u = out && out.url; if (u) setTimeout(() => { try { URL.revokeObjectURL(u); } catch {} }, 2500); }, [out]);
  const stopRec = (discard) => {
    const s = st.current;
    if (!s.rec || s.rec.state === 'inactive') return;
    s.discard = !!discard;
    clearInterval(s.tick);
    try { theirRef.current.pause(); } catch {}
    try { s.rec.stop(); } catch {}
  };
  useBackClose(true, onClose);
  useBackClose(phase === 'rec', () => stopRec(true));
  const draw = () => {
    const s = st.current;
    if (!s.alive) return;
    const c = canvasRef.current;
    if (c) {
      const x = c.getContext('2d');
      const W = c.width;
      const H = c.height;
      x.fillStyle = '#000000';
      x.fillRect(0, 0, W, H);
      const v = theirRef.current;
      if (v && v.videoWidth) {
        const k = Math.min(W / v.videoWidth, H / v.videoHeight);
        const dw = v.videoWidth * k;
        const dh = v.videoHeight * k;
        x.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
      }
      const cam = camRef.current;
      if (cam && cam.videoWidth) {
        const b = Math.round(Math.min(W, H) * 0.36);
        const m = Math.round(Math.min(W, H) * 0.045);
        const bx = W - b - m;
        const by = H - b - m - Math.round(H * 0.02);
        const r = b * 0.24;
        x.save();
        x.shadowColor = 'rgba(0, 0, 0, 0.35)';
        x.shadowBlur = b * 0.08;
        rrectPath(x, bx - 3, by - 3, b + 6, b + 6, r + 3);
        x.fillStyle = 'rgba(255, 255, 255, 0.92)';
        x.fill();
        x.restore();
        x.save();
        rrectPath(x, bx, by, b, b, r);
        x.clip();
        const sq = Math.min(cam.videoWidth, cam.videoHeight);
        x.translate(bx + b, by);
        x.scale(-1, 1);
        x.drawImage(cam, (cam.videoWidth - sq) / 2, (cam.videoHeight - sq) / 2, sq, sq, 0, 0, b, b);
        x.restore();
      }
    }
    s.raf = requestAnimationFrame(draw);
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      const s = st.current;
      let src = null;
      try {
        const hit = await cachedMediaLookup(rawUrl);
        if (hit) src = hit;
        else {
          const link = await resolveMedia(rawUrl);
          const res = link ? await fetch(link) : null;
          if (!res || !res.ok) throw new Error('fetch');
          s.own = URL.createObjectURL(await res.blob());
          src = s.own;
        }
      } catch { if (alive) { setErr('This video could not be loaded. Check your connection and try again.'); setPhase('error'); } return; }
      if (!alive) return;
      const v = theirRef.current;
      v.src = src;
      await new Promise((r) => { if (v.readyState >= 1) r(); else { v.onloadedmetadata = () => r(); v.onerror = () => r(); setTimeout(r, 8000); } });
      if (!alive) return;
      if (!v.videoWidth) { setErr('This video could not be loaded. Check your connection and try again.'); setPhase('error'); return; }
      const ratio = v.videoWidth / v.videoHeight;
      const d = ratio >= 1 ? { w: 720, h: Math.round(720 / ratio / 2) * 2 } : { w: Math.round((720 * ratio) / 2) * 2, h: 720 };
      setDims(d);
      try { v.currentTime = trimStart || 0; } catch {}
      try {
        s.cam = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }, audio: { echoCancellation: true, noiseSuppression: true } });
      } catch {
        if (alive) { setErr('ZChat needs your camera and microphone for this. Allow them for this site, then try again.'); setPhase('error'); }
        return;
      }
      if (!alive) { s.cam.getTracks().forEach((t) => t.stop()); return; }
      const cam = camRef.current;
      cam.srcObject = s.cam;
      try { await cam.play(); } catch {}
      setPhase('ready');
      cancelAnimationFrame(s.raf);
      s.raf = requestAnimationFrame(draw);
    })();
    return () => { alive = false; };
  }, []);
  const begin = async () => {
    const s = st.current;
    if (phase !== 'ready' || !s.cam) return;
    const v = theirRef.current;
    const c = canvasRef.current;
    try {
      if (!s.actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        s.actx = new AC();
        s.dest = s.actx.createMediaStreamDestination();
        s.src = s.actx.createMediaElementSource(v);
        s.toSpk = s.actx.createGain();
        s.toRec = s.actx.createGain();
        s.src.connect(s.toSpk);
        s.toSpk.connect(s.actx.destination);
        s.src.connect(s.toRec);
        s.toRec.connect(s.dest);
        const mic = s.actx.createMediaStreamSource(new MediaStream(s.cam.getAudioTracks()));
        mic.connect(s.dest);
      }
      if (s.actx.state !== 'running') await s.actx.resume().catch(() => {});
      s.toSpk.gain.value = soundRef.current ? 1 : 0;
      s.toRec.gain.value = soundRef.current ? 1 : 0;
      const stream = c.captureStream(30);
      s.dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const mime = pickRecorderType();
      s.chunks = [];
      s.discard = false;
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1800000, audioBitsPerSecond: 96000 });
      s.rec = rec;
      rec.ondataavailable = (e) => { if (e.data && e.data.size) s.chunks.push(e.data); };
      rec.onstop = () => {
        stream.getVideoTracks().forEach((t) => t.stop());
        if (!s.alive) return;
        if (s.discard) { setPhase('ready'); setSecs(0); try { v.currentTime = trimStart || 0; } catch {} return; }
        const type = (rec.mimeType || mime || 'video/webm').split(';')[0];
        const blob = new Blob(s.chunks, { type });
        s.chunks = [];
        if (blob.size < 2000) { setPhase('ready'); appSnack('That was too short. Try again.'); return; }
        setOut({ blob, type, url: URL.createObjectURL(blob), secs: Math.max(1, Math.round((Date.now() - s.t0) / 1000)) });
        setPhase('review');
      };
      try { v.currentTime = trimStart || 0; } catch {}
      v.muted = false;
      rec.start(250);
      s.t0 = Date.now();
      setSecs(0);
      setPhase('rec');
      playUiSound('record_start');
      await v.play().catch(() => {});
      const endAt = trimEnd && trimEnd > (trimStart || 0) ? trimEnd : null;
      s.tick = setInterval(() => {
        const t = (Date.now() - s.t0) / 1000;
        setSecs(Math.floor(t));
        if (t >= REACT_MAX_SECS || v.ended || (endAt && v.currentTime >= endAt - 0.05)) stopRec(false);
      }, 200);
      v.onended = () => stopRec(false);
    } catch {
      setErr('Your reaction could not be recorded on this device.');
      setPhase('error');
    }
  };
  const flipSound = () => {
    hapticTap();
    playUiSound('toggle');
    setTheirSound((on) => {
      const s = st.current;
      if (s.toSpk) s.toSpk.gain.value = on ? 0 : 1;
      if (s.toRec) s.toRec.gain.value = on ? 0 : 1;
      return !on;
    });
  };
  const again = () => { setOut(null); setSecs(0); setPhase('ready'); try { theirRef.current.currentTime = trimStart || 0; } catch {} };
  const send = () => {
    if (!out) return;
    const ext = /mp4/i.test(out.type) ? 'mp4' : 'webm';
    onSend(new File([out.blob], `reaction-${Date.now()}.${ext}`, { type: out.type }), { w: dims.w, h: dims.h });
  };
  const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const boxH = Math.round(Math.min(vh * 0.66, (vw - 24) * (dims.h / dims.w)));
  const boxW = Math.round(boxH * (dims.w / dims.h));
  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  return (
    <div role="dialog" aria-label="Record your reaction" className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 230, background: '#000000', color: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px' }}>
        <div role="button" aria-label="Close" onClick={() => { if (phase === 'rec') stopRec(true); onClose(); }} style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={24} /></div>
        <div style={{ flex: 1, fontSize: 17, fontWeight: 800 }}>{phase === 'review' ? 'Your reaction' : 'Record your reaction'}</div>
        {phase === 'rec' && <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 14, fontWeight: 800, fontVariantNumeric: 'tabular-nums', paddingRight: 8 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF3B30' }} />{mm}</div>}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: boxW, height: boxH, borderRadius: 18, overflow: 'hidden', background: '#111' }}>
          <video ref={theirRef} playsInline preload="auto" muted aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          <video ref={camRef} playsInline muted autoPlay aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, width: '36%', height: '36%', objectFit: 'cover', pointerEvents: 'none' }} />
          <canvas ref={canvasRef} width={dims.w} height={dims.h} aria-label={phase === 'review' ? undefined : 'Preview of your reaction'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: phase === 'review' ? 'none' : 'block' }} />
          {phase === 'review' && out && <video src={out.url} controls playsInline loop autoPlay style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />}
          {phase === 'prep' && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}><Spinner size={24} /><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)' }}>Getting your camera ready</div></div>}
          {phase === 'error' && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, fontSize: 14.5, lineHeight: 1.45, fontWeight: 600 }}>{err}</div>}
        </div>
      </div>
      <div style={{ padding: '10px 20px calc(18px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, minHeight: 92, boxSizing: 'border-box' }}>
        {phase === 'review' ? (
          <>
            <div role="button" aria-label="Record again" onClick={again} className="zchat-press" style={{ flex: 1, maxWidth: 170, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Record again</div>
            <BigButton label="Send" onClick={send} style={{ flex: 1, maxWidth: 170, height: 52, borderRadius: 16 }} />
          </>
        ) : (phase === 'ready' || phase === 'rec') ? (
          <>
            <div role="switch" aria-checked={theirSound} aria-label="Their sound in your video" onClick={flipSound} className="zchat-press" style={{ width: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#FFFFFF' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theirSound ? 'rgba(255,255,255,0.14)' : '#FFFFFF', color: theirSound ? '#FFFFFF' : '#000000' }}>{theirSound ? <Volume2 size={20} /> : <VolumeX size={20} />}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{theirSound ? 'Their sound' : 'Sound off'}</div>
            </div>
            <div role="button" aria-label={phase === 'rec' ? 'Stop recording' : 'Start recording'} onClick={() => (phase === 'rec' ? stopRec(false) : begin())} className="zchat-press"
              style={{ width: 74, height: 74, borderRadius: '50%', boxShadow: 'inset 0 0 0 4px #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: phase === 'rec' ? 26 : 58, height: phase === 'rec' ? 26 : 58, borderRadius: phase === 'rec' ? 7 : '50%', background: '#FF3B30', transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
            </div>
            <div style={{ width: 92, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.35 }}>{phase === 'rec' ? 'Stops when the video ends' : 'Their video plays while you record'}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
const NS_OWN_MOTIONS = [['still', 'Still'], ['shimmer', 'Shimmer'], ['wave', 'Wave'], ['pulse', 'Pulse']];
const NS_OWN_WEIGHTS = [[600, 'Medium'], [700, 'Bold'], [800, 'Heavy'], [900, 'Black']];
const NS_OWN_PRESETS = [
  ['Sunset', ['#FF5E62', '#FF9966', '#FFD36B']], ['Lagoon', ['#00B4DB', '#0083B0', '#7DF0E0']], ['Berry', ['#8E2DE2', '#D63AA3', '#FF8FB1']],
  ['Mint', ['#11998E', '#38EF7D', '#C8FFD9']], ['Peach', ['#FF9A8B', '#FF6A88', '#FFC796']], ['Night sky', ['#3A47D5', '#7C5CFC', '#00D2FF']],
  ['Gold', ['#B8860B', '#F7D774', '#FFF3C4']], ['Rose', ['#E8507A', '#F7A1B8', '#FFE1EA']], ['Forest', ['#1D6B42', '#5CB85C', '#C7E86B']], ['Ice', ['#6FB1FC', '#B8E1FF', '#FFFFFF']],
];
const NS_OWN_SWATCHES = ['#7C5CFC', '#5B8CFF', '#00B4DB', '#11C5A3', '#38EF7D', '#C7E86B', '#FFD36B', '#FF9966', '#FF5E62', '#E8507A', '#D63AA3', '#FF8FB1', '#FFFFFF', '#B7C0CC', '#4A5568', '#1F2533'];
function nsOwnKey(cols, motion, weight) {
  const cs = (cols || []).filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 3).map((c) => c.slice(1).toLowerCase());
  const mo = NS_OWN_MOTIONS.some(([k]) => k === motion) ? motion : 'shimmer';
  const w = Math.min(9, Math.max(6, Math.round((Number(weight) || 800) / 100)));
  return cs.length >= 2 ? `own:${cs.join('.')}.${mo}.${w}` : null;
}
async function setTagFollow(uid, tag, on) {
  const s = await loadTagFollows(uid);
  if (on) s.add(tag); else s.delete(tag);
  try { window.dispatchEvent(new Event('zchat-tag-follow')); } catch {}
  const res = on ? await supabase.from('tag_follows').upsert({ user_id: uid, tag }, { onConflict: 'user_id,tag' }) : await supabase.from('tag_follows').delete().eq('user_id', uid).eq('tag', tag);
  if (res.error) { if (on) s.delete(tag); else s.add(tag); try { window.dispatchEvent(new Event('zchat-tag-follow')); } catch {} return false; }
  return true;
}
function useTagFollows(uid) {
  const [set, setSet] = useState(() => (tagFollowMem.uid === uid ? tagFollowMem.set : null));
  useEffect(() => {
    let alive = true;
    loadTagFollows(uid).then((s) => { if (alive) setSet(new Set(s)); });
    const on = () => { if (tagFollowMem.set) setSet(new Set(tagFollowMem.set)); };
    window.addEventListener('zchat-tag-follow', on);
    return () => { alive = false; window.removeEventListener('zchat-tag-follow', on); };
  }, [uid]);
  return set || new Set();
}
function TrendingTile({ r, rank, onOpen, theme }) {
  return (
    <div role="button" aria-label={`Tag ${r.tag}`} onClick={() => onOpen(r.tag)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', cursor: 'pointer' }}>
      <div style={{ width: 26, fontSize: 15, fontWeight: 800, color: theme.muted, flexShrink: 0 }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>#{r.tag}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{r.n === 1 ? '1 post this week' : `${formatCount(r.n)} posts this week`}</div>
      </div>
      <div style={{ width: 46, height: 46, borderRadius: 10, overflow: 'hidden', background: theme.rowBg, flexShrink: 0 }}>{r.sample && <img src={r.sample} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}</div>
    </div>
  );
}
export function TrendingPage({ me, userId, onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const rows = useTrendingTags();
  const follows = useTagFollows(userId);
  const [open, setOpen] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { loadTrendingTags(true).then(() => setTick((t) => t + 1)); }, []);
  const followed = Array.from(follows);
  return (
    <FullPage title="Trending" subtitle="Most used tags this week" onBack={onClose} zIndex={90} pad={false}>
      {followed.length > 0 && (
        <div style={{ padding: '10px 0 6px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '0 16px 10px' }}>Tags you follow</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 12px 4px' }}>
            {followed.map((t) => { const r = (rows || []).find((x) => x.tag === t); return <TagThumb key={t} tag={t} sample={r && r.sample} sub={r ? `${formatCount(r.n)} ${r.n === 1 ? 'post' : 'posts'}` : 'Following'} onOpen={setOpen} size={58} />; })}
          </div>
        </div>
      )}
      {rows === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>
      ) : !rows.length ? (
        <EmptyState art="search" title="Nothing trending yet" text="Add tags like #sunset to your captions. The most used ones show up here." />
      ) : (
        <div role="list" aria-label="Trending tags" style={{ padding: '6px 0 16px' }} data-tick={tick}>
          {rows.map((r, i) => <TrendingTile key={r.tag} r={r} rank={i + 1} theme={theme} onOpen={setOpen} />)}
        </div>
      )}
      {open && <HashtagPage key={open} tag={open} me={me} userId={userId} onClose={() => setOpen(null)} onOpenProfile={onOpenProfile} />}
    </FullPage>
  );
}
export function HashtagPage({ tag, me, userId, onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [posts, setPosts] = useState(() => hashtagPostsMem.get(tag.toLowerCase()) || null);
  const [open, setOpen] = useState(null);
  const follows = useTagFollows(userId);
  const following = follows.has(tag.toLowerCase());
  const [fBusy] = useState(false);
  const toggleFollow = async () => {
    hapticTap();
    const ok = await setTagFollow(userId, tag.toLowerCase(), !following);
    if (!ok) appAlert('Following tags switches on once the latest ZChat setup is finished.');
  };
  useEffect(() => {
    let alive = true;
    setPosts(hashtagPostsMem.get(tag.toLowerCase()) || null);
    const safe = tag.replace(/[\\%_]/g, (c) => `\\${c}`);
    supabase.from('posts').select('*').ilike('caption', `%#${safe}%`).order('created_at', { ascending: false }).limit(120).then(({ data }) => {
      let re = null;
      try { re = new RegExp(`#${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, 'iu'); } catch {}
      const list = (data || []).filter((x) => (!re || re.test(x.caption || '')) && !notYetPosted(x) && !postGoneIds.has(x.id));
      hashtagPostsMem.set(tag.toLowerCase(), list);
      if (hashtagPostsMem.size > 20) hashtagPostsMem.delete(hashtagPostsMem.keys().next().value);
      if (alive) setPosts(list);
    }, () => { if (alive) setPosts((prev) => prev || []); });
    return () => { alive = false; };
  }, [tag]);
  return (
    <FullPage title={`#${tag}`} subtitle={posts ? `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}` : ''} onBack={onClose} zIndex={90}
      right={<PillButton small primary={!following} label={fBusy ? (following ? 'Unfollowing' : 'Following') : following ? 'Following' : 'Follow'} ariaLabel={following ? `Unfollow tag ${tag}` : `Follow tag ${tag}`} onClick={toggleFollow} />}>
      {posts === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>}
      {posts && !posts.length && <EmptyState art="nothing" title="No posts yet" text={`Be the first to post with #${tag}. Add it to the caption of your next post.`} />}
      {posts && posts.length > 0 && (
        <div role="list" aria-label={`Posts with #${tag}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, margin: '4px -16px 0' }}>
          {posts.map((x) => <PostTile key={x.id} p={x} onOpen={setOpen} />)}
        </div>
      )}
      {open && <Portal><FeedPanel me={me} userId={userId} fixedIds={posts.map((x) => x.id)} title={`#${tag}`} startPostId={open.id} seedPost={open} onClose={() => setOpen(null)} onOpenProfile={(pp) => { setOpen(null); if (onOpenProfile) onOpenProfile(pp); }} /></Portal>}
    </FullPage>
  );
}

function WnDecorArt({ me, thumb = false, keys = ['neon_city', 'koi_pond', 'snow_globe'] }) {
  const ref = useRef(null);
  const w = useWidthOf(ref, thumb ? 74 : 360);
  const name = (me && me.name) || 'You';
  const photo = me && me.avatar;
  useDecorLoaded(DECOR_SPRITE);
  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: 'radial-gradient(120% 80% at 50% 30%, #2c2160 0%, #0d0b1a 72%)', display: 'flex', alignItems: thumb ? 'center' : 'flex-end', justifyContent: 'center' }}>
      {thumb ? (
        <DecorFrameBadge setKey={keys[1]} size={56} photo={photo} name={name} />
      ) : (
        <>
          <div style={{ position: 'absolute', left: -22, top: '12%', transform: 'rotate(-10deg)', opacity: 0.9 }}><DecorFrameBadge setKey={keys[0]} size={112} photo={photo} name={name} /></div>
          <div style={{ position: 'absolute', right: -22, top: '6%', transform: 'rotate(10deg)', opacity: 0.9 }}><DecorFrameBadge setKey={keys[2]} size={112} photo={photo} name={name} /></div>
          <div style={{ position: 'relative', zIndex: 2, paddingBottom: 46 }}>
            <DecorHero frameKey={keys[1]} plateKey={keys[1]} width={Math.max(220, Math.min(340, w - 48))} photo={photo} name={name} username={me && me.username} verified={me && me.verified} custom={me && me.custom_badge} gapColor="#0d0b1a" />
          </div>
        </>
      )}
    </div>
  );
}

export function CharmTryOnPage({ me, charmKey, onClose, action }) {
  useBackClose(true, onClose);
  const spec = CUSTOM_BADGES[charmKey];
  if (!spec) return null;
  const r = RARITY_STYLE[spec.rarity] || RARITY_STYLE.epic;
  const name = me ? (me.name || me.username || 'You') : 'You';
  const username = me ? me.username : 'you';
  const photo = me && typeof me.avatar === 'string' && me.avatar.startsWith('http') ? me.avatar : null;
  const time = fmtHM(new Date());
  const mockCard = { borderRadius: 20, background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' };
  const label = { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: '22px 4px 8px' };
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 900, background: '#07080d', color: 'white', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', paddingTop: 'calc(10px + env(safe-area-inset-top))', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(7,8,13,0.9)', zIndex: 2 }}>
        <div role="button" aria-label="Close preview" onClick={onClose} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</div>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: r.color }}>{r.label} preview</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 14px 130px' }}>
        <div style={label}>Next to your name</div>
        <div style={{ ...mockCard, position: 'relative' }}>
          <div style={{ position: 'absolute', left: -40, right: -40, top: -40, height: 260, overflow: 'hidden', pointerEvents: 'none' }}>
            {photo
              ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(1.25)', opacity: 0.8, transform: 'scale(1.08)' }} />
              : <div style={{ position: 'absolute', inset: 0, background: colorForName(name), filter: 'blur(40px)', opacity: 0.7 }} />}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 240, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, #0f1117 100%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: '26px 16px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <Avatar emoji={me ? me.avatar : ''} name={name} size={104} />
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {name}{me && <VerifiedBadge tier={me.verified} custom={charmKey} size={19} />}
            </div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>@{username}</div>
          </div>
        </div>
        <div style={label}>In the chat list</div>
        <div style={mockCard}>
          {[
            { mine: true, text: 'Look at my new charm', unread: 2, time },
            { mine: false, name: 'Alex', text: 'See you tomorrow!', time: 'Yesterday', color: '#29C7B3' },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              {row.mine
                ? <Avatar emoji={me ? me.avatar : ''} name={name} size={46} />
                : <div style={{ width: 46, height: 46, borderRadius: '50%', background: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>{row.name[0]}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 15, display: 'flex', alignItems: 'center' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.mine ? name : row.name}</span>
                  {row.mine && me && <VerifiedBadge tier={me.verified} custom={charmKey} size={13} />}
                </div>
                <div style={{ fontSize: 13, color: row.unread ? 'white' : 'rgba(255,255,255,0.55)', fontWeight: row.unread ? 700 : 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.text}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <div style={{ fontSize: 11.5, color: row.unread ? '#B79CFF' : 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{row.time}</div>
                {row.unread && <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: '#1D7BF0', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }}>{row.unread}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {action && (
        <div style={{ position: 'absolute', zIndex: 40, left: 0, right: 0, bottom: 0, padding: '12px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, rgba(7,8,13,0) 0%, rgba(7,8,13,0.96) 30%)' }}>
          <button onClick={action.onClick} disabled={action.disabled} style={{ width: '100%', padding: '15px 16px', borderRadius: 18, border: 'none', fontFamily: FONT, fontWeight: 900, fontSize: 16.5, cursor: action.disabled ? 'default' : 'pointer', color: action.disabled ? 'rgba(255,255,255,0.6)' : '#1a0f02', background: action.disabled ? 'rgba(255,255,255,0.1)' : '#F5A524' }}>{action.label}</button>
          {action.sub && <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontWeight: 700 }}>{action.sub}</div>}
        </div>
      )}
    </div>
  );
}
function FxPlayRow({ set, onPlay }) {
  return (
    <div role="button" aria-label="Play the profile effect" onClick={() => { hapticTap(); onPlay(); }} className="zchat-press" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px 12px 14px', borderRadius: 18, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}`, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: `${set.accent}4D`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#FFFFFF' }}><ProfileFxIcon size={20} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 650, color: CL.ink }}>Profile effect</div>
        <div style={{ fontSize: 12.5, color: CL.ink2, lineHeight: 1.4, marginTop: 1 }}>Plays when someone opens your profile while you wear the full set</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 19, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Play size={15} fill="#0B0B0F" strokeWidth={0} style={{ marginLeft: 2 }} /></div>
    </div>
  );
}
function DropClock({ to }) {
  useSecondTick(true);
  const c = countdownParts(to);
  const cells = [[c.d, 'days'], [c.h, 'hours'], [c.m, 'mins'], [c.s, 'secs']];
  return (
    <div role="timer" aria-label={`${countWord(c.d, 'day', 'days')} ${countWord(c.h, 'hour', 'hours')} ${countWord(c.m, 'minute', 'minutes')} left`} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {cells.map(([v, l]) => (
        <div key={l} style={{ width: 62, padding: '10px 0 8px', borderRadius: 14, background: CL.card2, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: CL.ink, fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: CL.ink3, marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
export function DropPage({ drop, me, rewards, wallet, onClose, onWear, onRefresh, onOpenWallet }) {
  useBackClose(true, onClose);
  useSecondTick(true);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [note, setNote] = useState('');
  const [party, setParty] = useState(0);
  const [fxRun, setFxRun] = useState(0);
  const [reminded, setReminded] = useState(() => dropsMem.mine.has(drop.id));
  const boxRef = useRef(null);
  const bw = useWidthOf(boxRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 560));
  const W = Math.round(Math.max(240, Math.min(400, bw - 28)));
  const set = drop.kind === 'set' ? DECOR_BY_KEY[drop.item_key] : null;
  const accent = set ? set.accent : '#8B6CFF';
  const phase = dropPhase(drop);
  const own = set ? decorOwned(rewards, set.key) : { frame: false, plate: false, effect: false, count: 0 };
  const owned = dropOwned(drop, rewards);
  const half = set && own.any && !owned;
  const price = half ? Math.max(1, Math.ceil((drop.price * (3 - own.count)) / 3)) : drop.price;
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const wearing = set ? me.avatar_frame === set.key && me.nameplate === set.key : false;
  const noteTimer = useRef(0);
  const flash = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2600); };
  useMoneyToast(flash);
  const toggleRemind = async () => {
    if (busy) return;
    setBusy(true);
    const on = !reminded;
    setReminded(on);
    hapticTap();
    playUiSound(on ? 'like' : 'toggle');
    flash(on ? 'We will tell you the moment it opens' : 'Reminder off');
    const { error } = on
      ? await supabase.from('drop_reminders').insert({ drop_id: drop.id, user_id: me.id })
      : await supabase.from('drop_reminders').delete().eq('drop_id', drop.id).eq('user_id', me.id);
    setBusy(false);
    if (error && !/duplicate|unique/i.test(String(error.message || ''))) { setReminded(!on); flash('That did not work. Try again.'); return; }
    if (on) dropsMem.mine.add(drop.id); else dropsMem.mine.delete(drop.id);
  };
  const buy = async () => {
    setAsk(false);
    if (busy) return;
    if (!(await spendGate(`Get ${drop.title} for ${price} coins`, { coins: price }))) return;
    const kinds = set ? DECOR_PIECES.filter((k) => !(k === 'frame' ? own.frame : k === 'nameplate' ? own.plate : own.effect)) : ['bubble'];
    const job = moneyRun(me.id, { coins: price, grants: kinds.map((k) => [k, drop.item_key]), run: async () => {
      const { data, error } = await supabase.rpc('zchat_buy_drop', { p_drop: drop.id });
      const row = Array.isArray(data) ? data[0] : data;
      if (error) return { error: rpcFailText('Drop buy', error, 'Drops switch on once the latest ZChat setup is finished.') };
      if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
      return { ok: true, coins: row.coins };
    } });
    hapticTap();
    playUiSound('win');
    setParty(Date.now());
    job.then((r) => {
      if (r.error) { setParty(0); flash(r.error); return; }
      if (onRefresh) onRefresh();
    });
  };
  const wear = () => {
    if (busy || !set) return;
    onWear({ avatar_frame: set.key, nameplate: set.key });
  };
  const btn = (primary) => ({ height: 52, borderRadius: 14, border: 'none', fontFamily: FONT, fontWeight: 650, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 18px', width: '100%', background: primary ? CL.accent : CL.card2, color: '#FFFFFF' });
  const when = (iso) => fmtDate(new Date(iso), { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  const phaseWord = phase === 'live' ? 'Live now' : phase === 'soon' ? 'Coming soon' : 'Ended';
  const tapGet = () => { if (!wallet || !wallet.ready) { flash('Drops switch on once the latest ZChat setup is finished.'); return; } if (coins < price) { if (onOpenWallet) onOpenWallet(); else flash(`You need ${moreCoinsText(price - coins)}`); return; } setAsk(true); };
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 650, background: `linear-gradient(180deg, ${accent}3D 0%, ${accent}12 30%, rgba(11,11,15,0) 56%), ${CL.bg}`, color: CL.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {party > 0 && <DecorConfetti key={party} colors={[accent, '#FFFFFF', '#BFD6FF', '#8B6CFF']} />}
      {set && set.fx && <ProfileEffectLayer effectKey={set.key} runKey={fxRun} force={fxRun > 0} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 4px', paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
        <div role="button" aria-label="Back" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ArrowLeft size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{drop.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap', color: phase === 'live' ? '#FF5C7A' : CL.ink2 }}>
            {phase === 'live' && <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B5C', flexShrink: 0, animation: reducedMotion() ? 'none' : 'zchat-live-dot 1.4s ease-in-out infinite' }} />}
            <span style={{ flexShrink: 0 }}>{phaseWord}</span>
            <span style={{ color: CL.ink3, fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{set ? 'Limited set' : 'Limited bubble'}</span>
          </div>
        </div>
        <ShopPagePill coins={coins} onOpenWallet={onOpenWallet} />
      </div>
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 14px calc(24px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px' }}>
          <div className="zchat-pop" style={{ width: '100%', maxWidth: 520 }}>
            {set ? <ShopProfileMock me={me} frameKey={set.key} plateKey={set.key} charm={me.custom_badge} nsKey={cxNs(me)} width={W + 28} dark /> : <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', borderRadius: 20, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}` }}><DropArt drop={drop} me={me} size={180} /></div>}
          </div>
        </div>
        <div style={{ maxWidth: 420, margin: '14px auto 0' }}>
          {(drop.blurb || (set && set.about)) && <div style={{ fontSize: 14.5, color: CL.ink2, lineHeight: 1.5, textAlign: 'center', padding: '0 8px', textWrap: 'pretty' }}>{drop.blurb || set.about}</div>}
          {phase !== 'ended' && !owned && (
            <div style={{ marginTop: 16, borderRadius: 18, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}`, padding: '13px 12px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: CL.ink2, marginBottom: 10 }}>{phase === 'soon' ? 'Opens in' : 'Ends in'}</div>
              <DropClock to={phase === 'soon' ? drop.starts_at : drop.ends_at} />
              <div style={{ fontSize: 12.5, color: CL.ink3, marginTop: 10 }}>{phase === 'soon' ? `Opens ${when(drop.starts_at)}` : `Ends ${when(drop.ends_at)}`}</div>
            </div>
          )}
          {set && set.fx && <FxPlayRow set={set} onPlay={() => setFxRun(Date.now())} />}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {owned ? (
              set && (wearing
                ? <button disabled style={{ ...btn(false), cursor: 'default', color: CL.own, background: 'rgba(61,214,140,0.14)' }}><Check size={18} strokeWidth={3} />Wearing it</button>
                : <button disabled={busy} onClick={wear} style={btn(true)}>{busy ? <Spinner size={16} color="#FFFFFF" /> : 'Wear it now'}</button>)
            ) : phase === 'soon' ? (
              <button disabled={busy} onClick={toggleRemind} aria-pressed={reminded} style={reminded ? { ...btn(false), color: CL.ink } : btn(true)}>{reminded ? <><Check size={18} strokeWidth={3} />Reminder set</> : <><Bell size={18} />Remind me</>}</button>
            ) : phase === 'live' ? (
              <button disabled={busy} onClick={tapGet} aria-label={coins < price ? `Get ${moreCoinsText(price - coins)}` : `Get ${drop.title} for ${price} coins`} style={{ ...btn(coins >= price) }}>
                {busy ? <Spinner size={16} color="#FFFFFF" /> : coins < price ? `Get ${moreCoinsText(price - coins)}` : <>Get it<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}><CoinIcon size={18} />{formatCount(price)}</span></>}
              </button>
            ) : (
              <button disabled style={{ ...btn(false), cursor: 'default', color: CL.ink2 }}>This drop has ended</button>
            )}
          </div>
          <div style={{ fontSize: 13, color: CL.ink3, textAlign: 'center', marginTop: 14, lineHeight: 1.5, padding: '0 6px' }}>
            {owned ? 'It is yours to keep, even after the drop ends.' : half ? 'You already have part of it, so you only pay for the rest.' : set ? 'You get the frame, the nameplate and the profile effect. It is only here while the drop is live.' : 'It is only here while the drop is live.'}
          </div>
        </div>
      </div>
      {ask && (
        <ConfirmDialog layer={720} danger={false} title={`Get ${drop.title}?`} confirmLabel={`Use ${formatCount(price)} coins`}
          body={`It is yours to keep. You have ${formatCount(coins)} coins.`}
          onCancel={() => setAsk(false)} onConfirm={buy} />
      )}
      {note && <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', top: 'calc(64px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 40, padding: '9px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.95)', color: '#111', fontSize: 13.5, fontWeight: 700, width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none' }}>{note}</div>}
    </div>
  );
}
function limitDay(ymd) { const d = ymd ? new Date(`${ymd}T00:00:00`) : null; return d && Number.isFinite(d.getTime()) ? fmtDate(d, { month: 'long', day: 'numeric' }) : 'the 1st'; }
function limitWhen(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || !Number.isFinite(d.getTime())) return 'tomorrow';
  const t = fmtDate(d, { hour: 'numeric', minute: '2-digit' });
  const day0 = new Date(); day0.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - day0.getTime()) / 86400000);
  return diff <= 0 ? `today at ${t}` : diff === 1 ? `tomorrow at ${t}` : `on ${fmtDate(d, { weekday: 'long', month: 'long', day: 'numeric' })} at ${t}`;
}
export function MonthLimitSheet({ req, onDone }) {
  const { theme } = useTheme();
  useBackClose(true, () => onDone(false));
  const [err, setErr] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const onPin = async (pin) => {
    if (busy) return;
    setBusy(true);
    const h = await hashAppPin(pin);
    let res;
    try { res = await supabase.rpc('zchat_spend_allow', { p_pin: h, p_coins: req.coins }); } catch (e) { res = { error: e }; }
    setBusy(false);
    const row = res && !res.error ? (Array.isArray(res.data) ? res.data[0] : res.data) : null;
    if (row && row.ok) { playUiSound('toggle'); onDone(true); return; }
    playUiSound('cancel');
    setErr((n) => n + 1);
    setMsg(res && res.error ? rpcFailText('Monthly limit', res.error, 'The monthly limit switches on once the latest ZChat setup is finished.') : (row && row.reason) || 'That did not work. Try again.');
  };
  return (
    <Portal>
      <div onClick={() => onDone(false)} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 970, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="dialog" aria-modal="true" aria-label="Over your monthly limit" onClick={(e) => e.stopPropagation()} className="zchat-sheet-up"
          style={{ width: '100%', maxWidth: 460, maxHeight: 'calc(100% - 12px)', overflowY: 'auto', boxSizing: 'border-box', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '10px 18px calc(12px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.accentSoft, color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SecGlyph k="spend" size={28} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, marginTop: 12, letterSpacing: '-0.01em' }}>Over your monthly limit</div>
            {reasonLine(req.reason, theme)}
            <div style={{ width: '100%', maxWidth: 320, marginTop: 14 }}>
              <div role="progressbar" aria-label="Monthly limit used" aria-valuemin={0} aria-valuemax={req.limit} aria-valuenow={req.limit - req.left} style={{ height: 8, borderRadius: 4, background: theme.soft, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, Math.round(((req.limit - req.left) / Math.max(1, req.limit)) * 100))}%`, height: '100%', borderRadius: 4, background: theme.coral }} /></div>
              <div style={{ fontSize: 14, color: theme.ink2, lineHeight: 1.5, marginTop: 10 }}>{`This costs ${fmt(req.coins)} coins and you have ${req.left ? `${fmt(req.left)} left` : 'none left'} of your ${fmt(req.limit)} for this month, until ${limitDay(req.resets)}. Enter your PIN to go over it this once.`}</div>
            </div>
          </div>
          <AppPinPad compact subtitle={msg || (err ? 'Wrong PIN, try again' : 'Enter your PIN')} onComplete={onPin} error={err} />
          <div role="button" aria-label="Cancel" onClick={() => onDone(false)} className="zchat-press" style={{ textAlign: 'center', padding: '14px 0 4px', fontSize: 15, fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
        </div>
      </div>
    </Portal>
  );
}
const MONTH_LIMITS = [0, 500, 1000, 2500, 5000, 10000];
export function MonthlyLimitPage({ uid, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const st = useSpendLimit(uid);
  const [ask, setAsk] = useState(null);
  const [pinFor, setPinFor] = useState(null);
  const [err, setErr] = useState('');
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const cur = st ? st.limit : null;
  const left = limitLeft(st);
  const spent = st ? st.spent + (limitMem.local || 0) : 0;
  const apply = async (lim, hash) => {
    const before = limitMem.data;
    const lower = lim > 0 && (cur == null || lim <= cur);
    const same = (lim || null) === cur;
    const next = before ? { ...before } : { limit: null, spent: 0, nextSet: false, nextLimit: null, nextAt: null, resets: null, hasPin: false };
    if (lower) Object.assign(next, { limit: lim, nextSet: false, nextLimit: null, nextAt: null });
    else if (same) Object.assign(next, { nextSet: false, nextLimit: null, nextAt: null });
    else Object.assign(next, { nextSet: true, nextLimit: lim || null, nextAt: next.nextSet && next.nextLimit === (lim || null) ? next.nextAt : new Date(Date.now() + 86400000).toISOString() });
    if (hash) next.hasPin = true;
    limitMem.mark = Date.now();
    limitKeep(uid, next);
    hapticTap();
    playUiSound('toggle');
    setErr('');
    let tz = 'UTC';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch {}
    const r = await giftRpc('zchat_spend_limit_set', { p_limit: lim || null, p_tz: tz, p_pin: hash || null }, 'Monthly limit');
    limitMem.mark = 0;
    if (r.error) { limitKeep(uid, before); setErr(r.error); return; }
    limitMem.at = Date.now();
    limitKeep(uid, limitNorm(r.row.state));
  };
  const pick = async (lim) => {
    if (!st && !limitMem.off) return;
    if ((lim || null) === cur && !(st && st.nextSet)) return;
    const lower = lim > 0 && (cur == null || lim <= cur);
    if (!lower && (lim || null) !== cur) { setAsk(lim); return; }
    if (lim > 0 && !(st && st.hasPin)) {
      const h = readAppLock().h;
      if (h) { apply(lim, h); return; }
      setPinFor(lim);
      return;
    }
    apply(lim, null);
  };
  const pct = st && cur ? Math.min(100, Math.round((spent / Math.max(1, cur)) * 100)) : 0;
  return (
    <FullPage title="Monthly limit" onBack={onClose} zIndex={770}>
      <div style={{ padding: '16px 2px 4px' }}>
        {cur != null ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 34, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(left)}</span>
              <span style={{ fontSize: 15, color: theme.muted }}>{`of ${fmt(cur)} coins left this month`}</span>
            </div>
            <div role="progressbar" aria-label="Monthly limit used" aria-valuemin={0} aria-valuemax={cur} aria-valuenow={Math.min(cur, spent)} style={{ height: 8, borderRadius: 4, background: theme.soft, overflow: 'hidden', marginTop: 12 }}>
              <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: pct >= 100 ? theme.danger : theme.coral, transition: reducedMotion() ? 'none' : 'width 300ms ease-out' }} />
            </div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 8 }}>{`You spent ${fmt(spent)} ${spent === 1 ? 'coin' : 'coins'}. It starts again on ${limitDay(st && st.resets)}.`}</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em' }}>No monthly limit</div>
            <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4, lineHeight: 1.5 }}>{st ? `You spent ${fmt(spent)} ${spent === 1 ? 'coin' : 'coins'} this month. Pick a limit to keep it in check.` : limitMem.off ? 'The monthly limit switches on once the latest ZChat setup is finished.' : 'Pick how many coins you want to spend each month.'}</div>
          </>
        )}
      </div>
      {st && st.nextSet && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 0', padding: '12px 14px', borderRadius: 16, background: theme.soft }}>
          <Clock size={20} color={theme.ink2} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: theme.ink2, lineHeight: 1.45 }}>{`${st.nextLimit ? `Your limit goes up to ${fmt(st.nextLimit)}` : 'Your limit comes off'} ${limitWhen(st.nextAt)}. A higher limit waits a day, so a quick decision has time to cool off.`}</div>
          <div role="button" aria-label="Keep my current limit" onClick={() => apply(cur, null)} className="zchat-press" style={{ fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', flexShrink: 0 }}>Keep {fmt(cur)}</div>
        </div>
      )}
      <KitSection title="Limit per month" style={{ marginTop: 22 }}>
        <ChoiceList label="Limit per month" value={st && st.nextSet ? (st.nextLimit || 0) : (cur || 0)} onChange={pick}
          options={MONTH_LIMITS.map((n) => ({ k: n, label: n ? `${fmt(n)} coins a month` : 'No limit', sub: st && st.nextSet && n === (st.nextLimit || 0) ? `Starts ${limitWhen(st.nextAt)}` : st && st.nextSet && n === (cur || 0) ? 'Your limit for now' : n === 0 ? 'Spend as many coins as you like' : cur != null && n > cur ? 'Starts in 24 hours' : undefined }))} />
      </KitSection>
      {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '12px 2px 24px', lineHeight: 1.5 }}>It counts the coins you spend anywhere on ZChat, in the Shop, on gifts, gift bags and tips. Going over asks for your PIN. A lower limit starts right away, a higher one after 24 hours.</div>
      {ask != null && (
        <ConfirmDialog layer={800} danger={false} title={ask ? `Raise your limit to ${fmt(ask)}?` : 'Take your limit off?'} confirmLabel={ask ? 'Raise it tomorrow' : 'Take it off tomorrow'}
          body="It changes in 24 hours. Until then your current limit stays on." onCancel={() => setAsk(null)} onConfirm={() => { const v = ask; setAsk(null); apply(v, null); }} />
      )}
      {pinFor != null && <AppPinSetupPage title="Choose a PIN" note="You type this PIN when you want to go over your monthly limit. It also locks ZChat when you leave, which you can change in App lock." zIndex={800}
        onClose={() => setPinFor(null)} onDone={() => { const v = pinFor; setPinFor(null); apply(v, readAppLock().h || null); }} />}
    </FullPage>
  );
}
const MILESTONES = [[5, 25], [15, 50], [30, 100], [60, 200], [100, 400]];
function useMilestones(uid, rewardsSig) {
  useShopTick();
  msWarm(uid);
  useEffect(() => { loadMilestones(uid, true); }, [uid, rewardsSig]);
  return msMem.uid === uid ? msMem.data : null;
}
function milestoneMark(uid, level, on) {
  if (msMem.uid !== uid) return;
  if (on) msMem.pend.add(level); else msMem.pend.delete(level);
  const cur = msMem.data;
  if (!cur || cur.off) return;
  const claimed = cur.claimed.filter((x) => x !== level);
  msMem.data = { ...cur, claimed: on ? [...claimed, level].sort((a, b) => a - b) : claimed };
  shopPing();
}
async function claimMilestone(uid, level) {
  const add = (MILESTONES.find(([lv]) => lv === level) || [0, 0])[1];
  const tok = add ? walletSpend(uid, { coins: add }) : null;
  milestoneMark(uid, level, true);
  const { data, error } = await supabase.rpc('zchat_claim_milestone', { p_level: level });
  const row = Array.isArray(data) ? data[0] : data;
  const fail = error ? rpcFailText('Reward', error, 'Rewards switch on once the latest ZChat setup is finished.') : !row || !row.ok ? (row && row.reason) || 'That did not work. Try again.' : null;
  if (fail) { walletSettle(tok, { error: true }); milestoneMark(uid, level, false); return { error: fail }; }
  walletAfter(uid, tok, { coins: row.coins });
  loadMilestones(uid, true);
  return { ok: true, added: Number(row.added) || add };
}
function looksKeep(uid) {
  try { if (looksMem.uid === uid && looksMem.list && !looksMem.off) localStorage.setItem(`zchat-looks-${uid}`, JSON.stringify(looksMem.list)); } catch {}
}
function looksWarm(uid) {
  if (!uid || (looksMem.uid === uid && looksMem.list)) return;
  if (looksMem.uid !== uid) Object.assign(looksMem, { uid, list: null, job: null, mark: 0, off: false, fresh: false });
  try {
    const o = JSON.parse(localStorage.getItem(`zchat-looks-${uid}`) || 'null');
    if (Array.isArray(o)) { looksMem.list = o.filter((l) => l && l.slot >= 1 && l.slot <= 3); looksMem.off = false; }
  } catch {}
}
function loadLooks(uid, force) {
  if (!uid) return Promise.resolve([]);
  looksWarm(uid);
  if (!force && looksMem.uid === uid && looksMem.list && looksMem.fresh) return Promise.resolve(looksMem.list);
  if (looksMem.job && looksMem.uid === uid) return looksMem.job;
  looksMem.uid = uid;
  const started = Date.now();
  const job = supabase.from('saved_looks').select(`slot, name, frame, nameplate, bubble, charm, updated_at${cxFlag.on ? ', name_style, theme' : ''}`).eq('user_id', uid).order('slot', { ascending: true })
    .then(({ data, error }) => {
      if (looksMem.uid !== uid) return !error && Array.isArray(data) ? data : [];
      if (looksMem.mark > started && looksMem.list) return looksMem.list;
      if (error && looksMem.list && !looksMem.off) return looksMem.list;
      looksMem.list = !error && Array.isArray(data) ? data : [];
      looksMem.off = !!error;
      looksMem.fresh = !error;
      looksKeep(uid);
      return looksMem.list;
    }, () => { if (looksMem.uid !== uid) return []; if (!looksMem.list) { looksMem.list = []; looksMem.off = true; } return looksMem.list; })
    .then((v) => { if (looksMem.job === job) looksMem.job = null; shopPing(); return v; });
  looksMem.job = job;
  return job;
}
function useLooks(uid) {
  useShopTick();
  looksWarm(uid);
  useEffect(() => { loadLooks(uid); }, [uid]);
  const list = looksMem.uid === uid ? looksMem.list || [] : [];
  const save = async (slot, look) => {
    const row = { user_id: uid, slot, name: String(look.name || '').slice(0, 24), frame: look.frame || null, nameplate: look.nameplate || null, bubble: look.bubble || null, charm: look.charm || null, ...(cxFlag.on ? { name_style: look.name_style || null, theme: look.theme || null } : {}), updated_at: new Date().toISOString() };
    const prev = list.find((l) => l.slot === slot) || null;
    looksMem.list = [...list.filter((l) => l.slot !== slot), row].sort((a, b) => a.slot - b.slot);
    looksMem.mark = Date.now();
    looksKeep(uid);
    shopPing();
    const { error } = await supabase.from('saved_looks').upsert(row, { onConflict: 'user_id,slot' });
    if (error) {
      const now = (looksMem.list || []).filter((l) => l.slot !== slot);
      looksMem.list = (prev ? [...now, prev] : now).sort((a, b) => a.slot - b.slot);
      looksKeep(uid);
      shopPing();
      return { error: 'Looks switch on once the latest ZChat setup is finished.' };
    }
    return { ok: true };
  };
  const remove = async (slot) => {
    const prev = list.find((l) => l.slot === slot) || null;
    looksMem.list = list.filter((l) => l.slot !== slot);
    looksMem.mark = Date.now();
    looksKeep(uid);
    shopPing();
    const { error } = await supabase.from('saved_looks').delete().eq('user_id', uid).eq('slot', slot);
    if (error) {
      if (prev) { looksMem.list = [...(looksMem.list || []).filter((l) => l.slot !== slot), prev].sort((a, b) => a.slot - b.slot); looksKeep(uid); shopPing(); }
      return { error: 'Could not remove it. Try again.' };
    }
    return { ok: true };
  };
  return { list, save, remove, off: looksMem.uid === uid && !!looksMem.off };
}

function CollProgress({ stats, ms, onClaim, busy }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  const claimed = new Set((ms && ms.claimed) || []);
  const count = ms && !ms.off ? Math.max(ms.count, stats.owned) : stats.owned;
  const next = MILESTONES.find(([lv]) => !claimed.has(lv)) || null;
  const ready = next && count >= next[0];
  const prevLv = next ? (MILESTONES[MILESTONES.indexOf(next) - 1] || [0])[0] : 0;
  const frac = next ? Math.max(0, Math.min(1, (count - prevLv) / (next[0] - prevLv))) : 1;
  const cats = [['Sets', DECOR_ALL.filter((s) => stats.frames.has(s.key) || stats.plates.has(s.key) || stats.effects.has(s.key)).length, DECOR_ALL.length], ['Effects', stats.effects.size, DECOR_ALL.length], ['Bubbles', stats.bubbles.size, CHAR_BUBBLE_KEYS.length], ['Charms', stats.charms.size, Object.keys(CUSTOM_BADGES).length], ...(cxFlag.on ? [['Styles', stats.styles.size + stats.themes.size + stats.supers.size, NS_KEYS.length + THEME_KEYS.length + SUPER_KEYS.length - SUPER_FREE.length]] : [])];
  return (
    <div style={{ marginTop: 6, borderRadius: 22, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}`, padding: '16px 16px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
          <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
            <circle cx="38" cy="38" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle cx="38" cy="38" r={R} fill="none" stroke="url(#zcollring)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(C * stats.pct) / 100} ${C}`} transform="rotate(-90 38 38)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            <defs><linearGradient id="zcollring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A78BFF" /><stop offset="1" stopColor="#6B48F0" /></linearGradient></defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 750, color: CL.ink, fontVariantNumeric: 'tabular-nums' }}>{stats.pct}%</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: CL.ink }}>{stats.pct}% collected</div>
          <div style={{ fontSize: 13, color: CL.ink2, marginTop: 2 }}>{formatCount(stats.owned)} of {formatCount(stats.total)} items are yours</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', columnGap: 12, rowGap: 3, marginTop: 8 }}>
            {cats.map(([l, n, t]) => (
              <div key={l} style={{ fontSize: 12, color: CL.ink3, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}><span style={{ color: CL.ink2, fontWeight: 600 }}>{l}</span> {n} of {t}</div>
            ))}
          </div>
        </div>
      </div>
      {next && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${CL.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: CL.ink2 }}>{ready ? `You reached ${next[0]} items` : `Collect ${next[0]} items to get ${next[1]} coins`}</div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 7, overflow: 'hidden' }}><div style={{ height: '100%', width: `${frac * 100}%`, borderRadius: 3, background: ready ? CL.gold : CL.accent, transition: 'width 0.5s ease' }} /></div>
          </div>
          {ready && onClaim && ms && (
            <button type="button" disabled={busy} onClick={() => onClaim(next[0])} aria-label={`Claim ${next[1]} coins`} className="zchat-press"
              style={{ height: 36, padding: '0 14px', borderRadius: 18, border: 'none', background: CL.gold, color: '#2A1C00', fontFamily: FONT, fontSize: 14, fontWeight: 750, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: busy ? 0.6 : 1 }}><CoinIcon size={16} />Claim {next[1]}</button>
          )}
        </div>
      )}
    </div>
  );
}
function CxSampleChat({ k, me, auto = true }) {
  const stage = useRef(null);
  const cv = useRef(null);
  const bub = useRef(null);
  const [hint, setHint] = useState(false);
  const play = () => {
    if (!cv.current || !stage.current || !bub.current || reducedMotion()) return;
    superPack().then((ok) => {
      if (!ok || !window.ZSRX || !cv.current || !stage.current || !bub.current) return;
      const s = stage.current.getBoundingClientRect();
      const b = bub.current.getBoundingClientRect();
      try { window.ZSRX.play(cv.current, k, { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height / 2, tx: b.left - s.left + 22, ty: b.bottom - s.top + 2, el: bub.current, dark: true, solo: true, dprCap: superDpr() }); } catch {}
      setHint(true);
    });
  };
  useEffect(() => {
    if (!auto) return undefined;
    const t = setTimeout(play, 380);
    return () => { clearTimeout(t); try { if (window.ZSRX && cv.current) { window.ZSRX.stop(cv.current); if (window.ZSRX.drop) window.ZSRX.drop(cv.current); } } catch {} };
  }, [k]);
  const spec = SUPER_REACTS[k];
  return (
    <div ref={stage} role="button" aria-label={`Play ${spec ? spec.label : 'the super reaction'}`} onClick={() => { hapticTap(); play(); }}
      style={{ position: 'relative', height: 236, borderRadius: 20, overflow: 'hidden', background: '#0F0F13', boxShadow: `inset 0 0 0 1px ${CL.line}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 14px 30px' }}>
      <div style={{ alignSelf: 'flex-start', maxWidth: '74%', background: '#26262E', color: CL.ink, borderRadius: 18, borderBottomLeftRadius: 5, padding: '8px 13px', fontSize: 14.5, lineHeight: 1.3 }}>I passed my driving test</div>
      <div ref={bub} style={{ position: 'relative', alignSelf: 'flex-end', marginTop: 6, maxWidth: '74%', background: '#1D7BF0', color: '#FFFFFF', borderRadius: 18, borderBottomRightRadius: 5, padding: '8px 13px', fontSize: 14.5, lineHeight: 1.3 }}>
        No way, well done
        <span style={{ position: 'absolute', bottom: -12, left: 8, padding: '1px 6px', borderRadius: 10, background: '#1E1E25', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', fontSize: 10.5 }}>{spec && <SuperMark k={k} emoji={spec.base} count={1} />}</span>
      </div>
      <canvas ref={cv} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 12, textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: CL.ink3, opacity: hint ? 1 : 0, transition: 'opacity 0.3s ease' }}>Tap to play it again</div>
    </div>
  );
}
export function CxItemSheet({ me, item, rewards, wallet, onClose, onDone, onOpenWallet, onGift, onEquip, onPreviewTheme }) {
  useBackClose(true, onClose);
  const wish = useWishlist(me.id);
  const deal = useDeal();
  const [ask, setAsk] = useState(false);
  const [err, setErr] = useState('');
  const drag = useSheetDrag(onClose);
  const { kind, key } = item;
  const spec = cxSpec(kind, key);
  if (!spec) return null;
  const isFree = kind === 'reaction' && !!spec.free;
  const owned = cxOwns(rewards, kind, key, false);
  const forever = cxOwns(rewards, kind, key, true);
  const rw = (rewards || []).find((r) => r.kind === kind && r.reward_key === key && rewardActive(r)) || null;
  const left = !isFree && owned && !forever ? daysLeft(rw) : null;
  const wearing = kind === 'namestyle' ? me.name_style === key : kind === 'theme' ? me.profile_theme === key : false;
  const dealOn = !!(deal && deal.kind === kind && deal.key === key) && !forever;
  const full = shopPrice(kind, key) || 0;
  const price = dealOn ? deal.price : full;
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const wished = wish.has(kind, key);
  const title = `${spec.label} ${cxWord(kind)}`;
  const buy = async () => {
    setAsk(false);
    if (!(await spendGate(`Get the ${title} for ${price} coins`, { coins: price }))) return;
    setErr('');
    hapticTap();
    playUiSound('like');
    if (onDone) onDone(`${title} is yours`, moneyRun(me.id, { coins: price, grants: [[kind, key]], run: () => (dealOn ? buyDeal(kind, key) : buyShopItem(kind, key)) }));
  };
  const tapGet = () => {
    if (!wallet || !wallet.ready) { setErr('The Shop switches on once the latest ZChat setup is finished.'); return; }
    if (coins < price) { if (onOpenWallet) onOpenWallet(); return; }
    setAsk(true);
  };
  const wear = () => {
    if (!onEquip) return;
    hapticTap();
    onEquip(kind, wearing ? null : key);
    onClose();
  };
  const label = forever && kind === 'reaction' ? 'Yours to send' : owned && kind !== 'reaction' ? (wearing ? 'Take it off' : kind === 'theme' ? 'Use this theme' : 'Use this name style') : coins >= price ? `Get it for ${formatCount(price)} coins` : `You need ${moreCoinsText(price - coins)}`;
  const canTap = owned ? kind !== 'reaction' && !!onEquip : true;
  const meName = (me && (me.name || me.username)) || 'You';
  const panel = (dark) => (
    <div style={{ borderRadius: 16, background: dark ? '#0C0C0E' : '#FFFFFF', padding: '16px 14px 14px', boxShadow: dark ? `inset 0 0 0 1px ${CL.line}` : 'none', minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: dark ? '#F4F4F6' : '#111113', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...NS_ROOM }}><StyledName name={meName} k={key} dark={dark} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 12 }}>
        <Avatar emoji={me.avatar} name={meName} size={28} />
        <div style={{ minWidth: 0, fontSize: 15, fontWeight: 700, color: dark ? '#F4F4F6' : '#111113', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...NS_ROOM }}><StyledName name={meName} k={key} dark={dark} /></div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, fontWeight: 700, color: dark ? '#6FB0F7' : '#1564C9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '40%', ...NS_ROOM }}><StyledName name={meName} k={key} dark={dark} sub /></div>
      </div>
    </div>
  );
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 520, maxHeight: '92%', overflowY: 'auto', background: '#16161B', color: CL.ink, borderRadius: '26px 26px 0 0', padding: '8px 18px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))', boxShadow: '0 -12px 40px rgba(0,0,0,0.45)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 6px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isFree ? <span style={{ fontSize: 12, fontWeight: 650, color: CL.gold }}>Free for everyone</span> : <RarityTag rarity={spec.rarity} size={12} />}
              <div style={{ fontSize: 21, fontWeight: 700, marginTop: 3, letterSpacing: '-0.01em' }}>{title}</div>
            </div>
            {!owned && !isFree && <WishHeart on={wished} light onToggle={async () => { const r = await wish.toggle(kind, key); if (r.error) setErr(r.error); }} />}
          </div>
          <div style={{ marginTop: 14 }}>
            {kind === 'namestyle' && <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{panel(true)}{panel(false)}</div>}
            {kind === 'theme' && (
              <div role="button" aria-label="See the full preview" onClick={() => { hapticTap(); if (onPreviewTheme) onPreviewTheme(key); }} style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', height: 250, background: '#0C0C0E' }}>
                <div style={{ position: 'absolute', inset: 0, background: themeFallback(key, true), WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)' }}>
                  <ThemeCanvas k={key} dark still={reducedMotion()} />
                </div>
                <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ borderRadius: '50%', boxShadow: '0 0 0 3px #0C0C0E', flexShrink: 0 }}><Avatar emoji={me.avatar} name={meName} size={56} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...(cxNs(me) ? NS_ROOM : null) }}>{cxNs(me) ? <StyledName name={meName} k={cxNs(me)} dark /> : meName}</div>
                    <div style={{ fontSize: 13, color: CL.ink2 }}>@{me.username || 'you'}</div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 32, padding: '0 12px', borderRadius: 16, background: 'rgba(255,255,255,0.14)', fontSize: 13, fontWeight: 650, flexShrink: 0 }}><Play size={12} fill="#FFFFFF" strokeWidth={0} />Full preview</div>
                </div>
              </div>
            )}
            {kind === 'reaction' && <CxSampleChat k={key} me={me} />}
          </div>
          <div style={{ fontSize: 13.5, color: CL.ink2, lineHeight: 1.45, marginTop: 12, textWrap: 'pretty' }}>
            {spec.about}{' '}
            {kind === 'namestyle' ? 'It shows on your profile, in chats and on Vibes. Everyone sees it.' : kind === 'theme' ? 'It sits behind your profile and everyone who visits sees it.' : isFree || forever ? 'Hold any message and pick it from the top row.' : 'Hold any message and send it from the top row. It plays for both of you.'}
            {left != null ? ` Yours for ${left} more ${left === 1 ? 'day' : 'days'}.` : ''}
            {dealOn ? ' Deal of the day, only today.' : ''}
          </div>
          {forever && !isFree && <EditionLine n={editionOf(rewards, kind, key)} style={{ marginTop: 10 }} />}
          {err && <div role="alert" style={{ fontSize: 13.5, color: '#FF8A8A', fontWeight: 600, marginTop: 10 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {onGift && !isFree && <div role="button" aria-label={`Gift the ${title}`} onClick={() => { hapticTap(); onGift(kind, key); }} className="zchat-press" style={{ width: 52, height: 52, borderRadius: 15, background: CL.card2, color: CL.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><GiftBoxIcon size={21} /></div>}
            <button type="button" disabled={!canTap} onClick={owned ? wear : tapGet} aria-label={label} className="zchat-press"
              style={{ flex: 1, height: 52, borderRadius: 15, border: 'none', fontFamily: FONT, fontSize: 16, fontWeight: 650, cursor: canTap ? 'pointer' : 'default', background: owned ? (kind === 'reaction' || !onEquip ? 'rgba(61,214,140,0.14)' : wearing ? CL.card2 : CL.accent) : coins >= price ? CL.accent : CL.card2, color: owned && (kind === 'reaction' || !onEquip) ? CL.own : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {owned && !onEquip && kind !== 'reaction' ? 'Yours' : label}
              {dealOn && !owned && <span style={{ fontSize: 13.5, fontWeight: 500, opacity: 0.6, textDecoration: 'line-through' }}>{full}</span>}
            </button>
          </div>
        </div>
      </div>
      {ask && <ConfirmSheet title={`Get the ${title}?`} text={`It costs ${formatCount(price)} coins and it is yours to keep.`} confirmLabel={`Pay ${formatCount(price)} coins`} danger={false} zIndex={760} onCancel={() => setAsk(false)} onConfirm={buy} />}
    </Portal>
  );
}
function SiBuyFlow({ me, kind, k, price, wallet, onOpenWallet, flash, onRefresh, onDone, children }) {
  const [ask, setAsk] = useState(false);
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const name = shopItemName(kind, k);
  const tap = () => {
    if (!wallet || !wallet.ready) { flash('The Shop switches on once the latest ZChat setup is finished.'); return; }
    if (coins < price) { if (onOpenWallet) onOpenWallet(); return; }
    setAsk(true);
  };
  const buy = async () => {
    setAsk(false);
    if (!(await spendGate(`Get the ${name} ${shopKindWord(kind)} for ${price} coins`, { coins: price }))) return;
    hapticTap();
    playUiSound('like');
    flash(`${name} is yours`);
    const job = moneyRun(me.id, { coins: price, grants: [[kind, k]], run: () => buyShopItem(kind, k) });
    if (onDone) onDone(job);
    job.then((r) => { if (r.error) { flash(r.error); return; } if (onRefresh) onRefresh(); });
  };
  return (
    <>
      {children(tap, coins)}
      {ask && <ConfirmSheet title={`Get the ${name}?`} text={`It costs ${formatCount(price)} coins and you have ${formatCount(coins)}. It is yours to keep.`} confirmLabel={`Pay ${formatCount(price)} coins`} danger={false} zIndex={760} onCancel={() => setAsk(false)} onConfirm={buy} />}
    </>
  );
}
export function SiItemPage({ me, item, items = null, onPick, rewards, wallet, onClose, onOpenWallet, onGift, onRefresh }) {
  useBackClose(true, onClose);
  const wish = useWishlist(me.id);
  const owners = useShopOwners(item.kind, item.key);
  const [note, setNote] = useState('');
  const [party, setParty] = useState(0);
  const [dark, setDark] = useState(true);
  const [typingMine, setTypingMine] = useState(() => typingStyleMine(me.id));
  const [, setTick] = useState(0);
  const noteTimer = useRef(0);
  const flash = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2600); };
  useMoneyToast(flash);
  useEffect(() => () => clearTimeout(noteTimer.current), []);
  const { kind, key } = item;
  const spec = siSpec(kind, key);
  if (!spec) return null;
  const name = spec.label;
  const word = siWord(kind);
  const accent = siAccent(kind, key);
  const owned = siOwns(rewards, kind, key);
  const price = spec.price;
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const wished = wish.has(kind, key);
  const order = items && items.length > 1 ? items : null;
  const idx = order ? order.findIndex((it) => it.kind === kind && it.key === key) : -1;
  const go = (d) => { if (!order || !onPick) return; hapticTap(); onPick(order[(idx + d + order.length) % order.length]); };
  const btn = (primary) => ({ height: 52, borderRadius: 15, border: 'none', fontFamily: FONT, fontWeight: 650, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 18px', width: '100%', background: primary ? CL.accent : CL.card2, color: '#FFFFFF' });
  const useTyping = (k) => { setTypingStyleMine(me.id, k); setTypingMine(k); hapticTap(); playUiSound(k ? 'like' : 'tap'); flash(k ? `${name} is on. Friends see it while you type.` : 'Back to the plain dots'); };
  const stage = kind === 'stickerpack' ? <SiStickerStage k={key} dark={dark} me={me} />
    : kind === 'soundpack' ? <SiSoundStage k={key} dark={dark} owned={owned} onUsed={(t) => { flash(t); setTick((n) => n + 1); }} />
    : <SiTypingStage k={key} me={me} dark={dark} />;
  const caption = kind === 'stickerpack' ? 'All 12 stickers, moving like they do in chats' : kind === 'soundpack' ? 'Tap a sound to hear it' : 'How a friend sees you typing';
  const about = kind === 'soundpack' ? `${spec.about} Tones play while ZChat is open on your screen. When ZChat is closed or in the background, your phone uses its own sounds.` : kind === 'stickerpack' ? `${spec.about} They show up in your sticker picker, and everyone you send them to sees them move.` : `${spec.about} Only the name of the style travels with your typing signal, so it adds almost no data.`;
  const wearingTyping = kind === 'typing' && typingMine === key;
  const label = owned ? (kind === 'typing' ? (wearingTyping ? 'In use' : 'Use this typing style') : kind === 'stickerpack' ? 'In your sticker picker' : 'Yours to use') : coins >= price ? `Get it for ${formatCount(price)} coins` : `You need ${moreCoinsText(price - coins)}`;
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 645, background: `linear-gradient(180deg, ${accent}30 0%, ${accent}0D 26%, rgba(11,11,15,0) 50%), ${CL.bg}`, color: CL.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {party > 0 && <DecorConfetti key={party} colors={[accent, '#FFFFFF', '#FFD66B', '#7C5CFC']} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px 4px', paddingTop: 'calc(10px + env(safe-area-inset-top))' }}>
        <div role="button" aria-label="Back" onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><ArrowLeft size={19} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${name} ${word}`}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap' }}>
            <span style={{ flexShrink: 0, display: 'inline-flex' }}><RarityTag rarity={spec.rarity} size={12.5} /></span>
            {owners != null && owners > 0 && <span style={{ color: CL.ink2, fontWeight: 500, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>{formatCount(owners)} {owners === 1 ? 'has' : 'have'} it</span>}
          </div>
        </div>
        {!owned && <WishHeart on={wished} onToggle={async () => { flash(wished ? 'Removed from your wishlist' : 'Added to your wishlist'); const r = await wish.toggle(kind, key); if (r.error) flash(r.error); }} />}
        <ShopPagePill coins={coins} onOpenWallet={onOpenWallet} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 14px calc(24px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div key={`${kind}:${key}`} className="zchat-pop" style={{ paddingTop: 8 }}>{stage}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, minHeight: 32 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: CL.ink3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{caption}</div>
            {order && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, marginRight: 2 }}>
                <div role="button" aria-label={`Previous item, ${idx + 1} of ${order.length}`} onClick={() => go(-1)} style={{ width: 32, height: 32, borderRadius: 16, background: CL.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: CL.ink }}><ChevronLeft size={18} /></div>
                <div role="button" aria-label="Next item" onClick={() => go(1)} style={{ width: 32, height: 32, borderRadius: 16, background: CL.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: CL.ink }}><ChevronRight size={18} /></div>
              </div>
            )}
            {kind !== 'soundpack' && <ShopDayNight dark={dark} onChange={setDark} />}
          </div>
          <div style={{ marginTop: 14, borderRadius: 18, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}`, padding: '14px 14px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                <div style={{ fontSize: 12.5, color: CL.ink2, marginTop: 2 }}>{word[0].toUpperCase() + word.slice(1)}</div>
              </div>
              {owned ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 650, color: CL.own }}><Check size={16} strokeWidth={2.6} />Owned</span> : <CollPrice price={price} size={17} />}
            </div>
            <div style={{ fontSize: 13.5, color: CL.ink2, lineHeight: 1.5, marginTop: 10, textWrap: 'pretty' }}>{about}</div>
          </div>
          <SiBuyFlow me={me} kind={kind} k={key} price={price} wallet={wallet} onOpenWallet={onOpenWallet} flash={flash} onRefresh={onRefresh}
            onDone={(job) => { setParty(Date.now()); if (kind === 'typing') { const was = typingStyleMine(me.id); setTypingStyleMine(me.id, key); setTypingMine(key); job.then((r) => { if (r.error && typingStyleMine(me.id) === key) { setTypingStyleMine(me.id, was); setTypingMine(was); } }); } }}>
            {(tap) => {
              const primaryOn = owned ? kind === 'typing' && !wearingTyping : true;
              return (
                <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button type="button" disabled={!primaryOn} onClick={owned ? () => useTyping(key) : tap} aria-label={label} className="zchat-press"
                    style={{ ...btn(primaryOn), cursor: primaryOn ? 'pointer' : 'default', background: !primaryOn ? 'rgba(61,214,140,0.14)' : owned || coins >= price ? CL.accent : CL.card2, color: !primaryOn ? CL.own : '#FFFFFF' }}>
                    {!primaryOn && <Check size={18} strokeWidth={3} />}{label}
                  </button>
                  {wearingTyping && <button type="button" onClick={() => useTyping(null)} className="zchat-press" style={{ ...btn(false), height: 44, fontSize: 14.5 }}>Take it off</button>}
                  {onGift && <button type="button" onClick={() => { hapticTap(); onGift(kind, key); }} aria-label={`Send the ${name} ${word} as a gift`} className="zchat-press" style={{ ...btn(false), height: 44, fontSize: 14.5 }}><GiftBoxIcon size={18} />Send as a gift</button>}
                </div>
              );
            }}
          </SiBuyFlow>
          <div style={{ fontSize: 13, color: CL.ink3, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
            {owned ? (kind === 'stickerpack' ? 'Yours to keep. Open stickers in any chat to send them.' : kind === 'soundpack' ? 'Yours to keep. Pick them in Settings, Notifications, or in any chat.' : 'Yours to keep. Switch it any time from your Collection.') : 'Yours to keep once you get it.'}
          </div>
        </div>
      </div>
      {note && <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', top: 'calc(64px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 40, padding: '9px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.95)', color: '#111', fontSize: 13.5, fontWeight: 700, width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', textAlign: 'center' }}>{note}</div>}
    </div>
  );
}
function SiStickerStage({ k, dark, me }) {
  const T = THEMES[dark ? 'dark' : 'light'];
  const pack = SI_STICKER_BY[k];
  return (
    <div style={{ borderRadius: 20, background: dark ? '#0C0C0E' : '#FFFFFF', boxShadow: dark ? `inset 0 0 0 1px ${CL.line}` : 'none', padding: 12, color: T.ink }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
        {pack.list.map(([id, label]) => (
          <div key={id} style={{ aspectRatio: '1 / 1', borderRadius: 14, background: dark ? 'rgba(255,255,255,0.05)' : '#F4F3F8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`/ps-${k}-${id}.webp`} alt={label} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: '90%', height: '90%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
function SiTypingStage({ k, me, dark }) {
  const T = THEMES[dark ? 'dark' : 'light'];
  const page = dark ? '#0C0C0E' : '#FFFFFF';
  const first = String((me && me.name) || 'You').split(' ')[0];
  const t = fmtHM(new Date());
  return (
    <div style={{ borderRadius: 20, background: page, boxShadow: dark ? `inset 0 0 0 1px ${CL.line}` : 'none', overflow: 'hidden', color: T.ink, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: `1px solid ${T.hair}` }}>
        <ArrowLeft size={18} color={T.ink} style={{ flexShrink: 0 }} />
        <Avatar emoji={me.avatar} name={me.name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name || 'You'}</div>
          <div style={{ fontSize: 12, color: dark ? '#6FB0F7' : '#1564C9', fontWeight: 600 }}>typing</div>
        </div>
        <Phone size={18} color={T.ink} style={{ flexShrink: 0 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 14px', minHeight: 190, justifyContent: 'flex-end' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '78%', background: T.bubbleMe, color: dark ? '#FFFFFF' : T.ink, borderRadius: 18, borderBottomRightRadius: 6, padding: '8px 12px 7px', fontSize: 14.5, lineHeight: 1.3 }}>{`Are you coming tonight, ${first}?`}<span style={{ fontSize: 10.5, marginLeft: 8, opacity: 0.72 }}>{t}</span></div>
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-end', gap: 7 }}>
          <Avatar emoji={me.avatar} name={me.name} size={26} />
          <TypingStyleBubble k={k} who={me} dark={dark} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 12px' }}>
        <div style={{ flex: 1, height: 38, borderRadius: 19, background: T.inputBg, display: 'flex', alignItems: 'center', padding: '0 14px', fontSize: 14, color: T.muted }}>Message</div>
        <div style={{ width: 38, height: 38, borderRadius: 19, background: '#1D7BF0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={16} color="#FFFFFF" /></div>
      </div>
    </div>
  );
}
function OwnSeg({ items, value, onChange, theme, track, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', padding: 3, borderRadius: 12, background: track || theme.bgGradient, flexShrink: 0 }}>
      {items.map(([k, l]) => <div key={l} role="radio" aria-checked={value === k} aria-label={l} onClick={() => { if (value !== k) { hapticTap(); onChange(k); } }} style={{ flex: 1, minWidth: 0, height: 30, padding: '0 12px', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 650, cursor: 'pointer', background: value === k ? (track ? theme.bgGradient : theme.soft2) : 'transparent', color: value === k ? theme.ink : theme.muted, whiteSpace: 'nowrap', boxShadow: value === k && track ? '0 1px 3px rgba(0,0,0,0.12)' : 'none' }}>{l}</div>)}
    </div>
  );
}
export function OwnStylePage({ me, rewards, wallet, onClose, onOpenWallet, onEquip, onRefresh, onGift }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const start = nsOwn(me.name_style) ? me.name_style : nsOwnSaved() || NS_OWN_SAMPLE;
  const s0 = nsOwn(start);
  const [cols, setCols] = useState(() => s0.cols.slice());
  const [slot, setSlot] = useState(0);
  const [motion, setMotion] = useState(s0.motion);
  const [weight, setWeight] = useState(s0.weight);
  const [dark, setDark] = useState(!!theme.dark);
  const [view, setView] = useState('profile');
  const [note, setNote] = useState('');
  const boxRef = useRef(null);
  const colorRef = useRef(null);
  const noteTimer = useRef(0);
  const bw = useWidthOf(boxRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 560));
  const flash = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2600); };
  useMoneyToast(flash);
  useEffect(() => () => clearTimeout(noteTimer.current), []);
  const colorOk = useMemo(() => { try { const i = document.createElement('input'); i.type = 'color'; return i.type === 'color'; } catch { return false; } }, []);
  const owned = cxOwns(rewards, 'namestyle', 'own', true);
  const spec = nsOwnKey(cols, motion, weight) || NS_OWN_SAMPLE;
  const wearing = me.name_style === spec;
  const first = String(me.name || 'You').split(' ')[0];
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const W = Math.min(bw, 520) - 32;
  const link = kitOnInk(theme);
  const setCol = (i, c) => { hapticTap(); setCols((prev) => { const n = prev.slice(); n[i] = c.toUpperCase(); return n; }); };
  const save = (key, gate) => {
    try { localStorage.setItem('zchat-own-style', key); } catch {}
    if (onEquip) onEquip('namestyle', key, gate);
  };
  const wear = () => { save(spec); hapticTap(); playUiSound('like'); flash(wearing ? 'Saved' : 'Your own style is on your name'); };
  const ring = (on) => (on ? `0 0 0 2.5px ${theme.soft}, 0 0 0 4.5px ${theme.ink}` : `inset 0 0 0 1px ${theme.hair}`);
  const swatch = (c, on, label, onTap) => (
    <div key={label} role="button" aria-label={label} aria-pressed={on} onClick={onTap} style={{ width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0, boxShadow: ring(on), transition: 'box-shadow 160ms ease' }} />
  );
  const head = (t, right) => <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: theme.ink, margin: '18px 2px 10px' }}><span style={{ flex: 1 }}>{t}</span>{right}</div>;
  const bigBtn = (primary) => ({ height: 48, borderRadius: 14, border: 'none', fontFamily: FONT, fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 20px', minWidth: 120, background: primary ? theme.coral : theme.soft, color: primary ? '#FFFFFF' : theme.ink, whiteSpace: 'nowrap' });
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 645, background: theme.bgGradient, color: theme.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56, padding: '0 12px 0 6px', maxWidth: 560, margin: '0 auto' }}>
          <div role="button" aria-label="Back" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink, flexShrink: 0 }}><ArrowLeft size={24} strokeWidth={2} /></div>
          <div style={{ flex: 1 }} />
          <div role="button" aria-label={`${formatCount(coins)} coins, open your coins`} onClick={onOpenWallet} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 13px 0 9px', borderRadius: 18, background: theme.soft, color: theme.ink, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={20} />{formatCount(coins)}</div>
        </div>
      </div>
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 16px 28px' }}>
        <div style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ borderRadius: 24, background: theme.soft, padding: 12 }}>
            {view === 'chat'
              ? <ShopChatMock me={me} dark={dark} group nsKey={spec} charm={me.custom_badge} />
              : <ShopProfileMock me={me} frameKey={me.avatar_frame} plateKey={me.nameplate} charm={me.custom_badge} nsKey={spec} width={W} dark={dark} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <OwnSeg theme={theme} track={theme.soft} label="Preview in light or dark" items={[[false, 'Light'], [true, 'Dark']]} value={dark} onChange={setDark} />
            <OwnSeg theme={theme} track={theme.soft} label="Preview on your profile or in a chat" items={[['profile', 'Profile'], ['chat', 'Chat']]} value={view} onChange={setView} />
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.muted }}>Name style · <span style={{ color: theme.dark ? '#F5B829' : '#9A6300' }}>Legendary</span></div>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: theme.ink }}>Your own style</h1>
            <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: theme.muted, textWrap: 'pretty' }}>{NS_OWN_ITEM.about}</p>
          </div>
          <div style={{ marginTop: 18, borderRadius: 18, background: theme.soft, padding: '2px 14px 16px' }}>
            {head('Colours', cols.length < 3
              ? <span role="button" aria-label="Add a third colour" onClick={() => { hapticTap(); setCols((p) => [...p, mixHex(p[0], p[1], 0.5).toUpperCase()]); setSlot(2); }} style={{ fontSize: 13.5, fontWeight: 650, color: link, cursor: 'pointer' }}>Add a third</span>
              : <span role="button" aria-label="Remove the third colour" onClick={() => { hapticTap(); setCols((p) => p.slice(0, 2)); setSlot((x) => Math.min(x, 1)); }} style={{ fontSize: 13.5, fontWeight: 650, color: theme.muted, cursor: 'pointer' }}>Use two</span>)}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {cols.map((c, i) => (
                <div key={i} role="button" aria-label={`Colour ${i + 1}`} aria-pressed={slot === i} onClick={() => { hapticTap(); setSlot(i); }} style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 12, background: c, cursor: 'pointer', boxShadow: ring(slot === i), display: 'flex', alignItems: 'flex-end', padding: '0 8px 5px', boxSizing: 'border-box', transition: 'box-shadow 160ms ease' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: relLuminance(c) > 0.45 ? '#111' : '#FFF', fontVariantNumeric: 'tabular-nums' }}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
              {NS_OWN_SWATCHES.map((c) => swatch(c, cols[slot] === c, `Use colour ${c}`, () => setCol(slot, c)))}
              {colorOk && (
                <label aria-label="Pick any colour" style={{ position: 'relative', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', flexShrink: 0, background: 'conic-gradient(#FF5E62, #FFD36B, #38EF7D, #00B4DB, #7C5CFC, #D63AA3, #FF5E62)', boxShadow: `inset 0 0 0 1px ${theme.hair}` }}>
                  <input ref={colorRef} type="color" value={cols[slot].toLowerCase()} onChange={(e) => setCol(slot, e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer', border: 0, padding: 0 }} />
                </label>
              )}
            </div>
            {head('Ready made')}
            <div className="zshop-row" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -14px', padding: '0 14px 2px', scrollbarWidth: 'none' }}>
              {NS_OWN_PRESETS.map(([label, pc]) => {
                const key = nsOwnKey(pc, motion, weight);
                const on = pc.every((c, i) => cols[i] && cols[i].toUpperCase() === c.toUpperCase()) && cols.length === pc.length;
                return (
                  <div key={label} role="button" aria-label={`Ready made colours ${label}`} aria-pressed={on} onClick={() => { hapticTap(); setCols(pc.map((c) => c.toUpperCase())); setSlot(0); }} className="zchat-press"
                    style={{ flex: '0 0 92px', borderRadius: 14, padding: '10px 8px 8px', background: theme.bgGradient, cursor: 'pointer', boxShadow: on ? `inset 0 0 0 2px ${theme.ink}` : 'none', minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', ...NS_ROOM }}><StyledName name={first} k={key} dark={!!theme.dark} sub /></div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.muted, textAlign: 'center', marginTop: 4 }}>{label}</div>
                  </div>
                );
              })}
            </div>
            {head('Motion')}
            <OwnSeg theme={theme} label="Motion" items={NS_OWN_MOTIONS} value={motion} onChange={setMotion} />
            {head('Weight')}
            <OwnSeg theme={theme} label="Weight" items={NS_OWN_WEIGHTS} value={weight} onChange={setWeight} />
          </div>
          <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>{owned ? 'Yours to keep. Changing colours, motion or weight is free.' : 'Pay once and it is yours to keep. Changing it later is free.'}</div>
        </div>
      </div>
      <SiBuyFlow me={me} kind="namestyle" k="own" price={NS_OWN_ITEM.price} wallet={wallet} onOpenWallet={onOpenWallet} flash={flash} onRefresh={onRefresh}
        onDone={(job) => { save(spec, job); }}>
        {(tap) => (
          <div style={{ flexShrink: 0, padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.hair}`, background: theme.bgGradient }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 520, margin: '0 auto' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {owned ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: wearing ? link : theme.ink }}>{wearing ? 'On your name' : 'Owned'}</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 3 }}>Changes are free</div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 19, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={21} />{formatCount(NS_OWN_ITEM.price)}</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{coins >= NS_OWN_ITEM.price ? `You have ${formatCount(coins)}` : `You need ${moreCoinsText(NS_OWN_ITEM.price - coins)}`}</div>
                  </>
                )}
              </div>
              {onGift && <div role="button" aria-label="Send your own name style as a gift" onClick={() => { hapticTap(); onGift('namestyle', 'own'); }} className="zchat-press" style={{ width: 48, height: 48, borderRadius: 24, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><GiftBoxIcon size={21} /></div>}
              {owned && wearing
                ? <button type="button" onClick={() => { hapticTap(); if (onEquip) onEquip('namestyle', null); flash('Taken off'); }} className="zchat-press" style={bigBtn(false)}>Take off</button>
                : owned
                  ? <button type="button" onClick={wear} className="zchat-press" style={bigBtn(true)}>{nsOwn(me.name_style) ? 'Save' : 'Equip'}</button>
                  : <button type="button" onClick={tap} className="zchat-press" style={bigBtn(true)}>{coins >= NS_OWN_ITEM.price ? 'Buy' : 'Get coins'}</button>}
            </div>
          </div>
        )}
      </SiBuyFlow>
      {note && <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', top: 'calc(64px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 40, padding: '10px 16px', borderRadius: 14, background: theme.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none' }}>{note}</div>}
    </div>
  );
}

function LookSlot({ look, slot, me, current, onApply, onSave, onMenu }) {
  if (!look) {
    return (
      <div role="button" aria-label={`Save what you wear as look ${slot}`} onClick={onSave} className="zchat-press"
        style={{ minWidth: 0, height: 128, borderRadius: 18, border: `1.5px dashed rgba(235,235,245,0.22)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: CL.ink2 }}>
        <Plus size={20} />
        <div style={{ fontSize: 12.5, fontWeight: 600, textAlign: 'center', lineHeight: 1.3, padding: '0 6px' }}>Save what you wear</div>
      </div>
    );
  }
  const frameKey = isDecorKey(look.frame) ? look.frame : null;
  return (
    <div role="button" aria-label={`Wear ${look.name || `look ${slot}`}`} onClick={onApply} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, height: 128, borderRadius: 18, background: CL.card, boxShadow: `inset 0 0 0 ${current ? 2 : 1}px ${current ? CL.accent : CL.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', padding: '8px 6px' }}>
      {frameKey ? <DecorFrameBadge setKey={frameKey} size={62} photo={me.avatar} name={me.name} lazy /> : <Avatar emoji={me.avatar} name={me.name} size={50} />}
      <div style={{ maxWidth: '100%', fontSize: 12.5, fontWeight: 650, color: current ? '#6FB0F7' : CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>{current ? 'Wearing' : look.name || `Look ${slot}`}</div>
      <div role="button" aria-label={`Options for ${look.name || `look ${slot}`}`} onClick={(e) => { e.stopPropagation(); onMenu(); }} style={{ position: 'absolute', top: 4, right: 4, width: 30, height: 30, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink2, cursor: 'pointer' }}><MoreVertical size={16} /></div>
    </div>
  );
}

function LookMenuSheet({ look, slot, onClose, onUpdate, onRename, onRemove }) {
  useBackClose(true, onClose);
  const [name, setName] = useState(look.name || `Look ${slot}`);
  const drag = useSheetDrag(onClose);
  const row = (icon, label, fn, danger) => (
    <div role="button" aria-label={label} onClick={fn} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 52, padding: '0 6px', borderRadius: 12, cursor: 'pointer', color: danger ? '#FF8A8A' : CL.ink, fontSize: 15.5, fontWeight: 600 }}>{icon}{label}</div>
  );
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 720, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 520, background: '#16161B', color: CL.ink, borderRadius: '26px 26px 0 0', padding: '8px 16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0 0 10px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 4px 10px' }}>
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} aria-label="Look name" placeholder={`Look ${slot}`}
              style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 14, border: 'none', outline: 'none', background: CL.card2, color: CL.ink, padding: '0 14px', fontFamily: FONT, fontSize: 16 }} />
            <button type="button" onClick={() => onRename(name.trim() || `Look ${slot}`)} className="zchat-press" style={{ height: 46, padding: '0 16px', borderRadius: 14, border: 'none', background: CL.accent, color: '#FFFFFF', fontFamily: FONT, fontSize: 15, fontWeight: 650, cursor: 'pointer' }}>Save name</button>
          </div>
          {row(<Repeat size={19} />, 'Replace with what I wear now', onUpdate)}
          {row(<Trash2 size={19} />, 'Remove this look', onRemove, true)}
        </div>
      </div>
    </Portal>
  );
}

function EffectRow({ set, me, own, wearing, onOpen, edition = null }) {
  const can = own.frame && own.plate;
  return (
    <div role="button" aria-label={`${set.name} effect`} onClick={onOpen} className="zchat-press"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px 10px 10px', borderRadius: 18, background: wearing ? `linear-gradient(90deg, ${set.accent}38 0%, ${CL.card} 70%)` : CL.card, boxShadow: `inset 0 0 0 1px ${wearing ? `${set.accent}88` : CL.line}`, cursor: 'pointer', marginBottom: 10 }}>
      <DecorFrameBadge setKey={set.key} size={64} photo={me.avatar} name={me.name} lazy />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15.5, fontWeight: 650, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{set.name}</div>
        <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}><RarityTag rarity={set.rarity} size={11.5} />{edition ? <EditionTag n={edition} size={11} /> : null}</div>
        <div style={{ fontSize: 12.5, color: wearing ? '#6FB0F7' : CL.ink2, marginTop: 4, lineHeight: 1.35 }}>{wearing ? 'Playing on your profile' : can ? 'Wear the full set to play it' : 'Get the frame and nameplate to play it'}</div>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Play size={14} fill="#FFFFFF" strokeWidth={0} style={{ marginLeft: 2 }} /></div>
    </div>
  );
}

const COLL_RX_LINES = { heart_pump: 'Love you lots', laugh_shake: 'He fell in the pool', thumbs_confetti: 'Tickets are booked', fire_flare: 'New song is out', sleepy: 'Up since five', rain_cloud: 'The trip got moved', jaw_drop: 'She said what', hundred: 'Full marks', applause: 'Passed my test', party_popper: 'Friday at last', mind_blown: 'It was him all along', heart_fireworks: 'We are engaged', paw_five: 'We got a kitten', cake: 'It is my birthday', snowball: 'First snow here', kiss: 'Miss you', rocket: 'Our app is live', spotlight: 'I got the part', drum_roll: 'Results are out', mic_drop: 'And that is a wrap', trophy: 'We won the final', diamond: 'She said yes' };
const collRx = { tiles: new Map(), io: null, timer: 0, last: 0, covered: false };
function collRxTick() {
  if (collRx.covered || (typeof document !== 'undefined' && document.hidden)) return;
  const now = Date.now();
  const vis = [...collRx.tiles.values()].filter((t) => t.on);
  if (!vis.length || now - collRx.last < 850 || vis.filter((t) => t.api.busy()).length >= 2) return;
  const next = vis.filter((t) => !t.api.busy() && now - t.last > 2600).sort((a, b) => a.last - b.last)[0];
  if (!next) return;
  next.last = now;
  collRx.last = now;
  next.api.play();
}
function collRxWatch(el, api) {
  if (!el || typeof IntersectionObserver === 'undefined' || reducedMotion()) return () => {};
  if (!collRx.io) {
    collRx.io = new IntersectionObserver((list) => {
      list.forEach((e) => {
        const t = collRx.tiles.get(e.target);
        if (!t) return;
        t.on = e.isIntersecting && e.intersectionRatio >= 0.6;
        if (!t.on) t.api.stop();
      });
    }, { threshold: [0, 0.6, 1] });
  }
  collRx.tiles.set(el, { api, on: false, last: 0 });
  collRx.io.observe(el);
  if (!collRx.timer) collRx.timer = setInterval(collRxTick, 320);
  return () => {
    try { collRx.io.unobserve(el); } catch {}
    collRx.tiles.delete(el);
    api.stop();
    if (!collRx.tiles.size && collRx.timer) { clearInterval(collRx.timer); collRx.timer = 0; }
  };
}
function CollNsTile({ k, me, owned, wearing, status, tone, edition, onTap }) {
  const spec = NAME_STYLES[k];
  if (!spec) return null;
  const label = `${spec.label} name style, ${owned ? (wearing ? 'in use' : status) : `${formatCount(Number(status))} coins in the Shop`}${edition ? `, number ${Math.floor(edition).toLocaleString()}` : ''}`;
  return (
    <div role="button" aria-label={label} aria-pressed={owned ? wearing : undefined} onClick={onTap} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, borderRadius: 18, padding: '18px 12px 12px', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 ${wearing ? 2 : 1}px ${wearing ? CL.accent : CL.line}`, display: 'flex', flexDirection: 'column' }}>
      {edition ? <EditionTag n={edition} size={11} style={{ position: 'absolute', top: 9, right: 10 }} /> : null}
      <div style={{ minHeight: 40, display: 'flex', alignItems: 'center', minWidth: 0, opacity: owned ? 1 : 0.6, transition: 'opacity 0.2s ease' }}><NameStyleArt k={k} name={me && me.name} size={19} width={150} /></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, marginTop: 10 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: owned ? CL.ink : CL.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</span>
        {tone === 'coin' ? <CollPrice price={Number(status)} size={13} /> : <span style={{ fontSize: 12.5, fontWeight: 600, color: tone === 'use' ? '#6FB0F7' : CL.own, flexShrink: 0 }}>{status}</span>}
      </div>
    </div>
  );
}
function CollFavMark({ size = 12, color = '#6FB0F7' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M6 1.1l1.45 2.95 3.25.47-2.35 2.3.56 3.24L6 8.53 3.09 10.06l.56-3.24-2.35-2.3 3.25-.47z" fill={color} />
    </svg>
  );
}
function CollRxTile({ k, owned, fav, status, tone, edition, onTap }) {
  const spec = SUPER_REACTS[k];
  const stage = useRef(null);
  const cv = useRef(null);
  const bub = useRef(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return undefined;
    let played = false;
    const api = {
      play: () => superPack().then((ok) => {
        if (!ok || !window.ZSRX || !cv.current || !stage.current || !bub.current || collRx.covered) return;
        const s = stage.current.getBoundingClientRect();
        const b = bub.current.getBoundingClientRect();
        if (!s.width || !b.width) return;
        try { played = !!window.ZSRX.play(cv.current, k, { x: b.left - s.left + b.width / 2, y: b.top - s.top + b.height / 2, tx: b.left - s.left + 15, ty: b.bottom - s.top + 3, el: bub.current, dark: true, solo: true, dprCap: 1.5, scale: 0.6, fps: 30 }) || played; } catch {}
      }),
      busy: () => { try { return !!(played && window.ZSRX && cv.current && window.ZSRX.busy(cv.current)); } catch { return false; } },
      stop: () => { try { if (window.ZSRX && cv.current) window.ZSRX.stop(cv.current); } catch {} },
    };
    const off = collRxWatch(el, api);
    return () => { off(); try { if (window.ZSRX && window.ZSRX.drop && cv.current) window.ZSRX.drop(cv.current); } catch {} };
  }, [k]);
  if (!spec) return null;
  const label = `${spec.label} super reaction, ${owned ? (fav ? 'in your favourites' : status) : `${formatCount(Number(status))} coins in the Shop`}${edition ? `, number ${Math.floor(edition).toLocaleString()}` : ''}`;
  return (
    <div role="button" aria-label={label} aria-pressed={owned ? fav : undefined} onClick={onTap} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, borderRadius: 18, overflow: 'hidden', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 ${fav ? 2 : 1}px ${fav ? CL.accent : CL.line}`, display: 'flex', flexDirection: 'column' }}>
      <div ref={stage} style={{ position: 'relative', height: 104, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 12px 22px', boxSizing: 'border-box' }}>
        <div ref={bub} style={{ position: 'relative', alignSelf: 'flex-start', maxWidth: '92%', background: '#26262E', color: CL.ink, borderRadius: 16, borderBottomLeftRadius: 5, padding: '6px 10px', fontSize: 12.5, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'visible', opacity: owned ? 1 : 0.7 }}>
          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{COLL_RX_LINES[k] || 'Guess what happened'}</span>
          <span style={{ position: 'absolute', bottom: -11, left: 7, display: 'inline-flex', padding: '1px 5px', borderRadius: 9, background: '#1E1E25', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 1.5px ${spec.accent}`, background: `${spec.accent}26`, fontSize: 10, lineHeight: 1 }}>{spec.base}</span>
          </span>
        </div>
        <canvas ref={cv} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
        {edition ? <EditionTag n={edition} size={11} style={{ position: 'absolute', top: 9, right: 10 }} /> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, padding: '0 12px 12px' }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: owned ? CL.ink : CL.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{spec.label}</span>
        {tone === 'coin'
          ? <CollPrice price={Number(status)} size={13} />
          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 600, color: tone === 'fav' ? '#6FB0F7' : tone === 'free' ? CL.gold : CL.own, flexShrink: 0 }}>{tone === 'fav' && <CollFavMark size={12} />}{status}</span>}
      </div>
    </div>
  );
}
function CollStyles({ me, rewards, covered, onWear, onOpenItem, onOpenTheme, onOpenShop, say, cols = 2 }) {
  const favs = useSuperFavs(me.id);
  useEffect(() => { collRx.covered = !!covered; if (covered) collRx.tiles.forEach((t) => t.api.stop()); }, [covered]);
  useEffect(() => () => { collRx.covered = false; }, []);
  const rank = (kind) => (a, b) => (STORE_RARITY_ORDER[cxSpec(kind, a).rarity] ?? 9) - (STORE_RARITY_ORDER[cxSpec(kind, b).rarity] ?? 9);
  const cheap = (kind) => (a, b) => (cxSpec(kind, a).price || 0) - (cxSpec(kind, b).price || 0);
  const owns = (kind, k) => cxOwns(rewards, kind, k, false);
  const left = (kind, k) => { const rw = (rewards || []).find((r) => r.kind === kind && r.reward_key === k && rewardActive(r)); return rw ? daysLeft(rw) : null; };
  const wearNs = cxNs(me);
  const nsMine = NS_KEYS.filter((k) => owns('namestyle', k)).sort((a, b) => Number(b === wearNs) - Number(a === wearNs) || rank('namestyle')(a, b));
  const nsRest = NS_KEYS.filter((k) => !owns('namestyle', k)).sort(cheap('namestyle'));
  const wearTh = ptKeyOf(me);
  const thMine = THEME_KEYS.filter((k) => owns('theme', k)).sort((a, b) => Number(b === wearTh) - Number(a === wearTh));
  const favOn = favs.filter((k) => owns('reaction', k));
  const rxMine = SUPER_KEYS.filter((k) => owns('reaction', k) && !favOn.includes(k)).sort((a, b) => Number(!!SUPER_REACTS[a].free) - Number(!!SUPER_REACTS[b].free) || rank('reaction')(a, b));
  const rxRest = SUPER_KEYS.filter((k) => !owns('reaction', k)).sort(cheap('reaction'));
  const nsList = [...nsMine, ...nsRest];
  const rxList = [...favOn, ...rxMine, ...rxRest];
  const lockedOf = (kind, keys) => keys.map((k) => ({ kind, key: k }));
  const tapNs = (k) => {
    if (!owns('namestyle', k)) { playUiSound('tap'); onOpenItem('namestyle', k, lockedOf('namestyle', nsRest)); return; }
    hapticTap();
    playUiSound(wearNs === k ? 'tap' : 'like');
    onWear('namestyle', wearNs === k ? null : k);
  };
  const tapRx = (k) => {
    if (!owns('reaction', k)) { playUiSound('tap'); onOpenItem('reaction', k, lockedOf('reaction', rxRest)); return; }
    hapticTap();
    const r = superFavToggle(me.id, k);
    const name = SUPER_REACTS[k].label;
    if (r === 'full') { say(`You can keep ${SUPER_FAV_MAX} favourites. Take one out first.`); return; }
    playUiSound(r === 'on' ? 'like' : 'tap');
    say(r === 'on' ? `${name} is in your favourites` : `${name} is out of your favourites`);
  };
  const nsStatus = (k) => {
    if (!owns('namestyle', k)) return [String(shopPrice('namestyle', k) || 0), 'coin'];
    if (wearNs === k) return ['In use', 'use'];
    const d = left('namestyle', k);
    return [d != null ? `${d} ${d === 1 ? 'day' : 'days'} left` : 'Yours', 'own'];
  };
  const rxStatus = (k) => {
    if (!owns('reaction', k)) return [String(shopPrice('reaction', k) || 0), 'coin'];
    if (favOn.includes(k)) return ['Favourite', 'fav'];
    if (SUPER_REACTS[k].free) return ['Free', 'free'];
    const d = left('reaction', k);
    return [d != null ? `${d} ${d === 1 ? 'day' : 'days'} left` : 'Yours', 'own'];
  };
  const count = (n, t) => <span style={{ fontSize: 13, fontWeight: 600, color: CL.ink3, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginBottom: 2 }}>{n} of {t}</span>;
  return (
    <>
      <CollSection title="Name styles" sub="Tap one of yours to wear it. Everyone sees it." right={count(nsMine.length, NS_KEYS.length)}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>
          {nsList.map((k) => { const [st, tone] = nsStatus(k); return <CollNsTile key={k} k={k} me={me} owned={tone !== 'coin'} wearing={tone === 'use'} status={st} tone={tone} edition={editionOf(rewards, 'namestyle', k)} onTap={() => tapNs(k)} />; })}
        </div>
      </CollSection>
      {thMine.length > 0 && (
        <CollSection title="Profile themes" sub="Shows behind your profile for everyone who visits">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>
            {thMine.map((k) => { const d = left('theme', k); return <CxTile key={k} kind="theme" k={k} me={me} status={wearTh === k ? 'In use' : d != null ? `${d} ${d === 1 ? 'day' : 'days'} left` : 'Yours'} tone={wearTh === k ? 'use' : 'own'} on={wearTh === k} cols={2} covered={covered} edition={editionOf(rewards, 'theme', k)} onOpen={() => onOpenTheme(k)} />; })}
          </div>
        </CollSection>
      )}
      <CollSection title="Super reactions" sub="Tap one of yours to put it first when you hold a message." right={count(SUPER_KEYS.filter((k) => owns('reaction', k)).length, SUPER_KEYS.length)}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>
          {rxList.map((k) => { const [st, tone] = rxStatus(k); return <CollRxTile key={k} k={k} owned={tone !== 'coin'} fav={tone === 'fav'} status={st} tone={tone} edition={editionOf(rewards, 'reaction', k)} onTap={() => tapRx(k)} />; })}
        </div>
      </CollSection>
      {onOpenShop && <button type="button" onClick={() => onOpenShop('styles')} className="zchat-press" style={{ marginTop: 22, width: '100%', height: 46, borderRadius: 14, border: 'none', background: CL.card2, color: CL.ink, fontFamily: FONT, fontSize: 14.5, fontWeight: 650, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><ShopBagIcon size={18} />More styles in the Shop</button>}
    </>
  );
}

function SiCollTile({ kind, k, me, status, tone, on, onTap }) {
  const name = kind === 'namestyle' ? NS_OWN_ITEM.label : shopItemName(kind, k);
  return (
    <div role="button" aria-label={`${name} ${kind === 'namestyle' ? 'name style' : siWord(kind)}${status ? `, ${tone === 'coin' ? `${status} coins` : status}` : ''}`} onClick={onTap} className="zchat-press"
      style={{ position: 'relative', minWidth: 0, borderRadius: 18, padding: '12px 10px 11px', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${on ? CL.accent : CL.line}`, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
      <div style={{ height: 66, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
        {kind === 'namestyle'
          ? <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', ...NS_ROOM }}><StyledName name={String(me.name || 'You').split(' ')[0]} k={k} dark /></div>
          : <SiItemArt kind={kind} k={k} me={me} size={66} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kind === 'namestyle' ? 'Your own' : name}</span>
        {tone === 'coin' ? <CollPrice price={Number(status)} size={12.5} /> : status ? <span style={{ fontSize: 12.5, fontWeight: 600, color: tone === 'use' ? '#6FB0F7' : CL.own, flexShrink: 0 }}>{status}</span> : null}
      </div>
    </div>
  );
}
function SiCollSections({ me, rewards, onOpen, say, cols = 2 }) {
  const [typing, setTyping] = useState(() => typingStyleMine(me.id));
  const own = cxOwns(rewards, 'namestyle', 'own', true);
  const ownKey = nsOwn(me.name_style) ? me.name_style : nsOwnSaved() || NS_OWN_SAMPLE;
  const grid = (children) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>{children}</div>;
  const listOf = (kind, keys) => keys.map((k) => ({ kind, key: k }));
  const sortOwned = (kind, keys) => [...keys.filter((k) => siOwns(rewards, kind, k)), ...keys.filter((k) => !siOwns(rewards, kind, k))];
  const typingKeys = sortOwned('typing', SI_TYPING.map((t) => t.key));
  const stickerKeys = sortOwned('stickerpack', SI_STICKER_PACKS.map((p) => p.key));
  const soundKeys = sortOwned('soundpack', SI_SOUND_PACKS.map((p) => p.key));
  const tapTyping = (k) => {
    if (!siOwns(rewards, 'typing', k)) { playUiSound('tap'); onOpen('typing', k, listOf('typing', typingKeys)); return; }
    const next = typing === k ? null : k;
    setTypingStyleMine(me.id, next);
    setTyping(next);
    hapticTap();
    playUiSound(next ? 'like' : 'tap');
    say(next ? `${SI_TYPING_BY[k].label} is on. Friends see it while you type.` : 'Back to the plain dots');
  };
  const count = (kind, keys) => <span style={{ fontSize: 13, fontWeight: 600, color: CL.ink3, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginBottom: 2 }}>{keys.filter((k) => siOwns(rewards, kind, k)).length} of {keys.length}</span>;
  return (
    <>
      <CollSection title="Your own name style" sub={own ? 'Tap it to change colours, motion or weight. Changes are free.' : 'Make a name style that is only yours'}>
        {grid(<SiCollTile kind="namestyle" k={ownKey} me={me} status={own ? (nsOwn(me.name_style) ? 'In use' : 'Yours') : String(NS_OWN_ITEM.price)} tone={own ? (nsOwn(me.name_style) ? 'use' : 'own') : 'coin'} on={!!nsOwn(me.name_style)} onTap={() => { playUiSound('tap'); onOpen('namestyle', 'own', null); }} />)}
      </CollSection>
      <CollSection title="Typing styles" sub="Tap one of yours to use it. Friends see it while you type." right={count('typing', typingKeys)}>
        {grid(typingKeys.map((k) => { const mine = siOwns(rewards, 'typing', k); return <SiCollTile key={k} kind="typing" k={k} me={me} on={typing === k} status={!mine ? String(SI_TYPING_BY[k].price) : typing === k ? 'In use' : 'Yours'} tone={!mine ? 'coin' : typing === k ? 'use' : 'own'} onTap={() => tapTyping(k)} />; }))}
      </CollSection>
      <CollSection title="Sticker packs" sub="Yours show up in your sticker picker" right={count('stickerpack', stickerKeys)}>
        {grid(stickerKeys.map((k) => { const mine = siOwns(rewards, 'stickerpack', k); return <SiCollTile key={k} kind="stickerpack" k={k} me={me} status={mine ? 'Yours' : String(SI_STICKER_BY[k].price)} tone={mine ? 'own' : 'coin'} onTap={() => { playUiSound('tap'); onOpen('stickerpack', k, listOf('stickerpack', stickerKeys)); }} />; }))}
      </CollSection>
      <CollSection title="Sound packs" sub="Pick yours in Settings, Notifications, or for one chat" right={count('soundpack', soundKeys)}>
        {grid(soundKeys.map((k) => { const mine = siOwns(rewards, 'soundpack', k); return <SiCollTile key={k} kind="soundpack" k={k} me={me} status={mine ? 'Yours' : String(SI_SOUND_BY[k].price)} tone={mine ? 'own' : 'coin'} onTap={() => { playUiSound('tap'); onOpen('soundpack', k, listOf('soundpack', soundKeys)); }} />; }))}
      </CollSection>
    </>
  );
}
export function CollectionPanel({ me, rewards, onClose, onEquip, onWear, isAdmin, onRewardsChanged, onOpenWallet, onGift, startSet = null, onOpenShop }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { bubbleStyle, setBubbleStyle } = useTheme();
  const [tab, setTab] = useState('sets');
  const [openSet, setOpenSet] = useState(null);
  const [openMode, setOpenMode] = useState('set');
  useEffect(() => { if (isDecorKey(startSet)) setOpenSet(startSet); }, []);
  const drops = useDrops(me.id);
  const [dropOpen, setDropOpen] = useState(null);
  const dropStartRef = useRef(startSet === '__drop');
  useEffect(() => {
    if (!dropStartRef.current || !drops) return;
    dropStartRef.current = false;
    const d = drops.find((x) => dropPhase(x) === 'live') || drops[0];
    if (d) setDropOpen(d.id);
  }, [drops]);
  const openDrop = dropOpen ? (drops || []).find((d) => d.id === dropOpen) || null : null;
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tryOn, setTryOn] = useState(null);
  const [toast, setToast] = useState('');
  const [lookMenu, setLookMenu] = useState(null);
  const [cxOpen, setCxOpen] = useState(null);
  const [themeTry, setThemeTry] = useState(null);
  const [shopItem, setShopItem] = useState(null);
  const cxOn = cxHas(me);
  const wallet = useWallet(me.id);
  const gridRef = useRef(null);
  const gw = useWidthOf(gridRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 560)) - 32;
  useDecorLoaded(DECOR_SPRITE);
  useBackClose(!!selected, () => setSelected(null));
  const toastTimer = useRef(0);
  const say = (t) => { setToast(t); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2400); };
  useMoneyToast(say);
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const stats = collectionStats(rewards);
  const rewardsSig = `${(rewards || []).length}:${stats.owned}`;
  const ms = useMilestones(me.id, rewardsSig);
  const [msBusy, setMsBusy] = useState(false);
  const looks = useLooks(me.id);
  const active = (rewards || []).filter(rewardActive);
  const ownOf = (k) => decorOwned(rewards, k);
  const wearF = isDecorKey(me.avatar_frame) ? me.avatar_frame : null;
  const wearP = isDecorKey(me.nameplate) ? me.nameplate : null;
  const mine = DECOR_ALL.filter((s) => ownOf(s.key).any).sort((a, b) => {
    const wa = (wearF === a.key || wearP === a.key) ? 0 : 1;
    const wb = (wearF === b.key || wearP === b.key) ? 0 : 1;
    return wa - wb || ownOf(b.key).count - ownOf(a.key).count;
  });
  const mineKeys = mine.map((s) => s.key);
  const myFx = DECOR_ALL.filter((s) => ownOf(s.key).effect).sort((a, b) => Number(wearF === b.key && wearP === b.key) - Number(wearF === a.key && wearP === a.key));
  const ownedCharms = new Set(active.filter((r) => r.kind === 'charm' && CUSTOM_BADGES[r.reward_key]).map((r) => r.reward_key));
  const myBubbles = ['classic', ...CHAR_BUBBLE_KEYS.filter((k) => stats.bubbles.has(k))];
  const wearingBubble = bubbleKeyOf(bubbleStyle) || 'classic';
  const cols = gw >= 700 ? 4 : gw >= 500 ? 3 : 2;
  const tileW = Math.max(110, Math.floor((gw - (cols - 1) * 10) / cols) - 8);
  const rarity = (spec) => RARITY_STYLE[spec.rarity] || RARITY_STYLE.epic;
  const rewardFor = (kind, key) => (rewards || []).find((r) => r.kind === kind && r.reward_key === key) || null;
  const items = tab === 'charm'
    ? Object.entries(CUSTOM_BADGES).filter(([key]) => ownedCharms.has(key)).map(([key, spec]) => ({ key, spec, owned: true, equipped: me.custom_badge === key, reward: rewardFor('charm', key) }))
    : tab === 'badge'
      ? Object.entries(VERIFIED_TIERS).filter(([key]) => isAdmin || me.verified === key).map(([key, t]) => ({ key, spec: { label: `${t.label} badge`, rarity: key === 'red' ? 'mythic' : key === 'gold' ? 'legendary' : 'epic', color: t.color }, owned: true, equipped: me.verified === key, reward: null }))
      : [];
  const sorted = [...items].sort((x, y) => Number(y.equipped) - Number(x.equipped) || (STORE_RARITY_ORDER[x.spec.rarity] ?? 9) - (STORE_RARITY_ORDER[y.spec.rarity] ?? 9));
  const sel = selected ? items.find((it) => it.key === selected) : null;
  const refresh = async () => { if (onRewardsChanged) await onRewardsChanged(); loadMilestones(me.id, true); };
  const equip = (kind, key) => {
    if (busy || (kind === 'badge' && !isAdmin)) return;
    onEquip(kind, key);
  };
  const openSetPage = (k, mode = 'set') => { setOpenMode(mode); setOpenSet(k); playUiSound('tap'); };
  const claim = async (level) => {
    if (msBusy) return;
    const add = (MILESTONES.find(([lv]) => lv === level) || [0, 0])[1];
    setMsBusy(true);
    hapticTap();
    playUiSound('win');
    say(`${add} coins added`);
    const r = await claimMilestone(me.id, level);
    setMsBusy(false);
    if (r.error) say(r.error);
  };
  const currentLook = { frame: wearF, nameplate: wearP, bubble: wearingBubble === 'classic' ? null : wearingBubble, charm: me.custom_badge || null, ...(cxOn ? { name_style: cxNs(me), theme: ptKeyOf(me) } : {}) };
  const sameLook = (l) => (l.frame || null) === currentLook.frame && (l.nameplate || null) === currentLook.nameplate && (l.bubble || null) === currentLook.bubble && (l.charm || null) === currentLook.charm && (!cxOn || ((l.name_style || null) === currentLook.name_style && (l.theme || null) === currentLook.theme));
  const saveLook = (slot, name) => {
    hapticTap();
    say('Look saved');
    looks.save(slot, { ...currentLook, name: name || `Look ${slot}` }).then((r) => { if (r.error) say(r.error); });
  };
  const applyLook = (l) => {
    if (busy) return;
    const ownsK = (kind, k) => !k || active.some((r) => r.kind === kind && r.reward_key === k);
    const patch = {};
    if (ownsK('frame', l.frame) && (l.frame || null) !== wearF) patch.avatar_frame = l.frame || null;
    if (ownsK('nameplate', l.nameplate) && (l.nameplate || null) !== wearP) patch.nameplate = l.nameplate || null;
    const charmGo = (l.charm || null) !== (me.custom_badge || null) && (!l.charm || ownedCharms.has(l.charm));
    const nsGo = cxOn && (l.name_style || null) !== cxNs(me) && (!l.name_style || cxOwns(rewards, 'namestyle', l.name_style, false));
    const thGo = cxOn && (l.theme || null) !== ptKeyOf(me) && (!l.theme || cxOwns(rewards, 'theme', l.theme, false));
    if (Object.keys(patch).length) onWear(patch);
    if (!l.bubble || stats.bubbles.has(l.bubble)) setBubbleStyle(l.bubble || 'classic');
    if (charmGo) onEquip('charm', l.charm || null);
    if (nsGo) onEquip('namestyle', l.name_style || null);
    if (thGo) onEquip('theme', l.theme || null);
    hapticTap();
    if (!Object.keys(patch).length && !charmGo && !nsGo && !thGo) playUiSound('like');
    say(`${l.name || 'Look'} is on`);
  };
  const covered = !!(openSet || openDrop || tryOn || themeTry || shopItem);
  const cxWear = (kind, key) => {
    const spec = key ? cxSpec(kind, key) : null;
    onEquip(kind, key || null);
    say(spec ? (kind === 'theme' ? `${spec.label} is on your profile` : `${spec.label} is on. Everyone sees it.`) : kind === 'theme' ? 'Your profile theme is off' : 'Your name style is off');
  };
  const [hideBody, setHideBody] = useState(false);
  useEffect(() => {
    if (!covered) { setHideBody(false); return undefined; }
    const t = setTimeout(() => setHideBody(true), 420);
    return () => clearTimeout(t);
  }, [covered]);
  const btnStyle = (primary) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, padding: '0 18px', borderRadius: 13, border: 'none', fontFamily: FONT, fontSize: 14.5, fontWeight: 650, cursor: 'pointer', background: primary ? CL.accent : CL.card2, color: '#FFFFFF' });
  const emptyTab = (title, text) => (
    <div style={{ textAlign: 'center', padding: '24px 8px 30px' }}>
      <div style={{ maxWidth: 280, margin: '0 auto 16px' }}><SpotArt k="saved" dark /></div>
      <div style={{ fontSize: 17, fontWeight: 700, color: CL.ink }}>{title}</div>
      <div style={{ fontSize: 14, color: CL.ink2, marginTop: 6, lineHeight: 1.5, textWrap: 'balance' }}>{text}</div>
      {onOpenShop && <button type="button" onClick={() => onOpenShop()} className="zchat-press" style={{ marginTop: 16, height: 44, padding: '0 20px', borderRadius: 22, border: 'none', background: CL.accent, color: '#FFFFFF', fontFamily: FONT, fontSize: 15, fontWeight: 650, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}><ShopBagIcon size={18} />Open the Shop</button>}
    </div>
  );
  return (
    <>
    <WideDim onClose={onClose} z={620} />
    <div {...edgeBack} className="zchat-panel-open zchat-wide-page" style={{ position: 'fixed', inset: 0, zIndex: 620, background: CL.bg, color: CL.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 0', paddingTop: 'calc(6px + env(safe-area-inset-top))' }}>
        <div role="button" aria-label="Close collection" onClick={onClose} style={{ width: 42, height: 42, borderRadius: 21, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CL.ink, cursor: 'pointer' }}><ArrowLeft size={23} /></div>
        <div style={{ flex: 1 }} />
        {onOpenShop && <div role="button" aria-label="Open the shop" onClick={() => { playUiSound('tap'); onOpenShop(); }} className="zchat-press" style={{ height: 34, padding: '0 13px 0 11px', borderRadius: 17, background: CL.accent, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 650, color: '#FFFFFF', cursor: 'pointer' }}><ShopBagIcon size={17} />Shop</div>}
        <div role="button" aria-label={`${formatCount(coins)} coins`} onClick={onOpenWallet} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, padding: '0 13px 0 10px', borderRadius: 17, background: CL.card2, fontSize: 14.5, fontWeight: 650, color: CL.ink, cursor: 'pointer', fontVariantNumeric: 'tabular-nums' }}><CoinIcon size={18} />{formatCount(coins)}</div>
      </div>
      <div ref={gridRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '0 16px 40px', visibility: hideBody ? 'hidden' : 'visible' }}>
        <div style={{ padding: '4px 0 12px', fontSize: 31, fontWeight: 750, letterSpacing: '-0.025em' }}>Collection</div>
        <CollProgress stats={stats} ms={ms} onClaim={claim} busy={msBusy} />
        {!looks.off && (
          <CollSection title="Looks" sub="Save what you wear and switch in one tap" style={{ marginTop: 22 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {[1, 2, 3].map((slot) => {
                const l = looks.list.find((x) => x.slot === slot) || null;
                return <LookSlot key={slot} slot={slot} look={l} me={me} current={!!l && sameLook(l)} onSave={() => saveLook(slot)} onApply={() => applyLook(l)} onMenu={() => setLookMenu(slot)} />;
              })}
            </div>
          </CollSection>
        )}
        <div style={{ position: 'sticky', top: 0, zIndex: 6, margin: '20px -16px 0', padding: '8px 16px', background: CL.bg }}>
          <SegTabs items={[['sets', 'Sets'], ['effects', 'Effects'], ['bubble', 'Bubbles'], ['charm', 'Charms'], ['badge', 'Badges'], ...(cxOn ? [['styles', 'Styles']] : [])]} value={tab} onChange={(k) => { setTab(k); setSelected(null); playUiSound('tap'); }} />
        </div>
        {tab === 'sets' && (mine.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10, marginTop: 12 }}>
            {mine.map((s) => <SetCard key={s.key} set={s} me={me} own={ownOf(s.key)} owned wearing={wearF === s.key && wearP === s.key} width={tileW} edition={ownOf(s.key).full ? editionOf(rewards, 'set', s.key) : null} onOpen={() => openSetPage(s.key)} />)}
          </div>
        ) : emptyTab('No sets yet', 'Sets you get show up here. Every set comes with a frame, a nameplate and a profile effect.'))}
        {tab === 'effects' && (myFx.length ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13.5, color: CL.ink2, lineHeight: 1.45, padding: '0 2px 12px' }}>An effect plays when someone opens your profile, while you wear its full set.</div>
            {myFx.map((s) => <EffectRow key={s.key} set={s} me={me} own={ownOf(s.key)} wearing={wearF === s.key && wearP === s.key} edition={editionOf(rewards, 'effect', s.key)} onOpen={() => openSetPage(s.key, 'effect')} />)}
          </div>
        ) : emptyTab('No effects yet', 'Every set has its own profile effect. Get one in the Shop.'))}
        {tab === 'bubble' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
            {myBubbles.map((k) => <BubbleTileDark key={k} k={k} on={wearingBubble === k} status={wearingBubble === k ? 'In use' : k === 'classic' ? 'Free' : 'Yours'} tone={wearingBubble === k ? 'use' : 'own'} edition={k === 'classic' ? null : editionOf(rewards, 'bubble', k)} onPick={() => { if (wearingBubble === k) return; hapticTap(); playUiSound('like'); setBubbleStyle(k); say(k === 'classic' ? 'Back to the classic bubble' : `${CHAR_BUBBLES[k].label} is on. Everyone sees it.`); }} />)}
            {myBubbles.length === 1 && <div style={{ gridColumn: '1 / -1' }}>{emptyTab('Only the classic bubble', 'Get a bubble with a little character on it in the Shop.')}</div>}
          </div>
        )}
        {(tab === 'charm' || tab === 'badge') && (sorted.length ? (
          <>
            <div style={{ fontSize: 13.5, color: CL.ink2, lineHeight: 1.4, padding: '14px 2px 12px' }}>{tab === 'charm' ? 'A charm sits next to your name everywhere in ZChat.' : 'Badges show next to your name and are given by the ZChat team.'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {sorted.map((it) => {
                const left = daysLeft(it.reward);
                return (
                  <div key={it.key} role="button" aria-label={it.spec.label} onClick={() => { setSelected(it.key); playUiSound('tap'); }} className="zchat-press"
                    style={{ position: 'relative', minWidth: 0, borderRadius: 18, padding: '14px 12px 13px', cursor: 'pointer', background: CL.card, boxShadow: `inset 0 0 0 ${it.equipped ? 2 : 1}px ${it.equipped ? CL.accent : CL.line}` }}>
                    {tab === 'charm' && editionOf(rewards, 'charm', it.key) ? <EditionTag n={editionOf(rewards, 'charm', it.key)} size={11} style={{ position: 'absolute', top: 10, right: 11 }} /> : null}
                    <div style={{ height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {tab === 'charm' ? <CharmPreview charm={it.key} size={54} /> : <VerifiedBadge tier={it.key} size={54} style={{ marginLeft: 0, display: 'block' }} />}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: CL.ink, marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.spec.label.replace(/ (charm|badge)$/i, '')}</div>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <RarityTag rarity={it.spec.rarity} size={11.5} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: it.equipped ? '#6FB0F7' : CL.own, flexShrink: 0 }}>{it.equipped ? 'In use' : left != null ? `${left} ${left === 1 ? 'day' : 'days'} left` : 'Yours'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : emptyTab(tab === 'charm' ? 'No charms yet' : 'No badges yet', tab === 'charm' ? 'Charms sit next to your name. Find them in the Shop.' : 'Badges are given by the ZChat team.'))}
        {tab === 'styles' && cxOn && (
          <div style={{ marginTop: -8 }}>
            <CollStyles me={me} rewards={rewards} covered={!!(cxOpen || covered)} say={say} onOpenShop={onOpenShop} cols={cols}
              onWear={(kind, k) => cxWear(kind, k)}
              onOpenTheme={(k) => { playUiSound('tap'); setCxOpen({ kind: 'theme', key: k }); }}
              onOpenItem={(kind, k, list) => setShopItem({ kind, key: k, items: list && list.length > 1 ? list : null })} />
            <LiveWallShelf rewards={rewards} onOpen={(k) => setShopItem({ kind: 'wallpaper', key: k, items: LIVE_WALL_PAID.map((x) => ({ kind: 'wallpaper', key: x })) })} />
            <SiCollSections me={me} rewards={rewards} say={say} cols={cols} onOpen={(kind, k, list) => setShopItem({ kind, key: k, items: list && list.length > 1 ? list : null })} />
          </div>
        )}
      </div>

      {sel && (
        <div className="zchat-sheet-up" style={{ position: 'absolute', zIndex: 30, left: 0, right: 0, bottom: 0, padding: '18px 16px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))', background: '#17171C', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)', borderRadius: '24px 24px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div role="button" onClick={() => tab === 'charm' && setTryOn(sel.key)} style={{ width: 84, height: 84, borderRadius: 18, background: CL.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: tab === 'charm' ? 'pointer' : 'default' }}>
              {tab === 'charm' ? <CharmPreview charm={sel.key} size={52} /> : <VerifiedBadge tier={sel.key} size={52} style={{ marginLeft: 0, display: 'block' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <RarityTag rarity={sel.spec.rarity} size={12.5} />
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 3 }}>{sel.spec.label}</div>
              {daysLeft(sel.reward) != null && <div style={{ fontSize: 12.5, fontWeight: 500, color: daysLeft(sel.reward) <= 5 ? '#FCA5A5' : CL.ink2, marginTop: 3 }}>Yours for {daysLeft(sel.reward)} more {daysLeft(sel.reward) === 1 ? 'day' : 'days'}</div>}
              {tab === 'charm' && <EditionLine n={editionOf(rewards, 'charm', sel.key)} style={{ marginTop: 5 }} />}
            </div>
            <div role="button" aria-label="Close details" onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 16, background: CL.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: CL.ink2, flexShrink: 0 }}><X size={16} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {tab === 'badge' ? (
              isAdmin ? (
                <button disabled={busy || sel.equipped} onClick={() => equip('badge', sel.key)} style={{ ...btnStyle(!sel.equipped), flex: 1, cursor: sel.equipped ? 'default' : 'pointer', background: sel.equipped ? 'rgba(61,214,140,0.16)' : CL.accent, color: sel.equipped ? CL.own : '#FFFFFF' }}>{sel.equipped ? 'In use' : 'Use this badge'}</button>
              ) : (
                <div style={{ flex: 1, padding: '12px 14px', borderRadius: 13, background: CL.card2, fontSize: 13.5, fontWeight: 500, color: CL.ink2 }}>You are wearing this badge</div>
              )
            ) : (
              <>
                {sel.equipped
                  ? <button disabled={busy} onClick={() => equip('charm', null)} style={{ ...btnStyle(false), flex: 1 }}>Take off</button>
                  : <button disabled={busy} onClick={() => equip('charm', sel.key)} style={{ ...btnStyle(true), flex: 1 }}>Use this charm</button>}
                <button onClick={() => setTryOn(sel.key)} style={btnStyle(false)}>Preview</button>
              </>
            )}
          </div>
        </div>
      )}
      {toast && <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', top: 'calc(70px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 40, padding: '9px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.95)', color: '#111', fontSize: 13.5, fontWeight: 650, width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', textAlign: 'center' }}>{toast}</div>}
      {tryOn && (() => {
        const rw = rewardFor('charm', tryOn);
        const isEq = me.custom_badge === tryOn;
        return <CharmTryOnPage me={me} charmKey={tryOn} onClose={() => setTryOn(null)} action={{ label: isEq ? 'In use' : 'Use this charm', disabled: isEq || busy, onClick: async () => { await equip('charm', tryOn); setTryOn(null); }, sub: daysLeft(rw) != null ? `${daysLeft(rw)} ${daysLeft(rw) === 1 ? 'day' : 'days'} left` : 'Yours to keep' }} />;
      })()}
      {cxOpen && (
        <CxItemSheet me={me} item={cxOpen} rewards={rewards} wallet={wallet} onClose={() => setCxOpen(null)} onOpenWallet={onOpenWallet} onEquip={cxWear}
          onGift={onGift ? (kind, k) => { setCxOpen(null); onGift(kind, k); } : undefined} onPreviewTheme={(k) => setThemeTry(k)}
          onDone={(t, job) => { setCxOpen(null); say(t); job.then((r) => { if (r.error) say(r.error); else refresh(); }); }} />
      )}
      {shopItem && siRoute(shopItem) && (shopItem.kind === 'namestyle'
        ? <OwnStylePage me={me} rewards={rewards} wallet={wallet} onClose={() => setShopItem(null)} onOpenWallet={onOpenWallet} onEquip={onEquip} onRefresh={refresh} onGift={onGift ? (kind, k) => onGift(kind, k) : undefined} />
        : <SiItemPage me={me} item={shopItem} items={shopItem.items} onPick={(it) => setShopItem({ ...shopItem, kind: it.kind, key: it.key })} rewards={rewards} wallet={wallet} onClose={() => setShopItem(null)} onOpenWallet={onOpenWallet} onRefresh={refresh} onGift={onGift ? (kind, k) => onGift(kind, k) : undefined} />)}
      {shopItem && !siRoute(shopItem) && (
        <ShopItemPage me={me} item={shopItem} items={shopItem.items} onPick={(it) => setShopItem({ ...shopItem, kind: it.kind, key: it.key })} rewards={rewards} wallet={wallet} onClose={() => setShopItem(null)} onOpenWallet={onOpenWallet} onEquip={onEquip} onRefresh={refresh}
          onGift={onGift ? (kind, k) => onGift(kind, k) : undefined} onPreviewTheme={(k) => setThemeTry(k)} />
      )}
      {themeTry && (
        <ThemePreviewPage me={me} k={themeTry} startDark onClose={() => setThemeTry(null)}
          action={{ label: me.profile_theme === themeTry ? 'In use' : 'Use this theme', disabled: me.profile_theme === themeTry, onClick: () => { const k = themeTry; setThemeTry(null); setCxOpen(null); cxWear('theme', k); } }} />
      )}
      {lookMenu && looks.list.find((x) => x.slot === lookMenu) && (
        <LookMenuSheet look={looks.list.find((x) => x.slot === lookMenu)} slot={lookMenu} onClose={() => setLookMenu(null)}
          onRename={async (name) => { const l = looks.list.find((x) => x.slot === lookMenu); setLookMenu(null); const r = await looks.save(l.slot, { ...l, name }); if (r.error) say(r.error); }}
          onUpdate={async () => { const l = looks.list.find((x) => x.slot === lookMenu); setLookMenu(null); await saveLook(l.slot, l.name); }}
          onRemove={async () => { const s = lookMenu; setLookMenu(null); const r = await looks.remove(s); if (r.error) say(r.error); }} />
      )}
      {openSet && (
        <SetShopPage me={me} setKey={openSet} rewards={rewards} wallet={wallet} startMode={openMode} list={mineKeys.includes(openSet) ? mineKeys : null} onClose={() => setOpenSet(null)} onPick={(k) => setOpenSet(k)}
          onWear={onWear} onRefresh={refresh} onOpenWallet={onOpenWallet} onGift={onGift ? (k) => onGift('set', k) : undefined} />
      )}
      {openDrop && <DropPage drop={openDrop} me={me} rewards={rewards} wallet={wallet} onClose={() => setDropOpen(null)} onWear={onWear} onRefresh={refresh} onOpenWallet={onOpenWallet} />}
    </div>
    </>
  );
}
export function ChipPaySheet({ uid, g, toName, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const w = useWallet(uid);
  const coins = w ? w.coins : 0;
  const rest = Math.max(0, g.price - g.raised);
  const top = Math.max(1, Math.min(rest, coins));
  const [n, setN] = useState(() => Math.max(1, Math.min(top, Math.ceil(rest / Math.max(1, g.people.filter((p) => !(p.c > 0)).length)))));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pay = async () => {
    if (busy || n < 1 || n > coins) return;
    if (!(await spendGate(`Chip in ${coinsText(n)} for ${toName}'s gift`, { coins: n, send: true }))) return;
    setBusy(true);
    setErr('');
    hapticTap();
    const before = gfCardMem.chip.get(String(g.id));
    gfCardPut('chip', { ...g, raised: Math.min(g.price, g.raised + n), people: g.people.map((p) => (String(p.u) === String(uid) ? { ...p, c: (Number(p.c) || 0) + n, at: new Date().toISOString() } : p)) });
    const r = await moneyRun(uid, { coins: n, run: async () => {
      const x = await giftRpc('zchat_chip_pay', { p_gift: g.id, p_coins: n }, 'Group gift');
      return x.error ? { error: x.error, row: x.row } : { ok: true, coins: x.row.balance, row: x.row };
    } });
    setBusy(false);
    if (r.error) { gfCardPut('chip', (r.row && r.row.gift) || before || g); setErr(r.error); return; }
    gfCardPut('chip', r.row.gift);
    if (r.row.gift && r.row.gift.status === 'sent' && g.to) sendPushNotification(g.to, 'ZChat', 'Your friends sent you a gift', '/?requests=1');
    playUiSound(r.row.gift && r.row.gift.status === 'sent' ? 'win' : 'like');
    onClose();
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 4px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>Chip in for {toName}</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div style={{ padding: '4px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '6px 0 2px' }}><CoinIcon size={32} /><span style={{ fontSize: 42, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{formatCount(n)}</span></div>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: theme.muted }}>{`${formatCount(rest)} still needed, you have ${formatCount(coins)}`}</div>
            <div style={{ padding: '14px 4px 4px' }}><KitSlider value={Math.min(n, top)} min={1} max={top} step={1} label="Coins to add" onChange={(v) => { setN(v); setErr(''); }} /></div>
            {rest <= coins && rest > 1 && n !== rest && <div role="button" aria-label={`Pay the rest, ${formatCount(rest)} coins`} onClick={() => { hapticTap(); setN(rest); }} className="zchat-press" style={{ marginTop: 10, height: 42, borderRadius: 13, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14.5, fontWeight: 650, cursor: 'pointer' }}>Pay the rest, {formatCount(rest)} coins</div>}
            {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
            <div style={{ marginTop: 14 }}><BigButton label={busy ? 'Adding' : coins < 1 ? 'You have no coins yet' : `Add ${formatCount(n)} ${n === 1 ? 'coin' : 'coins'}`} disabled={busy || coins < 1} onClick={pay} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
function santaLocal(ms) {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function SantaStartPage({ group, onClose, onStart }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const base = (() => { const d = new Date(Date.now() + 2 * 86400000); d.setHours(20, 0, 0, 0); return d.getTime(); })();
  const [budget, setBudget] = useState(500);
  const [joinAt, setJoinAt] = useState(() => santaLocal(base));
  const [openAt, setOpenAt] = useState(() => santaLocal(base + 5 * 86400000 - 2 * 3600000));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const j = Date.parse(joinAt);
  const o = Date.parse(openAt);
  const bad = !Number.isFinite(j) || j < Date.now() + 10 * 60000 ? 'Give people at least 10 minutes to join.' : !Number.isFinite(o) || o < j + 3600000 ? 'Gifts open at least an hour after joining closes.' : '';
  const go = async () => {
    if (busy || bad) return;
    setBusy(true);
    setErr('');
    hapticTap();
    const r = await onStart({ budget, join: new Date(j).toISOString(), reveal: new Date(o).toISOString(), note: note.trim() || null });
    setBusy(false);
    if (r && r.error) setErr(r.error);
  };
  const field = { ...inputStyle(theme), fontSize: 15.5, colorScheme: theme.dark ? 'dark' : 'light' };
  return (
    <FullPage title="Secret Santa" onBack={onClose} zIndex={95}
      footer={<BigButton label={busy ? 'Starting' : 'Start Secret Santa'} disabled={busy || !!bad} onClick={go} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 6px 4px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: theme.dark ? 'rgba(239,75,90,0.16)' : '#FFEEF0', color: '#E5484D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SantaHatIcon size={34} /></div>
        <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, marginTop: 12, maxWidth: 340 }}>{`Everyone in ${group.name || 'the group'} who joins draws one name. Only you see who you give to, then all the gifts open together on the day.`}</div>
      </div>
      <KitSection title="Budget">
        <SegmentedControl value={budget} onChange={(v) => { hapticTap(); setBudget(v); }} options={[[100, '100'], [250, '250'], [500, '500'], [1000, '1,000']]} />
        <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0' }}>{`Each gift comes from the Shop and costs up to ${formatCount(budget)} coins.`}</div>
      </KitSection>
      <KitSection title="Joining closes">
        <input type="datetime-local" value={joinAt} min={santaLocal(Date.now() + 11 * 60000)} onChange={(ev) => { setJoinAt(ev.target.value); setErr(''); }} aria-label="Joining closes" style={field} />
      </KitSection>
      <KitSection title="Gifts open">
        <input type="datetime-local" value={openAt} min={Number.isFinite(j) ? santaLocal(j + 3600000) : undefined} onChange={(ev) => { setOpenAt(ev.target.value); setErr(''); }} aria-label="Gifts open" style={field} />
      </KitSection>
      <KitSection title="Note">
        <input value={note} onChange={(ev) => setNote(ev.target.value.slice(0, 120))} placeholder="Something for the group, like a theme" aria-label="Note for the group" style={field} />
      </KitSection>
      {(err || bad) && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '12px 2px 0' }}>{err || bad}</div>}
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '12px 2px 20px', lineHeight: 1.5 }}>It needs at least 3 people. Names are drawn when joining closes, so nobody gets themselves. The coins for a gift leave your wallet when you pick it, and come back if it is cancelled.</div>
    </FullPage>
  );
}
const TIP_AMOUNTS = [10, 50, 100, 500];
const TIP_MAX = 5000;
export function TipSheet({ uid, post, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const w = useWallet(uid);
  const drag = useSheetDrag(onClose);
  const owner = post.owner || {};
  const first = String(owner.name || '').split(' ')[0] || 'them';
  const [amount, setAmount] = useState(50);
  const [text, setText] = useState('50');
  const [noteText, setNoteText] = useState('');
  const balance = w && w.ready ? w.coins : 0;
  const valid = amount >= 1 && amount <= TIP_MAX;
  const enough = valid && balance >= amount;
  const commit = (raw) => {
    const digits = String(raw).replace(/[^0-9]/g, '').slice(0, 4);
    setText(digits);
    const n = Math.min(TIP_MAX, Number(digits) || 0);
    setAmount(n);
  };
  const go = async () => {
    if (!enough) return;
    if (!(await spendGate(`Tip ${first} ${coinsText(amount)}`, { coins: amount, send: true }))) return;
    onSend(amount, noteText.trim().slice(0, 80));
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 760, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '90%', background: theme.panelBg, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ flexShrink: 0, touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 6px' }}>
              <Avatar emoji={owner.avatar} name={owner.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`Tip ${first}'s post`}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: theme.muted, marginTop: 1 }}><CoinIcon size={14} />{`You have ${coinsText(balance)}`}</div>
              </div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0 2px', cursor: 'text' }}>
              <CoinIcon size={34} />
              <input value={text} inputMode="numeric" pattern="[0-9]*" aria-label="Number of coins" onChange={(e) => commit(e.target.value)} onBlur={() => { if (!text || Number(text) < 1) { setText(String(amount || 50)); if (!amount) setAmount(50); } }}
                style={{ width: `${Math.max(2, text.length) * 0.62 + 0.4}em`, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 46, fontWeight: 750, letterSpacing: '-0.02em', textAlign: 'center', padding: 0, fontVariantNumeric: 'tabular-nums' }} />
            </label>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: valid && !enough ? theme.danger : theme.muted, marginTop: 2 }}>{valid && !enough ? `You have ${coinsText(balance)}` : `Up to ${TIP_MAX.toLocaleString('en-US')} coins a day`}</div>
            <SegmentedControl style={{ marginTop: 16 }} value={TIP_AMOUNTS.includes(amount) ? amount : null} onChange={(n) => { hapticTap(); setAmount(n); setText(String(n)); }} options={TIP_AMOUNTS.map((n) => [n, formatCount(n)])} />
            <input value={noteText} onChange={(e) => setNoteText(e.target.value.slice(0, 80))} placeholder="Add a note" aria-label="Tip note" enterKeyHint="send" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }} style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 14 }} />
            <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', lineHeight: 1.5 }}>{`The coins go to ${first} right away. Only ${first} sees your tip and note. Nothing shows on the post.`}</div>
          </div>
          <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
            <BigButton label={!valid ? 'Pick an amount' : enough ? `Tip ${coinsText(amount)}` : `You need ${moreCoinsText(amount - balance)}`} disabled={!enough} onClick={go} />
          </div>
        </div>
      </div>
    </Portal>
  );
}
function announceCollections() { try { window.dispatchEvent(new Event('zchat-collections')); } catch {} }
async function createCollection(uid, name) {
  const { data, error } = await supabase.from('saved_collections').insert({ user_id: uid, name: name.trim().slice(0, 40) }).select().single();
  if (error || !data) return null;
  collectionsMem.list = [...(collectionsMem.list || []), data];
  announceCollections();
  return data;
}
async function setPostCollection(uid, postId, collectionId) {
  const { error } = await supabase.from('saved_posts').upsert({ user_id: uid, post_id: postId, collection_id: collectionId || null }, { onConflict: 'user_id,post_id' });
  if (!error) announceCollections();
  return !error;
}

export function CollectionPickSheet({ uid, post, onClose, onDone }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [list, setList] = useState(() => (collectionsMem.uid === uid ? collectionsMem.list : null));
  const [current, setCurrent] = useState(undefined);
  const [making, setMaking] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    loadCollections(uid, true).then((l) => { if (alive) setList(l); });
    supabase.from('saved_posts').select('collection_id').eq('user_id', uid).eq('post_id', post.id).maybeSingle().then(({ data }) => { if (alive) setCurrent(data ? data.collection_id || null : null); }, () => {});
    return () => { alive = false; };
  }, [uid, post.id]);
  const pick = async (col) => {
    if (busy) return;
    setBusy(true);
    const ok = await setPostCollection(uid, post.id, col ? col.id : null);
    setBusy(false);
    hapticTap();
    if (ok) onDone(col ? `Saved to ${col.name}` : 'Saved');
    else onDone('Collections switch on once the latest ZChat setup is finished');
  };
  const make = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const col = await createCollection(uid, n);
    setBusy(false);
    if (!col) { onDone('Collections switch on once the latest ZChat setup is finished'); return; }
    pick(col);
  };
  const thumb = postThumbOf(post);
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 760, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, color: theme.ink, padding: '6px 20px 12px' }}>{making ? 'New collection' : 'Save to collection'}</div>
          {making ? (
            <div style={{ padding: '4px 20px 6px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 92, height: 92, borderRadius: 14, overflow: 'hidden', background: theme.soft }}>{thumb && thumb.url && <img src={thumb.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
              </div>
              <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} onKeyDown={(e) => { if (e.key === 'Enter') make(); }} placeholder="Collection name" aria-label="Collection name" style={{ ...inputStyle(theme), fontSize: 16, textAlign: 'center' }} />
              <div style={{ marginTop: 14 }}><BigButton label={busy ? 'Saving' : 'Save'} disabled={!name.trim() || busy} onClick={make} /></div>
            </div>
          ) : (
            <div data-sheet-scroll="true" style={{ overflowY: 'auto', padding: '0 8px' }}>
              {list === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner color={theme.muted} /></div> : (
                <>
                  <div role="button" aria-label="All posts" onClick={() => pick(null)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderRadius: 12, cursor: 'pointer' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: theme.soft, flexShrink: 0 }}>{thumb && thumb.url && <img src={thumb.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                    <div style={{ flex: 1, fontSize: 15.5, fontWeight: 600, color: theme.ink }}>All posts</div>
                    {current === null && <Check size={20} color={theme.coral} strokeWidth={2.6} />}
                  </div>
                  {list.map((col) => (
                    <div key={col.id} role="button" aria-label={`Save to ${col.name}`} onClick={() => pick(col)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderRadius: 12, cursor: 'pointer' }}>
                      <div style={{ width: 52, height: 52, borderRadius: 10, background: theme.soft, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted }}><Bookmark size={20} /></div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</div>
                      {current === col.id && <Check size={20} color={theme.coral} strokeWidth={2.6} />}
                    </div>
                  ))}
                  <div role="button" aria-label="New collection" onClick={() => setMaking(true)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 12px', borderRadius: 12, cursor: 'pointer', color: theme.coral }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, border: `1.5px solid ${theme.soft2}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={22} /></div>
                    <div style={{ fontSize: 15.5, fontWeight: 600 }}>New collection</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}


function StoryArchiveIcon({ size = 24, color = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.4" /><path d="M3.5 3.8v4.6h4.6" /><path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function MeTab({ asPage = false, covered = false, onCoins, onQuestions, onClose, me, counts, onOpenProfile, onEditProfile, onSettings, onCollection, onShop, onSaved, onArchive, onMail, onRequests, onDiscover, onSwitchAccount, onShare, onInvite, onGames, onReminders, onStoryArchive, onSearchMessages, onScan, onMentions, onUsage, onStatus, onHidden, onMemories, onRecap, onAvatar, onChannels, onBroadcast, onMap, onVisitors, onCreateAi, onCharacters }) {
  const { theme } = useTheme();
  const c = igPalette(theme);
  const [social, setSocial] = useState(() => { try { return JSON.parse(localStorage.getItem('zchat-me-social') || 'null') || { followers: 0, following: 0, posts: 0 }; } catch { return { followers: 0, following: 0, posts: 0 }; } });
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ count: followers }, { count: following }, { count: posts }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', me.id).eq('status', 'accepted'),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', me.id).eq('status', 'accepted'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', me.id),
      ]);
      if (!alive) return;
      const next = { followers: followers || 0, following: following || 0, posts: posts || 0 };
      setSocial(next);
      try { localStorage.setItem('zchat-me-social', JSON.stringify(next)); } catch {}
    })();
    return () => { alive = false; };
  }, [me.id]);
  const badge = (n) => (n > 0 ? <span style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: theme.danger, color: 'white', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n > 99 ? '99+' : n}</span> : undefined);
  const tapThen = (fn) => () => { playUiSound('tap'); if (fn) fn(); };
  const pfOpen = (k) => () => { playUiSound('tap'); if (onClose) onClose(); setTimeout(() => { try { window.dispatchEvent(new CustomEvent('zchat-pf-open', { detail: k })); } catch {} }, 80); };
  const btn = (label, icon, onClick, ariaLabel) => (
    <div role="button" aria-label={ariaLabel || label} onClick={() => { playUiSound('tap'); onClick(); }} className="zchat-press" style={{ flex: 1, height: 38, borderRadius: 10, background: c.field, color: c.fg, fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>{icon}{label}</div>
  );
  useBackClose(asPage, onClose || (() => {}));
  const body = (
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 20, WebkitOverflowScrolling: 'touch' }}>
        {asPage && (
          <div style={{ paddingTop: 2 }}>
            <DetailSection>
              <DetailRow icon={<SettingsIcon />} label="Settings" onClick={tapThen(onSettings)} last />
            </DetailSection>
          </div>
        )}
        {!asPage && <>
        <div role="button" aria-label="Open my profile" onClick={onOpenProfile} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px 12px', cursor: 'pointer' }}>
          <Avatar emoji={me.avatar} name={me.name} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, letterSpacing: '-0.01em' }}><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</span><VerifiedBadge tier={me.verified} custom={me.custom_badge} size={16} /></div>
            <div style={{ fontSize: 14, color: theme.muted, marginTop: 1 }}>@{me.username}</div>
            {me.bio && <div data-zuser="" style={{ fontSize: 13, color: theme.ink, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.85 }}>{me.bio}</div>}
          </div>
          <ChevronRight size={20} color={c.faint} />
        </div>
        <div style={{ display: 'flex', padding: '0 16px 12px' }}>
          {[[social.posts, social.posts === 1 ? 'post' : 'posts'], [social.followers, social.followers === 1 ? 'follower' : 'followers'], [social.following, 'following']].map(([n, l]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em' }}>{formatCount(n)}</div>
              <div style={{ fontSize: 12.5, color: theme.muted, fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '0 16px 6px' }}>
          {btn('Edit profile', <Edit3 size={16} strokeWidth={1.9} />, onEditProfile)}
          {btn('Share profile', <Share2 size={16} strokeWidth={1.9} />, onShare)}
        </div>
        </>}
        {onStatus && (() => {
          const st = activeStatusOf(me);
          return (
            <div style={{ padding: asPage ? '10px 16px 0' : '4px 16px 0' }}>
              <div role="button" aria-label="Set your status" onClick={tapThen(onStatus)} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: c.field, cursor: 'pointer' }}>
                <span style={{ width: 22, display: 'flex', justifyContent: 'center', fontSize: 17, color: theme.muted }}>{st ? (st.e || '\u{1F4AC}') : <Plus size={17} />}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: st ? theme.ink : theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st ? st.t : 'Set a status'}</span>
                {me.away_on && <span style={{ fontSize: 11.5, fontWeight: 800, color: theme.coral, flexShrink: 0 }}>Away message on</span>}
                <ChevronRight size={17} color={c.faint} style={{ flexShrink: 0 }} />
              </div>
            </div>
          );
        })()}
        {asPage && (
          <DetailSection title="Your profile">
            {detailRows([
              <DetailRow icon={<LineGlyph k="cake" size={22} />} label="Birthday" onClick={pfOpen('birthday')} />,
              <DetailRow icon={<LineGlyph k="note" size={22} />} label="Profile song" onClick={pfOpen('song')} />,
              <DetailRow icon={<Mic />} label="Voice intro" onClick={pfOpen('voice')} />,
              <DetailRow icon={<LineGlyph k="image" size={22} />} label="Banner and photos" onClick={pfOpen('edit')} />,
            ])}
          </DetailSection>
        )}
        <DetailSection title="Your stuff" flush>
          <DetailTiles items={[
            { icon: <Bookmark />, label: 'Saved', aria: 'Saved messages and posts', onClick: tapThen(onSaved) },
            onStoryArchive ? { icon: <StoryArchiveIcon />, label: 'Archive', aria: 'Story archive', onClick: tapThen(onStoryArchive) } : null,
            { icon: <Archive />, label: 'Post archive', aria: 'Post archive', onClick: tapThen(() => psOpen({ k: 'archive' })) },
            onMemories ? { icon: <MemoriesIcon />, label: 'Memories', onClick: tapThen(onMemories) } : null,
            onRecap ? { icon: <RecapIcon />, label: 'Recap', aria: 'Year recap', value: String(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()), onClick: tapThen(onRecap) } : null,
            { icon: <CollectionIcon />, label: 'Collection', value: counts.rewards ? `${counts.rewards} unlocked` : null, onClick: tapThen(onCollection) },
            onShop ? { icon: <ShopBagIcon />, label: 'Shop', onClick: tapThen(onShop) } : null,
            onCoins ? { icon: <CoinIcon size={22} />, label: 'Coins', value: counts.coins != null ? formatCount(counts.coins) : null, onClick: tapThen(onCoins) } : null,
            onQuestions ? { icon: <QuestionIcon />, label: 'Questions', aria: 'Ask me anything questions', onClick: tapThen(onQuestions) } : null,
            onAvatar ? { icon: <AvatarMakerIcon />, label: 'Avatar', aria: 'AI avatar', onClick: tapThen(onAvatar) } : null,
            onCreateAi ? { icon: <AiSparkIcon />, label: 'Create', aria: 'Create with AI', onClick: tapThen(onCreateAi) } : null,
            onCharacters ? { icon: <AiCharIcon />, label: 'Characters', aria: 'AI characters', onClick: tapThen(onCharacters) } : null,
            { icon: <GamepadIcon />, label: 'Games', onClick: tapThen(onGames) },
            onUsage ? { icon: <Timer />, label: 'Time', aria: 'Time on ZChat', value: (() => { const m = Math.round((readUsage()[usageDayKey()] || 0) / 60); return m < 60 ? `${m} min today` : `${Math.floor(m / 60)} h ${m % 60} min`; })(), onClick: tapThen(onUsage) } : null,
          ]} />
        </DetailSection>
        <DetailSection title="Chats" flush>
          <DetailTiles items={[
            { icon: <Archive />, label: 'Archived', aria: 'Archived chats', badge: counts.archived || null, onClick: tapThen(onArchive) },
            onHidden ? { icon: <EyeOff />, label: 'Hidden', aria: 'Hidden chats', onClick: tapThen(onHidden) } : null,
            onReminders ? { icon: <Clock />, label: 'Reminders', badge: counts.reminders || null, onClick: tapThen(onReminders) } : null,
            onMentions ? { icon: <AtSign />, label: 'Mentions', onClick: tapThen(onMentions) } : null,
            onSearchMessages ? { icon: <Search />, label: 'Search', aria: 'Search messages', onClick: tapThen(onSearchMessages) } : null,
            { icon: <PhotoFindIcon />, label: 'Photos', aria: 'Search photos', onClick: tapThen(() => openPhotoTool('find')) },
          ]} />
        </DetailSection>
        <DetailSection title="Inbox">
          {detailRows([
            <DetailRow icon={<Bell />} label="Follow requests" onClick={tapThen(onRequests)} right={counts.requests ? <>{badge(counts.requests)}<ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} /></> : null} />,
            <DetailRow icon={<Mail />} label="Mail" onClick={tapThen(onMail)} right={counts.mail ? <>{badge(counts.mail)}<ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} /></> : null} />,
          ])}
        </DetailSection>
        <DetailSection title="People" flush>
          <DetailTiles items={[
            onMap ? { icon: <FriendsMapIcon />, label: 'Map', aria: 'Friends map', onClick: tapThen(onMap) } : null,
            onVisitors ? { icon: <Eye />, label: 'Visitors', aria: 'Profile visitors', onClick: tapThen(onVisitors) } : null,
            { icon: <Compass />, label: 'Discover', aria: 'Discover people', onClick: tapThen(onDiscover) },
            { icon: <UserPlus />, label: 'Invite', aria: 'Invite friends', onClick: tapThen(onInvite) },
            onScan ? { icon: <QrIcon />, label: 'Scan', aria: 'Scan a QR code', onClick: tapThen(onScan) } : null,
            onChannels ? { icon: <ChannelIcon />, label: 'Channels', onClick: tapThen(onChannels) } : null,
            onBroadcast ? { icon: <BroadcastIcon />, label: 'Broadcast', aria: 'Broadcast lists', onClick: tapThen(onBroadcast) } : null,
            { icon: <Users />, label: 'Accounts', aria: 'Switch account', onClick: tapThen(onSwitchAccount) },
          ]} />
        </DetailSection>
        {!asPage && (
          <DetailSection>
            <DetailRow icon={<SettingsIcon />} label="Settings" onClick={tapThen(onSettings)} last />
          </DetailSection>
        )}
        <div style={{ textAlign: 'center', fontSize: 12, color: c.faint, padding: '22px 16px 8px' }}>ZChat {APP_VERSION}</div>
      </div>
  );
  if (asPage) return <FullPage title="Settings and more" onBack={onClose} zIndex={24} portal={false} pad={false}>{body}</FullPage>;
  return (
    <div className="zchat-tab-in" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <HomeHeader title="Me" right={<HeaderIconButton label="Settings" onClick={onSettings}><SettingsIcon /></HeaderIconButton>} />
      {body}
    </div>
  );
}
function RecapIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /><circle cx="19" cy="6" r="2" />
    </svg>
  );
}

function MemoriesIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M3 10h18V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h7" /><path d="M8 2v4" /><path d="M16 2v4" /><path d="M21.29 14.7a2.43 2.43 0 0 0-2.65-.52c-.3.12-.57.3-.8.53l-.34.34-.35-.34a2.43 2.43 0 0 0-2.65-.53c-.3.12-.56.3-.79.53-.95.94-1 2.53.2 3.74L17.5 22l3.6-3.55c1.2-1.21 1.14-2.8.19-3.74Z" />
    </svg>
  );
}

const STATUS_PRESETS = [['\u{1F4DA}', 'In class'], ['\u{1F4BC}', 'At work'], ['\u{1F3AE}', 'Gaming'], ['\u{1F634}', 'Sleeping'], ['\u{1F3C3}', 'At the gym'], ['✈️', 'Travelling'], ['\u{1F37F}', 'Watching a movie'], ['\u{1F3A7}', 'Listening to music'], ['\u{1F697}', 'Driving'], ['\u{1F515}', 'Busy, reply later']];
const STATUS_EMOJIS = ['\u{1F60A}', '\u{1F4DA}', '\u{1F4BC}', '\u{1F3AE}', '\u{1F634}', '\u{1F3C3}', '✈️', '\u{1F37F}', '\u{1F3A7}', '\u{1F697}', '\u{1F515}', '❤️', '\u{1F389}', '☕', '\u{1F334}', '\u{1F60E}'];
const STATUS_TIMES = [['30 minutes', 1800000], ['1 hour', 3600000], ['4 hours', 14400000], ['Today', 'today'], ['This week', 'week'], ['Pick a time', 'pick'], ['Until I clear it', null]];
const STATUS_WHO = [['everyone', 'Everyone', 'Anyone who sees you on ZChat'], ['followers', 'Followers', 'People who follow you'], ['close', 'Close friends', 'Only people on your close friends list'], ['nobody', 'Nobody', 'Only you']];
function statusUntilFor(v, picked) {
  if (v === null) return null;
  if (v === 'today') { const d = new Date(); d.setHours(23, 59, 0, 0); return d.getTime() - Date.now() < 300000 ? new Date(Date.now() + 1800000).toISOString() : d.toISOString(); }
  if (v === 'week') { const d = new Date(); const add = (7 - d.getDay()) % 7 || 7; d.setDate(d.getDate() + add); d.setHours(23, 59, 0, 0); return d.toISOString(); }
  if (v === 'pick') { const t = Date.parse(picked || ''); return Number.isFinite(t) ? new Date(t).toISOString() : null; }
  return new Date(Date.now() + v).toISOString();
}
function statusLeftLabel(iso) {
  if (!iso) return 'Stays until you clear it';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Cleared';
  const h = Math.round(ms / 3600000);
  if (h < 1) return `Clears in ${Math.max(1, Math.round(ms / 60000))} min`;
  if (h < 24) return `Clears in ${h} ${h === 1 ? 'hour' : 'hours'}`;
  const d = Math.round(h / 24);
  return `Clears in ${d} ${d === 1 ? 'day' : 'days'}`;
}
export function StatusSheet({ me, onClose, onSaved }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const cur = activeStatusOf(me);
  const [emoji, setEmoji] = useState(cur ? cur.e : '\u{1F60A}');
  const [text, setText] = useState(cur ? cur.t : '');
  const [time, setTime] = useState('today');
  const [picked, setPicked] = useState(() => localInputValue(new Date(Math.ceil((Date.now() + 7200000) / 900000) * 900000)));
  const [who, setWho] = useState(() => (me.zstatus && STATUS_WHO.some(([k]) => k === me.zstatus.a) ? me.zstatus.a : 'everyone'));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pickEmoji, setPickEmoji] = useState(false);
  const listedEmoji = STATUS_EMOJIS.find((x) => x.replace(/\uFE0F/g, '') === String(emoji || '').replace(/\uFE0F/g, '')) || null;
  const save = async (clear) => {
    if (busy) return;
    const t = clear ? null : text.replace(/\s+/g, ' ').trim().slice(0, 60) || null;
    if (!clear && !t) { setErr('Write a few words'); return; }
    const until = clear ? null : statusUntilFor(time, picked);
    if (!clear && time === 'pick') {
      const ms = until ? Date.parse(until) - Date.now() : -1;
      if (ms < 60000) { setErr('Pick a time later than now'); return; }
      if (ms > 30 * 86400000) { setErr('Pick a time in the next 30 days'); return; }
    }
    const e = clear ? null : emoji || null;
    const pub = who === 'everyone';
    const z = { e, t, u: until, a: who, at: new Date(Math.max(Date.now(), statusAt(statusLive.get(me.id)) + 1, statusAt(me.zstatus) + 1)).toISOString() };
    const patch = { status_text: pub ? t : null, status_emoji: pub && t ? e : null, status_until: pub ? until : null, zstatus: z };
    const before = { status_text: me.status_text || null, status_emoji: me.status_emoji || null, status_until: me.status_until || null, zstatus: me.zstatus || null };
    const prevLive = statusLive.get(me.id) || null;
    setErr('');
    hapticTap();
    statusNote(me.id, z);
    onSaved(patch);
    onClose();
    let { data, error } = await supabase.rpc('zchat_status_set', { p_emoji: e, p_text: t, p_until: until, p_audience: who });
    if (error && profileFnMissing(error) && pub) ({ error } = await supabase.from('profiles').update({ status_text: t, status_emoji: t ? e : null, status_until: until }).eq('id', me.id));
    else if (error && profileFnMissing(error)) error = { message: 'status setup' };
    if (error) {
      statusLive.delete(me.id);
      if (prevLive) statusNote(me.id, prevLive);
      patchMyProfile(me.id, before);
      appSnack(/status setup|column|schema/i.test(String(error.message || '')) ? 'Choosing who sees your status switches on once the latest ZChat setup is finished.' : friendlyError(error, 'Your status could not be saved. Try again.'));
      return;
    }
    if (data && data.at) statusNote(me.id, { e: data.e || null, t: data.t || null, u: data.u || null, a: data.a, at: data.at });
  };
  return (
    <FullPage title="Your status" subtitle="Shows on your profile and in chats" onBack={onClose} zIndex={72}
      footer={<div style={{ display: 'flex', gap: 8 }}>{cur && <BigButton label="Clear" tone="plain" onClick={() => save(true)} style={{ flex: '0 0 110px' }} />}<BigButton label={busy ? 'Saving' : 'Set status'} disabled={busy} onClick={() => save(false)} /></div>}>
      <div style={{ position: 'relative', marginTop: 14 }}>
        <span aria-hidden="true" style={{ position: 'absolute', left: 14, top: 0, bottom: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}><StatusMark e={emoji} size={22} /></span>
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} placeholder="What are you up to?" aria-label="Status text" style={{ ...inputStyle(theme), paddingLeft: 48 }} />
      </div>
      <KitSection title="Icon">
        <PickTiles label="Status icon" size={54} bleed={16} value={listedEmoji || (emoji ? 'more' : null)} onChange={(k) => { if (k === 'more') setPickEmoji(true); else setEmoji(k); }}
          options={[...STATUS_EMOJIS.map((e) => { const g = statusGlyphOf(e); return { k: e, label: g ? g[2] : e, aria: `Emoji ${e}`, art: g ? <LineGlyph k={g[0]} size={26} color={g[1]} /> : <span style={{ fontSize: 24 }}>{e}</span> }; }),
            { k: 'more', label: emoji && !listedEmoji ? 'Yours' : 'More', aria: 'Pick status emoji', art: emoji && !listedEmoji ? <span style={{ fontSize: 25, lineHeight: 1 }}>{emoji}</span> : <LineGlyph k="emojiadd" size={26} /> }]} />
      </KitSection>
      <KitSection title="Ideas">
        <ChoiceList label="Status ideas" value={STATUS_PRESETS.some(([, t]) => t === text.trim()) ? text.trim() : null}
          onChange={(t) => { const p = STATUS_PRESETS.find(([, x]) => x === t); if (p) { setEmoji(p[0]); setText(p[1]); } }}
          options={STATUS_PRESETS.map(([e, t]) => ({ k: t, label: t, aria: `Use status ${t}`, icon: <StatusMark e={e} size={22} /> }))} />
      </KitSection>
      <KitSection title="Clear after">
        <ChoiceList label="Clear after" value={time === null ? 'keep' : time} onChange={(k) => { setErr(''); setTime(k === 'keep' ? null : k); }}
          options={STATUS_TIMES.map(([l, v]) => ({ k: v === null ? 'keep' : v, label: l, aria: v === null ? l : `Clear after ${l}` }))} />
        {time === 'pick' && (
          <input type="datetime-local" value={picked} min={localInputValue(new Date(Date.now() + 60000))} max={localInputValue(new Date(Date.now() + 30 * 86400000))} onChange={(e) => { setErr(''); setPicked(e.target.value); }} aria-label="Clear at" style={{ ...inputStyle(theme), marginTop: 8, colorScheme: theme.dark ? 'dark' : 'light' }} />
        )}
      </KitSection>
      <KitSection title="Who can see it">
        <ChoiceList label="Who can see your status" value={who} onChange={setWho}
          options={STATUS_WHO.map(([k, l, s]) => ({ k, label: l, sub: s }))} />
      </KitSection>
      {cur && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 2px 0', fontSize: 12.5, color: theme.muted }}>Now showing<StatusMark e={cur.e} size={15} /><span style={{ minWidth: 0 }}>{cur.t ? `${cur.t}, ${statusLeftLabel(cur.u).toLowerCase()}` : statusLeftLabel(cur.u)}</span></div>}
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
      {pickEmoji && <FullEmojiPicker onClose={() => setPickEmoji(false)} onPick={(e) => { setEmoji(e); setPickEmoji(false); }} />}
    </FullPage>
  );
}

const BIRTHDAY_SHOW = [['followers', 'My followers'], ['mutual', 'Friends who follow back'], ['everyone', 'Everyone'], ['nobody', 'Only me']];
export function BirthdaySheet({ userId, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const bdMem = birthdayRowMem.has(userId) ? birthdayRowMem.get(userId) : undefined;
  const bdParts = bdMem && bdMem.md ? bdMem.md.split('-').map((n) => parseInt(n, 10)) : null;
  const [row, setRow] = useState(bdMem);
  const [month, setMonth] = useState(bdParts && bdParts[0] ? bdParts[0] : 1);
  const [day, setDay] = useState(bdParts && bdParts[1] ? bdParts[1] : 1);
  const [show, setShow] = useState((bdMem && bdMem.show) || 'followers');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    let alive = true;
    supabase.from('birthdays').select('*').eq('user_id', userId).maybeSingle().then(({ data, error }) => {
      if (!alive) return;
      if (error) { setRow(null); setErr('Birthdays switch on once the latest ZChat setup is finished.'); return; }
      setRow(data || null);
      if (data && data.md) { const [m, d] = data.md.split('-').map((n) => parseInt(n, 10)); if (m) setMonth(m); if (d) setDay(d); setShow(data.show || 'followers'); }
    });
    return () => { alive = false; };
  }, [userId]);
  const daysIn = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  const md = `${String(month).padStart(2, '0')}-${String(Math.min(day, daysIn)).padStart(2, '0')}`;
  const announce = (r) => { try { window.dispatchEvent(new CustomEvent('zchat-birthday-changed', { detail: { uid: userId, row: r } })); } catch {} };
  const save = async () => {
    if (busy) return;
    const before = birthdayRowMem.has(userId) ? birthdayRowMem.get(userId) : (row || null);
    setErr('');
    hapticTap();
    announce({ md, show });
    onClose();
    const { error } = await supabase.from('birthdays').upsert({ user_id: userId, md, show, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) { announce(before || null); appSnack(friendlyError(error, 'Your birthday could not be saved. Try again.')); }
  };
  const remove = async () => {
    const before = birthdayRowMem.has(userId) ? birthdayRowMem.get(userId) : (row || null);
    announce(null);
    onClose();
    const { error } = await supabase.from('birthdays').delete().eq('user_id', userId);
    if (error) { announce(before || null); appSnack(friendlyError(error, 'Your birthday could not be removed. Try again.')); }
  };
  const sel = { ...inputStyle(theme), appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' };
  return (
    <FullPage title="Birthday" subtitle="Only the day and month, never the year" onBack={onClose} zIndex={72}
      footer={<div style={{ display: 'flex', gap: 8 }}>{row && <BigButton label="Remove" tone="plain" onClick={remove} style={{ flex: '0 0 110px' }} />}<BigButton label={busy ? 'Saving' : 'Save birthday'} disabled={busy || row === undefined} onClick={save} /></div>}>
      <div aria-hidden="true" style={{ textAlign: 'center', fontSize: 44, lineHeight: 1, padding: '20px 0 8px' }}>{'\u{1F382}'}</div>
      <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '0 10px 10px', textWrap: 'balance' }}>Friends get a little reminder on your day so they can wish you.</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))} aria-label="Birthday month" style={{ ...sel, flex: 2 }}>
          {MONTH_NAMES.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}
        </select>
        <select value={Math.min(day, daysIn)} onChange={(e) => setDay(parseInt(e.target.value, 10))} aria-label="Birthday day" style={{ ...sel, flex: 1 }}>
          {Array.from({ length: daysIn }).map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
      </div>
      <IgHeading>Who can see it</IgHeading>
      {BIRTHDAY_SHOW.map(([k, l]) => (
        <div key={k} role="button" aria-label={`Birthday visible to ${l}`} onClick={() => setShow(k)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', padding: '13px 2px', borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}>
          <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: theme.ink }}>{l}</span>
          {show === k && <Check size={18} color={theme.coral} strokeWidth={2.6} />}
        </div>
      ))}
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger }}>{err}</div>}
    </FullPage>
  );
}

export function NoteComposerSheet({ userId, mine, onClose, onSaved, country }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [song, setSong] = useState(() => (mine ? validSong(mine.song) : null));
  const [text, setText] = useState(() => (mine && !(song && mine.text === song.t) ? mine.text : ''));
  const [picker, setPicker] = useState(false);
  useEffect(() => { prefetchMusic(country); return () => stopSong(); }, []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const meRow = useMemo(() => readMeCache(userId), [userId]);
  const noteBg = theme.dark ? '#2A2A30' : '#FFFFFF';
  const share = async () => {
    const clean = (text.trim() || (song ? song.t : '')).slice(0, 60);
    if (!clean || busy) return;
    setErr('');
    stopSong();
    const now = new Date();
    const row = { user_id: userId, text: clean, created_at: now.toISOString(), expires_at: new Date(now.getTime() + 86400000).toISOString(), song: song || null };
    const before = mine || null;
    hapticTap();
    onSaved({ ...row });
    onClose();
    let { error } = await supabase.from('notes').upsert(row, { onConflict: 'user_id' });
    if (error && song && /song/i.test(String(error.message || ''))) {
      delete row.song;
      ({ error } = await supabase.from('notes').upsert(row, { onConflict: 'user_id' }));
      if (!error) onSaved({ ...row });
    }
    if (error) { onSaved(before); appSnack(/notes|schema|relation/i.test(String(error.message || '')) ? 'Notes switch on once the latest ZChat setup is finished.' : friendlyError(error, 'Your note could not be shared. Try again.')); }
  };
  const remove = async () => {
    const before = mine || null;
    onSaved(null);
    onClose();
    const { error } = await supabase.from('notes').delete().eq('user_id', userId);
    if (error) { onSaved(before); appSnack(friendlyError(error, 'Your note could not be deleted. Try again.')); }
  };
  return (
    <FullPage title="New note" subtitle="Mutual friends see it for 24 hours" onBack={onClose} zIndex={72}
      footer={<div style={{ display: 'flex', gap: 8 }}>{mine && <BigButton label="Delete" tone="plain" onClick={remove} style={{ flex: '0 0 110px' }} />}<BigButton label={busy ? 'Sharing' : 'Share note'} disabled={busy || (!text.trim() && !song)} onClick={share} /></div>}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 0 2px' }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 250, boxSizing: 'border-box', padding: '12px 18px', borderRadius: 22, marginBottom: 16, background: noteBg, boxShadow: theme.dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.06), 0 6px 18px rgba(0,0,0,0.1)', textAlign: 'center', fontSize: 16, fontWeight: 700, color: text.trim() || song ? theme.ink : theme.muted, wordBreak: 'break-word' }}>
          {song && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: theme.ink, marginBottom: text.trim() ? 4 : 0, minWidth: 0 }}><MusicNoteIcon size={14} color={theme.coral} style={{ flexShrink: 0 }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.t}</span></div>}
          {(text.trim() || !song) && <div>{text.trim() || 'Share a thought'}</div>}
          {song && !text.trim() && <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.muted, marginTop: 2 }}>{song.a}</div>}
          <span aria-hidden="true" style={{ position: 'absolute', left: 28, bottom: -8, width: 15, height: 15, borderRadius: '50%', background: noteBg }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 21, bottom: -17, width: 7, height: 7, borderRadius: '50%', background: noteBg, boxShadow: theme.dark ? 'none' : '0 1px 3px rgba(0,0,0,0.12)' }} />
        </div>
        <Avatar emoji={meRow && meRow.avatar} name={(meRow && meRow.name) || ''} size={72} />
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 7 }}>How friends see it</div>
      </div>
      <input value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} placeholder="What is on your mind?" aria-label="Note text" autoFocus style={{ ...inputStyle(theme), marginTop: 14, textAlign: 'center' }} />
      <div style={{ textAlign: 'center', fontSize: 12, color: theme.muted, padding: '6px 0 0' }}>{text.length}/60</div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        {song ? (
          <SongPill song={song} style={{ width: '100%' }} right={<div role="button" aria-label="Remove music" onClick={(e) => { e.stopPropagation(); stopSong(); setSong(null); }} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={16} /></div>} />
        ) : (
          <div role="button" aria-label="Add music" onClick={() => setPicker(true)} className="zchat-row-press" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '6px 4px', borderRadius: 12, cursor: 'pointer' }}>
            <span style={{ width: 28, display: 'flex', justifyContent: 'center', color: kitOnInk(theme), flexShrink: 0 }}><LineGlyph k="note" size={24} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15.5, fontWeight: 600, color: theme.ink }}>Add music</span>
              <span style={{ display: 'block', fontSize: 12.5, color: theme.muted, marginTop: 2 }}>Friends hear it when they open your note</span>
            </span>
            <ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} />
          </div>
        )}
      </div>
      {err && <div role="alert" style={{ padding: '12px 2px 0', fontSize: 13, fontWeight: 700, color: theme.danger, textAlign: 'center' }}>{err}</div>}
      {picker && <MusicPicker country={country} onClose={() => setPicker(false)} onPick={(s) => { setPicker(false); setSong(s); }} />}
    </FullPage>
  );
}

export function NoteReplySheet({ note, profile, onClose, onSend, onListen }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const ns = validSong(note.song);
  const playing = useSongPlaying();
  const songWaiting = useSongWait();
  useEffect(() => {
    if (ns && songPlayer.id !== ns.id) playSong(ns, true);
    return () => stopSong();
  }, []);
  const first = (profile.name || '').split(' ')[0];
  const send = async () => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    const ok = await onSend(clean);
    setBusy(false);
    if (ok) { setSent(true); hapticTap(); setTimeout(onClose, 900); }
  };
  const bubbleBg = theme.dark ? '#26262C' : '#FFFFFF';
  const showText = !ns || note.text !== ns.t;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 96, background: 'rgba(0,0,0,0.55)', WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', minHeight: 0 }}>
          <div className="zchat-pop" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 320, width: '100%' }}>
            <div style={{ position: 'relative', padding: showText ? '14px 20px' : '10px 12px', borderRadius: 24, background: bubbleBg, boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxWidth: '100%', boxSizing: 'border-box' }}>
              {showText && <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.35, color: theme.ink, textAlign: 'center', wordBreak: 'break-word' }}>{note.text}</div>}
              {ns && (
                <div role="button" aria-label={playing === ns.id ? 'Pause song' : 'Play song'} onClick={(e) => { e.stopPropagation(); toggleSong(ns); }} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: showText ? 10 : 0, padding: '7px 10px 7px 7px', borderRadius: 16, background: theme.rowBg, cursor: 'pointer', minWidth: 190 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, overflow: 'hidden', background: theme.border, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ns.art ? <img src={ns.art} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <MusicNoteIcon size={18} color={theme.muted} />}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ns.t}</div>
                    <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ns.a}</div>
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: theme.coral, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{playing === ns.id ? (songWaiting ? <Spinner size={13} color="#FFFFFF" /> : <SongBars color="#FFFFFF" size={13} />) : <Play size={15} fill="#FFFFFF" />}</div>
                </div>
              )}
              <span aria-hidden="true" style={{ position: 'absolute', left: 22, bottom: -7, width: 14, height: 14, borderRadius: '50%', background: bubbleBg }} />
              <span aria-hidden="true" style={{ position: 'absolute', left: 14, bottom: -16, width: 8, height: 8, borderRadius: '50%', background: bubbleBg }} />
            </div>
            <div style={{ marginTop: 24 }}><Avatar emoji={profile.avatar} name={profile.name} size={84} /></div>
            <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em', textAlign: 'center' }}>{profile.name}</div>
            <div style={{ marginTop: 3, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{timeAgoLong(note.created_at)}</div>
            {ns && onListen && (
              <div role="button" aria-label={`Listen together with ${first}`} onClick={(e) => { e.stopPropagation(); stopSong(); onListen(ns); }} className="zchat-press" style={{ marginTop: 16, height: 38, padding: '0 16px', borderRadius: 19, background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <ListenIcon size={17} />Listen together
              </div>
            )}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ padding: '0 16px calc(16px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
          {sent ? (
            <div role="status" className="zchat-pop" style={{ height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.14)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}><Check size={18} />Sent to {first}</div>
          ) : typing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={text} onChange={(e) => setText(e.target.value.slice(0, 500))} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } }} placeholder={`Reply to ${first}`} aria-label="Reply to note" autoFocus
                style={{ flex: 1, minWidth: 0, height: 50, borderRadius: 25, border: 'none', outline: 'none', background: theme.panelBg, color: theme.ink, padding: '0 18px', fontSize: 16, fontFamily: FONT, boxSizing: 'border-box' }} />
              <div role="button" aria-label="Send note reply" onClick={send} className="zchat-press" style={{ width: 50, height: 50, borderRadius: '50%', background: text.trim() ? theme.coral : 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{busy ? <Spinner size={16} /> : <Send size={19} color="#FFFFFF" />}</div>
            </div>
          ) : (
            <div role="button" aria-label={`Reply to ${first}`} onClick={() => setTyping(true)} className="zchat-press" style={{ height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>Reply to {first}</div>
          )}
        </div>
      </div>
    </Portal>
  );
}
export function MusicPicker({ onClose, onPick, country, title = 'Add music', zIndex = 130, picked }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [items, setItems] = useState(() => { const hit = musicMem.get(musicKey('', country)); return hit && hit.items ? hit.items.map(validSong).filter(Boolean) : null; });
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const seq = useRef(0);
  const playingId = useSongPlaying();
  const songWaiting = useSongWait();
  const search = async (term) => {
    const my = ++seq.current;
    setBusy(true);
    const r = await fetchMusic(term, country);
    if (my !== seq.current) return;
    setBusy(false);
    if (r.data && Array.isArray(r.data.items)) { setErr(''); setItems(r.data.items.map(validSong).filter(Boolean)); return; }
    setItems((old) => old || []);
    setErr(r.status === 400 && /unknown action/i.test(r.error || '') ? 'Music switches on once the ZChat tools are set up.' : toolErrorText(r, 'Music'));
  };
  useEffect(() => {
    const term = q.trim();
    const t = setTimeout(() => search(term), term && !musicMem.has(musicKey(term, country)) ? 380 : 0);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (!items || !items.length) return undefined;
    const t = setTimeout(() => items.slice(0, 3).forEach((s) => warmSong(s)), 250);
    return () => clearTimeout(t);
  }, [items]);
  useEffect(() => () => stopSong(), []);
  return (
    <FullPage title={title} onBack={onClose} zIndex={zIndex}>
      <div style={{ position: 'relative', margin: '6px 0 10px' }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search songs or artists" aria-label="Search songs" enterKeyHint="search" style={{ ...inputStyle(theme), paddingLeft: 38, paddingRight: 40 }} />
        {busy && items !== null && <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Spinner size={15} color={theme.muted} /></span>}
      </div>
      {!q.trim() && items && items.length > 0 && <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '4px 2px 4px' }}>Popular right now</div>}
      {items === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 34 }}><Spinner size={18} color={theme.muted} /></div>}
      {err && <div role="alert" style={{ fontSize: 13.5, color: theme.muted, padding: '14px 2px', textAlign: 'center' }}>{err}</div>}
      {items && !items.length && !err && !busy && <div style={{ fontSize: 13.5, color: theme.muted, padding: '18px 2px', textAlign: 'center' }}>No songs found. Try another name.</div>}
      <div role="list" aria-label="Songs">
        {(items || []).map((s) => {
          const on = playingId === s.id;
          return (
            <div key={s.id} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
              <div role="button" aria-label={`Use ${s.t}`} onClick={() => { stopSong(); onPick(s); }} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                {s.art ? <img src={s.art} alt="" loading="lazy" draggable={false} style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} /> : <div style={{ width: 50, height: 50, borderRadius: 10, background: theme.rowBg, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    {on && !songWaiting && <SongBars color={theme.coral} size={12} />}
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.t}</div>
                    {picked && picked.has(String(s.id)) && <Check size={15} color={theme.coral} strokeWidth={2.6} aria-label="Added" style={{ flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{s.a}</div>
                </div>
              </div>
              <div role="button" aria-label={on ? `Pause ${s.t}` : `Preview ${s.t}`} onClick={() => toggleSong(s)} className="zchat-press" style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${on ? theme.coral : theme.border}`, color: on ? theme.coral : theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                {on && songWaiting ? <Spinner size={15} color={theme.coral} /> : on ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
              </div>
            </div>
          );
        })}
      </div>
      {items && items.length > 0 && <div style={{ fontSize: 12, color: theme.muted, padding: '16px 2px 8px', textAlign: 'center' }}>Previews from Apple Music</div>}
    </FullPage>
  );
}

const CT_TONES = ['lilac', 'butter', 'mint', 'peach', 'sky', 'pink'];
function ctToneBg(theme, i) { const p = ART_BG[CT_TONES[i] || 'lilac'] || ART_BG.lilac; return theme.dark ? p[1] : p[0]; }
function ctPlayFrom(list, i) {
  if (!list.length) return;
  ctPlay.list = list;
  ctPlay.i = Math.max(0, Math.min(i, list.length - 1));
  ctPlay.on = true;
  playSong(list[ctPlay.i], true);
}
function ctPlayStop() { if (ctPlay.on || songPlayer.id) { ctPlay.on = false; stopSong(); } }
function ctSongOf(row) { const s = validSong(row && row.song); return s ? { ...s, id: String(row.song_id || s.id) } : null; }
function ctPlayCard(rows, name) {
  const n = rows.length;
  const s = rows.slice(0, 3).map((r) => { const x = r.song || {}; return { t: String(x.t || '').slice(0, 80), ...(x.a ? { a: String(x.a).slice(0, 60) } : {}), ...(x.art ? { art: x.art } : {}) }; });
  return `zplay:${JSON.stringify({ t: `${name} added ${n === 1 ? 'a song' : `${n} songs`} to your playlist`, n, s })}`;
}
function ctAddSongs(songs) {
  const c = ctHub.ctx;
  if (!c || !songs.length) return;
  const key = c.key;
  const e = ctEntry(key);
  const have = new Set((e.songs || []).map((r) => r.song_id));
  const fresh = songs.filter((s) => s && !have.has(String(s.id)));
  if (!fresh.length) { appSnack('Already in your playlist'); return; }
  const temps = fresh.map((s) => ({ id: ctTmp(), chat_key: key, song_id: String(s.id), song: { id: s.id, t: s.t, a: s.a || '', art: s.art || null, p: s.p, u: s.u || null }, added_by: c.uid, created_at: new Date().toISOString() }));
  e.songs = [...temps.slice().reverse(), ...(e.songs || [])];
  ctBumpCount(key, 'songs', temps.length);
  ctEmit();
  const q = ctHub.q.get(key) || { pend: [], busy: false };
  ctHub.q.set(key, q);
  q.pend.push(...temps);
  if (q.busy) return;
  q.busy = true;
  setTimeout(async () => {
    while (q.pend.length) {
      const batch = q.pend.splice(0, 25);
      try { await ctFlushSongs(c, key, batch); } catch {}
    }
    q.busy = false;
  }, 120);
}
async function ctFlushSongs(c, key, batch) {
  const e = ctEntry(key);
  const drop = (ids) => { e.songs = (e.songs || []).filter((r) => !ids.has(r.id)); };
  let res;
  try { res = await supabase.rpc('zchat_playlist_add', { p_key: key, p_songs: batch.map((t) => t.song) }); } catch (err) { res = { error: err }; }
  const d = res && !res.error ? res.data : null;
  if (!d || !d.ok) {
    drop(new Set(batch.map((t) => t.id)));
    ctBumpCount(key, 'songs', -batch.length);
    ctEmit();
    appSnack(ctErr(res && res.error, 'Those songs did not go in. Try again.'));
    return;
  }
  const rows = Array.isArray(d.rows) ? d.rows : [];
  const bySong = new Map(rows.map((r) => [r.song_id, r]));
  const gone = new Set();
  let list = (e.songs || []).map((r) => { if (!batch.some((t) => t.id === r.id)) return r; const real = bySong.get(r.song_id); if (!real) { gone.add(r.id); return r; } return real; });
  list = list.filter((r) => !gone.has(r.id));
  const seen = new Set();
  e.songs = list.filter((r) => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  if (gone.size) ctBumpCount(key, 'songs', -gone.size);
  ctEmit();
  if (d.full) appSnack('The playlist is full at 300 songs');
  if (!rows.length) return;
  if (d.card && d.card.id != null && d.card.content) { if (c.patchMessage) c.patchMessage(d.card.id, d.card.content); return; }
  if (c.key === key && c.sendCard) await c.sendCard(ctPlayCard(rows, ctFirst(c.me && c.me.name)), { quiet: true });
}
function ctRemove(kind, row) {
  const key = row && row.chat_key;
  if (!key || String(row.id).indexOf('tmp-') === 0) return;
  const e = ctEntry(key);
  const field = kind === 'song' ? 'songs' : kind === 'joke' ? 'jokes' : kind === 'board' ? 'board' : null;
  if (field) { e[field] = (e[field] || []).filter((r) => r.id !== row.id); ctBumpCount(key, field, -1); if (field === 'jokes') e.jv += 1; }
  if (kind === 'moment' && e.story && Array.isArray(e.story.moments)) e.story = { ...e.story, moments: e.story.moments.filter((x) => x.id !== row.id) };
  ctEmit();
  hapticTap();
  supabase.rpc('zchat_ct_remove', { p_kind: kind, p_id: row.id }).then(({ error }) => {
    if (!error) return;
    if (field) { e[field] = ctNewest([row, ...(e[field] || []).filter((r) => r.id !== row.id)]); ctBumpCount(key, field, 1); if (field === 'jokes') e.jv += 1; }
    if (kind === 'moment') ctLoad(key, 'story', true);
    ctEmit();
    appSnack(ctErr(error, 'That did not come off. Try again.'));
  }, () => { ctLoad(key, field || 'story', true); appSnack('That did not come off. Try again.'); });
}
function ctCanRemove(c, row, owner) {
  if (!c || !row) return false;
  return owner === c.uid || !!c.isAdmin;
}
function ctImageDims(url) {
  return new Promise((resolve) => {
    try {
      const im = new Image();
      im.onload = () => resolve({ w: im.naturalWidth || 0, h: im.naturalHeight || 0 });
      im.onerror = () => resolve({ w: 0, h: 0 });
      im.src = url;
    } catch { resolve({ w: 0, h: 0 }); }
  });
}
async function ctBoardPhoto(c, file) {
  const key = c.key;
  const local = URL.createObjectURL(file);
  const dims = await ctImageDims(local);
  const temp = { id: ctTmp(), chat_key: key, kind: 'photo', body: null, media_url: local, local, media_w: dims.w || null, media_h: dims.h || null, link_url: null, tone: 0, message_id: null, author_id: c.uid, pinned_by: c.uid, created_at: new Date().toISOString(), uploading: true };
  ctBoardPut(key, temp);
  let f = file;
  try { f = await prepareImageFile(file, local); } catch {}
  let up = null;
  try { up = await uploadChatMedia(f, c.uid, dims.w && dims.h ? dims : undefined); } catch { up = null; }
  if (!up || up.error || !up.url) { ctBoardSettle(key, temp.id, null); appSnack('That photo did not upload. Try again.'); return; }
  const e = ctEntry(key);
  if (e.board) e.board = e.board.filter((r) => r.id !== temp.id);
  temp.media_url = up.url;
  temp.uploading = false;
  ctBoardAdd(key, temp, { p_kind: 'photo', p_media: up.url, p_w: dims.w || null, p_h: dims.h || null });
}

function CtSkeletonRows({ n = 4, h = 50 }) {
  const { theme } = useTheme();
  const tone = theme.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  return (
    <div aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', animation: `zchat-skel 1.4s ease-in-out ${i * 0.12}s infinite` }}>
          <div style={{ width: h, height: h, borderRadius: 10, background: tone, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: `${52 + ((i * 17) % 30)}%`, height: 12, borderRadius: 6, background: tone }} />
            <div style={{ width: `${34 + ((i * 23) % 26)}%`, height: 10, borderRadius: 5, background: tone, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function CtSetupNote() {
  const { theme } = useTheme();
  return <div role="alert" style={{ fontSize: 13.5, color: theme.muted, padding: '18px 4px', textAlign: 'center', lineHeight: 1.5 }}>This switches on once the latest ZChat setup is finished.</div>;
}
function useCtPress(onLong) {
  const ref = useRef({ t: 0, fired: false });
  const start = (arg) => { clearTimeout(ref.current.t); ref.current.fired = false; ref.current.t = setTimeout(() => { ref.current.fired = true; hapticTap(); onLong(arg); }, 520); };
  const end = () => clearTimeout(ref.current.t);
  const tapped = () => { if (ref.current.fired) { ref.current.fired = false; return false; } return true; };
  return { start, end, tapped };
}

export function CtPlaylistPage({ c, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const [picker, setPicker] = useState(false);
  const [menu, setMenu] = useState(null);
  const playing = useSongPlaying();
  const waiting = useSongWait();
  const press = useCtPress((row) => setMenu(row));
  useEffect(() => { ctLoad(c.key, 'songs'); prefetchMusic(c.me && c.me.country); }, [c.key]);
  useEffect(() => () => ctPlayStop(), []);
  const rows = e.songs;
  const list = (rows || []).map((r) => ({ r, s: ctSongOf(r) })).filter((x) => x.s);
  const songs = list.map((x) => x.s);
  const mineOn = ctPlay.on && songs.some((s) => s.id === playing);
  const picked = useMemo(() => new Set((rows || []).map((r) => r.song_id)), [rows]);
  const together = (from) => { const q = songs.slice(from).concat(songs.slice(0, from)); if (!q.length) return; ctPlayStop(); onClose(); c.listen(q); };
  const who = (id) => (id === c.uid ? 'you' : ctFirst(c.nameOf(id)));
  const btn = (primary) => ({ flex: 1, height: 44, borderRadius: 14, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: FONT, fontSize: 15, fontWeight: 700, cursor: 'pointer', background: primary ? theme.coral : theme.rowBg, color: primary ? '#FFFFFF' : theme.ink });
  return (
    <FullPage title={c.dm ? 'Our playlist' : 'Playlist'} subtitle={c.chatName} onBack={onClose} zIndex={72}
      right={<div role="button" aria-label="Add songs" onClick={() => setPicker(true)} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={23} /></div>}>
      {rows === null ? <div style={{ paddingTop: 8 }}><CtSkeletonRows /></div> : e.err.songs === 'setup' && !list.length ? <CtSetupNote /> : !list.length ? (
        <EmptyState art="songs" title="No songs yet" text={c.dm ? 'Add songs you both love. Either of you can add more any time.' : 'Add songs for the group. Everyone here can add to it.'} action={<PillButton primary label="Add songs" onClick={() => setPicker(true)} />} />
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, padding: '8px 0 6px' }}>
            <button type="button" aria-label={mineOn ? 'Pause' : 'Play'} onClick={() => { hapticTap(); if (mineOn) pauseSong(); else ctPlayFrom(songs, 0); }} className="zchat-press" style={btn(false)}>
              {mineOn ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}{mineOn ? 'Pause' : 'Play'}
            </button>
            <button type="button" aria-label="Play together" onClick={() => together(0)} className="zchat-press" style={btn(true)}><ListenIcon size={18} />Play together</button>
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, padding: '6px 2px 4px' }}>{list.length === 1 ? '1 song' : `${list.length.toLocaleString('en-US')} songs`}{c.dm ? '' : ', added by everyone here'}</div>
          <div role="list" aria-label="Songs">
            {list.map(({ r, s }, i) => {
              const on = playing === s.id;
              return (
                <div key={r.id} role="listitem" onPointerDown={() => press.start(r)} onPointerUp={press.end} onPointerLeave={press.end} onPointerCancel={press.end}
                  onContextMenu={(ev) => { ev.preventDefault(); setMenu(r); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', opacity: String(r.id).indexOf('tmp-') === 0 ? 0.6 : 1, transition: 'opacity 200ms ease', WebkitTouchCallout: 'none', userSelect: 'none' }}>
                  <div role="button" aria-label={on ? `Pause ${s.t}` : `Play ${s.t}`} onClick={() => { if (!press.tapped()) return; if (on) pauseSong(); else ctPlayFrom(songs, i); }} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <SongArt song={s} size={50} radius={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {on && !waiting && <SongBars color={theme.coral} size={12} />}
                        <div style={{ fontSize: 15, fontWeight: 700, color: on ? theme.coral : theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.t}</div>
                      </div>
                      <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{s.a ? `${s.a}, ` : ''}added by {who(r.added_by)}</div>
                    </div>
                  </div>
                  <div role="button" aria-label={on ? `Pause ${s.t}` : `Preview ${s.t}`} onClick={() => { if (on) pauseSong(); else ctPlayFrom(songs, i); }} className="zchat-press" style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${on ? theme.coral : theme.border}`, color: on ? theme.coral : theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    {on && waiting ? <Spinner size={15} color={theme.coral} /> : on ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: theme.muted, padding: '16px 2px 8px', textAlign: 'center' }}>Previews from Apple Music. Hold a song for more.</div>
        </>
      )}
      {picker && <MusicPicker title="Add to playlist" country={c.me && c.me.country} picked={picked} onClose={() => setPicker(false)} onPick={(s) => { hapticTap(); ctAddSongs([s]); }} />}
      {menu && (() => {
        const s = ctSongOf(menu);
        if (!s) return null;
        const at = list.findIndex((x) => x.r.id === menu.id);
        return (
          <ChatRowSheet title={s.t} subtitle={`${s.a ? `${s.a}, ` : ''}added by ${who(menu.added_by)}`} avatar={<SongArt song={s} size={40} radius={9} />} zIndex={96} onClose={() => setMenu(null)}
            actions={[
              { icon: <ListenIcon size={18} />, label: 'Play together from here', onClick: () => together(Math.max(0, at)) },
              s.u ? { icon: <LinkIcon size={18} />, label: 'Open in Apple Music', onClick: () => { try { window.open(s.u, '_blank', 'noopener'); } catch {} } } : null,
              ctCanRemove(c, menu, menu.added_by) ? { icon: <Trash2 size={18} />, label: 'Remove from playlist', danger: true, onClick: () => ctRemove('song', menu) } : null,
            ]} />
        );
      })()}
    </FullPage>
  );
}
function ctShortAgo(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const m = Math.floor(Math.max(0, Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return fmtDate(new Date(t), new Date(t).getFullYear() === new Date().getFullYear() ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
function ctHostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }
function useCtLinkPreview(url) {
  const [d, setD] = useState(() => (url ? linkPreviewCache.get(url) || null : null));
  useEffect(() => {
    if (!url || dataSaverOn()) return undefined;
    if (linkPreviewCache.has(url)) { setD(linkPreviewCache.get(url)); return undefined; }
    let off = false;
    try { const s = sessionStorage.getItem(`zchat-lp-${url}`); if (s) { const v = JSON.parse(s); linkPreviewCache.set(url, v); setD(v); return undefined; } } catch {}
    supabase.functions.invoke('link-preview', { body: { url } }).then(({ data: res, error }) => {
      const v = !error && res && (res.title || res.image) ? res : { empty: true };
      linkPreviewCache.set(url, v);
      try { sessionStorage.setItem(`zchat-lp-${url}`, JSON.stringify(v)); } catch {}
      if (!off) setD(v);
    }, () => { linkPreviewCache.set(url, { empty: true }); });
    return () => { off = true; };
  }, [url]);
  return d && !d.empty ? d : null;
}
function CtBoardTile({ c, it, onOpen, press }) {
  const { theme } = useTheme();
  const pv = useCtLinkPreview(it.kind === 'link' ? it.link_url : null);
  const pending = String(it.id).indexOf('tmp-') === 0;
  const meta = `${it.pinned_by === c.uid ? 'You' : ctFirst(c.nameOf(it.pinned_by))}, ${ctShortAgo(it.created_at)}`;
  const shell = { display: 'block', width: '100%', marginBottom: 12, cursor: 'pointer', opacity: pending ? 0.7 : 1, transition: 'opacity 200ms ease', WebkitTouchCallout: 'none', userSelect: 'none' };
  const hold = { onPointerDown: () => press.start(it), onPointerUp: press.end, onPointerLeave: press.end, onPointerCancel: press.end, onContextMenu: (ev) => { ev.preventDefault(); press.menu(it); } };
  const open = () => { if (press.tapped()) onOpen(it); };
  let body = null;
  if (it.kind === 'photo') {
    const ratio = it.media_w && it.media_h ? `${it.media_w} / ${it.media_h}` : '4 / 5';
    body = (
      <>
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: theme.rowBg, aspectRatio: ratio }}>
          {it.local ? <img src={it.local} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <MediaImg src={it.media_url} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          {it.uploading && <span style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex' }}><Spinner size={15} /></span>}
        </div>
        {it.body && <div data-zuser="" style={{ fontSize: 13, color: theme.ink, lineHeight: 1.4, margin: '6px 2px 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{it.body}</div>}
      </>
    );
  } else if (it.kind === 'note') {
    body = (
      <div style={{ background: ctToneBg(theme, it.tone), borderRadius: 14, padding: '13px 13px 15px', boxShadow: theme.dark ? 'none' : '0 1px 2px rgba(0,0,0,0.06)' }}>
        <div data-zuser="" style={{ fontSize: 14.5, lineHeight: 1.45, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 9, WebkitBoxOrient: 'vertical' }}>{it.body}</div>
      </div>
    );
  } else if (it.kind === 'link') {
    const host = ctHostOf(it.link_url);
    const rest = String(it.body || '').replace(it.link_url, '').trim();
    body = (
      <div style={{ borderRadius: 14, border: `1px solid ${theme.border}`, background: detailsCardBg(theme), overflow: 'hidden' }}>
        {pv && pv.image && <div style={{ aspectRatio: '1.91 / 1', background: theme.rowBg }}><img src={pv.image} alt="" loading="lazy" draggable={false} onError={(ev) => { ev.currentTarget.parentElement.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>}
        <div style={{ padding: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: theme.muted, minWidth: 0 }}><LinkIcon size={13} style={{ flexShrink: 0 }} /><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(pv && pv.siteName) || host || 'Link'}</span></div>
          {pv && pv.title && <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, lineHeight: 1.35, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{pv.title}</div>}
          {rest && <div style={{ fontSize: 14, color: pv && pv.title ? theme.ink2 : theme.ink, lineHeight: 1.4, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: pv && pv.title ? 2 : 4, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{rest}</div>}
          {!(pv && pv.title) && <div style={{ fontSize: 12.5, color: kitOnInk(theme), marginTop: 6, wordBreak: 'break-all', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{it.link_url}</div>}
        </div>
      </div>
    );
  } else {
    body = (
      <div style={{ borderRadius: 14, border: `1px solid ${theme.border}`, background: detailsCardBg(theme), padding: '11px 12px 13px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 5 }}>{it.author_id === c.uid ? 'You said' : `${ctFirst(c.nameOf(it.author_id))} said`}</div>
        <div data-zuser="" style={{ fontSize: 14.5, lineHeight: 1.45, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 8, WebkitBoxOrient: 'vertical' }}>{it.body}</div>
      </div>
    );
  }
  return (
    <div role="button" aria-label={it.kind === 'photo' ? 'Open photo' : it.kind === 'link' ? 'Open link' : 'Open note'} onClick={open} {...hold} className="zchat-press" style={shell}>
      {body}
      <div style={{ fontSize: 11.5, color: theme.muted, margin: '5px 2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>
    </div>
  );
}
export function CtBoardPage({ c, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const [adding, setAdding] = useState(false);
  const [noteDraft, setNoteDraft] = useState(null);
  const [view, setView] = useState(null);
  const [ask, setAsk] = useState(null);
  const fileRef = useRef(null);
  const p = useCtPress((it) => { if (ctCanRemove(c, it, it.pinned_by) && String(it.id).indexOf('tmp-') !== 0) setAsk(it); });
  const press = { ...p, menu: (it) => { if (ctCanRemove(c, it, it.pinned_by) && String(it.id).indexOf('tmp-') !== 0) setAsk(it); } };
  useEffect(() => { ctLoad(c.key, 'board'); }, [c.key]);
  const items = (e.board || []).filter((it) => !(it.message_id != null && c.isGone(it.message_id)));
  const vw = typeof window !== 'undefined' ? Math.min(window.innerWidth, 900) : 390;
  const cols = vw >= 760 ? 3 : 2;
  const colW = (vw - 32 - 12 * (cols - 1)) / cols;
  const stacks = Array.from({ length: cols }).map(() => ({ h: 0, list: [] }));
  items.forEach((it) => {
    const lines = (t, per) => String(t || '').split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / per)), 0);
    const per = Math.max(8, Math.floor((colW - 26) / 7.6));
    const h = it.kind === 'photo' ? colW * (it.media_w && it.media_h ? it.media_h / it.media_w : 1.25) + (it.body ? 44 : 0)
      : it.kind === 'link' ? 70 + Math.min(4, lines(it.body, per)) * 20 + ((linkPreviewCache.get(it.link_url) || {}).image ? colW / 1.91 : 0) : 30 + Math.min(it.kind === 'text' ? 8 : 9, lines(it.body, per)) * 21 + (it.kind === 'text' ? 20 : 0);
    const st = stacks.reduce((a, b) => (b.h < a.h ? b : a), stacks[0]);
    st.list.push(it);
    st.h += h + 34;
  });
  const pinNote = () => {
    const d = noteDraft;
    const text = String((d && d.text) || '').trim();
    if (!text) return;
    setNoteDraft(null);
    hapticTap();
    ctBoardAdd(c.key, { id: ctTmp(), chat_key: c.key, kind: 'note', body: text.slice(0, 1200), media_url: null, link_url: null, tone: d.tone, message_id: null, author_id: c.uid, pinned_by: c.uid, created_at: new Date().toISOString() }, { p_kind: 'note', p_body: text.slice(0, 1200), p_tone: d.tone });
  };
  return (
    <FullPage title="Board" subtitle={c.chatName} onBack={onClose} zIndex={72}
      right={<div role="button" aria-label="Add to the board" onClick={() => setAdding(true)} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={23} /></div>}>
      {e.board === null ? <div style={{ paddingTop: 8 }}><CtSkeletonRows n={3} h={70} /></div> : e.err.board === 'setup' && !items.length ? <CtSetupNote /> : !items.length ? (
        <EmptyState art="saved" title="Nothing pinned yet" text="Keep the good stuff here: photos, tickets, addresses and plans. Hold a message and tap Add to board, or add something now." action={<PillButton primary label="Add something" onClick={() => setAdding(true)} />} />
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0 4px' }}>
          {stacks.map((st, i) => <div key={i} style={{ flex: 1, minWidth: 0 }}>{st.list.map((it) => <CtBoardTile key={it.id} c={c} it={it} press={press} onOpen={setView} />)}</div>)}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(ev) => { const files = Array.from(ev.target.files || []).slice(0, 10); ev.target.value = ''; files.forEach((f) => ctBoardPhoto(c, f)); if (files.length) hapticTap(); }} />
      {adding && (
        <ChatRowSheet title="Add to the board" onClose={() => setAdding(false)} zIndex={96}
          actions={[
            { icon: <ImageIcon size={18} />, label: 'Photo from your gallery', onClick: () => { if (fileRef.current) fileRef.current.click(); } },
            { icon: <NoteIcon size={18} />, label: 'Write a note', onClick: () => setNoteDraft({ text: '', tone: Math.floor(Math.random() * CT_TONES.length) }) },
          ]} />
      )}
      {noteDraft && (
        <ChatRowSheet title="New note" onClose={() => setNoteDraft(null)} zIndex={96} actions={[]}
          peek={(
            <div style={{ padding: '12px 18px 8px' }}>
              <textarea value={noteDraft.text} onChange={(ev) => setNoteDraft({ ...noteDraft, text: ev.target.value.slice(0, 1200) })} placeholder="A plan, an address, a list" aria-label="Note" autoFocus rows={5}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none', borderRadius: 14, padding: '13px 14px', background: ctToneBg(theme, noteDraft.tone), color: theme.ink, fontFamily: FONT, fontSize: 16, lineHeight: 1.45, transition: 'background 180ms ease' }} />
              <div role="radiogroup" aria-label="Note colour" style={{ display: 'flex', gap: 12, padding: '12px 2px 14px' }}>
                {CT_TONES.map((t, i) => (
                  <div key={t} role="radio" aria-checked={noteDraft.tone === i} aria-label={`${t[0].toUpperCase()}${t.slice(1)}`} onClick={() => setNoteDraft({ ...noteDraft, tone: i })} className="zchat-press"
                    style={{ width: 30, height: 30, borderRadius: '50%', background: ctToneBg(theme, i), boxShadow: noteDraft.tone === i ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : `inset 0 0 0 1px ${theme.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {noteDraft.tone === i && <Check size={15} color={theme.ink} strokeWidth={2.6} />}
                  </div>
                ))}
              </div>
              <BigButton label="Pin note" disabled={!noteDraft.text.trim()} onClick={pinNote} />
            </div>
          )} />
      )}
      {view && view.kind === 'photo' && <Portal><ImageViewer url={view.local || view.media_url} onClose={() => setView(null)} /></Portal>}
      {view && view.kind !== 'photo' && <CtBoardView c={c} it={view} onClose={() => setView(null)} onRemove={() => { const it = view; setView(null); ctRemove('board', it); }} />}
      {ask && <ConfirmSheet title="Remove from the board?" text="It is removed for everyone in the chat." confirmLabel="Remove" zIndex={97} onCancel={() => setAsk(null)} onConfirm={() => { const it = ask; setAsk(null); ctRemove('board', it); }} />}
    </FullPage>
  );
}
function CtBoardView({ c, it, onClose, onRemove }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const can = ctCanRemove(c, it, it.pinned_by) && String(it.id).indexOf('tmp-') !== 0;
  const by = it.pinned_by === c.uid ? 'you' : ctFirst(c.nameOf(it.pinned_by));
  const t = Date.parse(it.created_at);
  return (
    <FullPage title={it.kind === 'link' ? 'Link' : it.kind === 'note' ? 'Note' : 'From the chat'} subtitle={`Pinned by ${by}${Number.isFinite(t) ? `, ${fmtDate(new Date(t), { day: 'numeric', month: 'long' })}` : ''}`} onBack={onClose} zIndex={98}
      footer={it.message_id != null || it.kind === 'link' ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {it.message_id != null && <BigButton tone="plain" label="Show in chat" onClick={() => { onClose(); ctClose(); c.jump(it.message_id); }} />}
          {it.kind === 'link' && <BigButton label="Open link" onClick={() => { try { window.open(it.link_url, '_blank', 'noopener'); } catch {} }} />}
        </div>
      ) : null}
      right={can ? <div role="button" aria-label="Remove from the board" onClick={onRemove} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.muted }}><Trash2 size={19} /></div> : null}>
      <div style={{ margin: '10px 0', padding: it.kind === 'note' ? '18px 18px 22px' : '4px 2px', borderRadius: 18, background: it.kind === 'note' ? ctToneBg(theme, it.tone) : 'transparent' }}>
        {it.kind === 'text' && <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, marginBottom: 8 }}>{it.author_id === c.uid ? 'You said' : `${ctFirst(c.nameOf(it.author_id))} said`}</div>}
        <div style={{ fontSize: 18, lineHeight: 1.5, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><RichText text={it.body || it.link_url || ''} /></div>
        {it.kind === 'link' && <LinkPreviewCard url={it.link_url} />}
      </div>
    </FullPage>
  );
}

export function CtJokeEditSheet({ c, joke, initial, onClose, onSaved }) {
  const { theme } = useTheme();
  const [phrase, setPhrase] = useState((joke && joke.phrase) || initial || '');
  const [meaning, setMeaning] = useState((joke && joke.meaning) || '');
  const can = !joke || c.dm || joke.created_by === c.uid || c.isAdmin;
  const ok = phrase.trim() && /[\p{L}\p{N}]/u.test(phrase) && meaning.trim();
  const save = () => {
    if (!ok) return;
    onClose();
    ctJokeSave(c, joke, phrase, meaning).then((row) => { if (row && onSaved) onSaved(row); });
  };
  return (
    <ChatRowSheet title={joke ? 'Inside joke' : 'New inside joke'} subtitle={joke ? `Saved by ${joke.created_by === c.uid ? 'you' : ctFirst(c.nameOf(joke.created_by))}` : 'Just for this chat'} onClose={onClose} zIndex={97}
      actions={joke && can && String(joke.id).indexOf('tmp-') !== 0 ? [{ icon: <Trash2 size={18} />, label: 'Remove this inside joke', danger: true, onClick: () => ctRemove('joke', joke) }] : []}
      peek={(
        <div style={{ padding: '12px 18px 6px' }}>
          <input value={phrase} onChange={(ev) => setPhrase(ev.target.value.slice(0, 40))} disabled={!can} placeholder="Word or phrase" aria-label="Word or phrase" autoFocus={!initial && !joke} style={{ ...inputStyle(theme), fontWeight: 700 }} />
          <textarea value={meaning} onChange={(ev) => setMeaning(ev.target.value.slice(0, 300))} disabled={!can} placeholder="What does it mean?" aria-label="What it means" rows={3} autoFocus={!!initial && !joke}
            style={{ ...inputStyle(theme), height: 'auto', minHeight: 84, marginTop: 10, padding: '12px 14px', resize: 'none', lineHeight: 1.45 }} />
          {can && <div style={{ margin: '12px 0 4px' }}><BigButton label={joke ? 'Save' : 'Save inside joke'} disabled={!ok} onClick={save} /></div>}
          {!can && <div style={{ fontSize: 12.5, color: theme.muted, padding: '10px 2px 4px' }}>Only the person who saved it or an admin can change it.</div>}
        </div>
      )} />
  );
}
async function ctJokeSave(c, joke, phrase, meaning) {
  const key = c.key;
  const e = ctEntry(key);
  const p = phrase.replace(/\s+/g, ' ').trim();
  const mn = meaning.trim();
  const clash = (e.jokes || []).find((j) => j.phrase.toLowerCase() === p.toLowerCase() && (!joke || j.id !== joke.id));
  if (clash) { appSnack('That one is already saved in this chat'); return null; }
  const before = joke ? { ...joke } : null;
  const temp = joke ? { ...joke, phrase: p, meaning: mn } : { id: ctTmp(), chat_key: key, phrase: p, meaning: mn, created_by: c.uid, created_at: new Date().toISOString() };
  const swap = (from, to) => { e.jokes = ctNewest([...(e.jokes || []).filter((j) => j.id !== from.id), ...(to ? [to] : [])]); e.jv += 1; };
  swap(temp, temp);
  if (!joke) ctBumpCount(key, 'jokes', 1);
  ctEmit();
  hapticTap();
  let res;
  try { res = await supabase.rpc('zchat_joke_save', { p_key: key, p_id: joke ? joke.id : null, p_phrase: p, p_meaning: mn }); } catch (err) { res = { error: err }; }
  const d = res && !res.error ? res.data : null;
  if (!d || !d.ok || !d.row) {
    swap(temp, before);
    if (!joke) ctBumpCount(key, 'jokes', -1);
    ctEmit();
    appSnack(ctErr(res && res.error, 'That did not save. Try again.'));
    return null;
  }
  swap(temp, d.row);
  ctEmit();
  return d.row;
}
export function CtJokesPage({ c, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const [edit, setEdit] = useState(null);
  useEffect(() => { ctLoad(c.key, 'jokes'); }, [c.key]);
  const list = e.jokes;
  return (
    <FullPage title="Inside jokes" subtitle={c.chatName} onBack={onClose} zIndex={72}
      right={<div role="button" aria-label="New inside joke" onClick={() => setEdit({})} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><Plus size={23} /></div>}>
      {list === null ? <div style={{ paddingTop: 8 }}><CtSkeletonRows n={3} h={0} /></div> : e.err.jokes === 'setup' && !list.length ? <CtSetupNote /> : !list.length ? (
        <EmptyState art="love" title="No inside jokes yet" text="Hold a message and tap Inside joke, or add one here. When anyone writes it again, it gets a soft underline." action={<PillButton primary label="Add one" onClick={() => setEdit({})} />} />
      ) : (
        <div style={{ marginTop: 8, borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          {list.map((j, i) => (
            <div key={j.id} role="button" aria-label={`Inside joke ${j.phrase}`} onClick={() => setEdit({ joke: j })} className="zchat-row-press" style={{ padding: '12px 14px', cursor: 'pointer', position: 'relative', opacity: String(j.id).indexOf('tmp-') === 0 ? 0.6 : 1 }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.ink, wordBreak: 'break-word' }}>{j.phrase}</div>
              <div style={{ fontSize: 13.5, color: theme.ink2, marginTop: 3, lineHeight: 1.45, wordBreak: 'break-word', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{j.meaning}</div>
              <div style={{ fontSize: 12, color: theme.muted, marginTop: 5 }}>{j.created_by === c.uid ? 'You' : ctFirst(c.nameOf(j.created_by))}, {fmtDate(new Date(j.created_at), { day: 'numeric', month: 'short', year: new Date(j.created_at).getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })}</div>
              {i < list.length - 1 && <div style={{ position: 'absolute', left: 14, right: 0, bottom: 0, height: 1, background: theme.border }} />}
            </div>
          ))}
        </div>
      )}
      {list && list.length > 0 && <div style={{ fontSize: 12.5, color: theme.muted, padding: '14px 4px 8px', lineHeight: 1.5 }}>When anyone here writes one of these again, it gets a soft underline. Tap it to see what it means.</div>}
      {edit && <CtJokeEditSheet c={c} joke={edit.joke || null} onClose={() => setEdit(null)} />}
    </FullPage>
  );
}
export function CtJokePickSheet({ c, m, onClose }) {
  const { theme } = useTheme();
  const text = ctMsgText(m);
  const words = useMemo(() => {
    const out = [];
    const re = /[\p{L}\p{M}\p{N}'_]+/gu;
    let mm;
    while ((mm = re.exec(text))) out.push({ w: mm[0], at: mm.index });
    return out.slice(0, 200);
  }, [text]);
  const [sel, setSel] = useState(null);
  const [phrase, setPhrase] = useState('');
  const [meaning, setMeaning] = useState('');
  const tap = (i) => {
    hapticTap();
    let next;
    if (!sel || sel.a !== sel.b || i === sel.a) next = { a: i, b: i };
    else next = { a: Math.min(sel.a, i), b: Math.max(sel.a, i) };
    if (next.b - next.a > 5) next = { a: i, b: i };
    setSel(next);
    const from = words[next.a].at;
    const to = words[next.b].at + words[next.b].w.length;
    setPhrase(text.slice(from, to).replace(/\s+/g, ' ').slice(0, 40));
  };
  const ok = phrase.trim() && /[\p{L}\p{N}]/u.test(phrase) && meaning.trim();
  const save = () => { if (!ok) return; onClose(); ctJokeSave(c, null, phrase, meaning).then((row) => { if (row) appSnack(`Saved. ${row.phrase} now gets a soft underline here.`); }); };
  let last = 0;
  const pieces = [];
  words.forEach((w, i) => {
    if (w.at > last) pieces.push(<span key={`s${i}`}>{text.slice(last, w.at)}</span>);
    const on = sel && i >= sel.a && i <= sel.b;
    pieces.push(<span key={`w${i}`} role="button" aria-label={`Pick ${w.w}`} aria-pressed={!!on} onClick={() => tap(i)} style={{ cursor: 'pointer', borderRadius: 6, padding: '1px 0', background: on ? (theme.dark ? 'rgba(168,149,255,0.32)' : 'rgba(29,123,240,0.18)') : 'transparent', boxShadow: on ? `0 0 0 2px ${theme.dark ? 'rgba(168,149,255,0.32)' : 'rgba(29,123,240,0.18)'}` : 'none', transition: 'background 140ms ease' }}>{w.w}</span>);
    last = w.at + w.w.length;
  });
  if (last < text.length) pieces.push(<span key="end">{text.slice(last)}</span>);
  return (
    <ChatRowSheet title="Inside joke" subtitle="Tap a word, or two words for a phrase" onClose={onClose} zIndex={97} actions={[]}
      peek={(
        <div style={{ padding: '12px 18px 6px' }}>
          <div style={{ fontSize: 16, lineHeight: 1.7, color: theme.ink, padding: '10px 12px', borderRadius: 14, background: detailsCardBg(theme), maxHeight: 180, overflowY: 'auto', wordBreak: 'break-word', userSelect: 'none' }}>{pieces}</div>
          <input value={phrase} onChange={(ev) => { setPhrase(ev.target.value.slice(0, 40)); setSel(null); }} placeholder="Word or phrase" aria-label="Word or phrase" style={{ ...inputStyle(theme), fontWeight: 700, marginTop: 12 }} />
          <textarea value={meaning} onChange={(ev) => setMeaning(ev.target.value.slice(0, 300))} placeholder="What does it mean?" aria-label="What it means" rows={2}
            style={{ ...inputStyle(theme), height: 'auto', minHeight: 70, marginTop: 10, padding: '12px 14px', resize: 'none', lineHeight: 1.45 }} />
          <div style={{ margin: '12px 0 4px' }}><BigButton label="Save inside joke" disabled={!ok} onClick={save} /></div>
        </div>
      )} />
  );
}
function ctSpanWords(iso) {
  const a = new Date(iso);
  const b = new Date();
  if (Number.isNaN(a.getTime())) return '';
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;
  const plural = (n, w) => `${n.toLocaleString('en-US')} ${n === 1 ? w : `${w}s`}`;
  if (months >= 12) { const y = Math.floor(months / 12); const mo = months % 12; return mo ? `${plural(y, 'year')} and ${plural(mo, 'month')}` : plural(y, 'year'); }
  if (months >= 1) return plural(months, 'month');
  const days = Math.floor((b - a) / 86400000);
  if (days >= 7) return plural(Math.floor(days / 7), 'week');
  if (days >= 1) return plural(days, 'day');
  return '';
}
function ctLongDate(iso) { const t = Date.parse(iso); return Number.isFinite(t) ? fmtDate(new Date(t), { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
function ctMsgLabel(x) {
  if (!x) return '';
  if (x.k === 'image') return 'Photo';
  if (x.k === 'video') return 'Video';
  if (x.k === 'audio') return 'Voice message';
  if (x.k === 'sticker') return 'Sticker';
  const t = typeof x.t === 'string' ? x.t : '';
  return plainPreviewText(specialPreview(t) || stripSilent(t)) || 'Message';
}
function CtStoryEntry({ icon, title, when, children, onClick, last }) {
  const { theme } = useTheme();
  return (
    <div role={onClick ? 'button' : undefined} aria-label={onClick ? `${title}, show in chat` : undefined} onClick={onClick} className={onClick ? 'zchat-row-press' : undefined} style={{ display: 'flex', gap: 14, cursor: onClick ? 'pointer' : 'default', padding: '0 2px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: theme.dark ? 'rgba(168,149,255,0.16)' : '#EFEAFF', color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{React.cloneElement(icon, { size: 18 })}</div>
        {!last && <div style={{ width: 2, flex: 1, minHeight: 18, background: theme.border, marginTop: 4, borderRadius: 1 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 4 : 18 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink, minWidth: 0 }}>{title}</div>
          {onClick && <ChevronRight size={16} color={theme.muted} style={{ flexShrink: 0, alignSelf: 'center' }} />}
        </div>
        {when && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{when}</div>}
        {children}
      </div>
    </div>
  );
}
export function CtStoryPage({ c, streak, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const [askOff, setAskOff] = useState(null);
  const press = useCtPress((mo) => { if (String(mo.id).indexOf('tmp-') !== 0) setAskOff(mo); });
  useEffect(() => { ctLoad(c.key, 'story', true); }, [c.key]);
  const d = e.story;
  const peer = c.peer || {};
  const first = ctFirst(peer.name);
  const go = (id, at) => { if (id == null) return; ctClose(); c.jump(id, at); };
  const by = (s) => (s === c.uid ? 'You' : first);
  const span = d && d.first ? ctSpanWords(d.first.at) : '';
  const num = (v) => (Number(v) || 0).toLocaleString('en-US');
  const callInfo = (() => { const x = d && d.call; if (!x) return ''; const log = parseCallLog(x.t) || {}; const mins = Math.round((Number(log.d) || 0) / 60); return `${log.k === 'video' ? 'Video call' : 'Voice call'}${mins >= 1 ? `, ${mins} ${mins === 1 ? 'minute' : 'minutes'}` : ''}`; })();
  const hour = d && d.hour != null ? (Number(d.hour) === 0 ? 'midnight' : Number(d.hour) === 12 ? 'noon' : fmtDate(new Date(2020, 0, 1, Number(d.hour)), { hour: 'numeric' })) : '';
  const one = (v, a, b) => [num(v), Number(v) === 1 ? a : b];
  const stats = d && !d.failed && !d.none ? [one(d.total, 'message', 'messages'), one(d.photos, 'photo or video', 'photos and videos'), one(d.voice, 'voice message', 'voice messages'), one(d.calls, 'call', 'calls'), Number(d.games) > 0 ? one(d.games, 'game played', 'games played') : null, streak && streak.days >= 2 ? [num(streak.days), 'day streak'] : null].filter(Boolean) : [];
  const entries = d && !d.failed && !d.none ? [
    d.first && { k: 'first', icon: <MessageSquare />, title: 'The day you first talked', when: ctLongDate(d.first.at), id: d.first.id, at: d.first.at, body: <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 14, background: detailsCardBg(theme), fontSize: 14.5, color: theme.ink, lineHeight: 1.45, wordBreak: 'break-word' }}><div style={{ fontSize: 12, fontWeight: 700, color: theme.muted, marginBottom: 3 }}>{by(d.first.s)} wrote</div>{ctMsgLabel(d.first)}</div> },
    d.photo && { k: 'photo', icon: <ImageIcon />, title: 'Your first photo', when: `${ctLongDate(d.photo.at)}, sent by ${by(d.photo.s).toLowerCase() === 'you' ? 'you' : first}`, id: d.photo.id, at: d.photo.at, body: d.photo.m ? <div style={{ marginTop: 8, width: 92, height: 92, borderRadius: 14, overflow: 'hidden', background: theme.rowBg }}><MediaImg src={d.photo.m} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div> : null },
    d.voice_note && { k: 'voice', icon: <Mic />, title: 'Your first voice note', when: `${ctLongDate(d.voice_note.at)}, from ${by(d.voice_note.s).toLowerCase() === 'you' ? 'you' : first}`, id: d.voice_note.id, at: d.voice_note.at },
    d.call && { k: 'call', icon: <Phone />, title: 'Your first call', when: `${ctLongDate(d.call.at)}${callInfo ? `, ${callInfo.toLowerCase()}` : ''}`, id: d.call.id, at: d.call.at },
    d.busiest && d.busiest.n > 1 && { k: 'busy', icon: <Activity />, title: 'Your busiest day', when: `${ctLongDate(`${d.busiest.d}T12:00:00`)}, ${num(d.busiest.n)} messages`, id: d.busiest.id },
  ].filter(Boolean) : [];
  const moments = d && Array.isArray(d.moments) ? d.moments : [];
  return (
    <FullPage title="Story of us" subtitle={`You and ${first}`} onBack={onClose} zIndex={72}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0 6px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ borderRadius: '50%', boxShadow: `0 0 0 3px ${igPalette(theme).bg}` }}><Avatar emoji={c.me && c.me.avatar} name={(c.me && c.me.name) || ''} size={72} /></div>
          <div style={{ marginLeft: -16, borderRadius: '50%', boxShadow: `0 0 0 3px ${igPalette(theme).bg}` }}><Avatar emoji={peer.avatar} name={peer.name || ''} size={72} /></div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: theme.ink, marginTop: 14, letterSpacing: '-0.015em', textWrap: 'balance', padding: '0 10px' }}>{span ? `You have been talking for ${span}` : d && d.first ? 'You started talking this week' : `You and ${first}`}</div>
        {d && d.first && <div style={{ fontSize: 14, color: theme.muted, marginTop: 5 }}>Since {ctLongDate(d.first.at)}</div>}
      </div>
      {d === null && <div style={{ paddingTop: 10 }}><CtSkeletonRows n={4} h={36} /></div>}
      {d && d.failed && <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', padding: '16px 12px' }}>{e.err.story === 'setup' ? 'This switches on once the latest ZChat setup is finished.' : 'Your story did not load. Check your connection and try again.'}</div>}
      {d && d.none && <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', padding: '16px 12px' }}>Your story starts with your first message.</div>}
      {entries.length > 0 && (
        <>
          <IgHeading>Your firsts</IgHeading>
          <div style={{ padding: '4px 0 0' }}>
            {entries.map((x, i) => <CtStoryEntry key={x.k} icon={x.icon} title={x.title} when={x.when} last={i === entries.length - 1} onClick={x.id != null ? () => go(x.id, x.at) : null}>{x.body}</CtStoryEntry>)}
          </div>
        </>
      )}
      {stats.length > 0 && (
        <>
          <IgHeading>In numbers</IgHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
            {stats.map(([v, l], i) => (
              <div key={l} style={{ padding: '14px 6px', textAlign: 'center', gridColumn: i === stats.length - 1 && stats.length % 2 ? '1 / -1' : undefined, borderTop: i > 1 ? `1px solid ${theme.border}` : 'none', borderLeft: i % 2 ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{v}</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          {(hour || Number(d.groups) > 0) && (
            <div style={{ fontSize: 14, color: theme.ink2, padding: '12px 4px 0', lineHeight: 1.6 }}>
              {hour ? `You talk most around ${hour}.` : ''}{hour && Number(d.groups) > 0 ? ' ' : ''}{Number(d.groups) > 0 ? `You are in ${num(d.groups)} ${Number(d.groups) === 1 ? 'group' : 'groups'} together.` : ''}
            </div>
          )}
        </>
      )}
      {d && !d.failed && (
        <>
          <IgHeading>Moments you kept</IgHeading>
          {moments.length ? (
            <div style={{ borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
              {moments.map((mo, i) => (
                <div key={mo.id} role="button" aria-label={`${mo.title}, show in chat`} onPointerDown={() => press.start(mo)} onPointerUp={press.end} onPointerLeave={press.end} onPointerCancel={press.end} onContextMenu={(ev) => { ev.preventDefault(); if (String(mo.id).indexOf('tmp-') !== 0) setAskOff(mo); }}
                  onClick={() => { if (press.tapped()) go(mo.m && mo.m.id, mo.m && mo.m.at); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', position: 'relative', opacity: String(mo.id).indexOf('tmp-') === 0 ? 0.6 : 1, WebkitTouchCallout: 'none', userSelect: 'none' }}>
                  {mo.m && mo.m.k === 'image' && mo.m.u ? <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: theme.rowBg }}><MediaImg src={mo.m.u} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>
                    : <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: theme.dark ? 'rgba(168,149,255,0.16)' : '#EFEAFF', color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><StoryUsIcon size={20} /></div>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mo.title}</div>
                    <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mo.m ? `${ctLongDate(mo.m.at)}, ${ctMsgLabel(mo.m)}` : ''}</div>
                  </div>
                  <ChevronRight size={16} color={theme.muted} style={{ flexShrink: 0 }} />
                  {i < moments.length - 1 && <div style={{ position: 'absolute', left: 70, right: 0, bottom: 0, height: 1, background: theme.border }} />}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13.5, color: theme.muted, padding: '2px 4px 8px', lineHeight: 1.55 }}>Hold any message in your chat and tap Add to our story to keep it here.</div>
          )}
        </>
      )}
      {askOff && (
        <ChatRowSheet title={askOff.title} subtitle="Moment in your story" onClose={() => setAskOff(null)} zIndex={96}
          actions={[
            { icon: <MessageSquare size={18} />, label: 'Show in chat', onClick: () => go(askOff.m && askOff.m.id, askOff.m && askOff.m.at) },
            { icon: <Trash2 size={18} />, label: 'Remove from our story', danger: true, onClick: () => ctRemove('moment', { id: askOff.id, chat_key: c.key }) },
          ]} />
      )}
    </FullPage>
  );
}

export function CtNotePage({ c, onClose }) {
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const st = useRef({ base: 0, synced: '', timer: 0, busy: false, again: false, seeded: false, alive: true });
  const [text, setText] = useState(() => (e.note ? e.note.body : ''));
  const [editing, setEditing] = useState(() => !(e.note && e.note.body.trim()));
  const [conflict, setConflict] = useState(null);
  const [theirs, setTheirs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState(false);
  const [, setClock] = useState(0);
  const areaRef = useRef(null);
  const textRef = useRef(text);
  textRef.current = text;
  const conflictRef = useRef(conflict);
  conflictRef.current = conflict;
  const save = async () => {
    const s = st.current;
    clearTimeout(s.timer);
    if (conflictRef.current) return;
    if (s.busy) { s.again = true; return; }
    const body = textRef.current;
    if (body === s.synced) return;
    s.busy = true;
    if (s.alive) setSaving(true);
    let res;
    try { res = await supabase.rpc('zchat_note_save', { p_key: c.key, p_body: body, p_base: s.base, p_restore: false }); } catch (err) { res = { error: err }; }
    s.busy = false;
    if (s.alive) setSaving(false);
    const d = res && !res.error ? res.data : null;
    if (!d) { if (s.alive) appSnack(ctErr(res && res.error, 'The note did not save. It will try again when you type.')); return; }
    if (d.ok) {
      if (d.note) { s.base = d.note.version; e.note = d.note; } else s.base = 0;
      s.synced = d.note ? d.note.body : '';
      e.versions = null;
      ctEmit();
    } else if (d.conflict) {
      if (d.note) { e.note = d.note; ctEmit(); }
      if (s.alive) setConflict(d.note || { body: '', version: 0, updated_by: null });
      return;
    }
    if (s.again || textRef.current !== s.synced) { s.again = false; s.timer = setTimeout(save, 400); }
  };
  useBackClose(true, () => { save(); onClose(); });
  useEffect(() => { ctLoad(c.key, 'note', true); return () => { st.current.alive = false; save(); }; }, [c.key]);
  useEffect(() => { const t = setInterval(() => setClock((n) => n + 1), 30000); return () => clearInterval(t); }, []);
  const remote = e.note;
  useEffect(() => {
    const s = st.current;
    if (remote === undefined) return;
    const rv = remote ? remote.version : 0;
    const rb = remote ? remote.body : '';
    if (!s.seeded) {
      s.seeded = true;
      s.base = rv;
      s.synced = rb;
      setText(rb);
      setEditing(!rb.trim());
      return;
    }
    if (rv <= s.base) return;
    if (textRef.current === s.synced) {
      const el = areaRef.current;
      const pos = el && document.activeElement === el ? el.selectionStart : null;
      s.base = rv;
      s.synced = rb;
      setText(rb);
      if (pos != null) requestAnimationFrame(() => { try { el.setSelectionRange(Math.min(pos, rb.length), Math.min(pos, rb.length)); } catch {} });
    } else if (!conflictRef.current) setConflict(remote);
  }, [remote && remote.version, remote === undefined]);
  const type = (v) => {
    setText(v.slice(0, 20000));
    const s = st.current;
    clearTimeout(s.timer);
    s.timer = setTimeout(save, 600);
  };
  const bold = () => {
    const el = areaRef.current;
    if (!el) return;
    const a = el.selectionStart;
    const b = el.selectionEnd;
    const v = textRef.current;
    const mid = v.slice(a, b) || 'bold';
    const next = `${v.slice(0, a)}*${mid}*${v.slice(b)}`;
    type(next);
    requestAnimationFrame(() => { try { el.focus(); el.setSelectionRange(a + 1, a + 1 + mid.length); } catch {} });
  };
  const useTheirs = () => { const r = conflict || {}; const s = st.current; s.base = r.version || 0; s.synced = r.body || ''; setText(r.body || ''); setConflict(null); setTheirs(false); hapticTap(); };
  const keepMine = () => { const r = conflict || {}; st.current.base = r.version || 0; st.current.synced = r.body || ''; setConflict(null); setTheirs(false); conflictRef.current = null; setTimeout(save, 0); hapticTap(); };
  const who = remote && remote.updated_by ? (remote.updated_by === c.uid ? 'you' : ctFirst(c.nameOf(remote.updated_by))) : '';
  const sub = saving ? 'Saving' : remote && remote.body ? `Edited by ${who} ${timeAgoLong(remote.updated_at).toLowerCase()}` : c.dm ? 'You both can edit it' : 'Everyone here can edit it';
  const loading = remote === undefined && !text;
  const off = !remote && !text.trim() && e.err.note === 'setup';
  const left = 20000 - text.length;
  return (
    <FullPage title="Note" subtitle={sub} onBack={() => { save(); onClose(); }} zIndex={72} pad={false}
      right={(
        <>
          <div role="button" aria-label="Earlier versions" onClick={() => { save(); setVersions(true); }} className="zchat-press" style={{ width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink }}><Clock size={20} /></div>
          {editing && text.trim() ? <div role="button" aria-label="Done" onClick={() => { save(); setEditing(false); if (areaRef.current) areaRef.current.blur(); }} style={{ height: 44, padding: '0 10px 0 4px', display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>Done</div> : null}
        </>
      )}
      footer={editing && !off ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div role="button" aria-label="Bold" onPointerDown={(ev) => ev.preventDefault()} onClick={bold} className="zchat-press" style={{ height: 36, padding: '0 14px', borderRadius: 10, background: theme.rowBg, color: theme.ink, display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 15, cursor: 'pointer' }}>B</div>
          <div style={{ fontSize: 12.5, color: theme.muted, flex: 1, minWidth: 0 }}>Put *stars* around words to make them bold</div>
          {left < 2000 && <div style={{ fontSize: 12, fontWeight: 700, color: left < 200 ? theme.danger : theme.muted, fontVariantNumeric: 'tabular-nums' }}>{left.toLocaleString('en-US')}</div>}
        </div>
      ) : null}>
      {conflict && (
        <div role="button" aria-label="See their version" onClick={() => setTheirs(true)} className="zchat-press" style={{ margin: '8px 16px 0', padding: '11px 14px', borderRadius: 14, background: theme.dark ? 'rgba(168,149,255,0.14)' : '#EFEAFF', color: theme.ink, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <span style={{ flex: 1, minWidth: 0 }}>{conflict.updated_by && conflict.updated_by !== c.uid ? ctFirst(c.nameOf(conflict.updated_by)) : 'Someone'} changed the note, see their version</span>
          <ChevronRight size={16} color={theme.muted} style={{ flexShrink: 0 }} />
        </div>
      )}
      {loading ? <div style={{ padding: '14px 16px' }}><CtSkeletonRows n={3} h={0} /></div> : off ? <div style={{ padding: '0 16px' }}><CtSetupNote /></div> : editing ? (
        <textarea ref={areaRef} value={text} onChange={(ev) => type(ev.target.value)} onBlur={() => save()} autoFocus={!text.trim()} aria-label="Shared note" placeholder={c.dm ? 'Plans, lists, addresses. You both can edit this.' : 'Plans, lists, addresses. Everyone here can edit this.'}
          style={{ display: 'block', width: '100%', minHeight: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 16.5, lineHeight: 1.55, padding: '14px 18px 40px' }} />
      ) : (
        <div role="button" aria-label="Edit note" onClick={() => { setEditing(true); requestAnimationFrame(() => { if (areaRef.current) areaRef.current.focus(); }); }} style={{ minHeight: '100%', padding: '14px 18px 40px', fontSize: 16.5, lineHeight: 1.55, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word', cursor: 'text', boxSizing: 'border-box' }}>
          <RichText text={text} />
        </div>
      )}
      {theirs && conflict && (
        <ChatRowSheet title="Their version" subtitle={conflict.updated_at ? `Saved ${timeAgoLong(conflict.updated_at).toLowerCase()}` : ''} onClose={() => setTheirs(false)} zIndex={96} actions={[]}
          peek={(
            <div style={{ padding: '12px 18px 6px' }}>
              <div style={{ maxHeight: '42vh', overflowY: 'auto', padding: '12px 14px', borderRadius: 14, background: detailsCardBg(theme), fontSize: 15, lineHeight: 1.5, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><RichText text={conflict.body || ''} /></div>
              <div style={{ display: 'flex', gap: 10, margin: '12px 0 4px' }}>
                <BigButton tone="plain" label="Keep mine" onClick={keepMine} />
                <BigButton label="Use theirs" onClick={useTheirs} />
              </div>
            </div>
          )} />
      )}
      {versions && <CtNoteVersions c={c} onClose={() => setVersions(false)} onRestore={(body) => { const s = st.current; setVersions(false); setConflict(null); setText(body); textRef.current = body; clearTimeout(s.timer); ctNoteRestore(c, body, s).then(() => setEditing(false)); }} />}
    </FullPage>
  );
}
async function ctNoteRestore(c, body, s) {
  const e = ctEntry(c.key);
  let res;
  try { res = await supabase.rpc('zchat_note_save', { p_key: c.key, p_body: body, p_base: s.base, p_restore: true }); } catch (err) { res = { error: err }; }
  const d = res && !res.error ? res.data : null;
  if (d && d.ok) { if (d.note) { s.base = d.note.version; s.synced = d.note.body; e.note = d.note; } e.versions = null; ctEmit(); appSnack('Restored'); return true; }
  if (d && d.conflict && d.note) { s.base = d.note.version; e.note = d.note; ctEmit(); return ctNoteRestore(c, body, s); }
  appSnack(ctErr(res && res.error, 'That version did not come back. Try again.'));
  return false;
}
function CtNoteVersions({ c, onClose, onRestore }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const [open, setOpen] = useState(null);
  useEffect(() => { if (e.err.versions) { e.err.versions = null; ctEmit(); } ctLoad(c.key, 'versions', true); }, [c.key]);
  const list = e.versions;
  const cur = e.note ? e.note.version : -1;
  return (
    <FullPage title="Earlier versions" subtitle="The last 20 are kept" onBack={onClose} zIndex={90}>
      {list === null ? (e.err.versions === 'net' ? <LoadFail code={(e.errCode || {}).versions} onRetry={() => { e.err.versions = null; ctEmit(); ctLoad(c.key, 'versions', true); }} /> : e.err.versions === 'setup' ? <CtSetupNote /> : <div style={{ paddingTop: 8 }}><CtSkeletonRows n={4} h={0} /></div>) : !list.length ? (
        <EmptyState art="files" title="No versions yet" text="Each time someone edits the note, a version is kept here." />
      ) : (
        <div style={{ marginTop: 8, borderRadius: 18, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          {list.map((v, i) => {
            const t = Date.parse(v.updated_at || v.created_at);
            const lines = String(v.body || '').split('\n').map((x) => x.trim()).filter(Boolean);
            const older = list[i + 1] ? new Set(String(list[i + 1].body || '').split('\n').map((x) => x.trim())) : null;
            const fresh = older ? lines.find((x) => !older.has(x)) : null;
            const line = (fresh || (older && lines.length < older.size ? 'Took something out' : lines[0]) || 'Empty note').replace(/[*_~`]/g, '');
            return (
              <div key={v.id} role="button" aria-label={`Version from ${fmtDate(new Date(t), { day: 'numeric', month: 'short' })}`} onClick={() => setOpen(v)} className="zchat-row-press" style={{ padding: '11px 14px', cursor: 'pointer', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.edited_by === c.uid ? 'You' : ctFirst(c.nameOf(v.edited_by))}, {fmtDate(new Date(t), { day: 'numeric', month: 'short' })} at {fmtHM(new Date(t))}</div>
                  {v.version === cur && <div style={{ fontSize: 12, fontWeight: 700, color: kitOnInk(theme), flexShrink: 0 }}>Current</div>}
                </div>
                <div style={{ fontSize: 13, color: theme.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{line}</div>
                {i < list.length - 1 && <div style={{ position: 'absolute', left: 14, right: 0, bottom: 0, height: 1, background: theme.border }} />}
              </div>
            );
          })}
        </div>
      )}
      {open && (
        <ChatRowSheet title={open.edited_by === c.uid ? 'Your version' : `${ctFirst(c.nameOf(open.edited_by))}'s version`} subtitle={fmtDate(new Date(Date.parse(open.updated_at || open.created_at)), { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })} onClose={() => setOpen(null)} zIndex={96} actions={[]}
          peek={(
            <div style={{ padding: '12px 18px 6px' }}>
              <div style={{ maxHeight: '46vh', overflowY: 'auto', padding: '12px 14px', borderRadius: 14, background: detailsCardBg(theme), fontSize: 15, lineHeight: 1.5, color: theme.ink, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><RichText text={open.body || ''} /></div>
              {open.version !== cur && <div style={{ margin: '12px 0 4px' }}><BigButton label="Restore this version" onClick={() => { const b = open.body || ''; setOpen(null); onRestore(b); }} /></div>}
            </div>
          )} />
      )}
    </FullPage>
  );
}
export function CtFindComposer({ c, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t.getTime(); }, []);
  const [title, setTitle] = useState('');
  const [days, setDays] = useState(() => new Set([1, 2, 3].map((n) => today + n * 86400000)));
  const [from, setFrom] = useState(9);
  const [to, setTo] = useState(21);
  const [step, setStep] = useState(60);
  const startDay = useMemo(() => { const d = new Date(today); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return d.getTime(); }, [today]);
  const cells = Array.from({ length: 21 }).map((_, i) => { const d = new Date(startDay); d.setDate(d.getDate() + i); return d.getTime(); });
  const toggle = (t) => {
    const n = new Set(days);
    if (n.has(t)) n.delete(t);
    else { if (n.size >= 7) { appSnack('Pick up to 7 days'); return; } n.add(t); }
    hapticTap();
    setDays(n);
  };
  const slots = Math.round(((to - from) * 60) / step);
  const ok = days.size > 0 && to > from && slots >= 1 && slots <= 48;
  const hourName = (h) => (h === 24 ? 'Midnight' : fmtDate(new Date(2020, 0, 1, h), { hour: 'numeric' }));
  const sel = { height: 44, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontFamily: FONT, fontSize: 15.5, padding: '0 12px', flex: 1, minWidth: 0 };
  const send = () => {
    if (!ok) return;
    const list = [...days].sort((a, b) => a - b).map((t) => { const d = new Date(t); d.setHours(from, 0, 0, 0); return d.toISOString(); });
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;
    const t = title.replace(/\s+/g, ' ').trim().slice(0, 60);
    const key = c.key;
    const e = ctEntry(key);
    const args = { p_key: key, p_title: t || null, p_starts: list, p_step: step, p_slots: slots, p_tz: localTz(), p_id: id };
    if (id) e.polls.set(id, { id, chat_key: key, created_by: c.uid, title: t || null, starts: list, step, slots, tz: localTz(), picked: null, picked_at: null, closed_at: null, created_at: new Date().toISOString(), pending: true });
    onClose();
    let pollId = id;
    c.sendCard(() => `zfind:${JSON.stringify({ t: t || 'Find a time', i: pollId, d: list.length })}`, {
      notify: t ? `Find a time: ${t}` : 'Wants to find a time',
      prep: async () => {
        let res;
        try { res = await supabase.rpc('zchat_time_create', args); } catch (err) { res = { error: err }; }
        const row = res && !res.error && res.data && res.data.row;
        if (!row) { if (id) e.polls.delete(id); ctEmit(); appSnack(ctErr(res && res.error, 'That plan did not go out. Try again.')); return false; }
        pollId = row.id;
        e.polls.set(row.id, row);
        e.votes.set(row.id, e.votes.get(row.id) || new Map());
        ctEmit();
        return true;
      },
    });
  };
  return (
    <FullPage title="Find a time" subtitle={c.chatName} onBack={onClose} zIndex={72} footer={<BigButton label={days.size ? `Send to the chat` : 'Pick some days'} disabled={!ok} onClick={send} />}>
      <input value={title} onChange={(ev) => setTitle(ev.target.value.slice(0, 60))} placeholder="What is it for? Dinner, a call, study session" aria-label="What is it for" enterKeyHint="done" style={{ ...inputStyle(theme), marginTop: 8 }} />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 2px 8px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted }}>Days</div>
        <div style={{ fontSize: 12.5, color: theme.muted }}>{days.size ? `${days.size} of 7 picked` : 'Up to 7'}</div>
      </div>
      <div role="group" aria-label="Pick days" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
        {cells.slice(0, 7).map((t) => <div key={`h${t}`} style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, color: theme.muted, paddingBottom: 2 }}>{fmtDate(new Date(t), { weekday: 'narrow' })}</div>)}
        {cells.map((t) => {
          const past = t < today;
          const on = days.has(t);
          const d = new Date(t);
          return (
            <div key={t} role="button" aria-label={fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' })} aria-pressed={on} aria-disabled={past} onClick={() => { if (!past) toggle(t); }} className={past ? undefined : 'zchat-press'}
              style={{ height: 44, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: past ? 'default' : 'pointer', background: on ? theme.coral : theme.rowBg, color: on ? '#FFFFFF' : past ? theme.muted2 : theme.ink, opacity: past ? 0.5 : 1, transition: 'background 150ms ease' }}>
              <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</span>
              {d.getDate() === 1 || t === cells[0] ? <span style={{ fontSize: 9.5, fontWeight: 700, marginTop: 2, opacity: 0.8 }}>{fmtDate(d, { month: 'short' })}</span> : null}
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '22px 2px 8px' }}>Times</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <select aria-label="From" value={from} onChange={(ev) => { const v = Number(ev.target.value); setFrom(v); if (to <= v) setTo(Math.min(24, v + 1)); }} style={sel}>{Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{hourName(h)}</option>)}</select>
        <span style={{ fontSize: 14.5, color: theme.muted }}>to</span>
        <select aria-label="To" value={to} onChange={(ev) => { const v = Number(ev.target.value); setTo(v); if (from >= v) setFrom(Math.max(0, v - 1)); }} style={sel}>{Array.from({ length: 24 }).map((_, i) => i + 1).map((h) => <option key={h} value={h}>{hourName(h)}</option>)}</select>
      </div>
      <SegmentedControl value={step} onChange={setStep} options={[[30, 'Every 30 minutes'], [60, 'Every hour']]} style={{ marginTop: 12 }} />
      <div style={{ fontSize: 13, color: theme.muted, padding: '14px 2px 0', lineHeight: 1.5 }}>
        {ok ? `${days.size === 1 ? 'One day' : `${days.size} days`}, ${slots} ${slots === 1 ? 'time' : 'times'} a day. Everyone sees them in their own time zone.` : 'Pick at least one day and a time range.'}
      </div>
    </FullPage>
  );
}
export function CtFindGrid({ c, id, onClose }) {
  const { theme } = useTheme();
  useCtTick();
  const e = ctEntry(c.key);
  const poll = e.polls.get(id);
  const votes = e.votes.get(id);
  const saved = votes && votes.get(c.uid);
  const [mine, setMine] = useState(null);
  const [focus, setFocus] = useState(null);
  const [pick, setPick] = useState(null);
  const [ask, setAsk] = useState(false);
  const [offer, setOffer] = useState(null);
  const gridRef = useRef(null);
  const scrollEl = useRef(null);
  const drag = useRef(null);
  const saveT = useRef(0);
  const mineRef = useRef(null);
  const flush = () => { clearTimeout(saveT.current); if (mineRef.current) ctFindSave(c, id, [...mineRef.current]); };
  useBackClose(true, () => { flush(); onClose(); });
  useEffect(() => { ctLoadPoll(c.key, id, true); return () => flush(); }, [id]);
  const ready = poll && !poll.missing && Array.isArray(poll.starts);
  const people = ctPeople(c);
  const sel = mine || new Set((saved && saved.slots) || []);
  mineRef.current = mine;
  const live = new Map(votes || []);
  live.set(c.uid, { slots: [...sel] });
  const s = ready ? ctFindStats(poll, live, people) : null;
  const closed = ready && !!poll.closed_at;
  const owner = ready && poll.created_by === c.uid;
  const step = ready ? poll.step : 60;
  const rows = ready ? poll.slots : 0;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const rowH = Math.max(26, Math.min(44, Math.floor((vh - 330) / Math.max(1, rows))));
  const past = (sl) => ctSlotAt(poll, sl).getTime() + step * 60000 <= Date.now();
  const cellAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const cell = el && el.closest ? el.closest('[data-slot]') : null;
    return cell && gridRef.current && gridRef.current.contains(cell) ? Number(cell.getAttribute('data-slot')) : null;
  };
  const paint = (from, to) => {
    const d0 = Math.floor(from / rows); const i0 = from % rows; const d1 = Math.floor(to / rows); const i1 = to % rows;
    const next = new Set(drag.current.base);
    for (let d = Math.min(d0, d1); d <= Math.max(d0, d1); d++) for (let i = Math.min(i0, i1); i <= Math.max(i0, i1); i++) { const sl = d * rows + i; if (past(sl)) continue; if (drag.current.add) next.add(sl); else next.delete(sl); }
    setMine(next);
  };
  const tick = () => {
    const dr = drag.current;
    const box = scrollEl.current;
    if (!dr || !box) return;
    const r = box.getBoundingClientRect();
    const dy = dr.y < r.top + 56 ? -9 : dr.y > r.bottom - 56 ? 9 : 0;
    if (dy) { box.scrollTop += dy; const sl = cellAt(dr.x, dr.y); if (sl != null && sl !== dr.last) { dr.last = sl; paint(dr.start, sl); } }
    dr.raf = requestAnimationFrame(tick);
  };
  const down = (ev) => {
    if (!ready || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
    const sl = cellAt(ev.clientX, ev.clientY);
    if (sl == null) return;
    if (pick != null || (owner && ask === 'pick')) { if (!past(sl)) { hapticTap(); setPick(sl); } return; }
    setFocus(sl);
    if (closed || past(sl)) return;
    ev.preventDefault();
    try { gridRef.current.setPointerCapture(ev.pointerId); } catch {}
    drag.current = { start: sl, last: sl, add: !sel.has(sl), base: new Set(sel), x: ev.clientX, y: ev.clientY, raf: 0 };
    hapticTap();
    paint(sl, sl);
    drag.current.raf = requestAnimationFrame(tick);
  };
  const move = (ev) => {
    const dr = drag.current;
    if (!dr) return;
    dr.x = ev.clientX; dr.y = ev.clientY;
    const sl = cellAt(ev.clientX, ev.clientY);
    if (sl != null && sl !== dr.last) { dr.last = sl; paint(dr.start, sl); }
  };
  const up = () => {
    const dr = drag.current;
    if (!dr) return;
    cancelAnimationFrame(dr.raf);
    drag.current = null;
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => { if (mineRef.current) ctFindSave(c, id, [...mineRef.current]); }, 250);
  };
  const confirmPick = async () => {
    const sl = pick;
    if (sl == null) return;
    setAsk(false);
    setPick(null);
    const prev = { ...poll };
    const at = ctSlotAt(poll, sl);
    e.polls.set(id, { ...poll, picked: sl, picked_at: at.toISOString(), closed_at: new Date().toISOString() });
    ctEmit();
    hapticTap();
    const title = poll.title || '';
    setOffer({ at: at.toISOString(), title });
    let res;
    try { res = await supabase.rpc('zchat_time_pick', { p_poll: id, p_slot: sl }); } catch (err) { res = { error: err }; }
    const row = res && !res.error && res.data && res.data.row;
    if (!row) { e.polls.set(id, prev); ctEmit(); setOffer(null); appSnack(ctErr(res && res.error, 'That time did not stick. Try again.')); return; }
    e.polls.set(id, row);
    ctEmit();
    const n = s.counts[sl] || 0;
    c.sendCard(`zfind:${JSON.stringify({ t: title, x: 'set', i: id, at: row.picked_at, n, of: people, w: `${fmtDate(at, { weekday: 'short', day: 'numeric', month: 'short' })}, ${fmtHM(at)}` })}`, { notify: title ? `Picked a time for ${title}` : 'Picked a time' });
  };
  const legend = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: theme.muted, padding: '2px 2px 10px', flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: ctAlpha(theme.coral, 0.9) }} />More people free</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, boxShadow: `inset 0 0 0 2px ${theme.ink}` }} />Your times</span>
    </div>
  );
  const focusText = ready && focus != null ? (() => {
    const names = [];
    if (sel.has(focus)) names.push('you');
    (votes ? [...votes.values()] : []).forEach((v) => { if (v.user_id !== c.uid && (v.slots || []).includes(focus)) names.push(ctFirst(c.nameOf(v.user_id))); });
    const at = ctSlotAt(poll, focus);
    return `${ctDayTime(at, true)}: ${names.length ? `${names.length > 3 ? `${names.slice(0, 3).join(', ')} and ${names.length - 3} more` : names.join(names.length === 2 ? ' and ' : ', ')} ${names.length === 1 && names[0] === 'you' ? 'are' : names.length === 1 ? 'is' : 'are'} free` : 'no one is free yet'}`;
  })() : '';
  const tzNote = ready && poll.tz && poll.tz !== localTz();
  const pickAt = pick != null && ready ? ctSlotAt(poll, pick) : null;
  return (
    <FullPage title={(poll && poll.title) || 'Find a time'} subtitle={closed ? 'A time was picked' : pick != null || ask === 'pick' ? 'Tap the time you want' : 'Tap or drag over the times you are free'} onBack={() => { flush(); onClose(); }} zIndex={72} scrollRef={scrollEl}
      footer={!ready ? null : closed ? (owner && !offer ? <BigButton label="Make it an event" onClick={() => setOffer({ at: poll.picked_at, title: poll.title || '' })} /> : <BigButton tone="plain" label="Done" onClick={() => { flush(); onClose(); }} />)
        : ask === 'pick' ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <BigButton tone="plain" label="Cancel" onClick={() => { setAsk(false); setPick(null); }} />
            <BigButton label={pickAt ? `Pick ${ctDayName(pickAt)} ${ctTimeLabel(pickAt)}` : 'Tap a time'} disabled={!pickAt} onClick={confirmPick} />
          </div>
        ) : owner ? <BigButton label="Pick the time" onClick={() => { flush(); setAsk('pick'); setPick(s && s.best >= 0 ? s.best : null); }} /> : <BigButton tone="plain" label="Done" onClick={() => { flush(); onClose(); }} />}>
      {!poll ? <div style={{ paddingTop: 10 }}><CtSkeletonRows n={4} h={0} /></div> : poll.failed !== undefined ? <LoadFail code={poll.failed} onRetry={() => { e.polls.delete(id); ctEmit(); ctLoadPoll(c.key, id, true); }} /> : poll.missing ? <div style={{ fontSize: 14, color: theme.muted, padding: '24px 4px', textAlign: 'center' }}>{poll.setup ? 'This switches on once the latest ZChat setup is finished.' : 'This plan is not available anymore.'}</div> : (
        <>
          <div style={{ margin: '8px 0 12px', padding: '12px 14px', borderRadius: 16, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink, lineHeight: 1.35 }}>{closed && poll.picked_at ? `Picked: ${ctDayTime(new Date(poll.picked_at), true)}` : s.text || 'No one has answered yet'}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 3 }}>{s.voters} of {people} answered{tzNote ? '. Times are in your time zone' : ''}</div>
            <div style={{ fontSize: 13, color: focusText ? theme.ink2 : theme.muted, marginTop: 7, lineHeight: '18px', height: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{focusText || (closed ? 'Tap a time to see who was free' : 'Tap a time to see who is free')}</div>
          </div>
          {legend}
          <div style={{ display: 'grid', gridTemplateColumns: `44px repeat(${poll.starts.length}, minmax(0, 1fr))`, columnGap: 3, position: 'sticky', top: 0, zIndex: 2, background: igPalette(theme).bg, paddingBottom: 6 }}>
            <div />
            {poll.starts.map((st) => { const d = new Date(st); return (
              <div key={st} style={{ textAlign: 'center', lineHeight: 1.15 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: theme.muted }}>{fmtDate(d, { weekday: 'short' })}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink }}>{d.getDate()}</div>
              </div>
            ); })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', columnGap: 3, paddingBottom: 12 }}>
            <div style={{ touchAction: 'pan-y' }}>
              {Array.from({ length: rows }).map((_, i) => { const at = ctSlotAt(poll, i); return <div key={i} style={{ height: rowH, marginBottom: 3, fontSize: 11, fontWeight: 600, color: theme.muted, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 4, boxSizing: 'border-box', lineHeight: 1 }}>{step === 60 || at.getMinutes() === 0 ? ctTimeLabel(at) : ''}</div>; })}
            </div>
            <div ref={gridRef} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
              style={{ display: 'grid', gridTemplateColumns: `repeat(${poll.starts.length}, minmax(0, 1fr))`, gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows}, ${rowH}px)`, gap: 3, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}>
              {Array.from({ length: poll.starts.length * rows }).map((_, sl) => {
                const n = s.counts[sl];
                const mineOn = sel.has(sl);
                const isPast = past(sl);
                const chosen = (pick != null && pick === sl) || (closed && poll.picked === sl);
                return (
                  <div key={sl} data-slot={sl} role="button" aria-label={`${ctDayTime(ctSlotAt(poll, sl), true)}, ${n} free${mineOn ? ', you are free' : ''}`} aria-pressed={mineOn}
                    style={{ borderRadius: 6, background: n ? ctAlpha(theme.coral, 0.16 + 0.84 * (n / people)) : theme.rowBg, boxShadow: chosen ? `inset 0 0 0 2.5px ${theme.ink}, 0 0 0 2px ${theme.coral}` : mineOn ? `inset 0 0 0 2px ${theme.ink}` : 'none', opacity: isPast ? 0.35 : 1, cursor: closed || isPast ? 'default' : 'pointer', transition: 'background 120ms ease' }} />
                );
              })}
            </div>
          </div>
        </>
      )}
      {offer && <CtEventOffer c={c} at={offer.at} title={offer.title} onClose={() => { setOffer(false); }} />}
    </FullPage>
  );
}
async function ctFindSave(c, id, slots) {
  const key = c.key;
  const e = ctEntry(key);
  const map = new Map(e.votes.get(id) || []);
  const before = map.get(c.uid) || null;
  const list = slots.slice().sort((a, b) => a - b);
  if (before && Array.isArray(before.slots) && before.slots.length === list.length && before.slots.every((x, i) => x === list[i])) return;
  map.set(c.uid, { poll_id: id, user_id: c.uid, chat_key: key, slots: list, local: true, updated_at: new Date().toISOString() });
  e.votes.set(id, map);
  ctEmit();
  let res;
  try { res = await supabase.rpc('zchat_time_vote', { p_poll: id, p_slots: list }); } catch (err) { res = { error: err }; }
  const row = res && !res.error && res.data && res.data.row;
  const now = new Map(e.votes.get(id) || []);
  if (!row) { if (before) now.set(c.uid, before); else now.delete(c.uid); e.votes.set(id, now); ctEmit(); appSnack(ctErr(res && res.error, 'Your times did not save. Try again.')); return; }
  now.set(c.uid, row);
  e.votes.set(id, now);
  ctEmit();
}
function CtEventOffer({ c, at, title, onClose }) {
  const { theme } = useTheme();
  const [name, setName] = useState(title || '');
  const [place, setPlace] = useState('');
  const [remind, setRemind] = useState(true);
  const when = new Date(at);
  const send = async () => {
    const t = name.replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!t) return;
    onClose();
    const ev = { t, d: when.toISOString(), ...(place.trim() ? { p: place.trim().slice(0, 80) } : {}) };
    const row = await c.sendCard(`zevent:${JSON.stringify(ev)}`, { notify: `Invited you to ${t}` });
    if (row && remind && c.remind) c.remind(row, when.getTime() - 30 * 60000, `${t} starts at ${ctTimeLabel(when)}`);
  };
  return (
    <ChatRowSheet title="Make it an event?" subtitle={`${ctDayTime(when, true)}, everyone can answer Going or Maybe`} onClose={onClose} zIndex={97} actions={[]}
      peek={(
        <div style={{ padding: '12px 18px 6px' }}>
          <input value={name} onChange={(ev) => setName(ev.target.value.slice(0, 80))} placeholder="What is it?" aria-label="Event name" style={inputStyle(theme)} />
          <input value={place} onChange={(ev) => setPlace(ev.target.value.slice(0, 80))} placeholder="Where? You can leave this empty" aria-label="Place" style={{ ...inputStyle(theme), marginTop: 10 }} />
          <div role="button" aria-label="Remind me 30 minutes before" onClick={() => setRemind((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 2px 6px', cursor: 'pointer' }}>
            <Clock size={19} color={theme.muted} />
            <div style={{ flex: 1, fontSize: 15, color: theme.ink, fontWeight: 500 }}>Remind me 30 minutes before</div>
            <IgToggle on={remind} />
          </div>
          <div style={{ display: 'flex', gap: 10, margin: '10px 0 4px' }}>
            <BigButton tone="plain" label="Not now" onClick={onClose} />
            <BigButton label="Send event" disabled={!name.trim()} onClick={send} />
          </div>
        </div>
      )} />
  );
}
const ROUND_MAX_SECS = 60;
export function RoundRecorder({ onClose, onSend, onActivity }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [stage, setStage] = useState('starting');
  const activityRef = useRef(onActivity);
  activityRef.current = onActivity;
  useEffect(() => {
    if (stage !== 'rec') return undefined;
    const ping = () => { if (activityRef.current) activityRef.current('round'); };
    ping();
    const t = setInterval(ping, 2000);
    return () => clearInterval(t);
  }, [stage]);
  const [facing, setFacing] = useState('user');
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState(null);
  const videoRef = useRef(null);
  const lastReviewRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(0);
  const startedRef = useRef(0);
  const stopStream = () => { try { (streamRef.current ? streamRef.current.getTracks() : []).forEach((t) => t.stop()); } catch {} streamRef.current = null; };
  useEffect(() => {
    if (stage === 'review' || stage === 'sending') return undefined;
    let alive = true;
    (async () => {
      try {
        stopStream();
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 480 }, height: { ideal: 480 } }, audio: { echoCancellation: true, noiseSuppression: true } });
        if (!alive) { st.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = st;
        if (videoRef.current) { videoRef.current.srcObject = st; videoRef.current.play().catch(() => {}); }
        setStage((s) => (s === 'starting' || s === 'error' ? 'ready' : s));
      } catch {
        if (alive) setStage('error');
      }
    })();
    return () => { alive = false; };
  }, [facing, stage === 'review']);
  useEffect(() => () => { clearInterval(timerRef.current); try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {} stopStream(); }, []);
  useEffect(() => () => {
    if (!clip || !clip.url) return;
    const v = lastReviewRef.current;
    if (v) { try { v.pause(); v.removeAttribute('src'); v.load(); } catch {} }
    setTimeout(() => { try { URL.revokeObjectURL(clip.url); } catch {} }, 2000);
  }, [clip]);
  const stop = () => {
    clearInterval(timerRef.current);
    try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {}
  };
  const start = () => {
    const st = streamRef.current;
    if (!st || stage !== 'ready') return;
    const type = pickRecorderType();
    let rec;
    try { rec = new MediaRecorder(st, type ? { mimeType: type, videoBitsPerSecond: 900000 } : undefined); } catch { setStage('error'); return; }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const used = Math.max(1, Math.round((Date.now() - startedRef.current) / 1000));
      const mime = (rec.mimeType || type || 'video/webm').split(';')[0];
      const blob = new Blob(chunksRef.current, { type: mime });
      if (!blob.size) { setStage('ready'); return; }
      setClip({ blob, url: URL.createObjectURL(blob), secs: Math.min(ROUND_MAX_SECS, used), mime });
      setStage('review');
      stopStream();
    };
    recRef.current = rec;
    startedRef.current = Date.now();
    setSecs(0);
    rec.start(250);
    playUiSound('record-start');
    hapticTap();
    setStage('rec');
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedRef.current) / 1000);
      setSecs(s);
      if (s >= ROUND_MAX_SECS) stop();
    }, 200);
  };
  const send = async () => {
    if (!clip || stage === 'sending') return;
    setStage('sending');
    const ext = /mp4/.test(clip.mime) ? 'mp4' : 'webm';
    const file = new File([clip.blob], `round-${Date.now()}.${ext}`, { type: clip.mime });
    const ok = await onSend(file, clip.secs);
    if (ok) onClose(); else setStage('review');
  };
  const retake = () => { setClip(null); setSecs(0); setStage('starting'); };
  const size = Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 360) - 60);
  const R = size / 2 + 6;
  const C = 2 * Math.PI * R;
  const pct = stage === 'rec' ? Math.min(1, secs / ROUND_MAX_SECS) : 0;
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: 'rgba(6,6,12,0.94)', color: 'white', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px calc(24px + env(safe-area-inset-bottom))' }}>
        <div role="button" aria-label="Close video message" onClick={onClose} style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', left: 12, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>{stage === 'review' || stage === 'sending' ? 'Send this video message?' : stage === 'rec' ? mmss(secs * 1000) : 'Video message'}</div>
        <div style={{ position: 'relative', width: size + 24, height: size + 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={size + 24} height={size + 24} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
            <circle cx={(size + 24) / 2} cy={(size + 24) / 2} r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="5" />
            {stage === 'rec' && <circle cx={(size + 24) / 2} cy={(size + 24) / 2} r={R} fill="none" stroke="#FF3B30" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform={`rotate(-90 ${(size + 24) / 2} ${(size + 24) / 2})`} />}
          </svg>
          <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#000' }}>
            {(stage === 'review' || stage === 'sending') && clip
              ? <video ref={(el) => { if (el) lastReviewRef.current = el; }} src={clip.url} autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} />}
          </div>
          {stage === 'error' && <div style={{ position: 'absolute', inset: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.85)' }}>ZChat needs your camera and microphone. Allow them in your phone settings and try again.</div>}
          {stage === 'starting' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={26} /></div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 30, minHeight: 78 }}>
          {(stage === 'review' || stage === 'sending') ? (
            <>
              <div role="button" aria-label="Record again" onClick={retake} style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Undo2 size={22} /></div>
              <div role="button" aria-label="Send video message" onClick={send} style={{ width: 74, height: 74, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{stage === 'sending' ? <Spinner size={24} /> : <Send size={28} color="white" style={{ marginLeft: -2 }} />}</div>
            </>
          ) : (
            <>
              <div role="button" aria-label="Switch camera" onClick={() => { if (stage !== 'rec') setFacing((f) => (f === 'user' ? 'environment' : 'user')); }} style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: stage === 'rec' ? 'default' : 'pointer', opacity: stage === 'rec' ? 0.4 : 1 }}><SwitchCamera size={22} /></div>
              <div role="button" aria-label={stage === 'rec' ? 'Stop recording' : 'Start recording'} onClick={() => (stage === 'rec' ? stop() : start())} style={{ width: 78, height: 78, borderRadius: '50%', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxSizing: 'border-box' }}>
                <div style={{ width: stage === 'rec' ? 28 : 60, height: stage === 'rec' ? 28 : 60, borderRadius: stage === 'rec' ? 8 : '50%', background: '#FF3B30', transition: 'all 0.18s ease' }} />
              </div>
              <div style={{ width: 54 }} />
            </>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: 14 }}>{stage === 'rec' ? 'Tap the square to stop' : `Up to ${ROUND_MAX_SECS} seconds`}</div>
      </div>
    </Portal>
  );
}
function SkipGlyph({ size = 22, color = 'currentColor', back = false, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ transform: back ? 'scaleX(-1)' : 'none', flexShrink: 0, ...(style || {}) }}>
      <path d="M5 5.6v12.8c0 .8.9 1.3 1.6.8l8.6-6.4c.6-.4.6-1.2 0-1.6L6.6 4.8C5.9 4.3 5 4.8 5 5.6z" fill={color} />
      <rect x="16.6" y="5" width="2.6" height="14" rx="1.3" fill={color} />
    </svg>
  );
}
export function ListenComposerSheet({ files, country, onSend, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [items, setItems] = useState(() => { const hit = musicMem.get(musicKey('', country)); return hit && hit.items ? hit.items.map(validSong).filter(Boolean) : null; });
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const [picked, setPicked] = useState([]);
  const [sending, setSending] = useState(false);
  const seq = useRef(0);
  const playingId = useSongPlaying();
  const songWaiting = useSongWait();
  useEffect(() => {
    const term = q.trim();
    const my = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await fetchMusic(term, country);
      if (my !== seq.current) return;
      setBusy(false);
      if (r.data && Array.isArray(r.data.items)) { setErr(''); setItems(r.data.items.map(validSong).filter(Boolean)); return; }
      setItems((old) => old || []);
      setErr(r.status === 400 && /unknown action/i.test(r.error || '') ? 'Music search switches on once the ZChat tools are set up.' : toolErrorText(r, 'Music'));
    }, term && !musicMem.has(musicKey(term, country)) ? 380 : 0);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => () => stopSong(), []);
  const keyOf = (x) => (x.s ? `s:${x.s.id}` : `f:${x.f.m}`);
  const has = (k) => picked.some((x) => keyOf(x) === k);
  const toggle = (x) => {
    hapticTap();
    const k = keyOf(x);
    setPicked((list) => (list.some((y) => keyOf(y) === k) ? list.filter((y) => keyOf(y) !== k) : list.length >= 10 ? list : [...list, x]));
  };
  const start = async () => {
    if (!picked.length || sending) return;
    setSending(true);
    stopSong();
    const ok = await onSend(picked.map((x) => ({ ...x, u: listenUid() })));
    if (!ok) setSending(false);
  };
  const row = (x, key, art, title, sub, preview) => {
    const on = has(keyOf(x));
    return (
      <div key={key} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
        <div role="button" aria-label={on ? `Take ${title} off the list` : `Add ${title}`} aria-pressed={on} onClick={() => toggle(x)} className="zchat-row-press" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          {art}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
            <div style={{ fontSize: 13, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{sub}</div>
          </div>
          <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: on ? 'none' : `1.5px solid ${theme.border}`, background: on ? theme.coral : 'transparent', transition: 'background 150ms ease-out' }}>{on ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : <Plus size={15} color={theme.muted} />}</span>
        </div>
        {preview}
      </div>
    );
  };
  return (
    <FullPage title="Listen together" subtitle={picked.length ? `${picked.length} picked` : null} onBack={onClose} zIndex={96}
      footer={<BigButton label={sending ? 'Starting' : picked.length > 1 ? `Start listening to ${picked.length} songs` : 'Start listening'} disabled={!picked.length || sending} onClick={start} />}>
      <div style={{ textAlign: 'center', fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '10px 8px 12px', textWrap: 'balance' }}>Pick a few songs. Everyone who joins hears the same part at the same time, and anyone can add more.</div>
      <div style={{ position: 'relative', margin: '0 0 6px' }}>
        <Search size={16} color={theme.muted} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 60))} placeholder="Search songs or artists" aria-label="Search songs" enterKeyHint="search" style={{ ...inputStyle(theme), paddingLeft: 38, paddingRight: 40 }} />
        {busy && items !== null && <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}><Spinner size={15} color={theme.muted} /></span>}
      </div>
      {files && files.length > 0 && !q.trim() && (
        <>
          <IgHeading>From this chat</IgHeading>
          <div role="list" aria-label="Audio from this chat" style={{ margin: '-6px 0 0' }}>
            {files.map((f) => row({ f: { n: f.n, m: f.m } }, `f-${f.id}`, <ListenArt it={{ f: true }} size={46} radius={10} />, String(f.n || 'Audio').replace(/\.[a-z0-9]{1,5}$/i, ''), f.who ? `Sent by ${f.who}` : 'Shared in this chat', null))}
          </div>
          <IgHeading>Songs</IgHeading>
        </>
      )}
      {items === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={18} color={theme.muted} /></div>}
      {err && <div role="alert" style={{ fontSize: 13.5, color: theme.muted, padding: '14px 2px', textAlign: 'center' }}>{err}</div>}
      {items && !items.length && !err && !busy && <div style={{ fontSize: 13.5, color: theme.muted, padding: '18px 2px', textAlign: 'center' }}>No songs found. Try another name.</div>}
      <div role="list" aria-label="Songs">
        {(items || []).map((s) => {
          const playing = playingId === s.id;
          return row({ s }, `s-${s.id}`, <ListenArt it={{ s }} size={46} radius={10} />, s.t, s.a, (
            <div role="button" aria-label={playing ? `Pause ${s.t}` : `Preview ${s.t}`} onClick={() => toggleSong(s)} className="zchat-press" style={{ width: 38, height: 38, borderRadius: '50%', border: `1.5px solid ${playing ? theme.coral : theme.border}`, color: playing ? theme.coral : theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {playing && songWaiting ? <Spinner size={14} color={theme.coral} /> : playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" style={{ marginLeft: 2 }} />}
            </div>
          ));
        })}
      </div>
      {items && items.length > 0 && <div style={{ fontSize: 12, color: theme.muted, padding: '16px 2px 8px', textAlign: 'center' }}>30 second previews from Apple Music</div>}
    </FullPage>
  );
}
function listenFmt(s) {
  const t = Math.max(0, Math.floor(s || 0));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}
export function ListenPage({ me, onClose }) {
  useBackClose(true, onClose);
  const h = useListen();
  const [, setNow] = useState(0);
  const [adding, setAdding] = useState(false);
  const [rowMenu, setRowMenu] = useState(null);
  const barRef = useRef(null);
  useEffect(() => { const iv = setInterval(() => setNow((n) => n + 1), 500); return () => clearInterval(iv); }, []);
  const v = listenView();
  if (!v || !h.key) return null;
  const it = v.q[v.i];
  const dur = listenDurOf(it);
  const pos = Math.min(listenPosAt(v, listenNow()), dur);
  const isStarter = !!(me && h.starter === me.id);
  const others = h.people.filter((p) => !me || p.u !== me.id);
  const callOn = liveCallHub.callOn;
  const needTap = !h.unlocked || h.held;
  const seekTo = (clientX) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / Math.max(1, r.width)));
    listenCommit({ k: 'seek', pos: f * dur });
  };
  const listeners = [{ u: me ? me.id : 'me', n: 'You', a: me ? me.avatar : null }, ...others];
  const btn = { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF', WebkitTapHighlightColor: 'transparent' };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 640, background: '#0B0A10', color: 'white', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 12px 6px', flexShrink: 0 }}>
          <div role="button" aria-label="Back to the chat" onClick={onClose} className="zchat-press" style={{ ...btn, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }}><ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} /></div>
          <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 15.5, fontWeight: 800 }}>Listen together</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{others.length ? `${others.length + 1} listening now` : 'Waiting for others to join'}</div>
          </div>
          <div role="button" aria-label="Add songs" onClick={() => setAdding(true)} className="zchat-press" style={{ ...btn, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', flexShrink: 0 }}><Plus size={20} /></div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '10px 22px calc(24px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 18px' }}>
            <div style={{ width: 'min(68vw, 270px)', aspectRatio: '1 / 1', borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 44px rgba(0,0,0,0.5)', transform: v.play && !needTap ? 'scale(1)' : 'scale(0.94)', transition: reducedMotion() ? 'none' : 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)' }}>
              <ListenArt it={it} size="100%" radius={0} />
            </div>
          </div>
          <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listenItemTitle(it)}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.68)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listenItemArtist(it)}</div>
          <div ref={barRef} role="slider" aria-label="Song position" aria-valuemin={0} aria-valuemax={Math.round(dur)} aria-valuenow={Math.round(pos)} onClick={(e) => seekTo(e.clientX)} style={{ position: 'relative', height: 24, marginTop: 16, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <div style={{ width: `${dur > 0 ? Math.min(100, (pos / dur) * 100) : 0}%`, height: '100%', background: '#FFFFFF', borderRadius: 2, transition: v.play ? 'width 500ms linear' : 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums', marginTop: -2 }}>
            <span>{listenFmt(pos)}</span><span>{dur >= 1800 && it && it.f && !h.dur[it.u] ? '' : `-${listenFmt(dur - pos)}`}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, padding: '14px 0 8px' }}>
            <div role="button" aria-label="Previous song" onClick={() => { hapticTap(); listenCommit({ k: 'prev' }); }} className="zchat-press" style={{ ...btn, width: 52, height: 52 }}><SkipGlyph size={26} back /></div>
            <div role="button" aria-label={needTap && v.play ? 'Listen along' : v.play ? 'Pause for everyone' : 'Play for everyone'} onClick={listenToggle} className="zchat-press" style={{ ...btn, width: 72, height: 72, borderRadius: '50%', background: '#FFFFFF', color: '#0B0A10' }}>
              {v.play && !needTap ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" style={{ marginLeft: 4 }} />}
            </div>
            <div role="button" aria-label="Next song" onClick={() => { hapticTap(); listenCommit({ k: 'next', cur: it ? it.u : null }); }} className="zchat-press" style={{ ...btn, width: 52, height: 52, opacity: v.i + 1 < v.q.length ? 1 : 0.4 }}><SkipGlyph size={26} /></div>
          </div>
          {(callOn || (needTap && v.play)) && (
            <div role="status" className="zchat-fade" style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.8)', padding: '4px 0 6px' }}>
              {callOn ? 'Paused here while you are on a call' : h.held ? 'Paused here. Tap play to catch up with everyone.' : 'The music is playing. Tap play to listen along.'}
            </div>
          )}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '18px 0 10px' }}>Listening</div>
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {listeners.map((p) => (
              <div key={p.u} style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <Avatar emoji={p.a} name={p.n === 'You' && me ? me.name : p.n || 'Someone'} size={46} />
                <span style={{ fontSize: 11.5, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(p.n || 'Someone').split(' ')[0]}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 6px' }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Queue</div>
            <div role="button" aria-label="Add songs to the queue" onClick={() => setAdding(true)} style={{ fontSize: 13.5, fontWeight: 700, color: '#C9BCFF', cursor: 'pointer', padding: '4px 0 4px 10px' }}>Add songs</div>
          </div>
          <div role="list" aria-label="Queue">
            {v.q.map((x, i) => {
              const now = i === v.i;
              return (
                <div key={x.u} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0', opacity: i < v.i ? 0.5 : 1 }}>
                  <div role="button" aria-label={`Play ${listenItemTitle(x)} for everyone`} onClick={() => { if (!now) { hapticTap(); listenCommit({ k: 'jump', u: x.u }); } }} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, cursor: now ? 'default' : 'pointer' }}>
                    <ListenArt it={x} size={44} radius={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        {now && v.play && <SongBars color="#C9BCFF" size={12} />}
                        <span style={{ fontSize: 14.5, fontWeight: now ? 800 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: now ? '#FFFFFF' : 'rgba(255,255,255,0.9)' }}>{listenItemTitle(x)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{listenItemArtist(x)}</div>
                    </div>
                  </div>
                  {isStarter && v.q.length > 1 && (
                    <div role="button" aria-label={`Options for ${listenItemTitle(x)}`} onClick={() => { hapticTap(); setRowMenu(x); }} className="zchat-press" style={{ ...btn, width: 36, height: 36, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}><MoreDotsIcon size={20} /></div>
                  )}
                </div>
              );
            })}
          </div>
          {!isStarter && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginTop: 10 }}>Anyone can add songs. The person who started can change the order.</div>}
        </div>
        {adding && (
          <MusicPicker title="Add to the queue" zIndex={660} onClose={() => { setAdding(false); if (listenHub.unlocked && listenHub.held) listenTapToListen(); }} onPick={(s) => {
            setAdding(false);
            if (listenHub.unlocked && listenHub.held) listenTapToListen();
            listenCommit({ k: 'add', items: [{ u: listenUid(), s, by: me ? me.id : null }] });
            appSnack(`${s.t} is in the queue`);
          }} />
        )}
        {rowMenu && (
          <ChatRowSheet title={listenItemTitle(rowMenu)} subtitle={listenItemArtist(rowMenu)} zIndex={660} portal onClose={() => setRowMenu(null)} avatar={<ListenArt it={rowMenu} size={40} radius={9} />}
            actions={[
              ![v.i, v.i + 1].includes(v.q.findIndex((x) => x.u === rowMenu.u)) ? { label: 'Play next', icon: <SkipGlyph size={18} color="currentColor" />, onClick: () => listenCommit({ k: 'move', u: rowMenu.u, to: 'next' }) } : null,
              v.q.findIndex((x) => x.u === rowMenu.u) > 0 ? { label: 'Move up', icon: <ChevronRight size={19} style={{ transform: 'rotate(-90deg)' }} />, onClick: () => listenCommit({ k: 'move', u: rowMenu.u, to: 'up' }) } : null,
              v.q.findIndex((x) => x.u === rowMenu.u) < v.q.length - 1 ? { label: 'Move down', icon: <ChevronRight size={19} style={{ transform: 'rotate(90deg)' }} />, onClick: () => listenCommit({ k: 'move', u: rowMenu.u, to: 'down' }) } : null,
              { label: 'Take off the queue', icon: <X size={19} />, danger: true, onClick: () => listenCommit({ k: 'remove', u: rowMenu.u }) },
            ]} />
        )}
      </div>
    </Portal>
  );
}
const CR_SAFETY = 'ZChat does not take payments for items. Meet somewhere safe and only pay once you have seen it.';

export function ShoutoutOrderSheet({ profile, me, onClose, onOpenWallet }) {
  const { theme } = useTheme();
  const page = useCr('page', profile.id);
  const w = useWallet(me.id);
  const first = crFirst(profile);
  const [kind, setKind] = useState('birthday');
  const [who, setWho] = useState(() => crFirst(me));
  const [note, setNote] = useState('');
  const price = page && page.shout_price ? Number(page.shout_price) : 0;
  const bal = w && w.ready ? w.coins : 0;
  const enough = price > 0 && bal >= price;
  const ready = price > 0 && who.trim().length > 0;
  const go = async () => {
    if (!ready) return;
    if (!enough) { onClose(); if (onOpenWallet) onOpenWallet(); return; }
    const okey = `out|${me.id}|${profile.id}`;
    const temp = { id: `temp-${Date.now()}`, fan_id: me.id, creator_id: profile.id, price, occasion: kind, to_name: who.trim().slice(0, 40), note: note.trim().slice(0, 300) || null, status: 'pending', due_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_at: new Date().toISOString() };
    const res = await crSpend(me.id, price, `Order a shoutout from ${first} for ${coinsText(price)}`, () => {
      onClose();
      hapticTap();
      playUiSound('send');
      crPatch('orders', okey, (l) => [temp, ...(l || [])]);
      appSnack(`Ordered. ${first} sends it to your chat within 7 days.`);
      return crCall('zchat_cr_shout_order', { p_creator: profile.id, p_occasion: kind, p_to_name: temp.to_name, p_note: temp.note, p_expect: price });
    });
    if (res.cancelled) return;
    if (res.error) { crPatch('orders', okey, (l) => (l || []).filter((o) => o.id !== temp.id)); appSnack(res.error); if (res.row && res.row.price) crFresh('page', profile.id); return; }
    const o = res.row && res.row.order;
    crPatch('orders', okey, (l) => (l || []).map((x) => (x.id === temp.id ? o || x : x)));
  };
  return (
    <CrSheet title={`Shoutout from ${first}`} sub={<CrCoinsLine uid={me.id} />} avatar={<Avatar emoji={profile.avatar} name={profile.name} size={40} />} onClose={onClose}
      footer={<BigButton label={!price ? 'Loading' : !who.trim() ? 'Add who it is for' : enough ? `Order for ${coinsText(price)}` : `You need ${moreCoinsText(price - bal)}`} disabled={!ready} onClick={go} />}>
      <SegmentedControl style={{ marginTop: 12 }} value={kind} onChange={(k) => { hapticTap(); setKind(k); }} options={[['birthday', 'Birthday'], ['message', 'A message']]} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>Who is it for</div>
      <input value={who} onChange={(e) => setWho(e.target.value.slice(0, 40))} placeholder="Their name" aria-label="Who the shoutout is for" autoCapitalize="words" enterKeyHint="next" style={inputStyle(theme)} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>What should {first} say</div>
      <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={4} placeholder={(page && page.shout_note) || (kind === 'birthday' ? 'Her name is Mia, she turns 16 on Saturday and loves your songs' : 'A few words about what you want to hear')} aria-label="Note for the shoutout"
        style={{ ...inputStyle(theme), height: 'auto', minHeight: 96, padding: '12px 14px', lineHeight: 1.45, resize: 'none', fontFamily: FONT }} />
      <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', padding: '4px 2px 0' }}>{`${note.length} of 300`}</div>
      <CrNote style={{ paddingTop: 4 }}>{`${first} records it in ZChat and sends it to your chat within 7 days. If they cannot, your coins come back. You can save it and share it.`}</CrNote>
    </CrSheet>
  );
}

export function ShoutoutOrderPage({ order, me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [fan, setFan] = useState(null);
  const [rec, setRec] = useState(false);
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState('');
  useEffect(() => {
    let alive = true;
    fetchProfilesView([order.fan_id]).then(({ data }) => { if (alive && data && data[0]) setFan(sanitizeAvatar(data[0], me.id)); }, () => {});
    return () => { alive = false; };
  }, [order.fan_id]);
  const okey = `in|${me.id}`;
  const close = (patch, text) => { crPatch('orders', okey, (l) => (l || []).map((o) => (o.id === order.id ? { ...o, ...patch } : o))); onClose(); if (text) appSnack(text); };
  const doDecline = async () => {
    const why = reason.trim();
    if (!why) return;
    setDecline(false);
    close({ status: 'declined', reason: why, settled_at: new Date().toISOString() }, 'Declined. Their coins went back.');
    const r = await crCall('zchat_cr_shout_decline', { p_id: order.id, p_reason: why });
    if (!r.ok) { crFresh('orders', okey); appSnack(r.reason || 'That did not work. Try again.'); }
  };
  const name = (fan && crFirst(fan)) || 'They';
  return (
    <FullPage title={`Shoutout for ${order.to_name}`} subtitle={`Send by ${crDay(order.due_at)}`} onBack={onClose} zIndex={760}
      footer={<div style={{ display: 'flex', gap: 8 }}><BigButton tone="plain" label="Decline" onClick={() => setDecline(true)} style={{ width: 120, flexShrink: 0 }} /><BigButton label="Record" onClick={() => setRec(true)} /></div>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px 2px' }}>
        <Avatar emoji={fan && fan.avatar} name={(fan && fan.name) || '?'} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>{(fan && fan.name) || 'A fan'}</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 1 }}>{`Ordered ${crDay(order.created_at)}`}</div>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: theme.ink }}><CoinIcon size={16} />{formatCount(order.cut || crCut(order.price))}</span>
      </div>
      <CrCard style={{ marginTop: 14 }}>
        <DetailRow icon={<CrGlyph k="shout" />} label={order.occasion === 'birthday' ? 'Birthday' : 'A message'} sub={`For ${order.to_name}`} />
        <div style={{ padding: '12px 14px 14px', fontSize: 15, color: theme.ink, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{order.note || `${name} did not add a note.`}</div>
      </CrCard>
      <CrNote>Record up to a minute. It goes to your chat with them, and you get the coins as soon as it is sent.</CrNote>
      {rec && <ShoutoutRecorder order={order} me={me} onClose={() => setRec(false)} onSent={() => close({ status: 'delivered', settled_at: new Date().toISOString() }, `Sent to ${name}`)} />}
      {decline && (
        <CrSheet title="Decline this shoutout" sub="Their coins go back" onClose={() => setDecline(false)} z={790} footer={<BigButton tone="danger" label="Decline and refund" disabled={!reason.trim()} onClick={doDecline} />}>
          <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '10px 2px 10px' }}>{`Tell ${name} why in a few words. They see this with their refund.`}</div>
          <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 200))} placeholder="I am away this week" aria-label="Reason" enterKeyHint="done" style={inputStyle(theme)} />
        </CrSheet>
      )}
    </FullPage>
  );
}

const CR_SHOUT_SECS = 60;
export function ShoutoutRecorder({ order, me, onClose, onSent }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const canRec = typeof window !== 'undefined' && !!window.MediaRecorder && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const [stage, setStage] = useState(canRec ? 'starting' : 'pick');
  const [facing, setFacing] = useState('user');
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState(null);
  const [err, setErr] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const chunks = useRef([]);
  const timer = useRef(0);
  const t0 = useRef(0);
  const pickRef = useRef(null);
  const stopStream = () => { try { (streamRef.current ? streamRef.current.getTracks() : []).forEach((t) => t.stop()); } catch {} streamRef.current = null; };
  useEffect(() => {
    if (!canRec || stage === 'review' || stage === 'sending' || stage === 'pick') return undefined;
    let alive = true;
    (async () => {
      try {
        stopStream();
        const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } }, audio: { echoCancellation: true, noiseSuppression: true } });
        if (!alive) { st.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = st;
        if (videoRef.current) { videoRef.current.srcObject = st; videoRef.current.play().catch(() => {}); }
        setStage((s) => (s === 'starting' || s === 'error' ? 'ready' : s));
      } catch { if (alive) setStage('error'); }
    })();
    return () => { alive = false; };
  }, [facing, stage === 'review']);
  useEffect(() => () => { clearInterval(timer.current); try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {} stopStream(); }, []);
  useEffect(() => () => { if (clip && clip.url) setTimeout(() => { try { URL.revokeObjectURL(clip.url); } catch {} }, 1500); }, [clip]);
  const stop = () => { clearInterval(timer.current); try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {} };
  const start = () => {
    const st = streamRef.current;
    if (!st || stage !== 'ready') return;
    const type = pickRecorderType();
    let rec;
    try { rec = new MediaRecorder(st, type ? { mimeType: type, videoBitsPerSecond: 1400000 } : undefined); } catch { setStage('error'); return; }
    chunks.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.current.push(e.data); };
    rec.onstop = () => {
      const used = Math.max(1, Math.min(CR_SHOUT_SECS, Math.round((Date.now() - t0.current) / 1000)));
      const mime = (rec.mimeType || type || 'video/webm').split(';')[0];
      const blob = new Blob(chunks.current, { type: mime });
      if (!blob.size) { setStage('ready'); return; }
      setClip({ blob, url: URL.createObjectURL(blob), secs: used, mime });
      setStage('review');
      stopStream();
    };
    recRef.current = rec;
    t0.current = Date.now();
    setSecs(0);
    rec.start(250);
    playUiSound('record-start');
    hapticTap();
    setStage('rec');
    timer.current = setInterval(() => { const s = Math.floor((Date.now() - t0.current) / 1000); setSecs(s); if (s >= CR_SHOUT_SECS) stop(); }, 200);
  };
  const picked = (f) => {
    if (!f) return;
    if (!/^video\//.test(f.type || '')) { setErr('Pick a video'); return; }
    const url = URL.createObjectURL(f);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const d = Number.isFinite(v.duration) ? v.duration : 0;
      if (d > CR_SHOUT_SECS + 1) { URL.revokeObjectURL(url); setErr('Keep it to a minute or less'); return; }
      setErr('');
      setClip({ blob: f, url, secs: Math.max(1, Math.min(CR_SHOUT_SECS, Math.round(d) || 1)), mime: f.type || 'video/mp4' });
      setStage('review');
    };
    v.onerror = () => { URL.revokeObjectURL(url); setErr('That video could not be read'); };
    v.src = url;
  };
  const send = async () => {
    if (!clip || stage === 'sending') return;
    setStage('sending');
    const ext = /mp4/.test(clip.mime) ? 'mp4' : /quicktime/.test(clip.mime) ? 'mov' : 'webm';
    const file = new File([clip.blob], `shoutout-${Date.now()}.${ext}`, { type: clip.mime });
    const up = await uploadChatMedia(file, me.id);
    if (up.error || !up.url) { setStage('review'); appSnack('The video did not upload. Check your connection and try again.'); return; }
    const r = await crCall('zchat_cr_shout_deliver', { p_id: order.id, p_media: up.url, p_secs: clip.secs });
    if (!r.ok) { setStage('review'); appSnack(r.reason || 'That did not send. Try again.'); return; }
    playUiSound('send');
    hapticTap();
    onClose();
    if (onSent) onSent(r);
  };
  const retake = () => { setClip(null); setSecs(0); setStage(canRec ? 'starting' : 'pick'); };
  const left = CR_SHOUT_SECS - secs;
  const round = { width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF' };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 800, background: '#000', color: '#FFFFFF', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {(stage === 'review' || stage === 'sending') && clip
            ? <video src={clip.url} autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : canRec && stage !== 'pick' ? <video ref={videoRef} muted playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover', transform: facing === 'user' ? 'scaleX(-1)' : 'none' }} /> : null}
          {stage === 'starting' && <Spinner size={26} />}
          {(stage === 'error' || stage === 'pick') && (
            <div style={{ maxWidth: 300, textAlign: 'center', padding: 24, fontSize: 14.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.85)' }}>
              {stage === 'error' ? 'ZChat needs your camera and microphone to record. Allow them in your browser settings, or pick a video you already made.' : 'Pick a video of up to a minute. On a phone you can record one now.'}
              <div style={{ marginTop: 16 }}><BigButton label="Pick a video" onClick={() => pickRef.current && pickRef.current.click()} /></div>
              {err && <div role="alert" style={{ marginTop: 10, color: '#FF8A80', fontWeight: 700, fontSize: 13 }}>{err}</div>}
            </div>
          )}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(12px + env(safe-area-inset-top)) 14px 10px', background: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0))' }}>
          <div role="button" aria-label="Close recorder" onClick={onClose} style={{ ...round, width: 40, height: 40 }}><X size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{`For ${order.to_name}`}</div>
            {order.note && <div data-zuser="" style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.note}</div>}
          </div>
          {stage === 'rec' && <div style={{ padding: '5px 10px', borderRadius: 14, background: '#FF3B30', fontSize: 13, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{mmss(secs * 1000)}</div>}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 30, padding: '16px 16px calc(22px + env(safe-area-inset-bottom))', background: 'linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.6))' }}>
          {(stage === 'review' || stage === 'sending') ? (
            <>
              <div role="button" aria-label="Record again" onClick={stage === 'sending' ? undefined : retake} style={round}><Undo2 size={22} /></div>
              <div role="button" aria-label="Send shoutout" onClick={send} style={{ height: 54, padding: '0 26px', borderRadius: 27, background: theme.coral, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>
                {stage === 'sending' ? <><Spinner size={16} />Sending</> : <><Send size={18} />Send</>}
              </div>
            </>
          ) : stage === 'ready' || stage === 'rec' ? (
            <>
              <div role="button" aria-label="Pick a video instead" onClick={() => { if (stage !== 'rec' && pickRef.current) pickRef.current.click(); }} style={{ ...round, opacity: stage === 'rec' ? 0.3 : 1 }}><ImageIcon size={21} /></div>
              <div role="button" aria-label={stage === 'rec' ? 'Stop recording' : 'Start recording'} onClick={() => (stage === 'rec' ? stop() : start())} style={{ width: 78, height: 78, borderRadius: '50%', border: '4px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <div style={{ width: stage === 'rec' ? 28 : 60, height: stage === 'rec' ? 28 : 60, borderRadius: stage === 'rec' ? 8 : '50%', background: '#FF3B30', transition: 'all 0.18s ease' }} />
              </div>
              <div role="button" aria-label="Switch camera" onClick={() => { if (stage !== 'rec') setFacing((f) => (f === 'user' ? 'environment' : 'user')); }} style={{ ...round, opacity: stage === 'rec' ? 0.3 : 1 }}><SwitchCamera size={21} /></div>
            </>
          ) : null}
        </div>
        {stage === 'rec' && left <= 10 && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 'calc(120px + env(safe-area-inset-bottom))', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{`${left} ${left === 1 ? 'second' : 'seconds'} left`}</div>}
        <input ref={pickRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; picked(f); }} />
      </div>
    </Portal>
  );
}
function useCrShopLive(ownerId) {
  useEffect(() => {
    if (!ownerId) return undefined;
    const ch = supabase.channel(`cr-shop-${ownerId}-${Math.random().toString(36).slice(2, 7)}`);
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'shop_listings', filter: `owner_id=eq.${ownerId}` }, (p) => {
      const n = p && p.new;
      const o = p && p.old;
      if (p && p.eventType === 'DELETE' && o && o.id) crPatch('shop', ownerId, (l) => (Array.isArray(l) ? l.filter((x) => x.id !== o.id) : l));
      else if (n && n.id) crPatch('shop', ownerId, (l) => [n, ...(Array.isArray(l) ? l : []).filter((x) => x.id !== n.id)].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)));
      crFresh('shop', ownerId);
    }).subscribe();
    return () => { try { supabase.removeChannel(ch); } catch {} };
  }, [ownerId]);
}
export function SellerShopTab({ profile, isSelf, userId }) {
  const { theme } = useTheme();
  const items = useCr('shop', profile.id, 20000);
  useCrShopLive(profile.id);
  const list = Array.isArray(items) ? items : [];
  const me = isSelf ? { id: userId, ...profile } : null;
  return (
    <div style={{ padding: '10px 14px 20px' }}>
      {isSelf && list.length === 0 && items !== undefined && (
        <EmptyState art="saved" title="Your shop" text="Show things you sell, like clothes, art or cakes. People can ask you about them in a chat. You arrange payment yourselves." action={<PillButton primary label="Add an item" onClick={() => crOpen('edit', { item: null, me })} />} />
      )}
      {items === undefined && crErr('shop', profile.id) !== null && <LoadFail small where="Shop tab" code={crErr('shop', profile.id)} onRetry={() => crFresh('shop', profile.id)} />}
      {items === undefined && crErr('shop', profile.id) === null && <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}><Spinner size={20} color={theme.muted} /></div>}
      {list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
          {isSelf && list.length < 50 && (
            <div role="button" aria-label="Add an item" onClick={() => { hapticTap(); crOpen('edit', { item: null, me }); }} className="zchat-press"
              style={{ aspectRatio: '1 / 1.28', borderRadius: 18, border: `1.5px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: theme.muted, cursor: 'pointer', fontSize: 13.5, fontWeight: 700 }}>
              <Plus size={24} />Add an item
            </div>
          )}
          {list.map((it) => <SellerItemTile key={it.id} it={it} onOpen={() => crOpen('item', { id: it.id, owner: profile.id, item: it })} />)}
        </div>
      )}
    </div>
  );
}
function SellerItemTile({ it, onOpen }) {
  const { theme } = useTheme();
  const ph = Array.isArray(it.photos) ? it.photos[0] : null;
  return (
    <div role="button" aria-label={`Item ${it.title}`} onClick={() => { hapticTap(); onOpen(); }} className="zchat-press" style={{ minWidth: 0, cursor: 'pointer', opacity: it.pending ? 0.7 : 1 }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 16, overflow: 'hidden', background: theme.rowBg }}>
        {ph && <img src={ph} alt="" loading="lazy" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: it.sold_out ? 'grayscale(0.6)' : 'none' }} />}
        {it.sold_out && <span style={{ position: 'absolute', left: 8, top: 8, padding: '3px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.62)', color: '#FFFFFF', fontSize: 11.5, fontWeight: 800 }}>Sold out</span>}
      </div>
      <div style={{ fontSize: 14, fontWeight: 650, color: theme.ink, marginTop: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
      {it.price_text && <div style={{ fontSize: 13, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.price_text}</div>}
    </div>
  );
}
export function SellerItemEditor({ item, me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [photos, setPhotos] = useState(() => (item && Array.isArray(item.photos) ? item.photos.map((u) => ({ u, url: u })) : []));
  const [title, setTitle] = useState((item && item.title) || '');
  const [price, setPrice] = useState((item && item.price_text) || '');
  const [desc, setDesc] = useState((item && item.description) || '');
  const [soldOut, setSoldOut] = useState(!!(item && item.sold_out));
  const [ask, setAsk] = useState(false);
  const fileRef = useRef(null);
  const busyUp = photos.some((p) => !p.url && !p.err);
  useEffect(() => () => { photos.forEach((p) => { if (p.local) try { URL.revokeObjectURL(p.local); } catch {} }); }, []);
  const add = (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type || '')).slice(0, 6 - photos.length);
    list.forEach((f) => {
      const tag = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
      let local = null;
      try { local = URL.createObjectURL(f); } catch {}
      setPhotos((prev) => [...prev, { tag, local, u: local, url: null }]);
      uploadMedia(f, me.id).then(({ url, error }) => setPhotos((prev) => prev.map((p) => (p.tag === tag ? (error || !url ? { ...p, err: true } : { ...p, url }) : p))), () => setPhotos((prev) => prev.map((p) => (p.tag === tag ? { ...p, err: true } : p))));
    });
  };
  const good = photos.filter((p) => p.url);
  const ready = title.trim().length > 0 && good.length > 0 && !busyUp;
  const save = async () => {
    if (!ready) return;
    const row = { owner_id: me.id, title: title.trim().slice(0, 80), price_text: price.trim().slice(0, 24) || null, description: desc.trim().slice(0, 600) || null, photos: good.map((p) => p.url), sold_out: soldOut };
    const before = crS.shop.m.get(me.id);
    const temp = { ...row, id: item ? item.id : `temp-${Date.now()}`, created_at: (item && item.created_at) || new Date().toISOString(), pending: !item };
    if (!crS.shop.m.has(me.id)) crPut('shop', me.id, []);
    crPatch('shop', me.id, (l) => (item ? (l || []).map((x) => (x.id === item.id ? { ...x, ...temp } : x)) : [temp, ...(l || [])]));
    hapticTap();
    onClose();
    const res = item ? await supabase.from('shop_listings').update(row).eq('id', item.id).eq('owner_id', me.id).select().single() : await supabase.from('shop_listings').insert(row).select().single();
    if (res.error || !res.data) {
      crPut('shop', me.id, before || []);
      appSnack(crMissing(res.error) ? 'Shops switch on once the latest ZChat setup is finished.' : friendlyError(res.error, 'That item did not save. Try again.'));
      return;
    }
    crPatch('shop', me.id, (l) => (l || []).map((x) => (x.id === temp.id ? res.data : x)));
    crPatch('page', me.id, (p) => ({ ...p, shop: Math.max(1, Number(p.shop) || 0) }));
    appSnack(item ? 'Item saved' : 'Added to your shop');
  };
  const remove = async () => {
    setAsk(false);
    const before = crS.shop.m.get(me.id);
    crPatch('shop', me.id, (l) => (l || []).filter((x) => x.id !== item.id));
    onClose();
    const { error } = await supabase.from('shop_listings').delete().eq('id', item.id).eq('owner_id', me.id);
    if (error) { crPut('shop', me.id, before || []); appSnack(friendlyError(error, 'That item was not removed. Try again.')); return; }
    appSnack('Item removed');
  };
  return (
    <FullPage title={item ? 'Edit item' : 'New item'} onBack={onClose} zIndex={750}
      footer={<BigButton label={busyUp ? 'Uploading photos' : item ? 'Save' : 'Add to your shop'} disabled={!ready} onClick={save} />}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, paddingTop: 12, maxWidth: 560 }}>
        {photos.map((p, i) => (
          <div key={p.tag || p.u || i} style={{ position: 'relative', aspectRatio: '1 / 1', borderRadius: 14, overflow: 'hidden', background: theme.rowBg }}>
            {p.u && <img src={p.u} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: p.url ? 1 : 0.55 }} />}
            {!p.url && !p.err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={18} /></div>}
            {p.err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: 6 }}>Did not upload</div>}
            {i === 0 && p.url && <span style={{ position: 'absolute', left: 6, bottom: 6, padding: '2px 7px', borderRadius: 7, background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800 }}>Cover</span>}
            <div role="button" aria-label="Remove photo" onClick={() => setPhotos((prev) => prev.filter((x) => x !== p))} style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} color="#FFFFFF" /></div>
          </div>
        ))}
        {photos.length < 6 && (
          <div role="button" aria-label="Add photos" onClick={() => fileRef.current && fileRef.current.click()} className="zchat-press" style={{ aspectRatio: '1 / 1', borderRadius: 14, border: `1.5px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: theme.muted, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
            <Camera size={22} />{photos.length ? 'Add more' : 'Add photos'}
          </div>
        )}
      </div>
      <CrNote style={{ paddingTop: 6 }}>Up to 6 photos. The first one is the cover.</CrNote>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>Title</div>
      <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder="Blue hoodie, size M" aria-label="Item title" style={inputStyle(theme)} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>Price</div>
      <input value={price} onChange={(e) => setPrice(e.target.value.slice(0, 24))} placeholder="LKR 4,500 or $20" aria-label="Item price" style={inputStyle(theme)} />
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 2px 6px' }}>Description</div>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 600))} rows={4} placeholder="Condition, size, where you can meet or how you send it" aria-label="Item description"
        style={{ ...inputStyle(theme), height: 'auto', minHeight: 96, padding: '12px 14px', lineHeight: 1.45, resize: 'none', fontFamily: FONT }} />
      {item && (
        <CrCard style={{ marginTop: 16 }}>
          <DetailRow icon={<CrGlyph k="tag" />} label="Sold out" sub="People still see it, marked as sold out" onClick={() => setSoldOut((v) => !v)} right={<IgToggle on={soldOut} />} />
          <DetailRow icon={<Trash2 />} label="Remove item" danger onClick={() => setAsk(true)} last />
        </CrCard>
      )}
      <CrNote>{CR_SAFETY}</CrNote>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { const f = e.target.files; add(f); e.target.value = ''; }} />
      {ask && <ConfirmDialog layer={790} title="Remove this item?" body="It goes away from your shop for everyone." confirmLabel="Remove" onCancel={() => setAsk(false)} onConfirm={remove} />}
    </FullPage>
  );
}
export function SellerItemPage({ id, ownerId, item: seed, me, onClose, onAsk, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const items = useCr('shop', ownerId || null, 20000);
  useCrShopLive(ownerId || null);
  const [owner, setOwner] = useState(null);
  const [menu, setMenu] = useState(false);
  const [idx, setIdx] = useState(0);
  const [gone, setGone] = useState(false);
  const it = (Array.isArray(items) && items.find((x) => x.id === id)) || seed;
  const mine = !!it && it.owner_id === me.id;
  useEffect(() => {
    let alive = true;
    const oid = ownerId || (it && it.owner_id);
    if (!oid) return undefined;
    if (oid === me.id) { setOwner(me); return undefined; }
    fetchProfilesView([oid]).then(({ data }) => { if (alive && data && data[0]) setOwner(sanitizeAvatar(data[0], me.id)); }, () => {});
    return () => { alive = false; };
  }, [ownerId]);
  useEffect(() => { if (Array.isArray(items) && !items.some((x) => x.id === id) && !String(id).startsWith('temp-')) setGone(true); }, [items, id]);
  const photos = it && Array.isArray(it.photos) ? it.photos : [];
  const ask = () => {
    if (!it || !owner || !onAsk) return;
    hapticTap();
    const content = `zitem:${JSON.stringify({ i: it.id, o: it.owner_id, t: String(it.title || '').slice(0, 80), p: it.price_text ? String(it.price_text).slice(0, 24) : '', ph: photos[0] || '' })}`;
    onAsk(owner, content);
  };
  const report = async () => {
    setMenu(false);
    try { await reportUser(me.id, it.owner_id, `Shop item ${it.id}: ${String(it.title || '').slice(0, 120)}`); } catch {}
    appSnack('Thanks. We will take a look.');
  };
  const toggleSold = async () => {
    setMenu(false);
    const next = !it.sold_out;
    crPatch('shop', it.owner_id, (l) => (l || []).map((x) => (x.id === it.id ? { ...x, sold_out: next } : x)));
    hapticTap();
    const { error } = await supabase.from('shop_listings').update({ sold_out: next }).eq('id', it.id).eq('owner_id', me.id);
    if (error) { crPatch('shop', it.owner_id, (l) => (l || []).map((x) => (x.id === it.id ? { ...x, sold_out: !next } : x))); appSnack(friendlyError(error, 'That did not save. Try again.')); }
  };
  return (
    <FullPage title={it ? it.title : 'Item'} subtitle={owner ? `${crFirst(owner)}'s shop` : undefined} onBack={onClose} zIndex={730} pad={false}
      right={it ? <HeaderIconButton label="More" onClick={() => setMenu(true)}><MoreVertical size={20} /></HeaderIconButton> : null}
      footer={it && !gone ? (mine ? <BigButton tone="plain" label="Edit item" onClick={() => crOpen('edit', { item: it, me })} /> : <BigButton label={it.sold_out ? 'Sold out, ask anyway' : 'Ask about this'} onClick={ask} disabled={!owner} />) : null}>
      {gone && !it && <EmptyState art="nothing" title="This item is gone" text="The seller removed it." />}
      {it && (
        <>
          <div style={{ position: 'relative' }}>
            <div onScroll={(e) => { const el = e.currentTarget; const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (n !== idx) setIdx(n); }} style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', background: theme.rowBg }}>
              {photos.map((u, i) => (
                <div key={u + i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', aspectRatio: '1 / 1', maxHeight: '62vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={u} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
            {photos.length > 1 && (
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 10, display: 'flex', justifyContent: 'center', gap: 5 }}>
                {photos.map((u, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i === idx ? '#FFFFFF' : 'rgba(255,255,255,0.45)', transition: 'background 0.2s' }} />)}
              </div>
            )}
          </div>
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 20, fontWeight: 800, color: theme.ink, letterSpacing: '-0.01em', wordBreak: 'break-word' }}>{it.title}</div>
              {it.sold_out && <span style={{ flexShrink: 0, marginTop: 3, padding: '3px 9px', borderRadius: 9, background: theme.soft, color: theme.muted, fontSize: 12.5, fontWeight: 800 }}>Sold out</span>}
            </div>
            {it.price_text && <div style={{ fontSize: 17, fontWeight: 700, color: kitOnInk(theme), marginTop: 4 }}>{it.price_text}</div>}
            {it.description && <div data-zuser="" style={{ fontSize: 15, color: theme.ink, lineHeight: 1.5, marginTop: 10, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{it.description}</div>}
            {owner && (
              <div role="button" aria-label={`Open ${owner.name}'s profile`} onClick={() => onOpenProfile && !mine && onOpenProfile(owner)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '8px 0', cursor: mine ? 'default' : 'pointer' }}>
                <Avatar emoji={owner.avatar} name={owner.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}><NameBadge name={owner.name} verified={owner.verified} custom={owner.custom_badge} size={13} /></div>
                  <div style={{ fontSize: 12.5, color: theme.muted }}>{mine ? 'You are selling this' : `Added ${crDay(it.created_at)}`}</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12, padding: '12px 14px', borderRadius: 14, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
              <ShieldCheck size={18} color={theme.muted} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{CR_SAFETY}</div>
            </div>
            <div style={{ height: 24 }} />
          </div>
        </>
      )}
      {menu && it && (
        <ActionSheet title={it.title} zIndex={790} onClose={() => setMenu(false)} items={mine ? [
          { k: 'edit', label: 'Edit item', icon: <Pencil />, on: () => { setMenu(false); crOpen('edit', { item: it, me }); } },
          { k: 'sold', label: it.sold_out ? 'Back in stock' : 'Mark as sold out', icon: <CrGlyph k="tag" />, on: toggleSold },
        ] : [
          { k: 'copy', label: 'Copy link to profile', icon: <Copy />, on: async () => { setMenu(false); await copyTextToClipboard(profileShareLink(it.owner_id)); appSnack('Link copied'); } },
          { k: 'report', label: 'Report item', icon: <Flag />, on: report },
        ]} />
      )}
    </FullPage>
  );
}
async function postsFn(action, payload, timeoutMs = 30000) {
  let token = '';
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch {}
  if (!token) return { error: 'Please log in again.', status: 401 };
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  try {
    const res = await fetch('/.netlify/functions/zchat-posts', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...(payload || {}), action }), signal: ctrl ? ctrl.signal : undefined });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: json && typeof json.error === 'string' ? json.error : '', status: res.status };
    return { data: json || {}, status: res.status };
  } catch {
    return { error: '', status: 0 };
  } finally { clearTimeout(timer); }
}
function psFnError(r, fallback) {
  if (!r || r.status === 0) return 'No connection. Try again.';
  if (r.status === 404 || (r.status === 503 && !r.error)) return 'This switches on once the latest ZChat setup is finished.';
  return r.error || fallback;
}
function psLang() {
  try { return (localStorage.getItem('zchat-translate-to') || navigator.language || 'en').slice(0, 2).toLowerCase(); } catch { return 'en'; }
}

function PsSheet({ title, onClose, children, right, label }) {
  useBackClose(true, onClose);
  return (
    <div onClick={onClose} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 900, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', fontFamily: FONT }}>
      <div role="dialog" aria-label={label || title} onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '88%', background: '#11151F', color: '#FFFFFF', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 18px 10px', flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15.5 }}>{title}</span>
          {right || <div role="button" aria-label="Close" onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginRight: -6 }}><X size={20} color="#FFFFFF" /></div>}
        </div>
        <div style={{ overflowY: 'auto', padding: '0 16px 16px', minHeight: 0, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>{children}</div>
      </div>
    </div>
  );
}
const psDarkInput = { width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', borderRadius: 14, padding: '12px 14px', fontFamily: FONT, fontSize: 16, lineHeight: 1.4 };
function PsDarkButton({ label, onClick, disabled, plain, aria, busy }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label={aria || label} aria-disabled={disabled ? 'true' : undefined} onClick={() => { if (!disabled && !busy) onClick(); }} className="zchat-press"
      style={{ height: 46, borderRadius: 23, padding: '0 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 800, fontSize: 15, cursor: disabled ? 'default' : 'pointer', background: plain ? 'rgba(255,255,255,0.12)' : theme.coral, color: '#FFFFFF', opacity: disabled ? 0.45 : 1, transition: 'opacity 160ms ease' }}>
      {busy ? <Spinner size={16} /> : label}
    </div>
  );
}

export function PsAltSheet({ item, value, onSave, onClose }) {
  const [text, setText] = useState(value || '');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const suggest = async () => {
    if (busy) return;
    setBusy(true); setNote('');
    let r = null;
    try {
      const data = await shrinkToDataUrl(item.file, 768, 0.82);
      r = await postsFn('alt', { image: String(data).split(',')[1] || '', lang: psLang() }, 30000);
    } catch { r = { error: 'That photo could not be read.', status: 400 }; }
    if (!aliveRef.current) return;
    setBusy(false);
    if (r && r.data && r.data.text) { setText(String(r.data.text).slice(0, 300)); hapticTap(); return; }
    setNote(psFnError(r, 'Suggestions are busy right now. Try again soon.'));
  };
  return (
    <PsSheet title="Alt text" onClose={onClose}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <img src={item.url} alt="" draggable={false} style={{ width: 52, height: 64, objectFit: 'cover', borderRadius: 9, flexShrink: 0, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(255,255,255,0.72)' }}>Say what is in the photo for people who use a screen reader. Anyone can read it by pressing and holding the photo.</div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 300))} placeholder="Two friends laughing on the beach at sunset" aria-label="Alt text" rows={4} enterKeyHint="done"
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isTouchDevice()) { e.preventDefault(); onSave(text.trim()); onClose(); } }}
        style={{ ...psDarkInput, resize: 'none', minHeight: 104 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 2px 0' }}>
        <div role="button" aria-label="Suggest alt text with ZChat Bot" onClick={suggest} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px 0 6px', borderRadius: 18, background: 'rgba(255,255,255,0.12)', cursor: busy ? 'default' : 'pointer', fontSize: 14, fontWeight: 700 }}>
          {busy ? <span style={{ width: 24, display: 'flex', justifyContent: 'center' }}><Spinner size={14} /></span> : <img src="/bot-avatar.jpg" alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
          {busy ? 'Looking at the photo' : 'Suggest'}
        </div>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{text.length}/300</span>
      </div>
      <div role={note ? 'alert' : undefined} style={{ fontSize: 12.5, lineHeight: 1.45, color: note ? '#FFB4BC' : 'rgba(255,255,255,0.5)', padding: '8px 2px 14px', minHeight: 18 }}>{note || 'ZChat Bot writes a first try. Read it before you post.'}</div>
      <PsDarkButton label="Done" onClick={() => { onSave(text.trim()); onClose(); }} />
    </PsSheet>
  );
}

const PS_POLL_ENDS = [[0, 'No end'], [86400000, '1 day'], [3 * 86400000, '3 days'], [7 * 86400000, '1 week']];
export function PsPollSheet({ value, onSave, onClose }) {
  const [q, setQ] = useState(value ? value.q || '' : '');
  const [opts, setOpts] = useState(() => (value && Array.isArray(value.o) && value.o.length >= 2 ? value.o.slice(0, 4) : ['', '']));
  const [d, setD] = useState(value ? value.d || 0 : 86400000);
  const filled = opts.map((o) => o.trim()).filter(Boolean);
  const dup = new Set(filled.map((o) => o.toLowerCase())).size !== filled.length;
  const ok = filled.length >= 2 && !dup;
  const setOpt = (i, v) => setOpts((list) => list.map((o, j) => (j === i ? v.slice(0, 60) : o)));
  return (
    <PsSheet title={value ? 'Edit poll' : 'Add a poll'} onClose={onClose}>
      <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 140))} placeholder="Ask a question" aria-label="Poll question" enterKeyHint="next" style={{ ...psDarkInput, fontWeight: 700 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {opts.map((o, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <input value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Choice ${i + 1}`} aria-label={`Choice ${i + 1}`} enterKeyHint={i < opts.length - 1 ? 'next' : 'done'} style={{ ...psDarkInput, paddingRight: opts.length > 2 ? 44 : 14 }} />
            {opts.length > 2 && <div role="button" aria-label={`Remove choice ${i + 1}`} onClick={() => setOpts((list) => list.filter((_, j) => j !== i))} style={{ position: 'absolute', right: 6, top: 6, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}><X size={17} /></div>}
          </div>
        ))}
        {opts.length < 4 && <div role="button" aria-label="Add a choice" onClick={() => setOpts((list) => [...list, ''])} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 6px', cursor: 'pointer', fontSize: 14.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}><Plus size={18} />Add a choice</div>}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', padding: '14px 2px 8px' }}>Voting ends</div>
      <div role="radiogroup" aria-label="Voting ends" style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 12, background: 'rgba(255,255,255,0.08)' }}>
        {PS_POLL_ENDS.map(([v, l]) => (
          <div key={v} role="radio" aria-checked={d === v} aria-label={l} onClick={() => { hapticTap(); setD(v); }} style={{ flex: 1, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: d === v ? '#FFFFFF' : 'transparent', color: d === v ? '#000000' : 'rgba(255,255,255,0.8)', transition: 'background 160ms ease, color 160ms ease' }}>{l}</div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: dup ? '#FFB4BC' : 'rgba(255,255,255,0.5)', padding: '10px 2px 14px', lineHeight: 1.45 }}>{dup ? 'Two choices are the same.' : 'Everyone gets one vote. They see the results after voting.'}</div>
      <PsDarkButton label={value ? 'Save poll' : 'Add poll'} disabled={!ok} onClick={() => { onSave({ q: q.trim(), o: filled, d }); onClose(); }} />
      {value && <div style={{ height: 8 }} />}
      {value && <PsDarkButton plain label="Remove poll" onClick={() => { onSave(null); onClose(); }} />}
    </PsSheet>
  );
}

async function psDecodeAudio(file) {
  const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC || !file) throw new Error('nosupport');
  const raw = await file.arrayBuffer();
  const ctx = new AC(1, 16000, 16000);
  const audio = await new Promise((res, rej) => { try { const p = ctx.decodeAudioData(raw, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } });
  if (!audio || !audio.length) throw new Error('silent');
  const rate = audio.sampleRate;
  const step = Math.max(1, Math.round(rate / 16000));
  const n = Math.floor(audio.length / step);
  const pcm = new Float32Array(n);
  const chs = [];
  for (let c = 0; c < audio.numberOfChannels; c++) chs.push(audio.getChannelData(c));
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = 0; k < step; k++) for (let c = 0; c < chs.length; c++) s += chs[c][i * step + k] || 0;
    pcm[i] = s / (step * chs.length);
  }
  return { pcm, rate: rate / step, dur: audio.duration };
}
function psWavB64(pcm, rate, from, to) {
  const n = Math.max(0, to - from);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, Math.round(rate), true); v.setUint32(28, Math.round(rate) * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, pcm[from + i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true); }
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 32768) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 32768));
  return btoa(bin);
}
const PS_CC_PART = 30;
async function psMakeCaptions(file, onProg, alive) {
  const { pcm, rate, dur } = await psDecodeAudio(file);
  if (dur > 600) throw new Error('long');
  const parts = Math.max(1, Math.ceil(dur / PS_CC_PART));
  const cues = [];
  const langs = {};
  for (let i = 0; i < parts; i++) {
    if (alive && !alive()) throw new Error('stopped');
    onProg(i + 1, parts);
    const from = Math.floor(i * PS_CC_PART * rate);
    const to = Math.min(pcm.length, Math.floor((i + 1) * PS_CC_PART * rate));
    let e = 0;
    for (let k = from; k < to; k += 4) e += pcm[k] * pcm[k];
    if (Math.sqrt(e / Math.max(1, (to - from) / 4)) < 0.003) continue;
    const body = { audio: psWavB64(pcm, rate, from, to), offset: i * PS_CC_PART, dur: (to - from) / rate, part: i + 1, parts };
    let r = await postsFn('captions', body, 60000);
    if (r.status === 0 || r.status >= 500) r = await postsFn('captions', body, 60000);
    if (!r.data || !Array.isArray(r.data.cues)) { const err = new Error('fn'); err.r = r; throw err; }
    r.data.cues.forEach((c) => { if (Array.isArray(c) && c.length === 3 && typeof c[2] === 'string' && c[2].trim()) cues.push([Number(c[0]) || 0, Number(c[1]) || 0, c[2].trim().slice(0, 240)]); });
    if (r.data.lang) langs[r.data.lang] = (langs[r.data.lang] || 0) + 1;
  }
  const l = Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([k]) => k)[0] || '';
  return { l, c: cues.sort((a, b) => a[0] - b[0]).slice(0, 800) };
}
export function PsCaptionsSheet({ item, value, onSave, onClose }) {
  const [cc, setCc] = useState(value || null);
  const [st, setSt] = useState(value ? 'done' : 'idle');
  const [prog, setProg] = useState({ i: 0, n: 0 });
  const [err, setErr] = useState('');
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);
  const run = async () => {
    setSt('work'); setErr(''); setProg({ i: 0, n: 0 });
    try {
      const out = await psMakeCaptions(item.file, (i, n) => { if (aliveRef.current) setProg({ i, n }); }, () => aliveRef.current);
      if (!aliveRef.current) return;
      if (!out.c.length) { setSt('error'); setErr('Nobody seems to be talking in this video, so there is nothing to caption.'); return; }
      setCc(out); setSt('done'); hapticTap();
    } catch (e) {
      if (!aliveRef.current) return;
      setSt('error');
      setErr(e && e.message === 'long' ? 'Captions work for videos up to 10 minutes.' : e && e.message === 'fn' ? psFnError(e.r, 'Captions are busy right now. Try again soon.') : e && e.message === 'nosupport' ? 'This browser cannot read the sound of this video.' : 'The sound of this video could not be read.');
    }
  };
  const setCue = (i, t) => setCc((x) => ({ ...x, c: x.c.map((c, j) => (j === i ? [c[0], c[1], t.slice(0, 240)] : c)) }));
  const save = () => { const c = ((cc && cc.c) || []).filter((x) => x[2].trim()); onSave(c.length ? { l: cc.l || '', c } : null); onClose(); };
  const pct = prog.n ? Math.round(((prog.i - 0.5) / prog.n) * 100) : 4;
  return (
    <PsSheet title="Captions" onClose={onClose}>
      {st !== 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12, paddingTop: 2 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.75)' }}>ZChat listens to the video and writes subtitles in the language people speak. You can fix any word before you post.</div>
          {st === 'work' ? (
            <div role="status" aria-live="polite" style={{ padding: '6px 0 4px' }}>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{prog.n > 1 ? `Listening to part ${prog.i} of ${prog.n}` : 'Listening to the video'}</div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.14)', marginTop: 10, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.max(4, Math.min(100, pct))}%`, background: '#FFFFFF', borderRadius: 2, transition: 'width 300ms ease' }} /></div>
            </div>
          ) : (
            <>
              {err && <div role="alert" style={{ fontSize: 13.5, lineHeight: 1.45, color: '#FFB4BC' }}>{err}</div>}
              <PsDarkButton label={err ? 'Try again' : 'Make captions'} onClick={run} />
            </>
          )}
        </div>
      )}
      {st === 'done' && cc && (
        <>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', padding: '0 2px 8px' }}>{cc.c.length === 1 ? '1 line' : `${cc.c.length} lines`}. Tap a line to fix it.</div>
          <div role="list" aria-label="Caption lines" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {cc.c.map((c, i) => (
              <div key={i} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 38, flexShrink: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{psClock(c[0])}</span>
                <input value={c[2]} onChange={(e) => setCue(i, e.target.value)} aria-label={`Caption at ${psClock(c[0])}`} style={{ ...psDarkInput, padding: '9px 12px', fontSize: 15 }} />
              </div>
            ))}
          </div>
          <PsDarkButton label="Done" onClick={save} />
          <div style={{ height: 8 }} />
          <PsDarkButton plain label="Remove captions" onClick={() => { onSave(null); onClose(); }} />
        </>
      )}
    </PsSheet>
  );
}

export function PsTagPicker({ myId, taken, onPick, onClose }) {
  const [q, setQ] = useState('');
  const recent = useMemo(() => {
    const seen = new Set();
    const iFollow = homeSnapSet(myId, 'ifollow');
    const allowed = homeSnapSet(myId, 'allowed');
    return (homeSnapPart(myId, 'convs', []) || []).map((c) => c && c.otherProfile)
      .filter((p) => p && p.id && p.id !== myId && p.username && !p.is_bot && !p.is_deleted && !seen.has(p.id) && seen.add(p.id) && privacyAllows(p, 'privacy_tags', myId, iFollow, allowed)).slice(0, 40);
  }, [myId]);
  const localFor = (term) => { const t = term.toLowerCase(); return recent.filter((p) => String(p.name || '').toLowerCase().includes(t) || String(p.username || '').toLowerCase().includes(t)).slice(0, 12); };
  const [people, setPeople] = useState(() => recent.slice(0, 8));
  const [hidden, setHidden] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const term = q.trim().replace(/^@/, '');
    if (!term) { setPeople(recent.slice(0, 8)); setHidden(0); setBusy(false); return undefined; }
    let gone = false;
    setBusy(true);
    setPeople(localFor(term));
    const t = setTimeout(async () => {
      const { data } = await searchAccounts(term);
      const found = sanitizeAvatarList(data || [], myId).filter((p) => p.id !== myId && !p.is_deleted && !p.is_bot).slice(0, 24);
      let tagSet = null;
      if (found.length) { const { data: rows } = await fetchProfilesView(found.map((p) => p.id)); if (rows) tagSet = new Map(rows.map((r) => [r.id, r.privacy_tags])); }
      const iFollow = homeSnapSet(myId, 'ifollow');
      const allowed = homeSnapSet(myId, 'allowed');
      const ok = found.filter((p) => privacyAllows({ ...p, privacy_tags: tagSet ? tagSet.get(p.id) : p.privacy_tags }, 'privacy_tags', myId, iFollow, allowed));
      if (gone) return;
      setBusy(false);
      setPeople(found.length ? ok.slice(0, 12) : localFor(term));
      setHidden(found.length - ok.length);
    }, 220);
    return () => { gone = true; clearTimeout(t); };
  }, [q]);
  return (
    <PsSheet title="Tag someone" onClose={onClose}>
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" aria-label="Search people to tag" autoCapitalize="none" autoCorrect="off" enterKeyHint="search" style={psDarkInput} />
      {!q.trim() && people.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.6)', padding: '12px 2px 0' }}>Recent chats</div>}
      <div role="list" aria-label="People" style={{ padding: '8px 0 4px', minHeight: 120 }}>
        {people.map((p) => {
          const already = taken.has(p.id);
          return (
            <div key={p.id} role="listitem" aria-label={already ? `${p.name} is already tagged` : `Tag ${p.name}`} onClick={() => { if (!already) onPick(p); }} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 2px', cursor: already ? 'default' : 'pointer', opacity: already ? 0.45 : 1 }}>
              <Avatar emoji={p.avatar} name={p.name} size={40} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>@{p.username}{already ? ', tagged' : ''}</div>
              </div>
            </div>
          );
        })}
        {!people.length && <div style={{ textAlign: 'center', padding: '22px 12px', fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>{busy ? 'Looking' : q.trim() ? (hidden ? 'Nobody you can tag matches that' : 'Nobody found') : 'Type a name to tag someone'}</div>}
        {hidden > 0 && <div style={{ textAlign: 'center', padding: '4px 12px 8px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{hidden === 1 ? '1 account does not allow tags from you.' : `${hidden} accounts do not allow tags from you.`}</div>}
      </div>
    </PsSheet>
  );
}

const RECAP_BG = ['linear-gradient(160deg, #6D28D9, #DB2777)', 'linear-gradient(160deg, #0EA5E9, #6366F1)', 'linear-gradient(160deg, #F97316, #E11D48)', 'linear-gradient(160deg, #10B981, #0EA5E9)', 'linear-gradient(160deg, #F59E0B, #EF4444)', 'linear-gradient(160deg, #8B5CF6, #0EA5E9)', 'linear-gradient(160deg, #EC4899, #8B5CF6)', 'linear-gradient(160deg, #111827, #4C1D95)'];
function hourLabel(h) {
  if (h == null) return '';
  const n = Number(h);
  const ampm = n >= 12 ? 'PM' : 'AM';
  const hh = n % 12 === 0 ? 12 : n % 12;
  return `${hh} ${ampm}`;
}
function recapSlides(r, me) {
  const out = [];
  const year = r.year;
  out.push({ big: `${year}`, title: 'Your year on ZChat', sub: `A look back at everything you shared, ${(me.name || '').split(' ')[0] || 'friend'}.`, avatar: true });
  out.push({ big: formatCount(Number(r.sent) || 0), title: 'Messages you sent', sub: `And ${formatCount(Number(r.received) || 0)} came back to you.` });
  if (Array.isArray(r.top) && r.top.length) out.push({ title: 'Your top people', list: r.top.slice(0, 5) });
  if (r.day && r.day.d) out.push({ big: fmtDate(new Date(`${r.day.d}T12:00:00`), { month: 'short', day: 'numeric' }), title: 'Your busiest day', sub: `${formatCount(Number(r.day.n) || 0)} messages in one day.${r.hour != null ? ` You chat most around ${hourLabel(r.hour)}.` : ''}` });
  if (Number(r.streak) >= 2) out.push({ big: `${r.streak} days`, title: 'Your longest streak', sub: 'Chatting every single day. That is dedication.', flame: true });
  if (Array.isArray(r.emoji) && r.emoji.length) out.push({ title: 'Your favourite reactions', emoji: r.emoji.slice(0, 3) });
  out.push({ title: 'What you shared', grid: [[formatCount(Number(r.photos) || 0), 'photos and videos'], [formatCount(Number(r.voice) || 0), 'voice messages'], [formatCount(Number(r.stickers) || 0), 'stickers'], [formatCount(Number(r.stories) || 0), 'stories'], [formatCount(Number(r.posts) || 0), 'posts'], [formatCount(Number(r.games) || 0), 'games won']] });
  if (r.group && r.group.name) out.push({ big: r.group.name, title: 'Your favourite group', sub: `${formatCount(Number(r.group.n) || 0)} messages from you in there.`, smallBig: true });
  out.push({ title: 'Thanks for a great year', sub: 'Share your recap and see what your friends got.', share: true });
  return out;
}
async function recapImage(r, me) {
  const W = 1080;
  const H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#6D28D9'); grad.addColorStop(0.55, '#DB2777'); grad.addColorStop(1, '#F59E0B');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 211) % W, (i * 367) % H, 60 + (i % 5) * 30, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = '#FFFFFF';
  g.textAlign = 'center';
  g.font = '800 64px Manrope, system-ui, sans-serif';
  g.fillText(`My ${r.year} on ZChat`, W / 2, 230);
  g.font = '600 42px Manrope, system-ui, sans-serif';
  g.fillText(`@${me.username || ''}`, W / 2, 300);
  const stats = [[formatCount(Number(r.sent) || 0), 'messages sent'], [formatCount(Number(r.photos) || 0), 'photos and videos'], [countWord(Number(r.streak) || 0, 'day', 'days'), 'longest streak'], [formatCount(Number(r.stories) || 0), 'stories shared']];
  stats.forEach(([n, l], i) => {
    const y = 520 + i * 260;
    g.font = '900 120px Manrope, system-ui, sans-serif';
    g.fillText(n, W / 2, y);
    g.font = '700 46px Manrope, system-ui, sans-serif';
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillText(l, W / 2, y + 70);
    g.fillStyle = '#FFFFFF';
  });
  if (Array.isArray(r.top) && r.top[0]) {
    g.font = '700 46px Manrope, system-ui, sans-serif';
    g.fillText(`Top person: ${String(r.top[0].name || '').slice(0, 24)}`, W / 2, 1620);
  }
  g.font = '900 72px Manrope, system-ui, sans-serif';
  g.fillText('zchat', W / 2, 1800);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
export function RecapPage({ me, onClose }) {
  useBackClose(true, onClose);
  const now = new Date();
  const year = now.getMonth() === 0 && now.getDate() <= 31 ? now.getFullYear() - 1 : now.getFullYear();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    supabase.rpc('zchat_recap', { p_year: year, p_tz: localTz() }).then(({ data: d, error }) => {
      if (!alive) return;
      if (error || !d) { setErr('Your recap switches on once the latest ZChat setup is finished.'); return; }
      setData(d);
    });
    return () => { alive = false; };
  }, []);
  const slides = data ? recapSlides(data, me) : [];
  const s = slides[i];
  const go = (dir) => { setI((x) => Math.max(0, Math.min(slides.length - 1, x + dir))); hapticTap(); };
  const share = async () => {
    if (busy || !data) return;
    setBusy(true);
    try {
      const blob = await recapImage(data, me);
      if (blob) {
        const file = new File([blob], `zchat-${data.year}-recap.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'My ZChat recap' });
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
      }
    } catch {}
    setBusy(false);
  };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: '#05060A', display: 'flex', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: '100%', background: s ? RECAP_BG[i % RECAP_BG.length] : '#111', color: '#FFFFFF', fontFamily: FONT, display: 'flex', flexDirection: 'column', transition: 'background 0.4s ease' }}>
        <div style={{ display: 'flex', gap: 4, padding: 'calc(10px + env(safe-area-inset-top)) 12px 0' }}>
          {slides.map((_, k) => <div key={k} style={{ flex: 1, height: 3, borderRadius: 2, background: k <= i ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }} />)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 8px 0' }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 800, paddingLeft: 8 }}>{data ? `${data.year} recap` : 'Recap'}</div>
          <div role="button" aria-label="Close recap" onClick={onClose} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={22} /></div>
        </div>
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          {!data && !err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={28} /></div>}
          {err && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center', fontSize: 15, lineHeight: 1.5 }}>{err}</div>}
          {s && (
            <div key={i} className="zchat-pop" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 26px', textAlign: 'center' }}>
              {s.avatar && <div style={{ marginBottom: 18 }}><Avatar emoji={me.avatar} name={me.name} size={96} /></div>}
              {s.flame && <FlameIcon size={64} />}
              {s.big && <div style={{ fontSize: s.smallBig ? 34 : 64, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, wordBreak: 'break-word' }}>{s.big}</div>}
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: s.big ? 12 : 0 }}>{s.title}</div>
              {s.sub && <div style={{ fontSize: 15, opacity: 0.88, marginTop: 10, lineHeight: 1.5, maxWidth: 320 }}>{s.sub}</div>}
              {s.list && (
                <div style={{ marginTop: 20, width: '100%', maxWidth: 340 }}>
                  {s.list.map((p, k) => (
                    <div key={p.id || k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 16, background: 'rgba(255,255,255,0.14)', marginTop: k ? 8 : 0 }}>
                      <span style={{ width: 22, fontWeight: 900, fontSize: 16 }}>{k + 1}</span>
                      <Avatar emoji={p.avatar} name={p.name} size={40} />
                      <span style={{ flex: 1, minWidth: 0, textAlign: 'left', fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                      <span style={{ fontSize: 13, opacity: 0.85 }}>{formatCount(Number(p.n) || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
              {s.emoji && <div style={{ display: 'flex', gap: 18, marginTop: 22 }}>{s.emoji.map((e) => <div key={e.e} style={{ textAlign: 'center' }}><div style={{ fontSize: 54 }}>{e.e}</div><div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>{formatCount(Number(e.n) || 0)}</div></div>)}</div>}
              {s.grid && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 20, width: '100%', maxWidth: 340 }}>
                  {s.grid.map(([n, l]) => <div key={l} style={{ padding: '14px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.14)' }}><div style={{ fontSize: 26, fontWeight: 900 }}>{n}</div><div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 2 }}>{l}</div></div>)}
                </div>
              )}
              {s.share && (
                <div role="button" aria-label="Share your recap" onClick={share} className="zchat-press" style={{ marginTop: 26, height: 50, padding: '0 26px', borderRadius: 25, background: '#FFFFFF', color: '#111', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15.5, cursor: 'pointer' }}>{busy ? <Spinner size={16} color="#111" /> : <Share2 size={18} />}Share my recap</div>
              )}
            </div>
          )}
          {s && <div role="button" aria-label="Previous" onClick={() => go(-1)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%' }} />}
          {s && !s.share && <div role="button" aria-label="Next" onClick={() => go(1)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%' }} />}
        </div>
        <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.7, padding: '0 0 calc(18px + env(safe-area-inset-bottom))' }}>{s && !s.share ? 'Tap to keep going' : ''}</div>
      </div>
      </div>
    </Portal>
  );
}

function WnArt({ k, dark = false, thumb = false, style }) {
  const tall = WN_SCENES[k];
  const sc = tall || WN_THUMBS[k] || SPOT_SCENES[k] || WN_SCENES.map;
  const pair = ART_BG[sc.bg] || ART_BG.lilac;
  const bg = dark ? pair[1] : pair[0];
  const vb = tall ? (thumb ? '30 -40 260 200' : '30 -112 260 296') : '16 -4 288 186';
  return (
    <ArtCtx.Provider value={!!dark}>
      <svg viewBox={vb} preserveAspectRatio={tall && !thumb ? 'xMidYMax slice' : 'xMidYMid slice'} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%', background: bg, ...(style || {}) }}>
        {sc.draw(bg)}
      </svg>
    </ArtCtx.Provider>
  );
}

function WnSegments({ total, at, onArt, dark }) {
  const track = onArt ? (dark ? 'rgba(255,255,255,0.24)' : 'rgba(43,37,64,0.16)') : (dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.1)');
  const fill = onArt ? (dark ? '#FFFFFF' : '#2B2540') : (dark ? '#F2F2F4' : '#111113');
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= at ? fill : track, transition: 'background 0.25s ease' }} />)}
    </div>
  );
}

const WN_PHOTOS = { zombies49: '/wn49-zombies.webp', mutant49: '/wn49-mutant.webp', guns50: '/wn50-guns.webp', house50: '/wn50-house.webp', pond50: '/wn50-pond.webp', buttons50: '/wn50-buttons.webp', settings50: '/wn50-settings.webp' };
const WN_HIGHLIGHTS = [
  { k: 'guns50', art: 'guns50', go: 'zombie', cta: 'Play now', title: 'Real guns in your hands', text: 'Five guns made by a real 3D artist, with real reloads, draws, melee hits and grenade throws. Aim down the sights, and every player holds the same guns.' },
  { k: 'house50', art: 'house50', go: 'zombie', cta: 'Play now', title: 'A real town and a big house', text: 'Dead Town is now built from real 3D models. Walk into the big house and go upstairs, but zombies get in too and follow you up the stairs.' },
  { k: 'pond50', art: 'pond50', go: 'zombie', cta: 'Play now', title: 'A pond and a waterfall', text: 'A pond with a waterfall behind the house, real fire and smoke around town, and recorded sounds for your steps, guns and every zombie.' },
];
const WN_SECTIONS = [
  { title: 'Dead Town', items: [
    { art: 'guns50', title: 'Real guns', text: 'Reloads, draws, melee and throws.' },
    { art: 'house50', title: 'A big house to hold', text: 'Go upstairs, zombies follow.' },
    { art: 'pond50', title: 'A pond and a waterfall', text: 'Plus real fire and smoke.' },
    { art: 'room35', title: 'Rooms that work', text: 'Open rooms, play without bots, rejoin in 30 seconds.' },
  ] },
  { title: 'All games', items: [
    { art: 'buttons50', title: 'New skill buttons', text: 'Clear buttons with real icons.' },
    { art: 'settings50', title: 'Settings in sections', text: 'Graphics, controls, sound and more.' },
  ] },
];
const WN_NEW_COUNT = WN_SECTIONS.reduce((n, sec) => n + sec.items.length, 0);
const WN_SUMMARY = `${WN_NEW_COUNT} new things to try.`;

const WN_EARLIER = [
  { title: 'Real zombies', text: 'Eleven zombies made by real 3D artists with recorded moves, and a giant mutant with blade arms every fifth wave.' },
  { title: 'Dead Town, rebuilt', text: 'First person with real sounds, nine kinds of zombies, your own dog, invites for friends, emotes and quick emojis.' },
  { title: 'Dead Town and servers near you', text: 'A new 3D zombie game, servers in Asia, USA and Europe, Scrap Siege for 20 players, a new look for every game and chat for everyone.' },
  { title: 'Scrap Siege for ten and four new heroes', text: 'Ten friends on five big maps, gadgets and dash for every hero, hero levels with scrap, upgrades every second wave and smoother watching.' },
  { title: 'Scrap Siege and police chases', text: 'A live robot fight for four friends, police and shortcuts in Island Rally, new skills and drinks, and names that light up when friends talk.' },
  { title: 'Explosions, a new Gulp and longer levels', text: 'Fireballs and lightning in Island Rally, a brand new Gulp with 15 hard levels, longer Roll Squad and Two Torches levels, and music in every lobby.' },
  { title: 'New game lobbies and watching friends', text: 'Watch and join any game, Island Rally jumps and crashes, Roll Squad team levels and new lobbies with the game playing behind.' },
  { title: 'Attack race and three new maps', text: 'Rockets, oil, shock and shields in Island Rally, plus Tea hills, City lights and Lion rock and rebuilt cars.' },
  { title: 'Island Rally', text: 'Real 3D racing for up to six friends with mic, four rides and bots any time.' },
  { title: 'A Snap style camera', text: 'Face lenses, background blur and beauty, a timer, night mode, hands free video and picking a sound before you record.' },
  { title: 'Talk while you play and lots of new filters', text: 'A mic and reactions in Roll Squad, wooden gates and new enemies in Two Torches, new Gulp skills, filters in groups, a lighter profile menu and Join buttons in your chats.' },
  { title: 'A cleaner look and better games', text: 'Calm greys with a blue accent, easy Roll Squad touch controls with a double jump, and no top size in Gulp.' },
  { title: 'Music on posts and tag controls', text: 'Songs on photo posts, hiding or removing tags from the post menu, sharing posts to your story and new game buttons.' },
  { title: 'A bigger Gulp sea and joining from chat', text: 'A bigger Gulp sea with chests and golden fish, endless missions, clear game screens and a Join button in chats.' },
  { title: 'Gulp rooms and levels', text: 'Gulp rooms for up to ten friends, twenty Gulp levels, sideways play, button size controls, ten new Two Torches temples and two new Roll Squad worlds.' },
  { title: 'Roll Squad, watching friends and game clocks', text: 'A live ball game for up to four friends, a new Gulp, Two Torches enemies and mirror puzzles, watching friends play live, and clocks for chess and checkers.' },
  { title: 'Gulp and endless Two Torches', text: 'A live fish game, new temples every time you play, missions, voice and quick chat in Two Torches, and new rock paper scissors hands.' },
  { title: 'Two Torches and bubble pets', text: 'A live temple game for two, 51 soft 3D bubble pets, real rock paper scissors, Squish with water balloons and better group games.' },
  { title: 'Saved Messages, a cleaner profile and new game pictures', text: 'Your own Saved Messages chat, profile visitors, 9 ball pool, chess clocks, Squish duels and a new attach menu.' },
  { title: 'A game shop, cues and zodiac signs', text: 'The Shop as a little game world with full sets, pool cues and carrom strikers, zodiac signs on profiles and fun on your chats page.' },
  { title: 'Play online, Zap Mayhem and new Mini golf', text: 'Game rooms with room IDs, harder bots, Zap Mayhem, a new Mini golf, boards and tables in the Shop, game faces and a quick account switch.' },
  { title: 'Game rooms, a new Shop and Sinhala and Tamil', text: 'Games full screen with live moves, Carrom, Zap and Squish, a brand new Shop with real previews, better replies, and ZChat in සිංහල and தமிழ்.' },
  { title: 'Games, photo magic and gift bags', text: 'Chess, pool, mini golf, party games, coin gift bags, AI stickers and matching sets.' },
  { title: 'Better calls and safety', text: 'Background blur, captions and voice effects in calls, the photo booth, places, drafts, shared stories, a safety timer, trusted friends, voice intros and compliment cards.' },
  { title: 'Together tools and better groups', text: 'A board, a playlist and a shared note in every chat, Story of us, bubble effects, group admin tools, moving stickers and a GIF maker.' },
  { title: 'Live wallpapers and time capsules', text: 'Moving chat wallpapers, the Fire Phoenix set, sealed time capsules, guestbooks and logging in on a computer with your phone.' },
  { title: 'Peek, communities and going live', text: 'Peek inside chats, communities, voice rooms, going live, name styles, profile themes and super reactions.' },
  { title: 'Effects that never stop', text: 'Profile effects play the whole time someone looks at your profile, and you can clean up your call history.' },
  { title: 'A new Shop and Collection', text: 'Deal of the day, a Popular row, saved Looks, a Wishlist and an effect for every set.' },
  { title: 'Gifts you unwrap', text: 'Wrapped gifts, any amount of coins, and asking a friend for coins.' },
  { title: 'Face ID, spending lock and login alerts', text: 'Unlock with Face ID or your fingerprint, ask for your PIN before coins leave, and know when someone logs in.' },
  { title: 'The Wolf bubble and real sounds', text: 'A howling wolf pup on your messages, and real recordings for taps and the soundboard.' },
  { title: 'Frames and nameplates that move', text: '21 animated sets to mix, match and gift, shown big on your profile.' },
  { title: 'Create with AI and AI characters', text: 'Make pictures and avatars from a few words, and chat with characters you or your friends made.' },
  { title: 'Coins and gifts', text: 'Daily coins, invite rewards and gifts for the people you love.' },
  { title: 'Folders and swipe actions', text: 'Sort chats into folders and swipe a chat to pin, mute or archive it.' },
  { title: 'Music on stories and trending', text: 'Add a song to your story and follow the hashtags people love right now.' },
  { title: 'Profile visitors and questions', text: 'See who looked at your profile and answer questions friends ask without their name.' },
  { title: 'Chat backgrounds and voice effects', text: 'Your own photo behind any chat and fun voices before you send.' },
  { title: 'Spam filter and login activity', text: 'Spam goes to its own folder, and you can see every place you are logged in.' },
  { title: 'Friends map', text: 'See friends who share where they are on a map.' },
  { title: 'Files, threads and topics', text: 'Send any file, reply in threads and split busy groups into topics.' },
  { title: 'Songs on your profile', text: 'Pick a song for your profile and your note.' },
  { title: 'Draw together', text: 'Doodle on one board with friends at the same time.' },
  { title: 'Better calls', text: 'Reactions during calls, floating video and video notes when nobody answers.' },
  { title: 'Story stickers and camera modes', text: 'Add yours, countdown, quiz and link stickers, plus boomerang and dual camera.' },
  { title: 'Friendship page and streak restore', text: 'Your first message together, your favourite time to chat, and a way to bring back a lost streak.' },
  { title: 'Restrict and hidden words', text: 'Quietly limit someone, and hide messages with words you pick.' },
  { title: 'A cleaner look', text: 'Simple lists and plain icons everywhere, from chat details and group info to your profile, Vibes and settings. Plus a new Theme page.' },
  { title: 'Streaks', text: 'Chat with a friend every day to grow a streak and keep it going.' },
  { title: 'Notes', text: 'Leave a short note above your story. Mutual friends see it for 24 hours and can reply.' },
  { title: 'Status', text: 'Tell people what you are up to, like In class or Gaming. It shows in chats and on your profile.' },
  { title: 'Away message', text: 'Turn it on in Settings and people who message you get a reply while you are busy.' },
  { title: 'Secret chats', text: 'Text messages in a secret chat are locked on your phone. Not even ZChat can read them.' },
  { title: 'Hidden chats', text: 'Keep a chat behind a PIN. It leaves your chat list, search and notifications.' },
  { title: 'Catch me up', text: 'Missed a lot? Get a quick summary of the chat in a few lines.' },
  { title: 'Auto translate', text: 'Pick a language in chat details and new messages arrive already translated.' },
  { title: 'Video messages', text: 'Record a round video message of up to 60 seconds from the attach menu.' },
  { title: 'Watch together', text: 'Share a YouTube link and watch with your chat. Play and pause stay in sync for everyone.' },
  { title: 'Focus together', text: 'Start a focus timer in a chat. Friends can join and other chats stay quiet.' },
  { title: 'Shared albums', text: 'Make albums inside a chat and everyone in it can add photos and videos.' },
  { title: 'GIFs and sticker packs', text: 'Search GIFs from the sticker menu. Bundle your stickers into a pack and share it with friends.' },
  { title: 'Chat tones', text: 'Give each chat its own sound so you know who it is without looking.' },
  { title: 'Group tools', text: 'Slow mode, member titles, @everyone and Reply privately for busy groups.' },
  { title: 'Broadcast lists', text: 'Send one message to many people. Each one gets it as a private message.' },
  { title: 'Channels', text: 'Follow channels for updates from people and pages, or start your own.' },
  { title: 'Daily moment', text: 'Once a day at a surprise time, everyone gets 2 minutes to post what they are doing.' },
  { title: 'Story stickers', text: 'Add a question, a poll or an emoji slider to your story and see what everyone answered.' },
  { title: 'Posts with more photos', text: 'Put up to 10 photos and videos in one post and invite a friend to share it with you.' },
  { title: 'Birthdays', text: 'Add your birthday and friends get a reminder on the day so they can wish you.' },
  { title: 'Memories and Year recap', text: 'See what you shared on this day in past years, and swipe through your year on ZChat.' },
  { title: 'Avatar maker', text: 'Make a cartoon avatar and use it as your profile photo.' },
  { title: 'Data saver', text: 'Load smaller photos and stop videos playing on their own. Find it in Settings.' },
  { title: 'Chats saved on your phone', text: 'ZChat opens fast and shows your chats even with no connection.' },
];


function WnStylesArt({ me, dark, thumb }) {
  const name = String((me && (me.name || me.username)) || 'You').split(' ')[0];
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: themeFallback('northern_lights', dark) }}>
      <ThemeCanvas k="northern_lights" dark={dark} small={thumb} fps={thumb ? 15 : 30} still={reducedMotion()} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: thumb ? 0 : '37%', bottom: thumb ? 0 : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: thumb ? '0 4px' : '0 12px' }}>
        <NameStyleArt k="gold" name={name} size={thumb ? 13 : 40} dark={dark} width={thumb ? 50 : 300} />
      </div>
    </div>
  );
}
const WN_STICKERS = ['/as-cat-hi.webp', '/as-tuk-love.webp', '/as-ele-haha.webp'];
function WnStickerArt({ dark, thumb }) {
  const pair = ART_BG.sky;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: thumb ? 0 : 2, padding: thumb ? 0 : '62px 8px 30px', boxSizing: 'border-box', background: dark ? pair[1] : pair[0] }}>
      {WN_STICKERS.map((f, i) => <img key={f} src={f} alt="" draggable={false} style={{ width: thumb ? '33%' : '32%', maxWidth: 156, transform: thumb ? 'none' : `translateY(${i === 1 ? -18 : 6}px) rotate(${i === 0 ? -4 : i === 2 ? 4 : 0}deg)`, pointerEvents: 'none' }} />)}
    </div>
  );
}
function WnLiveWallArt({ dark, thumb }) {
  const spec = LIVE_WALL_BY.aurora;
  const bar = (mine, w) => <div style={{ alignSelf: mine ? 'flex-end' : 'flex-start', width: w, height: thumb ? 7 : 30, borderRadius: thumb ? 4 : 15, background: mine ? '#7C5CFC' : (dark ? 'rgba(30,30,36,0.86)' : 'rgba(255,255,255,0.93)') }} />;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: liveWallBg(spec, dark) }}>
      <LiveWallCanvas k={spec.k} dark={dark} small={thumb} fps={thumb ? 15 : 24} />
      <div style={{ position: 'absolute', inset: 0, background: liveWallVeil(dark) }} />
      <div style={{ position: 'absolute', left: thumb ? 7 : 24, right: thumb ? 7 : 24, bottom: thumb ? 7 : 56, display: 'flex', flexDirection: 'column', gap: thumb ? 3 : 10 }}>
        {bar(false, '58%')}
        {bar(true, '44%')}
        {!thumb && bar(false, '34%')}
      </div>
    </div>
  );
}
function WnPhoto({ src, thumb }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#16181C' }}>
      <img src={src} alt="" aria-hidden="true" draggable={false} style={{ position: 'absolute', inset: '-8%', width: '116%', height: '116%', objectFit: 'cover', filter: 'blur(16px) brightness(0.5) saturate(1.1)' }} />
      <div style={{ position: 'absolute', inset: thumb ? 0 : '0 14px', display: 'flex', alignItems: thumb ? 'stretch' : 'center', justifyContent: 'center' }}>
        <img src={src} alt="" draggable={false} decoding="async" style={thumb ? { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } : { width: '100%', height: 'auto', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.45)' }} />
      </div>
    </div>
  );
}
function WnPic({ k, dark, thumb, me }) {
  if (WN_PHOTOS[k]) return <WnPhoto src={WN_PHOTOS[k]} thumb={thumb} />;
  if (k === 'styles23') return <WnStylesArt me={me} dark={dark} thumb={thumb} />;
  if (k === 'stickers23') return <WnStickerArt dark={dark} thumb={thumb} />;
  if (k === 'decor') return <WnDecorArt me={me} thumb={thumb} />;
  if (k === 'phoenix') return <WnDecorArt me={me} thumb={thumb} keys={['crystal_phoenix', 'fire_phoenix', 'sakura_shrine']} />;
  if (k === 'fxsets') return <WnDecorArt me={me} thumb={thumb} keys={['jellyfish_glow', 'spirit_wolf', 'unicorn_dream']} />;
  if (k === 'fxall') return <WnDecorArt me={me} thumb={thumb} keys={['sakura_shrine', 'koi_pond', 'space_explorer']} />;
  if (k === 'walls') return <WnLiveWallArt dark={dark} thumb={thumb} />;
  return <WnArt k={k} dark={dark} thumb={thumb} />;
}

export function WhatsNewSheet({ onClose, onTry, me }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const dark = !!theme.dark;
  const hl = WN_HIGHLIGHTS;
  const pages = hl.length + 1;
  const [at, setAt] = useState(0);
  const [drag, setDrag] = useState(0);
  const [earlier, setEarlier] = useState(false);
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const still = reducedMotion();
  const go = (n) => {
    const v = Math.max(0, Math.min(pages - 1, n));
    if (v === at) return;
    setAt(v);
    hapticTap();
  };
  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId, lock: null, t: Date.now() };
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.lock) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) { d.lock = 'x'; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
      else if (Math.abs(dy) > 8) d.lock = 'y';
    }
    if (d.lock === 'x') {
      const edge = (at === 0 && dx > 0) || (at === pages - 1 && dx < 0);
      setDrag(edge ? dx * 0.28 : dx);
    }
  };
  const onUp = (e) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.lock === 'x') {
      const dx = e.clientX - d.x;
      const w = wrapRef.current ? wrapRef.current.clientWidth : 360;
      const fast = Math.abs(dx) / Math.max(1, Date.now() - d.t) > 0.45;
      if (dx < -w * 0.2 || (fast && dx < -30)) go(at + 1);
      else if (dx > w * 0.2 || (fast && dx > 30)) go(at - 1);
    }
    setDrag(0);
  };
  const tapArt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.3) go(at - 1); else go(at + 1);
  };
  const tryIt = (item) => {
    onClose();
    if (onTry && item.go) setTimeout(() => onTry(item.go), 60);
  };
  const artH = 'min(52%, 470px)';
  const onArtInk = dark ? '#FFFFFF' : '#2B2540';
  const lastPage = at === pages - 1;
  return (
    <Portal>
      <div role="dialog" aria-label="What is new" className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 660, background: theme.panelBg, fontFamily: FONT, overflow: 'hidden' }}>
        <div ref={wrapRef} data-no-swipe="true" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
          style={{ position: 'absolute', inset: 0, touchAction: 'pan-y', overflow: 'hidden' }}>
          <div style={{ display: 'flex', height: '100%', width: `${pages * 100}%`, transform: `translateX(calc(${-at * (100 / pages)}% + ${drag}px))`, transition: drag ? 'none' : (still ? 'none' : 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)'), willChange: 'transform' }}>
            {hl.map((it, i) => (
              <section key={it.k} aria-hidden={at !== i} style={{ position: 'relative', width: `${100 / pages}%`, height: '100%', flexShrink: 0, background: theme.panelBg }}>
                <div onClick={tapArt} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: artH, overflow: 'hidden', cursor: 'pointer' }}>
                  <div className={at === i && !still ? 'zwn-pop' : undefined} style={{ position: 'absolute', inset: 0 }}><WnPic k={it.art || it.k} dark={dark} me={me} /></div>
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: `calc(${artH} - 30px)`, bottom: 0, background: theme.panelBg, borderRadius: '30px 30px 0 0', padding: '30px 24px calc(18px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: theme.ink, lineHeight: 1.12, textWrap: 'balance' }}>{it.title}</div>
                  <div style={{ fontSize: 16.5, lineHeight: 1.5, color: theme.muted, marginTop: 12, overflowY: 'auto', minHeight: 0, textWrap: 'pretty' }}>{it.text}</div>
                  <div style={{ flex: 1, minHeight: 12 }} />
                  {it.go && onTry && <BigButton label={it.cta || 'Try it'} onClick={() => tryIt(it)} style={{ height: 54, borderRadius: 16, fontSize: 17 }} />}
                  <button type="button" onClick={() => go(i + 1)} className="zchat-press" style={{ height: 50, marginTop: 6, borderRadius: 16, border: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 16.5, fontWeight: 650, cursor: 'pointer' }}>{i === hl.length - 1 ? 'See everything new' : 'Next'}</button>
                </div>
              </section>
            ))}
            <section aria-hidden={!lastPage} style={{ position: 'relative', width: `${100 / pages}%`, height: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', background: theme.panelBg }}>
              <div style={{ height: 'calc(env(safe-area-inset-top) + 66px)', flexShrink: 0 }} />
              <div data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 20px 16px' }}>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: theme.ink }}>Everything new</div>
                <div style={{ fontSize: 15.5, lineHeight: 1.45, color: theme.muted, marginTop: 6 }}>{WN_SUMMARY}</div>
                {WN_SECTIONS.map((sec) => (
                  <div key={sec.title} style={{ marginTop: 22 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: theme.muted, marginBottom: 2 }}>{sec.title}</div>
                    {sec.items.map((row, j) => (
                      <div key={row.title} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: j < sec.items.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                        <div style={{ width: 74, height: 54, borderRadius: 13, overflow: 'hidden', flexShrink: 0 }}><WnPic k={row.art} dark={dark} me={me} thumb /></div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>{row.title}</div>
                          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.4, marginTop: 2, textWrap: 'pretty' }}>{row.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div style={{ marginTop: 22, padding: '14px 0', borderTop: `1px solid ${theme.border}`, fontSize: 14.5, color: theme.muted, lineHeight: 1.45 }}>Bug fixes and improvements.</div>
                <div role="button" onClick={() => setEarlier((v) => !v)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', cursor: 'pointer', borderTop: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink }}>Earlier updates</span>
                  <ChevronRight size={18} color={theme.muted} style={{ transform: earlier ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }} />
                </div>
                {earlier && WN_EARLIER.map((it) => (
                  <div key={it.title} style={{ padding: '9px 0' }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: theme.ink }}>{it.title}</div>
                    <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.45, marginTop: 1 }}>{it.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 20px calc(16px + env(safe-area-inset-bottom))', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
                <BigButton label="Got it" onClick={onClose} style={{ height: 54, borderRadius: 16, fontSize: 17 }} />
              </div>
            </section>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'calc(env(safe-area-inset-top) + 10px) 16px 0', pointerEvents: 'none', zIndex: 3 }}>
          <WnSegments total={pages} at={at} onArt={!lastPage} dark={dark} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: lastPage ? theme.muted : onArtInk, opacity: lastPage ? 1 : 0.85 }}>ZChat {APP_VERSION}</span>
            <div role="button" aria-label="Close" onClick={onClose} style={{ width: 40, height: 40, marginRight: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', pointerEvents: 'auto', color: lastPage ? theme.ink : onArtInk }}><X size={24} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
function FriendsMapIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z" /><path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function SiSoundStage({ k, owned, onUsed }) {
  const p = SI_SOUND_BY[k];
  const [playing, setPlaying] = useState(null);
  const [, setTick] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const tone = readTone();
  const ring = readRingtone();
  const play = (s) => {
    const key = `sp:${p.key}:${s.id}`;
    hapticTap();
    spPlay(key);
    setPlaying(s.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), Math.round(s.at[1] * 1000) + 200);
  };
  const use = (s) => {
    const key = `sp:${p.key}:${s.id}`;
    hapticTap();
    if (s.kind === 'ring') { try { localStorage.setItem('zchat-ringtone', key); } catch {} onUsed(`${s.label} is your ringtone`); }
    else { try { localStorage.setItem('zchat-tone', key); } catch {} onUsed(`${s.label} is your message tone`); }
    setTick((n) => n + 1);
  };
  return (
    <div style={{ borderRadius: 20, background: CL.card, boxShadow: `inset 0 0 0 1px ${CL.line}`, overflow: 'hidden' }}>
      {p.list.map((s, i) => {
        const key = `sp:${p.key}:${s.id}`;
        const inUse = s.kind === 'ring' ? ring === key : tone === key;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i ? `1px solid ${CL.line}` : 'none' }}>
            <div role="button" aria-label={`Play ${s.label}`} onClick={() => play(s)} className="zchat-press" style={{ width: 38, height: 38, borderRadius: 19, background: playing === s.id ? p.accent : CL.card2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 160ms ease' }}>
              <Play size={15} fill="#FFFFFF" strokeWidth={0} />
            </div>
            <div role="button" aria-label={`Play ${s.label}`} onClick={() => play(s)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: CL.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
              <div style={{ fontSize: 12.5, color: CL.ink2, marginTop: 1 }}>{s.kind === 'ring' ? 'Ringtone' : 'Message tone'}{`, ${s.at[1].toFixed(1)} seconds`}</div>
            </div>
            {owned && (inUse
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 650, color: CL.own, flexShrink: 0 }}><Check size={15} strokeWidth={2.6} />In use</span>
              : <div role="button" aria-label={`Use ${s.label} as your ${s.kind === 'ring' ? 'ringtone' : 'message tone'}`} onClick={() => use(s)} className="zchat-press" style={{ height: 30, padding: '0 12px', borderRadius: 15, background: 'rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', fontSize: 13, fontWeight: 650, color: CL.ink, cursor: 'pointer', flexShrink: 0 }}>Use</div>)}
          </div>
        );
      })}
    </div>
  );
}
export function SessionsSection({ userId }) {
  const { theme } = useTheme();
  const [rows, setRows] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [alerts, setAlertsRaw] = useState(true);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { const m = data && data.user && data.user.user_metadata; if (m && m.login_alerts === false) setAlertsRaw(false); }).catch(() => {}); }, []);
  const setAlerts = (v) => { setAlertsRaw(v); supabase.auth.updateUser({ data: { login_alerts: !!v } }).catch(() => {}); };
  const mine = getDeviceId();
  const load = async () => {
    if (!userId) { setRows([]); return; }
    const { data, error } = await supabase.from('user_devices').select('*').eq('user_id', userId).order('last_active', { ascending: false }).limit(30);
    if (error) { setUnavailable(true); setRows([]); return; }
    setUnavailable(false);
    setRows((data || []).filter((r) => !r.revoked));
  };
  useEffect(() => { load(); }, [userId]);
  const others = (rows || []).filter((r) => r.device_id !== mine);
  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2600); };
  const logOutOne = async (r) => {
    setBusy(true);
    let { error } = await supabase.rpc('zchat_revoke_device', { p_device: r.device_id });
    if (error) ({ error } = await supabase.from('user_devices').update({ revoked: true }).eq('user_id', userId).eq('device_id', r.device_id));
    if (error) ({ error } = await supabase.from('user_devices').delete().eq('user_id', userId).eq('device_id', r.device_id));
    setBusy(false);
    setConfirm(null);
    if (error) { flash('That did not work. Try again.'); return; }
    flash(`${r.label || 'That device'} will be logged out the next time it opens ZChat.`);
    load();
  };
  const logOutOthers = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) { setBusy(false); setConfirm(null); flash(friendlyError(error, "Couldn't log out the other devices. Try again.")); return; }
    if (userId) {
      const { error: e2 } = await supabase.from('user_devices').update({ revoked: true }).eq('user_id', userId).neq('device_id', mine);
      if (e2) await supabase.from('user_devices').delete().eq('user_id', userId).neq('device_id', mine);
    }
    setBusy(false); setConfirm(null);
    flash('Every other device was logged out.');
    load();
  };
  const active = (r) => Date.now() - new Date(r.last_active).getTime() < 6 * 60000;
  return (
    <div>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.55, padding: '6px 2px 4px', textWrap: 'pretty' }}>Phones and browsers logged in to your account. If one is not yours, log it out and change your password.</div>
      <LoginRequestList uid={userId} />
      {rows === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} color={theme.muted} /></div> : unavailable ? (
        <div style={{ fontSize: 13.5, color: theme.muted, padding: '12px 2px' }}>The device list is not available yet. You can still log out the other devices below.</div>
      ) : (
        <div role="list" aria-label="Logged in devices">
          {rows.map((r) => {
            const me0 = r.device_id === mine;
            return (
              <div key={r.id || r.device_id} role="listitem" aria-label={r.label || 'Device'} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 2px', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
                <div style={{ width: 28, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}><SessionDeviceIcon label={r.label} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label || 'Unknown device'}</div>
                  <div style={{ fontSize: 12.5, color: me0 || active(r) ? '#16A34A' : theme.muted, marginTop: 1 }}>
                    {me0 ? 'This device' : active(r) ? 'Active now' : `Last active ${timeAgoLong(r.last_active).toLowerCase()}`}
                    <span style={{ color: theme.muted }}>{r.place ? `, ${r.place}` : ''}</span>
                  </div>
                </div>
                {!me0 && <div role="button" aria-label={`Log out ${r.label || 'device'}`} onClick={() => setConfirm({ one: r })} style={{ fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: 6 }}>Log out</div>}
              </div>
            );
          })}
        </div>
      )}
      <IgRow inset={false} label="Login alerts" sub="Get notified when a new device logs in" right={<IgToggle on={alerts} onClick={() => setAlerts(!alerts)} />} />
      {note && <div style={{ color: theme.ink, fontSize: 13.5, fontWeight: 600, padding: '10px 2px' }}>{note}</div>}
      {others.length > 0 && <div style={{ marginTop: 14 }}><BigButton label={others.length > 1 ? `Log out ${others.length} other devices` : 'Log out other devices'} tone="plain" onClick={() => setConfirm({ all: true })} /></div>}
      {confirm && (
        <ConfirmDialog layer={700} title={confirm.all ? 'Log out other devices?' : `Log out ${confirm.one.label || 'this device'}?`} body={confirm.all ? 'Every other phone and browser logged in to your account will be logged out. You stay logged in here.' : 'It will be logged out the next time it opens ZChat.'}
          confirmLabel="Log out" onCancel={() => setConfirm(null)} onConfirm={confirm.all ? logOutOthers : () => logOutOne(confirm.one)} />
      )}
    </div>
  );
}
function capsuleNextBirthday(md) {
  const m = /^(\d{2})-(\d{2})$/.exec(String(md || ''));
  if (!m) return null;
  const now = new Date();
  const mk = (y) => { const d = new Date(y, Number(m[1]) - 1, Number(m[2]), 8, 0, 0, 0); return d.getMonth() === Number(m[1]) - 1 ? d : null; };
  let d = mk(now.getFullYear());
  if (!d || d.getTime() <= Date.now() + 5 * 60000) d = mk(now.getFullYear() + 1);
  return d && d.getTime() <= Date.now() + 365 * 86400000 ? d.getTime() : null;
}
const capsuleDraftMem = new Map();
export function CapsuleComposer({ peer, group, myId, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  capsuleCss();
  const draftKey = group ? `g:${group.id}` : `d:${peer ? peer.id : ''}`;
  const saved = capsuleDraftMem.get(draftKey) || null;
  const [text, setText] = useState(saved ? saved.text : '');
  const [file, setFile] = useState(saved ? saved.file : null);
  const [kind, setKind] = useState(saved ? saved.kind : null);
  const [when, setWhen] = useState(saved ? saved.when : 'week');
  const [custom, setCustom] = useState(() => (saved && saved.custom) || laterInputValue(Date.now() + 30 * 86400000));
  const [bday, setBday] = useState(null);
  const [rec, setRec] = useState(null);
  const [err, setErr] = useState('');
  const [fileUrl, setFileUrl] = useState(null);
  const photoRef = useRef(null);
  const recRef = useRef(null);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { capsuleDraftMem.set(draftKey, { text, file, kind, when, custom }); }, [text, file, kind, when, custom]);
  useEffect(() => {
    if (!file) { setFileUrl(null); return undefined; }
    const u = URL.createObjectURL(file);
    setFileUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => {
    if (!peer || peer.id === myId) return undefined;
    let alive = true;
    supabase.from('birthdays').select('md').eq('user_id', peer.id).maybeSingle().then(({ data }) => { if (alive && data && data.md) setBday(data.md); }, () => {});
    return () => { alive = false; };
  }, [peer && peer.id]);
  useEffect(() => () => { const r = recRef.current; if (r) { clearInterval(r.t); try { if (r.rec.state !== 'inactive') r.rec.stop(); } catch {} try { r.stream.getTracks().forEach((t) => t.stop()); } catch {} } }, []);
  const now = Date.now();
  const bdayAt = bday ? capsuleNextBirthday(bday) : null;
  const plus = (days) => now + days * 86400000;
  const monthAt = (() => { const x = new Date(now); x.setMonth(x.getMonth() + 1); return x.getTime(); })();
  const customAt = custom ? new Date(custom).getTime() : NaN;
  const choices = [
    { k: 'tomorrow', label: 'Tomorrow', at: plus(1) },
    { k: 'week', label: 'In a week', at: plus(7) },
    { k: 'month', label: 'In a month', at: monthAt },
    bdayAt ? { k: 'bday', label: `On ${String(peer.name || '').split(' ')[0] || 'their'}'s birthday`, at: bdayAt } : null,
    { k: 'pick', label: 'Pick a date and time', at: customAt },
  ].filter(Boolean);
  const pick = choices.find((c) => c.k === when) || choices[1];
  const at = pick.at;
  const atOk = Number.isFinite(at) && at > Date.now() + 2 * 60000 && at <= Date.now() + 365 * 86400000;
  const hasBody = !!text.trim() || !!file;
  const canSeal = hasBody && atOk && !rec;
  const canRecord = typeof window !== 'undefined' && !!window.MediaRecorder && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const pickPhoto = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type || '')) { setErr('Pick a photo for the time capsule.'); return; }
    if (f.size > 15 * 1024 * 1024) { setErr('That photo is too big. Pick one under 15 MB.'); return; }
    setErr('');
    setFile(f);
    setKind('image');
    hapticTap();
  };
  const startRec = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find((x) => { try { return MediaRecorder.isTypeSupported(x); } catch { return false; } }) || '';
      const r = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const chunks = [];
      const t0 = Date.now();
      r.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
      r.onstop = () => {
        const cur = recRef.current;
        if (cur) { clearInterval(cur.t); try { cur.stream.getTracks().forEach((t) => t.stop()); } catch {} }
        recRef.current = null;
        setRec(null);
        const type = r.mimeType || mime || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        if (Date.now() - t0 < 700 || !chunks.length) return;
        setFile(new File(chunks, `capsule.${ext}`, { type }));
        setKind('audio');
      };
      const tick = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); setRec({ s }); if (s >= 60) { try { r.stop(); } catch {} } }, 250);
      recRef.current = { rec: r, stream, t: tick };
      r.start();
      setRec({ s: 0 });
      hapticTap();
    } catch (e) { if (permDenied(e)) { setErr(''); openPermHelp('mic'); } else setErr('Your microphone could not start. Try again.'); }
  };
  const stopRec = () => { const r = recRef.current; if (r) { try { if (r.rec.state !== 'inactive') r.rec.stop(); } catch {} } };
  const removeFile = () => { hapticTap(); setFile(null); setKind(null); setPlaying(false); };
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true), () => {}); } else { a.pause(); setPlaying(false); }
  };
  const seal = () => {
    if (!canSeal) return;
    capsuleDraftMem.delete(draftKey);
    onSend({ body: text.trim().slice(0, 2000), file, kind, at });
  };
  const who = group ? `everyone in ${group.name}` : peer && peer.id === myId ? 'you' : (peer ? String(peer.name || '').split(' ')[0] : 'them');
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '6px 2px', cursor: 'pointer', boxSizing: 'border-box' };
  const tool = (icon, l, onClick) => (
    <div role="button" aria-label={l} onClick={onClick} className="zchat-press" style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: theme.rowBg, color: theme.ink, fontSize: 14, fontWeight: 650, cursor: 'pointer' }}>{icon}{l}</div>
  );
  return (
    <FullPage title="Time capsule" subtitle={`For ${who}`} onBack={onClose} zIndex={96}
      footer={<BigButton label={!hasBody ? 'Write something first' : !atOk ? 'Pick a time later than now' : `Seal it until ${new Date(at).toDateString() === new Date().toDateString() ? fmtHM(new Date(at)) : capsuleOpenText(at)}`} disabled={!canSeal} onClick={seal} />}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0 4px' }}>
        <CapsuleEnvelope dark={theme.dark} width={176} />
        <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 8, textAlign: 'center', lineHeight: 1.45, maxWidth: 300 }}>It stays sealed until {atOk ? `${capsuleOpenText(at)} at ${fmtHM(new Date(at))}` : 'the time you pick'}. Nobody can open it early, not even you.</div>
      </div>
      <IgHeading>Your message</IgHeading>
      <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} rows={5} aria-label="Your message" placeholder="A memory, a promise, a joke only they will get"
        style={{ ...inputStyle(theme), resize: 'none', lineHeight: 1.45, minHeight: 116, fontSize: 16 }} />
      {text.length > 1800 && <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', marginTop: 4 }}>{2000 - text.length} left</div>}
      <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickPhoto} />
      {!file && !rec && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          {tool(<ImageIcon size={18} />, 'Add a photo', () => { if (photoRef.current) photoRef.current.click(); })}
          {canRecord && tool(<Mic size={18} />, 'Voice note', startRec)}
        </div>
      )}
      {rec && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '8px 10px 8px 14px', borderRadius: 14, background: theme.rowBg }}>
          <span className="zcap-pulse" style={{ width: 9, height: 9, borderRadius: '50%', background: theme.danger, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 650, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>Recording {Math.floor(rec.s / 60)}:{String(rec.s % 60).padStart(2, '0')}</span>
          <div role="button" aria-label="Stop recording" onClick={stopRec} className="zchat-press" style={{ height: 34, padding: '0 14px', borderRadius: 17, background: theme.coral, color: '#FFFFFF', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>Done</div>
        </div>
      )}
      {file && fileUrl && kind === 'image' && (
        <div style={{ position: 'relative', marginTop: 10, borderRadius: 16, overflow: 'hidden', background: theme.rowBg }}>
          <img src={fileUrl} alt="Photo for the time capsule" style={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'cover' }} />
          <div role="button" aria-label="Remove photo" onClick={removeFile} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, background: 'rgba(0,0,0,0.55)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></div>
        </div>
      )}
      {file && fileUrl && kind === 'audio' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, padding: '8px 8px 8px 10px', borderRadius: 14, background: theme.rowBg }}>
          <audio ref={audioRef} src={fileUrl} onEnded={() => setPlaying(false)} preload="metadata" />
          <div role="button" aria-label={playing ? 'Pause voice note' : 'Play voice note'} onClick={togglePlay} className="zchat-press" style={{ width: 36, height: 36, borderRadius: 18, background: theme.coral, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{playing ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}</div>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: theme.ink }}>Voice note</span>
          <div role="button" aria-label="Remove voice note" onClick={removeFile} style={{ width: 34, height: 34, borderRadius: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer' }}><Trash2 size={17} /></div>
        </div>
      )}
      {err && <div style={{ fontSize: 13, color: theme.danger, marginTop: 8 }}>{err}</div>}
      <IgHeading>When it opens</IgHeading>
      <div role="radiogroup" aria-label="When it opens">
        {choices.map((c) => {
          const on = pick.k === c.k;
          return (
            <div key={c.k} role="radio" aria-checked={on} aria-label={c.label} onClick={() => { hapticTap(); setWhen(c.k); }} className="zchat-row-press" style={{ ...rowStyle, borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{c.label}</div>
                {c.k !== 'pick' && Number.isFinite(c.at) && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{reminderWhen(c.at)}</div>}
              </div>
              <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, boxSizing: 'border-box', border: on ? 'none' : `2px solid ${theme.border}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Check size={14} color="#FFFFFF" strokeWidth={3} />}</span>
            </div>
          );
        })}
      </div>
      {pick.k === 'pick' && (
        <div style={{ marginTop: 10 }}>
          <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Date and time" min={laterInputValue(Date.now() + 5 * 60000)} max={laterInputValue(Date.now() + 364 * 86400000)} style={{ ...inputStyle(theme), fontSize: 16 }} />
          {!atOk && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 6 }}>Pick a time from a few minutes from now up to a year away.</div>}
        </div>
      )}
      <div style={{ height: 8 }} />
    </FullPage>
  );
}

const COLLAGE_LAYOUTS = {
  2: [[[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]], [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]]],
  3: [[[0, 0, 0.5, 1], [0.5, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]], [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]], [[0, 0, 1 / 3, 1], [1 / 3, 0, 1 / 3, 1], [2 / 3, 0, 1 / 3, 1]]],
  4: [[[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]], [[0, 0, 1, 0.6], [0, 0.6, 1 / 3, 0.4], [1 / 3, 0.6, 1 / 3, 0.4], [2 / 3, 0.6, 1 / 3, 0.4]], [[0, 0, 0.6, 1], [0.6, 0, 0.4, 1 / 3], [0.6, 1 / 3, 0.4, 1 / 3], [0.6, 2 / 3, 0.4, 1 / 3]]],
  5: [[[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]], [[0, 0, 0.6, 0.6], [0.6, 0, 0.4, 0.3], [0.6, 0.3, 0.4, 0.3], [0, 0.6, 0.5, 0.4], [0.5, 0.6, 0.5, 0.4]]],
  6: [[[0, 0, 1 / 3, 0.5], [1 / 3, 0, 1 / 3, 0.5], [2 / 3, 0, 1 / 3, 0.5], [0, 0.5, 1 / 3, 0.5], [1 / 3, 0.5, 1 / 3, 0.5], [2 / 3, 0.5, 1 / 3, 0.5]], [[0, 0, 0.5, 1 / 3], [0.5, 0, 0.5, 1 / 3], [0, 1 / 3, 0.5, 1 / 3], [0.5, 1 / 3, 0.5, 1 / 3], [0, 2 / 3, 0.5, 1 / 3], [0.5, 2 / 3, 0.5, 1 / 3]]],
};

function drawCollage(ctx, W, H, imgs, layout, gap, round, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  layout.forEach(([x, y, w, h], i) => {
    const img = imgs[i % imgs.length];
    if (!img) return;
    const ax = gap / 2 + x * (W - gap);
    const ay = gap / 2 + y * (H - gap);
    const px = ax + gap / 2;
    const py = ay + gap / 2;
    const cw = Math.max(1, w * (W - gap) - gap);
    const ch = Math.max(1, h * (H - gap) - gap);
    ctx.save();
    ctx.beginPath();
    const r = Math.min(round, cw / 2, ch / 2);
    if (r > 0) {
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + cw, py, px + cw, py + ch, r);
      ctx.arcTo(px + cw, py + ch, px, py + ch, r);
      ctx.arcTo(px, py + ch, px, py, r);
      ctx.arcTo(px, py, px + cw, py, r);
      ctx.closePath();
    } else ctx.rect(px, py, cw, ch);
    ctx.clip();
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = Math.max(cw / iw, ch / ih);
    ctx.drawImage(img, px + (cw - iw * s) / 2, py + (ch - ih * s) / 2, iw * s, ih * s);
    ctx.restore();
  });
}

const COLLAGE_LAYOUT_NAMES = { 2: ['Side by side', 'Stacked'], 3: ['Big left', 'Big top', 'Columns'], 4: ['Grid', 'Big top', 'Big left'], 5: ['Mosaic', 'Big corner'], 6: ['Grid', 'Tall grid'] };
function CollageLayoutArt({ layout, imgs, tall, gap, round, dark, ink }) {
  const fw = tall ? 46 : 54;
  const fh = tall ? 57 : 54;
  const g = gap ? 2.5 : 0.8;
  return (
    <div style={{ position: 'relative', width: fw, height: fh, borderRadius: 7, overflow: 'hidden', background: dark ? '#111113' : '#FFFFFF', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.18)' }}>
      {layout.map(([x, y, w, h], i) => {
        const im = imgs[i % Math.max(1, imgs.length)];
        return (
          <div key={i} style={{ position: 'absolute', left: `calc(${x * 100}% + ${g}px)`, top: `calc(${y * 100}% + ${g}px)`, width: `calc(${w * 100}% - ${g * 2}px)`, height: `calc(${h * 100}% - ${g * 2}px)`, borderRadius: round ? 4 : 1, overflow: 'hidden', background: ink }}>
            {im && <img src={im.src} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          </div>
        );
      })}
    </div>
  );
}
function CollageStyleArt({ k, ink }) {
  const cell = { fill: ink, fillOpacity: 0.55 };
  if (k === 'gap') return <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="7" y="8" width="8" height="16" rx="1" {...cell} /><rect x="17" y="8" width="8" height="7" rx="1" {...cell} /><rect x="17" y="17" width="8" height="7" rx="1" {...cell} /></svg>;
  if (k === 'round') return <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="6.5" y="7.5" width="9" height="17" rx="3.4" {...cell} /><rect x="16.5" y="7.5" width="9" height="8" rx="3.4" {...cell} /><rect x="16.5" y="16.5" width="9" height="8" rx="3.4" {...cell} /></svg>;
  if (k === 'dark') return <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" rx="2.5" fill="#111113" stroke="currentColor" strokeWidth="1.6" /><rect x="7" y="8" width="8" height="16" rx="1" fill="#FFFFFF" fillOpacity="0.85" /><rect x="17" y="8" width="8" height="7" rx="1" fill="#FFFFFF" fillOpacity="0.85" /><rect x="17" y="17" width="8" height="7" rx="1" fill="#FFFFFF" fillOpacity="0.85" /></svg>;
  return <svg width="38" height="38" viewBox="0 0 32 32" aria-hidden="true"><rect x="7.5" y="3.5" width="17" height="25" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><rect x="10" y="6" width="5.5" height="20" rx="1" {...cell} /><rect x="17" y="6" width="5" height="9" rx="1" {...cell} /><rect x="17" y="17" width="5" height="9" rx="1" {...cell} /></svg>;
}
export function CollagePage({ files, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [imgs, setImgs] = useState([]);
  const [layoutIdx, setLayoutIdx] = useState(0);
  const [gapOn, setGapOn] = useState(true);
  const [roundOn, setRoundOn] = useState(false);
  const [dark, setDark] = useState(false);
  const [tall, setTall] = useState(false);
  const [busy, setBusy] = useState(false);
  const cvRef = useRef(null);
  useEffect(() => {
    let alive = true;
    const urls = files.map((f) => URL.createObjectURL(f));
    Promise.all(urls.map((u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = u; })))
      .then((list) => { if (alive) setImgs(list.filter(Boolean)); });
    return () => { alive = false; setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 1500); };
  }, []);
  const n = Math.max(2, Math.min(6, imgs.length || files.length));
  const layouts = COLLAGE_LAYOUTS[n] || COLLAGE_LAYOUTS[2];
  const layout = layouts[layoutIdx % layouts.length];
  const W = 1440;
  const H = tall ? 1800 : 1440;
  const gap = gapOn ? 24 : 0;
  const round = roundOn ? 36 : 0;
  const bg = dark ? '#111113' : '#FFFFFF';
  useEffect(() => {
    const c = cvRef.current;
    if (!c || !imgs.length) return;
    c.width = 720;
    c.height = tall ? 900 : 720;
    const ctx = c.getContext('2d');
    ctx.save();
    ctx.scale(0.5, 0.5);
    drawCollage(ctx, W, H, imgs, layout, gap, round, bg);
    ctx.restore();
  }, [imgs, layoutIdx, gapOn, roundOn, dark, tall]);
  const send = async () => {
    if (busy || !imgs.length) return;
    setBusy(true);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    drawCollage(c.getContext('2d'), W, H, imgs, layout, gap, round, bg);
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9));
    if (blob) await onSend(new File([blob], `collage-${Date.now()}.jpg`, { type: 'image/jpeg' }));
    setBusy(false);
  };
  const names = COLLAGE_LAYOUT_NAMES[n] || [];
  const styleOn = [gapOn && 'gap', roundOn && 'round', dark && 'dark', tall && 'tall'].filter(Boolean);
  const shuffle = () => { hapticTap(); setImgs((list) => (list.length > 1 ? [...list.slice(1), list[0]] : list)); };
  return (
    <FullPage title="Collage" subtitle={`${imgs.length || files.length} photos`} onBack={onClose} zIndex={90}
      footer={<BigButton label={busy ? 'Sending' : 'Send collage'} disabled={busy || imgs.length < 2} onClick={send} />}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
        {imgs.length ? <canvas ref={cvRef} aria-label="Collage preview" style={{ width: '100%', maxWidth: 380, height: 'auto', borderRadius: 14, boxShadow: `0 0 0 1px ${theme.border}` }} /> : <div style={{ padding: 60 }}><Spinner color={theme.muted} /></div>}
      </div>
      <KitSection title="Layout" right={(
        <div role="button" aria-label="Shuffle" onClick={shuffle} className="zchat-press" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0 2px 8px', color: kitOnInk(theme), fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          <StudioGlyph k="shuffle" size={19} />Shuffle
        </div>
      )}>
        <PickTiles label="Layout" size={66} bleed={16} ringBg={theme.bgGradient} value={layoutIdx % layouts.length} onChange={(i) => setLayoutIdx(i)}
          options={layouts.map((ly, i) => ({ k: i, label: names[i] || `Layout ${i + 1}`, aria: `Layout ${i + 1}`, art: <CollageLayoutArt layout={ly} imgs={imgs} tall={tall} gap={gapOn} round={roundOn} dark={dark} ink={theme.muted2} /> }))} />
      </KitSection>
      <KitSection title="Style" style={{ paddingBottom: 14 }}>
        <PickTiles label="Collage style" size={62} fit ringBg={theme.bgGradient} value={styleOn}
          onChange={(k) => { if (k === 'gap') setGapOn((v) => !v); else if (k === 'round') setRoundOn((v) => !v); else if (k === 'dark') setDark((v) => !v); else setTall((v) => !v); }}
          options={[['gap', 'Spacing', 'Spacing'], ['round', 'Rounded', 'Round corners'], ['dark', 'Dark back', 'Dark back'], ['tall', 'Tall', 'Tall']].map(([k, label, aria]) => ({ k, label, aria, art: <CollageStyleArt k={k} ink={theme.muted} /> }))} />
      </KitSection>
    </FullPage>
  );
}

export function TugBoard({ isHost, bus, onHostFinish, onProgress }) {
  const { theme } = useTheme();
  const secs = LIVE_GAME_INFO.tug.secs;
  const [mine, setMine] = useState(0);
  const [theirs, setTheirs] = useState(0);
  const [left, setLeft] = useState(secs);
  const [over, setOver] = useState(false);
  const mineRef = useRef(0);
  const theirsRef = useRef(0);
  const sentRef = useRef(0);
  const endAt = useRef(performance.now() + secs * 1000);
  const peerFinal = useRef(null);
  const finishedRef = useRef(false);
  useEffect(() => bus.listen((p) => {
    if (p.t === 'n' || p.t === 'fin') {
      theirsRef.current = Math.max(theirsRef.current, Number(p.c) || 0);
      setTheirs(theirsRef.current);
      if (p.t === 'fin') peerFinal.current = theirsRef.current;
    }
  }), [bus]);
  useEffect(() => { if (onProgress) onProgress(mine, theirs); }, [mine, theirs]);
  useEffect(() => {
    const iv = setInterval(() => {
      if (mineRef.current !== sentRef.current && !finishedRef.current) { sentRef.current = mineRef.current; bus.send({ t: 'n', c: mineRef.current }); }
      const rem = Math.max(0, endAt.current - performance.now());
      setLeft(rem / 1000);
      if (rem <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        setOver(true);
        bus.send({ t: 'fin', c: mineRef.current });
        if (isHost) {
          const started = Date.now();
          const wait = setInterval(() => {
            if (peerFinal.current != null || Date.now() - started > 1800) {
              clearInterval(wait);
              onHostFinish({ sx: mineRef.current, so: Math.max(theirsRef.current, peerFinal.current || 0) });
            }
          }, 100);
        }
      }
    }, 110);
    return () => clearInterval(iv);
  }, []);
  const tap = () => {
    if (finishedRef.current) return;
    mineRef.current += 1;
    setMine(mineRef.current);
    if (mineRef.current % 3 === 0) hapticTap();
  };
  const diff = mine - theirs;
  const pos = Math.max(-1, Math.min(1, diff / 30));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: left < 4 ? theme.danger : theme.ink, fontVariantNumeric: 'tabular-nums' }}>{over ? 'Time' : `${left.toFixed(1)}s`}</div>
      <div aria-label="Rope" role="img" style={{ position: 'relative', width: '100%', maxWidth: 420, height: 64, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '50%', top: 6, bottom: 6, width: 2, background: theme.border, transform: 'translateX(-1px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 28, height: 8, borderRadius: 4, background: 'repeating-linear-gradient(90deg, #D6A35C 0 10px, #B7813F 10px 20px)', transform: `translateX(${-pos * 18}%)`, transition: 'transform 0.12s linear' }} />
        <div style={{ position: 'absolute', top: 20, left: '50%', width: 22, height: 24, borderRadius: 6, background: '#EF4444', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', transform: `translateX(calc(-50% + ${-pos * 160}px))`, transition: 'transform 0.12s linear' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, fontSize: 12, fontWeight: 800, color: theme.coral }}>Your side</div>
        <div style={{ position: 'absolute', right: 0, top: 0, fontSize: 12, fontWeight: 800, color: theme.muted }}>Their side</div>
      </div>
      <div role="button" aria-label="Pull" data-silent="1" onPointerDown={(e) => { e.preventDefault(); tap(); }}
        style={{ width: 'min(70vw, 260px)', aspectRatio: '1', borderRadius: '50%', background: over ? theme.rowBg : 'radial-gradient(circle at 35% 30%, #FDBA74, #F97316 55%, #C2410C)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: over ? 'none' : '0 10px 0 #9A3412, 0 22px 34px rgba(249,115,22,0.4), inset 0 6px 0 rgba(255,255,255,0.3)', marginBottom: over ? 0 : 10, cursor: 'pointer', userSelect: 'none', touchAction: 'none', transform: `scale(${over ? 0.96 : 1})`, transition: 'transform 0.08s ease' }}>
        <div style={{ fontSize: 46, fontWeight: 900, lineHeight: 1, color: over ? theme.muted : 'white' }}>{mine}</div>
        <div style={{ fontSize: 17, fontWeight: 900, color: over ? theme.muted : 'white', marginTop: 4, textShadow: over ? 'none' : '0 2px 0 rgba(0,0,0,0.2)' }}>{over ? 'Done' : 'Pull'}</div>
      </div>
    </div>
  );
}

export function ReactionBoard({ isHost, bus, onHostFinish, onScore }) {
  const { theme } = useTheme();
  const need = 3;
  const maxRounds = LIVE_GAME_INFO.rrace.rounds;
  const [phase, setPhase] = useState('wait');
  const [round, setRound] = useState(0);
  const [note, setNote] = useState('');
  const goAt = useRef(0);
  const tapped = useRef(false);
  const myRole = isHost ? 'x' : 'o';
  const host = useRef({ r: -1, taps: {}, decided: false, timer: 0, goTimer: 0, score: { x: 0, o: 0 } });
  const startRound = (r) => {
    const h = host.current;
    h.r = r;
    h.taps = {};
    h.decided = false;
    bus.send({ t: 'ready', r });
    showReady(r);
    clearTimeout(h.goTimer);
    h.goTimer = setTimeout(() => { bus.send({ t: 'go', r }); showGo(r); clearTimeout(h.timer); h.timer = setTimeout(() => decide(r), 3200); }, 1200 + Math.random() * 2300);
  };
  const decide = (r) => {
    const h = host.current;
    if (h.r !== r || h.decided) return;
    h.decided = true;
    clearTimeout(h.timer);
    clearTimeout(h.goTimer);
    const foul = ['x', 'o'].find((k) => h.taps[k] && h.taps[k].foul);
    let win = null;
    if (foul) win = foul === 'x' ? 'o' : 'x';
    else {
      const ok = ['x', 'o'].filter((k) => h.taps[k] && !h.taps[k].foul).sort((a, b) => h.taps[a].ms - h.taps[b].ms);
      win = ok[0] || null;
    }
    if (win) h.score = { ...h.score, [win]: h.score[win] + 1 };
    const payload = { t: 'r', r, win, foul: foul || null, sx: h.score.x, so: h.score.o, mx: h.taps.x && h.taps.x.ms, mo: h.taps.o && h.taps.o.ms };
    bus.send(payload);
    applyResult(payload);
    setTimeout(() => {
      if (h.score.x >= need || h.score.o >= need || r + 1 >= maxRounds) onHostFinish({ sx: h.score.x, so: h.score.o });
      else startRound(r + 1);
    }, 1500);
  };
  const hostTap = (role, a) => {
    const h = host.current;
    if (a.r !== h.r || h.decided || h.taps[role]) return;
    h.taps[role] = a;
    if (a.foul) { decide(a.r); return; }
    if (h.taps.x && h.taps.o) { decide(a.r); return; }
    clearTimeout(h.timer);
    h.timer = setTimeout(() => decide(a.r), 300);
  };
  const showReady = (r) => { setRound(r); setPhase('wait'); setNote(''); tapped.current = false; };
  const showGo = () => { setPhase('go'); goAt.current = performance.now(); };
  const applyResult = (p) => {
    setPhase('done');
    if (onScore) onScore(p.sx, p.so);
    const mine = myRole === 'x' ? p.mx : p.mo;
    if (p.foul) setNote(p.foul === myRole ? 'Too early, point to them' : 'They tapped too early, point to you');
    else if (!p.win) setNote('Nobody tapped');
    else setNote(p.win === myRole ? `You were faster${mine ? `, ${mine} ms` : ''}` : 'They were faster');
    if (p.win === myRole) playUiSound('like');
  };
  useEffect(() => bus.listen((p) => {
    if (!isHost && p.t === 'ready') showReady(p.r);
    else if (!isHost && p.t === 'go') showGo(p.r);
    else if (!isHost && p.t === 'r') applyResult(p);
    else if (isHost && p.t === 'tap') hostTap('o', p);
  }), [bus]);
  useEffect(() => { if (isHost) { const t = setTimeout(() => startRound(0), 500); return () => clearTimeout(t); } return undefined; }, []);
  useEffect(() => () => { clearTimeout(host.current.timer); clearTimeout(host.current.goTimer); }, []);
  const tap = () => {
    if (tapped.current || phase === 'done') return;
    tapped.current = true;
    hapticTap();
    const a = phase === 'go' ? { t: 'tap', r: round, ms: Math.round(performance.now() - goAt.current) } : { t: 'tap', r: round, foul: true };
    if (phase !== 'go') setNote('Too early');
    if (isHost) hostTap('x', a); else bus.send(a);
  };
  const bg = phase === 'go' ? 'radial-gradient(circle at 35% 30%, #86EFAC, #22C55E 55%, #15803D)' : phase === 'done' ? theme.rowBg : 'radial-gradient(circle at 35% 30%, #FCA5A5, #DC2626 55%, #7F1D1D)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: theme.muted }}>Round {round + 1}, first to {need}</div>
      <div role="button" aria-label="Reaction pad" data-silent="1" onPointerDown={(e) => { e.preventDefault(); tap(); }}
        style={{ width: 'min(76vw, 280px)', aspectRatio: '1', borderRadius: 40, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, boxSizing: 'border-box', cursor: 'pointer', userSelect: 'none', touchAction: 'none', boxShadow: phase === 'done' ? 'none' : '0 14px 30px rgba(0,0,0,0.3)', transition: 'background 0.08s linear' }}>
        <div style={{ fontSize: phase === 'go' ? 44 : 22, fontWeight: 900, color: phase === 'done' ? theme.ink : 'white', lineHeight: 1.15 }}>{phase === 'go' ? 'TAP' : phase === 'done' ? (note || 'Next round') : (tapped.current ? 'Too early' : 'Wait for green')}</div>
      </div>
      <div style={{ minHeight: 20, fontSize: 13.5, fontWeight: 800, color: theme.muted }}>{phase !== 'done' ? note : ' '}</div>
    </div>
  );
}
const MEME_COLOURS = [['#FFFFFF', 'White'], ['#111114', 'Black'], ['#7C5CFC', 'Purple'], ['#FFD60A', 'Yellow'], ['#FF4D6D', 'Pink'], ['#14B8E6', 'Blue']];
export function MemeStartSheet({ onClose, onPick }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const inRef = useRef(null);
  const blank = async (c) => {
    hapticTap();
    try {
      const cv = document.createElement('canvas');
      cv.width = 1080;
      cv.height = 1080;
      const x = cv.getContext('2d');
      x.fillStyle = c;
      x.fillRect(0, 0, 1080, 1080);
      const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.92));
      if (b) onPick(new File([b], 'meme.jpg', { type: 'image/jpeg' }));
    } catch {}
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ textAlign: 'center', padding: '4px 20px 8px', touchAction: 'none' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>Make a meme</div>
            <div style={{ fontSize: 13, color: theme.muted, marginTop: 3 }}>Start with a photo or a plain colour</div>
          </div>
          <IgRow icon={<ImageIcon />} label="Choose a photo" onClick={() => inRef.current && inRef.current.click()} />
          <div role="radiogroup" aria-label="Plain colour" style={{ display: 'flex', gap: 10, padding: '10px 16px 6px', justifyContent: 'space-between' }}>
            {MEME_COLOURS.map(([c, l]) => (
              <div key={c} role="radio" aria-checked={false} aria-label={`${l} background`} onClick={() => blank(c)} className="zchat-press"
                style={{ flex: '1 1 0', maxWidth: 58, aspectRatio: '1 / 1', borderRadius: 14, background: c, cursor: 'pointer', boxShadow: `inset 0 0 0 1px ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: MEME_FONT, fontSize: 13, color: '#FFFFFF', WebkitTextStroke: '0.6px #000000', letterSpacing: '0.02em' }}>Aa</span>
              </div>
            ))}
          </div>
          <input ref={inRef} type="file" accept="image/*" style={{ display: 'none' }} data-testid="meme-photo-file" onChange={(e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (f) onPick(f); }} />
        </div>
      </div>
    </Portal>
  );
}

export function TwoFactorSection({ onChange }) {
  const { theme } = useTheme();
  const [phase, setPhase] = useState('loading');
  const [factor, setFactor] = useState(null);
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const mfa = supabase.auth && supabase.auth.mfa;

  const refresh = async () => {
    if (!mfa || !mfa.listFactors) { setErr('Two factor is not available right now.'); setPhase('off'); return; }
    try {
      const { data, error } = await mfa.listFactors();
      if (error) throw error;
      const verified = ((data && data.totp) || []).find((f) => f.status === 'verified') || null;
      setFactor(verified);
      setPhase(verified ? 'on' : 'off');
      if (onChange) onChange(!!verified);
    } catch (e) {
      setErr(friendlyError(e, "Couldn't check two factor. Try again."));
      setPhase('off');
    }
  };
  useEffect(() => { refresh(); }, []);

  const startSetup = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const { data: listed } = await mfa.listFactors();
      const stale = ((listed && listed.all) || []).filter((f) => f.factor_type === 'totp' && f.status !== 'verified');
      for (const f of stale) await mfa.unenroll({ factorId: f.id });
      const { data, error } = await mfa.enroll({ factorType: 'totp', friendlyName: `ZChat ${Math.random().toString(36).slice(2, 7)}`, issuer: 'ZChat' });
      if (error) throw error;
      setSetup({ id: data.id, qr: data.totp && data.totp.qr_code, secret: data.totp && data.totp.secret });
      setCode('');
      setPhase('setup');
    } catch (e) {
      setErr(friendlyError(e, "Couldn't start two factor setup. Try again."));
    }
    setBusy(false);
  };

  const confirmSetup = async () => {
    if (busy || code.length !== 6 || !setup) return;
    setBusy(true); setErr('');
    try {
      const { error } = await mfa.challengeAndVerify({ factorId: setup.id, code });
      if (error) throw error;
      setSetup(null); setCode('');
      await refresh();
    } catch (e) {
      setErr(/invalid|expired|incorrect/i.test(String((e && e.message) || e)) ? 'That code is not right. Try the newest code.' : friendlyError(e, "Couldn't check that code. Try again."));
      setCode('');
    }
    setBusy(false);
  };

  const cancelSetup = async () => {
    const pending = setup;
    setSetup(null); setCode(''); setErr(''); setPhase('off');
    if (pending) { try { await mfa.unenroll({ factorId: pending.id }); } catch {} }
  };

  const turnOff = async () => {
    if (busy || code.length !== 6 || !factor) return;
    setBusy(true); setErr('');
    try {
      const { error: verifyErr } = await mfa.challengeAndVerify({ factorId: factor.id, code });
      if (verifyErr) throw verifyErr;
      const { error } = await mfa.unenroll({ factorId: factor.id });
      if (error) throw error;
      setCode('');
      await refresh();
    } catch (e) {
      setErr(/invalid|expired|incorrect/i.test(String((e && e.message) || e)) ? 'That code is not right. Try the newest code.' : friendlyError(e, "Couldn't turn it off. Try again."));
      setCode('');
    }
    setBusy(false);
  };

  const copySecret = async () => {
    try { await navigator.clipboard.writeText(setup.secret); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };

  const codeInput = (
    <input value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6 digit code"
      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
      style={{ ...inputStyle(theme), textAlign: 'center', letterSpacing: 6, fontSize: 20, fontWeight: 800 }} />
  );

  if (phase === 'loading') return <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner size={20} color={theme.ink} /></div>;

  return (
    <div>
      {phase === 'off' && (
        <>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.55, marginBottom: 14 }}>
            Add a second lock to your account. After you turn this on, ZChat asks for a 6 digit code from an authenticator app each time you log in.
          </div>
          <button style={primaryBtn(theme, busy)} disabled={busy} onClick={startSetup}>{busy ? <Spinner /> : 'Turn on'}</button>
        </>
      )}
      {phase === 'setup' && setup && (
        <>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.55, marginBottom: 12 }}>
            Scan this code with Google Authenticator, Authy or 1Password, then enter the 6 digit code it shows.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            {setup.qr ? <img src={setup.qr} alt="Two factor setup code" style={{ width: 176, height: 176, background: 'white', borderRadius: 14, padding: 8 }} /> : null}
          </div>
          <div style={{ fontSize: 11.5, color: theme.muted, textAlign: 'center', marginBottom: 6 }}>Cannot scan? Enter this key instead</div>
          <div role="button" onClick={copySecret} style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: theme.ink, background: theme.rowBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '10px 8px', wordBreak: 'break-all', cursor: 'pointer', marginBottom: 14 }}>
            {copied ? 'Copied' : setup.secret}
          </div>
          {codeInput}
          {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
          <button style={{ ...primaryBtn(theme, busy || code.length !== 6), marginTop: 12 }} disabled={busy || code.length !== 6} onClick={confirmSetup}>{busy ? <Spinner /> : 'Verify and turn on'}</button>
          <div role="button" onClick={cancelSetup} style={{ textAlign: 'center', padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
        </>
      )}
      {phase === 'on' && (
        <>
          <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 2px 14px' }}>
            <ShieldCheck size={26} color={theme.teal} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <div style={{ fontWeight: 700, fontSize: 15.5, color: theme.ink }}>Two factor is on</div>
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.55, marginBottom: 14 }}>
            You need a code from your authenticator app to log in. To turn this off, enter a current code.
          </div>
          {codeInput}
          {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{err}</div>}
          <button style={{ ...primaryBtn(theme, busy || code.length !== 6), background: theme.danger, marginTop: 12 }} disabled={busy || code.length !== 6} onClick={turnOff}>{busy ? <Spinner /> : 'Turn off'}</button>
        </>
      )}
      {phase === 'off' && err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 10 }}>{err}</div>}
    </div>
  );
}

export function PaidJoinSheet({ group, count, code, uid, requested, onAsk, onCancelRequest, onJoined, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const w = useWallet(uid);
  const [req, setReq] = useState(requested ? 'pending' : null);
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(Number(group.entry_price) || 0);
  const accent = groupAccent(group);
  useEffect(() => {
    if (!group.join_approval) return undefined;
    let alive = true;
    supabase.from('group_join_requests').select('status').eq('group_id', group.id).eq('user_id', uid).maybeSingle().then(({ data }) => { if (alive && data) setReq(data.status); }, () => {});
    return () => { alive = false; };
  }, [group.id]);
  useEffect(() => { if (requested) setReq('pending'); }, [requested]);
  const bal = w && w.ready ? w.coins : 0;
  const needAsk = group.join_approval && req !== 'approved';
  const enough = bal >= price;
  const go = async () => {
    if (busy) return;
    if (needAsk) { if (req !== 'pending') { setBusy(true); await onAsk(); setBusy(false); setReq('pending'); } return; }
    if (!enough) { onClose(); crOpen('wallet'); return; }
    setBusy(true);
    const res = await crSpend(uid, price, `Join ${group.name} for ${coinsText(price)}`, () => crCall('zchat_cr_group_join', { p_code: code, p_expect: price }));
    setBusy(false);
    if (res.cancelled) return;
    if (res.error) {
      const row = res.row || {};
      if (row.approval) { setReq(null); appSnack('An admin needs to say yes first.'); return; }
      if (row.price && Number(row.price) !== price) { setPrice(Number(row.price)); appSnack(res.error); return; }
      appSnack(res.error);
      return;
    }
    playUiSound('like');
    onJoined(group);
  };
  const label = busy ? <Spinner size={16} /> : req === 'pending' && needAsk ? 'Request sent' : needAsk ? 'Ask to join' : enough ? `Join for ${coinsText(price)}` : `You need ${moreCoinsText(price - bal)}`;
  const sheet = (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '26px 20px', paddingBottom: 'calc(22px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', borderRadius: 32, boxShadow: `0 0 0 3px ${accent}, 0 12px 34px ${accent}55` }}><GroupAvatar avatar={group.avatar} name={group.name} size={92} /></div>
        <div style={{ fontWeight: 900, fontSize: 21, color: theme.ink, marginTop: 16, wordBreak: 'break-word' }}>Join {group.name}?</div>
        <div style={{ fontSize: 13, color: theme.muted, fontWeight: 700, marginTop: 4 }}>Group with {count} {count === 1 ? 'member' : 'members'}</div>
        {group.bio && <div data-zuser="" style={{ fontSize: 14, color: theme.ink, lineHeight: 1.5, marginTop: 12 }}>{group.bio}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', marginTop: 16, padding: '12px 14px', borderRadius: 16, background: detailsCardBg(theme), border: `1px solid ${theme.border}` }}>
          <CoinIcon size={28} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink }}>{`Entry is ${coinsText(price)}, paid once`}</div>
            <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>{needAsk ? 'An admin says yes first, then you pay to join.' : 'If the owner removes you within a day, your coins come back.'}</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 10 }}><CrCoinsLine uid={uid} /></div>
        <button disabled={busy || (needAsk && req === 'pending')} onClick={go} style={{ width: '100%', marginTop: 16, padding: '14px 16px', borderRadius: 14, border: 'none', background: needAsk && req === 'pending' ? theme.rowBg : accent, color: needAsk && req === 'pending' ? theme.muted : 'white', fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: needAsk && req === 'pending' ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 48 }}>{label}</button>
        {needAsk && req === 'pending' ? (
          <div role="button" onClick={onCancelRequest} style={{ padding: '14px 0 2px', fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>Cancel request</div>
        ) : (
          <div role="button" onClick={onClose} style={{ padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Not now</div>
        )}
      </div>
    </div>
  );
  return ReactDOM.createPortal(sheet, document.body);
}
