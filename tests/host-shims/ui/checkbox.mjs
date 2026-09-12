// Harness stand-in for the host's `@/components/ui/checkbox` (base-ui Checkbox): same value
// contract — `checked`, `onCheckedChange(boolean)` — on a native checkbox input.
import { createElement } from 'react';

export function Checkbox({ checked, defaultChecked, onCheckedChange, indeterminate, className, ...rest }) {
  return createElement('input', {
    type: 'checkbox',
    className,
    role: 'checkbox',
    checked: checked ?? undefined,
    defaultChecked,
    onChange: (event) => onCheckedChange?.(event.currentTarget.checked),
    'data-slot': 'checkbox',
    ...rest,
  });
}
