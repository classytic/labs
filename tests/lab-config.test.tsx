/**
 * LabConfig — the schema→form primitive. Proves it auto-renders a friendly form
 * from a Zod schema (no raw JSON for the common cases): scalars, enums, arrays of
 * objects → a table, arrays of strings → tags; only genuinely un-flattenable
 * shapes (array of objects-with-nested-arrays) fall back to a raw-JSON box.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { z } from 'zod';
import { LabConfig } from '../dist/blocks/index.mjs';

const SCHEMA = z.object({
  title: z.string(),
  count: z.number(),
  on: z.boolean(),
  mode: z.enum(['a', 'b']),
  accounts: z.array(z.object({ id: z.string(), name: z.string(), category: z.enum(['Asset', 'Liability']) })),
  tags: z.array(z.string()),
  // array of objects whose field is itself an array → can't flatten → JSON fallback
  txns: z.array(z.object({ label: z.string(), effects: z.array(z.object({ account: z.string(), delta: z.number() })) })),
});

describe('LabConfig schema→form', () => {
  it('renders friendly inputs for scalars/enums + a TABLE for array<object> (no JSON)', () => {
    const onChange = vi.fn();
    const { container, getByText } = render(<LabConfig schema={SCHEMA} value={{}} onChange={onChange} />);
    // enum → chips
    expect(getByText('a')).toBeTruthy();
    expect(getByText('b')).toBeTruthy();
    // array<object> → RowsEditor with an "+ account" button (addLabel = key minus trailing s)
    expect(getByText('+ account')).toBeTruthy();
    // array<string> → tag input (TagsField), not JSON
    // textareas only appear for the un-flattenable txns (effects is a nested array)
    const textareas = container.querySelectorAll('textarea');
    expect(textareas.length).toBe(1);              // ONLY the txns advanced fallback
    expect(getByText('txns (advanced)')).toBeTruthy();
  });

  it('+ row on an array<object> patches with a blank record from the element schema', () => {
    const onChange = vi.fn();
    const { getByText } = render(<LabConfig schema={SCHEMA} value={{ accounts: [] }} onChange={onChange} />);
    fireEvent.click(getByText('+ account'));
    expect(onChange).toHaveBeenCalledWith({ accounts: [{ id: '', name: '', category: 'Asset' }] });
  });
});
