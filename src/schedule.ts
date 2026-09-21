import {
  ANIMALS,
  ART_HALF_WIDTH,
  DECEL_PX,
  LANE_SCALE,
  LANE_Y,
  LOOP_SECONDS,
  PAUSE_SECONDS,
  SCHEDULE_SEED,
  STOP_COLUMNS,
  VISIT_GAP,
  WALK_SPEED,
  WIDTH,
} from './config';
import {rng} from './math';

export type Visit = {
  index: number;
  animal: number; // index into ANIMALS
  start: number; // seconds into the loop
  dir: 1 | -1; // 1 = enters from the left, walks right
  scale: number; // final art scale (animal x lane)
  y: number; // feet line
  x0: number; // entry x (off screen)
  stopX: number;
  x1: number; // exit x (off screen)
  tIn: number; // seconds walking in
  tOut: number; // seconds walking out
  duration: number; // tIn + pause + tOut
};

/** Time to cover `dist` px at WALK_SPEED with a linear ramp over the last DECEL_PX. */
export const travelTime = (dist: number) => {
  const d = Math.min(DECEL_PX, dist);
  return (dist - d) / WALK_SPEED + (2 * d) / WALK_SPEED;
};

/**
 * Distance covered after `e` seconds of a trip of `dist` px that ends with a ramp
 * down to zero speed (or, mirrored, starts with a ramp up).
 */
export const travelled = (e: number, dist: number, rampAtEnd: boolean) => {
  const d = Math.min(DECEL_PX, dist);
  const tb = (2 * d) / WALK_SPEED; // ramp duration
  const ta = (dist - d) / WALK_SPEED; // constant-speed duration
  const total = ta + tb;
  if (e <= 0) return 0;
  if (e >= total) return dist;
  if (rampAtEnd) {
    if (e < ta) return WALK_SPEED * e;
    const u = e - ta;
    return WALK_SPEED * ta + WALK_SPEED * u - (WALK_SPEED * u * u) / (2 * tb);
  }
  // ramp up first: mirror of the above
  if (e < tb) return (WALK_SPEED * e * e) / (2 * tb);
  return d + WALK_SPEED * (e - tb);
};

/** Instantaneous speed as a fraction of WALK_SPEED, for scaling the walk cycle. */
export const speedFraction = (e: number, dist: number, rampAtEnd: boolean) => {
  const d = Math.min(DECEL_PX, dist);
  const tb = (2 * d) / WALK_SPEED;
  const ta = (dist - d) / WALK_SPEED;
  if (e <= 0 || e >= ta + tb) return 0;
  if (rampAtEnd) return e < ta ? 1 : 1 - (e - ta) / tb;
  return e < tb ? e / tb : 1;
};

const buildSchedule = (): Visit[] => {
  const r = rng(SCHEDULE_SEED);
  const count = Math.floor(LOOP_SECONDS / VISIT_GAP);
  const picks: {animal: number; col: number; dir: 1 | -1}[] = [];
  const seen = ANIMALS.map(() => 0);
  for (let k = 0; k < count; k++) {
    for (let n = 0; ; n++) {
      // Favor the animals seen least so far, so everyone gets a turn.
      const fewest = Math.min(...seen);
      const pool = ANIMALS.map((_, i) => i).filter((i) => seen[i] === fewest || n > 200);
      const animal = pool[Math.floor(r() * pool.length)];
      const col = Math.floor(r() * STOP_COLUMNS.length);
      let ok = true;
      // Compare with the previous three picks, wrapping around the loop so the
      // seam obeys the same rules: no repeated animal, no shared lane with the
      // previous one, and stop columns at least two apart from the previous one.
      for (let j = 1; j <= 3; j++) {
        const others = [picks[k - j], k + j >= count ? picks[k + j - count] : undefined];
        for (const q of others) {
          if (!q) continue;
          if (q.animal === animal) ok = false;
          if (j === 1 && ANIMALS[q.animal].lane === ANIMALS[animal].lane) ok = false;
          if (j === 1 && Math.abs(q.col - col) < 2) ok = false;
        }
      }
      if (ok || n > 500) {
        seen[animal] += 1;
        picks.push({animal, col, dir: r() < 0.5 ? 1 : -1});
        break;
      }
    }
  }
  return picks.map((p, index) => {
    const spec = ANIMALS[p.animal];
    const scale = spec.scale * LANE_SCALE[spec.lane];
    const hw = ART_HALF_WIDTH * scale;
    const stopX = STOP_COLUMNS[p.col];
    const x0 = p.dir > 0 ? -hw : WIDTH + hw;
    const x1 = p.dir > 0 ? WIDTH + hw : -hw;
    const tIn = travelTime(Math.abs(stopX - x0));
    const tOut = travelTime(Math.abs(x1 - stopX));
    return {
      index,
      animal: p.animal,
      start: 2 + index * VISIT_GAP,
      dir: p.dir,
      scale,
      y: LANE_Y[spec.lane],
      x0,
      stopX,
      x1,
      tIn,
      tOut,
      duration: tIn + PAUSE_SECONDS + tOut,
    };
  });
};

export const SCHEDULE: Visit[] = buildSchedule();

/** Seconds since `visit` began at loop time `t`, wrapped so visits can straddle the seam. */
export const elapsedInLoop = (t: number, visit: Visit) => {
  const e = (((t - visit.start) % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  return e < visit.duration ? e : -1;
};
