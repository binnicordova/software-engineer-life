# 02 · Game design

## 1. Core loop (one card ≈ 8–10 s)

```
 notification arrives over the webcam feed
        │   (sender chip · 1–3 lines of text · time stamp)
        ▼
 player taps A or B   (or swipes left/right)
        │
        ▼
 consequence beat (1.5–2.5 s): face changes, stat deltas pop,
 one-line result  →  tap to skip
        │
        ▼
 next card  (year change = camera-shutter flash + Photo Booth snapshot)
```

- **Run length:** 8 acts (2019 → 2026), 3–4 cards each → **24 cards**, ~4 min.
- **Input:** two big buttons (A / B) in the thumb zone. Swipe is optional sugar.
- **Fail state:** any visible meter reaching 0 ends the run early with a *game-over ending* (still shareable).

## 2. Meters (0–100, visible)

| Meter | Icon / colour | Meaning | Start |
|---|---|---|---|
| **Energía** | ⚡ amber | Sleep, health, will to live | 70 |
| **Plata** | S/ green | Wallet vs. cost of living | 35 |
| **Carrera** | ↗ blue | Reputation, skills, "visibility" | 40 |
| **Vida** | ♥ coral | Family, friends, mental health | 60 |

Hint dots under each option show **which meters it touches, not the direction** (Reigns-style). Uncertainty is part of the fun.

### Hidden variables

| Var | Range | Role |
|---|---|---|
| `stress` | 0–100 | Rises with grind choices (+10…+15), drops with rest (−25). `stress > 60` injects the **health scare** card (gastritis/migraña/insomnio) within the next 2 cards. Also lowers yearly Energía regen. |
| `flags` | booleans | `mentor`, `underpaid`, `unpaid_resp`, `unpaid_promo`, `baby`, `rent`, `prepared`, `naive`, `laid_off`, `interviewing`, `offer`, `vibe`, `walk` … drive variants and endings. |
| `rng` | seed | Mulberry32 seeded from `?s=`; same seed ⇒ same event order and same dice. |

### Yearly tick (the "unfair system" made mechanical)

At each new year:

```
Plata  −= 4 + 5·rent + 6·baby + 2·debt − 4·raise_this_year      // inflation never sleeps
Energía += 10 − stress/10                                        // rest never fully recovers
stress  −= 5
```

Salary only moves through *risky* choices (negotiation rolls, changing jobs, equity). Staying put slowly bleeds Plata — **the game quietly teaches that loyalty without a raise is a losing move**, which is the exact thing players want to complain about on LinkedIn.

## 3. Event system

| Type | Rule | Example |
|---|---|---|
| **Anchor** | Fixed act, always appears; may swap to a *variant* by flag | Estado de emergencia (Mar 2020), Mentor renuncia (2021), Tech Lead sin aumento (2024) |
| **Pool** | Weighted random draw per act, no repeats, optional `needs`/`blocks` flags | Se cae el internet, Taladro del vecino, Bono = pizza virtual |
| **Conditional** | Only appears if a flag/stat condition holds | Llanto en el daily (`baby`), Búsqueda de trabajo (`laid_off`) |
| **Trigger** | Injected by hidden state | Health scare when `stress > 60` |
| **Fate** | One-button card whose outcome is rolled from state | RRHH meeting → laid off or survivor |

**Making it feel non-predictable:** the *world* events (pandemic, recortes, IA) are fixed in time because everyone lived them, but **who they hit and how hard** depends on your earlier choices and a seeded roll. Rumour cards ("actualiza tu CV, por si acaso") foreshadow without spoiling.

### Risk rolls
Some options have `roll: p` with separate `win` / `lose` outcomes (ask for a raise, condition a promotion). Show a *slight* wobble on the option button (no numbers). Probabilities live in the data file so we can tune them.

## 4. Endings (evaluated in order)

### Game overs (instant)
| id | Condition | Title | Roast |
|---|---|---|---|
| `burnout` | Energía ≤ 0 | Burnout Certificado | Tu batería llegó a 0 %. No hay cargador en esta oficina remota. |
| `cuenta-cero` | Plata ≤ 0 | Cuenta en Cero | Trabajaste todo el mes. El mes terminó antes que tu sueldo. |
| `ghosteado` | Carrera ≤ 0 | Ghosteado por RRHH | Tu perfil dice “Open to work” desde 2023. |
| `solo` | Vida ≤ 0 | Cero Bugs, Cero Invitados | Cumpliste todos los sprints. Faltaste a todo lo demás. |

### Reached 2026 (first match wins, top to bottom)

The **state of your life** decides the ending. The final scene's choice (vibecodear vs. cerrar la laptop) is an **epilogue stamp** shown on *any* ending ("⌨️ dejó la cámara encendida" / "🚲 cerró la laptop y salió a caminar"), so it always matters without letting a coin-flip decide every result. Only when nothing else matches do the two *special* endings unlock.

| id | Condition | Title | Roast |
|---|---|---|---|
| `equilibrista` | all ≥ 55 | El Equilibrista | Sueldo, salud, carrera y gente. Existes y nadie te cree. |
| `dolares` | `offer` & Plata ≥ 65 | Freelancer en Dólares | Cobras en USD. La ansiedad también cotiza. |
| `mentor` | `mentor` & Carrera ≥ 55 & Vida ≥ 50 | Mentor de Alguien | Ahora tú dices: “quédate 30 minutos, te explico”. |
| `techlead-sin-aumento` | Carrera ≥ 70 & Plata < 40 | Tech Lead sin Aumento | Tienes el título. El banco no lo acepta. |
| `fantasma` | Energía < 30 | Fantasma de Slack | Siempre en línea. Nunca presente. |
| `superviviente` | `laid_off` & Carrera ≥ 50 | Despedido y Mejor Pagado | Te sacaron por videollamada. Volviste por la puerta grande. |
| `mute-parental` | `baby` & Vida ≥ 55 | Cámara Apagada, Corazón Encendido | Tu mejor release fue un “te quiero” con el micro en mute. |
| `vibecoder` *(special)* | `vibe` & Carrera ≥ 45 | Vibecoder del Sábado | Convertiste tu vida en un juego. Ahora la gente lo está jugando. |
| `caminante` *(special)* | `walk` & Vida ≥ 50 | El que Cerró la Laptop | Salió el sol. El deploy pudo esperar. |
| `promedio` | default | Dev Promedio (Sobrevivió) | Llegaste a 2026. Eso ya es un logro. |

14 endings total (4 game-overs + 10). Stretch: 2 secret endings (e.g., 3 health scares ignored; never negotiated once).

Every ending also carries a **care line**, e.g. *“Descansar no es un logro desbloqueable.”*

## 5. Balancing — don't guess, simulate

Write `tools/sim.mjs`: runs the real engine with 10,000 seeded runs for three bots:

| Bot | Policy | Target survival to 2026 |
|---|---|---|
| Random | picks A/B uniformly | 20–30 % |
| Greedy-career | always the grind option | < 10 % (should burn out) |
| Balanced | picks option that keeps min(meter) highest | 65–80 % |

Also report ending distribution; **no ending > 25 %** among survivors, every ending reachable by at least 0.5 % of runs. Tune effect sizes and start values until it passes. Takes ~1 hour, prevents a boring game.

## 6. Feedback & juice (cheap, high value)

- **Webcam degrades with Energía:** saturation and brightness fall, vignette and grain rise. No bar needed to *feel* it.
- **Face system:** 7 expressions + eye-bags opacity from Energía; glasses appear in 2021 (screen time); sweat drop under stress.
- **Ambient gags** (see [03](03-narrative-and-scenarios.md#ambient-webcam-chaos)) are visual + one synthesized sound each.
- **Shutter flash** at every new year.
- **Haptics:** `navigator.vibrate(10)` on choice, 30 on bad outcomes (where supported).
- **Sound:** WebAudio-synthesized (keyboard tick, notification knock, baby cry, shutter, low hum). Muted by default; one-tap unmute.

## 7. Accessibility & mobile constraints

- Portrait only; landscape shows "gira tu teléfono". Desktop shows the phone frame + QR.
- Tap targets ≥ 48 px, contrast ≥ 4.5:1 for text, text ≥ 16 px on cards.
- `prefers-reduced-motion`: no flashes/shakes, instant transitions.
- No flashing > 3 Hz. Shutter flash is a single 150 ms fade.
- Never rely on colour alone: meters have icons; deltas have +/−.

## 8. Scene data schema (JSON)

```jsonc
{
  "id": "Y21-01",
  "act": 3,
  "type": "anchor",                 // anchor | pool | conditional | trigger | fate
  "needs": ["!laid_off"],           // optional flag conditions ("!" = must be false)
  "weight": 1,
  "view": { "theme": "apartment", "sky": "day", "light": 1, "time": "10:30",
            "props": ["window","shelf","plant"], "expr": "stressed" },
  "from": { "app": "Chat del equipo", "name": "Rodrigo · Senior", "av": "R" },
  "text": "“Me voy a una empresa que paga en dólares. Te dejo mi módulo.”",
  "A": { "t": "Aceptar el módulo", "fx": { "c": 12, "e": -10 }, "stress": 12,
         "set": ["unpaid_resp"], "res": "Ahora respondes por 3 sistemas que no escribiste.", "expr": "stressed" },
  "B": { "t": "Pedir aumento antes", "roll": 0.45,
         "win":  { "fx": { "p": 14, "c": 8 },  "res": "Te dieron S/ 300 más.", "expr": "happy" },
         "lose": { "fx": { "c": -10, "e": -4 }, "res": "Se verá “en la evaluación”.", "expr": "tired" } },
  "snap": false                     // true → store a Photo Booth frame here
}
```

`index.html` in this folder already runs on this exact shape (inline), so Monday's engine is a refactor, not a rewrite.
