import './TitleScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function TitleScreen() {
  const saveExists = useGameStore((state) => state.saveExists)
  const continueRun = useGameStore((state) => state.continueRun)
  const startNewGame = useGameStore((state) => state.startNewGame)
  const openHistoryScreen = useGameStore((state) => state.openHistoryScreen)
  const openSettingsScreen = useGameStore((state) => state.openSettingsScreen)

  return (
    <main className="cr2-title-screen">
      <div className="cr2-title-screen__panel">
        <div className="cr2-title-screen__hero">
          <p className="cr2-title-screen__eyebrow">Economic Survival Roguelike</p>
          <h1>CapiRogue 2</h1>
          <p>경제 생존 로그라이크</p>
        </div>

        <div className="cr2-title-screen__menu">
          <button type="button" disabled={!saveExists} onClick={continueRun}>
            계속하기
          </button>
          <button type="button" onClick={startNewGame}>
            새 게임
          </button>
          <button type="button" onClick={openHistoryScreen}>
            플레이 이력
          </button>
          <button type="button" onClick={openSettingsScreen}>
            설정
          </button>
        </div>
      </div>
    </main>
  )
}
