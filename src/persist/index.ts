import type { Inputs } from '../engine/types'

export const STORAGE_KEY = 'freedom_cost_baseline'

export const FALLBACK_DEFAULTS: Inputs = {
  assets: 10_000,
  realReturn: 0.03,
  incomeByYear: [80_000],
  spendingAnnual: 60_000,
  currentAge: 41,
  deathAge: 95,
  ssAge: 65,
  ssMonthly: 1500,
  targetRemainingAssets: 0,
}

const localModules = import.meta.glob<{ default: Partial<Inputs> }>(
  './defaults.local.ts',
  { eager: true },
)

export const DEFAULT_INPUTS: Inputs = {
  ...FALLBACK_DEFAULTS,
  ...(localModules['./defaults.local.ts']?.default ?? {}),
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

function isLegacyCore(data: Record<string, unknown>): boolean {
  return (
    isFiniteNumber(data.assets) &&
    isFiniteNumber(data.realReturn) &&
    isFiniteNumber(data.spendingAnnual) &&
    Array.isArray(data.incomeByYear) &&
    data.incomeByYear.length > 0 &&
    data.incomeByYear.every((x) => isFiniteNumber(x))
  )
}

function mergeWithDefaults(data: Record<string, unknown>): Inputs {
  return {
    assets: data.assets as number,
    realReturn: data.realReturn as number,
    spendingAnnual: data.spendingAnnual as number,
    incomeByYear: data.incomeByYear as number[],
    currentAge: isFiniteNumber(data.currentAge)
      ? data.currentAge
      : DEFAULT_INPUTS.currentAge,
    deathAge: isFiniteNumber(data.deathAge)
      ? data.deathAge
      : DEFAULT_INPUTS.deathAge,
    ssAge: isFiniteNumber(data.ssAge) ? data.ssAge : DEFAULT_INPUTS.ssAge,
    ssMonthly: isFiniteNumber(data.ssMonthly)
      ? data.ssMonthly
      : DEFAULT_INPUTS.ssMonthly,
    targetRemainingAssets: isFiniteNumber(data.targetRemainingAssets)
      ? data.targetRemainingAssets
      : DEFAULT_INPUTS.targetRemainingAssets,
  }
}

export function loadBaseline(): Inputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_INPUTS
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && isLegacyCore(parsed)) {
      return mergeWithDefaults(parsed as Record<string, unknown>)
    }
  } catch {
    // Fall back on default inputs if localStorage fails or contains invalid JSON
  }
  return DEFAULT_INPUTS
}

export function saveBaseline(inputs: Inputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs))
  } catch {
    // Ignore storage quota or access errors
  }
}

export function resetBaseline(): Inputs {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore errors
  }
  return DEFAULT_INPUTS
}

export function parseBaselineJSON(jsonString: string): Inputs {
  const parsed = JSON.parse(jsonString)
  if (typeof parsed !== 'object' || parsed === null || !isLegacyCore(parsed)) {
    throw new Error('Invalid baseline JSON format')
  }
  return mergeWithDefaults(parsed as Record<string, unknown>)
}

export function exportBaselineJSON(inputs: Inputs): void {
  const blob = new Blob([JSON.stringify(inputs, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'freedom-cost-baseline.json'
  anchor.click()
  URL.revokeObjectURL(url)
}
