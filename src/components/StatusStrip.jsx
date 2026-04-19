import './StatusStrip.css'
import { useGameStore } from '../store/useGameStore.js'

function getMomentumArrows(momentumHistory) {
  if (!momentumHistory.length) {
    return '대기'
  }

  return momentumHistory.map((entry) => (entry === 'up' ? '▲' : '▼')).join(' ')
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
      <div className="cr2-status-strip__item">
        <span className="cr2-status-strip__label">층수</span>
        <strong>Floor {floor}</strong>
      </div>

      <div className="cr2-status-strip__item">
        <span className="cr2-status-strip__label">체력</span>
        <strong>
          {companyHealth}/{maxHealth}
        </strong>
      </div>

      <div className="cr2-status-strip__item">
        <span className="cr2-status-strip__label">모멘텀</span>
        <strong>
          {getMomentumArrows(momentumHistory)} {momentum >= 0 ? `+${momentum}` : momentum}
        </strong>
      </div>

      <div className="cr2-status-strip__item">
        <span className="cr2-status-strip__label">크레딧</span>
        <strong>{credits}C</strong>
      </div>

      <div className="cr2-status-strip__item cr2-status-strip__item--cash">
        <span className="cr2-status-strip__label">현금</span>
        <strong>{Math.round(capital).toLocaleString()}원</strong>
      </div>
    </div>
  )
}
