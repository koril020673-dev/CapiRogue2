import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import { BLACK_SWANS } from '../constants/blackSwans.js'
import { drawWeightedEventCards, getEventCardById } from '../constants/docEvents.js'
import { ECO_DISPLAY, ECO_WEIGHTS } from '../constants/economy.js'
import { ECONOMIC_WARS } from '../constants/economicWars.js'
import { getEducationHint } from '../constants/educationHints.js'
import { LEGACY_CONDITIONS } from '../constants/legacy.js'
import { CREDIT_SHOP } from '../constants/rewards.js'
import {
  RIVAL_NAMES,
  RIVALS,
  RIVAL_ORDER,
  createInitialRivals,
} from '../constants/rivals.js'
import {
  ORDER_TIERS,
  STRATEGIES,
  VENDOR,
  VENDOR_MODE_MUL,
} from '../constants/strategies.js'
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
import {
  appendRunHistory,
  clearSaveSlot,
  clearAuthSession,
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

const MAX_HEALTH = 10
const FIXED_DIFFICULTY = {
  capital: 30000000,
  debt: 0,
  interestRate: 0.072,
}

const RIVAL_JOIN_TOAST = {
  megaflex: '새 경쟁사의 그림자 · 메가플렉스가 저가 공세를 시작했습니다.',
  aura: '시장 신호 감지 · 아우라가 프리미엄 전선에 합류했습니다.',
  memecatch: '트렌드 급부상 · 밈캐치가 변칙 마케팅으로 난입했습니다.',
  nexuscore: '기술 파고 접근 · 넥서스코어가 고급 시장에 진입했습니다.',
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
    state.monthlyFixedCost +
      (state.realty === 'monthly' ? 1000000 : 0) +
      (state.factory.built && state.factory.safetyOn ? 5000000 : 0),
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

function createBaseState() {
  const meta = loadMeta()
  const legacyCards = loadLegacyCards()
  const settings = loadSettings()
  const playHistory = loadRunHistory()
  const saveExists = hasSaveSlot()
  const auth = loadAuthSession()

  return {
    screen: auth.isLoggedIn ? 'title' : 'login',
    floor: 1,
    maxFloors: 120,
    gameStatus: 'idle',
    floorPhase: 'normal',
    auth,
    loginError: '',
    advisor: null,
    advisorDraft: null,
    difficulty: 'fixed',
    difficultyDraft: 'fixed',
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
    shopScreenOpen: false,
    profitHistory: [],
    cumulativeProfit: 0,
    legacyCards,
    meta,
    playHistory,
    settings,
    saveExists,
    advisorFeeTotal: 0,
    warWinCount: 0,
    currentEventCardId: null,
    currentEventResolved: false,
    currentEventChoiceId: null,
    lastEventResult: null,
    selectedStrategyId: null,
    selectedOrderTier: null,
    rewardPending: null,
    rewardSelection: null,
    rewardClaimed: false,
    shopOpen: false,
    shopPurchasesThisFloor: [],
    warningAlerts: [],
    toasts: [],
    decisionLog: [],
    peakMarketShare: 0,
    warPaused: false,
    previewOpen: false,
  }
}

function getEconomicWarStateForFloor(floor, rivals) {
  const activeEntry = Object.entries(ECONOMIC_WARS)
    .map(([startFloor, war]) => ({
      startFloor: Number(startFloor),
      war,
    }))
    .sort((left, right) => right.startFloor - left.startFloor)
    .find(({ startFloor, war }) => {
      if (floor < startFloor) {
        return false
      }

      if (war.duration === 'until clear') {
        return true
      }

      return floor < startFloor + war.duration
    })

  if (!activeEntry) {
    return null
  }

  const { startFloor, war } = activeEntry
  const rivalIds =
    war.rival === 'all'
      ? RIVAL_ORDER.filter((rivalId) => rivals[rivalId]?.active)
      : [war.rival]

  return {
    warId: war.id,
    name: war.name,
    rivalIds,
    duration: war.duration,
    floorsLeft:
      war.duration === 'until clear'
        ? 999
        : Math.max(0, war.duration - Math.max(0, floor - startFloor)),
  }
}

function createRunState({ advisor, meta, legacyCards, settings, playHistory, saveExists }) {
  const base = applyLegacyBonuses(
    {
      ...createBaseState(),
      screen: 'game',
      advisor,
      advisorDraft: advisor,
      difficulty: 'fixed',
      difficultyDraft: 'fixed',
      gameStatus: 'playing',
      capital: FIXED_DIFFICULTY.capital,
      debt: FIXED_DIFFICULTY.debt,
      interestRate: FIXED_DIFFICULTY.interestRate,
      companyHealth:
        advisor === 'strategist'
          ? MAX_HEALTH
          : advisor === 'actuary'
            ? MAX_HEALTH
            : 10,
      meta,
      legacyCards,
      settings,
      playHistory,
      saveExists,
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
    warningAlerts: [],
  }

  next.rivals = ensureRivalsJoined(next.rivals, 1, next.industryTier)
  next.currentEventCardId = drawCurrentEvent({
    ...next,
    rivals: next.rivals,
  })
  next.warningAlerts = getWarningAlerts(next)

  return next
}

function composeTurnPlan(state, strategyId, orderTierId = state.selectedOrderTier) {
  const strategy = STRATEGIES[strategyId]
  const orderTier = ORDER_TIERS[orderTierId]
  if (!strategy || !orderTier) {
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
  const [minimumOrderMul, maximumOrderMul] = strategy.orderRange
  const midpointOrderMul = roundTo((minimumOrderMul + maximumOrderMul) / 2, 2)
  const orderMultipliers = [minimumOrderMul, midpointOrderMul, maximumOrderMul]
  const chosenOrderMul = orderMultipliers[orderTier.index] ?? midpointOrderMul

  return {
    strategyId,
    orderTierId,
    orderQty: Math.max(25, Math.round(predictedDemand * chosenOrderMul)),
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
    orderMultipliers,
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

function buildSaveSnapshot(state) {
  const { auth, loginError, ...persisted } = state

  return {
    ...persisted,
    screen: 'game',
    saveExists: true,
    toasts: [],
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
        shopOpen: false,
        previewOpen: false,
        settlementModalOpen: false,
        shopScreenOpen: false,
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
        ...state,
        ...saved,
        screen: 'game',
        gameStatus: 'playing',
        saveExists: true,
        playHistory: loadRunHistory(),
        settings: state.settings,
        toasts: [],
      }))
    },

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

    setAdvisorDraft: (advisorId) =>
      set((state) => ({
        ...state,
        advisorDraft: advisorId,
      })),

    adminJumpToFloor: (targetFloor) => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextFloor = clamp(Math.round(Number(targetFloor) || 1), 1, state.maxFloors)
      let nextRivals = createInitialRivals()

      for (let floorIndex = 2; floorIndex <= nextFloor; floorIndex += 1) {
        nextRivals = ensureRivalsJoined(nextRivals, floorIndex, state.industryTier)
      }

      const activeEconomicWar = getEconomicWarStateForFloor(nextFloor, nextRivals)
      const draftState = {
        ...state,
        floor: nextFloor,
        rivals: nextRivals,
        activeEconomicWar,
        activeBlackSwan: null,
        blackSwanSeen: false,
        settlementModalOpen: false,
        shopScreenOpen: false,
        selectedStrategyId: null,
        selectedOrderTier: null,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        lastSettlement: null,
        rewardPending: null,
        rewardSelection: null,
        rewardClaimed: false,
        shopOpen: false,
        shopPurchasesThisFloor: [],
        warningAlerts: [],
      }

      const currentEventCardId = drawCurrentEvent(draftState)
      const finalState = {
        ...draftState,
        currentEventCardId,
        warningAlerts: getWarningAlerts({
          ...draftState,
          currentEventCardId,
        }),
        floorPhase: activeEconomicWar ? 'economic-war' : 'normal',
      }

      set(finalState)
      saveSaveSlot(buildSaveSnapshot(finalState))
      enqueueToast(`${nextFloor}층 체크포인트로 이동했습니다.`, 'warning')
    },

    adminGrantCapital: (amount) => {
      const state = get()
      if (!state.auth?.isAdmin || state.gameStatus !== 'playing') {
        return
      }

      const nextCapital = Math.max(0, state.capital + Math.round(Number(amount) || 0))
      const nextState = {
        ...state,
        capital: nextCapital,
        warningAlerts: getWarningAlerts({
          ...state,
          capital: nextCapital,
        }),
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

      const nextCredits = Math.max(0, state.credits + Math.round(Number(amount) || 0))
      const nextState = {
        ...state,
        credits: nextCredits,
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
        warningAlerts: getWarningAlerts({
          ...state,
          companyHealth: state.maxHealth,
        }),
      }

      set(nextState)
      saveSaveSlot(buildSaveSnapshot(nextState))
      enqueueToast('회사 체력을 최대로 회복했습니다.', 'positive')
    },

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
        saveExists: true,
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
        saveExists: true,
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
          prepayment:
            (plan?.orderQty ?? 0) * (plan?.previewUnitCost ?? 0),
        }
      })
    },

    selectStrategy: (strategyId) => {
      set((state) => ({
        ...state,
        selectedStrategyId: strategyId,
        selectedOrderTier: null,
      }))
      const current = get()
      if (current.currentEventResolved && current.selectedOrderTier) {
        get().advanceFloor()
      }
    },

    selectOrderTier: (orderTierId) => {
      set((state) => ({
        ...state,
        selectedOrderTier: orderTierId,
      }))
      const current = get()
      if (current.currentEventResolved && current.selectedStrategyId) {
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
      if (get().selectedStrategyId && get().selectedOrderTier) {
        get().advanceFloor()
      }
    },

    closeSettlementModal: () =>
      set((state) => ({
        ...state,
        settlementModalOpen: false,
        shopScreenOpen: state.gameStatus === 'playing',
        shopOpen: true,
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
      if (!state.shopScreenOpen) {
        return
      }

      const nextState = {
        ...state,
        shopScreenOpen: false,
        shopOpen: false,
        rewardPending: null,
        rewardSelection: null,
        rewardClaimed: false,
        currentEventResolved: false,
        currentEventChoiceId: null,
        lastEventResult: null,
        selectedStrategyId: null,
        selectedOrderTier: null,
        currentEventCardId: null,
        warningAlerts: [],
        shopPurchasesThisFloor: [],
      }

      const currentEventCardId = drawCurrentEvent(nextState)
      const withEvent = {
        ...nextState,
        currentEventCardId,
      }
      const warningAlerts = getWarningAlerts(withEvent)
      const finalState = {
        ...withEvent,
        warningAlerts,
      }

      set(finalState)
      saveSaveSlot(buildSaveSnapshot(finalState))
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
      saveSaveSlot(buildSaveSnapshot(get()))
    },

    advanceFloor: () => {
      const state = get()
      if (
        state.gameStatus !== 'playing' ||
        !state.selectedStrategyId ||
        !state.selectedOrderTier ||
        !state.currentEventResolved
      ) {
        return
      }

      const plan = composeTurnPlan(state, state.selectedStrategyId, state.selectedOrderTier)
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

      const rivalsAfterJoin = ensureRivalsJoined(nextRivals, nextFloor, state.industryTier)
      const joinedRivalIds = RIVAL_ORDER.filter(
        (rivalId) => !nextRivals?.[rivalId]?.active && rivalsAfterJoin?.[rivalId]?.active,
      )

      const draftState = {
        ...state,
        screen: 'game',
        floor: nextFloor,
        econPhase: nextEconPhase,
        capital: nextCapital,
        companyHealth,
        momentum: momentumState.momentum,
        momentumHistory: momentumState.momentumHistory,
        rivals: rivalsAfterJoin,
        activeEconomicWar: activeEconomicWar ?? maybeStartEconomicWar({ ...state, floor: nextFloor, rivals: nextRivals }),
        activeBlackSwan,
        blackSwanSeen,
        activeEffects: nextEffectList(state.activeEffects),
        warningAlerts: [],
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
        shopScreenOpen: false,
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

      const latestState = get()
      if (gameStatus === 'playing') {
        saveSaveSlot(buildSaveSnapshot(latestState))
        joinedRivalIds.forEach((rivalId) => {
          enqueueToast(RIVAL_JOIN_TOAST[rivalId] ?? '새 경쟁사가 시장에 진입했습니다.', 'warning')
        })
      } else {
        clearSaveSlot()
        const playHistory = appendRunHistory(buildHistoryEntry(latestState, gameStatus))
        set({
          screen: 'gameover',
          playHistory,
          saveExists: false,
        })
      }

      enqueueToast(
        `${state.floor}층 정산 완료 · ${netProfit >= 0 ? '+' : ''}${Math.round(netProfit).toLocaleString()}원`,
        netProfit >= 0 ? 'positive' : 'negative',
      )
    },
  }
})
