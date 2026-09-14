export { StatementLogicLab, DEFAULT_STATEMENT_ROUNDS, type StatementLogicProps, type StatementLogicMessages } from './preset.js';
export type {
  StatementClass,
  StatementChoice,
  StatementLogicRound,
  ClassifyStatementRound,
  TruthStatementRound,
  NegateStatementRound,
  ImplicationStatementRound,
  ImplicationWorld,
} from './core.js';
export { answerOptions, expectedAnswer, validateStatementRounds } from './core.js';
