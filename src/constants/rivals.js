const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

export const RIVAL_ORDER = ['megaflex', 'aura', 'memecatch', 'nexuscore']

export const RIVALS = {
  megaflex: {
    id: 'megaflex',
    name: '메가플렉스',
    archetype: 'Price Crusher',
    color: 'var(--red)',
    startingCapital: 130,
    maxCapital: 130,
    healthLabel: '가격 전쟁 체력',
    defaultPattern: '원가 수준까지 가격을 내리는 덤핑 공세',
    bossCondition: '시장 점유율 25% 이상을 5턴 연속 유지',
    bossTracking: {
      metric: 'marketShare',
      target: 25,
      consecutiveTurns: 5,
      comparator: 'gte',
    },
    encounterRule:
      '보스 기간 동안 당신의 점유율이 매 턴 깎입니다. 판매 저항력이 낮을수록 피해가 커집니다.',
    healthLogic: 'capital-normalized',
  },
  aura: {
    id: 'aura',
    name: '아우라',
    archetype: 'Brand Monarch',
    color: '#d29922',
    startingCapital: 118,
    maxCapital: 118,
    healthLabel: '브랜드 전쟁 체력',
    defaultPattern: '프리미엄 이미지와 서사를 장악하는 고급화 공세',
    bossCondition: '브랜드 가치 150 이상 달성',
    bossTracking: {
      metric: 'brandValue',
      target: 150,
      consecutiveTurns: 1,
      comparator: 'gte',
    },
    encounterRule:
      '보스 기간 동안 브랜드 가치가 매 턴 잠식됩니다. 대응하지 않으면 프리미엄 고객이 이탈합니다.',
    healthLogic: 'capital-normalized',
  },
  memecatch: {
    id: 'memecatch',
    name: '밈캐치',
    archetype: 'Hype Predator',
    color: 'var(--green)',
    startingCapital: 108,
    maxCapital: 108,
    healthLabel: '버즈 전쟁 체력',
    defaultPattern: '바이럴과 밈을 독점해 광고 효율을 잠식',
    bossCondition: '30M 이상 마케팅 집행을 3턴 연속 유지',
    bossTracking: {
      metric: 'marketingSpend',
      target: 30,
      consecutiveTurns: 3,
      comparator: 'gte',
    },
    encounterRule:
      '보스 기간 동안 여론이 흔들려 마케팅 효율이 떨어집니다. 광고 지출을 일정 수준 이상 유지해야 합니다.',
    healthLogic: 'capital-normalized',
  },
  nexuscore: {
    id: 'nexuscore',
    name: '넥서스코어',
    archetype: 'R&D Fortress',
    color: 'var(--blue)',
    startingCapital: 142,
    maxCapital: 142,
    healthLabel: '기술 장벽 체력',
    defaultPattern: '특허 장벽과 품질 격차로 추격을 봉쇄',
    bossCondition: 'R&D Tier 3 해금 + 품질 점수 200 이상',
    bossTracking: {
      metric: 'qualityBreakthrough',
      target: 1,
      consecutiveTurns: 1,
      comparator: 'gte',
    },
    encounterRule:
      '보스 기간 동안 연구 비용과 품질 유지 압박이 커집니다. 기술 Tier와 품질을 동시에 요구합니다.',
    healthLogic: 'capital-normalized',
  },
}

export function calculateRivalHealth(rivalId, capitalValue) {
  const rival = RIVALS[rivalId]

  if (!rival) {
    return 0
  }

  return clamp(capitalValue / rival.maxCapital, 0, 1)
}

export function createInitialRivalCapital() {
  return RIVAL_ORDER.reduce((capitalState, rivalId) => {
    capitalState[rivalId] = RIVALS[rivalId].startingCapital
    return capitalState
  }, {})
}

export function createInitialRivalHealth() {
  return RIVAL_ORDER.reduce((healthState, rivalId) => {
    healthState[rivalId] = calculateRivalHealth(
      rivalId,
      RIVALS[rivalId].startingCapital,
    )
    return healthState
  }, {})
}

export function calculateAllRivalHealth(capitalState) {
  return RIVAL_ORDER.reduce((healthState, rivalId) => {
    healthState[rivalId] = calculateRivalHealth(
      rivalId,
      capitalState?.[rivalId] ?? 0,
    )
    return healthState
  }, {})
}

export function applyRivalCapitalDelta(capitalState, rivalId, delta) {
  const nextCapital = {
    ...capitalState,
    [rivalId]: Math.max((capitalState?.[rivalId] ?? 0) + delta, 0),
  }

  return {
    rivalCapital: nextCapital,
    rivalHealth: calculateAllRivalHealth(nextCapital),
  }
}
