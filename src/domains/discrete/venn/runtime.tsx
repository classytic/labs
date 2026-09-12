'use client';

/** Venn lab runtime — its own lazy chunk. The set logic lives in the discrete engine
 *  kernel (pure, browser-free), so this is drawing only: re-export the engine component. */
export { VennSetBoardLab as default } from '../../../discrete/venn/index.js';
