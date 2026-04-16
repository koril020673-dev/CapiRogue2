import './RivalDeck.css'
import { RIVALS, RIVAL_ORDER } from '../constants/rivals.js'
import { formatCurrency } from '../lib/formatters.js'
import { useGameStore } from '../store/useGameStore.js'

export function RivalDeck() {
  const rivals = useGameStore((state) => state.rivals)

  return (
    <section className="cr2-rival-deck">
      <div className="cr2-rival-deck__header">
        <p className="cr2-rival-deck__eyebrow">경쟁사 체력</p>
        <h2>활성 라이벌 기록</h2>
      </div>

      <div className="cr2-rival-deck__list">
        {RIVAL_ORDER.map((rivalId) => {
          const rivalDefinition = RIVALS[rivalId]
          const rival = rivals[rivalId]
          const healthRatio = Math.max(
            0,
            Math.min((rival?.capital ?? 0) / Math.max(rival?.initialCapital ?? 1, 1), 1),
          )

          return (
            <article
              key={rivalId}
              className={[
                'cr2-rival-card',
                rival?.eliminated ? 'cr2-rival-card--out' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--cr2-rival-color': rivalDefinition.color }}
            >
              <div className="cr2-rival-card__top">
                <div className="cr2-rival-card__identity">
                  <span className="cr2-rival-card__icon">{rivalDefinition.icon}</span>
                  <div>
                    <strong>{rivalDefinition.name}</strong>
                    <small>{rivalDefinition.archetype}</small>
                  </div>
                </div>
                <span className="cr2-rival-card__status">
                  {rival?.eliminated ? '퇴출' : rival?.status}
                </span>
              </div>

              <div className="cr2-rival-card__health">
                <div className="cr2-rival-card__health-bar">
                  <span style={{ width: `${healthRatio * 100}%` }} />
                </div>
                <small>
                  자본 {formatCurrency(rival?.capital)} / {formatCurrency(rival?.initialCapital)}
                </small>
              </div>

              <div className="cr2-rival-card__stats">
                <article>
                  <span>판매가</span>
                  <strong>{formatCurrency(rival?.currentPrice)}</strong>
                </article>
                <article>
                  <span>점유율</span>
                  <strong>{`${rival?.marketShare?.toFixed(1)}%`}</strong>
                </article>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
