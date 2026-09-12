import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'ethernet-pinout',
  domain: 'networking',
  group: 'Networking',
  title: 'Eight wires in one plug (T568A and T568B)',
  description:
    'Crimp an RJ45 by placing the eight wires yourself, with wrong pins called out as you go. Brackets under the pins show the four twisted pairs, which turns a memorised colour chant into something reconstructable: blue holds the middle two pins so the socket still accepts a telephone plug, and that forces the green pair to straddle it at 3 and 6. Switch standards to see that only orange and green move, which is exactly what makes a crossover cable.',
  schema: z.object({
    standard: z.enum(['T568A', 'T568B']).default('T568B'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12', 'undergraduate'],
    outcomes: ['networking', 'physical-layer', 'cabling'],
    durationMinutes: 14,
    interaction: 'build',
    authorability: 'simple',
    representation: 'schematic',
    prerequisites: [],
    related: ['switch-learning', 'network-media', 'packet-journey'],
    starter: true,
  },
  experience: {
    objectives: [
      'Place the eight wires of a twisted-pair cable in the correct order',
      'Explain why the blue pair occupies the middle two pins',
      'Explain why the green pair is split across pins 3 and 6',
      'Distinguish a straight-through cable from a crossover by its two ends',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
