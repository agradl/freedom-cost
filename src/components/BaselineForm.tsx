import { useState, useRef, type ChangeEvent } from 'react'
import type { Inputs, SpendingCategory } from '../engine/types'
import {
  exportBaselineJSON,
  parseBaselineJSON,
  DEFAULT_INPUTS,
} from '../persist'
import { SpendingBreakdown } from './SpendingBreakdown'

interface BaselineFormProps {
  inputs: Inputs
  onChange: (inputs: Inputs) => void
  onReset: () => void
}

function formatIncomeArray(incomeByYear: number[]): string {
  return incomeByYear.join(', ')
}

function parseIncomeString(raw: string): number[] {
  const parts = raw
    .split(',')
    .map((p) => p.trim().replace(/[\$,]/g, ''))
    .filter((p) => p.length > 0)
  const numbers = parts.map((p) => Number.parseFloat(p))
  if (numbers.length === 0 || numbers.some((n) => Number.isNaN(n) || n < 0)) {
    return [0]
  }
  return numbers
}

export function BaselineForm({ inputs, onChange, onReset }: BaselineFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [incomeInput, setIncomeInput] = useState<string>(
    formatIncomeArray(inputs.incomeByYear),
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBreakdownChange = (categories: SpendingCategory[] | undefined) => {
    if (categories === undefined) {
      const { spendingBreakdown: _removed, ...rest } = inputs
      onChange(rest)
      return
    }
    onChange({ ...inputs, spendingBreakdown: categories })
  }

  const handleAssetsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value) || 0
    onChange({ ...inputs, assets: Math.max(0, val) })
  }

  const handleReturnChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value) || 0
    // e.g. 4.0 % -> 0.04
    onChange({ ...inputs, realReturn: val / 100 })
  }

  const handleSpendingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value) || 0
    onChange({ ...inputs, spendingAnnual: Math.max(0, val) })
  }

  const handleAgeFieldChange =
    (field: 'currentAge' | 'deathAge' | 'ssAge') =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const val = Number.parseInt(e.target.value, 10)
      onChange({ ...inputs, [field]: Number.isNaN(val) ? 0 : Math.max(0, val) })
    }

  const handleSsMonthlyChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value) || 0
    onChange({ ...inputs, ssMonthly: Math.max(0, val) })
  }

  const handleRemainingAssetsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseFloat(e.target.value) || 0
    onChange({ ...inputs, targetRemainingAssets: Math.max(0, val) })
  }

  const handleIncomeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    setIncomeInput(raw)
    const parsed = parseIncomeString(raw)
    onChange({ ...inputs, incomeByYear: parsed })
  }

  const handleExport = () => {
    exportBaselineJSON(inputs)
  }

  const handleImportClick = () => {
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsedInputs = parseBaselineJSON(text)
        onChange(parsedInputs)
        setIncomeInput(formatIncomeArray(parsedInputs.incomeByYear))
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import JSON')
      }
    }
    reader.readAsText(file)

    if (e.target) {
      e.target.value = ''
    }
  }

  const handleResetClick = () => {
    setError(null)
    onReset()
    setIncomeInput(formatIncomeArray(DEFAULT_INPUTS.incomeByYear))
  }

  return (
    <div
      className="baseline-form-panel"
      data-testid="baseline-form-panel"
      data-disclosure-open={isOpen}
    >
      <div className="baseline-form-header">
        <button
          type="button"
          className="baseline-toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
          data-testid="toggle-baseline-form-btn"
          aria-expanded={isOpen}
        >
          <span className="toggle-icon">{isOpen ? '▼' : '►'}</span>
          <span>Baseline Assumptions</span>
        </button>
        <div className="baseline-quick-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={handleExport}
            data-testid="export-json-btn"
            title="Export current baseline to JSON file"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="secondary-btn"
            onClick={handleImportClick}
            data-testid="import-json-btn"
            title="Import baseline from JSON file"
          >
            Import JSON
          </button>
          <button
            type="button"
            className="secondary-btn danger"
            onClick={handleResetClick}
            data-testid="reset-baseline-btn"
            title="Reset baseline assumptions to defaults"
          >
            Reset Defaults
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            style={{ display: 'none' }}
            data-testid="import-json-input"
          />
        </div>
      </div>

      {error && (
        <div className="form-error" data-testid="baseline-form-error">
          {error}
        </div>
      )}

      {isOpen && (
        <div className="baseline-form-body" data-testid="baseline-form-body">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="assets-input">Starting Assets ($)</label>
              <input
                id="assets-input"
                type="number"
                min="0"
                step="1000"
                value={inputs.assets}
                onChange={handleAssetsChange}
                data-testid="assets-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="spending-input">Annual Spending ($)</label>
              <input
                id="spending-input"
                type="number"
                min="0"
                step="1000"
                value={inputs.spendingAnnual}
                onChange={handleSpendingChange}
                data-testid="spending-input"
              />
            </div>

            <div className="form-group full-width">
              <SpendingBreakdown
                spendingAnnual={inputs.spendingAnnual}
                categories={inputs.spendingBreakdown ?? []}
                onChange={handleBreakdownChange}
                isOpen={breakdownOpen}
                onToggle={() => setBreakdownOpen((open) => !open)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="return-input">Expected Real Return (%)</label>
              <input
                id="return-input"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={(inputs.realReturn * 100).toFixed(1)}
                onChange={handleReturnChange}
                data-testid="return-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="current-age-input">Current Age</label>
              <input
                id="current-age-input"
                type="number"
                min="0"
                step="1"
                value={inputs.currentAge}
                onChange={handleAgeFieldChange('currentAge')}
                data-testid="current-age-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="death-age-input">Death Age</label>
              <input
                id="death-age-input"
                type="number"
                min="0"
                step="1"
                value={inputs.deathAge}
                onChange={handleAgeFieldChange('deathAge')}
                data-testid="death-age-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ss-age-input">Social Security Age</label>
              <input
                id="ss-age-input"
                type="number"
                min="0"
                step="1"
                value={inputs.ssAge}
                onChange={handleAgeFieldChange('ssAge')}
                data-testid="ss-age-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="ss-monthly-input">Social Security Monthly ($)</label>
              <input
                id="ss-monthly-input"
                type="number"
                min="0"
                step="10"
                value={inputs.ssMonthly}
                onChange={handleSsMonthlyChange}
                data-testid="ss-monthly-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="remaining-assets-input">
                Target Remaining Assets at Death ($)
              </label>
              <input
                id="remaining-assets-input"
                type="number"
                min="0"
                step="1000"
                value={inputs.targetRemainingAssets}
                onChange={handleRemainingAssetsChange}
                data-testid="remaining-assets-input"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="income-input">
                Annual After-Tax Income ($ by year, last year carries forward)
              </label>
              <input
                id="income-input"
                type="text"
                value={incomeInput}
                onChange={handleIncomeChange}
                placeholder="100000, 110000, 120000"
                data-testid="income-input"
              />
              <span className="field-hint">
                Take-home income in today’s dollars, comma-separated by year.
                Social Security is modeled separately in retirement.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
