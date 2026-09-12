import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'vpn-tunnel',
  domain: 'networking',
  group: 'Networking',
  title: 'Who can see what (VPNs and HTTPS)',
  description:
    'The same traffic read from four vantage points: the café Wi-Fi, the internet provider, the VPN gateway and the website itself. Each watcher shows the three things anyone watching traffic wants, who is sending, where it is going and what it says, with the ones they cannot get shuttered behind a padlock. The tunnel is drawn as a sleeve enclosing the café and the provider, which is why they carry the traffic without being able to see into it. Trying all four combinations of tunnel and HTTPS produces the actual rule: a VPN moves the watching to the VPN company, and HTTPS decides whether a watcher gets the addresses or the contents too.',
  schema: z.object({
    vpn: z.boolean().default(false),
    https: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12', 'undergraduate'],
    outcomes: ['networking', 'security', 'privacy', 'encryption', 'vpn'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'table',
    prerequisites: ['layer-encapsulation'],
    related: ['layer-encapsulation', 'packet-journey', 'network-media'],
    starter: true,
  },
  experience: {
    objectives: [
      'Say what a tunnel hides, and from which watcher',
      'Explain why a VPN moves trust rather than removing it',
      'Separate what HTTPS protects from what a VPN protects',
      'Judge an offer of a free VPN on what the provider can see',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
