import { EquationBalanceLab } from "../commerce/accounting/equation-balance.mjs";
import { JournalPosterLab } from "../commerce/accounting/journal-poster.mjs";
import { StatementSorterLab } from "../commerce/accounting/statement-sorter.mjs";
import { z } from "zod";

//#region src/blocks/accounting.d.ts
declare const EquationBalanceBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, z.core.$strip>>>;
  transactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    effects: z.ZodArray<z.ZodObject<{
      account: z.ZodString;
      delta: z.ZodNumber;
    }, z.core.$strip>>;
  }, z.core.$strip>>>;
  freePost: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const JournalPosterBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, z.core.$strip>>>;
  transactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    prompt: z.ZodString;
    debit: z.ZodString;
    credit: z.ZodString;
    amount: z.ZodNumber;
  }, z.core.$strip>>>;
  showTrialBalance: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
declare const StatementSorterBlock: import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
    balance: z.ZodNumber;
  }, z.core.$strip>>>;
  asOfLabel: z.ZodOptional<z.ZodString>;
  showClosing: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** This domain's block specs + tag→component render map. */
declare const accountingBlocks: readonly [import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, z.core.$strip>>>;
  transactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    effects: z.ZodArray<z.ZodObject<{
      account: z.ZodString;
      delta: z.ZodNumber;
    }, z.core.$strip>>;
  }, z.core.$strip>>>;
  freePost: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
  }, z.core.$strip>>>;
  transactions: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    prompt: z.ZodString;
    debit: z.ZodString;
    credit: z.ZodString;
    amount: z.ZodNumber;
  }, z.core.$strip>>>;
  showTrialBalance: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, import("@classytic/cms-ui/contract").CmsBlock<z.ZodObject<{
  accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<{
      Asset: "Asset";
      Liability: "Liability";
      Equity: "Equity";
      Income: "Income";
      Expense: "Expense";
    }>;
    balance: z.ZodNumber;
  }, z.core.$strip>>>;
  asOfLabel: z.ZodOptional<z.ZodString>;
  showClosing: z.ZodDefault<z.ZodBoolean>;
  title: z.ZodOptional<z.ZodString>;
  prompt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>];
declare const accountingComponents: {
  readonly EquationBalance: typeof EquationBalanceLab;
  readonly JournalPoster: typeof JournalPosterLab;
  readonly StatementSorter: typeof StatementSorterLab;
};
//#endregion
export { EquationBalanceBlock, JournalPosterBlock, StatementSorterBlock, accountingBlocks, accountingComponents };