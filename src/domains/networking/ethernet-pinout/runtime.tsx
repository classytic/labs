'use client';

/**
 * EthernetPinoutLab — crimp the plug yourself, then find out why the order is what it is.
 *
 * The T568B sequence is the single most memorised and least understood thing in networking. This
 * lab refuses to present it as a list. The learner places the eight wires, and the pair brackets
 * underneath show the constraint that generates the order: blue must hold the middle two pins so an
 * RJ45 socket still accepts a telephone plug, which forces the green pair to straddle it. Once that
 * is seen, the order can be rebuilt from four pair names instead of eight positions.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { PlugScene } from '../../../networking/PlugScene.js';
import {
  PINOUTS,
  WIRE_INK,
  WIRE_LABEL,
  cableKind,
  checkPinout,
  type PinoutStandard,
  type WireColor,
} from '../../../networking/media.js';

export interface EthernetPinoutProps {
  standard?: PinoutStandard;
  title?: string;
  prompt?: string;
}

const PINOUT_ACTIVITY: AuthoredActivity = {
  pattern: 'construction',
  title: 'Crimp a plug, then explain the order',
  objectives: [
    'Place the eight wires of a twisted-pair cable in the correct order',
    'Explain why the blue pair occupies the middle two pins',
    'Explain why the green pair is split across pins 3 and 6',
    'Distinguish a straight-through cable from a crossover by its two ends',
  ],
  success: [
    {
      id: 'pair-prediction',
      source: 'answer',
      key: 'which-pair',
      pendingLabel: 'Predict which two pins belong to the same pair.',
    },
    { id: 'wired', source: 'metric', key: 'correct', pendingLabel: 'Place all eight wires correctly.' },
    {
      id: 'crossover',
      source: 'answer',
      key: 'ends',
      pendingLabel: 'Say what a cable with different standards at each end is called.',
    },
  ],
  questions: [
    {
      id: 'which-pair',
      prompt:
        'In a finished T568B plug, pins 1 and 2 are one twisted pair. Which pins form the pair that carries the other direction?',
      choices: [
        { value: '34', label: 'Pins 3 and 4', feedback: 'Pin 4 belongs to the blue pair.' },
        { value: '36', label: 'Pins 3 and 6' },
        {
          value: '78',
          label: 'Pins 7 and 8',
          feedback: 'That is the brown pair, which older Ethernet did not use.',
        },
      ],
      answer: '36',
      explain:
        'Pins 3 and 6 are the green pair, and they are not next to each other. Something is sitting between them, which is the thing worth explaining.',
    },
    {
      id: 'ends',
      prompt: 'A cable is wired to T568A at one end and T568B at the other. What is it?',
      choices: [
        { value: 'straight', label: 'A straight-through cable' },
        { value: 'cross', label: 'A crossover cable' },
        { value: 'broken', label: 'A broken cable that will not work' },
      ],
      answer: 'cross',
      explain:
        'Swapping the orange and green pairs between the ends puts one device’s transmit pair onto the other’s receive pair. Modern ports detect and correct this themselves, which is why crossover cables have all but vanished.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Which pins are partners?',
      lead: 'Twisted pairs have to stay together to cancel interference. Predict where the second pair sits.',
      success: 'pair-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Crimp the plug',
      lead: 'Pick a wire, then click the pin it belongs in. Get all eight right.',
      controls: true,
      success: 'wired',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Look at the brackets',
      lead: 'Three pairs sit on neighbouring pins. One does not. Find it and see what is in its way.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Why blue owns the middle',
      lead: 'An RJ45 socket had to keep accepting an older telephone plug, which uses the middle two positions.',
      controls: true,
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Two ends, two standards',
      lead: 'Switch the standard and compare. Only the orange and green pairs move.',
      controls: true,
      success: 'crossover',
    },
  ],
};

export function EthernetPinoutLab({
  standard = 'T568B',
  title,
  prompt,
}: EthernetPinoutProps = {}): ReactNode {
  const [target, setTarget] = useState<PinoutStandard>(standard);
  const [pins, setPins] = useState<(WireColor | undefined)[]>(() => Array(8).fill(undefined));
  const [selected, setSelected] = useState<WireColor>();

  const check = useMemo(() => checkPinout(pins, target), [pins, target]);
  const used = useMemo(() => new Set(pins.filter(Boolean) as WireColor[]), [pins]);

  const place = useCallback(
    (pin: number, context: AuthoredActivityContext) => {
      setPins((current) => {
        const next = [...current];
        // Clicking a filled pin empties it; otherwise drop the selected wire in.
        if (next[pin - 1]) next[pin - 1] = undefined;
        else if (selected) {
          // A wire lives in exactly one place, so remove it from wherever it was.
          const previous = next.indexOf(selected);
          if (previous >= 0) next[previous] = undefined;
          next[pin - 1] = selected;
        }
        const result = checkPinout(next, target);
        if (result.correct) context.complete('wired', 'correct');
        return next;
      });
      setSelected(undefined);
    },
    [selected, target],
  );

  const fillCorrectly = useCallback(() => setPins([...PINOUTS[target]]), [target]);
  const clear = useCallback(() => {
    setPins(Array(8).fill(undefined));
    setSelected(undefined);
  }, []);

  const headline = check.correct
    ? `All eight in the right places. This end is wired to ${target}.`
    : check.wrong.length
      ? `Pin${check.wrong.length > 1 ? 's' : ''} ${check.wrong.join(', ')} ${check.wrong.length > 1 ? 'are' : 'is'} not what ${target} expects.`
      : `${check.placed} of 8 placed.`;

  return (
    <AuthoredActivityRuntime
      activity={PINOUT_ACTIVITY}
      activityId="ethernet-pinout"
      eyebrow="Physical layer"
      title={title ?? 'Eight wires in one plug'}
      description={
        prompt ??
        'The colour order looks arbitrary and is not. One compatibility decision made in the telephone era fixes almost all of it.'
      }
      status={
        <>
          <span>
            <strong>{target}</strong>
          </span>
          <span>{check.placed} / 8 placed</span>
          {check.correct ? (
            <span data-delivered>correct</span>
          ) : (
            check.wrong.length > 0 && <span>{check.wrong.length} wrong</span>
          )}
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Pick a wire, then a pin</span>
              <strong>Four twisted pairs</strong>
            </div>
            <span>{used.size} / 8 used</span>
          </div>
          <div className="lab-activity-fields">
            {PINOUTS[target].map((wire) => (
              <Chip
                key={wire}
                selected={selected === wire}
                disabled={used.has(wire)}
                onClick={() => setSelected(wire)}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    marginRight: 6,
                    background: WIRE_INK[wire],
                    outline: '1px solid rgba(0,0,0,.25)',
                  }}
                />
                {WIRE_LABEL[wire]}
              </Chip>
            ))}
          </div>
          <div className="lab-activity-fields">
            <Chip
              selected={target === 'T568B'}
              onClick={() => {
                setTarget('T568B');
                clear();
              }}
            >
              T568B
            </Chip>
            <Chip
              selected={target === 'T568A'}
              onClick={() => {
                setTarget('T568A');
                clear();
              }}
            >
              T568A
            </Chip>
            <Chip selected={false} onClick={clear} disabled={!check.placed}>
              Clear
            </Chip>
            <Chip selected={false} onClick={fillCorrectly}>
              Show me
            </Chip>
          </div>
          <p className="lab-note">
            A cable with the same standard at both ends is a {cableKind(target, target)} cable. Wire the far
            end to the other standard and it becomes a {cableKind('T568A', 'T568B')}.
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <PlugScene
          pins={pins}
          standard={target}
          wrong={check.wrong}
          showPairs={context.sequence.current.id !== 'act'}
          onPinClick={(pin) => place(pin, context)}
          selected={selected}
          label={`RJ45 plug wired to ${target}. ${check.placed} of 8 wires placed.`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default EthernetPinoutLab;
