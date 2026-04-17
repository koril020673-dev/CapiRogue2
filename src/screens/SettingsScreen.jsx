import './SettingsScreen.css'
import { useGameStore } from '../store/useGameStore.js'

export function SettingsScreen() {
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const backToTitle = useGameStore((state) => state.backToTitle)

  return (
    <main className="cr2-settings-screen">
      <div className="cr2-settings-screen__panel">
        <div className="cr2-settings-screen__head">
          <div>
            <p className="cr2-settings-screen__eyebrow">Settings</p>
            <h1>설정</h1>
          </div>
          <button type="button" onClick={backToTitle}>
            돌아가기
          </button>
        </div>

        <label className="cr2-settings-screen__row">
          <span>배경음악 볼륨</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.bgmVolume}
            onChange={(event) => updateSettings({ bgmVolume: Number(event.target.value) })}
          />
          <strong>{Math.round(settings.bgmVolume * 100)}%</strong>
        </label>

        <label className="cr2-settings-screen__row">
          <span>효과음 볼륨</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.sfxVolume}
            onChange={(event) => updateSettings({ sfxVolume: Number(event.target.value) })}
          />
          <strong>{Math.round(settings.sfxVolume * 100)}%</strong>
        </label>

        <div className="cr2-settings-screen__row">
          <span>글자 크기</span>
          <div className="cr2-settings-screen__chips">
            {['small', 'medium', 'large'].map((value) => (
              <button
                key={value}
                type="button"
                data-selected={settings.fontSize === value}
                onClick={() => updateSettings({ fontSize: value })}
              >
                {value === 'small' ? '작음' : value === 'medium' ? '중간' : '큼'}
              </button>
            ))}
          </div>
        </div>

        <div className="cr2-settings-screen__row">
          <span>텍스트 속도</span>
          <div className="cr2-settings-screen__chips">
            {['slow', 'normal', 'fast', 'instant'].map((value) => (
              <button
                key={value}
                type="button"
                data-selected={settings.textSpeed === value}
                onClick={() => updateSettings({ textSpeed: value })}
              >
                {value === 'slow'
                  ? '느림'
                  : value === 'normal'
                    ? '보통'
                    : value === 'fast'
                      ? '빠름'
                      : '즉시'}
              </button>
            ))}
          </div>
        </div>

        <div className="cr2-settings-screen__row">
          <span>숫자 애니메이션</span>
          <div className="cr2-settings-screen__chips">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                data-selected={settings.numAnimation === value}
                onClick={() => updateSettings({ numAnimation: value })}
              >
                {value ? 'ON' : 'OFF'}
              </button>
            ))}
          </div>
        </div>

        <div className="cr2-settings-screen__row">
          <span>조작 힌트</span>
          <div className="cr2-settings-screen__chips">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                data-selected={settings.uiHints === value}
                onClick={() => updateSettings({ uiHints: value })}
              >
                {value ? 'ON' : 'OFF'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
