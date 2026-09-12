import type { ExamPart } from './core.js';

/**
 * The question an author gets when they insert the block with nothing filled in.
 *
 * It lives in its own module, importing only a type, so both the manifest (which the authoring
 * catalog loads) and the runtime preset can use it without the manifest dragging the answer
 * checker and its expression compiler into the editor's chunk.
 *
 * It is deliberately a REAL question rather than lorem: two parts, one graded and one marked by
 * the scheme alone, with a common error attached, so an author can see every feature the block
 * has by inserting it once.
 */
export const DEFAULT_EXAM_PARTS: ExamPart[] = [
  {
    label: 'a',
    prompt: 'A trolley travels 12.0 m in 4.0 s at constant speed. Calculate its speed.',
    marks: 2,
    command: 'calculate',
    answer: { kind: 'number', value: 3 },
    unit: 'm/s',
    markScheme: [{ text: 'speed = distance / time' }, { text: '3.0 m/s, to 2 significant figures' }],
    commonErrors: [
      { answer: '48', why: 'You multiplied. Speed divides distance by time, it does not multiply.' },
      { answer: '0.33', why: 'That is time divided by distance, which is the reciprocal of speed.' },
    ],
  },
  {
    label: 'b',
    prompt: 'Explain why the trolley travelling at constant speed still has a resultant force of zero.',
    marks: 2,
    markScheme: [
      { text: 'constant speed in a straight line means zero acceleration' },
      { text: 'and F = ma, so a zero acceleration means a zero resultant force' },
    ],
    command: 'explain',
  },
];

export const DEFAULT_EXAM_STEM =
  'A trolley runs at a steady speed along a level track. Air resistance is negligible.';
