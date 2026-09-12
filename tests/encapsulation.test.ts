import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PATH,
  HEADERS,
  OVERHEAD_BYTES,
  decapsulate,
  encapsulate,
  journey,
  opensTo,
  segmentsOf,
} from '../src/networking/encapsulation.js';

describe('wrapping a message', () => {
  it('adds the real header sizes and never touches the payload', () => {
    const frame = encapsulate(100);
    expect(OVERHEAD_BYTES).toBe(58); // TCP 20 + IPv4 20 + Ethernet 14 header and 4 trailer
    expect(frame.onWireBytes).toBe(158);
    expect(frame.payloadBytes).toBe(100);
  });

  it('unwraps back to exactly what went in', () => {
    let state = encapsulate(100);
    for (let i = 0; i < HEADERS.length; i++) state = decapsulate(state);
    expect(state.depth).toBe(0);
    expect(state.payloadBytes).toBe(100);
    expect(state.onWireBytes).toBe(100);
  });

  it('never lets the payload change on the way down', () => {
    for (let depth = 0; depth <= HEADERS.length; depth++) {
      expect(encapsulate(512, depth).payloadBytes).toBe(512);
    }
  });

  it('grows the frame by exactly one header at a time', () => {
    let previous = encapsulate(100, 0).onWireBytes;
    for (let depth = 1; depth <= HEADERS.length; depth++) {
      const state = encapsulate(100, depth);
      expect(state.onWireBytes - previous).toBe(HEADERS[depth - 1]!.bytes);
      previous = state.onWireBytes;
    }
  });

  it('puts Ethernet bytes on BOTH sides of the payload, which is what a trailer is', () => {
    const ethernet = HEADERS.find((header) => header.protocol === 'Ethernet')!;
    expect(ethernet.trailerBytes).toBe(4);
    expect(ethernet.bytes - ethernet.trailerBytes!).toBe(14);
    // Nothing else has a trailer, so no other header may claim one.
    expect(HEADERS.filter((header) => header.trailerBytes).length).toBe(1);
  });

  it('clamps a nonsense depth rather than inventing headers', () => {
    expect(encapsulate(100, 99).depth).toBe(HEADERS.length);
    expect(encapsulate(100, -3).depth).toBe(0);
  });
});

describe('the overhead is the same size whatever it is carrying', () => {
  it('is a rounding error on a bulk transfer', () => {
    expect(encapsulate(1400).overheadShare).toBeLessThan(0.05);
  });

  it('is most of the traffic for a single keystroke', () => {
    // One byte typed into a remote shell still costs a full set of headers.
    const keystroke = encapsulate(1);
    expect(keystroke.onWireBytes).toBe(59);
    expect(keystroke.overheadShare).toBeGreaterThan(0.95);
  });

  it('costs the same 58 bytes either way, which is why small packets are wasteful', () => {
    expect(encapsulate(1).overheadBytes).toBe(encapsulate(1400).overheadBytes);
  });
});

describe('who opens how far', () => {
  it('stops a switch at the outermost header', () => {
    expect(opensTo('switch')).toBe('data-link');
  });

  it('lets a router open one more, and only one more', () => {
    expect(opensTo('router')).toBe('network');
  });

  it('gives the whole thing to the machine it was addressed to', () => {
    expect(opensTo('host')).toBe('application');
  });
});

describe('what changes on the way across', () => {
  const frames = journey(DEFAULT_PATH);

  it('has one segment per routed hop, however many switches are in the way', () => {
    // Laptop, switch, router, router, server: two routers, so three segments.
    expect(frames).toHaveLength(3);
    expect(segmentsOf(DEFAULT_PATH)).toHaveLength(3);
  });

  it('does not let a switch end a segment, because it is invisible at layer 3', () => {
    const endpoints = segmentsOf(DEFAULT_PATH).flatMap((segment) => [segment.from.id, segment.to.id]);
    expect(endpoints).not.toContain('switch');
    expect(segmentsOf(DEFAULT_PATH)[0]!.through.map((node) => node.id)).toEqual(['switch']);
  });

  it('gives every segment a DIFFERENT MAC pair', () => {
    const pairs = frames.map((frame) => `${frame.mac.from}>${frame.mac.to}`);
    expect(new Set(pairs).size).toBe(frames.length);
  });

  it('gives every segment the SAME IP pair, which is the exam answer', () => {
    for (const frame of frames) {
      expect(frame.ip).toEqual({ from: '10.1.0.20', to: '10.9.0.7' });
    }
  });

  it('addresses the first frame to the router, not to the server', () => {
    // The single most common wrong answer: students put the destination MAC of the far end here.
    expect(frames[0]!.mac.to).toBe('BB:11');
    expect(frames[0]!.mac.to).not.toBe('DD:33');
    expect(frames[0]!.ip.to).toBe('10.9.0.7');
  });

  it('says a router rebuilds the frame rather than editing the one it got', () => {
    expect(frames[1]!.note).toContain('built a new one');
    expect(frames[0]!.note).not.toContain('built a new one');
  });

  it('adds a segment when another router joins the path, and still no new IP pair', () => {
    const longer = [
      ...DEFAULT_PATH.slice(0, 4),
      { id: 'r3', name: 'Router 3', kind: 'router' as const, mac: 'EE:44' },
      DEFAULT_PATH[4]!,
    ];
    const extended = journey(longer);
    expect(extended).toHaveLength(4);
    expect(new Set(extended.map((frame) => frame.ip.to)).size).toBe(1);
  });
});
