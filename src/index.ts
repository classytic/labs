/**
 * Root export = the lightweight labs toolkit (`@classytic/labs/core`).
 *
 * Domain labs live behind their own subpaths so consumers pay only for what
 * they import, there is intentionally NO barrel that pulls every domain:
 *   import { ProjectileLab } from '@classytic/labs/physics';
 *   import { TrigExplorer }  from '@classytic/labs/math';
 *   import { labsBlocks }    from '@classytic/labs/blocks';
 */

export * from './core/index.js';
