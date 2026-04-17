import './OrderSelect.css'
import { useGameStore } from '../store/useGameStore.js'

export function OrderSelect() {
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const getOrderOptions = useGameStore((state) => state.getOrderOptions)
  const selectOrderTier = useGameStore((state) => state.selectOrderTier)

  if (!selectedStrategyId) {
    return null
  }

  const options = getOrderOptions(selectedStrategyId)
  if (!options.length) {
    return null
  }

  return (
    <section className="cr2-order-select">
      <div className="cr2-order-select__head">
        <p className="cr2-order-select__eyebrow">Choice 2</p>
        <h2>이번 달 발주량</h2>
      </div>

      <div className="cr2-order-select__grid">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className="cr2-order-select__card"
            data-selected={selectedOrderTier === option.id}
            onClick={() => selectOrderTier(option.id)}
          >
            <strong>{option.label}</strong>
            <span>{option.orderQty.toLocaleString()}개</span>
            <small>선결제 {Math.round(option.prepayment).toLocaleString()}원</small>
          </button>
        ))}
      </div>
    </section>
  )
}
