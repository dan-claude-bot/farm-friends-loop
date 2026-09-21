import React from 'react';
import {Composition, Loop} from 'remotion';
import {FPS, HEIGHT, HOUR_LOOPS, LOOP_FRAMES, WIDTH} from './config';
import {FarmLoop} from './FarmLoop';

const FarmHour: React.FC = () => (
  <Loop durationInFrames={LOOP_FRAMES} times={HOUR_LOOPS}>
    <FarmLoop />
  </Loop>
);

export const RemotionRoot: React.FC = () => (
  <>
    {/* The 3-minute seamless loop. Render this once, then repeat it with ffmpeg. */}
    <Composition id="FarmLoop" component={FarmLoop} durationInFrames={LOOP_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* A 30-second slice for quick checks. */}
    <Composition id="Preview" component={FarmLoop} durationInFrames={30 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* The full hour rendered directly (slow; prefer scripts/make-hour.sh). */}
    <Composition id="FarmHour" component={FarmHour} durationInFrames={LOOP_FRAMES * HOUR_LOOPS} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
