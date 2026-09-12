import type { ReactNode } from 'react';
import { Ball, Block, FigText, Figure, HUE, Particle, Ray, Region, tint } from '../../../kit/figure/index.js';
import type { XrayExposureState, XrayImageState, XrayPhotonState } from './xray-core.js';

const W = 720;
const H = 356;
const PATH_X0 = 92;
const PATH_LEN = 510;
const SOURCE = { x: 40, y: 64, w: 36, h: 240 };
const DETECTOR = { x: 606, y: 44, w: 96, h: 276 };
const TILE = { x: 618, w: 72, h: 96 };
const LANES = [
  { y: 112, capsuleY: 56, tileY: 56, label: 'soft tissue' },
  { y: 262, capsuleY: 206, tileY: 196, label: 'tissue + bone' },
] as const;
const CAPSULE = { x: 280, w: 166, h: 112 };
const BOTTOM_Y = 344;

function PhotonPath({ photons, y }: { photons: readonly XrayPhotonState[]; y: number }): ReactNode {
  return photons.map((photon) => {
    const x = PATH_X0 + photon.pathProgress * PATH_LEN;
    const cy = y + photon.laneOffset;
    if (photon.absorbed) {
      // a faded pulse resting where the material stopped it
      return <Particle key={photon.id} x={x} y={cy} r={4} color={HUE[2]} opacity={0.32} />;
    }
    return <Particle key={photon.id} x={x} y={cy} r={3.5} color={HUE[2]} />;
  });
}

export function XrayAttenuationScene({
  state,
  exposure,
}: {
  state: XrayImageState;
  exposure: XrayExposureState;
}): ReactNode {
  const count = exposure.tissuePhotons.length;
  // Radiograph convention: more exposure → darker tile. The tone is WINDOWED against the
  // brighter (tissue) path, exactly as a radiographer windows a study: mapping raw transmission
  // straight to ink made both tiles a near-identical white, because only ~8% of the beam gets
  // through at all, so the contrast this lab exists to teach was invisible. Windowing is driven
  // by the true transmissions, not the sampled counts, so the image does not flicker while a
  // handful of photons land; the N/30 captions carry the raw counts.
  const window_ = Math.max(state.tissueTransmission, state.bonePathTransmission, 1e-6);
  const tone = (transmission: number): string => tint(HUE.ink, Math.round((transmission / window_) * 72));
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`${exposure.tissueDetected} tissue-path and ${exposure.boneDetected} bone-path photons detected from ${count}. Tissue transmission ${state.tissueTransmission.toFixed(3)}, bone-path transmission ${state.bonePathTransmission.toFixed(3)}.`}
    >
      <FigText x={24} y={20} size="eyebrow" tone="soft">
        one cohort · two material paths
      </FigText>

      {/* beam paths exist before a single photon moves */}
      {LANES.map((lane) => (
        <Ray
          key={lane.y}
          x1={SOURCE.x + SOURCE.w + 2}
          y1={lane.y}
          x2={DETECTOR.x - 2}
          y2={lane.y}
          color={HUE[2]}
          width={12}
          opacity={0.16}
        />
      ))}

      {/* source housing with one aperture per lane */}
      <Block {...SOURCE} color={HUE.metal} radius={8} />
      {LANES.map((lane) => (
        <Ball key={lane.y} cx={SOURCE.x + SOURCE.w} cy={lane.y} r={5} color={HUE[2]} />
      ))}

      {/* the two material paths */}
      {LANES.map((lane) => (
        <g key={lane.y}>
          <FigText
            x={CAPSULE.x + CAPSULE.w / 2}
            y={lane.capsuleY - 10}
            anchor="middle"
            size="note"
            tone="soft"
          >
            {lane.label}
          </FigText>
          <Region x={CAPSULE.x} y={lane.capsuleY} w={CAPSULE.w} h={CAPSULE.h} radius={40} color={HUE[3]} />
        </g>
      ))}
      <Block x={346} y={LANES[1].capsuleY + 16} w={34} h={CAPSULE.h - 32} radius={12} color={HUE.metal} />

      <PhotonPath photons={exposure.tissuePhotons} y={LANES[0].y} />
      <PhotonPath photons={exposure.bonePhotons} y={LANES[1].y} />

      {/* detector and the radiograph it builds */}
      <Block {...DETECTOR} color={HUE.metal} radius={10} />
      <Block
        x={TILE.x}
        y={LANES[0].tileY}
        w={TILE.w}
        h={TILE.h}
        radius={6}
        color={tone(state.tissueTransmission)}
      />
      <FigText x={TILE.x + TILE.w / 2} y={LANES[0].tileY + TILE.h + 18} anchor="middle" size="note">
        {exposure.tissueDetected}/{count}
      </FigText>
      <Block
        x={TILE.x}
        y={LANES[1].tileY}
        w={TILE.w}
        h={TILE.h}
        radius={6}
        color={tone(state.bonePathTransmission)}
      />
      <FigText x={TILE.x + TILE.w / 2} y={LANES[1].tileY + TILE.h + 18} anchor="middle" size="note">
        {exposure.boneDetected}/{count}
      </FigText>

      {/* captions and legend, clear of the drawing */}
      <FigText x={SOURCE.x + SOURCE.w / 2} y={BOTTOM_Y} anchor="middle" size="note" tone="soft">
        source
      </FigText>
      <Particle x={206} y={BOTTOM_Y - 4} r={3.5} color={HUE[2]} />
      <FigText x={216} y={BOTTOM_Y} size="note" tone="soft">
        transmitted
      </FigText>
      <Particle x={318} y={BOTTOM_Y - 4} r={4} color={HUE[2]} opacity={0.32} />
      <FigText x={328} y={BOTTOM_Y} size="note" tone="soft">
        absorbed
      </FigText>
      <FigText x={DETECTOR.x + DETECTOR.w / 2} y={BOTTOM_Y} anchor="middle" size="note" tone="soft">
        detector image
      </FigText>
    </Figure>
  );
}
