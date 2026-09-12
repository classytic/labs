// Harness stand-in for the host's `@/components/ui/badge` (see button.mjs for why).
import { createElement } from 'react';

export function Badge({ variant, asChild, className, ...rest }) {
  return createElement('span', { className, 'data-variant': variant, ...rest });
}
export const badgeVariants = () => '';
