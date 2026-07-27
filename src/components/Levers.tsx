import { useState } from 'react'
import type { Overlay } from '../engine/types'

type LeversProps = {
  overlay: Overlay
  onChange: (overlay: Overlay) => void
}

export function Levers({ overlay, onChange }: LeversProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const purchase = overlay.oneTimePurchase ?? 0
  const monthlyDelta = overlay.monthlyDelta ?? 0
  const permanent = overlay.permanent ?? false

  const handlePurchaseChange = (value: number) => {
    onChange({ ...overlay, oneTimePurchase: Math.max(0, value) })
  }

  const handleMonthlyDeltaChange = (value: number) => {
    onChange({ ...overlay, monthlyDelta: value })
  }

  const handlePermanentChange = (isPermanent: boolean) => {
    onChange({ ...overlay, permanent: isPermanent })
  }

  const handleReset = () => {
    onChange({ oneTimePurchase: 0, monthlyDelta: 0, permanent: false })
  }

  const handleComparePreset = () => {
    onChange({ oneTimePurchase: 500, monthlyDelta: 500, permanent: false })
  }

  const hasOverlay = purchase !== 0 || monthlyDelta !== 0

  return (
    <div
      className={`levers-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
      data-testid="levers-panel"
    >
      <div
        className="mobile-sheet-header"
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="mobile-sheet-toggle"
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }
        }}
      >
        <div className="sheet-handle-bar" />
        <div className="sheet-header-content">
          <span className="sheet-title">⚡ Decision Levers</span>
          <span className="sheet-status">
            {hasOverlay ? 'Active Overlays' : 'Test spending changes'}
          </span>
        </div>
        <span className="sheet-toggle-icon">{isExpanded ? '▼' : '▲'}</span>
      </div>

      <div className="levers-header">
        <h2>Decision Levers</h2>
        {hasOverlay && (
          <button
            type="button"
            className="btn-reset"
            onClick={handleReset}
            data-testid="reset-overlay-btn"
          >
            Reset Overlays
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="levers-content">
          <div className="levers-grid">
            {/* Lever 1: One-time purchase */}
            <div className="lever-card" data-testid="lever-purchase">
              <div className="lever-title">
                <span className="lever-badge purchase">Lever 1</span>
                <h3>One-Time Purchase</h3>
              </div>
              <p className="lever-description">
                A single outlay today reduces starting assets and loses future compounded growth.
              </p>
              <div className="input-group">
                <label htmlFor="purchase-input">Amount ($)</label>
                <input
                  id="purchase-input"
                  type="number"
                  min="0"
                  step="500"
                  value={purchase === 0 ? '' : purchase}
                  placeholder="0"
                  onChange={(e) => handlePurchaseChange(Number(e.target.value) || 0)}
                  data-testid="purchase-input"
                />
              </div>
              <div className="presets">
                <span className="presets-label">Presets:</span>
                {[1_000, 3_000, 10_000, 25_000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={`btn-preset ${purchase === amount ? 'active' : ''}`}
                    onClick={() => handlePurchaseChange(amount)}
                  >
                    +${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Lever 2: Monthly rate delta */}
            <div className="lever-card" data-testid="lever-monthly">
              <div className="lever-title">
                <span className="lever-badge rate">Lever 2</span>
                <h3>Monthly Spending Delta</h3>
                <span
                  className={`spending-tag ${permanent ? 'permanent' : 'temporary'}`}
                  data-testid="spending-type-tag"
                >
                  {permanent ? 'Permanent' : 'Temporary'}
                </span>
              </div>
              <p className="lever-description">
                A recurring change in monthly spending accelerates or delays your timeline every year.
              </p>
              <div className="input-group">
                <label htmlFor="monthly-input">Monthly Change ($/mo)</label>
                <input
                  id="monthly-input"
                  type="number"
                  step="50"
                  value={monthlyDelta === 0 ? '' : monthlyDelta}
                  placeholder="0 (+ spend more, - save more)"
                  onChange={(e) => handleMonthlyDeltaChange(Number(e.target.value) || 0)}
                  data-testid="monthly-input"
                />
              </div>
              <div className="presets">
                <span className="presets-label">Presets:</span>
                {[-500, -200, 200, 500].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    className={`btn-preset ${monthlyDelta === delta ? 'active' : ''}`}
                    onClick={() => handleMonthlyDeltaChange(delta)}
                  >
                    {delta > 0 ? `+$${delta}/mo` : `-$${Math.abs(delta)}/mo`}
                  </button>
                ))}
              </div>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={permanent}
                    onChange={(e) => handlePermanentChange(e.target.checked)}
                    data-testid="permanent-checkbox"
                  />
                  <span>Permanent change (persists into retirement & alters target balance)</span>
                </label>
                <p className="field-hint" style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                  {permanent
                    ? 'Permanent changes shift target retirement balance and alter accumulation speed.'
                    : 'Temporary changes affect working-years accumulation only.'}
                </p>
              </div>
            </div>
          </div>

          <div className="asymmetry-notice">
            <button
              type="button"
              className="btn-asymmetry-preset"
              onClick={handleComparePreset}
              data-testid="compare-asymmetry-btn"
            >
              Compare $500 Splurge vs. $500/mo Recurring
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
