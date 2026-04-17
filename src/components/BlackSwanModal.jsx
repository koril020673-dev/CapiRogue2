import './BlackSwanModal.css'
import { useGameStore } from '../store/useGameStore.js'

export function BlackSwanModal() {
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const blackSwanSeen = useGameStore((state) => state.blackSwanSeen)
  const acknowledgeBlackSwan = useGameStore((state) => state.acknowledgeBlackSwan)

  if (!activeBlackSwan || blackSwanSeen) {
    return null
  }

  return (
    <div className="cr2-swan-overlay">
      <div className="cr2-swan-modal">
        <p className="cr2-swan-modal__eyebrow">Black Swan</p>
        <h2>{activeBlackSwan.name}</h2>
        <p>{activeBlackSwan.hint}</p>
        <button type="button" className="cr2-swan-modal__btn" onClick={acknowledgeBlackSwan}>
          대응한다
        </button>
      </div>
    </div>
  )
}
