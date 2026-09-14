import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RichText } from '../src/kit/rich.js';

/**
 * The grammar in stage takes one character (`2^x`) or a braced group (`2^{2x}`). Nobody authoring
 * maths types braces: they write `2^(2x)`, the way an exponent is written in plain text
 * everywhere else. That found no group, left the run as base text, and a Cambridge 4037 exam stem
 * rendered on screen as the literal `2^(2x) - 5(2^x) + 4 = 0`, carets and all.
 */
describe('RichText', () => {
  const supsOf = (text: string): string[] => {
    const view = render(<RichText>{text}</RichText>);
    const out = [...view.container.querySelectorAll('sup')].map((el) => el.textContent ?? '');
    view.unmount();
    return out;
  };
  const subsOf = (text: string): string[] => {
    const view = render(<RichText>{text}</RichText>);
    const out = [...view.container.querySelectorAll('sub')].map((el) => el.textContent ?? '');
    view.unmount();
    return out;
  };

  it('raises a parenthesised exponent, the way an author actually types one', () => {
    expect(supsOf('2^(2x)')).toEqual(['2x']);
    expect(supsOf('Solve 2^(2x) - 5(2^x) + 4 = 0.')).toEqual(['2x', 'x']);
  });

  it('still honours the forms the grammar already took', () => {
    expect(supsOf('2^x')).toEqual(['x']);
    expect(supsOf('2^{2x}')).toEqual(['2x']);
    expect(subsOf('V_C')).toEqual(['C']);
    expect(subsOf('x_(n+1)')).toEqual(['n+1']);
  });

  it('counts nested parentheses rather than stopping at the first close', () => {
    expect(supsOf('2^((a+b)c)')).toEqual(['(a+b)c']);
  });

  // An unbalanced caret is a typo, and swallowing the rest of the line would hide it.
  it('leaves an unclosed group exactly as typed', () => {
    const view = render(<RichText>{'x^(2'}</RichText>);
    expect(view.container.textContent).toBe('x^(2');
    expect(view.container.querySelector('sup')).toBeNull();
  });
});
