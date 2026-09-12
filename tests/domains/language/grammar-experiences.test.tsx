import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgreementLab } from '../../../src/language/agreement/preset.js';
import { ArticleLensLab } from '../../../src/language/article-lens/preset.js';
import { ClozeLab } from '../../../src/language/cloze/preset.js';
import { ErrorCorrectLab } from '../../../src/language/error-correct/preset.js';
import { PrepositionSceneLab } from '../../../src/language/preposition-scene/preset.js';
import agreementManifest from '../../../src/domains/language/agreement/manifest.js';
import articleManifest from '../../../src/domains/language/article-lens/manifest.js';
import clozeManifest from '../../../src/domains/language/cloze/manifest.js';
import errorManifest from '../../../src/domains/language/error-correct/manifest.js';
import prepositionManifest from '../../../src/domains/language/preposition/manifest.js';

describe('language grammar experiences', () => {
  it('uses one contextual progression pattern for choice and correction activities', () => {
    const agreement = render(
      <AgreementLab
        items={[
          { subject: 'She', options: ['go', 'goes'], correct: 'goes' },
          { subject: 'They', options: ['go', 'goes'], correct: 'go' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'goes' }));
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
    agreement.unmount();

    const article = render(
      <ArticleLensLab
        items={[
          { before: 'I saw', noun: 'cat', answer: 'a' },
          { before: 'Open', noun: 'door', answer: 'the' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'a' }));
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
    article.unmount();

    const correction = render(
      <ErrorCorrectLab
        items={[
          { text: 'He go home.', wrong: 'go', fix: 'goes' },
          { text: 'a apple', wrong: 'a', fix: 'an' },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'go' }));
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
    correction.unmount();

    render(
      <PrepositionSceneLab
        items={[
          {
            before: 'The bird is',
            noun: 'the tree',
            answer: 'above',
            options: ['above', 'under'],
            scene: 'above',
          },
          {
            before: 'The cat is',
            noun: 'the table',
            answer: 'under',
            options: ['on', 'under'],
            scene: 'under',
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: 'above' }));
    expect(screen.getByText('1 of 2 complete')).not.toBeNull();
  });

  it('advances cloze only after the authored blank is actually filled', async () => {
    render(
      <ClozeLab
        items={[
          { text: 'She ___ home.', answers: ['goes'] },
          { text: 'They ___ home.', answers: ['go'] },
        ]}
      />,
    );
    expect(screen.queryByText('1 of 2 complete')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'tile goes' }));
    await waitFor(() => expect(screen.getByText('1 of 2 complete')).not.toBeNull());
  });

  it('rejects authoring shapes that would be impossible or misleading at runtime', () => {
    expect(
      agreementManifest.schema.safeParse({
        items: [{ subject: 'She', options: ['go', 'go'], correct: 'goes' }],
      }).success,
    ).toBe(false);
    expect(articleManifest.schema.safeParse({ items: [] }).success).toBe(false);
    expect(
      clozeManifest.schema.safeParse({ items: [{ text: 'She ___ to ___.', answers: ['goes'] }] }).success,
    ).toBe(false);
    expect(
      errorManifest.schema.safeParse({ items: [{ text: 'He goes home.', wrong: 'go', fix: 'goes' }] })
        .success,
    ).toBe(false);
    expect(
      prepositionManifest.schema.safeParse({
        items: [
          {
            before: 'The bird is',
            noun: 'the tree',
            answer: 'above',
            options: ['under', 'beside'],
            scene: 'above',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
