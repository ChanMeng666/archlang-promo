// The gates. Each one says how many things it looked at, because a gate whose input set
// went empty reports success by doing nothing.
//   npm run verify
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, lint, THEMES, EXPORT_FORMATS } from "@chanmeng666/archlang";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sibling = resolve(root, "..", "archlang");
const read = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
let failed = 0;
const gate = (name, looked, problems) => {
  if (looked === 0) problems = [...problems, "VACUOUS — looked at nothing"];
  console.log(`${problems.length ? "✗" : "✓"} ${name} — ${looked} checked${problems.length ? "\n    " + problems.join("\n    ") : ""}`);
  if (problems.length) failed++;
};

// 1. the baked data is what the vendored compiler produces today
{
  const r = spawnSync(process.execPath, [join(root, "tools", "bake.mjs"), "--check"], { encoding: "utf8" });
  gate("bake is fresh", 2, r.status === 0 ? [] : [(r.stderr || r.stdout).trim()]);
}

// 2. every line-prefix of the plan compiles — the typing shot never shows an error state
//    it did not earn — and the plan is lint-clean at both ends of the scrub
{
  const plan = read(join(root, "plans", "laneway.arch"));
  const lines = plan.replace(/\n$/, "").split("\n");
  const problems = [];
  let depth = 0;
  let looked = 0;
  for (let n = 2; n <= lines.length; n++) {
    depth = 0;
    for (let i = 0; i < n; i++) {
      const code = lines[i].replace(/#.*$/, "").replace(/"[^"]*"/g, "");
      depth += (code.match(/\{/g) || []).length - (code.match(/\}/g) || []).length;
    }
    const src = lines.slice(0, n).join("\n") + "\n" + "}".repeat(Math.max(depth, 0));
    const errs = compile(src).diagnostics.filter((d) => d.severity === "error");
    looked++;
    if (errs.length) problems.push(`prefix of ${n} lines: ${errs.map((e) => e.code).join(", ")}`);
  }
  const longest = Math.max(...lines.map((l) => l.length));
  if (longest > 64) problems.push(`a ${longest}-character line will not fit the editor pane (64)`);
  for (let w = 4200; w <= 5400; w += 50) {
    const src = plan.replace(/let W = \d+/, `let W = ${w}`);
    const out = compile(src);
    const warns = [...out.diagnostics, ...(lint(src).diagnostics ?? lint(src))];
    looked++;
    if (warns.length) problems.push(`W = ${w}: ${warns.map((d) => d.code).join(", ")}`);
  }
  gate("plan compiles at every prefix and every scrubbed width", looked, problems);
}

// 3. the two counted claims in the Range scene
{
  const problems = [];
  const themes = Object.keys(THEMES).length + 1; // + the default
  if (themes !== 5) problems.push(`"Five themes" but the compiler has ${themes}`);
  if (EXPORT_FORMATS.length !== 5) problems.push(`"Five formats" but the compiler exports ${EXPORT_FORMATS.length}: ${EXPORT_FORMATS.join(", ")}`);
  gate("counted claims match the compiler", 2, problems);
}

// 4. brand tokens and the highlighter are the product's own, byte for byte
if (existsSync(sibling)) {
  const css = read(join(sibling, "playground", "src", "styles", "tokens.css"));
  const ts = read(join(root, "src", "tokens.ts"));
  const map = { srcBg: "src-bg", srcSurface: "src-surface", srcFg: "src-fg", srcMuted: "src-muted", srcRule: "src-rule", plum: "plum", plumDeep: "plum-deep", synKeyword: "syn-keyword", synTypename: "syn-typename", synPropertyname: "syn-propertyname", synAtom: "syn-atom", synNumber: "syn-number", synString: "syn-string", synComment: "syn-comment", synOperator: "syn-operator", paper: "paper", paperPanel: "paper-panel", ink: "ink", inkMuted: "ink-muted", hairline: "hairline", redline: "redline", redlineInk: "redline-ink", ok: "ok", warnInk: "warn-ink" };
  const problems = [];
  for (const [key, name] of Object.entries(map)) {
    const theirs = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`).exec(css)?.[1];
    const ours = new RegExp(`\\b${key}:\\s*"(#[0-9a-f]{6})"`).exec(ts)?.[1];
    if (!theirs || theirs !== ours) problems.push(`${key}: film ${ours} vs product ${theirs}`);
  }
  gate("brand tokens match playground/src/styles/tokens.css", Object.keys(map).length, problems);
  const same = read(join(sibling, "docs-site", ".vitepress", "theme", "arch-highlight.js")) === read(join(root, "src", "vendor", "arch-highlight.js"));
  gate("vendored highlighter matches the product's generated one", 1, same ? [] : ["src/vendor/arch-highlight.js has drifted — re-copy it"]);
} else console.log("- sibling ../archlang not found: token and highlighter gates skipped");

// 5. one clock: the timeline, the soundtrack and the stills tool agree on the length
{
  const tl = read(join(root, "src", "timeline.ts"));
  const total = [...tl.matchAll(/\{ id: "\w+", dur: (\d+) \}/g)].reduce((s, m) => s + Number(m[1]), 0);
  const synth = Number(/const DUR = (\d+);/.exec(read(join(root, "tools", "synth-audio.mjs")))?.[1]);
  const stills = Number(/const TOTAL = (\d+);/.exec(read(join(root, "tools", "stills.mjs")))?.[1]);
  const problems = [];
  if (synth !== total) problems.push(`soundtrack is ${synth} s, the edit is ${total} s`);
  if (stills !== total) problems.push(`stills tool assumes ${stills} s, the edit is ${total} s`);
  if (!existsSync(join(root, "public", "audio", "soundtrack.wav"))) problems.push("public/audio/soundtrack.wav is missing — npm run audio");
  gate(`one clock (${total} s)`, 3, problems);
}

process.exit(failed ? 1 : 0);
