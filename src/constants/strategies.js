export const STRATEGIES = {
  volume: {
    id: 'volume',
    icon: '💰',
    label: '물량 공세',
    desc: '가격을 낮춰 점유율을 뺏는다',
    priceMul: 1.3,
    qualityMode: 'budget',
    vendorMode: 'bulk',
    orderRange: [0.8, 1.5],
  },
  quality: {
    id: 'quality',
    icon: '⭐',
    label: '품질 차별화',
    desc: '프리미엄으로 마진을 극대화한다',
    priceMul: 2,
    qualityMode: 'premium',
    vendorMode: 'quality',
    orderRange: [0.4, 0.9],
  },
  marketing: {
    id: 'marketing',
    icon: '📢',
    label: '마케팅 집중',
    desc: '인지도를 올려 수요를 끌어온다',
    priceMul: 1.5,
    qualityMode: 'standard',
    vendorMode: 'standard',
    awarenessBonus: 0.1,
    orderRange: [0.6, 1.2],
  },
  safe: {
    id: 'safe',
    icon: '🛡️',
    label: '안전 경영',
    desc: '현금을 지키며 버틴다',
    priceMul: 1.4,
    qualityMode: 'standard',
    vendorMode: 'standard',
    orderRange: [0.3, 0.7],
  },
}

export const STRATEGY_ORDER = ['volume', 'quality', 'marketing', 'safe']

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
