import { getMomentumEffect } from './momentumEngine.js'

const REWARD_GRADE_PROB = {
  normal: 0.55,
  rare: 0.3,
  epic: 0.12,
  legend: 0.03,
}

const CREDIT_BY_RANGE = {
  early: { normal: 100, rare: 200, epic: 400, legend: 800 },
  mid: { normal: 150, rare: 300, epic: 600, legend: 1200 },
  late: { normal: 200, rare: 400, epic: 800, legend: 1600 },
}

const REWARD_POOLS = {
  normal: [
    { id: 'n-credit-100', label: 'Credit +100C', effect: { credits: 100 } },
    { id: 'n-credit-200', label: 'Credit +200C', effect: { credits: 200 } },
    { id: 'n-health-1', label: '체력 +1', effect: { companyHealth: 1 } },
    { id: 'n-brand-3', label: '브랜드 +3', effect: { brandValue: 3 } },
    { id: 'n-quality-2', label: '품질 +2', effect: { qualityScore: 2 } },
    { id: 'n-cost-5', label: '이번 층 원가 -5%', effect: { tempCostMul: -0.05, turnsLeft: 1 } },
  ],
  rare: [
    { id: 'r-credit-300', label: 'Credit +300C', effect: { credits: 300 } },
    { id: 'r-health-2', label: '체력 +2', effect: { companyHealth: 2 } },
    { id: 'r-brand-8', label: '브랜드 +8', effect: { brandValue: 8 } },
    { id: 'r-quality-5', label: '품질 +5', effect: { qualityScore: 5 } },
    { id: 'r-cost-8', label: '다음 3층 원가 -8%', effect: { tempCostMul: -0.08, turnsLeft: 3 } },
    { id: 'r-resist-1', label: '가격저항성 +1%', effect: { priceResistance: 0.01 } },
  ],
  epic: [
    { id: 'e-credit-500', label: 'Credit +500C', effect: { credits: 500 } },
    { id: 'e-health-3', label: '체력 +3', effect: { companyHealth: 3 } },
    { id: 'e-brand-15', label: '브랜드 +15', effect: { brandValue: 15 } },
    { id: 'e-quality-12', label: '품질 +12', effect: { qualityScore: 12 } },
    { id: 'e-cost-12', label: '다음 5층 원가 -12%', effect: { tempCostMul: -0.12, turnsLeft: 5 } },
    { id: 'e-resist-3', label: '가격저항성 +3%', effect: { priceResistance: 0.03 } },
    { id: 'e-capital-5', label: '이번 런 자본 +5%', effect: { capitalMul: 0.05 } },
  ],
  legend: [
    { id: 'l-credit-800', label: 'Credit +800C', effect: { credits: 800 } },
    { id: 'l-full-heal', label: '체력 전체 회복', effect: { fullHeal: true } },
    { id: 'l-brand-30', label: '브랜드 +30', effect: { brandValue: 30 } },
    { id: 'l-quality-25', label: '품질 +25', effect: { qualityScore: 25 } },
    { id: 'l-resist-5', label: '가격저항성 +5%', effect: { priceResistance: 0.05 } },
    { id: 'l-fixed-10', label: '이번 런 고정비 영구 -10%', effect: { fixedCostMul: -0.1 } },
    { id: 'l-rate-15', label: '이번 런 이자 영구 -15%', effect: { interestRateMul: -0.15 } },
  ],
}

function getRangeKey(floor = 1) {
  if (floor <= 40) return 'early'
  if (floor <= 80) return 'mid'
  return 'late'
}

function pickWeightedGrade(momentum = 0) {
  const bonus = getMomentumEffect(momentum).rewardUpChance
  const adjusted = {
    normal: Math.max(0.1, REWARD_GRADE_PROB.normal - bonus * 0.6),
    rare: REWARD_GRADE_PROB.rare,
    epic: REWARD_GRADE_PROB.epic + bonus * 0.5,
    legend: REWARD_GRADE_PROB.legend + bonus * 0.5,
  }
  const total = Object.values(adjusted).reduce((sum, value) => sum + value, 0)
  const roll = Math.random() * total
  let cursor = 0

  for (const [grade, chance] of Object.entries(adjusted)) {
    cursor += chance
    if (roll <= cursor) {
      return grade
    }
  }

  return 'normal'
}

function pickUniqueOptions(pool, count = 3) {
  const nextPool = [...pool]
  const picked = []

  while (picked.length < count && nextPool.length > 0) {
    const index = Math.floor(Math.random() * nextPool.length)
    picked.push(nextPool.splice(index, 1)[0])
  }

  return picked
}

export function createRewardDraft({ floor, momentum = 0 }) {
  const grade = pickWeightedGrade(momentum)
  const rangeKey = getRangeKey(floor)

  return {
    floor,
    grade,
    credits: CREDIT_BY_RANGE[rangeKey][grade],
    options: pickUniqueOptions(REWARD_POOLS[grade], 3),
  }
}
