import type { ReactNode } from 'react';

export type NetworkDeviceKind =
  | 'client'
  | 'server'
  | 'switch'
  | 'router'
  | 'access-point'
  | 'firewall'
  | 'load-balancer'
  | 'dns'
  | 'broker'
  | 'cloud';

export interface NetworkInterface {
  id: string;
  label?: string;
  mac?: string;
  addresses?: string[];
}

export interface NetworkDevice {
  id: string;
  kind: NetworkDeviceKind;
  label: string;
  at: { x: number; y: number };
  interfaces: NetworkInterface[];
  services?: {
    kind: 'dhcp' | 'dns' | 'http' | 'https' | 'ftp' | 'websocket';
    port?: number;
    label?: string;
  }[];
}

export interface NetworkEndpoint {
  deviceId: string;
  interfaceId: string;
}

export interface NetworkLink {
  id: string;
  a: NetworkEndpoint;
  b: NetworkEndpoint;
  label?: string;
  cost?: number;
  latencyMs?: number;
  bandwidthMbps?: number;
  loss?: number;
  mtu?: number;
  state?: 'up' | 'down';
}

export interface NetworkRoute {
  id: string;
  deviceId: string;
  prefix: string;
  via?: string;
  interfaceId: string;
  metric?: number;
}

export interface NetworkDoc {
  schemaVersion: 1;
  type: 'network';
  devices: NetworkDevice[];
  links: NetworkLink[];
  routes?: NetworkRoute[];
  title?: string;
}

export type PacketLayerKind = 'application' | 'transport' | 'network' | 'data-link' | 'physical';
export interface PacketLayer {
  kind: PacketLayerKind;
  protocol: string;
  summary: string;
  fields?: Record<string, string | number>;
}
export interface NetworkPacket {
  id: string;
  from: string;
  to: string;
  bytes: number;
  layers: PacketLayer[];
}

export type NetworkEvent =
  | { type: 'packet-created'; at: string; packet: NetworkPacket; message: string }
  | { type: 'arp-requested'; at: string; target: string; message: string }
  | { type: 'arp-resolved'; at: string; target: string; message: string }
  | { type: 'route-selected'; at: string; next: string; prefix?: string; message: string }
  | { type: 'frame-sent'; at: string; linkId: string; next: string; packet: NetworkPacket; message: string }
  | {
      type: 'frame-received';
      at: string;
      linkId: string;
      from: string;
      packet: NetworkPacket;
      message: string;
    }
  | {
      type: 'packet-dropped';
      at: string;
      reason: 'unreachable' | 'link-down' | 'loss' | 'mtu';
      message: string;
    }
  | { type: 'packet-delivered'; at: string; packet: NetworkPacket; message: string };

export interface NetworkTrace {
  delivered: boolean;
  path: string[];
  totalLatencyMs: number;
  events: NetworkEvent[];
}

export interface NetworkDeviceGlyphProps {
  device: NetworkDevice;
  active?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export interface NetworkDeviceDef {
  kind: NetworkDeviceKind;
  label: string;
  render: (props: NetworkDeviceGlyphProps) => ReactNode;
}
