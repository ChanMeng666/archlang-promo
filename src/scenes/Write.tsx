// Scene 3 — the playground, one unbroken shot.
//   0–14 s  the source streams in, a line at a time, and the plan compiles as it grows
//   14–22 s one number changes and the whole drawing follows
//
// Nothing is faked: at every frame the text in the editor is cut to whole lines, any open
// block is closed, and that source goes through the real compile(). While `W` is being
// scrubbed, each frame is its own compile of its own number.
import React, { useMemo } from "react";
import { compiled, inlineSvg, prefix } from "../arch";
import { CaptionBand, Micro } from "../components/Type";
import { Paper } from "../components/Ground";
import { CHAR_W, EDITOR_H, LINE_H, PG_H, PG_W, Playground } from "../components/Playground";
import baked from "../data/baked.json";
import { clamp01, cubicInOut, expoOut, lerp, ramp, spring } from "../motion";
import { FONT, T } from "../tokens";

const LINES = baked.plan.replace(/\n$/, "").split("\n");
const W_LINE = LINES.findIndex((l) => /^\s*let W = \d+/.test(l));
const W_FROM = Number(/let W = (\d+)/.exec(LINES[W_LINE])![1]);
const W_TO = 5400;
const W_COL = LINES[W_LINE].indexOf(String(W_FROM));

// ── the typing schedule ──────────────────────────────────────────────────────
// An agent is writing this, so it arrives at a model's pace, not a typist's: a steady
// stream with a breath at every blank line, which is also where one kind of element
// ends and the next begins.
const TYPE_FROM = 1.0;
const TYPE_TO = 12.3;
const BREATH = 0.3;
const SCHEDULE = (() => {
  const chars = LINES.reduce((s, l) => s + l.length, 0);
  const breaths = LINES.filter((l) => l.trim() === "").length;
  const cps = chars / (TYPE_TO - TYPE_FROM - breaths * BREATH);
  let t = TYPE_FROM;
  return LINES.map((l) => {
    const start = t;
    t += l.trim() === "" ? BREATH : l.length / cps;
    return { start, end: t };
  });
})();

const EDIT_AT = 14;
const SCRUB_FROM = EDIT_AT + 1.5;
const SCRUB_TO = EDIT_AT + 4.3;

const WIN_SCALE = 1680 / PG_W;
const WIN_X = (1920 - PG_W * WIN_SCALE) / 2;
const WIN_Y = 62;

export const Write: React.FC<{ t: number }> = ({ t }) => {
  // how much has been typed
  let done = 0;
  while (done < LINES.length && t >= SCHEDULE[done].end) done++;
  const typing = done < LINES.length && t >= TYPE_FROM;
  const partial = typing ? LINES[done].slice(0, Math.floor(LINES[done].length * clamp01((t - SCHEDULE[done].start) / (SCHEDULE[done].end - SCHEDULE[done].start)))) : "";

  // the number
  const scrub = cubicInOut(ramp(t, SCRUB_FROM, SCRUB_TO));
  const W = Math.round(lerp(W_FROM, W_TO, scrub) / 50) * 50; // the plan's own `grid 50`
  const editing = t >= EDIT_AT;

  const shown = useMemo(() => {
    const ls = LINES.slice(0, done);
    if (typing) ls.push(partial);
    if (editing) ls[W_LINE] = LINES[W_LINE].replace(String(W_FROM), String(W));
    return ls.join("\n");
  }, [done, partial, typing, editing, W]);

  // what the compiler sees: whole lines only
  const srcNow = useMemo(() => {
    const ls = LINES.slice();
    ls[W_LINE] = LINES[W_LINE].replace(String(W_FROM), String(W));
    return prefix(ls, done);
  }, [done, W]);
  const now = compiled(srcNow);
  const before = done > 0 ? compiled(prefix(LINES, done - 1)) : null;
  const finalVB = compiled(baked.plan).viewBox;
  const vb = editing ? now.viewBox : finalVB;

  const sinceLine = done > 0 ? t - SCHEDULE[done - 1].end : 0;
  const mix = editing ? 1 : ramp(sinceLine, 0, 0.14);
  const layers = [];
  if (before && !before.empty && before.ok && mix < 1) layers.push({ html: inlineSvg(before.svg, "wb", vb), opacity: 1 });
  if (!now.empty && now.ok) layers.push({ html: inlineSvg(now.svg, "wn", vb), opacity: mix });

  // the editor follows its caret; when the edit begins it returns to the top
  const caretLine = editing ? W_LINE : Math.min(done, LINES.length - 1);
  const caretFrac = typing ? done + clamp01((t - SCHEDULE[done].start) / (SCHEDULE[done].end - SCHEDULE[done].start)) : done;
  const follow = Math.max(0, (caretFrac - 16.5) * LINE_H);
  const maxScroll = Math.max(0, LINES.length * LINE_H + 20 - EDITOR_H);
  const scrollTop = lerp(Math.min(follow, maxScroll), 0, cubicInOut(ramp(t, EDIT_AT, EDIT_AT + 0.7)));

  const blink = Math.floor(t / 0.53) % 2 === 0;
  const caret = editing
    ? { line: W_LINE, col: W_COL + 4, visible: t < SCRUB_FROM ? blink : t > SCRUB_TO ? blink : true }
    : { line: caretLine, col: typing ? partial.length : LINES[caretLine].length, visible: typing || blink };

  // the window arrives on a spring
  const arrive = spring(t - 0.1, 0.72, 15);
  const lens = spring(t - (EDIT_AT + 0.75), 0.62, 18);
  const lensOut = expoOut(ramp(t, 21.2, 21.6));

  const totals0 = compiled(baked.plan).totals!;
  return (
    <Paper>
      <div style={{ position: "absolute", left: WIN_X, top: WIN_Y - 34, opacity: clamp01((t - 0.3) / 0.3) }}>
        <Micro size={17} color={T.inkMuted}>
          playground.archlang.uk
        </Micro>
      </div>
      <div
        style={{
          position: "absolute",
          left: WIN_X,
          top: WIN_Y,
          width: PG_W,
          height: PG_H,
          transformOrigin: "0 0",
          transform: `translateY(${(1 - arrive) * 46}px) scale(${WIN_SCALE})`,
          opacity: clamp01(t / 0.18),
          boxShadow: "0 0 0 0.6px rgba(28,36,48,0.28), 0 14px 34px rgba(28,36,48,0.16)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Playground
          source={shown}
          caret={caret}
          activeLine={caretLine}
          selection={editing ? { line: W_LINE, from: W_COL, to: W_COL + 4 } : null}
          scrollTop={scrollTop}
          layers={layers}
          sheetAspect={vb[2] / vb[3]}
          status={{ text: "ready", err: false }}
          facts={now.totals}
          entrance={now.entrance}
          exampleLabel="Laneway house"
        />
      </div>

      {/* the lens: the one line that is changing, large enough to read from the back row */}
      {lens > 0.001 && lensOut < 1 ? (
        <div
          style={{
            position: "absolute",
            left: WIN_X + 150,
            top: WIN_Y + 358,
            transformOrigin: "0 0",
            transform: `scale(${0.82 + 0.18 * lens}) translateY(${(1 - lens) * 24}px)`,
            opacity: clamp01(lens * 2.5) * (1 - lensOut),
            background: T.srcSurface,
            border: `1.5px solid ${T.srcRule}`,
            borderRadius: 8,
            boxShadow: "0 22px 60px rgba(28,36,48,0.22)",
            padding: "26px 36px 24px",
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 68, lineHeight: 1.1, color: T.srcFg, whiteSpace: "pre", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: T.synKeyword, fontWeight: 600 }}>let</span> W <span style={{ color: T.synOperator }}>=</span>{" "}
            <span style={{ color: T.synNumber, background: "rgba(128,82,255,0.26)", padding: "0 10px", borderRadius: 4 }}>{W}</span>
          </div>
          <div style={{ marginTop: 18, display: "flex", gap: 34, alignItems: "baseline" }}>
            <Micro size={17}>Floor area</Micro>
            <span style={{ fontFamily: FONT.mono, fontSize: 30, fontWeight: 600, color: T.ink, fontVariantNumeric: "tabular-nums" }}>
              {(now.totals ?? totals0).floor_area_m2.toFixed(2)} m²
            </span>
            <Micro size={17}>Compiled</Micro>
            <span style={{ fontFamily: FONT.mono, fontSize: 30, fontWeight: 600, color: T.ok }}>this frame</span>
          </div>
        </div>
      ) : null}

      <CaptionBand
        t={t}
        cues={[
          { from: 0.9, to: 4.9, text: "A floor plan, written as plain text.", no: "01" },
          { from: 5.1, to: 9.2, text: "Every line compiles — live, in the browser.", mark: ["compiles"] },
          { from: 9.4, to: 13.6, text: "Doors attach to walls. Furniture snaps to rooms." },
          { from: EDIT_AT + 0.3, to: EDIT_AT + 4.0, text: "Change one number.", no: "02", mark: ["one"] },
          { from: EDIT_AT + 4.2, to: 21.7, text: "The whole drawing follows — dimensions included." },
        ]}
      />
    </Paper>
  );
};

export const WRITE_BEATS = { TYPE_FROM, TYPE_TO, EDIT_AT, SCRUB_FROM, SCRUB_TO, SCHEDULE, CHAR_W };
