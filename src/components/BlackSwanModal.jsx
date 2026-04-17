import './BlackSwanModal.css'
import { useGameStore } from '../store/useGameStore.js'

export function BlackSwanModal() {
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const blackSwanSeen = useGameStore((state) => state.blackSwanSeen)
  const floor = useGameStore((state) => state.floor)
  const acknowledgeBlackSwan = useGameStore((state) => state.acknowledgeBlackSwan)

  if (!activeBlackSwan || blackSwanSeen) {
    return null
  }

  return (
    <div className="cr2-swan-overlay">
      <div className="cr2-swan-modal">
        <div className="cr2-swan-modal__head">
          <span className="cr2-swan-modal__eyebrow">⚠ 블랙스완 발동</span>
          <span>Floor {floor}</span>
        </div>
        <h2>{activeBlackSwan.name}</h2>
        <p>{activeBlackSwan.hint}</p>
        <button type="button" className="cr2-swan-modal__btn" onClick={acknowledgeBlackSwan}>
          대응한다
        </button>
      </div>
    </div>
  )
}
