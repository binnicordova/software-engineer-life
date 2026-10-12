/* Software Engineer LIFE — rendering. Vector webcam scenes (SVG strings) + the Photo Booth share card (canvas).
 * Everything is drawn in code so the game ships with zero image assets; Gemini plates can replace layers later.
 * Slots keep the composition clean:
 *   L-top window · L-bottom stickies|mugs|pills|bills|camotero · R-top clock · R-mid frame|frameempty|calendar|chatai|drill|helmet · R-low shelf|plant|crib|kid|boxes|door
 */
(function (root) {
'use strict';
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));

const THEMES = {
  parents:    { wall: '#E4C7A1', wall2: '#CDA77B', accent: '#C8553D', glow: '#BFE3FF' },
  quarantine: { wall: '#A9B7AF', wall2: '#8A9B92', accent: '#6F8F86', glow: '#C9E4FF' },
  apartment:  { wall: '#EDE6DA', wall2: '#D6CBB8', accent: '#7FA08F', glow: '#CFE8FF' },
  slate:      { wall: '#5A6783', wall2: '#3F4B66', accent: '#8FA3C7', glow: '#A9C9FF' },
  rose:       { wall: '#D2A09D', wall2: '#B8878A', accent: '#9C5F66', glow: '#D6E6FF' },
  violet:     { wall: '#4A3B7A', wall2: '#2E2457', accent: '#B388FF', glow: '#C7B2FF' },
  sunrise:    { wall: '#F3C98B', wall2: '#E9A66D', accent: '#E26D5A', glow: '#FFF0D6' }
};
const SKY = { day: '#BFE3F5', dusk: '#F2A97E', night: '#16203F', dawn: '#FFD29A', gray: '#B9C4C9' };
const EX = {
  neutral:  { o: 0,  i: 0,  y: 0,  eye: 1,    mouth: 'M181 346 Q195 349 209 346' },
  happy:    { o: -2, i: -3, y: -1, eye: 0.95, mouth: 'M177 340 Q195 364 213 340 Q195 351 177 340Z', teeth: 1, blush: 1 },
  tired:    { o: 4,  i: -3, y: 2,  eye: 0.5,  mouth: 'M182 351 Q195 345 208 351', bags: 1 },
  stressed: { o: 2,  i: -8, y: 0,  eye: 1.12, mouth: 'grit', sweat: 1 },
  shock:    { o: -3, i: -3, y: -8, eye: 1.32, mouth: 'oh' },
  sick:     { o: 4,  i: -3, y: 2,  eye: 0.6,  mouth: 'wave', green: 1, bags: 1 },
  relief:   { o: -1, i: -2, y: 0,  eye: 0,    mouth: 'M181 342 Q195 357 209 342', closed: 1, blush: 1 }
};

/* ---------- the engineer (head & shoulders, centred on x=195) ---------- */
function engineer(o) {
  const { g = 'f', expr = 'neutral', fatigue = 0, glasses = false } = o;
  const x = EX[expr] || EX.neutral, hair = '#1F1A26', skin = '#D3996F', shade = '#B97F57';
  const hood = g === 'f' ? '#E9B44C' : '#2F7F79', hoodS = g === 'f' ? '#C9942F' : '#23635E';
  const eyeOpen = Math.max(0.14, x.eye * (1 - fatigue * 0.38));
  const ry = 9 * eyeOpen, pr = Math.min(4.8, ry * 0.95);
  const bagOp = clamp(fatigue * 0.95 + (x.bags ? 0.38 : 0), 0, 1);
  const by = 284 + x.y;
  const brow = `<path d="M155 ${by + x.o} L187 ${by + x.i}"/><path d="M203 ${by + x.i} L235 ${by + x.o}"/>`;
  const eyes = x.closed
    ? '<path d="M162 304 Q172 312 182 304" fill="none" stroke="#2B1D1A" stroke-width="3" stroke-linecap="round"/><path d="M208 304 Q218 312 228 304" fill="none" stroke="#2B1D1A" stroke-width="3" stroke-linecap="round"/>'
    : `<g class="eyes"><ellipse cx="172" cy="304" rx="9.5" ry="${ry}" fill="#fff"/><ellipse cx="218" cy="304" rx="9.5" ry="${ry}" fill="#fff"/>
       <ellipse cx="172" cy="305" rx="4.8" ry="${pr}" fill="#2B1D1A"/><ellipse cx="218" cy="305" rx="4.8" ry="${pr}" fill="#2B1D1A"/>
       <circle cx="173.8" cy="${304 - pr * 0.35}" r="1.5" fill="#fff"/><circle cx="219.8" cy="${304 - pr * 0.35}" r="1.5" fill="#fff"/></g>`;
  let mouth;
  if (x.mouth === 'grit') mouth = '<rect x="181" y="343" width="28" height="12" rx="4" fill="#fff" stroke="#4A2A22" stroke-width="2.6"/><path d="M188 343v12M195 343v12M202 343v12" stroke="#4A2A22" stroke-width="1.6"/>';
  else if (x.mouth === 'oh') mouth = '<ellipse cx="195" cy="349" rx="8" ry="11" fill="#4A2A22"/>';
  else if (x.mouth === 'wave') mouth = '<path d="M178 349 q6 -7 12 0 t12 0 t12 0" fill="none" stroke="#4A2A22" stroke-width="3" stroke-linecap="round"/>';
  else mouth = `<path d="${x.mouth}" fill="${x.teeth ? '#fff' : 'none'}" stroke="#4A2A22" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  const backHair = g === 'f' ? `<path d="M122 306 C108 218 156 198 195 198 C234 198 282 218 268 306 L286 424 C252 446 138 446 104 424Z" fill="${hair}"/>` : '';
  const frontHair = g === 'f'
    ? `<path d="M129 292 C127 236 160 217 195 217 C230 217 263 236 261 292 C246 262 224 250 200 248 C170 250 146 262 129 292Z" fill="${hair}"/>`
    : `<path d="M128 292 C122 224 160 204 195 204 C232 204 268 224 262 292 C256 266 240 250 216 245 C198 256 166 252 150 262 C140 268 134 278 128 292Z" fill="${hair}"/>`;
  const strands = g === 'f'
    ? `<path d="M132 298 C122 340 122 386 114 426 C130 434 146 428 154 418 C150 380 150 340 152 302Z" fill="${hair}"/><path d="M258 298 C268 340 268 386 276 426 C260 434 244 428 236 418 C240 380 240 340 238 302Z" fill="${hair}"/>` : '';
  const gl = glasses
    ? '<g fill="rgba(170,215,255,.14)" stroke="#1B1B22" stroke-width="3"><rect x="151" y="288" width="42" height="31" rx="13"/><rect x="197" y="288" width="42" height="31" rx="13"/><path d="M193 301h4M151 300l-16-3M239 300l16-3" fill="none" stroke-linecap="round"/></g>' : '';
  return `<g class="breathe">${backHair}
    <path d="M52 520 C52 440 104 404 195 404 C286 404 338 440 338 520Z" fill="${hood}"/>
    <path d="M118 424 C130 394 160 382 195 382 C230 382 260 394 272 424 C250 410 228 406 195 406 C162 406 140 410 118 424Z" fill="${hoodS}"/>
    <path d="M173 350 h44 v54 q-22 16 -44 0z" fill="${shade}"/>
    <path d="M180 410 v34 M210 410 v34" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>
    ${strands}
    <circle cx="131" cy="307" r="12" fill="${skin}"/><circle cx="259" cy="307" r="12" fill="${skin}"/>
    <rect x="127.5" y="314" width="7" height="17" rx="3.5" fill="#F5F5F7"/><rect x="255.5" y="314" width="7" height="17" rx="3.5" fill="#F5F5F7"/>
    <ellipse cx="195" cy="300" rx="64" ry="75" fill="${skin}"/>
    ${x.green ? '<ellipse cx="195" cy="300" rx="64" ry="75" fill="#7BC96F" opacity=".26"/>' : ''}
    ${frontHair}
    ${x.blush ? '<ellipse cx="158" cy="330" rx="11" ry="6" fill="#E8735F" opacity=".35"/><ellipse cx="232" cy="330" rx="11" ry="6" fill="#E8735F" opacity=".35"/>' : ''}
    <g fill="none" stroke="#9A5E47" stroke-width="2.6" stroke-linecap="round" opacity="${bagOp}"><path d="M160 317 Q172 325 184 317"/><path d="M206 317 Q218 325 230 317"/></g>
    ${eyes}
    <g stroke="#2B1D1A" stroke-width="5" stroke-linecap="round" fill="none">${brow}</g>
    <path d="M195 309 q-5 16 -1 21 q5 2 9 -1" fill="none" stroke="#A66B49" stroke-width="2.4" stroke-linecap="round"/>
    ${mouth}${gl}
    ${x.sweat ? '<path d="M262 250 q9 15 0 24 q-9 -9 0 -24z" fill="#8ED8FF"/><circle cx="260" cy="266" r="2" fill="#fff" opacity=".8"/>' : ''}
  </g>`;
}

/* ---------- room props ---------- */
function clockHands(time, cx, cy) {
  const [h, m] = time.split(':').map(Number);
  const ah = ((h % 12) + m / 60) * 30 * Math.PI / 180, am = m * 6 * Math.PI / 180;
  const pt = (a, l) => `${(cx + l * Math.sin(a)).toFixed(1)} ${(cy - l * Math.cos(a)).toFixed(1)}`;
  return `<path d="M${cx} ${cy} L${pt(ah, 10)}" stroke="#2a2a33" stroke-width="3" stroke-linecap="round"/><path d="M${cx} ${cy} L${pt(am, 15)}" stroke="#2a2a33" stroke-width="2" stroke-linecap="round"/>`;
}
const bubble = (x, y, w, text, color, size = 15, tail = 'down') =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="34" rx="15" fill="#fff"/>${tail === 'down' ? `<path d="M${w - 30} 34 l-8 13 l-4 -13z" fill="#fff"/>` : ''}<text x="${w / 2}" y="23" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="900" font-size="${size}" fill="${color}">${text}</text></g>`;

function windowSvg(T, o, u, has) {
  const sky = SKY[o.sky] || SKY.day, night = o.sky === 'night', dawn = o.sky === 'dawn';
  let s = `<g transform="translate(0 94)"><clipPath id="${u}cw"><rect x="32" y="90" width="100" height="120" rx="3"/></clipPath>
    <rect x="24" y="82" width="116" height="136" rx="8" fill="#F6F1E7"/>
    <g clip-path="url(#${u}cw)"><rect x="32" y="90" width="100" height="120" fill="${sky}"/>
      ${night ? '<circle cx="106" cy="118" r="9" fill="#F5F0D0"/><circle cx="58" cy="108" r="1.6" fill="#fff"/><circle cx="84" cy="146" r="1.2" fill="#fff"/><circle cx="46" cy="164" r="1.4" fill="#fff"/>' : ''}
      ${o.sky === 'day' ? '<circle cx="104" cy="120" r="15" fill="#FFF3C4" opacity=".95"/><ellipse cx="60" cy="146" rx="26" ry="8" fill="#fff" opacity=".85"/>' : ''}
      ${dawn ? '<circle cx="86" cy="178" r="34" fill="#FFF0C2"/><rect x="32" y="150" width="100" height="60" fill="#FFB27A" opacity=".35"/>' : ''}
      ${o.sky === 'dusk' ? '<circle cx="92" cy="170" r="22" fill="#FFD9A0" opacity=".9"/>' : ''}
      <g fill="${night ? '#0B1128' : 'rgba(40,40,60,.22)'}"><rect x="32" y="176" width="22" height="34"/><rect x="56" y="162" width="18" height="48"/><rect x="76" y="182" width="26" height="28"/><rect x="104" y="168" width="28" height="42"/></g>
      ${night ? '<g fill="#FFD479"><rect x="60" y="170" width="3" height="3"/><rect x="66" y="180" width="3" height="3"/><rect x="110" y="178" width="3" height="3"/><rect x="118" y="190" width="3" height="3"/><rect x="38" y="190" width="3" height="3"/></g>' : ''}
      ${has('camotero') ? '<g><rect x="86" y="192" width="30" height="13" rx="3" fill="#2a2a33"/><circle cx="92" cy="206" r="4" fill="#2a2a33"/><circle cx="110" cy="206" r="4" fill="#2a2a33"/><rect x="104" y="176" width="5" height="16" fill="#2a2a33"/><g fill="#fff" opacity=".85"><circle class="steam" cx="107" cy="170" r="5"/><circle class="steam" cx="112" cy="160" r="4" style="animation-delay:.8s"/></g></g>' : ''}
    </g>
    <rect x="80" y="90" width="4" height="120" fill="#F6F1E7"/><rect x="32" y="146" width="100" height="4" fill="#F6F1E7"/>`;
  if (has('curtain')) s += `<path d="M14 76 Q40 90 40 150 Q40 200 22 232 L10 232 Z" fill="${T.accent}" opacity=".92"/><path d="M150 76 Q124 90 124 150 Q124 200 142 232 L154 232 Z" fill="${T.accent}" opacity=".92"/>`;
  return s + '</g>';
}

function props(list, T, o, u) {
  const has = k => list.includes(k); let s = '';
  if (has('window')) s += windowSvg(T, o, u, has);
  if (has('clock')) s += `<circle cx="334" cy="242" r="18" fill="#F8F5EE" stroke="#2a2a33" stroke-width="3"/>${clockHands(o.time || '09:00', 334, 242)}<circle cx="334" cy="242" r="2.4" fill="#2a2a33"/>`;
  if (has('frame')) s += `<g transform="translate(100 168)"><rect x="178" y="96" width="60" height="74" rx="4" fill="#fff"/><rect x="184" y="102" width="48" height="62" fill="#E7D5B6"/><circle cx="208" cy="124" r="9" fill="#F2A65A"/><path d="M184 164 L200 138 L212 154 L222 142 L232 164Z" fill="${T.accent}"/></g>`;
  if (has('frameempty')) s += `<g transform="translate(100 168)"><rect x="178" y="96" width="60" height="74" rx="4" fill="#fff"/><rect x="184" y="102" width="48" height="62" fill="#EDE6DA"/><rect x="190" y="110" width="36" height="46" rx="2" fill="none" stroke="#D2C7B6" stroke-width="2" stroke-dasharray="4 4"/><path d="M178 102 L192 118 L186 130 L204 146 L196 158 L212 170" fill="none" stroke="#9aa3ad" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/></g>`;
  if (has('calendar')) s += `<g transform="translate(100 168)"><rect x="178" y="96" width="58" height="72" rx="4" fill="#fff"/><rect x="178" y="96" width="58" height="14" rx="4" fill="#C94B4B"/><g fill="#9aa3ad">${Array.from({ length: 20 }, (_, i) => `<rect x="${184 + (i % 5) * 9.4}" y="${116 + Math.floor(i / 5) * 11}" width="6" height="6" rx="1"/>`).join('')}</g><path d="M184 118 l42 40 M226 118 l-42 40" stroke="#C94B4B" stroke-width="2" opacity=".7"/></g>`;
  if (has('shelf')) {
    const bk = [['#C8553D', 10, 32], ['#3F6C8F', 8, 24], ['#E0B24D', 12, 35], ['#6D8F5E', 9, 27], ['#8C5F8F', 10, 30]]; let bx = 266;
    s += '<g transform="translate(0 176)"><rect x="258" y="196" width="118" height="7" rx="2" fill="#6B4A35"/>' + bk.map(([c, w, h]) => { const r = `<rect x="${bx}" y="${196 - h}" width="${w}" height="${h}" rx="1.5" fill="${c}"/>`; bx += w + 2; return r; }).join('') +
      '<path d="M348 196 l3 -16 h18 l3 16z" fill="#C97B54"/><path d="M360 182 C346 170 348 154 360 148 C372 156 372 172 360 182Z" fill="#5E9A6B"/><path d="M360 182 C374 174 382 164 378 154 C366 158 362 170 360 182Z" fill="#4A8458"/></g>';
  }
  if (has('plant')) s += '<g transform="translate(-20 0)"><path d="M326 440 l-6 -34 h46 l-6 34z" fill="#C97B54"/><path d="M343 406 C320 386 326 350 343 340 C360 352 362 386 343 406Z" fill="#5E9A6B"/><path d="M343 406 C366 390 380 372 374 352 C356 358 346 380 343 406Z" fill="#4A8458"/><path d="M343 406 C322 396 308 380 312 362 C330 366 340 384 343 406Z" fill="#6DAA79"/></g>';
  if (has('stickies')) {
    const c = ['#FFE27A', '#FF9CB1', '#9EE6C1', '#FFE27A', '#9EE6C1', '#FF9CB1'];
    s += c.map((col, i) => { const x = 26 + (i % 3) * 32 + (i % 2) * 3, y = 330 + Math.floor(i / 3) * 36 + (i % 3) * 2, r = [-6, 4, -3, 5, -4, 3][i]; return `<g transform="rotate(${r} ${x + 13} ${y + 13})"><rect x="${x}" y="${y}" width="27" height="27" rx="2" fill="${col}"/><path d="M${x + 5} ${y + 9}h17M${x + 5} ${y + 15}h13M${x + 5} ${y + 21}h9" stroke="rgba(0,0,0,.28)" stroke-width="1.6" stroke-linecap="round"/></g>`; }).join('');
  }
  if (has('mugs') || has('pills')) {
    s += '<rect x="22" y="394" width="96" height="6" rx="2" fill="#6B4A35"/>';
    if (has('mugs')) s += [0, 1, 2].map(i => `<g transform="translate(${28 + i * 28} 368)"><rect width="22" height="26" rx="4" fill="${['#F4EFE6', '#7FB6D6', '#F2A65A'][i]}"/><path d="M22 7 q9 0 9 8 t-9 8" fill="none" stroke="${['#F4EFE6', '#7FB6D6', '#F2A65A'][i]}" stroke-width="4"/></g>`).join('') + '<path class="steam" d="M39 362 q-4 -8 0 -14" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/>';
    if (has('pills')) s += '<g transform="translate(34 362)"><rect width="22" height="32" rx="4" fill="#E8883A"/><rect x="-1" y="-6" width="24" height="9" rx="3" fill="#fff"/></g><path d="M74 394 l-3 -26 h22 l-3 26z" fill="#BFE3F5" opacity=".7"/>';
  }
  if (has('bills')) s += '<rect x="22" y="394" width="96" height="6" rx="2" fill="#6B4A35"/>' + [['#F4EFE6', -7, 0], ['#F7E6C8', 4, 5], ['#E9F0F6', -3, 10]].map(([c, r, dy], i) => `<g transform="rotate(${r} ${66 + i * 6} ${376 + dy})"><rect x="${28 + i * 8}" y="${360 + dy}" width="58" height="34" rx="3" fill="${c}" stroke="#9aa3ad" stroke-width="1.2"/><path d="M${28 + i * 8} ${360 + dy} l29 18 l29 -18" fill="none" stroke="#9aa3ad" stroke-width="1.2"/></g>`).join('') + '<g transform="rotate(8 98 372)"><rect x="80" y="352" width="28" height="22" rx="3" fill="#C94B4B"/><path d="M85 358 h18 M85 364 h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>';
  if (has('camotero')) s += bubble(22, 332, 100, '¡Piiiiii!', '#C94B4B', 15, 'none') + '<path d="M108 330 l8 -8 M112 340 l11 -3" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>';
  const cribSvg = cry => `<g transform="translate(0 -74)"><g class="${cry ? 'shake' : ''}"><circle cx="332" cy="366" r="21" fill="#E3AE86"/><path d="M322 348 q10 -8 20 0" stroke="#3a2a22" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${cry ? '<path d="M322 362 l7 3 M342 362 l-7 3" stroke="#3a2a22" stroke-width="2.6" stroke-linecap="round"/><ellipse class="cry" cx="332" cy="378" rx="5.5" ry="7" fill="#7A2E2E"/><path d="M318 368 q-3 8 0 10 M346 368 q3 8 0 10" stroke="#8ED8FF" stroke-width="3" fill="none" stroke-linecap="round"/>'
             : '<path d="M322 364 q4 3 8 0 M334 364 q4 3 8 0" stroke="#3a2a22" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M326 378 q6 3 12 0" stroke="#7A2E2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>'}</g>
    <rect x="286" y="344" width="92" height="8" rx="4" fill="#F4E7D3"/><rect x="286" y="468" width="92" height="8" rx="4" fill="#F4E7D3"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${290 + i * 12}" y="350" width="4.5" height="120" rx="2" fill="#F4E7D3"/>`).join('')}</g>`;
  if (has('crib')) s += cribSvg(false);
  if (has('cribcry')) s += cribSvg(true) + bubble(264, 214, 96, '¡UAAA!', '#C94B4B', 17);
  const kidSvg = wave => `<g transform="translate(0 -30)"><rect x="312" y="394" width="40" height="46" rx="16" fill="${T.accent}"/><circle cx="332" cy="372" r="21" fill="#E3AE86"/><path d="M314 366 C316 350 348 350 350 366 C342 360 322 360 314 366Z" fill="#2a1f1c"/><circle cx="325" cy="373" r="2.6" fill="#2B1D1A"/><circle cx="339" cy="373" r="2.6" fill="#2B1D1A"/><path d="M326 382 q6 5 12 0" stroke="#7A2E2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <g class="${wave ? 'wave' : ''}"><rect x="348" y="392" width="10" height="26" rx="5" fill="#E3AE86" transform="rotate(${wave ? -35 : 8} 352 396)"/></g><rect x="306" y="396" width="10" height="26" rx="5" fill="#E3AE86" transform="rotate(10 311 398)"/></g>`;
  if (has('kid')) s += kidSvg(false);
  if (has('kidwave')) s += kidSvg(true) + bubble(276, 258, 88, '¡Hola!', '#2F7F79', 17);
  if (has('drill')) s += '<g class="vib"><rect x="318" y="268" width="80" height="26" rx="6" fill="#E26D5A"/><rect x="292" y="276" width="30" height="10" rx="3" fill="#8b8f99"/><path d="M262 281 L292 276 L292 286Z" fill="#c9ccd4"/><path d="M252 262 l-10 -10 M246 284 h-14 M252 304 l-10 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></g><circle cx="304" cy="306" r="3" fill="#cdbfa6"/><circle cx="296" cy="318" r="2.4" fill="#cdbfa6"/><circle cx="312" cy="322" r="2" fill="#cdbfa6"/>';
  if (has('door')) {
    s += `<rect x="292" y="216" width="84" height="300" rx="6" fill="#6B4A35"/><rect x="304" y="228" width="60" height="120" rx="3" fill="#7d5a42"/>
    <circle cx="322" cy="296" r="26" fill="#D9A07A"/><path d="M296 292 C296 262 348 262 348 292 C340 280 304 280 296 292Z" fill="#2a1f1c"/><circle cx="322" cy="262" r="12" fill="#2a1f1c"/>
    <circle cx="313" cy="298" r="2.8" fill="#2B1D1A"/><circle cx="331" cy="298" r="2.8" fill="#2B1D1A"/>`;
    const txt = o.ambientText || '¡Almuerzo!';
    s += (txt === '¡Lávate las manos!' ? '<path d="M297 303 h50 v18 q-25 10 -50 0z" fill="#CFE7F2" stroke="#9fc5d6" stroke-width="1.5"/>' : '<path d="M312 312 q10 8 20 0" stroke="#7A2E2E" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="322" cy="314" rx="7" ry="5" fill="#7A2E2E"/>') +
      `<g transform="translate(262 214)"><rect width="112" height="34" rx="15" fill="#fff"/><path d="M84 34 l-8 12 l-4 -12z" fill="#fff"/><text x="56" y="22" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="900" font-size="${txt.length > 12 ? 12 : txt.length > 9 ? 13 : 15}" fill="#1c1c24">${txt}</text></g>`;
  }
  if (has('boxes')) s += '<g transform="translate(0 -50)"><rect x="278" y="404" width="100" height="78" rx="3" fill="#C79A63"/><rect x="278" y="404" width="100" height="14" fill="#B8884F"/><rect x="318" y="404" width="20" height="78" fill="#E3C79A" opacity=".6"/><rect x="296" y="348" width="70" height="58" rx="3" fill="#D1A66F"/><rect x="296" y="348" width="70" height="12" fill="#B8884F"/><rect x="322" y="348" width="18" height="58" fill="#E3C79A" opacity=".6"/><path d="M338 348 C330 328 346 318 352 336Z" fill="#5E9A6B"/><rect x="304" y="332" width="20" height="18" rx="3" fill="#F4EFE6"/></g>';
  if (has('neon')) s += `<rect x="0" y="198" width="390" height="14" fill="${T.accent}" opacity=".6" filter="url(#${u}bl)"/><rect x="0" y="202" width="390" height="4" fill="#E3D4FF"/>`;
  if (has('chatai')) s += `<g transform="translate(266 268)"><rect width="104" height="52" rx="18" fill="${T.accent}" opacity=".95"/><path d="M26 52 l-4 14 l16 -14z" fill="${T.accent}"/><path d="M52 14 l4.4 11 11 4.4 -11 4.4 -4.4 11 -4.4 -11 -11 -4.4 11 -4.4z" fill="#fff"/><circle cx="82" cy="38" r="3.4" fill="#fff" opacity=".8"/><circle cx="22" cy="18" r="2.6" fill="#fff" opacity=".8"/></g>`;
  if (has('helmet')) s += '<g transform="translate(290 274)"><path d="M0 40 C0 8 56 8 56 40Z" fill="#E26D5A"/><rect x="-2" y="38" width="60" height="7" rx="3.5" fill="#fff"/><path d="M12 30 h32" stroke="#fff" stroke-width="3" opacity=".6"/></g><path d="M318 264 v12" stroke="#555" stroke-width="3"/>';
  return s;
}

/* ---------- one webcam frame ---------- */
function room(o) {
  const { theme = 'parents', light = 1, expr = 'neutral', fatigue = 0, g = 'f', glasses = false, crop = '0 0 390 520', u = 'r', time = '09:00', sky = 'day' } = o;
  const T = THEMES[theme] || THEMES.parents, list = o.props || [];
  const dark = (1 - light) * 0.78, gl = clamp(0.38 + (1 - light) * 0.55, 0, 0.9);
  const size = o.px ? ` width="${o.px}" height="${o.px}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${crop}"${size} preserveAspectRatio="xMidYMax slice" role="img" aria-label="Vista de webcam">
  <defs>
    <linearGradient id="${u}wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.wall2}"/><stop offset=".65" stop-color="${T.wall}"/></linearGradient>
    <linearGradient id="${u}gl" gradientUnits="userSpaceOnUse" x1="0" y1="520" x2="0" y2="230"><stop offset="0" stop-color="${T.glow}" stop-opacity="${gl}"/><stop offset="1" stop-color="${T.glow}" stop-opacity="0"/></linearGradient>
    <filter id="${u}bl" x="-5%" y="-300%" width="110%" height="700%"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  <rect width="390" height="520" fill="url(#${u}wg)"/>
  ${props(list, T, { sky, time, ambientText: o.ambientText }, u)}
  <rect width="390" height="520" fill="#070A1C" opacity="${dark.toFixed(2)}"/>
  <g transform="translate(195 520) scale(.86) translate(-195 -520)">${engineer({ g, expr, fatigue, glasses })}</g>
  <rect width="390" height="520" fill="#070A1C" opacity="${(dark * 0.32).toFixed(2)}"/>
  <rect width="390" height="520" fill="url(#${u}gl)" style="mix-blend-mode:screen"/>
  </svg>`;
}
const FRAME_CROP = '35 195 320 320';
const frameSvg = (f, g, u, px) => room({ ...f.view, expr: f.expr, fatigue: f.fatigue, g, crop: FRAME_CROP, u, px });

/* ---------- Photo Booth share card (canvas, 1080×1350) ---------- */
function loadSvg(svg) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img); img.onerror = reject;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}
function wrap(ctx, text, maxW) {
  const words = String(text).split(' '), lines = []; let line = '';
  words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
const plain = s => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

async function shareCard(res, o) {
  const W = 1080, H = 1350, FONT = 'ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  // background
  const bg = ctx.createRadialGradient(W / 2, 0, 80, W / 2, 200, 1100); bg.addColorStop(0, '#1B2147'); bg.addColorStop(1, '#0B0E1A');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const ls = v => { if ('letterSpacing' in ctx) ctx.letterSpacing = v; };
  // header
  ctx.fillStyle = '#34D399'; ctx.beginPath(); ctx.arc(80, 74, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#cfd2e6'; ctx.font = `700 26px ${FONT}`; ls('5px'); ctx.textBaseline = 'middle';
  ctx.fillText('SOFTWARE ENGINEER LIFE', 104, 75); ls('0px');
  // right side: "CAMILA · 2019 → 2026" — drops the years if a long name would collide with the title
  const who = plain(res.name || o.name || '').toUpperCase(), titleEnd = 104 + ctx.measureText('SOFTWARE ENGINEER LIFE').width;
  ctx.textAlign = 'right'; ctx.fillStyle = '#8C8FA6'; ls('3px');
  let right = who ? `${who} · 2019 → 2026` : '2019 → 2026';
  if (who && titleEnd + 40 + ctx.measureText(right).width > W - 70) right = who;
  ctx.fillText(right, W - 70, 75); ls('0px'); ctx.textAlign = 'left';
  // title (auto-fit to 2 lines)
  const title = plain(res.title); let fs = 88, lines;
  for (; fs >= 56; fs -= 6) { ctx.font = `900 ${fs}px ${FONT}`; lines = wrap(ctx, title, W - 140); if (lines.length <= 2) break; }
  ctx.fillStyle = '#F4F1EA'; ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, 70, 178 + i * (fs * 1.02)));
  let y = 178 + (lines.length - 1) * fs * 1.02 + 50;
  ctx.font = `500 34px ${FONT}`; ctx.fillStyle = '#D6D8E8';
  wrap(ctx, plain(res.roast), W - 140).forEach((l, i) => ctx.fillText(l, 70, y + i * 44));
  y += wrap(ctx, plain(res.roast), W - 140).length * 44 + 22;
  // epilogue chip
  if (res.epilogue) {
    const t = res.epilogue === 'vibe' ? '⌨️ Epílogo: vibecodeó el sábado' : '🚲 Epílogo: cerró la laptop y salió a caminar';
    ctx.font = `700 26px ${FONT}`; const tw = ctx.measureText(t).width + 40;
    ctx.fillStyle = 'rgba(52,211,153,.14)'; rrect(ctx, 70, y - 26, tw, 46, 23); ctx.fill();
    ctx.strokeStyle = 'rgba(52,211,153,.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#CFE9DD'; ctx.fillText(t, 90, y + 7); y += 44;
  }
  // photo booth paper: frame size adapts to the space left under the title block
  const pad = 22, gapx = 28, capH = 26, gapy = 10, bot = 40;
  const reserve = 40 + 40 + 3 * 42 + 96;   // recap + footer
  let fx = Math.floor((H - y - reserve - pad - 2 * capH - gapy - bot) / 2); fx = Math.max(230, Math.min(340, fx));
  const bw = 2 * pad + 2 * fx + gapx, bh = pad + fx + capH + gapy + fx + capH + bot, bx = (W - bw) / 2, by = y + 10;
  ctx.save(); ctx.translate(W / 2, by + bh / 2); ctx.rotate(-0.014); ctx.translate(-W / 2, -(by + bh / 2));
  ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = '#F4EFE6'; rrect(ctx, bx, by, bw, bh, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  const imgs = await Promise.all(res.frames.map((f, i) => loadSvg(frameSvg(f, o.g, 'c' + i, 640))));
  imgs.forEach((im, i) => {
    const cx = bx + pad + (i % 2) * (fx + gapx), cy = by + pad + Math.floor(i / 2) * (fx + capH + gapy);
    ctx.save(); rrect(ctx, cx, cy, fx, fx, 10); ctx.clip(); ctx.filter = 'contrast(1.04) saturate(.92)'; ctx.drawImage(im, cx, cy, fx, fx); ctx.restore();
    ctx.font = '800 20px ui-monospace,SFMono-Regular,Menlo,monospace'; ls('2px'); ctx.fillStyle = '#6c655c'; ctx.fillText(res.frames[i].label, cx, cy + fx + 20); ls('0px');
  });
  ctx.font = '800 16px ui-monospace,SFMono-Regular,Menlo,monospace'; ls('2px'); ctx.fillStyle = '#2a2622';
  ctx.fillText('SOFTWARE ENGINEER LIFE', bx + pad, by + bh - 16); ctx.textAlign = 'right'; ctx.fillText('#HACKTHEANDES', bx + bw - pad, by + bh - 16); ctx.textAlign = 'left'; ls('0px');
  ctx.restore();
  // recap ("lo que la webcam recuerda")
  y = by + bh + 56;
  ctx.font = `700 22px ${FONT}`; ls('4px'); ctx.fillStyle = '#8C8FA6'; ctx.fillText('LO QUE LA WEBCAM RECUERDA', 70, y); ls('0px');
  ctx.font = `600 31px ${FONT}`; ctx.fillStyle = '#F4F1EA';
  res.recap.slice(0, 3).forEach((r, i) => ctx.fillText(`${r.icon}  ${plain(r.text)}`, 70, y + 46 + i * 42));
  // footer
  ctx.fillStyle = '#34D399'; ctx.font = `800 30px ${FONT}`;
  ctx.fillText('¿Qué final te sale a ti?', 70, H - 52);
  ctx.textAlign = 'right'; ctx.fillStyle = '#A3A5B8'; ctx.font = `600 26px ${FONT}`; ctx.fillText(o.site || '', W - 70, H - 52); ctx.textAlign = 'left';
  return new Promise(r => cv.toBlob(r, 'image/png'));
}

const api = { room, frameSvg, shareCard, THEMES, FRAME_CROP };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SEL_RENDER = api;
})(typeof self !== 'undefined' ? self : this);
