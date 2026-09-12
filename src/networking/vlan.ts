/**
 * VLANs: one physical switch behaving as several separate ones.
 *
 * The idea students are given is "a VLAN is a virtual LAN", which explains nothing. The idea that
 * works is narrower and testable: a VLAN is a BROADCAST DOMAIN. A frame sent to everyone reaches
 * every port in its own VLAN and no others, even though all of them are in the same box on the
 * same power supply.
 *
 * The second half is the part usually left out, and it is the interesting one. If VLANs are truly
 * isolated at layer 2, how does anything ever cross between them? It cannot, until something that
 * works at layer 3 is added, and then every crossing goes through that thing. Which is exactly why
 * putting two departments on separate VLANs gives you a place to enforce a policy between them.
 */

export interface Vlan {
  id: number;
  name: string;
}

export interface VlanPort {
  id: number;
  /** The VLAN this access port belongs to. */
  vlan: number;
  enabled: boolean;
  device?: { name: string };
}

export interface VlanState {
  vlans: Vlan[];
  ports: VlanPort[];
  /** A layer-3 interface that can route between VLANs. Off by default, which is the point. */
  routing: boolean;
}

export const isLive = (port: VlanPort): boolean => port.enabled && !!port.device;

/** Ports in the same VLAN as `portId`, excluding itself. */
export function domainOf(state: VlanState, portId: number): number[] {
  const source = state.ports.find((port) => port.id === portId);
  if (!source) return [];
  return state.ports
    .filter((port) => port.id !== portId && port.vlan === source.vlan && isLive(port))
    .map((port) => port.id);
}

export interface BroadcastResult {
  reached: number[];
  /** Live ports that did NOT receive it, because they are in another VLAN. */
  blocked: number[];
  message: string;
}

/** A broadcast reaches its own VLAN and stops there. Routing does not change that. */
export function broadcastFrom(state: VlanState, portId: number): BroadcastResult {
  const source = state.ports.find((port) => port.id === portId);
  if (!source || !isLive(source)) {
    return { reached: [], blocked: [], message: `Port ${portId} has no live device to send from.` };
  }
  const reached = domainOf(state, portId);
  const blocked = state.ports
    .filter((port) => port.id !== portId && isLive(port) && port.vlan !== source.vlan)
    .map((port) => port.id);
  const vlanName = state.vlans.find((vlan) => vlan.id === source.vlan)?.name ?? `VLAN ${source.vlan}`;
  return {
    reached,
    blocked,
    message: blocked.length
      ? `The broadcast reaches every live port in ${vlanName} and stops. ${blocked.length} live port${blocked.length > 1 ? 's are' : ' is'} in another VLAN and never sees it.`
      : `The broadcast reaches every live port in ${vlanName}.`,
  };
}

export interface DeliveryResult {
  delivered: boolean;
  viaRouter: boolean;
  message: string;
}

/**
 * Directed traffic between two ports. Within a VLAN the switch forwards it. Across VLANs it needs
 * a layer-3 interface, and that interface is where a policy would sit.
 */
export function sendBetween(state: VlanState, fromPort: number, toPort: number): DeliveryResult {
  const source = state.ports.find((port) => port.id === fromPort);
  const target = state.ports.find((port) => port.id === toPort);
  if (!source || !target || !isLive(source) || !isLive(target)) {
    return { delivered: false, viaRouter: false, message: 'Both ends need a live device.' };
  }
  if (source.vlan === target.vlan) {
    return {
      delivered: true,
      viaRouter: false,
      message: `Same VLAN, so the switch forwards it directly. Nothing outside the VLAN is involved.`,
    };
  }
  if (!state.routing) {
    return {
      delivered: false,
      viaRouter: false,
      message: `Different VLANs and no layer-3 interface, so there is no path at all. The switch will not carry it.`,
    };
  }
  return {
    delivered: true,
    viaRouter: true,
    message: `Different VLANs, so it goes up to the layer-3 interface and back down. Every crossing passes that one point, which is where a rule can be applied.`,
  };
}

export function setPortVlan(state: VlanState, portId: number, vlan: number): VlanState {
  return {
    ...state,
    ports: state.ports.map((port) => (port.id === portId ? { ...port, vlan } : port)),
  };
}

export const setRouting = (state: VlanState, routing: boolean): VlanState => ({ ...state, routing });

/** How many separate broadcast domains this switch is currently carrying. */
export const domainCount = (state: VlanState): number =>
  new Set(state.ports.filter(isLive).map((port) => port.vlan)).size;

const NAMES = ['Sales', 'Finance', 'Reception', 'Store', 'Server A', 'Server B', 'Kiosk', 'Camera'];

/** Eight ports, the first `connected` holding a device, split evenly across two VLANs. */
export function makeVlanSwitch(connected = 6): VlanState {
  return {
    vlans: [
      { id: 10, name: 'VLAN 10' },
      { id: 20, name: 'VLAN 20' },
    ],
    routing: false,
    ports: Array.from({ length: 8 }, (_, index) => ({
      id: index + 1,
      vlan: index < 4 ? 10 : 20,
      enabled: true,
      device: index < connected ? { name: NAMES[index]! } : undefined,
    })),
  };
}
