import './GameOverScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function GameOverScreen() {
  const gameStatus = useGameStore((state) => state.gameStatus)
  const floor = useGameStore((state) => state.floor)
  const cumulativeProfit = useGameStore((state) => state.cumulativeProfit)
  const decisionLog = useGameStore((state) => state.decisionLog)
  const restartGame = useGameStore((state) => state.restartGame)
  const goToAdvisorSelect = useGameStore((state) => state.goToAdvisorSelect)

  return (
    <div className="cr2-gameover-screen">
      <div className="cr2-gameover-screen__hero" data-type={gameStatus}>
        <h1>{gameStatus === 'clear' ? '🏆 클리어' : gameStatus === 'hostile' ? '🦅 적대적 인수' : '💀 파산'}</h1>
        <p>{floor}층 도달 · 누적 손익 {Math.round(cumulativeProfit).toLocaleString()}원</p>
      </div>
      <div className="cr2-gameover-screen__timeline">
        {decisionLog.slice(0, 5).map((entry) => (
          <article key={`${entry.floor}-${entry.strategyId}`} className="cr2-gameover-screen__item">
            <strong>{entry.floor}층</strong>
            <span>{entry.strategyId}</span>
            <span>{Math.round(entry.netProfit).toLocaleString()}원</span>
            {entry.educationHint && <small>{entry.educationHint}</small>}
          </article>
        ))}
      </div>
      <div className="cr2-gameover-screen__actions">
        <button type="button" onClick={restartGame}>
          다시 시작
        </button>
        <button type="button" onClick={goToAdvisorSelect}>
          어드바이저 변경
        </button>
      </div>
    </div>
  )
}
