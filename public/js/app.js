/* Software Engineer LIFE — app controller: screens, game loop, sharing. */
(function () {
'use strict';
const E = SEL_ENGINE, R = SEL_RENDER, A = SEL_AUDIO, D = SEL_DATA, KEYS = E.KEYS;
const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const CFG = { site: '' };   // set to your public URL at deploy time (optional; falls back to the current location)

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
};
function track(name, props) {   // privacy-friendly hook: plausible/goatcounter if present, nothing otherwise
  try { if (window.plausible) window.plausible(name, { props: props || {} }); if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: 'event/' + name, event: true }); } catch (e) { /* analytics must never break the game */ }
  if (location.search.includes('debug')) console.debug('[track]', name, props || {});
}

const NAMES = { e: 'Energía', p: 'Plata', c: 'Carrera', v: 'Vida' };
const COL = { e: '#FFC857', p: '#4ADE80', c: '#60A5FA', v: '#FF7A90' };
const ICON = {
  e: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13z"/></svg>',
  p: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="15.8" text-anchor="middle" font-size="9.5" font-weight="900" fill="#0B0E1A">S/</text></svg>',
  c: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6.5-6.5 4 4L21 7M15 7h6v6"/></svg>',
  v: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8.5-5.2-8.5-11.2A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8.5 2.4C20.5 15.8 12 21 12 21z"/></svg>'
};

/* ---------- state ---------- */
const params = new URLSearchParams(location.search);
const urlSeed = params.get('s') ? parseInt(params.get('s'), 36) : 0;
let seed = urlSeed || ((Math.random() * 4294967296) >>> 0) || 1;
let gender = LS.get('sel_g', 'f');
let pname = LS.get('sel_name', '');
let sound = LS.get('sel_sound', false);
const found = new Set((LS.get('sel_found', []) || []).filter(id => D.ENDINGS.some(e => e.id === id)));   // ignore stale ids
let G = null, lastRes = null, curView = null, curExpr = 'neutral', screen = 'title';
let choiceResolve = null, choiceFate = false, skipFn = null, recTimer = null, t0 = 0, ambTimer = null;
const defaultName = () => DEF[gender];
const total = D.ENDINGS.length;
const DEF = { f: 'Camila', m: 'Diego' };
const fillTokens = s => s.replace(/\{\?fem\|([^|}]*)\|([^}]*)\}/g, (_, a, b) => (gender === 'f' ? a : b)).replace(/\{o\}/g, gender === 'f' ? 'a' : 'o').replace(/\{n\}/g, esc(pname || DEF[gender]));
/* what the player typed → what the game calls them: letters only, tidy casing, a first name that fits (14 chars) */
function cleanName(raw) {
  let n = String(raw || '').replace(/[^\p{L}\p{N} .'-]/gu, '').replace(/\s+/g, ' ').trim();
  if (n.length >= 14 && n.includes(' ')) n = n.slice(0, n.lastIndexOf(' '));                  // "Ana María Pére|z" → "Ana María": never end on half a surname
  n = n.slice(0, 14).trim();
  if (n.length > 1 && (n === n.toLowerCase() || (n.length > 3 && n === n.toUpperCase())))   // "ana maría" / "ANA" → "Ana María" / "Ana" ("JP" stays)
    n = n.toLowerCase().replace(/(^|[\s.'-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  return n;
}

/* ---------- small UI helpers ---------- */
function show(id) {
  screen = id;
  $$('.scr').forEach(s => s.classList.toggle('on', s.id === 's-' + id));
  $('#island').classList.toggle('live', id === 'play' || id === 'end');
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2200); }
function haptic(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* unsupported */ } }
function setSound(on) {
  sound = on; LS.set('sel_sound', on); A.set(on);
  $$('[data-sound]').forEach(b => b.setAttribute('aria-pressed', String(on)));
}
function wait(ms) {
  return new Promise(r => {
    const t = setTimeout(done, ms);
    function done() { clearTimeout(t); if (skipFn === done) skipFn = null; r(); }
    skipFn = done;
  });
}
const skip = () => { if (skipFn) skipFn(); };

function buildHud(el) { el.innerHTML = KEYS.map(k => `<div class="mtr" data-k="${k}" style="--k:${COL[k]}" role="img" aria-label="${NAMES[k]}">${ICON[k]}<div class="bar"><b></b></div></div>`).join(''); }
function paintHud(el, v) {
  KEYS.forEach(k => { const m = $(`.mtr[data-k=${k}]`, el); $('b', m).style.width = v[k] + '%'; m.classList.toggle('low', v[k] <= 22); m.setAttribute('aria-label', `${NAMES[k]} ${v[k]}`); });
}
function delta(k, n) {
  if (!n) return;
  const m = $(`#hud .mtr[data-k=${k}]`), d = document.createElement('i');
  d.className = 'dl ' + (n > 0 ? 'up' : 'dn'); d.textContent = (n > 0 ? '+' : '−') + Math.abs(n); m.appendChild(d); setTimeout(() => d.remove(), 1700);
}
const statsOf = () => { const S = G.state; return { e: S.e, p: S.p, c: S.c, v: S.v }; };
function flash() { if (REDUCED) return; const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }

function renderFeed() {
  const v = curView, S = G.state, feed = $('#feed');
  feed.innerHTML = R.room(Object.assign({}, v, { expr: curExpr, fatigue: G.fatigue(), g: gender, u: 'f' }));
  feed.style.filter = `saturate(${(0.55 + S.e / 222).toFixed(2)}) brightness(${(0.82 + S.e / 555).toFixed(2)})`;
  feed.classList.toggle('lag', !!v.lag);
  feed.classList.toggle('blackout', v.ambient === 'apagon');
  $('#led').style.opacity = v.camOff ? 0.25 : 1;
}
function setTimeline(year, label) {
  $('#yr').textContent = label;
  const f = (year - 2019) / 7;
  $('#railb').style.width = f * 100 + '%'; $('#raili').style.left = f * 100 + '%';
}

/* ---------- game loop ---------- */
function startRec() { clearInterval(recTimer); t0 = Date.now(); recTimer = setInterval(() => { const s = ((Date.now() - t0) / 1000) | 0; $('#rec').textContent = 'REC ' + String((s / 60) | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }, 500); }

async function startGame() {
  const typed = cleanName($('#name').value), name = typed || defaultName();
  pname = typed; LS.set('sel_name', pname); LS.set('sel_g', gender);
  G = E.createGame({ seed, gender, name });
  $('#ntagName').textContent = name;
  buildHud($('#hud')); paintHud($('#hud'), statsOf());
  $('#ycard').classList.remove('on'); $('#cam').classList.remove('off'); $('#ticker').hidden = true; $('#amb').hidden = true;
  show('play'); startRec(); A.play('tap'); track('start', { challenge: !!urlSeed });
  for (let guard = 0; guard < 120; guard++) {
    const n = G.next();
    if (n.kind === 'end') break;
    if (n.kind === 'act') { await showAct(n); continue; }
    const dead = await playCard(n.card);
    if (dead) break;
  }
  finish();
}

async function showAct(n) {
  curView = n.view; curExpr = 'neutral'; $('#cam').classList.remove('off'); renderFeed(); setTimeline(n.year, String(n.year));
  $('#ticker').hidden = true; $('#amb').hidden = true; $('#cam').classList.remove('tk');
  $('#notif').innerHTML = ''; $('#opts').innerHTML = ''; $('#meta').innerHTML = '';   // nothing from the last card behind the year card
  const chips = [];
  if (n.tick) {
    const S = G.state;
    chips.push(`<span style="color:${COL.p}">Costo de vida · Plata −${n.tick.cost}</span>`, `<span style="color:${COL.e}">Descanso · Energía +${n.tick.regen}</span>`);
    if (n.tick.absence) chips.push(`<span style="color:${COL.v}">Ausencias · Vida −${n.tick.absence}</span>`);
    const hh = n.tick.health || { e: 0, p: 0 };
    if (hh.e || hh.p) chips.push(`<span style="color:${COL.e}">Tu cuerpo cobra · ${[hh.e && `Energía −${hh.e}`, hh.p && `Plata −${hh.p}`].filter(Boolean).join(' · ')}</span>`);
    const wk = n.tick.work || 0;
    if (wk) chips.push(`<span style="color:${COL.e}">${S.flags.overloaded ? 'Sobrecarga' : 'CVs de noche'} · Energía −${wk}</span>`);
    if (n.tick.market && n.tick.market.show) chips.push(`<span style="color:#8FA3C7">Mercado · ${n.tick.market.tenure} años en lo mismo: tu perfil pierde vigencia</span>`);   // hidden stat, surfaced as a hint — never as a number
    delta('p', -(n.tick.cost + hh.p)); delta('e', n.tick.regen - hh.e - wk); delta('v', -n.tick.absence); paintHud($('#hud'), { e: S.e, p: S.p, c: S.c, v: S.v });
  }
  const yc = $('#ycard');
  yc.innerHTML = `<div class="y">${n.year}</div><div class="t">${esc(n.title)}</div><div class="l">${n.line}</div><div class="chips">${chips.join('')}</div><small>toca para continuar</small>`;
  yc.classList.add('on'); flash(); A.play('shutter');
  await wait(n.index === 0 ? 4200 : 3300);
  yc.classList.remove('on'); await sleep(280);
}

const AMBIENT_SOUND = { baby: 'cry', kidwave: 'wave', kid: 'wave', mom: 'door', camotero: 'whistle', drill: 'drill', lag: 'lag', apagon: 'blackout' };
const AMBIENT_BANNER = { lag: '📶 Conexión inestable', apagon: '⚡ Se fue la luz', camotero: '🍠 ¡El camotero!' };

function showCard(card) {
  const S = G.state, v = card.view;
  curView = v; curExpr = card.expr || 'neutral';
  $('#cam').classList.toggle('off', !!v.camOff);
  renderFeed(); setTimeline(card.year, card.label);
  $('#ticker').hidden = !v.ticker; $('#cam').classList.toggle('tk', !!v.ticker); if (v.ticker) $('#tickerTx').textContent = v.ticker;
  const amb = $('#amb'); clearTimeout(ambTimer); amb.hidden = !AMBIENT_BANNER[v.ambient];
  if (!amb.hidden) { amb.textContent = AMBIENT_BANNER[v.ambient]; ambTimer = setTimeout(() => { amb.hidden = true; }, 2800); }
  const f = card.from, notif = $('#notif'); notif.dataset.card = card.id;
  notif.innerHTML = `<div class="top"><span class="app">${esc(f.app)}</span><span class="tm">${v.time}</span></div>
    <div class="who"><div class="av" style="background:${f.col}">${esc(f.av)}</div><div><div class="nm">${esc(f.name)}</div><div class="tx">${card.text}</div></div></div>`;
  notif.style.animation = 'none'; void notif.offsetWidth; notif.style.animation = '';
  const o = $('#opts'); o.classList.remove('lock');
  choiceFate = card.kind === 'fate';
  if (choiceFate) {
    o.innerHTML = `<button class="opt solo" data-k="F"><span class="key">▶</span><span class="lbl">${card.btn}</span></button>`;
  } else {
    o.innerHTML = ['A', 'B'].map(k => {
      const op = card[k];
      const used = new Set([...Object.keys(op.fx || {}), ...Object.keys((op.win || {}).fx || {}), ...Object.keys((op.lose || {}).fx || {})]);
      const dots = KEYS.filter(x => used.has(x)).map(x => `<i style="--k:${COL[x]}" title="${NAMES[x]}"></i>`).join('');
      return `<button class="opt${op.roll ? ' risky' : ''}" data-k="${k}" aria-label="Opción ${k}: ${esc(op.t)}"><span class="key">${k}</span><span class="lbl">${op.t}${op.roll ? '<em>🎲 Riesgo: puede salir mal</em>' : ''}</span><span class="hint">${dots}</span></button>`;
    }).join('');
  }
  $$('.opt', o).forEach(b => b.addEventListener('click', () => pick(b.dataset.k)));
  $('#meta').innerHTML = S.played === 0
    ? `<span class="lg">${KEYS.map(k => `<span style="--k:${COL[k]}">${ICON[k]}<b>${NAMES[k]}</b></span>`).join('')}</span>`
    : `<span>Juegas como <b style="color:#F4F1EA">${esc(S.name)}</b> · toca A o B</span><span>Escena ${S.played + 1}</span>`;
  A.play('knock'); haptic(8);
  if (AMBIENT_SOUND[v.ambient]) setTimeout(() => A.play(AMBIENT_SOUND[v.ambient]), 420);
}

function pick(k) {
  if (!choiceResolve) return;
  const r = choiceResolve; choiceResolve = null;
  const b = $(`#opts .opt[data-k=${k}]`); if (b) b.classList.add('chosen');
  r(k);
}
const waitChoice = () => new Promise(r => { choiceResolve = r; });

async function playCard(card) {
  showCard(card);
  const key = await waitChoice();
  const out = G.choose(key === 'F' ? 'A' : key);
  await showOutcome(out, key);
  return out.dead;
}

async function showOutcome(out, key) {
  $('#opts').classList.add('lock'); A.play('choose', key); haptic(10);
  KEYS.forEach(k => delta(k, out.deltas[k])); paintHud($('#hud'), statsOf());
  curView = out.view; curExpr = out.expr; $('#cam').classList.remove('off'); renderFeed();
  const net = KEYS.reduce((a, k) => a + out.deltas[k], 0);
  setTimeout(() => A.play(net >= 0 && !out.dead ? 'good' : 'bad'), 140);
  if (net < -12) haptic(30);
  const ms = clamp(out.res.length * 58, 2400, 4400);
  $('#notif').innerHTML = `<div class="top"><span class="app">La webcam vio</span><span class="tm">${out.view.time}</span></div><div class="res">${out.res}<small>Toca para continuar</small></div><div class="pg"></div>`;
  const pg = $('#notif .pg'); pg.style.animationDuration = ms + 'ms'; pg.classList.add('run');
  await wait(ms);
}

/* ---------- ending ---------- */
function finish() {
  clearInterval(recTimer);
  const r = G.finish(); r.name = G.state.name; lastRes = r;
  found.add(r.id); LS.set('sel_found', [...found]);
  $('#eKick').textContent = 'Final de ' + r.name;
  $('#eTitle').innerHTML = r.title; $('#eRoast').innerHTML = r.roast;
  $('#eEpi').textContent = r.epilogue === 'vibe' ? '⌨️ Epílogo: dejó la cámara encendida y vibecodeó' : r.epilogue === 'walk' ? '🚲 Epílogo: cerró la laptop y salió a caminar' : '';
  $('#eStory').innerHTML = `<b>La webcam registra</b>${r.story}`;
  $('#coll').textContent = `${found.size}/${total}`;
  $('#eCare').textContent = r.care;
  $('#booth').innerHTML = `<div class="grid">${r.frames.map((f, i) => `<figure><div class="ph">${R.frameSvg(f, gender, 'b' + i)}</div><figcaption>${esc(f.label)}</figcaption></figure>`).join('')}</div><div class="bt"><span>SOFTWARE ENGINEER LIFE</span><span>#HACKTHEANDES</span></div>`;
  $('#recap').innerHTML = r.recap.map(x => `<li><span>${x.icon}</span><span>${x.text}</span></li>`).join('');
  $('#eThink').innerHTML = r.think ? `<b>Para pensar</b>${r.think}<small>Es una simulación, no un consejo profesional.</small>` : '';
  $('#fm').innerHTML = KEYS.map(k => `<div class="mtr" data-k="${k}" style="--k:${COL[k]}">${ICON[k]}<div class="bar"><b></b></div></div>`).join('');
  $('#seedTxt').textContent = 'Semilla del reto: ' + seed.toString(36).toUpperCase();
  show('end'); $('#s-end').scrollTop = 0;
  requestAnimationFrame(() => paintHud($('#fm'), r.meters));
  A.play(r.kind === 'over' ? 'bad' : 'good'); track('complete', { ending: r.id, over: r.over || '' });
}

const siteBase = () => CFG.site || (/^https?:/.test(location.protocol) ? location.origin + location.pathname.replace(/[^/]*$/, '') : location.href.split('?')[0].split('#')[0]);
const shareUrl = id => (/^https?:/.test(location.protocol) ? siteBase() + 'e/' + id + '/' : siteBase());
const plain = s => String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
const shareText = r => `Mi vida de dev terminó en “${plain(r.title)}” 😅 ${plain(r.roast)} ¿Y la tuya? #HackTheAndes`;

async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) { /* fall through */ }
  try { const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch (e) { return false; }
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
let sharing = false;
async function doShare() {
  if (sharing || !lastRes) return; sharing = true; track('share_click', { ending: lastRes.id });
  const btn = $('#btnShare'); btn.disabled = true; toast('Revelando tu tira de fotos…');
  try {
    const blob = await R.shareCard(lastRes, { g: gender, site: /^https?:/.test(location.protocol) ? location.host : '' });
    const file = new File([blob], 'mi-final-software-engineer-life.png', { type: 'image/png' });
    const text = shareText(lastRes) + ' ' + shareUrl(lastRes.id);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text, title: 'Software Engineer LIFE' }); track('share_done', { ending: lastRes.id }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    download(blob, 'mi-final-software-engineer-life.png');
    const copied = await copyText(text);
    toast(copied ? 'Imagen guardada y texto copiado. ¡Publícala con #HackTheAndes!' : 'Imagen guardada. Publícala con #HackTheAndes');
    track('share_download', { ending: lastRes.id });
  } catch (e) { toast('No pude crear la imagen. Haz captura de pantalla 📸'); }
  finally { sharing = false; btn.disabled = false; }
}
async function doChallenge() {
  const url = siteBase() + '?s=' + seed.toString(36); track('challenge_copy');
  const text = `Te reto: ¿qué final te sale en Software Engineer LIFE? Mismo mundo, otras decisiones. #HackTheAndes`;
  if (navigator.share) { try { await navigator.share({ title: 'Software Engineer LIFE', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  toast((await copyText(text + ' ' + url)) ? 'Enlace del reto copiado' : url);
}

/* ---------- finales sheet ---------- */
function openFinales() {
  $('#sheetCount').textContent = `${found.size}/${total}`;
  $('#sheetList').innerHTML = D.ENDINGS.map(e => {
    const ok = found.has(e.id);
    const hint = e.over ? 'Un medidor llegó a 0' : e.special ? 'Final especial' : e.default ? 'Final por defecto' : 'Final según tu vida';
    return `<div class="rowf${ok ? ' on' : ''}"><i>${ok ? '✓' : '?'}</i><div><b>${ok ? fillTokens(e.title) : '???'}</b><span>${ok ? fillTokens(e.roast) : hint}</span></div></div>`;
  }).join('');
  $('#sheet').classList.add('on');
}

/* ---------- pick / title ---------- */
function buildPick() {
  const view = { theme: 'parents', sky: 'day', light: 1, time: '09:12', props: ['window', 'curtain', 'frame', 'clock', 'shelf'] };
  const tag = '<span class="ntag"><svg class="mi on" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg><b></b><small>(Tú)</small></span>';
  const mk = (g, who, sub) => `<button class="tile${gender === g ? ' sel' : ''}" role="radio" aria-checked="${gender === g}" aria-label="${who}" data-g="${g}"><div class="pic">${R.room(Object.assign({}, view, { expr: 'happy', fatigue: 0, g, crop: '20 150 350 370', u: 'p' + g }))}<span class="ledn"><i></i>${gender === g ? 'En vivo' : 'Apagada'}</span>${tag}</div><div class="lab"><b>${who}</b><span>${sub}</span></div></button>`;
  $('#tiles').innerHTML = mk('f', 'Ella', '24 años · Lima') + mk('m', 'Él', '24 años · Lima');
  $('#name').placeholder = defaultName();
  $$('.tile').forEach(t => t.addEventListener('click', () => { gender = t.dataset.g; buildPick(); A.play('tap'); }));
  refreshPick();
}
/* the name you type shows up instantly under both faces and on the button: you see who you will be before you start */
function refreshPick() {
  const typed = cleanName($('#name').value);
  $$('.tile').forEach(t => { $('.ntag b', t).textContent = typed || DEF[t.dataset.g]; });
  $('#goTxt').textContent = 'Empezar como ' + (typed || defaultName());
}
function toPick() { buildPick(); $('#name').value = pname; refreshPick(); show('pick'); A.play('tap'); }
function titleInfo() {
  const from = params.get('from'), e = D.ENDINGS.find(x => x.id === from);
  const c = $('#challenge');
  if (urlSeed) c.textContent = '🎯 Un amigo te retó: viven el mismo mundo. Tus decisiones cambian el final.';
  else if (e) c.innerHTML = `🎞️ Un amigo terminó en “${fillTokens(e.title)}”. ¿Y tú?`;
  else if (pname && found.size) c.textContent = `🎞️ La webcam te recuerda, ${pname}. ¿Qué final te sale hoy?`;
  else c.textContent = '';
  $('#btnFinales').hidden = found.size === 0; $('#btnFinales').textContent = `Mis finales (${found.size}/${total})`;
}

/* ---------- desktop shell: phone frame, QR ---------- */
function fit() {
  const wrap = $('#wrap'), dev = $('#device');
  if (innerWidth <= 760) { wrap.style.width = wrap.style.height = ''; dev.style.transform = ''; return; }
  const W = 412, H = 866, s = Math.min(1, (innerHeight - 24) / H);
  dev.style.transform = `scale(${s})`; wrap.style.width = W * s + 'px'; wrap.style.height = H * s + 'px';
}
function desktopInfo() {
  if (innerWidth < 980) return;
  const url = siteBase(); $('#urlText').textContent = url;
  const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js';
  s.onload = () => { try { const qr = window.qrcode(0, 'M'); qr.addData(url); qr.make(); $('#qr').innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch (e) { $('#qr').remove(); } };
  s.onerror = () => $('#qr').remove();
  document.head.appendChild(s);
}

/* ---------- boot ---------- */
function bind() {
  $('#btnStart').addEventListener('click', toPick);
  $('#btnGo').addEventListener('click', startGame);
  $('#btnShare').addEventListener('click', doShare);
  $('#btnChallenge').addEventListener('click', doChallenge);
  $('#btnAgain').addEventListener('click', () => { seed = ((Math.random() * 4294967296) >>> 0) || 1; history.replaceState(null, '', location.pathname); titleInfo(); toPick(); });
  $('#btnFinales').addEventListener('click', openFinales); $('#btnFinales2').addEventListener('click', openFinales);
  $('#sheetX').addEventListener('click', () => $('#sheet').classList.remove('on'));
  $$('[data-sound]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); setSound(!sound); }));
  $('#s-play').addEventListener('click', e => { if (!choiceResolve && !e.target.closest('.opt,.snd')) skip(); });
  $('#ycard').addEventListener('click', skip);
  $('#name').addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });
  $('#name').addEventListener('input', refreshPick);
  $('#name').addEventListener('blur', () => { $('#name').value = cleanName($('#name').value); refreshPick(); });   // the field shows exactly what the game will call you
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (screen === 'title' && (k === 'enter' || k === ' ')) { e.preventDefault(); toPick(); return; }
    if (screen !== 'play') return;
    if (choiceResolve) {
      if (choiceFate) { if (['enter', ' ', 'a', '1', 'arrowleft', 'arrowright'].includes(k)) { e.preventDefault(); pick('F'); } }
      else if (['a', '1', 'arrowleft'].includes(k)) { e.preventDefault(); pick('A'); }
      else if (['b', '2', 'arrowright'].includes(k)) { e.preventDefault(); pick('B'); }
    } else if (['enter', ' ', 'arrowright'].includes(k)) { e.preventDefault(); skip(); }
  });
  addEventListener('resize', fit);
}

function boot() {
  A.on = sound; $$('[data-sound]').forEach(b => b.setAttribute('aria-pressed', String(sound)));
  const demo = { theme: 'parents', sky: 'day', light: 1, time: '09:12', props: ['window', 'curtain', 'frame', 'clock', 'shelf'] };
  $('#titleBg').innerHTML = R.room(Object.assign({}, demo, { expr: 'happy', fatigue: 0, g: gender, u: 't' }));
  titleInfo(); bind(); fit(); desktopInfo();
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { /* offline cache is optional */ });
  track('open', { from: params.get('from') || '', challenge: !!urlSeed });
  window.SEL_APP = { start: startGame, pick, skip, state: () => (G && G.state), seed: () => seed, result: () => lastRes, gender: () => gender };   // handy for QA
}
boot();
})();
