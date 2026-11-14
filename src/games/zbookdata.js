import { ZT } from './zsim.js';

const BOSS_HP = ZT.brute.hp * 3;

export const ZBOOK = [
  { k: 'walker', n: 'Walker', tag: 'Common', mk: 'zgirl', clip: 'idle', h: 1.75, camH: 1.85, text: 'The most common zombie in town. Slow on its own, but walkers come in big groups and close in from every side.', ability: '', tip: 'Aim for the head. A short burst drops it before it gets close.' },
  { k: 'worker', n: 'Worker', tag: 'Common', mk: 'zwar', clip: 'idle', h: 1.8, camH: 1.9, text: 'A heavy walker that was out working when the town fell. It takes a lot more hits before it goes down.', ability: '', tip: 'Headshots save ammo. Keep moving so it never reaches you.' },
  { k: 'runner', n: 'Runner', tag: 'Fast', mk: 'zskel', clip: 'idle', h: 1.72, camH: 1.82, text: 'Thin and quick. It sprints straight at you the moment it sees you and hits fast.', ability: 'Runs more than twice as fast as a walker.', tip: 'Shotguns and SMGs stop it fast. Never turn your back on one.' },
  { k: 'crawler', n: 'Crawler', tag: 'Low', mk: 'zpris', clip: 'crawl', h: 1.75, camH: 1.0, text: 'It crawls on its belly and drags itself along the ground. Easy to miss in tall grass.', ability: 'Stays low, so shots aimed at chest height fly over it.', tip: 'Look down when you hear it and aim low.' },
  { k: 'bloater', n: 'Bloater', tag: 'Special', mk: 'zpump', clip: 'idle', h: 1.8, camH: 1.95, text: 'Swollen and slow, full of gas. It bursts the moment it dies.', ability: 'Explodes when it dies and hurts anyone standing close.', tip: 'Shoot it from far away and never finish it next to a friend.' },
  { k: 'screamer', n: 'Screamer', tag: 'Special', mk: 'zclown', clip: 'idle', h: 1.72, camH: 1.82, text: 'Its scream carries across the street and drives every zombie nearby into a rage.', ability: 'Screams to make zombies around it run much faster for a few seconds.', tip: 'Kill it first. Go for the head before it gets a scream out.' },
  { k: 'spitter', n: 'Spitter', tag: 'Special', mk: 'zpara', clip: 'idle', h: 1.75, camH: 1.85, text: 'It spits acid from far away and backs off when you get close.', ability: 'Leaves green acid puddles that burn while you stand in them.', tip: 'Step out of the green puddles and rush it from behind cover.' },
  { k: 'riot', n: 'Riot', tag: 'Armored', mk: 'zcop', clip: 'idle', h: 1.85, camH: 1.95, text: 'A police officer still wearing full body armor. Body shots barely slow it down.', ability: 'Armor blocks most of the damage to its body.', tip: 'Only headshots do full damage. Take your time and aim high.' },
  { k: 'brute', n: 'Brute', tag: 'Giant', mk: 'zmutant', clip: 'm_idle', h: 2.7, camH: 2.8, text: 'A huge mutant that throws heavy punches. It soaks up whole magazines.', ability: 'Huge health and the hardest hits of any zombie.', tip: 'Use grenades and C4, then keep your distance while you shoot.' },
  { k: 'boss', zk: 'brute', n: 'Boss', tag: 'Boss', mk: 'zwarrok', clip: 'm_idle', h: 4.4, camH: 4.5, text: 'It shows up every fifth wave. The camera turns to it while it roars and every zombie freezes.', ability: 'Far more health than a brute, and it gets tougher with more players. Killing it pays five times the points and drops a big pile of cash.', tip: 'Stay together, aim for the head and keep moving.' },
].map((p) => {
  const T = ZT[p.zk || p.k] || ZT.walker;
  return { ...p, hp: p.k === 'boss' ? BOSS_HP : T.hp, spd: p.k === 'boss' ? T.spd * 1.05 : T.spd, dmg: T.dmg, pts: p.k === 'boss' ? T.pts * 5 : T.pts };
});

export const ZBOOK_MAX = ZBOOK.reduce((m, p) => ({ hp: Math.max(m.hp, p.k === 'boss' ? 0 : p.hp), spd: Math.max(m.spd, p.spd), dmg: Math.max(m.dmg, p.dmg) }), { hp: 0, spd: 0, dmg: 0 });
