// Harness stand-in for the HOST's shadcn `@/components/ui/toggle-group` (base-ui ToggleGroup).
// Renders the same DOM contract the labs rely on: a group with role="group", and items that are
// real buttons carrying `data-state` + `aria-pressed`, so keyboard and a11y assertions hold.
import { createContext, createElement, useContext } from 'react';

const ToggleGroupContext = createContext(null);

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
    ToggleGroupContext.Provider,
    { value: { value: value ?? [], onValueChange } },
    createElement(
      'div',
      {
        role: 'group',
        className,
        'data-slot': 'toggle-group',
        'data-orientation': orientation ?? 'horizontal',
        ...rest,
      },
      children,
    ),
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
  const group = useContext(ToggleGroupContext);
  const isPressed = group ? group.value.includes(value) : Boolean(pressed);
  return createElement(
    'button',
    {
      type: 'button',
      className,
      'data-slot': 'toggle-group-item',
      'data-state': isPressed ? 'on' : 'off',
      'aria-pressed': isPressed,
      onClick: () => {
        if (group) {
          group.onValueChange?.(isPressed ? group.value.filter((item) => item !== value) : [...group.value, value]);
        } else {
          onPressedChange?.(!isPressed);
        }
      },
      ...rest,
    },
    children,
  );
}
