export const CREDIT_SHOP = [
  { id: 'health', label: '체력 +2', baseCost: 100, effect: { companyHealth: 2 } },
  { id: 'reroll', label: '이벤트 카드 리롤', baseCost: 100, effect: { rerollEvent: true } },
  { id: 'no_waste', label: '이번 층 폐기 면제', baseCost: 100, effect: { noWaste: true, turnsLeft: 1 } },
  { id: 'freeze', label: '라이벌 1층 동결', baseCost: 200, effect: { rivalFreeze: true, turnsLeft: 1 } },
  { id: 'preview', label: '전략 결과 미리보기', baseCost: 200, effect: { preview: true, turnsLeft: 1 } },
]
