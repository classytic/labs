import { Button } from '@/components/ui/button';
import type { HeapEvent } from './heap.js';
import type { SequenceItem } from './sequence-contract.js';

const positionAt = (index: number, count: number) => {
  const depth = Math.floor(Math.log2(index + 1));
  const first = 2 ** depth - 1;
  const slot = index - first;
  const slots = 2 ** depth;
  const maxDepth = Math.max(1, Math.floor(Math.log2(Math.max(1, count))));
  return { x: ((slot + 0.5) / slots) * 92 + 4, y: 12 + (depth / maxDepth) * 72 };
};

export function HeapDualView({
  items,
  event,
  selectedId,
  onSelect,
}: {
  items: SequenceItem[];
  event: HeapEvent;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const active = new Set(
    event.type === 'sequence-compare' || event.type === 'sequence-swap'
      ? event.indices
      : event.type === 'heap-append'
        ? [event.index]
        : event.type === 'heap-move-last'
          ? [event.to]
          : [],
  );
  return (
    <div className="heap-dual-view">
      <div className="heap-tree">
        <svg viewBox="0 0 100 100" role="img" aria-label={`Heap tree with ${items.length} items`}>
          {items.slice(1).map((_item, index) => {
            const child = index + 1;
            const parent = Math.floor((child - 1) / 2);
            const a = positionAt(parent, items.length);
            const b = positionAt(child, items.length);
            return (
              <line
                key={`edge-${child}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                data-active={(active.has(parent) && active.has(child)) || undefined}
              />
            );
          })}
          {items.map((item, index) => {
            const at = positionAt(index, items.length);
            return (
              <g
                key={item.id}
                className="heap-node"
                transform={`translate(${at.x} ${at.y})`}
                data-active={active.has(index) || undefined}
                data-selected={selectedId === item.id || undefined}
                role="button"
                tabIndex={0}
                aria-label={`Heap item ${item.value}, array index ${index}`}
                onClick={() => onSelect(item.id)}
                onKeyDown={(key) => {
                  if (key.key === 'Enter' || key.key === ' ') {
                    key.preventDefault();
                    onSelect(item.id);
                  }
                }}
              >
                <circle r="6" />
                <text textAnchor="middle" dominantBaseline="central" style={{ fontSize: '4.2px' }}>
                  {item.value}
                </text>
                <text className="heap-node-index" textAnchor="middle" y="10.5" style={{ fontSize: '3.2px' }}>
                  [{index}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="heap-array" role="list" aria-label="Heap array, zero based">
        {items.map((item, index) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="listitem"
            key={item.id}
            data-active={active.has(index) || undefined}
            data-selected={selectedId === item.id || undefined}
            onClick={() => onSelect(item.id)}
          >
            <small>{index}</small>
            <strong>{item.value}</strong>
          </Button>
        ))}
      </div>
      <div className="heap-relation">
        {selectedId ? (
          (() => {
            const index = items.findIndex((item) => item.id === selectedId);
            const parent = index > 0 ? Math.floor((index - 1) / 2) : undefined;
            return parent == null ? (
              <span>index 0 · root has no parent</span>
            ) : (
              <span>
                index {index} → parent ⌊({index}−1)/2⌋ = {parent} → value {items[parent]?.value}
              </span>
            );
          })()
        ) : (
          <span>Select a tree node or array cell to reveal its index relationship.</span>
        )}
        <b>0-based</b>
      </div>
    </div>
  );
}
