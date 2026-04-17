export const ECO_PHASE_ORDER = [
  'boom',
  'growth',
  'stable',
  'contraction',
  'recession',
]

export const ECO_WEIGHTS = {
  essential: {
    boom: 0.85,
    growth: 0.95,
    stable: 1.0,
    contraction: 1.1,
    recession: 1.3,
  },
  normal: {
    boom: 1.4,
    growth: 1.2,
    stable: 1.0,
    contraction: 0.8,
    recession: 0.6,
  },
  luxury: {
    boom: 1.9,
    growth: 1.5,
    stable: 1.0,
    contraction: 0.55,
    recession: 0.25,
  },
}

export const ECO_TRANSITIONS = {
  boom: { boom: 0.4, growth: 0.5, stable: 0.1, contraction: 0, recession: 0 },
  growth: { boom: 0.25, growth: 0.45, stable: 0.25, contraction: 0.05, recession: 0 },
  stable: { boom: 0.05, growth: 0.2, stable: 0.45, contraction: 0.25, recession: 0.05 },
  contraction: {
    boom: 0,
    growth: 0.1,
    stable: 0.3,
    contraction: 0.4,
    recession: 0.2,
  },
  recession: {
    boom: 0,
    growth: 0,
    stable: 0.3,
    contraction: 0.45,
    recession: 0.25,
  },
}

export const ECO_RATE_ADJ = {
  boom: 0.025,
  growth: 0.01,
  stable: 0,
  contraction: -0.01,
  recession: -0.02,
}

export const ECO_DISPLAY = {
  boom: { label: '호황', icon: '🚀', color: '#F0A500' },
  growth: { label: '성장', icon: '📈', color: '#4ADE80' },
  stable: { label: '평시', icon: '➡️', color: '#94A3B8' },
  contraction: { label: '위축', icon: '📉', color: '#FB923C' },
  recession: { label: '불황', icon: '🔻', color: '#FF6B6B' },
}
