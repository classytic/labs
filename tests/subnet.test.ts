import { describe, expect, it } from 'vitest';
import {
  bitsOf,
  describe as describeSubnet,
  firstDifferingBit,
  intToIpv4,
  maskFor,
  sameNetwork,
  widestSharedPrefix,
} from '../src/networking/subnet.js';

describe('masks and conversion', () => {
  it('round-trips an address through an integer', () => {
    for (const address of ['0.0.0.0', '10.0.0.1', '192.168.1.100', '255.255.255.255']) {
      expect(intToIpv4(bitsOf(address, 0)!.reduce((acc, bit) => (acc * 2 + bit.value) >>> 0, 0))).toBe(
        address,
      );
    }
  });

  it('builds the familiar masks', () => {
    expect(intToIpv4(maskFor(24))).toBe('255.255.255.0');
    expect(intToIpv4(maskFor(16))).toBe('255.255.0.0');
    expect(intToIpv4(maskFor(8))).toBe('255.0.0.0');
    expect(intToIpv4(maskFor(26))).toBe('255.255.255.192');
    expect(intToIpv4(maskFor(0))).toBe('0.0.0.0');
    expect(intToIpv4(maskFor(32))).toBe('255.255.255.255');
  });

  it('splits the 32 bits at the prefix', () => {
    const bits = bitsOf('192.168.1.1', 24)!;
    expect(bits).toHaveLength(32);
    expect(bits.filter((bit) => bit.network)).toHaveLength(24);
    expect(
      bits
        .slice(0, 8)
        .map((bit) => bit.value)
        .join(''),
    ).toBe('11000000'); // 192
  });

  it('rejects nonsense rather than guessing', () => {
    expect(bitsOf('999.1.1.1', 24)).toBeNull();
    expect(describeSubnet('nope', 24)).toBeNull();
    expect(sameNetwork('10.0.0.1', 'bad', 24)).toBeNull();
  });
});

describe('describing a network', () => {
  it('gets the classic /24 right', () => {
    const info = describeSubnet('192.168.1.57', 24)!;
    expect(info.mask).toBe('255.255.255.0');
    expect(info.network).toBe('192.168.1.0');
    expect(info.broadcast).toBe('192.168.1.255');
    expect(info.firstUsable).toBe('192.168.1.1');
    expect(info.lastUsable).toBe('192.168.1.254');
    expect(info.usableHosts).toBe(254);
  });

  it('halves the usable count for every bit added to the prefix', () => {
    expect(describeSubnet('10.0.0.5', 24)!.usableHosts).toBe(254);
    expect(describeSubnet('10.0.0.5', 25)!.usableHosts).toBe(126);
    expect(describeSubnet('10.0.0.5', 26)!.usableHosts).toBe(62);
    expect(describeSubnet('10.0.0.5', 30)!.usableHosts).toBe(2);
  });

  it('reports no usable hosts for a /31 or /32, rather than a negative count', () => {
    // The naive 2^n - 2 gives 0 and -1 here, which is where a lot of implementations go wrong.
    expect(describeSubnet('10.0.0.5', 31)!.usableHosts).toBe(0);
    expect(describeSubnet('10.0.0.5', 32)!.usableHosts).toBe(0);
    expect(describeSubnet('10.0.0.5', 32)!.firstUsable).toBeNull();
  });

  it('places a host inside its own network and below its broadcast', () => {
    const info = describeSubnet('172.16.34.200', 20)!;
    expect(info.network).toBe('172.16.32.0');
    expect(info.broadcast).toBe('172.16.47.255');
    expect(info.usableHosts).toBe(4094);
  });
});

describe('the question the whole thing answers', () => {
  it('says two hosts in the same /24 can talk directly', () => {
    expect(sameNetwork('192.168.1.10', '192.168.1.200', 24)).toBe(true);
  });

  it('separates them the moment the prefix crosses the first differing bit', () => {
    const a = '192.168.1.10';
    const b = '192.168.2.10';
    const boundary = firstDifferingBit(a, b);
    // 192.168.1 vs 192.168.2 first differ inside the third octet.
    expect(boundary).toBe(22);
    expect(sameNetwork(a, b, boundary)).toBe(true);
    expect(sameNetwork(a, b, boundary + 1)).toBe(false);
  });

  it('agrees that the widest shared prefix is exactly that boundary', () => {
    for (const [a, b] of [
      ['10.1.1.1', '10.1.1.2'],
      ['192.168.1.10', '192.168.2.10'],
      ['172.16.0.1', '10.0.0.1'],
    ] as const) {
      const widest = widestSharedPrefix(a, b);
      expect(sameNetwork(a, b, widest)).toBe(true);
      if (widest < 32) expect(sameNetwork(a, b, widest + 1)).toBe(false);
    }
  });

  it('is monotonic: once separated, a longer prefix never puts them back together', () => {
    const a = '192.168.1.10';
    const b = '192.168.2.10';
    let separated = false;
    for (let prefix = 0; prefix <= 32; prefix++) {
      const together = sameNetwork(a, b, prefix)!;
      if (!together) separated = true;
      if (separated) expect(together).toBe(false);
    }
  });

  it('treats identical addresses as sharing every bit', () => {
    expect(firstDifferingBit('10.0.0.1', '10.0.0.1')).toBe(-1);
    expect(widestSharedPrefix('10.0.0.1', '10.0.0.1')).toBe(32);
  });

  it('puts everything together at /0, which is why a default route matches anything', () => {
    expect(sameNetwork('10.0.0.1', '8.8.8.8', 0)).toBe(true);
  });
});
