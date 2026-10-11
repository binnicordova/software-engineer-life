# 04 · Art direction & Gemini asset pipeline

## 1. Look in one sentence

**Flat, minimal vector rooms seen through a laptop webcam at night-or-day, lit mostly by the screen glow, with one living detail per scene.**

## 2. Webcam look spec (the "immersive" part)

| Property | Value | How |
|---|---|---|
| Framing | Portrait crop of a 720p webcam ("modo retrato"); head+shoulders centered, head ≈ 1/3 of width | Fixed camera, never moves |
| Lens | Slight wide-angle: scale 1.02, edges softer | CSS transform + vignette |
| Light | Face lit from below by the screen; room dimmer behind | Gradient overlay, `mix-blend-mode: screen` |
| Noise | Fine sensor grain, stronger in low light | SVG `feTurbulence` overlay or tiny noise PNG at 4–8 % |
| Colour | Slightly desaturated; saturation falls with Energía | CSS `filter: saturate(0.5 + E/200)` |
| UI chrome | Green LED + "CÁMARA ENCENDIDA", `REC 00:42`, year chip | HTML overlay |
| Mirror | Self-view is mirrored → **no text in the art** (it would be backwards) | Rule for all Gemini prompts |
| Failure modes | Freeze, pixelate, "conexión inestable" | CSS steps animation |

The **notification** (chat/RRHH/news) is a glass banner on the bottom of the feed — it reads as something the engineer sees on their screen, and the A/B buttons live below the feed in the thumb zone.

## 3. Palette

| Token | Hex | Use |
|---|---|---|
| ink | `#0B0E1A` | UI background |
| panel | `#12162A` | Cards |
| text | `#F4F1EA` | Primary text |
| LED | `#34D399` | Camera on, positive |
| REC | `#FF5A4E` | REC dot, alerts |
| Energía | `#FFC857` | Meter |
| Plata | `#4ADE80` | Meter |
| Carrera | `#60A5FA` | Meter |
| Vida | `#FF7A90` | Meter |
| Skin (default) | `#D3996F` / shade `#B97F57` | Andean mid-tone |
| Hair | `#1F1A26` | Both |
| Hoodie | Camila `#E9B44C` · Diego `#2F7F79` | Identity |

Act wall colours: see [03](03-narrative-and-scenarios.md#acts-rooms-and-light). Rule: **max 5 colours per scene** + skin + hair.

## 4. Layers (how a frame is composed)

```
 z7  HTML chrome        LED, REC, year chip, meters
 z6  grain + vignette   overlay
 z5  glow               screen-light gradient, blend: screen
 z4  desk + props near  mugs, pills, steam
 z3  engineer           body, face expression, glasses, earbuds
 z2  darkness           night/day multiplier on the room only
 z1  props far          crib, boxes, door+mom, drill, shelf, clock
 z0  plate              wall + window + sky
```

## 5. Two production tiers (so Gemini is never a blocker)

| Tier | What | Status |
|---|---|---|
| **A · Vector (ships by Wed)** | Everything drawn in SVG/CSS exactly like [`index.html`](index.html): rooms, props, two engineers, 7 expressions | Already prototyped |
| **B · Gemini upgrade (drops in by Tue night)** | Richer wall/window **plates**, **props** sprites, **NPC portraits**, **key art / OG** | Replace layers z0, z1, z4 via config; engineer stays vector unless the cut-outs are clean |

Swapping is data-driven: each `view` can declare `plate: "assets/plates/y2020.webp"`; if the file is missing the vector plate renders. Same for props.

## 6. What to generate with Gemini

| Group | Count | Size | Notes |
|---|---|---|---|
| Room plates (empty, no person) | 8 (one per act) | 1080×1350 | Leave bottom-center free for the engineer; desk edge at the bottom |
| Prop sprites (crib, boxes, door+mom, drill, shelf, clock, mugs, pills, plant, sticky notes, neon strip, chat bubble ✦) | 12–16 | 512 px | Generated as 2 sheets on flat chroma colour |
| Engineer expression sheets | 2 (Camila, Diego) × 7 expressions | 3×3 grid per sheet | **Optional** (Tier B+) |
| NPC portraits (Marcos, Rodrigo, Paola, Mamá, Pareja, Dra. Ríos, Amigo) | 7 | 256 px, circular crop | One sheet |
| App icon / OG base | 2 | 1024² / 1200×630 | |

Total ≈ 25–35 generations including retries. Cheap — the cost is **consistency**, not count.

### Model
Use the current Gemini image-generation model available to your key in Google AI Studio (the "Nano Banana" family at the time of writing). **I have not verified the exact model ID your key can use** — check it in AI Studio before the run. Gemini returns no alpha channel, so cut-outs use a flat chroma background and a keying script.

## 7. Style bible (paste at the top of every prompt)

```
STYLE BIBLE — "Software Engineer LIFE"
Minimalist flat vector illustration. Soft geometric shapes, no outlines,
no gradients except one soft light falloff. Limited palette of at most 5
muted colours per image plus skin and hair. Calm, slightly melancholic,
warm-cool contrast. Shot as if from a laptop webcam: straight-on, slightly
wide-angle, eye level. ABSOLUTELY NO TEXT, NO LETTERS, NO LOGOS, NO NUMBERS
anywhere in the image. No brand names. Clean, lots of negative space.
Portrait orientation 4:5.
```

Always send the **first approved plate as an image reference** with every subsequent call ("match the style of the reference exactly").

## 8. Prompt templates

### Room plate
```
{STYLE BIBLE}
Empty room seen from a laptop webcam, no people. {ROOM DESCRIPTION}.
Time of day: {TIME}. Main colour of the wall: {HEX}. A wooden desk edge runs
along the bottom of the image. Leave the central lower area empty, a person
will be composited there. Soft cool light coming from below-center (laptop
screen glow).
```

| Act | ROOM DESCRIPTION | TIME |
|---|---|---|
| 2019 | Teenage-style bedroom in a family house in Lima: window with orange curtains, framed family photo, small bookshelf, wall clock | bright morning |
| 2020 | Same room, greyer, calendar taped to the wall, a face mask hanging on a nail, tidy desk with a mug | afternoon, overcast |
| 2021 | Small apartment corner, white wall, tall plant, floating shelf with books, window with blinds | midday |
| 2022 | Same apartment, many yellow sticky notes on the wall, extra mugs on the desk, a baby crib in the right third *(variant B: bare wall with a drill poking through)* | morning |
| 2023 | Dim room, slate-blue wall, cardboard boxes stacked on the right *(variant: pill bottle and water glass on the desk)* | late evening |
| 2024 | Cleaner, emptier room, dusty-rose wall, many mugs lined up on the desk, a single small plant | late afternoon |
| 2025 | Dark violet room lit by a thin neon strip along the top and a second monitor glow | night |
| 2026 | Sunrise through the window, peach walls, a bicycle helmet hanging on a hook, empty desk | dawn |

### Prop sheet (chroma)
```
{STYLE BIBLE}
A sprite sheet of 6 separate small objects on a perfectly flat pure magenta
#FF00FF background, wide spacing between objects, each object fully visible,
no shadows on the background: {LIST}. Do not use magenta anywhere in the objects.
```

### Character sheet (optional Tier B+)
```
{STYLE BIBLE}
Character sheet, 3×3 grid on a flat magenta #FF00FF background. The same
young Peruvian software engineer ({she/he}, {hair}, {hoodie colour} hoodie,
white wireless earbuds), chest-up, facing the camera, in 9 expressions:
neutral, happy, tired, stressed with a sweat drop, shocked, sick (greenish),
relieved with closed eyes, thoughtful, laughing. Identical face and proportions
in every cell.
```

### NPC sheet
```
{STYLE BIBLE}
Sheet of 7 circular-cropped portrait busts on a flat magenta background:
a polite male boss in a button-up shirt; a kind senior male developer with a beard;
a warm HR woman with a blazer; a mother in her 50s with a bun; a partner with
short hair; a female doctor with a stethoscope; a friendly male friend in a
t-shirt. Same flat style, same palette.
```

## 9. Post-processing pipeline (`tools/`)

```
gen-assets.mjs   read prompts.json → call Gemini (reference image + prompt) → save raw PNG to /raw
cutout.mjs       magenta key → alpha, despill edges, trim, split sheet into cells (sharp)
optimize.mjs     PNG → WebP (q≈80), enforce budgets, write /assets/**
```

Budgets: plate ≤ 90 KB, sprite ≤ 30 KB, total image payload ≤ 2.5 MB, lazy-load the next act's plate while the current one plays.

## 10. QA checklist for generated art

- [ ] No text/letters/logos anywhere (re-roll otherwise)
- [ ] Palette within spec, no neon outside the AI act
- [ ] Bottom-center free for the engineer
- [ ] Same line/shape language across all 8 plates (view them in a contact sheet)
- [ ] Magenta fringe removed on sprites (test on dark and light backgrounds)
- [ ] File sizes within budget
- [ ] Looks good with the night overlay applied

## 11. Fallback

If Gemini results drift or time runs out, ship **Tier A** unchanged. The preview shows Tier A quality; it is already a credible, consistent, minimalist game.
