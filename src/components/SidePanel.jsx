import { useEffect, useMemo, useRef, useState } from 'react'
import './SidePanel.css'
import { ECO_WEIGHTS } from '../constants/economy.js'
import { RIVALS, RIVAL_ORDER } from '../constants/rivals.js'
import { STRATEGIES, VENDOR, VENDOR_MODE_MUL } from '../constants/strategies.js'
import { getMomentumEffect } from '../logic/momentumEngine.js'
import { RivalPanel } from './RivalPanel.jsx'
import { WarningAlerts } from './WarningAlerts.jsx'
import { useGameStore } from '../store/useGameStore.js'

const STRATEGY_LABELS = {
  volume: '물량 공세',
  quality: '품질 차별화',
  marketing: '마케팅 집중',
  safe: '안전 경영',
}

const RIVAL_LABELS = {
  megaflex: '메가플렉스',
  aura: '아우라',
  memecatch: '밈캐치',
  nexuscore: '넥서스코어',
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

function formatMoney(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function useAnimatedNumber(value, duration = 650) {
  const [display, setDisplay] = useState(value)
  const currentRef = useRef(value)
  const frameRef = useRef(0)

  useEffect(() => {
    cancelAnimationFrame(frameRef.current)

    const startValue = currentRef.current
    const diff = value - startValue
    if (!diff) {
      setDisplay(value)
      currentRef.current = value
      return undefined
    }

    const start = performance.now()
    const easeOutCubic = (progress) => 1 - (1 - progress) ** 3

    const tick = (time) => {
      const progress = Math.min((time - start) / duration, 1)
      const nextValue = startValue + diff * easeOutCubic(progress)
      currentRef.current = nextValue
      setDisplay(nextValue)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [duration, value])

  return display
}

function AnimatedMetric({ value, formatter, className = '' }) {
  const animated = useAnimatedNumber(value)
  const previousRef = useRef(value)
  const trend = value > previousRef.current ? 'up' : value < previousRef.current ? 'down' : 'flat'

  useEffect(() => {
    previousRef.current = value
  }, [value])

  return (
    <span className={className} data-trend={trend}>
      {formatter(animated)}
    </span>
  )
}

function getEffectValue(activeEffects, type) {
  return (activeEffects ?? [])
    .filter((effect) => effect.type === type)
    .reduce((sum, effect) => sum + Number(effect.value ?? 0), 0)
}

function inferRivalMove(rivalId, rival, projectedSellPrice) {
  if (!rival?.active || rival.eliminated || rival.bankrupt) {
    return '퇴장 대기'
  }

  const priceGap = (rival.currentPrice ?? 0) - (projectedSellPrice ?? rival.currentPrice ?? 0)
  if (rivalId === 'megaflex') {
    return priceGap < -4000 ? '덤핑 압박' : '저가 공세'
  }
  if (rivalId === 'aura') {
    return priceGap > 8000 ? '프리미엄 유지' : '브랜드 방어'
  }
  if (rivalId === 'memecatch') {
    return rival.marketShare >= 15 ? '바이럴 확장' : '변칙 탐색'
  }
  return '기술 우위 유지'
}

function getProjectedPlan({
  selectedStrategyId,
  selectedOrderTier,
  getOrderOptions,
  factoryBuilt,
}) {
  if (!selectedStrategyId || !STRATEGIES[selectedStrategyId]) {
    return null
  }

  const strategy = STRATEGIES[selectedStrategyId]
  const vendorMode = VENDOR_MODE_MUL[strategy.vendorMode]
  const qualityMul =
    strategy.qualityMode === 'budget'
      ? 0.8
      : strategy.qualityMode === 'premium'
        ? 1.5
        : 1
  const factoryDiscount = factoryBuilt ? 0.6 : 1
  const vendorUnitCost = Math.round(VENDOR.baseUnitCost * vendorMode.costMul)
  const sellPrice = Math.round(vendorUnitCost * strategy.priceMul)
  const realUnitCost = Math.round(vendorUnitCost * qualityMul * factoryDiscount)
  const selectedOrder = selectedOrderTier
    ? getOrderOptions(selectedStrategyId).find((option) => option.id === selectedOrderTier)
    : null

  return {
    strategyLabel: STRATEGY_LABELS[selectedStrategyId],
    sellPrice,
    realUnitCost,
    prepayment: selectedOrder?.prepayment ?? 0,
    orderQty: selectedOrder?.orderQty ?? 0,
  }
}

function AnalystIntel() {
  const econPhase = useGameStore((state) => state.econPhase)
  const itemCategory = useGameStore((state) => state.itemCategory)
  const momentum = useGameStore((state) => state.momentum)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const activeEffects = useGameStore((state) => state.activeEffects)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const getOrderOptions = useGameStore((state) => state.getOrderOptions)
  const factoryBuilt = useGameStore((state) => state.factory.built)
  const rivals = useGameStore((state) => state.rivals)

  const plan = useMemo(
    () =>
      getProjectedPlan({
        selectedStrategyId,
        selectedOrderTier,
        getOrderOptions,
        factoryBuilt,
      }),
    [factoryBuilt, getOrderOptions, selectedOrderTier, selectedStrategyId],
  )

  const demandEstimate = useMemo(() => {
    const ecoWeight = ECO_WEIGHTS[itemCategory]?.[econPhase] ?? 1
    const momentumMul = 1 + (getMomentumEffect(momentum)?.demandMul ?? 0)
    const blackSwanMul = activeBlackSwan?.demandMul ?? 1
    const demandMul = 1 + getEffectValue(activeEffects, 'demandMul')
    return Math.round(1000 * ecoWeight * momentumMul * blackSwanMul * demandMul)
  }, [activeBlackSwan, activeEffects, econPhase, itemCategory, momentum])

  const activeRivals = useMemo(
    () =>
      RIVAL_ORDER.filter((rivalId) => rivals?.[rivalId]?.active && !rivals?.[rivalId]?.eliminated).map(
        (rivalId) => {
          const rival = rivals[rivalId]
          const definition = RIVALS[rivalId]
          return {
            id: rivalId,
            name: RIVAL_LABELS[rivalId],
            price: rival.currentPrice,
            marketShare: rival.marketShare,
            capitalRatio: (rival.capital / Math.max(rival.initialCapital, 1)) * 100,
            move: inferRivalMove(rivalId, rival, plan?.sellPrice),
            brandPower: definition.brandPower,
            qualityPower: definition.qualityPower,
          }
        },
      ),
    [plan?.sellPrice, rivals],
  )

  return (
    <section className="cr2-side-panel__intel">
      <div className="cr2-side-panel__head">
        <p className="cr2-side-panel__eyebrow">ANALYST VIEW</p>
        <h3>분석관 브리핑</h3>
      </div>

      <div className="cr2-side-panel__intel-summary">
        <div>
          <span>예상 총수요</span>
          <strong>{demandEstimate.toLocaleString()}개</strong>
        </div>
        <div>
          <span>예상 판매가</span>
          <strong>{plan ? formatMoney(plan.sellPrice) : '전략 선택 전'}</strong>
        </div>
        <div>
          <span>예상 선결제</span>
          <strong>{plan && plan.prepayment ? formatMoney(plan.prepayment) : '발주 선택 전'}</strong>
        </div>
      </div>

      <div className="cr2-side-panel__intel-list">
        {activeRivals.map((rival) => (
          <article key={rival.id} className="cr2-side-panel__intel-card">
            <div className="cr2-side-panel__intel-top">
              <strong>{rival.name}</strong>
              <span>{rival.move}</span>
            </div>
            <div className="cr2-side-panel__intel-grid">
              <span>판매가 {formatMoney(rival.price)}</span>
              <span>점유율 {formatPercent(rival.marketShare)}</span>
              <span>브랜드 {rival.brandPower}pt</span>
              <span>품질 {rival.qualityPower}pt</span>
              <span>자본 여력 {rival.capitalRatio.toFixed(1)}%</span>
              <span>
                가격 차이{' '}
                {plan ? `${Math.round(rival.price - plan.sellPrice).toLocaleString()}원` : '계산 대기'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SidePanel() {
  const advisor = useGameStore((state) => state.advisor)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const priceResistance = useGameStore((state) => state.priceResistance)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const companyHealth = useGameStore((state) => state.companyHealth)

  return (
    <aside className="cr2-side-panel" data-crisis={companyHealth <= 3}>
      <section className="cr2-side-panel__company">
        <div className="cr2-side-panel__head">
          <p className="cr2-side-panel__eyebrow">TACTICAL READOUT</p>
          <h2>내 회사 현황</h2>
        </div>

        <dl className="cr2-side-panel__stats">
          <div>
            <dt>현금</dt>
            <dd>
              <AnimatedMetric value={capital} formatter={formatMoney} className="cr2-side-panel__money" />
            </dd>
          </div>
          <div>
            <dt>부채</dt>
            <dd>
              <AnimatedMetric value={debt} formatter={formatMoney} className="cr2-side-panel__money" />
            </dd>
          </div>
          <div>
            <dt>순자산</dt>
            <dd>
              <AnimatedMetric
                value={capital - debt}
                formatter={formatMoney}
                className="cr2-side-panel__money"
              />
            </dd>
          </div>
          <div>
            <dt>브랜드</dt>
            <dd>{Math.round(brandValue)}pt</dd>
          </div>
          <div>
            <dt>품질</dt>
            <dd>{Math.round(qualityScore)}pt</dd>
          </div>
          <div>
            <dt>저항성</dt>
            <dd>{formatPercent(priceResistance * 100)}</dd>
          </div>
          <div>
            <dt>점유율</dt>
            <dd>{((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%</dd>
          </div>
        </dl>
      </section>

      {advisor === 'analyst' && <AnalystIntel />}

      <RivalPanel />
      <WarningAlerts />
    </aside>
  )
}
