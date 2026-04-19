import './GameScreen.css'
import auraLogo from '../../RivalRogoImages/aura.png'
import megaflexLogo from '../../RivalRogoImages/megaflex.png'
import memecatchLogo from '../../RivalRogoImages/mimCatch.png'
import nexuscoreLogo from '../../RivalRogoImages/nexuscore.png'
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
import { getEventCardById } from '../constants/docEvents.js'
import { useGameStore } from '../store/useGameStore.js'
import { ShopScreen } from './ShopScreen.jsx'

const RIVAL_LOGOS = {
  megaflex: megaflexLogo,
  aura: auraLogo,
  memecatch: memecatchLogo,
  nexuscore: nexuscoreLogo,
}

const RIVAL_NAMES = {
  megaflex: '메가플렉스',
  aura: '아우라',
  memecatch: '밈캐치',
  nexuscore: '넥서스코어',
}

const STRATEGY_NAMES = {
  volume: '물량 공세',
  quality: '품질 차별화',
  marketing: '마케팅 집중',
  safe: '안전 경영',
}

const ORDER_NAMES = {
  conservative: '보수적 발주',
  standard: '기본 발주',
  aggressive: '공격적 발주',
}

function formatCurrency(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function getCurrentRivalId(rivals, activeEconomicWar) {
  const warTarget = activeEconomicWar?.rivalIds?.find((rivalId) => rivals?.[rivalId]?.active)
  if (warTarget) {
    return warTarget
  }

  const activeEntries = Object.entries(rivals ?? {})
    .filter(([, rival]) => rival?.active && !rival?.eliminated)
    .sort(([, left], [, right]) => Number(right?.marketShare ?? 0) - Number(left?.marketShare ?? 0))

  return activeEntries[0]?.[0] ?? 'megaflex'
}

function getPrompt({ selectedStrategyId, selectedOrderTier, currentEventResolved }) {
  if (!selectedStrategyId) {
    return '이번 달 전략 명령을 선택하세요.'
  }
  if (!selectedOrderTier) {
    return '발주 강도를 정하고 선결제 규모를 확정하세요.'
  }
  if (!currentEventResolved) {
    return '이번 결재 카드에 대응할 결정을 내려주세요.'
  }
  return '명령이 모두 입력됐습니다. 정산이 자동으로 진행됩니다.'
}

export function GameScreen() {
  const floor = useGameStore((state) => state.floor)
  const econPhase = useGameStore((state) => state.econPhase)
  const capital = useGameStore((state) => state.capital)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const currentEventCardId = useGameStore((state) => state.currentEventCardId)
  const currentEventResolved = useGameStore((state) => state.currentEventResolved)
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const rivals = useGameStore((state) => state.rivals)
  const lastSettlement = useGameStore((state) => state.lastSettlement)

  const currentRivalId = getCurrentRivalId(rivals, activeEconomicWar)
  const currentRival = rivals?.[currentRivalId]
  const currentEvent = getEventCardById(currentEventCardId)
  const prompt = getPrompt({
    selectedStrategyId,
    selectedOrderTier,
    currentEventResolved,
  })
  const rivalRatio = currentRival
    ? Math.max(0, Math.min(currentRival.capital / Math.max(currentRival.initialCapital, 1), 1))
    : 0
  const myShare = Number(lastSettlement?.myShare ?? 0) * 100
  const rivalShare = Number(currentRival?.marketShare ?? 0)

  return (
    <div className="cr2-game-screen" data-phase={econPhase}>
      <ToastCenter />
      <FloorMap />
      <StatusStrip />
      <EconomicWarBanner />

      <div className="cr2-game-screen__body">
        <main className="cr2-game-screen__main">
          <section
            className="cr2-game-screen__arena"
            data-war={Boolean(activeEconomicWar)}
            data-swan={Boolean(activeBlackSwan)}
          >
            <div className="cr2-game-screen__arena-backdrop" />
            <div className="cr2-game-screen__arena-scanlines" />

            <div className="cr2-game-screen__arena-overlay">
              <EconBanner />
              <AdvisorBubble />
            </div>

            <div className="cr2-game-screen__arena-hud cr2-game-screen__arena-hud--enemy">
              <div className="cr2-game-screen__hud-topline">
                <span className="cr2-game-screen__hud-label">경쟁사</span>
                <span className="cr2-game-screen__hud-floor">FLOOR {floor}</span>
              </div>
              <strong>{RIVAL_NAMES[currentRivalId] ?? '시장 경쟁자'}</strong>
              <div className="cr2-game-screen__hud-bar">
                <span style={{ width: `${rivalRatio * 100}%` }} />
              </div>
              <div className="cr2-game-screen__hud-meta">
                <span>가격 {formatCurrency(currentRival?.currentPrice ?? 0)}</span>
                <span>점유율 {rivalShare.toFixed(1)}%</span>
              </div>
            </div>

            <div className="cr2-game-screen__arena-hud cr2-game-screen__arena-hud--player">
              <div className="cr2-game-screen__hud-topline">
                <span className="cr2-game-screen__hud-label">내 회사</span>
                <span className="cr2-game-screen__hud-floor">체력 {companyHealth}/{maxHealth}</span>
              </div>
              <strong>CapiRogue HQ</strong>
              <div className="cr2-game-screen__hud-bar cr2-game-screen__hud-bar--player">
                <span style={{ width: `${(companyHealth / Math.max(maxHealth, 1)) * 100}%` }} />
              </div>
              <div className="cr2-game-screen__hud-meta">
                <span>현금 {formatCurrency(capital)}</span>
                <span>점유율 {myShare.toFixed(1)}%</span>
              </div>
            </div>

            <div className="cr2-game-screen__sprite cr2-game-screen__sprite--enemy">
              <div className="cr2-game-screen__sprite-shadow" />
              <div className="cr2-game-screen__sprite-badge" data-rival={currentRivalId}>
                <img
                  src={RIVAL_LOGOS[currentRivalId]}
                  alt={`${RIVAL_NAMES[currentRivalId] ?? '경쟁사'} 로고`}
                />
              </div>
            </div>

            <div className="cr2-game-screen__sprite cr2-game-screen__sprite--player">
              <div className="cr2-game-screen__sprite-shadow" />
              <div className="cr2-game-screen__player-emblem">
                <span className="cr2-game-screen__player-emblem-mark">HQ</span>
                <span className="cr2-game-screen__player-emblem-copy">MARKET RUN</span>
              </div>
            </div>

            <div className="cr2-game-screen__stage">
              <span className="cr2-game-screen__stage-ring cr2-game-screen__stage-ring--enemy" />
              <span className="cr2-game-screen__stage-ring cr2-game-screen__stage-ring--player" />
            </div>
          </section>

          <section className="cr2-game-screen__command-zone">
            <div className="cr2-game-screen__prompt-box">
              <p className="cr2-game-screen__prompt-eyebrow">지휘 패널</p>
              <h2>{prompt}</h2>
              <div className="cr2-game-screen__prompt-tags">
                <span data-ready={Boolean(selectedStrategyId)}>
                  전략: {selectedStrategyId ? STRATEGY_NAMES[selectedStrategyId] : '미선택'}
                </span>
                <span data-ready={Boolean(selectedOrderTier)}>
                  발주: {selectedOrderTier ? ORDER_NAMES[selectedOrderTier] : '미선택'}
                </span>
                <span data-ready={currentEventResolved}>
                  결재: {currentEventResolved ? '확정 완료' : '선택 대기'}
                </span>
              </div>
            </div>

            <div className="cr2-game-screen__command-stack">
              <StrategySelect />
              <OrderSelect />
              <EventCard />
            </div>
          </section>
        </main>

        <SidePanel />
      </div>

      <SettlementModal />
      <ShopScreen />
      <BlackSwanModal />
    </div>
  )
}
