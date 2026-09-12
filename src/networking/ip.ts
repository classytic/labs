import type { NetworkRoute } from './contract.js';

export function ipv4ToInt(ip: string): number | undefined {
  const parts = ip.split('.');
  if (parts.length !== 4) return undefined;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return undefined;
  return nums.reduce((acc, n) => (acc * 256 + n) >>> 0, 0);
}

export function parseCidr(cidr: string): { network: number; prefix: number } | undefined {
  const [ip, rawPrefix] = cidr.split('/');
  const value = ipv4ToInt(ip ?? '');
  const prefix = Number(rawPrefix);
  if (value == null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return undefined;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return { network: value & mask, prefix };
}

export function cidrContains(cidr: string, ip: string): boolean {
  const parsed = parseCidr(cidr);
  const value = ipv4ToInt(ip);
  if (!parsed || value == null) return false;
  const mask = parsed.prefix === 0 ? 0 : (0xffffffff << (32 - parsed.prefix)) >>> 0;
  return (value & mask) === parsed.network;
}

export function longestPrefixMatch(
  routes: readonly NetworkRoute[],
  destinationIp: string,
): NetworkRoute | undefined {
  return routes
    .filter((route) => cidrContains(route.prefix, destinationIp))
    .sort(
      (a, b) =>
        (parseCidr(b.prefix)?.prefix ?? -1) - (parseCidr(a.prefix)?.prefix ?? -1) ||
        (a.metric ?? 0) - (b.metric ?? 0),
    )[0];
}
