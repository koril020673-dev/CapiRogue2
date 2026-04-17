import './EconBanner.css'
import { ECO_DISPLAY } from '../constants/economy.js'
import { useGameStore } from '../store/useGameStore.js'

export function EconBanner() {
  const econPhase = useGameStore((state) => state.econPhase)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const display = ECO_DISPLAY[econPhase]

  return (
    <div className="cr2-econ-banner" data-phase={econPhase}>
      <span className="cr2-econ-banner__icon">{display.icon}</span>
      <span className="cr2-econ-banner__label">{display.label}</span>
      <span className="cr2-econ-banner__copy">
        {activeBlackSwan ? activeBlackSwan.hint : `${display.label} 국면에서 수요 구조가 달라집니다.`}
      </span>
    </div>
  )
}
