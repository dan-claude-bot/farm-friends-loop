import {ANIMALS, PAUSE_SECONDS, STRIDE_PX} from './config';
import {blink, lerp, smooth, swing} from './math';
import {elapsedInLoop, speedFraction, travelled, Visit} from './schedule';

/** Everything the sprite needs to draw one frame of one animal. */
export type Pose = {
  x: number;
  y: number;
  scale: number;
  dir: 1 | -1;
  bodyY: number; // walk bob
  bodyScale: [number, number]; // idle breathing
  headY: number;
  headRot: number;
  legA: [number, number]; // front legs offset
  legB: [number, number]; // back legs offset
  tailRot: number;
  wingRot: number;
  shadowSx: number;
  shadowScale: number;
  shadowOpacity: number;
  hopY: number;
  squash: [number, number];
  blinkL: number;
  blinkR: number;
};

/** The four-keyframe leg loop from the deck: (-13,0) -> (0,-11) -> (13,0) -> back. */
const legCycle = (u: number): [number, number] => {
  const p = ((u % 1) + 1) % 1;
  if (p < 0.25) return [lerp(-13, 0, p / 0.25), lerp(0, -11, p / 0.25)];
  if (p < 0.5) return [lerp(0, 13, (p - 0.25) / 0.25), lerp(-11, 0, (p - 0.25) / 0.25)];
  return [lerp(13, -13, (p - 0.5) / 0.5), 0];
};

/** One soft hop of `height` px: 0 outside [0,1], parabola inside. */
const hop = (u: number, height: number) => {
  if (u <= 0 || u >= 1) return 0;
  return height * Math.sin(Math.PI * u);
};

export const poseAt = (t: number, visit: Visit, eyeDelay: number): Pose | null => {
  const e = elapsedInLoop(t, visit);
  if (e < 0) return null;
  const spec = ANIMALS[visit.animal];
  const dIn = Math.abs(visit.stopX - visit.x0);
  const dOut = Math.abs(visit.x1 - visit.stopX);
  const pauseStart = visit.tIn;
  const outStart = visit.tIn + PAUSE_SECONDS;

  let x: number;
  let speed: number; // 0..1
  let dist: number; // px walked so far in this visit, drives the leg cycle
  if (e < pauseStart) {
    dist = travelled(e, dIn, true);
    x = visit.x0 + visit.dir * dist;
    speed = speedFraction(e, dIn, true);
  } else if (e < outStart) {
    dist = dIn;
    x = visit.stopX;
    speed = 0;
  } else {
    const eo = e - outStart;
    dist = dIn + travelled(eo, dOut, false);
    x = visit.stopX + visit.dir * travelled(eo, dOut, false);
    speed = speedFraction(eo, dOut, false);
  }

  // Walk cycle, tied to distance so legs slow down with the body.
  const u = dist / STRIDE_PX;
  const amp = smooth(speed);
  const bob = swing(u, 1) * 7 * amp;
  const headV = swing(u, 2);
  const [ax, ay] = legCycle(u);
  const [bx, by] = legCycle(u + 0.5);

  // Idle life: slow breathing and a gentle head sway, always on but strongest at rest.
  const rest = 1 - amp;
  const breathe = swing(e, 4.4);
  const sway = swing(e, 5.6);

  // What the animal does while it stands still.
  const p = e - pauseStart; // seconds into the pause (negative before it)
  let hopY = 0;
  let grazeRot = 0;
  let flapRot = 0;
  if (p >= 0 && p < PAUSE_SECONDS) {
    if (spec.behavior === 'hop') {
      hopY = hop((p - 1.2) / 0.9, 40) + hop((p - 2.6) / 0.9, 34);
    } else if (spec.behavior === 'graze') {
      const down = smooth((p - 1.0) / 1.3);
      const up = smooth((p - 3.6) / 1.3);
      grazeRot = 14 * (down - up);
    } else {
      // flap: quick soft wing beats with one little hop in the middle
      if (p > 1.4 && p < 3.6) flapRot = -18 * swing(p - 1.4, 0.55);
      hopY = hop((p - 2.2) / 0.9, 28);
    }
  }
  const hopU = hopY / 40; // 0..1-ish, for squash and shadow
  const squash: [number, number] = [lerp(1, 0.97, hopU), lerp(1, 1.03, hopU)];

  const walkWing = -13 * swing(u, 1) * amp;
  const idleWing = -13 * swing(e, 3.2) * rest;

  return {
    x,
    y: visit.y,
    scale: visit.scale,
    dir: visit.dir,
    bodyY: -bob,
    bodyScale: [lerp(1, 1.03, breathe * rest), lerp(1, 1.025, breathe * rest)],
    headY: -7 * Math.sin(Math.PI * headV) * amp + grazeRot * 1.6, // grazing also lowers the head
    headRot: lerp(-3, 3, headV) * amp + lerp(-4, 4, sway) * rest + grazeRot,
    legA: [ax * amp, ay * amp],
    legB: [bx * amp, by * amp],
    tailRot: lerp(-10, 10, swing(e, 2.4)),
    wingRot: walkWing + idleWing + flapRot,
    shadowSx: lerp(1, 0.93, swing(u, 1) * amp),
    shadowScale: lerp(1, 0.7, hopU),
    shadowOpacity: lerp(0.2, 0.08, hopU),
    hopY: -hopY,
    squash,
    blinkL: blink(t, 5, eyeDelay),
    blinkR: blink(t, 5, eyeDelay),
  };
};
