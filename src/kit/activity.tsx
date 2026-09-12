'use client';

import { Button } from '@/components/ui/button';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { ActionButton, IconButton, Slider } from './controls.js';

interface ActivityContextValue {
  focused: boolean;
  toggleFocus: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

const useActivity = (): ActivityContextValue => {
  const value = useContext(ActivityContext);
  if (!value) throw new Error('Activity compound components must be used inside Activity.Root');
  return value;
};

export interface ActivityRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Large-screen composition intent. Defaults to a balanced reading layout. */
  focusLayout?: 'compact' | 'standard' | 'immersive';
}

const Root = function Root({
  children,
  className,
  ref: forwardedRef,
  role,
  tabIndex,
  focusLayout = 'standard',
  ...props
}: ActivityRootProps & { ref?: Ref<HTMLDivElement> }): ReactNode {
  const rootRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === rootRef.current;
      setNativeFullscreen(active);
      if (!active && document.fullscreenElement == null) setFocused(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!focused || nativeFullscreen) return;
    const previous = document.body.style.overflow;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = rootRef.current;
    document.body.style.overflow = 'hidden';
    root?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setFocused(false);
        return;
      }
      if (event.key !== 'Tab' || !root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === root)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === root) {
        event.preventDefault();
        first.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus({ preventScroll: true });
      restoreFocusRef.current = null;
    };
  }, [focused, nativeFullscreen]);

  const toggleFocus = async (): Promise<void> => {
    if (nativeFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (focused) {
      setFocused(false);
      return;
    }
    if (rootRef.current?.requestFullscreen) {
      try {
        await rootRef.current.requestFullscreen();
        setFocused(true);
        return;
      } catch {
        // iOS and embedded browsers may reject the Fullscreen API; use focus mode.
      }
    }
    setFocused(true);
  };

  return (
    <ActivityContext.Provider value={{ focused, toggleFocus }}>
      <div
        ref={(node) => {
          rootRef.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef && 'current' in forwardedRef) forwardedRef.current = node;
        }}
        className={['not-prose lab-activity', className].filter(Boolean).join(' ')}
        data-focus={focused || undefined}
        data-focus-layout={focusLayout}
        {...props}
        role={focused && !nativeFullscreen ? 'dialog' : role}
        aria-modal={focused && !nativeFullscreen ? true : undefined}
        tabIndex={focused && !nativeFullscreen ? -1 : tabIndex}
      >
        {children}
      </div>
    </ActivityContext.Provider>
  );
};

function Header({ children }: { children: ReactNode }): ReactNode {
  return <header className="lab-activity-header">{children}</header>;
}

function Heading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}): ReactNode {
  return (
    <div className="lab-activity-heading">
      {eyebrow && <span className="lab-activity-eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
      {description && <div className="lab-activity-description">{description}</div>}
    </div>
  );
}

function FocusButton(): ReactNode {
  const { focused, toggleFocus } = useActivity();
  return (
    <Button
      className="lab-activity-focus"
      size="sm"
      variant="outline"
      type="button"
      onClick={toggleFocus}
      aria-label={focused ? 'Exit focused lab' : 'Open focused lab'}
      aria-pressed={focused}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d={focused ? 'M9 4v5H4m11-5v5h5M9 20v-5H4m11 5v-5h5' : 'M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5'}
        />
      </svg>
      <span>{focused ? 'Exit focus' : 'Focus mode'}</span>
    </Button>
  );
}

function Status({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="lab-activity-status" role="status" aria-live="polite" aria-atomic="false">
      {children}
    </div>
  );
}

function Workspace({ children }: { children: ReactNode }): ReactNode {
  return <div className="lab-activity-workspace">{children}</div>;
}

function Canvas({ children, label }: { children: ReactNode; label?: string }): ReactNode {
  return (
    <section className="lab-activity-canvas" aria-label={label}>
      {children}
    </section>
  );
}

function Dock({ children }: { children: ReactNode }): ReactNode {
  return (
    <section className="lab-activity-dock" aria-label="Model controls">
      {children}
    </section>
  );
}

function Inspector({
  children,
  label = 'Inspector',
  defaultOpen,
  responsive = true,
}: {
  children: ReactNode;
  label?: string;
  defaultOpen?: boolean;
  /** Automatically opens at wide activity widths until the learner makes a choice. */
  responsive?: boolean;
}): ReactNode {
  const ref = useRef<HTMLDetailsElement>(null);
  const userChoice = useRef(false);
  useEffect(() => {
    if (!responsive) return;
    const details = ref.current;
    const activity = details?.closest('.lab-activity');
    if (!details || !activity) return;
    const sync = (): void => {
      if (!userChoice.current) details.open = activity.getBoundingClientRect().width >= 960;
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(activity);
    return () => observer.disconnect();
  }, [responsive]);
  return (
    <details ref={ref} className="lab-activity-inspector" open={defaultOpen}>
      <summary
        onClick={() => {
          userChoice.current = true;
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') userChoice.current = true;
        }}
      >
        {label}
      </summary>
      <div className="lab-activity-inspector-body">{children}</div>
    </details>
  );
}

/**
 * Canonical content boundary inside an Inspector.
 *
 * Inspector owns disclosure and framing; InspectorSection owns its interior rhythm. Keeping
 * those responsibilities separate lets host shadcn controls retain their own sizing without
 * every lab inventing margins around them.
 */
function InspectorSection({ children, className }: { children: ReactNode; className?: string }): ReactNode {
  return (
    <div className={['lab-activity-inspector-section', className].filter(Boolean).join(' ')}>{children}</div>
  );
}

function Feedback({ children }: { children: ReactNode }): ReactNode {
  return <div className="lab-activity-feedback">{children}</div>;
}

function Transport({ children }: { children: ReactNode }): ReactNode {
  return <footer className="lab-activity-transport">{children}</footer>;
}

function Progress({
  value,
  max,
  label,
  onChange,
}: {
  value: number;
  max: number;
  label?: ReactNode;
  onChange?: (value: number) => void;
}): ReactNode {
  return (
    <div className="lab-activity-progress">
      <div>
        {label ?? (
          <>
            <strong>Step {value}</strong>
            <span>of {max}</span>
          </>
        )}
      </div>
      {onChange ? (
        <Slider
          min={1}
          max={max}
          step={1}
          value={value}
          onChange={onChange}
          ariaLabel={`Choose step, currently ${value} of ${max}`}
        />
      ) : (
        <progress value={value} max={max} aria-label={`Step ${value} of ${max}`} />
      )}
    </div>
  );
}

/** Compact progress for finite decks or repeated practice items. */
function ItemProgress({
  done,
  total,
  label = 'Done',
  segmentedMax = 8,
}: {
  done: number;
  total: number;
  label?: string;
  segmentedMax?: number;
}): ReactNode {
  if (total <= 0) return null;
  const clamped = Math.max(0, Math.min(total, done));
  const complete = clamped >= total;
  if (complete) {
    return (
      <span
        className="lab-progress"
        data-complete="true"
        role="status"
        aria-label={`${label}, ${total} of ${total}`}
      >
        <span className="lab-progress-check" aria-hidden>
          ✓
        </span>{' '}
        {label}
      </span>
    );
  }
  return (
    <span className="lab-progress" role="group" aria-label={`step ${clamped} of ${total}`}>
      {total <= segmentedMax ? (
        <span className="lab-progress-segs" aria-hidden>
          {Array.from({ length: total }, (_, index) => (
            <span key={index} className="lab-progress-seg" data-on={index < clamped ? 'true' : undefined} />
          ))}
        </span>
      ) : (
        <span className="lab-progress-bar" aria-hidden>
          <span className="lab-progress-bar-fill" style={{ width: `${(clamped / total) * 100}%` }} />
        </span>
      )}
      <span className="lab-progress-count">
        {clamped} / {total}
      </span>
    </span>
  );
}

function Transcript({
  children,
  label = 'Event transcript',
  defaultOpen = false,
}: {
  children: ReactNode;
  label?: string;
  defaultOpen?: boolean;
}): ReactNode {
  return (
    <details className="lab-activity-transcript" open={defaultOpen || undefined}>
      <summary>{label}</summary>
      {children}
    </details>
  );
}

function LiveRegion({ children }: { children: ReactNode }): ReactNode {
  return (
    <div aria-live="polite" className="lab-sr-only">
      {children}
    </div>
  );
}

export interface RunTransportProps {
  running: boolean;
  onReset: () => void;
  onToggle: () => void;
  onStep?: () => void;
  state: ReactNode;
  detail?: ReactNode;
  disabled?: boolean;
  resetLabel?: string;
  stepLabel?: string;
  runLabel?: string;
}

/** Shared reset/step/state/run transport for simulations and iterative models. */
export function RunTransport({
  running,
  onReset,
  onToggle,
  onStep,
  state,
  detail,
  disabled,
  resetLabel = 'Reset activity',
  stepLabel = 'Take one step',
  runLabel = 'Run',
}: RunTransportProps): ReactNode {
  return (
    <>
      <IconButton label={resetLabel} onClick={onReset}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
      {onStep ? (
        <IconButton label={stepLabel} onClick={onStep} disabled={disabled}>
          <StepForward aria-hidden="true" />
        </IconButton>
      ) : null}
      <div className="lab-transport-state" aria-live="polite">
        <strong>{state}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
      <ActionButton className="lab-primary-action" onClick={onToggle} pressed={running} disabled={disabled}>
        {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        {running ? 'Pause' : runLabel}
      </ActionButton>
    </>
  );
}

export const Activity = {
  Root,
  Header,
  Heading,
  FocusButton,
  Status,
  Workspace,
  Canvas,
  Dock,
  Inspector,
  InspectorSection,
  Feedback,
  Transport,
  Progress,
  ItemProgress,
  Transcript,
  LiveRegion,
};
