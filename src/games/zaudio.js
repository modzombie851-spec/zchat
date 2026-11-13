import { Sfx } from './sfx.js';

const FILES = {
  g_rifle: 0.75, g_smg: 1.5, g_pistol: 0.8, g_sniper: 0.85, g_shotgun: 0.9,
  r_rifle: 0.55, r_pistol: 0.9, r_sniper: 0.6, r_pump: 0.65, r_cock: 0.75, dry: 0.6,
  boom: 0.95, boom2: 0.9, whoosh: 0.7, pin: 0.5,
  z_growl: 0.6, z_hurt: 0.6, z_death: 0.6, z_moan: 0.55, z_war: 0.6, z_die1: 0.6, z_die2: 0.6, z_pain1: 0.6, z_pain2: 0.55, z_pain3: 0.5,
  stinger: 0.7, bone: 0.55, d_bark1: 0.6, d_bark2: 0.6, d_bark3: 0.6, d_growl: 0.5, d_whine: 0.5,
  st_grass0: 0.42, st_grass1: 0.42, st_grass2: 0.42, st_grass3: 0.42, st_grass4: 0.42, st_conc0: 0.4, st_conc1: 0.4, st_conc2: 0.4, st_conc3: 0.4, st_conc4: 0.4,
  st_wood0: 0.45, st_wood1: 0.45, st_wood2: 0.45, st_wood3: 0.45, st_wood4: 0.45, hit0: 0.5, hit1: 0.5, hit2: 0.5, hithead: 0.6,
  glass0: 0.65, glass1: 0.65, slime0: 0.55, slime1: 0.55, fire: 0.5, slash0: 0.55, slash1: 0.55, chop: 0.65, ui_click: 0.35, ui_tap: 0.3,
  wave_ok: 0.5, shell: 0.45, thud: 0.6, over: 0.75, boom3: 0.85, scream0: 0.75, scream1: 0.75, z_g1: 0.55, z_g2: 0.55, z_g3: 0.55, r_shell: 0.55,
  amb_wind: 1, amb_night: 1, water: 1,
};
const STEP = { grass: 'st_grass', conc: 'st_conc', wood: 'st_wood' };
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

let ac = null, bus = null, mus = null, rev = null, revIn = null, loadJob = null;
const bufs = {}, offs = {};
const L = { x: 0, y: 1.6, z: 0, yaw: 0 };
const voices = [];
const loops = [];
let lt = 0;
let amb = null;

function makeIR() {
  const n = Math.floor(ac.sampleRate * 1.7), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) { const t = i / ac.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3.4) * (t < 0.012 ? t / 0.012 : 1); }
    const e = Math.floor(ac.sampleRate * (0.07 + c * 0.013));
    for (let i = 0; i < 400; i++) d[e + i] += (Math.random() * 2 - 1) * 0.6 * (1 - i / 400);
  }
  return b;
}

function chain(o) {
  const g = ac.createGain();
  g.gain.value = 0;
  let last = g;
  let lp = null, pan = null;
  if (o.pos) {
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000;
    last.connect(lp); last = lp;
    if (ac.createStereoPanner) { pan = ac.createStereoPanner(); last.connect(pan); last = pan; }
  } else if (o.lp) { lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; last.connect(lp); last = lp; }
  last.connect(o.out || bus);
  let send = null;
  if (rev && (o.rev || o.pos)) { send = ac.createGain(); send.gain.value = 0; last.connect(send); send.connect(revIn); }
  return { g, lp, pan, send };
}
function place(c, o, vol) {
  const t = ac.currentTime;
  if (!o.pos) { c.g.gain.setValueAtTime(vol, t); if (c.send) c.send.gain.setValueAtTime(o.rev || 0, t); return 1; }
  const dx = o.pos[0] - L.x, dz = o.pos[2] - L.z, dy = (o.pos[1] == null ? 1.2 : o.pos[1]) - L.y;
  const d = Math.hypot(dx, dy, dz);
  const ref = o.ref || 4;
  const k = ref / (ref + Math.max(0, d - 1) * (o.roll || 1));
  if (o.max && d > o.max) { c.g.gain.setValueAtTime(0, t); return 0; }
  const ang = Math.atan2(dx, dz) - L.yaw;
  const side = -Math.sin(ang);
  c.g.gain.setValueAtTime(vol * k, t);
  if (c.pan) c.pan.pan.setValueAtTime(clamp(side * 0.85, -0.9, 0.9), t);
  if (c.lp) c.lp.frequency.setValueAtTime(clamp(17000 * Math.exp(-d / (o.muff || 30)), 700, 17000) * (Math.cos(ang) < -0.3 ? 0.7 : 1), t);
  if (c.send) c.send.gain.setValueAtTime(clamp((o.rev == null ? 0.12 : o.rev) + d / 70, 0, 0.6) * vol * 0.8, t);
  return k;
}
function track(v, cat, lim) {
  if (cat) {
    const same = voices.filter((q) => q.cat === cat);
    if (same.length >= lim) { const old = same[0]; try { old.stop(); } catch {} const i = voices.indexOf(old); if (i >= 0) voices.splice(i, 1); }
  }
  v.cat = cat;
  voices.push(v);
  v.onEnd = () => { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); };
}

export const ZA = {
  ok: false,
  init() {
    Sfx.init();
    const b = Sfx.bus();
    if (!b) return false;
    if (ac !== b.ac) {
      ac = b.ac;
      bus = ac.createGain(); bus.gain.value = 0.9; bus.connect(b.out);
      const mb = Sfx.mbus ? Sfx.mbus() : null;
      mus = ac.createGain(); mus.gain.value = 1; mus.connect(mb ? mb.out : b.out);
      try { rev = ac.createConvolver(); rev.buffer = makeIR(); revIn = ac.createGain(); revIn.gain.value = 0.5; revIn.connect(rev); rev.connect(bus); } catch { rev = null; }
      amb = null; loadJob = null;
      for (const k of Object.keys(bufs)) delete bufs[k];
    }
    this.ok = true;
    this.load();
    return true;
  },
  load() {
    if (!ac || loadJob) return loadJob;
    loadJob = Promise.all(Object.keys(FILES).map((n) => fetch(`/sounds/dead/${n}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : null)).then((ab) => (ab ? new Promise((res) => ac.decodeAudioData(ab, res, () => res(null))) : null)).then((buf) => {
      if (!buf) return;
      bufs[n] = buf;
      const d = buf.getChannelData(0);
      let i = 0; while (i < d.length && Math.abs(d[i]) < 0.006) i++;
      offs[n] = Math.max(0, i / buf.sampleRate - 0.002);
    }).catch(() => {})));
    return loadJob;
  },
  listen(x, y, z, yaw) {
    L.x = x; L.y = y; L.z = z; L.yaw = yaw;
    if (ac && loops.length) { lt++; if (lt % 4 === 0) for (const h of loops) place(h.c, { ...h.o, pos: h.pos }, (h.o.vol || 1) * (Sfx.sfxOn ? 1 : 0)); }
  },
  play(name, o = {}) {
    if (!ac || !Sfx.sfxOn) return null;
    const buf = bufs[name];
    if (!buf) return null;
    const c = chain(o);
    const vol = (FILES[name] || 0.6) * (o.vol == null ? 1 : o.vol);
    if (place(c, o, vol) < 0.012) { try { c.g.disconnect(); } catch {} return null; }
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = (o.rate || 1) * (o.vary ? rnd(1 - o.vary, 1 + o.vary) : 1);
    s.connect(c.g);
    const t = ac.currentTime + (o.at || 0);
    const off = offs[name] || 0;
    if (o.dur) { s.start(t, off, o.dur); c.g.gain.setValueAtTime(c.g.gain.value, t + Math.max(0, o.dur - 0.08)); c.g.gain.linearRampToValueAtTime(0, t + o.dur); }
    else s.start(t, off);
    const v = { stop: () => { try { s.stop(); } catch {} }, s };
    s.onended = () => { v.onEnd && v.onEnd(); try { c.g.disconnect(); } catch {} };
    track(v, o.cat, o.lim || 8);
    return v;
  },
  synth(kind, o = {}) {
    if (!ac || !Sfx.sfxOn) return;
    const r = (n) => (Math.random() * n) | 0;
    if (kind === 'step') { this.play(`${STEP[o.surf] || (o.grass ? 'st_grass' : 'st_conc')}${r(5)}`, { ...o, vary: 0.07, cat: 'step', lim: 3 }); return; }
    if (kind === 'shuffle') { this.play(`st_grass${r(5)}`, { ...o, vol: (o.vol || 1) * 0.5, rate: 0.85, vary: 0.05, cat: 'step', lim: 3 }); return; }
    if (kind === 'hit') { this.play(o.head ? 'hithead' : `hit${r(3)}`, { ...o, vary: 0.08, cat: 'hit', lim: 4 }); return; }
    if (kind === 'thump') { this.play('thud', o); return; }
    if (kind === 'click') { this.play('ui_click', { ...o, rate: o.f ? Math.max(0.7, Math.min(1.5, o.f / 3200)) : 1 }); return; }
    if (kind === 'tap') { this.play('ui_tap', { ...o, rate: o.f ? Math.max(0.7, Math.min(1.4, o.f / 900)) : 1 }); return; }
    if (kind === 'shriek') { this.play(`scream${r(2)}`, { ...o, vary: 0.05 }); return; }
    if (kind === 'spit') { this.play('slime0', { ...o, rate: 1.15, vary: 0.08 }); return; }
    if (kind === 'sizzle') { this.play('slime1', { ...o, vol: (o.vol || 1) * 0.6, rate: 1.5 }); return; }
    if (kind === 'glass') { this.play(`glass${r(2)}`, { ...o, vary: 0.06 }); return; }
    if (kind === 'fire') { this.play('fire', { ...o, vary: 0.06, cat: 'fire', lim: 3 }); return; }
    if (kind === 'swing') { this.play(`slash${r(2)}`, { ...o, vary: 0.08 }); return; }
    if (kind === 'horn') { this.play('over', o); return; }
    if (kind === 'calm') { this.play('wave_ok', o); }
  },
  gun(kind, o = {}) {
    const n = { rifle: 'g_rifle', smg: 'g_smg', pistol: 'g_pistol', sniper: 'g_sniper', shotgun: 'g_shotgun' }[kind] || 'g_rifle';
    const mine = !o.pos;
    this.play(n, { ...o, vary: 0.04, cat: mine ? 'mygun' : 'gun', lim: mine ? 4 : 8, rev: mine ? 0.18 : 0.2, ref: 9, muff: 60 });
  },
  reload(kind, dur) {
    if (kind === 'shotgun') { const n = Math.max(2, Math.min(5, Math.floor((dur - 0.7) / 0.38))); for (let i = 0; i < n; i++) this.play('r_shell', { at: 0.22 + i * 0.38, vary: 0.05 }); this.play('r_pump', { at: Math.max(0.1, dur - 0.55) }); return; }
    if (kind === 'sniper') { this.play('r_sniper', { rate: 2.38 / Math.max(1.4, dur) }); return; }
    if (kind === 'pistol') { this.play('r_pistol', { rate: 1.6, dur: 1.4 }); return; }
    this.play('r_rifle', { rate: clamp(2.3 / Math.max(1, dur), 0.9, 1.4) });
  },
  zvoice(kind, pos, what) {
    const pitch = { brute: 0.62, bloater: 0.78, runner: 1.18, riot: 0.88, screamer: 1.25, spitter: 1.1, crawler: 0.95, worker: 0.9 }[kind] || 1;
    const names = what === 'die' ? ['z_death', 'z_die1', 'z_die2'] : what === 'hurt' ? ['z_hurt', 'z_pain1', 'z_pain2', 'z_pain3'] : what === 'attack' ? ['z_war', 'z_pain2', 'z_growl'] : kind === 'runner' ? ['z_war', 'z_pain2', 'z_moan', 'z_g3'] : ['z_growl', 'z_moan', 'z_g1', 'z_g2', 'z_g3', 'z_growl'];
    return this.play(pick(names), { pos, rate: pitch, vary: 0.08, cat: 'zv', lim: 6, ref: 3.5, roll: 1.1, rev: 0.16, muff: 22, max: 34, vol: what === 'idle' ? 0.8 : 1 });
  },
  ambience(on, level = 0) {
    if (!ac) return;
    if (!on) { if (amb) { const t = ac.currentTime; amb.g.gain.setTargetAtTime(0, t, 0.6); const a = amb; amb = null; setTimeout(() => { try { a.stop(); } catch {} }, 2500); } return; }
    if (!amb) {
      if (!bufs.amb_wind || !bufs.amb_night) { const want = level; if (loadJob) loadJob.then(() => { if (this.ok && !amb && this.ambOn) this.ambience(true, want); }); this.ambOn = true; return; }
      const g = ac.createGain(); g.gain.value = 0; g.connect(mus);
      const mk = (b, v) => { const src = ac.createBufferSource(); src.buffer = b; src.loop = true; const gg = ac.createGain(); gg.gain.value = v; src.connect(gg); gg.connect(g); src.start(0, Math.random() * Math.max(0.1, b.duration - 0.1)); return { src, gg }; };
      const w = mk(bufs.amb_wind, 0.26), n = mk(bufs.amb_night, 0.2);
      amb = { g, w, n, stop: () => { try { w.src.stop(); n.src.stop(); } catch {} try { g.disconnect(); } catch {} } };
      g.gain.setTargetAtTime(1, ac.currentTime, 1.5);
    }
    this.ambOn = true;
    amb.w.gg.gain.setTargetAtTime(0.22 + level * 0.12, ac.currentTime, 2.5);
    amb.n.gg.gain.setTargetAtTime(0.24 - level * 0.1, ac.currentTime, 2.5);
  },
  loopAt(name, pos, o = {}) {
    if (!ac || !bufs[name]) return null;
    const c = chain({ pos });
    const src = ac.createBufferSource(); src.buffer = bufs[name]; src.loop = true; src.connect(c.g); src.start(0, Math.random() * bufs[name].duration);
    const h = { name, pos, o, c, src, stop: () => { try { src.stop(); } catch {} try { c.g.disconnect(); } catch {} const i = loops.indexOf(h); if (i >= 0) loops.splice(i, 1); } };
    loops.push(h);
    place(c, { ...o, pos }, (o.vol || 1) * (Sfx.sfxOn ? 1 : 0));
    return h;
  },
  stopAll() { for (const v of voices.slice()) v.stop(); voices.length = 0; for (const h of loops.slice()) h.stop(); this.ambOn = false; this.ambience(false); },
};
