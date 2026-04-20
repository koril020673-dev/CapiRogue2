import './MarketStatusScreen.css'
import { ECO_DISPLAY } from '../constants/economy.js'
import { CONSUMER_GROUP_ORDER, CONSUMER_GROUPS } from '../constants/consumerGroups.js'
import { RIVAL_TIERS } from '../constants/rivals.js'
import { calcDemandEstimate } from '../logic/demandEngine.js'
import { getMomentumEffect } from '../logic/momentumEngine.js'
import { useGameStore } from '../store/useGameStore.js'

function formatPercent(value) {
  return `${Math.round((value ?? 0) * 100)}%`
}

function getEffectValue(activeEffects, type) {
  return (activeEffects ?? [])
    .filter((effect) => effect.type === type)
    .reduce((sum, effect) => sum + Number(effect.value ?? 0), 0)
}

export function MarketStatusScreen() {
  const floor = useGameStore((state) => state.floor)
  const econPhase = useGameStore((state) => state.econPhase)
  const itemCategory = useGameStore((state) => state.itemCategory)
  const industryTier = useGameStore((state) => state.industryTier)
  const momentum = useGameStore((state) => state.momentum)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const activeEffects = useGameStore((state) => state.activeEffects)
  const consumerGroupRatios = useGameStore((state) => state.consumerGroupRatios)
  const rivals = useGameStore((state) => state.rivals)
  const goToCompanyStage = useGameStore((state) => state.goToCompanyStage)

  const demandEstimate = calcDemandEstimate({
    category: itemCategory,
    econPhase,
    industryTier,
    momentumMul: 1 + getMomentumEffect(momentum).demandMul,
    blackSwanMul: activeBlackSwan?.demandMul ?? 1,
    eventMul: 1 + getEffectValue(activeEffects, 'demandMul'),
  })

  const activeRivals = (rivals ?? [])
    .filter((rival) => rival.active && !rival.bankrupt && !rival.eliminated)
    .sort((left, right) => left.joinFloor - right.joinFloor || left.tier - right.tier)

  return (
    <section className="cr2-market-screen cr2-game__panel">
      <div className="cr2-market-screen__head">
        <div>
          <p className="cr2-market-screen__eyebrow">Market Status</p>
          <h2>
            Floor {floor} | 경기: {ECO_DISPLAY[econPhase]?.label ?? econPhase}
          </h2>
        </div>
        <span
          className="cr2-market-screen__phase-badge"
          style={{ color: ECO_DISPLAY[econPhase]?.color }}
        >
          {ECO_DISPLAY[econPhase]?.icon} {ECO_DISPLAY[econPhase]?.label}
        </span>
      </div>

      <section className="cr2-market-screen__section">
        <h3>시장 현황</h3>
        <div className="cr2-market-screen__summary">
          <span>총 수요 예측: 약 {demandEstimate.toLocaleString()}개</span>
          <div className="cr2-market-screen__ratio-row">
            {CONSUMER_GROUP_ORDER.map((groupId) => (
              <span key={groupId}>
                {CONSUMER_GROUPS[groupId].label} {formatPercent(consumerGroupRatios[groupId])}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="cr2-market-screen__section">
        <h3>라이벌 현황</h3>
        <div className="cr2-market-screen__table">
          <div className="cr2-market-screen__row cr2-market-screen__row--head">
            <span>이름</span>
            <span>등급</span>
            <span>전략</span>
            <span>점유율</span>
          </div>
          {activeRivals.map((rival) => (
            <div key={rival.id} className="cr2-market-screen__row">
              <span>{rival.name}</span>
              <span>{RIVAL_TIERS[rival.tier]?.name ?? `${rival.tier}단계`}</span>
              <span>{rival.strategyLabel}</span>
              <span>{Number(rival.marketShare ?? 0).toFixed(1)}%</span>
            </div>
          ))}
          {activeRivals.length === 0 ? (
            <div className="cr2-market-screen__empty">현재 표시할 라이벌이 없습니다.</div>
          ) : null}
        </div>
      </section>

      <div className="cr2-market-screen__footer">
        <button type="button" className="cr2-market-screen__next" onClick={goToCompanyStage}>
          내 상황 확인 →
        </button>
      </div>
    </section>
  )
}
