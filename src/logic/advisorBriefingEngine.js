const PHASE_DESC = {
  boom: '호황 국면입니다. 브랜드와 품질 수요가 함께 커지고 있습니다.',
  growth: '성장 국면입니다. 품질 투자 효율이 좋은 시점입니다.',
  stable: '평시 국면입니다. 무리한 확장보다 균형 운영이 유리합니다.',
  contraction: '위축 국면입니다. 가성비 수요가 빠르게 올라오고 있습니다.',
  recession: '불황 국면입니다. 가성비 수요 45% 구간이라 비용 절감이 중요합니다.',
}

const STRATEGY_SHORT = {
  value_only: '박리다매',
  single_focus: '단일 특화',
  dual_focus: '복합 전략',
  all_rounder: '전방위 공세',
  brand: '브랜드 집중',
  quality: '품질 집중',
  value_brand: '가성비+브랜드',
  brand_quality: '브랜드+품질',
}

export function getAdvisorBriefing(advisor, econPhase, rivals = []) {
  const phaseLine = PHASE_DESC[econPhase] ?? '시장 변동성에 대비하세요.'
  const activeRivals = rivals
    .filter((rival) => rival.active && !rival.bankrupt && !rival.eliminated)
    .slice(0, 2)
    .map((rival) => `${rival.name}: ${STRATEGY_SHORT[rival.strategy] ?? rival.strategyLabel ?? '대기'}`)

  const advisorNameMap = {
    analyst: 'Analyst',
    quant: 'Quant',
    strategist: 'Strategist',
    auditor: 'Auditor',
    economist: 'Economist',
    venture: 'Venture',
    arbitrageur: 'Arbitrageur',
    actuary: 'Actuary',
    sovereign: 'Sovereign',
  }

  const advisorPrefix = advisorNameMap[advisor] ?? 'Advisor'
  if (!activeRivals.length) {
    return `${advisorPrefix}: ${phaseLine}`
  }

  return `${advisorPrefix}: ${phaseLine} 상위 경쟁사는 ${activeRivals.join(' / ')} 입니다.`
}
