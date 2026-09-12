'use client';

/** Rule-card runtime — adapter: resolve a built-in rule by preset, else assemble a
 *  custom RuleDef from the authored fields, then render the concept card. */
import type { ReactNode } from 'react';
import { RuleLab, type RuleDef } from '../../../kit/rule.js';
import { resolveBuiltinRule } from './builtins.js';
import type { RulePresetId } from './presets.js';

type RuleAttrs = {
  preset?: RulePresetId;
  name?: string;
  formula?: string;
  analogy?: string;
  tricks?: string[];
  derivation?: { tex: string; note?: string }[];
  challenge?: {
    prompt: string;
    choices: { value: string; label: string }[];
    answer: string;
    explain?: string;
  };
  title?: string;
  prompt?: string;
};

export default function RuleCard(a: RuleAttrs): ReactNode {
  const preset = a.preset ?? (!a.name && !a.formula ? 'rule-of-product' : undefined);
  const builtin = resolveBuiltinRule(preset);
  const rule: RuleDef = builtin ?? {
    id: 'custom',
    name: a.name ?? 'Rule',
    formula: a.formula ?? 'a^2 + b^2 = c^2',
    ...(a.analogy ? { analogy: a.analogy } : {}),
    ...(a.derivation?.length ? { derivation: a.derivation } : {}),
    ...(a.tricks?.length ? { tricks: a.tricks } : {}),
    ...(a.challenge ? { challenge: [{ id: 'custom-rule-prediction', ...a.challenge }] } : {}),
  };
  return <RuleLab rule={rule} title={a.title} prompt={a.prompt} />;
}
