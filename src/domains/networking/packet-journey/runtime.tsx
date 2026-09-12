'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import type { NetworkDoc, NetworkEvent } from '../../../networking/contract.js';
import { HOME_NETWORK, COMPANY_NETWORK } from '../../../networking/presets.js';
import { simulatePacket } from '../../../networking/simulation.js';
import { NetworkScene } from '../../../networking/NetworkScene.js';
import { PacketInspector } from '../../../networking/PacketInspector.js';

export interface PacketJourneyLabProps {
  doc?: NetworkDoc;
  preset?: 'home' | 'company';
  protocol?: 'icmp' | 'http';
  from?: string;
  to?: string;
  title?: string;
  prompt?: string;
}

const eventPacket = (event: NetworkEvent) => ('packet' in event ? event.packet : undefined);
const eventLink = (event: NetworkEvent) => ('linkId' in event ? event.linkId : undefined);

const PACKET_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Trace and diagnose a packet journey',
  objectives: [
    'Predict which protocol resolves a local next hop',
    'Trace a packet across devices and layers',
    'Diagnose where delivery fails and propose a repair',
  ],
  success: [
    {
      id: 'protocol-prediction',
      source: 'answer',
      key: 'protocol',
      pendingLabel: 'Choose the local discovery protocol.',
    },
    {
      id: 'journey-started',
      source: 'action',
      key: 'next-event',
      pendingLabel: 'Advance the packet by one event.',
    },
    {
      id: 'trace-complete',
      source: 'metric',
      key: 'delivered',
      pendingLabel: 'Trace the packet through the final event.',
    },
    { id: 'diagnosis', source: 'answer', key: 'failure', pendingLabel: 'Diagnose the routing failure.' },
  ],
  questions: [
    {
      id: 'protocol',
      prompt: 'Before sending on a local link, which protocol discovers the next hop’s hardware address?',
      choices: [
        {
          value: 'dns',
          label: 'DNS',
          feedback: 'DNS resolves names, not the local next-hop hardware address.',
        },
        { value: 'arp', label: 'ARP' },
        {
          value: 'dhcp',
          label: 'DHCP',
          feedback: 'DHCP supplies configuration; it does not resolve each next hop.',
        },
      ],
      answer: 'arp',
      explain: 'ARP maps the next-hop IPv4 address to a link-layer address.',
    },
    {
      id: 'failure',
      prompt: 'If one routed link fails, when can the packet still arrive?',
      choices: [
        { value: 'always', label: 'Always' },
        { value: 'alternate', label: 'When the routing table provides an alternate path' },
        { value: 'never', label: 'Never' },
      ],
      answer: 'alternate',
      explain: 'Delivery survives only when routing can select another reachable path.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the first dependency',
      lead: 'Identify what must happen before a local frame can leave.',
      success: 'protocol-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Start the exchange',
      lead: 'Advance one event and identify the active device and layer.',
      controls: true,
      success: 'journey-started',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Trace every hop',
      lead: 'Follow the changing frame and stable end-to-end packet through the final event.',
      controls: true,
      success: 'trace-complete',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the layers',
      lead: 'Use the packet inspector and transcript to explain what each layer contributes.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Diagnose a broken route',
      lead: 'Apply the trace model to a failed link.',
      success: 'diagnosis',
    },
  ],
};

export function PacketJourneyLab({
  doc: authoredDoc,
  preset = 'home',
  protocol = 'http',
  from,
  to,
  title,
  prompt,
}: PacketJourneyLabProps = {}): ReactNode {
  const doc = authoredDoc ?? (preset === 'company' ? COMPANY_NETWORK : HOME_NETWORK);
  const source = from ?? doc.devices[0]?.id ?? '';
  const target = to ?? doc.devices.at(-1)?.id ?? '';
  const trace = useMemo(() => simulatePacket(doc, source, target, protocol), [doc, source, target, protocol]);
  const [step, setStep] = useState(0);
  const clamped = Math.min(step, Math.max(0, trace.events.length - 1));
  const event = trace.events[clamped];
  const packet = (event ? eventPacket(event) : undefined) ?? trace.events.map(eventPacket).find(Boolean);

  const advance = (context: AuthoredActivityContext): void => {
    const next = Math.min(trace.events.length - 1, clamped + 1);
    setStep(next);
    if (context.sequence.current.id === 'act') context.complete('journey-started');
    if (next >= trace.events.length - 1)
      context.complete('trace-complete', trace.delivered ? 'delivered' : 'unreachable');
  };

  return (
    <AuthoredActivityRuntime
      activity={PACKET_ACTIVITY}
      activityId="packet-journey"
      eyebrow="Networking"
      title={title ?? doc.title ?? 'Packet journey'}
      description={prompt ?? 'Predict, trace, explain, and diagnose one exchange across the network stack.'}
      status={
        <>
          <span>
            <strong>{trace.path.length - 1} hops</strong> · {trace.totalLatencyMs} ms
          </span>
          <span className="network-route-path">{trace.path.join(' → ') || 'No route'}</span>
          <span className="network-delivery" data-delivered={trace.delivered || undefined}>
            {trace.delivered ? 'Delivered' : 'Unreachable'}
          </span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Inspect</span>
              <strong>Packet layers</strong>
            </div>
            <span>{protocol.toUpperCase()}</span>
          </div>
          {packet && <PacketInspector packet={packet} />}
          {(context.sequence.current.id === 'act' || context.sequence.current.id === 'observe') && (
            <div className="lab-activity-fields">
              <Chip
                selected={false}
                onClick={() => setStep((value) => Math.max(0, value - 1))}
                disabled={clamped === 0}
              >
                Previous
              </Chip>
              <ActivityProgress event={clamped + 1} total={trace.events.length} />
              <Chip
                selected={clamped < trace.events.length - 1}
                onClick={() => advance(context)}
                disabled={clamped >= trace.events.length - 1}
              >
                {clamped >= trace.events.length - 1 ? 'Delivered' : 'Next event'}
              </Chip>
            </div>
          )}
        </>
      )}
      transcript={
        <ol>
          {trace.events.map((item, index) => (
            <li key={`${item.type}-${index}`} data-current={index === clamped || undefined}>
              {item.message}
            </li>
          ))}
        </ol>
      }
    >
      {(context) => (
        <>
          <NetworkScene
            doc={doc}
            activeDeviceId={event?.at}
            activeLinkId={event ? eventLink(event) : undefined}
            ariaLabel={`${doc.title ?? 'Network'}. ${event?.message ?? ''}`}
          />
          {event && (
            <div className="lab-evidence-surface">
              <strong>{event.type.replaceAll('-', ' ')}</strong>
              <span>{event.message}</span>
            </div>
          )}
          {context.sequence.current.id === 'observe' && clamped < trace.events.length - 1 && (
            <Chip selected onClick={() => advance(context)}>
              Next event
            </Chip>
          )}
          <LiveRegion>{event?.message}</LiveRegion>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}

function ActivityProgress({ event, total }: { event: number; total: number }): ReactNode {
  return (
    <span className="lab-control-hint">
      Event {event} of {total}
    </span>
  );
}

export default PacketJourneyLab;
