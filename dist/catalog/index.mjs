import { getLabTemplate, instantiateTemplate, listLabTemplates, listLabTemplatesByCategory, registerLabTemplate } from "./registry.mjs";
import { registerBuiltinTemplates } from "./templates.mjs";

//#region src/catalog/index.ts
registerBuiltinTemplates();

//#endregion
export { getLabTemplate, instantiateTemplate, listLabTemplates, listLabTemplatesByCategory, registerBuiltinTemplates, registerLabTemplate };