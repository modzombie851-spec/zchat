import { sampleClip, blendInto, poseSkin } from './zmodel.js';

export const RDOG_COL = new Float32Array([1, 1, 1, 0]);

export function realDogState(RD) {
  const nb = RD.M.nb;
  return {
    cur: 'idle', prev: null, t: Math.random() * 3, pt: 0, fade: 1, playT: 6 + Math.random() * 6,
    q: new Float32Array(nb * 4), hp: new Float32Array(3), q2: new Float32Array(nb * 4), hp2: new Float32Array(3),
    W: new Float32Array(nb * 12), skin: new Float32Array(nb * 12), lunge: { f: 0, y: 0 },
  };
}

export function poseRealDog(RD, S, mv, dt, bite, leap, rest) {
  const C = RD.clips, nb = RD.M.nb;
  const act = bite > 0 || leap > 0;
  let want = act ? 'run' : mv > 3.2 ? 'run' : mv > 0.35 ? 'walk' : 'idle';
  if (want === 'idle' && rest && C.play) {
    S.playT -= dt;
    if (S.playT < -4) S.playT = 8 + Math.random() * 8;
    if (S.playT < 0) want = 'play';
  }
  if (!C[want]) want = 'idle';
  if (S.cur !== want) { S.prev = S.cur; S.pt = S.t; S.cur = want; S.t = 0; S.fade = 0; }
  const rate = want === 'run' ? (act ? 1.4 : Math.min(1.5, Math.max(0.75, mv / 7))) : want === 'walk' ? Math.min(1.7, Math.max(0.6, mv / 1.5)) : 1;
  S.t += dt * rate;
  S.pt += dt;
  S.fade = Math.min(1, S.fade + dt / 0.22);
  sampleClip(C[S.cur], nb, S.t, S.q, S.hp);
  let Q = S.q, HP = S.hp;
  if (S.prev && C[S.prev] && S.fade < 1) {
    sampleClip(C[S.prev], nb, S.pt, S.q2, S.hp2);
    blendInto(S.q2, S.hp2, S.q, S.hp, nb, S.fade);
    Q = S.q2; HP = S.hp2;
  }
  poseSkin(RD.M, Q, HP, 1, S.W, S.skin);
  const b = bite > 0 ? Math.sin(Math.min(1, 1 - bite) * Math.PI) : 0;
  const l = leap > 0 ? Math.sin(Math.min(1, leap) * Math.PI) : 0;
  S.lunge.f = b * 0.35 + l * 0.5;
  S.lunge.y = l * 0.45;
  return S.lunge;
}
