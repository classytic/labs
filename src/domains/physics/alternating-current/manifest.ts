import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'alternating-current',
  domain: 'physics',
  group: 'Physics',
  title: 'Alternating current: peak, r.m.s. and rectifying',
  tag: 'AlternatingCurrentLab',
  description:
    'Alternating currents (A Level 9702 chapter 21). A sinusoidal supply drives a resistor, with three views on one circuit. The waveform view marks the period T = 1/f and the peaks of v and i. The r.m.s. view is the heart of it: the wave is squared so it is never negative, the mean of that square is added up from the graph (it lands on V0 squared over 2), and the root of that mean is drawn back on the voltage graph as V_rms. The readout states the point in watts: a steady d.c. of V_rms delivers the same mean power, V0 squared over 2R. The rectifying view adds one diode or a bridge, then a smoothing capacitor whose ripple shrinks as the capacitance rises.',
  schema: z.object({
    peakVoltageV: z.number().finite().min(5).max(400).optional().describe('peak voltage V0 of the supply, V'),
    frequencyHz: z.number().finite().min(5).max(200).optional().describe('supply frequency f, Hz'),
    resistanceOhm: z.number().finite().min(10).max(500).optional().describe('load resistance R, ohms'),
    capacitanceUf: z
      .number()
      .finite()
      .min(0)
      .max(5000)
      .optional()
      .describe('smoothing capacitance across the load, microfarads; 0 means no capacitor'),
    rectifier: z
      .enum(['half', 'full'])
      .optional()
      .describe('half = one diode, full = a bridge of four diodes'),
    view: z.enum(['waveform', 'rms', 'rectification']).optional().describe('which view opens first'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['alternating-currents', 'root-mean-square', 'mean-power', 'rectification'],
    durationMinutes: 14,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    related: ['power', 'work-energy'],
  },
  experience: {
    objectives: [
      'Read the period T and the peak value V0 from a sinusoidal supply',
      'Explain V_rms as the steady d.c. voltage that delivers the same mean power',
      'Calculate mean power as V_rms squared over R, which is V0 squared over 2R',
      'Describe how a diode and a smoothing capacitor turn a.c. into a nearly steady d.c.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
