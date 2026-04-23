import { useEffect, useMemo, useState } from 'react'
import './TurnPlanningScreen.css'
import { ORDER_TIERS, STRATEGIES } from '../constants/strategies.js'
import { CONSUMER_GROUP_ORDER, CONSUMER_GROUPS } from '../constants/consumerGroups.js'
import { ECO_DISPLAY } from '../constants/economy.js'
import { RIVAL_TIERS } from '../constants/rivals.js'
import { getMomentumEffect } from '../logic/momentumEngine.js'
import { MAX_ORDER_MUL } from '../logic/settlementEngine.js'
import { calcDemandEstimate } from '../logic/demandEngine.js'
import { OrderSelect } from '../components/OrderSelect.jsx'
import { StrategySelect } from '../components/StrategySelect.jsx'
import { useGameStore } from '../store/useGameStore.js'

const CHOICE_TYPE_LABEL = {
  safe: '안전',
  normal: '일반',
  gamble: '도박',
  absurd: '?!',
}

function formatMoney(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function getEffectValue(activeEffects, type) {
  return (activeEffects ?? [])
    .filter((effect) => effect.type === type)
    .reduce((sum, effect) => sum + Number(effect.value ?? 0), 0)
}

function formatAutoEffect(effect) {
  if (!effect) return '영향 없음'
  const parts = []
  if (effect.costMul > 1) parts.push(`원가 +${Math.round((effect.costMul - 1) * 100)}%`)
  if (effect.costMul < 1) parts.push(`원가 -${Math.round((1 - effect.costMul) * 100)}%`)
  if (effect.demandMul > 1) parts.push(`수요 +${Math.round((effect.demandMul - 1) * 100)}%`)
  if (effect.demandMul < 1) parts.push(`수요 -${Math.round((1 - effect.demandMul) * 100)}%`)
  if (effect.interestRateAdd > 0) parts.push(`금리 +${effect.interestRateAdd * 100}%p`)
  if (effect.interestRateAdd < 0) parts.push(`금리 ${effect.interestRateAdd * 100}%p`)
  return `${parts.join(' / ')}${effect.duration ? ` (${effect.duration}턴)` : ''}`
}

export function TurnPlanningScreen() {
  const floor = useGameStore((state) => state.floor)
  const econPhase = useGameStore((state) => state.econPhase)
  const itemCategory = useGameStore((state) => state.itemCategory)
  const industryTier = useGameStore((state) => state.industryTier)
  const momentum = useGameStore((state) => state.momentum)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const activeEffects = useGameStore((state) => state.activeEffects)
  const eventDemandMul = useGameStore((state) => state._eventDemandMul ?? 1)
  const consumerGroupRatios = useGameStore((state) => state.consumerGroupRatios)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const priceResistance = useGameStore((state) => state.priceResistance)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const lastGroupShares = useGameStore((state) => state.lastGroupShares)
  const warningAlerts = useGameStore((state) => state.warningAlerts)
  const rivals = useGameStore((state) => state.rivals)
  const currentSituationEvent = useGameStore((state) => state.currentSituationEvent)
  const currentPlayerEvent = useGameStore((state) => state.currentPlayerEvent)
  const currentEventResolved = useGameStore((state) => state.currentEventResolved)
  const lastEventResult = useGameStore((state) => state.lastEventResult)
  const eventsGeneratedFloor = useGameStore((state) => state._eventsGeneratedFloor)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const customOrderQty = useGameStore((state) => state.customOrderQty)
  const generateFloorEvents = useGameStore((state) => state.generateFloorEvents)
  const resolvePlayerEvent = useGameStore((state) => state.resolvePlayerEvent)
  const getOrderOptions = useGameStore((state) => state.getOrderOptions)
  const getOrderLimit = useGameStore((state) => state.getOrderLimit)
  const setCustomOrderQty = useGameStore((state) => state.setCustomOrderQty)
  const confirmTurn = useGameStore((state) => state.confirmTurn)

  const [orderWarning, setOrderWarning] = useState('')

  useEffect(() => {
    if (eventsGeneratedFloor !== floor) {
      generateFloorEvents()
    }
  }, [eventsGeneratedFloor, floor, generateFloorEvents])

  const demandEstimate = calcDemandEstimate({
    category: itemCategory,
    econPhase,
    industryTier,
    momentumMul: 1 + getMomentumEffect(momentum).demandMul,
    blackSwanMul: activeBlackSwan?.demandMul ?? 1,
    eventMul: (1 + getEffectValue(activeEffects, 'demandMul')) * eventDemandMul,
  })

  const activeRivals = useMemo(
    () =>
      (Array.isArray(rivals) ? rivals : [])
        .filter((rival) => rival.active && !rival.bankrupt && !rival.eliminated)
        .sort((left, right) => left.joinFloor - right.joinFloor || left.tier - right.tier),
    [rivals],
  )

  const selectedOrder = selectedStrategyId
    ? getOrderOptions(selectedStrategyId).find((option) => option.id === selectedOrderTier)
    : null
  const maxOrder = getOrderLimit()
  const strategy = STRATEGIES[selectedStrategyId]
  const canSettle =
    currentEventResolved &&
    selectedStrategyId &&
    selectedOrderTier &&
    (selectedOrderTier !== 'custom' || customOrderQty)

  const handleCustomOrderChange = (event) => {
    const rawValue = event.target.value
    if (rawValue === '') {
      setCustomOrderQty('')
      setOrderWarning('')
      return
    }

    const nextValue = Math.max(1, Math.round(Number.parseInt(rawValue, 10) || 1))
    if (nextValue > maxOrder) {
      setCustomOrderQty(String(maxOrder))
      setOrderWarning(`최대 ${maxOrder.toLocaleString()}개까지 발주 가능합니다.`)
      return
    }

    setCustomOrderQty(String(nextValue))
    setOrderWarning('')
  }

  return (
    <section className="cr2-turn cr2-game__panel">
      <header className="cr2-turn__header">
        <div>
          <p className="cr2-turn__eyebrow">Turn Planner</p>
          <h2>
            Floor {floor} | {ECO_DISPLAY[econPhase]?.label ?? econPhase}
          </h2>
        </div>
        <span className="cr2-turn__phase" style={{ color: ECO_DISPLAY[econPhase]?.color }}>
          {ECO_DISPLAY[econPhase]?.icon} {ECO_DISPLAY[econPhase]?.label}
        </span>
      </header>

      <div className="cr2-turn__summary-grid">
        <section className="cr2-turn-card">
          <p className="cr2-turn-card__eyebrow">Market</p>
          <h3>시장 확인</h3>
          <strong className="cr2-turn-card__metric">약 {demandEstimate.toLocaleString()}개</strong>
          <div className="cr2-turn__ratio-row">
            {CONSUMER_GROUP_ORDER.map((groupId) => (
              <span key={groupId}>
                {CONSUMER_GROUPS[groupId].label}{' '}
                {Math.round((consumerGroupRatios[groupId] ?? 0) * 100)}%
              </span>
            ))}
          </div>
          <div className="cr2-turn__rival-list">
            {activeRivals.slice(0, 3).map((rival) => (
              <span key={rival.id}>
                {rival.name} · {RIVAL_TIERS[rival.tier]?.name ?? `${rival.tier}단계`} ·{' '}
                {Number(rival.marketShare ?? 0).toFixed(1)}%
              </span>
            ))}
            {!activeRivals.length ? <span>노출된 라이벌 없음</span> : null}
          </div>
        </section>

        <section className="cr2-turn-card">
          <p className="cr2-turn-card__eyebrow">Company</p>
          <h3>회사 현황</h3>
          <div className="cr2-turn__stat-grid">
            <span>현금 {formatMoney(capital)}</span>
            <span>순자산 {formatMoney(capital - debt)}</span>
            <span>브랜드 {Math.round(brandValue)}pt</span>
            <span>품질 {Math.round(qualityScore)}pt</span>
            <span>체력 {companyHealth}/{maxHealth}</span>
            <span>점유율 {formatPercent((lastSettlement?.myShare ?? 0) * 100)}</span>
          </div>
          <div className="cr2-turn__warning-row">
            {warningAlerts?.length
              ? warningAlerts.map((warning) => <span key={warning}>{warning}</span>)
              : <span>즉시 대응 경고 없음</span>}
          </div>
        </section>
      </div>

      <section className="cr2-turn-event" data-blocking={!currentEventResolved}>
        <div className="cr2-turn-event__top">
          <div>
            <p className="cr2-turn-card__eyebrow">Event</p>
            <h3>이번 달 이벤트</h3>
          </div>
          <span>{currentEventResolved ? '처리 완료' : '선택 필요'}</span>
        </div>

        <div className="cr2-turn-event__body">
          <div className="cr2-turn-event__situation">
            <strong>{currentSituationEvent?.name ?? '세계 이벤트 없음'}</strong>
            <p>{currentSituationEvent?.desc ?? '이번 달 시장 외부 충격은 없습니다.'}</p>
            <small>{formatAutoEffect(currentSituationEvent?.autoEffect)}</small>
          </div>

          <div className="cr2-turn-event__player">
            {currentPlayerEvent ? (
              <>
                <strong>{currentPlayerEvent.name}</strong>
                <p>{currentPlayerEvent.desc}</p>
                <div className="cr2-turn-event__choices">
                  {currentPlayerEvent.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      data-type={choice.type}
                      onClick={() => resolvePlayerEvent(choice.id)}
                    >
                      <span>{choice.label}</span>
                      <small>{CHOICE_TYPE_LABEL[choice.type] ?? '일반'}</small>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <strong>회사 이벤트 처리 완료</strong>
                <p>{lastEventResult?.message ?? '이번 달은 특별한 회사 사건이 없습니다.'}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="cr2-turn__strategy-wrap" data-disabled={!currentEventResolved}>
        <StrategySelect />
        {!currentEventResolved ? (
          <div className="cr2-turn__overlay-note">이벤트 선택을 먼저 완료해 주세요.</div>
        ) : null}
      </section>

      {selectedStrategyId ? (
        <section className="cr2-turn-order">
          <div className="cr2-turn-order__head">
            <div>
              <p className="cr2-turn-card__eyebrow">Order</p>
              <h3>{strategy?.label} 발주량 선택</h3>
            </div>
            <span>최대 {maxOrder.toLocaleString()}개</span>
          </div>

          <OrderSelect />

          <div className="cr2-turn-order__custom">
            <label htmlFor="cr2-turn-custom-order">직접 입력</label>
            <input
              id="cr2-turn-custom-order"
              type="number"
              min="1"
              max={maxOrder}
              value={customOrderQty}
              onChange={handleCustomOrderChange}
              placeholder="발주량"
            />
            <span>수요 예측 x {MAX_ORDER_MUL}</span>
            {orderWarning ? <small>{orderWarning}</small> : null}
          </div>

          <div className="cr2-turn-order__footer">
            <div>
              <span>
                선택 발주:{' '}
                {selectedOrderTier === 'custom'
                  ? `${Number(customOrderQty || 0).toLocaleString()}개`
                  : selectedOrder
                    ? `${selectedOrder.orderQty.toLocaleString()}개`
                    : '대기'}
              </span>
              <span>
                예상 선결제:{' '}
                {selectedOrderTier === 'custom'
                  ? '정산 시 계산'
                  : selectedOrder
                    ? formatMoney(selectedOrder.prepayment)
                    : '대기'}
              </span>
            </div>
            <button type="button" disabled={!canSettle} onClick={confirmTurn}>
              정산 시작 →
            </button>
          </div>
        </section>
      ) : null}
    </section>
  )
}
