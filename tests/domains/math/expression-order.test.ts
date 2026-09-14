import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPRESSION_ORDER_ROUNDS, expressionValue, validateExpressionOrderRounds } from '../../../src/math/expression-order/core.js';

describe('expression order', () => {
  it.each([['24/6*2',8],['10-3+2',9],['2^(3^2)',512],['-(2^2)',-4],['(-2)^2',4]])('evaluates %s as %s', (expression, expected) => expect(expressionValue(expression)).toBe(expected));
  it('keeps every authored reduction equivalent', () => expect(validateExpressionOrderRounds(DEFAULT_EXPRESSION_ORDER_ROUNDS)).toEqual([]));
  it('rejects a reduction that changes value', () => expect(validateExpressionOrderRounds([{ ...DEFAULT_EXPRESSION_ORDER_ROUNDS[0]!, steps:[{ expression:'12', rule:'Wrong' }] }])[0]).toContain('changes'));

  // Each of these five distractors is a documented reading, not a slip: BODMAS spells M before D
  // and A before S, and power towers resolve the opposite way to the left-to-right habit. A round
  // that cannot say which reading the learner used has nothing to correct.
  it('makes every authored distractor name the reading behind it', () => {
    for (const round of DEFAULT_EXPRESSION_ORDER_ROUNDS) {
      for (const choice of round.choices) {
        if (choice.value === round.answer) continue;
        expect(choice.feedback, `${round.id} / ${choice.label}`).toBeTruthy();
        expect(choice.feedback!.length, `${round.id} / ${choice.label}`).toBeGreaterThan(40);
      }
    }
  });

  it('refuses a round whose distractor explains nothing', () => {
    const round = DEFAULT_EXPRESSION_ORDER_ROUNDS[0]!;
    const stripped = { ...round, choices: round.choices.map((choice) => ({ ...choice, feedback: undefined })) };
    expect(validateExpressionOrderRounds([stripped]).join(' ')).toContain('does not say what picking it means');
  });
});
