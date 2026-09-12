// @classytic/labs/ml, machine-learning & data-analytics labs. The manipulation
// IS the lesson here (drag params, watch loss/clusters/metrics), so these lean on
// the stage primitives directly: scatter + draggable controls + frame-loop +
// live readouts. RegressionLab was the litmus test for the whole ML/DA track.
export { RegressionLab, type RegressionProps } from '../domains/ml/regression/runtime.js';
export { KMeansLab, type KMeansProps } from '../domains/ml/kmeans/runtime.js';
export { ClassifierThresholdLab, type ClassifierProps } from '../domains/ml/classifier-threshold/runtime.js';
export {
  DecisionBoundaryLab,
  type BoundaryProps,
  type BoundaryDataset,
} from '../domains/ml/decision-boundary/runtime.js';
export { KNNBoundaryLab, type KnnProps, type KnnDataset } from '../domains/ml/knn/runtime.js';
