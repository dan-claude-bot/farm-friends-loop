import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Ambient} from './Ambient';
import {AnimalDefs, AnimalSprite} from './animals/AnimalSprite';
import {ANIMALS, HEIGHT, LOOP_SECONDS, WIDTH} from './config';
import {poseAt} from './motion';
import {SCHEDULE} from './schedule';

/**
 * One seamless loop of the farm. The painted backdrop is a static SVG image;
 * the ambient life and the animals are drawn on one stage SVG on top of it.
 */
export const FarmLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = (frame / fps) % LOOP_SECONDS;

  // Every visit that is on screen now, drawn back lane first so overlaps stack correctly.
  const onScreen = SCHEDULE.map((visit) => ({visit, pose: poseAt(t, visit, visit.index * 0.7)}))
    .filter((v) => v.pose !== null)
    .sort((a, b) => a.pose!.y - b.pose!.y);

  return (
    <AbsoluteFill style={{background: '#fdf6e6'}}>
      <Img src={staticFile('farm-backdrop.svg')} style={{position: 'absolute', left: 0, top: 0, width: WIDTH, height: HEIGHT}} />
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', left: 0, top: 0}}>
        <style>{`.an * { stroke-width: 4; stroke-linejoin: round; stroke-linecap: round; }`}</style>
        <AnimalDefs />
        <Ambient t={t} />
        {onScreen.map(({visit, pose}) => (
          <AnimalSprite key={visit.index} name={ANIMALS[visit.animal].name} pose={pose!} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
