# Software Engineer LIFE — developer guide

This is the developer documentation. The project landing page (objective, immersion, screenshots) is the [README](../README.md).

Mobile-first narrative game for the **Hack the Andes "Vibecodea un juego"** challenge. You are the MacBook webcam of a software engineer in Lima (2019 → 2026); every scene is a notification with two choices (A/B). The result is a shareable **Photo Booth strip**.

- **Play:** https://binnicordova.github.io/software-engineer-life/ — or open `public/index.html` (serve it, below). On a phone it is full-bleed; on desktop it sits in a phone frame with a QR code.
- **Plan & rationale:** [`plan/`](../plan/README.md) · **Visual preview of the plan:** [`plan/index.html`](../plan/index.html)

## Run it

```bash
python3 -m http.server 5173 --directory public      # → http://localhost:5173
```

No build step, no dependencies. (Opening `public/index.html` straight from disk also works; only the service worker/offline cache needs http(s)/localhost.)

## Layout

```
public/
  index.html            shell: title · pick · play · end · overlays
  css/game.css          styles (phone-first; desktop = phone frame)
  js/data.js            ALL content: acts, cast, 49 scenes, 15 endings, recap, tuning knobs
  js/engine.js          DOM-free game logic (seeded RNG, scheduling, conditions, endings)
  js/render.js          SVG webcam rooms + engineer + Photo Booth share card (canvas)
  js/audio.js           synthesized SFX (no audio files)
  js/app.js             UI controller, game loop, sharing
  sw.js, manifest.webmanifest, icon*.png|svg, og.jpg
  e/<ending>/index.html one tiny page per ending → link previews that name YOUR ending
tools/
  check.mjs             content lint (conditions, flags, lengths, templates)
  sim.mjs               Monte-Carlo balance simulator (runs the real engine with bot policies)
  build-ending-pages.mjs  regenerates public/e/*
  make-assets.js        browser-console script that renders og + icons
```

## Day-to-day commands

```bash
node tools/check.mjs                 # lint content — run after editing data.js
node tools/sim.mjs 4000              # balance: survival + ending distribution per bot
node tools/sim.mjs 4000 gain=0.9 cost.base=3     # try tuning knobs without editing files
SITE_URL=https://your-game.pages.dev node tools/build-ending-pages.mjs   # absolute og: URLs
```

### Writing content (`public/js/data.js`)

- **Text tokens:** `{n}` name · `{o}` o/a · `{#ot}` counter · `{?flag|si|no}` inline condition (`ot>=3`, `!laid_off`, `c>=60`…).
- **Outcome keys:** `fx{e,p,c,v}` · `st` (hidden stress) · `set[]`/`unset[]` flags · `count{ot,bound,…}` · `raise` · `res` · `expr` · `addProps`.
- **Scene kinds:** `anchor` (fixed per act; `first`/`last`/`fix`) · `pool` (random, by `acts`) · `trigger` (hidden-state driven) · `fate` (one button, rolled).
- **Variants:** `variants:[{ needs:[…], over:{ …fields } }]` swap text/options by flags — this is how callbacks work (mentor → referral, baby → crib, etc.).
- **Tuning knobs:** `D.RULES` (start values, yearly costs, gain scale, stress coupling, absence). Change → `node tools/sim.mjs`.

## Deploy (GitHub Pages, automatic)

Every push to `main` runs [`.github/workflows/pages.yml`](../.github/workflows/pages.yml):

1. `node tools/check.mjs` — the content lint is a quality gate (fails the deploy on errors).
2. Rewrites `og:image` to an absolute URL and regenerates the 15 `/e/<ending>/` pages with the real site URL (so shared links preview correctly, on any domain or fork).
3. Publishes the **`public/`** folder.

Live: **https://binnicordova.github.io/software-engineer-life/**

Any other static host also works with `public` as the publish directory (Cloudflare Pages, Netlify, Vercel). When you change `css/` or `js/`, bump the `?v=N` query on the `<script>`/`<link>` tags in `public/index.html` so browsers drop their cached copy.

Optional: add a privacy-friendly analytics script (Plausible/GoatCounter) to `index.html`; the game already emits `start`, `complete`, `share_click`, `share_done`, `share_download`, `challenge_copy`.

### Regenerate assets

`tools/make-assets.js` renders `og` + icons from the game's own renderer: paste it into the browser console on the running game, save the returned PNGs into `public/`, then `sips -s format jpeg -s formatOptions 82 og.png --out og.jpg` (WhatsApp prefers link-preview images under ~300 KB).

## Challenge links

- `?s=<seed36>` replays the **same world** (pool order + dice) — the end screen's *Retar a un amigo* copies it.
- `?from=<ending-id>` shows "Un amigo terminó en “…”. ¿Y tú?" on the title (used by the `/e/<id>/` pages).

## QA checklist (before posting)

- [ ] iPhone Safari + Android Chrome: play to an ending, tap **Compartir mi final** (share sheet with the PNG), **Retar a un amigo**
- [ ] Instagram / WhatsApp / LinkedIn / TikTok in-app browsers: loads, plays, share falls back to download + copied text
- [ ] 360×640 and 390×844 portrait; landscape shows "gira tu teléfono"
- [ ] Offline: load once, switch to airplane mode, reload (service worker)
- [ ] Paste a `/e/techlead/` link into WhatsApp: title + image preview shows
- [ ] Sound toggle on a real phone (muted by default; needs a tap)

## Known limits / next steps

- Art is 100 % vector; Gemini plates/props are an optional upgrade (see `plan/04-art-direction-and-gemini.md`). The renderer already has named slots for them.
- No swipe input (tap + keyboard A/B/←/→ only).
- Share card is 4:5; a 9:16 Stories variant is a small addition in `render.js`.
- No public play counter (would need a tiny backend); never show a fake one.
- Balance numbers come from bots, not humans — watch the first 20 real completions and tweak `D.RULES`.
