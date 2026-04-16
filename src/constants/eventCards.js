const createChoice = (
  id,
  label,
  probabilityHint,
  successRate,
  successText,
  successEffects,
  failureText,
  failureEffects,
) => ({
  id,
  label,
  probabilityHint,
  successRate,
  successText,
  successEffects,
  failureText,
  failureEffects,
})

const financeCards = [
  {
    id: 'supplier-rebid',
    name: '공급가 재입찰',
    description:
      '주요 원재료 공급사 두 곳이 가격 재협상을 제안했습니다. 이번 달 조건을 잘 잡으면 원가를 꽤 낮출 수 있습니다.',
    tags: ['원가', '현금흐름', '조달'],
    baseWeight: 1.2,
    economyBias: { slowdown: 1.2, recovery: 0.4 },
    debtBias: 'medium',
    factoryBias: 'owned',
    choices: [
      createChoice(
        'push-hard',
        '강하게 재협상',
        '성공 66% | 원가 절감 폭 큼',
        0.66,
        '공급사가 물량 유지를 택하면서 단가를 내려줬습니다.',
        { capitalDelta: 10, costAdjustmentDelta: -1.2, rivalCapitalDelta: { megaflex: -10 } },
        '공급사가 반발해 선결제 조건이 붙었습니다.',
        { capitalDelta: -12, debtDelta: 8, costAdjustmentDelta: -0.2 },
      ),
      createChoice(
        'lock-safe',
        '안전하게 장기계약',
        '성공 84% | 효과는 안정적',
        0.84,
        '장기 물량 계약이 체결되며 원가 변동성이 줄었습니다.',
        { capitalDelta: -8, costAdjustmentDelta: -0.6, demandAdjustmentDelta: 0.4 },
        '보수적으로 잡느라 선금만 묶였습니다.',
        { capitalDelta: -14, costAdjustmentDelta: -0.1 },
      ),
    ],
  },
  {
    id: 'bridge-credit',
    name: '브리지 한도',
    description:
      '주거래 은행이 단기 운전자금 한도를 열어두겠다고 합니다. 숨통은 트이지만 부채 체질은 더 무거워집니다.',
    tags: ['대출', '유동성', '부채'],
    baseWeight: 1.1,
    economyBias: { slowdown: 1.3, steady: 0.5 },
    debtBias: 'high',
    choices: [
      createChoice(
        'draw-now',
        '한도 바로 사용',
        '성공 79% | 자금 확보 확실',
        0.79,
        '운전자금이 들어오며 급한 지출을 막았습니다.',
        { capitalDelta: 34, debtDelta: 16, marketShareDelta: 0.6 },
        '조건이 바뀌어 생각보다 비싼 자금이 됐습니다.',
        { capitalDelta: 18, debtDelta: 24, brandDelta: -1 },
      ),
      createChoice(
        'trim-first',
        '비용부터 줄이기',
        '성공 61% | 리스크는 낮음',
        0.61,
        '지출 구조를 정리해 추가 차입 없이 버틸 여지를 만들었습니다.',
        { capitalDelta: 12, marketingDelta: -2, costAdjustmentDelta: -0.4 },
        '긴축이 너무 급해 판매 흐름이 꺾였습니다.',
        { capitalDelta: 4, marketShareDelta: -1.1, brandDelta: -1.4 },
      ),
    ],
  },
  {
    id: 'receivable-factoring',
    name: '외상 매출 팩토링',
    description:
      '유통 채널 대금 회수가 늦어지고 있습니다. 외상 매출을 넘기면 현금은 생기지만 수수료가 꽤 큽니다.',
    tags: ['현금흐름', '수수료', '채널'],
    baseWeight: 1,
    economyBias: { slowdown: 1.1, recovery: 0.6 },
    debtBias: 'medium',
    choices: [
      createChoice(
        'sell-paper',
        '매출채권 넘기기',
        '성공 86% | 즉시 현금화',
        0.86,
        '현금이 바로 들어오며 한숨을 돌렸습니다.',
        { capitalDelta: 26, brandDelta: -0.6 },
        '수수료와 할인율이 예상보다 컸습니다.',
        { capitalDelta: 14, debtDelta: 6 },
      ),
      createChoice(
        'pressure-channel',
        '채널 회수 압박',
        '성공 58% | 수수료는 아낌',
        0.58,
        '채널이 일부 물량을 앞당겨 정산했습니다.',
        { capitalDelta: 18, marketShareDelta: -0.3, demandAdjustmentDelta: -0.2 },
        '채널 관계가 틀어지며 다음 판촉이 밀렸습니다.',
        { capitalDelta: -8, marketShareDelta: -1.4, brandDelta: -1.2 },
      ),
    ],
  },
  {
    id: 'covenant-waiver',
    name: '재무 약정 유예',
    description:
      '대주단이 약정 위반 가능성을 먼저 감지했습니다. 설명 자료를 잘 내면 유예를 받겠지만, 신뢰를 잃을 수도 있습니다.',
    tags: ['재무', '설명자료', '리스크'],
    baseWeight: 0.95,
    economyBias: { slowdown: 1.2, steady: 0.5 },
    debtBias: 'high',
    choices: [
      createChoice(
        'full-disclose',
        '정면 설명',
        '성공 68% | 부채 압박 완화',
        0.68,
        '대주단이 운영 계획을 받아들여 상환 압박을 늦춰줬습니다.',
        { debtDelta: -10, capitalDelta: 8, brandDelta: 0.8 },
        '자료가 미흡해 오히려 더 촘촘한 보고 의무가 붙었습니다.',
        { debtDelta: 6, capitalDelta: -10, demandAdjustmentDelta: -0.4 },
      ),
      createChoice(
        'buy-time',
        '형식적으로 시간 벌기',
        '성공 74% | 단기 봉합',
        0.74,
        '한 달 정도는 조용히 넘어갈 수 있게 됐습니다.',
        { capitalDelta: 6, debtDelta: -4 },
        '임시방편이 드러나며 신용도가 더 깎였습니다.',
        { debtDelta: 10, brandDelta: -1.6 },
      ),
    ],
  },
  {
    id: 'leaseback-bay',
    name: '창고 리스백',
    description:
      '외곽 창고를 매각 후 재임차하는 제안이 들어왔습니다. 현금은 들어오지만 고정비와 생산 유연성은 줄어듭니다.',
    tags: ['자산매각', '고정비', '공장'],
    baseWeight: 0.9,
    economyBias: { slowdown: 0.9, recovery: 0.5 },
    debtBias: 'high',
    factoryBias: 'owned',
    choices: [
      createChoice(
        'sell-and-lease',
        '리스백 체결',
        '성공 82% | 현금 유입 큼',
        0.82,
        '자금이 들어와 급한 채무를 일부 눌렀습니다.',
        { capitalDelta: 30, debtDelta: -8, costAdjustmentDelta: 0.4 },
        '예상보다 비싼 재임차 조건이 붙었습니다.',
        { capitalDelta: 18, costAdjustmentDelta: 0.9, demandAdjustmentDelta: -0.3 },
      ),
      createChoice(
        'keep-asset',
        '보유 유지',
        '성공 63% | 생산 유연성 보존',
        0.63,
        '자산은 지켰지만 운영 효율을 조금 더 끌어올렸습니다.',
        { qualityDelta: 2.2, demandAdjustmentDelta: 0.5 },
        '현금 압박이 계속되며 내부 분위기가 얼어붙었습니다.',
        { capitalDelta: -12, debtDelta: 5, brandDelta: -0.8 },
      ),
    ],
  },
  {
    id: 'debt-refinance',
    name: '만기 재조정',
    description:
      '기존 차입 만기를 길게 늘릴 수 있는 창구가 열렸습니다. 이자 총액은 늘지만 당장 월 압박은 줄어듭니다.',
    tags: ['부채', '리파이낸싱', '이자'],
    baseWeight: 1,
    economyBias: { recovery: 0.8, steady: 0.4 },
    debtBias: 'high',
    choices: [
      createChoice(
        'stretch-tenor',
        '만기 길게 늘리기',
        '성공 73% | 월 부담 감소',
        0.73,
        '상환 캘린더가 완화되어 숨이 트였습니다.',
        { debtDelta: 8, capitalDelta: 12, demandAdjustmentDelta: 0.3 },
        '조건이 좋지 않아 비용만 늘었습니다.',
        { debtDelta: 12, capitalDelta: -8, brandDelta: -0.6 },
      ),
      createChoice(
        'partial-repay',
        '일부 선상환',
        '성공 67% | 체질 개선',
        0.67,
        '단기 부담이 커졌지만 부채 구조는 건강해졌습니다.',
        { capitalDelta: -18, debtDelta: -14, brandDelta: 0.6 },
        '현금만 줄고 조건 개선은 미미했습니다.',
        { capitalDelta: -22, debtDelta: -5 },
      ),
    ],
  },
  {
    id: 'insurance-claim',
    name: '보험금 청구',
    description:
      '지난 분기 설비 사고 건을 이제야 청구할 수 있습니다. 서류를 파면 돈이 나오지만 시간이 꽤 듭니다.',
    tags: ['보험', '설비', '보상'],
    baseWeight: 0.8,
    economyBias: { steady: 0.6, slowdown: 0.7 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'file-full',
        '끝까지 청구',
        '성공 64% | 보상금 큼',
        0.64,
        '보상금이 승인되어 자금 여력이 생겼습니다.',
        { capitalDelta: 24, costAdjustmentDelta: -0.3 },
        '서류 보완만 반복되며 시간과 법무비가 나갔습니다.',
        { capitalDelta: -10, debtDelta: 4 },
      ),
      createChoice(
        'settle-fast',
        '빠른 합의',
        '성공 88% | 금액은 작음',
        0.88,
        '작지만 확실한 보상금을 바로 받았습니다.',
        { capitalDelta: 14, demandAdjustmentDelta: 0.2 },
        '급히 합의하느라 실익이 거의 없었습니다.',
        { capitalDelta: 4 },
      ),
    ],
  },
  {
    id: 'price-floor-pledge',
    name: '가격 하한 합의',
    description:
      '주요 대리점들이 지나친 할인 경쟁을 멈추자고 합니다. 마진은 좋아지지만 물량 반발이 생길 수도 있습니다.',
    tags: ['가격', '마진', '채널'],
    baseWeight: 0.9,
    economyBias: { boom: 0.8, slowdown: 1 },
    rivalFocus: ['megaflex'],
    choices: [
      createChoice(
        'sign-floor',
        '하한 합의 수용',
        '성공 71% | 마진 회복',
        0.71,
        '채널이 가격 질서를 지켜주며 채산성이 좋아졌습니다.',
        { capitalDelta: 16, marketShareDelta: -0.5, rivalPriceDelta: { megaflex: 1.1 } },
        '물량 상인들이 반발해 점유율이 빠졌습니다.',
        { capitalDelta: 6, marketShareDelta: -1.6 },
      ),
      createChoice(
        'stay-loose',
        '자율 할인 유지',
        '성공 62% | 물량 방어',
        0.62,
        '점유율은 지켰지만 마진 압박은 남았습니다.',
        { marketShareDelta: 0.8, capitalDelta: -8 },
        '질서 없는 할인전이 번지며 시장이 더 거칠어졌습니다.',
        { capitalDelta: -14, rivalCapitalDelta: { megaflex: 10 } },
      ),
    ],
  },
  {
    id: 'tax-prepayment',
    name: '선납 세액 조정',
    description:
      '예상보다 높은 선납 세액이 잡혔습니다. 지금 바로 정정 신청을 넣을지, 여유 있게 넘길지 결정해야 합니다.',
    tags: ['세금', '현금', '신청'],
    baseWeight: 0.7,
    economyBias: { steady: 0.7, recovery: 0.5 },
    choices: [
      createChoice(
        'appeal-now',
        '지금 정정 신청',
        '성공 69% | 현금 유출 축소',
        0.69,
        '납부액이 줄어 당장 빠져나갈 돈을 막았습니다.',
        { capitalDelta: 18, brandDelta: 0.4 },
        '정정 근거가 약해 오히려 추가 자료 비용이 들었습니다.',
        { capitalDelta: -9, debtDelta: 3 },
      ),
      createChoice(
        'accept-quietly',
        '조용히 납부',
        '성공 91% | 리스크 최소',
        0.91,
        '리스크 없이 넘어갔지만 현금은 줄었습니다.',
        { capitalDelta: -10, brandDelta: 0.2 },
        '예상보다 큰 금액이 나가면서 운영이 팍팍해졌습니다.',
        { capitalDelta: -18, debtDelta: 5 },
      ),
    ],
  },
]
const operationsCards = [
  {
    id: 'overtime-pilot',
    name: '초과근무 파일럿',
    description:
      '수요가 조금 붙는 조짐이 있어 주말 생산을 시험해볼 수 있습니다. 품질이 흔들릴 수도 있지만 물량은 확보됩니다.',
    tags: ['생산', '물량', '속도'],
    baseWeight: 1,
    economyBias: { recovery: 0.7, boom: 1.1 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'run-overtime',
        '주말 물량 확보',
        '성공 72% | 점유율 상승',
        0.72,
        '출하량이 늘며 채널 진열이 살아났습니다.',
        { marketShareDelta: 1.8, capitalDelta: 8, qualityDelta: -1.2 },
        '피로 누적으로 불량률이 튀었습니다.',
        { marketShareDelta: 0.4, qualityDelta: -3.2, brandDelta: -1.1 },
      ),
      createChoice(
        'keep-pace',
        '기존 리듬 유지',
        '성공 83% | 품질 보존',
        0.83,
        '무리하지 않고 생산 밸런스를 지켰습니다.',
        { qualityDelta: 1.4, brandDelta: 0.6 },
        '물량을 놓친 틈을 경쟁사가 파고들었습니다.',
        { marketShareDelta: -0.9, rivalShareDelta: { memecatch: 0.8 } },
      ),
    ],
  },
  {
    id: 'qa-lockdown',
    name: '품질 봉쇄 주간',
    description:
      '현장 품질팀이 한 주 동안 출하 검사를 매우 빡세게 돌리자고 합니다. 물량은 줄지만 품질 점수는 오를 수 있습니다.',
    tags: ['품질', '검사', '출하'],
    baseWeight: 0.95,
    economyBias: { boom: 0.4, steady: 0.7 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'lock-line',
        '검사 강화',
        '성공 77% | 품질 상승 확실',
        0.77,
        '불량 출하를 크게 줄이며 평판이 좋아졌습니다.',
        { qualityDelta: 4.6, brandDelta: 1.5, marketShareDelta: -0.5 },
        '검사 대기만 길어져 출하 차질이 발생했습니다.',
        { qualityDelta: 1.8, marketShareDelta: -1.5, capitalDelta: -6 },
      ),
      createChoice(
        'spot-check',
        '표본 검사만',
        '성공 68% | 균형형',
        0.68,
        '핵심 라인만 추려 점검하며 손실을 줄였습니다.',
        { qualityDelta: 2.4, capitalDelta: 4 },
        '애매하게 운영하다 핵심 결함을 놓쳤습니다.',
        { qualityDelta: -1.4, brandDelta: -1.2, rivalCapitalDelta: { aura: 8 } },
      ),
    ],
  },
  {
    id: 'contract-factory',
    name: '외주 공장 제안',
    description:
      '지역 협력 공장이 남는 라인을 잠깐 빌려주겠다고 합니다. 물량은 빠르게 늘지만 단가와 품질 관리가 변수입니다.',
    tags: ['외주', '증산', '공정'],
    baseWeight: 1,
    economyBias: { recovery: 0.8, boom: 1.2 },
    factoryBias: 'none',
    choices: [
      createChoice(
        'book-capacity',
        '임시 생산 맡기기',
        '성공 69% | 물량 확대',
        0.69,
        '외주 생산이 안정적으로 돌아가며 판매 기회를 잡았습니다.',
        { marketShareDelta: 1.6, capitalDelta: 10, costAdjustmentDelta: 0.5 },
        '외주 불량 이슈로 오히려 클레임이 늘었습니다.',
        { qualityDelta: -3.4, brandDelta: -1.5, capitalDelta: -8 },
      ),
      createChoice(
        'skip-outsourcing',
        '내부 공정만 유지',
        '성공 82% | 품질 안정',
        0.82,
        '무리한 외주 없이 공정 일관성을 지켰습니다.',
        { qualityDelta: 1.2, costAdjustmentDelta: -0.3 },
        '증산 기회를 놓쳐 채널이 아쉬워했습니다.',
        { marketShareDelta: -0.8, demandAdjustmentDelta: -0.4 },
      ),
    ],
  },
  {
    id: 'automation-cell',
    name: '소형 자동화 셀',
    description:
      '라인 일부를 자동화하는 장비가 특가로 나왔습니다. 지금 사면 원가는 낮아질 수 있지만 초기 비용이 큽니다.',
    tags: ['자동화', '투자', '원가'],
    baseWeight: 0.85,
    economyBias: { recovery: 0.6, steady: 0.8 },
    debtBias: 'low',
    factoryBias: 'owned',
    choices: [
      createChoice(
        'buy-cell',
        '지금 도입',
        '성공 65% | 구조 개선',
        0.65,
        '자동화 셀이 잘 안착하며 원가와 품질이 같이 좋아졌습니다.',
        { capitalDelta: -28, qualityDelta: 3.6, costAdjustmentDelta: -1.1 },
        '셋업이 꼬여 비용만 나가고 라인이 흔들렸습니다.',
        { capitalDelta: -34, qualityDelta: -1.4, costAdjustmentDelta: 0.3 },
      ),
      createChoice(
        'lease-first',
        '리스로 시험',
        '성공 81% | 리스크 절충',
        0.81,
        '리스 운영으로 개선폭은 작지만 안정적으로 검증했습니다.',
        { capitalDelta: -12, qualityDelta: 1.8, costAdjustmentDelta: -0.5 },
        '테스트 효율이 기대에 못 미쳤습니다.',
        { capitalDelta: -10, demandAdjustmentDelta: -0.2 },
      ),
    ],
  },
  {
    id: 'packaging-refresh',
    name: '패키지 리프레시',
    description:
      '포장 디자인을 가볍게 새로 갈 수 있습니다. 브랜드는 오르지만 생산 라인 적응 비용이 발생합니다.',
    tags: ['브랜드', '패키지', '진열'],
    baseWeight: 0.9,
    economyBias: { boom: 0.9, recovery: 0.8 },
    choices: [
      createChoice(
        'refresh-bold',
        '크게 리뉴얼',
        '성공 63% | 브랜드 상승 큼',
        0.63,
        '신규 패키지가 진열대에서 눈에 띄며 브랜드 반응을 얻었습니다.',
        { brandDelta: 3.6, marketShareDelta: 0.8, capitalDelta: -14 },
        '현장 적응이 늦어 출하 혼선이 났습니다.',
        { brandDelta: 0.8, capitalDelta: -20, qualityDelta: -1.4 },
      ),
      createChoice(
        'refresh-light',
        '부분 수정만',
        '성공 82% | 무난한 개선',
        0.82,
        '리스크 없이 패키지 선호도를 조금 올렸습니다.',
        { brandDelta: 1.8, capitalDelta: -6 },
        '소폭 수정이라 체감이 거의 없었습니다.',
        { capitalDelta: -5 },
      ),
    ],
  },
  {
    id: 'spare-parts-pool',
    name: '예비부품 공동구매',
    description:
      '근처 제조사들과 예비부품을 공동구매할 수 있습니다. 운영 탄력은 좋아지지만 현금이 먼저 묶입니다.',
    tags: ['부품', '유지보수', '협업'],
    baseWeight: 0.8,
    economyBias: { steady: 0.7, slowdown: 0.6 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'join-pool',
        '공동구매 참여',
        '성공 74% | 라인 안정',
        0.74,
        '다운타임 위험이 줄면서 생산 효율이 좋아졌습니다.',
        { capitalDelta: -9, qualityDelta: 2.2, costAdjustmentDelta: -0.4 },
        '필요 없는 재고까지 떠안아 자금만 묶였습니다.',
        { capitalDelta: -16, debtDelta: 4 },
      ),
      createChoice(
        'stay-flexible',
        '개별 조달 유지',
        '성공 67% | 현금 보존',
        0.67,
        '현금을 지키며 필요한 부품만 골라 조달했습니다.',
        { capitalDelta: 6, demandAdjustmentDelta: 0.2 },
        '예상 밖 정지로 납기 지연이 생겼습니다.',
        { marketShareDelta: -1, qualityDelta: -1.2 },
      ),
    ],
  },
  {
    id: 'line-balancing',
    name: '라인 밸런싱',
    description:
      '공정 병목을 재배치해 생산 리듬을 손볼 기회입니다. 즉시 효과가 있을 수도 있지만 현장 반발도 예상됩니다.',
    tags: ['효율', '공정', '개선'],
    baseWeight: 0.9,
    economyBias: { steady: 0.8, recovery: 0.6 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'rebuild-flow',
        '공정 재배치',
        '성공 71% | 효율 개선',
        0.71,
        '병목이 줄어들며 라인이 한결 매끄러워졌습니다.',
        { costAdjustmentDelta: -0.8, qualityDelta: 1.8 },
        '현장 적응이 늦어 하루 종일 혼선만 났습니다.',
        { capitalDelta: -8, marketShareDelta: -0.7, qualityDelta: -0.8 },
      ),
      createChoice(
        'coach-team',
        '작업 교육 위주',
        '성공 79% | 부작용 적음',
        0.79,
        '작업자 숙련이 올라가며 생산 손실을 줄였습니다.',
        { qualityDelta: 1.4, brandDelta: 0.4 },
        '교육 효과가 약해 일정만 늘어졌습니다.',
        { capitalDelta: -5, demandAdjustmentDelta: -0.2 },
      ),
    ],
  },
  {
    id: 'shift-meal',
    name: '교대 식대 인상',
    description:
      '현장 리더가 식대 인상을 요청했습니다. 사기는 오르겠지만 비용과 선례가 남습니다.',
    tags: ['현장', '사기', '인건비'],
    baseWeight: 0.75,
    economyBias: { recovery: 0.6, boom: 0.5 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'approve',
        '인상 승인',
        '성공 83% | 현장 안정',
        0.83,
        '현장 분위기가 안정되며 미세한 생산 손실이 줄었습니다.',
        { capitalDelta: -7, qualityDelta: 1.6, demandAdjustmentDelta: 0.4 },
        '효과는 작고 비용만 늘었습니다.',
        { capitalDelta: -10, costAdjustmentDelta: 0.2 },
      ),
      createChoice(
        'hold-line',
        '동결 유지',
        '성공 59% | 비용 절감',
        0.59,
        '비용을 지키며 다른 복지로 분위기를 달랬습니다.',
        { capitalDelta: 6, brandDelta: 0.4 },
        '현장 불만이 쌓이며 불량과 지연이 늘었습니다.',
        { qualityDelta: -2.2, brandDelta: -1.1, marketShareDelta: -0.6 },
      ),
    ],
  },
  {
    id: 'scrap-resale',
    name: '스크랩 재판매',
    description:
      '쌓여 있는 스크랩과 반제품을 되팔 수 있습니다. 현금은 생기지만 품질 개선 프로젝트는 다소 늦어집니다.',
    tags: ['재고', '현금', '정리'],
    baseWeight: 0.7,
    economyBias: { slowdown: 0.8, steady: 0.6 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'sell-scrap',
        '지금 처분',
        '성공 87% | 현금 확보',
        0.87,
        '창고가 가벼워지고 현금이 들어왔습니다.',
        { capitalDelta: 15, qualityDelta: -0.6 },
        '헐값 처분으로 실익이 작았습니다.',
        { capitalDelta: 7, brandDelta: -0.2 },
      ),
      createChoice(
        'reuse-project',
        '내부 재활용',
        '성공 62% | 비용 개선 가능',
        0.62,
        '재활용 공정이 먹히며 단가를 조금 낮췄습니다.',
        { costAdjustmentDelta: -0.4, qualityDelta: 1.2 },
        '분리 작업이 복잡해 손이 더 갔습니다.',
        { capitalDelta: -6, qualityDelta: -0.8 },
      ),
    ],
  },
]
const marketCards = [
  {
    id: 'influencer-bundle',
    name: '인플루언서 묶음 제안',
    description:
      '중형 크리에이터들이 묶음 판매 방송을 제안했습니다. 단기 반응은 빠르지만 브랜드 톤은 다소 흔들릴 수 있습니다.',
    tags: ['마케팅', '방송', '판매'],
    baseWeight: 1,
    economyBias: { recovery: 0.9, boom: 1.1 },
    rivalFocus: ['memecatch'],
    choices: [
      createChoice(
        'go-live',
        '라이브 묶음 진행',
        '성공 74% | 점유율 반등',
        0.74,
        '실시간 판매가 터지며 점유율이 빠르게 올라왔습니다.',
        { marketShareDelta: 2.1, capitalDelta: 11, brandDelta: -0.6 },
        '할인 폭만 커지고 객단가는 낮아졌습니다.',
        { marketShareDelta: 0.5, capitalDelta: -10, brandDelta: -1.2 },
      ),
      createChoice(
        'limit-collab',
        '브랜드 톤 맞춰 진행',
        '성공 68% | 균형형 반응',
        0.68,
        '대중성과 톤을 둘 다 챙기며 무난한 성과를 냈습니다.',
        { marketShareDelta: 1.1, brandDelta: 0.8, capitalDelta: 4 },
        '톤만 맞추다 반응이 약했습니다.',
        { capitalDelta: -7, demandAdjustmentDelta: -0.4 },
      ),
    ],
  },
  {
    id: 'retail-endcap',
    name: '매대 엔드캡 확보',
    description:
      '대형 채널에서 엔드캡 진열 자리가 비었습니다. 비용은 들지만 한 달 동안 시야를 독점할 수 있습니다.',
    tags: ['유통', '진열', '가시성'],
    baseWeight: 0.95,
    economyBias: { boom: 1, recovery: 0.7 },
    choices: [
      createChoice(
        'buy-endcap',
        '공격적으로 확보',
        '성공 67% | 매출 점프',
        0.67,
        '눈에 띄는 진열 효과로 판매가 크게 늘었습니다.',
        { marketShareDelta: 1.9, capitalDelta: 12, brandDelta: 1.2 },
        '비싼 자리값만 내고 실판매는 기대보다 낮았습니다.',
        { capitalDelta: -16, marketShareDelta: 0.2 },
      ),
      createChoice(
        'test-small',
        '소규모 채널만',
        '성공 81% | 손실 제한',
        0.81,
        '적은 예산으로도 효율 좋은 진열만 골라 집행했습니다.',
        { marketShareDelta: 0.9, capitalDelta: 3 },
        '규모가 작아 체감이 거의 없었습니다.',
        { capitalDelta: -4 },
      ),
    ],
  },
  {
    id: 'premium-shelf',
    name: '프리미엄 선반 제안',
    description:
      '상위 고객이 많은 채널이 별도 프리미엄 선반 입점을 제안했습니다. 고급형 이미지에는 좋지만 가격 압박도 함께 옵니다.',
    tags: ['프리미엄', '브랜드', '채널'],
    baseWeight: 0.88,
    economyBias: { boom: 1.2, steady: 0.4 },
    rivalFocus: ['aura'],
    choices: [
      createChoice(
        'take-shelf',
        '입점 진행',
        '성공 64% | 브랜드 상승',
        0.64,
        '상위 고객 노출이 늘며 브랜드 가치가 크게 올랐습니다.',
        { brandDelta: 4.2, marketShareDelta: 0.6, capitalDelta: -10 },
        '채널 요구 조건이 까다로워 수익성이 나빠졌습니다.',
        { brandDelta: 1.4, capitalDelta: -18, marketShareDelta: -0.4 },
      ),
      createChoice(
        'wait-for-fit',
        '다음 분기로 미루기',
        '성공 73% | 손실 억제',
        0.73,
        '성급한 입점을 피하며 제품 완성도를 조금 더 올렸습니다.',
        { qualityDelta: 1.8, brandDelta: 0.8 },
        '아우라에게 자리를 내주며 화제성을 놓쳤습니다.',
        { brandDelta: -1.2, rivalShareDelta: { aura: 1.1 } },
      ),
    ],
  },
  {
    id: 'loyalty-coupon',
    name: '충성 고객 쿠폰',
    description:
      '기존 구매 고객에게만 쓰는 제한 쿠폰 캠페인을 열 수 있습니다. 마진은 깎이지만 이탈 방어에는 효과가 있습니다.',
    tags: ['재구매', '쿠폰', '방어'],
    baseWeight: 0.92,
    economyBias: { slowdown: 1.1, steady: 0.7 },
    choices: [
      createChoice(
        'launch-coupon',
        '쿠폰 즉시 발행',
        '성공 78% | 점유율 방어',
        0.78,
        '이탈 고객을 잘 붙잡아 점유율을 지켰습니다.',
        { marketShareDelta: 1.2, capitalDelta: -8, demandAdjustmentDelta: 0.6 },
        '할인만 기대하는 고객이 늘었습니다.',
        { marketShareDelta: 0.3, capitalDelta: -12, brandDelta: -1 },
      ),
      createChoice(
        'save-budget',
        '쿠폰 없이 유지',
        '성공 58% | 마진 보전',
        0.58,
        '가격 규율을 지키며 브랜드 톤을 유지했습니다.',
        { capitalDelta: 8, brandDelta: 1 },
        '재구매 이탈을 막지 못했습니다.',
        { marketShareDelta: -1.3, rivalShareDelta: { megaflex: 0.8 } },
      ),
    ],
  },
  {
    id: 'category-survey',
    name: '카테고리 조사',
    description:
      '소비자 인식 조사를 빠르게 돌릴 수 있습니다. 당장 숫자는 안 움직여도 다음 가격 결정 정확도는 올라갑니다.',
    tags: ['리서치', '가격', '인사이트'],
    baseWeight: 0.75,
    economyBias: { steady: 0.9, recovery: 0.5 },
    choices: [
      createChoice(
        'commission-study',
        '정식 조사 집행',
        '성공 84% | 수요 해석 개선',
        0.84,
        '가격 민감도와 구매 이유가 또렷하게 잡혔습니다.',
        { capitalDelta: -9, demandAdjustmentDelta: 1.4, brandDelta: 0.6 },
        '비용 대비 인사이트가 아쉬웠습니다.',
        { capitalDelta: -11, demandAdjustmentDelta: 0.3 },
      ),
      createChoice(
        'scrape-community',
        '커뮤니티 반응만 본다',
        '성공 62% | 저비용',
        0.62,
        '거칠지만 쓸 만한 신호를 얻었습니다.',
        { capitalDelta: -3, demandAdjustmentDelta: 0.8 },
        '잡음에 속아 잘못된 결론을 내렸습니다.',
        { demandAdjustmentDelta: -0.9, brandDelta: -0.5 },
      ),
    ],
  },
  {
    id: 'export-inquiry',
    name: '수출 바이어 문의',
    description:
      '해외 바이어가 소량 테스트 발주를 문의했습니다. 성공하면 시장이 넓어지지만 문서와 인증 비용이 만만치 않습니다.',
    tags: ['수출', '테스트', '확장'],
    baseWeight: 0.84,
    economyBias: { recovery: 0.8, boom: 0.7 },
    debtBias: 'low',
    choices: [
      createChoice(
        'accept-pilot',
        '테스트 발주 수락',
        '성공 63% | 성장 옵션 확보',
        0.63,
        '작게 시작했지만 해외 반응이 예상보다 좋았습니다.',
        { capitalDelta: 14, brandDelta: 1.8, marketShareDelta: 0.6 },
        '인증 비용과 반품 리스크만 남았습니다.',
        { capitalDelta: -15, brandDelta: -0.8 },
      ),
      createChoice(
        'stay-domestic',
        '국내 집중',
        '성공 79% | 집중도 유지',
        0.79,
        '복잡도를 늘리지 않고 핵심 채널에 집중했습니다.',
        { demandAdjustmentDelta: 0.4, qualityDelta: 1.2 },
        '성장 기회를 미루며 내부 모멘텀이 약해졌습니다.',
        { brandDelta: -0.7 },
      ),
    ],
  },
  {
    id: 'community-pop-up',
    name: '커뮤니티 팝업',
    description:
      '로컬 커뮤니티와 함께 작은 오프라인 팝업을 열 수 있습니다. 판매보다 경험과 입소문이 목적입니다.',
    tags: ['오프라인', '입소문', '경험'],
    baseWeight: 0.78,
    economyBias: { recovery: 0.8, steady: 0.6 },
    rivalFocus: ['memecatch', 'aura'],
    choices: [
      createChoice(
        'host-popup',
        '직접 개최',
        '성공 71% | 브랜드 체감 상승',
        0.71,
        '작지만 진한 경험이 쌓이며 고객 반응이 좋아졌습니다.',
        { brandDelta: 2.8, marketShareDelta: 0.7, capitalDelta: -8 },
        '방문은 적고 인력만 묶였습니다.',
        { capitalDelta: -13, brandDelta: 0.5 },
      ),
      createChoice(
        'send-samples',
        '샘플만 뿌리기',
        '성공 82% | 가볍게 테스트',
        0.82,
        '작은 비용으로 호감도를 올렸습니다.',
        { brandDelta: 1.6, capitalDelta: -4 },
        '체험 밀도가 낮아 반응이 분산됐습니다.',
        { capitalDelta: -5, demandAdjustmentDelta: -0.2 },
      ),
    ],
  },
  {
    id: 'price-anchoring',
    name: '가격 앵커링 캠페인',
    description:
      '상위 패키지를 먼저 보여주고 주력 제품을 상대적으로 싸 보이게 만드는 가격 앵커링 실험입니다.',
    tags: ['가격전략', '구성', '전환'],
    baseWeight: 0.8,
    economyBias: { boom: 0.9, steady: 0.7 },
    choices: [
      createChoice(
        'anchor-bold',
        '고가 앵커 강조',
        '성공 65% | 단가 상승 기대',
        0.65,
        '고객이 주력 제품을 더 합리적으로 느끼기 시작했습니다.',
        { capitalDelta: 12, brandDelta: 1.2, demandAdjustmentDelta: 0.7 },
        '고객이 전반적으로 비싸다고 느끼며 이탈했습니다.',
        { marketShareDelta: -1.1, brandDelta: -0.7 },
      ),
      createChoice(
        'anchor-soft',
        '부드럽게 테스트',
        '성공 79% | 작은 개선',
        0.79,
        '전환 흐름이 살짝 좋아졌습니다.',
        { capitalDelta: 5, demandAdjustmentDelta: 0.4 },
        '효과가 미미해 거의 체감되지 않았습니다.',
        { capitalDelta: -2 },
      ),
    ],
  },
  {
    id: 'referral-drive',
    name: '추천 리워드',
    description:
      '기존 고객 추천 시 적립금을 주는 캠페인입니다. 바이럴을 노릴 수 있지만 추천 품질은 일정하지 않습니다.',
    tags: ['추천', '바이럴', '리워드'],
    baseWeight: 0.9,
    economyBias: { recovery: 0.8, boom: 0.8 },
    rivalFocus: ['memecatch'],
    choices: [
      createChoice(
        'launch-referral',
        '대대적으로 실행',
        '성공 69% | 신규 유입 확대',
        0.69,
        '추천 유입이 붙으며 고객 풀이 넓어졌습니다.',
        { marketShareDelta: 1.5, capitalDelta: -7, brandDelta: 0.8 },
        '적립금만 많이 나가고 질 낮은 유입이 늘었습니다.',
        { capitalDelta: -14, brandDelta: -0.6, demandAdjustmentDelta: -0.4 },
      ),
      createChoice(
        'vip-only',
        '상위 고객 한정',
        '성공 81% | 톤 유지',
        0.81,
        '브랜드를 지키면서도 추천 품질을 높였습니다.',
        { brandDelta: 1.5, marketShareDelta: 0.7, capitalDelta: -4 },
        '규모가 작아 반응이 크지 않았습니다.',
        { capitalDelta: -3 },
      ),
    ],
  },
]
const rivalCards = [
  {
    id: 'megaflex-dump-alert',
    name: '메가플렉스 덤핑 경보',
    description:
      '메가플렉스가 특정 채널에서 원가 이하에 가까운 가격으로 밀어붙이고 있습니다. 즉시 대응이 필요합니다.',
    tags: ['메가플렉스', '가격전쟁', '채널'],
    baseWeight: 1.3,
    economyBias: { slowdown: 1.1, steady: 0.7 },
    rivalFocus: ['megaflex'],
    choices: [
      createChoice(
        'rebate-defense',
        '한시적 리베이트',
        '성공 73% | 점유율 방어',
        0.73,
        '채널 이탈을 막으며 가격 공세를 버텼습니다.',
        { capitalDelta: -12, marketShareDelta: 1.5, rivalCapitalDelta: { megaflex: -18 } },
        '마진만 깎이고 주도권은 못 찾았습니다.',
        { capitalDelta: -18, marketShareDelta: 0.2 },
      ),
      createChoice(
        'hold-margin',
        '가격 방어선 유지',
        '성공 59% | 수익성 우선',
        0.59,
        '공세에 휘말리지 않고 마진을 지켰습니다.',
        { capitalDelta: 8, rivalPriceDelta: { megaflex: 0.8 } },
        '점유율이 눈에 띄게 흔들렸습니다.',
        { marketShareDelta: -1.7, rivalShareDelta: { megaflex: 1.6 } },
      ),
    ],
  },
  {
    id: 'megaflex-channel-bribe',
    name: '메가플렉스 채널 밀착',
    description:
      '메가플렉스가 주요 채널 MD와 판촉 예산을 묶어 움직이고 있다는 제보가 들어왔습니다.',
    tags: ['메가플렉스', '유통', '판촉'],
    baseWeight: 1,
    economyBias: { recovery: 0.7, steady: 0.9 },
    rivalFocus: ['megaflex'],
    choices: [
      createChoice(
        'match-promo',
        '판촉 예산 맞대응',
        '성공 67% | 진열 유지',
        0.67,
        '채널 점유 면적을 지켜내며 흐름을 막았습니다.',
        { capitalDelta: -11, marketShareDelta: 1.1, rivalCapitalDelta: { megaflex: -12 } },
        '예산만 태우고 성과가 제한적이었습니다.',
        { capitalDelta: -15, demandAdjustmentDelta: -0.3 },
      ),
      createChoice(
        'direct-channel',
        '상층부 직접 설득',
        '성공 55% | 성공 시 파급 큼',
        0.55,
        '채널 상층부 설득에 성공하며 메가플렉스 흐름을 끊었습니다.',
        { brandDelta: 1.4, marketShareDelta: 0.9, rivalShareDelta: { megaflex: -1.5 } },
        '오히려 관계만 어색해졌습니다.',
        { brandDelta: -1, marketShareDelta: -0.9 },
      ),
    ],
  },
  {
    id: 'megaflex-rumor',
    name: '메가플렉스 리콜 소문',
    description:
      '메가플렉스 제품 품질 문제 소문이 퍼지고 있습니다. 섣불리 확대하면 역풍을 맞을 수도 있습니다.',
    tags: ['메가플렉스', '소문', '품질'],
    baseWeight: 0.88,
    economyBias: { steady: 0.7, slowdown: 0.6 },
    rivalFocus: ['megaflex'],
    choices: [
      createChoice(
        'subtle-compare',
        '은근한 비교 광고',
        '성공 61% | 브랜드 우위 확보',
        0.61,
        '직접 언급하지 않고도 품질 우위를 부각했습니다.',
        { brandDelta: 2.2, marketShareDelta: 0.8, rivalCapitalDelta: { megaflex: -10 } },
        '비교 의도가 노골적으로 읽히며 불쾌감을 샀습니다.',
        { brandDelta: -1.2, capitalDelta: -5 },
      ),
      createChoice(
        'stay-clean',
        '자사 품질만 강조',
        '성공 79% | 리스크 낮음',
        0.79,
        '조용하지만 안정적으로 신뢰를 쌓았습니다.',
        { qualityDelta: 1.8, brandDelta: 1.4 },
        '메가플렉스의 이슈를 살리지 못했습니다.',
        { marketShareDelta: -0.4 },
      ),
    ],
  },
  {
    id: 'aura-editorial-push',
    name: '아우라 에디토리얼 공세',
    description:
      '아우라가 주요 매체 편집면을 장악했습니다. 프리미엄 이미지 전쟁에서 밀리면 회복이 어렵습니다.',
    tags: ['아우라', '브랜드', '미디어'],
    baseWeight: 1.2,
    economyBias: { boom: 1.1, steady: 0.7 },
    rivalFocus: ['aura'],
    choices: [
      createChoice(
        'commission-feature',
        '깊이 있는 콘텐츠 제작',
        '성공 66% | 브랜드 상승 큼',
        0.66,
        '제품 철학이 잘 전달되며 이미지가 단단해졌습니다.',
        { brandDelta: 3.8, capitalDelta: -12, rivalShareDelta: { aura: -1.1 } },
        '콘텐츠만 고급스럽고 전환은 약했습니다.',
        { brandDelta: 1.1, capitalDelta: -16 },
      ),
      createChoice(
        'ignore-battle',
        '직접 경쟁 회피',
        '성공 62% | 비용 절약',
        0.62,
        '불필요한 허영 경쟁을 피하며 내실을 챙겼습니다.',
        { capitalDelta: 7, qualityDelta: 1.2 },
        '프리미엄 카테고리 인식이 더 멀어졌습니다.',
        { brandDelta: -2, rivalShareDelta: { aura: 1.4 } },
      ),
    ],
  },
  {
    id: 'aura-celebrity-drop',
    name: '아우라 셀럽 협업',
    description:
      '아우라가 유명 인물 협업을 발표했습니다. 대응 없이 지나가면 상징성이 크게 벌어질 수 있습니다.',
    tags: ['아우라', '협업', '상징성'],
    baseWeight: 1,
    economyBias: { boom: 1.2, recovery: 0.6 },
    rivalFocus: ['aura'],
    choices: [
      createChoice(
        'counter-collab',
        '대체 협업 띄우기',
        '성공 58% | 성공 시 상징성 상쇄',
        0.58,
        '우리 쪽 협업도 화제가 되며 균형을 맞췄습니다.',
        { brandDelta: 2.8, capitalDelta: -14, marketShareDelta: 0.6 },
        '비교만 되며 예산 효율이 나빴습니다.',
        { capitalDelta: -20, brandDelta: -0.8 },
      ),
      createChoice(
        'product-story',
        '제품 스토리 강화',
        '성공 76% | 톤 유지',
        0.76,
        '인물 대신 제품의 이유를 설득력 있게 보여줬습니다.',
        { brandDelta: 2, qualityDelta: 1.3 },
        '이슈 주도권은 여전히 아우라 쪽이었습니다.',
        { brandDelta: -0.8, rivalShareDelta: { aura: 0.7 } },
      ),
    ],
  },
  {
    id: 'aura-flagship-leak',
    name: '아우라 플래그십 유출',
    description:
      '아우라의 신제품 사양이 일부 흘러나왔습니다. 대응을 빨리 잡으면 좋지만 성급하면 방향을 잘못 읽을 수 있습니다.',
    tags: ['아우라', '신제품', '포지셔닝'],
    baseWeight: 0.86,
    economyBias: { steady: 0.8, boom: 0.6 },
    rivalFocus: ['aura'],
    choices: [
      createChoice(
        'preempt-position',
        '선제 포지셔닝',
        '성공 63% | 브랜드 선점',
        0.63,
        '아우라보다 먼저 의미를 정의하며 고객 기대를 묶었습니다.',
        { brandDelta: 2.4, marketShareDelta: 0.7 },
        '잘못 읽고 어정쩡한 메시지만 남겼습니다.',
        { brandDelta: -1.1, demandAdjustmentDelta: -0.5 },
      ),
      createChoice(
        'wait-confirmation',
        '확인 후 대응',
        '성공 82% | 안전한 선택',
        0.82,
        '정보를 충분히 확인해 헛발질을 피했습니다.',
        { qualityDelta: 1.4, demandAdjustmentDelta: 0.3 },
        '속도가 느려 존재감이 약했습니다.',
        { brandDelta: -0.6 },
      ),
    ],
  },
  {
    id: 'memecatch-wave',
    name: '밈캐치 급상승 파도',
    description:
      '밈캐치가 숏폼 알고리즘을 타고 폭발적으로 퍼지고 있습니다. 무시하기엔 도달량이 너무 큽니다.',
    tags: ['밈캐치', '숏폼', '도달'],
    baseWeight: 1.2,
    economyBias: { recovery: 1, boom: 0.9 },
    rivalFocus: ['memecatch'],
    choices: [
      createChoice(
        'react-fast',
        '빠른 대응 콘텐츠',
        '성공 72% | 화제 전환',
        0.72,
        '타이밍 좋게 대응하며 주목 일부를 가져왔습니다.',
        { marketShareDelta: 1.6, capitalDelta: -7, rivalShareDelta: { memecatch: -1.2 } },
        '어색한 밈 사용으로 오히려 민망해졌습니다.',
        { brandDelta: -1.3, capitalDelta: -9 },
      ),
      createChoice(
        'stay-premise',
        '본질 메시지 유지',
        '성공 64% | 브랜드 손상 방지',
        0.64,
        '유행에 휩쓸리지 않고 제품의 강점을 지켰습니다.',
        { brandDelta: 1.5, qualityDelta: 1.1 },
        '관성 없이 지나가며 존재감이 묻혔습니다.',
        { marketShareDelta: -1.1, rivalShareDelta: { memecatch: 1 } },
      ),
    ],
  },
  {
    id: 'memecatch-live-raid',
    name: '밈캐치 라이브 공습',
    description:
      '밈캐치가 실시간 판매를 연속 편성했습니다. 이 시간대 우리 고객도 겹치는 편입니다.',
    tags: ['밈캐치', '라이브', '경합'],
    baseWeight: 0.96,
    economyBias: { recovery: 0.9, steady: 0.5 },
    rivalFocus: ['memecatch'],
    choices: [
      createChoice(
        'counter-slot',
        '맞불 편성',
        '성공 68% | 매출 방어',
        0.68,
        '시청자 이탈을 일부 되돌리며 타격을 줄였습니다.',
        { capitalDelta: 6, marketShareDelta: 1.1, rivalCapitalDelta: { memecatch: -11 } },
        '같은 시간대 경쟁으로 예산만 갈렸습니다.',
        { capitalDelta: -10, marketShareDelta: 0.2 },
      ),
      createChoice(
        'avoid-clash',
        '다른 시간대로 우회',
        '성공 74% | 효율형 대응',
        0.74,
        '정면 충돌을 피하며 효율 좋은 시간대를 확보했습니다.',
        { capitalDelta: 4, brandDelta: 0.8, demandAdjustmentDelta: 0.4 },
        '시차 대응이 약해 도달 손실이 남았습니다.',
        { marketShareDelta: -0.8 },
      ),
    ],
  },
  {
    id: 'memecatch-backlash',
    name: '밈캐치 역풍 조짐',
    description:
      '과한 바이럴 피로감 때문에 밈캐치에 대한 반감이 생기고 있습니다. 기회를 잡을 수 있지만 너무 노리면 역풍입니다.',
    tags: ['밈캐치', '역풍', '타이밍'],
    baseWeight: 0.82,
    economyBias: { steady: 0.6, slowdown: 0.5 },
    rivalFocus: ['memecatch'],
    choices: [
      createChoice(
        'quiet-convert',
        '조용히 전환 유도',
        '성공 77% | 안정적 흡수',
        0.77,
        '피로한 고객을 무리 없이 흡수했습니다.',
        { marketShareDelta: 1.2, brandDelta: 0.9, rivalShareDelta: { memecatch: -1.1 } },
        '생각보다 반감 폭이 작아 체감이 약했습니다.',
        { marketShareDelta: 0.3 },
      ),
      createChoice(
        'mock-them',
        '대놓고 꼬집기',
        '성공 46% | 리스크 큼',
        0.46,
        '공격적인 메시지가 통하며 밈캐치 흐름을 끊었습니다.',
        { brandDelta: 1.5, marketShareDelta: 1.5, rivalCapitalDelta: { memecatch: -14 } },
        '유치한 싸움처럼 보여 우리 이미지도 깎였습니다.',
        { brandDelta: -2.2, capitalDelta: -6 },
      ),
    ],
  },
  {
    id: 'nexus-patent-letter',
    name: '넥서스코어 특허 경고장',
    description:
      '넥서스코어가 특허 침해 가능성을 언급하는 경고장을 보냈습니다. 실제 소송 전 단계지만 무시하긴 어렵습니다.',
    tags: ['넥서스코어', '특허', '법무'],
    baseWeight: 1.1,
    economyBias: { steady: 0.8, slowdown: 0.7 },
    rivalFocus: ['nexuscore'],
    choices: [
      createChoice(
        'lawyer-up',
        '법무 대응 강화',
        '성공 71% | 기술 압박 완화',
        0.71,
        '넥서스코어가 한발 물러서며 즉시 리스크를 줄였습니다.',
        { capitalDelta: -12, qualityDelta: 2.4, rivalCapitalDelta: { nexuscore: -15 } },
        '법무비만 쓰고 명확한 진전이 없었습니다.',
        { capitalDelta: -18, demandAdjustmentDelta: -0.3 },
      ),
      createChoice(
        'design-around',
        '우회 설계 검토',
        '성공 63% | 중장기 안전',
        0.63,
        '우회 설계 가능성이 보여 기술 자율성이 생겼습니다.',
        { qualityDelta: 3.2, rdTierDelta: 1, capitalDelta: -10 },
        '시간만 끌다 출시 리듬을 잃었습니다.',
        { capitalDelta: -11, marketShareDelta: -0.9 },
      ),
    ],
  },
  {
    id: 'nexus-chip-allocation',
    name: '넥서스코어 부품 선점',
    description:
      '넥서스코어가 핵심 부품 물량을 먼저 잠그고 있습니다. 지금 대응하지 않으면 생산계획이 흔들릴 수 있습니다.',
    tags: ['넥서스코어', '부품', '선점'],
    baseWeight: 1.05,
    economyBias: { recovery: 0.7, boom: 0.5 },
    rivalFocus: ['nexuscore'],
    factoryBias: 'owned',
    choices: [
      createChoice(
        'prebook-stock',
        '선매입으로 대응',
        '성공 69% | 생산 안정',
        0.69,
        '물량을 확보해 생산 차질 리스크를 낮췄습니다.',
        { capitalDelta: -15, qualityDelta: 1.8, demandAdjustmentDelta: 0.5 },
        '재고만 묶이고 가격 메리트가 사라졌습니다.',
        { capitalDelta: -20, debtDelta: 5 },
      ),
      createChoice(
        'alt-supplier',
        '대체 공급선 탐색',
        '성공 56% | 성공 시 단가 방어',
        0.56,
        '대체선 확보에 성공해 원가와 품질을 동시에 지켰습니다.',
        { costAdjustmentDelta: -0.7, qualityDelta: 1.4, rivalCapitalDelta: { nexuscore: -10 } },
        '대체선 품질이 낮아 오히려 더 흔들렸습니다.',
        { qualityDelta: -2.4, costAdjustmentDelta: 0.5 },
      ),
    ],
  },
  {
    id: 'nexus-benchmark-leak',
    name: '넥서스코어 벤치마크 유출',
    description:
      '넥서스코어 신제품 벤치마크 수치가 업계에 돌고 있습니다. 성능 격차를 그대로 두면 기술 리더십이 멀어집니다.',
    tags: ['넥서스코어', '성능', 'R&D'],
    baseWeight: 0.94,
    economyBias: { steady: 0.8, boom: 0.4 },
    rivalFocus: ['nexuscore'],
    choices: [
      createChoice(
        'rd-sprint',
        'R&D 스프린트',
        '성공 61% | 기술 따라잡기',
        0.61,
        '집중 개발이 통하며 품질 격차를 좁혔습니다.',
        { capitalDelta: -18, qualityDelta: 4.4, rdTierDelta: 1 },
        '성과가 늦게 나오며 비용만 선반영됐습니다.',
        { capitalDelta: -22, qualityDelta: 0.8 },
      ),
      createChoice(
        'reframe-value',
        '성능보다 실사용 강조',
        '성공 75% | 이미지 방어',
        0.75,
        '기술 수치보다 실제 효용을 설득하며 비교 전장을 바꿨습니다.',
        { brandDelta: 2.2, marketShareDelta: 0.7 },
        '메시지가 약해 기술 열세만 더 부각됐습니다.',
        { brandDelta: -1.1, marketShareDelta: -0.7 },
      ),
    ],
  },
]
const wildcardCards = [
  {
    id: 'energy-spike',
    name: '에너지 요금 급등',
    description:
      '이번 달 공장 에너지 단가가 갑자기 뛰었습니다. 흡수할지, 고객가에 일부 전가할지 선택이 필요합니다.',
    tags: ['원가', '에너지', '판단'],
    baseWeight: 0.9,
    economyBias: { slowdown: 0.9, steady: 0.6 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'absorb-hit',
        '원가를 흡수',
        '성공 73% | 고객 반발 없음',
        0.73,
        '고객가를 건드리지 않고 충격을 내부에서 흡수했습니다.',
        { capitalDelta: -14, brandDelta: 0.8 },
        '생각보다 타격이 커 현금이 훅 빠졌습니다.',
        { capitalDelta: -22, debtDelta: 5 },
      ),
      createChoice(
        'share-burden',
        '부담 일부 전가',
        '성공 58% | 마진 방어',
        0.58,
        '고객 이탈을 크게 만들지 않고 마진을 지켰습니다.',
        { capitalDelta: 8, demandAdjustmentDelta: -0.4 },
        '민감한 고객이 빠르게 가격에 반응했습니다.',
        { marketShareDelta: -1.2, brandDelta: -0.7 },
      ),
    ],
  },
  {
    id: 'labor-whisper',
    name: '현장 이직 소문',
    description:
      '핵심 작업자 몇 명이 경쟁사 면접을 보고 있다는 말이 돌고 있습니다. 붙잡으려면 비용이 듭니다.',
    tags: ['인력', '현장', '유지'],
    baseWeight: 0.78,
    economyBias: { recovery: 0.7, boom: 0.6 },
    factoryBias: 'owned',
    choices: [
      createChoice(
        'retention-package',
        '잔류 패키지 제시',
        '성공 75% | 기술 유출 방지',
        0.75,
        '핵심 작업자를 붙잡아 생산 안정성을 지켰습니다.',
        { capitalDelta: -9, qualityDelta: 2.1, brandDelta: 0.5 },
        '기대만 올리고 만족감은 낮았습니다.',
        { capitalDelta: -12, qualityDelta: -0.8 },
      ),
      createChoice(
        'train-backups',
        '백업 인력 육성',
        '성공 66% | 중장기 대응',
        0.66,
        '핵심 의존도를 낮추며 라인 복원력을 높였습니다.',
        { capitalDelta: -6, qualityDelta: 1.5, demandAdjustmentDelta: 0.3 },
        '당장 공백을 메우지 못해 생산이 흔들렸습니다.',
        { marketShareDelta: -0.8, qualityDelta: -1.1 },
      ),
    ],
  },
  {
    id: 'regulator-questionnaire',
    name: '규제기관 질의서',
    description:
      '표기와 광고 문구에 대한 질의서가 왔습니다. 성실히 응답하면 안전하지만 홍보 일정이 늦어질 수 있습니다.',
    tags: ['규제', '광고', '리스크'],
    baseWeight: 0.72,
    economyBias: { steady: 0.8, slowdown: 0.5 },
    choices: [
      createChoice(
        'reply-thoroughly',
        '성실히 대응',
        '성공 83% | 리스크 최소',
        0.83,
        '큰 문제 없이 정리되며 불확실성이 줄었습니다.',
        { capitalDelta: -5, brandDelta: 1, demandAdjustmentDelta: 0.3 },
        '서류 작업이 길어져 일정이 밀렸습니다.',
        { capitalDelta: -8, marketShareDelta: -0.4 },
      ),
      createChoice(
        'minimal-response',
        '최소 대응',
        '성공 52% | 비용 절감',
        0.52,
        '다행히 추가 문제 없이 넘어갔습니다.',
        { capitalDelta: 2 },
        '추가 질의가 이어지며 광고 집행이 막혔습니다.',
        { capitalDelta: -11, brandDelta: -1.2, marketShareDelta: -0.7 },
      ),
    ],
  },
  {
    id: 'logistics-gridlock',
    name: '물류 병목',
    description:
      '주요 물류 거점이 막히며 납기가 흔들리고 있습니다. 빠른 특송을 쓰면 비싸고, 기다리면 점유율이 빠질 수 있습니다.',
    tags: ['물류', '납기', '비용'],
    baseWeight: 0.85,
    economyBias: { recovery: 0.6, steady: 0.7 },
    choices: [
      createChoice(
        'use-express',
        '특송으로 뚫기',
        '성공 79% | 납기 방어',
        0.79,
        '비용은 들었지만 채널 신뢰를 지켰습니다.',
        { capitalDelta: -12, marketShareDelta: 0.8, brandDelta: 0.6 },
        '특송까지 썼는데도 지연분을 다 못 막았습니다.',
        { capitalDelta: -16, marketShareDelta: -0.3 },
      ),
      createChoice(
        'prioritize-best',
        '핵심 채널만 우선',
        '성공 68% | 선택과 집중',
        0.68,
        '가장 중요한 채널을 지키며 손실을 제한했습니다.',
        { marketShareDelta: 0.4, demandAdjustmentDelta: 0.4 },
        '우선순위에서 밀린 채널이 등을 돌렸습니다.',
        { marketShareDelta: -1, brandDelta: -0.6 },
      ),
    ],
  },
  {
    id: 'currency-tailwind',
    name: '환율 순풍',
    description:
      '환율 움직임이 유리하게 작용해 일부 조달비가 낮아질 수 있습니다. 지금 락인하면 안전하지만 상승 탄력은 놓칠 수도 있습니다.',
    tags: ['환율', '조달', '선택'],
    baseWeight: 0.7,
    economyBias: { recovery: 0.7, boom: 0.7 },
    choices: [
      createChoice(
        'lock-rate',
        '유리할 때 잠그기',
        '성공 81% | 안정적 절감',
        0.81,
        '조달비 일부를 안정적으로 낮추는 데 성공했습니다.',
        { costAdjustmentDelta: -0.7, capitalDelta: 6 },
        '절감 폭은 작았지만 손해는 적었습니다.',
        { costAdjustmentDelta: -0.2, capitalDelta: 2 },
      ),
      createChoice(
        'ride-wave',
        '조금 더 기다리기',
        '성공 54% | 성공 시 보상 큼',
        0.54,
        '환율이 더 유리해지며 기대 이상 절감했습니다.',
        { costAdjustmentDelta: -1.1, capitalDelta: 10 },
        '되레 반대로 움직여 원가 메리트를 놓쳤습니다.',
        { costAdjustmentDelta: 0.5, capitalDelta: -6 },
      ),
    ],
  },
  {
    id: 'city-blackout',
    name: '도심 정전 루머',
    description:
      '주요 상권에서 단기 정전 가능성이 언급됩니다. 오프라인 채널이 흔들릴 수 있어 미리 대비하면 기회가 될 수도 있습니다.',
    tags: ['상권', '리스크', '대응'],
    baseWeight: 0.68,
    economyBias: { steady: 0.7, slowdown: 0.4 },
    choices: [
      createChoice(
        'prep-online',
        '온라인 전환 준비',
        '성공 72% | 수요 흡수',
        0.72,
        '오프라인 공백을 온라인 주문으로 흡수했습니다.',
        { marketShareDelta: 1, capitalDelta: 5, demandAdjustmentDelta: 0.7 },
        '준비는 했지만 실제 전환 효과는 약했습니다.',
        { capitalDelta: -4, demandAdjustmentDelta: 0.1 },
      ),
      createChoice(
        'wait-and-see',
        '상황 관망',
        '성공 76% | 비용 최소',
        0.76,
        '소문이 과장된 것으로 드러나 불필요한 비용을 아꼈습니다.',
        { capitalDelta: 4 },
        '예상보다 영향이 커서 준비 부족이 드러났습니다.',
        { marketShareDelta: -0.9, brandDelta: -0.5 },
      ),
    ],
  },
]

export const EVENT_CARDS = [
  ...financeCards,
  ...operationsCards,
  ...marketCards,
  ...rivalCards,
  ...wildcardCards,
]

if (EVENT_CARDS.length !== 45) {
  throw new Error(`EVENT_CARDS must contain exactly 45 cards. Received: ${EVENT_CARDS.length}`)
}

const EVENT_CARD_MAP = Object.fromEntries(EVENT_CARDS.map((card) => [card.id, card]))

export function getEventCardById(cardId) {
  return EVENT_CARD_MAP[cardId] ?? null
}

function calculateCardWeight(card, context) {
  if (card.minMonth && context.month < card.minMonth) {
    return 0
  }

  let weight = card.baseWeight ?? 1
  weight += card.economyBias?.[context.economyPhase] ?? 0

  if (card.debtBias) {
    weight += card.debtBias === context.debtBand ? 1.15 : -0.15
  }

  if (card.factoryBias === 'owned') {
    weight += context.factoryCount >= 1 ? 1 : -0.55
  }

  if (card.factoryBias === 'multi') {
    weight += context.factoryCount >= 2 ? 1.45 : -0.75
  }

  if (card.factoryBias === 'none') {
    weight += context.factoryCount === 0 ? 1.15 : 0.2
  }

  if (card.rivalFocus?.some((rivalId) => context.activeRivals.includes(rivalId))) {
    weight += 1.05
  }

  return Math.max(weight, 0.1)
}

export function drawWeightedEventCards(context, count = 3) {
  const pool = [...EVENT_CARDS]
  const selections = []

  while (selections.length < count && pool.length > 0) {
    const weights = pool.map((card) => calculateCardWeight(card, context))
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)

    if (totalWeight <= 0) {
      break
    }

    let cursor = Math.random() * totalWeight
    let chosenIndex = 0

    for (let index = 0; index < pool.length; index += 1) {
      cursor -= weights[index]

      if (cursor <= 0) {
        chosenIndex = index
        break
      }
    }

    selections.push(pool.splice(chosenIndex, 1)[0])
  }

  return selections
}
