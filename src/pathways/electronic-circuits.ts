import type { LabPathway } from './types.js';

/**
 * A first circuits course, taught from the inside out. It opens inside the metal, where
 * current is drifting electrons and resistance is collisions, so Ohm's law arrives as a
 * consequence rather than a formula to memorise. Everything after that is bookkeeping on a
 * quantity the learner has already watched move.
 *
 * Every step here is solved by the Modified Nodal Analysis engine, so the numbers on screen
 * are computed from the circuit rather than authored alongside it.
 */
export const electronicCircuitsPathway: LabPathway = {
  id: 'electronic-circuits',
  title: 'Electronic circuits: what makes current flow, and what holds it back',
  description:
    'Begin with charge actually moving inside a conductor, derive Ohm’s law from it, then build and solve real loops: series and parallel, junctions, capacitors, and the equivalents that let a messy network be replaced by a simple one.',
  domain: 'circuits',
  grades: ['11', '12', 'undergraduate'],
  estimatedMinutes: 210,
  modules: [
    {
      id: 'charge-in-motion',
      title: 'Charge in motion',
      summary: 'Before any law, see what a current physically is and why a wire resists one.',
      outcomes: [
        'Describe current as drift superimposed on random thermal motion',
        'Explain resistance as collisions rather than as a property with no mechanism',
        'Predict how drift velocity responds to the applied field',
      ],
    },
    {
      id: 'the-complete-loop',
      title: 'Ohm’s law and the complete loop',
      summary:
        'Current needs somewhere to return to. A switch, a lamp and a cell make the smallest true circuit.',
      outcomes: [
        'Relate voltage, current and resistance in a single loop',
        'Predict what a break anywhere in a loop does everywhere in it',
        'Distinguish a series path from a parallel branch by where the current divides',
      ],
    },
    {
      id: 'nodes-and-branches',
      title: 'Nodes and branches',
      summary: 'Real circuits are networks. Two conservation rules are enough to solve any of them.',
      outcomes: [
        'Apply Kirchhoff’s current law at a junction and voltage law around a loop',
        'Build a network from scratch and measure it with an ammeter',
        'Explain why a short circuit starves the branch it bypasses',
      ],
    },
    {
      id: 'storing-charge',
      title: 'Storing charge',
      summary: 'A capacitor makes a circuit take time, which is the first step toward anything that changes.',
      outcomes: [
        'Predict the shape of a charging curve and locate the time constant on it',
        'Explain why a capacitor blocks a steady current but passes a changing one',
      ],
    },
    {
      id: 'equivalents',
      title: 'Replacing a network with something simpler',
      summary:
        'Any linear network, seen from two terminals, is indistinguishable from one source and one resistor.',
      outcomes: [
        'Reduce a network to its Thevenin equivalent from open-circuit voltage and short-circuit current',
        'Choose a load that draws maximum power from a source',
      ],
    },
  ],
  steps: [
    {
      id: 'conduction',
      module: 'charge-in-motion',
      tag: 'Conduction',
      title: 'What a current actually is',
      purpose:
        'Watch free electrons jiggle, apply a field, and see a slow net drift appear on top of the noise. Ohm’s law falls out of the drift.',
    },
    {
      id: 'light-the-bulb',
      module: 'the-complete-loop',
      tag: 'Circuit',
      title: 'Close the loop and it lights',
      purpose: 'Establish that current needs a complete path, using the smallest circuit that can fail.',
    },
    {
      id: 'circuit-lab',
      module: 'the-complete-loop',
      tag: 'CircuitLab',
      title: 'Dividing voltage and dividing current',
      purpose: 'Compare a series divider against a parallel branch and see which quantity splits in each.',
    },
    {
      id: 'circuit-builder-play',
      module: 'the-complete-loop',
      tag: 'CircuitBuilder',
      title: 'Change one thing, predict the rest',
      purpose: 'Vary a resistance in a working loop and check a prediction against the solved result.',
    },
    {
      id: 'network-canvas',
      module: 'nodes-and-branches',
      tag: 'CircuitScene',
      title: 'Build your own network',
      purpose:
        'Place parts, wire junctions, drop in an ammeter and solve it. The open sandbox the rest of the chapter refers back to.',
    },
    {
      id: 'kirchhoff-laws',
      module: 'nodes-and-branches',
      tag: 'KirchhoffLaws',
      title: 'The two rules that solve any network',
      purpose:
        'Sum currents into a junction and voltages around a loop, with the running totals shown so the rules are checkable at every step.',
      status: 'planned',
    },
    {
      id: 'rc-charging',
      module: 'storing-charge',
      tag: 'RCCharging',
      title: 'Filling the capacitor',
      purpose:
        'Charge and discharge against a real transient solve, marking the time constant at 63 percent.',
    },
    {
      id: 'capacitor-leak',
      module: 'storing-charge',
      tag: 'CapacitorLeak',
      title: 'Charge, then leak away',
      purpose:
        'Read the decay on a plotted curve beside the schematic, connecting the shape to the component values.',
    },
    {
      id: 'thevenin-equivalent',
      module: 'equivalents',
      tag: 'TheveninEquivalent',
      title: 'One source and one resistor',
      purpose:
        'Measure open-circuit voltage and short-circuit current on a network, then verify the equivalent behaves identically under any load.',
      status: 'planned',
    },
  ],
};
