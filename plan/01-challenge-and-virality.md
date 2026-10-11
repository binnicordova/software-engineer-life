# 01 · Challenge & virality

*"El juego más viral gana."* Nothing else is specified, so this doc is the real design brief. Anything here that is a **heuristic** (not a verified fact) is marked as such.

## 1. What judges can actually see

| Signal | Visible to judges? | We control it via |
|---|---|---|
| Engagement on the #HackTheAndes post (likes, reposts, comments, views) | Yes — it is a required deliverable | Video-first post, strong hook, comment bait ("¿qué final te salió?") |
| Number of plays | Only if we show it | A **real** play counter on the title screen (see §5) |
| Replies/quotes with people's endings | Yes, if they post publicly | Share card + prefilled share text with the hashtag |
| The game at the event | Yes, organizers will play it | Offline-capable PWA, instant load, desktop shows a QR to open on phone |

→ Optimize **two artifacts**: the *post* (gets people to click) and the *result card* (makes them re-post).

## 2. Why this concept is shareable

Viral games usually combine: **identity** ("this is me"), **a result you show off**, **tagging other people**, **zero friction**, **short sessions**.

| Mechanic | Implementation |
|---|---|
| Identity | Every scene is a lived dev/LatAm situation: unpaid trial, quincena, boss "favorcito", mom shouting during the daily, LinkedIn "emocionado de anunciar". |
| Result you show off | **Photo Booth 4-up** of the engineer in 2019 / 2021 / 2023 / 2026 (face visibly more tired) + ending title + roast line. Rendered client-side as a PNG. |
| Collect-them-all | 12+ endings with funny names ("Tech Lead sin Aumento", "Fantasma de Slack", "El que Cerró la Laptop"). Local collection counter "Finales 3/12". |
| Tag someone | Share text asks "¿Qué final te sale a ti? Etiqueta a tu jefe 😅". |
| Challenge a friend | `?s=<seed>` replays the **same sequence of events**; share card includes "Reto: llega a 2026 sin burnout". |
| Zero friction | One URL, no login, no install, first scene in < 2 s on 4G, works in WhatsApp/Instagram/LinkedIn in-app browsers. |
| Short | ~24 cards ≈ 3–5 min. Replay is one tap. |

### Link previews (a hidden growth lever)
When someone shares `https://…/e/techlead-sin-aumento`, WhatsApp/LinkedIn/X should show **that ending's card** (title + image), not a generic logo. Static hosting can't render per-user images, so generate one OG image + one tiny HTML page per ending at build time (12 pages). Details in [05](05-tech-and-schedule.md).

## 3. Result-card spec (the thing people post)

- 1080×1350 (4:5) PNG, plus 1080×1920 for Stories.
- Top: ending title (big) + roast line.
- Center: 2×2 Photo Booth frames with year captions. Frames are rendered from the actual run (snapshots stored at four key scenes).
- Bottom: four tiny meters (final Energía/Plata/Carrera/Vida), `#HackTheAndes`, URL.
- Prefilled text: `Mi vida de dev terminó en “{título}” 😅 ¿Y la tuya? {url} #HackTheAndes`
- Buttons: **Compartir** (Web Share API with the PNG as a file; fallback = download + copy text), **Jugar otra vez**, **Retar a un amigo** (copies seed link).

## 4. The post (required deliverable)

**Format that usually performs (heuristic):** a 15–25 s vertical screen recording with captions, plus a text hook. Post the *same* content on several networks with the hashtag; submit the strongest link to Discord.

### Video script (20 s)

| t | Visual | Caption |
|---|---|---|
| 0–2 s | Webcam close-up, baby crying behind the engineer, notification "Marcos: ¿cámara encendida?" | "Un juego donde decides la vida de un dev (y todo sale mal)" |
| 2–12 s | Fast cuts: A/B taps on 5 relatable cards (horas extra, mentor renuncia, taladro del vecino, ascenso sin aumento, IA) | Short subtitles, no voiceover needed |
| 12–17 s | Face getting more tired across years, flash, Photo Booth strip appears | "¿Qué final te sale?" |
| 17–20 s | Ending title + URL sticker | "Juégalo (4 min) · #HackTheAndes" |

### Copy (Spanish)

**LinkedIn**
> Hice un juego sobre mi vida como dev en Lima (2019 → 2026) en 6 días con IA 🤖
> Eres la webcam: ves a un/a ingeniero/a de software y decides por él/ella. El periodo de prueba sin sueldo, la cuarentena, las horas extra “por favor”, el bebé llorando en el daily, los recortes, el ascenso sin aumento…
> ¿Qué final te sale? El mío: “Tech Lead sin Aumento” 😅
> Juega (4 min, desde el celular): {URL}
> Cuéntame tu final en los comentarios 👇 #HackTheAndes

**X / Threads**
> Hice un juego donde decides la vida de un dev en Lima: 2019 → 2026.
> Pandemia, horas extra, mentor que renuncia, ascenso sin aumento, IA.
> ¿Qué final te sale? {URL} #HackTheAndes

**Instagram / TikTok caption**
> Cámara encendida 📷 ¿Cuántos de estos te pasaron? Link en bio. #HackTheAndes #devlife #lima

## 5. Metrics (so we know if it works)

Use a privacy-friendly analytics script (Plausible/GoatCounter) or a tiny Cloudflare Worker counter. No personal data.

| Event | Why |
|---|---|
| `start`, `complete`, `ending:<id>` | Completion rate; which endings are rare |
| `share_click`, `share_done`, `seed_link_copied` | The real virality funnel |
| `return_from_share` (visit with `?r=1`) | Are shares converting into plays? |

**Heuristic targets** (adjust after playtests): completion ≥ 70 %, share-click ≥ 8 % of completions, avg. session 3–5 min.

**Rule:** a public "🔥 N partidas" counter only if N is real (Worker/KV). Never seed or inflate numbers.

## 6. Seeding plan (honest, no spam)

| When (Lima time) | Channel | Action |
|---|---|---|
| Thu 15 Oct, morning | LinkedIn, X | Main post + video; reply to every comment with their ending |
| Thu 15 Oct, evening | WhatsApp dev groups, Discord servers, Peruvian dev communities | Personal message, not copy-paste blast: "pruébalo y dime tu final" |
| Fri 16 Oct | TikTok/Reels, Reddit (only where self-promo is allowed), friends/ex-colleagues | Second video (different ending); ask 5–10 devs to post their cards |
| Sat 17 Oct | Event | QR code on phone lock screen; challenge organizers with a fixed seed |

Do **not** buy engagement or run bots; it is against the spirit of the challenge and gets you disqualified faster than it gets you likes.

## 7. Content guardrails (also protect the virality)

- No real company names/logos (use "Chat del equipo", "videollamada"). No politicians. The pandemic is "estado de emergencia", nothing partisan.
- Humour punches at *systems and situations*, never at people who are sick, poor or overworked.
- Every game-over ends with a care line ("Descansar no es un logro desbloqueable"). Before launch, optionally add a **verified** local mental-health resource — check the number before shipping, I have not verified one for you.
