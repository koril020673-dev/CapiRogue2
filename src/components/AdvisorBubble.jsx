import './AdvisorBubble.css'
import { ADVISORS } from '../constants/advisors.js'
import { useGameStore } from '../store/useGameStore.js'

const ADVISOR_LINES = {
  analyst: {
    normal: '수치 정리는 끝났습니다. 전략과 발주를 먼저 확정하세요.',
    war: '전쟁 구간입니다. 점유율과 원가를 동시에 봐야 합니다.',
  },
  trader: {
    normal: '타이밍이 중요합니다. 망설이면 시장을 뺏깁니다.',
    war: '지금은 밀어붙일 때입니다. 주도권을 넘기지 마세요.',
  },
  strategist: {
    normal: '한 수 앞을 보고 움직이세요. 안정도 전력입니다.',
    war: '교전이 길어질수록 운영력이 중요해집니다.',
  },
  quant: {
    normal: '확률은 이미 기울었습니다. 비효율만 피하면 됩니다.',
    war: '수익과 점유율을 동시에 최대화할 창을 찾으세요.',
  },
  auditor: {
    normal: '현금흐름을 먼저 보세요. 무리한 확장은 숫자가 막습니다.',
    war: '적자 라운드는 치명적입니다. 고정비를 항상 계산하세요.',
  },
  economist: {
    normal: '국면 변화에 맞춰 발주 강도를 조절하세요.',
    war: '거시 환경이 흔들리면 공격보다 생존이 먼저입니다.',
  },
  venture: {
    normal: '리스크를 감수할 가치가 있는지부터 따져봅시다.',
    war: '지금은 겁낼 때가 아닙니다. 승부를 걸 구간을 잡으세요.',
  },
  arbitrageur: {
    normal: '차이를 먹는 게임입니다. 국면 변화가 기회가 됩니다.',
    war: '상대의 빈틈은 짧게 열립니다. 정확히 찌르세요.',
  },
  actuary: {
    normal: '최악의 경우를 버틸 수 있으면 선택권이 생깁니다.',
    war: '체력과 현금이 버텨야 다음 수가 있습니다.',
  },
  sovereign: {
    normal: '균형을 잡으면 어떤 시장에서도 무너지지 않습니다.',
    war: '장기전은 준비된 쪽이 이깁니다. 흔들리지 마세요.',
  },
}

export function AdvisorBubble() {
  const advisor = useGameStore((state) => state.advisor)
  const activeEconomicWar = useGameStore((state) => state.activeEconomicWar)
  const info = ADVISORS[advisor]

  if (!info) {
    return null
  }

  const line =
    ADVISOR_LINES[advisor]?.[activeEconomicWar ? 'war' : 'normal'] ??
    '이번 턴의 선택이 시장 흐름을 크게 바꿀 수 있습니다.'

  return (
    <div className="cr2-advisor-bubble" style={{ '--cr2-advisor-color': info.themeColor }}>
      <span className="cr2-advisor-bubble__icon">{info.icon}</span>
      <div className="cr2-advisor-bubble__body">
        <strong>{info.name}</strong>
        <p>{line}</p>
      </div>
    </div>
  )
}
