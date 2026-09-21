import React from 'react';
import {AMBIENT} from './ambient-data';
import {LOOP_SECONDS, WIDTH} from './config';
import {blink, lerp, swing} from './math';

/**
 * The gentle life on top of the painted backdrop: a breathing sun with slowly
 * turning rays, drifting clouds, two butterflies, swaying grass and flowers.
 * Every period divides LOOP_SECONDS so the loop closes without a jump.
 */

const Raw: React.FC<{svg: string; transform?: string; opacity?: number}> = ({svg, transform, opacity}) => (
  <g transform={transform} opacity={opacity} dangerouslySetInnerHTML={{__html: svg}} />
);

// Clouds: [top, crossing seconds, phase offset seconds, scale]
const CLOUDS: [number, number, number, number][] = [
  [50, 180, 20, 1],
  [120, 180, 95, 0.7],
  [10, 180, 150, 0.55],
  [150, 90, 70, 0.6],
];

// Butterflies: [top, crossing seconds, phase offset]
const BUTTERFLIES: [number, number, number][] = [
  [560, 36, 5],
  [820, 45, 30],
];

const GRASS_PERIODS = [6, 5, 4.5, 7.2, 4];
const FLOWER_PERIODS = [6, 5, 7.2, 4.5, 9];

export const Ambient: React.FC<{t: number}> = ({t}) => {
  const sunScale = lerp(1, 1.05, swing(t, 10));
  const rayRot = (360 * t) / LOOP_SECONDS;
  const sunBlink = blink(t, 5, 0, 0.1);
  return (
    <g>
      <defs dangerouslySetInnerHTML={{__html: AMBIENT.defs}} />

      {/* clouds drift left to right, 2400px per crossing, starting at x=-460 */}
      {CLOUDS.map(([top, secs, off, sc], i) => {
        const u = (((t + off) % secs) + secs) % secs / secs;
        const x = -460 + 2400 * u;
        return <Raw key={i} svg={AMBIENT.cloud} transform={`translate(${x} ${top}) translate(210 90) scale(${sc}) translate(-210 -90)`} />;
      })}

      {/* sun: 400x400 box at (1120,40) */}
      <g transform={`translate(1320 240) scale(${sunScale}) translate(-1320 -240)`}>
        <g transform="translate(1120 40)">
          <Raw svg={AMBIENT.rays} transform={`rotate(${rayRot} 200 200)`} />
          <Raw svg={AMBIENT.face} />
          {[150, 220].map((x) => (
            <g key={x} transform={`translate(${x + 15} ${172 + 17}) scale(1 ${sunBlink}) translate(${-(x + 15)} ${-(172 + 17)})`}>
              <ellipse cx={x + 15} cy={172 + 17} rx={15} ry={17} fill="#5b4636" />
            </g>
          ))}
        </g>
      </g>

      {/* butterflies: drift across while bobbing; wings fold softly */}
      {BUTTERFLIES.map(([top, secs, off], i) => {
        const u = (((t + off) % secs) + secs) % secs / secs;
        const x = -100 + 2400 * u;
        const bobU = swing(t, 6, i * 1.7);
        const dy = lerp(-70, 70, bobU);
        const rot = lerp(8, -6, bobU);
        const fold = lerp(1, 0.45, swing(t, 1.2, i * 0.3));
        const svg = AMBIENT.butterflies[i];
        const left = svg.split('<g class="wr">')[0].replace('<g class="wl">', '').replace('</g>', '');
        const right = svg.split('<g class="wr">')[1].split('</g>')[0];
        const body = svg.split('</g>').pop() ?? '';
        return (
          <g key={i} transform={`translate(${x} ${top + dy}) rotate(${rot} 35 30)`}>
            <Raw svg={left} transform={`translate(35 30) scale(${fold} 1) translate(-35 -30)`} />
            <Raw svg={right} transform={`translate(35 30) scale(${fold} 1) translate(-35 -30)`} />
            <Raw svg={body} />
          </g>
        );
      })}

      {/* grass tufts and flowers sway from their base */}
      {AMBIENT.grassAt.map(([x, y], i) => {
        const rot = lerp(-5, 6, swing(t, GRASS_PERIODS[i % GRASS_PERIODS.length], i * 0.9));
        return <Raw key={`g${i}`} svg={AMBIENT.grass} transform={`translate(${x} ${y}) rotate(${rot} 60 110)`} />;
      })}
      {AMBIENT.flowers.map((f, i) => {
        const rot = lerp(-5, 6, swing(t, FLOWER_PERIODS[i % FLOWER_PERIODS.length], i * 1.3));
        return <Raw key={`f${i}`} svg={f.svg} transform={`translate(${f.x} ${f.y}) rotate(${rot} 50 130)`} />;
      })}
      {/* keep WIDTH referenced for clarity of the stage size */}
      <rect width={WIDTH} height={0} fill="none" />
    </g>
  );
};
