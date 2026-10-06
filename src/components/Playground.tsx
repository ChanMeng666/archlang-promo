// A coded replica of playground.archlang.uk — the header title-block, the SOURCE.ARCH
// editor pane, the compile seam, the preview sheet on drafting paper, the facts strip.
// Rebuilt in plain React/CSS from the product's own stylesheets (chrome.css, editor.css,
// panels.css, editor-setup.ts) as a pure function of its props. It is laid out at the
// product's real pixel sizes (13 px code, 11 px micro-labels) and the whole thing is
// zoomed, so proportions are the product's and not an approximation of them.
import React from "react";
import { Img, staticFile } from "remotion";
import { highlight } from "../arch";
import { FONT, T, wdth } from "../tokens";

export const PG_W = 1010;
export const PG_H = 529;
export const PG_SPLIT = 0.535; // the seam is draggable in the product; the film parks it here
const HEADER_H = 47;
const PANE_HEAD_H = 31;
const FACTS_H = 34;
export const LINE_H = 13 * 1.55;
export const CHAR_W = 13 * 0.6; // IBM Plex Mono advances 600/1000 em
export const GUTTER_W = 44;
const CONTENT_PAD = 10;
export const EDITOR_H = PG_H - HEADER_H - PANE_HEAD_H;
export const PREVIEW_W = PG_W * (1 - PG_SPLIT);
export const PREVIEW_H = PG_H - HEADER_H - PANE_HEAD_H - FACTS_H;

export interface SheetLayer {
  html: string;
  opacity: number;
}

export interface PlaygroundProps {
  /** the text in the editor right now */
  source: string;
  caret?: { line: number; col: number; visible: boolean } | null;
  activeLine?: number | null;
  selection?: { line: number; from: number; to: number } | null;
  scrollTop?: number;
  layers: SheetLayer[];
  /** width / height of the drawing's (pinned) viewBox — sizes the sheet */
  sheetAspect: number;
  status: { text: string; err: boolean };
  facts: { rooms: number; doors: number; windows: number; floor_area_m2: number } | null;
  entrance: boolean;
  exampleLabel: string;
  themeLabel?: string;
}

const micro: React.CSSProperties = {
  fontFamily: FONT.display,
  fontVariationSettings: wdth(85, 600),
  fontSize: 10,
  lineHeight: 1,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: T.srcMuted,
};

const control: React.CSSProperties = {
  fontFamily: FONT.body,
  fontSize: 12.5,
  lineHeight: 1.2,
  padding: "5px 10px",
  border: `1px solid ${T.srcRule}`,
  borderRadius: 3,
  background: T.srcSurface,
  color: T.srcFg,
  whiteSpace: "nowrap",
};

const Cell: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 4, padding: "8px 12px", borderRight: `1px solid ${T.srcBorder}` }}>
    <span style={micro}>{label}</span>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>{children}</div>
  </div>
);

const Select: React.FC<{ children: React.ReactNode; width?: number }> = ({ children, width }) => (
  <span style={{ ...control, paddingRight: 8, display: "inline-flex", alignItems: "center", gap: 8, width, justifyContent: "space-between" }}>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
    <svg width="8" height="5" viewBox="0 0 8 5" style={{ flex: "none" }}>
      <path d="M0.5 0.5 L4 4 L7.5 0.5" fill="none" stroke={T.srcFg} strokeWidth="1.2" />
    </svg>
  </span>
);

const Header: React.FC<{ exampleLabel: string; themeLabel: string }> = ({ exampleLabel, themeLabel }) => (
  <div style={{ display: "flex", alignItems: "stretch", height: HEADER_H, background: T.srcBg, color: T.srcFg, borderBottom: `1px solid ${T.hairline}`, flex: "none" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 12px", borderRight: `1px solid ${T.srcBorder}` }}>
      <Img src={staticFile("brand/archlang-icon-plum.svg")} style={{ width: 20, height: 20, display: "block" }} />
      <span style={{ fontFamily: FONT.display, fontVariationSettings: wdth(100, 600), fontSize: 16, letterSpacing: "0.01em" }}>
        <b style={{ color: T.plumDeep, fontVariationSettings: wdth(100, 700) }}>Arch</b>Lang
      </span>
      <span style={{ ...micro, fontSize: 9, letterSpacing: "0.11em", padding: "3px 7px", border: `1px solid ${T.srcBorder}`, borderRadius: 2 }}>Playground</span>
    </div>
    <Cell label="Drawing">
      <Select width={128}>{exampleLabel}</Select>
      <span style={control}>Format</span>
    </Cell>
    <Cell label="View">
      <Select width={104}>{themeLabel}</Select>
    </Cell>
    <Cell label="Issue">
      <Select>SVG</Select>
      <span style={{ ...control, background: T.redlineInk, borderColor: "transparent", color: "#fff", fontWeight: 600 }}>Download</span>
    </Cell>
    <Cell label="Share">
      <span style={control}>Copy link</span>
      <span style={control}>Copy for LLM</span>
    </Cell>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 18px", fontFamily: FONT.display, fontVariationSettings: wdth(90, 500), fontSize: 12, letterSpacing: "0.02em", color: T.srcMuted, whiteSpace: "nowrap" }}>
      <span>Docs ↗</span>
      <span>GitHub</span>
    </div>
  </div>
);

const paneHead: React.CSSProperties = {
  fontFamily: FONT.display,
  fontVariationSettings: wdth(85, 600),
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: T.inkMuted,
  height: PANE_HEAD_H,
  padding: "0 14px",
  borderBottom: `1px solid ${T.hairline}`,
  display: "flex",
  alignItems: "center",
  gap: 8,
  flex: "none",
};

const SYNTAX_CSS = `
.ahl-keyword{color:${T.synKeyword};font-weight:600}
.ahl-typename{color:${T.synTypename};font-weight:600}
.ahl-propertyname{color:${T.synPropertyname}}
.ahl-atom{color:${T.synAtom}}
.ahl-number{color:${T.synNumber}}
.ahl-string{color:${T.synString}}
.ahl-comment{color:${T.synComment};font-style:italic}
.ahl-operator{color:${T.synOperator}}
`;

export const SyntaxStyles: React.FC = () => <style>{SYNTAX_CSS}</style>;

/** The CodeMirror surface: gutter, line numbers, active line, caret, selection. */
export const Editor: React.FC<Pick<PlaygroundProps, "source" | "caret" | "activeLine" | "selection" | "scrollTop"> & { height: number }> = ({
  source,
  caret,
  activeLine,
  selection,
  scrollTop = 0,
  height,
}) => {
  const lines = source.split("\n");
  // only the lines the viewport can see are mounted — the plan is 41 lines, the pane 21
  const first = Math.max(0, Math.floor((scrollTop - CONTENT_PAD) / LINE_H) - 1);
  const last = Math.min(lines.length, Math.ceil((scrollTop + height) / LINE_H) + 1);
  const rows: React.ReactNode[] = [];
  for (let i = first; i < last; i++) {
    const active = activeLine === i;
    rows.push(
      <div key={i} style={{ position: "absolute", top: CONTENT_PAD + i * LINE_H, left: 0, right: 0, height: LINE_H, display: "flex" }}>
        <div
          style={{
            width: GUTTER_W,
            flex: "none",
            textAlign: "right",
            padding: "0 16px 0 0",
            color: active ? T.srcFg : T.srcMuted,
            background: active ? "rgba(128,82,255,0.10)" : undefined,
          }}
        >
          {i + 1}
        </div>
        <div style={{ flex: 1, position: "relative", paddingLeft: 6, background: active ? "rgba(128,82,255,0.06)" : undefined, whiteSpace: "pre" }}>
          {selection && selection.line === i ? (
            <span style={{ position: "absolute", left: 6 + selection.from * CHAR_W, width: (selection.to - selection.from) * CHAR_W, top: 1, bottom: 1, background: "rgba(128,82,255,0.28)" }} />
          ) : null}
          <span style={{ position: "relative" }} dangerouslySetInnerHTML={{ __html: highlight(lines[i]) }} />
          {caret && caret.visible && caret.line === i ? (
            <span style={{ position: "absolute", left: 6 + caret.col * CHAR_W - 0.5, top: 2, bottom: 2, width: 1.4, background: T.srcFg }} />
          ) : null}
        </div>
      </div>,
    );
  }
  return (
    <div style={{ position: "relative", height, overflow: "hidden", background: T.srcSurface, fontFamily: FONT.mono, fontSize: 13, lineHeight: `${LINE_H}px`, color: T.srcFg }}>
      {/* the gutter's own ground runs the full height, behind the rows */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: GUTTER_W, background: T.srcBg, borderRight: `1px solid ${T.srcBorder}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: -scrollTop }}>{rows}</div>
    </div>
  );
};

export const PAPER_GRID: React.CSSProperties = {
  backgroundColor: T.paper,
  backgroundImage: [
    `repeating-linear-gradient(0deg, ${T.gridLine} 0 1px, transparent 1px 8px)`,
    `repeating-linear-gradient(90deg, ${T.gridLine} 0 1px, transparent 1px 8px)`,
    `repeating-linear-gradient(0deg, ${T.gridLine} 0 1px, transparent 1px 40px)`,
    `repeating-linear-gradient(90deg, ${T.gridLine} 0 1px, transparent 1px 40px)`,
  ].join(","),
};

/** The compiled plan floating as a sheet: white ground, hairline edge, small shadow. */
export const Sheet: React.FC<{ layers: SheetLayer[]; width: number; height: number; shadow?: string; style?: React.CSSProperties }> = ({ layers, width, height, shadow, style }) => (
  <div style={{ position: "relative", width, height, background: "#fff", border: `1px solid ${T.hairline}`, boxShadow: shadow ?? "0 3px 12px rgba(28,36,48,0.14)", overflow: "hidden", ...style }}>
    {layers.map((l, i) =>
      l.opacity > 0.001 ? <div key={i} style={{ position: "absolute", inset: 0, opacity: l.opacity }} dangerouslySetInnerHTML={{ __html: l.html }} /> : null,
    )}
  </div>
);

const Fact: React.FC<{ label: string; value: string; tone?: "ok" | "bad"; first?: boolean }> = ({ label, value, tone, first }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "baseline",
      gap: 6,
      padding: "0 6px",
      whiteSpace: "nowrap",
      flex: "none",
      height: FACTS_H,
      lineHeight: `${FACTS_H}px`,
      borderLeft: first ? undefined : `1px solid ${T.hairline}`,
      fontFamily: FONT.display,
      fontVariationSettings: wdth(85, 600),
      fontSize: 10.5,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: T.inkMuted,
    }}
  >
    {label}
    <b style={{ fontFamily: FONT.mono, fontVariationSettings: "normal", fontWeight: 600, fontSize: 12, letterSpacing: 0, textTransform: "none", fontVariantNumeric: "tabular-nums", color: tone === "ok" ? T.ok : tone === "bad" ? T.redlineInk : T.ink }}>
      {value}
    </b>
  </span>
);

export const FactsStrip: React.FC<Pick<PlaygroundProps, "facts" | "entrance">> = ({ facts, entrance }) => (
  <div style={{ display: "flex", alignItems: "stretch", padding: "0 4px", borderTop: `1px solid ${T.hairline}`, background: T.paperPanel, height: FACTS_H, flex: "none", overflow: "hidden" }}>
    {facts ? (
      <>
        <Fact first label="Rooms" value={String(facts.rooms)} />
        <Fact label="Doors" value={String(facts.doors)} />
        <Fact label="Windows" value={String(facts.windows)} />
        <Fact label="Floor area" value={`${facts.floor_area_m2} m²`} />
        <Fact label="Entrance" value={entrance ? "yes" : "none"} tone={entrance ? "ok" : "bad"} />
      </>
    ) : null}
  </div>
);

export const Playground: React.FC<PlaygroundProps> = (p) => {
  const leftW = PG_W * PG_SPLIT;
  // fit the sheet into the preview viewport with the product's own breathing room
  const pad = 14;
  const fit = Math.min((PREVIEW_W - pad * 2) / p.sheetAspect, PREVIEW_H - pad * 2);
  const sheetH = fit;
  const sheetW = fit * p.sheetAspect;
  return (
    <div style={{ width: PG_W, height: PG_H, display: "flex", flexDirection: "column", background: T.paper, color: T.ink, fontFamily: FONT.body, overflow: "hidden" }}>
      <SyntaxStyles />
      <Header exampleLabel={p.exampleLabel} themeLabel={p.themeLabel ?? "Default"} />
      <div style={{ position: "relative", flex: 1, display: "flex", minHeight: 0 }}>
        <div style={{ width: leftW, display: "flex", flexDirection: "column", flex: "none" }}>
          <div style={{ ...paneHead, background: T.srcBg, color: T.srcMuted }}>SOURCE.ARCH</div>
          <Editor source={p.source} caret={p.caret} activeLine={p.activeLine} selection={p.selection} scrollTop={p.scrollTop} height={EDITOR_H} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, borderLeft: `1px solid ${T.srcBorder}` }}>
          <div style={{ ...paneHead, background: T.paperPanel }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.status.err ? T.redline : T.ok }} />
            <span>{p.status.text}</span>
            <span style={{ flex: 1 }} />
            {["Preview", "Describe", "Lint", "Intent"].map((tab, i) => (
              <span
                key={tab}
                style={{
                  fontSize: 10.5,
                  letterSpacing: "0.07em",
                  padding: "4px 10px",
                  borderBottom: `2px solid ${i === 0 ? T.redlineInk : "transparent"}`,
                  color: i === 0 ? T.ink : T.inkMuted,
                }}
              >
                {tab}
              </span>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, minHeight: 0, overflow: "hidden", ...PAPER_GRID }}>
            <div style={{ position: "absolute", left: (PREVIEW_W - sheetW) / 2, top: (PREVIEW_H - sheetH) / 2 }}>
              <Sheet layers={p.layers} width={sheetW} height={sheetH} />
            </div>
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                padding: 3,
                border: `1px solid ${T.hairline}`,
                borderRadius: 3,
                background: "rgba(251,250,245,0.9)",
                boxShadow: "0 1px 6px rgba(28,36,48,0.1)",
                fontFamily: FONT.mono,
                fontSize: 12,
                color: T.ink,
              }}
            >
              {["−", "+", "⤢"].map((g) => (
                <span key={g} style={{ minWidth: 26, height: 26, lineHeight: "26px", textAlign: "center" }}>
                  {g}
                </span>
              ))}
              <span style={{ width: 1, height: 16, background: T.hairline, margin: "0 1px" }} />
              <span style={{ ...micro, color: T.ink, fontSize: 10, letterSpacing: "0.08em", padding: "0 7px" }}>Paths</span>
            </div>
          </div>
          <FactsStrip facts={p.facts} entrance={p.entrance} />
        </div>
        {/* the compile seam: a hard plum edge, redline ticks */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: leftW - 1,
            width: 2,
            background: `repeating-linear-gradient(to bottom, ${T.redline} 0, ${T.redline} 5px, transparent 5px, transparent 24px), linear-gradient(to bottom, ${T.srcRule}, ${T.hairline})`,
            boxShadow: `-1px 0 0 0 ${T.plum}`,
          }}
        />
      </div>
    </div>
  );
};
