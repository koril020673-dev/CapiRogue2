import './GameScreen.css'
import { FloorMap } from '../components/FloorMap.jsx'
import { SettlementModal } from '../components/SettlementModal.jsx'
import { StatusStrip } from '../components/StatusStrip.jsx'
import { ToastCenter } from '../components/ToastCenter.jsx'
import { AdminConsole } from '../components/AdminConsole.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { ShopScreen } from './ShopScreen.jsx'
import { TurnPlanningScreen } from './TurnPlanningScreen.jsx'

const PLANNING_STAGES = new Set(['market', 'company', 'event', 'strategy', 'confirm'])

export function GameScreen() {
  const floorStage = useGameStore((state) => state.floorStage)

  const stages = {
    settlement: <SettlementModal />,
    shop: <ShopScreen />,
  }

  const currentStage = PLANNING_STAGES.has(floorStage)
    ? <TurnPlanningScreen />
    : stages[floorStage] ?? <TurnPlanningScreen />

  return (
    <div className="cr2-game">
      <ToastCenter />
      <FloorMap />
      <StatusStrip />

      <div className="cr2-game__body">
        {currentStage}
      </div>

      <AdminConsole />
    </div>
  )
}
