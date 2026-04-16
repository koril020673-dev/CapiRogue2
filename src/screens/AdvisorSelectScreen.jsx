import { ADVISOR_ORDER, ADVISORS } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

export function AdvisorSelectScreen() {
  const advisor = useGameStore((state) => state.advisor)
  const hoveredAdvisor = useGameStore((state) => state.hoveredAdvisor)
  const selectAdvisor = useGameStore((state) => state.selectAdvisor)
  const setHoveredAdvisor = useGameStore((state) => state.setHoveredAdvisor)
  const clearHoveredAdvisor = useGameStore((state) => state.clearHoveredAdvisor)

  const previewAdvisor = ADVISORS[hoveredAdvisor] ?? ADVISORS[advisor]

  return (
    <section className="advisor-screen panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">조언자 선택</p>
          <h2 className="panel-title">이번 런을 이끌 조언자를 고르세요</h2>
          <p className="panel-copy">
            카드에 마우스를 올리면 브리핑 스타일과 패시브를 바로 비교할 수 있습니다.
          </p>
        </div>
        <div className="phase-pill phase-pill--blue">선택 후 다음 화면으로 확장 예정</div>
      </div>

      <div className="advisor-layout">
        <div className="advisor-card-grid">
          {ADVISOR_ORDER.map((advisorId) => {
            const entry = ADVISORS[advisorId]
            const isSelected = advisor === advisorId
            const isPreview = previewAdvisor.id === advisorId

            return (
              <button
                key={advisorId}
                type="button"
                className={[
                  'advisor-card',
                  isSelected ? 'advisor-card--selected' : '',
                  isPreview ? 'advisor-card--preview' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onMouseEnter={() => setHoveredAdvisor(advisorId)}
                onMouseLeave={clearHoveredAdvisor}
                onFocus={() => setHoveredAdvisor(advisorId)}
                onBlur={clearHoveredAdvisor}
                onClick={() => selectAdvisor(advisorId)}
              >
                <span className="advisor-card__tag">{entry.codename}</span>
                <strong className="advisor-card__name">{entry.name}</strong>
                <span className="advisor-card__bonus">{entry.passiveBonus}</span>
                <p className="advisor-card__personality">{entry.personality}</p>
                <span className="advisor-card__style">{entry.advisorBubbleMode}</span>
              </button>
            )
          })}
        </div>

        <article className="advisor-preview-card">
          <p className="panel-kicker">조언자 미리보기</p>
          <h3 className="advisor-preview-card__title">{previewAdvisor.name}</h3>
          <p className="advisor-preview-card__quote">“{previewAdvisor.starterQuote}”</p>

          <div className="advisor-preview-card__meta">
            <div>
              <span className="label">패시브</span>
              <strong>{previewAdvisor.passiveBonus}</strong>
            </div>
            <div>
              <span className="label">정보 스타일</span>
              <strong>{previewAdvisor.infoStyle}</strong>
            </div>
          </div>

          <ul className="advisor-preview-card__stats">
            {previewAdvisor.hoverStats.map((stat) => (
              <li key={stat}>{stat}</li>
            ))}
          </ul>

          <button
            type="button"
            className="app-button app-button--primary"
            onClick={() => selectAdvisor(previewAdvisor.id)}
          >
            {previewAdvisor.id === advisor ? '현재 선택 유지' : '이 조언자로 선택'}
          </button>
        </article>
      </div>
    </section>
  )
}
