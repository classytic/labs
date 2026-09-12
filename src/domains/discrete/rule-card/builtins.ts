import { COUNTING_RULES } from '../../../discrete/rules.js';
import { COMPLEX_RULES } from '../../../math/complex/rules.js';
import { TRIG_RULES } from '../../../math/trig/rules.js';
import type { RuleDef } from '../../../kit/rule.js';
import type { RulePresetId } from './presets.js';

/** Loaded only with the RuleCard runtime chunk, never by the catalog manifest. */
export const BUILTIN_RULES: RuleDef[] = [...COUNTING_RULES, ...TRIG_RULES, ...COMPLEX_RULES];

export function resolveBuiltinRule(preset?: RulePresetId): RuleDef | undefined {
  return preset && preset !== 'none' ? BUILTIN_RULES.find((rule) => rule.id === preset) : undefined;
}
