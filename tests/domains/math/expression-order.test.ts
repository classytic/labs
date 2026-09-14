import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPRESSION_ORDER_ROUNDS, expressionValue, validateExpressionOrderRounds } from '../../../src/math/expression-order/core.js';

describe('expression order', () => {
  it.each([['24/6*2',8],['10-3+2',9],['2^(3^2)',512],['-(2^2)',-4],['(-2)^2',4]])('evaluates %s as %s', (expression, expected) => expect(expressionValue(expression)).toBe(expected));
  it('keeps every authored reduction equivalent', () => expect(validateExpressionOrderRounds(DEFAULT_EXPRESSION_ORDER_ROUNDS)).toEqual([]));
  it('rejects a reduction that changes value', () => expect(validateExpressionOrderRounds([{ ...DEFAULT_EXPRESSION_ORDER_ROUNDS[0]!, steps:[{ expression:'12', rule:'Wrong' }] }])[0]).toContain('changes'));
});
