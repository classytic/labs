import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Activity } from '../src/kit/activity.js';
import { ControlPolicy, Field } from '../src/kit/frame.js';
import { GuideNav, type Guide } from '../src/kit/guide.js';
import { LearningSequenceNav, type LearningSequence } from '../src/kit/learning-sequence.js';
import { BreakEvenLab } from '../src/commerce/finance/break-even.js';
import { JournalPosterLab } from '../src/commerce/accounting/journal-poster.js';
import { AssessedChoiceGroup, Segmented, Slider, Stepper } from '../src/kit/controls.js';
import { DecisionDeck } from '../src/commerce/activity.js';

afterEach(() => {
  document.body.style.overflow = '';
});

describe('shared activity runtime', () => {
  it('keeps guided actions in one stable navigation layout with or without a lead', () => {
    const guide = (lead?: string): Guide => ({
      enabled: true,
      step: 2,
      total: 5,
      lead,
      gated: false,
      shows: () => true,
      showControls: false,
      nav: {
        step: 2,
        total: 5,
        atStart: false,
        atEnd: false,
        next: () => undefined,
        prev: () => undefined,
        setStep: () => undefined,
      },
    });
    const { container, rerender } = render(<GuideNav guide={guide('Inspect the curve.')} />);

    expect(container.querySelector('.lab-guide-nav > .lab-stepnav')).not.toBeNull();
    rerender(<GuideNav guide={guide()} />);
    expect(container.querySelector('.lab-guide-nav > .lab-stepnav')).not.toBeNull();
  });

  it('keeps sequence transport compact instead of repeating the task in a nested card', () => {
    const sequence: LearningSequence = {
      current: {
        id: 'predict',
        phase: 'predict',
        title: 'Predict the allocation',
        lead: 'Read the basis before seeing the split.',
      },
      index: 0,
      total: 5,
      history: ['predict'],
      canAdvance: false,
      complete: () => undefined,
      next: () => undefined,
      back: () => undefined,
      reset: () => undefined,
      shows: () => false,
      showControls: false,
    };
    const { container } = render(<LearningSequenceNav sequence={sequence} />);

    expect(container.querySelector('.lab-sequence-copy')).toBeNull();
    expect(screen.queryByText('Predict the allocation')).toBeNull();
    expect(screen.queryByText('Read the basis before seeing the split.')).toBeNull();
    expect(screen.getByRole('button', { name: 'Back' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('1 / 5')).toBeTruthy();
  });

  it('shows every control and exact target needed to complete the break-even decision', async () => {
    render(<BreakEvenLab fixedCost={1800} price={20} variableCost={12} />);
    fireEvent.click(screen.getByRole('radio', { name: /a loss/ }));
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    await waitFor(() => expect(continueButton.hasAttribute('disabled')).toBe(false));
    fireEvent.click(continueButton);
    fireEvent.click(continueButton);

    expect(screen.getByRole('slider', { name: 'output units' })).toBeTruthy();
    expect(screen.getByRole('slider', { name: 'selling price per unit' })).toBeTruthy();
    expect(screen.queryByRole('slider', { name: 'fixed cost' })).toBeNull();
    expect(screen.getByText(/Increase output or price/)).toBeTruthy();
    expect(screen.getAllByText(/450 units/).length).toBeGreaterThan(0);
  });

  it('moves posted journal history into a quiet disclosure without stale lesson chrome', () => {
    const { container } = render(<JournalPosterLab objectives={['Explain double entry']} />);
    fireEvent.click(screen.getByRole('radio', { name: 'debit (left) side' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Capital' }));
    fireEvent.click(screen.getByRole('button', { name: 'Post entry' }));

    expect(screen.getAllByText(/Take a .*bank loan/).length).toBeGreaterThan(0);
    expect(container.querySelector('.journal-actions .lab-pill')).toBeNull();
    expect(container.querySelector('.lab-sr-only[aria-live]')?.textContent).toContain('Posted debit Cash');
    expect(screen.queryByText('Learning support')).toBeNull();
    expect(container.querySelector('.lab-activity-feedback')).toBeNull();
    const ledger = container.querySelector('.journal-ledger') as HTMLDetailsElement | null;
    expect(ledger).not.toBeNull();
    expect(ledger?.open).toBe(false);
    expect(ledger?.textContent).toContain('Ledger after 1 entry');
  });

  it('opens accessible focus mode, locks page scroll, and exits with Escape', async () => {
    render(
      <>
        <button type="button">Before lab</button>
        <Activity.Root>
          <Activity.Header>
            <Activity.FocusButton />
          </Activity.Header>
        </Activity.Root>
      </>,
    );
    const before = screen.getByRole('button', { name: 'Before lab' });
    before.focus();
    const button = screen.getByRole('button', { name: 'Open focused lab' });
    fireEvent.click(button);
    const root = button.closest('.lab-activity') as HTMLElement;
    await waitFor(() => expect(root.getAttribute('data-focus')).toBe('true'));
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(root);
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Exit focused lab' }));
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Exit focused lab' }));
    expect(screen.getByRole('button', { name: 'Exit focused lab' }).getAttribute('aria-pressed')).toBe(
      'true',
    );
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Open focused lab' })
          .closest('.lab-activity')
          ?.hasAttribute('data-focus'),
      ).toBe(false),
    );
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(before);
  });

  it('applies author hide and lock policy without leaving locked controls focusable', () => {
    render(
      <ControlPolicy config={{ hide: ['hidden'], lock: ['locked'] }}>
        <Field label="Hidden" name="hidden">
          <button type="button">hidden action</button>
        </Field>
        <Field label="Locked" name="locked">
          <button type="button">locked action</button>
        </Field>
      </ControlPolicy>,
    );
    expect(screen.queryByRole('button', { name: 'hidden action' })).toBeNull();
    const locked = screen.getByRole('button', { name: 'locked action' });
    expect(locked.closest('.lab-locked-wrap')?.hasAttribute('inert')).toBe(true);
  });

  it('gives compact steppers bounded, named keyboard-native actions', () => {
    let value = 1;
    const { rerender } = render(
      <Stepper
        value={value}
        min={0}
        max={2}
        label="neighbours"
        onChange={(next) => {
          value = next;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'increase neighbours' }));
    expect(value).toBe(2);
    rerender(
      <Stepper
        value={value}
        min={0}
        max={2}
        label="neighbours"
        onChange={(next) => {
          value = next;
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'increase neighbours' }));
    expect(value).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'decrease neighbours' }));
    expect(value).toBe(1);
  });

  it('lets the host toggle group own a segmented selection without duplicate updates', () => {
    let value = 'spring';
    let changes = 0;
    const options = [
      { value: 'spring', label: 'Spring' },
      { value: 'pendulum', label: 'Pendulum' },
    ] as const;
    const { rerender } = render(
      <Segmented
        value={value}
        options={options}
        ariaLabel="oscillator mode"
        onChange={(next) => {
          changes += 1;
          value = next;
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Pendulum' }));
    expect(value).toBe('pendulum');
    expect(changes).toBe(1);

    rerender(
      <Segmented
        value={value}
        options={options}
        ariaLabel="oscillator mode"
        onChange={(next) => {
          changes += 1;
          value = next;
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Pendulum' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps host radio groups controlled from the unanswered state in React 19', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let value: 'left' | 'right' | undefined;
    const options = [
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
    ] as const;
    const renderChoices = () => (
      <AssessedChoiceGroup
        value={value}
        options={options}
        ariaLabel="direction"
        onChange={(next) => {
          value = next;
        }}
      />
    );
    const { rerender } = render(renderChoices());

    fireEvent.click(screen.getByRole('radio', { name: 'Right' }));
    rerender(renderChoices());

    expect(value).toBe('right');
    expect(error.mock.calls.some((call) => String(call[0]).includes('uncontrolled value state'))).toBe(false);
    error.mockRestore();
  });

  it('separates continuous slider changes from committed learner choices', () => {
    let changed = 0;
    let committed = 0;
    const renderSlider = (value: number) => (
      <Slider
        value={value}
        min={0}
        max={10}
        step={1}
        ariaLabel="temperature"
        valueText={`${value} degrees`}
        onChange={(next) => {
          changed = next;
        }}
        onCommit={(next) => {
          committed = next;
        }}
      />
    );
    const { rerender } = render(renderSlider(2));
    let slider = screen.getByRole('slider', { name: 'temperature' });
    expect(slider.getAttribute('aria-valuetext')).toBe('2 degrees');
    fireEvent.change(slider, { target: { value: '5' } });
    expect(changed).toBe(5);
    rerender(renderSlider(changed));
    slider = screen.getByRole('slider', { name: 'temperature' });
    fireEvent.keyUp(slider, { key: 'ArrowRight' });
    expect(committed).toBe(5);
  });

  it('uses one tab stop and arrow navigation for finance decision groups', () => {
    let value = 'save';
    const options = [
      { value: 'save', label: 'Save' },
      { value: 'spend', label: 'Spend' },
      { value: 'invest', label: 'Invest' },
    ];
    const { rerender } = render(
      <DecisionDeck
        label="Choose a strategy"
        value={value}
        options={options}
        onChange={(next) => {
          value = next;
        }}
      />,
    );
    const save = screen.getByRole('radio', { name: 'Save' });
    const spend = screen.getByRole('radio', { name: 'Spend' });
    expect(save.tabIndex).toBe(0);
    expect(spend.tabIndex).toBe(-1);
    save.focus();
    fireEvent.keyDown(save, { key: 'ArrowRight' });
    expect(value).toBe('spend');
    expect(document.activeElement).toBe(spend);
    rerender(
      <DecisionDeck
        label="Choose a strategy"
        value={value}
        options={options}
        onChange={(next) => {
          value = next;
        }}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Spend' }).tabIndex).toBe(0);
  });

  it('collapses supporting controls at narrow activity widths and opens them when space permits', () => {
    let notify: ResizeObserverCallback = () => undefined;
    const previous = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) {
        notify = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
    try {
      const { container } = render(
        <Activity.Root>
          <Activity.Inspector>controls</Activity.Inspector>
        </Activity.Root>,
      );
      const root = container.querySelector('.lab-activity') as HTMLDivElement;
      const inspector = container.querySelector('.lab-activity-inspector') as HTMLDetailsElement;
      expect(inspector.open).toBe(false);
      root.getBoundingClientRect = () => ({
        width: 1000,
        height: 600,
        x: 0,
        y: 0,
        top: 0,
        right: 1000,
        bottom: 600,
        left: 0,
        toJSON: () => ({}),
      });
      notify([], {} as ResizeObserver);
      expect(inspector.open).toBe(true);
    } finally {
      globalThis.ResizeObserver = previous;
    }
  });
});
