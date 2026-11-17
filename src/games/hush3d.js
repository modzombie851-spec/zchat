import { m4 } from './race3d.js';

const LIGHT_GLSL = `
uniform vec3 uCam, uAmb, uFog;
uniform float uFogD;
uniform vec4 uF0P, uF0D, uF0C;
uniform mat4 uSVP;
uniform float uShOn, uShQ;
uniform highp sampler2DShadow uSh;
uniform vec4 uFP[3], uFD[3], uFC[3];
uniform int uFN;
uniform vec4 uPL[8];
uniform vec3 uPC[8];
uniform int uPN;
uniform vec4 uPost, uPost2;
uniform vec2 uRes;
uniform sampler2D uAO;
uniform vec4 uAOm;
uniform float uAOOn, uWallH;
const float PI = 3.14159265;
float shade(vec3 P, vec3 N) {
  if (uShOn < 0.5) return 1.0;
  vec4 sc = uSVP * vec4(P + N * 0.02, 1.0);
  if (sc.w <= 0.01) return 1.0;
  vec3 s = sc.xyz / sc.w * 0.5 + 0.5;
  if (s.x <= 0.0 || s.x >= 1.0 || s.y <= 0.0 || s.y >= 1.0 || s.z >= 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(uSh, 0));
  float r = 0.0;
  if (uShQ > 0.5) {
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) r += texture(uSh, vec3(s.xy + vec2(float(x), float(y)) * t * 1.3, s.z));
    return r / 9.0;
  }
  r += texture(uSh, vec3(s.xy + vec2(-0.7, -0.7) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(0.7, -0.7) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(-0.7, 0.7) * t, s.z));
  r += texture(uSh, vec3(s.xy + vec2(0.7, 0.7) * t, s.z));
  return r * 0.25;
}
float ggx(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (PI * d * d + 1e-6); }
vec3 brdf(vec3 N, vec3 V, vec3 L, vec3 dc, vec3 F0, float rough) {
  float NoL = max(dot(N, L), 0.0);
  if (NoL <= 0.0) return vec3(0.0);
  vec3 H = normalize(V + L);
  float NoV = max(dot(N, V), 0.02), NoH = max(dot(N, H), 0.0), VoH = max(dot(V, H), 0.0);
  float a = max(rough * rough, 0.004);
  float k = a * 0.5;
  float vis = 0.25 / ((NoL * (1.0 - k) + k) * (NoV * (1.0 - k) + k));
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
  return (dc * (1.0 / PI) * (1.0 - F) + ggx(NoH, a) * vis * F) * NoL;
}
float spotK(vec3 P, vec4 lp, vec4 ld, vec4 lc, out vec3 L, out float dist) {
  vec3 d = lp.xyz - P;
  dist = length(d);
  L = d / max(dist, 1e-4);
  float cs = dot(-L, ld.xyz);
  float sp = smoothstep(ld.w, lc.w, cs);
  float core = smoothstep(ld.w + (lc.w - ld.w) * 0.55, mix(lc.w, 1.0, 0.35), cs);
  float w = clamp(1.0 - pow(dist / lp.w, 4.0), 0.0, 1.0);
  return sp * (0.28 + 1.05 * core) * w * w / (dist * dist + 0.35);
}
float contact(vec3 P) {
  if (uAOOn < 0.5) return 1.0;
  float a = texture(uAO, (P.xz - uAOm.xy) * uAOm.zw).r;
  float low = 1.0 - smoothstep(0.0, 1.05, P.y);
  float high = smoothstep(uWallH - 0.75, uWallH, P.y);
  return mix(1.0, a, max(low, high * 0.8));
}
vec3 lightAll(vec3 P, vec3 N, vec3 dc, vec3 F0, float rough, float occ) {
  vec3 V = normalize(uCam - P);
  vec3 c = uAmb * dc * occ;
  vec3 L; float dist;
  if (uF0C.r + uF0C.g > 0.0) {
    float k = spotK(P, uF0P, uF0D, uF0C, L, dist);
    if (k > 0.0) c += uF0C.rgb * k * brdf(N, V, L, dc, F0, rough) * shade(P, N);
  }
  for (int i = 0; i < 3; i++) {
    if (i >= uFN) break;
    float k = spotK(P, uFP[i], uFD[i], uFC[i], L, dist);
    if (k > 0.0) c += uFC[i].rgb * k * brdf(N, V, L, dc, F0, rough);
  }
  for (int i = 0; i < 8; i++) {
    if (i >= uPN) break;
    vec3 d = uPL[i].xyz - P;
    float dd = length(d);
    float w = clamp(1.0 - pow(dd / uPL[i].w, 4.0), 0.0, 1.0);
    if (w <= 0.0) continue;
    c += uPC[i] * (w * w / (dd * dd + 0.5)) * (brdf(N, V, d / max(dd, 1e-4), dc, F0, rough) + dc * 0.03 * occ);
  }
  return c;
}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 finish(vec3 c, vec3 P) {
  vec3 V = P - uCam;
  float dist = length(V);
  float f = 1.0 - exp(-uFogD * uFogD * dist * dist);
  c = mix(c, uFog, clamp(f, 0.0, 1.0));
  if (uF0C.r + uF0C.g > 0.0 && uPost2.x > 0.0) {
    float cs = dot(V / max(dist, 1e-4), uF0D.xyz);
    float sp = smoothstep(uF0D.w - 0.02, 1.0, cs);
    c += uF0C.rgb * sp * sp * uPost2.x * (1.0 - exp(-dist * 0.8)) * exp(-dist * 0.06);
  }
  c *= uPost.x;
  c = aces(c);
  vec2 q = gl_FragCoord.xy / uRes - 0.5;
  float edge = smoothstep(0.35, 0.95, length(q * vec2(1.0, 1.25)));
  c *= 1.0 - uPost.y * edge;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uPost2.y);
  c = mix(c, vec3(l * 1.25 + 0.012, l * 0.14, l * 0.11), uPost.z * (0.4 + 0.6 * edge));
  c = pow(c, vec3(1.0 / 2.2));
  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  return c * (1.0 - uPost.w);
}
mat3 tbn(vec3 N, vec3 p, vec2 uv) {
  vec3 dp1 = dFdx(p), dp2 = dFdy(p);
  vec2 du1 = dFdx(uv), du2 = dFdy(uv);
  vec3 a = cross(dp2, N), b = cross(N, dp1);
  vec3 T = a * du1.x + b * du2.x;
  vec3 B = a * du1.y + b * du2.y;
  float m = max(dot(T, T), dot(B, B));
  if (m < 1e-12) return mat3(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), N);
  float inv = inversesqrt(m);
  return mat3(T * inv, B * inv, N);
}
`;

const SVS = `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aUv;
layout(location=2) in vec3 aNor;
layout(location=3) in float aLay;
uniform mat4 uVP, uModel;
out vec3 vPos; out vec3 vNor; out vec2 vUv; flat out float vLay;
void main() {
  vec4 wp = uModel * vec4(aPos, 1.0);
  gl_Position = uVP * wp;
  vPos = wp.xyz;
  vNor = mat3(uModel) * aNor;
  vUv = aUv;
  vLay = aLay;
}`;

const SFS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec3 vPos; in vec3 vNor; in vec2 vUv; flat in float vLay;
uniform sampler2DArray uAlb, uMat;
uniform float uMatOn, uGrp, uEmis, uEmLay, uNrmK;
uniform vec4 uTint;
${LIGHT_GLSL}
out vec4 o;
void main() {
  float lay = vLay - uGrp;
  vec3 al = texture(uAlb, vec3(vUv, lay)).rgb * uTint.rgb;
  vec3 N0 = normalize(vNor);
  if (!gl_FrontFacing) N0 = -N0;
  vec3 N = N0;
  float rough = 0.75, metal = 0.0;
  if (uMatOn > 0.5) {
    vec4 m = texture(uMat, vec3(vUv, lay));
    vec2 xy = (m.xy * 2.0 - 1.0) * uNrmK;
    vec3 tn = vec3(xy, sqrt(max(0.0, 1.0 - dot(xy, xy))));
    N = normalize(tbn(N0, vPos, vUv) * tn);
    rough = clamp(m.z, 0.08, 1.0);
    metal = clamp((1.0 - m.w) * 2.0, 0.0, 1.0);
  }
  vec3 dc = al * (1.0 - metal);
  vec3 F0 = mix(vec3(0.04), al, metal);
  vec3 c = lightAll(vPos, N, dc, F0, rough, contact(vPos));
  if (abs(vLay - uEmLay) < 0.5) c += al * uTint.a * 3.0;
  c += al * uEmis;
  o = vec4(finish(c, vPos), 1.0);
}`;

const KVS = (nb) => `#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNor;
layout(location=2) in vec2 aUv;
layout(location=3) in uvec4 aJ;
layout(location=4) in vec4 aW;
uniform mat4 uVP, uModel;
uniform mat3x4 uB[${nb}];
out vec3 vPos; out vec3 vNor; out vec2 vUv;
void main() {
  mat3x4 S = uB[int(aJ.x)] * aW.x + uB[int(aJ.y)] * aW.y + uB[int(aJ.z)] * aW.z + uB[int(aJ.w)] * aW.w;
  vec3 p = vec4(aPos, 1.0) * S;
  vec3 n = vec4(aNor.xyz, 0.0) * S;
  vec4 wp = uModel * vec4(p, 1.0);
  gl_Position = uVP * wp;
  vPos = wp.xyz;
  vNor = mat3(uModel) * n;
  vUv = vec2(aUv.x, 1.0 - aUv.y);
}`;

const KFS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNor; in vec2 vUv;
uniform sampler2D uTex, uNrm;
uniform vec4 uTint;
uniform float uEmis, uNrmOn, uRough, uWet;
${LIGHT_GLSL}
out vec4 o;
void main() {
  vec4 t = texture(uTex, vUv);
  if (t.a < 0.4) discard;
  vec3 al = t.rgb * uTint.rgb;
  vec3 N0 = normalize(vNor);
  if (!gl_FrontFacing) N0 = -N0;
  vec3 N = N0;
  if (uNrmOn > 0.5) {
    vec3 tn = texture(uNrm, vUv).xyz * 2.0 - 1.0;
    tn.y = -tn.y;
    N = normalize(tbn(N0, vPos, vUv) * tn);
  }
  float rough = mix(uRough, uRough * 0.55, uWet * smoothstep(0.25, 0.0, dot(al, vec3(0.33))));
  vec3 c = lightAll(vPos, N, al, vec3(0.035 + uWet * 0.02), rough, 1.0) + al * uEmis;
  o = vec4(finish(c, vPos), 1.0);
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
  float sp = smoothstep(uF0D.w, uF0C.w, cs) * clamp(1.0 - dist / (uF0P.w * 0.45), 0.0, 1.0);
  vA = sp * aP.w * (uF0C.r > 0.0 ? 1.0 : 0.0) * 0.6;
  gl_PointSize = clamp(uRes.y * 0.0035 / max(cp.w, 0.2), 1.0, 6.0);
}`;
const PFS = `#version 300 es
precision mediump float;
in float vA;
out vec4 o;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = 1.0 - dot(q, q);
  if (r <= 0.0 || vA < 0.01) discard;
  o = vec4(vec3(0.95, 0.9, 0.8) * vA * r * r, 1.0);
}`;

const GVS = `#version 300 es
layout(location=0) in vec2 aQ;
uniform mat4 uVP;
uniform vec3 uRight, uUp;
uniform vec4 uG;
out vec2 vQ;
void main() {
  vQ = aQ;
  vec3 p = uG.xyz + (uRight * aQ.x + uUp * aQ.y) * uG.w;
  gl_Position = uVP * vec4(p, 1.0);
}`;
const GFS = `#version 300 es
precision mediump float;
in vec2 vQ;
uniform vec3 uGC;
uniform float uGFade;
out vec4 o;
void main() {
  float r = length(vQ);
  float a = exp(-r * r * 5.5) + 0.35 * exp(-r * r * 40.0);
  a *= smoothstep(1.0, 0.7, r) * uGFade;
  o = vec4(uGC * a, 1.0);
}`;

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
  const gl = canvas.getContext('webgl2', { antialias: opts.aa !== false, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keep });
  if (!gl) return null;
  const P = compile(gl, SVS, SFS), D = compile(gl, DVS, DFS), PT = compile(gl, PVS, PFS), GL = compile(gl, GVS, GFS);
  const skinProg = new Map();
  const skinP = (nb) => { let s = skinProg.get(nb); if (!s) { s = { k: compile(gl, KVS(nb), KFS), d: compile(gl, DKVS(nb), DFS) }; skinProg.set(nb, s); } return s; };
  const owned = [];
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  const anisoMax = aniso ? Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 0;
  const groups = [{ alb: null, mat: null, n: 0 }, { alb: null, mat: null, n: 0 }];
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
  mkShadow(opts.shadow || 512);
  const white = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, white);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  let aoTex = white, aoM = [0, 0, 1, 1], aoOn = false;
  const dust = { vao: gl.createVertexArray(), buf: gl.createBuffer(), n: 0 };
  gl.bindVertexArray(dust.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, dust.buf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0);
  gl.bindVertexArray(null);
  const quad = { vao: gl.createVertexArray(), buf: gl.createBuffer() };
  gl.bindVertexArray(quad.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad.buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);

  function scaled(img, s, layers) {
    if (img.width === s && img.height === s * layers) return img;
    const c = document.createElement('canvas');
    c.width = s; c.height = s * layers;
    const cx = c.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, img.width, img.height, 0, 0, s, s * layers);
    return c;
  }
  function arrTex(img, layers, s, srgb) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
    const lv = Math.floor(Math.log2(s)) + 1;
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, lv, srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, s, s, layers);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, s, s, layers, gl.RGBA, gl.UNSIGNED_BYTE, scaled(img, s, layers));
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (anisoMax > 1) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, anisoMax);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    return t;
  }
  function setGroup(g, alb, mat, layers, size) {
    const G = groups[g];
    if (G.alb) gl.deleteTexture(G.alb);
    if (G.mat) gl.deleteTexture(G.mat);
    G.alb = arrTex(alb, layers, size, true);
    G.mat = mat ? arrTex(mat, layers, size, false) : null;
    G.n = layers;
  }

  function tex2d(img, o = {}) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    if (o.raw) gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    const w = img.width, h = img.height;
    const lv = Math.floor(Math.log2(Math.max(w, h))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, lv, o.raw ? gl.RGBA8 : gl.SRGB8_ALPHA8, w, h);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (anisoMax > 1) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, anisoMax));
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    gl.bindTexture(gl.TEXTURE_2D, null);
    owned.push({ tex: t });
    return t;
  }

  function setAO(data, w, h, x0, z0, sx, sz) {
    if (aoTex && aoTex !== white) gl.deleteTexture(aoTex);
    aoTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, aoTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, data);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    aoM = [x0, z0, 1 / sx, 1 / sz];
    aoOn = true;
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

  const L = { cam: [0, 0, 0], amb: [0.02, 0.022, 0.03], fog: [0.006, 0.007, 0.01], fogD: 0.07, f0: null, fl: [], pl: [], post: [1, 0.3, 0, 0], post2: [0, 1, 0, 0], wallH: 3 };
  const tmpF = new Float32Array(12), tmpFD = new Float32Array(12), tmpFC = new Float32Array(12), tmpPL = new Float32Array(32), tmpPC = new Float32Array(24);
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
    } else { gl.uniform4f(u.uF0C, 0, 0, 0, 1); gl.uniform4f(u.uF0D, 0, 0, 1, 1); }
    const fl = L.fl.slice(0, 3);
    tmpF.fill(0); tmpFD.fill(0); tmpFC.fill(0);
    fl.forEach((g, i) => { tmpF.set([g.p[0], g.p[1], g.p[2], g.range], i * 4); tmpFD.set([g.d[0], g.d[1], g.d[2], g.cosO], i * 4); tmpFC.set([g.c[0], g.c[1], g.c[2], g.cosI], i * 4); });
    if (u.uFP) { gl.uniform4fv(u.uFP, tmpF); gl.uniform4fv(u.uFD, tmpFD); gl.uniform4fv(u.uFC, tmpFC); }
    gl.uniform1i(u.uFN, fl.length);
    const pl = L.pl.slice(0, 8);
    tmpPL.fill(0); tmpPC.fill(0);
    pl.forEach((q, i) => { tmpPL.set([q.p[0], q.p[1], q.p[2], q.r], i * 4); tmpPC.set(q.c, i * 3); });
    if (u.uPL) { gl.uniform4fv(u.uPL, tmpPL); gl.uniform3fv(u.uPC, tmpPC); }
    gl.uniform1i(u.uPN, pl.length);
    gl.uniform4fv(u.uPost, L.post);
    gl.uniform4fv(u.uPost2, L.post2);
    gl.uniform2f(u.uRes, res[0], res[1]);
    gl.uniform1f(u.uShOn, L.shOn ? 1 : 0);
    gl.uniform1f(u.uShQ, L.shQ ? 1 : 0);
    if (u.uSVP && L.svp) gl.uniformMatrix4fv(u.uSVP, false, L.svp);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, shTex);
    gl.uniform1i(u.uSh, 1);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, aoTex);
    gl.uniform1i(u.uAO, 3);
    gl.uniform4fv(u.uAOm, aoM);
    gl.uniform1f(u.uAOOn, aoOn ? 1 : 0);
    gl.uniform1f(u.uWallH, L.wallH);
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
  const TINT0 = new Float32Array([1, 1, 1, 0]);
  let curGrp = -1;
  function bindGroup(g) {
    if (g === curGrp) return;
    curGrp = g;
    const G = groups[g] || groups[0];
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, G.alb);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, G.mat || G.alb);
    gl.uniform1f(P.u.uMatOn, G.mat && L.matOn ? 1 : 0);
    gl.uniform1f(P.u.uGrp, g === 1 ? 7 : 0);
  }
  function drawStatic(pr, it, depth) {
    const u = pr.u;
    gl.uniformMatrix4fv(u.uModel, false, it.model || IDENT);
    if (!depth) {
      bindGroup(it.grp || 0);
      gl.uniform4fv(u.uTint, it.tint || TINT0);
      gl.uniform1f(u.uEmis, it.emis || 0);
      gl.uniform1f(u.uEmLay, it.emLay == null ? -9 : it.emLay);
    }
    gl.bindVertexArray(it.mesh.vao);
    if (it.count != null) gl.drawElements(gl.TRIANGLES, it.count, it.mesh.type, (it.first || 0) * (it.mesh.type === gl.UNSIGNED_INT ? 4 : 2));
    else gl.drawElements(gl.TRIANGLES, it.mesh.n, it.mesh.type, 0);
  }

  function frame(sc) {
    const W = canvas.width, H = canvas.height;
    const proj = m4.persp(sc.fov || 1.15, W / H, sc.near || 0.06, sc.far || 40);
    const view = m4.look(sc.eye, sc.at, sc.up || [0, 1, 0]);
    const VP = m4.mul(proj, view);
    setFrustum(VP);
    L.cam = sc.eye; L.amb = sc.amb || L.amb; L.fog = sc.fog || L.fog; L.fogD = sc.fogD == null ? L.fogD : sc.fogD;
    L.f0 = sc.flash || null; L.fl = sc.flashes || []; L.pl = sc.lights || [];
    L.post = sc.post || L.post; L.post2 = sc.post2 || L.post2; L.matOn = sc.mat !== false; L.wallH = sc.wallH || 3;
    const statics = sc.statics || [], skins = sc.skins || [];
    L.shOn = false; L.shQ = !!sc.shadowHQ;
    if (sc.flash && sc.shadows) {
      const f = sc.flash;
      const sp = m4.persp(Math.acos(f.cosO) * 2 + 0.12, 1, 0.1, f.range);
      const up = Math.abs(f.d[1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
      const sv = m4.look(f.p, [f.p[0] + f.d[0], f.p[1] + f.d[1], f.p[2] + f.d[2]], up);
      const SVP = m4.mul(sp, sv);
      L.svp = SVP; L.shOn = true;
      const save = frustum.slice();
      setFrustum(SVP);
      sfrustum.set(frustum);
      frustum.set(save);
      gl.bindFramebuffer(gl.FRAMEBUFFER, shFb);
      gl.viewport(0, 0, shTex.size, shTex.size);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.4, 2.5);
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
    const fc = L.fog, fk = 1 - L.post[3];
    gl.clearColor(Math.pow(fc[0], 0.45) * fk, Math.pow(fc[1], 0.45) * fk, Math.pow(fc[2], 0.45) * fk, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    const res = [W, H];
    gl.useProgram(P.p);
    setLights(P, res);
    gl.uniformMatrix4fv(P.u.uVP, false, VP);
    gl.uniform1i(P.u.uAlb, 0);
    gl.uniform1i(P.u.uMat, 2);
    gl.uniform1f(P.u.uNrmK, sc.nrmK == null ? 1 : sc.nrmK);
    curGrp = -1;
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
      gl.uniformMatrix4fv(sk.u.uModel, false, it.model);
      gl.uniformMatrix3x4fv(sk.u.uB, false, it.bones);
      gl.uniform4fv(sk.u.uTint, it.tint || TINT0);
      gl.uniform1f(sk.u.uEmis, it.emis || 0);
      gl.uniform1f(sk.u.uRough, it.rough == null ? 0.6 : it.rough);
      gl.uniform1f(sk.u.uWet, it.wet || 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, it.tex);
      gl.uniform1i(sk.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, it.nrm || white);
      gl.uniform1i(sk.u.uNrm, 2);
      gl.uniform1f(sk.u.uNrmOn, it.nrm && L.matOn ? 1 : 0);
      gl.bindVertexArray(it.mesh.vao);
      gl.drawElements(gl.TRIANGLES, it.mesh.n, gl.UNSIGNED_SHORT, 0);
      drawn++;
    }
    const right = [view[0], view[4], view[8]], up = [view[1], view[5], view[9]];
    if ((sc.glows && sc.glows.length) || (dust.n && sc.flash)) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      if (sc.glows && sc.glows.length) {
        gl.useProgram(GL.p);
        gl.uniformMatrix4fv(GL.u.uVP, false, VP);
        gl.uniform3fv(GL.u.uRight, right);
        gl.uniform3fv(GL.u.uUp, up);
        gl.bindVertexArray(quad.vao);
        const fade = 1 - L.post[3];
        for (const g of sc.glows) {
          if (!inFrustum(g.p, g.s)) continue;
          gl.uniform4f(GL.u.uG, g.p[0], g.p[1], g.p[2], g.s);
          gl.uniform3fv(GL.u.uGC, g.c);
          gl.uniform1f(GL.u.uGFade, fade);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }
      if (dust.n && sc.flash) {
        gl.useProgram(PT.p);
        gl.uniformMatrix4fv(PT.u.uVP, false, VP);
        gl.uniform2f(PT.u.uRes, W, H);
        const f = sc.flash;
        gl.uniform4f(PT.u.uF0P, f.p[0], f.p[1], f.p[2], f.range);
        gl.uniform4f(PT.u.uF0D, f.d[0], f.d[1], f.d[2], f.cosO);
        gl.uniform4f(PT.u.uF0C, f.c[0], f.c[1], f.c[2], f.cosI);
        gl.bindVertexArray(dust.vao);
        gl.drawArrays(gl.POINTS, 0, dust.n);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
    if (sc.hand && sc.hand.length) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.CULL_FACE);
      const hp = m4.persp(0.95, W / H, 0.02, 3);
      const hv = m4.mul(hp, view);
      gl.useProgram(P.p);
      setLights(P, res);
      gl.uniformMatrix4fv(P.u.uVP, false, hv);
      curGrp = -1;
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
    try { for (const G of groups) { if (G.alb) gl.deleteTexture(G.alb); if (G.mat) gl.deleteTexture(G.mat); } if (shTex) gl.deleteTexture(shTex); if (shFb) gl.deleteFramebuffer(shFb); if (aoTex && aoTex !== white) gl.deleteTexture(aoTex); gl.deleteTexture(white); } catch {}
    try { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch {}
  }
  return { gl, setGroup, tex2d, setAO, staticMesh, skinMesh, setDust, frame, resize, setShadow, lost, dispose, inFrustum, get arrN() { return groups[0].n + groups[1].n; } };
}
