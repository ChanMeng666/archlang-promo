// The film: one scene per entry in timeline.ts, each mounted for its own length plus the
// overlap in which the next one arrives over it. A scene only ever sees its local time.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Finish } from "./components/Ground";
import { FPS, cubicInOut, expoOut, ramp } from "./motion";
import { Agent } from "./scenes/Agent";
import { End } from "./scenes/End";
import { Hook } from "./scenes/Hook";
import { Range } from "./scenes/Range";
import { Same } from "./scenes/Same";
import { Title } from "./scenes/Title";
import { Write } from "./scenes/Write";
import { OVERLAP, SCENES, type SceneId, startOf } from "./timeline";

const FACES = ['600 40px "Archivo Variable"', '400 16px "Public Sans Variable"', '400 13px "IBM Plex Mono"', '600 13px "IBM Plex Mono"', 'italic 400 13px "IBM Plex Mono"', '500 13px "IBM Plex Mono"'];

/** Hold the first frame until every face is really loaded — text measured in a fallback font lies. */
function useFonts() {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all(FACES.map((f) => document.fonts.load(f)))
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle));
  }, [handle]);
}

const BODY: Record<SceneId, React.FC<{ t: number }>> = { hook: Hook, title: Title, write: Write, same: Same, agent: Agent, range: Range, end: End };

/** How each scene arrives over the one before it. No two neighbours arrive the same way. */
const ARRIVE: Record<SceneId, "cut" | "wipe-right" | "wipe-up" | "iris" | "fade"> = {
  hook: "cut",
  title: "wipe-right",
  write: "wipe-up",
  same: "wipe-right",
  agent: "wipe-up",
  range: "iris",
  end: "fade",
};

function arrival(kind: (typeof ARRIVE)[SceneId], p: number): React.CSSProperties {
  const e = cubicInOut(p);
  switch (kind) {
    case "wipe-right":
      return { clipPath: `inset(0 ${(1 - e) * 100}% 0 0)` };
    case "wipe-up":
      return { clipPath: `inset(${(1 - e) * 100}% 0 0 0)` };
    case "iris":
      return { clipPath: `circle(${expoOut(p) * 76}% at 50% 50%)` };
    case "fade":
      return { opacity: e };
    default:
      return {};
  }
}

export const Film: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const now = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#f5f2ea" }}>
      {SCENES.map((s) => {
        const start = startOf(s.id);
        const t = now - start;
        if (t < 0 || t >= s.dur + OVERLAP) return null;
        const Body = BODY[s.id];
        const kind = ARRIVE[s.id];
        const p = kind === "cut" ? 1 : ramp(t, 0, OVERLAP);
        return (
          <AbsoluteFill key={s.id} style={p < 1 ? arrival(kind, p) : undefined}>
            <Body t={t} />
          </AbsoluteFill>
        );
      })}
      <Finish />
      <Audio src={staticFile("audio/soundtrack.wav")} />
    </AbsoluteFill>
  );
};
