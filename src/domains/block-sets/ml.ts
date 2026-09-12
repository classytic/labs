/** GENERATED — real-schema ml authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import classifierThreshold from '../ml/classifier-threshold/manifest.js';
import decisionBoundary from '../ml/decision-boundary/manifest.js';
import embeddingSpace from '../ml/embedding-space/manifest.js';
import kmeans from '../ml/kmeans/manifest.js';
import knn from '../ml/knn/manifest.js';
import nextToken from '../ml/next-token/manifest.js';
import regression from '../ml/regression/manifest.js';

export const blocks = [classifierThreshold, decisionBoundary, embeddingSpace, kmeans, knn, nextToken, regression].map(manifestToBlock);
