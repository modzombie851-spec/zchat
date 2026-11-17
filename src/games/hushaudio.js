import { Sfx } from './sfx.js';
import { resBuf } from './zres.js';

export const HUSH_SND = ['sounds/hush/sfx-v3.mp3', 'sounds/hush/amb-v1.mp3', 'sounds/hush/drip-v1.mp3', 'sounds/hush/hum-v1.mp3', 'sounds/dead/heart.mp3'];
export const HUSH_MUS = { menu: 'sounds/hush/menu-v1.mp3', room: 'sounds/hush/room-v1.mp3', explore: 'sounds/hush/explore-v1.mp3', hunt: 'sounds/hush/hunt-v1.mp3', chase: 'sounds/hush/chase-v1.mp3', dead: 'sounds/hush/dead-v1.mp3' };
const MAP = {"roar1":[0.0,3.214],"roar2":[3.274,2.793],"growl1":[6.127,2.901],"growl2":[9.088,3.155],"growl3":[12.303,2.575],"growl4":[14.937,3.4],"snarl":[18.397,1.359],"groan1":[19.817,3.125],"groan2":[23.002,2.477],"groan3":[25.539,1.621],"groan4":[27.22,0.756],"sniff":[28.035,1.015],"scream1":[29.11,2.274],"scream2":[31.444,1.783],"hit1":[33.287,3.0],"hit2":[36.347,3.0],"hit3":[39.407,2.8],"hit4":[42.267,2.8],"hit5":[45.127,2.8],"sting1":[47.987,1.741],"sting2":[49.788,1.621],"sting3":[51.469,1.348],"bone1":[52.877,0.527],"bone2":[53.464,0.359],"stab":[53.882,0.362],"gate":[54.304,0.929],"breath0":[55.293,1.84],"breath1":[57.193,1.096],"breath2":[58.349,1.56],"breath3":[59.969,1.114],"breath4":[61.143,1.863],"breath5":[63.066,1.355],"drip0":[64.481,0.355],"drip1":[64.896,0.326],"drip2":[65.281,0.271],"drip3":[65.612,0.353],"step0":[66.025,0.132],"step1":[66.217,0.132],"step2":[66.409,0.132],"step3":[66.6,0.132],"step4":[66.792,0.132],"step5":[66.984,0.132],"step6":[67.176,0.132],"step7":[67.367,0.132],"step8":[67.559,0.132],"mstep0":[67.751,0.527],"mstep1":[68.338,0.569],"mstep2":[68.967,0.569],"mstep3":[69.596,0.541],"dopen1":[70.197,0.917],"dopen2":[71.175,1.404],"dclose1":[72.638,0.664],"dclose2":[73.362,0.59],"slam":[74.012,0.599],"thud":[74.671,0.31],"creak0":[75.041,0.6],"creak1":[75.7,0.761],"creak2":[76.521,0.304],"keys":[76.885,0.737],"keys2":[77.682,0.309],"latch":[78.051,0.239],"mclick":[78.35,0.38],"clank1":[78.789,0.269],"clank2":[79.118,0.116],"click":[79.294,0.168],"cloth":[79.523,0.348],"grab":[79.931,0.215],"drop":[80.206,0.311],"knock":[80.577,0.33],"tin":[80.966,0.212],"win":[81.238,5.0],"lose":[86.298,4.774],"moan1":[91.132,3.6],"moan2":[94.792,3.6],"isee":[98.452,6.196],"iseew":[104.708,6.193],"crunch1":[110.961,0.197],"crunch2":[111.218,0.306],"body0":[111.584,0.524],"body1":[112.168,0.444],"body2":[112.672,0.394],"gore":[113.125,1.168],"whoosh":[114.354,0.453],"scream3":[114.867,0.994],"scream4":[115.921,1.269],"laugh1":[117.25,3.374],"laugh2":[120.684,2.782],"stab2":[123.526,0.324],"whisper0":[123.91,3.6],"whisper1":[127.57,3.6],"whisper2":[131.23,3.6],"whisper3":[134.89,3.6],"whisper4":[138.55,3.6],"whisper5":[142.21,3.6],"rattle":[145.87,0.851],"bang1":[146.781,0.31],"bang2":[147.151,0.31],"lockin":[147.521,0.619],"lockout":[148.2,0.552],"lockbang":[148.812,0.534],"farscream":[149.406,1.064],"pipe1":[150.53,0.165],"pipe2":[150.754,0.697],"glass":[151.512,0.429],"knock3":[152.001,1.2],"runabove":[153.26,2.439],"howl":[155.759,0.551],"screech1":[156.37,0.346],"screech2":[156.777,0.51],"snarl2":[157.347,0.439],"snarl3":[157.846,0.42],"sniff2":[158.325,0.312],"breathc":[158.697,0.994],"drone":[159.751,5.5],"chains":[165.311,0.692],"wheel":[166.063,0.304],"scrape":[166.427,0.552]};
let ac = null, out = null, bus = null, mus = null, rev = null, revIn = null, job = null, sprite = null, ticker = 0, lastTick = 0;
const mbuf = {}, mjob = {};
const want = {};
const loopBufs = {};
const L = { x: 0, y: 1.6, z: 0, yaw: 0 };
const voices = [];
const loops = {};
let occ = null;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function makeIR(sec, decay) {
  const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) { const t = i / ac.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay) * (t < 0.02 ? t / 0.02 : 1); }
    for (const [at, g] of [[0.031 + c * 0.007, 0.5], [0.067 + c * 0.011, 0.35], [0.113 + c * 0.005, 0.25]]) {
      const e = Math.floor(ac.sampleRate * at);
      for (let i = 0; i < 300; i++) if (e + i < n) d[e + i] += (Math.random() * 2 - 1) * g * (1 - i / 300);
    }
  }
  return b;
}

function shrink(b) {
  const R = 24000;
  const n = Math.max(1, Math.floor(b.duration * R));
  const o = ac.createBuffer(1, n, R);
  const d = o.getChannelData(0);
  const c0 = b.getChannelData(0), c1 = b.numberOfChannels > 1 ? b.getChannelData(1) : c0;
  const k = b.sampleRate / R, N = c0.length;
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * k), e = Math.min(N, Math.max(a + 1, Math.floor((i + 1) * k)));
    let s = 0;
    for (let j = a; j < e; j++) s += c0[j] + c1[j];
    d[i] = s / (2 * (e - a));
  }
  return o;
}

function decode(ab) { return new Promise((res) => { try { ac.decodeAudioData(ab, res, () => res(null)); } catch { res(null); } }); }

async function fetchBuf(path) {
  try { const ab = await resBuf(`/${path}`); if (ab) return ab; } catch {}
  try { const r = await fetch(`/${path}`); if (r.ok) return await r.arrayBuffer(); } catch {}
  return null;
}

function chain(o) {
  const g = ac.createGain();
  g.gain.value = 0;
  let last = g, lp = null, pan = null, bp = null, ws = null;
  if (o.radio) {
    bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.6;
    ws = ac.createWaveShaper();
    const cur = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cur[i] = Math.tanh(x * 3.2); }
    ws.curve = cur;
    last.connect(bp); bp.connect(ws); last = ws;
  }
  if (o.pos || o.lp) { lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp || 18000; last.connect(lp); last = lp; }
  if (o.pos && ac.createStereoPanner) { pan = ac.createStereoPanner(); last.connect(pan); last = pan; }
  last.connect(o.bus || bus);
  let send = null;
  if (rev) { send = ac.createGain(); send.gain.value = 0; last.connect(send); send.connect(revIn); }
  const free = () => { for (const n of [g, lp, pan, send, bp, ws]) if (n) { try { n.disconnect(); } catch {} } };
  return { g, lp, pan, send, free, o };
}

function place(c, vol, smooth) {
  const o = c.o;
  const t = ac.currentTime;
  const set = (p, v) => { if (smooth) p.setTargetAtTime(v, t, 0.06); else p.setValueAtTime(v, t); };
  if (!o.pos) { set(c.g.gain, vol); if (c.send) set(c.send.gain, (o.rev == null ? 0.18 : o.rev) * vol); return; }
  const dx = o.pos[0] - L.x, dz = o.pos[2] - L.z, dy = (o.pos[1] == null ? 1 : o.pos[1]) - L.y;
  const d = Math.hypot(dx, dy, dz);
  const ref = o.ref || 3;
  let k = ref / (ref + Math.max(0, d - 0.8) * (o.roll || 1));
  if (o.max) k *= clamp(1 - (d - o.max * 0.7) / (o.max * 0.3), 0, 1);
  const ang = Math.atan2(dx, dz) - L.yaw;
  const side = Math.sin(ang);
  const hidden = occ && d > 1.2 ? occ(o.pos[0], o.pos[2]) : 0;
  set(c.g.gain, vol * k * (hidden ? 0.62 : 1));
  if (c.pan) set(c.pan.pan, clamp(-side * 0.8, -0.85, 0.85));
  if (c.lp) set(c.lp.frequency, clamp((hidden ? 1500 : 16000) * Math.exp(-d / (hidden ? 18 : 40)) * (Math.cos(ang) < -0.3 ? 0.75 : 1), 280, 16000));
  if (c.send) set(c.send.gain, clamp((o.rev == null ? 0.22 : o.rev) + d / 28, 0, 0.75) * vol * 0.9);
}

export const HA = {
  ok: false,
  vol: 1,
  init() {
    Sfx.init();
    ac = Sfx.ctx();
    if (!ac) return false;
    if (!out) {
      out = ac.createGain();
      out.gain.value = Sfx.sfxOn ? (Sfx.sfxVol == null ? 1 : Sfx.sfxVol) : 0;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.22;
      out.connect(comp); comp.connect(ac.destination);
      bus = ac.createGain(); bus.gain.value = 1; bus.connect(out);
      mus = ac.createGain(); mus.gain.value = Sfx.musicOn ? 0.7 * (Sfx.musicVol == null ? 1 : Sfx.musicVol) : 0; mus.connect(out);
      try {
        rev = ac.createConvolver(); rev.buffer = makeIR(2.6, 2.3);
        revIn = ac.createGain(); revIn.gain.value = 0.9;
        const rlp = ac.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 5200;
        revIn.connect(rev); rev.connect(rlp); rlp.connect(out);
      } catch { rev = null; }
    }
    this.sync();
    this.ok = true;
    if (!ticker && typeof setInterval !== 'undefined') ticker = setInterval(() => { if (performance.now() - lastTick > 120) this.tick(true); }, 60);
    return true;
  },
  load(map) {
    if (map) Object.assign(MAP, map);
    if (!this.init()) return Promise.resolve(false);
    if (!job) {
      job = (async () => {
        const [s, a, d, h, hb] = await Promise.all(HUSH_SND.map((p) => fetchBuf(p)));
        sprite = s ? await decode(s) : null;
        loopBufs.amb = a ? await decode(a) : null;
        loopBufs.drip = d ? await decode(d) : null;
        loopBufs.hum = h ? await decode(h) : null;
        loopBufs.heart = hb ? await decode(hb) : null;
        return !!sprite;
      })();
    }
    return job;
  },
  musicBuf(k) {
    if (mbuf[k]) return Promise.resolve(mbuf[k]);
    if (!HUSH_MUS[k] || !this.init()) return Promise.resolve(null);
    if (!mjob[k]) {
      mjob[k] = (async () => {
        const ab = await fetchBuf(HUSH_MUS[k]);
        const b = ab ? await decode(ab) : null;
        if (!b) { delete mjob[k]; return null; }
        mbuf[k] = shrink(b);
        loopBufs[`m_${k}`] = mbuf[k];
        return mbuf[k];
      })();
    }
    return mjob[k];
  },
  music(levels, fade = 1.6) {
    if (!this.init()) return;
    for (const k of Object.keys(HUSH_MUS)) {
      const v = levels && levels[k] ? levels[k] : 0;
      want[k] = v;
      const key = `m_${k}`;
      if (v > 0) {
        if (loops[key]) { loops[key].vol = v; loops[key].fade = fade; continue; }
        this.musicBuf(k).then((b) => { if (!b || !(want[k] > 0) || loops[key]) return; this.loop(key, { buf: key, vol: want[k], bus: mus, fade, off: 0.01 }); });
      } else if (loops[key]) this.stopLoop(key, fade);
    }
  },
  menuMusic(on) { this.music(on ? { menu: 0.85 } : null, on ? 2.5 : 1.2); },
  dropMusic(keep) { for (const k of Object.keys(mbuf)) { if (keep && keep.includes(k)) continue; if (loops[`m_${k}`]) continue; delete mbuf[k]; delete mjob[k]; delete loopBufs[`m_${k}`]; } },
  sync() {
    if (!ac || !out) return;
    const t = ac.currentTime;
    out.gain.setTargetAtTime(Sfx.sfxOn ? (Sfx.sfxVol == null ? 1 : Sfx.sfxVol) : 0, t, 0.05);
    mus.gain.setTargetAtTime(Sfx.musicOn ? 0.7 * (Sfx.musicVol == null ? 1 : Sfx.musicVol) : 0, t, 0.05);
  },
  setListener(x, y, z, yaw, occFn) { L.x = x; L.y = y; L.z = z; L.yaw = yaw; occ = occFn || null; },
  play(name, o = {}) {
    if (!ac || !sprite || !Sfx.sfxOn) return null;
    const seg = MAP[name];
    if (!seg) return null;
    if (voices.length > 30) { const v = voices.shift(); try { v.src.stop(); } catch {} }
    const src = ac.createBufferSource();
    src.buffer = sprite;
    src.playbackRate.value = o.rate || 1;
    const c = chain(o);
    src.connect(c.g);
    place(c, o.vol == null ? 1 : o.vol);
    const st = Math.max(0, seg[0] - 0.004);
    const dur = Math.min(o.dur || seg[1], seg[1]) + 0.02;
    const at = ac.currentTime + (o.at || 0);
    src.start(at, st, dur);
    const v = { src, c, name, end: at + dur / (o.rate || 1), mov: o.follow || null };
    voices.push(v);
    src.onended = () => { c.free(); const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); };
    return v;
  },
  loop(key, o) {
    if (!ac) return;
    const buf = loopBufs[o.buf || key];
    if (!buf) return;
    if (loops[key]) { loops[key].c.o = { ...loops[key].c.o, ...o }; loops[key].vol = o.vol; return; }
    const src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    const c = chain({ ...o, bus: o.bus || bus });
    src.connect(c.g);
    const t = ac.currentTime;
    c.g.gain.setValueAtTime(0, t);
    src.start(t, o.off ? (o.off % buf.duration) : Math.random() * buf.duration * 0.5);
    loops[key] = { src, c, vol: o.vol == null ? 1 : o.vol, fade: o.fade || 1.5, born: t };
  },
  loopVol(key, vol, rate) {
    const l = loops[key];
    if (!l || !ac) return;
    l.vol = vol;
    if (rate) l.src.playbackRate.setTargetAtTime(rate, ac.currentTime, 0.3);
  },
  loopPos(key, pos) { const l = loops[key]; if (l) l.c.o.pos = pos; },
  stopLoop(key, fade = 0.6) {
    const l = loops[key];
    if (!l || !ac) return;
    delete loops[key];
    const t = ac.currentTime;
    try { l.c.g.gain.cancelScheduledValues(t); l.c.g.gain.setTargetAtTime(0, t, fade / 3); l.src.stop(t + fade + 0.1); } catch {}
    setTimeout(() => l.c.free(), (fade + 0.3) * 1000);
  },
  stopAll() { for (const k of Object.keys(loops)) this.stopLoop(k, 0.4); for (const v of voices.splice(0)) { try { v.src.stop(); } catch {} } },
  tick(self) {
    if (!ac) return;
    if (!self) lastTick = performance.now();
    const t = ac.currentTime;
    for (const l of Object.values(loops)) {
      const age = t - l.born;
      const ramp = Math.min(1, age / l.fade);
      if (l.c.o.bus === mus) {
        const dtS = l.lt == null ? 0 : Math.max(0, t - l.lt);
        l.lt = t;
        if (l.cur == null) l.cur = 0;
        l.cur += (l.vol - l.cur) * Math.min(1, dtS / Math.max(0.15, l.fade * 0.5));
        place(l.c, l.cur, true);
        continue;
      }
      place(l.c, l.vol * ramp, true);
    }
    for (const v of voices) {
      if (v.mov) { const p = v.mov(); if (p) v.c.o.pos = p; place(v.c, v.c.o.vol == null ? 1 : v.c.o.vol, true); }
    }
  },
  setVolumes() {
    if (!out || !ac) return;
    out.gain.setTargetAtTime(Sfx.sfxOn ? Sfx.sfxVol : 0, ac.currentTime, 0.05);
    mus.gain.setTargetAtTime(Sfx.musicOn ? 0.7 * Sfx.musicVol : 0, ac.currentTime, 0.05);
  },
  duck(k, sec) {
    if (!out || !ac) return;
    const t = ac.currentTime;
    const base = Sfx.sfxOn ? Sfx.sfxVol : 0;
    out.gain.cancelScheduledValues(t);
    out.gain.setTargetAtTime(base * k, t, 0.03);
    out.gain.setTargetAtTime(base, t + sec, 0.6);
  },
};
