// Scene 7 — the lockup. It rhymes with scene 2: the same mark, the same dimension
// string, now with somewhere to go.
import React from "react";
import { Paper } from "../components/Ground";
import { Micro, Words } from "../components/Type";
import { clamp01, cubicOut, ramp, spring } from "../motion";
import { FONT, T } from "../tokens";
import { DimLine, Lockup } from "./Title";

const INSTALL = "npm install @chanmeng666/archlang";
const LINKS = ["archlang.uk", "playground.archlang.uk", "github.com/ChanMeng666/archlang"];

export const End: React.FC<{ t: number }> = ({ t }) => {
  const typed = Math.floor(clamp01((t - 1.7) / 0.9) * INSTALL.length);
  const chip = spring(t - 1.45, 0.66, 17);
  return (
    <Paper tone="source" dx={-t * 3}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Lockup t={t} at={0.35} size={150} />
        <div style={{ marginTop: 22 }}>
          <DimLine width={760} p={ramp(t, 0.8, 1.4)} label="text in · drawing out" />
        </div>
        <div style={{ marginTop: 26 }}>
          <Words text="Floor plans as code." t={t} at={0.95} size={70} weight={600} width={92} align="center" />
        </div>

        <div
          style={{
            marginTop: 46,
            padding: "20px 34px",
            background: T.srcSurface,
            border: `1.5px solid ${T.srcRule}`,
            borderRadius: 6,
            boxShadow: "0 12px 30px rgba(28,36,48,0.13)",
            fontFamily: FONT.mono,
            fontSize: 38,
            color: T.srcFg,
            whiteSpace: "pre",
            minWidth: 880,
            opacity: clamp01((t - 1.45) / 0.12),
            transform: `translateY(${(1 - chip) * 26}px)`,
          }}
        >
          <span style={{ color: T.plumDeep, fontWeight: 600 }}>$ </span>
          {INSTALL.slice(0, typed)}
          {t < 2.9 || Math.floor(t / 0.53) % 2 === 0 ? <span style={{ display: "inline-block", width: 20, height: 40, verticalAlign: -7, background: T.srcFg, marginLeft: 2 }} /> : null}
        </div>

        <div style={{ marginTop: 40, display: "flex", gap: 44, alignItems: "center" }}>
          {LINKS.map((l, i) => {
            const tau = t - 2.9 - i * 0.14;
            return (
              <span key={l} style={{ fontFamily: FONT.mono, fontSize: 28, color: i === 1 ? T.plumDeep : T.srcFg, fontWeight: 500, opacity: clamp01(tau / 0.15), transform: `translateY(${(1 - cubicOut(clamp01(tau / 0.4))) * 14}px)` }}>
                {l}
              </span>
            );
          })}
        </div>
        <div style={{ marginTop: 34, opacity: clamp01((t - 3.5) / 0.3) }}>
          <Micro size={20}>Open source · MIT · zero dependencies</Micro>
        </div>
      </div>
    </Paper>
  );
};
