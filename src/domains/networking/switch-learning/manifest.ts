import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'switch-learning',
  domain: 'networking',
  group: 'Networking',
  title: 'The switch that learns (MAC forwarding)',
  description:
    'An eight-port switch with a forwarding table that starts empty. Send a frame and it floods, because the switch has no idea where anything is. Send the reply and it forwards to one port only, because it just learned. Ports can be clicked to take the link down, which makes the switch forget and flood again, so the table stops being a definition and becomes a thing with consequences.',
  schema: z.object({
    ports: z.number().int().min(4).max(8).default(8),
    connected: z.number().int().min(2).max(8).default(4),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12', 'undergraduate'],
    outcomes: ['networking', 'switching', 'mac-addressing'],
    durationMinutes: 15,
    interaction: 'predict',
    authorability: 'simple',
    representation: 'schematic',
    prerequisites: [],
    related: ['packet-journey'],
    starter: true,
  },
  experience: {
    objectives: [
      'Predict what a switch does with a destination address it has never seen',
      'Explain that the table is learned from the SOURCE address of arriving frames',
      'Contrast the first frame of a conversation with the second',
      'Predict what a port going down does to what the switch knows',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
