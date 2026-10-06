// Scene 2 — the name. The mark, the wordmark set the way the product's header sets it,
// and a dimension string drawn under it: the drawing convention the compiler itself emits.
import React from "react";
import { Img, staticFile } from "remotion";
import { Paper } from "../components/Ground";
import { Micro, Words } from "../components/Type";
import baked from "../data/baked.json";
import { clamp01, cubicOut, ramp, spring } from "../motion";
import { FONT, T, wdth } from "../tokens";

/** A drafting dimension string: extension ticks, a line that draws out from the middle, a figure. */
export const DimLine: React.FC<{ width: number; p: number; label: string; color?: string }> = ({ width, p, label, color = "#1f5f9a" }) => {
  const half = (width / 2) * cubicOut(clamp01(p));
  return (
    <div style={{ position: "relative", width, height: 46 }}>
      <div style={{ position: "absolute", left: width / 2 - half, width: half * 2, top: 12, height: 2, background: color }} />
      {[-1, 1].map((s) => (
        <div key={s} style={{ position: "absolute", left: width / 2 + s * half - 1, top: 0, width: 2, height: 26, background: color, opacity: clamp01(p * 3) }}>
          <div style={{ position: "absolute", left: -8, top: 5, width: 18, height: 2, background: color, transform: "rotate(-45deg)" }} />
        </div>
      ))}
      <div style={{ position: "absolute", left: 0, right: 0, top: 20, textAlign: "center", fontFamily: FONT.mono, fontSize: 19, color, opacity: clamp01((p - 0.6) * 3) }}>{label}</div>
    </div>
  );
};

export const Lockup: React.FC<{ t: number; at: number; size: number }> = ({ t, at, size }) => {
  const mark = spring(t - at, 0.55, 16);
  const letters = "ArchLang".split("");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.16 }}>
      <Img
        src={staticFile("brand/archlang-icon-plum.svg")}
        style={{ width: size * 1.12, height: size * 1.12, opacity: clamp01((t - at) / 0.12), transform: `scale(${0.72 + 0.28 * mark}) rotate(${(1 - mark) * -8}deg)` }}
      />
      <div style={{ fontFamily: FONT.display, fontSize: size, lineHeight: 1, letterSpacing: "-0.01em", color: T.srcFg, whiteSpace: "nowrap" }}>
        {letters.map((ch, i) => {
          const tau = t - at - 0.18 - i * 0.05;
          const s = spring(tau, 0.52, 24);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontVariationSettings: wdth(100, i < 4 ? 700 : 600),
                color: i < 4 ? T.plumDeep : T.srcFg,
                opacity: clamp01(tau / 0.08),
                transform: `translateY(${(1 - s) * -size * 0.3}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Title: React.FC<{ t: number }> = ({ t }) => (
  <Paper tone="source" dx={-t * 4}>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transform: `scale(${1 + ramp(t, 0, 4.5) * 0.035})` }}>
      <Lockup t={t} at={0.45} size={190} />
      <div style={{ marginTop: 26 }}>
        <DimLine width={940} p={ramp(t, 1.0, 1.7)} label={`v${baked.version} · MIT`} />
      </div>
      <div style={{ marginTop: 34 }}>
        <Words text="Floor plans as code." t={t} at={1.35} size={84} weight={600} width={92} align="center" />
      </div>
      <div style={{ marginTop: 30, opacity: clamp01((t - 2.1) / 0.35), transform: `translateY(${(1 - cubicOut(ramp(t, 2.1, 2.6))) * 14}px)` }}>
        <Micro size={24}>An open-source language that compiles to architectural drawings</Micro>
      </div>
    </div>
  </Paper>
);
