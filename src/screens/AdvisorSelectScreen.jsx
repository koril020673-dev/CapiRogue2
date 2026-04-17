import './AdvisorSelectScreen.css'
import {
  ADVISORS,
  ADVISOR_ORDER,
  isAdvisorUnlocked,
} from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

function renderStars(value, hidden) {
  if (hidden) {
    return '???'
  }
  return '★'.repeat(value) + '☆'.repeat(5 - value)
}

export function AdvisorSelectScreen() {
  const advisorDraft = useGameStore((state) => state.advisorDraft ?? 'analyst')
  const meta = useGameStore((state) => state.meta)
  const legacyCards = useGameStore((state) => state.legacyCards)
  const setAdvisorDraft = useGameStore((state) => state.setAdvisorDraft)
  const confirmAdvisor = useGameStore((state) => state.confirmAdvisor)
  const backToTitle = useGameStore((state) => state.backToTitle)

  const selected = ADVISORS[advisorDraft] ?? ADVISORS.analyst
  const selectedUnlocked = isAdvisorUnlocked(selected.id, meta, legacyCards)

  return (
    <main className="cr2-advisor-select">
      <div className="cr2-advisor-select__shell">
        <aside className="cr2-advisor-select__rail">
          <div className="cr2-advisor-select__rail-head">
            <p className="cr2-advisor-select__eyebrow">Advisors</p>
            <h1>어드바이저 선택</h1>
          </div>

          <div className="cr2-advisor-select__list">
            {ADVISOR_ORDER.map((advisorId) => {
              const advisor = ADVISORS[advisorId]
              const unlocked = isAdvisorUnlocked(advisorId, meta, legacyCards)
              return (
                <button
                  key={advisorId}
                  type="button"
                  className="cr2-advisor-select__list-item"
                  data-selected={advisorDraft === advisorId}
                  data-locked={!unlocked}
                  onClick={() => setAdvisorDraft(advisorId)}
                >
                  <span>{unlocked ? '✅' : '🔒'}</span>
                  <strong>{advisor.name}</strong>
                </button>
              )
            })}
          </div>

          <button type="button" className="cr2-advisor-select__back" onClick={backToTitle}>
            타이틀로
          </button>
        </aside>

        <section
          className="cr2-advisor-select__detail"
          style={{ '--cr2-advisor-color': selected.themeColor }}
        >
          <div className="cr2-advisor-select__detail-head">
            <span className="cr2-advisor-select__icon">{selected.icon}</span>
            <div>
              <h2>{selected.name}</h2>
              <p>{selected.job}</p>
            </div>
          </div>

          <div className="cr2-advisor-select__info-grid">
            <div>
              <span>수수료</span>
              <strong>
                {selected.fee?.type === 'percent'
                  ? `순이익의 ${Math.round(selected.fee.value * 100)}%`
                  : selected.fee?.type === 'fixed'
                    ? `${Math.round(selected.fee.value).toLocaleString()}원`
                    : selected.fee?.type === 'creditDeduct'
                      ? `보상 Credit -${selected.fee.value}C`
                      : selected.fee?.type === 'creditAdd'
                        ? `상점 가격 +${selected.fee.value}C`
                        : '없음'}
              </strong>
            </div>
            <div>
              <span>정보력</span>
              <strong>{renderStars(selected.stats.info, !selectedUnlocked)}</strong>
            </div>
            <div>
              <span>공격력</span>
              <strong>{renderStars(selected.stats.attack, !selectedUnlocked)}</strong>
            </div>
            <div>
              <span>생존력</span>
              <strong>{renderStars(selected.stats.survival, !selectedUnlocked)}</strong>
            </div>
            <div>
              <span>난이도</span>
              <strong>{selectedUnlocked ? selected.difficulty : '???'}</strong>
            </div>
            <div>
              <span>해금 조건</span>
              <strong>{selected.unlockCondition}</strong>
            </div>
          </div>

          <div className="cr2-advisor-select__traits">
            <div>
              <span>패시브</span>
              <strong>{selectedUnlocked ? selected.passive ?? '없음' : '???'}</strong>
            </div>
            <div>
              <span>특기</span>
              <strong>{selectedUnlocked ? selected.special ?? '없음' : '???'}</strong>
            </div>
          </div>

          <blockquote className="cr2-advisor-select__quote">
            {selectedUnlocked ? selected.quote : '아직 해금되지 않았습니다.'}
          </blockquote>

          <button
            type="button"
            className="cr2-advisor-select__confirm"
            disabled={!selectedUnlocked}
            onClick={confirmAdvisor}
          >
            선택 확정
          </button>
        </section>
      </div>
    </main>
  )
}
