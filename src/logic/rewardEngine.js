import { getMomentumEffect } from './momentumEngine.js'

const BASE_PROBS = {
  normal: 0.55,
  rare: 0.3,
  epic: 0.12,
  legend: 0.03,
}

const REWARD_POOL = {
  normal: [
    { id: 'n1', icon: '🔬', label: '품질 +2', effectType: 'quality', value: 2, effectText: '품질 점수 +2' },
    { id: 'n2', icon: '📣', label: '브랜드 +3', effectType: 'brand', value: 3, effectText: '브랜드 +3' },
    { id: 'n3', icon: '💊', label: '체력 +1', effectType: 'health', value: 1, effectText: '경영 체력 +1' },
    { id: 'n4', icon: '🔷', label: 'Credit +100C', effectType: 'credit', value: 100, effectText: 'Credit +100C' },
    { id: 'n5', icon: '💰', label: '원가 -5%', effectType: 'costMul', value: 0.05, effectText: '이번 층 원가 -5%' },
  ],
  rare: [
    { id: 'r1', icon: '🔬', label: '품질 +5', effectType: 'quality', value: 5, effectText: '품질 점수 +5' },
    { id: 'r2', icon: '📣', label: '브랜드 +8', effectType: 'brand', value: 8, effectText: '브랜드 +8' },
    { id: 'r3', icon: '💊', label: '체력 +2', effectType: 'health', value: 2, effectText: '경영 체력 +2' },
    { id: 'r4', icon: '🔷', label: 'Credit +300C', effectType: 'credit', value: 300, effectText: 'Credit +300C' },
    { id: 'r5', icon: '🛡️', label: '저항성 +1%', effectType: 'resistance', value: 0.01, effectText: '가격 저항성 +1%' },
  ],
  epic: [
    { id: 'e1', icon: '🔬', label: '품질 +12', effectType: 'quality', value: 12, effectText: '품질 점수 +12' },
    { id: 'e2', icon: '📣', label: '브랜드 +15', effectType: 'brand', value: 15, effectText: '브랜드 +15' },
    { id: 'e3', icon: '💊', label: '체력 +3', effectType: 'health', value: 3, effectText: '경영 체력 +3' },
    { id: 'e4', icon: '🔷', label: 'Credit +500C', effectType: 'credit', value: 500, effectText: 'Credit +500C' },
    { id: 'e5', icon: '🛡️', label: '저항성 +3%', effectType: 'resistance', value: 0.03, effectText: '가격 저항성 +3%' },
    { id: 'e6', icon: '💼', label: '자본 +5%', effectType: 'capitalMul', value: 0.05, effectText: '현재 자본 +5%' },
  ],
  legend: [
    { id: 'l1', icon: '💊', label: '체력 전체 회복', effectType: 'health', value: 10, effectText: '체력을 최대치까지 회복' },
    { id: 'l2', icon: '📣', label: '브랜드 +30', effectType: 'brand', value: 30, effectText: '브랜드 +30' },
    { id: 'l3', icon: '🔬', label: '품질 +25', effectType: 'quality', value: 25, effectText: '품질 점수 +25' },
    { id: 'l4', icon: '🔷', label: 'Credit +800C', effectType: 'credit', value: 800, effectText: 'Credit +800C' },
    { id: 'l5', icon: '🏭', label: '고정비 -10%', effectType: 'fixedCostMul', value: 0.1, effectText: '이번 런 고정비 -10%' },
    { id: 'l6', icon: '💳', label: '이자 -15%', effectType: 'interestMul', value: 0.15, effectText: '이번 런 이자 -15%' },
  ],
}

function drawGrade(momentum = 0) {
  const bonus = Math.max(0, getMomentumEffect(momentum).rewardUpChance)
  const probabilities = {
    normal: Math.max(0, BASE_PROBS.normal - bonus),
    rare: BASE_PROBS.rare,
    epic: BASE_PROBS.epic + bonus * 0.5,
    legend: BASE_PROBS.legend + bonus * 0.5,
  }

  const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0)
  const roll = Math.random() * total
  let cursor = 0

  for (const [grade, probability] of Object.entries(probabilities)) {
    cursor += probability
    if (roll < cursor) {
      return grade
    }
  }

  return 'normal'
}

export function generateRewards(momentum = 0) {
  const results = []
  const usedIds = new Set()

  for (let index = 0; index < 3; index += 1) {
    const grade = drawGrade(momentum)
    const pool = REWARD_POOL[grade].filter((reward) => !usedIds.has(reward.id))
    if (!pool.length) {
      continue
    }

    const picked = pool[Math.floor(Math.random() * pool.length)]
    usedIds.add(picked.id)
    results.push({
      ...picked,
      grade,
    })
  }

  return results
}
