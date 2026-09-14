import { compileExpr, toLatex } from '@classytic/stage';

export interface ExpressionOrderChoice {
  value: string;
  label: string;
  /**
   * What picking this option means, named back to the learner.
   *
   * Each distractor here is a specific and extremely common reading, not a slip: BODMAS spells M
   * before D and A before S, so treating them as ranks rather than as one level is what the
   * mnemonic itself teaches. Saying "not quite" to that leaves the learner with the same rule they
   * came in with. Naming the reading is the correction.
   */
  feedback?: string;
}

export interface ExpressionOrderStep {
  expression: string;
  rule: string;
}

export interface ExpressionOrderRound {
  id: string;
  expression: string;
  prompt: string;
  choices: ExpressionOrderChoice[];
  answer: string;
  steps: ExpressionOrderStep[];
}

export function expressionValue(expression: string): number {
  const compiled = compileExpr(expression);
  return compiled.error === undefined ? compiled.fn({}) : Number.NaN;
}

export function expressionLatex(expression: string): string {
  const compiled = compileExpr(expression);
  return compiled.error === undefined && compiled.ast ? toLatex(compiled.ast) : expression;
}

export function validateExpressionOrderRounds(rounds: ExpressionOrderRound[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  rounds.forEach((round, index) => {
    const at = `Round ${index + 1}`;
    if (!round.id || ids.has(round.id)) issues.push(`${at} needs a unique id.`);
    ids.add(round.id);
    if (round.choices.length < 2 || round.choices.length > 4) issues.push(`${at} needs two to four choices.`);
    if (!round.choices.some((choice) => choice.value === round.answer)) issues.push(`${at} answer is not one of its choices.`);
    // A distractor is a claim about how someone read the expression. If it cannot say what that
    // reading was, it is just a wrong button, and the learner leaves holding the same rule.
    for (const choice of round.choices) {
      if (choice.value !== round.answer && !choice.feedback?.trim()) {
        issues.push(`${at} distractor "${choice.label}" does not say what picking it means.`);
      }
    }
    const startValue = expressionValue(round.expression);
    if (!Number.isFinite(startValue)) issues.push(`${at} has an invalid starting expression.`);
    if (round.steps.length === 0) issues.push(`${at} needs at least one reduction step.`);
    round.steps.forEach((step, stepIndex) => {
      const value = expressionValue(step.expression);
      if (!Number.isFinite(value)) issues.push(`${at}, step ${stepIndex + 1}, has an invalid expression.`);
      if (Number.isFinite(startValue) && Number.isFinite(value) && Math.abs(value - startValue) > 1e-9) {
        issues.push(`${at}, step ${stepIndex + 1}, changes the expression's value.`);
      }
    });
  });
  return issues;
}

export const DEFAULT_EXPRESSION_ORDER_ROUNDS: ExpressionOrderRound[] = [
  {
    id: 'multiply-divide-left', expression: '24/6*2', prompt: 'Which operation must happen first?',
    choices: [
      { value: 'divide', label: '24 ÷ 6', feedback: 'Yes. Same level, so the leftmost one goes first.' },
      { value: 'multiply', label: '6 × 2', feedback: 'BODMAS spells M before D, so this is the reading the mnemonic itself suggests. They are one level, not two: × and ÷ rank equally, so the leftmost goes first. Taking 6 × 2 first gives 2; working left to right gives 8.' },
    ], answer: 'divide',
    steps: [{ expression: '4*2', rule: 'Multiplication and division share a level, so work left to right.' }, { expression: '8', rule: 'Multiply the remaining factors.' }],
  },
  {
    id: 'add-subtract-left', expression: '10-3+2', prompt: 'Which operation must happen first?',
    choices: [
      { value: 'subtract', label: '10 − 3', feedback: 'Yes. Same level again, so the leftmost one goes first.' },
      { value: 'add', label: '3 + 2', feedback: 'The A sits before the S in BODMAS, so addition looks like the higher rank. It is the same single level as before: 10 − 3 goes first because it is further left. Adding first gives 5; working left to right gives 9.' },
    ], answer: 'subtract',
    steps: [{ expression: '7+2', rule: 'Addition and subtraction share a level, so work left to right.' }, { expression: '9', rule: 'Add the remaining terms.' }],
  },
  {
    id: 'power-association', expression: '2^(3^2)', prompt: 'Which power is evaluated first?',
    choices: [
      { value: 'inner', label: '3²', feedback: 'Yes. The exponent is settled first, so this is 2⁹ = 512.' },
      { value: 'outer', label: '2³', feedback: 'Left to right is the right habit for × and ÷, and it is the reason this one catches people. Powers stack the other way: the exponent is worked out first, so this is 2⁹ = 512, not 8² = 64.' },
    ], answer: 'inner',
    steps: [{ expression: '2^9', rule: 'A power in the exponent is resolved before the outer power.' }, { expression: '512', rule: 'Now evaluate the remaining power.' }],
  },
  {
    id: 'negative-power', expression: '-(2^2)', prompt: 'What is squared here?',
    choices: [
      { value: 'two', label: 'Only 2', feedback: 'Yes. Square the 2, then apply the minus: −4.' },
      { value: 'negative-two', label: 'The whole −2', feedback: 'The minus looks like it belongs to the number, which is how we read −2 everywhere else. Here the brackets hold only the 2, so the squaring happens first and the minus is applied to the result: −4, not 4. Compare it with the next one.' },
    ], answer: 'two',
    steps: [{ expression: '-4', rule: 'The exponent applies before the leading negative sign.' }],
  },
  {
    id: 'grouped-negative', expression: '(-2)^2', prompt: 'What is squared here?',
    choices: [
      { value: 'group', label: 'The grouped −2', feedback: 'Yes. (−2) × (−2) = 4. The brackets made the sign part of the base.' },
      { value: 'two', label: 'Only 2', feedback: 'That was the right reading for −(2²), and the brackets have moved. Here they wrap the sign as well, so −2 is the whole base: (−2) × (−2) = 4. The two expressions differ only in where the brackets sit, and they give −4 and 4.' },
    ], answer: 'group',
    steps: [{ expression: '4', rule: 'Parentheses make −2 the complete base of the power.' }],
  },
];
