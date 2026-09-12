'use client';

/**
 * Small authoring-UI primitives for the circuit editor. They are deliberately styled
 * with the HOST shadcn design tokens (--background, --card, --border, --foreground,
 * --muted-foreground, --primary, --accent, --radius) so the editor adopts the
 * consumer's globals.css automatically — light/dark, brand colour, corner radius.
 * Literal fallbacks keep it usable standalone. No hardcoded brand colours.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ReactNode, CSSProperties } from 'react';

export function Panel({
  title,
  children,
  style,
}: {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
}): ReactNode {
  return (
    <div className="editor-panel" style={style}>
      {title && <div className="editor-panel-title">{title}</div>}
      {children}
    </div>
  );
}

export function EBtn({
  children,
  onClick,
  active,
  variant = 'default',
  title,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  title?: string;
  disabled?: boolean;
}): ReactNode {
  const buttonVariant =
    variant === 'danger'
      ? 'destructive'
      : variant === 'primary'
        ? 'default'
        : variant === 'ghost'
          ? 'ghost'
          : 'outline';
  return (
    <Button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      variant={buttonVariant}
      className="editor-button"
      data-variant={variant}
      data-active={active || undefined}
    >
      {children}
    </Button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function NumInput({
  value,
  onChange,
  step = 1,
  min,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  ariaLabel?: string;
}): ReactNode {
  return (
    <Input
      type="number"
      value={value}
      step={step}
      min={min}
      aria-label={ariaLabel}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(v);
      }}
      className="editor-number-input"
    />
  );
}

export function TextInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
}): ReactNode {
  return (
    <Input
      type="text"
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      className="editor-text-input"
    />
  );
}

/**
 * ZoomBar — the pan/zoom controls that float over the canvas (bottom-left), fed by
 * `useCanvasViewport`. Zoom out / percentage / zoom in, plus a Fit-to-content button.
 */
export function ZoomBar({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}): ReactNode {
  return (
    <div className="editor-zoom-bar">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        title="zoom out"
        aria-label="zoom out"
        onClick={onZoomOut}
      >
        −
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="editor-zoom-fit"
        title="fit to content"
        aria-label="fit to content"
        onClick={onFit}
      >
        {Math.round(zoom * 100)}%
      </Button>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        title="zoom in"
        aria-label="zoom in"
        onClick={onZoomIn}
      >
        +
      </Button>
    </div>
  );
}
