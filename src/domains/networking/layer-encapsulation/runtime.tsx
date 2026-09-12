'use client';

/**
 * LayerEncapsulationLab — what a message becomes, and what survives the trip.
 *
 * Students can recite the layers and still fail the only two questions that matter. This lab is
 * built around those two, and nothing else.
 *
 * The first is what a router changes. Almost everyone answers that the destination MAC address is
 * the server's, because both addresses are drawn on the same diagram and nothing ever says which
 * one is local. Here the MAC pair is written over every segment and changes three times, while the
 * IP pair is written once under a bracket spanning the whole path. The picture makes the claim; the
 * text only names it.
 *
 * The second is why anyone should care about header sizes. The frame is drawn to scale, so dragging
 * the payload down to one byte makes the message vanish next to its own addressing. That is a
 * keystroke in a remote shell, and it is why interactive traffic is measured in packets per second
 * rather than bytes.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip, Slider } from '../../../kit/controls.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { EncapScene } from '../../../networking/EncapScene.js';
import {
  DEFAULT_PATH,
  HEADERS,
  encapsulate,
  journey,
  type PathNode,
} from '../../../networking/encapsulation.js';

export interface LayerEncapsulationProps {
  payloadBytes?: number;
  title?: string;
  prompt?: string;
}

const SIZES: { label: string; bytes: number; note: string }[] = [
  { label: 'One keystroke', bytes: 1, note: 'a character typed into a remote shell' },
  { label: 'A short request', bytes: 100, note: 'a small HTTP GET' },
  { label: 'A full packet', bytes: 1400, note: 'a slice of a file download' },
];

const ENCAP_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Follow one message down the stack and across the wires',
  objectives: [
    'Say what each layer adds and what it leaves alone',
    'Name the addresses in the frame on any given wire',
    'Explain why the MAC pair changes at every routed hop and the IP pair does not',
    'Work out what a set of headers costs, and when that cost matters',
  ],
  success: [
    {
      id: 'predict-mac',
      source: 'answer',
      key: 'first-frame',
      pendingLabel: 'Predict the addresses on the first wire.',
    },
    {
      id: 'walked-path',
      source: 'metric',
      key: 'segments',
      pendingLabel: 'Look at the frame on every wire in turn.',
    },
    {
      id: 'saw-overhead',
      source: 'metric',
      key: 'payload',
      pendingLabel: 'Shrink the message and watch what happens to the frame.',
    },
    {
      id: 'why-two',
      source: 'answer',
      key: 'why-both',
      pendingLabel: 'Say why a frame carries two kinds of address at once.',
    },
  ],
  questions: [
    {
      id: 'first-frame',
      prompt:
        'Your laptop sends to a server two routers away. In the very first frame that leaves your laptop, what is the destination MAC address?',
      choices: [
        {
          value: 'server',
          label: "The server's, since that is where the message is going",
          feedback: 'That is the destination IP address. A MAC address cannot name a machine that far away.',
        },
        { value: 'router', label: "The first router's, because it is the next box on this wire" },
        {
          value: 'switch',
          label: "The switch's, because the switch is what the cable is plugged into",
          feedback: 'A switch forwards frames without being addressed by them. It is invisible at layer 3.',
        },
      ],
      answer: 'router',
      explain:
        'A MAC address only means anything on one wire. The frame is addressed to the next box that has to handle it, which is the first router, while the IP header keeps naming the server the entire way. Every routed hop throws the old frame away and builds a new one with the next pair of MAC addresses.',
    },
    {
      id: 'why-both',
      prompt: 'Why does a frame carry a MAC pair and an IP pair rather than just one of them?',
      choices: [
        {
          value: 'redundancy',
          label: 'In case one of them is lost in transit',
          feedback: 'Neither is a backup for the other. They answer different questions.',
        },
        {
          value: 'scopes',
          label: 'One names the next box on this wire, the other names the far end of the journey',
        },
        {
          value: 'speed',
          label: 'MAC addresses are faster to look up than IP addresses',
          feedback: 'Lookup cost is not why both exist. Try covering one address and asking what breaks.',
        },
      ],
      answer: 'scopes',
      explain:
        'Cover the IP pair and no device past the first router knows where the message was headed. Cover the MAC pair and the frame cannot be handed to anything on the current wire. They are a local address and a global one, which is why one is rewritten at every hop and the other is not.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Who is the first frame addressed to?',
      lead: 'A message leaves your laptop for a server two routers away.',
      success: 'predict-mac',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Walk the wires',
      lead: 'Step along the path and read the addresses on each one.',
      controls: true,
      success: 'walked-path',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'One row changes, one row does not',
      lead: 'Three wires, three MAC pairs, one IP pair. The colours say how deep each device opens the frame.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'What the wrapping costs',
      lead: 'The frame is drawn to scale. Change the size of the message and watch the addressing stay exactly the same size.',
      controls: true,
      success: 'saw-overhead',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Two addresses, two jobs',
      lead: 'You have seen which one is rewritten. Now say why both are there.',
      controls: true,
      success: 'why-two',
    },
  ],
};

export function LayerEncapsulationLab({
  payloadBytes = 100,
  title,
  prompt,
}: LayerEncapsulationProps = {}): ReactNode {
  const [bytes, setBytes] = useState(payloadBytes);
  const [segment, setSegment] = useState(0);
  const [seen, setSeen] = useState<number[]>([0]);

  const path: PathNode[] = DEFAULT_PATH;
  const frames = useMemo(() => journey(path), [path]);
  const frame = useMemo(() => encapsulate(bytes), [bytes]);
  const wire = frames[segment];

  const walk = useCallback(
    (index: number, context: AuthoredActivityContext) => {
      setSegment(index);
      setSeen((current) => {
        const next = current.includes(index) ? current : [...current, index];
        // Reading one wire proves nothing. Reading all of them is what shows the pattern.
        if (next.length === frames.length) context.complete('walked-path', 'segments');
        return next;
      });
    },
    [frames.length],
  );

  const resize = useCallback((value: number, context: AuthoredActivityContext) => {
    setBytes(value);
    // The lesson lands at the small end, where the headers outweigh the message.
    if (value <= 8) context.complete('saw-overhead', 'payload');
  }, []);

  const headline = wire
    ? `${wire.note} The IP pair stays ${wire.ip.from} to ${wire.ip.to} on every wire.`
    : 'Pick a wire to see the frame travelling on it.';

  return (
    <AuthoredActivityRuntime
      activity={ENCAP_ACTIVITY}
      activityId="layer-encapsulation"
      eyebrow="The stack"
      title={title ?? 'What a message turns into'}
      description={
        prompt ??
        'Each layer wraps what it was given without editing it. Then the outermost wrapper is thrown away and rebuilt at every routed hop, and the one inside it is not.'
      }
      status={
        <>
          <span>
            <strong>{frame.onWireBytes}</strong> bytes on the wire
          </span>
          <span>{Math.round(frame.overheadShare * 100)}% addressing</span>
          <span>
            wire {segment + 1} of {frames.length}
          </span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Frame on this wire</span>
              <strong>
                {wire?.mac.from} → {wire?.mac.to}
              </strong>
            </div>
            <span>MAC</span>
          </div>
          <ul className="lab-metric-list">
            <li>
              <span>Packet inside it</span>
              <strong>
                {wire?.ip.from} → {wire?.ip.to}
              </strong>
            </li>
            <li>
              <span>Message</span>
              <strong>{bytes} bytes</strong>
            </li>
            <li>
              <span>Addressing around it</span>
              <strong>{frame.overheadBytes} bytes</strong>
            </li>
          </ul>

          <div className="lab-activity-fields">
            {frames.map((item, index) => (
              <Chip key={index} selected={segment === index} onClick={() => walk(index, context)}>
                {item.segment.from.name} to {item.segment.to.name}
              </Chip>
            ))}
          </div>

          <Field label="message size" value={<b>{bytes} bytes</b>}>
            <Slider
              value={bytes}
              min={1}
              max={1400}
              step={1}
              onChange={(value) => resize(value, context)}
              ariaLabel="message size in bytes"
            />
          </Field>
          <div className="lab-activity-fields">
            {SIZES.map((size) => (
              <Chip
                key={size.label}
                selected={bytes === size.bytes}
                onClick={() => resize(size.bytes, context)}
              >
                {size.label}
              </Chip>
            ))}
          </div>

          <ul className="lab-metric-list">
            {HEADERS.filter((header) => header.bytes > 0).map((header) => (
              <li key={header.protocol}>
                <span>
                  {header.protocol} · {header.addressing}
                </span>
                <strong>{header.bytes} B</strong>
              </li>
            ))}
          </ul>
          <p className="lab-note">
            Everything here is inside one organisation, so the IP pair really is untouched. A home router
            doing NAT is the one case that rewrites it, which is a later topic.
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      <EncapScene
        frame={frame}
        path={path}
        frames={frames}
        activeSegment={segment}
        label={`A ${bytes} byte message in a ${frame.onWireBytes} byte frame, on wire ${segment + 1} of ${frames.length}. ${headline}`}
      />
    </AuthoredActivityRuntime>
  );
}

export default LayerEncapsulationLab;
