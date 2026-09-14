import { compileExpr, toLatex } from '@classytic/stage';

export interface ExpressionOrderChoice {
  value: string;
  label: string;
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
    choices: [{ value: 'divide', label: '24 ÷ 6' }, { value: 'multiply', label: '6 × 2' }], answer: 'divide',
    steps: [{ expression: '4*2', rule: 'Multiplication and division share a level, so work left to right.' }, { expression: '8', rule: 'Multiply the remaining factors.' }],
  },
  {
    id: 'add-subtract-left', expression: '10-3+2', prompt: 'Which operation must happen first?',
    choices: [{ value: 'subtract', label: '10 − 3' }, { value: 'add', label: '3 + 2' }], answer: 'subtract',
    steps: [{ expression: '7+2', rule: 'Addition and subtraction share a level, so work left to right.' }, { expression: '9', rule: 'Add the remaining terms.' }],
  },
  {
    id: 'power-association', expression: '2^(3^2)', prompt: 'Which power is evaluated first?',
    choices: [{ value: 'inner', label: '3²' }, { value: 'outer', label: '2³' }], answer: 'inner',
    steps: [{ expression: '2^9', rule: 'A power in the exponent is resolved before the outer power.' }, { expression: '512', rule: 'Now evaluate the remaining power.' }],
  },
  {
    id: 'negative-power', expression: '-(2^2)', prompt: 'What is squared here?',
    choices: [{ value: 'two', label: 'Only 2' }, { value: 'negative-two', label: 'The whole −2' }], answer: 'two',
    steps: [{ expression: '-4', rule: 'The exponent applies before the leading negative sign.' }],
  },
  {
    id: 'grouped-negative', expression: '(-2)^2', prompt: 'What is squared here?',
    choices: [{ value: 'group', label: 'The grouped −2' }, { value: 'two', label: 'Only 2' }], answer: 'group',
    steps: [{ expression: '4', rule: 'Parentheses make −2 the complete base of the power.' }],
  },
];
