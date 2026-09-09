---
name: "human atlas game polish"
created: "2026-09-09T16:13:29.180Z"
status: pending
---

# Human Atlas — Game Mode Polish

## 1. Wrong-click penalty + progressive hints + system flash

**`app/game-questions.ts`**

- Add `WRONG_PENALTY_SECONDS = 5`.

- Add `DIFFICULTY_WRONG_HINTS: Record<Difficulty, number>` — how many auto-hints unlock from wrong clicks: elementary 4, middle 3, high 2, undergrad 1, medical 1.

- Add a `hintTiers(q)` helper returning an escalating array:

  1. **System flash** — "It's in the *Respiratory* system" + flash that row in the left panel
  2. **Location hint** — existing `HINTS[...]` text
  3. **Narrow** — auto-isolate to the target system (hide others)
  4. **Reveal region** — highlight a sibling part near the target

**`app/game.tsx`**

- On wrong click: `startTimeRef.current -= WRONG_PENALTY_SECONDS * 1000` so the timer drops 5s immediately; clamp at 0 and trigger timeout if it crosses.
- Show a floating `-5s` damage indicator near the timer (CSS animation, fades up).
- Track `wrongClicks`; each wrong click advances `hintTier` up to `DIFFICULTY_WRONG_HINTS[difficulty]`.
- New prop `onFlashSystem: (systemId: string|null) => void` — called when tier 1 unlocks.

**`app/page.tsx`**

- New state `flashSystem`; pass `onFlashSystem={setFlashSystem}` to `<Game>`.
- On `system-row`, add `${flashSystem===s.id?'flashing':''}`.
- Auto-clear after \~3s via `setTimeout`.

**`app/globals.css`**

- `.system-row.flashing` — 3 pulses of the system color as a box-shadow/background glow.
- `.game-penalty` — the `-5s` float-up indicator.

## 2. Systems panel — all 15 systems, never scroll

Current: `.layers-panel{top:217px;bottom:130px}` with 28px rows — the last 3 of 15 fall below the fold.

- Raise the panel: `top:150px`, `bottom:104px` (recovers \~93px).
- Compact rows: `.system-row,.system-name{min-height:clamp(22px,2.6vh,30px)}`.
- Tighten chrome: `.layer-presets{margin:10px 0 6px}`, `.panel-foot{min-height:34px}`.
- `.system-list{overflow-y:auto}` retained only as a short-viewport safety valve; at ≥800px height all 15 fit with no scrollbar.
- Revisit the `min-width:1400px` override (currently `top:190px;bottom:130px` with 39px rows) — that one definitely overflows; set 34px rows there.
- Verify against 1440×900 and 1280×800.

## 3. Snowflake-backed global leaderboard

The container is nginx-only static today, so this adds a backend.

**Snowflake objects**

```sql
CREATE TABLE HUMAN_ATLAS_DB.PUBLIC.LEADERBOARD (
  id STRING DEFAULT UUID_STRING(),
  name STRING, score NUMBER, difficulty STRING,
  correct NUMBER, total NUMBER,
  created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);
```

**New `api/` Node service (sidecar container)**

- Reads the SPCS OAuth token from `/snowflake/session/token`, calls the Snowflake SQL API at `$SNOWFLAKE_HOST` (Snowflake-internal, no external access integration needed).
- `GET /api/leaderboard?scope=today|alltime&limit=10`
- `POST /api/score` — validates name (≤24 chars, stripped), score is a finite number, difficulty is in the known set.
- Runs on `:3001`.

**`nginx.conf`** — `location /api/ { proxy_pass http://localhost:3001; }` (containers in one SPCS service share localhost).

**`service-spec.yaml`** — add the second container; keep the single public endpoint on 8080.

**`app/game-store.ts`** — rewrite as async:

- `saveScore()`, `getTopToday()`, `getTopAllTime()` become `Promise`-returning, hitting `/api/`.
- **localStorage fallback** kept for local dev and for API failures, plus a one-time migration that pushes any existing local scores up to the table so current scores aren't lost.

**`app/game.tsx`** — leaderboard reads become effect-driven with loading/error states.

## 4. Tiered timer colors

Replace the relative `timer < maxTime*0.33` rule with absolute thresholds:

- `>10s` — normal
- `≤10s` — **yellow** (`.warn`)
- `≤5s` — **pulsing red** (`.crit`, 0.5s `@keyframes` on color + scale)

Applies to both `.game-hud-timer` and `.game-hud-bar-fill`. Note: Medical School has a 10s total timer, so it opens in the yellow state by design.

## 5. Confetti

**New `app/confetti.ts`** — self-contained canvas particle system, no npm dependency (\~70 lines). Fixed-position full-screen canvas at `z-index:200`, `pointer-events:none`, auto-removed when particles settle.

- `burst()` — correct answer: \~80 particles, \~1.2s, from the prompt panel
- `celebrate()` — leaderboard: \~300 particles, \~4s, dual side-cannons + continuous top rain

Wired into `game.tsx` on `feedback==='correct'` and on entering the `leaderboard` phase with a top-10 placement.

## 6. Sound effect library

**New `app/sounds.ts`** — Web Audio API **synthesized** tones. No binary assets, no licensing, no bundle cost. Lazily constructs `AudioContext` on first user gesture (autoplay policy) and reuses one instance.

| # | Function        | Design                                              |
| - | --------------- | --------------------------------------------------- |
| 1 | `gameStart()`   | Ascending 3-note arpeggio, triangle wave            |
| 2 | `uiSelect()`    | 12ms sine blip, 880Hz                               |
| 3 | `bodyClick()`   | Low soft thud, filtered sine 180Hz                  |
| 4 | `correct()`     | Major triad ding with decay                         |
| 5 | `wrong()`       | Descending two-tone buzz, sawtooth                  |
| 6 | `roundEnd()`    | Four-note resolving cadence                         |
| 7 | `leaderboard()` | Celebratory fanfare, \~1.5s                         |
| 8 | `tick()`        | Sharp click, pitch rises as time drops              |
| 9 | `scrub(value)`  | Bandpass-filtered noise, cutoff mapped to explode % |

- All gated behind a **mute toggle** in `top-actions` (speaker icon), persisted to localStorage, default **on** at low volume (master gain 0.25).
- `tick()` fires once per second at ≤10s remaining, coordinated with the timer effect so it doesn't double-fire on the 100ms interval.
- `scrub()` is throttled to \~60ms on the range `onChange` and on play/reverse toggles.

## 7. Build, deploy, verify

- `npx tsc --noEmit` then `npm run build`.
- Create the leaderboard table and grant to the service role.
- `docker build --platform linux/amd64` → push to `HUMAN_ATLAS_REPO`.
- `ALTER SERVICE ... SUSPEND` → `RESUME` (**never** drop/recreate — preserves `https://jvc4atyo-...snowflakecomputing.app`).
- Note: the spec now has 2 containers, so this needs `ALTER SERVICE ... FROM SPECIFICATION` to pick up the new spec — confirm the endpoint URL is unchanged afterward, since that path can re-provision ingress. If the URL would change, fall back to running the API in the existing container via a supervisor entrypoint instead.
- Verify: all 15 systems visible, timer colors, confetti, sounds, penalties, and that a score written from one browser appears in another.
- Commit and push.

## Risks

- **Endpoint URL** — adding a container requires a spec update. Primary path is `ALTER SERVICE FROM SPECIFICATION`; documented fallback is a single-container supervisor so the URL is guaranteed stable.
- **SQL API latency** — leaderboard reads add \~200-500ms. Optimistic UI with the local cache shown first.
- **Medical School always-yellow** — 10s total means it opens in warn state. Intentional per the thresholds given.
