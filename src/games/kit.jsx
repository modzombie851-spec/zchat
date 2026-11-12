import { backdropProps } from './tap.js';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { TRACKS, makeVoices, makeIR } from './music.jsx';
import { sceneUrl, sceneTone, sceneMusic, sceneKeyFor } from './scenes.jsx';
import { gameFaces } from './faces.jsx';
import { useLiveCast, CastEye, CastLayer, CastSheet, injectCastCss } from './livecast.jsx';

const SOUND_KEY = 'zchat-game-sound';
const MUSIC_KEY = 'zchat-game-music';
const KIT_FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const sfxDefs = new Map();
const listeners = new Set();
let ctx = null;
let master = null;
let mainGain = null;
let musicBus = null;
let musicDuck = null;
let duckT = 0;
let visHooked = false;

function readFlag(key) {
  try { return localStorage.getItem(key) !== '0'; } catch { return true; }
}
function pageHidden() {
  try { return typeof document !== 'undefined' && document.visibilityState === 'hidden'; } catch { return false; }
}

export function audioCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC({ latencyHint: 'interactive' });
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -9;
      lim.knee.value = 6;
      lim.ratio.value = 5;
      lim.attack.value = 0.003;
      lim.release.value = 0.18;
      lim.connect(ctx.destination);
      mainGain = ctx.createGain();
      mainGain.gain.value = 0.9;
      mainGain.connect(lim);
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(mainGain);
      musicDuck = ctx.createGain();
      musicDuck.gain.value = 1;
      musicDuck.connect(mainGain);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.3;
      musicBus.connect(musicDuck);
      ctx.addEventListener && ctx.addEventListener('statechange', () => { syncMusic(); if (ctx && ctx.state !== 'running' && !pageHidden()) armUnlock(); });
      if (typeof document !== 'undefined' && !visHooked) { visHooked = true; document.addEventListener('visibilitychange', onVisible); window.addEventListener('pageshow', onVisible); window.addEventListener('focus', onVisible); }
    } catch { ctx = null; return null; }
  }
  if (ctx.state !== 'running' && !pageHidden()) ctx.resume().catch(() => {});
  return ctx;
}

export function audioOut() {
  audioCtx();
  return master;
}

export function soundOn() { return readFlag(SOUND_KEY); }
export function musicOn() { return readFlag(MUSIC_KEY); }

function setFlag(key, on) {
  try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
  listeners.forEach((fn) => { try { fn(); } catch {} });
}

export function setSoundOn(on) { setFlag(SOUND_KEY, on); }
export function setMusicOn(on) { setFlag(MUSIC_KEY, on); syncMusic(); }

export function defineSfx(name, play) {
  sfxDefs.set(name, play);
}

function duckMusic() {
  if (!musicDuck || !ctx || !mus.key) return;
  const t = ctx.currentTime;
  try {
    musicDuck.gain.cancelScheduledValues(t);
    musicDuck.gain.setTargetAtTime(0.55, t, 0.015);
    musicDuck.gain.setTargetAtTime(1, t + 0.28, 0.18);
  } catch {}
  clearTimeout(duckT);
}

export function sfx(name, opts) {
  if (!soundOn()) return;
  const play = sfxDefs.get(name);
  if (!play) return;
  const c = audioCtx();
  if (!c || !master || c.state !== 'running') return;
  duckMusic();
  try { play(c, master, opts || {}); } catch {}
}

export function haptic(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 10); } catch {}
}

function noiseBuffer(c, secs) {
  const len = Math.max(1, Math.floor(c.sampleRate * secs));
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function clickSound(c, out, { freq = 1800, decay = 0.05, gain = 0.5, q = 4, delay = 0 } = {}) {
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, decay + 0.02);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(bp).connect(g).connect(out);
  src.start(t);
  src.stop(t + decay + 0.03);
}

export function toneSound(c, out, { freq = 660, to, dur = 0.12, type = 'sine', gain = 0.25, delay = 0 } = {}) {
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function thock(c, out, { freq = 180, to = 110, gain = 0.4, decay = 0.09, click = 700, delay = 0 } = {}) {
  toneSound(c, out, { freq, to, dur: decay + 0.04, gain, delay });
  clickSound(c, out, { freq: click, decay: decay * 0.8, gain: gain * 0.7, q: 1.6, delay });
}

defineSfx('tap', (c, out) => clickSound(c, out, { freq: 2400, decay: 0.03, gain: 0.25 }));
defineSfx('move', (c, out) => clickSound(c, out, { freq: 900, decay: 0.07, gain: 0.45, q: 2 }));
defineSfx('win', (c, out) => { [523, 659, 784, 1046].forEach((f, i) => toneSound(c, out, { freq: f, dur: 0.22, gain: 0.18, delay: i * 0.09, type: 'triangle' })); });
defineSfx('lose', (c, out) => { [392, 330, 262].forEach((f, i) => toneSound(c, out, { freq: f, dur: 0.26, gain: 0.16, delay: i * 0.12, type: 'triangle' })); });
defineSfx('turn', (c, out) => toneSound(c, out, { freq: 880, to: 1175, dur: 0.12, gain: 0.12, type: 'sine' }));
defineSfx('select', (c, out) => { clickSound(c, out, { freq: 1500, decay: 0.035, gain: 0.3, q: 3 }); toneSound(c, out, { freq: 940, dur: 0.05, gain: 0.05 }); });
defineSfx('place', (c, out) => thock(c, out, { freq: 210, to: 120, gain: 0.42, click: 820 }));
defineSfx('capture', (c, out) => { thock(c, out, { freq: 230, to: 130, gain: 0.45, click: 900 }); thock(c, out, { freq: 170, to: 100, gain: 0.3, click: 1300, delay: 0.07 }); });
defineSfx('check', (c, out) => { toneSound(c, out, { freq: 784, dur: 0.14, gain: 0.12, type: 'triangle' }); toneSound(c, out, { freq: 988, dur: 0.18, gain: 0.12, type: 'triangle', delay: 0.11 }); });
defineSfx('king', (c, out) => { [659, 784, 988, 1319].forEach((f, i) => toneSound(c, out, { freq: f, dur: 0.16, gain: 0.1, delay: i * 0.06, type: 'triangle' })); });
defineSfx('ball', (c, out, o) => { const v = Math.max(0.15, Math.min(1, o.v == null ? 0.7 : o.v)); clickSound(c, out, { freq: 3600, decay: 0.025, gain: 0.5 * v, q: 6 }); toneSound(c, out, { freq: 2300, dur: 0.05, gain: 0.08 * v }); });
defineSfx('cue', (c, out, o) => { const v = Math.max(0.2, Math.min(1, o.v == null ? 0.7 : o.v)); clickSound(c, out, { freq: 1200, decay: 0.04, gain: 0.5 * v, q: 2 }); toneSound(c, out, { freq: 160, to: 90, dur: 0.08, gain: 0.25 * v }); });
defineSfx('pocket', (c, out) => { toneSound(c, out, { freq: 150, to: 80, dur: 0.18, gain: 0.35 }); clickSound(c, out, { freq: 380, decay: 0.12, gain: 0.35, q: 1.2, delay: 0.02 }); clickSound(c, out, { freq: 900, decay: 0.05, gain: 0.15, q: 3, delay: 0.09 }); });
defineSfx('cushion', (c, out, o) => { const v = Math.max(0.1, Math.min(1, o.v == null ? 0.5 : o.v)); toneSound(c, out, { freq: 120, to: 80, dur: 0.07, gain: 0.25 * v }); });
defineSfx('putt', (c, out, o) => { const v = Math.max(0.2, Math.min(1, o.v == null ? 0.6 : o.v)); clickSound(c, out, { freq: 2000, decay: 0.03, gain: 0.4 * v, q: 3 }); toneSound(c, out, { freq: 420, to: 300, dur: 0.06, gain: 0.12 * v }); });
defineSfx('cup', (c, out) => { [0, 0.06, 0.11, 0.15].forEach((d, i) => clickSound(c, out, { freq: 1600 - i * 200, decay: 0.03, gain: 0.3 - i * 0.05, q: 5, delay: d })); toneSound(c, out, { freq: 1568, dur: 0.4, gain: 0.08, delay: 0.2, type: 'sine' }); });
defineSfx('pop', (c, out) => toneSound(c, out, { freq: 520, to: 1040, dur: 0.09, gain: 0.14 }));
defineSfx('splash', (c, out) => { [0, 0.05, 0.12].forEach((d, i) => clickSound(c, out, { freq: 900 - i * 180, decay: 0.12, gain: 0.22 - i * 0.05, q: 0.8, delay: d })); toneSound(c, out, { freq: 260, to: 120, dur: 0.22, gain: 0.08, delay: 0.04, type: 'sine' }); });
defineSfx('bumper', (c, out, o) => { const v = Math.max(0.15, Math.min(1, o.v == null ? 0.6 : o.v)); toneSound(c, out, { freq: 300, to: 520, dur: 0.08, gain: 0.18 * v, type: 'triangle' }); clickSound(c, out, { freq: 1800, decay: 0.02, gain: 0.2 * v, q: 4 }); });
defineSfx('bubble', (c, out) => { toneSound(c, out, { freq: 880, dur: 0.07, gain: 0.08 }); toneSound(c, out, { freq: 1320, dur: 0.09, gain: 0.07, delay: 0.06 }); });
defineSfx('join', (c, out) => { toneSound(c, out, { freq: 660, dur: 0.12, gain: 0.1, type: 'triangle' }); toneSound(c, out, { freq: 990, dur: 0.16, gain: 0.1, type: 'triangle', delay: 0.09 }); });
defineSfx('leave', (c, out) => { toneSound(c, out, { freq: 784, dur: 0.12, gain: 0.08, type: 'triangle' }); toneSound(c, out, { freq: 523, dur: 0.16, gain: 0.08, type: 'triangle', delay: 0.09 }); });
defineSfx('count', (c, out) => toneSound(c, out, { freq: 740, dur: 0.1, gain: 0.14, type: 'triangle' }));
defineSfx('go', (c, out) => toneSound(c, out, { freq: 1108, dur: 0.24, gain: 0.16, type: 'triangle' }));
defineSfx('drop', (c, out) => { toneSound(c, out, { freq: 340, to: 170, dur: 0.1, gain: 0.3 }); clickSound(c, out, { freq: 1100, decay: 0.03, gain: 0.25, q: 3, delay: 0.08 }); });
defineSfx('mark', (c, out) => { clickSound(c, out, { freq: 3000, decay: 0.05, gain: 0.18, q: 1 }); clickSound(c, out, { freq: 2600, decay: 0.05, gain: 0.14, q: 1, delay: 0.05 }); });
defineSfx('flip', (c, out) => { thock(c, out, { freq: 260, to: 160, gain: 0.3, click: 1400 }); clickSound(c, out, { freq: 1800, decay: 0.03, gain: 0.18, q: 3, delay: 0.05 }); });
defineSfx('error', (c, out) => toneSound(c, out, { freq: 196, dur: 0.16, gain: 0.12, type: 'triangle' }));
defineSfx('xp', (c, out) => { toneSound(c, out, { freq: 1046, dur: 0.1, gain: 0.08 }); toneSound(c, out, { freq: 1568, dur: 0.16, gain: 0.07, delay: 0.07 }); });
defineSfx('levelup', (c, out) => { [523, 659, 784, 1046, 1319].forEach((f, i) => toneSound(c, out, { freq: f, dur: 0.3, gain: 0.11, delay: i * 0.075, type: 'triangle' })); toneSound(c, out, { freq: 2093, dur: 0.6, gain: 0.05, delay: 0.38 }); });

const mus = { want: null, key: null, timer: 0, step: 0, next: 0, loop: 0, out: null, voices: null, rev: null, revBuf: null };

function musicTick() {
  mus.timer = 0;
  const c = ctx;
  const tr = TRACKS[mus.key];
  if (!c || !tr || c.state !== 'running') return;
  const sp = (60 / tr.bpm) * (4 / tr.spb);
  const per = tr.spb * tr.bars;
  while (mus.next < c.currentTime + 0.32) {
    const pos = mus.step % per;
    if (pos === 0 && mus.step) mus.loop += 1;
    const bar = Math.floor(pos / tr.spb);
    const s = pos % tr.spb;
    let t = mus.next;
    if (tr.swing && s % 2 === 1) t += sp * tr.swing;
    try { tr.play(mus.voices, bar, s, t, sp, mus.loop); } catch {}
    mus.next += sp;
    mus.step += 1;
  }
  mus.timer = setTimeout(musicTick, 80);
}

function fadeOutMusic() {
  if (mus.timer) { clearTimeout(mus.timer); mus.timer = 0; }
  const old = mus.out;
  mus.out = null;
  mus.voices = null;
  mus.key = null;
  if (old && ctx) {
    try {
      const t = ctx.currentTime;
      old.gain.cancelScheduledValues(t);
      old.gain.setValueAtTime(old.gain.value, t);
      old.gain.linearRampToValueAtTime(0.0001, t + 0.45);
      setTimeout(() => { try { old.disconnect(); } catch {} }, 700);
    } catch {}
  }
}

function startMusic(key) {
  const c = ctx;
  if (!c || !musicBus || !TRACKS[key]) return;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.linearRampToValueAtTime(1, c.currentTime + 1.6);
  out.connect(musicBus);
  try {
    if (!mus.revBuf) mus.revBuf = makeIR(c, 2.2);
    const rev = c.createConvolver();
    rev.buffer = mus.revBuf;
    const wet = c.createGain();
    wet.gain.value = 0.28;
    out.connect(rev).connect(wet).connect(musicBus);
  } catch {}
  mus.out = out;
  mus.voices = makeVoices(c, out);
  mus.key = key;
  mus.step = 0;
  mus.loop = 0;
  mus.next = c.currentTime + 0.15;
  musicTick();
}

function syncMusic() {
  const want = mus.want && musicOn() && !pageHidden() ? mus.want : null;
  if (!want) { if (mus.key) fadeOutMusic(); return; }
  const c = ctx;
  if (!c || c.state !== 'running') { if (mus.key) fadeOutMusic(); return; }
  if (mus.key === want && mus.timer) return;
  if (mus.key) fadeOutMusic();
  startMusic(want);
}

function onVisible() {
  if (!ctx) return;
  if (pageHidden()) {
    fadeOutMusic();
    if (!mus.want) return;
    setTimeout(() => { if (pageHidden() && ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); }, 500);
    return;
  }
  if (ctx.state !== 'running') { ctx.resume().then(() => syncMusic(), () => {}); armUnlock(); setTimeout(() => { if (ctx && ctx.state !== 'running' && !pageHidden()) armUnlock(); }, 400); }
  else syncMusic();
}
function rebuildCtx() {
  try { fadeOutMusic(); } catch {}
  try { if (ctx) ctx.close(); } catch {}
  ctx = null; master = null; mainGain = null; musicBus = null; musicDuck = null;
  mus.key = null; mus.timer = 0; mus.out = null; mus.voices = null; mus.rev = null;
  audioCtx();
  syncMusic();
}

let armed = false;
function armUnlock() {
  if (armed || typeof document === 'undefined') return;
  armed = true;
  const go = () => {
    unlockAudio();
    ['pointerdown', 'keydown', 'touchend'].forEach((e) => document.removeEventListener(e, go, true));
    armed = false;
  };
  ['pointerdown', 'keydown', 'touchend'].forEach((e) => document.addEventListener(e, go, true));
}

export function unlockAudio() {
  const c = audioCtx();
  if (!c) return;
  try {
    const b = c.createBuffer(1, 1, c.sampleRate);
    const s = c.createBufferSource();
    s.buffer = b;
    s.connect(c.destination);
    s.start(0);
  } catch {}
  if (c.state !== 'running') {
    c.resume().then(() => syncMusic(), () => {});
    setTimeout(() => { if (ctx === c && c.state !== 'running' && !pageHidden()) rebuildCtx(); }, 700);
  } else syncMusic();
}

export function playMusic(key) {
  mus.want = TRACKS[key] ? key : null;
  const c = audioCtx();
  if (!c || c.state !== 'running') armUnlock();
  syncMusic();
}

export function stopMusic(key) {
  if (key && mus.want !== key) return;
  mus.want = null;
  syncMusic();
}

export function musicNow() { return mus.key; }
if (typeof window !== 'undefined' && window.__zfake) window.__zgrAudio = () => ({ ctx: ctx ? ctx.state : null, music: mus.key, want: mus.want, sound: soundOn(), musicOn: musicOn() });
export const MUSIC_TRACKS = Object.keys(TRACKS);

export function useRoomMusic(track, active = true) {
  useEffect(() => {
    if (!active || !track) return undefined;
    playMusic(track);
    return () => stopMusic(track);
  }, [track, active]);
}

export function useGameKit() {
  const [, setN] = useState(0);
  useEffect(() => {
    const fn = () => setN((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { sfx, haptic, soundOn: soundOn(), musicOn: musicOn(), setSoundOn, setMusicOn, audioCtx, audioOut, playMusic, stopMusic, unlockAudio };
}

const ROOM_CSS = `
.zgr-root{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;touch-action:manipulation}
.zgr-in{animation:zgr-in .34s cubic-bezier(.2,.9,.25,1) both}
@keyframes zgr-in{from{opacity:0;transform:scale(1.035)}to{opacity:1;transform:none}}
.zgr-press{transition:transform .12s ease}
.zgr-press:active{transform:scale(.93)}
.zgr-ring{animation:zgr-ring 1.4s ease-out infinite}
@keyframes zgr-ring{0%{box-shadow:0 0 0 0 var(--zgr-ring)}100%{box-shadow:0 0 0 11px rgba(0,0,0,0)}}
.zgr-float{animation:zgr-float 2.4s cubic-bezier(.2,.7,.3,1) forwards}
@keyframes zgr-float{0%{transform:translate(-50%,0) scale(.35);opacity:0}12%{transform:translate(-50%,-26px) scale(1.08);opacity:1}72%{opacity:1}100%{transform:translate(-50%,-300px) scale(.92);opacity:0}}
.zgr-pop{animation:zgr-pop .24s cubic-bezier(.2,1.5,.4,1) both}
@keyframes zgr-pop{from{transform:scale(.55);opacity:0}to{transform:none;opacity:1}}
.zgr-up{animation:zgr-up .26s cubic-bezier(.2,.9,.25,1) both}
@keyframes zgr-up{from{transform:translateY(18px);opacity:0}to{transform:none;opacity:1}}
.zgr-fadeout{animation:zgr-fadeout .38s ease both}
@keyframes zgr-fadeout{to{opacity:0;visibility:hidden}}
.zgr-art{animation:zgr-art .9s cubic-bezier(.2,.9,.25,1) both}
@keyframes zgr-art{from{transform:translateY(22px) scale(.9);opacity:0}to{transform:none;opacity:1}}
.zgr-sheen{animation:zgr-sheen 1.2s ease .35s both}
@keyframes zgr-sheen{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.zgr-toast{animation:zgr-toast 2.6s ease both}
@keyframes zgr-toast{0%{opacity:0;transform:translate(-50%,10px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-14px)}}
.zgr-scroll{scrollbar-width:none}.zgr-scroll::-webkit-scrollbar{display:none}
.zgr-still *,.zgr-still{animation-duration:.01s!important;animation-iteration-count:1!important;transition-duration:.01s!important}
.zgr-still .zgr-float{animation:none!important;transform:translate(-50%,-60px)!important;opacity:1!important}
.zgr-face{animation:zgr-face 1.1s cubic-bezier(.3,1.4,.5,1) both;transform-origin:50% 80%}
@keyframes zgr-face{0%{transform:scale(.4) rotate(-14deg)}35%{transform:scale(1.18) rotate(9deg)}55%{transform:scale(.96) rotate(-6deg)}75%{transform:scale(1.04) rotate(3deg)}100%{transform:none}}
.zgr-still .zgr-face{animation:none!important}
.zgr-still .zgr-toast{animation:none!important;transform:translate(-50%,0)!important;opacity:1!important}
@media (prefers-reduced-motion:reduce){.zgr-root *,.zgr-root{animation-duration:.01s!important;animation-iteration-count:1!important;transition-duration:.01s!important}}
`;
let cssDone = false;
function injectRoomCss() {
  if (cssDone || typeof document === 'undefined') return;
  cssDone = true;
  const el = document.createElement('style');
  el.setAttribute('data-zgr', '1');
  el.textContent = ROOM_CSS;
  document.head.appendChild(el);
}

const Ico = {
  back: (c) => <path d="M15 5l-7 7 7 7" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  sound: (c, on) => <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill={c} />{on ? <><path d="M15.5 9a4 4 0 0 1 0 6" /><path d="M18 6.5a7.5 7.5 0 0 1 0 11" /></> : <path d="M16 9.5l5 5M21 9.5l-5 5" />}</g>,
  music: (c, on) => <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 17.5V6l10-2v11.5" /><circle cx="6.8" cy="17.6" r="2.4" fill={c} /><circle cx="16.8" cy="15.6" r="2.4" fill={c} />{!on && <path d="M3.5 3.5l17 17" />}</g>,
  more: (c) => <g fill={c}><circle cx="5.5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="18.5" cy="12" r="2" /></g>,
  chat: (c) => <path d="M5 5.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7.5L7 21v-3.5H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="none" stroke={c} strokeWidth="2" strokeLinejoin="round" />,
  react: (c) => <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="8.6" /><path d="M8.3 14.2a4.6 4.6 0 0 0 7.4 0" /><circle cx="9" cy="10" r="0.9" fill={c} /><circle cx="15" cy="10" r="0.9" fill={c} /></g>,
  send: (c) => <path d="M4 12l15-7-5 15-2.5-6z" fill={c} />,
  close: (c) => <path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="2.4" strokeLinecap="round" />,
  eye: (c, on) => <g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.6 12c2-3.9 5.3-6.2 9.4-6.2s7.4 2.3 9.4 6.2c-2 3.9-5.3 6.2-9.4 6.2S4.6 15.9 2.6 12z" /><circle cx="12" cy="12" r="2.9" />{!on && <path d="M4.5 4.5l15 15" />}</g>,
};
export function KitIcon({ name, size = 22, color = '#FFFFFF', on = true }) {
  const draw = Ico[name];
  if (!draw) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>{draw(color, on)}</svg>;
}

function GlassBtn({ label, onClick, children, size = 40, tone, style }) {
  return (
    <button type="button" aria-label={label} onPointerDown={(e) => { e.stopPropagation(); if (e.button > 0 || !onClick) return; e.currentTarget.dataset.pd = String(Date.now()); onClick(e); }} onClick={(e) => { e.stopPropagation(); if (!onClick || Date.now() - Number(e.currentTarget.dataset.pd || 0) < 800) return; onClick(e); }} className="zgr-press"
      style={{ width: size, height: size, borderRadius: size / 2, border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: tone || 'rgba(0,0,0,0.38)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)', color: '#FFFFFF', flexShrink: 0, ...style }}>
      {children}
    </button>
  );
}

export function RoomButton({ label, onClick, kind = 'glass', disabled, style, ariaLabel, small }) {
  const bg = kind === 'go' ? 'linear-gradient(180deg, #52D681 0%, #2FB463 100%)' : kind === 'gold' ? 'linear-gradient(180deg, #FFD36B 0%, #F2A93B 100%)' : kind === 'danger' ? 'rgba(220,60,60,0.88)' : 'rgba(255,255,255,0.14)';
  const fg = kind === 'gold' ? '#3A2508' : '#FFFFFF';
  const shadow = kind === 'go' ? '0 3px 0 #1E8A47' : kind === 'gold' ? '0 3px 0 #B9741C' : 'inset 0 0 0 1px rgba(255,255,255,0.18)';
  return (
    <button type="button" aria-label={ariaLabel || label} disabled={disabled} onClick={(e) => { e.stopPropagation(); if (!disabled && onClick) onClick(e); }} className="zgr-press"
      style={{ height: small ? 36 : 46, padding: small ? '0 14px' : '0 20px', borderRadius: small ? 18 : 23, border: 'none', background: bg, color: fg, boxShadow: shadow, fontFamily: KIT_FONT, fontSize: small ? 13.5 : 15.5, fontWeight: 800, letterSpacing: '-0.01em', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', ...style }}>
      {label}
    </button>
  );
}

function Face({ p, size, ring, turn }) {
  const face = p && p.avatar && typeof p.avatar === 'object' ? p.avatar : null;
  const url = p && typeof p.avatar === 'string' && /^(https?:|blob:|data:|\/)/.test(p.avatar) ? p.avatar : null;
  const initial = String((p && p.name) || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={turn ? 'zgr-ring' : undefined} style={{ '--zgr-ring': `${ring}AA`, position: 'relative', width: size, height: size, borderRadius: '50%', flexShrink: 0, boxShadow: turn ? `0 0 0 3px ${ring}` : '0 0 0 2px rgba(255,255,255,0.28)', transition: 'box-shadow .25s ease' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#3B3550', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: size * 0.42, fontFamily: KIT_FONT }}>
        {face || (url ? <img src={url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial)}
      </div>
      {p && p.here != null && <span aria-hidden="true" style={{ position: 'absolute', right: -1, bottom: -1, width: Math.round(size * 0.28), height: Math.round(size * 0.28), borderRadius: '50%', background: p.here ? '#3DDC84' : '#8E8A9E', boxShadow: '0 0 0 2.5px rgba(10,10,16,0.9)' }} />}
    </div>
  );
}

function Plate({ p, side, tone, small }) {
  if (!p) return <div style={{ flex: 1 }} />;
  const right = side === 'right';
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: small ? 8 : 10, flexDirection: right ? 'row-reverse' : 'row' }}>
      <Face p={p} size={small ? 38 : 50} ring={tone.ring} turn={!!p.turn} />
      <div style={{ minWidth: 0, textAlign: right ? 'right' : 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: right ? 'row-reverse' : 'row' }}>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 92, textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}>{p.name}</span>
          {p.level ? <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 900, color: tone.ink || '#1A1408', background: tone.accent, borderRadius: 7, padding: '2px 5px', lineHeight: '12px' }}>{`Lv ${p.level}`}</span> : null}
        </div>
        {(p.line != null || p.clock) && <div style={{ marginTop: 3, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.82)', display: 'flex', alignItems: 'center', gap: 6, flexDirection: right ? 'row-reverse' : 'row', justifyContent: 'flex-start', minHeight: 14 }}>{p.clock || null}{p.line}</div>}
      </div>
    </div>
  );
}

function Splash({ splash, sceneSrc, tone, done, still }) {
  const [gone, setGone] = useState(false);
  useEffect(() => { if (done) { const t = setTimeout(() => setGone(true), still ? 30 : 420); return () => clearTimeout(t); } return undefined; }, [done]);
  if (gone) return null;
  const pl = splash.players || [];
  return (
    <div className={done ? 'zgr-fadeout' : undefined} style={{ position: 'absolute', inset: 0, zIndex: 30, background: `#0A0A10 url("${sceneSrc}") center / cover no-repeat`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(100% 60% at 50% 45%, rgba(0,0,0,0.15), rgba(0,0,0,0.6))' }} />
      {splash.art && <div className="zgr-art" style={{ position: 'relative', borderRadius: 30, overflow: 'hidden', boxShadow: '0 22px 50px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.12)' }}>{splash.art}</div>}
      <div className="zgr-sheen" style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', textShadow: '0 3px 14px rgba(0,0,0,0.6)' }}>{splash.title}</div>
        {splash.sub && <div style={{ marginTop: 4, fontSize: 14.5, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{splash.sub}</div>}
      </div>
      {pl.length === 2 && (
        <div className="zgr-sheen" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Face p={pl[0]} size={58} ring={tone.ring} />
          <span style={{ fontSize: 15, fontWeight: 900, color: tone.accent, letterSpacing: '0.04em' }}>VS</span>
          <Face p={pl[1]} size={58} ring={tone.ring} />
        </div>
      )}
    </div>
  );
}

function Bubble({ b, side }) {
  if (!b) return null;
  const right = side === 'right';
  if (b.file) {
    return (
      <div key={b.id} className="zgr-pop" role="status" aria-label="Reaction" style={{ position: 'absolute', top: 62, [right ? 'right' : 'left']: 8, zIndex: 12, padding: b.face ? 6 : 4, borderRadius: 22, background: '#FFFFFF', boxShadow: '0 8px 22px rgba(0,0,0,0.3)' }}>
        <span aria-hidden="true" style={{ position: 'absolute', top: -6, [right ? 'right' : 'left']: 20, width: 12, height: 12, background: '#FFFFFF', transform: 'rotate(45deg)', borderRadius: 2 }} />
        <img src={b.file} alt="" draggable={false} decoding="async" className={b.face ? 'zgr-face' : undefined} style={{ position: 'relative', display: 'block', width: b.face ? 62 : 72, height: b.face ? 62 : 72, objectFit: 'contain' }} />
      </div>
    );
  }
  return (
    <div key={b.id} className="zgr-pop" role="status" style={{ position: 'absolute', top: 66, [right ? 'right' : 'left']: 8, zIndex: 12, maxWidth: 210, padding: '8px 12px', borderRadius: 16, background: '#FFFFFF', color: '#16131F', fontSize: 14, fontWeight: 700, lineHeight: 1.3, boxShadow: '0 8px 22px rgba(0,0,0,0.35)', transformOrigin: right ? '85% 0' : '15% 0', wordBreak: 'break-word' }}>
      <span aria-hidden="true" style={{ position: 'absolute', top: -6, [right ? 'right' : 'left']: 20, width: 12, height: 12, background: '#FFFFFF', transform: 'rotate(45deg)', borderRadius: 2 }} />
      <span style={{ position: 'relative' }}>{b.text}</span>
    </div>
  );
}

const PHRASES_DEFAULT = ['Good luck', 'Nice one', 'Well played', 'Oops', 'Your turn', 'Wow', 'Thanks', 'Rematch?'];

function ChatTray({ phrases, onSay, onClose }) {
  const [text, setText] = useState('');
  const send = (t) => { const v = String(t || '').trim().slice(0, 60); if (!v) return; onSay(v); setText(''); onClose(); };
  return (
    <div className="zgr-up" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 10, right: 10, bottom: 'calc(70px + env(safe-area-inset-bottom))', zIndex: 20, borderRadius: 22, padding: 12, background: 'rgba(16,14,24,0.92)', boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {(phrases || PHRASES_DEFAULT).map((p) => (
          <button key={p} type="button" onClick={() => send(p)} className="zgr-press" style={{ height: 34, padding: '0 13px', borderRadius: 17, border: 'none', background: 'rgba(255,255,255,0.12)', color: '#FFFFFF', fontFamily: KIT_FONT, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>{p}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={text} onChange={(e) => setText(e.target.value.slice(0, 60))} placeholder="Say something" aria-label="Say something" maxLength={60}
          style={{ flex: 1, minWidth: 0, height: 40, borderRadius: 20, border: 'none', outline: 'none', padding: '0 14px', background: 'rgba(255,255,255,0.1)', color: '#FFFFFF', fontFamily: KIT_FONT, fontSize: 15 }} />
        <GlassBtn label="Send" onClick={() => send(text)} tone="#3DDC84"><KitIcon name="send" size={18} color="#0B2414" /></GlassBtn>
      </form>
    </div>
  );
}

function ReactTray({ stickers, onPick }) {
  const faces = stickers.filter((s) => s.face);
  const rest = stickers.filter((s) => !s.face);
  const [tab, setTab] = useState(() => { try { return (faces.length && localStorage.getItem('zchat-game-react-tab') !== 'stickers') || !rest.length ? 'faces' : 'stickers'; } catch { return 'faces'; } });
  const pickTab = (t) => { setTab(t); try { localStorage.setItem('zchat-game-react-tab', t); } catch {} };
  const list = tab === 'faces' && faces.length ? faces : rest;
  const cols = tab === 'faces' && faces.length ? 4 : 6;
  return (
    <div className="zgr-up" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', left: 10, right: 10, bottom: 'calc(70px + env(safe-area-inset-bottom))', zIndex: 20, borderRadius: 22, padding: '8px 8px 10px', background: 'rgba(16,14,24,0.94)', boxShadow: '0 16px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
      {faces.length > 0 && rest.length > 0 && (
        <div role="tablist" aria-label="Reactions" style={{ display: 'flex', gap: 6, padding: '2px 4px 8px' }}>
          {[['faces', 'Faces'], ['stickers', 'Stickers']].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => pickTab(k)} className="zgr-press"
              style={{ height: 32, padding: '0 14px', borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: KIT_FONT, fontSize: 13.5, fontWeight: 800, background: tab === k ? '#FFFFFF' : 'rgba(255,255,255,0.1)', color: tab === k ? '#16131F' : 'rgba(255,255,255,0.86)' }}>{label}</button>
          ))}
        </div>
      )}
      <div className="zgr-scroll" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 4, maxHeight: 236, overflowY: 'auto' }}>
        {list.map((s) => (
          <button key={s.key} type="button" aria-label={`React ${s.label}`} onClick={() => onPick(s)} className="zgr-press" style={{ border: 'none', background: 'transparent', padding: s.face ? 6 : 2, cursor: 'pointer', aspectRatio: '1 / 1' }}>
            <img src={s.file} alt="" draggable={false} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

const LayerCtx = React.createContext(null);
export function RoomLayer({ children }) {
  const host = useContext(LayerCtx);
  if (!host) return children;
  return ReactDOM.createPortal(<div style={{ pointerEvents: 'auto' }}>{children}</div>, host);
}

export function RoomSheet({ title, text, onClose, children }) {
  return (
    <div {...backdropProps(onClose)} style={{ position: 'absolute', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="zgr-up" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, borderRadius: '26px 26px 0 0', background: '#17141F', padding: '18px 18px calc(18px + env(safe-area-inset-bottom))', boxShadow: '0 -12px 40px rgba(0,0,0,0.5)', color: '#FFFFFF', fontFamily: KIT_FONT }}>
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '-6px auto 12px' }} />
        {title && <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: '-0.01em' }}>{title}</div>}
        {text && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 6, lineHeight: 1.5 }}>{text}</div>}
        {children}
      </div>
    </div>
  );
}

const LAND_Q = '(orientation: landscape) and (max-height: 560px)';
export function useLandPhone() {
  const get = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(LAND_Q).matches;
  const [v, setV] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const m = window.matchMedia(LAND_Q);
    const f = () => setV(m.matches);
    if (m.addEventListener) m.addEventListener('change', f); else if (m.addListener) m.addListener(f);
    window.addEventListener('resize', f);
    f();
    return () => { if (m.removeEventListener) m.removeEventListener('change', f); else if (m.removeListener) m.removeListener(f); window.removeEventListener('resize', f); };
  }, []);
  return v;
}

export function GameRoom({ title, scene, top, bottom, onClose, children, k, sceneKey, sub, music, players, center, status, statusHot, controls, menu, rules, splash, ready = true, social, floats, toast, still, zIndex = 80, onMenu, overlay, cast }) {
  injectRoomCss();
  injectCastCss();
  const castRoot = useRef(null);
  const live = useLiveCast({ ...(cast || {}), active: !!cast && cast.active !== false, rootRef: castRoot });
  const land = useLandPhone();
  const [castOpen, setCastOpen] = useState(false);
  const skey = sceneKeyFor(sceneKey || k || 'lounge');
  const tone = sceneTone(skey);
  const src = typeof scene === 'string' ? scene : sceneUrl(skey);
  const kit = useGameKit();
  const track = music === false ? null : (music || sceneMusic(skey));
  useRoomMusic(track, true);
  const [tray, setTray] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [bubbles, setBubbles] = useState({});
  const [flying, setFlying] = useState([]);
  const [splashDone, setSplashDone] = useState(!splash);
  const [layer, setLayer] = useState(null);
  const timers = useRef([]);
  const readyRef = useRef(ready);
  readyRef.current = ready;
  useEffect(() => {
    if (!splash) return undefined;
    const t0 = Date.now();
    const min = still ? 250 : 950;
    const iv = setInterval(() => { if ((readyRef.current && Date.now() - t0 >= min) || Date.now() - t0 > 3200) { clearInterval(iv); setSplashDone(true); } }, 80);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); };
  const playersRef = useRef(players);
  playersRef.current = players;
  const sideOf = (from) => {
    const pl = playersRef.current;
    if (!pl) return 'left';
    const i = pl.findIndex((p) => p && p.id === from);
    return i === 1 ? 'right' : 'left';
  };
  const showBubble = (from, text) => {
    const side = sideOf(from);
    const id = `${Date.now()}${Math.random()}`;
    setBubbles((b) => ({ ...b, [side]: { id, text } }));
    sfx('bubble');
    later(() => setBubbles((b) => (b[side] && b[side].id === id ? { ...b, [side]: null } : b)), 4200);
  };
  const socialRef = useRef(social);
  socialRef.current = social;
  const findSticker = (key) => {
    const list = (socialRef.current && socialRef.current.stickers) || [];
    return list.find((x) => x.key === key) || gameFaces().find((x) => x.key === key) || null;
  };
  const showFloat = (from, file, face) => {
    const side = sideOf(from);
    const id = `${Date.now()}${Math.random()}`;
    if (playersRef.current) {
      setBubbles((b) => ({ ...b, [side]: { id, file, face: !!face } }));
      sfx('pop');
      later(() => setBubbles((b) => (b[side] && b[side].id === id ? { ...b, [side]: null } : b)), 3400);
      return;
    }
    setFlying((f) => [...f.slice(-6), { id, file, face: !!face, side, x: side === 'right' ? 66 + Math.random() * 16 : 18 + Math.random() * 16 }]);
    sfx('pop');
    later(() => setFlying((f) => f.filter((x) => x.id !== id)), 2500);
  };
  useEffect(() => {
    if (!social || !social.on) return undefined;
    const offA = social.on('say', (d) => { if (d && typeof d.text === 'string') showBubble(d.from, d.text.slice(0, 60)); });
    const offB = social.on('rx', (d) => { const s = d && typeof d.s === 'string' ? findSticker(d.s) : null; if (s) showFloat(d.from, s.file, s.face); });
    return () => { if (offA) offA(); if (offB) offB(); };
  }, [social && social.on]);
  const say = (text) => { if (!social) return; social.send('say', { text }); showBubble(social.me, text); };
  const react = (s) => { if (!social) return; setTray(null); social.send('rx', { s: s.key }); showFloat(social.me, s.file, s.face); haptic(8); };
  const close = () => { if (onClose) onClose(); };
  const menuItems = [...(rules ? [{ label: 'How to play', onClick: () => setShowRules(true) }] : []), ...(menu || [])];
  const body = (
    <LayerCtx.Provider value={layer}>
    <div ref={castRoot} className={`zgr-root zgr-in${still ? ' zgr-still' : ''}`} onClick={() => { if (tray) setTray(null); }}
      style={{ position: 'fixed', inset: 0, zIndex, background: '#0A0A10', color: '#FFFFFF', fontFamily: KIT_FONT, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {scene && typeof scene !== 'string' ? <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>{scene}</div> : <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 74%, rgba(0,0,0,0.55) 100%)' }} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, padding: land ? 'calc(4px + env(safe-area-inset-top)) calc(12px + env(safe-area-inset-right)) 4px calc(12px + env(safe-area-inset-left))' : 'calc(8px + env(safe-area-inset-top)) 12px 6px' }}>
        <GlassBtn label="Back" onClick={close}><KitIcon name="back" size={22} /></GlassBtn>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{title}</div>
          {sub && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
        {cast && <CastEye cast={live} size={36} onOpen={() => setCastOpen(true)} />}
        <GlassBtn label={kit.soundOn ? 'Turn sound off' : 'Turn sound on'} onClick={() => { setSoundOn(!kit.soundOn); unlockAudio(); }} size={36}><KitIcon name="sound" size={19} on={kit.soundOn} /></GlassBtn>
        <GlassBtn label={kit.musicOn ? 'Turn music off' : 'Turn music on'} onClick={() => { setMusicOn(!kit.musicOn); unlockAudio(); }} size={36}><KitIcon name="music" size={19} on={kit.musicOn} /></GlassBtn>
        {(menuItems.length > 0 || onMenu) && <GlassBtn label="More" onClick={() => (onMenu ? onMenu() : setShowMenu(true))} size={36}><KitIcon name="more" size={19} /></GlassBtn>}
      </div>
      {land ? (
        <div style={{ position: 'relative', zIndex: 2, flex: 1, minHeight: 0, display: 'flex', gap: 10, padding: '0 calc(10px + env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left))' }}>
          <div className="zgr-side" style={{ width: 'clamp(190px, 29vw, 270px)', flexShrink: 0, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 2 }}>
            {players && (
              <div style={{ position: 'relative', zIndex: 3, padding: '8px 10px', borderRadius: 18, background: tone.glass, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 8px 22px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <Plate p={players[0]} side="left" tone={tone} small />
                <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: center != null ? '#FFFFFF' : tone.accent, lineHeight: '18px' }}>{center != null ? center : 'vs'}</div>
                <Plate p={players[1]} side="left" tone={tone} small />
                <Bubble b={bubbles.left} side="left" />
                <Bubble b={bubbles.right} side="right" />
              </div>
            )}
            {status ? <div key={status} className="zgr-pop" role="status" style={{ alignSelf: 'center', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 800, textAlign: 'center', color: statusHot ? (tone.ink || '#1A1408') : '#FFFFFF', background: statusHot ? tone.accent : 'rgba(0,0,0,0.42)', flexShrink: 0 }}>{status}</div> : null}
            {top && <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>{top}</div>}
            {controls && <div style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}>{controls}</div>}
            <div style={{ flex: 1 }} />
            {(bottom || social) && (
              <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
                {social && <GlassBtn label="Chat" size={42} onClick={() => setTray(tray === 'chat' ? null : 'chat')} tone={tray === 'chat' ? 'rgba(255,255,255,0.28)' : undefined}><KitIcon name="chat" size={20} /></GlassBtn>}
                {bottom && <div style={{ minWidth: 0, display: 'flex', justifyContent: 'center' }}>{bottom}</div>}
                {social && <GlassBtn label="React" size={42} onClick={() => setTray(tray === 'react' ? null : 'react')} tone={tray === 'react' ? 'rgba(255,255,255,0.28)' : undefined}><KitIcon name="react" size={21} /></GlassBtn>}
              </div>
            )}
          </div>
          <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
        </div>
      ) : (
        <>
      {players && (
        <div style={{ position: 'relative', zIndex: 3, margin: '4px 10px 0', padding: '10px 12px', borderRadius: 22, background: tone.glass, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plate p={players[0]} side="left" tone={tone} />
          <div style={{ flexShrink: 0, minWidth: 48, textAlign: 'center', fontSize: 20, fontWeight: 900, fontVariantNumeric: 'tabular-nums', color: '#FFFFFF', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>{center != null ? center : <span style={{ fontSize: 13, color: tone.accent, letterSpacing: '0.06em' }}>VS</span>}</div>
          <Plate p={players[1]} side="right" tone={tone} />
          <Bubble b={bubbles.left} side="left" />
          <Bubble b={bubbles.right} side="right" />
        </div>
      )}
      {status ? (
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', marginTop: 10, minHeight: 28 }}>
          <div key={status} className="zgr-pop" role="status" style={{ padding: '6px 14px', borderRadius: 999, fontSize: 13.5, fontWeight: 800, color: statusHot ? (tone.ink || '#1A1408') : '#FFFFFF', background: statusHot ? tone.accent : 'rgba(0,0,0,0.42)', boxShadow: statusHot ? `0 4px 16px ${tone.accent}55` : 'inset 0 0 0 1px rgba(255,255,255,0.12)' }}>{status}</div>
        </div>
      ) : players ? <div aria-hidden="true" style={{ marginTop: 10, height: 28, flexShrink: 0 }} /> : null}
      {top && <div style={{ position: 'relative', zIndex: 2 }}>{top}</div>}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      {controls && <div style={{ position: 'relative', zIndex: 2, padding: '0 12px 6px' }}>{controls}</div>}
      {(bottom || social) && (
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px calc(10px + env(safe-area-inset-bottom))' }}>
          {social && <GlassBtn label="Chat" size={46} onClick={() => setTray(tray === 'chat' ? null : 'chat')} tone={tray === 'chat' ? 'rgba(255,255,255,0.28)' : undefined}><KitIcon name="chat" size={22} /></GlassBtn>}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>{bottom}</div>
          {social && <GlassBtn label="React" size={46} onClick={() => setTray(tray === 'react' ? null : 'react')} tone={tray === 'react' ? 'rgba(255,255,255,0.28)' : undefined}><KitIcon name="react" size={23} /></GlassBtn>}
        </div>
      )}
        </>
      )}
      {tray === 'chat' && social && <ChatTray phrases={social.phrases} onSay={say} onClose={() => setTray(null)} />}
      {tray === 'react' && social && <ReactTray stickers={social.stickers || []} onPick={react} />}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none' }}>
        {flying.concat(floats || []).map((f) => (
          <div key={f.id} className="zgr-float" style={{ position: 'absolute', left: `${f.x}%`, bottom: 'calc(120px + env(safe-area-inset-bottom))', width: 96, height: 96 }}>
            {f.file ? <img src={f.file} alt="" className={f.face ? 'zgr-face' : undefined} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))' }} /> : f.node}
          </div>
        ))}
      </div>
      {toast && <div key={toast.id} className="zgr-toast" role="status" style={{ position: 'absolute', left: '50%', top: 'calc(170px + env(safe-area-inset-top))', zIndex: 25, padding: '9px 16px', borderRadius: 999, background: 'rgba(16,14,24,0.9)', color: tone.accent, fontWeight: 900, fontSize: 15, boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.12)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{toast.text}</div>}
      {overlay}
      <div ref={setLayer} style={{ position: 'absolute', inset: 0, zIndex: 36, pointerEvents: 'none' }} />
      {showMenu && (
        <RoomSheet title={title} onClose={() => setShowMenu(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            {menuItems.map((m) => <RoomButton key={m.label} label={m.label} kind={m.danger ? 'danger' : 'glass'} onClick={() => { setShowMenu(false); m.onClick(); }} style={{ width: '100%' }} />)}
          </div>
        </RoomSheet>
      )}
      {showRules && rules && (
        <RoomSheet title="How to play" onClose={() => setShowRules(false)}>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '64vh', overflowY: 'auto' }}>
            {(rules.how || []).map((line, i) => <div key={i} style={{ display: 'flex', gap: 10, fontSize: 14.5, lineHeight: 1.45, color: 'rgba(255,255,255,0.88)' }}><span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span><span>{line}</span></div>)}
            {rules.win && <div style={{ marginTop: 6, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.08)', fontSize: 14, lineHeight: 1.45 }}>{rules.win}</div>}
            {rules.guide || null}
          </div>
        </RoomSheet>
      )}
      {splash && <Splash splash={splash} sceneSrc={src} tone={tone} done={splashDone} still={still} />}
      {cast && <CastLayer cast={live} z={zIndex + 6} mine={cast.mine} />}
      {cast && castOpen && <CastSheet cast={live} z={zIndex + 8} onClose={() => setCastOpen(false)} />}
    </div>
    </LayerCtx.Provider>
  );
  if (typeof document === 'undefined') return body;
  return ReactDOM.createPortal(body, document.body);
}
