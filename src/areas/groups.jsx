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
  AddMembersPanel,
  Avatar,
  BigButton,
  CalendarIcon,
  ChatRowSheet,
  ChatThemePage,
  CoinIcon,
  CommunityGlyph,
  ConfirmSheet,
  DECOR_BY_KEY,
  DetailRow,
  DetailSection,
  EmptyState,
  FONT,
  FullPage,
  G1Ctx,
  G1LogPage,
  G1RulesSheet,
  G1Sheet,
  G1TextBtn,
  G1_ANSWERS,
  G2EmojiPage,
  G2KeywordsPage,
  GROUP_RANK,
  GroupAvatar,
  IgTopBar,
  LineTabs,
  MemberTitleSheet,
  NameBadge,
  PhotoCropEditor,
  Pin_,
  Portal,
  RichText,
  Spinner,
  TOPIC_COLORS,
  VerifiedBadge,
  WideDim,
  albumChatKey,
  appAlert,
  countWord,
  disappearLabel,
  fetchProfilesView,
  fmtDate,
  friendlyError,
  g1On,
  g1Questions,
  g1Rules,
  g2Hide,
  g2HideSet,
  g2KwOf,
  getProfile,
  groupRankOf,
  groupRoleOf,
  groupTopicsOf,
  hapticTap,
  igPalette,
  inputStyle,
  isMemberOnline,
  kitOnInk,
  memberMute,
  parseOnce,
  photoBlockText,
  photoSafetyCheck,
  primaryBtn,
  sanitizeAvatarList,
  searchAccounts,
  sendPushNotification,
  siCss,
  siHalfOf,
  timeAgoLong,
  uploadMedia,
  useBackClose,
  useCr,
  useEdgeSwipeBack,
  useG2Emo,
  useG2Hide,
  useG2Kw,
  useTheme,
  groupWrite,
} from '../App.jsx';
import {
  BubblesIcon,
  ChatToolsSection,
  DetailActions,
  DetailTiles,
  DisappearSheet,
  GroupRoleBadge,
  MediaStrip,
  MemberCrownGlyph,
  MemberRemoveGlyph,
  MemberTagGlyph,
  ModShieldGlyph,
  PdfGlyph,
  ThemeIcon,
  detailRows,
  groupAccent,
  mutedUntilText,
} from './shared.jsx';


export function CreateGroupPanel({ myId, onClose, onCreated }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [step, setStep] = useState('members');
  useBackClose(step === 'details', () => setStep('members'));
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [accent, setAccent] = useState(() => GROUP_ACCENTS[Math.floor(Math.random() * GROUP_ACCENTS.length)]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showColour, setShowColour] = useState(false);
  useBackClose(showColour, () => setShowColour(false));
  const [err, setErr] = useState('');
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
    timer.current = setTimeout(async () => {
      const { data } = await searchAccounts(val.trim());
      setResults(sanitizeAvatarList(data, myId).filter((u) => u.id !== myId));
    }, 300);
  };

  const toggleSelect = (p) => {
    setSelected((prev) => (prev.find((s) => s.id === p.id) ? prev.filter((s) => s.id !== p.id) : [...prev, p]));
  };

  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    setErr('');
    const people = selected.slice(0, 49);
    const baseRow = { name: name.trim().slice(0, 50), bio: bio.trim() || null, avatar: null, created_by: myId };
    const upJob = avatarFile ? uploadMedia(avatarFile, myId).catch(() => ({ url: null })) : null;
    const authErr = (e) => !!e && /jwt|token|unauthorized|not authenticated/i.test(String(e.message || e));
    const noFn = (e) => !!e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function|does not exist/i.test(String(e.message || '')));
    const viaRpc = () => supabase.rpc('zchat_group_create', { p_name: baseRow.name, p_bio: baseRow.bio, p_accent: accent || null, p_members: people.map((p) => p.id) });
    let group = null;
    let sys = null;
    let addedIds = null;
    let skippedIds = [];
    let setup = false;
    let { data: out, error } = await viaRpc();
    if (error && authErr(error)) { try { await supabase.auth.refreshSession(); } catch {} ({ data: out, error } = await viaRpc()); }
    if (!error && out && out.group) {
      group = out.group;
      sys = out.sys || null;
      addedIds = Array.isArray(out.added) ? out.added : [];
      skippedIds = Array.isArray(out.skipped) ? out.skipped : [];
    } else if (error && !noFn(error)) {
      setCreating(false);
      setErr(friendlyError(error, "Couldn't create the group. Try again."));
      return;
    } else {
      const gid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : null;
      const insertGroup = async (row) => (gid ? supabase.from('groups').insert({ ...row, id: gid }) : supabase.from('groups').insert(row).select().single());
      let res = await insertGroup({ ...baseRow, accent });
      if (res.error && /accent/i.test(String(res.error.message || ''))) res = await insertGroup(baseRow);
      if (res.error && authErr(res.error)) { try { await supabase.auth.refreshSession(); } catch {} res = await insertGroup({ ...baseRow, accent }); }
      if (res.error) { setCreating(false); setErr(friendlyError(res.error, "Couldn't create the group. Try again.")); return; }
      const id = gid || (res.data && res.data.id);
      if (!id) { setCreating(false); setErr("Couldn't create the group. Try again."); return; }
      const { error: memberErr } = await supabase.from('group_members').insert({ group_id: id, user_id: myId, role: 'admin', added_by: myId });
      if (memberErr) { setCreating(false); setErr(friendlyError(memberErr, "Couldn't create the group. Try again.")); return; }
      const { data: row } = gid ? await supabase.from('groups').select('*').eq('id', id).maybeSingle() : { data: res.data };
      group = row || { ...baseRow, accent, id, created_at: new Date().toISOString() };
      addedIds = [];
      if (people.length) {
        const all = await supabase.from('group_members').insert(people.map((p) => ({ group_id: id, user_id: p.id, role: 'member', added_by: myId })));
        if (!all.error) addedIds = people.map((p) => p.id);
        else {
          for (const p of people) {
            const one = await supabase.from('group_members').insert({ group_id: id, user_id: p.id, role: 'member', added_by: myId });
            if (one.error) { skippedIds.push(p.id); if (String(one.error.code || '') === '42501' || /row.level security|permission/i.test(String(one.error.message || ''))) setup = true; } else addedIds.push(p.id);
          }
        }
      }
      const addedNames = people.filter((p) => addedIds.includes(p.id)).map((p) => p.name);
      const sysRes = await supabase.from('messages').insert({ sender_id: myId, group_id: id, type: 'system', content: addedNames.length ? `Group created and ${addedNames.join(', ')} added` : 'Group created' }).select().single();
      sys = sysRes && !sysRes.error ? sysRes.data : null;
    }
    const added = people.filter((p) => addedIds.includes(p.id));
    const skipped = people.filter((p) => skippedIds.includes(p.id));
    const upRes = upJob ? await upJob : null;
    const avatarUrl = (upRes && upRes.url) || null;
    let avatarOk = false;
    if (avatarUrl) {
      const gate = await photoSafetyCheck([avatarUrl], 'group').catch(() => null);
      if (gate && (gate.verdict === 'block' || gate.verdict === 'sensitive')) appAlert(photoBlockText('group', gate.reason));
      else { const r = await groupWrite(group.id, { avatar: avatarUrl }); avatarOk = r.ok; }
    }
    if (added.length) {
      getProfile(myId).then(({ data: creator }) => {
        added.forEach((p) => sendPushNotification(p.id, 'ZChat', `${creator?.name || 'Someone'} added you to ${group.name}`, `/?group=${group.id}`, creator?.avatar));
      }, () => {});
    }
    setCreating(false);
    onCreated({ ...group, ...(avatarOk ? { avatar: avatarUrl } : {}) }, { sys, people: added, skipped, setup });
  };

  const isPicked = (id) => !!selected.find((s) => s.id === id);
  const heading = step === 'members' ? 'Choose members' : 'Group details';
  const canNext = selected.length > 0;

  return (
    <>
    <WideDim onClose={onClose} z={40} />
    <div style={{ position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 40, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title={heading} subtitle={step === 'members' ? 'Step 1 of 2' : 'Step 2 of 2'} onBack={() => (step === 'details' ? setStep('members') : onClose())} />

      {step === 'members' ? (
        <>
          {selected.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 18px 10px', maxHeight: 112, overflowY: 'auto' }}>
              {selected.map((p) => (
                <div key={p.id} role="button" onClick={() => toggleSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 4px', borderRadius: 18, background: `${accent}26`, border: `1px solid ${accent}66`, cursor: 'pointer' }}>
                  <Avatar emoji={p.avatar} name={p.name} size={24} />
                  <span style={{ fontSize: 12.5, fontWeight: 800, color: theme.ink, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <X size={13} color={theme.muted} />
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: '0 18px 10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color={theme.muted} style={{ position: 'absolute', left: 12, top: 12 }} />
              <input value={q} onChange={(e) => doSearch(e.target.value)} placeholder="Search username" autoCapitalize="none" style={{ ...inputStyle(theme), padding: '9px 12px 9px 34px', fontSize: 13.5 }} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 18px' }}>
            {!q.trim() && suggested.length > 0 && <div style={{ fontSize: 11.5, fontWeight: 800, color: theme.muted, margin: '4px 2px' }}>People you follow</div>}
            {results.map((p) => (
              <div key={p.id} onClick={() => toggleSelect(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer' }}>
                <Avatar emoji={p.avatar} name={p.name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><NameBadge name={p.name} verified={p.verified} custom={p.custom_badge} size={12} /></div>
                  <div style={{ fontSize: 11.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{p.username}</div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${isPicked(p.id) ? accent : theme.border}`, background: isPicked(p.id) ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPicked(p.id) && <Check size={13} color="white" />}
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 18, paddingBottom: 'calc(18px + env(safe-area-inset-bottom))' }}>
            <button onClick={() => setStep('details')} disabled={!canNext} style={{ ...primaryBtn(theme, !canNext), background: canNext ? accent : undefined }}>
              {canNext ? `Next with ${selected.length} ${selected.length === 1 ? 'person' : 'people'}` : 'Pick at least one person'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '4px 18px 20px', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))', flex: 1, overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', padding: '6px 0 20px' }}>
            <div onClick={() => document.getElementById('group-avatar-input').click()} style={{ display: 'inline-block', cursor: 'pointer', position: 'relative', padding: 3, borderRadius: 36, border: `2px solid ${accent}` }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" onContextMenu={(e) => e.preventDefault()} draggable={false} style={{ width: 96, height: 96, borderRadius: 30, objectFit: 'cover', display: 'block' }} />
              ) : (
                <GroupAvatar avatar={null} name={name || 'New group'} size={96} />
              )}
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: theme.ink, color: theme.panelBg, border: `2px solid ${theme.panelBg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={13} /></div>
            </div>
            <input id="group-avatar-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }} />
            <div style={{ fontWeight: 800, fontSize: (name || '').length > 26 ? 19 : 23, color: theme.ink, marginTop: 14, wordBreak: 'break-word', padding: '0 8px' }}>{name.trim() || 'Name your group'}</div>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 10 }}>
              {selected.slice(0, 5).map((p, i) => (
                <span key={p.id} style={{ marginLeft: i ? -8 : 0, display: 'inline-flex', borderRadius: '50%', boxShadow: `0 0 0 2px ${theme.panelBg}` }}><Avatar emoji={p.avatar} name={p.name} size={26} /></span>
              ))}
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, color: theme.muted }}>You and {selected.length} {selected.length === 1 ? 'other' : 'others'}</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 800 }}>Group name</div>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} placeholder="Like Weekend Trip" style={{ ...inputStyle(theme), marginBottom: 16 }} />
          <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6, fontWeight: 800 }}>What is it about? (optional)</div>
          <input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} placeholder="A line about this group" style={{ ...inputStyle(theme), marginBottom: 16 }} />
          <div role="button" onClick={() => setShowColour(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 4px', marginBottom: 14, cursor: 'pointer', borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.ink }}>Group colour</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: accent, border: `2px solid ${theme.border}` }} />
              <ChevronRight size={18} color={theme.muted} />
            </span>
          </div>
          <button onClick={create} disabled={!name.trim() || creating} style={{ ...primaryBtn(theme, !name.trim() || creating), background: name.trim() ? accent : undefined }}>
            {creating ? <Spinner size={14} /> : 'Create group'}
          </button>
          {err && <div style={{ color: theme.danger, fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>{err}</div>}
        </div>
      )}
      {showColour && <GroupColourSheet value={accent} onPick={setAccent} onClose={() => setShowColour(false)} />}
      {cropFile && (
        <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={(blob) => {
          const file = new File([blob], 'group.jpg', { type: 'image/jpeg' });
          setAvatarFile(file);
          setAvatarPreview(URL.createObjectURL(blob));
          setCropFile(null);
        }} />
      )}
    </div>
    </>
  );
}

function GroupColourSheet({ value, onPick, onClose }) {
  const { theme } = useTheme();
  return ReactDOM.createPortal(
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 720, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '20px 18px calc(22px + env(safe-area-inset-bottom))' }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Group colour</div>
        <div style={{ fontSize: 12.5, color: theme.muted, margin: '4px 0 16px' }}>Used for the group photo ring and the tabs.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, justifyItems: 'center' }}>
          {GROUP_ACCENTS.map((col) => (
            <div key={col} role="button" aria-label={`Use colour ${col}`} onClick={() => { onPick(col); onClose(); }} style={{
              width: 52, height: 52, borderRadius: '50%', background: col, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: value === col ? `3px solid ${theme.ink}` : `1px solid ${theme.border}`,
            }}>{value === col && <Check size={20} color="white" />}</div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
function ModeratorExplainSheet({ name, onConfirm, onCancel }) {
  useBackClose(true, onCancel);
  const { theme } = useTheme();
  const rows = [
    [<Trash2 size={19} />, 'Delete messages from members'],
    [<Clock size={19} />, 'Mute people for a while'],
    [<UserPlus size={19} />, 'Let people in from join requests'],
    [<Pin_ size={19} color="currentColor" />, 'Pin messages for everyone'],
  ];
  return (
    <Portal>
      <div onClick={onCancel} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 98, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.45)' }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 460, background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '18px 16px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div style={{ textAlign: 'center', padding: '4px 10px 10px' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: theme.ink }}>Make {name} a moderator?</div>
            <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, marginTop: 5 }}>Moderators help keep the group friendly. They can:</div>
          </div>
          <div style={{ borderRadius: 16, background: theme.rowBg, padding: '4px 14px', marginBottom: 10 }}>
            {rows.map(([icon, label], i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 46, borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                <span style={{ display: 'flex', color: kitOnInk(theme), flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 14.5, fontWeight: 600, color: theme.ink }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, textAlign: 'center', padding: '0 12px 14px' }}>They cannot change group settings, add people or remove anyone.</div>
          <button onClick={onConfirm} className="zchat-press" style={{ width: '100%', height: 50, borderRadius: 16, border: 'none', background: theme.coral, color: 'white', fontWeight: 800, fontSize: 15.5, fontFamily: FONT, cursor: 'pointer' }}>Make moderator</button>
          <button onClick={onCancel} className="zchat-press" style={{ width: '100%', height: 50, borderRadius: 16, border: 'none', background: theme.rowBg, color: theme.ink, fontWeight: 700, fontSize: 15.5, fontFamily: FONT, cursor: 'pointer', marginTop: 8 }}>Cancel</button>
        </div>
      </div>
    </Portal>
  );
}
export function GroupRoleSheet({ group, member, myRank, rolesOn, announce, onClose, onProfile, onSetRole, onMuteFor, onKick, onTransfer, onTitle }) {
  const { theme } = useTheme();
  const [step, setStep] = useState('main');
  const role = groupRoleOf(group, member);
  const above = myRank > GROUP_RANK[role];
  const name = member.nick || (member.profile && member.profile.name) || 'Someone';
  const first = name.split(' ')[0];
  const mute = memberMute(member);
  const g1x = useContext(G1Ctx);
  const roleWord = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : role === 'moderator' ? 'Moderator' : null;
  const sub = [roleWord, member.title, mute ? (mute.until ? mutedUntilText(mute.until) : 'Muted') : null].filter(Boolean).join(', ') || (member.profile && member.profile.username ? `@${member.profile.username}` : '');
  const avatar = <Avatar emoji={member.profile && member.profile.avatar} name={name} size={40} />;
  if (step === 'mod') return <ModeratorExplainSheet name={first} onCancel={onClose} onConfirm={() => { onClose(); onSetRole(member.user_id, 'moderator'); }} />;
  if (step === 'kick') return <ConfirmSheet title={`Remove ${first}?`} text="They leave the group and stop getting its messages." confirmLabel="Remove" onCancel={onClose} onConfirm={() => { onClose(); onKick(member.user_id); }} zIndex={98} />;
  if (step === 'owner') return <ConfirmSheet title={`Make ${first} the owner?`} text="They get full control of the group, and you stay on as an admin. Only they can hand it back." confirmLabel="Make owner" danger={false} onCancel={onClose} onConfirm={() => { onClose(); onTransfer(member.user_id); }} zIndex={98} />;
  if (step === 'mute') {
    return (
      <ChatRowSheet title={`Mute ${first}`} subtitle="They can still read, but cannot send" avatar={avatar} onClose={onClose} zIndex={97} portal
        actions={[[5, '5 minutes'], [60, '1 hour'], [1440, '1 day'], [-1, 'Until I unmute them']].map(([mins, label]) => ({ label, icon: mins === -1 ? <MicOff size={19} /> : <Clock size={19} />, onClick: () => onMuteFor(member.user_id, mins) }))} />
    );
  }
  const canRoles = !announce && rolesOn && above;
  const actions = [
    { label: 'View profile', icon: <User size={19} />, onClick: () => onProfile(member.profile) },
    canRoles && myRank >= 2 && role !== 'admin' ? (role === 'moderator'
      ? { label: 'Remove as moderator', icon: <ShieldOff size={19} />, onClick: () => onSetRole(member.user_id, 'member') }
      : { label: 'Make moderator', icon: <ModShieldGlyph size={19} />, keepOpen: true, onClick: () => setStep('mod') }) : null,
    !announce && myRank === 3 && above ? (role === 'admin'
      ? { label: 'Remove as admin', icon: <ShieldOff size={19} />, onClick: () => onSetRole(member.user_id, 'member') }
      : { label: 'Make admin', icon: <ShieldCheck size={19} />, onClick: () => onSetRole(member.user_id, 'admin') }) : null,
    onTitle && !announce && myRank >= 2 && above ? { label: member.title ? 'Change title' : 'Give a title', icon: <MemberTagGlyph size={19} />, onClick: () => onTitle(member) } : null,
    !announce && above && (rolesOn ? myRank >= 1 : myRank >= 2) ? (mute
      ? { label: `Unmute ${first}`, icon: <Mic size={19} />, hint: mute.until ? mutedUntilText(mute.until) : 'Muted until you unmute them', onClick: () => onMuteFor(member.user_id, 0) }
      : rolesOn ? { label: `Mute ${first}`, icon: <MicOff size={19} />, keepOpen: true, onClick: () => setStep('mute') }
        : { label: `Mute ${first}`, icon: <MicOff size={19} />, onClick: () => onMuteFor(member.user_id, -1) }) : null,
    !announce && myRank === 3 && above && onTransfer ? { label: 'Make group owner', icon: <MemberCrownGlyph size={19} />, keepOpen: true, onClick: () => setStep('owner') } : null,
    !announce && myRank >= 2 && above ? { label: 'Remove from group', icon: <MemberRemoveGlyph size={19} />, danger: true, keepOpen: true, onClick: () => setStep('kick') } : null,
    member.nick && g1x && myRank >= 2 && above ? { label: 'Clear their group name', icon: <Edit3 size={19} />, hint: `They show as ${(member.profile && member.profile.name) || 'their profile name'} again`, onClick: () => g1x.clearNick(member.user_id) } : null,
  ];
  return <ChatRowSheet title={name} subtitle={sub} avatar={avatar} onClose={onClose} zIndex={97} portal actions={actions} />;
}

export function GroupInfoPanel({ group, members, myId, iFollowIds, privacyAllowed, myRole, isOwner, onClose, onPromote, onDemote, onMute, onUnmute, onKick, onLeave, onOpenProfile, onSaveBio, onSaveName, onSaveAvatar, onAddMembers, onTransferOwnership, onSetWallpaper, onOpenSettings, onOpenMembers, messages = [], onSetAccent, disappearSecs, onSetDisappear, onOpenMedia, onJumpToMessage, tools, rolesOn, onSetRole, onMuteFor, community, onOpenCommunity }) {
  useBackClose(true, onClose);
  const edgeBack = useEdgeSwipeBack(true);
  const { theme } = useTheme();
  const c = igPalette(theme);
  const meRow = members.find((m) => m.user_id === myId);
  const myRank = meRow ? groupRankOf(group, meRow) : (group.created_by === myId ? 3 : 0);
  const announce = !!(community && community.announce_id === group.id);
  const isAdmin = myRank >= 2;
  const canEdit = isAdmin && !announce;
  const canAdd = !announce && (isAdmin || (myRank >= 0 && (group.add_members_policy || 'everyone') !== 'admins'));
  const accent = groupAccent(group);
  const [bioOpen, setBioOpen] = useState(false);
  const [sheetFor, setSheetFor] = useState(null);
  const [titleFor, setTitleFor] = useState(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(group.bio || '');
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [cropFile, setCropFile] = useState(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showDisappear, setShowDisappear] = useState(false);
  const [showColour, setShowColour] = useState(false);
  useBackClose(showColour, () => setShowColour(false));
  const [folder, setFolder] = useState(null);
  useBackClose(!!folder, () => setFolder(null));
  const openFolder = (k) => { hapticTap(); setFolder(k); };
  const soleAdmin = isAdmin && !announce && members.filter((m) => groupRankOf(group, m) >= 2).length === 1 && members.length > 1;
  const online = members.filter(isMemberOnline);
  const dayAgo = Date.now() - 86400000;
  const todayCount = messages.filter((m) => m.type !== 'system' && !m.deleted && new Date(m.created_at).getTime() > dayAgo).length;
  const rank = (m) => 3 - groupRankOf(group, m);
  const canAct = (m) => m.user_id !== myId && myRank >= 1 && myRank > groupRankOf(group, m) && !announce;
  const siPairs = useSiPairs(members);
  const ranked = siPairOrder(members.filter((m) => m.profile).sort((a, b) => rank(a) - rank(b) || (a.profile.name || '').localeCompare(b.profile.name || '')), siPairs);
  const preview = ranked.length > 6 ? ranked.slice(0, 5) : ranked;
  const crPaidInfo = useCrPaidMembers(isOwner ? group.id : null);
  const media = messages.filter((m) => !m.deleted && (m.type === 'image' || m.type === 'video') && m.media_url && !parseOnce(m)).slice(-10).reverse();
  const chip = (label, kind) => (
    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: c.dim }}>
      {kind === 'owner' && <MemberCrownGlyph size={13} color={theme.dark ? '#F2C14E' : '#C98A00'} />}
      {kind === 'admin' && <ShieldCheck size={12} strokeWidth={2.2} color={kitOnInk(theme)} />}
      {kind === 'moderator' && <ModShieldGlyph size={12} color={kitOnInk(theme)} />}
      {kind === 'muted' && <MicOff size={12} strokeWidth={2.1} />}
      {label}
    </span>
  );

  const memberRow = (m) => {
    const on = isMemberOnline(m);
    const role = groupRoleOf(group, m);
    const mute = memberMute(m);
    return (
      <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
        <div onClick={() => onOpenProfile(m.profile)} {...g2LongPress(m.user_id !== myId && !announce ? () => g2AskHide(group.id, group.name, m) : null)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, cursor: 'pointer', WebkitTouchCallout: 'none' }}>
          {siPairGlow(siPairs, m.user_id, <Avatar emoji={m.profile.avatar} name={m.profile.name} online={on ? true : null} size={48} />)}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, fontWeight: 700, fontSize: 14.5 }}>
              <NameBadge name={`${m.nick || m.profile.name}${m.user_id === myId ? ' (you)' : ''}`} verified={m.profile.verified} custom={m.profile.custom_badge} size={13} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, fontSize: 12, color: c.dim, minWidth: 0 }}>
              {role === 'owner' ? chip('Owner', 'owner') : role === 'admin' ? chip('Admin', 'admin') : role === 'moderator' ? chip('Moderator', 'moderator') : null}
              {m.title && chip(m.title)}
              {siPairs.has(m.user_id) && chip('Matching')}
              {crPaidInfo && crPaidInfo.has(m.user_id) && <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: c.dim }}><CoinIcon size={11} />Paid to join</span>}
              {mute && chip('Muted', 'muted')}
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: on ? '#34d399' : c.dim, fontWeight: on ? 700 : 400 }}>{on ? 'Online now' : `@${m.profile.username}`}</span>
            </div>
          </div>
        </div>
        {canAct(m) && (
          <div role="button" aria-label={`Options for ${m.profile.name}`} onClick={(e) => { e.stopPropagation(); hapticTap(); setSheetFor(m.user_id); }}
            style={{ display: 'flex', padding: 9, margin: -9, cursor: 'pointer', flexShrink: 0 }}><MoreVertical size={18} color={c.dim} /></div>
        )}
      </div>
    );
  };

  const nameLen = (group.name || '').length;

  return (
    <>
    <WideDim onClose={onClose} z={40} />
    <div {...edgeBack} style={{ position: 'fixed', inset: 0, background: c.bg, color: c.fg, zIndex: 40, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open zchat-wide-page">
      <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, padding: '0 8px' }}>
          <div role="button" aria-label="Back" onClick={onClose} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={24} strokeWidth={2} /></div>
          <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, pointerEvents: 'none' }}>Group info</div>
          {onOpenSettings ? <div role="button" aria-label="Group settings" onClick={onOpenSettings} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><SettingsIcon size={21} strokeWidth={1.8} /></div> : <span style={{ width: 44 }} />}
        </div>
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
        <div style={{ textAlign: 'center', padding: '10px 16px 4px' }}>
          <div onClick={() => canEdit && document.getElementById('group-info-avatar-input').click()} style={{ display: 'inline-block', position: 'relative', cursor: canEdit ? 'pointer' : 'default', padding: 3, borderRadius: 36, border: `2px solid ${accent}` }}>
            <GroupAvatar avatar={group.avatar} name={group.name} size={100} />
            {canEdit && (
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: '50%', background: c.fg, color: c.bg, border: `2px solid ${c.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={13} />
              </div>
            )}
          </div>
          {canEdit && (
            <input id="group-info-avatar-input" type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = ''; }} />
          )}
          {editingName ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'center' }}>
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 50))} style={{ ...inputStyle(theme), fontSize: 14, width: 210 }} />
              <button onClick={() => { onSaveName(name); setEditingName(false); }} style={{ padding: '0 16px', borderRadius: 12, border: 'none', background: c.fg, color: c.bg, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Save</button>
            </div>
          ) : (
            <div onClick={() => canEdit && setEditingName(true)} style={{
              marginTop: 14, padding: '0 6px', fontWeight: 800, fontSize: nameLen > 34 ? 18 : nameLen > 20 ? 21 : 25, lineHeight: 1.15, cursor: canEdit ? 'pointer' : 'default',
              wordBreak: 'break-word', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            }}>{group.name}</div>
          )}
          <div style={{ fontSize: 13, color: c.dim, marginTop: 6 }}>
            {announce ? 'Community announcements, ' : ''}{members.length} {members.length === 1 ? 'member' : 'members'}{group.created_at && !announce ? `, created ${fmtDate(new Date(group.created_at), { month: 'short', year: 'numeric' })}` : ''}
          </div>
          <div style={{ fontSize: 13, color: c.dim, marginTop: 3 }}>
            <span style={{ color: online.length ? '#34d399' : c.dim, fontWeight: 700 }}>{online.length} online now</span>
            {`, ${todayCount} ${todayCount === 1 ? 'message' : 'messages'} today`}
          </div>
        </div>

        {tools && (
          <DetailActions items={[
            [<Search size={21} strokeWidth={1.7} />, 'Search', tools.onSearch],
            tools.onMute ? [tools.muted ? <BellOff size={21} strokeWidth={1.7} /> : <Bell size={21} strokeWidth={1.7} />, tools.muted ? 'Muted' : 'Mute', tools.onMute, !!tools.muted] : null,
            tools.onCall ? [<Phone size={21} strokeWidth={1.7} />, tools.inCall ? 'Join' : 'Call', () => tools.onCall('voice'), !!tools.inCall] : null,
            tools.onCall ? [<VideoIcon size={21} strokeWidth={1.7} />, 'Video', () => tools.onCall('video')] : null,
            canAdd ? [<UserPlus size={21} strokeWidth={1.7} />, 'Add', () => setShowAddMembers(true)] : null,
          ]} />
        )}

        <DetailSection title="About">
          <div style={{ padding: '12px 14px' }}>
            {editingBio ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={bio} onChange={(e) => setBio(e.target.value.slice(0, 120))} placeholder="What is this group about?" aria-label="Group bio" style={{ ...inputStyle(theme), fontSize: 13 }} />
                <button onClick={() => { onSaveBio(bio); setEditingBio(false); }} style={{ padding: '0 16px', borderRadius: 13, border: 'none', background: c.fg, color: c.bg, fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: FONT }}>Save</button>
              </div>
            ) : (
              <div role={canEdit ? 'button' : undefined} aria-label={canEdit ? 'Edit group bio' : undefined} onClick={() => { if (canEdit) setEditingBio(true); else setBioOpen(true); }} style={{ fontSize: 14, lineHeight: 1.5, color: group.bio ? c.fg : c.dim, cursor: 'pointer', wordBreak: 'break-word', overflow: 'hidden', display: bioOpen ? 'block' : '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>
                {group.bio ? <RichText text={group.bio} onMention={onOpenProfile} /> : (canEdit ? 'Add a group bio' : 'No bio yet')}
              </div>
            )}
          </div>
        </DetailSection>

        {tools && <MediaStrip media={media} onOpen={onOpenMedia} onSeeAll={tools.onMedia} />}
        <DetailSection title={`${members.length} ${members.length === 1 ? 'member' : 'members'}`} right={ranked.length > preview.length ? <div role="button" aria-label="See all members" onClick={() => (onOpenMembers ? onOpenMembers() : null)} style={{ fontSize: 13, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '2px 0 2px 10px' }}>See all</div> : null}>
          {canAdd && (
            <div role="button" aria-label="Add people" onClick={() => setShowAddMembers(true)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ width: 48, height: 48, color: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserPlus size={24} strokeWidth={1.8} /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink }}>Add people</div>
            </div>
          )}
          <div style={{ padding: '4px 0' }}>{preview.map(memberRow)}</div>
          {ranked.length > preview.length && (
            <div role="button" aria-label="Show all members" onClick={() => (onOpenMembers ? onOpenMembers() : null)} style={{ borderTop: `1px solid ${theme.border}`, padding: '13px 16px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: theme.coral, cursor: 'pointer' }}>
              See all {members.length} members
            </div>
          )}
        </DetailSection>

        <DetailSection title="More">
          {detailRows([
            tools ? <DetailRow icon={<Users />} label="Together" sub="Playlist, board, notes and inside jokes" onClick={() => openFolder('together')} /> : null,
            tools ? <DetailRow icon={<Pin />} label="Chat tools" sub="Pinned, jump to a date, albums, export" onClick={() => openFolder('tools')} /> : null,
            <DetailRow icon={<Palette />} label="Customize" sub="Theme, bubbles, colour, tone" onClick={() => openFolder('look')} />,
            <DetailRow icon={<SettingsIcon />} label="Group" sub={`Disappearing messages${onOpenSettings ? ', group settings' : ''}`} onClick={() => openFolder('group')} />,
            <DetailRow icon={<Bell />} label="Notifications and you" sub="Alerts, hidden members, emoji, vibration" onClick={() => openFolder('you')} />,
          ])}
        </DetailSection>

        <DetailSection>
          {detailRows([
            tools && tools.onClear ? <DetailRow icon={<Trash2 />} label="Clear chat" danger onClick={tools.onClear} /> : null,
            announce && onOpenCommunity
              ? <DetailRow icon={<LogOut />} danger onClick={() => onOpenCommunity({ leave: true })} label="Leave community" />
              : <DetailRow icon={<LogOut />} danger onClick={() => { if (!soleAdmin && !isOwner) onLeave(); else if (onOpenMembers) onOpenMembers(); }}
                label={isOwner ? 'Hand the group to someone before leaving' : soleAdmin ? 'Make someone an admin before leaving' : 'Leave group'} />,
          ])}
        </DetailSection>
      </div>

      {folder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 41, background: c.bg, color: c.fg, display: 'flex', flexDirection: 'column', fontFamily: FONT }} className="zchat-panel-open">
          <div style={{ paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 52, padding: '0 8px' }}>
              <div role="button" aria-label="Back" onClick={() => setFolder(null)} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><ArrowLeft size={24} strokeWidth={2} /></div>
              <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 16, fontWeight: 700, pointerEvents: 'none' }}>{{ together: 'Together', tools: 'Chat tools', look: 'Customize', group: 'Group', you: 'Notifications and you' }[folder]}</div>
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
            {folder === 'together' && (
              <>
        {tools && <ChatToolsSection chatKey={albumChatKey(myId, null, group.id)} />}

              </>
            )}
            {folder === 'tools' && (
              <>
        {tools && (
          <DetailSection title="In this chat" flush>
            <DetailTiles items={[
              tools.onPinned ? { icon: <Pin_ color="currentColor" />, label: 'Pinned', aria: 'Pinned messages', badge: tools.pinnedCount, onClick: tools.onPinned } : null,
              tools.onJumpDate ? { icon: <CalendarIcon />, label: 'Jump to date', aria: 'Jump to a date', onClick: tools.onJumpDate } : null,
              tools.onScheduled ? { icon: <Clock />, label: 'Scheduled', aria: 'Scheduled messages', badge: tools.scheduledCount, onClick: tools.onScheduled } : null,
              ...(tools.moreTiles || []),
              { icon: <Activity />, label: 'Insights', aria: 'Chat insights', onClick: tools.onInsights },
              { icon: <Download />, label: 'Export', aria: 'Export chat', onClick: tools.onExport },
              tools.onExportPdf ? { icon: <PdfGlyph />, label: 'Export as PDF', aria: 'Export as PDF', onClick: tools.onExportPdf } : null,
            ]} />
          </DetailSection>
        )}

              </>
            )}
            {folder === 'look' && (
              <>
        <DetailSection title="Customize" flush>
          <DetailTiles items={[
            ...((tools && tools.moreCustomize) || []),
            isAdmin ? { icon: <ThemeIcon />, label: 'Theme', aria: 'Chat theme', onClick: () => setShowTheme(true) } : null,
            tools ? { icon: <BubblesIcon />, label: 'Bubbles', aria: 'Chat bubbles', onClick: tools.onBubbles } : null,
            isAdmin ? { icon: <SwatchIcon />, label: 'Colour', aria: 'Group colour', dot: accent, onClick: () => setShowColour(true) } : null,
          ]} />
        </DetailSection>

              </>
            )}
            {folder === 'group' && (
              <>
        <DetailSection title="Group">
          {detailRows([
            community && onOpenCommunity ? <DetailRow icon={<CommunityGlyph />} label={announce ? 'Community home' : 'Community'} value={community.name} onClick={() => onOpenCommunity({})} /> : null,
            <DetailRow icon={<Timer />} label="Disappearing messages" value={disappearLabel(disappearSecs)} onClick={() => setShowDisappear(true)} />,
            onOpenSettings ? <DetailRow icon={<SettingsIcon />} label="Group settings" sub={isAdmin ? 'Who can send, add people, invite link' : 'Notifications, pin and more'} onClick={onOpenSettings} /> : null,
            ...((tools && tools.morePrivacy) || []),
          ])}
        </DetailSection>
        <G1InfoBlock group={group} members={members} myId={myId} myRank={myRank} />

              </>
            )}
            {folder === 'you' && (
              <>
        {!announce && <G2GroupInfoRows group={group} members={members} myId={myId} isAdmin={isAdmin} />}

        {tools && tools.msgopsRows && tools.msgopsRows.some(Boolean) && <DetailSection title="Notifications">{detailRows(tools.msgopsRows)}</DetailSection>}

              </>
            )}
          </div>
        </div>
      )}
      {sheetFor && (() => {
        const mm = members.find((x) => x.user_id === sheetFor);
        if (!mm || !mm.profile) return null;
        return (
          <GroupRoleSheet group={group} member={mm} myRank={myRank} rolesOn={rolesOn} announce={announce} onClose={() => setSheetFor(null)}
            onProfile={(pf) => { setSheetFor(null); onOpenProfile(pf); }}
            onSetRole={(uid, r) => { if (onSetRole) onSetRole(uid, r); else if (r === 'admin') onPromote(uid); else onDemote(uid); }}
            onMuteFor={(uid, mins) => { if (onMuteFor) onMuteFor(uid, mins); else if (mins) onMute(uid); else onUnmute(uid); }}
            onKick={onKick} onTransfer={onTransferOwnership}
            onTitle={tools && tools.onSetTitle ? (x) => { setSheetFor(null); setTitleFor(x); } : null} />
        );
      })()}
      {titleFor && tools && tools.onSetTitle && <MemberTitleSheet member={titleFor} onClose={() => setTitleFor(null)} onSave={(t) => tools.onSetTitle(titleFor.user_id, t)} />}
      {cropFile && (
        <PhotoCropEditor file={cropFile} isAvatar onCancel={() => setCropFile(null)} onConfirm={(blob) => { onSaveAvatar(blob); setCropFile(null); }} />
      )}
      {showTheme && <ChatThemePage group userId={myId} value={group.wallpaper} onSelect={onSetWallpaper} onClose={() => setShowTheme(false)} title={group.name} avatar={group.avatar} />}
      {showDisappear && <DisappearSheet value={disappearSecs} subject="this group" canEdit={isAdmin} onPick={onSetDisappear} onClose={() => setShowDisappear(false)} />}
      {showColour && <GroupColourSheet value={accent} onPick={(col) => { if (onSetAccent) onSetAccent(col); }} onClose={() => setShowColour(false)} />}
      {showAddMembers && (
        <AddMembersPanel myId={myId} iFollowIds={iFollowIds} privacyAllowed={privacyAllowed} existingIds={members.map((m) => m.user_id)}
          onClose={() => setShowAddMembers(false)}
          onAdd={(people) => { onAddMembers(people); setShowAddMembers(false); }} />
      )}
    </div>
    </>
  );
}
export function GroupTopicsPage({ group, onClose, onSave }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [list, setList] = useState(() => groupTopicsOf(group));
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useBackClose(!!edit, () => setEdit(null));
  const commit = async (next, added) => {
    if (busy) return false;
    setBusy(true);
    setErr('');
    const e = await onSave(next, added);
    setBusy(false);
    if (e) { setErr(e); return false; }
    setList(next);
    return true;
  };
  const saveEdit = async () => {
    const n = edit.n.replace(/\s+/g, ' ').trim().slice(0, 24);
    if (!n) return;
    if (list.some((t) => t.id !== edit.id && t.n.toLowerCase() === n.toLowerCase())) { setErr('There is already a topic with that name.'); return; }
    const next = edit.id ? list.map((t) => (t.id === edit.id ? { ...t, n, c: edit.c } : t)) : [...list, { id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, n, c: edit.c }];
    if (await commit(next, edit.id ? null : n)) setEdit(null);
  };
  const startNew = () => { setErr(''); setEdit({ id: null, n: '', c: TOPIC_COLORS[list.length % TOPIC_COLORS.length][0] }); };
  return (
    <FullPage title="Topics" subtitle={group.name} onBack={onClose} zIndex={80}
      footer={!edit && list.length < 12 ? <BigButton label="New topic" onClick={startNew} /> : null}>
      {!edit && !list.length ? (
        <EmptyState art="nothing" title="No topics yet" text="Make topics like Homework or Trips. Members pick one above the chat and new messages land in the topic they have open." />
      ) : (
        <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '4px 2px 14px', textWrap: 'pretty' }}>Members pick a topic above the chat. New messages land in the topic they have open, and All shows everything.</div>
      )}
      {edit && (
        <div className="zchat-fade" style={{ padding: 14, borderRadius: 18, background: theme.rowBg, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.ink, marginBottom: 10 }}>{edit.id ? 'Edit topic' : 'New topic'}</div>
          <input value={edit.n} onChange={(e) => setEdit({ ...edit, n: e.target.value.slice(0, 24) })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveEdit(); } }} placeholder="Topic name" aria-label="Topic name" autoFocus style={inputStyle(theme)} />
          <div role="radiogroup" aria-label="Topic colour" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '14px 2px 16px' }}>
            {TOPIC_COLORS.map(([hex, name]) => (
              <div key={hex} role="radio" aria-checked={edit.c === hex} aria-label={name} onClick={() => setEdit({ ...edit, c: hex })} style={{ width: 30, height: 30, borderRadius: '50%', background: hex, cursor: 'pointer', boxShadow: edit.c === hex ? `0 0 0 2px ${theme.panelBg}, 0 0 0 4px ${hex}` : 'none', transition: 'box-shadow 0.15s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <BigButton label="Cancel" tone="plain" onClick={() => { setEdit(null); setErr(''); }} style={{ flex: '0 0 110px' }} />
            <BigButton label={busy ? 'Saving' : edit.id ? 'Save' : 'Add topic'} disabled={busy || !edit.n.trim()} onClick={saveEdit} />
          </div>
        </div>
      )}
      {err && <div role="alert" style={{ fontSize: 13, fontWeight: 700, color: theme.danger, padding: '0 2px 12px' }}>{err}</div>}
      {list.map((t, i) => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px', borderBottom: i < list.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: t.c, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.n}</span>
          <div role="button" aria-label={`Edit ${t.n}`} onClick={() => { setErr(''); setEdit({ id: t.id, n: t.n, c: t.c }); }} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.ink, cursor: 'pointer' }}><Pencil size={17} /></div>
          <div role="button" aria-label={`Delete ${t.n}`} onClick={() => setDel(t)} className="zchat-press" style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.danger, cursor: 'pointer' }}><Trash2 size={17} /></div>
        </div>
      ))}
      {del && <ConfirmSheet title={`Delete ${del.n}?`} text="Its messages stay in the chat and move to General." confirmLabel="Delete topic" onCancel={() => setDel(null)} onConfirm={async () => { const t = del; setDel(null); await commit(list.filter((x) => x.id !== t.id)); }} zIndex={140} />}
    </FullPage>
  );
}

function G1NickSheet({ group, members, myId, onSave, onClose }) {
  const { theme } = useTheme();
  const row = (members || []).find((m) => m.user_id === myId) || {};
  const [v, setV] = useState(row.nick || '');
  const inputRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => { try { inputRef.current && inputRef.current.focus(); } catch {} }, 260); return () => clearTimeout(t); }, []);
  const keyOf = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').replace(/[013457]/g, (c) => ({ 0: 'o', 1: 'l', 3: 'e', 4: 'a', 5: 's', 7: 't' }[c]));
  const t = v.replace(/\s+/g, ' ').trim();
  const k = keyOf(t);
  const clash = !!k && (members || []).some((m) => m.user_id !== myId && (keyOf(m.nick) === k || keyOf(m.profile && m.profile.name) === k || keyOf(m.profile && m.profile.username) === k));
  const why = t && !k ? 'Use some letters or numbers' : clash ? 'Someone in this group already goes by that name' : '';
  return (
    <G1Sheet title="Your name in this group" sub={`Only people in ${group.name} see it. Mentions still use your username.`} onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 6px', height: 48, borderRadius: 14, background: theme.inputBg || theme.rowBg, border: `1px solid ${why ? theme.danger : theme.border}`, padding: '0 14px' }}>
        <input ref={inputRef} value={v} maxLength={32} aria-label="Your name in this group" placeholder={(row.profile && row.profile.name) || 'Your name'} autoCapitalize="words" autoComplete="off" enterKeyHint="done"
          onChange={(e) => setV(e.target.value.slice(0, 32))} onKeyDown={(e) => { if (e.key === 'Enter' && t && !why) onSave(t); }}
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontSize: 16, fontFamily: FONT }} />
        <span style={{ fontSize: 12, color: theme.muted, fontVariantNumeric: 'tabular-nums' }}>{32 - v.length}</span>
      </div>
      <div style={{ minHeight: 18, fontSize: 12.5, color: why ? theme.danger : theme.muted, padding: '0 4px 10px' }}>{why || (row.profile && row.profile.username ? `People can still mention you as @${row.profile.username}` : '')}</div>
      <BigButton label="Save" disabled={!t || !!why || t === (row.nick || '')} onClick={() => onSave(t)} />
      {row.nick ? <G1TextBtn label="Use my profile name" onClick={() => onSave(null)} aria="Remove my name in this group" /> : <G1TextBtn label="Cancel" onClick={onClose} />}
    </G1Sheet>
  );
}

function G1LogGlyph({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M9 6.5h11M9 12h11M9 17.5h7" /><circle cx="4.6" cy="6.5" r="1.1" /><circle cx="4.6" cy="12" r="1.1" /><circle cx="4.6" cy="17.5" r="1.1" />
    </svg>
  );
}

function G1InfoBlock({ group, members, myId, myRank }) {
  const g1 = useContext(G1Ctx);
  const [open, setOpen] = useState(null);
  if (!g1On(group)) return null;
  const me = (members || []).find((m) => m.user_id === myId);
  const rules = g1Rules(group);
  const need = !!(g1 && g1.needRules && g1.gid === group.id);
  return (
    <>
      <DetailSection>
        {detailRows([
          me && g1 ? <DetailRow icon={<Edit3 />} label="Your name in this group" sub={me.nick ? me.nick : 'Only people here see it'} onClick={() => setOpen('nick')} /> : null,
          rules.length ? <DetailRow icon={<FileText />} label="Group rules" sub={need ? 'Agree to them to start posting' : null} value={String(rules.length)} onClick={() => setOpen('rules')} /> : null,
          myRank >= 2 ? <DetailRow icon={<G1LogGlyph />} label="Recent actions" sub="Who changed what in the last 90 days" onClick={() => setOpen('log')} /> : null,
        ])}
      </DetailSection>
      {open === 'nick' && g1 && <G1NickSheet group={group} members={members} myId={myId} onClose={() => setOpen(null)} onSave={(v) => { setOpen(null); g1.saveNick(v); }} />}
      {open === 'rules' && <G1RulesSheet group={group} rules={rules} need={need} busy={!!(g1 && g1.agreeBusy)} onAgree={() => { setOpen(null); if (g1) g1.agree(); }} onClose={() => setOpen(null)} />}
      {open === 'log' && <G1LogPage group={group} members={members} onClose={() => setOpen(null)} />}
    </>
  );
}

function G1JoinAnswers({ qs, ans, onChange }) {
  const { theme } = useTheme();
  return (
    <div style={{ textAlign: 'left', marginTop: 16, maxHeight: '38vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '0 2px 8px' }}>{qs.length === 1 ? 'The admins ask one thing first' : 'The admins ask a few things first'}</div>
      {qs.map((q, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, padding: '0 2px 6px', wordBreak: 'break-word' }}>{q}</div>
          <input value={ans[i] || ''} maxLength={300} aria-label={q} placeholder="Your answer" autoComplete="off" enterKeyHint={i === qs.length - 1 ? 'done' : 'next'}
            onChange={(e) => { const v = e.target.value.slice(0, 300); onChange(qs.map((_, j) => (j === i ? v : (ans[j] || '')))); }}
            style={{ width: '100%', boxSizing: 'border-box', height: 44, borderRadius: 12, border: `1px solid ${theme.border}`, background: theme.rowBg, color: theme.ink, fontSize: 15, fontFamily: FONT, padding: '0 12px', outline: 'none' }} />
        </div>
      ))}
    </div>
  );
}

function useCrPaidMembers(gid) {
  const set = useCr('paid', gid || null, 30000);
  return set instanceof Set ? set : null;
}
function g2HideOf(gid) { return g2Hide.rows.filter((r) => r.group_id === gid); }
function g2AskHide(gid, gname, member) { try { window.dispatchEvent(new CustomEvent('zchat-g2-hide', { detail: { gid, gname, member } })); } catch {} }
const g2Press = { t: 0, fired: false };
function g2LongPress(fn) {
  if (!fn) return {};
  const stop = () => { clearTimeout(g2Press.t); g2Press.t = 0; };
  return {
    onPointerDown: () => { g2Press.fired = false; stop(); g2Press.t = setTimeout(() => { g2Press.t = 0; g2Press.fired = true; hapticTap(); fn(); }, 480); },
    onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop,
    onContextMenu: (e) => { e.preventDefault(); stop(); g2Press.fired = true; fn(); },
    onClickCapture: (e) => { if (g2Press.fired) { g2Press.fired = false; e.stopPropagation(); e.preventDefault(); } },
  };
}
function G2HiddenPage({ group, members, myId, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  useG2Hide(myId);
  const [pick, setPick] = useState(false);
  useBackClose(pick, () => setPick(false));
  const ids = new Set(g2HideOf(group.id).map((r) => r.hidden_id));
  const hidden = members.filter((m) => m.profile && ids.has(m.user_id));
  const others = members.filter((m) => m.profile && m.user_id !== myId && !ids.has(m.user_id) && !m.profile.is_bot);
  return (
    <FullPage title="Hidden members" subtitle={group.name} onBack={onClose} zIndex={90}
      footer={others.length ? <BigButton label="Hide someone" onClick={() => { hapticTap(); setPick(true); }} /> : null}>
      {!hidden.length ? (
        <EmptyState art="eye" title="No one is hidden" text="Long press a message or a name in the member list to hide what that person sends here. Only you see this, and they are not told." />
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, padding: '4px 2px 10px', textWrap: 'pretty' }}>Their messages fold into one quiet line for you, and their mentions do not notify you. They still see the group as usual.</div>
          {hidden.map((m) => (
            <div key={m.user_id} className="zchat-fade" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <Avatar emoji={m.profile.avatar} name={m.profile.name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: theme.ink, minWidth: 0 }}><NameBadge name={m.profile.name} verified={m.profile.verified} custom={m.profile.custom_badge} size={13} /></div>
                <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>@{m.profile.username}</div>
              </div>
              <div role="button" aria-label={`Show messages from ${m.profile.name}`} onClick={() => { hapticTap(); g2HideSet(myId, group.id, m.user_id, false); }} className="zchat-press" style={{ height: 34, padding: '0 16px', borderRadius: 10, background: theme.soft, color: theme.ink, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>Show</div>
            </div>
          ))}
        </>
      )}
      {pick && (
        <ChatRowSheet portal title="Hide someone" subtitle="Pick whose messages to fold away" zIndex={120} onClose={() => setPick(false)}
          actions={others.slice(0, 200).map((m) => ({ icon: <Avatar emoji={m.profile.avatar} name={m.profile.name} size={28} />, label: m.profile.name, hint: `@${m.profile.username}`, onClick: () => { hapticTap(); g2HideSet(myId, group.id, m.user_id, true); } }))} />
      )}
    </FullPage>
  );
}
function G2GroupInfoRows({ group, members, myId, isAdmin }) {
  const [page, setPage] = useState(null);
  useG2Hide(myId);
  useG2Kw(myId);
  const emo = useG2Emo(group.id);
  const words = g2KwOf(group.id);
  const hiddenN = g2HideOf(group.id).filter((r) => members.some((m) => m.user_id === r.hidden_id)).length;
  const emoN = emo ? emo.list.length : 0;
  return (
    <>
      <DetailSection title="Group emoji">
        <DetailRow icon={<Smile />} label="Group emoji" sub={isAdmin ? 'Make emoji only this group can use' : 'Emoji made for this group'} value={emoN ? String(emoN) : isAdmin ? 'Add' : 'None'} onClick={() => setPage('emoji')} last />
      </DetailSection>
      <DetailSection title="Just for you">
        {detailRows([
          <DetailRow icon={<Bell />} label="Alert me about" sub="Words that notify you even when muted" value={words.length ? countWord(words.length, 'word', 'words') : 'Off'} onClick={() => setPage('kw')} />,
          <DetailRow icon={<EyeOff />} label="Hidden members" sub="People whose messages you folded away" value={hiddenN ? String(hiddenN) : 'None'} onClick={() => setPage('hidden')} />,
        ])}
      </DetailSection>
      {page === 'emoji' && <G2EmojiPage group={group} myId={myId} isAdmin={isAdmin} onClose={() => setPage(null)} />}
      {page === 'kw' && <G2KeywordsPage group={group} myId={myId} onClose={() => setPage(null)} />}
      {page === 'hidden' && <G2HiddenPage group={group} members={members} myId={myId} onClose={() => setPage(null)} />}
    </>
  );
}
export function GroupMembersPanel({ group, members, myId, isAdmin, isOwner, onClose, onOpenProfile, onAddMembers, onPromote, onDemote, onKick, onMute, onUnmute, onTransferOwnership, onSetTitle, rolesOn, onSetRole, onMuteFor, announce }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [sheetFor, setSheetFor] = useState(null);
  const [titleFor, setTitleFor] = useState(null);

  const meRow = members.find((m) => m.user_id === myId);
  const crPaid = useCrPaidMembers(isOwner ? group.id : null);
  const myRank = meRow ? groupRankOf(group, meRow) : (group.created_by === myId ? 3 : 0);
  const isOnline = (m) => m.profile && !m.profile.hide_activity && m.profile.last_seen && Date.now() - new Date(m.profile.last_seen).getTime() < 3 * 60 * 1000;
  const onlineCount = members.filter(isOnline).length;
  const adminCount = members.filter((m) => groupRankOf(group, m) >= 2).length;
  const modCount = members.filter((m) => groupRoleOf(group, m) === 'moderator').length;
  const canAct = (m) => m.user_id !== myId && myRank >= 1 && myRank > groupRankOf(group, m) && !announce;
  const shown = tab === 'mods' && !modCount ? 'all' : tab;

  const siPairs = useSiPairs(members);
  const filtered = siPairOrder(members
    .filter((m) => (shown === 'online' ? isOnline(m) : shown === 'admins' ? groupRankOf(group, m) >= 2 : shown === 'mods' ? groupRoleOf(group, m) === 'moderator' : true))
    .filter((m) => !q.trim() || (m.profile.name || '').toLowerCase().includes(q.trim().toLowerCase()) || (m.profile.username || '').toLowerCase().includes(q.trim().toLowerCase()) || (m.nick || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (groupRankOf(group, b) - groupRankOf(group, a)) || (a.profile.name || '').localeCompare(b.profile.name || '')), siPairs);

  const sheetMember = sheetFor ? members.find((m) => m.user_id === sheetFor) : null;

  return (
    <>
    <WideDim onClose={onClose} z={35} />
    <div style={{ position: 'fixed', inset: 0, background: theme.bgGradient, zIndex: 35, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="zchat-panel-open zchat-wide-page">
      <IgTopBar title="Members" onBack={onClose} right={!announce && (myRank >= 2 || (myRank >= 0 && (group.add_members_policy || 'everyone') !== 'admins')) ? <div role="button" aria-label="Add members" onClick={onAddMembers} style={{ fontSize: 14, fontWeight: 800, color: theme.coral, cursor: 'pointer', padding: '0 10px', height: 44, display: 'flex', alignItems: 'center' }}>Add</div> : null} />
      <div style={{ padding: '12px 18px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, borderRadius: 13, background: theme.rowBg, border: `1px solid ${theme.border}`, padding: '0 12px' }}>
          <Search size={15} color={theme.muted} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: theme.ink, fontSize: 14, fontFamily: FONT }} />
        </div>
      </div>
      <LineTabs kind="button" label="Show members" value={shown} onChange={(k) => { if (k !== shown) { hapticTap(); setTab(k); } }} inset={6} h={42} fs={14.5} style={{ marginTop: 6 }}
        tabs={[['all', 'All', members.length], ['online', 'Online', onlineCount], ['admins', 'Admins', adminCount], modCount ? ['mods', 'Moderators', modCount] : null].filter(Boolean).map(([k, l, n]) => ({ k, label: l, meta: n, aria: `${l} ${n}` }))} />
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '6px 18px', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: theme.muted, fontSize: 13.5 }}>No members match.</div>
        ) : filtered.map((m) => {
          const role = groupRoleOf(group, m);
          const mute = memberMute(m);
          const bits = [
            m.title ? <span key="t" style={{ color: kitOnInk(theme), fontWeight: 600 }}>{m.title}</span> : null,
            siPairs.has(m.user_id) ? <span key="p" style={{ color: kitOnInk(theme), fontWeight: 600 }}>Matching</span> : null,
            crPaid && crPaid.has(m.user_id) ? <span key="cp" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><CoinIcon size={11} />Paid to join</span> : null,
            mute ? <span key="m"><MicOff size={12} strokeWidth={2.2} style={{ verticalAlign: '-1.5px', marginRight: 3 }} />{mute.until ? mutedUntilText(mute.until) : 'Muted'}</span> : null,
            isOnline(m) ? <span key="o" style={{ color: '#22c55e', fontWeight: 600 }}>Online</span> : (m.profile.last_seen ? <span key="o">{timeAgoLong(m.profile.last_seen)}</span> : null),
          ].filter(Boolean);
          return (
            <div key={m.user_id} role="button" aria-label={canAct(m) ? `Options for ${m.profile.name}` : `Open ${m.profile.name}`} onClick={() => { if (canAct(m)) { hapticTap(); setSheetFor(m.user_id); } else onOpenProfile(m.profile); }} {...g2LongPress(m.user_id !== myId && !announce ? () => g2AskHide(group.id, group.name, m) : null)} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 4px', cursor: 'pointer', borderRadius: 14, WebkitTouchCallout: 'none' }}>
              {siPairGlow(siPairs, m.user_id, <Avatar emoji={m.profile.avatar} name={m.profile.name} size={44} />)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.nick || m.profile.name}{m.user_id === myId ? ' (you)' : ''}</span><VerifiedBadge tier={m.profile.verified} custom={m.profile.custom_badge} size={12} />
                </div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bits.map((b, i) => <React.Fragment key={i}>{i > 0 && <span aria-hidden="true" style={{ margin: '0 5px', opacity: 0.7 }}>{'·'}</span>}{b}</React.Fragment>)}
                </div>
              </div>
              <GroupRoleBadge role={role} />
            </div>
          );
        })}
      </div>

      {titleFor && onSetTitle && <MemberTitleSheet member={titleFor} onClose={() => setTitleFor(null)} onSave={(t) => onSetTitle(titleFor.user_id, t)} />}
      {sheetMember && sheetMember.profile && (
        <GroupRoleSheet group={group} member={sheetMember} myRank={myRank} rolesOn={rolesOn} announce={announce} onClose={() => setSheetFor(null)}
          onProfile={(pf) => { setSheetFor(null); onOpenProfile(pf); }}
          onSetRole={(uid, r) => { if (onSetRole) onSetRole(uid, r); else if (r === 'admin') onPromote(uid); else onDemote(uid); }}
          onMuteFor={(uid, mins) => { if (onMuteFor) onMuteFor(uid, mins); else if (mins) onMute(uid); else onUnmute(uid); }}
          onKick={onKick} onTransfer={onTransferOwnership}
          onTitle={onSetTitle ? (x) => { setSheetFor(null); setTitleFor(x); } : null} />
      )}
    </div>
    </>
  );
}
const pairsMem = new Map();
function useSiPairs(members) {
  const wearing = (members || []).filter((m) => m && m.profile && siHalfOf(m.profile));
  const halves = new Set(wearing.map((m) => siHalfOf(m.profile)));
  const maybe = wearing.some((m) => halves.has(DECOR_BY_KEY[siHalfOf(m.profile)].pair));
  const ids = maybe ? wearing.map((m) => m.user_id).sort() : [];
  const sig = ids.join(',') + '|' + wearing.map((m) => siHalfOf(m.profile)).sort().join(',');
  const [map, setMap] = useState(() => (maybe && pairsMem.get(sig)) || new Map());
  useEffect(() => {
    if (!maybe) { setMap((cur) => (cur.size ? new Map() : cur)); return undefined; }
    if (pairsMem.has(sig)) setMap(pairsMem.get(sig));
    let alive = true;
    supabase.rpc('zchat_match_pairs', { p_ids: ids.slice(0, 300) }).then(({ data, error }) => {
      if (error) return;
      const next = new Map();
      (Array.isArray(data) ? data : []).forEach((r) => {
        if (!r || !r.a || !r.b || !DECOR_BY_KEY[r.key_a] || !DECOR_BY_KEY[r.key_b]) return;
        next.set(r.a, { mate: r.b, accent: DECOR_BY_KEY[r.key_a].accent });
        next.set(r.b, { mate: r.a, accent: DECOR_BY_KEY[r.key_b].accent });
      });
      pairsMem.set(sig, next);
      if (alive) setMap(next);
    }, () => {});
    return () => { alive = false; };
  }, [sig]);
  return map;
}
function siPairOrder(list, pairs) {
  if (!pairs || !pairs.size) return list;
  const out = [];
  const used = new Set();
  list.forEach((m) => {
    if (used.has(m.user_id)) return;
    out.push(m);
    used.add(m.user_id);
    const p = pairs.get(m.user_id);
    const mate = p ? list.find((x) => x.user_id === p.mate) : null;
    if (mate && !used.has(mate.user_id)) { out.push(mate); used.add(mate.user_id); }
  });
  return out;
}
function siPairGlow(pairs, uid, node) {
  const p = pairs && pairs.get(uid);
  if (!p) return node;
  siCss();
  return <span className="zsi-ringglow" style={{ display: 'inline-flex', flexShrink: 0, '--gc': p.accent }}>{node}</span>;
}
function SwatchIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M12 3.2c3.4 4.1 5.9 7.2 5.9 10.4a5.9 5.9 0 0 1-11.8 0c0-3.2 2.5-6.3 5.9-10.4Z" />
    </svg>
  );
}

const GROUP_ACCENTS = ['#FF6B4A', '#29C7B3', '#7C5CFC', '#F3B54C', '#FF4D8D', '#3DA5F5', '#4CC98A', '#B45CFF'];

export function JoinGroupSheet({ group, count, busy, onJoin, onClose, requested, onCancelRequest }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const accent = groupAccent(group);
  const g1q = group.join_approval && !requested ? g1Questions(group) : [];
  const [g1a, setG1a] = useState(() => G1_ANSWERS.get(group.id) || []);
  const g1ready = g1q.every((_, i) => String(g1a[i] || '').trim());
  const sheet = (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', fontFamily: FONT }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '26px 20px', paddingBottom: 'calc(22px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', borderRadius: 32, boxShadow: `0 0 0 3px ${accent}, 0 12px 34px ${accent}55` }}><GroupAvatar avatar={group.avatar} name={group.name} size={92} /></div>
        <div style={{ fontWeight: 900, fontSize: 21, color: theme.ink, marginTop: 16, wordBreak: 'break-word' }}>Join {group.name}?</div>
        <div style={{ fontSize: 13, color: theme.muted, fontWeight: 700, marginTop: 4 }}>Group with {count} {count === 1 ? 'member' : 'members'}</div>
        {group.bio && <div data-zuser="" style={{ fontSize: 14, color: theme.ink, lineHeight: 1.5, marginTop: 12 }}>{group.bio}</div>}
        {group.join_approval && <div style={{ fontSize: 13, color: theme.muted, lineHeight: 1.45, marginTop: 12 }}>{requested ? 'Your request is waiting for an admin.' : 'An admin approves new members before they can see the chat.'}</div>}
        {g1q.length > 0 && <G1JoinAnswers qs={g1q} ans={g1a} onChange={(next) => { G1_ANSWERS.set(group.id, next); setG1a(next); }} />}
        <button disabled={busy || requested || !g1ready} onClick={onJoin} style={{ display: 'block', width: '100%', marginTop: 20, padding: '14px 16px', borderRadius: 14, border: 'none', background: requested ? theme.rowBg : accent, color: requested ? theme.muted : 'white', fontWeight: 800, fontSize: 15, fontFamily: FONT, cursor: requested ? 'default' : 'pointer', opacity: busy || !g1ready ? 0.6 : 1 }}>
          {busy ? <Spinner size={16} /> : requested ? 'Request sent' : group.join_approval ? 'Ask to join' : 'Join group'}
        </button>
        {requested ? (
          <div role="button" onClick={onCancelRequest} style={{ padding: '14px 0 2px', fontWeight: 700, color: theme.danger, cursor: 'pointer' }}>Cancel request</div>
        ) : (
          <div role="button" onClick={onClose} style={{ padding: '14px 0 2px', fontWeight: 700, color: theme.muted, cursor: 'pointer' }}>Not now</div>
        )}
      </div>
    </div>
  );
  return ReactDOM.createPortal(sheet, document.body);
}
