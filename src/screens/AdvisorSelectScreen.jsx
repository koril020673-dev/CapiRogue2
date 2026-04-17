import './AdvisorSelectScreen.css'
import { ADVISOR_ORDER, ADVISORS, isAdvisorUnlocked } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

export function AdvisorSelectScreen() {
  const advisorDraft = useGameStore((state) => state.advisorDraft)
  const meta = useGameStore((state) => state.meta)
  const legacyCards = useGameStore((state) => state.legacyCards)
  const setAdvisorDraft = useGameStore((state) => state.setAdvisorDraft)
  const confirmAdvisor = useGameStore((state) => state.confirmAdvisor)

  return (
    <div className="cr2-advisor-screen">
      <div className="cr2-advisor-screen__head">
        <p className="cr2-advisor-screen__eyebrow">Advisor</p>
        <h1>어드바이저를 선택하세요</h1>
      </div>
      <div className="cr2-advisor-screen__grid">
        {ADVISOR_ORDER.map((advisorId) => {
          const advisor = ADVISORS[advisorId]
          const unlocked = isAdvisorUnlocked(advisorId, meta, legacyCards)
          return (
            <button
              key={advisorId}
              type="button"
              className="cr2-advisor-screen__card"
              data-selected={advisorDraft === advisorId}
              data-locked={!unlocked}
              onClick={() => unlocked && setAdvisorDraft(advisorId)}
            >
              <strong>
                {advisor.icon} {advisor.name}
              </strong>
              <span>{advisor.desc}</span>
              <small>{unlocked ? advisor.unlockCondition : `잠금: ${advisor.unlockCondition}`}</small>
            </button>
          )
        })}
      </div>
      <button type="button" className="cr2-advisor-screen__confirm" disabled={!advisorDraft} onClick={confirmAdvisor}>
        다음 →
      </button>
    </div>
  )
}
