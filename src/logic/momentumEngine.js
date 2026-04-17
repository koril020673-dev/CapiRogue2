export const MOMENTUM_EFFECT = {
  5: { demandMul: 0.12, rewardUpChance: 0.1 },
  4: { demandMul: 0.09, rewardUpChance: 0.07 },
  3: { demandMul: 0.06, rewardUpChance: 0.05 },
  2: { demandMul: 0.04, rewardUpChance: 0.03 },
  1: { demandMul: 0.02, rewardUpChance: 0.01 },
  0: { demandMul: 0, rewardUpChance: 0 },
  '-1': { demandMul: -0.02, rewardUpChance: 0 },
  '-2': { demandMul: -0.04, rewardUpChance: 0 },
  '-3': { demandMul: -0.06, rewardUpChance: 0 },
  '-4': { demandMul: -0.09, rewardUpChance: 0 },
  '-5': { demandMul: -0.12, rewardUpChance: 0 },
}

export function updateMomentum(history = [], netProfit = 0) {
  const direction = netProfit >= 0 ? 'up' : 'down'
  const momentumHistory = [...history, direction].slice(-5)
  const rawScore = momentumHistory.reduce(
    (sum, item) => sum + (item === 'up' ? 1 : -1),
    0,
  )
  const momentum = Math.max(-5, Math.min(5, rawScore))

  return {
    momentumHistory,
    momentum,
    profitableStreak:
      direction === 'up'
        ? momentumHistory.join('').match(/up/g)?.length ?? 0
        : 0,
  }
}

export function getMomentumEffect(momentum = 0) {
  return MOMENTUM_EFFECT[momentum] ?? MOMENTUM_EFFECT[0]
}
