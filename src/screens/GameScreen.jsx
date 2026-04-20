import './GameScreen.css'
import auraLogo from '../../RivalRogoImages/aura.png'
import megaflexLogo from '../../RivalRogoImages/megaflex.png'
import memecatchLogo from '../../RivalRogoImages/mimCatch.png'
import nexuscoreLogo from '../../RivalRogoImages/nexuscore.png'
import { AdminConsole } from '../components/AdminConsole.jsx'
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
import { useGameStore } from '../store/useGameStore.js'
import { ShopScreen } from './ShopScreen.jsx'

const RIVAL_LOGOS = {
  megaflex: megaflexLogo,
  aura: auraLogo,
  memecatch: memecatchLogo,
  nexuscore: nexuscoreLogo,
}

const RIVAL_META = {
  megaflex: { name: '메가플렉스', stance: '저가 압박', accent: '#FF8A65' },
  aura: { name: '아우라', stance: '프리미엄 유지', accent: '#F6C453' },
  memecatch: { name: '밈캐치', stance: '바이럴 확산', accent: '#7FE6C5' },
  nexuscore: { name: '넥서스코어', stance: '기술 우위', accent: '#8AB4FF' },
}

const STRATEGY_ACTIONS = {
  volume: { title: '물량 공세 전개', detail: '가격 압박 라인이 전장에 펼쳐집니다.' },
  quality: { title: '프리미엄 포지션 강화', detail: '품질 중심 전개로 가격 경쟁을 피합니다.' },
  marketing: { title: '수요 자극 캠페인', detail: '시장에 신호를 뿌려 관심을 끌어옵니다.' },
  safe: { title: '방어 운영 태세', detail: '현금과 체력을 지키는 운영 모드입니다.' },
}

const ORDER_ACTIONS = {
  conservative: { title: '보수적 발주', detail: '재고 리스크를 낮춘 안정적인 주문입니다.' },
  standard: { title: '기본 발주', detail: '표준 수요를 기준으로 균형 있게 갑니다.' },
  aggressive: { title: '공격적 발주', detail: '점유율을 위해 선결제 규모를 키웁니다.' },
}

function formatCurrency(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function getActiveRivalIds(rivals) {
  return Object.entries(rivals ?? {})
    .filter(([, rival]) => rival?.active && !rival?.eliminated)
    .sort(([, left], [, right]) => Number(right?.marketShare ?? 0) - Number(left?.marketShare ?? 0))
    .map(([rivalId]) => rivalId)
}

function getPrimaryRivalId(activeRivalIds, activeEconomicWar) {
  const warTarget = activeEconomicWar?.rivalIds?.find((rivalId) => activeRivalIds.includes(rivalId))
  return warTarget ?? activeRivalIds[0] ?? 'megaflex'
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

function getActionFeed({ selectedStrategyId, selectedOrderTier, currentEventResolved }) {
  const items = []

  if (selectedStrategyId) {
    items.push({
      kind: 'strategy',
      title: STRATEGY_ACTIONS[selectedStrategyId]?.title ?? '전략 선택 완료',
      detail: STRATEGY_ACTIONS[selectedStrategyId]?.detail ?? '전략 지시가 입력됐습니다.',
    })
  }

  if (selectedOrderTier) {
    items.push({
      kind: 'order',
      title: ORDER_ACTIONS[selectedOrderTier]?.title ?? '발주 확정',
      detail: ORDER_ACTIONS[selectedOrderTier]?.detail ?? '발주 강도가 입력됐습니다.',
    })
  }

  if (currentEventResolved) {
    items.push({
      kind: 'event',
      title: '결재 승인 완료',
      detail: '현장 대응이 끝났습니다. 정산 결과를 준비합니다.',
    })
  }

  return items
}

export function GameScreen() {
  const floor = useGameStore((state) => state.floor)
  const econPhase = useGameStore((state) => state.econPhase)
  const capital = useGameStore((state) => state.capital)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const selectedStrategyId = useGameStore((state) => state.selectedStrategyId)
  const selectedOrderTier = useGameStore((state) => state.selectedOrderTier)
  const currentEventResolved = useGameStore((state) => state.currentEventResolved)
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const rivals = useGameStore((state) => state.rivals)
  const lastSettlement = useGameStore((state) => state.lastSettlement)

  const activeRivalIds = getActiveRivalIds(rivals)
  const currentRivalId = getPrimaryRivalId(activeRivalIds, activeEconomicWar)
  const currentRival = rivals?.[currentRivalId]
  const supportRivalIds = activeRivalIds.filter((rivalId) => rivalId !== currentRivalId).slice(0, 3)
  const prompt = getPrompt({
    selectedStrategyId,
    selectedOrderTier,
    currentEventResolved,
  })
  const actionFeed = getActionFeed({
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
            data-strategy={selectedStrategyId ?? 'idle'}
            data-order={selectedOrderTier ?? 'idle'}
          >
            <div className="cr2-game-screen__arena-overlay">
              <EconBanner />
              <AdvisorBubble />
            </div>

            <div className="cr2-game-screen__arena-hud cr2-game-screen__arena-hud--enemy">
              <div className="cr2-game-screen__hud-topline">
                <span className="cr2-game-screen__hud-label">경쟁사 전선</span>
                <span className="cr2-game-screen__hud-floor">FLOOR {floor}</span>
              </div>
              <strong>{RIVAL_META[currentRivalId]?.name ?? '시장 경쟁자'}</strong>
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
                <span className="cr2-game-screen__hud-floor">
                  체력 {companyHealth}/{maxHealth}
                </span>
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

            <div className="cr2-game-screen__support-rivals">
              {supportRivalIds.map((rivalId) => {
                const rival = rivals[rivalId]
                return (
                  <div
                    key={rivalId}
                    className="cr2-game-screen__support-rival"
                    style={{ '--cr2-rival-accent': RIVAL_META[rivalId]?.accent ?? 'var(--cr2-neutral)' }}
                  >
                    <img src={RIVAL_LOGOS[rivalId]} alt={`${RIVAL_META[rivalId]?.name ?? rivalId} 로고`} />
                    <div>
                      <strong>{RIVAL_META[rivalId]?.name ?? rivalId}</strong>
                      <span>{Number(rival?.marketShare ?? 0).toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="cr2-game-screen__sprite cr2-game-screen__sprite--enemy">
              <div className="cr2-game-screen__sprite-shadow" />
              <div className="cr2-game-screen__sprite-badge" data-rival={currentRivalId}>
                <img
                  src={RIVAL_LOGOS[currentRivalId]}
                  alt={`${RIVAL_META[currentRivalId]?.name ?? '경쟁사'} 로고`}
                />
              </div>
              <div className="cr2-game-screen__sprite-caption">
                <strong>{RIVAL_META[currentRivalId]?.stance ?? '시장 교전'}</strong>
                <span>{activeRivalIds.length}개 경쟁사가 전장에 남아 있습니다.</span>
              </div>
            </div>

            <div className="cr2-game-screen__sprite cr2-game-screen__sprite--player">
              <div className="cr2-game-screen__sprite-shadow" />
              <div className="cr2-game-screen__player-emblem">
                <span className="cr2-game-screen__player-emblem-mark">HQ</span>
                <span className="cr2-game-screen__player-emblem-copy">MARKET RUN</span>
              </div>
            </div>

          </section>

          <section className="cr2-game-screen__command-zone">
            <div className="cr2-game-screen__prompt-box">
              <p className="cr2-game-screen__prompt-eyebrow">지휘 패널</p>
              <h2>{prompt}</h2>
              <div className="cr2-game-screen__prompt-tags">
                <span data-ready={Boolean(selectedStrategyId)}>
                  전략: {selectedStrategyId ? STRATEGY_ACTIONS[selectedStrategyId]?.title : '미선택'}
                </span>
                <span data-ready={Boolean(selectedOrderTier)}>
                  발주: {selectedOrderTier ? ORDER_ACTIONS[selectedOrderTier]?.title : '미선택'}
                </span>
                <span data-ready={currentEventResolved}>
                  결재: {currentEventResolved ? '확정 완료' : '선택 대기'}
                </span>
              </div>

              <div className="cr2-game-screen__action-feed">
                {actionFeed.length > 0 ? (
                  actionFeed.map((item) => (
                    <div key={item.title} className="cr2-game-screen__action-item" data-kind={item.kind}>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                  ))
                ) : (
                  <div className="cr2-game-screen__action-item" data-kind="idle">
                    <strong>대기 중</strong>
                    <span>첫 명령이 내려지면 전장 연출과 정보가 함께 반응합니다.</span>
                  </div>
                )}
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
      <AdminConsole />
    </div>
  )
}
