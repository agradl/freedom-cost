import type { SpendingCategory } from '../engine/types'
import { SpendingPie } from './SpendingPie'

type SpendingBreakdownProps = {
  spendingAnnual: number
  categories: SpendingCategory[]
  onChange: (categories: SpendingCategory[] | undefined) => void
  isOpen: boolean
  onToggle: () => void
}

const SUM_TOLERANCE = 0.01

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function newCategoryId(): string {
  return `cat-${crypto.randomUUID()}`
}

export function spendingBreakdownIsValid(
  spendingAnnual: number,
  categories: SpendingCategory[],
): boolean {
  if (categories.length === 0) return true
  const targetMonthly = spendingAnnual / 12
  const sum = categories.reduce((s, c) => s + c.monthly, 0)
  return Math.abs(sum - targetMonthly) < SUM_TOLERANCE
}

export function SpendingBreakdown({
  spendingAnnual,
  categories,
  onChange,
  isOpen,
  onToggle,
}: SpendingBreakdownProps) {
  const targetMonthly = spendingAnnual / 12
  const sum = categories.reduce((s, c) => s + c.monthly, 0)
  const isValid = spendingBreakdownIsValid(spendingAnnual, categories)
  const pieSlices = categories.filter((c) => c.monthly > 0)

  const updateCategories = (next: SpendingCategory[]) => {
    onChange(next.length > 0 ? next : undefined)
  }

  const handleAdd = () => {
    updateCategories([
      ...categories,
      { id: newCategoryId(), label: '', monthly: 0 },
    ])
  }

  const handleRemove = (id: string) => {
    updateCategories(categories.filter((c) => c.id !== id))
  }

  const handleLabelChange = (id: string, label: string) => {
    updateCategories(
      categories.map((c) => (c.id === id ? { ...c, label } : c)),
    )
  }

  const handleMonthlyChange = (id: string, raw: string) => {
    const val = Number.parseFloat(raw)
    const monthly = Number.isNaN(val) ? 0 : Math.max(0, val)
    updateCategories(
      categories.map((c) => (c.id === id ? { ...c, monthly } : c)),
    )
  }

  return (
    <div className="spending-breakdown" data-testid="spending-breakdown">
      <button
        type="button"
        className="spending-breakdown-toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        data-testid="toggle-spending-breakdown-btn"
      >
        <span className="toggle-icon">{isOpen ? '▼' : '►'}</span>
        <span>Spending breakdown</span>
      </button>

      {isOpen && (
        <div
          className="spending-breakdown-body"
          data-testid="spending-breakdown-body"
        >
          <p className="field-hint">
            Optional monthly categories for reference. Total must match annual
            spending ÷ 12. Does not change the timeline math.
          </p>

          <div className="spending-breakdown-layout">
            <div className="spending-breakdown-rows">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="spending-category-row"
                  data-testid="spending-category-row"
                >
                  <input
                    type="text"
                    className="spending-category-label"
                    placeholder="Category"
                    value={cat.label}
                    onChange={(e) => handleLabelChange(cat.id, e.target.value)}
                    aria-label="Category label"
                    data-testid="spending-category-label"
                  />
                  <input
                    type="number"
                    className="spending-category-monthly"
                    min="0"
                    step="50"
                    placeholder="0"
                    value={cat.monthly === 0 ? '' : cat.monthly}
                    onChange={(e) =>
                      handleMonthlyChange(cat.id, e.target.value)
                    }
                    aria-label="Monthly amount"
                    data-testid="spending-category-monthly"
                  />
                  <button
                    type="button"
                    className="spending-category-remove"
                    onClick={() => handleRemove(cat.id)}
                    aria-label="Remove category"
                    data-testid="spending-category-remove"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="secondary-btn"
                onClick={handleAdd}
                data-testid="add-spending-category-btn"
              >
                Add category
              </button>

              {categories.length > 0 && (
                <div
                  className="spending-breakdown-sum"
                  data-testid="spending-breakdown-sum"
                >
                  {formatMoney(sum)} / {formatMoney(targetMonthly)} /mo
                </div>
              )}

              {categories.length > 0 && !isValid && (
                <div
                  className="form-error"
                  data-testid="spending-breakdown-error"
                >
                  Categories must total {formatMoney(targetMonthly)}/mo
                </div>
              )}
            </div>

            {pieSlices.length > 0 && <SpendingPie slices={pieSlices} />}
          </div>
        </div>
      )}
    </div>
  )
}
