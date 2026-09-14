import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { AuthoredActivityRuntime } from '../src/kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';
import { Control, Field } from '../src/kit/frame.js';
import { Activity } from '../src/kit/activity.js';

const activity: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Trace the system',
  objectives: ['Explain the observed change'],
  success: [
    {
      id: 'predicted',
      source: 'answer',
      key: 'direction',
      pendingLabel: 'Commit to a prediction.',
    },
  ],
  questions: [
    {
      id: 'direction',
      prompt: 'Which way?',
      choices: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
      answer: 'right',
      explain: 'The evidence points right.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict',
      lead: 'Commit before running the model.',
      success: 'predicted',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Observe',
      lead: 'Connect motion to evidence.',
    },
  ],
};

describe('AuthoredActivityRuntime', () => {
  it('composes the canonical anatomy and gates progression from authored data', () => {
    const onResponse = vi.fn();
    const view = render(
      <AuthoredActivityRuntime
        activity={activity}
        activityId="trace"
        onResponse={onResponse}
        inspector={<p>evidence</p>}
        transcript={
          <ol>
            <li>ready</li>
          </ol>
        }
      >
        <div>domain model</div>
      </AuthoredActivityRuntime>,
    );
    expect(view.container.querySelector('.lab-activity-header')).not.toBeNull();
    expect(view.container.querySelector('.lab-activity-workspace')).not.toBeNull();
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByText('Right'));
    expect(onResponse).toHaveBeenCalledWith({
      questionId: 'direction',
      response: 'right',
      correct: true,
    });
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(view.getByText('Continue'));
    expect(view.getAllByText('Observe').length).toBeGreaterThan(0);
    expect(view.getByText('domain model')).toBeTruthy();
    expect(view.getByText('evidence')).toBeTruthy();
  });

  it('lets a domain model complete action/state gates without owning its state', () => {
    const action: AuthoredActivity = {
      ...activity,
      success: [{ id: 'changed', source: 'action', key: 'model' }],
      questions: [],
      steps: [
        { id: 'act', phase: 'act', title: 'Act', success: 'changed' },
        { id: 'explain', phase: 'explain', title: 'Explain' },
      ],
    };
    const view = render(
      <AuthoredActivityRuntime activity={action} activityId="action">
        {({ complete }) => <button onClick={() => complete('changed')}>Change model</button>}
      </AuthoredActivityRuntime>,
    );
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByText('Change model'));
    expect((view.getByText('Continue') as HTMLButtonElement).disabled).toBe(false);
  });

  it('places optional task, evidence, and support content in semantic activity slots', () => {
    const view = render(
      <AuthoredActivityRuntime
        activity={activity}
        activityId="semantic-slots"
        task={({ sequence }) => <p>Task for {sequence.current.title}</p>}
        evidence={<p>Measured evidence</p>}
        observation={<p>Compare the measured direction.</p>}
        support={<p>Progressive hint</p>}
      >
        <div>domain model</div>
      </AuthoredActivityRuntime>,
    );

    const task = view.getByRole('region', { name: 'Your task' });
    expect(task.textContent).toContain('Commit before running the model.');
    expect(task.textContent).toContain('Task for Predict');
    expect(task.contains(view.getByText('Which way?'))).toBe(true);
    // Withheld while the prediction is open, on the same rule as the observation below it: a
    // question the measurement already answers is not a prediction.
    expect(view.queryByText('Measured evidence')).toBeNull();
    expect(view.queryByText('Compare the measured direction.')).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: 'Right' }));
    expect(view.getByRole('region', { name: 'Evidence' }).textContent).toContain('Measured evidence');
    const evidence = view.getByText('Explore evidence').closest('details');
    expect(evidence?.open).toBe(false);
    expect(
      view.getByText('Compare the measured direction.').closest('.lab-activity-feedback'),
    ).not.toBeNull();
    const support = view.getByText('Learning support').closest('details');
    expect(support?.textContent).toContain('Progressive hint');
  });

  // The status strip carries two different things. Setup ("Spring", "solid", "120 W") is what the
  // learner chose and needs in order to orient. Measurements ("T 2.22 s") are the model's answer,
  // and printing those beside the question answers it in the act of asking. Marking the measured
  // items keeps setup exactly where it is; 173 labs pass a status strip, so a prop split would
  // have meant migrating all of them before any of them got safer.
  it('withholds measured status until the prediction is made, and keeps setup', () => {
    const view = render(
      <AuthoredActivityRuntime
        activity={activity}
        activityId="measured-status"
        status={
          <>
            <span>Spring</span>
            <Activity.Measured label="period">T 2.22 s</Activity.Measured>
          </>
        }
      >
        <div>domain model</div>
      </AuthoredActivityRuntime>,
    );
    expect(view.getByText('Spring')).toBeTruthy();
    expect(view.queryByText('T 2.22 s')).toBeNull();
    expect(view.getByLabelText('period')).toBeTruthy(); // the slot is held, not removed
    fireEvent.click(view.getByRole('radio', { name: 'Right' }));
    expect(view.getByText('T 2.22 s')).toBeTruthy();
  });

  // Outside the authored runtime there is no prediction to protect, so a bare scene, the gallery
  // and a host embed must all read exactly as they did before.
  it('shows a measured value when there is no runtime around it', () => {
    const view = render(<Activity.Measured>T 2.22 s</Activity.Measured>);
    expect(view.getByText('T 2.22 s')).toBeTruthy();
  });

  it('keeps model controls adjacent to the scene and outside contextual evidence', () => {
    const view = render(
      <AuthoredActivityRuntime
        activity={activity}
        activityId="scene-first-order"
        evidence={<p>Result ledger</p>}
        controls={
          <Field label="angle" value="45°">
            <input aria-label="angle control" />
          </Field>
        }
      >
        <div>domain model</div>
      </AuthoredActivityRuntime>,
    );

    // Answer first: this is about where evidence sits once it is earned, not about whether a
    // prediction can see it.
    fireEvent.click(view.getByRole('radio', { name: 'Right' }));
    const workspace = view.container.querySelector('.lab-activity-workspace');
    const canvas = workspace?.querySelector('.lab-activity-canvas');
    const dock = workspace?.querySelector('.lab-activity-dock');
    const inspector = workspace?.querySelector('.lab-activity-inspector');
    expect(Array.from(workspace?.children ?? [])).toEqual([canvas, dock, inspector]);
    expect(dock?.contains(view.getByLabelText('angle control'))).toBe(true);
    expect(inspector?.contains(view.getByText('Result ledger'))).toBe(true);
    expect(inspector?.contains(view.getByLabelText('angle control'))).toBe(false);
  });

  it('applies creator hide and lock policy to named controls in composed slots', () => {
    const view = render(
      <AuthoredActivityRuntime
        activity={activity}
        activityId="controlled-slots"
        controlConfig={{ hide: ['mass'], lock: ['angle'] }}
        controls={
          <>
            <Field label="mass" value="2 kg">
              <input aria-label="mass input" />
            </Field>
            <Field label="angle" value="45°">
              <input aria-label="angle input" />
            </Field>
            <Control name="launch">
              <button type="button">Launch</button>
            </Control>
          </>
        }
      >
        <div>domain model</div>
      </AuthoredActivityRuntime>,
    );

    expect(view.queryByLabelText('mass input')).toBeNull();
    const angle = view.getByLabelText('angle input').closest('.lab-locked-wrap');
    expect(angle).not.toBeNull();
    expect(angle?.hasAttribute('inert')).toBe(true);
    expect(view.getByRole('button', { name: 'Launch' })).toBeTruthy();
  });
});
