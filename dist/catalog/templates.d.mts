//#region src/catalog/templates.d.ts
/**
 * Register the built-in lab families. Importing this module imports each
 * preset's doc factory, which self-registers its stage asset, and adds the
 * family to the registry. New family = add one entry here.
 */
/** Register all built-in families. Called from the catalog entry (a used import
 *  so the registrations are never tree-shaken). Idempotent. */
declare function registerBuiltinTemplates(): void;
//#endregion
export { registerBuiltinTemplates };