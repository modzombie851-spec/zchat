const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

let noiseBuf = null;
function noise(c) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 1.2);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  let s = 7;
  for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
  noiseBuf = b;
  return b;
}

function env(c, g, t, peak, attack, decay, end) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.setTargetAtTime(0.0001, t + attack, decay);
  if (end) g.gain.setTargetAtTime(0.0001, end, 0.08);
}

function osc(c, type, f, t, stop, dest, detune) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (detune) o.detune.setValueAtTime(detune, t);
  o.connect(dest);
  o.start(t);
  o.stop(stop);
  return o;
}

export function makeVoices(c, out) {
  const lp = (f, q) => { const n = c.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = f; n.Q.value = q || 0.5; return n; };
  const v = {};
  v.ep = (n, t, dur, vel = 0.6) => {
    const f = hz(n);
    const g = c.createGain();
    const fl = lp(2600);
    fl.connect(g).connect(out);
    env(c, g, t, 0.16 * vel, 0.006, 0.55, t + dur);
    const end = t + dur + 0.9;
    osc(c, 'sine', f, t, end, fl);
    const tg = c.createGain();
    tg.connect(fl);
    env(c, tg, t, 0.45 * vel, 0.003, 0.09);
    osc(c, 'sine', f * 2.01, t, t + 0.6, tg);
    const bg = c.createGain();
    bg.gain.value = 0.35;
    bg.connect(fl);
    osc(c, 'triangle', f, t, end, bg, -4);
  };
  v.pn = (n, t, dur, vel = 0.6) => {
    const f = hz(n);
    const g = c.createGain();
    const fl = lp(3200);
    fl.frequency.setValueAtTime(3400, t);
    fl.frequency.setTargetAtTime(900, t + 0.02, 0.5);
    fl.connect(g).connect(out);
    env(c, g, t, 0.15 * vel, 0.004, 0.85, t + dur);
    const end = t + dur + 1.2;
    osc(c, 'triangle', f, t, end, fl);
    const h2 = c.createGain();
    h2.gain.value = 0.32;
    h2.connect(fl);
    osc(c, 'sine', f * 2, t, end, h2, 3);
    const h3 = c.createGain();
    h3.connect(fl);
    env(c, h3, t, 0.12, 0.002, 0.18);
    osc(c, 'sine', f * 3, t, t + 0.8, h3);
  };
  v.bs = (n, t, dur, vel = 0.7) => {
    const f = hz(n);
    const g = c.createGain();
    const fl = lp(700, 0.8);
    fl.connect(g).connect(out);
    env(c, g, t, 0.34 * vel, 0.012, 0.32, t + dur);
    const end = t + dur + 0.5;
    const o = osc(c, 'sine', f * 1.015, t, end, fl);
    o.frequency.setTargetAtTime(f, t, 0.015);
    const h = c.createGain();
    h.gain.value = 0.45;
    h.connect(fl);
    osc(c, 'triangle', f * 2, t, end, h);
  };
  v.pl = (n, t, vel = 0.6, decay = 0.42) => {
    const f = hz(n);
    const g = c.createGain();
    const fl = lp(2400);
    fl.frequency.setValueAtTime(3200, t);
    fl.frequency.setTargetAtTime(1100, t, 0.12);
    fl.connect(g).connect(out);
    env(c, g, t, 0.17 * vel, 0.003, decay);
    osc(c, 'triangle', f, t, t + decay * 5, fl);
    const h = c.createGain();
    h.connect(fl);
    env(c, h, t, 0.09 * vel, 0.002, 0.06);
    osc(c, 'square', f * 2, t, t + 0.3, h);
  };
  v.kl = (n, t, vel = 0.6) => {
    const f = hz(n);
    const g = c.createGain();
    g.connect(out);
    env(c, g, t, 0.17 * vel, 0.002, 0.55);
    osc(c, 'sine', f, t, t + 3, g);
    const h = c.createGain();
    h.connect(out);
    env(c, h, t, 0.05 * vel, 0.001, 0.035);
    osc(c, 'sine', f * 5.4, t, t + 0.4, h);
  };
  v.mr = (n, t, vel = 0.6) => {
    const f = hz(n);
    const g = c.createGain();
    g.connect(out);
    env(c, g, t, 0.2 * vel, 0.002, 0.2);
    osc(c, 'sine', f, t, t + 1.4, g);
    const h = c.createGain();
    h.connect(out);
    env(c, h, t, 0.06 * vel, 0.001, 0.03);
    osc(c, 'sine', f * 4, t, t + 0.3, h);
  };
  v.kt = (n, t, vel = 0.6) => {
    const f = hz(n);
    const g = c.createGain();
    const fl = lp(2800);
    fl.connect(g).connect(out);
    env(c, g, t, 0.16 * vel, 0.002, 0.7);
    const o = osc(c, 'triangle', f * 1.012, t, t + 4, fl);
    o.frequency.setTargetAtTime(f, t, 0.03);
    const h = c.createGain();
    h.connect(fl);
    env(c, h, t, 0.07 * vel, 0.001, 0.05);
    osc(c, 'sawtooth', f * 2, t, t + 0.4, h);
  };
  v.pad = (notes, t, dur, vel = 0.5) => {
    const g = c.createGain();
    const fl = lp(1100, 0.3);
    fl.connect(g).connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045 * vel, t + Math.min(1.2, dur * 0.4));
    g.gain.setTargetAtTime(0.0001, t + dur, 0.5);
    notes.forEach((n) => {
      osc(c, 'triangle', hz(n), t, t + dur + 2.5, fl, -7);
      osc(c, 'triangle', hz(n), t, t + dur + 2.5, fl, 7);
    });
  };
  const hiss = (t, vel, type, f, q, decay, attack) => {
    const s = c.createBufferSource();
    s.buffer = noise(c);
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    const g = c.createGain();
    s.connect(fl).connect(g).connect(out);
    env(c, g, t, vel, attack || 0.002, decay);
    s.start(t, Math.random() * 0.8);
    s.stop(t + decay * 6 + 0.05);
  };
  v.hat = (t, vel = 0.5) => hiss(t, 0.05 * vel, 'highpass', 7200, 0.7, 0.03);
  v.ride = (t, vel = 0.5) => { hiss(t, 0.035 * vel, 'bandpass', 6400, 1.4, 0.12); };
  v.brush = (t, vel = 0.5, len = 0.16) => hiss(t, 0.05 * vel, 'bandpass', 2600, 0.6, len, 0.03);
  v.shk = (t, vel = 0.5) => hiss(t, 0.035 * vel, 'highpass', 5200, 0.8, 0.04, 0.01);
  v.clap = (t, vel = 0.5) => { hiss(t, 0.06 * vel, 'bandpass', 1500, 0.9, 0.09); hiss(t + 0.012, 0.04 * vel, 'bandpass', 1900, 0.9, 0.07); };
  v.kick = (t, vel = 0.6) => {
    const g = c.createGain();
    g.connect(out);
    env(c, g, t, 0.42 * vel, 0.002, 0.11);
    const o = osc(c, 'sine', 120, t, t + 0.5, g);
    o.frequency.setTargetAtTime(48, t, 0.035);
  };
  v.swell = (t, dur, vel = 0.5) => {
    const s = c.createBufferSource();
    s.buffer = noise(c);
    s.loop = true;
    const fl = c.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.setValueAtTime(300, t);
    fl.frequency.linearRampToValueAtTime(900, t + dur * 0.5);
    fl.frequency.linearRampToValueAtTime(260, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05 * vel, t + dur * 0.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    s.connect(fl).connect(g).connect(out);
    s.start(t);
    s.stop(t + dur + 0.1);
  };
  v.bowl = (n, t, vel = 0.5) => {
    const f = hz(n);
    const g = c.createGain();
    g.connect(out);
    env(c, g, t, 0.09 * vel, 0.01, 1.8);
    osc(c, 'sine', f, t, t + 7, g);
    const h = c.createGain();
    h.connect(out);
    env(c, h, t, 0.03 * vel, 0.01, 1.1);
    osc(c, 'sine', f * 2.76, t, t + 5, h);
  };
  return v;
}

const rnd = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

const LOUNGE = [
  { b: [38, 41, 45, 44], c: [53, 57, 60, 64] },
  { b: [43, 47, 50, 49], c: [53, 59, 64] },
  { b: [36, 40, 43, 45], c: [52, 55, 59, 62] },
  { b: [45, 44, 43, 40], c: [55, 61, 66] },
  { b: [38, 45, 41, 44], c: [53, 57, 60, 64] },
  { b: [43, 41, 40, 37], c: [53, 59, 64] },
  { b: [40, 43, 45, 47], c: [50, 55, 59, 62] },
  { b: [45, 43, 41, 40], c: [55, 61, 65, 70] },
];
const LOUNGE_LICK = { 3: [[2, 72], [3, 74], [4, 77], [6, 76]], 7: [[1, 81], [2, 79], [4, 76], [5, 74], [6, 72]] };

const STUDY = [
  { b: 43, c: [59, 62, 66] }, { b: 50, c: [57, 61, 66] },
  { b: 43, c: [59, 62, 66] }, { b: 50, c: [57, 61, 66] },
  { b: 47, c: [59, 62, 66] }, { b: 45, c: [57, 60, 64] },
  { b: 43, c: [59, 62, 67] }, { b: 50, c: [57, 62, 66] },
];
const STUDY_MEL = { 1: [[0, 78, 5]], 2: [[2, 81, 2], [4, 79, 2]], 3: [[0, 78, 6]], 4: [[0, 73, 2], [2, 71, 2], [4, 73, 2]], 5: [[0, 74, 6]], 6: [[2, 76, 2], [4, 74, 2]], 7: [[0, 69, 6]] };

const TERRACE = [
  { b: 48, a: [55, 60, 62, 64] }, { b: 45, a: [55, 60, 64, 67] },
  { b: 41, a: [57, 60, 64, 65] }, { b: 43, a: [55, 59, 62, 64] },
  { b: 48, a: [55, 60, 62, 67] }, { b: 45, a: [57, 60, 64, 69] },
  { b: 41, a: [57, 60, 65, 69] }, { b: 43, a: [55, 59, 62, 65] },
];
const ARP = [0, 1, 2, 3, 0, 2, 3, 1];

const GARDEN = [
  { p: [55, 59, 62], b: 43 }, { p: [52, 55, 59], b: 40 },
  { p: [48, 52, 55, 60], b: 36 }, { p: [50, 54, 57], b: 38 },
];
const GARDEN_MEL = [79, 83, 86, 83, 81, 79, 76, 79, 74, 76, 79, 81, 83, 81, 79, 76];

const ARCADE = [
  { b: [45, 45, 57, 45], a: [69, 72, 76, 72] },
  { b: [41, 41, 53, 41], a: [69, 72, 77, 72] },
  { b: [48, 48, 60, 48], a: [67, 72, 76, 79] },
  { b: [43, 43, 55, 43], a: [67, 71, 74, 79] },
];

const INSEN = [62, 63, 67, 69, 72, 74, 75, 79, 81];

const DEN_MEL = [
  [[0, 74], [2, 71], [3, 69], [5, 66], [6, 69]],
  [[0, 71], [3, 69], [4, 66], [6, 64]],
  [[0, 66], [2, 69], [4, 71], [5, 74], [7, 76]],
  [[0, 74], [4, 71]],
  [[0, 69], [2, 71], [3, 74], [5, 71], [6, 69]],
  [[0, 66], [3, 64], [4, 62], [6, 64]],
  [[0, 66], [2, 69], [3, 71], [5, 69], [6, 66]],
  [[0, 62], [4, 69]],
];
const DEN_BASS = [38, 38, 43, 45, 38, 35, 43, 45];

const PARLOR = [
  { b: 36, c: [52, 55, 59, 64] }, { b: 45, c: [55, 60, 64, 67] },
  { b: 38, c: [53, 57, 60, 65] }, { b: 43, c: [53, 59, 62, 65] },
  { b: 40, c: [55, 59, 62, 67] }, { b: 45, c: [55, 61, 64, 67] },
  { b: 38, c: [53, 57, 60, 65] }, { b: 43, c: [53, 59, 62, 65] },
];
const PARLOR_MEL = { 1: [[0, 76], [3, 79], [6, 76]], 3: [[0, 77], [2, 76], [4, 74], [6, 71]], 5: [[0, 74], [3, 76], [6, 79]], 7: [[0, 77], [4, 74]] };

export const TRACKS = {
  lounge: {
    bpm: 84, spb: 8, bars: 8, swing: 0.32,
    play(v, bar, s, t, sp) {
      const ch = LOUNGE[bar];
      if (s % 2 === 0) v.bs(ch.b[s / 2], t, sp * 1.7, s === 0 ? 0.85 : 0.7);
      if (s === 0) ch.c.forEach((n, i) => v.ep(n, t + i * 0.008, sp * 2.6, 0.55));
      if (s === 3 && bar % 2 === 0) ch.c.forEach((n) => v.ep(n, t, sp * 0.8, 0.38));
      if (s === 5 && bar % 2 === 1) ch.c.slice(1).forEach((n) => v.ep(n, t, sp * 1.2, 0.34));
      if (s === 0 || s === 2 || s === 3 || s === 4 || s === 6 || s === 7) v.ride(t, s % 2 === 0 ? 0.7 : 0.45);
      if (s === 2 || s === 6) v.brush(t, 0.8, 0.18);
      const lick = LOUNGE_LICK[bar];
      if (lick) lick.forEach(([st, n]) => { if (st === s) v.ep(n, t, sp * 1.1, 0.42); });
    },
  },
  study: {
    bpm: 62, spb: 6, bars: 8,
    play(v, bar, s, t, sp) {
      const ch = STUDY[bar];
      if (s === 0) v.pn(ch.b, t, sp * 5.5, 0.55);
      if (s === 2) ch.c.forEach((n, i) => v.pn(n, t + i * 0.012, sp * 3.6, 0.36));
      const mel = STUDY_MEL[bar];
      if (mel) mel.forEach(([st, n, d]) => { if (st === s) v.pn(n, t, sp * d, 0.5); });
    },
  },
  terrace: {
    bpm: 94, spb: 8, bars: 8,
    play(v, bar, s, t, sp) {
      const ch = TERRACE[bar];
      if (s === 0) v.bs(ch.b, t, sp * 3, 0.7);
      if (s === 4) v.bs(ch.b + 7, t, sp * 2.5, 0.55);
      const n = s === 0 ? ch.b + 12 : ch.a[ARP[s]];
      v.pl(n, t + (s % 2 ? 0.006 : 0), s === 0 ? 0.62 : 0.48, 0.5);
      v.shk(t, s % 2 ? 0.7 : 0.4);
    },
  },
  garden: {
    bpm: 100, spb: 8, bars: 8,
    play(v, bar, s, t, sp, loop) {
      const ch = GARDEN[bar % 4];
      if (s === 0) v.pad(ch.p, t, sp * 7.6, 0.8);
      if (s === 0 || s === 4) v.mr(ch.b + 12, t, 0.55);
      const r = rnd(bar * 31 + s + loop * 7);
      const i = (bar * 8 + s) % GARDEN_MEL.length;
      if (s % 2 === 0 || r() < 0.35) v.kl(GARDEN_MEL[i], t, s % 4 === 0 ? 0.55 : 0.4);
    },
  },
  arcade: {
    bpm: 112, spb: 8, bars: 4,
    play(v, bar, s, t, sp) {
      const ch = ARCADE[bar];
      if (s === 0 || s === 4) v.kick(t, 0.55);
      if (s === 2 || s === 6) v.clap(t, 0.5);
      if (s % 2 === 1) v.hat(t, 0.55);
      if (s === 0 || s === 3 || s === 4 || s === 6) v.bs(ch.b[[0, 3, 4, 6].indexOf(s)], t, sp * 1.2, 0.6);
      v.mr(ch.a[s % 4], t, s % 2 ? 0.32 : 0.45);
    },
  },
  zen: {
    bpm: 66, spb: 8, bars: 8,
    play(v, bar, s, t, sp, loop) {
      if (s === 0 && bar % 4 === 0) v.pad([50, 57, 62], t, sp * 30, 0.7);
      if (s === 0 && bar % 8 === 0) v.bowl(62, t, 0.6);
      const r = rnd(bar * 17 + s * 3 + loop * 11);
      if ((s === 0 || s === 3 || s === 5) && r() < 0.8) v.kt(INSEN[Math.floor(r() * INSEN.length)], t, 0.5);
      if (s === 6 && bar % 2 === 1) v.kt(INSEN[Math.floor(r() * 4)] - 12, t, 0.45);
    },
  },
  den: {
    bpm: 92, spb: 8, bars: 8, swing: 0.12,
    play(v, bar, s, t, sp) {
      if (s === 0 && bar % 4 === 0) v.pad([50, 57, 62], t, sp * 30, 0.6);
      if (s === 0) v.bs(DEN_BASS[bar], t, sp * 3, 0.55);
      if (s === 0 || s === 5) v.kick(t, s === 0 ? 0.36 : 0.24);
      if (s === 3 || s === 7) v.brush(t, 0.55, 0.1);
      if (s % 2 === 1) v.shk(t, 0.32);
      DEN_MEL[bar].forEach(([st, n]) => { if (st === s) v.kt(n, t, st === 0 ? 0.52 : 0.42); });
    },
  },
  parlor: {
    bpm: 104, spb: 8, bars: 8,
    play(v, bar, s, t, sp) {
      const ch = PARLOR[bar];
      if (s === 0) v.bs(ch.b, t, sp * 2.6, 0.62);
      if (s === 3) v.bs(ch.b + 7, t, sp * 1, 0.5);
      if (s === 4) v.bs(ch.b, t, sp * 2.6, 0.5);
      if (s === 7) v.bs(ch.b + 7, t, sp * 1, 0.42);
      if (s === 0 || s === 3 || s === 6) ch.c.forEach((n, i) => v.pn(n, t + i * 0.006, sp * (s === 6 ? 2.2 : 1.4), s === 0 ? 0.4 : 0.32));
      v.shk(t, s % 2 ? 0.4 : 0.6);
      if (s === 3 || s === 6) v.brush(t, 0.5, 0.06);
      const mel = PARLOR_MEL[bar];
      if (mel) mel.forEach(([st, n]) => { if (st === s) v.ep(n, t, sp * 1.6, 0.4); });
    },
  },
  tide: {
    bpm: 70, spb: 8, bars: 8,
    play(v, bar, s, t, sp, loop) {
      if (s === 0 && bar % 2 === 0) v.swell(t, sp * 16, 0.8);
      if (s === 0) v.pad(bar % 4 < 2 ? [50, 57, 62, 66] : [47, 54, 59, 62], t, sp * 8, 0.65);
      const r = rnd(bar * 13 + s + loop * 5);
      if ((s === 2 || s === 6) && r() < 0.7) v.mr([74, 78, 81, 83, 86][Math.floor(r() * 5)], t, 0.35);
    },
  },
};

export const TRACK_NAMES = Object.keys(TRACKS);

export function makeIR(c, secs) {
  const len = Math.floor(c.sampleRate * secs);
  const b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    let last = 0;
    let s = 11 + ch * 97;
    for (let i = 0; i < len; i++) {
      s = (s * 16807) % 2147483647;
      const x = (s / 2147483647) * 2 - 1;
      last = last * 0.72 + x * 0.28;
      d[i] = last * Math.pow(1 - i / len, 2.6);
    }
  }
  return b;
}
