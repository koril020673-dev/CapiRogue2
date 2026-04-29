import './AdvisorSelectScreen.css'
import { ADVISORS, ADVISOR_ORDER } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

const DETAILS = {
  raider: {
    passive: '매력도 x1.07',
    buffs: ['매력도 계산 시 7% 보너스'],
    nerfs: ['최대 체력 8'],
    difficulty: '★★★☆',
  },
  guardian: {
    passive: '손실 방어',
    buffs: ['체력 감소량 -1'],
    nerfs: ['발주량 상한 -10%'],
    difficulty: '★☆☆☆',
  },
  analyst: {
    passive: '정보 우위',
    buffs: ['라이벌 정보 추가 공개', '보상 시 크레딧 +1', '국면 전환 1턴 전 예고'],
    nerfs: ['직접 전투 보너스 없음'],
    difficulty: '★★☆☆',
  },
  gambler: {
    passive: '이벤트 한방',
    buffs: ['도박적 선택지 확률 +15%', '말도 안 되는 선택지 대박 확률 +15%'],
    nerfs: ['자동 체력 회복 없음'],
    difficulty: '★★★★',
  },
}

export function AdvisorSelectScreen() {
  const advisorDraft = useGameStore((state) => state.advisorDraft ?? 'raider')
  const setAdvisorDraft = useGameStore((state) => state.setAdvisorDraft)
  const confirmAdvisor = useGameStore((state) => state.confirmAdvisor)
  const backToTitle = useGameStore((state) => state.backToTitle)
  const selected = ADVISORS[advisorDraft] ?? ADVISORS.raider
  const selectedDetail = DETAILS[selected.id]

  return (
    <main className="cr2-advisor-starter">
      <section className="cr2-advisor-starter__shell">
        <header className="cr2-advisor-starter__head">
          <p>ADVISOR SELECT</p>
          <h1>당신의 어드바이저를 선택하세요</h1>
        </header>

        <section className="cr2-advisor-starter__grid">
          {ADVISOR_ORDER.map((advisorId) => {
            const advisor = ADVISORS[advisorId]
            const selectedCard = advisor.id === selected.id

            return (
              <button
                key={advisor.id}
                type="button"
                className="cr2-advisor-starter__card"
                data-selected={selectedCard}
                style={{ '--cr2-advisor-color': advisor.themeColor }}
                onMouseEnter={() => setAdvisorDraft(advisor.id)}
                onClick={() => setAdvisorDraft(advisor.id)}
              >
                <strong>{advisor.name}</strong>
                <span>{advisor.style}</span>
                <i aria-label="TODO: replace with pixel art">{advisor.icon}</i>
                <small>{advisor.summary}</small>
              </button>
            )
          })}
        </section>

        <section
          className="cr2-advisor-starter__detail"
          style={{ '--cr2-advisor-color': selected.themeColor }}
        >
          <div className="cr2-advisor-starter__title">
            <strong>{selected.name}</strong>
            <span>{selected.style}</span>
          </div>
          <p>{selected.description}</p>
          <div className="cr2-advisor-starter__passive">
            <span>패시브</span>
            <strong>{selectedDetail.passive}</strong>
          </div>
          <TraitList title="버프" items={selectedDetail.buffs} tone="buff" />
          <TraitList title="너프" items={selectedDetail.nerfs} tone="nerf" />
          <div className="cr2-advisor-starter__difficulty">
            <span>난이도</span>
            <strong>{selectedDetail.difficulty}</strong>
          </div>
        </section>

        <footer className="cr2-advisor-starter__actions">
          <button type="button" className="cr2-advisor-starter__back" onClick={backToTitle}>
            타이틀로
          </button>
          <button type="button" className="cr2-advisor-starter__confirm" onClick={confirmAdvisor}>
            이 어드바이저로 시작
          </button>
        </footer>
      </section>
    </main>
  )
}

function TraitList({ title, items, tone }) {
  return (
    <div className="cr2-advisor-starter__traits">
      <span>{title}</span>
      <ul>
        {items.map((item) => (
          <li key={item} data-tone={tone}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
