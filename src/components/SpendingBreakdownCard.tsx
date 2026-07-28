import type { SpendingCategory } from '../engine/types'
import { SpendingPie, SPENDING_PIE_COLORS } from './SpendingPie'

type SpendingBreakdownCardProps = {
  categories: SpendingCategory[]
}

export function SpendingBreakdownCard({
  categories,
}: SpendingBreakdownCardProps) {
  const slices = categories.filter((c) => c.monthly > 0)

  return (
    <div
      className="card spending-breakdown-card"
      data-testid="spending-breakdown-card"
    >
      <span className="card-label">Spending Breakdown</span>
      {slices.length > 0 ? (
        <div className="spending-breakdown-card-body">
          <SpendingPie slices={slices} />
          <ul
            className="spending-breakdown-legend"
            data-testid="spending-breakdown-legend"
          >
            {slices.map((slice, i) => (
              <li key={slice.id}>
                <span
                  className="legend-swatch"
                  style={{
                    backgroundColor:
                      SPENDING_PIE_COLORS[i % SPENDING_PIE_COLORS.length],
                  }}
                />
                <span className="legend-label">{slice.label || 'Untitled'}</span>
              </li>
            ))}          </ul>
        </div>
      ) : (
        <span className="card-subtext" data-testid="spending-breakdown-empty">
          Add categories under Baseline Assumptions
        </span>
      )}
    </div>
  )
}
