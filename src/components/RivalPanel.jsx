import './RivalPanel.css'
import { RIVAL_ORDER, RIVALS } from '../constants/rivals.js'
import { useGameStore } from '../store/useGameStore.js'

export function RivalPanel() {
  const rivals = useGameStore((state) => state.rivals)

  return (
    <aside className="cr2-rival-panel">
      <div className="cr2-rival-panel__head">
        <p className="cr2-rival-panel__eyebrow">Competitors</p>
        <h2>경쟁사</h2>
      </div>

      <div className="cr2-rival-panel__list">
        {RIVAL_ORDER.map((rivalId) => {
          const rival = rivals[rivalId]
          const definition = RIVALS[rivalId]
          const ratio = rival ? Math.max(0, Math.min(rival.capital / rival.initialCapital, 1)) : 0

          return (
            <article key={rivalId} className="cr2-rival-panel__card" data-out={!rival?.active || rival?.bankrupt}>
              <div className="cr2-rival-panel__top">
                <strong>
                  {definition.icon} {rival?.name ?? definition.name}
                </strong>
                <span>{rival?.status ?? '대기중'}</span>
              </div>
              <div className="cr2-rival-panel__bar">
                <span style={{ width: `${ratio * 100}%` }} />
              </div>
              <div className="cr2-rival-panel__meta">
                <span>{Math.round(rival?.currentPrice ?? definition.basePrice).toLocaleString()}원</span>
                <span>{(rival?.marketShare ?? 0).toFixed(1)}%</span>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
