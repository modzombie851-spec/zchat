export const m4 = {
  ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
  mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  },
  persp(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  },
  ortho(l, r, b, t, n, f) {
    return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0, -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
  },
  look(eye, at, up) {
    let zx = eye[0] - at[0], zy = eye[1] - at[1], zz = eye[2] - at[2];
    let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
    l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * eye[0] + xy * eye[1] + xz * eye[2]), -(yx * eye[0] + yy * eye[1] + yz * eye[2]), -(zx * eye[0] + zy * eye[1] + zz * eye[2]), 1]);
  },
  pose(x, y, z, yaw, pitch = 0, roll = 0, s = 1) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    const r00 = cy * cr + sy * sp * sr, r01 = -cy * sr + sy * sp * cr, r02 = sy * cp;
    const r10 = cp * sr, r11 = cp * cr, r12 = -sp;
    const r20 = -sy * cr + cy * sp * sr, r21 = sy * sr + cy * sp * cr, r22 = cy * cp;
    return new Float32Array([r00 * s, r10 * s, r20 * s, 0, r01 * s, r11 * s, r21 * s, 0, r02 * s, r12 * s, r22 * s, 0, x, y, z, 1]);
  },
  inv(m) {
    const a = m, o = new Float32Array(16);
    const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4], b03 = a[1] * a[6] - a[2] * a[5];
    const b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6], b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12];
    const b08 = a[8] * a[15] - a[11] * a[12], b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
    let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!d) return m4.ident();
    d = 1 / d;
    o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d;
    o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
    o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d;
    o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
    o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d;
    o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
    o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d;
    o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
    return o;
  },
  apply(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w, (m[1] * x + m[5] * y + m[9] * z + m[13]) / w, (m[2] * x + m[6] * y + m[10] * z + m[14]) / w, w];
  },
};

export function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export class MeshBuilder {
  constructor() { this.v = []; this.T = null; }
  setT(T) { this.T = T; return this; }
  tp(p) {
    const T = this.T;
    if (!T) return p;
    return [T[0] * p[0] + T[4] * p[1] + T[8] * p[2] + T[12], T[1] * p[0] + T[5] * p[1] + T[9] * p[2] + T[13], T[2] * p[0] + T[6] * p[1] + T[10] * p[2] + T[14]];
  }
  tn(n) {
    const T = this.T;
    if (!T) return n;
    const x = T[0] * n[0] + T[4] * n[1] + T[8] * n[2], y = T[1] * n[0] + T[5] * n[1] + T[9] * n[2], z = T[2] * n[0] + T[6] * n[1] + T[10] * n[2];
    const l = Math.hypot(x, y, z) || 1;
    return [x / l, y / l, z / l];
  }
  tri(a, b, c, col, mat = 0) {
    a = this.tp(a); b = this.tp(b); c = this.tp(c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const k = typeof col === 'string' ? hexRgb(col) : col;
    this.v.push(a[0], a[1], a[2], nx, ny, nz, k[0], k[1], k[2], mat, b[0], b[1], b[2], nx, ny, nz, k[0], k[1], k[2], mat, c[0], c[1], c[2], nx, ny, nz, k[0], k[1], k[2], mat);
    return this;
  }
  triN(a, b, c, na, nb, nc, col, mat = 0) {
    const k = typeof col === 'string' ? hexRgb(col) : col;
    this.v.push(a[0], a[1], a[2], na[0], na[1], na[2], k[0], k[1], k[2], mat, b[0], b[1], b[2], nb[0], nb[1], nb[2], k[0], k[1], k[2], mat, c[0], c[1], c[2], nc[0], nc[1], nc[2], k[0], k[1], k[2], mat);
    return this;
  }
  quad(a, b, c, d, col, mat = 0) { this.tri(a, b, c, col, mat); this.tri(a, c, d, col, mat); return this; }
  surface(P, col, mat = 0, o = {}) {
    const R = P.length, C = P[0].length, wrap = !!o.wrap;
    const Q = P.map((row) => row.map((p) => this.tp(p)));
    const N = Q.map((row) => row.map(() => [0, 0, 0]));
    const cols = wrap ? C : C - 1;
    const add = (n, x, y, z) => { n[0] += x; n[1] += y; n[2] += z; };
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % C;
      const a = Q[i][j], b = Q[i + 1][j], c = Q[i + 1][j1], d = Q[i][j1];
      const ex = c[0] - a[0], ey = c[1] - a[1], ez = c[2] - a[2], fx = d[0] - b[0], fy = d[1] - b[1], fz = d[2] - b[2];
      const nx = ey * fz - ez * fy, ny = ez * fx - ex * fz, nz = ex * fy - ey * fx;
      add(N[i][j], nx, ny, nz); add(N[i + 1][j], nx, ny, nz); add(N[i + 1][j1], nx, ny, nz); add(N[i][j1], nx, ny, nz);
    }
    const sg = o.flip ? -1 : 1;
    for (const row of N) for (const n of row) { const l = (Math.hypot(n[0], n[1], n[2]) || 1) * sg; n[0] /= l; n[1] /= l; n[2] /= l; }
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % C;
      let cc = col, mm = mat;
      if (o.at) { const r = o.at(i, j); if (!r) continue; cc = r[0]; mm = r[1]; }
      const a = Q[i][j], b = Q[i + 1][j], c = Q[i + 1][j1], d = Q[i][j1];
      if (o.flip) { this.triN(a, c, b, N[i][j], N[i + 1][j1], N[i + 1][j], cc, mm); this.triN(a, d, c, N[i][j], N[i][j1], N[i + 1][j1], cc, mm); }
      else { this.triN(a, b, c, N[i][j], N[i + 1][j], N[i + 1][j1], cc, mm); this.triN(a, c, d, N[i][j], N[i + 1][j1], N[i][j1], cc, mm); }
    }
    return this;
  }
  lathe(cx, cy, cz, prof, seg, col, mat = 0, o = {}) {
    const P = prof.map(([r, ax]) => {
      const row = [];
      for (let j = 0; j < seg; j++) { const th = (j / seg) * Math.PI * 2 + (o.rot || 0); row.push([cx + ax, cy + Math.sin(th) * r, cz + Math.cos(th) * r]); }
      return row;
    });
    return this.surface(P, col, mat, { wrap: true, at: o.at, flip: o.flip });
  }
  revolve(cx, cy, cz, prof, seg, col, mat = 0, o = {}) {
    const P = prof.map(([r, y]) => {
      const row = [];
      for (let j = 0; j <= seg; j++) { const th = (j / seg) * Math.PI * 2; row.push([cx + Math.cos(th) * r, cy + y, cz + Math.sin(th) * r]); }
      return row;
    });
    return this.surface(P, col, mat, { at: o.at, flip: o.flip });
  }
  mark() { return this.v.length; }
  mirrorX(from) {
    const v = this.v, end = v.length;
    for (let k = from; k < end; k += 30) for (const idx of [0, 2, 1]) {
      const b = k + idx * 10;
      v.push(-v[b], v[b + 1], v[b + 2], -v[b + 3], v[b + 4], v[b + 5], v[b + 6], v[b + 7], v[b + 8], v[b + 9]);
    }
    return this;
  }
  box(x, y, z, sx, sy, sz, col, mat = 0, o = {}) {
    const hx = sx / 2, hz = sz / 2, top = o.top || col, bot = o.noBottom;
    const p = (dx, dy, dz) => [x + dx, y + dy, z + dz];
    const tx = o.taper || 0;
    const a = p(-hx, 0, -hz), b = p(hx, 0, -hz), c = p(hx, 0, hz), d = p(-hx, 0, hz);
    const e = p(-hx + tx, sy, -hz + tx), f = p(hx - tx, sy, -hz + tx), g = p(hx - tx, sy, hz - tx), h = p(-hx + tx, sy, hz - tx);
    this.quad(e, h, g, f, top, mat);
    if (!bot) this.quad(a, b, c, d, col, mat);
    this.quad(d, c, g, h, col, mat);
    this.quad(b, a, e, f, col, mat);
    this.quad(c, b, f, g, col, mat);
    this.quad(a, d, h, e, col, mat);
    return this;
  }
  cyl(x, y, z, r, h, seg, col, mat = 0, o = {}) {
    const r2 = o.r2 != null ? o.r2 : r;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const p0 = [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], p1 = [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r];
      const q0 = [x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2], q1 = [x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2];
      this.quad(p0, q0, q1, p1, col, mat);
      if (o.cap !== false && r2 > 0.001) this.tri([x, y + h, z], q1, q0, o.capCol || col, mat);
    }
    return this;
  }
  smoothCyl(x, y, z, r, h, seg, col, mat = 0, o = {}) {
    const r2 = o.r2 != null ? o.r2 : r;
    const ring = (rr, yy) => { const row = []; for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; row.push([x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr]); } return row; };
    this.surface([ring(r, y), ring(r2, y + h)], col, mat);
    if (o.cap !== false && r2 > 0.001) for (let j = 0; j < seg; j++) { const a0 = (j / seg) * Math.PI * 2, a1 = ((j + 1) / seg) * Math.PI * 2; this.tri([x, y + h, z], [x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2], [x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2], o.capCol || col, mat); }
    return this;
  }
  wheel(x, y, z, r, w, seg, tire, rim) {
    const hw = w / 2;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0) * r, s0 = Math.sin(a0) * r, c1 = Math.cos(a1) * r, s1 = Math.sin(a1) * r;
      this.quad([x - hw, y + s0, z + c0], [x - hw, y + s1, z + c1], [x + hw, y + s1, z + c1], [x + hw, y + s0, z + c0], tire, 0);
      const k = 0.62;
      this.tri([x + hw + 0.005, y, z], [x + hw + 0.005, y + s0 * k, z + c0 * k], [x + hw + 0.005, y + s1 * k, z + c1 * k], rim, 0.72);
      this.tri([x + hw, y + s0 * k, z + c0 * k], [x + hw, y + s0, z + c0], [x + hw, y + s1, z + c1], tire, 0);
      this.tri([x + hw, y + s0 * k, z + c0 * k], [x + hw, y + s1, z + c1], [x + hw, y + s1 * k, z + c1 * k], tire, 0);
      this.tri([x - hw - 0.005, y, z], [x - hw - 0.005, y + s1 * k, z + c1 * k], [x - hw - 0.005, y + s0 * k, z + c0 * k], rim, 0.72);
      this.tri([x - hw, y + s0 * k, z + c0 * k], [x - hw, y + s1, z + c1], [x - hw, y + s0, z + c0], tire, 0);
      this.tri([x - hw, y + s0 * k, z + c0 * k], [x - hw, y + s1 * k, z + c1 * k], [x - hw, y + s1, z + c1], tire, 0);
    }
    return this;
  }
  blob(x, y, z, rx, ry, rz, col, mat = 0, rnd = null, seg = 7, smooth = false) {
    const rows = Math.max(3, Math.round(seg * 0.6));
    const P = [];
    for (let i = 0; i <= rows; i++) {
      const v = i / rows, phi = v * Math.PI;
      const ring = [];
      for (let j = 0; j < seg; j++) {
        const th = (j / seg) * Math.PI * 2;
        const jit = rnd && i > 0 && i < rows ? 1 + (rnd() - 0.5) * 0.22 : 1;
        ring.push([x + Math.sin(phi) * Math.cos(th) * rx * jit, y + Math.cos(phi) * ry * jit, z + Math.sin(phi) * Math.sin(th) * rz * jit]);
      }
      P.push(ring);
    }
    if (smooth) return this.surface(P, col, mat, { wrap: true, flip: true });
    for (let i = 0; i < rows; i++) for (let j = 0; j < seg; j++) {
      const a = P[i][j], b = P[i][(j + 1) % seg], c = P[i + 1][(j + 1) % seg], d = P[i + 1][j];
      if (i === 0) this.tri(a, c, d, col, mat); else if (i === rows - 1) this.tri(a, b, d, col, mat); else this.quad(a, b, c, d, col, mat);
    }
    return this;
  }
  build() { return new Float32Array(this.v); }
  get count() { return this.v.length / 10; }
}

const VS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec4 aCol;
uniform mat4 uModel, uVP, uLightVP;
out vec3 vPos; out vec3 vNor; out vec4 vCol; out vec4 vLight;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNor = mat3(uModel) * aNor;
  vCol = aCol;
  vLight = uLightVP * wp;
  gl_Position = uVP * wp;
}`;
const SKVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNor;
layout(location=2) in vec4 aCol;
layout(location=3) in float aBone;
uniform mat4 uModel, uVP, uLightVP;
uniform mat4 uBones[20];
out vec3 vPos; out vec3 vNor; out vec4 vCol; out vec4 vLight;
void main() {
  mat4 B = uModel * uBones[int(aBone + 0.5)];
  vec4 wp = B * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNor = mat3(B) * aNor;
  vCol = aCol;
  vLight = uLightVP * wp;
  gl_Position = uVP * wp;
}`;
const SKSVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=3) in float aBone;
uniform mat4 uModel, uLightVP;
uniform mat4 uBones[20];
void main() { gl_Position = uLightVP * uModel * uBones[int(aBone + 0.5)] * vec4(aPos, 1.0); }`;
const FS = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uFogSun, uCam, uHor, uZen, uTint;
uniform float uFogDen, uShadowOn, uExposure, uMode, uAlpha, uDetail;
uniform sampler2DShadow uShadow;
uniform vec4 uPL[4]; uniform vec3 uPLC[4]; uniform float uPLN;
uniform vec4 uSP, uSPD; uniform vec3 uSPC;
out vec4 o;
float dh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float dn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(dh(i), dh(i + vec2(1.0, 0.0)), u.x), mix(dh(i + vec2(0.0, 1.0)), dh(i + vec2(1.0, 1.0)), u.x), u.y); }
vec3 detail(vec3 base, float k, vec3 p, vec3 n) {
  vec2 q = abs(n.y) > 0.6 ? p.xz : (abs(n.x) > abs(n.z) ? p.zy : p.xy);
  float a = dn(q * 2.1), b = dn(q * 7.3 + 11.0), c = dh(floor(q * 26.0));
  float g;
  if (k < 0.15) g = 0.86 + 0.2 * a + 0.16 * (b - 0.5) - step(0.93, c) * 0.16 + step(c, 0.04) * 0.1;
  else if (k < 0.25) g = 0.9 + 0.13 * a + 0.12 * (b - 0.5) - step(0.95, c) * 0.1 + step(c, 0.03) * 0.06;
  else if (k < 0.35) g = 0.95 + 0.06 * a + step(0.988, c) * 0.3;
  else if (k < 0.5) {
    vec2 w = k < 0.425 ? q : q.yx;
    float row = floor(w.y * 2.5), pl = dh(vec2(row, 3.0));
    float gr = dn(vec2(w.x * 0.8 + pl * 9.0, w.y * 16.0));
    float e = 0.5 - abs(fract(w.y * 2.5) - 0.5);
    float ej = fract(w.x * 0.41 + pl * 0.73); ej = min(ej, 1.0 - ej);
    g = 0.83 + 0.2 * gr + 0.14 * (pl - 0.5) - (1.0 - smoothstep(0.0, 0.05, e)) * 0.3 - (1.0 - smoothstep(0.0, 0.012, ej)) * 0.22;
  }
  else if (k < 0.55) g = 0.9 + 0.1 * dn(vec2(q.x * 26.0, q.y * 1.4)) + 0.08 * (a - 0.5);
  else if (k < 0.65) g = 0.88 + 0.1 * a + 0.2 * (c - 0.5);
  else if (k < 0.75) g = 0.8 + 0.24 * a + 0.14 * (b - 0.5) + step(0.97, c) * 0.12;
  else if (k < 0.85) g = 0.93 + 0.08 * a + 0.05 * (b - 0.5) + 0.05 * sin(q.x * 2.6 + q.y * 0.9 + a * 5.0);
  else g = 0.82 + 0.26 * b + 0.12 * (a - 0.5);
  return base * mix(1.0, g, uDetail);
}
float shadowAt(vec4 lp, float nl) {
  vec3 p = lp.xyz / lp.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uShadow, 0));
  float bias = 0.0006 + 0.0018 * (1.0 - nl);
  float s = 0.0;
  for (int x = -1; x <= 1; x++) for (int y = -1; y <= 1; y++) s += texture(uShadow, vec3(p.xy + vec2(float(x), float(y)) * t * 1.25, p.z - bias));
  return s / 9.0;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 envAt(vec3 r) {
  float y = r.y;
  vec3 sky = mix(uHor, uZen, pow(clamp(y, 0.0, 1.0), 0.55));
  vec3 gnd = mix(uHor * 0.6, uGndCol * 0.8, clamp(-y * 4.0, 0.0, 1.0));
  vec3 e = y >= 0.0 ? sky : gnd;
  float sd = max(dot(r, uSunDir), 0.0);
  return e + uFogSun * pow(sd, 10.0) * 0.4;
}
void main() {
  vec3 n = normalize(vNor);
  if (!gl_FrontFacing) n = -n;
  vec3 base = pow(vCol.rgb, vec3(2.2));
  if (uMode > 2.5) base = pow(uTint, vec3(2.2));
  float mat = vCol.a;
  if (mat < -0.001) { float k = -mat; base = detail(base, k, vPos, n); mat = k > 0.45 && k < 0.55 ? 0.09 : k > 0.25 && k < 0.35 ? 0.07 : 0.0; }
  vec3 v = normalize(uCam - vPos);
  float d = length(uCam - vPos);
  float nv = max(dot(n, v), 0.0);
  vec3 col;
  if (mat >= 0.95) {
    col = base * 3.2;
  } else if (mat >= 0.8) {
    col = base * (0.5 + (mat - 0.8) * 24.0);
  } else {
    float nl = max(dot(n, uSunDir), 0.0);
    float sh = uShadowOn > 0.5 ? shadowAt(vLight, nl) : 1.0;
    vec3 amb = mix(uGndCol, uSkyCol, n.y * 0.5 + 0.5);
    vec3 h = normalize(v + uSunDir);
    float nh = max(dot(n, h), 0.0);
    vec3 r = reflect(-v, n);
    if (mat < 0.05) {
      col = base * (amb + uSunCol * nl * sh);
    } else if (mat < 0.5) {
      float g = (mat - 0.05) / 0.45;
      col = base * (amb + uSunCol * nl * sh);
      float fr = pow(1.0 - nv, 4.0);
      col = mix(col, envAt(r), fr * 0.5 * g);
      col += uSunCol * pow(nh, 30.0 + 160.0 * g) * sh * g * 1.2;
    } else if (mat < 0.6) {
      float flake = (mat - 0.5) * 10.0;
      vec3 dif = base * (amb * 0.85 + uSunCol * nl * sh);
      float fr = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
      col = dif * (1.0 - fr * 0.5) + envAt(r) * fr * 0.9;
      col += uSunCol * (pow(nh, 500.0) * 7.0 + pow(nh, 60.0) * 0.3 + pow(nh, 14.0) * flake * 0.18 * base) * sh;
    } else if (mat < 0.7) {
      float refl = (mat - 0.6) * 10.0;
      float fr = 0.06 + 0.94 * pow(1.0 - nv, 4.0);
      vec3 dif = base * (amb * 0.7 + uSunCol * nl * sh * 0.5);
      col = mix(dif, envAt(r), clamp(fr * (0.45 + refl * 0.55) + 0.12 * refl, 0.0, 1.0));
      col += uSunCol * pow(nh, 700.0) * 9.0 * sh;
    } else {
      float rough = (mat - 0.7) * 10.0;
      vec3 env = mix(envAt(r), amb * 1.4, rough);
      col = base * (env * 1.15 + uSunCol * nl * sh * 0.3);
      col += uSunCol * pow(nh, mix(600.0, 40.0, rough)) * mix(6.0, 0.9, rough) * sh;
    }
    if (uPLN > 0.5 || uSPC.r > 0.0) {
      vec3 dl = vec3(0.0);
      for (int i = 0; i < 4; i++) {
        if (float(i) >= uPLN) break;
        vec3 L = uPL[i].xyz - vPos; float dd = length(L);
        float at = clamp(1.0 - dd / uPL[i].w, 0.0, 1.0);
        dl += uPLC[i] * (max(dot(n, L / max(dd, 0.001)), 0.0) * 0.85 + 0.15) * at * at;
      }
      if (uSPC.r > 0.0) {
        vec3 L = uSP.xyz - vPos; float dd = length(L); vec3 l = L / max(dd, 0.001);
        float cone = smoothstep(uSPD.w, uSPD.w + 0.1, dot(-l, uSPD.xyz));
        float at = clamp(1.0 - dd / uSP.w, 0.0, 1.0);
        dl += uSPC * (max(dot(n, l), 0.0) * 0.8 + 0.2) * cone * at * at;
      }
      col += base * dl;
    }
  }
  float f = 1.0 - exp(-pow(d * uFogDen, 1.35));
  float sunAmt = pow(max(dot(-v, uSunDir), 0.0), 6.0);
  vec3 fogc = mix(uFogCol, uFogSun, sunAmt);
  col = mix(col, fogc, clamp(f, 0.0, 1.0));
  col = pow(aces(col * uExposure), vec3(1.0 / 2.2));
  if (uMode > 0.5) {
    float fr = pow(1.0 - nv, 2.2);
    float a = (uMode < 1.5 ? clamp(0.06 + fr * 0.9, 0.0, 1.0) : 1.0) * uAlpha;
    o = vec4(col * a, uMode < 1.5 ? a : uMode < 2.5 ? 0.0 : a);
  } else o = vec4(col, 1.0);
}`;
const WVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aE;
uniform mat4 uModel, uVP;
out vec3 vPos; out vec2 vE;
void main() { vec4 w = uModel * vec4(aPos, 1.0); vPos = w.xyz; vE = aE; gl_Position = uVP * w; }`;
const WFS = `#version 300 es
precision highp float;
in vec3 vPos; in vec2 vE;
uniform vec3 uSunDir, uSunCol, uFogCol, uFogSun, uCam, uHor, uZen, uDeep, uShal, uSkyCol, uImp;
uniform float uFogDen, uExposure, uTime, uKind;
out vec4 o;
float dh(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float dn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(dh(i), dh(i + vec2(1.0, 0.0)), u.x), mix(dh(i + vec2(0.0, 1.0)), dh(i + vec2(1.0, 1.0)), u.x), u.y); }
float wv(vec2 p) {
  float h = sin(p.x * 2.1 + uTime * 0.9) * 0.05 + sin(p.y * 2.7 - uTime * 0.8) * 0.04;
  h += (dn(p * 2.2 + vec2(uTime * 0.21, uTime * 0.13)) - 0.5) * 0.16 + (dn(p * 5.3 - vec2(uTime * 0.37, -uTime * 0.29)) - 0.5) * 0.07;
  vec2 d = p - uImp.xy; float r = length(d);
  h += sin(r * 7.5 - uTime * 7.0) * exp(-r * 0.55) * 0.09 * uImp.z;
  return h;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec3 v = normalize(uCam - vPos);
  float d = length(uCam - vPos);
  vec3 col; float a;
  vec3 amb = uSkyCol * 0.85 + uSunCol * max(uSunDir.y, 0.0) * 0.4;
  if (uKind < 0.5) {
    vec2 q = vPos.xz;
    float e = 0.06;
    float hx = wv(q + vec2(e, 0.0)) - wv(q - vec2(e, 0.0)), hz = wv(q + vec2(0.0, e)) - wv(q - vec2(0.0, e));
    float far = smoothstep(14.0, 60.0, d);
    vec3 n = normalize(vec3(-hx * (1.0 - far * 0.7), 2.0 * e, -hz * (1.0 - far * 0.7)));
    float nv = max(dot(n, v), 0.0);
    float fr = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
    vec3 r = reflect(-v, n);
    float ry = clamp(r.y, 0.0, 1.0);
    vec3 sky = mix(uHor, uZen, pow(ry, 0.6));
    float tl = 1.0 - smoothstep(0.02, 0.2 + 0.1 * dn(vec2(atan(r.z, r.x) * 6.0, 1.7)), ry);
    sky = mix(sky, uHor * vec3(0.12, 0.15, 0.1), tl * 0.88);
    float dep = clamp(vE.y, 0.0, 1.0);
    vec3 base = mix(uShal, uDeep, smoothstep(0.0, 0.7, dep)) * amb;
    col = mix(base, sky, clamp(fr, 0.0, 1.0));
    float sp = max(dot(r, uSunDir), 0.0);
    col += uSunCol * (pow(sp, 400.0) * 3.0 + pow(sp, 40.0) * 0.12);
    vec2 di = q - uImp.xy; float ri = length(di);
    float foam = (1.0 - smoothstep(0.2, 1.9, ri)) * smoothstep(0.35, 0.75, dn(q * 3.5 + vec2(0.0, uTime * 1.6)) * 0.6 + dn(q * 7.0 - uTime * 0.9) * 0.4 + (1.0 - smoothstep(0.0, 1.2, ri)) * 0.35) * uImp.z;
    col = mix(col, vec3(0.86, 0.9, 0.9) * amb * 1.4, foam * 0.85);
    a = clamp(mix(0.5, 0.97, smoothstep(0.0, 0.45, dep)) + fr * 0.5 + foam * 0.5, 0.0, 1.0) * clamp(vE.x, 0.0, 1.0);
  } else {
    vec2 q = vec2(vE.x * 9.0, vE.y * 3.0 - uTime * 2.6);
    float n1 = dn(q * vec2(1.0, 2.4)) * 0.55 + dn(q * vec2(2.3, 5.5) + 7.0) * 0.3 + dn(q * vec2(5.0, 11.0) + 3.0) * 0.15;
    float streak = smoothstep(0.3, 0.85, n1);
    float edge = smoothstep(0.0, 0.16 + 0.1 * dn(vec2(vE.y * 6.0 - uTime * 2.0, 1.0)), vE.x) * smoothstep(1.0, 0.84 - 0.1 * dn(vec2(vE.y * 6.0 - uTime * 2.0, 5.0)), vE.x);
    float lip = 1.0 - smoothstep(0.0, 0.08, vE.y);
    float bot = smoothstep(0.78, 1.0, vE.y);
    vec3 white = vec3(0.9, 0.94, 0.95);
    col = mix(uShal, white, clamp(streak * 0.8 + bot * 0.6 + lip * 0.3, 0.0, 1.0)) * amb * 1.25;
    a = clamp((0.38 + streak * 0.52 + bot * 0.25) * edge * smoothstep(0.0, 0.035, vE.y) * (1.0 - smoothstep(0.94, 1.0, vE.y) * 0.6), 0.0, 1.0);
  }
  float f = 1.0 - exp(-pow(d * uFogDen, 1.35));
  float sunAmt = pow(max(dot(-v, uSunDir), 0.0), 6.0);
  col = mix(col, mix(uFogCol, uFogSun, sunAmt), clamp(f, 0.0, 1.0));
  col = pow(aces(col * uExposure), vec3(1.0 / 2.2));
  o = vec4(col * a, a);
}`;
const TSKVS = (nb) => `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNor;
layout(location=2) in vec2 aUv;
layout(location=3) in uvec4 aJ;
layout(location=4) in vec4 aW;
uniform mat4 uModel, uVP, uLightVP;
uniform mat3x4 uB[${nb}];
uniform vec4 uCol;
out vec3 vPos; out vec3 vNor; out vec4 vCol; out vec4 vLight; out vec2 vUv; out float vCut;
void main() {
  mat3x4 S = uB[int(aJ.x)] * aW.x + uB[int(aJ.y)] * aW.y + uB[int(aJ.z)] * aW.z + uB[int(aJ.w)] * aW.w;
  vec3 p = vec4(aPos, 1.0) * S;
  vec3 n = vec4(aNor.xyz, 0.0) * S;
  vec4 wp = uModel * vec4(p, 1.0);
  vPos = wp.xyz;
  vNor = mat3(uModel) * n;
  vCol = uCol;
  vUv = vec2(aUv.x, 1.0 - aUv.y);
  vCut = aNor.w;
  vLight = uLightVP * wp;
  gl_Position = uVP * wp;
}`;
const TSKSVS = (nb) => `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=3) in uvec4 aJ;
layout(location=4) in vec4 aW;
uniform mat4 uModel, uLightVP;
uniform mat3x4 uB[${nb}];
void main() {
  mat3x4 S = uB[int(aJ.x)] * aW.x + uB[int(aJ.y)] * aW.y + uB[int(aJ.z)] * aW.z + uB[int(aJ.w)] * aW.w;
  gl_Position = uLightVP * uModel * vec4(vec4(aPos, 1.0) * S, 1.0);
}`;
const SVS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uModel, uLightVP;
void main() { gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }`;
const TFS = FS
  .replace('in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight;', 'in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight; in vec2 vUv; in float vCut;\nuniform sampler2D uTex, uNrm; uniform float uNrmOn, uGlossA;')
  .replace('  float mat = vCol.a;\n', '  float mat = vCol.a;\n  if (uGlossA > 0.5) mat = 0.06 + tc.a * 0.42;\n')
  .replace('float shadowAt(vec4 lp, float nl) {', `vec3 perturb(vec3 n, vec3 p, vec2 uv) {
  vec2 uo = vec2(uv.x, 1.0 - uv.y);
  vec3 q0 = dFdx(p), q1 = dFdy(p);
  vec2 st0 = dFdx(uo), st1 = dFdy(uo);
  vec3 q1p = cross(q1, n), q0p = cross(n, q0);
  vec3 T = q1p * st0.x + q0p * st1.x;
  vec3 B = q1p * st0.y + q0p * st1.y;
  float det = max(dot(T, T), dot(B, B));
  float sc = det == 0.0 ? 0.0 : inversesqrt(det);
  vec3 m = texture(uNrm, uv).xyz * 2.0 - 1.0;
  return normalize(T * (m.x * sc) + B * (m.y * sc) + n * m.z);
}
float shadowAt(vec4 lp, float nl) {`)
  .replace('  vec3 n = normalize(vNor);\n  if (!gl_FrontFacing) n = -n;\n  vec3 base = pow(vCol.rgb, vec3(2.2));', '  vec4 tc = texture(uTex, vUv);\n  if (vCut > 0.5 && tc.a < 0.45) discard;\n  vec3 n = normalize(vNor);\n  if (!gl_FrontFacing) n = -n;\n  if (uNrmOn > 0.5) n = perturb(n, vPos, vUv);\n  vec3 base = pow(tc.rgb * vCol.rgb, vec3(2.2));');
const TAVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNor;
layout(location=2) in vec2 aUv;
layout(location=3) in vec4 aCol;
layout(location=4) in float aLay;
uniform mat4 uModel, uVP, uLightVP;
uniform vec4 uCol;
out vec3 vPos; out vec3 vNor; out vec4 vCol; out vec4 vLight; out vec2 vUv; out float vLay; out float vFl; out float vLay2; out float vBl;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNor = mat3(uModel) * aNor.xyz;
  vCol = vec4(aCol.rgb * uCol.rgb, uCol.a);
  vUv = aUv; vLay = mod(aLay, 256.0); vLay2 = floor(aLay / 256.0); vBl = aCol.a; vFl = aNor.w * 8.0;
  vLight = uLightVP * wp;
  gl_Position = uVP * wp;
}`;
const TASVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNor;
layout(location=2) in vec2 aUv;
layout(location=4) in float aLay;
uniform mat4 uModel, uLightVP;
out vec2 vUv; out float vLay; out float vFl;
void main() { vUv = aUv; vLay = aLay; vFl = aNor.w * 8.0; gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }`;
const TASFS = `#version 300 es
precision mediump float;
precision mediump sampler2DArray;
in vec2 vUv; in float vLay; in float vFl;
uniform sampler2DArray uArr;
void main() { if (vFl > 0.5 && vFl < 1.5 && texture(uArr, vec3(vUv, vLay)).a < 0.5) discard; }`;
const TAFS = FS
  .replace('precision highp sampler2DShadow;', 'precision highp sampler2DShadow;\nprecision highp sampler2DArray;')
  .replace('in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight;', 'in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight; in vec2 vUv; in float vLay; in float vFl; in float vLay2; in float vBl;\nuniform sampler2DArray uArr;')
  .replace('  vec3 n = normalize(vNor);\n  if (!gl_FrontFacing) n = -n;\n  vec3 base = pow(vCol.rgb, vec3(2.2));', '  vec4 tc = texture(uArr, vec3(vUv, vLay));\n  if (vLay2 > 0.5 && vBl > 0.004) tc = mix(tc, texture(uArr, vec3(vUv, vLay2)), vBl);\n  if (vFl > 0.5 && vFl < 1.5 && tc.a < 0.5) discard;\n  vec3 n = normalize(vNor);\n  if (!gl_FrontFacing) n = -n;\n  vec3 base = pow(tc.rgb * vCol.rgb, vec3(2.2));')
  .replace('  float mat = vCol.a;\n', '  float mat = vFl > 3.5 ? 0.76 : vFl > 2.5 ? 0.97 : vFl > 1.5 ? 0.64 : vCol.a;\n');
const SFS = `#version 300 es
precision mediump float;
void main() {}`;
const SKYVS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vP;
void main() { vP = aPos; gl_Position = vec4(aPos, 0.9999, 1.0); }`;
const SKYFS = `#version 300 es
precision highp float;
in vec2 vP;
uniform mat4 uInvVP;
uniform vec3 uSunDir, uZenith, uHorizon, uSunCol, uFogSun, uCam, uCloud;
uniform float uExposure, uTime, uClouds, uStars, uSkyOn;
uniform sampler2D uSkyTex;
out vec4 o;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec4 a = uInvVP * vec4(vP, -1.0, 1.0), b = uInvVP * vec4(vP, 1.0, 1.0);
  vec3 dir = normalize(b.xyz / b.w - a.xyz / a.w);
  if (uSkyOn > 0.5) {
    float u1 = atan(dir.x, -dir.z) * 0.15915494 + 0.5;
    float u2 = fract(u1 + 0.5) - 0.5;
    float eld = degrees(asin(clamp(dir.y, -1.0, 1.0)));
    float v = (90.0 - eld) / 98.0;
    vec2 a1 = vec2(dFdx(u1), dFdy(u1)), a2 = vec2(dFdx(u2), dFdy(u2));
    vec2 gu = dot(a1, a1) < dot(a2, a2) ? a1 : a2;
    vec3 c = textureGrad(uSkyTex, vec2(u1, clamp(v, 0.0, 1.0)), vec2(gu.x, dFdx(v)), vec2(gu.y, dFdy(v))).rgb;
    c = pow(c, vec3(2.2));
    float sd0 = max(dot(dir, uSunDir), 0.0);
    c += uSunCol * pow(sd0, 2200.0) * 1.6;
    c = mix(c, pow(uHorizon, vec3(2.2)) * 0.62, smoothstep(-1.5, -6.0, eld));
    o = vec4(pow(c, vec3(1.0 / 2.2)), 1.0);
    return;
  }
  float el = max(dir.y, 0.0);
  vec3 sky = mix(pow(uHorizon, vec3(2.2)), pow(uZenith, vec3(2.2)), pow(el, 0.42));
  float sd = max(dot(dir, uSunDir), 0.0);
  sky += pow(uFogSun, vec3(2.2)) * pow(sd, 8.0) * 0.9;
  sky += uSunCol * pow(sd, 900.0) * 18.0;
  sky += uSunCol * pow(sd, 60.0) * 0.6;
  if (uStars > 0.0 && dir.y > 0.05) {
    vec2 sp = dir.xz / (dir.y + 0.3) * 180.0;
    float st = step(0.9965, h21(floor(sp))) * smoothstep(0.05, 0.4, dir.y);
    sky += vec3(st) * uStars * 1.4;
  }
  if (dir.y > 0.01 && uClouds > 0.0) {
    vec2 uv = dir.xz / (dir.y + 0.12) * 1.6 + vec2(uTime * 0.01, 0.0);
    float c = smoothstep(0.52 - uClouds * 0.12, 0.78, fbm(uv));
    vec3 cc = mix(pow(uCloud, vec3(2.2)), pow(uFogSun, vec3(2.2)) * 1.3, pow(sd, 3.0));
    sky = mix(sky, cc * (0.75 + 0.5 * fbm(uv * 2.0)), c * 0.85 * smoothstep(0.01, 0.12, dir.y) * min(1.0, uClouds * 1.2));
  }
  if (dir.y < 0.0) sky = mix(sky, pow(uHorizon, vec3(2.2)) * 0.9, smoothstep(0.0, -0.08, dir.y));
  o = vec4(pow(aces(sky * uExposure), vec3(1.0 / 2.2)), 1.0);
}`;
const PVS = `#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec4 aCenter;
layout(location=2) in vec3 aInfo;
layout(location=3) in vec4 aDir;
uniform mat4 uVP; uniform vec3 uRight, uUp, uCam;
out vec2 vUv; out vec3 vInfo; out vec3 vPos; out float vGy;
void main() {
  vec3 p;
  vGy = -1e4;
  if (aDir.w > 0.0) {
    vec3 ax = aDir.xyz;
    float al = length(ax);
    ax = al > 1e-5 ? ax / al : uUp;
    vec3 sd = cross(ax, normalize(uCam - aCenter.xyz));
    float sl = length(sd);
    sd = sl > 1e-4 ? sd / sl : uRight;
    p = aCenter.xyz + ax * (aCorner.y * aDir.w) + sd * (aCorner.x * aCenter.w);
  } else if (aDir.w < -1.5) {
    vec3 n = normalize(aDir.xyz);
    vec3 t1 = normalize(abs(n.y) < 0.95 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(n, t1);
    float an = aInfo.z * 6.2832, ca = cos(an), sa = sin(an);
    p = aCenter.xyz + n * 0.012 + ((t1 * ca + t2 * sa) * aCorner.x + (t2 * ca - t1 * sa) * aCorner.y) * aCenter.w;
  } else if (aDir.w < 0.0) p = aCenter.xyz + vec3(aCorner.x, 0.0, aCorner.y) * aCenter.w;
  else {
    float an = aDir.x, ca = cos(an), sa = sin(an);
    vec2 cr = vec2(aCorner.x * ca - aCorner.y * sa, aCorner.x * sa + aCorner.y * ca);
    p = aCenter.xyz + (uRight * cr.x + uUp * cr.y) * aCenter.w;
    if (aDir.y != 0.0) vGy = aDir.y - 1000.0;
  }
  vUv = aCorner; vInfo = aInfo; vPos = p;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const PFS = `#version 300 es
precision highp float;
in vec2 vUv; in vec3 vInfo; in vec3 vPos; in float vGy;
uniform vec3 uCam, uFogCol; uniform float uFogDen, uFxOn, uFx2On, uBoomOn;
uniform sampler2D uFx, uFx2, uBoom;
out vec4 o;
float fxTile(float tile, float rot) {
  float c = cos(rot), s = sin(rot);
  vec2 q = vec2(c * vUv.x - s * vUv.y, s * vUv.x + c * vUv.y);
  if (abs(q.x) > 1.0 || abs(q.y) > 1.0) return 0.0;
  vec2 uv = (vec2(mod(tile, 4.0), floor(tile / 4.0)) + vec2(q.x * 0.5 + 0.5, 0.5 - q.y * 0.5) * (124.0 / 128.0) + 2.0 / 128.0) / 4.0;
  return texture(uFx, uv).a;
}
float hh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2(1.0, 0.0)), u.x), mix(hh(i + vec2(0.0, 1.0)), hh(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float VX = vInfo.x * (vGy > -9000.0 ? smoothstep(vGy - 0.05, vGy + 0.75, vPos.y) : 1.0);
  float t = vInfo.y;
  float a = (1.0 - smoothstep(0.15, 1.0, r)) * VX;
  vec3 c; float add = 0.0;
  if (t > 27.5) {
    float d0 = length(uCam - vPos);
    float f0 = 1.0 - exp(-pow(d0 * uFogDen, 1.35));
    vec3 fc = pow(uFogCol, vec3(1.0 / 2.2));
    vec2 uv = vec2(vUv.x * 0.5 + 0.5, 0.5 - vUv.y * 0.5);
    if (t < 28.5) {
      if (uFx2On < 0.5) { float e = 1.0 - smoothstep(0.15, 0.5, r); float a3 = e * VX * 0.85; o = vec4(vec3(0.02) * a3, a3); return; }
      vec4 tx = texture(uFx2, vec2(uv.x * 0.25, 0.5 + uv.y * 0.5));
      float a3 = tx.a * VX;
      o = vec4(mix(tx.rgb * 0.45, fc, f0) * a3, a3);
      return;
    }
    if (t < 29.5) {
      if (uFx2On < 0.5) { float e = 1.0 - smoothstep(0.0, 1.0, r); o = vec4(vec3(1.0, 0.8, 0.45) * 2.0 * e * e * VX, 0.0); return; }
      float tile = floor(vInfo.z * 3.999), an = vInfo.z * 41.0, ca = cos(an), sa = sin(an);
      vec2 q = vec2(ca * vUv.x - sa * vUv.y, sa * vUv.x + ca * vUv.y);
      vec3 tx = texture(uFx2, vec2((tile + q.x * 0.5 + 0.5) * 0.25, (0.5 - q.y * 0.5) * 0.5)).rgb;
      o = vec4(tx * vec3(1.15, 1.0, 0.86) * 1.7 * VX, 0.0);
      return;
    }
    if (t < 30.5) {
      if (uFx2On < 0.5) { float e = 1.0 - smoothstep(0.0, 1.0, r); o = vec4(vec3(1.0, 0.75, 0.4) * 1.6 * e * e * VX, 0.0); return; }
      vec3 tx = texture(uFx2, vec2((1.0 + vUv.y * 0.5 + 0.5) * 0.25, 0.5 + (0.5 - vUv.x * 0.5) * 0.5)).rgb;
      o = vec4(tx * vec3(1.15, 0.95, 0.8) * 1.5 * VX, 0.0);
      return;
    }
    if (t > 32.5) {
      float sd2 = vInfo.z * 17.0;
      float n2 = vn(vUv * 2.4 + sd2) * 0.6 + vn(vUv * 5.6 - sd2 * 1.3) * 0.4;
      if (t < 33.5) {
        float m2 = uFxOn > 0.5 ? fxTile(6.0 + floor(vInfo.z * 5.99), vInfo.z * 6.283) : 1.0 - smoothstep(0.35 + n2 * 0.35, 1.0, r);
        float a2 = m2 * VX;
        vec3 c2 = mix(vec3(0.06, 0.055, 0.05), vec3(0.38, 0.36, 0.33), clamp(0.45 + vUv.y * 0.3 + m2 * 0.2, 0.0, 1.0));
        o = vec4(mix(c2, fc, f0) * a2, a2);
        return;
      }
      if (t < 34.5) {
        float e2 = 1.0 - smoothstep(0.42 + n2 * 0.4, 0.6 + n2 * 0.4, r);
        vec3 c2 = mix(vec3(0.06, 0.05, 0.035), vec3(0.22, 0.17, 0.12), n2);
        float a2 = e2 * VX;
        o = vec4(mix(c2, fc, f0) * a2, a2);
        return;
      }
      float ring2 = smoothstep(0.5, 0.88, r) * (1.0 - smoothstep(0.88, 1.0, r));
      float br2 = 0.55 + 0.45 * vn(vec2(atan(vUv.y, vUv.x) * 6.0, sd2));
      float a2 = ring2 * br2 * VX * 0.6;
      o = vec4(mix(vec3(0.6, 0.55, 0.48), fc, f0) * a2, a2);
      return;
    }
    if (t > 31.5 && t < 32.5) {
      float ring = smoothstep(0.84, 0.93, r) * (1.0 - smoothstep(0.95, 1.0, r));
      float pulse = 0.7 + 0.3 * sin(vInfo.z * 6.2832);
      float wave = smoothstep(0.06, 0.0, abs(r - fract(vInfo.z * 2.0))) * 0.45;
      float fill = (1.0 - smoothstep(0.0, 0.92, r)) * 0.16 + wave * step(r, 0.92);
      float a2 = (ring * pulse + fill) * VX;
      o = vec4(vec3(0.3, 1.0, 0.5) * 1.5 * a2, 0.0);
      return;
    }
    if (uBoomOn < 0.5) { float e = 1.0 - smoothstep(0.0, 1.0, r); o = vec4(vec3(1.0, 0.6, 0.25) * 1.6 * e * VX * (1.0 - vInfo.z), 0.0); return; }
    float fr = clamp(vInfo.z, 0.0, 1.0) * 15.0, fa = floor(fr), fb = min(15.0, fa + 1.0), k = fr - fa;
    vec4 b0 = texture(uBoom, (vec2(mod(fa, 4.0), floor(fa / 4.0)) + uv) * 0.25);
    vec4 b1 = texture(uBoom, (vec2(mod(fb, 4.0), floor(fb / 4.0)) + uv) * 0.25);
    vec4 tx = mix(b0, b1, k);
    float a3 = tx.a * VX;
    o = vec4(mix(tx.rgb * 1.3, fc * tx.a, f0 * 0.7) * VX, a3);
    return;
  }
  if (t > 21.5) {
    float sd = vInfo.z * 17.0;
    float n = vn(vUv * 3.1 + sd) * 0.6 + vn(vUv * 7.7 - sd * 1.3) * 0.4;
    float d0 = length(uCam - vPos);
    float f0 = 1.0 - exp(-pow(d0 * uFogDen, 1.35));
    vec3 fc = pow(uFogCol, vec3(1.0 / 2.2));
    if (t < 22.5) {
      float e = 1.0 - smoothstep(0.5 + n * 0.38, 0.6 + n * 0.38, r);
      float wet = smoothstep(0.55, 0.0, length(vUv - vec2(-0.2, 0.25))) * 0.35;
      vec3 c2 = mix(vec3(0.13, 0.01, 0.008), vec3(0.26, 0.018, 0.012), n) + wet * vec3(0.3, 0.12, 0.1);
      float a2 = e * VX;
      o = vec4(mix(c2, fc, f0) * a2, a2);
      return;
    }
    if (t < 23.5) {
      float e = 1.0 - smoothstep(0.2 + n * 0.5, 1.0, r);
      vec3 c2 = mix(vec3(0.32, 0.015, 0.012), vec3(0.6, 0.05, 0.035), n);
      float a2 = e * VX * smoothstep(0.3, 1.2, d0);
      o = vec4(mix(c2, fc, f0) * a2, a2);
      return;
    }
    if (t < 24.5) {
      float e = 1.0 - smoothstep(0.3 + n * 0.4, 1.0, r);
      vec3 c2 = mix(vec3(0.34, 0.31, 0.27), vec3(0.55, 0.51, 0.45), clamp(0.5 - vUv.y * 0.4 + n * 0.3, 0.0, 1.0));
      float a2 = e * VX * 0.8 * smoothstep(0.6, 2.5, d0);
      o = vec4(mix(c2, fc, f0) * a2, a2);
      return;
    }
    if (t < 25.5) {
      float core = 1.0 - smoothstep(0.0, 0.6, r);
      float e = 1.0 - smoothstep(0.25 + n * 0.45, 1.0, r);
      vec3 c2 = mix(vec3(0.25, 0.75, 0.08), vec3(0.75, 1.0, 0.35), core) * 1.4;
      float a2 = e * VX;
      o = vec4(mix(c2, fc, f0 * 0.5) * a2, 0.0);
      return;
    }
    if (t < 26.5) {
      float e = 1.0 - smoothstep(0.5 + n * 0.35, 0.62 + n * 0.35, r);
      vec3 c2 = mix(vec3(0.18, 0.42, 0.05), vec3(0.42, 0.75, 0.12), n) * 1.3;
      float a2 = e * VX;
      o = vec4(mix(c2, fc, f0 * 0.5) * a2, a2 * 0.5);
      return;
    }
    float e = 1.0 - smoothstep(0.0, 1.0, r);
    vec3 c2 = vec3(1.0, 0.75, 0.4) * 2.2;
    float a2 = e * e * VX;
    o = vec4(c2 * a2, 0.0);
    return;
  }
  if (t > 20.5) {
    float e = 1.0 - smoothstep(0.0, 1.0, r);
    float a2 = e * e * VX;
    o = vec4(0.0, 0.0, 0.0, a2);
    return;
  }
  if (uFxOn > 0.5 && ((t > 10.5 && t < 12.5) || (t > 15.5 && t < 16.5))) {
    float sd = vInfo.z;
    float d1 = length(uCam - vPos);
    float f1 = 1.0 - exp(-pow(d1 * uFogDen, 1.35));
    float add1 = 0.0;
    vec3 c1; float a1;
    if (t < 11.5) {
      float m = fxTile(6.0 + floor(sd * 5.99), sd * 6.283);
      a1 = m * VX * 0.85;
      c1 = mix(vec3(0.2, 0.19, 0.19), vec3(0.55, 0.53, 0.51), clamp(0.55 - vUv.y * 0.35 + m * 0.3, 0.0, 1.0));
    } else if (t < 12.5) {
      float m = sd < 0.45 ? fxTile(floor(sd * 4.44), sd * 6.283) : fxTile(2.0 + floor((sd - 0.45) * 7.27), (sd - 0.7) * 0.6);
      a1 = m * VX;
      c1 = mix(vec3(0.95, 0.24, 0.04), vec3(1.0, 0.86, 0.45), clamp(m * m * 1.3, 0.0, 1.0)) * 1.55;
      add1 = 0.65;
    } else {
      float m = fxTile(12.0 + floor(sd * 1.99), sd * 6.283);
      a1 = m * VX;
      c1 = vec3(1.0, 0.9, 0.7) * 2.2;
      add1 = 1.0;
    }
    a1 *= smoothstep(0.6, 3.0, d1);
    c1 = mix(c1, pow(uFogCol, vec3(1.0 / 2.2)), f1 * (1.0 - add1 * 0.6));
    o = vec4(c1 * a1, a1 * (1.0 - add1));
    return;
  }
  if (t > 10.5) {
    float sd = vInfo.z * 17.0;
    float n = vn(vUv * 2.6 + sd) * 0.62 + vn(vUv * 5.3 - sd * 1.7) * 0.38;
    if (t < 11.5) { float e = 1.0 - smoothstep(0.38 + n * 0.32, 0.98, r); a = e * VX * 0.92; c = mix(vec3(0.34, 0.33, 0.33), vec3(0.62, 0.6, 0.58), clamp(0.5 - vUv.y * 0.5 + n * 0.3, 0.0, 1.0)); }
    else if (t < 12.5) { float e = 1.0 - smoothstep(0.3 + n * 0.4, 1.0, r); float core = 1.0 - smoothstep(0.0, 0.55 + n * 0.2, r); c = mix(vec3(0.95, 0.22, 0.04), mix(vec3(1.0, 0.62, 0.12), vec3(1.0, 0.96, 0.7), core), clamp(core * 1.4 + n * 0.3, 0.0, 1.0)) * 1.7; a = e * VX; add = 1.0; }
    else if (t < 13.5) { float ring = smoothstep(0.5, 0.86, r) * (1.0 - smoothstep(0.86, 1.0, r)); float br = 0.6 + 0.4 * vn(vec2(atan(vUv.y, vUv.x) * 5.0, sd)); a = (ring * br + (1.0 - smoothstep(0.0, 0.86, r)) * 0.12) * VX * 1.2; c = mix(vec3(0.85, 0.62, 0.38), vec3(1.0, 0.9, 0.7), ring) * 1.25; add = 0.6; }
    else if (t < 14.5) { float ring = smoothstep(0.58, 0.88, r) * (1.0 - smoothstep(0.88, 1.0, r)); float br = 0.55 + 0.45 * vn(vec2(atan(vUv.y, vUv.x) * 7.0, sd)); a = (ring * br + (1.0 - smoothstep(0.0, 0.88, r)) * 0.16) * VX * 1.3; c = mix(vec3(0.16, 0.55, 1.0), vec3(0.62, 0.94, 1.0), ring) * 1.45; add = 1.0; }
    else if (t < 15.5) { float core = 1.0 - smoothstep(0.0, 0.42, r); a = (core * 1.25 + (1.0 - smoothstep(0.2, 1.0, r)) * 0.45) * VX; c = mix(vec3(0.25, 0.62, 1.0), vec3(0.94, 0.98, 1.0), core) * 1.7; add = 1.0; }
    else if (t < 16.5) { a = (1.0 - smoothstep(0.0, 1.0, r)) * VX; c = vec3(1.0, 0.94, 0.8) * 2.4; add = 1.0; }
    else if (t < 17.5) { float e = 1.0 - smoothstep(0.55, 0.95, r); float hi = 1.0 - smoothstep(0.0, 0.3, length(vUv - vec2(-0.3, 0.35))); a = e * VX; c = vec3(0.04, 0.04, 0.06) + hi * 0.55; }
    else if (t < 18.5) { float e = 1.0 - smoothstep(0.35 + n * 0.35, 1.0, r); a = e * VX * 0.7; c = mix(vec3(0.72, 0.72, 0.74), vec3(0.92, 0.92, 0.94), n); }
    else if (t < 19.5) { float core = 1.0 - smoothstep(0.0, 0.5, r); c = mix(vec3(0.22, 0.32, 1.0), vec3(0.72, 0.9, 1.0), core) * 1.5; a = (1.0 - smoothstep(0.1 + n * 0.3, 1.0, r)) * VX; add = 1.0; }
    else { float core = 1.0 - smoothstep(0.0, 0.35, r); c = mix(vec3(0.12, 0.32, 1.0), vec3(0.8, 0.9, 1.0), core) * 1.8; a = (core * 0.9 + (1.0 - smoothstep(0.0, 1.0, r)) * 0.6) * VX; add = 1.0; }
    float d0 = length(uCam - vPos);
    a *= smoothstep(1.2, 5.5, d0);
    float f0 = 1.0 - exp(-pow(d0 * uFogDen, 1.35));
    c = mix(c, pow(uFogCol, vec3(1.0 / 2.2)), f0 * (1.0 - add * 0.6));
    o = vec4(c * a, a * (1.0 - add));
    return;
  }
  if (t < 0.5) c = vec3(0.88, 0.88, 0.9);
  else if (t < 1.5) { c = mix(vec3(1.0, 0.95, 0.62), vec3(1.0, 0.42, 0.08), r) * 1.5; add = 0.6; }
  else if (t < 2.5) c = vec3(0.74, 0.6, 0.44);
  else if (t < 3.5) { c = mix(vec3(0.8, 1.0, 0.95), vec3(0.15, 0.95, 0.7), r) * 1.6; add = 1.0; }
  else if (t < 4.5) { c = vec3(1.0, 0.9, 0.55) * 2.0; add = 1.0; a *= (1.0 - smoothstep(0.0, 0.7, r)) * 1.5; }
  else if (t < 5.5) c = vec3(0.17, 0.16, 0.16);
  else if (t < 6.5) { c = mix(vec3(0.9, 0.97, 1.0), vec3(0.3, 0.6, 1.0), r) * 1.8; add = 1.0; }
  else if (t < 7.5) { c = vec3(1.0, 0.82, 0.5) * 1.4; add = 1.0; a *= 0.75 * (1.0 - smoothstep(0.0, 1.0, r)); }
  else if (t < 8.5) { c = vec3(1.0, 0.16, 0.12) * 1.7; add = 1.0; a *= 1.0 - smoothstep(0.0, 1.0, r); }
  else if (t < 9.5) { c = vec3(0.9, 0.95, 1.0) * 1.5; add = 1.0; a *= 1.0 - smoothstep(0.0, 1.0, r); }
  else { c = mix(vec3(1.0, 0.7, 1.0), vec3(0.7, 0.3, 1.0), r) * 1.6; add = 1.0; }
  float d = length(uCam - vPos);
  a *= smoothstep(1.2, 5.5, d);
  float f = 1.0 - exp(-pow(d * uFogDen, 1.35));
  c = mix(c, pow(uFogCol, vec3(1.0 / 2.2)), f * (1.0 - add * 0.6));
  o = vec4(c * a, a * (1.0 - add));
}`;

const POSTVS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
const BRIGHTFS = `#version 300 es
precision mediump float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uPx; uniform float uTh;
out vec4 o;
vec3 tap(vec2 d) { vec3 c = texture(uTex, vUv + d * uPx).rgb; float l = max(c.r, max(c.g, c.b)); return c * smoothstep(uTh, uTh + 0.25, l); }
void main() { o = vec4((tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))) * 0.25, 1.0); }`;
const BLURFS = `#version 300 es
precision mediump float;
in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir;
out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.227027;
  c += (texture(uTex, vUv + uDir * 1.3846).rgb + texture(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
  c += (texture(uTex, vUv + uDir * 3.2308).rgb + texture(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
  o = vec4(c, 1.0);
}`;
const COMPFS = `#version 300 es
precision mediump float;
in vec2 vUv; uniform sampler2D uScene, uB1, uB2;
uniform float uBloom, uSat, uCon, uVig;
uniform vec3 uLo, uHi;
out vec4 o;
void main() {
  vec3 c = texture(uScene, vUv).rgb;
  vec3 b = texture(uB1, vUv).rgb * 0.55 + texture(uB2, vUv).rgb * 0.85;
  c = c + b * uBloom * (1.0 - c * 0.45);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c = (c - 0.5) * uCon + 0.5;
  c *= mix(uLo, uHi, smoothstep(0.05, 0.85, l));
  vec2 d = vUv - 0.5;
  c *= 1.0 - dot(d, d) * uVig;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

function compile(gl, vs, fs) {
  const mk = (t, s) => {
    const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
const toLin = (c) => [c[0] ** 2.2, c[1] ** 2.2, c[2] ** 2.2];

export function createRenderer(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: opts.aa !== false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keep });
  if (!gl) return null;
  const P = compile(gl, VS, FS), S = compile(gl, SVS, SFS), K = compile(gl, SKYVS, SKYFS), Q = compile(gl, PVS, PFS);
  let WP = null, fxTex = null, fx2Tex = null, boomTex = null;
  const ZIMP = [0, 0, 0];
  const fxLoad = (src, set) => {
    if (!src || typeof fetch === 'undefined') return;
    (typeof src === 'string' ? fetch(src).then((r) => (r.ok ? r.blob() : null)) : Promise.resolve(src)).then((b) => (b ? createImageBitmap(b, { premultiplyAlpha: 'none' }) : null)).then((bm) => {
      if (!bm || gl.isContextLost()) return;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (bm.close) bm.close();
      set(t);
      texs.push(t);
    }).catch(() => {});
  };
  fxLoad(opts.fx2, (t) => { fx2Tex = t; });
  fxLoad(opts.boom, (t) => { boomTex = t; });
  if (opts.fx && typeof fetch !== 'undefined') {
    (typeof opts.fx === 'string' ? fetch(opts.fx).then((r) => (r.ok ? r.blob() : null)) : Promise.resolve(opts.fx)).then((b) => (b ? createImageBitmap(b, { premultiplyAlpha: 'none' }) : null)).then((bm) => {
      if (!bm || gl.isContextLost()) return;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bm);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (bm.close) bm.close();
      fxTex = t;
      texs.push(t);
    }).catch(() => {});
  }
  const SM = opts.shadowSize || 2048;
  const shadowTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SM, SM);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
  const shadowFb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const skyVao = gl.createVertexArray();
  gl.bindVertexArray(skyVao);
  const skyBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const partVao = gl.createVertexArray();
  const cornerBuf = gl.createBuffer();
  const partBuf = gl.createBuffer();
  gl.bindVertexArray(partVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 44, 0); gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 44, 16); gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 44, 28); gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);
  let partData = new Float32Array(11 * 256);

  let PPROG = null, PP = null;
  function postFree() {
    if (!PP) return;
    try { for (const t of [PP.scene, PP.a1, PP.a2, PP.b1, PP.b2]) { gl.deleteTexture(t.t); gl.deleteFramebuffer(t.fb); } gl.deleteRenderbuffer(PP.rc); gl.deleteRenderbuffer(PP.rd); gl.deleteFramebuffer(PP.ms); } catch {}
    PP = null;
  }
  function mkTex(w, h) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb, w, h };
  }
  function postSetup(W, H) {
    if (PP && PP.W === W && PP.H === H) return PP;
    postFree();
    if (!PPROG) PPROG = { b: compile(gl, POSTVS, BRIGHTFS), u: compile(gl, POSTVS, BLURFS), c: compile(gl, POSTVS, COMPFS) };
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
    const ms = gl.createFramebuffer(), rc = gl.createRenderbuffer(), rd = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rc);
    if (samples > 0) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H); else gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, W, H);
    gl.bindRenderbuffer(gl.RENDERBUFFER, rd);
    if (samples > 0) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, W, H); else gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
    gl.bindFramebuffer(gl.FRAMEBUFFER, ms);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, rc);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rd);
    const q4 = (v) => Math.max(1, Math.round(v / 4)), q8 = (v) => Math.max(1, Math.round(v / 8));
    PP = { W, H, ms, rc, rd, scene: mkTex(W, H), a1: mkTex(q4(W), q4(H)), a2: mkTex(q4(W), q4(H)), b1: mkTex(q8(W), q8(H)), b2: mkTex(q8(W), q8(H)) };
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return PP;
  }
  function pass(pr, target, src, setU) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
    gl.viewport(0, 0, target ? target.w : canvas.width, target ? target.h : canvas.height);
    gl.useProgram(pr.p);
    if (src) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform1i(pr.u.uTex, 0); }
    setU(pr.u);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function runPost(env) {
    const W = canvas.width, H = canvas.height, P2 = PP, pr = PPROG, o = env.post || {};
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, P2.ms);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, P2.scene.fb);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
    gl.bindVertexArray(skyVao);
    pass(pr.b, P2.a1, P2.scene, (u) => { gl.uniform2f(u.uPx, 1 / W, 1 / H); gl.uniform1f(u.uTh, o.th == null ? 0.72 : o.th); });
    pass(pr.u, P2.a2, P2.a1, (u) => gl.uniform2f(u.uDir, 1 / P2.a1.w, 0));
    pass(pr.u, P2.a1, P2.a2, (u) => gl.uniform2f(u.uDir, 0, 1 / P2.a2.h));
    pass(pr.u, P2.b1, P2.a1, (u) => gl.uniform2f(u.uDir, 1.5 / P2.a1.w, 0));
    pass(pr.u, P2.b2, P2.b1, (u) => gl.uniform2f(u.uDir, 0, 1.5 / P2.b1.h));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(pr.c.p);
    const bindT = (unit, t, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(pr.c.u[name], unit); };
    bindT(0, P2.scene.t, 'uScene'); bindT(1, P2.a1.t, 'uB1'); bindT(2, P2.b2.t, 'uB2');
    gl.uniform1f(pr.c.u.uBloom, o.bloom == null ? 0.9 : o.bloom);
    gl.uniform1f(pr.c.u.uSat, o.sat == null ? 1.08 : o.sat);
    gl.uniform1f(pr.c.u.uCon, o.con == null ? 1.06 : o.con);
    gl.uniform1f(pr.c.u.uVig, o.vig == null ? 0.55 : o.vig);
    gl.uniform3fv(pr.c.u.uLo, o.lo || [0.96, 0.99, 1.06]);
    gl.uniform3fv(pr.c.u.uHi, o.hi || [1.04, 1.0, 0.94]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    gl.depthMask(true);
    gl.bindVertexArray(null);
  }

  const owned = [];
  function mesh(data) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
    gl.bindVertexArray(null);
    const m = { vao, buf, n: data.length / 10 };
    owned.push(m);
    return m;
  }
  let SKP = null, SKS = null;
  function skin(data) {
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 44, 40);
    gl.bindVertexArray(null);
    if (!SKP) { SKP = compile(gl, SKVS, FS); SKS = compile(gl, SKSVS, SFS); }
    const m = { vao, buf, n: data.length / 11, skin: true };
    owned.push(m);
    return m;
  }
  let TSP = null, TSS = null, aniso;
  let TAP = null, TAS = null;
  function wmesh(data) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    gl.bindVertexArray(null);
    const m = { vao, buf, n: data.length / 5 };
    owned.push(m);
    return m;
  }
  function tstat(M) {
    const vao = gl.createVertexArray(), buf = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, M.verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.SHORT, true, 36, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 20);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 36, 28);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.UNSIGNED_SHORT, false, 36, 32);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, M.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    if (!TAP) { TAP = compile(gl, TAVS, TAFS); TAS = compile(gl, TASVS, TASFS); }
    const bpi = M.idx.BYTES_PER_ELEMENT;
    const m = { vao, buf, ib, n: M.ni, tsa: true, it: bpi === 4 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, groups: M.groups.map((g) => ({ arr: g.arr, off: g.start * bpi, count: g.count })) };
    owned.push(m);
    return m;
  }
  function texArray(layers, size) {
    const t = gl.createTexture();
    const n = layers.length;
    const lv = Math.floor(Math.log2(size)) + 1;
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, lv, gl.RGBA8, size, size, n);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    for (let i = 0; i < n; i++) gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, size, size, 1, gl.RGBA, gl.UNSIGNED_BYTE, layers[i]);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (aniso === undefined) aniso = gl.getExtension('EXT_texture_filter_anisotropic') || null;
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1));
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    texs.push(t);
    return t;
  }
  const texs = [];
  function tskin(M) {
    const vao = gl.createVertexArray(), buf = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, M.verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.SHORT, true, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.UNSIGNED_SHORT, true, 32, 20);
    gl.enableVertexAttribArray(3); gl.vertexAttribIPointer(3, 4, gl.UNSIGNED_BYTE, 32, 24);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, true, 32, 28);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, M.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    if (!TSP || TSP.nb < M.nb) { TSP = compile(gl, TSKVS(M.nb), TFS); TSP.nb = M.nb; TSS = compile(gl, TSKSVS(M.nb), SFS); }
    const m = { vao, buf, ib, n: M.ni, tsk: true };
    owned.push(m);
    return m;
  }
  let skyTex = null;
  function setSky(img) {
    if (skyTex) { gl.deleteTexture(skyTex); const i = texs.indexOf(skyTex); if (i >= 0) texs.splice(i, 1); skyTex = null; }
    if (!img) return;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    texs.push(t);
    skyTex = t;
  }
  function texture(img) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (aniso === undefined) aniso = gl.getExtension('EXT_texture_filter_anisotropic') || null;
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1));
    gl.bindTexture(gl.TEXTURE_2D, null);
    texs.push(t);
    return t;
  }
  const NOL = new Float32Array(16), NOC = new Float32Array(12);
  function setLights(pr, scene) {
    const L = scene.lights;
    const n = L ? Math.min(4, L.length) : 0;
    if (n) {
      const a = new Float32Array(16), c = new Float32Array(12);
      for (let i = 0; i < n; i++) { const l = L[i]; a[i * 4] = l.p[0]; a[i * 4 + 1] = l.p[1]; a[i * 4 + 2] = l.p[2]; a[i * 4 + 3] = l.r; c[i * 3] = l.c[0]; c[i * 3 + 1] = l.c[1]; c[i * 3 + 2] = l.c[2]; }
      gl.uniform4fv(pr.u['uPL[0]'], a); gl.uniform3fv(pr.u['uPLC[0]'], c);
    } else if (pr.u['uPL[0]']) { gl.uniform4fv(pr.u['uPL[0]'], NOL); gl.uniform3fv(pr.u['uPLC[0]'], NOC); }
    gl.uniform1f(pr.u.uPLN, n);
    const s = scene.spot;
    if (s) { gl.uniform4f(pr.u.uSP, s.p[0], s.p[1], s.p[2], s.r); gl.uniform4f(pr.u.uSPD, s.d[0], s.d[1], s.d[2], s.cos); gl.uniform3fv(pr.u.uSPC, s.c); }
    else gl.uniform3f(pr.u.uSPC, 0, 0, 0);
  }
  function drop(m) {
    if (!m) return;
    try { gl.deleteBuffer(m.buf); if (m.ib) gl.deleteBuffer(m.ib); gl.deleteVertexArray(m.vao); } catch {}
    const i = owned.indexOf(m); if (i >= 0) owned.splice(i, 1);
  }
  function dispose() {
    for (const m of owned.slice()) drop(m);
    for (const t of texs) { try { gl.deleteTexture(t); } catch {} }
    texs.length = 0;
    postFree();
    try { gl.deleteTexture(shadowTex); gl.deleteFramebuffer(shadowFb); gl.deleteBuffer(skyBuf); gl.deleteBuffer(partBuf); gl.deleteBuffer(cornerBuf); } catch {}
  }
  function lose() { try { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch {} }

  function lightVP(env, center) {
    const d = env.sunDir, R = env.shadowRange || 70;
    const eye = [center[0] + d[0] * 260, center[1] + d[1] * 260, center[2] + d[2] * 260];
    return m4.mul(m4.ortho(-R, R, -R, R, 20, 600), m4.look(eye, center, [0, 1, 0]));
  }

  const planes = new Float32Array(24);
  function frustum(m) {
    const rows = [0, 1, 2].map((r) => [m[r], m[4 + r], m[8 + r], m[12 + r]]);
    const r3 = [m[3], m[7], m[11], m[15]];
    const P = [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]];
    P.forEach(([r, sg], i) => { const a = r3[0] + sg * rows[r][0], b = r3[1] + sg * rows[r][1], c = r3[2] + sg * rows[r][2], d = r3[3] + sg * rows[r][3]; const l = Math.hypot(a, b, c) || 1; planes[i * 4] = a / l; planes[i * 4 + 1] = b / l; planes[i * 4 + 2] = c / l; planes[i * 4 + 3] = d / l; });
  }
  function visible(bs) {
    for (let i = 0; i < 24; i += 4) if (planes[i] * bs[0] + planes[i + 1] * bs[1] + planes[i + 2] * bs[2] + planes[i + 3] < -bs[3]) return false;
    return true;
  }
  let lastDrawn = 0;
  let goodCam = null;
  function render(scene) {
    const c0 = scene.cam;
    const okCam = c0 && Number.isFinite(c0.pos[0]) && Number.isFinite(c0.pos[1]) && Number.isFinite(c0.pos[2]) && Number.isFinite(c0.at[0]) && Number.isFinite(c0.at[1]) && Number.isFinite(c0.at[2]) && Number.isFinite(c0.fov);
    if (!okCam) { if (!goodCam) return; scene = { ...scene, cam: goodCam }; } else goodCam = { ...c0, pos: [c0.pos[0], c0.pos[1], c0.pos[2]], at: [c0.at[0], c0.at[1], c0.at[2]] };
    const { env, cam, items, parts } = scene;
    const W = canvas.width, H = canvas.height;
    const view = m4.look(cam.pos, cam.at, [0, 1, 0]);
    const proj = m4.persp(cam.fov, W / H, cam.near || 0.3, cam.far || 1600);
    const VP = m4.mul(proj, view);
    frustum(VP);
    const LVP = lightVP(env, cam.shadowAt || cam.at);
    const useShadow = env.shadows !== false;
    const sc = cam.shadowAt || cam.at, sr = (env.shadowRange || 70) * 1.25;
    if (useShadow) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
      gl.viewport(0, 0, SM, SM);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(S.p);
      gl.uniformMatrix4fv(S.u.uLightVP, false, LVP);
      let skc = null, tsc = null, tac = null;
      for (const it of items) {
        if (!it.cast || it.blend) continue;
        if (it.bs && Math.hypot(it.bs[0] - sc[0], it.bs[2] - sc[2]) > sr + it.bs[3]) continue;
        if (it.mesh.tsk) { (tsc || (tsc = [])).push(it); continue; }
        if (it.mesh.tsa) { (tac || (tac = [])).push(it); continue; }
        if (it.bones) { (skc || (skc = [])).push(it); continue; }
        gl.uniformMatrix4fv(S.u.uModel, false, it.model || IDENT);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
      }
      if (skc && SKS) {
        gl.useProgram(SKS.p);
        gl.uniformMatrix4fv(SKS.u.uLightVP, false, LVP);
        for (const it of skc) {
          gl.uniformMatrix4fv(SKS.u.uModel, false, it.model || IDENT);
          gl.uniformMatrix4fv(SKS.u['uBones[0]'], false, it.bones);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
        }
      }
      if (tsc && TSS) {
        gl.useProgram(TSS.p);
        gl.uniformMatrix4fv(TSS.u.uLightVP, false, LVP);
        for (const it of tsc) {
          gl.uniformMatrix4fv(TSS.u.uModel, false, it.model || IDENT);
          gl.uniformMatrix3x4fv(TSS.u['uB[0]'], false, it.skin);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawElements(gl.TRIANGLES, it.cnt || it.mesh.n, gl.UNSIGNED_SHORT, (it.off || 0) * 2);
        }
      }
      if (tac && TAS) {
        gl.useProgram(TAS.p);
        gl.uniformMatrix4fv(TAS.u.uLightVP, false, LVP);
        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(TAS.u.uArr, 1);
        let lt = null;
        for (const it of tac) {
          gl.uniformMatrix4fv(TAS.u.uModel, false, it.model || IDENT);
          gl.bindVertexArray(it.mesh.vao);
          for (const g of it.mesh.groups) {
            const tx = it.arrs[g.arr];
            if (tx !== lt) { gl.bindTexture(gl.TEXTURE_2D_ARRAY, tx); lt = tx; }
            gl.drawElements(gl.TRIANGLES, g.count, it.mesh.it, g.off);
          }
        }
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        gl.activeTexture(gl.TEXTURE0);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    const usePost = !!env.post;
    if (usePost) { postSetup(W, H); gl.bindFramebuffer(gl.FRAMEBUFFER, PP.ms); }
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(K.p);
    gl.uniformMatrix4fv(K.u.uInvVP, false, m4.inv(VP));
    gl.uniform3fv(K.u.uSunDir, env.sunDir);
    gl.uniform3fv(K.u.uZenith, env.zenith);
    gl.uniform3fv(K.u.uHorizon, env.horizon);
    gl.uniform3fv(K.u.uSunCol, env.sunCol);
    gl.uniform3fv(K.u.uFogSun, env.fogSun);
    gl.uniform3fv(K.u.uCloud, env.cloud || [1, 0.86, 0.78]);
    gl.uniform1f(K.u.uClouds, env.clouds == null ? 1 : env.clouds);
    gl.uniform1f(K.u.uStars, env.stars || 0);
    gl.uniform1f(K.u.uExposure, env.exposure || 1);
    gl.uniform1f(K.u.uTime, env.time || 0);
    gl.uniform1f(K.u.uSkyOn, skyTex && env.skyTex !== false ? 1 : 0);
    if (skyTex) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, skyTex); gl.uniform1i(K.u.uSkyTex, 0); }
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    if (!env.horLin) { env.horLin = toLin(env.reflHor || env.horizon); env.zenLin = toLin(env.reflZen || env.zenith); }
    const setMain = (pr) => {
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, VP);
      gl.uniformMatrix4fv(pr.u.uLightVP, false, LVP);
      gl.uniform3fv(pr.u.uSunDir, env.sunDir);
      gl.uniform3fv(pr.u.uSunCol, env.sunCol);
      gl.uniform3fv(pr.u.uSkyCol, env.skyCol);
      gl.uniform3fv(pr.u.uGndCol, env.gndCol);
      gl.uniform3fv(pr.u.uFogCol, env.fogCol);
      gl.uniform3fv(pr.u.uFogSun, env.fogSunLin || env.fogSun);
      gl.uniform3fv(pr.u.uHor, env.horLin);
      gl.uniform3fv(pr.u.uZen, env.zenLin);
      gl.uniform3fv(pr.u.uCam, cam.pos);
      gl.uniform1f(pr.u.uFogDen, env.fogDen);
      gl.uniform1f(pr.u.uShadowOn, useShadow ? 1 : 0);
      gl.uniform1f(pr.u.uExposure, env.exposure || 1);
      gl.uniform1f(pr.u.uDetail, env.detail || 0);
      gl.uniform1f(pr.u.uMode, 0);
      gl.uniform1f(pr.u.uAlpha, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, shadowTex);
      gl.uniform1i(pr.u.uShadow, 0);
      setLights(pr, scene);
    };
    setMain(P);
    let blends = null, sks = null, tsk = null, tsa = null;
    lastDrawn = 0;
    let waters = null;
    for (const it of items) {
      if (it.water != null) { if (!it.bs || visible(it.bs)) (waters || (waters = [])).push(it); continue; }
      if (it.blend) { (blends || (blends = [])).push(it); continue; }
      if (it.bs && !visible(it.bs)) continue;
      if (it.maxD && (it.bs[0] - cam.pos[0]) * (it.bs[0] - cam.pos[0]) + (it.bs[2] - cam.pos[2]) * (it.bs[2] - cam.pos[2]) > it.maxD * it.maxD) continue;
      lastDrawn += it.mesh.n;
      if (it.mesh.tsk) { (tsk || (tsk = [])).push(it); continue; }
      if (it.mesh.tsa) { (tsa || (tsa = [])).push(it); continue; }
      if (it.bones) { (sks || (sks = [])).push(it); continue; }
      gl.uniformMatrix4fv(P.u.uModel, false, it.model || IDENT);
      gl.bindVertexArray(it.mesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
    }
    if (sks && SKP) {
      setMain(SKP);
      for (const it of sks) {
        gl.uniformMatrix4fv(SKP.u.uModel, false, it.model || IDENT);
        gl.uniformMatrix4fv(SKP.u['uBones[0]'], false, it.bones);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
      }
      gl.useProgram(P.p);
    }
    if (tsk && TSP) {
      setMain(TSP);
      gl.uniform1i(TSP.u.uTex, 1);
      gl.uniform1i(TSP.u.uNrm, 2);
      let lt = null, ln = null;
      for (const it of tsk) {
        if (it.tex !== lt) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, it.tex); lt = it.tex; }
        if (it.nrm && it.nrm !== ln) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, it.nrm); ln = it.nrm; }
        gl.uniform1f(TSP.u.uNrmOn, it.nrm ? 1 : 0);
        gl.uniform1f(TSP.u.uGlossA, it.gloss ? 1 : 0);
        gl.uniform4fv(TSP.u.uCol, it.col || DEFCOL);
        gl.uniformMatrix4fv(TSP.u.uModel, false, it.model || IDENT);
        gl.uniformMatrix3x4fv(TSP.u['uB[0]'], false, it.skin);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawElements(gl.TRIANGLES, it.cnt || it.mesh.n, gl.UNSIGNED_SHORT, (it.off || 0) * 2);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(P.p);
    }
    if (tsa && TAP) {
      setMain(TAP);
      gl.uniform1i(TAP.u.uArr, 1);
      gl.activeTexture(gl.TEXTURE1);
      let lt = null;
      for (const it of tsa) {
        gl.uniform4fv(TAP.u.uCol, it.col || DEFCOL);
        gl.uniformMatrix4fv(TAP.u.uModel, false, it.model || IDENT);
        gl.bindVertexArray(it.mesh.vao);
        for (const g of it.mesh.groups) {
          const tx = it.arrs[g.arr];
          if (tx !== lt) { gl.bindTexture(gl.TEXTURE_2D_ARRAY, tx); lt = tx; }
          gl.drawElements(gl.TRIANGLES, g.count, it.mesh.it, g.off);
        }
      }
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(P.p);
    }
    if (waters) {
      if (!WP) { try { WP = compile(gl, WVS, WFS); } catch { WP = false; } }
      if (WP) {
        gl.useProgram(WP.p);
        gl.uniformMatrix4fv(WP.u.uVP, false, VP);
        gl.uniform3fv(WP.u.uSunDir, env.sunDir); gl.uniform3fv(WP.u.uSunCol, env.sunCol); gl.uniform3fv(WP.u.uSkyCol, env.skyCol);
        gl.uniform3fv(WP.u.uFogCol, env.fogCol); gl.uniform3fv(WP.u.uFogSun, env.fogSunLin || env.fogSun);
        gl.uniform3fv(WP.u.uHor, env.horLin); gl.uniform3fv(WP.u.uZen, env.zenLin); gl.uniform3fv(WP.u.uCam, cam.pos);
        gl.uniform1f(WP.u.uFogDen, env.fogDen); gl.uniform1f(WP.u.uExposure, env.exposure || 1); gl.uniform1f(WP.u.uTime, env.time || 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const it of waters) {
          gl.uniform1f(WP.u.uKind, it.water);
          gl.uniform3fv(WP.u.uDeep, it.deep || [0.012, 0.045, 0.04]);
          gl.uniform3fv(WP.u.uShal, it.shal || [0.05, 0.11, 0.09]);
          gl.uniform3fv(WP.u.uImp, it.imp || ZIMP);
          gl.uniformMatrix4fv(WP.u.uModel, false, it.model || IDENT);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.useProgram(P.p);
      }
    }
    if (blends) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (const it of blends) {
        gl.uniform1f(P.u.uMode, it.blend);
        gl.uniform1f(P.u.uAlpha, it.alpha == null ? 1 : it.alpha);
        if (it.tint) gl.uniform3fv(P.u.uTint, it.tint);
        gl.uniformMatrix4fv(P.u.uModel, false, it.model || IDENT);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.uniform1f(P.u.uMode, 0);
    }
    if (parts && parts.length) {
      const n = parts.length;
      if (partData.length < n * 11) partData = new Float32Array(Math.max(n, partData.length / 11 * 2) * 11);
      let k = 0;
      for (const p of parts) { partData[k++] = p.x; partData[k++] = p.y; partData[k++] = p.z; partData[k++] = p.size; partData[k++] = p.alpha; partData[k++] = p.type || 0; partData[k++] = p.seed || 0; partData[k++] = p.dx || 0; partData[k++] = p.dy || 0; partData[k++] = p.dz || 0; partData[k++] = p.dw || 0; }
      gl.useProgram(Q.p);
      gl.uniformMatrix4fv(Q.u.uVP, false, VP);
      gl.uniform3f(Q.u.uRight, view[0], view[4], view[8]);
      gl.uniform3f(Q.u.uUp, view[1], view[5], view[9]);
      gl.uniform3fv(Q.u.uCam, cam.pos);
      gl.uniform3fv(Q.u.uFogCol, env.fogCol);
      gl.uniform1f(Q.u.uFogDen, env.fogDen);
      gl.uniform1f(Q.u.uFxOn, fxTex ? 1 : 0);
      if (fxTex) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, fxTex); gl.uniform1i(Q.u.uFx, 3); gl.activeTexture(gl.TEXTURE0); }
      gl.uniform1f(Q.u.uFx2On, fx2Tex ? 1 : 0);
      gl.uniform1f(Q.u.uBoomOn, boomTex ? 1 : 0);
      if (fx2Tex) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, fx2Tex); gl.uniform1i(Q.u.uFx2, 4); }
      if (boomTex) { gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, boomTex); gl.uniform1i(Q.u.uBoom, 5); }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindVertexArray(partVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.bufferData(gl.ARRAY_BUFFER, partData.subarray(0, n * 11), gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, n);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    const vm = scene.vm;
    if (vm && vm.length) {
      const VVP = m4.mul(m4.persp(cam.vmFov || cam.fov, W / H, cam.vmNear || 0.02, 40), view);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uVP, false, VVP);
      if (scene.vmLights) setLights(P, { lights: scene.vmLights, spot: scene.spot });
      gl.uniform1f(P.u.uMode, 0);
      gl.uniform1f(P.u.uAlpha, 1);
      let vb = null, vt = null, va = null;
      for (const it of vm) {
        if (it.blend) { (vb || (vb = [])).push(it); continue; }
        if (it.arrs) { (va || (va = [])).push(it); continue; }
        if (it.mesh.tsk) { (vt || (vt = [])).push(it); continue; }
        gl.uniformMatrix4fv(P.u.uModel, false, it.model || IDENT);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
      }
      if (vt && TSP) {
        setMain(TSP);
        gl.uniformMatrix4fv(TSP.u.uVP, false, VVP);
        if (scene.vmLights) setLights(TSP, { lights: scene.vmLights, spot: scene.spot });
        gl.uniform1i(TSP.u.uTex, 1);
        gl.uniform1i(TSP.u.uNrm, 2);
        let lt = null, ln = null;
        for (const it of vt) {
          if (it.tex !== lt) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, it.tex); lt = it.tex; }
          if (it.nrm && it.nrm !== ln) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, it.nrm); ln = it.nrm; }
          gl.uniform1f(TSP.u.uNrmOn, it.nrm ? 1 : 0);
          gl.uniform1f(TSP.u.uGlossA, it.gloss ? 1 : 0);
          gl.uniform4fv(TSP.u.uCol, it.col || DEFCOL);
          gl.uniformMatrix4fv(TSP.u.uModel, false, it.model || IDENT);
          gl.uniformMatrix3x4fv(TSP.u['uB[0]'], false, it.skin);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawElements(gl.TRIANGLES, it.cnt || it.mesh.n, gl.UNSIGNED_SHORT, (it.off || 0) * 2);
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.useProgram(P.p);
        gl.uniformMatrix4fv(P.u.uVP, false, VVP);
      }
      if (va && TAP) {
        setMain(TAP);
        gl.uniformMatrix4fv(TAP.u.uVP, false, VVP);
        if (scene.vmLights) setLights(TAP, { lights: scene.vmLights, spot: scene.spot });
        gl.uniform1i(TAP.u.uArr, 1);
        gl.activeTexture(gl.TEXTURE1);
        let lt = null;
        for (const it of va) {
          gl.uniform4fv(TAP.u.uCol, it.col || DEFCOL);
          gl.uniformMatrix4fv(TAP.u.uModel, false, it.model || IDENT);
          gl.bindVertexArray(it.mesh.vao);
          for (const g of it.mesh.groups) {
            const tx = it.arrs[g.arr];
            if (tx !== lt) { gl.bindTexture(gl.TEXTURE_2D_ARRAY, tx); lt = tx; }
            gl.drawElements(gl.TRIANGLES, g.count, it.mesh.it, g.off);
          }
        }
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.useProgram(P.p);
        gl.uniformMatrix4fv(P.u.uVP, false, VVP);
      }
      if (vb) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        for (const it of vb) {
          gl.uniform1f(P.u.uMode, it.blend);
          gl.uniform1f(P.u.uAlpha, it.alpha == null ? 1 : it.alpha);
          if (it.tint) gl.uniform3fv(P.u.uTint, it.tint);
          gl.uniformMatrix4fv(P.u.uModel, false, it.model || IDENT);
          gl.bindVertexArray(it.mesh.vao);
          gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
        }
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.uniform1f(P.u.uMode, 0);
      }
      gl.uniformMatrix4fv(P.u.uVP, false, VP);
    }
    gl.bindVertexArray(null);
    if (usePost) runPost(env);
    return VP;
  }
  return { gl, mesh, skin, tskin, tstat, wmesh, texture, texArray, setSky, fxOk: () => !!fx2Tex, maxTex: () => gl.getParameter(gl.MAX_TEXTURE_SIZE), drop, render, dispose, lose, drawn: () => lastDrawn };
}
const IDENT = m4.ident();
const DEFCOL = new Float32Array([1, 1, 1, 0]);
