/* Software Engineer LIFE — tiny synthesized sound effects (no audio files). Muted by default; needs a user gesture to start. */
(function (root) {
'use strict';
const A = { ctx: null, on: false, master: null };

function ensure() {
  if (!A.ctx) {
    try {
      const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return false;
      A.ctx = new AC(); A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination);
    } catch (e) { return false; }
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  return true;
}
function tone(o) {
  const c = A.ctx, t0 = c.currentTime + (o.delay || 0), dur = o.t || 0.12;
  const osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib; lg.gain.value = o.f * 0.04; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
  const v = o.v == null ? 0.12 : o.v;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(v, t0 + Math.min(0.02, dur / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(A.master); osc.start(t0); osc.stop(t0 + dur + 0.05);
}
function noise(o) {
  const c = A.ctx, t0 = c.currentTime + (o.delay || 0), dur = o.t || 0.08;
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  s.buffer = buf; f.type = o.hp ? 'highpass' : 'lowpass'; f.frequency.value = o.hp || o.lp || 3000;
  g.gain.value = o.v == null ? 0.2 : o.v; s.connect(f); f.connect(g); g.connect(A.master); s.start(t0);
}
const FX = {
  tap:      () => tone({ f: 520, t: 0.05, v: 0.07 }),
  knock:    () => { tone({ f: 880, t: 0.08, v: 0.1 }); tone({ f: 1320, t: 0.1, v: 0.08, delay: 0.09 }); },
  choose:   k => tone({ f: k === 'B' ? 660 : 494, to: k === 'B' ? 880 : 740, t: 0.1, type: 'triangle', v: 0.1 }),
  shutter:  () => { noise({ t: 0.05, hp: 2500, v: 0.28 }); noise({ t: 0.09, hp: 1800, v: 0.2, delay: 0.07 }); },
  good:     () => [523, 659, 784].forEach((f, i) => tone({ f, t: 0.14, type: 'triangle', v: 0.09, delay: i * 0.08 })),
  bad:      () => { tone({ f: 330, to: 160, t: 0.32, type: 'sawtooth', v: 0.07 }); },
  cry:      () => { [0, 0.5].forEach(d => tone({ f: 640, to: 470, t: 0.42, type: 'sawtooth', v: 0.06, vib: 9, delay: d })); },
  whistle:  () => tone({ f: 880, to: 1250, t: 0.9, v: 0.07, vib: 6 }),
  drill:    () => { tone({ f: 95, t: 0.9, type: 'sawtooth', v: 0.07, vib: 40 }); noise({ t: 0.9, lp: 1400, v: 0.12 }); },
  lag:      () => [0, 0.1, 0.19, 0.33].forEach(d => tone({ f: 180 + Math.random() * 500, t: 0.05, type: 'square', v: 0.05, delay: d })),
  blackout: () => tone({ f: 420, to: 55, t: 0.85, v: 0.1 }),
  door:     () => { tone({ f: 190, to: 130, t: 0.12, type: 'square', v: 0.07 }); tone({ f: 190, to: 130, t: 0.12, type: 'square', v: 0.07, delay: 0.16 }); },
  wave:     () => [0, 0.12].forEach((d, i) => tone({ f: 700 + i * 160, t: 0.1, type: 'triangle', v: 0.07, delay: d }))
};
A.play = (name, arg) => { if (!A.on || !ensure() || !FX[name]) return; try { FX[name](arg); } catch (e) { /* audio is garnish */ } };
A.set = on => { A.on = !!on; if (on) { ensure(); A.play('tap'); } };

if (typeof module !== 'undefined' && module.exports) module.exports = A; else root.SEL_AUDIO = A;
})(typeof self !== 'undefined' ? self : this);
