'use client';

import type { ReactNode } from 'react';
import { LinearPursuitLab, type LinearPursuitProps } from '../../../physics/linear-pursuit/index.js';

export default function Runtime(props: Record<string, unknown>): ReactNode {
  return <LinearPursuitLab {...(props as LinearPursuitProps)} />;
}
