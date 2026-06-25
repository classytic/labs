'use client';

/**
 * RichText — render `_`/`^` notation as real HTML <sub>/<sup> in lab readouts /
 * control bars (the DOM counterpart of stage's SVG `<Label>`). Both share the
 * ONE grammar, `parseRichText` from @classytic/stage — so "V_C" never reads as a
 * dirty underscore and the parsing rule lives in a single source of truth.
 */

import { Fragment, type ReactNode } from 'react';
import { parseRichText } from '@classytic/stage';

export function RichText({ children }: { children: string }): ReactNode {
  const spans = parseRichText(children);
  if (spans.length === 1 && spans[0]!.script === 'base') return children; // fast path
  return (
    <>
      {spans.map((sp, i) =>
        sp.script === 'sub' ? <sub key={i}>{sp.text}</sub>
        : sp.script === 'sup' ? <sup key={i}>{sp.text}</sup>
        : <Fragment key={i}>{sp.text}</Fragment>,
      )}
    </>
  );
}
