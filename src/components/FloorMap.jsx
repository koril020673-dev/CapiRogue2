import './FloorMap.css'
import { ECONOMIC_WARS } from '../constants/economicWars.js'
import { useGameStore } from '../store/useGameStore.js'

export function FloorMap() {
  const floor = useGameStore((state) => state.floor)
  const maxFloors = useGameStore((state) => state.maxFloors)
  const markers = Object.keys(ECONOMIC_WARS).map((value) => Number(value))
  const progress = Math.min((floor / maxFloors) * 100, 100)

  return (
    <div className="cr2-floormap">
      <span className="cr2-floormap__label">CapiRogue2</span>
      <div className="cr2-floormap__track">
        <div className="cr2-floormap__fill" style={{ width: `${progress}%` }} />
        <div className="cr2-floormap__cursor" style={{ left: `${progress}%` }} />
        {markers.map((marker) => (
          <div
            key={marker}
            className="cr2-floormap__marker"
            data-war={marker % 20 === 0}
            style={{ left: `${(marker / maxFloors) * 100}%` }}
            title={`Floor ${marker}`}
          />
        ))}
      </div>
      <span className="cr2-floormap__counter">
        {floor} / {maxFloors}층
      </span>
    </div>
  )
}
