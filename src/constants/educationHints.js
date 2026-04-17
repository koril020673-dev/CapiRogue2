export function getEducationHint(settlement) {
  if (!settlement) {
    return null
  }

  const {
    strategyId,
    econPhase,
    itemCategory,
    waste = 0,
    orderQty = 0,
    netProfit = 0,
  } = settlement

  if (orderQty > 0 && waste / orderQty > 0.4) {
    return '발주량이 수요를 크게 초과하면 재고가 폐기됩니다. 공급 과잉을 조심하세요.'
  }

  if (itemCategory === 'luxury' && (econPhase === 'recession' || econPhase === 'contraction')) {
    return '불황기에 사치재는 수요가 급감합니다. 소득 탄력성이 큰 품목일수록 타격이 큽니다.'
  }

  if (strategyId === 'volume' && econPhase === 'recession') {
    return '불황기 물량 공세는 점유율보다 폐기 리스크가 더 크게 돌아올 수 있습니다.'
  }

  if (strategyId === 'quality' && netProfit > 0) {
    return '품질 차별화는 가격 경쟁을 피하게 해 줍니다. 비가격 경쟁의 전형적인 예입니다.'
  }

  if (netProfit < -20000000) {
    return '큰 적자가 누적되면 신용이 악화되고 차입 비용이 더 빠르게 높아집니다.'
  }

  return null
}
