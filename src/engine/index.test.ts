import { describe, expect, it } from 'vitest'
import { compute, requiredNestEgg } from './index'
import type { Inputs } from './types'

const lifeDefaults = {
  currentAge: 41,
  deathAge: 95,
  ssAge: 65,
  ssMonthly: 4152,
  targetRemainingAssets: 0,
} as const

const baseline: Inputs = {
  assets: 500_000,
  realReturn: 0.04,
  incomeByYear: [120_000],
  spendingAnnual: 80_000,
  ...lifeDefaults,
}

describe('requiredNestEgg', () => {
  it('matches hand-computed finite-horizon nest egg with no SS', () => {
    // Ages 65–67 funded monthly (24 months), spend 40k/yr, r=4% annual, remaining 0
    const monthlyRate = 1.04 ** (1 / 12) - 1
    const monthlySpend = 40_000 / 12
    let expected = 0
    for (let i = 0; i < 24; i++) {
      expected = (expected + monthlySpend) / (1 + monthlyRate)
    }
    expect(
      requiredNestEgg(65, 40_000, 0.04, 99, 0, 67, 0),
    ).toBeCloseTo(expected)
  })

  it('reduces nest egg when SS covers part of retirement spend', () => {
    const withoutSs = requiredNestEgg(65, 40_000, 0.04, 99, 0, 95, 0)
    const withSs = requiredNestEgg(65, 40_000, 0.04, 65, 4152, 95, 0)
    expect(withSs).toBeLessThan(withoutSs)
  })
})

describe('compute baseline', () => {
  it('retires when balance reaches life-horizon nest egg', () => {
    const result = compute(baseline)
    expect(Number.isFinite(result.target)).toBe(true)
    expect(result.retireYear).toBeGreaterThan(0)
    expect(Number.isFinite(result.retireYear)).toBe(true)

    // Series is yearly; retirement may fall mid-year (fractional retireYear).
    const yearFloor = Math.floor(result.retireYear)
    const atFloor = result.series.find((p) => p.year === yearFloor)
    expect(atFloor).toBeDefined()

    const retireAge = baseline.currentAge + result.retireYear
    expect(result.target).toBeCloseTo(
      requiredNestEgg(
        retireAge,
        baseline.spendingAnnual,
        baseline.realReturn,
        baseline.ssAge,
        baseline.ssMonthly,
        baseline.deathAge,
        baseline.targetRemainingAssets,
      ),
    )
  })

  it('resolves retirement to month granularity', () => {
    const result = compute(baseline)
    const months = result.retireYear * 12
    expect(months).toBeCloseTo(Math.round(months))
  })

  it('starts series at year 0 with current assets', () => {
    const result = compute(baseline)
    expect(result.series[0]).toEqual({ year: 0, balance: 500_000 })
  })

  it('carries the last income year forward', () => {
    const short = compute({
      ...baseline,
      incomeByYear: [200_000, 100_000],
    })
    const flat = compute({
      ...baseline,
      incomeByYear: [200_000, 100_000, 100_000, 100_000, 100_000],
    })
    expect(short.retireYear).toBe(flat.retireYear)
    expect(short.series.map((p) => p.balance)).toEqual(
      flat.series.slice(0, short.series.length).map((p) => p.balance),
    )
  })

  it('reports already retired when assets meet the nest egg at current age', () => {
    const targetNow = requiredNestEgg(
      baseline.currentAge,
      baseline.spendingAnnual,
      baseline.realReturn,
      baseline.ssAge,
      baseline.ssMonthly,
      baseline.deathAge,
      baseline.targetRemainingAssets,
    )
    const result = compute({
      ...baseline,
      assets: targetNow,
    })
    expect(result.retireYear).toBe(0)
    expect(result.series).toHaveLength(1)
    expect(result.target).toBeCloseTo(targetNow)
  })

  it('delays retirement when target remaining assets rise', () => {
    const base = compute(baseline)
    const withBequest = compute({
      ...baseline,
      targetRemainingAssets: 500_000,
    })
    expect(withBequest.target).toBeGreaterThan(base.target)
    expect(withBequest.retireYear).toBeGreaterThan(base.retireYear)
  })

  it('SS at claim age lowers required nest egg vs no SS', () => {
    const withSs = compute(baseline)
    const withoutSs = compute({ ...baseline, ssMonthly: 0 })
    expect(withSs.target).toBeLessThan(withoutSs.target)
    expect(withSs.retireYear).toBeLessThanOrEqual(withoutSs.retireYear)
  })
})

describe('one-time purchase', () => {
  it('defers retirement and reports compounded future value', () => {
    const base = compute(baseline)
    const withPurchase = compute(baseline, { oneTimePurchase: 50_000 })

    expect(withPurchase.retireYear).toBeGreaterThan(base.retireYear)
    expect(withPurchase.series[0]!.balance).toBe(450_000)
    expect(withPurchase.purchaseFutureValue).toBeCloseTo(
      50_000 * 1.04 ** withPurchase.retireYear,
    )
    expect(withPurchase.daysDeferred).toBeCloseTo(
      (withPurchase.retireYear - base.retireYear) * 365,
    )
  })

  it('can defer retirement by months rather than a whole year', () => {
    const base = compute(baseline)
    const withPurchase = compute(baseline, { oneTimePurchase: 2_000 })
    const deltaYears = withPurchase.retireYear - base.retireYear
    expect(deltaYears).toBeGreaterThan(0)
    expect(deltaYears).toBeLessThan(1)
    expect(deltaYears * 12).toBeCloseTo(Math.round(deltaYears * 12))
  })
})

describe('monthly rate shift', () => {
  it('spending more permanently defers retirement more than temporary', () => {
    const base = compute(baseline)
    const temporary = compute(baseline, {
      monthlyDelta: 2_000,
      permanent: false,
    })
    const permanent = compute(baseline, {
      monthlyDelta: 2_000,
      permanent: true,
    })

    expect(temporary.retireYear).toBeGreaterThan(base.retireYear)
    expect(permanent.retireYear).toBeGreaterThan(temporary.retireYear)
    // Temporary keep retired spend; target still shifts with retire age.
    expect(temporary.target).toBeCloseTo(
      requiredNestEgg(
        baseline.currentAge + temporary.retireYear,
        baseline.spendingAnnual,
        baseline.realReturn,
        baseline.ssAge,
        baseline.ssMonthly,
        baseline.deathAge,
        baseline.targetRemainingAssets,
      ),
    )
    expect(permanent.target).toBeGreaterThan(
      requiredNestEgg(
        baseline.currentAge + permanent.retireYear,
        baseline.spendingAnnual,
        baseline.realReturn,
        baseline.ssAge,
        baseline.ssMonthly,
        baseline.deathAge,
        baseline.targetRemainingAssets,
      ),
    )
    expect(temporary.daysDeferred).toBeGreaterThan(0)
    expect(permanent.daysDeferred).toBeGreaterThan(temporary.daysDeferred!)
  })
  it('cutting spending permanently advances retirement and lowers target', () => {
    const base = compute(baseline)
    const cut = compute(baseline, {
      monthlyDelta: -500,
      permanent: true,
    })

    expect(cut.retireYear).toBeLessThan(base.retireYear)
    expect(cut.target).toBeLessThan(base.target)
    expect(cut.daysDeferred).toBeLessThan(0)
  })
})

describe('honesty layer return band', () => {
  it('computes pessimistic and optimistic scenarios with appropriate return rates', () => {
    const result = compute(baseline)
    expect(result.band).toBeDefined()
    expect(result.band?.pessimistic.realReturn).toBeCloseTo(0.02)
    expect(result.band?.optimistic.realReturn).toBeCloseTo(0.06)

    expect(result.band?.pessimistic.retireYear).toBeGreaterThan(result.retireYear)
    expect(result.band?.optimistic.retireYear).toBeLessThan(result.retireYear)

    expect(result.band?.pessimistic.target).toBeGreaterThan(result.target)
    expect(result.band?.optimistic.target).toBeLessThan(result.target)
  })
})
