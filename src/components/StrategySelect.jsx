import './StrategySelect.css'
import { ADVISORS } from '../constants/advisors.js'
import { STRATEGY_ORDER, VENDOR, VENDOR_MODE_MUL } from '../constants/strategies.js'
import { useGameStore } from '../store/useGameStore.js'

const STRATEGY_COPY = {
  volume: {
    icon: '◆',
    label: '물량 공세',
    desc: '가격을 낮춰 점유율을 밀어붙입니다.',
    accent: 'var(--cr2-accent)',
  },
  quality: {
    icon: '▲',
    label: '품질 차별화',
    desc: '프리미엄 포지션으로 마진을 노립니다.',
    accent: 'var(--cr2-positive)',
  },
  marketing: {
    icon: '●',
    label: '마케팅 집중',
    desc: '인지도와 관심을 끌어 수요를 흔듭니다.',
    accent: 'var(--cr2-warning)',
  },
  safe: {
    icon: '■',
    label: '안전 경영',
    desc: '현금을 지키며 안정적으로 버팁니다.',
    accent: 'var(--cr2-neutral)',
  },
}

function getPreview(strategyId, qualityScore, factoryBuilt) {
  const strategy = {
    volume: { priceMul: 1.3, qualityMode: 'budget', vendorMode: 'bulk' },
    quality: { priceMul: 2, qualityMode: 'premium', vendorMode: 'quality' },
    marketing: { priceMul: 1.5, qualityMode: 'standard', vendorMode: 'standard' },
    safe: { priceMul: 1.4, qualityMode: 'standard', vendorMode: 'standard' },
  }[strategyId]

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
        <p className="cr2-strategy-select__eyebrow">1. 전략 명령</p>
        <h2>이번 달 작전을 선택하세요</h2>
      </div>

      <div className="cr2-strategy-select__grid">
        {STRATEGY_ORDER.map((strategyId, index) => {
          const preview = getPreview(strategyId, qualityScore, factoryBuilt)
          const copy = STRATEGY_COPY[strategyId]

          return (
            <button
              key={strategyId}
              type="button"
              className="cr2-strategy-select__card"
              data-selected={selectedStrategyId === strategyId}
              onClick={() => selectStrategy(strategyId)}
              style={{
                '--cr2-strategy-accent': copy.accent,
                borderColor:
                  selectedStrategyId === strategyId
                    ? ADVISORS[advisor]?.themeColor ?? 'var(--cr2-accent)'
                    : undefined,
              }}
            >
              <div className="cr2-strategy-select__title-row">
                <span className="cr2-strategy-select__slot">{String.fromCharCode(65 + index)}</span>
                <strong>
                  {copy.icon} {copy.label}
                </strong>
              </div>
              <p>{copy.desc}</p>
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
