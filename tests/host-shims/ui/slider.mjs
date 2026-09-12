// Harness stand-in for the host's `@/components/ui/slider` (base-ui Slider). Same value
// contract — `value: number[]`, `onValueChange(number[])`, `onValueCommitted(number[])` — on a
// native range input so SSR markup and happy-dom interaction both work.
import { createElement } from 'react';

export function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step,
  orientation,
  thumbAlignment,
  className,
  ...rest
}) {
  const current = Array.isArray(value) ? value[0] : Array.isArray(defaultValue) ? defaultValue[0] : min;
  const emit = (handler) => (handler ? (event) => handler([Number(event.currentTarget.value)]) : undefined);
  const commit = emit(onValueCommitted);
  return createElement('input', {
    type: 'range',
    className,
    min,
    max,
    step,
    value: current,
    onChange: emit(onValueChange) ?? (() => {}),
    // base-ui commits on pointer release and on keyboard step release.
    onPointerUp: commit,
    onKeyUp: commit
      ? (event) => {
          if (/^(Arrow|Home|End|Page)/.test(event.key)) commit(event);
        }
      : undefined,
    'data-slot': 'slider',
    ...rest,
  });
}
