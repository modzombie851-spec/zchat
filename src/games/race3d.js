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
  tri(a, b, c, col, mat = 0) {
    a = this.tp(a); b = this.tp(b); c = this.tp(c);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const k = typeof col === 'string' ? hexRgb(col) : col;
    this.v.push(a[0], a[1], a[2], nx, ny, nz, k[0], k[1], k[2], mat, b[0], b[1], b[2], nx, ny, nz, k[0], k[1], k[2], mat, c[0], c[1], c[2], nx, ny, nz, k[0], k[1], k[2], mat);
    return this;
  }
  quad(a, b, c, d, col, mat = 0) { this.tri(a, b, c, col, mat); this.tri(a, c, d, col, mat); return this; }
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
  wheel(x, y, z, r, w, seg, tire, rim) {
    const hw = w / 2;
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const c0 = Math.cos(a0) * r, s0 = Math.sin(a0) * r, c1 = Math.cos(a1) * r, s1 = Math.sin(a1) * r;
      this.quad([x - hw, y + s0, z + c0], [x - hw, y + s1, z + c1], [x + hw, y + s1, z + c1], [x + hw, y + s0, z + c0], tire, 0);
      const k = 0.62;
      this.tri([x + hw + 0.005, y, z], [x + hw + 0.005, y + s0 * k, z + c0 * k], [x + hw + 0.005, y + s1 * k, z + c1 * k], rim, 0.5);
      this.tri([x + hw, y + s0 * k, z + c0 * k], [x + hw, y + s0, z + c0], [x + hw, y + s1, z + c1], tire, 0);
      this.tri([x + hw, y + s0 * k, z + c0 * k], [x + hw, y + s1, z + c1], [x + hw, y + s1 * k, z + c1 * k], tire, 0);
      this.tri([x - hw - 0.005, y, z], [x - hw - 0.005, y + s1 * k, z + c1 * k], [x - hw - 0.005, y + s0 * k, z + c0 * k], rim, 0.5);
      this.tri([x - hw, y + s0 * k, z + c0 * k], [x - hw, y + s1, z + c1], [x - hw, y + s0, z + c0], tire, 0);
      this.tri([x - hw, y + s0 * k, z + c0 * k], [x - hw, y + s1 * k, z + c1 * k], [x - hw, y + s1, z + c1], tire, 0);
    }
    return this;
  }
  blob(x, y, z, rx, ry, rz, col, mat = 0, rnd = null, seg = 7) {
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
const FS = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vPos; in vec3 vNor; in vec4 vCol; in vec4 vLight;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uFogSun, uCam;
uniform float uFogDen, uShadowOn, uExposure;
uniform sampler2DShadow uShadow;
out vec4 o;
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
void main() {
  vec3 n = normalize(vNor);
  if (!gl_FrontFacing) n = -n;
  vec3 base = pow(vCol.rgb, vec3(2.2));
  float mat = vCol.a;
  vec3 v = normalize(uCam - vPos);
  float d = length(uCam - vPos);
  vec3 col;
  if (mat > 0.95) {
    col = base * 3.2;
  } else {
    float nl = max(dot(n, uSunDir), 0.0);
    float sh = uShadowOn > 0.5 ? shadowAt(vLight, nl) : 1.0;
    vec3 amb = mix(uGndCol, uSkyCol, n.y * 0.5 + 0.5);
    col = base * (amb + uSunCol * nl * sh);
    if (mat > 0.05) {
      vec3 h = normalize(v + uSunDir);
      float sp = pow(max(dot(n, h), 0.0), 40.0 + 120.0 * mat) * sh;
      float fr = pow(1.0 - max(dot(n, v), 0.0), 4.0);
      col = mix(col, uSkyCol * 1.1 + uFogSun * 0.25, fr * 0.55 * mat);
      col += uSunCol * sp * mat * 1.6;
    }
  }
  float f = 1.0 - exp(-pow(d * uFogDen, 1.35));
  float sunAmt = pow(max(dot(-v, uSunDir), 0.0), 6.0);
  vec3 fogc = mix(uFogCol, uFogSun, sunAmt);
  col = mix(col, fogc, clamp(f, 0.0, 1.0));
  col = aces(col * uExposure);
  o = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;
const SVS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uModel, uLightVP;
void main() { gl_Position = uLightVP * uModel * vec4(aPos, 1.0); }`;
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
uniform vec3 uSunDir, uZenith, uHorizon, uSunCol, uFogSun, uCam;
uniform float uExposure, uTime;
out vec4 o;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main() {
  vec4 a = uInvVP * vec4(vP, -1.0, 1.0), b = uInvVP * vec4(vP, 1.0, 1.0);
  vec3 dir = normalize(b.xyz / b.w - a.xyz / a.w);
  float el = max(dir.y, 0.0);
  vec3 sky = mix(pow(uHorizon, vec3(2.2)), pow(uZenith, vec3(2.2)), pow(el, 0.42));
  float sd = max(dot(dir, uSunDir), 0.0);
  sky += pow(uFogSun, vec3(2.2)) * pow(sd, 8.0) * 0.9;
  sky += uSunCol * pow(sd, 900.0) * 18.0;
  sky += uSunCol * pow(sd, 60.0) * 0.6;
  if (dir.y > 0.01) {
    vec2 uv = dir.xz / (dir.y + 0.12) * 1.6 + vec2(uTime * 0.01, 0.0);
    float c = smoothstep(0.52, 0.78, fbm(uv));
    vec3 cc = mix(pow(vec3(1.0, 0.86, 0.78), vec3(2.2)), pow(uFogSun, vec3(2.2)) * 1.3, pow(sd, 3.0));
    sky = mix(sky, cc * (0.75 + 0.5 * fbm(uv * 2.0)), c * 0.85 * smoothstep(0.01, 0.12, dir.y));
  }
  if (dir.y < 0.0) sky = mix(sky, pow(uHorizon, vec3(2.2)) * 0.9, smoothstep(0.0, -0.08, dir.y));
  o = vec4(pow(aces(sky * uExposure), vec3(1.0 / 2.2)), 1.0);
}`;
const PVS = `#version 300 es
layout(location=0) in vec3 aCenter;
layout(location=1) in vec2 aCorner;
layout(location=2) in vec4 aInfo;
uniform mat4 uVP; uniform vec3 uRight, uUp;
out vec2 vUv; out vec4 vInfo; out vec3 vPos;
void main() {
  vec3 p = aCenter + (uRight * aCorner.x + uUp * aCorner.y) * aInfo.x;
  vUv = aCorner; vInfo = aInfo; vPos = p;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const PFS = `#version 300 es
precision highp float;
in vec2 vUv; in vec4 vInfo; in vec3 vPos;
uniform vec3 uCam, uFogCol; uniform float uFogDen;
out vec4 o;
void main() {
  float r = length(vUv);
  if (r > 1.0) discard;
  float a = (1.0 - smoothstep(0.2, 1.0, r)) * vInfo.y;
  vec3 c = vInfo.z > 0.5 ? mix(vec3(1.0, 0.95, 0.6), vec3(1.0, 0.45, 0.1), r) * 1.4 : vec3(0.9, 0.9, 0.92);
  if (vInfo.w > 0.5) c = vec3(0.75, 0.62, 0.45);
  float d = length(uCam - vPos);
  float f = 1.0 - exp(-pow(d * uFogDen, 1.35));
  c = mix(c, pow(uFogCol, vec3(1.0 / 2.2)), f);
  o = vec4(c * a, a);
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

export function createRenderer(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keep });
  if (!gl) return null;
  const P = compile(gl, VS, FS), S = compile(gl, SVS, SFS), K = compile(gl, SKYVS, SKYFS), Q = compile(gl, PVS, PFS);
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
  const partBuf = gl.createBuffer();
  gl.bindVertexArray(partVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
  gl.bindVertexArray(null);

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
  function drop(m) {
    if (!m) return;
    try { gl.deleteBuffer(m.buf); gl.deleteVertexArray(m.vao); } catch {}
    const i = owned.indexOf(m); if (i >= 0) owned.splice(i, 1);
  }
  function dispose() {
    for (const m of owned.slice()) drop(m);
    try { gl.deleteTexture(shadowTex); gl.deleteFramebuffer(shadowFb); gl.deleteBuffer(skyBuf); gl.deleteBuffer(partBuf); } catch {}
  }
  function lose() { try { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch {} }

  function lightVP(env, center) {
    const d = env.sunDir, R = env.shadowRange || 70;
    const eye = [center[0] + d[0] * 260, center[1] + d[1] * 260, center[2] + d[2] * 260];
    return m4.mul(m4.ortho(-R, R, -R, R, 20, 600), m4.look(eye, center, [0, 1, 0]));
  }

  function render(scene) {
    const { env, cam, items, parts } = scene;
    const W = canvas.width, H = canvas.height;
    const view = m4.look(cam.pos, cam.at, [0, 1, 0]);
    const proj = m4.persp(cam.fov, W / H, cam.near || 0.3, cam.far || 1400);
    const VP = m4.mul(proj, view);
    const LVP = lightVP(env, cam.shadowAt || cam.at);
    const useShadow = env.shadows !== false;
    if (useShadow) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFb);
      gl.viewport(0, 0, SM, SM);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.disable(gl.CULL_FACE);
      gl.useProgram(S.p);
      gl.uniformMatrix4fv(S.u.uLightVP, false, LVP);
      for (const it of items) {
        if (!it.cast) continue;
        gl.uniformMatrix4fv(S.u.uModel, false, it.model || IDENT);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
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
    gl.uniform1f(K.u.uExposure, env.exposure || 1);
    gl.uniform1f(K.u.uTime, env.time || 0);
    gl.bindVertexArray(skyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uVP, false, VP);
    gl.uniformMatrix4fv(P.u.uLightVP, false, LVP);
    gl.uniform3fv(P.u.uSunDir, env.sunDir);
    gl.uniform3fv(P.u.uSunCol, env.sunCol);
    gl.uniform3fv(P.u.uSkyCol, env.skyCol);
    gl.uniform3fv(P.u.uGndCol, env.gndCol);
    gl.uniform3fv(P.u.uFogCol, env.fogCol);
    gl.uniform3fv(P.u.uFogSun, env.fogSunLin || env.fogSun);
    gl.uniform3fv(P.u.uCam, cam.pos);
    gl.uniform1f(P.u.uFogDen, env.fogDen);
    gl.uniform1f(P.u.uShadowOn, useShadow ? 1 : 0);
    gl.uniform1f(P.u.uExposure, env.exposure || 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, shadowTex);
    gl.uniform1i(P.u.uShadow, 0);
    for (const it of items) {
      gl.uniformMatrix4fv(P.u.uModel, false, it.model || IDENT);
      gl.bindVertexArray(it.mesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, it.mesh.n);
    }
    if (parts && parts.length) {
      const fl = new Float32Array(parts.length * 6 * 9);
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      let k = 0;
      for (const p of parts) for (const c of corners) { fl[k++] = p.x; fl[k++] = p.y; fl[k++] = p.z; fl[k++] = c[0]; fl[k++] = c[1]; fl[k++] = p.size; fl[k++] = p.alpha; fl[k++] = p.fire ? 1 : 0; fl[k++] = p.dust ? 1 : 0; }
      gl.useProgram(Q.p);
      gl.uniformMatrix4fv(Q.u.uVP, false, VP);
      gl.uniform3f(Q.u.uRight, view[0], view[4], view[8]);
      gl.uniform3f(Q.u.uUp, view[1], view[5], view[9]);
      gl.uniform3fv(Q.u.uCam, cam.pos);
      gl.uniform3fv(Q.u.uFogCol, env.fogCol);
      gl.uniform1f(Q.u.uFogDen, env.fogDen);
      gl.bindVertexArray(partVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, partBuf);
      gl.bufferData(gl.ARRAY_BUFFER, fl, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, 0, parts.length * 6);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
    return VP;
  }
  return { gl, mesh, drop, render, dispose, lose };
}
const IDENT = m4.ident();
