// Scene 4 — determinism. One source, compiled twice, and the SHA-256 of the two outputs
// side by side. The digest and the byte count are baked by tools/bake.mjs from two real
// compile() calls; the bake throws if they ever differ.
import React from "react";
import { compiled, highlight, inlineSvg } from "../arch";
import { Paper } from "../components/Ground";
import { SyntaxStyles } from "../components/Playground";
import { CaptionBand, Micro } from "../components/Type";
import baked from "../data/baked.json";
import { clamp01, cubicOut, hash, ramp, spring } from "../motion";
import { FONT, T } from "../tokens";

const LINES = baked.plan.split("\n").slice(1, 21);
const HEX = "0123456789abcdef";

const Digest: React.FC<{ t: number; at: number; digest: string; matchAt: number }> = ({ t, at, digest, matchAt }) => {
  const rows = [0, 1, 2, 3].map((r) => digest.slice(r * 16, r * 16 + 16));
  return (
    <div style={{ opacity: clamp01((t - at) / 0.15) }}>
      <Micro size={17}>sha-256 of the output</Micro>
      <div style={{ marginTop: 10, fontFamily: FONT.mono, fontSize: 35, lineHeight: 1.22, fontWeight: 500, letterSpacing: "0.02em" }}>
        {rows.map((row, r) => (
          <div key={r}>
            {row.split("").map((ch, c) => {
              const i = r * 16 + c;
              const settled = t >= at + 0.1 + i * 0.011;
              const shown = settled ? ch : HEX[Math.floor(hash(i * 13 + Math.floor(t * 30) * 7) * 16)];
              const matched = t >= matchAt + i * 0.009;
              return (
                <span key={c} style={{ color: matched ? T.ok : settled ? T.ink : T.inkMuted }}>
                  {shown}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number }> = ({ x1, y1, x2, y2, p }) => {
  const e = cubicOut(clamp01(p));
  const mx = (x1 + x2) / 2;
  const d = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
  return (
    <g opacity={clamp01(p * 4)}>
      <path d={d} fill="none" stroke={T.plumDeep} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - e} />
      <path d={`M${x2 - 14} ${y2 - 9} L${x2} ${y2} L${x2 - 14} ${y2 + 9}`} fill="none" stroke={T.plumDeep} strokeWidth={3} opacity={clamp01((p - 0.8) * 5)} />
    </g>
  );
};

export const Same: React.FC<{ t: number }> = ({ t }) => {
  const plan = compiled(baked.plan);
  const SW = 372;
  const SH = (SW * plan.viewBox[3]) / plan.viewBox[2];
  const Y = [118, 118 + SH + 44];
  const AT = [1.15, 1.85];
  const MATCH = 3.1;
  const badge = spring(t - MATCH - 0.55, 0.55, 20);
  return (
    <Paper dx={-t * 4}>
      <SyntaxStyles />
      {/* the source */}
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 150,
          width: 610,
          height: 690,
          background: T.srcSurface,
          border: `1px solid ${T.srcRule}`,
          borderRadius: 4,
          boxShadow: "0 14px 34px rgba(28,36,48,0.14)",
          overflow: "hidden",
          opacity: clamp01((t - 0.15) / 0.2),
          transform: `translateY(${(1 - spring(t - 0.15, 0.72, 15)) * 40}px)`,
        }}
      >
        <div style={{ height: 50, display: "flex", alignItems: "center", padding: "0 20px", background: T.srcBg, borderBottom: `1px solid ${T.hairline}` }}>
          <Micro size={17} color={T.srcMuted}>
            source.arch
          </Micro>
        </div>
        <div style={{ padding: "16px 20px", fontFamily: FONT.mono, fontSize: 19.5, lineHeight: 1.6, color: T.srcFg, whiteSpace: "pre" }}>
          {LINES.map((l, i) => (
            <div key={i} style={{ height: 31.2 }} dangerouslySetInnerHTML={{ __html: highlight(l.length > 46 ? l.slice(0, 45) + "…" : l) || "&nbsp;" }} />
          ))}
        </div>
      </div>

      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {Y.map((y, i) => (
          <Arrow key={i} x1={712} y1={495} x2={826} y2={y + SH / 2} p={ramp(t, AT[i] - 0.45, AT[i])} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 716, top: 476, opacity: clamp01((t - 0.6) / 0.2) }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 19, fontWeight: 500, color: T.plumDeep, background: T.paper, border: `1.5px solid ${T.plumDeep}`, borderRadius: 4, padding: "5px 9px" }}>compile()</span>
      </div>

      {Y.map((y, i) => {
        const s = spring(t - AT[i], 0.62, 18);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: 840, top: y, width: SW, height: SH, opacity: clamp01((t - AT[i]) / 0.12), transform: `scale(${0.9 + 0.1 * s})`, background: "#fff", border: `1px solid ${T.hairline}`, boxShadow: "0 8px 22px rgba(28,36,48,0.14)" }}>
              <div style={{ width: "100%", height: "100%" }} dangerouslySetInnerHTML={{ __html: inlineSvg(plan.svg, "sm" + i) }} />
            </div>
            <div style={{ position: "absolute", left: 1290, top: y + SH / 2 - 108 }}>
              <Micro size={17} color={T.redlineInk} style={{ display: "block", marginBottom: 14, opacity: clamp01((t - AT[i]) / 0.15) }}>
                Compile {i + 1}
              </Micro>
              <Digest t={t} at={AT[i] + 0.1} digest={i ? baked.determinism.second : baked.determinism.first} matchAt={MATCH} />
            </div>
          </React.Fragment>
        );
      })}

      {/* the verdict, between the two digests */}
      <div
        style={{
          position: "absolute",
          left: 1290,
          top: Y[1] - 22 - 28,
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "0 22px",
          background: T.ok,
          color: "#fff",
          borderRadius: 4,
          opacity: clamp01((t - MATCH - 0.55) / 0.1),
          transform: `scale(${0.8 + 0.2 * badge})`,
          transformOrigin: "0 50%",
          boxShadow: "0 8px 20px rgba(46,125,50,0.28)",
        }}
      >
        <span style={{ fontFamily: FONT.mono, fontSize: 30, fontWeight: 600 }}>=</span>
        <Micro size={20} color="#fff">
          byte-identical · {baked.determinism.bytes.toLocaleString("en-US")} bytes
        </Micro>
      </div>

      <CaptionBand
        t={t}
        cues={[
          { from: 0.5, to: 3.0, text: "Same source in.", no: "03" },
          { from: 3.2, to: 5.8, text: "The same bytes out — every time.", mark: ["same"] },
        ]}
      />
    </Paper>
  );
};
