import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'packet-journey',
  domain: 'networking',
  group: 'Networking',
  title: 'Packet journey (layers and routing)',
  description:
    'Step an ICMP or HTTP packet through a home or company network. Inspect ARP, every hop, latency, and the application/transport/IP/Ethernet/physical layers.',
  schema: z.object({
    preset: z.enum(['home', 'company']).default('home'),
    protocol: z.enum(['icmp', 'http']).default('http'),
    from: z.string().optional(),
    to: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['networking', 'packet-switching', 'network-layers', 'routing'],
    durationMinutes: 15,
    interaction: 'guided',
    authorability: 'simple',
    starter: true,
  },
  experience: {
    objectives: [
      'Predict local address resolution',
      'Trace packet and frame state across routed hops',
      'Diagnose a failed route',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
