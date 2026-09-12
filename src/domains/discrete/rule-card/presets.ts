/** Lightweight preset contract shared by the manifest/editor and lazy runtime.
 * Keep this file data-only: importing the block catalog must not pull rule figures. */
export const RULE_PRESET_IDS = [
  'none',
  'rule-of-product',
  'rule-of-sum',
  'factorial',
  'permutation',
  'combination',
  'perm-with-rep',
  'cast',
  'exact-values',
  'pythagorean',
  'deg-rad',
  'i-powers',
  'modulus',
  'de-moivre',
  'omega',
] as const;

export type RulePresetId = (typeof RULE_PRESET_IDS)[number];
