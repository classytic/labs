/**
 * Subnetting, reduced to the one question it actually answers.
 *
 * "Are these two addresses on the same network?" is the whole of it, and the answer is mechanical:
 * compare the first `prefix` bits. Same, and the two can talk directly. Different, and everything
 * has to go through a router. Every other subnetting fact (mask, network address, broadcast, usable
 * count) falls out of where that boundary sits.
 *
 * Students drown here because it is taught in dotted decimal, where the boundary is invisible. In
 * binary it is a vertical line, and the moment it crosses the first differing bit the answer flips.
 * That is the thing to show.
 */

import { ipv4ToInt } from './ip.js';

export const intToIpv4 = (value: number): string =>
  [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');

/** The mask for a prefix, as a 32-bit unsigned value. /0 is all zeros. */
export const maskFor = (prefix: number): number =>
  prefix <= 0 ? 0 : prefix >= 32 ? 0xffffffff : (0xffffffff << (32 - prefix)) >>> 0;

export interface Bit {
  value: 0 | 1;
  /** True while this bit is inside the network portion. */
  network: boolean;
}

/** The 32 bits of an address, flagged by which side of the prefix boundary they fall. */
export function bitsOf(address: string, prefix: number): Bit[] | null {
  const value = ipv4ToInt(address);
  if (value == null) return null;
  return Array.from({ length: 32 }, (_, index) => ({
    value: ((value >>> (31 - index)) & 1) as 0 | 1,
    network: index < prefix,
  }));
}

export interface SubnetInfo {
  address: string;
  prefix: number;
  mask: string;
  network: string;
  broadcast: string;
  firstUsable: string | null;
  lastUsable: string | null;
  /** Addresses that can be given to a device. Excludes network and broadcast. */
  usableHosts: number;
  bits: Bit[];
}

export function describe(address: string, prefix: number): SubnetInfo | null {
  const value = ipv4ToInt(address);
  const bits = bitsOf(address, prefix);
  if (value == null || !bits || prefix < 0 || prefix > 32) return null;
  const mask = maskFor(prefix);
  const network = (value & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  // A /31 has no room for network and broadcast, and a /32 is a single host route.
  const total = 2 ** (32 - prefix);
  const usableHosts = total > 2 ? total - 2 : 0;
  return {
    address,
    prefix,
    mask: intToIpv4(mask),
    network: intToIpv4(network),
    broadcast: intToIpv4(broadcast),
    firstUsable: usableHosts ? intToIpv4(network + 1) : null,
    lastUsable: usableHosts ? intToIpv4(broadcast - 1) : null,
    usableHosts,
    bits,
  };
}

/** Do two addresses share a network under this prefix? */
export function sameNetwork(a: string, b: string, prefix: number): boolean | null {
  const left = ipv4ToInt(a);
  const right = ipv4ToInt(b);
  if (left == null || right == null) return null;
  const mask = maskFor(prefix);
  return (left & mask) >>> 0 === (right & mask) >>> 0;
}

/**
 * The index (0-based from the left) of the first bit where two addresses differ, or -1 when they
 * are identical. This is the number the whole lab turns on: any prefix at or below it puts the two
 * on the same network, and any prefix above it separates them.
 */
export function firstDifferingBit(a: string, b: string): number {
  const left = ipv4ToInt(a);
  const right = ipv4ToInt(b);
  if (left == null || right == null) return -1;
  for (let index = 0; index < 32; index++) {
    const shift = 31 - index;
    if (((left >>> shift) & 1) !== ((right >>> shift) & 1)) return index;
  }
  return -1;
}

/** The largest prefix that still keeps both addresses together. */
export function widestSharedPrefix(a: string, b: string): number {
  const differing = firstDifferingBit(a, b);
  return differing === -1 ? 32 : differing;
}
