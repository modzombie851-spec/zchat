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
  ChoiceList,
  EmptyState,
  FONT,
  FullPage,
  IgRow,
  LineGlyph,
  LoadFail,
  MapPin,
  MapPinIcon,
  MediaImg,
  NameBadge,
  PillButton,
  Spinner,
  StoryAvatar,
  TOOL_RAW_ERRORS,
  VideoThumb,
  ZMAP_PALETTE,
  countWord,
  fetchProfilesView,
  hapticTap,
  hideBroken,
  isActiveUntil,
  loadFailCode,
  loadMapLib,
  mapDistText,
  metersBetween,
  pushMapLocation,
  readMapShare,
  readMyPos,
  reducedMotion,
  rpcMissing,
  sanitizeAvatarList,
  useBackClose,
  useTheme,
  validPlace,
  writeMyPos,
  zchatMapStyle,
  zchatTools,
  zmapLib,
} from '../App.jsx';

function useMapLib() {
  const [state, setState] = useState(() => (zmapLib.mod ? 'ready' : 'loading'));
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (zmapLib.mod) { setState('ready'); return undefined; }
    let alive = true;
    setState('loading');
    loadMapLib().then(() => { if (alive) setState('ready'); }, () => { if (alive) setState('failed'); });
    return () => { alive = false; };
  }, [tries]);
  return [state, () => setTries((n) => n + 1)];
}
function GhostIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2z" /><path d="M9.5 10.5h.01M14.5 10.5h.01" />
    </svg>
  );
}
function LocateIcon({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" fill={color} /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
function writeMapShare(uid, v) { try { localStorage.setItem(`zchat-map-share-${uid}`, v); } catch {} }
function mapAgoShort(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 2) return 'now';
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h` : `${Math.round(h / 24)} d`;
}
function readMapView(uid) {
  try { const v = JSON.parse(localStorage.getItem(`zchat-map-view-${uid}`) || 'null'); return v && Number.isFinite(v.lat) && Number.isFinite(v.lng) && Number.isFinite(v.zoom) ? v : null; } catch { return null; }
}
function MapCluster({ rows, label }) {
  return (
    <div className="zmap-pin zmap-cluster">
      <div className="zmap-cap">
        {rows.slice(0, 2).map((r) => <span key={r.user_id} className="zmap-face"><Avatar emoji={r.profile.avatar} name={r.profile.name} size={44} /></span>)}
        <span className="zmap-cnt">{rows.length}</span>
      </div>
      <div className="zmap-tail" />
      <div className="zmap-label">{label}</div>
    </div>
  );
}
function MapMeDot({ ghost }) {
  return (
    <div className={`zmap-me${ghost ? ' ghost' : ''}`} aria-label={ghost ? 'You, hidden from friends' : 'You'}>
      {!ghost && <span className="zmap-halo" />}
      {!ghost && <span className="zmap-ring" />}
      <span className="zmap-dot">{ghost ? <GhostIcon size={12} color="#FFFFFF" /> : null}</span>
    </div>
  );
}
function MapCompassIcon({ bearing, dark }) {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform: `rotate(${-bearing}deg)`, transition: 'transform 0.2s ease' }} aria-hidden="true">
      <path d="M13 2.5 16.6 13H9.4z" fill="#F0484E" /><path d="M13 23.5 9.4 13h7.2z" fill={dark ? '#9E97B3' : '#B9B8C2'} /><circle cx="13" cy="13" r="1.6" fill={dark ? '#14101E' : '#FFFFFF'} />
    </svg>
  );
}
function MapNavIcon({ size = 21, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M20.6 3.4a.9.9 0 0 0-1-.2L3.7 9.9c-.8.3-.7 1.5.1 1.7l6.6 1.9 1.9 6.6c.2.8 1.4.9 1.7.1l6.7-15.9a.9.9 0 0 0-.1-.9z" /></svg>;
}
function MapGlassButton({ label, onClick, children, style, pressed }) {
  return (
    <div role="button" aria-label={label} aria-pressed={pressed} onClick={onClick} className="zchat-press zmap-glass"
      style={{ width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, ...(style || {}) }}>
      {children}
    </div>
  );
}
const ZMAP_SHEET_H = { strip: 236, card: 222, empty: 170 };
export function FriendsMapPage({ myId, me, onClose, onOpenChat, ringFor, closeFor }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const dark = !!theme.dark;
  const [lib, retryLib] = useMapLib();
  const [rows, setRows] = useState(null);
  const [mine, setMine] = useState(() => readMyPos());
  const [share, setShare] = useState(() => readMapShare(myId));
  const [sel, setSel] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [note, setNote] = useState('');
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [locating, setLocating] = useState(false);
  const [cam, setCam] = useState({ bearing: 0, pitch: 0 });
  const [markers, setMarkers] = useState([]);
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(new Map());
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const mineRef = useRef(mine);
  mineRef.current = mine;
  const shareRef = useRef(share);
  shareRef.current = share;
  const selRef = useRef(sel);
  selRef.current = sel;
  const fitted = useRef(!!readMapView(myId));
  useBackClose(!!sheet, () => setSheet(null));
  useBackClose(!!sel, () => setSel(null));
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(`zchat-map-intro-${myId}`) === '1'; } catch {}
    if (!seen && readMapShare(myId) === 'off') setSheet('intro');
  }, []);
  const flash = (t) => { setNote(t); setTimeout(() => setNote((cur) => (cur === t ? '' : cur)), 3200); };
  const load = async () => {
    const since = new Date(Date.now() - 86400000).toISOString();
    const { data, error } = await supabase.from('user_locations').select('user_id, lat, lng, acc, share, updated_at').gt('updated_at', since).limit(500);
    if (error) { setRows([]); if (/user_locations|relation|schema|exist/i.test(String(error.message || ''))) setSetupNeeded(true); return; }
    const list = data || [];
    const mineRow = list.find((r) => r.user_id === myId);
    if (mineRow) {
      if (mineRow.share === 'friends' || mineRow.share === 'close') { setShare(mineRow.share); writeMapShare(myId, mineRow.share); }
      setMine((m) => m || { lat: mineRow.lat, lng: mineRow.lng, acc: mineRow.acc, at: new Date(mineRow.updated_at).getTime() });
    }
    const others = list.filter((r) => r.user_id !== myId && Number.isFinite(r.lat) && Number.isFinite(r.lng));
    if (!others.length) { setRows([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, name, username, avatar, verified, custom_badge, is_deleted').in('id', others.map((r) => r.user_id));
    const byId = {};
    (profs || []).forEach((pr) => { if (!pr.is_deleted) byId[pr.id] = pr; });
    setRows(others.map((r) => ({ ...r, profile: byId[r.user_id] })).filter((r) => r.profile).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
  };
  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
    return () => clearInterval(t);
  }, []);
  const sheetKind = setupNeeded ? 'empty' : sel ? 'card' : rows && rows.length ? 'strip' : 'empty';
  const sheetH = ZMAP_SHEET_H[sheetKind];
  const sheetRef = useRef(sheetH);
  sheetRef.current = sheetH;
  const padding = () => ({ top: 124, bottom: sheetRef.current + 24, left: 36, right: 78 });
  const fitTo = (pts, animate) => {
    const map = mapRef.current;
    if (!map || !pts.length) return;
    if (pts.length === 1) { map.easeTo({ center: [pts[0].lng, pts[0].lat], zoom: 13.5, padding: padding(), duration: animate ? 600 : 0 }); return; }
    const lib = zmapLib.mod;
    const b = new lib.LngLatBounds([pts[0].lng, pts[0].lat], [pts[0].lng, pts[0].lat]);
    pts.forEach((q) => b.extend([q.lng, q.lat]));
    map.fitBounds(b, { padding: padding(), maxZoom: 15, duration: animate ? 600 : 0 });
  };
  const rebuildMarkers = () => {
    const map = mapRef.current;
    const lib = zmapLib.mod;
    if (!map || !lib) return;
    const list = rowsRef.current || [];
    const pts = list.map((r) => { const p = map.project([r.lng, r.lat]); return { r, x: p.x, y: p.y }; });
    const groups = [];
    pts.forEach((q) => {
      const hit = groups.find((g) => Math.hypot(g.x - q.x, g.y - q.y) < 58);
      if (hit) hit.rows.push(q.r); else groups.push({ x: q.x, y: q.y, rows: [q.r] });
    });
    const specs = groups.map((g) => (g.rows.length === 1
      ? { key: `p-${g.rows[0].user_id}`, kind: 'pin', lng: g.rows[0].lng, lat: g.rows[0].lat, rows: g.rows }
      : { key: `c-${g.rows.map((r) => r.user_id).sort().join('.')}`, kind: 'cluster', lng: g.rows[0].lng, lat: g.rows[0].lat, rows: g.rows }));
    const mp = mineRef.current;
    if (mp) specs.push({ key: 'me', kind: 'me', lng: mp.lng, lat: mp.lat, rows: [] });
    const keep = new Set(specs.map((s) => s.key));
    markerRef.current.forEach((entry, key) => { if (!keep.has(key)) { try { entry.marker.remove(); } catch {} markerRef.current.delete(key); } });
    specs.forEach((s) => {
      const cur = markerRef.current.get(s.key);
      if (cur) { cur.marker.setLngLat([s.lng, s.lat]); cur.spec = s; return; }
      const el = document.createElement('div');
      el.className = 'zmap-mk';
      el.style.zIndex = s.kind === 'me' ? '3' : '2';
      const marker = new lib.Marker({ element: el, anchor: s.kind === 'me' ? 'center' : 'bottom' }).setLngLat([s.lng, s.lat]).addTo(map);
      markerRef.current.set(s.key, { marker, el, spec: s });
    });
    setMarkers(Array.from(markerRef.current.values()).map((e) => ({ key: e.spec.key, el: e.el, spec: e.spec })));
  };
  useEffect(() => {
    if (lib !== 'ready' || !boxRef.current || mapRef.current) return undefined;
    const L = zmapLib.mod;
    const saved = readMapView(myId);
    const map = new L.Map({
      container: boxRef.current, style: zchatMapStyle(dark),
      center: saved ? [saved.lng, saved.lat] : [15, 20], zoom: saved ? saved.zoom : 1.6, pitch: saved && saved.pitch ? saved.pitch : 0, bearing: saved && saved.bearing ? saved.bearing : 0,
      attributionControl: false, fadeDuration: 180, maxPitch: 65, pitchWithRotate: false, dragRotate: true, touchPitch: true, canvasContextAttributes: { antialias: true },
    });
    mapRef.current = map;
    map.on('error', () => {});
    map.on('moveend', rebuildMarkers);
    map.on('zoomend', rebuildMarkers);
    const onCam = () => setCam((c) => { const b = Math.round(map.getBearing()); const p = Math.round(map.getPitch()); return c.bearing === b && c.pitch === p ? c : { bearing: b, pitch: p }; });
    map.on('rotate', onCam);
    map.on('pitch', onCam);
    map.on('moveend', onCam);
    map.on('click', (e) => { const t = e.originalEvent && e.originalEvent.target; if (t && t.closest && t.closest('.zmap-mk')) return; setSel(null); });
    map.once('load', () => { rebuildMarkers(); onCam(); });
    return () => {
      try { const c = map.getCenter(); localStorage.setItem(`zchat-map-view-${myId}`, JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() })); } catch {}
      markerRef.current.forEach((entry) => { try { entry.marker.remove(); } catch {} });
      markerRef.current.clear();
      try { map.remove(); } catch {}
      mapRef.current = null;
    };
  }, [lib]);
  useEffect(() => { const map = mapRef.current; if (!map) return; const apply = () => { try { map.setStyle(zchatMapStyle(dark)); } catch {} }; if (map.loaded()) apply(); else map.once('load', apply); }, [dark]);
  useEffect(() => { if (mapRef.current && mapRef.current.loaded()) rebuildMarkers(); }, [rows, mine]);
  useEffect(() => {
    if (fitted.current || rows === null || !mapRef.current) return;
    const pts = [...rows.map((r) => ({ lat: r.lat, lng: r.lng })), ...(mine ? [mine] : [])];
    if (!pts.length) return;
    fitted.current = true;
    fitTo(pts, false);
  }, [rows, mine, lib]);
  const locate = (modeIn) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) { flash('Location is not available on this device.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async (pp) => {
      setLocating(false);
      const pos = { lat: pp.coords.latitude, lng: pp.coords.longitude, acc: pp.coords.accuracy, at: Date.now() };
      setMine(pos);
      writeMyPos(pos);
      fitted.current = true;
      const map = mapRef.current;
      if (map) map.flyTo({ center: [pos.lng, pos.lat], zoom: Math.max(map.getZoom(), 14), padding: padding(), speed: 1.4, curve: 1.3 });
      const mode = modeIn || readMapShare(myId);
      if (mode !== 'off') {
        const err = await pushMapLocation(myId, pos, mode);
        if (err) { if (/user_locations|relation|schema|exist/i.test(String(err.message || ''))) setSetupNeeded(true); else flash('Your spot did not update. Try again.'); }
      }
    }, () => { setLocating(false); flash('Turn on location for ZChat in your phone settings, then try again.'); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };
  const setMode = async (mode) => {
    try { localStorage.setItem(`zchat-map-intro-${myId}`, '1'); } catch {}
    setSheet(null);
    setShare(mode);
    writeMapShare(myId, mode);
    if (mode === 'off') {
      await supabase.from('user_locations').delete().eq('user_id', myId);
      flash('Ghost mode is on. Friends do not see you.');
      return;
    }
    flash(mode === 'close' ? 'Close friends can see you now.' : 'Friends can see you now.');
    if (mine && Date.now() - (mine.at || 0) < 5 * 60000) {
      const err = await pushMapLocation(myId, mine, mode);
      if (err && /user_locations|relation|schema|exist/i.test(String(err.message || ''))) setSetupNeeded(true);
    } else locate(mode);
  };
  const focus = (r) => {
    setSel(r.user_id);
    const map = mapRef.current;
    if (map) map.flyTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 14.5), padding: { ...padding(), bottom: ZMAP_SHEET_H.card + 24 }, speed: 1.3, curve: 1.2 });
  };
  const zoomCluster = (spec) => {
    const map = mapRef.current;
    if (map) map.flyTo({ center: [spec.lng, spec.lat], zoom: Math.min(18, map.getZoom() + 2.2), padding: padding(), speed: 1.3 });
  };
  const threeD = cam.pitch > 15;
  const toggle3d = () => {
    const map = mapRef.current;
    if (!map) return;
    hapticTap();
    if (threeD) map.easeTo({ pitch: 0, duration: 650 });
    else map.easeTo({ pitch: 58, zoom: Math.max(map.getZoom(), 16), duration: 800 });
  };
  const resetNorth = () => { const map = mapRef.current; if (map) { hapticTap(); map.easeTo({ bearing: 0, duration: 450 }); } };
  const selRow = sel ? (rows || []).find((r) => r.user_id === sel) : null;
  const ink = theme.ink;
  const myDist = (r) => (mine ? metersBetween(mine, { lat: r.lat, lng: r.lng }) : null);
  const pinLabel = (r) => String(r.profile.name || '').split(' ')[0];
  const ring = (id) => (ringFor ? ringFor(id) : 'none');
  const isClose = (id) => !!(closeFor && closeFor(id));
  const land = dark ? ZMAP_PALETTE.dark.land : ZMAP_PALETTE.light.land;
  const page = (
    <div className={`zchat-panel-open ${dark ? 'zmap-dark' : 'zmap-light'}`} style={{ position: 'fixed', inset: 0, zIndex: 75, background: land, fontFamily: FONT, overflow: 'hidden' }}>
      <div ref={boxRef} data-no-swipe="true" style={{ position: 'absolute', inset: 0, touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} />
      {markers.map((mk) => ReactDOM.createPortal(
        mk.spec.kind === 'me'
          ? <MapMeDot ghost={share === 'off'} />
          : mk.spec.kind === 'cluster'
            ? <div role="button" aria-label={`${mk.spec.rows.length} friends here`} onClick={() => zoomCluster(mk.spec)} style={{ cursor: 'pointer' }}><MapCluster rows={mk.spec.rows} label={mk.spec.rows.map(pinLabel).join(', ')} /></div>
            : (() => { const r = mk.spec.rows[0]; return <div role="button" aria-label={`${r.profile.name} on the map`} onClick={() => focus(r)} style={{ cursor: 'pointer' }}><MapPin avatar={r.profile.avatar} name={r.profile.name} ring={ring(r.user_id)} close={isClose(r.user_id)} selected={sel === r.user_id} label={pinLabel(r)} sub={mapAgoShort(r.updated_at)} /></div>; })(),
        mk.el, mk.key,
      ))}
      {lib !== 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: lib === 'failed' ? 'auto' : 'none' }}>
          {lib === 'failed' ? (
            <div style={{ textAlign: 'center', padding: 24, maxWidth: 300 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: ink }}>The map could not load</div>
              <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>Check your connection and try again.</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}><PillButton primary label="Try again" onClick={retryLib} /></div>
            </div>
          ) : <Spinner size={26} color={theme.coral} />}
        </div>
      )}
      <div className={dark ? 'zmap-fade-dark' : 'zmap-fade-light'} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 'calc(96px + env(safe-area-inset-top))', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 14px 0', pointerEvents: 'none' }}>
        <MapGlassButton label="Back" onClick={onClose} style={{ pointerEvents: 'auto' }}><ArrowLeft size={21} /></MapGlassButton>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <div role="button" aria-label="Who can see me" onClick={() => setSheet('settings')} className="zchat-press" style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0, padding: '2px 10px', cursor: 'pointer', color: ink, textShadow: dark ? '0 1px 6px rgba(0,0,0,0.55)' : '0 1px 6px rgba(255,255,255,0.8)' }}>
            <span style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: '-0.015em', lineHeight: 1.2 }}>Friends map</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 12.5, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.78)' : 'rgba(17,17,19,0.68)', minWidth: 0 }}>
              {share === 'off' ? <GhostIcon size={13} /> : <span className={reducedMotion() ? undefined : 'zchat-live-dot'} style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{share === 'off' ? 'Ghost mode' : share === 'close' ? 'Close friends see you' : 'Friends see you'}</span>
              <LineGlyph k="chevdown" size={13} sw={3.4} style={{ opacity: 0.8 }} />
            </span>
          </div>
        </div>
        <MapGlassButton label="Map settings" onClick={() => setSheet('settings')} style={{ pointerEvents: 'auto' }}><SettingsIcon size={20} /></MapGlassButton>
      </div>
      {note && <div role="status" className="zchat-fade" style={{ position: 'absolute', left: 16, right: 16, top: 'calc(66px + env(safe-area-inset-top))', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}><div style={{ padding: '9px 14px', borderRadius: 14, background: dark ? 'rgba(255,255,255,0.94)' : 'rgba(20,20,24,0.9)', color: dark ? '#111111' : '#FFFFFF', fontSize: 13, fontWeight: 600, textAlign: 'center', maxWidth: 360 }}>{note}</div></div>}
      <div style={{ position: 'absolute', right: 14, bottom: sheetH + 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'bottom 0.25s ease', zIndex: 4 }}>
        {cam.bearing !== 0 && <MapGlassButton label="Point north" onClick={resetNorth} style={{ width: 46, height: 46 }}><MapCompassIcon bearing={cam.bearing} dark={dark} /></MapGlassButton>}
        <div className="zmap-glass" style={{ width: 46, borderRadius: 23, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div role="button" aria-label={threeD ? 'Flat map' : '3D map'} aria-pressed={threeD} onClick={toggle3d} className="zchat-press" style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: threeD ? theme.coral : ink, cursor: 'pointer' }}>3D</div>
          <div role="button" aria-label="Find me" onClick={() => locate()} className="zchat-press" style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.coral, cursor: 'pointer', boxShadow: `inset 0 0.5px 0 ${theme.border}` }}>{locating ? <Spinner size={17} color={theme.coral} /> : <MapNavIcon size={21} color={mine ? theme.coral : ink} />}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', background: theme.panelBg, borderRadius: '26px 26px 0 0', boxShadow: '0 -8px 30px rgba(20,14,40,0.14)', padding: '8px 0 calc(12px + env(safe-area-inset-bottom))', minHeight: sheetH, boxSizing: 'border-box', transition: 'min-height 0.25s ease' }}>
          <div style={{ width: 38, height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)', margin: '0 auto 12px' }} />
          {setupNeeded ? (
            <div style={{ padding: '4px 18px 6px', fontSize: 14, color: theme.muted, lineHeight: 1.5, textAlign: 'center' }}>The friends map switches on once the latest ZChat setup is finished.</div>
          ) : selRow ? (
            <div className="zchat-fade" style={{ padding: '0 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <StoryAvatar profile={selRow.profile} size={60} ring={ring(selRow.user_id)} close={isClose(selRow.user_id)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: ink, minWidth: 0, letterSpacing: '-0.02em' }}><NameBadge name={selRow.profile.name} verified={selRow.profile.verified} custom={selRow.profile.custom_badge} size={15} /></div>
                  <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 2 }}>{mapAgoShort(selRow.updated_at) === 'now' ? 'Here right now' : `Here ${mapAgoShort(selRow.updated_at)} ago`}{myDist(selRow) != null ? `, ${mapDistText(myDist(selRow))}` : ''}</div>
                </div>
                <div role="button" aria-label="Close friend card" onClick={() => setSel(null)} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.muted, cursor: 'pointer', flexShrink: 0, alignSelf: 'flex-start' }}><X size={19} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <BigButton label="Chat" onClick={() => onOpenChat(selRow.profile)} style={{ flex: '1 1 0', width: 'auto', minWidth: 0, height: 50, borderRadius: 14 }} />
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selRow.lat},${selRow.lng}`} target="_blank" rel="noopener noreferrer" className="zchat-press" style={{ flex: '1 1 0', minWidth: 0, height: 50, borderRadius: 14, background: theme.dark ? '#2A2A2E' : '#EDEDF0', color: ink, fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>Directions</a>
              </div>
            </div>
          ) : rows && rows.length ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, color: ink, padding: '0 20px 2px', letterSpacing: '-0.02em' }}>{rows.length === 1 ? '1 friend on the map' : `${rows.length} friends on the map`}</div>
              <div role="list" aria-label="Friends on the map" style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '12px 18px 2px', scrollbarWidth: 'none' }}>
                {rows.map((r) => (
                  <div key={r.user_id} role="listitem" aria-label={`Show ${r.profile.name}`} onClick={() => focus(r)} className="zchat-press" style={{ width: 64, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <StoryAvatar profile={r.profile} size={62} ring={ring(r.user_id)} close={isClose(r.user_id)} />
                    <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: ink, maxWidth: 64, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pinLabel(r)}</div>
                    <div style={{ fontSize: 12, color: theme.muted, marginTop: 1 }}>{mapAgoShort(r.updated_at)}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '2px 18px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: ink }}>{rows === null ? 'Finding friends' : 'No friends on the map yet'}</div>
              <div style={{ fontSize: 13.5, color: theme.muted, lineHeight: 1.5, marginTop: 4 }}>Friends who follow you back and share where they are show up here.</div>
              {share === 'off' && rows !== null && <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}><PillButton primary label="Share my location" onClick={() => setSheet('settings')} /></div>}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14, fontSize: 10, color: theme.muted, opacity: 0.8 }}>
            <a href="https://openfreemap.org" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>OpenFreeMap</a>
            <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>{'© OpenMapTiles'}</a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>{'© OpenStreetMap'}</a>
          </div>
        </div>
      </div>
      {sheet && (
        <div onClick={() => setSheet(null)} className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: theme.panelBg, borderRadius: '24px 24px 0 0', padding: '22px 18px calc(18px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: ink, letterSpacing: '-0.01em' }}>{sheet === 'intro' ? 'See your friends on the map' : 'Who can see me'}</div>
            <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, marginTop: 6 }}>Only friends who follow you back can see you. Your spot updates while ZChat is open and disappears after 24 hours.</div>
            <ChoiceList label="Who can see me" style={{ marginTop: 12 }} value={sheet !== 'intro' ? share : null} onChange={setMode}
              options={[['friends', 'My friends', 'Everyone who follows you back', <LineGlyph k="friends" size={24} />], ['close', 'Close friends', 'Only people on your close friends list', <LineGlyph k="heart" size={23} />], ['off', 'Ghost mode', 'Nobody sees you on the map', <GhostIcon size={22} />]].map(([k, t, d, ic]) => ({ k, label: t, sub: d, icon: ic }))} />
          </div>
        </div>
      )}
    </div>
  );
  return ReactDOM.createPortal(page, document.body);
}
async function storiesFn(action, payload, timeoutMs = 12000) {
  let token = '';
  try { const { data } = await supabase.auth.getSession(); token = (data && data.session && data.session.access_token) || ''; } catch {}
  if (!token) return { error: 'Please log in again.', status: 401 };
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  try {
    const res = await fetch('/.netlify/functions/zchat-stories', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...(payload || {}), action }), signal: ctrl ? ctrl.signal : undefined });
    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: json && typeof json.error === 'string' && !TOOL_RAW_ERRORS.has(json.error) ? json.error : '', status: res.status };
    return { data: json || {}, status: res.status };
  } catch { return { error: '', status: 0 }; } finally { clearTimeout(timer); }
}
const PLACE_GLYPH = { cafe: 'coffee', food: 'food', school: 'study', beach: 'sun', park: 'nature', event: 'party', sight: 'cam', stay: 'sleep', night: 'music', shop: 'gift', area: 'globe' };
function PlaceGlyph({ k, size = 22 }) {
  const g = PLACE_GLYPH[k];
  return g ? <LineGlyph k={g} size={size} /> : <MapPinIcon size={size - 2} />;
}
function readRecentPlaces(uid) {
  try { const a = JSON.parse(localStorage.getItem(`zchat-places-${uid}`) || '[]'); return Array.isArray(a) ? a.map(validPlace).filter(Boolean).slice(0, 8) : []; } catch { return []; }
}
function pushRecentPlace(uid, p) {
  try { const list = [p, ...readRecentPlaces(uid).filter((x) => !(x.n === p.n && Math.abs(x.lat - p.lat) < 0.0005 && Math.abs(x.lng - p.lng) < 0.0005))].slice(0, 8); localStorage.setItem(`zchat-places-${uid}`, JSON.stringify(list)); } catch {}
}
const placeNearMem = { key: '', list: null, area: undefined };
function placeDistText(d) {
  if (!Number.isFinite(d)) return '';
  return d < 1 ? `${Math.max(10, Math.round((d * 1000) / 10) * 10)} m` : `${d < 10 ? d.toFixed(1) : Math.round(d)} km`;
}
function PlaceRow({ p, sub, onPick }) {
  const { theme } = useTheme();
  const line = [p.a, Number.isFinite(p.d) ? placeDistText(p.d) : ''].filter(Boolean).join(', ');
  return (
    <div role="button" aria-label={`Pick ${p.n}`} onClick={() => onPick(p)} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 14, minHeight: 56, padding: '6px 4px', cursor: 'pointer' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PlaceGlyph k={p.k} size={22} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.n}</div>
        {(sub || line) && <div style={{ fontSize: 12.5, color: theme.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub || line}</div>}
      </div>
    </div>
  );
}
export function PlacePicker({ uid, onClose, onPick }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [q, setQ] = useState('');
  const [pos, setPos] = useState(() => readMyPos());
  const [near, setNear] = useState(() => (placeNearMem.list && pos && placeNearMem.key === `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}` ? placeNearMem.list : null));
  const [found, setFound] = useState(null);
  const [area, setArea] = useState(() => placeNearMem.area || null);
  const [pinOpen, setPinOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');
  const [tick, setTick] = useState(0);
  const recent = useMemo(() => readRecentPlaces(uid), [uid]);
  const geoOk = typeof navigator !== 'undefined' && !!navigator.geolocation;
  const pick = (p) => { const pl = validPlace(p); if (!pl) return; pushRecentPlace(uid, pl); onPick(pl); };
  useEffect(() => {
    if (placeNearMem.area !== undefined) return undefined;
    let alive = true;
    (async () => {
      const g = await zchatTools('whereami', {}, 6000);
      const city = g && g.data && g.data.city;
      if (!city) { placeNearMem.area = null; return; }
      const label = [city, g.data.country].filter(Boolean).join(', ');
      const r = await storiesFn('places', { q: label }, 8000);
      const hit = r.data && Array.isArray(r.data.items) ? r.data.items.find((x) => x.k === 'area') || r.data.items[0] : null;
      const a = hit ? validPlace({ n: city, a: g.data.country || '', k: 'area', lat: hit.lat, lng: hit.lng }) : null;
      placeNearMem.area = a;
      if (alive) setArea(a);
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!pos) return undefined;
    const key = `${pos.lat.toFixed(3)},${pos.lng.toFixed(3)}`;
    if (placeNearMem.key === key && placeNearMem.list) { setNear(placeNearMem.list); return undefined; }
    let alive = true;
    storiesFn('places', { lat: pos.lat, lng: pos.lng }, 12000).then((r) => {
      if (!alive) return;
      const list = r.data && Array.isArray(r.data.items) ? r.data.items.map((x) => ({ ...validPlace(x), d: Number(x.d) })).filter((x) => x.n) : [];
      if (r.data) { placeNearMem.key = key; placeNearMem.list = list; }
      else if (r.error) setNote(r.error);
      setNear(r.data ? list : false);
    });
    return () => { alive = false; };
  }, [pos && pos.lat, pos && pos.lng, tick]);
  useEffect(() => {
    if (!geoOk || pos || !navigator.permissions || !navigator.permissions.query) return;
    navigator.permissions.query({ name: 'geolocation' }).then((st) => { if (st && st.state === 'granted') locate(); }, () => {});
  }, []);
  const term = q.trim();
  useEffect(() => {
    if (term.length < 2) { setFound(null); return undefined; }
    let alive = true;
    const t = setTimeout(() => {
      storiesFn('places', { q: term, ...(pos ? { lat: pos.lat, lng: pos.lng } : area ? { lat: area.lat, lng: area.lng } : {}) }, 9000).then((r) => {
        if (!alive) return;
        setFound(r.data && Array.isArray(r.data.items) ? r.data.items.map((x) => ({ ...validPlace(x), d: Number(x.d) })).filter((x) => x.n) : r.data ? [] : false);
        if (!r.data && r.error) setNote(r.error);
      });
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [term, tick]);
  const locate = () => {
    if (!geoOk || locating) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition((pp) => {
      setLocating(false);
      const p = { lat: pp.coords.latitude, lng: pp.coords.longitude, acc: pp.coords.accuracy, at: Date.now() };
      writeMyPos(p);
      setPos(p);
    }, () => { setLocating(false); setNote('Turn on location for ZChat to see places near you. You can still search or drop a pin.'); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
  };
  const heading = (t) => <div style={{ fontSize: 13, fontWeight: 700, color: theme.muted, padding: '16px 4px 4px' }}>{t}</div>;
  return (
    <FullPage title="Add a place" onBack={onClose} zIndex={760}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '6px 0 4px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value.slice(0, 80))} placeholder="Search cafes, beaches, schools" aria-label="Search places" enterKeyHint="search" autoComplete="off"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15.5 }} />
        {q && <span role="button" aria-label="Clear search" onClick={() => setQ('')} style={{ display: 'flex', cursor: 'pointer', color: theme.muted }}><X size={17} /></span>}
      </label>
      {note && <div role="status" style={{ fontSize: 12.5, color: theme.muted, lineHeight: 1.45, padding: '8px 4px 0' }}>{note}</div>}
      {term.length >= 2 ? (
        found === null ? <div style={{ display: 'flex', justifyContent: 'center', padding: 28 }}><Spinner size={18} color={theme.muted} /></div>
          : found === false ? <LoadFail small onRetry={() => { setFound(null); setTick((n) => n + 1); }} />
          : found.length ? found.map((p) => <PlaceRow key={`${p.n}-${p.lat}-${p.lng}`} p={p} onPick={pick} />)
          : <EmptyState art="search" title="No places found" text="Try another name, or drop a pin on the map." action={<PillButton label="Drop a pin" onClick={() => setPinOpen(true)} />} />
      ) : (
        <>
          <IgRow inset={false} icon={<MapPinIcon />} label="Drop a pin" sub="Pick a spot on the map" onClick={() => setPinOpen(true)} />
          {area && <PlaceRow p={area} sub={`Your area, ${area.a || 'nearby'}`} onPick={pick} />}
          {!pos && geoOk && <IgRow inset={false} icon={<LocateIcon />} label={locating ? 'Finding you' : 'Places near me'} sub="Uses your location once, it is not shared" onClick={locate} right={locating ? <Spinner size={16} color={theme.muted} /> : null} />}
          {pos && heading('Near you')}
          {pos && near === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner size={18} color={theme.muted} /></div>}
          {pos && near === false && <LoadFail small onRetry={() => { setNear(null); setTick((n) => n + 1); }} />}
          {pos && near && !near.length && <div style={{ fontSize: 13.5, color: theme.muted, padding: '6px 4px' }}>No places found nearby. Search, or drop a pin.</div>}
          {(near || []).slice(0, 20).map((p) => <PlaceRow key={`n-${p.n}-${p.lat}`} p={p} onPick={pick} />)}
          {recent.length > 0 && heading('Recent')}
          {recent.map((p) => <PlaceRow key={`r-${p.n}-${p.lat}`} p={p} onPick={pick} />)}
        </>
      )}
      <div style={{ fontSize: 11.5, color: theme.muted, opacity: 0.85, padding: '18px 4px 4px', lineHeight: 1.5 }}>Places come from OpenStreetMap. People only see the place you pick, never where you are.</div>
      {pinOpen && <PlacePinMap start={pos || area} onClose={() => setPinOpen(false)} onPick={(p) => { setPinOpen(false); pick(p); }} />}
    </FullPage>
  );
}
function PlacePinMap({ start, onClose, onPick }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [lib, retryLib] = useMapLib();
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (lib !== 'ready' || !boxRef.current || mapRef.current) return undefined;
    const L = zmapLib.mod;
    const map = new L.Map({ container: boxRef.current, style: zchatMapStyle(!!theme.dark), center: start ? [start.lng, start.lat] : [15, 20], zoom: start ? 15 : 1.8, attributionControl: false, fadeDuration: 150, pitchWithRotate: false, dragRotate: false });
    map.on('error', () => {});
    mapRef.current = map;
    return () => { try { map.remove(); } catch {} mapRef.current = null; };
  }, [lib]);
  const use = async () => {
    const map = mapRef.current;
    if (!map || busy) return;
    const c = map.getCenter();
    setBusy(true);
    const r = await storiesFn('revgeo', { lat: c.lat, lng: c.lng }, 8000);
    setBusy(false);
    const first = r.data && Array.isArray(r.data.items) ? r.data.items[0] : null;
    onPick({ n: (first && first.n) || 'Pinned spot', a: (first && first.a) || '', k: 'pin', lat: c.lat, lng: c.lng });
  };
  const land = theme.dark ? ZMAP_PALETTE.dark.land : ZMAP_PALETTE.light.land;
  return ReactDOM.createPortal(
    <div className={`zchat-panel-open ${theme.dark ? 'zmap-dark' : 'zmap-light'}`} style={{ position: 'fixed', inset: 0, zIndex: 800, background: land, fontFamily: FONT, overflow: 'hidden' }}>
      <div ref={boxRef} data-no-swipe="true" style={{ position: 'absolute', inset: 0, touchAction: 'none' }} />
      {lib !== 'ready' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {lib === 'failed' ? <PillButton primary label="Try again" onClick={retryLib} /> : <Spinner size={24} color={theme.coral} />}
        </div>
      )}
      <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', pointerEvents: 'none' }}>
        <div className="zmap-pin small"><div className="zmap-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 16, height: 16, borderRadius: '50%', background: '#7C5CFC' }} /></div><div className="zmap-tail" /></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', alignItems: 'center', gap: 10, padding: 'calc(10px + env(safe-area-inset-top)) 14px 0' }}>
        <MapGlassButton label="Back" onClick={onClose}><ArrowLeft size={21} /></MapGlassButton>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16.5, fontWeight: 800, color: theme.ink, textShadow: theme.dark ? '0 1px 6px rgba(0,0,0,0.55)' : '0 1px 6px rgba(255,255,255,0.8)' }}>Drop a pin</div>
        <div style={{ width: 44 }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', background: theme.panelBg, borderRadius: '22px 22px 0 0', boxShadow: '0 -8px 30px rgba(20,14,40,0.14)' }}>
        <div style={{ fontSize: 13.5, color: theme.muted, textAlign: 'center', marginBottom: 12 }}>Move the map until the pin sits on the spot</div>
        <BigButton label={busy ? 'Finding the name' : 'Use this spot'} onClick={use} disabled={busy || lib !== 'ready'} />
      </div>
    </div>,
    document.body,
  );
}
const placeFeedMem = new Map();
export function PlacePage({ uid, place, onClose, onOpenStory, onOpenPost }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const dark = !!theme.dark;
  const key = `${place.lat.toFixed(4)},${place.lng.toFixed(4)}:${place.k === 'area' ? 'a' : 'p'}`;
  const [feed, setFeed] = useState(() => placeFeedMem.get(key) || null);
  const [fail, setFail] = useState(null);
  const [tick, setTick] = useState(0);
  const [lib] = useMapLib();
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc('zchat_place_feed', { p_lat: place.lat, p_lng: place.lng, p_km: place.k === 'area' ? 3 : 0.4 }).then((r) => r, (e) => ({ data: null, error: e || {} }));
      if (!alive) return;
      if (error ? !rpcMissing(error) : !data) { setFail(loadFailCode(error)); return; }
      if (error || !data) { setFeed((cur) => cur || { posts: [], stories: [], profiles: {}, off: rpcMissing(error) }); return; }
      setFail(null);
      const posts = (Array.isArray(data.posts) ? data.posts : []).filter((x) => x && x.id);
      const stories = (Array.isArray(data.stories) ? data.stories : []).filter((x) => x && x.id && isActiveUntil(x.expires_at));
      const ids = [...new Set([...posts, ...stories].map((x) => x.user_id))];
      const profiles = {};
      if (ids.length) { const pr = await fetchProfilesView(ids); (pr && pr.data ? sanitizeAvatarList(pr.data, uid) : []).forEach((p) => { profiles[p.id] = p; }); }
      if (!alive) return;
      const next = { posts: posts.filter((x) => profiles[x.user_id]), stories: stories.filter((x) => profiles[x.user_id]), profiles };
      placeFeedMem.set(key, next);
      if (placeFeedMem.size > 20) placeFeedMem.delete(placeFeedMem.keys().next().value);
      setFeed(next);
    })();
    return () => { alive = false; };
  }, [key, tick]);
  const [mapGo, setMapGo] = useState(false);
  useEffect(() => {
    if (feed) { const t = setTimeout(() => setMapGo(true), 60); return () => clearTimeout(t); }
    const t = setTimeout(() => setMapGo(true), 2500);
    return () => clearTimeout(t);
  }, [!!feed]);
  useEffect(() => {
    if (lib !== 'ready' || !mapGo || !boxRef.current || mapRef.current) return undefined;
    const L = zmapLib.mod;
    const map = new L.Map({ container: boxRef.current, style: zchatMapStyle(dark), center: [place.lng, place.lat], zoom: place.k === 'area' ? 11.5 : 15.2, attributionControl: false, fadeDuration: 150, pitchWithRotate: false });
    map.on('error', () => {});
    const el = document.createElement('div');
    el.innerHTML = '<div class="zmap-pin small"><div class="zmap-head" style="display:flex;align-items:center;justify-content:center"><span style="width:16px;height:16px;border-radius:50%;background:#7C5CFC"></span></div><div class="zmap-tail"></div></div>';
    new L.Marker({ element: el, anchor: 'bottom' }).setLngLat([place.lng, place.lat]).addTo(map);
    mapRef.current = map;
    return () => { try { map.remove(); } catch {} mapRef.current = null; };
  }, [lib, mapGo]);
  const items = feed ? [...feed.stories.map((x) => ({ ...x, isStory: true })), ...feed.posts] : [];
  const nStories = feed ? feed.stories.length : 0;
  const nPosts = feed ? feed.posts.length : 0;
  const summary = !feed ? '' : !items.length ? 'Nothing here yet from people you follow' : [nPosts ? countWord(nPosts, 'post', 'posts') : '', nStories ? countWord(nStories, 'story', 'stories') : ''].filter(Boolean).join(' and ') + ' from people you follow';
  const land = dark ? ZMAP_PALETTE.dark.land : ZMAP_PALETTE.light.land;
  return ReactDOM.createPortal(
    <div className={`zchat-panel-open ${dark ? 'zmap-dark' : 'zmap-light'}`} style={{ position: 'fixed', inset: 0, zIndex: 700, background: theme.panelBg, fontFamily: FONT, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: '42%', minHeight: 220, flexShrink: 0, background: land }}>
        <div ref={boxRef} data-no-swipe="true" style={{ position: 'absolute', inset: 0, touchAction: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', alignItems: 'center', padding: 'calc(10px + env(safe-area-inset-top)) 14px 0' }}>
          <MapGlassButton label="Back" onClick={onClose}><ArrowLeft size={21} /></MapGlassButton>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginTop: -22, background: theme.panelBg, borderRadius: '22px 22px 0 0', position: 'relative', padding: '18px 16px calc(24px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 13, background: theme.soft, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><PlaceGlyph k={place.k} size={24} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, color: theme.ink, letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.n}</div>
            {place.a && <div style={{ fontSize: 13.5, color: theme.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.a}</div>}
          </div>
          <a href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer" className="zchat-press" style={{ height: 36, padding: '0 14px', borderRadius: 10, background: theme.soft, color: theme.ink, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>Directions</a>
        </div>
        <div style={{ fontSize: 13, color: theme.muted, margin: '14px 2px 10px' }}>{feed ? summary : fail !== null ? '' : 'Looking for posts and stories here'}</div>
        {!feed && (fail !== null ? <LoadFail code={fail} onRetry={() => { setFail(null); setTick((n) => n + 1); }} /> : <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={20} color={theme.muted} /></div>)}
        {feed && !items.length && <EmptyState art="discover" title="Be the first here" text="When people you follow tag this place in a post or a story, it shows up here." />}
        {items.length > 0 && (
          <div role="list" aria-label={`Posts and stories at ${place.n}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, margin: '0 -4px' }}>
            {items.map((it) => {
              const who = feed.profiles[it.user_id];
              const media = it.media_type === 'video' || (Array.isArray(it.media_urls) && it.media_urls[0] && it.media_urls[0].t === 'video' && !it.media_url);
              return (
                <div key={`${it.isStory ? 's' : 'p'}-${it.id}`} role="listitem" aria-label={`${it.isStory ? 'Story' : 'Post'} by ${who ? who.name : 'someone'}`} onClick={() => (it.isStory ? onOpenStory(it) : onOpenPost(it))} className="zchat-press"
                  style={{ position: 'relative', aspectRatio: it.isStory ? '9 / 16' : '3 / 4', borderRadius: 10, overflow: 'hidden', background: theme.rowBg, cursor: 'pointer', alignSelf: 'start' }}>
                  {media ? <VideoThumb src={it.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} /> : <MediaImg src={it.media_url} loading="lazy" draggable={false} onError={hideBroken} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                  {who && <div style={{ position: 'absolute', left: 6, bottom: 6, display: 'flex', alignItems: 'center', gap: 5, maxWidth: 'calc(100% - 12px)', color: '#FFFFFF', fontSize: 11, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}><span style={{ borderRadius: '50%', boxShadow: it.isStory ? `0 0 0 2px ${theme.coral}` : 'none', display: 'flex', flexShrink: 0 }}><Avatar emoji={who.avatar} name={who.name} size={20} /></span><span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(who.name || '').split(' ')[0]}</span></div>}
                </div>
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 18, fontSize: 10, color: theme.muted, opacity: 0.8 }}>
          <a href="https://openfreemap.org" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>OpenFreeMap</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>{'© OpenStreetMap'}</a>
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
