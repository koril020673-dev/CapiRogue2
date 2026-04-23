import './GameScreen.css'
import { AdvisorBubble } from '../components/AdvisorBubble.jsx'
import { EconBanner } from '../components/EconBanner.jsx'
import { FloorMap } from '../components/FloorMap.jsx'
import { SettlementModal } from '../components/SettlementModal.jsx'
import { StatusStrip } from '../components/StatusStrip.jsx'
import { StrategySelect } from '../components/StrategySelect.jsx'
import { ToastCenter } from '../components/ToastCenter.jsx'
import { AdminConsole } from '../components/AdminConsole.jsx'
import { useGameStore } from '../store/useGameStore.js'
import { CompanyStatusScreen } from './CompanyStatusScreen.jsx'
import { EventScreen } from './EventScreen.jsx'
import { MarketStatusScreen } from './MarketStatusScreen.jsx'
import { ShopScreen } from './ShopScreen.jsx'
import { StrategyConfirmScreen } from './StrategyConfirmScreen.jsx'

function StrategyStageScreen() {
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)

  return (
    <section className="cr2-game-stage cr2-game__panel">
      <div className="cr2-game-stage__hero">
        <EconBanner />
        <AdvisorBubble />
      </div>

      <div className="cr2-game-stage__body">
        <div className="cr2-game-stage__stack">
          <StrategySelect />
        </div>

        <aside className="cr2-game-stage__aside">
          <section className="cr2-game-stage__card">
            <p className="cr2-game-stage__eyebrow">Stage Guide</p>
            <h3>전략을 고른 뒤 발주를 확정합니다</h3>
            <p>
              이번 달 이벤트는 이미 반영됐습니다. 지금은 전략을 고르고 다음 단계에서
              발주량을 확정하면 됩니다.
            </p>
          </section>

          <section className="cr2-game-stage__card">
            <p className="cr2-game-stage__eyebrow">Current Pick</p>
            <h3>{selectedStrategyId ? '전략 선택 완료' : '전략 미선택'}</h3>
            <p>
              {selectedStrategyId
                ? '다음 단계에서 발주량과 예상 결과를 확인해 주세요.'
                : '먼저 네 가지 전략 중 하나를 선택해 주세요.'}
            </p>
          </section>
        </aside>
      </div>
    </section>
  )
}

export function GameScreen() {
  const floorStage = useGameStore((state) => state.floorStage)

  const stages = {
    market: <MarketStatusScreen />,
    company: <CompanyStatusScreen />,
    event: <EventScreen />,
    strategy: <StrategyStageScreen />,
    confirm: <StrategyConfirmScreen />,
    settlement: <SettlementModal />,
    shop: <ShopScreen />,
  }

  return (
    <div className="cr2-game">
      <ToastCenter />
      <FloorMap />
      <StatusStrip />

      <div className="cr2-game__body">{stages[floorStage] ?? <MarketStatusScreen />}</div>

      <AdminConsole />
    </div>
  )
}
