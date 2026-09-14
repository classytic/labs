/**
 * Compile-time contracts for the host-owned shadcn components.
 * Runtime imports intentionally remain external and resolve from the host's
 * `@/components/ui` directory.
 */
declare module '@/components/ui/button' {
  import type { ButtonHTMLAttributes, ForwardRefExoticComponent, ReactElement, RefAttributes } from 'react';
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';
    render?: ReactElement;
    nativeButton?: boolean;
  }
  export const Button: ForwardRefExoticComponent<ButtonProps & RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/input' {
  import type { ForwardRefExoticComponent, InputHTMLAttributes, RefAttributes } from 'react';
  export type InputProps = InputHTMLAttributes<HTMLInputElement>;
  export const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
}

declare module '@/components/ui/textarea' {
  import type { ForwardRefExoticComponent, RefAttributes, TextareaHTMLAttributes } from 'react';
  export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;
  export const Textarea: ForwardRefExoticComponent<TextareaProps & RefAttributes<HTMLTextAreaElement>>;
}

declare module '@/components/ui/badge' {
  import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
  export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  }
  export const Badge: ForwardRefExoticComponent<BadgeProps & RefAttributes<HTMLSpanElement>>;
}

declare module '@/components/ui/slider' {
  import type { CSSProperties, ForwardRefExoticComponent, RefAttributes } from 'react';
  export interface SliderProps {
    className?: string;
    style?: CSSProperties;
    value?: number[];
    defaultValue?: number[];
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    'aria-label'?: string;
    'aria-valuetext'?: string;
    onKeyUp?: () => void;
    onValueChange?: (value: number[], eventDetails?: unknown) => void;
    onValueCommitted?: (value: number[], eventDetails?: unknown) => void;
  }
  export const Slider: ForwardRefExoticComponent<SliderProps & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/checkbox' {
  import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';
  export interface CheckboxProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean | 'indeterminate';
    defaultChecked?: boolean | 'indeterminate';
    disabled?: boolean;
    onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  }
  export const Checkbox: ForwardRefExoticComponent<CheckboxProps & RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/radio-group' {
  import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';
  export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string, eventDetails?: unknown) => void;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    children?: ReactNode;
  }
  export const RadioGroup: ForwardRefExoticComponent<RadioGroupProps & RefAttributes<HTMLDivElement>>;

  export interface RadioGroupItemProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
    value: string;
    disabled?: boolean;
  }
  export const RadioGroupItem: ForwardRefExoticComponent<
    RadioGroupItemProps & RefAttributes<HTMLButtonElement>
  >;
}

declare module '@/components/ui/toggle-group' {
  import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';
  export interface ToggleGroupProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onChange' | 'defaultValue'
  > {
    /** base-ui carries the group's value as an array, even when only one item may be on. */
    value?: readonly string[];
    defaultValue?: readonly string[];
    onValueChange?: (value: string[], eventDetails?: unknown) => void;
    toggleMultiple?: boolean;
    disabled?: boolean;
    orientation?: 'horizontal' | 'vertical';
    variant?: 'default' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    /** Gap between items; 0 renders them as one joined track. */
    spacing?: number;
    children?: ReactNode;
  }
  export const ToggleGroup: ForwardRefExoticComponent<ToggleGroupProps & RefAttributes<HTMLDivElement>>;

  export interface ToggleGroupItemProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
    value: string;
    pressed?: boolean;
    defaultPressed?: boolean;
    onPressedChange?: (pressed: boolean, eventDetails?: unknown) => void;
    disabled?: boolean;
    variant?: 'default' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    children?: ReactNode;
  }
  export const ToggleGroupItem: ForwardRefExoticComponent<
    ToggleGroupItemProps & RefAttributes<HTMLButtonElement>
  >;
}

declare module '@/components/ui/popover' {
  import type {
    ForwardRefExoticComponent,
    HTMLAttributes,
    ReactElement,
    ReactNode,
    RefAttributes,
  } from 'react';

  export interface PopoverProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
    modal?: boolean;
    children?: ReactNode;
  }
  export const Popover: (props: PopoverProps) => ReactElement | null;

  export interface PopoverTriggerProps extends HTMLAttributes<HTMLElement> {
    /** base-ui composition: render the trigger AS this element (e.g. `<Button />`). */
    render?: ReactElement;
    disabled?: boolean;
    children?: ReactNode;
  }
  export const PopoverTrigger: ForwardRefExoticComponent<PopoverTriggerProps & RefAttributes<HTMLElement>>;

  export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {
    /** The content is portalled and collision-aware, so it escapes clipping ancestors. */
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
    sideOffset?: number;
    children?: ReactNode;
  }
  export const PopoverContent: ForwardRefExoticComponent<PopoverContentProps & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/tooltip' {
  import type {
    ForwardRefExoticComponent,
    HTMLAttributes,
    ReactElement,
    ReactNode,
    RefAttributes,
  } from 'react';

  export interface TooltipProviderProps {
    delay?: number;
    closeDelay?: number;
    timeout?: number;
    children?: ReactNode;
  }
  export const TooltipProvider: (props: TooltipProviderProps) => ReactElement | null;

  export interface TooltipProps {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean, eventDetails?: unknown) => void;
    delay?: number;
    children?: ReactNode;
  }
  export const Tooltip: (props: TooltipProps) => ReactElement | null;

  export interface TooltipTriggerProps extends HTMLAttributes<HTMLElement> {
    /** base-ui composition: render the trigger AS this element (e.g. `<button />`). */
    render?: ReactElement;
    disabled?: boolean;
    children?: ReactNode;
  }
  export const TooltipTrigger: ForwardRefExoticComponent<TooltipTriggerProps & RefAttributes<HTMLElement>>;

  export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'center' | 'end';
    alignOffset?: number;
    side?: 'top' | 'bottom' | 'left' | 'right' | 'inline-start' | 'inline-end';
    sideOffset?: number;
    children?: ReactNode;
  }
  export const TooltipContent: ForwardRefExoticComponent<TooltipContentProps & RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/select' {
  import type { ForwardRefExoticComponent, HTMLAttributes, ReactNode, RefAttributes } from 'react';

  export interface SelectItemDescriptor {
    value: string;
    label: ReactNode;
  }
  export interface SelectProps {
    /** base-ui reads this so `SelectValue` can render the selected item's LABEL, not its value. */
    items?: readonly SelectItemDescriptor[];
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string, eventDetails?: unknown) => void;
    disabled?: boolean;
    children?: ReactNode;
  }
  export const Select: (props: SelectProps) => ReactNode;

  export interface SelectTriggerProps extends HTMLAttributes<HTMLElement> {
    size?: 'sm' | 'default';
    children?: ReactNode;
  }
  export const SelectTrigger: ForwardRefExoticComponent<SelectTriggerProps & RefAttributes<HTMLElement>>;

  export const SelectValue: ForwardRefExoticComponent<
    HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>
  >;
  export const SelectContent: ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & {
      align?: 'start' | 'center' | 'end';
      alignItemWithTrigger?: boolean;
    } & RefAttributes<HTMLDivElement>
  >;

  export const SelectGroup: ForwardRefExoticComponent<
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;

  export interface SelectItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
    value: string;
    disabled?: boolean;
    children?: ReactNode;
  }
  export const SelectItem: ForwardRefExoticComponent<SelectItemProps & RefAttributes<HTMLDivElement>>;
}
