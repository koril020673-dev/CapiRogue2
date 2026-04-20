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

  return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`
}

function getFeeLabel(advisor) {
  if (!advisor.fee) {
    return '없음'
  }

  if (advisor.fee.type === 'percent') {
    return `순이익의 ${Math.round(advisor.fee.value * 100)}%`
  }

  if (advisor.fee.type === 'fixed') {
    return `${Math.round(advisor.fee.value).toLocaleString()}원`
  }

  if (advisor.fee.type === 'creditDeduct') {
    return `보상 Credit -${advisor.fee.value}C`
  }

  if (advisor.fee.type === 'creditAdd') {
    return `상점 가격 +${advisor.fee.value}C`
  }

  return '없음'
}

function StatMeter({ label, value, hidden }) {
  return (
    <div className="cr2-advisor-scene__meter">
      <div className="cr2-advisor-scene__meter-head">
        <span>{label}</span>
        <strong>{hidden ? '???' : `${value}/5`}</strong>
      </div>
      <div className="cr2-advisor-scene__meter-track">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={`${label}-${index}`}
            className="cr2-advisor-scene__meter-pip"
            data-filled={!hidden && index < value}
          />
        ))}
      </div>
    </div>
  )
}

export function AdvisorSelectScreen() {
  const advisorDraft = useGameStore((state) => state.advisorDraft ?? 'analyst')
  const isAdmin = useGameStore((state) => state.auth?.isAdmin)
  const meta = useGameStore((state) => state.meta)
  const legacyCards = useGameStore((state) => state.legacyCards)
  const setAdvisorDraft = useGameStore((state) => state.setAdvisorDraft)
  const confirmAdvisor = useGameStore((state) => state.confirmAdvisor)
  const backToTitle = useGameStore((state) => state.backToTitle)

  const selected = ADVISORS[advisorDraft] ?? ADVISORS.analyst
  const selectedUnlocked = isAdmin || isAdvisorUnlocked(selected.id, meta, legacyCards)

  return (
    <main className="cr2-advisor-scene">
      <div className="cr2-advisor-scene__shell">
        <aside className="cr2-advisor-scene__sidebar">
          <div className="cr2-advisor-scene__sidebar-head">
            <p className="cr2-advisor-scene__eyebrow">Advisor Select</p>
            <h1>어드바이저를 선택하세요</h1>
            <p className="cr2-advisor-scene__copy">
              이번 런의 정보력과 운영 스타일을 결정합니다.
            </p>
          </div>

          <div className="cr2-advisor-scene__roster">
            {ADVISOR_ORDER.map((advisorId, index) => {
              const advisor = ADVISORS[advisorId]
              const unlocked = isAdmin || isAdvisorUnlocked(advisorId, meta, legacyCards)

              return (
                <button
                  key={advisorId}
                  type="button"
                  className="cr2-advisor-scene__roster-item"
                  data-selected={advisorDraft === advisorId}
                  data-locked={!unlocked}
                  style={{ '--cr2-advisor-color': advisor.themeColor }}
                  onClick={() => setAdvisorDraft(advisorId)}
                >
                  <span className="cr2-advisor-scene__roster-index">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <span className="cr2-advisor-scene__roster-icon">{advisor.icon}</span>
                  <span className="cr2-advisor-scene__roster-name">{advisor.name}</span>
                  <span className="cr2-advisor-scene__roster-lock">
                    {unlocked ? 'OPEN' : 'LOCK'}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="cr2-advisor-scene__back"
            onClick={backToTitle}
          >
            타이틀로 돌아가기
          </button>
        </aside>

        <section
          className="cr2-advisor-scene__stage"
          style={{ '--cr2-advisor-color': selected.themeColor }}
        >
          <div className="cr2-advisor-scene__stage-top">
            <div className="cr2-advisor-scene__stage-frame">
              <div className="cr2-advisor-scene__portrait">
                <div className="cr2-advisor-scene__portrait-aura" />
                <span className="cr2-advisor-scene__portrait-icon">{selected.icon}</span>
                <span className="cr2-advisor-scene__portrait-ring" />
              </div>

              <div className="cr2-advisor-scene__identity">
                <div className="cr2-advisor-scene__identity-head">
                  <p className="cr2-advisor-scene__identity-job">{selected.job}</p>
                  <h2>{selected.name}</h2>
                </div>

                <div className="cr2-advisor-scene__identity-meta">
                  <div>
                    <span>수수료</span>
                    <strong>{getFeeLabel(selected)}</strong>
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

                <blockquote className="cr2-advisor-scene__quote">
                  {selectedUnlocked
                    ? selected.quote
                    : '아직 이 어드바이저는 해금되지 않았습니다.'}
                </blockquote>
              </div>
            </div>
          </div>

          <div className="cr2-advisor-scene__stage-bottom">
            <section className="cr2-advisor-scene__panel">
              <div className="cr2-advisor-scene__panel-head">
                <span>전술 성향</span>
                <strong>{renderStars(selected.stats.info, !selectedUnlocked)}</strong>
              </div>
              <div className="cr2-advisor-scene__meters">
                <StatMeter
                  label="정보력"
                  value={selected.stats.info}
                  hidden={!selectedUnlocked}
                />
                <StatMeter
                  label="공격력"
                  value={selected.stats.attack}
                  hidden={!selectedUnlocked}
                />
                <StatMeter
                  label="생존력"
                  value={selected.stats.survival}
                  hidden={!selectedUnlocked}
                />
              </div>
            </section>

            <section className="cr2-advisor-scene__panel">
              <div className="cr2-advisor-scene__trait-block">
                <span>패시브</span>
                <strong>{selectedUnlocked ? selected.passive ?? '없음' : '???'}</strong>
              </div>
              <div className="cr2-advisor-scene__trait-block">
                <span>특기</span>
                <strong>{selectedUnlocked ? selected.special ?? '없음' : '???'}</strong>
              </div>
            </section>
          </div>

          <div className="cr2-advisor-scene__footer">
            <div className="cr2-advisor-scene__footer-note">
              {selectedUnlocked
                ? '선택 즉시 새 런이 시작됩니다.'
                : '잠긴 어드바이저는 해금 조건을 만족하면 선택할 수 있습니다.'}
            </div>
            <button
              type="button"
              className="cr2-advisor-scene__confirm"
              disabled={!selectedUnlocked}
              onClick={confirmAdvisor}
            >
              선택 확정
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
