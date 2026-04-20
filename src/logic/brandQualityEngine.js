import { STRATEGIES } from '../constants/strategies.js'

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function avgRange(rangeOrNumber, fallback = 0) {
  if (typeof rangeOrNumber === 'number') {
    return rangeOrNumber
  }

  if (!rangeOrNumber || typeof rangeOrNumber.min !== 'number' || typeof rangeOrNumber.max !== 'number') {
    return fallback
  }

  return Math.round((rangeOrNumber.min + rangeOrNumber.max) / 2)
}

export function applyStrategyEffect(state, strategyId) {
  const strategy = STRATEGIES[strategyId]
  const effect = strategy?.effect
  let { qualityScore, brandValue, capital } = state

  if (!strategy || !effect) {
    return { qualityScore, brandValue, capital, log: '현상 유지' }
  }

  switch (strategyId) {
    case 'quality': {
      const qualityGain = randInt(effect.qualityBonus.min, effect.qualityBonus.max)
      const brandLoss = randInt(effect.brandPenalty.min, effect.brandPenalty.max)
      qualityScore += qualityGain
      brandValue -= brandLoss
      capital -= effect.capitalCost
      return {
        qualityScore,
        brandValue,
        capital,
        log: `품질 +${qualityGain} / 브랜드 -${brandLoss}`,
      }
    }
    case 'branding': {
      const brandGain = randInt(effect.brandBonus.min, effect.brandBonus.max)
      brandValue += brandGain
      capital -= effect.capitalCost
      return {
        qualityScore,
        brandValue,
        capital,
        log: `브랜드 +${brandGain}`,
      }
    }
    case 'dumping': {
      const brandLoss = randInt(effect.brandPenalty.min, effect.brandPenalty.max)
      const qualityLoss = randInt(effect.qualityPenalty.min, effect.qualityPenalty.max)
      brandValue -= brandLoss
      qualityScore -= qualityLoss
      return {
        qualityScore,
        brandValue,
        capital,
        log: `브랜드 -${brandLoss} / 품질 -${qualityLoss}`,
      }
    }
    case 'safe':
    default:
      return {
        qualityScore,
        brandValue,
        capital,
        log: '현상 유지',
      }
  }
}

export function previewStrategyEffect(state, strategyId) {
  const strategy = STRATEGIES[strategyId]
  const effect = strategy?.effect
  let { qualityScore, brandValue, capital } = state

  if (!strategy || !effect) {
    return { qualityScore, brandValue, capital, log: '현상 유지' }
  }

  switch (strategyId) {
    case 'quality': {
      const qualityGain = avgRange(effect.qualityBonus)
      const brandLoss = avgRange(effect.brandPenalty)
      qualityScore += qualityGain
      brandValue -= brandLoss
      capital -= effect.capitalCost
      return {
        qualityScore,
        brandValue,
        capital,
        log: `품질 +${qualityGain} / 브랜드 -${brandLoss}`,
      }
    }
    case 'branding': {
      const brandGain = avgRange(effect.brandBonus)
      brandValue += brandGain
      capital -= effect.capitalCost
      return {
        qualityScore,
        brandValue,
        capital,
        log: `브랜드 +${brandGain}`,
      }
    }
    case 'dumping': {
      const brandLoss = avgRange(effect.brandPenalty)
      const qualityLoss = avgRange(effect.qualityPenalty)
      brandValue -= brandLoss
      qualityScore -= qualityLoss
      return {
        qualityScore,
        brandValue,
        capital,
        log: `브랜드 -${brandLoss} / 품질 -${qualityLoss}`,
      }
    }
    case 'safe':
    default:
      return {
        qualityScore,
        brandValue,
        capital,
        log: '현상 유지',
      }
  }
}
