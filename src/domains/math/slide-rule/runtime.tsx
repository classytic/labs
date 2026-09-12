'use client';

/** Slide-rule runtime. Spread so nothing the schema accepts is dropped at this seam. */
import type { ReactNode } from 'react';
import { SlideRuleLab, type SlideRuleProps } from '../../../math/slide-rule/index.js';

export default function Runtime(p: Record<string, unknown>): ReactNode {
  return <SlideRuleLab {...(p as SlideRuleProps)} />;
}
