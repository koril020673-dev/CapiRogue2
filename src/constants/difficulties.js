export const DIFFICULTIES = {
  easy: {
    id: 'easy',
    label: '이지',
    icon: '🤖',
    capital: 100000000,
    debt: 0,
    interestRate: 0.048,
    infoQuality: 'full',
    description: '초기 자본 1억. 정확한 정보 제공.',
  },
  normal: {
    id: 'normal',
    label: '노멀',
    icon: '📋',
    capital: 50000000,
    debt: 0,
    interestRate: 0.06,
    infoQuality: 'partial',
    description: '초기 자본 5천만. 일부 정보 숨김.',
  },
  hard: {
    id: 'hard',
    label: '하드',
    icon: '📡',
    capital: 30000000,
    debt: 0,
    interestRate: 0.06,
    infoQuality: 'limited',
    description: '초기 자본 3천만. 거시 지표만 제공.',
  },
  insane: {
    id: 'insane',
    label: '인세인',
    icon: '💀',
    capital: 10000000,
    debt: 50000000,
    interestRate: 0.144,
    infoQuality: 'noisy',
    description: '초기 자본 1천만. 부채 5천만. 허위 정보 30%.',
  },
}

export const DIFFICULTY_ORDER = ['easy', 'normal', 'hard', 'insane']
