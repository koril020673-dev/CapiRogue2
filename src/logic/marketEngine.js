export function calcAttraction({
  quality,
  brand,
  sellPrice,
  resistance,
  category,
  econPhase,
  awarenessBonus = 0,
}) {
  if (!sellPrice || sellPrice <= 0) return 0

  const ECO_WEIGHTS = {
    essential: { boom: 0.9, stable: 1.0, recession: 1.3 },
    normal: { boom: 1.2, stable: 1.0, recession: 0.8 },
    luxury: { boom: 1.8, stable: 1.0, recession: 0.4 },
  }

  const E = (ECO_WEIGHTS[category]?.[econPhase] ?? 1.0) * (1 + awarenessBonus)
  const denom = sellPrice * (1 - Math.min(resistance, 0.99))
  if (denom <= 0) return 0

  return ((quality + brand) * E) / denom
}

export function calcMarketShares(players) {
  const sq = players.map((p) => Math.max(0, p.attraction) ** 2)
  const total = sq.reduce((a, v) => a + v, 0)
  if (total <= 0) return players.map(() => 0)
  return sq.map((s) => s / total)
}
