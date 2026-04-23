import './CompanyStatusScreen.css'
import { useGameStore } from '../store/useGameStore.js'

function formatMoney(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

export function CompanyStatusScreen() {
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const priceResistance = useGameStore((state) => state.priceResistance)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const lastGroupShares = useGameStore((state) => state.lastGroupShares)
  const warningAlerts = useGameStore((state) => state.warningAlerts)
  const generateFloorEvents = useGameStore((state) => state.generateFloorEvents)

  return (
    <section className="cr2-company-screen cr2-game__panel">
      <div className="cr2-company-screen__head">
        <div>
          <p className="cr2-company-screen__eyebrow">Company Status</p>
          <h2>내 회사 현황</h2>
        </div>
      </div>

      <section className="cr2-company-screen__section">
        <div className="cr2-company-screen__stats">
          <div>
            <span>현금</span>
            <strong>{formatMoney(capital)}</strong>
          </div>
          <div>
            <span>부채</span>
            <strong>{formatMoney(debt)}</strong>
          </div>
          <div>
            <span>순자산</span>
            <strong>{formatMoney(capital - debt)}</strong>
          </div>
          <div>
            <span>브랜드</span>
            <strong>{Math.round(brandValue)}pt</strong>
          </div>
          <div>
            <span>품질</span>
            <strong>{Math.round(qualityScore)}pt</strong>
          </div>
          <div>
            <span>저항성</span>
            <strong>{formatPercent(priceResistance * 100)}</strong>
          </div>
          <div>
            <span>점유율</span>
            <strong>{formatPercent((lastSettlement?.myShare ?? 0) * 100)}</strong>
          </div>
        </div>
      </section>

      <section className="cr2-company-screen__section">
        <h3>소비자 그룹별 내 점유율</h3>
        <div className="cr2-company-screen__group-grid">
          <div>
            <span>품질 그룹</span>
            <strong>{formatPercent((lastGroupShares?.quality ?? 0) * 100)}</strong>
          </div>
          <div>
            <span>브랜드 그룹</span>
            <strong>{formatPercent((lastGroupShares?.brand ?? 0) * 100)}</strong>
          </div>
          <div>
            <span>가성비 그룹</span>
            <strong>{formatPercent((lastGroupShares?.value ?? 0) * 100)}</strong>
          </div>
          <div>
            <span>일반 그룹</span>
            <strong>{formatPercent((lastGroupShares?.general ?? 0) * 100)}</strong>
          </div>
        </div>
      </section>

      <section className="cr2-company-screen__section">
        <h3>경고 메시지</h3>
        {warningAlerts?.length ? (
          <div className="cr2-company-screen__warnings">
            {warningAlerts.map((warning) => (
              <div key={warning} className="cr2-company-screen__warning">
                {warning}
              </div>
            ))}
          </div>
        ) : (
          <div className="cr2-company-screen__warnings cr2-company-screen__warnings--empty">
            현재 즉시 대응이 필요한 경고는 없습니다.
          </div>
        )}
      </section>

      <div className="cr2-company-screen__footer">
        <button type="button" className="cr2-company-screen__next" onClick={generateFloorEvents}>
          이벤트 확인 →
        </button>
      </div>
    </section>
  )
}
