/** ₹8,680 for whole rupees, ₹1,562.40 when there are paise (never ₹1,562.4). */
export function formatRupees(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(n)) return '₹—'
  const paise = Math.round(n * 100) % 100 !== 0
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: paise ? 2 : 0, maximumFractionDigits: 2 })}`
}
