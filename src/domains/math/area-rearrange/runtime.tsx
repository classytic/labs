'use client';

/** Area-rearrange runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { AreaRearrangeLab, type AreaRearrangeProps } from '../../../math/area-rearrange/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <AreaRearrangeLab {...(p as AreaRearrangeProps)} />;
}
