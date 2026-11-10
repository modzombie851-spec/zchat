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
  AvatarMotion,
  IgToggle,
  avatarAnimSrc,
  BigButton,
  DECOR_BY_KEY,
  DECOR_FX_KEYS,
  EmptyState,
  FONT,
  FullPage,
  GroupAvatar,
  GuestbookNote,
  NameBadge,
  PillButton,
  Portal,
  STICKERS,
  STICKER_CATEGORIES,
  SegmentedControl,
  Spinner,
  appSnack,
  copyTextToClipboard,
  fetchProfilesView,
  formatCount,
  friendlyError,
  fxDprCap,
  fxPackJobs,
  gbCount,
  gbFirst,
  gbPing,
  gbWhyText,
  hapticTap,
  inputStyle,
  playUiSound,
  prefOn,
  profileShareLink,
  qrDataUrl,
  reducedMotion,
  reportClientError,
  sanitizeAvatarList,
  searchAccounts,
  silentDownload,
  useBackClose,
  useGuestbook,
  useGuestbookWrite,
  useSheetDrag,
  useTheme,
  visitorsPageMem,
} from '../App.jsx';
import {
  FX_ART,
  FX_PACK_SI,
  KitSection,
} from './shared.jsx';


export function ShareProfileSheet({ profile, myId, conversations, groups, onSend, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const link = profileShareLink(profile.id);
  const qrUrl = useMemo(() => qrDataUrl(link, 360) || `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=10&data=${encodeURIComponent(link)}`, [link]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const timer = useRef(null);
  const toastTimer = useRef(null);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const userItem = (p) => ({ key: 'u-' + p.id, kind: 'user', id: p.id, name: p.name, avatar: p.avatar, sub: '@' + p.username });
  const groupItem = (g) => ({ key: 'g-' + g.id, kind: 'group', id: g.id, name: g.name, avatar: g.avatar, sub: 'Group' });

  const baseItems = [
    ...(conversations || []).filter((c) => !c.otherProfile.is_deleted).map((c) => userItem(c.otherProfile)),
    ...(groups || []).map(groupItem),
  ];

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
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      const people = sanitizeAvatarList(data, myId).filter((u) => u.id !== myId && !u.is_deleted).map(userItem);
      const term = val.trim().toLowerCase();
      const groupMatches = (groups || []).filter((g) => (g.name || '').toLowerCase().includes(term)).map(groupItem);
      setResults([...groupMatches, ...people]);
    }, 300);
  };

  const list = q.trim().length >= 2 ? results : baseItems;
  const isSelected = (item) => selected.some((s) => s.key === item.key);
  const toggle = (item) => setSelected((prev) => (prev.some((s) => s.key === item.key) ? prev.filter((s) => s.key !== item.key) : [...prev, item]));

  const doCopy = async () => {
    const ok = await copyTextToClipboard(link);
    flash(ok ? 'Link copied' : "Couldn't copy the link");
  };

  const doNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.name} on ZChat`, text: `Check out ${profile.name} (@${profile.username}) on ZChat`, url: link });
      } catch {}
      return;
    }
    doCopy();
  };

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    await onSend(selected, note.trim(), link);
    setSending(false);
    flash(selected.length === 1 ? `Sent to ${selected[0].name}` : `Sent to ${selected.length} chats`);
    setSelected([]);
    setNote('');
  };

  const actionBtn = (icon, label, onClick) => (
    <div onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
      <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink }}>{React.cloneElement(icon, { size: 24, strokeWidth: 1.6 })}</div>
      <span style={{ fontSize: 12, color: theme.ink, fontWeight: 500 }}>{label}</span>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, background: 'rgba(10,8,6,0.55)', zIndex: 60,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} className="zchat-fade">
      <div onClick={(e) => e.stopPropagation()} style={{
        background: theme.panelBg, borderRadius: '26px 26px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.border }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 18px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: theme.ink }}>Share profile</div>
          <X size={20} style={{ cursor: 'pointer', color: theme.muted }} onClick={onClose} />
        </div>

        <div style={{ margin: '0 18px', borderRadius: 24, background: theme.coral, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: 'white', borderRadius: 18, padding: 10 }}>
            <img src={qrUrl} alt="" width={170} height={170} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ display: 'block', width: 170, height: 170 }} />
          </div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 18, marginTop: 12 }}>@{profile.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 2 }}>{profile.name} on ZChat</div>
        </div>

        <div style={{ display: 'flex', padding: '16px 18px 6px' }}>
          {actionBtn(<Copy size={20} />, 'Copy link', doCopy)}
          {actionBtn(<Share2 size={20} />, 'Share to', doNativeShare)}
          {actionBtn(<Download size={20} />, 'Save QR', () => silentDownload(qrUrl, `zchat-${profile.username}-qr.png`))}
        </div>

        <div style={{ padding: '12px 18px 4px', fontSize: 13, fontWeight: 800, color: theme.ink }}>Send in ZChat</div>
        <div style={{ padding: '4px 18px 8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
            <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search people or groups" autoCapitalize="none"
              style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
          </div>
        </div>
        <div style={{ padding: '0 12px', paddingBottom: selected.length ? 8 : 'calc(18px + env(safe-area-inset-bottom))' }}>
          {list.length === 0 && (
            <div style={{ textAlign: 'center', padding: 18, fontSize: 13, color: theme.muted }}>
              {q.trim().length >= 2 ? 'No one found' : 'Your chats will show here'}
            </div>
          )}
          {list.map((item) => (
            <div key={item.key} onClick={() => toggle(item)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', cursor: 'pointer', borderRadius: 12 }}>
              {item.kind === 'group' ? <GroupAvatar avatar={item.avatar} name={item.name} size={42} /> : <Avatar emoji={item.avatar} name={item.name} size={42} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.sub}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${isSelected(item) ? theme.coral : theme.border}`, background: isSelected(item) ? theme.coral : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{isSelected(item) && <Check size={13} color="white" />}</div>
            </div>
          ))}
        </div>

        {selected.length > 0 && (
          <div style={{
            position: 'sticky', bottom: 0, background: theme.panelBg, borderTop: `1px solid ${theme.border}`,
            padding: '10px 18px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input value={note} onChange={(e) => setNote(e.target.value.slice(0, 500))} placeholder="Write a message"
              style={{ ...inputStyle(theme), padding: '10px 14px', fontSize: 14, borderRadius: 22 }} />
            <button onClick={send} disabled={sending} style={{
              padding: '10px 18px', borderRadius: 22, border: 'none', background: theme.coral, color: 'white',
              fontWeight: 700, fontSize: 13.5, cursor: sending ? 'default' : 'pointer', fontFamily: FONT, flexShrink: 0,
            }}>{sending ? <Spinner size={13} /> : (selected.length > 1 ? `Send (${selected.length})` : 'Send')}</button>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'sticky', bottom: selected.length ? 70 : 16, margin: '0 auto', width: 'fit-content',
            background: theme.ink, color: theme.panelBg, fontSize: 12.5, fontWeight: 700, padding: '8px 14px', borderRadius: 20,
          }} className="zchat-fade">{toast}</div>
        )}
      </div>
    </div>
  );
}
function visitAgoText(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 2) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}
export function ProfileVisitorsPage({ myId, me, onClose, onOpenProfile, onToggle }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const on = !me || me.visitors_on !== false;
  const [rows, setRows] = useState(() => visitorsPageMem.get(myId) || null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!on) { setRows([]); return undefined; }
    let alive = true;
    (async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data, error } = await supabase.from('profile_visits').select('viewer_id, viewed_at, n').eq('profile_id', myId).gt('viewed_at', since).order('viewed_at', { ascending: false }).limit(200);
      if (error && !data) { if (alive) setRows((prev) => prev || []); return; }
      const list = data || [];
      if (!list.length) { visitorsPageMem.set(myId, []); if (alive) setRows([]); return; }
      const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, avatar_frame, nameplate, verified, custom_badge, is_deleted').in('id', list.map((r) => r.viewer_id));
      const byId = {};
      sanitizeAvatarList(profs || [], myId).forEach((pr) => { if (!pr.is_deleted) byId[pr.id] = pr; });
      const next = list.map((r) => ({ ...r, profile: byId[r.viewer_id] })).filter((r) => r.profile);
      visitorsPageMem.set(myId, next);
      if (alive) setRows(next);
    })();
    return () => { alive = false; };
  }, [on]);
  const week = (rows || []).filter((r) => Date.now() - new Date(r.viewed_at).getTime() < 7 * 86400000).length;
  const toggle = async () => { if (busy) return; setBusy(true); await onToggle(!on); setBusy(false); };
  return (
    <FullPage title="Profile visitors" subtitle={on ? (rows ? `${rows.length} in the last 30 days` : 'Loading') : 'Off'} onBack={onClose} zIndex={72} pad={false}>
      {!on ? (
        <EmptyState art="insights" title="Profile visitors is off" text="Turn it on to see who viewed your profile in the last 30 days. While it is off, you also stay hidden on other people's visitor lists." action={<PillButton primary label={busy ? 'Turning on' : 'Turn on'} disabled={busy} onClick={toggle} />} />
      ) : rows === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner color={theme.muted} /></div>
      ) : !rows.length ? (
        <EmptyState art="insights" title="No visitors yet" text="When someone opens your profile, they show up here for 30 days." />
      ) : (
        <>
          <div role="button" aria-label="Turn off profile visitors" onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px 4px', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 650, color: theme.ink }}>Show profile visitors</div>
              <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Turn off to hide your visits too</div>
            </div>
            <IgToggle on={on} />
          </div>
          <div style={{ display: 'flex', gap: 10, padding: '12px 16px 6px' }}>
            {[[rows.length, 'last 30 days'], [week, 'this week'], [rows.reduce((a, r) => a + (Number(r.n) || 1), 0), 'visits']].map(([n, l]) => (
              <div key={l} style={{ flex: 1, padding: '12px 10px', borderRadius: 14, background: theme.rowBg, textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em' }}>{formatCount(n)}</div>
                <div style={{ fontSize: 12, color: theme.muted, fontWeight: 600, marginTop: 1 }}>{l}</div>
              </div>
            ))}
          </div>
          <div role="list" aria-label="Profile visitors" style={{ padding: '6px 0 10px' }}>
            {rows.map((r) => (
              <div key={r.viewer_id} role="listitem" aria-label={`Visitor ${r.profile.name}`} onClick={() => onOpenProfile(r.profile)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', cursor: 'pointer' }}>
                <Avatar emoji={r.profile.avatar} name={r.profile.name} size={50} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: theme.ink, minWidth: 0 }}><NameBadge name={r.profile.name} verified={r.profile.verified} custom={r.profile.custom_badge} size={13} /></div>
                  <div style={{ fontSize: 13, color: theme.muted, marginTop: 1 }}>{visitAgoText(r.viewed_at)}{Number(r.n) > 1 ? `, ${r.n} visits` : ''}</div>
                </div>
                <ChevronRight size={18} color={theme.muted} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '4px 16px 20px' }}>People who turned off Profile visitors do not show here, and they cannot see their own visitors either.</div>
        </>
      )}
    </FullPage>
  );
}
function useGuestbookActions(ownerId, myId, patch, reload, ownerName) {
  const setStatus = async (note, status) => {
    hapticTap();
    const before = note.status;
    patch((p) => { const notes = p.notes.map((x) => (x.id === note.id ? { ...x, status } : x)); return { ...p, ...gbCount(notes), notes }; });
    gbPing(ownerId);
    appSnack(status === 'shown' ? 'Shown on your profile' : 'Hidden from your profile');
    let res = null;
    try { res = await supabase.rpc('zchat_guestbook_decide', { p_id: note.id, p_status: status }); } catch {}
    if (!res || res.error || !res.data || !res.data.ok) {
      patch((p) => { const notes = p.notes.map((x) => (x.id === note.id ? { ...x, status: before } : x)); return { ...p, ...gbCount(notes), notes }; });
      gbPing(ownerId);
      appSnack(friendlyError(res && res.error, "Couldn't change that note. Try again."));
      return;
    }
    reload();
  };
  const remove = async (note) => {
    hapticTap();
    let keep = null;
    patch((p) => { keep = p.notes; const notes = p.notes.filter((x) => x.id !== note.id); return { ...p, ...gbCount(notes), notes, can: note.writer_id === myId && note.status === 'pending' ? { ok: true } : p.can }; });
    gbPing(ownerId);
    appSnack('Note deleted');
    let res = null;
    try { res = await supabase.rpc('zchat_guestbook_delete', { p_id: note.id }); } catch {}
    if (!res || res.error || !res.data || !res.data.ok) {
      if (keep) patch((p) => ({ ...p, ...gbCount(keep), notes: keep }));
      gbPing(ownerId);
      appSnack(friendlyError(res && res.error, "Couldn't delete that note. Try again."));
      return;
    }
    reload();
  };
  const report = async (note) => {
    hapticTap();
    appSnack('Thanks. We will take a look.');
    try { await reportUser(myId, note.writer_id, `Guestbook note ${note.id} on ${ownerName || ownerId}: ${note.body || note.sticker || ''}`.slice(0, 400)); } catch {}
  };
  return { setStatus, remove, report };
}
const GB_STICKER_TABS = STICKER_CATEGORIES.filter((c) => c.key !== 'favorites');
export function GuestbookWriteSheet({ owner, onClose, onSend }) {
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  useBackClose(true, onClose);
  const [mode, setMode] = useState('note');
  const [text, setText] = useState('');
  const [cat, setCat] = useState(GB_STICKER_TABS[0].key);
  const left = 140 - text.length;
  const clean = text.trim();
  const list = STICKERS.filter((x) => x.category === cat && typeof x.file === 'string' && /^\/[A-Za-z0-9][A-Za-z0-9._-]{1,90}\.(webp|gif|png)$/.test(x.file));
  const send = (body, sticker) => { hapticTap(); playUiSound('send'); onSend(body, sticker); };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 880, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" {...drag.sheetProps} role="dialog" aria-modal="true" aria-label="Write in guestbook"
          style={{ ...drag.sheetStyle, width: '100%', maxWidth: 480, maxHeight: 'min(86vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '20px 20px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div data-sheet-handle="true" style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 6px', touchAction: 'none' }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div data-sheet-handle="true" style={{ fontSize: 16, fontWeight: 800, color: theme.ink, textAlign: 'center', padding: '4px 16px 12px', touchAction: 'none' }}>{`Write in ${gbFirst(owner.name)}'s guestbook`}</div>
          <div style={{ padding: '0 16px' }}>
            <SegmentedControl value={mode} onChange={(v) => { hapticTap(); setMode(v); }} options={[['note', 'Note'], ['sticker', 'Sticker']]} />
          </div>
          {mode === 'note' ? (
            <div style={{ padding: '14px 16px 0' }}>
              <textarea value={text} onChange={(e) => setText(e.target.value.slice(0, 140))} autoFocus rows={3} aria-label="Your note" placeholder="Say something nice"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'none', minHeight: 96, padding: '12px 14px', borderRadius: 16, border: `1px solid ${theme.border}`, background: theme.inputBg, color: theme.ink, fontFamily: FONT, fontSize: 16, lineHeight: 1.4, outline: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 2px 12px' }}>
                <span style={{ fontSize: 12.5, color: theme.muted }}>{`${gbFirst(owner.name)} sees it first and can show it on their profile.`}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: left < 15 ? theme.danger : theme.muted, fontVariantNumeric: 'tabular-nums', flexShrink: 0, marginLeft: 10 }}>{left}</span>
              </div>
              <BigButton label="Post note" disabled={!clean} onClick={() => { if (clean) send(clean, null); }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, paddingTop: 10 }}>
              <div role="tablist" aria-label="Sticker packs" style={{ display: 'flex', gap: 18, overflowX: 'auto', padding: '0 16px', flexShrink: 0, scrollbarWidth: 'none', boxShadow: `inset 0 -1px 0 ${theme.hair}` }}>
                {GB_STICKER_TABS.map((c) => {
                  const on = c.key === cat;
                  return <div key={c.key} role="tab" aria-selected={on} onClick={() => { hapticTap(); setCat(c.key); }} style={{ padding: '10px 0', fontSize: 14, fontWeight: on ? 700 : 500, color: on ? theme.ink : theme.muted, whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: on ? `inset 0 -2px 0 ${theme.coral}` : 'none' }}>{c.label}</div>;
                })}
              </div>
              <div style={{ overflowY: 'auto', padding: '12px 12px 4px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, minHeight: 220, maxHeight: 320 }}>
                {list.map((st) => (
                  <div key={st.key} role="button" aria-label={`Send sticker ${st.label}`} onClick={() => send(null, st.file)} className="zchat-press" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, cursor: 'pointer', background: theme.soft }}>
                    <img src={st.file} alt={st.label} loading="lazy" decoding="async" draggable={false} style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
export function GuestbookPage({ owner, myId, me, onClose, onOpenProfile, zIndex = 82 }) {
  const { theme } = useTheme();
  const isOwner = owner.id === myId;
  const [page, patch, reload] = useGuestbook(owner.id, true);
  const [writing, setWriting] = useState(false);
  const actions = useGuestbookActions(owner.id, myId, patch, reload, owner.name);
  const write = useGuestbookWrite(owner, myId, me, patch, reload);
  const notes = (page && page.notes) || [];
  const pending = notes.filter((x) => x.status === 'pending');
  const shown = notes.filter((x) => x.status === 'shown');
  const hidden = notes.filter((x) => x.status === 'hidden');
  const can = !!(page && page.can && page.can.ok);
  const why = page && page.can ? gbWhyText(page.can.why, owner.name) : '';
  const row = (x) => <GuestbookNote key={x.id} note={x} ownerId={owner.id} ownerName={owner.name} myId={myId} actions={actions} onOpenProfile={onOpenProfile} />;
  const footer = isOwner ? null : can ? <BigButton label="Write in guestbook" onClick={() => { hapticTap(); setWriting(true); }} /> : why ? <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', lineHeight: 1.45, padding: '4px 8px' }}>{why}</div> : null;
  return (
    <FullPage title={isOwner ? 'Your guestbook' : 'Guestbook'} subtitle={isOwner ? undefined : owner.name} onBack={onClose} zIndex={zIndex} footer={footer}>
      {page === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={20} color={theme.muted} /></div> : !notes.length ? (
        isOwner
          ? <EmptyState art="comments" title="No notes yet" text="When friends write in your guestbook, you see their notes here first and choose which ones show on your profile." />
          : <EmptyState art="comments" title="No notes yet" text={can ? `Be the first to leave ${gbFirst(owner.name)} a note.` : `Notes ${gbFirst(owner.name)} shows on their profile appear here.`} />
      ) : (
        <div role="list" aria-label="Guestbook notes" style={{ paddingBottom: 12 }}>
          {isOwner && pending.length > 0 && (
            <KitSection title="Waiting for you" right={String(pending.length)} style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.45, marginTop: -4, paddingBottom: 2 }}>Only you can see these until you show them.</div>
              {pending.map(row)}
            </KitSection>
          )}
          {!isOwner && pending.filter((x) => x.writer_id === myId).map(row)}
          {shown.length > 0 && <KitSection title={isOwner ? 'On your profile' : 'Notes'} right={String(shown.length)} style={{ marginTop: isOwner && pending.length ? 22 : 8 }}>{shown.map(row)}</KitSection>}
          {isOwner && hidden.length > 0 && (
            <KitSection title="Hidden" right={String(hidden.length)} style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.45, marginTop: -4, paddingBottom: 2 }}>Only you can see these.</div>
              {hidden.map(row)}
            </KitSection>
          )}
        </div>
      )}
      {writing && <GuestbookWriteSheet owner={owner} onClose={() => setWriting(false)} onSend={(b, st) => { setWriting(false); write(b, st); }} />}
    </FullPage>
  );
}
export function ProfilePhotosViewer({ list, start = 0, name, anim = null, onClose }) {
  useBackClose(true, onClose);
  const ref = useRef(null);
  const [i, setI] = useState(start);
  const animUrl = anim ? avatarAnimSrc(anim) : null;
  useLayoutEffect(() => { const el = ref.current; if (el && start) el.scrollLeft = start * el.clientWidth; }, []);
  const go = (d) => { const el = ref.current; if (!el) return; const n = Math.max(0, Math.min(list.length - 1, i + d)); el.scrollTo({ left: n * el.clientWidth, behavior: reducedMotion() ? 'auto' : 'smooth' }); };
  useEffect(() => {
    const k = (e) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  const arrow = { position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
  return (
    <Portal>
      <div role="dialog" aria-label={`Photos of ${name || 'this person'}`} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: '#000', color: '#FFFFFF', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 'calc(8px + env(safe-area-inset-top)) 10px 6px', flexShrink: 0 }}>
          <div role="button" aria-label="Close" onClick={onClose} className="zchat-press" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={22} /></div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          {list.length > 1 && <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', fontVariantNumeric: 'tabular-nums', paddingRight: 8 }}>{i + 1} of {list.length}</div>}
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <div ref={ref} onScroll={(e) => { const el = e.currentTarget; const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); if (n !== i) setI(n); }}
            style={{ position: 'absolute', inset: 0, display: 'flex', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', overscrollBehavior: 'contain', touchAction: 'pan-x' }}>
            {list.map((u, k) => (
              <div key={`${k}:${u}`} style={{ flex: '0 0 100%', width: '100%', height: '100%', scrollSnapAlign: 'center', scrollSnapStop: 'always', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {k === 0 && animUrl ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: 'min(100vw, calc(100dvh - 150px))', aspectRatio: '1 / 1', overflow: 'hidden' }}>
                    <img src={u} alt={`Photo ${k + 1}`} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <AvatarMotion url={animUrl} size={640} />
                  </div>
                ) : <img src={u} alt={`Photo ${k + 1}`} draggable={false} onContextMenu={(e) => e.preventDefault()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />}
              </div>
            ))}
          </div>
          {list.length > 1 && i > 0 && <div role="button" aria-label="Previous photo" onClick={() => go(-1)} className="zchat-press" style={{ ...arrow, left: 12 }}><ChevronLeft size={22} /></div>}
          {list.length > 1 && i < list.length - 1 && <div role="button" aria-label="Next photo" onClick={() => go(1)} className="zchat-press" style={{ ...arrow, right: 12 }}><ChevronRight size={22} /></div>}
        </div>
        {list.length > 1 && (
          <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 0 calc(16px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
            {list.map((u, k) => <span key={k} style={{ width: k === i ? 18 : 6, height: 6, borderRadius: 3, background: k === i ? '#FFFFFF' : 'rgba(255,255,255,0.4)', transition: 'width 0.2s ease, background 0.2s ease' }} />)}
          </div>
        )}
      </div>
    </Portal>
  );
}

const FX_PACK = '/fx-pack.js';
const FX_PACK2 = '/fx-pack2.js';
const fxBaseKey = (key) => (DECOR_BY_KEY[key] && DECOR_BY_KEY[key].base) || key;
const fxPackOf = (key) => (DECOR_BY_KEY[key] && DECOR_BY_KEY[key].pair ? FX_PACK_SI : DECOR_FX_KEYS.has(fxBaseKey(key)) || key === 'crystal_phoenix' || key === 'fire_phoenix' ? FX_PACK : FX_PACK2);
const fxFactories = new Map();
const fxArtJobs = new Map();
let fxReported = false;
function fxReport(msg) {
  if (fxReported) return;
  fxReported = true;
  reportClientError(msg, '', { kind: 'fx' });
}
function fxDrain() {
  try {
    const q = window.__zfxq;
    if (!Array.isArray(q)) return;
    while (q.length) {
      const it = q.shift();
      if (Array.isArray(it) && typeof it[0] === 'string' && typeof it[1] === 'function') fxFactories.set(it[0], it[1]);
    }
  } catch {}
}
function fxPack(src) {
  if (fxPackJobs.has(src)) return fxPackJobs.get(src);
  const job = fetch(src)
    .then((res) => {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!res.ok || ct.includes('text/html')) { fxReport(`Profile effects file did not load: ${res.status} ${ct}`); return false; }
      return res.text().then((code) => new Promise((resolve) => {
        const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
        const el = document.createElement('script');
        el.src = url;
        el.onload = () => { URL.revokeObjectURL(url); fxDrain(); resolve(!!window.ZFXK); };
        el.onerror = () => { URL.revokeObjectURL(url); el.remove(); resolve(false); };
        document.head.appendChild(el);
      }));
    })
    .catch((e) => { fxReport(`Profile effects file did not load: ${(e && e.message) || 'network'}`); return false; })
    .then((ok) => { if (!ok) setTimeout(() => { fxPackJobs.delete(src); }, 8000); return ok; });
  fxPackJobs.set(src, job);
  return job;
}
function fxArtReady(key) {
  const src = FX_ART[key];
  if (!src) return Promise.resolve(true);
  if (!fxArtJobs.has(key)) {
    fxArtJobs.set(key, new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(true);
      img.onerror = () => { setTimeout(() => fxArtJobs.delete(key), 60000); resolve(false); };
      img.src = src;
    }));
  }
  return fxArtJobs.get(key);
}
function loadFx(key) {
  const s = DECOR_BY_KEY[key];
  if (!s || !s.fx || typeof window === 'undefined') return Promise.resolve(null);
  return Promise.all([fxPack(fxPackOf(key)), fxArtReady(fxBaseKey(key))]).then(([ok, art]) => (ok && art ? fxFactories.get(fxBaseKey(key)) || null : null));
}
function fxAllowed() {
  return prefOn('zchat-profile-fx') && !prefOn('zchat-reduce-motion');
}
export function ProfileEffectLayer({ effectKey, runKey = 0, force = false, delay = 280, z = 30, height = 0, covered = false, watch = false }) {
  const ref = useRef(null);
  const [factory, setFactory] = useState(null);
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(false);
  const [fade, setFade] = useState(0);
  const st = useRef({ away: false, covered, m: null, opts: null });
  const want = !!effectKey && (force || fxAllowed());
  useEffect(() => {
    let alive = true;
    setFactory(null);
    if (!want) return undefined;
    loadFx(effectKey).then((f) => { if (alive && f) setFactory(() => f); });
    return () => { alive = false; };
  }, [effectKey, want]);
  const sync = () => {
    const o = st.current;
    const hold = o.covered || o.away;
    if (o.opts) o.opts.paused = hold || !!o.opts.dead;
    if (!o.m || (o.opts && o.opts.dead)) return;
    if (hold) o.m.stop();
    else if (typeof document === 'undefined' || !document.hidden) o.m.start();
  };
  useEffect(() => { setRun((n) => n + 1); }, [effectKey, runKey]);
  useEffect(() => { st.current.covered = covered; sync(); }, [covered]);
  useEffect(() => {
    const onVis = () => { if (typeof document !== 'undefined' && !document.hidden) sync(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVis);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pageshow', onVis); };
  }, []);
  useEffect(() => {
    if (!watch || !factory) return undefined;
    const cv = ref.current;
    if (!cv || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      const o = st.current;
      const ratio = e && e.isIntersecting ? e.intersectionRatio : 0;
      if (ratio < 0.08 && !o.away) { o.away = true; sync(); }
      else if (ratio > 0.3 && o.away) { o.away = false; sync(); }
    }, { threshold: [0, 0.08, 0.3, 0.6] });
    io.observe(cv);
    return () => { io.disconnect(); if (st.current.away) { st.current.away = false; sync(); } };
  }, [watch, factory]);
  useEffect(() => {
    if (!factory) return undefined;
    const o = st.current;
    let alive = true;
    let tries = 0;
    let timer = 0;
    let ro = null;
    let booted = false;
    const waitForSize = () => {
      const cv = ref.current;
      if (!alive || !cv) return;
      if (ro) return;
      try {
        ro = new ResizeObserver(() => { if (!alive || booted) return; const r2 = cv.getBoundingClientRect(); if (r2.width >= 40 && r2.height >= 40) { ro.disconnect(); ro = null; boot(); } });
        ro.observe(cv);
      } catch { if (tries++ < 25) timer = setTimeout(boot, 400); }
    };
    const boot = () => {
      const cv = ref.current;
      if (!alive || !cv || booted) return;
      if (!window.ZFXK) { if (tries++ < 25) timer = setTimeout(boot, 400); return; }
      const r = cv.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) { waitForSize(); return; }
      booted = true;
      const holder = cv.parentElement && cv.parentElement.querySelector('[data-fx-hero]');
      const hb = holder && holder.firstElementChild ? holder.firstElementChild.getBoundingClientRect() : null;
      const sc = r.width / (cv.clientWidth || r.width) || 1;
      const hw = holder && holder.firstElementChild ? holder.firstElementChild.offsetWidth : 0;
      const place = hb && hw > 60 ? { top: (hb.top - r.top) / sc, heroW: hw, cx: (hb.left - r.left + hb.width / 2) / sc } : {};
      if (height > 0 && hb && hw > 60) setFade(Math.max(0, Math.round((hb.bottom - r.top) / sc)));
      const opts = {
        stopAfter: 0, endless: true, dprCap: fxDprCap(), maxFps: /Android/i.test(navigator.userAgent || '') ? 30 : 0, base: '/', ...place,
        paused: o.covered || o.away || (typeof document !== 'undefined' && document.hidden),
        onError: (e) => { opts.dead = true; opts.paused = true; if (alive) setShown(false); reportClientError(`Profile effect ${effectKey}: ${(e && e.message) || e}`, e && e.stack, { kind: 'fx' }); },
      };
      try {
        o.opts = opts;
        o.m = window.ZFXK.mount(cv, factory, opts);
        setShown(true);
      } catch (e) {
        o.m = null;
        o.opts = null;
        setShown(false);
        reportClientError(`Profile effect ${effectKey}: ${(e && e.message) || e}`, e && e.stack, { kind: 'fx' });
      }
    };
    timer = setTimeout(boot, delay);
    return () => {
      alive = false;
      clearTimeout(timer);
      if (ro) { try { ro.disconnect(); } catch {} ro = null; }
      if (o.m) o.m.destroy();
      o.m = null;
      o.opts = null;
      setShown(false);
      const cv = ref.current;
      if (cv) { try { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); } catch {} }
    };
  }, [factory, run]);
  if (!want || !factory) return null;
  const mask = fade > 0 ? `linear-gradient(180deg, #000 0px, #000 ${fade}px, rgba(0,0,0,0.6) ${fade + 90}px, rgba(0,0,0,0.6) 78%, transparent 100%)` : 'linear-gradient(180deg, #000 0%, #000 78%, transparent 100%)';
  const box = height > 0 ? { top: 0, left: 0, right: 0, width: '100%', height, WebkitMaskImage: mask, maskImage: mask } : { inset: 0, width: '100%', height: '100%' };
  return <canvas ref={ref} aria-hidden="true" data-fx-layer="true" style={{ position: 'absolute', ...box, pointerEvents: 'none', zIndex: z, visibility: shown && !covered ? 'visible' : 'hidden' }} />;
}
