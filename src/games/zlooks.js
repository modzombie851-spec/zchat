export const SURV_LOOK = {
  jay: { name: 'Jay', skin: '#D8A684', hair: '#3A2618', hairStyle: 'short', hat: 'capb', hatCol: '#26282A', shirt: '#4E5A3C', sleeve: 0.96, zip: '#2A3020', pants: '#34445C', shoe: '#3A2E22', boots: true, pack: '#3A4430', straps: '#2A3020', beard: 'stubble', glove: '#2A2A26', seed: 11, outfits: ['#4E5A3C', '#3E6086', '#5E6E3A', '#7A7870'] },
  maya: { name: 'Maya', female: true, sw: 0.92, hw: 1.04, h: 0.97, skin: '#A06A48', hair: '#1E1612', hairStyle: 'pony', shirt: '#A8402E', sleeve: 0.96, hoodBack: true, pants: '#26262C', shoe: '#E2E0DA', irisC: '#3A2418', lip: '#7A4234', seed: 12, outfits: ['#A8402E', '#2E5E9A', '#3E7A4A', '#6A3A88'] },
  tom: { name: 'Tom', fat: 0.45, h: 1.03, wx: 1.08, sw: 1.06, skin: '#E2B898', hair: '#6A4A2E', hairStyle: 'short', beard: 'full', hat: 'beanie', hatCol: '#3A3A3E', shirt: '#8A3A2E', pattern: 'plaid', plaid: '#2A1E1A', sleeve: 0.72, pants: '#3A4A66', shoe: '#4A3626', boots: true, seed: 13, outfits: ['#8A3A2E', '#2E4A7A', '#3E5E34', '#5A5A5E'] },
  rin: { name: 'Rin', female: true, sw: 0.9, hw: 1.02, h: 0.96, skin: '#E6C2A0', hair: '#121014', hairStyle: 'short', shirt: '#2E3440', zip: '#B8B8B8', sleeve: 0.96, pants: '#4A4A3A', shoe: '#2A2A28', boots: true, glove: '#1E1E1E', irisC: '#2A1A12', seed: 14, outfits: ['#2E3440', '#6A4630', '#4A4E58', '#3A4A3A'] },
  doc: { name: 'Doc', skin: '#6A4632', hair: '#9A948C', hairStyle: 'buzz', beard: 'stubble', glasses: true, shirt: '#B8402E', cross: '#ECE8DE', sleeve: 0.96, pants: '#2A2C34', shoe: '#1E1C1A', pouch: '#6A2A22', holster: true, seed: 15, outfits: ['#B8402E', '#3E8A5A', '#C89A2A', '#3A6EA8'] },
};
export const SURV_KEYS = ['jay', 'maya', 'tom', 'rin', 'doc'];
export function survLook(sv, col) {
  const b = SURV_LOOK[sv] || SURV_LOOK.jay;
  const L = { ...b, dirt: 0.22, blood: 0.05 };
  if (col > 0 && b.outfits[col]) L.shirt = b.outfits[col];
  if (sv === 'jay' && col > 0) L.zip = '#1E2228';
  return L;
}

const Z = (o) => ({ zombie: true, dirt: 0.6, ...o });
export const ZLOOKS = {
  walker: [
    Z({ skin: '#9AA092', rot: '#5E6A4C', hair: '#2A2018', hairStyle: 'short', shirt: '#C8C2B4', sleeve: 0.3, pants: '#36465E', shoe: '#3A332C', blood: 0.85, torn: 0.35, gore: { ribs: -1 }, seed: 21, wounds: [[[0.05, 1.3, 0.11], 0.05]] }),
    Z({ female: true, sw: 0.92, hw: 1.04, h: 0.96, skin: '#A9AEB0', rot: '#6A7464', hair: '#5A3A22', hairStyle: 'long', shirt: '#4A6A9A', sleeve: 0.5, pants: '#2A2A34', shorts: true, skirt: '#2A2A34', shoe: '#5A2A2A', blood: 0.75, torn: 0.25, gore: { bite: 1 }, seed: 22 }),
    Z({ skin: '#8E9488', rot: '#56604A', hair: '#3A322A', hairStyle: 'buzz', shirt: '#D6D2C6', sleeve: 0.96, tie: '#6A1A1E', pants: '#262830', shoe: '#141414', blood: 0.95, torn: 0.2, gore: { jaw: 1 }, collar: true, seed: 23 }),
    Z({ skin: '#A39C92', rot: '#6A6450', hair: '#8E8A84', hairStyle: 'buzz', shirt: '#56664A', pattern: 'plaid', plaid: '#252C1E', sleeve: 0.96, pants: '#5A5046', shoe: '#2E2620', blood: 0.7, torn: 0.3, gore: { guts: 1 }, fat: 0.2, seed: 24 }),
    Z({ skin: '#8C8E86', rot: '#545E46', hair: '#18120E', hairStyle: 'spiky', shirt: '#86302A', sleeve: 0.96, hoodBack: true, pants: '#2A364E', shoe: '#C8C8C4', blood: 0.85, torn: 0.25, gore: { arm: 'L' }, seed: 25 }),
    Z({ female: true, sw: 0.92, hw: 1.04, h: 0.97, skin: '#B2B4B0', rot: '#6E786A', hair: '#2A1C14', hairStyle: 'bun', shirt: '#4A8A88', vneck: true, sleeve: 0.3, pants: '#4A8A88', shoe: '#D8D8D4', mask: '#9AB8C8', blood: 1.0, torn: 0.2, seed: 26 }),
    Z({ skin: '#7A6656', rot: '#4E4A36', bruise: '#4A3440', hair: '#100C0A', hairStyle: 'buzz', shirt: '#E2DED2', sleeve: 0.3, pants: '#4A4236', shoe: '#2A2420', blood: 0.9, torn: 0.4, gore: { eye: 1 }, seed: 27 }),
  ],
  worker: [
    Z({ skin: '#9C9A8E', rot: '#5E6448', hair: '#2E241A', hat: 'hard', hatCol: '#D89A1E', shirt: '#4E5E6E', pattern: 'vest', vest: '#C2CE28', sleeve: 0.96, pants: '#3A4A62', shoe: '#4A3A28', boots: true, glove: '#6A5A3A', muscle: 0.4, blood: 0.6, seed: 31 }),
    Z({ skin: '#8E968A', rot: '#56604A', hair: '#2A2018', hat: 'cap', hatCol: '#2E2E30', shirt: '#2C3856', sleeve: 0.96, pants: '#2C3856', belt: false, shoe: '#1E1C1A', boots: true, blood: 0.75, gore: { eye: 1 }, muscle: 0.3, seed: 32 }),
    Z({ skin: '#A09682', rot: '#626446', hair: '#5A4A38', beard: 'full', hat: 'cap', hatCol: '#6A5A3A', shirt: '#8A2E2A', pattern: 'plaid', plaid: '#2A1A16', straps: '#46587A', sleeve: 0.55, pants: '#46587A', shoe: '#3A2E22', boots: true, fat: 0.3, blood: 0.6, seed: 33 }),
  ],
  runner: [
    Z({ skin: '#B0A49A', rot: '#7A7060', hair: '#2A2018', hairStyle: 'buzz', shirt: '#3A64A8', sleeve: 0, pants: '#1E1E22', shorts: true, shoe: '#D8D4CC', blood: 0.9, torn: 0.25, h: 0.98, seed: 41 }),
    Z({ female: true, sw: 0.92, hw: 1.04, h: 0.96, skin: '#B6AEA6', rot: '#7A7A66', hair: '#8A6A3A', hairStyle: 'pony', shirt: '#5A2A6A', zip: '#E2E2E2', sleeve: 0.96, pants: '#2A2A30', shoe: '#E8E4DC', blood: 0.85, seed: 42 }),
    Z({ skin: '#A69C90', rot: '#6A6A50', hair: '#1A1410', hairStyle: 'short', shirt: '#343434', sleeve: 0.3, pants: '#3A4A64', shoe: '#2A2A2A', blood: 1.0, gore: { scalp: 1 }, seed: 43 }),
  ],
  bloater: [
    Z({ fat: 1.5, h: 1.02, wx: 1.18, wz: 1.22, skin: '#9C9E6A', rot: '#6E7C3A', bruise: '#6E4A6A', hairStyle: 'bald', shirt: '#C6BEA6', crop: true, sleeve: 0.3, torn: 0.5, pants: '#4A4238', shoe: '#2E2820', boils: true, bloat: true, blood: 0.45, seed: 51 }),
    Z({ fat: 1.6, h: 1.0, wx: 1.2, wz: 1.25, skin: '#A2A070', rot: '#727E40', bruise: '#704C6C', hair: '#3A3226', hairStyle: 'buzz', shirtless: true, pants: '#3A4258', shoe: '#2E2820', boils: true, bloat: true, blood: 0.5, seed: 52 }),
  ],
  brute: [
    Z({ h: 1.4, wx: 1.42, wz: 1.3, sw: 1.12, muscle: 1.3, fat: 0.25, skin: '#8C867A', rot: '#5A5A46', bruise: '#5A3E44', hairStyle: 'bald', shirtless: true, pants: '#3A382E', shoe: '#2A2420', boots: true, spikes: true, blood: 0.75, torn: 0.4, gore: { ribs: 1 }, headW: 1.05, seed: 61 }),
  ],
  crawler: [
    Z({ skin: '#A09E92', rot: '#646C50', hair: '#3A2A1E', hairStyle: 'short', shirt: '#6A5A4A', sleeve: 0.96, pants: '#3A3A3A', blood: 1.0, torn: 0.35, gore: { legless: 1, guts: 0.8 }, seed: 71 }),
    Z({ female: true, sw: 0.92, skin: '#AEB2B0', rot: '#6E786A', hair: '#2A1A12', hairStyle: 'long', shirt: '#7A6A8A', sleeve: 0.5, pants: '#2A2A2A', blood: 1.0, torn: 0.3, gore: { legless: 1 }, seed: 72 }),
  ],
  screamer: [
    Z({ female: true, sw: 0.9, hw: 1.0, h: 0.98, arm: 1.05, skin: '#BEC0BC', rot: '#7A8076', bruise: '#5E4A5E', hair: '#0E0A08', hairStyle: 'long', shirt: '#A6B6AE', sleeve: 0.25, vneck: true, pants: '#A6B6AE', skirt: '#A6B6AE', shorts: true, shoe: '#C8C8C4', blood: 0.65, torn: 0.3, eyes: '#E8E2B0', seed: 81 }),
  ],
  riot: [
    Z({ skin: '#8E968C', rot: '#56604A', hair: '#1A1410', hat: 'riot', hatCol: '#161A20', shirt: '#1E242E', sleeve: 0.96, pants: '#1E242E', vestArmor: '#12161C', pads: '#1C2028', glove: '#121212', shoe: '#101010', boots: true, blood: 0.5, muscle: 0.4, seed: 91 }),
    Z({ skin: '#8A8A7C', rot: '#56604A', hair: '#2A2018', hat: 'helmet', hatCol: '#3E4632', shirt: '#4E5A3A', pattern: 'camo', sleeve: 0.96, pants: '#4E5A3A', vestArmor: '#3A4430', glove: '#2A2A22', shoe: '#2A241C', boots: true, blood: 0.6, muscle: 0.3, seed: 92 }),
  ],
  spitter: [
    Z({ skin: '#8A9A6E', rot: '#5A6E36', bruise: '#4A5A2A', hair: '#2A2A1A', hairStyle: 'buzz', shirt: '#5A4A3A', sleeve: 0.5, torn: 0.7, pants: '#3A3A30', shoe: '#2A2620', throat: true, blood: 0.4, eyes: '#C8E070', seed: 101 }),
  ],
};

export const ZSCALE = { walker: 1, worker: 1, runner: 1, bloater: 1, brute: 1, crawler: 1, screamer: 1, riot: 1, spitter: 1 };
export function zLookIndex(k, id) { const n = (ZLOOKS[k] || ZLOOKS.walker).length; return ((id * 2654435761) >>> 0) % n; }

export const DOGS = [
  { key: 'rex', name: 'Rex', coat: '#8A6234', dark: '#241A12', belly: '#C8A070', saddle: true, mask: true, collar: '#B8302A', seed: 5 },
  { key: 'luna', name: 'Luna', coat: '#8C9096', dark: '#34383E', belly: '#ECEAE6', mask: true, collar: '#2E6AB0', seed: 6 },
  { key: 'bear', name: 'Bear', coat: '#2A2622', dark: '#141210', belly: '#3A342E', collar: '#D8A020', seed: 7 },
  { key: 'goldie', name: 'Goldie', coat: '#C2924E', dark: '#7A5A30', belly: '#E2C48C', collar: '#3E8A4A', seed: 8 },
];
