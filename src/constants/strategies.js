export const STRATEGIES = {
  quality: {
    id: 'quality',
    label: '품질 확보',
    icon: '🔬',
    desc: '품질을 높여 퀄리티 소비자를 확보한다',
    qualityMode: 'premium',
    vendorMode: 'quality',
    priceMul: 1.75,
    sellPriceMul: 1.75,
    effect: {
      qualityBonus: { min: 1, max: 5 },
      capitalCost: 3000000,
      orderCapMul: 0.8,
      brandPenalty: { min: 1, max: 2 },
    },
    orderRange: [0.4, 0.8],
  },
  branding: {
    id: 'branding',
    label: '브랜딩',
    icon: '📣',
    desc: '브랜드를 높여 브랜드 소비자를 확보한다',
    qualityMode: 'standard',
    vendorMode: 'standard',
    priceMul: 1.4,
    sellPriceMul: 1.4,
    effect: {
      brandBonus: { min: 5, max: 10 },
      capitalCost: 5000000,
      bepIncrease: 0.1,
      qualityPenalty: 0,
    },
    orderRange: [0.6, 1.0],
  },
  dumping: {
    id: 'dumping',
    label: '박리다매',
    icon: '💰',
    desc: '낮은 가격으로 남는 수요를 가져온다',
    qualityMode: 'budget',
    vendorMode: 'bulk',
    priceMul: 0.75,
    sellPriceMul: 0.75,
    effect: {
      brandPenalty: { min: 1, max: 5 },
      qualityPenalty: { min: 2, max: 3 },
      priceMul: 0.75,
      valueDemandBonus: 0.2,
    },
    orderRange: [1.2, 1.8],
  },
  safe: {
    id: 'safe',
    label: '안전 경영',
    icon: '🛡️',
    desc: '현재 품질과 브랜드를 유지하며 버틴다',
    qualityMode: 'standard',
    vendorMode: 'standard',
    priceMul: 1.12,
    sellPriceMul: 1.12,
    effect: {
      brandPenalty: 0,
      qualityPenalty: 0,
      capitalCost: 0,
      stabilityBonus: true,
    },
    orderRange: [0.3, 0.7],
  },
}

export const STRATEGY_ORDER = ['quality', 'branding', 'dumping', 'safe']

export const ORDER_TIERS = {
  conservative: {
    id: 'conservative',
    label: '보수적',
    index: 0,
  },
  standard: {
    id: 'standard',
    label: '기본',
    index: 1,
  },
  aggressive: {
    id: 'aggressive',
    label: '공격적',
    index: 2,
  },
}

export const ORDER_TIER_ORDER = ['conservative', 'standard', 'aggressive']

export const VENDOR = {
  name: '기본 공급사',
  baseUnitCost: 30000,
  baseQuality: 60,
}

export const VENDOR_MODE_MUL = {
  standard: { costMul: 1, qualityBonus: 0 },
  bulk: { costMul: 0.85, qualityBonus: -10 },
  quality: { costMul: 1.3, qualityBonus: 20 },
}

export function getStrategyMidpoint(strategyId) {
  const strategy = STRATEGIES[strategyId]
  if (!strategy) {
    return 1
  }

  const [minOrder, maxOrder] = strategy.orderRange
  return (minOrder + maxOrder) / 2
}
