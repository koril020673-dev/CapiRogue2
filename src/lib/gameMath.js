export const QUALITY_MODES = {
  budget: {
    id: 'budget',
    label: '가성비',
    description: '낮은 원가로 물량을 노리는 선택',
  },
  standard: {
    id: 'standard',
    label: '표준',
    description: '가격과 품질의 균형을 맞춘 운영',
  },
  premium: {
    id: 'premium',
    label: '프리미엄',
    description: '높은 품질로 마진과 브랜드를 노리는 선택',
  },
}

export const QUALITY_MODE_ORDER = ['budget', 'standard', 'premium']

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function roundTo(value, decimals = 1) {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

export function getDebtBand({ capital, debt }) {
  const denominator = Math.max(capital + debt, 1)
  const ratio = debt / denominator

  if (ratio >= 0.48) {
    return 'high'
  }

  if (ratio >= 0.24) {
    return 'medium'
  }

  return 'low'
}

export function getRivalStatus(rival) {
  if (!rival || rival.bankrupt || rival.eliminated || rival.capital <= 0) {
    return 'bankrupt'
  }

  const pct = rival.initialCapital > 0 ? rival.capital / rival.initialCapital : 0

  if (pct >= 0.7 && rival.isAggressive) {
    return 'attacking'
  }

  if (pct >= 0.4) {
    return 'watching'
  }

  return 'crisis'
}

export function evaluateRivalStatus({ rivalState, initialCapital }) {
  if (!rivalState || rivalState.bankrupt || rivalState.eliminated || rivalState.capital <= 0) {
    return '퇴출'
  }

  const pct = initialCapital > 0 ? rivalState.capital / initialCapital : 0

  if (pct >= 0.7 && rivalState.isAggressive) {
    return '공세중'
  }

  if (pct >= 0.4) {
    return '관망중'
  }

  return '위기'
}

export function getRivalHealthLevel(rival) {
  const pct = rival.initialCapital > 0 ? rival.capital / rival.initialCapital : 0

  if (pct >= 0.7) {
    return 'high'
  }

  if (pct >= 0.4) {
    return 'mid'
  }

  if (pct >= 0.2) {
    return 'low'
  }

  return 'critical'
}
