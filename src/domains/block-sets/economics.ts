/** GENERATED — real-schema economics authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import demandShiftVsMove from '../economics/demand-shift-vs-move/manifest.js';
import elasticityRevenue from '../economics/elasticity-revenue/manifest.js';
import marketEquilibrium from '../economics/market-equilibrium/manifest.js';

export const blocks = [demandShiftVsMove, elasticityRevenue, marketEquilibrium].map(manifestToBlock);
