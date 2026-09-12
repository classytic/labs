'use client';

/** Frequency-density runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { FrequencyDensity, type FrequencyDensityProps } from '../../../statistics/frequency-density/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <FrequencyDensity {...(p as FrequencyDensityProps)} />;
}
