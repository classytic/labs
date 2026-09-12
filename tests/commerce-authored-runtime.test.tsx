import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EOQLab } from '../src/commerce/finance/eoq.js';
import { BreakEvenLab } from '../src/commerce/finance/break-even.js';
import { RatioLab } from '../src/commerce/finance/ratio-lab.js';
import { DepreciationLab } from '../src/commerce/finance/depreciation.js';
import { StatementBuilderLab } from '../src/commerce/finance/statement-builder.js';
import { LimitedCompanyLab } from '../src/commerce/finance/limited-company.js';
import { ApportionLab } from '../src/commerce/finance/apportion.js';
import { ReorderPointLab } from '../src/commerce/finance/supply-chain.js';
import { CompoundInterestLab } from '../src/commerce/finance/compound-interest.js';
import { BusinessLesson, type Scene } from '../src/commerce/finance/business-lesson.js';
import { WarehouseAllocationLab } from '../src/commerce/finance/warehouse-allocation.js';
import eoqManifest from '../src/domains/accounting/eoq/manifest.js';
import reorderPointManifest from '../src/domains/accounting/reorder-point/manifest.js';
import apportionManifest from '../src/domains/accounting/apportion/manifest.js';
import warehouseManifest from '../src/domains/accounting/warehouse-allocation/manifest.js';
import compoundInterestManifest from '../src/domains/accounting/compound-interest/manifest.js';
import businessLessonManifest from '../src/domains/accounting/business-lesson/manifest.js';
import depreciationManifest from '../src/domains/accounting/depreciation/manifest.js';
import ratioLabManifest from '../src/domains/accounting/ratio-lab/manifest.js';
import limitedCompanyManifest from '../src/domains/accounting/limited-company/manifest.js';

describe('commerce authored runtime convergence', () => {
  it('rejects impossible operational scenarios and the removed legacy step shape', () => {
    expect(
      eoqManifest.schema.safeParse({ annualDemand: 0, orderCost: 10, holdingCostPerUnit: 2 }).success,
    ).toBe(false);
    expect(
      reorderPointManifest.schema.safeParse({
        usagePerDay: 10,
        steps: [{ lead: 'legacy shape', ask: 'when' }],
      }).success,
    ).toBe(false);
    expect(
      compoundInterestManifest.schema.safeParse({ steps: [{ lead: 'legacy shape', ask: 'gap' }] }).success,
    ).toBe(false);
    expect(
      reorderPointManifest.schema.safeParse({
        steps: [{ id: 'inspect', phase: 'observe', title: 'Inspect service', reveal: ['reorder'] }],
      }).success,
    ).toBe(true);
    expect(
      apportionManifest.schema.safeParse({
        parts: [
          { name: 'A', weight: 0 },
          { name: 'B', weight: 0 },
        ],
      }).success,
    ).toBe(false);
    expect(warehouseManifest.schema.safeParse({ departments: [{ name: 'Only', sqft: 100 }] }).success).toBe(
      false,
    );
  });

  it('validates the public authoring boundary for financial decision labs', () => {
    expect(businessLessonManifest.schema.safeParse({ scenes: [] }).success).toBe(false);
    expect(
      businessLessonManifest.schema.safeParse({
        scenes: [{ kind: 'decide', prompt: 'Invest?', choices: [] }],
      }).success,
    ).toBe(false);
    expect(
      businessLessonManifest.schema.safeParse({
        scenes: [
          {
            kind: 'decide',
            prompt: 'Invest?',
            choices: [
              {
                label: 'Invest',
                feedback: 'Cash and capital rise.',
                actions: [{ type: 'invest', amount: -10 }],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      businessLessonManifest.schema.safeParse({ scenes: [{ kind: 'narrate', text: 'Open the shop.' }] })
        .success,
    ).toBe(true);

    expect(depreciationManifest.schema.safeParse({ cost: 1000, residual: 1200 }).success).toBe(false);
    expect(
      depreciationManifest.schema.safeParse({ cost: 1000, residual: 100, ratePct: 25, life: 5 }).success,
    ).toBe(true);
    expect(
      ratioLabManifest.schema.safeParse({ currentAssets: 100, inventory: 120, currentLiabilities: 50 })
        .success,
    ).toBe(false);
    expect(ratioLabManifest.schema.safeParse({ show: ['current', 'quick'] }).success).toBe(true);
    expect(limitedCompanyManifest.schema.safeParse({ businessDebt: -1 }).success).toBe(false);
  });

  it('drives EOQ prediction, model optimization, and evidence reveal through the authored contract', async () => {
    const view = render(<EOQLab />);

    expect(view.getByRole('region', { name: 'Your task' }).textContent).toContain(
      'Predict before opening the model.',
    );
    expect(view.getByText('Make a prediction first')).toBeTruthy();
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(view.getByRole('radio', { name: 'rises' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(
      view.getByRole('region', { name: 'Economic order quantity: run the cheapest policy model' }),
    ).toBeTruthy();

    fireEvent.change(view.getByRole('slider', { name: 'your order size' }), { target: { value: '400' } });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('EOQ benchmark')).toBeTruthy();
  });

  it('drives break-even forecasting, viability, explanation, and transfer through the same runtime', async () => {
    const view = render(<BreakEvenLab />);

    fireEvent.click(view.getByRole('radio', { name: 'a loss (revenue < total cost)' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Break-even chart/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.change(view.getByRole('slider', { name: 'output units' }), { target: { value: '500' } });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'lower (fewer units needed)' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('slider', { name: 'fixed cost' })).toBeTruthy();
  });

  it('supports the diagnosis and repair pattern without a commerce-specific sequence shell', async () => {
    const view = render(<RatioLab />);

    fireEvent.click(view.getByRole('radio', { name: 'quick ratio below 1' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText('Company ratio evidence')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.change(view.getByRole('slider', { name: 'inventory included in current assets' }), {
      target: { value: '30' },
    });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'inventory becomes a liquid current asset' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('slider', { name: 'long-term debt' })).toBeTruthy();
  });

  it('supports comparative forecasting and a domain-evaluated method decision', async () => {
    const view = render(<DepreciationLab />);

    fireEvent.click(view.getByRole('radio', { name: 'the first year' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Depreciation of a machine/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'the same amount every year' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Plan the replacement horizon')).toBeTruthy();
    expect(view.getByText('5 / 5')).toBeTruthy();
  });

  it('keeps linked financial statements synchronized through a construction sequence', async () => {
    const view = render(<StatementBuilderLab />);

    fireEvent.click(view.getByRole('radio', { name: 'added to capital (equity) on the balance sheet' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('INCOME STATEMENT')).toBeTruthy();
    expect(view.getByText('BALANCE SHEET')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.change(view.getByRole('slider', { name: 'expenses' }), { target: { value: '20000' } });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'capital + liabilities' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Stress-test profitability')).toBeTruthy();
    expect(view.getByText('margin 20.0%')).toBeTruthy();
  });

  it('supports action-gated comparison across legal scenario branches', () => {
    const view = render(<LimitedCompanyLab />);

    fireEvent.click(view.getByRole('radio', { name: 'only what they invested' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Sole trader; personal loss/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('button', { name: 'limited company' }));
    expect(view.getByLabelText(/Limited company; personal loss/)).toBeTruthy();
    expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'all of the business’s debts' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('slider', { name: 'business debt' })).toBeTruthy();
  });

  it('supports proportional allocation construction from authored departments', async () => {
    const view = render(<ApportionLab />);

    fireEvent.click(view.getByRole('radio', { name: 'Machining' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Pool of .* split across 4 parts/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.change(view.getByRole('slider', { name: 'Admin machine-hours' }), {
      target: { value: '3000' },
    });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'one pool is divided by the total machine-hours' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByRole('slider', { name: 'total overhead' })).toBeTruthy();
    expect(view.getByText('Admin 25.0%')).toBeTruthy();
  });

  it('keeps the warehouse preset domain-specific while reusing the allocation engine', () => {
    const view = render(
      <WarehouseAllocationLab
        departments={[
          { name: 'Cold store', sqft: 3000 },
          { name: 'Dispatch', sqft: 1000 },
        ]}
        totalCost={24000}
      />,
    );
    expect(view.getByText('Warehouse cost, split by floor space')).toBeTruthy();
    expect(view.getByRole('radio', { name: 'Cold store' })).toBeTruthy();
    expect(view.getByText('Which department should receive the largest share of the rent?')).toBeTruthy();
  });

  it('teaches reorder policy through authored reveals and a domain-owned simulation', async () => {
    const view = render(<ReorderPointLab />);

    fireEvent.click(view.getByRole('radio', { name: 'the reorder level' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Stock level over time; reorder level/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'late deliveries or a demand spike' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.change(view.getByRole('slider', { name: 'buffer stock' }), { target: { value: '50' } });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Test a supplier delay')).toBeTruthy();
    expect(view.getAllByText('The second delivery arrives 3 days late').length).toBeGreaterThan(0);
    expect(view.getByText('Customer demand served')).toBeTruthy();
    expect(view.getByRole('slider', { name: 'lead time days' })).toBeTruthy();
  });

  it('keeps the unguided inventory explorer operable without exposing an empty control panel', () => {
    const view = render(<ReorderPointLab guided={false} scenario="demand-spike" />);
    expect(view.getByRole('group', { name: 'operating event' })).toBeTruthy();
    expect(view.getByRole('slider', { name: 'usage per day' })).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Late supplier' }));
    expect(view.getAllByText('The second delivery arrives 3 days late').length).toBeGreaterThan(0);
  });

  it('reveals compound growth, interest on interest, and scenario controls in sequence', async () => {
    const view = render(<CompoundInterestLab />);

    expect(view.queryByText('compound', { selector: 'text' })).toBeNull();
    fireEvent.click(view.getByRole('radio', { name: 'pulls far ahead (interest earns interest)' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByLabelText(/Compound vs simple interest/)).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'grows (accelerates)' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByRole('slider', { name: 'annual interest rate percent' })).toBeTruthy();
    fireEvent.change(view.getByRole('slider', { name: 'annual interest rate percent' }), {
      target: { value: '9' },
    });
    await waitFor(() =>
      expect((view.getByRole('button', { name: 'Continue' }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    expect(view.getByText('Compare compounding policies')).toBeTruthy();
    expect(view.getByRole('button', { name: 'monthly' })).toBeTruthy();
  });

  it('compiles an authored business scene script into shared progression and balanced books', () => {
    const scenes: Scene[] = [
      { kind: 'narrate', text: 'Open the test shop.' },
      {
        kind: 'decide',
        prompt: 'Choose the opening investment.',
        choices: [
          {
            label: 'Invest $500',
            actions: [{ type: 'invest', amount: 500 }],
            feedback: 'Capital and cash both rise.',
          },
        ],
      },
      {
        kind: 'predict',
        prompt: 'Does the investment create profit?',
        choices: [
          { value: 'no', label: 'No, it creates owner capital' },
          { value: 'yes', label: 'Yes, it is revenue' },
        ],
        answer: 'no',
        explain: 'Investment is financing, not trading income.',
      },
      { kind: 'report', show: 'balance', note: 'Inspect the accounting equation.' },
    ];
    const view = render(<BusinessLesson scenes={scenes} />);

    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    fireEvent.click(view.getByRole('radio', { name: 'Invest $500' }));
    expect(view.getByText('Cash $500')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));

    fireEvent.click(view.getByRole('radio', { name: 'No, it creates owner capital' }));
    fireEvent.click(view.getByRole('button', { name: 'Continue' }));
    expect(view.getByText('BALANCE SHEET')).toBeTruthy();
    expect(view.getByText('✓ it balances')).toBeTruthy();
  });
});
