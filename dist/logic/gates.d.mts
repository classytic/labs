//#region src/logic/gates.d.ts
/**
 * The built-in logic gates. Each is ONE GateDef: its boolean function + its glyph.
 * AND/OR are variadic (n inputs); NOT/buffer take one. NAND is the universal gate —
 * every other gate can be built from NANDs (the lessons lean on this).
 */
/** Register the built-in gates (idempotent). Imported for its side effect. */
declare function registerBuiltinGates(): void;
//#endregion
export { registerBuiltinGates };