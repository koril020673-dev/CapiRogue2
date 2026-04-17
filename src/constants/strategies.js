export const STRATEGIES = {
  volume: {
    id: 'volume',
    label: '💰 물량 공세',
    desc: '가격을 낮춰 점유율을 뺏는다',
    orderMul: 1.5,
    priceMul: 1.3,
    qualityMode: 'budget',
    vendorMode: 'bulk',
  },
  quality: {
    id: 'quality',
    label: '⭐ 품질 차별화',
    desc: '프리미엄으로 마진을 극대화한다',
    orderMul: 0.8,
    priceMul: 2.0,
    qualityMode: 'premium',
    vendorMode: 'quality',
  },
  marketing: {
    id: 'marketing',
    label: '📢 마케팅 집중',
    desc: '인지도를 올려 수요를 끌어온다',
    orderMul: 1.0,
    priceMul: 1.5,
    qualityMode: 'standard',
    vendorMode: 'standard',
    awarenessBonus: 0.1,
  },
  safe: {
    id: 'safe',
    label: '🛡️ 안전 경영',
    desc: '현금을 지키며 버틴다',
    orderMul: 0.6,
    priceMul: 1.4,
    qualityMode: 'standard',
    vendorMode: 'standard',
  },
}

export const STRATEGY_ORDER = ['volume', 'quality', 'marketing', 'safe']

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
