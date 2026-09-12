import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const id = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9][a-z0-9-]*$/i);
const label = z.string().trim().min(1).max(60);
const tone = z.string().regex(/^(#[0-9a-fA-F]{3,8}|var\(--[a-z0-9-]+\))$/);
const node = z.object({ id, label, tone: tone.optional() });
const edge = z.object({ from: id, to: id, label: label.optional() });

export default defineLab({
  id: 'cycle',
  tag: 'Cycle',
  domain: 'geography',
  group: 'Geography',
  title: 'Cycle diagram (water / rock / carbon / custom)',
  description:
    'A general directed-cycle lab: stages laid around a ring with process-labelled arrows. Trace mode lights a stage’s outgoing processes (great for branched rock/carbon cycles); label-process mode strips the process names into a tray to match back onto the arrows. Pick a preset or author your own nodes + edges.',
  schema: z
    .object({
      preset: z.enum(['water', 'rock', 'carbon', 'custom']).default('water'),
      challenge: z.enum(['trace', 'label-process']).default('label-process'),
      nodes: z.array(node).min(2).max(12).optional(),
      edges: z.array(edge).min(1).max(30).optional(),
      size: z.number().int().min(240).max(720).default(340),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.preset !== 'custom') return;
      if (!props.nodes)
        context.addIssue({
          code: 'custom',
          path: ['nodes'],
          message: 'Custom cycles require at least two stages',
        });
      if (!props.edges)
        context.addIssue({
          code: 'custom',
          path: ['edges'],
          message: 'Custom cycles require at least one directed process',
        });
      const ids = props.nodes?.map((item) => item.id) ?? [];
      if (new Set(ids).size !== ids.length)
        context.addIssue({ code: 'custom', path: ['nodes'], message: 'Stage ids must be unique' });
      const keys = new Set<string>();
      props.edges?.forEach((item, index) => {
        if (!ids.includes(item.from))
          context.addIssue({
            code: 'custom',
            path: ['edges', index, 'from'],
            message: 'Edge source must reference a declared stage',
          });
        if (!ids.includes(item.to))
          context.addIssue({
            code: 'custom',
            path: ['edges', index, 'to'],
            message: 'Edge destination must reference a declared stage',
          });
        if (item.from === item.to)
          context.addIssue({
            code: 'custom',
            path: ['edges', index],
            message: 'A cycle transition must connect two different stages',
          });
        const key = `${item.from}->${item.to}`;
        if (keys.has(key))
          context.addIssue({
            code: 'custom',
            path: ['edges', index],
            message: 'Only one process slot is supported for each directed stage pair',
          });
        keys.add(key);
        if (props.challenge === 'label-process' && !item.label)
          context.addIssue({
            code: 'custom',
            path: ['edges', index, 'label'],
            message: 'Label-process challenges require every process label',
          });
      });
    }),
  taxonomy: {
    grades: ['7', '8', '9', '10'],
    outcomes: ['cycles', 'systems'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Trace matter through a directed cycle and identify the process causing each transfer',
      'Distinguish a simple ring from a branched system with alternative routes',
      'Transfer the diagram model to predict how a changed or interrupted process affects the system',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
