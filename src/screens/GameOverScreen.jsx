import './GameOverScreen.css'
import { useGameStore } from '../store/useGameStore.js'

function getResultTitle(status) {
  if (status === 'clear') {
    return '🏆 클리어'
  }
  if (status === 'hostile') {
    return '🦅 적대적 인수'
  }
  return '💀 파산'
}

export function GameOverScreen() {
  const gameStatus = useGameStore((state) => state.gameStatus)
  const floor = useGameStore((state) => state.floor)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const cumulativeProfit = useGameStore((state) => state.cumulativeProfit)
  const warWinCount = useGameStore((state) => state.warWinCount)
  const decisionLog = useGameStore((state) => state.decisionLog)
  const legacyCards = useGameStore((state) => state.legacyCards)
  const restartGame = useGameStore((state) => state.restartGame)
  const goToAdvisorSelect = useGameStore((state) => state.goToAdvisorSelect)

  const latestLegacy = legacyCards[legacyCards.length - 1]

  return (
    <main className="cr2-gameover-screen">
      <section className="cr2-gameover-screen__panel" data-type={gameStatus}>
        <header className="cr2-gameover-screen__hero">
          <h1>{getResultTitle(gameStatus)}</h1>
          <p>{floor}층에서 이번 런이 마무리되었습니다.</p>
        </header>

        <div className="cr2-gameover-screen__stats">
          <div>
            <span>최종 순자산</span>
            <strong>{Math.round(capital - debt).toLocaleString()}원</strong>
          </div>
          <div>
            <span>도달 층수</span>
            <strong>{floor}층</strong>
          </div>
          <div>
            <span>경제전쟁 승리</span>
            <strong>{warWinCount}회</strong>
          </div>
          <div>
            <span>누적 순이익</span>
            <strong>{Math.round(cumulativeProfit).toLocaleString()}원</strong>
          </div>
        </div>

        <section className="cr2-gameover-screen__timeline">
          <h2>이번 판의 전환점</h2>
          <div className="cr2-gameover-screen__timeline-list">
            {decisionLog.slice(0, 5).map((entry) => (
              <article key={`${entry.floor}-${entry.strategyId}`} data-positive={entry.netProfit >= 0}>
                <strong>[{entry.floor}층]</strong>
                <span>{entry.strategyId}</span>
                <span>{entry.netProfit >= 0 ? '+' : ''}{Math.round(entry.netProfit).toLocaleString()}원</span>
                {entry.educationHint && <small>{entry.educationHint}</small>}
              </article>
            ))}
          </div>
        </section>

        <section className="cr2-gameover-screen__legacy">
          <h2>유산 카드 획득</h2>
          <p>{latestLegacy ? `${latestLegacy.name} · ${latestLegacy.description}` : '새로 획득한 유산 카드가 없습니다.'}</p>
        </section>

        <section className="cr2-gameover-screen__grades">
          <h2>클리어 등급</h2>
          <p>C: 생존 / B: 전쟁 3승 / A: 순자산 1억 / S: 전쟁 전승 + 3억</p>
        </section>

        <div className="cr2-gameover-screen__actions">
          <button type="button" onClick={restartGame}>
            다시 시작
          </button>
          <button type="button" onClick={goToAdvisorSelect}>
            어드바이저 변경
          </button>
        </div>
      </section>
    </main>
  )
}
