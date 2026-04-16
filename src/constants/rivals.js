export const RIVAL_ORDER = ['megaflex', 'aura', 'memecatch', 'nexuscore']

export const RIVALS = {
  megaflex: {
    id: 'megaflex',
    name: '메가플렉스',
    icon: '▣',
    archetype: '덤핑 공세',
    color: '#FF8A65',
    initialCapital: 420000000,
    basePrice: 69000,
    startingShare: 23,
    brandPower: 84,
    qualityPower: 82,
    aggression: 1.35,
    volatility: 0.9,
    cadenceOffset: 0,
    undercutCap: 4.4,
    summary: '가격을 가장 먼저 흔들어 전체 시장의 마진을 깎는 라이벌.',
  },
  aura: {
    id: 'aura',
    name: '아우라',
    icon: '✦',
    archetype: '프리미엄 장악',
    color: '#F6C453',
    initialCapital: 360000000,
    basePrice: 108000,
    startingShare: 18,
    brandPower: 128,
    qualityPower: 106,
    aggression: 0.88,
    volatility: 0.45,
    cadenceOffset: 1,
    undercutCap: 2.1,
    summary: '가격보다 이미지와 카테고리 지배력을 앞세우는 브랜드형 경쟁사.',
  },
  memecatch: {
    id: 'memecatch',
    name: '밈캐치',
    icon: '✳',
    archetype: '바이럴 점령',
    color: '#7FE6C5',
    initialCapital: 330000000,
    basePrice: 84000,
    startingShare: 16,
    brandPower: 96,
    qualityPower: 88,
    aggression: 1.08,
    volatility: 0.8,
    cadenceOffset: 2,
    undercutCap: 3.2,
    summary: '짧은 시간에 여론을 장악해 점유율을 급격히 흔드는 버즈형 경쟁사.',
  },
  nexuscore: {
    id: 'nexuscore',
    name: '넥서스코어',
    icon: '⬢',
    archetype: '기술 장벽',
    color: '#8AB4FF',
    initialCapital: 440000000,
    basePrice: 132000,
    startingShare: 21,
    brandPower: 112,
    qualityPower: 132,
    aggression: 0.76,
    volatility: 0.35,
    cadenceOffset: 3,
    undercutCap: 1.8,
    summary: 'R&D와 특허 장벽으로 고급 고객을 잠가두는 기술 우위형 경쟁사.',
  },
}

export function createInitialRivals() {
  return RIVAL_ORDER.reduce((rivalState, rivalId) => {
    const rival = RIVALS[rivalId]

    rivalState[rivalId] = {
      id: rival.id,
      capital: rival.initialCapital,
      initialCapital: rival.initialCapital,
      currentPrice: rival.basePrice,
      marketShare: rival.startingShare,
      status: '관망중',
      active: true,
      eliminated: false,
    }

    return rivalState
  }, {})
}

export function getRivalDefinition(rivalId) {
  return RIVALS[rivalId] ?? RIVALS.megaflex
}
