import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'layer-encapsulation',
  domain: 'networking',
  group: 'Networking',
  title: 'What a message turns into (headers and hops)',
  description:
    'One message followed down the stack and across three wires. The frame is drawn to scale, so shrinking the message to a single keystroke makes it disappear next to its own addressing. Below it the journey shows the MAC pair rewritten on every wire while the IP pair, written once under a bracket spanning the whole path, arrives exactly as it was sent. Each device is filled with the colour of the deepest header it opens, so a switch is Ethernet-coloured and a router is IP-coloured.',
  schema: z.object({
    payloadBytes: z.number().int().min(1).max(1400).default(100),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['11', '12', 'undergraduate'],
    outcomes: ['networking', 'encapsulation', 'osi-model', 'addressing'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'table',
    prerequisites: [],
    related: ['packet-journey', 'switch-learning', 'subnet-builder', 'vlan-designer'],
    starter: true,
  },
  experience: {
    objectives: [
      'Say what each layer adds and what it leaves alone',
      'Name the addresses in the frame on any given wire',
      'Explain why the MAC pair changes at every routed hop and the IP pair does not',
      'Work out what a set of headers costs, and when that cost matters',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
