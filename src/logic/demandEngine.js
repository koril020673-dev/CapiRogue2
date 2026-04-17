import { ECO_WEIGHTS } from '../constants/economy.js'

const BASE_DEMAND = 1000

const TIER_RECESSION_MUL = {
  1: 1,
  2: 0.85,
  3: 0.55,
  4: 0.1,
}

export function calcDemand({
  category,
  econPhase,
  industryTier,
  momentumMul = 1,
  blackSwanMul = 1,
  eventMul = 1,
  varianceBonus = 0,
}) {
  const ecoWeight = ECO_WEIGHTS[category]?.[econPhase] ?? 1
  const tierMul =
    econPhase === 'recession'
      ? (TIER_RECESSION_MUL[industryTier] ?? 1)
      : econPhase === 'contraction'
        ? 0.5 + (TIER_RECESSION_MUL[industryTier] ?? 1) * 0.5
        : 1
  const variance = 0.2 + varianceBonus
  const randomFactor = 1 - variance / 2 + Math.random() * variance

  return Math.round(
    BASE_DEMAND *
      ecoWeight *
      tierMul *
      momentumMul *
      blackSwanMul *
      eventMul *
      randomFactor,
  )
}
