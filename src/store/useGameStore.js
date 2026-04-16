import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import { drawWeightedEventCards, getEventCardById } from '../constants/eventCards.js'
import { RIVALS, RIVAL_ORDER, createInitialRivals } from '../constants/rivals.js'
import { VENDORS } from '../constants/vendors.js'
import { calcDemand } from '../logic/demandEngine.js'
import { advanceEconPhase } from '../logic/econEngine.js'
import { calcAttraction, calcMarketShares } from '../logic/marketEngine.js'
import { calcSettlement } from '../logic/settlementEngine.js'
import { clamp, evaluateRivalStatus, getDebtBand, roundTo } from '../lib/gameMath.js'

const PRICE_MIN = 40000
const PRICE_MAX = 180000
const ORDER_QTY_MAX = 10000
const HISTORY_LIMIT = 14
const EVENT_CURRENCY_UNIT = 1000000
const EVENT_PRICE_UNIT = 3000

const ECONOMY_LABELS = {
  boom: '호황',
  stable: '평시',
  recession: '불황',
}

const ECONOMY_SUMMARIES = {
  boom: '소비 심리가 살아 있어 가격 인상 여력이 생기는 구간입니다.',
  stable: '가격과 품질의 균형이 점유율을 좌우하는 표준 구간입니다.',
  recession: '가격 민감도가 커지고 고티어 상품 수요가 빠르게 줄어드는 구간입니다.',
}

const ECONOMY_BIAS_PHASE_MAP = {
  boom: 'boom',
  stable: 'steady',
  recession: 'slowdown',
}

const QUALITY_MODE_MULTIPLIER = {
  budget: 0.8,
  balanced: 1,
  standard: 1,
  premium: 1.5,
}

const DETERMINISTIC_ECO_WEIGHTS = {
  essential: { boom: 0.9, stable: 1, recession: 1.3 },
  normal: { boom: 1.2, stable: 1, recession: 0.8 },
  luxury: { boom: 1.8, stable: 1, recession: 0.4 },
}

const TIER_RECESSION_MUL = {
  1: 1,
  2: 0.85,
  3: 0.55,
  4: 0.1,
}

function createToast(message, tone = 'neutral') {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    message,
    tone,
  }
}

function getVendorById(vendorId) {
  return VENDORS.find((vendor) => vendor.id === vendorId) ?? null
}

function getFactoryActive(state) {
  return Boolean(state.factory?.built) && (state.factory?.buildTurnsLeft ?? 0) <= 0
}

function getBlackSwanDemandMultiplier(state) {
  return state._blackSwanDemandMul ?? (state.floor >= 80 ? 0.9 : 1)
}

function getEventDemandMultiplier(state) {
  return clamp(1 + (state.demandAdjustment ?? 0) / 100, 0.25, 2)
}

function getMonthlyInterest(state) {
  return Math.round((state.debt * state.interestRate) / 12)
}

function getMonthlyRent(state) {
  if (state.realty === 'monthly') {
    return 1000000
  }

  if (state.realty === 'jeonse') {
    return 250000
  }

  return 0
}

function getSafetyCost(state) {
  return getFactoryActive(state) && state.factory?.safetyOn ? 5000000 : 0
}

function getAdjustedVendorUnitCost(state) {
  if (!state.selectedVendor) {
    return 0
  }

  return Math.max(
    1000,
    Math.round(state.selectedVendor.unitCost + (state.costAdjustment ?? 0) * 1000),
  )
}

function calculateEffectiveQuality(state) {
  return roundTo(
    (state.selectedVendor?.qualityScore ?? 0) +
      (state.qualityScore ?? 0) +
      (state.factory?.upgradeLevel ?? 0) * 20,
    1,
  )
}

function calculateAwarenessBonus(state) {
  return roundTo(
    clamp(
      state.marketing?.awarenessBonus ?? (state.marketingSpend ?? 0) / 100,
      0,
      0.45,
    ),
    3,
  )
}

function estimateDemandPreview(state) {
  const ecoWeight =
    DETERMINISTIC_ECO_WEIGHTS[state.itemCategory]?.[state.economyPhase] ?? 1
  const recessionTierMul =
    state.economyPhase === 'recession'
      ? (TIER_RECESSION_MUL[state.industryTier] ?? 1)
      : 1

  return Math.round(
    1000 *
      ecoWeight *
      recessionTierMul *
      getBlackSwanDemandMultiplier(state) *
      getEventDemandMultiplier(state),
  )
}

function createRivalAttraction(state, rivalId, rivalState) {
  const rivalDefinition = RIVALS[rivalId]
  const resistance = clamp(0.06 + rivalDefinition.aggression * 0.05, 0, 0.35)
  const awarenessBonus = clamp((rivalState.marketShare ?? 0) / 200, 0, 0.25)

  return calcAttraction({
    quality: rivalDefinition.qualityPower,
    brand: rivalDefinition.brandPower,
    sellPrice: rivalState.currentPrice,
    resistance,
    category: state.itemCategory,
    econPhase: state.economyPhase,
    awarenessBonus,
  })
}

function deriveSharePreview(state) {
  if (!state.selectedVendor || state.price <= 0) {
    return {
      playerShare: clamp((state.marketShare ?? 0) / 100, 0, 1),
      rivalShares: Object.fromEntries(
        RIVAL_ORDER.map((rivalId) => [
          rivalId,
          clamp((state.rivals?.[rivalId]?.marketShare ?? 0) / 100, 0, 1),
        ]),
      ),
    }
  }

  const playerAttraction = calcAttraction({
    quality: calculateEffectiveQuality(state),
    brand: state.brandValue,
    sellPrice: state.price,
    resistance: state.priceResistance,
    category: state.itemCategory,
    econPhase: state.economyPhase,
    awarenessBonus: calculateAwarenessBonus(state),
  })

  const allPlayers = [{ attraction: playerAttraction }]

  RIVAL_ORDER.forEach((rivalId) => {
    const rivalState = state.rivals?.[rivalId]

    if (!rivalState || rivalState.eliminated) {
      allPlayers.push({ attraction: 0 })
      return
    }

    allPlayers.push({
      attraction: createRivalAttraction(state, rivalId, rivalState),
    })
  })

  const shares = calcMarketShares(allPlayers)

  return {
    playerShare: shares[0] ?? 0,
    rivalShares: Object.fromEntries(
      RIVAL_ORDER.map((rivalId, index) => [rivalId, shares[index + 1] ?? 0]),
    ),
  }
}

function projectRivalPrice(rivalId, state) {
  const rivalState = state.rivals[rivalId]
  const rivalDefinition = RIVALS[rivalId]

  if (!rivalState) {
    return rivalDefinition.basePrice
  }

  if (rivalId === 'megaflex') {
    return clamp(
      Math.min(state.price - 3000, rivalState.currentPrice + 1000),
      42000,
      125000,
    )
  }

  if (rivalId === 'aura') {
    return clamp(
      Math.max(state.price + 8000, rivalState.currentPrice),
      60000,
      165000,
    )
  }

  if (rivalId === 'memecatch') {
    return clamp(
      (rivalState.currentPrice + state.price) / 2 + 2500,
      50000,
      145000,
    )
  }

  return clamp(
    Math.max(state.price + 12000, rivalState.currentPrice),
    70000,
    190000,
  )
}

function normalizeRivals(state) {
  return RIVAL_ORDER.reduce((rivalState, rivalId) => {
    const rivalDefinition = RIVALS[rivalId]
    const current = state.rivals?.[rivalId] ?? {}
    const capital = Math.max(current.capital ?? rivalDefinition.initialCapital, 0)
    const eliminated = capital <= 0
    const currentPrice = Math.round(
      clamp(current.currentPrice ?? rivalDefinition.basePrice, 30000, 220000),
    )
    const marketShare = roundTo(
      clamp(eliminated ? 0 : current.marketShare ?? rivalDefinition.startingShare, 0, 75),
      1,
    )

    const nextRival = {
      ...current,
      id: rivalId,
      active: true,
      capital,
      initialCapital: rivalDefinition.initialCapital,
      currentPrice,
      marketShare,
      eliminated,
    }

    nextRival.status = evaluateRivalStatus({
      rivalState: nextRival,
      initialCapital: rivalDefinition.initialCapital,
      playerPrice: state.price,
    })

    rivalState[rivalId] = nextRival
    return rivalState
  }, {})
}

function deriveMetrics(state) {
  const sharePreview = deriveSharePreview(state)
  const expectedDemand = estimateDemandPreview(state)
  const unitCost = getAdjustedVendorUnitCost(state)
  const qualityMultiplier = QUALITY_MODE_MULTIPLIER[state.qualityMode] ?? 1
  const effectiveUnitCost = Math.round(
    unitCost * qualityMultiplier * (getFactoryActive(state) ? 0.6 : 1),
  )
  const fixedCosts =
    getMonthlyInterest(state) +
    getMonthlyRent(state) +
    getSafetyCost(state) +
    state.monthlyFixedCost
  const contributionMargin = state.price - effectiveUnitCost
  const breakEvenUnits =
    contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : null
  const demandSoldPreview = Math.round(expectedDemand * sharePreview.playerShare)
  const projectedUnits = Math.min(demandSoldPreview, state.orderQty)
  const projectedRevenue = projectedUnits * state.price
  const projectedProfit =
    projectedRevenue - effectiveUnitCost * state.orderQty - fixedCosts

  return {
    unitCost: effectiveUnitCost,
    fixedCosts,
    contributionMargin,
    breakEvenUnits,
    marketSize: expectedDemand,
    projectedUnits,
    projectedProfit,
    belowCost: state.price < effectiveUnitCost,
    debtBand: getDebtBand(state),
    debtBandLabel:
      {
        low: '낮음',
        medium: '중간',
        high: '높음',
      }[getDebtBand(state)] ?? '낮음',
    economyLabel: ECONOMY_LABELS[state.economyPhase] ?? '평시',
    economySummary: ECONOMY_SUMMARIES[state.economyPhase] ?? ECONOMY_SUMMARIES.stable,
    sharePreview: roundTo(sharePreview.playerShare * 100, 1),
    effectiveQuality: calculateEffectiveQuality(state),
  }
}

function createEventContext(state) {
  return {
    economyPhase: ECONOMY_BIAS_PHASE_MAP[state.economyPhase] ?? 'steady',
    debtBand: getDebtBand(state),
    factoryCount: state.factoryCount,
    activeRivals: RIVAL_ORDER.filter((rivalId) => !state.rivals[rivalId]?.eliminated),
    month: state.month,
  }
}

function createFreshEventState(state) {
  return {
    offeredIds: drawWeightedEventCards(createEventContext(state), 3).map((card) => card.id),
    resolved: false,
    skipped: false,
    usedCardId: null,
    usedSlotIndex: null,
    openCardId: null,
    openSlotIndex: null,
  }
}

function recalculateState(sourceState, options = {}) {
  const { preserveEvents = true } = options
  const normalized = {
    ...sourceState,
    marketing: {
      awarenessBonus: calculateAwarenessBonus(sourceState),
      totalSpent: sourceState.marketing?.totalSpent ?? 0,
    },
    rivals: normalizeRivals(sourceState),
  }

  const metrics = deriveMetrics(normalized)
  const eventState =
    preserveEvents && normalized.eventState?.offeredIds?.length
      ? normalized.eventState
      : createFreshEventState(normalized)

  return {
    ...normalized,
    metrics,
    eventState,
  }
}

function pushHistoryEntry(history, entry) {
  return [entry, ...(history ?? [])].slice(0, HISTORY_LIMIT)
}

function applyEffects(state, effects = {}) {
  const nextMarketingSpend = roundTo(
    clamp((state.marketingSpend ?? 12) + (effects.marketingDelta ?? 0), 0, 60),
    1,
  )
  const nextFactoryCount = clamp(
    (state.factoryCount ?? 0) + (effects.factoryDelta ?? 0),
    0,
    4,
  )

  const nextState = {
    ...state,
    capital: roundTo(
      state.capital + (effects.capitalDelta ?? 0) * EVENT_CURRENCY_UNIT,
      1,
    ),
    debt: roundTo(
      Math.max(state.debt + (effects.debtDelta ?? 0) * EVENT_CURRENCY_UNIT, 0),
      1,
    ),
    marketShare: roundTo(clamp(state.marketShare + (effects.marketShareDelta ?? 0), 1, 75), 1),
    brandValue: roundTo(clamp(state.brandValue + (effects.brandDelta ?? 0), 0, 160), 1),
    qualityScore: roundTo(clamp(state.qualityScore + (effects.qualityDelta ?? 0), 0, 160), 1),
    marketingSpend: nextMarketingSpend,
    factoryCount: nextFactoryCount,
    costAdjustment: roundTo(
      clamp((state.costAdjustment ?? 0) + (effects.costAdjustmentDelta ?? 0), -15, 15),
      2,
    ),
    demandAdjustment: roundTo(
      clamp((state.demandAdjustment ?? 0) + (effects.demandAdjustmentDelta ?? 0), -30, 30),
      1,
    ),
    factory: {
      ...state.factory,
      built: nextFactoryCount > 0,
      buildTurnsLeft: Math.max(
        (state.factory?.buildTurnsLeft ?? 0) - ((effects.factoryDelta ?? 0) > 0 ? 1 : 0),
        0,
      ),
      upgradeLevel: clamp(
        (state.factory?.upgradeLevel ?? 0) + (effects.rdTierDelta ?? 0),
        0,
        4,
      ),
    },
    marketing: {
      awarenessBonus: roundTo(clamp(nextMarketingSpend / 100, 0, 0.45), 3),
      totalSpent:
        (state.marketing?.totalSpent ?? 0) +
        Math.max(effects.marketingDelta ?? 0, 0) * EVENT_CURRENCY_UNIT,
    },
    rivals: {
      ...state.rivals,
    },
  }

  if (effects.rivalCapitalDelta || effects.rivalPriceDelta || effects.rivalShareDelta) {
    RIVAL_ORDER.forEach((rivalId) => {
      const current = nextState.rivals[rivalId]

      nextState.rivals[rivalId] = {
        ...current,
        capital: Math.max(
          current.capital + (effects.rivalCapitalDelta?.[rivalId] ?? 0) * EVENT_CURRENCY_UNIT,
          0,
        ),
        currentPrice: Math.round(
          clamp(
            current.currentPrice +
              (effects.rivalPriceDelta?.[rivalId] ?? 0) * EVENT_PRICE_UNIT,
            30000,
            220000,
          ),
        ),
        marketShare: roundTo(
          clamp(current.marketShare + (effects.rivalShareDelta?.[rivalId] ?? 0), 0, 70),
          1,
        ),
      }
    })
  }

  return nextState
}

function settleRivalsAfterMonth(state, demand, sharePreview) {
  return RIVAL_ORDER.reduce((rivalState, rivalId) => {
    const rivalDefinition = RIVALS[rivalId]
    const current = state.rivals[rivalId]

    if (!current || current.eliminated) {
      rivalState[rivalId] = {
        ...current,
        marketShare: 0,
        status: '퇴출',
        eliminated: true,
      }
      return rivalState
    }

    const nextPrice = projectRivalPrice(rivalId, state)
    const share = roundTo((sharePreview.rivalShares[rivalId] ?? 0) * 100, 1)
    const soldUnits = Math.round(demand * (share / 100))
    const costRatio =
      rivalId === 'megaflex' ? 0.72 : rivalId === 'nexuscore' ? 0.58 : 0.64
    const variableCost = Math.round(soldUnits * nextPrice * costRatio)
    const revenue = soldUnits * nextPrice
    const fixedDrag = Math.round(850000 + rivalDefinition.initialCapital * 0.003)
    const netProfit = revenue - variableCost - fixedDrag
    const capital = Math.max(current.capital + netProfit, 0)
    const eliminated = capital <= 0

    const nextRival = {
      ...current,
      capital,
      currentPrice: nextPrice,
      marketShare: eliminated ? 0 : share,
      eliminated,
    }

    nextRival.status = evaluateRivalStatus({
      rivalState: nextRival,
      initialCapital: rivalDefinition.initialCapital,
      playerPrice: state.price,
    })

    rivalState[rivalId] = nextRival
    return rivalState
  }, {})
}

function buildInitialState() {
  const defaultVendor = VENDORS[0] ?? null

  return recalculateState(
    {
      advisor: 'analyst',
      sidebarCollapsed: false,
      month: 1,
      floor: 1,
      economyPhase: 'stable',
      price: 76000,
      qualityMode: 'balanced',
      itemCategory: 'normal',
      industryTier: 1,
      selectedVendor: defaultVendor,
      orderQty: 420,
      capital: 50000000,
      debt: 0,
      interestRate: 0.06,
      realty: 'monthly',
      monthlyFixedCost: 500000,
      marketShare: 18.4,
      brandValue: 28,
      qualityScore: 24,
      priceResistance: 0.06,
      marketingSpend: 12,
      marketing: {
        awarenessBonus: 0.12,
        totalSpent: 0,
      },
      factoryCount: 0,
      factory: {
        built: false,
        buildTurnsLeft: 0,
        safetyOn: true,
        accidentRisk: 0,
        upgradeLevel: 0,
      },
      costAdjustment: 0,
      demandAdjustment: 0,
      rivals: createInitialRivals(),
      history: [],
      toasts: [],
      lastSettlement: null,
      lastTurnReport: null,
      settlementModalOpen: false,
      previousEconPhase: 'stable',
      profitHistory: [],
      cumulativeProfit: 0,
      eventState: {
        offeredIds: [],
        resolved: false,
        skipped: false,
        usedCardId: null,
        usedSlotIndex: null,
        openCardId: null,
        openSlotIndex: null,
      },
    },
    { preserveEvents: false },
  )
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
      toasts: [...state.toasts, toast].slice(-4),
    }))

    setTimeout(() => dismissToast(toast.id), 2000)
  }

  return {
    ...buildInitialState(),

    dismissToast,

    resetRunState: () => set(buildInitialState()),

    toggleSidebar: () =>
      set((state) => ({
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      })),

    selectAdvisor: (advisorId) =>
      set((state) => {
        if (!ADVISORS[advisorId]) {
          return state
        }

        return recalculateState({
          ...state,
          advisor: advisorId,
        })
      }),

    updatePrice: (nextValue) =>
      set((state) => {
        const parsedValue =
          typeof nextValue === 'number' ? nextValue : Number.parseFloat(nextValue)

        if (!Number.isFinite(parsedValue)) {
          return state
        }

        return recalculateState({
          ...state,
          price: Math.round(clamp(parsedValue, PRICE_MIN, PRICE_MAX)),
        })
      }),

    updateQualityMode: (qualityMode) =>
      set((state) => {
        if (!QUALITY_MODE_MULTIPLIER[qualityMode]) {
          return state
        }

        return recalculateState({
          ...state,
          qualityMode,
        })
      }),

    setSelectedVendor: (vendorId) =>
      set((state) => {
        const vendor = getVendorById(vendorId)

        if (!vendor) {
          return state
        }

        return recalculateState({
          ...state,
          selectedVendor: vendor,
        })
      }),

    updateOrderQty: (value) =>
      set((state) => {
        const parsedValue =
          typeof value === 'number' ? value : Number.parseInt(String(value), 10)

        if (!Number.isFinite(parsedValue)) {
          return recalculateState({
            ...state,
            orderQty: 0,
          })
        }

        return recalculateState({
          ...state,
          orderQty: Math.round(clamp(parsedValue, 0, ORDER_QTY_MAX)),
        })
      }),

    closeSettlementModal: () =>
      set((state) => ({
        ...state,
        settlementModalOpen: false,
      })),

    openEventCard: (cardId, slotIndex) =>
      set((state) => {
        if (state.eventState.resolved || state.eventState.skipped) {
          return state
        }

        if (!state.eventState.offeredIds.includes(cardId)) {
          return state
        }

        return {
          ...state,
          eventState: {
            ...state.eventState,
            openCardId: cardId,
            openSlotIndex: slotIndex,
          },
        }
      }),

    closeEventCard: () =>
      set((state) => ({
        ...state,
        eventState: {
          ...state.eventState,
          openCardId: null,
          openSlotIndex: null,
        },
      })),

    skipEventSelection: () => {
      const { eventState } = get()

      if (eventState.resolved || eventState.skipped) {
        return
      }

      set((state) => ({
        ...state,
        eventState: {
          ...state.eventState,
          resolved: true,
          skipped: true,
          usedCardId: null,
          usedSlotIndex: null,
          openCardId: null,
          openSlotIndex: null,
        },
      }))

      enqueueToast('문서 검토를 건너뛰고 이번 달 마감을 준비합니다.', 'warning')
    },

    resolveEventChoice: (cardId, slotIndex, choiceId) => {
      let toast = null

      set((state) => {
        if (state.eventState.resolved || state.eventState.skipped) {
          return state
        }

        if (!state.eventState.offeredIds.includes(cardId)) {
          return state
        }

        const card = getEventCardById(cardId)
        const choice = card?.choices.find((entry) => entry.id === choiceId)

        if (!card || !choice) {
          return state
        }

        const isSuccess = Math.random() <= choice.successRate
        const resultText = isSuccess ? choice.successText : choice.failureText
        const effectBundle = isSuccess ? choice.successEffects : choice.failureEffects
        const nextState = recalculateState(applyEffects(state, effectBundle))

        toast = createToast(`${card.name} · ${resultText}`, isSuccess ? 'positive' : 'negative')

        return {
          ...nextState,
          history: pushHistoryEntry(state.history, {
            type: 'event',
            month: state.month,
            cardId,
            choiceId,
            outcome: isSuccess ? 'success' : 'failure',
            message: resultText,
          }),
          toasts: [...state.toasts, toast].slice(-4),
          eventState: {
            ...nextState.eventState,
            offeredIds: state.eventState.offeredIds,
            resolved: true,
            skipped: false,
            usedCardId: cardId,
            usedSlotIndex: slotIndex,
            openCardId: null,
            openSlotIndex: null,
          },
        }
      })

      if (toast) {
        setTimeout(() => dismissToast(toast.id), 2000)
      }
    },

    advanceMonth: () => {
      const current = get()

      if (!current.eventState.resolved && !current.eventState.skipped) {
        return
      }

      if (!current.selectedVendor || current.price <= 0 || current.orderQty <= 0) {
        enqueueToast('벤더, 판매가, 발주량을 먼저 설정해야 합니다.', 'warning')
        return
      }

      let toast = null

      set((state) => {
        const sharePreview = deriveSharePreview(state)
        const myShare = sharePreview.playerShare
        const demand = calcDemand({
          category: state.itemCategory,
          econPhase: state.economyPhase,
          industryTier: state.industryTier,
          blackSwanMul: getBlackSwanDemandMultiplier(state),
          eventMul: getEventDemandMultiplier(state),
        })

        const previousFloor = state.floor
        const previousEconPhase = state.economyPhase
        const result = calcSettlement({
          sellPrice: state.price,
          orderQty: state.orderQty,
          demand,
          myShare,
          vendorUnitCost: getAdjustedVendorUnitCost(state),
          qualityMode: state.qualityMode,
          factoryActive: getFactoryActive(state),
          monthlyInterest: getMonthlyInterest(state),
          monthlyRent: getMonthlyRent(state),
          safetyCost: getSafetyCost(state),
          otherFixed: state.monthlyFixedCost,
          opCostMultiplier: 1.0,
          shutdownLeft: state._shutdownLeft ?? 0,
        })

        const playerSharePct = roundTo(myShare * 100, 1)
        const nextPhase = advanceEconPhase(previousEconPhase, state._metaBoomBonus ?? 0)
        const nextCapital = state.capital - result.prepayment + result.revenue - result.fixedTotal
        const nextProfitHistory = [...state.profitHistory, result.netProfit].slice(-12)
        const nextBrandValue = roundTo(
          clamp(
            state.brandValue +
              (result.netProfit >= 0 ? 1.2 : -0.9) +
              (result.waste === 0 ? 0.6 : -0.7),
            0,
            160,
          ),
          1,
        )
        const nextQualityScore = roundTo(
          clamp(
            state.qualityScore +
              (state.qualityMode === 'premium' ? 0.8 : state.qualityMode === 'budget' ? -0.3 : 0.3) +
              (result.waste > 0 ? -0.1 : 0.4),
            0,
            160,
          ),
          1,
        )
        const nextRivals = settleRivalsAfterMonth(state, demand, sharePreview)

        const baseNextState = {
          ...state,
          floor: previousFloor + 1,
          month: state.month + 1,
          economyPhase: nextPhase,
          previousEconPhase,
          capital: nextCapital,
          marketShare: playerSharePct,
          brandValue: nextBrandValue,
          qualityScore: nextQualityScore,
          orderQty: 0,
          profitHistory: nextProfitHistory,
          cumulativeProfit: state.cumulativeProfit + result.netProfit,
          rivals: nextRivals,
          settlementModalOpen: true,
          lastSettlement: {
            ...result,
            demand,
            myShare,
            orderQty: state.orderQty,
            floor: previousFloor,
            previousEconPhase,
            nextEconPhase: nextPhase,
          },
          lastTurnReport: {
            month: state.month,
            revenue: result.revenue,
            operatingProfit: result.netProfit,
            unitsSold: result.actualSold,
            shareChange: roundTo(playerSharePct - state.marketShare, 1),
          },
          history: pushHistoryEntry(state.history, {
            type: 'month',
            month: state.month,
            revenue: result.revenue,
            operatingProfit: result.netProfit,
            unitsSold: result.actualSold,
            shareChange: roundTo(playerSharePct - state.marketShare, 1),
          }),
        }

        const nextEventState = createFreshEventState(baseNextState)
        const nextState = recalculateState(
          {
            ...baseNextState,
            eventState: nextEventState,
          },
          { preserveEvents: true },
        )

        toast = createToast(
          `${previousFloor}층 정산 완료 · 순이익 ${
            result.netProfit >= 0 ? '+' : ''
          }${result.netProfit.toLocaleString()}원`,
          result.netProfit >= 0 ? 'positive' : 'negative',
        )

        return {
          ...nextState,
          toasts: [...state.toasts, toast].slice(-4),
        }
      })

      if (toast) {
        setTimeout(() => dismissToast(toast.id), 2000)
      }
    },
  }
})
