import './RewardScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function RewardScreen() {
  const rewardPending = useGameStore((state) => state.rewardPending)
  const settlementModalOpen = useGameStore((state) => state.settlementModalOpen)
  const rewardSelection = useGameStore((state) => state.rewardSelection)
  const selectReward = useGameStore((state) => state.selectReward)
  const claimReward = useGameStore((state) => state.claimReward)

  if (!rewardPending || settlementModalOpen) {
    return null
  }

  return (
    <div className="cr2-reward-screen">
      <div className="cr2-reward-screen__modal">
        <p className="cr2-reward-screen__eyebrow">Reward</p>
        <h2>{rewardPending.grade.toUpperCase()} 보상</h2>
        <p>기본 크레딧 +{rewardPending.credits}C</p>
        <div className="cr2-reward-screen__grid">
          {rewardPending.options.map((reward) => (
            <button
              key={reward.id}
              type="button"
              className="cr2-reward-screen__card"
              data-selected={rewardSelection === reward.id}
              onClick={() => selectReward(reward.id)}
            >
              <strong>{reward.label}</strong>
            </button>
          ))}
        </div>
        <button type="button" className="cr2-reward-screen__confirm" disabled={!rewardSelection} onClick={claimReward}>
          선택 완료 →
        </button>
      </div>
    </div>
  )
}
