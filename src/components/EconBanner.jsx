import './EconBanner.css'
import { useGameStore } from '../store/useGameStore.js'

const PHASE_DISPLAY = {
  boom: { label: '호황', icon: '▲', tone: 'boom' },
  growth: { label: '성장', icon: '◆', tone: 'growth' },
  stable: { label: '평시', icon: '■', tone: 'stable' },
  contraction: { label: '위축', icon: '▼', tone: 'contraction' },
  recession: { label: '불황', icon: '⚠', tone: 'recession' },
}

const PHASE_COPY = {
  boom: '수요가 강합니다. 점유율 확대를 노려볼 수 있습니다.',
  growth: '시장 확장이 이어집니다. 공격과 안정의 균형이 좋습니다.',
  stable: '표준 국면입니다. 비용 통제와 발주 정밀도가 중요합니다.',
  contraction: '수요 둔화가 시작됩니다. 재고와 현금을 더 보수적으로 보세요.',
  recession: '생존 우선 구간입니다. 과한 물량 베팅은 위험합니다.',
}

export function EconBanner() {
  const econPhase = useGameStore((state) => state.econPhase)
  const activeBlackSwan = useGameStore((state) => state.activeBlackSwan)
  const display = PHASE_DISPLAY[econPhase] ?? PHASE_DISPLAY.stable

  return (
    <div className="cr2-econ-banner" data-phase={display.tone}>
      <span className="cr2-econ-banner__icon">{display.icon}</span>
      <span className="cr2-econ-banner__label">{display.label}</span>
      <span className="cr2-econ-banner__copy">{activeBlackSwan?.hint ?? PHASE_COPY[econPhase]}</span>
    </div>
  )
}
