import './WarningAlerts.css'
import { useGameStore } from '../store/useGameStore.js'

export function WarningAlerts() {
  const warnings = useGameStore((state) => state.warningAlerts)

  if (!warnings?.length) {
    return null
  }

  return (
    <section className="cr2-warning-alerts">
      <h3 className="cr2-warning-alerts__title">경고</h3>
      <div className="cr2-warning-alerts__list">
        {warnings.map((warning) => (
          <div key={warning} className="cr2-warning-alerts__item">
            {warning}
          </div>
        ))}
      </div>
    </section>
  )
}
