import './EventDecisionModal.css'
import { getEventCardById } from '../constants/eventCards.js'
import { useGameStore } from '../store/useGameStore.js'

export function EventDecisionModal() {
  const eventState = useGameStore((state) => state.eventState)
  const closeEventCard = useGameStore((state) => state.closeEventCard)
  const resolveEventChoice = useGameStore((state) => state.resolveEventChoice)

  const card = getEventCardById(eventState?.openCardId)

  if (!card || typeof closeEventCard !== 'function') {
    return null
  }

  return (
    <div className="cr2-event-modal__backdrop" role="presentation" onClick={closeEventCard}>
      <div
        className="cr2-event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cr2-event-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cr2-event-modal__top">
          <div>
            <p className="cr2-event-modal__eyebrow">결재 문서</p>
            <h2 id="cr2-event-modal-title">{card.name}</h2>
          </div>
          <button
            type="button"
            className="cr2-event-modal__close"
            onClick={closeEventCard}
            aria-label="문서 닫기"
          >
            ✕
          </button>
        </div>

        <p className="cr2-event-modal__description">{card.description}</p>

        <div className="cr2-event-modal__tags">
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <div className="cr2-event-modal__choices">
          {card.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              className="cr2-event-modal__choice"
              onClick={() => {
                if (typeof resolveEventChoice === 'function') {
                  resolveEventChoice(choice.id)
                }
              }}
            >
              <strong>{choice.label}</strong>
              <span>{choice.probabilityHint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
