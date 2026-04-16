const QUALITY_MUL = {
  budget: 0.8,
  standard: 1.0,
  balanced: 1.0,
  premium: 1.5,
}

const FACTORY_DISCOUNT = 0.6

export function calcSettlement({
  sellPrice,
  orderQty,
  demand,
  myShare,
  vendorUnitCost,
  qualityMode,
  factoryActive,
  monthlyInterest,
  monthlyRent,
  safetyCost,
  otherFixed,
  opCostMultiplier = 1.0,
  shutdownLeft = 0,
}) {
  const qualityMul = QUALITY_MUL[qualityMode] ?? 1.0
  const discount = factoryActive ? FACTORY_DISCOUNT : 1.0
  const unitCost = Math.round(vendorUnitCost * qualityMul * discount)
  const prepayment = unitCost * orderQty

  const demandSold = shutdownLeft > 0 ? 0 : Math.round(demand * myShare)
  const actualSold = Math.min(demandSold, orderQty)
  const waste = orderQty - actualSold
  const wasteCost = unitCost * waste

  const revenue = actualSold * sellPrice
  const fixedTotal = Math.round(
    (monthlyInterest + monthlyRent + safetyCost + otherFixed) * opCostMultiplier,
  )
  const netProfit = revenue - prepayment - fixedTotal

  return {
    unitCost,
    prepayment,
    actualSold,
    waste,
    wasteCost,
    revenue,
    fixedTotal,
    netProfit,
    summary: {
      sold: `${actualSold}개 판매 / 발주 ${orderQty}개 / 수요 ${demand}개`,
      waste: waste > 0 ? `폐기 ${waste}개 (-${wasteCost.toLocaleString()}원)` : null,
      profit:
        netProfit >= 0
          ? `+${netProfit.toLocaleString()}원`
          : `${netProfit.toLocaleString()}원`,
    },
  }
}
