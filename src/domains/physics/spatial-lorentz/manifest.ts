import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
export default defineLab({
  id: 'spatial-lorentz',
  tag: 'SpatialLorentzLab',
  domain: 'physics',
  group: 'Physics',
  title: 'Electromagnetic fields in space',
  description: 'Trace a charged particle through electric, magnetic, and crossed fields in three dimensions.',
  schema: z.object({
    mode: z.enum(['electric', 'magnetic', 'crossed']).default('magnetic'),
    charge: z.union([z.literal(1), z.literal(-1)]).default(1),
    strength: z.number().min(0.3).max(2.5).default(1),
    forwardSpeed: z.number().min(0.4).max(3).default(1.8),
    axialSpeed: z.number().min(0).max(2).default(0.65),
    yaw: z.number().min(-180).max(180).default(28),
    pitch: z.number().min(-70).max(70).default(-18),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'electromagnetism', 'lorentz-force', 'fields'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: ['lorentz'],
    related: ['electric-field', 'magnetism'],
  },
  experience: {
    objectives: ['Apply F=q(E+v×B)', 'Distinguish electric acceleration from magnetic turning'],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
