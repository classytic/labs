/** GENERATED — real-schema statistics authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import centerSpread from '../statistics/center-spread/manifest.js';
import frequencyDensity from '../statistics/frequency-density/manifest.js';
import galton from '../statistics/galton/manifest.js';
import histogram from '../statistics/histogram/manifest.js';
import normal from '../statistics/normal/manifest.js';
import ogive from '../statistics/ogive/manifest.js';
import sampling from '../statistics/sampling/manifest.js';
import series from '../statistics/series/manifest.js';
import zTable from '../statistics/z-table/manifest.js';

export const blocks = [centerSpread, frequencyDensity, galton, histogram, normal, ogive, sampling, series, zTable].map(manifestToBlock);
