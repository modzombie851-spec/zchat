import { useEffect, useState } from 'react';
import { Sfx } from './sfx.js';

const taps = new Map();
let sink = null;

function ctx() {
  let ac = null;
  try { ac = Sfx.ctx(); } catch { ac = null; }
  if (!ac) return null;
  if (!sink || sink.context !== ac) {
    try { sink = ac.createGain(); sink.gain.value = 0; sink.connect(ac.destination); } catch { sink = null; return null; }
  }
  return ac;
}

export function talkTap(key, stream) {
  talkDrop(key);
  if (!key || !stream) return;
  const ac = ctx();
  if (!ac) return;
  try {
    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 512;
    an.smoothingTimeConstant = 0.2;
    src.connect(an);
    an.connect(sink);
    taps.set(key, { src, an, buf: new Uint8Array(an.fftSize), at: 0, peak: 0 });
  } catch {}
}

export function talkDrop(key) {
  const t = taps.get(key);
  if (!t) return;
  taps.delete(key);
  try { t.src.disconnect(); } catch {}
  try { t.an.disconnect(); } catch {}
}

function levelOf(t) {
  try { t.an.getByteTimeDomainData(t.buf); } catch { return 0; }
  let s = 0;
  for (let i = 0; i < t.buf.length; i++) { const d = (t.buf[i] - 128) / 128; s += d * d; }
  return Math.sqrt(s / t.buf.length);
}

export function useTalking(on = true, skip) {
  const [list, setList] = useState([]);
  const skipKey = skip ? Object.keys(skip).filter((k) => skip[k]).sort().join('|') : '';
  useEffect(() => {
    if (!on) { setList([]); return undefined; }
    const iv = setInterval(() => {
      const now = Date.now();
      const out = [];
      for (const [k, t] of taps) {
        if (skip && skip[k]) continue;
        const lv = levelOf(t);
        if (lv > 0.03) t.at = now;
        if (now - t.at < 500) out.push(k);
      }
      out.sort();
      setList((p) => (p.length === out.length && p.every((x, i) => x === out[i]) ? p : out));
    }, 110);
    return () => clearInterval(iv);
  }, [on, skipKey]);
  return list;
}

if (typeof window !== 'undefined' && window.__zfake) window.__ztalk = (key, ms) => { taps.set(key, { src: null, an: null, buf: new Uint8Array(4), at: Date.now() + (ms || 2000) }); };
