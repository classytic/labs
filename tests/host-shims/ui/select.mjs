// Harness stand-in for the HOST's shadcn `@/components/ui/select` (base-ui underneath).
//
// The real control renders its list in a portal behind a trigger. None of that is observable
// in the Node harness, and a snapshot of an unopened listbox says nothing, so the shim renders
// a native `<select>`: it keeps the value/onValueChange contract and every option stays in the
// snapshot, which is what the authoring tests assert on.
import { Children, createElement, isValidElement } from 'react';

/** Walk the tree for SelectItem elements; the real Select nests them under SelectContent. */
function collectItems(node, out = []) {
  Children.forEach(node, (child) => {
    if (!isValidElement(child)) return;
    if (child.props && typeof child.props.value === 'string' && child.type?.__selectItem) {
      out.push({ value: child.props.value, label: child.props.children });
      return;
    }
    if (child.props?.children) collectItems(child.props.children, out);
  });
  return out;
}

export function Select({ items, value, defaultValue, onValueChange, disabled, children }) {
  const collected = collectItems(children);
  const options = collected.length ? collected : (items ?? []);
  return createElement(
    'select',
    {
      'data-slot': 'select',
      value: value ?? defaultValue ?? '',
      disabled,
      onChange: (event) => onValueChange?.(event.target.value),
    },
    options.map((option) =>
      createElement('option', { key: option.value, value: option.value }, option.label),
    ),
  );
}

// Trigger/Value/Content collapse away: the native <select> above already renders both the
// current value and the list, and nesting them would produce invalid markup inside <select>.
export function SelectTrigger() {
  return null;
}
export function SelectValue() {
  return null;
}
export function SelectContent({ children }) {
  return children;
}
export function SelectItem({ value, children }) {
  return createElement('option', { value }, children);
}
SelectItem.__selectItem = true;
export function SelectGroup({ children }) {
  return children;
}
export function SelectLabel({ children }) {
  return children;
}
