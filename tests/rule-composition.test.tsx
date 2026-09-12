import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { calc } from '../src/kit/calc.js';
import { RuleCard, RuleLab, type RuleDef } from '../src/kit/rule.js';
import { TRIG_RULES } from '../src/math/trig/rules.js';
import { COUNTING_RULES } from '../src/discrete/rules.js';
import { COMPLEX_RULES } from '../src/math/complex/rules.js';

const RULE: RuleDef = {
  id: 'test-rule',
  name: 'One authored rule',
  formula: 'a+b=c',
  analogy: 'Join two known parts to get the whole.',
  inputs: [{ key: 'a', label: 'a', default: 2, min: 0, max: 9 }],
  compute: (values) => calc().step(`a=${values.a}`).step('c=5').done(5),
  derivation: [{ tex: 'a+b=c', note: 'definition' }],
  tricks: ['Check the inverse operation.'],
  challenge: [
    {
      id: 'predict',
      prompt: 'Which operation joins the parts?',
      choices: [
        { value: 'subtract', label: 'Subtract' },
        { value: 'add', label: 'Add' },
      ],
      answer: 'add',
      explain: 'Addition combines the parts.',
    },
  ],
};

describe('authorable rule composition', () => {
  it('keeps authored checkpoint answers reachable and ids unique', () => {
    const rules = [...TRIG_RULES, ...COUNTING_RULES, ...COMPLEX_RULES];
    const ids = rules.flatMap((rule) => (rule.challenge ?? []).map((question) => question.id));

    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of rules) {
      for (const question of rule.challenge ?? []) {
        expect(question.choices.some((choice) => choice.value === question.answer)).toBe(true);
        expect(question.choices.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('gives each visual rulebook entry a shared figure composition', () => {
    for (const rule of [...COUNTING_RULES, ...COMPLEX_RULES]) {
      expect(rule.figure, rule.id).toBeTruthy();
      const view = render(<RuleCard rule={rule} />);
      expect(view.container.querySelector('.rule-figure'), rule.id).not.toBeNull();
      view.unmount();
    }
  });

  it('includes omega as the geometric fourth complex rule', () => {
    expect(COMPLEX_RULES.map((rule) => rule.id)).toEqual(['i-powers', 'modulus', 'de-moivre', 'omega']);
  });

  it('renders one title, one control region and one support disclosure', () => {
    const view = render(<RuleLab rule={RULE} />);
    // The model is not mounted until the learner commits a prediction (no answer leak).
    fireEvent.click(screen.getByRole('radio', { name: 'Add' }));

    expect(view.container.querySelectorAll('.lab-activity-heading > h3')).toHaveLength(1);
    expect(view.container.querySelectorAll('.lab-title')).toHaveLength(0);
    expect(view.container.querySelectorAll('.rule-card-title')).toHaveLength(0);
    expect(view.container.querySelectorAll('.rule-card-controls')).toHaveLength(1);
    expect(view.container.querySelectorAll('.rule-card-support')).toHaveLength(1);
    expect(view.container.querySelectorAll('.lab-challenge')).toHaveLength(1);
  });

  it('unlocks exploration after a prediction and exposes completion feedback', () => {
    const view = render(<RuleLab rule={RULE} />);
    const model = view.container.querySelector('.lab-predict-body');

    expect(model?.hasAttribute('data-locked')).toBe(true);
    fireEvent.click(screen.getByRole('radio', { name: 'Add' }));
    expect(model?.hasAttribute('data-locked')).toBe(false);
    expect(screen.getByRole('status').textContent).toContain('Correct');
  });

  it('keeps compact RuleCard embeds free of assessment and duplicate shell UI', () => {
    const view = render(<RuleCard rule={RULE} />);

    expect(view.container.querySelectorAll('.rule-card-title')).toHaveLength(1);
    expect(view.container.querySelector('.lab-challenge')).toBeNull();
    expect(view.container.querySelector('.lab-frame')).toBeNull();
  });
});
