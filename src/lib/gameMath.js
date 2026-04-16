export const QUALITY_MODES = {
  budget: {
    id: 'budget',
    label: '효율형',
    description: '원가를 낮추고 빠르게 회전시키는 운영',
    costDelta: -2.8,
    qualityDelta: -2.4,
    demandDelta: 1.5,
    brandDelta: -1.4,
  },
  balanced: {
    id: 'balanced',
    label: '균형형',
    description: '가성비와 이미지 사이를 무난하게 유지',
    costDelta: 0,
    qualityDelta: 0.8,
    demandDelta: 0.5,
    brandDelta: 0.6,
  },
  premium: {
    id: 'premium',
    label: '고급형',
    description: '품질과 브랜드 우위를 노리는 프리미엄 포지션',
    costDelta: 4.2,
    qualityDelta: 4.8,
    demandDelta: -0.4,
    brandDelta: 2.8,
  },
}

export const QUALITY_MODE_ORDER = ['budget', 'balanced', 'premium']

export const ECONOMY_PHASES = {
  recovery: {
    id: 'recovery',
    label: '회복 국면',
    summary: '수요가 천천히 되살아나는 구간입니다.',
    demandModifier: 1.06,
    pricePressure: 0.4,
    brandWind: 0.8,
  },
  boom: {
    id: 'boom',
    label: '과열 국면',
    summary: '가격을 올려도 비교적 받아주는 강세장입니다.',
    demandModifier: 1.14,
    pricePressure: 1.1,
    brandWind: 1.4,
  },
  steady: {
    id: 'steady',
    label: '안정 국면',
    summary: '공격과 방어의 균형이 중요한 평시 흐름입니다.',
    demandModifier: 1,
    pricePressure: 0,
    brandWind: 0.2,
  },
  slowdown: {
    id: 'slowdown',
    label: '둔화 국면',
    summary: '민감한 소비자들이 가격 차이를 크게 보기 시작합니다.',
    demandModifier: 0.92,
    pricePressure: -0.9,
    brandWind: -0.6,
  },
}

export const ECONOMY_PHASE_ORDER = ['recovery', 'boom', 'steady', 'slowdown']

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function roundTo(value, decimals = 1) {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

export function calculateUnitCost({
  qualityMode,
  factoryCount,
  rdTier,
  advisorId,
  costAdjustment = 0,
}) {
  const qualityProfile = QUALITY_MODES[qualityMode] ?? QUALITY_MODES.balanced
  const scaleBonus = Math.max(factoryCount - 1, 0) * -1.05
  const rdEfficiency = rdTier * -0.65
  const advisorEfficiency = advisorId === 'engineer' ? -1.25 : 0

  return roundTo(
    clamp(
      19.4 +
        qualityProfile.costDelta +
        scaleBonus +
        rdEfficiency +
        advisorEfficiency +
        costAdjustment,
      8.5,
      52,
    ),
    2,
  )
}

export function calculateFixedCosts({ factoryCount, debt, marketingSpend, rdTier }) {
  return roundTo(
    96 + factoryCount * 28 + debt * 0.18 + marketingSpend * 1.25 + rdTier * 12,
    1,
  )
}

export function calculateBreakEvenUnits({ price, unitCost, fixedCosts }) {
  const contributionMargin = price - unitCost

  if (contributionMargin <= 0) {
    return null
  }

  return Math.ceil(fixedCosts / contributionMargin)
}

export function estimateMarketSize({ economyPhase, month }) {
  const phase = ECONOMY_PHASES[economyPhase] ?? ECONOMY_PHASES.steady
  const seasonalCurve = Math.sin(month / 2.4) * 110

  return Math.max(1450, Math.round((2200 + seasonalCurve) * phase.demandModifier))
}

export function getDebtBand({ capital, debt }) {
  const denominator = Math.max(capital + debt, 1)
  const ratio = debt / denominator

  if (ratio >= 0.48) {
    return 'high'
  }

  if (ratio >= 0.24) {
    return 'medium'
  }

  return 'low'
}

export function getFactoryProfile(factoryCount) {
  if (factoryCount >= 2) {
    return 'multi'
  }

  if (factoryCount >= 1) {
    return 'owned'
  }

  return 'none'
}

export function calculatePlayerStrength({
  price,
  qualityMode,
  brandValue,
  qualityScore,
  marketShare,
  marketingSpend,
  economyPhase,
  demandAdjustment,
  advisorId,
}) {
  const phase = ECONOMY_PHASES[economyPhase] ?? ECONOMY_PHASES.steady
  const qualityProfile = QUALITY_MODES[qualityMode] ?? QUALITY_MODES.balanced
  const advisorBoost =
    advisorId === 'hustler'
      ? 12
      : advisorId === 'engineer'
        ? 7
        : advisorId === 'oracle'
          ? 5
          : 4

  const priceScore =
    128 - price * 2.08 * (phase.id === 'slowdown' ? 1.12 : phase.id === 'boom' ? 0.94 : 1)
  const qualityLift = qualityScore * 0.42 + qualityProfile.demandDelta * 6
  const brandLift = brandValue * 0.28 + phase.brandWind * 10
  const shareMomentum = marketShare * 3.1
  const marketingLift = marketingSpend * 1.34
  const demandLift = demandAdjustment * 8

  return roundTo(
    clamp(
      priceScore + qualityLift + brandLift + shareMomentum + marketingLift + demandLift + advisorBoost,
      45,
      360,
    ),
    2,
  )
}

export function calculateRivalPrice({
  rivalDefinition,
  economyPhase,
  playerPrice,
  month,
}) {
  const phase = ECONOMY_PHASES[economyPhase] ?? ECONOMY_PHASES.steady
  const cycleOffset = ((month + rivalDefinition.cadenceOffset) % 4) - 1.5
  const cycleDrift = cycleOffset * rivalDefinition.volatility
  const baseline = rivalDefinition.basePrice + phase.pricePressure
  const undercut = Math.min(
    Math.max(playerPrice - baseline, -4),
    rivalDefinition.undercutCap,
  )

  return roundTo(clamp(baseline - undercut * 0.45 + cycleDrift, 15, 62), 1)
}

export function calculateRivalUnitCost(rivalDefinition) {
  return roundTo(16.4 + rivalDefinition.qualityPower * 0.016, 2)
}

export function calculateRivalStrength({
  rivalDefinition,
  rivalState,
  economyPhase,
  playerPrice,
}) {
  const phase = ECONOMY_PHASES[economyPhase] ?? ECONOMY_PHASES.steady
  const priceScore =
    122 -
    rivalState.currentPrice *
      1.95 *
      (phase.id === 'slowdown' ? 1.12 : phase.id === 'boom' ? 0.96 : 1)
  const positioning =
    rivalDefinition.brandPower * 0.6 + rivalDefinition.qualityPower * 0.52
  const aggression = rivalDefinition.aggression * 12
  const priceEdge = Math.max((playerPrice - rivalState.currentPrice) * 2.2, -10)
  const shareMomentum = (rivalState.marketShare ?? 0) * 2.9

  return roundTo(
    clamp(
      priceScore + positioning + aggression + priceEdge + shareMomentum + phase.brandWind * 4,
      35,
      340,
    ),
    2,
  )
}

export function normalizeShareMap(entries) {
  const total = entries.reduce((sum, [, strength]) => sum + Math.max(strength, 0), 0)

  if (total <= 0) {
    return Object.fromEntries(entries.map(([id]) => [id, 0]))
  }

  return Object.fromEntries(
    entries.map(([id, strength]) => [id, roundTo((Math.max(strength, 0) / total) * 100, 1)]),
  )
}

export function evaluateRivalStatus({ rivalState, initialCapital, playerPrice }) {
  if (rivalState.eliminated || rivalState.capital <= 0) {
    return '퇴출'
  }

  const healthRatio = initialCapital > 0 ? rivalState.capital / initialCapital : 0

  if (healthRatio < 0.26 || rivalState.marketShare < 8) {
    return '위기'
  }

  if (rivalState.currentPrice <= playerPrice - 1.2 || rivalState.marketShare >= 26) {
    return '공세중'
  }

  return '관망중'
}

function weightedPick(weightMap) {
  const entries = Object.entries(weightMap).filter(([, weight]) => weight > 0)
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0)

  if (totalWeight <= 0) {
    return ECONOMY_PHASE_ORDER[0]
  }

  let cursor = Math.random() * totalWeight

  for (const [phaseId, weight] of entries) {
    cursor -= weight

    if (cursor <= 0) {
      return phaseId
    }
  }

  return entries[entries.length - 1][0]
}

export function calculateNextEconomyPhase({ currentPhase, month, playerShare }) {
  const winningBias = playerShare >= 24 ? 0.6 : playerShare <= 12 ? -0.5 : 0

  const transitions = {
    recovery: {
      recovery: 3,
      boom: 2.4 + winningBias,
      steady: 1.8,
      slowdown: 0.6,
    },
    boom: {
      boom: 2.2,
      steady: 2.6,
      slowdown: 1.6,
      recovery: 0.8 + winningBias * 0.3,
    },
    steady: {
      steady: 3,
      recovery: 1.4 + Math.max(winningBias, 0),
      slowdown: 1.9 + Math.abs(Math.min(winningBias, 0)),
      boom: 1.2,
    },
    slowdown: {
      slowdown: 2.8,
      steady: 2.2,
      recovery: 1.5 + Math.max(winningBias, 0),
      boom: 0.5,
    },
  }

  const weightMap = {
    ...(transitions[currentPhase] ?? transitions.steady),
  }

  if (month % 6 === 0) {
    weightMap.slowdown += 0.7
  }

  if (month % 4 === 0) {
    weightMap.recovery += 0.45
  }

  return weightedPick(weightMap)
}
