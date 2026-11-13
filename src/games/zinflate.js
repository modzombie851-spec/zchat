const LBASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DBASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const CLEN = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

function huff(lens, n) {
  const count = new Uint16Array(16), sym = new Uint16Array(n), offs = new Uint16Array(16);
  for (let i = 0; i < n; i++) count[lens[i]]++;
  count[0] = 0;
  for (let i = 1; i < 16; i++) offs[i] = offs[i - 1] + count[i - 1];
  for (let i = 0; i < n; i++) if (lens[i]) sym[offs[lens[i]]++] = i;
  return { count, sym };
}

let FIXED = null;
function fixed() {
  if (FIXED) return FIXED;
  const l = new Uint8Array(288);
  for (let i = 0; i < 288; i++) l[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8;
  const d = new Uint8Array(30).fill(5);
  FIXED = [huff(l, 288), huff(d, 30)];
  return FIXED;
}

function inflateRaw(src, pos, out) {
  let buf = 0, cnt = 0, op = 0, last = 0;
  const bits = (n) => {
    while (cnt < n) { if (pos >= src.length) throw new Error('inflate eof'); buf |= src[pos++] << cnt; cnt += 8; }
    const v = buf & ((1 << n) - 1);
    buf >>>= n;
    cnt -= n;
    return v;
  };
  const dec = (h) => {
    let code = 0, first = 0, index = 0;
    for (let len = 1; len < 16; len++) {
      code |= bits(1);
      const c = h.count[len];
      if (code - c < first) return h.sym[index + (code - first)];
      index += c;
      first += c;
      first <<= 1;
      code <<= 1;
    }
    throw new Error('inflate code');
  };
  while (!last) {
    last = bits(1);
    const type = bits(2);
    if (type === 0) {
      buf = 0; cnt = 0;
      const len = src[pos] | (src[pos + 1] << 8);
      pos += 4;
      out.set(src.subarray(pos, pos + len), op);
      pos += len;
      op += len;
      continue;
    }
    let lh, dh;
    if (type === 1) [lh, dh] = fixed();
    else if (type === 2) {
      const nl = bits(5) + 257, nd = bits(5) + 1, nc = bits(4) + 4;
      const cl = new Uint8Array(19);
      for (let i = 0; i < nc; i++) cl[CLEN[i]] = bits(3);
      const ch = huff(cl, 19);
      const lens = new Uint8Array(nl + nd);
      for (let i = 0; i < nl + nd;) {
        const s = dec(ch);
        if (s < 16) { lens[i++] = s; continue; }
        let rep = 0, v = 0;
        if (s === 16) { v = lens[i - 1]; rep = 3 + bits(2); } else if (s === 17) rep = 3 + bits(3); else rep = 11 + bits(7);
        while (rep--) lens[i++] = v;
      }
      lh = huff(lens.subarray(0, nl), nl);
      dh = huff(lens.subarray(nl), nd);
    } else throw new Error('inflate type');
    for (;;) {
      const s = dec(lh);
      if (s < 256) { out[op++] = s; continue; }
      if (s === 256) break;
      const k = s - 257;
      const len = LBASE[k] + bits(LEXT[k]);
      const ds = dec(dh);
      const dist = DBASE[ds] + bits(DEXT[ds]);
      for (let j = 0; j < len; j++, op++) out[op] = out[op - dist];
    }
  }
  return out.subarray(0, op);
}

export function gunzip(u8) {
  if (u8[0] !== 0x1f || u8[1] !== 0x8b || u8[2] !== 8) throw new Error('gzip');
  const flg = u8[3];
  let p = 10;
  if (flg & 4) p += 2 + (u8[p] | (u8[p + 1] << 8));
  if (flg & 8) while (u8[p++]);
  if (flg & 16) while (u8[p++]);
  if (flg & 2) p += 2;
  const n = u8.length;
  const size = (u8[n - 4] | (u8[n - 3] << 8) | (u8[n - 2] << 16) | (u8[n - 1] << 24)) >>> 0;
  return inflateRaw(u8, p, new Uint8Array(size));
}
