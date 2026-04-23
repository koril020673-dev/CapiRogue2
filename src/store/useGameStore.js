import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import { getConsumerGroupRatios } from '../constants/consumerGroups.js'
import { drawWeightedEventCards, getEventCardById } from '../constants/docEvents.js'
import { LEGACY_CONDITIONS } from '../constants/legacy.js'
import { CREDIT_SHOP_ITEMS } from '../constants/rewards.js'
import { createInitialRivals } from '../constants/rivals.js'
import { ORDER_TIERS, STRATEGIES, VENDOR } from '../constants/strategies.js'
import { clamp } from '../lib/gameMath.js'
import { applyStrategyEffect, previewStrategyEffect } from '../logic/brandQualityEngine.js'
import { getPrice } from '../logic/creditEngine.js'
import {
  calcDemand,
  calcDemandEstimate,
  calcGroupDemandBreakdown,
} from '../logic/demandEngine.js'
import { advanceEconPhase } from '../logic/econEngine.js'
import { drawEventCards } from '../logic/eventEngine.js'
import { applyHealth, calcHealthDelta } from '../logic/healthEngine.js'
import { calcAttraction } from '../logic/marketEngine.js'
import {
  loadLegacyCards,
  loadMeta,
  recordGameEnd,
  saveLegacyCards,
} from '../logic/metaEngine.js'
import { getMomentumEffect, updateMomentum } from '../logic/momentumEngine.js'
import { generateRewards } from '../logic/rewardEngine.js'
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
import { calcSellPrice, calcSettlement, MAX_ORDER_MUL } from '../logic/settlementEngine.js'
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

const FLOOR_STAGES = new Set([
  'market',
  'company',
  'event',
  'strategy',
  'confirm',
  'settlement',
  'shop',
])

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
    alerts.push('⚠ 현금 부족 경고')
  }

  if (hasThreeStraightLosses) {
    alerts.push('⚠ 3연속 적자')
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
    customOrderQty: '',
    currentEventCardId: null,
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    currentSituationEvent: null,
    currentPlayerEvent: null,
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
    currentRewards: [],
    rewardPending: null,
    rewardSelection: null,
    rewardClaimed: false,
    shopPurchasesThisFloor: [],
    _fixedCostMul: 1,
    _interestMul: 1,
    _eventCostMul: 1,
    _eventCostDuration: 0,
    _eventDemandMul: 1,
    _eventDemandDuration: 0,
    _eventInterestRateAdd: 0,
    _eventInterestDuration: 0,
    _shutdownLeft: 0,
    _pendingPlayerChoice: null,
    _lastEventResult: null,
    _eventsGeneratedFloor: null,
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

  return {
    ...base,
    rivals,
    warningAlerts: getWarningAlerts({ ...base, rivals }),
  }
}

function normalizeRivalsForLoad(rivals, floor) {
  if (Array.isArray(rivals)) {
    return ensureRivalsJoined(rivals, floor)
  }

  return ensureRivalsJoined(createInitialRivals(), floor)
}

function normalizeLoadedRunState(saved) {
  const base = createBaseState()
  const floor = clamp(Math.round(Number(saved?.floor) || base.floor), 1, base.maxFloors)
  const eventsGenerated = saved?._eventsGeneratedFloor === floor
  const loadedStage = FLOOR_STAGES.has(saved?.floorStage) ? saved.floorStage : 'market'
  const mustReplayEventGate =
    ['event', 'strategy', 'confirm'].includes(loadedStage) &&
    !eventsGenerated &&
    !saved?.currentEventResolved
  const missingSettlement = ['settlement', 'shop'].includes(loadedStage) && !saved?.lastSettlement
  const floorStage = mustReplayEventGate || missingSettlement ? 'market' : loadedStage
  const currentPlayerEvent = eventsGenerated ? saved?.currentPlayerEvent ?? null : null

  return {
    ...base,
    ...saved,
    screen: 'game',
    gameStatus: 'playing',
    floor,
    floorStage,
    vendor: VENDOR,
    factory: {
      ...base.factory,
      ...(saved?.factory ?? {}),
    },
    marketing: {
      ...base.marketing,
      ...(saved?.marketing ?? {}),
    },
    rivals: normalizeRivalsForLoad(saved?.rivals, floor),
    activeEffects: Array.isArray(saved?.activeEffects) ? saved.activeEffects : [],
    profitHistory: Array.isArray(saved?.profitHistory) ? saved.profitHistory : [],
    currentRewards: Array.isArray(saved?.currentRewards) ? saved.currentRewards : [],
    shopPurchasesThisFloor: Array.isArray(saved?.shopPurchasesThisFloor)
      ? saved.shopPurchasesThisFloor
      : [],
    currentSituationEvent: eventsGenerated ? saved?.currentSituationEvent ?? null : null,
    currentPlayerEvent,
    currentEventResolved: Boolean(saved?.currentEventResolved || (eventsGenerated && !currentPlayerEvent)),
    currentEventChoiceId: saved?.currentEventChoiceId ?? null,
    currentEventCardId: null,
    selectedStrategyId: saved?.selectedStrategyId ?? null,
    selectedOrderTier: saved?.selectedOrderTier ?? null,
    customOrderQty: saved?.customOrderQty ?? '',
    _eventCostMul: saved?._eventCostMul ?? 1,
    _eventCostDuration: saved?._eventCostDuration ?? 0,
    _eventDemandMul: saved?._eventDemandMul ?? 1,
    _eventDemandDuration: saved?._eventDemandDuration ?? 0,
    _eventInterestRateAdd: saved?._eventInterestRateAdd ?? 0,
    _eventInterestDuration: saved?._eventInterestDuration ?? 0,
    _shutdownLeft: saved?._shutdownLeft ?? 0,
    _pendingPlayerChoice: null,
    _lastEventResult: saved?._lastEventResult ?? null,
    _eventsGeneratedFloor: eventsGenerated ? floor : null,
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

function getEventCostMultiplier(state) {
  return state._eventCostMul ?? 1
}

function getEventDemandMultiplier(state) {
  return state._eventDemandMul ?? 1
}

function getEventInterestRate(state) {
  return state.interestRate + (state._eventInterestRateAdd ?? 0)
}

function getDemandMultiplier(state) {
  return (1 + getEffectValue(state, 'demandMul')) * getEventDemandMultiplier(state)
}

function applyAutoEffect(state, effect) {
  if (!effect) {
    return {}
  }

  const duration = effect.duration ?? 1
  const updates = {}

  if (effect.costMul) {
    updates._eventCostMul = (state._eventCostMul ?? 1) * effect.costMul
    updates._eventCostDuration = Math.max(state._eventCostDuration ?? 0, duration)
  }

  if (effect.demandMul) {
    updates._eventDemandMul = (state._eventDemandMul ?? 1) * effect.demandMul
    updates._eventDemandDuration = Math.max(state._eventDemandDuration ?? 0, duration)
  }

  if (effect.interestRateAdd) {
    updates._eventInterestRateAdd = (state._eventInterestRateAdd ?? 0) + effect.interestRateAdd
    updates._eventInterestDuration = Math.max(state._eventInterestDuration ?? 0, duration)
  }

  return updates
}

function applyPlayerEventEffect(state, result) {
  const updates = {}

  switch (result.effect) {
    case 'capital':
      updates.capital = result.v === -999 ? Math.floor(state.capital * 0.5) : state.capital + result.v
      break
    case 'brand':
      updates.brandValue = Math.max(0, state.brandValue + result.v)
      break
    case 'quality':
      updates.qualityScore = Math.max(0, state.qualityScore + result.v)
      break
    case 'resist':
      updates.priceResistance = Math.min(0.5, state.priceResistance + result.v)
      break
    case 'demandMul':
      updates._eventDemandMul = (state._eventDemandMul ?? 1) * (1 + result.v)
      updates._eventDemandDuration = Math.max(state._eventDemandDuration ?? 0, 1)
      break
    case 'costMul':
      updates._eventCostMul = (state._eventCostMul ?? 1) * (1 + result.v)
      updates._eventCostDuration = Math.max(state._eventCostDuration ?? 0, 1)
      break
    case 'shutdown':
      updates._shutdownLeft = Math.max(state._shutdownLeft ?? 0, result.v)
      break
    case 'none':
    default:
      break
  }

  return updates
}

function decrementTimedEventFields(state) {
  const costDuration = Math.max(0, (state._eventCostDuration ?? 0) - 1)
  const demandDuration = Math.max(0, (state._eventDemandDuration ?? 0) - 1)
  const interestDuration = Math.max(0, (state._eventInterestDuration ?? 0) - 1)

  return {
    _eventCostMul: costDuration > 0 ? state._eventCostMul ?? 1 : 1,
    _eventCostDuration: costDuration,
    _eventDemandMul: demandDuration > 0 ? state._eventDemandMul ?? 1 : 1,
    _eventDemandDuration: demandDuration,
    _eventInterestRateAdd: interestDuration > 0 ? state._eventInterestRateAdd ?? 0 : 0,
    _eventInterestDuration: interestDuration,
    _shutdownLeft: Math.max(0, (state._shutdownLeft ?? 0) - 1),
  }
}

function drawOutcome(outcomes = []) {
  if (outcomes.length === 0) {
    return null
  }

  let cursor = Math.random()
  for (const outcome of outcomes) {
    cursor -= outcome.p
    if (cursor <= 0) {
      return outcome
    }
  }

  return outcomes[outcomes.length - 1]
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
  if (!strategy) {
    return null
  }

  const momentumMul = 1 + getMomentumEffect(state.momentum).demandMul
  const blackSwanMul = state.activeBlackSwan?.demandMul ?? 1
  const demandEstimate = calcDemandEstimate({
    category: state.itemCategory,
    econPhase: state.econPhase,
    industryTier: state.industryTier,
    momentumMul,
    blackSwanMul,
    eventMul: getDemandMultiplier(state),
  })

  const vendorUnitCost = Math.round(
    VENDOR.baseUnitCost * (1 + getEffectValue(state, 'tempCostMul')),
  )
  const eventCostMul = getEventCostMultiplier(state)
  let orderQty = 0

  if (orderTierId === 'custom') {
    const maxOrderQty = Math.max(1, Math.round(demandEstimate * MAX_ORDER_MUL))
    orderQty = clamp(Math.round(Number(state.customOrderQty) || 0), 1, maxOrderQty)
  } else {
    const orderTier = ORDER_TIERS[orderTierId]
    if (!orderTier) {
      return null
    }

    const orderMul = getOrderMultipliers(strategyId)[orderTier.index] ?? 1
    const orderCapMul = strategy.effect?.orderCapMul ?? 1
    orderQty = Math.max(12, Math.round(demandEstimate * orderMul * orderCapMul))
  }

  const sellPrice = calcSellPrice(strategy, vendorUnitCost)

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
        (state.factory.built ? 0.6 : 1) *
        eventCostMul,
    ),
    demandEstimate,
    eventCostMul,
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
  const timedEventFields = decrementTimedEventFields(state)
  const base = {
    ...state,
    floorStage: 'market',
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    selectedStrategyId: null,
    selectedOrderTier: null,
    customOrderQty: '',
    currentRewards: [],
    rewardPending: null,
    rewardSelection: null,
    rewardClaimed: false,
    shopPurchasesThisFloor: [],
    previewOpen: false,
    currentEventCardId: null,
    currentSituationEvent: null,
    currentPlayerEvent: null,
    _pendingPlayerChoice: null,
    _lastEventResult: null,
    _eventsGeneratedFloor: null,
    ...timedEventFields,
    activeEffects: keepEffects ? state.activeEffects : [],
  }

  return {
    ...base,
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
          loginError: 'ID? 鍮꾨?踰덊샇瑜?紐⑤몢 ?낅젰?댁＜?몄슂.',
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
        isAdmin ? '愿由ъ옄 紐⑤뱶濡?濡쒓렇?몃릺?덉뒿?덈떎.' : `${safeUserId} 怨꾩젙?쇰줈 濡쒓렇?몃릺?덉뒿?덈떎.`,
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

      const normalized = normalizeLoadedRunState(saved)
      set((state) => ({
        ...normalized,
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
        currentEventResolved:
          state.currentEventResolved ||
          (state._eventsGeneratedFloor === state.floor && !state.currentPlayerEvent),
      })),

    returnToStrategyStage: () =>
      set((state) => ({
        ...state,
        floorStage: 'strategy',
        selectedOrderTier: null,
        customOrderQty: '',
        currentEventResolved: state._eventsGeneratedFloor === state.floor,
      })),

    generateFloorEvents: () => {
      const state = get()
      if (state._eventsGeneratedFloor === state.floor) {
        set((current) => ({
          ...current,
          floorStage: 'event',
        }))
        return
      }

      const { situationCard, playerCard } = drawEventCards(state)
      const effectUpdates = applyAutoEffect(state, situationCard?.autoEffect)
      const nextState = {
        ...state,
        ...effectUpdates,
        currentSituationEvent: situationCard,
        currentPlayerEvent: playerCard,
        currentEventResolved: !playerCard,
        currentEventChoiceId: null,
        lastEventResult: null,
        _lastEventResult: null,
        _pendingPlayerChoice: null,
        _eventsGeneratedFloor: state.floor,
        floorStage: 'event',
      }

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
    },

    resolvePlayerEvent: (choiceId) => {
      const state = get()
      const event = state.currentPlayerEvent
      const choice = event?.choices?.find((entry) => entry.id === choiceId)
      const result = drawOutcome(choice?.outcomes)
      if (!event || !choice || !result) {
        return
      }

      const effectUpdates = applyPlayerEventEffect(state, result)
      const nextState = {
        ...state,
        ...effectUpdates,
        currentPlayerEvent: null,
        currentEventResolved: true,
        currentEventChoiceId: choiceId,
        lastEventResult: {
          cardId: event.id,
          choiceId,
          success: true,
          message: result.msg,
          effects: {},
        },
        _lastEventResult: result.msg,
        _pendingPlayerChoice: null,
        floorStage: 'strategy',
      }

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast(result.msg, result.effect === 'none' ? 'neutral' : 'warning')
    },

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

    getOrderLimit: () => {
      const state = get()
      const demandEstimate = calcDemandEstimate({
        category: state.itemCategory,
        econPhase: state.econPhase,
        industryTier: state.industryTier,
        momentumMul: 1 + getMomentumEffect(state.momentum).demandMul,
        blackSwanMul: state.activeBlackSwan?.demandMul ?? 1,
        eventMul: getDemandMultiplier(state),
      })

      return Math.max(1, Math.round(demandEstimate * MAX_ORDER_MUL))
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
        eventMul: getDemandMultiplier(state),
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
        Math.round((state.debt * getEventInterestRate(state) * (state._interestMul ?? 1)) / 12) +
        (state.realty === 'monthly' ? 1000000 : 0) +
        Math.round(state.monthlyFixedCost * (state._fixedCostMul ?? 1))
      const predictedProfit = predictedRevenue - predictedCost - fixedTotal

      return {
        predictedSales,
        predictedProfit,
      }
    },

    selectStrategy: (strategyId) =>
      set((state) => {
        if (!state.currentEventResolved) {
          return {
            ...state,
            floorStage: state._eventsGeneratedFloor === state.floor ? 'event' : 'company',
          }
        }

        return {
          ...state,
          selectedStrategyId: strategyId,
          selectedOrderTier: null,
          customOrderQty: '',
          floorStage: 'confirm',
        }
      }),

    selectOrderTier: (orderTierId) =>
      set((state) => ({
        ...state,
        selectedOrderTier: orderTierId,
        customOrderQty: '',
      })),

    setCustomOrderQty: (orderQty) =>
      set((state) => ({
        ...state,
        selectedOrderTier: 'custom',
        customOrderQty: orderQty,
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

    advanceToSettlement: () =>
      set((state) => ({
        ...state,
        floorStage: 'settlement',
      })),

    advanceToShop: () =>
      set((state) => ({
        ...state,
        floorStage: 'shop',
        currentRewards: [],
        rewardSelection: null,
        rewardClaimed: false,
      })),

    closeSettlementModal: () => {
      get().advanceToShop()
    },

    generateFloorRewards: () => {
      const state = get()
      if (state.currentRewards.length > 0) {
        return
      }

      set((current) => ({
        ...current,
        currentRewards: generateRewards(current.momentum),
      }))
    },

    selectReward: (rewardId) =>
      set((state) => ({
        ...state,
        rewardSelection: rewardId,
      })),

    applyReward: (reward) => {
      const state = get()
      if (!reward) {
        return
      }

      const updates = {
        rewardClaimed: true,
      }

      switch (reward.effectType) {
        case 'health':
          updates.companyHealth = Math.min(state.maxHealth, state.companyHealth + reward.value)
          break
        case 'brand':
          updates.brandValue = state.brandValue + reward.value
          break
        case 'quality':
          updates.qualityScore = state.qualityScore + reward.value
          break
        case 'credit':
          updates.credits = state.credits + reward.value
          break
        case 'capitalMul':
          updates.capital = Math.round(state.capital * (1 + reward.value))
          break
        case 'resistance':
          updates.priceResistance = state.priceResistance + reward.value
          break
        case 'fixedCostMul':
          updates._fixedCostMul = (state._fixedCostMul ?? 1) * (1 - reward.value)
          break
        case 'interestMul':
          updates._interestMul = (state._interestMul ?? 1) * (1 - reward.value)
          break
        case 'costMul':
          updates.activeEffects = [
            ...state.activeEffects,
            {
              id: `reward-cost-${Date.now()}`,
              type: 'tempCostMul',
              value: -reward.value,
              turnsLeft: 1,
            },
          ]
          break
        default:
          break
      }

      set((current) => ({
        ...current,
        ...updates,
      }))
    },

    claimReward: () => {
      const state = get()
      const reward = state.currentRewards.find((entry) => entry.id === state.rewardSelection)
      if (!reward) {
        return
      }

      get().applyReward(reward)
      saveSaveSlot(buildSaveSnapshot(get()))
    },

    advanceToNextFloor: () => {
      const state = get()

      if (state.floor >= state.maxFloors) {
        const terminalState = {
          ...state,
          screen: 'gameover',
          gameStatus: 'clear',
          saveExists: false,
        }
        const legacyCards = resolveLegacyCards(terminalState, 'clear')
        const meta = recordGameEnd('clear', {
          ...state.meta,
          advisorUsed: Array.from(new Set([...(state.meta.advisorUsed ?? []), state.advisor])),
          analystPlays: state.meta.analystPlays + (state.advisor === 'analyst' ? 1 : 0),
          floor50Reached:
            state.floor >= 50 ? state.meta.floor50Reached + 1 : state.meta.floor50Reached,
          floor80Reached:
            state.floor >= 80 ? state.meta.floor80Reached + 1 : state.meta.floor80Reached,
        })

        set({
          ...terminalState,
          legacyCards,
          meta,
        })
        clearSaveSlot()
        const playHistory = appendRunHistory(
          buildHistoryEntry({ ...terminalState, legacyCards }, 'clear'),
        )
        set((current) => ({
          ...current,
          playHistory,
          saveExists: false,
        }))
        return
      }

      const nextFloor = state.floor + 1
      const healthBonus = nextFloor % 10 === 0 && state.companyHealth <= 5 ? 1 : 0
      const nextState = prepareNextFloorState({
        ...state,
        floor: nextFloor,
        floorStage: 'market',
        rivals: ensureRivalsJoined(state.rivals, nextFloor),
        companyHealth: Math.min(state.maxHealth, state.companyHealth + healthBonus),
        currentRewards: [],
        rewardPending: null,
        rewardSelection: null,
        rewardClaimed: false,
      })

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
    },

    continueFromShop: () => {
      const state = get()
      if (state.floorStage !== 'shop' || !state.rewardSelection) {
        return
      }

      const reward = state.currentRewards.find((entry) => entry.id === state.rewardSelection)
      if (!reward) {
        return
      }

      get().applyReward(reward)
      get().advanceToNextFloor()
    },

    buyItem: (itemId) => {
      const state = get()
      if (state.floorStage !== 'shop') {
        return
      }

      const item = CREDIT_SHOP_ITEMS.find((entry) => entry.id === itemId)
      if (!item) {
        return
      }

      const price = getPrice(item.baseCost, state.floor)
      if (state.credits < price || state.shopPurchasesThisFloor.includes(itemId)) {
        return
      }

      const activeEffects = [...state.activeEffects]
      let companyHealth = state.companyHealth

      if (itemId === 'health_1') {
        companyHealth = Math.min(state.maxHealth, state.companyHealth + 1)
      }

      if (itemId === 'health_2') {
        companyHealth = Math.min(state.maxHealth, state.companyHealth + 2)
      }

      if (itemId === 'preview') {
        activeEffects.push({ id: `preview-${Date.now()}`, type: 'preview', value: 1, turnsLeft: 1 })
      }

      if (itemId === 'freeze') {
        activeEffects.push({ id: `freeze-${Date.now()}`, type: 'rivalFreeze', value: 1, turnsLeft: 1 })
      }

      if (itemId === 'no_waste') {
        activeEffects.push({ id: `nowaste-${Date.now()}`, type: 'noWaste', value: 1, turnsLeft: 1 })
      }

      const nextState = {
        ...state,
        credits: state.credits - price,
        companyHealth,
        activeEffects,
        shopPurchasesThisFloor: [...state.shopPurchasesThisFloor, itemId],
      }

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
    },

    buyShopItem: (itemId) => {
      get().buyItem(itemId)
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
        floor: state.floor,
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
      enqueueToast(`${nextFloor}痢듭쑝濡??대룞?덉뒿?덈떎.`, 'warning')
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
      enqueueToast(`?꾧툑 ${Math.round(Number(amount) || 0).toLocaleString()}?먯쓣 吏湲됲뻽?듬땲??`, 'positive')
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
      enqueueToast(`?щ젅??${Math.round(Number(amount) || 0)}C瑜?吏湲됲뻽?듬땲??`, 'positive')
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
      enqueueToast('?뚯궗 泥대젰??理쒕?濡??뚮났?덉뒿?덈떎.', 'positive')
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
        eventMul: getDemandMultiplier(stateWithEvent),
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
      const actualSold =
        (stateWithEvent._shutdownLeft ?? 0) > 0 ? 0 : Math.min(playerDemand.totalSold, plan.orderQty)
      const result = calcSettlement({
        sellPrice: plan.sellPrice,
        orderQty: plan.orderQty,
        demand: totalDemand,
        actualSold,
        vendorUnitCost: plan.vendorUnitCost,
        qualityMode: plan.qualityMode,
        factoryActive: state.factory.built && state.factory.buildTurnsLeft <= 0,
        eventCostMul: plan.eventCostMul,
        monthlyInterest: Math.round(
          (state.debt * getEventInterestRate(stateWithEvent) * (state._interestMul ?? 1)) / 12,
        ),
        monthlyRent: state.realty === 'monthly' ? 1000000 : 0,
        safetyCost: state.factory.built && state.factory.safetyOn ? 5000000 : 0,
        otherFixed: Math.round(state.monthlyFixedCost * (state._fixedCostMul ?? 1)),
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
        econPhase: state.econPhase,
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
      const nextEconPhase = advanceEconPhase(state.econPhase, state.meta.boomBonus ?? 0)
      const biggestRival = getBiggestRival(nextRivals)

      let gameStatus = 'playing'
      if (companyHealth <= 0 || nextCapital - state.debt < -30000000) {
        gameStatus = 'bankrupt'
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
        floor: state.floor,
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
        currentRewards: [],
        rewardPending: null,
        rewardSelection: null,
        rewardClaimed: false,
        currentEventCardId: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        selectedStrategyId: null,
        selectedOrderTier: null,
        customOrderQty: '',
        shopPurchasesThisFloor: [],
        warningAlerts: [],
        rivals: nextRivals,
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
        saveSaveSlot(buildSaveSnapshot(draftState))
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
