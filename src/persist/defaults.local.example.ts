import type { Inputs } from '../engine/types'

// Copy to defaults.local.ts (gitignored) to override FALLBACK_DEFAULTS in index.ts.
const localDefaults: Partial<Inputs> = {
  assets: 80_000,
  realReturn: 0.03,
  incomeByYear: [80_000],
  spendingAnnual: 60_000,
  // Optional: monthly categories for the pie card. Sum must equal spendingAnnual / 12.
  spendingBreakdown: [
    { id: 'housing', label: 'Housing', monthly: 2_500 },
    { id: 'food', label: 'Food', monthly: 800 },
    { id: 'transport', label: 'Transport', monthly: 500 },
    { id: 'other', label: 'Other', monthly: 1_200 },
  ],
  currentAge: 41,
  deathAge: 95,
  ssAge: 62,
  ssMonthly: 1500,
  targetRemainingAssets: 20_000,
}

export default localDefaults
