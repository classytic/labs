import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'vertex-parabola',
  tag: 'VertexParabola',
  domain: 'math',
  group: 'Math',
  title: 'Parabola (drag the vertex)',
  description: 'Drag the vertex of y = a(x−h)² + k; the curve + equation update live.',
  schema: z.object({ a: z.number().default(1) }),
  experience: {
    objectives: [
      'Connect vertex-form parameters to a parabola’s position and opening',
      'Predict how moving the vertex changes the equation',
      'Transfer between a graph and its vertex-form description',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['math', 'algebra', 'quadratics'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
  },
  loadRuntime: () => import('./runtime.js'),
});
