export const SPENDING_PIE_COLORS = [
  '#2563eb',
  '#0d9488',
  '#ca8a04',
  '#dc2626',
  '#7c3aed',
  '#db2777',
  '#059669',
  '#ea580c',
]

type Slice = {
  label: string
  monthly: number
}

type SpendingPieProps = {
  slices: Slice[]
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

export function SpendingPie({ slices }: SpendingPieProps) {
  const positive = slices.filter((s) => s.monthly > 0)
  const total = positive.reduce((sum, s) => sum + s.monthly, 0)
  if (total <= 0) return null

  const size = 120
  const cx = size / 2
  const cy = size / 2
  const r = 52

  let angle = 0
  const paths = positive.map((slice, i) => {
    const sweep = (slice.monthly / total) * 360
    const startAngle = angle
    const endAngle = angle + sweep
    angle = endAngle

    // Full circle: SVG arc of 360° is degenerate; use a circle instead.
    if (positive.length === 1) {
      return (
        <circle
          key={slice.label + i}
          cx={cx}
          cy={cy}
          r={r}
          fill={SPENDING_PIE_COLORS[i % SPENDING_PIE_COLORS.length]}
        />
      )
    }

    return (
      <path
        key={slice.label + i}
        d={describeArc(cx, cy, r, startAngle, endAngle)}
        fill={SPENDING_PIE_COLORS[i % SPENDING_PIE_COLORS.length]}
      >
        <title>
          {slice.label || 'Untitled'}: ${slice.monthly.toLocaleString()}/mo
        </title>
      </path>
    )
  })

  return (
    <svg
      className="spending-pie"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Spending category breakdown"
      data-testid="spending-pie"
    >
      {paths}
    </svg>
  )
}
