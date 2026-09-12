'use client';

import { useMemo, useState } from 'react';
import { RotateCcw, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildTeachingTree, type TreeBuildStrategy } from '../../../algorithms/tree-builder.js';
import type { TreeEvent } from '../../../algorithms/tree-contract.js';
import { TreeQuestLab } from '../../../algorithms/TreeQuestLab.js';
import { TreeScene } from '../../../algorithms/TreeScene.js';
import {
  BooleanField,
  ChipToggle,
  ConfigPanel,
  ConfigRow,
  NumField,
  SegmentedField,
  SelectField,
  TextArea,
  TextField,
} from '../../../blocks/authoring.js';

type Props = {
  value: Record<string, unknown>;
  onChange: (patch: Record<string, unknown>) => void;
};
const DEFAULTS = [8, 3, 10, 1, 6, 14, 4, 7, 13];
const PRESETS = [
  { label: 'Classic', values: DEFAULTS },
  { label: 'Small', values: [4, 2, 6, 1, 3, 5, 7] },
  { label: 'Challenge', values: [50, 25, 75, 10, 35, 60, 90, 5, 15, 30, 40] },
];

export default function TreeQuestAuthoring({ value, onChange }: Props) {
  const values = Array.isArray(value.values)
    ? value.values.filter((item): item is number => typeof item === 'number')
    : DEFAULTS;
  const [draft, setDraft] = useState(values.join(', '));
  const strategy: TreeBuildStrategy =
    value.strategy === 'balanced' || value.strategy === 'skewed-left' || value.strategy === 'skewed-right'
      ? value.strategy
      : 'insertion-order';
  const operation =
    value.operation === 'search' || value.operation === 'insert' || value.operation === 'avl-insert'
      ? value.operation
      : 'traversal';
  const order = value.order === 'preorder' || value.order === 'postorder' ? value.order : 'inorder';
  const target = typeof value.target === 'number' ? value.target : 13;
  const parsed = draft
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  const invalid = parsed.some((item) => !Number.isFinite(item));
  const uniqueCount = new Set(parsed).size;
  const tree = useMemo(() => buildTeachingTree(values, strategy), [strategy, values]);
  const previewEvent: TreeEvent = {
    type: 'start',
    nodeId: tree.rootId,
    message: 'Author preview',
  };
  const updateDraft = (next: string) => {
    setDraft(next);
    const numbers = next
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    if (numbers.length && numbers.every(Number.isFinite))
      onChange({ values: numbers.map(Math.trunc).slice(0, 31) });
  };
  const applyPreset = (next: number[]) => {
    setDraft(next.join(', '));
    onChange({ values: next });
  };
  const [mode, setMode] = useState<'topology' | 'learner'>('topology');
  const predict = value.predict !== false;
  const title = typeof value.title === 'string' && value.title ? value.title : undefined;
  const prompt = typeof value.prompt === 'string' && value.prompt ? value.prompt : undefined;
  // Remount the learner preview whenever the authored mission changes, so it always
  // starts the fresh trace from step 0 instead of stranding an old play position.
  const learnerKey = `${operation}|${order}|${target}|${strategy}|${values.join(',')}|${predict}`;
  return (
    <div className="tree-authoring">
      <section className="tree-authoring-preview" data-mode={mode}>
        <div className="tree-authoring-preview-head">
          <span>
            <WandSparkles aria-hidden="true" /> Preview
          </span>
          <SegmentedField
            value={mode}
            onChange={(next) => setMode(next === 'learner' ? 'learner' : 'topology')}
            ariaLabel="Preview mode"
            options={[
              { value: 'topology', label: 'Topology' },
              { value: 'learner', label: 'As a learner' },
            ]}
          />
        </div>
        {mode === 'topology' ? (
          <>
            <TreeScene tree={tree} event={previewEvent} />
            <small className="tree-authoring-preview-note">
              {tree.nodes.length} nodes · layout automatic. Switch to <strong>As a learner</strong> to play
              the full mission.
            </small>
          </>
        ) : (
          <div className="tree-authoring-learner" key={learnerKey}>
            <TreeQuestLab
              operation={operation}
              order={order}
              target={target}
              values={values}
              strategy={strategy}
              predict={predict}
              title={title}
              prompt={prompt}
            />
          </div>
        )}
      </section>
      <section className="tree-authoring-controls">
        <ConfigPanel>
          <ConfigRow
            label="Values"
            hint={
              invalid
                ? undefined
                : parsed.length !== uniqueCount
                  ? 'Duplicate values are kept once.'
                  : `${parsed.length} nodes · maximum 31.`
            }
            error={invalid ? 'Use whole numbers separated by commas.' : undefined}
          >
            <TextArea rows={2} value={draft} onChange={updateDraft} placeholder="8, 3, 10, 1, 6, 14" />
          </ConfigRow>
          <ConfigRow label="Shape">
            <SelectField
              value={strategy}
              onChange={(strategy) => onChange({ strategy })}
              options={[
                { value: 'insertion-order', label: 'Use insertion order' },
                { value: 'balanced', label: 'Balance automatically' },
                { value: 'skewed-left', label: 'Skew left' },
                { value: 'skewed-right', label: 'Skew right' },
              ]}
            />
          </ConfigRow>
          <ConfigRow label="Presets">
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESETS.map((preset) => (
                <ChipToggle
                  active={values.join(',') === preset.values.join(',')}
                  key={preset.label}
                  onClick={() => applyPreset(preset.values)}
                >
                  {preset.label}
                </ChipToggle>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                title="Restore defaults"
                aria-label="Restore default tree"
                onClick={() => applyPreset(DEFAULTS)}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
            </div>
          </ConfigRow>
        </ConfigPanel>
        <ConfigPanel>
          <ConfigRow label="Operation">
            <SelectField
              value={operation}
              onChange={(operation) => onChange({ operation })}
              options={[
                { value: 'traversal', label: 'Traversal' },
                { value: 'search', label: 'BST search' },
                { value: 'insert', label: 'BST insertion' },
                { value: 'avl-insert', label: 'AVL insertion & rotation' },
              ]}
            />
          </ConfigRow>
          {operation === 'traversal' ? (
            <ConfigRow label="Order">
              <SelectField
                value={order}
                onChange={(order) => onChange({ order })}
                options={['preorder', 'inorder', 'postorder']}
              />
            </ConfigRow>
          ) : (
            <ConfigRow label={operation === 'search' ? 'Find value' : 'Insert value'}>
              <NumField value={target} onChange={(target) => onChange({ target })} />
            </ConfigRow>
          )}
          <BooleanField
            checked={predict}
            onChange={(predict) => onChange({ predict })}
            label="Ask learners to predict decisions"
            hint="Pause before branches and rotations are revealed."
          />
        </ConfigPanel>
        <ConfigPanel>
          <ConfigRow label="Title">
            <TextField
              value={typeof value.title === 'string' ? value.title : ''}
              onChange={(title) => onChange({ title: title || undefined })}
              placeholder="Generated automatically when empty"
              className="flex-1"
            />
          </ConfigRow>
          <ConfigRow label="Prompt">
            <TextArea
              rows={3}
              value={typeof value.prompt === 'string' ? value.prompt : ''}
              onChange={(prompt) => onChange({ prompt: prompt || undefined })}
              placeholder="What should learners notice?"
            />
          </ConfigRow>
        </ConfigPanel>
      </section>
    </div>
  );
}
