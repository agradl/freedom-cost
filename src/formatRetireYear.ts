/** Format years-from-today (may be fractional, month-aligned) for display. */
export function formatRetireYear(retireYear: number): string {
  if (!Number.isFinite(retireYear)) return 'Not Reached'
  if (retireYear === 0) return 'Now'

  const totalMonths = Math.round(retireYear * 12)
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) return `${months}m`
  if (months === 0) return `${years}y`
  return `${years}y ${months}m`
}
