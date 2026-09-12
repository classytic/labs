// Harness stand-in for the host's `@/components/ui/textarea` (see button.mjs for why).
import { createElement } from 'react';

export function Textarea(props) {
  return createElement('textarea', props);
}
