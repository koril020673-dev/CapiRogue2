import './PriceComposer.css'
import { VENDORS } from '../constants/vendors.js'
import { QUALITY_MODE_ORDER, QUALITY_MODES } from '../lib/gameMath.js'
import { formatCurrency, formatSignedCurrency } from '../lib/formatters.js'
import { useGameStore } from '../store/useGameStore.js'

export function PriceComposer() {
  const advisor = useGameStore((state) => state.advisor)
  const price = useGameStore((state) => state.price)
  const qualityMode = useGameStore((state) => state.qualityMode)
  const selectedVendor = useGameStore((state) => state.selectedVendor)
  const orderQty = useGameStore((state) => state.orderQty)
  const metrics = useGameStore((state) => state.metrics)
  const updatePrice = useGameStore((state) => state.updatePrice)
  const updateQualityMode = useGameStore((state) => state.updateQualityMode)
  const setSelectedVendor = useGameStore((state) => state.setSelectedVendor)
  const updateOrderQty = useGameStore((state) => state.updateOrderQty)

  return (
    <section className="cr2-price-composer">
      <div className="cr2-price-composer__header">
        <div>
          <p className="cr2-price-composer__eyebrow">가격 설계</p>
          <h2>벤더 선택, 발주량, 가격을 한 묶음으로 정산합니다.</h2>
          <p className="cr2-price-composer__copy">
            BEP는 가격과 품질 모드가 바뀔 때마다 즉시 다시 계산됩니다.
            {advisor === 'analyst'
              ? ' 정보 담당관은 원가선 아래로 내려가는 순간을 빠르게 포착합니다.'
              : ' 원가보다 낮은 가격은 바로 적자로 이어질 수 있습니다.'}
          </p>
        </div>
      </div>

      <div className="cr2-price-composer__grid">
        <div className="cr2-price-composer__controls">
          <label className="cr2-price-composer__field">
            <span>OEM 벤더</span>
            <select
              className="cr2-price-composer__select"
              value={selectedVendor?.id ?? ''}
              onChange={(event) => setSelectedVendor(event.target.value)}
            >
              {VENDORS.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            {selectedVendor ? (
              <small className="cr2-price-composer__hint">
                {selectedVendor.description} · 기본 원가 {formatCurrency(selectedVendor.unitCost)}
              </small>
            ) : null}
          </label>

          <label className="cr2-price-composer__field">
            <span>판매가</span>
            <div className="cr2-price-composer__price-row">
              <input
                type="range"
                min="40000"
                max="180000"
                step="1000"
                value={price}
                onChange={(event) => updatePrice(event.target.value)}
              />
              <input
                type="number"
                min="40000"
                max="180000"
                step="1000"
                value={price}
                onChange={(event) => updatePrice(event.target.value)}
                className={[
                  'cr2-price-composer__number',
                  metrics.belowCost ? 'cr2-price-composer__number--danger' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
          </label>

          <label className="cr2-price-composer__field">
            <span>발주량</span>
            <input
              type="number"
              min="0"
              max="10000"
              step="10"
              value={orderQty}
              className="cr2-price-composer__number"
              onChange={(event) => updateOrderQty(event.target.value)}
            />
            <small className="cr2-price-composer__hint">
              예상 점유율 {metrics.sharePreview.toFixed(1)}% 기준으로 이번 턴 정산이 계산됩니다.
            </small>
          </label>

          <div className="cr2-price-composer__field">
            <span>품질 모드</span>
            <div className="cr2-price-composer__modes">
              {QUALITY_MODE_ORDER.map((modeId) => {
                const mode = QUALITY_MODES[modeId]
                const selected = qualityMode === modeId

                return (
                  <button
                    key={modeId}
                    type="button"
                    className={[
                      'cr2-price-composer__mode',
                      selected ? 'cr2-price-composer__mode--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => updateQualityMode(modeId)}
                  >
                    <strong>{mode.label}</strong>
                    <small>{mode.description}</small>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="cr2-price-composer__metrics">
          <article>
            <span>실효 단위 원가</span>
            <strong>{formatCurrency(metrics.unitCost)}</strong>
          </article>
          <article>
            <span>BEP</span>
            <strong>
              {metrics.breakEvenUnits
                ? `${metrics.breakEvenUnits.toLocaleString()}개`
                : '수익 전환 불가'}
            </strong>
          </article>
          <article>
            <span>월 고정비</span>
            <strong>{formatCurrency(metrics.fixedCosts)}</strong>
          </article>
          <article>
            <span>예상 순이익</span>
            <strong>{formatSignedCurrency(metrics.projectedProfit)}</strong>
          </article>
        </div>
      </div>

      {metrics.belowCost ? (
        <div className="cr2-price-composer__warning">
          판매가가 단위 원가보다 낮습니다. 숫자 경고뿐 아니라 입력 테두리도 적색으로 표시됩니다.
        </div>
      ) : null}
    </section>
  )
}
