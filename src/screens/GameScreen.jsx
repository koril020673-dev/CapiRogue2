import './GameScreen.css'
import { AdvisorRail } from '../components/AdvisorRail.jsx'
import { DocEventTray } from '../components/DocEventTray.jsx'
import { EventDecisionModal } from '../components/EventDecisionModal.jsx'
import { PriceComposer } from '../components/PriceComposer.jsx'
import { RivalDeck } from '../components/RivalDeck.jsx'
import { SettlementModal } from '../components/SettlementModal.jsx'
import { ToastCenter } from '../components/ToastCenter.jsx'
import { ADVISORS } from '../constants/advisors.js'
import { formatCurrency, formatSignedCurrency } from '../lib/formatters.js'
import { useGameStore } from '../store/useGameStore.js'

const ADVISOR_ACCENTS = {
  analyst: '#60A5FA',
  hustler: '#F97316',
  oracle: '#A78BFA',
  engineer: '#34D399',
}

export function GameScreen() {
  const advisor = useGameStore((state) => state.advisor)
  const month = useGameStore((state) => state.month)
  const floor = useGameStore((state) => state.floor)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const marketShare = useGameStore((state) => state.marketShare)
  const brandValue = useGameStore((state) => state.brandValue)
  const eventState = useGameStore((state) => state.eventState)
  const metrics = useGameStore((state) => state.metrics)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const advanceMonth = useGameStore((state) => state.advanceMonth)
  const skipEventSelection = useGameStore((state) => state.skipEventSelection)

  const canCloseMonth = eventState.resolved || eventState.skipped
  const activeAdvisor = ADVISORS[advisor] ?? ADVISORS.analyst
  const accent = ADVISOR_ACCENTS[activeAdvisor.id] ?? ADVISOR_ACCENTS.analyst

  return (
    <div className="cr2-shell" style={{ '--cr2-current-accent': accent }}>
      <ToastCenter />

      <div className="cr2-frame">
        <AdvisorRail />

        <div className="cr2-main">
          <header className="cr2-header">
            <div>
              <p className="cr2-header__eyebrow">실시간 운영 보드</p>
              <h1>CapiRogue2 월간 의사결정 화면</h1>
              <p className="cr2-header__copy">
                층 구조 위에 수요, 점유율, OEM 선결제 정산을 얹어 실제로 돈이 흐르도록 연결했습니다.
              </p>
            </div>

            <div className="cr2-header__badges">
              <span className="cr2-chip">{`${floor}층`}</span>
              <span className="cr2-chip">{`${month}개월차`}</span>
              <span className="cr2-chip cr2-chip--accent">{metrics.economyLabel}</span>
              <span className="cr2-chip">{activeAdvisor.name}</span>
            </div>
          </header>

          <section className="cr2-phase-bar">
            <div>
              <p className="cr2-phase-bar__eyebrow">경제 국면</p>
              <strong>{metrics.economyLabel}</strong>
              <p>{metrics.economySummary}</p>
            </div>
            <div className="cr2-phase-bar__stats">
              <article>
                <span>예상 수요</span>
                <strong>{`${metrics.marketSize.toLocaleString()}개`}</strong>
              </article>
              <article>
                <span>예상 점유율</span>
                <strong>{`${metrics.sharePreview.toFixed(1)}%`}</strong>
              </article>
            </div>
          </section>

          <div className="cr2-main-grid">
            <section className="cr2-workbench">
              <PriceComposer />

              <section className="cr2-kpi-grid">
                <article className="cr2-kpi-card">
                  <span>가용 자본</span>
                  <strong>{formatCurrency(capital)}</strong>
                </article>
                <article className="cr2-kpi-card">
                  <span>부채 체급</span>
                  <strong>{metrics.debtBandLabel}</strong>
                </article>
                <article className="cr2-kpi-card">
                  <span>현재 점유율</span>
                  <strong>{`${marketShare.toFixed(1)}%`}</strong>
                </article>
                <article className="cr2-kpi-card">
                  <span>브랜드 / 체감 품질</span>
                  <strong>{`${brandValue.toFixed(0)} / ${metrics.effectiveQuality.toFixed(0)}`}</strong>
                </article>
              </section>

              <section className="cr2-turn-surface">
                <div className="cr2-turn-surface__top">
                  <div>
                    <p className="cr2-turn-surface__eyebrow">턴 제어</p>
                    <h2>이번 달 문서 검토 후 정산을 확정합니다.</h2>
                    <p className="cr2-turn-surface__copy">
                      카드를 하나 선택하거나 명시적으로 건너뛰기 전까지는 정산을 실행할 수 없습니다.
                    </p>
                  </div>

                  <div className="cr2-turn-surface__actions">
                    <button
                      type="button"
                      className="cr2-button cr2-button--ghost"
                      onClick={skipEventSelection}
                      disabled={canCloseMonth}
                    >
                      이번 달 이벤트 건너뛰기
                    </button>
                    <button
                      type="button"
                      className="cr2-button cr2-button--primary"
                      onClick={advanceMonth}
                      disabled={!canCloseMonth}
                    >
                      이번 달 마감 →
                    </button>
                  </div>
                </div>

                <DocEventTray />
              </section>
            </section>

            <aside className="cr2-sidepane">
              <section className="cr2-sidecard">
                <p className="cr2-sidecard__eyebrow">운영 스냅샷</p>
                <div className="cr2-sidecard__rows">
                  <div>
                    <span>부채 총액</span>
                    <strong>{formatCurrency(debt)}</strong>
                  </div>
                  <div>
                    <span>예상 손익</span>
                    <strong>{formatSignedCurrency(metrics.projectedProfit)}</strong>
                  </div>
                </div>
              </section>

              <section className="cr2-sidecard">
                <p className="cr2-sidecard__eyebrow">직전 정산</p>
                {lastSettlement ? (
                  <div className="cr2-sidecard__rows">
                    <div>
                      <span>매출</span>
                      <strong>{formatCurrency(lastSettlement.revenue)}</strong>
                    </div>
                    <div>
                      <span>순이익</span>
                      <strong>{formatSignedCurrency(lastSettlement.netProfit)}</strong>
                    </div>
                    <div>
                      <span>판매량</span>
                      <strong>{`${lastSettlement.actualSold.toLocaleString()}개`}</strong>
                    </div>
                    <div>
                      <span>점유율</span>
                      <strong>{`${(lastSettlement.myShare * 100).toFixed(1)}%`}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="cr2-sidecard__empty">
                    첫 정산 전입니다. 이번 달 선택을 마치면 결과가 쌓입니다.
                  </p>
                )}
              </section>

              <RivalDeck />
            </aside>
          </div>
        </div>
      </div>

      <EventDecisionModal />
      <SettlementModal />
    </div>
  )
}
