import './SettlementModal.css'
import { formatCurrency, formatSignedCurrency } from '../lib/formatters.js'
import { useGameStore } from '../store/useGameStore.js'

const ECONOMY_LABELS = {
  boom: '호황',
  stable: '평시',
  recession: '불황',
}

export function SettlementModal() {
  const settlementModalOpen = useGameStore((state) => state.settlementModalOpen)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const closeSettlementModal = useGameStore((state) => state.closeSettlementModal)

  if (!settlementModalOpen || !lastSettlement) {
    return null
  }

  const previousPhase = ECONOMY_LABELS[lastSettlement.previousEconPhase] ?? '평시'
  const nextPhase = ECONOMY_LABELS[lastSettlement.nextEconPhase] ?? '평시'
  const profitClass =
    lastSettlement.netProfit >= 0
      ? 'cr2-settlement-modal__profit--positive'
      : 'cr2-settlement-modal__profit--negative'

  return (
    <div
      className="cr2-settlement-modal__backdrop"
      role="presentation"
      onClick={closeSettlementModal}
    >
      <div
        className="cr2-settlement-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr2-settlement-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cr2-settlement-modal__top">
          <div>
            <h2 id="cr2-settlement-modal-title">{`Floor ${lastSettlement.floor} 완료`}</h2>
          </div>
          <button
            type="button"
            className="cr2-settlement-modal__close"
            onClick={closeSettlementModal}
            aria-label="정산 모달 닫기"
          >
            ✕
          </button>
        </div>

        <div className="cr2-settlement-modal__summary-grid">
          <article>
            <span>매출</span>
            <strong>{formatCurrency(lastSettlement.revenue)}</strong>
          </article>
          <article>
            <span>원가</span>
            <strong>{formatCurrency(lastSettlement.prepayment)}</strong>
          </article>
          <article>
            <span>고정비</span>
            <strong>{formatCurrency(lastSettlement.fixedTotal)}</strong>
          </article>
        </div>

        <div className="cr2-settlement-modal__profit-block">
          <span>이번 달 순이익</span>
          <strong className={profitClass}>{formatSignedCurrency(lastSettlement.netProfit)}</strong>
        </div>

        <div className="cr2-settlement-modal__detail-list">
          <p>
            판매: {lastSettlement.actualSold}개 / 발주: {lastSettlement.orderQty}개 / 수요:{' '}
            {lastSettlement.demand}개
          </p>
          {lastSettlement.waste > 0 ? (
            <p className="cr2-settlement-modal__warning">
              {`⚠ 폐기 ${lastSettlement.waste}개 (-${lastSettlement.wasteCost.toLocaleString()}원)`}
            </p>
          ) : null}
          <p>{`점유율: ${(lastSettlement.myShare * 100).toFixed(1)}%`}</p>
          <p>{`경기: ${previousPhase} → ${nextPhase}`}</p>
        </div>

        <button
          type="button"
          className="cr2-settlement-modal__confirm"
          onClick={closeSettlementModal}
        >
          다음 층으로
        </button>
      </div>
    </div>
  )
}
