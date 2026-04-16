const TRANSITIONS = {
  boom: { boom: 0.35, stable: 0.5, recession: 0.15 },
  stable: { boom: 0.2, stable: 0.55, recession: 0.25 },
  recession: { boom: 0.1, stable: 0.45, recession: 0.45 },
}

export function advanceEconPhase(current, boomBonus = 0) {
  const t = TRANSITIONS[current] ?? TRANSITIONS.stable
  const adjusted = {
    boom: Math.min(1, t.boom + boomBonus),
    stable: t.stable,
    recession: Math.max(0, t.recession - boomBonus),
  }

  const total = adjusted.boom + adjusted.stable + adjusted.recession
  const normalized = {
    boom: adjusted.boom / total,
    stable: adjusted.stable / total,
    recession: adjusted.recession / total,
  }

  const r = Math.random()
  let acc = 0

  for (const [phase, prob] of Object.entries(normalized)) {
    acc += prob
    if (r < acc) return phase
  }

  return 'stable'
}
