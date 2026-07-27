import type { Inputs } from '../engine/types'

// Copy to defaults.local.ts (gitignored) to override FALLBACK_DEFAULTS in index.ts.
const localDefaults: Partial<Inputs> = {
  assets: 80_000,
  realReturn: 0.03,
  incomeByYear: [80_000],
  spendingAnnual: 60_000,
  currentAge: 41,
  deathAge: 95,
  ssAge: 62,
  ssMonthly: 1500,
  targetRemainingAssets: 20_000,
}

export default localDefaults
