'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import {
  AuthoredActivityRuntime,
  AuthoredMetricGate,
  type AuthoredActivityContext,
} from '../../kit/authored-activity-runtime.js';
import { Segmented } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { mitosisExplorerActivity } from './activity.js';
import {
  MITOSIS_CHECKPOINTS,
  attachmentEvidence,
  mitosisState,
  type KinetochoreAttachments,
  type MitosisCheckpoint,
  type MitosisState,
  type SpindlePole,
} from './core.js';

export interface MitosisSceneProps {
  state: MitosisState;
  attachments: KinetochoreAttachments;
  selectedSister: 'a' | 'b';
  onSelectSister: (sister: 'a' | 'b') => void;
  onAttach: (pole: SpindlePole) => void;
}
export type MitosisSceneRenderer = ComponentType<MitosisSceneProps>;
export interface MitosisExplorerLabProps {
  checkpoint?: MitosisCheckpoint;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: MitosisSceneRenderer;
}
export function MitosisSemanticScene({
  state,
  attachments = { a: null, b: null },
}: {
  state: MitosisState;
  attachments?: KinetochoreAttachments;
}): ReactNode {
  const result = attachmentEvidence(attachments);
  const condensed = state.chromosomesCondensed;
  const separated = state.checkpoint === 'anaphase';
  return (
    <svg viewBox="0 0 720 400" width="100%" role="img" aria-label={`${state.title}. ${state.summary}`}>
      <title>{state.title}</title>
      <desc>{state.summary}</desc>
      <defs>
        <radialGradient id="mitosis-cell" cx="42%" cy="35%">
          <stop offset="0" stopColor="var(--stage-bg)" />
          <stop offset="1" stopColor="color-mix(in oklab, var(--stage-accent) 14%, var(--stage-bg))" />
        </radialGradient>
      </defs>
      <ellipse
        cx="360"
        cy="204"
        rx="276"
        ry="160"
        fill="url(#mitosis-cell)"
        stroke="var(--stage-accent-2)"
        strokeWidth="4"
      />
      {state.nuclearEnvelope !== 'absent' && (
        <ellipse
          cx="360"
          cy="204"
          rx={state.checkpoint === 'cell' ? 94 : 146}
          ry={state.checkpoint === 'cell' ? 76 : 118}
          fill="color-mix(in oklab, var(--stage-accent) 12%, var(--stage-bg))"
          stroke="var(--stage-accent)"
          strokeWidth="3"
          strokeDasharray={state.nuclearEnvelope === 'breaking-down' ? '12 10' : undefined}
        />
      )}
      {!condensed &&
        Array.from({ length: 9 }, (_, index) => {
          const x = 320 + (index % 3) * 40,
            y = 162 + Math.floor(index / 3) * 42;
          return (
            <path
              key={index}
              d={`M ${x - 12} ${y + 8} C ${x - 22} ${y - 13}, ${x + 20} ${y - 14}, ${x + 12} ${y + 8}`}
              fill="none"
              stroke={index % 2 ? 'var(--stage-warn)' : 'var(--stage-accent)'}
              strokeWidth="7"
              strokeLinecap="round"
            />
          );
        })}
      {condensed &&
        !separated &&
        [-72, -24, 24, 72].map((dy, index) => (
          <g key={dy} transform={`translate(${360 + (index % 2 ? 22 : -22)} ${204 + dy}) rotate(45)`}>
            <path
              d="M -18 0 L 18 0 M 0 -18 L 0 18"
              stroke={index % 2 ? 'var(--stage-warn)' : 'var(--stage-accent)'}
              strokeWidth="10"
              strokeLinecap="round"
            />
          </g>
        ))}
      {state.checkpoint === 'metaphase' && (
        <>
          <circle cx="112" cy="204" r="13" fill="var(--stage-accent-2)" />
          <circle cx="608" cy="204" r="13" fill="var(--stage-accent-2)" />
          <path
            d="M 125 204 L 338 180 M 595 204 L 382 228"
            stroke={result.stable ? 'var(--stage-accent-2)' : 'var(--stage-warn)'}
            strokeWidth="3"
          />
        </>
      )}
      {separated &&
        [-1, 1].flatMap((side) =>
          [-84, -28, 28, 84].map((dy, index) => (
            <path
              key={`${side}-${dy}`}
              d={`M ${360 + side * (86 + index * 18)} ${204 + dy - 13} L ${360 + side * (110 + index * 18)} ${204 + dy + 13}`}
              stroke={index % 2 ? 'var(--stage-warn)' : 'var(--stage-accent)'}
              strokeWidth="10"
              strokeLinecap="round"
            />
          )),
        )}
      <text x="360" y="376" textAnchor="middle" className="modern-scene-label" fill="var(--stage-fg)">
        {state.title}
      </text>
    </svg>
  );
}

function checkpointFrom(context: AuthoredActivityContext, fallback: MitosisCheckpoint): MitosisCheckpoint {
  return MITOSIS_CHECKPOINTS.includes(context.sequence.current.id as MitosisCheckpoint)
    ? (context.sequence.current.id as MitosisCheckpoint)
    : fallback;
}

export function MitosisExplorerLab({
  checkpoint: initial = 'cell',
  title = 'Explore the cell: chromosome division',
  prompt = 'Move from the whole cell into the nucleus, then repair a spindle attachment before duplicated chromosomes separate.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: MitosisExplorerLabProps = {}): ReactNode {
  const [selectedSister, setSelectedSister] = useState<'a' | 'b'>('a');
  const [attachments, setAttachments] = useState<KinetochoreAttachments>({
    a: 'left',
    b: 'left',
  });
  const attachment = attachmentEvidence(attachments);
  const attach = (pole: SpindlePole): void =>
    setAttachments((current) => ({ ...current, [selectedSister]: pole }));
  const runtime =
    activity ?? (objectives ? { ...mitosisExplorerActivity.source, objectives } : mitosisExplorerActivity);
  const stateFor = (context: AuthoredActivityContext) => mitosisState(checkpointFrom(context, initial));
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="mitosis-explorer"
      focusLayout="immersive"
      initialStepId={initial}
      eyebrow="Cell biology · spatial exploration"
      title={title}
      description={prompt}
      status={(context) => {
        const state = stateFor(context);
        return (
          <>
            <span>{state.chromosomeCount} chromosomes</span>
            {state.checkpoint === 'metaphase' && (
              <span>{attachment.stable ? 'ready to separate' : 'attachment unstable'}</span>
            )}
          </>
        );
      }}
      controls={(context) => {
        const state = stateFor(context);
        return state.checkpoint === 'metaphase' ? (
          <Field label="Spindle attachment">
            {/* Two independent one-of-two choices sat in one row: which sister is being wired,
                then which pole that sister attaches to. Each is its own group. */}
            <span className="lab-field-row">
              <Segmented
                ariaLabel="sister chromatid"
                value={selectedSister}
                onChange={setSelectedSister}
                options={[
                  { value: 'a', label: 'Sister A' },
                  { value: 'b', label: 'Sister B' },
                ]}
              />
              <Segmented
                ariaLabel="spindle pole"
                value={attachments[selectedSister] ?? 'none'}
                onChange={(pole) => {
                  if (pole !== 'none') attach(pole);
                }}
                options={[
                  { value: 'left', label: '← Left pole' },
                  { value: 'right', label: 'Right pole →' },
                ]}
              />
            </span>
            <small>Give the two sisters opposing attachments.</small>
            <AuthoredMetricGate
              conditionId="attachment"
              met={attachment.stable}
              complete={context.complete}
            />
          </Field>
        ) : null;
      }}
      evidence={(context) => {
        const state = stateFor(context);
        return (
          <Readout
            value={state.checkpoint === 'metaphase' ? attachment.label : state.title}
            sub={`${state.chromosomeCount} chromosomes · ${state.chromatidCount} chromatids · envelope ${state.nuclearEnvelope}`}
          />
        );
      }}
      observation={(context) => {
        const state = stateFor(context);
        return state.checkpoint === 'metaphase'
          ? attachment.stable
            ? 'Opposite-pole attachment creates tension and permits equal separation.'
            : 'Same-pole attachment cannot divide the chromosome equally.'
          : state.summary;
      }}
      transcript={(context) => {
        const state = stateFor(context);
        return <p>{state.summary} DNA replication occurred before mitosis.</p>;
      }}
    >
      {(context) => {
        const state = stateFor(context),
          sceneProps: MitosisSceneProps = {
            state,
            attachments,
            selectedSister,
            onSelectSister: setSelectedSister,
            onAttach: attach,
          };
        return (
          <SceneViewport label={`${state.checkpoint} chromosome-division model`}>
            {SceneRenderer ? <SceneRenderer {...sceneProps} /> : <MitosisSemanticScene {...sceneProps} />}
          </SceneViewport>
        );
      }}
    </AuthoredActivityRuntime>
  );
}
