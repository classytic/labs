/** GENERATED — real-schema circuits authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import bjtInside from '../circuits/bjt-inside/manifest.js';
import brownout from '../circuits/brownout/manifest.js';
import capacitorLeak from '../circuits/capacitor-leak/manifest.js';
import circuit from '../circuits/circuit/manifest.js';
import circuitBuilder from '../circuits/circuit-builder/manifest.js';
import circuitLab from '../circuits/circuit-lab/manifest.js';
import circuitScene from '../circuits/circuit-scene/manifest.js';
import cmosInverter from '../circuits/cmos-inverter/manifest.js';
import cmosNand from '../circuits/cmos-nand/manifest.js';
import cmosNor from '../circuits/cmos-nor/manifest.js';
import conduction from '../circuits/conduction/manifest.js';
import diode from '../circuits/diode/manifest.js';
import hallEffect from '../circuits/hall-effect/manifest.js';
import mosfetInside from '../circuits/mosfet-inside/manifest.js';
import pnJunction from '../circuits/pn-junction/manifest.js';
import rcCharging from '../circuits/rc-charging/manifest.js';
import rnmosNot from '../circuits/rnmos-not/manifest.js';
import siliconLattice from '../circuits/silicon-lattice/manifest.js';
import transistor from '../circuits/transistor/manifest.js';

export const blocks = [bjtInside, brownout, capacitorLeak, circuit, circuitBuilder, circuitLab, circuitScene, cmosInverter, cmosNand, cmosNor, conduction, diode, hallEffect, mosfetInside, pnJunction, rcCharging, rnmosNot, siliconLattice, transistor].map(manifestToBlock);
