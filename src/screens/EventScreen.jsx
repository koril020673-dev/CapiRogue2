import './EventScreen.css'
import { useGameStore } from '../store/useGameStore.js'

const CHOICE_TYPE_LABEL = {
  safe: '안전',
  normal: '일반',
  gamble: '도박',
  absurd: '?!',
}

function formatSignedPercent(value) {
  const rounded = Math.round(value * 100)
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`
}

function formatAutoEffect(effect) {
  if (!effect) {
    return ''
  }

  const parts = []
  if (effect.costMul > 1) parts.push(`원가 ${formatSignedPercent(effect.costMul - 1)}`)
  if (effect.costMul < 1) parts.push(`원가 ${formatSignedPercent(effect.costMul - 1)}`)
  if (effect.demandMul > 1) parts.push(`수요 ${formatSignedPercent(effect.demandMul - 1)}`)
  if (effect.demandMul < 1) parts.push(`수요 ${formatSignedPercent(effect.demandMul - 1)}`)
  if (effect.interestRateAdd > 0) parts.push(`금리 +${effect.interestRateAdd * 100}%p`)
  if (effect.interestRateAdd < 0) parts.push(`금리 ${effect.interestRateAdd * 100}%p`)

  const duration = effect.duration ? ` (${effect.duration}턴 지속)` : ''
  return `${parts.join(' / ')}${duration}`
}

export function EventScreen() {
  const currentSituationEvent = useGameStore((state) => state.currentSituationEvent)
  const currentPlayerEvent = useGameStore((state) => state.currentPlayerEvent)
  const lastEventResult = useGameStore((state) => state.lastEventResult)
  const resolvePlayerEvent = useGameStore((state) => state.resolvePlayerEvent)
  const goToStrategyStage = useGameStore((state) => state.goToStrategyStage)

  return (
    <section className="cr2-event-screen cr2-game__panel">
      <div className="cr2-event-screen__head">
        <div>
          <p className="cr2-event-screen__eyebrow">Event Check</p>
          <h2>이번 달 이벤트</h2>
        </div>
      </div>

      {currentSituationEvent ? (
        <article className="cr2-situation-event">
          <div className="cr2-event-header" data-type="situation">
            세계 이벤트
          </div>
          <div className="cr2-event-name">{currentSituationEvent.name}</div>
          <div className="cr2-event-desc">{currentSituationEvent.desc}</div>
          <div className="cr2-event-effect-preview">
            {formatAutoEffect(currentSituationEvent.autoEffect)}
          </div>
          {currentSituationEvent.educationHint ? (
            <div className="cr2-event-hint">💡 {currentSituationEvent.educationHint}</div>
          ) : null}
          <div className="cr2-event-auto-badge">자동 적용</div>
        </article>
      ) : (
        <article className="cr2-situation-event cr2-situation-event--empty">
          이번 달 세계 이벤트는 없습니다.
        </article>
      )}

      {currentPlayerEvent ? (
        <article className="cr2-player-event">
          <div className="cr2-event-header" data-type="player">
            회사 이벤트
          </div>
          <div className="cr2-event-name">{currentPlayerEvent.name}</div>
          <div className="cr2-event-desc">{currentPlayerEvent.desc}</div>
          <div className="cr2-event-choices">
            {currentPlayerEvent.choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                className="cr2-event-choice-btn"
                data-type={choice.type}
                onClick={() => resolvePlayerEvent(choice.id)}
              >
                <span className="cr2-choice-label">{choice.label}</span>
                <span className="cr2-choice-type-badge">
                  {CHOICE_TYPE_LABEL[choice.type] ?? '일반'}
                </span>
              </button>
            ))}
          </div>
        </article>
      ) : (
        <article className="cr2-no-player-event">
          <span>{lastEventResult?.message ?? '이번 달은 특별한 회사 사건이 없습니다.'}</span>
          <button type="button" className="cr2-btn-primary" onClick={goToStrategyStage}>
            전략 선택 →
          </button>
        </article>
      )}
    </section>
  )
}
