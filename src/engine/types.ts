export type SpendingCategory = {
  id: string
  label: string
  monthly: number
}

export type Inputs = {
  assets: number
  realReturn: number
  incomeByYear: number[]
  spendingAnnual: number
  currentAge: number
  deathAge: number
  ssAge: number
  ssMonthly: number
  targetRemainingAssets: number
  spendingBreakdown?: SpendingCategory[]
}

export type Overlay = {
  oneTimePurchase?: number
  monthlyDelta?: number
  permanent?: boolean
}

export type SeriesPoint = {
  year: number
  balance: number
}

export type ReturnBandScenario = {
  realReturn: number
  retireYear: number
  target: number
  series: SeriesPoint[]
}

export type ReturnBands = {
  pessimistic: ReturnBandScenario
  optimistic: ReturnBandScenario
}

export type Result = {
  retireYear: number
  target: number
  series: SeriesPoint[]
  purchaseFutureValue?: number
  daysDeferred?: number
  band?: ReturnBands
}
