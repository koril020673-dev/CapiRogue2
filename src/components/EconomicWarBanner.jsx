import './EconomicWarBanner.css'
import { useGameStore } from '../store/useGameStore.js'

export function EconomicWarBanner() {
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const rivals = useGameStore((state) => state.rivals)

  if (!activeEconomicWar) {
    return null
  }

  return (
    <div className="cr2-war-banner" data-paused={Boolean(activeBlackSwan)}>
      <div className="cr2-war-banner__head">
        <strong>⚔️ 경제 전쟁 — {activeEconomicWar.name}</strong>
        <span>
          남은 기간:{' '}
          {activeEconomicWar.floorsLeft === 999 ? '최종전' : `${activeEconomicWar.floorsLeft}층`}
        </span>
      </div>
      <div className="cr2-war-banner__bars">
        {activeEconomicWar.rivalIds.map((rivalId) => {
          const rival = rivals[rivalId]
          const ratio = rival ? Math.max(0, Math.min(rival.capital / rival.initialCapital, 1)) : 0
          return (
            <div key={rivalId} className="cr2-war-banner__rival">
              <span>{rival?.name ?? rivalId}</span>
              <div className="cr2-war-banner__track">
                <span style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      {activeBlackSwan && <p className="cr2-war-banner__pause">블랙 스완으로 전쟁 효과가 일시 정지 중입니다.</p>}
    </div>
  )
}
