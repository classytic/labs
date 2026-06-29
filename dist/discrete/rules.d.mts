import { Worked } from "../kit/calc.mjs";
import { RuleDef } from "../kit/rule.mjs";

//#region src/discrete/rules.d.ts
declare function explainFactorial(n: number): Worked;
declare function explainNPr(n: number, r: number): Worked;
declare function explainNCr(n: number, r: number): Worked;
declare function explainProduct(stages: number[]): Worked;
declare function explainSum(cases: number[]): Worked;
declare function explainPermWithRep(n: number, r: number): Worked;
declare const PRODUCT_RULE: RuleDef;
declare const SUM_RULE: RuleDef;
declare const FACTORIAL_RULE: RuleDef;
declare const PERMUTATION_RULE: RuleDef;
declare const COMBINATION_RULE: RuleDef;
declare const PERM_REP_RULE: RuleDef;
/** The full counting rulebook, in teaching order, for a gallery / rulebook lab. */
declare const COUNTING_RULES: RuleDef[];
//#endregion
export { COMBINATION_RULE, COUNTING_RULES, FACTORIAL_RULE, PERMUTATION_RULE, PERM_REP_RULE, PRODUCT_RULE, SUM_RULE, explainFactorial, explainNCr, explainNPr, explainPermWithRep, explainProduct, explainSum };