import './GameScreen.css'
import { AdvisorBubble } from '../components/AdvisorBubble.jsx'
import { BlackSwanModal } from '../components/BlackSwanModal.jsx'
import { EconBanner } from '../components/EconBanner.jsx'
import { EconomicWarBanner } from '../components/EconomicWarBanner.jsx'
import { EventCard } from '../components/EventCard.jsx'
import { FloorMap } from '../components/FloorMap.jsx'
import { OrderSelect } from '../components/OrderSelect.jsx'
import { SettlementModal } from '../components/SettlementModal.jsx'
import { SidePanel } from '../components/SidePanel.jsx'
import { StatusStrip } from '../components/StatusStrip.jsx'
import { StrategySelect } from '../components/StrategySelect.jsx'
import { ToastCenter } from '../components/ToastCenter.jsx'
import { ShopScreen } from './ShopScreen.jsx'

export function GameScreen() {
  return (
    <div className="cr2-game-screen">
      <ToastCenter />
      <FloorMap />
      <StatusStrip />
      <EconomicWarBanner />

      <div className="cr2-game-screen__body">
        <main className="cr2-game-screen__main">
          <EconBanner />
          <AdvisorBubble />
          <StrategySelect />
          <OrderSelect />
          <EventCard />
        </main>

        <SidePanel />
      </div>

      <SettlementModal />
      <ShopScreen />
      <BlackSwanModal />
    </div>
  )
}
