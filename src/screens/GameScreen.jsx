import './GameScreen.css'
import { AdvisorBubble } from '../components/AdvisorBubble.jsx'
import { BlackSwanModal } from '../components/BlackSwanModal.jsx'
import { CreditShop } from '../components/CreditShop.jsx'
import { EconBanner } from '../components/EconBanner.jsx'
import { EconomicWarBanner } from '../components/EconomicWarBanner.jsx'
import { EventCard } from '../components/EventCard.jsx'
import { FloorMap } from '../components/FloorMap.jsx'
import { RivalPanel } from '../components/RivalPanel.jsx'
import { SettlementModal } from '../components/SettlementModal.jsx'
import { StatusBar } from '../components/StatusBar.jsx'
import { StrategySelect } from '../components/StrategySelect.jsx'
import { ToastCenter } from '../components/ToastCenter.jsx'
import { RewardScreen } from './RewardScreen.jsx'

export function GameScreen() {
  return (
    <div className="cr2-game-screen">
      <ToastCenter />
      <FloorMap />
      <StatusBar />
      <EconomicWarBanner />
      <div className="cr2-game-screen__body">
        <main className="cr2-game-screen__main">
          <EconBanner />
          <AdvisorBubble />
          <StrategySelect />
          <EventCard />
        </main>
        <aside className="cr2-game-screen__side">
          <RivalPanel />
          <CreditShop />
        </aside>
      </div>

      <SettlementModal />
      <RewardScreen />
      <BlackSwanModal />
    </div>
  )
}
