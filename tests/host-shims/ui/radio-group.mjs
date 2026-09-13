// Harness stand-in for the HOST's shadcn `@/components/ui/radio-group`.
// The production component is Base UI-backed; this shim keeps its relevant
// radio semantics and controlled-value contract in package tests.
import { createContext, createElement, useContext } from 'react';

const RadioContext = createContext(null);

export function RadioGroup({ value, onValueChange, className, children, ...rest }) {
  return createElement(
    'div',
    { role: 'radiogroup', className, 'data-slot': 'radio-group', ...rest },
    createElement(RadioContext.Provider, { value: { value, onValueChange } }, children),
  );
}

export function RadioGroupItem({ value, className, disabled, onKeyDown, ...rest }) {
  const group = useContext(RadioContext);
  const checked = group?.value === value;
  const groupHasValue = group?.value != null && group.value !== '';
  return createElement('button', {
    type: 'button',
    role: 'radio',
    className,
    disabled,
    'aria-checked': checked,
    // Base UI exposes one keyboard entry point: the selected item, or the first
    // enabled item while the controlled group has no value yet.
    tabIndex: checked ? 0 : groupHasValue ? -1 : undefined,
    'data-slot': 'radio-group-item',
    'data-checked': checked ? '' : undefined,
    onClick: () => group?.onValueChange?.(value),
    onKeyDown: (event) => {
      onKeyDown?.(event);
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const radios = [
        ...(event.currentTarget
          .closest('[role="radiogroup"]')
          ?.querySelectorAll('[role="radio"]:not(:disabled)') ?? []),
      ];
      const current = radios.indexOf(event.currentTarget);
      const next =
        event.key === 'Home'
          ? radios[0]
          : event.key === 'End'
            ? radios.at(-1)
            : radios[
                (current +
                  (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) +
                  radios.length) %
                  radios.length
              ];
      next?.focus();
      next?.click();
    },
    ...rest,
  });
}
