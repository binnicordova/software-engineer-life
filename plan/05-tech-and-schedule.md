# 05 · Tech & schedule

## 1. Stack (boring on purpose)

| Layer | Choice | Why |
|---|---|---|
| Framework | **None** — vanilla ES modules | < 40 KB gz, no build step, fastest to iterate with an agent |
| Rendering | SVG string composer (rooms/engineer) + CSS filters; Canvas only for the share card | Crisp at every phone density, tiny payload |
| Data | `scenes.es.json`, `endings.es.json` | Content is data; Tuesday's writing doesn't touch code |
| State | One plain object + `localStorage` (found endings, mute, seed) wrapped in try/catch | Private mode / in-app browsers can throw |
| Audio | WebAudio-synthesized SFX, muted by default | No audio files, no autoplay issues |
| Offline | Service worker precaches shell + current assets | Event Wi-Fi in Lima will be bad |
| Hosting | Cloudflare Pages or Vercel (static) | HTTPS, global CDN, instant deploys, free |
| Analytics | Plausible or GoatCounter + optional Worker counter | Privacy-friendly, custom events |

## 2. File tree

```
/index.html                 shell: 4 screens (title, pick, play, end) + desktop frame
/css/game.css
/js/main.js                 boot, router, desktop/mobile detection, QR on desktop
/js/engine.js               state, seeded RNG (mulberry32), draw logic, effects, endings
/js/ui.js                   HUD, cards, A/B, swipe, deltas, toasts
/js/render/room.js          SVG composer: theme, props, engineer, expressions
/js/render/share.js         Canvas Photo Booth card (1080×1350 and 1080×1920)
/js/audio.js                SFX synth
/js/data/scenes.es.json
/js/data/endings.es.json
/assets/plates|props|npc/*.webp        (Tier B, optional)
/e/<ending-id>/index.html              static OG page per ending (generated)
/og/<ending-id>.png                    1200×630 per ending
/sw.js  /manifest.webmanifest  /icons
/tools/sim.mjs              Monte-Carlo balance (runs engine.js in Node)
/tools/gen-assets.mjs  /tools/cutout.mjs  /tools/optimize.mjs
/tools/build-ending-pages.mjs
```

`engine.js` must be **DOM-free** so `tools/sim.mjs` can import it.

## 3. Engine contract

```js
createGame({ seed, gender, name })           // → game
game.next()   // → { card } | { fate } | { ending }
game.choose('A' | 'B')   // → { deltas, result, expr, ended? }
game.state    // { e,p,c,v, stress, flags, year, i, snaps }
game.share()  // → { endingId, title, roast, care, seed, meters, snaps }
```

Rules: all randomness through the seeded RNG; scenes are filtered by `needs`; pool draws are weighted and never repeat; stress trigger and fate cards are injected by the engine, not hand-placed.

## 4. Share card (client-side)

1. At `snap` scenes the UI stores `{year, theme, expr, fatigue, g}`.
2. `share.js` renders the 4 frames with the **same SVG composer** into an offscreen `<canvas>` via `Image` + `Blob` URL.
3. Draw title/roast/meters with the system font; export PNG.
4. `navigator.canShare({files})` → share the PNG + text; else download the PNG and copy the text.
5. Test especially on iOS Safari and Instagram/WhatsApp in-app browsers (Web Share with files is inconsistent there; keep the download fallback visible).

## 5. Per-ending link previews

`tools/build-ending-pages.mjs` reads `endings.es.json` and writes `/e/<id>/index.html` with `og:title`, `og:description`, `og:image` (`/og/<id>.png`) and a script that redirects to `/?from=<id>`. The share URL is `/e/<id>/` so each ending previews itself in WhatsApp/LinkedIn/X. Generate the 14 OG images once with the same composer.

## 6. Mobile requirements

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, layout in `dvh`, safe-area insets.
- `touch-action: manipulation`; `overscroll-behavior: none`; no text selection on UI.
- Portrait only; landscape → "gira tu teléfono".
- Desktop: phone frame + QR ("juega en tu celular") — organizers may open it on a laptop at the event.
- Performance: first card interactive < 2 s on 4G, JS ≤ 40 KB gz, images lazy per act, no layout shift.

## 7. QA matrix (real devices, not just DevTools)

| Device / browser | Must pass |
|---|---|
| iPhone SE / 13 / 15 Safari | Layout, share sheet, PNG export |
| Android mid-range Chrome (360×800) | Performance, share |
| Instagram, WhatsApp, LinkedIn, TikTok in-app browsers | Loads, plays, share fallback |
| Low-end Android, slow 3G throttle | First card < 4 s, offline repeat visit works |
| Desktop Chrome/Safari | Frame + QR |

## 8. Schedule (today is Sun 11 Oct; event Sat 17 Oct)

| Day | Goal | Output / exit criteria |
|---|---|---|
| **Sun 11** (today) | Plan + visual preview approved; ask Discord about deadline/format; create repo + hosting project; get Gemini key | This folder; hosting URL reserved; Discord answer |
| **Mon 12** | **Engine + UI vertical slice** | `engine.js`, scenes JSON loader, HUD, A/B, 13 preview scenes playable from real data; seed param; game-overs |
| **Tue 13** | **Content + art** | All ~35 scenes + 14 endings in Spanish; `sim.mjs` tuned; Gemini plates/props generated, keyed, optimized (Tier B) |
| **Wed 14** | **Virality layer** | Share card (4:5 + 9:16), Web Share, seed challenge links, per-ending OG pages, analytics, audio, PWA/offline |
| **Thu 15** | **Ship** | Production URL; playtest with 5–8 devs (watch silently); fix top 3 confusions; record video; publish post with #HackTheAndes; **submit both links in Discord** |
| **Fri 16** | **Amplify** | Reply to comments; second video; ask early players to post their cards; bug-fix only; code freeze 22:00 |
| **Sat 17** | **Event** | Phone ready with QR; seed challenge for organizers; no deploys unless P0 |

### If behind — cut in this order
1. Gemini plates (stay Tier A vector) 2. Audio 3. Swipe input 4. Per-ending OG pages (use one OG) 5. PWA/offline 6. Pool cards (24 → 18)

**Never cut:** share card, seed challenge link, real-device QA, production deploy, Discord submission.

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Challenge closed / deadline unknown | Wasted work | Ask Discord today; ship Thu |
| Gemini style drift / dirty cut-outs | Ugly art | Tier A is shippable alone; reference-image every call |
| Share fails in in-app browsers | Kills virality | Download fallback + "copia el texto" always visible |
| Game too long / too punishing | Low completion | Sim, 24 cards, one-tap restart, keep game-overs funny |
| Text too long on small phones | Unreadable | Max 140 chars per card, test 360×640 |
| Event Wi-Fi | Can't load | Service worker, tiny payload, QR to the hosted URL |
| Sensitive topics (health, layoffs) | Backlash | Tone guardrails in [01](01-challenge-and-virality.md#7-content-guardrails-also-protect-the-virality) |
| Brand/IP | Takedown | No logos or real company/people names |
