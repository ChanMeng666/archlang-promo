// The soundtrack, synthesised. No samples, no licensed music, no generated audio: a small
// additive/subtractive synth written out here, a 120 BPM bed arranged against the edit in
// src/timeline.ts, and sound effects placed on the picture's own beats.
//
//   node tools/synth-audio.mjs        → public/audio/soundtrack.wav (+ loudness-normalised)
//
// Deterministic: the only noise source is a seeded LCG, so the same script writes the same
// bytes. The beat constants below mirror the scene files (named beside each one); if a
// scene is re-timed, re-time it here too and re-run.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;
const DUR = 68;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
// a second bus that feeds the delay/reverb
const SL = new Float32Array(N);
const SR_ = new Float32Array(N);

let seed = 20261006;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const TAU = Math.PI * 2;

/** Render a voice: fn(tSeconds, i) → sample, for `len` seconds from `at`. */
function voice(at, len, gain, pan, send, fn) {
  const i0 = Math.round(at * SR);
  const n = Math.round(len * SR);
  const gl = gain * Math.cos(((pan + 1) / 2) * (Math.PI / 2));
  const gr = gain * Math.sin(((pan + 1) / 2) * (Math.PI / 2));
  for (let i = 0; i < n; i++) {
    const k = i0 + i;
    if (k < 0 || k >= N) continue;
    const s = fn(i / SR, i);
    L[k] += s * gl;
    R[k] += s * gr;
    if (send) {
      SL[k] += s * gl * send;
      SR_[k] += s * gr * send;
    }
  }
}

// ── instruments ──────────────────────────────────────────────────────────────
const pluck = (at, m, gain = 0.1, pan = 0, send = 0.5, decay = 0.22) => {
  const f = hz(m);
  voice(at, decay * 6, gain, pan, send, (t) => {
    const e = Math.exp(-t / decay) * Math.min(1, t / 0.003);
    return e * (Math.sin(TAU * f * t) + 0.32 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.08) + 0.12 * Math.sin(TAU * 3 * f * t) * Math.exp(-t / 0.04));
  });
};
const pad = (at, len, m, gain = 0.03, pan = 0) => {
  const f = hz(m);
  voice(at, len + 1.2, gain, pan, 0.6, (t) => {
    const e = Math.min(1, t / 0.5) * (t > len ? Math.exp(-(t - len) / 0.45) : 1);
    const trem = 1 + 0.08 * Math.sin(TAU * 0.31 * t + m);
    return e * trem * (Math.sin(TAU * f * 0.997 * t) + Math.sin(TAU * f * 1.003 * t + 1) + 0.22 * Math.sin(TAU * 2 * f * t) + 0.07 * Math.sin(TAU * 3 * f * t)) * 0.5;
  });
};
const kick = (at, gain = 0.3) =>
  voice(at, 0.4, gain, 0, 0, (t) => {
    const ph = TAU * (46 * t + (95 / 28) * (1 - Math.exp(-28 * t)));
    return Math.sin(ph) * Math.exp(-t / 0.13) * Math.min(1, t / 0.002);
  });
const hat = (at, gain = 0.035, pan = 0.2) => {
  let prev = 0;
  voice(at, 0.09, gain, pan, 0.1, (t) => {
    const x = rnd();
    const y = x - prev; // first-difference high-pass
    prev = x;
    return y * Math.exp(-t / 0.018);
  });
};
const bass = (at, m, len = 0.24, gain = 0.14) => {
  const f = hz(m);
  voice(at, len + 0.1, gain, 0, 0, (t) => {
    const e = Math.min(1, t / 0.006) * (t > len ? Math.exp(-(t - len) / 0.03) : Math.exp(-t / 0.5));
    return e * (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t));
  });
};

// ── sound effects ────────────────────────────────────────────────────────────
const tick = (at, gain = 0.03, pan = 0, pitch = 2600) => {
  voice(at, 0.03, gain, pan, 0.05, (t) => (rnd() * 0.6 + Math.sin(TAU * pitch * t)) * Math.exp(-t / 0.004));
};
const pop = (at, m = 76, gain = 0.09, pan = 0) => {
  const f = hz(m);
  voice(at, 0.3, gain, pan, 0.5, (t) => Math.sin(TAU * f * (1 + 0.5 * Math.exp(-t / 0.012)) * t) * Math.exp(-t / 0.06));
};
const whoosh = (at, len = 0.6, gain = 0.07, up = true) => {
  let lp = 0;
  let bp = 0;
  voice(at, len, gain, 0, 0.3, (t) => {
    const p = t / len;
    const cutoff = up ? 300 + 5200 * p * p : 5500 - 5000 * p;
    const a = Math.min(0.99, (TAU * cutoff) / SR);
    lp += a * (rnd() - lp);
    bp += a * 0.5 * (lp - bp);
    return (lp - bp) * Math.sin(Math.PI * p) ** 1.5 * 3;
  });
};
const chime = (at, notes, gain = 0.07) => notes.forEach((m, i) => pluck(at + i * 0.07, m, gain, i % 2 ? 0.3 : -0.3, 0.8, 0.5));
const buzz = (at, gain = 0.07) => {
  for (const [dt, m] of [[0, 51], [0.11, 46]]) {
    const f = hz(m);
    voice(at + dt, 0.16, gain, 0, 0.15, (t) => Math.tanh(2.2 * Math.sin(TAU * f * t)) * Math.exp(-t / 0.06) * Math.min(1, t / 0.004));
  }
};
const thud = (at, gain = 0.4) => {
  voice(at, 0.5, gain, 0, 0.25, (t) => (Math.sin(TAU * (58 + 70 * Math.exp(-t * 40)) * t) + rnd() * 0.5 * Math.exp(-t / 0.01)) * Math.exp(-t / 0.1));
};

// ── the bed ──────────────────────────────────────────────────────────────────
// 120 BPM: a beat is 0.5 s, a bar 2 s, 34 bars. One chord per bar, a four-bar loop.
const BEAT = 0.5;
const BAR = 2;
const CHORDS = [
  { bass: 38, pad: [50, 57, 64, 66], arp: [62, 66, 69, 74, 76, 81] }, // Dadd9
  { bass: 35, pad: [47, 57, 62, 66], arp: [59, 62, 66, 69, 74, 78] }, // Bm7
  { bass: 43, pad: [43, 55, 59, 66], arp: [59, 62, 66, 67, 71, 74] }, // Gmaj7
  { bass: 45, pad: [45, 52, 57, 61], arp: [57, 61, 64, 69, 73, 76] }, // A
];
// what plays in each bar: p pad · a arp · A arp+octave · k kick · h hats · H hats (16ths) · b bass · m melody
const ARRANGE = [
  "p", "p", "p", //                                   hook      0–6 s    (starts on Bm: unresolved)
  "pa", "pa", //                                      title     6–10
  "pakb", "pakhb", "pakhb", "pakhb", "pakhb", "pakhb", "pakhb", // write 10–24
  "pAkhb", "pAkhb", "pAkhb", "pAkhb", //              edit      24–32
  "pa", "pa", "pa", //                                same      32–38   (breakdown)
  "pakHb", "pakHb", "pakHb", "pakHb", "pakHb", "pakHb", "pakHb", "pAkHb", // agent 38–54
  "pAkHbm", "pAkHbm", "pAkHbm", "pAkHbm", //          range     54–62
  "pa", "p", "p", //                                  end       62–68
];
const HOOK_CHORDS = [1, 2, 3];
const ARP_PATTERN = [0, 2, 1, 3, 2, 4, 3, 1];
const MELODY = [
  [81, 0], [78, 1], [76, 1.5], [74, 2.5], // bar 27
  [76, 0], [78, 1], [74, 2], [71, 3],
  [74, 0], [76, 0.5], [78, 1.5], [83, 2.5],
  [81, 0], [85, 1], [81, 2], [78, 3],
];

const kicks = [];
ARRANGE.forEach((what, bar) => {
  const t0 = bar * BAR;
  const c = bar < 3 ? CHORDS[HOOK_CHORDS[bar]] : bar >= 31 ? CHORDS[0] : CHORDS[(bar - 3) % 4];
  const last = bar >= 32;
  if (what.includes("p")) c.pad.forEach((m, i) => pad(t0, last ? BAR * (34 - bar) - 0.6 : BAR, m, bar < 3 || (bar >= 16 && bar <= 18) ? 0.04 : 0.03, (i - 1.5) * 0.4));
  if (bar >= 32) return;
  if (what.includes("a") || what.includes("A")) {
    for (let s = 0; s < 8; s++) {
      if (bar >= 16 && bar <= 18 && s % 2 === 1) continue; // the breakdown thins to quarters
      const m = c.arp[ARP_PATTERN[s]];
      pluck(t0 + s * 0.25, m, bar >= 16 && bar <= 18 ? 0.12 : 0.095, s % 2 ? 0.45 : -0.45);
      if (what.includes("A") && s % 2 === 0) pluck(t0 + s * 0.25 + 0.125, m + 12, 0.04, s % 4 ? -0.6 : 0.6, 0.7, 0.16);
    }
  }
  if (what.includes("k")) for (const b of [0, 2]) kicks.push(t0 + b * BEAT), kick(t0 + b * BEAT);
  if (what.includes("h")) for (let s = 0; s < 4; s++) hat(t0 + s * BEAT + 0.25, 0.042, s % 2 ? 0.3 : -0.2);
  if (what.includes("H")) for (let s = 0; s < 16; s++) hat(t0 + s * 0.125, s % 4 === 2 ? 0.045 : 0.02, s % 2 ? 0.3 : -0.2);
  if (what.includes("b")) for (const [b, o] of [[0, 0], [0.75, 0], [1.5, 0], [2, 0], [2.75, 12], [3.5, 0]]) bass(t0 + b * BEAT, c.bass + o);
  if (what.includes("m")) MELODY.slice((bar - 27) * 4, (bar - 27) * 4 + 4).forEach(([m, b]) => pluck(t0 + b * BEAT, m, 0.085, 0.1, 0.9, 0.38));
});
// hook: three bare notes over the pad, and the final chord of the film
pluck(0.3, 66, 0.07, -0.2, 0.9, 0.7);
pluck(2.25, 62, 0.07, 0.2, 0.9, 0.7);
pluck(4.3, 69, 0.08, 0, 0.9, 0.7);
chime(64.0, [62, 66, 69, 74, 78], 0.06);
chime(65.6, [74, 78, 81, 86], 0.04);

// ── the cues ─────────────────────────────────────────────────────────────────
const S = { hook: 0, title: 6, write: 10, same: 32, agent: 38, range: 54, end: 62 }; // src/timeline.ts
for (const [id, at] of Object.entries(S)) if (id !== "hook") whoosh(at - 0.12, 0.62, 0.06, id !== "end");

// Hook.tsx — QUESTIONS[].at, the turn at 4.25
[2.5, 2.8, 3.1].forEach((t, i) => pop(S.hook + t, 70 - i * 3, 0.07, 0.3));
whoosh(S.hook + 4.2, 0.7, 0.045, true);

// Title.tsx / End.tsx — Lockup: mark at `at`, letters from at+0.18 every 0.05
for (const [scene, at] of [[S.title, 0.45], [S.end, 0.35]]) {
  pop(scene + at, 62, 0.08);
  for (let i = 0; i < 8; i++) tick(scene + at + 0.18 + i * 0.05, 0.035, (i - 4) / 6, 1800 + i * 160);
}

// Write.tsx — the typing schedule, recomputed with the same formula
{
  const lines = readFileSync(join(root, "plans", "laneway.arch"), "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const TYPE_FROM = 1.0, TYPE_TO = 12.3, BREATH = 0.3;
  const chars = lines.reduce((s, l) => s + l.length, 0);
  const breaths = lines.filter((l) => l.trim() === "").length;
  const cps = chars / (TYPE_TO - TYPE_FROM - breaths * BREATH);
  const scale = [62, 64, 66, 69, 71, 74, 76, 78, 81];
  let t = S.write + TYPE_FROM;
  let n = 0;
  for (const l of lines) {
    if (l.trim() === "") {
      t += BREATH;
      continue;
    }
    const len = l.length / cps;
    for (let k = 0; k * 0.047 < len; k++) tick(t + k * 0.047, 0.016 + 0.008 * Math.abs(rnd()), rnd() * 0.5 - 0.35, 2200 + 900 * Math.abs(rnd()));
    t += len;
    // a statement that draws something lands as a note: the plan is heard being built
    if (/^\s*(wall|room|door|window|furniture)\b/.test(l)) pluck(t, scale[n++ % scale.length] + (n > 18 ? 12 : 0), 0.045, 0.55, 0.9, 0.3);
  }
  // EDIT_AT 14 · the lens at +0.75 · the scrub 15.5 → 18.3, one tick per 50 mm
  pop(S.write + 14.75, 74, 0.07, -0.3);
  const steps = (5400 - 4200) / 50;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  let lastStep = 0;
  for (let i = 0; i <= 840; i++) {
    const tt = i / 300;
    const st = Math.round(ease(tt / 2.8) * steps);
    if (st !== lastStep) {
      tick(S.write + 15.5 + tt, 0.03, 0.4, 1500 + st * 60);
      if (st % 4 === 0) pluck(S.write + 15.5 + tt, 62 + st, 0.035, 0.5, 0.8, 0.14);
      lastStep = st;
    }
  }
  chime(S.write + 18.35, [74, 78, 81], 0.05);
}

// Same.tsx — AT [1.15, 1.85], MATCH 3.1, the badge at MATCH + 0.55
[1.15, 1.85].forEach((t, i) => {
  pop(S.same + t, 69 + i * 5, 0.07, 0.1);
  for (let k = 0; k < 64; k += 2) tick(S.same + t + 0.2 + k * 0.011, 0.012, 0.6, 3000 + rnd() * 600);
});
for (let k = 0; k < 64; k += 2) tick(S.same + 3.1 + k * 0.009, 0.02, 0.6, 1800 + k * 40);
chime(S.same + 3.65, [74, 81, 86], 0.06);

// Agent.tsx — BLOCKS[].at, CPS 46, OUT_DELAY .22; FIXED_AT, WARN_AT, INSERT_AT, PASS_AT
{
  const baked = JSON.parse(readFileSync(join(root, "src", "data", "baked.json"), "utf8"));
  const AT = { compile: 0.7, fix: 3.9, validate: 6.4, suggest: 8.3, describe: 10.9, gate: 13.7 };
  for (const [id, at] of Object.entries(AT)) {
    const st = baked.steps.find((s) => s.id === id);
    const len = st.cmd.length / 46;
    for (let k = 0; k * 0.06 < len; k++) tick(S.agent + at + k * 0.06, 0.03, -0.45, 1900 + 500 * Math.abs(rnd()));
    const done = S.agent + at + len + 0.22;
    if (st.exit === 0) pop(done, id === "gate" ? 81 : 76, 0.06, -0.3);
    else buzz(done, 0.06);
  }
  pop(S.agent + 4.75, 78, 0.07, 0.4);
  pop(S.agent + 10.0, 81, 0.07, 0.4);
  thud(S.agent + 14.45, 0.34);
  chime(S.agent + 14.5, [74, 78, 81, 86], 0.07);
}

// Range.tsx — SPLIT 4.3; themes every 0.55 from +0.5; formats every 0.42 from +0.7
for (let i = 0; i < 8; i++) tick(S.range + 0.1 + i * 0.07, 0.03, (i - 4) / 5, 1400 + i * 120);
for (let i = 1; i < 5; i++) tick(S.range + 4.8 + i * 0.55, 0.05, -0.5, 1500);
for (let i = 0; i < 5; i++) pop(S.range + 5.0 + i * 0.42, 69 + [0, 2, 5, 7, 12][i], 0.07, 0.5);

// End.tsx — the install line types 1.7 → 2.6
for (let k = 0; k < 15; k++) tick(S.end + 1.7 + k * 0.06, 0.03, 0, 1900 + 500 * Math.abs(rnd()));

// ── the room: a stereo feedback delay with a darkening tail ──────────────────
{
  const dl = Math.round(0.375 * SR);
  const dr = Math.round(0.5 * SR);
  const bl = new Float32Array(N);
  const br = new Float32Array(N);
  let fl = 0;
  let fr = 0;
  for (let i = 0; i < N; i++) {
    const inL = SL[i] + (i >= dl ? br[i - dl] * 0.36 : 0);
    const inR = SR_[i] + (i >= dr ? bl[i - dr] * 0.36 : 0);
    fl += 0.32 * (inL - fl);
    fr += 0.32 * (inR - fr);
    bl[i] = fl;
    br[i] = fr;
    L[i] += (i >= dl ? bl[i - dl] : 0) * 0.5;
    R[i] += (i >= dr ? br[i - dr] : 0) * 0.5;
  }
}

// the kick ducks everything else a little, then the master fades in and out
{
  const env = new Float32Array(N).fill(1);
  for (const k of kicks) {
    const i0 = Math.round(k * SR);
    for (let i = 0; i < SR * 0.3 && i0 + i < N; i++) env[i0 + i] = Math.min(env[i0 + i], 1 - 0.18 * Math.exp(-i / (SR * 0.09)));
  }
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const master = Math.min(1, t / 0.05) * Math.min(1, Math.max(0, (DUR - 0.05 - t) / 2.2));
    L[i] = Math.tanh(L[i] * env[i] * 1.5) * master;
    R[i] = Math.tanh(R[i] * env[i] * 1.5) * master;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  console.log("synth: peak", peak.toFixed(3));
}

// ── write ────────────────────────────────────────────────────────────────────
const out = join(root, "public", "audio");
mkdirSync(out, { recursive: true });
const pcm = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), i * 4);
  pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), i * 4 + 2);
}
const head = Buffer.alloc(44);
head.write("RIFF", 0);
head.writeUInt32LE(36 + pcm.length, 4);
head.write("WAVEfmt ", 8);
head.writeUInt32LE(16, 16);
head.writeUInt16LE(1, 20);
head.writeUInt16LE(2, 22);
head.writeUInt32LE(SR, 24);
head.writeUInt32LE(SR * 4, 28);
head.writeUInt16LE(4, 32);
head.writeUInt16LE(16, 34);
head.write("data", 36);
head.writeUInt32LE(pcm.length, 40);
const raw = join(root, "out", "soundtrack.raw.wav");
mkdirSync(dirname(raw), { recursive: true });
writeFileSync(raw, Buffer.concat([head, pcm]));
// one loudness pass to the streaming target; -bitexact keeps the file reproducible
const final = join(out, "soundtrack.wav");
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", raw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-bitexact", "-fflags", "+bitexact", final]);
console.log("synth: wrote", final);
