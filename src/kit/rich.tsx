'use client';

/**
 * RichText, render `_`/`^` notation as real HTML <sub>/<sup> in lab readouts /
 * control bars (the DOM counterpart of stage's SVG `<Label>`). Both share the
 * ONE grammar, `parseRichText` from @classytic/stage, so "V_C" never reads as a
 * dirty underscore and the parsing rule lives in a single source of truth.
 */

import { Fragment, type ReactNode } from 'react';
import { parseRichText } from '@classytic/stage';

/**
 * Accept `^(2x)` as well as `^{2x}`.
 *
 * The grammar takes one character (`2^x`) or a braced group (`2^{2x}`). Nobody writing maths in
 * an authoring field reaches for braces: they type `2^(2x)`, because that is how an exponent is
 * written in plain text everywhere else. The grammar found no group, left the whole run as base
 * text, and an exam stem rendered as the literal string `2^(2x) - 5(2^x) + 4 = 0` with a caret in
 * it. Rewriting the parentheses to braces here fixes every lab at once and keeps the grammar
 * itself in stage, where labs must not reach in and change it.
 *
 * Parentheses are matched by depth, so `2^((a+b)c)` survives, and an unbalanced `x^(` is left
 * exactly as typed rather than swallowing the rest of the line.
 */
const bracesForParens = (text: string): string => {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const marker = text[i];
    if ((marker !== '^' && marker !== '_') || text[i + 1] !== '(') {
      out += marker;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let j = i + 1; j < text.length; j += 1) {
      if (text[j] === '(') depth += 1;
      else if (text[j] === ')') {
        depth -= 1;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (end < 0) {
      out += marker;
      continue;
    }
    out += `${marker}{${text.slice(i + 2, end)}}`;
    i = end;
  }
  return out;
};

export function RichText({ children }: { children: string }): ReactNode {
  const spans = parseRichText(bracesForParens(children));
  if (spans.length === 1 && spans[0]!.script === 'base') return children; // fast path
  return (
    <>
      {spans.map((sp, i) =>
        sp.script === 'sub' ? (
          <sub key={i}>{sp.text}</sub>
        ) : sp.script === 'sup' ? (
          <sup key={i}>{sp.text}</sup>
        ) : (
          <Fragment key={i}>{sp.text}</Fragment>
        ),
      )}
    </>
  );
}
