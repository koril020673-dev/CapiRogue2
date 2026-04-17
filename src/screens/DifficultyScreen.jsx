import './DifficultyScreen.css'
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../constants/difficulties.js'
import { useGameStore } from '../store/useGameStore.js'

export function DifficultyScreen() {
  const advisor = useGameStore((state) => state.advisor)
  const difficultyDraft = useGameStore((state) => state.difficultyDraft)
  const setDifficultyDraft = useGameStore((state) => state.setDifficultyDraft)
  const startGame = useGameStore((state) => state.startGame)

  return (
    <div className="cr2-difficulty-screen">
      <div className="cr2-difficulty-screen__head">
        <p className="cr2-difficulty-screen__eyebrow">Difficulty</p>
        <h1>난이도를 선택하세요</h1>
        <span>선택한 어드바이저: {advisor}</span>
      </div>
      <div className="cr2-difficulty-screen__grid">
        {DIFFICULTY_ORDER.map((difficultyId) => {
          const difficulty = DIFFICULTIES[difficultyId]
          return (
            <button
              key={difficultyId}
              type="button"
              className="cr2-difficulty-screen__card"
              data-selected={difficultyDraft === difficultyId}
              onClick={() => setDifficultyDraft(difficultyId)}
            >
              <strong>
                {difficulty.icon} {difficulty.label}
              </strong>
              <span>{difficulty.description}</span>
              <small>
                자본 {difficulty.capital.toLocaleString()}원 · 금리 {(difficulty.interestRate * 100).toFixed(1)}%
              </small>
            </button>
          )
        })}
      </div>
      <button type="button" className="cr2-difficulty-screen__confirm" disabled={!difficultyDraft} onClick={startGame}>
        게임 시작 →
      </button>
    </div>
  )
}
