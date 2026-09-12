/** GENERATED — real-schema geometry authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import geometryBoard from '../geometry/geometry-board/manifest.js';
import intersectingCircles from '../geometry/intersecting-circles/manifest.js';

export const blocks = [geometryBoard, intersectingCircles].map(manifestToBlock);
