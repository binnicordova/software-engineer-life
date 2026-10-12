// Content lint: node tools/check.mjs
// Catches typos in conditions/flags/tokens and keeps copy short enough for a phone.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const D = require('../public/js/data.js');
const E = require('../public/js/engine.js');

const errors = [], warns = [];
const err = m => errors.push(m), warn = m => warns.push(m);
const COND = /^(!)?([a-z_0-9]+)(?:(>=|<=|==|>|<)(-?\d+))?$/;
const STATS = new Set(['e', 'p', 'c', 'v']);
const EXPR = new Set(['neutral', 'happy', 'tired', 'stressed', 'shock', 'sick', 'relief']);
const AMB = new Set(['mom', 'lag', 'camotero', 'drill', 'baby', 'kid', 'apagon']);
const COUNTERS = new Set(['ot', 'yes', 'extra', 'body', 'learn', 'cam', 'bound', 'raises', 'strain', 'dx', 'loans', 'missed', 'unemp', 'care', 'eng', 'jumps', 'wall']);
const DERIVED = new Set(['stress', 'act', 'mk', 'tenure', 'fem']);   // engine-computed values usable in conditions
const OUT_KEYS = new Set(['fx', 'st', 'mk', 'set', 'unset', 'count', 'raise', 'newjob', 'res', 'expr', 'addProps', 'roll', 'win', 'lose', 't']);

// flags that are ever set, to catch conditions on flags nobody sets
const setFlags = new Set();
const grabSets = o => { if (!o || typeof o !== 'object') return; (o.set || []).forEach(f => setFlags.add(f)); if (o.enter) (o.enter.set || []).forEach(f => setFlags.add(f)); ['win', 'lose', 'A', 'B'].forEach(k => grabSets(o[k])); };
D.CARDS.forEach(c => { grabSets(c); (c.variants || []).forEach(v => grabSets(v.over)); });

const condOk = (cond, where) => {
  const m = COND.exec(cond);
  if (!m) return err(`${where}: bad condition "${cond}"`);
  const n = m[2];
  if (STATS.has(n) || DERIVED.has(n) || COUNTERS.has(n)) return;
  const base = n.endsWith('_ago') ? n.slice(0, -4) : n;    // <flag>_ago = years since that flag was set
  if (!setFlags.has(base)) err(`${where}: condition uses flag "${base}" that nothing sets`);
};
const textOk = (s, where, max) => {
  if (typeof s !== 'string') return;
  // worst-case RENDERED length: an inline {?cond|a|b} shows only one branch, tokens show ~a name / a number
  const shown = s.replace(/\{\?[^|}]+\|([^|}]*)(?:\|([^}]*))?\}/g, (_, a, b) => (a.length >= (b || '').length ? a : (b || ''))).replace(/\{n\}/g, 'x'.repeat(14)).replace(/\{o\}/g, 'a').replace(/\{#[a-z_]+\}/g, '12');
  if (shown.length > max) warn(`${where}: ${shown.length} chars (> ${max}): ${shown.slice(0, 50)}…`);
  for (const m of s.matchAll(/\{\?([^|}]+)\|/g)) condOk(m[1], where);
  const stripped = s.replace(/\{\?[^}]*\}/g, '').replace(/\{(n|o|#[a-z_]+)\}/g, '');
  if (/[{}]/.test(stripped)) err(`${where}: stray brace in "${s}"`);
};
const fxOk = (fx, where) => Object.entries(fx || {}).forEach(([k, v]) => { if (!STATS.has(k)) err(`${where}: unknown stat ${k}`); if (Math.abs(v) > 25) warn(`${where}: big effect ${k}${v}`); });
const outOk = (o, where) => {
  if (!o) return err(`${where}: missing`);
  fxOk(o.fx, where);
  Object.keys(o).forEach(k => { if (!OUT_KEYS.has(k) && !['from', 'enter'].includes(k)) err(`${where}: unknown outcome key "${k}"`); });
  if (o.mk != null && (typeof o.mk !== 'number' || Math.abs(o.mk) > 20)) warn(`${where}: odd mk ${o.mk}`);
  if (o.newjob && !(o.count && o.count.jumps)) warn(`${where}: newjob without count.jumps (NPCs/tenure won't line up)`);
  if (o.expr && !EXPR.has(o.expr)) err(`${where}: unknown expr ${o.expr}`);
  Object.keys(o.count || {}).forEach(k => { if (!COUNTERS.has(k)) err(`${where}: unknown counter ${k}`); });
  textOk(o.res, where + '.res', 150);
  if (!o.res) err(`${where}: missing res`);
};

// risk groups + chronic conditions (config blocks in data.js)
const RISK = D.RISK || {};
Object.entries(RISK).forEach(([g, cfg]) => { (cfg.mods || []).forEach(([cn]) => condOk(cn, `risk ${g}.mods`)); if (!D.CARDS.some(c => c.kind === 'risk' && c.group === g)) warn(`risk group ${g}: no cards`); });
(D.CONDITIONS || []).forEach(cd => { [cd.id, cd.care].forEach(f => { if (!setFlags.has(f)) err(`condition ${cd.id}: flag "${f}" is never set`); }); });
const unsetOk = (o, where) => { if (!o) return; (o.unset || []).forEach(f => { if (!setFlags.has(f)) warn(`${where}: unset "${f}" that nothing sets`); }); };

const ids = new Set();
for (const c of D.CARDS) {
  const w = `card ${c.id}`;
  if (ids.has(c.id)) err(`${w}: duplicate id`); ids.add(c.id);
  if (!D.NPC[c.from]) err(`${w}: unknown npc ${c.from}`);
  if (!['anchor', 'pool', 'trigger', 'fate', 'risk'].includes(c.kind)) err(`${w}: bad kind`);
  if ((c.kind === 'pool' || c.kind === 'risk') ? !c.acts : (c.kind !== 'trigger' && c.act == null)) err(`${w}: missing act(s)`);
  if (c.kind === 'risk' && !RISK[c.group]) err(`${w}: risk card needs a group in D.RISK (got ${c.group})`);
  if (c.chain && c.kind !== 'trigger') err(`${w}: chain only applies to triggers`);
  if (c.ambient && !AMB.has(c.ambient)) err(`${w}: unknown ambient ${c.ambient}`);
  if (!EXPR.has(c.expr)) err(`${w}: unknown expr ${c.expr}`);
  (c.needs || []).forEach(n => condOk(n, w + '.needs'));
  textOk(c.text, w + '.text', 150);
  const sides = c.kind === 'fate' ? [] : ['A', 'B'];
  sides.forEach(k => {
    textOk(c[k].t, `${w}.${k}.t`, 52);
    if (c[k].roll) { (c[k].roll.mods || []).forEach(([cn]) => condOk(cn, w + '.roll')); outOk(c[k].win, `${w}.${k}.win`); outOk(c[k].lose, `${w}.${k}.lose`); }
    else { outOk(c[k], `${w}.${k}`); unsetOk(c[k], `${w}.${k}`); }
  });
  if (c.kind === 'fate') { (c.roll.mods || []).forEach(([cn]) => condOk(cn, w + '.roll')); outOk(c.win, w + '.win'); outOk(c.lose, w + '.lose'); }
  (c.variants || []).forEach((v, i) => {
    (v.needs || []).forEach(n => condOk(n, `${w}.variants[${i}].needs`));
    textOk(v.over.text, `${w}.variants[${i}].text`, 150);
    ['A', 'B'].forEach(k => { if (v.over[k]) { textOk(v.over[k].t, `${w}.v${i}.${k}.t`, 52); v.over[k].roll ? (outOk(v.over[k].win, `${w}.v${i}.${k}.win`), outOk(v.over[k].lose, `${w}.v${i}.${k}.lose`)) : outOk(v.over[k], `${w}.v${i}.${k}`); } });
  });
}
D.ENDINGS.forEach(e => { if (!e.think) err(`ending ${e.id}: missing think (Para pensar prompt)`); textOk(e.think, `ending ${e.id}.think`, 130); (e.needs || []).forEach(n => condOk(n, `ending ${e.id}`)); textOk(e.title, `ending ${e.id}.title`, 40); textOk(e.roast, `ending ${e.id}.roast`, 90); textOk(e.story, `ending ${e.id}.story`, 170); });
[['ROLES', D.ROLES], ['LEVELS', D.LEVELS]].forEach(([n, L]) => { if (!L || !L.length || L[L.length - 1].min !== 0 || L.some((x, i) => i && x.min >= L[i - 1].min)) err(`D.${n}: must be descending by min and end at 0`); });
D.ACTS.forEach((a, i) => { textOk(a.line, `act ${i}.line`, 120); if (a.pool > D.CARDS.filter(c => c.kind === 'pool' && c.acts.includes(i)).length) warn(`act ${i}: pool larger than candidates`); });
D.RECAP.forEach(r => { (r.needs || []).forEach(n => condOk(n, `recap ${r.id}`)); });

// smoke: the engine can render every card's templates in a neutral and a loaded state
for (const flagsOn of [false, true]) {
  const g = E.createGame({ seed: 7, gender: 'f', name: 'Camila' });
  if (flagsOn) { setFlags.forEach(f => (g.state.flags[f] = 1)); Object.keys(g.state.cnt).forEach(k => (g.state.cnt[k] = 3)); }
  for (const c of D.CARDS) {
    [c.text, c.A && c.A.t, c.B && c.B.t].forEach(t => { if (t) g.tpl(t); });
  }
}

const perAct = D.ACTS.map((a, i) => ({ y: a.year, anchors: D.CARDS.filter(c => c.act === i && c.kind !== 'pool' && !c.last).length, pool: D.CARDS.filter(c => c.kind === 'pool' && c.acts.includes(i)).length, risk: D.CARDS.filter(c => c.kind === 'risk' && c.acts.includes(i)).length, draw: a.pool }));
const named = D.CARDS.filter(c => JSON.stringify(c).includes('{n}')).length;
console.log(`name {n} appears in ${named}/${D.CARDS.length} scenes (${Math.round(100 * named / D.CARDS.length)}%)`);
console.log('cards:', D.CARDS.length, '| endings:', D.ENDINGS.length, '| flags set:', [...setFlags].length);
console.table(perAct);
warns.forEach(w => console.log('warn ', w));
errors.forEach(e => console.log('ERROR', e));
console.log(errors.length ? `\n${errors.length} error(s)` : '\ncontent OK', `(${warns.length} warning(s))`);
process.exit(errors.length ? 1 : 0);
