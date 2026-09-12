import type { ReactNode } from 'react';
import { AssessedChoiceGroup } from '../kit/controls.js';

export type BinaryAnswer = 'yes' | 'no';

export function BinaryTransferCheck({
  id,
  prompt,
  answer,
  correct,
  correctFeedback,
  retryFeedback,
  onAnswer,
}: {
  id: string;
  prompt: ReactNode;
  answer?: BinaryAnswer;
  correct: BinaryAnswer;
  correctFeedback: ReactNode;
  retryFeedback: ReactNode;
  onAnswer: (answer: BinaryAnswer) => void;
}): ReactNode {
  return (
    <section className="algorithm-transfer" aria-labelledby={id}>
      <div>
        <small>Transfer</small>
        <strong id={id}>{prompt}</strong>
      </div>
      <div className="algorithm-transfer-actions">
        <AssessedChoiceGroup
          value={answer}
          onChange={onAnswer}
          ariaLabel="Transfer answer"
          options={(['yes', 'no'] as const).map((choice) => ({
            value: choice,
            label: choice === 'yes' ? 'Yes' : 'No',
            tone: answer === choice ? (choice === correct ? 'correct' : 'wrong') : undefined,
          }))}
        />
      </div>
      {answer && (
        <p role={answer === correct ? 'status' : 'alert'}>
          {answer === correct ? correctFeedback : retryFeedback}
        </p>
      )}
    </section>
  );
}
