export const ADVISOR_ORDER = ['raider', 'guardian', 'analyst', 'gambler']

export const ADVISORS = {
  raider: {
    id: 'raider',
    icon: 'R',
    name: 'The Raider',
    style: '공격형',
    job: '공격형',
    description: '시장을 빠르게 장악한다. 체력이 약한 대신 매력도가 높다.',
    summary: '매력도 +7%, 최대 체력 8',
    passiveBonus: '매력도 x1.07',
    quote: '"먼저 치고, 시장을 가져옵니다."',
    unlockCondition: '기본 해금',
    fee: null,
    infoLevel: 'market',
    stats: { info: 2, attack: 5, survival: 2 },
    difficulty: '★★★☆',
    passive: {
      attractionBonus: 0.07,
      maxHealth: 8,
    },
    special: null,
    diagnosisStyle: '공격적',
    themeColor: '#DC143C',
  },
  guardian: {
    id: 'guardian',
    icon: 'G',
    name: 'The Guardian',
    style: '안정형',
    job: '안정형',
    description: '손실을 막는 데 특화되어 있다. 성장은 느리지만 무너지지 않는다.',
    summary: '체력 감소 -1, 발주 상한 -10%',
    passiveBonus: '손실 방어',
    quote: '"살아남으면 다음 수가 생깁니다."',
    unlockCondition: '기본 해금',
    fee: null,
    infoLevel: 'finance',
    stats: { info: 3, attack: 1, survival: 5 },
    difficulty: '★☆☆☆',
    passive: {
      healthDecreaseReduction: 1,
      orderCapMultiplier: 0.9,
    },
    special: null,
    diagnosisStyle: '안정적',
    themeColor: '#00AA00',
  },
  analyst: {
    id: 'analyst',
    icon: 'A',
    name: 'The Analyst',
    style: '분석형',
    job: '분석형',
    description: '정보 우위로 싸운다. 라이벌 정보가 추가 공개되고 크레딧이 더 들어온다.',
    summary: '정보 공개, 보상 크레딧 +1',
    passiveBonus: '추가 정보',
    quote: '"보이는 정보가 곧 무기입니다."',
    unlockCondition: '기본 해금',
    fee: null,
    infoLevel: 'full+',
    stats: { info: 5, attack: 2, survival: 3 },
    difficulty: '★★☆☆',
    passive: {
      revealExtraRivalInfo: true,
      extraCreditPerReward: 1,
      phaseWarningTurns: 1,
    },
    special: null,
    diagnosisStyle: '분석적',
    themeColor: '#00FF41',
  },
  gambler: {
    id: 'gambler',
    icon: '$',
    name: 'The Gambler',
    style: '도박형',
    job: '도박형',
    description: '이벤트에 모든 것을 건다. 크레딧으로만 체력을 회복할 수 있다.',
    summary: '도박 선택 확률 +15%, 자동 회복 없음',
    passiveBonus: '이벤트 한방',
    quote: '"판이 흔들릴수록 이길 맛이 나죠."',
    unlockCondition: '기본 해금',
    fee: null,
    infoLevel: 'risk',
    stats: { info: 2, attack: 4, survival: 1 },
    difficulty: '★★★★',
    passive: {
      gamblingOddsBonus: 0.15,
      absurdOddsBonus: 0.15,
      healthRecoveryOnlyByCredit: true,
    },
    special: null,
    diagnosisStyle: '도박적',
    themeColor: '#FFD700',
  },
}

export function getAdvisorDefinition(advisorId) {
  return ADVISORS[advisorId] ?? ADVISORS.analyst
}

export function isAdvisorUnlocked() {
  return true
}

export function getAdvisorPhaseComment(advisorId, econPhase) {
  const comments = {
    raider: {
      boom: 'Raider: 과감하게 점유율을 밀어붙일 타이밍입니다.',
      growth: 'Raider: 성장 구간에서는 속도가 무기입니다.',
      stable: 'Raider: 정체된 시장도 흔들면 틈이 생깁니다.',
      contraction: 'Raider: 무리한 확장보다 타격 지점을 좁히세요.',
      recession: 'Raider: 체력이 낮습니다. 공격은 짧고 굵게 가져가세요.',
    },
    guardian: {
      boom: 'Guardian: 좋은 장에서도 방어선을 유지하세요.',
      growth: 'Guardian: 안정적인 재고와 현금 흐름이 우선입니다.',
      stable: 'Guardian: 지금은 손실을 줄이는 운영이 강합니다.',
      contraction: 'Guardian: 발주를 줄이고 버티는 힘을 살리세요.',
      recession: 'Guardian: 생존이 곧 전략입니다.',
    },
    analyst: {
      boom: 'Analyst: 정보가 충분합니다. 수치를 보고 움직이세요.',
      growth: 'Analyst: 라이벌 움직임과 수요 흐름을 함께 보세요.',
      stable: 'Analyst: 작은 차이를 읽는 쪽이 앞서갑니다.',
      contraction: 'Analyst: 위험 신호를 먼저 확인하세요.',
      recession: 'Analyst: 정보 우위로 손실 구간을 줄이세요.',
    },
    gambler: {
      boom: 'Gambler: 좋은 판입니다. 단, 잃을 것도 계산하세요.',
      growth: 'Gambler: 한 번의 선택이 흐름을 바꿀 수 있습니다.',
      stable: 'Gambler: 평범한 장에서는 과감함이 변수입니다.',
      contraction: 'Gambler: 위기일수록 베팅의 대가가 큽니다.',
      recession: 'Gambler: 자동 회복은 없습니다. 크레딧을 아껴두세요.',
    },
  }

  return comments[advisorId]?.[econPhase] ?? comments.analyst[econPhase] ?? ''
}
