/** GENERATED — real-schema biology authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import cellEnergy from '../biology/cell-energy/manifest.js';
import cellSystem from '../biology/cell-system/manifest.js';
import centralDogma from '../biology/central-dogma/manifest.js';
import enzymeRate from '../biology/enzyme-rate/manifest.js';
import geneticCross from '../biology/genetic-cross/manifest.js';
import meiosisExplorer from '../biology/meiosis-explorer/manifest.js';
import membraneTransport from '../biology/membrane-transport/manifest.js';
import mitosisExplorer from '../biology/mitosis-explorer/manifest.js';
import photosynthesisFactors from '../biology/photosynthesis-factors/manifest.js';
import punnettCross from '../biology/punnett-cross/manifest.js';
import respiration from '../biology/respiration/manifest.js';
import sequence from '../biology/sequence/manifest.js';
import sexLinkedCross from '../biology/sex-linked-cross/manifest.js';

export const blocks = [cellEnergy, cellSystem, centralDogma, enzymeRate, geneticCross, meiosisExplorer, membraneTransport, mitosisExplorer, photosynthesisFactors, punnettCross, respiration, sequence, sexLinkedCross].map(manifestToBlock);
