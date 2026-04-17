import './EventCard.css'
import { getEventCardById } from '../constants/eventCards.js'
import { useGameStore } from '../store/useGameStore.js'

export function EventCard() {
  const currentEventCardId = useGameStore((state) => state.currentEventCardId)
  const currentEventResolved = useGameStore((state) => state.currentEventResolved)
  const resolveEventChoice = useGameStore((state) => state.resolveEventChoice)

  const card = getEventCardById(currentEventCardId)
  if (!card) {
    return null
  }

  return (
    <section className="cr2-event-card">
      <div className="cr2-event-card__head">
        <p className="cr2-event-card__eyebrow">Choice 2</p>
        <h2>{card.name}</h2>
      </div>
      <p className="cr2-event-card__desc">{card.description}</p>
      <div className="cr2-event-card__tags">
        {card.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="cr2-event-card__choices">
        {card.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="cr2-event-card__choice"
            disabled={currentEventResolved}
            onClick={() => resolveEventChoice(choice.id)}
          >
            <strong>{choice.label}</strong>
            <span>{choice.probabilityHint}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
