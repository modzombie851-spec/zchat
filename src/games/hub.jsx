import { backdropProps } from './tap.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import {
  useTheme, FONT, Avatar, GameArt, GAME_TITLES, FRIEND_GAME_GROUPS, FRIEND_GAME_SUBS, SOLO_GAMES, SOLO_HIDDEN, LIVE_GAME_KEYS, GAME_ART_BG, DuoGamePage, GulpGamePage, RollGamePage,
  GameInfoButton, HowToPlaySheet, SoloGame, readBest, formatGameScore, loadMyGames, gameNet, gameNetMissing, isSoloGameKey,
  useBackClose, useSheetDrag, playUiSound, hapticTap, reducedMotion, FullPage, HeaderIconButton, TrophyIcon, CrownIcon, NameBadge,
  LoadFail, ghBotCan, ghBotLevel, GamepadIcon, GameButton, SegmentedControl, botPicUrl, LiveStatCtx, SoloFit,
} from '../App.jsx';
import { useLiveCast, useRaceLink, CastEye, CastLayer, CastSheet, injectCastCss } from './livecast.jsx';
import { useMyLevels, useLevels, LEVEL_GAMES, readRecent, noteRecent } from './levels.jsx';
import { loadLiveFriends, liveKind, useJoinWait, castMe } from './live.js';
import { cloudOn } from './zcloud.js';
import { sceneUrl, sceneKeyFor, preloadScene } from './scenes.jsx';
import { unlockAudio } from './kit.jsx';
import { GameRoomsPage, useLobbyPresence } from './rooms.jsx';

const POPULAR = ['pool', 'chess', 'crm', 'zap', 'ckr', 'golf'];
const RANK = ['pool', 'chess', 'crm', 'zap', 'ckr', 'golf', 'c4', 'ship', 'ttt', 'dots', 'reversi', 'gomoku', 'hang', 'wduel', 'rps'];
const PUZZLES = ['sdk', 'xw', 'jig'];
const NO_BOARD = ['sudoku', 'jig', 'xw', 'sdk', 'zombie'];
const LIVE_KEYS = () => LIVE_GAME_KEYS.filter((k) => k !== 'zombie' || cloudOn());
const BANNER_POS = { lounge: 'center 8%', study: 'center 18%', terrace: 'center 22%', course: 'center 30%', arena: 'center 14%', harbor: 'center 22%', zen: 'center 16%', desk: 'center 12%', playroom: 'center 14%', den: 'center 7%', parlor: 'center 17%' };
const SUBS = {
  pool: 'Break, pot your group, sink the black', chess: 'Classic chess, every rule', ckr: 'Jump, take and crown', golf: 'Nine holes, fewest strokes',
  c4: 'Line up four discs', ship: 'Find and sink their fleet', ttt: 'Three in a row', dots: 'Close the most boxes', reversi: 'Flip discs, own the board',
  gomoku: 'Five stones in a line', hang: 'Pick a word, they guess', wduel: 'Same word, fewer tries wins', rps: 'Best of three',
  tug: 'Tap faster to pull the rope', qrace: 'Same questions, fastest wins', rrace: 'First to tap on green',
  crm: 'Flick the striker, pot your coins', zap: 'Match colour or number, go out first', squish: 'Throw water balloons, merge to 4096',
};

function duoKeys() {
  const seen = new Set();
  const out = [];
  FRIEND_GAME_GROUPS.forEach(([, keys]) => keys.forEach((k) => { if (!seen.has(k) && !LIVE_GAME_KEYS.includes(k) && !PUZZLES.includes(k) && GAME_TITLES[k]) { seen.add(k); out.push(k); } }));
  return out.sort((a, b) => (RANK.indexOf(a) < 0 ? 99 : RANK.indexOf(a)) - (RANK.indexOf(b) < 0 ? 99 : RANK.indexOf(b)));
}
function puzzleKeys() {
  const all = new Set();
  FRIEND_GAME_GROUPS.forEach(([, keys]) => keys.forEach((k) => all.add(k)));
  return PUZZLES.filter((k) => all.has(k));
}
function soloKeys() { return SOLO_GAMES.map((g) => g.k).filter((k) => !SOLO_HIDDEN.includes(k)); }
function subFor(k) { return SUBS[k] || FRIEND_GAME_SUBS[k] || ((SOLO_GAMES.find((g) => g.k === k) || {}).sub) || ''; }

function useWarmScenes(keys) {
  useEffect(() => {
    const go = () => keys.forEach((k) => preloadScene(sceneKeyFor(k)));
    if (typeof window !== 'undefined' && window.requestIdleCallback) { const h = window.requestIdleCallback(go, { timeout: 1500 }); return () => window.cancelIdleCallback && window.cancelIdleCallback(h); }
    const t = setTimeout(go, 300);
    return () => clearTimeout(t);
  }, []);
}

const HUB_CSS = `
.zgh-tile{transition:transform .14s ease, box-shadow .14s ease;-webkit-tap-highlight-color:transparent}
.zgh-tile:active{transform:scale(.965)}
.zgh-row{scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}
.zgh-row::-webkit-scrollbar{display:none}
.zgh-row>*{scroll-snap-align:start}
.zgh-in{animation:zgh-in .38s cubic-bezier(.2,.9,.25,1) both}
@keyframes zgh-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.zgh-splash{animation:zgh-splash .7s ease both}
@keyframes zgh-splash{0%{opacity:0}12%{opacity:1}78%{opacity:1}100%{opacity:0;visibility:hidden}}
.zgh-splash-art{animation:zgh-art .7s cubic-bezier(.2,.9,.25,1) both}
@keyframes zgh-art{from{transform:scale(.86) translateY(14px)}to{transform:none}}
@media (prefers-reduced-motion:reduce){.zgh-in,.zgh-splash,.zgh-splash-art{animation-duration:.01s!important}.zgh-tile{transition:none}}
`;
let hubCss = false;
function injectHubCss() {
  if (hubCss || typeof document === 'undefined') return;
  hubCss = true;
  const el = document.createElement('style');
  el.textContent = HUB_CSS;
  document.head.appendChild(el);
}

function SectionTitle({ children, right }) {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 10px' }}>
      <div style={{ flex: 1, fontSize: 18, fontWeight: 850, letterSpacing: '-0.015em', color: theme.ink }}>{children}</div>
      {right}
    </div>
  );
}

function Tile({ k, title, sub, badge, onClick, ratio = '4 / 3', titleSize = 16, small }) {
  return (
    <div role="button" aria-label={title} onClick={onClick} className="zgh-tile"
      style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', aspectRatio: ratio, cursor: 'pointer', boxShadow: '0 8px 20px rgba(20,10,40,0.18), inset 0 0 0 1px rgba(255,255,255,0.06)', background: '#1B1828' }}>
      <GameArt k={k} width="100%" height="100%" radius={0} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 38%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.74) 100%)' }} />
      <div style={{ position: 'absolute', left: small ? 9 : 12, right: small ? 8 : 10, bottom: small ? 8 : 10 }}>
        <div style={{ fontSize: small ? 12.5 : (String(title).length > 15 ? titleSize - 2 : titleSize), lineHeight: small ? '15px' : 1.2, fontWeight: 900, letterSpacing: '-0.01em', color: '#FFFFFF', textShadow: '0 1px 4px rgba(0,0,0,0.55)', ...(small ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }) }}>{title}</div>
        {sub && <div style={{ fontSize: small ? 11 : 12, fontWeight: small ? 700 : 600, color: 'rgba(255,255,255,0.86)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
      {badge && <div style={{ position: 'absolute', top: 9, left: 9 }}>{badge}</div>}
    </div>
  );
}

function LiveBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 7px', borderRadius: 999, background: '#E5484D', color: '#FFFFFF', fontSize: 11, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
      <span className={reducedMotion() ? undefined : 'zchat-live-dot'} style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFFFFF' }} />Live
    </span>
  );
}
function LevelBadge({ level }) {
  if (!level) return null;
  return <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 8, background: '#F5C443', color: '#2A1D05', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', lineHeight: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>{`Lv ${level}`}</span>;
}

function Banner({ k, sub, level, onPlay, label }) {
  const scene = sceneKeyFor(k);
  return (
    <div role="button" aria-label={`${GAME_TITLES[k]}, ${label}`} onClick={onPlay} className="zgh-tile"
      style={{ position: 'relative', flex: '0 0 auto', width: 'min(84vw, 330px)', height: 186, borderRadius: 26, overflow: 'hidden', cursor: 'pointer', backgroundColor: '#14121C', backgroundImage: `url("${sceneUrl(scene)}")`, backgroundSize: 'cover', backgroundPosition: BANNER_POS[scene] || 'center', boxShadow: '0 12px 28px rgba(20,10,40,0.28)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.72) 100%)' }} />
      <div style={{ position: 'absolute', top: 12, left: 12, borderRadius: 18, overflow: 'hidden', boxShadow: '0 6px 16px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.85)' }}>
        <GameArt k={k} width={58} height={58} radius={0} />
      </div>
      {level ? <div style={{ position: 'absolute', top: 14, right: 14 }}><LevelBadge level={level} /></div> : null}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 13, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{GAME_TITLES[k]}</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
        <span style={{ flexShrink: 0, padding: '8px 15px', borderRadius: 999, background: '#FFFFFF', color: '#16131F', fontSize: 13.5, fontWeight: 900 }}>{label}</span>
      </div>
    </div>
  );
}

function SoloSplash({ k }) {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setTimeout(() => setOn(false), reducedMotion() ? 10 : 720); return () => clearTimeout(t); }, []);
  if (!on) return null;
  const bg = GAME_ART_BG[k] || ['#3B2F63', '#1B1530'];
  return (
    <div className="zgh-splash" style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: `radial-gradient(90% 60% at 50% 42%, ${bg[1]} 0%, #0B0A10 100%)`, pointerEvents: 'none', fontFamily: FONT }}>
      <div className="zgh-splash-art" style={{ borderRadius: 30, overflow: 'hidden', boxShadow: '0 22px 50px rgba(0,0,0,0.5)' }}><GameArt k={k} width={220} height={138} radius={0} /></div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>{GAME_TITLES[k]}</div>
    </div>
  );
}

function ScoreToast({ k }) {
  const { theme } = useTheme();
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    let t = 0;
    const on = (e) => {
      const d = e && e.detail;
      if (!d || d.k !== k || !d.new_best) return;
      const where = d.friend_rank ? `#${d.friend_rank} among friends` : d.rank ? `#${d.rank} on ZChat` : '';
      setMsg({ key: Date.now(), text: `New best, ${formatGameScore(k, d.best)}`, sub: where });
      clearTimeout(t);
      t = setTimeout(() => setMsg(null), 3200);
    };
    window.addEventListener('zchat-game-score', on);
    return () => { window.removeEventListener('zchat-game-score', on); clearTimeout(t); };
  }, [k]);
  if (!msg) return null;
  return (
    <div key={msg.key} className="zchat-fade" role="status" style={{ position: 'fixed', left: '50%', top: 'calc(70px + env(safe-area-inset-top))', transform: 'translateX(-50%)', zIndex: 120, width: 'max-content', maxWidth: 'calc(100vw - 32px)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 12px', borderRadius: 18, background: theme.dark ? '#1F1F24' : '#FFFFFF', boxShadow: '0 12px 30px rgba(0,0,0,0.28)', pointerEvents: 'none' }}>
      <span style={{ display: 'flex', flexShrink: 0 }}><TrophyIcon size={24} color="#F59E0B" /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 900, color: theme.ink, whiteSpace: 'nowrap' }}>{msg.text}</span>
        {msg.sub && <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: theme.muted }}>{msg.sub}</span>}
      </span>
    </div>
  );
}

function useMyGameStats() {
  const [mine, setMine] = useState(gameNet.mine);
  useEffect(() => {
    gameNet.listeners.add(setMine);
    loadMyGames(false).then((m) => { if (m) setMine(m); });
    return () => { gameNet.listeners.delete(setMine); };
  }, []);
  return mine || {};
}

function OnlineCard({ online, onOpen }) {
  const { theme } = useTheme();
  return (
    <div role="button" aria-label="Play online" onClick={onOpen} className="zgh-tile"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 14px 14px 12px', marginTop: 4, borderRadius: 24, cursor: 'pointer', background: theme.dark ? 'linear-gradient(135deg, #1F1F24 0%, #17171A 100%)' : 'linear-gradient(135deg, #F2F1F6 0%, #FFFFFF 100%)', boxShadow: `inset 0 0 0 1px ${theme.border}` }}>
      <div style={{ position: 'relative', width: 74, height: 58, flexShrink: 0 }}>
        {['zap', 'pool', 'chess'].map((k, i) => (
          <div key={k} style={{ position: 'absolute', left: i * 14, top: i % 2 ? 8 : 0, width: 44, height: 44, borderRadius: 13, overflow: 'hidden', boxShadow: `0 0 0 2px ${theme.dark ? '#1F1F24' : '#FFFFFF'}, 0 6px 14px rgba(0,0,0,0.25)`, transform: `rotate(${(i - 1) * 6}deg)` }}><GameArt k={k} width={44} height={44} radius={0} /></div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: theme.ink, letterSpacing: '-0.015em' }}>Play online</div>
        <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, lineHeight: 1.35 }}>Quick join, open rooms and room IDs</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12.5, fontWeight: 800, color: theme.ink }}>
          <span className={reducedMotion() ? undefined : 'zchat-live-dot'} style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E' }} />{`${Math.max(1, online || 0)} online now`}
        </div>
      </div>
      <GameButton small color="green" label="Play" onClick={onOpen} />
    </div>
  );
}

export function GamesPage({ onClose, onChallenge, onShareScore, initialGame, friends, onPlayWith, onStartLive, onRollInvite, onRaceInvite, onRaceSolo, onSiegeInvite, onSiegeSolo, onZombie, onGulpRoom, onWatch, onJoinLive, onOpenLeaderboard, onPlayBot, myId, me, onRoomHost, onRoomGuest, initialRoom, playToo }) {
  const jw = useJoinWait(castMe.id);
  injectHubCss();
  injectCastCss();
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [rooms, setRooms] = useState(() => (initialRoom != null ? { code: initialRoom } : null));
  const [lobbyKind, setLobbyKind] = useState(null);
  const online = useLobbyPresence(myId, lobbyKind || 'hub');
  const mine = useMyGameStats();
  const levels = useMyLevels();
  const [game, setGame] = useState(() => (initialGame && isSoloGameKey(initialGame) ? initialGame : null));
  useBackClose(!!game, () => setGame(null));
  const soloRoot = useRef(null);
  const soloRoom = useMemo(() => (game ? `${game}-${String(myId || '').slice(0, 8)}-${Date.now().toString(36)}` : null), [game]);
  const soloCast = useLiveCast({ game, room: soloRoom, myId, me, active: !!game && game !== 'squish', rootRef: soloRoot, solo: true });
  const linkRow = playToo && playToo.row && playToo.row.game === game ? playToo.row : null;
  const raceLink = useRaceLink({ row: linkRow, myId, me, active: !!game && !!linkRow });
  const soloStat = useMemo(() => (items) => { soloCast.setStat(items); raceLink.setStat(items); }, [soloCast.setStat, raceLink.setStat]);
  const [castOpen, setCastOpen] = useState(false);
  const linkName = linkRow ? String((playToo.profile && playToo.profile.name) || 'Friend').split(' ')[0] : '';
  const raceLine = linkRow ? (raceLink.them ? `${linkName}: ${raceLink.them.l} ${raceLink.them.v}` : `Playing with ${linkName}`)
    : soloCast.racers.length ? soloCast.racers.slice(0, 2).map((r) => { const s = soloCast.scores[r.id]; return s ? `${r.n}: ${s.l} ${s.v}` : `${r.n} joined`; }).join(', ') : null;
  const [rulesFor, setRulesFor] = useState(null);
  const [duoSolo, setDuoSolo] = useState(false);
  const [gulpSolo, setGulpSolo] = useState(false);
  const [rollSolo, setRollSolo] = useState(false);
  const [liveNow, setLiveNow] = useState([]);
  useEffect(() => {
    if (!onWatch) return undefined;
    let alive = true;
    const load = () => loadLiveFriends().then((rows) => { if (alive) setLiveNow(rows || []); });
    load();
    const iv = setInterval(load, 25000);
    return () => { alive = false; clearInterval(iv); };
  }, []);
  const liveCards = liveNow.map((r) => ({ r, p: (friends || []).find((f) => f && f.id === r.user_id) })).filter((x) => x.p);
  const [recent] = useState(() => readRecent());
  const duos = useMemo(() => duoKeys(), []);
  const puzzles = useMemo(() => puzzleKeys(), []);
  const solos = useMemo(() => soloKeys(), []);
  useWarmScenes(POPULAR);
  const tap = () => { playUiSound('tap'); hapticTap(); unlockAudio(); };
  const bestOf = (k) => {
    const local = readBest(k);
    const remote = mine[k] && mine[k].best ? mine[k].best : 0;
    if (!local) return remote;
    if (!remote) return local;
    return k === 'memory' || k === 'reflex' ? Math.min(local, remote) : Math.max(local, remote);
  };
  const openSolo = (k) => { tap(); noteRecent(k); setGame(k); };
  const openAny = (k) => {
    if (isSoloGameKey(k) || k === 'sudoku') { openSolo(k); return; }
    tap();
    if (LIVE_GAME_KEYS.includes(k) && onStartLive) onStartLive(k);
    else onChallenge(k);
  };
  const lv = (k) => (levels && levels[k] && levels[k].level > 1 ? levels[k].level : null);
  const winsLine = (k) => { const s = mine[k]; return s && s.wins ? `${s.wins} ${s.wins === 1 ? 'win' : 'wins'}` : subFor(k); };
  const recentKeys = recent.filter((k) => GAME_TITLES[k] && (duos.includes(k) || solos.includes(k) || LIVE_GAME_KEYS.includes(k) || puzzles.includes(k) || k === 'sudoku'));
  return (
    <>
      <FullPage title="Games" onBack={onClose} zIndex={60}
        right={onOpenLeaderboard ? <HeaderIconButton label="Leaderboard" onClick={() => { tap(); onOpenLeaderboard('all'); }}><TrophyIcon size={20} /></HeaderIconButton> : null}>
        <div className="zgh-in">
          {myId && onRoomHost && <OnlineCard online={online} onOpen={() => { tap(); setRooms({}); }} />}
          {onPlayWith && friends && friends.length > 0 && (
            <>
              <SectionTitle>Play with a friend</SectionTitle>
              <div className="zgh-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px' }}>
                {friends.slice(0, 16).map((p) => (
                  <div key={p.id} role="button" aria-label={`Play with ${p.name}`} onClick={() => { tap(); onPlayWith(p); }} className="zgh-tile" style={{ width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar emoji={p.avatar} name={p.name} size={58} />
                      <span style={{ position: 'absolute', right: -3, bottom: -3, width: 24, height: 24, borderRadius: '50%', background: theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2.5px ${theme.panelBg}`, zIndex: 4 }}><GamepadIcon size={13} color="#FFFFFF" /></span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.ink, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(p.name || '').split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {liveCards.length > 0 && (
            <>
              <SectionTitle>Friends playing now</SectionTitle>
              <div className="zgh-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 8px' }}>
                {liveCards.map(({ r, p }) => { const L = liveKind(r); const two = !!(r.info && r.info.so && L.watch && L.play); return (
                  <div key={r.user_id} style={{ width: 150, flexShrink: 0, borderRadius: 18, overflow: 'hidden', background: theme.rowBg, boxShadow: '0 6px 16px rgba(0,0,0,0.14)' }}>
                    <div style={{ position: 'relative' }}>
                      <GameArt k={r.game} width="100%" height={78} radius={0} style={{ width: '100%' }} />
                      <span style={{ position: 'absolute', left: 8, top: 8, display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 10, background: 'rgba(14,10,24,0.78)', color: '#FFFFFF', fontSize: 11, fontWeight: 800 }}><span className="zchat-live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />Live</span>
                    </div>
                    <div style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <Avatar emoji={p.avatar} name={p.name} size={26} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 800, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(p.name || '').split(' ')[0]}</div>
                          <div style={{ fontSize: 11, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.info && r.info.lob ? 'Waiting for a player' : GAME_TITLES[L.k] || 'Game'}</div>
                        </div>
                      </div>
                      {L.act ? <GameButton small full color={L.act === 'Watch' ? 'gold' : 'green'} label={L.act} ariaLabel={`${L.act} ${String(p.name || '').split(' ')[0]}`} onClick={() => { tap(); if (L.act === 'Watch') onWatch(r, p); else if (onJoinLive) onJoinLive(r, p); }} /> : <div style={{ height: 36, display: 'flex', alignItems: 'center', fontSize: 12.5, fontWeight: 700, color: theme.muted }}>Playing now</div>}
                      {L.ask && onJoinLive && (() => { const js = jw.state(r); return <GameButton small full color={js === 'idle' ? 'green' : 'white'} label={js === 'wait' ? 'Asked' : js === 'no' ? 'Not now' : js === 'ok' ? 'Joining' : 'Ask to join'} ariaLabel={`Ask ${String(p.name || '').split(' ')[0]} to let you join`} onClick={() => { if (js !== 'idle') return; tap(); jw.ask(r, castMe.me, () => onJoinLive(r, p)); }} />; })()}
                      {two && onJoinLive && <GameButton small full color="white" label="Play too" ariaLabel={`Play ${GAME_TITLES[L.k] || 'it'} with ${String(p.name || '').split(' ')[0]}`} onClick={() => { tap(); onJoinLive(r, p); }} />}
                    </div>
                  </div>
                ); })}
              </div>
            </>
          )}
          {onZombie && (
            <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '6px 0 10px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
              <GameArt k="zombie" width="100%" height={188} radius={0} style={{ width: '100%' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(20,22,14,0) 30%, rgba(20,22,14,0.55) 58%, rgba(20,22,14,0.92) 100%)' }} />
              <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF' }}>Zombie Junction</span><span style={{ fontSize: 11, fontWeight: 800, color: '#1A1C12', background: '#F2A23A', borderRadius: 4, padding: '2px 6px' }}>New</span></div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.86)', lineHeight: 1.35 }}>{cloudOn() ? 'Up to 50 survivors on servers in Asia, USA and Europe hold a small town against waves of zombies.' : 'Hold a small town against waves of zombies, alone or with bot friends.'}</div>
                </div>
                <GameButton small color="gold" label="Play" onClick={() => { tap(); noteRecent('zombie'); onZombie(); }} />
              </div>
            </div>
          )}
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '6px 0 4px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <GameArt k="siege" width="100%" height={168} radius={0} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(12,18,10,0) 18%, rgba(12,18,10,0.5) 52%, rgba(12,18,10,0.9) 100%)' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF' }}>Bolt War</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>{`${cloudOn() ? 'Up to 20 players' : 'Up to ten friends'} pick from eight heroes and hold off waves of robots on five big maps, with a boss every five waves.`}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {onSiegeInvite && <GameButton small color="gold" label="Invite friends" onClick={() => { tap(); noteRecent('siege'); onSiegeInvite(); }} />}
                {onSiegeSolo && <GameButton small color="white" label="Play with bots" onClick={() => { tap(); noteRecent('siege'); onSiegeSolo(); }} />}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '10px 0 4px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <GameArt k="race" width="100%" height={168} radius={0} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,16,30,0) 34%, rgba(10,16,30,0.86) 100%)' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF' }}>Island Rally</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>Race up to eight friends on four maps, or switch on Attack race with rockets, oil and shields.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {onRaceInvite && <GameButton small color="gold" label="Invite friends" onClick={() => { tap(); noteRecent('race'); onRaceInvite(); }} />}
                {onRaceSolo && <GameButton small color="white" label="Race bots" onClick={() => { tap(); noteRecent('race'); onRaceSolo(); }} />}
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '10px 0 4px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <GameArt k="roll" width="100%" height={168} radius={0} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,30,20,0) 34%, rgba(8,30,20,0.84) 100%)' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF' }}>Roll Squad</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35 }}>Up to four friends roll and team up through 66 longer levels with plates, bridges and team gates.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {onRollInvite && <GameButton small color="gold" label="Invite friends" onClick={() => { tap(); noteRecent('roll'); onRollInvite(); }} />}
                <GameButton small color="white" label="Practice" onClick={() => { tap(); setRollSolo(true); }} />
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '10px 0 4px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <GameArt k="duo" width="100%" height={168} radius={0} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,16,0) 30%, rgba(10,8,16,0.86) 100%)' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF' }}>Torchbound</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.35 }}>Endless temples with a friend, live. Voice, quick chat and emojis.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {onStartLive && <GameButton small color="gold" label="Play together" onClick={() => { tap(); noteRecent('duo'); onStartLive('duo'); }} />}
                <GameButton small color="white" label="Practice" onClick={() => { tap(); setDuoSolo(true); }} />
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', margin: '10px 0 4px', boxShadow: '0 10px 24px rgba(0,0,0,0.22)' }}>
            <GameArt k="gulp" width="100%" height={168} radius={0} style={{ width: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,14,30,0) 30%, rgba(4,14,30,0.86) 100%)' }} />
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#FFFFFF' }}>Gulp</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.35 }}>Eat smaller fish and grow into a whale. 22 levels, endless missions and rooms for up to ten friends.</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {onGulpRoom ? <GameButton small color="gold" label="Gulp room" onClick={() => { tap(); noteRecent('gulpco'); onGulpRoom(); }} /> : onStartLive && <GameButton small color="gold" label="Play together" onClick={() => { tap(); noteRecent('gulp'); onStartLive('gulp'); }} />}
                <GameButton small color="white" label="Play" onClick={() => { tap(); setGulpSolo(true); }} />
              </div>
            </div>
          </div>
          <SectionTitle>Popular</SectionTitle>
          <div className="zgh-row" style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 8px' }}>
            {POPULAR.filter((k) => duos.includes(k)).map((k) => <Banner key={k} k={k} sub={subFor(k)} level={lv(k)} label="Play" onPlay={() => openAny(k)} />)}
          </div>
          {recentKeys.length > 0 && (
            <>
              <SectionTitle>Recently played</SectionTitle>
              <div className="zgh-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px' }}>
                {recentKeys.map((k) => (
                  <div key={k} style={{ width: 104, flexShrink: 0 }}>
                    <Tile k={k} title={GAME_TITLES[k]} ratio="1 / 1" small onClick={() => openAny(k)} />
                  </div>
                ))}
              </div>
            </>
          )}
          <SectionTitle>Two players</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {duos.filter((k) => !POPULAR.includes(k)).map((k) => <Tile key={k} k={k} title={GAME_TITLES[k]} sub={winsLine(k)} badge={lv(k) ? <LevelBadge level={lv(k)} /> : null} onClick={() => openAny(k)} />)}
          </div>
          {onStartLive && LIVE_GAME_KEYS.length > 0 && (
            <>
              <SectionTitle>Live, at the same time</SectionTitle>
              <div className="zgh-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', margin: '0 -16px', padding: '2px 16px 4px' }}>
                {LIVE_KEYS().map((k) => (
                  <div key={k} style={{ width: 168, flexShrink: 0 }}>
                    <Tile k={k} title={GAME_TITLES[k]} sub={subFor(k)} badge={<LiveBadge />} onClick={() => openAny(k)} />
                  </div>
                ))}
              </div>
            </>
          )}
          {puzzles.length > 0 && (
            <>
              <SectionTitle>Puzzles with a friend</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                {puzzles.map((k) => <Tile key={k} k={k} title={GAME_TITLES[k]} ratio="1 / 1" small onClick={() => openAny(k)} />)}
              </div>
            </>
          )}
          <SectionTitle>Solo</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {solos.map((k) => { const b = bestOf(k); return <Tile key={k} k={k} title={GAME_TITLES[k]} sub={k === 'sudoku' ? 'Easy to expert' : b ? `Best ${formatGameScore(k, b)}` : subFor(k)} onClick={() => openSolo(k)} />; })}
          </div>
          {onPlayBot && (
            <div role="button" aria-label="Play ZChat Bot" onClick={() => { tap(); onPlayBot(); }} className="zchat-row-press"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 12px', marginTop: 20, borderRadius: 18, cursor: 'pointer', background: theme.rowBg }}>
              <Avatar emoji={botPicUrl()} name="ZChat Bot" size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 800, color: theme.ink }}>Play ZChat Bot</div>
                <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1 }}>Easy, Medium or Hard, any time</div>
              </div>
              <GameButton small color="white" label="Play" onClick={() => { tap(); onPlayBot(); }} />
            </div>
          )}
          <div style={{ height: 8 }} />
        </div>
      </FullPage>
      {game && (
        <FullPage title={GAME_TITLES[game]} subtitle={raceLine || (game === 'sudoku' ? 'Easy to expert' : bestOf(game) ? `Best ${formatGameScore(game, bestOf(game))}` : 'No score yet')} onBack={() => setGame(null)} zIndex={61}
          bodyStyle={{ background: `linear-gradient(170deg, ${(GAME_ART_BG[game] || ['#3B2F63', '#1B1530'])[0]}${theme.dark ? '55' : '33'} 0%, ${(GAME_ART_BG[game] || ['#3B2F63', '#1B1530'])[1]}${theme.dark ? '33' : '1F'} 45%, transparent 85%)` }}
          right={<>{game !== 'squish' && <CastEye cast={soloCast} glass={false} size={36} onOpen={() => setCastOpen(true)} />}<GameInfoButton k={game} header />{onOpenLeaderboard && !NO_BOARD.includes(game) && <HeaderIconButton label="Leaderboard" onClick={() => onOpenLeaderboard(game)}><TrophyIcon size={19} /></HeaderIconButton>}{onShareScore && !NO_BOARD.includes(game) && <HeaderIconButton label="Share score" onClick={() => onShareScore(game, bestOf(game))}><ShareGlyph /></HeaderIconButton>}</>}>
          <div aria-hidden="true" ref={(n) => { soloRoot.current = n ? (n.closest('.zchat-wide-page') || n.parentElement) : null; }} style={{ display: 'none' }} />
          <SoloSplash k={game} />
          <LiveStatCtx.Provider value={soloStat}>
            <SoloFit><SoloGame k={game} /></SoloFit>
          </LiveStatCtx.Provider>
          <ScoreToast k={game} />
          {game !== 'squish' && <CastLayer cast={soloCast} z={66} />}
          {castOpen && <CastSheet cast={soloCast} z={68} onClose={() => setCastOpen(false)} />}
        </FullPage>
      )}
      {rulesFor && <HowToPlaySheet k={rulesFor} onClose={() => setRulesFor(null)} />}
      {duoSolo && <DuoGamePage solo me={me} myId={myId} onClose={() => setDuoSolo(false)} />}
      {gulpSolo && <GulpGamePage solo me={me} myId={myId} onClose={() => setGulpSolo(false)} />}
      {rollSolo && <RollGamePage solo me={me} myId={myId} onClose={() => setRollSolo(false)} />}
      {rooms && myId && onRoomHost && (
        <GameRoomsPage myId={myId} me={me} online={online} onKind={setLobbyKind} initialCode={rooms.code || ''} onClose={() => setRooms(null)}
          onHostStart={(p, k, gid) => onRoomHost(p, k, gid)} onGuestOpen={(p, k, gid) => onRoomGuest(p, k, gid)} />
      )}
    </>
  );
}

function ShareGlyph() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" /><path d="M5 12v6.5A2.5 2.5 0 0 0 7.5 21h9a2.5 2.5 0 0 0 2.5-2.5V12" /></svg>;
}

const BOT_LEVELS = [[1, 'Easy'], [2, 'Medium'], [3, 'Hard']];

const pairMem = new Map();
function usePairCounts(peerId) {
  const [map, setMap] = useState(() => (peerId && pairMem.get(peerId)) || null);
  useEffect(() => {
    if (!peerId) return undefined;
    let alive = true;
    supabase.rpc('zchat_game_pair_counts', { p_peer: peerId }).then(({ data, error }) => {
      if (!alive || error || !data || typeof data !== 'object' || Array.isArray(data)) return;
      pairMem.set(peerId, data);
      setMap(data);
    }, () => {});
    return () => { alive = false; };
  }, [peerId]);
  return map || {};
}
function pairLine(n) { return n ? `Played ${n}` : null; }

export function GamePickerSheet({ profile, onPick, onMore, onClose }) {
  injectHubCss();
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const bot = !!(profile && profile.is_bot);
  const [lv, setLv] = useState(() => ghBotLevel());
  const levels = useMyLevels();
  const pairs = usePairCounts(profile && profile.id);
  const [recent] = useState(() => readRecent());
  const first = String((profile && profile.name) || 'your friend').split(' ')[0];
  const together = Object.keys(pairs).reduce((a, k) => a + ((pairs[k] && pairs[k].n) || 0), 0);
  const all = useMemo(() => duoKeys().filter((k) => !bot || ghBotCan(k)), [bot]);
  const live = bot ? [] : LIVE_KEYS();
  const puzzles = bot ? [] : puzzleKeys();
  const recentDuo = recent.filter((k) => all.includes(k) || live.includes(k) || puzzles.includes(k)).slice(0, 4);
  useWarmScenes(all.slice(0, 6));
  const pick = (k) => { playUiSound('tap'); hapticTap(); unlockAudio(); noteRecent(k); onClose(); onPick(k); };
  const lvOf = (k) => (levels && levels[k] && levels[k].level > 1 ? levels[k].level : null);
  const square = (k, badge) => (
    <div key={k} style={{ minWidth: 0 }}>
      <Tile k={k} title={GAME_TITLES[k]} sub={pairLine(pairs[k] && pairs[k].n)} ratio="1 / 1" small badge={badge || (lvOf(k) ? <LevelBadge level={lvOf(k)} /> : null)} onClick={() => pick(k)} />
    </div>
  );
  return (
    <div {...backdropProps(onClose)} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 94, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.5)' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 480, height: 'min(86vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '26px 26px 0 0', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -10px 40px rgba(0,0,0,0.3)' }}>
        <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px' }}>
            <Avatar emoji={profile.avatar} name={profile.name} size={44} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 850, fontSize: 18, letterSpacing: '-0.01em', color: theme.ink }}>{bot ? 'Play ZChat Bot' : `Play with ${first}`}</div>
              <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bot ? 'Pick how hard, then a game' : together ? `You played ${together} ${together === 1 ? 'game' : 'games'} together` : 'You both play in a full screen game room'}</div>
            </div>
          </div>
          {bot && <div style={{ padding: '0 16px 10px' }}><SegmentedControl value={lv} onChange={(v) => { if (v === lv) return; hapticTap(); setLv(v); try { localStorage.setItem('zchat-bot-level', String(v)); } catch {} }} options={BOT_LEVELS} /></div>}
        </div>
        <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, flex: 1, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '0 16px 16px' }}>
          {recentDuo.length > 0 && (
            <>
              <SectionTitle>Recently played</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>{recentDuo.map((k) => square(k))}</div>
            </>
          )}
          <SectionTitle>{bot ? 'Games' : 'Popular'}</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>{all.map((k) => square(k))}</div>
          {live.length > 0 && (
            <>
              <SectionTitle>Live, at the same time</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>{live.map((k) => square(k, <LiveBadge />))}</div>
            </>
          )}
          {puzzles.length > 0 && (
            <>
              <SectionTitle>Puzzles</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>{puzzles.map((k) => square(k))}</div>
            </>
          )}
          {!bot && (
            <>
              <SectionTitle>Score battle</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                <div style={{ minWidth: 0 }}><Tile k="sd:squish" title="Squish duel" sub={pairLine(pairs['sd:squish'] && pairs['sd:squish'].n) || 'Same blobs'} ratio="1 / 1" small onClick={() => pick('sd:squish')} /></div>
              </div>
            </>
          )}
          {onMore && (
            <div role="button" aria-label="All games" onClick={() => { playUiSound('tap'); onClose(); onMore(); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, padding: '13px 12px', borderRadius: 16, background: theme.rowBg, color: theme.ink, fontSize: 14.5, fontWeight: 800, cursor: 'pointer' }}>
              <GamepadIcon size={18} color={theme.ink} />Solo games and leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const lbMem = new Map();
function boardKeys() {
  const out = ['all'];
  const add = (k) => { if (!out.includes(k) && GAME_TITLES[k] && !NO_BOARD.includes(k)) out.push(k); };
  duoKeys().forEach(add);
  LIVE_GAME_KEYS.forEach(add);
  soloKeys().forEach(add);
  return out;
}
function boardValue(k, v) {
  if (k !== 'all' && isSoloGameKey(k)) return formatGameScore(k, v);
  return `${v} ${v === 1 ? 'win' : 'wins'}`;
}
const MEDAL = ['#F5C443', '#C9D2DC', '#D69A62'];

function Podium({ rows, game, levels, onOpen }) {
  const order = [rows[1], rows[0], rows[2]];
  const places = [2, 1, 3];
  const scene = game === 'all' ? 'arena' : sceneKeyFor(game);
  return (
    <div style={{ position: 'relative', borderRadius: 26, overflow: 'hidden', margin: '14px 0 12px', backgroundColor: '#13111B', backgroundImage: `url("${sceneUrl(scene)}")`, backgroundSize: 'cover', backgroundPosition: BANNER_POS[scene] || 'center', boxShadow: '0 14px 30px rgba(20,10,40,0.28)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(8,6,14,0.35) 0%, rgba(8,6,14,0.7) 100%)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 6, padding: '18px 10px 0' }}>
        {order.map((r, i) => {
          const place = places[i];
          const size = place === 1 ? 78 : 60;
          const tappable = r && !r.hidden && r.user_id && onOpen;
          const level = r && levels && r.user_id ? levels.get(r.user_id) : null;
          return (
            <div key={place} role={tappable ? 'button' : undefined} aria-label={r ? `${r.hidden ? 'Hidden player' : r.name}, place ${place}` : undefined} onClick={tappable ? () => onOpen(r) : undefined}
              style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: tappable ? 'pointer' : 'default' }}>
              <div style={{ height: 24, display: 'flex', alignItems: 'flex-end' }}>{place === 1 && r && <CrownIcon size={26} color="#F5C443" />}</div>
              <div style={{ position: 'relative', borderRadius: '50%', boxShadow: r ? `0 0 0 3px ${MEDAL[place - 1]}, 0 8px 18px rgba(0,0,0,0.4)` : 'none' }}>
                {r ? (r.hidden ? <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} /> : <Avatar emoji={r.avatar} name={r.name} size={size} />) : <div style={{ width: size, height: size, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.35)' }} />}
                {level ? <span style={{ position: 'absolute', left: '50%', bottom: -8, transform: 'translateX(-50%)' }}><LevelBadge level={level} /></span> : null}
              </div>
              <div style={{ marginTop: level ? 14 : 10, fontSize: 13.5, fontWeight: 800, color: '#FFFFFF', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 4px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{r ? (r.is_me ? 'You' : r.hidden ? 'Hidden player' : String(r.name || 'Player').split(' ')[0]) : 'Open spot'}</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: place === 1 ? '#F5C443' : 'rgba(255,255,255,0.8)', marginTop: 1, minHeight: 16 }}>{r ? boardValue(game, r.value) : ''}</div>
              <div aria-hidden="true" style={{ width: '90%', height: place === 1 ? 64 : place === 2 ? 44 : 32, marginTop: 10, borderRadius: '14px 14px 0 0', background: `linear-gradient(180deg, ${MEDAL[place - 1]} 0%, ${MEDAL[place - 1]}CC 100%)`, boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6 }}>
                <span style={{ fontSize: place === 1 ? 24 : 19, fontWeight: 900, color: 'rgba(40,26,6,0.72)' }}>{place}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BoardRow({ r, game, level, onOpen, pinned }) {
  const { theme } = useTheme();
  const tappable = !r.hidden && r.user_id && onOpen && !pinned;
  return (
    <div role={tappable ? 'button' : undefined} aria-label={`${r.hidden ? 'Hidden player' : r.name}, rank ${r.rank}`} onClick={tappable ? () => onOpen(r) : undefined} className={tappable ? 'zchat-row-press' : undefined}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 16, cursor: tappable ? 'pointer' : 'default', background: r.is_me && !pinned ? (theme.dark ? 'rgba(245,196,67,0.12)' : 'rgba(245,196,67,0.16)') : 'transparent' }}>
      <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 900, color: theme.muted, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{r.rank}</div>
      {r.hidden ? <div style={{ width: 42, height: 42, borderRadius: '50%', background: theme.rowBg, flexShrink: 0 }} /> : <Avatar emoji={r.avatar} name={r.name} size={42} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 750, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{r.hidden ? 'Hidden player' : <NameBadge name={r.is_me ? 'You' : r.name} verified={r.verified} custom={r.custom_badge} size={12} />}</span>
          {level ? <LevelBadge level={level} /> : null}
        </div>
        {!r.hidden && r.username && !r.is_me && <div style={{ fontSize: 12, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{r.username}</div>}
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 900, color: theme.ink, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{boardValue(game, r.value)}</div>
    </div>
  );
}

export function LeaderboardPage({ initialGame, onClose, onOpenProfile, onOpenPrivacy, onPlay }) {
  injectHubCss();
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const keys = useMemo(() => boardKeys(), []);
  const [game, setGame] = useState(() => (keys.includes(initialGame) ? initialGame : 'all'));
  const [scope, setScopeRaw] = useState(() => { try { return localStorage.getItem('zchat-lb-scope') === 'everyone' ? 'everyone' : 'friends'; } catch { return 'friends'; } });
  const memKey = `${game}|${scope}`;
  const [rows, setRows] = useState(() => lbMem.get(memKey) || null);
  const [failed, setFailed] = useState('');
  const [round, setRound] = useState(0);
  const reqRef = useRef(0);
  const stripRef = useRef(null);
  const setScope = (v) => { if (v === scope) return; hapticTap(); setScopeRaw(v); try { localStorage.setItem('zchat-lb-scope', v); } catch {} };
  useEffect(() => {
    const my = ++reqRef.current;
    const cached = lbMem.get(memKey);
    setRows(cached || null);
    setFailed('');
    if (gameNet.missing) { setFailed('missing'); setRows([]); return; }
    (async () => {
      try {
        const { data, error } = await supabase.rpc('zchat_leaderboard', { p_game: game, p_scope: scope, p_period: 'all', p_limit: 50 });
        if (my !== reqRef.current) return;
        if (error) { if (gameNetMissing(error)) gameNet.missing = true; setFailed(gameNetMissing(error) ? 'missing' : 'error'); if (!cached) setRows([]); return; }
        const list = (Array.isArray(data) ? data : []).filter((r) => r && r.value > 0);
        lbMem.set(memKey, list);
        setRows(list);
      } catch { if (my === reqRef.current) { setFailed('error'); if (!cached) setRows([]); } }
    })();
  }, [game, scope, round]);
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip && strip.querySelector('[aria-selected="true"]');
    if (el) { try { el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch {} }
  }, [game]);
  const list = rows || [];
  const ids = useMemo(() => list.filter((r) => r.user_id && !r.hidden).map((r) => r.user_id).slice(0, 60), [rows]);
  const levels = useLevels(LEVEL_GAMES.includes(game) ? game : null, ids);
  const myLevels = useMyLevels();
  const me = list.find((r) => r.is_me);
  const top = list.slice(0, 3);
  const tail = list.slice(3);
  const gapAt = me && tail.length > 1 && tail[tail.length - 1] === me && me.rank > tail[tail.length - 2].rank + 1 ? me : null;
  const rest = gapAt ? tail.slice(0, -1) : tail;
  const open = (r) => { if (onOpenProfile && r && r.user_id) onOpenProfile(r.user_id); };
  const title = game === 'all' ? 'All games' : GAME_TITLES[game];
  const myLevel = LEVEL_GAMES.includes(game) && myLevels && myLevels[game] ? myLevels[game].level : null;
  const footer = rows === null || failed === 'missing' ? null : me ? (
    <BoardRow r={me} game={game} level={myLevel || (levels && levels.get(me.user_id))} pinned />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: theme.muted }}>{game === 'all' ? 'Win a game to get on the board' : isSoloGameKey(game) ? 'Play to set your first score' : 'Win a game to get on the board'}</div>
      {onPlay && game !== 'all' && <GameButton small color="green" label="Play" onClick={() => onPlay(game)} />}
    </div>
  );
  return (
    <FullPage title="Leaderboard" subtitle={title} onBack={onClose} zIndex={66} pad={false} footer={footer}>
      <div ref={stripRef} className="zgh-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '8px 16px 4px', scrollSnapType: 'none' }}>
        {keys.map((k) => {
          const on = k === game;
          return (
            <div key={k} role="tab" aria-selected={on} aria-label={k === 'all' ? 'All games' : GAME_TITLES[k]} onClick={() => { if (!on) { hapticTap(); playUiSound('tap'); setGame(k); } }} className="zgh-tile"
              style={{ width: 66, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, overflow: 'hidden', boxShadow: on ? `0 0 0 3px ${theme.panelBg}, 0 0 0 5.5px ${theme.coral}` : '0 4px 10px rgba(20,10,40,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1D1A2E', transition: 'box-shadow .15s ease' }}>
                {k === 'all' ? <TrophyIcon size={30} color="#F5C443" /> : <GameArt k={k} width={60} height={60} radius={0} />}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: on ? 850 : 650, color: on ? theme.ink : theme.muted, maxWidth: 66, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k === 'all' ? 'All games' : GAME_TITLES[k]}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '10px 16px 0' }}>
        <SegmentedControl value={scope} onChange={setScope} options={[['friends', 'Friends'], ['everyone', 'Everyone']]} />
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        {rows === null && (
          <div aria-hidden="true" style={{ padding: '14px 4px' }}>
            <div style={{ height: 210, borderRadius: 26, background: theme.rowBg }} />
            {[0, 1, 2, 3].map((i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px' }}><div style={{ width: 42, height: 42, borderRadius: '50%', background: theme.rowBg }} /><div style={{ flex: 1, height: 12, borderRadius: 6, background: theme.rowBg }} /></div>)}
          </div>
        )}
        {rows !== null && failed === 'missing' && (
          <div style={{ padding: '30px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>Leaderboards are almost ready</div>
            <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>They switch on once the latest ZChat setup is finished.</div>
          </div>
        )}
        {rows !== null && failed === 'error' && !list.length && <div style={{ padding: '24px 0' }}><LoadFail onRetry={() => setRound((x) => x + 1)} /></div>}
        {rows !== null && !failed && !list.length && (
          <div style={{ padding: '30px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: theme.ink }}>Nobody here yet</div>
            <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6 }}>{scope === 'friends' ? 'Be the first of your friends on this board.' : 'Be the first on this board.'}</div>
          </div>
        )}
        {list.length > 0 && failed !== 'missing' && (
          <>
            <Podium rows={top} game={game} levels={levels} onOpen={open} />
            {rest.map((r, i) => (
              <React.Fragment key={`${r.rank}-${r.user_id || i}`}>
                <BoardRow r={r} game={game} level={levels ? levels.get(r.user_id) : null} onOpen={open} />
              </React.Fragment>
            ))}
          </>
        )}
        {onOpenPrivacy && rows !== null && failed !== 'missing' && (
          <div style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.5, padding: '16px 10px 4px', textAlign: 'center' }}>
            People who are not allowed to see you get Hidden player instead of your name.{' '}
            <span role="button" aria-label="Who can see me on leaderboards" onClick={onOpenPrivacy} style={{ color: theme.coral, fontWeight: 800, cursor: 'pointer' }}>Choose who sees you</span>
          </div>
        )}
      </div>
    </FullPage>
  );
}
