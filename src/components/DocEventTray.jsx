import './DocEventTray.css'
import { getEventCardById } from '../constants/eventCards.js'
import { useGameStore } from '../store/useGameStore.js'

export function DocEventTray() {
  const eventState = useGameStore((state) => state.eventState)
  const openEventCard = useGameStore((state) => state.openEventCard)

  return (
    <div className="cr2-event-tray">
      {eventState.offeredIds.map((cardId, slotIndex) => {
        const card = getEventCardById(cardId)

        if (!card) {
          return null
        }

        const used = eventState.usedSlotIndex === slotIndex
        const locked = eventState.resolved || eventState.skipped

        return (
          <button
            key={card.id}
            type="button"
            className={[
              'cr2-event-tile',
              used ? 'cr2-event-tile--used' : '',
              locked && !used ? 'cr2-event-tile--locked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={locked}
            onClick={() => openEventCard(card.id, slotIndex)}
          >
            <div className="cr2-event-tile__topline">
              <span>{`문서 ${slotIndex + 1}`}</span>
              {used ? <strong>사용됨</strong> : null}
              {eventState.skipped ? <strong>건너뜀</strong> : null}
            </div>
            <h3>{card.name}</h3>
            <p>{card.description}</p>
            <div className="cr2-event-tile__tags">
              {card.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
