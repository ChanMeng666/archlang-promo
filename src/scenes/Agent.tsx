// Scene 5 — the agent loop. A terminal on the left, the drawing on the right.
//
// Every line of output is the real `arch` CLI's, captured by tools/bake.mjs running the
// vendored compiler over a draft with two flaws (a pocket door given a `hinge` clause; a
// bedroom with no window). The film condenses the JSON — it picks fields, it never
// rewrites one — and the sheet on the right is compiled live from the same source the
// CLI was looking at in that step.
import React from "react";
import { compiled, inlineSvg } from "../arch";
import { Paper } from "../components/Ground";
import { Sheet } from "../components/Playground";
import { CaptionBand, Micro } from "../components/Type";
import baked from "../data/baked.json";
import { clamp01, cubicInOut, cubicOut, envelope, ramp, spring } from "../motion";
import { FONT, T, wdth } from "../tokens";
import { describe } from "@chanmeng666/archlang";

type Tone = "cmd" | "out" | "key" | "bad" | "ok" | "warn" | "add" | "del" | "dim" | "note";
interface Line {
  text: string;
  tone: Tone;
}
interface Block {
  at: number;
  cmd?: string;
  lines: Line[];
  exit?: number;
}

const step = (id: string) => baked.steps.find((s) => s.id === id)!;
const json = (id: string) => JSON.parse(step(id).stdout);
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

// ── the transcript, derived ──────────────────────────────────────────────────
const cErr = json("compile").diagnostics[0];
const fixLines = step("fix").stderr.split("\n");
const vWarn = json("validate").diagnostics[0];
const sug = json("suggest").suggestions[0];
const inserted = sug.candidates[0].insertText as string;
const facts = describe(baked.afterSuggest) as unknown as {
  caption: string;
  rooms: { id: string; label: string; area_m2: number }[];
  totals: { rooms: number; doors: number; windows: number; floor_area_m2: number };
  access: { entrances: string[]; rooms: { id: string; depthFromEntrance: number; reachable: boolean }[] };
};
if (JSON.parse(step("describe").stdout).caption !== facts.caption) throw new Error("describe() in the bundle disagrees with the baked CLI run");

const BLOCKS: Block[] = [
  {
    at: 0.7,
    cmd: step("compile").cmd,
    exit: step("compile").exit!,
    lines: [
      { text: `{ "ok": false,`, tone: "bad" },
      { text: `  "diagnostics": [{`, tone: "out" },
      { text: `    "code": "${cErr.code}",`, tone: "bad" },
      { text: `    "message": ${JSON.stringify(clip(cErr.message, 46))},`, tone: "out" },
      { text: `    "line": ${cErr.line}, "col": ${cErr.col},`, tone: "out" },
      { text: `    "fixes": [{ "applicability": "${cErr.fixes[0].applicability}",`, tone: "key" },
      { text: `      "title": ${JSON.stringify(clip(cErr.fixes[0].title, 48))} }]`, tone: "key" },
      { text: `  }] }`, tone: "out" },
    ],
  },
  {
    at: 3.9,
    cmd: step("fix").cmd,
    exit: step("fix").exit!,
    lines: [
      ...fixLines.filter((l) => /^[-+] /.test(l)).map((l): Line => ({ text: l, tone: l[0] === "+" ? "add" : "del" })),
      ...fixLines.filter((l) => /^\s+applied /.test(l)).map((l): Line => ({ text: clip(l.trim(), 66), tone: "dim" })),
      { text: fixLines.at(-1)!, tone: "ok" },
    ],
  },
  {
    at: 6.4,
    cmd: step("validate").cmd,
    exit: step("validate").exit!,
    lines: [
      { text: `{ "ok": false, "strict": true,`, tone: "warn" },
      { text: `  "diagnostics": [{ "code": "${vWarn.code}",`, tone: "warn" },
      { text: `    "message": ${JSON.stringify(vWarn.message)} }] }`, tone: "out" },
    ],
  },
  {
    at: 8.3,
    cmd: step("suggest").cmd,
    exit: step("suggest").exit!,
    lines: [
      { text: `{ "code": "${sug.code}", "roomId": "${sug.roomId}",`, tone: "out" },
      { text: `  "candidates": [{`, tone: "out" },
      { text: `    "insertText": "${inserted}",`, tone: "key" },
      { text: `    "rationale": ${JSON.stringify(clip(sug.candidates[0].rationale, 44))} }, …`, tone: "out" },
      { text: `» edit plan.arch   + ${inserted}`, tone: "note" },
    ],
  },
  {
    at: 10.9,
    cmd: step("describe").cmd,
    exit: step("describe").exit!,
    lines: [
      { text: `{ "ok": true, "plan": ${JSON.stringify(json("describe").plan)},`, tone: "ok" },
      { text: `  "rooms": [ ${facts.rooms.map((r) => `${r.id} ${r.area_m2} m²`).join(" · ")} ],`, tone: "out" },
      { text: `  "totals": { "doors": ${facts.totals.doors}, "windows": ${facts.totals.windows}, "floor_area_m2": ${facts.totals.floor_area_m2} },`, tone: "out" },
      { text: `  "access": { "entrances": ${facts.access.entrances.length}, "reachable": "${facts.access.rooms.filter((r) => r.reachable).length} of ${facts.access.rooms.length}" }, … }`, tone: "key" },
    ],
  },
  {
    at: 13.7,
    cmd: step("gate").cmd,
    exit: step("gate").exit!,
    lines: [{ text: step("gate").stdout, tone: "ok" }],
  },
];

const TONE: Record<Tone, string> = {
  cmd: T.srcFg,
  out: T.srcMuted,
  key: T.plumDeep,
  bad: T.redlineInk,
  ok: T.ok,
  warn: T.warnInk,
  add: T.ok,
  del: T.redlineInk,
  dim: T.srcMuted,
  note: T.synAtom,
};

const LH = 37;
const TERM = { x: 84, y: 70, w: 1060, h: 850, head: 54 };
const CPS = 46;
const OUT_DELAY = 0.22;
const OUT_STAGGER = 0.045;

const Terminal: React.FC<{ t: number }> = ({ t }) => {
  // lay the transcript out as rows with the time each becomes visible
  const rows: { at: number; node: React.ReactNode; gap?: boolean }[] = [];
  for (const b of BLOCKS) {
    const cmd = b.cmd!;
    const typed = Math.floor(clamp01((t - b.at) / (cmd.length / CPS)) * cmd.length);
    const cmdDone = b.at + cmd.length / CPS;
    rows.push({
      at: b.at - 0.08,
      gap: rows.length > 0,
      node: (
        <>
          <span style={{ color: T.plumDeep, fontWeight: 600 }}>$ </span>
          <span style={{ color: T.srcFg, fontWeight: 500 }}>{cmd.slice(0, typed)}</span>
          {t < cmdDone + 0.1 ? <span style={{ display: "inline-block", width: 13, height: 26, verticalAlign: -5, background: T.srcFg, marginLeft: 1 }} /> : null}
          {b.exit !== undefined && t > cmdDone + OUT_DELAY ? (
            <span
              style={{
                float: "right",
                fontFamily: FONT.display,
                fontVariationSettings: wdth(85, 600),
                fontSize: 16,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0 10px",
                lineHeight: "26px",
                marginTop: 5,
                borderRadius: 3,
                color: "#fff",
                background: b.exit === 0 ? T.ok : T.redlineInk,
              }}
            >
              exit {b.exit}
            </span>
          ) : null}
        </>
      ),
    });
    b.lines.forEach((l, i) => {
      rows.push({
        at: cmdDone + OUT_DELAY + i * OUT_STAGGER + (l.tone === "note" ? 0.55 : 0),
        node: <span style={{ color: TONE[l.tone], fontWeight: l.tone === "ok" || l.tone === "note" ? 600 : 400 }}>{l.text}</span>,
      });
    });
  }
  // rows stack; the view follows the newest row once the card is full
  let y = 0;
  const placed = rows.map((r) => {
    if (r.gap) y += 16;
    const top = y;
    y += LH;
    return { ...r, top };
  });
  const viewH = TERM.h - TERM.head - 36;
  let scroll = 0;
  let reached = 0;
  for (const r of placed) {
    const need = Math.max(0, r.top + LH - viewH);
    if (need > reached) {
      scroll += (need - reached) * cubicInOut(ramp(t, r.at - 0.05, r.at + 0.3));
      reached = need;
    }
  }
  return (
    <div style={{ position: "absolute", left: TERM.x, top: TERM.y, width: TERM.w, height: TERM.h, background: T.srcSurface, border: `1px solid ${T.srcRule}`, borderRadius: 5, boxShadow: "0 16px 40px rgba(28,36,48,0.16)", overflow: "hidden" }}>
      <div style={{ height: TERM.head, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: T.srcBg, borderBottom: `1px solid ${T.hairline}` }}>
        <Micro size={17} color={T.srcMuted}>
          agent · shell
        </Micro>
        <Micro size={17} color={T.srcMuted}>
          arch {baked.version}
        </Micro>
      </div>
      <div style={{ position: "absolute", left: 26, right: 26, top: TERM.head + 18, bottom: 18, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -scroll, fontFamily: FONT.mono, fontSize: 23.5, lineHeight: `${LH}px`, whiteSpace: "pre" }}>
          {placed.map((r, i) =>
            t >= r.at ? (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: r.top, height: LH, opacity: clamp01((t - r.at) / 0.08), transform: `translateY(${(1 - cubicOut(ramp(t, r.at, r.at + 0.18))) * 8}px)` }}>
                {r.node}
              </div>
            ) : null,
          )}
        </div>
      </div>
    </div>
  );
};

// ── the drawing ──────────────────────────────────────────────────────────────
const FIXED_AT = 4.75; //  `arch fix` has rewritten the file
const WARN_AT = 7.35; //   validate has named the bedroom
const INSERT_AT = 10.0; // the suggested window is in the source
const FACTS_AT = 11.7;
const PASS_AT = 14.45;

const AccessGraph: React.FC<{ t: number }> = ({ t }) => {
  // the playground's Describe tab: one column per depth-from-entrance
  const depths = [...new Set(facts.access.rooms.map((r) => r.depthFromEntrance))].sort();
  const cols = [{ head: "Entrance", cards: facts.access.entrances.map((e) => ({ label: e, meta: "exterior door", door: true })) }].concat(
    depths.map((d) => ({
      head: `Depth ${d}`,
      cards: facts.access.rooms.filter((r) => r.depthFromEntrance === d).map((r) => ({ label: facts.rooms.find((x) => x.id === r.id)!.label, meta: `${facts.rooms.find((x) => x.id === r.id)!.area_m2} m² · reachable`, door: false })),
    })),
  );
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 12 }}>
      {cols.map((c, ci) => (
        <React.Fragment key={ci}>
          {ci > 0 ? <div style={{ alignSelf: "center", color: T.inkMuted, fontSize: 26, opacity: clamp01((t - FACTS_AT - ci * 0.18) / 0.15) }}>→</div> : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 196 }}>
            <Micro size={15}>{c.head}</Micro>
            {c.cards.map((card, k) => {
              const tau = t - FACTS_AT - ci * 0.18 - k * 0.07;
              const s = spring(tau, 0.62, 18);
              return (
                <div
                  key={k}
                  style={{
                    border: card.door ? `1.5px dashed ${T.hairline}` : `1.5px solid ${T.hairline}`,
                    borderLeft: card.door ? undefined : `4px solid ${T.ink}`,
                    borderRadius: 4,
                    padding: "9px 13px",
                    background: T.paperPanel,
                    opacity: clamp01(tau / 0.1),
                    transform: `translateY(${(1 - s) * 16}px)`,
                  }}
                >
                  <div style={{ fontFamily: card.door ? FONT.mono : FONT.body, fontWeight: 600, fontSize: 21, color: T.ink }}>{card.label}</div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 15.5, color: T.inkMuted, marginTop: 2, whiteSpace: "nowrap" }}>{card.meta}</div>
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export const Agent: React.FC<{ t: number }> = ({ t }) => {
  const broken = compiled(baked.draft);
  const fixed = compiled(baked.afterFix);
  const final = compiled(baked.afterSuggest);
  const vb = final.viewBox;
  const SW = 620;
  const SH = (SW * vb[3]) / vb[2];
  const SX = 1212;
  const SY = 150;

  const toFixed = ramp(t, FIXED_AT, FIXED_AT + 0.25);
  const toFinal = ramp(t, INSERT_AT, INSERT_AT + 0.25);
  const layers = [
    { html: inlineSvg(fixed.svg, "ag1", vb), opacity: toFinal < 1 ? 1 : 0 },
    { html: inlineSvg(final.svg, "ag2", vb), opacity: toFinal },
  ];
  // a plan that does not compile has no drawing — only the compiler's own error card
  const EH = (SW * broken.viewBox[3]) / broken.viewBox[2];

  // the bedroom, from its own rectangle in describe()
  const bed = (describe(baked.afterFix) as unknown as { rooms: { id: string; bbox: { x: number; y: number; w: number; h: number } }[] }).rooms.find((r) => r.id === sug.roomId)!;
  const k = SW / vb[2];
  const warn = envelope(t, WARN_AT, INSERT_AT + 0.5, 0.3, 0.35);
  const pass = spring(t - PASS_AT, 0.5, 20);
  const state = t < FIXED_AT ? { text: `${broken.errors.length} error`, tone: T.redline } : t < INSERT_AT ? (t < WARN_AT ? { text: "compiles", tone: T.ok } : { text: "1 warning", tone: T.warnInk }) : { text: "ready", tone: T.ok };
  const arrive = spring(t - 0.15, 0.72, 15);
  const graph = envelope(t, FACTS_AT - 0.1, PASS_AT - 0.2, 0.3, 0.3);

  return (
    <Paper tone="source" dx={-t * 3}>
      <div style={{ opacity: clamp01(t / 0.2), transform: `translateY(${(1 - arrive) * 40}px)` }}>
        <Terminal t={t} />
      </div>

      <div style={{ position: "absolute", left: SX, top: SY - 46, width: SW, display: "flex", alignItems: "center", gap: 12, opacity: clamp01((t - 0.4) / 0.2) }}>
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: state.tone }} />
        <Micro size={18} color={T.ink}>
          {state.text}
        </Micro>
        <span style={{ flex: 1 }} />
        <Micro size={18}>plan.arch</Micro>
      </div>
      <div style={{ position: "absolute", left: SX, top: SY, opacity: clamp01((t - 0.3) / 0.2), transform: `translateY(${(1 - spring(t - 0.3, 0.72, 15)) * 40}px)` }}>
        <Sheet layers={layers} width={SW} height={SH} shadow="0 14px 36px rgba(28,36,48,0.16)" style={{ opacity: toFixed, transform: `scale(${0.96 + 0.04 * toFixed})` }} />
        {toFixed < 1 ? (
          <div style={{ position: "absolute", left: 0, top: (SH - EH) / 2, width: SW, height: EH, opacity: 1 - toFixed, border: `1px solid ${T.hairline}`, boxShadow: "0 14px 36px rgba(28,36,48,0.16)", background: "#fff" }} dangerouslySetInnerHTML={{ __html: inlineSvg(broken.svg, "ag0") }} />
        ) : null}
        {warn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: (bed.bbox.x - vb[0]) * k,
              top: (bed.bbox.y - vb[1]) * k,
              width: bed.bbox.w * k,
              height: bed.bbox.h * k,
              border: `4px dashed ${T.redline}`,
              background: "rgba(194,54,43,0.07)",
              borderRadius: 4,
              opacity: clamp01(warn * 2),
              transform: `scale(${1.06 - 0.06 * warn})`,
            }}
          >
            <div style={{ position: "absolute", left: -4, top: -44, whiteSpace: "nowrap", padding: "5px 12px", background: T.redlineInk, color: "#fff", fontFamily: FONT.mono, fontSize: 19, fontWeight: 600, borderRadius: 3 }}>{vWarn.code}</div>
          </div>
        ) : null}
        {graph > 0 ? (
          <div style={{ position: "absolute", left: -76, right: -76, bottom: -64, padding: "18px 22px 20px", background: "rgba(251,250,245,0.97)", border: `1px solid ${T.hairline}`, borderRadius: 5, boxShadow: "0 16px 40px rgba(28,36,48,0.2)", opacity: clamp01(graph * 2), transform: `translateY(${(1 - graph) * 30}px)` }}>
            <AccessGraph t={t} />
          </div>
        ) : null}
        {t > PASS_AT ? (
          <div
            style={{
              position: "absolute",
              right: -26,
              bottom: 40,
              padding: "12px 26px",
              border: `5px solid ${T.ok}`,
              color: T.ok,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 6,
              fontFamily: FONT.display,
              fontVariationSettings: wdth(85, 700),
              fontSize: 50,
              letterSpacing: "0.08em",
              transform: `rotate(-7deg) scale(${1.5 - 0.5 * pass})`,
              opacity: clamp01((t - PASS_AT) / 0.06),
            }}
          >
            VERIFIED
          </div>
        ) : null}
      </div>

      <CaptionBand
        t={t}
        y={968}
        cues={[
          { from: 0.5, to: 3.7, text: "Errors come back as data — with the fix attached.", no: "04", mark: ["fix"] },
          { from: 3.9, to: 6.2, text: "One command applies it." },
          { from: 6.4, to: 10.6, text: "It checks the architecture, not just the syntax.", mark: ["architecture"] },
          { from: 10.8, to: 13.5, text: "Facts, not pixels: areas, access, reachability." },
          { from: 13.7, to: 15.8, text: "Verified — without ever looking at an image.", mark: ["Verified"] },
        ]}
      />
    </Paper>
  );
};
