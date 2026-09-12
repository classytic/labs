'use client';

/**
 * SwitchLearningLab — the first frame floods, the second one does not.
 *
 * Most courses state that a switch "learns MAC addresses" and then ask for it back. The learning
 * is trivial once seen and invisible until then, so this lab makes the table the object on screen:
 * it starts empty, fills as frames arrive, and every forwarding decision visibly reads from it.
 *
 * The transfer step disables a port. That is the moment the model stops being a story about
 * addresses and becomes a thing with consequences, because the table forgets and the switch goes
 * back to flooding.
 */

import { useCallback, useState, type ReactNode } from 'react';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { SwitchScene } from '../../../networking/SwitchScene.js';
import {
  clearTable,
  linkUp,
  makeSwitch,
  sendFrame,
  setPortEnabled,
  type SwitchEvent,
  type SwitchState,
} from '../../../networking/switch.js';

export interface SwitchLearningProps {
  ports?: number;
  connected?: number;
  title?: string;
  prompt?: string;
}

const SWITCH_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Watch a switch learn where everything is',
  objectives: [
    'Predict what a switch does with a destination it has never seen',
    'Trace how the forwarding table is built from the source address of arriving frames',
    'Explain why the second frame of a conversation behaves differently from the first',
    'Predict the effect of a port going down on what the switch knows',
  ],
  success: [
    {
      id: 'flood-prediction',
      source: 'answer',
      key: 'first-frame',
      pendingLabel: 'Predict who receives the very first frame.',
    },
    { id: 'sent-one', source: 'action', key: 'send', pendingLabel: 'Send a frame from any device.' },
    {
      id: 'saw-unicast',
      source: 'metric',
      key: 'unicast',
      pendingLabel: 'Send a reply so the switch can forward to a single port.',
    },
    {
      id: 'port-down',
      source: 'answer',
      key: 'link-down',
      pendingLabel: 'Predict what happens to the table when a port goes down.',
    },
  ],
  questions: [
    {
      id: 'first-frame',
      prompt:
        'The switch was unboxed a second ago and its table is empty. Laptop sends one frame to Printer. Which devices receive it?',
      choices: [
        {
          value: 'printer',
          label: 'Only Printer',
          feedback: 'The switch has no way to know where Printer is yet.',
        },
        { value: 'all', label: 'Every connected device except Laptop' },
        {
          value: 'none',
          label: 'Nobody, the frame is dropped',
          feedback: 'A switch floods rather than discards.',
        },
      ],
      answer: 'all',
      explain:
        'With nothing in the table the switch cannot know which port leads to Printer, so it floods: out of every port with a link, except the one the frame arrived on.',
    },
    {
      id: 'link-down',
      prompt:
        'A device is unplugged and its port goes down. What happens to the entry the switch learned for it?',
      choices: [
        { value: 'kept', label: 'It is kept, so traffic still goes to that port' },
        { value: 'removed', label: 'It is removed, so the switch floods for that address again' },
        { value: 'moved', label: 'It moves to the next free port' },
      ],
      answer: 'removed',
      explain:
        'An entry only means "reachable through this port". When the port has no link that is no longer true, so the entry goes and the switch is back to flooding for that address.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the first frame',
      lead: 'The table is empty. Decide who hears the first frame before you send it.',
      success: 'flood-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Send it',
      lead: 'Click a device to send a frame from it, and watch which cables light up.',
      controls: true,
      success: 'sent-one',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Now send a reply',
      lead: 'Send back the other way. Watch the table, then watch how many cables light this time.',
      controls: true,
      success: 'saw-unicast',
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Read the table',
      lead: 'Every entry was learned from the source address of a frame that arrived. Nothing was configured.',
      controls: true,
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Take a port down',
      lead: 'Click a port on the switch to disable it, and predict what the table does.',
      controls: true,
      success: 'port-down',
    },
  ],
};

export function SwitchLearningLab({
  ports = 8,
  connected = 4,
  title,
  prompt,
}: SwitchLearningProps = {}): ReactNode {
  const [state, setState] = useState<SwitchState>(() => makeSwitch(ports, connected));
  const [events, setEvents] = useState<SwitchEvent[]>([]);
  const [ingress, setIngress] = useState<number>();
  const [delivered, setDelivered] = useState<number[]>([]);
  const [flooded, setFlooded] = useState(false);

  const live = state.ports.filter(linkUp);

  const send = useCallback(
    (fromPort: number, context: AuthoredActivityContext) => {
      // Address the frame to some other connected device, so a single click is a whole exchange.
      const target = state.ports.find((port) => port.id !== fromPort && linkUp(port));
      if (!target?.device) return;
      const result = sendFrame(state, fromPort, target.device.mac);
      setState(result.next);
      setEvents(result.events);
      setIngress(fromPort);
      setDelivered(result.delivered);
      setFlooded(result.flooded);
      context.complete('sent-one');
      if (!result.flooded && result.delivered.length === 1) context.complete('saw-unicast', 'unicast');
    },
    [state],
  );

  const toggle = useCallback((portId: number) => {
    setState((current) => {
      const port = current.ports.find((item) => item.id === portId);
      return port ? setPortEnabled(current, portId, !port.enabled) : current;
    });
    setIngress(undefined);
    setDelivered([]);
  }, []);

  const reset = useCallback(() => {
    setState(makeSwitch(ports, connected));
    setEvents([]);
    setIngress(undefined);
    setDelivered([]);
    setFlooded(false);
  }, [ports, connected]);

  const headline = events.at(-1)?.message ?? 'Nothing has been sent yet, so the table is empty.';
  const sceneLabel = `Eight-port switch. ${state.table.length} address${
    state.table.length === 1 ? '' : 'es'
  } learned. ${delivered.length ? `Frame left by port${delivered.length > 1 ? 's' : ''} ${delivered.join(', ')}.` : ''}`;

  return (
    <AuthoredActivityRuntime
      activity={SWITCH_ACTIVITY}
      activityId="switch-learning"
      eyebrow="Networking"
      title={title ?? 'The switch that learns'}
      description={
        prompt ??
        'A switch is told nothing about the network. It works out where everything is by watching who talks, and until it has, it shouts.'
      }
      status={
        <>
          <span>
            <strong>
              {state.table.length} / {live.length}
            </strong>{' '}
            addresses learned
          </span>
          <span>{live.length} ports with a link</span>
          {delivered.length > 0 && (
            <span data-delivered={!flooded || undefined}>
              {flooded ? `flooded to ${delivered.length}` : `forwarded to port ${delivered[0]}`}
            </span>
          )}
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Learned from traffic</span>
              <strong>Forwarding table</strong>
            </div>
            <span>{state.table.length ? `${state.table.length} entries` : 'empty'}</span>
          </div>
          {state.table.length === 0 ? (
            <p className="lab-note">
              Empty. Until something arrives, the switch has no idea what is plugged into which port.
            </p>
          ) : (
            <ul className="lab-metric-list">
              {state.table.map((entry) => {
                const owner = state.ports.find((port) => port.device?.mac === entry.mac)?.device;
                return (
                  <li key={entry.mac}>
                    <span>{owner?.name ?? entry.mac}</span>
                    <strong>port {entry.port}</strong>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="lab-activity-fields">
            {state.ports.filter(linkUp).map((port) => (
              <Chip key={port.id} selected={ingress === port.id} onClick={() => send(port.id, context)}>
                Send from {port.device!.name}
              </Chip>
            ))}
          </div>
          <div className="lab-activity-fields">
            <Chip selected={false} onClick={() => setState(clearTable(state))} disabled={!state.table.length}>
              Clear table
            </Chip>
            <Chip selected={false} onClick={reset}>
              Reset switch
            </Chip>
          </div>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
      transcript={
        <ol>
          {events.map((event, index) => (
            <li key={index}>{event.message}</li>
          ))}
        </ol>
      }
    >
      <SwitchScene
        state={state}
        ingress={ingress}
        delivered={delivered}
        flooded={flooded}
        onTogglePort={toggle}
        label={sceneLabel}
      />
    </AuthoredActivityRuntime>
  );
}

export default SwitchLearningLab;
