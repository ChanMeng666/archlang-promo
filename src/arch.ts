// The seam to the real compiler. Every plan the film draws goes through compile() here,
// inside the render — nothing is a pre-drawn picture. compile() is pure, synchronous and
// deterministic, which is exactly what a frame-by-frame renderer needs; a small plan
// costs 5–15 ms, so a number scrubbed across 60 frames is 60 honest compiles.
import { compile, describe, renderErrorSvg } from "@chanmeng666/archlang";
import { highlightArch } from "./vendor/arch-highlight.js";

export interface Compiled {
  ok: boolean;
  empty: boolean;
  svg: string;
  viewBox: [number, number, number, number];
  errors: { code: string; message: string; line?: number }[];
  warnings: number;
  totals: { rooms: number; doors: number; windows: number; floor_area_m2: number } | null;
  entrance: boolean;
}

const cache = new Map<string, Compiled>();

/** `theme` is the playground's View selector: one of the compiler's own render themes. */
export function compiled(source: string, theme?: string): Compiled {
  const key = theme ? theme + "\u0000" + source : source;
  const hit = cache.get(key);
  if (hit) return hit;
  const r = compile(source, theme ? ({ theme } as never) : {});
  const errs = r.diagnostics.filter((d) => d.severity === "error");
  const ok = errs.length === 0;
  const empty = r.diagnostics.some((d) => d.code === "W_EMPTY_PLAN");
  let svg = r.svg ?? "";
  if (!ok) svg = renderErrorSvg(source, r.diagnostics, { width: 800 });
  const vb = /viewBox="([^"]+)"/.exec(svg)?.[1].split(/\s+/).map(Number) ?? [0, 0, 100, 100];
  let totals: Compiled["totals"] = null;
  let entrance = false;
  if (ok && !empty) {
    const d = describe(source) as unknown as { totals: Compiled["totals"]; access?: { hasEntrance?: boolean } };
    totals = d.totals;
    entrance = !!d.access?.hasEntrance;
  }
  const out: Compiled = {
    ok,
    empty,
    svg,
    viewBox: vb as [number, number, number, number],
    errors: errs.map((d) => ({ code: d.code ?? "", message: d.message, line: (d as { line?: number }).line })),
    warnings: r.diagnostics.length - errs.length,
    totals,
    entrance,
  };
  cache.set(key, out);
  return out;
}

/**
 * Make a compiled SVG safe to inline beside others: namespace its ids (two plans both
 * define `#poche`, and the first one in the document would win for both), optionally
 * pin the viewBox so a growing plan does not re-fit under the viewer, and let CSS size it.
 */
export function inlineSvg(svg: string, uid: string, viewBox?: readonly number[]): string {
  let s = svg
    .replace(/\bid="([^"]+)"/g, `id="${uid}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${uid}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${uid}-$1"`);
  if (viewBox) s = s.replace(/viewBox="[^"]+"/, `viewBox="${viewBox.join(" ")}"`);
  return s.replace(/^<svg /, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block" ');
}

/** The first `n` lines of a source, with whatever blocks are still open closed again. */
export function prefix(lines: readonly string[], n: number): string {
  let depth = 0;
  for (let i = 0; i < n; i++) {
    const code = lines[i].replace(/#.*$/, "").replace(/"[^"]*"/g, "");
    depth += (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
  }
  return lines.slice(0, n).join("\n") + "\n" + "}".repeat(Math.max(depth, 0));
}

export const highlight = (source: string): string => highlightArch(source);
