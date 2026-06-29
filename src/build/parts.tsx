/**
 * @deprecated Components now live one-per-file under ./parts/ (cell.tsx, resistor.tsx, …),
 * registered by ./parts/index.ts. This barrel re-exports that registry so existing
 * `./parts.js` importers keep working. Import from './parts/index.js' in new code.
 */

export * from './parts/index.js';
