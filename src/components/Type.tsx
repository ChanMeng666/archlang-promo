// The film's own voice: display lines that land word by word, and the caption band
// that rides under the product. Type is Archivo, the product's display face.
import React from "react";
import { clamp01, envelope, expoOut, ramp, spring } from "../motion";
import { FONT, T, wdth } from "../tokens";

/** Words land one per beat: opacity leads so it never reads as a fade, the rise follows on a spring. */
export const Words: React.FC<{
  text: string;
  t: number;
  at: number;
  out?: number;
  size: number;
  stagger?: number;
  color?: string;
  accent?: Record<string, string>;
  weight?: number;
  width?: number;
  align?: "left" | "center";
  style?: React.CSSProperties;
}> = ({ text, t, at, out, size, stagger = 0.085, color = T.ink, accent = {}, weight = 700, width = 88, align = "left", style }) => {
  const words = text.split(" ");
  const gone = out === undefined ? 0 : expoOut(ramp(t, out, out + 0.3));
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontVariationSettings: wdth(width, weight),
        fontSize: size,
        lineHeight: 1.04,
        letterSpacing: "-0.022em",
        color,
        whiteSpace: "nowrap",
        textAlign: align,
        opacity: 1 - gone,
        transform: `translateY(${-gone * size * 0.25}px)`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const tau = t - at - i * stagger;
        const s = spring(tau, 0.62, 21);
        const bare = w.replace(/[.,?!—]/g, "");
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: "0.24em",
              opacity: clamp01(tau / 0.1),
              transform: `translateY(${(1 - s) * size * 0.34}px) scale(${0.94 + 0.06 * s})`,
              transformOrigin: "50% 100%",
              color: accent[bare] ?? undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** A caps micro-label in the product's title-block voice. */
export const Micro: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 20, color = T.inkMuted, style }) => (
  <span style={{ fontFamily: FONT.display, fontVariationSettings: wdth(85, 600), fontSize: size, letterSpacing: "0.11em", textTransform: "uppercase", color, whiteSpace: "nowrap", ...style }}>{children}</span>
);

export interface CaptionCue {
  from: number;
  to: number;
  text: string;
  /** words set in redline */
  mark?: string[];
  no?: string;
}

/**
 * The caption band under the product. One line at a time; each rises out of a mask and
 * leaves upward, so two lines never share the band.
 */
export const CaptionBand: React.FC<{ t: number; cues: CaptionCue[]; y?: number; size?: number }> = ({ t, cues, y = 962, size = 46 }) => (
  <div style={{ position: "absolute", left: 0, right: 0, top: y, height: size * 1.5, overflow: "hidden" }}>
    {cues.map((c, i) => {
      if (t < c.from - 0.05 || t > c.to + 0.05) return null;
      const e = envelope(t, c.from, c.to, 0.45, 0.25);
      const leaving = t > c.to - 0.25;
      const mark = new Set(c.mark ?? []);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 22,
            transform: `translateY(${(leaving ? -(1 - e) : 1 - e) * size * 1.2}px)`,
            opacity: clamp01(e * 3),
          }}
        >
          {c.no ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
              <Micro size={18} color={T.redlineInk}>
                {c.no}
              </Micro>
              <span style={{ width: 44, height: 2, background: T.redline }} />
            </span>
          ) : null}
          <span style={{ fontFamily: FONT.display, fontVariationSettings: wdth(90, 600), fontSize: size, letterSpacing: "-0.015em", color: T.ink, whiteSpace: "nowrap" }}>
            {c.text.split(" ").map((w, k) => (
              <span key={k} style={{ color: mark.has(w.replace(/[.,—:]/g, "")) ? T.redlineInk : undefined }}>
                {w}{" "}
              </span>
            ))}
          </span>
        </div>
      );
    })}
  </div>
);
