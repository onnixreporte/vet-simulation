# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"¡Siguiente Paciente!" — a mobile-first veterinary triage game for Petsys. A patient arrives with their owner, the player reads the clinical sheet, picks a diagnosis, and drags the patient to the right room before the 90-second shift ends. Scores go to a public ranking.

All UI text, code comments, and commit messages are in Rioplatense Spanish (voseo: "Leé", "Arrastrá", "Elegí"). Keep that voice in new copy.

## Commands

```bash
npm install
npm run dev      # Vite dev server
npm run build    # tsc -b (type check) + vite build → dist/
npm run lint     # oxlint (config in .oxlintrc.json)
npm run preview  # serve dist/
```

There is no test suite. `npm run build` is the type check.

Supabase is optional locally: copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Without them the game uses the bundled cases and a sample ranking in `localStorage`. Deploys on Vercel (auto-detected Vite; same two env vars).

## Architecture

**React shell + imperative canvas engine.** React (`App.tsx`) only switches screens (`menu → form → intro → game → ranking`, see `Screen` in `lib/types.ts`). No router, no state library. The game itself is `GameEngine` (`src/game/engine.ts`), a plain class that owns a `requestAnimationFrame` loop, a 192×256 logical canvas, and pointer events. `components/Game.tsx` creates it in an effect and renders the HUD and the clinical sheet from a `Ui` snapshot the engine pushes through its `onUi` callback (`set(patch)`). Calls go back via `engine.choose(i)`, `toggleSheet()`, `start()`. Score popups and speech bubbles are DOM nodes the engine appends to the overlay div, positioned in % of the logical canvas.

**Engine flow.** `phase` drives everything: `arriving → triage` ("¿Atender?" / "Que espere") `→ diag` (pick diagnosis) `→ send` (drag or tap a room) `→ moving → next patient`, until `over`. Entities walk along waypoint `path`s; speed scales with `pace()`, which rises from 1 to `MAX_PACE` as time runs out (time penalties speed it up too). Every 4th patient is drawn from `rare` cases. Cases come from a shuffled deck that persists across shifts and never repeats a case already on screen.

**Room geometry lives in two places.** Hit-test rectangles are `ROOM` in `draw.ts`; walking paths and drop areas are `ROOMS` in `engine.ts`; the room labels are hard-coded % positions in `Game.tsx`. Moving a room means updating all three. Valid `RoomId`s are also repeated in `lib/content.ts`.

**Art and audio are code, not assets.** Sprites are ASCII-art row strings compiled to canvases with a palette (`sprites.ts`, `compile()`); `k` is always ink, `.` is transparent. Flipped variants are precomputed. `ICONS` are data URLs for the React UI. `draw.ts` paints the clinic and facade with a module-level context (`setCtx` before drawing). `audio.ts` synthesizes chiptune music and SFX with Web Audio. It must be unlocked on first user gesture (`unlockAudio`, wired in `App.tsx`).

**Data layer (`src/lib`).** `supabase.ts` is a minimal fetch-based REST/RPC client (no `supabase-js`), with `hasSupabase` guarding every call. `content.ts` loads active `cases` rows at startup and swaps them into `cases.ts` via `setCases()`, dropping rows whose `pet` is not a key of `PETS` or whose `room` is invalid. `scores.ts` saves through the `submit_score` RPC and reads through `top_scores`, falling back to local storage plus sample data on any failure.

## Supabase

Project: **vetsafe**. Migrations in `supabase/migrations/` are already applied there; apply new ones in order. The DB column names are English (`name`, `owner_says`, `diagnoses`, `rare`); `toCase()` in `content.ts` maps them to the short Spanish `Case` fields (`n`, `dice`, `dx`, `raro`).

- `cases`: public read where `active = true`. The first item of `diagnoses` is the correct one; options are shuffled when shown. `pet` must be a key of `PETS` in `sprites.ts`.
- `scores`: no direct access. Writes only through `submit_score()` (security definer), reads through `top_scores()` (best shift per player, keyed by Instagram, or by name + vet when there is no Instagram).

**Scoring is enforced on both sides. Change both together.** The engine awards +50/+100 for a correct diagnosis (normal/rare) and +100/+200 for the correct room. The latest `submit_score` (`20261030143051_ajuste_puntos_y_sala.sql`) requires points to be a multiple of 50 and `≤ patients * 300 + 100`, and allows one save per player every 30 s. Its `P0001` messages ("Esperá…", "Puntaje…") are shown to the player as-is by `saveScore`. The README still says "multiples of 100"; the migration is the source of truth.
