# Software Engineer LIFE — *cámara encendida*

> Plan v0.1 · written Sun 11 Oct 2026 · Hack the Andes challenge **"Vibecodea un juego. Gana US$100"**
> Visual preview: open [`index.html`](index.html) (best at phone size — it is a playable vertical slice).

## TL;DR

- **What:** a 4-minute, mobile-only, Spanish-language narrative game. You are the **MacBook webcam** of a software engineer in Lima, 2019 → 2026. Every scene is a notification + **two choices (A/B)**. Life happens to them: unpaid trial period, the 2020 quarantine, unpaid overtime, the mentor quits, a baby crying in the stand-up, mass layoffs, promotion with no raise, the AI agent that "doubles your output".
- **Why it can win:** the judging rule is *"el juego más viral gana"*. So the game is designed as a **shareable identity quiz** ("¿Qué dev eres?") with a **Photo Booth strip** as the result card — not as a long game. Everything else (art, systems) serves that.
- **How it looks:** minimalist flat vector scenes seen through a webcam (wide-angle, vignette, grain, laptop glow). The *image itself is the HUD*: as Energía drops the feed desaturates and darkens.
- **How we build it:** vanilla JS + one JSON of scenes, static hosting, no build step. Vector art ships first (it is what the preview already shows); **Gemini-generated plates/props are a drop-in upgrade**, never a blocker.
- **Timeline:** ship a public URL + post on **Thu 15 Oct**, amplify Fri 16, be demo-ready Sat 17.

## The challenge in 30 seconds

Source: [hacktheandes.com/game](https://hacktheandes.com/game)

| Fact | Detail |
|---|---|
| Task | Build a game with an agent and any tools you like; organizers will play it on event day |
| Event | **Sat 17 Oct 2026, Lima** (hackathon 17–18 Oct, 30 h, 100 people) |
| Deliverables | (1) a social post with **#HackTheAndes** inviting people to play, (2) the playable link — both pasted in the Hack the Andes **Discord** |
| Winner | *"El juego más viral gana"* — how virality is measured is **not specified** |
| Prize | US$100 + direct pass to the hackathon |

### Open risks (read these)

1. **Deadline is not stated.** The page footer says *"Postulaciones abiertas · Hasta el 9 oct"* — that date has already passed. It may refer to hackathon applications only, but **ask in Discord today** whether the game challenge is still open and when entries close. Until answered, treat **Thu 15 Oct** as the internal deadline.
2. **"Viral" is unmeasured**, so assume judges look at the public post (likes, shares, comments, views) and maybe play counts. We optimize for both the *post* and the *game* ([01](01-challenge-and-virality.md)).
3. **Format unspecified** — a link that opens instantly on any phone is the safest interpretation.

## Assumptions I made (change any of them)

| # | Assumption | Why |
|---|---|---|
| 1 | "Graduated engineer of 5 years" = a **5-year degree** (typical in Peru). In **2019** they are a fresh *egresado/a*, just survived 3 unpaid "periodo de prueba" months, finally on payroll at **S/ 1,800**, **living with their parents**. | Fits "bad paid / non-salary first 3 months" + "life with your parents". |
| 2 | Timeline **2019 → 2026** (today). The last scene is a wink at this very hackathon. | Lets the pandemic, layoffs and AI all happen to the same person. |
| 3 | **Spanish, Lima-flavoured** (S/, quincena, camotero, menú de S/ 10). | Organizers play it in Lima; local detail is what gets shared. |
| 4 | Protagonist is **Camila or Diego**; the player picks. Writing uses neutral phrasing so one script serves both. | Your brief: "female or male". |
| 5 | **Tap A/B** is the primary input; swipe left/right is a bonus. | Your brief: "option A or option B". |
| 6 | The baby is a **consequence of choices** (not forced). Players without a baby get other webcam-chaos gags (drilling neighbour, camotero whistle, mom shouting *¡Almuerzo!*). | Keeps replay value and avoids alienating players. |

## Design pillars

1. **Relatable beats clever.** Every scene must make someone say *"esto me pasó"*.
2. **Short and shareable.** 24 cards, ~4 min, one tap per decision, result in a share-ready image.
3. **No free lunch.** Every option costs something. Unfair-by-design systems (salary that never rises, responsibilities that grow) are the joke *and* the mechanic.
4. **Webcam as the only camera.** Never leave the first-person-laptop view; it is the identity of the game.
5. **Minimal but immersive.** Few shapes, strong light, living details (blink, breath, glow, crying baby).
6. **Care at the end.** Dark humour, never cruelty. Endings finish with a gentle line; no mockery of burnout or illness.

## Build status (as built, 11 Oct 2026)

The game now exists: **[`../public/index.html`](../public/index.html)** (run notes, deploy and tuning in the root [`README.md`](../README.md)). It follows this plan, with these deliberate differences:

| Plan said | As built | Why |
|---|---|---|
| ~35 scenes, 14 endings | **49 scenes, 15 endings** (+ *El Cuerpo Cobra*) | Narrative callbacks need more material: mentor → referral → you mentor someone; ignored health scare → collapse |
| Finale choice decides the ending | Finale choice is an **epilogue stamp**; Vibecoder / Caminante are low-priority specials | A coin flip was deciding ~90 % of endings in the first prototype |
| Yearly tick: Plata + Energía | Also **Vida erosion** (`lifeDrain`) and **ausencias** (Vida lost per “un ratito más”) shown on the year card | Makes overwork cost relationships and makes the “Solo” ending reachable |
| Gain/loss symmetric | Positive effects scaled ×0.85 (`D.RULES.gain`) and burning Energía raises hidden stress | Simulation showed a “keep the weakest meter up” player never failed |
| Fate card only for layoffs | Layoff scene also **turns the camera off** (“la webcam escucha”) | Uses the webcam metaphor as a mechanic, not just a skin |
| Share card with title + frames | Adds **“Lo que la webcam recuerda”** (e.g. *Aumentos conseguidos: 0*) and a story paragraph | Personal, comparable, quotable numbers are what people post |
| Per-ending OG images | Per-ending **pages** with their own title/description, one shared `og.jpg` | Gets most of the link-preview value without a render pipeline |
| Swipe input, Gemini art, play counter | **Not built** | Cut list; renderer has slots for Gemini plates later |
| Fixed card order inside an act | Contract/pandemic/layoff cards **open their act**; month labels only move forward | Random pool cards were appearing before “Hoy firma” |

Balance (4,000 bot runs each, `node tools/sim.mjs`): random player reaches 2026 ~63 % of the time; pure career-grind 0 % (burnout); pure “people first” ~7 % (ghosteado); all 15 endings reachable.

## Documents

| Doc | Contents |
|---|---|
| [01 · Challenge & virality](01-challenge-and-virality.md) | What "viral" means here, share mechanics, post copy, video script, seeding plan, metrics |
| [02 · Game design](02-game-design.md) | Loop, stats, hidden stress, event system, randomness, endings, balancing sim, scene schema |
| [03 · Narrative & scenarios](03-narrative-and-scenarios.md) | Cast, 8 acts, ~35 scenes with A/B + effects, ambient gags, ending copy |
| [04 · Art & Gemini pipeline](04-art-direction-and-gemini.md) | Webcam look spec, palette, layers, Gemini prompts, chroma-key, budgets, fallback |
| [05 · Tech & schedule](05-tech-and-schedule.md) | Stack, file tree, share-card generation, OG pages, PWA, QA matrix, day-by-day plan, cut list |
| [`index.html`](index.html) | Mobile preview: title → pick → 13 playable scenes → ending/share card |

## Decisions I need from you

1. Confirm assumption **#1** (timeline reading) — it changes the first scene only.
2. Ask in Discord about the **deadline** (see risk 1).
3. Provide a **Gemini API key / AI Studio access** when we reach Tuesday's asset run, and tell me which image model your key can use (I have not verified model IDs).
4. Pick **hosting** (recommended: Cloudflare Pages or Vercel — free, HTTPS, instant).
