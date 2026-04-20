import { clamp, roundTo } from '../lib/gameMath.js'
import {
  RIVAL_NAME_POOL,
  RIVAL_ORDER,
  RIVAL_TIERS,
  createRivalState,
} from '../constants/rivals.js'
import { calcAttraction } from './marketEngine.js'

const SHARE_DAMAGE_RATIO = 0.06
const BASE_FIXED_COST = {
  1: 650000,
  2: 950000,
  3: 1450000,
  4: 2100000,
}

function getPriceTarget(rival, playerPrice = 0) {
  if (!playerPrice) {
    return rival.currentPrice
  }

  switch (rival.focus) {
    case 'brand':
      return Math.round(playerPrice * 1.08)
    case 'quality':
      return Math.round(playerPrice * 1.1)
    case 'value_brand':
      return Math.round(playerPrice * 0.94)
    case 'brand_quality':
      return Math.round(playerPrice * 1.12)
    case 'all_rounder':
      return Math.round(playerPrice * 1.16)
    default:
      return Math.round(playerPrice * 0.82)
  }
}

function getRivalCostRatio(rival) {
  switch (rival.focus) {
    case 'quality':
      return 0.68
    case 'brand':
      return 0.6
    case 'brand_quality':
      return 0.72
    case 'all_rounder':
      return 0.75
    default:
      return 0.54
  }
}

export function ensureRivalsJoined(rivals = [], floor) {
  return rivals.map((rival) => {
    if (rival.active || rival.bankrupt || floor < rival.joinFloor) {
      return rival
    }

    return {
      ...rival,
      active: true,
      marketShare: 0,
      eliminated: false,
    }
  })
}

export function getActiveRivals(rivals = []) {
  return rivals.filter((rival) => rival.active && !rival.bankrupt && !rival.eliminated)
}

export function buildRivalPlayers({ econPhase, itemCategory, rivals = [] }) {
  return getActiveRivals(rivals).map((rival) => ({
    id: rival.id,
    name: rival.name,
    tier: rival.tier,
    qualityScore: rival.qualityScore,
    brandValue: rival.brandValue,
    sellPrice: rival.currentPrice,
    attraction: calcAttraction({
      quality: rival.qualityScore,
      brand: rival.brandValue,
      sellPrice: rival.currentPrice,
      resistance: 0.04 + rival.tier * 0.02,
      category: itemCategory,
      econPhase,
    }),
  }))
}

export function updateRivalsFromSettlement({
  rivals = [],
  totalDemand = 0,
  salesByRivalId = {},
  playerPrice = 0,
}) {
  return rivals.map((rival) => {
    if (!rival.active || rival.bankrupt || rival.eliminated) {
      return rival
    }

    const soldUnits = Math.round(salesByRivalId[rival.id] ?? 0)
    const revenue = soldUnits * rival.currentPrice
    const variableCost = Math.round(revenue * getRivalCostRatio(rival))
    const fixedCost = BASE_FIXED_COST[rival.tier] ?? 1000000
    const nextCapital = Math.max(0, rival.capital + revenue - variableCost - fixedCost)
    const ratio = nextCapital / Math.max(rival.initialCapital, 1)
    const bankrupt = nextCapital <= 0
    const nextPrice = clamp(getPriceTarget(rival, playerPrice), 18000, 220000)

    return {
      ...rival,
      currentPrice: nextPrice,
      sellPrice: nextPrice,
      capital: nextCapital,
      marketShare: totalDemand > 0 ? roundTo((soldUnits / totalDemand) * 100, 1) : rival.marketShare,
      health: clamp(ratio, 0, 1),
      bankrupt,
      eliminated: bankrupt,
    }
  })
}

export function applyShareDamage(rivals = [], myShare = 0) {
  return rivals.map((rival) => {
    if (!rival.active || rival.bankrupt || rival.eliminated) {
      return rival
    }

    const rivalShare = (rival.marketShare ?? 0) / 100
    if (myShare <= rivalShare) {
      return rival
    }

    const nextCapital = Math.max(
      0,
      rival.capital - Math.round(rival.initialCapital * SHARE_DAMAGE_RATIO),
    )

    return {
      ...rival,
      capital: nextCapital,
      health: clamp(nextCapital / Math.max(rival.initialCapital, 1), 0, 1),
      bankrupt: nextCapital <= 0,
      eliminated: nextCapital <= 0,
    }
  })
}

export function rotateBankruptRivals(rivals = []) {
  return rivals.map((rival) => {
    if (!rival.bankrupt) {
      return rival
    }

    const pool = RIVAL_NAME_POOL[rival.tier] ?? []
    const nextNameIndex = pool.length > 0 ? (rival.nameIndex + 1) % pool.length : 0

    return createRivalState({
      id: rival.id,
      tier: rival.tier,
      joinFloor: rival.joinFloor,
      active: false,
      nameIndex: nextNameIndex,
    })
  })
}

export function getBiggestRival(rivals = []) {
  return getActiveRivals(rivals)
    .slice()
    .sort((left, right) => (right.marketShare ?? 0) - (left.marketShare ?? 0))[0] ?? null
}

export function getRivalStatusLabel(rival) {
  if (!rival || rival.bankrupt || rival.eliminated) {
    return '퇴출'
  }

  const ratio = rival.capital / Math.max(rival.initialCapital, 1)
  if (ratio >= 0.7 && rival.tier >= 3) return '공세중'
  if (ratio >= 0.45) return '관망중'
  if (ratio >= 0.2) return '위기'
  return '파산'
}

export function getRivalStatusKey(rival) {
  const label = getRivalStatusLabel(rival)
  if (label === '공세중') return 'attack'
  if (label === '관망중') return 'watch'
  if (label === '위기') return 'crisis'
  if (label === '파산') return 'bankrupt'
  return 'out'
}

export function getRivalDisplayRows(rivals = []) {
  return getActiveRivals(rivals)
    .map((rival) => ({
      ...rival,
      tierLabel: RIVAL_TIERS[rival.tier]?.name ?? `${rival.tier}단계`,
    }))
    .sort((left, right) => left.joinFloor - right.joinFloor || left.tier - right.tier)
}

export function getRivalById(rivals = [], rivalId) {
  return rivals.find((rival) => rival.id === rivalId) ?? null
}

export { RIVAL_ORDER }
