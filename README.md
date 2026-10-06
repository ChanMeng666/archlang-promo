# archlang-promo

The promo film for **[ArchLang](https://archlang.uk)** — *floor plans as code*. 68 seconds,
1920×1080, 30 fps, built in [Remotion](https://www.remotion.dev/).

It is not cut from screen recordings. The playground on screen is a coded replica, every
floor plan is compiled by the real ArchLang compiler inside the render, every line of terminal
output is the real CLI's, and the soundtrack is synthesised from sine waves by a script in
this repo.

![Sixteen frames of the film, four seconds apart](docs/contact-sheet.jpg)

> The rendered master (`out/archlang-promo.mp4`, ~46 MB) is **not committed** — `out/` is
> ignored. Run `npm run render` to produce it, or attach it to a release.

## Quick start

Needs Node 22+, `ffmpeg` on `PATH`, and PowerShell 7 for `npm run render`.

```bash
npm install
npm run bake      # run the real compiler + CLI, write src/data/*.json
npm run audio     # synthesise the soundtrack → public/audio/soundtrack.wav
npm run verify    # six gates
npm run dev       # Remotion Studio
npm run render    # out/archlang-promo.mp4
```

## What is on screen

Nothing is a screen recording and nothing is a mock-up.

- **A coded replica of the playground** (`src/components/Playground.tsx`): the title-block
  header, the `SOURCE.ARCH` editor, the compile seam, the preview sheet on drafting paper, the
  facts strip — rebuilt in React from the product's own stylesheets, laid out at the product's
  real pixel sizes and zoomed. Colours are the product's brand tokens (`src/tokens.ts`) and the
  syntax colouring is the product's own generated highlighter (`src/vendor/arch-highlight.js`).
- **Every plan is compiled inside the render** by the vendored compiler
  (`vendor/chanmeng666-archlang-*.tgz`, packed from the sibling `../archlang` build).
  `compile()` is pure, synchronous and deterministic — exactly what a frame-by-frame renderer
  needs. While the source is typed, each frame compiles the lines typed so far; while `let W`
  is scrubbed from 4200 to 5400, each frame is its own compile of its own number.
- **The terminal is the real CLI.** `tools/bake.mjs` runs `arch compile | fix | validate |
  suggest | describe` over a draft with two flaws and records stdout, stderr and exit codes.
  The film condenses the JSON (it picks fields; it never rewrites one).
- **The SHA-256 digests** are of two independent `compile()` calls; the bake throws if they
  ever differ.
- **The gallery** is twelve of the repo's own `examples/*.arch`, compiled by the CLI.

## The edit

| | s | |
|---|---|---|
| `hook` | 0–6 | A generated plan is a picture, and a picture can't be checked. |
| `title` | 6–10 | ArchLang — floor plans as code. |
| `write` | 10–32 | The playground: source streams in and compiles; then one number changes. |
| `same` | 32–38 | Same source, byte-identical output. |
| `agent` | 38–54 | The CLI loop: error with fix → `fix` → lint → `suggest` → `describe` → gate. |
| `range` | 54–62 | The example gallery; five themes, five formats. |
| `end` | 62–68 | The lockup, the install line, the links. |

Scene lengths live in **seconds** in `src/timeline.ts` and nowhere else. Each scene is a pure
function of its own local time (`src/scenes/*.tsx`); motion primitives are closed-form
(`src/motion.ts`), so any frame renders the same in any order.

## Sound

`tools/synth-audio.mjs` synthesises everything — a 120 BPM bed (pads, plucks, bass, kick) and
the effects — from sine waves and seeded noise. No samples, no licensed or generated music.
Scenes are whole bars long, so cuts land on downbeats; each statement that draws something
plays a note as it compiles. The script mirrors the scenes' beat constants (each is named
beside its cue): **re-time a scene, re-time its cue, re-run `npm run audio`.**

The mix was checked by measurement (−16 LUFS integrated, −1.5 dBTP, per-section levels, a
spectrogram), not by ear. Listen before you publish.

## Layout

```
plans/laneway.arch        the plan the film writes — lint-clean, ≤ 64 chars a line
src/timeline.ts           the edit, in seconds
src/motion.ts             easings, the closed-form spring, the seeded hash
src/arch.ts               the seam to the compiler: memoised compile(), SVG inlining
src/tokens.ts             the product's brand tokens (gated against tokens.css)
src/components/           Playground replica · type · grounds and finish
src/scenes/               one file per scene
src/data/                 BAKED — never hand-edit; `npm run bake`
tools/bake.mjs            compiler + CLI → src/data
tools/synth-audio.mjs     the soundtrack
tools/verify.mjs          the gates
tools/stills.mjs          `node tools/stills.mjs 12.5 26 41` — look before a long render
```

## Upgrading the compiler

```bash
cd ../archlang && npm run build && npm pack --ignore-scripts --pack-destination ../archlang-promo/vendor
cd ../archlang-promo   # point package.json at the new tarball, then:
npm install && npm run bake && npm run verify
```

`npm run verify` fails if the baked data is stale, if a typed prefix of the plan stops
compiling, if a counted claim ("five themes") stops being true, or if a brand token or the
highlighter has drifted from the product's.

## Licence

[MIT](LICENSE), like ArchLang. The vendored compiler tarball carries its own copy of the
same licence (`vendor/ARCHLANG-LICENSE`). The ArchLang mark in `public/brand/` is byte-identical to the product's
and follows its brand rules (recolour only, never re-trace).
