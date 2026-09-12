// Harness stand-in for the HOST's shadcn `@/components/ui/collapsible`. The labs' disclosures
// ("Explore evidence", "Event transcript") need to render their content in the Node gallery so
// snapshots see it, so the shim is always-open and ignores the open/onOpenChange contract.
import { createElement } from 'react';

export function Collapsible({ open, defaultOpen, onOpenChange, className, children, ...rest }) {
  return createElement('div', { className, 'data-slot': 'collapsible', ...rest }, children);
}
export function CollapsibleTrigger({ asChild, className, children, ...rest }) {
  return createElement(
    'button',
    { type: 'button', className, 'data-slot': 'collapsible-trigger', ...rest },
    children,
  );
}
export function CollapsibleContent({ className, children, ...rest }) {
  return createElement('div', { className, 'data-slot': 'collapsible-content', ...rest }, children);
}
