// Motion primitives. Everything is a pure function of time — no state, no randomness —
// so any frame can be rendered in any order and come out the same.

export const FPS = 30;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0→1 over [from, to] seconds, clamped. */
export const ramp = (t: number, from: number, to: number) => clamp01((t - from) / (to - from));

export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const cubicOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const quintOut = (x: number) => 1 - Math.pow(1 - x, 5);
export const cubicInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;
export const expoIn = (x: number) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));

/**
 * Closed-form under-damped spring, 0→1 from rest. `tau` is seconds since release.
 * zeta .5 is lively, .8 is firm, 1 is critical; omega is the natural frequency (rad/s).
 */
export function spring(tau: number, zeta = 0.62, omega = 18): number {
  if (tau <= 0) return 0;
  if (zeta >= 1) return 1 - Math.exp(-omega * tau) * (1 + omega * tau);
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * tau) * (Math.cos(wd * tau) + ((zeta * omega) / wd) * Math.sin(wd * tau));
}

/** Deterministic hash in [0,1) — the only "randomness" the film is allowed. */
export function hash(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** An enter/exit envelope: eased 0→1 over `inDur` from `a`, back to 0 over `outDur` ending at `b`. */
export function envelope(t: number, a: number, b: number, inDur = 0.35, outDur = 0.25): number {
  return Math.min(expoOut(ramp(t, a, a + inDur)), 1 - expoIn(ramp(t, b - outDur, b)));
}
