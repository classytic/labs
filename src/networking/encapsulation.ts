/**
 * Encapsulation: what a message actually becomes, and what survives the trip.
 *
 * The stack is normally taught as a mnemonic, which is why students can recite seven layer names
 * and still cannot say what a router changes. Two facts do the real work, and both are checkable:
 *
 * 1. Going down, each layer WRAPS what it was given and never edits it. The message you sent is
 *    still the same bytes at the bottom, sitting inside a few dozen bytes of addressing. For a big
 *    download that overhead is a rounding error; for a single keystroke it is most of the traffic.
 *
 * 2. Going across, the MAC pair is replaced at every routed hop and the IP pair is not. That is the
 *    whole difference between the two kinds of address: one names the next box on this wire, the
 *    other names the far end of the journey. Exams ask it constantly and it is nearly always missed.
 *
 * The one honest caveat is NAT, which does rewrite the source IP at the boundary of a home or
 * office network. The scenario here is deliberately inside one organisation so the rule holds
 * exactly, and the lab says so rather than quietly hoping nobody asks.
 */

export type LayerKind = 'application' | 'transport' | 'network' | 'data-link';

export interface Header {
  kind: LayerKind;
  protocol: string;
  /** Bytes this layer adds. Real sizes: a reader can check them against a capture. */
  bytes: number;
  /**
   * Of those bytes, how many go AFTER the payload. Only Ethernet has any: its 4-byte checksum sits
   * at the end of the frame, which is the whole reason the word "trailer" exists. Drawing it at the
   * front would be neater and would teach a frame layout that does not exist.
   */
  trailerBytes?: number;
  /** What kind of address this header carries, if any. */
  addressing: string | null;
  /** The question this header exists to answer. */
  answers: string;
}

/** Outermost last: this is the order the headers are ADDED going down the stack. */
export const HEADERS: Header[] = [
  {
    kind: 'application',
    protocol: 'HTTP',
    bytes: 0,
    addressing: null,
    answers: 'What is being asked for. This is the message itself, not a wrapper.',
  },
  {
    kind: 'transport',
    protocol: 'TCP',
    bytes: 20,
    addressing: 'port',
    answers: 'Which program on the machine, and where this piece fits in the stream.',
  },
  {
    kind: 'network',
    protocol: 'IPv4',
    bytes: 20,
    addressing: 'IP address',
    answers: 'Which machine, anywhere. Set once by the sender and carried the whole way.',
  },
  {
    kind: 'data-link',
    protocol: 'Ethernet',
    bytes: 18,
    trailerBytes: 4,
    addressing: 'MAC address',
    answers: 'Which box on THIS wire takes it next. Replaced at every routed hop.',
  },
];

export const OVERHEAD_BYTES = HEADERS.reduce((sum, header) => sum + header.bytes, 0);

export interface Encapsulation {
  payloadBytes: number;
  headers: Header[];
  /** Headers added so far, going down. `depth` 0 is the bare message. */
  depth: number;
  onWireBytes: number;
  overheadBytes: number;
  /** Overhead as a share of what is actually transmitted, 0 to 1. */
  overheadShare: number;
}

/** Wrap a payload in the first `depth` headers. Full depth is the frame that goes on the wire. */
export function encapsulate(payloadBytes: number, depth = HEADERS.length): Encapsulation {
  const applied = HEADERS.slice(0, Math.max(0, Math.min(depth, HEADERS.length)));
  const overheadBytes = applied.reduce((sum, header) => sum + header.bytes, 0);
  const onWireBytes = payloadBytes + overheadBytes;
  return {
    payloadBytes,
    headers: applied,
    depth: applied.length,
    onWireBytes,
    overheadBytes,
    overheadShare: onWireBytes === 0 ? 0 : overheadBytes / onWireBytes,
  };
}

/** Unwrap one layer. The payload is never touched, which is the point. */
export const decapsulate = (state: Encapsulation): Encapsulation =>
  encapsulate(state.payloadBytes, Math.max(0, state.depth - 1));

export type NodeKind = 'host' | 'switch' | 'router';

export interface PathNode {
  id: string;
  name: string;
  kind: NodeKind;
  mac: string;
  /** Hosts have one; routers have one per side, so the scene names them by segment instead. */
  ip?: string;
}

/** How deep a device opens the frame before it can do its job. */
export const opensTo = (kind: NodeKind): LayerKind =>
  kind === 'switch' ? 'data-link' : kind === 'router' ? 'network' : 'application';

export interface Segment {
  /** Layer-2 endpoints of this stretch of wire. */
  fromMac: string;
  toMac: string;
  from: PathNode;
  to: PathNode;
  /** Switches sit inside a segment without ending it: they are invisible at layer 3. */
  through: PathNode[];
}

/**
 * Split a path at its layer-3 boundaries. A switch forwards a frame without terminating it, so it
 * does not start a new segment. A router does, because it builds a brand new frame for the next
 * wire. The number of segments is therefore routers + 1, however many switches are in the way.
 */
export function segmentsOf(path: PathNode[]): Segment[] {
  const boundaries = path.filter((node) => node.kind !== 'switch');
  const segments: Segment[] = [];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const from = boundaries[index]!;
    const to = boundaries[index + 1]!;
    const through = path.slice(path.indexOf(from) + 1, path.indexOf(to)).filter((n) => n.kind === 'switch');
    segments.push({ from, to, fromMac: from.mac, toMac: to.mac, through });
  }
  return segments;
}

export interface WireFrame {
  segment: Segment;
  mac: { from: string; to: string };
  /** The same on every segment. That is the whole lesson. */
  ip: { from: string; to: string };
  note: string;
}

export function frameOn(segment: Segment, source: PathNode, destination: PathNode): WireFrame {
  const rebuilt = segment.from.kind === 'router';
  return {
    segment,
    mac: { from: segment.fromMac, to: segment.toMac },
    ip: { from: source.ip ?? '', to: destination.ip ?? '' },
    note: rebuilt
      ? `${segment.from.name} threw away the frame it received and built a new one for this wire. Same packet inside, new MAC addresses outside.`
      : `${segment.from.name} addresses the frame to ${segment.to.name}, the next box on this wire, not to the far end.`,
  };
}

/** Every frame the message travels in, end to end. */
export const journey = (path: PathNode[]): WireFrame[] => {
  const source = path[0]!;
  const destination = path[path.length - 1]!;
  return segmentsOf(path).map((segment) => frameOn(segment, source, destination));
};

export const DEFAULT_PATH: PathNode[] = [
  { id: 'laptop', name: 'Laptop', kind: 'host', mac: 'AA:01', ip: '10.1.0.20' },
  { id: 'switch', name: 'Switch', kind: 'switch', mac: 'SW:00' },
  { id: 'r1', name: 'Router 1', kind: 'router', mac: 'BB:11' },
  { id: 'r2', name: 'Router 2', kind: 'router', mac: 'CC:22' },
  { id: 'server', name: 'Server', kind: 'host', mac: 'DD:33', ip: '10.9.0.7' },
];
