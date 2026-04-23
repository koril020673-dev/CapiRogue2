import { PLAYER_EVENTS, SITUATION_EVENTS } from '../constants/docEvents.js'

export const EVENT_TYPE = {
  SITUATION: 'situation',
  PLAYER: 'player',
}

export function drawEventCards(state) {
  const { floor, econPhase, factory, debt, brandValue, capital, rivals = [] } = state

  const situationCard = drawSituationEvent(floor, econPhase)
  const playerCard = drawPlayerEvent(floor, econPhase, {
    hasFactory: Boolean(factory?.built),
    hasDebt: debt > 0,
    hasBrand: brandValue > 30,
    isLowHealth: state.companyHealth <= 4,
    isHighCapital: capital > 100_000_000,
    rivalCount: rivals.filter((rival) => !rival.bankrupt && !rival.eliminated).length,
  })

  return { situationCard, playerCard }
}

function drawSituationEvent(floor, econPhase) {
  const pool = SITUATION_EVENTS.filter((event) => floor >= (event.minFloor ?? 1))
  return weightedDraw(pool, (event) => event.phaseWeight?.[econPhase] ?? 1)
}

function drawPlayerEvent(floor, econPhase, playerState) {
  const pool = PLAYER_EVENTS.filter((event) => {
    if (event.requireFactory && !playerState.hasFactory) return false
    if (event.requireDebt && !playerState.hasDebt) return false
    if (event.requireBrand && !playerState.hasBrand) return false
    if (event.minFloor && floor < event.minFloor) return false
    return true
  })

  return weightedDraw(pool, (event) => {
    let weight = event.phaseWeight?.[econPhase] ?? 1
    if (event.boostOnLowHealth && playerState.isLowHealth) weight *= 2
    if (event.boostOnHighCap && playerState.isHighCapital) weight *= 1.5
    if (event.boostOnRivals && playerState.rivalCount > 2) weight *= 1.5
    return weight
  })
}

function weightedDraw(pool, weightFn) {
  if (pool.length === 0) {
    return null
  }

  const weights = pool.map((entry) => Math.max(0, weightFn(entry)))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) {
    return pool[Math.floor(Math.random() * pool.length)]
  }

  let cursor = Math.random() * total
  for (let index = 0; index < pool.length; index += 1) {
    cursor -= weights[index]
    if (cursor <= 0) {
      return pool[index]
    }
  }

  return pool[pool.length - 1]
}
