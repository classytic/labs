import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExamQuestion } from '../src/exam/exam-question/preset.js';
import { DEFAULT_EXAM_PARTS, DEFAULT_EXAM_STEM } from '../src/exam/exam-question/default-question.js';
import {
  earnedMarks,
  examQuestionProblems,
  gradePart,
  schemeMarks,
  totalMarks,
  type ExamPart,
} from '../src/exam/exam-question/core.js';

const radiusPart: ExamPart = {
  label: 'a',
  prompt: 'A circle has diameter 0.71 m. Calculate its radius.',
  marks: 2,
  command: 'calculate',
  answer: { kind: 'number', value: 0.355 },
  unit: 'm',
  markScheme: [{ text: 'radius = diameter / 2' }, { text: '0.355 m, to 3 significant figures' }],
  commonErrors: [{ answer: '0.71', why: 'That is the diameter. The radius is half of it.' }],
};

const explainPart: ExamPart = {
  label: 'b',
  prompt: 'Explain why the area quadruples when the radius doubles.',
  marks: 2,
  command: 'explain',
  markScheme: [{ text: 'area depends on r squared' }, { text: 'so doubling r multiplies area by 4' }],
};

describe('exam question scoring', () => {
  it('totals the marks on offer from the parts alone', () => {
    expect(totalMarks([radiusPart, explainPart])).toBe(4);
    expect(schemeMarks(radiusPart)).toBe(2);
  });

  it('awards the part marks for a correct answer and nothing for silence', () => {
    expect(gradePart(radiusPart, '0.355')).toEqual({ state: 'correct', marks: 2 });
    expect(gradePart(radiusPart, '   ')).toEqual({ state: 'unanswered' });
  });

  it('names the misconception when a wrong answer matches one the author anticipated', () => {
    expect(gradePart(radiusPart, '0.71')).toEqual({
      state: 'known-error',
      why: 'That is the diameter. The radius is half of it.',
    });
    // A student who rounded still gets the diagnosis, not a bare cross.
    expect(gradePart(radiusPart, '0.70')).toMatchObject({ state: 'known-error' });
    expect(gradePart(radiusPart, '9')).toEqual({ state: 'wrong' });
  });

  it('counts only the parts actually earned', () => {
    const verdicts = { a: gradePart(radiusPart, '0.355'), b: gradePart(explainPart, 'because') };
    expect(earnedMarks([radiusPart, explainPart], verdicts)).toBe(2);
  });
});

describe('answers that are equivalent but in the wrong form', () => {
  // "Factorise completely", "give it in standard form", "as a product of prime factors": the
  // equivalence checker says 84 and 2^2 x 3 x 7 are the same number, because they are, so
  // without this the question cannot ask for a form at all.
  const factorise: ExamPart = {
    label: 'a',
    prompt: 'Express 84 as a product of its prime factors.',
    marks: 2,
    command: 'determine',
    answer: { kind: 'expression', value: '2^2*3*7' },
    markScheme: [{ text: 'any correct factor tree' }, { text: '2² × 3 × 7' }],
    commonErrors: [
      {
        answer: '84',
        why: 'That is the number itself. The question wants it as prime factors.',
        equivalent: true,
      },
    ],
  };

  it('names the form instead of marking the equivalent answer correct', () => {
    expect(gradePart(factorise, '84')).toMatchObject({ state: 'known-error' });
    expect(gradePart(factorise, '2^2*3*7')).toEqual({ state: 'correct', marks: 2 });
  });

  it('accepts the flag only when the answer really is equivalent', () => {
    expect(examQuestionProblems({ stem: 'x', parts: [factorise] })).toEqual([]);
    const lying: ExamPart = {
      ...factorise,
      commonErrors: [{ answer: '96', why: 'wrong', equivalent: true }],
    };
    expect(examQuestionProblems({ stem: 'x', parts: [lying] })).toEqual([
      'part a flags "96" as equivalent, but it is not equal to the answer',
    ]);
  });

  it('does not let one expression answer for every expression that starts with the same digit', () => {
    // parseFloat reads a PREFIX: '2*3^2*7' and '2*3*7' both parse as 2. The near-match is for
    // rounding, so it only applies when both sides are bare numbers.
    const part: ExamPart = {
      label: 'a',
      prompt: 'Factorise 126.',
      marks: 1,
      answer: { kind: 'expression', value: '2*3^2*7' },
      markScheme: [{ text: '2 × 3² × 7' }],
      commonErrors: [{ answer: '2*3*7', why: 'You used one 3. There are two.' }],
    };
    expect(gradePart(part, '2*5*7')).toEqual({ state: 'wrong' });
    expect(gradePart(part, '2*3*7')).toMatchObject({ state: 'known-error' });
  });
});

describe('exam question authoring checks', () => {
  it('shows the NEAREST anticipated mistake, not the first one the author listed', () => {
    // Two slips within the rounding allowance of each other. Telling a student they made the
    // other mistake is worse than telling them nothing: they go and fix something they got right.
    const part: ExamPart = {
      label: 'a',
      prompt: 'Find the median.',
      marks: 1,
      answer: { kind: 'number', value: 148 },
      markScheme: [{ text: '148' }],
      // Both of these are inside the rounding allowance for a student who types 156.9, and the
      // FARTHER one is listed first, which is what the old first-match rule would have returned.
      commonErrors: [
        { answer: '155', why: 'You read the class boundary instead of interpolating.' },
        { answer: '157', why: 'You used the cumulative frequency of the wrong class.' },
      ],
    };
    expect(gradePart(part, '156.9')).toMatchObject({
      why: 'You used the cumulative frequency of the wrong class.',
    });
    expect(gradePart(part, '155.2')).toMatchObject({
      why: 'You read the class boundary instead of interpolating.',
    });
  });

  it('passes a well-formed question', () => {
    expect(examQuestionProblems({ stem: 'A circle.', parts: [radiusPart, explainPart] })).toEqual([]);
  });

  it('catches a scheme that does not add up to the marks on offer', () => {
    const short: ExamPart = { ...radiusPart, marks: 4 };
    expect(examQuestionProblems({ stem: 'x', parts: [short] })).toEqual([
      'part a offers 4 mark(s) but its scheme accounts for 2',
    ]);
  });

  it('catches a duplicate part label', () => {
    const problems = examQuestionProblems({ stem: 'x', parts: [radiusPart, { ...radiusPart }] });
    expect(problems).toContain('duplicate part label "a"');
  });

  it('catches a "common error" that is really the correct answer', () => {
    const wrong: ExamPart = { ...radiusPart, commonErrors: [{ answer: '0.355', why: 'nope' }] };
    expect(examQuestionProblems({ stem: 'x', parts: [wrong] })).toContain(
      'part a lists the CORRECT answer "0.355" as a common error',
    );
  });
});

describe('the question an author gets on a blank insert', () => {
  it('is itself a well-formed question, since it ships as an example', () => {
    expect(examQuestionProblems({ stem: DEFAULT_EXAM_STEM, parts: DEFAULT_EXAM_PARTS })).toEqual([]);
  });

  it('shows both marking modes, so one insert demonstrates the whole block', () => {
    expect(DEFAULT_EXAM_PARTS.some((p) => p.answer)).toBe(true);
    expect(DEFAULT_EXAM_PARTS.some((p) => !p.answer)).toBe(true);
    expect(DEFAULT_EXAM_PARTS.some((p) => p.commonErrors?.length)).toBe(true);
  });
});

describe('exam question learner path', () => {
  it('withholds the mark scheme until the learner has committed, then names the mistake', () => {
    const view = render(<ExamQuestion stem="A circle." parts={[radiusPart, explainPart]} />);

    // Marks are visible on each part, and the running total starts at zero.
    expect(view.getAllByText('[2 marks]', { selector: '.lab-exam-marks' })).toHaveLength(2);
    expect(view.getByText('0 / 4')).toBeTruthy();
    // The graded part hides its scheme; the self-marked part offers one from the start.
    expect(view.getAllByText('Mark scheme')).toHaveLength(1);

    const input = view.getByLabelText('Answer to part a');
    const check = view.getAllByRole('button', { name: 'Check' })[0]!;

    fireEvent.change(input, { target: { value: '0.71' } });
    fireEvent.click(check);
    expect(view.getByText(/That is the diameter/)).toBeTruthy();
    expect(view.getAllByText('Mark scheme')).toHaveLength(1);

    // Second attempt: still wrong, but the scheme now opens rather than leaving them stuck.
    fireEvent.change(input, { target: { value: '1.42' } });
    fireEvent.click(check);
    expect(view.getAllByText('Mark scheme')).toHaveLength(2);

    fireEvent.change(input, { target: { value: '0.355' } });
    fireEvent.click(check);
    expect(view.getByText('Correct. 2 marks earned.')).toBeTruthy();
    expect(view.getByText('2 / 4')).toBeTruthy();
    expect((view.getByLabelText('Answer to part a') as HTMLInputElement).disabled).toBe(true);
  });

  // Below 60rem the stylesheet gives every named Activity slot an explicit flex `order`, so an
  // element parked straight under the root sorts at 0 and renders above the heading. Rendering
  // caught that once; this pins it.
  it('keeps the parts inside the workspace slot, not loose under the activity root', () => {
    const view = render(<ExamQuestion parts={[radiusPart]} />);
    const parts = view.container.querySelector('.lab-exam-parts');
    expect(parts?.closest('.lab-activity-workspace')).toBeTruthy();
  });

  it('names the marks on offer when the author gives no title', () => {
    const view = render(<ExamQuestion parts={[radiusPart, explainPart]} />);
    expect(view.getByRole('heading', { name: '4-mark structured question' })).toBeTruthy();
  });

  it('prints a sub-part the way a paper prints it, not as nested brackets', () => {
    const view = render(
      <ExamQuestion
        parts={[
          { ...radiusPart, label: 'b(ii)' },
          { ...explainPart, label: 'c' },
        ]}
      />,
    );
    expect(view.getByText('(b) (ii)')).toBeTruthy();
    expect(view.getByText('(c)')).toBeTruthy();
    expect(view.queryByText('(b(ii))')).toBeNull();
  });

  it('tells the learner to self-mark a part with no graded answer', () => {
    const view = render(<ExamQuestion stem="A circle." parts={[explainPart]} />);
    expect(view.queryByLabelText('Answer to part b')).toBeNull();
    expect(view.getByText(/Write your answer on paper/)).toBeTruthy();
  });

  it('lets a stuck learner open the mark scheme without guessing first', () => {
    // The scheme used to appear only on a correct answer or after two submitted attempts, and
    // nothing on screen said so. A learner who could not start the part had nothing to submit,
    // so the question was a dead end for exactly the learner who needed the scheme.
    const view = render(<ExamQuestion stem="A circle." parts={[radiusPart]} />);
    expect(view.queryByText(/radius = diameter \/ 2/)).toBeNull();

    fireEvent.click(view.getByRole('button', { name: 'Show mark scheme' }));
    expect(view.getByText(/radius = diameter \/ 2/)).toBeTruthy();
  });

  it('awards nothing for a revealed part, and says so', () => {
    const view = render(<ExamQuestion stem="A circle." parts={[radiusPart]} />);
    fireEvent.click(view.getByRole('button', { name: 'Show mark scheme' }));
    // The running total must not move: seeing the answer is not earning it.
    expect(view.container.querySelector('.lab-activity-status strong')?.textContent).toBe('0 / 2');
    expect(view.getByText(/No marks for this part/)).toBeTruthy();
    // And the part is closed, so the learner is not invited to type an answer they have just read.
    expect((view.getByLabelText('Answer to part a') as HTMLInputElement).disabled).toBe(true);
  });
});
