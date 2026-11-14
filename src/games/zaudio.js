import { Sfx } from './sfx.js';
import { resBuf } from './zres.js';

const FILES = {
  ui_click: 0.35, ui_tap: 0.3, cash: 0.7, k_open: 0.45, k_close: 0.4, k_buy: 0.55, k_err: 0.5, k_tog: 0.45, k_latch: 0.65, k_cloth: 0.55, velcro: 0.9, r_cock: 0.75, r_shell: 0.55, dry: 0.6, pin: 0.5, whoosh: 0.7,
  heart: 0.9, nbounce: 0.6, g_ak47: 0.85, g_uzi: 1.7, g_qq9: 0.8, g_lmg: 0.85, g_deagle: 0.85, g_awm: 0.95, g_xpr: 0.85, g_mgl: 0.95, g_spas: 0.9, sv_what: 1, sv_lost: 1, sv_alive: 1, sv_salut: 1, sv_greet: 1, sv_time: 1, gore: 1, heli: 0.9, em_laugh_m: 1, em_laugh_f: 1, em_cheer_m: 1, em_cheer_f: 1, em_hey: 1, em_dance: 0.9, em_samba: 0.95, em_hiphop: 0.85, em_clap: 0.9, g_rifle: 0.8, g_smg: 0.8, g_pistol: 0.8, g_sniper: 0.9, g_shotgun: 0.9,
  r_rifle: 0.55, r_pistol: 0.9, r_sniper: 0.6, r_pump: 0.65,
  boom: 0.95, boom2: 0.9,
  z_growl: 0.6, z_hurt: 0.6, z_death: 0.6, z_moan: 0.55, z_war: 0.6, z_die1: 0.6, z_die2: 0.6, z_pain1: 0.6, z_pain2: 0.55, z_pain3: 0.5,
  z_pain4: 0.6, z_die3: 0.7, z_call1: 0.6, z_call2: 0.6, z_call3: 0.6, z_horde: 0.7, zt_brains1: 0.8, zt_brains2: 0.8, zt_come: 0.8, zt_kill: 0.8, zt_gib: 0.75, z_boss: 1,
  stinger: 0.7, bone: 0.55, d_bark1: 0.75, d_bark2: 0.75, d_bark3: 0.75, d_bark4: 0.75, d_angry: 0.7, d_growl: 0.5, d_whine: 0.5,
  d_step0: 0.35, d_step1: 0.35, d_step2: 0.35, d_step3: 0.35, hit0: 0.5, hit1: 0.5, hit2: 0.5, hithead: 0.6,
  glass0: 0.65, glass1: 0.65, slime0: 0.55, slime1: 0.55, fire: 0.5, slash0: 0.55, slash1: 0.55, chop: 0.65,
  wave_ok: 0.5, shell: 0.45, thud: 0.6, over: 0.75, boom3: 0.85, scream0: 0.75, scream1: 0.75, z_g1: 0.55, z_g2: 0.55, z_g3: 0.55,
  amb_wind: 1, amb_night: 1, water: 1, wave_go: 0.95, tr_pass: 1, tr_horn: 1,
  vo_prepare: 0.95, vo_survival: 0.95, vo_fight: 0.95, vo_r1: 0.95, vo_r2: 0.95, vo_r3: 0.95, vo_r4: 0.95, vo_r5: 0.95, vo_final: 0.95, vo_gameover: 0.95, vo_flawless: 0.95, vo_multi: 0.9, vo_sudden: 0.95,
  vo_obj: 0.8, vo_ready: 0.8, vo_best: 0.8, vo_failed: 0.8, vo_hurry: 0.8,
  cm_reload_m: 0.6, cm_nade_m: 0.65, cm_medic_m: 0.65, cm_cover_m: 0.6, cm_look_m: 0.65, cm_go_m: 0.6, cm_kill_m: 0.6, cm_back_m: 0.6, cm_help_m: 0.65,
  cm_reload_f: 0.6, cm_nade_f: 0.65, cm_medic_f: 0.65, cm_cover_f: 0.6, cm_look_f: 0.65, cm_go_f: 0.6, cm_kill_f: 0.6, cm_back_f: 0.6, cm_help_f: 0.65,
};
const GCLS = { rifle: 'rifle', smg: 'smg', pistol: 'pistol', sniper: 'sniper', shotgun: 'shotgun', deagle: 'pistol', uzi: 'smg', qq9: 'smg', ak47: 'rifle', lmg: 'rifle', xpr: 'sniper', awm: 'sniper', spas: 'shotgun', mgl: 'shotgun' };
const MUSV = 1.4;
const musBufs = {};
function musLoad(name) {
  if (!musBufs[name]) {
    musBufs[name] = resBuf(`/sounds/dead/${name}.mp3`).then((ab) => (ab ? new Promise((res) => ac.decodeAudioData(ab, res, () => res(null))) : null)).then((b) => {
      if (!b) { delete musBufs[name]; return null; }
      const d = b.getChannelData(0);
      let i = 0, j = d.length - 1;
      while (i < d.length && Math.abs(d[i]) < 0.0001) i++;
      while (j > i && Math.abs(d[j]) < 0.0001) j--;
      return { b, a: i / b.sampleRate, e: (j + 1) / b.sampleRate };
    }).catch(() => { delete musBufs[name]; return null; });
  }
  return musBufs[name];
}
const STEPN = { conc: 6, grass: 6, dirt: 6, wood: 6, metal: 6, water: 5 };
const STEPV = { conc: 0.42, grass: 0.4, dirt: 0.42, wood: 0.45, metal: 0.42, water: 0.5 };
for (const k of Object.keys(STEPN)) for (let i = 0; i < STEPN[k]; i++) FILES[`st_${k}${i}`] = STEPV[k];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

let ac = null, bus = null, mus = null, duck = null, rev = null, revIn = null, loadJob = null;
const IOS_AUDIO = (() => { try { return /iP(hone|ad|od)/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); } catch { return false; } })();
const bufs = {}, offs = {};
const L = { x: 0, y: 1.6, z: 0, yaw: 0 };
const voices = [];
const loops = [];
const movers = [];
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
  const free = () => { for (const n of [g, lp, pan, send]) if (n) { try { n.disconnect(); } catch {} } };
  return { g, lp, pan, send, free };
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
  if (c.send) c.send.gain.setValueAtTime(clamp((o.rev == null ? 0.12 : o.rev) + d / (o.revD || 70), 0, 0.6) * vol * 0.8, t);
  return k;
}
const MAXV = 26;
function track(v, cat, lim, pri = 0) {
  if (cat) {
    const same = voices.filter((q) => q.cat === cat);
    if (same.length >= lim) { const old = same[0]; try { old.stop(); } catch {} const i = voices.indexOf(old); if (i >= 0) voices.splice(i, 1); }
  }
  while (voices.length >= MAXV) {
    let k = 0;
    for (let i = 1; i < voices.length; i++) if ((voices[i].pri || 0) < (voices[k].pri || 0)) k = i;
    const old = voices.splice(k, 1)[0]; try { old.stop(); } catch {}
  }
  v.cat = cat;
  v.pri = pri;
  voices.push(v);
  v.onEnd = () => { const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); };
}

export const ZA = {
  ok: false,
  start() {
    Sfx.init();
    return this.sync();
  },
  music(name, o = {}) {
    const vol = o.vol == null ? 1 : o.vol;
    this.musWant = name ? { name, vol } : null;
    if (!ac || !this.sync()) return;
    const cur = this.musCur;
    if (cur && name && cur.name === name) { this.musLevel(vol); return; }
    if (cur) {
      const t = ac.currentTime;
      cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(0, t + (o.fade || 1.6));
      setTimeout(() => { try { cur.src.stop(); } catch {} try { cur.g.disconnect(); } catch {} }, ((o.fade || 1.6) + 0.2) * 1000);
      this.musCur = null;
    }
    if (!name) return;
    musLoad(name).then((m) => {
      const w = this.musWant;
      if (!m || !ac || !w || w.name !== name || (this.musCur && this.musCur.name === name)) return;
      const src = ac.createBufferSource();
      src.buffer = m.b; src.loop = true; src.loopStart = m.a; src.loopEnd = m.e;
      const g = ac.createGain(); g.gain.value = 0;
      src.connect(g); g.connect(mus);
      src.start(0, m.a);
      g.gain.setTargetAtTime(MUSV * w.vol, ac.currentTime + 0.05, o.rise || 0.7);
      this.musCur = { name, src, g };
    });
  },
  duckFor(sec, lvl) {
    if (!duck || !ac) return;
    const t = ac.currentTime;
    duck.gain.cancelScheduledValues(t);
    duck.gain.setTargetAtTime(lvl == null ? 0.2 : lvl, t, 0.15);
    duck.gain.setTargetAtTime(1, t + Math.max(0.2, sec), 0.5);
  },
  unduck() {
    if (!duck || !ac) return;
    const t = ac.currentTime;
    duck.gain.cancelScheduledValues(t);
    duck.gain.setTargetAtTime(1, t, 0.4);
  },
  musLevel(v) {
    if (this.musWant) this.musWant.vol = v;
    if (this.musCur && ac) this.musCur.g.gain.setTargetAtTime(MUSV * v, ac.currentTime, 1.1);
  },
  say(name, o = {}) {
    if (!ac || !Sfx.sfxOn || !bufs[name]) return;
    const now = ac.currentTime;
    const at = Math.max(now + (o.at || 0), this.sayEnd || 0);
    if (at - now > 3.5) return;
    const d = bufs[name].duration;
    this.play(name, { at: at - now, cat: 'vo', lim: 3, pri: 3 });
    this.sayEnd = at + d + 0.12;
    if (duck) { duck.gain.setTargetAtTime(0.45, at, 0.05); duck.gain.setTargetAtTime(1, at + d, 0.35); }
  },
  call(kind, sex, o = {}) {
    if (!ac || !Sfx.sfxOn) return false;
    const now = performance.now();
    this.cmT = this.cmT || {};
    const key = o.key ? `${kind}:${o.key}` : kind;
    if (now < (this.cmT[key] || 0) || now < (this.cmAny || 0)) return false;
    if (o.chance != null && Math.random() > o.chance) return false;
    const n = `cm_${kind}_${sex === 'f' ? 'f' : 'm'}`;
    if (!bufs[n]) return false;
    this.cmT[key] = now + (o.cd || 8) * 1000;
    this.cmAny = now + (o.pos ? 1100 : 1500);
    this.play(n, o.pos ? { at: o.at || 0, cat: 'cm', lim: 2, vary: 0.03, pri: 2, pos: o.pos, ref: 5, roll: 0.8, max: 70, vol: o.vol || 1 } : { at: o.at || 0, cat: 'cm', lim: 1, vary: 0.02, pri: 2 });
    return true;
  },
  init() {
    Sfx.init();
    if (!this.sync()) return false;
    this.ok = true;
    this.load();
    return true;
  },
  sync() {
    const b = Sfx.bus();
    if (!b) return false;
    if (ac === b.ac) return true;
    const had = !!ac;
    ac = b.ac;
    bus = ac.createGain(); bus.gain.value = 0.9; bus.connect(b.out);
    const mb = Sfx.mbus ? Sfx.mbus() : null;
    duck = ac.createGain(); duck.gain.value = 1; duck.connect(mb ? mb.out : b.out);
    mus = ac.createGain(); mus.gain.value = 1; mus.connect(duck);
    try { rev = ac.createConvolver(); rev.buffer = makeIR(); revIn = ac.createGain(); revIn.gain.value = 0.5; revIn.connect(rev); rev.connect(bus); } catch { rev = null; }
    voices.length = 0;
    movers.length = 0;
    this.musCur = null;
    this.sayQ = [];
    this.sayEnd = 0;
    if (this.musWant) { const w = this.musWant; this.musWant = null; this.music(w.name, { vol: w.vol }); }
    if (had) {
      for (const h of loops) h.wire();
      const want = this.ambOn;
      amb = null;
      if (want) this.ambience(true, this.ambLevel || 0);
    }
    return true;
  },
  load() {
    if (!ac || loadJob) return loadJob;
    const names = Object.keys(FILES);
    let at = 0;
    const lane = async () => {
      while (at < names.length) {
        const n = names[at++];
        try {
          const ab = await resBuf(`/sounds/dead/${n}.mp3`);
          if (!ab || !ac) continue;
          const buf = await new Promise((res) => ac.decodeAudioData(ab, res, () => res(null)));
          if (!buf) continue;
          bufs[n] = buf;
          const d = buf.getChannelData(0);
          let i = 0; while (i < d.length && Math.abs(d[i]) < 0.006) i++;
          offs[n] = Math.max(0, i / buf.sampleRate - 0.002);
        } catch {}
      }
    };
    loadJob = Promise.all(Array.from({ length: IOS_AUDIO ? 2 : 6 }, lane));
    return loadJob;
  },
  listen(x, y, z, yaw) {
    L.x = x; L.y = y; L.z = z; L.yaw = yaw;
    if (ac) this.sync();
    if (ac && loops.length) { lt++; if (lt % 4 === 0) for (const h of loops) place(h.c, { ...h.o, pos: h.pos }, (h.o.vol || 1) * (Sfx.sfxOn ? 1 : 0)); }
    if (ac && movers.length) for (const h of movers) place(h.c, { ...h.o, pos: h.pos }, h.vol * (Sfx.sfxOn ? 1 : 0));
  },
  has(name) { return !!bufs[name]; },
  play(name, o = {}) {
    if (!ac || !Sfx.sfxOn || !this.sync() || ac.state !== 'running') return null;
    const buf = bufs[name];
    if (!buf) return null;
    const c = chain(o);
    const vol = (FILES[name] || 0.6) * (o.vol == null ? 1 : o.vol);
    if (place(c, o, vol) < 0.012) { c.free(); return null; }
    const s = ac.createBufferSource();
    s.buffer = buf;
    s.playbackRate.value = (o.rate || 1) * (o.vary ? rnd(1 - o.vary, 1 + o.vary) : 1);
    s.connect(c.g);
    const t = ac.currentTime + (o.at || 0);
    const off = offs[name] || 0;
    if (o.dur) { s.start(t, off, o.dur); c.g.gain.setValueAtTime(c.g.gain.value, t + Math.max(0, o.dur - 0.08)); c.g.gain.linearRampToValueAtTime(0, t + o.dur); }
    else s.start(t, off);
    const v = { stop: () => { try { s.stop(); } catch {} }, s, fade: (d) => { try { const t1 = ac.currentTime, gn = c.g.gain; gn.cancelScheduledValues(t1); gn.setValueAtTime(gn.value, t1); gn.linearRampToValueAtTime(0, t1 + d); s.stop(t1 + d + 0.02); } catch {} } };
    s.onended = () => { v.onEnd && v.onEnd(); c.free(); };
    track(v, o.cat, o.lim || 8, o.pri || 0);
    return v;
  },
  synth(kind, o = {}) {
    if (!ac || !Sfx.sfxOn) return;
    const r = (n) => (Math.random() * n) | 0;
    if (kind === 'step') { const k = STEPN[o.surf] ? o.surf : o.grass ? 'grass' : 'conc'; const n = STEPN[k]; let i = r(n); if (i === this.lastStep) i = (i + 1) % n; this.lastStep = i; this.play(`st_${k}${i}`, { ...o, vary: 0.06, cat: 'step', lim: 3 }); return; }
    if (kind === 'shuffle') { const k = STEPN[o.surf] ? o.surf : 'dirt'; this.play(`st_${k}${r(STEPN[k])}`, { ...o, vol: (o.vol || 1) * 0.45, rate: 0.82, vary: 0.05, cat: 'step', lim: 3 }); return; }
    if (kind === 'paw') { this.play(`d_step${r(4)}`, { ...o, vary: 0.08, cat: 'paw', lim: 2 }); return; }
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
    const n = FILES[`g_${kind}`] != null ? `g_${kind}` : `g_${GCLS[kind] || 'rifle'}`;
    const mine = !o.pos;
    this.play(n, { ...o, vary: 0.04, cat: mine ? 'mygun' : 'gun', lim: mine ? 4 : 6, rev: mine ? 0.18 : 0.12, revD: 170, ref: 6, roll: 1.25, muff: 38, max: 72 });
  },
  reload(kind, dur) {
    if (kind === 'shotgun') { const n = Math.max(2, Math.min(5, Math.floor((dur - 0.7) / 0.38))); for (let i = 0; i < n; i++) this.play('r_shell', { at: 0.22 + i * 0.38, vary: 0.05 }); this.play('r_pump', { at: Math.max(0.1, dur - 0.55) }); return; }
    if (kind === 'sniper') { this.play('r_sniper', { rate: 2.38 / Math.max(1.4, dur) }); return; }
    if (kind === 'pistol') { this.play('r_pistol', { rate: 1.6, dur: 1.4 }); return; }
    this.play('r_rifle', { rate: clamp(2.3 / Math.max(1, dur), 0.9, 1.4) });
  },
  zvoice(kind, pos, what) {
    const pitch = { brute: 0.62, bloater: 0.78, runner: 1.18, riot: 0.88, screamer: 1.25, spitter: 1.1, crawler: 0.95, worker: 0.9 }[kind] || 1;
    if (what === 'talk') {
      const n = pick(['zt_brains1', 'zt_brains2', 'zt_come', 'zt_kill', 'zt_gib', 'zt_brains1', 'zt_kill']);
      return this.play(n, { pos, rate: clamp(0.92 + (pitch - 1) * 0.35, 0.8, 1.12), vary: 0.04, cat: 'zt', lim: 2, pri: 1, ref: 5, roll: 0.9, rev: 0.2, muff: 26, max: 42, vol: 1.25 });
    }
    const names = what === 'die' ? ['z_death', 'z_die1', 'z_die2', 'z_die3', 'z_die3'] : what === 'hurt' ? ['z_hurt', 'z_pain1', 'z_pain2', 'z_pain3', 'z_pain4'] : what === 'attack' ? ['z_war', 'z_pain2', 'z_growl'] : kind === 'runner' ? ['z_war', 'z_pain2', 'z_moan', 'z_g3', 'z_call2'] : ['z_growl', 'z_moan', 'z_g1', 'z_g2', 'z_g3', 'z_call1', 'z_call2', 'z_call3'];
    if (what === 'die') return this.play(pick(names), { pos, rate: pitch, vary: 0.06, cat: 'zd', lim: 4, pri: 2, at: 0.05, ref: 6, roll: 0.85, rev: 0.22, muff: 30, max: 52, vol: 1.6 });
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
      amb = { g, w, n, stop: () => { try { w.src.stop(); n.src.stop(); } catch {} for (const x of [g, w.gg, n.gg]) { try { x.disconnect(); } catch {} } } };
      g.gain.setTargetAtTime(1, ac.currentTime, 1.5);
    }
    this.ambOn = true;
    this.ambLevel = level;
    amb.w.gg.gain.setTargetAtTime(0.22 + level * 0.12, ac.currentTime, 2.5);
    amb.n.gg.gain.setTargetAtTime(0.24 - level * 0.1, ac.currentTime, 2.5);
  },
  loopAt(name, pos, o = {}) {
    if (!ac || !bufs[name] || !this.sync()) return null;
    const h = { name, pos, o, c: null, src: null };
    h.wire = () => {
      const c = chain({ pos });
      const src = ac.createBufferSource(); src.buffer = bufs[name]; src.loop = true; src.connect(c.g); src.start(0, Math.random() * bufs[name].duration);
      h.c = c; h.src = src;
      place(c, { ...o, pos }, (o.vol || 1) * (Sfx.sfxOn ? 1 : 0));
    };
    h.stop = () => { try { h.src.stop(); } catch {} if (h.c) h.c.free(); const i = loops.indexOf(h); if (i >= 0) loops.splice(i, 1); };
    h.wire();
    loops.push(h);
    return h;
  },
  mover(name, pos, o = {}) {
    if (!ac || !Sfx.sfxOn || !bufs[name] || !this.sync() || ac.state !== 'running') return null;
    const c = chain({ pos });
    const s = ac.createBufferSource();
    s.buffer = bufs[name];
    s.connect(c.g);
    const h = { c, s, pos, o, vol: (FILES[name] || 0.6) * (o.vol == null ? 1 : o.vol) };
    place(c, { ...o, pos }, h.vol);
    s.onended = () => { c.free(); const i = movers.indexOf(h); if (i >= 0) movers.splice(i, 1); };
    h.stop = () => { try { s.stop(); } catch {} };
    s.start(ac.currentTime + (o.at || 0));
    movers.push(h);
    return h;
  },
  stopAll() { for (const h of movers.slice()) h.stop(); for (const v of voices.slice()) v.stop(); voices.length = 0; for (const h of loops.slice()) h.stop(); this.ambOn = false; this.ambience(false); this.music(null, { fade: 0.4 }); },
};
