export const FLOOR_MILESTONES = {
  10: {
    floor: 10,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'megaflex',
    title: '메가플렉스 가격 급습',
    shortLabel: '10층 경고',
    markerType: 'mid-boss',
    description:
      '메가플렉스가 이번 달 가격을 원가 수준까지 인하하며 유통 채널을 압박합니다.',
    responsePrompt: '가격 공세에 어떻게 대응할지 즉시 선택해야 합니다.',
  },
  20: {
    floor: 20,
    phase: 'boss',
    type: 'boss',
    rivalId: 'megaflex',
    title: '메가플렉스 보스전',
    shortLabel: '20층 보스',
    markerType: 'boss',
    description: '10턴 동안 가격 전쟁 압박을 견디며 시장 점유율을 지켜야 합니다.',
    turnsLeft: 10,
    winCondition: '시장 점유율 25% 이상을 5턴 연속 유지',
    specialRule: '당신의 시장 점유율이 매 턴 감소합니다.',
  },
  30: {
    floor: 30,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'aura',
    title: '아우라 카테고리 잠식',
    shortLabel: '30층 경고',
    markerType: 'mid-boss',
    description:
      '아우라가 프리미엄 포지셔닝을 모방하며 당신의 브랜드 서사를 흔들고 있습니다.',
    responsePrompt: '브랜드 전쟁에 대응할 메시지 전략을 골라야 합니다.',
  },
  40: {
    floor: 40,
    phase: 'boss',
    type: 'boss',
    rivalId: 'aura',
    title: '아우라 보스전',
    shortLabel: '40층 보스',
    markerType: 'boss',
    description: '브랜드 가치 150을 달성해야 프리미엄 카테고리를 되찾을 수 있습니다.',
    turnsLeft: 10,
    winCondition: '브랜드 가치 150 이상 달성',
    specialRule: '보스 기간 동안 브랜드 가치가 매 턴 침식됩니다.',
  },
  50: {
    floor: 50,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'memecatch',
    title: '밈캐치 바이럴 점령',
    shortLabel: '50층 경고',
    markerType: 'mid-boss',
    description:
      '밈캐치가 여론과 숏폼 채널을 장악하며 당신의 광고 효율을 가로채고 있습니다.',
    responsePrompt: '즉흥 대응, 역바이럴, 무시 전략 중 하나를 골라야 합니다.',
  },
  60: {
    floor: 60,
    phase: 'boss',
    type: 'boss',
    rivalId: 'memecatch',
    title: '밈캐치 보스전',
    shortLabel: '60층 보스',
    markerType: 'boss',
    description: '강한 마케팅 집행을 3턴 연속 유지해 버즈 지배권을 되찾아야 합니다.',
    turnsLeft: 10,
    winCondition: '30M 이상 마케팅 집행을 3턴 연속 유지',
    specialRule: '여론이 계속 흔들려 마케팅 효율이 감소합니다.',
  },
  70: {
    floor: 70,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'nexuscore',
    title: '넥서스코어 특허 장벽',
    shortLabel: '70층 경고',
    markerType: 'mid-boss',
    description:
      '넥서스코어가 특허와 공급망 계약으로 기술 추격을 지연시키고 있습니다.',
    responsePrompt: '우회 기술, 공급망 선점, 법무 지연전 중 하나를 선택해야 합니다.',
  },
  80: {
    floor: 80,
    phase: 'boss',
    type: 'boss',
    rivalId: 'nexuscore',
    title: '넥서스코어 보스전',
    shortLabel: '80층 보스',
    markerType: 'boss',
    description: '이제 블랙 스완 구간입니다. 기술 장벽을 넘기 전까지 압박이 계속됩니다.',
    turnsLeft: 10,
    winCondition: 'R&D Tier 3 해금 + 품질 점수 200 이상',
    specialRule: '보스 기간 동안 연구 비용과 품질 유지 압박이 커집니다.',
    unlocksBlackSwan: true,
  },
  90: {
    floor: 90,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'megaflex',
    title: '메가플렉스 패닉 세일',
    shortLabel: '90층 경고',
    markerType: 'mid-boss',
    description:
      '메가플렉스가 유동성 확보를 위해 시장 전체를 흔드는 패닉 세일을 시작했습니다.',
    responsePrompt: '점유율을 방어할지, 마진을 지킬지, 품질로 우회할지 결정해야 합니다.',
  },
  100: {
    floor: 100,
    phase: 'boss',
    type: 'boss',
    rivalId: 'aura',
    title: '아우라 카테고리 왕좌전',
    shortLabel: '100층 보스',
    markerType: 'boss',
    description:
      '최상위 고객층이 아우라 쪽으로 쏠립니다. 브랜드와 시장 리더십을 동시에 증명해야 합니다.',
    turnsLeft: 10,
    winCondition: '브랜드 가치 180 이상 또는 점유율 30% 달성',
    specialRule: '프리미엄 고객 이탈과 언론 노출전이 동시에 진행됩니다.',
  },
  110: {
    floor: 110,
    phase: 'mid-boss',
    type: 'mid-boss',
    rivalId: 'memecatch',
    title: '밈캐치 피날레 버즈',
    shortLabel: '110층 경고',
    markerType: 'mid-boss',
    description:
      '밈캐치가 종반 여론을 휩쓸며 최종 보스 직전의 흐름을 끊으려 합니다.',
    responsePrompt: '최종 보스 직전, 버즈를 끊어낼 한 수가 필요합니다.',
  },
  120: {
    floor: 120,
    phase: 'boss',
    type: 'boss',
    rivalId: 'nexuscore',
    title: '최종 보스: 넥서스코어',
    shortLabel: '120층 최종',
    markerType: 'final-boss',
    description:
      '최종 이사회 층입니다. 기술, 브랜드, 점유율을 동시에 증명해야 클리어할 수 있습니다.',
    turnsLeft: 10,
    winCondition: '점유율 28%+, 브랜드 170+, 품질 220+ 상태 유지 후 클리어',
    specialRule: '최종 층에서는 모든 경쟁 압박이 동시에 적용됩니다.',
  },
}

export const FLOOR_MARKERS = Object.values(FLOOR_MILESTONES)

export function getFloorMilestone(floor) {
  return FLOOR_MILESTONES[floor] ?? null
}

export function getFloorPhase(floor) {
  const milestone = getFloorMilestone(floor)
  return milestone?.phase ?? 'normal'
}

export function createEncounterFromMilestone(floor) {
  const milestone = getFloorMilestone(floor)

  if (!milestone || !milestone.rivalId) {
    return null
  }

  return {
    rivalId: milestone.rivalId,
    type: milestone.type,
    turnsLeft: milestone.type === 'boss' ? milestone.turnsLeft : 1,
    condition:
      milestone.type === 'boss'
        ? milestone.winCondition
        : milestone.responsePrompt,
    met: false,
    title: milestone.title,
    specialRule: milestone.specialRule ?? milestone.description,
  }
}
