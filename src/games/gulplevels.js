export const GULP_LEVELS = [
  { name: 'First bites', goal: { k: 'size', v: 25 }, par: 35 },
  { name: 'Snack run', goal: { k: 'eat', v: 30 }, par: 45 },
  { name: 'School is out', goal: { k: 'size', v: 120 }, par: 75 },
  { name: 'Bubble hunt', goal: { k: 'pick', v: 3 }, cfg: { pk: 2.6 }, par: 60 },
  { name: 'Chain bites', goal: { k: 'combo', v: 8 }, par: 50 },
  { name: 'Shark alley', goal: { k: 'time', v: 60 }, cfg: { hunt: 3 }, lives: 2, n: 60 },
  { name: 'Careful now', goal: { k: 'size', v: 500 }, lives: 1, par: 150 },
  { name: 'Speed eater', goal: { k: 'eat', v: 60 }, limit: 90, par: 60 },
  { name: 'Into the blue', goal: { k: 'size', v: 1500 }, start: [400, 150], n: 150, par: 150 },
  { name: 'Feeding frenzy', goal: { k: 'eat', v: 150 }, n: 40, par: 170 },
  { name: 'Deep dark', goal: { k: 'time', v: 90 }, start: [1220, 360], n: 400, cfg: { hunt: 2 }, lives: 2 },
  { name: 'Big appetite', goal: { k: 'size', v: 5000 }, n: 250, par: 260 },
  { name: 'Combo master', goal: { k: 'combo', v: 18 }, n: 80, par: 110 },
  { name: 'Hunter season', goal: { k: 'size', v: 3000 }, n: 300, cfg: { hunt: 2.6 }, par: 220 },
  { name: 'Race the tide', goal: { k: 'size', v: 2000 }, n: 120, limit: 150, par: 110 },
  { name: 'One life', goal: { k: 'size', v: 8000 }, n: 800, lives: 1, par: 240 },
  { name: 'Bubble collector', goal: { k: 'pick', v: 8 }, n: 200, cfg: { pk: 2.2 }, par: 160 },
  { name: 'Ocean feast', goal: { k: 'eat', v: 300 }, n: 500, par: 300 },
  { name: 'Become a shark', goal: { k: 'size', v: 12000 }, n: 1500, par: 300 },
  { name: 'King of the sea', goal: { k: 'size', v: 100000 }, n: 12000, par: 420 },
  { name: 'Treasure hunter', goal: { k: 'chest', v: 2 }, start: [760, 250], n: 300, par: 120 },
  { name: 'Golden catch', goal: { k: 'gold', v: 1 }, start: [700, 120], n: 600, par: 120 },
];

const fmtNum = (v) => (v >= 1e9 ? `${Math.round(v / 1e8) / 10}b`.replace('.0b', 'b') : v >= 1e6 ? `${Math.round(v / 1e5) / 10}m`.replace('.0m', 'm') : v >= 10000 ? `${Math.round(v / 100) / 10}k`.replace('.0k', 'k') : String(Math.floor(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function goalText(L) {
  const g = L.goal;
  if (g.k === 'size') return `Grow to ${fmtNum(g.v)}`;
  if (g.k === 'eat') return `Eat ${g.v} fish`;
  if (g.k === 'pick') return `Grab ${g.v} power bubbles`;
  if (g.k === 'combo') return `Make a combo of ${g.v}`;
  if (g.k === 'chest') return g.v === 1 ? 'Open a treasure chest' : `Open ${g.v} treasure chests`;
  if (g.k === 'gold') return g.v === 1 ? 'Catch a golden fish' : `Catch ${g.v} golden fish`;
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
  if (g.k === 'chest') return { cur: st.chests || 0, need: g.v, label: `${Math.min(st.chests || 0, g.v)} of ${g.v} chests` };
  if (g.k === 'gold') return { cur: st.golds || 0, need: g.v, label: `${Math.min(st.golds || 0, g.v)} of ${g.v} golden fish` };
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

const NICE = [10, 15, 20, 25, 30, 40, 50, 60, 75, 100];
function niceAbove(v) {
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, v))) - 1));
  for (const n of NICE) if (n * mag >= v) return n * mag;
  return 100 * mag;
}
const MISSION_KINDS = ['eat', 'size', 'combo', 'pick', 'gold', 'chest', 'calm'];
export function newMission(kind, p, st, rnd) {
  const r = rnd || Math.random;
  if (kind === 'eat') { const v = [20, 30, 40, 60][Math.floor(r() * 4)]; return { k: kind, v, base: p.eaten || 0, text: `Eat ${v} fish` }; }
  if (kind === 'size') { const v = niceAbove(p.n * (p.n < 5000 ? 2.2 : 1.6) + 20); return { k: kind, v, base: 0, text: `Grow to ${fmtNum(v)}` }; }
  if (kind === 'combo') { const v = 6 + Math.floor(r() * 7); return { k: kind, v, base: 0, best: 0, text: `Make a combo of ${v}` }; }
  if (kind === 'pick') return { k: kind, v: 2, base: st.picks || 0, text: 'Grab 2 power bubbles' };
  if (kind === 'gold') return { k: kind, v: 1, base: p.golds || 0, text: 'Catch a golden fish' };
  if (kind === 'chest') return { k: kind, v: 1, base: p.chests || 0, text: 'Open a treasure chest' };
  return { k: 'calm', v: 75, base: st.t || 0, d0: p.deaths || 0, text: 'Stay alive for 1:15' };
}
export function pickMission(list, p, st, rnd) {
  const r = rnd || Math.random;
  const used = new Set(list.map((m) => m.k));
  const pool = MISSION_KINDS.filter((k) => !used.has(k));
  return newMission(pool[Math.floor(r() * pool.length)] || 'eat', p, st, r);
}
export function missionProgress(m, p, st) {
  if (m.k === 'eat') return (p.eaten || 0) - m.base;
  if (m.k === 'size') return p.n;
  if (m.k === 'combo') { m.best = Math.max(m.best || 0, p.combo || 0); return m.best; }
  if (m.k === 'pick') return (st.picks || 0) - m.base;
  if (m.k === 'gold') return (p.golds || 0) - m.base;
  if (m.k === 'chest') return (p.chests || 0) - m.base;
  if ((p.deaths || 0) !== m.d0) { m.d0 = p.deaths || 0; m.base = st.t || 0; }
  return (st.t || 0) - m.base;
}
export function missionShort(m, cur) {
  const c = Math.max(0, Math.min(cur, m.v));
  if (m.k === 'size') return `${fmtNum(c)}/${fmtNum(m.v)}`;
  if (m.k === 'calm') return `${fmtTime(c)}/${fmtTime(m.v)}`;
  return `${Math.floor(c)}/${m.v}`;
}
export function missionLabel(m, cur) {
  if (m.k === 'size') return `${fmtNum(Math.min(cur, m.v))} of ${fmtNum(m.v)}`;
  if (m.k === 'calm') return `${fmtTime(Math.min(cur, m.v))} of ${fmtTime(m.v)}`;
  return `${Math.max(0, Math.min(cur, m.v))} of ${m.v}`;
}
export const REWARDS = [
  { k: 'life', text: 'Extra life' },
  { k: 'double', text: 'Double food for 10 seconds' },
  { k: 'shield', text: 'Shield for 8 seconds' },
  { k: 'magnet', text: 'Magnet for 10 seconds' },
];
