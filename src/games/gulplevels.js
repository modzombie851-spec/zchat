export const GULP_LEVELS = [
  { name: 'First bites', goal: { k: 'size', v: 25 }, par: 35 },
  { name: 'Snack run', goal: { k: 'eat', v: 30 }, par: 45 },
  { name: 'School is out', goal: { k: 'size', v: 120 }, par: 75 },
  { name: 'Bubble hunt', goal: { k: 'pick', v: 3 }, cfg: { pk: 2.6 }, par: 60 },
  { name: 'Chain bites', goal: { k: 'combo', v: 8 }, par: 50 },
  { name: 'Shark alley', goal: { k: 'time', v: 60 }, cfg: { hunt: 3 }, lives: 2, n: 60 },
  { name: 'Careful now', goal: { k: 'size', v: 500 }, lives: 1, par: 150 },
  { name: 'Speed eater', goal: { k: 'eat', v: 60 }, limit: 90, par: 60 },
  { name: 'Into the blue', goal: { k: 'size', v: 1500 }, start: [205, 160], n: 150, par: 150 },
  { name: 'Feeding frenzy', goal: { k: 'eat', v: 150 }, n: 40, par: 170 },
  { name: 'Deep dark', goal: { k: 'time', v: 90 }, start: [560, 280], n: 400, cfg: { hunt: 2 }, lives: 2 },
  { name: 'Big appetite', goal: { k: 'size', v: 5000 }, n: 250, par: 260 },
  { name: 'Combo master', goal: { k: 'combo', v: 18 }, n: 80, par: 110 },
  { name: 'Hunter season', goal: { k: 'size', v: 3000 }, n: 300, cfg: { hunt: 2.6 }, par: 220 },
  { name: 'Race the tide', goal: { k: 'size', v: 2000 }, n: 120, limit: 150, par: 110 },
  { name: 'One life', goal: { k: 'size', v: 8000 }, n: 800, lives: 1, par: 240 },
  { name: 'Bubble collector', goal: { k: 'pick', v: 8 }, n: 200, cfg: { pk: 2.2 }, par: 160 },
  { name: 'Ocean feast', goal: { k: 'eat', v: 300 }, n: 500, par: 300 },
  { name: 'Become a shark', goal: { k: 'size', v: 50000 }, n: 5000, par: 420 },
  { name: 'King of the sea', goal: { k: 'size', v: 500000 }, n: 60000, par: 600 },
];

const fmtNum = (v) => (v >= 1000000 ? `${Math.round(v / 100000) / 10}M` : v >= 10000 ? `${Math.round(v / 1000)}K` : String(Math.floor(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function goalText(L) {
  const g = L.goal;
  if (g.k === 'size') return `Grow to ${fmtNum(g.v)}`;
  if (g.k === 'eat') return `Eat ${g.v} fish`;
  if (g.k === 'pick') return `Grab ${g.v} power bubbles`;
  if (g.k === 'combo') return `Make a combo of ${g.v}`;
  return `Stay alive for ${fmtTime(g.v)}`;
}

export function rulesText(L) {
  const out = [];
  if (L.lives === 1) out.push('One life only');
  else if (L.lives) out.push(`${L.lives} lives`);
  if (L.limit) out.push(`${fmtTime(L.limit)} on the clock`);
  if (L.cfg && L.cfg.hunt > 1) out.push('More hunters');
  if (L.cfg && L.cfg.pk > 1) out.push('More power bubbles');
  return out.join('. ');
}

export function goalProgress(L, st) {
  const g = L.goal;
  if (g.k === 'size') return { cur: st.n, need: g.v, label: `${fmtNum(Math.min(st.n, g.v))} of ${fmtNum(g.v)}` };
  if (g.k === 'eat') return { cur: st.eaten, need: g.v, label: `${Math.min(st.eaten, g.v)} of ${g.v} fish` };
  if (g.k === 'pick') return { cur: st.picks, need: g.v, label: `${Math.min(st.picks, g.v)} of ${g.v} bubbles` };
  if (g.k === 'combo') return { cur: st.combo, need: g.v, label: `Best combo ${Math.min(st.combo, g.v)} of ${g.v}` };
  return { cur: st.time, need: g.v, label: `${fmtTime(Math.min(st.time, g.v))} of ${fmtTime(g.v)}` };
}

export function starsFor(L, r) {
  if (L.goal.k === 'time') return r.deaths <= 0 ? 3 : r.deaths === 1 ? 2 : 1;
  const par = L.par || 120;
  return r.time <= par ? 3 : r.time <= par * 1.5 ? 2 : 1;
}

const LV_KEY = (uid) => `zchat-gulp-levels-${uid || 'me'}`;
export function readLevels(uid) { try { return JSON.parse(localStorage.getItem(LV_KEY(uid)) || '{}') || {}; } catch { return {}; } }
export function saveLevel(uid, i, r) {
  try {
    const all = readLevels(uid);
    const o = all[i] || {};
    all[i] = { stars: Math.max(o.stars || 0, r.stars || 0), time: o.time ? Math.min(o.time, r.time) : r.time };
    localStorage.setItem(LV_KEY(uid), JSON.stringify(all));
    return all;
  } catch { return readLevels(uid); }
}
