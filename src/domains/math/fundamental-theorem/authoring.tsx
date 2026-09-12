'use client';

import type { ReactNode } from 'react';
import { CalculusAuthoring } from '../calculus-authoring.js';

export default function FundamentalTheoremAuthoring(props: {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
}): ReactNode {
  return <CalculusAuthoring kind="fundamental-theorem" {...props} />;
}
