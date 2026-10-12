// Balance simulator: node tools/sim.mjs [runs=4000]
// Plays the REAL engine with bot policies and reports survival + ending distribution.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../public/js/engine.js');
const D = require('../public/js/data.js');
const RUNS = +process.argv[2] || 4000;
for (const a of process.argv.slice(3)) {            // e.g. cost.base=2 start.p=45 gain=0.9
  const [path, val] = a.split('='); const keys = path.split('.'); let o = D.RULES;
  while (keys.length > 1) o = o[keys.shift()]; o[keys[0]] = +val;
}
const QUIET = process.env.QUIET;
const K = E.KEYS;

const policies = {
  random:   (g, card, r) => (r() < 0.5 ? 'A' : 'B'),
  // always the option with the best career gain (the "grind" player)
  grind:    (g, card) => (g.expectedFx(card, 'A').c >= g.expectedFx(card, 'B').c ? 'A' : 'B'),
  // keeps the weakest meter as high as possible (the "balanced" player)
  balanced: (g, card) => {
    const s = g.state, score = k => { const f = g.expectedFx(card, k); return Math.min(...K.map(x => Math.max(0, Math.min(100, s[x] + (f[x] || 0)))) ) - (f.st || 0) * 0.25; };
    return score('A') >= score('B') ? 'A' : 'B';
  },
  // career + money first, but rests when nearly empty (the realistic overworker)
  workaholic: (g, card) => {
    const s = g.state, f = k => g.expectedFx(card, k);
    if (s.e < 30) return f('A').e >= f('B').e ? 'A' : 'B';
    const sc = k => (f(k).c || 0) + (f(k).p || 0) * 0.7;
    return sc('A') >= sc('B') ? 'A' : 'B';
  },
  // money + career, people last (the road to "solo")
  hermit: (g, card) => {
    const s = g.state, f = k => g.expectedFx(card, k);
    if (s.e < 25) return f('A').e >= f('B').e ? 'A' : 'B';
    const sc = k => (f(k).c || 0) + (f(k).p || 0) - (f(k).v || 0) * 0.6;
    return sc('A') >= sc('B') ? 'A' : 'B';
  },
  // cares about people and body first, money second
  caring:   (g, card) => {
    const s = g.state, score = k => { const f = g.expectedFx(card, k); return (f.v || 0) * 1.2 + (f.e || 0) * 1.1 + (f.p || 0) * 0.8 + (f.c || 0) * 0.4 - (f.st || 0) * 0.4; };
    return score('A') >= score('B') ? 'A' : 'B';
  }
};

function play(policy, seed) {
  const g = E.createGame({ seed, gender: seed % 2 ? 'f' : 'm' });
  const r = E.mulberry32(seed * 7919);
  const seen = [];
  for (let guard = 0; guard < 80; guard++) {
    const n = g.next();
    if (n.kind === 'end') break;
    if (n.kind === 'act') continue;
    seen.push(n.card.id);
    const out = g.choose(policies[policy](g, n.card, r));
    if (out.dead) break;
  }
  return { fin: g.finish(), seen, s: g.state };
}

const pct = (n, d) => (100 * n / d).toFixed(1).padStart(5) + '%';
const allEndings = new Set(D.ENDINGS.map(e => e.id));
const reached = new Set();
for (const name of Object.keys(policies)) {
  const res = []; for (let i = 1; i <= RUNS; i++) res.push(play(name, i * 2654435761 >>> 0));
  const alive = res.filter(r => !r.fin.over);
  const dist = {}; res.forEach(r => { dist[r.fin.id] = (dist[r.fin.id] || 0) + 1; reached.add(r.fin.id); });
  const avg = f => (res.reduce((a, r) => a + f(r), 0) / res.length).toFixed(1);
  console.log(`\n== ${name.padEnd(10)} survive ${pct(alive.length, RUNS)} | cards ${avg(r => r.s.played)} | final e/p/c/v ${K.map(k => avg(r => r.s[k])).join('/')} | stress ${avg(r => r.s.stress)}`);
  const has = f => pct(res.filter(r => r.s.flags[f]).length, RUNS).trim();
  const anyDx = pct(res.filter(r => (r.s.cnt.dx || 0) > 0).length, RUNS).trim();
  console.log(`   family · partner ${has('partner')} baby ${has('baby')} avg strain ${avg(r => r.s.cnt.strain || 0)} max>=4 ${pct(res.filter(r => (r.s.cnt.strain||0) >= 4).length, RUNS).trim()} missed ${avg(r => r.s.cnt.missed || 0)}`);
  console.log(`   threads · dx ${anyDx} (avg ${avg(r => r.s.cnt.dx || 0)}) gallbladder ${has('gallbladder')} | separated ${has('separated')} divorced ${has('divorced')} therapy ${has('therapy')} | pip ${has('pip')} conflict ${has('conflict')} jobless_ever ${has('jobless_ever')} | mortgage ${has('mortgage')} car ${has('car_loan')} rent_alone ${has('rent_alone')} debt ${has('debt')}`);
  if (!QUIET) Object.entries(dist).sort((a, b) => b[1] - a[1]).forEach(([id, n]) => console.log('   ' + id.padEnd(16), pct(n, RUNS)));
  else console.log('   ' + Object.entries(dist).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => id + ' ' + pct(n, RUNS).trim()).join(' · '));
}
const missing = [...allEndings].filter(id => !reached.has(id));
console.log('\nendings never reached by any bot:', missing.length ? missing.join(', ') : 'none');

// card frequency (random bot) — are any cards dead weight?
const freq = {}; for (let i = 1; i <= 2000; i++) play('random', i * 40503 >>> 0).seen.forEach(id => (freq[id] = (freq[id] || 0) + 1));
const never = D.CARDS.filter(c => !freq[c.id]).map(c => c.id);
console.log('cards never shown in 2000 random runs:', never.length ? never.join(', ') : 'none');
const rows = Object.entries(freq).sort((a, b) => a[1] - b[1]).slice(0, 6).map(([id, n]) => `${id} ${(n / 20).toFixed(0)}%`);
console.log('rarest shown:', rows.join(' · '));
