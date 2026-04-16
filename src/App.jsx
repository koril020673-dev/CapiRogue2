import './App.css'
import { ADVISORS } from './constants/advisors.js'
import { FloorMap } from './components/FloorMap.jsx'
import { AdvisorSelectScreen } from './screens/AdvisorSelectScreen.jsx'
import { useGameStore } from './store/useGameStore.js'

const phaseLabelMap = {
  normal: '일반 운영',
  'mid-boss': '경고 이벤트',
  boss: '보스전',
  'black-swan': '블랙 스완',
}

function App() {
  const advisor = useGameStore((state) => state.advisor)
  const floor = useGameStore((state) => state.floor)
  const floorPhase = useGameStore((state) => state.floorPhase)
  const activeRivalEncounter = useGameStore((state) => state.activeRivalEncounter)
  const setFloor = useGameStore((state) => state.setFloor)
  const advanceFloor = useGameStore((state) => state.advanceFloor)
  const resetRunState = useGameStore((state) => state.resetRunState)

  const advisorDefinition = ADVISORS[advisor] ?? ADVISORS.analyst

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">CapiRogue</p>
          <h1 className="app-title">층 진행 기초 프로토타입</h1>
          <p className="app-copy">
            조언자 정의, 층 마일스톤, Zustand 상태, 선택 UI, 진행 맵을 한글 기준으로
            연결한 첫 번째 기반 화면입니다.
          </p>
        </div>
        <div className="app-status">
          <span className="phase-pill phase-pill--blue">선택 조언자: {advisorDefinition.name}</span>
          <span
            className={[
              'phase-pill',
              floorPhase === 'boss'
                ? 'phase-pill--red'
                : floorPhase === 'mid-boss'
                  ? 'phase-pill--green'
                  : floorPhase === 'black-swan'
                    ? 'phase-pill--amber'
                    : 'phase-pill--blue',
            ].join(' ')}
          >
            현재 단계: {phaseLabelMap[floorPhase] ?? '일반 운영'}
          </span>
        </div>
      </header>

      <main className="app-grid">
        <AdvisorSelectScreen />
        <FloorMap />

        <section className="panel run-preview">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">상태 확인</p>
              <h2 className="panel-title">스토어 변화 테스트</h2>
              <p className="panel-copy">
                실제 게임 화면이 붙기 전, 현재 스토어와 마일스톤 연결이 올바른지
                빠르게 확인할 수 있는 점검 패널입니다.
              </p>
            </div>
          </div>

          <div className="run-preview__controls">
            <button
              type="button"
              className="app-button"
              onClick={() => setFloor(Math.max(1, floor - 1))}
            >
              이전 층
            </button>
            <button type="button" className="app-button app-button--primary" onClick={advanceFloor}>
              다음 층
            </button>
            <button type="button" className="app-button" onClick={resetRunState}>
              초기화
            </button>
          </div>

          <div className="run-preview__summary">
            <article className="summary-card">
              <span>현재 조언자</span>
              <strong>{advisorDefinition.name}</strong>
              <p>{advisorDefinition.passiveBonus}</p>
            </article>
            <article className="summary-card">
              <span>현재 층 상태</span>
              <strong>{floor}층 · {phaseLabelMap[floorPhase] ?? '일반 운영'}</strong>
              <p>{activeRivalEncounter ? activeRivalEncounter.condition : '일반 운영 층입니다.'}</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
