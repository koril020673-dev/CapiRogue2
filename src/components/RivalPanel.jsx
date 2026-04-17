import './RivalPanel.css'
import { RIVAL_ORDER, RIVALS } from '../constants/rivals.js'
import { useGameStore } from '../store/useGameStore.js'

function getRivalStatus(rival) {
  if (!rival || rival.bankrupt || rival.eliminated) {
    return '퇴출'
  }

  const ratio = rival.capital / Math.max(rival.initialCapital, 1)
  if (ratio >= 0.7 && rival.isAggressive) {
    return '공세중'
  }
  if (ratio >= 0.5) {
    return '관망중'
  }
  if (ratio > 0.2) {
    return '위기'
  }
  return '파산'
}

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
          const status = getRivalStatus(rival)

          return (
            <article key={rivalId} className="cr2-rival-panel__card" data-out={status === '퇴출'}>
              <div className="cr2-rival-panel__top">
                <strong>
                  {definition.icon} {rival?.name ?? definition.name}
                </strong>
                <span>{status}</span>
              </div>
              <div className="cr2-rival-panel__bar">
                <span style={{ width: `${ratio * 100}%` }} />
              </div>
              <div className="cr2-rival-panel__meta">
                <span>{Math.round(rival?.currentPrice ?? definition.basePrice).toLocaleString()}원</span>
                <span>{Number(rival?.marketShare ?? 0).toFixed(1)}%</span>
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}
