// @classytic/labs/commerce, business-studies labs (accounting, economics…).
// Subpath groups the related commerce subjects; the simple double-entry core
// lives in ./accounting/core (NOT the heavy @classytic/ledger engine).
export {
  EvidencePanel,
  MetricList,
  DecisionDeck,
  ScenarioTimeline,
  LedgerTable,
  type MetricItem,
  type DecisionOption,
} from './activity.js';
export {
  EquationBalanceLab,
  type EquationBalanceProps,
  type Transaction,
  type TxnEffect,
  JournalPosterLab,
  type JournalPosterProps,
  type JournalTxn,
  StatementSorterLab,
  type StatementSorterProps,
  type SortAccount,
  normalBalance,
  statementOf,
  debitsEqualCredits,
  equationParts,
  money,
  CATEGORY_COLOR,
  type Account,
  type AccountCategory,
  type Side,
} from './accounting/index.js';
// Finance (on the @classytic/stage/finance kernel; curriculum-neutral, authorable):
export { CompoundInterestLab, type CompoundInterestProps } from './finance/index.js';
export { DepreciationLab, type DepreciationProps } from './finance/index.js';
export { BreakEvenLab, type BreakEvenProps } from './finance/index.js';
export { ApportionLab, type ApportionProps, type ApportionPart } from './finance/index.js';
export { WarehouseAllocationLab, type WarehouseAllocationProps, type Dept } from './finance/index.js';
export { ReorderPointLab, type ReorderPointProps } from './finance/index.js';
export {
  simulateInventoryPolicy,
  type InventoryPolicyInput,
  type InventoryPolicyResult,
  type InventoryScenario,
} from './finance/index.js';
export { EOQLab, type EOQProps } from './finance/index.js';
export { StatementBuilderLab, type StatementBuilderProps } from './finance/index.js';
export { RatioLab, type RatioLabProps } from './finance/index.js';
export { LimitedCompanyLab, type LimitedCompanyProps } from './finance/index.js';
export { BusinessLesson, DEMO_SCENES, type BusinessLessonProps, type Scene } from './finance/index.js';
export {
  MarketEquilibriumLab,
  type MarketEquilibriumProps,
  ElasticityRevenueLab,
  type ElasticityRevenueProps,
  DemandShiftVsMoveLab,
  type DemandShiftVsMoveProps,
  type Shifter,
  type Curve,
  demandP,
  supplyP,
  demandQ,
  supplyQ,
  equilibrium,
  pointElasticity,
} from './economics/index.js';
