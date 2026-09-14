import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { divisionModel, normalizeDivision, writtenDivisionSteps } from '../../../../src/math/division-workbench/core.js';
import { DivisionWorkbenchLab } from '../../../../src/math/division-workbench/preset.js';

describe('division workbench', () => {
  it('normalizes decimals without changing the ratio', () => expect(normalizeDivision(12.6,0.3)).toEqual({ normalizedDividend:126, normalizedDivisor:3, scale:10 }));
  it('produces exact quotient and remainder', () => expect(divisionModel(157,4)).toMatchObject({ integerQuotient:39, remainder:1, quotient:39.25 }));
  it('records deterministic written steps', () => expect(writtenDivisionSteps(156,4).map(s => [s.quotientDigit,s.remainder])).toEqual([[0,1],[3,3],[9,0]]));
  it.each(['share','written','decimal'] as const)('renders %s on the server', mode => expect(renderToStaticMarkup(<DivisionWorkbenchLab mode={mode} />)).toContain('Division workbench'));
});
