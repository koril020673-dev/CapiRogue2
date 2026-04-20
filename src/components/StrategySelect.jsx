import './StrategySelect.css'
import { ADVISORS } from '../constants/advisors.js'
import { STRATEGIES, STRATEGY_ORDER } from '../constants/strategies.js'
import { useGameStore } from '../store/useGameStore.js'

function getStrategySummary(strategyId) {
  const strategy = STRATEGIES[strategyId]
  if (!strategy) {
    return ''
  }

  switch (strategyId) {
    case 'quality':
      return '품질 상승, 브랜드 일부 하락, 발주 상한 20% 감소'
    case 'branding':
      return '브랜드 상승, 비용 증가, 판매 기준선 완만 상승'
    case 'dumping':
      return '가격 25% 인하, 가성비 수요 강화, 브랜드·품질 하락'
    case 'safe':
      return '추가 비용 없이 현상 유지, 체력 손실 조건 완화'
    default:
      return strategy.desc
  }
}

function getAccent(strategyId) {
  switch (strategyId) {
    case 'quality':
      return 'var(--cr2-purple)'
    case 'branding':
      return 'var(--cr2-accent)'
    case 'dumping':
      return 'var(--cr2-positive)'
    case 'safe':
      return 'var(--cr2-neutral)'
    default:
      return 'var(--cr2-accent)'
  }
}

export function StrategySelect() {
  const advisor = useGameStore((state) => state.advisor)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectStrategy = useGameStore((state) => state.selectStrategy)

  return (
    <section className="cr2-strategy-select">
      <div className="cr2-strategy-select__head">
        <p className="cr2-strategy-select__eyebrow">Choice 1</p>
        <h2>이번 달 전략을 선택하세요</h2>
      </div>

      <div className="cr2-strategy-select__grid">
        {STRATEGY_ORDER.map((strategyId, index) => {
          const strategy = STRATEGIES[strategyId]
          const selected = selectedStrategyId === strategyId

          return (
            <button
              key={strategy.id}
              type="button"
              className="cr2-strategy-select__card"
              data-selected={selected}
              onClick={() => selectStrategy(strategy.id)}
              style={{
                '--cr2-strategy-accent': getAccent(strategyId),
                borderColor: selected
                  ? ADVISORS[advisor]?.themeColor ?? 'var(--cr2-accent)'
                  : undefined,
              }}
            >
              <div className="cr2-strategy-select__title-row">
                <span className="cr2-strategy-select__slot">{String.fromCharCode(65 + index)}</span>
                <strong>
                  {strategy.icon} {strategy.label}
                </strong>
              </div>
              <p>{strategy.desc}</p>
              <small>{getStrategySummary(strategyId)}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
