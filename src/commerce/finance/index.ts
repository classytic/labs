export { CompoundInterestLab, type CompoundInterestProps } from './compound-interest.js';
export { DepreciationLab, type DepreciationProps } from './depreciation.js';
export { BreakEvenLab, type BreakEvenProps } from './break-even.js';
export { ApportionLab, type ApportionProps, type ApportionPart } from './apportion.js';
export { WarehouseAllocationLab, type WarehouseAllocationProps, type Dept } from './warehouse-allocation.js';
export { ReorderPointLab, type ReorderPointProps } from './supply-chain.js';
export {
  simulateInventoryPolicy,
  type InventoryPolicyInput,
  type InventoryPolicyResult,
  type InventoryScenario,
} from './inventory-policy.js';
export { EOQLab, type EOQProps } from './eoq.js';
export { StatementBuilderLab, type StatementBuilderProps } from './statement-builder.js';
export { RatioLab, type RatioLabProps } from './ratio-lab.js';
export { LimitedCompanyLab, type LimitedCompanyProps } from './limited-company.js';
// The "run a business" story runner — creators author scenes; the bizsim engine keeps the books:
export { BusinessLesson, DEMO_SCENES, type BusinessLessonProps, type Scene } from './business-lesson.js';
