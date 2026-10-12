// Generates one tiny static page per ending so shared links preview as THAT ending (WhatsApp/LinkedIn/X).
//   SITE_URL=https://tu-juego.pages.dev node tools/build-ending-pages.mjs
// Without SITE_URL the og:image is relative (fine for local checks; scrapers prefer absolute URLs).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const D = require('../public/js/data.js');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
const neutral = s => s.replace(/\{\?fem\|([^|}]*)\|([^}]*)\}/g, (_, a, b) => `${b}/${a}`).replace(/\{o\}/g, 'o/a').replace(/\{n\}/g, 'tú').replace(/\{[?#][^}]*\}/g, '');
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

for (const e of D.ENDINGS) {
  const title = neutral(e.title), roast = neutral(e.roast);
  const url = site ? `${site}/e/${e.id}/` : `./`;
  const img = site ? `${site}/og.jpg` : `../../og.jpg`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Mi final: ${attr(title)} — Software Engineer LIFE</title>
<meta name="description" content="${attr(roast)} ¿Qué final te sale a ti?">
<meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:title" content="Mi final: ${attr(title)}">
<meta property="og:description" content="${attr(roast)} ¿Qué final te sale a ti? #HackTheAndes">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=../../?from=${e.id}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0B0E1A;color:#F4F1EA;font:700 18px system-ui;text-align:center;padding:24px}a{color:#34D399}</style>
</head><body><p>Mi final: “${attr(title)}”<br><br><a href="../../?from=${e.id}">Jugar Software Engineer LIFE</a></p>
<script>location.replace('../../?from=${e.id}'+location.search.replace('?','&'))</script></body></html>
`;
  const dir = path.join(root, 'e', e.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
console.log(`wrote ${D.ENDINGS.length} ending pages → public/e/*/index.html` + (site ? ` (site ${site})` : ' (relative URLs; set SITE_URL for production)'));
