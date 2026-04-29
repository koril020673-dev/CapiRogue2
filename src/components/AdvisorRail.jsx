import './AdvisorRail.css'
import { ADVISOR_ORDER, ADVISORS } from '../constants/advisors.js'
import { formatCurrency } from '../lib/formatters.js'
import { useGameStore } from '../store/useGameStore.js'

export function AdvisorRail() {
  const advisor = useGameStore((state) => state.advisor)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const factoryCount = useGameStore((state) => state.factoryCount)
  const marketShare = useGameStore((state) => state.marketShare)
  const sidebarCollapsed = useGameStore((state) => state.sidebarCollapsed)
  const selectAdvisor = useGameStore((state) => state.selectAdvisor)
  const resetRunState = useGameStore((state) => state.resetRunState)
  const toggleSidebar = useGameStore((state) => state.toggleSidebar)

  const activeAdvisor = ADVISORS[advisor] ?? ADVISORS.analyst

  return (
    <aside
      className={[
        'cr2-sidebar',
        sidebarCollapsed ? 'cr2-sidebar--collapsed' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="cr2-sidebar__top">
        <div className="cr2-sidebar__brand">
          <span className="cr2-sidebar__eyebrow">CapiRogue2</span>
          {!sidebarCollapsed ? <strong>자문 레일</strong> : null}
        </div>

        <button
          type="button"
          className="cr2-sidebar__toggle"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      <div className="cr2-sidebar__advisor-list">
        {ADVISOR_ORDER.map((advisorId) => {
          const definition = ADVISORS[advisorId]
          const selected = advisorId === advisor
          const accent = definition.themeColor

          return (
            <button
              key={advisorId}
              type="button"
              className={[
                'cr2-advisor-card',
                selected ? 'cr2-advisor-card--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--cr2-advisor-accent': accent }}
              onClick={() => selectAdvisor(advisorId)}
            >
              <span className="cr2-advisor-card__badge">{definition.name.slice(0, 1)}</span>
              {!sidebarCollapsed ? (
                <span className="cr2-advisor-card__content">
                  <strong>{definition.name}</strong>
                  <small>{definition.passiveBonus}</small>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {!sidebarCollapsed ? (
        <div className="cr2-sidebar__summary">
          <div
            className="cr2-sidebar__focus"
            style={{ '--cr2-advisor-accent': activeAdvisor.themeColor }}
          >
            <p className="cr2-sidebar__label">현재 조언자</p>
            <strong>{activeAdvisor.name}</strong>
            <span>{activeAdvisor.summary}</span>
          </div>

          <div className="cr2-sidebar__stats">
            <article>
              <span>자본</span>
              <strong>{formatCurrency(capital)}</strong>
            </article>
            <article>
              <span>부채</span>
              <strong>{formatCurrency(debt)}</strong>
            </article>
            <article>
              <span>공장</span>
              <strong>{`${factoryCount}기`}</strong>
            </article>
            <article>
              <span>점유율</span>
              <strong>{`${marketShare.toFixed(1)}%`}</strong>
            </article>
          </div>

          <button
            type="button"
            className="cr2-sidebar__reset"
            onClick={resetRunState}
          >
            런 리셋
          </button>
        </div>
      ) : null}
    </aside>
  )
}
