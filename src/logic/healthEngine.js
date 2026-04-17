import { clamp } from '../lib/gameMath.js'

export function calcHealthDelta({
  netProfit,
  waste = 0,
  orderQty = 0,
  warLosses = 0,
  blackSwanPenalty = 0,
  eventPenalty = 0,
  profitableStreak = 0,
}) {
  let delta = 0

  if (netProfit < -50000000) {
    delta -= 3
  } else if (netProfit < -20000000) {
    delta -= 2
  } else if (netProfit < 0) {
    delta -= 1
  }

  if (orderQty > 0 && waste / orderQty > 0.5) {
    delta -= 1
  }

  delta -= warLosses
  delta -= blackSwanPenalty
  delta -= eventPenalty

  if (profitableStreak >= 5 && netProfit >= 0) {
    delta += 1
  }

  return delta
}

export function applyHealth(baseHealth, delta, maxHealth = 10) {
  return clamp(baseHealth + delta, 0, maxHealth)
}
