const BASE_DEMAND = 1000

const ECO_WEIGHTS = {
  essential: { boom: 0.9, stable: 1.0, recession: 1.3 },
  normal: { boom: 1.2, stable: 1.0, recession: 0.8 },
  luxury: { boom: 1.8, stable: 1.0, recession: 0.4 },
}

const TIER_RECESSION_MUL = {
  1: 1.0,
  2: 0.85,
  3: 0.55,
  4: 0.1,
}

export function calcDemand({
  category,
  econPhase,
  industryTier,
  blackSwanMul = 1,
  eventMul = 1,
}) {
  const ecoWeight = ECO_WEIGHTS[category]?.[econPhase] ?? 1.0
  const tierRecMul =
    econPhase === 'recession' ? (TIER_RECESSION_MUL[industryTier] ?? 1.0) : 1.0
  const randomFactor = 0.9 + Math.random() * 0.2

  return Math.round(
    BASE_DEMAND * ecoWeight * tierRecMul * blackSwanMul * eventMul * randomFactor,
  )
}
