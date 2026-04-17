import './StatusBar.css'
import { useGameStore } from '../store/useGameStore.js'

export function StatusBar() {
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const momentum = useGameStore((state) => state.momentum)
  const momentumHistory = useGameStore((state) => state.momentumHistory)
  const credits = useGameStore((state) => state.credits)
  const toggleShop = useGameStore((state) => state.toggleShop)

  return (
    <div className="cr2-statusbar" data-health-critical={companyHealth <= 4}>
      <div className="cr2-statusbar__block">
        <span className="cr2-statusbar__label">경영 체력</span>
        <div className="cr2-statusbar__health">
          {Array.from({ length: maxHealth }, (_, index) => (
            <span key={index} className="cr2-statusbar__pip" data-filled={index < companyHealth} />
          ))}
        </div>
        <span className="cr2-statusbar__value">
          {companyHealth}/{maxHealth}
        </span>
      </div>

      <div className="cr2-statusbar__divider" />

      <div className="cr2-statusbar__block">
        <span className="cr2-statusbar__label">모멘텀</span>
        <div className="cr2-statusbar__momentum">
          {momentumHistory.map((item, index) => (
            <span key={`${item}-${index}`} data-dir={item}>
              {item === 'up' ? '↑' : '↓'}
            </span>
          ))}
        </div>
        <span className="cr2-statusbar__value">{momentum >= 0 ? `+${momentum}` : momentum}</span>
      </div>

      <div className="cr2-statusbar__divider" />

      <button type="button" className="cr2-statusbar__shop" onClick={toggleShop}>
        <span>🔷 {credits}C</span>
        <span>상점</span>
      </button>
    </div>
  )
}
