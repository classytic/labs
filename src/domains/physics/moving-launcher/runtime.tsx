'use client';

/** Moving-launcher runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { MovingLauncherLab, type MovingLauncherProps } from '../../../physics/projectiles/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <MovingLauncherLab {...(p as MovingLauncherProps)} />;
}
