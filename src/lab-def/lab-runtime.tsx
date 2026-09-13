'use client';

/**
 * LabRuntime — render a lab from its manifest's PER-LAB lazy loader. Mirrors the
 * loading / ready / error+retry states of the domain-level LazyLab (blocks/lazy-resolve),
 * but the boundary here is one chunk PER LAB (`manifest.loadRuntime`), not per domain —
 * opening one lab downloads only that lab, not its whole subject.
 */

import { Button } from '@/components/ui/button';
import { LabEmbedProvider } from '../kit/embed.js';
import { Component, createElement, useCallback, useEffect, useState, type ReactNode } from 'react';

interface BoundaryProps {
  children: ReactNode;
  /** Change this to clear a caught error and try rendering again (e.g. the edited attrs). */
  resetKey?: string;
}
interface BoundaryState {
  message: string | null;
  key: string | undefined;
}

/**
 * Catches a lab that throws while RENDERING (bad authored data, not a failed import).
 *
 * Without it the throw escapes to the host's per-block boundary, which replaces the whole
 * block — including its config panel — so an author faced with "couldn't render" had no way
 * to reach the field that was wrong. Keeping the failure inside the preview leaves the panel
 * usable, and editing any value resets the boundary so the fix shows immediately.
 */
export class LabRenderBoundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = { message: null, key: props.resetKey };
  }
  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { message: error.message || 'This lab could not render.' };
  }
  static getDerivedStateFromProps(props: BoundaryProps, state: BoundaryState): Partial<BoundaryState> | null {
    return props.resetKey === state.key ? null : { message: null, key: props.resetKey };
  }
  render(): ReactNode {
    if (this.state.message === null) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          display: 'grid',
          gap: 4,
          padding: '10px 12px',
          borderRadius: 8,
          background: 'color-mix(in oklab, var(--destructive, #b91c1c) 8%, transparent)',
          color: 'var(--destructive, #b91c1c)',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <strong>This lab can’t preview with its current settings.</strong>
        <span>{this.state.message}</span>
        <span style={{ opacity: 0.8 }}>Fix it in the panel above; the preview returns on change.</span>
      </div>
    );
  }
}

type RuntimeComponent = (attrs: Record<string, unknown>) => ReactNode;

export interface LabRuntimeProps {
  /** The manifest's `loadRuntime` — a stable per-lab dynamic import. */
  loader: () => Promise<{ default: RuntimeComponent }>;
  /** Block attributes, spread into the resolved component. */
  attributes: Record<string, unknown>;
}

export function LabRuntime({ loader, attributes }: LabRuntimeProps): ReactNode {
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'error';
    Comp: RuntimeComponent | null;
  }>({ status: 'loading', Comp: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading', Comp: null });
    loader().then(
      (mod) => {
        if (alive) setState({ status: 'ready', Comp: mod.default });
      },
      () => {
        if (alive) setState({ status: 'error', Comp: null });
      },
    );
    return () => {
      alive = false;
    };
  }, [loader, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (state.status === 'error') {
    return (
      <div
        role="alert"
        style={{
          display: 'grid',
          placeItems: 'center',
          gap: 8,
          minHeight: 80,
          padding: 12,
          color: 'var(--destructive, #b91c1c)',
          fontSize: 12,
          textAlign: 'center',
        }}
      >
        <span>This lab failed to load.</span>
        <Button type="button" size="sm" variant="outline" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }
  if (state.status === 'loading' || !state.Comp) {
    return (
      <div
        aria-busy="true"
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: 80,
          color: 'var(--stage-muted)',
          fontSize: 12,
        }}
      >
        loading lab…
      </div>
    );
  }
  /**
   * Every lab rendered from an MDX tag arrives here, and only here, so this is where a
   * lab learns that the surrounding lesson has already introduced it. Importing a lab
   * component directly (gallery, stage-preview, authoring) bypasses this and keeps the
   * full self-introducing heading, which is correct: there, nothing else names it.
   */
  return createElement(LabEmbedProvider, null, createElement(state.Comp, attributes));
}
