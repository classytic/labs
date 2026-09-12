import type { LabPathway } from './types.js';

/**
 * How a piece of sand becomes a switch, and how switches become logic.
 *
 * This chapter is the bridge between the circuits course and the digital logic course. It
 * runs down the abstraction ladder to the carriers themselves, then climbs back up: doped
 * silicon, a junction that conducts one way, a junction whose channel is controlled by a
 * third terminal, and finally four transistors behaving as a NAND gate. By the last step
 * the learner has seen the same NAND from both ends, as silicon and as a symbol.
 *
 * Every device view is driven by the deterministic carrier engine, and every schematic is
 * solved by the nonlinear circuit engine, so the two halves agree.
 */
export const electronicDevicesPathway: LabPathway = {
  id: 'electronic-devices',
  title: 'Electronic devices: how a piece of sand becomes a switch',
  description:
    'Go inside the crystal to see why doping creates carriers, why a junction conducts in only one direction, and how a third terminal takes control of a channel. Finish by watching four transistors become the universal logic gate.',
  domain: 'circuits',
  grades: ['12', 'undergraduate'],
  estimatedMinutes: 240,
  modules: [
    {
      id: 'inside-the-crystal',
      title: 'Inside the crystal',
      summary:
        'Pure silicon is a poor conductor. Adding a controlled impurity is what makes electronics possible.',
      outcomes: [
        'Explain why a full covalent lattice conducts poorly',
        'Distinguish n-type and p-type doping by which carrier each one adds',
        'Use the sign of a Hall voltage to identify the carrier type in a sample',
      ],
    },
    {
      id: 'one-way-valve',
      title: 'The one-way valve',
      summary: 'Join p to n and the carriers themselves build a barrier that only forward bias can lower.',
      outcomes: [
        'Explain the depletion region as fixed ions left behind by diffusion',
        'Predict how forward and reverse bias change the barrier width',
        'Read the knee of a diode curve as the point where the barrier gives way',
      ],
    },
    {
      id: 'controlled-valve',
      title: 'The valve someone else controls',
      summary:
        'A third terminal that steers a large current is the single idea behind all of modern computing.',
      outcomes: [
        'Describe how gate voltage inverts a channel and connects source to drain',
        'Contrast field control in a MOSFET with current control in a BJT',
        'Locate threshold voltage on a measured transfer curve',
      ],
    },
    {
      id: 'device-to-logic',
      title: 'From device to logic',
      summary:
        'Arrange transistors so the output is forced high or low, and a physical device becomes a Boolean one.',
      outcomes: [
        'Explain why a resistor pull-up inverter wastes static power and CMOS does not',
        'Trace which transistors conduct for each input combination of a NAND',
        'Predict what happens to logic levels when the supply rail sags',
      ],
    },
  ],
  steps: [
    {
      id: 'silicon-lattice',
      module: 'inside-the-crystal',
      tag: 'SiliconLattice',
      title: 'Pure silicon, then a deliberate impurity',
      purpose:
        'Break one bond in a covalent lattice, add a donor or an acceptor, and watch a free carrier appear where it physically comes from.',
    },
    {
      id: 'hall-effect',
      module: 'inside-the-crystal',
      tag: 'HallEffect',
      title: 'Which carrier is actually moving',
      purpose:
        'Deflect carriers with a magnetic field and read the sign of the transverse voltage, the measurement that settles electrons against holes.',
    },
    {
      id: 'pn-junction',
      module: 'one-way-valve',
      tag: 'PnJunction',
      title: 'Inside the diode',
      purpose:
        'Sweep the bias and watch the depletion region widen and narrow, with the fixed ions left in place.',
    },
    {
      id: 'diode',
      module: 'one-way-valve',
      tag: 'Diode',
      title: 'The curve that valve produces',
      purpose:
        'Meet the forward knee and the reverse block on a solved current-voltage curve with a live operating point.',
    },
    {
      id: 'mosfet-inside',
      module: 'controlled-valve',
      tag: 'MosfetInside',
      title: 'Inverting a channel with a field',
      purpose:
        'Raise the gate voltage until an inversion layer bridges source and drain, and see conduction begin exactly at threshold.',
    },
    {
      id: 'transistor',
      module: 'controlled-valve',
      tag: 'Transistor',
      title: 'A small input steering a big current',
      purpose: 'Drive a lamp through a MOSFET and read the transfer curve swept through the circuit engine.',
    },
    {
      id: 'bjt-inside',
      module: 'controlled-valve',
      tag: 'BjtInside',
      title: 'The other kind of control',
      purpose:
        'Watch carriers cross a thin base, with only a sliver recombining, to see why a small base current commands a large collector current.',
    },
    {
      id: 'rnmos-not',
      module: 'device-to-logic',
      tag: 'RNmosNot',
      title: 'Inversion from one transistor',
      purpose:
        'Build a NOT gate with a pull-up resistor, then measure the power it wastes while the output is low. This is the motivation for CMOS.',
    },
    {
      id: 'cmos-inverter',
      module: 'device-to-logic',
      tag: 'CmosInverter',
      title: 'Two transistors, no wasted power',
      purpose:
        'Pair a PMOS pull-up with an NMOS pull-down and watch the solved output snap through the transition.',
    },
    {
      id: 'cmos-nand',
      module: 'device-to-logic',
      tag: 'CmosNand',
      title: 'Four transistors become a universal gate',
      purpose:
        'Series pull-down, parallel pull-up, solved for every input combination. The same NAND the digital logic course is built on.',
    },
    {
      id: 'cmos-nor',
      module: 'device-to-logic',
      tag: 'CmosNor',
      title: 'The De Morgan twin',
      purpose:
        'Swap series for parallel and get the other universal gate, making the duality physical rather than notational.',
    },
    {
      id: 'brownout',
      module: 'device-to-logic',
      tag: 'Brownout',
      title: 'When the supply is too low to mean anything',
      purpose:
        'Drop the rail until the output can no longer swing, showing that a logic level is a physical margin and not a symbol.',
    },
  ],
};
