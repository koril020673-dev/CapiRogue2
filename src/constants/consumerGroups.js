export const CONSUMER_GROUPS = {
  quality: {
    id: 'quality',
    label: '품질 소비자',
    criterion: 'quality_score',
    color: '#A78BFA',
  },
  brand: {
    id: 'brand',
    label: '브랜드 소비자',
    criterion: 'brand_value',
    color: '#60A5FA',
  },
  value: {
    id: 'value',
    label: '가성비 소비자',
    criterion: 'value_ratio',
    color: '#4ADE80',
  },
  general: {
    id: 'general',
    label: '일반 소비자',
    criterion: 'attraction',
    color: '#94A3B8',
  },
}

export const CONSUMER_GROUP_ORDER = ['quality', 'brand', 'value', 'general']

export const GROUP_RATIO_BY_PHASE = {
  boom: { quality: 0.3, brand: 0.25, value: 0.15, general: 0.3 },
  growth: { quality: 0.25, brand: 0.25, value: 0.2, general: 0.3 },
  stable: { quality: 0.2, brand: 0.25, value: 0.25, general: 0.3 },
  contraction: { quality: 0.15, brand: 0.2, value: 0.35, general: 0.3 },
  recession: { quality: 0.1, brand: 0.15, value: 0.45, general: 0.3 },
}

export function getConsumerGroupRatios(econPhase = 'stable', multipliers = {}) {
  const base = GROUP_RATIO_BY_PHASE[econPhase] ?? GROUP_RATIO_BY_PHASE.stable
  const weighted = CONSUMER_GROUP_ORDER.reduce((accumulator, key) => {
    const multiplier = multipliers[key] ?? 1
    accumulator[key] = Math.max(0, base[key] * multiplier)
    return accumulator
  }, {})

  const total = Object.values(weighted).reduce((sum, value) => sum + value, 0)
  if (total <= 0) {
    return { ...GROUP_RATIO_BY_PHASE.stable }
  }

  return CONSUMER_GROUP_ORDER.reduce((accumulator, key) => {
    accumulator[key] = weighted[key] / total
    return accumulator
  }, {})
}
