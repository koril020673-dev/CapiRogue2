import { useMemo } from 'react'
import './TitleScreen.css'
import startSceneA from '../../startSceneImage/Gemini_Generated_Image_73czcg73czcg73cz.png'
import startSceneB from '../../startSceneImage/Gemini_Generated_Image_zftcg2zftcg2zftc.png'
import { useGameStore } from '../store/useGameStore.js'

const START_SCENE_VARIANTS = [
  {
    id: 'summit',
    image: startSceneA,
    imagePosition: 'center center',
    theme: {
      background: 'linear-gradient(180deg, #05060b 0%, #271e31 32%, #5b465f 58%, #16111a 100%)',
      glowA: 'rgba(248, 194, 97, 0.34)',
      glowB: 'rgba(130, 109, 162, 0.24)',
      glowC: 'rgba(237, 160, 78, 0.18)',
      heroSurface: 'rgba(17, 13, 22, 0.54)',
      heroTint: 'rgba(105, 77, 110, 0.18)',
      menuSurface: 'rgba(24, 18, 31, 0.72)',
      cardSurface: 'rgba(33, 26, 42, 0.72)',
      skylineBleed: 'rgba(245, 182, 84, 0.22)',
      skylineGlowA: 'rgba(244, 180, 87, 0.30)',
      skylineGlowB: 'rgba(145, 128, 184, 0.18)',
      textStrong: 'rgba(255, 244, 228, 0.98)',
      textSoft: 'rgba(232, 220, 209, 0.72)',
      accent: '#f5b454',
    },
  },
  {
    id: 'logo-wall',
    image: startSceneB,
    imagePosition: 'center center',
    theme: {
      background: 'linear-gradient(180deg, #05060a 0%, #17131f 26%, #3d304a 56%, #130f18 100%)',
      glowA: 'rgba(255, 191, 88, 0.30)',
      glowB: 'rgba(124, 111, 177, 0.22)',
      glowC: 'rgba(247, 144, 58, 0.16)',
      heroSurface: 'rgba(14, 12, 19, 0.58)',
      heroTint: 'rgba(89, 69, 112, 0.18)',
      menuSurface: 'rgba(20, 16, 27, 0.78)',
      cardSurface: 'rgba(31, 24, 39, 0.74)',
      skylineBleed: 'rgba(247, 171, 67, 0.20)',
      skylineGlowA: 'rgba(245, 176, 76, 0.28)',
      skylineGlowB: 'rgba(116, 104, 168, 0.20)',
      textStrong: 'rgba(255, 245, 229, 0.98)',
      textSoft: 'rgba(219, 208, 221, 0.72)',
      accent: '#f4b04d',
    },
  },
]

function MenuButton({ disabled = false, label, sublabel, onClick }) {
  return (
    <button
      type="button"
      className="cr2-title-scene__menu-btn"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="cr2-title-scene__menu-label">{label}</span>
      <span className="cr2-title-scene__menu-sublabel">{sublabel}</span>
    </button>
  )
}

export function TitleScreen() {
  const auth = useGameStore((state) => state.auth)
  const saveExists = useGameStore((state) => state.saveExists)
  const continueRun = useGameStore((state) => state.continueRun)
  const startNewGame = useGameStore((state) => state.startNewGame)
  const openHistoryScreen = useGameStore((state) => state.openHistoryScreen)
  const openSettingsScreen = useGameStore((state) => state.openSettingsScreen)
  const logout = useGameStore((state) => state.logout)

  const activeStartScene = useMemo(
    () => START_SCENE_VARIANTS[Math.floor(Math.random() * START_SCENE_VARIANTS.length)],
    [],
  )

  const sceneStyle = {
    '--cr2-title-background': activeStartScene.theme.background,
    '--cr2-title-glow-a': activeStartScene.theme.glowA,
    '--cr2-title-glow-b': activeStartScene.theme.glowB,
    '--cr2-title-glow-c': activeStartScene.theme.glowC,
    '--cr2-title-hero-surface': activeStartScene.theme.heroSurface,
    '--cr2-title-hero-tint': activeStartScene.theme.heroTint,
    '--cr2-title-menu-surface': activeStartScene.theme.menuSurface,
    '--cr2-title-card-surface': activeStartScene.theme.cardSurface,
    '--cr2-title-image-bleed': activeStartScene.theme.skylineBleed,
    '--cr2-title-image-glow-a': activeStartScene.theme.skylineGlowA,
    '--cr2-title-image-glow-b': activeStartScene.theme.skylineGlowB,
    '--cr2-title-text-strong': activeStartScene.theme.textStrong,
    '--cr2-title-text-soft': activeStartScene.theme.textSoft,
    '--cr2-title-accent': activeStartScene.theme.accent,
  }

  return (
    <main className="cr2-title-scene" style={sceneStyle}>
      <div className="cr2-title-scene__backdrop" />

      <div className="cr2-title-scene__shell">
        <section className="cr2-title-scene__hero">
          <div className="cr2-title-scene__skyline">
            <img
              className="cr2-title-scene__skyline-image"
              src={activeStartScene.image}
              alt="CapiRogue 2 opening key art"
              style={{ objectPosition: activeStartScene.imagePosition }}
            />
            <span className="cr2-title-scene__skyline-shade" />
            <span className="cr2-title-scene__skyline-glow" />
            <span className="cr2-title-scene__skyline-frame" />
          </div>

          <div className="cr2-title-scene__brand">
            <p className="cr2-title-scene__eyebrow">Economic Survival Roguelike</p>
            <h1>CapiRogue 2</h1>
            <p className="cr2-title-scene__subtitle">경제 생존 로그라이크</p>
            <p className="cr2-title-scene__flavor">
              무너지는 시장 안에서 버티고 확장하며, 경쟁사의 압박을 넘어 끝까지 살아남으세요.
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
              <strong>{saveExists ? '이어하기 가능' : '새 게임 필요'}</strong>
            </div>
          </div>
        </section>

        <aside className="cr2-title-scene__menu-panel">
          <div className="cr2-title-scene__menu-head">
            <div className="cr2-title-scene__account">
              <div className="cr2-title-scene__account-copy">
                <span className="cr2-title-scene__account-label">Signed In</span>
                <strong>{auth?.userId || 'Guest'}</strong>
              </div>

              <div className="cr2-title-scene__account-actions">
                {auth?.isAdmin ? (
                  <span className="cr2-title-scene__account-badge">ADMIN MODE</span>
                ) : null}
                <button
                  type="button"
                  className="cr2-title-scene__logout"
                  onClick={logout}
                >
                  로그아웃
                </button>
              </div>
            </div>

            <p className="cr2-title-scene__menu-kicker">Main Menu</p>
            <h2>시작 화면</h2>
          </div>

          <div className="cr2-title-scene__menu-list">
            <MenuButton
              disabled={!saveExists}
              label="계속하기"
              sublabel="가장 최근 저장한 런으로 바로 복귀합니다."
              onClick={continueRun}
            />
            <MenuButton
              label="새 게임"
              sublabel="어드바이저를 선택하고 새로운 런을 시작합니다."
              onClick={startNewGame}
            />
            <MenuButton
              label="플레이 이력"
              sublabel="이전 런의 결과와 유산 카드 기록을 확인합니다."
              onClick={openHistoryScreen}
            />
            <MenuButton
              label="설정"
              sublabel="사운드와 텍스트, 인터페이스 옵션을 조정합니다."
              onClick={openSettingsScreen}
            />
          </div>

          <div className="cr2-title-scene__menu-foot">
            <span>v2 Rebuild</span>
            <span>{auth?.isAdmin ? 'Admin Sandbox Ready' : 'Random Key Art'}</span>
          </div>
        </aside>
      </div>
    </main>
  )
}
