import './OrderSelect.css'
import { useGameStore } from '../store/useGameStore.js'

const ORDER_COPY = {
  conservative: {
    label: '보수적',
    desc: '재고 위험을 낮추는 안전한 발주입니다.',
  },
  standard: {
    label: '기본',
    desc: '예상 수요의 중심값에 맞춘 표준 발주입니다.',
  },
  aggressive: {
    label: '공격적',
    desc: '남는 수요까지 노리는 확장형 발주입니다.',
  },
}

function formatMoney(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

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
        <h2>발주량을 확정하세요</h2>
      </div>

      <div className="cr2-order-select__grid">
        {options.map((option) => {
          const copy = ORDER_COPY[option.id]

          return (
            <button
              key={option.id}
              type="button"
              className="cr2-order-select__card"
              data-selected={selectedOrderTier === option.id}
              onClick={() => selectOrderTier(option.id)}
            >
              <span className="cr2-order-select__tier">{copy.label}</span>
              <strong>{option.orderQty.toLocaleString()}개 발주</strong>
              <p>{copy.desc}</p>
              <small>선결제 {formatMoney(option.prepayment)}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
