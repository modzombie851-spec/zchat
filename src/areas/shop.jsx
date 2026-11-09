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
  AppPinPad,
  Avatar,
  BIRTHDAY_PINK,
  BigButton,
  BioKey,
  CHAR_BUBBLES,
  CHAR_BUBBLE_KEYS,
  CL,
  CUSTOM_BADGES,
  CX_KINDS,
  CharmPreview,
  ChipStartSheet,
  CoinIcon,
  CoinPouchArt,
  CollPrice,
  CollSection,
  CollectionIcon,
  ConfirmDialog,
  ConfirmSheet,
  CrGlyph,
  CxGiftPicker,
  CxTile,
  DAILY_COINS,
  DECOR_ALL,
  DECOR_BY_KEY,
  DECOR_SETS,
  DECOR_SI,
  DECOR_SPRITE,
  DecorFrameBadge,
  DecorHero,
  DecorStill,
  DropArt,
  DropPage,
  EDITION_FIRST,
  EditionTag,
  EmptyState,
  FONT,
  FullPage,
  GIFT_MAX,
  GiftIcon,
  IgHeading,
  IgRow,
  IgToggle,
  LIVE_WALL_BY,
  LineGlyph,
  LiveWallCanvas,
  LoadFail,
  MonthlyLimitPage,
  NAME_STYLES,
  NS_KEYS,
  NS_OWN_ITEM,
  NS_OWN_SAMPLE,
  NS_ROOM,
  NameBadge,
  NameStyleArt,
  OwnStylePage,
  PROFILE_THEMES,
  PickPeoplePage,
  PieceGlyph,
  PillButton,
  Portal,
  ProfileDecorHero,
  ProfileEffectLayer,
  RARITY_STYLE,
  RarityGem,
  RarityTag,
  RedeemCodeSheet,
  SI_KINDS,
  SI_SOUND_PACKS,
  SI_STICKER_PACKS,
  SI_TYPING,
  STORE_RARITY_ORDER,
  SUPER_FREE_WORD,
  SUPER_KEYS,
  SUPER_REACTS,
  SecGlyph,
  SegmentedControl,
  ShopItemArt,
  SiItemArt,
  SiItemPage,
  Spinner,
  SpotArt,
  StyledName,
  SuperFace,
  THEMES,
  THEME_KEYS,
  ThemeArt,
  ThemeCanvas,
  ThemePreviewPage,
  TradeArt,
  TradeIcon,
  TypingStyleBubble,
  VERIFIED_TIERS,
  VerifiedBadge,
  WideDim,
  WrapPickerSheet,
  addSpendSent,
  adminWords,
  announceWallet,
  appSnack,
  bdayGiftWhat,
  bioCheck,
  bioCredId,
  bubbleKeyOf,
  claimDailyCoins,
  coinsText,
  copyTextToClipboard,
  countWord,
  crFirst,
  crOpen,
  cxFlag,
  cxHas,
  cxKnown,
  cxNs,
  cxOwns,
  cxSpec,
  cxWord,
  dailyNext,
  daysLeft,
  decorBudgetQueue,
  decorFamily,
  decorOwned,
  decorPartPrice,
  detailsCardBg,
  dropOwned,
  dropPhase,
  editionOf,
  fmtDate,
  formatCount,
  friendlyError,
  giftRpc,
  giftTheirsMem,
  giftTheirsPend,
  hapticTap,
  igPalette,
  inputStyle,
  isDecorKey,
  kitOnInk,
  laterInputValue,
  ledgerMem,
  limitLeft,
  listText,
  liveAddGift,
  liveBurst,
  liveCid,
  liveEmit,
  liveFirst,
  livePlanById,
  livePlanEach,
  livePlanMerge,
  livePlanSort,
  livePlanWhy,
  livePlans,
  livePlansEmit,
  liveRpc,
  liveRt,
  liveWallBg,
  liveWallPaid,
  liveWallVeil,
  liveWhenLow,
  loadPayOptions,
  mixHex,
  moneyRun,
  moreCoinsText,
  nsOwn,
  nsOwnSaved,
  payMem,
  pickCoverFile,
  playUiSound,
  readJsonLs,
  readRingtone,
  readTone,
  reducedMotion,
  reminderWhen,
  rewardActive,
  rpcFailText,
  rpcMissing,
  santaPut,
  saveDecorSets,
  sendPushNotification,
  shopItemName,
  shopPing,
  shopPrice,
  shortLeft,
  siCss,
  siOwns,
  siSpec,
  siTitle,
  siteOrigin,
  spPlay,
  spendAuthBus,
  spendGate,
  superAccent,
  themeFallback,
  tradeItemName,
  tradeLive,
  tradeMem,
  tradeNorm,
  tradePut,
  tradeSides,
  tradeStatusOf,
  typingStyleMine,
  useBackClose,
  useBioReady,
  useBirthdayOf,
  useCr,
  useDecorLoaded,
  useEdgeSwipeBack,
  useGfPeople,
  useSecondTick,
  useSheetDrag,
  useShopTick,
  useTheme,
  useWallet,
  useWidthOf,
  useWishlist,
  verifyPin,
  walletAfter,
  walletMem,
  walletPatch,
  walletSpend,
  writeJsonLs,
} from '../App.jsx';
import {
  BubbleTileDark,
  CharBubbleSample,
  DECOR_PIECES,
  DecorConfetti,
  EditionLine,
  GIFT_PAPER_EXTRA,
  GiftBoxIcon,
  GiftCodeIcon,
  KitSection,
  KitSlider,
  LIVE_WALL_PAID,
  SegTabs,
  SetCard,
  ShopChatMock,
  ShopDayNight,
  ShopPagePill,
  ShopProfileMock,
  ThemeMockProfile,
  WishHeart,
  WrapBoxArt,
  buyDeal,
  buyShopItem,
  coinTakenBack,
  dropsMem,
  giftPaper,
  giftRibbon,
  giftWrapText,
  hexLum,
  loadMilestones,
  reasonLine,
  setTypingStyleMine,
  shopKindWord,
  shopKnown,
  shopMem,
  shopOwnersMem,
  shopSave,
  shopWarm,
  siAccent,
  siRoute,
  siWord,
  useDeal,
  useDrops,
  useMoneyToast,
  useOwnedBubbles,
  useShopOwners,
  useSpendLimit,
} from './shared.jsx';

function usePayOptions() {
  const [data, setData] = useState(payMem.data);
  useEffect(() => { let alive = true; loadPayOptions().then((d) => { if (alive) setData(d); }); return () => { alive = false; }; }, []);
  return data;
}
function checkoutLink(url, uid) {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !/(^|\.)lemonsqueezy\.com$/i.test(u.hostname) || !uid) return null;
    u.searchParams.set('checkout[custom][user_id]', uid);
    return u.toString();
  } catch { return null; }
}
function openCheckout(url, uid) {
  const link = checkoutLink(url, uid);
  if (!link) return false;
  try { const win = window.open(link, '_blank', 'noopener,noreferrer'); if (!win) window.location.href = link; } catch { window.location.href = link; }
  return true;
}
function CoinPile({ n = 1, size = 34 }) {
  const count = Math.max(1, Math.min(4, n));
  const step = size * 0.32;
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: size + step * (count - 1), height: size, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => <CoinIcon key={i} size={size} style={{ position: 'absolute', left: i * step, top: i % 2 ? size * 0.08 : 0 }} />)}
    </div>
  );
}
function VerifiedPlanCard({ me, plan, onBuy }) {
  const { theme } = useTheme();
  const until = me && me.verified_until ? new Date(me.verified_until) : null;
  const active = !!(until && until.getTime() > Date.now());
  const teamBadge = !!(me && me.verified && !active);
  return (
    <div style={{ padding: '2px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}><VerifiedBadge tier="blue" size={28} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>ZChat Verified</div>
          <div style={{ fontSize: 13, color: theme.muted, marginTop: 1 }}>{active ? `Your badge is on until ${fmtDate(until, { day: 'numeric', month: 'long' })}` : teamBadge ? 'You already have a badge from the ZChat team' : plan && plan.price ? `${plan.price} a month, stop any time` : 'A monthly plan, stop any time'}</div>
        </div>
      </div>
      {!active && !teamBadge && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0 14px' }}>
            {['A blue badge next to your name everywhere', 'People know it is really you', 'Supports ZChat so it stays free'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: theme.ink2 }}><span style={{ width: 40, display: 'flex', justifyContent: 'center', flexShrink: 0 }}><Check size={16} color="#3B82F6" strokeWidth={2.6} /></span>{t}</div>
            ))}
          </div>
          <BigButton label="Get verified" onClick={onBuy} disabled={!plan} />
        </>
      )}
      {active && <a href="https://app.lemonsqueezy.com/my-orders" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 10, marginLeft: 52, fontSize: 13.5, fontWeight: 700, color: theme.coral, textDecoration: 'none' }}>Manage your plan</a>}
    </div>
  );
}
function DailyStreak({ day, claimed }) {
  const { theme } = useTheme();
  const n = DAILY_COINS.length;
  const last = claimed ? day : day - 1;
  const fill = n > 1 && last > 1 ? Math.min(1, (last - 1) / (n - 1)) : 0;
  const page = igPalette(theme).bg;
  return (
    <div role="list" aria-label="Daily reward days" style={{ position: 'relative', display: 'flex', paddingTop: 2 }}>
      <div aria-hidden="true" style={{ position: 'absolute', left: `${50 / n}%`, right: `${50 / n}%`, top: 38.5, height: 3, borderRadius: 2, background: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(17,17,19,0.08)' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 2, background: theme.coral, transition: reducedMotion() ? 'none' : 'width 300ms ease-out' }} />
      </div>
      {DAILY_COINS.map((amt, i) => {
        const d = i + 1;
        const today = d === day;
        const got = claimed ? d <= day : d < day;
        return (
          <div key={d} role="listitem" aria-label={`Day ${d}, ${amt} coins${got ? ', claimed' : ''}`} style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: 16, fontSize: 11, lineHeight: '16px', fontWeight: today ? 800 : 600, color: today ? theme.ink : theme.muted, whiteSpace: 'nowrap' }}>Day {d}</div>
            <div style={{ marginTop: 6, width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: got ? theme.coral : page, boxShadow: today && !claimed ? `0 0 0 2px ${page}, 0 0 0 4px ${theme.coral}` : 'none' }}>
              {got ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <CoinIcon size={today ? 30 : 25} />}
            </div>
            <div style={{ marginTop: 7, fontSize: 12.5, fontWeight: 700, color: got ? theme.muted : theme.ink, fontVariantNumeric: 'tabular-nums' }}>{amt}</div>
          </div>
        );
      })}
    </div>
  );
}
function ledgerWarm(uid) {
  if (!uid || ledgerMem.uid === uid) return;
  try {
    const o = JSON.parse(localStorage.getItem(`zchat-ledger-${uid}`) || 'null');
    if (Array.isArray(o)) { ledgerMem.uid = uid; ledgerMem.rows = o.filter((r) => r && r.id != null && Number.isFinite(Number(r.delta))); }
  } catch {}
}
export function WalletPage({ uid, me, onClose, onOpenCollection, onOpenGift }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const w = useWallet(uid);
  const lim = useSpendLimit(uid);
  const [limitOpen, setLimitOpen] = useState(false);
  const bdays = useBdayGifts(uid);
  const bdayPeople = useGfPeople(bdays.map((g) => g.to));
  const pay = usePayOptions();
  const [waitPay, setWaitPay] = useState(0);
  useEffect(() => {
    const back = () => {
      if (document.visibilityState !== 'visible') return;
      walletMem.data = null;
      announceWallet();
    };
    document.addEventListener('visibilitychange', back);
    return () => document.removeEventListener('visibilitychange', back);
  }, []);
  useEffect(() => {
    if (!waitPay) return undefined;
    let n = 0;
    const iv = setInterval(() => { n += 1; walletMem.data = null; announceWallet(); if (n >= 12) { clearInterval(iv); setWaitPay(0); } }, 5000);
    return () => clearInterval(iv);
  }, [waitPay]);
  const buyPack = (pk) => {
    hapticTap();
    if (!openCheckout(pk.url, uid)) return;
    setWaitPay(Date.now());
  };
  const [ledger, setLedger] = useState(() => { ledgerWarm(uid); return ledgerMem.uid === uid ? ledgerMem.rows : null; });
  const pendRows = useRef([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [code, setCode] = useState('');
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const loadLedger = async () => {
    const t0 = Date.now();
    const { data, error } = await supabase.from('coin_ledger').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(60);
    if (error) { setLedger((cur) => cur || []); return; }
    const rows = data || [];
    ledgerMem.uid = uid;
    ledgerMem.rows = rows;
    try { localStorage.setItem(`zchat-ledger-${uid}`, JSON.stringify(rows.slice(0, 30).map((r) => ({ id: r.id, delta: r.delta, reason: r.reason, note: r.note || null, created_at: r.created_at })))); } catch {}
    pendRows.current = pendRows.current.filter((p) => !(p.done && p.done <= t0) && !rows.some((r) => r.reason === p.row.reason && Number(r.delta) === Number(p.row.delta) && (r.note || null) === p.row.note && Date.parse(r.created_at) > Date.parse(p.row.created_at) - 120000));
    setLedger([...pendRows.current.map((p) => p.row), ...rows]);
  };
  useEffect(() => {
    loadLedger();
    const on = () => loadLedger();
    window.addEventListener('zchat-wallet', on);
    return () => window.removeEventListener('zchat-wallet', on);
  }, [uid]);
  const noteTimer = useRef(0);
  const flash = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2600); };
  const claim = async () => {
    if (busy) return;
    const next = dailyNext(uid);
    const p = next ? { row: { id: `local-daily-${Date.now()}`, user_id: uid, delta: next.added, reason: 'daily', note: `Day ${next.day}`, created_at: new Date().toISOString() }, done: 0 } : null;
    if (p) {
      hapticTap();
      playUiSound('like');
      flash(`${next.added} coins added`);
      pendRows.current = [p, ...pendRows.current];
      setLedger((cur) => [p.row, ...(cur || [])]);
    }
    setBusy(true);
    const r = await claimDailyCoins(uid);
    setBusy(false);
    if (r.error) {
      if (p) { pendRows.current = pendRows.current.filter((x) => x !== p); setLedger((cur) => (cur || []).filter((x) => x !== p.row)); }
      flash(r.error);
      return;
    }
    if (p) p.done = Date.now();
    else { hapticTap(); playUiSound('like'); flash(`${r.added} coins added`); }
    loadLedger();
  };
  const link = `${siteOrigin()}/?ref=${encodeURIComponent((me && me.username) || '')}`;
  const shareInvite = async () => {
    try { if (navigator.share) { await navigator.share({ title: 'ZChat', text: 'Join me on ZChat. We both get coins when you sign up with my link.', url: link }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const ok = await copyTextToClipboard(link);
    flash(ok ? 'Invite link copied' : link);
  };
  const redeem = async () => {
    const c = code.trim().replace(/^@/, '').toLowerCase();
    if (!c || redeemBusy) return;
    setRedeemBusy(true);
    const { data, error } = await supabase.rpc('zchat_claim_invite', { p_ref: c });
    setRedeemBusy(false);
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || !row.ok) { flash((row && row.reason) || 'That invite could not be used.'); return; }
    setCode('');
    walletMem.data = null;
    announceWallet();
    flash(`You got ${row.added} coins`);
  };
  const reasonLabel = (r) => ({ daily: 'Daily reward', invite: 'Friend joined with your link', invited: 'Joined with an invite', gift_in: 'Gift received', gift_out: 'Gift sent', shop: 'Spent in the Shop', gift_item: 'Gift sent', admin: 'From the ZChat team', achievement: 'Achievement reward', purchase: 'Coins bought', refund: 'Purchase refunded', drop: 'Drop', deal: 'Deal of the day', milestone: 'Collection reward', trade: 'Trade', code: 'Gift code', tip_in: 'Tip on your post', tip_out: 'Tip you sent', live_in: 'Live gifts', live_out: 'Live gift sent', bag_out: 'Coin gift bag', bag_in: 'From a gift bag', bag_back: 'Gift bag coins back', bday_hold: 'Birthday gift, held', bday_back: 'Birthday gift coins back', chip_out: 'Group gift', chip_back: 'Group gift coins back', santa_out: 'Secret Santa gift', santa_back: 'Secret Santa coins back' }[r] || 'Coins');
  const day = w ? w.day : 1;
  const claimed = w && w.ready && !w.canClaim;
  return (
    <FullPage title="Coins" onBack={onClose} zIndex={760}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0 18px' }}>
        <CoinIcon size={56} />
        <div style={{ fontSize: 40, fontWeight: 800, color: theme.ink, marginTop: 8, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{w ? formatCount(w.coins) : '0'}</div>
        <div style={{ fontSize: 13.5, color: theme.muted }}>coins</div>
      </div>
      {w && !w.ready && <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', padding: '0 12px 12px', lineHeight: 1.5 }}>Coins switch on once the latest ZChat setup is finished.</div>}
      {pay && pay.packs.length > 0 && (
        <KitSection title="Get coins" style={{ marginTop: 4 }}>
          <div role="list" aria-label="Coin packs">
            {pay.packs.map((pk, i) => (
              <div key={pk.id} role="button" aria-label={`Buy ${pk.coins} coins${pk.price ? ` for ${pk.price}` : ''}`} onClick={() => buyPack(pk)} className="zchat-row-press"
                style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 62, padding: '6px 0', cursor: 'pointer' }}>
                <div style={{ width: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CoinPile n={i + 1} size={26} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{formatCount(pk.coins)} coins</div>
                  {pk.tag && <div style={{ fontSize: 12.5, fontWeight: 700, color: kitOnInk(theme), marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pk.tag}</div>}
                </div>
                <div style={{ minWidth: 76, height: 32, padding: '0 14px', boxSizing: 'border-box', borderRadius: 16, background: `${theme.coral}${theme.dark ? '33' : '1A'}`, color: kitOnInk(theme), fontSize: 14.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{pk.price || 'Buy'}</div>
                {i < pay.packs.length - 1 && <div aria-hidden="true" style={{ position: 'absolute', left: 64, right: 0, bottom: 0, height: 1, background: theme.hair }} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.5, padding: '8px 0 0' }}>{waitPay ? 'When your payment goes through, your coins show up here by themselves.' : 'Payments are handled safely by Lemon Squeezy. Coins arrive a few seconds after you pay.'}</div>
        </KitSection>
      )}
      <KitSection title="Daily reward" right={w && w.streak > 1 ? `${w.streak} days in a row` : 'Open ZChat every day'} style={{ marginTop: pay && pay.packs.length > 0 ? 26 : 4 }}>
        <DailyStreak day={day} claimed={!!claimed} />
        <div style={{ marginTop: 16 }}>
          <BigButton label={claimed ? 'Come back tomorrow' : busy ? 'Claiming' : `Claim ${DAILY_COINS[day - 1] || 5} coins`} disabled={busy || !w || !w.ready || claimed} onClick={claim} />
        </div>
      </KitSection>
      <KitSection title="Invite friends" style={{ marginTop: 26 }}>
        <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5 }}>When a friend joins ZChat with your link, you get <b style={{ color: theme.ink }}>50 coins</b> and they get <b style={{ color: theme.ink }}>25</b>.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, height: 46, padding: '0 4px 0 14px', boxSizing: 'border-box', borderRadius: 12, background: theme.inputBg }}>
          <LinkIcon size={16} color={theme.muted} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: theme.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{link.replace(/^https?:\/\//, '')}</div>
          <div role="button" aria-label="Copy invite link" onClick={async () => { const ok = await copyTextToClipboard(link); flash(ok ? 'Invite link copied' : link); }} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: theme.ink2, flexShrink: 0 }}><Copy size={18} /></div>
        </div>
        <div style={{ marginTop: 10 }}><BigButton label="Share invite" onClick={shareInvite} /></div>
        {w && w.invites > 0 && <div style={{ fontSize: 13, color: theme.muted, marginTop: 10 }}>{w.invites === 1 ? '1 friend joined with your link' : `${w.invites} friends joined with your link`}</div>}
      </KitSection>
      {w && w.canRedeem && (
        <KitSection title="Did a friend invite you?" style={{ marginTop: 26 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={code} onChange={(e) => setCode(e.target.value.slice(0, 32))} placeholder="Their username" aria-label="Friend's username" autoCapitalize="none" style={{ ...inputStyle(theme), flex: 1, fontSize: 15.5 }} />
            <div role="button" aria-label="Use invite" onClick={redeem} style={{ height: 46, padding: '0 16px', borderRadius: 12, background: code.trim() ? theme.coral : theme.soft, color: code.trim() ? '#FFFFFF' : theme.muted, display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>{redeemBusy ? <Spinner size={15} /> : 'Use'}</div>
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0' }}>Works in your first 14 days on ZChat.</div>
        </KitSection>
      )}
      {pay && pay.verified && (
        <KitSection title="Verified" style={{ marginTop: 26 }}>
          <VerifiedPlanCard me={me} plan={pay.verified} onBuy={() => { hapticTap(); if (openCheckout(pay.verified.url, uid)) setWaitPay(Date.now()); }} />
        </KitSection>
      )}
      <KitSection title="Gift code" style={{ marginTop: 26 }}>
        <IgRow inset={false} icon={<GiftCodeIcon />} label="Redeem a code" sub="Got a code from the ZChat team? Use it here" onClick={() => { hapticTap(); setCodeOpen(true); }} />
      </KitSection>
      <KitSection title="Spending" style={{ marginTop: 26 }}>
        <IgRow inset={false} icon={<SecGlyph k="spend" />} label="Monthly limit" sub={lim && lim.limit != null ? `${formatCount(limitLeft(lim))} of ${formatCount(lim.limit)} coins left this month` : 'Choose how many coins you spend each month'} onClick={() => { hapticTap(); setLimitOpen(true); }} />
      </KitSection>
      {bdays.length > 0 && (
        <KitSection title="Birthday gifts" style={{ marginTop: 26 }}>
          {bdays.map((g, i) => {
            const p = bdayPeople[i];
            const nm = p ? String(p.name || p.username || '').split(' ')[0] : 'A friend';
            return (
              <div key={g.id} role="button" aria-label={`Birthday gift for ${nm}`} onClick={() => { if (p && onOpenGift) { hapticTap(); onOpenGift(p); } }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '6px 0', cursor: p && onOpenGift ? 'pointer' : 'default' }}>
                <Avatar emoji={p && p.avatar} name={p ? p.name : nm} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>{`${nm}, ${bdayDayText(g.md) || 'their birthday'}`}</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${bdayGiftWhat(g).replace(/^./, (c) => c.toUpperCase())}${g.held ? `, ${formatCount(g.held)} coins held` : ', paid on the day'}`}</div>
                </div>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            );
          })}
        </KitSection>
      )}
      <KitSection title="Spend coins" style={{ marginTop: 26 }}>
        <IgRow inset={false} icon={<CollectionIcon />} label="Frames, nameplates and charms" sub="Get them in your Collection, yours to keep" onClick={onOpenCollection} />
        <IgRow inset={false} icon={<GiftIcon />} label="Send a gift" sub="Open someone's profile and tap the gift button" />
      </KitSection>
      <KitSection title="History" style={{ marginTop: 26 }} />
      {ledger === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner color={theme.muted} /></div> : !ledger.length ? (
        <div style={{ fontSize: 13.5, color: theme.muted, padding: '4px 4px 10px' }}>Coins you get and spend show up here.</div>
      ) : ledger.map((r) => (
        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 2px', boxShadow: `0 0.5px 0 ${theme.hair}` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{coinTakenBack(r) ? 'Taken back by the ZChat team' : r.note || reasonLabel(r.reason)}</div>
            <div style={{ fontSize: 12, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtDate(new Date(r.created_at), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{coinTakenBack(r) && r.note ? `, ${r.note}` : ''}</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: Number(r.delta) > 0 ? '#16A34A' : theme.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{Number(r.delta) > 0 ? `+${Number(r.delta).toLocaleString('en-US')}` : `\u2212${Math.abs(Number(r.delta)).toLocaleString('en-US')}`}</div>
        </div>
      ))}
      {note && <div className="zchat-pop" role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(30px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: 900, padding: '9px 16px', borderRadius: 18, background: theme.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, width: 'max-content', maxWidth: 'calc(100vw - 48px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none' }}>{note}</div>}
      {codeOpen && <RedeemCodeSheet uid={uid} me={me} onClose={() => setCodeOpen(false)} onOpenCollection={onOpenCollection ? () => { setCodeOpen(false); onOpenCollection(); } : null} />}
      {limitOpen && <MonthlyLimitPage uid={uid} onClose={() => setLimitOpen(false)} />}
    </FullPage>
  );
}
function readGiftWrap() {
  const o = readJsonLs('zchat-gift-wrap', null);
  const p = o && giftPaper(o.p);
  return p && !GIFT_PAPER_EXTRA[o.p] ? { p: o.p, r: giftRibbon(o.r)[0] } : { p: 'confetti', r: 'gold' };
}
function giftPreviewable(kind) { return ['set', 'frame', 'nameplate', 'effect', 'namestyle', 'theme', 'charm'].includes(kind); }
function GiftOnThemPage({ to, kind, k, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [mode, setMode] = useState('with');
  const [fx, setFx] = useState(1);
  const on = mode === 'with';
  const first = String(to.name || '').split(' ')[0] || 'them';
  const curF = isDecorKey(to.avatar_frame) ? to.avatar_frame : null;
  const curP = isDecorKey(to.nameplate) ? to.nameplate : null;
  const frameKey = on && (kind === 'set' || kind === 'frame') ? k : curF;
  const plateKey = on && (kind === 'set' || kind === 'nameplate') ? k : curP;
  const fxKey = on && (kind === 'set' || kind === 'effect') ? k : null;
  const view = { ...to, name_style: on && kind === 'namestyle' ? k : to.name_style, custom_badge: on && kind === 'charm' ? k : to.custom_badge };
  useEffect(() => { if (fxKey) setFx((n) => n + 1); }, [mode]);
  const name = DECOR_BY_KEY[k] && ['set', 'frame', 'nameplate', 'effect'].includes(kind) ? `${DECOR_BY_KEY[k].name} ${kind === 'set' ? 'set' : kind}` : shopItemName(kind, k);
  return (
    <FullPage title={`${first} with your gift`} onBack={onClose} zIndex={792} pad={false}
      footer={<><SegmentedControl value={mode} onChange={(v) => { hapticTap(); setMode(v); }} options={[['now', 'Today'], ['with', 'With your gift']]} /><div style={{ marginTop: 12 }}><BigButton label="Back to the gift" onClick={onClose} /></div></>}>
      {fxKey && <ProfileEffectLayer effectKey={fxKey} runKey={fx} force z={30} />}
      <div style={{ padding: '12px 0 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 360 }}>
        {kind === 'theme' && (on || (to.profile_theme && PROFILE_THEMES[to.profile_theme])) ? (
          <div key={mode} className="zchat-fade" style={{ padding: '8px 20px' }}><ThemeArt k={on ? k : to.profile_theme} me={to} w={236} h={300} dark={theme.dark} radius={22} /></div>
        ) : frameKey || plateKey ? (
          <div key={`${frameKey}${plateKey}`} className="zchat-fade" style={{ width: '100%' }}><ProfileDecorHero profile={view} photo={to.avatar} frameKey={frameKey} plateKey={plateKey} /></div>
        ) : (
          <div key={mode} className="zchat-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 20px 6px' }}>
            <Avatar emoji={to.avatar} name={to.name} size={96} />
            <div style={{ fontSize: 22, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', marginTop: 12, maxWidth: '100%' }}><NameBadge name={to.name} verified={to.verified} custom={view.custom_badge} size={19} ns={cxNs(view)} /></div>
            <div style={{ fontSize: 14, color: theme.muted, marginTop: 2 }}>@{to.username}</div>
          </div>
        )}
        <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 14, textAlign: 'center', padding: '0 24px', lineHeight: 1.5 }}>{on ? `This is how ${first}'s profile looks with the ${name}.` : `This is ${first}'s profile today.`}</div>
      </div>
    </FullPage>
  );
}
const bdayGiftMem = { uid: null, list: null, job: null, subs: new Set() };
function bdayGiftPing() { bdayGiftMem.subs.forEach((fn) => { try { fn(); } catch {} }); }
function loadBdayGifts(uid, force) {
  if (!uid) return Promise.resolve([]);
  if (bdayGiftMem.uid !== uid) Object.assign(bdayGiftMem, { uid, list: readJsonLs(`zchat-bday-gifts-${uid}`, null), job: null });
  if (!force && bdayGiftMem.list && bdayGiftMem.at && Date.now() - bdayGiftMem.at < 60000) return Promise.resolve(bdayGiftMem.list);
  if (bdayGiftMem.job) return bdayGiftMem.job;
  bdayGiftMem.job = supabase.from('birthday_gifts').select('id, to_id, kind, item_key, coins, price, held, pay, note, wrap, md, deliver_at, status').eq('from_id', uid).eq('status', 'waiting').order('deliver_at', { ascending: true }).limit(40).then(({ data, error }) => {
    bdayGiftMem.job = null;
    if (error) { if (!bdayGiftMem.list) bdayGiftMem.list = []; return bdayGiftMem.list; }
    bdayGiftKeep(uid, (data || []).map((g) => ({ id: g.id, to: g.to_id, kind: g.kind, key: g.item_key, coins: g.coins, price: g.price, held: g.held, pay: g.pay, note: g.note, wrap: g.wrap, md: g.md, deliver_at: g.deliver_at, status: g.status })));
    bdayGiftMem.at = Date.now();
    return bdayGiftMem.list;
  }, () => { bdayGiftMem.job = null; return bdayGiftMem.list || []; });
  return bdayGiftMem.job;
}
function bdayGiftKeep(uid, list) {
  bdayGiftMem.uid = uid;
  bdayGiftMem.list = list;
  writeJsonLs(`zchat-bday-gifts-${uid}`, list.slice(0, 40));
  bdayGiftPing();
}
function useBdayGifts(uid) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    bdayGiftMem.subs.add(fn);
    loadBdayGifts(uid).then(fn);
    return () => { bdayGiftMem.subs.delete(fn); };
  }, [uid]);
  return bdayGiftMem.uid === uid ? bdayGiftMem.list || [] : [];
}
function bdayNextDate(md) {
  const [m, d] = String(md || '').split('-').map(Number);
  if (!m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 2; i++) {
    const y = now.getFullYear() + i;
    const day = new Date(y, m - 1, Math.min(d, new Date(y, m, 0).getDate()));
    if (day >= today) return day;
  }
  return null;
}
function bdayDayText(md) {
  const day = bdayNextDate(md);
  if (!day) return '';
  const now = new Date();
  if (day.toDateString() === now.toDateString()) return 'today';
  return fmtDate(day, { month: 'long', day: 'numeric' });
}
function verifiedGiftLink(url, uid, token) {
  const link = checkoutLink(url, uid);
  if (!link || !token) return null;
  try { const u = new URL(link); u.searchParams.set('checkout[custom][gift]', token); return u.toString(); } catch { return null; }
}
export function VerifiedGiftSheet({ uid, me, to, plan, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [wait, setWait] = useState(null);
  const [paid, setPaid] = useState(false);
  const first = String(to.name || '').split(' ')[0] || 'them';
  const until = to.verified_until && Date.parse(to.verified_until) > Date.now() ? new Date(to.verified_until) : null;
  const team = !!(to.verified && !to.verified_until);
  const endsAt = new Date((until ? until.getTime() : Date.now()) + 30 * 86400000);
  useEffect(() => {
    if (!wait) return undefined;
    let alive = true;
    const check = async () => {
      const { data } = await supabase.from('verified_gift_orders').select('status').eq('id', wait).maybeSingle();
      if (alive && data && data.status === 'paid') { setPaid(true); playUiSound('win'); }
    };
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    const t = setInterval(check, 6000);
    const stop = setTimeout(() => clearInterval(t), 120000);
    return () => { alive = false; clearInterval(t); clearTimeout(stop); document.removeEventListener('visibilitychange', onVis); };
  }, [wait]);
  const start = async () => {
    if (busy || team) return;
    setBusy(true);
    setErr('');
    hapticTap();
    const r = await giftRpc('zchat_verified_gift_start', { p_to: to.id, p_note: note.trim().slice(0, 80) || null }, 'Verified gift');
    setBusy(false);
    if (r.error) { setErr(r.error); return; }
    const link = verifiedGiftLink(plan.url, uid, r.row.token);
    if (!link) { setErr('Payments are not ready yet. Try again later.'); return; }
    try { const win = window.open(link, '_blank', 'noopener,noreferrer'); if (!win) window.location.href = link; } catch { window.location.href = link; }
    setWait(r.row.token);
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 776, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '90%', overflowY: 'auto', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 4px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>Gift Verified to {first}</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div style={{ padding: '6px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, background: theme.soft }}>
              <Avatar emoji={to.avatar} name={to.name} size={52} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink, minWidth: 0 }}><NameBadge name={to.name} verified={team ? to.verified : 'blue'} custom={to.custom_badge} size={16} ns={cxNs(to)} /></div>
                <div style={{ fontSize: 13, color: theme.muted, marginTop: 1 }}>@{to.username}</div>
              </div>
            </div>
            {paid ? (
              <div className="zchat-pop" style={{ textAlign: 'center', padding: '22px 6px 6px' }}>
                <VerifiedBadge tier="blue" size={54} style={{ marginLeft: 0 }} />
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, marginTop: 10 }}>{first} got Verified from you</div>
                <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 4 }}>Their badge is on until {fmtDate(endsAt, { month: 'long', day: 'numeric' })}.</div>
                <div style={{ marginTop: 18 }}><BigButton label="Done" onClick={onClose} /></div>
              </div>
            ) : team ? (
              <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '16px 2px 4px' }}>{first} already has a badge from the ZChat team, so there is nothing to add.</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '14px 0 12px' }}>
                  {[`The blue badge next to ${first}'s name for 30 days`, until ? `Their badge is on until ${fmtDate(until, { month: 'long', day: 'numeric' })}, so your month adds on until ${fmtDate(endsAt, { month: 'long', day: 'numeric' })}` : `It starts as soon as you pay, until ${fmtDate(endsAt, { month: 'long', day: 'numeric' })}`, 'It does not renew. Nothing more to pay later'].map((t) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 14, color: theme.ink2, lineHeight: 1.4 }}><span style={{ width: 22, display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: 1 }}><Check size={16} color="#3B82F6" strokeWidth={2.6} /></span>{t}</div>
                  ))}
                </div>
                <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 80))} placeholder="Add a note" aria-label="Gift note" style={{ ...inputStyle(theme), fontSize: 15.5 }} />
                {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
                <div style={{ marginTop: 14 }}><BigButton label={busy ? 'Opening' : wait ? 'Open the payment again' : `Pay ${plan.price || ''}`.trim()} disabled={busy} onClick={start} /></div>
                <div style={{ fontSize: 12.5, color: theme.muted, padding: '10px 2px 0', lineHeight: 1.5 }}>{wait ? `When your payment goes through, ${first} gets the badge by themselves and a gift to open.` : 'The same price as Verified for yourself, paid once. Payments are handled safely by Lemon Squeezy.'}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

const GIFT_AMOUNTS = [10, 50, 100, 500];
function giftStartTab(start) {
  const k = start && start.kind;
  if (k === 'bubble' && bubbleKeyOf(start.key)) return 'bubble';
  if (k === 'set' && isDecorKey(start.key) && !DECOR_BY_KEY[start.key].drop) return 'item';
  if (k === 'charm' && CUSTOM_BADGES[start.key]) return 'charm';
  if (cxFlag.on && CX_KINDS.includes(k) && cxKnown(k, start.key)) return 'styles';
  if (cxFlag.on && k === 'wallpaper' && liveWallPaid(start.key)) return 'styles';
  if (cxFlag.on && SI_KINDS.includes(k) && siSpec(k, start.key)) return 'styles';
  return 'coins';
}
function GiftAmountPicker({ value, onChange, max }) {
  const { theme } = useTheme();
  const [text, setText] = useState(String(value));
  useEffect(() => { if (Number(text) !== value) setText(String(value)); }, [value]);
  const top = Math.max(1, max);
  const commit = (raw) => {
    const digits = String(raw).replace(/[^0-9]/g, '').slice(0, 5);
    setText(digits);
    const n = Number(digits);
    if (digits && n >= 1) onChange(Math.min(GIFT_MAX, n));
  };
  return (
    <div style={{ padding: '6px 0 4px' }}>
      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 0 2px', cursor: 'text' }}>
        <CoinIcon size={34} />
        <input value={text} inputMode="numeric" pattern="[0-9]*" aria-label="Number of coins" onChange={(e) => commit(e.target.value)} onBlur={() => { if (!text || Number(text) < 1) setText(String(value)); }}
          style={{ width: `${Math.max(2, text.length) * 0.62 + 0.4}em`, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 46, fontWeight: 750, letterSpacing: '-0.02em', textAlign: 'center', padding: 0, fontVariantNumeric: 'tabular-nums' }} />
      </label>
      <div style={{ textAlign: 'center', fontSize: 12.5, color: value > max ? theme.danger : theme.muted, marginTop: 2 }}>{value > max ? `You have ${formatCount(Math.max(0, max))} ${Math.max(0, max) === 1 ? 'coin' : 'coins'}` : `Up to ${formatCount(GIFT_MAX)} at a time`}</div>
      <div style={{ padding: '14px 4px 4px' }}>
        <KitSlider value={Math.min(value, top)} min={1} max={Math.min(GIFT_MAX, top)} step={1} label="Choose how many coins" onChange={(n) => { onChange(n); setText(String(n)); }} />
      </div>
      <SegmentedControl style={{ marginTop: 10 }} value={GIFT_AMOUNTS.includes(value) ? value : null} onChange={(n) => { hapticTap(); onChange(n); setText(String(n)); }} options={GIFT_AMOUNTS.map((n) => [n, formatCount(n)])} />
    </div>
  );
}
function giftTheirsMerge(uid, rows) {
  const base = (rows || []).filter((r) => !r.local);
  const pend = giftTheirsPend.get(uid) || [];
  const extra = pend.filter(([kind, key]) => !base.some((r) => r.kind === kind && r.reward_key === key && !r.expires_at)).map(([kind, key]) => ({ kind, reward_key: key, expires_at: null, local: true }));
  return extra.length ? [...base, ...extra] : base;
}
function giftTheirsMark(uid, pairs, on) {
  if (!uid || !pairs || !pairs.length) return;
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const pend = (giftTheirsPend.get(uid) || []).filter((p) => !pairs.some((q) => same(p, q)));
  giftTheirsPend.set(uid, on ? [...pend, ...pairs] : pend);
  if (giftTheirsMem.has(uid)) giftTheirsMem.set(uid, giftTheirsMerge(uid, giftTheirsMem.get(uid)));
}
export function GiftSheet({ uid, me, to, onClose, onSent, start, onAsk }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const w = useWallet(uid);
  const drag = useSheetDrag(onClose);
  const santa = start && start.santa ? start.santa : null;
  const firstTab = santa && giftStartTab(start) === 'coins' ? 'item' : giftStartTab(start);
  const [tab, setTab] = useState(firstTab);
  const [bub, setBub] = useState(() => (firstTab === 'bubble' ? bubbleKeyOf(start.key) : null));
  const [charm, setCharm] = useState(() => (firstTab === 'charm' ? start.key : null));
  const [sty, setSty] = useState(() => (firstTab === 'styles' ? { kind: start.kind, key: start.key } : null));
  const [amount, setAmount] = useState(() => (start && start.kind === 'coins' && Number(start.amount) > 0 ? Math.min(GIFT_MAX, Math.floor(Number(start.amount))) : 50));
  const [noteText, setNoteText] = useState('');
  const [pick, setPick] = useState(() => (firstTab === 'item' ? start.key : null));
  const [part, setPart] = useState('set');
  const [theirs, setTheirs] = useState(() => giftTheirsMem.get(to.id) || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const gridRef = useRef(null);
  const gw = useWidthOf(gridRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 480)) - 40;
  const wish = useWishlist(to.id);
  const [wrap, setWrap] = useState(readGiftWrap);
  const [wrapSet, setWrapSet] = useState(false);
  const [wrapOpen, setWrapOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [bdayOn, setBdayOn] = useState(() => !santa && !!(to.__bday || (start && start.bday)));
  const [payLater, setPayLater] = useState(false);
  const [chipPick, setChipPick] = useState(false);
  const [chipPeople, setChipPeople] = useState(null);
  const [vOpen, setVOpen] = useState(() => !!to.__verified);
  const [askCancel, setAskCancel] = useState(false);
  const bd = useBirthdayOf(to.id);
  const bdays = useBdayGifts(uid);
  const pay = usePayOptions();
  const bdKnown = !santa && !to.is_bot && !!(bd && bd.md && bdayNextDate(bd.md));
  const bdText = bdKnown ? bdayDayText(bd.md) : '';
  const bdWaiting = bdays.find((g) => g.to === to.id && g.status === 'waiting') || null;
  const vPlan = !santa && pay && pay.verifiedGift && !to.is_bot ? pay.verifiedGift : null;
  const fit = (p) => !santa || (Number(p) || 0) <= santa.budget;
  useEffect(() => {
    let alive = true;
    supabase.from('user_rewards').select('kind, reward_key, expires_at').eq('user_id', to.id).then(({ data, error }) => {
      if (!alive) return;
      if (error) { setTheirs((cur) => cur || []); return; }
      const rows = giftTheirsMerge(to.id, data || []);
      giftTheirsMem.set(to.id, rows);
      setTheirs(rows);
    }, () => { if (alive) setTheirs((cur) => cur || []); });
    return () => { alive = false; };
  }, []);
  const forever = (r) => !r.expires_at;
  const theirBubbles = new Set((theirs || []).filter((r) => r.kind === 'bubble' && forever(r)).map((r) => r.reward_key));
  const theirCharms = new Set((theirs || []).filter((r) => r.kind === 'charm' && forever(r)).map((r) => r.reward_key));
  const theirCx = (kind, key) => (theirs || []).some((r) => r.kind === kind && r.reward_key === key && forever(r));
  const ownSet = (k) => decorOwned((theirs || []).filter(forever), k);
  useEffect(() => {
    if (!theirs) return;
    if (pick) {
      const o = ownSet(pick);
      if (o.full) setPick(null);
      else setPart(o.any ? (!o.frame ? 'frame' : !o.plate ? 'nameplate' : 'effect') : 'set');
    }
    if (bub && theirBubbles.has(bub)) setBub(null);
    if (charm && theirCharms.has(charm)) setCharm(null);
    if (sty && theirCx(sty.kind, sty.key)) setSty(null);
  }, [theirs]);
  const first = String((to && to.name) || '').split(' ')[0] || 'them';
  const balance = w ? w.coins : 0;
  const set = pick ? DECOR_BY_KEY[pick] : null;
  const own = set ? ownSet(set.key) : { frame: false, plate: false, effect: false, count: 0 };
  const ask = set ? decorAsk(set, part, own) : { missing: [], what: 'set', price: 0 };
  const charmPrice = charm ? shopPrice('charm', charm) || 0 : 0;
  const cost = tab === 'coins' ? amount : tab === 'bubble' ? (bub ? BUBBLE_PRICE : 0) : tab === 'charm' ? (charm ? charmPrice : 0) : tab === 'styles' ? (sty ? shopPrice(sty.kind, sty.key) || 0 : 0) : ask.price;
  const enough = balance >= cost && cost > 0;
  const credit = santa ? Number(santa.price) || 0 : bdayOn && bdWaiting ? Number(bdWaiting.held) || 0 : 0;
  const overBudget = !!santa && cost > santa.budget;
  const canSend = cost > 0 && !overBudget && ((bdayOn && payLater) || balance + credit >= cost);
  const cardW = Math.max(100, Math.floor((gw - 8) / 2) - 8);
  const giftSets = [...DECOR_SETS, ...DECOR_SI].filter((s) => !ownSet(s.key).full && fit(decorPartPrice(s.key)));
  const giftBubbles = CHAR_BUBBLE_KEYS.filter((k) => !theirBubbles.has(k) && fit(BUBBLE_PRICE));
  const giftCharms = giftCharmKeys().filter((k) => !theirCharms.has(k) && fit(shopPrice('charm', k)));
  const wished = theirs ? wish.list.filter((x) => (x.kind === 'set' ? !ownSet(x.item_key).full && !DECOR_BY_KEY[x.item_key].drop : x.kind === 'bubble' ? !theirBubbles.has(x.item_key) : CX_KINDS.includes(x.kind) ? cxFlag.on && cxKnown(x.kind, x.item_key) && !theirCx(x.kind, x.item_key) : x.kind === 'wallpaper' ? cxFlag.on && liveWallPaid(x.item_key) && !theirCx(x.kind, x.item_key) : SI_KINDS.includes(x.kind) ? cxFlag.on && !!siSpec(x.kind, x.item_key) && !theirCx(x.kind, x.item_key) : !theirCharms.has(x.item_key) && !!shopPrice('charm', x.item_key)) && fit(x.kind === 'set' ? decorPartPrice(x.item_key) : shopPrice(x.kind, x.item_key))) : [];
  useDecorLoaded(tab === 'item' ? DECOR_SPRITE : null);
  const send = async () => {
    if (busy || !canSend) return;
    const isCoins = tab === 'coins';
    if (santa || bdayOn) { sendLater(isCoins); return; }
    if (!(await spendGate(isCoins ? `Send ${coinsText(amount)} to ${first}` : `Send a gift to ${first} for ${coinsText(cost)}`, isCoins ? { coins: amount, send: true } : { coins: cost }))) return;
    setErr('');
    const note = noteText.trim().slice(0, 80) || null;
    const args = isCoins ? { p_to: to.id, p_amount: amount, p_note: note } : tab === 'bubble' ? { p_to: to.id, p_kind: 'bubble', p_key: bub, p_note: note } : tab === 'charm' ? { p_to: to.id, p_kind: 'charm', p_key: charm, p_note: note } : tab === 'styles' ? { p_to: to.id, p_kind: sty.kind, p_key: sty.key, p_note: note } : { p_to: to.id, p_kind: part === 'set' ? 'set' : part, p_key: set.key, p_note: note };
    const gifted = isCoins ? [] : tab === 'bubble' ? [['bubble', bub]] : tab === 'charm' ? [['charm', charm]] : tab === 'styles' ? [[sty.kind, sty.key]] : ask.missing.map((k) => [k, set.key]);
    const label = isCoins ? `You sent ${first} ${coinsText(amount)}` : tab === 'bubble' ? `You sent ${first} the ${CHAR_BUBBLES[bub].label} bubble` : tab === 'charm' ? `You sent ${first} the ${CUSTOM_BADGES[charm].label}` : tab === 'styles' ? `You sent ${first} the ${shopItemName(sty.kind, sty.key)} ${shopKindWord(sty.kind)}` : `You sent ${first} the ${set.name} ${ask.what}`;
    const sent = isCoins ? amount : 0;
    const job = moneyRun(uid, { coins: cost, run: async () => {
      let { data, error } = await supabase.rpc('zchat_gift_send', { p_to: to.id, p_kind: isCoins ? 'coins' : args.p_kind, p_key: isCoins ? null : args.p_key, p_amount: isCoins ? amount : null, p_note: note, p_paper: wrap.p, p_ribbon: wrap.r });
      if (error && rpcMissing(error)) ({ data, error } = await supabase.rpc(isCoins ? 'zchat_send_gift' : 'zchat_gift_item', args));
      const row = Array.isArray(data) ? data[0] : data;
      if (error) return { error: rpcFailText(isCoins ? 'Coin gift' : 'Item gift', error, 'Gifts switch on once the latest ZChat setup is finished.') };
      if (!row || !row.ok) return { error: (row && row.reason) || 'That gift could not be sent.' };
      return { ok: true, coins: row.coins };
    } }).then((r) => {
      if (r.error) { if (sent) addSpendSent(-sent); giftTheirsMark(to.id, gifted, false); return r; }
      sendPushNotification(to.id, 'ZChat', `${(me && me.name) || 'Someone'} sent you a gift`, '/?requests=1', me && me.avatar);
      return r;
    });
    giftTheirsMark(to.id, gifted, true);
    hapticTap();
    playUiSound('like');
    onSent(label, job);
  };
  const giftParts = (isCoins) => {
    const kind = isCoins ? 'coins' : tab === 'bubble' ? 'bubble' : tab === 'charm' ? 'charm' : tab === 'styles' ? sty.kind : (part === 'set' ? 'set' : part);
    const key = isCoins ? null : tab === 'bubble' ? bub : tab === 'charm' ? charm : tab === 'styles' ? sty.key : set.key;
    const what = isCoins ? coinsText(amount) : tab === 'bubble' ? `the ${CHAR_BUBBLES[bub].label} bubble` : tab === 'charm' ? `the ${CUSTOM_BADGES[charm].label}` : tab === 'styles' ? `the ${shopItemName(sty.kind, sty.key)} ${shopKindWord(sty.kind)}` : `the ${set.name} ${ask.what}`;
    return { kind, key, what };
  };
  const sendLater = async (isCoins) => {
    const { kind, key, what } = giftParts(isCoins);
    const note = noteText.trim().slice(0, 80) || null;
    if (santa) {
      const net = Math.max(0, cost - credit);
      if (net > 0 && !(await spendGate(`Pick ${what} for ${first}`, { coins: net }))) return;
      setErr('');
      hapticTap();
      playUiSound('like');
      const job = moneyRun(uid, { coins: net, run: async () => {
        const r = await giftRpc('zchat_santa_pick', { p_event: santa.id, p_kind: kind, p_key: key, p_note: note }, 'Secret Santa');
        return r.error ? { error: r.error } : { ok: true, coins: r.row.balance, row: r.row };
      } }).then((r) => { if (!r.error && r.row && r.row.event) santaPut(r.row.event); return r; });
      onSent(`You picked ${what} for ${first}. It opens on the reveal day`, job);
      return;
    }
    const hold = payLater ? 0 : cost;
    const net = Math.max(0, hold - credit);
    if (net > 0 && !(await spendGate(`Hold ${coinsText(cost)} for ${first}'s birthday gift`, isCoins ? { coins: net, send: true } : { coins: net }))) return;
    setErr('');
    hapticTap();
    playUiSound('like');
    let tz = 'UTC';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch {}
    const before = (bdayGiftMem.uid === uid && bdayGiftMem.list) || [];
    const temp = { id: bdWaiting ? bdWaiting.id : `temp-${Date.now()}`, to: to.id, kind, key, coins: isCoins ? amount : null, price: cost, held: hold, pay: payLater ? 'later' : 'now', note, wrap: wrapSet ? wrap : { p: 'birthday', r: 'gold' }, md: bd.md, deliver_at: null, status: 'waiting' };
    bdayGiftKeep(uid, [...before.filter((g) => g.to !== to.id), temp]);
    const job = moneyRun(uid, { coins: net, run: async () => {
      const r = await giftRpc('zchat_bday_gift_save', { p_to: to.id, p_kind: kind, p_key: key, p_coins: isCoins ? amount : null, p_note: note, p_paper: wrapSet ? wrap.p : null, p_ribbon: wrapSet ? wrap.r : null, p_pay: payLater ? 'later' : 'now', p_tz: tz }, 'Birthday gift');
      return r.error ? { error: r.error } : { ok: true, coins: r.row.coins, row: r.row };
    } }).then((r) => {
      const list = (bdayGiftMem.uid === uid && bdayGiftMem.list) || [];
      if (r.error) bdayGiftKeep(uid, [...list.filter((g) => g.to !== to.id), ...before.filter((g) => g.to === to.id)]);
      else if (r.row && r.row.gift) bdayGiftKeep(uid, [...list.filter((g) => g.to !== to.id), r.row.gift]);
      return r;
    });
    onSent(bdText === 'today' ? `It is ${first}'s birthday today, so ${what} goes out in a minute` : `Set for ${bdText}. ${first} gets ${what} at midnight on their birthday`, job);
  };
  const cancelBday = async () => {
    setAskCancel(false);
    const g = bdWaiting;
    if (!g) return;
    const before = bdayGiftMem.list || [];
    bdayGiftKeep(uid, before.filter((x) => x.id !== g.id));
    setBdayOn(false);
    hapticTap();
    const held = Number(g.held) || 0;
    if (held) walletPatch(uid, { coins: held });
    const r = await giftRpc('zchat_bday_gift_cancel', { p_id: g.id }, 'Birthday gift');
    if (r.error) { bdayGiftKeep(uid, before); if (held) walletPatch(uid, { coins: -held }); setErr(r.error); return; }
    announceWallet();
  };
  const changeBday = () => {
    const g = bdWaiting;
    if (!g) return;
    hapticTap();
    setBdayOn(true);
    setPayLater(g.pay === 'later');
    if (g.wrap && giftPaper(g.wrap.p) && !GIFT_PAPER_EXTRA[g.wrap.p]) { setWrap({ p: g.wrap.p, r: giftRibbon(g.wrap.r)[0] }); setWrapSet(true); }
    if (g.note) setNoteText(g.note);
    if (g.kind === 'coins') { setTab('coins'); setAmount(Math.min(GIFT_MAX, Math.max(1, Number(g.coins) || 50))); }
    else if (g.kind === 'bubble') { setTab('bubble'); setBub(g.key); }
    else if (g.kind === 'charm') { setTab('charm'); setCharm(g.key); }
    else if (CX_KINDS.includes(g.kind) || g.kind === 'wallpaper') { setTab('styles'); setSty({ kind: g.kind, key: g.key }); }
    else if (isDecorKey(g.key)) { setTab('item'); setPick(g.key); setPart(g.kind === 'set' ? 'set' : g.kind); }
  };
  const pv = tab === 'item' && set ? { kind: part, k: set.key } : tab === 'charm' && charm ? { kind: 'charm', k: charm } : tab === 'styles' && sty && giftPreviewable(sty.kind) ? { kind: sty.kind, k: sty.key } : null;
  const chipGift = !santa && !bdayOn && tab !== 'coins' && cost > 0 ? (() => { const g = giftParts(false); return { kind: g.kind, key: g.key, price: cost, label: g.what.replace(/^the /, '').replace(/^./, (c) => c.toUpperCase()) }; })() : null;
  const choose = (k) => {
    setPick(k);
    setErr('');
    hapticTap();
    const o = ownSet(k);
    setPart(o.any ? (!o.frame ? 'frame' : !o.plate ? 'nameplate' : 'effect') : 'set');
  };
  const pickWish = (x) => {
    hapticTap();
    setErr('');
    if (x.kind === 'set') { setTab('item'); choose(x.item_key); } else if (x.kind === 'bubble') { setTab('bubble'); setBub(x.item_key); } else if (CX_KINDS.includes(x.kind) || x.kind === 'wallpaper' || SI_KINDS.includes(x.kind)) { setTab('styles'); setSty({ kind: x.kind, key: x.item_key }); } else { setTab('charm'); setCharm(x.item_key); }
  };
  const parts = set ? [['set', 'Full set', own.count === 0], ['frame', 'Frame', !own.frame], ['nameplate', 'Nameplate', !own.plate], ['effect', 'Effect', !own.effect]].filter(([, , ok]) => ok) : [];
  const loading = !theirs;
  const emptyNote = (t) => <div style={{ textAlign: 'center', fontSize: 14, color: theme.muted, padding: '28px 12px' }}>{t}</div>;
  if (to.__verified && vPlan) return <VerifiedGiftSheet uid={uid} me={me} to={to} plan={vPlan} onClose={onClose} />;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 760, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '90%', background: theme.panelBg, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ flexShrink: 0, touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 20px 12px' }}>
              <Avatar emoji={to.avatar} name={to.name} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink }}>{santa ? `Secret Santa gift for ${first}` : `Gift for ${first}`}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: theme.muted, marginTop: 1 }}><CoinIcon size={14} />{santa ? `Up to ${formatCount(santa.budget)} coins, you have ${formatCount(balance)}` : `You have ${formatCount(balance)} ${balance === 1 ? 'coin' : 'coins'}`}</div>
              </div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
            <SegmentedControl style={{ margin: '0 20px 12px' }} value={tab} onChange={(k) => { setTab(k); setErr(''); }} options={[...(santa ? [] : [['coins', 'Coins']]), ['item', 'Sets'], ['bubble', 'Bubbles'], ['charm', 'Charms'], ...(cxFlag.on ? [['styles', 'Styles']] : [])]} />
          </div>
          <div ref={gridRef} data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 20px' }}>
            {bdWaiting && !bdayOn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', margin: '0 0 12px', borderRadius: 16, background: theme.dark ? 'rgba(240,80,122,0.12)' : '#FFF0F4' }}>
                <LineGlyph k="cake" size={22} color={BIRTHDAY_PINK} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink }}>Set for their birthday</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${bdayGiftWhat(bdWaiting).replace(/^./, (c) => c.toUpperCase())}, ${bdText || 'on the day'}${bdWaiting.pay === 'later' ? ', paid then' : ''}`}</div>
                </div>
                <div role="button" aria-label="Change the birthday gift" onClick={changeBday} className="zchat-press" style={{ padding: '7px 10px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Change</div>
                <div role="button" aria-label="Cancel the birthday gift" onClick={() => { hapticTap(); setAskCancel(true); }} className="zchat-press" style={{ padding: '7px 4px 7px 6px', fontSize: 13.5, fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
              </div>
            )}
            {santa && <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.45, margin: '-2px 2px 12px' }}>{santa.kind ? `You picked ${bdayGiftWhat({ kind: santa.kind, key: santa.key })}. Pick something else to swap it, the coins move over.` : `Only you know you are giving to ${first}. Pick anything up to ${formatCount(santa.budget)} coins.`}</div>}
            {tab !== 'coins' && wished.length > 0 && (
              <div style={{ margin: '2px 0 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 700, color: theme.ink, marginBottom: 8 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.4 16.1 3 13.1 3 9.3 3 6.6 5.1 4.5 7.7 4.5c1.7 0 3.2.9 4.3 2.3 1.1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2.1 4.7 4.8 0 3.8-3.4 6.8-8.2 10.8-.2.2-.5.3-.8.3z" fill="#FF4D6A" /></svg>
                  On {first}'s wishlist
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '0 -20px', padding: '0 20px 2px' }}>
                  {wished.map((x) => {
                    const on = (x.kind === 'set' && tab === 'item' && pick === x.item_key) || (x.kind === 'bubble' && tab === 'bubble' && bub === x.item_key) || (x.kind === 'charm' && tab === 'charm' && charm === x.item_key) || (tab === 'styles' && !!sty && sty.kind === x.kind && sty.key === x.item_key);
                    return (
                      <div key={`${x.kind}:${x.item_key}`} role="button" aria-label={`${shopItemName(x.kind, x.item_key)}, on their wishlist`} onClick={() => pickWish(x)} className="zchat-press"
                        style={{ flex: '0 0 88px', borderRadius: 16, padding: '8px 6px 7px', background: theme.dark ? 'rgba(255,255,255,0.05)' : '#F5F5F7', boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                        <ShopItemArt kind={x.kind} k={x.item_key} me={to} size={58} dark={theme.dark} />
                        <div style={{ alignSelf: 'stretch', fontSize: 11.5, fontWeight: 650, color: theme.ink, marginTop: 4, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shopItemName(x.kind, x.item_key)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {loading && tab !== 'coins' ? <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner size={20} /></div> : tab === 'styles' ? (
              <CxGiftPicker to={to} first={first} chosen={sty} owns={theirCx} maxPrice={santa ? santa.budget : 0} onPick={(kind, key) => { hapticTap(); setSty({ kind, key }); setErr(''); }} />
            ) : tab === 'charm' ? (
              giftCharms.length ? (
                <div role="radiogroup" aria-label="Pick a charm" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, padding: '4px 0 6px' }}>
                  {giftCharms.map((k) => {
                    const on = charm === k;
                    return (
                      <div key={k} role="radio" aria-checked={on} aria-label={`${shopItemName('charm', k)} charm`} onClick={() => { hapticTap(); setCharm(k); setErr(''); }} className="zchat-press"
                        style={{ borderRadius: 18, padding: '12px 6px 10px', cursor: 'pointer', background: theme.dark ? 'rgba(255,255,255,0.045)' : '#F5F5F7', boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CharmPreview charm={k} size={44} /></div>
                        <span style={{ alignSelf: 'stretch', fontSize: 12.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{shopItemName('charm', k)}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: theme.ink }}><CoinIcon size={12} />{formatCount(shopPrice('charm', k) || 0)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : emptyNote(`${first} already has every charm.`)
            ) : tab === 'bubble' ? (
              giftBubbles.length ? (
                <div role="radiogroup" aria-label="Pick a bubble" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, padding: '4px 0 6px' }}>
                  {giftBubbles.map((k) => <BubbleCard key={k} k={k} on={bub === k} status={String(BUBBLE_PRICE)} statusTone="coin" onPick={() => { hapticTap(); setBub(k); setErr(''); }} />)}
                </div>
              ) : emptyNote(`${first} already has every bubble.`)
            ) : tab === 'coins' ? (
              <>
                <GiftAmountPicker value={amount} onChange={(n) => { setAmount(n); setErr(''); }} max={balance} />
                {onAsk && (
                  <div role="button" aria-label={`Ask ${first} for coins instead`} onClick={() => { hapticTap(); onAsk(amount); }} className="zchat-press"
                    style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 14, background: theme.soft, color: theme.ink, fontSize: 14.5, fontWeight: 650, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 19h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
                    Ask {first} for {formatCount(amount)} {amount === 1 ? 'coin' : 'coins'} instead
                  </div>
                )}
                {vPlan && (
                  <div role="button" aria-label={`Gift Verified to ${first}`} onClick={() => { hapticTap(); setVOpen(true); }} className="zchat-press"
                    style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '6px 14px', boxSizing: 'border-box', borderRadius: 14, background: theme.soft, cursor: 'pointer' }}>
                    <span style={{ width: 26, display: 'flex', justifyContent: 'center', flexShrink: 0 }}><VerifiedBadge tier="blue" size={22} style={{ marginLeft: 0 }} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14.5, fontWeight: 650, color: theme.ink }}>Gift Verified for a month</span>
                      <span style={{ display: 'block', fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{vPlan.price ? `${vPlan.price}, paid once` : 'Paid once, it does not renew'}</span>
                    </span>
                    <ChevronRight size={18} color={theme.muted} />
                  </div>
                )}
              </>
            ) : giftSets.length ? (
              <>
                <div role="radiogroup" aria-label="Pick a set" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, padding: '4px 0 6px' }}>
                  {giftSets.map((s) => {
                    const on = pick === s.key;
                    const o = ownSet(s.key);
                    return (
                      <div key={s.key} role="radio" aria-checked={on} aria-label={`${s.name} set`} onClick={() => choose(s.key)} className="zchat-press" style={{ position: 'relative', borderRadius: 16, padding: '6px 2px 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: `radial-gradient(120% 85% at 50% 20%, ${s.accent}30 0%, rgba(13,14,20,0) 64%), #12131b`, boxShadow: on ? `0 0 0 2px ${theme.coral}` : 'none' }}>
                        <DecorHero frameKey={s.key} plateKey={s.key} width={cardW} photo={to.avatar} name={to.name} lazy compact gapColor="#12131b" />
                        <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px 0' }}>
                          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 700, color: '#FFD66B', flexShrink: 0 }}><CoinIcon size={11} />{(3 - o.count) * decorPartPrice(s.key)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {set && parts.filter(([k]) => fit(k === 'set' ? decorPartPrice(set.key) * 3 : decorPartPrice(set.key))).length > 0 && (
                  <div role="radiogroup" aria-label="What to send" style={{ display: 'grid', gridTemplateColumns: `repeat(${parts.length}, minmax(0, 1fr))`, gap: 6, padding: '10px 0 2px' }}>
                    {parts.filter(([k]) => fit(k === 'set' ? decorPartPrice(set.key) * 3 : decorPartPrice(set.key))).map(([k, l]) => {
                      const on = part === k;
                      const p = k === 'set' ? decorPartPrice(set.key) * 3 : decorPartPrice(set.key);
                      return (
                        <div key={k} role="radio" aria-checked={on} aria-label={`${l}, ${p} coins`} onClick={() => { setPart(k); hapticTap(); }} className="zchat-press"
                          style={{ minWidth: 0, borderRadius: 14, padding: '9px 4px 8px', cursor: 'pointer', background: on ? (theme.dark ? 'rgba(124,92,252,0.22)' : '#EEE9FF') : theme.soft, boxShadow: on ? `inset 0 0 0 1.5px ${theme.coral}` : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          {k === 'set' ? <span style={{ display: 'inline-flex', gap: 2 }}><PieceGlyph k="frame" size={14} color={on ? theme.coral : theme.ink2} /><PieceGlyph k="nameplate" size={14} color={on ? theme.coral : theme.ink2} /><PieceGlyph k="effect" size={14} color={on ? theme.coral : theme.ink2} /></span> : <PieceGlyph k={k} size={18} color={on ? theme.coral : theme.ink2} />}
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap' }}>{l}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: theme.muted }}><CoinIcon size={11} />{p}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : emptyNote(`${first} already has every set.`)}
            {(pv || !santa) && (
              <div role="list" aria-label="Gift options" style={{ marginTop: 14, borderRadius: 16, background: theme.soft, overflow: 'hidden' }}>
                {[
                  pv ? { k: 'pv', icon: <Eye size={21} strokeWidth={1.7} />, label: `See it on ${first}`, sub: 'Their real profile, wearing it', on: () => { hapticTap(); setPreview(pv); } } : null,
                  !santa ? { k: 'wrap', icon: <WrapBoxArt paper={bdayOn && !wrapSet ? 'birthday' : wrap.p} ribbon={bdayOn && !wrapSet ? 'gold' : wrap.r} size={30} still />, label: 'Gift wrap', sub: giftWrapText(bdayOn && !wrapSet ? { p: 'birthday', r: 'gold' } : wrap), on: () => { hapticTap(); setWrapOpen(true); } } : null,
                  bdKnown ? { k: 'bday', icon: <LineGlyph k="cake" size={22} color={BIRTHDAY_PINK} />, label: 'Send on their birthday', sub: bdText === 'today' ? 'Their birthday is today' : `${bdText}, at midnight`, right: <IgToggle on={bdayOn} onClick={(e) => { e.stopPropagation(); setBdayOn((v) => !v); setErr(''); }} /> } : null,
                  chipGift ? { k: 'chip', icon: <Users size={21} strokeWidth={1.7} />, label: 'Chip in with friends', sub: 'Friends help pay, it goes as one gift', on: () => { hapticTap(); setChipPick(true); } } : null,
                ].filter(Boolean).map((r, i, arr) => (
                  <React.Fragment key={r.k}>
                    <div role={r.on ? 'button' : 'listitem'} aria-label={r.on ? r.label : undefined} onClick={r.on} className={r.on ? 'zchat-row-press' : undefined} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, minHeight: 58, padding: '6px 14px', boxSizing: 'border-box', cursor: r.on ? 'pointer' : 'default' }}>
                      <span style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, flexShrink: 0 }}>{r.icon}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 650, color: theme.ink }}>{r.label}</span>
                        <span style={{ display: 'block', fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</span>
                      </span>
                      {r.right || <ChevronRight size={18} color={theme.muted} style={{ flexShrink: 0 }} />}
                      {i < arr.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 56, right: 0, bottom: 0, height: 1, background: theme.hair }} />}
                    </div>
                    {r.k === 'bday' && bdayOn && (
                      <div style={{ padding: '0 14px 12px 56px' }}>
                        <SegmentedControl value={payLater ? 'later' : 'now'} onChange={(v) => { hapticTap(); setPayLater(v === 'later'); setErr(''); }} options={[['now', 'Pay now'], ['later', 'Pay on the day']]} />
                        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 8, lineHeight: 1.45 }}>{payLater ? 'Nothing is taken now. If you are short of coins on the day, it does not go out and you get a message.' : 'The coins are held now, so it goes out for sure. Cancel before the day and they come back.'}</div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
            <input value={noteText} onChange={(e) => setNoteText(e.target.value.slice(0, 80))} placeholder="Add a note" aria-label="Gift note" style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 12 }} />
            <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', textWrap: 'pretty' }}>{santa ? 'It stays a secret until the reveal, then all the gifts open together.' : bdayOn ? `It arrives in a birthday wrap at midnight on ${first}'s birthday, in their time zone when ZChat knows it, or yours. You can change or cancel it until then.` : <>{tab === 'coins' ? 'Coins go straight to their wallet.' : tab === 'item' ? 'It is theirs to keep and shows on their profile. The effect plays when they wear the full set.' : tab === 'bubble' ? 'It is theirs to keep, and everyone sees it on their messages.' : tab === 'styles' ? 'It is theirs to keep. They can wear it from their Collection.' : 'It is theirs to keep and shows next to their name.'} The gift arrives wrapped, ready to open.</>}</div>
            {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, padding: '10px 2px 0' }}>{err}</div>}
          </div>
          <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
            <BigButton label={busy ? 'Sending' : !cost ? (tab === 'item' ? 'Pick a set' : tab === 'bubble' ? 'Pick a bubble' : tab === 'charm' ? 'Pick a charm' : tab === 'styles' ? 'Pick a style' : 'Pick an amount') : overBudget ? `Over the budget of ${formatCount(santa.budget)} coins` : !canSend ? `You need ${moreCoinsText(cost - balance - credit)}` : santa ? `Pick for ${formatCount(cost)} coins` : bdayOn && bdText !== 'today' ? `Set for ${bdText}` : `Send for ${formatCount(cost)} coins`} disabled={busy || !canSend} onClick={send} />
          </div>
        </div>
      </div>
      {wrapOpen && <WrapPickerSheet uid={uid} value={wrap} onClose={() => setWrapOpen(false)} onPick={(v) => { setWrap(v); setWrapSet(true); setWrapOpen(false); playUiSound('toggle'); }} />}
      {preview && <GiftOnThemPage to={to} kind={preview.kind} k={preview.k} onClose={() => setPreview(null)} />}
      {chipPick && <PickPeoplePage userId={uid} title="Chip in with friends" subtitle={`Who helps pay for ${first}'s gift`} multi max={20} blockedIds={new Set([to.id])} actionLabel="Next" zIndex={790} onClose={() => setChipPick(false)} onDone={(list) => { const ppl = (Array.isArray(list) ? list : [list]).filter((x) => x && x.id && x.id !== to.id && x.id !== uid); setChipPick(false); if (ppl.length) setChipPeople(ppl); }} />}
      {chipPeople && chipGift && <ChipStartSheet uid={uid} to={to} gift={chipGift} people={chipPeople} wrap={wrap} onClose={() => setChipPeople(null)} onDone={(row, ppl) => { setChipPeople(null); ppl.forEach((x) => sendPushNotification(x.id, 'ZChat', `${(me && me.name) || 'Someone'} started a group gift for ${first}`, `/?dm=${uid}`, me && me.avatar)); const nm = ppl.map((x) => String(x.name || x.username || '').split(' ')[0]).filter(Boolean); onSent(`Group gift started. ${listText(nm.slice(0, 2))}${nm.length > 2 ? ` and ${nm.length - 2} more` : ''} can add coins now`, Promise.resolve({ ok: true, chip: row })); }} />}
      {vOpen && vPlan && <VerifiedGiftSheet uid={uid} me={me} to={to} plan={vPlan} onClose={() => { setVOpen(false); if (to.__verified) onClose(); }} />}
      {askCancel && bdWaiting && <ConfirmDialog layer={800} danger title="Cancel the birthday gift?" body={Number(bdWaiting.held) > 0 ? `The ${formatCount(bdWaiting.held)} held coins come back to you now.` : 'Nothing was taken, so nothing changes in your wallet.'} confirmLabel="Cancel the gift" onCancel={() => setAskCancel(false)} onConfirm={cancelBday} />}
    </Portal>
  );
}

let giftCharmList = null;
function giftCharmKeys() {
  if (!giftCharmList) giftCharmList = Object.keys(CUSTOM_BADGES).filter((k) => shopPrice('charm', k)).sort((a, b) => (STORE_RARITY_ORDER[CUSTOM_BADGES[a].rarity] ?? 9) - (STORE_RARITY_ORDER[CUSTOM_BADGES[b].rarity] ?? 9));
  return giftCharmList;
}

async function buyDecorSet(key) {
  const { data, error } = await supabase.rpc('zchat_buy_set', { p_key: key });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) return { error: rpcFailText('Set buy', error, 'The Shop switches on once the latest ZChat setup is finished.') };
  if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
  return { ok: true, coins: row.coins };
}

async function claimFreeSet(key) {
  const { data, error } = await supabase.rpc('zchat_claim_free_set', { p_key: key });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) return { error: rpcFailText('Free set pick', error, 'Free sets switch on once the latest ZChat setup is finished.') };
  if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
  return { ok: true, left: Number(row.left) || 0, set: { freeSets: Math.max(0, Number(row.left) || 0) } };
}
function LiveWallStage({ k, me, dark }) {
  const spec = LIVE_WALL_BY[k];
  if (!spec) return null;
  const bub = (mine, text) => (
    <div style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '76%', padding: '8px 12px', borderRadius: 18, [mine ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 6, background: mine ? '#7C5CFC' : (dark ? 'rgba(30,30,36,0.9)' : 'rgba(255,255,255,0.95)'), color: mine ? '#FFFFFF' : (dark ? '#F4F4F6' : '#111113'), fontSize: 14, lineHeight: 1.35 }}>{text}</div>
  );
  return (
    <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', height: 360, background: liveWallBg(spec, dark), boxShadow: `inset 0 0 0 1px ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
      <LiveWallCanvas k={k} dark={dark} />
      <div style={{ position: 'absolute', inset: 0, background: liveWallVeil(dark) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: dark ? 'rgba(16,16,21,0.72)' : 'rgba(255,255,255,0.78)' }}>
        <Avatar emoji={me && me.avatar} name={(me && me.name) || 'You'} size={28} />
        <div style={{ fontSize: 14, fontWeight: 700, color: dark ? '#F4F4F6' : '#111113' }}>Sam</div>
      </div>
      <div style={{ position: 'absolute', left: 12, right: 12, bottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bub(false, 'Are we still on for tonight?')}
        {bub(true, 'Yes, see you at 8')}
        {bub(false, 'Perfect')}
      </div>
    </div>
  );
}
function decorColourways(key) {
  const fam = decorFamily(key);
  return fam.length > 1 ? fam.map((k) => DECOR_BY_KEY[k]).filter(Boolean) : [];
}
function decorAsk(set, mode, own) {
  const has = { frame: own.frame, nameplate: own.plate, effect: own.effect };
  const missing = mode === 'set' ? DECOR_PIECES.filter((k) => !has[k]) : has[mode] ? [] : [mode];
  const what = mode === 'set' ? (missing.length === 1 ? missing[0] : missing.length === 3 ? 'set' : `${missing[0]} and ${missing[1]}`) : mode;
  return { missing, what, price: missing.length * decorPartPrice(set.key) };
}
function loadPopular(force) {
  shopWarm();
  if (!force && shopMem.popular && Date.now() - shopMem.popularAt < 600000) return Promise.resolve(shopMem.popular);
  if (shopMem.popularJob) return shopMem.popularJob;
  shopMem.popularJob = supabase.rpc('zchat_shop_popular', { p_limit: 16 })
    .then(({ data, error }) => {
      shopMem.popularErr = !!error && !(shopMem.popular && shopMem.popular.length);
      if (error && shopMem.popular) return shopMem.popular;
      const rows = !error && Array.isArray(data) ? data : [];
      shopMem.popular = rows
        .map((r) => ({ kind: r.kind, key: r.item_key, owners: Number(r.owners) || 0 }))
        .filter((r) => shopKnown(r.kind, r.key));
      shopMem.popularAt = Date.now();
      shopSave();
      return shopMem.popular;
    }, () => { shopMem.popularErr = !(shopMem.popular && shopMem.popular.length); if (!shopMem.popular) shopMem.popular = []; shopMem.popularAt = Date.now(); return shopMem.popular; })
    .then((v) => { shopMem.popularJob = null; shopPing(); return v; });
  return shopMem.popularJob;
}
function usePopular() {
  useShopTick();
  shopWarm();
  useEffect(() => { loadPopular(); }, []);
  return shopMem.popular || [];
}
const editionLeftMem = new Map();
const editionLeftSubs = new Set();
function useEditionLeft(kind, key, on = true) {
  const [, setTick] = useState(0);
  const id = `${kind}:${key}`;
  useEffect(() => {
    if (!on || !kind || !key) return undefined;
    const fn = () => setTick((n) => n + 1);
    editionLeftSubs.add(fn);
    const had = editionLeftMem.get(id);
    if (had === undefined || (had && had.at && Date.now() - had.at > 60000)) {
      editionLeftMem.set(id, { v: had ? had.v : null, at: 0 });
      supabase.rpc('zchat_edition_left', { p_kind: kind, p_key: key }).then(({ data, error }) => {
        const n = error ? null : Number(Array.isArray(data) ? data[0] : data);
        editionLeftMem.set(id, { v: Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null, at: Date.now() });
        editionLeftSubs.forEach((f) => { try { f(); } catch {} });
      }, () => { editionLeftMem.set(id, { v: null, at: Date.now() }); });
    }
    return () => { editionLeftSubs.delete(fn); };
  }, [id, on]);
  const v = editionLeftMem.get(id);
  return on && v && typeof v.v === 'number' ? v.v : null;
}
function shopItemRarity(kind, k) {
  if (SI_KINDS.includes(kind)) return (siSpec(kind, k) || {}).rarity || 'rare';
  if (kind === 'wallpaper') return 'rare';
  if (CX_KINDS.includes(kind)) return (cxSpec(kind, k) || {}).rarity || 'epic';
  if (kind === 'set') return DECOR_BY_KEY[k] ? DECOR_BY_KEY[k].rarity : 'epic';
  if (kind === 'bubble') return 'rare';
  return CUSTOM_BADGES[k] ? CUSTOM_BADGES[k].rarity || 'epic' : 'epic';
}
function shopItemAbout(kind, k) {
  if (SI_KINDS.includes(kind)) return (siSpec(kind, k) || {}).about || '';
  if (kind === 'wallpaper') return LIVE_WALL_BY[k] ? `${LIVE_WALL_BY[k].about} Pick it for any chat from Theme. In a chat for both of you, your friend sees it too.` : '';
  if (kind === 'set') return DECOR_BY_KEY[k] ? DECOR_BY_KEY[k].about : '';
  if (CX_KINDS.includes(kind)) return (cxSpec(kind, k) || {}).about || '';
  if (kind === 'bubble') return 'Your bubble shows on every message you send. Everyone sees it.';
  return 'A charm sits next to your name everywhere in ZChat.';
}
function shopOwnersSeed(rows) {
  (rows || []).forEach((r) => { if (r && r.kind && r.key && Number.isFinite(Number(r.owners))) shopOwnersMem.set(`${r.kind}:${r.key}`, Number(r.owners)); });
}
const CX_NEW = [['namestyle', 'aurora'], ['reaction', 'rocket'], ['namestyle', 'lava'], ['reaction', 'trophy'], ['namestyle', 'rosegold'], ['reaction', 'diamond'], ['namestyle', 'midnight'], ['reaction', 'spotlight'], ['namestyle', 'storm'], ['reaction', 'drum_roll'], ['namestyle', 'jade'], ['reaction', 'mic_drop'], ['namestyle', 'glitch'], ['reaction', 'kiss'], ['namestyle', 'ocean'], ['reaction', 'cake'], ['namestyle', 'candy'], ['reaction', 'snowball'], ['namestyle', 'paper']];
const SHOP_CATS = [['foryou', 'For you'], ['set', 'Sets'], ['frame', 'Frames'], ['nameplate', 'Nameplates'], ['effect', 'Effects'], ['bubble', 'Chat bubbles'], ['namestyle', 'Name styles'], ['theme', 'Themes'], ['reaction', 'Reactions'], ['charm', 'Charms'], ['stickerpack', 'Stickers'], ['soundpack', 'Sounds'], ['typing', 'Typing'], ['wallpaper', 'Wallpapers']];
const SHOP_VIEWS = { new: 'New', popular: 'Popular', wishlist: 'Your wishlist', finish: 'Finish your sets' };
const SHOP_PIECES = ['frame', 'nameplate', 'effect'];
const SHOP_CX = ['namestyle', 'theme', 'reaction'];
const SHOP_INK ={ mythic: ['#FF6B86', '#C81E45'], legendary: ['#F5B829', '#9A6300'], epic: ['#C59BFF', '#8136D8'], rare: ['#6FB0FF', '#1D66D6'] };
const SHOP_WHERE = { set: 'Your profile, chats and Vibes', frame: 'Around your photo everywhere', nameplate: 'Behind your name on your profile', effect: 'Over your profile when someone opens it', bubble: 'Every message you send', charm: 'Next to your name everywhere', namestyle: 'Your name on your profile, in chats and on Vibes', theme: 'Behind your profile for everyone who visits', reaction: 'Over any message you react to', wallpaper: 'Behind any chat you pick it for', stickerpack: 'Your sticker picker in every chat', soundpack: 'Message tones and ringtones', typing: 'Your typing bubble in chats' };
const SHOP_SUBS = { set: 'Frame, nameplate and profile effect', frame: 'Around your photo everywhere', nameplate: 'Behind your name on your profile', effect: 'Plays when someone opens your profile', bubble: 'Shows on every message you send', namestyle: 'Your name, drawn your way', theme: 'A moving scene behind your profile', reaction: 'Big reactions that play over the chat', charm: 'Sits next to your name everywhere', stickerpack: 'Animated stickers, yours to keep', soundpack: 'Message tones and ringtones', typing: 'What friends see while you type', wallpaper: 'Moving backgrounds for your chats' };
const SHOP_BUY_REASONS = ['shop', 'deal', 'drop', 'gift_item', 'refund'];

function shopPal(theme) {
  return { dark: !!theme.dark, bg: theme.bgGradient, stage: theme.soft, stage2: theme.soft2, field: theme.inputBg, line: theme.hair, border: theme.border, ink: theme.ink, ink2: theme.muted, ink3: theme.muted2, link: kitOnInk(theme), accent: theme.coral, accentSoft: theme.accentSoft, sheet: theme.panelBg, danger: theme.danger };
}
function shopKindLabel(kind) {
  return { set: 'Set', frame: 'Frame', nameplate: 'Nameplate', effect: 'Profile effect', bubble: 'Chat bubble', charm: 'Charm', namestyle: 'Name style', theme: 'Profile theme', reaction: 'Super reaction', wallpaper: 'Live wallpaper', stickerpack: 'Sticker pack', soundpack: 'Sound pack', typing: 'Typing style', drop: 'Limited drop' }[kind] || 'Item';
}
function shopNameOf(kind, key) {
  if (SHOP_PIECES.includes(kind)) return shopItemName('set', key);
  if (kind === 'namestyle' && key === 'own') return 'Your own style';
  return shopItemName(kind, key);
}
function shopRarityOf(kind, key) { return shopItemRarity(SHOP_PIECES.includes(kind) ? 'set' : kind, key); }
function shopRarityInk(r, dark) { const v = SHOP_INK[r] || SHOP_INK.epic; return dark ? v[0] : v[1]; }
function shopRarityWord(r) { return (RARITY_STYLE[r] || RARITY_STYLE.epic).label; }
const shopKeyMem = new Map();
function shopKeys(kind, cxOn) {
  const id = `${kind}:${cxOn ? 1 : 0}`;
  if (shopKeyMem.has(id)) return shopKeyMem.get(id);
  const rank = (k2) => (a, b) => (STORE_RARITY_ORDER[(cxSpec(k2, b) || {}).rarity] ?? 9) - (STORE_RARITY_ORDER[(cxSpec(k2, a) || {}).rarity] ?? 9) || ((cxSpec(k2, a) || {}).price || 0) - ((cxSpec(k2, b) || {}).price || 0);
  let out = [];
  if (kind === 'set' || SHOP_PIECES.includes(kind)) out = [...DECOR_SETS, ...DECOR_SI].filter((s) => !s.drop).map((s) => s.key);
  else if (kind === 'bubble') out = CHAR_BUBBLE_KEYS.slice();
  else if (kind === 'charm') out = giftCharmKeys().slice();
  else if (kind === 'namestyle') out = cxOn ? ['own', ...NS_KEYS.slice().sort(rank('namestyle'))] : [];
  else if (kind === 'theme') out = cxOn ? THEME_KEYS.slice().sort(rank('theme')) : [];
  else if (kind === 'reaction') out = cxOn ? SUPER_KEYS.filter((k) => !SUPER_REACTS[k].free).sort(rank('reaction')) : [];
  else if (kind === 'wallpaper') out = LIVE_WALL_PAID.slice();
  else if (kind === 'stickerpack') out = SI_STICKER_PACKS.map((p) => p.key);
  else if (kind === 'soundpack') out = SI_SOUND_PACKS.map((p) => p.key);
  else if (kind === 'typing') out = SI_TYPING.map((p) => p.key);
  shopKeyMem.set(id, out);
  return out;
}
function shopCtx(me, rewards, bubble, typing) {
  const active = (rewards || []).filter(rewardActive);
  const decor = new Map();
  return {
    me, rewards, bubble, typing,
    keep: (kind, k) => active.some((r) => r.kind === kind && r.reward_key === k && !r.expires_at),
    dec: (k) => { if (!decor.has(k)) decor.set(k, decorOwned(rewards, k)); return decor.get(k); },
  };
}
function shopState(c, kind, k) {
  const me = c.me || {};
  if (kind === 'set') { const o = c.dec(k); return { owned: o.full, some: o.any && !o.full ? o.count : 0, equipped: o.frame && o.plate && me.avatar_frame === k && me.nameplate === k }; }
  if (kind === 'frame') { const o = c.dec(k); return { owned: o.frame, some: 0, equipped: o.frame && me.avatar_frame === k }; }
  if (kind === 'nameplate') { const o = c.dec(k); return { owned: o.plate, some: 0, equipped: o.plate && me.nameplate === k }; }
  if (kind === 'effect') { const o = c.dec(k); return { owned: o.effect, some: 0, equipped: o.effect && o.frame && o.plate && me.avatar_frame === k && me.nameplate === k }; }
  if (kind === 'bubble') { const owned = c.keep('bubble', k); return { owned, some: 0, equipped: owned && c.bubble === k }; }
  if (kind === 'charm') { const owned = c.keep('charm', k); return { owned, some: 0, equipped: owned && me.custom_badge === k }; }
  if (kind === 'namestyle') { const owned = cxOwns(c.rewards, 'namestyle', k, true); return { owned, some: 0, equipped: owned && (k === 'own' ? !!nsOwn(me.name_style) : me.name_style === k) }; }
  if (kind === 'theme') { const owned = cxOwns(c.rewards, 'theme', k, true); return { owned, some: 0, equipped: owned && me.profile_theme === k }; }
  if (kind === 'reaction') return { owned: cxOwns(c.rewards, 'reaction', k, true), some: 0, equipped: false };
  if (kind === 'wallpaper') return { owned: c.keep('wallpaper', k), some: 0, equipped: false };
  if (kind === 'typing') { const owned = siOwns(c.rewards, 'typing', k); return { owned, some: 0, equipped: owned && c.typing === k }; }
  if (SI_KINDS.includes(kind)) return { owned: siOwns(c.rewards, kind, k), some: 0, equipped: false };
  return { owned: false, some: 0, equipped: false };
}
function shopBase(c, kind, k) {
  if (kind === 'set') return (3 - c.dec(k).count) * decorPartPrice(k);
  if (SHOP_PIECES.includes(kind)) return decorPartPrice(k);
  if (kind === 'bubble') return BUBBLE_PRICE;
  return shopPrice(kind, k) || 0;
}
function shopDealFor(deal, c, kind, k) {
  if (!deal || deal.kind !== kind || deal.key !== k) return null;
  if (kind !== 'set') return deal.price;
  const o = c.dec(k);
  return o.any ? Math.max(1, Math.ceil((deal.price * (3 - o.count)) / 3)) : deal.price;
}
let shopCssOn2 = false;
function shopCss2() {
  if (shopCssOn2 || typeof document === 'undefined') return;
  shopCssOn2 = true;
  try {
    const el = document.createElement('style');
    el.setAttribute('data-zshop2', '1');
    el.textContent = '.zshop-row::-webkit-scrollbar, .zshop-chips::-webkit-scrollbar { display: none; }\n.zshop-input::placeholder { color: inherit; opacity: 0.6; }\n@media (min-width: 1180px) and (min-height: 480px) { .zchat-shop-wide.zchat-wide-page { left: calc(50% - 540px) !important; right: calc(50% - 540px) !important; } }';
    document.head.appendChild(el);
  } catch {}
}
function ShopCoins({ price, was, size = 14, pal, weight = 700, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.max(3, Math.round(size * 0.28)), fontSize: size, fontWeight: weight, color: color || pal.ink, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1 }}>
      <CoinIcon size={Math.round(size * 1.1)} />{formatCount(price)}
      {was ? <span style={{ fontSize: Math.round(size * 0.86), fontWeight: 500, color: pal.ink3, textDecoration: 'line-through', marginLeft: 2 }}>{formatCount(was)}</span> : null}
    </span>
  );
}
function ShopPill({ pal, tone = 'plain', children, style }) {
  const bg = tone === 'accent' ? pal.accent : tone === 'soft' ? pal.accentSoft : tone === 'page' ? pal.bg : tone === 'ink' ? pal.ink : pal.stage;
  const fg = tone === 'accent' ? '#FFFFFF' : tone === 'soft' ? pal.link : tone === 'ink' ? pal.bg : pal.ink;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 11, background: bg, color: fg, fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1, ...(style || {}) }}>{children}</span>;
}
function ShopStatus({ pal, owned, equipped, size = 'small' }) {
  if (equipped) return <ShopPill pal={pal} tone="soft" style={size === 'big' ? { height: 26, padding: '0 10px', fontSize: 13 } : null}><span style={{ width: 6, height: 6, borderRadius: 3, background: pal.link }} />Equipped</ShopPill>;
  if (owned) return <ShopPill pal={pal} style={size === 'big' ? { height: 26, padding: '0 10px', fontSize: 13 } : null}><Check size={size === 'big' ? 14 : 12} strokeWidth={3} />Owned</ShopPill>;
  return null;
}
function ShopWave({ k, w, h, color }) {
  const p = siSpec('soundpack', k);
  const peaks = (p && p.list[0] && p.list[0].peaks) || [0.3, 0.6, 0.9, 0.7, 0.5, 0.8, 0.6, 0.4, 0.3, 0.5, 0.35, 0.2];
  const bar = Math.max(3, Math.floor((w - (peaks.length - 1) * 3) / peaks.length));
  return (
    <div aria-hidden="true" style={{ width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      {peaks.map((v, i) => <span key={i} style={{ width: bar, height: Math.max(4, Math.round(h * v)), borderRadius: bar, background: color || (p ? p.accent : '#7C5CFC'), display: 'block' }} />)}
    </div>
  );
}
function ShopRxArt({ k, size }) {
  const spec = SUPER_REACTS[k];
  if (!spec) return null;
  return (
    <span aria-hidden="true" style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0 }}>{superAccent(k, spec.accent)}</svg>
      <span style={{ position: 'relative', fontSize: Math.round(size * 0.56), lineHeight: 1 }}>{spec.base}</span>
    </span>
  );
}
function ShopArt({ kind, k, me, size, pal, drop }) {
  const s = size;
  const dark = pal.dark;
  const name = (me && (me.name || me.username)) || 'You';
  const first = String(name).split(' ')[0];
  if (s < 90) {
    const sk = kind === 'drop' ? (drop && drop.kind === 'set' ? drop.item_key : null) : ['set', 'frame', 'effect'].includes(kind) ? k : null;
    if (sk && DECOR_BY_KEY[sk]) return <DecorFrameBadge setKey={sk} size={Math.round(s * 0.9)} photo={me.avatar} name={name} lazy />;
    if (kind === 'nameplate') return <DecorStill setKey={k} part="plate" width={Math.round(s * 0.96)} />;
    if (kind === 'bubble' || (kind === 'drop' && drop)) return <ShopItemArt kind="bubble" k={kind === 'drop' ? drop.item_key : k} me={me} size={Math.round(s * 0.92)} />;
    if (kind === 'charm') return <CharmPreview charm={k} size={Math.round(s * 0.6)} />;
    if (kind === 'namestyle') return <div style={{ fontSize: Math.round(s * 0.42), fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: pal.ink, ...NS_ROOM }}><StyledName name="Aa" k={k === 'own' ? nsOwnSaved() || NS_OWN_SAMPLE : k} dark={dark} /></div>;
    if (kind === 'typing') return <TypingStyleBubble k={k} who={me} dark={dark} bg={pal.bg} scale={0.62} />;
  }
  if (kind === 'drop') {
    if (drop && drop.kind === 'set' && DECOR_BY_KEY[drop.item_key]) return <DecorHero frameKey={drop.item_key} plateKey={drop.item_key} width={Math.round(s * 0.94)} photo={me.avatar} name={name} lazy compact gapColor={pal.stage} />;
    return drop ? <ShopArt kind="bubble" k={drop.item_key} me={me} size={s} pal={pal} /> : null;
  }
  if (kind === 'set') return <DecorHero frameKey={k} plateKey={k} width={Math.round(s * 0.94)} photo={me.avatar} name={name} lazy compact gapColor={pal.stage} />;
  if (kind === 'frame') return <DecorFrameBadge setKey={k} size={Math.round(s * 0.86)} photo={me.avatar} name={name} lazy />;
  if (kind === 'nameplate') return <DecorHero frameKey={null} plateKey={k} width={Math.round(s * 0.98)} photo={me.avatar} name={name} lazy compact gapColor={pal.stage} />;
  if (kind === 'effect') {
    return (
      <div style={{ position: 'relative', width: s, height: s, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <DecorFrameBadge setKey={k} size={Math.round(s * 0.8)} photo={me.avatar} name={name} lazy />
        <span style={{ position: 'absolute', right: 8, bottom: 8, display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 8px', borderRadius: 11, background: pal.bg, color: pal.ink, fontSize: 11.5, fontWeight: 700 }}><Play size={10} fill={pal.ink} strokeWidth={0} />Effect</span>
      </div>
    );
  }
  if (kind === 'bubble') return <div style={{ width: '100%', padding: '0 12px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}><CharBubbleSample k={k} text="Hi there" cw={Math.round(s * 0.27)} fontSize={Math.max(12, Math.round(s * 0.09))} /></div>;
  if (kind === 'charm') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(s * 0.07) }}>
        <CharmPreview charm={k} size={Math.round(s * 0.4)} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, maxWidth: s - 24, height: 24, padding: '0 9px', borderRadius: 12, background: pal.bg, color: pal.ink, fontSize: 12, fontWeight: 700 }}>
          <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{first}</span><VerifiedBadge tier={null} custom={k} size={13} />
        </span>
      </div>
    );
  }
  if (kind === 'namestyle') return <div style={{ width: '100%', padding: '0 12px', boxSizing: 'border-box', display: 'flex', justifyContent: 'center' }}><NameStyleArt k={k} name={first} size={Math.round(s * 0.2)} width={s - 24} dark={dark} /></div>;
  if (kind === 'theme') return <ThemeArt k={k} me={me} w={Math.round(s * 0.6)} h={Math.round(s * 0.82)} dark={dark} live={false} radius={12} />;
  if (kind === 'reaction') return <ShopRxArt k={k} size={Math.round(s * 0.62)} />;
  if (kind === 'wallpaper') return <ShopItemArt kind="wallpaper" k={k} me={me} size={Math.round(s * 0.88)} dark={dark} />;
  if (kind === 'stickerpack') return <img src={`/ps-${k}-hi.webp`} alt="" loading="lazy" decoding="async" draggable={false} style={{ width: Math.round(s * 0.78), height: Math.round(s * 0.78), objectFit: 'contain', display: 'block' }} />;
  if (kind === 'soundpack') return <ShopWave k={k} w={Math.round(s * 0.62)} h={Math.round(s * 0.34)} />;
  if (kind === 'typing') return <TypingStyleBubble k={k} who={me} dark={dark} bg={pal.bg} scale={Math.max(0.8, Math.min(1.4, s / 110))} />;
  return null;
}
const ShopTile = React.memo(function ShopTile({ kind, k, me, pal, w, meta, title, owned, equipped, price, was, flag, flagTone, onOpen, rail = false, drop = null }) {
  const name = title || shopNameOf(kind, k);
  const state = equipped ? 'Equipped' : owned ? 'Owned' : `${formatCount(price || 0)} coins`;
  return (
    <div role="button" aria-label={`${name}${meta ? `, ${meta}` : ''}, ${state}`} onClick={() => onOpen(kind, k)} className="zchat-press"
      style={{ width: w, flex: rail ? `0 0 ${w}px` : '0 1 auto', minWidth: 0, cursor: 'pointer', scrollSnapAlign: rail ? 'start' : undefined }}>
      <div style={{ position: 'relative', width: w, height: w, borderRadius: 16, background: pal.stage, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', isolation: 'isolate' }}>
        <ShopArt kind={kind} k={k} me={me} size={w} pal={pal} drop={drop} />
        {flag && <div style={{ position: 'absolute', left: 8, top: 8, zIndex: 3 }}><ShopPill pal={pal} tone={flagTone || 'page'}>{flag}</ShopPill></div>}
      </div>
      <div style={{ marginTop: 8, fontSize: 14, fontWeight: 650, color: pal.ink, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
      {meta && <div style={{ marginTop: 2, fontSize: 12.5, color: pal.ink2, lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta}</div>}
      <div style={{ marginTop: 6, height: 22, display: 'flex', alignItems: 'center' }}>
        {owned || equipped ? <ShopStatus pal={pal} owned={owned} equipped={equipped} /> : <ShopCoins price={price || 0} was={was} pal={pal} />}
      </div>
    </div>
  );
});
function ShopSkel({ w, h, r = 16, pal, style }) {
  return <div aria-hidden="true" style={{ width: w, height: h, borderRadius: r, background: pal.stage, animation: reducedMotion() ? 'none' : 'zchat-skel 1.4s ease-in-out infinite', flexShrink: 0, ...(style || {}) }} />;
}
function ShopSkelTile({ w, pal, rail = true }) {
  return (
    <div aria-hidden="true" style={{ width: w, flex: rail ? `0 0 ${w}px` : '0 1 auto' }}>
      <ShopSkel w={w} h={w} pal={pal} />
      <ShopSkel w={Math.round(w * 0.7)} h={12} r={6} pal={pal} style={{ marginTop: 10 }} />
      <ShopSkel w={Math.round(w * 0.4)} h={12} r={6} pal={pal} style={{ marginTop: 8 }} />
    </div>
  );
}
function ShopLazy({ minH, children, fallback }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver((list) => { if (list.some((e) => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '700px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [on]);
  return <div ref={ref} style={on ? undefined : { minHeight: minH }}>{on ? children : fallback || null}</div>;
}
function ShopRail({ title, sub, onSeeAll, seeLabel, pal, children, wide, resetKey = '' }) {
  const rowRef = useRef(null);
  const touched = useRef(false);
  useLayoutEffect(() => { const el = rowRef.current; if (el && !touched.current && el.scrollLeft) el.scrollLeft = 0; }, [resetKey]);
  const touch = () => { touched.current = true; };
  return (
    <section style={{ marginTop: 30, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: pal.ink, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{title}</h2>
          {sub && <div style={{ fontSize: 13.5, color: pal.ink2, marginTop: 3, lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        {onSeeAll && <div role="button" aria-label={seeLabel || `See all ${String(title).toLowerCase()}`} onClick={onSeeAll} className="zchat-press" style={{ fontSize: 14, fontWeight: 650, color: pal.link, cursor: 'pointer', flexShrink: 0, padding: '4px 0 2px 8px' }}>See all</div>}
      </div>
      <div ref={rowRef} onPointerDown={touch} onTouchStart={touch} onWheel={touch} className="zshop-row" style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: wide ? 0 : '0 -16px', padding: wide ? '0 0 2px' : '0 16px 2px', scrollSnapType: 'x proximity', scrollPaddingLeft: wide ? 0 : 16, scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {children}
        {!wide && <div aria-hidden="true" style={{ flex: '0 0 4px' }} />}
      </div>
    </section>
  );
}
function ShopLeft({ to, pal, before = 'Ends in', color }) {
  const [, setTick] = useState(0);
  useEffect(() => { const iv = setInterval(() => setTick((n) => n + 1), 30000); return () => clearInterval(iv); }, []);
  const ms = Math.max(0, Date.parse(to) - Date.now());
  return <span style={{ color: color || pal.ink2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{`${before} ${shortLeft(ms)}`}</span>;
}
function ShopSearchGlyph({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="10.8" cy="10.8" r="6.6" stroke={color} strokeWidth="2" />
      <path d="M15.8 15.8 20.5 20.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ShopReceiptGlyph({ size = 21, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M6 3.5h12v17l-2.4-1.5-2.4 1.5-1.2-.75-1.2.75-2.4-1.5L6 20.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ShopHeartGlyph({ on, size = 20, pal }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M12 20.4c-.3 0-.6-.1-.8-.3C6.4 16.1 3 13.1 3 9.3 3 6.6 5.1 4.5 7.7 4.5c1.7 0 3.2.9 4.3 2.3 1.1-1.4 2.6-2.3 4.3-2.3 2.6 0 4.7 2.1 4.7 4.8 0 3.8-3.4 6.8-8.2 10.8-.2.2-.5.3-.8.3z" fill={on ? '#FF4D6A' : 'none'} stroke={on ? '#FF4D6A' : pal.ink} strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}
function ShopIconBtn({ label, onClick, pal, children, size = 40, soft = true, pressed }) {
  return <div role="button" aria-label={label} aria-pressed={pressed} onClick={onClick} className="zchat-press" style={{ width: size, height: size, borderRadius: size / 2, background: soft ? pal.stage : 'transparent', color: pal.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>{children}</div>;
}
function ShopCoinPill({ coins, onOpenWallet, pal }) {
  return (
    <div role="button" aria-label={`${formatCount(coins)} coins, open your coins`} onClick={onOpenWallet} className="zchat-press"
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 13px 0 9px', borderRadius: 18, background: pal.stage, color: pal.ink, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
      <CoinIcon size={20} />{formatCount(coins)}
    </div>
  );
}
function ShopToast({ text, pal, top = 'calc(64px + env(safe-area-inset-top))' }) {
  if (!text) return null;
  return <div className="zchat-pop" role="status" style={{ position: 'absolute', left: '50%', top, transform: 'translateX(-50%)', zIndex: 60, padding: '10px 16px', borderRadius: 14, background: pal.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, width: 'max-content', maxWidth: 'calc(100% - 32px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}>{text}</div>;
}
function ShopThemeStage({ me, k, dark, pal, onFull }) {
  const spec = PROFILE_THEMES[k];
  if (!spec) return null;
  const page = dark ? '#0C0C0E' : '#FFFFFF';
  const ink = dark ? '#F4F4F6' : '#111113';
  return (
    <div role="button" aria-label="See the full preview" onClick={() => { hapticTap(); if (onFull) onFull(k); }} style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', cursor: onFull ? 'pointer' : 'default', height: 330, background: page, isolation: 'isolate', boxShadow: `0 0 0 1px ${pal.line}` }}>
      <div style={{ position: 'absolute', inset: 0, background: themeFallback(k, dark), WebkitMaskImage: 'linear-gradient(180deg, #000 0%, #000 58%, transparent 100%)', maskImage: 'linear-gradient(180deg, #000 0%, #000 58%, transparent 100%)' }}>
        <ThemeCanvas k={k} dark={dark} still={reducedMotion()} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0 }}><ThemeMockProfile me={me} dark={dark} nsKey={cxNs(me)} /></div>
      {onFull && <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 16, background: dark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,19,0.08)', color: ink, fontSize: 13, fontWeight: 650 }}><Play size={12} fill={ink} strokeWidth={0} />Full preview</div>}
    </div>
  );
}
function ShopStickerGrid({ k, dark, pal }) {
  const pack = siSpec('stickerpack', k);
  if (!pack) return null;
  return (
    <div style={{ borderRadius: 18, background: dark ? '#0C0C0E' : '#FFFFFF', boxShadow: `0 0 0 1px ${pal.line}`, padding: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {pack.list.map(([id, label]) => (
          <div key={id} style={{ aspectRatio: '1 / 1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={`/ps-${k}-${id}.webp`} alt={label} loading="lazy" decoding="async" draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ width: '92%', height: '92%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
function ShopTypingStage({ k, me, dark, pal }) {
  const T = THEMES[dark ? 'dark' : 'light'];
  const first = String((me && me.name) || 'You').split(' ')[0];
  const t = fmtDate(new Date(), { hour: 'numeric', minute: '2-digit' });
  return (
    <div style={{ borderRadius: 18, background: dark ? '#0C0C0E' : '#FFFFFF', boxShadow: `0 0 0 1px ${pal.line}`, overflow: 'hidden', color: T.ink, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: `1px solid ${T.hair}` }}>
        <ArrowLeft size={18} color={T.ink} style={{ flexShrink: 0 }} />
        <Avatar emoji={me.avatar} name={me.name} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name || 'You'}</div>
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>typing</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 12px 16px', minHeight: 170, justifyContent: 'flex-end' }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '78%', background: T.bubbleMe, color: dark ? '#FFFFFF' : T.ink, borderRadius: 18, borderBottomRightRadius: 6, padding: '8px 12px 7px', fontSize: 14.5, lineHeight: 1.3 }}>{`Are you coming tonight, ${first}?`}<span style={{ fontSize: 10.5, marginLeft: 8, opacity: 0.72 }}>{t}</span></div>
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'flex-end', gap: 7 }}>
          <Avatar emoji={me.avatar} name={me.name} size={26} />
          <TypingStyleBubble k={k} who={me} dark={dark} />
        </div>
      </div>
    </div>
  );
}
function ShopSoundList({ k, owned, pal, onUsed }) {
  const p = siSpec('soundpack', k);
  const [playing, setPlaying] = useState(null);
  const [, setTick] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!p) return null;
  const tone = readTone();
  const ring = readRingtone();
  const play = (s) => {
    hapticTap();
    spPlay(`sp:${p.key}:${s.id}`);
    setPlaying(s.id);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPlaying(null), Math.round(s.at[1] * 1000) + 200);
  };
  const use = (s) => {
    const sk = `sp:${p.key}:${s.id}`;
    hapticTap();
    try { localStorage.setItem(s.kind === 'ring' ? 'zchat-ringtone' : 'zchat-tone', sk); } catch {}
    onUsed(s.kind === 'ring' ? `${s.label} is your ringtone` : `${s.label} is your message tone`);
    setTick((n) => n + 1);
  };
  return (
    <div style={{ borderRadius: 18, background: pal.bg, boxShadow: `0 0 0 1px ${pal.line}`, overflow: 'hidden' }}>
      {p.list.map((s, i) => {
        const sk = `sp:${p.key}:${s.id}`;
        const inUse = s.kind === 'ring' ? ring === sk : tone === sk;
        const on = playing === s.id;
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderTop: i ? `1px solid ${pal.line}` : 'none' }}>
            <div role="button" aria-label={`Play ${s.label}`} onClick={() => play(s)} className="zchat-press" style={{ width: 40, height: 40, borderRadius: 20, background: on ? pal.ink : pal.stage, color: on ? pal.bg : pal.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {on ? <Pause size={15} fill="currentColor" strokeWidth={0} /> : <Play size={15} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />}
            </div>
            <div role="button" aria-label={`Play ${s.label}`} onClick={() => play(s)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: pal.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
              <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 1 }}>{`${s.kind === 'ring' ? 'Ringtone' : 'Message tone'}, ${s.at[1].toFixed(1)} seconds`}</div>
            </div>
            {owned && (inUse
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 650, color: pal.link, flexShrink: 0 }}><Check size={15} strokeWidth={2.6} />In use</span>
              : <div role="button" aria-label={`Use ${s.label} as your ${s.kind === 'ring' ? 'ringtone' : 'message tone'}`} onClick={() => use(s)} className="zchat-press" style={{ height: 32, padding: '0 14px', borderRadius: 16, background: pal.stage, display: 'inline-flex', alignItems: 'center', fontSize: 13.5, fontWeight: 650, color: pal.ink, cursor: 'pointer', flexShrink: 0 }}>Use</div>)}
          </div>
        );
      })}
    </div>
  );
}
function ShopClock({ to, pal }) {
  useSecondTick(true);
  const s = Math.max(0, Math.floor((Date.parse(to) - Date.now()) / 1000));
  const cells = [[Math.floor(s / 86400), 'days'], [Math.floor((s % 86400) / 3600), 'hours'], [Math.floor((s % 3600) / 60), 'mins'], [s % 60, 'secs']];
  return (
    <div role="timer" aria-label={`${countWord(cells[0][0], 'day', 'days')} ${countWord(cells[1][0], 'hour', 'hours')} ${countWord(cells[2][0], 'minute', 'minutes')} left`} style={{ display: 'flex', gap: 8 }}>
      {cells.map(([v, l]) => (
        <div key={l} style={{ flex: 1, padding: '10px 0 8px', borderRadius: 14, background: pal.stage, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 750, lineHeight: 1, color: pal.ink, fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: pal.ink2, marginTop: 5 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
function ShopSeg({ items, value, onChange, pal, label }) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: 'flex', padding: 3, borderRadius: 17, background: pal.stage, flexShrink: 0 }}>
      {items.map(([v, l]) => <div key={l} role="radio" aria-checked={value === v} onClick={() => { if (value !== v) { hapticTap(); onChange(v); } }} style={{ height: 28, padding: '0 13px', borderRadius: 14, display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 650, cursor: 'pointer', background: value === v ? pal.bg : 'transparent', color: value === v ? pal.ink : pal.ink2, boxShadow: value === v ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', whiteSpace: 'nowrap' }}>{l}</div>)}
    </div>
  );
}
function ShopRadio({ on, pal }) {
  return <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 10, boxSizing: 'border-box', border: on ? `6px solid ${pal.accent}` : `2px solid ${pal.ink3}`, flexShrink: 0, transition: 'border 140ms ease' }} />;
}
function ShopPieces({ set, own, mode, onMode, pal, onPlay, eds }) {
  const rows = [['set', 'Full set', 'Frame, nameplate and profile effect'], ['frame', 'Frame', 'Around your photo'], ['nameplate', 'Nameplate', 'Behind your name'], ['effect', 'Profile effect', 'Plays on your profile']];
  const has = { set: own.full, frame: own.frame, nameplate: own.plate, effect: own.effect };
  const priceOf = (m) => (m === 'set' ? (3 - own.count) * decorPartPrice(set.key) : decorPartPrice(set.key));
  return (
    <div role="radiogroup" aria-label="Choose what to get" style={{ marginTop: 22, borderRadius: 16, boxShadow: `inset 0 0 0 1px ${pal.border}`, overflow: 'hidden' }}>
      {rows.map(([m, label, sub], i) => {
        const on = mode === m;
        const ed = m !== 'set' && eds ? eds[m] : null;
        return (
          <div key={m} role="radio" aria-checked={on} aria-label={`${label}, ${has[m] ? 'owned' : `${priceOf(m)} coins`}`} onClick={() => { if (!on) { hapticTap(); playUiSound('tap'); onMode(m); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 60, padding: '10px 14px', boxSizing: 'border-box', borderTop: i ? `1px solid ${pal.line}` : 'none', cursor: on ? 'default' : 'pointer', background: on ? pal.stage : 'transparent' }}>
            <ShopRadio on={on} pal={pal} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: pal.ink }}>{label}</div>
              <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ed ? `${sub}, yours is #${ed.toLocaleString()}` : sub}</div>
            </div>
            {m === 'effect' && set.fx && onPlay && <div role="button" aria-label="Play the profile effect" onClick={(e) => { e.stopPropagation(); hapticTap(); onPlay(); }} className="zchat-press" style={{ height: 30, padding: '0 11px 0 9px', borderRadius: 15, background: pal.bg, boxShadow: `inset 0 0 0 1px ${pal.border}`, color: pal.ink, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 650, cursor: 'pointer', flexShrink: 0 }}><Play size={11} fill="currentColor" strokeWidth={0} />Play</div>}
            {has[m] ? <ShopStatus pal={pal} owned /> : <ShopCoins price={priceOf(m)} pal={pal} />}
          </div>
        );
      })}
    </div>
  );
}
function ShopColours({ set, onPick, pal }) {
  const ways = decorColourways(set.key);
  if (ways.length < 2 || !onPick) return null;
  const dayWord = (DECOR_SI.find((v) => v.base === ways[0].key) || {}).day || 'Day';
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink }}>Colours</div>
      <div role="radiogroup" aria-label="Colours" style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
        {ways.map((w) => {
          const on = w.key === set.key;
          const label = w.base ? w.swatch : dayWord;
          return (
            <div key={w.key} role="radio" aria-checked={on} aria-label={`${label} colours`} onClick={() => { if (!on) { hapticTap(); playUiSound('tap'); onPick(w.key); } }} className="zchat-press"
              style={{ width: 92, borderRadius: 14, padding: '8px 6px', boxSizing: 'border-box', background: pal.stage, boxShadow: on ? `inset 0 0 0 2px ${pal.ink}` : 'none', cursor: on ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <DecorStill setKey={w.key} part="frame" width={60} />
              <span style={{ fontSize: 12.5, fontWeight: 650, color: on ? pal.ink : pal.ink2 }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function ShopPair({ set, me, rewards, wallet, pal, onPick, onWear, onRefresh, flash, onGift, onOpenWallet }) {
  const mate = DECOR_BY_KEY[set.pair];
  const own = decorOwned(rewards, set.key);
  const [picking, setPicking] = useState(false);
  const [ask, setAsk] = useState(null);
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  if (!mate) return null;
  const mineMissing = DECOR_PIECES.filter((k) => !(k === 'frame' ? own.frame : k === 'nameplate' ? own.plate : own.effect));
  const pickFriend = async (p) => {
    setPicking(false);
    if (!p) return;
    const { data } = await supabase.from('user_rewards').select('kind, reward_key, expires_at').eq('user_id', p.id).eq('reward_key', mate.key);
    const theirs = (data || []).filter((r) => !r.expires_at).map((r) => r.kind);
    const mateMissing = DECOR_PIECES.filter((k) => !theirs.includes(k));
    if (!mateMissing.length) { flash(`${String(p.name || 'They').split(' ')[0]} already has ${mate.name}`); return; }
    setAsk({ p, price: (mineMissing.length + mateMissing.length) * decorPartPrice() });
  };
  const run = async () => {
    const { p, price } = ask;
    setAsk(null);
    const first = String(p.name || 'your friend').split(' ')[0];
    if (!wallet || !wallet.ready) { flash('The Shop switches on once the latest ZChat setup is finished.'); return; }
    if (coins < price) { if (onOpenWallet) onOpenWallet(); return; }
    if (!(await spendGate(`Get ${set.name} and send ${mate.name} to ${first} for ${price} coins`, { coins: price }))) return;
    const job = moneyRun(me.id, { coins: price, grants: mineMissing.map((k) => [k, set.key]), run: async () => {
      const { data, error } = await supabase.rpc('zchat_buy_match_pair', { p_key: set.key, p_to: p.id, p_note: null });
      const row = Array.isArray(data) ? data[0] : data;
      if (error) return { error: rpcFailText('Matching set', error, 'Matching sets switch on once the latest ZChat setup is finished.') };
      if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
      return { ok: true, coins: row.coins };
    } });
    hapticTap();
    playUiSound('like');
    flash(`${set.name} is yours. ${mate.name} is on its way to ${first}.`);
    if (onWear) onWear({ avatar_frame: set.key, nameplate: set.key }, job);
    job.then((r) => {
      if (r.error) { flash(r.error); return; }
      sendPushNotification(p.id, 'ZChat', `${(me && me.name) || 'Someone'} sent you a gift`, '/?requests=1', me && me.avatar);
      if (onRefresh) onRefresh();
    });
  };
  return (
    <div style={{ marginTop: 24, borderRadius: 18, boxShadow: `inset 0 0 0 1px ${pal.border}`, padding: 14 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink }}>{`Made to match ${mate.name}`}</div>
      <div style={{ fontSize: 13, color: pal.ink2, lineHeight: 1.45, marginTop: 4 }}>{`Wear ${set.name} while a friend wears ${mate.name}. When you follow each other, both profiles say you are matching.`}</div>
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <div style={{ flex: 1, minWidth: 0, borderRadius: 14, background: pal.stage, padding: '10px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <DecorFrameBadge setKey={set.key} size={96} photo={me.avatar} name={me.name} />
          <span style={{ fontSize: 12.5, fontWeight: 650, color: pal.ink }}>You</span>
        </div>
        <div role="button" aria-label={`See ${mate.name}`} onClick={() => { if (onPick) { hapticTap(); playUiSound('tap'); onPick(mate.key); } }} className="zchat-press" style={{ flex: 1, minWidth: 0, borderRadius: 14, background: pal.stage, padding: '10px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: onPick ? 'pointer' : 'default' }}>
          <DecorFrameBadge setKey={mate.key} size={96} photo={null} name="Friend" />
          <span style={{ fontSize: 12.5, fontWeight: 650, color: pal.ink }}>A friend</span>
        </div>
      </div>
      {mineMissing.length > 0
        ? <button type="button" onClick={() => { hapticTap(); setPicking(true); }} aria-label={`Get both halves and send ${mate.name} to a friend`} className="zchat-press" style={shopBtn(pal, 'soft', 46)}><GiftBoxIcon size={18} />{`Get both, send ${mate.name}`}</button>
        : onGift ? <button type="button" onClick={() => { hapticTap(); onGift('set', mate.key); }} aria-label={`Send ${mate.name} to a friend`} className="zchat-press" style={shopBtn(pal, 'soft', 46)}><GiftBoxIcon size={18} />{`Send ${mate.name} to a friend`}</button> : null}
      {picking && <Portal><PickPeoplePage userId={me.id} title="Send the other half" subtitle="Pick a friend who follows you back" multi={false} zIndex={790} onClose={() => setPicking(false)} onDone={(list) => pickFriend(Array.isArray(list) ? list[0] : list)} /></Portal>}
      {ask && (
        <ConfirmDialog layer={800} danger={false} title="Get both halves?" confirmLabel={`Use ${formatCount(ask.price)} coins`}
          body={`${set.name} is yours and ${mate.name} goes to ${String(ask.p.name || 'your friend').split(' ')[0]} as a wrapped gift. It costs ${formatCount(ask.price)} coins and you have ${formatCount(coins)}.`}
          onCancel={() => setAsk(null)} onConfirm={run} />
      )}
    </div>
  );
}
function shopBtn(pal, tone = 'primary', h = 50) {
  const bg = tone === 'primary' ? pal.accent : tone === 'ink' ? pal.ink : pal.stage;
  const fg = tone === 'primary' ? '#FFFFFF' : tone === 'ink' ? pal.bg : pal.ink;
  return { height: h, borderRadius: 14, border: 'none', fontFamily: FONT, fontWeight: 700, fontSize: h >= 48 ? 16 : 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 20px', width: '100%', boxSizing: 'border-box', background: bg, color: fg, whiteSpace: 'nowrap' };
}
function ShopBuySheet({ pal, me, artKind, artKey, drop, name, kindWord, price, was, coins, free, stage, error, canEquip, doneText, coinsInstead, onConfirm, onClose, onCoins, onEquip }) {
  const busy = stage === 'busy';
  const close = () => { if (!busy) onClose(); };
  useBackClose(true, close);
  const drag = useSheetDrag(close);
  const short = !free && coins < price;
  const row = (label, value, strong) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 34 }}>
      <span style={{ fontSize: 14.5, color: strong ? pal.ink : pal.ink2, fontWeight: strong ? 650 : 500 }}>{label}</span>
      {value}
    </div>
  );
  const head = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 60, height: 60, borderRadius: 14, background: pal.stage, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ShopArt kind={artKind} k={artKey} me={me} size={60} pal={pal} drop={drop} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 750, color: pal.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 13, color: pal.ink2, marginTop: 2 }}>{kindWord}</div>
      </div>
    </div>
  );
  let body;
  if (stage === 'done') {
    body = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '6px 4px 0' }}>
        <div className="zchat-pop" style={{ width: 56, height: 56, borderRadius: 28, background: pal.accent, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={28} strokeWidth={3} /></div>
        <div style={{ fontSize: 20, fontWeight: 800, color: pal.ink, marginTop: 14, letterSpacing: '-0.01em' }}>{`${name} is yours`}</div>
        <div style={{ fontSize: 14, color: pal.ink2, lineHeight: 1.5, marginTop: 6, maxWidth: 320, textWrap: 'pretty' }}>{doneText}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 20 }}>
          {canEquip && <button type="button" onClick={onEquip} className="zchat-press" style={shopBtn(pal, 'primary')}>Equip now</button>}
          <button type="button" onClick={onClose} className="zchat-press" style={shopBtn(pal, canEquip ? 'soft' : 'primary')}>Done</button>
        </div>
      </div>
    );
  } else if (stage === 'error') {
    body = (
      <>
        {head}
        <div role="alert" style={{ marginTop: 16, padding: '12px 14px', borderRadius: 14, background: pal.stage }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink }}>That did not go through</div>
          <div style={{ fontSize: 13.5, color: pal.ink2, lineHeight: 1.45, marginTop: 3 }}>{`${error || 'Try again in a moment.'} Your coins are back.`}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
          <button type="button" onClick={() => onConfirm(!!free)} className="zchat-press" style={shopBtn(pal, 'primary')}>Try again</button>
          <button type="button" onClick={onClose} className="zchat-press" style={shopBtn(pal, 'soft')}>Cancel</button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        {head}
        <div style={{ marginTop: 14, padding: '8px 0', borderTop: `1px solid ${pal.line}`, borderBottom: `1px solid ${pal.line}` }}>
          {free ? (
            <>
              {row('Price', <span style={{ fontSize: 15, fontWeight: 700, color: pal.ink }}>Free</span>)}
              <div style={{ fontSize: 13, color: pal.ink2, lineHeight: 1.45, paddingBottom: 4 }}>{free}</div>
            </>
          ) : (
            <>
              {row('Price', <ShopCoins price={price} was={was} pal={pal} size={15} />)}
              {row('Your balance', <ShopCoins price={coins} pal={pal} size={15} weight={600} />)}
              {short
                ? row('You need', <ShopCoins price={price - coins} pal={pal} size={15} color={pal.danger} />, true)
                : row('After you buy', <ShopCoins price={coins - price} pal={pal} size={15} />, true)}
            </>
          )}
        </div>
        <div style={{ fontSize: 12.5, color: pal.ink2, lineHeight: 1.45, marginTop: 10 }}>{short ? 'Get more coins, then come back to finish.' : 'It is yours to keep. You can wear it, switch it or send one as a gift.'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {short
            ? <button type="button" onClick={onCoins} className="zchat-press" style={shopBtn(pal, 'primary')}><CoinIcon size={19} />Get coins</button>
            : <button type="button" disabled={busy} onClick={() => onConfirm(!!free)} aria-busy={busy} className="zchat-press" style={{ ...shopBtn(pal, 'primary'), opacity: busy ? 0.7 : 1, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'Buying' : free ? 'Get it free' : `Buy for ${formatCount(price)} coins`}</button>}
          {free && coinsInstead && !busy && <button type="button" onClick={() => onConfirm(false)} className="zchat-press" style={shopBtn(pal, 'soft')}>{`Use ${formatCount(coinsInstead)} coins instead`}</button>}
          <button type="button" disabled={busy} onClick={close} className="zchat-press" style={{ ...shopBtn(pal, 'soft'), background: 'transparent', color: pal.ink2, opacity: busy ? 0.5 : 1 }}>Cancel</button>
        </div>
      </>
    );
  }
  return (
    <div onClick={close} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
      <div role="dialog" aria-modal="true" aria-label={stage === 'done' ? `${name} is yours` : `Buy ${name}`} onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps}
        style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, boxSizing: 'border-box', background: pal.sheet, color: pal.ink, borderRadius: '24px 24px 0 0', padding: '8px 18px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 14px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: pal.border }} /></div>
        {body}
      </div>
    </div>
  );
}
function shopDoneText(kind, mode) {
  if (kind === 'reaction') return 'Hold any message and pick it from the top row. It plays for both of you.';
  if (kind === 'stickerpack') return 'Open stickers in any chat. It is in your sticker picker now.';
  if (kind === 'soundpack') return 'Pick a tone below, or set them later in Settings, Notifications.';
  if (kind === 'wallpaper') return 'Open any chat, then Theme, then Live, and pick it there.';
  if (kind === 'set' && mode === 'effect') return 'It plays over your profile while you wear the full set.';
  return 'Equip it now, or switch it any time from your Collection.';
}
function ShopProduct({ me, item, items = null, onPick, rewards, wallet, onClose, onOpenWallet, onGift, onEquip, onWear, onRefresh, onPreviewTheme, onOpenItem, startMode = null, zIndex = 645 }) {
  useBackClose(true, onClose);
  shopCss2();
  const { theme, bubbleStyle, setBubbleStyle } = useTheme();
  const pal = shopPal(theme);
  const raw = item.kind;
  const drop = raw === 'drop' ? item.drop || null : null;
  const kind = raw === 'drop' ? 'drop' : SHOP_PIECES.includes(raw) ? 'set' : raw;
  const key = raw === 'drop' ? (drop ? drop.item_key : null) : item.key;
  const dropSet = drop && drop.kind === 'set' ? DECOR_BY_KEY[drop.item_key] || null : null;
  const [mode, setMode] = useState(() => (SHOP_PIECES.includes(raw) ? raw : ['set', ...SHOP_PIECES].includes(startMode) ? startMode : 'set'));
  const [dark, setDark] = useState(!!theme.dark);
  const [view, setView] = useState('profile');
  const [sheet, setSheet] = useState(null);
  const [fxRun, setFxRun] = useState(0);
  const [typingMine, setTypingMine] = useState(() => typingStyleMine(me.id));
  const [reminded, setReminded] = useState(() => !!(drop && dropsMem.mine.has(drop.id)));
  const [remBusy, setRemBusy] = useState(false);
  const [note, setNote] = useState('');
  const noteTimer = useRef(0);
  const swipeRef = useRef(null);
  const boxRef = useRef(null);
  const bw = useWidthOf(boxRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 600));
  const flash = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2600); };
  useMoneyToast(flash);
  useEffect(() => () => clearTimeout(noteTimer.current), []);
  useEffect(() => { if (SHOP_PIECES.includes(raw)) setMode(raw); }, [raw, key]);
  useEffect(() => { setSheet(null); setFxRun(0); setView('profile'); try { if (boxRef.current) boxRef.current.scrollTop = 0; } catch {} }, [raw, key]);
  const wish = useWishlist(me.id);
  const deal = useDeal();
  const set = kind === 'set' ? DECOR_BY_KEY[key] || null : null;
  const isFreeRx = kind === 'reaction' && !!(SUPER_REACTS[key] && SUPER_REACTS[key].free);
  const owners = useShopOwners(kind === 'drop' ? (dropSet ? 'set' : 'bubble') : kind, key);
  const edLeft = useEditionLeft(kind === 'set' ? 'set' : kind, key, kind !== 'drop' && !isFreeRx && !SI_KINDS.includes(kind) && !(set && set.drop));
  const order = items && items.length > 1 ? items : null;
  const idx = order ? order.findIndex((it) => it.kind === raw && it.key === item.key) : -1;
  useEffect(() => {
    if (!order || idx < 0) return undefined;
    const t = setTimeout(() => {
      const n = order.length;
      const near = [order[(idx + 1) % n], order[(idx + n - 1) % n]].filter((it) => it && (it.kind === 'set' || SHOP_PIECES.includes(it.kind)));
      if (near.length) saveDecorSets(near.map((it) => [it.key, it.key]), 1);
    }, 700);
    return () => clearTimeout(t);
  }, [idx]);
  const spec = kind === 'drop' ? drop : set || (kind === 'bubble' ? CHAR_BUBBLES[key] : kind === 'charm' ? CUSTOM_BADGES[key] : kind === 'wallpaper' ? LIVE_WALL_BY[key] : CX_KINDS.includes(kind) ? cxSpec(kind, key) : SI_KINDS.includes(kind) ? siSpec(kind, key) : null);
  if (!spec) return null;
  const c = shopCtx(me, rewards, bubbleStyle, typingMine);
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const own = set ? c.dec(key) : dropSet ? c.dec(dropSet.key) : null;
  const name = kind === 'drop' ? drop.title : shopNameOf(kind, key);
  const kindWord = kind === 'drop' ? (dropSet ? 'Limited set' : 'Limited bubble') : kind === 'set' ? (mode === 'set' ? 'Set' : shopKindLabel(mode)) : shopKindLabel(kind);
  const rarity = kind === 'drop' ? (dropSet ? dropSet.rarity : 'rare') : shopRarityOf(kind, key);
  const phase = drop ? dropPhase(drop) : null;
  let has = false;
  let forever = false;
  let equipped = false;
  let canWear = false;
  if (kind === 'set') {
    has = mode === 'frame' ? own.frame : mode === 'nameplate' ? own.plate : mode === 'effect' ? own.effect : own.full;
    forever = has;
    equipped = mode === 'frame' ? own.frame && me.avatar_frame === key : mode === 'nameplate' ? own.plate && me.nameplate === key : own.frame && own.plate && me.avatar_frame === key && me.nameplate === key;
    canWear = !!onWear && (mode === 'frame' ? own.frame : mode === 'nameplate' ? own.plate : own.frame && own.plate && (mode === 'set' || own.effect));
  } else if (kind === 'drop') {
    has = dropOwned(drop, rewards);
    forever = has;
    equipped = dropSet ? me.avatar_frame === dropSet.key && me.nameplate === dropSet.key : bubbleStyle === drop.item_key;
    canWear = has && (dropSet ? !!onWear : true);
  } else if (CX_KINDS.includes(kind)) {
    has = cxOwns(rewards, kind, key, false);
    forever = cxOwns(rewards, kind, key, true);
    equipped = kind === 'namestyle' ? me.name_style === key : kind === 'theme' ? me.profile_theme === key : false;
    canWear = has && kind !== 'reaction' && !!onEquip;
  } else if (SI_KINDS.includes(kind)) {
    has = siOwns(rewards, kind, key);
    forever = has;
    equipped = kind === 'typing' && typingMine === key;
    canWear = has && kind === 'typing';
  } else {
    has = c.keep(kind, key);
    forever = has;
    equipped = kind === 'bubble' ? bubbleStyle === key : kind === 'charm' ? me.custom_badge === key : false;
    canWear = has && (kind === 'bubble' || (kind === 'charm' && !!onEquip));
  }
  const rentRow = has && !forever ? (rewards || []).find((r) => r.kind === kind && r.reward_key === key && rewardActive(r)) : null;
  const rentLeft = rentRow ? daysLeft(rentRow) : null;
  const dealOn = kind !== 'drop' && !!(deal && deal.kind === kind && deal.key === key) && !forever && (kind !== 'set' || mode === 'set');
  let full = 0;
  let price = 0;
  let missing = [];
  let what = '';
  if (kind === 'set') {
    const a = decorAsk(set, mode, own);
    missing = a.missing;
    what = a.what;
    full = a.price;
    price = dealOn ? Math.max(1, Math.ceil((deal.price * missing.length) / 3)) : full;
  } else if (kind === 'drop') {
    full = drop.price;
    price = dropSet && own.any && !has ? Math.max(1, Math.ceil((drop.price * (3 - own.count)) / 3)) : drop.price;
  } else {
    full = kind === 'bubble' ? BUBBLE_PRICE : shopPrice(kind, key) || 0;
    price = dealOn ? deal.price : full;
  }
  const was = dealOn && full > price ? full : null;
  const freeBubbles = kind === 'bubble' && !forever && wallet && wallet.ready ? wallet.freeBubbles || 0 : 0;
  const freeSets = kind === 'set' && mode === 'set' && set.rarity === 'epic' && !set.drop && missing.length > 0 && wallet && wallet.ready ? wallet.freeSets || 0 : 0;
  const buyable = kind === 'drop' ? phase === 'live' && !has : kind === 'set' ? missing.length > 0 && !set.drop : !forever && !isFreeRx && price > 0;
  const wishKind = kind === 'set' ? 'set' : kind;
  const canWish = !forever && !isFreeRx && (kind === 'set' ? !set.drop : ['bubble', 'charm', 'namestyle', 'theme', 'reaction'].includes(kind));
  const wished = canWish && wish.has(wishKind, key);
  const canGift = !!onGift && kind !== 'drop' && !isFreeRx && !(set && set.drop);
  const artKind = kind === 'set' ? mode : kind;
  const fullTitle = kind === 'set' ? `${set.name} ${mode === 'set' ? (missing.length === 3 || missing.length === 0 ? 'set' : what) : mode === 'effect' ? 'profile effect' : mode}` : kind === 'drop' ? drop.title : `${name} ${shopKindWord(kind)}`;
  const go = (d) => {
    if (!order || !onPick) return;
    const n = order[(idx + d + order.length) % order.length];
    hapticTap();
    onPick(n);
  };
  const onDown = (e) => { swipeRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; };
  const onUp = (e) => {
    const d = swipeRef.current;
    swipeRef.current = null;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(e.clientY - d.y) * 1.4) go(dx < 0 ? 1 : -1);
  };
  const plan = (useFree) => {
    if (kind === 'drop') {
      const kinds = dropSet ? DECOR_PIECES.filter((p) => !(p === 'frame' ? own.frame : p === 'nameplate' ? own.plate : own.effect)) : ['bubble'];
      return { coins: price, grants: kinds.map((p) => [p, drop.item_key]), run: async () => {
        const { data, error } = await supabase.rpc('zchat_buy_drop', { p_drop: drop.id });
        const row = Array.isArray(data) ? data[0] : data;
        if (error) return { error: rpcFailText('Drop buy', error, 'Drops switch on once the latest ZChat setup is finished.') };
        if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
        return { ok: true, coins: row.coins };
      } };
    }
    if (kind === 'set') {
      const kinds = missing.slice();
      if (useFree) return { freeSets: 1, grants: kinds.map((p) => [p, key]), run: () => claimFreeSet(key) };
      return { coins: price, grants: kinds.map((p) => [p, key]), run: () => (dealOn ? buyDeal('set', key) : kinds.length > 1 ? buyDecorSet(key) : buyShopItem(kinds[0], key)) };
    }
    if (kind === 'bubble' && useFree) return { freeBubbles: 1, grants: [[kind, key]], run: () => claimFreeBubble(key) };
    return { coins: price, grants: [[kind, key]], run: () => (dealOn ? buyDeal(kind, key) : buyShopItem(kind, key)) };
  };
  const confirm = async (useFree) => {
    if (sheet && sheet.stage === 'busy') return;
    const p = plan(useFree);
    if (p.coins) {
      if (coins < p.coins) { setSheet({ stage: 'confirm', free: false }); return; }
      if (!(await spendGate(`Get the ${fullTitle} for ${p.coins} coins`, { coins: p.coins }))) return;
    }
    setSheet({ stage: 'busy', free: useFree, bal: coins });
    const res = await moneyRun(me.id, p);
    if (!res || res.error) { setSheet({ stage: 'error', error: (res && res.error) || 'That did not work.', free: useFree }); return; }
    hapticTap();
    playUiSound('like');
    setSheet({ stage: 'done', free: useFree });
    if ((set && set.fx && (mode === 'set' || mode === 'effect')) || (dropSet && dropSet.fx)) setFxRun(Date.now());
    if (onRefresh) onRefresh();
  };
  const tapBuy = () => {
    hapticTap();
    if (!wallet || !wallet.ready) { flash('The Shop switches on once the latest ZChat setup is finished.'); return; }
    setSheet({ stage: 'confirm', free: freeBubbles > 0 || freeSets > 0 });
  };
  const equip = () => {
    hapticTap();
    if (kind === 'set' || (kind === 'drop' && dropSet)) {
      const sk = dropSet ? dropSet.key : key;
      const m = dropSet ? 'set' : mode;
      const patch = m === 'frame' ? { avatar_frame: sk } : m === 'nameplate' ? { nameplate: sk } : { avatar_frame: sk, nameplate: sk };
      if (onWear) onWear(patch);
      if ((m === 'set' || m === 'effect') && (set || dropSet).fx) setFxRun(Date.now());
      flash(m === 'frame' ? `${name} frame is on` : m === 'nameplate' ? `${name} nameplate is on` : `${name} is on your profile`);
      return;
    }
    if (kind === 'bubble' || kind === 'drop') { setBubbleStyle(key); playUiSound('like'); flash(`${name} is on. Everyone sees it.`); return; }
    if (kind === 'typing') { setTypingStyleMine(me.id, key); setTypingMine(key); playUiSound('like'); flash(`${name} is on. Friends see it while you type.`); return; }
    if (!onEquip) return;
    onEquip(kind, key);
    flash(kind === 'theme' ? `${name} is on your profile` : kind === 'charm' ? `${name} is next to your name` : `${name} is on your name`);
  };
  const takeOff = () => {
    hapticTap();
    if (kind === 'set' || (kind === 'drop' && dropSet)) {
      const sk = dropSet ? dropSet.key : key;
      const patch = {};
      if (mode !== 'nameplate' && me.avatar_frame === sk) patch.avatar_frame = null;
      if (mode !== 'frame' && me.nameplate === sk) patch.nameplate = null;
      if (Object.keys(patch).length && onWear) onWear(patch);
      flash('Taken off');
      return;
    }
    if (kind === 'bubble' || kind === 'drop') { setBubbleStyle('classic'); flash('Back to the classic bubble'); return; }
    if (kind === 'typing') { setTypingStyleMine(me.id, null); setTypingMine(null); flash('Back to the plain dots'); return; }
    if (!onEquip) return;
    onEquip(kind, null);
    flash('Taken off');
  };
  const tapWish = async () => {
    flash(wished ? 'Removed from your wishlist' : 'Added to your wishlist');
    const r = await wish.toggle(wishKind, key);
    if (r.error) flash(r.error);
  };
  const toggleRemind = async () => {
    if (remBusy || !drop) return;
    setRemBusy(true);
    const on = !reminded;
    setReminded(on);
    hapticTap();
    playUiSound(on ? 'like' : 'toggle');
    flash(on ? 'We will tell you the moment it opens' : 'Reminder off');
    const { error } = on
      ? await supabase.from('drop_reminders').insert({ drop_id: drop.id, user_id: me.id })
      : await supabase.from('drop_reminders').delete().eq('drop_id', drop.id).eq('user_id', me.id);
    setRemBusy(false);
    if (error && !/duplicate|unique/i.test(String(error.message || ''))) { setReminded(!on); flash('That did not work. Try again.'); return; }
    if (on) dropsMem.mine.add(drop.id); else dropsMem.mine.delete(drop.id);
  };
  const W = Math.max(240, Math.min(bw, 600) - 32);
  const showSet = set || dropSet;
  let stage;
  if (showSet) {
    const sk = showSet.key;
    const m = dropSet ? 'set' : mode;
    const pf = m === 'nameplate' ? (isDecorKey(me.avatar_frame) ? me.avatar_frame : null) : sk;
    const pp = m === 'frame' ? (isDecorKey(me.nameplate) ? me.nameplate : null) : sk;
    stage = <ShopProfileMock me={me} frameKey={pf} plateKey={pp} charm={me.custom_badge} nsKey={cxNs(me)} width={W} dark={dark} />;
  } else if (kind === 'drop' || kind === 'bubble') stage = <ShopChatMock me={me} dark={dark} bubble={key} />;
  else if (kind === 'charm' || kind === 'namestyle') {
    stage = view === 'chat'
      ? <ShopChatMock me={me} dark={dark} group nsKey={kind === 'namestyle' ? key : cxNs(me)} charm={kind === 'charm' ? key : me.custom_badge} />
      : <ShopProfileMock me={me} frameKey={me.avatar_frame} plateKey={me.nameplate} charm={kind === 'charm' ? key : me.custom_badge} nsKey={kind === 'namestyle' ? key : cxNs(me)} width={W} dark={dark} />;
  } else if (kind === 'theme') stage = <ShopThemeStage me={me} k={key} dark={dark} pal={pal} onFull={onPreviewTheme} />;
  else if (kind === 'reaction') stage = <ShopChatMock me={me} dark={dark} reaction={key} />;
  else if (kind === 'wallpaper') stage = <LiveWallStage k={key} me={me} dark={dark} />;
  else if (kind === 'stickerpack') stage = <ShopStickerGrid k={key} dark={dark} pal={pal} />;
  else if (kind === 'soundpack') stage = <ShopSoundList k={key} owned={has} pal={pal} onUsed={flash} />;
  else stage = <ShopTypingStage k={key} me={me} dark={dark} pal={pal} />;
  const fxKey = showSet && showSet.fx && (dropSet || mode === 'set' || mode === 'effect' || fxRun) ? showSet.key : null;
  const about = kind === 'drop' ? (drop.blurb || (dropSet && dropSet.about) || '') : kind === 'set' && mode === 'effect' ? 'An animation that plays over your profile when someone opens it. It only plays while you wear the full set.' : shopItemAbout(kind, key);
  const where = kind === 'drop' ? (dropSet ? SHOP_WHERE.set : SHOP_WHERE.bubble) : SHOP_WHERE[kind === 'set' ? mode : kind];
  const myEd = has ? editionOf(rewards, kind === 'drop' ? (dropSet ? 'frame' : 'bubble') : kind === 'set' ? (mode === 'set' ? 'frame' : mode) : kind, key) : null;
  const details = [
    ['Type', kindWord],
    !isFreeRx ? ['Rarity', <span key="r" style={{ color: shopRarityInk(rarity, pal.dark), fontWeight: 650 }}>{shopRarityWord(rarity)}</span>] : null,
    where ? ['Shows', where] : null,
    ['Yours', isFreeRx ? 'Free for everyone' : rentLeft != null ? `For ${rentLeft} more ${rentLeft === 1 ? 'day' : 'days'}` : 'To keep, it never runs out'],
    myEd ? ['Edition', `You own #${myEd.toLocaleString()}${myEd <= EDITION_FIRST ? ', a first edition' : ''}`] : edLeft > 0 && !has ? ['Edition', `${edLeft} first ${edLeft === 1 ? 'edition' : 'editions'} left`] : null,
    owners != null && owners > 0 ? ['Owners', `${formatCount(owners)} ${owners === 1 ? 'person has' : 'people have'} it`] : null,
  ].filter(Boolean);
  const cxOn = cxHas(me);
  const related = !onOpenItem || kind === 'drop' ? [] : shopKeys(kind === 'set' ? mode === 'set' ? 'set' : mode : kind, cxOn).filter((k2) => !(k2 === key) && !(kind === 'namestyle' && k2 === 'own')).slice(0, 10);
  const relKind = kind === 'set' ? (mode === 'set' ? 'set' : mode) : kind;
  const priceBlock = (
    <div style={{ minWidth: 0 }}>
      {freeBubbles > 0 || freeSets > 0
        ? <div style={{ fontSize: 18, fontWeight: 800, color: pal.ink }}>Free pick</div>
        : <ShopCoins price={price} was={was} size={19} weight={800} pal={pal} />}
      <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>{freeBubbles > 0 ? `${freeBubbles} free ${freeBubbles === 1 ? 'pick' : 'picks'} left` : freeSets > 0 ? `${freeSets} free ${freeSets === 1 ? 'set' : 'sets'} left` : dealOn ? 'Deal of the day' : `You have ${formatCount(coins)}`}</div>
    </div>
  );
  const statusBlock = (sub) => (
    <div style={{ minWidth: 0 }}>
      <ShopStatus pal={pal} owned={has} equipped={equipped} size="big" />
      {sub && <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
  const textBlock = (t, sub) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink }}>{t}</div>
      {sub && <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
    </div>
  );
  let left = null;
  let primary = null;
  let secondary = null;
  if (kind === 'drop' && !has && phase === 'soon') {
    left = textBlock('Coming soon', <ShopLeft to={drop.starts_at} pal={pal} before="Opens in" />);
    primary = <button type="button" disabled={remBusy} onClick={toggleRemind} aria-pressed={reminded} className="zchat-press" style={{ ...shopBtn(pal, reminded ? 'soft' : 'primary', 48), width: 'auto' }}>{reminded ? <><Check size={17} strokeWidth={3} />Reminder on</> : <><Bell size={17} />Remind me</>}</button>;
  } else if (kind === 'drop' && !has && phase === 'ended') {
    left = textBlock('This drop has ended', 'It is not in the Shop any more');
  } else if (set && set.drop && !has) {
    left = textBlock('Only from the drop', 'Mythical sets come in limited drops');
  } else if (buyable) {
    left = has && !forever && rentLeft != null ? textBlock(`Yours for ${rentLeft} more ${rentLeft === 1 ? 'day' : 'days'}`, <ShopCoins price={price} was={was} pal={pal} size={13} />) : priceBlock;
    if (has && canWear && !equipped) secondary = <button type="button" onClick={equip} className="zchat-press" style={{ ...shopBtn(pal, 'soft', 48), width: 'auto', padding: '0 16px' }}>Equip</button>;
    primary = <button type="button" onClick={tapBuy} aria-label={freeBubbles > 0 || freeSets > 0 ? `Get ${name} free` : `Buy ${name} for ${price} coins`} className="zchat-press" style={{ ...shopBtn(pal, 'primary', 48), width: 'auto', minWidth: 120 }}>{freeBubbles > 0 || freeSets > 0 ? 'Get it free' : 'Buy'}</button>;
  } else if (isFreeRx) {
    left = textBlock('Free for everyone', 'Hold any message to send it');
  } else if (has && equipped) {
    left = statusBlock(kind === 'set' && mode === 'effect' ? 'Playing on your profile' : 'Everyone sees it');
    if (kind !== 'set' || mode !== 'effect') primary = <button type="button" onClick={takeOff} className="zchat-press" style={{ ...shopBtn(pal, 'soft', 48), width: 'auto', minWidth: 120 }}>Take off</button>;
  } else if (has && canWear) {
    left = statusBlock('In your Collection');
    primary = <button type="button" onClick={equip} className="zchat-press" style={{ ...shopBtn(pal, 'primary', 48), width: 'auto', minWidth: 120 }}>Equip</button>;
  } else if (has) {
    left = statusBlock(kind === 'set' && mode === 'effect' ? 'Get the frame and nameplate to use it' : kind === 'reaction' ? 'Hold any message to send it' : kind === 'stickerpack' ? 'In your sticker picker' : kind === 'wallpaper' ? 'Pick it in any chat from Theme' : kind === 'soundpack' ? 'Pick a tone above to use it' : 'Yours to keep');
  }
  const lab = { fontSize: 13.5, color: pal.ink2, flexShrink: 0, width: 84 };
  const sheetFree = sheet && sheet.free ? (freeSets > 0 ? `Uses 1 of your ${freeSets} free ${freeSets === 1 ? 'set' : 'sets'}. You get every piece you do not have yet.` : `Uses 1 of your ${freeBubbles} free ${freeBubbles === 1 ? 'pick' : 'picks'}.`) : null;
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex, background: pal.bg, color: pal.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ flexShrink: 0, paddingTop: 'env(safe-area-inset-top)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56, padding: '0 12px 0 6px', maxWidth: 640, margin: '0 auto' }}>
          <div role="button" aria-label="Back" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: pal.ink, flexShrink: 0 }}><ArrowLeft size={24} strokeWidth={2} /></div>
          <div style={{ flex: 1 }} />
          {canWish && <ShopIconBtn label={wished ? 'Remove from your wishlist' : 'Add to your wishlist'} pressed={wished} onClick={tapWish} pal={pal}><ShopHeartGlyph on={wished} pal={pal} /></ShopIconBtn>}
          <ShopCoinPill coins={coins} onOpenWallet={onOpenWallet} pal={pal} />
        </div>
      </div>
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 16px 28px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div data-no-swipe="true" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipeRef.current = null; }} style={{ position: 'relative', borderRadius: 24, background: pal.stage, padding: 12, overflow: 'hidden', isolation: 'isolate', touchAction: 'pan-y' }}>
            <div key={`${raw}:${key}:${mode}:${view}`} className="zchat-pop" style={{ position: 'relative', zIndex: 1 }}>{stage}</div>
            {fxKey && <ProfileEffectLayer effectKey={fxKey} runKey={fxRun} force={fxRun > 0} z={3} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, minHeight: 34 }}>
            {kind !== 'soundpack' ? <ShopSeg label="Preview in light or dark" items={[[false, 'Light'], [true, 'Dark']]} value={dark} onChange={setDark} pal={pal} /> : <div style={{ fontSize: 13, color: pal.ink2 }}>Tap a sound to hear it</div>}
            {(kind === 'charm' || kind === 'namestyle') && <ShopSeg label="Preview on your profile or in a chat" items={[['profile', 'Profile'], ['chat', 'Chat']]} value={view} onChange={setView} pal={pal} />}
            <div style={{ flex: 1 }} />
            {showSet && showSet.fx && <div role="button" aria-label="Play the profile effect" onClick={() => { hapticTap(); setFxRun(Date.now()); }} className="zchat-press" style={{ height: 34, padding: '0 13px 0 11px', borderRadius: 17, background: pal.stage, color: pal.ink, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 650, cursor: 'pointer' }}><Play size={12} fill="currentColor" strokeWidth={0} />Effect</div>}
            {order && kind !== 'charm' && kind !== 'namestyle' && (
              <>
                <ShopIconBtn label={`Previous item, ${idx + 1} of ${order.length}`} onClick={() => go(-1)} pal={pal} size={34}><ChevronLeft size={18} /></ShopIconBtn>
                <ShopIconBtn label="Next item" onClick={() => go(1)} pal={pal} size={34}><ChevronRight size={18} /></ShopIconBtn>
              </>
            )}
          </div>
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: pal.ink2 }}>
              <span>{kindWord}</span>
              {!isFreeRx && <><span aria-hidden="true">·</span><span style={{ color: shopRarityInk(rarity, pal.dark) }}>{shopRarityWord(rarity)}</span></>}
              {kind === 'drop' && phase === 'live' && !has && <><span aria-hidden="true">·</span><ShopLeft to={drop.ends_at} pal={pal} color={pal.danger} /></>}
              {dealOn && <><span aria-hidden="true">·</span><ShopLeft to={deal.ends_at} pal={pal} before="Deal ends in" color={pal.link} /></>}
            </div>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15, color: pal.ink }}>{name}</h1>
            {about && <p style={{ margin: '10px 0 0', fontSize: 15, lineHeight: 1.5, color: pal.ink2, textWrap: 'pretty' }}>{about}</p>}
          </div>
          {kind === 'drop' && !has && phase !== 'ended' && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink, marginBottom: 10 }}>{phase === 'soon' ? 'Opens in' : 'Ends in'}</div>
              <ShopClock to={phase === 'soon' ? drop.starts_at : drop.ends_at} pal={pal} />
            </div>
          )}
          {set && !set.drop && <ShopPieces set={set} own={own} mode={mode} onMode={setMode} pal={pal} onPlay={() => setFxRun(Date.now())} eds={has || own.any ? { frame: editionOf(rewards, 'frame', key), nameplate: editionOf(rewards, 'nameplate', key), effect: editionOf(rewards, 'effect', key) } : null} />}
          {set && <ShopColours set={set} pal={pal} onPick={onPick ? (k2) => onPick({ kind: 'set', key: k2 }) : null} />}
          {set && set.pair && <ShopPair set={set} me={me} rewards={rewards} wallet={wallet} pal={pal} onPick={onPick ? (k2) => onPick({ kind: 'set', key: k2 }) : null} onWear={onWear} onRefresh={onRefresh} flash={flash} onGift={onGift} onOpenWallet={onOpenWallet} />}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: pal.ink, marginBottom: 4 }}>Details</div>
            {details.map(([l, v]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '11px 0', borderBottom: `1px solid ${pal.line}` }}>
                <span style={lab}>{l}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: pal.ink, lineHeight: 1.4 }}>{v}</span>
              </div>
            ))}
          </div>
          {related.length > 0 && (
            <ShopRail title="More like this" pal={pal} wide={false}>
              {related.map((k2) => { const st = shopState(c, relKind, k2); return <ShopTile key={k2} kind={relKind} k={k2} me={me} pal={pal} w={132} rail owned={st.owned} equipped={st.equipped} price={shopBase(c, relKind, k2)} onOpen={(kk, k3) => onOpenItem({ kind: kk, key: k3 })} />; })}
            </ShopRail>
          )}
        </div>
      </div>
      {(left || primary) && (
        <div style={{ flexShrink: 0, padding: '10px 16px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', borderTop: `1px solid ${pal.line}`, background: pal.bg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: 600, margin: '0 auto' }}>
            <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
            {canGift && <ShopIconBtn label={`Send the ${fullTitle} as a gift`} onClick={() => { hapticTap(); onGift(kind === 'set' ? 'set' : kind, key); }} pal={pal} size={48}><GiftBoxIcon size={21} /></ShopIconBtn>}
            {secondary}
            {primary}
          </div>
        </div>
      )}
      {sheet && (
        <ShopBuySheet pal={pal} me={me} artKind={kind === 'drop' ? 'drop' : artKind} artKey={key} drop={drop} name={name} kindWord={kindWord} price={price} was={was} coins={sheet.stage === 'busy' && sheet.bal != null ? sheet.bal : coins}
          free={sheet.free ? sheetFree : null} stage={sheet.stage} error={sheet.error} canEquip={canWear && !equipped} doneText={shopDoneText(kind, mode)} coinsInstead={sheet.free && coins >= (kind === 'set' ? full : BUBBLE_PRICE) ? (kind === 'set' ? full : BUBBLE_PRICE) : null}
          onConfirm={confirm} onClose={() => setSheet(null)} onCoins={() => { setSheet(null); if (onOpenWallet) onOpenWallet(); }} onEquip={() => { setSheet(null); equip(); }} />
      )}
      <ShopToast text={note} pal={pal} />
    </div>
  );
}
function ShopFeatured({ slides, me, pal, width, onOpen }) {
  const [at, setAt] = useState(0);
  const rowRef = useRef(null);
  const rafRef = useRef(0);
  const touched = useRef(false);
  const ids = slides.map((s) => s.id).join('|');
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);
  useLayoutEffect(() => { const el = rowRef.current; if (el && !touched.current) { if (el.scrollLeft) el.scrollLeft = 0; setAt(0); } }, [ids]);
  const touch = () => { touched.current = true; };
  const n = slides.length;
  if (!n) return null;
  const cw = width;
  const stageH = Math.round(Math.min(300, Math.max(220, cw * 0.66)));
  const onScroll = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = rowRef.current;
      if (!el) return;
      const k = Math.max(0, Math.min(n - 1, Math.round(el.scrollLeft / (cw + 12))));
      setAt((v) => (v === k ? v : k));
    });
  };
  const slideTo = (k) => { const el = rowRef.current; if (!el) return; try { el.scrollTo({ left: k * (cw + 12), behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch { el.scrollLeft = k * (cw + 12); } };
  return (
    <div data-no-swipe="true" style={{ marginTop: 6 }}>
      <div ref={rowRef} onScroll={onScroll} onPointerDown={touch} onTouchStart={touch} onWheel={touch} className="zshop-row" style={{ display: 'flex', gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -16px', padding: '0 16px', scrollPaddingLeft: 16, scrollbarWidth: 'none' }}>
        {slides.map((s, i) => (
          <div key={s.id} role="button" aria-label={`${s.eyebrowText}, ${s.title}`} onClick={() => onOpen(s.it.kind, s.it.key)} className="zchat-press" style={{ flex: `0 0 ${cw}px`, width: cw, scrollSnapAlign: 'start', cursor: 'pointer', minWidth: 0 }}>
            <div style={{ position: 'relative', height: stageH, borderRadius: 22, background: pal.stage, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', isolation: 'isolate' }}>
              {s.art(stageH, i === at)}
              <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 3, display: 'flex', gap: 6 }}>
                <ShopPill pal={pal} tone="page" style={{ height: 26, padding: '0 10px', fontSize: 12.5 }}>{s.eyebrow}</ShopPill>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '12px 2px 0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 21, fontWeight: 800, color: pal.ink, letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</div>
                <div style={{ fontSize: 13.5, color: pal.ink2, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.sub}</div>
              </div>
              <div style={{ flexShrink: 0, paddingBottom: 1 }}>{s.owned ? <ShopStatus pal={pal} owned /> : <ShopCoins price={s.price} was={s.was} pal={pal} size={16} />}</div>
            </div>
          </div>
        ))}
      </div>
      {n > 1 && (
        <div role="tablist" aria-label="Featured" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          {slides.map((s, k) => <div key={s.id} role="tab" aria-selected={k === at} aria-label={`Show ${s.title}`} onClick={() => { if (k !== at) { hapticTap(); slideTo(k); } }} style={{ width: k === at ? 18 : 6, height: 6, borderRadius: 3, background: k === at ? pal.ink : pal.stage2, cursor: 'pointer', transition: reducedMotion() ? 'none' : 'width 0.25s ease, background 0.25s ease' }} />)}
        </div>
      )}
    </div>
  );
}
function ShopLimitCard({ kind, k, drop, me, pal, w, title, sub, to, before, price, was, owned, onOpen }) {
  return (
    <div role="button" aria-label={`${title}, ${sub}`} onClick={onOpen} className="zchat-press" style={{ flex: `0 0 ${w}px`, width: w, cursor: 'pointer', scrollSnapAlign: 'start', minWidth: 0 }}>
      <div style={{ position: 'relative', height: Math.round(w * 0.62), borderRadius: 18, background: pal.stage, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', isolation: 'isolate' }}>
        <ShopArt kind={kind} k={k} me={me} size={Math.round(w * 0.6)} pal={pal} drop={drop} />
        {to && <div style={{ position: 'absolute', left: 10, top: 10, zIndex: 3 }}><ShopPill pal={pal} tone="page"><ShopLeft to={to} pal={pal} before={before} color={pal.ink} /></ShopPill></div>}
      </div>
      <div style={{ marginTop: 8, fontSize: 14.5, fontWeight: 650, color: pal.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
      <div style={{ marginTop: 2, fontSize: 12.5, color: pal.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
      <div style={{ marginTop: 6, height: 22, display: 'flex', alignItems: 'center' }}>{owned ? <ShopStatus pal={pal} owned /> : <ShopCoins price={price} was={was} pal={pal} />}</div>
    </div>
  );
}
let shopLabels = null;
function shopLabelMap() {
  if (shopLabels) return shopLabels;
  const m = new Map();
  const put = (label, it) => { const s = String(label || '').trim().toLowerCase(); if (s && !m.has(s)) m.set(s, it); };
  DECOR_ALL.forEach((s) => { put(`${s.name} set`, { kind: 'set', key: s.key }); SHOP_PIECES.forEach((p) => put(`${s.name} ${p}`, { kind: p, key: s.key })); put(`${s.name} profile effect`, { kind: 'effect', key: s.key }); });
  CHAR_BUBBLE_KEYS.forEach((k) => { const nm = shopItemName('bubble', k); put(`${nm} bubble`, { kind: 'bubble', key: k }); put(`${nm} chat bubble`, { kind: 'bubble', key: k }); });
  Object.keys(CUSTOM_BADGES).forEach((k) => { put(CUSTOM_BADGES[k].label, { kind: 'charm', key: k }); put(`${shopItemName('charm', k)} charm`, { kind: 'charm', key: k }); });
  NS_KEYS.forEach((k) => put(`${shopItemName('namestyle', k)} name style`, { kind: 'namestyle', key: k }));
  put('custom name style', { kind: 'namestyle', key: 'own' });
  THEME_KEYS.forEach((k) => { put(`${shopItemName('theme', k)} theme`, { kind: 'theme', key: k }); put(`${shopItemName('theme', k)} profile theme`, { kind: 'theme', key: k }); });
  SUPER_KEYS.forEach((k) => { put(`${shopItemName('reaction', k)} super reaction`, { kind: 'reaction', key: k }); put(`${shopItemName('reaction', k)} reaction`, { kind: 'reaction', key: k }); });
  LIVE_WALL_PAID.forEach((k) => { put(`${shopItemName('wallpaper', k)} live wallpaper`, { kind: 'wallpaper', key: k }); put(`${shopItemName('wallpaper', k)} wallpaper`, { kind: 'wallpaper', key: k }); });
  SI_KINDS.forEach((kind) => shopKeys(kind, false).forEach((k) => put(`${shopItemName(kind, k)} ${siWord(kind)}`, { kind, key: k })));
  [...DECOR_ALL.map((s) => [s.name, { kind: 'set', key: s.key }]), ...CHAR_BUBBLE_KEYS.map((k) => [shopItemName('bubble', k), { kind: 'bubble', key: k }]), ...NS_KEYS.map((k) => [shopItemName('namestyle', k), { kind: 'namestyle', key: k }]), ...THEME_KEYS.map((k) => [shopItemName('theme', k), { kind: 'theme', key: k }])].forEach(([l, it]) => put(l, it));
  shopLabels = m;
  return m;
}
function shopFromNote(note) {
  if (!note) return null;
  const s = String(note).trim().toLowerCase();
  return shopLabelMap().get(s) || shopLabelMap().get(s.replace(/^(the|a) /, '')) || null;
}
const shopBuysMem = { uid: null, rows: null, err: null, at: 0, job: null };
function shopBuysWarm(uid) {
  if (!uid || shopBuysMem.uid === uid) return;
  Object.assign(shopBuysMem, { uid, rows: readJsonLs(`zchat-shop-buys-${uid}`, null), err: null, at: 0, job: null });
}
function loadShopBuys(uid, force) {
  shopBuysWarm(uid);
  if (!force && shopBuysMem.rows && Date.now() - shopBuysMem.at < 60000) return Promise.resolve(shopBuysMem.rows);
  if (shopBuysMem.job) return shopBuysMem.job;
  shopBuysMem.err = null;
  const job = supabase.from('coin_ledger').select('id, delta, reason, note, other_id, created_at').eq('user_id', uid).in('reason', SHOP_BUY_REASONS).order('created_at', { ascending: false }).limit(120)
    .then(({ data, error }) => {
      if (shopBuysMem.uid !== uid) return null;
      if (error) { shopBuysMem.err = error.code || 'ledger'; return shopBuysMem.rows; }
      shopBuysMem.rows = (data || []).map((r) => ({ id: r.id, delta: Number(r.delta) || 0, reason: r.reason, note: r.note || null, gift: !!r.other_id, at: r.created_at }));
      shopBuysMem.at = Date.now();
      writeJsonLs(`zchat-shop-buys-${uid}`, shopBuysMem.rows.slice(0, 60));
      return shopBuysMem.rows;
    }, () => { if (shopBuysMem.uid === uid) shopBuysMem.err = 'net'; return shopBuysMem.rows; })
    .then((v) => { if (shopBuysMem.job === job) shopBuysMem.job = null; shopPing(); return v; });
  shopBuysMem.job = job;
  return job;
}
function ShopPurchasesPage({ uid, me, pal, onClose, onOpenItem, onOpenWallet }) {
  useShopTick();
  shopBuysWarm(uid);
  useEffect(() => {
    loadShopBuys(uid, true);
    const on = () => loadShopBuys(uid, true);
    window.addEventListener('zchat-wallet', on);
    return () => window.removeEventListener('zchat-wallet', on);
  }, [uid]);
  const rows = shopBuysMem.uid === uid ? shopBuysMem.rows : null;
  const err = shopBuysMem.uid === uid ? shopBuysMem.err : null;
  const busy = !!shopBuysMem.job;
  const spent = (rows || []).filter((r) => r.delta < 0 && r.reason !== 'gift_item').reduce((a, r) => a - r.delta, 0);
  const month = (iso) => fmtDate(new Date(iso), { month: 'long', year: 'numeric' });
  let lastMonth = '';
  return (
    <FullPage title="Purchases" onBack={onClose} zIndex={700}>
      {rows === null && !err ? (
        <div aria-busy="true" style={{ paddingTop: 12 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <ShopSkel w={52} h={52} r={14} pal={pal} />
              <div style={{ flex: 1 }}><ShopSkel w="56%" h={13} r={6} pal={pal} /><ShopSkel w="34%" h={11} r={6} pal={pal} style={{ marginTop: 8 }} /></div>
              <ShopSkel w={48} h={13} r={6} pal={pal} />
            </div>
          ))}
        </div>
      ) : rows === null || (err && !rows.length) ? (
        <LoadFail code={err && err !== 'net' ? err : null} onRetry={() => loadShopBuys(uid, true)} />
      ) : !rows.length ? (
        <EmptyState title="No purchases yet" text="Things you buy in the Shop show up here, with the date and the coins you paid." action={<PillButton primary label="Browse the Shop" onClick={onClose} />} />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', margin: '8px 0 6px', borderRadius: 16, background: pal.stage }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: pal.ink2 }}>Spent in the Shop</div>
              <div style={{ marginTop: 4 }}><ShopCoins price={spent} pal={pal} size={22} weight={800} /></div>
            </div>
            <div role="button" aria-label="Open your coins" onClick={onOpenWallet} className="zchat-press" style={{ height: 36, padding: '0 14px', borderRadius: 18, background: pal.bg, color: pal.ink, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer', flexShrink: 0 }}>Coins</div>
          </div>
          {err && <div role="alert" style={{ fontSize: 13, color: pal.ink2, padding: '6px 2px' }}>Showing what was saved on this phone. <span role="button" onClick={() => loadShopBuys(uid, true)} style={{ color: pal.link, fontWeight: 650, cursor: 'pointer' }}>Try again</span></div>}
          {rows.map((r) => {
            const it = shopFromNote(r.note);
            const m = month(r.at);
            const head = m !== lastMonth ? m : null;
            lastMonth = m;
            const label = r.note ? r.note.replace(/^./, (ch) => ch.toUpperCase()) : r.reason === 'deal' ? 'Deal of the day' : r.reason === 'drop' ? 'Limited drop' : r.reason === 'refund' ? 'Refund' : 'Shop item';
            const sub = `${fmtDate(new Date(r.at), { month: 'short', day: 'numeric' })}${r.reason === 'gift_item' || r.gift ? ', sent as a gift' : r.reason === 'refund' ? ', refunded' : r.reason === 'deal' ? ', deal of the day' : r.reason === 'drop' ? ', limited drop' : ''}`;
            return (
              <React.Fragment key={r.id}>
                {head && <div style={{ fontSize: 13, fontWeight: 700, color: pal.ink2, padding: '18px 2px 6px' }}>{head}</div>}
                <div role={it ? 'button' : undefined} aria-label={it ? `${label}, open it in the Shop` : undefined} onClick={it ? () => onOpenItem(it.kind, it.key) : undefined} className={it ? 'zchat-row-press' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', cursor: it ? 'pointer' : 'default' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: pal.stage, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {it ? <ShopArt kind={it.kind} k={it.key} me={me} size={52} pal={pal} /> : <CoinIcon size={24} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: pal.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: pal.ink2, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: r.delta > 0 ? pal.link : pal.ink, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{r.delta > 0 ? `+${formatCount(r.delta)}` : `−${formatCount(Math.abs(r.delta))}`}</div>
                </div>
              </React.Fragment>
            );
          })}
          <div style={{ fontSize: 12.5, color: pal.ink2, textAlign: 'center', padding: '20px 12px 4px', lineHeight: 1.5 }}>{busy ? 'Checking for newer purchases' : 'Coins from daily rewards, gifts and invites are in Coins.'}</div>
        </>
      )}
    </FullPage>
  );
}
function ShopCreatorRail({ pal, w, wide }) {
  const top = useCr('top', 'all', 60000);
  const list = Array.isArray(top) ? top : [];
  return (
    <ShopRail title="From creators" sub="Sticker packs made by people on ZChat" pal={pal} wide={wide}>
      <div role="button" aria-label="Your creator tools" onClick={() => { hapticTap(); crOpen('hub'); }} className="zchat-press" style={{ flex: `0 0 ${w}px`, width: w, cursor: 'pointer', scrollSnapAlign: 'start' }}>
        <div style={{ width: w, height: w, borderRadius: 16, boxShadow: `inset 0 0 0 1.5px ${pal.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 14, boxSizing: 'border-box', color: pal.ink }}>
          <CrGlyph k="tools" size={26} />
          <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>Sell your own packs</div>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, fontWeight: 650, color: pal.ink }}>Creator tools</div>
        <div style={{ marginTop: 2, fontSize: 12.5, color: pal.ink2 }}>Packs, memberships, shoutouts</div>
      </div>
      {list.map((pk) => (
        <div key={pk.id} role="button" aria-label={`Sticker pack ${pk.name}`} onClick={() => { hapticTap(); crOpen('pack', { pack: pk, owner: pk.owner || { id: pk.owner_id } }); }} className="zchat-press" style={{ flex: `0 0 ${w}px`, width: w, cursor: 'pointer', scrollSnapAlign: 'start', minWidth: 0 }}>
          <div style={{ width: w, height: w, borderRadius: 16, background: pal.stage, padding: 10, boxSizing: 'border-box', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {(pk.preview || [])[i] && <img src={pk.preview[i]} alt="" loading="lazy" decoding="async" draggable={false} style={{ width: '88%', height: '88%', objectFit: 'contain' }} />}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 650, color: pal.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pk.name}</div>
          <div style={{ marginTop: 2, fontSize: 12.5, color: pal.ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pk.owner && pk.owner.name ? `By ${crFirst(pk.owner)}` : 'Sticker pack'}</div>
          <div style={{ marginTop: 6, height: 22, display: 'flex', alignItems: 'center' }}>{pk.mine ? <ShopStatus pal={pal} owned /> : <ShopCoins price={pk.price} pal={pal} />}</div>
        </div>
      ))}
    </ShopRail>
  );
}
export function ShopItemPage(props) {
  return <ShopProduct {...props} />;
}
export function SetShopPage({ setKey, startMode = 'set', list = null, items = null, onPick, onPickItem = null, onGift, ...rest }) {
  const order = items && items.length > 1 ? items : list && list.length > 1 ? list.map((k) => ({ kind: 'set', key: k })) : null;
  const key = DECOR_BY_KEY[setKey] ? setKey : DECOR_SETS[0].key;
  return <ShopProduct {...rest} zIndex={640} item={{ kind: 'set', key }} startMode={startMode} items={order} onPick={(it) => { if (it.kind === 'set' || SHOP_PIECES.includes(it.kind)) { if (onPick) onPick(it.key); } else if (onPickItem) onPickItem(it); }} onGift={onGift ? (kind, k) => onGift(k) : undefined} />;
}
function ShopHeroArt({ kind, k, drop, me, pal, h, w, active }) {
  const name = (me && (me.name || me.username)) || 'You';
  const first = String(name).split(' ')[0];
  const setKey = kind === 'drop' ? (drop && drop.kind === 'set' ? drop.item_key : null) : kind === 'set' ? k : null;
  if (setKey && DECOR_BY_KEY[setKey]) return <div data-fx-hero="1" style={{ display: 'flex', justifyContent: 'center' }}><DecorHero frameKey={setKey} plateKey={setKey} width={Math.round(Math.min(h * 1.02, w * 0.84))} photo={me.avatar} name={name} username={me.username} verified={me.verified} custom={me.custom_badge} nsk={cxNs(me)} gapColor={pal.stage} lazy /></div>;
  if (kind === 'namestyle') {
    const a = Math.round(h * 0.3);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: Math.round(h * 0.05), maxWidth: w - 32 }}>
        <Avatar emoji={me.avatar} name={name} size={a} />
        <div style={{ maxWidth: '100%', fontSize: Math.round(h * 0.15), fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: pal.ink, ...NS_ROOM }}><StyledName name={name} k={k === 'own' ? nsOwnSaved() || NS_OWN_SAMPLE : k} dark={pal.dark} /></div>
        <div style={{ fontSize: 14, color: pal.ink2, marginTop: -Math.round(h * 0.03) }}>@{me.username || 'you'}</div>
      </div>
    );
  }
  if (kind === 'theme') return <ThemeArt k={k} me={me} w={Math.round(h * 0.6)} h={Math.round(h * 0.86)} dark={pal.dark} live={active} radius={16} />;
  if (kind === 'stickerpack') {
    const pack = siSpec('stickerpack', k);
    const ids = pack ? pack.list.slice(0, 3).map(([id]) => id) : [];
    const s = Math.round(Math.min(h * 0.5, (w - 48) / 3));
    return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{ids.map((id, i) => <img key={id} src={`/ps-${k}-${id}.webp`} alt="" loading="lazy" decoding="async" draggable={false} style={{ width: s, height: s, objectFit: 'contain', transform: i === 1 ? 'translateY(-10px)' : 'none' }} />)}</div>;
  }
  if (kind === 'bubble') {
    return (
      <div style={{ width: Math.min(w - 40, 300), display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CharBubbleSample k={null} text="Is that a new bubble?" isMe={false} fontSize={15} />
        <CharBubbleSample k={k} text="Yes, got it today" cw={52} fontSize={15} />
      </div>
    );
  }
  if (kind === 'reaction') return <ShopRxArt k={k} size={Math.round(h * 0.62)} />;
  return <ShopArt kind={kind} k={k} me={me} size={Math.round(h * 0.86)} pal={pal} drop={drop} />;
}
function shopMix(list) {
  const groups = new Map();
  list.forEach((it) => { if (!groups.has(it.kind)) groups.set(it.kind, []); groups.get(it.kind).push(it); });
  const out = [];
  const gs = [...groups.values()];
  for (let i = 0; out.length < list.length; i += 1) gs.forEach((g) => { if (g[i]) out.push(g[i]); });
  return out;
}
const SHOP_RAILS = [['set', 'Sets'], ['bubble', 'Chat bubbles'], ['namestyle', 'Name styles'], ['stickerpack', 'Sticker packs'], ['theme', 'Profile themes'], ['frame', 'Frames'], ['reaction', 'Super reactions'], ['charm', 'Charms'], ['nameplate', 'Nameplates'], ['wallpaper', 'Live wallpapers'], ['soundpack', 'Sound packs'], ['typing', 'Typing styles']];
export function ShopPage({ me, rewards, onClose, onWear, onRewardsChanged, onOpenWallet, onGift, onOpenCollection, startTab = 'foryou', startSet = null, startItem = null, onEquip, inline = false }) {
  useBackClose(!inline, onClose);
  const edgeBack = useEdgeSwipeBack(!inline);
  shopCss2();
  const { theme, bubbleStyle } = useTheme();
  const pal = shopPal(theme);
  const cxOn = cxHas(me);
  const start = useMemo(() => {
    const s = typeof startSet === 'string' ? startSet : null;
    if (isDecorKey(s)) return { open: { kind: 'set', key: s } };
    if (startItem && startItem.kind && startItem.key) return { open: { kind: startItem.kind, key: startItem.key } };
    if (s && s.indexOf(':') > 0) {
      const [a, b] = s.split(':');
      if (a === 'tab') return { cat: b === 'styles' ? (cxOn ? 'namestyle' : 'foryou') : b === 'match' ? 'set' : SHOP_CATS.some(([x]) => x === b) ? b : 'foryou' };
      if (SI_KINDS.includes(a) && siSpec(a, b)) return { open: { kind: a, key: b } };
      if (a === 'namestyle' && b === 'own') return { open: { kind: a, key: b } };
      if (cxOn && cxSpec(a, b)) return { open: { kind: a, key: b } };
    }
    return { cat: startTab === 'sets' ? 'set' : startTab === 'bubbles' ? 'bubble' : startTab === 'charms' ? 'charm' : startTab === 'styles' && cxOn ? 'namestyle' : 'foryou' };
  }, []);
  const [cat, setCat] = useState(start.cat || 'foryou');
  const [open, setOpen] = useState(start.open ? { ...start.open, items: null } : null);
  const [themeTry, setThemeTry] = useState(null);
  const [buysOpen, setBuysOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const [waitKey, setWaitKey] = useState(0);
  const [waited, setWaited] = useState(false);
  useEffect(() => { setWaited(false); const t = setTimeout(() => setWaited(true), 8000); return () => clearTimeout(t); }, [waitKey]);
  const wallet = useWallet(me.id);
  const dropsLive = useDrops(me.id);
  const dropsSaved = useMemo(() => { const v = readJsonLs(`zchat-shop-drops-${me.id}`, null); return Array.isArray(v) ? v.filter((d) => d && d.id && Date.parse(d.ends_at) > Date.now() && (d.kind === 'set' ? isDecorKey(d.item_key) : !!CHAR_BUBBLES[d.item_key])) : null; }, [me.id]);
  useEffect(() => { if (Array.isArray(dropsLive)) writeJsonLs(`zchat-shop-drops-${me.id}`, dropsLive); }, [dropsLive, me.id]);
  const drops = dropsLive || dropsSaved;
  const popularList = usePopular();
  const popLoading = shopMem.popular === null || shopMem.popular === undefined;
  const deal = useDeal();
  const wish = useWishlist(me.id);
  const typingMine = typingStyleMine(me.id);
  const pageRef = useRef(null);
  const scrollRef = useRef(null);
  const chipsRef = useRef(null);
  const forYouTop = useRef(0);
  const toastTimer = useRef(0);
  const pw = useWidthOf(pageRef, typeof window === 'undefined' ? 390 : Math.min(window.innerWidth, 1080));
  const wide = pw >= 760;
  const gw = pw - 32;
  const cols = gw >= 860 ? 5 : gw >= 660 ? 4 : gw >= 470 ? 3 : 2;
  const tileW = Math.floor((gw - (cols - 1) * 12) / cols);
  const railW = wide ? 168 : Math.max(132, Math.min(168, Math.round((gw - 24) / 2.35)));
  useDecorLoaded(DECOR_SPRITE);
  const say = (t) => { setToast(t); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 2400); };
  useMoneyToast(say);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => { shopOwnersSeed(popularList); }, [popularList]);
  const covered = !!(open || themeTry || buysOpen);
  useEffect(() => { decorBudgetQueue(); }, [covered, cat, query]);
  useBackClose(cat !== 'foryou', () => setCat('foryou'));
  const pickCat = (k) => {
    if (k === cat) return;
    hapticTap();
    playUiSound('tap');
    const el = scrollRef.current;
    if (cat === 'foryou' && el) forYouTop.current = el.scrollTop;
    setCat(k);
  };
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = cat === 'foryou' ? forYouTop.current : 0;
    const row = chipsRef.current;
    const chip = row && row.querySelector(`[data-cat="${cat}"]`);
    if (row && chip) { const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2; try { row.scrollTo({ left: Math.max(0, left), behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch { row.scrollLeft = Math.max(0, left); } }
  }, [cat]);
  const c = shopCtx(me, rewards, bubbleStyle, typingMine);
  const st = (kind, k) => shopState(c, kind, k);
  const dealVisible = !!(deal && !st(deal.kind, deal.key).owned);
  const freeSets = wallet && wallet.ready ? wallet.freeSets || 0 : 0;
  const freeBubbles = wallet && wallet.ready ? wallet.freeBubbles || 0 : 0;
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const refresh = async () => { if (onRewardsChanged) await onRewardsChanged(); loadMilestones(me.id, true); };
  const openRef = useRef(null);
  openRef.current = (kind, k, list) => {
    playUiSound('tap');
    const items = list && list.length > 1 ? list.filter((it) => it.kind !== 'drop' && !(it.kind === 'namestyle' && it.key === 'own')) : null;
    setOpen({ kind, key: k, items: items && items.length > 1 ? items : null });
  };
  const openItem = (kind, k, list) => openRef.current(kind, k, list);
  const shownDrops = (drops || []).filter((d) => dropPhase(d) !== 'ended').sort((a, b) => (dropPhase(a) === 'live' ? 0 : 1) - (dropPhase(b) === 'live' ? 0 : 1));
  const openDrop = open && open.kind === 'drop' ? (drops || []).find((d) => d.id === open.key) || null : null;
  useEffect(() => { if (open && open.kind === 'drop' && drops && !openDrop) setOpen(null); }, [open, drops, openDrop]);
  const freshAll = [
    ...DECOR_SI.filter((s) => s.pair && !s.base).map((s) => ({ kind: 'set', key: s.key })),
    ...(cxOn ? [{ kind: 'namestyle', key: 'own' }] : []),
    ...SI_STICKER_PACKS.map((p) => ({ kind: 'stickerpack', key: p.key })),
    ...SI_TYPING.slice(0, 3).map((t) => ({ kind: 'typing', key: t.key })),
    ...SI_SOUND_PACKS.slice(0, 2).map((p) => ({ kind: 'soundpack', key: p.key })),
    ...DECOR_SETS.filter((s) => s.fresh).map((s) => ({ kind: 'set', key: s.key })),
    ...(cxOn ? CX_NEW.map(([kind, key]) => ({ kind, key })) : []),
    ...CHAR_BUBBLE_KEYS.filter((k) => CHAR_BUBBLES[k].fresh).map((k) => ({ kind: 'bubble', key: k })),
  ];
  const fresh = shopMix(freshAll.filter((it) => !st(it.kind, it.key).owned));
  const popular = popularList.filter((p) => !st(p.kind, p.key).owned);
  const wished = wish.list.filter((w) => !st(w.kind, w.item_key).owned).map((w) => ({ kind: w.kind, key: w.item_key }));
  const finish = DECOR_ALL.filter((s) => !s.drop && c.dec(s.key).any && !c.dec(s.key).full).map((s) => ({ kind: 'set', key: s.key }));
  const catList = (k) => {
    if (k === 'new') return fresh;
    if (k === 'popular') return popular.map((p) => ({ kind: p.kind, key: p.key }));
    if (k === 'wishlist') return wished;
    if (k === 'finish') return finish;
    const all = shopKeys(k, cxOn).map((key) => ({ kind: k, key }));
    return [...all.filter((it) => !st(it.kind, it.key).owned), ...all.filter((it) => st(it.kind, it.key).owned)];
  };
  const tile = (it, list, opts) => {
    const s = st(it.kind, it.key);
    const dp = dealVisible ? shopDealFor(deal, c, it.kind, it.key) : null;
    const base = shopBase(c, it.kind, it.key);
    const pop = opts.pop ? popularList.find((p) => p.kind === it.kind && p.key === it.key) : null;
    const flag = dp != null ? 'Deal' : s.some ? `${s.some} of 3` : !s.owned && freeSets > 0 && it.kind === 'set' && DECOR_BY_KEY[it.key] && DECOR_BY_KEY[it.key].rarity === 'epic' ? 'Free' : !s.owned && freeBubbles > 0 && it.kind === 'bubble' ? 'Free' : null;
    const meta = opts.meta === 'kind' ? shopKindLabel(it.kind) : pop ? `${formatCount(pop.owners)} have it` : null;
    return <ShopTile key={`${it.kind}:${it.key}`} kind={it.kind} k={it.key} me={me} pal={pal} w={opts.w} rail={!!opts.rail} meta={meta} owned={s.owned} equipped={s.equipped} price={dp != null ? dp : base} was={dp != null && base > dp ? base : null} flag={flag} flagTone={flag === 'Deal' || flag === 'Free' ? 'accent' : 'page'} onOpen={(kind, k) => openItem(kind, k, list)} />;
  };
  const rail = (key, title, sub, list, opts) => {
    if (!list.length) return null;
    const shown = list.slice(0, 10);
    return (
      <ShopLazy key={key} minH={railW + 110} fallback={<div style={{ display: 'flex', gap: 12, paddingTop: 70, overflow: 'hidden' }}>{[0, 1, 2].map((i) => <ShopSkelTile key={i} w={railW} pal={pal} />)}</div>}>
        <ShopRail title={title} sub={sub} pal={pal} wide={wide} resetKey={shown.map((it) => `${it.kind}:${it.key}`).join('|')} onSeeAll={opts && opts.see ? () => pickCat(opts.see) : null} seeLabel={`See all ${String(title).toLowerCase()}`}>
          {shown.map((it) => tile(it, list, { w: railW, rail: true, ...(opts || {}) }))}
        </ShopRail>
      </ShopLazy>
    );
  };
  const grid = (list, opts) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 12, rowGap: 22 }}>
      {list.map((it) => tile(it, list, { w: tileW, ...(opts || {}) }))}
    </div>
  );
  const day = Math.floor(Date.now() / 86400000);
  const slides = [];
  const heroDrop = shownDrops[0];
  if (heroDrop) {
    const live = dropPhase(heroDrop) === 'live';
    const dset = heroDrop.kind === 'set' ? DECOR_BY_KEY[heroDrop.item_key] : null;
    slides.push({ id: `drop:${heroDrop.id}`, it: { kind: 'drop', key: heroDrop.id }, eyebrow: <ShopLeft to={live ? heroDrop.ends_at : heroDrop.starts_at} pal={pal} before={live ? 'Limited, ends in' : 'Opens in'} color={pal.ink} />, eyebrowText: live ? 'Limited drop' : 'Next drop', title: heroDrop.title, sub: `${dset ? `${shopRarityWord(dset.rarity)} set` : 'Limited bubble'}, only in this drop`, price: heroDrop.price, owned: dropOwned(heroDrop, rewards), art: (h, active) => <ShopHeroArt kind="drop" drop={heroDrop} me={me} pal={pal} h={h} w={gw} active={active} /> });
  }
  if (dealVisible) {
    const dp = shopDealFor(deal, c, deal.kind, deal.key);
    const base = shopBase(c, deal.kind, deal.key);
    slides.push({ id: `deal:${deal.kind}:${deal.key}`, it: { kind: deal.kind, key: deal.key }, eyebrow: <ShopLeft to={deal.ends_at} pal={pal} before="Deal of the day, ends in" color={pal.ink} />, eyebrowText: 'Deal of the day', title: shopNameOf(deal.kind, deal.key), sub: `${shopKindLabel(deal.kind)}, ${shopRarityWord(shopRarityOf(deal.kind, deal.key))}`, price: dp, was: base > dp ? base : null, owned: false, art: (h, active) => <ShopHeroArt kind={deal.kind} k={deal.key} me={me} pal={pal} h={h} w={gw} active={active} /> });
  }
  const legend = shopKeys('set', cxOn).filter((k) => DECOR_BY_KEY[k].rarity === 'legendary' && !DECOR_BY_KEY[k].pair && !DECOR_BY_KEY[k].base && !c.dec(k).full && !(deal && deal.kind === 'set' && deal.key === k));
  if (legend.length) {
    const k = legend[day % legend.length];
    const s = DECOR_BY_KEY[k];
    slides.push({ id: `set:${k}`, it: { kind: 'set', key: k }, eyebrow: s.fresh ? 'New set' : 'Featured set', eyebrowText: 'Featured set', title: s.name, sub: `${shopRarityWord(s.rarity)} set, frame, nameplate and effect`, price: shopBase(c, 'set', k), owned: false, art: (h, active) => <ShopHeroArt kind="set" k={k} me={me} pal={pal} h={h} w={gw} active={active} /> });
  }
  if (cxOn) {
    const th = shopKeys('theme', cxOn).filter((k) => !st('theme', k).owned && !(deal && deal.kind === 'theme' && deal.key === k));
    if (th.length) { const k = th[(day + 3) % th.length]; slides.push({ id: `theme:${k}`, it: { kind: 'theme', key: k }, eyebrow: 'Profile theme', eyebrowText: 'Profile theme', title: shopNameOf('theme', k), sub: `${shopRarityWord(shopRarityOf('theme', k))} theme, behind your profile`, price: shopBase(c, 'theme', k), owned: false, art: (h, active) => <ShopHeroArt kind="theme" k={k} me={me} pal={pal} h={h} w={gw} active={active} /> }); }
  }
  const sp = SI_STICKER_PACKS.filter((p) => !st('stickerpack', p.key).owned);
  if (sp.length) { const k = sp[day % sp.length].key; slides.push({ id: `stickers:${k}`, it: { kind: 'stickerpack', key: k }, eyebrow: 'New stickers', eyebrowText: 'New stickers', title: shopNameOf('stickerpack', k), sub: '12 animated stickers', price: shopBase(c, 'stickerpack', k), owned: false, art: (h, active) => <ShopHeroArt kind="stickerpack" k={k} me={me} pal={pal} h={h} w={gw} active={active} /> }); }
  const limitW = wide ? 300 : Math.round(Math.min(320, gw * 0.8));
  const limited = [
    ...shownDrops.map((d) => {
      const live = dropPhase(d) === 'live';
      const dset = d.kind === 'set' ? DECOR_BY_KEY[d.item_key] : null;
      return <ShopLimitCard key={`d${d.id}`} kind="drop" k={d.item_key} drop={d} me={me} pal={pal} w={limitW} title={d.title} sub={`${dset ? `${shopRarityWord(dset.rarity)} set` : 'Limited bubble'}, ${live ? 'live now' : 'coming soon'}`} to={live ? d.ends_at : d.starts_at} before={live ? 'Ends in' : 'Opens in'} price={d.price} owned={dropOwned(d, rewards)} onOpen={() => openItem('drop', d.id, null)} />;
    }),
    ...(dealVisible ? [<ShopLimitCard key="deal" kind={deal.kind} k={deal.key} me={me} pal={pal} w={limitW} title={shopNameOf(deal.kind, deal.key)} sub={`Deal of the day, ${shopKindLabel(deal.kind).toLowerCase()}`} to={deal.ends_at} before="Ends in" price={shopDealFor(deal, c, deal.kind, deal.key)} was={shopBase(c, deal.kind, deal.key)} owned={false} onOpen={() => openItem(deal.kind, deal.key, null)} />] : []),
  ];
  const freeNote = (freeSets > 0 || freeBubbles > 0) && (
    <div role="button" aria-label="See where your free picks work" onClick={() => pickCat(freeSets > 0 ? 'set' : 'bubble')} className="zchat-press" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: pal.stage, cursor: 'pointer' }}>
      <GiftIcon size={22} color={pal.ink} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, color: pal.ink2 }}><b style={{ color: pal.ink, fontWeight: 700 }}>{freeSets > 0 ? `${freeSets === 1 ? '1 free set' : `${freeSets} free sets`}` : `${freeBubbles === 1 ? '1 free bubble' : `${freeBubbles} free bubbles`}`}</b>{freeSets > 0 ? ' to pick. Any Epic set, all three pieces.' : ' to pick. Any chat bubble you like.'}</div>
      <ChevronRight size={18} color={pal.ink2} />
    </div>
  );
  const q = query.trim().toLowerCase();
  const allKinds = ['set', 'bubble', 'namestyle', 'theme', 'reaction', 'charm', 'stickerpack', 'soundpack', 'typing', 'wallpaper'].filter((k) => !SHOP_CX.includes(k) || cxOn);
  let found = [];
  if (q) {
    const pool = SHOP_CATS.some(([k]) => k === cat && k !== 'foryou') ? [cat] : allKinds;
    const seen = new Set();
    const add = (it) => { const id = `${it.kind}:${it.key}`; if (!seen.has(id)) { seen.add(id); found.push(it); } };
    if (q.length >= 3) SHOP_CATS.filter(([k, l]) => k !== 'foryou' && (pool.includes(k) || cat === 'foryou') && l.toLowerCase().includes(q)).forEach(([k]) => catList(k).forEach(add));
    pool.forEach((k) => shopKeys(k, cxOn).forEach((key) => { if (shopNameOf(k, key).toLowerCase().includes(q)) add({ kind: k, key }); }));
    found = found.slice(0, 60);
  }
  const catLabel = SHOP_VIEWS[cat] || (SHOP_CATS.find(([k]) => k === cat) || [null, ''])[1];
  const forYou = (
    <>
      <ShopFeatured slides={slides} me={me} pal={pal} width={wide ? Math.min(560, gw) : gw} onOpen={(kind, k) => openItem(kind, k, null)} />
      {freeNote}
      {rail('new', 'New', 'Just landed in the Shop', fresh, { meta: 'kind', see: 'new' })}
      {limited.length > 0 && (
        <ShopRail title="Limited time" sub="Here for a short while only" pal={pal} wide={wide} resetKey={limited.map((x) => x.key).join('|')}>{limited}</ShopRail>
      )}
      {!limited.length && drops === null && !waited && (
        <section style={{ marginTop: 30 }}><ShopSkel w={150} h={20} r={8} pal={pal} /><div style={{ display: 'flex', gap: 12, marginTop: 14, overflow: 'hidden' }}><ShopSkel w={limitW} h={Math.round(limitW * 0.62)} r={18} pal={pal} /><ShopSkel w={limitW} h={Math.round(limitW * 0.62)} r={18} pal={pal} /></div></section>
      )}
      {popLoading && !popular.length && !waited ? (
        <section style={{ marginTop: 30 }}><ShopSkel w={110} h={20} r={8} pal={pal} /><div style={{ display: 'flex', gap: 12, marginTop: 14, overflow: 'hidden' }}>{[0, 1, 2].map((i) => <ShopSkelTile key={i} w={railW} pal={pal} />)}</div></section>
      ) : (shopMem.popularErr || popLoading) && !popular.length ? (
        <section style={{ marginTop: 30 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: pal.ink, letterSpacing: '-0.02em' }}>Popular</h2>
          <LoadFail small onRetry={() => { setWaitKey((n) => n + 1); loadPopular(true); }} />
        </section>
      ) : rail('popular', 'Popular', 'What people pick the most', popular.map((p) => ({ kind: p.kind, key: p.key })), { pop: true, see: popular.length > 10 ? 'popular' : null })}
      {rail('wishlist', 'Your wishlist', 'Friends see it when they send you a gift', wished, { meta: 'kind', see: wished.length > 10 ? 'wishlist' : null })}
      {rail('finish', 'Finish your sets', 'Get the pieces you are missing', finish, { see: finish.length > 10 ? 'finish' : null })}
      {SHOP_RAILS.filter(([k]) => !SHOP_CX.includes(k) || cxOn).map(([k, title]) => rail(k, title, SHOP_SUBS[k], catList(k), { see: k }))}
      <ShopLazy minH={railW + 110}><ShopCreatorRail pal={pal} w={railW} wide={wide} /></ShopLazy>
      <div style={{ marginTop: 36, paddingTop: 18, borderTop: `1px solid ${pal.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 13, color: pal.ink2, textAlign: 'center', lineHeight: 1.5, maxWidth: 300 }}>Prices are in coins. Everything you buy is yours to keep and you can send any of it as a gift.</div>
        <div style={{ display: 'flex', gap: 18 }}>
          <span role="button" onClick={() => { hapticTap(); setBuysOpen(true); }} style={{ fontSize: 14, fontWeight: 650, color: pal.link, cursor: 'pointer' }}>Purchase history</span>
          {onOpenCollection && <span role="button" onClick={onOpenCollection} style={{ fontSize: 14, fontWeight: 650, color: pal.link, cursor: 'pointer' }}>Your collection</span>}
        </div>
      </div>
    </>
  );
  const catBody = () => {
    const list = catList(cat);
    const ownedN = list.filter((it) => st(it.kind, it.key).owned).length;
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
          <h2 style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', color: pal.ink }}>{catLabel}</h2>
          <span style={{ fontSize: 13.5, color: pal.ink2, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{ownedN ? `${countWord(list.length, 'item', 'items')}, ${ownedN} owned` : countWord(list.length, 'item', 'items')}</span>
        </div>
        {SHOP_SUBS[cat] && <div style={{ fontSize: 14, color: pal.ink2, marginTop: 4, lineHeight: 1.4 }}>{SHOP_SUBS[cat]}</div>}
        {(cat === 'set' && freeSets > 0) || (cat === 'bubble' && freeBubbles > 0) ? freeNote : null}
        <div style={{ marginTop: 18 }}>{list.length ? grid(list, { meta: SHOP_VIEWS[cat] ? 'kind' : null, pop: cat === 'popular' }) : <EmptyState title="Nothing here yet" text={cat === 'wishlist' ? 'Tap the heart on anything you like.' : 'New things land here when they are ready.'} />}</div>
        {(cat === 'set' || SHOP_PIECES.includes(cat)) && <div style={{ fontSize: 12.5, color: pal.ink2, textAlign: 'center', margin: '26px 12px 0', lineHeight: 1.5 }}>{`Every set has a frame, a nameplate and a profile effect. Each piece is ${decorPartPrice()} coins and a full set is ${decorPartPrice() * 3}.`}</div>}
      </>
    );
  };
  const results = (
    <>
      <div style={{ fontSize: 13.5, color: pal.ink2, margin: '8px 0 16px' }}>{found.length ? `${countWord(found.length, 'result', 'results')}${cat !== 'foryou' && !SHOP_VIEWS[cat] ? ` in ${catLabel.toLowerCase()}` : ''}` : ''}</div>
      {found.length ? grid(found, { meta: 'kind' }) : <EmptyState title={`Nothing called ${query.trim()}`} text="Try another name, or look through the categories." />}
    </>
  );
  const chip = (k, l) => {
    const on = cat === k;
    return <div key={k} data-cat={k} role="tab" aria-selected={on} onClick={() => pickCat(k)} className="zchat-press" style={{ flexShrink: 0, height: 34, padding: '0 15px', borderRadius: 17, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 650, cursor: 'pointer', background: on ? pal.ink : pal.stage, color: on ? pal.bg : pal.ink, whiteSpace: 'nowrap', transition: 'background 0.15s ease, color 0.15s ease' }}>{l}</div>;
  };
  const openKind = open ? open.kind : null;
  const product = open && !(openKind === 'namestyle' && open.key === 'own') && (openKind !== 'drop' || openDrop);
  return (
    <>
    {!inline && <WideDim onClose={onClose} z={625} />}
    <div ref={pageRef} {...edgeBack} className={inline ? 'zchat-tab-in' : 'zchat-panel-open zchat-wide-page zchat-shop-wide'} style={{ ...(inline ? { position: 'relative', flex: 1, minHeight: 0 } : { position: 'fixed', inset: 0, zIndex: 625 }), background: pal.bg, color: pal.ink, display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      <div style={{ flexShrink: 0, background: pal.bg, paddingTop: inline ? 0 : 'env(safe-area-inset-top)', visibility: covered ? 'hidden' : 'visible' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 56, padding: inline ? '0 12px 0 16px' : '0 12px 0 6px' }}>
          {!inline && <div role="button" aria-label="Close the Shop" onClick={onClose} className="zchat-press" style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: pal.ink, flexShrink: 0 }}><ArrowLeft size={24} strokeWidth={2} /></div>}
          <h1 style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: pal.ink }}>Shop</h1>
          {onOpenCollection && <ShopIconBtn label="Your collection" onClick={() => { hapticTap(); onOpenCollection(); }} pal={pal}><CollectionIcon size={20} /></ShopIconBtn>}
          <ShopIconBtn label="Purchase history" onClick={() => { hapticTap(); setBuysOpen(true); }} pal={pal}><ShopReceiptGlyph size={20} /></ShopIconBtn>
          <ShopCoinPill coins={coins} onOpenWallet={onOpenWallet} pal={pal} />
        </div>
        <div style={{ padding: '2px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, borderRadius: 12, background: pal.field, padding: '0 6px 0 12px', color: pal.ink2 }}>
            <ShopSearchGlyph size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value.slice(0, 40))} aria-label="Search the Shop" placeholder="Search the Shop" enterKeyHint="search" autoCapitalize="none" autoCorrect="off" className="zshop-input"
              style={{ flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none', background: 'transparent', color: pal.ink, fontFamily: FONT, fontSize: 16, padding: 0 }} />
            {query && <div role="button" aria-label="Clear search" onClick={() => setQuery('')} className="zchat-press" style={{ width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: pal.ink2, flexShrink: 0 }}><X size={17} /></div>}
          </div>
        </div>
        <div ref={chipsRef} className="zshop-chips" role="tablist" aria-label="Categories" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px 10px', scrollbarWidth: 'none' }}>
          {SHOP_CATS.filter(([k]) => !SHOP_CX.includes(k) || cxOn).map(([k, l]) => chip(k, l))}
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '6px 16px 40px', visibility: covered ? 'hidden' : 'visible' }}>
        {q ? results : cat === 'foryou' ? forYou : catBody()}
      </div>
      {themeTry && (
        <ThemePreviewPage me={me} k={themeTry} startDark={pal.dark} onClose={() => setThemeTry(null)}
          action={cxOwns(rewards, 'theme', themeTry, false) ? { label: me.profile_theme === themeTry ? 'In use' : 'Use this theme', disabled: me.profile_theme === themeTry || !onEquip, onClick: () => { const k = themeTry; setThemeTry(null); if (onEquip) onEquip('theme', k); say(`${PROFILE_THEMES[k].label} is on your profile`); } }
            : { label: `Get it for ${formatCount(shopPrice('theme', themeTry) || 0)} coins`, onClick: () => { const k = themeTry; setThemeTry(null); if (!open || open.key !== k) openItem('theme', k, null); } }} />
      )}
      {open && openKind === 'namestyle' && open.key === 'own' && (
        <OwnStylePage me={me} rewards={rewards} wallet={wallet} onClose={() => setOpen(null)} onOpenWallet={onOpenWallet} onEquip={onEquip} onRefresh={refresh} onGift={onGift ? (kind, k) => onGift(kind, k) : undefined} />
      )}
      {product && (
        <ShopProduct me={me} item={openKind === 'drop' ? { kind: 'drop', key: open.key, drop: openDrop } : open} items={open.items} onPick={(it) => setOpen((o) => ({ ...(o || {}), kind: it.kind, key: it.key }))} rewards={rewards} wallet={wallet}
          onClose={() => setOpen(null)} onOpenWallet={onOpenWallet} onGift={onGift} onEquip={onEquip} onWear={onWear} onRefresh={refresh} onPreviewTheme={(k) => setThemeTry(k)} onOpenItem={(it) => openItem(it.kind, it.key, null)} />
      )}
      {buysOpen && <ShopPurchasesPage uid={me.id} me={me} pal={pal} onClose={() => setBuysOpen(false)} onOpenWallet={onOpenWallet} onOpenItem={(kind, k) => { setBuysOpen(false); openItem(kind, k, null); }} />}
      <ShopToast text={toast} pal={pal} top={inline ? 116 : 'calc(116px + env(safe-area-inset-top))'} />
    </div>
    </>
  );
}

function GiftBoxArt({ open, accent = '#7C5CFC', size = 200 }) {
  const still = reducedMotion();
  const ease = 'cubic-bezier(0.2, 0.9, 0.25, 1.15)';
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', left: '50%', bottom: size * 0.04, width: size * 0.74, height: size * 0.08, transform: 'translateX(-50%)', borderRadius: '50%', background: 'rgba(0,0,0,0.35)', filter: 'blur(6px)' }} />
      {!open && [[16, 30, 0], [176, 52, 0.6], [30, 150, 1.2], [182, 140, 1.8]].map(([x, y, d]) => (
        <svg key={`${x}`} width="18" height="18" viewBox="0 0 16 16" style={{ position: 'absolute', left: (x / 200) * size - 9, top: (y / 200) * size - 9, animation: still ? 'none' : `zchat-twinkle 1.8s ease-in-out ${d}s infinite` }}>
          <path d="M8 0c.6 4.4 1.6 5.4 6 6-4.4.6-5.4 1.6-6 6-.6-4.4-1.6-5.4-6-6 4.4-.6 5.4-1.6 6-6z" fill="#FFE58A" />
        </svg>
      ))}
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, transition: `transform 0.5s ${ease}, opacity 0.45s ease`, transform: open ? 'translateY(26px) scale(0.86)' : 'none', opacity: open ? 0 : 1, animation: !open && !still ? 'zchat-gift-wobble 2.4s ease-in-out infinite' : 'none', transformOrigin: '50% 90%' }}>
        <defs>
          <linearGradient id="zgbody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={accent} /><stop offset="1" stopColor={mixHex(accent, '#000000', 0.62)} /></linearGradient>
          <linearGradient id="zgrib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE58A" /><stop offset="1" stopColor="#F2B52A" /></linearGradient>
        </defs>
        <rect x="36" y="86" width="128" height="94" rx="14" fill="url(#zgbody)" />
        <rect x="36" y="86" width="128" height="22" rx="6" fill="rgba(0,0,0,0.18)" />
        <rect x="90" y="86" width="20" height="94" fill="url(#zgrib)" />
        <path d="M44 96h40" stroke="rgba(255,255,255,0.35)" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, transition: `transform 0.7s ${ease}, opacity 0.5s ease 0.15s`, transform: open ? 'translate(34px, -150px) rotate(28deg)' : 'none', opacity: open ? 0 : 1, transformOrigin: '50% 60%', animation: !open && !still ? 'zchat-gift-wobble 2.4s ease-in-out infinite' : 'none' }}>
        <path d="M100 66c-10-22-40-30-44-12-3 14 22 18 44 12z" fill="url(#zgrib)" stroke="#D9951C" strokeWidth="2" strokeLinejoin="round" />
        <path d="M100 66c10-22 40-30 44-12 3 14-22 18-44 12z" fill="url(#zgrib)" stroke="#D9951C" strokeWidth="2" strokeLinejoin="round" />
        <rect x="28" y="64" width="144" height="30" rx="10" fill="url(#zgbody)" />
        <rect x="88" y="64" width="24" height="30" fill="url(#zgrib)" />
        <circle cx="100" cy="66" r="8" fill="#F2B52A" stroke="#D9951C" strokeWidth="2" />
        <path d="M38 72h46" stroke="rgba(255,255,255,0.4)" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function GiftUnwrapPage({ entry, me, onOpened, onClose, onThank, onWear, onUseBubble, onUseCharm, onUseStyle }) {
  useBackClose(true, onClose);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thanked, setThanked] = useState(false);
  const [fx, setFx] = useState(0);
  const g = entry.gift;
  const from = entry.from;
  const meta = entry.meta && typeof entry.meta === 'object' ? entry.meta : {};
  const first = String((from && from.name) || 'A friend').split(' ')[0];
  const names = Array.isArray(meta.from) ? meta.from.map((x) => String(x || '').slice(0, 30)).filter(Boolean) : [];
  const wrapK = meta.wrap && giftPaper(meta.wrap.p) ? meta.wrap : null;
  const isV = g.kind === 'verified';
  const vt = isV ? VERIFIED_TIERS[g.key] || VERIFIED_TIERS.blue : null;
  const cxg = CX_KINDS.includes(g.kind) ? cxSpec(g.kind, g.key) : null;
  const sig = SI_KINDS.includes(g.kind) ? siSpec(g.kind, g.key) : null;
  const set = !cxg && !sig && !isV && g.key && DECOR_BY_KEY[g.key] ? DECOR_BY_KEY[g.key] : null;
  const accent = isV ? vt.color : meta.bday ? BIRTHDAY_PINK : set && hexLum(set.accent) > 0.08 ? set.accent : g.kind === 'coins' ? '#E9A115' : g.kind === 'reaction' && cxg ? cxg.accent : '#7C5CFC';
  const W = Math.round(Math.min(340, (typeof window === 'undefined' ? 390 : window.innerWidth) - 56));
  const label = isV ? 'a month of ZChat Verified' : sig ? `the ${sig.label} ${siWord(g.kind)}` : g.kind === 'coins' ? coinsText(g.coins) : g.kind === 'bubble' ? `the ${CHAR_BUBBLES[g.key].label} bubble` : g.kind === 'charm' ? `the ${CUSTOM_BADGES[g.key].label}` : cxg ? `the ${cxg.label} ${cxWord(g.kind)}` : `the ${set.name} ${g.kind === 'set' ? 'set' : g.kind}`;
  const headline = names.length > 1 ? `${listText(names.slice(0, 3))}${names.length > 3 ? ` and ${names.length - 3} more` : ''} sent you a gift` : meta.santa ? (from ? `Your Secret Santa was ${first}` : 'Your Secret Santa gift') : meta.bday ? (from ? `Happy birthday from ${first}` : 'Happy birthday') : from ? `${first} sent you a gift` : 'You got a gift';
  const tapOpen = () => {
    if (open) return;
    hapticTap();
    playUiSound('repost');
    setOpen(true);
    onOpened(entry);
    setTimeout(() => { setShown(true); playUiSound('win'); if (g.kind === 'set' || g.kind === 'effect') setFx(Date.now()); }, wrapK && !reducedMotion() ? 640 : 420);
  };
  const thank = async () => {
    if (busy || thanked || !from) return;
    hapticTap();
    setThanked(true);
    const ok = await onThank(from, label);
    if (ok === false) setThanked(false);
  };
  const wear = () => {
    if (busy) return;
    if (g.kind === 'bubble') onUseBubble(g.key);
    else if (g.kind === 'charm') onUseCharm(g.key);
    else if (g.kind === 'typing') setTypingStyleMine(me.id, g.key);
    else if (cxg) { if (onUseStyle && g.kind !== 'reaction') onUseStyle(g.kind, g.kind === 'namestyle' && g.key === 'own' ? nsOwnSaved() || NS_OWN_SAMPLE : g.key); }
    else if (set) onWear(g.kind === 'frame' ? { avatar_frame: set.key } : g.kind === 'nameplate' ? { nameplate: set.key } : { avatar_frame: set.key, nameplate: set.key });
    onClose();
  };
  const pieces = Array.from({ length: 34 }, (_, i) => i);
  const canWear = g.kind !== 'coins' && g.kind !== 'reaction' && g.kind !== 'stickerpack' && g.kind !== 'soundpack' && !isV && (!cxg || !!onUseStyle);
  return (
    <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 702, color: '#FFFFFF', fontFamily: FONT, background: `radial-gradient(120% 70% at 50% 30%, ${accent}55 0%, rgba(8,8,12,0) 60%), #08080C`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden', textAlign: 'center' }}>
      {shown && (set || g.kind === 'effect') && <ProfileEffectLayer effectKey={set.key} runKey={fx} force z={1} />}
      {shown && pieces.map((i) => (
        <span key={i} aria-hidden="true" style={{ position: 'absolute', top: -20, left: `${(i * 89) % 100}%`, width: 7, height: 13, borderRadius: 2, background: [accent, '#FFFFFF', '#FFD66B', '#A78BFF'][i % 4], opacity: 0.9, animation: `zchat-confetti ${2.4 + (i % 5) * 0.35}s linear ${(i % 7) * 0.07}s 1 both` }} />
      ))}
      <div role="button" aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', right: 14, width: 40, height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 3 }}><X size={19} /></div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          {from && <Avatar emoji={from.avatar} name={from.name} size={34} />}
          <div style={{ fontSize: 15, fontWeight: 650, color: 'rgba(255,255,255,0.86)' }}>{headline}</div>
        </div>
        {entry.note && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', maxWidth: 300, lineHeight: 1.45, marginTop: 2 }}>"{entry.note}"</div>}
        {!shown ? (
          <div role="button" aria-label="Open your gift" onClick={tapOpen} style={{ marginTop: 22, cursor: 'pointer' }}>
            {wrapK ? <div style={{ animation: !open && !reducedMotion() ? 'zchat-gift-wobble 2.4s ease-in-out infinite' : 'none', transformOrigin: '50% 90%' }}><WrapBoxArt paper={wrapK.p} ribbon={wrapK.r} size={210} open={open} /></div> : <GiftBoxArt open={open} accent={accent} size={210} />}
            <div style={{ fontSize: 14, fontWeight: 650, color: 'rgba(255,255,255,0.7)', marginTop: 10, opacity: open ? 0 : 1, transition: 'opacity 0.2s ease' }}>Tap to open</div>
          </div>
        ) : (
          <div className="zchat-pop" style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {isV ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${vt.glow} 0%, transparent 70%)`, animation: reducedMotion() ? 'none' : 'zchat-badge-pulse 2s ease-in-out infinite' }} />
                  <VerifiedBadge tier={g.key} size={104} style={{ marginLeft: 0, filter: `drop-shadow(0 10px 30px ${vt.glow})` }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 19, fontWeight: 700 }}>{me.name}<VerifiedBadge tier={g.key} size={18} /></div>
              </div>
            ) : g.kind === 'coins' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <CoinIcon size={96} />
                <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>+{formatCount(g.coins)}</div>
                <div style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.65)' }}>Added to your coins</div>
              </div>
            ) : g.kind === 'bubble' ? (
              <div style={{ width: '100%', borderRadius: 22, padding: '18px 14px 20px', background: 'rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ alignSelf: 'flex-start', maxWidth: '78%', background: '#26262E', borderRadius: 18, padding: '8px 13px', fontSize: 14.5 }}>Is that a new bubble?</div>
                <CharBubbleSample k={g.key} text={`Yes, the ${CHAR_BUBBLES[g.key].label.toLowerCase()}!`} cw={52} fontSize={14.5} />
              </div>
            ) : g.kind === 'charm' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <CharmPreview charm={g.key} size={110} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 19, fontWeight: 700 }}>{me.name}<CharmPreview charm={g.key} size={20} /></div>
              </div>
            ) : g.kind === 'namestyle' && cxg ? (
              <div style={{ width: '100%', borderRadius: 22, padding: '26px 16px', background: 'rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...NS_ROOM }}><StyledName name={me.name || 'You'} k={g.key === 'own' ? nsOwnSaved() || NS_OWN_SAMPLE : g.key} dark /></div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>@{me.username}</div>
              </div>
            ) : g.kind === 'theme' && cxg ? (
              <ThemeArt k={g.key} me={me} w={Math.round(W * 0.62)} h={Math.round(W * 0.74)} dark radius={22} />
            ) : g.kind === 'reaction' && cxg ? (
              <SuperFace k={g.key} size={124} dark />
            ) : sig ? (
              <SiItemArt kind={g.kind} k={g.key} me={me} size={Math.round(W * 0.6)} dark />
            ) : (
              <DecorHero frameKey={g.kind === 'nameplate' ? (isDecorKey(me.avatar_frame) ? me.avatar_frame : null) : set.key} plateKey={g.kind === 'frame' ? (isDecorKey(me.nameplate) ? me.nameplate : null) : set.key} width={W} photo={me.avatar} name={me.name} username={me.username} verified={me.verified} custom={me.custom_badge} gapColor="#08080C" />
            )}
            <div style={{ fontSize: 23, fontWeight: 800, marginTop: 14, letterSpacing: '-0.01em' }}>{isV ? 'ZChat Verified' : g.kind === 'coins' ? (names.length > 1 ? 'Coins from your friends' : 'Coins from a friend') : shopItemName(g.kind === 'set' || g.kind === 'frame' || g.kind === 'nameplate' || g.kind === 'effect' ? 'set' : g.kind, g.key)}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.62)', marginTop: 4, lineHeight: 1.45, maxWidth: 320 }}>{isV ? (g.until ? `Your badge is on until ${fmtDate(new Date(g.until), { month: 'long', day: 'numeric' })}. If you pay for Verified yourself, you can stop your plan and keep the badge until then.` : 'Your badge is on for a month.') : g.kind === 'coins' ? 'Spend them in the Shop or send them on.' : g.kind === 'reaction' ? 'It is yours to keep. Hold any message to send it.' : `It is yours to keep${g.kind === 'set' ? ', with its profile effect' : ''}.`}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 22 }}>
              {canWear && <button type="button" disabled={busy} onClick={wear} className="zchat-press" style={{ height: 52, borderRadius: 15, border: 'none', background: '#7C5CFC', color: '#FFFFFF', fontFamily: FONT, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{g.kind === 'bubble' || g.kind === 'charm' || cxg ? 'Use it now' : 'Wear it now'}</button>}
              {from && <button type="button" disabled={busy || thanked} onClick={thank} className="zchat-press" style={{ height: 50, borderRadius: 15, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: FONT, fontSize: 15.5, fontWeight: 650, cursor: thanked ? 'default' : 'pointer' }}>{thanked ? `Thanks sent to ${first}` : `Say thanks to ${first}`}</button>}
              <button type="button" onClick={onClose} className="zchat-press" style={{ height: 44, borderRadius: 14, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.7)', fontFamily: FONT, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export function BagComposerSheet({ uid, group, peer, members, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const w = useWallet(uid);
  const coins = w ? w.coins : 0;
  const most = group ? Math.max(2, Math.min(20, (members || 2) - 1)) : 1;
  const [slots, setSlots] = useState(group ? Math.min(5, most) : 1);
  const [text, setText] = useState('100');
  const [note, setNote] = useState('');
  const total = Math.min(5000, Math.floor(Number(text) || 0));
  const share = slots ? Math.floor(total / slots) : 0;
  const extra = total - share * slots;
  const ok = total >= slots && total <= coins && total > 0;
  const first = peer ? String(peer.name || '').split(' ')[0] || 'them' : '';
  const step = (n) => { hapticTap(); setSlots((v) => Math.max(2, Math.min(20, v + n))); };
  const btn = (lbl, on, dis) => <div role="button" aria-label={lbl} aria-disabled={dis || undefined} onClick={dis ? undefined : on} className={dis ? undefined : 'zchat-press'} style={{ width: 40, height: 40, borderRadius: 20, background: theme.soft, color: dis ? theme.muted2 : theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, cursor: dis ? 'default' : 'pointer', userSelect: 'none' }}>{lbl === 'One less person' ? '−' : '+'}</div>;
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, maxHeight: '92%', overflowY: 'auto', background: theme.panelBg, borderRadius: '22px 22px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: theme.ink }}>Coin gift bag</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: theme.muted, marginTop: 1 }}><CoinIcon size={14} />You have {formatCount(coins)} {coins === 1 ? 'coin' : 'coins'}</div>
              </div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
          </div>
          <div style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 0' }}><CoinPouchArt size={84} still /></div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'text' }}>
              <CoinIcon size={30} />
              <input value={text} inputMode="numeric" pattern="[0-9]*" aria-label="Coins in the bag" onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                style={{ width: `${Math.max(2, text.length) * 0.62 + 0.4}em`, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 44, fontWeight: 750, letterSpacing: '-0.02em', textAlign: 'center', padding: 0, fontVariantNumeric: 'tabular-nums' }} />
            </label>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: total > coins ? theme.danger : theme.muted, marginTop: 2 }}>{total > coins ? `You have ${formatCount(coins)} ${coins === 1 ? 'coin' : 'coins'}` : 'Up to 5,000 coins in one bag'}</div>
            <SegmentedControl style={{ marginTop: 12 }} value={[50, 100, 250, 500].includes(total) ? total : null} onChange={(n) => { hapticTap(); setText(String(n)); }} options={[50, 100, 250, 500].map((n) => [n, formatCount(n)])} />
            {group ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, padding: '10px 14px', borderRadius: 16, background: theme.soft }}>
                <Users size={21} strokeWidth={1.7} color={theme.ink} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 650, color: theme.ink }}>{slots} people can open it</div>
                  <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>{share > 0 ? `${coinsText(share)} each${extra ? `, the last one gets ${coinsText(share + extra)}` : ''}` : 'Put in at least a coin for each person'}</div>
                </div>
                {btn('One less person', () => step(-1), slots <= 2)}
                <div aria-live="polite" style={{ minWidth: 22, textAlign: 'center', fontSize: 17, fontWeight: 800, color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{slots}</div>
                {btn('One more person', () => step(1), slots >= 20)}
              </div>
            ) : (
              <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', marginTop: 14 }}>Only {first} can open it.</div>
            )}
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 60))} placeholder="Add a note" aria-label="Gift bag note" style={{ ...inputStyle(theme), fontSize: 15.5, marginTop: 14 }} />
            <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 2px 0', lineHeight: 1.5 }}>{group ? 'The first people to tap Open share it equally.' : `${first} opens it from the chat.`} The coins leave your wallet now, and anything not opened in 24 hours comes back to you.</div>
            <div style={{ marginTop: 14 }}><BigButton label={total > coins ? `You need ${moreCoinsText(total - coins)}` : total < slots ? 'Add more coins' : `Send the bag for ${formatCount(total)} coins`} disabled={!ok} onClick={() => onSend({ total, slots, note: note.trim() || null })} /></div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
function itemsText(n) {
  return `${n} ${n === 1 ? 'item' : 'items'}`;
}
const TRADE_KINDS = ['frame', 'nameplate', 'effect', 'charm', 'bubble', 'namestyle', 'theme', 'reaction'];
const TRADE_TABS = [['frame', 'Frames'], ['nameplate', 'Plates'], ['effect', 'Effects'], ['charm', 'Charms'], ['bubble', 'Bubbles'], ['styles', 'Styles']];
const tradeTabOf = (kind) => (CX_KINDS.includes(kind) ? 'styles' : kind);
const TRADE_MAX_COINS = 10000;
const TRADE_MAX_ITEMS = 10;
function tradeKnown(kind, key) {
  if (kind === 'frame' || kind === 'nameplate' || kind === 'effect') return isDecorKey(key);
  if (kind === 'bubble') return !!CHAR_BUBBLES[key];
  if (kind === 'charm') return !!CUSTOM_BADGES[key];
  if (CX_KINDS.includes(kind)) return cxKnown(kind, key);
  return !!key;
}
function tradeShortName(kind, key) {
  if (kind === 'frame' || kind === 'nameplate' || kind === 'effect') return DECOR_BY_KEY[key] ? DECOR_BY_KEY[key].name : adminWords(key);
  if (kind === 'bubble') return CHAR_BUBBLES[key] ? CHAR_BUBBLES[key].label : adminWords(key);
  if (kind === 'charm') return CUSTOM_BADGES[key] ? CUSTOM_BADGES[key].label.replace(/ charm$/i, '') : adminWords(key);
  if (CX_KINDS.includes(kind)) return cxSpec(kind, key) ? cxSpec(kind, key).label : adminWords(key);
  return adminWords(key);
}

function TradeTile({ item, size, photo, name, on, note, disabled, onPick }) {
  const { theme } = useTheme();
  const label = tradeItemName(item.kind, item.key);
  return (
    <div role="checkbox" aria-checked={!!on} aria-disabled={disabled || undefined} aria-label={note ? `${label}, ${note}` : label} onClick={disabled ? undefined : onPick} className={disabled ? undefined : 'zchat-press'}
      style={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.42 : 1 }}>
      <div style={{ position: 'relative', borderRadius: Math.round(size * 0.26), boxShadow: on ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${theme.coral}` : 'none', transition: 'box-shadow 160ms ease-out' }}>
        <TradeArt kind={item.kind} k={item.key} size={size} photo={photo} name={name} />
        {on && <div aria-hidden="true" style={{ position: 'absolute', top: 5, right: 5, width: 20, height: 20, borderRadius: 10, background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}><Check size={13} strokeWidth={3} color="#FFFFFF" /></div>}
      </div>
      <div style={{ alignSelf: 'stretch', marginTop: 6, fontSize: 12, fontWeight: 600, color: theme.ink, textAlign: 'center', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{tradeShortName(item.kind, item.key)}</div>
      {note && <div style={{ alignSelf: 'stretch', fontSize: 11, color: theme.muted, textAlign: 'center', lineHeight: 1.25, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note}</div>}
    </div>
  );
}

export function TradePickSheet({ title, items, chosen, blocked, photo, name, loading, empty, onDone, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const kinds = TRADE_TABS.filter(([k]) => items.some((x) => tradeTabOf(x.kind) === k));
  const [tab, setTab] = useState(() => {
    const firstPicked = chosen[0] && kinds.find(([k]) => k === tradeTabOf(chosen[0].kind));
    return firstPicked ? firstPicked[0] : kinds[0] ? kinds[0][0] : 'frame';
  });
  const [sel, setSel] = useState(() => chosen.map((x) => `${x.kind}:${x.key}`));
  const [hint, setHint] = useState('');
  useEffect(() => { if (!kinds.some(([k]) => k === tab) && kinds[0]) setTab(kinds[0][0]); }, [kinds.length]);
  const shown = items.filter((x) => tradeTabOf(x.kind) === tab);
  const toggle = (x) => {
    const key = `${x.kind}:${x.key}`;
    hapticTap();
    setSel((cur) => {
      if (cur.includes(key)) { setHint(''); return cur.filter((k) => k !== key); }
      if (cur.length >= TRADE_MAX_ITEMS) { setHint(`Up to ${TRADE_MAX_ITEMS} items on each side.`); return cur; }
      return [...cur, key];
    });
  };
  const done = () => {
    const list = sel.map((s) => { const i = s.indexOf(':'); return { kind: s.slice(0, i), key: s.slice(i + 1) }; });
    onDone(list);
  };
  const cols = typeof window !== 'undefined' && window.innerWidth < 370 ? 3 : 4;
  const size = Math.max(60, Math.min(78, Math.floor(((typeof window !== 'undefined' ? Math.min(window.innerWidth, 480) : 390) - 40 - (cols - 1) * 10) / cols)));
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, height: '82%', background: theme.panelBg, borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div {...drag.sheetProps} data-sheet-handle="true" style={{ flexShrink: 0, touchAction: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 12px' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 17, fontWeight: 700, color: theme.ink }}>{title}</div>
              <div role="button" aria-label="Close" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} style={{ width: 34, height: 34, borderRadius: 17, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>
            </div>
            {kinds.length > 1 && <SegmentedControl dense style={{ margin: '0 20px 12px' }} value={tab} onChange={(k) => { hapticTap(); setTab(k); }} options={kinds} />}
          </div>
          <div data-sheet-scroll="true" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '6px 20px 10px' }}>
            {loading && !items.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 10 }}>{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="zmap-shimmer" style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), background: theme.soft, justifySelf: 'center' }} />)}</div>
            ) : !items.length ? (
              <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                <div style={{ maxWidth: 240, margin: '0 auto 12px' }}><SpotArt k="saved" dark={theme.dark} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink }}>{empty[0]}</div>
                <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>{empty[1]}</div>
              </div>
            ) : (
              <div role="group" aria-label={title} style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, columnGap: 10, rowGap: 14 }}>
                {shown.map((x) => {
                  const key = `${x.kind}:${x.key}`;
                  const why = blocked(x);
                  return <TradeTile key={key} item={x} size={size} photo={photo} name={name} on={sel.includes(key)} note={why} disabled={!!why && !sel.includes(key)} onPick={() => toggle(x)} />;
                })}
              </div>
            )}
          </div>
          <div style={{ padding: '10px 20px 0', flexShrink: 0 }}>
            {hint && <div role="status" style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', paddingBottom: 8 }}>{hint}</div>}
            <BigButton label={sel.length ? `Done, ${itemsText(sel.length)}` : 'Done'} onClick={done} />
          </div>
        </div>
      </div>
    </Portal>
  );
}

function tradeWhyText(x) {
  if (!x || !x.why) return '';
  if (x.why === 'new') {
    const ms = Date.parse(x.ready_at || 0) - Date.now();
    const h = Math.max(1, Math.ceil(ms / 3600000));
    return ms > 0 ? `Tradeable in ${h} ${h === 1 ? 'hour' : 'hours'}` : 'Tradeable soon';
  }
  if (x.why === 'time') return 'Runs out';
  if (x.why === 'open') return 'In another offer';
  return 'Not tradeable';
}

function TradeCoinsRow({ label, sub, value, max, onChange, danger }) {
  const { theme } = useTheme();
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => { if ((Number(text) || 0) !== value) setText(value ? String(value) : ''); }, [value]);
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 58, padding: '6px 2px', cursor: 'text' }}>
      <CoinIcon size={24} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: theme.ink }}>{label}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: danger ? theme.danger : theme.muted, marginTop: 1 }}>{sub}</span>
      </span>
      <input value={text} inputMode="numeric" pattern="[0-9]*" placeholder="0" aria-label={label} enterKeyHint="done"
        onChange={(e) => { const d = String(e.target.value).replace(/[^0-9]/g, '').slice(0, 5); const n = Math.min(max, Number(d) || 0); setText(d ? String(n) : ''); onChange(n); }}
        style={{ width: 104, height: 42, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontFamily: FONT, fontSize: 17, fontWeight: 700, textAlign: 'right', padding: '0 12px', boxSizing: 'border-box', outline: 'none', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }} />
    </label>
  );
}

export function TradePage({ uid, me, peer, base, onClose, onSend }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const w = useWallet(uid);
  const first = String(peer.name || '').split(' ')[0] || 'them';
  const [setup, setSetup] = useState(() => tradeMem.setup.get(peer.id) || null);
  const [err, setErr] = useState('');
  const start = (() => {
    if (base) { const s = tradeSides(base, uid); return { give: s.give, get: s.get, giveCoins: s.giveCoins, getCoins: s.getCoins }; }
    return tradeMem.draft.get(peer.id) || { give: [], get: [], giveCoins: 0, getCoins: 0 };
  })();
  const [give, setGive] = useState(start.give);
  const [get, setGet] = useState(start.get);
  const [giveCoins, setGiveCoins] = useState(start.giveCoins);
  const [getCoins, setGetCoins] = useState(start.getCoins);
  const [pick, setPick] = useState(null);
  useEffect(() => { tradeLive(uid); }, [uid]);
  useEffect(() => { if (!base) tradeMem.draft.set(peer.id, { give, get, giveCoins, getCoins }); }, [give, get, giveCoins, getCoins]);
  useEffect(() => {
    let alive = true;
    (async () => {
      let res;
      try { res = await supabase.rpc('zchat_trade_setup', { p_other: peer.id }); } catch (e) { res = { error: e }; }
      if (!alive) return;
      if (res.error) {
        if (rpcMissing(res.error)) { tradeMem.off = true; setErr('Trading switches on once the latest ZChat setup is finished.'); } else if (!tradeMem.setup.get(peer.id)) setErr(friendlyError(res.error, 'Could not load your items. Try again.'));
        return;
      }
      const row = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!row || !row.ok) { setErr((row && row.reason) || 'You cannot trade with this person.'); return; }
      const keep = (list) => (Array.isArray(list) ? list : []).filter((x) => x && TRADE_KINDS.includes(x.kind) && tradeKnown(x.kind, x.key));
      const s = { mine: keep(row.mine), theirs: keep(row.theirs), has: Array.isArray(row.they_have) ? row.they_have.map(String) : [], open: row.open ? tradeNorm(row.open) : null, coins: Math.max(0, Number(row.coins) || 0) };
      if (row.open) tradePut([row.open]);
      tradeMem.setup.set(peer.id, s);
      setErr('');
      setSetup(s);
      const okMine = new Set(s.mine.filter((x) => !x.why).map((x) => `${x.kind}:${x.key}`));
      const okTheirs = new Set(s.theirs.map((x) => `${x.kind}:${x.key}`));
      const theyHave = new Set(s.has);
      setGive((cur) => cur.filter((x) => okMine.has(`${x.kind}:${x.key}`) && !theyHave.has(`${x.kind}:${x.key}`)));
      setGet((cur) => cur.filter((x) => okTheirs.has(`${x.kind}:${x.key}`)));
    })();
    return () => { alive = false; };
  }, [peer.id]);
  const open = setup && setup.open && tradeStatusOf(setup.open) === 'pending' ? setup.open : null;
  const replaces = base ? base.id : open ? open.id : null;
  const balance = w && w.ready ? w.coins : setup ? setup.coins : 0;
  const mineKeys = new Set(((setup && setup.mine) || []).map((x) => `${x.kind}:${x.key}`));
  const theirKeys = new Set([...((setup && setup.has) || []), ...((setup && setup.theirs) || []).map((x) => `${x.kind}:${x.key}`)]);
  const tooMuch = giveCoins > balance;
  const ready = !err && (give.length + get.length > 0) && (give.length > 0 || giveCoins > 0) && (get.length > 0 || getCoins > 0) && !tooMuch;
  const missing = !give.length && !giveCoins ? 'Pick what you give' : !get.length && !getCoins ? 'Pick what you get' : !(give.length + get.length) ? 'Add at least one item' : '';
  const send = async () => {
    if (!ready) return;
    if (giveCoins > 0 && !(await spendGate(`Offer ${coinsText(giveCoins)} to ${first}`, { coins: giveCoins, send: true }))) return;
    onSend({ peer, give, get, giveCoins, getCoins, replaces });
  };
  const tiles = (list, side) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '2px 0 4px' }}>
      {list.map((x) => (
        <div key={`${x.kind}:${x.key}`} style={{ position: 'relative', width: x.kind === 'nameplate' ? 126 : 72 }}>
          <TradeArt kind={x.kind} k={x.key} size={72} photo={side === 'give' ? peer.avatar : me.avatar} name={side === 'give' ? peer.name : me.name} wide />
          <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.ink, marginTop: 5, textAlign: 'center', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>{tradeItemName(x.kind, x.key)}</div>
          <div role="button" aria-label={`Remove ${tradeItemName(x.kind, x.key)}`} onClick={() => { hapticTap(); (side === 'give' ? setGive : setGet)((cur) => cur.filter((y) => !(y.kind === x.kind && y.key === x.key))); }} className="zchat-press"
            style={{ position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, background: theme.dark ? '#3A3942' : '#FFFFFF', boxShadow: '0 1px 4px rgba(0,0,0,0.25)', color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} strokeWidth={2.4} /></div>
        </div>
      ))}
      {list.length < TRADE_MAX_ITEMS && (
        <div role="button" aria-label={side === 'give' ? 'Add items you give' : 'Add items you get'} onClick={() => { hapticTap(); setPick(side); }} className="zchat-press" style={{ width: 72, cursor: 'pointer' }}>
          <div style={{ width: 72, height: 72, borderRadius: 19, boxSizing: 'border-box', border: `1.5px dashed ${theme.dark ? 'rgba(255,255,255,0.22)' : 'rgba(17,17,19,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink2 }}><Plus size={24} strokeWidth={1.8} /></div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: theme.muted, marginTop: 5, textAlign: 'center' }}>{list.length ? 'Add more' : 'Add items'}</div>
        </div>
      )}
    </div>
  );
  const mineList = ((setup && setup.mine) || []).filter((x) => x.why !== 'time');
  const theirList = ((setup && setup.theirs) || []).filter((x) => !mineKeys.has(`${x.kind}:${x.key}`));
  const pickGiveWhy = (x) => (theirKeys.has(`${x.kind}:${x.key}`) ? `${first} has it` : x.why ? tradeWhyText(x) : '');
  return (
    <FullPage title={`Trade with ${first}`} onBack={onClose} zIndex={770}
      footer={err ? null : (
        <>
          {!ready && missing && <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', paddingBottom: 8 }}>{missing}</div>}
          <BigButton label={replaces ? 'Send new offer' : 'Send offer'} disabled={!ready} onClick={send} />
        </>
      )}>
      {err ? (
        <div style={{ textAlign: 'center', padding: '28px 12px' }}>
          <div style={{ maxWidth: 260, margin: '0 auto 14px' }}><SpotArt k="nothing" dark={theme.dark} /></div>
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.ink }}>{tradeMem.off ? 'Trading is not on yet' : 'You cannot trade right now'}</div>
          <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>{err}</div>
        </div>
      ) : (
        <>
          {open && !base && (
            <div role="note" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', margin: '6px 0 2px', padding: '11px 12px', borderRadius: 14, background: theme.soft, fontSize: 13, color: theme.ink2, lineHeight: 1.45 }}>
              <TradeIcon size={18} color={kitOnInk(theme)} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{`You and ${first} already have an open offer. Sending this one replaces it.`}</span>
            </div>
          )}
          <KitSection title="You give" right={give.length ? `${give.length} of ${TRADE_MAX_ITEMS}` : null} style={{ marginTop: 14 }}>
            {tiles(give, 'give')}
            <TradeCoinsRow label="Coins you give" sub={`You have ${coinsText(balance)}`} danger={tooMuch} value={giveCoins} max={TRADE_MAX_COINS} onChange={setGiveCoins} />
          </KitSection>
          <div style={{ height: 1, background: theme.hair, margin: '8px 0 0' }} />
          <KitSection title="You get" right={get.length ? `${get.length} of ${TRADE_MAX_ITEMS}` : null} style={{ marginTop: 16 }}>
            {tiles(get, 'get')}
            <TradeCoinsRow label="Coins you ask for" sub={`Up to ${TRADE_MAX_COINS.toLocaleString('en-US')}`} value={getCoins} max={TRADE_MAX_COINS} onChange={setGetCoins} />
          </KitSection>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '14px 2px 4px' }}>{`${first} has 48 hours to answer and can send back a counter offer. Nothing moves until it is accepted. Items you got in the last day and items that run out cannot be traded.`}</div>
        </>
      )}
      {pick === 'give' && (
        <TradePickSheet title="What you give" items={mineList} chosen={give} blocked={pickGiveWhy} photo={peer.avatar} name={peer.name} loading={!setup}
          empty={['Nothing to trade yet', 'Items you keep forever show up here a day after you get them.']}
          onClose={() => setPick(null)} onDone={(list) => { setPick(null); setGive(list); }} />
      )}
      {pick === 'get' && (
        <TradePickSheet title={`What you want from ${first}`} items={theirList} chosen={get} blocked={() => ''} photo={me.avatar} name={me.name} loading={!setup}
          empty={[`${first} has nothing to trade yet`, `When ${first} has items you do not have, they show up here.`]}
          onClose={() => setPick(null)} onDone={(list) => { setPick(null); setGet(list); }} />
      )}
    </FullPage>
  );
}
const BUBBLE_PRICE = 100;
async function claimFreeBubble(key) {
  const { data, error } = await supabase.rpc('zchat_claim_free_bubble', { p_key: key });
  const row = Array.isArray(data) ? data[0] : data;
  if (error) return { error: rpcFailText('Free bubble pick', error, 'Free bubbles switch on once the latest ZChat setup is finished.') };
  if (!row || !row.ok) return { error: (row && row.reason) || 'That did not work. Try again.' };
  return { ok: true, left: Number(row.left) || 0, set: { freeBubbles: Math.max(0, Number(row.left) || 0) } };
}
function BubbleCard({ k, on, status, statusTone, onPick }) {
  const { theme } = useTheme();
  const spec = CHAR_BUBBLES[k];
  const label = spec ? spec.label : 'Classic';
  const tone = statusTone === 'own' ? (theme.dark ? '#5EE0A0' : '#14935A') : statusTone === 'free' ? theme.coral : theme.muted;
  return (
    <div role="button" aria-label={`Bubble ${label}${spec && spec.fresh ? ', new' : ''}${status ? `, ${status}` : ''}`} aria-pressed={on} onClick={onPick} className="zchat-press"
      style={{ position: 'relative', borderRadius: 18, padding: '18px 12px 11px', cursor: 'pointer', background: theme.dark ? 'rgba(255,255,255,0.045)' : '#F5F5F7', boxShadow: on ? `inset 0 0 0 2px ${theme.coral}` : 'none', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      {spec && spec.fresh && statusTone !== 'own' && <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, padding: '2px 7px', borderRadius: 8, background: '#7C5CFC', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800 }}>New</div>}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 58, justifyContent: 'flex-end', paddingRight: 2 }}>
        <CharBubbleSample k={k} text="Hi there" cw={44} fontSize={13.5} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        {statusTone === 'coin'
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700, color: theme.ink, flexShrink: 0 }}><CoinIcon size={13} />{status}</span>
          : status ? <span style={{ fontSize: 12, fontWeight: 700, color: tone, flexShrink: 0 }}>{status}</span> : null}
      </div>
    </div>
  );
}
function useBubbleShop(uid, startKey, onClose, onOpenWallet, inline = false) {
  const { theme, bubbleStyle, setBubbleStyle } = useTheme();
  const wallet = useWallet(uid);
  const owned = useOwnedBubbles(uid);
  const [preview, setPreview] = useState(() => bubbleKeyOf(startKey) || bubbleKeyOf(bubbleStyle) || 'classic');
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null);
  const [note, setNote] = useState('');
  const noteTimer = useRef(0);
  const say = (t) => { setNote(t); clearTimeout(noteTimer.current); noteTimer.current = setTimeout(() => setNote(''), 2400); };
  useEffect(() => () => clearTimeout(noteTimer.current), []);
  const ownSet = new Set(owned || []);
  const coins = wallet && wallet.ready ? wallet.coins : 0;
  const freeLeft = wallet && wallet.ready ? wallet.freeBubbles || 0 : 0;
  const wearing = bubbleKeyOf(bubbleStyle) || 'classic';
  const isOwned = (k) => k === 'classic' || ownSet.has(k);
  const statusOf = (k) => {
    if (k === wearing) return ['In use', inline ? 'use' : 'own'];
    if (k === 'classic') return ['Free', 'own'];
    if (ownSet.has(k)) return [inline ? 'Owned' : 'Yours', 'own'];
    if (freeLeft > 0) return ['Free', 'free'];
    return [String(BUBBLE_PRICE), 'coin'];
  };
  const wear = (k) => { setBubbleStyle(k); hapticTap(); playUiSound('like'); say(k === 'classic' ? 'Back to the classic bubble' : `${CHAR_BUBBLES[k].label} is on. Everyone sees it.`); };
  const getNow = (k, job) => {
    const was = bubbleStyle;
    wear(k);
    job.then((r) => { if (!r.error) return; setBubbleStyle(was); say(r.error); });
  };
  const getFree = async (k) => {
    if (busy) return;
    getNow(k, moneyRun(uid, { freeBubbles: 1, grants: [['bubble', k]], run: () => claimFreeBubble(k) }));
  };
  const buy = async (k) => {
    setAsk(null);
    if (busy) return;
    if (!(await spendGate(`Get the ${CHAR_BUBBLES[k] ? CHAR_BUBBLES[k].label : ''} bubble for ${BUBBLE_PRICE} coins`, { coins: BUBBLE_PRICE }))) return;
    getNow(k, moneyRun(uid, { coins: BUBBLE_PRICE, grants: [['bubble', k]], run: () => buyShopItem('bubble', k) }));
  };
  const spec = CHAR_BUBBLES[preview];
  let action = null;
  if (preview === wearing) action = inline ? { label: 'In use', on: null, plain: true } : { label: 'Done', on: onClose };
  else if (isOwned(preview)) action = { label: preview === 'classic' ? 'Use the classic bubble' : 'Use this bubble', on: () => wear(preview) };
  else if (freeLeft > 0) action = { label: busy ? 'Getting it' : `Get it free, ${freeLeft} left`, on: () => getFree(preview) };
  else if (coins >= BUBBLE_PRICE) action = { label: `Get it for ${BUBBLE_PRICE} coins`, on: () => setAsk(preview) };
  else action = { label: `You need ${moreCoinsText(BUBBLE_PRICE - coins)}`, on: onOpenWallet || null, plain: true };
  return { theme, wallet, coins, freeLeft, wearing, preview, setPreview, busy, ask, setAsk, note, statusOf, action, spec, buy, keys: ['classic', ...CHAR_BUBBLE_KEYS] };
}
export function BubbleShopPage({ uid, onClose, onGift, onOpenWallet, startKey, zIndex = 650 }) {
  useBackClose(true, onClose);
  const { theme, wallet, coins, freeLeft, preview, setPreview, busy, ask, setAsk, note, statusOf, action, spec, buy } = useBubbleShop(uid, startKey, onClose, onOpenWallet);
  return (
    <FullPage title="Chat bubbles" subtitle="Everyone sees your bubble" onBack={onClose} zIndex={zIndex} pad={false}
      right={wallet && wallet.ready ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 700, color: theme.ink, paddingRight: 6 }}><CoinIcon size={16} />{formatCount(coins)}</div> : null}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          {preview !== 'classic' && onGift && (
            <div role="button" aria-label={`Gift the ${spec ? spec.label : ''} bubble`} onClick={() => onGift(preview)} className="zchat-press" style={{ width: 48, height: 48, borderRadius: 12, background: theme.rowBg, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><GiftBoxIcon size={22} /></div>
          )}
          <BigButton label={action.label} tone={action.plain ? 'plain' : 'accent'} disabled={busy || !action.on} onClick={action.on} />
        </div>
      )}
      bodyStyle={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, padding: '6px 16px 12px' }}>
        <div aria-label="Preview" style={{ borderRadius: 20, padding: '16px 14px 18px', background: theme.dark ? '#0F0F13' : '#FFFFFF', boxShadow: `inset 0 0 0 1px ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ alignSelf: 'flex-start', maxWidth: '78%', background: theme.bubbleThem, color: theme.ink, borderRadius: 18, padding: '8px 13px', fontSize: 14.5, lineHeight: 1.3 }}>Wait, is that a new bubble?</div>
          <CharBubbleSample k={preview} text={spec ? `Yes! Meet my ${spec.label.toLowerCase()}` : 'Yes, the classic one'} cw={52} fontSize={14.5} />
        </div>
        {freeLeft > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 4px 0' }}>
            <GiftBoxIcon size={20} color={theme.coral} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: theme.ink, lineHeight: 1.35 }}><b style={{ fontWeight: 700 }}>{freeLeft === 1 ? '1 free pick left' : `${freeLeft} free picks left`}</b><span style={{ color: theme.muted }}>. Choose any bubble you like.</span></div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '2px 16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
          {['classic', ...CHAR_BUBBLE_KEYS].map((k) => {
            const [st, tone] = statusOf(k);
            return <BubbleCard key={k} k={k} on={preview === k} status={st} statusTone={tone} onPick={() => { hapticTap(); setPreview(k); }} />;
          })}
        </div>
        <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '14px 2px 0' }}>Bubbles are yours to keep. Your friends see your bubble on every message you send.</div>
      </div>
      {ask && <ConfirmSheet title={`Get the ${CHAR_BUBBLES[ask].label} bubble?`} text={`It costs ${BUBBLE_PRICE} coins and it is yours to keep.`} confirmLabel={`Pay ${BUBBLE_PRICE} coins`} danger={false} zIndex={zIndex + 10} onCancel={() => setAsk(null)} onConfirm={() => buy(ask)} />}
      {note && <div className="zchat-pop" role="status" style={{ position: 'fixed', left: '50%', bottom: 'calc(96px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)', zIndex: zIndex + 20, padding: '9px 16px', borderRadius: 18, background: theme.dark ? '#2A2930' : '#111113', color: '#FFFFFF', fontSize: 13.5, fontWeight: 600, width: 'max-content', maxWidth: 'calc(100vw - 40px)', boxSizing: 'border-box', textAlign: 'center', pointerEvents: 'none' }}>{note}</div>}
    </FullPage>
  );
}
const LIVE_GIFTS = [10, 50, 100, 500];
async function liveSendGift(amount) {
  if (!liveRt.id || liveRt.role !== 'listener' || !liveRt.me) return false;
  const n = Math.floor(Number(amount) || 0);
  if (n < 1) return false;
  const uid = liveRt.me.id;
  const cid = liveCid();
  const tok = walletSpend(uid, { coins: -n });
  liveRt.comments = [...liveRt.comments, { id: cid, cid, u: uid, gift: n, at: Date.now(), pending: true }].slice(-60);
  const g = liveRt.goal;
  if (g && !g.pending) liveRt.goalFloor = { id: g.id, v: Math.max(Number(g.progress) || 0, liveRt.goalFloor && String(liveRt.goalFloor.id) === String(g.id) && liveRt.goalFloor.until > Date.now() ? liveRt.goalFloor.v : 0) + n, until: Date.now() + 4000 };
  liveBurst(uid, n);
  playUiSound('like');
  hapticTap();
  liveEmit();
  const { data, error } = await Promise.resolve(supabase.rpc('zchat_live_gift', { p_live: liveRt.id, p_amount: n, p_cid: cid })).catch(() => ({ data: null, error: { message: 'network' } }));
  if (error || !data || data.ok === false) {
    walletAfter(uid, tok, { error: error || true });
    liveRt.comments = liveRt.comments.filter((c) => c.cid !== cid);
    liveRt.goalFloor = null;
    liveEmit();
    if (rpcMissing(error)) appSnack('Live gifts switch on once the latest ZChat setup is finished.');
    else appSnack((data && data.reason) || friendlyError(error, "Couldn't send the gift. Try again."));
    return false;
  }
  walletAfter(uid, tok, { coins: data.coins });
  if (data.gift) liveAddGift(data.gift);
  return true;
}
export function LiveGiftSheet({ host, me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const w = useWallet(me.id);
  const coins = w && w.ready ? w.coins : null;
  const send = (n) => {
    if (coins != null && n > coins) { appSnack('You do not have enough coins for that one'); return; }
    onClose();
    liveSendGift(n);
  };
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', color: theme.ink }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ padding: '8px 20px 4px', fontSize: 16, fontWeight: 800 }}>Send {liveFirst(host && host.name)} a gift</div>
        <div style={{ padding: '0 20px 12px', fontSize: 13, color: theme.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <CoinIcon size={15} />{coins == null ? 'Checking your coins' : `You have ${coins.toLocaleString('en-US')} ${coins === 1 ? 'coin' : 'coins'}`}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, padding: '0 16px' }}>
          {LIVE_GIFTS.map((n) => {
            const short = coins != null && n > coins;
            return (
              <div key={n} role="button" aria-label={`Send ${n} coins`} onClick={() => send(n)} className="zchat-press" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '14px 4px 12px', borderRadius: 16, background: detailsCardBg(theme), border: `1px solid ${theme.border}`, cursor: 'pointer', opacity: short ? 0.45 : 1 }}>
                <CoinIcon size={30} />
                <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: theme.muted, padding: '12px 20px 0', lineHeight: 1.45 }}>Gifts go straight to {liveFirst(host && host.name)}. Everyone in the live sees them.</div>
      </div>
    </div>
  );
}

async function livePlanCreate({ kind, group, title, starts_at: startsAt, cover, me }) {
  if (!me) return false;
  const tmp = { id: `tmp-${liveCid()}`, host_id: me.id, kind, group_id: group ? group.id : null, title, cover: cover || null, starts_at: startsAt, status: 'planned', reminders: 0, created_at: new Date().toISOString(), host: { id: me.id, name: me.name, username: me.username, avatar: me.avatar }, group: group ? { id: group.id, name: group.name, avatar: group.avatar } : null, mine: false, pending: true };
  livePlans.list = livePlanSort([...livePlans.list, tmp]);
  hapticTap();
  playUiSound('send');
  livePlansEmit();
  appSnack(kind === 'room' ? `Room scheduled for ${liveWhenLow(Date.parse(startsAt))}` : `Live scheduled for ${liveWhenLow(Date.parse(startsAt))}`);
  const { data, error } = await liveRpc('zchat_plan_create', { p_kind: kind, p_title: title, p_starts_at: startsAt, p_group: group ? group.id : null, p_cover: cover || null });
  livePlans.list = livePlans.list.filter((p) => p.id !== tmp.id);
  if (error || !data || data.ok === false || !data.plan) {
    livePlansEmit();
    appSnack(livePlanWhy(data && data.reason, error, "Couldn't schedule that. Try again."));
    return false;
  }
  if (!livePlans.list.some((p) => String(p.id) === String(data.plan.id))) livePlans.list = livePlanSort([...livePlans.list, data.plan]);
  else livePlanMerge(data.plan);
  livePlansEmit();
  return true;
}
async function livePlanEdit(plan, { title, starts_at: startsAt, cover, coverSet }) {
  const before = livePlanById(plan.id) || plan;
  livePlanEach(plan.id, (p) => ({ ...p, title, starts_at: startsAt, cover: coverSet ? cover || null : p.cover }));
  livePlans.list = livePlanSort(livePlans.list);
  hapticTap();
  livePlansEmit();
  const { data, error } = await liveRpc('zchat_plan_edit', { p_plan: plan.id, p_title: title, p_starts_at: startsAt, p_cover: coverSet ? cover || null : null, p_cover_set: !!coverSet });
  if (error || !data || data.ok === false || !data.plan) {
    livePlanEach(plan.id, () => before);
    livePlansEmit();
    appSnack(livePlanWhy(data && data.reason, error, "Couldn't save your changes. Try again."));
    return false;
  }
  livePlanMerge(data.plan);
  return true;
}
function livePlanChoices(custom) {
  const at = (days, h) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, 0, 0, 0); return d.getTime(); };
  const now = new Date();
  const sat = (() => { const d = new Date(); const add = (6 - d.getDay() + 7) % 7 || 7; d.setDate(d.getDate() + add); d.setHours(19, 0, 0, 0); return d.getTime(); })();
  const customAt = custom ? new Date(custom).getTime() : NaN;
  return [
    now.getHours() < 19 ? { k: 'tonight', label: 'Tonight', at: at(0, 20) } : null,
    { k: 'tomorrow', label: 'Tomorrow evening', at: at(1, 20) },
    { k: 'weekend', label: now.getDay() === 6 ? 'Next Saturday' : 'Saturday evening', at: sat },
    { k: 'pick', label: 'Pick a date and time', at: customAt },
  ].filter(Boolean);
}
export function LivePlanPage({ kind, group, plan, me, onClose, onDone }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const edit = !!plan;
  const room = kind === 'room';
  const [title, setTitle] = useState(plan ? plan.title : '');
  const [when, setWhen] = useState(plan ? 'pick' : new Date().getHours() < 19 ? 'tonight' : 'tomorrow');
  const [custom, setCustom] = useState(() => laterInputValue(plan ? Date.parse(plan.starts_at) : Date.now() + 2 * 3600000));
  const [cover, setCover] = useState(plan ? plan.cover || null : null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const choices = livePlanChoices(custom);
  const pick = choices.find((c) => c.k === when) || choices[choices.length - 1];
  const at = pick.at;
  const atOk = Number.isFinite(at) && at >= Date.now() + 10 * 60000 && at <= Date.now() + 30 * 86400000;
  const okTitle = !!title.trim();
  const pickCover = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type || '')) { appSnack('Pick a photo for the cover'); return; }
    let u = null;
    try { u = URL.createObjectURL(f); } catch {}
    setPreview(u);
    setBusy(true);
    const url = await pickCoverFile(f, me.id);
    setBusy(false);
    setPreview(null);
    if (u) setTimeout(() => { try { URL.revokeObjectURL(u); } catch {} }, 4000);
    if (!url) { appSnack('That cover could not be used. Try another photo.'); return; }
    setCover(url);
  };
  const save = () => {
    if (!okTitle || !atOk || busy) return;
    const t = title.replace(/\s+/g, ' ').trim().slice(0, 80);
    const iso = new Date(at).toISOString();
    if (edit) livePlanEdit(plan, { title: t, starts_at: iso, cover, coverSet: (cover || null) !== (plan.cover || null) });
    else livePlanCreate({ kind, group, title: t, starts_at: iso, cover, me });
    if (onDone) onDone(); else onClose();
  };
  const shown = preview || cover;
  const rowStyle = { display: 'flex', alignItems: 'center', gap: 12, minHeight: 52, padding: '6px 2px', cursor: 'pointer', boxSizing: 'border-box', borderBottom: `1px solid ${theme.border}` };
  return (
    <FullPage title={edit ? (room ? 'Edit your room' : 'Edit your live') : room ? 'Schedule a room' : 'Schedule a live'} subtitle={room && group ? group.name : undefined} onBack={onClose} zIndex={660}
      footer={<BigButton label={!okTitle ? 'Add a title first' : !atOk ? 'Pick a time at least 10 minutes away' : busy ? 'Adding your cover' : edit ? 'Save changes' : `Schedule for ${liveWhenLow(at)}`} disabled={!okTitle || !atOk || busy} onClick={save} />}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickCover} />
      {shown ? (
        <div style={{ position: 'relative', marginTop: 8, borderRadius: 16, overflow: 'hidden', aspectRatio: '2.6 / 1', maxHeight: 220, background: theme.rowBg }}>
          <img src={shown} alt="Cover" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {busy && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.32)' }}><Spinner size={20} /></div>}
          {!busy && <div role="button" aria-label="Remove cover" onClick={() => { hapticTap(); setCover(null); setPreview(null); }} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, background: 'rgba(0,0,0,0.55)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></div>}
        </div>
      ) : (
        <div role="button" aria-label="Add a cover" onClick={() => { if (fileRef.current) fileRef.current.click(); }} className="zchat-press" style={{ marginTop: 8, borderRadius: 16, aspectRatio: '2.6 / 1', maxHeight: 220, background: theme.rowBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: theme.muted, cursor: 'pointer' }}>
          <ImageIcon size={22} />
          <span style={{ fontSize: 14.5, fontWeight: 650, color: theme.ink2 }}>Add a cover</span>
          <span style={{ fontSize: 12 }}>Optional</span>
        </div>
      )}
      <IgHeading>Title</IgHeading>
      <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} placeholder={room ? 'What will you talk about?' : 'What is your live about?'} aria-label="Title" enterKeyHint="done" autoComplete="off" style={{ ...inputStyle(theme), fontWeight: 600 }} />
      <IgHeading>When</IgHeading>
      <div role="radiogroup" aria-label="When">
        {choices.map((c) => {
          const on = pick.k === c.k;
          return (
            <div key={c.k} role="radio" aria-checked={on} aria-label={c.label} onClick={() => { hapticTap(); setWhen(c.k); }} className="zchat-row-press" style={rowStyle}>
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
          <input type="datetime-local" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Date and time" min={laterInputValue(Date.now() + 10 * 60000)} max={laterInputValue(Date.now() + 30 * 86400000)} style={{ ...inputStyle(theme), fontSize: 16 }} />
          {!atOk && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 6 }}>Pick a time from 10 minutes to 30 days from now.</div>}
        </div>
      )}
      <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '16px 2px 4px' }}>
        {room ? `Everyone in ${group ? group.name : 'the group'} sees it under Coming up and can ask for a reminder. Reminders go out 10 minutes before.` : 'Your followers see it under Coming up, and it shows on your profile. Anyone who taps Remind me hears from us 10 minutes before.'}
      </div>
    </FullPage>
  );
}
export function SpendAuthSheet({ req, onDone }) {
  const { theme } = useTheme();
  useBackClose(true, () => onDone(false));
  const bioOk = useBioReady();
  const limit = req.mode === 'limit';
  const hasBio = !limit && !!bioCredId() && bioOk === true;
  const [err, setErr] = useState(0);
  const [bioBusy, setBioBusy] = useState(false);
  const [missed, setMissed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const waiting = spendAuthBus.waitUntil > now;
  useEffect(() => {
    if (!waiting) return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [waiting]);
  const tryBio = async () => {
    if (bioBusy) return;
    setBioBusy(true);
    const t0 = Date.now();
    const ok = await bioCheck();
    setBioBusy(false);
    if (ok) { spendAuthBus.fails = 0; playUiSound('toggle'); onDone(true); return; }
    if (Date.now() - t0 > 900) setMissed(true);
  };
  useEffect(() => { if (hasBio) { const t = setTimeout(tryBio, 260); return () => clearTimeout(t); } return undefined; }, [hasBio]);
  const onPin = async (pin) => {
    if (spendAuthBus.waitUntil > Date.now()) return;
    if (await verifyPin(pin)) { spendAuthBus.fails = 0; playUiSound('toggle'); onDone(true); return; }
    spendAuthBus.fails += 1;
    setErr((e) => e + 1);
    playUiSound('cancel');
    if (spendAuthBus.fails >= 5) { spendAuthBus.fails = 0; spendAuthBus.waitUntil = Date.now() + 30000; setNow(Date.now()); }
  };
  const left = Math.max(0, Math.ceil((spendAuthBus.waitUntil - now) / 1000));
  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const sub = waiting ? `Too many tries. Try again in ${countWord(left, 'second', 'seconds')}` : err ? 'Wrong PIN, try again' : missed ? 'Enter your PIN instead' : 'Enter your app lock PIN';
  return (
    <Portal>
      <div onClick={() => onDone(false)} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 970, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="dialog" aria-modal="true" aria-label={limit ? 'Daily limit reached' : 'Confirm spending'} onClick={(e) => e.stopPropagation()} className="zchat-sheet-up"
          style={{ width: '100%', maxWidth: 460, maxHeight: 'calc(100% - 12px)', overflowY: 'auto', boxSizing: 'border-box', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '10px 18px calc(12px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 12 }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: theme.accentSoft, color: kitOnInk(theme), display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SecGlyph k="spend" size={28} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, marginTop: 12, letterSpacing: '-0.01em' }}>{limit ? 'Daily limit reached' : "Confirm it's you"}</div>
            {reasonLine(req.reason, theme)}
          </div>
          {limit ? (
            <>
              <div style={{ fontSize: 14, color: theme.ink2, textAlign: 'center', lineHeight: 1.5, margin: '14px 6px 18px' }}>
                {`You can send up to ${fmt(req.lim)} coins a day from this phone, and ${req.left ? `${fmt(req.left)} are left today` : 'none are left today'}. You can change this in Settings, under Spending lock.`}
              </div>
              <BigButton label="OK" onClick={() => onDone(false)} />
            </>
          ) : (
            <>
              <AppPinPad compact subtitle={sub} onComplete={onPin} error={err} corner={hasBio ? <BioKey size={64} busy={bioBusy} onClick={tryBio} /> : null} />
              <div role="button" aria-label="Cancel" onClick={() => onDone(false)} className="zchat-press" style={{ textAlign: 'center', padding: '14px 0 4px', fontSize: 15, fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}
