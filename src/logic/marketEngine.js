import { ECO_WEIGHTS } from '../constants/economy.js'

export function calcAttraction({
  quality,
  brand,
  sellPrice,
  resistance,
  category,
  econPhase,
  awarenessBonus = 0,
}) {
  if (!sellPrice || sellPrice <= 0) {
    return 0
  }

  const ecoWeight = ECO_WEIGHTS[category]?.[econPhase] ?? 1
  const denominator = sellPrice * (1 - Math.min(resistance, 0.99))

  if (denominator <= 0) {
    return 0
  }

  return ((quality + brand) * ecoWeight * (1 + awarenessBonus)) / denominator
}

export function calcMarketShares(players) {
  const squared = players.map((player) => Math.max(0, player.attraction) ** 2)
  const total = squared.reduce((sum, value) => sum + value, 0)

  if (total <= 0) {
    return players.map(() => 0)
  }

  return squared.map((value) => value / total)
}
