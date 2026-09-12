/**
 * manifestToCatalogEntry — a `LabManifest` → a catalog row for the gallery.
 *
 * Same shape as the generated `LabCatalogEntry` (so the gallery / lazy block set read
 * it unchanged) PLUS `taxonomy`, the decision metadata the gallery can facet on
 * (grade / outcome / duration / interaction / starter — review finding #7). Pure: no
 * React, no runtime — importing this stays cheap.
 */

import type { LabCatalogEntry } from '../blocks/catalog.js';
import { labTag, type LabManifest, type LabTaxonomy } from './define-lab.js';

export interface LabManifestCatalogEntry extends LabCatalogEntry {
  taxonomy: LabTaxonomy;
}

export function manifestToCatalogEntry(manifest: LabManifest): LabManifestCatalogEntry {
  const tag = manifest.tag ?? labTag(manifest.id);
  return {
    key: manifest.id,
    // Mirror the generator: omit `tag` when it equals PascalCase(id) (the default).
    ...(tag !== labTag(manifest.id) ? { tag } : {}),
    label: manifest.title,
    description: manifest.description,
    category: 'interactive',
    void: true,
    group: manifest.group,
    domain: manifest.domain,
    taxonomy: manifest.taxonomy,
  };
}
