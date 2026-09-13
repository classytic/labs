import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'proof-builder',
  domain: 'discrete',
  group: 'Discrete',
  tag: 'ProofBuilder',
  title: 'Proof strategy studio',
  description:
    'Construct a justified finite argument using direct proof, contrapositive, or contradiction and receive feedback at the exact invalid inference.',
  schema: z.object({
    strategy: z.enum(['direct', 'contrapositive', 'contradiction']).optional(),
    /**
     * The proof to build. Without this declared, the lab was stuck on its built-in default.
     *
     * The component has always accepted a `graph` and falls back to `DEFAULT_GRAPH`, which proves
     * "n² even implies n even" by contradiction. That argument is on no syllabus we teach, so the
     * one lab in the library that makes a learner CONSTRUCT a proof could not be pointed at the
     * circle theorems, the similarity chains or the trigonometric identities that need it. Every
     * lesson got the same undergraduate proof, or the lab went unused, and it went unused.
     *
     * `requires` is what makes it a proof rather than a list: a step only becomes available once
     * the steps it depends on are chosen, so an argument cannot be assembled out of order.
     */
    graph: z
      .object({
        premises: z.array(z.string().min(1)).min(1),
        target: z.string().min(1),
        conclusion: z.string().min(1),
        nodes: z
          .array(
            z.object({
              id: z.string().min(1),
              statement: z.string().min(1),
              justification: z.string().min(1),
              requires: z.array(z.string().min(1)).optional(),
              distractorFeedback: z.string().optional(),
              /** Figure element ids this step is about; they light and the rest dims. */
              highlights: z.array(z.string().min(1)).optional(),
            }),
          )
          .min(2),
        /**
         * An optional diagram, so a geometry proof can be seen as well as read.
         *
         * Everything is placed by POINT ID rather than by coordinates repeated at each use, so a
         * figure cannot fall out of agreement with itself. Points, segments, circles and angles
         * are enough for the circle theorems and angle chases this lab exists for; stopping there
         * keeps authoring to something a teacher can fill in.
         */
        figure: z
          .object({
            points: z
              .array(
                z.object({
                  id: z.string().min(1),
                  x: z.number(),
                  y: z.number(),
                  label: z.string().optional(),
                }),
              )
              .min(2),
            segments: z
              .array(
                z.object({
                  id: z.string().optional(),
                  from: z.string().min(1),
                  to: z.string().min(1),
                  label: z.string().optional(),
                }),
              )
              .optional(),
            circles: z
              .array(
                z.object({
                  id: z.string().optional(),
                  center: z.string().min(1),
                  through: z.string().optional(),
                  r: z.number().positive().optional(),
                }),
              )
              .optional(),
            angles: z
              .array(
                z.object({
                  id: z.string().optional(),
                  at: z.string().min(1),
                  from: z.string().min(1),
                  to: z.string().min(1),
                  label: z.string().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      })
      .optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['proof-strategies', 'logical-argument'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Choose a proof strategy that matches the claim',
      'Build an argument from justified transitions',
      'Explain why an invalid inference does not follow',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'ordering'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
