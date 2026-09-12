import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../src/authoring/quality.js';
import packet from '../src/domains/networking/packet-journey/manifest.js';
import projectile from '../src/domains/physics/projectile-lab/manifest.js';
import heating from '../src/domains/physics/heating-curve/manifest.js';
import periodicTrends from '../src/domains/chem/periodic-trends/manifest.js';
import transistor from '../src/domains/circuits/transistor/manifest.js';
import graphAlgorithm from '../src/domains/ict/graph-algorithm/manifest.js';
import demandShift from '../src/domains/economics/demand-shift-vs-move/manifest.js';
import rcCharging from '../src/domains/circuits/rc-charging/manifest.js';
import stoichiometry from '../src/domains/chem/stoichiometry/manifest.js';
import gridPath from '../src/domains/ict/grid-path-dp/manifest.js';
import breakEven from '../src/domains/accounting/break-even/manifest.js';
import titration from '../src/domains/chem/titration/manifest.js';
import diode from '../src/domains/circuits/diode/manifest.js';
import treeQuest from '../src/domains/ict/tree-quest/manifest.js';
import compoundInterest from '../src/domains/accounting/compound-interest/manifest.js';
import kinetics from '../src/domains/chem/kinetics/manifest.js';
import hallEffect from '../src/domains/circuits/hall-effect/manifest.js';
import heapQuest from '../src/domains/ict/heap-quest/manifest.js';
import marketEquilibrium from '../src/domains/economics/market-equilibrium/manifest.js';
import normalDistribution from '../src/domains/statistics/normal/manifest.js';
import samplingDistribution from '../src/domains/statistics/sampling/manifest.js';
import galtonBoard from '../src/domains/statistics/galton/manifest.js';
import zTable from '../src/domains/statistics/z-table/manifest.js';
import centerSpread from '../src/domains/statistics/center-spread/manifest.js';
import histogram from '../src/domains/statistics/histogram/manifest.js';
import series from '../src/domains/statistics/series/manifest.js';
import binomial from '../src/domains/discrete/binomial/manifest.js';
import hypergeometric from '../src/domains/discrete/hypergeometric/manifest.js';
import expectedValue from '../src/domains/discrete/expected-value/manifest.js';
import bayes from '../src/domains/discrete/bayes/manifest.js';
import lln from '../src/domains/discrete/lln/manifest.js';
import montyHall from '../src/domains/discrete/monty-hall/manifest.js';
import monteCarlo from '../src/domains/discrete/monte-carlo/manifest.js';
import sampleSpace from '../src/domains/discrete/sample-space/manifest.js';
import countingTree from '../src/domains/discrete/counting-tree/manifest.js';
import combinationStudio from '../src/domains/discrete/combination-studio/manifest.js';
import arrangements from '../src/domains/discrete/arrangements/manifest.js';
import selection from '../src/domains/discrete/selection/manifest.js';
import countingSlots from '../src/domains/discrete/counting-slots/manifest.js';
import outcomeBuilder from '../src/domains/discrete/outcome-builder/manifest.js';
import truthTable from '../src/domains/discrete/truth-table/manifest.js';
import karnaugh from '../src/domains/discrete/karnaugh/manifest.js';
import venn from '../src/domains/discrete/venn/manifest.js';
import pascal from '../src/domains/discrete/pascal/manifest.js';
import ruleCard from '../src/domains/discrete/rule-card/manifest.js';
import classifierThreshold from '../src/domains/ml/classifier-threshold/manifest.js';
import regression from '../src/domains/ml/regression/manifest.js';
import decisionBoundary from '../src/domains/ml/decision-boundary/manifest.js';
import kmeans from '../src/domains/ml/kmeans/manifest.js';
import knn from '../src/domains/ml/knn/manifest.js';
import photosynthesisFactors from '../src/domains/biology/photosynthesis-factors/manifest.js';
import respiration from '../src/domains/biology/respiration/manifest.js';
import geneticCross from '../src/domains/biology/genetic-cross/manifest.js';
import punnettCross from '../src/domains/biology/punnett-cross/manifest.js';
import sexLinkedCross from '../src/domains/biology/sex-linked-cross/manifest.js';
import enzymeRate from '../src/domains/biology/enzyme-rate/manifest.js';
import sequence from '../src/domains/biology/sequence/manifest.js';
import centralDogma from '../src/domains/biology/central-dogma/manifest.js';
import cycle from '../src/domains/geography/cycle/manifest.js';
import dictation from '../src/domains/language/dictation/manifest.js';
import listening from '../src/domains/language/listening/manifest.js';
import agreement from '../src/domains/language/agreement/manifest.js';
import articleLens from '../src/domains/language/article-lens/manifest.js';
import cloze from '../src/domains/language/cloze/manifest.js';
import errorCorrect from '../src/domains/language/error-correct/manifest.js';
import preposition from '../src/domains/language/preposition/manifest.js';
import reading from '../src/domains/language/reading/manifest.js';
import sentenceBuilder from '../src/domains/language/sentence-builder/manifest.js';
import transform from '../src/domains/language/transform/manifest.js';
import wordMatch from '../src/domains/language/word-match/manifest.js';
import equationBalance from '../src/domains/accounting/equation-balance/manifest.js';
import journalPoster from '../src/domains/accounting/journal-poster/manifest.js';
import statementSorter from '../src/domains/accounting/statement-sorter/manifest.js';
import statementBuilder from '../src/domains/accounting/statement-builder/manifest.js';
import eoq from '../src/domains/accounting/eoq/manifest.js';
import reorderPoint from '../src/domains/accounting/reorder-point/manifest.js';
import apportion from '../src/domains/accounting/apportion/manifest.js';
import warehouseAllocation from '../src/domains/accounting/warehouse-allocation/manifest.js';

describe('flagship community experience contracts', () => {
  for (const manifest of [
    packet,
    projectile,
    heating,
    periodicTrends,
    transistor,
    graphAlgorithm,
    demandShift,
    rcCharging,
    stoichiometry,
    gridPath,
    breakEven,
    titration,
    diode,
    treeQuest,
    compoundInterest,
    kinetics,
    hallEffect,
    heapQuest,
    marketEquilibrium,
    normalDistribution,
    samplingDistribution,
    galtonBoard,
    zTable,
    centerSpread,
    histogram,
    series,
    binomial,
    hypergeometric,
    expectedValue,
    bayes,
    lln,
    montyHall,
    monteCarlo,
    sampleSpace,
    countingTree,
    combinationStudio,
    arrangements,
    selection,
    countingSlots,
    outcomeBuilder,
    truthTable,
    karnaugh,
    venn,
    pascal,
    ruleCard,
    classifierThreshold,
    regression,
    decisionBoundary,
    kmeans,
    knn,
    photosynthesisFactors,
    respiration,
    geneticCross,
    punnettCross,
    sexLinkedCross,
    enzymeRate,
    sequence,
    centralDogma,
    cycle,
    dictation,
    listening,
    agreement,
    articleLens,
    cloze,
    errorCorrect,
    preposition,
    reading,
    sentenceBuilder,
    transform,
    wordMatch,
    equationBalance,
    journalPoster,
    statementSorter,
    statementBuilder,
    eoq,
    reorderPoint,
    apportion,
    warehouseAllocation,
  ]) {
    it(`${manifest.id} declares a showcase-ready learning and access contract`, () => {
      expect(assessLabExperience(manifest)).toEqual({ ready: true, issues: [] });
    });
  }
});
