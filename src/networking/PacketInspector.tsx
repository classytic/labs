'use client';

import type { ReactNode } from 'react';
import type { NetworkPacket } from './contract.js';

export function PacketInspector({ packet }: { packet: NetworkPacket }): ReactNode {
  return (
    <div className="network-packet" aria-label="Packet layers">
      <div className="network-packet-head">
        <strong>Packet</strong>
        <span>{packet.bytes} bytes</span>
      </div>
      <ol className="network-layer-list">
        {packet.layers.map((layer) => (
          <li key={layer.kind} className="network-layer" data-layer={layer.kind}>
            <span className="network-layer-name">{layer.kind}</span>
            <strong>{layer.protocol}</strong>
            <span>{layer.summary}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
