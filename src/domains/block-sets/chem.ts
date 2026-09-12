/** GENERATED — real-schema chem authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import atomicOrbital from '../chem/atomic-orbital/manifest.js';
import battery from '../chem/battery/manifest.js';
import bohrAtom from '../chem/bohr-atom/manifest.js';
import crystalLattice from '../chem/crystal-lattice/manifest.js';
import dilution from '../chem/dilution/manifest.js';
import electrochem from '../chem/electrochem/manifest.js';
import gasBox from '../chem/gas-box/manifest.js';
import kinetics from '../chem/kinetics/manifest.js';
import leChatelier from '../chem/le-chatelier/manifest.js';
import molecularGeometry from '../chem/molecular-geometry/manifest.js';
import orbitalOverlap from '../chem/orbital-overlap/manifest.js';
import periodicTrends from '../chem/periodic-trends/manifest.js';
import reactionLab from '../chem/reaction-lab/manifest.js';
import reactionProfile from '../chem/reaction-profile/manifest.js';
import solutionBox from '../chem/solution-box/manifest.js';
import stereochemistry from '../chem/stereochemistry/manifest.js';
import stoichiometry from '../chem/stoichiometry/manifest.js';
import titration from '../chem/titration/manifest.js';

export const blocks = [atomicOrbital, battery, bohrAtom, crystalLattice, dilution, electrochem, gasBox, kinetics, leChatelier, molecularGeometry, orbitalOverlap, periodicTrends, reactionLab, reactionProfile, solutionBox, stereochemistry, stoichiometry, titration].map(manifestToBlock);
