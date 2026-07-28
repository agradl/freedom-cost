import { useState } from 'react'
import { compute } from './engine'
import type { Inputs, Overlay } from './engine/types'
import { loadBaseline, saveBaseline, resetBaseline } from './persist'
import { TimelineChart } from './components/TimelineChart'
import { Levers } from './components/Levers'
import { AsymmetrySummary } from './components/AsymmetrySummary'
import { BaselineForm } from './components/BaselineForm'
import { SpendingBreakdownCard } from './components/SpendingBreakdownCard'
import { formatRetireYear } from './formatRetireYear'
import './index.css'

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function App() {
  const [inputs, setInputs] = useState<Inputs>(() => loadBaseline())
  const [overlay, setOverlay] = useState<Overlay>({
    oneTimePurchase: 0,
    monthlyDelta: 0,
    permanent: false,
  })

  const handleInputsChange = (newInputs: Inputs) => {
    setInputs(newInputs)
    saveBaseline(newInputs)
  }

  const handleInputsReset = () => {
    const defaultInputs = resetBaseline()
    setInputs(defaultInputs)
  }

  const baselineResult = compute(inputs)
  const overlayResult = compute(inputs, overlay)

  const hasActiveOverlay =
    (overlay.oneTimePurchase ?? 0) !== 0 || (overlay.monthlyDelta ?? 0) !== 0

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Freedom Cost</h1>
        <p className="app-subtitle">Price spending decisions in time until retirement</p>
      </header>

      <main className="app-content">
        <section className="chart-section" data-testid="timeline-chart-section">
          <h2>Timeline</h2>
          <TimelineChart
            baselineResult={baselineResult}
            overlayResult={overlayResult}
          />
        </section>

        <div className="summary-cards">
          <div className="card">
            <span className="card-label">Starting Assets</span>
            <span className="card-value">
              {formatCurrency(inputs.assets - (overlay.oneTimePurchase ?? 0))}
            </span>
            {(overlay.oneTimePurchase ?? 0) > 0 && (
              <span className="card-subtext">
                Base: {formatCurrency(inputs.assets)}
              </span>
            )}
          </div>
          <div className="card">
            <span className="card-label">Target Balance</span>
            <span className="card-value">{formatCurrency(overlayResult.target)}</span>
            {baselineResult.target !== overlayResult.target && (
              <span className="card-subtext">
                Base: {formatCurrency(baselineResult.target)}
              </span>
            )}
          </div>
          <div className={`card primary ${hasActiveOverlay ? 'with-overlay' : ''}`}>
            <span className="card-label">
              {hasActiveOverlay ? 'Retirement Date (Expected)' : 'Retirement Date'}
            </span>
            <span className="card-value" data-testid="retirement-date-value">
              {formatRetireYear(overlayResult.retireYear)}
            </span>
            {hasActiveOverlay && Number.isFinite(baselineResult.retireYear) && (
              <span className="card-subtext" data-testid="baseline-date-subtext">
                Base: {formatRetireYear(baselineResult.retireYear)}
              </span>
            )}
          </div>
          <div className="card honesty-card" data-testid="honesty-range-card">
            <span className="card-label">Return Sensitivity Range</span>
            <span className="card-value" data-testid="honesty-range-value">
              {formatRetireYear(overlayResult.band?.optimistic.retireYear ?? Number.POSITIVE_INFINITY)}{' '}
              –{' '}
              {Number.isFinite(overlayResult.band?.pessimistic.retireYear)
                ? formatRetireYear(overlayResult.band!.pessimistic.retireYear)
                : '∞'}
            </span>
            <span className="card-subtext" data-testid="honesty-range-subtext">
              Pessimistic (
              {((overlayResult.band?.pessimistic.realReturn ?? 0.02) * 100).toFixed(0)}%)
              to Optimistic (
              {((overlayResult.band?.optimistic.realReturn ?? 0.06) * 100).toFixed(0)}%)
            </span>
          </div>
          <SpendingBreakdownCard categories={inputs.spendingBreakdown ?? []} />
        </div>

        <AsymmetrySummary
          baselineResult={baselineResult}
          overlayResult={overlayResult}
          overlay={overlay}
        />

        <section className="levers-section">
          <Levers overlay={overlay} onChange={setOverlay} />
        </section>

        <BaselineForm
          inputs={inputs}
          onChange={handleInputsChange}
          onReset={handleInputsReset}
        />
      </main>
    </div>
  )
}

export default App
