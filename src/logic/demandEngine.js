import { getConsumerGroupRatios } from '../constants/consumerGroups.js'
import { ECO_WEIGHTS } from '../constants/economy.js'

const BASE_DEMAND = 1000

const TIER_RECESSION_MUL = {
  1: 1,
  2: 0.85,
  3: 0.55,
  4: 0.1,
}

function normalizeGroupDemand(totalDemand, ratios) {
  return {
    quality: Math.round(totalDemand * ratios.quality),
    brand: Math.round(totalDemand * ratios.brand),
    value: Math.round(totalDemand * ratios.value),
    general: Math.round(totalDemand * ratios.general),
  }
}

function getGroupShare(players, criterion) {
  const scores = players.map((player) => {
    switch (criterion) {
      case 'quality_score':
        return Math.max(0, player.qualityScore ?? 0)
      case 'brand_value':
        return Math.max(0, player.brandValue ?? 0)
      case 'value_ratio':
        return player.sellPrice > 0
          ? Math.max(0, (player.qualityScore + player.brandValue) / player.sellPrice)
          : 0
      case 'attraction':
      default:
        return Math.max(0, player.attraction ?? 0)
    }
  })

  const squared = scores.map((score) => score ** 2)
  const total = squared.reduce((sum, value) => sum + value, 0)
  if (total <= 0) {
    return players.map(() => 0)
  }

  return squared.map((value) => value / total)
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

export function calcDemandEstimate({
  category,
  econPhase,
  industryTier,
  momentumMul = 1,
  blackSwanMul = 1,
  eventMul = 1,
}) {
  const ecoWeight = ECO_WEIGHTS[category]?.[econPhase] ?? 1
  const tierMul =
    econPhase === 'recession'
      ? (TIER_RECESSION_MUL[industryTier] ?? 1)
      : econPhase === 'contraction'
        ? 0.5 + (TIER_RECESSION_MUL[industryTier] ?? 1) * 0.5
        : 1

  return Math.round(BASE_DEMAND * ecoWeight * tierMul * momentumMul * blackSwanMul * eventMul)
}

export function calcGroupDemandBreakdown({
  econPhase,
  totalDemand,
  players,
  ratioMultipliers = {},
}) {
  const ratios = getConsumerGroupRatios(econPhase, ratioMultipliers)
  const groupDemand = normalizeGroupDemand(totalDemand, ratios)
  const qualityShares = getGroupShare(players, 'quality_score')
  const brandShares = getGroupShare(players, 'brand_value')
  const valueShares = getGroupShare(players, 'value_ratio')
  const generalShares = getGroupShare(players, 'attraction')

  const salesByPlayer = players.map((player, index) => {
    const qualitySold = Math.round(groupDemand.quality * (qualityShares[index] ?? 0))
    const brandSold = Math.round(groupDemand.brand * (brandShares[index] ?? 0))
    const valueSold = Math.round(groupDemand.value * (valueShares[index] ?? 0))
    const generalSold = Math.round(groupDemand.general * (generalShares[index] ?? 0))

    return {
      id: player.id,
      qualitySold,
      brandSold,
      valueSold,
      generalSold,
      totalSold: qualitySold + brandSold + valueSold + generalSold,
    }
  })

  return {
    ratios,
    groupDemand,
    groupShares: {
      quality: qualityShares,
      brand: brandShares,
      value: valueShares,
      general: generalShares,
    },
    salesByPlayer,
  }
}

export function calcGroupDemand({
  econPhase,
  totalDemand,
  players,
  ratioMultipliers = {},
}) {
  const breakdown = calcGroupDemandBreakdown({
    econPhase,
    totalDemand,
    players,
    ratioMultipliers,
  })
  const playerSales = breakdown.salesByPlayer[0] ?? {
    qualitySold: 0,
    brandSold: 0,
    valueSold: 0,
    generalSold: 0,
    totalSold: 0,
  }

  return {
    qualitySold: playerSales.qualitySold,
    brandSold: playerSales.brandSold,
    valueSold: playerSales.valueSold,
    generalSold: playerSales.generalSold,
    totalSold: playerSales.totalSold,
    groupDemand: breakdown.groupDemand,
    groupShares: {
      quality: breakdown.groupShares.quality[0] ?? 0,
      brand: breakdown.groupShares.brand[0] ?? 0,
      value: breakdown.groupShares.value[0] ?? 0,
      general: breakdown.groupShares.general[0] ?? 0,
    },
    ratios: breakdown.ratios,
  }
}
