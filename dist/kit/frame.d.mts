import { ReactNode, Ref } from "react";

//#region src/kit/frame.d.ts
/** Per-control creator overrides: two name-lists, ergonomic for authors + agents. */
interface ControlConfig {
  /** Control names to remove entirely (learner can't see or change them). */
  hide?: string[];
  /** Control names to show read-only (frozen at the creator's initial value). */
  lock?: string[];
}
interface LabFrameProps {
  title?: string;
  prompt?: string;
  /** Collapsed "goals" disclosure (the old upfront Objectives wall, tamed). */
  objectives?: string[];
  /** The dominant visual. */
  children: ReactNode;
  /** Optional narrow side column (readouts, a guess, a result callout). */
  aside?: ReactNode;
  /** The single controls bar, pass <ControlBar>…</ControlBar>. */
  controls?: ReactNode;
  /** Quiet footer: feedback / hints / reveal / a note. */
  footer?: ReactNode;
  /** Ref on the outer container, e.g. for useInView() to pause a sim off-screen. */
  rootRef?: Ref<HTMLDivElement>;
  /** Creator's per-control hide/lock policy, flows to every Field/Control below. */
  controlConfig?: ControlConfig;
}
declare function LabFrame({
  title,
  prompt,
  objectives,
  children,
  aside,
  controls,
  footer,
  rootRef,
  controlConfig
}: LabFrameProps): ReactNode;
/** The single controls bar. Put `Field`s (or any control) inside. */
declare function ControlBar({
  children
}: {
  children: ReactNode;
}): ReactNode;
/**
 * A labelled control: small-caps label + (control + value) on one row.
 * Participates in creator `controlConfig` via `name ?? label`.
 */
declare function Field({
  label,
  name,
  value,
  children
}: {
  label: string;
  name?: string;
  value?: ReactNode;
  children: ReactNode;
}): ReactNode;
/** A highlighted readout box. `tone="result"` for the headline answer. */
declare function Callout({
  tone,
  children
}: {
  tone?: 'info' | 'result';
  children: ReactNode;
}): ReactNode;
//#endregion
export { Callout, ControlBar, ControlConfig, Field, LabFrame };