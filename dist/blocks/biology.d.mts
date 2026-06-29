import { EnzymeRateLab } from "../biology/enzyme-rate/preset.mjs";
import { PhotosynthesisFactorsLab } from "../biology/photosynthesis-factors/preset.mjs";
import { PunnettCrossLab } from "../biology/punnett-cross/preset.mjs";
import { RespirationLab } from "../biology/respiration/preset.mjs";
import { GeneticCrossLab } from "../biology/genetic-cross/preset.mjs";
import { SexLinkedCrossLab } from "../biology/genetic-cross/sex-linked.mjs";
import { SequenceLab } from "../biology/sequence/preset.mjs";
import { CentralDogmaLab } from "../biology/sequence/central-dogma.mjs";
import { z } from "zod";

//#region src/blocks/biology.d.ts
declare const EnzymeRateBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  factor: z.ZodDefault<z.ZodEnum<{
    temperature: "temperature";
    pH: "pH";
  }>>;
  optimum: z.ZodDefault<z.ZodNumber>;
  factorMin: z.ZodDefault<z.ZodNumber>;
  factorMax: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const PhotosynthesisFactorsBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  light: z.ZodDefault<z.ZodNumber>;
  co2: z.ZodDefault<z.ZodNumber>;
  temperature: z.ZodDefault<z.ZodNumber>;
  tempOptimum: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const PunnettCrossBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  parent1: z.ZodDefault<z.ZodString>;
  parent2: z.ZodDefault<z.ZodString>;
  alleleLetter: z.ZodDefault<z.ZodString>;
  dominantLabel: z.ZodDefault<z.ZodString>;
  recessiveLabel: z.ZodDefault<z.ZodString>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const RespirationBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodDefault<z.ZodEnum<{
    day: "day";
    night: "night";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const GeneticCrossBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    custom: "custom";
    monohybrid: "monohybrid";
    "blood-type": "blood-type";
    incomplete: "incomplete";
    dihybrid: "dihybrid";
  }>>;
  spec: z.ZodOptional<z.ZodObject<{
    trait: z.ZodOptional<z.ZodString>;
    alleles: z.ZodArray<z.ZodObject<{
      symbol: z.ZodString;
      rank: z.ZodNumber;
      trait: z.ZodString;
    }, z.core.$strip>>;
    blends: z.ZodOptional<z.ZodArray<z.ZodObject<{
      pair: z.ZodTuple<[z.ZodString, z.ZodString], null>;
      label: z.ZodString;
      color: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  }, z.core.$strip>>;
  parent1: z.ZodOptional<z.ZodArray<z.ZodString>>;
  parent2: z.ZodOptional<z.ZodArray<z.ZodString>>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SequenceBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodDefault<z.ZodEnum<{
    translation: "translation";
    replication: "replication";
    transcription: "transcription";
  }>>;
  template: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const SexLinkedCrossBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  allele: z.ZodDefault<z.ZodString>;
  dominant: z.ZodDefault<z.ZodString>;
  recessive: z.ZodDefault<z.ZodString>;
  mother: z.ZodOptional<z.ZodTuple<[z.ZodString, z.ZodString], null>>;
  father: z.ZodOptional<z.ZodString>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const CentralDogmaBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dna: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs + tag→component render map. */
declare const biologyBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  factor: z.ZodDefault<z.ZodEnum<{
    temperature: "temperature";
    pH: "pH";
  }>>;
  optimum: z.ZodDefault<z.ZodNumber>;
  factorMin: z.ZodDefault<z.ZodNumber>;
  factorMax: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  light: z.ZodDefault<z.ZodNumber>;
  co2: z.ZodDefault<z.ZodNumber>;
  temperature: z.ZodDefault<z.ZodNumber>;
  tempOptimum: z.ZodDefault<z.ZodNumber>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  parent1: z.ZodDefault<z.ZodString>;
  parent2: z.ZodDefault<z.ZodString>;
  alleleLetter: z.ZodDefault<z.ZodString>;
  dominantLabel: z.ZodDefault<z.ZodString>;
  recessiveLabel: z.ZodDefault<z.ZodString>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  mode: z.ZodDefault<z.ZodEnum<{
    day: "day";
    night: "night";
  }>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  preset: z.ZodDefault<z.ZodEnum<{
    custom: "custom";
    monohybrid: "monohybrid";
    "blood-type": "blood-type";
    incomplete: "incomplete";
    dihybrid: "dihybrid";
  }>>;
  spec: z.ZodOptional<z.ZodObject<{
    trait: z.ZodOptional<z.ZodString>;
    alleles: z.ZodArray<z.ZodObject<{
      symbol: z.ZodString;
      rank: z.ZodNumber;
      trait: z.ZodString;
    }, z.core.$strip>>;
    blends: z.ZodOptional<z.ZodArray<z.ZodObject<{
      pair: z.ZodTuple<[z.ZodString, z.ZodString], null>;
      label: z.ZodString;
      color: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    colors: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
  }, z.core.$strip>>;
  parent1: z.ZodOptional<z.ZodArray<z.ZodString>>;
  parent2: z.ZodOptional<z.ZodArray<z.ZodString>>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  kind: z.ZodDefault<z.ZodEnum<{
    translation: "translation";
    replication: "replication";
    transcription: "transcription";
  }>>;
  template: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  allele: z.ZodDefault<z.ZodString>;
  dominant: z.ZodDefault<z.ZodString>;
  recessive: z.ZodDefault<z.ZodString>;
  mother: z.ZodOptional<z.ZodTuple<[z.ZodString, z.ZodString], null>>;
  father: z.ZodOptional<z.ZodString>;
  predictFirst: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  dna: z.ZodOptional<z.ZodArray<z.ZodString>>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const biologyComponents: {
  readonly EnzymeRate: typeof EnzymeRateLab;
  readonly PhotosynthesisFactors: typeof PhotosynthesisFactorsLab;
  readonly PunnettCross: typeof PunnettCrossLab;
  readonly Respiration: typeof RespirationLab;
  readonly GeneticCross: typeof GeneticCrossLab;
  readonly Sequence: typeof SequenceLab;
  readonly SexLinkedCross: typeof SexLinkedCrossLab;
  readonly CentralDogma: typeof CentralDogmaLab;
};
//#endregion
export { CentralDogmaBlock, EnzymeRateBlock, GeneticCrossBlock, PhotosynthesisFactorsBlock, PunnettCrossBlock, RespirationBlock, SequenceBlock, SexLinkedCrossBlock, biologyBlocks, biologyComponents };