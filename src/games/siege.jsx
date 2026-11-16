import { backdropProps } from './tap.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GGlyph } from './gskill.jsx';
import { Avatar, Portal, useBackClose, FONT, Spinner } from '../App.jsx';
import { useRoomLink } from './relay.jsx';
import { cloudOn } from './zcloud.js';
import { EMOTES, Sheet, injectCss, useGameChat, ChatSheet, CHAT_PHRASES } from './livekit.jsx';
import { GBtn, GPill, GPanel, GChip, GTitle, GIcon, GHudBtn, GHudPanel, GNotices, useNotices, useWatchNotices, injectKitCss, kitTap, pressProps, maxDpr, weakPhone, INK, useCtlLook, useGameStage, GControlsPanel, GVolBars, GLobby, GSlot, GLobbySheet, GSeg, GTalkers, GJoy, useJoystick, stagePoint, TOUCHY, GWatchBar, GSkin, GChatFeed, useChatFeed, GJoinAsks, GHudSkill, GSetRow, GSetToggle , GSetHead, useHudLay, hudT, layOpen, layEnd, GLayoutRow, GHudEditor, GQuickPanel } from './gamekit.jsx';
import { mkNet, netPush, netRead } from './netlerp.js';
import { Sfx } from './sfx.js';
import { setWatchAllowed, useLiveBeacon, useGamePrivacy, useJoinAsks } from './live.js';
import { createRenderer, m4 } from './race3d.js';
import * as E from './siegeengine.js';
import { heroMeshes, robotMeshes, heroThumbEnv, fxSiege } from './siegemesh.js';
import { arenaMeshes, arenaEnv } from './siegearena.js';
import { useTalking } from './talk.js';
import { supabase } from '../supabaseClient.js';
import { parseSBM, boneMap, newPose, sampleInto, skinPose, upperMask, recolor } from './siegechar.js';
import * as T from './siegeteam.js';
import { TCOL, TNAME, TXT_COL, MODE_ITEMS, TLOOK, unitCol, riftUnpack, TeamScore, TeamShip, TeamMe, KillFeed, SkillPick, TeamSlots, TeamBoard, TeamSettings, TeamMapCard, TeamHowTo, RespawnBox, drawTeamMini, teamMiniBase, teamHudOf, teamRows } from './siegeteamui.jsx';

const SIEGE_KEYS = [['W A S D or Arrows', 'Move'], ['Mouse', 'Aim'], ['Left click or F', 'Attack'], ['Right click or Space or E', 'Super'], ['Q', 'Gadget'], ['Shift', 'Dash'], ['R', 'Battle skill in team battle'], ['B', 'Go home in team battle'], ['Tab', 'Scoreboard in team battle'], ['Esc', 'Pause or leave']];
const SKF = ['ua_anim', 'ua_flamingo', 'ua_frog', 'ua_bee', 'um_flamingo', 'um_bee', 'um_panda', 'um_frog', 'ue_small', 'ue_fly', 'ue_large', 'up_health', 'up_thunder', 'up_bullets', 'up_sphere', 'up_jar'];
const SKT = ['t_usk', 't_umech', 't_umechf', 't_uen'];
const SKL = { job: null, d: null };
const skImg = (u) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
function loadSk() {
  if (SKL.d) return Promise.resolve(SKL.d);
  if (SKL.job) return SKL.job;
  SKL.job = Promise.all([...SKF.map((f) => fetch(`/bolt/${f}.sbz`).then((r) => { if (!r.ok) throw new Error(f); return r.arrayBuffer(); }).then((b) => [f, parseSBM(b)])), ...SKT.map((t) => skImg(`/bolt/${t}.webp`).then((im) => [t, im]))])
    .then((list) => { const d = { m: {}, t: {} }; for (const [k, v] of list) (k.startsWith('t_') ? d.t : d.m)[k] = v; SKL.d = d; return d; })
    .catch(() => { SKL.job = null; return null; });
  return SKL.job;
}
const HERO_H = 1.72, MECH_H = 1.38;
const HLOOK = {
  blaze: { kind: 'm', body: 'um_panda', tex: 't_umech', band: [10, 34, 22, 0.45], keep: 1, atk: 'shoot', sup: 'big', gad: 'shoot' },
  pip: { kind: 'a', body: 'ua_frog', tex: 't_usk', band: [72, 118, 93, 0.35], keep: 1, suit: 0.36, atk: 'weapon', sup: 'weapon', gad: 'punch' },
  boom: { kind: 'm', body: 'um_frog', tex: 't_umechf', band: [84, 116, 100, 0.3], atk: 'shoot', sup: 'big', gad: 'kick' },
  mira: { kind: 'a', body: 'ua_flamingo', tex: 't_usk', band: [300, 352, 325, 0.25], suit: 0.34, atk: 'weapon', sup: 'wave', gad: 'yes' },
  rex: { kind: 'm', body: 'um_flamingo', tex: 't_umech', band: [296, 352, 318, 0.25], sat: 1.7, sc: 1.2, atk: 'kick', sup: 'jump', gad: 'run' },
  volt: { kind: 'a', body: 'ua_bee', tex: 't_usk', band: [34, 60, 46, 0.4], suit: 0.4, atk: 'weapon', sup: 'punch', gad: 'yes' },
  kai: { kind: 'm', body: 'um_bee', tex: 't_umech', band: [32, 56, 42, 0.45], sc: 0.95, atk: 'shoot', sup: 'big', gad: 'jump' },
  ivy: { kind: 'a', body: 'ua_flamingo', tex: 't_usk', band: [300, 352, 325, 0.25], suit: 0.3, atk: 'weapon', sup: 'punch', gad: 'yes', lift: 1.08 },
  nyx: { kind: 'a', body: 'ua_bee', tex: 't_usk', band: [34, 60, 46, 0.4], suit: 0.5, dark: 0.55, atk: 'punch', sup: 'punch', gad: 'yes', lift: 0.92 },
};
const ALIEN_BAND = [78, 112, 94, 0.4];
const RLOOK = {
  grunt: { m: 'ue_small', t: 't_uen', h: 1.3, idle: 'idle', move: 'move', atk: 'atk', fly: 0.5 },
  shooter: { m: 'ue_fly', t: 't_uen', h: 1.7, idle: 'idle', move: 'move', atk: 'punch', fly: 0.3, hue: 172 },
  bomber: { m: 'ue_small', t: 't_uen', h: 1.1, idle: 'idle', move: 'move', atk: 'atk', fly: 0.35, hue: 20 },
  tank: { m: 'ue_large', t: 't_usk', h: 2.4, idle: 'idle', move: 'walk', atk: 'punch', shoot: 'weapon', hue: 128 },
  boss: { m: 'ue_large', t: 't_usk', h: 4.5, idle: 'idle', move: 'walk', atk: 'punch', shoot: 'weapon', hue: 284 },
};
const PLOOK = { hp: { m: 'up_health', s: 0.62 }, pw: { m: 'up_sphere', s: 0.62 }, su: { m: 'up_thunder', s: 0.66 }, sh: { m: 'up_jar', s: 0.6, hue: 190 }, rf: { m: 'up_bullets', s: 0.58 }, sp: { m: 'up_jar', s: 0.6, hue: 105 } };
const COLD = new Float32Array([1.15, 0.92, 0.7, 0]), COLN = new Float32Array([1, 1, 1, 0.14]), COLF = new Float32Array([1.9, 1.9, 1.9, 0.14]), COLG = new Float32Array([1, 1, 1, 0.22]);
const COLR = new Float32Array([1, 1, 1, 0.553]), COLRF = new Float32Array([1.9, 1.9, 1.9, 0.553]), COLRI = new Float32Array([0.75, 0.95, 1.4, 0.553]);
const COLK = new Float32Array([0.42, 0.34, 0.78, 0.14]), COLP = new Float32Array([1.05, 0.85, 1.5, 0.553]);
const hueOfHex = (hex) => { const n = parseInt(hex.slice(1), 16); const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d < 1e-6) return 0; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; return h < 0 ? h + 360 : h; };
function stillSkin(M) { const P = newPose(M.nb); P.q.set(M.restQ); P.t.set(M.restT); skinPose(M, P); return P.S; }
function skUpload(R, d, heroesOnly) {
  const S = { R, d, mesh: {}, tex: {}, htex: {}, grp: {}, still: {}, amap: {} };
  for (const k of SKF) {
    const M = d.m[k];
    if (!M || !M.verts) continue;
    if (heroesOnly && !(k.startsWith('ua_') || k.startsWith('um_'))) continue;
    S.mesh[k] = R.tskin(M);
    S.grp[k] = Object.fromEntries(M.groups.map((g) => [g.name, g]));
  }
  for (const k of ['ua_flamingo', 'ua_frog', 'ua_bee']) S.amap[k] = boneMap(d.m[k], d.m.ua_anim);
  S.up = upperMask(d.m.ua_flamingo, 'Abdomen');
  S.mup = upperMask(d.m.um_flamingo, 'Torso');
  if (!heroesOnly) {
    for (const [k, L] of Object.entries(RLOOK)) S.tex['r_' + k] = R.texture(L.hue != null ? recolor(d.t[L.t], d.t[L.t].width >= 512 ? 512 : 256, ALIEN_BAND, L.hue, 0) : d.t[L.t]);
    S.tex.p_base = R.texture(d.t.t_usk);
    for (const [k, L] of Object.entries(PLOOK)) { if (L.hue != null) S.tex['p_' + k] = R.texture(recolor(d.t.t_usk, 512, [18, 42, 30, 0.45], L.hue, 0)); if (!S.still[L.m]) S.still[L.m] = stillSkin(d.m[L.m]); }
  }
  return S;
}
function skHeroTex(S, key, c) {
  const k = `${key}:${c | 0}`;
  if (S.htex[k]) return S.htex[k];
  const L = HLOOK[key];
  const sh = HUE[c | 0] || 0;
  S.htex[k] = S.R.texture(recolor(S.d.t[L.tex], 512, L.band, L.keep ? null : hueOfHex(E.HEROES[key].col), sh, L.lift || 1, { sat: L.sat, suit: L.suit, dark: L.dark }));
  return S.htex[k];
}
function skPoseHero(S, h, key, o, dt) {
  const L = HLOOK[key], M = S.d.m[L.body], mech = L.kind === 'm';
  const A = mech ? M : S.d.m.ua_anim, map = mech ? null : S.amap[L.body], C = A.clips, up = mech ? S.mup : S.up;
  const P = h.pose && h.pose.q.length === M.nb * 4 ? h.pose : (h.pose = newPose(M.nb));
  const an = h.an || (h.an = { t: Math.random() * 3, run: 0, act: null, dt: 0, dash: 0 });
  an.t += dt;
  P.q.set(M.restQ); P.t.set(M.restT);
  const spd = Math.hypot(h.vx || 0, h.vz || 0);
  if (o.down) { an.dt = Math.min(an.dt + dt, C.death.dur); sampleInto(M, A, map, C.death, an.dt, P, 1); }
  else {
    an.dt = 0;
    const J = h.jump;
    if (J) { const u = clamp(J.t / J.T, 0, 1); if (mech) sampleInto(M, A, map, C.jump, u * C.jump.dur, P, 1); else sampleInto(M, A, map, u < 0.18 ? C.jump : C.jumpi, u < 0.18 ? u / 0.18 * C.jump.dur : an.t, P, 1); }
    else {
      sampleInto(M, A, map, C[o.idle && C.hello && o.lobby ? 'hello' : 'idle'], an.t, P, 1);
      const mv = clamp(spd / 2.2, 0, 1);
      const dash = (h.dashT || 0) > 0 || h.dashNet;
      if (mv > 0.02 || dash) {
        an.run += dt * (dash ? 2.2 : clamp(spd / (mech ? 4.2 : 4.6), 0.55, 1.6));
        sampleInto(M, A, map, C.run, an.run, P, dash ? 1 : mv);
      }
    }
    if (an.act) {
      const c = C[an.act.c];
      an.act.t += dt * (an.act.r || 1);
      if (!c || an.act.t >= c.dur) an.act = null;
      else { const w = Math.max(0, Math.min(1, an.act.t / 0.05, (c.dur - an.act.t) / 0.16)); const full = an.act.full || an.act.c === 'kick' || an.act.c === 'jump' || an.act.c === 'death'; sampleInto(M, A, map, c, an.act.t, P, w, spd > 0.6 && !full ? up : null); }
    }
  }
  skinPose(M, P);
  return P;
}
function skHeroItems(S, h, key, Ms, P, col, out) {
  const L = HLOOK[key], mesh = S.mesh[L.body], G = S.grp[L.body], tex = skHeroTex(S, key, h.hc | 0);
  const c2 = L.kind === 'm' ? (col === COLN ? COLG : col) : col;
  out.push({ mesh, model: Ms, skin: P.S, tex, col: c2, off: G.body.start, cnt: G.body.count, cast: true });
  if (G.Pistol) out.push({ mesh, model: Ms, skin: P.S, tex, col: col === COLF ? COLF : COLG, off: G.Pistol.start, cnt: G.Pistol.count, cast: true });
}
const heroScale = (key) => { const L = HLOOK[key]; return L ? (L.kind === 'm' ? MECH_H : HERO_H) * (L.sc || 1) : HERO_H; };
function skThumbs(d) {
  const out = {};
  try {
    const cv = document.createElement('canvas'); cv.width = 168; cv.height = 168;
    const R = createRenderer(cv, { keep: true, shadowSize: 256 });
    if (!R) return out;
    const S = skUpload(R, d, true);
    const env = heroThumbEnv();
    for (const k of E.HERO_KEYS) {
      const h = { vx: 0, vz: 0, hc: 0, an: { t: 0.35, run: 0, act: null, dt: 0, dash: 0 } };
      const P = skPoseHero(S, h, k, {}, 0);
      const hs = heroScale(k), mech = HLOOK[k].kind === 'm';
      const Ms = scl(m4.pose(0, 0, 0, mech ? 0.62 : 0.42), hs, hs, hs);
      const items = [];
      skHeroItems(S, h, k, Ms, P, COLN, items);
      R.render({ env, cam: mech ? { pos: [0.9, 1.55, 3.0], at: [0.05, 0.72, 0], fov: 0.6 } : { pos: [0.55, 1.42, 2.75], at: [0.05, 1.0, 0], fov: 0.6 }, items, parts: [] });
      out[k] = cv.toDataURL('image/png');
    }
    R.dispose(); R.lose();
  } catch { return {}; }
  return out;
}

const DROP_TINT_HEX = { hp: '#6CFFD4', pw: '#FF7AD9', su: '#FFD24A', sh: '#7FE9FF', rf: '#FFB067', sp: '#7BF27B' };
const DROP_TEXT = { hp: 'Health', pw: 'Power up', su: 'Super charged', sh: 'Shield', rf: 'Rapid fire', sp: 'Speed' };
const DROP_COL = { hp: '#6BF26B', pw: '#FF7AD9', su: '#FFE15A', sh: '#9FE6FF', rf: '#FFB067', sp: '#9BF29B' };
const ATK_GI = { blaze: 'flame', pip: 'electric', boom: 'bomb', mira: 'heal', rex: 'hammer', volt: 'lightning', kai: 'rocket', ivy: 'snowflake', nyx: 'knife' };
const GAD_GI = { ring: 'firering', decoy: 'ghost', mine: 'mine', bubble: 'shield', charge: 'shield', over: 'lightning', jet: 'jetpack', nova: 'freeze', vanish: 'ghost' };
const SUP_GI = { wave: 'sonic', beam: 'laser', mega: 'megabomb', bloom: 'heal', slam: 'stomp', turret: 'tesla', barrage: 'missiles', freeze: 'freeze', blink: 'vortex' };
const PREF = { mode: 'zchat-siege-mode', ts: 'zchat-siege-ts', sk: 'zchat-siege-skill', hero: 'zchat-siege-hero', arena: 'zchat-siege-arena', lv: 'zchat-siege-level', bots: 'zchat-siege-bots', gfx: 'zchat-siege-gfx', end: 'zchat-siege-endless', nums: 'zchat-siege-nums', bars: 'zchat-siege-bars', map: 'zchat-siege-map', shake: 'zchat-siege-shake' };
const BEST_KEY = (uid, a, lv) => `zchat-siege-best-${uid || 'me'}-${a}-${lv}`;
const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch { return d; } };
const savePref = (k, v) => { try { localStorage.setItem(k, String(v)); } catch {} };
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const { clamp, wrapA } = E;
const validHero = (k) => (E.HEROES[k] ? k : 'blaze');
if (cloudOn()) E.setSquadMax(20);
const HUE = [0, 150, 215, 290];
function hsv(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d > 1e-6) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [h, mx ? d / mx : 0, mx]; }
function rgb(h, s0, v) { const c = v * s0, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [r + m, g + m, b + m]; }
function tintMesh(data, shift) {
  if (!shift) return data;
  const out = new Float32Array(data);
  for (let i = 6; i < out.length; i += 10) {
    const [h, sv, v] = hsv(out[i], out[i + 1], out[i + 2]);
    if (sv < 0.34 || v < 0.16 || (h > 10 && h < 46 && sv < 0.6)) continue;
    const c = rgb((h + shift) % 360, sv, v);
    out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2];
  }
  return out;
}
const heroTint = (k, c) => { const H = E.HEROES[k]; if (!H || !c) return H ? H.col : '#FFFFFF'; const n = parseInt(H.col.slice(1), 16); const [h, sv, v] = hsv(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); const o = rgb((h + HUE[c]) % 360, sv, v); return `#${o.map((q) => Math.round(q * 255).toString(16).padStart(2, '0')).join('')}`; };
const validArena = (k) => (E.ARENA_KEYS.includes(k) ? k : 'yard');
const validLv = (k) => (E.LEVELS[k] ? k : 'normal');
const BOT_NAMES = ['Ash', 'Bo', 'Cleo', 'Dex', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivo'];
const STREAK = 20;
const SLOT_COLS = ['#FFC23D', '#4DA3FF', '#FF6FA8', '#7BE05A', '#B88CFF', '#FF8A3D', '#3DD9C4', '#FF5A5A', '#E6E6E6', '#C8E05A'];
const SNAP_MS = 110, RE_MS = 80;
const BOT_STEPS = [0, 1, 3, 5, 9];
const ARENA_BG = { yard: 'linear-gradient(135deg, #8A7A60, #4A3F31)', ruins: 'linear-gradient(135deg, #5F7C33, #2E421D)', frost: 'linear-gradient(135deg, #DDE5EB, #7E8C98)', lava: 'linear-gradient(135deg, #8A3A1E, #252323)', docks: 'linear-gradient(135deg, #3E8C96, #75726B)' };
const RANGE_TXT = ['', 'Very short', 'Short', 'Medium', 'Long', 'Very long'];
const SPEED_TXT = ['', 'Slow', 'Steady', 'Normal', 'Quick', 'Very quick'];
const shotDmg = (H) => (H.atk.n ? H.atk.n * H.atk.dmg : H.atk.dmg);
function StatRow({ label, f, text, col }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ width: 62, fontSize: 12.5, fontWeight: 900, flexShrink: 0 }}>{label}</span>
      <span style={{ flex: 1, height: 9, borderRadius: 5, background: 'rgba(255,255,255,0.12)', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', height: '100%', width: `${Math.round(clamp(f, 0.04, 1) * 100)}%`, background: col, borderRadius: 5 }} /></span>
      <span style={{ width: 92, textAlign: 'right', fontSize: 12.5, fontWeight: 900, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{text}</span>
    </div>
  );
}
const snapBots = (n) => BOT_STEPS.reduce((b, v) => (Math.abs(v - n) < Math.abs(b - n) ? v : b), 0);
const sendMsFor = (n) => (n <= 4 ? 100 : n <= 7 ? 125 : 150);
const GFX = [['auto', 'Auto'], ['best', 'Best'], ['fast', 'Fast']];
const LV_ITEMS = E.LEVEL_KEYS.map((k) => [k, E.LEVELS[k].name]);
const BOT_ITEMS = [['0', 'Off'], ['1', '1'], ['3', '3'], ['5', '5'], ['9', '9']];
const WAVE_ITEMS = [['15', `${E.WIN_WAVE} waves`], ['end', 'Endless']];
const ST_CODE = { intro: 0, fight: 1, break: 2, won: 3 };
const ST_NAME = ['intro', 'fight', 'break', 'won'];
const PROG = { data: null, at: 0 };
function loadProg() {
  if (PROG.data && Date.now() - PROG.at < 60000) return Promise.resolve(PROG.data);
  return new Promise((res) => {
    try {
      supabase.rpc('zchat_siege_state').then(({ data, error }) => {
        if (error || !data || typeof data !== 'object') { res(null); return; }
        const levels = {};
        for (const k of E.HERO_KEYS) levels[k] = clamp(Number(data.levels && data.levels[k]) || 1, 1, E.MAX_LEVEL);
        PROG.data = { scrap: Math.max(0, Number(data.scrap) || 0), levels }; PROG.at = Date.now();
        res(PROG.data);
      }, () => res(null));
    } catch { res(null); }
  });
}
const modsPack = (h) => { const M = h.mods; const o = [Math.round(M.dmg * 100), M.extra | 0, M.pierce | 0, Math.round(M.rad * 100), Math.round(M.heal * 100), Math.round(M.stun * 100), Math.round(M.slow * 100)]; o.push(h.buffs && h.buffs.fury ? 1 : 0, Math.round((M.fade || 1) * 100)); return o; };
const modsTake = (h, k) => { if (!Array.isArray(k) || k.length < 7 || !h.mods) return; const M = h.mods; M.dmg = clamp(num(k[0], 100) / 100, 0.5, 4); M.extra = clamp(k[1] | 0, 0, 4); M.pierce = clamp(k[2] | 0, 0, 3); M.rad = clamp(num(k[3], 100) / 100, 0.5, 2.5); M.heal = clamp(num(k[4], 100) / 100, 0.5, 3); M.stun = clamp(num(k[5], 100) / 100, 0.5, 3); M.slow = clamp(num(k[6], 100) / 100, 0.5, 3); if (k.length >= 9) { (h.buffs || (h.buffs = {})).fury = k[7] ? 1 : 0; M.fade = clamp(num(k[8], 100) / 100, 1, 2); } };
const fmtK = (n) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n)));
const fmtN = (n) => Math.round(n || 0).toLocaleString();
const fmtP = (n) => `${Math.round((n || 0) * 100)}%`;
const fmtS = (n) => (n > 0 ? `${n.toFixed(1)}s` : '0s');
const CARD_FX = {
  tough: ['15% more max health', (s) => ['Health', fmtN(s.max), fmtN(s.hpB * s.m.hp * 1.15)]],
  power: ['12% more damage', (s) => ['Damage', fmtN(s.dB * s.m.dmg), fmtN(s.dB * s.m.dmg * 1.12)]],
  reload: ['Ammo refills 20% faster', (s) => ['Reload', fmtP(s.m.reload), fmtP(s.m.reload * 1.2)]],
  swift: ['Move 8% faster', (s) => ['Speed', fmtP(s.m.spd), fmtP(s.m.spd * 1.08)]],
  charge: ['Super fills 22% faster', (s) => ['Super', fmtP(s.m.supRate), fmtP(s.m.supRate * 1.22)]],
  ammo: ['One more shot in your ammo bar', (s) => ['Ammo', String(s.m.ammo), String(Math.min(5, s.m.ammo + 1))]],
  life: ['Heal 6% of the damage you deal', (s) => ['Lifesteal', fmtP(s.m.life), fmtP(s.m.life + 0.06)]],
  regen: ['Heal 60% faster out of a fight', (s) => ['Regen', fmtP(s.m.regen), fmtP(s.m.regen * 1.6)]],
  armor: ['Take 10% less damage', (s) => ['Armor', fmtP(s.m.armor), fmtP(Math.min(0.45, s.m.armor + 0.1))]],
  dash: ['Dash comes back 28% sooner', (s) => ['Cooldown', fmtS(E.DASH.cd * s.m.dashCd), fmtS(E.DASH.cd * s.m.dashCd * 0.72)]],
  gadget: ['One more gadget use', (s) => ['Gadgets', String(s.gad), String(s.gad + 1)]],
  lucky: ['Power ups last longer and do more', (s) => ['Power ups', fmtP(1 + s.m.luck), fmtP(1.4 + s.m.luck)]],
  blaze: ['Two more pellets each shot', (s) => ['Pellets', String(s.n + s.m.extra), String(s.n + s.m.extra + 2)]],
  pip: ['Shots go through one more alien', (s) => ['Pierce', String(s.m.pierce), String(s.m.pierce + 1)]],
  boom: ['Bomb blasts 22% bigger', (s) => ['Blast', fmtP(s.m.rad), fmtP(s.m.rad * 1.22)]],
  mira: ['Heal friends 35% more', (s) => ['Healing', fmtP(s.m.heal), fmtP(s.m.heal * 1.35)]],
  rex: ['Stuns last 40% longer', (s) => ['Stun', fmtP(s.m.stun), fmtP(s.m.stun * 1.4)]],
  volt: ['Zaps jump to one more alien', (s) => ['Jumps', String(s.m.extra), String(s.m.extra + 1)]],
  kai: ['Rocket blasts 25% bigger', (s) => ['Blast', fmtP(s.m.rad), fmtP(s.m.rad * 1.25)]],
  ivy: ['Slows last 40% longer', (s) => ['Slow', fmtP(s.m.slow), fmtP(s.m.slow * 1.4)]],
  crit: ['12% chance to hit twice as hard', (s) => ['Crit chance', fmtP(s.m.crit), fmtP(Math.min(0.36, (s.m.crit || 0) + 0.12))]],
  chain: ['Aliens you take down explode', (s) => ['Blast', fmtN(320 * (s.m.chain || 0) * s.m.dmg), fmtN(320 * ((s.m.chain || 0) + 1) * s.m.dmg)]],
  rush: ['Run 22% faster after a takedown', (s) => ['Boost', fmtS(s.m.rush ? 1.6 + s.m.rush : 0), fmtS(2.6 + (s.m.rush || 0))]],
  magnet: ['Grab power ups from farther away', (s) => ['Reach', fmtP((1.15 + (s.m.magnet || 0)) / 1.15), fmtP((2.45 + (s.m.magnet || 0)) / 1.15)]],
  guard: ['Your super also gives you a shield', (s) => ['Shield', fmtN(s.max * (s.m.supShield || 0)), fmtN(s.max * ((s.m.supShield || 0) + 0.2))]],
  medic: ['Help friends up 60% faster', (s) => ['Revive', fmtP(s.m.revive || 1), fmtP((s.m.revive || 1) * 1.6)]],
};
const CARD_TEAM = { on: false };
const cardLine = (k) => { const t = CARD_FX[k] ? CARD_FX[k][0] : (E.CARDS[k] && E.CARDS[k].text) || ''; return CARD_TEAM.on ? t.replace(/Aliens/g, 'Enemies').replace(/aliens/g, 'enemies').replace(/an alien/g, 'an enemy').replace(/alien/g, 'enemy') : t; };
const ABILITY_CARDS = new Set(['life', 'crit', 'chain', 'rush', 'magnet', 'guard', 'medic']);
const CARD_TIER = {
  hero: { label: 'Hero power', a: '#FFD84D', b: '#EE8A12', c: '#7A3F00', glow: 'rgba(255,196,60,0.7)', pip: '#FFD84D' },
  ability: { label: 'Ability', a: '#D592FF', b: '#7B38E2', c: '#2C0C66', glow: 'rgba(200,130,255,0.6)', pip: '#D592FF' },
  boost: { label: 'Boost', a: '#74C8FF', b: '#2B6EDD', c: '#0A2C70', glow: 'rgba(110,190,255,0.55)', pip: '#74C8FF' },
};
const tierOf = (k) => (E.CARDS[k] && E.CARDS[k].hero ? 'hero' : ABILITY_CARDS.has(k) ? 'ability' : 'boost');
function cardSnap(h) {
  const have = {};
  for (const k of h.cards || []) have[k] = (have[k] || 0) + 1;
  const H = E.HEROES[h.key] || {};
  return { have, m: { ...(h.mods || E.baseMods()) }, max: h.max, hpB: H.hp || h.max, dB: H.atk ? shotDmg(H) : 0, n: (H.atk && H.atk.n) || 0, gad: h.gad | 0 };
}
function UpgradeCard({ k, i, snap, land, short, keyHint, onPick }) {
  const C = E.CARDS[k];
  if (!C) return null;
  const tk = tierOf(k);
  const T = CARD_TIER[tk];
  const fx = CARD_FX[k];
  const pv = fx && snap ? fx[1](snap) : null;
  const have = (snap && snap.have[k]) || 0;
  const max = C.max || 0;
  const line = cardLine(k);
  const label = `${C.name}. ${T.label}. ${line}.${pv ? ` ${pv[0]} ${pv[1]} to ${pv[2]}.` : ''}${have ? ` Level ${have + 1}.` : ' New.'}`;
  const tag = { height: 18, padding: '0 7px', borderRadius: 9, display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap', lineHeight: 1 };
  const tierTag = <span style={{ ...tag, background: 'rgba(0,0,0,0.38)', color: T.a }}>{T.label}</span>;
  const lvTag = have ? <span style={{ ...tag, background: 'rgba(0,0,0,0.38)', color: '#FFFFFF' }}>{`Level ${have + 1}`}</span> : <span style={{ ...tag, background: '#5BE35B', color: '#0C3A10', boxShadow: `0 0 0 1.5px ${INK}` }}>New</span>;
  const md = land ? (short ? 46 : 54) : 50;
  const art = (
    <span aria-hidden="true" style={{ position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: land ? '100%' : 78, height: land ? (short ? 62 : 76) : 'auto', alignSelf: 'stretch', background: `radial-gradient(circle at 50% 60%, ${T.a} 0%, ${T.b} 58%, ${T.c} 100%)` }}>
      <span style={{ position: 'absolute', left: '50%', top: '60%', width: 260, height: 260, marginLeft: -130, marginTop: -130, background: 'repeating-conic-gradient(rgba(255,255,255,0.15) 0deg 8deg, rgba(255,255,255,0) 8deg 22deg)', borderRadius: '50%', WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 18%, transparent 62%)' }} />
      {tk === 'hero' && <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.45), rgba(255,255,255,0))', animation: 'zgk-shine 2.8s ease-in-out 0.6s infinite' }} />}
      <span style={{ position: 'relative', width: md, height: md, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: land ? 6 : 0, background: `radial-gradient(circle at 36% 28%, #FFFFFF 0%, ${T.a} 32%, ${T.b} 100%)`, boxShadow: `0 0 0 2.5px ${INK}, inset 0 -4px 0 rgba(0,0,0,0.24), 0 0 18px ${T.glow}` }}>
        <GIcon k={C.icon} size={Math.round(md * 0.56)} color="#FFFFFF" ink="rgba(0,0,0,0.35)" />
      </span>
      {land && <span style={{ position: 'absolute', left: 6, top: 6 }}>{tierTag}</span>}
      {land && <span style={{ position: 'absolute', right: 6, top: 6 }}>{lvTag}</span>}
      {keyHint && <span style={{ position: 'absolute', left: 6, bottom: 6, width: 20, height: 20, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 900, color: '#FFFFFF', background: 'rgba(0,0,0,0.42)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.3)' }}>{i + 1}</span>}
    </span>
  );
  const preview = pv && (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, maxWidth: '100%', padding: '0 9px', borderRadius: 11, background: 'rgba(0,0,0,0.34)', fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', boxSizing: 'border-box' }}>
      <span style={{ color: 'rgba(255,255,255,0.78)' }}>{pv[1]}</span>
      <svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M2 1.5L6.5 5L2 8.5" stroke="#8CFF7A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ color: '#8CFF7A' }}>{pv[2]}</span>
    </span>
  );
  const pips = max > 1 && (
    <span aria-hidden="true" style={{ display: 'flex', gap: 4, justifyContent: land ? 'center' : 'flex-start' }}>
      {Array.from({ length: max }, (_, j) => <span key={j} style={{ width: 15, height: 5, borderRadius: 3, background: j < have ? T.pip : j === have ? '#FFFFFF' : 'rgba(255,255,255,0.18)', boxShadow: j <= have ? '0 0 6px rgba(255,255,255,0.35)' : 'none', animation: j === have ? 'zgk-blink 1.1s ease-in-out infinite' : 'none' }} />)}
    </span>
  );
  return (
    <button type="button" className="zgk-btn" aria-label={label} {...pressProps(onPick)}
      style={{ position: 'relative', display: 'flex', flexDirection: land ? 'column' : 'row', alignItems: 'stretch', padding: 0, border: 'none', borderRadius: 15, overflow: 'hidden', cursor: 'pointer', fontFamily: FONT, color: '#FFFFFF', textAlign: land ? 'center' : 'left', minWidth: 0,
        background: 'linear-gradient(180deg, #2A2552 0%, #1A1638 100%)', boxShadow: `0 0 0 2.5px ${INK}, inset 0 0 0 2px ${T.b}, 0 5px 0 rgba(0,0,0,0.38)`, animation: `zgk-deal 0.38s cubic-bezier(0.2, 0.9, 0.3, 1.25) ${i * 0.07}s both` }}>
      {art}
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: land ? 'center' : 'flex-start', justifyContent: land ? 'flex-start' : 'center', gap: land ? 5 : 4, padding: land ? (short ? '6px 8px 8px' : '8px 9px 10px') : '9px 11px 10px', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.07)' }}>
        {!land && <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{tierTag}{lvTag}</span>}
        <span style={{ fontSize: land ? 15.5 : 15, fontWeight: 900, lineHeight: 1.1, textShadow: '0 2px 0 rgba(0,0,0,0.35)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{C.name}</span>
        <span style={{ fontSize: 12, fontWeight: 750, color: 'rgba(255,255,255,0.8)', lineHeight: 1.25, minHeight: land && !short ? 30 : 0, display: 'flex', alignItems: 'center', justifyContent: land ? 'center' : 'flex-start' }}>{line}</span>
        {preview}
        {pips}
      </span>
    </button>
  );
}
const srgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const TINT = { blueT: srgb('#3D8BFF'), redT: srgb('#FF4D5E'), violet: srgb('#B88CFF'), ice: srgb('#9FE6FF'), card: srgb('#C8A070'), white: [1, 1, 1], gold: srgb('#FFD24A'), red: srgb('#FF3B2E'), mint: srgb('#6CFFD4'), me: srgb('#6BF26B'), ally: srgb('#4DA3FF'), foe: srgb('#FF4A3D'), dark: [0, 0, 0], cyan: srgb('#7FE9FF') };
const DROP_TINT = Object.fromEntries(Object.entries(DROP_TINT_HEX).map(([k, v]) => [k, srgb(v)]));
const mul = m4.mul;
function scl(M, sx, sy, sz) { const o = new Float32Array(M); for (let i = 0; i < 3; i++) { o[i] *= sx; o[4 + i] *= sy; o[8 + i] *= sz; } return o; }

const BOLT = {"pellet":[0.1,0.5],"bolt":[0.74,0.75],"beam":[1.63,0.7927],"eshot":[2.5627,0.2444],"tshot":[2.9472,0.2518],"orb":[3.339,0.5499],"lob":[4.0289,0.4528],"swing":[4.6217,0.5],"boom":[5.2617,0.7775],"bigboom":[6.1792,1.6],"stomp":[7.9192,0.9966],"crunch":[9.0558,1.1],"clank":[10.2958,0.1405],"hit":[10.5763,0.3],"hurt":[11.0163,0.2843],"heal":[11.4406,1.1],"pick":[12.6806,0.6],"super":[13.4206,0.9],"shield":[14.4606,1.2],"laser":[15.8006,1.7],"spawn":[17.6406,0.8],"fuse":[18.5806,0.1166],"wind":[18.8372,0.4],"dash":[19.3772,0.55],"jump":[20.0672,0.6],"fireball":[20.8072,1.0],"frost":[21.9472,0.8],"shock":[22.8872,0.7491],"skill":[23.7763,0.6],"poof":[24.5163,0.7],"pdie":[25.3563,0.4123],"alert":[25.9086,0.8696],"star":[26.9182,0.4966],"coin":[27.5548,0.6954],"pop":[28.3902,0.0928],"cp":[28.623,0.5279],"combo":[29.2909,0.4847],"win":[29.9156,1.0824],"lose":[31.1379,1.6147],"rocket":[32.8927,0.7],"shard":[33.7326,0.6],"blast":[34.4726,0.9],"build":[35.5126,0.3153],"freeze":[35.968,1.1258],"over":[37.2338,1.0],"decoy":[38.3738,0.8],"zapl":[39.3138,0.7],"barrage":[40.1538,0.9],"splat":[41.1938,0.3472]};
const BS = { buf: null, job: null, at: {} };
function boltLoad() {
  const ac = Sfx.ctx();
  if (!ac || BS.buf || BS.job) return;
  BS.job = fetch('/sounds/bolt/sfx-v2.mp3').then((r) => (r.ok ? r.arrayBuffer() : null)).then((b) => (b ? new Promise((res, rej) => ac.decodeAudioData(b, res, rej)) : null)).then((buf) => { BS.buf = buf; if (!buf) BS.job = null; }).catch(() => { BS.job = null; });
}
function zap(kind, vol = 1, rate = 1) {
  const B = Sfx.bus();
  const seg = BOLT[kind];
  if (!B || !seg || vol <= 0.02) return;
  if (!BS.buf) { boltLoad(); return; }
  const { ac, out } = B;
  const t = ac.currentTime;
  if ((BS.at[kind] || -1) > t - 0.05) return;
  BS.at[kind] = t;
  try {
    const src = ac.createBufferSource();
    src.buffer = BS.buf;
    src.playbackRate.value = rate;
    const g = ac.createGain();
    g.gain.value = Math.min(1.2, vol);
    src.connect(g); g.connect(out);
    src.start(t, Math.max(0, seg[0] - 0.004), seg[1] + 0.01);
  } catch {}
}

const RIFT = { job: null, d: null };
function loadRift() {
  if (RIFT.d) return Promise.resolve(RIFT.d);
  if (RIFT.job) return RIFT.job;
  RIFT.job = Promise.all([fetch('/bolt/rift-pack-v1.bin').then((r) => { if (!r.ok) throw new Error('rift'); return r.arrayBuffer(); }), skImg('/bolt/t_usk.webp')])
    .then(([buf, im]) => { const d = riftUnpack(buf, im); if (!d) throw new Error('rift'); RIFT.d = d; return d; })
    .catch(() => { RIFT.job = null; return null; });
  return RIFT.job;
}
function riftUpload(R, d) {
  const out = { mesh: {}, still: {} };
  for (const [k, M] of Object.entries(d.m)) { try { out.mesh[k] = R.tskin(M); out.still[k] = stillSkin(M); } catch {} }
  return out;
}
const SKILL_ZAP = { blink: 'dash', mend: 'heal', hunter: 'bolt', guard: 'shield', sprint: 'over', shock: 'shock' };
const TEAM_BOT_SK = ['shock', 'mend', 'hunter', 'guard', 'sprint', 'blink'];
const TOW_NAME = { tow: 'tower', gua: 'guardian', cor: 'core' };

const THUMB = { heroes: null, arenas: {} };
function heroThumbs() {
  if (THUMB.heroes) return THUMB.heroes;
  const out = {};
  try {
    const cv = document.createElement('canvas'); cv.width = 168; cv.height = 168;
    const R = createRenderer(cv, { keep: true, shadowSize: 256 });
    if (!R) return out;
    const env = heroThumbEnv();
    for (const k of E.HERO_KEYS) {
      const H = heroMeshes(k);
      const body = R.mesh(H.body), leg = R.mesh(H.leg);
      const M = m4.pose(0, 0, 0, 0.42);
      const items = [{ mesh: body, model: M }];
      for (const s of [-1, 1]) items.push({ mesh: leg, model: mul(M, m4.pose(s * H.hip[0], H.hip[1], 0, 0, s * 0.18, 0)) });
      R.render({ env, cam: { pos: [0.55, 1.32, 2.7], at: [0.05, 0.9, 0], fov: 0.6 }, items, parts: [] });
      out[k] = cv.toDataURL('image/png');
      R.drop(body); R.drop(leg);
    }
    R.dispose(); R.lose();
  } catch {}
  THUMB.heroes = out;
  return out;
}
function arenaThumb(key) {
  if (THUMB.arenas[key]) return THUMB.arenas[key];
  let url = '';
  try {
    const rift = key === 'rift';
    if (rift && !RIFT.d) return '';
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 180;
    const R = createRenderer(cv, { keep: true, shadowSize: 1024 });
    if (!R) return '';
    const A = E.makeArena(key);
    const M = arenaMeshes(A, rift ? RIFT.d.kit : null);
    const env = arenaEnv(A); env.shadowRange = rift ? 90 : 46;
    const items = M.parts.filter((p) => p.kind !== 'fine').map((p) => ({ mesh: R.mesh(p.data), cast: p.cast, bs: p.bs }));
    for (const b of M.bushes) items.push({ mesh: R.mesh(b.data), cast: true });
    const tx = A.wx / 2, tz = A.wz / 2 + (rift ? 6 : 2), D = rift ? 118 : 62, P = rift ? 1.12 : 1.08;
    R.render({ env, cam: { pos: [tx, Math.sin(P) * D, tz + Math.cos(P) * D], at: [tx, 0, tz], fov: 0.72, shadowAt: [tx, 0, tz] }, items, parts: [] });
    url = cv.toDataURL('image/jpeg', 0.86);
    R.dispose(); R.lose();
  } catch {}
  THUMB.arenas[key] = url;
  return url;
}

function HeroCard({ k, on, img, onPress, size = 64, label, lv, locked }) {
  const H = E.HEROES[k];
  return (
    <button type="button" className="zgk-btn" aria-pressed={on} aria-label={label || `${H.name}, ${H.role}${locked ? ', taken' : ''}`} {...pressProps(onPress)}
      style={{ position: 'relative', width: size, flexShrink: 0, opacity: locked ? 0.42 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT, color: '#FFFFFF' }}>
      <span style={{ width: size, height: size, borderRadius: 14, overflow: 'hidden', display: 'block', background: `radial-gradient(circle at 50% 35%, ${H.col}55, #141A2C 75%)`, boxShadow: on ? `0 0 0 3px #FFD45A, 0 4px 12px rgba(0,0,0,0.4)` : 'inset 0 0 0 1.5px rgba(255,255,255,0.16)' }}>
        {img ? <img src={img} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} /> : null}
      </span>
      {lv > 1 && <span aria-hidden="true" style={{ position: 'absolute', right: -3, top: -3, minWidth: 18, height: 18, padding: '0 4px', boxSizing: 'border-box', borderRadius: 9, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', color: '#2A1D05', fontSize: 10.5, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 1.5px ${INK}` }}>{lv}</span>}
      <span style={{ fontSize: 11.5, fontWeight: 900, color: on ? '#FFE15A' : '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{locked ? 'Taken' : H.name}</span>
    </button>
  );
}


export function SiegeGamePage({ solo = false, room, me, myId, onClose, onInvite, watch = false }) {
  injectCss(); injectKitCss();
  const uid = solo ? 'me' : myId;
  const isHost = solo || (room && room.host === myId);
  const hostId = solo ? 'me' : room && room.host;
  const myFirst = String((me && me.name) || 'You').split(' ')[0];
  const [heroKey, setHeroKey] = useState(() => validHero(readPref(PREF.hero, 'blaze')));
  const [heroCol, setHeroCol] = useState(() => clamp(Number(readPref('zchat-siege-hcol', 0)) | 0, 0, 3));
  const [skill, setSkill] = useState(() => { const v = readPref(PREF.sk, 'shock'); return T.SKILLS[v] ? v : 'shock'; });
  const meta = { n: myFirst, a: me && me.avatar, w: watch ? 1 : 0, h: heroKey, hc: heroCol, sk: skill };
  const relay = useRoomLink({ id: solo || !room ? null : `siege-${room.rm}`, myId, enabled: !solo && !!room, meta, fast: ['hs', 'es'], audio: !watch, cloud: 'siege' });
  const [phase, setPhase] = useState('menu');
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [arena, setArena] = useState(() => (isHost ? validArena(readPref(PREF.arena, 'yard')) : 'yard'));
  const [lv, setLv] = useState(() => (isHost ? validLv(readPref(PREF.lv, 'normal')) : 'normal'));
  const [botN, setBotN] = useState(() => snapBots(clamp(Math.round(num(readPref(PREF.bots, '3'), 3)), 0, 9)));
  const [endless, setEndless] = useState(() => isHost && readPref(PREF.end, '0') === '1');
  const [mode, setMode] = useState(() => (isHost && readPref(PREF.mode, 'waves') === 'team' ? 'team' : 'waves'));
  const [ts, setTs] = useState(() => clamp(Number(readPref(PREF.ts, '3')) | 0 || 3, 1, 5));
  const [sideOf, setSideOf] = useState({});
  const [skOf, setSkOf] = useState({});
  const [tfeed, setTfeed] = useState([]);
  const [board, setBoard] = useState(false);
  const [mapSheet, setMapSheet] = useState(false);
  const [riftOk, setRiftOk] = useState(() => !!RIFT.d);
  const [gfx, setGfx] = useState(() => { const v = readPref(PREF.gfx, 'auto'); return v === 'best' || v === 'fast' ? v : 'auto'; });
  const [roster, setRoster] = useState(solo ? ['me'] : [room && room.host].filter(Boolean));
  const [names, setNames] = useState({});
  const [heroOf, setHeroOf] = useState({});
  const [colOf, setColOf] = useState({});
  const colOfRef = useRef(colOf); colOfRef.current = colOf;
  const [powSheet, setPowSheet] = useState(false);
  const [watchers, setWatchers] = useState([]);
  const [hud, setHud] = useState({ wave: 0, st: 'intro', t: 0, left: 0, score: 0, team: [], boss: null, me: null });
  const [banner, setBanner] = useState(null);
  const [result, setResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const [quick, setQuick] = useState(false);
  const [people, setPeople] = useState(false);
  const [ctl, setCtl] = useState(false);
  const [optSheet, setOptSheet] = useState(false);
  const [arenaSheet, setArenaSheet] = useState(false);
  const [follow, setFollow] = useState(null);
  const [camK, setCamK] = useState(null);
  const camKRef = useRef(null);
  const [thumbs, setThumbs] = useState({});
  const [aThumbs, setAThumbs] = useState({});
  const [bubbles, setBubbles] = useState({});
  const [aimUi, setAimUi] = useState(null);
  const [prog, setProg] = useState(() => PROG.data);
  const progRef = useRef(prog); progRef.current = prog;
  const [upBusy, setUpBusy] = useState(false);
  const [upMsg, setUpMsg] = useState('');
  const [cards, setCards] = useState(null);
  const [kill, setKill] = useState(null);
  const [heroSheet, setHeroSheet] = useState(false);
  const cardsRef = useRef(cards); cardsRef.current = cards;
  const pickRef = useRef(null);
  const gamePriv = useGamePrivacy();
  const allowWatch = gamePriv.show && gamePriv.watch;
  const [notes, pushNote] = useNotices();
  const look = useCtlLook('siege');
  const GS = useGameStage(useMemo(() => ({ ...look, side: true }), [look]));
  const { top, right, bottom, left } = GS.at;
  const land = GS.land;
  useLiveBeacon({ game: 'siege', room: room ? room.rm : null, info: { h: room && room.host, n: Math.max(1, roster.length) }, active: !solo && !watch && !!room, allow: allowWatch });

  const cvRef = useRef(null);
  const ovRef = useRef(null);
  const wrapRef = useRef(null);
  const atkRef = useRef(null);
  const supRef = useRef(null);
  const atkKnob = useRef(null);
  const supKnob = useRef(null);
  const ammoRef = useRef([]);
  const supRing = useRef(null);
  const hurtRef = useRef(null);
  const mapRef = useRef(null);
  const RR = useRef(null);
  const G = useRef({ W: null, rid: '', ids: [], bots: [], botMeta: {}, parts: [], nums: [], budget: { avg: 16, n: 0, tier: 0 }, sendAt: 0, snapAt: 0, reAt: 0, seq: 0, hsq: 0, lastSeq: -1, lastSnapAt: 0, cam: null, shake: 0, aim: { on: false }, fireQ: [], skQ: [], recQ: [], tbeams: [], flip: false, hudAt: 0, waveSeen: 0, stSeen: '', claimed: new Set(), beams: [], menuT: 0, mouse: null, hurtT: 0, over: false, overAt: 0, keyMove: [0, 0] });
  const keys = useRef(new Set());
  const phaseRef = useRef(phase); phaseRef.current = phase;
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const rosterRef = useRef(roster); rosterRef.current = roster;
  const namesRef = useRef(names); namesRef.current = names;
  const heroOfRef = useRef(heroOf); heroOfRef.current = heroOf;
  const heroRef = useRef(heroKey); heroRef.current = heroKey;
  const arenaRef = useRef(arena); arenaRef.current = arena;
  const lvRef = useRef(lv); lvRef.current = lv;
  const botNRef = useRef(botN); botNRef.current = botN;
  const endRef = useRef(endless); endRef.current = endless;
  const gfxRef = useRef(gfx); gfxRef.current = gfx;
  const modeRef = useRef(mode); modeRef.current = mode;
  const tsRef = useRef(ts); tsRef.current = ts;
  const skillRef = useRef(skill); skillRef.current = skill;
  const sideOfRef = useRef(sideOf); sideOfRef.current = sideOf;
  const skOfRef = useRef(skOf); skOfRef.current = skOf;
  const wantSide = useRef({});
  const [layEd, setLayEd] = useState(false);
  const hudLay = useHudLay('siege');
  const [hudOpt, setHudOpt] = useState(() => ({ nums: readPref(PREF.nums, '1') !== '0', bars: readPref(PREF.bars, '1') !== '0', map: readPref(PREF.map, '1') !== '0', shake: readPref(PREF.shake, '1') !== '0' }));
  const hudOptRef = useRef(hudOpt); hudOptRef.current = hudOpt;
  const setHudK = (k, v) => { kitTap(); setHudOpt((o) => ({ ...o, [k]: v })); savePref(PREF[k], v ? '1' : '0'); };
  const followRef = useRef(follow); followRef.current = follow;
  const sideRef = useRef(GS.side); sideRef.current = GS.side;
  const metaRef = useRef({});
  const joinOrder = useRef([]);
  const rosterSeen = useRef({ list: null, at: Date.now(), bye: new Set() });
  const sheetOpen = useRef(false);
  sheetOpen.current = !!(paused || leaveAsk || ctl || optSheet || arenaSheet || people || quick || board || mapSheet || powSheet);
  const kindOf = () => (solo ? 'me' : myId);
  const levelOf = (k) => (progRef.current && progRef.current.levels && progRef.current.levels[k]) || 1;
  const inGame = () => !watch && G.current.ids.includes(kindOf());
  const nameOf = (k) => (k === kindOf() ? 'You' : G.current.botMeta[k] ? G.current.botMeta[k].n : namesRef.current[k] || names[k] || 'Friend');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatNew, setChatNew] = useState(0);
  const [feed, pushFeed] = useChatFeed();
  const jask = useJoinAsks({ myId, on: !solo && !!room && isHost && !watch, game: 'siege' });
  const chatCol = (k) => { const W = G.current && G.current.W; const h = W && W.heroes && W.heroes[k]; return h && E.HEROES[h.key] ? heroTint(h.key, h.hc | 0) : '#A9CCFF'; };
  const chat = useGameChat(solo || watch ? null : relay, nameOf, (s, who, t, from) => { pushFeed(who, t, chatCol(from)); setChatNew((n) => n + 1); }, (t) => pushFeed('You', t));
  const bannerT = useRef(0);
  const showBanner = (text, sub, tone, sec = 2.4) => { setBanner({ text, sub, tone, at: Date.now() }); clearTimeout(bannerT.current); bannerT.current = setTimeout(() => setBanner(null), sec * 1000); };

  const J = useJoystick(wrapRef, {
    enabled: () => phaseRef.current === 'play' && !sheetOpen.current,
    rot: () => sideRef.current,
    radius: () => Math.round(52 * Math.max(0.75, look.size)),
    zone: (x, y, r) => x < r.width * 0.5 && y > 70,
  });

  const P3 = (o) => {
    const g = G.current;
    const cap = [520, 360, 220][g.budget.tier] || 300;
    if (g.parts.length >= cap) return;
    g.parts.push({ life: 0, vx: 0, vy: 0, vz: 0, a0: 1, seed: Math.random(), ...o });
  };
  const R0 = (a, b) => a + Math.random() * (b - a);
  const blast = (x, y, z, big, scale = 1) => {
    const lite = G.current.budget.tier >= 2;
    const k = scale;
    P3({ x, y, z, max: 0.14, s0: 1.1 * k, s1: (big ? 4.2 : 2.6) * k, a0: 0.75, type: 16 });
    P3({ x, y: 0.12, z, max: 0.5, s0: 1, s1: (big ? 7 : 4.4) * k, a0: 0.6, type: 13, flat: 1 });
    for (let i = 0; i < (big ? (lite ? 5 : 9) : 4); i++) { const a = R0(0, 6.283), d = R0(0, 0.9) * k; P3({ x: x + Math.cos(a) * d, y: y + R0(-0.1, 0.6), z: z + Math.sin(a) * d, vx: Math.cos(a) * R0(0.8, 2.4) * k, vy: R0(1.4, 3.4) * k, vz: Math.sin(a) * R0(0.8, 2.4) * k, max: R0(0.32, 0.62), s0: R0(0.7, 1.2) * k, s1: R0(1.7, 2.7) * k, a0: 1, type: 12, fin: 1 }); }
    for (let i = 0; i < (big ? (lite ? 4 : 7) : 3); i++) { const a = R0(0, 6.283), d = R0(0, 1.1) * k; P3({ x: x + Math.cos(a) * d, y: y + R0(0.2, 0.9), z: z + Math.sin(a) * d, vx: Math.cos(a) * R0(0.3, 1), vy: R0(1.3, 2.6), vz: Math.sin(a) * R0(0.3, 1), max: R0(1.1, 1.8), s0: R0(0.7, 1.1) * k, s1: R0(2.2, 3.3) * k, a0: 0.5, type: 11, fin: 1 }); }
    for (let i = 0; i < (big ? 10 : 5); i++) { const a = R0(0, 6.283); const sp = R0(5, 10); P3({ x, y: y + 0.3, z, vx: Math.cos(a) * sp * 0.7, vy: R0(4, 9), vz: Math.sin(a) * sp * 0.7, g: 22, max: R0(0.7, 1.2), s0: R0(0.14, 0.26), s1: 0.12, a0: 1, type: 5 }); }
    for (let i = 0; i < (big ? 18 : 8); i++) { const a = R0(0, 6.283); const sp = R0(9, 18); P3({ x, y: y + 0.2, z, vx: Math.cos(a) * sp * 0.8, vy: R0(3, 10), vz: Math.sin(a) * sp * 0.8, g: 18, max: R0(0.3, 0.6), s0: 0.09, s1: 0.05, a0: 1, type: 4, st: 0.035 }); }
  };
  const goo = (x, z, k, n) => {
    const lite = G.current.budget.tier >= 2;
    const m = lite ? Math.ceil(n * 0.5) : n;
    for (let i = 0; i < m; i++) { const a = R0(0, 6.283), sp = R0(2, 6) * k; P3({ x, y: R0(0.5, 1.1) * k, z, vx: Math.cos(a) * sp, vy: R0(2.5, 6.5) * k, vz: Math.sin(a) * sp, g: 16, max: R0(0.45, 0.85), s0: R0(0.14, 0.3) * k, s1: R0(0.08, 0.16) * k, a0: 1, type: 26 }); }
    P3({ x, y: 0.06, z, max: 2.2, s0: 0.6 * k, s1: 1.7 * k, a0: 0.75, type: 26, flat: 1 });
    P3({ x, y: 0.7 * k, z, max: 0.28, s0: 0.6 * k, s1: 2.2 * k, a0: 0.7, type: 25 });
  };
  const sparks = (x, y, z, n, type = 4, sp = 7) => { for (let i = 0; i < n; i++) { const a = R0(0, 6.283); const v = R0(sp * 0.4, sp); P3({ x, y, z, vx: Math.cos(a) * v, vy: R0(1, 5), vz: Math.sin(a) * v, g: 14, max: R0(0.18, 0.36), s0: 0.08, s1: 0.04, a0: 1, type, st: 0.03 }); } };
  const bolts = (x, y, z, R1, n) => {
    for (let b = 0; b < n; b++) {
      let a = (b / n) * 6.283 + Math.random() * 0.5, px = x, py = y, pz = z;
      const life = 0.14 + Math.random() * 0.12;
      for (let j = 1; j <= 5; j++) {
        a += (Math.random() - 0.5) * 0.9;
        const d = (R1 / 5) * (0.7 + Math.random() * 0.6);
        const qx = px + Math.cos(a) * d, qz = pz + Math.sin(a) * d, qy = y + (Math.random() - 0.3) * 0.7;
        const L = Math.hypot(qx - px, qy - py, qz - pz) * 0.5 + 0.05;
        P3({ x: (px + qx) / 2, y: (py + qy) / 2, z: (pz + qz) / 2, max: life, s0: 0.14, s1: 0.1, a0: 1, type: 15, d: [qx - px, qy - py, qz - pz], L });
        px = qx; py = qy; pz = qz;
      }
    }
  };
  const popNum = (x, z, text, col, big = false, y = 2.1) => {
    const g = G.current;
    if (g.nums.length > 40) g.nums.shift();
    g.nums.push({ x: x + R0(-0.3, 0.3), z, y, text, col, t: 0, life: big ? 1.1 : 0.85, big });
  };
  const popSum = (key, x, z, val, col, big, pre = '') => {
    const g = G.current;
    if (!hudOptRef.current.nums && key !== 'me') return;
    const o = g.nums.find((n) => n.key === key && n.t < 0.34);
    if (o) { o.val += val; o.text = `${pre}${o.val}`; o.col = typeof col === 'function' ? col(o.val) : col; o.big = o.big || (typeof big === 'function' ? big(o.val) : big); o.t = Math.min(o.t, 0.05); o.x = x; o.z = z; return; }
    if (g.nums.length > 40) g.nums.shift();
    g.nums.push({ x: x + R0(-0.3, 0.3), z, y: 2.1, text: `${pre}${val}`, col: typeof col === 'function' ? col(val) : col, t: 0, life: 0.95, big: typeof big === 'function' ? big(val) : big, key, val });
  };
  const camFoc = () => { const g = G.current; return g.cam ? g.cam.at : [0, 0, 0]; };
  const volAt = (x, z) => { const c = camFoc(); return clamp(1.1 - Math.hypot(x - c[0], z - c[2]) / 26, 0.12, 1); };

  const heroMesh = (key) => {
    const st = RR.current;
    if (!st) return null;
    if (!st.heroM[key]) { const [k0, c0] = key.split(':'); const H = heroMeshes(k0); const sh = HUE[Number(c0) | 0] || 0; st.heroM[key] = { body: st.R.mesh(tintMesh(H.body, sh)), leg: st.R.mesh(tintMesh(H.leg, sh)), hip: H.hip }; }
    return st.heroM[key];
  };
  const robotMesh = (type) => {
    const st = RR.current;
    if (!st) return null;
    if (!st.robM[type]) { const M = robotMeshes(type); st.robM[type] = { body: st.R.mesh(M.body), leg: M.leg ? st.R.mesh(M.leg) : null, hip: M.hip }; }
    return st.robM[type];
  };
  const ensureArena = (key) => {
    const st = RR.current;
    if (!st) return false;
    const k = key === 'rift' ? 'rift' : validArena(key);
    const kit = k === 'rift' && RIFT.d ? RIFT.d.kit : null;
    if (st.arena && st.arena.key === k && st.arena.kit === !!kit) return true;
    if (st.arena) for (const it of st.arena.items) st.R.drop(it.mesh);
    st.arena = null; st.mini = null;
    const A = E.makeArena(k);
    const M = arenaMeshes(A, kit);
    const items = M.parts.map((p) => ({ mesh: st.R.mesh(p.data), cast: p.cast, bs: p.bs, fine: p.kind === 'fine' }));
    const bushes = M.bushes.map((b) => ({ mesh: st.R.mesh(b.data), bs: b.bs, cells: b.cells, cast: true }));
    for (const b of bushes) items.push(b);
    const env = arenaEnv(A);
    env.baseFog = env.fogDen;
    if (G.current.budget.tier >= 2) { env.shadows = false; env.detail = 0; }
    st.arena = { key: k, A, items, bushes, env, kit: !!kit };
    return true;
  };

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return undefined;
    const g = G.current;
    const pref = gfxRef.current;
    g.budget.tier = pref === 'fast' || window.__zsiegeLow ? 2 : pref === 'best' ? 0 : weakPhone() ? 1 : 0;
    let R = null;
    try { R = createRenderer(cv, { shadowSize: g.budget.tier === 0 ? 2048 : 1024, fx: '/dead/fx-v1.webp' }); } catch { R = null; }
    if (!R) { setFailed(true); return undefined; }
    let fx = null;
    try { const F = fxSiege(); fx = Object.fromEntries(Object.keys(F).map((k) => [k, R.mesh(F[k])])); } catch { fx = null; }
    RR.current = { R, arena: null, heroM: {}, robM: {}, fx };
    const st0 = RR.current;
    loadSk().then((d) => { if (!d || RR.current !== st0) return; try { st0.sk = skUpload(R, d); } catch { st0.sk = null; } });
    const t = setTimeout(() => { try { ensureArena(modeRef.current === 'team' && RIFT.d ? 'rift' : arenaRef.current); setReady(true); } catch { setFailed(true); } }, 50);
    return () => {
      clearTimeout(t);
      RR.current = null;
      try { R.dispose(); } catch {}
      setTimeout(() => { if (!cv.isConnected) R.lose(); }, 0);
    };
  }, []);
  const wantArena = mode === 'team' ? 'rift' : arena;
  useEffect(() => {
    if (wantArena !== 'rift' || riftOk) return undefined;
    let on = true;
    loadRift().then((d) => { if (on && d) setRiftOk(true); });
    return () => { on = false; };
  }, [wantArena, riftOk]);
  useEffect(() => {
    const st = RR.current;
    if (!st || !st.arena || phaseRef.current !== 'menu') return undefined;
    if (wantArena === 'rift' && !riftOk) { setReady(false); return undefined; }
    if (st.arena.key === wantArena && (wantArena !== 'rift' || st.arena.kit)) { setReady(true); return undefined; }
    setReady(false);
    const t = setTimeout(() => { try { ensureArena(wantArena); setReady(true); } catch { setFailed(true); } }, 40);
    return () => clearTimeout(t);
  }, [wantArena, riftOk]);
  useEffect(() => { let on = true; const t = setTimeout(() => { if (on) setThumbs((p) => (Object.keys(p || {}).length ? p : heroThumbs())); }, 6000); loadSk().then((d) => { if (!on || !d) return; const th = skThumbs(d); if (Object.keys(th).length) setThumbs(th); }); return () => { on = false; clearTimeout(t); }; }, []);
  useEffect(() => { if (watch) return undefined; let on = true; loadProg().then((d) => { if (on && d) setProg(d); }); return () => { on = false; }; }, []);
  const upgrade = (k) => {
    const P0 = progRef.current;
    if (upBusy || !P0) return;
    const lv = P0.levels[k] || 1;
    if (lv >= E.MAX_LEVEL) return;
    const cost = E.levelCost(lv);
    if (P0.scrap < cost) { setUpMsg(`You need ${cost - P0.scrap} more scrap. Play games to earn it`); return; }
    setUpBusy(true); setUpMsg(''); kitTap();
    try {
      supabase.rpc('zchat_siege_level', { p_hero: k }).then(({ data, error }) => {
        setUpBusy(false);
        if (error || !data) { setUpMsg('Could not upgrade right now. Try again'); return; }
        if (data.ok) {
          const nd = { scrap: Math.max(0, Number(data.scrap) || 0), levels: { ...P0.levels, [k]: clamp(Number(data.level) || lv + 1, 1, E.MAX_LEVEL) } };
          PROG.data = nd; PROG.at = Date.now(); setProg(nd);
          zap('coin', 0.75);
        } else setUpMsg(data.reason === 'max' ? 'This hero is at the top level' : 'Not enough scrap yet');
      }, () => { setUpBusy(false); setUpMsg('Could not upgrade right now. Try again'); });
    } catch { setUpBusy(false); }
  };
  useEffect(() => { if (aThumbs[wantArena] || phase !== 'menu' || (wantArena === 'rift' && !riftOk)) return undefined; const t = setTimeout(() => { const u = arenaThumb(wantArena); if (u) setAThumbs((p) => ({ ...p, [wantArena]: u })); }, 900); return () => clearTimeout(t); }, [wantArena, phase, riftOk]);
  useEffect(() => { if (!arenaSheet) return undefined; const t = setTimeout(() => { const o = {}; for (const k of E.ARENA_KEYS) o[k] = arenaThumb(k); setAThumbs(o); }, 60); return () => clearTimeout(t); }, [arenaSheet]);

  const freshRoster = () => {
    if (solo) return ['me'];
    const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
    const order = joinOrder.current.filter((p) => present.includes(p));
    present.forEach((p) => { if (!order.includes(p)) order.push(p); });
    return [myId, ...order.filter((p) => p !== myId)].slice(0, E.SQUAD_MAX);
  };
  const heroFor = (k) => (k === kindOf() ? heroRef.current : validHero(heroOfRef.current[k] || (metaRef.current[k] && metaRef.current[k].h)));
  const heroColRef = useRef(heroCol); heroColRef.current = heroCol;

  const beginGame = (cfg) => {
    const g = G.current;
    const team = cfg.md === 'team';
    CARD_TEAM.on = team;
    const ak = team ? 'rift' : validArena(cfg.arena);
    if (!team && ak !== arenaRef.current) setArena(ak);
    if (team !== (modeRef.current === 'team')) setMode(team ? 'team' : 'waves');
    if (team && !RIFT.d) loadRift().then((d) => { if (d) setRiftOk(true); });
    try { ensureArena(ak); } catch {}
    const W = E.newWorld(ak, team ? 'normal' : validLv(cfg.lv), cfg.seed | 0 || 1, team ? { mode: 'team' } : { endless: !!cfg.en });
    W.host = isHost; W.local = new Set(); W.nowMs = performance.now();
    if (team) T.setupTeamWorld(W, { ts: cfg.ts });
    const slot = [0, 0];
    cfg.ids.forEach((k, i) => {
      const key = validHero(cfg.heroes && cfg.heroes[k]);
      if (team) {
        const h = E.mkHero(k, key, 0, 0, k.startsWith('bot'), 1);
        h.hc = clamp(Number(cfg.cols && cfg.cols[k]) | 0, 0, 3);
        const tm = cfg.tms && cfg.tms[k] === 1 ? 1 : 0;
        T.initHero(W, h, tm, cfg.sks && cfg.sks[k], slot[tm]++);
        W.heroes[k] = h; W.order.push(k);
        return;
      }
      const p = E.heroSpawn(W.A, i);
      const h = E.mkHero(k, key, p.x, p.z, k.startsWith('bot'), k === kindOf() && !watch ? levelOf(key) : 1);
      h.hc = clamp(Number(cfg.cols && cfg.cols[k]) | 0, 0, 3);
      W.heroes[k] = h; W.order.push(k);
    });
    if (team) for (const tm of [0, 1]) T.assignRoles(W.order.map((k) => W.heroes[k]).filter((h) => h.tm === tm && h.bot), cfg.ts);
    if (team && cfg.tls) for (const k of cfg.ids) { const L = clamp(cfg.tls[k] | 0, 1, T.TL_MAX); const h = W.heroes[k]; if (h && L > 1) { let xp = 0; for (let q = 1; q < L; q++) xp += T.xpNeed(q); T.addXP(W, h, xp); } }
    if (!watch && cfg.ids.includes(kindOf())) W.local.add(kindOf());
    g.botMeta = {};
    for (const b of cfg.bots || []) { g.botMeta[b.id] = { n: b.n }; if (isHost) W.local.add(b.id); }
    g.W = W; g.rid = cfg.rid; g.ids = cfg.ids.slice(); g.bots = (cfg.bots || []).map((b) => b.id);
    g.parts = []; g.nums = []; g.beams = []; g.zaps = []; g.seq = 0; g.hsq = 0; g.lastSeq = -1; g.lastSnapAt = performance.now(); g.waveSeen = 0; g.stSeen = ''; g.claimed = new Set(); g.over = false; g.cam = null; g.shake = 0; g.fireQ = []; g.aim = { on: false }; g.cardDone = 0; g.kill = null; g.gadQ = []; g.dashQ = []; g.myKills = 0; g.pend = []; g.pickId = 0;
    g.skQ = []; g.recQ = []; g.tbeams = []; g.feedId = 0; g.riftRebuild = false; g.waveTold = 0; g.cardTold = false;
    const meT = W.heroes[kindOf()];
    g.flip = !!(team && meT && meT.tm === 1);
    g.sendMs = sendMsFor(cfg.ids.filter((k) => !k.startsWith('bot')).length);
    setCards(null); setKill(null); setTfeed([]); setBoard(false); setMapSheet(false);
    if (!team) {
      if (cfg.lv !== lvRef.current && E.LEVELS[cfg.lv]) setLv(cfg.lv);
      setEndless(!!cfg.en);
    }
    setResult(null); setPaused(false); setQuick(false); setFollow(null); setArenaSheet(false); setOptSheet(false);
    setPhase('play');
    if (team) showBanner('Team battle', meT ? 'Break the enemy core to win' : 'Nebula Valley', 'blue', 3);
    else showBanner('Get ready', `${E.ARENAS[ak].name}, ${E.LEVELS[W.lv].name}`, 'blue', 2.6);
    J.reset();
    Sfx.init();
  };
  const sidesFor = (ids) => {
    const out = {}, cnt = [0, 0];
    const cap = Math.max(tsRef.current, Math.ceil(ids.length / 2));
    const hs = wantSide.current[kindOf()] === 1 ? 1 : 0;
    for (const id of ids) {
      let s0 = wantSide.current[id];
      if (s0 !== 0 && s0 !== 1) s0 = cnt[hs] < cap ? hs : 1 - hs;
      if (cnt[s0] >= cap) s0 = 1 - s0;
      out[id] = s0; cnt[s0] += 1;
    }
    return out;
  };
  const startTeam = () => {
    const humans = (solo ? ['me'] : freshRoster()).slice(0, 10);
    const ts0 = clamp(Math.max(tsRef.current, Math.ceil(humans.length / 2)), 1, 5);
    const tms = sidesFor(humans);
    const heroes = {}, cols = {}, sks = {}, bots = [], ids = [];
    const used = [new Set(), new Set()];
    for (const tm of [0, 1]) {
      const hs = humans.filter((id) => tms[id] === tm);
      for (const id of hs) {
        const k = heroFor(id);
        heroes[id] = k; used[tm].add(k);
        cols[id] = id === kindOf() ? heroColRef.current : clamp(Number(colOfRef.current[id] != null ? colOfRef.current[id] : metaRef.current[id] && metaRef.current[id].hc) | 0, 0, 3);
        const sk = id === kindOf() ? skillRef.current : skOfRef.current[id] || (metaRef.current[id] && metaRef.current[id].sk);
        sks[id] = T.SKILLS[sk] ? sk : 'shock';
        ids.push(id);
      }
      for (let i = hs.length; i < ts0; i++) {
        const id = `bot${tm}${i}`;
        const free = E.HERO_KEYS.filter((k) => !used[tm].has(k));
        const k = free.length ? free[(i * 5 + tm * 3 + bots.length) % free.length] : E.HERO_KEYS[(i + tm) % E.HERO_KEYS.length];
        used[tm].add(k);
        heroes[id] = k; cols[id] = (i + tm * 2) % 4; sks[id] = TEAM_BOT_SK[(i + tm * 2) % TEAM_BOT_SK.length];
        bots.push({ id, n: BOT_NAMES[bots.length % BOT_NAMES.length] });
        ids.push(id);
        tms[id] = tm;
      }
    }
    const cfg = { md: 'team', ts: ts0, tms, sks, cols, rid: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, ids, heroes, bots, arena: 'rift', lv: 'normal', en: 0, seed: (Math.random() * 1e9) | 0 };
    if (!solo) { setRoster(humans); relay.send('go', cfg); }
    beginGame(cfg);
  };
  const startGame = () => {
    if (!isHost || !ready) return;
    Sfx.init();
    if (modeRef.current === 'team') { startTeam(); return; }
    const ids = solo ? ['me'] : freshRoster();
    const heroes = {}, cols = {}, count = {}, tone = {};
    const cap = E.heroCap();
    const least = () => E.HERO_KEYS.reduce((a, b) => ((count[b] || 0) < (count[a] || 0) ? b : a), E.HERO_KEYS[0]);
    const place = (id, want0, c0) => {
      const k = (count[want0] || 0) < cap ? want0 : least();
      count[k] = (count[k] || 0) + 1;
      const taken = tone[k] || (tone[k] = new Set());
      let c = clamp(Number(c0) | 0, 0, 3);
      if (taken.has(c)) c = [0, 1, 2, 3].find((q) => !taken.has(q)) || 0;
      taken.add(c);
      heroes[id] = k; cols[id] = c;
    };
    ids.forEach((k) => place(k, heroFor(k), k === kindOf() ? heroColRef.current : colOfRef.current[k] != null ? colOfRef.current[k] : metaRef.current[k] && metaRef.current[k].hc));
    const bots = [];
    const want = Math.min(E.SQUAD_MAX, ids.length + botNRef.current);
    for (let i = ids.length; i < want; i++) {
      const id = `bot${i}`;
      const free = E.HERO_KEYS.filter((k) => !count[k]);
      const k = free.length ? (free.includes('mira') && i === ids.length ? 'mira' : free[(i * 7) % free.length]) : least();
      bots.push({ id, n: BOT_NAMES[i % BOT_NAMES.length] });
      ids.push(id);
      place(id, k, 0);
    }
    const cfg = { cols, rid: `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`, ids, heroes, bots, arena: arenaRef.current, lv: lvRef.current, en: endRef.current ? 1 : 0, seed: (Math.random() * 1e9) | 0 };
    if (!solo) { setRoster(ids.filter((k) => !k.startsWith('bot'))); relay.send('go', cfg); }
    beginGame(cfg);
  };
  const toMenu = (quiet) => {
    const g = G.current;
    g.W = null; g.ids = []; g.bots = []; g.parts = []; g.nums = []; g.beams = [];
    setPhase('menu'); setResult(null); setBanner(null);
    if (!solo && isHost && !quiet) relay.send('menu', {});
  };
  const finishTeam = (res) => {
    const g = G.current, W = g.W;
    const meH = W && W.heroes[kindOf()];
    const myTeam = meH ? meH.tm : 0;
    const won = !res.lost && res.team === myTeam && !!meH;
    const rows = Array.isArray(res.rows) && res.rows.length ? res.rows : W ? teamRows(W) : [];
    setResult({ team: true, won, lost: !!res.lost, myTeam, win: res.team, sc: Array.isArray(res.sc) ? res.sc : W && W.tm ? W.tm.score : [0, 0], rows, mins: W && W.tm ? Math.round(W.tm.t / 60) : 0, scrap: null, wave: 0, score: 0, list: [] });
    if (inGame() && progRef.current && !res.lost && W && W.tm) {
      const kd = W.tm.kd[kindOf()] || { k: 0, a: 0 };
      const mins = W.tm.t / 60;
      try {
        supabase.rpc('zchat_siege_award', { p_wave: clamp(Math.round(mins) + (won ? 6 : 2), 0, 40), p_kills: clamp((kd.k * 2 + kd.a) * 3, 0, 600), p_won: won }).then(({ data, error }) => {
          if (error || !data || !data.ok) return;
          const nd = { scrap: Math.max(0, Number(data.scrap) || 0), levels: (progRef.current && progRef.current.levels) || {} };
          PROG.data = nd; PROG.at = Date.now(); setProg(nd);
          setResult((r) => (r ? { ...r, scrap: Math.max(0, data.got | 0) } : r));
        }, () => {});
      } catch {}
    }
    setTimeout(() => { if (G.current.over) setPhase('done'); }, res.lost ? 600 : 2600);
    if (res.lost) zap('lose', 0.6);
    else if (won) { zap('win', 0.85); showBanner('Victory', 'Your team broke the enemy core', 'gold', 2.6); try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
    else { zap('lose', 0.75); showBanner(meH ? 'Defeat' : 'Game over', meH ? 'Your core fell' : `${TNAME[res.team] || 'A'} team won`, 'red', 2.6); }
  };
  const finishUp = (res) => {
    const g = G.current;
    if (phaseRef.current === 'done' || g.over) return;
    g.over = true; g.overAt = performance.now();
    setCards(null);
    if (g.W && g.W.mode === 'team') { finishTeam(res); return; }
    const W = g.W;
    const wave = res.wave || (W ? W.wave.n : 0);
    const bk = BEST_KEY(uid, W ? W.A.key : arenaRef.current, W ? W.lv : lvRef.current);
    const prev = Number(readPref(bk, '0')) || 0;
    const reached = res.won ? wave : Math.max(0, wave);
    if (reached > prev && inGame()) savePref(bk, reached);
    const list = (res.list || []).filter((r) => Array.isArray(r) && typeof r[0] === 'string');
    setResult({ won: !!res.won, wave, score: res.score || 0, list, prev, best: Math.max(prev, reached), newBest: inGame() && reached > prev, lost: !!res.lost, endless: W ? W.endless : false, scrap: null });
    if (inGame() && progRef.current && !res.lost) {
      const meH = W && W.heroes[kindOf()];
      try {
        supabase.rpc('zchat_siege_award', { p_wave: wave | 0, p_kills: meH ? meH.stats.kills | 0 : 0, p_won: !!res.won }).then(({ data, error }) => {
          if (error || !data || !data.ok) return;
          const nd = { scrap: Math.max(0, Number(data.scrap) || 0), levels: (progRef.current && progRef.current.levels) || {} };
          PROG.data = nd; PROG.at = Date.now(); setProg(nd);
          setResult((r) => (r ? { ...r, scrap: Math.max(0, data.got | 0) } : r));
        }, () => {});
      } catch {}
    }
    setTimeout(() => { if (G.current.over) setPhase('done'); }, res.won ? 1400 : g.kill && performance.now() - g.kill.at < 2400 ? 2600 : 1300);
    if (res.won) { zap('win', 0.85); try { window.dispatchEvent(new CustomEvent('zchat-screen-fx', { detail: 'confetti' })); } catch {} }
    else zap('lose', 0.75);
  };
  const pickCard = (k) => {
    const g = G.current, W = g.W;
    const c = cardsRef.current;
    cardsRef.current = null; setCards(null);
    if (!W || !c || !E.CARDS[k] || !c.list.includes(k)) return;
    g.pend = (g.pend || []).filter((p) => p.id !== c.id);
    const h = W.heroes[kindOf()];
    if (h && E.applyCard(h, k)) { kitTap(); zap('coin', 0.6); pushNote(`${E.CARDS[k].name}: ${cardLine(k).toLowerCase()}`, 'join'); }
    if (g.pend.length) setTimeout(() => showPick(false), 240);
  };
  const tryPick = (k) => { const c = cardsRef.current; if (!c || performance.now() - (c.at || 0) < 380) return; pickCard(k); };
  pickRef.current = tryPick;
  const laterCard = () => {
    const g = G.current;
    if (!cardsRef.current) return;
    cardsRef.current = null; setCards(null);
    kitTap();
    for (const p of g.pend || []) p.seen = true;
    if (!g.laterTold) { g.laterTold = true; pushNote('Saved. Tap New power at the top when you want it', 'info'); }
  };
  const killerName = (by) => {
    const W = G.current.W;
    if (typeof by === 'number') { const b = W && W.robots.find((r) => r.id === by); return b ? E.ROBOTS[b.type].name : 'an alien'; }
    if (by === 'boom') return E.ROBOTS.bomber.name;
    if (by === 'laser' || by === 'stomp' || by === 'mis') return E.ROBOTS.boss.name;
    return 'an alien';
  };
  const statList = (W) => W.order.map((k) => { const h = W.heroes[k]; return [k, h.stats.kills, Math.round(h.stats.dmg), h.stats.rev, Math.round(h.stats.heal), h.key]; });
  const hostOver = () => {
    const g = G.current, W = g.W;
    if (!W || g.over) return;
    if (W.mode === 'team') {
      const win = W.over && W.over.team === 1 ? 1 : 0;
      const rows = teamRows(W);
      if (!solo) relay.send('over', { r: g.rid, tw: win, sc: W.tm.score, tr: rows.map((r) => [r.id, r.tm, r.key, r.tl, r.k, r.d, r.a, r.dmg]) });
      finishUp({ team: win, sc: W.tm.score, rows });
      return;
    }
    const res = { won: !!W.over.won, wave: W.wave.n, score: W.score, list: statList(W) };
    if (!solo) relay.send('over', { r: g.rid, w: res.won ? 1 : 0, n: res.wave, sc: res.score, l: res.list });
    finishUp(res);
  };

  const tryFire = (h, f) => {
    const g = G.current, W = g.W;
    if (!W || !h || h.st !== 0) return false;
    const H = E.HEROES[h.key];
    const sup = f.kind === 'sup';
    if (sup ? h.sup < 1 : !E.canFire(h)) return false;
    const S = sup ? H.sup : H.atk;
    const lob = S.k === 'lob' || S.k === 'mega' || S.k === 'barrage';
    let a = f.a, dist = f.dist;
    if (f.auto || a == null) {
      const rng = S.k === 'turret' ? 9 : S.k === 'slam' || S.k === 'freeze' || S.k === 'bloom' ? H.atk.rng : S.rng || S.rad || H.atk.rng;
      const t = E.autoAim(W, h, rng, !lob);
      if (t) {
        const b = W.robots.find((r) => r.id === t.id);
        const tt = lob ? S.flight : t.d / (S.spd || 30);
        const vx = b && b.mv ? Math.sin(b.yaw) * b.mv : 0, vz = b && b.mv ? Math.cos(b.yaw) * b.mv : 0;
        const tx = t.x + vx * tt * 0.7, tz = t.z + vz * tt * 0.7;
        a = Math.atan2(tx - h.x, tz - h.z); dist = Math.hypot(tx - h.x, tz - h.z);
      } else { a = h.yaw; dist = (S.rng || 8) * 0.7; }
    }
    if (lob && f.mag != null && !f.auto) dist = Math.max(1.5, f.mag * S.rng);
    if (S.k === 'turret' && f.mag != null && !f.auto) dist = 1 + f.mag * 3;
    if (S.k === 'blink') { if (f.mag != null && !f.auto) dist = Math.max(2, f.mag * S.rng); else if (f.auto || f.a == null) dist = clamp((dist || S.rng) + 1.2, 2, S.rng); }
    const seed = (Math.random() * 1e9) | 0;
    const x0 = h.x, z0 = h.z;
    E.fireHero(W, h, f.kind, a, dist, seed);
    if (!solo) relay.send('f', { r: g.rid, h: h.id, c: sup ? 's' : 'a', a: +a.toFixed(3), d: dist == null ? null : +dist.toFixed(2), s: seed, x: +x0.toFixed(2), z: +z0.toFixed(2), k: modsPack(h) });
    if (h.id === kindOf() && sup) { try { navigator.vibrate && navigator.vibrate(18); } catch {} }
    return true;
  };
  const tryGadget = (h, f) => {
    const g = G.current, W = g.W;
    if (!W || !h || !E.canGadget(h)) return false;
    const GD = E.HEROES[h.key].gad;
    let a = f && f.a != null ? f.a : null, dist = f && f.dist != null ? f.dist : null;
    if (a == null) {
      if (GD.k === 'jet') { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; dist = GD.len; }
      else { const t = E.autoAim(W, h, GD.k === 'charge' ? GD.len + 1 : 10, true); a = t ? t.a : h.yaw; dist = t ? t.d : null; }
    }
    if (f && f.mag != null && GD.k === 'jet') dist = Math.max(2, f.mag * GD.len);
    const r = E.useGadget(W, h, a, dist);
    if (!solo) relay.send('f', { r: g.rid, h: h.id, c: 'g', a: +a.toFixed(3), d: dist == null ? null : +dist.toFixed(2), x: +h.x.toFixed(2), z: +h.z.toFixed(2), k: modsPack(h), tx: r ? +r.x1.toFixed(2) : undefined, tz: r ? +r.z1.toFixed(2) : undefined });
    if (h.id === kindOf()) { try { navigator.vibrate && navigator.vibrate(12); } catch {} }
    return true;
  };
  const trySkill = (h, a0) => {
    const g = G.current, W = g.W;
    if (!W || W.mode !== 'team' || !h || h.st !== 0) return false;
    let a = a0;
    if (a == null) { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; }
    const r = T.useSkill(W, h, a);
    if (!r) return false;
    if (!solo) relay.send('f', { r: g.rid, h: h.id, c: 'k', sk: r.sk, a: r.a, x: r.x, z: r.z, x1: r.x1, z1: r.z1, t: r.t == null ? undefined : r.t });
    return true;
  };
  const tryRecall = (h) => {
    const W = G.current.W;
    if (!W || W.mode !== 'team' || !h) return false;
    return T.startRecall(W, h);
  };
  const tryDash = (h, a0) => {
    const g = G.current, W = g.W;
    if (!W || !h || !E.canDash(h)) return false;
    let a = a0;
    if (a == null) { const mv = Math.hypot(h.vx, h.vz); a = mv > 0.5 ? Math.atan2(h.vx, h.vz) : h.yaw; }
    E.startDash(W, h, a);
    if (!solo) relay.send('f', { r: g.rid, h: h.id, c: 'd', a: +a.toFixed(3), x: +h.x.toFixed(2), z: +h.z.toFixed(2) });
    return true;
  };
  const heroPack = (W, h) => {
    const mv = Math.hypot(h.vx, h.vz) > 0.4 ? 1 : 0;
    const f = mv | (h.hid ? 2 : 0) | (W.t - h.seen < 1.2 ? 4 : 0) | (h.pw > 0 ? 8 : 0) | (h.ocT > 0 ? 16 : 0) | (h.shield > 0 ? 32 : 0) | (h.rfT > 0 ? 64 : 0) | (h.spT > 0 ? 128 : 0) | (h.dashT > 0 ? 256 : 0) | (h.jump ? 512 : 0);
    const o = [Math.round(h.x * 20), Math.round(h.z * 20), Math.round(h.yaw * 100), Math.round(h.hp), h.st, f, Math.round(h.sup * 100), Math.round(h.rv * 100), Math.round(h.downT * 10), Math.round(h.max), Math.round((h.shield || 0) / 10), h.lv | 0];
    if (W.mode === 'team') {
      const f2 = ((h.clkT || 0) > 0 ? 1 : 0) | ((h.recT || 0) > 0 ? 2 : 0) | ((h.stunT || 0) > 0 ? 4 : 0) | (h.buffs && h.buffs.fury ? 8 : 0) | (h.buffs && h.buffs.flow ? 16 : 0) | ((h.sprT || 0) > 0 ? 32 : 0) | ((h.spawnT || 0) > 0 ? 64 : 0);
      o.push(h.tl | 0, Math.round((h.respT || 0) * 10), f2, Math.round(((h.stats && h.stats.hd) || 0) / 10));
    }
    return o;
  };
  const applyPack = (W, h, p, now, at) => {
    if (!Array.isArray(p) || p.length < 9) return;
    const x = num(p[0]) / 20, z = num(p[1]) / 20;
    if (!Number.isFinite(x) || !Number.isFinite(z)) return;
    h.nx = clamp(x, 0, W.A.wx); h.nz = clamp(z, 0, W.A.wz); h.nyaw = num(p[2]) / 100;
    netPush(h.nb || (h.nb = mkNet()), at, [h.nx, h.nz, h.nyaw]);
    if (h.x == null || h.netAt == null) { h.x = h.nx; h.z = h.nz; h.yaw = h.nyaw; }
    if (p.length >= 12) { h.max = clamp(num(p[9], h.max), 1, 5000000); h.shield = clamp(num(p[10]) * 10, 0, 5000000); h.lv = clamp(p[11] | 0, 1, E.MAX_LEVEL); }
    const hp = clamp(num(p[3]), 0, h.max);
    if (hp < h.hp - 1 && h.st === 0) h.flash = 0.12;
    h.hp = hp;
    const st = clamp(p[4] | 0, 0, 2);
    if (st !== h.st) {
      if (st === 1 && h.st === 0) W.ev.push({ k: 'down', id: h.id, x: h.x, z: h.z, remote: true });
      else if (st === 2 && h.st === 0 && W.mode === 'team') W.ev.push({ k: 'down', id: h.id, x: h.x, z: h.z, remote: true, team: true });
      else if (st === 0 && h.st !== 0) { if (W.mode === 'team') { h.x = x; h.z = z; h.nb = null; h.nv = null; } W.ev.push({ k: 'revive', id: h.id, x, z, remote: true, team: W.mode === 'team' }); }
      h.st = st;
    }
    if (p.length >= 16 && W.mode === 'team') {
      h.tl = clamp(p[12] | 0, 1, T.TL_MAX); h.respT = clamp(num(p[13]) / 10, 0, 60);
      const f2 = p[14] | 0;
      h.clkT = f2 & 1 ? 0.35 : 0; h.recV = !!(f2 & 2); h.stunV = !!(f2 & 4); h.sprV = !!(f2 & 32); h.spawnV = !!(f2 & 64);
      const bf = h.buffs || (h.buffs = {});
      bf.fury = f2 & 8 ? 1 : 0; bf.flow = f2 & 16 ? 1 : 0;
      if (h.stats) h.stats.hd = Math.max(0, num(p[15]) * 10);
    }
    const f = p[5] | 0;
    h.mvF = f & 1; h.hid = !!(f & 2); if (f & 4) h.seen = W.t; h.pw = f & 8 ? 1 : 0;
    h.ocT = f & 16 ? Math.max(h.ocT, 0.3) : 0; h.rfT = f & 64 ? Math.max(h.rfT, 0.3) : 0; h.spT = f & 128 ? Math.max(h.spT, 0.3) : 0; h.dashNet = !!(f & 256); if (!(f & 32)) h.shield = 0;
    h.sup = clamp(num(p[6]) / 100, 0, 1); h.rv = clamp(num(p[7]) / 100, 0, 1); h.downT = clamp(num(p[8]) / 10, 0, E.DOWN_T);
    h.netAt = now; h.gone = false;
  };

  useEffect(() => {
    if (solo || !room) return undefined;
    const cleanCfg = (m) => {
      if (!m || !Array.isArray(m.ids) || typeof m.rid !== 'string') return null;
      const ids = m.ids.filter((k) => typeof k === 'string').slice(0, E.SQUAD_MAX);
      const heroes = {};
      for (const k of ids) heroes[k] = validHero(m.heroes && m.heroes[k]);
      const bots = Array.isArray(m.bots) ? m.bots.filter((b) => b && typeof b.id === 'string' && ids.includes(b.id)).map((b) => ({ id: b.id, n: String(b.n || 'Bot').slice(0, 16) })) : [];
      const cols = {};
      for (const k of ids) cols[k] = clamp(Number(m.cols && m.cols[k]) | 0, 0, 3);
      const out = { rid: m.rid, ids, heroes, cols, bots, arena: validArena(m.arena), lv: validLv(m.lv), en: m.en ? 1 : 0, seed: num(m.seed, 1) | 0 };
      if (m.md === 'team') {
        out.md = 'team'; out.arena = 'rift'; out.lv = 'normal'; out.en = 0; out.ts = clamp(m.ts | 0, 1, 5); out.tms = {}; out.sks = {};
        for (const k of ids) { out.tms[k] = m.tms && m.tms[k] === 1 ? 1 : 0; out.sks[k] = m.sks && T.SKILLS[m.sks[k]] ? m.sks[k] : 'shock'; }
        if (m.tls && typeof m.tls === 'object') { out.tls = {}; for (const k of ids) out.tls[k] = clamp(m.tls[k] | 0, 1, T.TL_MAX); }
      }
      return out;
    };
    const onTk = (m) => {
      const g = G.current, W = g.W;
      if (!W || W.mode !== 'team' || !m || m.r !== g.rid || typeof m.v !== 'string' || !W.heroes[m.v]) return;
      if (W.local.has(m.v)) return;
      if (m.from !== m.v && !(W.heroes[m.v].bot && m.from === hostId)) return;
      takedown(W, { v: m.v, k: typeof m.k === 'string' && W.heroes[m.k] ? m.k : null, by: typeof m.by === 'number' || typeof m.by === 'string' ? m.by : null, as: Array.isArray(m.as) ? m.as.filter((x) => typeof x === 'string' && W.heroes[x]).slice(0, 4) : [] });
    };
    const offs = [
      relay.on('*', (m) => { if (m.m) { metaRef.current[m.from] = m.m; setNames((p) => (p[m.from] === m.m.n ? p : { ...p, [m.from]: m.m.n })); if (m.m.h && E.HEROES[m.m.h]) setHeroOf((p) => (p[m.from] ? p : { ...p, [m.from]: m.m.h })); } if (!joinOrder.current.includes(m.from)) joinOrder.current.push(m.from); }),
      relay.on('roster', (m) => {
        if (isHost || !Array.isArray(m.ids)) return;
        setRoster(m.ids.filter((k) => typeof k === 'string').slice(0, E.SQUAD_MAX));
        if (m.nm && typeof m.nm === 'object') setNames((p) => ({ ...p, ...m.nm }));
        if (m.hk && typeof m.hk === 'object') setHeroOf((p) => ({ ...p, ...Object.fromEntries(Object.entries(m.hk).filter(([, v]) => E.HEROES[v])) }));
        if (typeof m.ar === 'string' && E.ARENAS[m.ar] && phaseRef.current === 'menu') setArena(m.ar);
        if (typeof m.lv === 'string' && E.LEVELS[m.lv]) setLv(m.lv);
        if (typeof m.bn === 'number') setBotN(snapBots(clamp(m.bn | 0, 0, 9)));
        if (typeof m.en === 'number') setEndless(!!m.en);
        if (m.md === 'team' || m.md === 'waves') { setMode(m.md); if (m.md === 'team') loadRift().then((d) => { if (d) setRiftOk(true); }); }
        if (typeof m.ts === 'number') setTs(clamp(m.ts | 0, 1, 5));
        if (m.tm && typeof m.tm === 'object') setSideOf((p) => { const n = {}; for (const [k, v] of Object.entries(m.tm)) n[k] = v === 1 ? 1 : 0; return JSON.stringify(n) === JSON.stringify(p) ? p : n; });
        const cfg = cleanCfg(m.cfg);
        if (cfg && phaseRef.current === 'menu' && !G.current.W) beginGame(cfg);
      }),
      relay.on('go', (m) => { if (isHost) return; const cfg = cleanCfg(m); if (cfg) beginGame(cfg); }),
      relay.on('menu', () => { if (!isHost) toMenu(true); }),
      relay.on('hero', (m) => { if (m && E.HEROES[m.k]) setHeroOf((p) => ({ ...p, [m.from]: m.k })); if (m && typeof m.c === 'number') setColOf((p) => ({ ...p, [m.from]: clamp(m.c | 0, 0, 3) })); if (m && T.SKILLS[m.sk]) setSkOf((p) => ({ ...p, [m.from]: m.sk })); }),
      relay.on('side', (m) => { if (!isHost || !m || phaseRef.current !== 'menu') return; wantSide.current[m.from] = m.s === 1 ? 1 : 0; setSideOf(sidesFor(rosterRef.current)); }),
      relay.on('tk', onTk),
      relay.on('swap', (m) => {
        const g = G.current, W = g.W;
        if (isHost || !W || m.r !== g.rid || typeof m.id !== 'string' || W.heroes[m.id] || !E.HEROES[m.k]) return;
        const x = num(m.x), z = num(m.z);
        if (typeof m.b === 'string' && W.heroes[m.b]) { W.order = W.order.map((k) => (k === m.b ? m.id : k)); g.ids = g.ids.map((k) => (k === m.b ? m.id : k)); g.bots = g.bots.filter((k) => k !== m.b); }
        else { W.order.push(m.id); g.ids.push(m.id); }
        const h = E.mkHero(m.id, m.k, x, z, false, 1); h.hc = clamp(m.c | 0, 0, 3);
        if (W.mode === 'team') { T.initHero(W, h, m.tm === 1 ? 1 : 0, T.SKILLS[m.sk] ? m.sk : 'shock', 0); h.x = x; h.z = z; h.tl = clamp(m.tl | 0, 1, T.TL_MAX); }
        W.heroes[m.id] = h;
      }),
      relay.on('hs', (m) => {
        const g = G.current, W = g.W;
        if (!W || !m || m.r !== g.rid || m.from === kindOf()) return;
        const h = W.heroes[m.from];
        if (!h || h.bot) return;
        if (typeof m.q === 'number') { if (m.q <= (h.netQ == null ? -1 : h.netQ)) return; h.netQ = m.q; }
        applyPack(W, h, m.p, performance.now(), m.at);
      }),
      relay.on('f', (m) => {
        const g = G.current, W = g.W;
        if (!W || !m || m.r !== g.rid) return;
        const hid = typeof m.h === 'string' ? m.h : m.from;
        const h = W.heroes[hid];
        if (!h || W.local.has(hid)) return;
        if (hid !== m.from && !(g.bots.includes(hid) && m.from === hostId)) return;
        const x = num(m.x, h.x), z = num(m.z, h.z);
        const ox = h.x, oz = h.z;
        if (Math.hypot(x - h.x, z - h.z) < 4) { h.x = x; h.z = z; }
        const a = num(m.a, h.yaw);
        if (m.c === 'd') { W.ev.push({ k: 'dash', id: h.id, x: h.x, z: h.z, a }); h.x = ox; h.z = oz; return; }
        if (m.c === 'k') {
          const sk = String(m.sk || '');
          if (W.mode === 'team' && T.SKILLS[sk]) { h.sk = sk; T.applySkill(W, h, { sk, a, x, z, x1: m.x1 == null ? undefined : num(m.x1), z1: m.z1 == null ? undefined : num(m.z1), t: m.t == null ? null : m.t | 0 }, false); }
          h.x = ox; h.z = oz; return;
        }
        modsTake(h, m.k);
        if (m.c === 'g') { if (h.gad <= 0) h.gad = 1; h.gadCD = 0; E.useGadget(W, h, a, m.d == null ? null : clamp(num(m.d), 0, 30), m.tx == null ? null : num(m.tx), m.tz == null ? null : num(m.tz)); }
        else E.fireHero(W, h, m.c === 's' ? 'sup' : 'atk', a, m.d == null ? null : clamp(num(m.d), 0, 30), num(m.s, 1) | 0);
        h.x = ox; h.z = oz;
      }),
      relay.on('es', (m) => {
        const g = G.current, W = g.W;
        if (isHost || !W || !m || m.r !== g.rid) return;
        if (typeof m.q === 'number') { if (m.q <= g.lastSeq) return; g.lastSeq = m.q; }
        const now = performance.now();
        g.lastSnapAt = now;
        if (Array.isArray(m.a)) E.applyRobotSnap(W, m.a, now, m.at);
        if (Array.isArray(m.w) && m.w.length >= 4) { W.wave.n = m.w[0] | 0; W.wave.st = ST_NAME[m.w[1] | 0] || 'fight'; W.wave.t = num(m.w[2]) / 10; W.wave.left = m.w[3] | 0; }
        if (typeof m.sc === 'number') W.score = m.sc;
        if (m.tq && W.mode === 'team') T.applySnapTeam(W, m.tq);
        if (Array.isArray(m.d)) W.drops = m.d.filter((d) => Array.isArray(d) && !g.claimed.has(d[0])).map((d) => ({ id: d[0] | 0, k: E.DROP_KEYS[d[1] | 0] || 'hp', x: num(d[2]) / 10, z: num(d[3]) / 10, life: num(d[4], 140) / 10 }));
        if (Array.isArray(m.b)) for (const b of m.b) { if (!Array.isArray(b) || typeof b[0] !== 'string') continue; const h = W.heroes[b[0]]; if (h && h.bot) applyPack(W, h, b.slice(1), now, m.at); }
      }),
      relay.on('re', (m) => {
        const g = G.current, W = g.W;
        if (isHost || !W || !m || m.r !== g.rid || !Array.isArray(m.e)) return;
        for (const e of m.e.slice(0, 200)) {
          if (Array.isArray(e) && e[0] === 'pg') { const h = W.heroes[e[2]]; if (h && W.local.has(h.id)) E.takeDrop(W, h, { k: E.DROP_KEYS[e[3] | 0] || 'hp', x: h.x, z: h.z }); continue; }
          E.applyNetEvent(W, e);
        }
      }),
      relay.on('ev', (m) => {
        const g = G.current, W = g.W;
        if (!isHost || !W || !m || m.r !== g.rid) return;
        if (m.k === 'pk') {
          const i = W.drops.findIndex((d) => d.id === (m.i | 0));
          const h = W.heroes[m.from];
          if (i < 0 || !h || h.st !== 0 || Math.hypot(W.drops[i].x - h.x, W.drops[i].z - h.z) > 3.5) return;
          const d = W.drops.splice(i, 1)[0];
          W.net.push(['pg', d.id, m.from, E.DROP_KEYS.indexOf(d.k)]);
          W.ev.push({ k: 'pick', id: m.from, kind: d.k, x: d.x, z: d.z, remote: true });
        } else if (m.k === 'rv' && Array.isArray(m.by)) {
          for (const k of m.by.slice(0, E.SQUAD_MAX)) { const h = W.heroes[k]; if (h) h.stats.rev += 1; }
        }
      }),
      relay.on('over', (m) => {
        const g = G.current;
        if (isHost || !m || m.r !== g.rid) return;
        if (m.tw === 0 || m.tw === 1) {
          const rows = Array.isArray(m.tr) ? m.tr.filter((r) => Array.isArray(r) && typeof r[0] === 'string').slice(0, E.SQUAD_MAX).map((r) => ({ id: r[0], tm: r[1] === 1 ? 1 : 0, key: validHero(r[2]), tl: clamp(r[3] | 0, 1, T.TL_MAX), k: r[4] | 0, d: r[5] | 0, a: r[6] | 0, dmg: Math.max(0, r[7] | 0) })) : [];
          finishUp({ team: m.tw, sc: Array.isArray(m.sc) ? [m.sc[0] | 0, m.sc[1] | 0] : null, rows });
          return;
        }
        finishUp({ won: !!m.w, wave: m.n | 0, score: m.sc | 0, list: Array.isArray(m.l) ? m.l.slice(0, E.SQUAD_MAX) : [] });
      }),
      relay.on('emo', (m) => { const e = String(m.e || ''); if (!EMOTES.includes(e)) return; setBubbles((p) => ({ ...p, [m.from]: { e, at: Date.now() } })); zap('pop', 0.45); }),
      relay.on('bye', (m) => { const n = namesRef.current[m.from] || 'A friend'; if (rosterRef.current.includes(m.from) && !rosterSeen.current.bye.has(m.from)) { rosterSeen.current.bye.add(m.from); pushNote(`${n} left the game`, 'leave'); } }),
    ];
    return () => offs.forEach((f) => f && f());
  }, [relay.on]);

  useEffect(() => {
    if (solo || !room || !isHost) return undefined;
    const tick = () => {
      const present = relay.peers.filter((p) => !(metaRef.current[p] && metaRef.current[p].w));
      const cur = rosterRef.current;
      const playing = phaseRef.current !== 'menu';
      const next = playing ? cur.filter((p) => p === myId || present.includes(p)) : freshRoster();
      const g1 = G.current, W1 = g1.W;
      if (playing && W1 && !g1.over && phaseRef.current === 'play') {
        for (const p of present) {
          if (next.includes(p) || g1.ids.includes(p) || next.length >= E.SQUAD_MAX) continue;
          const key = heroFor(p), c = clamp(Number(colOfRef.current[p] != null ? colOfRef.current[p] : metaRef.current[p] && metaRef.current[p].hc) | 0, 0, 3);
          const team = W1.mode === 'team';
          const bot = g1.bots.length ? g1.bots[g1.bots.length - 1] : null;
          if (team && !(bot && W1.heroes[bot])) continue;
          const old = bot ? W1.heroes[bot] : null;
          let x, z;
          if (bot && W1.heroes[bot]) { x = W1.heroes[bot].x; z = W1.heroes[bot].z; W1.order = W1.order.map((k) => (k === bot ? p : k)); g1.ids = g1.ids.map((k) => (k === bot ? p : k)); g1.bots = g1.bots.filter((k) => k !== bot); W1.local.delete(bot); }
          else { const sp = E.heroSpawn(W1.A, W1.order.length); x = sp.x; z = sp.z; W1.order.push(p); g1.ids.push(p); }
          const h = E.mkHero(p, key, x, z, false, 1); h.hc = c;
          const sk0 = metaRef.current[p] && T.SKILLS[metaRef.current[p].sk] ? metaRef.current[p].sk : 'shock';
          if (team && old) { T.initHero(W1, h, old.tm, sk0, 0); h.x = x; h.z = z; h.tl = old.tl || 1; h.st = old.st; h.respT = old.respT || 0; }
          W1.heroes[p] = h;
          relay.send('swap', { r: g1.rid, b: bot, id: p, k: key, c, x: +x.toFixed(2), z: +z.toFixed(2), tm: team && old ? old.tm : undefined, sk: team ? sk0 : undefined, tl: team && old ? old.tl || 1 : undefined });
          next.push(p);
          pushNote(`${(metaRef.current[p] && metaRef.current[p].n) || 'A friend'} joined${bot ? ' in place of a bot' : ''}`, 'join');
        }
      }
      const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
      setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
      if (next.join('|') !== cur.join('|')) setRoster(next);
      const nm = {}, hk = {};
      next.concat(w).forEach((p) => { nm[p] = p === myId ? myFirst : (metaRef.current[p] && metaRef.current[p].n) || 'Friend'; });
      next.forEach((p) => { hk[p] = heroFor(p); });
      const g = G.current, W = g.W;
      const cfg = playing && W && !g.over ? { rid: g.rid, ids: g.ids, heroes: Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].key : 'blaze'])), bots: g.bots.map((k) => ({ id: k, n: g.botMeta[k] ? g.botMeta[k].n : 'Bot' })), arena: W.A.key, lv: W.lv, en: W.endless ? 1 : 0, seed: W.seed } : null;
      const sides = sidesFor(next);
      if (!playing && JSON.stringify(sides) !== JSON.stringify(sideOfRef.current)) setSideOf(sides);
      if (cfg && W && W.mode === 'team') { cfg.md = 'team'; cfg.ts = W.tm ? W.tm.size : 3; cfg.tms = Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].tm : 0])); cfg.sks = Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].sk : 'shock'])); cfg.cols = Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].hc | 0 : 0])); cfg.tls = Object.fromEntries(g.ids.map((k) => [k, W.heroes[k] ? W.heroes[k].tl || 1 : 1])); }
      relay.send('roster', { ids: next, nm, hk, ar: arenaRef.current, lv: lvRef.current, bn: botNRef.current, en: endRef.current ? 1 : 0, md: modeRef.current, ts: tsRef.current, tm: playing ? sideOfRef.current : sides, cfg });
    };
    tick();
    const iv = setInterval(tick, 1500);
    return () => clearInterval(iv);
  }, [relay.peers, allowWatch, arena, lv, botN, endless, heroKey, mode, ts, sideOf]);
  useEffect(() => {
    if (solo || !room || isHost) return undefined;
    const w = relay.peers.filter((p) => metaRef.current[p] && metaRef.current[p].w);
    setWatchers((prev) => (prev.join('|') === w.join('|') ? prev : w));
    return undefined;
  }, [relay.peers]);
  useEffect(() => {
    if (solo) return;
    const R1 = rosterSeen.current;
    const prev = R1.list;
    R1.list = roster;
    if (!prev || Date.now() - R1.at < 2500) return;
    const me0 = kindOf();
    for (const k of roster) if (!prev.includes(k) && k !== me0) { R1.bye.delete(k); pushNote(`${namesRef.current[k] || 'A friend'} joined`, 'join'); }
    for (const k of prev) if (!roster.includes(k) && k !== me0 && !R1.bye.has(k)) { R1.bye.add(k); pushNote(`${namesRef.current[k] || 'A friend'} left the game`, 'leave'); }
  }, [roster]);
  const watchList = useMemo(() => watchers.map((id) => ({ id, n: names[id] || 'Friend' })), [watchers, names]);
  useWatchNotices(watchList, pushNote, !solo && !watch);

  const takenBy = (k) => roster.filter((p) => p !== kindOf() && validHero(heroOf[p] || (metaRef.current[p] && metaRef.current[p].h)) === k).length;
  const pickHero = (k) => { if (!E.HEROES[k]) return; if (!solo && takenBy(k) >= E.heroCap()) { kitTap(); pushNote(`${E.HEROES[k].name} is taken by ${E.heroCap()} players`, 'info'); return; } kitTap(); setHeroKey(k); savePref(PREF.hero, k); let c = heroCol; const used = roster.filter((p) => p !== kindOf() && validHero(heroOf[p]) === k).map((p) => colOf[p] | 0); if (used.includes(c)) { c = [0, 1, 2, 3].find((q) => !used.includes(q)) || 0; setHeroCol(c); savePref('zchat-siege-hcol', c); } if (!solo) relay.send('hero', { k, c, sk: skillRef.current }); };
  const cardOk = (h, k) => { const C = E.CARDS[k]; if (!C || (C.hero && C.hero !== h.key)) return false; return !C.max || (h.cards || []).filter((x) => x === k).length < C.max; };
  const addPick = () => { const g = G.current; g.pickId = (g.pickId || 0) + 1; (g.pend || (g.pend = [])).push({ id: g.pickId, list: null, seen: false }); };
  const showPick = (fresh) => {
    const g = G.current, W = g.W;
    const h = W && W.heroes[kindOf()];
    if (!h || g.over || cardsRef.current || !g.pend || !g.pend.length || phaseRef.current !== 'play') return;
    const i = fresh ? g.pend.findIndex((p) => !p.seen) : 0;
    if (i < 0) return;
    const p = g.pend[i];
    p.seen = true;
    const list = (p.list || []).filter((k) => cardOk(h, k));
    for (const k of E.cardChoices(h, Math.random, W.mode === 'team' ? E.TEAM_SKIP_CARDS : null)) if (list.length < 3 && !list.includes(k)) list.push(k);
    if (!list.length) { g.pend.splice(i, 1); return; }
    p.list = list;
    const c = { id: p.id, list, more: g.pend.length - 1, at: performance.now(), snap: cardSnap(h) };
    cardsRef.current = c; setCards(c);
    zap('star', 0.6);
  };
  const pickCol = (c) => { kitTap(); setHeroCol(c); savePref('zchat-siege-hcol', c); if (!solo) relay.send('hero', { k: heroKey, c, sk: skillRef.current }); };
  const pickMode = (k) => { if (!isHost || (k !== 'team' && k !== 'waves')) return; kitTap(); setMode(k); savePref(PREF.mode, k); };
  const pickTs = (n) => { if (!isHost) return; const v = clamp(n | 0, 1, 5); kitTap(); setTs(v); savePref(PREF.ts, v); };
  const pickSkill = (k) => { if (!T.SKILLS[k]) return; setSkill(k); savePref(PREF.sk, k); if (!solo) relay.send('hero', { k: heroKey, c: heroCol, sk: k }); };
  const switchSide = () => {
    kitTap();
    const me0 = kindOf();
    const s1 = sideOfRef.current[me0] === 1 ? 0 : 1;
    if (isHost) { wantSide.current[me0] = s1; setSideOf(sidesFor(solo ? ['me'] : rosterRef.current)); }
    else { relay.send('side', { s: s1 }); setSideOf((p) => ({ ...p, [me0]: s1 })); }
  };
  const pickArena = (k) => { if (!isHost || !E.ARENAS[k]) return; kitTap(); setArena(k); savePref(PREF.arena, k); };
  const pickLv = (k) => { if (!isHost || !E.LEVELS[k]) return; kitTap(); setLv(k); savePref(PREF.lv, k); };
  const pickBots = (v) => { if (!isHost) return; const n = snapBots(clamp(Number(v) | 0, 0, E.SQUAD_MAX - 1)); kitTap(); setBotN(n); savePref(PREF.bots, n); };
  const pickWaves = (v) => { if (!isHost) return; kitTap(); const on = v === 'end'; setEndless(on); savePref(PREF.end, on ? '1' : '0'); };
  const pickGfx = (k) => { kitTap(); setGfx(k); savePref(PREF.gfx, k); const g = G.current; g.budget.tier = k === 'fast' ? 2 : k === 'best' ? 0 : weakPhone() ? 1 : 0; g.budget.n = 0; const st = RR.current; if (st && st.arena) { st.arena.env.shadows = g.budget.tier < 2; st.arena.env.detail = g.budget.tier < 2 ? 1 : 0; } };

  useEffect(() => {
    const kd = (e) => {
      if (phaseRef.current !== 'play') return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      const k = String(e.key || '').toLowerCase();
      if ((k === '1' || k === '2' || k === '3') && cardsRef.current) { const pk = cardsRef.current.list[Number(k) - 1]; if (pk && pickRef.current) { e.preventDefault(); pickRef.current(pk); } return; }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { keys.current.add(k); e.preventDefault(); }
      else if (k === ' ' || k === 'e') { const g = G.current; const mo = g.mouse; G.current.fireQ.push(mo ? { kind: 'sup', a: mo.a, dist: mo.d } : { kind: 'sup', auto: true }); e.preventDefault(); }
      else if (k === 'f' || k === 'j') { G.current.fireQ.push({ kind: 'atk', auto: true }); }
      else if (k === 'shift' || k === 'l') { G.current.dashQ.push(null); e.preventDefault(); }
      else if (k === 'q' || k === 'k') { const mo = G.current.mouse; G.current.gadQ.push(mo ? { a: mo.a, dist: mo.d } : null); e.preventDefault(); }
      else if (k === 'r' && G.current.W && G.current.W.mode === 'team') { const mo = G.current.mouse; G.current.skQ.push(mo ? mo.a : null); e.preventDefault(); }
      else if (k === 'b' && G.current.W && G.current.W.mode === 'team') { G.current.recQ.push(1); e.preventDefault(); }
      else if (k === 'tab' && G.current.W && G.current.W.mode === 'team') { setBoard((v) => !v); e.preventDefault(); }
    };
    const ku = (e) => keys.current.delete(e.key.toLowerCase());
    const blur = () => keys.current.clear();
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); };
  }, []);

  const toWorld = (sx, sy) => {
    const st = RR.current, g = G.current, wrap = wrapRef.current;
    if (!st || !g.VP || !wrap) return null;
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const inv = g.invVP || (g.invVP = m4.inv(g.VP));
    const nx = (sx / cw) * 2 - 1, ny = 1 - (sy / ch) * 2;
    const p0 = m4.apply(inv, nx, ny, -1), p1 = m4.apply(inv, nx, ny, 1);
    const dy = p0[1] - p1[1];
    if (Math.abs(dy) < 1e-6) return null;
    const t = p0[1] / dy;
    return { x: p0[0] + (p1[0] - p0[0]) * t, z: p0[2] + (p1[2] - p0[2]) * t };
  };
  const mouseAim = (e) => {
    const g = G.current, W = g.W;
    if (!W || !wrapRef.current) return;
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    const q = toWorld(p.x, p.y);
    const h = W.heroes[kindOf()];
    if (!q || !h) { g.mouse = null; return; }
    g.mouse = { x: q.x, z: q.z, a: Math.atan2(q.x - h.x, q.z - h.z), d: Math.hypot(q.x - h.x, q.z - h.z) };
  };
  const wrapDown = (e) => {
    if (e.pointerType === 'mouse') {
      if (phaseRef.current !== 'play' || sheetOpen.current) return;
      mouseAim(e);
      const mo = G.current.mouse;
      if (mo) G.current.fireQ.push({ kind: e.button === 2 ? 'sup' : 'atk', a: mo.a, dist: mo.d, mag: null });
      return;
    }
    J.handlers.onPointerDown(e);
  };
  const wrapMove = (e) => { if (e.pointerType === 'mouse') { mouseAim(e); return; } J.handlers.onPointerMove(e); };

  const aimDown = (kind) => (e) => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    if (phaseRef.current !== 'play' || sheetOpen.current) return;
    Sfx.init();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    G.current.aim = { on: true, kind, id: e.pointerId, ox: p.x, oy: p.y, dx: 0, dy: 0, eng: false, a: 0, mag: 0 };
    setAimUi(kind);
  };
  const aimMove = (e) => {
    const A = G.current.aim;
    if (!A.on || A.id !== e.pointerId) return;
    const p = stagePoint(wrapRef.current, e, sideRef.current);
    A.dx = p.x - A.ox; A.dy = p.y - A.oy;
    const L = Math.hypot(A.dx, A.dy);
    const R2 = 58 * look.size;
    if (L > 14) A.eng = true;
    A.mag = clamp((L - 10) / R2, 0, 1);
    if (L > 4) A.a = Math.atan2(A.dx, A.dy) + (G.current.flip ? Math.PI : 0);
    const knob = A.kind === 'sup' ? supKnob.current : atkKnob.current;
    if (knob) { const k = L > R2 ? R2 / L : 1; knob.style.transform = `translate(${A.dx * k * 0.62}px,${A.dy * k * 0.62}px)`; }
  };
  const aimUp = (e) => {
    const g = G.current, A = g.aim;
    if (!A.on || A.id !== e.pointerId) return;
    const L = Math.hypot(A.dx, A.dy);
    const knob = A.kind === 'sup' ? supKnob.current : atkKnob.current;
    if (knob) knob.style.transform = 'translate(0px,0px)';
    g.aim = { on: false };
    setAimUi(null);
    if (e.type === 'pointercancel' || e.type === 'lostpointercapture') { if (!A.eng) return; }
    if (A.eng && L < 12) return;
    if (A.eng) g.fireQ.push({ kind: A.kind, a: A.a, mag: A.mag });
    else g.fireQ.push({ kind: A.kind, auto: true });
  };

  if (typeof window !== 'undefined' && window.__zfake) window.__zsiege = { W: () => G.current.W, g: () => G.current, fire: (kind, a, dist) => G.current.fireQ.push(a == null ? { kind, auto: true } : { kind, a, dist }), move: (x, z) => { G.current.keyMove = [x, z]; }, god: (on) => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) h.god = on !== false; }, wave: (n) => { const W = G.current.W; if (W && isHost) { W.robots.length = 0; W.wave.st = 'break'; W.wave.t = 0.1; W.wave.n = Math.max(0, n - 1); } }, kill: () => { const W = G.current.W; if (W && isHost) for (const b of W.robots) E.hurtRobot(W, b, 1e6, kindOf(), 0, 1, {}); }, start: () => startGame(), sup: () => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) h.sup = 1; }, hurt: (d, by) => { const W = G.current.W; const h = W && W.heroes[kindOf()]; if (h) E.hurtHero(W, h, d || 500, by == null ? 'test' : by); }, gad: (a, dist) => G.current.gadQ.push(a == null ? null : { a, dist }), dash: (a) => G.current.dashQ.push(a == null ? null : a), cards: () => cardsRef.current, pick: (k) => pickCard(k), later: () => laterCard(), pend: () => G.current.pend, me: () => { const W = G.current.W; return W && W.heroes[kindOf()]; }, E: () => E };

  const feedAdd = (it) => { const g = G.current; g.feedId = (g.feedId || 0) + 1; const e = { ...it, id: g.feedId, at: Date.now() }; setTfeed((p) => [...p.filter((q) => Date.now() - q.at < 6500), e].slice(-4)); };
  const causeOf = (W, by) => {
    if (typeof by === 'number') { const b = W.robots.find((r) => r.id === by); const t = b ? b.type : null; return t === 'tow' ? 'a tower' : t === 'gua' ? 'the guardian' : t === 'shp' ? 'the Hive Ship' : t === 'mel' || t === 'rng' || t === 'sie' ? 'the rovers' : 'an alien'; }
    if (by === 'fount') return 'the enemy base';
    if (by === 'laser' || by === 'stomp' || by === 'mis') return 'the Hive Ship';
    return 'the enemy';
  };
  const takedown = (W, info) => {
    const r = T.applyKill(W, info);
    if (!r) return;
    const myK = kindOf();
    const me = W.heroes[myK], v = W.heroes[r.v];
    if (!v) return;
    const myTm = me ? me.tm : 0;
    const nm = (id) => (id === myK ? 'You' : nameOf(id));
    const kt = r.k && W.heroes[r.k] ? W.heroes[r.k].tm : 1 - v.tm;
    const good = kt === myTm;
    const pc = (tm) => TXT_COL[tm === myTm ? 0 : 1];
    if (r.k) feedAdd({ good, parts: [[nm(r.k), pc(kt)], [r.shut ? 'shut down' : 'took down'], [r.v === myK ? 'you' : nm(r.v), pc(v.tm)]] });
    else feedAdd({ good, parts: [[nm(r.v), pc(v.tm)], [`fell to ${causeOf(W, r.by)}`]] });
    if (r.k === myK) { popNum(v.x, v.z, 'Takedown', '#FFE15A', true); zap('combo', 0.6); }
    else if (r.as.includes(myK)) { popNum(v.x, v.z, 'Assist', '#9FD0FF', false); zap('coin', 0.45); }
    const tone = good ? 'gold' : 'red';
    if (r.ace) showBanner('Team wipe', good ? 'The whole enemy team is down' : 'Your whole team is down', tone, 2.4);
    else if (r.multi >= 3) showBanner(r.multi === 3 ? 'Triple takedown' : r.multi === 4 ? 'Quad takedown' : 'Unstoppable', nm(r.k), tone, 2.2);
    else if (r.first) { showBanner('First takedown', r.k ? nm(r.k) : null, tone, 2.2); zap('alert', 0.45); }
    else if (r.multi === 2 && (r.k === myK || good)) showBanner('Double takedown', nm(r.k), tone, 1.8);
  };
  const handleEvents = (W, now) => {
    const g = G.current;
    const myK = kindOf();
    const team = W.mode === 'team';
    const meT = team ? W.heroes[myK] : null;
    const myTm = meT ? meT.tm : 0;
    for (const e of W.ev) {
      const k = e.k;
      if (team) {
        if (k === 'down' && e.team) {
          const h = W.heroes[e.id];
          if (h && !e.remote && W.local.has(e.id)) {
            const info = T.deathInfo(W, h);
            if (!solo) relay.send('tk', { r: g.rid, v: info.v, k: info.k, by: info.by, as: info.as });
            takedown(W, info);
          }
          if (e.id === myK) {
            zap('pdie', 0.7);
            const kh = typeof e.by === 'string' && W.heroes[e.by] ? W.heroes[e.by] : null;
            const kb = typeof e.by === 'number' ? W.robots.find((r) => r.id === e.by) : null;
            g.kill = { at: performance.now(), by: kb ? kb.id : null, hero: kh ? kh.id : null, x: kh ? kh.x : kb ? kb.x : e.x, z: kh ? kh.z : kb ? kb.z : e.z };
            setKill({ name: kh ? nameOf(kh.id) : causeOf(W, e.by), at: Date.now() });
          }
          blast(e.x, 0.6, e.z, false, 0.7);
          sparks(e.x, 0.8, e.z, 10, 10, 6);
          continue;
        }
        if (k === 'tan') {
          const a = e.a;
          if (a === 'tow' || a === 'gua' || a === 'cor') {
            if (e.x != null) { blast(e.x, 2, e.z, true, a === 'cor' ? 2.4 : 1.7); for (let i = 0; i < 18; i++) { const an = R0(0, 6.283), sp = R0(2, 6); P3({ x: e.x, y: R0(1, 3), z: e.z, vx: Math.cos(an) * sp, vy: R0(3, 7), vz: Math.sin(an) * sp, g: 14, max: R0(0.6, 1.1), s0: R0(0.3, 0.6), s1: 0.1, a0: 1, type: 2 }); } const c = camFoc(); g.shake = Math.max(g.shake, 0.7 * clamp(1 - Math.hypot(e.x - c[0], e.z - c[2]) / 26, 0.15, 1)); zap('bigboom', volAt(e.x, e.z) * 0.9 + 0.2); }
            if (!e.quiet) {
              const ours = e.b === myTm;
              if (a !== 'cor') showBanner(ours ? `Our ${TOW_NAME[a]} fell` : `We broke their ${TOW_NAME[a]}`, a === 'tow' ? `${T.LANE_NAME[e.c] || 'Mid'} lane` : null, ours ? 'red' : 'green', 2.2);
              feedAdd({ good: !ours, parts: [[ours ? 'Enemy team' : 'Your team', TXT_COL[ours ? 1 : 0]], [`broke a ${TOW_NAME[a]}`]] });
            }
          } else if (a === 'ship') { showBanner('The Hive Ship is here', 'Beat it and it fights for your team', 'gold', 2.8); zap('alert', 0.7); }
          else if (a === 'shiptake') { const ours = e.b === myTm; showBanner(ours ? 'We took the Hive Ship' : 'They took the Hive Ship', ours ? 'It pushes the middle lane for us' : 'Guard the middle lane', ours ? 'green' : 'red', 2.6); zap(ours ? 'combo' : 'alert', 0.65); }
          else if (a === 'river') { const ours = e.b === myTm; feedAdd({ good: ours, parts: [[ours ? 'Your team' : 'Enemy team', TXT_COL[ours ? 0 : 1]], ['cleared the river aliens']] }); if (ours) pushNote('River aliens cleared. XP for the whole team', 'join'); }
          else if (a === 'wave' && !g.waveTold) { g.waveTold = 1; showBanner('Rovers are coming', 'They walk every lane', 'blue', 2.2); zap('cp', 0.5); }
          continue;
        }
        if (k === 'lvl') {
          const h = W.heroes[e.id];
          if (h) { P3({ x: h.x, y: 0.1, z: h.z, max: 0.6, s0: 0.8, s1: 3, a0: 0.8, type: 13, flat: 1 }); for (let i = 0; i < 10; i++) { const an = R0(0, 6.283); P3({ x: h.x + Math.cos(an) * 0.6, y: R0(0.2, 1.4), z: h.z + Math.sin(an) * 0.6, vy: R0(1.2, 2.6), max: R0(0.5, 0.9), s0: 0.3, s1: 0.05, a0: 1, type: 7 }); } }
          if (e.id === myK) { popNum(h ? h.x : e.x, h ? h.z : e.z, `Level ${e.lv}`, '#FFE15A', true); zap('star', 0.7); if (e.card) { addPick(); if (!g.cardTold) { g.cardTold = true; pushNote('New power ready. Tap New power to pick it', 'join'); } } }
          else if (isHost && h && h.bot && e.card) { const ch = E.cardChoices(h, Math.random, E.TEAM_SKIP_CARDS); if (ch.length) E.applyCard(h, ch[Math.floor(Math.random() * ch.length)]); }
          continue;
        }
        if (k === 'buff') {
          const B = T.BUFFS[e.b];
          for (let i = 0; i < 14; i++) { const an = R0(0, 6.283); P3({ x: e.x + Math.cos(an) * 0.7, y: R0(0.2, 1.6), z: e.z + Math.sin(an) * 0.7, vy: R0(0.8, 2), max: R0(0.6, 1), s0: 0.35, s1: 0.05, a0: 1, type: e.b === 'fury' ? 1 : 6 }); }
          if (e.id === myK && B) { pushNote(`${B.name}: ${B.text.toLowerCase()}`, 'join'); zap('pick', 0.7); }
          continue;
        }
        if (k === 'portal') {
          if (e.x0 != null) { P3({ x: e.x0, y: 0.1, z: e.z0, max: 0.5, s0: 0.6, s1: 2.6, a0: 0.9, type: 14, flat: 1 }); for (let i = 0; i < 8; i++) P3({ x: e.x0 + R0(-0.4, 0.4), y: R0(0.2, 1.6), z: e.z0 + R0(-0.4, 0.4), vy: R0(1, 3), max: 0.5, s0: 0.35, s1: 0.05, a0: 1, type: 10 }); }
          P3({ x: e.x, y: 0.1, z: e.z, max: 0.55, s0: 0.6, s1: 2.8, a0: 0.9, type: 14, flat: 1 });
          for (let i = 0; i < 10; i++) P3({ x: e.x + R0(-0.5, 0.5), y: R0(0.2, 1.8), z: e.z + R0(-0.5, 0.5), vy: R0(0.6, 2), max: 0.6, s0: 0.35, s1: 0.05, a0: 1, type: 10 });
          zap('jump', e.id === myK ? 0.7 : volAt(e.x, e.z) * 0.5);
          if (e.id === myK) { g.cam = null; if (e.recall) showBanner('Home', null, 'blue', 1.1); }
          continue;
        }
        if (k === 'recall') { if (!e.stop) { P3({ x: e.x, y: 0.1, z: e.z, max: 4.5, s0: 1.4, s1: 1.4, a0: 0.5, type: 14, flat: 1 }); zap('cp', e.id === myK ? 0.5 : volAt(e.x, e.z) * 0.3); } continue; }
        if (k === 'skill') {
          const sk = e.sk;
          if (sk === 'blink' && e.x1 != null) { const L = Math.hypot(e.x1 - e.x, e.z1 - e.z); for (let d = 0; d < L; d += 0.5) P3({ x: e.x + (e.x1 - e.x) * d / (L || 1), y: R0(0.4, 1.3), z: e.z + (e.z1 - e.z) * d / (L || 1), max: R0(0.3, 0.5), s0: 0.5, s1: 0.1, a0: 0.8, type: 9 }); P3({ x: e.x1, y: 0.1, z: e.z1, max: 0.4, s0: 0.5, s1: 2, a0: 0.8, type: 14, flat: 1 }); }
          else if (sk === 'mend') { P3({ x: e.x, y: 0.12, z: e.z, max: 0.7, s0: 1, s1: 12, a0: 0.6, type: 3, flat: 1 }); for (let i = 0; i < 16; i++) { const an = R0(0, 6.283), d = R0(0, 2); P3({ x: e.x + Math.cos(an) * d, y: R0(0.2, 1.4), z: e.z + Math.sin(an) * d, vy: R0(1, 2.4), max: R0(0.6, 1), s0: 0.32, s1: 0.05, a0: 0.9, type: 3 }); } }
          else if (sk === 'guard') P3({ x: e.x, y: 1, z: e.z, max: 0.6, s0: 1, s1: 3.2, a0: 0.5, type: 14 });
          else if (sk === 'sprint') { for (let i = 0; i < 10; i++) P3({ x: e.x + R0(-0.5, 0.5), y: R0(0.1, 0.5), z: e.z + R0(-0.5, 0.5), vy: R0(0.3, 1), max: R0(0.4, 0.7), s0: 0.5, s1: 1.2, a0: 0.5, type: 2 }); }
          else if (sk === 'shock') { P3({ x: e.x, y: 0.15, z: e.z, max: 0.45, s0: 1, s1: 9.6, a0: 0.9, type: 14, flat: 1 }); sparks(e.x, 1, e.z, 14, 6, 9); bolts(e.x, 1, e.z, 3, 6); const c = camFoc(); g.shake = Math.max(g.shake, 0.3 * clamp(1 - Math.hypot(e.x - c[0], e.z - c[2]) / 14, 0, 1)); }
          zap(SKILL_ZAP[sk] || 'skill', e.id === myK ? 0.7 : volAt(e.x, e.z) * 0.6);
          continue;
        }
        if (k === 'hunt') { const a = Math.atan2(e.tx - e.x, e.tz - e.z), len = Math.hypot(e.tx - e.x, e.tz - e.z); g.beams.push({ x: e.x, z: e.z, a, len, t: 0, max: 0.35 }); blast(e.tx, 0.8, e.tz, false, 0.6); continue; }
        if (k === 'stunH') { for (let i = 0; i < 6; i++) P3({ x: e.x + R0(-0.4, 0.4), y: R0(1.5, 2.1), z: e.z + R0(-0.4, 0.4), vy: R0(-0.2, 0.2), max: 0.9, s0: 0.28, s1: 0.1, a0: 1, type: 7 }); continue; }
        if (k === 'tbeam') {
          const st0 = e.st | 0;
          if (st0 >= 3) { g.tbeams.push({ x: e.x, z: e.z, tx: e.tx, tz: e.tz, y0: st0 === 5 ? 2.4 : st0 === 4 ? TLOOK.gua.glow : TLOOK.tow.glow, t: 0, max: st0 === 5 ? 0.3 : 0.22, tm: e.tm, w: st0 === 4 ? 1.3 : 1 }); sparks(e.tx, 1, e.tz, 4, e.tm === 1 ? 8 : 6, 5); if (volAt(e.x, e.z) > 0.2) zap('beam', volAt(e.x, e.z) * 0.32, 1.25); }
          else if (st0 === 2) { blast(e.tx, 0.7, e.tz, false, 0.45); if (volAt(e.tx, e.tz) > 0.3) zap('tshot', volAt(e.tx, e.tz) * 0.3); }
          else if (st0 === 1) { const L = Math.hypot(e.tx - e.x, e.tz - e.z) || 1; for (let d = 0.6; d < L; d += 1.1) P3({ x: e.x + (e.tx - e.x) * d / L, y: 0.8, z: e.z + (e.tz - e.z) * d / L, max: 0.12, s0: 0.3, s1: 0.1, a0: 0.9, type: e.tm === 1 ? 8 : 6 }); if (volAt(e.x, e.z) > 0.4) zap('eshot', volAt(e.x, e.z) * 0.2); }
          else { sparks(e.tx, 0.8, e.tz, 2, e.tm === 1 ? 8 : 4, 3); if (volAt(e.tx, e.tz) > 0.45) zap('clank', volAt(e.tx, e.tz) * 0.18); }
          continue;
        }
        if (k === 'fzap') { g.tbeams.push({ x: e.x, z: e.z, tx: e.tx, tz: e.tz, y0: 2.6, t: 0, max: 0.2, tm: 1 - myTm, w: 1.4 }); if (e.id === myK) zap('zapl', 0.6); continue; }
        if (k === 'hitH') { sparks(e.x, 0.9, e.z, 3, 8, 4); if (e.by === myK) { popSum(`p${e.id}`, e.x, e.z, e.d, '#FFFFFF', (v) => v >= 1200); zap('hit', 0.3); } continue; }
        if (k === 'kill' && (TLOOK[e.type] || e.type === 'shp')) {
          if (e.type === 'shp') { blast(e.x, 2, e.z, true, 2.6); g.shake = Math.max(g.shake, 0.9 * volAt(e.x, e.z)); zap('bigboom', volAt(e.x, e.z)); }
          else { blast(e.x, 0.6, e.z, e.type === 'sie', e.type === 'sie' ? 0.9 : 0.6); sparks(e.x, 0.6, e.z, 6, e.tm === 1 ? 8 : 6, 5); if (volAt(e.x, e.z) > 0.25) zap('boom', volAt(e.x, e.z) * 0.45); }
          if (e.by === myK) popNum(e.x, e.z, '+XP', '#FFE15A', false, 1.6);
          continue;
        }
      }
      if (k === 'blink') {
        const L = Math.hypot(e.x1 - e.x, e.z1 - e.z) || 1;
        for (let d = 0; d < L; d += 0.35) P3({ x: e.x + (e.x1 - e.x) * d / L + R0(-0.15, 0.15), y: R0(0.5, 1.3), z: e.z + (e.z1 - e.z) * d / L + R0(-0.15, 0.15), max: R0(0.3, 0.55), s0: 0.55, s1: 0.1, a0: 0.9, type: 10 });
        P3({ x: e.x1, y: 0.1, z: e.z1, max: 0.45, s0: 0.6, s1: 4.6, a0: 0.9, type: 14, flat: 1 });
        for (let i = 0; i < 12; i++) { const an = R0(0, 6.283), sp = R0(2, 5); P3({ x: e.x1, y: R0(0.6, 1.2), z: e.z1, vx: Math.cos(an) * sp, vy: R0(0.5, 2), vz: Math.sin(an) * sp, max: R0(0.3, 0.5), s0: 0.4, s1: 0.05, a0: 1, type: 10 }); }
        zap('dash', e.id === myK ? 0.7 : volAt(e.x1, e.z1) * 0.6, 0.9); zap('blast', e.id === myK ? 0.5 : volAt(e.x1, e.z1) * 0.4);
        if (e.id === myK) g.shake = Math.max(g.shake, 0.3);
        continue;
      }
      if (k === 'vanish' || k === 'unveil') {
        for (let i = 0; i < (k === 'vanish' ? 14 : 6); i++) P3({ x: e.x + R0(-0.6, 0.6), y: R0(0.2, 1.6), z: e.z + R0(-0.6, 0.6), vy: R0(0.3, 1.2), max: R0(0.5, 0.9), s0: 0.5, s1: 1.2, a0: 0.5, type: i % 3 ? 11 : 10 });
        if (k === 'vanish') zap('poof', e.id === myK ? 0.7 : volAt(e.x, e.z) * 0.5);
        continue;
      }
      if (k === 'fire') {
        const H = E.HEROES[e.hero];
        const hh = W.heroes[e.id], HL = HLOOK[e.hero];
        if (hh && HL) { hh.an = hh.an || { t: 0, run: 0, act: null, dt: 0, dash: 0 }; const ac = e.kind === 'sup' ? HL.sup : HL.atk; if (ac) hh.an.act = { c: ac, t: 0, r: e.kind === 'sup' ? 1 : 1.3 }; }
        const mine = e.id === myK;
        const v = mine ? 1 : volAt(e.x, e.z) * 0.8;
        const fx = e.x + Math.sin(e.a) * 0.8, fz = e.z + Math.cos(e.a) * 0.8;
        if (e.kind === 'sup') { zap('super', v * 0.5); P3({ x: e.x, y: 0.1, z: e.z, max: 0.4, s0: 0.6, s1: 2.3, a0: 0.6, type: 14, flat: 1 }); for (let i = 0; i < 10; i++) { const a = R0(0, 6.283); P3({ x: e.x + Math.cos(a) * 0.5, y: R0(0.3, 1.3), z: e.z + Math.sin(a) * 0.5, vx: Math.cos(a) * 2, vy: R0(1, 2.5), vz: Math.sin(a) * 2, max: R0(0.35, 0.6), s0: 0.32, s1: 0.05, a0: 1, type: 7 }); } }
        if (!H) continue;
        const sk = (e.kind === 'sup' ? H.sup : H.atk).k;
        if (sk === 'spread' || sk === 'wave') { zap(sk === 'wave' ? 'blast' : 'pellet', v); P3({ x: fx, y: 0.85, z: fz, max: 0.09, s0: 0.5, s1: sk === 'wave' ? 1.9 : 1.1, a0: 0.9, type: 16 }); if (sk === 'wave') zap('boom', v * 0.6); }
        else if (sk === 'bolt') { zap('bolt', v); P3({ x: fx, y: 0.95, z: fz, max: 0.09, s0: 0.4, s1: 0.9, a0: 0.9, type: 6 }); }
        else if (sk === 'lob' || sk === 'mega') zap('lob', v);
        else if (sk === 'orb') { zap('orb', v); P3({ x: fx, y: 1, z: fz, max: 0.2, s0: 0.3, s1: 1, a0: 0.8, type: 3 }); }
        else if (sk === 'beam') zap('beam', v);
        else if (sk === 'bloom') zap('heal', v);
        else if (sk === 'rocket') { zap('rocket', v * 0.85); P3({ x: fx, y: 1.1, z: fz, max: 0.12, s0: 0.5, s1: 1.2, a0: 0.9, type: 16 }); }
        else if (sk === 'barrage') zap('barrage', v);
        else if (sk === 'shard') { zap('shard', v * 0.8); P3({ x: fx, y: 1, z: fz, max: 0.12, s0: 0.35, s1: 0.9, a0: 0.8, type: 6 }); }
        else if (sk === 'zap') zap('zapl', v * 0.5);
        else if (sk === 'turret') zap('build', v * 0.8);
        else if (sk === 'blade') { zap('swing', v * 0.8, 1.3); P3({ x: fx, y: 0.95, z: fz, max: 0.1, s0: 0.45, s1: 1, a0: 0.9, type: 10 }); }
        if (mine) g.shake = Math.max(g.shake, e.kind === 'sup' ? 0.35 : 0.08);
      } else if (k === 'beam') {
        g.beams.push({ x: e.x, z: e.z, a: e.a, len: e.len, t: 0, max: 0.4 });
        const ux = Math.sin(e.a), uz = Math.cos(e.a);
        for (let d = 1; d < e.len; d += 0.9) P3({ x: e.x + ux * d, y: 0.95, z: e.z + uz * d, vy: R0(0.3, 1.2), max: R0(0.3, 0.5), s0: 0.5, s1: 0.1, a0: 0.8, type: 6 });
        sparks(e.x + ux * e.len, 0.9, e.z + uz * e.len, 8, 4, 8);
      } else if (k === 'smash') {
        const ux = Math.sin(e.a), uz = Math.cos(e.a), mine = e.id === myK;
        P3({ x: e.x + ux * 1.7, y: 0.1, z: e.z + uz * 1.7, max: 0.4, s0: 1, s1: 3.6, a0: 0.75, type: 13, flat: 1 });
        for (let i = 0; i < 9; i++) { const a = e.a + R0(-0.8, 0.8), d = R0(1, e.r); P3({ x: e.x + Math.sin(a) * d, y: 0.2, z: e.z + Math.cos(a) * d, vx: Math.sin(a) * R0(1, 3), vy: R0(1.5, 3.5), vz: Math.cos(a) * R0(1, 3), g: 12, max: R0(0.4, 0.7), s0: R0(0.3, 0.55), s1: 1.1, a0: 0.6, type: 2 }); }
        zap('swing', (mine ? 0.7 : volAt(e.x, e.z) * 0.5)); zap('stomp', (mine ? 0.55 : volAt(e.x, e.z) * 0.4));
        if (mine) g.shake = Math.max(g.shake, 0.22);
      } else if (k === 'slam' || k === 'freeze' || k === 'ring' || k === 'nova') {
        const ice = k === 'freeze' || k === 'nova', fire = k === 'ring';
        P3({ x: e.x, y: 0.12, z: e.z, max: 0.55, s0: 1, s1: e.r * 2.2, a0: 0.85, type: ice ? 14 : 13, flat: 1 });
        for (let i = 0; i < (k === 'slam' || k === 'freeze' ? 26 : 18); i++) { const a = R0(0, 6.283), d = R0(0.4, e.r); P3({ x: e.x + Math.cos(a) * d, y: R0(0.1, 0.6), z: e.z + Math.sin(a) * d, vx: Math.cos(a) * R0(0.5, 2.5), vy: R0(1, 3.2), vz: Math.sin(a) * R0(0.5, 2.5), g: ice ? 4 : 8, max: R0(0.5, 0.9), s0: R0(0.3, 0.6), s1: fire ? 1.2 : 0.1, a0: 0.9, type: ice ? 6 : fire ? 12 : 2 }); }
        if (k === 'slam') { zap('stomp', volAt(e.x, e.z)); g.shake = Math.max(g.shake, 0.55 * volAt(e.x, e.z)); }
        else if (fire) zap('fireball', volAt(e.x, e.z) * 0.8);
        else zap(k === 'freeze' ? 'freeze' : 'frost', volAt(e.x, e.z) * 0.85);
      } else if (k === 'zap') {
        const pts = e.pts || [];
        for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i]; let px = p0[0], pz = p0[1], py = i === 1 ? 0.95 : 0.9; for (let j = 1; j <= 5; j++) { const u = j / 5; const qx = p0[0] + (p1[0] - p0[0]) * u + (j < 5 ? R0(-0.35, 0.35) : 0), qz = p0[1] + (p1[1] - p0[1]) * u + (j < 5 ? R0(-0.35, 0.35) : 0), qy = 0.9 + (j < 5 ? R0(-0.2, 0.3) : 0); const L = Math.hypot(qx - px, qy - py, qz - pz) * 0.5 + 0.05; P3({ x: (px + qx) / 2, y: (py + qy) / 2, z: (pz + qz) / 2, max: 0.16, s0: 0.16, s1: 0.1, a0: 1, type: 15, d: [qx - px, qy - py, qz - pz], L }); px = qx; py = qy; pz = qz; } sparks(p1[0], 0.9, p1[1], 3, 6, 5); }
        zap('shock', (e.id === myK ? 0.45 : volAt(pts[0] ? pts[0][0] : 0, pts[0] ? pts[0][1] : 0) * 0.35), 1.2);
      } else if (k === 'tzap') {
        let px = e.x, pz = e.z, py = 1.7;
        for (let j = 1; j <= 5; j++) { const u = j / 5; const qx = e.x + (e.tx - e.x) * u + (j < 5 ? R0(-0.3, 0.3) : 0), qz = e.z + (e.tz - e.z) * u + (j < 5 ? R0(-0.3, 0.3) : 0), qy = 1.7 + (0.9 - 1.7) * u + (j < 5 ? R0(-0.2, 0.2) : 0); const L = Math.hypot(qx - px, qy - py, qz - pz) * 0.5 + 0.05; P3({ x: (px + qx) / 2, y: (py + qy) / 2, z: (pz + qz) / 2, max: 0.14, s0: 0.14, s1: 0.08, a0: 1, type: 15, d: [qx - px, qy - py, qz - pz], L }); px = qx; py = qy; pz = qz; }
        if (volAt(e.x, e.z) > 0.3) zap('clank', volAt(e.x, e.z) * 0.25);
      } else if (k === 'turret') { bolts(e.x, 0.5, e.z, 1.4, 4); P3({ x: e.x, y: 0.08, z: e.z, max: 0.5, s0: 0.5, s1: 3, a0: 0.9, type: 14, flat: 1 }); zap('build', volAt(e.x, e.z) * 0.8); zap('shock', volAt(e.x, e.z) * 0.4); }
      else if (k === 'turretEnd' || k === 'decoyEnd') { for (let i = 0; i < 8; i++) P3({ x: e.x + R0(-0.4, 0.4), y: R0(0.3, 1.2), z: e.z + R0(-0.4, 0.4), vy: R0(0.5, 1.5), max: R0(0.5, 0.9), s0: 0.5, s1: 1.3, a0: 0.5, type: 11 }); zap('poof', volAt(e.x, e.z) * 0.5); }
      else if (k === 'gadget') {
        const hg = W.heroes[e.id], HG = hg && HLOOK[hg.key];
        if (HG && HG.gad) { hg.an = hg.an || { t: 0, run: 0, act: null, dt: 0, dash: 0 }; hg.an.act = { c: HG.gad, t: 0, r: 1.2 }; } if (e.g === 'decoy' || e.g === 'mine' || e.g === 'over') zap(e.g === 'decoy' ? 'decoy' : e.g === 'over' ? 'over' : 'clank', e.id === myK ? 0.65 : volAt(e.x, e.z) * 0.4); if (e.g === 'jet') zap('jump', e.id === myK ? 0.7 : volAt(e.x, e.z) * 0.5); if (e.g === 'over') bolts(e.x, 1, e.z, 1.2, 3); }
      else if (k === 'bubble') { P3({ x: e.x, y: 1, z: e.z, max: 0.5, s0: 1, s1: e.r * 1.6, a0: 0.5, type: 14 }); zap('shield', volAt(e.x, e.z) * 0.6); }
      else if (k === 'charge') { const ux = Math.sin(e.a), uz = Math.cos(e.a); for (let d = 0; d < e.len; d += 0.6) P3({ x: e.x + ux * d, y: 0.25, z: e.z + uz * d, vy: R0(0.4, 1.2), max: R0(0.4, 0.7), s0: 0.5, s1: 1.3, a0: 0.55, type: 2 }); zap('dash', e.id === myK ? 0.7 : volAt(e.x, e.z) * 0.5); }
      else if (k === 'dash') { const ux = Math.sin(e.a), uz = Math.cos(e.a); for (let i = 0; i < 6; i++) P3({ x: e.x + ux * i * 0.5, y: R0(0.2, 0.8), z: e.z + uz * i * 0.5, vy: R0(0.2, 0.8), max: R0(0.3, 0.5), s0: 0.45, s1: 0.9, a0: 0.45, type: i % 2 ? 9 : 2 }); zap('dash', e.id === myK ? 0.55 : volAt(e.x, e.z) * 0.35, 1.15); }
      else if (k === 'dodge') { if (e.id === myK) popNum(e.x, e.z, 'Dodged', '#CFEFFF'); }
      else if (k === 'shieldHit') { sparks(e.x, 1, e.z, 3, 6, 4); if (e.id === myK) popNum(e.x, e.z, `${e.d}`, '#9FE6FF'); }
      else if (k === 'bloom') {
        P3({ x: e.x, y: 0.12, z: e.z, max: 0.7, s0: 1, s1: e.r * 2.1, a0: 0.9, type: 14, flat: 1 });
        for (let i = 0; i < 22; i++) { const a = R0(0, 6.283), d = R0(0, e.r); P3({ x: e.x + Math.cos(a) * d, y: R0(0.2, 1), z: e.z + Math.sin(a) * d, vy: R0(1, 2.6), max: R0(0.6, 1.1), s0: R0(0.25, 0.45), s1: 0.05, a0: 0.9, type: 3 }); }
      } else if (k === 'blast') {
        blast(e.x, 0.5, e.z, e.big, e.big ? 1.25 : 0.75);
        zap(e.big ? 'bigboom' : 'boom', volAt(e.x, e.z) * (e.big ? 1 : 0.8));
        const c = camFoc(); const d = Math.hypot(e.x - c[0], e.z - c[2]);
        g.shake = Math.max(g.shake, (e.big ? 0.6 : 0.25) * clamp(1 - d / 16, 0, 1));
      } else if (k === 'hitR') {
        const mine = e.by === myK;
        if (e.block) sparks(e.x, 0.9, e.z, 5, 6, 6);
        else for (let i = 0; i < 3; i++) { const a = R0(0, 6.283), sp = R0(1.5, 4); P3({ x: e.x, y: R0(0.7, 1.2), z: e.z, vx: Math.cos(a) * sp, vy: R0(1.5, 4), vz: Math.sin(a) * sp, g: 14, max: R0(0.3, 0.5), s0: R0(0.1, 0.18), s1: 0.06, a0: 1, type: 26 }); }
        P3({ x: e.x, y: 0.95, z: e.z, max: 0.1, s0: 0.5, s1: 1.1, a0: 0.8, type: e.block ? 6 : 7 });
        if (mine) { popSum(`r${e.id}${e.block ? 'b' : ''}`, e.x, e.z, e.d, e.block ? '#B8C4D6' : (v) => (v >= 1000 ? '#FFE15A' : '#FFFFFF'), (v) => v >= 1000); if (e.block) zap('clank', 0.6); else zap('hit', 0.32); }
      } else if (k === 'kill') {
        if (e.by === myK && W.heroes[myK] && !team) {
          const hh = W.heroes[myK];
          if (hh.mods && hh.mods.rush) hh.rushT = 1.6 + hh.mods.rush;
          g.myKills = (g.myKills || 0) + 1;
          if (g.myKills % STREAK === 0 && !g.over) { addPick(); pushNote(`${g.myKills} takedowns. A new power is ready`, 'join'); zap('star', 0.6); }
        }
        const big = e.type === 'tank' || e.type === 'boss' || e.type === 'bomber';
        if (e.type === 'bomber') blast(e.x, 0.6, e.z, true, 1);
        goo(e.x, e.z, e.type === 'boss' ? 2.2 : e.type === 'tank' ? 1.4 : e.type === 'shooter' ? 1 : 0.85, e.type === 'boss' ? 26 : big ? 16 : 10);
        if (e.type === 'boss') { for (let i = 1; i <= 3; i++) setTimeout(() => { if (G.current.W) goo(e.x + R0(-1.6, 1.6), e.z + R0(-1.6, 1.6), 1.6, 16); zap('splat', 0.9); zap('bigboom', 0.5); }, i * 260); g.shake = 1; }
        zap('splat', volAt(e.x, e.z) * (big ? 1 : 0.8));
        zap(big ? 'bigboom' : 'crunch', volAt(e.x, e.z) * (big ? 0.7 : 0.4));
        if (e.by === myK && !team) {
          const nowK = performance.now();
          g.kc = g.kc && nowK - g.kc.at < 1600 ? { n: g.kc.n + 1, at: nowK } : { n: 1, at: nowK };
          if (g.kc.n >= 2) { const lbl = g.kc.n === 2 ? 'Double' : g.kc.n === 3 ? 'Triple' : g.kc.n === 4 ? 'Quad' : 'Rampage'; popNum(e.x, e.z, lbl, g.kc.n >= 4 ? '#FF7AD9' : '#FFE15A', true); zap('combo', 0.55); g.shake = Math.max(g.shake, 0.12 + g.kc.n * 0.04); }
          if (big && solo) g.stopT = e.type === 'boss' ? 0.22 : 0.06;
        }
      } else if (k === 'spawn') {
        bolts(e.x, 0.5, e.z, 1.4, 3);
        P3({ x: e.x, y: 0.08, z: e.z, max: 0.5, s0: 0.5, s1: 3, a0: 0.9, type: 14, flat: 1 });
        if (!e.remote || volAt(e.x, e.z) > 0.3) zap('spawn', volAt(e.x, e.z) * 0.7);
        if (e.type === 'boss') { g.shake = Math.max(g.shake, 0.4); }
      } else if (k === 'rshot') {
        const rb = W.robots.find((r) => r.id === e.id);
        if (rb) { rb.an = rb.an || { t: 0, mv: 0, ak: null, at: 0, shot: 0 }; rb.an.shot = 0.45; }
        P3({ x: e.x, y: 1, z: e.z, max: 0.08, s0: 0.4, s1: 0.9, a0: 0.9, type: 8 });
        zap(e.type === 'tank' ? 'tshot' : 'eshot', volAt(e.x, e.z) * 0.55);
      } else if (k === 'hurtH') {
        const mine = e.id === myK;
        const hz = W.heroes[e.id];
        if (hz && hz.an && !hz.an.act) hz.an.act = { c: 'hit', t: 0, r: 1.4 };
        sparks(e.x, 0.9, e.z, 3, 8, 5);
        if (mine) { popSum('me', e.x, e.z, e.d, '#FF5A4E', (v) => v >= 900); zap('hurt', 0.8); g.shake = Math.max(g.shake, 0.18); g.hurtT = 0.4; }
      } else if (k === 'heal') {
        for (let i = 0; i < 6; i++) P3({ x: e.x + R0(-0.4, 0.4), y: R0(0.4, 1.4), z: e.z + R0(-0.4, 0.4), vy: R0(0.8, 1.8), max: R0(0.5, 0.9), s0: 0.3, s1: 0.06, a0: 0.9, type: 3 });
        if (e.id === myK || e.by === myK) { popSum(`h${e.id}`, e.x, e.z, e.n, '#6BF26B', false, '+'); if (e.id === myK) zap('heal', 0.5); }
      } else if (k === 'down') {
        if (e.id === myK) {
          zap('pdie', 0.7);
          const kb = typeof e.by === 'number' ? W.robots.find((r) => r.id === e.by) : e.by === 'laser' || e.by === 'stomp' || e.by === 'mis' ? W.robots.find((r) => r.type === 'boss') : null;
          g.kill = { at: performance.now(), by: kb ? kb.id : null, x: kb ? kb.x : e.x, z: kb ? kb.z : e.z };
          setKill({ name: killerName(e.by), at: Date.now() });
        }
        else if (W.heroes[e.id]) pushNote(`${nameOf(e.id)} is down`, 'leave');
        sparks(e.x, 0.8, e.z, 8, 9, 5);
      } else if (k === 'revive') {
        for (let i = 0; i < 14; i++) { const a = R0(0, 6.283); P3({ x: e.x + Math.cos(a) * 0.8, y: R0(0.2, 1.6), z: e.z + Math.sin(a) * 0.8, vy: R0(1, 2.2), max: R0(0.5, 0.9), s0: 0.3, s1: 0.05, a0: 1, type: 9 }); }
        zap('star', e.id === myK ? 0.7 : 0.35);
        if (e.id === myK) showBanner('Back in the fight', null, 'green', 1.6);
        if (W.local.has(e.id) && Array.isArray(e.by) && e.by.length) {
          if (isHost) for (const b of e.by) { const h = W.heroes[b]; if (h) h.stats.rev += 1; }
          else relay.send('ev', { r: g.rid, k: 'rv', by: e.by.slice(0, E.SQUAD_MAX) });
        }
      } else if (k === 'out') {
        if (e.id === myK) showBanner('You are out', 'You come back next wave', 'red', 2.6);
      } else if (k === 'melee') {
        const h = W.heroes[e.to];
        if (h) sparks(h.x, 0.9, h.z, 4, 4, 6);
        zap('clank', volAt(h ? h.x : 0, h ? h.z : 0) * 0.6);
      } else if (k === 'wind') zap('wind', 0.35);
      else if (k === 'fuse') zap('fuse', 0.5);
      else if (k === 'zone') {
        if (e.z === 'stomp') { P3({ x: e.x, y: 0.12, z: e.z2, max: 0.6, s0: 1, s1: e.r * 2.2, a0: 0.75, type: 13, flat: 1 }); for (let i = 0; i < 16; i++) { const a = R0(0, 6.283), d = R0(0.5, e.r); P3({ x: e.x + Math.cos(a) * d, y: 0.3, z: e.z2 + Math.sin(a) * d, vy: R0(1, 3), max: R0(0.5, 0.9), s0: 0.6, s1: 1.6, a0: 0.5, type: 2 }); } zap('stomp', volAt(e.x, e.z2)); g.shake = Math.max(g.shake, 0.55); }
        else { blast(e.x, 0.5, e.z2, e.r > 2.5, e.r / 2.4); zap('boom', volAt(e.x, e.z2)); g.shake = Math.max(g.shake, 0.3 * volAt(e.x, e.z2)); }
      } else if (k === 'laserOn') zap('laser', volAt(e.x, e.z));
      else if (k === 'bossMis' || k === 'bossCall') { zap('alert', 0.4); }
      else if (k === 'pick') {
        if (e.id === myK) { zap(e.kind === 'hp' ? 'pick' : e.kind === 'sh' ? 'shield' : 'coin', 0.7); popNum(e.x, e.z, DROP_TEXT[e.kind] || 'Power up', DROP_COL[e.kind] || '#FFE15A', true); }
        for (let i = 0; i < 10; i++) P3({ x: e.x + R0(-0.5, 0.5), y: R0(0.3, 1.2), z: e.z + R0(-0.5, 0.5), vy: R0(1, 2.5), max: R0(0.4, 0.8), s0: 0.3, s1: 0.05, a0: 1, type: e.kind === 'pw' ? 10 : e.kind === 'su' ? 7 : 3 });
      } else if (k === 'wallHit') { P3({ x: e.x, y: 0.9, z: e.z, max: 0.35, s0: 0.3, s1: 0.8, a0: 0.5, type: 2 }); sparks(e.x, 0.9, e.z, 2, e.side === 'r' ? 8 : 4, 4); }
      else if (k === 'fizz') P3({ x: e.x, y: 0.9, z: e.z, max: 0.25, s0: 0.25, s1: 0.5, a0: 0.4, type: 0 });
      else if (k === 'spark') sparks(e.x, 0.9, e.z, 3, 8, 4);
      else if (k === 'over' && isHost) hostOver();
    }
    W.ev.length = 0;
  };

  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (ts) => {
      raf = requestAnimationFrame(loop);
      const st = RR.current, cv = cvRef.current, wrap = wrapRef.current, ov = ovRef.current;
      if (!st || !st.arena || !cv || !wrap) return;
      let dt = (ts - last) / 1000;
      last = ts;
      if (dt <= 0) return;
      dt = Math.min(0.1, dt) * (window.__zsiegeTS || 1);
      const g = G.current;
      const B = g.budget;
      B.avg = B.avg * 0.94 + Math.min(80, dt * 1000) * 0.06; B.n += 1;
      if (gfxRef.current === 'auto' && B.n > 80 && B.avg > 26 && B.tier < 2) { B.tier += 1; B.n = 0; B.avg = 18; if (B.tier >= 2) { st.arena.env.shadows = false; st.arena.env.detail = 0; } }
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      const dpr = Math.min(maxDpr(B.tier >= 2), [1.75, 1.3, 1][B.tier]);
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
      const odpr = Math.min(2, window.devicePixelRatio || 1);
      if (ov && (ov.width !== Math.round(cw * odpr) || ov.height !== Math.round(ch * odpr))) { ov.width = Math.round(cw * odpr); ov.height = Math.round(ch * odpr); }
      const ph = phaseRef.current;
      const now = performance.now();
      const myK = kindOf();
      let hs = 1;
      if (g.stopT > 0) { g.stopT -= dt; hs = 0.1; }
      const step = pausedRef.current ? 0 : dt * hs;
      const W = ph !== 'menu' ? g.W : null;
      const A = W ? W.A : st.arena.A;
      if (W) {
        W.nowMs = now;
        const mine = W.heroes[myK];
        if (mine && W.local.has(myK) && step > 0) {
          let mx = J.joy.current.x, mz = J.joy.current.y;
          const kk = keys.current;
          const kx = (kk.has('d') || kk.has('arrowright') ? 1 : 0) - (kk.has('a') || kk.has('arrowleft') ? 1 : 0);
          const kz = (kk.has('s') || kk.has('arrowdown') ? 1 : 0) - (kk.has('w') || kk.has('arrowup') ? 1 : 0);
          if (kx || kz) { mx = kx; mz = kz; }
          if (g.flip) { mx = -mx; mz = -mz; }
          if (g.keyMove[0] || g.keyMove[1]) { mx = g.keyMove[0]; mz = g.keyMove[1]; }
          const aiming = g.aim.on && g.aim.eng;
          const inp = { mx, mz, aiming: aiming || !!g.mouse, aimA: aiming ? g.aim.a : g.mouse ? g.mouse.a : null };
          if (mine.god) mine.hp = mine.max;
          while (g.fireQ.length) tryFire(mine, g.fireQ.shift());
          while (g.gadQ.length) tryGadget(mine, g.gadQ.shift());
          while (g.dashQ.length) { const d0 = g.dashQ.shift(); tryDash(mine, d0 != null ? d0 : (Math.hypot(mx, mz) > 0.2 ? Math.atan2(mx, mz) : null)); }
          while (g.skQ.length) { const s0 = g.skQ.shift(); trySkill(mine, s0 != null ? s0 : (Math.hypot(mx, mz) > 0.2 ? Math.atan2(mx, mz) : null)); }
          while (g.recQ.length) { g.recQ.shift(); if (tryRecall(mine)) zap('cp', 0.5); }
          E.stepHero(W, mine, inp, step);
          if (W.mode === 'team') T.stepLocal(W, mine, step, inp);
          if (mine.st === 0) for (let i = W.drops.length - 1; i >= 0; i--) {
            const d = W.drops[i];
            if (Math.hypot(d.x - mine.x, d.z - mine.z) > 1.15 + ((mine.mods && mine.mods.magnet) || 0)) continue;
            if (isHost) { E.takeDrop(W, mine, d); W.drops.splice(i, 1); W.net.push(['pg', d.id, '', 0]); }
            else if (!g.claimed.has(d.id)) { g.claimed.add(d.id); W.drops.splice(i, 1); relay.send('ev', { r: g.rid, k: 'pk', i: d.id }); }
          }
        } else { g.fireQ.length = 0; g.gadQ.length = 0; g.dashQ.length = 0; g.skQ.length = 0; g.recQ.length = 0; }
        if (isHost && step > 0) for (const id of g.bots) {
          const h = W.heroes[id];
          if (!h) continue;
          const tmB = W.mode === 'team';
          const inp = tmB ? T.teamBot(W, h, step) : E.botBrain(W, h, step);
          if (inp.fire) tryFire(h, inp.fire);
          if (inp.gad) tryGadget(h, inp.gad);
          if (inp.dash != null) tryDash(h, inp.dash);
          if (tmB && inp.skill != null) trySkill(h, inp.skill);
          if (tmB && inp.recall) tryRecall(h);
          E.stepHero(W, h, inp, step);
          if (tmB) { T.stepLocal(W, h, step, inp); continue; }
          if (h.st === 0) for (let i = W.drops.length - 1; i >= 0; i--) { const d = W.drops[i]; if (Math.hypot(d.x - h.x, d.z - h.z) < 1.15 + ((h.mods && h.mods.magnet) || 0)) { E.takeDrop(W, h, d); W.drops.splice(i, 1); } }
        }
        const kS = 1 - Math.exp(-step * 26);
        for (const id of W.order) {
          if (W.local.has(id)) continue;
          const h = W.heroes[id];
          if (!h.nb) continue;
          const ox = h.x, oz = h.z;
          const v = netRead(h.nb, h.nv || (h.nv = [h.x, h.z, h.yaw]), { ang: [2], lin: [0, 1], ext: 180, base: 110, cap: 420, snap: 5 });
          if (v) { h.x = v[0]; h.z = v[1]; }
          h.aimT = Math.max(0, (h.aimT || 0) - step);
          h.ocT = Math.max(0, h.ocT - step); h.rfT = Math.max(0, h.rfT - step); h.spT = Math.max(0, h.spT - step);
          if (h.clkT > 0) h.clkT = Math.max(0, h.clkT - step);
          if (h.jump) { h.jump.t += step; if (h.jump.t >= h.jump.T) h.jump = null; }
          const wantYaw = h.aimT > 0 ? h.aimA : v ? v[2] : h.yaw;
          h.yaw += wrapA(wantYaw - h.yaw) * kS;
          h.vx = step > 0 ? (h.x - ox) / step : 0; h.vz = step > 0 ? (h.z - oz) / step : 0;
          h.walk += Math.hypot(h.x - ox, h.z - oz);
          h.flash = Math.max(0, h.flash - step);
          h.rec = Math.max(0, (h.rec || 0) - step);
          if (isHost && !h.bot && now - (h.netAt || now) > 5000 && h.st === 0) { h.st = 2; h.gone = true; }
        }
        if (!isHost) E.smoothRobots(W, step);
        if (solo && cardsRef.current && W.wave.st === 'break' && !W.over) W.wave.t += step;
        if (step > 0) { const subs = Math.max(1, Math.ceil(step / 0.034)); for (let i = 0; i < subs; i++) E.stepWorld(W, step / subs); }
        if (W.mode === 'team') {
          if (RIFT.d && st.arena.key === 'rift' && !st.arena.kit && !g.riftRebuild) { g.riftRebuild = true; setTimeout(() => { try { ensureArena('rift'); } catch {} }, 0); }
          if (!st.rk && RIFT.d && st.sk) { try { st.rk = riftUpload(st.R, RIFT.d); } catch { st.rk = { mesh: {}, still: {} }; } }
        } else if (W.wave.n > g.waveSeen) {
          g.waveSeen = W.wave.n;
          const spec = E.waveSpec(W.wave.n, 1, W.lv, 1);
          if (spec.boss) { showBanner('Boss wave', `${E.ROBOTS.boss.name} is coming`, 'red', 2.8); zap('alert', 0.6); }
          else { showBanner(`Wave ${W.wave.n}`, W.wave.n === 1 ? 'Aliens incoming' : W.endless || W.wave.n < E.WIN_WAVE ? null : 'Last wave', 'gold', 2); zap('cp', 0.6); }
          for (const id of W.local) { const h = W.heroes[id]; if (h && h.st === 2) { const p = E.heroSpawn(W.A, W.order.indexOf(id)); h.x = p.x; h.z = p.z; h.st = 0; h.hp = h.max; h.ammo = 3; h.downT = 0; W.ev.push({ k: 'revive', id, x: h.x, z: h.z }); } }
        }
        if (W.mode !== 'team' && W.wave.st === 'break' && E.cardWave(W.wave.n) && g.cardDone !== W.wave.n && !g.over) {
          g.cardDone = W.wave.n;
          if (isHost) for (const id of g.bots) { const h = W.heroes[id]; if (h) { const ch = E.cardChoices(h, Math.random); if (ch.length) E.applyCard(h, ch[Math.floor(Math.random() * ch.length)]); } }
          const meH0 = W.heroes[myK];
          if (meH0 && W.local.has(myK)) addPick();
        }
        if (W.mode !== 'team' && W.wave.st === 'break' && !cardsRef.current && !g.over && (g.pend || []).some((p) => !p.seen)) showPick(true);
        if (W.mode !== 'team' && W.wave.st !== g.stSeen) {
          if (W.wave.st === 'break' && g.stSeen === 'fight') { showBanner(`Wave ${W.wave.n} cleared`, E.cardWave(W.wave.n) ? 'Pick an upgrade' : 'Catch your breath', 'green', 2.2); zap('combo', 0.6); }
          g.stSeen = W.wave.st;
        }
        handleEvents(W, now);
        if (isHost && W.over && !g.over) hostOver();
        if (!solo && !watch && W.local.has(myK) && now - g.sendAt > g.sendMs && W.heroes[myK]) { g.sendAt = now; g.hsq += 1; relay.send('hs', { r: g.rid, q: g.hsq, p: heroPack(W, W.heroes[myK]) }); }
        if (!solo && isHost) {
          if (now - g.snapAt > SNAP_MS) {
            g.snapAt = now; g.seq += 1;
            if (W.mode === 'team') relay.send('es', { r: g.rid, q: g.seq, a: W.robots.filter((b) => b.hp > 0 && !E.STILL_TYPES.has(b.type)).slice(0, 140).map(E.robotSnap), tq: T.snapTeam(W), b: g.bots.map((id) => [id, ...heroPack(W, W.heroes[id])]) });
            else relay.send('es', { r: g.rid, q: g.seq, a: W.robots.filter((b) => b.hp > 0).map(E.robotSnap), w: [W.wave.n, ST_CODE[W.wave.st] || 0, Math.round(Math.max(0, W.wave.t) * 10), W.wave.left], sc: W.score, d: W.drops.map((d) => [d.id, E.DROP_KEYS.indexOf(d.k), Math.round(d.x * 10), Math.round(d.z * 10), Math.round(d.life * 10)]), b: g.bots.map((id) => [id, ...heroPack(W, W.heroes[id])]) });
          }
          if (W.net.length && now - g.reAt > RE_MS) { g.reAt = now; relay.send('re', { r: g.rid, e: W.net.splice(0, W.net.length) }); }
        } else W.net.length = 0;
        if (!solo && !isHost && ph === 'play' && !g.over && now - g.lastSnapAt > 7000) finishUp(W.mode === 'team' ? { team: -1, lost: true } : { won: false, wave: W.wave.n, score: W.score, list: statList(W), lost: true });
      }

      const P = g.parts;
      const parts = [];
      for (let i = P.length - 1; i >= 0; i--) {
        const q = P[i];
        q.life += step || 0.016;
        if (q.life >= q.max) { P.splice(i, 1); continue; }
        if (q.g) q.vy -= q.g * step;
        q.x += q.vx * step; q.y += q.vy * step; q.z += q.vz * step;
        if (q.g && q.y < 0.05) { q.y = 0.05; q.vy *= -0.3; q.vx *= 0.6; q.vz *= 0.6; }
        const u = q.life / q.max;
        const sz = q.s0 + (q.s1 - q.s0) * (q.fin ? 1 - (1 - u) * (1 - u) : u);
        const pt = { x: q.x, y: q.y, z: q.z, size: sz, alpha: q.a0 * (q.fin ? Math.min(1, u / 0.1) * (1 - u) * (1 - u * 0.3) : 1 - u), type: q.type || 0, seed: q.seed || 0 };
        if (q.st) { const sp = Math.hypot(q.vx, q.vy, q.vz); if (sp > 0.5) { pt.dx = q.vx; pt.dy = q.vy; pt.dz = q.vz; pt.dw = sz + sp * q.st; } }
        else if (q.d) { pt.dx = q.d[0]; pt.dy = q.d[1]; pt.dz = q.d[2]; pt.dw = q.L; }
        else if (q.flat) pt.dw = -1;
        parts.push(pt);
      }

      const items = [];
      const fx = st.fx;
      const tsec = now / 1000;
      const myH = W ? W.heroes[myK] : null;
      const bushHide = new Set();
      if (myH && myH.st === 0) { const ci = E.cellIdx(A, myH.x, myH.z); if (ci >= 0) st.arena.bushes.forEach((b, i) => { if (b.cells.includes(ci)) bushHide.add(i); }); }
      const skipFine = g.budget.tier >= 2;
      for (const it of st.arena.items) {
        if (skipFine && it.fine) continue;
        const bi = st.arena.bushes.indexOf(it);
        if (bi >= 0 && bushHide.has(bi)) items.push({ mesh: it.mesh, blend: 1, alpha: 0.42, bs: it.bs });
        else items.push(it);
      }
      const ringAt = (x, z, r, tint, alpha) => { if (fx) items.push({ mesh: fx.ring, model: scl(m4.pose(x, 0.03, z, 0), r, 1, r), blend: 3, alpha, tint }); };
      const discAt = (x, z, r, tint, alpha, y = 0.025) => { if (fx) items.push({ mesh: fx.disc, model: scl(m4.pose(x, y, z, 0), r, 1, r), blend: 3, alpha, tint }); };
      const drawHero = (h, key, x, z, yaw, o = {}) => {
        if (st.sk && HLOOK[key]) {
          const J = h.jump;
          const jy = J ? Math.sin(Math.PI * clamp(J.t / J.T, 0, 1)) * 2.6 : 0;
          const Pz = skPoseHero(st.sk, h, key, o, step);
          const hs = heroScale(key);
          const Ms = scl(m4.pose(x, jy, z, yaw), hs, hs, hs);
          skHeroItems(st.sk, h, key, Ms, Pz, h.flash > 0 ? COLF : o.cloak ? COLK : o.tint ? COLD : COLN, items);
          if (o.down) return;
          if (J && fx) { discAt(J.x1, J.z1, 1.1, TINT.cyan, 0.25); if (Math.random() < 0.8) P3({ x: x, y: jy + 0.5, z: z, vy: -1.5, max: 0.35, s0: 0.35, s1: 0.1, a0: 0.9, type: 1 }); }
          if ((h.shield || 0) > 0 && fx) items.push({ mesh: fx.bubble, model: scl(m4.pose(x, 0.95 + jy, z, tsec * 0.6), 0.95, 1.12, 0.95), blend: 1, alpha: 0.55 });
          if ((h.dashT || 0) > 0 || h.dashNet) { if (Math.random() < 0.9) P3({ x: x + R0(-0.2, 0.2), y: R0(0.3, 1.2), z: z + R0(-0.2, 0.2), max: 0.3, s0: 0.5, s1: 0.1, a0: 0.5, type: 9 }); }
          if ((h.ocT || 0) > 0 && Math.random() < 0.3) bolts(x, 1, z, 0.7, 1);
          return;
        }
        const HM = heroMesh(`${key}:${h.hc | 0}`);
        if (!HM) return;
        const spd = Math.hypot(h.vx || 0, h.vz || 0);
        const mv = clamp(spd / 3, 0, 1);
        const ph2 = (h.walk || 0) * 2.6;
        const bob = Math.abs(Math.sin(ph2)) * 0.06 * mv + (o.idle ? Math.sin(tsec * 2.2 + x) * 0.012 : 0);
        const rec = (h.rec || 0) * 0.7;
        const J = h.jump;
        const jy = J ? Math.sin(Math.PI * clamp(J.t / J.T, 0, 1)) * 2.6 : 0;
        const M = m4.pose(x - Math.sin(yaw) * rec, jy, z - Math.cos(yaw) * rec, yaw, J ? -0.25 : 0);
        if (o.down) {
          const Md = mul(M, m4.pose(0, 0.18, -0.2, 0, -1.35, 0));
          items.push({ mesh: HM.body, model: Md, cast: true });
          return;
        }
        const body = mul(M, m4.pose(0, bob, 0, 0, mv * 0.1, 0));
        items.push({ mesh: HM.body, model: body, cast: true });
        for (const s of [-1, 1]) items.push({ mesh: HM.leg, model: mul(M, m4.pose(s * HM.hip[0], HM.hip[1] + bob * 0.5, 0, 0, Math.sin(ph2) * 0.7 * mv * s, 0)), cast: true });
        if (h.flash > 0) items.push({ mesh: HM.body, model: body, blend: 3, alpha: 0.6, tint: TINT.white });
        if (o.tint) items.push({ mesh: HM.body, model: body, blend: 3, alpha: o.tintA || 0.5, tint: o.tint });
        if (J && fx) { discAt(J.x1, J.z1, 1.1, TINT.cyan, 0.25); if (Math.random() < 0.8) P3({ x: x, y: jy + 0.5, z: z, vy: -1.5, max: 0.35, s0: 0.35, s1: 0.1, a0: 0.9, type: 1 }); }
        if ((h.shield || 0) > 0 && fx && !o.down) items.push({ mesh: fx.bubble, model: scl(m4.pose(x, 0.95 + jy, z, tsec * 0.6), 0.95, 1.12, 0.95), blend: 1, alpha: 0.55 });
        if ((h.dashT || 0) > 0 || h.dashNet) { if (Math.random() < 0.9) P3({ x: x + R0(-0.2, 0.2), y: R0(0.3, 1.2), z: z + R0(-0.2, 0.2), max: 0.3, s0: 0.5, s1: 0.1, a0: 0.5, type: 9 }); }
        if ((h.ocT || 0) > 0 && Math.random() < 0.3) bolts(x, 1, z, 0.7, 1);
      };

      if (ph === 'menu' || !W) {
        g.menuT += step;
        const hc = A.homes.length ? A.homes : A.team ? [{ x: 15.5, z: 97 }] : [{ x: A.wx / 2, z: A.wz - 3 }];
        const cx = hc.reduce((s, p) => s + p.x, 0) / hc.length, cz = hc.reduce((s, p) => s + p.z, 0) / hc.length - 1;
        const list = solo ? ['me'] : rosterRef.current.slice(0, 4);
        list.forEach((k, i) => {
          const key = k === myK ? heroRef.current : validHero(heroOfRef.current[k] || (metaRef.current[k] && metaRef.current[k].h));
          const off = [[0, 0], [-1.6, -0.9], [1.6, -0.9], [0, -1.8]][i] || [0, 0];
          const fake = (g.fakes || (g.fakes = {}))[k] || (g.fakes[k] = { vx: 0, vz: 0, walk: 0, flash: 0, rec: 0 });
          fake.hc = k === myK ? heroColRef.current : clamp(Number(colOfRef.current[k] != null ? colOfRef.current[k] : metaRef.current[k] && metaRef.current[k].hc) | 0, 0, 3);
          if (fake.key !== key) { fake.key = key; fake.pose = null; fake.an = null; }
          drawHero(fake, key, cx + off[0], cz + off[1], window.__zfake && window.__zsiegeYaw != null ? window.__zsiegeYaw : Math.sin(tsec * 0.6 + i) * 0.25, { idle: true });
          ringAt(cx + off[0], cz + off[1], 0.7, k === myK ? TINT.me : TINT.ally, 0.75);
        });
        const sw = Math.sin(g.menuT * 0.15) * 0.5;
        const wide = cw > ch * 1.15;
        const lz = st.sk ? 1 : 0;
        const cam = wide ? { pos: [cx - 1.25 + sw, 3.5 - lz * 0.4, cz + 7.6], at: [cx - 1.25, 0.66 - lz * 1.05, cz - 0.3], fov: 0.62, shadowAt: [cx, 0, cz - 1] } : { pos: [cx + sw, 5.2, cz + 10], at: [cx, 0.2, cz + 1.4], fov: 0.66, shadowAt: [cx, 0, cz - 1] };
        g.cam = cam;
        const VP = st.R.render({ env: st.arena.env, cam, items, parts });
        g.VP = VP; g.invVP = null;
        if (ov) { const c2 = ov.getContext('2d'); c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, ov.width, ov.height); }
        return;
      }

      const team = W.mode === 'team';
      const myTm = team && myH ? myH.tm : 0;
      if (team) {
        const TT = W.A.team, rk = st.rk, sk0 = st.sk;
        for (const f of TT.founts) { const c0 = f.tm === myTm ? TINT.blueT : TINT.redT; discAt(f.x, f.z, T.FOUNT_R, c0, 0.08 + 0.03 * Math.sin(tsec * 2 + f.tm)); ringAt(f.x, f.z, T.FOUNT_R, c0, 0.45); parts.push({ x: f.x, y: 0.5, z: f.z, size: 2 + Math.sin(tsec * 3) * 0.2, alpha: 0.16, type: f.tm === myTm ? 6 : 8 }); }
        for (const p of TT.pads) { const mine = p.tm === myTm, c0 = mine ? TINT.blueT : TINT.redT; discAt(p.x, p.z, 1.05, c0, mine ? 0.32 : 0.14); ringAt(p.x, p.z, 1.12, c0, (mine ? 0.65 : 0.3) + 0.2 * Math.sin(tsec * 4 + p.i)); if (mine && Math.random() < 0.25) P3({ x: p.x + R0(-0.6, 0.6), y: 0.1, z: p.z + R0(-0.6, 0.6), vy: R0(1, 2.2), max: 0.6, s0: 0.25, s1: 0.05, a0: 0.9, type: 6 }); }
        for (const p of TT.portals) {
          if (rk && rk.mesh.us_ring && sk0) items.push({ mesh: rk.mesh.us_ring, model: scl(m4.pose(p.x, 0, p.z, tsec * 0.25), 0.62, 0.4, 0.62), skin: rk.still.us_ring, tex: sk0.tex.p_base, col: COLP, cast: true });
          discAt(p.x, p.z, 1.25, TINT.violet, 0.3 + 0.1 * Math.sin(tsec * 3 + p.i)); ringAt(p.x, p.z, 1.3, TINT.violet, 0.8);
          parts.push({ x: p.x, y: 0.7, z: p.z, size: 1.5 + Math.sin(tsec * 4 + p.i) * 0.15, alpha: 0.3, type: 10 });
          if (Math.random() < 0.3) P3({ x: p.x + R0(-0.8, 0.8), y: 0.1, z: p.z + R0(-0.8, 0.8), vy: R0(1.2, 2.6), max: 0.7, s0: 0.25, s1: 0.04, a0: 1, type: 10 });
        }
      }
      for (const id of W.order) {
        const h = W.heroes[id];
        if (!h || h.st === 2) continue;
        const isMe = id === myK;
        if (team) {
          const ally = h.tm === myTm;
          if (!ally && !E.seenBy(W, h, myTm)) continue;
          drawHero(h, h.key, h.x, h.z, h.yaw, { cloak: (h.clkT || 0) > 0 });
          ringAt(h.x, h.z, 0.72, isMe ? TINT.me : ally ? TINT.ally : TINT.foe, isMe ? 0.85 : 0.7);
          if ((h.recT || 0) > 0 || h.recV) { discAt(h.x, h.z, 1.3, TINT.ice, 0.18 + 0.08 * Math.sin(tsec * 8)); if (Math.random() < 0.6) P3({ x: h.x + R0(-0.6, 0.6), y: 0.1, z: h.z + R0(-0.6, 0.6), vy: R0(1.5, 3), max: 0.6, s0: 0.25, s1: 0.04, a0: 1, type: 6 }); }
          if (((h.stunT || 0) > 0 || h.stunV) && Math.random() < 0.3) P3({ x: h.x + R0(-0.4, 0.4), y: R0(1.6, 2.1), z: h.z + R0(-0.4, 0.4), max: 0.5, s0: 0.25, s1: 0.08, a0: 1, type: 7 });
          if ((h.spawnT || 0) > 0 || h.spawnV) parts.push({ x: h.x, y: 0.95, z: h.z, size: 1.5, alpha: 0.1 + 0.04 * Math.sin(tsec * 6), type: 6 });
          if (h.buffs && h.buffs.fury && Math.random() < 0.18) P3({ x: h.x + R0(-0.3, 0.3), y: R0(0.4, 1.4), z: h.z + R0(-0.3, 0.3), vy: R0(0.6, 1.2), max: 0.5, s0: 0.2, s1: 0.04, a0: 0.9, type: 1 });
          if (h.buffs && h.buffs.flow && Math.random() < 0.18) P3({ x: h.x + R0(-0.3, 0.3), y: R0(0.4, 1.4), z: h.z + R0(-0.3, 0.3), vy: R0(0.6, 1.2), max: 0.5, s0: 0.2, s1: 0.04, a0: 0.9, type: 6 });
          continue;
        }
        drawHero(h, h.key, h.x, h.z, h.yaw, { down: h.st === 1, cloak: (h.clkT || 0) > 0 });
        if (h.st === 0) ringAt(h.x, h.z, 0.72, isMe ? TINT.me : TINT.ally, isMe ? 0.85 : 0.6);
        else { discAt(h.x, h.z, E.REVIVE_R, TINT.mint, 0.12 + 0.05 * Math.sin(tsec * 5)); ringAt(h.x, h.z, E.REVIVE_R, TINT.mint, 0.5); }
        if (h.pw > 0 && h.st === 0 && Math.random() < 0.35) P3({ x: h.x + R0(-0.4, 0.4), y: R0(0.3, 1.5), z: h.z + R0(-0.4, 0.4), vy: R0(0.6, 1.4), max: 0.5, s0: 0.22, s1: 0.04, a0: 0.9, type: 10 });
        if (h.key === 'mira' && h.st === 0) { const hx = h.x + Math.cos(h.yaw) * 0.36 + Math.sin(h.yaw) * 0.2, hz = h.z - Math.sin(h.yaw) * 0.36 + Math.cos(h.yaw) * 0.2; parts.push({ x: hx, y: 1.66, z: hz, size: 0.55, alpha: 0.5, type: 3 }); }
      }
      for (const b of W.robots) {
        if (b.hp <= 0) continue;
        const TL = team && TLOOK[b.type];
        if (TL) {
          const rk = st.rk, still = E.STILL_TYPES.has(b.type);
          const rise = b.sp > 0 && !still && b.type !== 'shp' ? -clamp(b.sp / 0.35, 0, 1) * 0.9 : 0;
          const hov = b.type === 'shp' ? TL.y + Math.sin(tsec * 1.6 + b.id) * 0.18 + (b.sp > 0 ? -clamp(b.sp / 1.4, 0, 1) * 3 : 0) : 0;
          const yaw = b.type === 'cor' ? 0 : b.yaw;
          const atk = (b.atkT2 || 0) > 0 || b.atkV;
          const bump = !still && b.type !== 'shp' ? Math.abs(Math.sin((b.walk || 0) * 3.2)) * 0.03 * clamp((b.mv || 0) / 2, 0, 1) : 0;
          if (rk && rk.mesh[TL.m] && st.sk) {
            const col = unitCol(b, myTm);
            items.push({ mesh: rk.mesh[TL.m], model: scl(m4.pose(b.x, rise + hov + bump, b.z, yaw + TL.rot), TL.s, TL.s * (atk && !still ? 0.96 : 1), TL.s), skin: rk.still[TL.m], tex: st.sk.tex.p_base, col, cast: true });
            if (TL.base && rk.mesh[TL.base]) items.push({ mesh: rk.mesh[TL.base], model: scl(m4.pose(b.x, 0, b.z, 0), TL.bs, 0.3, TL.bs), skin: rk.still[TL.base], tex: st.sk.tex.p_base, col, cast: true });
          } else if (fx) items.push({ mesh: still ? fx.tower : fx.mine, model: scl(m4.pose(b.x, rise, b.z, yaw), still ? 1.8 : 1, still ? 1.8 : 1, still ? 1.8 : 1), cast: true });
          const tc = b.tm == null || b.tm < 0 ? TINT.gold : b.tm === myTm ? TINT.blueT : TINT.redT;
          if (still) {
            parts.push({ x: b.x, y: TL.glow || TL.bar - 0.6, z: b.z, size: (b.type === 'cor' ? 2 : 1.3) + (atk ? 0.5 : 0) + Math.sin(tsec * 4 + b.id) * 0.1, alpha: atk ? 0.6 : 0.38, type: b.tm === myTm ? 6 : 8 });
            if (Math.random() < 0.12) P3({ x: b.x + R0(-0.4, 0.4), y: (TL.glow || 3) - 0.4, z: b.z + R0(-0.4, 0.4), vy: R0(0.6, 1.4), max: 0.7, s0: 0.3, s1: 0.05, a0: 0.9, type: b.tm === myTm ? 6 : 8 });
            if (b.inv && fx) items.push({ mesh: fx.bubble, model: scl(m4.pose(b.x, 0.2, b.z, tsec * 0.3), b.r * 1.6, b.r * 2.2, b.r * 1.6), blend: 1, alpha: 0.22 });
            ringAt(b.x, b.z, b.r + 0.35, tc, 0.55);
            if (myH && myH.st === 0 && b.tm !== myTm && b.type !== 'cor') { const R0b = E.ROBOTS[b.type].rng; const d = Math.hypot(myH.x - b.x, myH.z - b.z); if (d < R0b + 4) { ringAt(b.x, b.z, R0b, TINT.red, clamp(1 - (d - R0b) / 4, 0.15, 0.9) * (b.tg === myK ? 1 : 0.6)); if (b.tg === myK) discAt(b.x, b.z, R0b, TINT.red, 0.06 + 0.04 * Math.sin(tsec * 10)); } }
          } else if (b.type === 'shp') {
            parts.push({ x: b.x, y: 0.08, z: b.z, size: 4, alpha: 0.35, type: 21, dw: -1 });
            if (Math.random() < 0.4) P3({ x: b.x + R0(-1.2, 1.2), y: hov - 0.2, z: b.z + R0(-1.2, 1.2), vy: R0(-1.5, -0.5), max: 0.5, s0: 0.4, s1: 0.1, a0: 0.8, type: b.ally ? (b.tm === myTm ? 6 : 8) : 10 });
            ringAt(b.x, b.z, b.r + 0.3, b.ally ? tc : TINT.violet, 0.6);
          } else ringAt(b.x, b.z, b.r + 0.1, tc, 0.45);
          if (b.flash > 0 && !still) sparks(b.x, 0.6, b.z, 1, b.tm === myTm ? 6 : 8, 3);
          continue;
        }
        const RS = st.sk && RLOOK[b.type];
        if (RS) {
          const S = st.sk, M = S.d.m[RS.m], C = M.clips, dt = step;
          const P = b.pose || (b.pose = newPose(M.nb));
          const an = b.an || (b.an = { t: Math.random() * 2, mv: 0, ak: null, at: 0, shot: 0 });
          an.t += dt;
          P.q.set(M.restQ); P.t.set(M.restT);
          sampleInto(M, M, null, C[RS.idle], an.t, P, 1);
          const mv = clamp((b.mv || 0) / 2, 0, 1);
          if (mv > 0.02) { an.mv += dt * clamp((b.mv || 0) / 2.6, 0.5, 1.8); sampleInto(M, M, null, C[RS.move], an.mv, P, mv); }
          let act = null;
          if (b.type === 'grunt' && b.wind > 0) act = RS.atk;
          else if (b.type === 'tank' && b.burst > 0) act = RS.shoot;
          else if (b.type === 'bomber' && b.fuse > 0) act = 'hit';
          else if (b.type === 'boss' && b.busy > 0) act = b.act && b.act.k === 'laser' ? RS.shoot : RS.atk;
          if (an.shot > 0) { an.shot -= dt; if (!act) act = RS.shoot || RS.atk; }
          if (!act && b.flash > 0 && C.hit) act = 'hit';
          if (act) { an.at = an.ak === act ? an.at + dt : 0; an.ak = act; const c = C[act] || C[RS.atk]; sampleInto(M, M, null, c, act === 'hit' && b.type === 'bomber' ? an.at % c.dur : an.at, P, act === 'hit' && b.type !== 'bomber' ? 0.7 : 1); } else an.ak = null;
          skinPose(M, P);
          const rise = b.sp > 0 ? -clamp(b.sp / 0.7, 0, 1) * 1.6 : 0;
          const hov = RS.fly ? RS.fly + Math.sin(tsec * 3.2 + b.id) * 0.08 : 0;
          const sq = b.flash > 0 ? 1 + b.flash * 0.6 : 1;
          const Ms = scl(m4.pose(b.x, rise + hov, b.z, b.yaw), RS.h * sq, RS.h / sq, RS.h * sq);
          const stunned = b.stun > 0 || b.stunV, slowed = b.slowT > 0 || b.slowV;
          items.push({ mesh: S.mesh[RS.m], model: Ms, skin: P.S, tex: S.tex['r_' + b.type] || S.tex[RS.t], col: b.flash > 0 ? COLRF : stunned ? COLRI : COLR, cast: true });
          if (stunned) { if (Math.random() < 0.25) P3({ x: b.x + R0(-0.5, 0.5), y: R0(0.6, 1.8), z: b.z + R0(-0.5, 0.5), vy: R0(-0.3, 0.3), max: 0.5, s0: 0.25, s1: 0.05, a0: 1, type: 6 }); }
          else if (slowed && Math.random() < 0.18) P3({ x: b.x + R0(-0.5, 0.5), y: R0(0.2, 1.4), z: b.z + R0(-0.5, 0.5), vy: -0.4, max: 0.6, s0: 0.2, s1: 0.05, a0: 0.9, type: 6 });
          if (RS.fly && b.sp <= 0) parts.push({ x: b.x, y: 0.08, z: b.z, size: RS.h * 0.6, alpha: 0.38, type: 21, dw: -1 });
          if (b.type === 'bomber') { const blink = b.fuse > 0 ? (Math.sin(tsec * 30) > 0 ? 1 : 0.2) : 0.5 + 0.5 * Math.sin(tsec * 6 + b.id); parts.push({ x: b.x, y: RS.h * 0.62 + rise + hov, z: b.z, size: b.fuse > 0 ? 1.3 : 0.6, alpha: 0.35 + blink * 0.5, type: 8 }); }
          if (b.sp <= 0) ringAt(b.x, b.z, b.r + 0.12, team ? TINT.gold : TINT.foe, 0.4);
          continue;
        }
        const RM = robotMesh(b.type);
        if (!RM) continue;
        const rise = b.sp > 0 ? -clamp(b.sp / 0.7, 0, 1) * 1.6 : 0;
        const M = m4.pose(b.x, rise, b.z, b.yaw);
        const mv = clamp((b.mv || 0) / 2.5, 0, 1);
        const ph2 = (b.walk || 0) * (b.type === 'boss' ? 1.1 : 2.4);
        let body;
        if (b.type === 'shooter') { body = mul(M, m4.pose(0, 0.12 + Math.sin(tsec * 3 + b.id) * 0.08, 0, 0, mv * 0.15, 0)); parts.push({ x: b.x, y: 0.7 + rise, z: b.z, size: 0.6, alpha: 0.55, type: 20 }); }
        else if (b.type === 'bomber') {
          const top = mul(M, m4.pose(0, 0.5, 0, 0));
          body = mul(M, m4.pose(0, 0.5, 0, 0, (b.walk || 0) / 0.5, 0));
          items.push({ mesh: RM.leg, model: top, cast: true });
          const blink = b.fuse > 0 ? (Math.sin(tsec * 30) > 0 ? 1 : 0.2) : 0.5 + 0.5 * Math.sin(tsec * 6 + b.id);
          parts.push({ x: b.x, y: 0.5 + 0.64 + rise, z: b.z, size: b.fuse > 0 ? 1.1 : 0.5, alpha: 0.4 + blink * 0.5, type: 8 });
          if (b.fuse > 0) discAt(b.x, b.z, E.ROBOTS.bomber.rad, TINT.red, 0.18 + 0.12 * blink);
        } else if (b.type === 'tank') body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2 * 2)) * 0.02 * mv, 0, 0));
        else if (b.type === 'boss') {
          const lift = b.act && b.act.k === 'stomp' ? 0.4 : 0;
          body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2)) * 0.12 * mv + lift, 0, 0));
          for (const s of [-1, 1]) items.push({ mesh: RM.leg, model: mul(M, m4.pose(s * RM.hip[0], RM.hip[1], 0, 0, Math.sin(ph2) * 0.45 * mv * s, 0)), cast: true });
          parts.push({ x: b.x + Math.sin(b.yaw) * 1.05, y: 2.2 + rise, z: b.z + Math.cos(b.yaw) * 1.05, size: 1.4 + Math.sin(tsec * 6) * 0.2, alpha: 0.5, type: 1 });
        } else {
          const lean = b.wind > 0 ? -0.35 : 0;
          body = mul(M, m4.pose(0, Math.abs(Math.sin(ph2)) * 0.05 * mv, 0, 0, lean + mv * 0.08, 0));
          if (RM.leg) for (const s of [-1, 1]) items.push({ mesh: RM.leg, model: mul(M, m4.pose(s * RM.hip[0], RM.hip[1], 0, 0, Math.sin(ph2) * 0.6 * mv * s, 0)), cast: true });
        }
        items.push({ mesh: RM.body, model: body, cast: true });
        if (b.flash > 0) items.push({ mesh: RM.body, model: body, blend: 3, alpha: 0.55, tint: TINT.white });
        const stunned = b.stun > 0 || b.stunV, slowed = b.slowT > 0 || b.slowV;
        if (stunned) { items.push({ mesh: RM.body, model: body, blend: 3, alpha: 0.42, tint: TINT.ice }); if (Math.random() < 0.25) P3({ x: b.x + R0(-0.5, 0.5), y: R0(0.6, 1.8), z: b.z + R0(-0.5, 0.5), vy: R0(-0.3, 0.3), max: 0.5, s0: 0.25, s1: 0.05, a0: 1, type: 6 }); }
        else if (slowed && Math.random() < 0.18) P3({ x: b.x + R0(-0.5, 0.5), y: R0(0.2, 1.4), z: b.z + R0(-0.5, 0.5), vy: -0.4, max: 0.6, s0: 0.2, s1: 0.05, a0: 0.9, type: 6 });
        if (b.sp <= 0 && (b.type === 'grunt' || b.type === 'tank')) { const fy = Math.sin(b.yaw), fz = Math.cos(b.yaw); const e0 = b.type === 'grunt' ? [0.47, 0.9] : [0.33, 1.14]; parts.push({ x: b.x + fy * e0[0], y: e0[1], z: b.z + fz * e0[0], size: b.wind > 0 || b.burst > 0 ? 0.75 : 0.42, alpha: 0.75, type: 8 }); }
        else if (b.type === 'boss' && b.sp <= 0) { const fy = Math.sin(b.yaw), fz = Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = -Math.sin(b.yaw); for (const sgn of [-1, 1]) parts.push({ x: b.x + fy * 0.95 + rx * sgn * 0.27, y: 2.97, z: b.z + fz * 0.95 + rz * sgn * 0.27, size: 0.5, alpha: 0.8, type: 8 }); }
        if (b.sp <= 0) ringAt(b.x, b.z, b.r + 0.12, TINT.foe, 0.4);
      }
      for (const d of W.drops) {
        const PL = st.sk && PLOOK[d.k], mk = fx && fx[d.k];
        if (!PL && !mk) continue;
        if (d.life < 3 && Math.sin(tsec * 18) < 0) continue;
        const y = 0.55 + Math.sin(tsec * 3 + d.id) * 0.12;
        if (PL && st.sk.mesh[PL.m]) items.push({ mesh: st.sk.mesh[PL.m], model: scl(m4.pose(d.x, y, d.z, tsec * 1.6 + d.id, 0, 0), PL.s, PL.s, PL.s), skin: st.sk.still[PL.m], tex: st.sk.tex['p_' + d.k] || st.sk.tex.p_base, col: COLG, cast: true });
        else items.push({ mesh: mk, model: m4.pose(d.x, y + 0.2, d.z, tsec * 1.6 + d.id, d.k === 'hp' ? 0.25 : 0, 0), cast: true });
        parts.push({ x: d.x, y: 0.35, z: d.z, size: 1.3, alpha: 0.4, type: d.k === 'hp' ? 3 : d.k === 'pw' ? 10 : 7 });
        ringAt(d.x, d.z, 0.6, DROP_TINT[d.k] || TINT.gold, 0.5);
      }
      for (const T of W.turrets) {
        if (fx) items.push({ mesh: fx.tower, model: m4.pose(T.x, 0, T.z, tsec * 0.8), cast: true });
        parts.push({ x: T.x, y: 1.68, z: T.z, size: 1.1 + Math.sin(tsec * 9 + T.id) * 0.2, alpha: 0.7, type: 15 });
        if (T.own === myK) ringAt(T.x, T.z, T.rad, TINT.cyan, 0.18);
        if (T.t < 1.5 && Math.sin(tsec * 16) < 0) parts.push({ x: T.x, y: 1.68, z: T.z, size: 1.6, alpha: 0.5, type: 9 });
      }
      for (const mn of W.mines) {
        if (fx) items.push({ mesh: fx.mine, model: m4.pose(mn.x, 0.005, mn.z, 0), cast: false });
        const blink = mn.arm > 0 ? 0.3 : Math.sin(tsec * 8) > 0 ? 1 : 0.25;
        parts.push({ x: mn.x, y: 0.2, z: mn.z, size: 0.6, alpha: blink, type: 8 });
        if (mn.own === myK) ringAt(mn.x, mn.z, mn.rad, TINT.red, 0.16);
      }
      for (const dc of W.decoys) {
        const fake = { vx: 0, vz: 0, walk: 0, flash: 0, rec: 0, shield: 0 };
        drawHero(fake, dc.hero, dc.x, dc.z, dc.yaw + Math.sin(tsec * 3) * 0.15, { idle: true, tint: TINT.card, tintA: 0.6 });
        ringAt(dc.x, dc.z, 0.75, TINT.gold, 0.3 + 0.2 * Math.sin(tsec * 6));
      }
      for (const s of W.shots) {
        if (s.k === 'rain') {
          const u = clamp(s.t / s.T, 0, 1), dist = Math.hypot(s.x1 - s.x0, s.z1 - s.z0) || 1;
          const pitch = -Math.atan2(5.5 * 4 * (1 - 2 * u) - 0.6, dist);
          if (fx) items.push({ mesh: fx.rocket, model: m4.pose(s.x, s.y, s.z, Math.atan2(s.x1 - s.x0, s.z1 - s.z0), pitch), cast: true });
          if (Math.random() < 0.7) P3({ x: s.x, y: s.y, z: s.z, max: 0.45, s0: 0.35, s1: 0.9, a0: 0.5, type: 11 });
          ringAt(s.x1, s.z1, s.rad, s.own === myK ? TINT.white : TINT.gold, 0.3);
          continue;
        }
        if (s.k === 'rocket') {
          if (fx) items.push({ mesh: fx.rocket, model: m4.pose(s.x, s.y, s.z, Math.atan2(s.vx, s.vz)), cast: true });
          parts.push({ x: s.x - Math.sin(Math.atan2(s.vx, s.vz)) * 0.4, y: s.y, z: s.z - Math.cos(Math.atan2(s.vx, s.vz)) * 0.4, size: 0.5, alpha: 0.9, type: 1 });
          if (Math.random() < 0.6) P3({ x: s.x, y: s.y, z: s.z, max: 0.5, s0: 0.3, s1: 0.8, a0: 0.45, type: 11 });
          continue;
        }
        if (s.k === 'shard') { const sp2 = Math.hypot(s.vx, s.vz) || 1; parts.push({ x: s.x, y: s.y, z: s.z, size: 0.34, alpha: 1, type: 6, dx: s.vx, dy: 0, dz: s.vz, dw: 0.45 + sp2 * 0.02 }); continue; }
        if (s.k === 'lob' || s.k === 'mega') {
          const mk = fx && (s.k === 'mega' ? fx.mega : fx.bomb);
          if (mk) items.push({ mesh: mk, model: m4.pose(s.x, s.y, s.z, s.t * 9, s.t * 7, 0), cast: true });
          discAt(s.x, s.z, (s.k === 'mega' ? 0.7 : 0.38) * (1 - clamp(s.y / 6, 0, 0.6)), TINT.dark, 0.28, 0.03);
          if (Math.random() < 0.6) P3({ x: s.x, y: s.y + 0.3, z: s.z, max: 0.25, s0: 0.25, s1: 0.05, a0: 0.9, type: 1 });
          ringAt(s.x1, s.z1, s.rad, s.own === myK ? TINT.white : TINT.gold, 0.35);
          continue;
        }
        const sp = Math.hypot(s.vx, s.vz) || 1;
        if (s.side === 'r') parts.push({ x: s.x, y: s.y, z: s.z, size: s.k === 'tb' ? 0.62 : 0.5, alpha: 1, type: s.k === 'tb' ? 1 : 8, dx: s.vx, dy: 0, dz: s.vz, dw: 0.5 + sp * 0.03 });
        else if (s.k === 'bolt') parts.push({ x: s.x, y: s.y, z: s.z, size: 0.42, alpha: 1, type: 6, dx: s.vx, dy: 0, dz: s.vz, dw: 0.5 + sp * 0.05 });
        else if (s.k === 'orb') { parts.push({ x: s.x, y: s.y, z: s.z, size: 0.95, alpha: 0.95, type: 3 }); if (Math.random() < 0.5) P3({ x: s.x, y: s.y, z: s.z, vy: 0.4, max: 0.4, s0: 0.3, s1: 0.05, a0: 0.8, type: 3 }); }
        else parts.push({ x: s.x, y: s.y, z: s.z, size: s.k === 'wave' ? 0.5 : 0.36, alpha: 1, type: s.k === 'wave' ? 7 : 1, dx: s.vx, dy: 0, dz: s.vz, dw: 0.36 + sp * 0.02 });
      }
      for (const z of W.zones) {
        if (z.k === 'boom') continue;
        if (z.k === 'laser') {
          const ux0 = Math.sin(z.a), uz0 = Math.cos(z.a);
          if (z.t > 0) { const reach = E.rayWall(A, z.x, z.z, ux0, uz0, z.len); if (fx) items.push({ mesh: fx.strip, model: scl(m4.pose(z.x, 0.05, z.z, z.a), 1.6, 1, reach), blend: 3, alpha: 0.25 + 0.15 * Math.sin(tsec * 20), tint: TINT.red }); }
          else if (z.cur != null && fx) {
            const L = z.reach || z.len;
            items.push({ mesh: fx.beamR, model: scl(m4.pose(z.x, 1.5, z.z, z.cur), 0.6, 0.6, L), blend: 2, alpha: 0.9 });
            items.push({ mesh: fx.beamW, model: scl(m4.pose(z.x, 1.5, z.z, z.cur), 0.22, 0.22, L), blend: 2, alpha: 0.9 });
            const ux = Math.sin(z.cur), uz = Math.cos(z.cur);
            if (Math.random() < 0.7) sparks(z.x + ux * L, 0.4, z.z + uz * L, 2, 8, 6);
            parts.push({ x: z.x + ux * L, y: 0.4, z: z.z + uz * L, size: 1.4, alpha: 0.8, type: 8 });
          }
          continue;
        }
        const u = clamp(1 - z.t / 1.4, 0, 1);
        discAt(z.x, z.z, z.r, TINT.red, 0.1 + 0.22 * u);
        discAt(z.x, z.z, z.r * u, TINT.red, 0.16);
        ringAt(z.x, z.z, z.r, TINT.red, 0.75);
        if (z.k === 'mis' && z.t < 0.5 && fx) items.push({ mesh: fx.missile, model: m4.pose(z.x, z.t * 26, z.z, 0, Math.PI, 0), cast: false });
      }
      for (let i = g.beams.length - 1; i >= 0; i--) {
        const bm = g.beams[i];
        bm.t += step;
        if (bm.t >= bm.max) { g.beams.splice(i, 1); continue; }
        const f = 1 - bm.t / bm.max;
        if (fx) { items.push({ mesh: fx.beamB, model: scl(m4.pose(bm.x, 0.95, bm.z, bm.a), 1.1 * f + 0.2, 1.1 * f + 0.2, bm.len), blend: 2, alpha: f }); items.push({ mesh: fx.beamW, model: scl(m4.pose(bm.x, 0.95, bm.z, bm.a), 0.35 * f, 0.35 * f, bm.len), blend: 2, alpha: f }); }
      }
      for (let i = g.tbeams.length - 1; i >= 0; i--) {
        const bm = g.tbeams[i];
        bm.t += step || 0.016;
        if (bm.t >= bm.max) { g.tbeams.splice(i, 1); continue; }
        if (!fx) continue;
        const f = 1 - bm.t / bm.max;
        const dx = bm.tx - bm.x, dz = bm.tz - bm.z, L = Math.hypot(dx, dz) || 1, dy = bm.y0 - 1;
        const yaw = Math.atan2(dx, dz), pitch = Math.atan2(dy, L), len = Math.hypot(L, dy);
        const w = (0.55 * f + 0.15) * (bm.w || 1);
        items.push({ mesh: bm.tm !== myTm ? fx.beamR : fx.beamB, model: scl(m4.pose(bm.x, bm.y0, bm.z, yaw, pitch), w, w, len), blend: 2, alpha: f });
        items.push({ mesh: fx.beamW, model: scl(m4.pose(bm.x, bm.y0, bm.z, yaw, pitch), w * 0.35, w * 0.35, len), blend: 2, alpha: f });
      }
      if (myH && myH.st === 0 && fx) {
        const A0 = g.aim;
        const H = E.HEROES[myH.key];
        let show = null;
        if (A0.on && A0.eng) show = { kind: A0.kind, a: A0.a, mag: A0.mag };
        else if (g.mouse && !TOUCHY) show = { kind: 'atk', a: g.mouse.a, mag: clamp(g.mouse.d / (H.atk.rng || 10), 0, 1) };
        if (show) {
          const S = show.kind === 'sup' ? H.sup : H.atk;
          const tint = show.kind === 'sup' ? TINT.gold : TINT.white;
          const al = show.kind === 'sup' ? 0.42 : 0.3;
          const ux = Math.sin(show.a), uz = Math.cos(show.a);
          if (S.k === 'spread' || S.k === 'wave') items.push({ mesh: S.k === 'wave' ? fx.fanWave : fx.fanBlaze, model: scl(m4.pose(myH.x, 0.04, myH.z, show.a), S.rng, 1, S.rng), blend: 3, alpha: al, tint });
          else if (S.k === 'bolt' || S.k === 'orb' || S.k === 'beam' || S.k === 'blade') { const reach = E.rayWall(A, myH.x, myH.z, ux, uz, S.rng); items.push({ mesh: fx.strip, model: scl(m4.pose(myH.x, 0.04, myH.z, show.a), S.k === 'beam' ? 1.9 : S.k === 'orb' ? 1.5 : S.k === 'blade' ? 1.1 : 0.7, 1, reach), blend: 3, alpha: al, tint }); }
          else if (S.k === 'blink') { const d = A0.on && A0.eng ? Math.max(2, show.mag * S.rng) : S.rng; const reach = Math.max(0.6, E.rayWall(A, myH.x, myH.z, ux, uz, d) - 0.35); items.push({ mesh: fx.strip, model: scl(m4.pose(myH.x, 0.04, myH.z, show.a), S.w * 2, 1, reach), blend: 3, alpha: al, tint }); discAt(myH.x + ux * reach, myH.z + uz * reach, S.rad, tint, al * 0.6); ringAt(myH.x + ux * reach, myH.z + uz * reach, S.rad, tint, 0.9); }
          else if (S.k === 'lob' || S.k === 'mega') {
            const d = Math.max(1.5, show.mag * S.rng);
            const tx = myH.x + ux * d, tz = myH.z + uz * d;
            discAt(tx, tz, S.rad, tint, al * 0.7); ringAt(tx, tz, S.rad, tint, 0.9);
            for (let j = 1; j < 9; j++) { const u = j / 9; parts.push({ x: myH.x + ux * d * u, y: 0.9 + (S.k === 'mega' ? 4.2 : 3.2) * 4 * u * (1 - u) * 0.6, z: myH.z + uz * d * u, size: 0.28, alpha: 0.8, type: 9 }); }
          } else if (S.k === 'bloom') { discAt(myH.x, myH.z, S.rad, TINT.mint, 0.18); ringAt(myH.x, myH.z, S.rad, TINT.mint, 0.85); }
        }
        if (myH.sup >= 1) parts.push({ x: myH.x, y: 0.15, z: myH.z, size: 1.6 + Math.sin(tsec * 6) * 0.15, alpha: 0.35, type: 7, dw: -1 });
      }

      let fx0 = null;
      let Dz0 = 20;
      const fl = followRef.current;
      let kcam = null;
      if (g.kill) {
        if (now - g.kill.at < 2300) { const kb = g.kill.by != null ? W.robots.find((r) => r.id === g.kill.by) : null; if (kb) { g.kill.x = kb.x; g.kill.z = kb.z; } const kh = g.kill.hero ? W.heroes[g.kill.hero] : null; if (kh && kh.st === 0) { g.kill.x = kh.x; g.kill.z = kh.z; } kcam = g.kill; }
        else { g.kill = null; setKill(null); }
      }
      g.zoom = (g.zoom || 1) + ((kcam ? 0.58 : window.__zfake && window.__zsiegeZoom ? window.__zsiegeZoom : 1) - (g.zoom || 1)) * (1 - Math.exp(-dt * (kcam ? 5 : 3)));
      if (kcam) fx0 = { x: kcam.x, z: kcam.z, id: null };
      else if (team && myH) fx0 = myH;
      else if (myH && (myH.st !== 2 || !W.order.some((k) => W.heroes[k].st !== 2))) fx0 = myH;
      else fx0 = (fl && W.heroes[fl] && W.heroes[fl].st !== 2 ? W.heroes[fl] : null) || W.order.map((k) => W.heroes[k]).find((h) => h.st !== 2) || myH || W.heroes[W.order[0]];
      if (fx0 && fx0.id && fx0 !== myH && fx0.id !== camKRef.current) { camKRef.current = fx0.id; setCamK(fx0.id); }
      const tx0 = fx0 ? fx0.x : A.wx / 2, tz0 = fx0 ? fx0.z : A.wz / 2;
      const asp = cw / Math.max(1, ch);
      const Dz = (team ? (asp >= 1.5 ? 17.5 : asp >= 1.1 ? 20.5 : 26) : asp >= 1.5 ? 15.5 : asp >= 1.1 ? 18.5 : 24) * (g.zoom || 1);
      Dz0 = Dz;
      const halfW = Math.tan(0.36) * Dz * asp * 0.92;
      const sgn = g.flip ? -1 : 1;
      const cxT = team ? clamp(tx0, 5, A.wx - 5) : clamp(tx0, Math.min(A.wx / 2, halfW - 3), Math.max(A.wx / 2, A.wx - halfW + 3));
      const czT = team ? clamp(tz0 + 0.6 * sgn, 5, A.wz - 5) : clamp(tz0 + 0.6, 8.5, A.wz - Dz * 0.36);
      if (!g.cam || !g.cam.tx) g.cam = { tx: cxT, tz: czT };
      const kc = 1 - Math.exp(-dt * 6);
      g.cam.tx += (cxT - g.cam.tx) * kc; g.cam.tz += (czT - g.cam.tz) * kc;
      g.shake = Math.max(0, g.shake - dt * 2.2);
      const sh = hudOptRef.current.shake ? g.shake * g.shake * 0.5 : 0;
      const sx = (Math.random() - 0.5) * sh, sz = (Math.random() - 0.5) * sh;
      const Pp = 0.98;
      const cam = { pos: [g.cam.tx + sx, Math.sin(Pp) * Dz, g.cam.tz + sgn * Math.cos(Pp) * Dz + sz], at: [g.cam.tx + sx, 0, g.cam.tz + sz], fov: 0.72, shadowAt: [g.cam.tx, 0, g.cam.tz - 2 * sgn] };
      if (window.__zfake && window.__zsiegeCam) Object.assign(cam, window.__zsiegeCam);
      g.cam.pos = cam.pos; g.cam.at = cam.at;
      const VP = st.R.render({ env: st.arena.env, cam, items, parts });
      g.VP = VP; g.invVP = null;

      if (ov) {
        const c2 = ov.getContext('2d');
        c2.setTransform(odpr, 0, 0, odpr, 0, 0);
        c2.clearRect(0, 0, cw, ch);
        const proj = (x, y, z) => { const p = m4.apply(VP, x, y, z); if (p[3] <= 0) return null; return [(p[0] * 0.5 + 0.5) * cw, (0.5 - p[1] * 0.5) * ch]; };
        const rr = (x, y, w, h, r) => { c2.beginPath(); c2.moveTo(x + r, y); c2.arcTo(x + w, y, x + w, y + h, r); c2.arcTo(x + w, y + h, x, y + h, r); c2.arcTo(x, y + h, x, y, r); c2.arcTo(x, y, x + w, y, r); c2.closePath(); };
        const bar = (x, y, w, h, f, col, back = 'rgba(12,10,26,0.82)') => { rr(x - 1.5, y - 1.5, w + 3, h + 3, (h + 3) / 2); c2.fillStyle = back; c2.fill(); if (f > 0) { rr(x, y, Math.max(h, w * f), h, h / 2); c2.fillStyle = col; c2.fill(); c2.fillStyle = 'rgba(255,255,255,0.28)'; rr(x + 1, y + 1, Math.max(h - 2, w * f - 2), h * 0.38, h * 0.2); c2.fill(); } };
        const txt = (s, x, y, size, col, al = 'center') => { c2.font = `900 ${size}px ${FONT}`; c2.textAlign = al; c2.textBaseline = 'middle'; c2.lineJoin = 'round'; c2.lineWidth = Math.max(2.5, size * 0.24); c2.strokeStyle = 'rgba(16,10,30,0.92)'; c2.strokeText(s, x, y); c2.fillStyle = col; c2.fillText(s, x, y); };
        if (team) for (const b of W.robots) {
          const TL = TLOOK[b.type];
          if (!TL || b.hp <= 0) continue;
          const still = E.STILL_TYPES.has(b.type);
          if (!still && (!hudOptRef.current.bars || b.sp > 0)) continue;
          const p = proj(b.x, TL.bar + (b.type === 'shp' ? TL.y : 0), b.z);
          if (!p || p[0] < -60 || p[0] > cw + 60 || p[1] < -30 || p[1] > ch + 30) continue;
          if (b.type === 'shp') {
            const wild = !b.ally;
            bar(p[0] - 60, p[1], 120, 9, clamp(b.hp / b.max, 0, 1), wild ? '#B88CFF' : b.tm === myTm ? '#4DA3FF' : '#FF4A3D');
            txt(wild ? 'Hive Ship' : b.tm === myTm ? 'Our Hive Ship' : 'Their Hive Ship', p[0], p[1] - 10, 11.5, wild ? '#E4D8FF' : '#FFFFFF');
            continue;
          }
          const w = TL.w || 60, hh = still ? 8 : 4.5;
          const col = b.inv ? '#9AA4B2' : b.tm === myTm ? '#4DA3FF' : '#FF4A3D';
          bar(p[0] - w / 2, p[1], w, hh, clamp(b.hp / b.max, 0, 1), col);
          if (still) txt(b.inv ? 'Protected' : fmtK(b.hp), p[0], p[1] - 9, 10, b.inv ? '#D8DEE6' : '#FFFFFF');
        }
        if (hudOptRef.current.bars) for (const b of W.robots) {
          if (b.hp <= 0 || b.sp > 0 || b.type === 'boss' || (team && TLOOK[b.type])) continue;
          const RB = st.sk && RLOOK[b.type];
          const p = proj(b.x, RB ? RB.h + (RB.fly || 0) + 0.12 : b.type === 'tank' ? 1.75 : b.type === 'shooter' ? 2.0 : 1.7, b.z);
          if (!p) continue;
          const w = b.type === 'tank' ? 52 : 40;
          bar(p[0] - w / 2, p[1], w, 5.5, clamp(b.hp / b.max, 0, 1), '#FF4A3D');
        }
        for (const id of W.order) {
          const h = W.heroes[id];
          if (!h || h.st === 2) continue;
          const isMe = id === myK;
          if (team && h.tm !== myTm && !E.seenBy(W, h, myTm)) continue;
          const p = proj(h.x, 2.05, h.z);
          if (!p) continue;
          if (team && h.st === 0) {
            const w = 58;
            bar(p[0] - w / 2 + 8, p[1], w, 10, clamp(h.hp / h.max, 0, 1), isMe ? '#5BE35B' : h.tm === myTm ? '#3D9BFF' : '#FF4A3D');
            if ((h.shield || 0) > 0) { rr(p[0] - w / 2 + 8, p[1] - 3, w * clamp(h.shield / h.max, 0, 1), 2.5, 1); c2.fillStyle = '#E8F4FF'; c2.fill(); }
            c2.fillStyle = 'rgba(12,10,26,0.9)'; c2.beginPath(); c2.arc(p[0] - w / 2 - 2, p[1] + 5, 9, 0, Math.PI * 2); c2.fill();
            c2.strokeStyle = h.tm === myTm ? '#3D8BFF' : '#FF4D5E'; c2.lineWidth = 2; c2.stroke();
            txt(String(h.tl || 1), p[0] - w / 2 - 2, p[1] + 5.5, 10, '#FFE15A');
            txt(h.hp >= 100000 ? fmtK(h.hp) : String(Math.ceil(h.hp)), p[0] + 8, p[1] + 5, 9.5, '#FFFFFF');
            txt(isMe ? 'You' : nameOf(id), p[0] + 8, p[1] - 9, 11, isMe ? '#C9FFC0' : h.tm === myTm ? '#D8EAFF' : '#FFC9CF');
            if (isMe) for (let i = 0; i < 3; i++) { const f = clamp(h.ammo - i, 0, 1); bar(p[0] - w / 2 + 8 + i * (w / 3 + 0.5), p[1] + 14, w / 3 - 3, 4.5, f, f >= 1 ? '#FF9F1A' : '#B06A14'); }
            if (isMe && (h.recT || 0) > 0) { const f = clamp(1 - h.recT / 4.5, 0, 1); bar(p[0] - 40, p[1] + 24, 80, 6, f, '#9F8CFF'); txt('Going home', p[0], p[1] + 38, 11, '#E4DCFF'); }
            continue;
          }
          if (h.st === 0) {
            const w = 58;
            bar(p[0] - w / 2, p[1], w, 10, clamp(h.hp / h.max, 0, 1), isMe ? '#5BE35B' : '#3D9BFF');
            txt(h.hp >= 100000 ? fmtK(h.hp) : String(Math.ceil(h.hp)), p[0], p[1] + 5, 9.5, '#FFFFFF');
            if (!isMe || !solo) txt(isMe ? 'You' : nameOf(id), p[0], p[1] - 9, 11, isMe ? '#C9FFC0' : '#D8EAFF');
            if (isMe) for (let i = 0; i < 3; i++) { const f = clamp(h.ammo - i, 0, 1); bar(p[0] - w / 2 + i * (w / 3 + 0.5), p[1] + 14, w / 3 - 3, 4.5, f, f >= 1 ? '#FF9F1A' : '#B06A14'); }
            if (h.pw > 0) txt('Power', p[0], p[1] - (isMe && solo ? 9 : 21), 9.5, '#FF8AE0');
          } else {
            const q = proj(h.x, 0.4, h.z) || p;
            c2.lineWidth = 5; c2.strokeStyle = 'rgba(12,10,26,0.75)'; c2.beginPath(); c2.arc(q[0], q[1] - 24, 17, 0, Math.PI * 2); c2.stroke();
            c2.strokeStyle = '#6CFFD4'; c2.beginPath(); c2.arc(q[0], q[1] - 24, 17, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(h.rv, 0, 1)); c2.stroke();
            txt(String(Math.ceil(h.downT)), q[0], q[1] - 24, 13, '#FF9C8F');
            txt(isMe ? 'Wait for a friend' : `Revive ${nameOf(id)}`, q[0], q[1] - 50, 11.5, '#BFFFEA');
          }
          if (!isMe && h.st === 1 && (p[0] < 0 || p[0] > cw || p[1] < 0 || p[1] > ch)) {
            const ex = clamp(p[0], 26, cw - 26), ey = clamp(p[1], 80, ch - 26);
            c2.fillStyle = 'rgba(12,10,26,0.8)'; c2.beginPath(); c2.arc(ex, ey, 16, 0, Math.PI * 2); c2.fill();
            txt('+', ex, ey + 1, 18, '#6CFFD4');
          }
        }
        for (let i = g.nums.length - 1; i >= 0; i--) {
          const n = g.nums[i];
          n.t += dt;
          if (n.t >= n.life) { g.nums.splice(i, 1); continue; }
          const p = proj(n.x, n.y + n.t * 1.6, n.z);
          if (!p) continue;
          const u = n.t / n.life;
          const sc = u < 0.12 ? 0.6 + (u / 0.12) * 0.6 : 1.2 - Math.min(0.2, (u - 0.12) * 0.8);
          c2.globalAlpha = u > 0.7 ? (1 - u) / 0.3 : 1;
          txt(n.text, p[0], p[1], (n.big ? 19 : 14.5) * sc, n.col);
          c2.globalAlpha = 1;
        }
      }
      const mc = mapRef.current;
      if (mc && W && team && (g.mapN = (g.mapN || 0) + 1) % 2 === 0) {
        const MW = cw > ch ? 124 : 108, md = Math.min(2, window.devicePixelRatio || 1);
        if (mc.width !== Math.round(MW * md) || mc.height !== Math.round(MW * md)) { mc.width = Math.round(MW * md); mc.height = Math.round(MW * md); mc.style.width = `${MW}px`; mc.style.height = `${MW}px`; }
        if (!st.mini || st.mini.key !== `${A.key}:${myTm}`) st.mini = { key: `${A.key}:${myTm}`, oc: teamMiniBase(A, myTm) };
        const m2 = mc.getContext('2d');
        m2.setTransform(md, 0, 0, md, 0, 0);
        m2.clearRect(0, 0, MW, MW);
        m2.imageSmoothingEnabled = false;
        drawTeamMini(m2, A, W, myK, st.mini.oc, g.flip, MW);
        if (g.cam && g.cam.tx != null) { const sx = MW / A.wx; const hw = Math.tan(0.36) * Dz0 * (cw / Math.max(1, ch)), hh = Dz0 * 0.55; const cxm = g.flip ? MW - g.cam.tx * sx : g.cam.tx * sx, czm = g.flip ? MW - g.cam.tz * sx : g.cam.tz * sx; m2.strokeStyle = 'rgba(255,255,255,0.6)'; m2.lineWidth = 1; m2.strokeRect(cxm - hw * sx, czm - hh * 1.1 * sx, hw * 2 * sx, hh * 1.6 * sx); }
      } else if (mc && W && !team && (g.mapN = (g.mapN || 0) + 1) % 2 === 0) {
        const MW = 104, MH = Math.round(MW * (A.H / A.W)), md = Math.min(2, window.devicePixelRatio || 1);
        if (mc.width !== Math.round(MW * md)) { mc.width = Math.round(MW * md); mc.height = Math.round(MH * md); mc.style.width = `${MW}px`; mc.style.height = `${MH}px`; }
        if (!st.mini || st.mini.key !== A.key) {
          const oc = document.createElement('canvas'); oc.width = A.W * 4; oc.height = A.H * 4;
          const o2 = oc.getContext('2d');
          o2.fillStyle = 'rgba(14,16,26,0.72)'; o2.fillRect(0, 0, oc.width, oc.height);
          const CC = { [E.C_WALL]: 'rgba(205,195,170,0.9)', [E.C_CRATE]: 'rgba(170,140,100,0.95)', [E.C_WATER]: 'rgba(70,150,210,0.9)', [E.C_BUSH]: 'rgba(80,170,70,0.75)', [E.C_PAD]: 'rgba(255,120,50,0.9)', [E.C_HOME]: 'rgba(80,170,255,0.9)' };
          for (let r = 0; r < A.H; r++) for (let c = 0; c < A.W; c++) { const v = A.cells[r * A.W + c]; if (CC[v]) { o2.fillStyle = CC[v]; o2.fillRect(c * 4, r * 4, 4, 4); } }
          st.mini = { key: A.key, oc };
        }
        const m2 = mc.getContext('2d');
        m2.setTransform(md, 0, 0, md, 0, 0);
        m2.clearRect(0, 0, MW, MH);
        m2.imageSmoothingEnabled = false;
        m2.drawImage(st.mini.oc, 0, 0, MW, MH);
        const sx = MW / A.wx, sz = MH / A.wz;
        if (g.cam && g.cam.tx != null) { const hw = Math.tan(0.36) * Dz0 * (cw / Math.max(1, ch)), hh = Dz0 * 0.55; m2.strokeStyle = 'rgba(255,255,255,0.55)'; m2.lineWidth = 1; m2.strokeRect((g.cam.tx - hw) * sx, (g.cam.tz - hh * 1.1) * sz, hw * 2 * sx, hh * 1.6 * sz); }
        for (const d of W.drops) { m2.fillStyle = '#FFE15A'; m2.fillRect(d.x * sx - 1, d.z * sz - 1, 2, 2); }
        for (const b of W.robots) { if (b.hp <= 0) continue; const R1 = b.type === 'boss' ? 3.2 : b.type === 'tank' ? 2.2 : 1.6; m2.fillStyle = b.type === 'boss' ? '#FF2A1A' : '#FF5A4E'; m2.beginPath(); m2.arc(b.x * sx, b.z * sz, R1, 0, Math.PI * 2); m2.fill(); }
        W.order.forEach((k, i) => { const h = W.heroes[k]; if (!h || h.st === 2) return; const me0 = k === myK; m2.fillStyle = h.st === 1 ? '#6CFFD4' : me0 ? '#7BF27B' : SLOT_COLS[i % SLOT_COLS.length]; m2.strokeStyle = '#0E1018'; m2.lineWidth = 1; m2.beginPath(); m2.arc(h.x * sx, h.z * sz, me0 ? 2.8 : 2.2, 0, Math.PI * 2); m2.fill(); m2.stroke(); });
      }
      if (hurtRef.current) { g.hurtT = Math.max(0, g.hurtT - dt); hurtRef.current.style.opacity = String(clamp(g.hurtT / 0.4, 0, 1) * 0.85 + (myH && myH.st === 0 && myH.hp < myH.max * 0.3 ? 0.25 + 0.15 * Math.sin(tsec * 6) : 0)); }
      if (myH) {
        const arcs = ammoRef.current;
        const am = myH.mods ? myH.mods.ammo : 3;
        for (let i = 0; i < am; i++) { const el = arcs[i]; if (el) { const f = clamp(myH.ammo - i, 0, 1); const L = Number(el.dataset.l) || 66; el.style.strokeDashoffset = String(L * (1 - f)); el.style.stroke = f >= 1 ? '#FFFFFF' : 'rgba(255,255,255,0.45)'; } }
        if (supRing.current) supRing.current.style.strokeDashoffset = String(220 * (1 - clamp(myH.sup, 0, 1)));
      }
      if (now - g.hudAt > 125) {
        g.hudAt = now;
        const boss = W.robots.find((b) => b.type === 'boss' && b.hp > 0);
        const team = W.order.map((k) => { const h = W.heroes[k]; return { id: k, key: h.key, hp: Math.ceil(h.hp), max: h.max, st: h.st, dt: Math.ceil(h.downT) }; });
        const meH = W.heroes[myK];
        if (W.mode === 'team') {
          const allies = W.order.filter((k) => W.heroes[k] && W.heroes[k].tm === myTm).map((k) => { const h = W.heroes[k]; return { id: k, key: h.key, hp: Math.ceil(h.hp), max: h.max, st: h.st, dt: Math.ceil(h.respT || 0) }; });
          const tmH = teamHudOf(W, myK);
          setHud({ wave: 0, st: 'fight', t: 0, left: 0, score: 0, team: allies, boss: null, tm: tmH, me: meH ? { team: true, st: meH.st, sup: meH.sup >= 1, dt: 0, key: meH.key, pw: false, gad: meH.gad, gadCD: Math.ceil(meH.gadCD * 10) / 10, dashCD: Math.ceil(meH.dashCD * 10) / 10, dashMax: E.DASH.cd * meH.mods.dashCd, oc: meH.ocT > 0, rf: false, sp: meH.spT > 0 || meH.sprT > 0, sh: meH.shield > 0, ammoMax: meH.mods.ammo, lv: meH.lv, cards: meH.cards.length, sk: meH.sk, skCD: tmH.skCD, skMax: tmH.skMax, clk: (meH.clkT || 0) > 0 } : null });
          return;
        }
        setHud({ wave: W.wave.n, st: W.wave.st, t: Math.ceil(W.wave.t), left: W.wave.left, score: W.score, team, boss: boss ? { hp: boss.hp, max: boss.max } : null, me: meH ? { st: meH.st, sup: meH.sup >= 1, dt: Math.ceil(meH.downT), key: meH.key, pw: meH.pw > 0, gad: meH.gad, gadCD: Math.ceil(meH.gadCD * 10) / 10, dashCD: Math.ceil(meH.dashCD * 10) / 10, dashMax: E.DASH.cd * meH.mods.dashCd, oc: meH.ocT > 0, rf: meH.rfT > 0, sp: meH.spT > 0, sh: meH.shield > 0, ammoMax: meH.mods.ammo, lv: meH.lv, cards: meH.cards.length, clk: (meH.clkT || 0) > 0 } : null });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const finish = () => { Sfx.stopAll(); onClose(); };
  const leave = () => { if (phase === 'play' && !solo && !watch) { setLeaveAsk(true); return; } finish(); };
  useBackClose(true, () => { if (layEd) { layEnd('siege', false); setLayEd(false); setCtl(true); } else if (chatOpen) setChatOpen(false); else if (board) setBoard(false); else if (mapSheet) setMapSheet(false); else if (powSheet) setPowSheet(false); else if (ctl) setCtl(false); else if (optSheet) setOptSheet(false); else if (arenaSheet) setArenaSheet(false); else if (people) setPeople(false); else if (quick) setQuick(false); else if (leaveAsk) setLeaveAsk(false); else if (paused) setPaused(false); else if (phase === 'play' && solo) setPaused(true); else leave(); });
  const sendEmote = (e) => { setBubbles((p) => ({ ...p, [kindOf()]: { e, at: Date.now() } })); if (!solo) relay.send('emo', { e }); setQuick(false); zap('pop', 0.5); };
  useEffect(() => {
    if (!Object.keys(bubbles).length) return undefined;
    const t = setTimeout(() => setBubbles((p) => { const n = {}; for (const k of Object.keys(p)) if (Date.now() - p[k].at < 2200) n[k] = p[k]; return n; }), 2300);
    return () => clearTimeout(t);
  }, [bubbles]);
  useEffect(() => { if (phase === 'menu') { Sfx.init(); boltLoad(); Sfx.music('lobbySiege', true); } else if (phase === 'play') Sfx.music('siege', true); else Sfx.music(null, false); }, [phase]);
  useEffect(() => () => Sfx.music(null, false), []);
  useEffect(() => { if (paused || phase !== 'play') { J.reset(); G.current.aim = { on: false }; setAimUi(null); } }, [paused, phase]);

  const talkOn = !solo && !watch;
  const talking = useTalking(!solo, relay.muted);
  const micOf = (k) => (k === kindOf() ? relay.mic.on : !!relay.mics[k]);
  const hb = 38;
  const playing = inGame() && phase === 'play';
  const rowBtns = [
    talkOn && <GHudBtn key="mic" icon={relay.mic.on ? 'mic' : 'micoff'} on={relay.mic.on} size={hb} label={relay.mic.on ? 'Turn your mic off' : 'Turn your mic on'} onPress={relay.toggleMic} />,
    !solo && <GHudBtn key="ppl" icon="people" on={people} size={hb} label="Players and voice" badge={roster.length > 1 ? roster.length : null} onPress={() => { setQuick(false); setPeople(true); }} />,
    talkOn && <GHudBtn key="chat" icon="chat" size={hb} label="Chat" badge={chatNew || null} onPress={() => { setQuick(false); setChatNew(0); setChatOpen(true); }} />,
    talkOn && <GHudBtn key="emo" icon="smile" on={quick} tone="#F5AE1E" size={hb} label="Emojis" onPress={() => setQuick((v) => !v)} />,
    playing && <GHudBtn key="gear" icon="gear" size={hb} label="Settings" onPress={() => { setQuick(false); if (solo) setPaused(true); setCtl(true); }} />,
    <GHudBtn key="x" icon={solo && phase === 'play' ? 'pause' : 'close'} size={hb} label={solo && phase === 'play' ? 'Pause' : 'Leave the game'} onPress={() => (solo && phase === 'play' ? setPaused(true) : leave())} />,
  ].filter(Boolean);
  const hostName = names[room && room.host] || 'The host';
  const best = Number(readPref(BEST_KEY(uid, arena, lv), '0')) || 0;
  const H0 = E.HEROES[heroKey];
  const toggleWatch = () => { setWatchAllowed(!allowWatch); kitTap(); };
  const meHud = hud.me;
  const g0 = G.current;
  const ids0 = phase === 'menu' ? [] : g0.ids;

  const soloTeamPanel = solo && mode === 'team' && !watch ? (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13.5, fontWeight: 900 }}>Teams</span>
              <TeamSlots list={[{ id: 'me', tm: sideOf.me === 1 ? 1 : 0, n: 'You', h: heroKey }]} ts={ts} thumbs={thumbs} myK="me" canSwap onSwap={switchSide} botsOn />
            </GPanel>
  ) : null;
  const squadPanel = !solo ? (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900, flex: 1 }}>{mode === 'team' ? 'Teams' : watch ? 'Squad' : `Squad ${roster.length} of ${E.SQUAD_MAX}`}</span>
                {watchers.length > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#CFE6FF' }}><GIcon k="eye" size={14} color="#CFE6FF" />{`${watchers.length} watching`}</span>}
              </div>
              {mode === 'team' ? (
                <>
                  <TeamSlots list={roster.map((k) => ({ id: k, tm: sideOf[k] === 1 ? 1 : 0, n: k === kindOf() ? 'You' : names[k] || 'Friend', h: k === kindOf() ? heroKey : validHero(heroOf[k]) }))} ts={Math.max(ts, Math.ceil(roster.length / 2))} thumbs={thumbs} myK={kindOf()} hostId={room && room.host} canSwap={!watch} onSwap={switchSide} botsOn />
                  {isHost && onInvite && !watch && roster.length < Math.min(E.SQUAD_MAX, 10) && <GPill text="Invite" icon="plus" color="gold" small wide onPress={() => onInvite(roster.length, GS.side)} />}
                </>
              ) : E.SQUAD_MAX > 10 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    {roster.slice(0, 9).map((k, i) => { const isMe = k === kindOf(); const hk = isMe ? heroKey : validHero(heroOf[k]); return <span key={k} title={isMe ? 'You' : names[k] || 'Friend'} style={{ width: 30, height: 30, marginLeft: i ? -7 : 0, borderRadius: 15, overflow: 'hidden', flexShrink: 0, background: '#141A2C', boxShadow: `0 0 0 2px ${heroTint(hk, isMe ? heroCol : colOf[k] | 0)}` }}>{thumbs[hk] ? <img src={thumbs[hk]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>; })}
                    {roster.length > 9 && <span style={{ marginLeft: 6, fontSize: 12.5, fontWeight: 900 }}>{`+${roster.length - 9}`}</span>}
                  </div>
                  <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{botN > 0 && isHost ? (Math.min(botN, E.SQUAD_MAX - roster.length) === 1 ? 'A bot fills 1 spot' : `Bots fill ${Math.min(botN, E.SQUAD_MAX - roster.length)} spots`) : ''}</span>
                  {isHost && onInvite && !watch && roster.length < E.SQUAD_MAX && <GPill text="Invite" icon="plus" color="gold" small onPress={() => onInvite(roster.length, GS.side)} />}
                </div>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', justifyItems: 'center', rowGap: 4 }}>
                  {Array.from({ length: E.SQUAD_MAX }, (_, i) => {
                    const k = roster[i];
                    if (!k) return <GSlot key={`e${i}`} size={34} empty name={isHost && onInvite && !watch ? 'Invite' : botN > i - roster.length && isHost ? 'Bot' : 'Open'} label="Invite a friend" onPress={isHost && onInvite && !watch ? () => onInvite(roster.length, GS.side) : null} />;
                    const isMe = k === kindOf();
                    const hk = isMe ? heroKey : validHero(heroOf[k]);
                    return <GSlot key={k} size={34} art={thumbs[hk] ? <img src={thumbs[hk]} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ width: 26, height: 26, borderRadius: 13, background: SLOT_COLS[i] }} />} name={isMe ? 'You' : names[k] || 'Friend'} ring={SLOT_COLS[i]} talk={micOf(k)} muted={!!relay.muted[k]} label={isMe ? 'You' : `${names[k] || 'Friend'}, voice and volume`} onPress={!isMe && !watch ? () => setPeople(true) : null} />;
                  })}
                </div>
              )}
              {!watch && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text={relay.mic.on ? 'Mic off' : 'Talk with mic'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} style={{ flex: 1 }} />
                  <GPill text="Voice" icon="people" color="white" small onPress={() => setPeople(true)} />
                </div>
              )}
              {!watch && relay.mic.err && <div style={{ fontSize: 12, fontWeight: 800, color: '#FF9C9C' }}>{relay.mic.err}</div>}
            </GPanel>
  ) : null;
  const lobbyUi = phase !== 'menu' ? null : (
    <GLobby GS={GS} title="Bolt War" onClose={finish} closeLabel={solo ? 'Leave' : 'Back to chat'} tint="rgba(8,10,22,0.62)"
      sub={watch ? `Watching ${hostName} and friends` : null}
      badge={best && mode !== 'team' ? <GChip style={{ height: 34, gap: 6 }}><GIcon k="crown" size={14} color="#FFD84E" />{`Best wave ${best}`}</GChip> : null}
      tools={(
        <>
          {!solo && !watch && <GBtn icon="chat" color="dark" size={42} fast={false} label="Chat" badge={chatNew || null} onPress={() => { setChatNew(0); setChatOpen(true); }} />}
          {!solo && isHost && !watch && <GBtn icon={allowWatch ? 'eye' : 'eyeoff'} color={allowWatch ? 'blue' : 'dark'} size={42} fast={false} label={allowWatch ? 'Friends can watch. Tap to stop' : 'Let friends watch'} badge={watchers.length || null} onPress={toggleWatch} />}
          {!watch && <GBtn icon="gear" color="dark" size={42} fast={false} label={isHost ? 'Game settings' : 'Settings'} onPress={() => (isHost ? setOptSheet(true) : setCtl(true))} />}
        </>
      )}
      side={(
        <>
          {!watch && (
            <GPanel style={{ padding: '8px 10px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 900 }}>Your hero</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, color: H0.col, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${H0.name}, ${H0.role}`}</span>
                {prog && <span style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 9px', borderRadius: 12, background: 'rgba(10,14,26,0.6)', fontSize: 11.5, fontWeight: 900, color: '#FFE15A', flexShrink: 0 }}><GIcon k="star" size={12} color="#FFE15A" ink="transparent" />{`${prog.scrap} scrap`}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${E.HERO_KEYS.length > 8 ? 5 : 4}, minmax(0, 1fr))`, gap: 6, justifyItems: 'center' }}>{E.HERO_KEYS.map((k) => <HeroCard key={k} k={k} on={heroKey === k} img={thumbs[k]} size={land ? 54 : 52} lv={prog ? prog.levels[k] : 0} locked={!solo && heroKey !== k && takenBy(k) >= E.heroCap()} onPress={() => pickHero(k)} />)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>Colour</span>
                {[0, 1, 2, 3].map((c) => <button key={c} type="button" className="zgk-btn" aria-label={`Colour ${c + 1}`} aria-pressed={heroCol === c} {...pressProps(() => pickCol(c))} style={{ width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer', background: heroTint(heroKey, c), boxShadow: heroCol === c ? '0 0 0 2px #1B1430, 0 0 0 4px #F2B21B' : 'inset 0 0 0 1px rgba(0,0,0,0.3)' }} />)}
                {!solo && takenBy(heroKey) > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>A friend has this hero too</span>}
              </div>
              {mode === 'team' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>Battle skill</span>
                  <SkillPick value={skill} onPick={pickSkill} compact={!land} />
                </div>
              )}
              <button type="button" className="zgk-btn" aria-label={`${H0.name} details and upgrades`} {...pressProps(() => { kitTap(); setUpMsg(''); setHeroSheet(true); })}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 7px', border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#FFFFFF', fontFamily: FONT, textAlign: 'left' }}>
                <span style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: 'rgba(20,24,30,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1.5px rgba(255,194,61,0.9)' }}><GGlyph k={SUP_GI[E.HEROES[heroKey].sup.k] || 'sonic'} size={22} /></span>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 900 }}>{prog ? `Level ${prog.levels[heroKey] || 1}` : H0.sup.name}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`Super ${H0.sup.name}, gadget ${H0.gad.name}`}</span>
                </span>
                <span style={{ height: 26, padding: '0 10px', borderRadius: 13, background: 'linear-gradient(180deg, #FFE27A, #F5B321)', color: '#2A1D05', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{prog ? 'Upgrade' : 'Details'}</span>
              </button>
            </GPanel>
          )}
          {mode !== 'team' && squadPanel}
        </>
      )}
      main={(
        <>
        {mode === 'team' && (soloTeamPanel || squadPanel)}
        <GPanel style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ width: '100%' }}><GSeg value={mode} items={MODE_ITEMS} onPick={pickMode} disabled={!isHost || watch} label="Game mode" /></div>
          {mode === 'team' ? <TeamMapCard img={aThumbs.rift} ts={Math.max(ts, Math.ceil((solo ? 1 : roster.length) / 2))} isHost={isHost && !watch} onPress={() => setMapSheet(true)} /> : <button type="button" className="zgk-btn" aria-label={isHost && !watch ? `Arena ${E.ARENAS[arena].name}. Change arena` : `Arena ${E.ARENAS[arena].name}`} {...pressProps(() => { kitTap(); setArenaSheet(true); })}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 5, border: 'none', borderRadius: 12, background: 'rgba(255,255,255,0.07)', cursor: 'pointer', color: '#FFFFFF', fontFamily: FONT, textAlign: 'left' }}>
            <span style={{ width: 92, aspectRatio: '16 / 9', borderRadius: 8, overflow: 'hidden', display: 'block', background: ARENA_BG[arena] || ARENA_BG.yard, flexShrink: 0 }}>{aThumbs[arena] ? <img src={aThumbs[arena]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: 15, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{E.ARENAS[arena].name}</span>
              <span style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{`${E.LEVELS[lv].name}, ${endless ? 'endless waves' : `${E.WIN_WAVE} waves`}`}</span>
            </span>
            <span style={{ height: 26, padding: '0 10px', borderRadius: 13, background: isHost && !watch ? 'linear-gradient(180deg, #FFE27A, #F5B321)' : 'rgba(10,14,26,0.7)', color: isHost && !watch ? '#2A1D05' : '#FFFFFF', fontSize: 11.5, fontWeight: 900, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{isHost && !watch ? 'Change' : 'See arenas'}</span>
          </button>}
          {failed ? <div style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.4, color: '#FFB4B4' }}>This phone could not start the 3D game. Try closing other apps, then open it again.</div>
            : watch ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{`${hostName} starts soon`}</div>
            : isHost ? <GPill text={ready ? (mode === 'team' ? 'Start the battle' : 'Start the fight') : `Building ${mode === 'team' ? 'Nebula Valley' : E.ARENAS[arena].name}`} icon="play" color="gold" wide disabled={!ready} onPress={startGame} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, fontSize: 13.5, fontWeight: 800 }}><Spinner size={16} color="#FFFFFF" />{mode === 'team' ? `${hostName} sets the teams and starts` : `${hostName} picks the arena and starts`}</div>}
        </GPanel>
        </>
      )}>
      {mapSheet && (
        <GLobbySheet GS={GS} title="Nebula Valley" width={560} onClose={() => setMapSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aThumbs.rift ? <img src={aThumbs.rift} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 12, display: 'block' }} /> : null}
            <TeamHowTo />
            {isHost && !watch && <TeamSettings ts={ts} onTs={pickTs} />}
            <GPill text="Done" color="gold" wide onPress={() => setMapSheet(false)} />
          </div>
        </GLobbySheet>
      )}
      {arenaSheet && (
        <GLobbySheet GS={GS} title="Arena" width={600} onClose={() => setArenaSheet(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            {E.ARENA_KEYS.map((k) => {
              const on = arena === k;
              const b = Number(readPref(BEST_KEY(uid, k, lv), '0')) || 0;
              return (
                <button key={k} type="button" className="zgk-btn" aria-pressed={on} aria-label={E.ARENAS[k].name} disabled={!isHost || watch} {...pressProps(() => pickArena(k))}
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 6, border: 'none', borderRadius: 14, cursor: isHost && !watch ? 'pointer' : 'default', fontFamily: FONT, color: '#FFFFFF', textAlign: 'left', background: on ? 'rgba(255,214,90,0.16)' : 'rgba(255,255,255,0.06)', boxShadow: on ? 'inset 0 0 0 2.5px #FFD45A' : 'inset 0 0 0 1.5px rgba(255,255,255,0.12)' }}>
                  <span style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 10, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ARENA_BG[k] || ARENA_BG.yard }}>{aThumbs[k] ? <img src={aThumbs[k]} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <Spinner size={18} color="#FFFFFF" />}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 3px' }}>
                    <span style={{ flex: 1, fontSize: 14.5, fontWeight: 900 }}>{E.ARENAS[k].name}</span>
                    {b > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#FFE15A' }}>{`Best wave ${b}`}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Aliens</span>
              <div style={{ flex: 1 }}><GSeg value={lv} items={LV_ITEMS} onPick={pickLv} disabled={!isHost || watch} label="How tough the aliens are" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 900, width: 82 }}>Waves</span>
              <div style={{ flex: 1 }}><GSeg value={endless ? 'end' : '15'} items={WAVE_ITEMS} onPick={pickWaves} disabled={!isHost || watch} label="How many waves" /></div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{endless ? 'Endless waves' : `Boss every 5 waves. Win at wave ${E.WIN_WAVE}`}</div>
            <GPill text="Done" color="gold" wide onPress={() => setArenaSheet(false)} />
          </div>
        </GLobbySheet>
      )}
      {heroSheet && (
        <GLobbySheet GS={GS} title={`${H0.name}, ${H0.role}`} width={560} onClose={() => setHeroSheet(false)}>
          {(() => {
            const lvl = prog ? prog.levels[heroKey] || 1 : 1;
            const lm = E.levelMods(lvl), ln = E.levelMods(Math.min(E.MAX_LEVEL, lvl + 1));
            const hpNow = Math.round(H0.hp * lm.hp), hpNext = Math.round(H0.hp * ln.hp);
            const dNow = Math.round(shotDmg(H0) * lm.dmg), dNext = Math.round(shotDmg(H0) * ln.dmg);
            const top = lvl >= E.MAX_LEVEL;
            const cost = E.levelCost(lvl);
            const short = prog ? Math.max(0, cost - prog.scrap) : 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 84, height: 84, borderRadius: 18, overflow: 'hidden', flexShrink: 0, background: `radial-gradient(circle at 50% 35%, ${H0.col}66, #141A2C 75%)`, boxShadow: `0 0 0 2.5px ${H0.col}` }}>{thumbs[heroKey] ? <img src={thumbs[heroKey]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}</span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35, color: 'rgba(255,255,255,0.88)' }}>{H0.text}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 900, color: '#FFE15A' }}>{prog ? `Level ${lvl} of ${E.MAX_LEVEL}` : `Level ${lvl}`}</span>
                    <span style={{ display: 'flex', gap: 3 }}>{Array.from({ length: E.MAX_LEVEL }, (_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < lvl ? '#FFD45A' : 'rgba(255,255,255,0.14)' }} />)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <StatRow label="Health" f={hpNow / 7000} text={hpNow.toLocaleString()} col="linear-gradient(90deg, #4FD86A, #2BB04A)" />
                  <StatRow label="Damage" f={dNow / 2000} text={`${dNow.toLocaleString()} a shot`} col="linear-gradient(90deg, #FF8A5C, #E5483B)" />
                  <StatRow label="Range" f={H0.stats[2] / 5} text={RANGE_TXT[H0.stats[2]]} col="linear-gradient(90deg, #6FB8FF, #2563C4)" />
                  <StatRow label="Speed" f={H0.stats[3] / 5} text={SPEED_TXT[H0.stats[3]]} col="linear-gradient(90deg, #C08BFF, #8045E6)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[[<GGlyph key="a" k={ATK_GI[heroKey]} size={20} />, 'Attack', H0.text, 'rgba(20,24,30,0.85)'], [<GGlyph key="s" k={SUP_GI[H0.sup.k] || 'sonic'} size={22} />, `Super, ${H0.sup.name}`, H0.sup.text, 'rgba(20,24,30,0.85)'], [<GGlyph key="g" k={GAD_GI[H0.gad.k]} size={20} />, `Gadget, ${H0.gad.name}`, `${H0.gad.text} ${E.GADGETS} uses each game.`, 'radial-gradient(circle at 40% 30%, #5EE6D2, #18B3A0 80%)']].map(([ic, t, d, bg]) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 34, height: 34, borderRadius: 17, flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2px ${INK}` }}>{ic}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}><span style={{ fontSize: 13, fontWeight: 900 }}>{t}</span><span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{d}</span></span>
                    </div>
                  ))}
                </div>
                {prog ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '9px 10px', borderRadius: 14, background: 'rgba(255,214,90,0.1)', boxShadow: 'inset 0 0 0 1.5px rgba(255,214,90,0.35)' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.35 }}>{top ? `${H0.name} is at the top level.` : `Level ${lvl + 1} gives ${hpNext.toLocaleString()} health and ${dNext.toLocaleString()} damage a shot.`}</span>
                    {!top && <GPill text={upBusy ? 'Upgrading' : short ? `Upgrade for ${cost} scrap` : `Upgrade for ${cost} scrap`} icon="up" color={short ? 'white' : 'gold'} wide disabled={upBusy || short > 0} onPress={() => upgrade(heroKey)} />}
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{short && !top ? `You have ${prog.scrap} scrap. Play games to earn ${short} more.` : `You have ${prog.scrap} scrap. Each game gives scrap for the waves you reach.`}</span>
                    {upMsg && <span style={{ fontSize: 12, fontWeight: 800, color: '#FFB49A' }}>{upMsg}</span>}
                  </div>
                ) : <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Hero levels show up here once they load. Check your connection and open this again.</div>}
                <GPill text="Done" color="dark" small wide onPress={() => setHeroSheet(false)} />
              </div>
            );
          })()}
        </GLobbySheet>
      )}
      {optSheet && (
        <GLobbySheet GS={GS} title="Game settings" width={520} onClose={() => setOptSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {isHost && mode === 'team' && <TeamSettings ts={ts} onTs={pickTs} />}
            {isHost && mode === 'team' && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>Bots fill every open spot on both teams. Hero levels do not count here, so every player starts equal.</div>}
            {isHost && mode !== 'team' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14.5, fontWeight: 900, flex: 1 }}>{solo ? 'Bot friends' : 'Bots fill empty spots'}</span>
                <div style={{ width: 250 }}><GSeg value={String(botN)} items={BOT_ITEMS} onPick={pickBots} label="Bot friends" /></div>
              </div>
            )}
            <GPill text="Settings" icon="gear" color="white" small wide onPress={() => { setOptSheet(false); setCtl(true); }} />
          </div>
        </GLobbySheet>
      )}
    </GLobby>
  );

const powersBtn = (() => {
                    const hh = G.current.W && G.current.W.heroes[kindOf()];
                    const cs = (hh && hh.cards) || [];
                    const tk = cards ? 0 : (G.current.pend || []).length;
                    if (watch || (!cs.length && !tk)) return null;
                    const uniq = [...new Set(cs)].slice(-4);
                    return (
                      <button type="button" className="zgk-btn" aria-label={tk > 1 ? `${tk} new powers. Pick one` : tk ? 'A new power is ready. Pick it' : `Your powers, ${cs.length}`} {...pressProps(() => { kitTap(); if (tk) showPick(false); else setPowSheet(true); })}
                        style={{ pointerEvents: 'auto', height: 26, padding: '0 8px', border: 'none', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontFamily: FONT, color: '#FFFFFF', background: tk ? 'linear-gradient(180deg, #FFE27A, #F2B21B)' : 'linear-gradient(180deg, rgba(50,57,68,0.92), rgba(25,29,37,0.92))', boxShadow: tk ? '0 0 0 2px #1B1430' : 'inset 0 2px 0 #F2B21B', animation: tk ? 'zgk-pulse 1.2s ease-in-out infinite' : 'none' }}>
                        {tk ? <span style={{ fontSize: 12, fontWeight: 900, color: '#2A1D05' }}>{tk > 1 ? `${tk} new powers` : 'New power'}</span> : uniq.map((k) => <GIcon key={k} k={E.CARDS[k].icon} size={14} color="#FFE15A" ink="transparent" />)}
                        {!tk && <span style={{ fontSize: 12, fontWeight: 900 }}>{cs.length}</span>}
                      </button>
                    );
                  })();
  const teamOn = !!hud.tm && phase !== 'menu';
  const waveLine = hud.st === 'fight' ? (hud.left === 1 ? '1 alien left' : `${hud.left} aliens left`) : hud.st === 'break' ? (solo && cards ? 'Waiting for your pick' : `Next wave in ${Math.max(1, hud.t)}`) : hud.st === 'won' ? 'All waves cleared' : 'Get ready';
  const superOn = !!(meHud && meHud.sup && meHud.st === 0);
  const ctrlScale = look.size;
  const ctlBlock = (mh, sOn) => (
    <>
      {TOUCHY && <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 1 - look.see, zIndex: 3 }}><GJoy flat view={J.view} knobRef={J.knob} idle={{ x: land ? 110 : 96, y: GS.H - (land ? 104 : 128) }} R={J.R} /></div>}
      <div ref={supRef} data-hud="sup" data-hud-name="Super" role="button" aria-label={sOn ? `Super, ${E.HEROES[mh.key].sup.name}. Ready` : 'Super, charging'} onPointerDown={aimDown('sup')} onPointerMove={aimMove} onPointerUp={aimUp} onPointerCancel={aimUp} onLostPointerCapture={aimUp} onContextMenu={(e) => e.preventDefault()}
        style={{ position: 'absolute', right: right(136), bottom: bottom(58), width: 80, height: 80, borderRadius: '50%', touchAction: 'none', zIndex: 5, opacity: sOn ? 1 : 0.85 - look.see * 0.4, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%' , ...hudT(hudLay.lay, 'sup') }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true">
          <circle cx="40" cy="40" r="38.8" fill="rgba(14,17,22,0.42)" stroke={sOn ? 'rgba(255,194,61,0.98)' : 'rgba(255,255,255,0.6)'} strokeWidth="2" />
          <circle cx="40" cy="40" r="35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.4" />
          <circle ref={supRing} cx="40" cy="40" r="35" fill="none" stroke="#FFC23D" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="220 220" strokeDashoffset="220" />
        </svg>
        <span ref={supKnob} style={{ position: 'absolute', left: 13, top: 13, width: 54, height: 54, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: sOn ? 'rgba(255,194,61,0.34)' : 'rgba(255,255,255,0.07)', boxShadow: sOn ? 'inset 0 0 0 1.6px rgba(255,214,120,0.95), 0 0 16px rgba(255,194,61,0.7)' : 'inset 0 0 0 1.4px rgba(255,255,255,0.4)', animation: sOn ? 'zgk-pulse 1.4s ease-in-out infinite' : 'none' }}>
          <span style={{ opacity: sOn ? 1 : 0.55, display: 'flex', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))' }}><GGlyph k={SUP_GI[E.HEROES[mh.key].sup.k] || 'sonic'} size={32} /></span>
        </span>
      </div>
      <div ref={atkRef} data-hud="atk" data-hud-name="Attack" role="button" aria-label="Attack. Tap to aim at the closest alien, or drag to aim" onPointerDown={aimDown('atk')} onPointerMove={aimMove} onPointerUp={aimUp} onPointerCancel={aimUp} onLostPointerCapture={aimUp} onContextMenu={(e) => e.preventDefault()}
        style={{ position: 'absolute', right: right(22), bottom: bottom(20), width: 112, height: 112, borderRadius: '50%', touchAction: 'none', zIndex: 5, opacity: 1 - look.see * 0.5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%' , ...hudT(hudLay.lay, 'atk') }}>
        <svg width="112" height="112" viewBox="0 0 112 112" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
          <circle cx="56" cy="56" r="54.6" fill="rgba(14,17,22,0.36)" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" />
          {Array.from({ length: mh.ammoMax || 3 }, (_, i) => { const n = mh.ammoMax || 3; const span = (Math.PI * 2) / n; const a0 = -Math.PI / 2 + i * span + 0.09, a1 = a0 + span - 0.18; const r = 51; const p0 = [56 + Math.cos(a0) * r, 56 + Math.sin(a0) * r], p1 = [56 + Math.cos(a1) * r, 56 + Math.sin(a1) * r]; const L = Math.round(r * (a1 - a0)); const d = `M${p0[0]} ${p0[1]} A${r} ${r} 0 0 1 ${p1[0]} ${p1[1]}`; return <g key={`${n}-${i}`}><path d={d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="5" strokeLinecap="round" /><path ref={(el) => { ammoRef.current[i] = el; }} data-l={L} d={d} fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${L} ${L}`} strokeDashoffset="0" /></g>; })}
        </svg>
        <span ref={atkKnob} style={{ position: 'absolute', left: 22, top: 22, width: 68, height: 68, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: aimUi === 'atk' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', boxShadow: 'inset 0 0 0 1.6px rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.25)' }}>
          <span style={{ display: 'flex', filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.6))' }}><GGlyph k={ATK_GI[mh.key] || 'flame'} size={34} /></span>
        </span>
      </div>
      <div data-hud="dash" data-hud-name="Dash" style={{ position: 'absolute', right: right(154), bottom: bottom(150), zIndex: 5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%', opacity: 1 - look.see * 0.4, ...hudT(hudLay.lay, 'dash') }}>
        <GHudSkill icon="sprint" tone="#5BC8FF" size={56} cool={mh.dashCD} coolMax={mh.dashMax} label="Dash" sound="click" onPress={() => G.current.dashQ.push(null)} />
      </div>
      <div data-hud="gad" data-hud-name="Gadget" style={{ position: 'absolute', right: right(40), bottom: bottom(150), zIndex: 5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%', opacity: (mh.gad > 0 ? 1 : 0.55) - look.see * 0.4, ...hudT(hudLay.lay, 'gad') }}>
        <GHudSkill icon={GAD_GI[E.HEROES[mh.key].gad.k] || 'shield'} tone="#5EE6D2" size={56} cool={mh.gad > 0 ? mh.gadCD : 0} coolMax={E.GADGET_CD} badge={mh.gad} disabled={mh.gad <= 0} label={`Gadget, ${E.HEROES[mh.key].gad.name}, ${mh.gad} left`} sound="click" onPress={() => G.current.gadQ.push(null)} />
      </div>
      {mh.team && T.SKILLS[mh.sk] && (
        <>
          <div data-hud="skill" data-hud-name="Battle skill" style={{ position: 'absolute', right: right(land ? 236 : 40), bottom: bottom(land ? 34 : 222), zIndex: 5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%', opacity: 1 - look.see * 0.4, ...hudT(hudLay.lay, 'skill') }}>
            <GHudSkill icon={T.SKILLS[mh.sk].icon} tone={T.SKILLS[mh.sk].col} size={54} cool={mh.skCD || 0} coolMax={mh.skMax || 1} label={`Battle skill, ${T.SKILLS[mh.sk].name}`} sound="click" onPress={() => G.current.skQ.push(null)} />
          </div>
          <div data-hud="home" data-hud-name="Home" style={{ position: 'absolute', right: right(land ? 302 : 106), bottom: bottom(land ? 24 : 226), zIndex: 5, transform: `scale(${ctrlScale})`, transformOrigin: '100% 100%', opacity: 1 - look.see * 0.4, ...hudT(hudLay.lay, 'home') }}>
            <GHudSkill icon="revive" tone="#9FD0FF" size={46} label="Go home" sound="click" onPress={() => G.current.recQ.push(1)} />
          </div>
        </>
      )}
      {(mh.sh || mh.rf || mh.sp || mh.oc || mh.clk) && (
        <div style={{ position: 'absolute', left: '50%', bottom: bottom(14), transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 4, pointerEvents: 'none' }}>
          {mh.sh && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: '#9FE6FF' }}><GIcon k="shield" size={13} color="#9FE6FF" ink="transparent" />Shield</GHudPanel>}
          {mh.rf && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: '#FFC27A' }}><GIcon k="replay" size={13} color="#FFC27A" ink="transparent" />Rapid fire</GHudPanel>}
          {mh.sp && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: '#9BF29B' }}><GIcon k="dash" size={13} color="#9BF29B" ink="transparent" />Speed</GHudPanel>}
          {mh.clk && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: '#C9B6FF' }}><GGlyph k="ghost" size={13} color="#C9B6FF" />Hidden</GHudPanel>}
          {mh.oc && <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 900, color: '#FFE36A' }}><GIcon k="bolt" size={13} color="#FFE36A" ink="transparent" />Overcharge</GHudPanel>}
        </div>
      )}
    </>
  
  );
  return (
    <Portal><GSkin k="siege">
      <div ref={GS.rootRef} style={{ position: 'fixed', left: 0, right: 0, top: 'var(--zvp-top, 0px)', height: 'calc(var(--zvp-h, 100%) + var(--zgx, 0px))', zIndex: 90, background: '#2A2620', overflow: 'hidden', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', fontFamily: FONT, color: '#FFFFFF' }}>
        <div ref={wrapRef} data-side={GS.side ? '1' : '0'} style={GS.wrapStyle} onPointerDown={wrapDown} onPointerMove={wrapMove} onPointerUp={J.handlers.onPointerUp} onPointerCancel={J.handlers.onPointerCancel} onLostPointerCapture={J.handlers.onLostPointerCapture} onPointerLeave={(e) => { if (e.pointerType === 'mouse') G.current.mouse = null; }} onContextMenu={(e) => e.preventDefault()}>
          <canvas ref={cvRef} aria-label="Bolt War" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
          <canvas ref={ovRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none', zIndex: 1 }} />
          <div ref={hurtRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, opacity: 0, background: 'radial-gradient(ellipse at center, rgba(255,0,0,0) 55%, rgba(220,20,20,0.55) 100%)' }} />

          {(phase === 'play' || phase === 'done') && (
            <>
              {teamOn && (
                <div style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
                  <TeamMe hud={hud} powers={powersBtn} />
                  <canvas ref={mapRef} aria-label="Map" role="img" width="108" height="108" style={{ width: 108, height: 108, borderRadius: 10, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.22), 0 4px 10px rgba(0,0,0,0.35)', pointerEvents: 'none', display: 'block', visibility: phase === 'play' && hudOpt.map ? 'visible' : 'hidden' }} />
                </div>
              )}
              {teamOn && (
                <div style={{ position: 'absolute', left: '50%', top: top(land ? 8 : 54), transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 4, pointerEvents: 'none' }}>
                  <TeamScore hud={hud} onPress={() => setBoard(true)} />
                  <TeamShip hud={hud} />
                  <KillFeed items={tfeed} />
                </div>
              )}
              {!teamOn && <div style={{ position: 'absolute', left: left(10), top: top(8), display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start', zIndex: 3, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, padding: '3px 11px 4px', borderRadius: 12, background: 'linear-gradient(180deg, rgba(40,24,6,0.85), rgba(20,12,4,0.78))', boxShadow: 'inset 0 0 0 1.5px rgba(255,200,80,0.45)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#FFD45A' }}>Wave</span>
                    <span style={{ fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{hud.wave || 1}</span>
                    {!endless && <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>{`of ${E.WIN_WAVE}`}</span>}
                  </span>
                  <GHudPanel style={{ height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{waveLine}</GHudPanel>
                  {powersBtn}
                </div>
                {hud.team.length > 5 && phase === 'play' && !(cards && land) && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 30px)', gap: 4 }}>
                    {hud.team.map((t, i) => {
                      const f = t.st === 0 ? clamp(t.hp / t.max, 0, 1) : 0;
                      return (
                        <span key={t.id} title={nameOf(t.id)} style={{ position: 'relative', width: 30, height: 30, display: 'block', opacity: t.st === 2 ? 0.45 : 1 }}>
                          <svg width="30" height="30" viewBox="0 0 30 30" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} aria-hidden="true"><circle cx="15" cy="15" r="13" fill="rgba(10,12,22,0.7)" stroke="rgba(255,255,255,0.16)" strokeWidth="3" /><circle cx="15" cy="15" r="13" fill="none" stroke={t.st === 1 ? '#6CFFD4' : t.id === kindOf() ? '#5BE35B' : f < 0.35 ? '#FF6A4E' : '#3D9BFF'} strokeWidth="3" strokeDasharray={`${(81.7 * (t.st === 1 ? 1 : f)).toFixed(1)} 82`} /></svg>
                          {thumbs[t.key] ? <img src={thumbs[t.key]} alt="" style={{ position: 'absolute', left: 4, top: 4, width: 22, height: 22, borderRadius: 11, objectFit: 'cover', boxShadow: `0 0 0 1px ${SLOT_COLS[i % SLOT_COLS.length]}` }} /> : null}
                          {t.st !== 0 && <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 900, color: t.st === 1 ? '#6CFFD4' : '#FF9C8F', textShadow: '0 1px 3px #000' }}>{t.st === 1 ? t.dt : 'Out'}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
                {hud.team.length > 1 && hud.team.length <= 5 && phase === 'play' && !(cards && land) && hud.team.map((t, i) => (
                  <GHudPanel key={t.id} style={{ height: 22, padding: '0 8px 0 4px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap', minWidth: land ? 150 : 132 }}>
                    {thumbs[t.key] ? <img src={thumbs[t.key]} alt="" style={{ width: 18, height: 18, borderRadius: 9, objectFit: 'cover', boxShadow: `0 0 0 1.5px ${SLOT_COLS[i % SLOT_COLS.length]}` }} /> : <span style={{ width: 10, height: 10, borderRadius: 5, background: SLOT_COLS[i % SLOT_COLS.length] }} />}
                    <span style={{ width: 52, overflow: 'hidden', textOverflow: 'ellipsis' }}>{nameOf(t.id)}</span>
                    {t.st === 0 ? <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.18)', overflow: 'hidden', display: 'block', minWidth: 40 }}><span style={{ display: 'block', height: '100%', width: `${Math.round(clamp(t.hp / t.max, 0, 1) * 100)}%`, background: t.id === kindOf() ? '#5BE35B' : '#3D9BFF' }} /></span>
                      : <span style={{ flex: 1, fontSize: 10.5, fontWeight: 900, color: t.st === 1 ? '#6CFFD4' : '#FF9C8F' }}>{t.st === 1 ? `Down ${t.dt}` : 'Out'}</span>}
                    {micOf(t.id) && !relay.muted[t.id] && <GIcon k="mic" size={11} color="#7BE05A" ink="transparent" />}
                  </GHudPanel>
                ))}
              </div>}
              {teamOn ? (
                <div style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, zIndex: 4 }}>
                  <div style={{ display: 'flex', gap: 6 }}>{rowBtns}</div>
                </div>
              ) : <div style={{ position: 'absolute', right: right(10), top: top(8), display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, zIndex: 4 }}>
                <div style={{ display: 'flex', gap: 6 }}>{rowBtns}</div>
                <GHudPanel style={{ height: 24, padding: '0 9px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 900 }}><GIcon k="star" size={13} color="#FFD84E" ink="transparent" />{hud.score.toLocaleString()}</GHudPanel>
                <canvas ref={mapRef} aria-label="Map" role="img" width="104" height="75" style={{ width: 104, height: 75, borderRadius: 8, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.22), 0 4px 10px rgba(0,0,0,0.35)', pointerEvents: 'none', display: 'block', visibility: phase === 'play' && hudOpt.map ? 'visible' : 'hidden' }} />
              </div>}
              {hud.boss && (
                <div aria-label="Boss health" style={{ position: 'absolute', left: '50%', top: top(teamOn ? (land ? 112 : 150) : 54), transform: 'translateX(-50%)', width: 'min(46%, 360px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, zIndex: 3, pointerEvents: 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#FFD45A', textShadow: '0 2px 5px rgba(0,0,0,0.6)' }}>{hud.boss.name || E.ROBOTS.boss.name}</span>
                  <span style={{ width: '100%', height: 13, borderRadius: 7, background: 'rgba(12,10,26,0.82)', boxShadow: '0 0 0 2px rgba(255,255,255,0.25)', overflow: 'hidden', display: 'block' }}><span style={{ display: 'block', height: '100%', width: `${Math.round(clamp(hud.boss.hp / hud.boss.max, 0, 1) * 1000) / 10}%`, background: 'linear-gradient(180deg, #FF7A5C, #D9261A)', transition: 'width 0.2s' }} /></span>
                </div>
              )}
              {banner && (
                <div key={banner.at} aria-live="polite" style={{ position: 'absolute', left: '50%', top: '22%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 4, pointerEvents: 'none', animation: 'zgk-pop 0.3s ease-out' }}>
                  <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap', color: banner.tone === 'red' ? '#FF6B5C' : banner.tone === 'green' ? '#7BF27B' : banner.tone === 'blue' ? '#9FD0FF' : '#FFE15A', textShadow: `0 4px 0 ${INK}, 0 0 3px ${INK}, 0 8px 22px rgba(0,0,0,0.5)`, WebkitTextStroke: `1.5px ${INK}` }}>{banner.text}</span>
                  {banner.sub && <span style={{ fontSize: 14, fontWeight: 800, padding: '4px 12px', borderRadius: 12, background: 'rgba(10,14,26,0.66)' }}>{banner.sub}</span>}
                </div>
              )}
              {playing && meHud && meHud.st === 1 && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(18), transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 14, background: 'rgba(10,14,26,0.72)', fontSize: 13.5, fontWeight: 900, zIndex: 4, pointerEvents: 'none', textAlign: 'center' }}>{`You are down. ${meHud.dt}s left for a friend to revive you`}</div>
              )}
              {playing && meHud && meHud.st === 2 && !teamOn && (
                <div style={{ position: 'absolute', left: '50%', bottom: bottom(18), transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 14, background: 'rgba(10,14,26,0.72)', fontSize: 13.5, fontWeight: 900, zIndex: 4, pointerEvents: 'none' }}>You come back when the next wave starts</div>
              )}
              {playing && meHud && meHud.st === 2 && teamOn && phase === 'play' && <RespawnBox t={hud.tm.resp} bottom={bottom(24)} />}
              {playing && meHud && meHud.st === 0 && ctlBlock(meHud, superOn)}
              {cards && playing && phase === 'play' && (
                <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', left: '50%', top: land ? top(GS.H < 350 ? 54 : 64) : '18%', transform: 'translateX(-50%)', width: land ? `min(${Math.max(1, cards.list.length) * 200 + 40}px, 82%)` : 'min(420px, 94%)', zIndex: 8, animation: 'zgk-pop 0.22s ease-out' }}>
                  <GPanel style={{ padding: GS.H < 350 ? '8px 11px 12px' : '10px 12px 14px', display: 'flex', flexDirection: 'column', gap: GS.H < 350 ? 8 : 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 900 }}>Pick an upgrade</span>
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{cards.more > 0 ? `Lasts this game. ${cards.more} more after this` : 'Lasts this game'}</span>
                      </span>
                      <button type="button" className="zgk-btn" aria-label="Pick later" {...pressProps(laterCard)}
                        style={{ height: 32, padding: '0 14px', border: 'none', borderRadius: 16, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 900, color: '#FFFFFF', background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.28)', flexShrink: 0 }}>Later</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: land ? `repeat(${Math.max(1, cards.list.length)}, minmax(0, 1fr))` : '1fr', gap: land ? 10 : 8 }}>
                      {cards.list.map((k, i) => <UpgradeCard key={`${cards.id}_${k}`} k={k} i={i} snap={cards.snap} land={land} short={GS.H < 350} keyHint={!TOUCHY} onPick={() => tryPick(k)} />)}
                    </div>
                  </GPanel>
                </div>
              )}
              {kill && phase === 'play' && (
                <div aria-live="polite" style={{ position: 'absolute', left: '50%', top: top(teamOn ? (land ? 150 : 190) : hud.boss ? 92 : 58), transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px 6px 8px', borderRadius: 16, background: 'rgba(40,6,6,0.78)', boxShadow: 'inset 0 0 0 1.5px rgba(255,110,90,0.55)', zIndex: 6, pointerEvents: 'none', animation: 'zgk-pop 0.25s ease-out', whiteSpace: 'nowrap' }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: '#E5483B', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 2px ${INK}` }}><GIcon k="close" size={14} color="#FFFFFF" ink="transparent" /></span>
                  <span style={{ fontSize: 15, fontWeight: 900 }}>{teamOn ? `Taken down by ${kill.name}` : `Downed by ${kill.name}`}</span>
                </div>
              )}
              {(!inGame() || (meHud && meHud.st === 2 && !kill && !teamOn)) && phase === 'play' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: bottom(inGame() ? 52 : 14), display: 'flex', justifyContent: 'center', padding: '0 14px', zIndex: 3 }}>
                  <GWatchBar ids={inGame() ? ids0.filter((k) => k !== kindOf() && hud.team.some((t) => t.id === k && t.st !== 2)) : ids0} cur={camK} nameOf={nameOf} colorOf={(k) => { const h = g0.W && g0.W.heroes[k]; return h && E.HEROES[h.key] ? E.HEROES[h.key].col : '#FFFFFF'; }} onPick={(k) => { setFollow(k); camKRef.current = k; setCamK(k); }} />
                </div>
              )}
              {quick && (
                <GQuickPanel land={land} emotes={EMOTES} onEmote={sendEmote} phrases={CHAT_PHRASES} onPhrase={(p) => { chat.send(p); setQuick(false); }} onType={() => { setQuick(false); setChatNew(0); setChatOpen(true); }}
                  style={{ position: 'absolute', right: right(10), top: top(8 + hb + 40), width: land ? 'min(460px, calc(100% - 28px))' : 'min(330px, calc(100% - 28px))' }} />
              )}
              {Object.keys(bubbles).length > 0 && (
                <div style={{ position: 'absolute', left: '50%', top: top(90), transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 4, pointerEvents: 'none' }}>
                  {Object.entries(bubbles).map(([k, b]) => <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 14, background: 'rgba(10,14,26,0.7)', fontSize: 12.5, fontWeight: 800, animation: 'zgk-pop 0.25s ease-out' }}><span style={{ fontSize: 22 }}>{b.e}</span>{nameOf(k)}</span>)}
                </div>
              )}
            </>
          )}

          {!layEd && lobbyUi}
          {layEd && phase !== 'play' && ctlBlock({ key: heroKey, st: 0, dashCD: 0, dashMax: 1, gad: 2, gadCD: 0, ammoMax: 3, team: mode === 'team', sk: skill, skCD: 0, skMax: 1 }, true)}
          {layEd && <GHudEditor g="siege" stageRef={wrapRef} side={GS.side} W={GS.W} H={GS.H} at={GS.at} onClose={() => { setLayEd(false); setCtl(true); }} />}

          {paused && phase === 'play' && !layEd && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: 320, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.3s ease-out', boxSizing: 'border-box' }}>
                <GTitle text="Paused" size={28} />
                <GPill text="Resume" icon="play" color="green" wide onPress={() => setPaused(false)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <GPill text="Restart" icon="replay" color="white" small wide onPress={() => { setPaused(false); toMenu(true); setTimeout(startGame, 50); }} style={{ flex: 1 }} />
                  <GPill text="Settings" icon="gear" color="white" small wide onPress={() => setCtl(true)} style={{ flex: 1 }} />
                </div>
                <GPill text="Leave" color="red" small wide onPress={finish} />
              </GPanel>
            </div>
          )}

          {phase === 'done' && result && result.team && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <GPanel style={{ margin: 'auto', width: '100%', maxWidth: land ? 760 : 440, padding: land ? '12px 14px' : 16, display: 'flex', flexDirection: 'column', gap: 10, animation: 'zgk-pop 0.35s ease-out', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 180 }}>
                    <GTitle text={result.lost ? 'Connection lost' : !inGame() ? `${TNAME[result.win] || 'Blue'} team won` : result.won ? 'Victory' : 'Defeat'} size={land ? 28 : 30} color={result.won ? '#FFE15A' : '#FFFFFF'} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{result.lost ? 'The host stopped sending the game' : `${inGame() ? `Your team ${result.sc[result.myTeam]}, enemy ${result.sc[1 - result.myTeam]}` : `Blue ${result.sc[0]}, Red ${result.sc[1]}`}. ${result.mins > 0 ? `${result.mins} min` : 'Under a minute'}`}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {inGame() && <GChip style={{ height: 30, gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: TCOL[result.myTeam] }} />{`You played ${TNAME[result.myTeam].toLowerCase()} side`}</GChip>}
                    {result.scrap != null && result.scrap > 0 && <GChip style={{ height: 30, gap: 6 }}><GIcon k="plus" size={13} color="#7BF27B" ink="transparent" />{`${result.scrap} scrap`}</GChip>}
                  </div>
                </div>
                {!result.lost && result.rows.length > 0 && <TeamBoard GS={GS} rows={result.rows} myK={kindOf()} myTeam={result.myTeam} thumbs={thumbs} nameOf={nameOf} score={result.sc} />}
                {isHost ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <GPill text="Play again" icon="replay" color="green" small wide onPress={() => { toMenu(true); setTimeout(startGame, 60); }} style={{ flex: 1 }} />
                    <GPill text="Lobby" color="white" small wide onPress={() => toMenu(false)} style={{ flex: 1 }} />
                    <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} style={{ flex: 1 }} />
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${hostName} picks what is next`}</div>
                    <GPill text="Back to chat" color="dark" small wide onPress={finish} />
                  </>
                )}
              </GPanel>
            </div>
          )}
          {phase === 'done' && result && !result.team && (() => {
            const two = land && result.list.length > 5;
            const chips = (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <GChip style={{ height: 30, gap: 6 }}><GIcon k="star" size={13} color="#FFD84E" ink="transparent" />{`Score ${result.score.toLocaleString()}`}</GChip>
                {result.best > 0 && <GChip style={{ height: 30, gap: 6 }}><GIcon k="crown" size={13} color="#FFD84E" ink="transparent" />{result.newBest ? `New best, wave ${result.best}` : `Best wave ${result.best}`}</GChip>}
                {result.scrap != null && result.scrap > 0 && <GChip style={{ height: 30, gap: 6 }}><GIcon k="plus" size={13} color="#7BF27B" ink="transparent" />{`${result.scrap} scrap`}</GChip>}
              </div>
            );
            const head = <div style={{ display: 'flex', gap: 8, padding: '0 9px', fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}><span style={{ flex: 1 }}>Hero</span><span style={{ width: 44, textAlign: 'right' }}>Aliens</span><span style={{ width: 48, textAlign: 'right' }}>Damage</span><span style={{ width: 46, textAlign: 'right' }}>Revives</span></div>;
            return (
              <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(10,8,24,0.5)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
                <GPanel style={{ margin: 'auto', width: '100%', maxWidth: two ? 700 : 420, padding: two ? '12px 14px' : 16, display: 'flex', flexDirection: 'column', gap: two ? 8 : 10, animation: 'zgk-pop 0.35s ease-out', boxSizing: 'border-box' }}>
                  {two ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 180 }}>
                        <GTitle text={result.won ? 'Victory' : result.lost ? 'Connection lost' : 'Game over'} size={26} color={result.won ? '#FFE15A' : '#FFFFFF'} />
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{result.won ? `Your squad beat all ${result.wave} waves` : result.lost ? 'The host stopped sending the game' : `Your squad reached wave ${result.wave}`}</div>
                      </div>
                      {chips}
                    </div>
                  ) : (
                    <>
                      <GTitle text={result.won ? 'Victory' : result.lost ? 'Connection lost' : 'Game over'} size={30} color={result.won ? '#FFE15A' : '#FFFFFF'} />
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.88)' }}>{result.won ? `Your squad beat all ${result.wave} waves` : result.lost ? 'The host stopped sending the game' : `Your squad reached wave ${result.wave}`}</div>
                      {chips}
                    </>
                  )}
                  {result.list.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: two ? 'repeat(2, minmax(0, 1fr))' : '1fr', columnGap: 12, rowGap: 4 }}>
                      {head}
                      {two && head}
                      {result.list.map(([k, kills, dmg, rev, , hk], i) => (
                        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: two ? '4px 9px' : '6px 9px', borderRadius: 12, background: k === kindOf() ? 'rgba(255,194,61,0.2)' : 'rgba(255,255,255,0.06)', minWidth: 0 }}>
                          {thumbs[validHero(hk)] ? <img src={thumbs[validHero(hk)]} alt="" style={{ width: 24, height: 24, borderRadius: 12, objectFit: 'cover', boxShadow: `0 0 0 1.5px ${SLOT_COLS[i % SLOT_COLS.length]}` }} /> : <span style={{ width: 12, height: 12, borderRadius: 6, background: SLOT_COLS[i % SLOT_COLS.length] }} />}
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nameOf(k)}</span>
                          <span style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{kills | 0}</span>
                          <span style={{ width: 48, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{fmtK(dmg | 0)}</span>
                          <span style={{ width: 46, textAlign: 'right', fontSize: 13, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{rev | 0}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isHost ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <GPill text="Play again" icon="replay" color="green" small wide onPress={() => { toMenu(true); setTimeout(startGame, 60); }} style={{ flex: 1 }} />
                      <GPill text="Lobby" color="white" small wide onPress={() => toMenu(false)} style={{ flex: 1 }} />
                      {two && <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} style={{ flex: 1 }} />}
                    </div>
                  ) : <div style={{ fontSize: 13.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{`${hostName} picks what is next`}</div>}
                  {(!two || !isHost) && <GPill text={solo ? 'Leave' : 'Back to chat'} color="dark" small wide onPress={finish} />}
                </GPanel>
              </div>
            );
          })()}

          {ctl && (
            <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'absolute', inset: 0, zIndex: 45, background: 'rgba(10,8,24,0.55)', display: 'flex', padding: 12, overflowY: 'auto', touchAction: 'pan-x pan-y' }}>
              <div style={{ margin: 'auto', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GControlsPanel sideways onClose={() => setCtl(false)} at={GS.at} keys={SIEGE_KEYS} preview={['laser', 'shield']} layout={!watch ? <GLayoutRow g="siege" onOpen={() => { setCtl(false); setQuick(false); setOptSheet(false); layOpen('siege'); setLayEd(true); }} /> : null} tabs={[{ k: 'graphics', label: 'Graphics', body: <><GSetHead>Picture</GSetHead><GSetRow label="Graphics quality" sub="Fast helps older phones"><GSeg value={gfx} items={GFX} onPick={pickGfx} label="Graphics quality" /></GSetRow><GSetRow label="Camera shake" sub="Shakes the view on hits and blasts"><GSetToggle on={hudOpt.shake} label="Camera shake" onToggle={(n) => setHudK('shake', n)} /></GSetRow></> }, { k: 'hud', label: 'HUD', body: <><GSetRow label="Mini map"><GSetToggle on={hudOpt.map} label="Mini map" onToggle={(n) => setHudK('map', n)} /></GSetRow><GSetRow label="Damage numbers"><GSetToggle on={hudOpt.nums} label="Damage numbers" onToggle={(n) => setHudK('nums', n)} /></GSetRow><GSetRow label="Enemy health bars"><GSetToggle on={hudOpt.bars} label="Enemy health bars" onToggle={(n) => setHudK('bars', n)} /></GSetRow></> }]} /></div>
            </div>
          )}
          <GTalkers ids={talking} nameOf={nameOf} top={top(phase === 'play' ? (hud.boss ? 92 : 54) : 50)} />
          <GNotices items={notes} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(phase === 'menu' ? 64 : teamOn ? (land ? 196 : 236) : 104), width: 'min(52%, 420px)', zIndex: 30 }} />
          <GJoinAsks asks={jask.asks} onAnswer={jask.answer} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: top(phase === 'menu' ? 110 : 150), width: 'min(80%, 380px)', zIndex: 35 }} />
          {phase !== 'menu' && <GChatFeed items={feed} style={{ position: 'absolute', left: left(GS.land ? 222 : 12), top: top(GS.land ? 10 : 200), width: GS.land ? 'min(34%, 300px)' : 'calc(100% - 120px)', zIndex: 29 }} />}
          {people && !solo && (
            <Sheet title="Players and voice" text={relay.mic.on ? 'Your mic is on. Everyone in the game can hear you.' : 'Turn your mic on to talk while you play.'} onClose={() => setPeople(false)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                {roster.map((k, i) => {
                  const isMe = k === kindOf();
                  const nm = isMe ? 'You' : names[k] || 'Friend';
                  const talk = micOf(k);
                  const off = !!relay.muted[k];
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 7, background: SLOT_COLS[i % SLOT_COLS.length], boxShadow: '0 0 0 2px #FFFFFF' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nm}{k === (room && room.host) ? ', host' : ''}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: talk ? '#7BE05A' : 'rgba(255,255,255,0.55)' }}>{talk ? 'Mic on' : 'Mic off'}</div>
                      </div>
                      {!isMe && relay.setVol && <GVolBars name={nm} vol={relay.vols && relay.vols[k] != null ? relay.vols[k] : 1} muted={off} onVol={(v) => { if (off) relay.toggleMute(k); relay.setVol(k, v); }} />}
                      {!isMe && <GBtn icon={off ? 'mute' : 'sound'} color={off ? 'red' : 'dark'} size={40} fast={false} label={off ? `Unmute ${nm}` : `Mute ${nm}`} onPress={() => relay.toggleMute(k)} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {!watch && <GPill text={relay.mic.on ? 'Mic off' : 'Mic on'} icon={relay.mic.on ? 'micoff' : 'mic'} color={relay.mic.on ? 'white' : 'blue'} small wide onPress={relay.toggleMic} style={{ flex: 1 }} />}
                <GPill text="Done" color="dark" small wide onPress={() => setPeople(false)} style={{ flex: 1 }} />
              </div>
            </Sheet>
          )}
          {chatOpen && <ChatSheet title={teamOn ? 'Talk to everyone' : 'Talk to your squad'} chat={chat} onEmote={sendEmote} at={GS.at} onClose={() => setChatOpen(false)} />}
          {powSheet && (() => {
            const hh = G.current.W && G.current.W.heroes[kindOf()];
            const cs = (hh && hh.cards) || [];
            const cnt = {};
            for (const k of cs) cnt[k] = (cnt[k] || 0) + 1;
            const Hh = E.HEROES[hh ? hh.key : heroKey];
            const left = STREAK - ((G.current.myKills || 0) % STREAK);
            return (
              <GLobbySheet GS={GS} title="Your powers" width={520} onClose={() => setPowSheet(false)}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{G.current.W && G.current.W.mode === 'team' ? `${Hh.name}: super ${Hh.sup.name}, gadget ${Hh.gad.name}. A new power comes at every second level.` : `${Hh.name}: super ${Hh.sup.name}, gadget ${Hh.gad.name}. Next power in ${left} takedowns.`}</div>
                  {Object.keys(cnt).length === 0 && <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{G.current.W && G.current.W.mode === 'team' ? 'No powers yet. You get one at every second level.' : `No powers yet. You get one every second wave and every ${STREAK} takedowns.`}</div>}
                  {Object.entries(cnt).map(([k, n]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <span style={{ width: 32, height: 32, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: E.CARDS[k].hero ? 'linear-gradient(180deg, #FFE27A, #F2A81D)' : 'linear-gradient(180deg, #5A6474, #343B48)', flexShrink: 0 }}><GIcon k={E.CARDS[k].icon} size={18} color={E.CARDS[k].hero ? '#2A1D05' : '#FFE15A'} ink="transparent" /></span>
                      <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 14, fontWeight: 900 }}>{E.CARDS[k].name}</span><span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{cardLine(k)}</span></span>
                      {n > 1 && <span style={{ fontSize: 13, fontWeight: 900, color: '#F2B21B' }}>{`x${n}`}</span>}
                    </div>
                  ))}
                </div>
              </GLobbySheet>
            );
          })()}
          {board && teamOn && G.current.W && <TeamBoard GS={GS} rows={teamRows(G.current.W)} myK={kindOf()} myTeam={hud.tm.my} thumbs={thumbs} nameOf={nameOf} score={hud.tm.sc} onClose={() => setBoard(false)} />}
          {leaveAsk && (
            <Sheet title="Leave the game?" text="Your squad can keep fighting without you." onClose={() => setLeaveAsk(false)}>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <GPill text="Stay" color="white" small onPress={() => setLeaveAsk(false)} style={{ flex: 1 }} wide />
                <GPill text="Leave" color="red" small onPress={() => { setLeaveAsk(false); finish(); }} style={{ flex: 1 }} wide />
              </div>
            </Sheet>
          )}
        </div>
      </div>
    </GSkin></Portal>
  );
}

export function SiegeInviteSheet({ friends, onClose, onInvite, already, side = false }) {
  injectKitCss();
  useBackClose(true, onClose);
  const [sel, setSel] = useState([]);
  const room = Math.max(0, E.SQUAD_MAX - Math.max(1, already || 1));
  const list = (friends || []).filter((p) => p && p.id && !p.is_bot);
  const toggle = (id) => { kitTap(); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : v.length >= room ? v : [...v, id])); };
  return (
    <Portal>
      <div {...backdropProps(onClose)} data-side={side ? '1' : '0'} style={{ position: 'fixed', ...(side && typeof window !== 'undefined' ? { left: 0, top: 0, width: window.innerHeight, height: window.innerWidth, transformOrigin: '0 0', transform: `translateX(${window.innerWidth}px) rotate(90deg)` } : { inset: 0 }), zIndex: 96, background: 'rgba(10,8,24,0.55)', display: 'flex', alignItems: side ? 'center' : 'flex-end', justifyContent: 'center', fontFamily: FONT, color: '#FFFFFF' }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: side ? '100%' : 'min(86vh, 640px)', display: 'flex', flexDirection: 'column', padding: side ? '10px 14px' : '14px 14px calc(14px + env(safe-area-inset-bottom))', boxSizing: 'border-box', animation: 'zgk-pop 0.25s ease-out' }}>
          <GPanel style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex' }}>{SLOT_COLS.slice(0, 3).map((c, i) => <span key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, boxShadow: '0 0 0 2.5px #FFFFFF', marginLeft: i ? -7 : 0 }} />)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 900 }}>Invite friends to your squad</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.72)' }}>{room ? `Pick up to ${room}. Each one gets an invite in your chat.` : 'Your squad is full.'}</div>
              </div>
              <GBtn icon="close" color="white" size={38} fast={false} label="Close" onPress={onClose} />
            </div>
            <div style={{ overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: side ? 'none' : '52vh', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}>
              {list.length === 0 && <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', padding: '12px 4px' }}>Chat with someone first, then you can invite them here.</div>}
              {list.map((p) => {
                const on = sel.includes(p.id);
                return (
                  <div key={p.id} role="button" tabIndex={0} aria-pressed={on} onClick={() => toggle(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 16, background: on ? 'rgba(91,227,125,0.18)' : 'rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <Avatar emoji={p.avatar} name={p.name} size={40} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: 13, background: on ? '#F7C53A' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2px rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <GIcon k="check" size={15} color={INK} ink="transparent" />}</span>
                  </div>
                );
              })}
            </div>
            <GPill text={sel.length ? `Invite ${sel.length} and play` : 'Pick friends'} icon="play" color="green" wide disabled={!sel.length} onPress={() => onInvite(list.filter((p) => sel.includes(p.id)))} />
          </GPanel>
        </div>
      </div>
    </Portal>
  );
}
