import type { NetworkDoc, NetworkPacket, NetworkTrace } from './contract.js';
import { dijkstra, reconstructPath } from '../algorithms/graph.js';

const primaryIp = (doc: NetworkDoc, deviceId: string): string =>
  doc.devices
    .find((d) => d.id === deviceId)
    ?.interfaces.flatMap((i) => i.addresses ?? [])[0]
    ?.split('/')[0] ?? deviceId;

export function createPacket(
  doc: NetworkDoc,
  from: string,
  to: string,
  protocol: 'icmp' | 'http' = 'icmp',
): NetworkPacket {
  const sourceIp = primaryIp(doc, from);
  const destinationIp = primaryIp(doc, to);
  return {
    id: `${protocol}-${from}-${to}`,
    from,
    to,
    bytes: protocol === 'http' ? 428 : 84,
    layers: [
      {
        kind: 'application',
        protocol: protocol === 'http' ? 'HTTP' : 'Ping',
        summary: protocol === 'http' ? 'GET / HTTP/1.1' : 'Echo request',
      },
      {
        kind: 'transport',
        protocol: protocol === 'http' ? 'TCP' : 'ICMP',
        summary: protocol === 'http' ? '49152 → 80' : 'type 8, code 0',
        fields: protocol === 'http' ? { sourcePort: 49152, destinationPort: 80 } : { type: 8 },
      },
      {
        kind: 'network',
        protocol: 'IPv4',
        summary: `${sourceIp} → ${destinationIp}`,
        fields: { source: sourceIp, destination: destinationIp, ttl: 64 },
      },
      {
        kind: 'data-link',
        protocol: 'Ethernet',
        summary: 'next-hop frame (MAC addresses change each routed hop)',
      },
      { kind: 'physical', protocol: 'Link', summary: 'bits transmitted over the selected medium' },
    ],
  };
}

/** Small deterministic packet trace: topology/path truth is real, protocol narration is explicit. */
export function simulatePacket(
  doc: NetworkDoc,
  from: string,
  to: string,
  protocol: 'icmp' | 'http' = 'icmp',
): NetworkTrace {
  const packet = createPacket(doc, from, to, protocol);
  const upLinks = doc.links.filter((link) => link.state !== 'down');
  const graph = {
    nodes: doc.devices.map((device, index) => ({ id: device.id, x: index, y: 0 })),
    edges: upLinks.map((link) => ({
      id: link.id,
      from: link.a.deviceId,
      to: link.b.deviceId,
      weight: link.cost ?? link.latencyMs ?? 1,
    })),
  };
  const result = dijkstra(graph, from, to);
  const path = reconstructPath(result.previous, from, to);
  const events: NetworkTrace['events'] = [
    {
      type: 'packet-created',
      at: from,
      packet,
      message: `${protocol.toUpperCase()} packet created at ${from}.`,
    },
  ];
  if (!path.length) {
    events.push({
      type: 'packet-dropped',
      at: from,
      reason: 'unreachable',
      message: `No available route from ${from} to ${to}.`,
    });
    return { delivered: false, path: [], totalLatencyMs: 0, events };
  }

  let totalLatencyMs = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const at = path[i]!;
    const next = path[i + 1]!;
    const link = upLinks.find(
      (candidate) =>
        (candidate.a.deviceId === at && candidate.b.deviceId === next) ||
        (candidate.b.deviceId === at && candidate.a.deviceId === next),
    );
    if (!link) continue;
    if (i === 0) {
      events.push({
        type: 'arp-requested',
        at,
        target: next,
        message: `${at} asks for the next hop's hardware address.`,
      });
      events.push({
        type: 'arp-resolved',
        at,
        target: next,
        message: `${next} answers; ${at} can now build the Ethernet frame.`,
      });
    }
    const device = doc.devices.find((d) => d.id === at);
    if (device?.kind === 'router')
      events.push({
        type: 'route-selected',
        at,
        next,
        message: `${device.label} selects the lowest-cost available next hop: ${next}.`,
      });
    events.push({
      type: 'frame-sent',
      at,
      linkId: link.id,
      next,
      packet,
      message: `${at} sends the frame over ${link.label ?? link.id}.`,
    });
    totalLatencyMs += link.latencyMs ?? 1;
    events.push({
      type: 'frame-received',
      at: next,
      linkId: link.id,
      from: at,
      packet,
      message: `${next} receives and inspects the frame.`,
    });
  }
  events.push({
    type: 'packet-delivered',
    at: to,
    packet,
    message: `${packet.layers[0]?.protocol ?? 'Packet'} delivered to ${to} in ${totalLatencyMs} ms simulated time.`,
  });
  return { delivered: true, path, totalLatencyMs, events };
}
