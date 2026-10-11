/* Renders og.png (1200×630) and the PWA icons from the game's own renderer.
 * Run it in the browser console on http://localhost:5173 (any page of the game) — it returns
 * { "og.png": dataURL, "icon-180.png": …, "icon-192.png": …, "icon-512.png": … }.
 * Save them into public/ (see README → "Regenerate assets"); convert og.png → og.jpg (sips) to keep it under ~300 KB.
 */
(async () => {
  const R = SEL_RENDER, FONT = 'ui-rounded,"SF Pro Rounded",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
  const load = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src; });
  const svgImg = svg => load('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const out = {};

  /* ---- og.png ---- */
  {
    const W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const bg = c.createRadialGradient(300, 80, 60, 400, 250, 900); bg.addColorStop(0, '#222A5C'); bg.addColorStop(1, '#0B0E1A');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = '#34D399'; c.beginPath(); c.arc(78, 78, 10, 0, 7); c.fill();
    c.fillStyle = '#cfd2e6'; c.font = `700 24px ${FONT}`; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '4px';
    c.fillText('CÁMARA ENCENDIDA  ·  #HACKTHEANDES', 102, 79); if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.textBaseline = 'alphabetic'; c.fillStyle = '#F4F1EA'; c.font = `900 118px ${FONT}`;
    c.fillText('Software', 70, 230); c.fillText('Engineer', 70, 340);
    c.fillStyle = '#34D399'; c.fillText('LIFE', 70, 450);
    c.fillStyle = '#E2E4F0'; c.font = `700 36px ${FONT}`; c.fillText('Eres la webcam de un dev en Lima.', 70, 520);
    c.fillStyle = '#A3A5B8'; c.font = `600 30px ${FONT}`; c.fillText('2019 → 2026 · Elige A o B · ¿Qué final te sale?', 70, 566);
    const frames = [
      { view: { theme: 'parents', sky: 'day', light: 1, time: '09:12', props: ['window', 'curtain', 'frame', 'clock', 'shelf'] }, expr: 'happy', fatigue: 0, label: 'OCT 2019' },
      { view: { theme: 'sunrise', sky: 'dawn', light: 1, time: '08:30', props: ['window', 'clock', 'helmet', 'stickies'], glasses: true }, expr: 'tired', fatigue: 0.85, label: 'OCT 2026' }
    ];
    const imgs = await Promise.all(frames.map((f, i) => svgImg(R.frameSvg(f, 'f', 'og' + i, 520))));
    c.save(); c.translate(960, 315); c.rotate(0.07); c.translate(-960, -315);
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 40; c.shadowOffsetY = 18; c.fillStyle = '#F4EFE6'; rr(c, 820, 38, 300, 560, 20); c.fill(); c.shadowColor = 'transparent';
    imgs.forEach((im, i) => { const y = 58 + i * 266; c.save(); rr(c, 840, y, 260, 232, 10); c.clip(); c.drawImage(im, 840, y - 14, 260, 260); c.restore(); c.fillStyle = '#6c655c'; c.font = '800 18px ui-monospace,Menlo,monospace'; c.fillText(frames[i].label, 842, y + 252); });
    c.restore();
    out['og.png'] = cv.toDataURL('image/png');
  }

  /* ---- icons ---- */
  const icon = await load('icon.svg');
  for (const px of [180, 192, 512]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = px; const c = cv.getContext('2d');
    c.drawImage(icon, 0, 0, px, px); out[`icon-${px}.png`] = cv.toDataURL('image/png');
  }
  return JSON.stringify(out);
})();
