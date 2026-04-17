import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import { BLACK_SWANS } from '../constants/blackSwans.js'
import { DIFFICULTIES } from '../constants/difficulties.js'
import { ECO_DISPLAY, ECO_WEIGHTS } from '../constants/economy.js'
import { ECONOMIC_WARS } from '../constants/economicWars.js'
import { getEducationHint } from '../constants/educationHints.js'
import { drawWeightedEventCards, getEventCardById } from '../constants/eventCards.js'
import { LEGACY_CONDITIONS } from '../constants/legacy.js'
import { CREDIT_SHOP } from '../constants/rewards.js'
import {
  RIVAL_NAMES,
  RIVALS,
  RIVAL_ORDER,
  createInitialRivals,
} from '../constants/rivals.js'
import { STRATEGIES, VENDOR, VENDOR_MODE_MUL } from '../constants/strategies.js'
import { clamp, roundTo } from '../lib/gameMath.js'
import { getCreditShopPrice } from '../logic/creditEngine.js'
import { calcDemand } from '../logic/demandEngine.js'
import { advanceEconPhase } from '../logic/econEngine.js'
import { applyHealth, calcHealthDelta } from '../logic/healthEngine.js'
import { calcAttraction } from '../logic/marketEngine.js'
import {
  loadLegacyCards,
  loadMeta,
  recordGameEnd,
  saveLegacyCards,
} from '../logic/metaEngine.js'
import { getMomentumEffect, updateMomentum } from '../logic/momentumEngine.js'
import { createRewardDraft } from '../logic/rewardEngine.js'
import {
  applyRivalHealthDamage,
  applyShareDamage,
  calcRivalShares,
  ensureRivalsJoined,
  updateRivalsFromSettlement,
} from '../logic/rivalEngine.js'
import { calcSettlement } from '../logic/settlementEngine.js'

const MAX_HEALTH = 10

function createToast(message, tone = 'neutral') {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    message,
    tone,
  }
}

function getEffectValue(state, type) {
  return (state.activeEffects ?? [])
    .filter((effect) => effect.type === type)
    .reduce((sum, effect) => sum + Number(effect.value ?? 0), 0)
}

function hasEffect(state, type) {
  return (state.activeEffects ?? []).some((effect) => effect.type === type)
}

function nextEffectList(activeEffects = []) {
  return activeEffects
    .map((effect) => ({
      ...effect,
      turnsLeft:
        effect.turnsLeft === undefined || effect.turnsLeft === null
          ? effect.turnsLeft
          : effect.turnsLeft - 1,
    }))
    .filter((effect) => effect.turnsLeft === undefined || effect.turnsLeft === null || effect.turnsLeft > 0)
}

function createEventContext(state) {
  const economyPhase =
    state.econPhase === 'growth'
      ? 'recovery'
      : state.econPhase === 'contraction' || state.econPhase === 'recession'
        ? 'slowdown'
        : state.econPhase === 'stable'
          ? 'steady'
          : 'boom'

  return {
    economyPhase,
    debtBand:
      state.debt > state.capital * 0.5 ? 'high' : state.debt > state.capital * 0.2 ? 'medium' : 'low',
    factoryCount: state.factory.built ? 1 : 0,
    activeRivals: RIVAL_ORDER.filter((rivalId) => state.rivals?.[rivalId]?.active),
    month: state.floor,
  }
}

function drawCurrentEvent(state) {
  return drawWeightedEventCards(createEventContext(state), 1)[0]?.id ?? null
}

function applyLegacyBonuses(baseState, legacyCards) {
  let capitalMul = 1
  let startCredit = 0
  let startBrand = 0
  let startQuality = 0
  let startResistance = 0

  legacyCards.forEach((card) => {
    capitalMul += card.bonus?.startCapitalMul ? card.bonus.startCapitalMul - 1 : 0
    startCredit += card.bonus?.startCredit ?? 0
    startBrand += card.bonus?.startBrand ?? 0
    startQuality += card.bonus?.startQuality ?? 0
    startResistance += card.bonus?.startResistance ?? 0
  })

  return {
    ...baseState,
    capital: Math.round(baseState.capital * capitalMul),
    credits: baseState.credits + startCredit,
    brandValue: baseState.brandValue + startBrand,
    qualityScore: baseState.qualityScore + startQuality,
    priceResistance: baseState.priceResistance + startResistance,
  }
}

function getAdvisorFee(advisorId, netProfit) {
  const advisor = ADVISORS[advisorId]
  if (!advisor?.fee) {
    return 0
  }

  if (advisor.fee.type === 'percent') {
    if (netProfit > 0) {
      return Math.round(netProfit * advisor.fee.value)
    }
    return advisor.fee.lossFixed ?? 0
  }

  if (advisor.fee.type === 'fixed') {
    return advisor.fee.value
  }

  return 0
}

function createBaseState() {
  const meta = loadMeta()
  const legacyCards = loadLegacyCards()

  return {
    floor: 1,
    maxFloors: 120,
    gameStatus: 'idle',
    floorPhase: 'normal',
    advisor: null,
    advisorDraft: null,
    difficulty: null,
    difficultyDraft: null,
    companyHealth: 10,
    maxHealth: MAX_HEALTH,
    momentum: 0,
    momentumHistory: [],
    credits: 0,
    econPhase: 'stable',
    industryTier: 1,
    itemCategory: 'normal',
    capital: 0,
    debt: 0,
    interestRate: 0,
    monthlyFixedCost: 500000,
    realty: 'monthly',
    brandValue: 0,
    qualityScore: 60,
    priceResistance: 0,
    marketing: { awarenessBonus: 0 },
    factory: {
      built: false,
      buildTurnsLeft: 0,
      safetyOn: true,
      accidentRisk: 0,
      upgradeLevel: 0,
    },
    rivals: createInitialRivals(),
    activeEconomicWar: null,
    activeBlackSwan: null,
    blackSwanSeen: false,
    activeEffects: [],
    lastSettlement: null,
    settlementModalOpen: false,
    profitHistory: [],
    cumulativeProfit: 0,
    legacyCards,
    meta,
    advisorFeeTotal: 0,
    warWinCount: 0,
    currentEventCardId: null,
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    selectedStrategyId: null,
    rewardPending: null,
    rewardSelection: null,
    shopOpen: false,
    shopPurchasesThisFloor: [],
    toasts: [],
    decisionLog: [],
    peakMarketShare: 0,
    warPaused: false,
    previewOpen: false,
  }
}

function createRunState({ advisor, difficulty, meta, legacyCards }) {
  const difficultyDef = DIFFICULTIES[difficulty]
  const base = applyLegacyBonuses(
    {
      ...createBaseState(),
      advisor,
      advisorDraft: advisor,
      difficulty,
      difficultyDraft: difficulty,
      gameStatus: 'playing',
      capital: difficultyDef.capital,
      debt: difficultyDef.debt,
      interestRate: difficultyDef.interestRate,
      companyHealth:
        advisor === 'strategist'
          ? MAX_HEALTH
          : advisor === 'actuary'
            ? MAX_HEALTH
            : 10,
      meta,
      legacyCards,
      priceResistance:
        (advisor === 'trader' ? 0.01 : 0) +
        (advisor === 'auditor' ? 0 : 0),
      qualityScore: 60,
    },
    legacyCards,
  )

  const next = {
    ...base,
    currentEventCardId: null,
  }

  next.currentEventCardId = drawCurrentEvent({
    ...next,
    rivals: ensureRivalsJoined(next.rivals, 1, next.industryTier),
  })

  return next
}

function composeTurnPlan(state, strategyId) {
  const strategy = STRATEGIES[strategyId]
  if (!strategy) {
    return null
  }

  const vendorMode = VENDOR_MODE_MUL[strategy.vendorMode]
  const baseUnitCost = VENDOR.baseUnitCost * vendorMode.costMul
  const tempCostMul = getEffectValue(state, 'tempCostMul')
  const vendorUnitCost = Math.round(baseUnitCost * (1 + tempCostMul))
  const factoryDiscount = state.factory.built ? 0.6 : 1
  const qualityMul =
    strategy.qualityMode === 'budget'
      ? 0.8
      : strategy.qualityMode === 'premium'
        ? 1.5
        : 1
  const predictedDemand = Math.round(
    1000 *
      (ECO_WEIGHTS[state.itemCategory]?.[state.econPhase] ?? 1) *
      (1 + getMomentumEffect(state.momentum).demandMul) *
      (state.activeBlackSwan?.demandMul ?? 1) *
      (1 + getEffectValue(state, 'demandMul')),
  )

  return {
    strategyId,
    orderQty: Math.max(50, Math.round(predictedDemand * strategy.orderMul)),
    sellPrice: Math.round(vendorUnitCost * strategy.priceMul),
    vendorUnitCost,
    qualityMode: strategy.qualityMode,
    vendorMode: strategy.vendorMode,
    previewUnitCost: Math.round(vendorUnitCost * qualityMul * factoryDiscount),
    quality:
      VENDOR.baseQuality +
      vendorMode.qualityBonus +
      state.qualityScore +
      (strategy.qualityMode === 'premium' ? 20 : 0),
    awareness:
      (state.marketing?.awarenessBonus ?? 0) + Number(strategy.awarenessBonus ?? 0),
    predictedDemand,
  }
}

function applyEventEffects(state, effects = {}) {
  const nextState = {
    ...state,
    capital: state.capital + (effects.capitalDelta ?? 0) * 1000000,
    debt: Math.max(0, state.debt + (effects.debtDelta ?? 0) * 1000000),
    brandValue: state.brandValue + (effects.brandDelta ?? 0),
    qualityScore: state.qualityScore + (effects.qualityDelta ?? 0),
    marketing: {
      ...state.marketing,
      awarenessBonus: clamp(
        (state.marketing?.awarenessBonus ?? 0) + (effects.awarenessDelta ?? 0),
        0,
        0.5,
      ),
    },
    activeEffects: [...(state.activeEffects ?? [])],
  }

  if (effects.demandMul) {
    nextState.activeEffects.push({
      id: `demand-${Date.now()}`,
      type: 'demandMul',
      value: effects.demandMul,
      turnsLeft: effects.turnsLeft ?? 1,
    })
  }

  if (effects.healthDelta) {
    nextState.companyHealth = applyHealth(
      nextState.companyHealth,
      effects.healthDelta,
      nextState.maxHealth,
    )
  }

  return nextState
}

function applyRewardEffect(state, reward) {
  const nextState = {
    ...state,
    credits: state.credits + (reward.effect?.credits ?? 0),
    brandValue: state.brandValue + (reward.effect?.brandValue ?? 0),
    qualityScore: state.qualityScore + (reward.effect?.qualityScore ?? 0),
    priceResistance: state.priceResistance + (reward.effect?.priceResistance ?? 0),
    capital:
      reward.effect?.capitalMul
        ? Math.round(state.capital * (1 + reward.effect.capitalMul))
        : state.capital,
    monthlyFixedCost:
      reward.effect?.fixedCostMul
        ? Math.round(state.monthlyFixedCost * (1 + reward.effect.fixedCostMul))
        : state.monthlyFixedCost,
    interestRate:
      reward.effect?.interestRateMul
        ? state.interestRate * (1 + reward.effect.interestRateMul)
        : state.interestRate,
    companyHealth: reward.effect?.fullHeal
      ? state.maxHealth
      : applyHealth(state.companyHealth, reward.effect?.companyHealth ?? 0, state.maxHealth),
    activeEffects: [...(state.activeEffects ?? [])],
  }

  if (reward.effect?.tempCostMul) {
    nextState.activeEffects.push({
      id: `temp-cost-${Date.now()}`,
      type: 'tempCostMul',
      value: reward.effect.tempCostMul,
      turnsLeft: reward.effect.turnsLeft ?? 1,
    })
  }

  return nextState
}

function resolveLegacyCards(state, status) {
  const netWorth = state.capital - state.debt
  const nextCards = [...state.legacyCards]

  LEGACY_CONDITIONS.forEach((entry) => {
    let unlocked = false
    if (entry.id === 'early_bankrupt' && status === 'bankrupt' && state.floor < 40) unlocked = true
    if (entry.id === 'mid_bankrupt' && status === 'bankrupt' && state.floor >= 40 && state.floor < 80) unlocked = true
    if (entry.id === 'late_bankrupt' && status === 'bankrupt' && state.floor >= 80) unlocked = true
    if (entry.id === 'clear_basic' && status === 'clear') unlocked = true
    if (entry.id === 'clear_100m' && status === 'clear' && netWorth >= 100000000) unlocked = true
    if (entry.id === 'clear_500m' && status === 'clear' && netWorth >= 500000000) unlocked = true
    if (entry.id === 'war_winner' && state.warWinCount >= 3) unlocked = true
    if (entry.id === 'fee_zero' && state.advisorFeeTotal <= 0) unlocked = true

    if (unlocked && !nextCards.some((card) => card.id === entry.id)) {
      nextCards.push(entry)
    }
  })

  saveLegacyCards(nextCards)
  return nextCards
}

function maybeStartEconomicWar(state) {
  const war = ECONOMIC_WARS[state.floor]
  if (!war) {
    return state.activeEconomicWar
  }

  const rivalIds =
    war.rival === 'all'
      ? RIVAL_ORDER.filter((rivalId) => state.rivals[rivalId]?.active)
      : [war.rival]

  return {
    warId: war.id,
    name: war.name,
    rivalIds,
    duration: war.duration,
    floorsLeft: war.duration === 'until clear' ? 999 : war.duration,
  }
}

function maybeTriggerBlackSwan(state) {
  if (state.activeBlackSwan || state.floor < 80) {
    return state.activeBlackSwan
  }

  const probability = 0.01 + Math.max(0, state.floor - 80) * 0.001
  if (Math.random() >= probability) {
    return null
  }

  const picked = BLACK_SWANS[Math.floor(Math.random() * BLACK_SWANS.length)]
  return {
    ...picked,
    floorsLeft: picked.duration,
  }
}

export const useGameStore = create((set, get) => {
  const dismissToast = (toastId) => {
    set((state) => ({
      ...state,
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    }))
  }

  const enqueueToast = (message, tone = 'neutral') => {
    const toast = createToast(message, tone)
    set((state) => ({
      ...state,
      toasts: [...state.toasts, toast].slice(-3),
    }))
    setTimeout(() => dismissToast(toast.id), 2000)
  }

  return {
    ...createBaseState(),

    dismissToast,

    setAdvisorDraft: (advisorId) =>
      set((state) => ({
        ...state,
        advisorDraft: advisorId,
      })),

    confirmAdvisor: () =>
      set((state) => ({
        ...state,
        advisor: state.advisorDraft,
      })),

    setDifficultyDraft: (difficultyId) =>
      set((state) => ({
        ...state,
        difficultyDraft: difficultyId,
      })),

    startGame: () => {
      const state = get()
      if (!state.advisor || !state.difficultyDraft) {
        return
      }

      const next = createRunState({
        advisor: state.advisor,
        difficulty: state.difficultyDraft,
        meta: state.meta,
        legacyCards: state.legacyCards,
      })

      set({
        ...next,
        currentEventCardId: drawCurrentEvent(next),
      })
    },

    restartGame: () => {
      const state = get()
      if (!state.advisor || !state.difficulty) {
        set(createBaseState())
        return
      }
      const next = createRunState({
        advisor: state.advisor,
        difficulty: state.difficulty,
        meta: state.meta,
        legacyCards: state.legacyCards,
      })
      set({
        ...next,
        currentEventCardId: drawCurrentEvent(next),
      })
    },

    goToAdvisorSelect: () => set(createBaseState()),

    selectStrategy: (strategyId) => {
      set((state) => ({
        ...state,
        selectedStrategyId: strategyId,
      }))
      if (get().currentEventResolved) {
        get().advanceFloor()
      }
    },

    resolveEventChoice: (choiceId) => {
      const state = get()
      const card = getEventCardById(state.currentEventCardId)
      const choice = card?.choices?.find((entry) => entry.id === choiceId)
      if (!choice) {
        return
      }

      const success = Math.random() <= choice.successRate
      const message = success ? choice.successText : choice.failureText
      const effects = success ? choice.successEffects : choice.failureEffects

      set((current) => ({
        ...applyEventEffects(current, effects),
        currentEventResolved: true,
        currentEventChoiceId: choiceId,
        lastEventResult: {
          cardId: current.currentEventCardId,
          choiceId,
          success,
          message,
          effects,
        },
      }))

      enqueueToast(message, success ? 'positive' : 'negative')
      if (get().selectedStrategyId) {
        get().advanceFloor()
      }
    },

    closeSettlementModal: () =>
      set((state) => ({
        ...state,
        settlementModalOpen: false,
      })),

    selectReward: (rewardId) =>
      set((state) => ({
        ...state,
        rewardSelection: rewardId,
      })),

    claimReward: () => {
      const state = get()
      if (!state.rewardPending || !state.rewardSelection) {
        return
      }

      const reward = state.rewardPending.options.find((entry) => entry.id === state.rewardSelection)
      if (!reward) {
        return
      }

      const nextState = applyRewardEffect(
        {
          ...state,
          credits: state.credits + state.rewardPending.credits,
          rewardPending: null,
          rewardSelection: null,
        },
        reward,
      )

      set({
        ...nextState,
        currentEventCardId: drawCurrentEvent(nextState),
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        selectedStrategyId: null,
      })
    },

    toggleShop: () =>
      set((state) => ({
        ...state,
        shopOpen: !state.shopOpen,
      })),

    acknowledgeBlackSwan: () =>
      set((state) => ({
        ...state,
        blackSwanSeen: true,
      })),

    buyShopItem: (shopId) => {
      const state = get()
      const item = CREDIT_SHOP.find((entry) => entry.id === shopId)
      if (!item) {
        return
      }

      const price = getCreditShopPrice(item.baseCost, state.floor)
      if (state.credits < price || state.shopPurchasesThisFloor.includes(shopId)) {
        return
      }

      const activeEffects = [...state.activeEffects]
      if (item.effect.noWaste) {
        activeEffects.push({ id: `nowaste-${Date.now()}`, type: 'noWaste', value: 1, turnsLeft: 1 })
      }
      if (item.effect.rivalFreeze) {
        activeEffects.push({ id: `freeze-${Date.now()}`, type: 'rivalFreeze', value: 1, turnsLeft: 1 })
      }
      if (item.effect.preview) {
        activeEffects.push({ id: `preview-${Date.now()}`, type: 'preview', value: 1, turnsLeft: 1 })
      }

      set((current) => ({
        ...current,
        credits: current.credits - price,
        companyHealth: applyHealth(current.companyHealth, item.effect.companyHealth ?? 0, current.maxHealth),
        currentEventCardId:
          item.effect.rerollEvent && !current.currentEventResolved
            ? drawCurrentEvent(current)
            : current.currentEventCardId,
        activeEffects,
        shopPurchasesThisFloor: [...current.shopPurchasesThisFloor, shopId],
      }))
    },

    advanceFloor: () => {
      const state = get()
      if (state.gameStatus !== 'playing' || !state.selectedStrategyId || !state.currentEventResolved) {
        return
      }

      const plan = composeTurnPlan(state, state.selectedStrategyId)
      if (!plan) {
        return
      }

      const momentumEffect = getMomentumEffect(state.momentum)
      const demand = calcDemand({
        category: state.itemCategory,
        econPhase: state.econPhase,
        industryTier: state.industryTier,
        momentumMul: 1 + momentumEffect.demandMul,
        blackSwanMul: state.activeBlackSwan?.demandMul ?? 1,
        eventMul: 1 + getEffectValue(state, 'demandMul'),
      })

      const playerAttraction = calcAttraction({
        quality: plan.quality,
        brand: state.brandValue,
        sellPrice: plan.sellPrice,
        resistance: state.priceResistance,
        category: state.itemCategory,
        econPhase: state.econPhase,
        awarenessBonus: plan.awareness,
      })

      const shareData = calcRivalShares({
        playerAttraction,
        itemCategory: state.itemCategory,
        econPhase: state.econPhase,
        rivals: state.rivals,
      })

      let result = calcSettlement({
        sellPrice: plan.sellPrice,
        orderQty: plan.orderQty,
        demand,
        myShare: shareData.myShare,
        vendorUnitCost: plan.vendorUnitCost,
        qualityMode: plan.qualityMode,
        factoryActive: state.factory.built,
        monthlyInterest: Math.round((state.debt * (state.interestRate + (state.activeBlackSwan?.rateAdd ?? 0))) / 12),
        monthlyRent: state.realty === 'monthly' ? 1000000 : 0,
        safetyCost: state.factory.built && state.factory.safetyOn ? 5000000 : 0,
        otherFixed: state.monthlyFixedCost,
      })

      let salvageValue = 0
      if (hasEffect(state, 'noWaste')) {
        salvageValue = result.wasteCost
        result = {
          ...result,
          netProfit: result.netProfit + salvageValue,
        }
      }

      const advisorFee = getAdvisorFee(state.advisor, result.netProfit)
      const netProfit = result.netProfit - advisorFee
      const momentumState = updateMomentum(state.momentumHistory, netProfit)
      let companyHealth = applyHealth(
        state.companyHealth,
        calcHealthDelta({
          netProfit,
          waste: result.waste,
          orderQty: plan.orderQty,
          blackSwanPenalty: state.activeBlackSwan ? 2 : 0,
          eventPenalty: state.lastEventResult?.effects?.healthDelta && state.lastEventResult.effects.healthDelta < 0 ? 1 : 0,
          profitableStreak: momentumState.profitableStreak,
        }),
        state.maxHealth,
      )

      let nextRivals = updateRivalsFromSettlement({
        rivals: state.rivals,
        demand,
        rivalShares: shareData.rivalShares,
        playerPrice: plan.sellPrice,
      })
      nextRivals = applyShareDamage(nextRivals, shareData.myShare)

      let activeEconomicWar = state.activeEconomicWar
      if (!state.activeBlackSwan && activeEconomicWar) {
        const warOutcome = applyRivalHealthDamage({
          rivals: nextRivals,
          myShare: shareData.myShare,
          myProfit: netProfit,
          companyHealth,
          activeWar: activeEconomicWar,
        })
        nextRivals = warOutcome.rivals
        companyHealth = warOutcome.companyHealth
        if (activeEconomicWar.floorsLeft !== 999) {
          activeEconomicWar = {
            ...activeEconomicWar,
            floorsLeft: Math.max(0, activeEconomicWar.floorsLeft - 1),
          }
        }
        if (activeEconomicWar.floorsLeft === 0) {
          activeEconomicWar = null
        }
      }

      const nextCapital =
        state.capital - result.prepayment + result.revenue - result.fixedTotal - advisorFee + salvageValue
      const nextFloor = state.floor + 1
      const nextEconPhase =
        state.activeBlackSwan?.econLocked ?? advanceEconPhase(state.econPhase, state.meta.boomBonus ?? 0)
      const settlement = {
        ...result,
        netProfit,
        advisorFee,
        salvageValue,
        floor: state.floor,
        demand,
        myShare: shareData.myShare,
        orderQty: plan.orderQty,
        sellPrice: plan.sellPrice,
        plan,
        econFrom: state.econPhase,
        econTo: nextEconPhase,
        healthBefore: state.companyHealth,
        healthAfter: companyHealth,
        momentum: momentumState.momentum,
        momentumHistory: momentumState.momentumHistory,
        educationHint: getEducationHint({
          strategyId: state.selectedStrategyId,
          econPhase: state.econPhase,
          itemCategory: state.itemCategory,
          waste: result.waste,
          orderQty: plan.orderQty,
          netProfit,
        }),
      }

      let activeBlackSwan = state.activeBlackSwan
      let blackSwanSeen = state.blackSwanSeen
      if (activeBlackSwan) {
        activeBlackSwan = {
          ...activeBlackSwan,
          floorsLeft: activeBlackSwan.floorsLeft - 1,
        }
        if (activeBlackSwan.floorsLeft <= 0) {
          activeBlackSwan = null
          blackSwanSeen = false
        }
      } else {
        activeBlackSwan = maybeTriggerBlackSwan({ ...state, floor: nextFloor })
        if (activeBlackSwan) {
          blackSwanSeen = false
        }
      }

      const draftState = {
        ...state,
        floor: nextFloor,
        econPhase: nextEconPhase,
        capital: nextCapital,
        companyHealth,
        momentum: momentumState.momentum,
        momentumHistory: momentumState.momentumHistory,
        rivals: ensureRivalsJoined(nextRivals, nextFloor, state.industryTier),
        activeEconomicWar: activeEconomicWar ?? maybeStartEconomicWar({ ...state, floor: nextFloor, rivals: nextRivals }),
        activeBlackSwan,
        blackSwanSeen,
        activeEffects: nextEffectList(state.activeEffects),
      }

      const rewardPending = createRewardDraft({
        floor: state.floor,
        momentum: momentumState.momentum,
      })

      let gameStatus = 'playing'
      if (companyHealth <= 0 || nextCapital - state.debt < -30000000) {
        gameStatus = activeBlackSwan?.id === 'acquisition' ? 'hostile' : 'bankrupt'
      } else if (state.floor >= state.maxFloors && (!state.activeEconomicWar || netProfit >= 0)) {
        gameStatus = 'clear'
      }

      const legacyCards =
        gameStatus === 'playing' ? state.legacyCards : resolveLegacyCards(draftState, gameStatus)
      const meta =
        gameStatus === 'playing'
          ? state.meta
          : recordGameEnd(gameStatus, {
              ...state.meta,
              advisorUsed: Array.from(new Set([...(state.meta.advisorUsed ?? []), state.advisor])),
              analystPlays:
                state.meta.analystPlays + (state.advisor === 'analyst' ? 1 : 0),
              floor50Reached:
                state.floor >= 50 ? state.meta.floor50Reached + 1 : state.meta.floor50Reached,
              floor80Reached:
                state.floor >= 80 ? state.meta.floor80Reached + 1 : state.meta.floor80Reached,
              economicWarWins:
                state.warWinCount + (activeEconomicWar === null && state.activeEconomicWar ? 1 : 0),
            })

      set({
        ...draftState,
        gameStatus,
        legacyCards,
        meta,
        advisorFeeTotal: state.advisorFeeTotal + advisorFee,
        settlementModalOpen: gameStatus === 'playing',
        lastSettlement: settlement,
        rewardPending: gameStatus === 'playing' ? rewardPending : null,
        rewardSelection: null,
        currentEventCardId: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        selectedStrategyId: null,
        shopPurchasesThisFloor: [],
        previewOpen: false,
        floorPhase:
          draftState.activeBlackSwan || activeBlackSwan
            ? 'black-swan'
            : draftState.activeEconomicWar
              ? 'economic-war'
              : 'normal',
        profitHistory: [...state.profitHistory, netProfit].slice(-12),
        cumulativeProfit: state.cumulativeProfit + netProfit,
        peakMarketShare: Math.max(state.peakMarketShare, shareData.myShare),
        decisionLog: [
          {
            floor: state.floor,
            strategyId: state.selectedStrategyId,
            netProfit,
            educationHint: settlement.educationHint,
          },
          ...state.decisionLog,
        ].slice(0, 12),
      })

      enqueueToast(
        `${state.floor}층 정산 완료 · ${netProfit >= 0 ? '+' : ''}${Math.round(netProfit).toLocaleString()}원`,
        netProfit >= 0 ? 'positive' : 'negative',
      )
    },
  }
})
