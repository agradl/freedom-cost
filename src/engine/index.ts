import type { Inputs, Overlay, Result, ReturnBands, SeriesPoint } from './types'

export type { Inputs, Overlay, Result, ReturnBands, ReturnBandScenario, SeriesPoint } from './types'

const MAX_YEARS = 100
const MONTHS_PER_YEAR = 12
const DAYS_PER_YEAR = 365

function incomeAt(yearIndex: number, incomeByYear: number[]): number {
  if (incomeByYear.length === 0) return 0
  if (yearIndex < incomeByYear.length) return incomeByYear[yearIndex]!
  return incomeByYear[incomeByYear.length - 1]!
}

function monthlyRateFromAnnual(realReturn: number): number {
  return (1 + realReturn) ** (1 / MONTHS_PER_YEAR) - 1
}

function netWithdrawalMonthly(
  ageMonths: number,
  spendingAnnual: number,
  ssAgeMonths: number,
  ssMonthly: number,
): number {
  const ss = ageMonths >= ssAgeMonths ? ssMonthly : 0
  return Math.max(0, spendingAnnual / MONTHS_PER_YEAR - ss)
}

/** Nest egg needed at `retireAge` (years, may be fractional) to fund spend until deathAge. */
export function requiredNestEgg(
  retireAge: number,
  spendingRetired: number,
  realReturn: number,
  ssAge: number,
  ssMonthly: number,
  deathAge: number,
  remaining: number,
): number {
  if (realReturn <= 0) return Number.POSITIVE_INFINITY
  if (!(deathAge > retireAge)) return Number.POSITIVE_INFINITY

  return requiredNestEggMonths(
    Math.round(retireAge * MONTHS_PER_YEAR),
    spendingRetired,
    monthlyRateFromAnnual(realReturn),
    Math.round(ssAge * MONTHS_PER_YEAR),
    ssMonthly,
    Math.round(deathAge * MONTHS_PER_YEAR),
    remaining,
  )
}

function requiredNestEggMonths(
  retireAgeMonths: number,
  spendingRetired: number,
  monthlyRate: number,
  ssAgeMonths: number,
  ssMonthly: number,
  deathAgeMonths: number,
  remaining: number,
): number {
  if (monthlyRate <= 0) return Number.POSITIVE_INFINITY
  if (!(deathAgeMonths > retireAgeMonths)) return Number.POSITIVE_INFINITY

  let needed = Math.max(0, remaining)
  for (let ageMonths = deathAgeMonths - 1; ageMonths >= retireAgeMonths; ageMonths--) {
    const withdrawal = netWithdrawalMonthly(
      ageMonths,
      spendingRetired,
      ssAgeMonths,
      ssMonthly,
    )
    needed = (needed + withdrawal) / (1 + monthlyRate)
  }
  return needed
}

function nestEggForMonths(
  inputs: Inputs,
  retireAgeMonths: number,
  spendingRetired: number,
  monthlyRate: number,
): number {
  return requiredNestEggMonths(
    retireAgeMonths,
    spendingRetired,
    monthlyRate,
    Math.round(inputs.ssAge * MONTHS_PER_YEAR),
    inputs.ssMonthly,
    Math.round(inputs.deathAge * MONTHS_PER_YEAR),
    inputs.targetRemainingAssets,
  )
}

function simulate(
  inputs: Inputs,
  overlay: Overlay | undefined,
): { retireYear: number; target: number; series: SeriesPoint[]; startBalance: number } {
  const purchase = overlay?.oneTimePurchase ?? 0
  const annualDelta = (overlay?.monthlyDelta ?? 0) * MONTHS_PER_YEAR
  const permanent = overlay?.permanent ?? false

  const spendingWorking = inputs.spendingAnnual + annualDelta
  const spendingRetired = permanent ? spendingWorking : inputs.spendingAnnual

  const startBalance = inputs.assets - purchase
  const series: SeriesPoint[] = [{ year: 0, balance: startBalance }]

  const yearsUntilDeath = inputs.deathAge - inputs.currentAge
  if (yearsUntilDeath <= 0 || inputs.realReturn <= 0) {
    return {
      retireYear: Number.POSITIVE_INFINITY,
      target: Number.POSITIVE_INFINITY,
      series,
      startBalance,
    }
  }

  const monthlyRate = monthlyRateFromAnnual(inputs.realReturn)
  const startAgeMonths = Math.round(inputs.currentAge * MONTHS_PER_YEAR)
  const deathAgeMonths = Math.round(inputs.deathAge * MONTHS_PER_YEAR)

  const targetAtStart = nestEggForMonths(
    inputs,
    startAgeMonths,
    spendingRetired,
    monthlyRate,
  )
  if (startBalance >= targetAtStart) {
    return { retireYear: 0, target: targetAtStart, series, startBalance }
  }

  const maxMonths = Math.min(MAX_YEARS, yearsUntilDeath) * MONTHS_PER_YEAR
  let balance = startBalance
  for (let m = 1; m <= maxMonths; m++) {
    const yearIndex = Math.floor((m - 1) / MONTHS_PER_YEAR)
    balance =
      balance * (1 + monthlyRate) +
      incomeAt(yearIndex, inputs.incomeByYear) / MONTHS_PER_YEAR -
      spendingWorking / MONTHS_PER_YEAR

    if (m % MONTHS_PER_YEAR === 0) {
      series.push({ year: m / MONTHS_PER_YEAR, balance })
    }

    const ageMonths = startAgeMonths + m
    if (ageMonths >= deathAgeMonths) {
      break
    }

    const target = nestEggForMonths(inputs, ageMonths, spendingRetired, monthlyRate)
    if (balance >= target) {
      return { retireYear: m / MONTHS_PER_YEAR, target, series, startBalance }
    }
  }

  return {
    retireYear: Number.POSITIVE_INFINITY,
    target: targetAtStart,
    series,
    startBalance,
  }
}

export function compute(inputs: Inputs, overlay?: Overlay): Result {
  const withOverlay = simulate(inputs, overlay)

  const pessReturn = Math.max(0.005, inputs.realReturn - 0.02)
  const optReturn = inputs.realReturn + 0.02

  const pessSim = simulate({ ...inputs, realReturn: pessReturn }, overlay)
  const optSim = simulate({ ...inputs, realReturn: optReturn }, overlay)

  const result: Result = {
    retireYear: withOverlay.retireYear,
    target: withOverlay.target,
    series: withOverlay.series,
    band: {
      pessimistic: {
        realReturn: pessReturn,
        retireYear: pessSim.retireYear,
        target: pessSim.target,
        series: pessSim.series,
      },
      optimistic: {
        realReturn: optReturn,
        retireYear: optSim.retireYear,
        target: optSim.target,
        series: optSim.series,
      },
    },
  }

  const purchase = overlay?.oneTimePurchase ?? 0
  if (purchase > 0 && Number.isFinite(withOverlay.retireYear)) {
    result.purchaseFutureValue =
      purchase * (1 + inputs.realReturn) ** withOverlay.retireYear
  }

  const hasOverlay =
    (overlay?.oneTimePurchase ?? 0) !== 0 ||
    (overlay?.monthlyDelta ?? 0) !== 0

  if (hasOverlay) {
    const baseline = simulate(inputs, undefined)
    if (
      Number.isFinite(baseline.retireYear) &&
      Number.isFinite(withOverlay.retireYear)
    ) {
      result.daysDeferred =
        (withOverlay.retireYear - baseline.retireYear) * DAYS_PER_YEAR
    }
  }

  return result
}
