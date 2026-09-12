// Harness stand-in for the HOST's shadcn `@/components/ui/popover` (base-ui underneath).
//
// The real one portals its content and positions it with collision detection, which is exactly
// why the authoring icon picker uses it: inside the narrow lesson-editor column a hand-rolled
// absolute panel was clipped by the scroll container. None of that positioning is observable in
// the Node harness, so the shim renders inline and keeps only the contract the tests read: the
// trigger stays a real button, and the content mounts only while open.
import { cloneElement, createElement, isValidElement, useState } from 'react';

/** Mirrors base-ui's controlled/uncontrolled `open` handling for the trigger + content pair. */
export function Popover({ open, defaultOpen, onOpenChange, modal, children, ...rest }) {
  const [self, setSelf] = useState(defaultOpen ?? false);
  const isOpen = open ?? self;
  const toggle = (next) => {
    if (open === undefined) setSelf(next);
    onOpenChange?.(next);
  };
  return createElement(
    'div',
    { 'data-slot': 'popover', 'data-open': isOpen ? '' : undefined, ...rest },
    // The children are <PopoverTrigger> and <PopoverContent>; hand each the shared state.
    Array.isArray(children)
      ? children.map((child, i) =>
          isValidElement(child) ? cloneElement(child, { key: i, __open: isOpen, __toggle: toggle }) : child,
        )
      : isValidElement(children)
        ? cloneElement(children, { __open: isOpen, __toggle: toggle })
        : children,
  );
}

export function PopoverTrigger({ render, __open, __toggle, children, ...rest }) {
  const props = {
    'data-slot': 'popover-trigger',
    'aria-expanded': __open ? 'true' : 'false',
    onClick: () => __toggle?.(!__open),
    ...rest,
  };
  // base-ui's composition prop: render AS the given element, keeping its own props.
  if (isValidElement(render)) return cloneElement(render, props, children);
  return createElement('button', { type: 'button', ...props }, children);
}

export function PopoverContent({
  align,
  alignOffset,
  side,
  sideOffset,
  __open,
  __toggle,
  className,
  children,
  ...rest
}) {
  if (!__open) return null;
  return createElement('div', { className, 'data-slot': 'popover-content', ...rest }, children);
}
