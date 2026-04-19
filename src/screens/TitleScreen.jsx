import './TitleScreen.css'
import { useGameStore } from '../store/useGameStore.js'

function MenuButton({ disabled = false, label, sublabel, onClick }) {
  return (
    <button type="button" className="cr2-title-scene__menu-btn" disabled={disabled} onClick={onClick}>
      <span className="cr2-title-scene__menu-label">{label}</span>
      <span className="cr2-title-scene__menu-sublabel">{sublabel}</span>
    </button>
  )
}

export function TitleScreen() {
  const saveExists = useGameStore((state) => state.saveExists)
  const continueRun = useGameStore((state) => state.continueRun)
  const startNewGame = useGameStore((state) => state.startNewGame)
  const openHistoryScreen = useGameStore((state) => state.openHistoryScreen)
  const openSettingsScreen = useGameStore((state) => state.openSettingsScreen)

  return (
    <main className="cr2-title-scene">
      <div className="cr2-title-scene__backdrop" />

      <div className="cr2-title-scene__shell">
        <section className="cr2-title-scene__hero">
          <div className="cr2-title-scene__skyline">
            <span className="cr2-title-scene__sun" />
            <span className="cr2-title-scene__cloud cr2-title-scene__cloud--a" />
            <span className="cr2-title-scene__cloud cr2-title-scene__cloud--b" />
            <span className="cr2-title-scene__cloud cr2-title-scene__cloud--c" />
            <span className="cr2-title-scene__ridge cr2-title-scene__ridge--far" />
            <span className="cr2-title-scene__ridge cr2-title-scene__ridge--mid" />
            <span className="cr2-title-scene__ridge cr2-title-scene__ridge--near" />
          </div>

          <div className="cr2-title-scene__brand">
            <p className="cr2-title-scene__eyebrow">Economic Survival Roguelike</p>
            <h1>CapiRogue 2</h1>
            <p className="cr2-title-scene__subtitle">경제 생존 로그라이크</p>
            <p className="cr2-title-scene__flavor">
              무너지는 시장 위에서 버티고, 확장하고, 결국 판을 뒤집으세요.
            </p>
          </div>

          <div className="cr2-title-scene__hud">
            <div>
              <span>Run Format</span>
              <strong>120 Floors</strong>
            </div>
            <div>
              <span>Core Loop</span>
              <strong>전략 · 발주 · 결재</strong>
            </div>
            <div>
              <span>Current Save</span>
              <strong>{saveExists ? '이어하기 가능' : '새 런 시작 가능'}</strong>
            </div>
          </div>
        </section>

        <aside className="cr2-title-scene__menu-panel">
          <div className="cr2-title-scene__menu-head">
            <p className="cr2-title-scene__menu-kicker">Main Menu</p>
            <h2>시작 화면</h2>
          </div>

          <div className="cr2-title-scene__menu-list">
            <MenuButton
              disabled={!saveExists}
              label="계속하기"
              sublabel="가장 최근 저장된 런으로 복귀합니다"
              onClick={continueRun}
            />
            <MenuButton
              label="새 게임"
              sublabel="어드바이저를 고르고 새로운 런을 시작합니다"
              onClick={startNewGame}
            />
            <MenuButton
              label="플레이 이력"
              sublabel="이전 런의 결과와 유산 카드를 확인합니다"
              onClick={openHistoryScreen}
            />
            <MenuButton
              label="설정"
              sublabel="사운드, 텍스트, 인터페이스 옵션을 조정합니다"
              onClick={openSettingsScreen}
            />
          </div>

          <div className="cr2-title-scene__menu-foot">
            <span>v2 Rebuild</span>
            <span>Single Save Slot</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
