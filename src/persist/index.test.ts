import { describe, test, expect, beforeEach } from 'vitest'
import {
  loadBaseline,
  saveBaseline,
  resetBaseline,
  parseBaselineJSON,
  DEFAULT_INPUTS,
  STORAGE_KEY,
} from './index'
import type { Inputs } from '../engine/types'

const lifeDefaults = {
  currentAge: DEFAULT_INPUTS.currentAge,
  deathAge: DEFAULT_INPUTS.deathAge,
  ssAge: DEFAULT_INPUTS.ssAge,
  ssMonthly: DEFAULT_INPUTS.ssMonthly,
  targetRemainingAssets: DEFAULT_INPUTS.targetRemainingAssets,
}

describe('Persistence module', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('loadBaseline returns DEFAULT_INPUTS when localStorage is empty', () => {
    expect(loadBaseline()).toEqual(DEFAULT_INPUTS)
  })

  test('saveBaseline stores inputs and loadBaseline retrieves them', () => {
    const customInputs: Inputs = {
      assets: 750_000,
      realReturn: 0.05,
      incomeByYear: [120_000, 130_000],
      spendingAnnual: 50_000,
      ...lifeDefaults,
      currentAge: 45,
    }

    saveBaseline(customInputs)
    expect(loadBaseline()).toEqual(customInputs)
    expect(localStorage.getItem(STORAGE_KEY)).toBe(JSON.stringify(customInputs))
  })

  test('resetBaseline clears localStorage and returns DEFAULT_INPUTS', () => {
    const customInputs: Inputs = {
      assets: 1_000_000,
      realReturn: 0.03,
      incomeByYear: [80_000],
      spendingAnnual: 35_000,
      ...lifeDefaults,
    }
    saveBaseline(customInputs)

    const resetResult = resetBaseline()
    expect(resetResult).toEqual(DEFAULT_INPUTS)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  test('loadBaseline falls back to DEFAULT_INPUTS on invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json')
    expect(loadBaseline()).toEqual(DEFAULT_INPUTS)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ assets: 'not a number' }))
    expect(loadBaseline()).toEqual(DEFAULT_INPUTS)
  })

  test('loadBaseline merges life-horizon defaults into legacy baselines', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        assets: 600_000,
        realReturn: 0.045,
        incomeByYear: [90_000],
        spendingAnnual: 42_000,
      }),
    )
    expect(loadBaseline()).toEqual({
      assets: 600_000,
      realReturn: 0.045,
      incomeByYear: [90_000],
      spendingAnnual: 42_000,
      ...lifeDefaults,
    })
  })

  test('parseBaselineJSON validates valid and invalid JSON strings', () => {
    const validInputs: Inputs = {
      assets: 600_000,
      realReturn: 0.045,
      incomeByYear: [90_000],
      spendingAnnual: 42_000,
      ...lifeDefaults,
    }
    const json = JSON.stringify(validInputs)
    expect(parseBaselineJSON(json)).toEqual(validInputs)

    expect(() => parseBaselineJSON('{"assets": 1000}')).toThrow(
      'Invalid baseline JSON format',
    )
  })

  test('parseBaselineJSON merges missing life-horizon fields from defaults', () => {
    const legacy = {
      assets: 600_000,
      realReturn: 0.045,
      incomeByYear: [90_000],
      spendingAnnual: 42_000,
    }
    expect(parseBaselineJSON(JSON.stringify(legacy))).toEqual({
      ...legacy,
      ...lifeDefaults,
    })
  })
})
