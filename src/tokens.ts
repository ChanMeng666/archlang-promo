// The product's own brand tokens, copied value-for-value from
// archlang/playground/src/styles/tokens.css ("The Compile Boundary"). `npm run verify`
// re-reads that file and fails if a hex here has drifted from it.

export const T = {
  // SOURCE world (cool light — code lives here)
  srcBg: "#eceef2",
  srcSurface: "#fbfbfc",
  srcFg: "#1a1d23",
  srcMuted: "#5a616e",
  srcBorder: "rgba(0,0,0,0.12)",
  srcRule: "#7f858f",
  plum: "#8052ff",
  plumDeep: "#6b3ae0",

  // SYNTAX
  synKeyword: "#6b3ae0",
  synTypename: "#9a4a06",
  synPropertyname: "#14602a",
  synAtom: "#0b57d0",
  synNumber: "#0f6f7a",
  synString: "#8a5a00",
  synComment: "#5a616e",
  synOperator: "#464d59",

  // SHEET world (warm drafting film)
  paper: "#f5f2ea",
  paperPanel: "#fbfaf5",
  ink: "#1c2430",
  inkMuted: "#5b6470",
  hairline: "#cfc9bb",
  gridLine: "rgba(28,36,48,0.07)",

  // REDLINE — attention only
  redline: "#c2362b",
  redlineInk: "#b3261e",

  ok: "#2e7d32",
  warnInk: "#7a6000",
} as const;

export const FONT = {
  display: '"Archivo Variable", Archivo, "Arial Narrow", sans-serif',
  body: '"Public Sans Variable", "Public Sans", "Segoe UI", sans-serif',
  mono: '"IBM Plex Mono", Consolas, monospace',
} as const;

/** Archivo's width axis, the way the product sets its caps micro-labels. */
export const wdth = (w: number, g: number) => `"wdth" ${w}, "wght" ${g}`;
