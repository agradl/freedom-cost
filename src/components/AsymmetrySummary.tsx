import type { Overlay, Result } from '../engine/types'

type AsymmetrySummaryProps = {
  baselineResult: Result
  overlayResult: Result
  overlay: Overlay
}

function formatCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDaysOrYears(days: number): string {
  if (days === 0) return '0 days'
  const absDays = Math.abs(days)
  const years = (absDays / 365).toFixed(1)
  const sign = days > 0 ? '+' : '-'

  if (absDays >= 365) {
    return `${sign}${absDays.toLocaleString()} days (~${years} years)`
  }
  return `${sign}${absDays.toLocaleString()} days`
}

export function AsymmetrySummary({
  baselineResult,
  overlayResult,
  overlay,
}: AsymmetrySummaryProps) {
  const purchase = overlay.oneTimePurchase ?? 0
  const monthlyDelta = overlay.monthlyDelta ?? 0

  const hasOverlay = purchase !== 0 || monthlyDelta !== 0
  if (!hasOverlay) return null

  const daysDeferred = overlayResult.daysDeferred ?? 0
  const isDeferred = daysDeferred > 0
  const isAccelerated = daysDeferred < 0

  return (
    <section className="impact-summary-card" data-testid="impact-summary">
      <div className="impact-header">
        <span
          className={`impact-badge ${
            isDeferred ? 'bad' : isAccelerated ? 'good' : 'neutral'
          }`}
        >
          {isDeferred
            ? 'Timeline Delayed'
            : isAccelerated
            ? 'Timeline Accelerated'
            : 'No Timeline Change'}
        </span>
        <h3 className="impact-title">
          {isDeferred && `${formatDaysOrYears(daysDeferred)} of freedom lost`}
          {isAccelerated && `${formatDaysOrYears(Math.abs(daysDeferred))} of freedom gained`}
          {!isDeferred && !isAccelerated && 'Retirement date unchanged'}
        </h3>
      </div>

      <div className="impact-details-grid">
        {purchase > 0 && (
          <div className="impact-item" data-testid="purchase-impact-item">
            <span className="impact-item-label">One-time purchase sticker price</span>
            <span className="impact-item-value">{formatCurrency(purchase)}</span>
            {overlayResult.purchaseFutureValue && (
              <span className="impact-item-subtext">
                Compounded value at retirement: {formatCurrency(overlayResult.purchaseFutureValue)}
              </span>
            )}
          </div>
        )}

        {monthlyDelta !== 0 && (
          <div className="impact-item" data-testid="monthly-impact-item">
            <span className="impact-item-label">
              Monthly rate change{' '}
              <span
                className={`spending-type-badge ${overlay.permanent ? 'permanent' : 'temporary'}`}
                data-testid="monthly-type-badge"
              >
                {overlay.permanent ? 'Permanent' : 'Temporary'}
              </span>
            </span>
            <span className="impact-item-value">
              {monthlyDelta > 0 ? `+${formatCurrency(monthlyDelta)}/mo` : `-${formatCurrency(Math.abs(monthlyDelta))}/mo`}
            </span>
            <span className="impact-item-subtext">
              Annual impact: {formatCurrency(Math.abs(monthlyDelta * 12))}/year{' '}
              {overlay.permanent ? '(permanent: alters accumulation & target)' : '(pre-retirement accumulation only)'}
            </span>
          </div>
        )}

        {baselineResult.target !== overlayResult.target && (
          <div className="impact-item" data-testid="target-impact-item">
            <span className="impact-item-label">Target retirement balance shift</span>
            <span className="impact-item-value">
              {formatCurrency(baselineResult.target)} → {formatCurrency(overlayResult.target)}
            </span>
          </div>
        )}
      </div>

      {purchase > 0 && monthlyDelta > 0 && (
        <div className="asymmetry-callout" data-testid="asymmetry-callout">
          <strong>Asymmetry in action:</strong> A recurring rate increase of{' '}
          {formatCurrency(monthlyDelta)}/month alters savings rate every year, whereas a single{' '}
          {formatCurrency(purchase)} outlay affects starting balance once.
        </div>
      )}
    </section>
  )
}
