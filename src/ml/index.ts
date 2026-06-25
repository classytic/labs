// @classytic/labs/ml — machine-learning & data-analytics labs. The manipulation
// IS the lesson here (drag params, watch loss/clusters/metrics), so these lean on
// the stage primitives directly: scatter + draggable controls + frame-loop +
// live readouts. RegressionLab was the litmus test for the whole ML/DA track.
export { RegressionLab, type RegressionProps } from './regression/index.js';
export { KMeansLab, type KMeansProps } from './kmeans/index.js';
export { ClassifierThresholdLab, type ClassifierProps } from './classifier/index.js';
export { DecisionBoundaryLab, type BoundaryProps, type BoundaryDataset } from './boundary/index.js';
export { KNNBoundaryLab, type KnnProps, type KnnDataset } from './knn/index.js';
