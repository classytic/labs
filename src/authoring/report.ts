import type { LabManifest } from '../lab-def/define-lab.js';
import type { AuthoredActivity, CompiledAuthoredActivity } from '../kit/activity-authoring.js';
import { assessLabExperience } from './quality.js';

export type LabQualityStatus = 'ready' | 'incomplete' | 'undeclared';
export interface LabQualityEntry {
  id: string;
  domain: string;
  title: string;
  starter: boolean;
  status: LabQualityStatus;
  issues: string[];
}
export interface LabQualityReport {
  total: number;
  ready: number;
  incomplete: number;
  undeclared: number;
  entries: LabQualityEntry[];
}

/** Deterministic manifest-level report; rendering and learner validation remain separate gates. */
export function createLabQualityReport(
  manifests: readonly LabManifest[],
  domain?: string,
  activities: Readonly<Record<string, AuthoredActivity | CompiledAuthoredActivity>> = {},
): LabQualityReport {
  const entries = manifests
    .filter((manifest) => !domain || manifest.domain === domain)
    .map((manifest): LabQualityEntry => {
      const assessment = assessLabExperience(manifest, activities[manifest.id]);
      return {
        id: manifest.id,
        domain: manifest.domain,
        title: manifest.title,
        starter: manifest.taxonomy.starter === true,
        status: assessment.ready ? 'ready' : manifest.experience ? 'incomplete' : 'undeclared',
        issues: assessment.issues,
      };
    })
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.id.localeCompare(b.id));
  return {
    total: entries.length,
    ready: entries.filter((entry) => entry.status === 'ready').length,
    incomplete: entries.filter((entry) => entry.status === 'incomplete').length,
    undeclared: entries.filter((entry) => entry.status === 'undeclared').length,
    entries,
  };
}
