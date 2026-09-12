'use client';

/**
 * Learning-control adapters backed by the host application's shadcn components.
 * Labs owns the learning semantics and composition; the host owns generic UI.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider as ShadcnSlider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export function IconButton({
  label,
  onClick,
  children,
  disabled,
  title = label,
  className,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}): ReactNode {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      className={['lab-icon-button', className].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title}
    >
      {children}
    </Button>
  );
}

export function ActionButton({
  onClick,
  children,
  disabled,
  pressed,
  className,
  ...a11y
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  pressed?: boolean;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'title'>): ReactNode {
  const ghost = className?.split(/\s+/).includes('lab-btn-ghost');
  return (
    <Button
      type="button"
      variant={ghost ? 'outline' : pressed ? 'secondary' : 'default'}
      className={['lab-btn', className].filter(Boolean).join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      {...a11y}
    >
      {children}
    </Button>
  );
}

export function TextInput({
  value,
  onChange,
  label,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  mono?: boolean;
}): ReactNode {
  return (
    <Input
      className={['lab-input', mono ? 'lab-input-mono' : ''].filter(Boolean).join(' ')}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      aria-label={label}
      placeholder={placeholder}
      spellCheck={!mono}
    />
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}): ReactNode {
  return (
    <span className="lab-stepper" role="group" aria-label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`decrease${label ? ' ' + label : ''}`}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        −
      </Button>
      <b>{value}</b>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`increase${label ? ' ' + label : ''}`}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        +
      </Button>
    </span>
  );
}

export function CheckButton({
  onClick,
  disabled,
  children = 'Check',
}: {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}): ReactNode {
  return (
    <Button type="button" className="lab-btn" onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  );
}

export function StatusPill({
  ok,
  children,
  className,
  role,
}: {
  ok: boolean;
  children: ReactNode;
  className?: string;
  role?: string;
}): ReactNode {
  return (
    <Badge
      variant={ok ? 'secondary' : 'outline'}
      className={['lab-pill', className].filter(Boolean).join(' ')}
      data-state={ok ? 'ok' : 'no'}
      role={role}
    >
      {children}
    </Badge>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Disable one option without removing it from the set. */
  disabled?: boolean;
}

/**
 * A compact activity picker for sets that no longer fit as one visible choice row.
 *
 * Keep `Segmented` for two to four short, frequently compared states. Use this picker
 * for five or more modes (or long labels) so the learning canvas never gains a horizontal
 * scrollbar. The host's shadcn Select owns keyboard, focus, portal, and collision behavior.
 */
export function ActivitySelect<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  ariaLabel: string;
  className?: string;
}): ReactNode {
  const items = options.map(({ value: optionValue, label }) => ({ value: optionValue, label }));

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string' && next !== value) onChange(next as T);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={['lab-activity-select', className].filter(Boolean).join(' ')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" alignItemWithTrigger={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export interface AssessedChoiceOption<T extends string> {
  value: T;
  label: ReactNode;
  tone?: 'correct' | 'wrong';
  disabled?: boolean;
}

/** Chooses presentation density from authored copy, never from a per-lab CSS override. */
export function choiceResponseLayout(
  options: readonly Pick<AssessedChoiceOption<string>, 'label'>[],
): 'compact' | 'prose' {
  return options.every((option) => typeof option.label === 'string' && option.label.length <= 30)
    ? 'compact'
    : 'prose';
}

/** A single-choice answer set backed by the host ToggleGroup. */
export function AssessedChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value?: T;
  onChange: (value: T) => void;
  options: readonly AssessedChoiceOption<T>[];
  ariaLabel: string;
  className?: string;
}): ReactNode {
  return (
    <ToggleGroup
      className={['lab-choices', className].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={ariaLabel}
      value={value ? [value] : []}
      onValueChange={(next: unknown) => {
        const picked = Array.isArray(next) ? (next[0] as T | undefined) : (next as T | undefined);
        if (picked != null) onChange(picked);
      }}
      spacing={0}
      size="sm"
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            pressed={selected}
            onPressedChange={(pressed) => pressed && onChange(option.value)}
            className="lab-choice"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || (value == null && index === 0) ? 0 : -1}
            data-picked={selected || undefined}
            data-tone={option.tone}
            onKeyDown={(event) => {
              if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key))
                return;
              event.preventDefault();
              const enabled = Array.from(
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="radio"]:not(:disabled)',
                ) ?? [],
              );
              const current = enabled.indexOf(event.currentTarget);
              const next =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? enabled.length - 1
                    : (current +
                        (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) +
                        enabled.length) %
                      enabled.length;
              const target = enabled[next];
              const picked = options.filter((item) => !item.disabled)[next];
              if (picked) onChange(picked.value);
              target?.focus();
            }}
          >
            {option.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

/**
 * A mutually-exclusive mode switcher, on the HOST's shadcn `ToggleGroup`.
 *
 * This replaces a hand-rolled pattern: a row of `Chip` buttons that a `:has()` rule in
 * core.css reshaped into a segmented track. That imitation carried none of the real
 * semantics — no roving focus, no arrow-key traversal, no group role — and its layout
 * needed repeated fixing because the kit was maintaining behaviour a component already owns.
 *
 * Use it for "which situation / which mode" (2–5 options). A `Chip` is still the right thing
 * for an ACTION (Play, Reset, Refill) and for multi-select filters, which are not one choice.
 */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'sm',
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Names the group for screen readers, e.g. "situation". */
  ariaLabel: string;
  size?: 'sm' | 'default';
  className?: string;
}): ReactNode {
  return (
    <ToggleGroup
      className={['lab-segmented', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      value={[value]}
      onValueChange={(next: unknown) => {
        // base-ui reports the group's whole value; a single-select group sends one item back.
        const picked = Array.isArray(next) ? (next[0] as T | undefined) : (next as T | undefined);
        // Ignore a deselect: a mode switcher always has exactly one option active.
        if (picked != null && picked !== value) onChange(picked);
      }}
      spacing={0}
      size={size}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          pressed={option.value === value}
          onPressedChange={() => onChange(option.value)}
          className="lab-segment"
          data-sel={option.value === value}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  className,
  'aria-pressed': ariaPressed,
  ...a11y
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'tabIndex' | 'aria-pressed' | 'aria-label' | 'onKeyDown' | 'title' | 'disabled'
>): ReactNode {
  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? 'secondary' : 'outline'}
      className={['lab-chip', className].filter(Boolean).join(' ')}
      data-sel={selected}
      onClick={onClick}
      aria-pressed={ariaPressed ?? selected}
      {...a11y}
    >
      {children}
    </Button>
  );
}

export function Slider(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  onCommit?: (v: number) => void;
  ariaLabel: string;
  valueText?: string;
  className?: string;
  style?: CSSProperties;
}): ReactNode {
  const first = (value: number | readonly number[]): number =>
    typeof value === 'number' ? value : (value[0] ?? props.value);
  return (
    <ShadcnSlider
      className={['lab-slider', props.className].filter(Boolean).join(' ')}
      value={[props.value]}
      min={props.min}
      max={props.max}
      step={props.step}
      aria-label={props.ariaLabel}
      aria-valuetext={props.valueText}
      onValueChange={(values) => props.onChange(first(values))}
      onValueCommitted={(values) => props.onCommit?.(first(values))}
      onKeyUp={() => props.onCommit?.(props.value)}
      style={props.style}
    />
  );
}
