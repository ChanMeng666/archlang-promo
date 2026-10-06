// The edit, in SECONDS. This is the only place a scene's length is written down; every
// component receives its own local time and never does frame arithmetic.
//
// The bed is 120 BPM, so a bar is 2 s. Every scene is a whole number of bars and the cuts
// land on downbeats — but the lengths are deliberately uneven (4 s beside 16 s), because
// a metronome edit reads as a slideshow.
import { FPS } from "./motion";

export const SCENES = [
  { id: "hook", dur: 6 }, //      a picture can't be checked
  { id: "title", dur: 4 }, //     ArchLang — floor plans as code
  { id: "write", dur: 22 }, //    the playground: source streams in, the plan compiles,
  //                              then one number changes (14 s + 8 s, one unbroken shot)
  { id: "same", dur: 6 }, //      byte-identical
  { id: "agent", dur: 16 }, //    the CLI loop, real output
  { id: "range", dur: 8 }, //     gallery, themes, formats
  { id: "end", dur: 6 }, //       the lockup
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

/** How long two neighbouring scenes are both on screen, in seconds. */
export const OVERLAP = 0.5;

export const TOTAL_SECONDS = SCENES.reduce((s, x) => s + x.dur, 0);
export const TOTAL_FRAMES = Math.round(TOTAL_SECONDS * FPS);

export function startOf(id: SceneId): number {
  let t = 0;
  for (const s of SCENES) {
    if (s.id === id) return t;
    t += s.dur;
  }
  throw new Error("unknown scene " + id);
}

export const durOf = (id: SceneId): number => SCENES.find((s) => s.id === id)!.dur;
