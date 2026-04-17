import './SidePanel.css'
import { RivalPanel } from './RivalPanel.jsx'
import { WarningAlerts } from './WarningAlerts.jsx'
import { useGameStore } from '../store/useGameStore.js'

function formatPercentFromPoints(value) {
  return `${Number(value ?? 0).toFixed(1)}%`
}

export function SidePanel() {
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const priceResistance = useGameStore((state) => state.priceResistance)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const companyHealth = useGameStore((state) => state.companyHealth)

  return (
    <aside className="cr2-side-panel" data-crisis={companyHealth <= 3}>
      <section className="cr2-side-panel__company">
        <div className="cr2-side-panel__head">
          <p className="cr2-side-panel__eyebrow">My Company</p>
          <h2>내 회사</h2>
        </div>
        <dl className="cr2-side-panel__stats">
          <div>
            <dt>현금</dt>
            <dd>{Math.round(capital).toLocaleString()}원</dd>
          </div>
          <div>
            <dt>부채</dt>
            <dd>{Math.round(debt).toLocaleString()}원</dd>
          </div>
          <div>
            <dt>순자산</dt>
            <dd>{Math.round(capital - debt).toLocaleString()}원</dd>
          </div>
          <div>
            <dt>브랜드</dt>
            <dd>{Math.round(brandValue)}pt</dd>
          </div>
          <div>
            <dt>품질</dt>
            <dd>{Math.round(qualityScore)}pt</dd>
          </div>
          <div>
            <dt>저항성</dt>
            <dd>{formatPercentFromPoints(priceResistance * 100)}</dd>
          </div>
          <div>
            <dt>점유율</dt>
            <dd>{((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%</dd>
          </div>
        </dl>
      </section>

      <RivalPanel />
      <WarningAlerts />
    </aside>
  )
}
