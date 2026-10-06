// Scene 1 — the problem. A generated floor plan is a picture, and a picture answers no
// questions. The "picture" here is the film's own plan, deliberately degraded (blurred,
// tilted, labelled as a bitmap); at the turn it snaps back into focus, because the same
// plan as a program is the answer the next scene gives.
import React from "react";
import { compiled, inlineSvg } from "../arch";
import { Paper } from "../components/Ground";
import { Micro, Words } from "../components/Type";
import baked from "../data/baked.json";
import { clamp01, cubicInOut, envelope, lerp, ramp, spring } from "../motion";
import { FONT, T } from "../tokens";

const QUESTIONS = [
  { at: 2.5, x: 62, y: 96, w: 268, h: 356, label: "How big is this room?", lx: -92, ly: -84 },
  { at: 2.8, x: 352, y: 96, w: 176, h: 138, label: "Can you reach the bath?", lx: -26, ly: -62 },
  { at: 3.1, x: 352, y: 252, w: 176, h: 200, label: "Move a wall? Re-roll it.", lx: -200, ly: 218 },
];

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  const plan = compiled(baked.plan);
  const turn = cubicInOut(ramp(t, 4.25, 4.95));
  const arrive = spring(t - 0.15, 0.7, 14);
  const S = 600;
  const H = (S * plan.viewBox[3]) / plan.viewBox[2];
  return (
    <Paper dx={-t * 5} dy={-t * 3}>
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        <Words text="AI can draw" t={t} at={0.3} out={2.05} size={132} />
        <Words text="a floor plan." t={t} at={0.55} out={2.1} size={132} />
      </div>
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        <Words text="But a picture" t={t} at={2.25} out={4.1} size={132} />
        <Words text="can't be checked." t={t} at={2.5} out={4.15} size={132} accent={{ checked: T.redlineInk }} />
      </div>
      <div style={{ position: "absolute", left: 130, top: 300 }}>
        <Words text="What if the plan" t={t} at={4.3} size={132} />
        <Words text="were a program?" t={t} at={4.55} size={132} accent={{ program: T.plumDeep }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 1180,
          top: 215,
          width: S,
          transform: `translateY(${(1 - arrive) * 50}px) rotate(${lerp(-2.4, 0, turn)}deg)`,
          opacity: clamp01((t - 0.15) / 0.2),
        }}
      >
        <div style={{ width: S, height: H, background: "#fff", border: `1px solid ${T.hairline}`, boxShadow: "0 18px 50px rgba(28,36,48,0.18)", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", filter: `blur(${lerp(5.5, 0, turn)}px) contrast(${lerp(0.82, 1, turn)})`, transform: `scale(${lerp(1.03, 1, turn)})` }} dangerouslySetInnerHTML={{ __html: inlineSvg(plan.svg, "hk") }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 21, color: T.inkMuted }}>{turn < 0.5 ? "floor-plan.png" : "plan.arch"}</span>
          <Micro size={17}>{turn < 0.5 ? "pixels" : "a program"}</Micro>
        </div>

        {/* redline review marks — the questions a picture cannot answer */}
        {QUESTIONS.map((q, i) => {
          const e = envelope(t, q.at, 4.35, 0.3, 0.25);
          if (e <= 0) return null;
          return (
            <div key={i} style={{ position: "absolute", left: 0, top: 0, opacity: clamp01(e * 2) }}>
              <div style={{ position: "absolute", left: q.x, top: q.y, width: q.w, height: q.h, border: `3px dashed ${T.redline}`, borderRadius: 6, transform: `scale(${0.9 + 0.1 * e})` }} />
              <div
                style={{
                  position: "absolute",
                  left: q.x + q.lx,
                  top: q.y + q.ly,
                  whiteSpace: "nowrap",
                  padding: "10px 18px",
                  background: T.paperPanel,
                  border: `2px solid ${T.redline}`,
                  borderRadius: 4,
                  fontFamily: FONT.body,
                  fontWeight: 600,
                  fontSize: 27,
                  color: T.redlineInk,
                  boxShadow: "0 6px 18px rgba(28,36,48,0.14)",
                  transform: `translateY(${(1 - e) * 14}px)`,
                }}
              >
                {q.label}
              </div>
            </div>
          );
        })}
      </div>
    </Paper>
  );
};
