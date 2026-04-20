const QUALITY_MUL = {
  budget: 0.8,
  standard: 1,
  premium: 1.5,
}

const FACTORY_DISCOUNT = 0.6

export function calcSettlement({
  sellPrice,
  orderQty,
  demand,
  actualSold,
  vendorUnitCost,
  qualityMode,
  factoryActive,
  monthlyInterest,
  monthlyRent,
  safetyCost,
  otherFixed,
  rivals = [],
  opCostMultiplier = 1,
}) {
  const qualityMul = QUALITY_MUL[qualityMode] ?? 1
  const discount = factoryActive ? FACTORY_DISCOUNT : 1
  const unitCost = Math.round(vendorUnitCost * qualityMul * discount)
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
