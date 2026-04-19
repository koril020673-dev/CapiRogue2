import './EconomicWarBanner.css'
import { useGameStore } from '../store/useGameStore.js'

const WAR_NAMES = {
  'war-20': '원가 덤핑 공세',
  'war-40': '프리미엄 브랜드 독점',
  'war-60': '바이럴 마케팅 폭격',
  'war-80': '원유가 폭등',
  'war-100': '기술 특허 장벽',
  'war-120': '최후의 시장 쟁탈전',
}

const RIVAL_NAMES = {
  megaflex: '메가플렉스',
  aura: '아우라',
  memecatch: '밈캐치',
  nexuscore: '넥서스코어',
}

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
        <strong>경제 전쟁 · {WAR_NAMES[activeEconomicWar.warId] ?? activeEconomicWar.name}</strong>
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
              <span>{RIVAL_NAMES[rivalId] ?? rival?.name ?? rivalId}</span>
              <div className="cr2-war-banner__track">
                <span style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {activeBlackSwan && (
        <p className="cr2-war-banner__pause">
          블랙스완 영향으로 경제 전쟁 효과가 잠시 중단되어 있습니다.
        </p>
      )}
    </div>
  )
}
