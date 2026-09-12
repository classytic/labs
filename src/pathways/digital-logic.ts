import type { LabPathway } from './types.js';

/**
 * A first course in digital logic design, built as ONE continuous argument: a switch can
 * decide, decided things can be combined, combined things can remember, and something that
 * remembers can follow a plan. That is a computer.
 *
 * The order is the standard syllabus (number systems, Boolean algebra, minimisation,
 * combinational blocks, latches and flip-flops, registers and counters, state machines),
 * so it maps onto a Digital Logic Design course such as CSE 231 and its equivalents. The
 * framing is deliberately not a syllabus: each chapter answers a question a student would
 * actually ask.
 *
 * Steps marked `planned` are designed but unbuilt. The pivot from combinational to
 * sequential is the whole point of the course, and it is also where the library currently
 * stops, so the backlog is concentrated there on purpose.
 */
export const digitalLogicPathway: LabPathway = {
  id: 'digital-logic-design',
  title: 'Digital logic design: from one switch to a working computer',
  description:
    'Start with how a machine writes a number, build the algebra that lets a circuit decide, minimise it, then cross the line into circuits that remember, count and follow a plan. Ends with a project that can be built on a breadboard.',
  domain: 'ict',
  grades: ['12', 'undergraduate'],
  estimatedMinutes: 480,
  modules: [
    {
      id: 'numbers',
      title: 'Numbers a machine can hold',
      summary: 'A machine has no digits, only levels. Everything else is a convention we chose.',
      outcomes: [
        'Read the same quantity in binary, octal, decimal and hexadecimal',
        'Explain why one byte is exactly two hexadecimal digits',
        'Represent a negative number without a minus sign',
      ],
    },
    {
      id: 'boolean-algebra',
      title: 'The algebra of true and false',
      summary: 'Two values, a handful of operators, and a set of laws that let you rewrite a circuit.',
      outcomes: [
        'Translate between a sentence, a Boolean expression, a truth table and a gate circuit',
        'Prove two expressions equivalent by exhausting their truth table',
        'Apply De Morgan and the absorption laws to rewrite an expression',
      ],
    },
    {
      id: 'minimisation',
      title: 'Making it smaller',
      summary: 'Two circuits can behave identically and cost very different amounts. Find the cheap one.',
      outcomes: [
        'Write a function in canonical sum-of-products and product-of-sums form',
        'Group a Karnaugh map into the fewest, largest valid groups',
        'Rebuild any circuit using only NAND gates',
      ],
    },
    {
      id: 'combinational',
      title: 'Circuits that decide',
      summary: 'The standard blocks every larger design is assembled from.',
      outcomes: [
        'Build a half adder and extend it to a full adder',
        'Select one of many inputs with a multiplexer and address one of many outputs with a decoder',
        'Chain full adders into an adder that handles real binary numbers',
      ],
    },
    {
      id: 'memory',
      title: 'Circuits that remember',
      summary:
        'Feed a gate its own output and the circuit stops being a function of its inputs. This is the moment a circuit gains a past.',
      outcomes: [
        'Build an SR latch from two cross-coupled NAND gates and explain why it holds its value',
        'Distinguish a level-sensitive latch from an edge-triggered flip-flop',
        'Predict what a flip-flop stores across a clock edge',
      ],
    },
    {
      id: 'counting',
      title: 'Circuits that count',
      summary: 'Flip-flops in a row become storage; flip-flops in a chain become arithmetic over time.',
      outcomes: [
        'Store and shift a multi-bit word',
        'Explain why a ripple counter is simpler than a synchronous counter and worse',
        'Design a counter that stops at an arbitrary modulus',
      ],
    },
    {
      id: 'control',
      title: 'Circuits that follow a plan',
      summary: 'State plus a rule for changing state is a machine that carries out a procedure.',
      outcomes: [
        'Draw a state diagram from a description in words',
        'Turn a state diagram into a state table and then into flip-flop inputs',
        'Verify a design by walking the clock one edge at a time',
      ],
    },
    {
      id: 'capstone',
      title: 'Build it for real',
      summary:
        'A design that only exists in a simulator is half finished. These produce something to wire up and show people.',
      outcomes: [
        'Design and verify a complete sequential project from a specification',
        'Convert a working design into a 7400-series parts list and a wiring plan',
      ],
    },
  ],
  steps: [
    {
      id: 'place-value',
      module: 'numbers',
      tag: 'PlaceValueDial',
      title: 'Every number is a sum of place values',
      purpose:
        'Turn one wheel at a time and watch a carry ripple, so base becomes a rule rather than a table.',
      defaultAttributes: { base: 2, width: 8, showWeights: true },
    },
    {
      id: 'base-odometer',
      module: 'numbers',
      tag: 'BaseOdometer',
      title: 'One quantity, four spellings',
      purpose:
        'Drive binary, octal, decimal and hex from a single value to separate the number from its notation.',
      defaultAttributes: { max: 255, start: 0 },
    },
    {
      id: 'bit-grouper',
      module: 'numbers',
      tag: 'BitGrouper',
      title: 'Why hexadecimal exists',
      purpose:
        'Slice a byte into nibbles and see two clean hex digits fall out, against a wasteful octal top group.',
      defaultAttributes: { width: 8, groupSize: 4 },
    },
    {
      id: 'binary-display',
      module: 'numbers',
      tag: 'BinaryDisplay',
      title: 'From bits to something a person can read',
      purpose:
        'Drive a seven-segment digit from weighted switches, the payoff every hardware project ends at.',
      defaultAttributes: { bits: 4 },
    },
    {
      id: 'twos-complement',
      module: 'numbers',
      tag: 'TwosComplement',
      title: 'Negative numbers without a minus sign',
      purpose:
        'Show why inverting and adding one lets ONE adder do subtraction, and where the range quietly becomes asymmetric.',
    },
    {
      id: 'binary-codes',
      module: 'numbers',
      tag: 'BinaryCodes',
      title: 'Codes chosen for a reason',
      purpose: 'Contrast BCD and Gray code against plain binary, so a code reads as an engineering choice.',
      status: 'planned',
    },

    {
      id: 'gates-first-look',
      module: 'boolean-algebra',
      tag: 'LogicGate',
      title: 'A gate is a decision made of switches',
      purpose:
        'Toggle inputs and watch HIGH propagate along the wires, connecting a gate symbol to its behaviour.',
      defaultAttributes: { preset: 'and', mode: 'explore', showTable: true },
    },
    {
      id: 'demorgan',
      module: 'boolean-algebra',
      tag: 'TruthTable',
      title: 'De Morgan, proved rather than asserted',
      purpose:
        'Fill both tables side by side and see that inverting an AND is the same as OR-ing the inversions, in every row.',
      defaultAttributes: { formula: '¬(p ∧ q)', compare: '¬p ∨ ¬q', mode: 'fill' },
    },
    {
      id: 'expression-to-circuit',
      module: 'boolean-algebra',
      tag: 'BooleanCircuit',
      title: 'From an expression to wires',
      purpose:
        'Read an authored netlist as a drawn circuit, so an expression and a diagram become one object.',
    },
    {
      id: 'boolean-laws',
      module: 'boolean-algebra',
      tag: 'BooleanLaws',
      title: 'Laws that make a circuit shrink',
      purpose:
        'Apply one law at a time to an expression and watch the matching gate count drop, so algebra has a visible cost.',
      status: 'planned',
    },

    {
      id: 'canonical-forms',
      module: 'minimisation',
      tag: 'CanonicalForms',
      title: 'Minterms, maxterms, and the two canonical forms',
      purpose: 'Build sum-of-products and product-of-sums from the same truth table and compare their cost.',
      status: 'planned',
    },
    {
      id: 'karnaugh',
      module: 'minimisation',
      tag: 'KarnaughMap',
      title: 'Grouping by eye instead of by algebra',
      purpose:
        'Find the fewest largest groups, including wrap-around, and read the simplified expression off the map.',
    },
    {
      id: 'nand-universality',
      module: 'minimisation',
      tag: 'LogicGate',
      title: 'One gate is enough',
      purpose:
        'Predict the output of XOR built from four NANDs, the definitive proof that NAND alone spans all of logic.',
      defaultAttributes: { preset: 'xor-nand', mode: 'predict', showTable: true },
    },
    {
      id: 'gate-conversion',
      module: 'minimisation',
      tag: 'GateConversion',
      title: 'Rebuild it in one gate type',
      purpose:
        'Convert an arbitrary circuit to NAND-only or NOR-only form, which is what a real 7400 parts drawer forces.',
      status: 'planned',
    },

    {
      id: 'half-adder',
      module: 'combinational',
      tag: 'LogicGate',
      title: 'Adding two bits',
      purpose: 'Derive sum and carry as XOR and AND of the same two inputs.',
      defaultAttributes: { preset: 'half-adder', mode: 'predict', showTable: true },
    },
    {
      id: 'full-adder',
      module: 'combinational',
      tag: 'LogicGate',
      title: 'Adding two bits and a carry',
      purpose: 'Extend the half adder to accept a carry in, the cell every arithmetic unit is tiled from.',
      defaultAttributes: { preset: 'full-adder', mode: 'explore', showTable: true },
    },
    {
      id: 'build-a-half-adder',
      module: 'combinational',
      tag: 'LogicBuilder',
      title: 'Now build one yourself',
      purpose:
        'Place and wire gates until the learner truth table matches the target, graded per output over all input combinations.',
      defaultAttributes: { goal: 'half-adder' },
    },
    {
      id: 'multiplexer',
      module: 'combinational',
      tag: 'Multiplexer',
      title: 'Choosing one line out of many',
      purpose:
        'Drive select lines and watch exactly one input reach the output, then use a mux as a function generator.',
      status: 'planned',
    },
    {
      id: 'decoder',
      module: 'combinational',
      tag: 'Decoder',
      title: 'Turning an address into one hot line',
      purpose: 'Show a decoder as the inverse of an encoder and as the addressing mechanism behind memory.',
      status: 'planned',
    },
    {
      id: 'magnitude-comparator',
      module: 'combinational',
      tag: 'MagnitudeComparator',
      title: 'Deciding which number is bigger',
      purpose:
        'Compare from the most significant bit down, so the cascade rule becomes obvious rather than memorised.',
      status: 'planned',
    },
    {
      id: 'ripple-carry-adder',
      module: 'combinational',
      tag: 'RippleCarryAdder',
      title: 'Adding real numbers, and the cost of waiting',
      purpose:
        'Chain full adders, add two four-bit numbers, and watch the carry take time to arrive. The first performance lesson.',
      status: 'planned',
    },

    {
      id: 'sr-latch',
      module: 'memory',
      tag: 'SrLatch',
      title: 'Two NOR gates that will not forget',
      purpose:
        'Wire each gate into the other, remove the input, and find the output still there. Feedback, built by hand, not handed over as a primitive.',
    },
    {
      id: 'gated-d-latch',
      module: 'memory',
      tag: 'GatedDLatch',
      title: 'Remembering only when told to',
      purpose:
        'Add an enable so the latch is transparent while held open, which is exactly the flaw a flip-flop fixes.',
      status: 'planned',
    },
    {
      id: 'latch-vs-flip-flop',
      module: 'memory',
      tag: 'LatchVsFlipFlop',
      title: 'The edge, not the level',
      purpose:
        'Contrast a latch and a flip-flop on the same waveform to show why synchronous design triggers on an edge.',
    },
    {
      id: 'jk-flip-flop',
      module: 'memory',
      tag: 'JkFlipFlop',
      title: 'What to do with both inputs high',
      purpose:
        'Give the SR latch’s forbidden input a use, toggle, and tie J to K to get the T flip-flop every counter stage is made of.',
    },

    {
      id: 'register',
      module: 'counting',
      tag: 'Register',
      title: 'Flip-flops side by side',
      purpose:
        'Load a whole word on one clock edge and hold it, with a clock enable that decides when loading happens.',
      status: 'planned',
    },
    {
      id: 'shift-register',
      module: 'counting',
      tag: 'ShiftRegister',
      title: 'Moving bits along',
      purpose: 'Shift a pattern through and derive serial to parallel conversion from watching it.',
    },
    {
      id: 'ripple-counter',
      module: 'counting',
      tag: 'RippleCounter',
      title: 'Counting the lazy way',
      purpose: 'Clock each flip-flop from the previous output and expose the settling glitch that results.',
      status: 'planned',
    },
    {
      id: 'binary-counter',
      module: 'counting',
      tag: 'BinaryCounter',
      title: 'Counting properly, and stopping where you want',
      purpose:
        'Clock every stage together, then add decode logic to build a modulus that is not a power of two.',
    },

    {
      id: 'state-diagram',
      module: 'control',
      tag: 'StateDiagram',
      title: 'A plan drawn as states and arrows',
      purpose: 'Translate a description in words into states and labelled transitions, then walk it by hand.',
      status: 'planned',
    },
    {
      id: 'state-machine-designer',
      module: 'control',
      tag: 'StateMachineDesigner',
      title: 'From diagram to circuit, one step at a time',
      purpose:
        'Carry a design through state table, state assignment, flip-flop inputs and gate network, checking each stage against the last. The hardest thing in the course and the least well taught.',
      status: 'planned',
    },

    {
      id: 'traffic-light-controller',
      module: 'capstone',
      tag: 'TrafficLightController',
      title: 'Project: a junction that works',
      purpose:
        'Specify, design and verify a timed controller with a pedestrian request, the classic first project.',
      status: 'planned',
    },
    {
      id: 'digital-clock',
      module: 'capstone',
      tag: 'DigitalClock',
      title: 'Project: counting seconds into a display',
      purpose: 'Combine modulus counters and seven-segment decoding into something worth showing someone.',
      status: 'planned',
    },
    {
      id: 'wire-a-chip',
      module: 'capstone',
      tag: 'WireAChip',
      title: 'Wire a real chip before you build a real circuit',
      purpose:
        'Power a 74-series chip, count its pins from the notch, and meet every classic wiring fault in a place where none of them can burn anything.',
    },
    {
      id: 'breadboard-plan',
      module: 'capstone',
      tag: 'BreadboardPlan',
      title: 'Turn the design into a parts list',
      purpose:
        'Convert a finished circuit into 7400-series packages with pin assignments and a wiring plan, so the simulated design can actually be built.',
      status: 'planned',
    },
  ],
};
