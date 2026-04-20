export const RIVAL_TIERS = {
  1: {
    tier: 1,
    name: '1단계 (반바지 꼬마급)',
    strategy: 'value_only',
    strategyLabel: '가성비',
    priceAggressiveness: 0.85,
    brandInvestment: 0,
    qualityInvestment: 0,
    description: '가성비 위주. 브랜드와 품질 투자 없음.',
  },
  2: {
    tier: 2,
    name: '2단계 (수준급 트레이너)',
    strategy: 'single_focus',
    strategyLabel: '단일 특화',
    priceAggressiveness: 1,
    brandInvestment: 0.5,
    qualityInvestment: 0.5,
    description: '브랜드 또는 품질 한 가지에 집중합니다.',
  },
  3: {
    tier: 3,
    name: '3단계 (4천왕급)',
    strategy: 'dual_focus',
    strategyLabel: '복합 전략',
    priceAggressiveness: 1,
    brandInvestment: 0.8,
    qualityInvestment: 0.8,
    description: '가성비와 브랜드, 또는 브랜드와 품질을 함께 가져갑니다.',
  },
  4: {
    tier: 4,
    name: '4단계 (챔피언급)',
    strategy: 'all_rounder',
    strategyLabel: '전방위 공세',
    priceAggressiveness: 1,
    brandInvestment: 1,
    qualityInvestment: 1,
    description: '가성비, 브랜드, 품질을 모두 구사합니다.',
  },
}

export const RIVAL_SPAWN_RULES = {
  1: { tier: 1, count: 1 },
  10: { tier: 2, count: 1 },
  30: { tier: 3, count: 1 },
  60: { tier: 4, count: 1 },
}

export const RIVAL_NAME_POOL = {
  1: ['반바지마트', '꼬마상회', '오성스토어', '미니플렉스', '소소마켓'],
  2: ['트레이더스', '미드마트', '실력파상사', '중견브랜드', '스탠다드코'],
  3: ['천왕기업', '엘리트코퍼', '파워브랜드', '퀄리티킹', '마스터플렉스'],
  4: ['챔피언코퍼', '울티마그룹', '서버린마켓', '토탈브랜드', '에이스코퍼'],
}

export const RIVAL_ORDER = ['rival-1', 'rival-2', 'rival-3', 'rival-4']

const RIVAL_BASE_STATS = {
  1: { capital: 20000000, qualityScore: 28, brandValue: 10, sellPrice: 42000 },
  2: { capital: 36000000, qualityScore: 52, brandValue: 52, sellPrice: 62000 },
  3: { capital: 58000000, qualityScore: 76, brandValue: 70, sellPrice: 76000 },
  4: { capital: 92000000, qualityScore: 92, brandValue: 92, sellPrice: 92000 },
}

function pickTierFocus(tier) {
  if (tier === 2) {
    return Math.random() < 0.5 ? 'brand' : 'quality'
  }

  if (tier === 3) {
    return Math.random() < 0.5 ? 'value_brand' : 'brand_quality'
  }

  if (tier === 4) {
    return 'all_rounder'
  }

  return 'value_only'
}

function getFocusLabel(focus) {
  if (focus === 'brand') return '브랜드'
  if (focus === 'quality') return '품질'
  if (focus === 'value_brand') return '가성비+브랜드'
  if (focus === 'brand_quality') return '브랜드+품질'
  if (focus === 'all_rounder') return '복합'
  return '가성비'
}

function getRivalName(tier, nameIndex = 0) {
  const names = RIVAL_NAME_POOL[tier] ?? []
  if (!names.length) {
    return `라이벌 ${tier}`
  }

  return names[nameIndex % names.length]
}

function getTierPrice(tier, focus) {
  const base = RIVAL_BASE_STATS[tier]?.sellPrice ?? 52000
  if (focus === 'brand') return Math.round(base * 1.08)
  if (focus === 'quality') return Math.round(base * 1.1)
  if (focus === 'value_brand') return Math.round(base * 0.96)
  if (focus === 'brand_quality') return Math.round(base * 1.12)
  if (focus === 'all_rounder') return Math.round(base * 1.16)
  return base
}

function getTierBrandValue(tier, focus) {
  const base = RIVAL_BASE_STATS[tier]?.brandValue ?? 20
  if (focus === 'brand') return base + 20
  if (focus === 'quality') return base - 12
  if (focus === 'value_brand') return base + 12
  if (focus === 'brand_quality') return base + 18
  if (focus === 'all_rounder') return base + 24
  return base
}

function getTierQualityScore(tier, focus) {
  const base = RIVAL_BASE_STATS[tier]?.qualityScore ?? 20
  if (focus === 'brand') return base - 10
  if (focus === 'quality') return base + 22
  if (focus === 'value_brand') return base + 4
  if (focus === 'brand_quality') return base + 18
  if (focus === 'all_rounder') return base + 20
  return base
}

export function createRivalState({ id, tier, joinFloor, active = false, nameIndex = 0 }) {
  const focus = pickTierFocus(tier)
  const base = RIVAL_BASE_STATS[tier]

  return {
    id,
    tier,
    joinFloor,
    name: getRivalName(tier, nameIndex),
    nameIndex,
    focus,
    strategy: focus,
    strategyLabel: getFocusLabel(focus),
    initialCapital: base.capital,
    capital: base.capital,
    health: 1,
    marketShare: active ? 18 : 0,
    currentPrice: getTierPrice(tier, focus),
    sellPrice: getTierPrice(tier, focus),
    brandValue: getTierBrandValue(tier, focus),
    qualityScore: getTierQualityScore(tier, focus),
    active,
    bankrupt: false,
    eliminated: false,
  }
}

export function createInitialRivals() {
  const spawns = Object.entries(RIVAL_SPAWN_RULES)
    .map(([floor, config]) => ({ floor: Number(floor), ...config }))
    .sort((left, right) => left.floor - right.floor)

  return spawns.map((spawn, index) =>
    createRivalState({
      id: RIVAL_ORDER[index],
      tier: spawn.tier,
      joinFloor: spawn.floor,
      active: spawn.floor === 1,
    }),
  )
}

export function getRivalTierDefinition(tier) {
  return RIVAL_TIERS[tier] ?? RIVAL_TIERS[1]
}

export const RIVALS = Object.fromEntries(
  RIVAL_ORDER.map((id, index) => {
    const tier = index + 1
    return [
      id,
      {
        id,
        tier,
        name: getRivalName(tier, 0),
        ...RIVAL_TIERS[tier],
      },
    ]
  }),
)
