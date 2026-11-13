const MAP = {"bub1":[0.25,0.1149],"bub2":[0.5449,0.1882],"bub3":[0.913,0.1882],"bub4":[1.2812,0.2051],"bubbles":[1.6663,1.4],"gulp1":[3.2463,0.369],"gulp2":[3.7953,4.7098],"gulp3":[8.6851,0.6626],"chomp":[9.5277,0.2632],"die":[9.971,0.7118],"suck":[10.8627,0.7466],"dash":[11.7894,4.3479],"evolve":[16.3173,0.38],"skill":[16.8773,0.1584],"alert":[17.2156,0.1045],"shield":[17.5001,0.747],"shock":[18.4271,0.3825],"pick":[18.9896,0.2898],"combo":[19.4595,0.2077],"pop":[19.8472,0.0995],"jump":[20.1267,0.1151],"land":[20.4218,0.1804],"stomp":[20.7822,0.5138],"coin":[21.4759,0.725],"star":[22.3809,0.539],"cp":[23.0999,0.4904],"spring":[23.7703,0.3889],"ballpop":[24.3392,0.3512],"win":[24.8704,0.322],"click":[25.3724,0.0497],"door":[25.6021,0.9154],"break":[26.6975,0.3101],"key":[27.1876,0.3696],"bump":[27.7372,0.1323],"swing":[28.0495,0.3916],"fireball":[28.6211,5.0],"frost":[33.8011,0.1827],"hit":[34.1638,0.375],"poof":[34.7188,0.4651],"hurt":[35.3638,0.4338],"pdie":[35.9776,0.6696],"bat":[36.8272,0.5178],"rattle":[37.5249,0.1355],"lever":[37.8404,0.2286],"amb":[38.249,3.2],"nib1":[41.629,0.0882],"nib2":[41.8972,0.1239],"munch1":[42.2011,0.2802],"munch2":[42.6613,0.3764],"munch3":[43.2177,0.3358],"bigchomp1":[43.7335,0.3838],"bigchomp2":[44.2973,0.427],"slurp":[44.9043,3.623],"burp":[48.7073,0.8277]};
const MUSIC = { sea: { url: '/music-sea-v1.mp3', len: 20.0 }, roll: { url: '/music-roll-v1.mp3', len: 15.48387 }, lobbyRace: { url: '/music-lobby-race-v1.mp3', len: 19.2 }, lobbyRoll: { url: '/music-lobby-roll-v1.mp3', len: 17.14286 }, lobbyDuo: { url: '/music-lobby-duo-v1.mp3', len: 21.81818 }, lobbyGulp: { url: '/music-lobby-gulp-v1.mp3', len: 22.85714 }, lobbySiege: { url: '/music-lobby-siege-v1.mp3', len: 18.46154 }, siege: { url: '/music-siege-v1.mp3', len: 15.2381 } };
const LEAD = 0.2;

let ac = null;
let master = null;
let sfxBus = null;
let musBus = null;
let sprite = null;
let spriteJob = null;
const musicBufs = {};
const musicJobs = {};
let musicNow = null;
let ambNow = null;
let voices = 0;
const lastAt = {};

function pref(key, dflt) {
  try { const v = localStorage.getItem(key); return v == null ? dflt : v === '1'; } catch { return dflt; }
}
function setPref(key, on) {
  try { localStorage.setItem(key, on ? '1' : '0'); } catch {}
}

const vol = (k, d) => { try { const v = Number(localStorage.getItem(k)); return Number.isFinite(v) && localStorage.getItem(k) != null ? Math.max(0, Math.min(1, v)) : d; } catch { return d; } };

export const Sfx = {
  sfxOn: pref('zchat-game-sfx', true),
  musicOn: pref('zchat-game-music', true),
  sfxVol: vol('zchat-game-sfxvol', 1),
  musicVol: vol('zchat-game-musvol', 1),
  init() {
    if (typeof window === 'undefined') return;
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ac = new AC({ latencyHint: 'interactive' }); } catch { try { ac = new AC(); } catch { ac = null; return; } }
      master = ac.createGain();
      master.gain.value = 0.9;
      const comp = ac.createDynamicsCompressor();
      comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.18;
      master.connect(comp); comp.connect(ac.destination);
      sfxBus = ac.createGain(); sfxBus.gain.value = this.sfxOn ? this.sfxVol : 0; sfxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = this.musicOn ? 0.55 * this.musicVol : 0; musBus.connect(master);
      try { ac.addEventListener('statechange', () => { if (ac && ac.state !== 'running' && typeof document !== 'undefined' && document.visibilityState !== 'hidden') armWake(); }); } catch {}
    }
    if (ac.state !== 'running') { try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch {} }
    this.load();
  },
  load() {
    if (!ac || sprite || spriteJob) return spriteJob;
    spriteJob = fetch('/games-sfx-v3.mp3').then((r) => r.arrayBuffer()).then((b) => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).then((buf) => { sprite = buf; return buf; }).catch(() => { spriteJob = null; return null; });
    return spriteJob;
  },
  ready() { return !!sprite; },
  ctx() { if (!ac) this.init(); return ac; },
  play(name, o) {
    if (!ac || !sprite || !this.sfxOn) return null;
    const seg = MAP[name];
    if (!seg) return null;
    const opt = o || {};
    const now = ac.currentTime;
    const gap = opt.gap == null ? 0.03 : opt.gap;
    if (lastAt[name] && now - lastAt[name] < gap) return null;
    if (voices > 22 && !opt.force) return null;
    lastAt[name] = now;
    try {
      const src = ac.createBufferSource();
      src.buffer = sprite;
      const rate = opt.rate || 1;
      src.playbackRate.value = rate;
      const g = ac.createGain();
      g.gain.value = opt.vol == null ? 1 : opt.vol;
      let node = g;
      if (opt.pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, opt.pan)); g.connect(p); node = p; }
      src.connect(g); node.connect(sfxBus);
      const st = Math.max(0, seg[0] - 0.005);
      const dur = Math.min(opt.dur || seg[1], seg[1]) + 0.01;
      src.start(now + (opt.at || 0), st, dur);
      voices += 1;
      src.onended = () => { voices = Math.max(0, voices - 1); try { src.disconnect(); g.disconnect(); } catch {} };
      return { stop: (fade) => { try { const t = ac.currentTime; g.gain.setTargetAtTime(0, t, (fade || 0.05) / 3); src.stop(t + (fade || 0.05)); } catch {} } };
    } catch { return null; }
  },
  amb(on, vol) {
    if (!ac) return;
    if (ambNow) { const a = ambNow; ambNow = null; try { a.g.gain.setTargetAtTime(0, ac.currentTime, 0.3); a.src.stop(ac.currentTime + 1.2); } catch {} }
    if (!on || !sprite) return;
    const seg = MAP.amb;
    try {
      const src = ac.createBufferSource();
      src.buffer = sprite;
      src.loop = true;
      src.loopStart = seg[0];
      src.loopEnd = seg[0] + seg[1];
      const g = ac.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(vol == null ? 0.5 : vol, ac.currentTime, 0.4);
      src.connect(g); g.connect(sfxBus);
      src.start(ac.currentTime, seg[0]);
      ambNow = { src, g };
    } catch {}
  },
  music(name, on) {
    if (!ac) return;
    if (musicNow && (!on || musicNow.name !== name)) {
      const m = musicNow; musicNow = null;
      try { m.g.gain.setTargetAtTime(0, ac.currentTime, 0.35); m.src.stop(ac.currentTime + 1.5); } catch {}
    }
    if (!on || !MUSIC[name] || (musicNow && musicNow.name === name)) return;
    const want = { name };
    musicNow = want;
    const go = (buf) => {
      if (musicNow !== want || !buf) return;
      try {
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        src.loopStart = LEAD + 0.5;
        src.loopEnd = LEAD + 0.5 + MUSIC[name].len;
        const g = ac.createGain();
        g.gain.value = 0;
        g.gain.setTargetAtTime(1, ac.currentTime, 0.6);
        src.connect(g); g.connect(musBus);
        src.start(ac.currentTime + 0.05, LEAD);
        want.src = src; want.g = g;
      } catch {}
    };
    if (musicBufs[name]) { go(musicBufs[name]); return; }
    if (!musicJobs[name]) {
      musicJobs[name] = fetch(MUSIC[name].url).then((r) => r.arrayBuffer()).then((b) => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).then((buf) => { musicBufs[name] = buf; return buf; }).catch(() => { musicJobs[name] = null; return null; });
    }
    musicJobs[name].then(go);
  },
  stopAll() {
    this.music(null, false);
    this.amb(false);
  },
  setSfx(on) {
    this.sfxOn = !!on; setPref('zchat-game-sfx', this.sfxOn);
    if (sfxBus) sfxBus.gain.setTargetAtTime(this.sfxOn ? this.sfxVol : 0, ac.currentTime, 0.05);
  },
  setSfxVol(v) {
    this.sfxVol = Math.max(0, Math.min(1, Number(v) || 0));
    try { localStorage.setItem('zchat-game-sfxvol', String(this.sfxVol)); } catch {}
    if (sfxBus) sfxBus.gain.setTargetAtTime(this.sfxOn ? this.sfxVol : 0, ac.currentTime, 0.05);
  },
  setMusicVol(v) {
    this.musicVol = Math.max(0, Math.min(1, Number(v) || 0));
    try { localStorage.setItem('zchat-game-musvol', String(this.musicVol)); } catch {}
    if (musBus) musBus.gain.setTargetAtTime(this.musicOn ? 0.55 * this.musicVol : 0, ac.currentTime, 0.1);
  },
  setMusic(on) {
    this.musicOn = !!on; setPref('zchat-game-music', this.musicOn);
    if (musBus) musBus.gain.setTargetAtTime(this.musicOn ? 0.55 * this.musicVol : 0, ac.currentTime, 0.1);
  },
  pause(hidden) {
    if (!ac) return;
    try { if (hidden) ac.suspend(); else ac.resume(); } catch {}
  },
  bus() { return ac && sfxBus ? { ac, out: sfxBus } : null; },
  mbus() { return ac && musBus ? { ac, out: musBus } : null; },
};

let wakeArmed = false;
function rebuildSfx() {
  const keep = musicNow ? musicNow.name : null;
  try { if (ac) ac.close(); } catch {}
  ac = null; master = null; sfxBus = null; musBus = null; musicNow = null;
  Sfx.init();
  if (keep) Sfx.music(keep, true);
}
function armWake() {
  if (wakeArmed || typeof document === 'undefined') return;
  wakeArmed = true;
  const evs = ['pointerdown', 'touchend', 'keydown', 'click'];
  const go = () => {
    evs.forEach((e) => document.removeEventListener(e, go, true));
    wakeArmed = false;
    if (!ac || document.visibilityState === 'hidden') return;
    try { const b = ac.createBuffer(1, 1, 22050); const s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(0); } catch {}
    try { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); } catch {}
    setTimeout(() => { if (ac && ac.state !== 'running' && document.visibilityState !== 'hidden') rebuildSfx(); }, 650);
  };
  evs.forEach((e) => document.addEventListener(e, go, true));
}
if (typeof document !== 'undefined') {
  const back = () => { if (!ac || document.visibilityState === 'hidden') return; Sfx.pause(false); if (ac.state !== 'running') armWake(); else setTimeout(() => { if (ac && ac.state !== 'running') armWake(); }, 400); };
  document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.visibilityState === 'hidden') Sfx.pause(true); else back(); });
  window.addEventListener('pageshow', back);
  window.addEventListener('focus', back);
}
