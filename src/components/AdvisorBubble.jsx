import './AdvisorBubble.css'
import { ADVISORS } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

export function AdvisorBubble() {
  const advisor = useGameStore((state) => state.advisor)
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const info = ADVISORS[advisor]

  if (!info) {
    return null
  }

  return (
    <div className="cr2-advisor-bubble" style={{ '--cr2-advisor-color': info.themeColor }}>
      <span className="cr2-advisor-bubble__icon">{info.icon}</span>
      <div>
        <strong>{info.name}</strong>
        <p>{activeEconomicWar ? info.special ?? info.quote : info.quote}</p>
      </div>
    </div>
  )
}
