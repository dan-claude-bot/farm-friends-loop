import React from 'react';
import {ART_H, ART_W, FOOT_X, FOOT_Y} from '../config';
import {Pose} from '../motion';
import {ANIMAL_ART, Eye, Layer} from './data';

/** The deck's `.e` eye div, redrawn in SVG: white ball, dark iris, small highlight. */
const EyeShape: React.FC<{eye: Eye; open: number}> = ({eye, open}) => {
  const cx = eye.x + eye.w / 2;
  const cy = eye.y + eye.h / 2;
  return (
    <g transform={`translate(${cx} ${cy}) scale(1 ${open}) translate(${-cx} ${-cy})`}>
      <ellipse cx={cx} cy={cy} rx={eye.w / 2} ry={eye.h / 2} fill="#fffdf7" stroke="#0002" strokeWidth={2} />
      <ellipse cx={eye.x + 0.52 * eye.w} cy={eye.y + 0.5 * eye.h} rx={0.37 * eye.w} ry={0.37 * eye.h} fill="#2a211e" />
      <circle cx={eye.x + 0.635 * eye.w} cy={eye.y + 0.335 * eye.h} r={0.135 * eye.w} fill="#fff" />
    </g>
  );
};

const Raw: React.FC<{layer: Layer; transform?: string; style?: React.CSSProperties}> = ({layer, transform, style}) => (
  <g transform={transform} style={style} dangerouslySetInnerHTML={{__html: layer.svg}} />
);

const rotateAbout = (deg: number, origin: [number, number] | null) =>
  origin ? `rotate(${deg} ${origin[0]} ${origin[1]})` : `rotate(${deg} ${FOOT_X} ${FOOT_Y})`;

/**
 * One animal, drawn inside the 1920x1080 stage SVG. The art box is 600x500 with the
 * feet at (300,470); `pose.x/y` place that point on the stage.
 */
export const AnimalSprite: React.FC<{name: string; pose: Pose}> = ({name, pose}) => {
  const art = ANIMAL_ART[name];
  const shadow = art.layers.find((l) => l.kind === 'sh');
  const rest = art.layers.filter((l) => l.kind !== 'sh');
  const p = pose;
  const flip = `translate(${FOOT_X} ${FOOT_Y}) scale(${p.dir} 1) translate(${-FOOT_X} ${-FOOT_Y})`;
  const hopT = `translate(0 ${p.hopY}) translate(${FOOT_X} ${FOOT_Y}) scale(${p.squash[0]} ${p.squash[1]}) translate(${-FOOT_X} ${-FOOT_Y})`;
  const breathe = `translate(${FOOT_X} ${ART_H * 0.9}) scale(${p.bodyScale[0]} ${p.bodyScale[1]}) translate(${-FOOT_X} ${-ART_H * 0.9})`;

  return (
    <g
      className="an"
      transform={`translate(${p.x - FOOT_X} ${p.y - FOOT_Y}) translate(${FOOT_X} ${FOOT_Y}) scale(${p.scale}) translate(${-FOOT_X} ${-FOOT_Y})`}
    >
      <g transform={flip}>
        {shadow ? (
          <g
            transform={`translate(${FOOT_X} ${FOOT_Y}) scale(${p.shadowSx * p.shadowScale} ${p.shadowScale}) translate(${-FOOT_X} ${-FOOT_Y})`}
            opacity={p.shadowOpacity / 0.2}
          >
            <Raw layer={shadow} />
          </g>
        ) : null}
        <g transform={hopT}>
          {rest.map((layer, i) => {
            switch (layer.kind) {
              case 'tl':
                return <Raw key={i} layer={layer} transform={rotateAbout(p.tailRot, layer.origin)} />;
              case 'lb':
                return <Raw key={i} layer={layer} transform={`translate(${p.legB[0]} ${p.legB[1]})`} />;
              case 'la':
                return <Raw key={i} layer={layer} transform={`translate(${p.legA[0]} ${p.legA[1]})`} />;
              case 'bd':
                return <Raw key={i} layer={layer} transform={`translate(0 ${p.bodyY}) ${breathe}`} />;
              case 'wg':
                return <Raw key={i} layer={layer} transform={`translate(0 ${p.bodyY}) ${rotateAbout(p.wingRot, layer.origin)}`} />;
              case 'hd':
                return (
                  <g key={i} transform={`translate(0 ${p.headY}) ${rotateAbout(p.headRot, layer.origin)}`}>
                    <Raw layer={layer} />
                    {(layer.eyes ?? []).map((eye, j) => (
                      <EyeShape key={j} eye={eye} open={j === 0 ? p.blinkL : p.blinkR} />
                    ))}
                  </g>
                );
              default:
                return <Raw key={i} layer={layer} />;
            }
          })}
        </g>
      </g>
    </g>
  );
};

/** Filters and clip paths every animal references, emitted once per stage. */
export const AnimalDefs: React.FC = () => (
  <defs dangerouslySetInnerHTML={{__html: Object.values(ANIMAL_ART).map((a) => a.defs).join('')}} />
);

export const ART_BOX = {w: ART_W, h: ART_H};
