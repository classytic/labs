// Harness stand-in for the HOST's shadcn `@/components/ui/toggle-group` (base-ui ToggleGroup).
// Renders the same DOM contract the labs rely on: a group with role="group", and items that are
// real buttons carrying `data-state` + `aria-pressed`, so keyboard and a11y assertions hold.
import { createElement } from 'react';

export function ToggleGroup({
  value,
  onValueChange,
  variant,
  size,
  spacing,
  orientation,
  className,
  children,
  ...rest
}) {
  return createElement(
    'div',
    {
      role: 'group',
      className,
      'data-slot': 'toggle-group',
      'data-orientation': orientation ?? 'horizontal',
      ...rest,
    },
    children,
  );
}

export function ToggleGroupItem({
  value,
  pressed,
  onPressedChange,
  variant,
  size,
  className,
  children,
  ...rest
}) {
  return createElement(
    'button',
    {
      type: 'button',
      className,
      'data-slot': 'toggle-group-item',
      'data-state': pressed ? 'on' : 'off',
      'aria-pressed': Boolean(pressed),
      onClick: () => onPressedChange?.(!pressed),
      ...rest,
    },
    children,
  );
}
