// @classytic/labs/catalog, the lab-template registry + built-in families.
// Importing this registers all built-in templates.
import { registerBuiltinTemplates } from './templates.js';

registerBuiltinTemplates();

export { registerBuiltinTemplates } from './templates.js';
export {
  registerLabTemplate, listLabTemplates, listLabTemplatesByCategory, getLabTemplate, instantiateTemplate,
  type LabTemplate,
} from './registry.js';
