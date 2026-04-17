import { AdvisorSelectScreen } from './screens/AdvisorSelectScreen.jsx'
import { GameOverScreen } from './screens/GameOverScreen.jsx'
import { GameScreen } from './screens/GameScreen.jsx'
import { HistoryScreen } from './screens/HistoryScreen.jsx'
import { SettingsScreen } from './screens/SettingsScreen.jsx'
import { TitleScreen } from './screens/TitleScreen.jsx'
import { useGameStore } from './store/useGameStore.js'

function App() {
  const screen = useGameStore((state) => state.screen)
  const gameStatus = useGameStore((state) => state.gameStatus)

  if (screen === 'title') {
    return <TitleScreen />
  }

  if (screen === 'history') {
    return <HistoryScreen />
  }

  if (screen === 'settings') {
    return <SettingsScreen />
  }

  if (screen === 'advisor') {
    return <AdvisorSelectScreen />
  }

  if (screen === 'gameover' || gameStatus === 'clear' || gameStatus === 'bankrupt' || gameStatus === 'hostile') {
    return <GameOverScreen />
  }

  return <GameScreen />
}

export default App
