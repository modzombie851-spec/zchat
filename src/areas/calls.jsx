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
  Avatar,
  BigButton,
  CALL_SR,
  CalendarIcon,
  CallVideo,
  ChatRowSheet,
  EmptyState,
  FONT,
  FullPage,
  GroupAvatar,
  IgRow,
  IgToggle,
  LivePlanAction,
  LivePlanPage,
  LivePlanSheet,
  LivePlanThumb,
  LivePollSheet,
  MoreDotsIcon,
  PlusCircleIcon,
  PollIcon,
  Portal,
  RoundVideoIcon,
  Spinner,
  UserListRow,
  VOICE_FX,
  VOICE_INTRO_MAX,
  VOICE_INTRO_PATH,
  VROOM_MAX,
  VerifiedBadge,
  VoiceIntroChip,
  appSnack,
  callBgOk,
  callFxOk,
  callHeadphones,
  canShareScreen,
  colorForName,
  fetchProfilesView,
  fmtHM,
  formatCallDuration,
  friendlyError,
  hapticTap,
  inputStyle,
  kitOnInk,
  liveCallHub,
  liveFirst,
  livePlans,
  livePlansForGroup,
  pfExtrasPatch,
  playUiSound,
  profileFnMissing,
  readJsonLs,
  reducedMotion,
  reminderWhen,
  rpcMissing,
  sanitizeAvatarList,
  uploadMedia,
  useBackClose,
  useCallMedia,
  useLivePlans,
  useSheetDrag,
  useTheme,
  useVoiceRoom,
  useVoiceRoomList,
  useVroomCtl,
  voiceIntroStop,
  voiceRoomJoin,
  voiceRoomLeave,
  vroomCtl,
  vroomCtlEmit,
  vroomList,
  vroomListEmit,
  vroomListPatch,
  vroomPoll,
  vroomRankIn,
  vroomRankOf,
  vroomRolesFrom,
  vroomSelfState,
  vroomSend,
  vroomSetTalking,
  vroomTrack,
  writeJsonLs,
} from '../App.jsx';
import {
  JoinBanners,
  KitSlider,
  LivePollCard,
  PaintSheet,
  animBlobOf,
  animCanvas,
  animDuration,
  animRecord,
  animSeek,
} from './shared.jsx';

function voiceIntroPathOf(url, uid) {
  const s = String(url || '');
  const i = uid ? s.lastIndexOf(`${uid}/`) : -1;
  if (i < 0) return null;
  let p = s.slice(i).split(/[?#]/)[0];
  try { p = decodeURIComponent(p); } catch {}
  return VOICE_INTRO_PATH.test(p) ? p : null;
}
async function voiceIntroDecode(blob) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const buf = await blob.arrayBuffer();
    const ctx = new AC();
    const audio = await new Promise((res, rej) => { const p = ctx.decodeAudioData(buf, res, rej); if (p && p.then) p.then(res, rej); });
    try { ctx.close(); } catch {}
    return audio;
  } catch { return null; }
}
function voiceIntroPeaks(audio, start = 0, len = 0, n = 28) {
  try {
    const data = audio.getChannelData(0);
    const s0 = Math.floor(start * audio.sampleRate);
    const s1 = Math.min(data.length, len ? Math.floor((start + len) * audio.sampleRate) : data.length);
    const step = Math.max(1, Math.floor((s1 - s0) / n));
    const out = [];
    for (let k = 0; k < n; k++) { let m = 0; for (let j = s0 + k * step; j < Math.min(s1, s0 + (k + 1) * step); j += 8) { const v = Math.abs(data[j]); if (v > m) m = v; } out.push(m); }
    const top = Math.max(0.0001, ...out);
    return out.map((v) => Math.round(Math.max(0.12, v / top) * 100) / 100);
  } catch { return null; }
}
async function voiceIntroWav(audio, start, len) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) return null;
  const rate = 16000;
  const off = new OAC(1, Math.ceil(rate * len), rate);
  const src = off.createBufferSource();
  src.buffer = audio;
  src.connect(off.destination);
  src.start(0, start, len);
  const out = await new Promise((res, rej) => { off.oncomplete = (e) => res(e.renderedBuffer); const p = off.startRendering(); if (p && p.then) p.then(res, rej); });
  const pcm = out.getChannelData(0);
  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const w = (o, t) => { for (let k = 0; k < t.length; k++) view.setUint8(o + k, t.charCodeAt(k)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); w(36, 'data'); view.setUint32(40, pcm.length * 2, true);
  for (let k = 0; k < pcm.length; k++) view.setInt16(44 + k * 2, Math.max(-1, Math.min(1, pcm[k])) * 0x7FFF, true);
  return new Blob([view], { type: 'audio/wav' });
}
export function VoiceIntroSheet({ uid, voice, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [phase, setPhase] = useState('idle');
  const [secs, setSecs] = useState(0);
  const [clip, setClip] = useState(null);
  const [say, setSay] = useState((voice && voice.say) || '');
  const [err, setErr] = useState('');
  const [long, setLong] = useState(null);
  const [startAt, setStartAt] = useState(0);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const tRef = useRef(0);
  const fileRef = useRef(null);
  const canRec = typeof window !== 'undefined' && !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const stopAll = () => { clearInterval(tRef.current); try { if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop()); } catch {} streamRef.current = null; };
  useEffect(() => () => { stopAll(); voiceIntroStop(); }, []);
  const ready = async (blob, measured) => {
    const audio = await voiceIntroDecode(blob);
    const dur = audio ? audio.duration : measured;
    if (!dur || dur < 0.6) { setErr('That was too short. Say a little more.'); setPhase('idle'); return; }
    if (dur > VOICE_INTRO_MAX + 0.4) {
      if (!audio) { setErr('Pick a sound that is 10 seconds or shorter.'); setPhase('idle'); return; }
      setLong({ audio, dur });
      setStartAt(0);
      setPhase('trim');
      return;
    }
    let url = null;
    try { url = URL.createObjectURL(blob); } catch {}
    setClip({ blob, url, secs: Math.min(VOICE_INTRO_MAX, Math.round(dur * 10) / 10), peaks: audio ? voiceIntroPeaks(audio) : null });
    setPhase('review');
  };
  const start = async () => {
    setErr('');
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = st;
      const mime = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || '';
      const rec = new MediaRecorder(st, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
      const chunks = [];
      const t0 = Date.now();
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => { stopAll(); const b = new Blob(chunks, { type: (rec.mimeType || mime || 'audio/webm').split(';')[0] }); ready(b, (Date.now() - t0) / 1000); };
      recRef.current = rec;
      rec.start();
      setPhase('rec');
      setSecs(0);
      playUiSound('record-start');
      tRef.current = setInterval(() => { const s = (Date.now() - t0) / 1000; setSecs(Math.min(VOICE_INTRO_MAX, Math.floor(s))); if (s >= VOICE_INTRO_MAX) { try { rec.stop(); } catch {} } }, 100);
      hapticTap();
    } catch (e) { stopAll(); setPhase('idle'); if (permDenied(e)) { setErr(''); openPermHelp('mic'); } else setErr('Your microphone could not start. Try again.'); }
  };
  const stop = () => { playUiSound('record-stop'); try { if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop(); } catch {} };
  const pickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^audio\//.test(f.type || '')) { setErr('Pick a sound file, like an mp3 or m4a.'); return; }
    if (f.size > 25 * 1024 * 1024) { setErr('That file is too big. Pick a shorter one.'); return; }
    setErr('');
    setPhase('wait');
    ready(f, 0);
  };
  const useTrim = async () => {
    if (!long) return;
    setPhase('wait');
    try {
      const len = Math.min(VOICE_INTRO_MAX, long.dur - startAt);
      const b = await voiceIntroWav(long.audio, startAt, len);
      if (!b) throw new Error('wav');
      let url = null;
      try { url = URL.createObjectURL(b); } catch {}
      setClip({ blob: b, url, secs: Math.round(len * 10) / 10, peaks: voiceIntroPeaks(long.audio, startAt, len) });
      setLong(null);
      setPhase('review');
    } catch { setErr('That sound could not be cut on this device. Try recording instead.'); setPhase('idle'); }
  };
  const save = async () => {
    if (!clip) return;
    const before = voice || null;
    const t = String(clip.blob.type || '').toLowerCase();
    const ext = /wav/.test(t) ? 'wav' : /mp4|m4a|aac/.test(t) ? 'm4a' : /ogg/.test(t) ? 'ogg' : /mpeg|mp3/.test(t) ? 'mp3' : 'webm';
    const cleanSay = say.replace(/\s+/g, ' ').trim().slice(0, 40) || null;
    const local = { url: clip.url, path: null, secs: clip.secs, say: cleanSay, peaks: clip.peaks, at: new Date().toISOString() };
    hapticTap();
    pfExtrasPatch(uid, { voice: local });
    onClose();
    const back = (msg) => { pfExtrasPatch(uid, { voice: before }); appSnack(msg); };
    const up = await uploadMedia(new File([clip.blob], `intro.${ext}`, { type: t.split(';')[0] || 'audio/webm' }), uid).catch(() => ({ url: null, error: true }));
    const path = up && !up.error ? voiceIntroPathOf(up.url, uid) : null;
    if (!path) { back('Your voice intro could not be uploaded. Try again.'); return; }
    const { error } = await supabase.rpc('zchat_voice_intro_set', { p_path: path, p_secs: clip.secs, p_say: cleanSay, p_peaks: clip.peaks });
    if (error) { back(profileFnMissing(error) ? 'Voice intros switch on once the latest ZChat setup is finished.' : friendlyError(error, 'Your voice intro could not be saved. Try again.')); return; }
    pfExtrasPatch(uid, { voice: { ...local, path } });
  };
  const saySave = async () => {
    const cleanSay = say.replace(/\s+/g, ' ').trim().slice(0, 40) || null;
    if (!voice) return;
    pfExtrasPatch(uid, { voice: { ...voice, say: cleanSay } });
    onClose();
    const { error } = await supabase.rpc('zchat_voice_intro_say', { p_say: cleanSay });
    if (error) { pfExtrasPatch(uid, { voice }); appSnack(friendlyError(error, 'That could not be saved. Try again.')); }
  };
  const remove = async () => {
    const before = voice;
    hapticTap();
    pfExtrasPatch(uid, { voice: null });
    onClose();
    const { error } = await supabase.rpc('zchat_voice_intro_clear');
    if (error) { pfExtrasPatch(uid, { voice: before }); appSnack(friendlyError(error, 'Your voice intro could not be removed. Try again.')); }
  };
  const sayField = (
    <input value={say} onChange={(e) => setSay(e.target.value.slice(0, 40))} placeholder="How to say your name, like KAH soon" aria-label="How to say your name" autoComplete="off" style={{ ...inputStyle(theme), marginTop: 14, fontSize: 15.5 }} />
  );
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'var(--zvp-h, 100%)', zIndex: 820, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div role="dialog" aria-label="Voice intro" onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 480, background: theme.panelBg, borderRadius: '22px 22px 0 0', padding: '10px 20px calc(18px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 10 }}><div style={{ width: 36, height: 4, borderRadius: 2, background: theme.soft2 }} /></div>
          <div style={{ textAlign: 'center', fontSize: 16.5, fontWeight: 700, color: theme.ink }}>Voice intro</div>
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.muted, marginTop: 3, lineHeight: 1.45 }}>Say hi in up to 10 seconds. It plays only when someone taps it.</div>
          {phase === 'review' && clip ? (
            <div style={{ padding: '18px 0 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center' }}><VoiceIntroChip voice={{ url: clip.url, secs: clip.secs, peaks: clip.peaks }} name="your" /></div>
              {sayField}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <div style={{ width: 120 }}><BigButton label="Again" tone="plain" onClick={() => { voiceIntroStop(); setClip(null); setPhase('idle'); }} /></div>
                <div style={{ flex: 1 }}><BigButton label="Save" onClick={save} /></div>
              </div>
            </div>
          ) : phase === 'trim' && long ? (
            <div style={{ padding: '18px 0 0' }}>
              <div style={{ fontSize: 14, color: theme.ink, fontWeight: 600, textAlign: 'center' }}>{`This sound is ${Math.round(long.dur)} seconds. Pick where your 10 seconds start.`}</div>
              <KitSlider value={startAt} min={0} max={Math.max(0, Math.floor((long.dur - VOICE_INTRO_MAX) * 10) / 10)} step={0.1} onChange={setStartAt} label="Start of your voice intro" style={{ width: '100%', marginTop: 16 }} />
              <div style={{ fontSize: 12.5, color: theme.muted, textAlign: 'center', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{`From ${startAt.toFixed(1)} to ${(startAt + VOICE_INTRO_MAX).toFixed(1)} seconds`}</div>
              <div style={{ marginTop: 16 }}><BigButton label="Use this part" onClick={useTrim} /></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 0 6px' }}>
              {canRec && (
                <div role="button" aria-label={phase === 'rec' ? 'Stop recording' : 'Record your voice intro'} onClick={phase === 'rec' ? stop : phase === 'wait' ? undefined : start} className="zchat-press" style={{ width: 76, height: 76, borderRadius: '50%', background: phase === 'rec' ? '#FF3B30' : theme.coral, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: phase === 'rec' ? '0 0 0 8px rgba(255,59,48,0.18)' : 'none', transition: 'box-shadow 0.2s ease' }}>
                  {phase === 'wait' ? <Spinner size={22} /> : phase === 'rec' ? <span style={{ width: 24, height: 24, borderRadius: 5, background: '#FFFFFF' }} /> : <Mic size={30} color="#FFFFFF" />}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: theme.ink, marginTop: 12, fontVariantNumeric: 'tabular-nums' }}>{phase === 'rec' ? `0:${String(secs).padStart(2, '0')} of 0:10` : phase === 'wait' ? 'Getting it ready' : canRec ? 'Tap to record' : 'Pick a sound to use'}</div>
              <div role="button" aria-label="Pick a sound file" onClick={() => phase !== 'rec' && fileRef.current && fileRef.current.click()} style={{ marginTop: 16, fontSize: 14.5, fontWeight: 700, color: kitOnInk(theme), cursor: 'pointer' }}>Pick a sound file</div>
              <input ref={fileRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={pickFile} />
              {voice && phase === 'idle' && (
                <div style={{ width: '100%', marginTop: 18, borderTop: `1px solid ${theme.hair}`, paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <VoiceIntroChip voice={voice} name="your" />
                    <div role="button" aria-label="Remove voice intro" onClick={remove} style={{ fontSize: 14, fontWeight: 700, color: theme.danger, cursor: 'pointer', padding: 6 }}>Remove</div>
                  </div>
                  {sayField}
                  {say.trim() !== String(voice.say || '') && <div style={{ marginTop: 12 }}><BigButton label="Save" onClick={saySave} /></div>}
                </div>
              )}
            </div>
          )}
          {err && <div role="alert" style={{ fontSize: 13.5, color: theme.danger, fontWeight: 600, textAlign: 'center', paddingTop: 12 }}>{err}</div>}
        </div>
      </div>
    </Portal>
  );
}

const COVER_W = 780;
const COVER_H = 300;
const COVER_MAX_S = 8;
const COVER_FILE_MAX = 4 * 1024 * 1024;
export function CoverVideoMaker({ file, onCancel, onConfirm }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState(null);
  const [nat, setNat] = useState(null);
  const [dur, setDur] = useState(0);
  const [start, setStart] = useState(0);
  const [len, setLen] = useState(COVER_MAX_S);
  const [thumbs, setThumbs] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [failed, setFailed] = useState('');
  const vidRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef(null);
  const signalRef = useRef(null);
  const busyRef = useRef(false);
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const trimRef = useRef({ start: 0, len: COVER_MAX_S });
  trimRef.current = { start, len };
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360;
  const W = Math.round(Math.max(260, Math.min(vw - 32, 560)));
  const H = Math.round(W / 2.6);
  const cancel = () => { if (busyRef.current && signalRef.current) { signalRef.current.stopped = true; busyRef.current = false; setBusy(false); return; } onCancel(); };
  useBackClose(true, cancel);
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => { if (signalRef.current) signalRef.current.stopped = true; setTimeout(() => URL.revokeObjectURL(u), 1000); };
  }, [file]);
  const onMeta = async () => {
    const v = vidRef.current;
    if (!v) return;
    if (!v.videoWidth || !v.videoHeight) { setFailed('That video could not be opened. Try another one.'); return; }
    const d = await animDuration(v);
    if (!d || d < 1) { setFailed('That video is too short. Pick one that is at least a second long.'); return; }
    setNat({ w: v.videoWidth, h: v.videoHeight });
    setDur(d);
    setLen(Math.min(COVER_MAX_S, d));
    setStart(0);
    try { v.currentTime = 0; v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {}
  };
  useEffect(() => {
    if (!url || !dur) return undefined;
    let alive = true;
    const tv = document.createElement('video');
    tv.muted = true;
    tv.playsInline = true;
    tv.preload = 'auto';
    tv.src = url;
    const run = async () => {
      await new Promise((r) => { if (tv.readyState >= 1) r(); else { tv.onloadedmetadata = () => r(); setTimeout(r, 3000); } });
      const c = animCanvas(96, 54);
      const x = c.getContext('2d');
      const list = [];
      for (let i = 0; i < 8 && alive; i++) {
        await animSeek(tv, Math.min(dur - 0.05, ((i + 0.5) * dur) / 8));
        if (!alive || !tv.videoWidth) break;
        const r = Math.max(96 / tv.videoWidth, 54 / tv.videoHeight);
        try { x.drawImage(tv, (96 - tv.videoWidth * r) / 2, (54 - tv.videoHeight * r) / 2, tv.videoWidth * r, tv.videoHeight * r); list.push(c.toDataURL('image/jpeg', 0.6)); } catch { break; }
        if (alive) setThumbs(list.slice());
      }
    };
    run();
    return () => { alive = false; try { tv.removeAttribute('src'); tv.load(); } catch {} };
  }, [url, dur]);
  useEffect(() => {
    if (!dur || busy) return undefined;
    let raf = 0;
    const loop = () => {
      const v = vidRef.current;
      if (v && !dragRef.current && !busyRef.current) {
        const { start: s, len: l } = trimRef.current;
        if (v.currentTime >= s + l - 0.02 || v.currentTime < s - 0.3) { try { v.currentTime = s; } catch {} }
        if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dur, busy]);
  const base = nat ? Math.max(W / nat.w, H / nat.h) : 1;
  const dispW = nat ? nat.w * base * zoom : W;
  const dispH = nat ? nat.h * base * zoom : H;
  const clampOffset = (o, z) => {
    if (!nat) return o;
    const mx = Math.max(0, (nat.w * base * z - W) / 2);
    const my = Math.max(0, (nat.h * base * z - H) / 2);
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };
  const setZoomSafe = (z) => { const nz = Math.max(1, Math.min(4, z)); setZoom(nz); setOffset((o) => clampOffset(o, nz)); };
  const onDown = (e) => {
    if (busy) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) { const [a, b] = [...pointersRef.current.values()]; pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom }; }
  };
  const onMove = (e) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size >= 2 && pinchRef.current) { const [a, b] = [...pointersRef.current.values()]; setZoomSafe(pinchRef.current.zoom * (Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, pinchRef.current.dist))); return; }
    setOffset((o) => clampOffset({ x: o.x + e.clientX - prev.x, y: o.y + e.clientY - prev.y }, zoom));
  };
  const onUp = (e) => { pointersRef.current.delete(e.pointerId); if (pointersRef.current.size < 2) pinchRef.current = null; };
  const maxLen = Math.min(COVER_MAX_S, dur || COVER_MAX_S);
  const minLen = Math.min(1, maxLen);
  const showAt = (t) => { const v = vidRef.current; if (v) { try { v.pause(); v.currentTime = t; } catch {} } };
  const trackDown = (e) => {
    if (busy || !dur || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const x0 = (start / dur) * r.width;
    const x1 = ((start + len) / dur) * r.width;
    let mode = 'move';
    let s0 = start;
    if (Math.abs(x - x0) <= 16 && x <= (x0 + x1) / 2) mode = 'l';
    else if (Math.abs(x - x1) <= 16) mode = 'r';
    else if (x < x0 || x > x1) { s0 = Math.max(0, Math.min(dur - len, (x / r.width) * dur - len / 2)); setStart(s0); }
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, x, w: r.width, s0, e0: s0 + len };
    showAt(mode === 'r' ? s0 + len : s0);
  };
  const trackMove = (e) => {
    const d = dragRef.current;
    if (!d || !trackRef.current) return;
    const r = trackRef.current.getBoundingClientRect();
    const ds = ((e.clientX - r.left - d.x) / d.w) * dur;
    if (d.mode === 'move') { const s = Math.max(0, Math.min(dur - (d.e0 - d.s0), d.s0 + ds)); setStart(s); showAt(s); }
    else if (d.mode === 'l') { const s = Math.max(Math.max(0, d.e0 - maxLen), Math.min(d.e0 - minLen, d.s0 + ds)); setStart(s); setLen(d.e0 - s); showAt(s); }
    else { const en = Math.max(d.s0 + minLen, Math.min(Math.min(dur, d.s0 + maxLen), d.e0 + ds)); setLen(en - d.s0); showAt(en); }
  };
  const trackUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const v = vidRef.current;
    if (v) { try { v.currentTime = trimRef.current.start; const p = v.play(); if (p && p.catch) p.catch(() => {}); } catch {} }
  };
  const trackKey = (e) => {
    if (!dur) return;
    const step = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 0.1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.1 : 0;
    if (!step) return;
    e.preventDefault();
    setStart((s) => Math.max(0, Math.min(dur - len, Math.round((s + step) * 10) / 10)));
  };
  const make = async () => {
    if (busyRef.current || !nat || failed) return;
    const v = vidRef.current;
    if (!v) return;
    const signal = { stopped: false };
    signalRef.current = signal;
    busyRef.current = true;
    setBusy(true);
    setPct(0);
    const scale = base * zoom;
    const c = { sx: (dispW / 2 - W / 2 - offset.x) / scale, sy: (dispH / 2 - H / 2 - offset.y) / scale, sw: W / scale, sh: H / scale };
    try {
      const s = trimRef.current.start;
      const l = trimRef.current.len;
      v.pause();
      await animSeek(v, s);
      if (signal.stopped) return;
      const big = animCanvas(1500, 577);
      big.getContext('2d').drawImage(v, c.sx, c.sy, c.sw, c.sh, 0, 0, 1500, 577);
      const poster = await animBlobOf(big, 'image/jpeg', 0.86);
      await v.play();
      const endAt = s + l;
      const clip = await animRecord({
        len: l * 1000, signal, onTick: setPct, w: COVER_W, h: COVER_H, bps: 1500000,
        paint: (ctx, t) => {
          if (v.ended || v.currentTime >= endAt - 0.015 || t > Math.min(l * 1000 + 300, COVER_MAX_S * 1000 + 200)) return false;
          ctx.drawImage(v, c.sx, c.sy, c.sw, c.sh, 0, 0, COVER_W, COVER_H);
          return true;
        },
      });
      try { v.pause(); } catch {}
      if (signal.stopped) return;
      if (!clip || !clip.size || !poster) throw new Error('empty');
      if (clip.size > COVER_FILE_MAX) { busyRef.current = false; setBusy(false); appSnack('That came out too big. Try a shorter part.'); return; }
      onConfirm({ clip, poster, ext: /mp4/i.test(clip.type) ? 'mp4' : 'webm' });
    } catch {
      if (signal.stopped) return;
      busyRef.current = false;
      setBusy(false);
      appSnack(signal.late ? 'Keep ZChat open while your cover is made, then try again.' : 'Your cover video could not be made on this device. Try another video.');
    }
  };
  const x0p = dur ? (start / dur) * 100 : 0;
  const wp = dur ? (len / dur) * 100 : 100;
  return (
    <div role="dialog" aria-label="Cover video" className="zchat-fade" style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 150, display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', color: 'white', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
        <span role="button" aria-label="Cancel" onClick={cancel} style={{ fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 6 }}>Cancel</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}>Cover video</span>
        <span role="button" aria-label="Use this cover video" aria-disabled={!nat || busy || !!failed} onClick={make} style={{ fontSize: 15, fontWeight: 800, cursor: nat && !busy && !failed ? 'pointer' : 'default', padding: 6, color: theme.gold, opacity: nat && !failed ? 1 : 0.45 }}>{busy ? <Spinner size={15} /> : 'Done'}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }} onWheel={(e) => { if (!busy) setZoomSafe(zoom * (1 - e.deltaY * 0.0015)); }}>
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ position: 'relative', width: W, height: H, touchAction: 'none', cursor: busy ? 'default' : 'grab' }}>
          {url && !failed && <video ref={vidRef} src={url} muted playsInline preload="auto" onLoadedMetadata={onMeta} onError={() => setFailed('That video could not be opened. Try another one.')}
            style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH, maxWidth: 'none', pointerEvents: 'none', opacity: nat ? 1 : 0, transform: `translate(${W / 2 - dispW / 2 + offset.x}px, ${H / 2 - dispH / 2 + offset.y}px)` }} />}
          {!nat && !failed && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={24} /></div>}
          {failed && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, fontSize: 14.5, lineHeight: 1.45, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{failed}</div>}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 10, boxShadow: '0 0 0 2000px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.85)', pointerEvents: 'none' }} />
          {busy && (
            <div aria-live="polite" style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(0,0,0,0.42)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{ width: '60%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}><div style={{ width: `${Math.round(Math.max(0.03, pct) * 100)}%`, height: '100%', background: theme.gold, transition: 'width 0.12s linear' }} /></div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Making your cover</div>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '10px 24px 18px', display: 'flex', flexDirection: 'column', gap: 14, opacity: busy ? 0.4 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ImageIcon size={14} color="rgba(255,255,255,0.7)" />
          <input type="range" aria-label="Zoom" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoomSafe(parseFloat(e.target.value))} style={{ flex: 1, accentColor: theme.coral }} />
          <ImageIcon size={20} color="rgba(255,255,255,0.9)" />
        </div>
        {dur > 0 && (
          <div>
            <div ref={trackRef} onPointerDown={trackDown} onPointerMove={trackMove} onPointerUp={trackUp} onPointerCancel={trackUp} style={{ position: 'relative', height: 52, borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', touchAction: 'none', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>{thumbs.map((u, i) => <img key={i} src={u} alt="" draggable={false} style={{ flex: '1 1 0', minWidth: 0, height: '100%', objectFit: 'cover', display: 'block' }} />)}</div>
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${x0p}%`, background: 'rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p + wp}%`, right: 0, background: 'rgba(0,0,0,0.6)' }} />
              <div role="slider" tabIndex={0} aria-label="Start of your cover video" aria-valuemin={0} aria-valuemax={Math.max(0, Math.round((dur - len) * 10) / 10)} aria-valuenow={Math.round(start * 10) / 10} aria-valuetext={`${start.toFixed(1)} seconds in`} onKeyDown={trackKey}
                style={{ position: 'absolute', top: 0, bottom: 0, left: `${x0p}%`, width: `${wp}%`, border: `3px solid ${theme.gold}`, borderLeftWidth: 12, borderRightWidth: 12, borderRadius: 12, boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>
              <span>Drag to pick up to 8 seconds</span>
              <span style={{ color: 'white', fontWeight: 800 }}>{`${len.toFixed(1)} seconds`}</span>
            </div>
          </div>
        )}
        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.4 }}>It loops without sound behind your profile.</div>
      </div>
    </div>
  );
}
const CALL_FX = [['off', 'Off'], ['robot', 'Robot'], ['chipmunk', 'Chipmunk'], ['deep', 'Deep'], ['echo', 'Echo']];

function CallAudio({ stream }) {
  const ref = useRef(null);
  useCallMedia(ref, stream, false);
  return <audio ref={ref} data-zchat-call-audio="1" autoPlay playsInline />;
}
function vroomSetMuted(on) {
  const eng = liveCallHub.engine;
  if (!eng || !vroomCtl.gid || !vroomCtl.me) return;
  if (!on && vroomCtl.modMuted.has(vroomCtl.me.id)) { appSnack('A moderator muted you. Raise your hand to ask to talk.'); return; }
  eng.setMuted(!!on);
  vroomCtl.muted = !!on;
  if (on && vroomCtl.meTalking) vroomSetTalking(false);
  vroomTrack(vroomCtl.gid, vroomSelfState());
  hapticTap();
  vroomCtlEmit();
}
function vroomSetHand(on) {
  if (!vroomCtl.gid || !vroomCtl.me) return;
  vroomCtl.hand = !!on;
  vroomTrack(vroomCtl.gid, vroomSelfState());
  hapticTap();
  playUiSound('tap');
  vroomCtlEmit();
}
function vroomModMute(uid, on) {
  if (!vroomCtl.gid || !vroomCtl.me) return;
  const mine = vroomRankOf(vroomCtl.me.id);
  if (mine < 1 || mine <= vroomRankOf(uid)) return;
  if (on) vroomCtl.modMuted.add(uid); else vroomCtl.modMuted.delete(uid);
  vroomSend(vroomCtl.gid, { k: on ? 'mute' : 'unmute', to: uid, by: vroomCtl.me.id });
  hapticTap();
  vroomCtlEmit();
}
function vroomLowerHand(uid) {
  if (!vroomCtl.gid || !vroomCtl.me || vroomRankOf(vroomCtl.me.id) < 1) return;
  vroomSend(vroomCtl.gid, { k: 'hand', to: uid, by: vroomCtl.me.id });
  hapticTap();
}
async function vroomRemove(uid, name) {
  const gid = vroomCtl.gid;
  if (!gid || !vroomCtl.me) return;
  const mine = vroomRankOf(vroomCtl.me.id);
  if (mine < 1 || mine <= vroomRankOf(uid)) return;
  vroomCtl.bans.add(uid);
  const eng = liveCallHub.engine;
  if (eng) eng.dropPeer(uid);
  vroomCtlEmit();
  const { data, error } = await Promise.resolve(supabase.rpc('zchat_room_kick', { p_group: gid, p_user: uid, p_minutes: 15 })).catch(() => ({ data: null, error: { message: 'network' } }));
  if (error || !data || data.ok === false) {
    vroomCtl.bans.delete(uid);
    vroomCtlEmit();
    appSnack(rpcMissing(error) ? 'Voice rooms switch on once the latest ZChat setup is finished.' : friendlyError(error, `Couldn't take ${String(name || 'them').split(' ')[0]} out of the room. Try again.`));
    return;
  }
  vroomSend(gid, { k: 'kick', to: uid, by: vroomCtl.me.id });
  appSnack(`${String(name || 'They').split(' ')[0]} is out of the room for 15 minutes`);
}
async function vroomSetEnabled(group, on) {
  const before = vroomList.rows.get(group.id);
  vroomListPatch(group.id, on ? { enabled: true } : { enabled: false, open_at: null, people: 0 });
  hapticTap();
  const { data, error } = await Promise.resolve(supabase.rpc('zchat_room_set_enabled', { p_group: group.id, p_on: !!on })).catch(() => ({ data: null, error: { message: 'network' } }));
  if (error || !data || data.ok === false) {
    if (before) vroomList.rows.set(group.id, before); else vroomList.rows.delete(group.id);
    vroomListEmit();
    appSnack(rpcMissing(error) ? 'Voice rooms switch on once the latest ZChat setup is finished.' : data && data.reason === 'admin' ? 'Only admins can change this' : friendlyError(error, "Couldn't change the voice room. Try again."));
    return;
  }
  if (!on) {
    vroomSend(group.id, { k: 'off', by: vroomCtl.me ? vroomCtl.me.id : null });
    if (vroomCtl.gid === group.id) voiceRoomLeave('off');
  }
}
function HandGlyph({ size = 16, color = 'currentColor', strokeWidth = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...(style || {}) }} aria-hidden="true">
      <path d="M18 11V6a2 2 0 0 0-4 0v5" /><path d="M14 10V4a2 2 0 0 0-4 0v6" /><path d="M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.4l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15" />
    </svg>
  );
}
export function VoiceRoomSheet({ group, members, me, onClose }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const drag = useSheetDrag(onClose);
  const list = useVoiceRoomList();
  const ctl = useVroomCtl();
  const room = useVoiceRoom(group.id, me.id);
  useLivePlans();
  const [planOpen, setPlanOpen] = useState(null);
  const plans = livePlansForGroup(group.id);
  const row = list.rows.get(group.id);
  const off = !!(row && row.enabled === false);
  const rank = vroomRankIn(group, vroomRolesFrom(members), me.id);
  const inHere = ctl.gid === group.id;
  const people = room.people;
  const full = !inHere && people.filter((p) => p.u !== me.id).length >= VROOM_MAX;
  const go = () => {
    onClose();
    if (inHere) { const eng = liveCallHub.engine; if (eng) eng.minimize(false); return; }
    voiceRoomJoin(group, members, me);
  };
  return (
    <Portal>
      <div onClick={onClose} className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 96, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: FONT, background: 'rgba(0,0,0,0.45)' }}>
        <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ transform: drag.sheetStyle.transform, transition: drag.sheetStyle.transition, width: '100%', maxWidth: 460, maxHeight: 'min(86vh, calc(100% - 24px))', display: 'flex', flexDirection: 'column', background: theme.panelBg, borderRadius: '24px 24px 0 0', overflow: 'hidden', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', boxShadow: '0 -10px 40px rgba(0,0,0,0.25)' }}>
          <div {...drag.sheetProps} style={{ touchAction: 'none', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}><div style={{ width: 38, height: 4, borderRadius: 2, background: theme.border }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px 12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.dark ? 'rgba(31,168,85,0.18)' : 'rgba(31,168,85,0.12)', color: '#1FA855', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Volume2 size={21} strokeWidth={2} /></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: theme.ink }}>Voice room</div>
                <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</div>
              </div>
            </div>
          </div>
          <div data-sheet-scroll="true" style={{ overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', padding: '0 18px' }}>
            {off ? (
              <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '4px 0 14px' }}>The voice room is off for this group. Turn it on and members can drop in and talk whenever they like.</div>
            ) : people.length ? (
              <div role="list" aria-label="In the voice room" style={{ padding: '2px 0 10px' }}>
                {people.map((p) => (
                  <div key={p.u} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 50 }}>
                    <div style={{ borderRadius: '50%', boxShadow: room.talking.has(p.u) ? '0 0 0 2px #2EDB6B' : 'none', transition: 'box-shadow 160ms ease-out' }}><Avatar emoji={p.a} name={p.n || 'Someone'} size={38} /></div>
                    <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.u === me.id ? 'You' : p.n || 'Someone'}</div>
                    {p.h && <HandGlyph size={17} color="#F2A516" />}
                    {(p.m || ctl.modMuted.has(p.u)) && <MicOff size={16} color={theme.muted} />}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 14, color: theme.muted, lineHeight: 1.5, padding: '4px 0 14px' }}>Nobody is here yet. Start the room and anyone in {group.name} can drop in. Nobody gets a call.</div>
            )}
            {!off && (
              <button type="button" onClick={go} disabled={full} className="zchat-press" style={{ width: '100%', height: 48, borderRadius: 12, border: 'none', background: full ? (theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') : inHere ? (theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)') : '#22B04B', color: full || inHere ? theme.ink : '#FFFFFF', fontFamily: FONT, fontSize: 16, fontWeight: 700, cursor: full ? 'default' : 'pointer', margin: '4px 0 6px' }}>
                {full ? 'The room is full right now' : inHere ? 'Back to the room' : people.length ? 'Join the voice room' : 'Start the voice room'}
              </button>
            )}
            {!off && !livePlans.missing && (
              <div role="list" aria-label="Coming up in this group" style={{ margin: '6px -18px 0', borderTop: `1px solid ${theme.border}` }}>
                {plans.length > 0 && <div style={{ fontSize: 13, fontWeight: 600, color: theme.muted, padding: '12px 18px 2px' }}>Coming up</div>}
                {plans.map((p) => (
                  <div key={p.id} role="listitem" aria-label={`${p.title}, ${reminderWhen(Date.parse(p.starts_at))}`} onClick={() => { hapticTap(); setPlanOpen(p); }} className="zchat-row-press" style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 58, padding: '6px 14px 6px 18px', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <LivePlanThumb plan={p} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: theme.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontSize: 12.5, color: theme.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{reminderWhen(Date.parse(p.starts_at))}{p.host_id !== me.id && p.host && p.host.name ? `, by ${liveFirst(p.host.name)}` : ''}</div>
                    </div>
                    <LivePlanAction plan={p} me={me} group={group} members={members} />
                  </div>
                ))}
                <IgRow icon={<CalendarIcon />} label="Schedule a room" sub="Pick a time so people can plan to join" onClick={() => { hapticTap(); setPlanOpen({ make: true }); }} />
              </div>
            )}
            {rank >= 2 && (
              <div style={{ margin: '6px -18px 0', borderTop: `1px solid ${theme.border}` }}>
                <IgRow icon={<Volume2 />} label="Voice room for this group" sub={off ? 'Off' : 'Members can drop in and talk'} right={<IgToggle on={!off} onClick={() => vroomSetEnabled(group, off)} />} />
              </div>
            )}
          </div>
        </div>
      </div>
      {planOpen && planOpen.id && <LivePlanSheet plan={planOpen} me={me} rank={rank} group={group} members={members} onClose={() => setPlanOpen(null)} onEdit={(x) => setPlanOpen({ edit: x })} />}
      {planOpen && planOpen.edit && <LivePlanPage kind="room" group={group} plan={planOpen.edit} me={me} onClose={() => setPlanOpen(null)} />}
      {planOpen && planOpen.make && <LivePlanPage kind="room" group={group} me={me} onClose={() => setPlanOpen(null)} />}
    </Portal>
  );
}
export function VoiceRoomScreen({ call, me, nameFor, avatarFor, onHangup, onMinimize, onToggleSpeaker, speakerOn }) {
  const ctl = useVroomCtl();
  const gid = call.group ? call.group.id : null;
  const room = useVoiceRoom(gid, me && me.id);
  const [menuFor, setMenuFor] = useState(null);
  const [pollSheet, setPollSheet] = useState(false);
  const title = call.group ? call.group.name : 'Group';
  const remotes = Object.entries(call.remoteStreams || {});
  const myId = me ? me.id : null;
  const vp = gid && vroomPoll.key === gid ? vroomPoll.poll : null;
  const pollArgs = { p_live: null, p_group: gid };
  const byId = new Map(room.people.map((p) => [p.u, p]));
  remotes.forEach(([id]) => { if (!byId.has(id)) byId.set(id, { u: id, n: nameFor(id), a: avatarFor(id), m: !!(call.remoteMuted || {})[id], h: false, t: Date.now() }); });
  if (myId && !byId.has(myId)) byId.set(myId, { u: myId, n: me.name, a: me.avatar, m: !!call.muted, h: !!ctl.hand, t: 0 });
  const people = [...byId.values()].sort((a, b) => (b.h - a.h) || (a.t - b.t));
  const n = people.length;
  const cols = n <= 4 ? 2 : 3;
  const face = n <= 2 ? 104 : n <= 4 ? 92 : n <= 6 ? 80 : n <= 9 ? 70 : 62;
  const myRank = vroomRankOf(myId);
  const modMutedMe = !!(myId && ctl.modMuted.has(myId));
  const connecting = call.status === 'joining';
  const still = reducedMotion();
  const ctrl = (icon, label, onClick, variant) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: 64 }}>
      <div role="button" aria-label={label} onClick={onClick} className="zchat-press" style={{ width: 60, height: 60, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: variant === 'end' ? '#FF3B30' : variant === 'on' ? 'white' : 'rgba(255,255,255,0.16)', color: variant === 'on' ? '#140E24' : 'white', transition: 'background 0.2s ease, color 0.2s ease' }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
    </div>
  );
  const menuPerson = menuFor ? byId.get(menuFor) : null;
  const first = (p) => String((p && p.n) || 'Someone').split(' ')[0];
  return (
    <div className="zchat-fade" aria-hidden={call.minimized ? 'true' : undefined} style={{ position: 'fixed', inset: 0, zIndex: call.minimized ? -1 : 500, background: '#0C0C0E', color: 'white', display: 'flex', flexDirection: 'column', visibility: call.minimized ? 'hidden' : 'visible', pointerEvents: call.minimized ? 'none' : 'auto', overflow: 'hidden', fontFamily: FONT }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 22%, ${colorForName(title)}55, #0C0C0E 70%)`, pointerEvents: 'none' }} />
      {remotes.map(([id, stream]) => <VoiceRoomAudio key={id} stream={stream} muted={ctl.modMuted.has(id)} />)}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, padding: 'calc(10px + env(safe-area-inset-top)) 14px 0' }}>
        <div role="button" aria-label="Back to the chat" onClick={onMinimize} className="zchat-press" style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Voice room</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{connecting ? 'Connecting…' : title}</div>
        </div>
        <div aria-label={`${n} in the room`} style={{ minWidth: 42, height: 42, padding: '0 10px', boxSizing: 'border-box', borderRadius: 21, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, fontWeight: 700, flexShrink: 0 }}><Users size={15} />{n}</div>
      </div>
      {!call.minimized && <JoinBanners people={room.people} myId={myId} top="calc(62px + env(safe-area-inset-top))" />}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, overflowY: 'auto', padding: '26px 16px 18px', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: '1 1 auto', maxHeight: n <= 4 ? '16vh' : '6vh' }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, rowGap: 22, columnGap: 8, width: '100%', maxWidth: 420, margin: '0 auto', flexShrink: 0 }}>
          {people.map((p) => {
            const isMe = p.u === myId;
            const talk = room.talking.has(p.u) && !(isMe ? call.muted : (p.m || ctl.modMuted.has(p.u)));
            const muted = isMe ? !!call.muted : !!(p.m || ctl.modMuted.has(p.u));
            const canMod = !isMe && myRank >= 1 && myRank > vroomRankOf(p.u);
            return (
              <div key={p.u} role={canMod ? 'button' : undefined} aria-label={canMod ? `Room options for ${p.n || 'someone'}` : `${isMe ? 'You' : p.n || 'Someone'} in the room`} onClick={canMod ? () => { hapticTap(); setMenuFor(p.u); } : undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: canMod ? 'pointer' : 'default', minWidth: 0, WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ position: 'relative', width: face, height: face, borderRadius: '50%', boxShadow: talk ? '0 0 0 3px #2EDB6B, 0 0 22px rgba(46,219,107,0.45)' : '0 0 0 3px rgba(255,255,255,0)', transition: still ? 'none' : 'box-shadow 150ms ease-out' }}>
                  <Avatar emoji={isMe ? me.avatar : p.a} name={(isMe ? me.name : p.n) || 'Someone'} size={face} />
                  {muted && <span aria-label="Muted" style={{ position: 'absolute', right: face > 80 ? 4 : 0, bottom: face > 80 ? 4 : 0, width: 26, height: 26, borderRadius: '50%', background: '#2A2A30', border: '2px solid #0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MicOff size={13} color="#FF6B6B" /></span>}
                  {p.h && <span aria-label="Hand raised" style={{ position: 'absolute', right: face > 80 ? 4 : 0, top: face > 80 ? 2 : -2, width: 28, height: 28, borderRadius: '50%', background: '#F2A516', border: '2px solid #0C0C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1A1203' }}><HandGlyph size={15} strokeWidth={2.2} /></span>}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: talk ? '#7CF2A6' : 'white', transition: still ? 'none' : 'color 150ms ease-out' }}>{isMe ? 'You' : first(p)}</div>
              </div>
            );
          })}
        </div>
        {n === 1 && !connecting && <div style={{ textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.62)', marginTop: 30, lineHeight: 1.5, padding: '0 24px' }}>You are the first one here. Others in {title} can drop in from the chat.</div>}
      </div>
      {vp && <LivePollCard box={vroomPoll} runner={myRank >= 1} by={vp.created_by && vp.created_by !== myId ? nameFor(vp.created_by) : null} args={pollArgs} />}
      <div style={{ position: 'relative', zIndex: 4, margin: '0 10px', marginBottom: 'calc(14px + env(safe-area-inset-bottom))', padding: '16px 10px 14px', borderRadius: 30, background: 'rgba(18,22,34,0.72)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-evenly' }}>
        {ctrl(call.muted ? <MicOff size={24} /> : <Mic size={24} />, modMutedMe ? 'Muted' : call.muted ? 'Unmute' : 'Mute', () => vroomSetMuted(!call.muted), call.muted ? 'on' : null)}
        {onToggleSpeaker && ctrl(speakerOn ? <Volume2 size={24} /> : <Volume1 size={24} />, speakerOn ? 'Speaker' : 'Call audio', onToggleSpeaker, speakerOn ? null : 'on')}
        {ctrl(<HandGlyph size={24} strokeWidth={1.9} />, ctl.hand ? 'Lower hand' : 'Raise hand', () => vroomSetHand(!ctl.hand), ctl.hand ? 'on' : null)}
        {myRank >= 1 && !livePlans.missing && ctrl(<PollIcon size={23} />, vp && vp.status === 'open' ? 'End poll' : 'Poll', () => { hapticTap(); if (vp && vp.status === 'open') vroomPoll.end(); else setPollSheet(true); }, vp && vp.status === 'open' ? 'on' : null)}
        {ctrl(<PhoneOff size={25} />, 'Leave', onHangup, 'end')}
      </div>
      {pollSheet && <LivePollSheet onStart={(q, o) => vroomPoll.start(pollArgs, q, o)} onClose={() => setPollSheet(false)} />}
      {menuPerson && (
        <ChatRowSheet title={menuPerson.n || 'Someone'} subtitle="In the voice room" zIndex={20} avatar={<Avatar emoji={menuPerson.a} name={menuPerson.n || 'Someone'} size={40} />} onClose={() => setMenuFor(null)}
          actions={[
            ctl.modMuted.has(menuPerson.u)
              ? { label: `Let ${first(menuPerson)} talk`, icon: <Mic size={19} />, onClick: () => vroomModMute(menuPerson.u, false) }
              : { label: `Mute ${first(menuPerson)}`, icon: <MicOff size={19} />, onClick: () => vroomModMute(menuPerson.u, true) },
            menuPerson.h ? { label: `Lower ${first(menuPerson)}'s hand`, icon: <HandGlyph size={19} />, onClick: () => vroomLowerHand(menuPerson.u) } : null,
            { label: 'Take out of the room', hint: 'They can come back after 15 minutes', icon: <PhoneOff size={19} />, danger: true, onClick: () => vroomRemove(menuPerson.u, menuPerson.n) },
          ]} />
      )}
    </div>
  );
}
function VoiceRoomAudio({ stream, muted }) {
  const ref = useRef(null);
  useCallMedia(ref, stream, !!muted);
  return <audio ref={ref} data-zchat-call-audio="1" autoPlay playsInline />;
}

function ScreenShareGlyph({ size = 16, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...(style || {}) }} aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="2.5" /><path d="M8.5 21h7M12 17v4M9 10.5l3-3 3 3M12 7.5v6" />
    </svg>
  );
}
function CallTile({ tile, isVideo, muted, cameraOff, facing, onMenu, onFocus, focused, screen, caption }) {
  const hasVideo = isVideo && tile.stream && (screen || !cameraOff) && tile.stream.getVideoTracks().length > 0;
  const pressRef = useRef(null);
  const longRef = useRef(false);
  const startPress = () => { longRef.current = false; if (onMenu) pressRef.current = setTimeout(() => { longRef.current = true; onMenu(); }, 480); };
  const endPress = () => { if (pressRef.current) { clearTimeout(pressRef.current); pressRef.current = null; } };
  return (
    <div data-cl-tile={tile.local ? 'me' : tile.id} onPointerDown={startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
      onClick={() => { if (longRef.current) return; if (onFocus) onFocus(); }}
      style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#131826', minHeight: 0, minWidth: 0, cursor: onMenu ? 'pointer' : 'default' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(circle at 50% 40%, ${colorForName(tile.avatarName || tile.name)}55, #131826 75%)` }}>
        <Avatar emoji={tile.avatar} name={tile.avatarName || tile.name} size={76} />
      </div>
      {tile.stream && (
        <div style={{ position: 'absolute', inset: 0, opacity: hasVideo ? 1 : 0, transition: 'opacity 0.25s ease' }}>
          <CallVideo stream={tile.stream} muted={tile.local} mirror={tile.local && facing === 'user' && !screen} fit={screen ? 'contain' : 'cover'} />
        </div>
      )}
      {!tile.local && tile.stream && !isVideo && <CallAudio stream={tile.stream} />}
      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 52, background: 'linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0))', pointerEvents: 'none' }} />
      {caption && <div style={{ position: 'absolute', left: 8, right: 8, bottom: 30, display: 'flex', pointerEvents: 'none' }}><CallCaption text={caption} small /></div>}
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, fontSize: 12.5, fontWeight: 600, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.45)' }}>
        {muted && <MicOff size={13} color="#FF6B6B" style={{ flexShrink: 0 }} />}{screen && <ScreenShareGlyph size={14} />}<span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{screen ? (tile.local ? 'Your screen' : `${String(tile.name || '').split(' ')[0]}'s screen`) : tile.name}</span>
      </div>
    </div>
  );
}

const CALL_REPLIES = ["Can't talk now, I'll call you later", 'In a meeting', 'Driving, call you soon'];
const CALL_MORE_EMOJI = ['\u{1F60D}', '\u{1F923}', '\u{1F622}', '\u{1F64C}', '\u{1F64F}', '\u{1F4AF}', '\u{1F44B}', '\u{1F60E}', '\u{1F914}', '\u{1F92F}', '\u{1F973}', '\u{1F440}', '\u{1F44C}', '\u{1F4AA}', '\u{1F339}', '\u{1F37F}', '\u{1F3B6}', '\u{1F308}'];
function callRepliesMine() { const v = readJsonLs('zchat-call-replies', []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, 3) : []; }
function callRepliesSave(text) {
  const t = String(text || '').trim().slice(0, 160);
  if (!t || CALL_REPLIES.includes(t)) return;
  writeJsonLs('zchat-call-replies', [t, ...callRepliesMine().filter((x) => x !== t)].slice(0, 3));
}
function CaptionsGlyph({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3.2" /><path d="M10.6 10.3a2.1 2.1 0 1 0 0 3.4M16.6 10.3a2.1 2.1 0 1 0 0 3.4" /></svg>;
}
function CallBgGlyph({ size = 22 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3.2" /><circle cx="12" cy="10.2" r="2.7" /><path d="M7.4 19.4c.9-2.6 2.6-3.9 4.6-3.9s3.7 1.3 4.6 3.9" /></svg>;
}
function CallSwitch({ on, onClick, disabled, label }) {
  const { theme } = useTheme();
  return (
    <div role="switch" aria-checked={!!on} aria-label={label} aria-disabled={disabled ? 'true' : undefined} onClick={(e) => { e.stopPropagation(); if (disabled) return; hapticTap(); playUiSound('toggle'); onClick(); }}
      style={{ flex: 'none', width: 46, height: 28, borderRadius: 14, position: 'relative', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1, background: on ? theme.coral : 'rgba(255,255,255,0.22)', transition: 'background 0.2s ease' }}>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 24, height: 24, borderRadius: '50%', background: '#FFFFFF', transform: on ? 'translateX(18px)' : 'none', transition: 'transform 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />
    </div>
  );
}
function CallSheet({ title, sub, onClose, children }) {
  useBackClose(true, onClose);
  return (
    <div onClick={onClose} className="zchat-fade" style={{ position: 'absolute', inset: 0, zIndex: 12, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', maxWidth: 520, maxHeight: '86%', overflowY: 'auto', background: '#141926', color: 'white', borderRadius: '24px 24px 0 0', padding: '8px 0', paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.22)', margin: '2px auto 6px' }} />
        {title && <div style={{ padding: '8px 20px 2px', fontSize: 16, fontWeight: 800 }}>{title}</div>}
        {sub && <div style={{ padding: '0 20px 8px', fontSize: 12.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.62)' }}>{sub}</div>}
        {children}
      </div>
    </div>
  );
}
function CallSheetRow({ icon, label, sub, onClick, right }) {
  return (
    <div role={onClick ? 'button' : undefined} aria-label={onClick ? label : undefined} onClick={onClick} className={onClick ? 'zchat-row-press' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 20px', minHeight: sub ? 58 : 48, boxSizing: 'border-box', cursor: onClick ? 'pointer' : 'default' }}>
      <span style={{ width: 24, display: 'flex', justifyContent: 'center', color: 'rgba(255,255,255,0.82)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12.5, lineHeight: '17px', color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{sub}</span>}
      </span>
      {right}
    </div>
  );
}
export function CallDeclineSheet({ name, onPick, onClose }) {
  const { theme } = useTheme();
  const [own, setOwn] = useState('');
  const [writing, setWriting] = useState(false);
  const list = useMemo(() => [...CALL_REPLIES, ...callRepliesMine().filter((x) => !CALL_REPLIES.includes(x))], []);
  const first = String(name || '').split(' ')[0];
  const pick = (t) => { const text = String(t || '').trim().slice(0, 160); if (!text) return; hapticTap(); onPick(text); };
  const sendOwn = () => { if (!own.trim()) return; callRepliesSave(own); pick(own); };
  return (
    <CallSheet title={first ? `Message ${first}` : 'Send a message'} sub="Declines the call and sends this to the chat" onClose={onClose}>
      {list.map((t) => <CallSheetRow key={t} icon={<MessageSquare size={19} />} label={t} onClick={() => pick(t)} />)}
      {writing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 20px' }}>
          <input autoFocus value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendOwn(); }} enterKeyHint="send" autoCapitalize="sentences" maxLength={160} placeholder="Your message" aria-label="Your message"
            style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)', color: 'white', padding: '0 14px', fontSize: 16, fontFamily: FONT, outline: 'none', boxSizing: 'border-box' }} />
          <div role="button" aria-label="Send and decline" onClick={sendOwn} className="zchat-press" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: own.trim() ? 'pointer' : 'default', background: own.trim() ? theme.coral : 'rgba(255,255,255,0.12)', transition: 'background 0.2s ease' }}><Send size={19} /></div>
        </div>
      ) : <CallSheetRow icon={<Pencil size={19} />} label="Write your own" onClick={() => setWriting(true)} />}
    </CallSheet>
  );
}
function callPhotoLoad() {
  return new Promise((resolve) => {
    let src = null;
    try { src = localStorage.getItem('zchat-call-bg-photo'); } catch {}
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function callPhotoFrom(file) {
  return new Promise((resolve) => {
    if (!file || !/^image\//.test(file.type || '')) { resolve(null); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const s = Math.min(1, 960 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(2, Math.round(img.naturalWidth * s));
        c.height = Math.max(2, Math.round(img.naturalHeight * s));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const data = c.toDataURL('image/jpeg', 0.82);
        try { localStorage.setItem('zchat-call-bg-photo', data); } catch {}
        const out = new Image();
        out.onload = () => resolve(out);
        out.onerror = () => resolve(null);
        out.src = data;
      } catch { resolve(null); } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
export function CallMoreSheet({ call, engine, onClose }) {
  const { theme } = useTheme();
  const isVideo = call.kind === 'video';
  const fx = call.voiceFx || 'off';
  const bg = call.bg || 'off';
  const [phones, setPhones] = useState(false);
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);
  const showBg = isVideo && callBgOk();
  useEffect(() => {
    let on = true;
    callHeadphones().then((v) => { if (on) setPhones(v); }, () => {});
    if (showBg) callPhotoLoad().then((img) => { if (on && img) setPhoto(img); });
    return () => { on = false; };
  }, []);
  const raw = engine.rawLocal ? engine.rawLocal() : null;
  const camOn = !!(raw && raw.getVideoTracks().length && !call.cameraOff);
  const fxList = CALL_FX.filter(([k]) => k === 'off' || callFxOk(k));
  const tile = (k, label, body, onPick) => {
    const on = (k === 'fx' ? false : bg === k);
    return (
      <div key={k} role="radio" aria-checked={on} aria-label={label} onClick={onPick} className="zchat-press" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
        <div style={{ width: '100%', aspectRatio: '3 / 4', borderRadius: 14, overflow: 'hidden', position: 'relative', background: '#0C0F18', boxShadow: on ? `0 0 0 2px ${theme.coral}` : '0 0 0 1px rgba(255,255,255,0.12)', transition: 'box-shadow 0.2s ease' }}>
          {body}
          {on && call.bgBusy && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}><Spinner size={20} /></div>}
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? 'white' : 'rgba(255,255,255,0.72)' }}>{label}</span>
      </div>
    );
  };
  const cam = (blur) => (camOn
    ? <div style={{ position: 'absolute', inset: blur ? -8 : 0, filter: blur ? 'blur(7px)' : 'none' }}><CallVideo stream={raw} muted mirror={call.facing === 'user'} /></div>
    : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}><VideoOff size={22} /></div>);
  const choosePhoto = () => { if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); } };
  return (
    <CallSheet title="Call settings" onClose={onClose}>
      {(CALL_SR || Object.keys(call.captions || {}).length > 0) && (
        <CallSheetRow icon={<CaptionsGlyph size={21} />} label="Captions" sub={CALL_SR ? "Uses your browser's speech service to turn speech into text" : 'Shows what others say as text'}
          right={<CallSwitch label="Captions" on={!!call.ccOn} onClick={() => engine.setCaptions(!call.ccOn)} />} />
      )}
      {fxList.length > 1 && (
        <>
          <div style={{ padding: '14px 20px 8px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Your voice</div>
          <div role="radiogroup" aria-label="Voice effect" style={{ display: 'flex', gap: 8, padding: '0 16px 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {fxList.map(([k, label]) => {
              const on = fx === k;
              return (
                <div key={k} role="radio" aria-checked={on} aria-label={k === 'off' ? 'No voice effect' : `${label} voice`} onClick={() => { hapticTap(); engine.setVoiceFx(k); }} className="zchat-press"
                  style={{ flex: '1 0 58px', minWidth: 58, height: 70, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', background: on ? 'rgba(124,92,252,0.2)' : 'rgba(255,255,255,0.06)', boxShadow: on ? `inset 0 0 0 1.5px ${theme.coral}` : 'none', color: on ? 'white' : 'rgba(255,255,255,0.78)', transition: 'background 0.2s ease' }}>
                  <VoiceFxGlyph k={k === 'off' ? 'normal' : k} size={24} />
                  <span style={{ fontSize: 11.5, fontWeight: 700 }}>{label}</span>
                </div>
              );
            })}
          </div>
          {fx !== 'off' && (
            <CallSheetRow icon={<Volume2 size={20} />} label="Hear yourself" sub={phones ? 'Plays your new voice in your headphones' : 'Put on headphones to hear a preview'}
              right={<CallSwitch label="Hear yourself" on={!!call.fxMon} disabled={!phones && !call.fxMon} onClick={() => engine.setMonitor(!call.fxMon)} />} />
          )}
        </>
      )}
      {showBg && (
        <>
          <div style={{ padding: '14px 20px 8px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 8 }}><CallBgGlyph size={17} />Background</div>
          <div role="radiogroup" aria-label="Background" style={{ display: 'flex', gap: 10, padding: '0 20px 6px' }}>
            {tile('off', 'Off', cam(false), () => { hapticTap(); engine.setBackground('off'); })}
            {tile('blur', 'Blur', cam(true), () => { hapticTap(); engine.setBackground('blur'); })}
            {tile('photo', photo ? 'Photo' : 'Add photo', photo
              ? <img src={photo.src} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}><PlusCircleIcon size={26} /></div>,
            () => { hapticTap(); if (photo) engine.setBackground('photo', photo); else choosePhoto(); })}
          </div>
          {photo && <div role="button" aria-label="Choose another photo" onClick={choosePhoto} style={{ padding: '8px 20px 4px', fontSize: 13, fontWeight: 700, color: theme.coral, cursor: 'pointer', alignSelf: 'flex-start' }}>Choose another photo</div>}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files && e.target.files[0]; callPhotoFrom(f).then((img) => { if (!img) return; setPhoto(img); engine.setBackground('photo', img); }); }} />
          <div style={{ padding: '6px 20px 10px', fontSize: 12, lineHeight: 1.45, color: 'rgba(255,255,255,0.5)' }}>Only your video changes. It runs on this phone and nothing is uploaded.</div>
        </>
      )}
    </CallSheet>
  );
}
function CallVoiceNote({ name, onSend, onCancel }) {
  const { theme } = useTheme();
  const [secs, setSecs] = useState(0);
  const [ready, setReady] = useState(false);
  const [bars, setBars] = useState(() => Array(24).fill(0.12));
  const ctl = useRef({ rec: null, stream: null, chunks: [], mime: '', send: false, started: 0, ctx: null, iv: 0, done: false });
  const first = String(name || '').split(' ')[0];
  useEffect(() => {
    const st = ctl.current;
    let alive = true;
    const stopAll = () => {
      clearInterval(st.iv);
      const ctx = st.ctx;
      st.ctx = null;
      if (ctx) { try { ctx.close().catch(() => {}); } catch {} }
      if (st.stream) st.stream.getTracks().forEach((t) => t.stop());
    };
    (async () => {
      let stream = null;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { if (permDenied(e)) openPermHelp('mic'); if (alive) onCancel('mic'); return; }
      if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
      st.stream = stream;
      const mime = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/aac', 'audio/ogg'].find((t) => typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(t));
      let rec = null;
      try { rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); } catch { stopAll(); if (alive) onCancel('rec'); return; }
      st.rec = rec;
      st.mime = rec.mimeType || mime || 'audio/webm';
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) st.chunks.push(e.data); };
      rec.onstop = () => {
        stopAll();
        if (!st.send) return;
        const blob = new Blob(st.chunks, { type: st.mime });
        const ext = st.mime.includes('mp4') ? 'm4a' : st.mime.includes('ogg') ? 'ogg' : st.mime.includes('aac') ? 'aac' : 'webm';
        onSend(blob, st.mime, ext, Math.round((Date.now() - st.started) / 1000));
      };
      try {
        const C = window.AudioContext || window.webkitAudioContext;
        if (C) {
          st.ctx = new C();
          const an = st.ctx.createAnalyser();
          an.fftSize = 256;
          st.ctx.createMediaStreamSource(stream).connect(an);
          const buf = new Uint8Array(an.fftSize);
          st.iv = setInterval(() => {
            an.getByteTimeDomainData(buf);
            let peak = 0;
            for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i] - 128));
            setBars((b) => [...b.slice(1), Math.max(0.12, Math.min(1, peak / 55))]);
            const s = Math.floor((Date.now() - st.started) / 1000);
            setSecs(s);
            if (s >= 120 && !st.done && st.rec && st.rec.state === 'recording') { st.done = true; st.send = true; st.rec.stop(); }
          }, 100);
        }
      } catch {}
      rec.start(250);
      st.started = Date.now();
      playUiSound('record-start');
      setReady(true);
    })();
    return () => {
      alive = false;
      st.send = false;
      try { if (st.rec && st.rec.state !== 'inactive') st.rec.stop(); } catch {}
      stopAll();
    };
  }, []);
  const finish = (send) => {
    const st = ctl.current;
    if (st.done) return;
    if (send && (!st.rec || Date.now() - st.started < 900)) return;
    st.done = true;
    st.send = !!send;
    playUiSound(send ? 'send' : 'cancel');
    if (st.rec && st.rec.state !== 'inactive') { try { st.rec.stop(); } catch {} }
    if (!send) onCancel('user');
  };
  return (
    <div className="zchat-sheet-up" style={{ position: 'relative', width: '100%', maxWidth: 420, boxSizing: 'border-box', margin: '0 auto', padding: '16px 18px', borderRadius: 26, background: 'rgba(18,22,34,0.86)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
        <span className={reducedMotion() ? undefined : 'zchat-live-dot'} style={{ width: 8, height: 8, borderRadius: '50%', background: ready ? '#FF3B30' : 'rgba(255,255,255,0.4)' }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ready ? `Recording for ${first || 'them'}` : 'Getting the microphone ready'}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCallDuration(secs * 1000)}</span>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 3, height: 34, margin: '12px 2px 14px' }}>
        {bars.map((v, i) => <span key={i} style={{ flex: 1, height: `${Math.round(v * 100)}%`, minHeight: 3, borderRadius: 2, background: i > bars.length - 4 ? theme.coral : 'rgba(255,255,255,0.55)', transition: 'height 0.1s ease-out' }} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div role="button" aria-label="Cancel voice message" onClick={() => finish(false)} className="zchat-press" style={{ height: 44, padding: '0 18px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><X size={17} />Cancel</div>
        <div role="button" aria-label="Send voice message" onClick={() => finish(true)} className="zchat-press" style={{ height: 44, padding: '0 20px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 7, background: ready && secs >= 1 ? theme.coral : 'rgba(255,255,255,0.12)', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s ease' }}><Send size={16} />Send</div>
      </div>
    </div>
  );
}
function CallCaption({ text, who, small }) {
  return (
    <div className="zchat-fade" style={{ maxWidth: '100%', boxSizing: 'border-box', padding: small ? '5px 9px' : '7px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.62)', color: 'white', fontSize: small ? 12.5 : 15, lineHeight: 1.35, fontWeight: 500, textAlign: 'left', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
      {who && <span style={{ fontWeight: 800, marginRight: 6, opacity: 0.85 }}>{who}</span>}{text}
    </div>
  );
}

export function CallScreen({ call, me, nameFor, avatarFor, onAccept, onDecline, onHangup, onToggleMute, onToggleCamera, onFlip, onMinimize, onMuteOther, onCloseSummary, onCallAgain, onMessage, onShareScreen, onToggleSpeaker, speakerOn, onRecordNote, onReact, engine, onDeclineMessage, onVoiceMessage }) {
  useBackClose(!call.minimized && !(call.direction === 'incoming' && call.status === 'ringing'), () => (call.status === 'ended' ? onCloseSummary() : onMinimize()));
  const [focusedTile, setFocusedTile] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [pipCorner, setPipCorner] = useState('tr');
  const [joinCameraOff, setJoinCameraOff] = useState(false);
  const [tileMenu, setTileMenu] = useState(null);
  const [reactOpen, setReactOpen] = useState(false);
  const [emojiMore, setEmojiMore] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const reactPos = useRef(new Map());
  const rootRef = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const capTick = Object.values(call.captions || {}).reduce((a, x) => Math.max(a, x.at || 0), 0);
  const [, setCapNow] = useState(0);
  useEffect(() => {
    if (!capTick) return undefined;
    const t = setTimeout(() => setCapNow(Date.now()), 5200);
    return () => clearTimeout(t);
  }, [capTick]);
  const capOf = (id) => { if (!call.ccOn) return ''; const x = (call.captions || {})[id]; return x && Date.now() - x.at < 5000 ? x.t : ''; };
  const sharerId = Object.keys(call.remoteScreen || {}).find((id) => call.remoteScreen[id] && (call.remoteStreams || {})[id]) || null;
  useEffect(() => {
    if (call.mode !== 'group') return;
    if (sharerId) setFocusedTile(sharerId);
    else setFocusedTile((f) => (f && (call.remoteScreen || {})[f] === false ? null : f));
  }, [sharerId]);
  if (call.room) return <VoiceRoomScreen call={call} me={me} nameFor={nameFor} avatarFor={avatarFor} onHangup={onHangup} onMinimize={onMinimize} onToggleSpeaker={onToggleSpeaker} speakerOn={speakerOn} />;
  const isVideo = call.kind === 'video';
  const isGroup = call.mode === 'group';
  const ringingIn = call.direction === 'incoming' && call.status === 'ringing';
  const ended = call.status === 'ended';
  const remotes = Object.entries(call.remoteStreams || {});
  const title = isGroup ? (call.group ? call.group.name : 'Group call') : (call.peer ? call.peer.name : '');
  const photo = !isGroup && call.peer && typeof call.peer.avatar === 'string' && call.peer.avatar.startsWith('http') ? call.peer.avatar : '';
  const remoteMuted = call.remoteMuted || {};
  const remoteCamOff = call.remoteCameraOff || {};

  if (ended) {
    const d = call.summaryDuration || 0;
    return (
      <div className="zchat-fade" style={{ position: 'fixed', inset: 0, zIndex: 500, background: '#0C0C0E', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: FONT, overflow: 'hidden' }}>
        {photo
          ? <img src={photo} alt="" draggable={false} style={{ position: 'absolute', inset: -40, width: 'calc(100% + 80px)', height: 'calc(100% + 80px)', objectFit: 'cover', filter: 'blur(40px) brightness(0.35)' }} />
          : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${colorForName(title)}55, #0C0C0E 70%)` }} />}
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'flex-end', padding: 'calc(14px + env(safe-area-inset-top)) 16px 0', boxSizing: 'border-box' }}>
          <div role="button" aria-label="Close" onClick={onCloseSummary} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={20} /></div>
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          {isGroup ? <GroupAvatar avatar={call.group && call.group.avatar} name={title} size={112} /> : <Avatar emoji={call.peer && call.peer.avatar} name={title} size={112} />}
          <div style={{ fontSize: String(title || '').length > 28 ? 20 : 26, fontWeight: 800, marginTop: 18, padding: '0 24px', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.15 }}>{title}{!isGroup && call.peer && <VerifiedBadge tier={call.peer.verified} custom={call.peer.custom_badge} size={20} />}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>{call.endLabel || 'Call ended'}</div>
          <div style={{ marginTop: 14, fontSize: 34, fontWeight: 300, letterSpacing: 1, fontVariantNumeric: 'tabular-nums' }}>{d > 0 ? formatCallDuration(d) : '0:00'}</div>
          <div style={{ marginTop: 6, fontSize: 13.5, color: 'rgba(255,255,255,0.6)' }}>
            {isVideo ? 'Video call' : 'Voice call'} ended at {fmtHM(new Date(call.endedAt || Date.now()))}
          </div>
        </div>
        {!isGroup && onVoiceMessage && typeof MediaRecorder !== 'undefined' && call.direction === 'outgoing' && !(d > 0) && call.peer && !call.peer.is_bot && (
          <div style={{ position: 'relative', width: '100%', padding: '0 16px', paddingBottom: recording ? 'calc(34px + env(safe-area-inset-bottom))' : 18, boxSizing: 'border-box', display: 'flex', justifyContent: 'center' }}>
            {recording ? (
              <CallVoiceNote name={title} onCancel={(why) => { setRecording(false); if (engine) engine.keepSummary(false); if (why === 'mic') appSnack('Allow microphone access to leave a voice message'); }}
                onSend={(blob, mime, ext, secs) => { setRecording(false); onVoiceMessage(blob, mime, ext, secs); }} />
            ) : (
              <div role="button" aria-label="Leave a voice message" onClick={() => { hapticTap(); if (engine) engine.keepSummary(true); setRecording(true); }} className="zchat-press"
                style={{ height: 48, padding: '0 22px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 9, background: 'white', color: '#140E24', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
                <Mic size={19} />Leave a voice message
              </div>
            )}
          </div>
        )}
        <div style={{ position: 'relative', display: recording ? 'none' : 'flex', gap: 14, padding: '0 24px', paddingBottom: 'calc(34px + env(safe-area-inset-bottom))' }}>
          {!isGroup && onCallAgain && (
            <>
              <div role="button" aria-label="Call again" onClick={() => onCallAgain('voice')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={24} /></div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Voice</span>
              </div>
              <div role="button" onClick={() => onCallAgain('video')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VideoIcon size={25} /></div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Video</span>
              </div>
            </>
          )}
          {!isGroup && onRecordNote && call.direction === 'outgoing' && !(d > 0) && (
            <div role="button" aria-label="Record a video message" onClick={onRecordNote} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RoundVideoIcon size={25} /></div>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Video note</span>
            </div>
          )}
          <div role="button" onClick={onMessage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={23} /></div>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Message</span>
          </div>
        </div>
      </div>
    );
  }

  let status;
  if (ringingIn) status = isGroup ? `${call.peer ? call.peer.name.split(' ')[0] : 'Someone'} is calling the group` : `Incoming ${isVideo ? 'video' : 'voice'} call`;
  else if (call.reconnecting) status = 'Reconnecting\u2026';
  else if (call.status === 'ringing') status = 'Ringing\u2026';
  else if (call.status === 'connecting') status = 'Connecting\u2026';
  else if (isGroup && !remotes.length) status = 'Waiting for others to join';
  else status = call.startedAt ? formatCallDuration(now - call.startedAt) : '';

  const directRemote = !isGroup && remotes.length ? remotes[0][1] : null;
  const peerId = call.peer ? call.peer.id : null;
  const remoteScreen = call.remoteScreen || {};
  const peerSharing = !!(peerId && remoteScreen[peerId]);
  const remoteVideoOn = !!(directRemote && isVideo && directRemote.getVideoTracks().length > 0 && (peerSharing || !remoteCamOff[peerId]));
  const localVideoOn = !!(isVideo && ((call.localStream && !call.cameraOff) || (call.sharingScreen && call.screenStream)));
  const showRemoteFull = !isGroup && !ringingIn && remoteVideoOn;
  const showLocalFull = !isGroup && !ringingIn && !remoteVideoOn && localVideoOn;

  const tiles = [
    { id: me.id, name: 'You', avatarName: me.name, avatar: me.avatar, stream: call.sharingScreen && call.screenStream ? call.screenStream : call.localStream, local: true, screen: !!(call.sharingScreen && call.screenStream) },
    ...remotes.map(([id, stream]) => ({ id, name: nameFor(id), avatar: avatarFor(id), stream, local: false, screen: !!remoteScreen[id] })),
  ];
  const cols = tiles.length <= 2 ? 1 : 2;
  const rows = Math.ceil(tiles.length / cols);

  const ctrlCount = 3 + (onToggleSpeaker ? 1 : 0) + (isVideo ? 2 : 0) + (isVideo && onShareScreen && canShareScreen() ? 1 : 0) - (engine ? 0 : 1);
  const vwNow = typeof window !== 'undefined' ? window.innerWidth : 390;
  const ctrlW = Math.max(50, Math.min(64, Math.floor((Math.min(vwNow, 520) - 40) / Math.max(1, ctrlCount))));
  const ctrlD = Math.min(60, ctrlW - 4);
  const reactSpot = (r) => {
    if (reactPos.current.has(r.id)) return reactPos.current.get(r.id);
    let spot = null;
    try {
      const root = rootRef.current;
      const el = root && root.querySelector(`[data-cl-tile="${r.from === me.id ? 'me' : r.from}"]`);
      if (root && el) {
        const a = root.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        let h = 0;
        for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) % 997;
        if (b.width > 0 && b.height > 0) spot = { x: Math.round(b.left - a.left + b.width / 2 + ((h % 31) - 15)), y: Math.round(b.top - a.top + Math.min(b.height * 0.7, b.height - 40)) };
      }
    } catch {}
    reactPos.current.set(r.id, spot);
    if (reactPos.current.size > 40) reactPos.current.delete(reactPos.current.keys().next().value);
    return spot;
  };
  const ctrl = (icon, label, onClick, variant) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, minWidth: ctrlW }}>
      <div role="button" aria-label={label} onClick={onClick} style={{
        width: ctrlD, height: ctrlD, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: variant === 'end' ? '#FF3B30' : variant === 'on' ? 'white' : 'rgba(255,255,255,0.16)', color: variant === 'on' ? '#140E24' : 'white',
        transition: 'background 0.2s ease',
      }}>{icon}</div>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{label}</span>
    </div>
  );

  return (
    <div ref={rootRef} className="zchat-fade" aria-hidden={call.minimized ? 'true' : undefined} style={{ position: 'fixed', inset: 0, zIndex: call.minimized ? -1 : 500, background: '#0C0C0E', color: 'white', display: 'flex', visibility: call.minimized ? 'hidden' : 'visible', pointerEvents: call.minimized ? 'none' : 'auto', flexDirection: 'column', overflow: 'hidden', fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {photo
          ? <img src={photo} alt="" draggable={false} style={{ position: 'absolute', inset: -40, width: 'calc(100% + 80px)', height: 'calc(100% + 80px)', objectFit: 'cover', filter: 'blur(40px) brightness(0.42)' }} />
          : <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 28%, ${colorForName(title)}66, #0C0C0E 72%)` }} />}
      </div>
      {!isGroup && (
        <>
          <div style={{ position: 'absolute', inset: 0, opacity: showRemoteFull ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
            {directRemote && <CallVideo stream={directRemote} fit={peerSharing ? 'contain' : 'cover'} remote={isVideo} />}
          </div>
          <div style={{ position: 'absolute', inset: 0, opacity: showLocalFull ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: 'none' }}>
            {call.sharingScreen && call.screenStream && isVideo ? <CallVideo stream={call.screenStream} muted fit="contain" /> : call.localStream && isVideo && <CallVideo stream={call.localStream} muted mirror={call.facing === 'user'} />}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          </div>
          {!isVideo && remotes.map(([id, stream]) => <CallAudio key={id} stream={stream} />)}
        </>
      )}

      {isGroup && !ringingIn && (
        <>
          {focusedTile && tiles.some((t) => t.id === focusedTile) ? (
            <div style={{ position: 'absolute', left: 8, right: 8, top: 'calc(96px + env(safe-area-inset-top))', bottom: 'calc(150px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateRows: 'minmax(0, 1fr)', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                {tiles.filter((t) => t.id === focusedTile).map((t) => (
                  <CallTile key={t.id} tile={t} isVideo={isVideo} facing={call.facing} focused screen={t.screen} caption={capOf(t.local ? me.id : t.id)}
                    muted={t.local ? call.muted : !!remoteMuted[t.id]} cameraOff={t.local ? call.cameraOff : !!remoteCamOff[t.id]}
                    onMenu={!t.local ? () => setTileMenu(t) : null} onFocus={() => setFocusedTile(null)} />
                ))}
              </div>
              {tiles.length > 1 && (
                <div style={{ height: 96, display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0 }}>
                  {tiles.filter((t) => t.id !== focusedTile).map((t) => (
                    <div key={t.id} style={{ width: 80, flexShrink: 0, display: 'grid', gridTemplateRows: 'minmax(0, 1fr)', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                      <CallTile tile={t} isVideo={isVideo} facing={call.facing} screen={t.screen}
                        muted={t.local ? call.muted : !!remoteMuted[t.id]} cameraOff={t.local ? call.cameraOff : !!remoteCamOff[t.id]}
                        onMenu={!t.local ? () => setTileMenu(t) : null} onFocus={() => setFocusedTile(t.id)} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{
              position: 'absolute', left: 8, right: 8, top: 'calc(96px + env(safe-area-inset-top))', bottom: 'calc(150px + env(safe-area-inset-bottom))',
              display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gap: 8,
            }}>
              {tiles.map((t) => (
                <CallTile key={t.id} tile={t} isVideo={isVideo} facing={call.facing} screen={t.screen} caption={capOf(t.local ? me.id : t.id)}
                  muted={t.local ? call.muted : !!remoteMuted[t.id]} cameraOff={t.local ? call.cameraOff : !!remoteCamOff[t.id]}
                  onMenu={!t.local ? () => setTileMenu(t) : null} onFocus={() => { setFocusedTile(t.id); playUiSound('tap'); }} />
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(10px + env(safe-area-inset-top)) 14px 0' }}>
        {!ringingIn ? (
          <div role="button" aria-label="Back to chats" onClick={onMinimize} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <ChevronRight size={22} style={{ transform: 'rotate(90deg)' }} />
          </div>
        ) : <div style={{ width: 42 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}><Lock size={11} /> End to end encrypted</div>
        {!ringingIn && call.status !== 'ended' && onReact ? (
          <div role="button" aria-label="Send a reaction" onClick={() => setReactOpen((v) => !v)} style={{ width: 42, height: 42, borderRadius: '50%', background: reactOpen ? 'white' : 'rgba(255,255,255,0.14)', color: reactOpen ? '#140E24' : 'white', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Smile size={21} />
          </div>
        ) : <div style={{ width: 42 }} />}
      </div>
      {reactOpen && !ringingIn && (
        <div className="zchat-pop" style={{ position: 'absolute', zIndex: 6, top: 'calc(62px + env(safe-area-inset-top))', right: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 2, padding: '6px 7px', borderRadius: 26, background: 'rgba(18,22,34,0.82)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {['\u2764\uFE0F', '\u{1F602}', '\u{1F62E}', '\u{1F44F}', '\u{1F525}', '\u{1F44D}', '\u{1F389}'].map((e) => (
              <div key={e} role="button" aria-label={`React ${e}`} onClick={() => { hapticTap(); if (onReact) onReact(e); }} style={{ width: 38, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, cursor: 'pointer', borderRadius: '50%' }}>{e}</div>
            ))}
            <div role="button" aria-label={emojiMore ? 'Fewer reactions' : 'More reactions'} aria-expanded={emojiMore} onClick={() => { hapticTap(); setEmojiMore((v) => !v); }} style={{ width: 38, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', color: 'rgba(255,255,255,0.85)' }}>
              <Plus size={22} style={{ transform: emojiMore ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s ease' }} />
            </div>
          </div>
          {emojiMore && (
            <div className="zchat-pop" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 40px)', gap: 2, padding: 6, borderRadius: 20, background: 'rgba(18,22,34,0.86)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {CALL_MORE_EMOJI.map((e) => (
                <div key={e} role="button" aria-label={`React ${e}`} onClick={() => { hapticTap(); if (onReact) onReact(e); }} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'pointer', borderRadius: '50%' }}>{e}</div>
              ))}
            </div>
          )}
        </div>
      )}
      {!ringingIn && engine && CALL_SR && !call.ccOn && call.ccShare !== false && !call.muted && !call.ccNoted && Object.values(call.ccWant || {}).some(Boolean) && (
        <div className="zchat-fade" style={{ position: 'absolute', zIndex: 6, left: 12, right: 12, bottom: 'calc(150px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px 10px 12px', borderRadius: 16, background: 'rgba(18,22,34,0.9)', border: '1px solid rgba(255,255,255,0.1)', maxWidth: 520, margin: '0 auto' }}>
          <span style={{ display: 'flex', flexShrink: 0, color: 'rgba(255,255,255,0.85)' }}><CaptionsGlyph size={20} /></span>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.9)' }}>Captions are on in this call. What you say goes through your browser's speech service.</div>
          <div role="button" aria-label="Stop captions for my voice" onClick={() => engine.setCaptionShare(false)} className="zchat-press" style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.14)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>Stop</div>
          <div role="button" aria-label="Keep captions on" onClick={() => engine.noteCaptions()} className="zchat-press" style={{ padding: '7px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.14)', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>OK</div>
        </div>
      )}
      {!isGroup && !ringingIn && (capOf(peerId) || capOf(me.id)) && (
        <div style={{ position: 'absolute', zIndex: 4, left: 16, right: 16, bottom: 'calc(150px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none', maxWidth: 560, margin: '0 auto' }}>
          {capOf(peerId) && <CallCaption text={capOf(peerId)} />}
          {capOf(me.id) && <CallCaption text={capOf(me.id)} who="You" small />}
        </div>
      )}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
        {(call.reactions || []).filter((r) => now - r.at < 3500).map((r) => {
          let h = 0;
          for (let i = 0; i < r.id.length; i++) h = (h * 31 + r.id.charCodeAt(i)) % 997;
          const mine = r.from === me.id;
          const x = mine && !isGroup ? 62 + (h % 22) : 18 + (h % 64);
          const who = mine ? '' : (isGroup ? (nameFor(r.from) || '').split(' ')[0] : '');
          const spot = reactSpot(r);
          return (
            <div key={r.id} className="zchat-react-float" style={{ position: 'absolute', ...(spot ? { left: spot.x, top: spot.y } : { left: `${x}%`, bottom: 'calc(170px + env(safe-area-inset-bottom))' }), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 46, lineHeight: 1, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.35))' }}>{r.e}</span>
              {who && <span style={{ fontSize: 12, fontWeight: 700, textShadow: '0 1px 6px rgba(0,0,0,0.75)' }}>{who}</span>}
            </div>
          );
        })}
      </div>

      {(isGroup ? ringingIn : !showRemoteFull) ? (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginTop: '9vh', padding: '0 24px' }}>
          <div data-cl-tile={!isGroup && peerId ? peerId : undefined} style={{ position: 'relative' }}>
            {(call.status === 'ringing' || call.status === 'connecting') && (
              <>
                <div className="zchat-call-ring" style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.28)' }} />
                <div className="zchat-call-ring" style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.18)', animationDelay: '0.9s' }} />
              </>
            )}
            {isGroup ? <GroupAvatar avatar={call.group && call.group.avatar} name={title} size={122} /> : <Avatar emoji={call.peer && call.peer.avatar} name={title} size={122} />}
          </div>
          <div style={{ marginTop: 22, fontSize: String(title || '').length > 28 ? 21 : 29, fontWeight: 800, padding: '0 24px', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.15, textShadow: '0 2px 14px rgba(0,0,0,0.5)' }}>{title}{!isGroup && call.peer && <VerifiedBadge tier={call.peer.verified} custom={call.peer.custom_badge} size={22} />}</div>
          <div style={{ marginTop: 6, fontSize: 15, color: 'rgba(255,255,255,0.82)', fontVariantNumeric: 'tabular-nums' }}>{status}</div>
          {!isGroup && peerId && remoteMuted[peerId] && !ringingIn && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}><MicOff size={14} color="#FF6B6B" /> {title.split(' ')[0]} is muted</div>}
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.6)', fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {!isGroup && peerId && remoteMuted[peerId] && <MicOff size={13} color="#FF6B6B" />}{isGroup && remotes.length > 0 && <Users size={13} />}{status}{isGroup && remotes.length > 0 ? `, ${tiles.length} in call` : ''}
          </div>
        </div>
      )}

      {!isGroup && localVideoOn && remoteVideoOn && !ringingIn && (
        <div data-cl-tile="me" onClick={() => setPipCorner((c) => (c === 'tr' ? 'tl' : c === 'tl' ? 'bl' : c === 'bl' ? 'br' : 'tr'))} style={{
          position: 'absolute', zIndex: 4, width: 104, height: 150, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 10px 26px rgba(0,0,0,0.45)', cursor: 'pointer',
          top: pipCorner[0] === 't' ? 'calc(70px + env(safe-area-inset-top))' : 'auto', bottom: pipCorner[0] === 'b' ? 'calc(160px + env(safe-area-inset-bottom))' : 'auto',
          left: pipCorner[1] === 'l' ? 14 : 'auto', right: pipCorner[1] === 'r' ? 14 : 'auto', transition: 'top 0.25s ease, bottom 0.25s ease, left 0.25s ease, right 0.25s ease',
        }}>
          <CallVideo stream={call.sharingScreen && call.screenStream ? call.screenStream : call.localStream} muted mirror={!call.sharingScreen && call.facing === 'user'} />
        </div>
      )}

      <div style={{ flex: 1 }} />
      {ringingIn ? (
        <div style={{ position: 'relative', zIndex: 4, padding: '0 34px', paddingBottom: 'calc(46px + env(safe-area-inset-bottom))' }}>
          {isVideo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
              <div role="button" aria-label={joinCameraOff ? 'Camera off when you join' : 'Camera on when you join'} aria-pressed={!joinCameraOff} onClick={() => { hapticTap(); setJoinCameraOff((v) => !v); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: joinCameraOff ? 'white' : 'rgba(255,255,255,0.16)', color: joinCameraOff ? '#140E24' : 'white', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', transition: 'background 0.2s ease, color 0.2s ease' }}>
                  {joinCameraOff ? <VideoOff size={22} /> : <VideoIcon size={22} />}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{joinCameraOff ? 'Camera off' : 'Camera on'}</span>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 320, margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div role="button" aria-label="Decline" onClick={onDecline} style={{ width: 76, height: 76, borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><PhoneOff size={30} /></div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Decline</span>
            </div>
            {onDeclineMessage && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div role="button" aria-label="Decline with a message" onClick={() => { hapticTap(); setDeclineOpen(true); }} className="zchat-press" style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><MessageSquare size={23} /></div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Message</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div role="button" aria-label="Accept" onClick={() => onAccept({ cameraOff: isVideo && joinCameraOff })} className="zchat-call-pulse" style={{ width: 76, height: 76, borderRadius: '50%', background: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {isVideo ? <VideoIcon size={31} /> : <Phone size={30} />}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Accept</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 4, margin: '0 10px', marginBottom: 'calc(14px + env(safe-area-inset-bottom))', padding: '16px 10px 14px', borderRadius: 30, background: 'rgba(18,22,34,0.72)', backdropFilter: 'blur(22px) saturate(160%)', WebkitBackdropFilter: 'blur(22px) saturate(160%)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-evenly' }}>
          {ctrl(call.muted ? <MicOff size={24} /> : <Mic size={24} />, call.muted ? 'Unmute' : 'Mute', onToggleMute, call.muted ? 'on' : null)}
          {onToggleSpeaker && ctrl(speakerOn ? <Volume2 size={24} /> : <Volume1 size={24} />, speakerOn ? 'Speaker' : 'Call audio', onToggleSpeaker, speakerOn ? null : 'on')}
          {isVideo && ctrl(call.cameraOff ? <VideoOff size={24} /> : <VideoIcon size={24} />, call.cameraOff ? 'Camera' : 'Camera', onToggleCamera, call.cameraOff ? 'on' : null)}
          {isVideo && ctrl(<SwitchCamera size={24} />, 'Flip', onFlip)}
          {isVideo && onShareScreen && canShareScreen() && ctrl(<ScreenShareGlyph size={23} />, call.sharingScreen ? 'Stop sharing' : 'Share screen', onShareScreen, call.sharingScreen ? 'on' : null)}
          {engine && !call.moving && ctrl(<MoreDotsIcon size={24} />, 'More', () => { hapticTap(); setMoreOpen(true); }, moreOpen || (call.voiceFx && call.voiceFx !== 'off') || (call.bg && call.bg !== 'off') || call.ccOn ? 'on' : null)}
          {ctrl(<PhoneOff size={26} />, 'End', onHangup, 'end')}
        </div>
      )}
      {moreOpen && engine && !ringingIn && <CallMoreSheet call={call} engine={engine} onClose={() => setMoreOpen(false)} />}
      {declineOpen && ringingIn && onDeclineMessage && <CallDeclineSheet name={title} onPick={(t) => { setDeclineOpen(false); onDeclineMessage(t); }} onClose={() => setDeclineOpen(false)} />}

      {tileMenu && (
        <div onClick={() => setTileMenu(null)} style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} className="zchat-sheet-up" style={{ width: '100%', background: '#141926', borderRadius: '24px 24px 0 0', padding: '14px 0', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 20px 12px' }}>
              <Avatar emoji={tileMenu.avatar} name={tileMenu.name} size={40} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>{tileMenu.name}</div>
            </div>
            <div onClick={() => { onMuteOther(tileMenu.id); setTileMenu(null); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', fontWeight: 700, opacity: remoteMuted[tileMenu.id] ? 0.45 : 1 }}>
              <MicOff size={19} /> {remoteMuted[tileMenu.id] ? 'Already muted' : `Mute ${tileMenu.name.split(' ')[0]}`}
            </div>
            <div onClick={() => setTileMenu(null)} style={{ padding: '14px 20px', cursor: 'pointer', fontWeight: 700, opacity: 0.7 }}>Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NewCallPage({ userId, onClose, onCall }) {
  useBackClose(true, onClose);
  const { theme } = useTheme();
  const [people, setPeople] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: mine }, { data: theirs }] = await Promise.all([
        supabase.from('follows').select('following_id').eq('follower_id', userId).eq('status', 'accepted').limit(400),
        supabase.from('follows').select('follower_id').eq('following_id', userId).eq('status', 'accepted').limit(400),
      ]);
      const back = new Set((theirs || []).map((r) => r.follower_id));
      const ids = [...new Set((mine || []).map((r) => r.following_id).filter((id) => back.has(id)))];
      if (!ids.length) { if (alive) setPeople([]); return; }
      const { data: profs } = await fetchProfilesView(ids);
      if (!alive) return;
      setPeople(sanitizeAvatarList(profs, userId).filter((p) => !p.is_deleted && !p.is_bot).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    })();
    return () => { alive = false; };
  }, [userId]);
  const term = q.trim().toLowerCase();
  const shown = (people || []).filter((p) => !term || (p.name || '').toLowerCase().includes(term) || (p.username || '').toLowerCase().includes(term));
  return (
    <FullPage title="New call" subtitle="People who follow you back" onBack={onClose} zIndex={60}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', borderRadius: 12, background: theme.rowBg, color: theme.muted, margin: '8px 0 6px' }}>
        <Search size={17} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search people to call" autoCapitalize="none"
          style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: 'transparent', color: theme.ink, fontFamily: FONT, fontSize: 15 }} />
        {q && <X size={16} style={{ cursor: 'pointer' }} onClick={() => setQ('')} />}
      </label>
      {people === null ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner color={theme.muted} /></div>
      ) : !shown.length ? (
        <EmptyState art={term ? 'nothing' : 'calls'} title={term ? 'No one matches' : 'Nobody to call yet'} text={term ? 'Try another name.' : 'You can call people once you follow each other.'} />
      ) : shown.map((p) => (
        <UserListRow key={p.id} profile={p} rightContent={
          <div style={{ display: 'flex', gap: 8 }}>
            <div role="button" aria-label={`Voice call ${p.name}`} onClick={() => { onClose(); setTimeout(() => onCall(p, 'voice'), 60); }} className="zchat-press" style={{ width: 44, height: 44, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Phone size={21} strokeWidth={1.8} /></div>
            <div role="button" aria-label={`Video call ${p.name}`} onClick={() => { onClose(); setTimeout(() => onCall(p, 'video'), 60); }} className="zchat-press" style={{ width: 44, height: 44, color: theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><VideoIcon size={23} strokeWidth={1.8} /></div>
          </div>
        } />
      ))}
    </FullPage>
  );
}

function VoiceFxGlyph({ k, size = 26 }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const body = (() => {
    if (k === 'chipmunk') return <><path d="M3 16q1.5-3.8 3 0t3 0 3 0 3 0 3 0 3 0" {...p} /><path d="M26 22.5V9.5M22.6 12.9 26 9.5l3.4 3.4" {...p} /></>;
    if (k === 'helium') return <><path d="M16 4.6c3.6 0 6.2 2.8 6.2 6.5 0 4.2-3.4 7.9-6.2 7.9s-6.2-3.7-6.2-7.9c0-3.7 2.6-6.5 6.2-6.5z" {...p} /><path d="M14.9 19.3h2.2L16 20.7z" {...p} /><path d="M16 21c-1.5 1.6 1.5 2.7 0 4.3s1.3 2.4.4 3.2" {...p} /><path d="M12.7 9.6c.5-1.4 1.5-2.3 2.8-2.6" {...p} opacity="0.55" /></>;
    if (k === 'deep') return <><path d="M3 16c3-7.4 6-7.4 9 0s6 7.4 9 0" {...p} /><path d="M26 9.5v13M22.6 19.1 26 22.5l3.4-3.4" {...p} /></>;
    if (k === 'giant') return <path d="M4 16c2.4-11 5.6-11 8 0s5.6 11 8 0 5.6-11 8 0" {...p} />;
    if (k === 'robot') return <path d="M4 20h4.5v-8h5v8h5v-8h5v8H28" {...p} />;
    if (k === 'echo') return <><path d="M3 16q2.25-8.5 4.5 0t4.5 0" {...p} /><path d="M13.5 16q2.25-5.6 4.5 0t4.5 0" {...p} opacity="0.6" /><path d="M24 16q1.25-3.2 2.5 0t2.5 0" {...p} opacity="0.35" /></>;
    if (k === 'underwater') return <><path d="M4 22.5c2-3.2 4-3.2 6 0s4 3.2 6 0 4-3.2 6 0 4 3.2 6 0" {...p} /><circle cx="11" cy="12.5" r="2.6" {...p} /><circle cx="18.6" cy="8.3" r="1.7" {...p} /><circle cx="20.4" cy="14.2" r="1.2" {...p} /></>;
    if (k === 'slow') return <><path d="M4.5 23h17c2.8 0 5-2.2 5-5v-1.6" {...p} /><circle cx="14" cy="16.3" r="6.2" {...p} /><path d="M14 16.3c0-1.3 1-2.2 2.2-2 1.5.2 2.2 1.8 1.7 3.2-.6 1.8-2.6 2.6-4.4 2-2.2-.8-3.1-3.3-2.3-5.3" {...p} /><path d="M25.4 15.6l-1-3.4M27.6 15.6l1-3.4" {...p} /></>;
    if (k === 'stadium') return <><ellipse cx="16" cy="12" rx="12" ry="4.4" {...p} /><path d="M4 12v7c0 2.5 5.4 4.5 12 4.5s12-2 12-4.5v-7" {...p} /><ellipse cx="16" cy="12" rx="5.4" ry="1.7" {...p} opacity="0.6" /></>;
    if (k === 'radio') return <><rect x="4.5" y="12" width="23" height="14" rx="3.2" {...p} /><path d="M9.5 12 20 5.2" {...p} /><circle cx="20.4" cy="19" r="3.4" {...p} /><path d="M8.6 16.4h5M8.6 19.2h5M8.6 22h5" {...p} /></>;
    return <path d="M4 16c2-5.6 4-5.6 6 0s4 5.6 6 0 4-5.6 6 0 4 5.6 6 0" {...p} />;
  })();
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{body}</svg>;
}
export function VoiceFxPicker({ value, onPick }) {
  const { theme } = useTheme();
  const line = theme.dark ? 'rgba(255,255,255,0.13)' : 'rgba(17,17,19,0.09)';
  const ink = kitOnInk(theme);
  const rowRef = useRef(null);
  useLayoutEffect(() => {
    const row = rowRef.current;
    const el = row && row.querySelector('[aria-checked="true"]');
    if (!row || !el) return;
    const left = el.offsetLeft - 14;
    const right = el.offsetLeft + el.offsetWidth + 14;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      const to = Math.max(0, left < row.scrollLeft ? left : right - row.clientWidth);
      try { row.scrollTo({ left: to, behavior: reducedMotion() ? 'auto' : 'smooth' }); } catch { row.scrollLeft = to; }
    }
  }, [value]);
  return (
    <div ref={rowRef} role="radiogroup" aria-label="Voice effects" style={{ position: 'relative', display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '6px 0 0 14px', margin: '0 -14px' }}>
      {VOICE_FX.map(([k, l]) => {
        const on = value === k;
        return (
          <div key={k} role="radio" aria-checked={on} aria-label={`Voice effect ${l}`} onClick={() => onPick(k)} className="zchat-press"
            style={{ flex: '0 0 auto', minWidth: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: theme.dark ? '#1F1E25' : '#F1F0F6', boxShadow: on ? `0 0 0 2px ${theme.bgGradient}, 0 0 0 4px ${theme.coral}` : `inset 0 0 0 1px ${line}`, color: on ? ink : theme.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow 160ms ease, color 160ms ease' }}>
              <VoiceFxGlyph k={k} size={28} />
            </div>
            <div style={{ fontSize: 11.5, lineHeight: 1.2, fontWeight: on ? 700 : 600, color: on ? ink : theme.ink2, whiteSpace: 'nowrap' }}>{l}</div>
          </div>
        );
      })}
      <div aria-hidden="true" style={{ flex: '0 0 auto', width: 4 }} />
    </div>
  );
}

export function VoiceTypingSheet({ onClose, onText }) {
  const { theme } = useTheme();
  const [text, setText] = useState('');
  const [interim, setInterim] = useState('');
  const [state, setState] = useState('starting');
  const recRef = useRef(null);
  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setState('unsupported'); return; }
    try { if (recRef.current) recRef.current.abort(); } catch {}
    const rec = new SR();
    rec.lang = navigator.language || 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (e) => {
      let fin = '';
      let mid = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript;
      }
      if (fin.trim()) setText((t) => (t ? `${t} ${fin.trim()}` : fin.trim()));
      setInterim(mid);
    };
    rec.onerror = (e) => setState(e && (e.error === 'not-allowed' || e.error === 'service-not-allowed') ? 'denied' : 'stopped');
    rec.onend = () => { setInterim(''); setState((s) => (s === 'listening' ? 'stopped' : s)); };
    try { rec.start(); setState('listening'); } catch { setState('stopped'); }
    recRef.current = rec;
  };
  useEffect(() => { start(); return () => { try { const r = recRef.current; if (r) { r.onresult = null; r.onend = null; r.onerror = null; r.abort(); } } catch {} }; }, []);
  const stop = () => { try { if (recRef.current) recRef.current.stop(); } catch {} setState('stopped'); };
  const finish = () => { stop(); const t = `${text}${interim ? ` ${interim}` : ''}`.trim(); if (t) onText(t); onClose(); };
  const listening = state === 'listening';
  return (
    <PaintSheet title="Voice typing" onClose={onClose} z={96}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0 4px' }}>
        <div role="button" aria-label={listening ? 'Stop listening' : 'Start listening'} onClick={() => (listening ? stop() : start())} className={listening ? 'zchat-call-pulse' : 'zchat-press'}
          style={{ width: 84, height: 84, borderRadius: '50%', background: listening ? theme.coral : theme.rowBg, color: listening ? '#fff' : theme.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Mic size={34} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: theme.muted, marginTop: 12 }}>
          {state === 'unsupported' ? 'This browser cannot do voice typing' : state === 'denied' ? 'Allow the microphone to use voice typing' : listening ? 'Listening, just talk' : 'Tap the mic to talk again'}
        </div>
      </div>
      <div style={{ minHeight: 90, margin: '14px 0 12px', padding: '12px 14px', borderRadius: 14, background: theme.rowBg, fontSize: 16, lineHeight: 1.45, color: theme.ink, wordBreak: 'break-word' }}>
        {text}{interim && <span style={{ color: theme.muted }}>{text ? ' ' : ''}{interim}</span>}
        {!text && !interim && <span style={{ color: theme.muted }}>Your words show up here</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
        <div style={{ flex: 1 }}><BigButton label="Clear" tone="plain" disabled={!text} onClick={() => setText('')} /></div>
        <div style={{ flex: 1 }}><BigButton label="Add to message" disabled={!text && !interim} onClick={finish} /></div>
      </div>
    </PaintSheet>
  );
}
