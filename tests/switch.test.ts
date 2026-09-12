import { describe, expect, it } from 'vitest';
import {
  clearTable,
  linkUp,
  makeSwitch,
  sendFrame,
  setPortEnabled,
  type SwitchState,
} from '../src/networking/switch.js';

const base = makeSwitch(8, 4);
const macOf = (state: SwitchState, port: number) => state.ports.find((p) => p.id === port)!.device!.mac;

describe('a switch starts knowing nothing', () => {
  it('has an empty table when unboxed', () => {
    expect(base.table).toEqual([]);
  });

  it('floods the very first frame, because the destination is unknown', () => {
    const result = sendFrame(base, 1, macOf(base, 2));
    expect(result.flooded).toBe(true);
    // Out of every other connected port, never back where it came from.
    expect(result.delivered).toEqual([2, 3, 4]);
    expect(result.delivered).not.toContain(1);
  });

  it('behaves exactly like a hub while its table is empty', () => {
    // This is the sentence students are asked to memorise. It is a consequence, not a rule.
    const result = sendFrame(base, 1, macOf(base, 4));
    expect(result.delivered.length).toBe(3);
  });
});

describe('learning', () => {
  it('learns the SOURCE address, not the destination', () => {
    const after = sendFrame(base, 1, macOf(base, 2)).next;
    expect(after.table).toEqual([{ mac: macOf(base, 1), port: 1 }]);
    // The destination is still unknown: nothing has been heard FROM it yet.
    expect(after.table.some((entry) => entry.mac === macOf(base, 2))).toBe(false);
  });

  it('forwards to one port once both sides have spoken', () => {
    const first = sendFrame(base, 1, macOf(base, 2));
    const reply = sendFrame(first.next, 2, macOf(base, 1));
    expect(reply.flooded).toBe(false);
    expect(reply.delivered).toEqual([1]);
  });

  it('is the whole reason a switch beats a hub, and it takes exactly one frame', () => {
    const conversation = sendFrame(base, 1, macOf(base, 2));
    const reply = sendFrame(conversation.next, 2, macOf(base, 1));
    const third = sendFrame(reply.next, 1, macOf(base, 2));
    expect(conversation.flooded).toBe(true);
    expect(third.flooded).toBe(false);
    expect(third.delivered).toEqual([2]);
  });

  it('relearns when a device moves to a different port', () => {
    const learned = sendFrame(base, 1, macOf(base, 2)).next;
    const moved: SwitchState = {
      ports: learned.ports.map((port) =>
        port.id === 5 ? { ...port, device: { name: 'Laptop', mac: macOf(base, 1) } } : port,
      ),
      table: learned.table,
    };
    const result = sendFrame(moved, 5, macOf(base, 2));
    expect(result.events.some((e) => e.type === 'learn' && e.relearned)).toBe(true);
    expect(result.next.table.find((entry) => entry.mac === macOf(base, 1))!.port).toBe(5);
  });

  it('never records two ports for one address', () => {
    let state = base;
    for (const port of [1, 2, 3, 4, 1, 2]) state = sendFrame(state, port, macOf(base, 4)).next;
    const macs = state.table.map((entry) => entry.mac);
    expect(new Set(macs).size).toBe(macs.length);
  });
});

describe('ports going up and down', () => {
  it('refuses traffic on a disabled port', () => {
    const down = setPortEnabled(base, 1, false);
    const result = sendFrame(down, 1, macOf(base, 2));
    expect(result.delivered).toEqual([]);
    expect(result.events.some((e) => e.type === 'drop' && e.reason === 'port-down')).toBe(true);
  });

  it('never floods out of a disabled port', () => {
    const down = setPortEnabled(base, 3, false);
    expect(sendFrame(down, 1, macOf(base, 2)).delivered).toEqual([2, 4]);
  });

  it('forgets what it learned through a port that goes down', () => {
    const learned = sendFrame(base, 2, macOf(base, 1)).next;
    expect(learned.table.some((entry) => entry.port === 2)).toBe(true);
    expect(setPortEnabled(learned, 2, false).table.some((entry) => entry.port === 2)).toBe(false);
  });

  it('treats an empty port as having no link', () => {
    expect(linkUp(base.ports[7]!)).toBe(false);
    expect(sendFrame(base, 8, macOf(base, 1)).events[0]).toMatchObject({ type: 'drop', reason: 'no-link' });
  });
});

describe('the cases that look like bugs and are not', () => {
  it('does not send a frame back out of the port it arrived on', () => {
    const learned = sendFrame(base, 1, macOf(base, 2)).next;
    // Address the frame to a device that the table says is on the ingress port.
    const result = sendFrame(learned, 1, macOf(base, 1));
    expect(result.delivered).toEqual([]);
    expect(result.events.some((e) => e.type === 'drop' && e.reason === 'same-port')).toBe(true);
  });

  it('has nowhere to flood when every other port is down', () => {
    let state = base;
    for (const port of [2, 3, 4]) state = setPortEnabled(state, port, false);
    const result = sendFrame(state, 1, macOf(base, 2));
    expect(result.delivered).toEqual([]);
    expect(result.flooded).toBe(true);
  });

  it('returns to flooding after the table is cleared', () => {
    const learned = sendFrame(sendFrame(base, 1, macOf(base, 2)).next, 2, macOf(base, 1)).next;
    expect(sendFrame(learned, 1, macOf(base, 2)).flooded).toBe(false);
    expect(sendFrame(clearTable(learned), 1, macOf(base, 2)).flooded).toBe(true);
  });

  it('never mutates the state it was given', () => {
    const before = JSON.stringify(base);
    sendFrame(base, 1, macOf(base, 2));
    setPortEnabled(base, 1, false);
    expect(JSON.stringify(base)).toBe(before);
  });
});
