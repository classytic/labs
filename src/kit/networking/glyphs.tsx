'use client';

import type { ReactNode } from 'react';
import type { NetworkDeviceGlyphProps, NetworkDeviceKind } from '../../networking/contract.js';

function DeviceSymbol({ kind }: { kind: NetworkDeviceKind }): ReactNode {
  switch (kind) {
    case 'client':
      return (
        <>
          <rect x="11" y="10" width="26" height="18" rx="2" />
          <path d="M8 34h32M17 28l-2 6m16-6 2 6" />
        </>
      );
    case 'server':
      return (
        <>
          <rect x="12" y="7" width="24" height="34" rx="3" />
          <path d="M16 17h16M16 27h16" />
          <circle cx="18" cy="12" r="1.5" />
          <circle cx="18" cy="22" r="1.5" />
          <circle cx="18" cy="32" r="1.5" />
        </>
      );
    case 'switch':
      return (
        <>
          <rect x="7" y="15" width="34" height="19" rx="4" />
          <path d="M13 22h7m-3-3 3 3-3 3m18 2h-7m3-3-3 3 3 3" />
        </>
      );
    case 'router':
      return (
        <>
          <ellipse cx="24" cy="24" rx="18" ry="12" />
          <path d="M13 24h22m-4-4 4 4-4 4m-14-8-4 4 4 4" />
        </>
      );
    case 'access-point':
      return (
        <>
          <path d="M11 37h26M24 37V25" />
          <circle cx="24" cy="21" r="3" />
          <path d="M17 16a10 10 0 0 1 14 0M12 11a17 17 0 0 1 24 0" />
        </>
      );
    case 'firewall':
      return (
        <>
          <path d="M8 12h32v25H8zM8 20h32M8 29h32M18 12v8m12 0v9m-12 0v8" />
        </>
      );
    case 'load-balancer':
      return (
        <>
          <circle cx="12" cy="24" r="4" />
          <circle cx="36" cy="13" r="4" />
          <circle cx="36" cy="35" r="4" />
          <path d="M16 24h7m0 0 9-11m-9 11 9 11" />
        </>
      );
    case 'cloud':
      return <path d="M14 36h22a8 8 0 0 0 1-16 13 13 0 0 0-25-2 9 9 0 0 0 2 18Z" />;
    case 'dns':
      return (
        <>
          <circle cx="24" cy="24" r="17" />
          <path d="M7 24h34M24 7c6 6 6 28 0 34M24 7c-6 6-6 28 0 34" />
        </>
      );
    case 'broker':
      return (
        <>
          <rect x="8" y="9" width="32" height="30" rx="4" />
          <path d="M14 17h20M14 24h20M14 31h12m5-3 4 3-4 3" />
        </>
      );
    default:
      return (
        <>
          <rect x="9" y="9" width="30" height="30" rx="6" />
          <circle cx="24" cy="24" r="6" />
        </>
      );
  }
}

/** Vendor-neutral, currentColor network device glyph with a generous focus target. */
export function NetworkDeviceGlyph({
  device,
  active,
  selected,
  onSelect,
}: NetworkDeviceGlyphProps): ReactNode {
  const interactive = !!onSelect;
  return (
    <g
      transform={`translate(${device.at.x - 30} ${device.at.y - 34})`}
      className="network-device"
      data-active={active || undefined}
      data-selected={selected || undefined}
      role={interactive ? 'button' : 'group'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`${device.kind} ${device.label}${active ? ', current packet location' : ''}`}
      onClick={onSelect}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      style={{ cursor: interactive ? 'pointer' : undefined }}
    >
      <rect className="network-device-surface" x="0" y="0" width="60" height="68" rx="12" />
      <g
        className="network-device-symbol"
        transform="translate(6 4)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <DeviceSymbol kind={device.kind} />
      </g>
      <text className="network-device-label" x="30" y="60" textAnchor="middle">
        {device.label}
      </text>
    </g>
  );
}
