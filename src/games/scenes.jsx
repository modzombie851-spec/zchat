const W = 400;
const H = 860;

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
const f1 = (n) => Math.round(n * 10) / 10;
const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const vignette = (strength = 0.55) => `${rad('vg', [[0.55, '#000', 0], [1, '#000', strength]], 0.5, 0.48, 0.75)}`;
const wrap = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}<rect width="${W}" height="${H}" fill="url(#vg)"/></svg>`;

function books(x0, x1, base, maxH, seed, palette) {
  const r = rng(seed);
  let x = x0;
  let out = '';
  while (x < x1 - 6) {
    const w = 6 + Math.floor(r() * 9);
    if (x + w > x1) break;
    const h = maxH * (0.62 + r() * 0.36);
    const c = palette[Math.floor(r() * palette.length)];
    const lean = r() < 0.08 && x + w + 14 < x1;
    if (lean) {
      out += `<g transform="rotate(-12 ${f1(x)} ${base})"><rect x="${f1(x)}" y="${f1(base - h)}" width="${w}" height="${f1(h)}" fill="${c}"/><rect x="${f1(x)}" y="${f1(base - h + 6)}" width="${w}" height="2" fill="#E8D6A8" opacity="0.35"/></g>`;
      x += w + 10;
      continue;
    }
    out += `<rect x="${f1(x)}" y="${f1(base - h)}" width="${w}" height="${f1(h)}" fill="${c}"/>`;
    out += `<rect x="${f1(x)}" y="${f1(base - h)}" width="1.4" height="${f1(h)}" fill="#FFFFFF" opacity="0.08"/>`;
    if (r() < 0.6) out += `<rect x="${f1(x + 1)}" y="${f1(base - h + 7 + r() * 8)}" width="${w - 2}" height="2.2" fill="#E8D6A8" opacity="0.4"/>`;
    if (r() < 0.4) out += `<rect x="${f1(x + 1)}" y="${f1(base - 12)}" width="${w - 2}" height="1.6" fill="#E8D6A8" opacity="0.3"/>`;
    x += w + (r() < 0.12 ? 3 : 0.6);
  }
  return out;
}

function lounge() {
  const r = rng(41);
  let bottles = '';
  [[18, 26, '#2E5A3A'], [34, 34, '#6B3A1E'], [52, 22, '#8C6A2A'], [66, 30, '#2B3E52'], [84, 24, '#5E2430']].forEach(([x, h, c]) => {
    bottles += `<rect x="${x}" y="${200 - h}" width="11" height="${h}" rx="3" fill="${c}"/><rect x="${x + 3.5}" y="${200 - h - 9}" width="4" height="10" rx="1.5" fill="${c}"/><rect x="${x + 2}" y="${200 - h + 4}" width="2" height="${h - 8}" rx="1" fill="#FFFFFF" opacity="0.18"/>`;
  });
  let beads = '';
  for (let i = 0; i < 14; i++) beads += `<circle cx="${244 + i * 9 + (i > 8 ? 26 : 0)}" cy="118" r="4" fill="${i % 5 === 4 ? '#C8A15A' : '#E9DDC4'}" stroke="#2A1A10" stroke-width="0.8"/>`;
  let panels = '';
  for (let i = 0; i < 4; i++) {
    const x = 14 + i * 96;
    panels += `<rect x="${x}" y="606" width="84" height="164" rx="3" fill="url(#pn)" stroke="#1A0F09" stroke-width="2"/><rect x="${x + 7}" y="613" width="70" height="150" rx="2" fill="none" stroke="#4A2F1E" stroke-width="1.5" opacity="0.8"/>`;
  }
  let planks = '';
  for (let i = 0; i < 9; i++) planks += `<rect x="${i * 46 - (i % 2) * 20}" y="${790 + (i % 3) * 24}" width="2" height="24" fill="#120A06" opacity="0.7"/>`;
  let cues = '';
  [0, 1, 2, 3].forEach((i) => { cues += `<rect x="${356 + i * 9}" y="${300 + (i % 2) * 6}" width="3.2" height="236" rx="1.6" fill="url(#cue)"/>`; });
  let stripes = '';
  for (let x = 6; x < W; x += 22) stripes += `<rect x="${x}" y="0" width="1" height="560" fill="#D8F0E6" opacity="0.045"/>`;
  let motifs = '';
  for (let y = 40; y < 540; y += 64) for (let x = (y / 64) % 2 ? 28 : 6; x < W; x += 44) motifs += `<path d="M${x} ${y - 5} l5 5 -5 5 -5 -5z" fill="#CFE8DD" opacity="${f1(0.035 + r() * 0.02)}"/>`;
  const lamp = (x) => `<rect x="${x - 1}" y="0" width="2" height="74" fill="#0A0A0A"/><path d="M${x - 42} 128 L${x - 20} 74 H${x + 20} L${x + 42} 128 Z" fill="url(#shade)"/><path d="M${x - 42} 128 H${x + 42}" stroke="#C8A15A" stroke-width="3"/><ellipse cx="${x}" cy="129" rx="30" ry="4.5" fill="#FFE7B0"/><rect x="${x - 18}" y="74" width="36" height="5" rx="2" fill="#C8A15A"/>`;
  const defs = [
    lin('wall', [[0, '#123030'], [0.65, '#0E2426'], [1, '#0B1B1C']]),
    lin('pn', [[0, '#3A2416'], [1, '#26170D']]),
    lin('shade', [[0, '#1F5A45'], [1, '#123A2C']]),
    lin('cue', [[0, '#E8DCC2'], [0.55, '#B9874A'], [1, '#3A1F0F']]),
    lin('fl', [[0, '#21140C'], [1, '#140C07']]),
    rad('cone', [[0, '#FFD98A', 0.42], [0.5, '#FFC163', 0.12], [1, '#FFC163', 0]], 0.5, 0.2, 0.6),
    rad('warm', [[0, '#FFB65C', 0.16], [1, '#FFB65C', 0]], 0.5, 0.45, 0.55),
    vignette(0.62),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#wall)"/>${stripes}${motifs}
<rect x="0" y="0" width="${W}" height="10" fill="#08100F"/>
<rect x="8" y="200" width="104" height="7" rx="2" fill="#3A2416"/><rect x="8" y="207" width="104" height="3" fill="#120A06" opacity="0.6"/>${bottles}
<rect x="296" y="150" width="86" height="104" rx="3" fill="#2A1A10" stroke="#C8A15A" stroke-width="2.5"/><rect x="304" y="158" width="70" height="88" fill="#1B2D3A"/><path d="M304 222 Q328 196 352 214 T374 206 V246 H304Z" fill="#2E4A3C"/><circle cx="352" cy="180" r="9" fill="#E9C77A" opacity="0.8"/><path d="M304 236 Q330 226 374 236 V246 H304Z" fill="#20352B"/>
<rect x="234" y="108" width="150" height="20" rx="3" fill="#2A1A10"/><rect x="236" y="117" width="146" height="2" fill="#C8A15A"/>${beads}
<rect x="350" y="292" width="40" height="10" rx="3" fill="#2A1A10"/><rect x="350" y="528" width="40" height="12" rx="3" fill="#2A1A10"/>${cues}
${lamp(108)}${lamp(292)}
<ellipse cx="108" cy="430" rx="190" ry="330" fill="url(#cone)"/><ellipse cx="292" cy="430" rx="190" ry="330" fill="url(#cone)"/>
<rect x="0" y="560" width="${W}" height="8" fill="#3A2416"/><rect x="0" y="568" width="${W}" height="3" fill="#C8A15A" opacity="0.55"/>
<rect x="0" y="571" width="${W}" height="219" fill="#2A190F"/>${panels}
<rect x="0" y="786" width="${W}" height="74" fill="url(#fl)"/>${planks}
<rect x="0" y="784" width="${W}" height="4" fill="#0C0705"/>
<rect width="${W}" height="${H}" fill="url(#warm)"/>`;
  return wrap(defs, body);
}

function study() {
  const pal = ['#6E2A2A', '#2F4A3A', '#2C3E5C', '#8A6A2E', '#5B3A5A', '#C9B48A', '#3E2A1A', '#7A4A24', '#4A5A2E'];
  let shelves = '';
  [0, 1].forEach((side) => {
    const x0 = side ? 306 : 0;
    const x1 = side ? 400 : 94;
    shelves += `<rect x="${x0}" y="40" width="${x1 - x0}" height="560" fill="#21140B"/>`;
    for (let i = 0; i < 6; i++) {
      const base = 120 + i * 82;
      shelves += books(x0 + 6, x1 - 6, base, 64, 7 + i * 13 + side * 101, pal);
      shelves += `<rect x="${x0}" y="${base}" width="${x1 - x0}" height="9" fill="#4A2E1A"/><rect x="${x0}" y="${base + 9}" width="${x1 - x0}" height="3" fill="#0E0805" opacity="0.7"/>`;
    }
    shelves += `<rect x="${side ? 306 : 88}" y="40" width="6" height="560" fill="#3A2416"/>`;
  });
  const r = rng(5);
  let stars = '';
  for (let i = 0; i < 26; i++) stars += `<circle cx="${f1(132 + r() * 136)}" cy="${f1(70 + r() * 130)}" r="${f1(0.5 + r() * 0.9)}" fill="#FFF6DA" opacity="${f1(0.35 + r() * 0.5)}"/>`;
  let city = '';
  let x = 124;
  while (x < 276) {
    const w = 8 + r() * 14;
    const h = 14 + r() * 40;
    city += `<rect x="${f1(x)}" y="${f1(326 - h)}" width="${f1(w)}" height="${f1(h)}" fill="#141A2C"/>`;
    for (let k = 0; k < 3; k++) if (r() < 0.5) city += `<rect x="${f1(x + 2 + r() * (w - 5))}" y="${f1(326 - h + 4 + r() * (h - 8))}" width="2" height="2.4" fill="#FFCF7A" opacity="0.8"/>`;
    x += w + 1;
  }
  let paneling = '';
  for (let px = 100; px < 306; px += 34) paneling += `<rect x="${px}" y="0" width="1.5" height="${H}" fill="#0E0805" opacity="0.55"/>`;
  let rug = '';
  for (let i = 0; i < 9; i++) rug += `<path d="M${20 + i * 42} 800 l21 -16 21 16 -21 16z" fill="${i % 2 ? '#A8763A' : '#2F4A5C'}" opacity="0.7"/>`;
  const defs = [
    lin('wl', [[0, '#3B2416'], [1, '#24150C']]),
    lin('sky', [[0, '#16203F'], [0.55, '#2D3866'], [0.82, '#8A5A62'], [1, '#D88A5A']]),
    lin('crt', [[0, '#5A1A1E'], [0.5, '#7A2A2C'], [1, '#4A1418']], 0, 0, 1, 0),
    lin('rug', [[0, '#6A1F24'], [1, '#4A1418']]),
    lin('flr', [[0, '#2A190E'], [1, '#170D07']]),
    rad('lamp', [[0, '#FFD58A', 0.5], [0.45, '#FFB65C', 0.14], [1, '#FFB65C', 0]], 0.5, 0.5, 0.5),
    rad('moon', [[0, '#FFF3D0', 0.55], [1, '#FFF3D0', 0]]),
    vignette(0.6),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#wl)"/>${paneling}
<path d="M120 330 V96 Q200 22 280 96 V330 Z" fill="url(#sky)"/>${stars}
<circle cx="236" cy="104" r="34" fill="url(#moon)"/><circle cx="236" cy="104" r="11" fill="#FFF0C8"/><circle cx="241" cy="100" r="10" fill="#2A3460"/>
${city}<rect x="120" y="322" width="160" height="8" fill="#0F1424"/>
<path d="M120 330 V96 Q200 22 280 96 V330" fill="none" stroke="#4A2E1A" stroke-width="10"/><path d="M200 50 V330 M120 200 H280" stroke="#4A2E1A" stroke-width="5"/>
<rect x="112" y="330" width="176" height="12" rx="2" fill="#4A2E1A"/>
<path d="M96 20 Q112 180 102 360 L122 360 Q128 180 124 20 Z" fill="url(#crt)"/><path d="M304 20 Q288 180 298 360 L278 360 Q272 180 276 20 Z" fill="url(#crt)"/>
<rect x="90" y="14" width="220" height="8" rx="4" fill="#C8A15A"/>
${shelves}
<circle cx="350" cy="64" r="160" fill="url(#lamp)" opacity="0.7"/>
<rect x="0" y="600" width="${W}" height="260" fill="url(#flr)"/>
<rect x="0" y="600" width="${W}" height="5" fill="#4A2E1A"/>
<path d="M-10 700 L410 700 L430 860 L-30 860 Z" fill="url(#rug)"/><path d="M6 712 L394 712 L410 848 L-10 848 Z" fill="none" stroke="#C8A15A" stroke-width="2" opacity="0.6"/>${rug}
<circle cx="60" cy="560" r="150" fill="url(#lamp)" opacity="0.45"/>`;
  return wrap(defs, body);
}

function terrace() {
  let awning = '';
  for (let i = 0; i < 10; i++) awning += `<rect x="${i * 40}" y="0" width="40" height="78" fill="${i % 2 ? '#F3E6CC' : '#2E7D7A'}"/>`;
  let scallops = '';
  for (let i = 0; i < 10; i++) scallops += `<path d="M${i * 40} 78 Q${i * 40 + 20} 100 ${i * 40 + 40} 78 Z" fill="${i % 2 ? '#F3E6CC' : '#2E7D7A'}"/>`;
  let bulbs = '';
  for (let i = 0; i < 11; i++) { const x = 8 + i * 38; const y = 118 + Math.sin((i / 10) * Math.PI) * 16; bulbs += `<circle cx="${x}" cy="${f1(y + 6)}" r="4.5" fill="#FFE7A8"/><circle cx="${x}" cy="${f1(y + 6)}" r="10" fill="#FFE7A8" opacity="0.18"/>`; }
  const leaf = (x, y, s, rot, c) => `<path d="M0 0 C${6 * s} ${-10 * s} ${18 * s} ${-10 * s} ${24 * s} 0 C${18 * s} ${10 * s} ${6 * s} ${10 * s} 0 0Z" fill="${c}" transform="translate(${x} ${y}) rotate(${rot})"/>`;
  let vines = '';
  const r = rng(77);
  [[30, 150], [372, 160]].forEach(([vx, vy]) => {
    vines += `<path d="M${vx - 18} ${vy} h36 l-6 26 h-24z" fill="#C9673F"/><rect x="${vx - 20}" y="${vy - 4}" width="40" height="6" rx="2" fill="#B05A36"/>`;
    for (let k = 0; k < 16; k++) vines += leaf(f1(vx - 14 + r() * 28), f1(vy + 24 + k * 14 + r() * 8), 0.8 + r() * 0.5, Math.floor(60 + r() * 60), k % 3 ? '#6F8F5A' : '#56764A');
  });
  let tiles = '';
  for (let row = 0; row < 7; row++) {
    const y0 = 640 + row * row * 4.6 + row * 12;
    const y1 = 640 + (row + 1) * (row + 1) * 4.6 + (row + 1) * 12;
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const spread = 1 + row * 0.16;
      const x0 = 200 + (i - n / 2) * 52 * spread;
      const x0b = 200 + (i - n / 2) * 52 * (1 + (row + 1) * 0.16);
      const x1 = 200 + (i + 1 - n / 2) * 52 * spread;
      const x1b = 200 + (i + 1 - n / 2) * 52 * (1 + (row + 1) * 0.16);
      tiles += `<path d="M${f1(x0)} ${f1(y0)} L${f1(x1)} ${f1(y0)} L${f1(x1b)} ${f1(y1)} L${f1(x0b)} ${f1(y1)}Z" fill="${(row + i) % 2 ? '#C9673F' : '#B85C38'}" stroke="#8E4426" stroke-width="1.2"/>`;
    }
  }
  let pot = '';
  [[34, 600, 1], [366, 610, -1]].forEach(([px, py, d]) => {
    pot += `<path d="M${px - 26} ${py} h52 l-7 56 h-38z" fill="#C9673F"/><rect x="${px - 29}" y="${py - 6}" width="58" height="9" rx="3" fill="#B05A36"/>`;
    for (let k = 0; k < 9; k++) pot += leaf(px, py - 4, 1.7 + r() * 0.8, -90 + d * (k * 18 - 72), k % 2 ? '#5E7F4C' : '#7A9A62');
  });
  let rays = '';
  [[60, 0.06], [150, 0.05], [250, 0.04]].forEach(([x, o]) => { rays += `<path d="M${x} 100 L${x + 70} 100 L${x + 260} 860 L${x + 120} 860 Z" fill="#FFF6DE" opacity="${o}"/>`; });
  const defs = [
    lin('pl', [[0, '#F2E2C2'], [1, '#E2C99E']]),
    lin('sky', [[0, '#7FC4E8'], [1, '#D8EEF2']]),
    lin('sea', [[0, '#3E8DA8'], [1, '#2C6E8A']]),
    lin('fl', [[0, '#B85C38'], [1, '#9A4A2C']]),
    vignette(0.42),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#pl)"/>
<path d="M110 640 V250 Q200 150 290 250 V640 Z" fill="#D9BC8C"/>
<path d="M126 640 V256 Q200 172 274 256 V640 Z" fill="url(#sky)"/>
<rect x="126" y="420" width="148" height="220" fill="url(#sea)"/>
<path d="M126 430 Q160 396 196 420 T274 404 V440 H126Z" fill="#7E9F6E"/><path d="M126 446 Q170 428 210 444 T274 436 V460 H126Z" fill="#5E8A5A"/>
<circle cx="236" cy="300" r="18" fill="#FFF3C8" opacity="0.9"/>
<path d="M146 520 h40 M210 560 h50 M150 600 h36" stroke="#D8F0F6" stroke-width="2" opacity="0.5"/>
<rect x="104" y="636" width="192" height="10" rx="3" fill="#C9A878"/>
${rays}
${awning}${scallops}<rect x="0" y="0" width="${W}" height="6" fill="#1F5C5A" opacity="0.6"/>
<path d="M0 112 Q200 150 400 112" stroke="#4A3A2A" stroke-width="1.5" fill="none"/>${bulbs}
${vines}
<rect x="0" y="634" width="${W}" height="226" fill="url(#fl)"/>${tiles}
${pot}`;
  return wrap(defs, body);
}

function course() {
  const r = rng(19);
  let clouds = '';
  [[70, 90, 1], [270, 60, 1.3], [330, 170, 0.8], [140, 200, 0.9]].forEach(([x, y, s]) => {
    clouds += `<g transform="translate(${x} ${y}) scale(${s})" opacity="0.92"><ellipse cx="0" cy="0" rx="34" ry="13" fill="#FFFFFF"/><ellipse cx="-16" cy="-8" rx="16" ry="12" fill="#FFFFFF"/><ellipse cx="12" cy="-12" rx="20" ry="15" fill="#FFFFFF"/><ellipse cx="0" cy="6" rx="34" ry="6" fill="#DCEBF5"/></g>`;
  });
  let trees = '';
  for (let i = 0; i < 16; i++) {
    const x = i * 27 + r() * 10 - 6;
    const s = 0.8 + r() * 0.5;
    trees += `<rect x="${f1(x - 2)}" y="${f1(318 - 6 * s)}" width="4" height="${f1(14 * s)}" fill="#3B2A1A"/><circle cx="${f1(x)}" cy="${f1(306 - 10 * s)}" r="${f1(15 * s)}" fill="${i % 3 ? '#2F6B3A' : '#285E33'}"/><circle cx="${f1(x - 5 * s)}" cy="${f1(300 - 12 * s)}" r="${f1(6 * s)}" fill="#3F8048" opacity="0.8"/>`;
  }
  let stripes = '';
  for (let i = 0; i < 9; i++) stripes += `<path d="M${i * 60 - 80} 860 L${i * 60 - 20} 860 L${i * 46 + 30} 600 L${i * 46} 600 Z" fill="#FFFFFF" opacity="0.05"/>`;
  const defs = [
    lin('sky', [[0, '#7EC8F2'], [0.7, '#BEE4F7'], [1, '#E8F6FA']]),
    lin('h1', [[0, '#7FB86A'], [1, '#5E9A52']]),
    lin('h2', [[0, '#5FA458'], [1, '#3F8746']]),
    lin('g', [[0, '#4FA052'], [1, '#2F7F3E']]),
    rad('sun', [[0, '#FFF6D0', 0.9], [0.3, '#FFF1B8', 0.35], [1, '#FFF1B8', 0]]),
    vignette(0.3),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<circle cx="330" cy="70" r="120" fill="url(#sun)"/>
${clouds}
<path d="M0 300 Q90 250 190 286 T400 270 V360 H0Z" fill="url(#h1)"/>
${trees}
<path d="M0 330 Q110 300 220 326 T400 316 V420 H0Z" fill="url(#h2)"/>
<rect x="300" y="292" width="2" height="34" fill="#F4F4F4"/><path d="M302 292 l16 6 -16 6z" fill="#E4413A"/>
<rect x="0" y="380" width="${W}" height="480" fill="url(#g)"/>${stripes}
<ellipse cx="80" cy="760" rx="70" ry="20" fill="#E8D49A"/><ellipse cx="80" cy="756" rx="60" ry="14" fill="#F1DFA8"/>`;
  return wrap(defs, body);
}

function arena() {
  const r = rng(3);
  let crowd = '';
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < 16; i++) {
      const x = i * 27 + (row % 2) * 13 + r() * 6;
      const y = 700 + row * 40 + r() * 6;
      crowd += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(10 + row)}" fill="${row % 2 ? '#0B1022' : '#10172E'}"/><path d="M${f1(x - 18 - row)} ${f1(y + 32)} Q${f1(x)} ${f1(y + 4)} ${f1(x + 18 + row)} ${f1(y + 32)}Z" fill="${row % 2 ? '#0B1022' : '#10172E'}"/>`;
      if (r() < 0.08) crowd += `<rect x="${f1(x - 2)}" y="${f1(y - 34)}" width="4" height="18" rx="2" fill="#FFE7A8" opacity="0.7"/>`;
    }
  }
  let leds = '';
  for (let i = 0; i < 40; i++) leds += `<rect x="${i * 10 + 1}" y="652" width="8" height="5" rx="1.5" fill="${i % 4 === 0 ? '#FFB547' : '#3A4C8A'}" opacity="0.9"/>`;
  let truss = '';
  for (let i = 0; i < 20; i++) truss += `<path d="M${i * 20} 30 l10 14 l10 -14" stroke="#2A3352" stroke-width="2" fill="none"/>`;
  const spot = (x, c, rot) => `<path d="M${x - 8} 44 L${x + 8} 44 L${x + 150} 700 L${x - 150} 700 Z" fill="url(#${c})" transform="rotate(${rot} ${x} 44)" opacity="0.55"/><rect x="${x - 10}" y="34" width="20" height="16" rx="4" fill="#2A3352"/><circle cx="${x}" cy="48" r="6" fill="#FFF4D6"/>`;
  const defs = [
    lin('bg', [[0, '#0A0F24'], [0.6, '#121A3A'], [1, '#070A18']]),
    lin('sa', [[0, '#FFE2A0', 0.55], [1, '#FFE2A0', 0]]),
    lin('sb', [[0, '#9EC2FF', 0.45], [1, '#9EC2FF', 0]]),
    lin('stage', [[0, '#1C2550'], [1, '#0F1430']]),
    vignette(0.6),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect x="0" y="24" width="${W}" height="22" fill="#141B36"/>${truss}<rect x="0" y="24" width="${W}" height="3" fill="#2A3352"/><rect x="0" y="43" width="${W}" height="3" fill="#2A3352"/>
${spot(70, 'sa', -14)}${spot(200, 'sb', 0)}${spot(330, 'sa', 14)}
<rect x="0" y="640" width="${W}" height="30" fill="url(#stage)"/>${leds}
${crowd}`;
  return wrap(defs, body);
}

function harbor() {
  const r = rng(29);
  let stars = '';
  for (let i = 0; i < 60; i++) stars += `<circle cx="${f1(r() * W)}" cy="${f1(r() * 300)}" r="${f1(0.4 + r() * 1)}" fill="#FFFFFF" opacity="${f1(0.25 + r() * 0.6)}"/>`;
  let waves = '';
  for (let i = 0; i < 9; i++) {
    const y = 420 + i * 50;
    waves += `<path d="M0 ${y} ${Array.from({ length: 9 }, (_, k) => `Q${k * 50 + 25} ${y - 10 - i} ${k * 50 + 50} ${y}`).join(' ')} V${H} H0Z" fill="${i % 2 ? '#0D2A44' : '#0B2338'}" opacity="0.9"/>`;
    waves += `<path d="M${(i * 37) % 300} ${y - 3} q20 -6 40 0" stroke="#7FB2D9" stroke-width="1.5" fill="none" opacity="0.35"/>`;
  }
  const defs = [
    lin('sky', [[0, '#071224'], [0.7, '#123155'], [1, '#1E4A6E']]),
    rad('moon', [[0, '#FFF6D8', 0.6], [1, '#FFF6D8', 0]]),
    lin('beam', [[0, '#FFE9A8', 0.5], [1, '#FFE9A8', 0]], 0, 0, 1, 0),
    lin('path', [[0, '#FFF1C4', 0.35], [1, '#FFF1C4', 0]]),
    vignette(0.55),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#sky)"/>${stars}
<circle cx="300" cy="140" r="80" fill="url(#moon)"/><circle cx="300" cy="140" r="22" fill="#FFF3D2"/>
<path d="M286 400 L314 400 L340 860 L260 860 Z" fill="url(#path)"/>
<path d="M0 396 H${W} V420 H0Z" fill="#0F2D4A"/>
<path d="M230 392 l8 -14 h40 l10 14z" fill="#0A1626"/><rect x="250" y="362" width="3" height="18" fill="#0A1626"/><path d="M253 364 l14 8 -14 2z" fill="#0A1626"/>
<path d="M-10 420 Q30 360 80 380 L96 420Z" fill="#0A1522"/>
<rect x="40" y="250" width="22" height="134" fill="#E9E2D0"/><rect x="40" y="290" width="22" height="16" fill="#B23A3A"/><rect x="40" y="340" width="22" height="16" fill="#B23A3A"/><rect x="36" y="238" width="30" height="14" rx="3" fill="#2A2F3A"/><circle cx="51" cy="231" r="8" fill="#FFE9A8"/>
<path d="M51 231 L400 170 L400 260 Z" fill="url(#beam)"/>
${waves}`;
  return wrap(defs, body);
}

function zen() {
  let shoji = '';
  [[0, 130], [270, 130]].forEach(([x, w]) => {
    shoji += `<rect x="${x}" y="70" width="${w}" height="470" fill="#F4E7C8"/>`;
    for (let i = 1; i < 4; i++) shoji += `<rect x="${x + (w / 4) * i - 1.5}" y="70" width="3" height="470" fill="#5A3A22"/>`;
    for (let j = 1; j < 7; j++) shoji += `<rect x="${x}" y="${70 + j * 67}" width="${w}" height="3" fill="#5A3A22"/>`;
    shoji += `<rect x="${x}" y="70" width="${w}" height="470" fill="none" stroke="#3E2716" stroke-width="8"/>`;
  });
  let tatami = '';
  for (let i = 0; i < 4; i++) tatami += `<rect x="${i * 100}" y="600" width="100" height="260" fill="${i % 2 ? '#B8B27A' : '#AFA870'}" stroke="#3E3A20" stroke-width="5"/>`;
  let weave = '';
  for (let y = 606; y < 860; y += 7) weave += `<rect x="0" y="${y}" width="${W}" height="1" fill="#6E6A3E" opacity="0.18"/>`;
  const defs = [
    lin('wl', [[0, '#3A2618'], [1, '#2A1B10']]),
    rad('glow', [[0, '#FFD89A', 0.5], [1, '#FFD89A', 0]]),
    lin('scroll', [[0, '#EFE4CC'], [1, '#E2D3B2']]),
    vignette(0.55),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#wl)"/>
<rect x="0" y="0" width="${W}" height="70" fill="#24170D"/><rect x="0" y="60" width="${W}" height="12" fill="#5A3A22"/>
${shoji}
<rect x="160" y="96" width="80" height="210" fill="url(#scroll)"/><rect x="154" y="90" width="92" height="8" rx="4" fill="#3E2716"/><rect x="154" y="304" width="92" height="8" rx="4" fill="#3E2716"/>
<path d="M200 150 a34 34 0 1 1 -24 10" stroke="#1C1A18" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.85"/>
<rect x="196" y="270" width="8" height="8" fill="#B23A2A"/>
<circle cx="200" cy="40" r="120" fill="url(#glow)"/>
<g transform="translate(330 520)"><rect x="-38" y="24" width="76" height="10" rx="3" fill="#3E2716"/><path d="M-22 24 h44 l-6 -16 h-32z" fill="#5A4A3A"/><path d="M0 8 C-6 -10 8 -22 -2 -40" stroke="#4A3220" stroke-width="5" fill="none"/><ellipse cx="-14" cy="-38" rx="22" ry="11" fill="#3F6A3A"/><ellipse cx="12" cy="-50" rx="20" ry="10" fill="#4F7A44"/><ellipse cx="-4" cy="-60" rx="16" ry="8" fill="#5E8A50"/></g>
<g transform="translate(64 470)"><rect x="-2" y="-80" width="4" height="22" fill="#2A1A10"/><ellipse cx="0" cy="-30" rx="26" ry="36" fill="#F2D9A4"/><ellipse cx="0" cy="-30" rx="26" ry="36" fill="url(#glow)"/><path d="M-26 -30 h52 M-24 -46 h48 M-24 -14 h48" stroke="#C7A06A" stroke-width="1.5"/><rect x="-14" y="2" width="28" height="6" rx="2" fill="#2A1A10"/></g>
<rect x="0" y="540" width="${W}" height="60" fill="#3E2716"/><rect x="0" y="540" width="${W}" height="5" fill="#5A3A22"/>
${tatami}${weave}`;
  return wrap(defs, body);
}

function desk() {
  const r = rng(13);
  let chalk = '';
  chalk += `<path d="M60 120 v90 M90 120 v90 M30 150 h90 M30 180 h90" stroke="#E8EFE6" stroke-width="3" stroke-linecap="round" opacity="0.5"/>`;
  chalk += `<path d="M42 132 l12 12 M54 132 l-12 12 M100 160 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 M72 192 l12 12 M84 192 l-12 12" stroke="#E8EFE6" stroke-width="2.6" fill="none" opacity="0.5"/>`;
  chalk += `<text x="262" y="150" font-family="Georgia, serif" font-size="28" fill="#E8EFE6" opacity="0.45">a² + b²</text><path d="M262 170 q60 14 108 0" stroke="#E8EFE6" stroke-width="2" fill="none" opacity="0.4"/>`;
  for (let i = 0; i < 5; i++) chalk += `<circle cx="${f1(250 + i * 26)}" cy="216" r="3" fill="#E8EFE6" opacity="0.45"/>`;
  let smudge = '';
  for (let i = 0; i < 8; i++) smudge += `<ellipse cx="${f1(40 + r() * 320)}" cy="${f1(80 + r() * 200)}" rx="${f1(30 + r() * 40)}" ry="${f1(8 + r() * 10)}" fill="#FFFFFF" opacity="0.025"/>`;
  let lines = '';
  for (let y = 712; y < 860; y += 16) lines += `<path d="M90 ${y} L330 ${y + 8}" stroke="#9FB7D6" stroke-width="1" opacity="0.6"/>`;
  const defs = [
    lin('wl', [[0, '#3F4A3E'], [1, '#2F382F']]),
    lin('cb', [[0, '#24392F'], [1, '#1C2E25']]),
    lin('desk', [[0, '#9A6A3E'], [1, '#6E4826']]),
    lin('win', [[0, '#BFE0F0'], [1, '#EAF4F2']]),
    rad('lt', [[0, '#FFF2D0', 0.35], [1, '#FFF2D0', 0]]),
    vignette(0.5),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#wl)"/>
<rect x="16" y="56" width="368" height="250" rx="6" fill="#6E4826"/><rect x="26" y="66" width="348" height="230" rx="3" fill="url(#cb)"/>${smudge}${chalk}
<rect x="22" y="300" width="356" height="10" rx="3" fill="#7A5230"/><rect x="60" y="292" width="34" height="7" rx="2" fill="#F4F4F0"/><rect x="300" y="292" width="40" height="8" rx="2" fill="#E9C97A"/>
<rect x="300" y="360" width="84" height="180" rx="4" fill="#E6DCC6"/><rect x="306" y="366" width="72" height="168" fill="url(#win)"/><path d="M342 366 v168 M306 450 h72" stroke="#E6DCC6" stroke-width="5"/>
<circle cx="342" cy="420" r="180" fill="url(#lt)"/>
<rect x="0" y="640" width="${W}" height="220" fill="url(#desk)"/><rect x="0" y="640" width="${W}" height="6" fill="#B07D4E"/>
<path d="M0 670 h400 M0 720 h400 M0 790 h400" stroke="#5E3A1E" stroke-width="1" opacity="0.35"/>
<g transform="rotate(-4 210 780)"><rect x="80" y="690" width="260" height="190" rx="4" fill="#F7F4EC"/>${lines}<path d="M110 690 v190" stroke="#E5928F" stroke-width="1.5"/></g>
<g transform="rotate(28 60 700)"><rect x="20" y="694" width="120" height="10" rx="2" fill="#F2C14E"/><path d="M140 694 l14 5 -14 5z" fill="#E9D3A8"/><rect x="12" y="694" width="10" height="10" rx="2" fill="#E5928F"/></g>`;
  return wrap(defs, body);
}

function playroom() {
  let paper = '';
  for (let y = 20; y < 600; y += 46) for (let x = (y / 46) % 2 ? 22 : 0; x < W; x += 44) paper += `<circle cx="${x}" cy="${y}" r="3" fill="#FFFFFF" opacity="0.18"/>`;
  const block = (x, y, c, ch) => `<rect x="${x}" y="${y}" width="30" height="30" rx="4" fill="${c}"/><rect x="${x}" y="${y}" width="30" height="6" rx="3" fill="#FFFFFF" opacity="0.25"/><text x="${x + 15}" y="${y + 22}" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700" font-size="16" fill="#FFFFFF">${ch}</text>`;
  let rugRings = '';
  ['#F2B84B', '#E96E5A', '#5AAFA0', '#F7E3B0'].forEach((c, i) => { rugRings += `<ellipse cx="200" cy="790" rx="${210 - i * 44}" ry="${76 - i * 16}" fill="${c}"/>`; });
  const defs = [
    lin('wl', [[0, '#5D8FC2'], [1, '#4677AA']]),
    lin('fl', [[0, '#C99A62'], [1, '#A87A48']]),
    lin('win', [[0, '#9AD3F2'], [1, '#D9F1F8']]),
    vignette(0.45),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="url(#wl)"/>${paper}
<rect x="130" y="80" width="140" height="170" rx="6" fill="#F4EBDD"/><rect x="140" y="90" width="120" height="150" fill="url(#win)"/><path d="M200 90 v150 M140 165 h120" stroke="#F4EBDD" stroke-width="6"/><ellipse cx="174" cy="130" rx="20" ry="8" fill="#FFFFFF" opacity="0.9"/><ellipse cx="226" cy="200" rx="16" ry="6" fill="#FFFFFF" opacity="0.8"/>
<rect x="0" y="300" width="112" height="10" rx="3" fill="#8A5A34"/><rect x="288" y="300" width="112" height="10" rx="3" fill="#8A5A34"/>
${block(10, 270, '#E96E5A', 'A')}${block(44, 270, '#5AAFA0', 'B')}${block(27, 240, '#F2B84B', 'C')}
<circle cx="330" cy="281" r="19" fill="#E96E5A"/><path d="M311 281 h38 M330 262 q12 19 0 38" stroke="#FFFFFF" stroke-width="3" fill="none" opacity="0.8"/>
<rect x="358" y="262" width="26" height="38" rx="5" fill="#7C6BD6"/><circle cx="366" cy="276" r="3" fill="#FFFFFF"/><circle cx="376" cy="276" r="3" fill="#FFFFFF"/><rect x="368" y="254" width="6" height="8" fill="#7C6BD6"/>
<rect x="0" y="560" width="${W}" height="300" fill="url(#fl)"/><rect x="0" y="556" width="${W}" height="8" fill="#F4EBDD"/>
<path d="M0 620 h400 M0 700 h400 M0 800 h400" stroke="#8E6438" stroke-width="1.2" opacity="0.4"/>
${rugRings}`;
  return wrap(defs, body);
}

function den() {
  const r = rng(53);
  let planks = '';
  const pw = 50;
  for (let i = 0; i < 9; i++) {
    const x = i * pw - 12;
    let y = -((i * 137) % 300);
    while (y < H) {
      const len = 220 + Math.floor(r() * 260);
      planks += `<rect x="${x}" y="${f1(y)}" width="${pw}" height="${len}" fill="${['#7B4A27', '#734424', '#82502B', '#6C3F21'][Math.floor(r() * 4)]}"/>`;
      planks += `<rect x="${x}" y="${f1(y)}" width="${pw}" height="2" fill="#3A1F0E" opacity="0.7"/>`;
      let grain = '';
      for (let k = 0; k < 3; k++) { const gx = x + 8 + r() * (pw - 16); grain += `M${f1(gx)} ${f1(y + 6)} q${f1((r() - 0.5) * 7)} ${f1(len / 2)} 0 ${len - 12}`; }
      planks += `<path d="${grain}" stroke="#4A2812" stroke-width="0.8" fill="none" opacity="${f1(0.18 + r() * 0.12)}"/>`;
      y += len;
    }
    planks += `<rect x="${x + pw - 1.5}" y="0" width="1.5" height="${H}" fill="#2E170A" opacity="0.75"/>`;
  }
  const cx = 200;
  const cy = 470;
  let coil = '';
  const bands = [[318, '#B6874E'], [306, '#A8442E'], [296, '#B6874E'], [288, '#2F4A6E'], [281, '#C9A46A'], [262, '#E0B24A'], [254, '#C9A46A'], [214, '#A8442E'], [206, '#C9A46A'], [150, '#2F4A6E'], [143, '#C9A46A'], [70, '#E0B24A'], [62, '#A8442E'], [30, '#C9A46A']];
  bands.forEach(([rr, c]) => { coil += `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${c}"/>`; });
  coil += `<circle cx="${cx}" cy="${cy}" r="316" fill="url(#ring)"/>`;
  let stitch = '';
  for (let k = 0; k < 64; k++) {
    const a = (k / 64) * Math.PI * 2;
    const r0 = k % 2 ? 288 : 294;
    stitch += `M${f1(cx + Math.cos(a) * r0)} ${f1(cy + Math.sin(a) * r0)}L${f1(cx + Math.cos(a + 0.05) * 303)} ${f1(cy + Math.sin(a + 0.05) * 303)}`;
  }
  coil += `<path d="${stitch}" stroke="#E0B24A" stroke-width="3" stroke-linecap="round" opacity="0.85"/>`;
  let zig = '';
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    zig += `${k ? 'L' : 'M'}${f1(cx + Math.cos(a) * 214)} ${f1(cy + Math.sin(a) * 214)}L${f1(cx + Math.cos(a + Math.PI / 36) * 254)} ${f1(cy + Math.sin(a + Math.PI / 36) * 254)}`;
  }
  coil += `<path d="${zig}Z" stroke="#7A2E1E" stroke-width="2.2" fill="none" stroke-linejoin="round" opacity="0.7"/>`;
  const glass = (x, y) => `<circle cx="${x + 2}" cy="${y + 3}" r="12" fill="#000000" opacity="0.25"/><circle cx="${x}" cy="${y}" r="12" fill="#F4EBDD" opacity="0.5"/><circle cx="${x}" cy="${y}" r="9.5" fill="#B5651D"/><circle cx="${x}" cy="${y}" r="9.5" fill="url(#tea)"/><path d="M${x - 6} ${y - 5} a8 8 0 0 1 7 -3" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity="0.6"/>`;
  let leaves = '';
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * Math.PI * 2 + r() * 0.3;
    const len = 34 + r() * 16;
    leaves += `<path d="M0 0 C${f1(Math.cos(a - 0.35) * len * 0.6)} ${f1(Math.sin(a - 0.35) * len * 0.6)} ${f1(Math.cos(a) * len * 0.9)} ${f1(Math.sin(a) * len * 0.9)} ${f1(Math.cos(a) * len)} ${f1(Math.sin(a) * len)} C${f1(Math.cos(a + 0.35) * len * 0.6)} ${f1(Math.sin(a + 0.35) * len * 0.6)} 0 0 0 0Z" fill="${k % 3 ? '#4F7A3E' : '#3E6630'}"/><path d="M0 0 L${f1(Math.cos(a) * len * 0.92)} ${f1(Math.sin(a) * len * 0.92)}" stroke="#2C4A22" stroke-width="1" opacity="0.6"/>`;
  }
  const defs = [
    rad('sun', [[0, '#FFE6B0', 0.3], [1, '#FFE6B0', 0]], 0.5, 0.5, 0.5),
    rad('tea', [[0, '#E08A3A', 0.6], [1, '#7A3A10', 0]], 0.4, 0.35, 0.7),
    rad('brass', [[0, '#F4D48A'], [0.55, '#C8A15A'], [1, '#7A5A22']], 0.35, 0.3, 0.75),
    rad('matlt', [[0, '#FFF1D6', 0.18], [0.6, '#FFF1D6', 0.04], [1, '#000000', 0.18]], 0.5, 0.45, 0.6),
    lin('ray', [[0, '#FFF3D6', 0.16], [1, '#FFF3D6', 0]], 0, 0, 1, 1),
    `<radialGradient id="ring" gradientUnits="userSpaceOnUse" cx="200" cy="470" r="4.2" spreadMethod="repeat"><stop offset="0" stop-color="#3A2210" stop-opacity="0"/><stop offset="0.72" stop-color="#3A2210" stop-opacity="0"/><stop offset="0.86" stop-color="#3A2210" stop-opacity="0.22"/><stop offset="1" stop-color="#3A2210" stop-opacity="0"/></radialGradient>`,
    vignette(0.58),
  ].join('');
  const body = `
${planks}
<path d="M-40 -20 L90 -20 L330 860 L130 860 Z" fill="url(#ray)"/><path d="M120 -20 L180 -20 L420 860 L330 860 Z" fill="url(#ray)" opacity="0.7"/>
<circle cx="${cx + 4}" cy="${cy + 10}" r="320" fill="#000000" opacity="0.3"/>
${coil}
<circle cx="${cx}" cy="${cy}" r="318" fill="url(#matlt)"/>
<g transform="translate(342 176)"><circle cx="3" cy="5" r="36" fill="#000000" opacity="0.3"/><circle r="36" fill="url(#brass)"/><circle r="30" fill="none" stroke="#8A6A2E" stroke-width="1.6"/><circle r="36" fill="none" stroke="#5A3E12" stroke-width="1.2"/>${glass(-11, -7)}${glass(13, 9)}</g>
<g transform="translate(44 752)"><circle cx="2" cy="4" r="25" fill="#000000" opacity="0.3"/><circle r="25" fill="url(#brass)"/><circle r="19" fill="#F6F1E6"/><circle cx="-4" cy="-4" r="9" fill="#FFFFFF" opacity="0.8"/><circle r="25" fill="none" stroke="#5A3E12" stroke-width="1.2"/></g>
<g transform="translate(46 178)"><circle cx="3" cy="5" r="30" fill="#000000" opacity="0.3"/><circle r="30" fill="#B05A36"/><circle r="25" fill="#5A3A22"/>${leaves}</g>
<g transform="translate(354 754) rotate(-18)"><circle cx="3" cy="4" r="17" fill="#000000" opacity="0.3"/><circle r="17" fill="#F6F2EA"/><circle r="14" fill="none" stroke="#3C6FB8" stroke-width="2"/><circle r="9" fill="none" stroke="#D23B4A" stroke-width="1.6"/></g>
<circle cx="70" cy="140" r="260" fill="url(#sun)"/>`;
  return wrap(defs, body);
}

function parlor() {
  const pc = 26;
  const pd = 18;
  let tile = '';
  [-pd, 0, pd, pd * 2].forEach((o) => {
    tile += `<path d="M0 ${o} L${pc} ${o - pc} L${pc} ${o - pc + pd} L0 ${o + pd}Z" fill="#3B2416" stroke="#170C05" stroke-width="1"/>`;
    tile += `<path d="M${pc} ${o - pc} L${pc * 2} ${o} L${pc * 2} ${o + pd} L${pc} ${o - pc + pd}Z" fill="#33200F" stroke="#170C05" stroke-width="1"/>`;
  });
  const cx = 200;
  const cy = 470;
  let inlay = '';
  for (let k = 0; k < 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    inlay += `<circle cx="${f1(cx + Math.cos(a) * 214)}" cy="${f1(cy + Math.sin(a) * 304)}" r="1.4" fill="#E9C46A" opacity="0.55"/>`;
  }
  const defs = [
    rad('rim', [[0.82, '#7A4322'], [0.93, '#5A2E15'], [1, '#2E160A']], 0.5, 0.5, 0.5),
    rad('felt', [[0, '#2A7A64'], [0.55, '#1C5E4D'], [1, '#0E3A31']], 0.5, 0.42, 0.6),
    rad('lamp', [[0, '#FFE2A8', 0.24], [0.5, '#FFD08A', 0.08], [1, '#FFD08A', 0]], 0.5, 0.45, 0.55),
    rad('cup', [[0, '#7A4A2A'], [0.7, '#4A2814'], [1, '#2A160A']], 0.4, 0.35, 0.7),
    `<pattern id="pq" width="${pc * 2}" height="${pd}" patternUnits="userSpaceOnUse">${tile}</pattern>`,
    `<pattern id="nap" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="0.7" fill="#FFFFFF" opacity="0.05"/><circle cx="4.5" cy="4.2" r="0.6" fill="#000000" opacity="0.08"/></pattern>`,
    vignette(0.62),
  ].join('');
  const body = `
<rect width="${W}" height="${H}" fill="#2A170C"/><rect width="${W}" height="${H}" fill="url(#pq)"/>
<rect width="${W}" height="${H}" fill="#120804" opacity="0.28"/>
<ellipse cx="${cx + 6}" cy="${cy + 16}" rx="244" ry="334" fill="#000000" opacity="0.45"/>
<ellipse cx="${cx}" cy="${cy}" rx="240" ry="330" fill="url(#rim)"/>
<ellipse cx="${cx}" cy="${cy}" rx="237" ry="327" fill="none" stroke="#C88A55" stroke-width="1.2" opacity="0.5"/>
<ellipse cx="${cx}" cy="${cy}" rx="222" ry="312" fill="#0A2620"/>
<ellipse cx="${cx}" cy="${cy}" rx="220" ry="310" fill="url(#felt)"/>
<ellipse cx="${cx}" cy="${cy}" rx="220" ry="310" fill="url(#nap)"/>
${inlay}
<g transform="translate(74 236)"><ellipse cx="3" cy="5" rx="30" ry="30" fill="#000000" opacity="0.32"/><circle r="30" fill="#F2EEE6"/><circle r="30" fill="none" stroke="#C9C2B4" stroke-width="1"/><circle r="20" fill="#E9E3D8"/><circle r="15" fill="url(#cup)"/><path d="M-9 -8 a12 12 0 0 1 9 -4" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity="0.5"/><path d="M20 -4 q10 0 10 9 q0 9 -10 9" stroke="#F2EEE6" stroke-width="4.5" fill="none"/></g>
<g transform="translate(318 640) rotate(14)"><rect x="-30" y="-40" width="64" height="86" rx="3" fill="#000000" opacity="0.3" transform="translate(3 4)"/><rect x="-30" y="-40" width="64" height="86" rx="3" fill="#F7F2E4"/>${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M-22 ${-24 + k * 12} H26" stroke="#9FB7D6" stroke-width="1" opacity="0.8"/>`).join('')}<path d="M-6 -36 V42" stroke="#E5928F" stroke-width="1"/><path d="M-18 -16 l3 -6 l3 6 M0 -16 h8 M-18 -4 h6 M0 -4 h4 M12 -4 h6" stroke="#2A3340" stroke-width="1.3" fill="none" opacity="0.7"/><rect x="-36" y="-40" width="6" height="86" rx="2" fill="#B23A3A"/><g transform="translate(40 10) rotate(-70)"><rect x="-3" y="-34" width="6" height="58" rx="1.5" fill="#F2C14E"/><path d="M-3 24 L0 32 L3 24 Z" fill="#E9D3A8"/><rect x="-3" y="-38" width="6" height="6" rx="1.5" fill="#E5928F"/></g></g>
<g transform="translate(330 242) rotate(12)"><rect x="-26" y="-36" width="52" height="72" rx="5" fill="#000000" opacity="0.3" transform="translate(3 4)"/><rect x="-26" y="-36" width="52" height="72" rx="5" fill="#2B2350"/><rect x="-21" y="-31" width="42" height="62" rx="3" fill="none" stroke="#E9C46A" stroke-width="1.4" opacity="0.8"/><circle r="11" fill="none" stroke="#E9C46A" stroke-width="1.4" opacity="0.8"/><path d="M-5 -6 L4 -6 L-4 6 L5 6" stroke="#E9C46A" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity="0.9"/></g>
<ellipse cx="${cx}" cy="${cy - 20}" rx="300" ry="380" fill="url(#lamp)"/>`;
  return wrap(defs, body);
}

const BUILD = { lounge, study, terrace, course, arena, harbor, zen, desk, playroom, den, parlor };

export const SCENE_OF = {
  pool: 'lounge', chess: 'study', ckr: 'terrace', golf: 'course', crm: 'den', zap: 'parlor',
  tug: 'arena', qrace: 'arena', rrace: 'arena',
  ship: 'harbor', reversi: 'zen', gomoku: 'zen',
  ttt: 'desk', dots: 'desk', hang: 'desk', wduel: 'desk', qduel: 'desk', math: 'desk', sdk: 'desk', xw: 'desk', num: 'desk',
  c4: 'playroom', rps: 'playroom', jig: 'playroom', pairs: 'playroom', fade: 'desk', paint: 'playroom', bomb: 'playroom', gem: 'playroom', rduel: 'arena', taps: 'arena',
};

export const SCENE_MUSIC = { lounge: 'lounge', study: 'study', terrace: 'terrace', course: 'garden', arena: 'arcade', harbor: 'tide', zen: 'zen', desk: 'study', playroom: 'garden', den: 'den', parlor: 'parlor' };

export const SCENE_TONE = {
  lounge: { accent: '#E9C46A', glass: 'rgba(6,14,14,0.58)', ring: '#7DDBA0' },
  study: { accent: '#E8C27A', glass: 'rgba(18,10,6,0.6)', ring: '#9BE3A8' },
  terrace: { accent: '#2E7D7A', ink: '#FFFFFF', glass: 'rgba(40,24,14,0.55)', ring: '#9BE3A8' },
  course: { accent: '#FFFFFF', glass: 'rgba(14,40,22,0.55)', ring: '#FDE68A' },
  arena: { accent: '#FFB547', glass: 'rgba(8,10,28,0.6)', ring: '#7DD3FC' },
  harbor: { accent: '#FFE9A8', glass: 'rgba(4,14,26,0.6)', ring: '#7DD3FC' },
  zen: { accent: '#E9C46A', glass: 'rgba(24,14,8,0.58)', ring: '#9BE3A8' },
  desk: { accent: '#F2C14E', glass: 'rgba(16,24,18,0.58)', ring: '#9BE3A8' },
  playroom: { accent: '#F2B84B', glass: 'rgba(14,26,48,0.55)', ring: '#FDE68A' },
  den: { accent: '#F2B35A', glass: 'rgba(34,18,8,0.58)', ring: '#9BE3A8' },
  parlor: { accent: '#E9C46A', glass: 'rgba(8,22,18,0.6)', ring: '#9BE3A8' },
};

const cache = new Map();
export function sceneKeyFor(k) { return BUILD[k] ? k : (SCENE_OF[k] || 'lounge'); }
export function sceneUrl(k) {
  const key = sceneKeyFor(k);
  if (cache.has(key)) return cache.get(key);
  let url = '';
  try { url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(BUILD[key]())}`; } catch { url = ''; }
  cache.set(key, url);
  return url;
}
const warm = new Set();
export function preloadScene(k) {
  const key = sceneKeyFor(k);
  if (warm.has(key) || typeof Image === 'undefined') return;
  warm.add(key);
  try { const im = new Image(); im.decoding = 'async'; im.src = sceneUrl(key); if (im.decode) im.decode().catch(() => {}); } catch {}
}
export function sceneTone(k) { return SCENE_TONE[sceneKeyFor(k)] || SCENE_TONE.lounge; }
export function sceneMusic(k) { return SCENE_MUSIC[sceneKeyFor(k)] || 'lounge'; }
