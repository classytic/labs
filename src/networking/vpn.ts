/**
 * What a VPN actually hides, from whom, and what it quietly costs.
 *
 * This topic is taught almost entirely by advertising, and the advertising is wrong in both
 * directions. A VPN does not make anyone anonymous, and it also does not hand a provider your
 * banking password. The truthful version is more interesting than either claim, and it falls out of
 * one mechanism: the original packet is wrapped inside a new one addressed to the gateway, and the
 * inside is encrypted. So anybody between you and the gateway can see that you are talking to the
 * gateway and nothing else, and the gateway can see everything the encryption around it does not
 * cover.
 *
 * The conclusion worth carrying out of the lesson is that a VPN MOVES trust rather than removing
 * it: whatever your network operator could previously see, the VPN provider now sees instead. That
 * is sometimes an excellent trade (hostile café Wi-Fi, a censoring network) and sometimes a bad one
 * (a free provider funded by selling exactly that view).
 *
 * The second honest point is that HTTPS and a VPN protect different things, so the interesting
 * cases are the combinations rather than either alone. And no arrangement of either hides anything
 * from the site you are actually talking to, because it is the one you are talking to.
 */

export type ObserverId = 'wifi' | 'isp' | 'gateway' | 'website';

export interface Observer {
  id: ObserverId;
  name: string;
  /** For the diagram, where a box is narrower than a sentence. */
  short: string;
  /** Where this watcher sits, in the learner's words. */
  where: string;
}

export const OBSERVERS: Observer[] = [
  {
    id: 'wifi',
    name: 'The café Wi-Fi',
    short: 'Café Wi-Fi',
    where: 'anyone else on the same network, including whoever runs it',
  },
  {
    id: 'isp',
    name: 'Your internet provider',
    short: 'Your provider',
    where: 'every packet you send crosses their equipment',
  },
  {
    id: 'gateway',
    name: 'The VPN provider',
    short: 'VPN provider',
    where: 'the far end of the tunnel, where the wrapping comes off',
  },
  {
    id: 'website',
    name: 'The website',
    short: 'The website',
    where: 'the machine you are actually talking to',
  },
];

export interface Setup {
  vpn: boolean;
  https: boolean;
}

export interface Field {
  value: string;
  hidden: boolean;
}

export interface Sighting {
  observer: Observer;
  /** Who this watcher believes is sending. */
  from: Field;
  /** Where this watcher believes it is going. */
  to: Field;
  contents: Field;
  verdict: string;
}

const YOU = 'You';
const GATEWAY = 'VPN gateway';
const SITE = 'example.com';
const CIPHER = 'unreadable';

/** Watchers that exist in this setup. Without a tunnel there is no gateway to watch. */
export const observersFor = (setup: Setup): Observer[] =>
  OBSERVERS.filter((observer) => observer.id !== 'gateway' || setup.vpn);

export function observe(id: ObserverId, setup: Setup): Sighting | null {
  const observer = OBSERVERS.find((item) => item.id === id);
  if (!observer || (id === 'gateway' && !setup.vpn)) return null;

  // The site you are talking to is not a watcher on the path: it is the far end. Nothing you can
  // switch on hides the request from the party you are making it to.
  if (id === 'website') {
    return {
      observer,
      from: { value: setup.vpn ? GATEWAY : YOU, hidden: false },
      to: { value: SITE, hidden: false },
      contents: { value: 'your request, in full', hidden: false },
      verdict: setup.vpn
        ? 'Sees a request arriving from the VPN gateway rather than from you, and reads it in full. It has to: it is the one answering.'
        : 'Sees your own address and reads the request in full. HTTPS protects it from everyone in between, never from the far end.',
    };
  }

  // Between you and the gateway there is only the outer packet, and it says nothing about where you
  // were really going.
  if (setup.vpn) {
    if (id === 'gateway') {
      return {
        observer,
        from: { value: YOU, hidden: false },
        to: { value: SITE, hidden: false },
        contents: setup.https
          ? { value: CIPHER, hidden: true }
          : { value: 'your request, in full', hidden: false },
        verdict: setup.https
          ? 'Knows who you are and every site you ask for, but HTTPS still keeps the contents from them. This is the trade: your provider stopped seeing this and they started.'
          : 'Knows who you are, every site you ask for, and everything you send. Without HTTPS you have simply changed which company watches you.',
      };
    }
    return {
      observer,
      from: { value: YOU, hidden: false },
      to: { value: GATEWAY, hidden: false },
      contents: { value: CIPHER, hidden: true },
      verdict:
        'Can tell you are using a VPN and nothing else. Which sites you visit is inside the wrapping, so it is not available here at any price.',
    };
  }

  return {
    observer,
    from: { value: YOU, hidden: false },
    to: { value: SITE, hidden: false },
    contents: setup.https
      ? { value: CIPHER, hidden: true }
      : { value: 'your request, in full', hidden: false },
    verdict: setup.https
      ? 'Sees which sites you visit and when, but not what you asked for or what came back.'
      : 'Sees which sites you visit and can read every word of it.',
  };
}

/** Every watcher's view of one setup, which is where the pattern shows up. */
export const surveyOf = (setup: Setup): Sighting[] =>
  observersFor(setup)
    .map((observer) => observe(observer.id, setup))
    .filter((sighting): sighting is Sighting => sighting !== null);

/** Watchers who can name the site being visited. The count is the honest summary of a setup. */
export const canSeeDestination = (setup: Setup): ObserverId[] =>
  surveyOf(setup)
    .filter((sighting) => !sighting.to.hidden && sighting.to.value === SITE)
    .map((sighting) => sighting.observer.id);

/** Watchers who can read what you actually sent. */
export const canReadContents = (setup: Setup): ObserverId[] =>
  surveyOf(setup)
    .filter((sighting) => !sighting.contents.hidden)
    .map((sighting) => sighting.observer.id);

/**
 * The tunnel's own cost. A VPN wraps a whole packet inside another one, so the outer headers plus
 * the encryption are pure overhead, and the room left for real data shrinks by the same amount.
 * WireGuard's 60 bytes is the honest modern figure; older tunnels cost noticeably more.
 */
export const TUNNEL_OVERHEAD_BYTES = 60;
export const usableBytes = (mtu: number, setup: Setup): number =>
  mtu - (setup.vpn ? TUNNEL_OVERHEAD_BYTES : 0);
