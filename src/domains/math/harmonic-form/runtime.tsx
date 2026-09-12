'use client';

/** Harmonic-form runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { HarmonicFormLab, type HarmonicFormProps } from '../../../math/harmonic-form/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <HarmonicFormLab {...(p as HarmonicFormProps)} />;
}
