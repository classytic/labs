import { describe, expect, it } from 'vitest';
import {
  OBSERVERS,
  TUNNEL_OVERHEAD_BYTES,
  canReadContents,
  canSeeDestination,
  observe,
  observersFor,
  surveyOf,
  usableBytes,
  type Setup,
} from '../src/networking/vpn.js';

const setups: Record<string, Setup> = {
  nothing: { vpn: false, https: false },
  httpsOnly: { vpn: false, https: true },
  vpnOnly: { vpn: true, https: false },
  both: { vpn: true, https: true },
};

describe('what the tunnel hides on the way to the gateway', () => {
  it('stops the local network and the provider from naming the site', () => {
    for (const id of ['wifi', 'isp'] as const) {
      expect(observe(id, setups.vpnOnly!)!.to.value).toBe('VPN gateway');
      expect(observe(id, setups.both!)!.to.value).toBe('VPN gateway');
    }
    expect(canSeeDestination(setups.vpnOnly!)).not.toContain('isp');
  });

  it('lets both of them name the site with no tunnel, HTTPS or not', () => {
    // This is the myth HTTPS alone cannot fix: the address is outside the encryption.
    expect(canSeeDestination(setups.httpsOnly!)).toContain('isp');
    expect(canSeeDestination(setups.nothing!)).toContain('isp');
  });

  it('offers no gateway to watch when there is no tunnel', () => {
    expect(observe('gateway', setups.nothing!)).toBeNull();
    expect(observersFor(setups.nothing!).map((o) => o.id)).not.toContain('gateway');
    expect(observersFor(setups.both!)).toHaveLength(OBSERVERS.length);
  });
});

describe('a VPN moves trust rather than removing it', () => {
  it('gives the provider exactly what it took away from the ISP', () => {
    const gateway = observe('gateway', setups.vpnOnly!)!;
    expect(gateway.from.value).toBe('You');
    expect(gateway.to.value).toBe('example.com');
    expect(canSeeDestination(setups.vpnOnly!)).toContain('gateway');
  });

  it('leaves exactly one watcher on the path who can name the site', () => {
    // With a tunnel the ISP and the café are out, and the gateway is in. The count does not drop.
    const before = canSeeDestination(setups.httpsOnly!).filter((id) => id !== 'website');
    const after = canSeeDestination(setups.both!).filter((id) => id !== 'website');
    expect(before).toEqual(['wifi', 'isp']);
    expect(after).toEqual(['gateway']);
  });

  it('still keeps contents from the provider when HTTPS is on', () => {
    // The other half of the marketing, in the other direction: they see where, not what.
    expect(canReadContents(setups.both!)).not.toContain('gateway');
    expect(canReadContents(setups.vpnOnly!)).toContain('gateway');
  });
});

describe('the far end is never hidden from', () => {
  it('reads the request in every configuration, because it is the one answering', () => {
    for (const setup of Object.values(setups)) {
      expect(observe('website', setup)!.contents.hidden).toBe(false);
      expect(canReadContents(setup)).toContain('website');
    }
  });

  it('sees the gateway instead of you when the tunnel is up, and that is the whole anonymity claim', () => {
    expect(observe('website', setups.both!)!.from.value).toBe('VPN gateway');
    expect(observe('website', setups.httpsOnly!)!.from.value).toBe('You');
  });
});

describe('HTTPS and a VPN protect different things', () => {
  it('has HTTPS hide contents from everyone in between, tunnel or not', () => {
    expect(canReadContents(setups.httpsOnly!)).toEqual(['website']);
    expect(canReadContents(setups.both!)).toEqual(['website']);
  });

  it('has neither one alone cover both questions', () => {
    // HTTPS alone: contents safe, destination visible to the ISP.
    expect(canReadContents(setups.httpsOnly!)).not.toContain('isp');
    expect(canSeeDestination(setups.httpsOnly!)).toContain('isp');
    // VPN alone: destination hidden from the ISP, contents readable at the gateway.
    expect(canSeeDestination(setups.vpnOnly!)).not.toContain('isp');
    expect(canReadContents(setups.vpnOnly!)).toContain('gateway');
  });

  it('leaves the worst case readable to everyone on the path', () => {
    expect(canReadContents(setups.nothing!)).toEqual(['wifi', 'isp', 'website']);
  });
});

describe('the tunnel is not free', () => {
  it('takes its overhead out of the room left for data', () => {
    expect(usableBytes(1500, setups.both!)).toBe(1500 - TUNNEL_OVERHEAD_BYTES);
    expect(usableBytes(1500, setups.nothing!)).toBe(1500);
  });
});
