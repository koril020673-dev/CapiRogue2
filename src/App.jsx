import { AdvisorSelectScreen } from './screens/AdvisorSelectScreen.jsx'
import { DifficultyScreen } from './screens/DifficultyScreen.jsx'
import { GameOverScreen } from './screens/GameOverScreen.jsx'
import { GameScreen } from './screens/GameScreen.jsx'
import { useGameStore } from './store/useGameStore.js'

function App() {
  const advisor = useGameStore((state) => state.advisor)
  const difficulty = useGameStore((state) => state.difficulty)
  const gameStatus = useGameStore((state) => state.gameStatus)

  if (!advisor) {
    return <AdvisorSelectScreen />
  }

  if (!difficulty) {
    return <DifficultyScreen />
  }

  if (gameStatus === 'playing') {
    return <GameScreen />
  }

  if (gameStatus === 'clear' || gameStatus === 'bankrupt' || gameStatus === 'hostile') {
    return <GameOverScreen />
  }

  return <GameScreen />
}

export default App
