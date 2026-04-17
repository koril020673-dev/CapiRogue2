export const ADVISOR_ORDER = [
  'analyst',
  'trader',
  'strategist',
  'quant',
  'auditor',
  'economist',
  'venture',
  'arbitrageur',
  'actuary',
  'sovereign',
]

export const ADVISORS = {
  analyst: {
    id: 'analyst',
    icon: '📊',
    name: 'Analyst',
    job: '주니어 애널리스트',
    quote: '"모든 수치를 보여드리겠습니다. 대신 수수료를 챙겨가죠."',
    unlockCondition: '처음부터',
    fee: { type: 'percent', value: 0.08, lossFixed: 200000 },
    infoLevel: 'full',
    stats: { info: 5, attack: 2, survival: 3 },
    difficulty: '쉬움',
    passive: null,
    special: null,
    themeColor: '#60A5FA',
  },
  trader: {
    id: 'trader',
    icon: '💹',
    name: 'Trader',
    job: '트레이더',
    quote: '"빠르게. 핵심만."',
    unlockCondition: '클리어 1회',
    fee: { type: 'fixed', value: 100000 },
    infoLevel: 'market',
    stats: { info: 2, attack: 5, survival: 2 },
    difficulty: '보통',
    passive: '물량 공세 효과 +10%',
    special: '경제전쟁 내 흑자 라운드: 라이벌 체력 추가 -1',
    themeColor: '#F97316',
  },
  strategist: {
    id: 'strategist',
    icon: '🧭',
    name: 'Strategist',
    job: '전략 컨설턴트',
    quote: '"한 발 앞을 보세요."',
    unlockCondition: '클리어 2회',
    fee: { type: 'percent', value: 0.05, lossFixed: 0 },
    infoLevel: 'macro',
    stats: { info: 3, attack: 2, survival: 5 },
    difficulty: '보통',
    passive: '안전 경영 효과 +20%',
    special: '경제전쟁 진입 시 체력 +2 자동 회복',
    themeColor: '#34D399',
  },
  quant: {
    id: 'quant',
    icon: '🧮',
    name: 'Quant',
    job: '퀀트 애널리스트',
    quote: '"감정은 필요 없습니다."',
    unlockCondition: 'Analyst 플레이 5회',
    fee: { type: 'creditDeduct', value: 100 },
    infoLevel: 'full+',
    stats: { info: 5, attack: 3, survival: 3 },
    difficulty: '어려움',
    passive: '모멘텀 효과 x1.5',
    special: '매 10층: 라이벌 정밀 분석 리포트',
    themeColor: '#A78BFA',
  },
  auditor: {
    id: 'auditor',
    icon: '🧾',
    name: 'Auditor',
    job: '회계감사관',
    quote: '"숫자는 거짓말을 하지 않습니다."',
    unlockCondition: '클리어 3회',
    fee: null,
    infoLevel: 'finance',
    stats: { info: 4, attack: 1, survival: 4 },
    difficulty: '보통',
    passive: '부채 이자 -10%',
    special: '적자 발생 시 원인 한 줄 자동 분석',
    themeColor: '#FACC15',
  },
  economist: {
    id: 'economist',
    icon: '🌐',
    name: 'Economist',
    job: '이코노미스트',
    quote: '"거시를 보면 미시가 보입니다."',
    unlockCondition: '50층 도달 3회',
    fee: { type: 'percent', value: 0.03 },
    infoLevel: 'macro+',
    stats: { info: 4, attack: 2, survival: 4 },
    difficulty: '보통',
    passive: '위축·불황 수요 감소 -10% 완화',
    special: '블랙스완 1층 전 경고',
    themeColor: '#2DD4BF',
  },
  venture: {
    id: 'venture',
    icon: '🚀',
    name: 'Venture',
    job: '벤처 캐피탈리스트',
    quote: '"리스크가 없으면 리턴도 없습니다."',
    unlockCondition: '경제전쟁 승리 10회',
    fee: null,
    infoLevel: 'rival',
    stats: { info: 2, attack: 5, survival: 1 },
    difficulty: '어려움',
    passive: '경제전쟁 승리 시 Credit +200C 추가',
    special: '라이벌 후퇴 후 재등장 2층 지연',
    themeColor: '#F43F5E',
  },
  arbitrageur: {
    id: 'arbitrageur',
    icon: '🪙',
    name: 'Arbitrageur',
    job: '차익거래사',
    quote: '"타이밍이 전부입니다."',
    unlockCondition: '유산 카드 5장',
    fee: null,
    infoLevel: 'phase',
    stats: { info: 3, attack: 3, survival: 3 },
    difficulty: '보통',
    passive: '품목 카테고리 전환 비용 없음',
    special: '경기 국면 전환 시 수요 +15% 1층',
    themeColor: '#8B5CF6',
  },
  actuary: {
    id: 'actuary',
    icon: '🛟',
    name: 'Actuary',
    job: '보험계리사',
    quote: '"최악을 대비하면 최악은 없습니다."',
    unlockCondition: '80층 도달 3회',
    fee: { type: 'creditAdd', value: 100 },
    infoLevel: 'health',
    stats: { info: 2, attack: 1, survival: 5 },
    difficulty: '어려움',
    passive: '치명적 손실(-3) 확률 30% 감소',
    special: '게임당 1회: 체력 0 대신 1로 버팀',
    themeColor: '#06B6D4',
  },
  sovereign: {
    id: 'sovereign',
    icon: '👑',
    name: 'Sovereign',
    job: '국부펀드 운용역',
    quote: '"시장은 결국 내 편입니다."',
    unlockCondition: '서로 다른 어드바이저 5명 사용',
    fee: null,
    infoLevel: 'full',
    stats: { info: 5, attack: 3, survival: 4 },
    difficulty: '어려움',
    passive: null,
    special: '각 경제전쟁: 라이벌 초기 체력 -1',
    themeColor: '#F0A500',
  },
}

export function getAdvisorDefinition(advisorId) {
  return ADVISORS[advisorId] ?? ADVISORS.analyst
}

export function isAdvisorUnlocked(advisorId, meta = {}, legacyCards = []) {
  switch (advisorId) {
    case 'analyst':
      return true
    case 'trader':
      return (meta.clears ?? 0) >= 1
    case 'strategist':
      return (meta.clears ?? 0) >= 2
    case 'quant':
      return (meta.analystPlays ?? 0) >= 5
    case 'auditor':
      return (meta.clears ?? 0) >= 3
    case 'economist':
      return (meta.floor50Reached ?? 0) >= 3
    case 'venture':
      return (meta.economicWarWins ?? meta.warWins ?? 0) >= 10
    case 'arbitrageur':
      return (legacyCards?.length ?? 0) >= 5
    case 'actuary':
      return (meta.floor80Reached ?? 0) >= 3
    case 'sovereign':
      return new Set(meta.advisorUsed ?? []).size >= 5
    default:
      return false
  }
}

export function getAdvisorPhaseComment(advisorId, econPhase) {
  const comments = {
    analyst: {
      boom: '수요 예측치가 높습니다. 공격적인 확대가 유효합니다.',
      growth: '성장 구간입니다. 물량과 마진의 균형이 좋습니다.',
      stable: '표준 국면입니다. 비용 통제가 핵심입니다.',
      contraction: '위축 신호가 보입니다. 발주 축소가 안전합니다.',
      recession: '불황입니다. 필수재 전환과 현금 보존을 권합니다.',
    },
    trader: {
      boom: '지금은 뺏을 때입니다. 점유율을 밀어붙이세요.',
      growth: '살짝만 더 공격하면 시장을 흔들 수 있습니다.',
      stable: '움직이지 않으면 못 가져옵니다. 먼저 치세요.',
      contraction: '손절선만 정해 두면 기회는 있습니다.',
      recession: '깊게 베팅하면 위험합니다. 짧고 빠르게 갑니다.',
    },
    strategist: {
      boom: '호황이라도 과열엔 출구가 필요합니다.',
      growth: '확장하되 다음 국면 전환을 대비하세요.',
      stable: '기본기를 지키면 흔들리지 않습니다.',
      contraction: '방어적인 주문과 유동성 확보가 우선입니다.',
      recession: '생존이 곧 전략입니다. 체력 보존에 집중하세요.',
    },
    quant: {
      boom: '기대값이 플러스입니다. 고점 리스크만 관리하세요.',
      growth: '현재 국면의 우상향 확률이 아직 우세합니다.',
      stable: '분산이 낮습니다. 효율 최적화 구간입니다.',
      contraction: '하방 변동성이 커지고 있습니다. 포지션을 줄이세요.',
      recession: '기대수익보다 생존확률이 중요합니다.',
    },
    auditor: {
      boom: '매출보다 순이익을 보셔야 합니다.',
      growth: '확장 비용이 누적되기 전에 점검하세요.',
      stable: '현금흐름표가 가장 정직한 국면입니다.',
      contraction: '고정비 압박이 커집니다. 현금 유출을 줄이세요.',
      recession: '이자와 재고가 회사를 흔드는 시기입니다.',
    },
    economist: {
      boom: '확장세가 강합니다. 다만 다음 조정도 준비해야 합니다.',
      growth: '완만한 상승입니다. 평균 이상의 수요를 기대할 수 있습니다.',
      stable: '총수요가 고르게 유지되는 구간입니다.',
      contraction: '소비심리가 둔화되고 있습니다.',
      recession: '소득 탄력성이 높은 품목은 특히 주의하세요.',
    },
    venture: {
      boom: '큰 판이 열렸습니다. 강하게 밀어붙일 만합니다.',
      growth: '지금 베팅하면 남보다 먼저 커질 수 있습니다.',
      stable: '정체된 시장은 더 과감한 플레이를 요구합니다.',
      contraction: '위험하지만, 흔들릴 때 빼앗는 맛이 있습니다.',
      recession: '무리하면 바로 무너집니다. 칼날만 짧게 쓰죠.',
    },
    arbitrageur: {
      boom: '국면 차이를 이용할 여지가 큽니다.',
      growth: '수요 기울기가 올라오는 구간입니다.',
      stable: '큰 차익은 없지만 미세 조정이 잘 먹힙니다.',
      contraction: '가격과 품질 간 격차를 노려 보세요.',
      recession: '카테고리 전환 타이밍이 승부를 가릅니다.',
    },
    actuary: {
      boom: '좋을 때일수록 최악의 경우를 계산해야 합니다.',
      growth: '상승 중에도 손실확률은 사라지지 않습니다.',
      stable: '예상 가능한 국면입니다. 안전폭을 키우세요.',
      contraction: '스트레스 상황입니다. 손실폭 관리가 중요합니다.',
      recession: '이 구간은 살아남는 사람이 이깁니다.',
    },
    sovereign: {
      boom: '확장과 방어를 함께 가져갈 수 있는 국면입니다.',
      growth: '균형 있게 키우면 장기전에서 앞섭니다.',
      stable: '지금은 기반을 다지는 타이밍입니다.',
      contraction: '시장 방어선이 필요한 때입니다.',
      recession: '현금, 점유율, 체력을 모두 분산해서 지키세요.',
    },
  }

  return comments[advisorId]?.[econPhase] ?? comments.analyst[econPhase] ?? ''
}
