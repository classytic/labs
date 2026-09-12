'use client';

/** Lines-in-space runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { LinesInSpaceLab, type LinesInSpaceProps } from '../../../math/lines-in-space/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <LinesInSpaceLab {...(p as LinesInSpaceProps)} />;
}
