import { useState } from 'react'
import './AdminConsole.css'
import { useGameStore } from '../store/useGameStore.js'

export function AdminConsole() {
  const isAdmin = useGameStore((state) => state.auth?.isAdmin)
  const floor = useGameStore((state) => state.floor)
  const adminJumpToFloor = useGameStore((state) => state.adminJumpToFloor)
  const adminGrantCapital = useGameStore((state) => state.adminGrantCapital)
  const adminGrantCredits = useGameStore((state) => state.adminGrantCredits)
  const adminHealCompany = useGameStore((state) => state.adminHealCompany)
  const goToAdvisorSelect = useGameStore((state) => state.goToAdvisorSelect)
  const [targetFloor, setTargetFloor] = useState(String(floor))

  if (!isAdmin) {
    return null
  }

  return (
    <aside className="cr2-admin-console">
      <div className="cr2-admin-console__head">
        <div>
          <p className="cr2-admin-console__eyebrow">Admin Sandbox</p>
          <h3>테스트 제어판</h3>
        </div>
        <span className="cr2-admin-console__badge">ADMIN</span>
      </div>

      <p className="cr2-admin-console__copy">
        관리자 로그인 상태에서는 모든 어드바이저가 즉시 선택 가능하며, 아래 기능으로 원하는 구간을 바로 시험할 수 있습니다.
      </p>

      <label className="cr2-admin-console__field">
        <span>이동할 층</span>
        <div className="cr2-admin-console__row">
          <input
            type="number"
            min="1"
            max="120"
            value={targetFloor}
            onChange={(event) => setTargetFloor(event.target.value)}
          />
          <button
            type="button"
            className="cr2-admin-console__action"
            onClick={() => adminJumpToFloor(targetFloor)}
          >
            층 이동
          </button>
        </div>
      </label>

      <div className="cr2-admin-console__actions">
        <button
          type="button"
          className="cr2-admin-console__action"
          onClick={() => adminGrantCapital(50000000)}
        >
          현금 +5천만
        </button>
        <button
          type="button"
          className="cr2-admin-console__action"
          onClick={() => adminGrantCredits(500)}
        >
          크레딧 +500C
        </button>
        <button
          type="button"
          className="cr2-admin-console__action"
          onClick={adminHealCompany}
        >
          체력 풀회복
        </button>
        <button
          type="button"
          className="cr2-admin-console__action"
          onClick={goToAdvisorSelect}
        >
          어드바이저 화면
        </button>
      </div>
    </aside>
  )
}
