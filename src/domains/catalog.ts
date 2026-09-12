/**
 * DERIVED catalog for the migrated labs — computed from the manifests, not written by a
 * generator. Light + pure (no React, no runtime), so the merged public catalog can pull it
 * without dragging in editor/render code.
 */

import type { LabManifestCatalogEntry } from '../lab-def/to-catalog.js';
import { generatedManifestCatalog } from './catalog-map.js';

/** One catalog row per manifest, carrying taxonomy for gallery facets. */
export const manifestCatalog: LabManifestCatalogEntry[] = generatedManifestCatalog;

/** Fast membership set for hosts that need to resolve a catalog key. */
export const manifestKeys: ReadonlySet<string> = new Set(manifestCatalog.map((entry) => entry.key));
