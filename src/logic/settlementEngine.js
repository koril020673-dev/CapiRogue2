import { VENDOR } from '../constants/strategies.js'

const QUALITY_MUL = {
  budget: 0.8,
  standard: 1,
  premium: 1.5,
}

const FACTORY_DISCOUNT = 0.6

export const MAX_ORDER_MUL = 1.3

export function calcSellPrice(strategy, vendorBase = VENDOR.baseUnitCost) {
  if (!strategy) {
    return vendorBase
  }

  return Math.max(
    10000,
    Math.round(vendorBase * (strategy.effect?.priceMul ?? strategy.sellPriceMul ?? strategy.priceMul ?? 1)),
  )
}

export function getOrderOptions(strategy, demandEstimate) {
  if (!strategy) {
    return {
      conservative: { qty: 0, prepay: 0 },
      standard: { qty: 0, prepay: 0 },
      aggressive: { qty: 0, prepay: 0 },
    }
  }

  const [minMul, maxMul] = strategy.orderRange
  const midMul = (minMul + maxMul) / 2

  const calcPrepay = (qty) => qty * VENDOR.baseUnitCost

  return {
    conservative: {
      qty: Math.round(demandEstimate * minMul),
      prepay: calcPrepay(Math.round(demandEstimate * minMul)),
    },
    standard: {
      qty: Math.round(demandEstimate * midMul),
      prepay: calcPrepay(Math.round(demandEstimate * midMul)),
    },
    aggressive: {
      qty: Math.round(demandEstimate * maxMul),
      prepay: calcPrepay(Math.round(demandEstimate * maxMul)),
    },
  }
}

export function calcSettlement({
  sellPrice,
  orderQty,
  demand,
  actualSold,
  vendorUnitCost,
  qualityMode,
  factoryActive,
  eventCostMul = 1,
  monthlyInterest,
  monthlyRent,
  safetyCost,
  otherFixed,
  rivals = [],
  opCostMultiplier = 1,
}) {
  const qualityMul = QUALITY_MUL[qualityMode] ?? 1
  const discount = factoryActive ? FACTORY_DISCOUNT : 1
  const unitCost = Math.round(vendorUnitCost * qualityMul * discount * eventCostMul)
  const prepayment = unitCost * orderQty
  const waste = Math.max(0, orderQty - actualSold)
  const wasteCost = unitCost * waste
  const revenue = actualSold * sellPrice
  const fixedTotal = Math.round(
    (monthlyInterest + monthlyRent + safetyCost + otherFixed) * opCostMultiplier,
  )
  const netProfit = revenue - prepayment - fixedTotal
  const leftoverDemand = Math.max(0, demand - actualSold)
  const biggestRival = rivals
    .filter((rival) => !rival.bankrupt)
    .slice()
    .sort((left, right) => (right.marketShare ?? 0) - (left.marketShare ?? 0))[0] ?? null

  return {
    unitCost,
    prepayment,
    actualSold,
    waste,
    wasteCost,
    revenue,
    fixedTotal,
    netProfit,
    leftoverDemand,
    biggestRival,
  }
}
