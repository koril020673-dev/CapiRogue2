import { ECO_TRANSITIONS } from '../constants/economy.js'

export function advanceEconPhase(current, boomBonus = 0) {
  const transition = { ...(ECO_TRANSITIONS[current] ?? ECO_TRANSITIONS.stable) }

  transition.boom = Math.min(1, transition.boom + boomBonus)
  transition.recession = Math.max(0, transition.recession - boomBonus)

  const total = Object.values(transition).reduce((sum, value) => sum + value, 0)
  const normalized = Object.fromEntries(
    Object.entries(transition).map(([phase, probability]) => [
      phase,
      probability / Math.max(total, 1),
    ]),
  )

  const random = Math.random()
  let cursor = 0

  for (const [phase, probability] of Object.entries(normalized)) {
    cursor += probability
    if (random <= cursor) {
      return phase
    }
  }

  return 'stable'
}
