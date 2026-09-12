// Harness stand-in for the host's `@/components/ui/input` (see button.mjs for why).
import { createElement } from 'react';

// The real shadcn Input stamps `data-slot="input"`. Carrying it here lets the PNG harness
// approximate its appearance the same way it approximates the Button variants, so a dark
// screenshot does not show a white browser-default box the host would never render.
export function Input(props) {
  return createElement('input', { 'data-slot': 'input', ...props });
}
