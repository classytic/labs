'use client';

/**
 * WireAChipLab — the practical session, before the practical session.
 *
 * It opens on the fault every lab instructor sees first: the switches and LED wired correctly to a
 * 7400, and nothing on pins 7 and 14. The prediction asks what the LED does, and the answer is
 * nothing, because a chip with no supply is a piece of plastic. That is worth more than any truth
 * table in the first session.
 *
 * After that the learner wires the chip themselves, pin by pin, choosing a lead and clicking a pin.
 * Every classic mistake is caught and named in words: reversed supply, a switch driving an output,
 * an LED on an input pin, a floating input. The challenge is AND from a 7400 alone, which needs a
 * jumper between two gates: the step from "using a gate" to "building with gates".
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActionButton, Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { ChipScene } from '../../../logic/ChipScene.js';
import {
  CHIPS,
  behavesAs,
  evaluateChip,
  pin,
  type ChipId,
  type Terminal,
  type Wire,
} from '../../../logic/ic.js';

export interface WireAChipProps {
  chip?: ChipId;
  title?: string;
  prompt?: string;
}

type Tool = 'A' | 'B' | 'VCC' | 'GND' | 'LED' | 'jumper';
const TOOLS: { tool: Tool; label: string }[] = [
  { tool: 'A', label: 'Switch A' },
  { tool: 'B', label: 'Switch B' },
  { tool: 'VCC', label: '+5 V' },
  { tool: 'GND', label: 'Ground' },
  { tool: 'LED', label: 'LED' },
  { tool: 'jumper', label: 'Jumper' },
];

const START: Wire[] = [
  ['A', pin(1)],
  ['B', pin(2)],
  ['LED', pin(3)],
];
const CHIP_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Wire a real logic chip, and find out why it does not work yet',
  objectives: [
    'Power a 74-series chip correctly: +5 V on pin 14, ground on pin 7',
    'Count pins from the notch and read a pinout to find a gate’s inputs and output',
    'Recognise the wiring faults that stop a circuit from working',
    'Build a function that needs two gates, using a jumper between pins',
  ],
  success: [
    { id: 'predict-power', source: 'answer', key: 'no-power', pendingLabel: 'Predict what the LED does.' },
    {
      id: 'working',
      source: 'metric',
      key: 'nand',
      pendingLabel: 'Make the LED follow NAND for all four switch settings.',
    },
    {
      id: 'and-built',
      source: 'metric',
      key: 'and',
      pendingLabel: 'Make the LED show A AND B using only this chip.',
    },
    {
      id: 'floating',
      source: 'answer',
      key: 'unused-inputs',
      pendingLabel: 'Say what to do with unused inputs.',
    },
  ],
  questions: [
    {
      id: 'no-power',
      prompt:
        'Switch A goes to pin 1, switch B to pin 2 and the LED to pin 3 of a 7400, which is a NAND. Nothing else is connected. Both switches are off. What does the LED do?',
      choices: [
        {
          value: 'on',
          label: 'It lights, because NAND of 0 and 0 is 1',
          feedback: 'That is what the gate WOULD do. Look at pins 7 and 14.',
        },
        { value: 'off', label: 'It stays dark, because the chip has no power' },
        {
          value: 'flicker',
          label: 'It flickers',
          feedback: 'Nothing is driving it at all, so there is nothing to flicker.',
        },
      ],
      answer: 'off',
      explain:
        'A logic chip is powered through two pins, not through its inputs. Every chip in this family takes +5 V on pin 14 and ground on pin 7. With neither connected, no gate inside can produce an output, whatever the truth table says. This is the most common reason a first lab circuit does nothing.',
    },
    {
      id: 'unused-inputs',
      prompt:
        'Your AND circuit uses two of the four gates. What should you do with the inputs of the two unused gates?',
      choices: [
        { value: 'tie', label: 'Connect each one to +5 V or to ground' },
        {
          value: 'leave',
          label: 'Leave them unconnected, since those gates do nothing',
          feedback: 'An unconnected CMOS input floats between levels and can switch at random.',
        },
        {
          value: 'join',
          label: 'Connect them to the LED as well',
          feedback: 'Then the LED would be on a mix of inputs and outputs. Keep it on one output.',
        },
      ],
      answer: 'tie',
      explain:
        'A floating input on a 74HC chip is not quietly 0 or 1. It drifts, the gate can switch back and forth, and it draws extra current while it does. Tying every unused input to a supply rail gives it a definite level. The simulator warns you only about gates the LED can see; on a real board, tie them all.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Why is the LED dark?',
      lead: 'The switches and LED are wired to the first gate. Look carefully at what is missing.',
      success: 'predict-power',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Power it and test it',
      lead: 'Pick a lead, then click a pin to connect it. Clicking again removes it. Try all four switch settings.',
      controls: true,
      success: 'working',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Counting pins',
      lead: 'Pins count anticlockwise from the notch: 1 to 7 along the bottom, then 8 to 14 back along the top.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'AND from a NAND chip',
      lead: 'Use a jumper to feed one gate’s output into another gate. A NAND with its inputs joined is a NOT.',
      controls: true,
      success: 'and-built',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Before you build it for real',
      lead: 'The simulator is forgiving about the gates you did not use. A breadboard is not.',
      controls: true,
      success: 'floating',
    },
  ],
};

const sameWire = (a: Wire, b: Wire): boolean =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);

export function WireAChipLab({ chip: authoredChip = '7400', title, prompt }: WireAChipProps = {}): ReactNode {
  const [chip, setChip] = useState<ChipId>(authoredChip);
  const [wires, setWires] = useState<Wire[]>(START);
  const [inputs, setInputs] = useState({ A: false, B: false });
  const [tool, setTool] = useState<Tool>('VCC');
  const [pending, setPending] = useState<number | null>(null);

  const result = useMemo(() => evaluateChip(chip, wires, inputs), [chip, wires, inputs]);

  const judge = useCallback((nextChip: ChipId, nextWires: Wire[], context: AuthoredActivityContext) => {
    if (behavesAs(nextChip, nextWires, (a, b) => !(a && b))) context.complete('working', 'nand');
    if (nextChip === '7400' && behavesAs(nextChip, nextWires, (a, b) => a && b))
      context.complete('and-built', 'and');
  }, []);

  const toggleWire = useCallback(
    (wire: Wire, context: AuthoredActivityContext) => {
      const exists = wires.some((w) => sameWire(w, wire));
      // Each off-chip lead is one physical wire: moving it means unplugging it from where it was.
      const source = wire.find((t) => !t.startsWith('p'));
      const next = exists
        ? wires.filter((w) => !sameWire(w, wire))
        : [...wires.filter((w) => !source || !w.includes(source as Terminal)), wire];
      setWires(next);
      judge(chip, next, context);
    },
    [chip, judge, wires],
  );

  const onPin = useCallback(
    (n: number, context: AuthoredActivityContext) => {
      if (tool === 'jumper') {
        if (pending === null) setPending(n);
        else {
          if (pending !== n) toggleWire([pin(pending), pin(n)], context);
          setPending(null);
        }
        return;
      }
      toggleWire([tool, pin(n)], context);
    },
    [pending, toggleWire, tool],
  );

  const problems = result.diagnostics.filter((d) => d.code !== 'led-unwired');
  const headline = problems.length
    ? problems[0]!.message
    : result.led === true
      ? `The LED is on. With A = ${inputs.A ? 1 : 0} and B = ${inputs.B ? 1 : 0}, the gate it is wired to outputs 1.`
      : `The LED is off. With A = ${inputs.A ? 1 : 0} and B = ${inputs.B ? 1 : 0}, the gate it is wired to outputs 0.`;

  return (
    <AuthoredActivityRuntime
      activity={CHIP_ACTIVITY}
      activityId="wire-a-chip"
      eyebrow="On the bench"
      title={title ?? 'Wire a real logic chip'}
      description={
        prompt ??
        'A 14-pin chip on a breadboard, wired one lead at a time. The truth table is the easy part; the wiring is where first circuits fail.'
      }
      status={
        <>
          <span>74HC{chip.slice(2)}</span>
          <span data-delivered={result.powered || undefined}>{result.powered ? 'powered' : 'no power'}</span>
          <span>{wires.length} wires</span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="lab-activity-fields">
            {TOOLS.map((item) => (
              <Chip
                key={item.tool}
                selected={tool === item.tool}
                onClick={() => {
                  setTool(item.tool);
                  setPending(null);
                }}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <p className="lab-note">
            {tool === 'jumper'
              ? pending === null
                ? 'Click the first pin of the jumper.'
                : `Now click the pin to join to pin ${pending}.`
              : `Click a pin to connect the ${TOOLS.find((t) => t.tool === tool)!.label} lead to it.`}
          </p>
          <div className="lab-activity-fields">
            {(Object.keys(CHIPS) as ChipId[]).map((id) => (
              <Chip
                key={id}
                selected={chip === id}
                onClick={() => {
                  setChip(id);
                  judge(id, wires, context);
                }}
              >
                {id}
              </Chip>
            ))}
            <ActionButton onClick={() => setWires([])} disabled={!wires.length}>
              Pull every wire
            </ActionButton>
          </div>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <ChipScene
          chip={chip}
          wires={wires}
          inputs={inputs}
          result={result}
          pending={pending}
          onPin={(n) => onPin(n, context)}
          onSwitch={(which) => setInputs((current) => ({ ...current, [which]: !current[which] }))}
          label={`A 74HC${chip.slice(2)} on a breadboard with ${wires.length} wires. ${headline}`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default WireAChipLab;
