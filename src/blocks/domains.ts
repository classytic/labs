import type { CmsBlock } from '@classytic/cms-ui/contract';
import { domainBlockLoaders } from '../domains/block-loaders.js';
import { labCatalog, type LabCatalogEntry, type LabDomain } from './catalog.js';

/** Load real-schema authoring blocks for only one subject. Results are naturally cached by
 * the ESM loader; hosts may also retain the returned array in editor state. */
export const loadLabBlocks = (domain: LabDomain): Promise<CmsBlock[]> => domainBlockLoaders[domain]();

/** Resolve either an MDX tag or block key to its owning authoring domain. */
export function labDomainForType(type: string): LabDomain | undefined {
  return labCatalog.find((entry) => entry.key === type || (entry.tag ?? pascal(entry.key)) === type)?.domain;
}

const pascal = (id: string): string =>
  id
    .split('-')
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : ''))
    .join('');

export { labCatalog, type LabCatalogEntry, type LabDomain };
