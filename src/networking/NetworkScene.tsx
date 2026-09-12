'use client';

import type { ReactNode } from 'react';
import { NetworkDeviceGlyph } from '../kit/networking/index.js';
import type { NetworkDoc } from './contract.js';

export interface NetworkSceneProps {
  doc: NetworkDoc;
  activeDeviceId?: string;
  activeLinkId?: string;
  selectedDeviceId?: string;
  onSelectDevice?: (id: string) => void;
  ariaLabel?: string;
}

export function NetworkScene({
  doc,
  activeDeviceId,
  activeLinkId,
  selectedDeviceId,
  onSelectDevice,
  ariaLabel,
}: NetworkSceneProps): ReactNode {
  const byId = new Map(doc.devices.map((device) => [device.id, device]));
  const points = doc.devices.map((device) => device.at);
  const minX = Math.min(...points.map((point) => point.x), 0);
  const maxX = Math.max(...points.map((point) => point.x), 200);
  const minY = Math.min(...points.map((point) => point.y), 0);
  const maxY = Math.max(...points.map((point) => point.y), 100);
  const viewX = minX - 52;
  const viewY = minY - 54;
  const viewWidth = Math.max(260, maxX - minX + 104);
  const viewHeight = Math.max(150, maxY - minY + 108);
  return (
    <div className="network-scene">
      <svg
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={ariaLabel ?? doc.title ?? 'Network topology'}
      >
        <g className="network-links">
          {doc.links.map((link) => {
            const a = byId.get(link.a.deviceId);
            const b = byId.get(link.b.deviceId);
            if (!a || !b) return null;
            const down = link.state === 'down';
            return (
              <g key={link.id}>
                <line
                  x1={a.at.x}
                  y1={a.at.y}
                  x2={b.at.x}
                  y2={b.at.y}
                  className="network-link"
                  data-active={link.id === activeLinkId || undefined}
                  data-down={down || undefined}
                />
                <text
                  x={(a.at.x + b.at.x) / 2}
                  y={(a.at.y + b.at.y) / 2 - 8}
                  className="network-link-label"
                  textAnchor="middle"
                >
                  {down ? 'down' : (link.label ?? `${link.latencyMs ?? 1} ms`)}
                </text>
              </g>
            );
          })}
        </g>
        {doc.devices.map((device) => (
          <NetworkDeviceGlyph
            key={device.id}
            device={device}
            active={device.id === activeDeviceId}
            selected={device.id === selectedDeviceId}
            onSelect={onSelectDevice ? () => onSelectDevice(device.id) : undefined}
          />
        ))}
      </svg>
    </div>
  );
}
