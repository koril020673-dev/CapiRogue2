export const CREDIT_PRICE_MUL = {
  early: 1,
  mid1: 1.5,
  mid2: 2,
  late1: 2.5,
  late2: 3,
  final: 3.5,
}

export function getFloorCreditMultiplier(floor = 1) {
  if (floor <= 20) return CREDIT_PRICE_MUL.early
  if (floor <= 40) return CREDIT_PRICE_MUL.mid1
  if (floor <= 60) return CREDIT_PRICE_MUL.mid2
  if (floor <= 80) return CREDIT_PRICE_MUL.late1
  if (floor <= 100) return CREDIT_PRICE_MUL.late2
  return CREDIT_PRICE_MUL.final
}

export function getCreditShopPrice(baseCost, floor) {
  return Math.round(baseCost * getFloorCreditMultiplier(floor))
}
