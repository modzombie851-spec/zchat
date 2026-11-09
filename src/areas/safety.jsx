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
  ConfirmSheet,
  EmptyState,
  FONT,
  FullPage,
  IgHeading,
  IgRow,
  IgTopBar,
  LoadFail,
  NameBadge,
  PageArt,
  PillButton,
  Portal,
  SafetyIcon,
  SafetyMap,
  SegmentedControl,
  Spinner,
  WideDim,
  appSnack,
  blockedListMem,
  canShareScreen,
  countWord,
  describeMessage,
  fetchProfilesView,
  fmtDate,
  fmtHM,
  friendlyError,
  hapticTap,
  igPalette,
  inputStyle,
  kitOnInk,
  loadFailCode,
  mmss,
  playUiSound,
  primaryBtn,
  readJsonLs,
  recWhen,
  reducedMotion,
  rpcMissing,
  rtOnRefresh,
  safetyEnd,
  safetyFirst,
  safetyLive,
  safetyPeople,
  safetyPeopleLoad,
  safetySet,
  safetyStore,
  safetyUpdated,
  sanitizeAvatarList,
  sendPushNotification,
  timeAgoLong,
  useBackClose,
  useEdgeSwipeBack,
  useNow,
  useSafetyStore,
  useSheetDrag,
  useTheme,
  writeJsonLs,
} from '../App.jsx';
import {
  AdminStatus,
  AdminTextBtn,
  AxGlyph,
  KitTabs,
  adminHair,
  axDeviceInfo,
  axReportError,
  axSendReport,
} from './shared.jsx';


const trustedMem = new Map();
export function TrustedFriendsPage({ uid, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [data, setData] = useState(() => trustedMem.get(uid) || (() => { const v = readJsonLs(`zchat-sf-trusted-${uid}`, null); return v && Array.isArray(v.friends) ? { friends: v.friends, requests: [] } : null; })());
  const [off, setOff] = useState(false);
  const [fail, setFail] = useState(null);
  const [picking, setPicking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const put = (d) => { trustedMem.set(uid, d); setData(d); writeJsonLs(`zchat-sf-trusted-${uid}`, { friends: ((d && d.friends) || []).map((f) => ({ id: f.id, name: f.name, username: f.username, avatar: f.avatar, added_at: f.added_at, ready_at: f.ready_at, ok: f.ok })) }); };
  const load = async () => {
    const { data: d, error } = await supabase.rpc('zchat_trusted_list').then((r) => r, (e) => ({ data: null, error: e || {} }));
    if (error && !rpcMissing(error)) { setFail(loadFailCode(error)); return; }
    if (error) { setOff(true); if (!trustedMem.get(uid)) put({ friends: [], requests: [] }); return; }
    setFail(null);
    const v = d || { friends: [], requests: [] };
    (v.friends || []).forEach((p) => safetyPeople.set(p.id, p));
    put({ friends: v.friends || [], requests: v.requests || [] });
  };
  useEffect(() => { load(); safetyLoadFriends(uid); const offR = rtOnRefresh(() => load()); return offR; }, [uid]);
  const saveList = async (ids) => {
    const before = data;
    const keep = new Map(((before && before.friends) || []).map((f) => [f.id, f]));
    const nowIso = new Date().toISOString();
    put({ ...(before || {}), friends: ids.map((id) => keep.get(id) || { ...(safetyPeople.get(id) || { id }), id, added_at: nowIso, ready_at: new Date(Date.now() + 3 * 86400000).toISOString(), ok: true }), requests: (before && before.requests) || [] });
    hapticTap();
    const { data: r, error } = await supabase.rpc('zchat_trusted_set', { p_friends: ids });
    if (error || !r || !r.ok) {
      put(before);
      appSnack(error && rpcMissing(error) ? 'Trusted friends switch on once the latest ZChat setup is finished.' : r && r.reason === 'limited' ? 'You changed this a lot today. Try again tomorrow.' : r && r.reason === 'friend' ? 'Pick people who follow you back.' : friendlyError(error, 'That did not save. Try again.'));
      return;
    }
    appSnack(ids.length ? 'Trusted friends saved' : 'Trusted friends removed');
    load();
  };
  const stopReq = async (rq) => {
    const before = data;
    put({ ...before, requests: (before.requests || []).filter((x) => x.id !== rq.id) });
    hapticTap();
    const { data: r, error } = await supabase.rpc('zchat_rec_owner_cancel', { p_id: rq.id });
    if (error || !r || !r.ok) { put(before); appSnack(friendlyError(error, 'That did not go through. Try again.')); return; }
    appSnack('Stopped. Your login stays the same.');
  };
  const friends = (data && data.friends) || [];
  const reqs = (data && data.requests) || [];
  const fmtDay = (iso) => fmtDate(new Date(iso), { weekday: 'short', day: 'numeric', month: 'short' });
  return (
    <FullPage title="Trusted friends" onBack={onClose} zIndex={74}
      footer={!off && !(data === null && fail !== null) ? <BigButton label={friends.length ? 'Change trusted friends' : 'Choose trusted friends'} onClick={() => setPicking(true)} /> : null}>
      <PageArt text="If you ever lose your password and your email, three of these friends can help you get back in. Each one sees a code in ZChat that they read to you." style={{ paddingTop: 8 }} />
      {off && <div role="status" style={{ margin: '4px 0 8px', padding: 12, borderRadius: 14, background: theme.rowBg, fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>Trusted friends switch on once the latest ZChat setup is finished.</div>}
      {reqs.map((rq) => (
        <div key={rq.id} role="alert" className="zchat-fade" style={{ margin: '6px 0 4px', padding: '12px 14px', borderRadius: 16, background: theme.dark ? 'rgba(237,73,86,0.16)' : 'rgba(237,73,86,0.08)' }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, color: theme.danger }}>Someone is getting help to log in</div>
          <div style={{ fontSize: 13, color: theme.ink, marginTop: 4, lineHeight: 1.45 }}>{rq.status === 'waiting' && rq.apply_after ? `Your login email changes ${recWhen(rq.apply_after).toLowerCase()}.` : 'They asked your trusted friends for codes.'}{rq.device ? ` From ${rq.device}${rq.place ? `, near ${rq.place}` : ''}.` : ''}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <PillButton danger small label="Stop it" ariaLabel="Stop this request" onClick={() => stopReq(rq)} />
          </div>
        </div>
      ))}
      <IgHeading>{friends.length ? `Your trusted friends, ${friends.length} of 5` : 'Your trusted friends'}</IgHeading>
      {data === null && (fail !== null ? <LoadFail small code={fail} onRetry={() => { setFail(null); load(); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={18} color={theme.muted} /></div>)}
      {data && !friends.length && <div style={{ fontSize: 13.5, color: theme.muted, padding: '4px 2px 10px', lineHeight: 1.5 }}>Pick 3 to 5 people you trust and talk to often. They need to follow you back.</div>}
      {friends.map((f) => {
        const ready = !f.ready_at || Date.parse(f.ready_at) <= Date.now();
        return (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '4px 0' }}>
            <Avatar emoji={f.avatar} name={f.name} size={40} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
              <div style={{ fontSize: 12.5, color: f.ok === false ? theme.danger : theme.muted }}>{f.ok === false ? 'Can not help right now' : ready ? 'Can help' : `Can help from ${fmtDay(f.ready_at)}`}</div>
            </div>
          </div>
        );
      })}
      {friends.length > 0 && !off && <IgRow inset={false} icon={<Trash2 />} label="Remove all" danger onClick={() => setConfirmClear(true)} />}
      <IgHeading>How it works</IgHeading>
      <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.6, padding: '0 2px 8px', textWrap: 'pretty' }}>
        On the log in screen, tap Forgot password, then Get help from friends. Your friends see who asked and from where. With 3 codes you pick a new email, and the change happens 24 hours later. Your old email is told at once and can stop it. New friends can help 3 days after you add them.
      </div>
      {picking && <SafetyPeoplePicker uid={uid} title="Trusted friends" sub="Pick 3 to 5 people. They are told you picked them. They can only help when you ask." min={3} max={5} value={friends.map((f) => f.id)} onDone={saveList} onClose={() => setPicking(false)} />}
      {confirmClear && <ConfirmSheet title="Remove trusted friends?" text="Nobody will be able to help you get back in this way." confirmLabel="Remove" onCancel={() => setConfirmClear(false)} onConfirm={() => { setConfirmClear(false); saveList([]); }} />}
    </FullPage>
  );
}

const recHelpMem = new Map();
const recHelpState = (it, o) => (it ? (it.state === 'used' ? 'used' : it.state === 'denied' ? 'denied' : 'ask') : o ? 'own' : 'gone');
export function RecoveryHelpPage({ uid, id, seed, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const first0 = recHelpMem.get(id) || (seed && seed.user ? { item: seed, own: null } : null);
  const [item, setItem] = useState(first0 ? first0.item : null);
  const [own, setOwn] = useState(first0 ? first0.own : null);
  const [state, setState] = useState(first0 ? recHelpState(first0.item, first0.own) : 'loading');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDeny, setConfirmDeny] = useState(false);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: list, error: e1 }, { data: mineList, error: e2 }] = await Promise.all([supabase.rpc('zchat_rec_for_me'), supabase.rpc('zchat_trusted_list')]).catch((e) => [{ data: null, error: e || {} }, { data: null, error: e || {} }]);
      if (!alive) return;
      if (e1 && first0) return;
      const it = (Array.isArray(list) ? list : []).find((x) => x.id === id) || null;
      const o = mineList && Array.isArray(mineList.requests) ? mineList.requests.find((x) => x.id === id) : null;
      if (!it && !o && (e1 || e2) && !first0) { setFail(loadFailCode(e1 || e2)); return; }
      recHelpMem.set(id, { item: it, own: o || null });
      setItem(it);
      setOwn(o || null);
      setState((cur) => (cur === 'code' || cur === 'denied' || cur === 'stopped' ? cur : recHelpState(it, o)));
    })();
    return () => { alive = false; };
  }, [id, tick]);
  const p = (item && item.user) || null;
  const first = safetyFirst(p);
  const reveal = async () => {
    if (busy) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('zchat_rec_friend_code', { p_id: id });
    setBusy(false);
    if (error || !data || !data.ok) { appSnack(data && data.reason === 'limited' ? 'You already showed this code a few times.' : data && data.reason === 'used' ? 'Your code was already used.' : friendlyError(error, 'This request is not active anymore.')); return; }
    hapticTap();
    setCode(data.code);
    setState('code');
  };
  const deny = async () => {
    setConfirmDeny(false);
    setState('denied');
    hapticTap();
    const { data, error } = await supabase.rpc('zchat_rec_deny', { p_id: id });
    if (error || !data || !data.ok) { setState('ask'); appSnack(friendlyError(error, 'That did not go through. Try again.')); return; }
    if (item) recHelpMem.set(id, { item: { ...item, state: 'denied' }, own });
    appSnack(`Thanks. We stopped it and told ${first}.`);
  };
  const stopOwn = async () => {
    setState('stopped');
    const { data, error } = await supabase.rpc('zchat_rec_owner_cancel', { p_id: id });
    if (error || !data || !data.ok) { setState('own'); appSnack(friendlyError(error, 'That did not go through. Try again.')); return; }
    appSnack('Stopped. Your login stays the same.');
  };
  const when = item ? fmtHM(new Date(item.created_at)) : '';
  return (
    <FullPage title={state === 'own' || state === 'stopped' ? 'Your account' : 'Help a friend'} onBack={onClose} zIndex={76}
      footer={state === 'ask' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label={busy ? 'Getting your code' : 'I talked to them, show my code'} disabled={busy} onClick={reveal} />
          <BigButton label="This is not them" tone="plain" style={{ color: theme.danger }} onClick={() => setConfirmDeny(true)} />
        </div>
      ) : state === 'code' ? <BigButton label="Done" onClick={onClose} /> : state === 'own' ? <BigButton label="Stop it" tone="danger" onClick={stopOwn} /> : null}>
      {state === 'loading' && (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>)}
      {state === 'gone' && <EmptyState art="nothing" title="Nothing to do" text="This request is not active anymore." />}
      {(state === 'own' || state === 'stopped') && own && (
        <div style={{ padding: '18px 2px' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: state === 'own' ? theme.danger : theme.ink }}>{state === 'own' ? 'Someone is getting help to log in' : 'Stopped'}</div>
          <div style={{ fontSize: 14, color: theme.muted, marginTop: 6, lineHeight: 1.5, textWrap: 'pretty' }}>{state === 'own' ? `They asked your trusted friends for codes${own.device ? ` from ${own.device}` : ''}${own.place ? `, near ${own.place}` : ''}. If it was not you, stop it now.` : 'Your login stays the same.'}</div>
        </div>
      )}
      {p && (state === 'ask' || state === 'code' || state === 'used' || state === 'denied') && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 2px 14px' }}>
            <Avatar emoji={p.avatar} name={p.name} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>{first} asked for your help</div>
              <div style={{ fontSize: 13, color: theme.muted, marginTop: 2, lineHeight: 1.4 }}>At {when}{item.device ? ` from ${item.device}` : ''}{item.place ? `, near ${item.place}` : ''}</div>
            </div>
          </div>
          {state === 'ask' && (
            <div style={{ padding: '12px 14px', borderRadius: 16, background: theme.rowBg, fontSize: 13.5, color: theme.ink, lineHeight: 1.55, textWrap: 'pretty' }}>
              {first} is trying to get back into their ZChat account. Only help if you talked to {first} on a call or in person and you are sure it is them. People who steal accounts often send a message pretending to be a friend.
            </div>
          )}
          {state === 'code' && (
            <div className="zchat-fade" style={{ textAlign: 'center', padding: '18px 8px 6px' }}>
              <div style={{ fontSize: 13.5, color: theme.muted }}>Read this code to {first}</div>
              <div aria-label={`Code ${code.split('').join(' ')}`} style={{ fontSize: 34, fontWeight: 800, letterSpacing: '0.14em', color: theme.ink, fontVariantNumeric: 'tabular-nums', margin: '10px 0 8px', userSelect: 'all' }}>{`${code.slice(0, 4)} ${code.slice(4)}`}</div>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.5, textWrap: 'pretty' }}>It works once, for this request only. Never send it in a message, and never give it to someone you have not talked to.</div>
            </div>
          )}
          {state === 'used' && <div style={{ fontSize: 14, color: theme.muted, padding: '10px 2px', lineHeight: 1.5 }}>Your code was used. Thanks for helping {first}.</div>}
          {state === 'denied' && <div style={{ fontSize: 14, color: theme.muted, padding: '10px 2px', lineHeight: 1.5 }}>You said this was not {first}. We stopped the request and told them.</div>}
        </>
      )}
      {confirmDeny && <ConfirmSheet title="Say this is not them?" text={`We stop the request at once and tell ${first}.`} confirmLabel="This is not them" onCancel={() => setConfirmDeny(false)} onConfirm={deny} />}
    </FullPage>
  );
}
function safetyNames(list) {
  const n = list.map(safetyFirst);
  if (n.length <= 1) return n[0] || '';
  if (n.length === 2) return `${n[0]} and ${n[1]}`;
  return `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
}
function safetyReason(r) {
  const why = r && r.reason;
  if (why === 'running') return 'You already have a safety timer running.';
  if (why === 'limited') return 'You started a lot of timers today. Try again tomorrow.';
  if (why === 'friend') return 'One of those friends can not be picked. Pick people who follow you back.';
  if (why === 'ended') return 'This timer already ended.';
  if (why === 'limit') return 'This timer can not get more time. Start a new one.';
  return 'That did not go through. Check your connection and try again.';
}
function safetyGetPos(ms) {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { resolve(null); return; }
    let done = false;
    const fin = (v) => { if (!done) { done = true; resolve(v); } };
    setTimeout(() => fin(null), ms);
    try { navigator.geolocation.getCurrentPosition((pp) => fin({ lat: pp.coords.latitude, lng: pp.coords.longitude, acc: pp.coords.accuracy }), () => fin(null), { enableHighAccuracy: true, timeout: ms, maximumAge: 30000 }); } catch { fin(null); }
  });
}
async function safetyExtend(meIn, minutes) {
  const me = meIn || safetyStore.me;
  const before = safetyStore.mine;
  if (!before || String(before.id).indexOf('temp') === 0) return;
  const ends = new Date(Math.max(Date.parse(before.ends_at), Date.now()) + minutes * 60000).toISOString();
  safetySet({ mine: { ...before, ends_at: ends, status: 'running', minutes: (before.minutes || 0) + minutes } });
  hapticTap();
  const { data, error } = await supabase.rpc('zchat_safety_extend', { p_id: before.id, p_minutes: minutes });
  if (error || !data || !data.ok) { safetySet({ mine: before }); appSnack(friendlyError(error, safetyReason(data))); return; }
  const now = safetyStore.mine;
  if (now && now.id === before.id) safetySet({ mine: { ...now, ends_at: data.ends_at } });
  if (data.was === 'alerted') (before.friends || []).forEach((f) => sendPushNotification(f, (me && me.name) || 'ZChat', `Is okay and added ${minutes} more minutes.`, `/?safety=${before.id}`, me && me.avatar, { tag: `safety-${before.id}` }));
}

export function SafetyPeoplePicker({ uid, title, sub, min = 1, max = 5, value, onDone, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [people, setPeople] = useState(() => safetyFriendsMem.get(uid) || null);
  const [picked, setPicked] = useState(() => new Set(value || []));
  const [q, setQ] = useState('');
  useEffect(() => {
    let alive = true;
    safetyLoadFriends(uid, true).then((list) => { if (alive && list) setPeople(list); });
    return () => { alive = false; };
  }, [uid]);
  const toggle = (id) => {
    hapticTap();
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else if (n.size >= max) { appSnack(`You can pick up to ${max} people`); return prev; }
      else n.add(id);
      return n;
    });
  };
  const term = q.trim().toLowerCase();
  const shown = (people || []).filter((p) => !term || String(p.name || '').toLowerCase().includes(term) || String(p.username || '').toLowerCase().includes(term));
  const n = picked.size;
  return (
    <FullPage title={title} subtitle={`${n} of ${max} picked`} onBack={onClose} zIndex={80} pad={false}
      footer={<BigButton label={n < min ? (min > 1 ? `Pick at least ${min}` : 'Pick someone') : 'Done'} disabled={n < min} onClick={() => { onDone([...picked]); onClose(); }} />}>
      <div style={{ padding: '6px 16px 4px', fontSize: 13, color: theme.muted, lineHeight: 1.5 }}>{sub}</div>
      <div style={{ padding: '6px 16px 8px', position: 'sticky', top: 0, zIndex: 2, background: igPalette(theme).bg }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted }}>
          <Search size={17} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label={`Search ${title}`} autoCapitalize="none" style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        </label>
      </div>
      <div style={{ padding: '0 8px 12px' }}>
        {people === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={20} color={theme.muted} /></div>}
        {people && !people.length && <EmptyState art="nothing" title="Nobody to pick yet" text="People who follow you back show up here." />}
        {shown.map((p) => {
          const on = picked.has(p.id);
          return (
            <div key={p.id} role="button" aria-label={`${on ? 'Remove' : 'Add'} ${p.name}`} aria-pressed={on} onClick={() => toggle(p.id)} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 14, cursor: 'pointer' }}>
              <Avatar emoji={p.avatar} name={p.name} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                <div style={{ fontSize: 12.5, color: theme.muted }}>@{p.username}</div>
              </div>
              <span style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${on ? theme.coral : theme.muted}`, background: on ? theme.coral : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 160ms ease, border-color 160ms ease' }}>
                {on && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </span>
            </div>
          );
        })}
      </div>
    </FullPage>
  );
}
const safetyFriendsMem = new Map();
const safetyFriendsBusy = new Map();
const safetyFriendsAt = new Map();
function safetyLoadFriends(uid, fresh) {
  if (!uid) return Promise.resolve(null);
  if (!safetyFriendsMem.has(uid)) {
    const saved = readJsonLs(`zchat-sf-friends-${uid}`, null);
    if (Array.isArray(saved)) { saved.forEach((p) => { if (p && p.id && !safetyPeople.has(p.id)) safetyPeople.set(p.id, p); }); safetyFriendsMem.set(uid, saved); }
  }
  if (safetyFriendsBusy.has(uid)) return safetyFriendsBusy.get(uid);
  const age = Date.now() - (safetyFriendsAt.get(uid) || 0);
  if (safetyFriendsMem.has(uid) && (!fresh || age < 30000)) return Promise.resolve(safetyFriendsMem.get(uid));
  const job = (async () => {
    try {
      const [{ data: a, error: e1 }, { data: b, error: e2 }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', uid).eq('status', 'accepted').limit(5000),
        supabase.from('follows').select('follower_id').eq('following_id', uid).eq('status', 'accepted').limit(5000),
      ]);
      if (e1 || e2) return safetyFriendsMem.get(uid) || [];
      const back = new Set((b || []).map((r) => r.follower_id));
      const ids = [...new Set((a || []).map((r) => r.following_id))].filter((id) => id && id !== uid && back.has(id));
      let list = [];
      if (ids.length) {
        const { data } = await fetchProfilesView(ids.slice(0, 400));
        list = sanitizeAvatarList(data || [], uid).filter((p) => !p.is_deleted && !p.is_bot).sort((x, y) => String(x.name || '').localeCompare(String(y.name || '')));
      }
      list.forEach((p) => safetyPeople.set(p.id, p));
      safetyFriendsMem.set(uid, list);
      safetyFriendsAt.set(uid, Date.now());
      writeJsonLs(`zchat-sf-friends-${uid}`, list.slice(0, 400).map((p) => ({ id: p.id, name: p.name, username: p.username, avatar: p.avatar, verified: p.verified || null, custom_badge: p.custom_badge || null })));
      return list;
    } catch { return safetyFriendsMem.get(uid) || []; }
    finally { safetyFriendsBusy.delete(uid); }
  })();
  safetyFriendsBusy.set(uid, job);
  return job;
}

function SafetyFriendRows({ ids, onRemove }) {
  const { theme } = useTheme();
  return ids.map((id) => {
    const p = safetyPeople.get(id) || { id, name: 'Friend', username: '' };
    return (
      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '4px 0' }}>
        <Avatar emoji={p.avatar} name={p.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          {p.username && <div style={{ fontSize: 12.5, color: theme.muted }}>@{p.username}</div>}
        </div>
        {onRemove && <div role="button" aria-label={`Remove ${p.name}`} onClick={() => { hapticTap(); onRemove(id); }} className="zchat-press" style={{ width: 40, height: 40, marginRight: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></div>}
      </div>
    );
  });
}

const SAFETY_DRAFT = { label: '', minutes: 20 };
export function SafetyTimerPage({ uid, me, peer, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const st = useSafetyStore();
  const now = useNow(1000);
  const [label, setLabel] = useState(SAFETY_DRAFT.label);
  const [minutes, setMinutes] = useState(SAFETY_DRAFT.minutes);
  const [friends, setFriends] = useState(() => {
    const last = readJsonLs(`zchat-sf-last-${uid}`, []).filter((x) => typeof x === 'string').slice(0, 5);
    const list = peer && peer.id && !peer.is_bot ? [peer.id, ...last.filter((x) => x !== peer.id)].slice(0, 5) : last;
    if (peer && peer.id) safetyPeople.set(peer.id, peer);
    return list;
  });
  const [picking, setPicking] = useState(false);
  const [, setTick] = useState(0);
  useEffect(() => { safetyLoadFriends(uid); }, [uid]);
  useEffect(() => { SAFETY_DRAFT.label = label; SAFETY_DRAFT.minutes = minutes; }, [label, minutes]);
  useEffect(() => { const need = friends.filter((id) => !safetyPeople.has(id)); if (need.length) safetyPeopleLoad(need).then(() => setTick((n) => n + 1)); }, [friends.join(',')]);
  const mine = st.mine && safetyLive(st.mine) ? st.mine : null;
  const start = async () => {
    if (!friends.length) return;
    const ids = friends.slice(0, 5);
    const nowIso = new Date().toISOString();
    const temp = { id: `temp-${Date.now()}`, owner_id: uid, label: label.trim().slice(0, 80), friends: ids, minutes, started_at: nowIso, ends_at: new Date(Date.now() + minutes * 60000).toISOString(), status: 'running', lat: null, lng: null };
    safetySet({ mine: temp });
    hapticTap();
    playUiSound('send');
    writeJsonLs(`zchat-sf-last-${uid}`, ids);
    SAFETY_DRAFT.label = '';
    const posJob = safetyGetPos(8000);
    const { data, error } = await supabase.rpc('zchat_safety_start', { p_minutes: minutes, p_label: temp.label, p_friends: ids, p_lat: null, p_lng: null, p_acc: null });
    if (error || !data || !data.ok) {
      if (safetyStore.mine && safetyStore.mine.id === temp.id) safetySet({ mine: null });
      appSnack(friendlyError(error, safetyReason(data)));
      return;
    }
    const row = { ...temp, id: data.id, started_at: data.started_at || temp.started_at, ends_at: data.ends_at || temp.ends_at };
    if (safetyStore.mine && safetyStore.mine.id === temp.id) safetySet({ mine: row });
    ids.forEach((f) => sendPushNotification(f, (me && me.name) || 'ZChat', `Started a safety timer${row.label ? `: ${row.label}` : ''}. You can see where they are until they check in.`, `/?safety=${row.id}`, me && me.avatar, { tag: `safety-${row.id}` }));
    const pos = await posJob;
    if (!pos) { appSnack('Location is off. Your friends still get an alert if you do not check in.'); return; }
    const ok = await supabase.rpc('zchat_safety_loc', { p_id: row.id, p_lat: pos.lat, p_lng: pos.lng, p_acc: pos.acc || null });
    const cur = safetyStore.mine;
    if (ok && ok.data && cur && cur.id === row.id) safetySet({ mine: { ...cur, lat: pos.lat, lng: pos.lng, acc: pos.acc, loc_at: new Date().toISOString() } });
  };
  if (mine) {
    const left = Date.parse(mine.ends_at) - now;
    const alerted = mine.status === 'alerted';
    const names = safetyNames((mine.friends || []).map((id) => safetyPeople.get(id) || { name: 'a friend' }));
    return (
      <FullPage title="Safety timer" subtitle={mine.label || undefined} onBack={onClose} zIndex={74}
        footer={(
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BigButton label="I'm safe" ariaLabel="I am safe" onClick={() => safetyEnd(me)} />
            <div style={{ display: 'flex', gap: 10 }}>
              <BigButton tone="plain" label="Add 10 min" ariaLabel="Add 10 minutes" disabled={String(mine.id).indexOf('temp') === 0} onClick={() => safetyExtend(me, 10)} />
              <BigButton tone="plain" label="Add 30 min" ariaLabel="Add 30 minutes" disabled={String(mine.id).indexOf('temp') === 0} onClick={() => safetyExtend(me, 30)} />
            </div>
          </div>
        )}>
        <div role="timer" aria-live="off" style={{ textAlign: 'center', padding: '22px 0 14px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: alerted ? theme.danger : theme.muted }}>{alerted ? 'Your friends were told' : left > 0 ? `Check in by ${fmtHM(new Date(mine.ends_at))}` : 'Time is up'}</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', color: alerted ? theme.danger : theme.ink, fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{left > 0 ? mmss(left) : '0:00'}</div>
          <div style={{ fontSize: 14, color: theme.muted, marginTop: 6, lineHeight: 1.45, padding: '0 12px', textWrap: 'pretty' }}>{alerted ? "Tap I'm safe so they know you are okay." : `${names} can see where you are until you check in.`}</div>
        </div>
        <SafetyMap lat={mine.lat} lng={mine.lng} live={!alerted} />
        <div style={{ fontSize: 12.5, color: theme.muted, padding: '8px 4px 0' }}>{mine.lat != null ? safetyUpdated(mine.loc_at) : 'Keep ZChat open so your friends can see where you are.'}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, padding: '14px 4px 4px', lineHeight: 1.5, textWrap: 'pretty' }}>Sharing stops the moment you tap I'm safe. If time runs out, {names} {(mine.friends || []).length === 1 ? 'gets' : 'get'} an alert with your last location, even if your phone is off.</div>
      </FullPage>
    );
  }
  return (
    <FullPage title="Safety timer" onBack={onClose} zIndex={74}
      footer={<BigButton label="Start safety timer" disabled={!friends.length} onClick={start} />}>
      <PageArt text="Going somewhere and want a friend to know you got there? Pick a time and the people to tell. If you do not tap I'm safe in time, they get an alert with where you were." style={{ paddingTop: 8 }} />
      <IgHeading>Where are you going</IgHeading>
      <input value={label} onChange={(e) => setLabel(e.target.value.slice(0, 80))} placeholder="I'm walking home" aria-label="Where are you going" enterKeyHint="done" autoCapitalize="sentences" style={{ ...inputStyle(theme), fontSize: 16 }} />
      <IgHeading>How long</IgHeading>
      <SegmentedControl dense value={minutes} onChange={(v) => { hapticTap(); setMinutes(v); }} options={SAFETY_MINUTES} />
      <IgHeading>Who should know</IgHeading>
      <SafetyFriendRows ids={friends} onRemove={(id) => setFriends((l) => l.filter((x) => x !== id))} />
      <IgRow inset={false} icon={<UserPlus />} label={friends.length ? 'Change friends' : 'Choose friends'} sub={friends.length ? `${friends.length} of 5` : 'Up to 5 people who follow you back'} onClick={() => setPicking(true)} />
      <div style={{ fontSize: 12.5, color: theme.muted, padding: '12px 0 4px', lineHeight: 1.5, textWrap: 'pretty' }}>Only these friends see your location, and only while the timer runs.</div>
      {picking && <SafetyPeoplePicker uid={uid} title="Who should know" sub="They can see where you are while the timer runs, and get an alert if you do not check in." min={1} max={5} value={friends} onDone={(ids) => setFriends(ids)} onClose={() => setPicking(false)} />}
    </FullPage>
  );
}
const SAFETY_MINUTES = [[10, '10 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 hour']];

export function SafetyCheckSheet({ me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const st = useSafetyStore();
  const mine = st.mine;
  if (!mine) return null;
  const alerted = mine.status === 'alerted';
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 905, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div role="alertdialog" aria-label="Are you okay" onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '24px 18px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))', boxSizing: 'border-box', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: kitOnInk(theme), paddingBottom: 10 }}><SafetyIcon size={36} strokeWidth={1.6} /></div>
          <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink }}>Are you okay?</div>
          <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '6px 10px 18px', textWrap: 'pretty' }}>{alerted ? 'Your safety timer ran out and your friends were told. Let them know you are safe.' : 'Your safety timer is up. If you do not answer, your friends get an alert in a minute.'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <BigButton label="I'm safe" ariaLabel="I am safe" onClick={() => { onClose(); safetyEnd(me); }} />
            <BigButton label="Add 10 minutes" tone="plain" onClick={() => { onClose(); safetyExtend(me, 10); }} />
          </div>
        </div>
      </div>
    </Portal>
  );
}

function BlockBullet({ icon, text }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '9px 0' }}>
      <div style={{ width: 24, display: 'flex', justifyContent: 'center', color: theme.ink, flexShrink: 0, paddingTop: 1 }}>{React.cloneElement(icon, { size: 20, strokeWidth: 1.6 })}</div>
      <div style={{ fontSize: 13.5, color: theme.ink, lineHeight: 1.45 }}>{text}</div>
    </div>
  );
}

export function BlockConfirmSheet({ profile, onCancel, onConfirm, onBlockReport }) {
  useBackClose(true, onCancel);
  const { theme } = useTheme();
  const drag = useSheetDrag(onCancel);
  const [busy, setBusy] = useState(false);
  return (
    <div onClick={onCancel} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 420, background: 'rgba(5,8,16,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} style={{ ...drag.sheetStyle, width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '26px 26px 0 0', padding: '10px 22px', paddingBottom: 'calc(18px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 14px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Avatar emoji={profile.avatar} name={profile.name} size={72} />
            <div style={{ position: 'absolute', right: -4, bottom: -2, width: 28, height: 28, borderRadius: '50%', background: theme.danger, border: `3px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ban size={14} color="white" /></div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: theme.ink, marginTop: 12 }}>Block <NameBadge name={profile.name} verified={profile.verified} custom={profile.custom_badge} size={15} />?</div>
          <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>@{profile.username}</div>
        </div>
        <div style={{ marginTop: 14 }}>
          <BlockBullet icon={<Send size={15} />} text="They won't be able to message you, call you or find your profile." />
          <BlockBullet icon={<EyeOff size={15} />} text="They won't see your status, and you'll both stop following each other." />
          <BlockBullet icon={<BellOff size={15} />} text="They won't be notified that you blocked them." />
          <BlockBullet icon={<SettingsIcon size={15} />} text="You can unblock them any time in Settings." />
        </div>
        <button disabled={busy} onClick={async () => { setBusy(true); await onConfirm(); setBusy(false); }} style={{ width: '100%', marginTop: 16, padding: 14, borderRadius: 16, border: 'none', background: theme.danger, color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
          {busy ? <Spinner size={15} /> : 'Block'}
        </button>
        {onBlockReport && (
          <button disabled={busy} aria-label="Block and report" onClick={async () => { setBusy(true); await onBlockReport(); setBusy(false); }} style={{ width: '100%', marginTop: 8, padding: 14, borderRadius: 16, border: 'none', background: theme.rowBg, color: theme.danger, fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: 'pointer' }}>
            Block and report
          </button>
        )}
        <button onClick={onCancel} style={{ width: '100%', marginTop: 8, padding: 13, borderRadius: 16, border: 'none', background: 'transparent', color: theme.ink, fontWeight: 700, fontSize: 14.5, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
      </div>
    </div>
  );
}
export function BlockedAccountsPanel({ myId, blockedIds, onClose, onUnblock, onOpenProfile }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const [rowsRaw, setRows] = useState(() => blockedListMem.get(myId) || null);
  const prevBlockedRef = useRef(blockedIds);
  const unblockedRef = useRef(new Set());
  if (prevBlockedRef.current !== blockedIds) {
    prevBlockedRef.current.forEach((id) => { if (!blockedIds.has(id)) unblockedRef.current.add(id); });
    blockedIds.forEach((id) => unblockedRef.current.delete(id));
    prevBlockedRef.current = blockedIds;
  }
  const rows = rowsRaw ? rowsRaw.filter((r) => !unblockedRef.current.has(r.profile.id)) : rowsRaw;
  const [q, setQ] = useState('');
  const idsKey = [...blockedIds].sort().join(',');
  useEffect(() => { if (rowsRaw) blockedListMem.set(myId, rowsRaw); }, [rowsRaw]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: blocks, error } = await supabase.from('blocks').select('*').eq('blocker_id', myId);
      if (error && !blocks) { if (!cancelled) setRows((prev) => prev || []); return; }
      const list = blocks || [];
      if (!list.length) { if (!cancelled) setRows([]); return; }
      const { data: profs } = await fetchProfilesView(list.map((b) => b.blocked_id));
      const byId = {};
      sanitizeAvatarList(profs, myId).forEach((p) => { byId[p.id] = p; });
      const merged = list.map((b) => ({ profile: byId[b.blocked_id] || { id: b.blocked_id, name: 'Deleted Account', username: 'deleted', avatar: '', is_deleted: true }, at: b.created_at }))
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
      if (!cancelled) setRows(merged);
    })();
    return () => { cancelled = true; };
  }, [idsKey]);
  const term = q.trim().toLowerCase();
  const shown = (rows || []).filter((r) => !term || (r.profile.name || '').toLowerCase().includes(term) || (r.profile.username || '').toLowerCase().includes(term));
  return (
    <>
    <WideDim onClose={onClose} z={70} />
    <div {...edgeBack} className="zchat-panel-open zchat-wide-page" style={{ position: 'fixed', inset: 0, zIndex: 70, background: theme.bgGradient, display: 'flex', flexDirection: 'column' }}>
      <IgTopBar title="Blocked accounts" subtitle={rows ? `${rows.length} ${rows.length === 1 ? 'account' : 'accounts'}` : 'Loading'} onBack={onClose} />
      {rows && rows.length > 4 && (
        <div style={{ padding: '0 16px 10px', position: 'relative', flexShrink: 0 }}>
          <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 30, top: 12 }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocked accounts" style={{ ...inputStyle(theme), paddingLeft: 38 }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 8px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
        {rows === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>}
        {rows && rows.length === 0 && (
          <EmptyState art="blocked" title="No blocked accounts" text="When you block someone they show up here. You can unblock them any time." />
        )}
        {shown.map((r) => (
          <div key={r.profile.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px' }}>
            <div onClick={() => !r.profile.is_deleted && onOpenProfile(r.profile)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <Avatar emoji={r.profile.avatar} name={r.profile.name} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={r.profile.name} verified={r.profile.verified} custom={r.profile.custom_badge} size={12} /></div>
                <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{r.profile.username}</div>
              </div>
            </div>
            <button onClick={() => onUnblock(r.profile)} aria-label={`Unblock ${r.profile.name}`} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 10, border: 'none', background: theme.dark ? '#2A2A2E' : '#EDEDF0', color: theme.ink, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}>Unblock</button>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
function axCanCapture() {
  try { return canShareScreen() && !!(document.createElement('canvas').getContext); } catch { return false; }
}
async function axCaptureScreen(beforeGrab, afterGrab) {
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser' }, audio: false, preferCurrentTab: true, selfBrowserSurface: 'include' });
    const track = stream.getVideoTracks()[0];
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.srcObject = stream;
    await v.play();
    if (beforeGrab) beforeGrab();
    await new Promise((r) => setTimeout(r, 380));
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    const s = Math.min(1, 1600 / Math.max(w, h));
    const c = document.createElement('canvas');
    c.width = Math.round(w * s);
    c.height = Math.round(h * s);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    if (track) track.stop();
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
    return blob ? new File([blob], 'screen.jpg', { type: 'image/jpeg' }) : null;
  } catch {
    return null;
  } finally {
    if (afterGrab) afterGrab();
    if (stream) stream.getTracks().forEach((t) => { try { t.stop(); } catch {} });
  }
}
const axReportDraft = { text: '', shots: [] };
export function ReportProblemPage({ me, onClose }) {
  useBackClose(true, onClose);
  const { theme, dark } = useTheme();
  const [text, setText] = useState(axReportDraft.text);
  const [shots, setShots] = useState(() => axReportDraft.shots.map((f) => ({ f, url: URL.createObjectURL(f) })));
  const [stage, setStage] = useState('form');
  const [err, setErr] = useState('');
  const [hidden, setHidden] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const pickRef = useRef(null);
  const info = useMemo(() => axDeviceInfo(dark), [dark]);
  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  useEffect(() => { axReportDraft.text = text; axReportDraft.shots = shots.map((s) => s.f); }, [text, shots]);
  useEffect(() => () => { shotsRef.current.forEach((s) => { try { URL.revokeObjectURL(s.url); } catch {} }); }, []);
  const add = (files) => {
    const list = Array.from(files || []).filter((f) => /^image\//.test(f.type || '')).slice(0, 3 - shots.length);
    if (!list.length) return;
    hapticTap();
    setShots((prev) => [...prev, ...list.map((f) => ({ f, url: URL.createObjectURL(f) }))].slice(0, 3));
  };
  const capture = async () => {
    hapticTap();
    const f = await axCaptureScreen(() => setHidden(true), () => setHidden(false));
    if (f) add([f]);
  };
  const clean = text.trim();
  const send = () => {
    if (clean.length < 2 || !me) return;
    hapticTap();
    playUiSound('send');
    setErr('');
    setStage('done');
    const files = shots.map((s) => s.f);
    axSendReport(me.id, { kind: 'problem', body: clean.slice(0, 2000), files, device: info }).then(({ error }) => {
      if (!error) { axReportDraft.text = ''; axReportDraft.shots = []; return; }
      const msg = axReportError(error);
      setStage('form');
      setErr(msg);
      appSnack(msg);
    }, () => { setStage('form'); setErr('That did not send. Try again in a moment.'); });
  };
  const errCount = info.errors.length;
  const infoRows = [
    ['App', `ZChat ${info.app}${info.installed ? ', installed' : ''}`],
    ['Phone and browser', `${info.os}, ${info.browser}`],
    ['Screen', info.window === info.screen ? info.screen : `${info.screen}, window ${info.window}`],
    ['Recent errors', errCount ? countWord(errCount, 'error', 'errors') : 'None'],
  ];
  if (stage === 'done') {
    return (
      <FullPage title="Report a problem" onBack={onClose} zIndex={72} footer={<BigButton label="Done" onClick={onClose} />}>
        <div className="zchat-fade">
          <EmptyState art="love" title="Thank you for telling us" text="We read every report and use it to fix things. If we need more from you, we will ask in ZChat." />
        </div>
      </FullPage>
    );
  }
  return (
      <FullPage title="Report a problem" onBack={onClose} zIndex={72} covered={hidden}
        footer={<BigButton label="Send report" disabled={clean.length < 2} onClick={send} />}>
        <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '8px 2px 12px', textWrap: 'pretty' }}>Tell us what happened and what you expected instead. A screenshot helps a lot.</div>
        <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} rows={5} aria-label="What went wrong" placeholder="What went wrong"
          style={{ ...inputStyle(theme), resize: 'none', minHeight: 132, lineHeight: 1.45, display: 'block' }} />
        <div style={{ fontSize: 12, color: theme.muted, textAlign: 'right', padding: '6px 2px 0', fontVariantNumeric: 'tabular-nums' }}>{text.length}/2000</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, margin: '14px 2px 8px' }}>Screenshots, up to 3</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          {shots.map((s, i) => (
            <div key={s.url} style={{ position: 'relative', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', background: theme.soft, border: `1px solid ${theme.border}` }}>
              <img src={s.url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div role="button" aria-label={`Remove screenshot ${i + 1}`} onClick={() => { hapticTap(); setShots((prev) => prev.filter((x) => x !== s)); }} className="zchat-press" style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, background: 'rgba(0,0,0,0.6)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} strokeWidth={2.6} /></div>
            </div>
          ))}
          {shots.length < 3 && (
            <div role="button" aria-label="Add screenshots" onClick={() => { if (pickRef.current) pickRef.current.click(); }} className="zchat-press" style={{ aspectRatio: '3 / 4', borderRadius: 14, border: `1.5px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: theme.muted, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: 6 }}>
              <AxGlyph k="pic" size={24} />Add from photos
            </div>
          )}
          {shots.length < 3 && axCanCapture() && (
            <div role="button" aria-label="Take a screenshot of ZChat" onClick={capture} className="zchat-press" style={{ aspectRatio: '3 / 4', borderRadius: 14, border: `1.5px dashed ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: theme.muted, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, textAlign: 'center', padding: 6 }}>
              <AxGlyph k="shot" size={24} />Take one of ZChat
            </div>
          )}
        </div>
        <input ref={pickRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <div style={{ marginTop: 18, borderRadius: 16, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
          <div role="button" aria-label="What we send with it" aria-expanded={showInfo} onClick={() => { hapticTap(); setShowInfo((v) => !v); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: theme.ink }}>Sent with your report</div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 2 }}>{`ZChat ${info.app}, ${info.os}, ${info.browser}`}</div>
            </div>
            <ChevronRight size={17} color={theme.muted} style={{ flexShrink: 0, transform: showInfo ? 'rotate(90deg)' : 'none', transition: reducedMotion() ? 'none' : 'transform 200ms ease-out' }} />
          </div>
          {showInfo && (
            <div className="zchat-fade" style={{ padding: '0 14px 12px' }}>
              {infoRows.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderTop: `1px solid ${theme.hair}`, fontSize: 13 }}>
                  <span style={{ color: theme.muted, flexShrink: 0, width: 128 }}>{k}</span>
                  <span style={{ color: theme.ink, minWidth: 0, wordBreak: 'break-word' }}>{v}</span>
                </div>
              ))}
              <div style={{ fontSize: 12, color: theme.muted, lineHeight: 1.45, paddingTop: 6 }}>No messages, contacts or passwords are sent. Only the ZChat team can read reports.</div>
            </div>
          )}
        </div>
        {err && <div role="alert" style={{ color: theme.danger, fontSize: 13, fontWeight: 700, marginTop: 12, textAlign: 'center' }}>{err}</div>}
      </FullPage>
  );
}

function readReportStates() {
  try {
    const raw = JSON.parse(localStorage.getItem('zchat-report-states') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch { return {}; }
}

function writeReportStates(map) {
  try {
    const keys = Object.keys(map);
    const trimmed = keys.length > 2000 ? Object.fromEntries(keys.slice(-2000).map((k) => [k, map[k]])) : map;
    localStorage.setItem('zchat-report-states', JSON.stringify(trimmed));
  } catch {}
}

function normalizeReport(row, source) {
  const pick = (...keys) => {
    for (const k of keys) if (row[k] != null && row[k] !== '') return row[k];
    return null;
  };
  const statusRaw = pick('status', 'state');
  return {
    key: `${source}-${row.id != null ? row.id : Math.random().toString(36).slice(2)}`,
    source,
    id: row.id != null ? row.id : null,
    linkedId: pick('report_id', 'message_report_id'),
    reporterId: pick('reporter_id', 'reported_by', 'from_user_id'),
    targetId: pick('reported_id', 'reported_user_id', 'target_id', 'target_user_id', 'offender_id'),
    messageId: pick('message_id'),
    reason: String(pick('reason', 'category', 'kind') || 'No reason given'),
    details: pick('details', 'note', 'notes', 'description', 'comment'),
    createdAt: pick('created_at', 'inserted_at', 'reported_at'),
    dbHandled: (!!statusRaw && /handled|resolved|closed|done|actioned|dismissed|reviewed/i.test(String(statusRaw))) || row.handled === true || row.resolved === true,
    message: null,
  };
}

export function ReportQueuePanel({ onClose, onOpenProfile }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [items, setItems] = useState(null);
  const [people, setPeople] = useState({});
  const [problems, setProblems] = useState([]);
  const [tab, setTab] = useState('open');
  const [states, setStates] = useState(() => readReportStates());
  const [banFor, setBanFor] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banBusy, setBanBusy] = useState(false);
  const [banError, setBanError] = useState('');
  const [bannedIds, setBannedIds] = useState(() => new Set());

  const fetchByIds = async (table, columns, ids) => {
    const out = [];
    for (let i = 0; i < ids.length; i += 60) {
      const { data } = await supabase.from(table).select(columns).in('id', ids.slice(i, i + 60));
      if (data) out.push(...data);
    }
    return out;
  };

  const load = async () => {
    setItems(null);
    const issues = [];
    let mr = { data: [], error: null };
    let rq = { data: [], error: null };
    try {
      [mr, rq] = await Promise.all([
        supabase.from('message_reports').select('*').limit(300),
        supabase.from('report_queue').select('*').limit(300),
      ]);
    } catch (thrown) {
      issues.push("Couldn't reach the server.");
    }
    if (mr.error) issues.push(friendlyError(mr.error, "Couldn't read message reports."));
    if (rq.error) issues.push(friendlyError(rq.error, "Couldn't read the report queue."));
    const fromMessages = (mr.data || []).map((r) => normalizeReport(r, 'message_reports'));
    const fromQueue = (rq.data || []).map((r) => normalizeReport(r, 'report_queue'));
    const linked = new Set(fromQueue.map((r) => (r.linkedId != null ? String(r.linkedId) : null)).filter(Boolean));
    const seenSig = new Set(fromQueue.filter((r) => r.messageId).map((r) => `${r.reporterId}|${r.messageId}|${r.reason}`));
    const rows = [
      ...fromQueue,
      ...fromMessages.filter((r) => !(r.id != null && linked.has(String(r.id))) && !seenSig.has(`${r.reporterId}|${r.messageId}|${r.reason}`)),
    ];
    const msgIds = [...new Set(rows.map((r) => r.messageId).filter(Boolean))];
    if (msgIds.length) {
      const msgs = await fetchByIds('messages', 'id, sender_id, receiver_id, group_id, type, content, media_url, story_id, deleted', msgIds);
      const byId = {};
      msgs.forEach((m) => { byId[m.id] = m; });
      rows.forEach((r) => {
        const m = byId[r.messageId];
        if (m) { r.message = m; if (!r.targetId) r.targetId = m.sender_id; }
      });
    }
    const pids = [...new Set(rows.flatMap((r) => [r.reporterId, r.targetId]).filter(Boolean))];
    const profs = pids.length ? await fetchByIds('profiles', '*', pids) : [];
    const map = {};
    sanitizeAvatarList(profs, '').forEach((p) => { map[p.id] = p; });
    rows.sort((x, y) => new Date(y.createdAt || 0).getTime() - new Date(x.createdAt || 0).getTime());
    setPeople(map);
    setProblems(issues);
    setItems(rows);
  };
  useEffect(() => { load(); }, []);

  const isHandled = (it) => (states[it.key] !== undefined ? states[it.key] === 'handled' : it.dbHandled);
  const setHandled = async (it, handled) => {
    const next = { ...states, [it.key]: handled ? 'handled' : 'open' };
    setStates(next);
    writeReportStates(next);
    if (it.id != null) {
      try { await supabase.from(it.source).update({ status: handled ? 'handled' : 'open' }).eq('id', it.id); } catch {}
    }
  };

  const doBan = async () => {
    if (!banFor || banBusy) return;
    setBanBusy(true);
    setBanError('');
    const { error } = await supabase.rpc('admin_ban', { p_user_id: banFor.target.id, p_reason: banReason || `Report: ${banFor.item.reason}` });
    setBanBusy(false);
    if (error) { setBanError(friendlyError(error, 'Could not ban this account.')); return; }
    setBannedIds((prev) => new Set([...prev, banFor.target.id]));
    setHandled(banFor.item, true);
    setBanFor(null);
    setBanReason('');
  };

  const list = (items || []).filter((it) => (tab === 'open' ? !isHandled(it) : isHandled(it)));
  const openCount = (items || []).filter((it) => !isHandled(it)).length;
  const doneCount = (items || []).length - openCount;

  const person = (label, p) => (
    <div role="button" onClick={() => p && onOpenProfile(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: p ? 'pointer' : 'default' }}>
      <div style={{ fontSize: 12.5, color: theme.muted, width: 92, flexShrink: 0, fontWeight: 600 }}>{label}</div>
      {p ? (
        <>
          <Avatar emoji={p.avatar} name={p.name} size={24} />
          <div style={{ fontSize: 13.5, fontWeight: 700, color: theme.ink, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.name} <span style={{ color: theme.muted, fontWeight: 500 }}>@{p.username}</span>
          </div>
          {(p.banned || bannedIds.has(p.id)) && <AdminStatus tone="danger">Banned</AdminStatus>}
        </>
      ) : <div style={{ fontSize: 13.5, color: theme.muted }}>Unknown account</div>}
    </div>
  );

  return (
    <>
    <WideDim onClose={onClose} z={40} />
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: theme.bgGradient, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Report queue" onBack={onClose} right={<div role="button" aria-label="Refresh reports" onClick={load} style={{ fontSize: 14, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer', padding: '0 10px', height: 44, display: 'flex', alignItems: 'center' }}>Refresh</div>} />
      <KitTabs key={`${openCount}:${doneCount}`} label="Reports" value={tab} onChange={setTab} options={[['open', 'Open', openCount], ['handled', 'Handled', doneCount]]} style={{ padding: '0 8px', flexShrink: 0 }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', padding: '4px 16px 0', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
        {problems.map((p, i) => (
          <div key={i} style={{ background: `${theme.danger}18`, color: theme.danger, borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700, margin: '8px 0' }}>{p}</div>
        ))}
        {items === null ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={22} color={theme.ink} /></div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: theme.muted }}>
            <div style={{ fontWeight: 700, fontSize: 15.5, color: theme.ink }}>{tab === 'open' ? 'No open reports' : 'Nothing handled yet'}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>{tab === 'open' ? 'New abuse reports show up here.' : 'Reports you mark as handled move here.'}</div>
          </div>
        ) : list.map((it, i) => {
          const reporter = people[it.reporterId];
          const target = people[it.targetId];
          const preview = it.message ? describeMessage(it.message).text : null;
          const targetBanned = !!target && (target.banned || bannedIds.has(target.id));
          return (
            <div key={it.key} style={{ padding: '14px 0 6px', boxShadow: adminHair(theme, i < list.length - 1) }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15.5, color: theme.ink, minWidth: 0 }}>{it.reason}</div>
                {it.createdAt && <div style={{ fontSize: 12, color: theme.muted, flexShrink: 0 }}>{timeAgoLong(it.createdAt)}</div>}
              </div>
              {person('Reported by', reporter)}
              {person('Account', target)}
              {(it.message || it.messageId) && (
                <div style={{ marginTop: 10, padding: '9px 12px', borderRadius: 12, background: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', fontSize: 13.5, color: theme.ink, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {preview ? String(preview).slice(0, 220) : 'That message is no longer available.'}
                </div>
              )}
              {it.details && <div style={{ marginTop: 8, fontSize: 13, color: theme.muted, lineHeight: 1.45 }}>{String(it.details).slice(0, 300)}</div>}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
                {target && <AdminTextBtn label="Open profile" onClick={() => onOpenProfile(target)} />}
                {target && !targetBanned && <AdminTextBtn label="Ban" tone="danger" onClick={() => { setBanFor({ item: it, target }); setBanError(''); }} />}
                {isHandled(it) ? <AdminTextBtn label="Reopen" onClick={() => setHandled(it, false)} /> : <AdminTextBtn label="Mark handled" tone="main" icon={<Check size={16} strokeWidth={2.6} />} onClick={() => setHandled(it, true)} />}
              </div>
            </div>
          );
        })}
      </div>
      {banFor && (
        <div onClick={() => !banBusy && setBanFor(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '20px 18px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: theme.ink, marginBottom: 8 }}>Ban @{banFor.target.username} from ZChat?</div>
            <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.6, marginBottom: 14 }}>
              This blocks their login, their email and their phone, and removes every message they sent.
            </div>
            <input style={inputStyle(theme)} placeholder="Reason, for your records" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
            {banError && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 8 }}>{banError}</div>}
            <button style={{ ...primaryBtn(theme, banBusy), background: theme.danger, marginTop: 14 }} disabled={banBusy} onClick={doBan}>
              {banBusy ? <Spinner /> : 'Ban this account'}
            </button>
            <div onClick={() => !banBusy && setBanFor(null)} style={{ textAlign: 'center', padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Cancel</div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
