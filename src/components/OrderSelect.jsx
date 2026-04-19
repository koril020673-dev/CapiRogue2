import './OrderSelect.css'
import { useGameStore } from '../store/useGameStore.js'

const ORDER_COPY = {
  conservative: {
    label: '보수적',
    desc: '재고 리스크를 낮춥니다.',
  },
  standard: {
    label: '기본',
    desc: '평균적인 발주 강도입니다.',
  },
  aggressive: {
    label: '공격적',
    desc: '점유율을 위해 크게 베팅합니다.',
  },
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
        <p className="cr2-order-select__eyebrow">2. 발주 강도</p>
        <h2>발주량과 선결제 규모를 정하세요</h2>
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
              <small>선결제 {Math.round(option.prepayment).toLocaleString()}원</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
