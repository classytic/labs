'use client';

/**
 * ExamQuestion, a structured question marked the way a paper is marked.
 *
 * Every other assessment surface in this library is a multiple-choice `Quiz` or a single graded
 * `ask` on a lab. Both test recognition. This one gives the learner a stem, several parts with
 * marks against them, and a box with no options in it. They produce the answer, then see the mark
 * scheme they were being marked against.
 *
 * Three things it does that a quiz cannot:
 *   - awards marks per part, so a 4-mark part is visibly worth more than a 1-mark part;
 *   - names the mistake when a wrong answer matches one the author anticipated, which is the
 *     difference between "no" and "you used the diameter as the radius";
 *   - shows the mark scheme with its acceptable alternatives, so the learner learns what an
 *     examiner is actually looking for rather than only whether the number matched.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { earnedMarks, gradePart, isSettled, totalMarks, type ExamPart, type PartVerdict } from './core.js';
import { DEFAULT_EXAM_PARTS, DEFAULT_EXAM_STEM } from './default-question.js';

export interface ExamQuestionProps {
  reference?: string;
  stem?: string;
  parts?: ExamPart[];
  title?: string;
  activity?: string;
}

const markWord = (n: number): string => `${n} mark${n === 1 ? '' : 's'}`;

/**
 * Print a part label the way a paper prints it.
 *
 * Authors write the label as the syllabus prints it, `a` or `b(ii)`. Wrapping that in brackets
 * blindly gives `(b(ii))`, which no exam paper has ever printed. Cambridge sets the two levels
 * as separate brackets: `(b) (ii)`.
 */
const partLabel = (label: string): string => {
  const open = label.indexOf('(');
  return open === -1 ? `(${label})` : `(${label.slice(0, open)}) ${label.slice(open)}`;
};

function Part({
  part,
  verdict,
  onGrade,
}: {
  part: ExamPart;
  verdict: PartVerdict;
  onGrade: (verdict: PartVerdict) => void;
}): ReactNode {
  const [raw, setRaw] = useState('');
  const [attempts, setAttempts] = useState(0);
  const settled = isSettled(verdict);
  // The scheme appears once the learner has committed: on a correct answer, after two real
  // attempts, or when they ask for it. Showing it unasked turns the question back into
  // something to read.
  const showScheme = settled || attempts >= 2;

  return (
    <section className="lab-exam-part" aria-label={`Part ${part.label}`}>
      <header className="lab-exam-part-head">
        <strong>{partLabel(part.label)}</strong>
        <span className="lab-exam-marks">[{markWord(part.marks)}]</span>
      </header>
      <p className="lab-exam-prompt">{part.prompt}</p>
      {part.command ? (
        <p className="lab-exam-command">
          Command word: <strong>{part.command}</strong>
        </p>
      ) : null}

      {part.answer ? (
        <div className="lab-field-row">
          <Input
            value={raw}
            placeholder="your answer"
            aria-label={`Answer to part ${part.label}`}
            disabled={settled}
            onChange={(e) => setRaw(e.target.value)}
            className="lab-exam-input"
          />
          {part.unit ? <span className="lab-exam-unit">{part.unit}</span> : null}
          <Button
            type="button"
            size="sm"
            disabled={settled || !raw.trim()}
            onClick={() => {
              setAttempts((n) => n + 1);
              onGrade(gradePart(part, raw));
            }}
          >
            Check
          </Button>
          {/* Visible from the first look, not unlocked by failing twice.
              A learner who cannot start the part has nothing to type, so an escape that
              only appears after two submitted guesses is an escape they cannot reach.
              It is worded as what it gives up, and it awards no marks. */}
          {!settled ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="lab-exam-reveal"
              onClick={() => onGrade({ state: 'revealed' })}
            >
              Show mark scheme
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="lab-exam-note">
          Write your answer on paper, then read the mark scheme and mark it yourself.
        </p>
      )}

      {verdict.state === 'correct' ? (
        <p className="lab-exam-verdict" data-tone="good">
          Correct. {markWord(verdict.marks)} earned.
        </p>
      ) : null}
      {verdict.state === 'known-error' ? (
        <p className="lab-exam-verdict" data-tone="warn">
          Not yet. {verdict.why}
        </p>
      ) : null}
      {verdict.state === 'wrong' ? (
        <p className="lab-exam-verdict" data-tone="bad">
          Not yet. Check your working, then try again, or show the mark scheme.
        </p>
      ) : null}
      {verdict.state === 'revealed' ? (
        <p className="lab-exam-verdict" data-tone="warn">
          Mark scheme shown. No marks for this part: read it, then try the next one unaided.
        </p>
      ) : null}

      {/* A part with no graded answer shows a closed scheme the learner opens to mark themselves;
          a graded part opens it the moment it is revealed, since that is the point of revealing it. */}
      {!part.answer || showScheme ? (
        <details className="lab-exam-scheme" open={showScheme}>
          <summary>Mark scheme</summary>
          <ul>
            {part.markScheme.map((point, i) => (
              <li key={i}>
                {point.text} <span className="lab-exam-marks">[{markWord(point.marks ?? 1)}]</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function ExamQuestion({
  reference,
  stem = DEFAULT_EXAM_STEM,
  parts = DEFAULT_EXAM_PARTS,
  title,
  activity = 'exam-question',
}: ExamQuestionProps = {}): ReactNode {
  const [verdicts, setVerdicts] = useState<Record<string, PartVerdict>>({});
  const total = totalMarks(parts);
  const earned = earnedMarks(parts, verdicts);
  // Finished, not perfect. A revealed part closes too, and the score below carries what it cost:
  // requiring every part to be CORRECT left a stuck learner with a question that never completed.
  const allGraded = parts.filter((p) => p.answer).every((p) => isSettled(verdicts[p.label]));

  // With no title the heading names what the learner is facing, which varies per question and is
  // the thing they most want to know. A fixed sentence would read as boilerplate by the fourth
  // chapter, and the lesson page already carries its own title above this.
  const heading = title ?? `${total}-mark structured question`;

  // The checkpoint carries marks earned out of marks available, not a fraction, so a report can
  // say "7 of 10" rather than "0.7" and a partly-right question still counts for something.
  useCheckpoint({
    solved: allGraded,
    activity,
    score: { raw: earned, max: total },
  });

  return (
    <Activity.Root className="lab-exam-question" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow={reference ?? 'Exam practice'} title={heading} description={stem} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {earned} / {total}
        </strong>
        <span>{parts.length} parts</span>
        <span>no options given</span>
      </Activity.Status>
      {/* The parts belong in the WORKSPACE slot, not straight under the root: below 60rem the
          stylesheet gives every named slot an explicit flex `order`, so a bare child sorts at 0
          and renders ABOVE the heading. */}
      <Activity.Workspace>
        <div className="lab-exam-parts">
          {parts.map((part) => (
            <Part
              key={part.label}
              part={part}
              verdict={verdicts[part.label] ?? { state: 'unanswered' }}
              onGrade={(verdict) => setVerdicts((v) => ({ ...v, [part.label]: verdict }))}
            />
          ))}
        </div>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Marks</span>
        <div>
          An examiner awards the marks in the scheme, not the final number alone. A right answer with no
          working can still lose the method marks.
        </div>
      </Activity.Feedback>
    </Activity.Root>
  );
}
