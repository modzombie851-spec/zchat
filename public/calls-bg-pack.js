(function () {
  if (typeof window === 'undefined' || window.ZCALLBG) return;

  function readModel(ab) {
    const dv = new DataView(ab);
    const tab = (pos) => ({ pos, vt: pos - dv.getInt32(pos, true) });
    const fpos = (t, i) => {
      const o = 4 + 2 * i;
      if (o >= dv.getUint16(t.vt, true)) return 0;
      const off = dv.getUint16(t.vt + o, true);
      return off ? t.pos + off : 0;
    };
    const ref = (p) => p + dv.getUint32(p, true);
    const sub = (t, i) => { const p = fpos(t, i); return p ? tab(ref(p)) : null; };
    const num = (t, i, k, d) => {
      const p = fpos(t, i);
      if (!p) return d;
      return k === 'i8' ? dv.getInt8(p) : k === 'u8' ? dv.getUint8(p) : k === 'u32' ? dv.getUint32(p, true) : dv.getInt32(p, true);
    };
    const vec = (t, i) => { const p = fpos(t, i); if (!p) return null; const v = ref(p); return { at: v + 4, n: dv.getUint32(v, true) }; };
    const ints = (t, i) => { const v = vec(t, i); const out = []; if (v) for (let j = 0; j < v.n; j++) out.push(dv.getInt32(v.at + 4 * j, true)); return out; };
    const tabs = (t, i) => { const v = vec(t, i); const out = []; if (v) for (let j = 0; j < v.n; j++) out.push(tab(ref(v.at + 4 * j))); return out; };
    const bytes = (t, i) => { const v = vec(t, i); return v ? new Uint8Array(ab, v.at, v.n) : null; };
    const str = (t, i) => { const v = vec(t, i); let s = ''; if (v) for (let j = 0; j < v.n; j++) s += String.fromCharCode(dv.getUint8(v.at + j)); return s; };
    const root = tab(dv.getUint32(0, true));
    const codes = tabs(root, 1).map((c) => { const b = Math.max(num(c, 3, 'i32', 0), num(c, 0, 'i8', 0)); return b === 32 ? `C:${str(c, 1)}` : b; });
    const buffers = tabs(root, 4).map((b) => bytes(b, 0));
    const g = tabs(root, 2)[0];
    const tensors = tabs(g, 0).map((t) => ({ shape: ints(t, 0), type: num(t, 1, 'i8', 0), buf: num(t, 2, 'u32', 0) }));
    const ops = tabs(g, 3).map((o) => {
      const op = { code: codes[num(o, 0, 'u32', 0)], ins: ints(o, 1), outs: ints(o, 2), act: 0, pad: 0, sw: 1, sh: 1 };
      const ot = num(o, 3, 'u8', 0);
      const x = sub(o, 4);
      if (x) {
        if (ot === 1) Object.assign(op, { pad: num(x, 0, 'i8', 0), sw: num(x, 1, 'i32', 1), sh: num(x, 2, 'i32', 1), act: num(x, 3, 'i8', 0) });
        else if (ot === 2) Object.assign(op, { pad: num(x, 0, 'i8', 0), sw: num(x, 1, 'i32', 1), sh: num(x, 2, 'i32', 1), act: num(x, 4, 'i8', 0) });
        else if (ot === 5) Object.assign(op, { pad: num(x, 0, 'i8', 0), sw: num(x, 1, 'i32', 1), sh: num(x, 2, 'i32', 1), act: num(x, 5, 'i8', 0) });
        else if (ot === 15) Object.assign(op, { align: !!num(x, 2, 'u8', 0), half: !!num(x, 3, 'u8', 0) });
        else if (ot === 11 || ot === 21) op.act = num(x, 0, 'i8', 0);
      }
      const co = bytes(o, 5);
      if (co && co.length >= 12) {
        const d = new DataView(co.buffer, co.byteOffset, co.length);
        Object.assign(op, { pad: d.getInt32(0, true) === 2 ? 1 : 0, sw: d.getInt32(4, true), sh: d.getInt32(8, true) });
      }
      return op;
    });
    return { tensors, ops, buffers, inputs: ints(g, 1), outputs: ints(g, 2) };
  }

  function half(h) {
    const s = h & 0x8000 ? -1 : 1;
    const e = (h >> 10) & 31;
    const f = h & 1023;
    if (e === 0) return s * f * 5.960464477539063e-8;
    if (e === 31) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
  }
  function constOf(m, i) {
    const t = m.tensors[i];
    const b = m.buffers[t.buf];
    if (!b || !b.length) return null;
    const n = t.shape.reduce((a, c) => a * c, 1);
    const raw = b.slice().buffer;
    if (t.type === 0) return new Float32Array(raw, 0, n);
    if (t.type === 2) return new Int32Array(raw, 0, n);
    if (t.type === 1) { const u = new Uint16Array(raw, 0, n); const out = new Float32Array(n); for (let j = 0; j < n; j++) out[j] = half(u[j]); return out; }
    return null;
  }

  const VS = '#version 300 es\nin vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const HEAD = '#version 300 es\nprecision highp float;precision highp int;precision highp sampler2D;out vec4 o;'
    + 'vec4 actf(vec4 v,int a){if(a==1)return max(v,0.);if(a==2)return v*clamp(v+3.,0.,6.)/6.;if(a==3)return 1./(1.+exp(-clamp(v,-30.,30.)));if(a==4)return clamp(v,0.,6.);return v;}';
  const FS = {
    conv: 'uniform sampler2D X,Wt,B;uniform int iH,iW,iS,oH,K,KW,sx,sy,pt,pl,act;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int s=p.y/oH;int y=p.y-s*oH;int x=p.x;vec4 a=texelFetch(B,ivec2(0,s),0);'
      + 'for(int k=0;k<K;k++){int ky=k/KW;int kx=k-ky*KW;int iy=y*sy+ky-pt;int ix=x*sx+kx-pl;if(iy<0||iy>=iH||ix<0||ix>=iW)continue;int r=s*K+k;'
      + 'for(int i=0;i<iS;i++){vec4 v=texelFetch(X,ivec2(ix,i*iH+iy),0);int c=i*4;a+=v.x*texelFetch(Wt,ivec2(c,r),0)+v.y*texelFetch(Wt,ivec2(c+1,r),0)+v.z*texelFetch(Wt,ivec2(c+2,r),0)+v.w*texelFetch(Wt,ivec2(c+3,r),0);}}o=actf(a,act);}',
    dw: 'uniform sampler2D X,Wt,B;uniform int iH,iW,oH,KH,KW,sx,sy,pt,pl,act;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int s=p.y/oH;int y=p.y-s*oH;int x=p.x;vec4 a=texelFetch(B,ivec2(0,s),0);'
      + 'for(int ky=0;ky<KH;ky++){int iy=y*sy+ky-pt;if(iy<0||iy>=iH)continue;for(int kx=0;kx<KW;kx++){int ix=x*sx+kx-pl;if(ix<0||ix>=iW)continue;a+=texelFetch(X,ivec2(ix,s*iH+iy),0)*texelFetch(Wt,ivec2(ky*KW+kx,s),0);}}o=actf(a,act);}',
    tconv: 'uniform sampler2D X,Wt,B;uniform int iH,iS,oH,act;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int s=p.y/oH;int y=p.y-s*oH;int x=p.x;int ix=x/2;int iy=y/2;int k=(y-iy*2)*2+(x-ix*2);int r=s*4+k;vec4 a=texelFetch(B,ivec2(0,s),0);'
      + 'for(int i=0;i<iS;i++){vec4 v=texelFetch(X,ivec2(ix,i*iH+iy),0);int c=i*4;a+=v.x*texelFetch(Wt,ivec2(c,r),0)+v.y*texelFetch(Wt,ivec2(c+1,r),0)+v.z*texelFetch(Wt,ivec2(c+2,r),0)+v.w*texelFetch(Wt,ivec2(c+3,r),0);}o=actf(a,act);}',
    bin: 'uniform sampler2D A,Bt;uniform int oH,bc,op,act;void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 a=texelFetch(A,p,0);vec4 b=bc==1?texelFetch(Bt,ivec2(0,p.y/oH),0):texelFetch(Bt,p,0);o=actf(op==0?a+b:a*b,act);}',
    un: 'uniform sampler2D A;uniform int act;void main(){o=actf(texelFetch(A,ivec2(gl_FragCoord.xy),0),act);}',
    rows: 'uniform sampler2D A;uniform int iW;void main(){int y=int(gl_FragCoord.y);vec4 a=vec4(0.);for(int x=0;x<iW;x++)a+=texelFetch(A,ivec2(x,y),0);o=a/float(iW);}',
    cols: 'uniform sampler2D A;uniform int iH;void main(){int s=int(gl_FragCoord.y);vec4 a=vec4(0.);for(int y=0;y<iH;y++)a+=texelFetch(A,ivec2(0,s*iH+y),0);o=a/float(iH);}',
    resize: 'uniform sampler2D X;uniform int iH,iW,oH;uniform vec2 sc;void main(){ivec2 p=ivec2(gl_FragCoord.xy);int s=p.y/oH;int y=p.y-s*oH;int x=p.x;float fy=(float(y)+.5)*sc.y-.5;float fx=(float(x)+.5)*sc.x-.5;'
      + 'int y0=max(int(floor(fy)),0);int y1=min(int(ceil(fy)),iH-1);int x0=max(int(floor(fx)),0);int x1=min(int(ceil(fx)),iW-1);float dy=fy-float(y0);float dx=fx-float(x0);int b=s*iH;'
      + 'o=texelFetch(X,ivec2(x0,b+y0),0)*(1.-dy)*(1.-dx)+texelFetch(X,ivec2(x0,b+y1),0)*dy*(1.-dx)+texelFetch(X,ivec2(x1,b+y0),0)*(1.-dy)*dx+texelFetch(X,ivec2(x1,b+y1),0)*dy*dx;}',
    pre: 'uniform sampler2D V;uniform vec2 sz;void main(){vec2 uv=gl_FragCoord.xy/sz;o=vec4(texture(V,uv).rgb,0.);}',
    mask: 'uniform sampler2D M,P;uniform float k;void main(){ivec2 p=ivec2(gl_FragCoord.xy);float m=texelFetch(M,p,0).x;float q=texelFetch(P,p,0).x;o=vec4(mix(q,m,k),0.,0.,1.);}',
    down: 'uniform sampler2D V,M;uniform vec2 sz;uniform vec2 px;void main(){vec2 uv=gl_FragCoord.xy/sz;vec3 c=vec3(0.);float w=0.;for(int j=0;j<2;j++)for(int i=0;i<2;i++){vec2 u=uv+(vec2(float(i),float(j))-.5)*px;float b=1.-smoothstep(.2,.6,texture(M,u).x);c+=texture(V,u).rgb*b;w+=b;}o=vec4(c*.25,w*.25);}',
    blur: 'uniform sampler2D A;uniform vec2 sz;uniform vec2 dir;void main(){vec2 uv=gl_FragCoord.xy/sz;vec4 a=texture(A,uv)*.2270270270;'
      + 'a+=(texture(A,uv+dir*1.3846153846)+texture(A,uv-dir*1.3846153846))*.3162162162;a+=(texture(A,uv+dir*3.2307692308)+texture(A,uv-dir*3.2307692308))*.0702702703;o=a;}',
    out: 'uniform sampler2D V,M,G,Ph;uniform vec2 sz;uniform int mode;uniform vec4 cov;void main(){vec2 uv=vec2(gl_FragCoord.x/sz.x,1.-gl_FragCoord.y/sz.y);vec3 f=texture(V,uv).rgb;float m=smoothstep(.28,.72,texture(M,uv).x);vec3 b;'
      + 'if(mode==2){b=texture(Ph,cov.xy+uv*cov.zw).rgb;}else{vec4 g=texture(G,uv);b=g.a>.004?g.rgb/g.a:f;}o=vec4(mix(b,f,m),1.);}',
  };

  function mkGl(canvas) {
    let gl = null;
    try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
    if (!gl) return null;
    const ok = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    if (!ok) return null;
    return gl;
  }

  function supported() {
    try {
      if (typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return false;
      const c = document.createElement('canvas');
      const gl = mkGl(c);
      if (!gl) return false;
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return true;
    } catch (e) { return false; }
  }

  function Engine(gl) {
    const progs = {};
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(`shader: ${gl.getShaderInfoLog(s)}`);
      return s;
    };
    const vs = shader(gl.VERTEX_SHADER, VS);
    const prog = (k) => {
      if (progs[k]) return progs[k];
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, shader(gl.FRAGMENT_SHADER, HEAD + FS[k]));
      gl.bindAttribLocation(p, 0, 'p');
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
      const loc = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); loc[u.name] = { at: gl.getUniformLocation(p, u.name), type: u.type }; }
      progs[k] = { p, loc };
      return progs[k];
    };
    const tex = (w, h, data, fmt, linear) => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      const f = linear ? gl.LINEAR : gl.NEAREST;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (fmt === 'f32') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data || null);
      else if (fmt === 'u8') gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data || null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      return t;
    };
    const target = (w, h, linear) => {
      const t = tex(w, h, null, 'f16', linear);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      return { t, fb, w, h };
    };
    const drop = (x) => { if (!x) return; try { gl.deleteFramebuffer(x.fb); gl.deleteTexture(x.t); } catch (e) {} };
    const run = (k, out, uni, texs) => {
      const pr = prog(k);
      gl.useProgram(pr.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null);
      gl.viewport(0, 0, out ? out.w : gl.drawingBufferWidth, out ? out.h : gl.drawingBufferHeight);
      let unit = 0;
      Object.keys(texs || {}).forEach((name) => {
        const l = pr.loc[name];
        if (!l) return;
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texs[name]);
        gl.uniform1i(l.at, unit);
        unit += 1;
      });
      Object.keys(uni || {}).forEach((name) => {
        const l = pr.loc[name];
        if (!l) return;
        const v = uni[name];
        if (l.type === gl.INT) gl.uniform1i(l.at, v);
        else if (l.type === gl.FLOAT) gl.uniform1f(l.at, v);
        else if (l.type === gl.FLOAT_VEC2) gl.uniform2f(l.at, v[0], v[1]);
        else if (l.type === gl.FLOAT_VEC4) gl.uniform4f(l.at, v[0], v[1], v[2], v[3]);
      });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    return { gl, prog, tex, target, drop, run };
  }

  function Net(E, model) {
    const { gl } = E;
    const consts = new Map();
    const shapes = model.tensors.map((t) => t.shape);
    model.ops.forEach((op) => { if (op.code === 6) { const c = constOf(model, op.ins[0]); if (c) consts.set(op.outs[0], c); } });
    const cst = (i) => { if (!consts.has(i)) consts.set(i, constOf(model, i)); return consts.get(i); };
    const dims = (i) => { const s = shapes[i]; return s.length === 4 ? { H: s[1], W: s[2], C: s[3], S: Math.ceil(s[3] / 4) } : { H: 1, W: 1, C: s[s.length - 1], S: Math.ceil(s[s.length - 1] / 4) }; };
    const users = new Map();
    model.ops.forEach((op, idx) => op.ins.forEach((i) => { if (!users.has(i)) users.set(i, []); users.get(i).push(idx); }));
    const ACT = { 19: 1, 117: 2, 14: 3 };
    const plan = [];
    const skip = new Set();
    const alias = new Map();
    model.ops.forEach((op, idx) => {
      if (op.code === 6 || skip.has(idx)) return;
      const step = { op, out: op.outs[0], act: op.act === 1 ? 1 : op.act === 3 ? 4 : 0 };
      if ([3, 4, 0, 'C:Convolution2DTransposeBias'].includes(op.code) && !step.act) {
        const u = users.get(op.outs[0]) || [];
        if (u.length === 1 && ACT[model.ops[u[0]].code] && !model.outputs.includes(op.outs[0])) {
          skip.add(u[0]);
          step.act = ACT[model.ops[u[0]].code];
          step.out = model.ops[u[0]].outs[0];
          alias.set(op.outs[0], step.out);
        }
      }
      plan.push(step);
    });
    const packConv = (w, co, kh, kw, ci) => {
      const K = kh * kw;
      const iS = Math.ceil(ci / 4);
      const oS = Math.ceil(co / 4);
      const data = new Float32Array(iS * 4 * oS * K * 4);
      for (let o = 0; o < co; o++) for (let k = 0; k < K; k++) for (let i = 0; i < ci; i++) {
        const x = (i >> 2) * 4 + (i & 3);
        const y = (o >> 2) * K + k;
        data[(y * iS * 4 + x) * 4 + (o & 3)] = w[((o * K) + k) * ci + i];
      }
      return E.tex(iS * 4, oS * K, data, 'f32');
    };
    const packVec = (b, c, rows) => {
      const S = Math.ceil(c / 4);
      const data = new Float32Array(S * 4 * (rows || 1));
      for (let r = 0; r < (rows || 1); r++) for (let i = 0; i < c; i++) data[((i >> 2) * (rows || 1) + r) * 4 + (i & 3)] = b[r * c + i];
      return E.tex(rows || 1, S, data, 'f32');
    };
    const packDw = (w, kh, kw, c) => {
      const K = kh * kw;
      const S = Math.ceil(c / 4);
      const data = new Float32Array(K * S * 4);
      for (let k = 0; k < K; k++) for (let i = 0; i < c; i++) data[((i >> 2) * K + k) * 4 + (i & 3)] = w[k * c + i];
      return E.tex(K, S, data, 'f32');
    };
    const bufs = new Map();
    const buf = (i) => {
      if (bufs.has(i)) return bufs.get(i);
      const d = dims(i);
      const b = E.target(d.W, d.H * d.S, false);
      bufs.set(i, b);
      return b;
    };
    const steps = plan.map(({ op, out, act }) => {
      const code = op.code;
      const x = op.ins[0];
      const di = dims(x);
      const dout = dims(out);
      if (code === 3 || code === 4) {
        const ws = shapes[op.ins[1]];
        const kh = ws[1];
        const kw = ws[2];
        const same = op.pad === 0;
        const tot = (n, k, s, o) => Math.max((o - 1) * s + k - n, 0);
        const pt = same ? Math.floor(tot(di.H, kh, op.sh, dout.H) / 2) : 0;
        const pl = same ? Math.floor(tot(di.W, kw, op.sw, dout.W) / 2) : 0;
        const w = cst(op.ins[1]);
        const b = cst(op.ins[2]);
        if (code === 3) {
          const Wt = packConv(w, ws[0], kh, kw, ws[3]);
          const B = packVec(b, ws[0]);
          return { k: 'conv', x, out, uni: { iH: di.H, iW: di.W, iS: di.S, oH: dout.H, K: kh * kw, KW: kw, sx: op.sw, sy: op.sh, pt, pl, act }, w: { Wt, B } };
        }
        const Wt = packDw(w, kh, kw, ws[3]);
        const B = packVec(b, ws[3]);
        return { k: 'dw', x, out, uni: { iH: di.H, iW: di.W, oH: dout.H, KH: kh, KW: kw, sx: op.sw, sy: op.sh, pt, pl, act }, w: { Wt, B } };
      }
      if (code === 'C:Convolution2DTransposeBias') {
        const ws = shapes[op.ins[1]];
        if (ws[1] !== 2 || ws[2] !== 2 || op.sw !== 2 || op.sh !== 2) throw new Error('tconv');
        const Wt = packConv(cst(op.ins[1]), ws[0], 2, 2, ws[3]);
        const B = packVec(cst(op.ins[2]), ws[0]);
        return { k: 'tconv', x, out, uni: { iH: di.H, iS: di.S, oH: dout.H, act }, w: { Wt, B } };
      }
      if (code === 0 || code === 18) {
        const a = op.ins[0];
        const b = op.ins[1];
        const da = dims(a);
        const db = dims(b);
        const big = da.H * da.W >= db.H * db.W ? a : b;
        const small = big === a ? b : a;
        const bc = dims(small).H * dims(small).W === 1 && dims(big).H * dims(big).W > 1 ? 1 : 0;
        return { k: 'bin', x: big, y: small, out, uni: { oH: dout.H, bc, op: code === 0 ? 0 : 1, act } };
      }
      if (ACT[code]) return { k: 'un', x, out, uni: { act: ACT[code] } };
      if (code === 40 || code === 1) {
        const mid = E.target(1, di.H * di.S, false);
        return { k: 'mean', x, out, mid, di };
      }
      if (code === 23) {
        return { k: 'resize', x, out, uni: { iH: di.H, iW: di.W, oH: dout.H, sc: [di.W / dout.W, di.H / dout.H] } };
      }
      throw new Error(`op ${code}`);
    });
    const inId = model.inputs[0];
    const outId = model.outputs[0];
    const ind = dims(inId);
    const resolve = (i) => (alias.has(i) ? alias.get(i) : i);
    steps.forEach((s) => { buf(s.out); });
    const run = () => {
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        const X = buf(resolve(s.x)).t;
        if (s.k === 'mean') {
          E.run('rows', s.mid, { iW: s.di.W }, { A: X });
          E.run('cols', buf(s.out), { iH: s.di.H }, { A: s.mid.t });
        } else if (s.k === 'bin') {
          E.run('bin', buf(s.out), s.uni, { A: X, Bt: buf(resolve(s.y)).t });
        } else if (s.k === 'un' || s.k === 'resize') {
          E.run(s.k, buf(s.out), s.uni, { A: X, X });
        } else {
          E.run(s.k, buf(s.out), s.uni, { X, Wt: s.w.Wt, B: s.w.B });
        }
      }
    };
    return { run, input: buf(inId), output: () => buf(outId), W: ind.W, H: ind.H, passes: steps.length };
  }

  const modelJobs = {};
  function loadModel(url) {
    if (!modelJobs[url]) {
      modelJobs[url] = fetch(url).then((r) => { if (!r.ok) throw new Error('model'); return r.arrayBuffer(); }).then(readModel);
      modelJobs[url].catch(() => { delete modelJobs[url]; });
    }
    return modelJobs[url];
  }

  async function create(opts) {
    const o = opts || {};
    const base = o.base || '/';
    const canvas = document.createElement('canvas');
    const gl = mkGl(canvas);
    if (!gl) throw new Error('webgl');
    const E = Engine(gl);
    ['conv', 'dw', 'tconv', 'bin', 'un', 'rows', 'cols', 'resize', 'pre', 'mask', 'down', 'blur', 'out'].forEach((k) => E.prog(k));
    const nets = {};
    const netFor = async (wide) => {
      const key = wide ? 'l' : 'g';
      if (!nets[key]) nets[key] = Net(E, await loadModel(`${base}${wide ? 'calls-bg-landscape' : 'calls-bg-portrait'}.tflite`));
      return nets[key];
    };
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, { position: 'fixed', left: '0', top: '0', width: '2px', height: '2px', opacity: '0', pointerEvents: 'none', zIndex: '-1' });
    document.body.appendChild(video);
    const vtex = E.tex(2, 2, null, 'u8', true);
    let photoTex = null;
    let cover = [0, 0, 1, 1];
    let photoSize = [1, 1];
    let mode = o.mode === 'photo' ? 2 : 1;
    let src = o.track;
    let stopped = false;
    let lost = false;
    let net = null;
    let sizeKey = '';
    let maskA = null;
    let maskB = null;
    let small = null;
    let smallB = null;
    let outW = 0;
    let outH = 0;
    let fence = null;
    let frames = 0;
    let seen = 0;
    let drops = 0;
    let busyMs = 0;
    let winAt = performance.now();
    let slowWins = 0;
    let lastFps = 0;
    let every = 1;
    let tick = 0;
    let fresh = true;
    let pendingNet = null;
    const fps = o.fps || 24;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; if (o.onError) o.onError('lost'); }, false);
    const setSrc = (t) => {
      src = t;
      try { video.srcObject = new MediaStream([t]); } catch (e) {}
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
      fresh = true;
    };
    setSrc(src);
    const stream = canvas.captureStream(fps);
    const outTrack = stream.getVideoTracks()[0];
    const fitPhoto = () => {
      if (!outW || !outH) return;
      const a = outW / outH;
      const b = photoSize[0] / photoSize[1];
      if (b > a) { const w = a / b; cover = [(1 - w) / 2, 0, w, 1]; } else { const h = b / a; cover = [0, (1 - h) / 2, 1, h]; }
    };
    const setPhoto = (img) => {
      if (!img) return;
      const w = img.naturalWidth || img.videoWidth || img.width;
      const h = img.naturalHeight || img.videoHeight || img.height;
      if (!w || !h) return;
      if (!photoTex) photoTex = E.tex(2, 2, null, 'u8', true);
      gl.bindTexture(gl.TEXTURE_2D, photoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
      photoSize = [w, h];
      fitPhoto();
    };
    if (o.photo) setPhoto(o.photo);
    const configure = async (vw, vh) => {
      const long = Math.max(vw, vh);
      const scale = Math.min(1, 640 / long);
      outW = Math.max(2, Math.round(vw * scale / 2) * 2);
      outH = Math.max(2, Math.round(vh * scale / 2) * 2);
      canvas.width = outW;
      canvas.height = outH;
      net = await netFor(vw >= vh);
      [maskA, maskB, small, smallB].forEach(E.drop);
      maskA = E.target(net.W, net.H, true);
      maskB = E.target(net.W, net.H, true);
      const sw = Math.max(8, Math.round(outW / 4));
      const sh = Math.max(8, Math.round(outH / 4));
      small = E.target(sw, sh, true);
      smallB = E.target(sw, sh, true);
      fitPhoto();
      fresh = true;
    };
    const frame = () => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh || video.readyState < 2) return false;
      const key = `${vw}x${vh}`;
      if (key !== sizeKey) {
        if (!pendingNet) {
          pendingNet = configure(vw, vh).then(() => { sizeKey = key; pendingNet = null; }, (e) => { pendingNet = null; if (o.onError) o.onError(String(e && e.message || e)); });
        }
        return false;
      }
      if (fence) {
        const st = gl.clientWaitSync(fence, 0, 0);
        if (st === gl.TIMEOUT_EXPIRED) { drops += 1; return false; }
        gl.deleteSync(fence);
        fence = null;
      }
      const t0 = performance.now();
      gl.bindTexture(gl.TEXTURE_2D, vtex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, video);
      tick += 1;
      if (fresh || tick % every === 0) {
        E.run('pre', net.input, { sz: [net.W, net.H] }, { V: vtex });
        net.run();
        E.run('mask', maskB, { k: fresh ? 1 : 0.7 }, { M: net.output().t, P: maskA.t });
        const sw = maskA;
        maskA = maskB;
        maskB = sw;
        fresh = false;
      }
      if (mode !== 2 || !photoTex) {
        E.run('down', small, { sz: [small.w, small.h], px: [2 / outW, 2 / outH] }, { V: vtex, M: maskA.t });
        E.run('blur', smallB, { sz: [small.w, small.h], dir: [1 / small.w, 0] }, { A: small.t });
        E.run('blur', small, { sz: [small.w, small.h], dir: [0, 1 / small.h] }, { A: smallB.t });
        E.run('blur', smallB, { sz: [small.w, small.h], dir: [2 / small.w, 0] }, { A: small.t });
        E.run('blur', small, { sz: [small.w, small.h], dir: [0, 2 / small.h] }, { A: smallB.t });
      }
      E.run('out', null, { sz: [outW, outH], mode: mode === 2 && photoTex ? 2 : 1, cov: cover }, { V: vtex, M: maskA.t, G: small.t, Ph: photoTex || small.t });
      fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      busyMs += performance.now() - t0;
      frames += 1;
      return true;
    };
    let ready = false;
    const judge = () => {
      if (stopped) return;
      const now = performance.now();
      const span = now - winAt;
      if (span < 1900) return;
      lastFps = frames * 1000 / span;
      const avg = frames ? busyMs / frames : 0;
      let cam = 30;
      try { const fr = src && src.getSettings && src.getSettings().frameRate; if (fr > 0) cam = fr; } catch (e) {}
      const want = Math.min(fps, cam);
      const live = src && src.readyState === 'live' && src.enabled !== false;
      frames = 0;
      seen = 0;
      drops = 0;
      busyMs = 0;
      winAt = now;
      if (!ready || !live || document.visibilityState === 'hidden' || want < 8) { slowWins = 0; return; }
      if (lastFps < want * 0.25 || avg > 250) { if (o.onSlow) o.onSlow({ fps: lastFps, ms: avg }); return; }
      if (lastFps < want * 0.5 || avg > 60) {
        if (every === 1 && avg < 120) { every = 2; slowWins = 0; return; }
        slowWins += 1;
        if (slowWins >= 2 && o.onSlow) o.onSlow({ fps: lastFps, ms: avg });
      } else slowWins = 0;
    };
    const judgeTimer = setInterval(judge, 1000);
    let vfc = 0;
    let raf = 0;
    let lastAt = 0;
    const gap = 1000 / (fps + 2);
    const loop = (now) => {
      if (stopped) return;
      if (video.requestVideoFrameCallback) vfc = video.requestVideoFrameCallback(loop);
      else raf = requestAnimationFrame(loop);
      if (lost || !src || src.enabled === false || src.readyState !== 'live') return;
      const t = typeof now === 'number' ? now : performance.now();
      if (t - lastAt < gap) return;
      lastAt = t;
      seen += 1;
      try { if (frame() && !ready) { ready = true; winAt = performance.now(); frames = 0; busyMs = 0; } } catch (e) { if (o.onError) o.onError(String(e && e.message || e)); }
    };
    if (video.requestVideoFrameCallback) vfc = video.requestVideoFrameCallback(loop);
    else raf = requestAnimationFrame(loop);
    const stop = () => {
      if (stopped) return;
      stopped = true;
      clearInterval(judgeTimer);
      try { if (vfc && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(vfc); } catch (e) {}
      if (raf) cancelAnimationFrame(raf);
      try { outTrack.stop(); } catch (e) {}
      try { video.pause(); video.srcObject = null; video.remove(); } catch (e) {}
      try { const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); } catch (e) {}
    };
    return {
      track: outTrack,
      setMode: (m, img) => { if (img) setPhoto(img); mode = m === 'photo' ? 2 : 1; },
      setSource: setSrc,
      stop,
      stats: () => ({ fps: Math.round(lastFps * 10) / 10, every, w: outW, h: outH, net: net ? `${net.W}x${net.H}` : '', passes: net ? net.passes : 0 }),
      probe: async (data, wide) => {
        const n = await netFor(wide);
        gl.bindTexture(gl.TEXTURE_2D, n.input.t);
        const rgba = new Float32Array(n.W * n.H * 4);
        for (let i = 0; i < n.W * n.H; i++) { rgba[i * 4] = data[i * 3]; rgba[i * 4 + 1] = data[i * 3 + 1]; rgba[i * 4 + 2] = data[i * 3 + 2]; }
        const tmp = E.tex(n.W, n.H, rgba, 'f32');
        E.run('un', n.input, { act: 0 }, { A: tmp });
        const t0 = performance.now();
        n.run();
        const out = n.output();
        gl.bindFramebuffer(gl.FRAMEBUFFER, out.fb);
        const px = new Float32Array(out.w * out.h * 4);
        gl.readPixels(0, 0, out.w, out.h, gl.RGBA, gl.FLOAT, px);
        const ms = performance.now() - t0;
        const mask = new Float32Array(n.W * n.H);
        for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4];
        return { mask, ms, passes: n.passes };
      },
    };
  }

  window.ZCALLBG = { supported, create };
})();
