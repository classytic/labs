import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id:'division-workbench', tag:'DivisionWorkbenchLab', domain:'math', group:'Number systems',
  title:'Division workbench: exchange, share and place the quotient',
  description:'Connect equal sharing, place-value exchange, the written method and decimal division in one authorable model.',
  schema:z.object({ mode:z.enum(['share','written','decimal']).optional(), dividend:z.number().positive().max(10000).optional(), divisor:z.number().positive().max(1000).optional(), precision:z.number().int().min(0).max(8).optional(), ...commonLabProps }),
  taxonomy:{ grades:['4','5','6','7'], outcomes:['division','place-value','remainders','decimal-division'], durationMinutes:12, interaction:'guided', authorability:'advanced' },
  experience:{ objectives:['Interpret division as equal sharing','Connect exchanges to quotient digits','Create equivalent decimal divisions by scaling both terms'], phases:['predict','act','observe','explain','transfer'], responses:['choice'], accessibility:{keyboard:true,textAlternative:true,reducedMotion:true} },
  loadRuntime:()=>import('./runtime.js'),
});
