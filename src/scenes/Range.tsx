// Scene 6 — range. First a wall of real example plans from the ArchLang repo (compiled by
// the CLI in tools/bake.mjs), three rows drifting against each other; then one plan held
// still while the compiler's own render themes and export formats are counted off.
import React from "react";
import { compiled, inlineSvg } from "../arch";
import { Paper } from "../components/Ground";
import { CaptionBand, Micro } from "../components/Type";
import baked from "../data/baked.json";
import galleryData from "../data/gallery.json";
import { clamp01, cubicInOut, expoOut, ramp, spring } from "../motion";
import { FONT, T, wdth } from "../tokens";

const gallery = galleryData as { name: string; title: string; paper: boolean; svg: string }[];
const TILES = gallery.map((g, i) => {
  const vb = /viewBox="([^"]+)"/.exec(g.svg)![1].split(/\s+/).map(Number);
  return { ...g, html: inlineSvg(g.svg, "g" + i), aspect: vb[2] / vb[3] };
});

// the View selector's options and the Issue selector's formats, as the playground lists them
const THEMES = [
  { label: "Default", key: undefined },
  { label: "Blueprint", key: "blueprint" },
  { label: "Dark", key: "dark" },
  { label: "Mono", key: "mono" },
  { label: "Presentation", key: "presentation" },
] as const;
const FORMATS = ["SVG", "PNG", "DXF", "TXT", "PDF"];

const SPLIT = 4.3;
const ROW_H = 290;

export const Range: React.FC<{ t: number }> = ({ t }) => {
  const toFocus = cubicInOut(ramp(t, SPLIT - 0.35, SPLIT + 0.35));
  // each row is laid twice end to end so the drift never runs out of sheets
  const rows = [0, 1, 2].map((r) => TILES.filter((_, i) => i % 3 === r)).map((row) => [...row, ...row]);

  const themeIdx = Math.min(THEMES.length - 1, Math.max(0, Math.floor((t - SPLIT - 0.5) / 0.55)));
  const sinceTheme = t - SPLIT - 0.5 - themeIdx * 0.55;
  const cur = compiled(baked.plan, THEMES[themeIdx].key);
  const prev = compiled(baked.plan, THEMES[Math.max(0, themeIdx - 1)].key);
  const vb = cur.viewBox;
  const FH = 700;
  const FW = (FH * vb[2]) / vb[3];
  const wipe = expoOut(ramp(sinceTheme, 0, 0.3));

  return (
    <Paper dx={-t * 6}>
      {/* the wall */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - toFocus, transform: `scale(${1 + toFocus * 0.08})` }}>
        {rows.map((row, r) => {
          const dir = r % 2 === 0 ? -1 : 1;
          const drift = dir * (t * 46 + 60) + (r % 2 === 0 ? 40 : -380);
          return (
            <div key={r} style={{ position: "absolute", left: drift, top: 44 + r * (ROW_H + 26), height: ROW_H, display: "flex", gap: 34 }}>
              {row.map((tile, i) => {
                const w = Math.min(ROW_H * tile.aspect, 560);
                const tau = t - 0.1 - (i + r * 0.5) * 0.07;
                const s = spring(tau, 0.66, 16);
                return (
                  <div key={i} style={{ width: w, flex: "none", opacity: clamp01(tau / 0.12), transform: `translateY(${(1 - s) * 44}px)` }}>
                    <div style={{ width: w, height: ROW_H - 34, background: "#fff", border: `1px solid ${T.hairline}`, boxShadow: "0 8px 22px rgba(28,36,48,0.13)", overflow: "hidden" }}>
                      {/* a plan set on a paper size sits small on its sheet — lean in on the drawing */}
                      <div style={{ width: "100%", height: "100%", transform: tile.paper ? "scale(1.75)" : undefined, transformOrigin: "50% 36%" }} dangerouslySetInnerHTML={{ __html: tile.html }} />
                    </div>
                    <div style={{ marginTop: 9 }}>
                      <Micro size={15}>{tile.title}</Micro>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* one plan, five themes, five formats */}
      {toFocus > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: toFocus }}>
          <div style={{ position: "absolute", left: 250, top: 196, width: 330 }}>
            <Micro size={18}>View</Micro>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {THEMES.map((th, i) => {
                const on = i === themeIdx && t > SPLIT + 0.5;
                return (
                  <div
                    key={th.label}
                    style={{
                      fontFamily: FONT.body,
                      fontSize: 30,
                      fontWeight: on ? 600 : 400,
                      padding: "9px 20px",
                      border: `1.5px solid ${on ? T.plumDeep : T.srcRule}`,
                      borderRadius: 4,
                      background: on ? "rgba(128,82,255,0.10)" : T.srcSurface,
                      color: on ? T.plumDeep : T.srcFg,
                      transform: `translateX(${on ? 12 : 0}px)`,
                    }}
                  >
                    {th.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: "absolute", left: (1920 - FW) / 2, top: 150, width: FW, height: FH, background: "#fff", border: `1px solid ${T.hairline}`, boxShadow: "0 18px 46px rgba(28,36,48,0.2)", overflow: "hidden", transform: `scale(${0.94 + 0.06 * toFocus})` }}>
            <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: inlineSvg(prev.svg, "rp") }} />
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }} dangerouslySetInnerHTML={{ __html: inlineSvg(cur.svg, "rc") }} />
          </div>

          <div style={{ position: "absolute", left: 1340, top: 196, width: 330 }}>
            <Micro size={18}>Issue</Micro>
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {FORMATS.map((f, i) => {
                const tau = t - SPLIT - 0.7 - i * 0.42;
                const s = spring(tau, 0.5, 26);
                return (
                  <div
                    key={f}
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 34,
                      fontWeight: 600,
                      padding: "12px 24px",
                      borderRadius: 4,
                      border: `1.5px solid ${tau > 0 ? T.redlineInk : T.srcRule}`,
                      background: tau > 0 ? T.redlineInk : T.srcSurface,
                      color: tau > 0 ? "#fff" : T.srcMuted,
                      transform: `scale(${tau > 0 ? 0.86 + 0.14 * s : 1})`,
                    }}
                  >
                    {f}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 34, fontFamily: FONT.display, fontVariationSettings: wdth(88, 500), fontSize: 27, lineHeight: 1.35, color: T.inkMuted, opacity: clamp01((t - SPLIT - 1.2) / 0.3) }}>
              Zero runtime dependencies. Runs in Node and in the browser.
            </div>
          </div>
        </div>
      ) : null}

      <CaptionBand
        t={t}
        cues={[
          { from: 0.5, to: SPLIT - 0.2, text: "From a two-bed flat to a city museum.", no: "05" },
          { from: SPLIT + 0.2, to: 7.8, text: "One source. Five themes. Five formats.", mark: ["One"] },
        ]}
      />
    </Paper>
  );
};
