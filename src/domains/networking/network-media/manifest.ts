import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'network-media',
  domain: 'networking',
  group: 'Networking',
  title: 'Copper, glass, or air',
  description:
    'Three media drawn by their mechanism rather than compared in a table: a voltage on a twisted pair with interference being induced into both wires, light bouncing inside a glass core that the same interference cannot enter, and a radio wave reaching everyone in range. Scenarios rule media out by distance, by electrical noise, and by movement, which is how the choice is actually made long before anyone compares speeds.',
  schema: z.object({
    scenario: z.enum(['desk', 'buildings', 'factory', 'phone']).default('factory'),
    medium: z.enum(['copper', 'fibre', 'radio']).default('copper'),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  taxonomy: {
    grades: ['9', '10', '11', '12', 'undergraduate'],
    outcomes: ['networking', 'physical-layer', 'transmission-media'],
    durationMinutes: 13,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'schematic',
    prerequisites: [],
    related: ['ethernet-pinout', 'switch-learning', 'packet-journey'],
  },
  experience: {
    objectives: [
      'Name what physically carries the signal in copper, fibre and radio',
      'Rule copper out on distance, and separately on electrical interference',
      'Explain why light is unaffected by interference that ruins a voltage',
      'Explain what is given up by using a shared, overhearable medium',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
