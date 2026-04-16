import {
  FLOOR_MARKERS,
  getFloorMilestone,
} from '../constants/floorMilestones.js'
import { useGameStore } from '../store/useGameStore.js'

const phaseClassMap = {
  normal: 'phase-pill--blue',
  'mid-boss': 'phase-pill--green',
  boss: 'phase-pill--red',
  'black-swan': 'phase-pill--amber',
}

const phaseLabelMap = {
  normal: '일반 운영',
  'mid-boss': '경고 이벤트',
  boss: '보스전',
  'black-swan': '블랙 스완',
}

export function FloorMap() {
  const floor = useGameStore((state) => state.floor)
  const floorPhase = useGameStore((state) => state.floorPhase)
  const currentMilestone = getFloorMilestone(floor)

  return (
    <section className="floor-map panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">층 경로</p>
          <h2 className="panel-title">120층 사업 던전 진행도</h2>
          <p className="panel-copy">
            10층마다 경고 이벤트, 20층마다 보스전이 발생합니다. 80층 이후부터는
            블랙 스완 위협이 겹칩니다.
          </p>
        </div>
        <div className={['phase-pill', phaseClassMap[floorPhase] ?? 'phase-pill--blue'].join(' ')}>
          현재 단계: {phaseLabelMap[floorPhase] ?? '일반 운영'}
        </div>
      </div>

      <div className="floor-map__track">
        <div
          className="floor-map__progress"
          style={{ width: `${Math.max((floor / 120) * 100, 2)}%` }}
        />
        <div className="floor-map__markers">
          {FLOOR_MARKERS.map((marker) => {
            const stateClass =
              floor > marker.floor
                ? 'floor-map__marker--cleared'
                : floor === marker.floor
                  ? 'floor-map__marker--current'
                  : ''
            const typeClass =
              marker.markerType === 'boss' || marker.markerType === 'final-boss'
                ? 'floor-map__marker--boss'
                : 'floor-map__marker--mid'

            return (
              <div
                key={marker.floor}
                className={['floor-map__marker', stateClass, typeClass]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="floor-map__dot" />
                <span className="floor-map__label">{marker.shortLabel}</span>
              </div>
            )
          })}
          <div
            className="floor-map__current-indicator"
            style={{ left: `calc(${Math.max((floor / 120) * 100, 2)}% - 22px)` }}
          >
            <span className="floor-map__current-value">{floor}층</span>
          </div>
        </div>
      </div>

      {currentMilestone ? (
        <article className="floor-map__milestone-card">
          <p className="panel-kicker">{currentMilestone.shortLabel}</p>
          <h3>{currentMilestone.title}</h3>
          <p>{currentMilestone.description}</p>
        </article>
      ) : (
        <article className="floor-map__milestone-card">
          <p className="panel-kicker">일반 층</p>
          <h3>일반 운영 구간</h3>
          <p>이번 층은 고정 마일스톤이 없는 일반 운영 구간입니다.</p>
        </article>
      )}
    </section>
  )
}
