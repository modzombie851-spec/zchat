import { ZT } from './zsim.js';

const BOSS_HP = ZT.brute.hp * 3;

export const ZBOOK = [
  { k: 'walker', n: 'Walker', tag: 'Common', mk: 'zgirl', clip: 'idle', h: 1.75, camH: 1.85, armor: 'None', str: 'Low', traits: ['Swarms'] },
  { k: 'worker', n: 'Worker', tag: 'Common', mk: 'zwar', clip: 'idle', h: 1.8, camH: 1.9, armor: 'Light', str: 'Medium', traits: ['Tough'] },
  { k: 'runner', n: 'Runner', tag: 'Fast', mk: 'zskel', clip: 'idle', h: 1.72, camH: 1.82, armor: 'None', str: 'Low', traits: ['Sprinter'] },
  { k: 'crawler', n: 'Crawler', tag: 'Low', mk: 'zpris', clip: 'crawl', h: 1.75, camH: 1.0, armor: 'None', str: 'Low', traits: ['Crawls low'] },
  { k: 'bloater', n: 'Bloater', tag: 'Special', mk: 'zpump', clip: 'idle', h: 1.8, camH: 1.95, armor: 'None', str: 'Medium', traits: ['Explodes on death'] },
  { k: 'screamer', n: 'Screamer', tag: 'Special', mk: 'zclown', clip: 'idle', h: 1.72, camH: 1.82, armor: 'None', str: 'Low', traits: ['Rage scream'] },
  { k: 'spitter', n: 'Spitter', tag: 'Special', mk: 'zpara', clip: 'idle', h: 1.75, camH: 1.85, armor: 'None', str: 'Low', traits: ['Acid spit', 'Ranged'] },
  { k: 'riot', n: 'Riot', tag: 'Armored', mk: 'zcop', clip: 'idle', h: 1.85, camH: 1.95, armor: 'Heavy', str: 'Medium', traits: ['Body armor'] },
  { k: 'brute', n: 'Brute', tag: 'Giant', mk: 'zmutant', clip: 'm_idle', h: 2.7, camH: 2.8, armor: 'Light', str: 'Extreme', traits: ['Heavy hits'] },
  { k: 'boss', zk: 'brute', n: 'Boss', tag: 'Boss', mk: 'zwarrok', clip: 'm_idle', h: 4.4, camH: 4.5, armor: 'Heavy', str: 'Extreme', traits: ['Every 5th wave', 'Scales with squad'] },
].map((p) => {
  const T = ZT[p.zk || p.k] || ZT.walker;
  return { ...p, hp: p.k === 'boss' ? BOSS_HP : T.hp, spd: p.k === 'boss' ? T.spd * 1.05 : T.spd, dmg: T.dmg, pts: p.k === 'boss' ? T.pts * 5 : T.pts };
});

export const ZBOOK_MAX = ZBOOK.reduce((m, p) => ({ hp: Math.max(m.hp, p.k === 'boss' ? 0 : p.hp), spd: Math.max(m.spd, p.spd), dmg: Math.max(m.dmg, p.dmg) }), { hp: 0, spd: 0, dmg: 0 });
