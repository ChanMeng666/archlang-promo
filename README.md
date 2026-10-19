<div align="center">

# ArchLang film

**A 68-second promo film for [ArchLang](https://archlang.uk), made in code with Remotion: a coded replica of the playground, every floor plan compiled during the render by the real compiler.**

</div>

![Sixteen frames of the film, four seconds apart](docs/contact-sheet.jpg)

## The film

### ArchLang film

<!-- FILM: archlang-film · 16:9 · 68 s — Chan uploads the video here in GitHub's web editor -->

▶ Watch on YouTube: https://youtu.be/RBcGF6X4esY

## How it's made

- **A coded replica, not a screen recording.** The playground is rebuilt in React from the product's own stylesheets, brand tokens and generated syntax highlighter (`src/components/Playground.tsx`).
- **The real compiler runs inside every frame.** The vendored ArchLang package is pure and deterministic, so each frame compiles the lines typed so far, and a scrubbed number is a fresh compile per frame.
- **Real terminal output.** `tools/bake.mjs` runs the actual `arch` CLI and records stdout, stderr and exit codes into `src/data/`; the film only picks fields from them.
- **Time-pure scenes.** Scene lengths live in seconds in `src/timeline.ts`; each scene is a pure function of its local time with closed-form motion, so any frame renders the same in any order.
- **A synthesised soundtrack.** `tools/synth-audio.mjs` builds the bed and effects from sine waves and seeded noise: no samples, no licensed or generated music.
- **Gates before render.** `npm run verify` fails on stale baked data, a typed prefix that stops compiling, or a counted claim that is no longer true.

## Make your own

Needs Node 22+, `ffmpeg` on `PATH` and PowerShell 7.

```bash
npm install
npm run audio     # synthesise public/audio/soundtrack.wav
npm run verify    # the gates
npm run dev       # Remotion Studio
npm run render    # out/archlang-promo.mp4
```

The baked compiler and CLI output is committed in `src/data/`. To re-bake it (`npm run bake`) and to run the brand-token gates, clone [ArchLang](https://github.com/ChanMeng666/archlang) as a sibling folder `../archlang`.

## Licence

- Code: [MIT](LICENSE).
- The film, the soundtrack and the images made by Chan Meng in this repo: [CC BY 4.0](LICENSE-MEDIA.md).
- Excluded, under their own terms: the ArchLang mark in `public/brand/` (follows ArchLang's brand rules), the vendored ArchLang compiler (MIT, `vendor/ARCHLANG-LICENSE`), the fonts Archivo, Public Sans and IBM Plex Mono (SIL Open Font License), and npm libraries such as Remotion (their own licences).

More detail: [docs/overview.md](docs/overview.md)
