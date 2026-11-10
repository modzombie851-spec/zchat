const INK = '#3A220E';
const TEAR = '#55C2F7';

function skin(id, a, b, c) {
  return `<radialGradient id="s${id}" cx="40%" cy="30%" r="78%"><stop offset="0" stop-color="${a}"/><stop offset="0.62" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
}
function base(id, tone, extraDefs) {
  const t = tone || ['#FFE98A', '#FFC93A', '#EE9A1A'];
  return `<defs>${skin(id, t[0], t[1], t[2])}${extraDefs || ''}</defs>`
    + '<circle cx="60" cy="63" r="54" fill="rgba(40,20,0,0.22)"/>'
    + '<circle cx="60" cy="60" r="54" fill="#FFFFFF"/>'
    + `<circle cx="60" cy="60" r="47" fill="url(#s${id})"/>`
    + '<circle cx="60" cy="60" r="46.5" fill="none" stroke="rgba(150,70,0,0.28)" stroke-width="1.6"/>'
    + '<ellipse cx="42" cy="31" rx="17" ry="8.5" fill="#FFFFFF" opacity="0.38" transform="rotate(-24 42 31)"/>';
}
const cheeks = (o = 0.32) => `<ellipse cx="31" cy="72" rx="9" ry="5.5" fill="#FF6F61" opacity="${o}"/><ellipse cx="89" cy="72" rx="9" ry="5.5" fill="#FF6F61" opacity="${o}"/>`;
const dotEye = (x, y, r = 6) => `<ellipse cx="${x}" cy="${y}" rx="${r * 0.82}" ry="${r}" fill="${INK}"/><circle cx="${x + r * 0.28}" cy="${y - r * 0.38}" r="${r * 0.3}" fill="#FFFFFF" opacity="0.9"/>`;
const happyEye = (x, y) => `<path d="M${x - 9} ${y + 3} Q${x} ${y - 9} ${x + 9} ${y + 3}" fill="none" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/>`;
const shutEye = (x, y) => `<path d="M${x - 9} ${y - 2} Q${x} ${y + 7} ${x + 9} ${y - 2}" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>`;
const brow = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>`;

const FACES = [
  ['lol', 'Laughing', (id) => base(id)
    + `<path d="M24 46 Q34 38 44 47" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M76 47 Q86 38 96 46" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M30 64 Q60 66 90 64 Q86 98 60 99 Q34 98 30 64 Z" fill="${INK}"/><path d="M36 66 Q60 69 84 66 L83 72 Q60 75 37 72 Z" fill="#FFFFFF"/><path d="M44 90 Q60 80 76 90 Q68 97 60 97 Q52 97 44 90 Z" fill="#FF6D7E"/>`
    + `<path d="M17 52 Q10 66 18 72 Q26 70 24 58 Z" fill="${TEAR}"/><path d="M103 52 Q110 66 102 72 Q94 70 96 58 Z" fill="${TEAR}"/>`],
  ['grin', 'Grin', (id) => base(id) + happyEye(41, 48) + happyEye(79, 48) + cheeks()
    + `<path d="M31 64 Q60 70 89 64 Q85 92 60 93 Q35 92 31 64 Z" fill="${INK}"/><path d="M35 66 Q60 71 85 66 L84 74 Q60 79 36 74 Z" fill="#FFFFFF"/><path d="M42 86 Q60 92 78 86 Q72 92 60 92 Q48 92 42 86 Z" fill="#FFFFFF"/>`],
  ['wink', 'Wink', (id) => base(id) + dotEye(42, 46, 6.4) + happyEye(79, 48) + cheeks()
    + `<path d="M36 70 Q60 92 84 70" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M62 80 Q74 79 76 88 Q75 98 66 98 Q58 96 60 86 Z" fill="#FF6D7E" stroke="${INK}" stroke-width="3"/><path d="M67 84 L68 93" stroke="#D84A5E" stroke-width="2" stroke-linecap="round"/>`],
  ['cool', 'Cool', (id) => base(id)
    + `<path d="M18 42 L102 42 L100 48 L94 48 Q92 64 76 64 Q63 63 62 50 L58 50 Q57 63 44 64 Q28 64 26 48 L20 48 Z" fill="#1E1A24"/><path d="M30 48 Q34 44 42 46" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.55"/><path d="M68 48 Q72 44 80 46" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.55"/>`
    + `<path d="M42 80 Q62 92 82 74" fill="none" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/>`],
  ['love', 'Love', (id) => base(id)
    + '<path d="M41 58 C28 49 26 37 34 34 C38 32 41 35 41 38 C41 35 44 32 48 34 C56 37 54 49 41 58 Z" fill="#F23D5A" stroke="#B5142F" stroke-width="2"/><path d="M79 58 C66 49 64 37 72 34 C76 32 79 35 79 38 C79 35 82 32 86 34 C94 37 92 49 79 58 Z" fill="#F23D5A" stroke="#B5142F" stroke-width="2"/>'
    + '<ellipse cx="34" cy="38" rx="3" ry="2" fill="#FFFFFF" opacity="0.8"/><ellipse cx="72" cy="38" rx="3" ry="2" fill="#FFFFFF" opacity="0.8"/>'
    + cheeks(0.4) + `<path d="M38 72 Q60 96 82 72 Q60 80 38 72 Z" fill="${INK}"/><path d="M48 84 Q60 78 72 84 Q66 89 60 89 Q54 89 48 84 Z" fill="#FF6D7E"/>`],
  ['wow', 'Wow', (id) => base(id) + brow(30, 30, 46, 27) + brow(74, 27, 90, 30)
    + '<ellipse cx="42" cy="47" rx="9" ry="11" fill="#FFFFFF"/><ellipse cx="78" cy="47" rx="9" ry="11" fill="#FFFFFF"/>' + dotEye(43, 48, 5.4) + dotEye(77, 48, 5.4)
    + `<ellipse cx="60" cy="82" rx="11" ry="14" fill="${INK}"/><ellipse cx="60" cy="88" rx="6.5" ry="5" fill="#FF6D7E"/>`],
  ['smug', 'Smug', (id) => base(id) + brow(30, 34, 48, 37) + brow(72, 33, 90, 28)
    + `<path d="M32 48 L52 48" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M33 48 Q42 56 51 48" fill="${INK}"/><path d="M70 48 L90 48" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M71 48 Q80 56 89 48" fill="${INK}"/>`
    + `<path d="M44 80 Q66 84 84 70" fill="none" stroke="${INK}" stroke-width="5.2" stroke-linecap="round"/>` + cheeks(0.22)],
  ['think', 'Thinking', (id) => base(id) + brow(30, 36, 48, 33) + `<path d="M72 28 Q82 22 92 28" fill="none" stroke="${INK}" stroke-width="4.6" stroke-linecap="round"/>`
    + dotEye(41, 47, 6) + dotEye(80, 44, 6.4)
    + `<path d="M48 82 Q58 78 70 80" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    + '<path d="M60 112 Q50 100 54 92 Q57 86 64 88 L76 92 Q82 95 78 99 Q86 100 84 106 Q80 113 70 112 Z" fill="#FFC93A" stroke="#C97810" stroke-width="2.4" stroke-linejoin="round"/><path d="M64 88 Q66 80 72 82 Q74 86 70 92" fill="#FFD866" stroke="#C97810" stroke-width="2.4" stroke-linejoin="round"/>'],
  ['cry', 'Crying', (id) => base(id) + brow(30, 37, 46, 32) + brow(74, 32, 90, 37) + shutEye(40, 48) + shutEye(80, 48)
    + `<path d="M34 54 Q30 80 36 102 L46 102 Q44 80 46 56 Z" fill="${TEAR}" opacity="0.92"/><path d="M86 54 Q90 80 84 102 L74 102 Q76 80 74 56 Z" fill="${TEAR}" opacity="0.92"/>`
    + `<path d="M44 90 Q60 70 76 90 Q60 84 44 90 Z" fill="${INK}"/>`],
  ['angry', 'Angry', (id) => base(id, ['#FFB08A', '#FF6A47', '#D3311E'])
    + brow(28, 34, 50, 44) + brow(70, 44, 92, 34) + dotEye(42, 52, 5.6) + dotEye(78, 52, 5.6)
    + `<path d="M36 88 Q60 70 84 88 L80 92 Q60 80 40 92 Z" fill="${INK}"/><path d="M42 89 Q60 79 78 89 L77 91 Q60 82 43 91 Z" fill="#FFFFFF" opacity="0.9"/>`],
  ['phew', 'Phew', (id) => base(id) + happyEye(41, 50) + happyEye(79, 50) + cheeks(0.28)
    + `<path d="M38 74 Q60 90 82 74" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M96 20 Q106 34 102 42 Q96 48 90 42 Q86 34 96 20 Z" fill="${TEAR}" stroke="#2A8FC7" stroke-width="2"/><ellipse cx="95" cy="38" rx="2.4" ry="3.4" fill="#FFFFFF" opacity="0.75"/>`],
  ['sleep', 'Sleepy', (id) => base(id) + `<path d="M31 50 Q41 56 51 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M69 50 Q79 56 89 50" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    + `<ellipse cx="62" cy="82" rx="7" ry="8" fill="${INK}"/>` + cheeks(0.2)
    + '<path d="M86 12 L100 12 L86 26 L100 26" fill="none" stroke="#5B6CFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M102 30 L110 30 L102 38 L110 38" fill="none" stroke="#5B6CFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'],
  ['dizzy', 'Dizzy', (id) => base(id)
    + `<path d="M33 40 L49 56 M49 40 L33 56" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M71 40 L87 56 M87 40 L71 56" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M38 80 Q46 72 54 80 Q62 88 70 80 Q78 72 84 80" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M62 82 Q72 82 72 92 Q70 100 63 98 Q57 94 60 86 Z" fill="#FF6D7E" stroke="${INK}" stroke-width="2.6"/>`],
  ['scared', 'Scared', (id) => base(id, ['#FFE98A', '#FFC93A', '#EE9A1A'], `<linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5D7BFF" stop-opacity="0.85"/><stop offset="0.55" stop-color="#5D7BFF" stop-opacity="0"/></linearGradient>`)
    + `<circle cx="60" cy="60" r="47" fill="url(#b${id})"/>` + brow(30, 32, 46, 28) + brow(74, 28, 90, 32)
    + '<ellipse cx="42" cy="49" rx="10" ry="12" fill="#FFFFFF"/><ellipse cx="78" cy="49" rx="10" ry="12" fill="#FFFFFF"/>' + `<circle cx="42" cy="50" r="3.6" fill="${INK}"/><circle cx="78" cy="50" r="3.6" fill="${INK}"/>`
    + `<rect x="40" y="76" width="40" height="18" rx="9" fill="${INK}"/><path d="M44 81 L76 81 M44 89 L76 89" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M50 78 L50 92 M60 78 L60 92 M70 78 L70 92" stroke="#FFFFFF" stroke-width="2.4"/>`],
  ['devil', 'Devil', (id) => '<path d="M26 32 Q14 18 18 4 Q28 18 42 22 Z" fill="#7B3FE0" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/><path d="M94 32 Q106 18 102 4 Q92 18 78 22 Z" fill="#7B3FE0" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>'
    + base(id, ['#C9A6FF', '#9461F5', '#5E2CC4'])
    + brow(30, 36, 50, 44) + brow(70, 44, 90, 36) + dotEye(42, 52, 5.2) + dotEye(78, 52, 5.2)
    + `<path d="M34 72 Q60 98 86 72 Q60 84 34 72 Z" fill="${INK}"/><path d="M40 74 L46 80 L52 76 L58 81 L64 76 L70 81 L76 76 L80 75" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round"/>`],
  ['party', 'Party', (id) => base(id) + happyEye(41, 52) + happyEye(79, 52) + cheeks(0.34)
    + '<path d="M44 20 L66 -2 L80 26 Z" fill="#2FB7A0" stroke="#FFFFFF" stroke-width="3.4" stroke-linejoin="round"/><path d="M52 16 L70 7 M57 21 L75 14" stroke="#FFD43B" stroke-width="4" stroke-linecap="round"/><circle cx="66" cy="-1" r="5" fill="#FF5C8A" stroke="#FFFFFF" stroke-width="2"/>'
    + '<path d="M58 78 L96 70 L100 86 L60 86 Z" fill="#FF5C8A" stroke="#C02560" stroke-width="2.4" stroke-linejoin="round"/><path d="M70 76 L72 85 M82 73 L85 85" stroke="#FFD43B" stroke-width="3" stroke-linecap="round"/><path d="M98 78 L108 72 M99 82 L110 84" stroke="#2FB7A0" stroke-width="3" stroke-linecap="round"/>'
    + `<ellipse cx="54" cy="82" rx="7" ry="6" fill="${INK}"/>`],
];

function svgFor(key, draw) {
  const inner = draw(key);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -10 132 132" width="132" height="132">${inner}</svg>`;
}

let faceList = null;
export function gameFaces() {
  if (faceList) return faceList;
  faceList = FACES.map(([k, label, draw]) => ({ key: `fc-${k}`, label, face: true, file: `data:image/svg+xml;utf8,${encodeURIComponent(svgFor(k, draw))}` }));
  return faceList;
}
export function withFaces(list) {
  const faces = gameFaces();
  const seen = new Set(faces.map((f) => f.key));
  return faces.concat((list || []).filter((s) => s && !seen.has(s.key)));
}
