import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BUILTIN_RULES, resolveBuiltinRule } from '../src/domains/discrete/rule-card/builtins.js';
import ruleCardManifest from '../src/domains/discrete/rule-card/manifest.js';
import { RULE_PRESET_IDS } from '../src/domains/discrete/rule-card/presets.js';
import RuleCardRuntime from '../src/domains/discrete/rule-card/runtime.js';

describe('rule-card authoring registry', () => {
  it('keeps lightweight preset ids aligned with every lazy builtin', () => {
    const ids = BUILTIN_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(RULE_PRESET_IDS.slice(1)).toEqual(ids);
    for (const id of RULE_PRESET_IDS.slice(1)) {
      expect(resolveBuiltinRule(id)?.id).toBe(id);
    }
  });

  it('accepts omega through the authored manifest and resolves its full activity', () => {
    expect(ruleCardManifest.schema.parse({ preset: 'omega' }).preset).toBe('omega');
    const view = render(<RuleCardRuntime preset="omega" />);
    expect(view.container.querySelector('.lab-activity-heading > h3')?.textContent).toContain('Omega');
    expect(view.container.querySelector('.lab-challenge')).not.toBeNull();
    // The figure mounts only after a prediction is committed (predict-first, no answer leak).
    expect(view.container.querySelector('.rule-figure')).toBeNull();
    fireEvent.click(screen.getAllByRole('radio')[0]!);
    expect(view.container.querySelector('.rule-figure')).not.toBeNull();
  });

  it('uses a visual-proof prompt for static figures instead of calculator copy', () => {
    const view = render(<RuleCardRuntime preset="omega" />);
    const prompt = view.container.querySelector('.lab-activity-description')?.textContent ?? '';
    expect(prompt).toContain('visual model as a proof');
    expect(prompt).not.toContain('Plug in numbers');
  });
});
