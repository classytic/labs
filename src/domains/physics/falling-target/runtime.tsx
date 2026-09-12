'use client';

/** Falling-target runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { FallingTargetLab, type FallingTargetProps } from '../../../physics/projectiles/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <FallingTargetLab {...(p as FallingTargetProps)} />;
}
