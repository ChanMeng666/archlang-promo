// Bake everything the film shows that cannot be computed inside the browser bundle:
//   - the agent-loop transcript: the REAL `arch` CLI run over a flawed draft, step by step
//   - SHA-256 digests of two independent compiles (the determinism beat)
//   - the gallery: example plans from the ArchLang repo, compiled to SVG
// Nothing here is typed by hand. Re-run with `npm run bake` after changing plans/ or
// upgrading the vendored compiler; `npm run verify` fails if the result is stale.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile, describe, lint, ERROR_CODES } from "@chanmeng666/archlang";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(root, "node_modules", "@chanmeng666", "archlang", "dist", "cli.js");
const EXAMPLES = resolve(root, "..", "archlang", "examples");
const check = process.argv.includes("--check");

const read = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const sha = (s) => createHash("sha256").update(s).digest("hex");

function arch(cwd, args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  return {
    cmd: "arch " + args.join(" "),
    exit: r.status,
    stdout: r.stdout.replace(/\r\n/g, "\n").trimEnd(),
    stderr: r.stderr.replace(/\r\n/g, "\n").trimEnd(),
  };
}

// ── the plan ────────────────────────────────────────────────────────────────
const plan = read(join(root, "plans", "laneway.arch"));
const pkg = JSON.parse(read(join(root, "node_modules", "@chanmeng666", "archlang", "package.json")));

// ── determinism: two compiles, one digest ───────────────────────────────────
const a = compile(plan).svg;
const b = compile(plan).svg;
const determinism = { bytes: Buffer.byteLength(a), first: sha(a), second: sha(b) };
if (determinism.first !== determinism.second) throw new Error("compile() was not deterministic");

// ── the agent loop: a draft with two flaws an LLM plausibly writes ──────────
//   1. a pocket door given a `hinge` clause   → a compile ERROR with a machine-applicable fix
//   2. a bedroom with no window               → a lint WARNING `arch suggest` can answer
const FLAW_DOOR = ["door pocket on hall at 900 width 800 slide right", "door pocket on hall at 900 width 800 hinge left"];
const FLAW_WINDOW = "  window on south at W + 1650 width 1600\n";
if (!plan.includes(FLAW_DOOR[0]) || !plan.includes(FLAW_WINDOW)) throw new Error("plan no longer contains the lines the draft is derived from");
const draft = plan.replace(FLAW_DOOR[0], FLAW_DOOR[1]).replace(FLAW_WINDOW, "");

const dir = mkdtempSync(join(tmpdir(), "archlang-promo-"));
const steps = [];
let afterFix = "";
let afterSuggest = "";
try {
  const file = join(dir, "plan.arch");
  writeFileSync(file, draft);
  steps.push({ id: "compile", ...arch(dir, ["compile", "plan.arch", "--json"]) });
  steps.push({ id: "fix", ...arch(dir, ["fix", "plan.arch"]) });
  afterFix = read(file);
  steps.push({ id: "validate", ...arch(dir, ["validate", "plan.arch", "--strict", "--json"]) });
  steps.push({ id: "suggest", ...arch(dir, ["suggest", "plan.arch", "--json"]) });
  // The agent takes the first suggested statement and inserts it — nothing else.
  const sug = JSON.parse(steps.at(-1).stdout);
  steps.at(-1).parsed = sug;
  const stmt = pickStatement(sug);
  afterSuggest = afterFix.replace("  window on east", `  ${stmt}\n  window on east`);
  writeFileSync(file, afterSuggest);
  steps.push({ id: "describe", ...arch(dir, ["describe", "plan.arch", "--json"]) });
  steps.push({ id: "gate", ...arch(dir, ["validate", "plan.arch", "--strict"]) });
  steps.push({ id: "gateJson", ...arch(dir, ["validate", "plan.arch", "--strict", "--json"]) });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

function pickStatement(sug) {
  const found = [];
  JSON.stringify(sug, (k, v) => {
    if (typeof v === "string" && /^(window|door|opening) /.test(v)) found.push(v);
    return v;
  });
  if (!found.length) throw new Error("arch suggest returned no statement: " + JSON.stringify(sug).slice(0, 400));
  return found[0];
}

// ── the gallery ─────────────────────────────────────────────────────────────
const GALLERY = ["two-bed", "courtyard-house", "hexagon-pavilion", "garden-house", "clinic", "furnished-flat", "museum", "terrace-row", "library", "bungalow", "hillside-villa", "aquarium"];
const gallery = [];
for (const name of GALLERY) {
  const file = join(EXAMPLES, name + ".arch");
  if (!existsSync(file)) throw new Error("missing example " + file);
  let out = arch(EXAMPLES, ["compile", name + ".arch", "-o", "-", "--quiet"]);
  // a multi-storey plan renders one drawing per level; the gallery shows the ground floor
  if (out.exit !== 0 && /--level/.test(out.stderr)) out = arch(EXAMPLES, ["compile", name + ".arch", "-o", "-", "--quiet", "--level", "1"]);
  if (out.exit !== 0 || !out.stdout.startsWith("<svg")) throw new Error(`example ${name} did not compile: ${out.stderr.slice(0, 300)}`);
  const title = /^plan\s+"([^"]+)"/m.exec(read(file))?.[1] ?? name;
  gallery.push({ name, title, paper: /^\s*paper\s/m.test(read(file)), svg: out.stdout });
}

const baked = {
  version: pkg.version,
  errorCodes: ERROR_CODES.length,
  exampleCount: GALLERY.length,
  determinism,
  plan,
  draft,
  afterFix,
  afterSuggest,
  steps,
  facts: describe(plan).totals,
  lintClean: (lint(plan).diagnostics ?? lint(plan)).length === 0,
};

const dataDir = join(root, "src", "data");
mkdirSync(dataDir, { recursive: true });
const targets = [
  [join(dataDir, "baked.json"), JSON.stringify(baked, null, 1) + "\n"],
  [join(dataDir, "gallery.json"), JSON.stringify(gallery) + "\n"],
];
let stale = 0;
for (const [path, text] of targets) {
  if (check) {
    if (!existsSync(path) || read(path) !== text) {
      console.error("STALE " + path);
      stale++;
    }
  } else writeFileSync(path, text);
}
console.log(`bake: compiler ${pkg.version} · ${steps.length} CLI steps · ${gallery.length} gallery plans · sha256 ${determinism.first.slice(0, 12)}… ${check ? (stale ? "STALE" : "fresh") : "written"}`);
process.exit(stale ? 1 : 0);
