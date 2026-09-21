// Every number that shapes the video lives here.
// Timings are in seconds, positions in 1920x1080 canvas pixels.

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// One seamless loop. Every ambient period below divides this number,
// and the animal schedule wraps around it, so the last frame flows into the first.
export const LOOP_SECONDS = 180;
export const LOOP_FRAMES = LOOP_SECONDS * FPS;

// Background lullaby volume, 0 to 1. Set to 0 for silence.
export const MUSIC_VOLUME = 0.6;

// How many loops make the long version (20 x 3 min = 1 hour).
export const HOUR_LOOPS = 20;

// Animal choreography. Slower and sparser than the original slide deck:
// one new visitor every VISIT_GAP seconds, walking at WALK_SPEED px/s,
// pausing PAUSE_SECONDS in the middle. At most two animals share the screen.
export const VISIT_GAP = 12;
export const WALK_SPEED = 160;
export const PAUSE_SECONDS = 6;
export const STRIDE_PX = 220; // distance covered by one leg cycle
export const DECEL_PX = 120; // easing distance when stopping and starting
export const SCHEDULE_SEED = 11;

// Depth lanes: feet line (y) and lane scale, back to front.
export const LANE_Y = [850, 890, 930, 970, 1010, 1050];
export const LANE_SCALE = [0.7, 0.76, 0.82, 0.88, 0.94, 1.0];

// The six stop columns, as fractions of the width.
export const STOP_COLUMNS = [0, 1, 2, 3, 4, 5].map((c) => (0.12 + 0.152 * c) * WIDTH);

export type Behavior = 'hop' | 'graze' | 'flap';

export type AnimalSpec = {
  name: string;
  lane: number;
  scale: number;
  behavior: Behavior;
};

// Same lanes and sizes as the deck's loop slide, plus what each one does when it stops.
export const ANIMALS: AnimalSpec[] = [
  {name: 'cow', lane: 0, scale: 1, behavior: 'graze'},
  {name: 'horse', lane: 2, scale: 0.85, behavior: 'graze'},
  {name: 'donkey', lane: 2, scale: 0.85, behavior: 'graze'},
  {name: 'pig', lane: 0, scale: 1, behavior: 'hop'},
  {name: 'sheep', lane: 4, scale: 0.64, behavior: 'graze'},
  {name: 'goat', lane: 4, scale: 0.64, behavior: 'hop'},
  {name: 'dog', lane: 3, scale: 0.8, behavior: 'hop'},
  {name: 'cat', lane: 3, scale: 0.7, behavior: 'graze'},
  {name: 'rabbit', lane: 1, scale: 0.82, behavior: 'hop'},
  {name: 'chicken', lane: 5, scale: 0.62, behavior: 'flap'},
  {name: 'duck', lane: 1, scale: 0.95, behavior: 'flap'},
];

// Half-width of an animal's 600px art box, used to know when it is fully off screen.
export const ART_HALF_WIDTH = 330;
export const ART_W = 600;
export const ART_H = 500;
export const FOOT_X = 300; // pivot inside the art box
export const FOOT_Y = 470;
