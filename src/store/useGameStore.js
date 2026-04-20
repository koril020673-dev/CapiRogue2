import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import { getConsumerGroupRatios } from '../constants/consumerGroups.js'
import { drawWeightedEventCards, getEventCardById } from '../constants/docEvents.js'
import { LEGACY_CONDITIONS } from '../constants/legacy.js'
import { CREDIT_SHOP } from '../constants/rewards.js'
import { createInitialRivals } from '../constants/rivals.js'
import { ORDER_TIERS, STRATEGIES, VENDOR } from '../constants/strategies.js'
import { clamp } from '../lib/gameMath.js'
import { applyStrategyEffect, previewStrategyEffect } from '../logic/brandQualityEngine.js'
import { getCreditShopPrice } from '../logic/creditEngine.js'
import {
  calcDemand,
  calcDemandEstimate,
  calcGroupDemandBreakdown,
} from '../logic/demandEngine.js'
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
  applyShareDamage,
  buildRivalPlayers,
  ensureRivalsJoined,
  getActiveRivals,
  getBiggestRival,
  rotateBankruptRivals,
  updateRivalsFromSettlement,
} from '../logic/rivalEngine.js'
import {
  appendRunHistory,
  clearAuthSession,
  clearSaveSlot,
  hasSaveSlot,
  loadAuthSession,
  loadRunHistory,
  loadSaveSlot,
  loadSettings,
  saveAuthSession,
  saveSaveSlot,
  saveSettings,
} from '../logic/saveEngine.js'
import { calcSettlement } from '../logic/settlementEngine.js'
import { getEducationHint } from '../constants/educationHints.js'

const MAX_HEALTH = 10
const FIXED_DIFFICULTY = {
  capital: 30000000,
  debt: 0,
  interestRate: 0.072,
}

const EMPTY_GROUP_SHARES = {
  quality: 0,
  brand: 0,
  value: 0,
  general: 0,
}

function createToast(message, tone = 'neutral') {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    message,
    tone,
  }
}

function getWarningAlerts(state) {
  const alerts = []
  const fixedCostProxy = Math.max(
    1,
    state.monthlyFixedCost + (state.realty === 'monthly' ? 1000000 : 0),
  )
  const recentLosses = state.profitHistory.slice(-3)
  const hasThreeStraightLosses =
    recentLosses.length === 3 && recentLosses.every((profit) => profit < 0)

  if (state.capital < fixedCostProxy * 2) {
    alerts.push('⚠️ 현금 부족 경고')
  }

  if (hasThreeStraightLosses) {
    alerts.push('⚠️ 3연속 적자')
  }

  if (state.companyHealth <= 3) {
    alerts.push('🔴 위기')
  }

  return alerts
}

function getAdvisorFee(advisorId, netProfit) {
  const advisor = ADVISORS[advisorId]
  if (!advisor?.fee) {
    return 0
  }

  switch (advisor.fee.type) {
    case 'percent':
      if (netProfit > 0) {
        return Math.round(netProfit * advisor.fee.value)
      }
      return advisor.fee.lossFixed ?? 0
    case 'fixed':
      return advisor.fee.value
    default:
      return 0
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
    .filter(
      (effect) =>
        effect.turnsLeft === undefined || effect.turnsLeft === null || effect.turnsLeft > 0,
    )
}

function consumeSingleEffect(activeEffects = [], type) {
  let consumed = false
  return activeEffects.filter((effect) => {
    if (!consumed && effect.type === type) {
      consumed = true
      return false
    }
    return true
  })
}

function createEventContext(state) {
  return {
    economyPhase:
      state.econPhase === 'growth'
        ? 'recovery'
        : state.econPhase === 'contraction' || state.econPhase === 'recession'
          ? 'slowdown'
          : state.econPhase === 'stable'
            ? 'steady'
            : 'boom',
    debtBand:
      state.debt > state.capital * 0.5 ? 'high' : state.debt > state.capital * 0.2 ? 'medium' : 'low',
    factoryCount: state.factory.built ? 1 : 0,
    activeRivals: getActiveRivals(state.rivals).map((rival) => rival.id),
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

function createBaseState() {
  const meta = loadMeta()
  const legacyCards = loadLegacyCards()
  const settings = loadSettings()
  const playHistory = loadRunHistory()
  const saveExists = hasSaveSlot()
  const auth = loadAuthSession()

  return {
    screen: auth.isLoggedIn ? 'title' : 'login',
    gameStatus: 'idle',
    floor: 1,
    maxFloors: 120,
    floorPhase: 'normal',
    floorStage: 'market',
    auth,
    loginError: '',
    advisor: null,
    advisorDraft: null,
    companyHealth: 10,
    maxHealth: MAX_HEALTH,
    momentum: 0,
    momentumHistory: [],
    credits: 0,
    econPhase: 'stable',
    industryTier: 1,
    itemCategory: 'normal',
    capital: FIXED_DIFFICULTY.capital,
    debt: FIXED_DIFFICULTY.debt,
    interestRate: FIXED_DIFFICULTY.interestRate,
    monthlyFixedCost: 500000,
    realty: 'monthly',
    brandValue: 0,
    qualityScore: 60,
    priceResistance: 0,
    marketing: { awarenessBonus: 0 },
    vendor: VENDOR,
    factory: {
      built: false,
      buildTurnsLeft: 0,
      safetyOn: true,
      accidentRisk: 0,
      upgradeLevel: 0,
    },
    selectedStrategyId: null,
    selectedOrderTier: null,
    currentEventCardId: null,
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    rivals: createInitialRivals(),
    activeEconomicWar: null,
    activeBlackSwan: null,
    activeEffects: [],
    blackSwanSeen: false,
    lastSettlement: null,
    profitHistory: [],
    cumulativeProfit: 0,
    legacyCards,
    meta,
    playHistory,
    settings,
    saveExists,
    advisorFeeTotal: 0,
    warWinCount: 0,
    rewardPending: null,
    rewardSelection: null,
    rewardClaimed: false,
    shopPurchasesThisFloor: [],
    warningAlerts: [],
    toasts: [],
    decisionLog: [],
    peakMarketShare: 0,
    previewOpen: false,
    consumerGroupRatios: getConsumerGroupRatios('stable'),
    lastGroupShares: { ...EMPTY_GROUP_SHARES },
    lastLeftoverDemand: 0,
  }
}

function createRunState({ advisor, meta, legacyCards, settings, playHistory }) {
  const base = applyLegacyBonuses(
    {
      ...createBaseState(),
      screen: 'game',
      gameStatus: 'playing',
      floorStage: 'market',
      advisor,
      advisorDraft: advisor,
      meta,
      legacyCards,
      settings,
      playHistory,
      saveExists: true,
      consumerGroupRatios: getConsumerGroupRatios('stable'),
    },
    legacyCards,
  )

  const rivals = ensureRivalsJoined(base.rivals, 1)
  const currentEventCardId = drawCurrentEvent({ ...base, rivals })

  return {
    ...base,
    rivals,
    currentEventCardId,
    warningAlerts: getWarningAlerts({ ...base, rivals }),
  }
}

function buildSaveSnapshot(state) {
  const { auth, loginError, toasts, ...persisted } = state

  return {
    ...persisted,
    screen: 'game',
    saveExists: true,
  }
}

function buildHistoryEntry(state, status) {
  const latestLegacy = state.legacyCards?.[state.legacyCards.length - 1]
  return {
    id: `${Date.now()}-${state.floor}`,
    advisor: state.advisor,
    advisorName: ADVISORS[state.advisor]?.name ?? state.advisor,
    floor: state.floor,
    result: status,
    netWorth: state.capital - state.debt,
    legacyCard: latestLegacy?.name ?? latestLegacy?.label ?? null,
    createdAt: new Date().toISOString(),
  }
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
      id: `effect-demand-${Date.now()}`,
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
      reward.effect?.capitalMul != null
        ? Math.round(state.capital * (1 + reward.effect.capitalMul))
        : state.capital,
    monthlyFixedCost:
      reward.effect?.fixedCostMul != null
        ? Math.round(state.monthlyFixedCost * (1 + reward.effect.fixedCostMul))
        : state.monthlyFixedCost,
    interestRate:
      reward.effect?.interestRateMul != null
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

function getOrderMultipliers(strategyId) {
  const strategy = STRATEGIES[strategyId]
  if (!strategy) {
    return [0.4, 0.6, 0.8]
  }

  const [minimumOrderMul, maximumOrderMul] = strategy.orderRange
  return [
    minimumOrderMul,
    (minimumOrderMul + maximumOrderMul) / 2,
    maximumOrderMul,
  ]
}

function composeTurnPlan(state, strategyId, orderTierId = state.selectedOrderTier) {
  const strategy = STRATEGIES[strategyId]
  const orderTier = ORDER_TIERS[orderTierId]
  if (!strategy || !orderTier) {
    return null
  }

  const momentumMul = 1 + getMomentumEffect(state.momentum).demandMul
  const blackSwanMul = state.activeBlackSwan?.demandMul ?? 1
  const eventMul = 1 + getEffectValue(state, 'demandMul')
  const demandEstimate = calcDemandEstimate({
    category: state.itemCategory,
    econPhase: state.econPhase,
    industryTier: state.industryTier,
    momentumMul,
    blackSwanMul,
    eventMul,
  })

  const vendorUnitCost = Math.round(
    VENDOR.baseUnitCost * (1 + getEffectValue(state, 'tempCostMul')),
  )
  const orderMul = getOrderMultipliers(strategyId)[orderTier.index] ?? 1
  const orderCapMul = strategy.effect?.orderCapMul ?? 1
  const orderQty = Math.max(12, Math.round(demandEstimate * orderMul * orderCapMul))
  const sellPrice = Math.max(
    10000,
    Math.round(vendorUnitCost * (strategy.effect?.priceMul ?? strategy.sellPriceMul ?? 1)),
  )

  return {
    strategyId,
    orderTierId,
    qualityMode: strategy.qualityMode,
    orderQty,
    sellPrice,
    vendorUnitCost,
    previewUnitCost: Math.round(
      vendorUnitCost *
        (strategy.qualityMode === 'premium' ? 1.5 : strategy.qualityMode === 'budget' ? 0.8 : 1) *
        (state.factory.built ? 0.6 : 1),
    ),
    demandEstimate,
  }
}

function buildPlayerEntry(state, plan, strategyState) {
  const qualityAdjustment =
    plan.qualityMode === 'premium' ? 12 : plan.qualityMode === 'budget' ? -8 : 0

  const qualityScore = Math.max(0, strategyState.qualityScore + qualityAdjustment)
  const brandValue = Math.max(0, strategyState.brandValue)
  const attraction = calcAttraction({
    quality: qualityScore,
    brand: brandValue,
    sellPrice: plan.sellPrice,
    resistance: state.priceResistance,
    category: state.itemCategory,
    econPhase: state.econPhase,
    awarenessBonus: state.marketing.awarenessBonus,
  })

  return {
    id: 'player',
    qualityScore,
    brandValue,
    sellPrice: plan.sellPrice,
    attraction,
  }
}

function buildDemandRatioMultipliers(strategyId) {
  if (strategyId === 'dumping') {
    return { value: 1.2 }
  }

  return {}
}

function prepareNextFloorState(state, { keepEffects = true } = {}) {
  const base = {
    ...state,
    floorStage: 'market',
    lastSettlement: null,
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    selectedStrategyId: null,
    selectedOrderTier: null,
    rewardPending: null,
    rewardSelection: null,
    rewardClaimed: false,
    shopPurchasesThisFloor: [],
    previewOpen: false,
    currentEventCardId: null,
    activeEffects: keepEffects ? state.activeEffects : [],
  }

  let nextEffects = base.activeEffects
  if (hasEffect(base, 'rerollEvent')) {
    const firstPick = drawCurrentEvent({ ...base, activeEffects: nextEffects })
    const secondPick = drawCurrentEvent({
      ...base,
      currentEventCardId: firstPick,
      activeEffects: nextEffects,
    })
    base.currentEventCardId = secondPick ?? firstPick
    nextEffects = consumeSingleEffect(nextEffects, 'rerollEvent')
  } else {
    base.currentEventCardId = drawCurrentEvent(base)
  }

  return {
    ...base,
    activeEffects: nextEffects,
    warningAlerts: getWarningAlerts(base),
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

    login: ({ userId, password }) => {
      const safeUserId = String(userId ?? '').trim()
      const safePassword = String(password ?? '').trim()

      if (!safeUserId || !safePassword) {
        set((state) => ({
          ...state,
          loginError: 'ID와 비밀번호를 모두 입력해주세요.',
        }))
        return
      }

      const isAdmin = safeUserId === '1234' && safePassword === '1234'
      const auth = {
        isLoggedIn: true,
        isAdmin,
        userId: safeUserId,
      }

      saveAuthSession(auth)
      set((state) => ({
        ...state,
        auth,
        loginError: '',
        screen: 'title',
        saveExists: hasSaveSlot(),
      }))
      enqueueToast(
        isAdmin ? '관리자 모드로 로그인되었습니다.' : `${safeUserId} 계정으로 로그인되었습니다.`,
        isAdmin ? 'warning' : 'positive',
      )
    },

    logout: () => {
      clearAuthSession()
      set((state) => ({
        ...state,
        auth: {
          isLoggedIn: false,
          isAdmin: false,
          userId: '',
        },
        loginError: '',
        screen: 'login',
        toasts: [],
      }))
    },

    backToTitle: () =>
      set((state) => ({
        ...createBaseState(),
        meta: state.meta,
        legacyCards: state.legacyCards,
        playHistory: loadRunHistory(),
        settings: state.settings,
        saveExists: hasSaveSlot(),
      })),

    openHistoryScreen: () =>
      set((state) => ({
        ...state,
        screen: 'history',
        playHistory: loadRunHistory(),
        saveExists: hasSaveSlot(),
      })),

    openSettingsScreen: () =>
      set((state) => ({
        ...state,
        screen: 'settings',
      })),

    updateSettings: (partialSettings) =>
      set((state) => {
        const nextSettings = {
          ...state.settings,
          ...partialSettings,
        }
        saveSettings(nextSettings)
        return {
          ...state,
          settings: nextSettings,
        }
      }),

    startNewGame: () =>
      set((state) => ({
        ...state,
        screen: 'advisor',
        advisorDraft: state.advisor ?? 'analyst',
        loginError: '',
      })),

    continueRun: () => {
      const currentState = get()
      if (!currentState.auth?.isLoggedIn) {
        return
      }

      const saved = loadSaveSlot()
      if (!saved) {
        return
      }

      set((state) => ({
        ...createBaseState(),
        ...saved,
        auth: state.auth,
        screen: 'game',
        gameStatus: 'playing',
        saveExists: true,
        playHistory: loadRunHistory(),
        settings: state.settings,
        toasts: [],
      }))
    },

    setAdvisorDraft: (advisorId) =>
      set((state) => ({
        ...state,
        advisorDraft: advisorId,
      })),

    confirmAdvisor: () => {
      const state = get()
      if (!state.advisorDraft) {
        return
      }

      const next = createRunState({
        advisor: state.advisorDraft,
        meta: state.meta,
        legacyCards: state.legacyCards,
        settings: state.settings,
        playHistory: state.playHistory,
      })

      set({
        ...next,
        advisor: state.advisorDraft,
        saveExists: true,
      })
      saveSaveSlot(buildSaveSnapshot({ ...get(), ...next, advisor: state.advisorDraft }))
    },

    restartGame: () => {
      const state = get()
      if (!state.advisor) {
        set({
          ...createBaseState(),
          screen: 'title',
        })
        return
      }

      const next = createRunState({
        advisor: state.advisor,
        meta: state.meta,
        legacyCards: state.legacyCards,
        settings: state.settings,
        playHistory: state.playHistory,
      })

      set({
        ...next,
        advisor: state.advisor,
        saveExists: true,
      })
      saveSaveSlot(buildSaveSnapshot({ ...get(), ...next, advisor: state.advisor }))
    },

    goToAdvisorSelect: () =>
      set((state) => ({
        ...createBaseState(),
        screen: 'advisor',
        meta: state.meta,
        legacyCards: state.legacyCards,
        playHistory: loadRunHistory(),
        settings: state.settings,
        saveExists: hasSaveSlot(),
        advisorDraft: state.advisor ?? 'analyst',
      })),

    setFloorStage: (floorStage) =>
      set((state) => ({
        ...state,
        floorStage,
      })),

    goToCompanyStage: () =>
      set((state) => ({
        ...state,
        floorStage: 'company',
      })),

    goToStrategyStage: () =>
      set((state) => ({
        ...state,
        floorStage: 'strategy',
      })),

    returnToStrategyStage: () =>
      set((state) => ({
        ...state,
        floorStage: 'strategy',
        selectedOrderTier: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
      })),

    getOrderOptions: (strategyId = get().selectedStrategyId) => {
      const state = get()
      if (!strategyId || !STRATEGIES[strategyId]) {
        return []
      }

      return Object.keys(ORDER_TIERS).map((orderTierId) => {
        const plan = composeTurnPlan(state, strategyId, orderTierId)
        return {
          id: orderTierId,
          label: ORDER_TIERS[orderTierId].label,
          orderQty: plan?.orderQty ?? 0,
          prepayment: (plan?.orderQty ?? 0) * (plan?.previewUnitCost ?? 0),
          sellPrice: plan?.sellPrice ?? 0,
        }
      })
    },

    getStrategyPreview: () => {
      const state = get()
      if (!state.selectedStrategyId || !state.selectedOrderTier || !hasEffect(state, 'preview')) {
        return null
      }

      const previewState = previewStrategyEffect(state, state.selectedStrategyId)
      const virtualState = {
        ...state,
        qualityScore: previewState.qualityScore,
        brandValue: previewState.brandValue,
        capital: previewState.capital,
      }
      const plan = composeTurnPlan(virtualState, state.selectedStrategyId, state.selectedOrderTier)
      if (!plan) {
        return null
      }

      const playerEntry = buildPlayerEntry(virtualState, plan, previewState)
      const rivalPlayers = buildRivalPlayers({
        econPhase: state.econPhase,
        itemCategory: state.itemCategory,
        rivals: state.rivals,
      }).map((rival) => ({
        ...rival,
        attraction: hasEffect(state, 'rivalFreeze') ? 0 : rival.attraction,
      }))
      const totalDemand = calcDemandEstimate({
        category: state.itemCategory,
        econPhase: state.econPhase,
        industryTier: state.industryTier,
        momentumMul: 1 + getMomentumEffect(state.momentum).demandMul,
        blackSwanMul: state.activeBlackSwan?.demandMul ?? 1,
        eventMul: 1,
      })
      const breakdown = calcGroupDemandBreakdown({
        econPhase: state.econPhase,
        totalDemand,
        players: [playerEntry, ...rivalPlayers],
        ratioMultipliers: buildDemandRatioMultipliers(state.selectedStrategyId),
      })
      const predictedSales = Math.min(
        breakdown.salesByPlayer[0]?.totalSold ?? 0,
        plan.orderQty,
      )
      const predictedRevenue = predictedSales * plan.sellPrice
      const predictedCost = plan.orderQty * plan.previewUnitCost
      const fixedTotal =
        Math.round((state.debt * state.interestRate) / 12) +
        (state.realty === 'monthly' ? 1000000 : 0) +
        state.monthlyFixedCost
      const predictedProfit = predictedRevenue - predictedCost - fixedTotal

      return {
        predictedSales,
        predictedProfit,
      }
    },

    selectStrategy: (strategyId) =>
      set((state) => ({
        ...state,
        selectedStrategyId: strategyId,
        selectedOrderTier: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        floorStage: 'strategy',
      })),

    selectOrderTier: (orderTierId) =>
      set((state) => ({
        ...state,
        selectedOrderTier: orderTierId,
      })),

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
        ...current,
        currentEventResolved: true,
        currentEventChoiceId: choiceId,
        lastEventResult: {
          cardId: current.currentEventCardId,
          choiceId,
          success,
          message,
          effects,
        },
        floorStage: 'confirm',
      }))

      enqueueToast(message, success ? 'positive' : 'negative')
    },

    closeSettlementModal: () =>
      set((state) => ({
        ...state,
        floorStage: 'shop',
      })),

    selectReward: (rewardId) =>
      set((state) => ({
        ...state,
        rewardSelection: rewardId,
      })),

    claimReward: () => {
      const state = get()
      if (!state.rewardPending || !state.rewardSelection || state.rewardClaimed) {
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
        },
        reward,
      )

      set({
        ...nextState,
        rewardClaimed: true,
      })
      saveSaveSlot(buildSaveSnapshot(get()))
    },

    continueFromShop: () => {
      const state = get()
      if (state.floorStage !== 'shop' || !state.rewardClaimed) {
        return
      }

      const nextState = prepareNextFloorState({
        ...state,
        consumerGroupRatios: getConsumerGroupRatios(state.econPhase),
      })

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
    },

    buyShopItem: (shopId) => {
      const state = get()
      if (state.floorStage !== 'shop') {
        return
      }

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
      if (item.effect.rerollEvent) {
        activeEffects.push({ id: `reroll-${Date.now()}`, type: 'rerollEvent', value: 1, turnsLeft: 1 })
      }

      const nextState = {
        ...state,
        credits: state.credits - price,
        companyHealth: applyHealth(
          state.companyHealth,
          item.effect.companyHealth ?? 0,
          state.maxHealth,
        ),
        activeEffects,
        shopPurchasesThisFloor: [...state.shopPurchasesThisFloor, shopId],
      }

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
    },

    adminJumpToFloor: (targetFloor) => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextFloor = clamp(Math.round(Number(targetFloor) || 1), 1, state.maxFloors)
      let nextRivals = createInitialRivals()
      for (let floorIndex = 2; floorIndex <= nextFloor; floorIndex += 1) {
        nextRivals = ensureRivalsJoined(nextRivals, floorIndex)
      }

      const nextState = prepareNextFloorState({
        ...state,
        floor: nextFloor,
        rivals: nextRivals,
        currentEventCardId: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        lastSettlement: null,
        rewardPending: null,
        rewardSelection: null,
        rewardClaimed: false,
      })

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast(`${nextFloor}층으로 이동했습니다.`, 'warning')
    },

    adminGrantCapital: (amount) => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextState = {
        ...state,
        capital: Math.max(0, state.capital + Math.round(Number(amount) || 0)),
      }
      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast(`현금 ${Math.round(Number(amount) || 0).toLocaleString()}원을 지급했습니다.`, 'positive')
    },

    adminGrantCredits: (amount) => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextState = {
        ...state,
        credits: Math.max(0, state.credits + Math.round(Number(amount) || 0)),
      }
      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast(`크레딧 ${Math.round(Number(amount) || 0)}C를 지급했습니다.`, 'positive')
    },

    adminHealCompany: () => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextState = {
        ...state,
        companyHealth: state.maxHealth,
      }
      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast('회사 체력을 최대로 회복했습니다.', 'positive')
    },

    confirmTurn: () => {
      const state = get()
      if (
        state.gameStatus !== 'playing' ||
        !state.selectedStrategyId ||
        !state.selectedOrderTier ||
        !state.currentEventResolved
      ) {
        return
      }

      const strategyState = applyStrategyEffect(state, state.selectedStrategyId)
      const stateWithStrategy = {
        ...state,
        qualityScore: Math.max(0, strategyState.qualityScore),
        brandValue: Math.max(0, strategyState.brandValue),
        capital: Math.max(0, strategyState.capital),
      }
      const stateWithEvent = applyEventEffects(
        stateWithStrategy,
        state.lastEventResult?.effects ?? {},
      )
      const plan = composeTurnPlan(stateWithEvent, state.selectedStrategyId, state.selectedOrderTier)
      if (!plan) {
        return
      }

      const playerEntry = buildPlayerEntry(stateWithEvent, plan, strategyState)
      const rivalPlayers = buildRivalPlayers({
        econPhase: state.econPhase,
        itemCategory: state.itemCategory,
        rivals: state.rivals,
      }).map((rival) => ({
        ...rival,
        attraction: hasEffect(stateWithEvent, 'rivalFreeze') ? 0 : rival.attraction,
      }))

      const totalDemand = calcDemand({
        category: state.itemCategory,
        econPhase: state.econPhase,
        industryTier: state.industryTier,
        momentumMul: 1 + getMomentumEffect(state.momentum).demandMul,
        blackSwanMul: 1,
        eventMul: 1 + getEffectValue(stateWithEvent, 'demandMul'),
      })

      const groupBreakdown = calcGroupDemandBreakdown({
        econPhase: state.econPhase,
        totalDemand,
        players: [playerEntry, ...rivalPlayers],
        ratioMultipliers: buildDemandRatioMultipliers(state.selectedStrategyId),
      })
      const playerDemand = groupBreakdown.salesByPlayer[0] ?? {
        totalSold: 0,
      }
      const actualSold = Math.min(playerDemand.totalSold, plan.orderQty)
      const result = calcSettlement({
        sellPrice: plan.sellPrice,
        orderQty: plan.orderQty,
        demand: totalDemand,
        actualSold,
        vendorUnitCost: plan.vendorUnitCost,
        qualityMode: plan.qualityMode,
        factoryActive: state.factory.built && state.factory.buildTurnsLeft <= 0,
        monthlyInterest: Math.round(state.debt * state.interestRate / 12),
        monthlyRent: state.realty === 'monthly' ? 1000000 : 0,
        safetyCost: state.factory.built && state.factory.safetyOn ? 5000000 : 0,
        otherFixed: state.monthlyFixedCost,
        rivals: getActiveRivals(state.rivals),
      })

      let salvageValue = 0
      if (hasEffect(stateWithEvent, 'noWaste')) {
        salvageValue = result.wasteCost
      }

      const advisorFee = getAdvisorFee(state.advisor, result.netProfit + salvageValue)
      const netProfit = result.netProfit + salvageValue - advisorFee
      const momentumState = updateMomentum(state.momentumHistory, netProfit)

      let healthDelta = calcHealthDelta({
        netProfit,
        waste: result.waste,
        orderQty: plan.orderQty,
        eventPenalty:
          state.lastEventResult?.effects?.healthDelta && state.lastEventResult.effects.healthDelta < 0
            ? 1
            : 0,
      })
      if (STRATEGIES[state.selectedStrategyId]?.effect?.stabilityBonus && healthDelta < 0) {
        healthDelta += 1
      }

      const companyHealth = applyHealth(
        stateWithEvent.companyHealth,
        healthDelta,
        state.maxHealth,
      )

      const salesByRivalId = Object.fromEntries(
        rivalPlayers.map((rival, index) => [
          rival.id,
          groupBreakdown.salesByPlayer[index + 1]?.totalSold ?? 0,
        ]),
      )

      let nextRivals = updateRivalsFromSettlement({
        rivals: state.rivals,
        totalDemand,
        salesByRivalId,
        playerPrice: plan.sellPrice,
      })

      const myShare = totalDemand > 0 ? actualSold / totalDemand : 0
      nextRivals = applyShareDamage(nextRivals, myShare)
      nextRivals = rotateBankruptRivals(nextRivals)

      const nextCapital =
        stateWithEvent.capital -
        result.prepayment +
        result.revenue -
        result.fixedTotal -
        advisorFee +
        salvageValue
      const nextFloor = state.floor + 1
      const nextEconPhase = advanceEconPhase(state.econPhase, state.meta.boomBonus ?? 0)
      const rivalsAfterJoin = ensureRivalsJoined(nextRivals, nextFloor)
      const biggestRival = getBiggestRival(rivalsAfterJoin)
      const rewardPending = createRewardDraft({
        floor: state.floor,
        momentum: momentumState.momentum,
      })

      let gameStatus = 'playing'
      if (companyHealth <= 0 || nextCapital - state.debt < -30000000) {
        gameStatus = 'bankrupt'
      } else if (state.floor >= state.maxFloors) {
        gameStatus = 'clear'
      }

      const settlement = {
        ...result,
        netProfit,
        advisorFee,
        salvageValue,
        floor: state.floor,
        demand: totalDemand,
        myShare,
        orderQty: plan.orderQty,
        sellPrice: plan.sellPrice,
        econFrom: state.econPhase,
        econTo: nextEconPhase,
        healthBefore: state.companyHealth,
        healthAfter: companyHealth,
        momentum: momentumState.momentum,
        momentumHistory: momentumState.momentumHistory,
        groupDemand: groupBreakdown.groupDemand,
        groupShares: {
          quality: groupBreakdown.groupShares.quality[0] ?? 0,
          brand: groupBreakdown.groupShares.brand[0] ?? 0,
          value: groupBreakdown.groupShares.value[0] ?? 0,
          general: groupBreakdown.groupShares.general[0] ?? 0,
        },
        consumerGroupRatios: groupBreakdown.ratios,
        leftoverDemand: result.leftoverDemand,
        biggestRival,
        strategyLog: strategyState.log,
        educationHint: getEducationHint({
          strategyId: state.selectedStrategyId,
          econPhase: state.econPhase,
          itemCategory: state.itemCategory,
          waste: result.waste,
          orderQty: plan.orderQty,
          netProfit,
        }),
      }

      const draftState = {
        ...state,
        screen: 'game',
        floor: nextFloor,
        gameStatus,
        floorStage: gameStatus === 'playing' ? 'settlement' : 'market',
        econPhase: nextEconPhase,
        capital: nextCapital,
        companyHealth,
        momentum: momentumState.momentum,
        momentumHistory: momentumState.momentumHistory,
        qualityScore: Math.max(0, stateWithEvent.qualityScore),
        brandValue: Math.max(0, stateWithEvent.brandValue),
        marketing: stateWithEvent.marketing,
        activeEffects: nextEffectList(
          consumeSingleEffect(
            consumeSingleEffect(
              consumeSingleEffect(stateWithEvent.activeEffects, 'noWaste'),
              'preview',
            ),
            'rivalFreeze',
          ),
        ),
        lastSettlement: settlement,
        rewardPending: gameStatus === 'playing' ? rewardPending : null,
        rewardSelection: null,
        rewardClaimed: false,
        currentEventCardId: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        selectedStrategyId: null,
        selectedOrderTier: null,
        shopPurchasesThisFloor: [],
        warningAlerts: [],
        rivals: rivalsAfterJoin,
        consumerGroupRatios: getConsumerGroupRatios(nextEconPhase),
        lastGroupShares: settlement.groupShares,
        lastLeftoverDemand: result.leftoverDemand,
        profitHistory: [...state.profitHistory, netProfit].slice(-12),
        cumulativeProfit: state.cumulativeProfit + netProfit,
        peakMarketShare: Math.max(state.peakMarketShare, myShare),
        advisorFeeTotal: state.advisorFeeTotal + advisorFee,
        decisionLog: [
          {
            floor: state.floor,
            strategyId: state.selectedStrategyId,
            netProfit,
            educationHint: settlement.educationHint,
          },
          ...state.decisionLog,
        ].slice(0, 12),
      }

      if (gameStatus === 'playing') {
        set(draftState)
        saveSaveSlot(buildSaveSnapshot(get()))
        enqueueToast(
          `${state.floor}층 정산 완료 · ${netProfit >= 0 ? '+' : ''}${Math.round(netProfit).toLocaleString()}원`,
          netProfit >= 0 ? 'positive' : 'negative',
        )
        return
      }

      const legacyCards = resolveLegacyCards(draftState, gameStatus)
      const meta = recordGameEnd(gameStatus, {
        ...state.meta,
        advisorUsed: Array.from(new Set([...(state.meta.advisorUsed ?? []), state.advisor])),
        analystPlays: state.meta.analystPlays + (state.advisor === 'analyst' ? 1 : 0),
        floor50Reached:
          state.floor >= 50 ? state.meta.floor50Reached + 1 : state.meta.floor50Reached,
        floor80Reached:
          state.floor >= 80 ? state.meta.floor80Reached + 1 : state.meta.floor80Reached,
      })

      set({
        ...draftState,
        screen: 'gameover',
        gameStatus,
        legacyCards,
        meta,
        saveExists: false,
      })
      clearSaveSlot()
      const playHistory = appendRunHistory(
        buildHistoryEntry({ ...draftState, legacyCards }, gameStatus),
      )
      set((current) => ({
        ...current,
        playHistory,
        saveExists: false,
      }))
    },
  }
})
