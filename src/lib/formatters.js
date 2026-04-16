export function formatCurrency(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

export function formatSignedCurrency(value) {
  const rounded = Math.round(value ?? 0)
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded.toLocaleString()}원`
}
