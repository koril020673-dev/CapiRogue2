import './SettlementModal.css'
import { ECO_DISPLAY } from '../constants/economy.js'
import { useGameStore } from '../store/useGameStore.js'

function fmt(value) {
  return Math.round(value ?? 0).toLocaleString()
}

export function SettlementModal() {
  const open = useGameStore((state) => state.settlementModalOpen)
  const settlement = useGameStore((state) => state.lastSettlement)
  const closeSettlementModal = useGameStore((state) => state.closeSettlementModal)

  if (!open || !settlement) {
    return null
  }

  return (
    <div className="cr2-settlement-overlay">
      <div className="cr2-settlement-modal">
        <div className="cr2-settlement-modal__head">
          <div>
            <p className="cr2-settlement-modal__eyebrow">Settlement</p>
            <h2>Floor {settlement.floor} 완료</h2>
          </div>
          <span className="cr2-settlement-modal__badge">{settlement.floor}층</span>
        </div>

        <div className="cr2-settlement-modal__grid">
          <article>
            <span>매출</span>
            <strong>{fmt(settlement.revenue)}원</strong>
          </article>
          <article>
            <span>원가</span>
            <strong>{fmt(settlement.prepayment)}원</strong>
          </article>
          <article>
            <span>고정비</span>
            <strong>{fmt(settlement.fixedTotal + settlement.advisorFee)}원</strong>
          </article>
        </div>

        <div className="cr2-settlement-modal__profit" data-negative={settlement.netProfit < 0}>
          {settlement.netProfit >= 0 ? '+' : ''}
          {fmt(settlement.netProfit)}원
        </div>

        <div className="cr2-settlement-modal__details">
          <span>
            판매 {settlement.actualSold}개 / 발주 {settlement.orderQty}개 / 수요 {settlement.demand}개
          </span>
          {settlement.waste > 0 && (
            <span className="cr2-settlement-modal__waste">
              ⚠ 폐기 {settlement.waste}개 (-{fmt(settlement.wasteCost)}원)
            </span>
          )}
          <span>점유율 {(settlement.myShare * 100).toFixed(1)}%</span>
          <span>
            경기 {ECO_DISPLAY[settlement.econFrom].label} → {ECO_DISPLAY[settlement.econTo].label}
          </span>
          <span>
            체력 {settlement.healthBefore} → {settlement.healthAfter}
          </span>
          <span>
            모멘텀 {settlement.momentumHistory.map((item) => (item === 'up' ? '↑' : '↓')).join('')}
            {' '}
            {settlement.momentum >= 0 ? `+${settlement.momentum}` : settlement.momentum}
          </span>
          {settlement.educationHint && <span>💡 {settlement.educationHint}</span>}
        </div>

        <button type="button" className="cr2-settlement-modal__next" onClick={closeSettlementModal}>
          확인
        </button>
      </div>
    </div>
  )
}
