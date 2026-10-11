/* Software Engineer LIFE — engine. DOM-free: runs in the browser and in Node (tools/sim.mjs).
 *
 *   const g = SEL_ENGINE.createGame({ seed, gender: 'f'|'m', name })
 *   g.next()        → { kind:'act', ... } | { kind:'card', card } | { kind:'end' }
 *   g.choose('A')   → { res, expr, deltas, win, dead, view }
 *   g.finish()      → ending summary (title, roast, story, recap, frames, meters, epilogue…)
 *
 * Randomness is deterministic per seed: the pool order of each act and every dice roll come from the seed,
 * so a challenge link (?s=…) replays the same world events for a friend.
 */
(function (root) {
'use strict';
const D = (typeof module !== 'undefined' && module.exports && typeof require === 'function') ? require('./data.js') : root.SEL_DATA;
const KEYS = ['e', 'p', 'c', 'v'];
const clamp = (n, a = 0, b = 100) => Math.max(a, Math.min(b, n));
const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rand01(seed, key) { return mulberry32((seed ^ hash(key)) >>> 0)(); }
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function createGame(opts) {
  const seed = (opts.seed >>> 0) || 1;
  const g = opts.gender === 'm' ? 'm' : 'f';
  const name = (opts.name || (g === 'f' ? 'Camila' : 'Diego')).slice(0, 14);
  const R = D.RULES;
  const S = {
    seed, g, name,
    e: R.start.e, p: R.start.p, c: R.start.c, v: R.start.v, stress: R.start.stress,
    flags: {}, cnt: { ot: 0, yes: 0, extra: 0, body: 0, learn: 0, cam: 0, bound: 0, raises: 0 },
    act: -1, actOt: 0, cursor: -1, queue: [], poolOrder: [], seen: {}, trig: {}, trigAct: {},
    history: [], over: null, current: null, played: 0
  };

  /* ---------- conditions & templates ---------- */
  function lookup(n) {
    if (n === 'e' || n === 'p' || n === 'c' || n === 'v') return S[n];
    if (n === 'stress') return S.stress;
    if (n === 'act') return S.act;
    if (n in S.cnt) return S.cnt[n];
    return S.flags[n] ? 1 : 0;
  }
  function test(cond) {
    const m = /^(!)?([a-z_0-9]+)(?:(>=|<=|==|>|<)(-?\d+))?$/.exec(String(cond).trim());
    if (!m) throw new Error('bad condition: ' + cond);
    const val = lookup(m[2]);
    let r;
    if (m[3]) { const n = +m[4]; r = m[3] === '>=' ? val >= n : m[3] === '<=' ? val <= n : m[3] === '>' ? val > n : m[3] === '<' ? val < n : val === n; }
    else r = !!val;
    return m[1] ? !r : r;
  }
  const ok = needs => !needs || needs.every(test);
  function tpl(s) {
    if (typeof s !== 'string') return s;
    s = s.replace(/\{\?([^|}]+)\|([^|}]*)(?:\|([^}]*))?\}/g, (_, c, a, b) => (test(c) ? a : (b || '')));
    s = s.replace(/\{#([a-z_]+)\}/g, (_, k) => lookup(k));
    return s.replace(/\{n\}/g, esc(S.name)).replace(/\{o\}/g, g === 'f' ? 'a' : 'o');
  }
  function chance(r) {
    let p = r.base;
    (r.mods || []).forEach(([cnd, add]) => { if (test(cnd)) p += add; });
    return Math.max(0.05, Math.min(0.95, p));
  }
  const fatigue = () => clamp((62 - S.e) / 62, 0, 1);

  /* ---------- acts ---------- */
  function yearTick() {
    const k = R.cost;
    const cost = Math.max(1, k.base + (S.flags.rent ? k.rent : 0) + (S.flags.baby ? k.baby : 0) + (S.flags.debt ? k.debt : 0) - k.raise * S.cnt.raises);
    const regen = Math.max(2, Math.round(R.regenBase - S.stress / 10));
    const absence = S.actOt * R.absence;
    S.p = clamp(S.p - cost); S.e = clamp(S.e + regen); S.v = clamp(S.v - absence - (R.lifeDrain || 0)); S.stress = clamp(S.stress - R.stressDecay);
    const dead = KEYS.find(x => S[x] <= 0);
    if (dead) S.over = dead;
    return { cost, regen, absence: absence + (R.lifeDrain || 0) };
  }
  function startAct(i) {
    S.act = i;
    const A = D.ACTS[i];
    const tick = i > 0 ? yearTick() : null;
    S.actOt = 0;
    const rng = mulberry32((seed ^ Math.imul(i + 1, 0x9E3779B1)) >>> 0);
    const fixed = D.CARDS.filter(c => c.kind !== 'pool' && c.kind !== 'trigger' && c.act === i && !c.last);
    const finale = D.CARDS.filter(c => c.act === i && c.last);
    // weighted shuffle (Efraimidis–Spirakis): lower key = earlier
    S.poolOrder = D.CARDS.filter(c => c.kind === 'pool' && c.acts.includes(i))
      .map(c => ({ c, k: -Math.log(Math.max(1e-9, rng())) / (c.weight || 1) }))
      .sort((a, b) => a.k - b.k).map(x => x.c);
    const q = fixed.map(c => ({ card: c }));
    for (let k = 0; k < A.pool; k++) q.splice(Math.floor(rng() * (q.length + 1)), 0, { pool: true });
    finale.forEach(c => q.push({ card: c }));
    q.sort((x, y) => (y.card && y.card.first ? 1 : 0) - (x.card && x.card.first ? 1 : 0));   // stable: "first" cards open the act
    S.queue = q;
    S.cursor = i === 0 ? 8 : -1;   // month cursor so labels only move forward inside a year
    return { act: A, index: i, tick };
  }
  const nextPool = () => S.poolOrder.find(c => !S.seen[c.id] && ok(c.needs)) || null;
  function checkTrigger() {
    const q = S.queue;
    if (q.length === 1 && q[0].card && q[0].card.last) return null;   // never interrupt the finale
    if (q.length && q[0].card && q[0].card.first) return null;        // …nor the card that opens the act
    for (const c of D.CARDS) {
      if (c.kind !== 'trigger') continue;
      if ((S.trig[c.id] || 0) >= (c.max || 1)) continue;
      if (c.gap && S.trigAct[c.id] != null && S.act - S.trigAct[c.id] < c.gap) continue;
      if (ok(c.needs)) return c;
    }
    return null;
  }

  /* ---------- view model (what the webcam shows) ---------- */
  function buildView(c) {
    const A = D.ACTS[S.act];
    let theme = A.theme;
    if (typeof theme === 'object') theme = S.flags.rent ? theme.rent : theme.home;
    const h = parseInt((c.time || '10:00').split(':')[0], 10);
    const weather = c.weather || A.weather;
    let sky, light;
    if (h >= 5 && h < 7) { sky = 'dawn'; light = 0.78; }
    else if (h >= 7 && h < 17) { sky = weather === 'gray' ? 'gray' : 'day'; light = weather === 'gray' ? 0.88 : 1; }
    else if (h >= 17 && h < 19) { sky = 'dusk'; light = 0.82; }
    else { sky = 'night'; light = 0.4; }
    if (theme === 'slate' || theme === 'violet') light = Math.min(light, 0.7);
    const amb = c.ambient || null;
    if (amb === 'apagon') light = 0.1;

    const P = ['window', 'clock'];
    if (theme === 'parents') P.push('curtain');
    let mid = A.mid;
    let low = S.flags.baby ? (S.act <= 4 ? 'crib' : 'kid') : (S.flags.laid_off && S.act === 4 ? 'boxes' : (S.act === 7 ? 'plant' : 'shelf'));
    if (amb === 'drill') mid = 'drill';
    if (amb === 'baby') { low = 'cribcry'; mid = null; P.splice(P.indexOf('clock'), 1); }
    else if (amb === 'kid') { low = 'kidwave'; mid = null; P.splice(P.indexOf('clock'), 1); }
    else if (amb === 'mom') { low = 'door'; mid = null; P.splice(P.indexOf('clock'), 1); }
    let left = c.left || (S.flags.sick_now ? 'pills' : (S.cnt.ot >= 2 ? 'stickies' : (S.stress >= 40 ? 'mugs' : null)));
    if (amb === 'camotero') left = 'camotero';
    if (mid) P.push(mid);
    if (low) P.push(low);
    if (left) P.push(left);
    if (theme === 'violet') P.push('neon');
    return {
      theme, sky, light, time: c.time || '10:00', props: P, glasses: S.act >= 2,
      ambient: amb, ambientText: c.ambientText || null, camOff: !!c.camOff, ticker: c.ticker || null, lag: amb === 'lag'
    };
  }

  /* ---------- cards ---------- */
  function resolve(c) {
    if (!c.variants) return c;
    for (const v of c.variants) if (ok(v.needs)) return Object.assign({}, c, v.over);
    return c;
  }
  const NPC = D.NPC;
  function resolveFrom(f) {
    const n = NPC[f] || NPC.sistema;
    return { key: f, name: n.name, av: n.av, col: n.col, app: D.APPS[n.app] || '', appKey: n.app };
  }
  function deliver(c) {
    S.seen[c.id] = 1;
    if (c.kind === 'trigger') { S.trig[c.id] = (S.trig[c.id] || 0) + 1; S.trigAct[c.id] = S.act; }
    const rc = resolve(c);
    if (rc.enter && rc.enter.set) rc.enter.set.forEach(f => { S.flags[f] = 1; });
    const card = Object.assign({}, rc, { text: tpl(rc.text), from: resolveFrom(rc.from) });
    ['A', 'B'].forEach(k => { if (rc[k]) card[k] = Object.assign({}, rc[k], { t: tpl(rc[k].t) }); });
    if (rc.btn) card.btn = tpl(rc.btn);
    card.view = buildView(rc);
    let month;
    if (rc.fix) { month = rc.m; const mi = MONTHS.indexOf(rc.m); S.cursor = Math.max(S.cursor, mi < 0 ? 9 : mi); }
    else { const left = S.queue.length + 1; S.cursor = Math.min(11, S.cursor + Math.max(0, Math.round((11 - S.cursor) / left))); month = MONTHS[Math.max(0, S.cursor)]; }
    card.label = month + ' ' + D.ACTS[S.act].year;
    card.year = D.ACTS[S.act].year;
    S.current = { card, done: false };
    return { kind: 'card', card };
  }

  function next() {
    if (S.over) return { kind: 'end' };
    const trig = S.act >= 0 ? checkTrigger() : null;
    if (trig) return deliver(trig);
    for (;;) {
      if (!S.queue.length) {
        if (S.act >= D.ACTS.length - 1) return { kind: 'end' };
        const a = startAct(S.act + 1);
        return { kind: 'act', index: a.index, year: a.act.year, title: a.act.title, line: tpl(a.act.line), tick: a.tick, view: buildView({ time: '10:00' }) };
      }
      const q = S.queue.shift();
      const c = q.pool ? nextPool() : q.card;
      if (!c || !ok(c.needs)) continue;
      return deliver(c);
    }
  }

  function choose(key) {
    const cur = S.current;
    if (!cur || cur.done) throw new Error('no open card');
    const c = cur.card;
    const k = c.kind === 'fate' ? 'F' : key;
    const op = c.kind === 'fate' ? c : c[k];
    let out = op, win = null;
    if (op.roll) {
      win = rand01(seed, c.id + ':' + k) < chance(op.roll);
      out = Object.assign({}, op, win ? op.win : op.lose);
    }
    const before = { e: S.e, p: S.p, c: S.c, v: S.v };
    const fx = out.fx || {};
    KEYS.forEach(x => { let d = fx[x] || 0; if (d > 0) d = Math.round(d * R.gain); if (d) S[x] = clamp(S[x] + d); });
    S.stress = clamp(S.stress + (out.st || 0) + Math.round(Math.max(0, -(fx.e || 0)) * R.stressFromEnergy));
    if (out.count && out.count.ot) S.actOt += out.count.ot;
    (out.set || []).forEach(f => { S.flags[f] = 1; });
    (out.unset || []).forEach(f => { delete S.flags[f]; });
    Object.entries(out.count || {}).forEach(([n, v]) => { S.cnt[n] = (S.cnt[n] || 0) + v; });
    if (out.raise) S.cnt.raises += out.raise;
    const deltas = {};
    KEYS.forEach(x => { deltas[x] = S[x] - before[x]; });
    const view = Object.assign({}, c.view, { props: c.view.props.concat(out.addProps || []), camOff: false });
    const expr = out.expr || c.expr || 'neutral';
    const res = tpl(out.res);
    S.history.push({ label: c.label, view, expr, fatigue: fatigue() });
    cur.done = true; S.played++;
    const dead = KEYS.find(x => S[x] <= 0) || null;
    if (dead) S.over = dead;
    return { res, expr, deltas, win, dead, view };
  }

  /* ---------- ending ---------- */
  function pickFrames(n) {
    const h = S.history, out = [];
    for (let i = 0; i < n; i++) out.push(h[Math.round(i * (h.length - 1) / (n - 1))]);
    return out;
  }
  function recap() {
    const lines = D.RECAP.filter(r => r.always || ok(r.needs));
    const always = lines.filter(r => r.always);
    const rest = lines.filter(r => !r.always)
      .map((r, i) => ({ r, n: S.cnt[r.id] || 0, i })).sort((a, b) => b.n - a.n || a.i - b.i).slice(0, 2).map(x => x.r);
    return always.concat(rest).map(r => ({ icon: r.icon, text: tpl(r.text) }));
  }
  function finish() {
    const E = D.ENDINGS;
    let end;
    if (S.over) end = E.find(e => e.over === S.over);
    else end = E.find(e => !e.over && !e.special && !e.default && ok(e.needs)) || E.find(e => e.special && ok(e.needs)) || E.find(e => e.default);
    return {
      id: end.id, title: tpl(end.title), roast: tpl(end.roast), story: tpl(end.story), think: tpl(end.think || ''),
      care: end.care || D.CARES[E.indexOf(end) % D.CARES.length],
      over: S.over, kind: S.over ? 'over' : (end.special ? 'special' : end.default ? 'default' : 'state'),
      epilogue: S.flags.vibe ? 'vibe' : S.flags.walk ? 'walk' : null,
      recap: recap(), meters: { e: S.e, p: S.p, c: S.c, v: S.v }, frames: pickFrames(4),
      cnt: Object.assign({}, S.cnt), played: S.played, seed
    };
  }

  /* sim helper: expected effect of an option (for heuristic bots) */
  function expectedFx(card, key) {
    const op = card.kind === 'fate' ? card : card[key];
    const sc = d => (d > 0 ? Math.round(d * R.gain) : d);
    const one = o => { const r = { st: (o.st || 0) + Math.round(Math.max(0, -((o.fx || {}).e || 0)) * R.stressFromEnergy) }; KEYS.forEach(x => { r[x] = sc((o.fx || {})[x] || 0); }); return r; };
    if (!op.roll) return one(op);
    const p = chance(op.roll), w = one(op.win), l = one(op.lose), out = {};
    ['st'].concat(KEYS).forEach(x => { out[x] = p * w[x] + (1 - p) * l[x]; });
    return out;
  }

  return { state: S, next, choose, finish, expectedFx, fatigue, tpl, test };
}

const api = { createGame, mulberry32, hash, rand01, KEYS, clamp, data: D };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.SEL_ENGINE = api;
})(typeof self !== 'undefined' ? self : this);
