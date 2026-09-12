// Harness stand-in for the HOST's shadcn `@/components/ui/button`. Labs is transpiled by the
// Next host (`transpilePackages`), which resolves `@/…` to the host's real shadcn/base-ui
// components. The Node-side gallery/tests have no host, so these shims render the plain
// element with the same DOM contract (type, disabled, aria-*, data-*, className) and drop
// the shadcn-only styling props. Snapshots only judge the scene <svg>, never this chrome.
import { createElement } from 'react';

export function Button({ variant, size, asChild, className, ...rest }) {
  return createElement('button', { className, 'data-variant': variant, 'data-size': size, ...rest });
}
export const buttonVariants = () => '';
