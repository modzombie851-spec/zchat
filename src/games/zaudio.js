import { Sfx } from './sfx.js';

const FILES = {
  g_rifle: 0.75, g_smg: 1.5, g_pistol: 0.8, g_sniper: 0.85, g_shotgun: 0.9,
  r_rifle: 0.55, r_pistol: 0.9, r_sniper: 0.6, r_pump: 0.65, r_cock: 0.75, dry: 0.6,
  boom: 0.95, boom2: 0.9, whoosh: 0.7, pin: 0.5,
  z_growl: 0.6, z_hurt: 0.6, z_death: 0.6, z_moan: 0.55, z_war: 0.6, z_die1: 0.6, z_die2: 0.6, z_pain1: 0.6, z_pain2: 0.55, z_pain3: 0.5,
  stinger: 0.7, bone: 0.55, d_bark1: 0.6, d_bark2: 0.6, d_bark3: 0.6, d_growl: 0.5, d_whine: 0.5,
};
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

let ac = null, bus = null, mus = null, rev = null, revIn = null, noise = null, loadJob = null;
const bufs = {}, offs = {};
const L = { x: 0, y: 1.6, z: 0, yaw: 0 };
const voices = [];
let amb = null;

function noiseBuf() {
  if (noise) return noise;
  noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noise.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noise;
}
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
  if (o.max && d > o.max) return 0;
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
      noise = null; amb = null; loadJob = null;
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
  listen(x, y, z, yaw) { L.x = x; L.y = y; L.z = z; L.yaw = yaw; },
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
    const c = chain(o);
    const vol = o.vol == null ? 1 : o.vol;
    if (place(c, o, vol) < 0.01) { try { c.g.disconnect(); } catch {} return; }
    const t = ac.currentTime + (o.at || 0);
    const nz = () => { const s = ac.createBufferSource(); s.buffer = noiseBuf(); s.loop = true; return s; };
    const env = (g, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
    const out = c.g;
    if (kind === 'step') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = (o.grass ? 900 : 1700) * rnd(0.85, 1.15); f.Q.value = 0.9;
      env(g, 0.004, 0.07, 0.22); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.12);
      const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.frequency.setValueAtTime(95, t); o2.frequency.exponentialRampToValueAtTime(50, t + 0.06); env(g2, 0.003, 0.06, 0.18); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.1);
    } else if (kind === 'shuffle') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.value = 600; env(g, 0.05, 0.25, 0.12); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.35);
    } else if (kind === 'hit') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.value = o.head ? 2600 : 1400; env(g, 0.002, o.head ? 0.09 : 0.06, 0.5); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.14);
      const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.setValueAtTime(140, t); o2.frequency.exponentialRampToValueAtTime(60, t + 0.08); env(g2, 0.002, 0.08, 0.45); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.12);
    } else if (kind === 'thump') {
      const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.setValueAtTime(o.f || 75, t); o2.frequency.exponentialRampToValueAtTime((o.f || 75) * 0.45, t + 0.14); env(g2, 0.002, o.len || 0.14, 0.6); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.22);
    } else if (kind === 'click') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.value = o.f || 3200; f.Q.value = 3; env(g, 0.001, 0.03, 0.4); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.06);
    } else if (kind === 'heart') {
      for (const [dt, a] of [[0, 0.55], [0.16, 0.38]]) { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.setValueAtTime(62, t + dt); o2.frequency.exponentialRampToValueAtTime(38, t + dt + 0.12); g2.gain.setValueAtTime(0.0001, t + dt); g2.gain.exponentialRampToValueAtTime(a, t + dt + 0.012); g2.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.16); o2.connect(g2); g2.connect(out); o2.start(t + dt); o2.stop(t + dt + 0.2); }
    } else if (kind === 'shriek') {
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), ws = ac.createWaveShaper();
      const curve = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 4); } ws.curve = curve;
      o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.setValueAtTime(520, t); o1.frequency.linearRampToValueAtTime(760, t + 0.5); o1.frequency.linearRampToValueAtTime(430, t + 1.4);
      o2.frequency.setValueAtTime(7.5, t); const mg = ac.createGain(); mg.gain.value = 40; o2.connect(mg); mg.connect(o1.frequency);
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.4;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.28, t + 0.08); g.gain.setValueAtTime(0.28, t + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o1.connect(ws); ws.connect(f); f.connect(g); g.connect(out); o1.start(t); o2.start(t); o1.stop(t + 1.55); o2.stop(t + 1.55);
    } else if (kind === 'spit') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.setValueAtTime(800, t); f.frequency.exponentialRampToValueAtTime(2400, t + 0.15); f.Q.value = 2; env(g, 0.01, 0.2, 0.4); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.3);
    } else if (kind === 'sizzle') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'highpass'; f.frequency.value = 3000; env(g, 0.05, o.len || 0.8, 0.12); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + (o.len || 0.8) + 0.1);
    } else if (kind === 'glass') {
      for (let i = 0; i < 6; i++) { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.value = rnd(2400, 6200); const st = t + i * rnd(0.01, 0.04); g2.gain.setValueAtTime(0.0001, st); g2.gain.exponentialRampToValueAtTime(0.12, st + 0.003); g2.gain.exponentialRampToValueAtTime(0.0001, st + rnd(0.08, 0.25)); o2.connect(g2); g2.connect(out); o2.start(st); o2.stop(st + 0.3); }
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'highpass'; f.frequency.value = 2500; env(g, 0.002, 0.18, 0.35); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.25);
    } else if (kind === 'fire') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(1800, t + 0.3); f.frequency.exponentialRampToValueAtTime(500, t + 1.2); env(g, 0.15, 1.1, 0.5); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 1.4);
    } else if (kind === 'swing') {
      const s = nz(), f = ac.createBiquadFilter(), g = ac.createGain();
      f.type = 'bandpass'; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2200, t + 0.12); f.frequency.exponentialRampToValueAtTime(700, t + 0.24); f.Q.value = 1.2; env(g, 0.04, 0.2, 0.3); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.3);
    } else if (kind === 'tap') {
      const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'triangle'; o2.frequency.value = o.f || 1200; env(g2, 0.002, 0.04, 0.12); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 0.06);
    } else if (kind === 'horn') {
      for (const fr of [55, 82.5, 110]) { const o2 = ac.createOscillator(), g2 = ac.createGain(), f = ac.createBiquadFilter(); o2.type = 'sawtooth'; o2.frequency.value = fr; f.type = 'lowpass'; f.frequency.value = 500; g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.09, t + 0.5); g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); o2.connect(f); f.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 2.5); }
    } else if (kind === 'calm') {
      for (const fr of [220, 277, 330]) { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.type = 'sine'; o2.frequency.value = fr; g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.05, t + 0.6); g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.6); o2.connect(g2); g2.connect(out); o2.start(t); o2.stop(t + 2.7); }
    } else if (kind === 'crow') {
      for (let i = 0; i < 2 + ((Math.random() * 2) | 0); i++) { const st = t + i * 0.32; const o2 = ac.createOscillator(), g2 = ac.createGain(), f = ac.createBiquadFilter(); o2.type = 'sawtooth'; o2.frequency.setValueAtTime(820, st); o2.frequency.exponentialRampToValueAtTime(520, st + 0.2); f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2; g2.gain.setValueAtTime(0.0001, st); g2.gain.exponentialRampToValueAtTime(0.14, st + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, st + 0.22); o2.connect(f); f.connect(g2); g2.connect(out); o2.start(st); o2.stop(st + 0.25); }
    }
  },
  gun(kind, o = {}) {
    const n = { rifle: 'g_rifle', smg: 'g_smg', pistol: 'g_pistol', sniper: 'g_sniper', shotgun: 'g_shotgun' }[kind] || 'g_rifle';
    const mine = !o.pos;
    this.play(n, { ...o, vary: 0.04, cat: mine ? 'mygun' : 'gun', lim: mine ? 4 : 8, rev: mine ? 0.18 : 0.2, ref: 9, muff: 60 });
    if (mine) this.synth('thump', { vol: kind === 'smg' ? 0.25 : kind === 'pistol' ? 0.3 : 0.45, f: kind === 'sniper' || kind === 'shotgun' ? 60 : 80, len: kind === 'sniper' || kind === 'shotgun' ? 0.22 : 0.12 });
  },
  reload(kind, dur) {
    if (kind === 'shotgun') { for (let i = 0; i < 4; i++) this.synth('click', { at: 0.25 + i * 0.4, f: 2200, vol: 0.5 }); this.play('r_pump', { at: Math.max(0.1, dur - 0.65) }); return; }
    if (kind === 'sniper') { this.play('r_sniper', { rate: 2.38 / Math.max(1.4, dur) }); return; }
    if (kind === 'pistol') { this.play('r_pistol', { rate: 1.6, dur: 1.4 }); return; }
    this.play('r_rifle', { rate: clamp(2.3 / Math.max(1, dur), 0.9, 1.4) });
  },
  zvoice(kind, pos, what) {
    const pitch = { brute: 0.62, bloater: 0.78, runner: 1.18, riot: 0.88, screamer: 1.25, spitter: 1.1, crawler: 0.95, worker: 0.9 }[kind] || 1;
    const names = what === 'die' ? ['z_death', 'z_die1', 'z_die2'] : what === 'hurt' ? ['z_hurt', 'z_pain1', 'z_pain2', 'z_pain3'] : what === 'attack' ? ['z_war', 'z_pain2', 'z_growl'] : kind === 'runner' ? ['z_war', 'z_pain2', 'z_moan'] : ['z_growl', 'z_moan', 'z_hurt', 'z_growl'];
    return this.play(pick(names), { pos, rate: pitch, vary: 0.08, cat: 'zv', lim: 6, ref: 3.5, roll: 1.1, rev: 0.16, muff: 22, max: 34, vol: what === 'idle' ? 0.8 : 1 });
  },
  ambience(on, level = 0) {
    if (!ac) return;
    if (!on) { if (amb) { const t = ac.currentTime; amb.g.gain.setTargetAtTime(0, t, 0.6); const a = amb; amb = null; setTimeout(() => { try { a.stop(); } catch {} }, 2500); } return; }
    if (!amb) {
      const g = ac.createGain(); g.gain.value = 0; g.connect(mus);
      const w = ac.createBufferSource(); w.buffer = noiseBuf(); w.loop = true;
      const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
      const wg = ac.createGain(); wg.gain.value = 0.05;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.07; const lg = ac.createGain(); lg.gain.value = 230; lfo.connect(lg); lg.connect(wf.frequency);
      const lfo2 = ac.createOscillator(); lfo2.frequency.value = 0.11; const lg2 = ac.createGain(); lg2.gain.value = 0.03; lfo2.connect(lg2); lg2.connect(wg.gain);
      w.connect(wf); wf.connect(wg); wg.connect(g);
      const dg = ac.createGain(); dg.gain.value = 0.0; dg.connect(g);
      const df = ac.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 210; df.connect(dg);
      const os = [55, 55.7, 82.6].map((f, i) => { const o = ac.createOscillator(); o.type = i === 2 ? 'sine' : 'sawtooth'; o.frequency.value = f; o.connect(df); return o; });
      const tr = ac.createOscillator(); tr.frequency.value = 0.19; const tg = ac.createGain(); tg.gain.value = 0.012; tr.connect(tg); tg.connect(dg.gain);
      const all = [w, lfo, lfo2, tr, ...os];
      for (const n of all) n.start();
      amb = { g, dg, stop: () => { for (const n of all) try { n.stop(); } catch {} try { g.disconnect(); } catch {} } };
      g.gain.setTargetAtTime(1, ac.currentTime, 1.5);
    }
    amb.dg.gain.setTargetAtTime(0.018 + level * 0.03, ac.currentTime, 2.5);
  },
  stopAll() { for (const v of voices.slice()) v.stop(); voices.length = 0; this.ambience(false); },
};
