'use client';

/**
 * VpnTunnelLab — who can see what, and what a VPN actually changes about that.
 *
 * This subject is taught by advertising, so students arrive with two wrong beliefs at once: that a
 * VPN makes them anonymous, and that the provider can read their banking password. Correcting each
 * one separately produces a shrug. Putting all four setups in front of them and letting them read
 * the same three fields off each watcher produces the actual rule, which is sharper than either
 * belief: a VPN moves the watching from your network operator to the VPN company, and HTTPS is what
 * decides whether the watcher can read the contents or only the addresses.
 *
 * The transfer question is the one that matters outside an exam. A free VPN's product is the view
 * it just acquired, and the lab has already shown that this view exists rather than asserting it.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { VpnScene } from '../../../networking/VpnScene.js';
import {
  OBSERVERS,
  TUNNEL_OVERHEAD_BYTES,
  canReadContents,
  canSeeDestination,
  observe,
  observersFor,
  type ObserverId,
  type Setup,
} from '../../../networking/vpn.js';

export interface VpnTunnelProps {
  vpn?: boolean;
  https?: boolean;
  title?: string;
  prompt?: string;
}

const VPN_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Work out who can see what',
  objectives: [
    'Say what a tunnel hides, and from which watcher',
    'Explain why a VPN moves trust rather than removing it',
    'Separate what HTTPS protects from what a VPN protects',
    'Judge an offer of a free VPN on what the provider can see',
  ],
  success: [
    {
      id: 'predict-isp',
      source: 'answer',
      key: 'what-isp-sees',
      pendingLabel: 'Predict what your provider can still see.',
    },
    {
      id: 'checked-watchers',
      source: 'metric',
      key: 'watchers',
      pendingLabel: 'Read the same three fields from every watcher.',
    },
    {
      id: 'tried-setups',
      source: 'metric',
      key: 'setups',
      pendingLabel: 'Try all four combinations of tunnel and HTTPS.',
    },
    {
      id: 'free-vpn',
      source: 'answer',
      key: 'free-vpn',
      pendingLabel: 'Decide what a free provider is being paid in.',
    },
  ],
  questions: [
    {
      id: 'what-isp-sees',
      prompt:
        'You visit an HTTPS site with no VPN. Your internet provider is carrying every packet. What can they tell about it?',
      choices: [
        {
          value: 'nothing',
          label: 'Nothing: HTTPS encrypts the traffic',
          feedback:
            'HTTPS encrypts the contents. The address on the outside has to stay readable or nothing could deliver it.',
        },
        { value: 'site-only', label: 'Which site you visited and when, but not what you asked for' },
        {
          value: 'everything',
          label: 'Everything, including what you typed',
          feedback: 'That was true before HTTPS was everywhere. The contents really are covered now.',
        },
      ],
      answer: 'site-only',
      explain:
        'Encryption protects what is inside the packet, never the address on the outside, because every device along the way needs that address to move it along. So a provider builds a list of which sites you visited and when without ever reading a word of the traffic.',
    },
    {
      id: 'free-vpn',
      prompt:
        'A VPN app is free, with no adverts and no subscription. What are they most likely being paid in?',
      choices: [
        {
          value: 'goodwill',
          label: 'Nothing: it is a loss leader for the paid tier',
          feedback:
            'Sometimes true, and it is worth asking which one you are looking at rather than assuming.',
        },
        {
          value: 'the-view',
          label: 'The one thing they just acquired: a list of every site each user visits',
        },
        {
          value: 'bandwidth',
          label: 'Spare bandwidth they had anyway',
          feedback: 'Carrying other people’s traffic is the expensive part, not the spare part.',
        },
      ],
      answer: 'the-view',
      explain:
        'You have just watched the tunnel take the view away from the café and the provider and hand it to the gateway. That view is worth money, and a company with no other income has an obvious reason to sell it. The question to ask about any VPN is not whether it is secure, it is who you would rather was watching.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'What does your provider know?',
      lead: 'No VPN yet. Just an ordinary HTTPS site and the company carrying your packets.',
      success: 'predict-isp',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Look from each position',
      lead: 'Same traffic, four different vantage points. Read the three fields from each one.',
      controls: true,
      success: 'checked-watchers',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Switch the tunnel on',
      lead: 'Watch what the café and the provider lose, and notice who gains it.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Two protections, two jobs',
      lead: 'Try all four combinations. HTTPS decides what is readable, the tunnel decides who is watching.',
      controls: true,
      success: 'tried-setups',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'So who would you rather was watching?',
      lead: 'You have seen exactly what a provider gains. Now judge an offer.',
      controls: true,
      success: 'free-vpn',
    },
  ],
};

const key = (setup: Setup): string => `${setup.vpn ? 'v' : '-'}${setup.https ? 'h' : '-'}`;

export function VpnTunnelLab({ vpn = false, https = true, title, prompt }: VpnTunnelProps = {}): ReactNode {
  const [setup, setSetup] = useState<Setup>({ vpn, https });
  const [watcher, setWatcher] = useState<ObserverId>('isp');
  const [seenWatchers, setSeenWatchers] = useState<ObserverId[]>(['isp']);
  const [seenSetups, setSeenSetups] = useState<string[]>([key({ vpn, https })]);

  const watchers = useMemo(() => observersFor(setup), [setup]);
  // Turning the tunnel off removes the gateway, so the view has to fall back to something real.
  const active: ObserverId = watchers.some((item) => item.id === watcher) ? watcher : 'isp';
  const sighting = observe(active, setup)!;
  const namesSite = canSeeDestination(setup).filter((id) => id !== 'website');
  const readsAll = canReadContents(setup).filter((id) => id !== 'website');

  const chain = useMemo(
    () => [
      { id: 'you', name: 'You' },
      // The diagram uses the short names: a box 108 units wide cannot hold "Your internet provider".
      ...watchers.map((item) => ({ id: item.id, name: item.short, watcher: item })),
    ],
    [watchers],
  );
  const tunnelEndsAt = setup.vpn ? chain.findIndex((node) => node.id === 'gateway') : undefined;

  const look = useCallback((id: ObserverId, context: AuthoredActivityContext) => {
    setWatcher(id);
    setSeenWatchers((current) => {
      const next = current.includes(id) ? current : [...current, id];
      if (next.length >= OBSERVERS.length) context.complete('checked-watchers', 'watchers');
      return next;
    });
  }, []);

  const change = useCallback((next: Setup, context: AuthoredActivityContext) => {
    setSetup(next);
    setSeenSetups((current) => {
      const seen = current.includes(key(next)) ? current : [...current, key(next)];
      if (seen.length >= 4) context.complete('tried-setups', 'setups');
      return seen;
    });
  }, []);

  const headline = sighting.verdict;

  return (
    <AuthoredActivityRuntime
      activity={VPN_ACTIVITY}
      activityId="vpn-tunnel"
      eyebrow="Privacy"
      title={title ?? 'Who can see what'}
      description={
        prompt ??
        'A VPN wraps your packet inside one addressed to the gateway. Follow what that does to each watcher on the path, including the new one it adds.'
      }
      status={
        <>
          <span>{setup.vpn ? 'tunnel on' : 'no tunnel'}</span>
          <span>{setup.https ? 'HTTPS' : 'plain HTTP'}</span>
          <span>
            <strong>{namesSite.length}</strong> can name the site
          </span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>Looking from</span>
              <strong>{sighting.observer.name}</strong>
            </div>
            <span>{setup.vpn ? 'tunnel on' : 'no tunnel'}</span>
          </div>

          <div className="lab-activity-fields">
            {watchers.map((item) => (
              <Chip key={item.id} selected={active === item.id} onClick={() => look(item.id, context)}>
                {item.name}
              </Chip>
            ))}
          </div>

          <div className="lab-activity-fields">
            <Chip selected={setup.vpn} onClick={() => change({ ...setup, vpn: !setup.vpn }, context)}>
              VPN tunnel {setup.vpn ? 'on' : 'off'}
            </Chip>
            <Chip selected={setup.https} onClick={() => change({ ...setup, https: !setup.https }, context)}>
              HTTPS {setup.https ? 'on' : 'off'}
            </Chip>
          </div>

          <ul className="lab-metric-list">
            <li>
              <span>Can name the site</span>
              <strong>{namesSite.length ? namesSite.length : 'nobody in between'}</strong>
            </li>
            <li>
              <span>Can read the contents</span>
              <strong>{readsAll.length ? readsAll.length : 'nobody in between'}</strong>
            </li>
            <li>
              <span>Room lost to the tunnel</span>
              <strong>{setup.vpn ? `${TUNNEL_OVERHEAD_BYTES} bytes per packet` : 'none'}</strong>
            </li>
          </ul>

          <p className="lab-note">{sighting.observer.where}.</p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={headline}
    >
      {(context) => (
        <VpnScene
          sighting={sighting}
          chain={chain}
          tunnelEndsAt={tunnelEndsAt != null && tunnelEndsAt >= 0 ? tunnelEndsAt : undefined}
          selected={active}
          onSelect={(id) => look(id as ObserverId, context)}
          label={`${sighting.observer.name}: sender ${sighting.from.value}, destination ${sighting.to.hidden ? 'hidden' : sighting.to.value}, contents ${sighting.contents.hidden ? 'unreadable' : 'readable'}.`}
        />
      )}
    </AuthoredActivityRuntime>
  );
}

export default VpnTunnelLab;
