import './StatusStrip.css'
import { useGameStore } from '../store/useGameStore.js'

function renderHealthBar(current, max) {
  const filled = Math.max(0, Math.min(max, current))
  return `${'█'.repeat(filled)}${'░'.repeat(Math.max(0, max - filled))}`
}

export function StatusStrip() {
  const floor = useGameStore((state) => state.floor)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const momentum = useGameStore((state) => state.momentum)
  const momentumHistory = useGameStore((state) => state.momentumHistory)
  const credits = useGameStore((state) => state.credits)
  const capital = useGameStore((state) => state.capital)

  return (
    <div className="cr2-status-strip" data-critical={companyHealth <= 3}>
      <span className="cr2-status-strip__item">Floor {floor}</span>
      <span className="cr2-status-strip__item">
        {renderHealthBar(companyHealth, maxHealth)} {companyHealth}
      </span>
      <span className="cr2-status-strip__item">
        {momentumHistory.length > 0
          ? momentumHistory.map((entry) => (entry === 'up' ? '↑' : '↓')).join('')
          : '·'}
        {' '}
        {momentum >= 0 ? `+${momentum}` : momentum}
      </span>
      <span className="cr2-status-strip__item">🔷 {credits}C</span>
      <span className="cr2-status-strip__item">💰 {Math.round(capital).toLocaleString()}원</span>
    </div>
  )
}
