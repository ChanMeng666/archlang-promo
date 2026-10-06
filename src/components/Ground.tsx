// The two grounds the product itself is built on — warm drafting paper and cool source
// grey — plus the film's finish: a fixed grain tile (it stops gradient banding in
// yuv420p and never moves, so a hold stays still) and a soft warm vignette.
import React from "react";
import { hash } from "../motion";
import { T } from "../tokens";

const GRAIN = (() => {
  // 96×96 tile of seeded specks, as one SVG data URI
  let rects = "";
  for (let i = 0; i < 520; i++) {
    const x = Math.floor(hash(i) * 96);
    const y = Math.floor(hash(i + 999) * 96);
    const a = (0.02 + hash(i + 5000) * 0.05).toFixed(3);
    rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgba(60,48,30,${a})"/>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">${rects}</svg>`)}")`;
})();

export const Finish: React.FC = () => (
  <>
    <div style={{ position: "absolute", inset: 0, backgroundImage: GRAIN, pointerEvents: "none" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 75% 75% at 50% 48%, transparent 62%, rgba(96,78,52,0.13) 100%)", pointerEvents: "none" }} />
  </>
);

/** Drafting paper: a fine 16 px grid and an 80 px major grid, optionally drifting. */
export const Paper: React.FC<{ dx?: number; dy?: number; tone?: "paper" | "source"; children?: React.ReactNode }> = ({ dx = 0, dy = 0, tone = "paper", children }) => {
  const line = tone === "paper" ? "rgba(28,36,48,0.055)" : "rgba(26,29,35,0.05)";
  const major = tone === "paper" ? "rgba(28,36,48,0.075)" : "rgba(26,29,35,0.07)";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: tone === "paper" ? T.paper : T.srcBg,
        backgroundImage: [
          `repeating-linear-gradient(0deg, ${line} 0 1px, transparent 1px 16px)`,
          `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 16px)`,
          `repeating-linear-gradient(0deg, ${major} 0 1px, transparent 1px 80px)`,
          `repeating-linear-gradient(90deg, ${major} 0 1px, transparent 1px 80px)`,
        ].join(","),
        backgroundPosition: `${dx}px ${dy}px`,
      }}
    >
      {children}
    </div>
  );
};
