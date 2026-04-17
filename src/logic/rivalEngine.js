import { RIVAL_ORDER, RIVALS } from '../constants/rivals.js'
import { clamp, evaluateRivalStatus, roundTo } from '../lib/gameMath.js'
import { calcAttraction, calcMarketShares } from './marketEngine.js'

const SHARE_DAMAGE_RATIO = 0.06
const WAR_DAMAGE_RATIO = 0.08

export function ensureRivalsJoined(rivals, floor, industryTier) {
  const nextRivals = { ...(rivals ?? {}) }

  RIVAL_ORDER.forEach((rivalId) => {
    const definition = RIVALS[rivalId]
    const current = nextRivals[rivalId]

    if (!current || current.active || current.bankrupt) {
      return
    }

    const byFloor = definition.joinFloor === floor
    const byTier = definition.joinCondition === 'industryTier >= 3' && industryTier >= 3
    if (!byFloor && !byTier) {
      return
    }

    nextRivals[rivalId] = {
      ...current,
      active: true,
      marketShare: roundTo((definition.startingShare ?? 0.16) * 100, 1),
      status: '관망중',
    }
  })

  return nextRivals
}

export function calcRivalShares({
  playerAttraction,
  itemCategory,
  econPhase,
  rivals,
}) {
  const players = [{ id: 'player', attraction: playerAttraction }]
  const activeIds = []

  RIVAL_ORDER.forEach((rivalId) => {
    const rival = rivals?.[rivalId]
    const definition = RIVALS[rivalId]
    if (!rival?.active || rival.bankrupt || rival.eliminated) {
      return
    }
    activeIds.push(rivalId)
    players.push({
      id: rivalId,
      attraction: calcAttraction({
        quality: definition.qualityPower,
        brand: definition.brandPower,
        sellPrice: rival.currentPrice,
        resistance: clamp(0.08 + definition.aggression * 0.04, 0, 0.35),
        category: itemCategory,
        econPhase,
      }),
    })
  })

  const shares = calcMarketShares(players)
  const rivalShares = Object.fromEntries(RIVAL_ORDER.map((rivalId) => [rivalId, 0]))
  activeIds.forEach((rivalId, index) => {
    rivalShares[rivalId] = shares[index + 1] ?? 0
  })

  return {
    myShare: shares[0] ?? 0,
    rivalShares,
  }
}

export function updateRivalsFromSettlement({
  rivals,
  demand,
  rivalShares,
  playerPrice,
}) {
  const nextRivals = { ...(rivals ?? {}) }

  RIVAL_ORDER.forEach((rivalId) => {
    const rival = nextRivals[rivalId]
    const definition = RIVALS[rivalId]

    if (!rival || !rival.active || rival.bankrupt || rival.eliminated) {
      return
    }

    const sharePct = rivalShares[rivalId] ?? 0
    const soldUnits = Math.round(demand * sharePct)
    const revenue = soldUnits * rival.currentPrice
    const unitCostRatio = rivalId === 'nexuscore' ? 0.58 : rivalId === 'megaflex' ? 0.72 : 0.64
    const variableCost = Math.round(soldUnits * rival.currentPrice * unitCostRatio)
    const fixedCost = Math.round(850000 + definition.initialCapital * 0.01)
    const capital = Math.max(rival.capital + revenue - variableCost - fixedCost, 0)
    const bankrupt = capital <= 0

    nextRivals[rivalId] = {
      ...rival,
      currentPrice: Math.round(
        clamp(
          rivalId === 'megaflex'
            ? playerPrice - 3000
            : rivalId === 'aura'
              ? playerPrice + 12000
              : rivalId === 'memecatch'
                ? (rival.currentPrice + playerPrice) / 2 + 2500
                : playerPrice + 16000,
          30000,
          190000,
        ),
      ),
      marketShare: roundTo(sharePct * 100, 1),
      capital,
      bankrupt,
      eliminated: bankrupt,
      status: bankrupt
        ? '퇴출'
        : evaluateRivalStatus({
            rivalState: { ...rival, capital, marketShare: sharePct * 100 },
            initialCapital: definition.initialCapital,
          }),
    }
  })

  return nextRivals
}

export function applyRivalHealthDamage({
  rivals,
  myShare,
  myProfit,
  companyHealth,
  activeWar,
}) {
  let nextHealth = companyHealth
  const nextRivals = { ...(rivals ?? {}) }

  const relevantIds = activeWar?.rivalIds?.length
    ? activeWar.rivalIds
    : RIVAL_ORDER.filter((rivalId) => nextRivals[rivalId]?.active && !nextRivals[rivalId]?.bankrupt)

  relevantIds.forEach((rivalId) => {
    const rival = nextRivals[rivalId]
    if (!rival?.active || rival.bankrupt) {
      return
    }

    const rivalShare = (rival.marketShare ?? 0) / 100
    let rivalDamage = 0
    let myDamage = 0

    if (myShare > rivalShare) {
      rivalDamage += 1
    } else {
      myDamage += 1
    }

    const rivalProfitPositive = rival.capital / Math.max(rival.initialCapital, 1) > 0.5
    if (myProfit >= 0 && !rivalProfitPositive) {
      rivalDamage += 2
    } else if (myProfit < 0 && !rivalProfitPositive) {
      rivalDamage += 1
      myDamage += 1
    } else if (myProfit < 0 && rivalProfitPositive) {
      myDamage += 2
    }

    nextHealth -= myDamage
    nextRivals[rivalId] = {
      ...rival,
      capital: Math.max(
        0,
        rival.capital - Math.round(rival.initialCapital * WAR_DAMAGE_RATIO * rivalDamage),
      ),
    }

    const ratio = nextRivals[rivalId].capital / Math.max(nextRivals[rivalId].initialCapital, 1)
    if (ratio <= 0.2) {
      nextRivals[rivalId] = {
        ...nextRivals[rivalId],
        bankrupt: true,
        eliminated: true,
        active: false,
        marketShare: 0,
        status: '퇴출',
      }
    }
  })

  return {
    rivals: nextRivals,
    companyHealth: Math.max(0, nextHealth),
  }
}

export function applyShareDamage(rivals, myShare) {
  const nextRivals = { ...(rivals ?? {}) }

  RIVAL_ORDER.forEach((rivalId) => {
    const rival = nextRivals[rivalId]
    if (!rival?.active || rival.bankrupt) {
      return
    }

    if (myShare > (rival.marketShare ?? 0) / 100) {
      nextRivals[rivalId] = {
        ...rival,
        capital: Math.max(
          0,
          rival.capital - Math.round(rival.initialCapital * SHARE_DAMAGE_RATIO),
        ),
      }
    }
  })

  return nextRivals
}
