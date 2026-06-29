'use client';

/**
 * MysteryBucket, the essentials opener. A sealed bucket of hidden weight sits
 * on a balance; the learner adds 1-unit weights to the other pan until the beam
 * is level. When it balances, the bucket's weight is revealed, they've "weighed
 * the unknown" with no symbols at all. This is the concrete ground the letter x
 * (and coefficients, and equations) is built on in later lessons.
 *
 * A SceneDoc factory + a thin interactive shell (add/remove a unit) on the
 * mystery-bucket asset. Solve reports to the learner seam.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Scene, registerAsset, type SceneDoc } from '@classytic/stage';
import { MYSTERY_BUCKET_ASSET } from './asset.js';
import { Stepper, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

registerAsset('mystery-bucket', MYSTERY_BUCKET_ASSET);
export { MYSTERY_BUCKET_ASSET };

export interface MysteryBucketProps {
  /** The hidden weight inside EACH bucket (the unknown). 1–maxWeights. */
  bucketWeight?: number;
  /** How many identical buckets sit on the left pan (coefficients: 2 = "2x"). */
  bucketCount?: number;
  /** Most unit weights a learner can stack. */
  maxWeights?: number;
  /** Where the learner starts (units already on the pan). */
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
}

/** Params → a portable SceneDoc (the asset self-registers on import). */
export function mysteryBucketDoc(params: { bucketWeight: number; count: number; bucketCount?: number; maxWeights?: number }): SceneDoc {
  return {
    schemaVersion: 2,
    type: 'stage-scene',
    view: { xMin: -5, xMax: 5, yMin: -2.4, yMax: 3.4 },
    elements: [
      { id: 'scale', kind: 'asset', def: { op: 'asset', asset: 'mystery-bucket', params: { bucketWeight: params.bucketWeight, bucketCount: params.bucketCount ?? 1, count: params.count }, bind: {} } },
    ],
    bindings: [],
  };
}

export function MysteryBucketLab({
  bucketWeight = 5,
  bucketCount = 1,
  maxWeights = 12,
  start = 0,
  title = 'The mystery bucket',
  prompt = 'Add weights until the scale is level, then you’ve weighed the mystery.',
  height = 340,
}: MysteryBucketProps = {}): ReactNode {
  const buckets = Math.max(1, Math.round(bucketCount));
  const per = clamp(Math.round(bucketWeight), 1, maxWeights);
  const total = per * buckets;                 // weights needed to balance
  const cap = Math.max(maxWeights, total + 2);
  const [count, setCount] = useState(clamp(Math.round(start), 0, cap));
  useEffect(() => { setCount(clamp(Math.round(start), 0, cap)); }, [start, cap]);

  const balanced = count === total;
  const doc = useMemo(() => mysteryBucketDoc({ bucketWeight: per, bucketCount: buckets, count, maxWeights: cap }), [per, buckets, count, cap]);

  useCheckpoint({ solved: balanced, activity: 'mystery-bucket' });

  const reveal = buckets === 1 ? `The bucket weighs ${per}.` : `${buckets} buckets balance ${total}, so each bucket weighs ${per}.`;
  const status = balanced
    ? `Level! ${reveal}`
    : count < total ? 'The bucket side is heavier, add more weights.' : 'Too heavy now, take some off.';

  const figure = (
    <Scene doc={doc} interactive={false} showGrid={false} showAxes={false} height={height} ariaLabel={`Balance: a mystery bucket against ${count} unit weights, ${balanced ? 'level' : 'tipping'}`} />
  );

  const controls = (
    <ControlBar>
      <Field label="weights">
        <Stepper value={count} min={0} max={cap} onChange={setCount} label="unit weights" />
      </Field>
      <span style={{ opacity: 0.85 }}>{status}</span>
      <StatusPill ok={balanced}>{balanced ? '✓ Balanced' : 'Not level'}</StatusPill>
    </ControlBar>
  );

  const footer = (
    <LiveRegion>{status}</LiveRegion>
  );

  return <LabFrame title={title} prompt={prompt} controls={controls} footer={footer}>{figure}</LabFrame>;
}
