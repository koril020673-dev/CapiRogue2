import './StrategyConfirmScreen.css'
import { OrderSelect } from '../components/OrderSelect.jsx'
import { STRATEGIES } from '../constants/strategies.js'
import { useGameStore } from '../store/useGameStore.js'

function formatMoney(value) {
  const numeric = Math.round(value ?? 0)
  const prefix = numeric > 0 ? '+' : ''
  return `${prefix}${numeric.toLocaleString()}원`
}

export function StrategyConfirmScreen() {
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const lastEventResult = useGameStore((state) => state.lastEventResult)
  const getStrategyPreview = useGameStore((state) => state.getStrategyPreview)
  const confirmTurn = useGameStore((state) => state.confirmTurn)
  const returnToStrategyStage = useGameStore((state) => state.returnToStrategyStage)

  const strategy = STRATEGIES[selectedStrategyId]
  const preview = getStrategyPreview()

  if (!strategy) {
    return (
      <section className="cr2-confirm-screen cr2-game__panel">
        <div className="cr2-confirm-screen__fallback">
          <h2>먼저 전략을 선택해 주세요</h2>
          <button type="button" onClick={returnToStrategyStage}>
            전략 화면으로 돌아가기
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="cr2-confirm-screen cr2-game__panel">
      <div className="cr2-confirm-screen__head">
        <div>
          <p className="cr2-confirm-screen__eyebrow">Confirm</p>
          <h2>선택한 전략: {strategy.label}</h2>
        </div>
        {lastEventResult?.message ? (
          <span className="cr2-confirm-screen__event-result">{lastEventResult.message}</span>
        ) : null}
      </div>

      <OrderSelect />

      <section className="cr2-confirm-screen__preview">
        <h3>예상 결과</h3>
        {preview ? (
          <div className="cr2-confirm-screen__preview-grid">
            <div>
              <span>예상 판매</span>
              <strong>약 {Math.round(preview.predictedSales ?? 0).toLocaleString()}개</strong>
            </div>
            <div>
              <span>예상 순이익</span>
              <strong data-negative={(preview.predictedProfit ?? 0) < 0}>
                {formatMoney(preview.predictedProfit)}
              </strong>
            </div>
          </div>
        ) : (
          <div className="cr2-confirm-screen__preview-empty">
            전략 미리보기 Credit을 사용하지 않아 예측값이 잠겨 있습니다.
          </div>
        )}
      </section>

      <section className="cr2-confirm-screen__question">
        <h3>다음으로 넘어갈까요?</h3>
        <div className="cr2-confirm-screen__actions">
          <button
            type="button"
            className="cr2-confirm-screen__action cr2-confirm-screen__action--primary"
            disabled={!selectedOrderTier}
            onClick={confirmTurn}
          >
            Y - 정산 시작
          </button>
          <button
            type="button"
            className="cr2-confirm-screen__action"
            onClick={returnToStrategyStage}
          >
            N - 다시 선택
          </button>
        </div>
      </section>
    </section>
  )
}
