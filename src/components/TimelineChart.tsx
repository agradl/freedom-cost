import { useState } from 'react'
import type { Result } from '../engine/types'
import { formatRetireYear } from '../formatRetireYear'

type TimelineChartProps = {
  result?: Result
  baselineResult?: Result
  overlayResult?: Result
}

function formatCurrencyShort(amount: number): string {
  if (!Number.isFinite(amount)) return 'N/A'
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}k`
  }
  return `$${Math.round(amount)}`
}

function formatCurrencyFull(amount: number): string {
  if (!Number.isFinite(amount)) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function TimelineChart({
  result,
  baselineResult: propBaseline,
  overlayResult,
}: TimelineChartProps) {
  const [showBand, setShowBand] = useState(true)

  const baseline = propBaseline ?? result!
  if (!baseline) return null

  const activeOverlay =
    overlayResult &&
    (overlayResult.series.some(
      (p, i) => p.balance !== baseline.series[i]?.balance,
    ) ||
      overlayResult.target !== baseline.target ||
      overlayResult.retireYear !== baseline.retireYear)
      ? overlayResult
      : null

  const viewBoxWidth = 800
  const viewBoxHeight = 440
  // Bottom must clear stacked retire labels (overlay rect ends at getY(0) + 76).
  const margin = { top: 50, right: 50, bottom: 85, left: 80 }
  const plotWidth = viewBoxWidth - margin.left - margin.right
  const plotHeight = viewBoxHeight - margin.top - margin.bottom

  const baselineMaxYearSeries =
    baseline.series.length > 0 ? baseline.series[baseline.series.length - 1]!.year : 30
  const overlayMaxYearSeries =
    activeOverlay && activeOverlay.series.length > 0
      ? activeOverlay.series[activeOverlay.series.length - 1]!.year
      : 0

  const maxYear = Math.max(
    1,
    Number.isFinite(baseline.retireYear) ? baseline.retireYear : baselineMaxYearSeries,
    baselineMaxYearSeries,
    activeOverlay && Number.isFinite(activeOverlay.retireYear) ? activeOverlay.retireYear : 0,
    overlayMaxYearSeries,
  )

  const baselineMaxBal = Math.max(0, ...baseline.series.map((s) => s.balance))
  const overlayMaxBal = activeOverlay
    ? Math.max(0, ...activeOverlay.series.map((s) => s.balance))
    : 0

  const validBaselineTarget = Number.isFinite(baseline.target) ? baseline.target : baselineMaxBal
  const validOverlayTarget = activeOverlay && Number.isFinite(activeOverlay.target)
    ? activeOverlay.target
    : 0

  const maxY = Math.max(
    100_000,
    validBaselineTarget * 1.15,
    validOverlayTarget * 1.15,
    baselineMaxBal * 1.05,
    overlayMaxBal * 1.05,
  )

  const getX = (year: number) => margin.left + (year / maxYear) * plotWidth
  const getY = (balance: number) =>
    margin.top + plotHeight - (Math.max(0, balance) / maxY) * plotHeight

  const baselinePoints = baseline.series.map(
    (point) => `${getX(point.year)},${getY(point.balance)}`,
  )
  const baselineLinePath = baselinePoints.length > 0 ? `M ${baselinePoints.join(' L ')}` : ''

  const baselineAreaPath =
    baselinePoints.length > 0
      ? `M ${getX(baseline.series[0]!.year)},${getY(0)} L ${baselinePoints.join(
          ' L ',
        )} L ${getX(baseline.series[baseline.series.length - 1]!.year)},${getY(0)} Z`
      : ''

  let overlayLinePath = ''
  if (activeOverlay) {
    const overlayPoints = activeOverlay.series.map(
      (point) => `${getX(point.year)},${getY(point.balance)}`,
    )
    if (overlayPoints.length > 0) {
      overlayLinePath = `M ${overlayPoints.join(' L ')}`
    }
  }

  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY]

  const xTickInterval = Math.max(1, Math.ceil(maxYear / 6))
  const xTicks: number[] = []
  for (let y = 0; y <= maxYear; y += xTickInterval) {
    xTicks.push(y)
  }

  const isBaselineFiniteRetire = Number.isFinite(baseline.retireYear)
  const baselineRetireX = isBaselineFiniteRetire ? getX(baseline.retireYear) : null
  const baselineTargetY = Number.isFinite(baseline.target) ? getY(baseline.target) : null

  const isOverlayFiniteRetire = activeOverlay && Number.isFinite(activeOverlay.retireYear)
  const overlayRetireX = isOverlayFiniteRetire && activeOverlay ? getX(activeOverlay.retireYear) : null
  const overlayTargetY = activeOverlay && Number.isFinite(activeOverlay.target) ? getY(activeOverlay.target) : null

  const targetResultForBand = activeOverlay ?? baseline
  const bandData = targetResultForBand?.band

  let bandAreaPath = ''
  let pessLinePath = ''
  let optLinePath = ''

  if (showBand && bandData) {
    const optSeries = bandData.optimistic.series
    const pessSeries = bandData.pessimistic.series

    const optPts = optSeries.map((p) => `${getX(p.year)},${getY(p.balance)}`)
    const pessPts = pessSeries.map((p) => `${getX(p.year)},${getY(p.balance)}`)

    if (optPts.length > 0 && pessPts.length > 0) {
      optLinePath = `M ${optPts.join(' L ')}`
      pessLinePath = `M ${pessPts.join(' L ')}`

      const reversedPessPts = [...pessPts].reverse()
      bandAreaPath = `M ${optPts.join(' L ')} L ${reversedPessPts.join(' L ')} Z`
    }
  }

  return (
    <div className="timeline-chart-container" data-testid="timeline-chart">
      <div className="chart-controls" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
        <label className="checkbox-label" data-testid="toggle-band-label">
          <input
            type="checkbox"
            checked={showBand}
            onChange={(e) => setShowBand(e.target.checked)}
            data-testid="toggle-band-btn"
          />
          <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>
            Show Return Band ({((bandData?.pessimistic.realReturn ?? 0.02) * 100).toFixed(0)}% – {((bandData?.optimistic.realReturn ?? 0.06) * 100).toFixed(0)}%)
          </span>
        </label>
      </div>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="timeline-chart-svg"
        aria-label="Retirement savings timeline chart"
      >
        <defs>
          <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Legend */}
        {activeOverlay && (
          <g className="chart-legend" transform={`translate(${margin.left}, 20)`} data-testid="chart-legend">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#2563eb" strokeWidth="3" />
            <text x="26" y="4" fontSize="12" fill="#475569" fontWeight="500">
              Baseline
            </text>

            <line
              x1="110"
              y1="0"
              x2="130"
              y2="0"
              stroke="#d97706"
              strokeWidth="3"
              strokeDasharray="6 3"
            />
            <text x="136" y="4" fontSize="12" fill="#475569" fontWeight="500">
              With Overlays
            </text>
          </g>
        )}

        {/* Grid lines */}
        {yTicks.map((tickVal) => {
          const y = getY(tickVal)
          return (
            <g key={`y-${tickVal}`} className="grid-group">
              <line
                x1={margin.left}
                y1={y}
                x2={viewBoxWidth - margin.right}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="2 2"
              />
              <text
                x={margin.left - 10}
                y={y + 4}
                textAnchor="end"
                className="axis-label"
                fill="#64748b"
                fontSize="12"
              >
                {formatCurrencyShort(tickVal)}
              </text>
            </g>
          )
        })}

        {/* Target marker - baseline */}
        {baselineTargetY !== null && (
          <g className="target-marker-group" data-testid="target-marker">
            <line
              x1={margin.left}
              y1={baselineTargetY}
              x2={viewBoxWidth - margin.right}
              y2={baselineTargetY}
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text
              x={viewBoxWidth - margin.right}
              y={baselineTargetY - 8}
              textAnchor="end"
              fill="#dc2626"
              fontSize="12"
              fontWeight="600"
            >
              Target: {formatCurrencyFull(baseline.target)}
            </text>
          </g>
        )}

        {/* Target marker - overlay if target changed */}
        {overlayTargetY !== null && activeOverlay && baseline.target !== activeOverlay.target && (
          <g className="overlay-target-marker-group" data-testid="overlay-target-marker">
            <line
              x1={margin.left}
              y1={overlayTargetY}
              x2={viewBoxWidth - margin.right}
              y2={overlayTargetY}
              stroke="#d97706"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text
              x={viewBoxWidth - margin.right}
              y={overlayTargetY + 16}
              textAnchor="end"
              fill="#d97706"
              fontSize="12"
              fontWeight="600"
            >
              New Target: {formatCurrencyFull(activeOverlay.target)}
            </text>
          </g>
        )}

        {/* Honesty Return Band */}
        {bandAreaPath && (
          <path
            d={bandAreaPath}
            fill="#94a3b8"
            fillOpacity="0.15"
            data-testid="honesty-band-path"
          />
        )}
        {optLinePath && (
          <path
            d={optLinePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeOpacity="0.5"
            data-testid="opt-band-line"
          />
        )}
        {pessLinePath && (
          <path
            d={pessLinePath}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeOpacity="0.5"
            data-testid="pess-band-line"
          />
        )}

        {/* Baseline Area & Line */}
        {baselineAreaPath && <path d={baselineAreaPath} fill="url(#baselineGradient)" />}
        {baselineLinePath && (
          <path
            d={baselineLinePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            data-testid="baseline-series-path"
          />
        )}

        {/* Overlay Line */}
        {overlayLinePath && (
          <path
            d={overlayLinePath}
            fill="none"
            stroke="#d97706"
            strokeWidth="3"
            strokeDasharray="6 3"
            data-testid="overlay-series-path"
          />
        )}

        {/* Spine */}
        <line
          x1={margin.left}
          y1={getY(0)}
          x2={viewBoxWidth - margin.right}
          y2={getY(0)}
          stroke="#334155"
          strokeWidth="2"
          className="chart-spine"
          data-testid="chart-spine"
        />

        {/* X Ticks */}
        {xTicks.map((yearVal) => {
          const x = getX(yearVal)
          const ySpine = getY(0)
          return (
            <g key={`x-${yearVal}`} className="x-tick-group">
              <line
                x1={x}
                y1={ySpine}
                x2={x}
                y2={ySpine + 6}
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={x}
                y={ySpine + 20}
                textAnchor="middle"
                fill="#64748b"
                fontSize="12"
              >
                Yr {yearVal}
              </text>
            </g>
          )
        })}

        {/* Baseline Retire Label */}
        {baselineRetireX !== null && baselineTargetY !== null && (
          <g className="spine-retire-group" data-testid="spine-retire-label">
            <line
              x1={baselineRetireX}
              y1={baselineTargetY}
              x2={baselineRetireX}
              y2={getY(0)}
              stroke="#2563eb"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle
              cx={baselineRetireX}
              cy={baselineTargetY}
              r="5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect
              x={baselineRetireX - 45}
              y={getY(0) + 30}
              width="90"
              height="22"
              rx="4"
              fill="#2563eb"
            />
            <text
              x={baselineRetireX}
              y={getY(0) + 45}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
            >
              Base: {formatRetireYear(baseline.retireYear)}
            </text>
          </g>
        )}

        {/* Overlay Retire Label */}
        {activeOverlay && overlayRetireX !== null && (
          <g className="spine-overlay-retire-group" data-testid="overlay-spine-retire-label">
            <line
              x1={overlayRetireX}
              y1={overlayTargetY ?? getY(0)}
              x2={overlayRetireX}
              y2={getY(0)}
              stroke="#d97706"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <circle
              cx={overlayRetireX}
              cy={overlayTargetY ?? getY(0)}
              r="5"
              fill="#d97706"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect
              x={overlayRetireX - 45}
              y={getY(0) + 54}
              width="90"
              height="22"
              rx="4"
              fill="#d97706"
            />
            <text
              x={overlayRetireX}
              y={getY(0) + 69}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="11"
              fontWeight="bold"
            >
              Overlay: {formatRetireYear(activeOverlay.retireYear)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
