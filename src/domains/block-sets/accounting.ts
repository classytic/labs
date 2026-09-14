/** GENERATED — real-schema accounting authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import apportion from '../accounting/apportion/manifest.js';
import bankReconciliation from '../accounting/bank-reconciliation/manifest.js';
import breakEven from '../accounting/break-even/manifest.js';
import businessLesson from '../accounting/business-lesson/manifest.js';
import compoundInterest from '../accounting/compound-interest/manifest.js';
import controlAccountBuilder from '../accounting/control-account-builder/manifest.js';
import depreciation from '../accounting/depreciation/manifest.js';
import eoq from '../accounting/eoq/manifest.js';
import equationBalance from '../accounting/equation-balance/manifest.js';
import journalPoster from '../accounting/journal-poster/manifest.js';
import limitedCompany from '../accounting/limited-company/manifest.js';
import ratioLab from '../accounting/ratio-lab/manifest.js';
import reorderPoint from '../accounting/reorder-point/manifest.js';
import statementBuilder from '../accounting/statement-builder/manifest.js';
import statementSorter from '../accounting/statement-sorter/manifest.js';
import warehouseAllocation from '../accounting/warehouse-allocation/manifest.js';

export const blocks = [apportion, bankReconciliation, breakEven, businessLesson, compoundInterest, controlAccountBuilder, depreciation, eoq, equationBalance, journalPoster, limitedCompany, ratioLab, reorderPoint, statementBuilder, statementSorter, warehouseAllocation].map(manifestToBlock);
