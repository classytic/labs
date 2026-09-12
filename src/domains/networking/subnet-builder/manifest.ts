import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

const ipv4 = z
  .string()
  .regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'dotted-quad IPv4 address')
  .refine((value) => value.split('.').every((part) => Number(part) >= 0 && Number(part) <= 255), {
    message: 'each octet must be 0 to 255',
  });

export default defineLab({
  id: 'subnet-builder',
  domain: 'networking',
  group: 'Networking',
  title: 'Same network, or not (subnets in binary)',
  description:
    'Two addresses shown as 32 bits with the prefix drawn as a line you slide across them. Everything left of the line is the network, everything right is the host, and the answer to "can these two talk directly?" is whether the highlighted halves match. The first bit where the addresses differ is marked, so the verdict visibly flips as the line passes it. Mask, network address, broadcast and usable host count are reported as consequences of where the line sits.',
  schema: z.object({
    hostA: ipv4.default('192.168.1.10'),
    hostB: ipv4.default('192.168.2.10'),
    prefix: z.number().int().min(0).max(32).default(16),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12', 'undergraduate'],
    outcomes: ['networking', 'ipv4', 'subnetting'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'number',
    prerequisites: [],
    related: ['packet-journey', 'switch-learning', 'bit-grouper'],
    starter: true,
  },
  experience: {
    objectives: [
      'Read an IPv4 address as 32 bits split by the prefix',
      'Decide whether two addresses share a network by comparing their network halves',
      'Find the longest prefix that still keeps two hosts together',
      'Explain why adding one bit to the prefix halves the usable addresses',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
