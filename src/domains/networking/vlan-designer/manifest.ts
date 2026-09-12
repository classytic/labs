import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'vlan-designer',
  domain: 'networking',
  group: 'Networking',
  title: 'Two networks in one switch (VLANs)',
  description:
    'One physical switch drawn as the two separate switches it is pretending to be. A broadcast fills its own tinted region and visibly stops at the edge, and the machines in the other VLAN are marked as never having heard it. Clicking a port moves that machine into the other VLAN, changing who receives a broadcast without a cable being touched. The last phase adds a layer-3 interface, which lets addressed traffic cross while leaving the flooding boundary exactly where it was, so every crossing passes one point.',
  schema: z.object({
    connectedPorts: z.number().int().min(2).max(8).default(6),
    routing: z.boolean().default(false),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['networking', 'vlan', 'broadcast-domain', 'segmentation'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'device',
    prerequisites: ['switch-learning'],
    related: ['switch-learning', 'subnet-builder', 'packet-journey'],
    starter: false,
  },
  experience: {
    objectives: [
      'State what a VLAN is in terms of what a broadcast reaches',
      'Change which machines hear a broadcast without touching a cable',
      'Explain why nothing crosses between VLANs at layer 2',
      'Describe what a layer-3 interface adds, and what it deliberately does not',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
