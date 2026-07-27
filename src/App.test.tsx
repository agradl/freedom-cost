import { render, screen, fireEvent } from '@testing-library/react'
import { App } from './App'
import { TimelineChart } from './components/TimelineChart'
import { compute } from './engine'

describe('Timeline Chart & App Integration', () => {
  test('renders baseline application state', () => {
    render(<App />)

    expect(screen.getByText('Freedom Cost')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument()
    expect(screen.getByTestId('baseline-series-path')).toBeInTheDocument()
    expect(screen.getByTestId('target-marker')).toBeInTheDocument()
    expect(screen.getByTestId('spine-retire-label')).toBeInTheDocument()

    expect(screen.getByTestId('levers-panel')).toBeInTheDocument()
    expect(screen.getByTestId('lever-purchase')).toBeInTheDocument()
    expect(screen.getByTestId('lever-monthly')).toBeInTheDocument()
    expect(screen.queryByTestId('impact-summary')).not.toBeInTheDocument()
  })

  test('updating lever 1 (one-time purchase) updates chart, summary, and shows overlay series', () => {
    render(<App />)

    const purchaseInput = screen.getByTestId('purchase-input')
    fireEvent.change(purchaseInput, { target: { value: '10000' } })

    expect(screen.getByTestId('impact-summary')).toBeInTheDocument()
    expect(screen.getByTestId('purchase-impact-item')).toBeInTheDocument()
    expect(screen.getByText(/Compounded value at retirement/i)).toBeInTheDocument()

    expect(screen.getByTestId('overlay-series-path')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-spine-retire-label')).toBeInTheDocument()
    expect(screen.getByTestId('chart-legend')).toBeInTheDocument()
  })

  test('updating lever 2 (monthly delta) updates chart, summary, and handles permanent toggle', () => {
    render(<App />)

    const monthlyInput = screen.getByTestId('monthly-input')
    fireEvent.change(monthlyInput, { target: { value: '500' } })

    expect(screen.getByTestId('impact-summary')).toBeInTheDocument()
    expect(screen.getByTestId('monthly-impact-item')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-series-path')).toBeInTheDocument()

    // Toggle permanent
    const permanentCheckbox = screen.getByTestId('permanent-checkbox')
    fireEvent.click(permanentCheckbox)

    expect(screen.getByTestId('target-impact-item')).toBeInTheDocument()
    expect(screen.getByTestId('overlay-target-marker')).toBeInTheDocument()
  })

  test('compares $500 splurge vs $500/mo recurring and resets overlays', () => {
    render(<App />)

    const compareBtn = screen.getByTestId('compare-asymmetry-btn')
    fireEvent.click(compareBtn)

    expect(screen.getByTestId('asymmetry-callout')).toBeInTheDocument()
    expect(screen.getByText(/Asymmetry in action/i)).toBeInTheDocument()

    const resetBtn = screen.getByTestId('reset-overlay-btn')
    fireEvent.click(resetBtn)

    expect(screen.queryByTestId('impact-summary')).not.toBeInTheDocument()
    expect(screen.queryByTestId('overlay-series-path')).not.toBeInTheDocument()
  })

  test('renders chart correctly when retirement target is infinite or not reached', () => {
    const unreachableResult = compute({
      assets: 10_000,
      realReturn: 0,
      incomeByYear: [20_000],
      spendingAnnual: 40_000,
      currentAge: 41,
      deathAge: 95,
      ssAge: 65,
      ssMonthly: 4152,
      targetRemainingAssets: 0,
    })

    render(<TimelineChart baselineResult={unreachableResult} />)

    expect(screen.getByTestId('timeline-chart')).toBeInTheDocument()
    expect(screen.getByTestId('baseline-series-path')).toBeInTheDocument()
    expect(screen.queryByTestId('spine-retire-label')).not.toBeInTheDocument()
  })

  test('toggles baseline assumptions form, updates inputs, and persists to localStorage', () => {
    localStorage.clear()
    render(<App />)

    const toggleBtn = screen.getByTestId('toggle-baseline-form-btn')
    expect(screen.queryByTestId('baseline-form-body')).not.toBeInTheDocument()

    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('baseline-form-body')).toBeInTheDocument()

    const assetsInput = screen.getByTestId('assets-input')
    const spendingInput = screen.getByTestId('spending-input')

    fireEvent.change(assetsInput, { target: { value: '800000' } })
    fireEvent.change(spendingInput, { target: { value: '50000' } })

    // Check localStorage was updated
    const saved = JSON.parse(localStorage.getItem('freedom_cost_baseline') || '{}')
    expect(saved.assets).toBe(800000)
    expect(saved.spendingAnnual).toBe(50000)

    // Reset baseline
    const resetBaselineBtn = screen.getByTestId('reset-baseline-btn')
    fireEvent.click(resetBaselineBtn)

    expect(localStorage.getItem('freedom_cost_baseline')).toBeNull()
  })

  test('renders honesty layer return band range and permanent/temporary tags', () => {
    render(<App />)

    expect(screen.getByTestId('honesty-range-card')).toBeInTheDocument()
    expect(screen.getByTestId('honesty-range-value')).toBeInTheDocument()
    expect(screen.getByTestId('honesty-range-subtext')).toBeInTheDocument()

    expect(screen.getByTestId('honesty-band-path')).toBeInTheDocument()
    expect(screen.getByTestId('toggle-band-btn')).toBeInTheDocument()

    const toggleBandBtn = screen.getByTestId('toggle-band-btn')
    fireEvent.click(toggleBandBtn)
    expect(screen.queryByTestId('honesty-band-path')).not.toBeInTheDocument()

    expect(screen.getByTestId('spending-type-tag')).toHaveTextContent('Temporary')

    const monthlyInput = screen.getByTestId('monthly-input')
    fireEvent.change(monthlyInput, { target: { value: '300' } })
    const permanentCheckbox = screen.getByTestId('permanent-checkbox')
    fireEvent.click(permanentCheckbox)

    expect(screen.getByTestId('spending-type-tag')).toHaveTextContent('Permanent')
    expect(screen.getByTestId('monthly-type-badge')).toHaveTextContent('Permanent')
  })

  test('supports mobile layout pass with bottom-sheet levers toggle and timeline chart section priority', () => {
    render(<App />)

    // Verify timeline chart section exists first in app content
    const chartSection = screen.getByTestId('timeline-chart-section')
    expect(chartSection).toBeInTheDocument()

    // Verify mobile sheet toggle collapses and expands levers panel
    const sheetToggle = screen.getByTestId('mobile-sheet-toggle')
    expect(sheetToggle).toBeInTheDocument()
    expect(screen.getByTestId('lever-purchase')).toBeInTheDocument()

    // Click to collapse bottom sheet
    fireEvent.click(sheetToggle)
    expect(screen.queryByTestId('lever-purchase')).not.toBeInTheDocument()

    // Click to expand bottom sheet
    fireEvent.click(sheetToggle)
    expect(screen.getByTestId('lever-purchase')).toBeInTheDocument()

    // Verify baseline form panel is structured as assumptions disclosure
    const baselinePanel = screen.getByTestId('baseline-form-panel')
    expect(baselinePanel).toHaveAttribute('data-disclosure-open', 'false')
    const toggleBaselineBtn = screen.getByTestId('toggle-baseline-form-btn')
    fireEvent.click(toggleBaselineBtn)
    expect(baselinePanel).toHaveAttribute('data-disclosure-open', 'true')
  })
})
