import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import { useLiveBeacon } from './live.js';
import {
  useTheme, FONT, Avatar, GameArt, GAME_TITLES, FullPage, useBackClose, playUiSound, hapticTap, appSnack, GameButton, LoadFail,
  SegmentedControl, reducedMotion, rtKeep, rtDrop, copyTextToClipboard, Portal,
} from '../App.jsx';

export const ROOM_KINDS = ['chess', 'pool', 'ckr', 'crm', 'golf', 'zap', 'zapm', 'c4', 'reversi', 'ttt', 'gomoku', 'dots', 'ship'];
const titleOf = (k) => (k === 'zapm' ? 'Zap Mayhem' : GAME_TITLES[k] || 'Game');
const artOf = (k) => (k === 'zapm' ? 'zap' : k);
const CODE_CHARS = /[^A-HJKMNP-Z2-9]/g;
const WHY = {
  code: 'Room IDs have 6 letters and numbers.',
  none: 'No open room has that ID. Check it and try again.',
  taken: 'Someone already joined that room.',
  slow: 'Too many tries. Wait a minute and try again.',
  kind: 'That game cannot be played in rooms yet.',
  auth: 'Log in again to play online.',
  busy: 'Could not make a room right now. Try again.',
};
const ROOMS_CSS = `
.zrm-pulse{animation:zrm-pulse 1.6s ease-in-out infinite}
@keyframes zrm-pulse{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
.zrm-in{animation:zrm-in .32s cubic-bezier(.2,.9,.25,1) both}
@keyframes zrm-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.zrm-row{transition:transform .12s ease}
.zrm-row:active{transform:scale(.98)}
@media (prefers-reduced-motion:reduce){.zrm-pulse,.zrm-in{animation:none!important}}
`;
let roomsCss = false;
function injectRoomsCss() {
  if (roomsCss || typeof document === 'undefined') return;
  roomsCss = true;
  const el = document.createElement('style');
  el.textContent = ROOMS_CSS;
  document.head.appendChild(el);
}
async function rpc(fn, args) {
  try {
    const { data, error } = await supabase.rpc(fn, args || {});
    if (error) return { ok: false, why: /function|schema cache|does not exist/i.test(String(error.message || '')) ? 'setup' : 'net' };
    return data && typeof data === 'object' ? data : { ok: false, why: 'net' };
  } catch { return { ok: false, why: 'net' }; }
}
function whyText(why) {
  if (why === 'setup') return 'Online rooms switch on once the latest ZChat setup is finished.';
  if (why === 'net') return 'No connection. Try again in a moment.';
  return WHY[why] || 'That did not work. Try again.';
}
function ago(iso) {
  const s = Math.max(0, (Date.now() - Date.parse(iso || '')) / 1000);
  if (!Number.isFinite(s) || s < 45) return 'Just now';
  const m = Math.round(s / 60);
  return m <= 1 ? '1 min' : `${m} min`;
}

export function useLobbyPresence(myId, kind) {
  const [online, setOnline] = useState(0);
  const kindRef = useRef(kind);
  kindRef.current = kind;
  const chRef = useRef(null);
  useEffect(() => {
    if (!myId) return undefined;
    const count = (ch) => { try { setOnline(Object.keys(ch.presenceState() || {}).length); } catch {} };
    const keep = rtKeep(() => {
      const ch = supabase.channel('zgame-lobby', { config: { presence: { key: myId } } });
      chRef.current = ch;
      return ch.on('presence', { event: 'sync' }, () => count(ch));
    }, { topic: 'zgame-lobby', onStatus: (st, err, ch) => { if (st === 'SUBSCRIBED') { try { ch.track({ k: kindRef.current || null, at: Date.now() }); } catch {} count(ch); } } });
    return () => { chRef.current = null; rtDrop(keep); };
  }, [myId]);
  useEffect(() => { const ch = chRef.current; if (ch) { try { ch.track({ k: kind || null, at: Date.now() }); } catch {} } }, [kind]);
  return Math.max(online, myId ? 1 : 0);
}

function useRoomWatch(room, onChange) {
  const cb = useRef(onChange);
  cb.current = onChange;
  useEffect(() => {
    if (!room || !room.id) return undefined;
    let dead = false;
    let t = 0;
    const tick = async () => {
      const r = await rpc('zchat_room_ping', { p_id: room.id });
      if (dead) return;
      if (r && r.ok && r.room) cb.current(r.room);
      t = setTimeout(tick, document.visibilityState === 'hidden' ? 8000 : 2500);
    };
    t = setTimeout(tick, 1200);
    const keep = rtKeep(() => supabase.channel(`zroom-${room.id}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'room' }, () => { clearTimeout(t); tick(); }), { topic: `zroom-${room.id}` });
    return () => { dead = true; clearTimeout(t); rtDrop(keep); };
  }, [room && room.id]);
}
function roomPoke(id) {
  try {
    const ch = supabase.channel(`zroom-${id}`, { config: { broadcast: { self: false } } });
    let done = false;
    const end = () => { if (done) return; done = true; setTimeout(() => { try { supabase.removeChannel(ch); } catch {} }, 600); };
    ch.subscribe((st) => { if (st === 'SUBSCRIBED') { try { ch.send({ type: 'broadcast', event: 'room', payload: { at: Date.now() } }); } catch {} end(); } });
    setTimeout(end, 4000);
  } catch {}
}

function Stat({ n, label, dot }) {
  const { theme } = useTheme();
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 700, color: theme.muted, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />}
      {`${n} ${label}`}
    </span>
  );
}

function KindTile({ k, playing, waiting, onQuick, busy }) {
  const { theme } = useTheme();
  return (
    <div className="zrm-row" style={{ display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', background: theme.soft || theme.rowBg, minWidth: 0 }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 10' }}>
        <GameArt k={artOf(k)} width="100%" height="100%" radius={0} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)' }} />
        <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, fontSize: 15.5, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em', textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titleOf(k)}</div>
      </div>
      <div style={{ padding: '9px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Stat n={playing} label="playing" dot={playing > 0 ? '#22C55E' : theme.muted2 || theme.muted} />
          <Stat n={waiting} label={waiting === 1 ? 'room open' : 'rooms open'} />
        </div>
        <GameButton small full color={waiting > 0 ? 'green' : 'white'} label={busy ? 'Finding' : waiting > 0 ? 'Quick join' : 'Find a game'} disabled={!!busy} onClick={onQuick} />
      </div>
    </div>
  );
}

function OpenRoomRow({ r, onJoin, busy }) {
  const { theme } = useTheme();
  const p = r.host_p || {};
  return (
    <div className="zrm-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 18, background: theme.soft || theme.rowBg }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar emoji={p.avatar} name={p.name || 'Player'} size={46} />
        <div style={{ position: 'absolute', right: -6, bottom: -6, borderRadius: 10, overflow: 'hidden', boxShadow: `0 0 0 2px ${theme.panelBg}` }}><GameArt k={artOf(r.kind)} width={24} height={24} radius={0} /></div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Player'}</div>
        <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${titleOf(r.kind)}, waiting ${ago(r.created_at).toLowerCase()}`}</div>
      </div>
      <GameButton small color="green" label="Join" disabled={!!busy} onClick={onJoin} />
    </div>
  );
}

function CreateSheet({ onClose, onCreate }) {
  const { theme } = useTheme();
  useBackClose(true, onClose);
  const [k, setK] = useState(ROOM_KINDS[0]);
  const [who, setWho] = useState('anyone');
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', fontFamily: FONT }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, maxHeight: 'min(88vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '26px 26px 0 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ padding: '6px 18px 10px' }}>
            <div style={{ fontSize: 20, fontWeight: 850, color: theme.ink, letterSpacing: '-0.015em' }}>Make a room</div>
            <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2 }}>You get a room ID to share. The game starts when someone joins.</div>
          </div>
          <div style={{ overflowY: 'auto', minHeight: 0, padding: '4px 16px 8px' }}>
            <div role="radiogroup" aria-label="Game" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
              {ROOM_KINDS.map((g) => (
                <div key={g} role="radio" aria-checked={k === g} aria-label={titleOf(g)} onClick={() => { hapticTap(); setK(g); }} style={{ cursor: 'pointer', minWidth: 0 }}>
                  <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '1 / 1', boxShadow: k === g ? `0 0 0 3px ${theme.coral}` : 'none', transition: 'box-shadow .15s ease' }}><GameArt k={artOf(g)} width="100%" height="100%" radius={0} /></div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: k === g ? theme.ink : theme.muted, textAlign: 'center', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titleOf(g)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: theme.ink, margin: '16px 2px 8px' }}>Who can join</div>
            <SegmentedControl value={who} onChange={setWho} options={[['anyone', 'Anyone'], ['code', 'Only with the ID']]} />
            <div style={{ fontSize: 12.5, color: theme.muted, margin: '8px 2px 0', lineHeight: 1.45 }}>{who === 'anyone' ? 'Your room shows in open rooms, and quick join can match people to it.' : 'Your room stays hidden. Only people you give the ID to can join.'}</div>
          </div>
          <div style={{ padding: '8px 16px 0' }}><GameButton full color="green" label="Make room" onClick={() => onCreate(k, who === 'anyone')} /></div>
        </div>
      </div>
    </Portal>
  );
}

function WaitView({ wait, myId, onCancel }) {
  const { theme } = useTheme();
  const r = wait.room;
  const host = r.host === myId;
  const other = host ? r.guest_p : r.host_p;
  const matched = !!(r.guest && other);
  useLiveBeacon({ game: r.kind === 'zapm' ? 'zap' : r.kind, room: `rm-${r.id}`, info: { lob: r.code, n: 1 }, active: host && !matched && !!r.code && typeof r.kind === 'string' });
  const [copied, setCopied] = useState(false);
  const copy = async () => { hapticTap(); const ok = await copyTextToClipboard(r.code); if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1600); } };
  const share = async () => {
    let link = '';
    try { link = `${window.location.origin}/?room=${r.code}`; } catch {}
    const text = `Play ${titleOf(r.kind)} with me on ZChat. Room ID ${r.code}${link ? ` ${link}` : ''}`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    const ok = await copyTextToClipboard(text);
    if (ok) appSnack('Invite copied');
  };
  return (
    <Portal>
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 97, background: theme.dark ? '#0C0C0E' : '#FFFFFF', fontFamily: FONT, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px max(20px, env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))' }}>
        <div className="zrm-in" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ borderRadius: 26, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' }}><GameArt k={artOf(r.kind)} width={150} height={104} radius={0} /></div>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.muted, marginTop: 18 }}>{titleOf(r.kind)}</div>
          {matched ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
                <Avatar emoji={wait.me && wait.me.avatar} name={(wait.me && wait.me.name) || 'You'} size={64} />
                <span style={{ fontSize: 15, fontWeight: 900, color: theme.coral }}>VS</span>
                <Avatar emoji={other.avatar} name={other.name || 'Player'} size={64} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: theme.ink, marginTop: 14, letterSpacing: '-0.015em' }}>{`Playing with ${String(other.name || 'a player').split(' ')[0]}`}</div>
              <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>{host ? 'Setting up the game' : 'Opening the game'}</div>
            </>
          ) : host ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, marginTop: 18 }}>Room ID</div>
              <button type="button" onClick={copy} aria-label={`Copy room ID ${r.code}`} style={{ marginTop: 4, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, fontSize: 40, fontWeight: 900, letterSpacing: '0.12em', color: theme.ink, fontVariantNumeric: 'tabular-nums' }}>{r.code}</button>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: copied ? '#16A34A' : theme.muted, minHeight: 18 }}>{copied ? 'Copied' : 'Tap to copy'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 15, fontWeight: 800, color: theme.ink }}>
                <span className={reducedMotion() ? undefined : 'zrm-pulse'} style={{ width: 9, height: 9, borderRadius: '50%', background: '#22C55E' }} />Waiting for a player
              </div>
              <div style={{ fontSize: 13, color: theme.muted, marginTop: 6, lineHeight: 1.45, maxWidth: 300 }}>{r.listed ? 'Share the ID, or wait. People using quick join can land in your room too.' : 'Share the ID with the person you want to play.'}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, width: '100%' }}>
                <GameButton color="white" label="Cancel" onClick={onCancel} style={{ flex: 1 }} />
                <GameButton color="green" label="Share ID" onClick={share} style={{ flex: 1 }} />
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 20, fontWeight: 900, color: theme.ink, marginTop: 16 }}>Joining</div>
              <div style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>One moment</div>
              <div style={{ marginTop: 22, width: '100%' }}><GameButton full color="white" label="Cancel" onClick={onCancel} /></div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}

export function GameRoomsPage({ myId, me, online, onKind, onClose, onHostStart, onGuestOpen, initialCode }) {
  injectRoomsCss();
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [lobby, setLobby] = useState(null);
  const [failed, setFailed] = useState(null);
  const [code, setCode] = useState(() => String(initialCode || '').toUpperCase().replace(CODE_CHARS, '').slice(0, 6));
  const [busy, setBusy] = useState(null);
  const [wait, setWait] = useState(null);
  const [creating, setCreating] = useState(false);
  const startedRef = useRef(false);
  useEffect(() => { if (onKind) onKind(wait ? wait.room.kind : 'rooms'); }, [wait && wait.room.kind]);
  useEffect(() => () => { if (onKind) onKind(null); }, []);
  const load = async () => {
    const r = await rpc('zchat_room_lobby', { p_kind: null });
    if (r && r.ok) { setLobby(r); setFailed(null); } else setFailed(r ? r.why : 'net');
  };
  useEffect(() => {
    load();
    const iv = setInterval(() => { if (document.visibilityState !== 'hidden' && !wait) load(); }, 15000);
    return () => clearInterval(iv);
  }, [!!wait]);
  useBackClose(!!wait, () => cancel());
  const cancel = async () => {
    const w = wait;
    setWait(null);
    startedRef.current = false;
    if (w && w.room && w.room.state !== 'play') { await rpc('zchat_room_set', { p_id: w.room.id, p_state: 'gone' }); roomPoke(w.room.id); }
    load();
  };
  const go = async (room) => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (room.host === myId) {
      await rpc('zchat_room_set', { p_id: room.id, p_state: 'play' });
      roomPoke(room.id);
      setTimeout(() => { onHostStart(room.guest_p, room.kind, room.id); }, reducedMotion() ? 100 : 900);
    } else {
      setTimeout(() => { onGuestOpen(room.host_p, room.kind, room.id); }, reducedMotion() ? 100 : 600);
    }
  };
  useRoomWatch(wait && wait.room, (room) => {
    setWait((w) => (w && w.room.id === room.id ? { ...w, room } : w));
    if (room.state === 'gone') { setWait(null); startedRef.current = false; appSnack(room.host === myId ? 'The room closed' : 'The room closed before the game started'); load(); return; }
    if (room.host === myId && room.state === 'ready' && room.guest_p) { playUiSound('receive'); go(room); }
    if (room.host !== myId && room.state === 'play') go(room);
  });
  const enter = (room, how) => {
    playUiSound('tap');
    setWait({ room, me });
    if (room.host !== myId) {
      roomPoke(room.id);
      if (room.state === 'play') go(room);
    } else if (room.state === 'ready' && room.guest_p) go(room);
    if (how === 'made') appSnack('No open room right now, so you made one. Waiting for a player');
  };
  const join = async (c) => {
    const clean = String(c || '').toUpperCase().replace(CODE_CHARS, '');
    if (clean.length !== 6) { appSnack(whyText('code')); return; }
    setBusy('code');
    const r = await rpc('zchat_room_join', { p_code: clean });
    setBusy(null);
    if (!r.ok) { appSnack(whyText(r.why)); return; }
    setCode('');
    enter(r.room);
  };
  const quick = async (k) => {
    hapticTap();
    setBusy(`q:${k}`);
    const r = await rpc('zchat_room_quick', { p_kind: k });
    setBusy(null);
    if (!r.ok) { appSnack(whyText(r.why)); return; }
    enter(r.room, r.made ? 'made' : null);
  };
  const create = async (k, listed) => {
    setCreating(false);
    setBusy('make');
    const r = await rpc('zchat_room_open', { p_kind: k, p_listed: listed });
    setBusy(null);
    if (!r.ok) { appSnack(whyText(r.why)); return; }
    enter(r.room);
  };
  const joinRoom = async (room) => { setBusy(`r:${room.id}`); const r = await rpc('zchat_room_join', { p_code: room.code }); setBusy(null); if (!r.ok) { appSnack(whyText(r.why)); load(); return; } enter(r.room); };
  const waiting = (lobby && lobby.waiting) || {};
  const playing = (lobby && lobby.playing) || {};
  const totalPlaying = Object.values(playing).reduce((a, b) => a + (Number(b) || 0), 0);
  const kinds = useMemo(() => ROOM_KINDS.slice().sort((a, b) => ((Number(waiting[b]) || 0) * 3 + (Number(playing[b]) || 0)) - ((Number(waiting[a]) || 0) * 3 + (Number(playing[a]) || 0))), [lobby]);
  const open = (lobby && Array.isArray(lobby.rooms) ? lobby.rooms : []).filter((r) => r && r.code && r.host !== myId);
  return (
    <FullPage title="Play online" subtitle={`${Math.max(1, online || 0)} online now${totalPlaying ? `, ${totalPlaying} playing` : ''}`} onBack={onClose} zIndex={62}>
      <div className="zrm-in" style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 20 }}>
        <div style={{ padding: 14, borderRadius: 22, background: theme.soft || theme.rowBg, marginTop: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 850, color: theme.ink }}>Join with a room ID</div>
          <form onSubmit={(e) => { e.preventDefault(); join(code); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(CODE_CHARS, '').slice(0, 6))} placeholder="ABC234" aria-label="Room ID" inputMode="text" autoCapitalize="characters" autoComplete="off" spellCheck={false}
              style={{ flex: 1, minWidth: 0, height: 46, borderRadius: 14, border: 'none', outline: 'none', padding: '0 14px', background: theme.panelBg, color: theme.ink, fontFamily: FONT, fontSize: 20, fontWeight: 800, letterSpacing: '0.14em', boxShadow: `inset 0 0 0 1px ${theme.border}` }} />
            <GameButton color="green" label={busy === 'code' ? 'Joining' : 'Join'} disabled={busy === 'code' || code.length !== 6} onClick={() => join(code)} style={{ height: 46 }} />
          </form>
          <button type="button" onClick={() => { hapticTap(); setCreating(true); }} disabled={busy === 'make'} style={{ marginTop: 12, width: '100%', height: 44, borderRadius: 14, border: 'none', background: theme.panelBg, color: theme.ink, fontFamily: FONT, fontSize: 14.5, fontWeight: 800, cursor: 'pointer', boxShadow: `inset 0 0 0 1px ${theme.border}` }}>{busy === 'make' ? 'Making a room' : 'Make a room'}</button>
        </div>
        {failed && !lobby ? (
          <div style={{ marginTop: 24 }}>{failed === 'setup' ? <div style={{ fontSize: 14, color: theme.muted, textAlign: 'center', lineHeight: 1.5 }}>{whyText('setup')}</div> : <LoadFail onRetry={load} />}</div>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <div style={{ fontSize: 18, fontWeight: 850, color: theme.ink, margin: '24px 0 10px', letterSpacing: '-0.015em' }}>Open rooms</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {open.slice(0, 12).map((r) => <OpenRoomRow key={r.id} r={r} busy={busy === `r:${r.id}`} onJoin={() => joinRoom(r)} />)}
                </div>
              </>
            )}
            <div style={{ fontSize: 18, fontWeight: 850, color: theme.ink, margin: '24px 0 4px', letterSpacing: '-0.015em' }}>Quick join</div>
            <div style={{ fontSize: 13, color: theme.muted, marginBottom: 12 }}>Get matched with someone who wants the same game.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {kinds.map((k) => <KindTile key={k} k={k} playing={Number(playing[k]) || 0} waiting={Number(waiting[k]) || 0} busy={busy === `q:${k}`} onQuick={() => quick(k)} />)}
            </div>
          </>
        )}
      </div>
      {creating && <CreateSheet onClose={() => setCreating(false)} onCreate={create} />}
      {wait && <WaitView wait={wait} myId={myId} onCancel={cancel} />}
    </FullPage>
  );
}
