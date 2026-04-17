import './HistoryScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function HistoryScreen() {
  const playHistory = useGameStore((state) => state.playHistory)
  const backToTitle = useGameStore((state) => state.backToTitle)

  return (
    <main className="cr2-history-screen">
      <div className="cr2-history-screen__panel">
        <div className="cr2-history-screen__head">
          <div>
            <p className="cr2-history-screen__eyebrow">History</p>
            <h1>플레이 이력</h1>
          </div>
          <button type="button" onClick={backToTitle}>
            돌아가기
          </button>
        </div>

        <div className="cr2-history-screen__table">
          <div className="cr2-history-screen__row cr2-history-screen__row--head">
            <span>#</span>
            <span>어드바이저</span>
            <span>도달층</span>
            <span>결과</span>
            <span>순자산</span>
            <span>유산 카드</span>
          </div>
          {playHistory.length === 0 && (
            <div className="cr2-history-screen__empty">기록된 플레이 이력이 아직 없습니다.</div>
          )}
          {playHistory.map((entry, index) => (
            <div key={entry.id ?? `${entry.createdAt}-${index}`} className="cr2-history-screen__row">
              <span>{playHistory.length - index}</span>
              <span>{entry.advisorName ?? entry.advisor}</span>
              <span>{entry.floor}층</span>
              <span>{entry.result}</span>
              <span>{Math.round(entry.netWorth ?? 0).toLocaleString()}원</span>
              <span>{entry.legacyCard ?? '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
