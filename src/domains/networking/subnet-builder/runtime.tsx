'use client';

/**
 * SubnetBuilderLab — one question, answered by moving a line.
 *
 * Subnetting is where students drown, and the reason is the notation. In dotted decimal the network
 * boundary is invisible, so "192.168.1.10 and 192.168.2.10 with a /24" has to be resolved by a
 * memorised procedure. In binary the boundary is a line, and the answer is whether the highlighted
 * halves match.
 *
 * So the learner slides the prefix and watches the verdict flip at exactly the first bit where the
 * two addresses differ. Everything else a subnetting question can ask (mask, network address,
 * broadcast, usable hosts) is reported alongside as a consequence of where that line sits.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip, Slider } from '../../../kit/controls.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { SubnetScene } from '../../../networking/SubnetScene.js';
import {
  bitsOf,
  describe as describeSubnet,
  firstDifferingBit,
  sameNetwork,
  widestSharedPrefix,
} from '../../../networking/subnet.js';

export interface SubnetBuilderProps {
  hostA?: string;
  hostB?: string;
  prefix?: number;
  title?: string;
  prompt?: string;
}

const PAIRS: { label: string; a: string; b: string }[] = [
  { label: 'Same office', a: '192.168.1.10', b: '192.168.1.200' },
  { label: 'Next department', a: '192.168.1.10', b: '192.168.2.10' },
  { label: 'Another company', a: '192.168.1.10', b: '10.0.0.5' },
];

const SUBNET_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Decide whether two hosts can talk directly',
  objectives: [
    'Read an IPv4 address as 32 bits split by the prefix',
    'Decide whether two addresses share a network by comparing their network halves',
    'Find the longest prefix that still keeps two hosts together',
    'Explain why adding one bit to the prefix halves the usable addresses',
  ],
  success: [
    {
      id: 'direct-prediction',
      source: 'answer',
      key: 'can-talk',
      pendingLabel: 'Predict whether these two need a router.',
    },
    {
      id: 'found-boundary',
      source: 'metric',
      key: 'boundary',
      pendingLabel: 'Find the prefix where the answer flips.',
    },
    {
      id: 'halving',
      source: 'answer',
      key: 'why-halve',
      pendingLabel: 'Say what one more prefix bit does to the address space.',
    },
  ],
  questions: [
    {
      id: 'can-talk',
      prompt: '192.168.1.10 and 192.168.2.10 both use a /24 mask. Can they send to each other directly?',
      choices: [
        {
          value: 'yes',
          label: 'Yes, they are both 192.168.x',
          feedback: 'A /24 fixes the first three octets, and those differ.',
        },
        { value: 'no', label: 'No, a router has to carry it between them' },
        { value: 'depends', label: 'Only if they are plugged into the same switch' },
      ],
      answer: 'no',
      explain:
        'A /24 makes the first 24 bits the network, which covers all three of 192, 168 and the third octet. One says 1 and the other says 2, so the network halves differ and the two are on separate networks however they are cabled.',
    },
    {
      id: 'why-halve',
      prompt: 'A /24 offers 254 usable addresses. Why does a /25 offer 126?',
      choices: [
        { value: 'half', label: 'One more network bit leaves one fewer host bit, which halves the range' },
        { value: 'reserved', label: 'More addresses become reserved' },
        { value: 'router', label: 'The router takes the other half' },
      ],
      answer: 'half',
      explain:
        'Each bit moved from the host side to the network side halves how many hosts the block can hold. The two lost from every block are the network address itself and the broadcast address.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Router or not?',
      lead: 'Two addresses that look almost the same. Decide whether they need help to reach each other.',
      success: 'direct-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Move the line',
      lead: 'Slide the prefix and find where the answer changes.',
      controls: true,
      success: 'found-boundary',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'The bit that decides',
      lead: 'The marked bit is the first place the two addresses disagree. Everything follows from it.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'What the mask buys',
      lead: 'Read the block off the panel: network address, broadcast, and how many hosts fit.',
      controls: true,
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'The cost of a longer prefix',
      lead: 'A longer prefix separates more and holds fewer. Decide what one extra bit costs.',
      controls: true,
      success: 'halving',
    },
  ],
};

export function SubnetBuilderLab({
  hostA = '192.168.1.10',
  hostB = '192.168.2.10',
  prefix = 16,
  title,
  prompt,
}: SubnetBuilderProps = {}): ReactNode {
  const [pair, setPair] = useState({ a: hostA, b: hostB });
  const [bits, setBits] = useState(prefix);

  const aBits = useMemo(() => bitsOf(pair.a, bits), [pair.a, bits]);
  const bBits = useMemo(() => bitsOf(pair.b, bits), [pair.b, bits]);
  const info = useMemo(() => describeSubnet(pair.a, bits), [pair.a, bits]);
  const same = useMemo(() => sameNetwork(pair.a, pair.b, bits) ?? false, [pair, bits]);
  const boundary = useMemo(() => firstDifferingBit(pair.a, pair.b), [pair]);
  const widest = useMemo(() => widestSharedPrefix(pair.a, pair.b), [pair]);
  const differing = boundary >= 0 ? [boundary] : [];

  const move = useCallback(
    (value: number, context: AuthoredActivityContext) => {
      setBits(value);
      // The learner has found it once they have sat on either side of the flip.
      if (widest < 32 && (value === widest || value === widest + 1)) {
        context.complete('found-boundary', 'boundary');
      }
    },
    [widest],
  );

  const headline = same
    ? `At /${bits} the network halves match, so ${pair.a} and ${pair.b} can send to each other directly.`
    : `At /${bits} the network halves differ, so traffic between ${pair.a} and ${pair.b} needs a router.`;

  if (!aBits || !bBits || !info) return null;

  return (
    <AuthoredActivityRuntime
      activity={SUBNET_ACTIVITY}
      activityId="subnet-builder"
      eyebrow="Addressing"
      title={title ?? 'Same network, or not'}
      description={
        prompt ??
        'Every subnetting question is really one question. In binary the answer is a line you can move, and it flips at exactly one bit.'
      }
      status={
        <>
          <span>
            <strong>/{bits}</strong> · {info.mask}
          </span>
          <span>{info.usableHosts.toLocaleString('en-US')} usable</span>
          <span data-delivered={same || undefined}>{same ? 'direct' : 'needs a router'}</span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>The block containing {pair.a}</span>
              <strong>
                {info.network}/{bits}
              </strong>
            </div>
            <span>{info.mask}</span>
          </div>
          <ul className="lab-metric-list">
            <li>
              <span>Network address</span>
              <strong>{info.network}</strong>
            </li>
            <li>
              <span>Broadcast</span>
              <strong>{info.broadcast}</strong>
            </li>
            <li>
              <span>Usable range</span>
              <strong>
                {info.firstUsable ? `${info.firstUsable} to ${info.lastUsable}` : 'none at this size'}
              </strong>
            </li>
            <li>
              <span>Hosts that fit</span>
              <strong>{info.usableHosts.toLocaleString('en-US')}</strong>
            </li>
          </ul>
          <Field label="prefix" value={<b>/{bits}</b>}>
            <Slider
              value={bits}
              min={0}
              max={32}
              step={1}
              onChange={(value) => move(value, context)}
              ariaLabel="prefix length"
            />
          </Field>
          <div className="lab-activity-fields">
            {PAIRS.map((item) => (
              <Chip
                key={item.label}
                selected={pair.a === item.a && pair.b === item.b}
                onClick={() => setPair({ a: item.a, b: item.b })}
              >
                {item.label}
              </Chip>
            ))}
          </div>
          <p className="lab-note">
            {widest >= 32
              ? 'These two addresses are identical, so no prefix can separate them.'
              : `Anything up to /${widest} keeps them together. /${widest + 1} is the first prefix that splits them.`}
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      <SubnetScene
        aLabel={pair.a}
        bLabel={pair.b}
        aBits={aBits}
        bBits={bBits}
        prefix={bits}
        differing={differing}
        same={same}
        label={`${pair.a} and ${pair.b} at a /${bits} prefix. ${same ? 'Same network.' : 'Different networks.'}`}
      />
    </AuthoredActivityRuntime>
  );
}

export default SubnetBuilderLab;
