// Render stills at given film seconds, for a look pass before any long render.
//   node tools/stills.mjs 12.5 26 31      → out/stills/t0012.50.png …
//   node tools/stills.mjs --every 2       → one still every 2 s, the whole film
//   node tools/stills.mjs --scale 0.5 …   → half-size (fast contact frames)
import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  if (i < 0) return def;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const FPS = 30;
const TOTAL = 68;
const scale = opt("--scale", "1");
const every = opt("--every", null);
const outDir = opt("--out", "out/stills");
const times = every ? Array.from({ length: Math.floor(TOTAL / Number(every)) }, (_, i) => i * Number(every) + Number(every) / 2) : argv.map(Number);
if (!times.length) throw new Error("no times given");
mkdirSync(outDir, { recursive: true });

if (!existsSync("out/bundle/index.html") || process.env.REBUNDLE !== "0") {
  const b = spawnSync("npx", ["remotion", "bundle", "src/index.ts", "--out-dir", "out/bundle", "--log", "error"], { stdio: "inherit", shell: true });
  if (b.status !== 0) process.exit(b.status ?? 1);
}
let failed = 0;
for (const t of times) {
  const frame = Math.min(Math.round(t * FPS), TOTAL * FPS - 1);
  const file = `${outDir}/t${t.toFixed(2).padStart(7, "0")}.png`;
  const r = spawnSync("npx", ["remotion", "still", "out/bundle", "ArchLang-Promo", file, `--frame=${frame}`, `--scale=${scale}`, "--log", "error"], { stdio: "inherit", shell: true });
  if (r.status !== 0) failed++;
  else console.log("still", file);
}
console.log(`stills: ${times.length - failed}/${times.length} rendered`);
process.exit(failed ? 1 : 0);
