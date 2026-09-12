/** Metadata-only catalog derived from the single authoritative manifest registry. */
import { manifestCatalog } from '../domains/catalog.js';

export type LabDomain =
  | 'accounting'
  | 'biology'
  | 'chem'
  | 'circuits'
  | 'discrete'
  | 'economics'
  | 'exam'
  | 'geography'
  | 'geometry'
  | 'ict'
  | 'language'
  | 'math'
  | 'ml'
  | 'networking'
  | 'physics'
  | 'statistics';

export interface LabCatalogEntry {
  key: string;
  tag?: string;
  label: string;
  description: string;
  category: string;
  void: boolean;
  group: string;
  domain: LabDomain;
}

/** All labs come from manifests; there is no parallel legacy catalog. */
export const labCatalog: LabCatalogEntry[] = manifestCatalog;
