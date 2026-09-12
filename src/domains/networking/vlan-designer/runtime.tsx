'use client';

/**
 * VlanDesignerLab — two networks in one box, and the door between them.
 *
 * The textbook line is "a VLAN is a virtual LAN", which teaches nothing because it defines a term
 * with the same term. The definition that survives contact with a real network is: a VLAN is a
 * BROADCAST DOMAIN. So the lab is built entirely around one observable event, a broadcast, and the
 * learner watches where it stops.
 *
 * The move that lands it is reassigning a port. No cable is touched, nothing is unplugged, and the
 * set of machines that hear the broadcast changes. That is the whole reason VLANs exist, and it is
 * a single click here.
 *
 * The last phase is the half usually skipped. If the isolation is real, nothing can cross, and that
 * is a problem: Sales does need the file server. Turning on a layer-3 interface makes crossing
 * possible while the broadcast isolation stays exactly as it was, because routing happens a layer
 * up. Every crossing now passes one point, which is precisely where a firewall rule would sit.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { CheckButton, Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { VlanScene } from '../../../networking/VlanScene.js';
import {
  broadcastFrom,
  domainCount,
  isLive,
  makeVlanSwitch,
  sendBetween,
  setPortVlan,
  setRouting,
  type VlanState,
} from '../../../networking/vlan.js';

export interface VlanDesignerProps {
  connectedPorts?: number;
  routing?: boolean;
  title?: string;
  prompt?: string;
}

const VLAN_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Split one switch into two networks',
  objectives: [
    'State what a VLAN is in terms of what a broadcast reaches',
    'Change which machines hear a broadcast without touching a cable',
    'Explain why nothing crosses between VLANs at layer 2',
    'Describe what a layer-3 interface adds, and what it deliberately does not',
  ],
  success: [
    {
      id: 'predict-broadcast',
      source: 'answer',
      key: 'who-hears',
      pendingLabel: 'Predict which machines hear the broadcast.',
    },
    {
      id: 'moved-a-port',
      source: 'metric',
      key: 'reassigned',
      pendingLabel: 'Move a port into the other VLAN and broadcast again.',
    },
    {
      id: 'tried-crossing',
      source: 'metric',
      key: 'crossing',
      pendingLabel: 'Try to send from one VLAN to the other.',
    },
    {
      id: 'why-isolated',
      source: 'answer',
      key: 'what-routing-does',
      pendingLabel: 'Say what turning on routing changes, and what it leaves alone.',
    },
  ],
  questions: [
    {
      id: 'who-hears',
      prompt:
        'Eight machines share one switch. Ports 1 to 4 are in VLAN 10 and ports 5 to 8 are in VLAN 20. Sales, on port 1, sends a broadcast. Who receives it?',
      choices: [
        {
          value: 'all',
          label: 'Every machine on the switch, since they share one box',
          feedback: 'One chassis, but the switch will not carry a frame out of its VLAN.',
        },
        { value: 'own-vlan', label: 'Only the live machines in VLAN 10' },
        {
          value: 'neighbours',
          label: 'Only the ports either side of port 1',
          feedback: 'Physical position on the panel means nothing here.',
        },
      ],
      answer: 'own-vlan',
      explain:
        'A broadcast floods its own broadcast domain and stops. The VLAN tag on each access port is what defines that domain, so ports 2, 3 and 4 receive it and ports 5 and 6 never see it at all.',
    },
    {
      id: 'what-routing-does',
      prompt: 'A layer-3 interface is added between VLAN 10 and VLAN 20. What changes?',
      choices: [
        {
          value: 'merged',
          label: 'The two VLANs are now one network again',
          feedback: 'If that were true there would be no reason to have split them.',
        },
        {
          value: 'crossing-only',
          label: 'Directed traffic can cross, but broadcasts still stop at the VLAN edge',
        },
        {
          value: 'broadcast-too',
          label: 'Broadcasts now reach both VLANs as well',
          feedback: 'Broadcasts are a layer-2 event. A layer-3 interface is not in that conversation.',
        },
      ],
      answer: 'crossing-only',
      explain:
        'Routing works a layer above the broadcast domain, so it can carry addressed traffic between the two networks while leaving the flooding boundary untouched. That is the point: you keep the isolation and you get one controlled door, which is exactly where a policy belongs.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Who hears it?',
      lead: 'One switch, eight ports, two VLANs. Sales is about to shout.',
      success: 'predict-broadcast',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Move a port, move a machine',
      lead: 'Click any port to reassign it to the other VLAN, then broadcast again. No cable moves.',
      controls: true,
      success: 'moved-a-port',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Two networks, one box',
      lead: 'The tinted regions are not decoration. Each one is a separate broadcast domain that happens to share a power supply.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Now try to cross',
      lead: 'Send from a machine in one VLAN to a machine in the other. With no layer-3 interface there is no path at all.',
      controls: true,
      success: 'tried-crossing',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'One door, on purpose',
      lead: 'Turn the layer-3 interface on and watch what changes. Then check what did not.',
      controls: true,
      success: 'why-isolated',
    },
  ],
};

type Result =
  | { kind: 'broadcast'; source: number; reached: number[]; blocked: number[]; message: string }
  | { kind: 'send'; source: number; target: number; delivered: boolean; viaRouter: boolean; message: string };

export function VlanDesignerLab({
  connectedPorts = 6,
  routing = false,
  title,
  prompt,
}: VlanDesignerProps = {}): ReactNode {
  const [state, setState] = useState<VlanState>(() => ({
    ...makeVlanSwitch(connectedPorts),
    routing,
  }));
  const [source, setSource] = useState(1);
  const [target, setTarget] = useState(5);
  const [result, setResult] = useState<Result | null>(null);

  const livePorts = useMemo(() => state.ports.filter(isLive), [state.ports]);
  const domains = domainCount(state);

  // Clicking a port drops it into the next VLAN. That the picture changes without a cable moving is
  // the entire lesson, so it stays a one-click action rather than a form.
  const cyclePort = useCallback((portId: number, context: AuthoredActivityContext) => {
    setState((current) => {
      const port = current.ports.find((item) => item.id === portId);
      if (!port) return current;
      const order = current.vlans.map((vlan) => vlan.id);
      const next = order[(order.indexOf(port.vlan) + 1) % order.length]!;
      return setPortVlan(current, portId, next);
    });
    setResult(null);
    context.complete('moved-a-port', 'reassigned');
  }, []);

  const doBroadcast = useCallback(() => {
    const outcome = broadcastFrom(state, source);
    setResult({ kind: 'broadcast', source, ...outcome });
  }, [state, source]);

  const doSend = useCallback(
    (context: AuthoredActivityContext) => {
      const outcome = sendBetween(state, source, target);
      setResult({ kind: 'send', source, target, ...outcome });
      const from = state.ports.find((port) => port.id === source);
      const to = state.ports.find((port) => port.id === target);
      if (from && to && from.vlan !== to.vlan) context.complete('tried-crossing', 'crossing');
    },
    [state, source, target],
  );

  const headline = result
    ? result.message
    : `Two VLANs on one switch, carrying ${domains} separate broadcast domain${domains === 1 ? '' : 's'}. Pick a machine and send something.`;

  return (
    <AuthoredActivityRuntime
      activity={VLAN_ACTIVITY}
      activityId="vlan-designer"
      eyebrow="Segmentation"
      title={title ?? 'Two networks in one switch'}
      description={
        prompt ??
        'A VLAN is not a virtual anything. It is a broadcast domain, and you can watch where one stops.'
      }
      status={
        <>
          <span>
            <strong>{domains}</strong> broadcast domain{domains === 1 ? '' : 's'}
          </span>
          <span>{state.routing ? 'layer 3 on' : 'no routing'}</span>
          {result?.kind === 'send' ? (
            <span data-delivered={result.delivered || undefined}>
              {result.delivered ? (result.viaRouter ? 'via router' : 'direct') : 'no path'}
            </span>
          ) : null}
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Sending from</span>
              <strong>
                {state.ports.find((port) => port.id === source)?.device?.name ?? `port ${source}`}
              </strong>
            </div>
            <span>VLAN {state.ports.find((port) => port.id === source)?.vlan}</span>
          </div>

          <div className="lab-activity-fields">
            {livePorts.map((port) => (
              <Chip key={port.id} selected={source === port.id} onClick={() => setSource(port.id)}>
                {port.device!.name}
              </Chip>
            ))}
          </div>

          <div className="lab-activity-fields">
            <CheckButton onClick={doBroadcast}>Broadcast to everyone</CheckButton>
          </div>

          <div className="network-inspector-heading">
            <div>
              <span>Or send directly to</span>
              <strong>
                {state.ports.find((port) => port.id === target)?.device?.name ?? `port ${target}`}
              </strong>
            </div>
            <span>VLAN {state.ports.find((port) => port.id === target)?.vlan}</span>
          </div>

          <div className="lab-activity-fields">
            {livePorts
              .filter((port) => port.id !== source)
              .map((port) => (
                <Chip key={port.id} selected={target === port.id} onClick={() => setTarget(port.id)}>
                  {port.device!.name}
                </Chip>
              ))}
          </div>

          <div className="lab-activity-fields">
            <CheckButton onClick={() => doSend(context)}>Send</CheckButton>
            <Chip
              selected={state.routing}
              onClick={() => {
                setState((current) => setRouting(current, !current.routing));
                setResult(null);
              }}
            >
              Layer-3 interface {state.routing ? 'on' : 'off'}
            </Chip>
          </div>

          <p className="lab-note">
            Click a port on the switch to move that machine into the other VLAN. Nothing is unplugged.
          </p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <VlanScene
          state={state}
          source={result ? result.source : source}
          reached={
            result?.kind === 'broadcast'
              ? result.reached
              : result?.kind === 'send' && result.delivered
                ? [result.target]
                : []
          }
          blocked={result?.kind === 'broadcast' ? result.blocked : []}
          viaRouter={result?.kind === 'send' && result.viaRouter}
          onPortClick={(portId) => cyclePort(portId, context)}
          label={headline}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default VlanDesignerLab;
