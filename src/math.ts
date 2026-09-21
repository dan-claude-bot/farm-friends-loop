// Small easing helpers. All take plain seconds so they read like the CSS they replace.

/** 0 -> 1 -> 0 over `period`, eased like CSS `ease-in-out infinite alternate`. */
export const swing = (t: number, period: number, offset = 0) =>
  0.5 - 0.5 * Math.cos((2 * Math.PI * (t + offset)) / period);

export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export const clamp01 = (u: number) => Math.min(1, Math.max(0, u));

export const smooth = (u: number) => {
  const v = clamp01(u);
  return v * v * (3 - 2 * v);
};

/** Deterministic PRNG (mulberry32), same as the deck used. */
export const rng = (seed: number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Blink profile: 1 = open. Every `period` seconds the lid closes to `closed`
 * for about 0.2 s, offset by `delay`.
 */
export const blink = (t: number, period: number, delay: number, closed = 0.08) => {
  const p = (((t + delay) % period) + period) % period;
  const start = period - 0.3;
  if (p < start) return 1;
  const u = (p - start) / 0.3; // 0..1 across the blink
  const tri = 1 - Math.abs(u * 2 - 1); // 0 -> 1 -> 0
  return lerp(1, closed, tri);
};
