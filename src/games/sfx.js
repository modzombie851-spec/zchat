const MAP = {"bub1":[0.25,0.56],"bub2":[0.99,0.5535],"bub3":[1.7235,0.5464],"bub4":[2.45,0.537],"bubbles":[3.167,1.4449],"gulp1":[4.792,0.6289],"gulp2":[5.6009,0.9384],"gulp3":[6.7193,1.3722],"chomp":[8.2715,0.6785],"die":[9.1299,2.0248],"suck":[11.3347,1.857],"dash":[13.3717,0.9073],"evolve":[14.459,3.4266],"skill":[18.0655,1.8218],"alert":[20.0674,1.3265],"shield":[21.5739,1.6765],"shock":[23.4304,1.352],"pick":[24.9624,1.5175],"combo":[26.6599,1.0833],"pop":[27.9232,0.4278],"jump":[28.531,0.4537],"land":[29.1647,0.16],"stomp":[29.5047,0.7959],"coin":[30.4806,0.7437],"star":[31.4043,1.9977],"cp":[33.582,2.7234],"spring":[36.4854,0.9593],"ballpop":[37.6246,1.1758],"win":[38.9804,3.5299],"click":[42.6903,0.0987],"door":[42.969,1.8273],"break":[44.9764,1.0003],"key":[46.1567,1.1192],"bump":[47.4558,0.1],"swing":[47.7358,0.6857],"fireball":[48.6016,1.3131],"frost":[50.0946,1.5114],"hit":[51.7861,0.1789],"poof":[52.145,1.1558],"hurt":[53.4808,0.6893],"pdie":[54.3501,2.2019],"bat":[56.732,0.7609],"rattle":[57.6728,0.8589],"lever":[58.7117,0.6025],"amb":[59.4942,6.0],"nib1":[65.6742,0.5791],"nib2":[66.4333,0.6062],"munch1":[67.2195,1.0076],"munch2":[68.4071,1.0077],"munch3":[69.5948,1.0051],"bigchomp1":[70.7799,1.5243],"bigchomp2":[72.4842,1.5401],"slurp":[74.2043,1.3259],"burp":[75.7102,0.9851]};
const MUSIC = { sea: { url: '/music-sea-v1.mp3', len: 20.0 }, roll: { url: '/music-roll-v1.mp3', len: 15.48387 } };
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

export const Sfx = {
  sfxOn: pref('zchat-game-sfx', true),
  musicOn: pref('zchat-game-music', true),
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
      sfxBus = ac.createGain(); sfxBus.gain.value = this.sfxOn ? 1 : 0; sfxBus.connect(master);
      musBus = ac.createGain(); musBus.gain.value = this.musicOn ? 0.55 : 0; musBus.connect(master);
    }
    if (ac.state === 'suspended') { const r = ac.resume(); if (r && r.catch) r.catch(() => {}); }
    this.load();
  },
  load() {
    if (!ac || sprite || spriteJob) return spriteJob;
    spriteJob = fetch('/games-sfx-v2.mp3').then((r) => r.arrayBuffer()).then((b) => new Promise((res, rej) => ac.decodeAudioData(b, res, rej))).then((buf) => { sprite = buf; return buf; }).catch(() => { spriteJob = null; return null; });
    return spriteJob;
  },
  ready() { return !!sprite; },
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
    if (sfxBus) sfxBus.gain.setTargetAtTime(this.sfxOn ? 1 : 0, ac.currentTime, 0.05);
  },
  setMusic(on) {
    this.musicOn = !!on; setPref('zchat-game-music', this.musicOn);
    if (musBus) musBus.gain.setTargetAtTime(this.musicOn ? 0.55 : 0, ac.currentTime, 0.1);
  },
  pause(hidden) {
    if (!ac) return;
    try { if (hidden) ac.suspend(); else ac.resume(); } catch {}
  },
  bus() { return ac && sfxBus ? { ac, out: sfxBus } : null; },
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (ac) Sfx.pause(document.visibilityState === 'hidden'); });
}
