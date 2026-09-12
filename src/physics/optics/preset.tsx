'use client';

/**
 * Optics flagship, drag the source, the aim point, or the mirrors so the light
 * ray reflects into the target. A general tool built on @classytic/stage:
 * creators place any mirrors + target.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Scene, resolve, isAssetGeom, registerAsset, type SceneDoc } from '@classytic/stage';
import { OPTICS_RAY_ASSET } from './asset.js';
import { LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface } from '../mechanics/presentation.js';
import { OpticsActivity } from './activity.js';

registerAsset('optics-ray', OPTICS_RAY_ASSET);
export { OPTICS_RAY_ASSET };

// The optics-ray asset draws the rich hatched mirror face; the segment itself is
// hidden (it still resolves, so the asset receives its endpoints), its endpoint
// points stay visible as drag handles.
const MIRROR: { hidden: true } = { hidden: true };

export function opticsDoc(): SceneDoc {
  return {
    schemaVersion: 2,
    type: 'stage-scene',
    view: { xMin: -8, xMax: 8, yMin: -5, yMax: 5 },
    elements: [
      {
        id: 'S',
        kind: 'point',
        label: 'source',
        a11y: { label: 'light source' },
        style: { color: 'var(--stage-warn)' },
        free: { at: { x: -6, y: -3 }, draggable: true },
      },
      {
        id: 'aim',
        kind: 'point',
        label: 'aim',
        style: { color: 'var(--stage-warn)' },
        free: { at: { x: -3.4, y: -1.2 }, draggable: true },
      },
      {
        id: 'T',
        kind: 'point',
        label: 'target',
        style: { color: 'var(--stage-good)' },
        free: { at: { x: 6, y: 3 } },
      },
      {
        id: 'M1a',
        kind: 'point',
        style: { color: 'var(--stage-metal)' },
        free: { at: { x: -1, y: 4 }, draggable: true },
      },
      {
        id: 'M1b',
        kind: 'point',
        style: { color: 'var(--stage-metal)' },
        free: { at: { x: 2, y: -2 }, draggable: true },
      },
      {
        id: 'm1',
        kind: 'segment',
        style: MIRROR,
        def: { op: 'segment', from: { ref: 'M1a' }, to: { ref: 'M1b' } },
      },
      {
        id: 'M2a',
        kind: 'point',
        style: { color: 'var(--stage-metal)' },
        free: { at: { x: 3, y: 4 }, draggable: true },
      },
      {
        id: 'M2b',
        kind: 'point',
        style: { color: 'var(--stage-metal)' },
        free: { at: { x: 6, y: -1 }, draggable: true },
      },
      {
        id: 'm2',
        kind: 'segment',
        style: MIRROR,
        def: { op: 'segment', from: { ref: 'M2a' }, to: { ref: 'M2b' } },
      },
      {
        id: 'ray',
        kind: 'asset',
        def: {
          op: 'asset',
          asset: 'optics-ray',
          params: { maxBounces: 8, targetR: 0.6, far: 60 },
          bind: {
            source: { ref: 'S' },
            aim: { ref: 'aim' },
            target: { ref: 'T' },
            m0: { ref: 'm1' },
            m1: { ref: 'm2' },
          },
        },
      },
    ],
    bindings: [],
  };
}

export interface OpticsProps {
  height?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: string | AuthoredActivity;
}

export function OpticsLab({
  height = 380,
  title = 'Reflect the beam into the target',
  prompt = 'Drag the source, aim point, or mirror endpoints so the reflected ray reaches the target.',
  objectives,
  activity,
}: OpticsProps): ReactNode {
  const [doc, setDoc] = useState<SceneDoc>(() => opticsDoc());
  const resolved = useMemo(() => resolve(doc), [doc]);
  const geom = resolved.values.get('ray');
  const hit = isAssetGeom(geom) && (geom.meta as { hit?: boolean } | undefined)?.hit === true;
  const bounces = isAssetGeom(geom)
    ? Number((geom.meta as { bounces?: number } | undefined)?.bounces ?? 0)
    : 0;

  useCheckpoint({ solved: hit, activity: 'optics-light-target' });

  const figure = (
    <SceneSurface className="physics-optics-target-scene" tone="grid">
      <Scene
        doc={doc}
        onChange={setDoc}
        interactive
        showGrid={false}
        showAxes={false}
        height={height}
        ariaLabel="Optics: reflect the light ray into the target"
      />
      <LiveRegion>{hit ? 'The light ray reaches the target.' : 'The ray misses the target.'}</LiveRegion>
    </SceneSurface>
  );

  const aside = (
    <>
      <div className="physics-probe">
        <span>Reflection path</span>
        <strong>{hit ? 'Target lit' : 'Keep aiming'}</strong>
        <small>
          {bounces} bounce{bounces === 1 ? '' : 's'} traced
        </small>
      </div>
      <p className="physics-explain">
        The beam updates as you move either mirror endpoint. Its angle of reflection always matches its angle
        of incidence.
      </p>
    </>
  );

  const reset = (): void => setDoc(opticsDoc());
  return (
    <OpticsActivity
      activity={activity}
      activityId="optics-light-target"
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{hit ? 'Target lit' : 'Adjust the ray'}</strong>
          <span>
            {bounces} bounce{bounces === 1 ? '' : 's'}
          </span>
        </>
      }
      figure={figure}
      evidence={aside}
      controls={
        <p className="physics-explain">
          Drag the yellow source or aim point to steer the incoming ray. Drag either endpoint of a mirror to
          change its angle.
        </p>
      }
      observation={
        hit
          ? 'The reflected path reaches the target. Each bounce obeys equal angles of incidence and reflection.'
          : 'Trace the incoming direction and rotate a mirror so its normal bisects the incoming and desired outgoing directions.'
      }
      transcript={
        <p>
          The source, aim point, mirror endpoints, traced path, and target state are all exposed in the
          interactive scene.
        </p>
      }
      objectives={objectives}
      onReset={reset}
    />
  );
}
