/**
 * What a switch actually does, which is smaller and stranger than most courses admit.
 *
 * A switch is not told where anything is. It starts knowing nothing, and it learns by watching
 * the SOURCE address of every frame that arrives: "that device is reachable through port 3,
 * because a frame from it just came in on port 3". Until it has learned a destination it floods,
 * sending the frame everywhere except back the way it came.
 *
 * That is the whole mechanism, and it produces the behaviour students are usually asked to
 * memorise instead: the first frame to a new device goes everywhere, the second goes to one port,
 * and a switch with an empty table behaves exactly like the hub it replaced.
 */

export interface SwitchDevice {
  name: string;
  mac: string;
}

export interface SwitchPort {
  /** 1-based, as printed on real hardware. */
  id: number;
  /** A disabled port is administratively down: no link, no traffic, no learning. */
  enabled: boolean;
  device?: SwitchDevice;
}

export interface MacEntry {
  mac: string;
  port: number;
}

export interface SwitchState {
  ports: SwitchPort[];
  /** The forwarding table, learned entirely from traffic. */
  table: MacEntry[];
}

export type SwitchEvent =
  | { type: 'ingress'; port: number; srcMac: string; dstMac: string; message: string }
  | { type: 'learn'; mac: string; port: number; relearned: boolean; message: string }
  | { type: 'flood'; ports: number[]; message: string }
  | { type: 'forward'; port: number; message: string }
  | { type: 'drop'; reason: 'port-down' | 'no-link' | 'same-port'; message: string };

export interface FrameResult {
  events: SwitchEvent[];
  next: SwitchState;
  /** Ports the frame actually left by. Empty when it was dropped. */
  delivered: number[];
  flooded: boolean;
}

export const linkUp = (port: SwitchPort): boolean => port.enabled && !!port.device;

const portOf = (state: SwitchState, mac: string): number | undefined =>
  state.table.find((entry) => entry.mac === mac)?.port;

const deviceName = (state: SwitchState, mac: string): string =>
  state.ports.find((port) => port.device?.mac === mac)?.device?.name ?? mac;

/**
 * Send one frame in through `fromPort` and resolve what the switch does with it.
 *
 * Pure: returns the next state rather than mutating, so a lesson can step forward and back.
 */
export function sendFrame(state: SwitchState, fromPort: number, dstMac: string): FrameResult {
  const events: SwitchEvent[] = [];
  const ingress = state.ports.find((port) => port.id === fromPort);
  const srcMac = ingress?.device?.mac ?? '';

  if (!ingress || !ingress.enabled) {
    events.push({
      type: 'drop',
      reason: 'port-down',
      message: `Port ${fromPort} is disabled, so nothing can enter through it.`,
    });
    return { events, next: state, delivered: [], flooded: false };
  }
  if (!ingress.device) {
    events.push({
      type: 'drop',
      reason: 'no-link',
      message: `Port ${fromPort} has nothing plugged into it.`,
    });
    return { events, next: state, delivered: [], flooded: false };
  }

  events.push({
    type: 'ingress',
    port: fromPort,
    srcMac,
    dstMac,
    message: `A frame from ${ingress.device.name} arrives on port ${fromPort}, addressed to ${deviceName(state, dstMac)}.`,
  });

  // ── learn from the SOURCE, always, before deciding anything about the destination ──
  const known = state.table.find((entry) => entry.mac === srcMac);
  const relearned = !!known && known.port !== fromPort;
  const table = [
    ...state.table.filter((entry) => entry.mac !== srcMac),
    { mac: srcMac, port: fromPort },
  ].sort((a, b) => a.port - b.port || a.mac.localeCompare(b.mac));

  if (!known || relearned) {
    events.push({
      type: 'learn',
      mac: srcMac,
      port: fromPort,
      relearned,
      message: relearned
        ? `${ingress.device.name} has moved. The table now says port ${fromPort}.`
        : `Learned: ${ingress.device.name} is reachable through port ${fromPort}.`,
    });
  }

  const next: SwitchState = { ports: state.ports, table };
  const target = portOf(next, dstMac);

  if (target === fromPort) {
    events.push({
      type: 'drop',
      reason: 'same-port',
      message: `The destination is on the port the frame arrived from, so the switch does not send it back out.`,
    });
    return { events, next, delivered: [], flooded: false };
  }

  if (target !== undefined && linkUp(state.ports.find((port) => port.id === target)!)) {
    events.push({
      type: 'forward',
      port: target,
      message: `The table knows this address, so the frame goes out of port ${target} only. No other device sees it.`,
    });
    return { events, next, delivered: [target], flooded: false };
  }

  // Unknown destination: send everywhere with a link, except back where it came from.
  const flooded = next.ports.filter((port) => port.id !== fromPort && linkUp(port)).map((port) => port.id);
  events.push({
    type: 'flood',
    ports: flooded,
    message: flooded.length
      ? `This address is not in the table, so the switch floods: out of every connected port except ${fromPort}.`
      : `This address is not in the table, and no other port has a link, so there is nowhere to flood.`,
  });
  return { events, next, delivered: flooded, flooded: true };
}

/** Toggle a port up or down. A port going down forgets what was learned through it. */
export function setPortEnabled(state: SwitchState, portId: number, enabled: boolean): SwitchState {
  const ports = state.ports.map((port) => (port.id === portId ? { ...port, enabled } : port));
  // A real switch ages entries out; dropping them immediately on link-down is the honest
  // simplification, and it makes the consequence visible in the table straight away.
  const table = enabled ? state.table : state.table.filter((entry) => entry.port !== portId);
  return { ports, table };
}

/** Clear the forwarding table, which returns the switch to the day it was unboxed. */
export const clearTable = (state: SwitchState): SwitchState => ({ ports: state.ports, table: [] });

const MACS = ['AA:01', 'BB:02', 'CC:03', 'DD:04', 'EE:05', 'FF:06', '11:07', '22:08'];
const NAMES = ['Laptop', 'Desktop', 'Printer', 'Server', 'Phone', 'Camera', 'NAS', 'TV'];

/** A switch with `size` ports, the first `connected` of them holding a device. */
export function makeSwitch(size = 8, connected = 4): SwitchState {
  return {
    ports: Array.from({ length: size }, (_, index) => ({
      id: index + 1,
      enabled: true,
      device: index < connected ? { name: NAMES[index]!, mac: MACS[index]! } : undefined,
    })),
    table: [],
  };
}
