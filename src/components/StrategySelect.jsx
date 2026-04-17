import './StrategySelect.css'
import { ADVISORS } from '../constants/advisors.js'
import { STRATEGIES, STRATEGY_ORDER, VENDOR, VENDOR_MODE_MUL } from '../constants/strategies.js'
import { useGameStore } from '../store/useGameStore.js'

function getPreview(strategyId, qualityScore, factoryBuilt) {
  const strategy = STRATEGIES[strategyId]
  const vendorMode = VENDOR_MODE_MUL[strategy.vendorMode]
  const baseCost = VENDOR.baseUnitCost * vendorMode.costMul
  const sellPrice = Math.round(baseCost * strategy.priceMul)
  const quality =
    VENDOR.baseQuality +
    qualityScore +
    vendorMode.qualityBonus +
    (strategy.qualityMode === 'premium' ? 20 : 0) +
    (factoryBuilt ? 8 : 0)

  return {
    sellPrice,
    quality,
  }
}

export function StrategySelect() {
  const advisor = useGameStore((state) => state.advisor)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const factoryBuilt = useGameStore((state) => state.factory.built)
  const selectStrategy = useGameStore((state) => state.selectStrategy)

  return (
    <section className="cr2-strategy-select">
      <div className="cr2-strategy-select__head">
        <p className="cr2-strategy-select__eyebrow">Choice 1</p>
        <h2>이번 달 전략</h2>
      </div>

      <div className="cr2-strategy-select__grid">
        {STRATEGY_ORDER.map((strategyId) => {
          const strategy = STRATEGIES[strategyId]
          const preview = getPreview(strategyId, qualityScore, factoryBuilt)
          return (
            <button
              key={strategyId}
              type="button"
              className="cr2-strategy-select__card"
              data-selected={selectedStrategyId === strategyId}
              onClick={() => selectStrategy(strategyId)}
              style={
                selectedStrategyId === strategyId
                  ? { borderColor: ADVISORS[advisor]?.themeColor ?? 'var(--cr2-accent)' }
                  : undefined
              }
            >
              <strong>
                {strategy.icon} {strategy.label}
              </strong>
              <span>{strategy.desc}</span>
              <small>
                예상 판매가 {preview.sellPrice.toLocaleString()}원 | 품질 {Math.round(preview.quality)}
              </small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
