import { ReactNode } from "react";

//#region src/blocks/authoring.d.ts
/**
 * Coerce a block attribute into an array. MDX↔Slate round-trips can hand an array
 * attribute back as a JSON STRING (when a block has no `fromAttrs` parser), so a
 * bare `attr ?? []` slips a string through and `.map` throws. Always read array
 * attrs through this: array → as-is, JSON-string-of-array → parsed, else fallback.
 */
declare function coerceArray<T>(raw: unknown, fallback?: T[]): T[];
//#endregion
export { coerceArray };