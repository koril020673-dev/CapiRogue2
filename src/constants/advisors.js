export const ADVISOR_ORDER = ['analyst', 'hustler', 'oracle', 'engineer']

export const ADVISORS = {
  analyst: {
    id: 'analyst',
    name: '정보 담당관',
    codename: '정밀 분석형',
    personality: '차갑고 데이터 중심적인 전략 브리퍼',
    passiveBonus: 'BEP 항상 표시, 라이벌 가격 정확 공개',
    passiveEffects: {
      showBreakEvenPoint: true,
      revealExactRivalPrices: true,
      salesResistanceBonus: 0,
      capitalMultiplier: 1,
      factoryCostMultiplier: 1,
      falseInfoChance: 0,
    },
    infoStyle: '원가, 가격, 점유율, 손익분기점을 숫자로 정확하게 보여줍니다.',
    advisorBubbleMode: '정확 가격 브리핑',
    summary:
      '위험을 감으로 읽지 않습니다. 손익 구조와 경쟁사 가격을 근거로 의사결정을 돕습니다.',
    starterQuote:
      '감정은 회의실 밖에 두세요. 이번 런은 숫자로만 돌파할 수 있습니다.',
    hoverStats: [
      'BEP 상시 표시',
      '라이벌 실가격 노출',
      '수치 해석 안정적',
    ],
  },
  hustler: {
    id: 'hustler',
    name: '영업왕',
    codename: '공세 운영형',
    personality: '공세적이고 낙관적인 현장형 영업 리더',
    passiveBonus: '기본 판매 저항력 +5%',
    passiveEffects: {
      showBreakEvenPoint: false,
      revealExactRivalPrices: false,
      salesResistanceBonus: 5,
      capitalMultiplier: 1,
      factoryCostMultiplier: 1,
      falseInfoChance: 0,
    },
    infoStyle: '수요 전망과 타이밍 위주로 짧고 강하게 브리핑합니다.',
    advisorBubbleMode: '수요 전망 브리핑',
    summary:
      '정밀한 숫자 대신 지금 밀어붙일 만한지 빠르게 판단하게 해주는 타입입니다.',
    starterQuote:
      '시장도 결국 사람입니다. 타이밍만 잡으면 점유율은 당겨올 수 있어요.',
    hoverStats: [
      '판매 저항력 기본 +5%',
      '수요 전망 우선 브리핑',
      '공세적 대응에 적합',
    ],
  },
  oracle: {
    id: 'oracle',
    name: '노이즈 오라클',
    codename: '변칙 예측형',
    personality: '암시와 예언을 흘리는 불안정한 시그널 해석자',
    passiveBonus: '시작 자본 +3%, 매 턴 30% 확률로 오정보',
    passiveEffects: {
      showBreakEvenPoint: false,
      revealExactRivalPrices: false,
      salesResistanceBonus: 0,
      capitalMultiplier: 1.03,
      factoryCostMultiplier: 1,
      falseInfoChance: 0.3,
    },
    infoStyle: '신호, 잡음, 소문을 섞어 브리핑하며 일부 정보는 흔들립니다.',
    advisorBubbleMode: '노이즈 예측 브리핑',
    summary:
      '초기 자본은 넉넉하지만 정보 신뢰도가 흔들립니다. 하이리스크 운영에 어울립니다.',
    starterQuote:
      '정답은 잡음 속에 있습니다. 다만 그 잡음이 진실이라는 보장은 없죠.',
    hoverStats: [
      '시작 자본 +3%',
      '매 턴 30% 확률 오정보',
      '변칙 운영에 강함',
    ],
  },
  engineer: {
    id: 'engineer',
    name: '공장장',
    codename: '생산 최적화형',
    personality: '원가, 공정, 품질 최적화에 집착하는 운영 관리자',
    passiveBonus: '공장 건설/증설 비용 -10%',
    passiveEffects: {
      showBreakEvenPoint: false,
      revealExactRivalPrices: false,
      salesResistanceBonus: 0,
      capitalMultiplier: 1,
      factoryCostMultiplier: 0.9,
      falseInfoChance: 0,
    },
    infoStyle: '원가 구조, 공정 효율, 품질 투자 회수 관점으로 브리핑합니다.',
    advisorBubbleMode: '원가 구조 브리핑',
    summary:
      '확장과 품질 투자 효율을 높입니다. 생산과 연구 중심 빌드에 가장 안정적입니다.',
    starterQuote:
      '좋은 공정은 멋진 광고보다 오래갑니다. 승부는 라인에서 먼저 갈립니다.',
    hoverStats: [
      '증설 비용 10% 절감',
      '원가 구조 브리핑',
      '품질 빌드 최적화',
    ],
  },
}

export function getAdvisorDefinition(advisorId) {
  return ADVISORS[advisorId] ?? ADVISORS.analyst
}

export function getAdvisorPreview(advisorId) {
  const advisor = getAdvisorDefinition(advisorId)

  return {
    id: advisor.id,
    name: advisor.name,
    passiveBonus: advisor.passiveBonus,
    infoStyle: advisor.infoStyle,
    hoverStats: advisor.hoverStats,
    starterQuote: advisor.starterQuote,
  }
}
