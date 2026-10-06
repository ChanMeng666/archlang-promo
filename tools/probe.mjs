// Dev probe: compile every line-prefix of a plan and report which prefixes are clean.
// usage: node tools/probe.mjs plans/laneway.arch [W]
import { readFileSync } from "node:fs";
import { compile, describe, lint } from "@chanmeng666/archlang";

const file = process.argv[2];
let src = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
if (process.argv[3]) src = src.replace(/let W = \d+/, `let W = ${process.argv[3]}`);
const lines = src.split("\n");
let depth = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
  const prefix = lines.slice(0, i + 1).join("\n") + "\n" + "}".repeat(Math.max(depth, 0));
  const t0 = performance.now();
  const r = compile(prefix);
  const ms = (performance.now() - t0).toFixed(1);
  const errs = r.diagnostics.filter((d) => d.severity === "error");
  const warns = r.diagnostics.filter((d) => d.severity !== "error");
  const vb = /viewBox="([^"]+)"/.exec(r.svg || "")?.[1];
  console.log(
    String(i + 1).padStart(2),
    `d${depth}`,
    errs.length ? "ERR " + errs.map((d) => d.code).join(",") : "ok ",
    warns.length ? "W:" + warns.map((d) => d.code).join(",") : "",
    `${ms}ms`,
    vb ?? "",
    "|",
    line.slice(0, 50),
  );
}
const full = compile(src);
console.log("len", lines.reduce((m, l) => Math.max(m, l.length), 0), "max line chars");
const facts = describe(full.ast ? src : src);
console.log("totals", JSON.stringify(facts.totals ?? facts.summary?.totals ?? Object.keys(facts)));
const l = lint(src);
console.log("lint", JSON.stringify((l.diagnostics ?? l).map?.((d) => d.code + ": " + d.message) ?? l));
