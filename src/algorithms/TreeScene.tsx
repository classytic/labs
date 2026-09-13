'use client';

import { useEffect, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BinaryTree, TreeEvent } from './tree-contract.js';
import { layoutBinaryTree } from './tree-layout.js';

export interface TreeSceneProps {
  tree: BinaryTree;
  event: TreeEvent;
  visited?: ReadonlySet<string>;
  onNodeSelect?: (id: string) => void;
}

// node radii + label in the SAME natural units as the layout gaps (see tree-layout);
// gap(56/74) > 2·R(16) guarantees nodes never touch, at any tree size or shape.
const R_HALO = 22,
  R_FACE = 16,
  FONT = 10,
  PAD = 34;
// beyond this natural size the tree can't stay readable when fit-to-canvas, so we let
// the learner pan/zoom instead of squinting at a shrunk-to-fit diagram.
const READABLE_W = 760,
  READABLE_H = 620;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function TreeScene({ tree, event, visited = new Set(), onNodeSelect }: TreeSceneProps) {
  const positions = layoutBinaryTree(tree);
  const at = new Map(positions.map((item) => [item.id, item]));
  const nodes = new Map(tree.nodes.map((node) => [node.id, node]));
  const current =
    'nodeId' in event ? event.nodeId : event.type === 'descend' ? (event.to ?? event.from) : undefined;
  const active = event.type === 'descend' ? `${event.from}:${event.to}` : undefined;

  // natural bounding box of the laid-out tree (grows with the tree, so nodes keep their gaps)
  const xs = positions.length ? positions.map((p) => p.x) : [0];
  const ys = positions.length ? positions.map((p) => p.y) : [0];
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  const box: Box = {
    x: minX - PAD,
    y: minY - PAD,
    w: Math.max(1, Math.max(...xs) - minX) + PAD * 2,
    h: Math.max(1, Math.max(...ys) - minY) + PAD * 2,
  };
  const large = box.w > READABLE_W || box.h > READABLE_H;

  // pan/zoom viewBox, reset to fit whenever the tree STRUCTURE changes (not on every step)
  const [view, setView] = useState<Box>(box);
  const structure = positions.map((p) => p.id).join('|');
  const lastStructure = useRef(structure);
  useEffect(() => {
    if (lastStructure.current !== structure) {
      lastStructure.current = structure;
      setView(box);
    }
  }, [structure]); // eslint-disable-line react-hooks/exhaustive-deps
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const [focusId, setFocusId] = useState(() => positions[0]?.id ?? '');
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!positions.some((position) => position.id === focusId)) setFocusId(positions[0]?.id ?? '');
  }, [focusId, positions]);

  const focusNode = (id: string | undefined): void => {
    if (!id) return;
    setFocusId(id);
    nodeRefs.current.get(id)?.focus({ preventScroll: true });
  };

  const onNodeKeyDown = (key: React.KeyboardEvent<SVGGElement>, id: string): void => {
    const ordered = [...positions].sort((a, b) => a.y - b.y || a.x - b.x);
    const index = ordered.findIndex((position) => position.id === id);
    const node = nodes.get(id);
    const parent = tree.nodes.find((candidate) => candidate.left === id || candidate.right === id)?.id;
    const target =
      key.key === 'ArrowDown'
        ? ordered[index + 1]?.id
        : key.key === 'ArrowUp'
          ? ordered[index - 1]?.id
          : key.key === 'ArrowRight'
            ? (node?.left ?? node?.right)
            : key.key === 'ArrowLeft'
              ? parent
              : key.key === 'Home'
                ? ordered[0]?.id
                : key.key === 'End'
                  ? ordered.at(-1)?.id
                  : undefined;
    if (target) {
      key.preventDefault();
      focusNode(target);
      return;
    }
    if (key.key === 'Enter' || key.key === ' ') {
      key.preventDefault();
      onNodeSelect?.(id);
    }
  };

  const onWheel = (event_: React.WheelEvent) => {
    if (!large) return;
    event_.preventDefault();
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return;
    const point = svgRef.current!.createSVGPoint();
    point.x = event_.clientX;
    point.y = event_.clientY;
    const u = point.matrixTransform(ctm.inverse());
    const factor = event_.deltaY < 0 ? 0.85 : 1 / 0.85;
    setView((v) => {
      const w = Math.max(box.w * 0.22, Math.min(box.w * 2.5, v.w * factor));
      const h = w * (v.h / v.w);
      return { x: u.x - (u.x - v.x) * (w / v.w), y: u.y - (u.y - v.y) * (h / v.h), w, h };
    });
  };
  const onPointerDown = (event_: React.PointerEvent) => {
    if (!large || (event_.target as Element).closest('[role="treeitem"]')) return;
    drag.current = { x: event_.clientX, y: event_.clientY };
    (event_.currentTarget as Element).setPointerCapture?.(event_.pointerId);
  };
  const onPointerMove = (event_: React.PointerEvent) => {
    if (!drag.current) return;
    const scale = svgRef.current?.getScreenCTM()?.a || 1;
    const dx = (event_.clientX - drag.current.x) / scale;
    const dy = (event_.clientY - drag.current.y) / scale;
    drag.current = { x: event_.clientX, y: event_.clientY };
    setView((v) => ({ ...v, x: v.x - dx, y: v.y - dy }));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const vb = large ? view : box;
  return (
    <div className="tree-scene" data-pannable={large || undefined} style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        role="tree"
        aria-orientation="vertical"
        aria-label="Binary tree visualization"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={large ? { cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none' } : undefined}
      >
        {positions.flatMap((position) => {
          const node = nodes.get(position.id)!;
          return (['left', 'right'] as const).flatMap((side) => {
            const child = node[side];
            const target = child ? at.get(child) : undefined;
            if (!target) return [];
            const midY = (position.y + target.y) / 2;
            return (
              <path
                key={`${node.id}-${child}`}
                className="tree-edge"
                data-active={active === `${node.id}:${child}` || undefined}
                d={`M${position.x} ${position.y + R_FACE} C${position.x} ${midY},${target.x} ${midY},${target.x} ${target.y - R_FACE}`}
              />
            );
          });
        })}
        {positions.map((position) => {
          const node = nodes.get(position.id)!;
          return (
            <g
              key={node.id}
              ref={(element) => {
                if (element) nodeRefs.current.set(node.id, element);
                else nodeRefs.current.delete(node.id);
              }}
              className="tree-node"
              transform={`translate(${position.x} ${position.y})`}
              data-current={node.id === current || undefined}
              data-visited={visited.has(node.id) || undefined}
              role="treeitem"
              aria-level={position.depth + 1}
              aria-label={`Node ${node.value}, depth ${position.depth}`}
              tabIndex={onNodeSelect ? (node.id === focusId ? 0 : -1) : undefined}
              onFocus={() => setFocusId(node.id)}
              onClick={() => {
                setFocusId(node.id);
                onNodeSelect?.(node.id);
              }}
              onKeyDown={(key) => onNodeKeyDown(key, node.id)}
            >
              <circle className="tree-node-halo" r={R_HALO} />
              <circle className="tree-node-face" r={R_FACE} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={FONT} fontWeight={800}>
                {node.value}
              </text>
            </g>
          );
        })}
      </svg>
      {large && (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="lab-icon-button"
          onClick={() => setView(box)}
          title="Fit tree to view"
          aria-label="Fit tree to view"
          style={{ position: 'absolute', top: 8, right: 8 }}
        >
          <Maximize2 aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
