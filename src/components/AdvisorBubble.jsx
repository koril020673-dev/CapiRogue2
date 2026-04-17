import './AdvisorBubble.css'
import { ADVISORS } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

export function AdvisorBubble() {
  const advisor = useGameStore((state) => state.advisor)
  const econPhase = useGameStore((state) => state.econPhase)
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
        <p>
          {activeEconomicWar
            ? `${activeEconomicWar.name} 대응 중입니다. ${info.special ?? info.desc}`
            : `${ECO_DISPLAY_MAP[econPhase]} 국면. ${info.passive ?? info.desc}`}
        </p>
      </div>
    </div>
  )
}

const ECO_DISPLAY_MAP = {
  boom: '호황',
  growth: '성장',
  stable: '평시',
  contraction: '위축',
  recession: '불황',
}
