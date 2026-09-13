import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const choice = z.object({ value:z.string().min(1), label:z.string().min(1) });
const step = z.object({ expression:z.string().min(1), rule:z.string().min(1) });
const round = z.object({ id:z.string().min(1), expression:z.string().min(1), prompt:z.string().min(1), choices:z.array(choice).min(2).max(4), answer:z.string().min(1), steps:z.array(step).min(1) });

export default defineLab({
  id:'expression-order', tag:'ExpressionOrderLab', domain:'math', group:'Number systems',
  title:'Order of operations: make every operation wait its turn',
  description:'Predict the first valid operation, then reveal an authored chain of equivalent reductions checked by the shared Stage expression engine.',
  schema:z.object({ rounds:z.array(round).min(1).optional(), startAt:z.number().int().min(0).optional(), ...commonLabProps }),
  taxonomy:{ grades:['5','6','7','8'], outcomes:['order-of-operations','bodmas','pemdas','equivalent-expressions'], durationMinutes:10, interaction:'guided', authorability:'advanced', representation:'number', related:['division-workbench','proof-builder'] },
  experience:{ objectives:['Apply precedence before calculating','Evaluate equal-precedence operations left to right','Distinguish a negative sign from a grouped negative base'], phases:['predict','act','observe','explain','transfer'], responses:['choice'], accessibility:{keyboard:true,textAlternative:true,reducedMotion:true} },
  loadRuntime:()=>import('./runtime.js'),
});
