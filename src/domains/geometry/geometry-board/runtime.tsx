'use client';

/** Geometry board runtime — render the (possibly authored) construction, else the default scene. */
import type { ReactNode } from 'react';
import { GeometryBoard } from '../../../geometry/board/index.js';
import { asScene } from './scene.js';

export default function GeometryBoardLab(a: { scene?: unknown; title?: string }): ReactNode {
  return <GeometryBoard scene={asScene(a.scene)} title={a.title ?? 'Geometry'} />;
}
