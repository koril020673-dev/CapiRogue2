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
    desc: '설명충. 모든 정보를 준다. 비싸다.',
    unlockCondition: 'always',
    fee: { type: 'percent', value: 0.08, lossFixed: 200000 },
    info: 'full',
    passive: null,
    special: null,
    themeColor: '#60A5FA',
  },
  trader: {
    id: 'trader',
    icon: '📈',
    name: 'Trader',
    desc: '빠르고 직관적. 핵심만 보여준다.',
    unlockCondition: 'clear × 1',
    fee: { type: 'fixed', value: 100000 },
    info: 'market',
    passive: 'volume strategy effect +10%',
    special: 'economic war: win round → rival health -1 extra',
    themeColor: '#F97316',
  },
  strategist: {
    id: 'strategist',
    icon: '🧭',
    name: 'Strategist',
    desc: '안정 추구. 한 발 앞의 국면을 읽는다.',
    unlockCondition: 'clear × 2',
    fee: { type: 'percent', value: 0.05, lossFixed: 0 },
    info: 'macro',
    passive: 'safe strategy effect +20%',
    special: 'economic war entry: health +2 auto',
    themeColor: '#34D399',
  },
  quant: {
    id: 'quant',
    icon: '🧮',
    name: 'Quant',
    desc: '냉정한 숫자 기계.',
    unlockCondition: 'Analyst × 5 plays',
    fee: { type: 'credit', value: -100 },
    info: 'full+',
    passive: 'momentum effect ×1.5',
    special: 'every 10 floors: rival detailed report',
    themeColor: '#A78BFA',
  },
  auditor: {
    id: 'auditor',
    icon: '🧾',
    name: 'Auditor',
    desc: '재무 관리 전문가.',
    unlockCondition: 'clear × 3',
    fee: null,
    info: 'finance',
    passive: 'debt interest -10%',
    special: 'on loss: auto 1-line cause analysis shown',
    themeColor: '#FACC15',
  },
  economist: {
    id: 'economist',
    icon: '🌐',
    name: 'Economist',
    desc: '거시경제 분석형.',
    unlockCondition: 'reach floor 50 × 3',
    fee: { type: 'percent', value: 0.03 },
    info: 'macro+',
    passive: 'contraction/recession demand loss -10%',
    special: 'black swan: 1 floor advance warning',
    themeColor: '#2DD4BF',
  },
  venture: {
    id: 'venture',
    icon: '🚀',
    name: 'Venture',
    desc: '공격형. 위험을 감수한다.',
    unlockCondition: 'economic war win × 10 cumulative',
    fee: null,
    info: 'rival',
    passive: 'economic war win: Credit +200C extra',
    special: 'rival retreat: next appearance delayed 2 floors',
    themeColor: '#F43F5E',
  },
  arbitrageur: {
    id: 'arbitrageur',
    icon: '♻️',
    name: 'Arbitrageur',
    desc: '국면 전환점을 활용하는 전문가.',
    unlockCondition: 'legacy cards × 5 accumulated',
    fee: null,
    info: 'phase',
    passive: 'category switch: no cost',
    special: 'on phase change: demand +15% for 1 floor',
    themeColor: '#8B5CF6',
  },
  actuary: {
    id: 'actuary',
    icon: '🛟',
    name: 'Actuary',
    desc: '생존 특화. 파산 방어형.',
    unlockCondition: 'reach floor 80 × 3',
    fee: { type: 'credit', value: 100 },
    info: 'health',
    passive: 'critical loss(-3) chance -30% when health > 1',
    special: 'once per game: survive at health 1 instead of 0',
    themeColor: '#06B6D4',
  },
  sovereign: {
    id: 'sovereign',
    icon: '👑',
    name: 'Sovereign',
    desc: '최종 해금. 균형형 전문가.',
    unlockCondition: 'use 5+ different advisors',
    fee: null,
    info: 'full',
    passive: null,
    special: 'each economic war: rival enters with health -1',
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
      return (meta.economicWarWins ?? 0) >= 10
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
