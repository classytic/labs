'use client';

/** Mystery-bucket runtime — adapter: default the hidden weight, count, and weight budget. */
import type { ReactNode } from 'react';
import { MysteryBucketLab } from '../../../math/mystery-bucket/index.js';

export default function MysteryBucket(a: Record<string, unknown>): ReactNode {
  return (
    <MysteryBucketLab
      bucketWeight={typeof a.bucketWeight === 'number' ? a.bucketWeight : 5}
      bucketCount={typeof a.bucketCount === 'number' ? a.bucketCount : 1}
      maxWeights={typeof a.maxWeights === 'number' ? a.maxWeights : 12}
      start={typeof a.start === 'number' ? a.start : 0}
    />
  );
}
