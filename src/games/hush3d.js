import { m4 } from './race3d.js';

const LIGHT_GLSL = `
uniform vec3 uCam, uAmb, uFog;
uniform float uFogD;
uniform vec4 uF0P, uF0D, uF0C;
uniform mat4 uSVP;
uniform float uShOn;
uniform highp sampler2DShadow uSh;
uniform vec4 uFP[3], uFD[3], uFC[3];
uniform int uFN;
uniform vec4 uPL[6];
uniform vec3 uPC[6];
uniform int uPN;
uniform vec4 uFx, uFx2;
uniform vec2 uRes;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bayer(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  int i = q.x + q.y * 4;
  float m[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  return m[i] / 16.0;
}
float shade(vec3 P, vec3 N) {
  if (uShOn < 0.5) return 1.0;
  vec4 sc = uSVP * vec4(P + N * 0.035, 1.0);
  if (sc.w <= 0.01) return 1.0;
  vec3 s = sc.xyz / sc.w * 0.5 + 0.5;
  if (s.x <= 0.0 || s.x >= 1.0 || s.y <= 0.0 || s.y >= 1.0 || s.z >= 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uSh, 0));
  float r = texture(uSh, vec3(s.xy + vec2(-0.6, -0.6) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(0.6, -0.6) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(-0.6, 0.6) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(0.6, 0.6) * t, s.z));
  return r * 0.25;
}
vec3 beam(vec3 P, vec3 N, vec4 lp, vec4 ld, vec4 lc, float sh) {
  vec3 d = lp.xyz - P;
  float dist = length(d);
  vec3 l = d / max(dist, 1e-4);
  float cs = dot(-l, ld.xyz);
  float sp = smoothstep(ld.w, lc.w, cs);
  if (sp <= 0.0) return vec3(0.0);
  float att = clamp(1.0 - dist / lp.w, 0.0, 1.0);
  att = att * sqrt(att) / (1.0 + 0.022 * dist * dist);
  float hot = smoothstep(lc.w, mix(lc.w, 1.0, 0.55), cs);
  float ring = 0.8 + 0.32 * hot + 0.035 * sin(acos(clamp(cs, -1.0, 1.0)) * 150.0);
  float nd = max(dot(N, l), 0.0) * 0.88 + 0.12;
  return lc.rgb * sp * att * nd * ring * sh;
}
vec3 lightAt(vec3 P, vec3 N) {
  vec3 c = uAmb;
  if (uF0C.r + uF0C.g > 0.0) c += beam(P, N, uF0P, uF0D, uF0C, shade(P, N));
  for (int i = 0; i < 3; i++) { if (i >= uFN) break; c += beam(P, N, uFP[i], uFD[i], uFC[i], 1.0); }
  for (int i = 0; i < 6; i++) {
    if (i >= uPN) break;
    vec3 d = uPL[i].xyz - P;
    float dist = length(d);
    float a = clamp(1.0 - dist / uPL[i].w, 0.0, 1.0);
    c += uPC[i] * a * a * (max(dot(N, d / max(dist, 1e-4)), 0.0) * 0.75 + 0.25);
  }
  return c;
}
vec3 post(vec3 c, float dist) {
  float f = 1.0 - exp(-uFogD * uFogD * dist * dist);
  c = mix(c, uFog, clamp(f, 0.0, 1.0));
  c = vec3(1.0) - exp(-c * 1.2);
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 cv = uv - 0.5;
  c *= mix(1.0, smoothstep(0.82, 0.18, length(cv * vec2(1.0, 1.15))), uFx2.y);
  c = pow(max(c, vec3(0.0)), vec3(uFx2.w));
  float n = hash(floor(gl_FragCoord.xy) + fract(uFx.x * 7.13) * 431.0);
  c += (n - 0.5) * uFx.y;
  if (uFx.z > 0.0) {
    float st = hash(floor(gl_FragCoord.xy * 0.5) + floor(uFx.x * 30.0) * 17.0);
    float band = step(0.93, hash(vec2(floor(gl_FragCoord.y * 0.2), floor(uFx.x * 20.0))));
    c = mix(c, vec3(st * 0.8), clamp(uFx.z * (0.3 + 0.7 * band), 0.0, 1.0));
  }
  c = mix(c, vec3(c.r * 1.5 + 0.12, c.g * 0.25, c.b * 0.25), uFx.w);
  if (uFx2.z > 0.5) c = floor(c * 31.0 + bayer(gl_FragCoord.xy)) / 31.0;
  return c * (1.0 - uFx2.x);
}
`;

const SVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in vec3 aNor;
layout(location=3) in float aLay;
uniform mat4 uVP, uModel;
uniform vec2 uSnap;
out vec3 vPos; out vec3 vNor; out vec2 vUv; out vec3 vUvA; flat out float vLay;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  vec4 cp = uVP * wp;
  if (uSnap.x > 0.0 && cp.w > 0.05) cp.xy = floor(cp.xy / cp.w * uSnap + 0.5) / uSnap * cp.w;
  gl_Position = cp;
  vPos = wp.xyz;
  vNor = mat3(uModel) * aNor;
  vUv = aUv;
  vUvA = vec3(aUv * cp.w, cp.w);
  vLay = aLay;
}`;

const SFS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vPos; in vec3 vNor; in vec2 vUv; in vec3 vUvA; flat in float vLay;
uniform sampler2DArray uTex;
uniform float uAff, uEmis;
uniform vec4 uTint;
uniform float uEmLay;
${LIGHT_GLSL}
out vec4 o;
void main() {
  vec2 uv = mix(vUv, vUvA.xy / vUvA.z, uAff);
  vec3 al = texture(uTex, vec3(uv, vLay)).rgb * uTint.rgb;
  vec3 N = normalize(vNor);
  if (!gl_FrontFacing) N = -N;
  vec3 c = al * lightAt(vPos, N);
  if (abs(vLay - uEmLay) < 0.5) c += al * uTint.a;
  c += al * uEmis;
  o = vec4(post(c, length(vPos - uCam)), 1.0);
}`;

const KVS = (nb) => `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNor;
layout(location=2) in vec2 aUv;
layout(location=3) in uvec4 aJ;
layout(location=4) in vec4 aW;
uniform mat4 uVP, uModel;
uniform mat3x4 uB[${nb}];
uniform vec2 uSnap;
out vec3 vPos; out vec3 vNor; out vec2 vUv;
void main() {
  mat3x4 S = uB[int(aJ.x)] * aW.x + uB[int(aJ.y)] * aW.y + uB[int(aJ.z)] * aW.z + uB[int(aJ.w)] * aW.w;
  vec3 p = vec4(aPos, 1.0) * S;
  vec3 n = vec4(aNor.xyz, 0.0) * S;
  vec4 wp = uModel * vec4(p, 1.0);
  vec4 cp = uVP * wp;
  if (uSnap.x > 0.0 && cp.w > 0.05) cp.xy = floor(cp.xy / cp.w * uSnap + 0.5) / uSnap * cp.w;
  gl_Position = cp;
  vPos = wp.xyz;
  vNor = mat3(uModel) * n;
  vUv = vec2(aUv.x, 1.0 - aUv.y);
}`;

const KFS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNor; in vec2 vUv;
uniform sampler2D uTex;
uniform vec4 uTint;
uniform float uEmis;
${LIGHT_GLSL}
out vec4 o;
void main() {
  vec4 t = texture(uTex, vUv);
  if (t.a < 0.4) discard;
  vec3 al = t.rgb * uTint.rgb;
  vec3 N = normalize(vNor);
  if (!gl_FrontFacing) N = -N;
  vec3 c = al * lightAt(vPos, N) + al * uEmis;
  o = vec4(post(c, length(vPos - uCam)), 1.0);
}`;

const DVS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uVP, uModel;
void main() { gl_Position = uVP * uModel * vec4(aPos, 1.0); }`;
const DKVS = (nb) => `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=3) in uvec4 aJ;
layout(location=4) in vec4 aW;
uniform mat4 uVP, uModel;
uniform mat3x4 uB[${nb}];
void main() {
  mat3x4 S = uB[int(aJ.x)] * aW.x + uB[int(aJ.y)] * aW.y + uB[int(aJ.z)] * aW.z + uB[int(aJ.w)] * aW.w;
  gl_Position = uVP * uModel * vec4(vec4(aPos, 1.0) * S, 1.0);
}`;
const DFS = `#version 300 es
precision mediump float;
out vec4 o;
void main() { o = vec4(1.0); }`;

const PVS = `#version 300 es
layout(location=0) in vec4 aP;
uniform mat4 uVP;
uniform vec2 uRes;
uniform vec4 uF0P, uF0D, uF0C;
out float vA;
void main() {
  vec4 cp = uVP * vec4(aP.xyz, 1.0);
  gl_Position = cp;
  vec3 d = aP.xyz - uF0P.xyz;
  float dist = length(d);
  float cs = dot(d / max(dist, 1e-4), uF0D.xyz);
  float sp = smoothstep(uF0D.w, uF0C.w, cs) * clamp(1.0 - dist / (uF0P.w * 0.55), 0.0, 1.0);
  vA = sp * aP.w * (uF0C.r > 0.0 ? 1.0 : 0.0);
  gl_PointSize = max(1.0, uRes.y * 0.006 / max(cp.w, 0.2));
}`;
const PFS = `#version 300 es
precision mediump float;
in float vA;
out vec4 o;
void main() { if (vA < 0.02) discard; o = vec4(vec3(0.9, 0.86, 0.78) * vA, 1.0); }`;

function compile(gl, vs, fs) {
  const mk = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const e = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error(e || 'shader'); }
    return s;
  };
  const p = gl.createProgram();
  const a = mk(gl.VERTEX_SHADER, vs), b = mk(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(p, a); gl.attachShader(p, b);
  gl.linkProgram(p);
  gl.deleteShader(a); gl.deleteShader(b);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const nm = info.name; u[nm] = gl.getUniformLocation(p, nm); if (nm.endsWith('[0]')) u[nm.slice(0, -3)] = u[nm]; }
  return { p, u };
}

export const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

export function createHush3D(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keep });
  if (!gl) return null;
  const P = compile(gl, SVS, SFS), D = compile(gl, DVS, DFS), PT = compile(gl, PVS, PFS);
  const skinProg = new Map();
  const skinP = (nb) => { let s = skinProg.get(nb); if (!s) { s = { k: compile(gl, KVS(nb), KFS), d: compile(gl, DKVS(nb), DFS) }; skinProg.set(nb, s); } return s; };
  const owned = [];
  let arr = null, arrN = 0;
  const SM = opts.shadow || 512;
  let shTex = null, shFb = null;
  const mkShadow = (size) => {
    if (shTex) { gl.deleteTexture(shTex); gl.deleteFramebuffer(shFb); }
    shTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, shTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, size, size);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    shFb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, shFb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    shTex.size = size;
  };
  mkShadow(SM);
  const dust = { vao: gl.createVertexArray(), buf: gl.createBuffer(), n: 0, data: null };
  gl.bindVertexArray(dust.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, dust.buf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
  gl.bindVertexArray(null);

  function texArray(img, layers, size, shrink = 0) {
    if (arr) gl.deleteTexture(arr);
    const s = Math.max(32, size >> shrink);
    arr = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
    const lv = Math.floor(Math.log2(s)) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, lv, gl.RGBA8, s, s, layers);
    let src = img;
    if (s !== size || img.width !== size) {
      const c = document.createElement('canvas');
      c.width = s; c.height = s * layers;
      const cx = c.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(img, 0, 0, img.width, img.height, 0, 0, s, s * layers);
      src = c;
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, s, s, layers, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    arrN = layers;
  }

  function tex2d(img, nearest = true) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST_MIPMAP_LINEAR : gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);
    owned.push({ tex: t });
    return t;
  }

  function staticMesh(vbuf, ibuf) {
    const vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, vbuf, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.BYTE, true, 24, 20);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, false, 24, 23);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ibuf, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    const m = { vao, vb, ib, n: ibuf.length, type: ibuf instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
    owned.push(m);
    return m;
  }

  function skinMesh(M) {
    const vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, M.verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.SHORT, true, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.UNSIGNED_SHORT, true, 32, 20);
    gl.enableVertexAttribArray(3); gl.vertexAttribIPointer(3, 4, gl.UNSIGNED_BYTE, 32, 24);
    gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 4, gl.UNSIGNED_BYTE, true, 32, 28);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, M.idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    skinP(M.nb);
    const m = { vao, vb, ib, n: M.ni, nb: M.nb, type: gl.UNSIGNED_SHORT };
    owned.push(m);
    return m;
  }

  function setDust(points) {
    dust.n = points.length / 4;
    gl.bindBuffer(gl.ARRAY_BUFFER, dust.buf);
    gl.bufferData(gl.ARRAY_BUFFER, points, gl.DYNAMIC_DRAW);
  }

  const L = {
    cam: [0, 0, 0], amb: [0.02, 0.022, 0.03], fog: [0.006, 0.007, 0.01], fogD: 0.07,
    f0: null, fl: [], pl: [], fx: [0, 0.05, 0, 0], fx2: [0, 0.6, 1, 1],
  };
  const tmp4 = new Float32Array(12), tmp3 = new Float32Array(18), tmp4b = new Float32Array(24), tmpF = new Float32Array(12), tmpFD = new Float32Array(12), tmpFC = new Float32Array(12);
  function setLights(pr, res) {
    const u = pr.u;
    gl.uniform3fv(u.uCam, L.cam);
    gl.uniform3fv(u.uAmb, L.amb);
    gl.uniform3fv(u.uFog, L.fog);
    gl.uniform1f(u.uFogD, L.fogD);
    const f = L.f0;
    if (f) {
      gl.uniform4f(u.uF0P, f.p[0], f.p[1], f.p[2], f.range);
      gl.uniform4f(u.uF0D, f.d[0], f.d[1], f.d[2], f.cosO);
      gl.uniform4f(u.uF0C, f.c[0], f.c[1], f.c[2], f.cosI);
    } else gl.uniform4f(u.uF0C, 0, 0, 0, 1);
    const fl = L.fl.slice(0, 3);
    tmpF.fill(0); tmpFD.fill(0); tmpFC.fill(0);
    fl.forEach((g, i) => { tmpF.set([g.p[0], g.p[1], g.p[2], g.range], i * 4); tmpFD.set([g.d[0], g.d[1], g.d[2], g.cosO], i * 4); tmpFC.set([g.c[0], g.c[1], g.c[2], g.cosI], i * 4); });
    if (u.uFP) { gl.uniform4fv(u.uFP, tmpF); gl.uniform4fv(u.uFD, tmpFD); gl.uniform4fv(u.uFC, tmpFC); }
    gl.uniform1i(u.uFN, fl.length);
    const pl = L.pl.slice(0, 6);
    tmp4b.fill(0); tmp3.fill(0);
    pl.forEach((q, i) => { tmp4b.set([q.p[0], q.p[1], q.p[2], q.r], i * 4); tmp3.set(q.c, i * 3); });
    if (u.uPL) { gl.uniform4fv(u.uPL, tmp4b); gl.uniform3fv(u.uPC, tmp3); }
    gl.uniform1i(u.uPN, pl.length);
    gl.uniform4fv(u.uFx, L.fx);
    gl.uniform4fv(u.uFx2, L.fx2);
    gl.uniform2f(u.uRes, res[0], res[1]);
    gl.uniform1f(u.uShOn, L.shOn ? 1 : 0);
    if (u.uSVP && L.svp) gl.uniformMatrix4fv(u.uSVP, false, L.svp);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shTex);
    gl.uniform1i(u.uSh, 1);
  }

  const frustum = new Float32Array(24);
  function setFrustum(m) {
    const r = (a, b, c, d, k) => { const l = Math.hypot(a, b, c) || 1; frustum[k] = a / l; frustum[k + 1] = b / l; frustum[k + 2] = c / l; frustum[k + 3] = d / l; };
    r(m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12], 0);
    r(m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12], 4);
    r(m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13], 8);
    r(m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13], 12);
    r(m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14], 16);
    r(m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14], 20);
  }
  function inFrustum(c, rad, F = frustum) {
    for (let k = 0; k < 24; k += 4) if (F[k] * c[0] + F[k + 1] * c[1] + F[k + 2] * c[2] + F[k + 3] < -rad) return false;
    return true;
  }
  const sfrustum = new Float32Array(24);

  function drawStatic(pr, it, depth) {
    const u = pr.u;
    gl.uniformMatrix4fv(u.uModel, false, it.model || IDENT);
    if (!depth) {
      gl.uniform4fv(u.uTint, it.tint || TINT0);
      gl.uniform1f(u.uEmis, it.emis || 0);
      gl.uniform1f(u.uEmLay, it.emLay == null ? -9 : it.emLay);
    }
    gl.bindVertexArray(it.mesh.vao);
    if (it.count != null) gl.drawElements(gl.TRIANGLES, it.count, it.mesh.type, (it.first || 0) * (it.mesh.type === gl.UNSIGNED_INT ? 4 : 2));
    else gl.drawElements(gl.TRIANGLES, it.mesh.n, it.mesh.type, 0);
  }
  const TINT0 = new Float32Array([1, 1, 1, 0]);

  function frame(sc) {
    const W = canvas.width, H = canvas.height;
    const proj = m4.persp(sc.fov || 1.15, W / H, sc.near || 0.06, sc.far || 40);
    const view = m4.look(sc.eye, sc.at, [0, 1, 0]);
    const VP = m4.mul(proj, view);
    setFrustum(VP);
    L.cam = sc.eye; L.amb = sc.amb || L.amb; L.fog = sc.fog || L.fog; L.fogD = sc.fogD == null ? L.fogD : sc.fogD;
    L.f0 = sc.flash || null; L.fl = sc.flashes || []; L.pl = sc.lights || [];
    L.fx = sc.fx || L.fx; L.fx2 = sc.fx2 || L.fx2;
    const statics = sc.statics || [], skins = sc.skins || [];
    L.shOn = false;
    if (sc.flash && sc.shadows) {
      const f = sc.flash;
      const sp = m4.persp(Math.acos(f.cosO) * 2 + 0.12, 1, 0.12, f.range);
      const up = Math.abs(f.d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
      const sv = m4.look(f.p, [f.p[0] + f.d[0], f.p[1] + f.d[1], f.p[2] + f.d[2]], up);
      const SVP = m4.mul(sp, sv);
      L.svp = SVP; L.shOn = true;
      for (let k = 0; k < 24; k++) sfrustum[k] = 0;
      const save = frustum.slice();
      setFrustum(SVP);
      sfrustum.set(frustum);
      frustum.set(save);
      gl.bindFramebuffer(gl.FRAMEBUFFER, shFb);
      gl.viewport(0, 0, shTex.size, shTex.size);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.6, 3.0);
      gl.disable(gl.CULL_FACE);
      gl.colorMask(false, false, false, false);
      gl.useProgram(D.p);
      gl.uniformMatrix4fv(D.u.uVP, false, SVP);
      for (const it of statics) {
        if (it.noShadow) continue;
        if (it.c && !inFrustum(it.c, it.r, sfrustum)) continue;
        if (it.c && Math.hypot(it.c[0] - f.p[0], it.c[1] - f.p[1], it.c[2] - f.p[2]) > f.range + it.r) continue;
        drawStatic(D, it, true);
      }
      for (const it of skins) {
        if (it.noShadow) continue;
        const sk = skinP(it.mesh.nb).d;
        gl.useProgram(sk.p);
        gl.uniformMatrix4fv(sk.u.uVP, false, SVP);
        gl.uniformMatrix4fv(sk.u.uModel, false, it.model);
        gl.uniformMatrix3x4fv(sk.u.uB, false, it.bones);
        gl.bindVertexArray(it.mesh.vao);
        gl.drawElements(gl.TRIANGLES, it.mesh.n, gl.UNSIGNED_SHORT, 0);
      }
      gl.colorMask(true, true, true, true);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.viewport(0, 0, W, H);
    gl.clearColor(L.fog[0], L.fog[1], L.fog[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    const res = [W, H];
    const snap = sc.snap ? [W * 0.5 * sc.snap, H * 0.5 * sc.snap] : [0, 0];
    gl.useProgram(P.p);
    setLights(P, res);
    gl.uniformMatrix4fv(P.u.uVP, false, VP);
    gl.uniform2fv(P.u.uSnap, snap);
    gl.uniform1f(P.u.uAff, sc.aff || 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, arr);
    gl.uniform1i(P.u.uTex, 0);
    let drawn = 0;
    const far = (sc.far || 40);
    for (const it of statics) {
      if (it.c) {
        if (!inFrustum(it.c, it.r)) continue;
        if (Math.hypot(it.c[0] - sc.eye[0], it.c[2] - sc.eye[2]) > far + it.r) continue;
      }
      if (it.twoSided) gl.disable(gl.CULL_FACE);
      drawStatic(P, it, false);
      if (it.twoSided) gl.enable(gl.CULL_FACE);
      drawn++;
    }
    gl.disable(gl.CULL_FACE);
    for (const it of skins) {
      if (it.c && !inFrustum(it.c, it.r)) continue;
      const sk = skinP(it.mesh.nb).k;
      gl.useProgram(sk.p);
      setLights(sk, res);
      gl.uniformMatrix4fv(sk.u.uVP, false, VP);
      gl.uniform2fv(sk.u.uSnap, snap);
      gl.uniformMatrix4fv(sk.u.uModel, false, it.model);
      gl.uniformMatrix3x4fv(sk.u.uB, false, it.bones);
      gl.uniform4fv(sk.u.uTint, it.tint || TINT0);
      gl.uniform1f(sk.u.uEmis, it.emis || 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      gl.uniform1i(sk.u.uTex, 0);
      gl.bindVertexArray(it.mesh.vao);
      gl.drawElements(gl.TRIANGLES, it.mesh.n, gl.UNSIGNED_SHORT, 0);
      drawn++;
    }
    if (dust.n && sc.flash) {
      gl.useProgram(PT.p);
      gl.uniformMatrix4fv(PT.u.uVP, false, VP);
      gl.uniform2f(PT.u.uRes, W, H);
      const f = sc.flash;
      gl.uniform4f(PT.u.uF0P, f.p[0], f.p[1], f.p[2], f.range);
      gl.uniform4f(PT.u.uF0D, f.d[0], f.d[1], f.d[2], f.cosO);
      gl.uniform4f(PT.u.uF0C, f.c[0], f.c[1], f.c[2], f.cosI);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.bindVertexArray(dust.vao);
      gl.drawArrays(gl.POINTS, 0, dust.n);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    if (sc.hand && sc.hand.length) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const hp = m4.persp(0.95, W / H, 0.02, 3);
      const hv = m4.mul(hp, view);
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uVP, false, hv);
      gl.uniform2fv(P.u.uSnap, snap);
      for (const it of sc.hand) drawStatic(P, it, false);
    }
    gl.bindVertexArray(null);
    return { drawn, VP };
  }

  function resize(w, h) {
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function setShadow(size) { if (!shTex || shTex.size !== size) mkShadow(size); }
  function lost() { return gl.isContextLost(); }
  function dispose() {
    for (const m of owned) { try { if (m.tex) gl.deleteTexture(m.tex); else { gl.deleteVertexArray(m.vao); gl.deleteBuffer(m.vb); gl.deleteBuffer(m.ib); } } catch {} }
    owned.length = 0;
    try { if (arr) gl.deleteTexture(arr); if (shTex) gl.deleteTexture(shTex); if (shFb) gl.deleteFramebuffer(shFb); } catch {}
    try { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch {}
  }
  return { gl, texArray, tex2d, staticMesh, skinMesh, setDust, frame, resize, setShadow, lost, dispose, inFrustum, get arrN() { return arrN; } };
}
