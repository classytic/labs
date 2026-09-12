export const MITOSIS_CHECKPOINTS = ['cell', 'nucleus', 'prophase', 'metaphase', 'anaphase'] as const;
export type MitosisCheckpoint = (typeof MITOSIS_CHECKPOINTS)[number];
export type SpindlePole = 'left' | 'right';
export interface KinetochoreAttachments {
  a: SpindlePole | null;
  b: SpindlePole | null;
}
export function attachmentEvidence(attachments: KinetochoreAttachments): { stable: boolean; label: string } {
  if (!attachments.a || !attachments.b) return { stable: false, label: 'incomplete attachment' };
  if (attachments.a === attachments.b)
    return { stable: false, label: 'same-pole attachment · no opposing tension' };
  return { stable: true, label: 'bi-oriented · opposing tension' };
}
export interface MitosisState {
  checkpoint: MitosisCheckpoint;
  index: number;
  title: string;
  summary: string;
  dnaReplicated: boolean;
  chromosomesCondensed: boolean;
  nuclearEnvelope: 'intact' | 'breaking-down' | 'absent';
  sisterChromatidsAttached: boolean;
  chromosomeCount: number;
  chromatidCount: number;
}
const DETAILS: Record<MitosisCheckpoint, Omit<MitosisState, 'checkpoint' | 'index'>> = {
  cell: {
    title: 'Cell overview',
    summary:
      'Orient yourself: membrane outside, nucleus inside, duplicated DNA still dispersed as chromatin.',
    dnaReplicated: true,
    chromosomesCondensed: false,
    nuclearEnvelope: 'intact',
    sisterChromatidsAttached: true,
    chromosomeCount: 4,
    chromatidCount: 8,
  },
  nucleus: {
    title: 'Inside the nucleus',
    summary:
      'DNA replication finished before mitosis. Each chromosome already consists of two sister chromatids.',
    dnaReplicated: true,
    chromosomesCondensed: false,
    nuclearEnvelope: 'intact',
    sisterChromatidsAttached: true,
    chromosomeCount: 4,
    chromatidCount: 8,
  },
  prophase: {
    title: 'Prophase: chromosomes condense',
    summary:
      'Chromatin compacts into visible duplicated chromosomes while the nuclear envelope begins to break down.',
    dnaReplicated: true,
    chromosomesCondensed: true,
    nuclearEnvelope: 'breaking-down',
    sisterChromatidsAttached: true,
    chromosomeCount: 4,
    chromatidCount: 8,
  },
  metaphase: {
    title: 'Metaphase: align at the equator',
    summary:
      'Spindle fibres attach to opposite sister kinetochores and duplicated chromosomes align at the metaphase plate.',
    dnaReplicated: true,
    chromosomesCondensed: true,
    nuclearEnvelope: 'absent',
    sisterChromatidsAttached: true,
    chromosomeCount: 4,
    chromatidCount: 8,
  },
  anaphase: {
    title: 'Anaphase: sisters separate',
    summary:
      'Cohesion is released. Sister chromatids move to opposite poles and each is now an individual chromosome.',
    dnaReplicated: true,
    chromosomesCondensed: true,
    nuclearEnvelope: 'absent',
    sisterChromatidsAttached: false,
    chromosomeCount: 8,
    chromatidCount: 8,
  },
};
export function mitosisState(checkpoint: MitosisCheckpoint): MitosisState {
  return { checkpoint, index: MITOSIS_CHECKPOINTS.indexOf(checkpoint), ...DETAILS[checkpoint] };
}
export function nextMitosisCheckpoint(checkpoint: MitosisCheckpoint, direction: 1 | -1): MitosisCheckpoint {
  const index = Math.max(
    0,
    Math.min(MITOSIS_CHECKPOINTS.length - 1, MITOSIS_CHECKPOINTS.indexOf(checkpoint) + direction),
  );
  return MITOSIS_CHECKPOINTS[index]!;
}
