// @classytic/labs/commerce, business-studies labs (accounting, economics…).
// Subpath groups the related commerce subjects; the simple double-entry core
// lives in ./accounting/core (NOT the heavy @classytic/ledger engine).
export {
  EquationBalanceLab, type EquationBalanceProps, type Transaction, type TxnEffect,
  JournalPosterLab, type JournalPosterProps, type JournalTxn,
  StatementSorterLab, type StatementSorterProps, type SortAccount,
  normalBalance, statementOf, debitsEqualCredits, equationParts, money, CATEGORY_COLOR,
  type Account, type AccountCategory, type Side,
} from './accounting/index.js';
export {
  MarketEquilibriumLab, type MarketEquilibriumProps,
  ElasticityRevenueLab, type ElasticityRevenueProps,
  DemandShiftVsMoveLab, type DemandShiftVsMoveProps, type Shifter,
  type Curve, demandP, supplyP, demandQ, supplyQ, equilibrium, pointElasticity,
} from './economics/index.js';
