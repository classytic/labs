'use client';
import type { ReactNode } from 'react';
import { RelativityLightClockLab, type RelativityLightClockProps } from '../../../physics/modern/index.js';
export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <RelativityLightClockLab {...(p as RelativityLightClockProps)} />;
}
