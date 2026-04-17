import './StrategySelect.css'
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
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const factoryBuilt = useGameStore((state) => state.factory.built)
  const selectStrategy = useGameStore((state) => state.selectStrategy)

  return (
    <section className="cr2-strategy">
      <div className="cr2-strategy__head">
        <p className="cr2-strategy__eyebrow">Choice 1</p>
        <h2>이번 달 전략</h2>
      </div>
      <div className="cr2-strategy__grid">
        {STRATEGY_ORDER.map((strategyId) => {
          const strategy = STRATEGIES[strategyId]
          const preview = getPreview(strategyId, qualityScore, factoryBuilt)
          return (
            <button
              key={strategyId}
              type="button"
              className="cr2-strategy__card"
              data-selected={selectedStrategyId === strategyId}
              onClick={() => selectStrategy(strategyId)}
            >
              <strong>{strategy.label}</strong>
              <span>{strategy.desc}</span>
              <small>
                예상 판매가 {preview.sellPrice.toLocaleString()}원 · 품질 {Math.round(preview.quality)}
              </small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
